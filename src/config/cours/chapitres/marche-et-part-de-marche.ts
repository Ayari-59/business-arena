import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { accordPluriel } from "../accords";
import { type Cas } from "../cas";
import { anneeJouee } from "../annee-de-l-arene";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE MARCHÉ ET LA PART DE MARCHÉ (Bac STMG, mercatique, palier 1).
 *
 * La première question du mercaticien : combien pèse le marché, et quelle place l'entreprise y
 * tient face à ses concurrents. La taille du marché, la part de marché de l'entreprise et du
 * leader, la part relative, le prix de chacun ; puis l'année : le marché grandit, la part de
 * marché recule si les ventes ne suivent pas.
 *
 * Les chiffres sont ceux de l'année de l'arène (`anneeJouee`) : la demande potentielle de chaque
 * clientèle fait le marché, les ventes et le chiffre d'affaires de l'entreprise et de ses deux
 * concurrents font les parts. Ce qui n'est vendu par aucune des trois va aux autres offres du
 * marché, que l'arène ne nomme pas. Aucune hypothèse n'est ajoutée.
 */

/** Les entreprises dont le marché se compte en ventes : chez VOLT FITNESS, il se compte en abonnés gardés. */
export const MARCHES = ENTREPRISES_DU_COURS.filter((code) => !scenarioByCode(code).scenario.subscription);

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « de » devant un nom, élidé devant une voyelle : « d'ATLAS CONSEIL », « de NOVA ». */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export interface Enseigne {
  id: string;
  nom: string;
  ventes: number;
  chiffreDAffaires: number;
  prix: number;
  part: number;
}

/** Un trimestre du marché : sa taille et la place de chaque enseigne. */
function trimestre(c: Cas, i: number) {
  const def = scenarioByCode(c.code);
  const t = anneeJouee(c.code).partie.rounds[i]!;
  const joueur = t.results["joueur"]!;
  const marche = Math.round(Object.values(joueur.market.bySegment).reduce((s, v) => s + v.potential, 0));
  const enseignes: Enseigne[] = Object.entries(t.results).map(([id, r]) => {
    const ventes = Math.round(Object.values(r.market.bySegment).reduce((s, v) => s + v.sold, 0));
    const ca = Math.round(r.incomeStatement.revenue);
    return {
      id,
      nom: id === "joueur" ? c.entreprise : (def.bots.find((b) => b.id === id)?.name ?? id),
      ventes,
      chiffreDAffaires: ca,
      prix: auCentime(ca / ventes),
      part: auDixieme((ventes / marche) * 100),
    };
  });
  return { marche, enseignes, entreprise: enseignes.find((e) => e.id === "joueur")! };
}

/** Le marché du premier trimestre, celui du dernier, et ce qui a bougé entre les deux. */
export function marcheEtPart(c: Cas) {
  const n = anneeJouee(c.code).partie.rounds.length;
  const debut = trimestre(c, 0);
  const fin = trimestre(c, n - 1);
  const parVentes = [...debut.enseignes].sort((a, b) => b.ventes - a.ventes);
  const leader = parVentes[0]!;
  const premierConcurrent = parVentes.find((e) => e.id !== "joueur")!;
  const e = debut.entreprise;
  const ventesDesTrois = debut.enseignes.reduce((s, x) => s + x.ventes, 0);
  return {
    debut,
    fin,
    leader,
    premierConcurrent,
    rang: parVentes.findIndex((x) => x.id === "joueur") + 1,
    partRelative: Math.round((e.part / premierConcurrent.part) * 100) / 100,
    autres: auDixieme(100 - debut.enseignes.reduce((s, x) => s + x.part, 0)),
    ventesDesTrois,
    plusCher: [...debut.enseignes].sort((a, b) => b.prix - a.prix)[0]!,
    evolutionDuMarche: auDixieme((fin.marche / debut.marche - 1) * 100),
    evolutionDesVentes: auDixieme((fin.entreprise.ventes / e.ventes - 1) * 100),
    points: auDixieme(fin.entreprise.part - e.part),
    trimestres: n,
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
    "Combien pèse le marché, quelle place l'entreprise y tient face à ses concurrents, et pourquoi une entreprise qui vend autant peut perdre du terrain.",
  objectifs: [
    "Mesurer la taille d'un marché",
    "Calculer une part de marché et une part de marché relative",
    "Situer l'entreprise face à ses concurrents : leader, challenger, suiveur",
    "Comparer les prix des concurrents",
    "Expliquer l'évolution d'une part de marché",
  ],
  libre: false,
  entreprises: {
    codes: MARCHES,
    pourquoi: "ce chapitre mesure un marché en ventes, et chez VOLT FITNESS le marché se compte d'abord en abonnés gardés.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un marché et trois concurrents",
      notions: ["demand_market_share"],
      texte: (c) => {
        const m = marcheEtPart(c);
        return [
          `Au premier trimestre de l'arène, les clients du marché ${dE(c.entreprise)} auraient pu acheter ${qte(m.debut.marche)} ${c.unites} : c'est la taille du marché, en volume. ${c.entreprise} y affronte deux concurrents, ${m.debut.enseignes.filter((x) => x.id !== "joueur").map((x) => x.nom).join(" et ")}.`,
          `Ensemble, les trois enseignes en ont vendu ${qte(m.ventesDesTrois)}. Le reste du marché va à d'autres offres, ou n'achète pas.`,
        ];
      },
      tableau: (c) => {
        const m = marcheEtPart(c);
        return {
          titre: "Le premier trimestre de l'arène",
          colonnes: m.debut.enseignes.map((x) => x.nom),
          lignes: [
            { libelle: `${majuscule(c.unites)} ${accordPluriel(c, "vendu")}`, valeurs: m.debut.enseignes.map((x) => qte(x.ventes)) },
            { libelle: "Chiffre d'affaires", valeurs: m.debut.enseignes.map((x) => eur(x.chiffreDAffaires)) },
          ],
        };
      },
      repere: () => "Part de marché = ventes de l'entreprise ÷ ventes possibles sur le marché × 100. Part de marché relative = part de l'entreprise ÷ part de son premier concurrent.",
    },
    {
      id: "parts",
      type: "montants",
      titre: "La part de marché",
      notions: ["demand_market_share"],
      question: (c) => {
        const m = marcheEtPart(c);
        return `Le marché compte ${qte(m.debut.marche)} ${c.unites}. Calculez la part de marché ${dE(c.entreprise)} (${qte(m.debut.entreprise.ventes)} ${accordPluriel(c, "vendu")}), celle de son premier concurrent, ${m.premierConcurrent.nom} (${qte(m.premierConcurrent.ventes)}), en pourcentage au dixième, puis la part de marché relative ${dE(c.entreprise)}, au centième.`;
      },
      champs: (c) => {
        const m = marcheEtPart(c);
        const e = m.debut.entreprise;
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
          `Les trois enseignes réunies ne font que ${pct(auDixieme(100 - m.autres))} du marché : le reste, ${pct(m.autres)}, va à d'autres offres ou à des clients qui n'achètent pas.`,
        ];
      },
    },
    {
      id: "position",
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
          { code: "challenger", texte: "Le challenger : deuxième, elle cherche à prendre la place du leader", vrai: `Oui : ${c.entreprise} vient juste derrière ${m.leader.nom}. Le challenger attaque le leader : par le prix, l'innovation ou la communication.` },
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
      type: "choix",
      titre: "Le prix des concurrents",
      notions: ["demand_market_share", "price_elasticity"],
      tableau: (c) => {
        const m = marcheEtPart(c);
        return {
          titre: "Le prix moyen de chaque enseigne",
          colonnes: ["Prix moyen", "Part de marché"],
          lignes: m.debut.enseignes.map((x) => ({ libelle: x.nom, valeurs: [eur(x.prix), pct(x.part)] })),
        };
      },
      question: () => "Le prix moyen de chaque enseigne est son chiffre d'affaires divisé par ses ventes. Que montre le tableau ?",
      options: (c) => {
        const m = marcheEtPart(c);
        const moinsCher = [...m.debut.enseignes].sort((a, b) => a.prix - b.prix)[0]!;
        const leMoinsCherVendLePlus = moinsCher.id === m.leader.id;
        return [
          {
            texte: "L'enseigne la moins chère est celle qui vend le plus",
            juste: leMoinsCherVendLePlus,
            retour: leMoinsCherVendLePlus
              ? `Oui : ${moinsCher.nom} vend à ${eur(moinsCher.prix)} en moyenne, moins cher que les autres, et prend la plus grande part de marché. ${m.plusCher.nom}, la plus chère (${eur(m.plusCher.prix)}), vend moins mais chaque vente rapporte davantage : c'est un autre positionnement.`
              : `Non : la moins chère, ${moinsCher.nom} (${eur(moinsCher.prix)}), n'est pas celle qui vend le plus.`,
          },
          {
            texte: "L'enseigne la plus chère est celle qui vend le plus",
            juste: !leMoinsCherVendLePlus && m.plusCher.id === m.leader.id,
            retour:
              m.plusCher.id === m.leader.id
                ? `Oui : ${m.plusCher.nom} vend le plus malgré le prix le plus haut (${eur(m.plusCher.prix)}). Ses clients achètent autre chose que le prix : la qualité, l'image, le service.`
                : `Non : la plus chère, ${m.plusCher.nom} (${eur(m.plusCher.prix)}), vend moins que ${m.leader.nom}.`,
          },
          {
            texte: "Le leader n'est ni le plus cher ni le moins cher",
            juste: !leMoinsCherVendLePlus && m.plusCher.id !== m.leader.id,
            retour:
              !leMoinsCherVendLePlus && m.plusCher.id !== m.leader.id
                ? `Oui : ${m.leader.nom} vend à ${eur(m.leader.prix)}, entre les deux autres. Le prix ne fait pas seul la part de marché : la qualité, la communication et la disponibilité comptent aussi.`
                : `Non : le leader, ${m.leader.nom}, est ${m.leader.id === moinsCher.id ? "le moins cher" : "le plus cher"} des trois.`,
          },
        ];
      },
    },
    {
      id: "evolution",
      type: "montants",
      titre: "Une part de marché qui bouge",
      notions: ["demand_market_share", "seasonality"],
      tableau: (c) => {
        const m = marcheEtPart(c);
        return {
          titre: `Le premier et le dernier trimestre, chez ${c.entreprise}`,
          colonnes: ["T1", `T${m.trimestres}`],
          lignes: [
            { libelle: `Taille du marché (${c.unites})`, valeurs: [qte(m.debut.marche), qte(m.fin.marche)] },
            { libelle: `Ventes ${dE(c.entreprise)}`, valeurs: [qte(m.debut.entreprise.ventes), qte(m.fin.entreprise.ventes)] },
            { libelle: "Part de marché", valeurs: [pct(m.debut.entreprise.part), pct(m.fin.entreprise.part)] },
          ],
        };
      },
      question: (c) =>
        `Du premier au dernier trimestre, calculez l'évolution de la taille du marché, celle des ventes ${dE(c.entreprise)}, en pourcentage au dixième, puis la variation de sa part de marché, en points.`,
      champs: (c) => {
        const m = marcheEtPart(c);
        return [
          { libelle: "Évolution du marché (%)", attendu: m.evolutionDuMarche, calcul: `(${qte(m.fin.marche)} ÷ ${qte(m.debut.marche)} − 1) × 100 = ${pct(m.evolutionDuMarche)}`, tolerance: 0.1 },
          { libelle: "Évolution des ventes (%)", attendu: m.evolutionDesVentes, calcul: `(${qte(m.fin.entreprise.ventes)} ÷ ${qte(m.debut.entreprise.ventes)} − 1) × 100 = ${pct(m.evolutionDesVentes)}`, tolerance: 0.1 },
          { libelle: "Variation de la part de marché (points)", attendu: m.points, calcul: `${pct(m.fin.entreprise.part)} − ${pct(m.debut.entreprise.part)} = ${qte(m.points)} points`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const m = marcheEtPart(c);
        return [
          m.evolutionDesVentes < m.evolutionDuMarche
            ? `Le marché évolue de ${pct(m.evolutionDuMarche)}, les ventes ${dE(c.entreprise)} de ${pct(m.evolutionDesVentes)} : elles suivent moins vite que le marché, et la part de marché recule de ${qte(Math.abs(m.points))} points. Une entreprise peut vendre autant, ou plus, et perdre du terrain.`
            : `Le marché évolue de ${pct(m.evolutionDuMarche)}, les ventes ${dE(c.entreprise)} de ${pct(m.evolutionDesVentes)} : elles vont plus vite que le marché, et la part de marché gagne ${qte(m.points)} points.`,
          "Une part de marché se compte en points : passer de 20 % à 15 %, c'est perdre 5 points, pas 5 %.",
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
          `Au premier trimestre, ${c.entreprise} tient ${pct(m.debut.entreprise.part)} d'un marché de ${qte(m.debut.marche)} ${c.unites}, avec une part relative de ${qte(m.partRelative)} face à son premier concurrent, ${m.premierConcurrent.nom}.`,
          "La part de marché ne se lit jamais seule : il faut la taille du marché pour savoir ce qu'elle représente, la part du premier concurrent pour savoir où l'on se situe, et son évolution pour savoir si l'on gagne ou si l'on perd du terrain.",
        ];
      },
      repere: () => "Part de marché = ventes ÷ marché × 100. Part relative = part de l'entreprise ÷ part du premier concurrent : au-dessus de 1, l'entreprise est leader.",
    },
  ],
};
