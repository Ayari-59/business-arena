import type { Cas } from "../cas";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import {
  PROGRESSION_EN_POURCENT as PROGRESSION_DU_MONDE,
  RESERVE_ESSAYEE,
  TRIMESTRE_SUIVI as TRIMESTRE_DU_MONDE,
  objectifSur,
  progressionAtteinte,
  reservePourTousLesServir,
  suiviDeLAnnee,
  suiviDuTrimestre,
  trimestreAvecPlusDeReserve,
  type Suivi,
  type Verdict,
} from "../monde/vente-et-caisse";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VENTE, POURQUOI_LA_VENTE } from "./le-panier-moyen";

export type { Suivi, Verdict } from "../monde/vente-et-caisse";

/**
 * CHAPITRE : SUIVRE SES VENTES, L'OBJECTIF, LE RÉALISÉ, L'ÉCART (Bac pro MCV, palier 1 :
 * seconde professionnelle relation client, première bac pro Métiers du commerce et de la vente).
 *
 * Le geste du vendeur devant son tableau de suivi : l'objectif de ventes du trimestre, ce qu'il a
 * vendu, l'écart en articles et en pourcentage, le taux de réalisation. Puis ce qui explique
 * l'écart : les clients venus (la demande), les clients servis (les ventes), les clients repartis
 * sans être servis. Enfin, ce que l'équipe fait ensuite. Puis l'expérience : un curseur (la plus
 * forte progression que les ventes auraient tenue) et un laboratoire (la réserve qu'il fallait
 * pour servir tous les clients de Noël).
 *
 * Il ne double pas « Se fixer des objectifs et les suivre » (Stratégie, palier 1) : là, la
 * direction pose en janvier un objectif sur la capacité de produire. Ici, l'objectif du vendeur se
 * pose chaque trimestre et se suit en articles, clients à l'appui. Ni « Le tableau de bord du
 * manager » (BTS MCO, palier 4), qui range une dizaine d'indicateurs.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : les trois années passées de MAILLE & CO, trimestre par
 * trimestre (monde/maille-et-co.ts : la demande et les ventes ; au trimestre 4, la réserve ne tient
 * pas le pic de Noël). Le trimestre suivi est le trimestre 4 de N − 1. Les étiquettes n'ont pas
 * changé d'une année à l'autre. Les calculs sont dans monde/vente-et-caisse.ts.
 *
 * HYPOTHÈSE DU COURS, dite à l'élève : l'objectif d'un trimestre, ce sont les ventes du même
 * trimestre de l'année d'avant, plus 5 %, arrondies à l'article du dessus.
 *
 * CE QUI A CHANGÉ. Le chapitre posait l'objectif du trimestre 2 de l'arène sur le trimestre 1, plus
 * 10 %, chez quatre entreprises (à la boutique : 5 062 articles visés, 2 969 vendus, 58,7 %). Il le
 * pose maintenant sur le même trimestre de l'année d'avant, plus 5 %, chez MAILLE & CO seule : au
 * trimestre 4 de N − 1, 12 600 articles visés, 12 500 vendus, 99,2 %, et 1 940 articles demandés
 * sans être servis.
 */

/** La progression de l'objectif, en % (le monde du cours). */
export const PROGRESSION_EN_POURCENT = PROGRESSION_DU_MONDE;

/** Le trimestre suivi (le monde du cours). */
export const TRIMESTRE_SUIVI = TRIMESTRE_DU_MONDE;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
/** L'année de la fiche, écrite avec le signe moins : « N − 1 ». */
export const an = (a: string) => a.replace("-", " − ");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
/** Un écart signé : « +100 », « −100 ». */
const signe = (n: number) => (n > 0 ? `+${qte(n)}` : qte(n));
const signePct = (t: number) => (t > 0 ? `+${pct(t)}` : pct(t));

export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Le suivi d'un trimestre de N − 1 (le chapitre suit le trimestre 4). */
export const suiviDesVentes = (c: Pick<Cas, "code">, trimestre: 1 | 2 | 3 | 4 = TRIMESTRE_SUIVI) => suiviDuTrimestre(ficheDe(c), trimestre);

const du = (c: Cas) => suiviDesVentes(c);

/** « 100 articles », « 1 article ». */
const articles = (n: number) => `${qte(Math.abs(n))} ${Math.abs(n) > 1 ? "articles" : "article"}`;

/** L'objectif, en calcul : « 12 000 × 1,05 = 12 600 ». */
export const calculDeLObjectif = (k: Suivi) =>
  `${qte(k.avant.ventes)} × ${(1 + k.progression / 100).toLocaleString("fr-FR")} = ${k.exact.toLocaleString("fr-FR")}${k.exact === k.objectif ? "" : `, arrondi à ${qte(k.objectif)}`}`;

export function tableauDuSuivi(c: Cas, k: Suivi): TableauDeDonnees {
  return {
    titre: `${c.entreprise} · le trimestre ${k.trimestre} de ${an(k.anneeDAvant)} et de ${an(k.annee)}`,
    colonnes: [`Trimestre ${k.trimestre} de ${an(k.anneeDAvant)}`, `Trimestre ${k.trimestre} de ${an(k.annee)}`],
    lignes: [
      { libelle: "Articles vendus", valeurs: [qte(k.avant.ventes), qte(k.pendant.ventes)] },
      { libelle: "Articles demandés par les clients", valeurs: [qte(k.avant.demande), qte(k.pendant.demande)] },
    ],
  };
}

export function tableauDuTrimestreDAvant(c: Cas, k: Suivi): TableauDeDonnees {
  return {
    titre: `${c.entreprise} · le trimestre ${k.trimestre} de ${an(k.anneeDAvant)}`,
    colonnes: [`Trimestre ${k.trimestre} de ${an(k.anneeDAvant)}`],
    lignes: [{ libelle: "Articles vendus", valeurs: [qte(k.avant.ventes)] }],
  };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const annee = suiviDeLAnnee(ficheDe(c));
  return {
    titre: `${c.entreprise} · l'objectif de chaque trimestre de N − 1, face au réalisé`,
    colonnes: annee.map((k) => `Trimestre ${k.trimestre}`),
    lignes: [
      { libelle: "Objectif", valeurs: annee.map((k) => qte(k.objectif)) },
      { libelle: "Réalisé", valeurs: annee.map((k) => qte(k.pendant.ventes)) },
      { libelle: "Taux de réalisation", valeurs: annee.map((k) => pct(k.tauxDeRealisation)) },
    ],
  };
}

/** Les options du « pourquoi », communes au chapitre et à son cas pratique. */
export function optionsDuPourquoi(k: Suivi) {
  const faits = `${qte(k.pendant.demande)} articles demandés, ${qte(k.pendant.ventes)} vendus, pour un objectif de ${qte(k.objectif)}`;
  return [
    {
      texte: "Assez de clients ont été servis pour l'atteindre",
      juste: k.verdict === "atteint",
      retour:
        k.verdict === "atteint"
          ? `Oui : ${faits}. L'objectif est atteint${k.pendant.repartis > 0 ? `, même si ${articles(k.pendant.repartis)} n'ont pas pu être servis` : ""}.`
          : `Non : ${faits}. L'objectif est manqué de ${articles(k.ecart)}.`,
    },
    {
      texte: "Il est venu moins de clients que l'objectif",
      juste: k.verdict === "clients",
      retour: k.verdict === "clients" ? `Oui : ${faits}. Même en servant tous les clients venus, l'objectif n'était pas à portée.` : `Non : ${faits}. Les clients venus suffisaient pour l'objectif.`,
    },
    {
      texte: "Assez de clients sont venus, mais tous n'ont pas été servis",
      juste: k.verdict === "service",
      retour:
        k.verdict === "service"
          ? `Oui : ${faits}. ${articles(k.pendant.repartis).replace(/^./, (x) => x.toUpperCase())} n'ont pas été servis : la réserve n'a pas suivi, des clients sont repartis.`
          : `Non : ${faits}. ${k.pendant.demande < k.objectif ? "Il ne venait pas assez de clients pour l'objectif." : "L'objectif est atteint."}`,
    },
    {
      texte: "Les prix ont changé d'un trimestre à l'autre",
      juste: false,
      retour: `Non : les étiquettes de la boutique n'ont pas changé d'une année à l'autre. L'écart vient des clients : ${faits}.`,
    },
  ];
}

const ACTIONS: Record<Verdict, string> = {
  atteint: "Garder sa façon de vendre, et viser plus haut",
  clients: "Faire venir plus de clients",
  service: "Servir tous les clients qui viennent",
};

export const SUIVRE_SES_VENTES: Chapitre = {
  code: "suivre-ses-ventes",
  parcours: "vente",
  palier: 1,
  blocs: ["Bac pro MCV · Bloc 2 · Suivre les ventes", "2de pro RC · Collecter et exploiter l'information dans le cadre de la relation client"],
  titre: "Suivre ses ventes : l'objectif, le réalisé, l'écart",
  accroche: "Un objectif de ventes pour le trimestre, ce que l'équipe a vendu, l'écart et le taux de réalisation. Puis ce qui l'explique : les clients venus, les clients servis.",
  objectifs: [
    "Calculer un objectif de ventes à partir de l'année d'avant",
    "Calculer l'écart avec l'objectif, en unités et en pourcentage",
    "Calculer un taux de réalisation",
    "Expliquer l'écart : les clients venus, les clients servis",
    "Choisir ce qu'on fait au trimestre suivant",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_VENTE, pourquoi: POURQUOI_LA_VENTE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le tableau de suivi",
      notions: ["dashboard"],
      tableau: (c) => tableauDuTrimestreDAvant(c, du(c)),
      texte: (c) => {
        const k = du(c);
        return [
          `Chez ${c.entreprise}, l'équipe de vente a un objectif chaque trimestre. Au bout du trimestre, elle compare : ce qu'elle visait, ce qu'elle a vendu, l'écart.`,
          `Dans le cas du cours, la règle est simple : l'objectif, ce sont les ventes du même trimestre de l'année d'avant, plus ${qte(k.progression)} %. Le même trimestre, parce que le trimestre de Noël vend bien plus que les autres. Le tableau donne les ventes du trimestre ${k.trimestre} de ${an(k.anneeDAvant)}.`,
        ];
      },
      repere: () => "Écart = réalisé − objectif. Taux de réalisation = réalisé ÷ objectif × 100.",
    },
    {
      id: "l-objectif",
      type: "montants",
      titre: "L'objectif du trimestre",
      notions: ["dashboard"],
      question: (c) => {
        const k = du(c);
        return `Calculez l'objectif du trimestre ${k.trimestre} de ${an(k.annee)} : les ${qte(k.avant.ventes)} articles du trimestre ${k.trimestre} de ${an(k.anneeDAvant)}, plus ${qte(k.progression)} %. Arrondissez à l'unité du dessus.`;
      },
      champs: (c) => {
        const k = du(c);
        return [{ libelle: `Objectif du trimestre ${k.trimestre}`, attendu: k.objectif, calcul: calculDeLObjectif(k) }];
      },
      explication: (c) => [`L'équipe vise ${qte(du(c).objectif)} articles. Un objectif est un nombre, avec une date : on saura dire s'il est atteint.`],
    },
    {
      id: "l-ecart",
      type: "montants",
      titre: "L'écart avec l'objectif",
      notions: ["dashboard", "volume_price_variance"],
      question: (c) => {
        const k = du(c);
        return `Au trimestre ${k.trimestre} de ${an(k.annee)}, la boutique a vendu ${qte(k.pendant.ventes)} articles, pour un objectif de ${qte(k.objectif)}. Calculez l'écart en articles (négatif s'il en manque), puis l'écart en pourcentage de l'objectif, au dixième.`;
      },
      champs: (c) => {
        const k = du(c);
        return [
          { libelle: "Écart en articles", attendu: k.ecart, calcul: `${qte(k.pendant.ventes)} − ${qte(k.objectif)} = ${qte(k.ecart)}` },
          { libelle: "Écart en pourcentage (%)", attendu: k.ecartEnPourcentage, calcul: `${qte(k.ecart)} ÷ ${qte(k.objectif)} × 100 = ${pct(k.ecartEnPourcentage)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = du(c);
        return [
          k.ecart >= 0
            ? `L'équipe a vendu ${articles(k.ecart)} de plus que l'objectif : ${signePct(k.ecartEnPourcentage)}. Un écart positif est favorable.`
            : `Il manque ${articles(k.ecart)} pour l'objectif : ${pct(k.ecartEnPourcentage)}. Un écart négatif est défavorable.`,
        ];
      },
    },
    {
      id: "le-taux-de-realisation",
      type: "montants",
      titre: "Le taux de réalisation",
      notions: ["dashboard"],
      question: (c) => {
        const k = du(c);
        return `Calculez le taux de réalisation : divisez les ${qte(k.pendant.ventes)} articles vendus par l'objectif de ${qte(k.objectif)}, puis multipliez par 100. Arrondissez au dixième.`;
      },
      champs: (c) => {
        const k = du(c);
        return [{ libelle: "Taux de réalisation (%)", attendu: k.tauxDeRealisation, calcul: `${qte(k.pendant.ventes)} ÷ ${qte(k.objectif)} × 100 = ${pct(k.tauxDeRealisation)}`, tolerance: 0.1 }];
      },
      explication: (c) => {
        const k = du(c);
        return [
          k.tauxDeRealisation >= 100 ? `${pct(k.tauxDeRealisation)} : l'objectif est atteint. Au-dessus de 100 %, l'équipe a fait mieux que prévu.` : `${pct(k.tauxDeRealisation)} : l'objectif n'est pas atteint. Il aurait fallu 100 %.`,
          "Le taux de réalisation et l'écart en pourcentage disent la même chose : le taux, c'est 100 % plus l'écart, au dixième près.",
        ];
      },
    },
    {
      id: "les-clients",
      type: "montants",
      titre: "Les clients venus et les clients servis",
      notions: ["conversion_rate", "dashboard"],
      tableau: (c) => tableauDuSuivi(c, du(c)),
      question: (c) => {
        const k = du(c);
        return `Le tableau donne aussi ce que les clients sont venus chercher : la demande. Calculez, au trimestre ${k.trimestre} de ${an(k.annee)}, les articles que les clients ont demandés sans être servis, puis l'écart entre la demande et l'objectif.`;
      },
      champs: (c) => {
        const k = du(c);
        return [
          { libelle: "Articles demandés sans être servis", attendu: k.pendant.repartis, calcul: `${qte(k.pendant.demande)} − ${qte(k.pendant.ventes)} = ${qte(k.pendant.repartis)}` },
          { libelle: "Demande face à l'objectif", attendu: k.demandeFaceALObjectif, calcul: `${qte(k.pendant.demande)} − ${qte(k.objectif)} = ${signe(k.demandeFaceALObjectif)}` },
        ];
      },
      explication: (c) => {
        const k = du(c);
        return [
          k.demandeFaceALObjectif >= 0
            ? `Les clients ont demandé ${qte(k.pendant.demande)} articles : assez pour l'objectif, s'ils étaient tous servis.`
            : `Les clients n'ont demandé que ${qte(k.pendant.demande)} articles : même tous servis, ils ne faisaient pas l'objectif.`,
          k.pendant.repartis > 0 ? `${articles(k.pendant.repartis).replace(/^./, (x) => x.toUpperCase())} n'ont pas été servis : des clients sont repartis.` : "Tous les clients venus ont été servis.",
        ];
      },
    },
    {
      id: "pourquoi",
      type: "choix",
      titre: "Ce qui explique l'écart",
      notions: ["dashboard", "conversion_rate"],
      tableau: (c) => tableauDuSuivi(c, du(c)),
      question: (c) => `Qu'est-ce qui explique le résultat du trimestre ${du(c).trimestre}, face à l'objectif ?`,
      options: (c) => optionsDuPourquoi(du(c)),
    },
    {
      id: "et-ensuite",
      type: "choix",
      titre: "Ce que l'équipe fait ensuite",
      notions: ["dashboard"],
      question: () => "Pour le prochain trimestre de Noël, que doit faire l'équipe de vente d'abord ?",
      options: (c) => {
        const k = du(c);
        const retours: Record<Verdict, string> = {
          atteint: k.verdict === "atteint" ? `Oui : l'objectif est atteint à ${pct(k.tauxDeRealisation)}. Le prochain partira des ${qte(k.pendant.ventes)} articles vendus, plus ${qte(k.progression)} % : il sera plus haut.` : `Non : l'objectif est manqué, à ${pct(k.tauxDeRealisation)}. Il y a d'abord une cause à traiter.`,
          clients: k.verdict === "clients" ? `Oui : seuls ${qte(k.pendant.demande)} articles ont été demandés, pour un objectif de ${qte(k.objectif)}. Il faut faire venir les clients : vitrine, accueil, relance des clientes fidèles.` : `Non : ce ne sont pas les clients qui ont manqué, ${qte(k.pendant.demande)} articles ont été demandés.`,
          service:
            k.verdict === "service"
              ? `Oui : les clients étaient là, mais ${articles(k.pendant.repartis)} n'ont pas été servis. Le vendeur le signale : il faut assez de réserve pour servir chaque client qui vient.`
              : k.pendant.repartis === 0
                ? "Non : tous les clients venus ont été servis."
                : `Pas d'abord : ${articles(k.pendant.repartis)} n'ont pas été servis, mais ce n'est pas ce qui a manqué.`,
        };
        return (Object.keys(ACTIONS) as Verdict[]).map((v) => ({ texte: ACTIONS[v], juste: v === k.verdict, retour: retours[v] }));
      },
    },
    {
      id: "jusqu-ou-viser",
      type: "curseur",
      titre: "Jusqu'où l'objectif tenait ?",
      notions: ["dashboard"],
      question: (c) => {
        const k = du(c);
        return `L'objectif ajoutait ${qte(k.progression)} % aux ventes de l'année d'avant. Faites varier cette progression : une droite donne l'objectif, l'autre les ${qte(k.pendant.ventes)} articles vraiment vendus. Placez le curseur sur la plus forte progression que l'équipe aurait atteinte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Progression de l'objectif", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: progressionAtteinte(ficheDe(c)), min: 0, max: 20 }),
      zones: ["L'objectif est atteint", "L'objectif est manqué"],
      rates: () => ({
        dessous: "L'équipe aurait encore atteint cet objectif : cherchez la plus forte progression.",
        dessus: "Avec cette progression, l'objectif dépasse ce que l'équipe a vendu : visez moins haut.",
      }),
      montrer: "Montrer la progression",
      lecture: (c, q) => {
        const k = du(c);
        return [
          { libelle: "Objectif", montant: objectifSur(k.avant.ventes, q) },
          { libelle: "Articles vendus", montant: k.pendant.ventes, fort: true },
          { libelle: "Écart", montant: k.pendant.ventes - objectifSur(k.avant.ventes, q) },
        ];
      },
      droites: (c) => {
        const k = du(c);
        return { produit: () => k.pendant.ventes, cout: (q) => objectifSur(k.avant.ventes, q), libelles: ["Articles vendus", "Objectif"] };
      },
      explication: (c) => {
        const k = du(c);
        const q = progressionAtteinte(ficheDe(c));
        return [
          `Jusqu'à ${qte(q)} %, l'objectif (${qte(objectifSur(k.avant.ventes, q))} articles) tenait. À ${qte(k.progression)} %, il en demandait ${qte(k.objectif)} : ${k.ecart < 0 ? `il a manqué ${articles(k.ecart)}` : "il est atteint"}.`,
          `Un objectif se pose avant le trimestre : trop bas, il ne pousse pas l'équipe ; trop haut, il la décourage.${k.verdict === "service" ? " Ici, ce n'est pas la règle qui a fait manquer l'objectif, c'est la réserve." : ""}`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-reserve",
      type: "simulation",
      titre: "Le laboratoire de la réserve de Noël",
      notions: ["dashboard", "stock"],
      question: (c) => {
        const k = du(c);
        return `Au trimestre ${k.trimestre} de ${an(k.annee)}, ${qte(k.pendant.demande)} articles ont été demandés, et la réserve n'en a servi que ${qte(k.pendant.ventes)}. Faites varier les articles qu'il aurait fallu avoir de plus en réserve : les ventes, les clients repartis et le taux de réalisation se refont. Relevez le défi.`;
      },
      leviers: () => [{ code: "enPlus", libelle: "Articles de plus en réserve pour Noël", unite: "articles", ...RESERVE_ESSAYEE, depart: 0 }],
      lecture: (c, p) => {
        const x = trimestreAvecPlusDeReserve(ficheDe(c), p.enPlus!);
        const depart = trimestreAvecPlusDeReserve(ficheDe(c), 0);
        return [
          { libelle: "Articles vendus", montant: x.ventes, unite: "articles", reference: depart.ventes },
          { libelle: "Articles demandés sans être servis", montant: x.repartis, unite: "articles", reference: depart.repartis, fort: true },
          { libelle: "Taux de réalisation", montant: x.tauxDeRealisation, unite: "%", reference: depart.tauxDeRealisation },
          { libelle: "Part de la demande servie", montant: x.tauxDeService, unite: "%", reference: depart.tauxDeService },
        ];
      },
      graphique: (c) => ({
        levier: "enPlus",
        courbes: [
          { libelle: "Articles vendus", valeur: (p) => trimestreAvecPlusDeReserve(ficheDe(c), p.enPlus!).ventes },
          { libelle: "Objectif", valeur: () => du(c).objectif },
        ],
        unite: "articles",
      }),
      defi: (c) => {
        const juste = reservePourTousLesServir(ficheDe(c));
        return {
          consigne: `Trouvez le moins d'articles de plus en réserve, par paquets de ${qte(RESERVE_ESSAYEE.pas)}, qui sert tous les clients venus à Noël.`,
          atteint: (p) => p.enPlus === juste,
          indice: (p) => {
            const x = trimestreAvecPlusDeReserve(ficheDe(c), p.enPlus!);
            return x.repartis > 0 ? `${articles(x.repartis)} restent demandés sans être servis : il faut plus de réserve.` : `Tous les clients sont servis, mais avec moins de réserve aussi ? Cherchez le plus petit paquet qui suffit.`;
          },
          solution: { enPlus: juste },
        };
      },
      explication: (c, p) => {
        const x = trimestreAvecPlusDeReserve(ficheDe(c), p.enPlus!);
        return [
          `Défi relevé : avec ${qte(x.enPlus)} articles de plus en réserve, la boutique sert les ${qte(x.ventes)} articles demandés. L'objectif de ${qte(x.objectif)} est largement atteint : ${pct(x.tauxDeRealisation)}.`,
          "L'objectif était à portée : il manquait de quoi servir les clients. Le suivi des ventes dit à l'équipe ce qu'il faut préparer pour le prochain Noël.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const annee = suiviDeLAnnee(ficheDe(c));
        const atteints = annee.filter((k) => k.verdict === "atteint").length;
        const fauteDeClients = annee.filter((k) => k.verdict === "clients").map((k) => k.trimestre);
        const fauteDeService = annee.filter((k) => k.verdict === "service").map((k) => k.trimestre);
        const aux = (t: readonly number[]) => `${t.length > 1 ? "Aux trimestres" : "Au trimestre"} ${t.map(qte).join(" et ")}`;
        const lignes = [
          `Le tableau suit toute l'année N − 1 avec la même règle : chaque trimestre, les ventes du même trimestre de l'année d'avant plus ${qte(PROGRESSION_EN_POURCENT)} %. Chez ${c.entreprise}, l'objectif est atteint ${qte(atteints)} ${atteints > 1 ? "trimestres" : "trimestre"} sur ${qte(annee.length)}.`,
          "Un écart se calcule, puis s'explique : sont-ils venus, les clients ? Ont-ils été servis ?",
        ];
        if (fauteDeClients.length > 0) lignes.push(`${aux(fauteDeClients)}, il est venu moins de clients que l'objectif : il faut les faire venir.`);
        if (fauteDeService.length > 0) lignes.push(`${aux(fauteDeService)}, les clients étaient là, mais la réserve n'a pas suivi : il faut de quoi les servir.`);
        lignes.push("Dans l'arène, les chiffres de votre entreprise seront différents : le suivi sera le même.");
        return lignes;
      },
      repere: () => "Taux de réalisation = réalisé ÷ objectif × 100. Au-dessus de 100 %, l'objectif est atteint.",
    },
  ],
};
