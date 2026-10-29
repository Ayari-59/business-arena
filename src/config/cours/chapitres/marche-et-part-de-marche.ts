import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { ENTREPRISES_DU_COURS } from "../metiers";
import { marcheEtPart as lireLeMarche, partDe, prixDeNova, ventesPourLaPart } from "../monde/economie-et-marketing";
import { ENTREPRISES_DU_MARCHE_DE_NOVA, POURQUOI_LE_MARCHE_DE_NOVA, mercatiqueDe } from "../monde/mercatique-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE MARCHÉ ET LA PART DE MARCHÉ (Bac STMG, mercatique, palier 1).
 *
 * La première question du mercaticien : combien pèse le marché, et quelle place l'entreprise y tient
 * face à ses concurrents. La taille du marché, la part de marché de NOVA et du leader, la part
 * relative, le prix de chacun ; puis le semestre : le marché grandit, la part de marché recule si les
 * ventes ne suivent pas. Puis l'expérience : un curseur (les ventes qui tiennent le seuil d'alerte du
 * tableau de bord) et un laboratoire (les ventes qui gardent la part du premier trimestre).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/economie-et-marketing.ts) : le marché de toutes les
 * enceintes et les ventes de NOVA, mois par mois, de nova-gestion.ts (18 100 enceintes et 4 778 pour
 * NOVA de janvier à mars, 24 900 et 6 081 d'avril à juin), le seuil d'alerte de la part de marché du
 * tableau de bord (25 %). HYPOTHÈSE DU COURS : SoundBox et Auris vendent, face à NOVA, dans les
 * proportions de l'année type du marché à trois (monde/marche-a-trois.ts), à leurs prix (51 € et 79 €).
 *
 * CE QUI A CHANGÉ. Le chapitre lisait le premier et le dernier trimestre de l'arène chez cinq
 * entreprises ; il se joue chez NOVA seule, sur le semestre du monde du cours.
 */

/**
 * Les entreprises dont le marché se compte en ventes : toutes celles du cours, sauf VOLT FITNESS, dont
 * le marché se compte d'abord en abonnés gardés. Gardé pour les chapitres qui le lisent encore (le
 * diagnostic, les objectifs, l'indicateur juste) ; le chapitre, lui, se joue chez NOVA.
 */
export const MARCHES: readonly string[] = ENTREPRISES_DU_COURS.filter((code) => code !== "fitness");

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DE_LA_PART_DE_MARCHE: readonly string[] = ENTREPRISES_DU_MARCHE_DE_NOVA;

/** Le seuil d'alerte de la part de marché, en %, celui du tableau de bord de NOVA (nova-gestion.ts). */
const seuilDAlerte = (c: Cas) => Math.round(mercatiqueDe(c).gestion.seuilsDAlerte.partDeMarche * 100);

/** Le laboratoire : les ventes du 2e trimestre, à l'enceinte. */
const VENTES_ESSAYEES = { min: 6_000, max: 7_000, pas: 1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « de » devant un nom, élidé devant une voyelle : « d'Auris », « de NOVA ». */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le marché du premier trimestre, celui du deuxième, et ce qui a bougé entre les deux. */
export const marcheEtPart = (c: Cas) => lireLeMarche(mercatiqueDe(c));

/** Les ventes du 2e trimestre qui auraient gardé la part du 1er, à l'enceinte supérieure. */
export const ventesPourGarderLaPart = (c: Cas) => {
  const m = marcheEtPart(c);
  return ventesPourLaPart(m.fin.marche, (m.debut.nova.ventes / m.debut.marche) * 100);
};

function tableauDuPremierTrimestre(c: Cas): TableauDeDonnees {
  const m = marcheEtPart(c);
  return {
    titre: "Le premier trimestre, de janvier à mars",
    colonnes: m.debut.enseignes.map((x) => x.nom),
    lignes: [
      { libelle: `${majuscule(c.unites)} vendues`, valeurs: m.debut.enseignes.map((x) => qte(x.ventes)) },
      { libelle: "Chiffre d'affaires", valeurs: m.debut.enseignes.map((x) => eur(x.chiffreDAffaires)) },
    ],
  };
}

export const MARCHE_ET_PART_DE_MARCHE: Chapitre = {
  code: "marche-et-part-de-marche",
  parcours: "stmg",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
    "STMG Thème 1 · La définition de l'offre",
    "BUT TC · Conduire les actions marketing",
    "BUT GACO · Concevoir la démarche marketing",
  ],
  titre: "Le marché et la part de marché",
  accroche:
    "Combien pèse le marché, quelle place l'entreprise y tient face à ses concurrents, et pourquoi une entreprise qui vend plus peut perdre du terrain.",
  objectifs: [
    "Mesurer la taille d'un marché",
    "Calculer une part de marché et une part de marché relative",
    "Situer l'entreprise face à ses concurrents : leader, challenger, suiveur",
    "Comparer les prix des concurrents",
    "Expliquer l'évolution d'une part de marché",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_PART_DE_MARCHE, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un marché et trois concurrents",
      notions: ["demand_market_share"],
      texte: (c) => {
        const m = marcheEtPart(c);
        return [
          `De janvier à mars, les clients ont acheté ${qte(m.debut.marche)} ${c.unites} : c'est la taille du marché, en volume. ${c.entreprise} y affronte deux grands concurrents, ${m.debut.enseignes.filter((x) => x.code !== "nova").map((x) => x.nom).join(" et ")}.`,
          `Ensemble, les trois enseignes en ont vendu ${qte(m.ventesDesTrois)}. Le reste du marché va à de plus petits vendeurs.`,
        ];
      },
      tableau: tableauDuPremierTrimestre,
      repere: () => "Part de marché = ventes de l'entreprise ÷ ventes du marché × 100. Part de marché relative = part de l'entreprise ÷ part de son premier concurrent.",
    },
    {
      id: "parts",
      objectifs: [0, 1],
      type: "montants",
      titre: "La part de marché",
      notions: ["demand_market_share"],
      question: (c) => {
        const m = marcheEtPart(c);
        return `Le marché compte ${qte(m.debut.marche)} ${c.unites}. Calculez la part de marché ${dE(c.entreprise)} (${qte(m.debut.nova.ventes)} vendues), celle de son premier concurrent, ${m.premierConcurrent.nom} (${qte(m.premierConcurrent.ventes)}), en pourcentage au dixième, puis la part de marché relative ${dE(c.entreprise)}, au centième.`;
      },
      champs: (c) => {
        const m = marcheEtPart(c);
        const e = m.debut.nova;
        return [
          { libelle: `Part de marché ${dE(c.entreprise)} (%)`, attendu: e.part, calcul: `${qte(e.ventes)} ÷ ${qte(m.debut.marche)} × 100 = ${pct(e.part)}`, tolerance: 0.1 },
          { libelle: "Part de marché du premier concurrent (%)", attendu: m.premierConcurrent.part, calcul: `${qte(m.premierConcurrent.ventes)} ÷ ${qte(m.debut.marche)} × 100 = ${pct(m.premierConcurrent.part)}`, tolerance: 0.1 },
          { libelle: "Part de marché relative", attendu: m.partRelative, calcul: `${pct(e.part)} ÷ ${pct(m.premierConcurrent.part)} = ${qte(m.partRelative)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const m = marcheEtPart(c);
        return [
          m.partRelative >= 1
            ? `Une part relative de ${qte(m.partRelative)} : ${c.entreprise} vend plus que son premier concurrent. Au-dessus de 1, l'entreprise est le leader du marché.`
            : `Une part relative de ${qte(m.partRelative)} : ${c.entreprise} vend moins que son premier concurrent. Sous 1, l'entreprise n'est pas le leader ; plus la part relative est faible, plus l'écart est grand.`,
          `Les trois enseignes réunies font ${pct(100 - m.autres)} du marché : le reste, ${pct(m.autres)}, va aux petits vendeurs.`,
        ];
      },
    },
    {
      id: "position",
      objectifs: [2],
      type: "choix",
      titre: "Leader, challenger ou suiveur",
      notions: ["demand_market_share"],
      question: (c) => {
        const m = marcheEtPart(c);
        return `${c.entreprise} est ${m.rang === 1 ? "première" : `${m.rang}e`} des trois enseignes par les ventes. Quelle est sa position sur le marché ?`;
      },
      options: (c) => {
        const m = marcheEtPart(c);
        const position = m.rang === 1 ? "leader" : m.rang === 2 ? "challenger" : "suiveur";
        const options = [
          { code: "leader", texte: "Le leader : elle vend plus que tous ses concurrents", vrai: `Oui : ${c.entreprise} est devant ${m.premierConcurrent.nom}. Le leader défend sa place : il fixe souvent les prix du marché, et les autres se situent par rapport à lui.` },
          { code: "challenger", texte: "Le challenger : deuxième, elle cherche à prendre la place du leader", vrai: `Oui : ${c.entreprise} vient derrière ${m.leader.nom}, devant les autres. Le challenger attaque le leader : par le prix, l'innovation ou la communication.` },
          { code: "suiveur", texte: "Le suiveur : loin derrière, elle s'aligne sur les autres", vrai: `Oui : ${c.entreprise} est loin derrière ${m.leader.nom}. Le suiveur s'aligne sur le marché, ou se spécialise sur une clientèle que les grands servent mal.` },
        ];
        return options.map((o) => ({
          texte: o.texte,
          juste: o.code === position,
          retour: o.code === position ? o.vrai : `Non : ${c.entreprise} est ${m.rang === 1 ? "première" : `${m.rang}e`} des trois par les ventes, avec une part de marché relative de ${qte(m.partRelative)}.`,
        }));
      },
    },
    {
      id: "prix",
      objectifs: [3],
      type: "choix",
      titre: "Le prix des concurrents",
      notions: ["demand_market_share", "price_elasticity"],
      tableau: (c) => {
        const m = marcheEtPart(c);
        return { titre: "Le prix et la part de marché de chaque enseigne", colonnes: ["Prix", "Part de marché"], lignes: m.debut.enseignes.map((x) => ({ libelle: x.nom, valeurs: [eur(x.prix), pct(x.part)] })) };
      },
      question: () => "Que montre le tableau ?",
      options: (c) => {
        const m = marcheEtPart(c);
        const leMoinsCherVendLePlus = m.moinsCher.code === m.leader.code;
        const lePlusCherVendLePlus = m.plusCher.code === m.leader.code;
        return [
          {
            texte: "L'enseigne la moins chère est celle qui vend le plus",
            juste: leMoinsCherVendLePlus,
            retour: leMoinsCherVendLePlus
              ? `Oui : ${m.moinsCher.nom} vend à ${eur(m.moinsCher.prix)}, moins cher que les autres, et prend la plus grande part de marché. ${m.plusCher.nom}, la plus chère (${eur(m.plusCher.prix)}), vend moins, mais chaque vente rapporte davantage : c'est un autre positionnement.`
              : `Non : la moins chère, ${m.moinsCher.nom} (${eur(m.moinsCher.prix)}), n'est pas celle qui vend le plus.`,
          },
          {
            texte: "L'enseigne la plus chère est celle qui vend le plus",
            juste: lePlusCherVendLePlus,
            retour: lePlusCherVendLePlus ? `Oui : ${m.plusCher.nom} vend le plus malgré le prix le plus haut.` : `Non : la plus chère, ${m.plusCher.nom} (${eur(m.plusCher.prix)}), vend moins que ${m.leader.nom}.`,
          },
          {
            texte: "Le leader n'est ni le plus cher ni le moins cher",
            juste: !leMoinsCherVendLePlus && !lePlusCherVendLePlus,
            retour:
              !leMoinsCherVendLePlus && !lePlusCherVendLePlus
                ? `Oui : ${m.leader.nom} vend à ${eur(m.leader.prix)}, entre les deux autres.`
                : `Non : le leader, ${m.leader.nom}, est ${leMoinsCherVendLePlus ? "le moins cher" : "le plus cher"} des trois.`,
          },
        ];
      },
    },
    {
      id: "evolution",
      objectifs: [4],
      type: "montants",
      titre: "Une part de marché qui bouge",
      notions: ["demand_market_share", "seasonality"],
      tableau: (c) => {
        const m = marcheEtPart(c);
        return {
          titre: `Les deux trimestres du semestre, chez ${c.entreprise}`,
          colonnes: ["Janvier à mars", "Avril à juin"],
          lignes: [
            { libelle: `Taille du marché (${c.unites})`, valeurs: [qte(m.debut.marche), qte(m.fin.marche)] },
            { libelle: `Ventes ${dE(c.entreprise)}`, valeurs: [qte(m.debut.nova.ventes), qte(m.fin.nova.ventes)] },
            { libelle: "Part de marché", valeurs: [pct(m.debut.nova.part), pct(m.fin.nova.part)] },
          ],
        };
      },
      question: (c) => `Du premier au deuxième trimestre, calculez l'évolution de la taille du marché, celle des ventes ${dE(c.entreprise)}, en pourcentage au dixième, puis la variation de sa part de marché, en points.`,
      champs: (c) => {
        const m = marcheEtPart(c);
        return [
          { libelle: "Évolution du marché (%)", attendu: m.evolutionDuMarche, calcul: `(${qte(m.fin.marche)} ÷ ${qte(m.debut.marche)} − 1) × 100 = ${pct(m.evolutionDuMarche)}`, tolerance: 0.1 },
          { libelle: "Évolution des ventes (%)", attendu: m.evolutionDesVentes, calcul: `(${qte(m.fin.nova.ventes)} ÷ ${qte(m.debut.nova.ventes)} − 1) × 100 = ${pct(m.evolutionDesVentes)}`, tolerance: 0.1 },
          { libelle: "Variation de la part de marché (points)", attendu: m.points, calcul: `${pct(m.fin.nova.part)} − ${pct(m.debut.nova.part)} = ${qte(m.points)} points`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const m = marcheEtPart(c);
        return [
          m.evolutionDesVentes < m.evolutionDuMarche
            ? `Le marché grandit de ${pct(m.evolutionDuMarche)}, les ventes ${dE(c.entreprise)} de ${pct(m.evolutionDesVentes)} : elles suivent moins vite que le marché, et la part de marché recule de ${qte(Math.abs(m.points))} points. Une entreprise peut vendre plus et perdre du terrain.`
            : `Le marché grandit de ${pct(m.evolutionDuMarche)}, les ventes ${dE(c.entreprise)} de ${pct(m.evolutionDesVentes)} : elles vont plus vite que le marché, et la part de marché gagne ${qte(m.points)} points.`,
          "Une part de marché se compte en points : passer de 20 % à 15 %, c'est perdre 5 points, pas 5 %.",
        ];
      },
    },
    {
      id: "le-seuil-d-alerte",
      objectifs: [4],
      type: "curseur",
      titre: "Le seuil d'alerte du tableau de bord",
      notions: ["demand_market_share", "dashboard"],
      question: (c) => {
        const m = marcheEtPart(c);
        return `Le tableau de bord ${dE(c.entreprise)} allume un voyant quand la part de marché passe sous ${seuilDAlerte(c)} %. D'avril à juin, le marché compte ${qte(m.fin.marche)} ${c.unites}. Faites varier les ventes du trimestre : une droite donne leur chiffre d'affaires, l'autre celui de ${seuilDAlerte(c)} % du marché au prix de ${eur(prixDeNova(mercatiqueDe(c)))}. Placez le curseur sur les plus petites ventes qui n'allument pas le voyant, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Ventes d'avril à juin", unite: c.unites }),
      cible: (c) => ({ attendu: ventesPourLaPart(marcheEtPart(c).fin.marche, seuilDAlerte(c)), min: 5_000, max: 7_000 }),
      zones: ["Le voyant reste éteint", "Le voyant s'allume"],
      rates: () => ({
        dessous: "Avec ces ventes, la part de marché passe sous le seuil : le voyant s'allume.",
        dessus: "Le voyant reste éteint, mais moins de ventes suffiraient : cherchez les plus petites.",
      }),
      montrer: "Montrer les ventes",
      lecture: (c, q) => {
        const m = marcheEtPart(c);
        const p = prixDeNova(mercatiqueDe(c));
        return [
          { libelle: "Chiffre d'affaires des ventes", montant: q * p, fort: true },
          { libelle: `Chiffre d'affaires de ${seuilDAlerte(c)} % du marché`, montant: (m.fin.marche * seuilDAlerte(c) * p) / 100 },
        ];
      },
      droites: (c) => {
        const m = marcheEtPart(c);
        const p = prixDeNova(mercatiqueDe(c));
        return { produit: (q) => q * p, cout: () => (m.fin.marche * seuilDAlerte(c) * p) / 100, libelles: ["Chiffre d'affaires des ventes", `${seuilDAlerte(c)} % du marché`] };
      },
      explication: (c) => {
        const m = marcheEtPart(c);
        const q = ventesPourLaPart(m.fin.marche, seuilDAlerte(c));
        return [
          `Il faut ${qte(q)} ${c.unites} : ${qte(q)} ÷ ${qte(m.fin.marche)} × 100 = ${pct(partDe(q, m.fin.marche))}. ${c.entreprise} en a vendu ${qte(m.fin.nova.ventes)} : ${m.fin.nova.ventes >= q ? "le voyant reste éteint" : `il en manquait ${qte(q - m.fin.nova.ventes)}, le voyant s'est allumé`}.`,
          "Un seuil de part de marché se lit en ventes : il monte avec le marché.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-part",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de la part de marché",
      notions: ["demand_market_share"],
      question: (c) => {
        const m = marcheEtPart(c);
        return `Au premier trimestre, ${c.entreprise} tenait ${pct(m.debut.nova.part)} du marché. Faites varier ses ventes d'avril à juin, sur un marché de ${qte(m.fin.marche)} ${c.unites}, et relevez le défi.`;
      },
      leviers: (c) => [{ code: "ventes", libelle: "Ventes d'avril à juin", unite: c.unites, ...VENTES_ESSAYEES, depart: marcheEtPart(c).fin.nova.ventes }],
      lecture: (c, p) => {
        const m = marcheEtPart(c);
        return [
          { libelle: "Part de marché d'avril à juin", montant: partDe(p.ventes!, m.fin.marche), unite: "%", reference: m.fin.nova.part, fort: true },
          { libelle: "Part de marché de janvier à mars", montant: m.debut.nova.part, unite: "%" },
          { libelle: "Ventes en plus du deuxième trimestre", montant: p.ventes! - m.fin.nova.ventes, unite: c.unites },
        ];
      },
      graphique: (c) => {
        const m = marcheEtPart(c);
        return {
          levier: "ventes",
          unite: "%",
          courbes: [
            { libelle: "Part de marché d'avril à juin", valeur: (p) => (p.ventes! / m.fin.marche) * 100 },
            { libelle: "Part de janvier à mars", valeur: () => (m.debut.nova.ventes / m.debut.marche) * 100 },
          ],
        };
      },
      defi: (c) => {
        const juste = ventesPourGarderLaPart(c);
        const m = marcheEtPart(c);
        return {
          consigne: "Trouvez les plus petites ventes d'avril à juin qui gardent au moins la part de marché du premier trimestre.",
          atteint: (p) => p.ventes === juste,
          indice: (p) =>
            p.ventes! < juste
              ? `Avec ${qte(p.ventes!)} ${c.unites}, la part est de ${pct(partDe(p.ventes!, m.fin.marche))} : elle recule encore.`
              : `Avec ${qte(p.ventes!)} ${c.unites}, la part est gardée. Moins de ventes le feraient-elles aussi ?`,
          solution: { ventes: juste },
        };
      },
      explication: (c, p) => {
        const m = marcheEtPart(c);
        return [
          `Défi relevé : ${qte(p.ventes!)} ${c.unites}, ${qte(p.ventes! - m.fin.nova.ventes)} de plus que les ventes réelles. Pour garder sa part, ${c.entreprise} devait grandir aussi vite que le marché, de ${pct(m.evolutionDuMarche)}, pas seulement vendre plus.`,
          "Garder sa part de marché, c'est suivre le marché : quand il grandit, il faut grandir autant que lui.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share"],
      texte: (c) => {
        const m = marcheEtPart(c);
        return [
          `Au premier trimestre, ${c.entreprise} tient ${pct(m.debut.nova.part)} d'un marché de ${qte(m.debut.marche)} ${c.unites}, avec une part relative de ${qte(m.partRelative)} face à son premier concurrent, ${m.premierConcurrent.nom}. Au deuxième, elle vend plus, et sa part recule de ${qte(Math.abs(m.points))} points.`,
          "La part de marché ne se lit jamais seule : il faut la taille du marché pour savoir ce qu'elle représente, la part du premier concurrent pour savoir où l'on se situe, et son évolution pour savoir si l'on gagne ou si l'on perd du terrain. Dans l'arène, le marché du tour donne votre part et celle de vos concurrents.",
        ];
      },
      repere: () => "Part de marché = ventes ÷ marché × 100. Part relative = part de l'entreprise ÷ part du premier concurrent : au-dessus de 1, l'entreprise est leader.",
    },
  ],
};
