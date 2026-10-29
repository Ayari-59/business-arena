import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  coutVariable,
  grille,
  meilleurTarif,
  prixDeNova,
  segmentation as segmenter,
  tarifLePlusBasSansPerte,
  tarifReserve,
  type Segment,
} from "../monde/economie-et-marketing";
import { ENTREPRISES_DU_MARCHE_DE_NOVA, POURQUOI_LE_MARCHE_DE_NOVA, mercatiqueDe } from "../monde/mercatique-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : SEGMENTER ET CIBLER (Bac STMG, mercatique, palier 1).
 *
 * Un marché n'est pas un bloc : il se découpe en clientèles qui n'attendent pas la même chose. Le
 * chapitre lit les trois clientèles de NOVA (leur taille, ce qu'elles demandent à NOVA, ce qu'elles
 * rapportent, le prix qu'elles jugent normal), calcule le poids de chacune et la part de marché qu'on
 * y tient, puis compare ce qui les fait acheter (le prix, la qualité, la publicité) pour choisir une
 * cible selon l'offre. Puis l'expérience : un tarif réservé aux étudiants, la clientèle la plus
 * sensible au prix. Le curseur cherche jusqu'où le baisser sans perdre de marge ; le laboratoire, le
 * tarif qui en laisse le plus.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/mercatique-de-nova.ts) : les trois clientèles de la
 * fiche, dont les droites s'additionnent en celle de NOVA (17 700 − 203 × prix enceintes par
 * trimestre), la taille de chaque segment au premier trimestre (18 100 enceintes en tout), le prix de
 * 59 € et le coût variable de 38 €.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait les clientèles de l'arène chez cinq entreprises ; il se joue
 * chez NOVA seule, sur ses trois clientèles.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const SEGMENTATIONS: readonly string[] = ENTREPRISES_DU_MARCHE_DE_NOVA;

/** La clientèle du tarif réservé : la plus sensible au prix, les étudiants. */
const CIBLE_DU_TARIF = "etudiants" as const;

/** Les bornes du curseur (à l'euro) et du laboratoire (au demi-euro) : le tarif réservé. */
const TARIF_DU_CURSEUR = { min: 45, max: 62 } as const;
const TARIF_DU_LABORATOIRE = { min: 50, max: 59, pas: 0.5 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

const f = (c: Cas) => mercatiqueDe(c);

/** Les clientèles du premier trimestre, et les cibles que leurs sensibilités désignent. */
export const segmentation = (c: Cas) => segmenter(f(c));

/** Ce que chaque segment est pour l'entreprise, un segment par phrase, ses rôles réunis. */
function rolesParSegment(g: ReturnType<typeof segmentation>) {
  const roles: [Segment, string][] = [
    [g.plusGrosse, "pèse le plus lourd"],
    [g.reserve, "garde le plus de clients à gagner"],
    [g.premium, "est la cible d'une offre haut de gamme"],
    [g.promotion, "est la cible d'une promotion"],
  ];
  const parSegment = new Map<string, { nom: string; roles: string[] }>();
  for (const [k, r] of roles) parSegment.set(k.code, { nom: k.nom, roles: [...(parSegment.get(k.code)?.roles ?? []), r] });
  return [...parSegment.values()].map(({ nom, roles: rs }) => `« ${nom} » ${rs.length === 1 ? rs[0] : `${rs.slice(0, -1).join(", ")} et ${rs.at(-1)}`}`);
}

/** Le meilleur tarif réservé, au demi-euro. */
export const tarifDuLaboratoire = (c: Cas) => meilleurTarif(f(c), CIBLE_DU_TARIF, grille(TARIF_DU_LABORATOIRE.min, TARIF_DU_LABORATOIRE.max, TARIF_DU_LABORATOIRE.pas));

export const SEGMENTER_ET_CIBLER: Chapitre = {
  code: "segmenter-et-cibler",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 1 · La définition de l'offre", "BUT TC · Conduire les actions marketing", "BUT GACO · Concevoir la démarche marketing"],
  titre: "Segmenter et cibler",
  accroche:
    "Un marché se découpe en clientèles qui n'attendent pas la même chose. Lesquelles pèsent le plus, où reste-t-il des clients à gagner, et laquelle viser selon l'offre ?",
  objectifs: [
    "Lire les segments d'un marché",
    "Calculer le poids d'un segment et la part de marché qu'on y tient",
    "Comparer ce qui fait acheter chaque segment : le prix, la qualité, la publicité",
    "Choisir une cible selon l'offre",
  ],
  libre: false,
  entreprises: { codes: SEGMENTATIONS, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Les clientèles du marché",
      notions: ["segmentation"],
      texte: (c) => {
        const g = segmentation(c);
        return [
          `Le marché ${dE(c.entreprise)} n'est pas un bloc : il se découpe en ${g.clienteles.length} clientèles, des segments qui n'achètent pas pour les mêmes raisons ni au même prix.`,
          `Le tableau donne, pour le premier trimestre, la taille de chaque segment (ce qu'il a acheté à tous les vendeurs), ce qu'il demande à ${c.entreprise} à son prix de ${eur(prixDeNova(f(c)))}, ce que cela lui rapporte, et le prix qu'il juge normal.`,
        ];
      },
      tableau: (c) => {
        const g = segmentation(c);
        return {
          titre: "Les segments, premier trimestre",
          colonnes: g.clienteles.map((k) => k.nom),
          lignes: [
            { libelle: `Taille du segment (${c.unites})`, valeurs: g.clienteles.map((k) => qte(k.taille)) },
            { libelle: `Demande reçue par ${c.entreprise}`, valeurs: g.clienteles.map((k) => qte(k.demande)) },
            { libelle: "Chiffre d'affaires", valeurs: g.clienteles.map((k) => eur(k.chiffreDAffaires)) },
            { libelle: "Prix jugé normal", valeurs: g.clienteles.map((k) => eur(k.prixNormal)) },
          ],
        };
      },
      repere: () => "Poids d'un segment = son chiffre d'affaires ÷ le chiffre d'affaires total × 100. Part de marché dans un segment = ventes ÷ taille du segment × 100.",
    },
    {
      id: "poids",
      objectifs: [1],
      type: "montants",
      titre: "Le poids d'un segment",
      notions: ["segmentation", "demand_market_share"],
      question: (c) => {
        const g = segmentation(c);
        const k = g.plusGrosse;
        return `Le segment « ${k.nom} » rapporte ${eur(k.chiffreDAffaires)} sur ${eur(g.chiffreDAffaires)}. Calculez son poids dans le chiffre d'affaires, puis la part de marché que l'entreprise y tient (${qte(k.demande)} ventes sur ${qte(k.taille)}), en pourcentage au dixième, et le nombre d'achats du segment qui vont à d'autres vendeurs.`;
      },
      champs: (c) => {
        const g = segmentation(c);
        const k = g.plusGrosse;
        return [
          { libelle: "Poids du segment (%)", attendu: k.poids, calcul: `${eur(k.chiffreDAffaires)} ÷ ${eur(g.chiffreDAffaires)} × 100 = ${pct(k.poids)}`, tolerance: 0.1 },
          { libelle: "Part de marché dans le segment (%)", attendu: k.part, calcul: `${qte(k.demande)} ÷ ${qte(k.taille)} × 100 = ${pct(k.part)}`, tolerance: 0.1 },
          { libelle: "Achats du segment faits ailleurs", attendu: k.aGagner, calcul: `${qte(k.taille)} − ${qte(k.demande)} = ${qte(k.aGagner)}` },
        ];
      },
      explication: (c) => {
        const k = segmentation(c).plusGrosse;
        return [
          `Le segment « ${k.nom} » fait ${pct(k.poids)} du chiffre d'affaires : c'est le cœur de clientèle ${dE(c.entreprise)}. Pourtant l'entreprise n'y tient que ${pct(k.part)} du marché : ${qte(k.aGagner)} achats sont allés ailleurs.`,
        ];
      },
    },
    {
      id: "reserve",
      objectifs: [0, 1],
      type: "choix",
      titre: "Où sont les clients à gagner",
      notions: ["segmentation"],
      question: (c) => `Dans quel segment ${c.entreprise} a-t-elle le plus de clients à gagner, c'est-à-dire le plus d'achats faits chez d'autres vendeurs ?`,
      options: (c) => {
        const g = segmentation(c);
        return g.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === g.reserve.code,
          retour:
            k.code === g.reserve.code
              ? `Oui : ${qte(k.taille)} achats, dont ${qte(k.demande)} chez ${c.entreprise}, soit ${qte(k.aGagner)} à gagner. C'est le segment où une action commerciale a le plus de place pour grandir.`
              : `Non : ${qte(k.aGagner)} achats à gagner, contre ${qte(g.reserve.aGagner)} dans le segment « ${g.reserve.nom} ».`,
        }));
      },
    },
    {
      id: "sensibilites",
      type: "lecture",
      titre: "Ce qui fait acheter chaque segment",
      notions: ["segmentation", "price_elasticity"],
      texte: (c) => {
        const g = segmentation(c);
        return [
          `Chaque segment réagit à sa façon. Si ${c.entreprise} montait son prix de ${g.ecart} %, certains partiraient beaucoup, d'autres presque pas. De même, certains choisissent sur la qualité, d'autres se laissent convaincre par la publicité.`,
          "Le tableau range ces sensibilités : c'est ce qui permet de choisir une cible selon l'offre qu'on veut lui faire.",
        ];
      },
      tableau: (c) => {
        const g = segmentation(c);
        return {
          titre: "Les sensibilités de chaque segment",
          colonnes: g.clienteles.map((k) => k.nom),
          lignes: [
            { libelle: `Demande perdue si le prix monte de ${g.ecart} %`, valeurs: g.clienteles.map((k) => pct(k.sensibilitePrix)) },
            { libelle: "Sensibilité à la qualité", valeurs: g.clienteles.map((k) => k.qualite) },
            { libelle: "Sensibilité à la publicité", valeurs: g.clienteles.map((k) => k.publicite) },
          ],
        };
      },
    },
    {
      id: "cible-premium",
      objectifs: [2, 3],
      type: "choix",
      titre: "Une cible pour une offre haut de gamme",
      notions: ["segmentation", "price_elasticity"],
      question: (c) => `${c.entreprise} imagine une offre haut de gamme : meilleure qualité, prix plus élevé. Quel segment cibler en priorité ?`,
      options: (c) => {
        const g = segmentation(c);
        return g.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === g.premium.code,
          retour:
            k.code === g.premium.code
              ? `Oui : c'est le segment le plus sensible à la qualité, et une hausse de prix de ${g.ecart} % ne lui ferait perdre que ${pct(k.sensibilitePrix)} de sa demande. Il paie pour mieux, et juge normal un prix de ${eur(k.prixNormal)}.`
              : `Non : ce segment est moins sensible à la qualité que « ${g.premium.nom} », et perdrait ${pct(k.sensibilitePrix)} de sa demande pour ${g.ecart} % de hausse.`,
        }));
      },
    },
    {
      id: "cible-promotion",
      objectifs: [2, 3],
      type: "choix",
      titre: "Une cible pour une promotion",
      notions: ["segmentation", "price_elasticity"],
      question: (c) => `${c.entreprise} prépare une promotion : un prix baissé pendant quelques semaines. Quel segment réagira le plus ?`,
      options: (c) => {
        const g = segmentation(c);
        return g.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === g.promotion.code,
          retour:
            k.code === g.promotion.code
              ? `Oui : c'est le segment le plus sensible au prix. Une hausse de ${g.ecart} % lui ferait perdre ${pct(k.sensibilitePrix)} de sa demande ; une baisse l'attire autant. Une promotion vise ce segment, et coûte cher si elle est offerte à ceux qui auraient acheté de toute façon.`
              : `Non : ce segment réagit moins au prix (${pct(k.sensibilitePrix)} de demande perdue pour ${g.ecart} % de hausse) que « ${g.promotion.nom} » (${pct(g.promotion.sensibilitePrix)}).`,
        }));
      },
    },
    {
      id: "le-tarif-etudiant",
      objectifs: [2],
      type: "curseur",
      titre: "Un tarif pour les étudiants",
      notions: ["segmentation", "contribution_margin"],
      question: (c) => {
        const t = tarifReserve(f(c), CIBLE_DU_TARIF, prixDeNova(f(c)));
        return `${c.entreprise} veut offrir un tarif réservé aux étudiants, sur présentation de leur carte. À ${eur(t.prix)}, ils lui demandent ${qte(t.demande)} ${c.unites} par trimestre, qui laissent ${eur(t.marge)} de marge (le prix moins ${eur(coutVariable(f(c)))} de coût variable, fois les ventes). Faites varier le tarif, à l'euro : une courbe donne la marge du segment à ce tarif, l'autre la marge d'aujourd'hui. Placez le curseur sur le tarif le plus bas qui garde au moins la marge d'aujourd'hui, puis validez.`;
      },
      grandeur: () => ({ libelle: "Tarif étudiant", unite: "€" }),
      cible: (c) => ({ attendu: tarifLePlusBasSansPerte(f(c), CIBLE_DU_TARIF), ...TARIF_DU_CURSEUR }),
      zones: ["Le tarif garde la marge", "Le tarif fait perdre de la marge"],
      rates: () => ({
        dessous: "À ce tarif, les étudiants en plus ne compensent pas ce que chaque vente perd : la marge baisse.",
        dessus: "Ce tarif garde la marge, mais un tarif plus bas la garderait aussi : cherchez le plus bas.",
      }),
      montrer: "Montrer le tarif",
      lecture: (c, q) => {
        const t = tarifReserve(f(c), CIBLE_DU_TARIF, q);
        return [
          { libelle: "Chiffre d'affaires du segment", montant: t.demande * q },
          { libelle: "Marge du segment à ce tarif", montant: t.marge, fort: true },
          { libelle: "Marge du segment aujourd'hui", montant: tarifReserve(f(c), CIBLE_DU_TARIF, prixDeNova(f(c))).marge },
        ];
      },
      droites: (c) => ({
        produit: (q) => tarifReserve(f(c), CIBLE_DU_TARIF, q).marge,
        cout: () => tarifReserve(f(c), CIBLE_DU_TARIF, prixDeNova(f(c))).marge,
        libelles: ["Marge du segment à ce tarif", "Marge d'aujourd'hui"],
      }),
      explication: (c) => {
        const p = tarifLePlusBasSansPerte(f(c), CIBLE_DU_TARIF);
        const a = tarifReserve(f(c), CIBLE_DU_TARIF, p);
        const b = tarifReserve(f(c), CIBLE_DU_TARIF, p - 1);
        return [
          `À ${eur(p)}, les étudiants demandent ${qte(a.demande)} ${c.unites} : ${eur(a.marge)} de marge, autant ou plus qu'aujourd'hui. À ${eur(p - 1)}, ${qte(b.demande)} ${c.unites} ne laissent que ${eur(b.marge)}.`,
          "Un segment très sensible au prix répond fort à une baisse : un tarif réservé peut gagner des clients sans perdre de marge, tant que les autres clientèles paient le prix normal.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-tarif",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du tarif étudiant",
      notions: ["segmentation", "contribution_margin"],
      question: () => "Faites varier le tarif étudiant, au demi-euro, et relevez le défi : les autres clientèles paient le prix normal.",
      leviers: (c) => [{ code: "tarif", libelle: "Tarif étudiant", unite: "€", ...TARIF_DU_LABORATOIRE, depart: prixDeNova(f(c)) }],
      lecture: (c, p) => {
        const t = tarifReserve(f(c), CIBLE_DU_TARIF, p.tarif!);
        const d = tarifReserve(f(c), CIBLE_DU_TARIF, prixDeNova(f(c)));
        return [
          { libelle: "Étudiants servis", montant: t.demande, unite: c.unites, reference: d.demande },
          { libelle: "Marge sur une enceinte", montant: p.tarif! - coutVariable(f(c)), reference: d.prix - coutVariable(f(c)) },
          { libelle: "Marge du segment", montant: t.marge, reference: d.marge, fort: true },
        ];
      },
      graphique: (c) => ({ levier: "tarif", courbes: [{ libelle: "Marge du segment", valeur: (p) => tarifReserve(f(c), CIBLE_DU_TARIF, p.tarif!).marge }] }),
      defi: (c) => {
        const juste = tarifDuLaboratoire(c);
        return {
          consigne: "Trouvez le tarif étudiant qui laisse la plus grande marge sur le segment.",
          atteint: (p) => p.tarif === juste.prix,
          indice: (p) => {
            const t = tarifReserve(f(c), CIBLE_DU_TARIF, p.tarif!);
            const plus = tarifReserve(f(c), CIBLE_DU_TARIF, p.tarif! + TARIF_DU_LABORATOIRE.pas);
            return plus.marge > t.marge
              ? `À ${eur(t.prix)}, la marge est de ${eur(t.marge)} ; un tarif un peu plus haut en laisserait plus.`
              : `À ${eur(t.prix)}, la marge est de ${eur(t.marge)} ; un tarif un peu plus bas en laisserait-il plus ?`;
          },
          solution: { tarif: juste.prix },
        };
      },
      explication: (c, p) => {
        const t = tarifReserve(f(c), CIBLE_DU_TARIF, p.tarif!);
        const d = tarifReserve(f(c), CIBLE_DU_TARIF, prixDeNova(f(c)));
        return [
          `Défi relevé : à ${eur(t.prix)}, ${qte(t.demande)} étudiants achètent, et le segment laisse ${eur(t.marge)} de marge, ${eur(t.marge - d.marge)} de plus qu'au prix normal.`,
          "Cibler, c'est aussi faire une offre à chaque segment : le même produit, à un prix qui parle à la clientèle visée.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["segmentation"],
      texte: (c) => {
        const g = segmentation(c);
        return [
          `Chez ${c.entreprise}, ${rolesParSegment(g).join(" ; ")}.`,
          "Segmenter, c'est découper le marché en groupes qui achètent pour les mêmes raisons ; cibler, c'est choisir ceux qu'on veut servir ; positionner, c'est leur faire une offre qui leur parle. Dans l'arène, le marché du tour donne les ventes de chaque clientèle.",
        ];
      },
      repere: () => "Segmenter : découper le marché en groupes homogènes. Cibler : choisir les segments à servir. Positionner : construire l'offre qui leur parle.",
    },
  ],
};
