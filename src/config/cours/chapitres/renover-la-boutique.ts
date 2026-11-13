import { arrondi2 as auCentime, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  FINANCEMENT_DE_LA_RENOVATION,
  PROJET_DE_RENOVATION,
  bilanDeLaBoutique,
  creditBailDeLaRenovation,
  empruntDeLaRenovation,
  projetDeRenovation,
  tauxQuiAnnuleLaVan,
  tresorerieAGarder,
} from "../monde/comptes-de-la-boutique";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";
import { DIVIDENDE_DEMANDE } from "./le-bilan-et-le-bfr-de-la-boutique";

/**
 * CHAPITRE : RÉNOVER LA BOUTIQUE (BTS MCO, bloc 3, palier 4), à la suite du cas « Fermé pour travaux ».
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts : la marge du
 * mois, ce que cinq jours de fermeture en font perdre, les ventes manquées) et ses comptes
 * (monde/comptes-de-la-boutique.ts : la marge d'un article de N − 1, le rayonnage amorti à la fin de N,
 * la trésorerie après le dividende, le projet et ses financements).
 *
 * L'objet : un investissement se juge sur les flux de trésorerie qu'il apporte, pas sur son prix. Le
 * chapitre calcule les flux nets du projet (la marge des ventes en plus, les charges, l'impôt,
 * l'amortissement qui ne se décaisse pas, la fermeture de l'année 1), le délai de récupération, la VAN
 * à 8 % et le taux qui l'annule ; puis il compare les financements : la trésorerie, un emprunt à
 * annuités constantes (son tableau, le coût du crédit) et un crédit-bail.
 *
 * Le piège central : le délai de récupération dit quand l'argent revient, pas combien le projet
 * rapporte ; et le financement le moins cher n'est pas toujours possible : il dépend de la trésorerie
 * qu'il faut garder.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, les-flux, l-annee-des-travaux, le-delai (la formule au repère) ;
 *   · l'expérience avant la formule : predire-la-van puis le-taux-au-curseur (la VAN selon le taux
 *     d'actualisation) avant la-van ; le laboratoire des ventes de la borne (les articles en plus et la
 *     durée des travaux ; le graphique de la VAN selon les ventes) ;
 *   · autonome : la-van, l-emprunt, le-credit-bail ;
 *   · expert : le-delai-ne-suffit-pas (une critique), la-borne-qui-vend-moins (une variante) ; puis la
 *     décision et la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la VAN se donne au centime, à un centime près (à cinq centimes,
 * avant), chaque flux actualisé arrondi au centime avant la somme ; le délai de récupération et
 * l'indice de profitabilité sont des grandeurs, au centième.
 */

export const ENTREPRISES_DE_LA_RENOVATION: readonly string[] = ["boutique"];

export const POURQUOI_LA_BOUTIQUE_RENOVATION =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît la marge, le rayonnage et la trésorerie : sa rénovation se joue chez elle, quelle que soit votre entreprise.";

/** Les bornes du curseur du taux d'actualisation, en %. */
export const TAUX_DU_CURSEUR = { min: 0, max: 25 } as const;

/** Le laboratoire : les articles en plus par an et les jours de fermeture ; le défi, une VAN positive avec au plus 405 articles. */
export const ARTICLES_DU_LABORATOIRE = { min: 300, max: 700, pas: 5 } as const;
export const ARTICLES_MAXIMUM_DU_DEFI = 405;
export const DEPART_DU_LABORATOIRE = { articles: 500, jours: 5 } as const;
export const SOLUTION_DU_LABORATOIRE = { articles: 405, jours: 3 } as const;

/** LA VARIANTE (hypothèse du cours) : la borne déçoit, la rénovation ne fait vendre que 300 articles de plus par an. */
export const ARTICLES_DE_LA_VARIANTE = 300;

const qte = nombreAuCentieme;

export const ficheDeLaRenovation = (c: Pick<Cas, "code">): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

/** Tout ce que le chapitre et son cas demandent. */
export function renovationDeLaBoutique(c: Pick<Cas, "code">) {
  const f = ficheDeLaRenovation(c);
  const p = projetDeRenovation(f);
  const accelere = projetDeRenovation(f, { joursDeFermeture: PROJET_DE_RENOVATION.fermeture.joursAcceleres });
  const variante = projetDeRenovation(f, { articlesEnPlus: ARTICLES_DE_LA_VARIANTE });
  const tri = tauxQuiAnnuleLaVan(f);
  const emprunt = empruntDeLaRenovation(p.investissement);
  const creditBail = creditBailDeLaRenovation(p.investissement);
  const tresorerie = bilanDeLaBoutique(f, { dividende: DIVIDENDE_DEMANDE }).tresorerieNette;
  const aGarder = tresorerieAGarder(f);
  const annee2 = p.annees[1]!;
  const annee1 = p.annees[0]!;
  const mois = Math.round(((p.delaiDeRecuperation ?? 0) % 1) * 12);
  return {
    f,
    p,
    accelere,
    variante,
    tri,
    emprunt,
    creditBail,
    tresorerie,
    aGarder,
    tresorerieApres: auCentime(tresorerie - p.investissement),
    annee1,
    annee2,
    delai: auCentime(p.delaiDeRecuperation ?? 0),
    delaiEnAnsEtMois: { ans: Math.floor(p.delaiDeRecuperation ?? 0), mois },
    /** Le plus petit nombre d'articles en plus qui garde la VAN positive, avec 5 jours de travaux. */
    articlesAuSeuil: (() => {
      let n = 0;
      while (n < 10_000 && projetDeRenovation(f, { articlesEnPlus: n }).van < 0) n++;
      return n;
    })(),
    // L'erreur classique : juger le projet sur la somme des flux, sans actualiser.
    sommeDesFlux: auCentime(p.annees.reduce((t, a) => t + a.flux, 0)),
  };
}

export type RenovationDeLaBoutique = ReturnType<typeof renovationDeLaBoutique>;

/** Le projet : le document de départ. */
export function tableauDuProjet(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = renovationDeLaBoutique(c);
  const pr = PROJET_DE_RENOVATION;
  return {
    titre: `${x.f.entreprise} · le projet de rénovation, au début de N + 1`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Rayonnage modulable", valeurs: [eur(pr.rayonnage)] },
      { libelle: "Borne de commande en ligne", valeurs: [eur(pr.borne)] },
      { libelle: "Durée d'amortissement, linéaire", valeurs: [`${qte(pr.duree)} ans`] },
      { libelle: "Articles vendus en plus, par an", valeurs: [qte(pr.articlesEnPlus)] },
      { libelle: "Marge d'un article, après ses coûts variables", valeurs: [eur(x.p.margeParArticle)] },
      { libelle: "Abonnement et maintenance de la borne, par an", valeurs: [eur(pr.chargesEnPlus)] },
      { libelle: `Marge perdue pendant les ${qte(pr.fermeture.jours)} jours de travaux`, valeurs: [eur(x.p.margePerdue)] },
      { libelle: "Impôt sur le résultat en plus", valeurs: [pct(pr.tauxDImpot * 100)] },
      { libelle: "Taux d'actualisation", valeurs: [pct(pr.tauxDActualisation * 100)] },
    ],
  };
}

/** Les flux du projet, année par année, pour la synthèse. */
function tableauDesFlux(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = renovationDeLaBoutique(c);
  return {
    titre: "Les flux nets de trésorerie de la rénovation",
    colonnes: ["Flux net", "Actualisé à 8 %", "Cumul"],
    lignes: x.p.annees.map((a, i) => ({ libelle: `Année ${a.annee}`, valeurs: [eur(a.flux), eur(a.actualise), eur(x.p.cumuls[i]!)] })),
  };
}

/** Le tableau d'amortissement de l'emprunt. */
function tableauDeLEmprunt(c: Pick<Cas, "code">): TableauDeDonnees {
  const e = renovationDeLaBoutique(c).emprunt;
  return {
    titre: `L'emprunt de ${eur(e.capital)} à ${pct(e.taux * 100)} sur ${qte(e.duree)} ans`,
    colonnes: ["Capital dû", "Intérêts", "Remboursé", "Annuité"],
    lignes: e.lignes.map((l) => ({ libelle: `Année ${l.annee}`, valeurs: [eur(l.debut), eur(l.interets), eur(l.amortissement), eur(l.annuite)] })),
  };
}

export const RENOVER_LA_BOUTIQUE: Chapitre = {
  code: "renover-la-boutique",
  parcours: "mco",
  palier: 4,
  blocs: ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"],
  titre: "Rénover la boutique",
  accroche:
    "Le rayonnage de l'ouverture sera amorti à la fin de l'année. Le remplacer, et ajouter une borne de commande en ligne, coûte 30 000 € et quelques jours de fermeture : le projet rapporte-t-il, et comment le payer ?",
  objectifs: [
    "Calculer les flux nets de trésorerie d'un investissement, impôt et amortissement compris",
    "Calculer le délai de récupération et la valeur actuelle nette d'un projet",
    "Trouver le taux qui annule la VAN, et lire la sensibilité du projet à ses ventes",
    "Construire le tableau d'un emprunt et comparer son coût à un crédit-bail et à l'autofinancement",
    "Décider d'investir ou non, et comment financer",
  ],
  libre: false,
  prerequis: ["seuil-du-point-de-vente", "le-bilan-et-le-bfr-de-la-boutique"],
  ensuite: ["la-valeur-actuelle-nette", "emprunt-ou-credit-bail"],
  entreprises: { codes: ENTREPRISES_DE_LA_RENOVATION, pourquoi: POURQUOI_LA_BOUTIQUE_RENOVATION },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un rayonnage en fin de vie",
      notions: ["discounting", "irr_payback"],
      tableau: tableauDuProjet,
      texte: (c) => {
        const x = renovationDeLaBoutique(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. Le rayonnage acheté à l'ouverture sera amorti à la fin de N. Le gérant veut le remplacer au début de N + 1 par un rayonnage modulable, et ajouter une borne qui commande en ligne les tailles et les coloris manquants : les ventes manquées du mois de janvier.`,
          `Les travaux ferment la boutique ${qte(PROJET_DE_RENOVATION.fermeture.jours)} jours, comme dans le cas « Fermé pour travaux » : la marge perdue est celle de ces jours, ${eur(x.p.margePerdue)}. Ou ${qte(PROJET_DE_RENOVATION.fermeture.joursAcceleres)} jours, si la boutique paie ${eur(PROJET_DE_RENOVATION.fermeture.supplement)} de supplément pour travailler le dimanche.`,
          `Ce que la simulation suppose. Les ventes en plus laissent la marge d'un article de N − 1 ; le projet dure ${qte(PROJET_DE_RENOVATION.duree)} ans, sans valeur résiduelle ; chaque euro de résultat en plus paie ${pct(PROJET_DE_RENOVATION.tauxDImpot * 100)} d'impôt ; les associés attendent ${pct(PROJET_DE_RENOVATION.tauxDActualisation * 100)} d'un euro placé dans la boutique.`,
        ];
      },
      repere: () => "Flux net de trésorerie = résultat en plus après impôt + amortissement. L'amortissement est une charge qui ne se décaisse pas : il baisse l'impôt, pas la trésorerie.",
    },
    {
      id: "les-flux",
      objectifs: [0],
      type: "montants",
      titre: "Le flux d'une année normale",
      notions: ["depreciation", "discounting"],
      tableau: tableauDuProjet,
      question: () => "Pour une année sans travaux (de l'année 2 à l'année 5), calculez l'amortissement annuel, la marge des articles en plus, le résultat en plus avant impôt (marge − abonnement − amortissement), l'impôt, puis le flux net de trésorerie.",
      champs: (c) => {
        const x = renovationDeLaBoutique(c);
        const a = x.annee2;
        const pr = PROJET_DE_RENOVATION;
        return [
          { libelle: "Amortissement annuel", attendu: x.p.amortissement, calcul: `${eur(x.p.investissement)} ÷ ${qte(pr.duree)} ans = ${eur(x.p.amortissement)}` },
          { libelle: "Marge des articles en plus", attendu: x.p.margeEnPlus, calcul: `${qte(pr.articlesEnPlus)} × ${eur(x.p.margeParArticle)} = ${eur(x.p.margeEnPlus)}` },
          { libelle: "Résultat en plus avant impôt", attendu: a.resultatAvantImpot, calcul: `${eur(x.p.margeEnPlus)} − ${eur(pr.chargesEnPlus)} − ${eur(x.p.amortissement)} = ${eur(a.resultatAvantImpot)}` },
          { libelle: "Impôt", attendu: a.impot, calcul: `${eur(a.resultatAvantImpot)} × ${pct(pr.tauxDImpot * 100)} = ${eur(a.impot)}` },
          { libelle: "Flux net de trésorerie", attendu: a.flux, calcul: `${eur(a.resultatAvantImpot)} − ${eur(a.impot)} + ${eur(x.p.amortissement)} = ${eur(a.flux)}` },
        ];
      },
      explication: (c) => {
        const x = renovationDeLaBoutique(c);
        return [
          `Le projet ne rapporte que ${eur(x.annee2.resultatNet)} de résultat par an, mais ${eur(x.annee2.flux)} de trésorerie : l'amortissement, ${eur(x.p.amortissement)}, a baissé l'impôt de ${eur(auCentime(x.p.amortissement * PROJET_DE_RENOVATION.tauxDImpot))} sans sortir de la caisse. On juge un investissement sur ses flux de trésorerie.`,
        ];
      },
    },
    {
      id: "l-annee-des-travaux",
      objectifs: [0],
      type: "montants",
      titre: "L'année des travaux",
      notions: ["discounting"],
      question: (c) => `L'année 1, la boutique ferme ${qte(PROJET_DE_RENOVATION.fermeture.jours)} jours et perd ${eur(renovationDeLaBoutique(c).p.margePerdue)} de marge. Calculez le résultat en plus avant impôt de l'année 1 (négatif s'il est une perte), l'impôt (négatif s'il est une économie), puis le flux net de trésorerie.`,
      champs: (c) => {
        const x = renovationDeLaBoutique(c);
        const a = x.annee1;
        return [
          { libelle: "Résultat en plus avant impôt, année 1", attendu: a.resultatAvantImpot, calcul: `${eur(x.annee2.resultatAvantImpot)} − ${eur(x.p.margePerdue)} = ${eur(a.resultatAvantImpot)}` },
          { libelle: "Impôt, année 1", attendu: a.impot, calcul: `${eur(a.resultatAvantImpot)} × ${pct(PROJET_DE_RENOVATION.tauxDImpot * 100)} = ${eur(a.impot)}` },
          { libelle: "Flux net de trésorerie, année 1", attendu: a.flux, calcul: `${eur(a.resultatAvantImpot)} − (${eur(a.impot)}) + ${eur(x.p.amortissement)} = ${eur(a.flux)}` },
        ];
      },
      explication: (c) => {
        const x = renovationDeLaBoutique(c);
        return [
          `L'année des travaux, le projet fait perdre ${eur(-x.annee1.resultatAvantImpot)} avant impôt ; la perte baisse l'impôt du reste de la boutique de ${eur(-x.annee1.impot)}, et le flux reste positif, ${eur(x.annee1.flux)}. La fermeture coûte ${eur(auCentime(x.annee2.flux - x.annee1.flux))} de trésorerie, après impôt.`,
        ];
      },
    },
    {
      id: "le-delai",
      objectifs: [1],
      type: "montants",
      titre: "Le délai de récupération",
      notions: ["irr_payback"],
      tableau: tableauDesFlux,
      question: (c) => `Les flux s'additionnent année après année. Calculez le cumul des flux à la fin de l'année 3, ce qu'il reste à récupérer sur les ${eur(renovationDeLaBoutique(c).p.investissement)}, puis le délai de récupération en années (au centième), la dernière année comptée au prorata de son flux.`,
      champs: (c) => {
        const x = renovationDeLaBoutique(c);
        const cumul3 = x.p.cumuls[2]!;
        const reste = auCentime(x.p.investissement - cumul3);
        return [
          { libelle: "Cumul des flux, fin de l'année 3", attendu: cumul3, calcul: `${x.p.annees.slice(0, 3).map((a) => eur(a.flux)).join(" + ")} = ${eur(cumul3)}` },
          { libelle: "Reste à récupérer", attendu: reste, calcul: `${eur(x.p.investissement)} − ${eur(cumul3)} = ${eur(reste)}` },
          { libelle: "Délai de récupération (années)", nature: "grandeur", attendu: x.delai, calcul: `3 + ${eur(reste)} ÷ ${eur(x.p.annees[3]!.flux)} = ${qte(x.delai)} ans` },
        ];
      },
      explication: (c) => {
        const x = renovationDeLaBoutique(c);
        return [`La rénovation est remboursée en ${qte(x.delaiEnAnsEtMois.ans)} ans et ${qte(x.delaiEnAnsEtMois.mois)} mois, avant la fin de ses ${qte(PROJET_DE_RENOVATION.duree)} ans. Mais un euro de l'année 4 ne vaut pas un euro d'aujourd'hui : la VAN en tient compte.`];
      },
    },
    {
      id: "predire-la-van",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur la VAN",
      notions: ["discounting"],
      question: (c) => {
        const x = renovationDeLaBoutique(c);
        return `Avant de calculer, pariez. Les ${qte(PROJET_DE_RENOVATION.duree)} flux font ${eur(x.sommeDesFlux)} en tout, pour ${eur(x.p.investissement)} investis. Actualisés à 8 %, ils vaudront…`;
      },
      options: (c) => {
        const x = renovationDeLaBoutique(c);
        const voir = "Faites varier le taux d'actualisation à l'étape suivante : le curseur montre jusqu'où la VAN reste positive.";
        const actualises = x.p.van + x.p.investissement;
        return [
          { texte: "Moins que leur somme, mais plus que l'investissement", juste: actualises < x.sommeDesFlux && actualises > x.p.investissement, retour: `Bon pari. ${voir}` },
          { texte: "Leur somme : l'actualisation ne change rien", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Moins que l'investissement : le projet ne rapporte pas", juste: actualises < x.p.investissement, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-taux-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Le taux qui annule la VAN",
      notions: ["discounting", "irr_payback"],
      question: (c) => {
        const x = renovationDeLaBoutique(c);
        return `Faites varier le taux d'actualisation, de ${qte(TAUX_DU_CURSEUR.min)} à ${qte(TAUX_DU_CURSEUR.max)} %. Une courbe donne la valeur actuelle des flux, l'autre l'investissement, ${eur(x.p.investissement)}. Placez le curseur sur le plus haut taux entier où la VAN reste positive ou nulle, puis validez.`;
      },
      grandeur: () => ({ libelle: "Taux d'actualisation", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: renovationDeLaBoutique(c).tri, min: TAUX_DU_CURSEUR.min, max: TAUX_DU_CURSEUR.max }),
      zones: ["La VAN est positive", "La VAN est négative"],
      rates: () => ({
        dessous: "À ce taux, la VAN est encore positive : vous pouvez aller plus loin.",
        dessus: "À ce taux, la VAN est déjà négative : cherchez plus bas.",
      }),
      montrer: "Montrer le taux qui annule la VAN",
      lecture: (c, t) => {
        const x = renovationDeLaBoutique(c);
        const p = projetDeRenovation(x.f, { tauxDActualisation: t / 100 });
        return [
          { libelle: "Valeur actuelle des flux", montant: auCentime(p.van + p.investissement) },
          { libelle: "Investissement", montant: p.investissement },
          { libelle: "Valeur actuelle nette", montant: p.van, fort: true },
        ];
      },
      droites: (c) => {
        const x = renovationDeLaBoutique(c);
        return {
          produit: (t) => x.p.annees.reduce((s, a) => s + a.flux * (1 + t / 100) ** -a.annee, 0),
          cout: () => x.p.investissement,
          libelles: ["Valeur actuelle des flux", "Investissement"],
        };
      },
      explication: (c) => {
        const x = renovationDeLaBoutique(c);
        return [
          `La VAN reste positive jusqu'à ${pct(x.tri)} : c'est, à l'entier près, le taux de rentabilité interne du projet. Les associés en attendent ${pct(PROJET_DE_RENOVATION.tauxDActualisation * 100)} : le projet rapporte plus que ce qu'ils exigent, avec de la marge.`,
        ];
      },
    },
    {
      id: "la-van",
      objectifs: [1],
      type: "montants",
      titre: "La VAN à 8 %",
      notions: ["discounting"],
      tableau: tableauDesFlux,
      question: () => "Sans formule cette fois. Actualisez à 8 % le flux de l'année 1 et celui de l'année 5, puis calculez la VAN du projet et son indice de profitabilité (au centième).",
      champs: (c) => {
        const x = renovationDeLaBoutique(c);
        const a1 = x.p.annees[0]!;
        const a5 = x.p.annees[4]!;
        const somme = auCentime(x.p.van + x.p.investissement);
        return [
          { libelle: "Flux de l'année 1, actualisé", attendu: a1.actualise, calcul: `${eur(a1.flux)} × 1,08^−1 = ${eur(a1.actualise)}` },
          { libelle: "Flux de l'année 5, actualisé", attendu: a5.actualise, calcul: `${eur(a5.flux)} × 1,08^−5 = ${eur(a5.actualise)}` },
          { libelle: "Valeur actuelle nette", attendu: x.p.van, calcul: `${x.p.annees.map((a) => eur(a.actualise)).join(" + ")} − ${eur(x.p.investissement)} = ${eur(x.p.van)}` },
          { libelle: "Indice de profitabilité", nature: "grandeur", attendu: auCentime(x.p.indiceDeProfitabilite), calcul: `${eur(somme)} ÷ ${eur(x.p.investissement)} = ${qte(auCentime(x.p.indiceDeProfitabilite))}` },
        ];
      },
      explication: (c) => {
        const x = renovationDeLaBoutique(c);
        return [`Au taux qu'exigent les associés, le projet crée ${eur(x.p.van)} de valeur : chaque euro investi en rend ${qte(auCentime(x.p.indiceDeProfitabilite))}, actualisé. Une VAN positive dit qu'il faut investir ; reste à savoir comment payer.`];
      },
    },
    {
      id: "le-laboratoire-de-la-borne",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de la borne",
      notions: ["discounting", "irr_payback"],
      question: () =>
        "Et si la borne vendait moins ? Faites varier les articles vendus en plus chaque année et la durée des travaux (5 jours, ou 3 jours avec le supplément du dimanche). Le tableau suit le flux de l'année 1, celui des années suivantes, le délai de récupération et la VAN ; le graphique trace la VAN selon les ventes. Puis relevez le défi.",
      leviers: () => [
        { code: "articles", libelle: "Articles en plus, par an", unite: "articles", min: ARTICLES_DU_LABORATOIRE.min, max: ARTICLES_DU_LABORATOIRE.max, pas: ARTICLES_DU_LABORATOIRE.pas, depart: DEPART_DU_LABORATOIRE.articles },
        {
          code: "jours",
          libelle: "Durée des travaux",
          unite: "jours",
          min: PROJET_DE_RENOVATION.fermeture.joursAcceleres,
          max: PROJET_DE_RENOVATION.fermeture.jours,
          pas: 2,
          depart: DEPART_DU_LABORATOIRE.jours,
          choix: [
            { valeur: PROJET_DE_RENOVATION.fermeture.joursAcceleres, libelle: `${PROJET_DE_RENOVATION.fermeture.joursAcceleres} jours, avec le supplément` },
            { valeur: PROJET_DE_RENOVATION.fermeture.jours, libelle: `${PROJET_DE_RENOVATION.fermeture.jours} jours` },
          ],
        },
      ],
      lecture: (c, pos) => {
        const x = renovationDeLaBoutique(c);
        const l = projetDeRenovation(x.f, { articlesEnPlus: pos.articles!, joursDeFermeture: pos.jours! });
        const d = x.p;
        return [
          { libelle: "Flux de l'année 1", montant: l.annees[0]!.flux, reference: d.annees[0]!.flux },
          { libelle: "Flux des années 2 à 5", montant: l.annees[1]!.flux, reference: d.annees[1]!.flux },
          { libelle: "Délai de récupération", montant: auCentime(l.delaiDeRecuperation ?? 99), reference: auCentime(d.delaiDeRecuperation ?? 99), unite: "ans" },
          { libelle: "Valeur actuelle nette", montant: l.van, reference: d.van, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = renovationDeLaBoutique(c);
        return {
          levier: "articles",
          courbes: [
            { libelle: "Valeur actuelle des flux", valeur: (pos) => { const l = projetDeRenovation(x.f, { articlesEnPlus: pos.articles!, joursDeFermeture: pos.jours! }); return auCentime(l.van + l.investissement); } },
            { libelle: "Investissement", valeur: () => x.p.investissement },
          ],
        };
      },
      defi: (c) => {
        const x = renovationDeLaBoutique(c);
        const van = (pos: Readonly<Record<string, number>>) => projetDeRenovation(x.f, { articlesEnPlus: pos.articles!, joursDeFermeture: pos.jours! }).van;
        return {
          consigne: `Le gérant craint que la borne ne vende pas plus de ${qte(ARTICLES_MAXIMUM_DU_DEFI)} articles par an. Trouvez une position, à ${qte(ARTICLES_MAXIMUM_DU_DEFI)} articles au plus, où la VAN reste positive ou nulle.`,
          atteint: (pos) => pos.articles! <= ARTICLES_MAXIMUM_DU_DEFI && van(pos) >= 0,
          indice: (pos) => {
            if (pos.articles! > ARTICLES_MAXIMUM_DU_DEFI) return `Le défi suppose au plus ${qte(ARTICLES_MAXIMUM_DU_DEFI)} articles en plus : descendez les ventes, et cherchez ce qui sauve la VAN.`;
            return `À ${qte(pos.articles!)} articles, la VAN est de ${eur(van(pos))}. Chaque jour de fermeture coûte de la marge : regardez aussi la durée des travaux.`;
          },
          solution: SOLUTION_DU_LABORATOIRE,
        };
      },
      montrer: "Montrer une position qui garde la VAN",
      explication: (c, pos) => {
        const x = renovationDeLaBoutique(c);
        const l = projetDeRenovation(x.f, { articlesEnPlus: pos.articles!, joursDeFermeture: pos.jours! });
        return [
          `À ${qte(pos.articles!)} articles et ${qte(pos.jours!)} jours de travaux, la VAN est de ${eur(l.van)}. Avec 5 jours de travaux, le projet tient tant que la borne vend au moins ${qte(x.articlesAuSeuil)} articles par an : c'est sa vraie fragilité. Les jours de fermeture ne départagent qu'au bord du seuil (les travaux accélérés gagnent ${eur(auCentime(x.accelere.van - x.p.van))} de VAN).`,
        ];
      },
    },
    {
      id: "la-borne-qui-vend-moins",
      objectifs: [2],
      type: "montants",
      titre: "Variante : la borne déçoit",
      notions: ["discounting"],
      question: () => `Variante : la rénovation ne fait vendre que ${qte(ARTICLES_DE_LA_VARIANTE)} articles de plus par an. Calculez le flux net d'une année normale, puis la VAN à 8 %, un montant négatif s'il y a destruction de valeur.`,
      champs: (c) => {
        const x = renovationDeLaBoutique(c);
        const v = x.variante;
        return [
          {
            libelle: "Flux net d'une année normale",
            attendu: v.annees[1]!.flux,
            calcul: `(${qte(ARTICLES_DE_LA_VARIANTE)} × ${eur(v.margeParArticle)} − ${eur(PROJET_DE_RENOVATION.chargesEnPlus)} − ${eur(v.amortissement)}) × 0,75 + ${eur(v.amortissement)} = ${eur(v.annees[1]!.flux)}`,
          },
          { libelle: "Valeur actuelle nette", attendu: v.van, calcul: `${v.annees.map((a) => eur(a.actualise)).join(" + ")} − ${eur(v.investissement)} = ${eur(v.van)}` },
        ];
      },
      explication: (c) => {
        const x = renovationDeLaBoutique(c);
        return [`Avec ${qte(ARTICLES_DE_LA_VARIANTE)} articles, la VAN tombe à ${eur(x.variante.van)} : le projet ne paie plus ce que les associés exigent. Toute la décision repose sur une prévision de ventes : il faut la discuter avant de signer.`];
      },
    },
    {
      id: "le-delai-ne-suffit-pas",
      objectifs: [1],
      type: "choix",
      titre: "Le délai de récupération suffit-il ?",
      notions: ["irr_payback", "discounting"],
      question: (c) => `Un associé ne regarde que le délai de récupération : « ${qte(renovationDeLaBoutique(c).delai)} ans, c'est trop long pour une boutique, je refuse. » Qu'en dites-vous ?`,
      options: () => [
        {
          texte: "Le délai dit quand l'argent revient, pas ce qu'il rapporte",
          juste: true,
          retour: "Oui. Le délai de récupération mesure un risque : plus il est court, plus vite la boutique retrouve sa mise. Mais il ne compte ni la dernière année et demie de flux, ni le fait qu'un euro de l'année 4 vaut moins qu'aujourd'hui. La VAN, elle, dit si le projet crée de la valeur.",
        },
        { texte: "Il a raison : un projet doit se rembourser en moins de trois ans", juste: false, retour: "Aucune règle ne fixe trois ans : le délai acceptable dépend de la durée de vie de l'investissement, ici 5 ans." },
        { texte: "Il se trompe : le délai se calcule sur les flux actualisés", juste: false, retour: "On peut l'actualiser, mais ce n'est pas l'erreur de l'associé : le délai, actualisé ou non, ne dit pas combien le projet rapporte." },
      ],
    },
    {
      id: "l-emprunt",
      objectifs: [3],
      type: "montants",
      titre: "L'emprunt et son tableau",
      notions: ["loan_schedule"],
      tableau: tableauDeLEmprunt,
      question: (c) => {
        const e = renovationDeLaBoutique(c).emprunt;
        return `La banque propose ${eur(e.capital)} à ${pct(e.taux * 100)} sur ${qte(e.duree)} ans, par annuités constantes. Calculez l'annuité (capital × taux ÷ (1 − 1,045^−5)), les intérêts et le capital remboursé de l'année 1, puis le coût total du crédit.`;
      },
      champs: (c) => {
        const e = renovationDeLaBoutique(c).emprunt;
        const l = e.lignes[0]!;
        return [
          { libelle: "Annuité", attendu: e.annuite, calcul: `${eur(e.capital)} × 0,045 ÷ (1 − 1,045^−5) = ${eur(e.annuite)}` },
          { libelle: "Intérêts de l'année 1", attendu: l.interets, calcul: `${eur(e.capital)} × ${pct(e.taux * 100)} = ${eur(l.interets)}` },
          { libelle: "Capital remboursé l'année 1", attendu: l.amortissement, calcul: `${eur(e.annuite)} − ${eur(l.interets)} = ${eur(l.amortissement)}` },
          { libelle: "Coût du crédit", attendu: e.coutDuCredit, calcul: `${qte(e.duree)} × ${eur(e.annuite)} − ${eur(e.capital)} = ${eur(e.coutDuCredit)}` },
        ];
      },
      explication: (c) => {
        const e = renovationDeLaBoutique(c).emprunt;
        return [`L'annuité ne bouge pas, mais sa composition change : les intérêts baissent avec le capital dû, le remboursement monte. Le crédit coûte ${eur(e.coutDuCredit)} sur ${qte(e.duree)} ans.`];
      },
    },
    {
      id: "le-credit-bail",
      objectifs: [3],
      type: "montants",
      titre: "Le crédit-bail",
      notions: ["loan_schedule"],
      question: (c) => {
        const k = renovationDeLaBoutique(c).creditBail;
        return `Le loueur propose ${qte(k.duree)} redevances annuelles de ${eur(k.redevance)}, puis une option d'achat de ${eur(k.optionDAchat)}. Calculez ce que la boutique versera en tout, puis le surcoût sur le prix des équipements.`;
      },
      champs: (c) => {
        const x = renovationDeLaBoutique(c);
        const k = x.creditBail;
        return [
          { libelle: "Total versé", attendu: k.total, calcul: `${qte(k.duree)} × ${eur(k.redevance)} + ${eur(k.optionDAchat)} = ${eur(k.total)}` },
          { libelle: "Surcoût du crédit-bail", attendu: k.surcout, calcul: `${eur(k.total)} − ${eur(x.p.investissement)} = ${eur(k.surcout)}` },
        ];
      },
      explication: (c) => {
        const x = renovationDeLaBoutique(c);
        return [
          `Le crédit-bail coûte ${eur(x.creditBail.surcout)}, plus que l'emprunt (${eur(x.emprunt.coutDuCredit)}). Il a ses avantages : aucun apport, et le matériel n'entre au bilan que si la boutique lève l'option. La comparaison fine, après impôt, se fait dans le chapitre « Emprunt ou crédit-bail ».`,
        ];
      },
    },
    {
      id: "decider",
      objectifs: [4],
      type: "choix",
      titre: "Investir, et comment payer ?",
      notions: ["discounting", "loan_schedule"],
      question: (c) => {
        const x = renovationDeLaBoutique(c);
        return `Après le dividende de ${eur(DIVIDENDE_DEMANDE)}, la trésorerie de la boutique est de ${eur(x.tresorerie)} ; elle veut en garder ${eur(x.aGarder)}, et la placerait sinon à ${pct(FINANCEMENT_DE_LA_RENOVATION.tauxDePlacement * 100)}. Que répondez-vous au gérant ?`;
      },
      options: (c) => {
        const x = renovationDeLaBoutique(c);
        return [
          {
            texte: "Investir, et payer sur la trésorerie",
            juste: true,
            retour: `Oui : il en resterait ${eur(x.tresorerieApres)}. La VAN est positive (${eur(x.p.van)}) ; la trésorerie paie les ${eur(x.p.investissement)} et garde plus que les ${eur(x.aGarder)} voulus. Emprunter à ${pct(x.emprunt.taux * 100)} pour garder un argent placé à ${pct(FINANCEMENT_DE_LA_RENOVATION.tauxDePlacement * 100)} coûterait la différence ; l'emprunt reste la solution si les associés veulent garder leur trésorerie.`,
          },
          { texte: `Investir, en crédit-bail, pour ne rien sortir`, juste: false, retour: `Le crédit-bail coûte ${eur(x.creditBail.surcout)}, le plus cher des trois ; il se justifie quand la boutique n'a ni trésorerie ni capacité d'emprunt, ce qui n'est pas le cas.` },
          { texte: `Ne pas investir : le délai de ${qte(x.delai)} ans est trop long`, juste: false, retour: `Non : le projet se rembourse avant la fin de sa durée et crée ${eur(x.p.van)} de valeur au taux qu'exigent les associés.` },
          { texte: "Investir, et emprunter : un projet se finance toujours à crédit", juste: false, retour: `Non : rien ne l'impose. L'emprunt coûterait ${eur(x.emprunt.coutDuCredit)} d'intérêts quand la trésorerie, placée, rapporte moins que le taux du prêt.` },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["discounting", "irr_payback", "loan_schedule"],
      tableau: tableauDesFlux,
      texte: (c) => {
        const x = renovationDeLaBoutique(c);
        return [
          "Un investissement se juge sur ses flux nets de trésorerie : le résultat qu'il ajoute, après impôt, plus l'amortissement qui ne se décaisse pas. Le délai de récupération dit quand la mise revient ; la VAN, si le projet rapporte plus que le taux exigé ; le taux qui l'annule, jusqu'où.",
          `La rénovation de ${x.f.entreprise} coûte ${eur(x.p.investissement)}, se récupère en ${qte(x.delai)} ans, et crée ${eur(x.p.van)} de valeur à 8 % ; sa VAN reste positive jusqu'à ${pct(x.tri)}. Elle repose sur les ventes de la borne : à ${qte(ARTICLES_DE_LA_VARIANTE)} articles par an, la VAN devient négative.`,
          `Pour la payer : la trésorerie, si elle garde de quoi vivre ; l'emprunt, à annuités constantes, ${eur(x.emprunt.coutDuCredit)} d'intérêts ; le crédit-bail, ${eur(x.creditBail.surcout)} de surcoût, sans apport.`,
          "Au niveau de l'examen, vous savez calculer les flux d'un projet, son délai de récupération, sa VAN et le taux qui l'annule, construire le tableau d'un emprunt, comparer trois financements et décider.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "VAN = − investissement + Σ flux × (1 + t)^−n. Annuité constante = capital × t ÷ (1 − (1 + t)^−n). Coût du crédit = somme des annuités − capital emprunté.",
    },
  ],
};
