import { arrondi2, eur, nombreAuCentieme, pct as pourcent } from "../../../pedagogy/cours/deux-decimales";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import {
  POLITIQUE_ENVISAGEE,
  SANS_STOCK,
  VENTES_PREVUES_APRES_JUIN,
  budgetDesVentes,
  budgetsDeProduction,
  ecartDeTresorerieAuTrenteJuin,
  tresorerieAvecLeStock,
  type PolitiqueDeStock,
} from "../monde/budgets-operationnels";
import { budgetDeTresorerie, tableauDeBord } from "../monde/couts-et-budgets";
import { GESTION_DU_COURS, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DES VENTES AUX ACHATS, L'ENCHAÎNEMENT DES BUDGETS (contrôle de gestion, palier 4 ;
 * BTS CG P5 5.4.2, DCG UE11, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le semestre de NOVA du budget de trésorerie
 * (monde/nova-gestion.ts), les mêmes ventes, le même prix, les mêmes jeux de composants. Les budgets
 * opérationnels se calculent dans monde/budgets-operationnels.ts, et entrent dans le budget de
 * trésorerie du modèle (monde/couts-et-budgets.ts) par son levier `jeuxAchetes`.
 *
 * L'objet : la démarche budgétaire, des ventes aux achats. Le budget des ventes en quantités et en
 * valeur ; la fiche d'abord (sans stock, la production vaut les ventes, les achats valent les
 * consommations : c'est le budget de trésorerie du chapitre précédent) ; puis la politique de stock
 * que le dirigeant étudie en janvier, qui fait bâtir le budget de production compte tenu du stock
 * d'enceintes et celui des approvisionnements compte tenu du stock de jeux, jusqu'aux paiements au
 * fournisseur. Le piège central : le stock ne change pas le résultat, il change la trésorerie, et
 * il la creuse dès janvier, quand il se constitue.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, l-ordre-des-budgets, le-budget-des-ventes, le-flux-tendu, la-politique-de-stock,
 *     le-budget-de-production et le-budget-des-approvisionnements (les formules sont au repère et
 *     dans la question) ;
 *   · autonome : janvier-sans-aide, le-paiement-au-fournisseur, le-point-bas (ni formule ni chiffres
 *     donnés : l'élève les prend dans les tableaux) ;
 *   · l'expérience avant la formule : predire-le-resultat puis le-stock-au-curseur (le stock de jeux
 *     souhaité, le point bas face au matelas) avant ce-que-coute-le-stock ;
 *   · le laboratoire : le-laboratoire-des-stocks (les deux stocks et le délai du fournisseur), avec
 *     un graphique du point bas selon le stock de jeux ;
 *   · expert : ce-que-coute-le-stock (à rebours), le-controle-de-vraisemblance, l-interdependance ;
 *     puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les enceintes, les jeux et les productions sont des quantités
 * : le corrigé écrit le stock de la politique à deux décimales, puis l'unité supérieure ; les taux
 * s'écrivent à deux décimales.
 */

/** Les budgets opérationnels se bâtissent sur le semestre de NOVA. */
export const ENTREPRISES_DES_BUDGETS: readonly string[] = ["nova"];

/** Le mois que le chapitre bâtit pas à pas : avril, le premier du deuxième trimestre. */
export const MOIS_GUIDE = 3;

/** Le mois que l'élève refait seul : janvier, celui où les stocks se constituent. */
export const MOIS_AUTONOME = 0;

/** Les bornes du curseur du stock de jeux souhaité, en % de la production du mois suivant. */
export const STOCK_DE_JEUX_DU_CURSEUR = { min: 0, max: 40 } as const;

/** Les leviers du laboratoire : les deux stocks (en %), et le délai du fournisseur (en jours, au plus le plafond légal de 60 jours). */
export const LEVIERS_DU_LABORATOIRE = {
  enceintes: { min: 0, max: 30, pas: 1 },
  jeux: { min: 0, max: 50, pas: 1 },
  fournisseur: { min: 0, max: 60, pas: 1 },
} as const;

/** La commande que CampusTech annonce en février pour mai, hypothèse de l'étape sur l'interdépendance. */
export const COMMANDE_ANNONCEE = { mois: 4, enceintes: 100 } as const;

const qte = nombreAuCentieme;
const pct = (t: number) => pourcent(t * 100);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const NOMS_APRES_JUIN = ["juillet", "août"] as const;

const donnee = (valeur: number, unite?: string): CelluleACompleter => ({ valeur, ...(unite ? { unite } : {}) });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

/** La fiche où CampusTech prend `enPlus` enceintes de plus le mois `mois`. */
export function ficheAvecUneCommande(f: FicheDeGestion, mois: number, enPlus: number): FicheDeGestion {
  return {
    ...f,
    semestre: { ...f.semestre, clienteles: f.semestre.clienteles.map((c) => (c.code === "campustech" ? { ...c, quantites: c.quantites.map((q, k) => (k === mois ? q + enPlus : q)) } : c)) },
  };
}

/** Une position du laboratoire, lue en politique de stock et en délai du fournisseur. */
export function laboratoireDesStocks(f: FicheDeGestion, p: Readonly<Record<string, number>>) {
  const politique: PolitiqueDeStock = { enceintes: p.enceintes! / 100, jeux: p.jeux! / 100 };
  const b = budgetsDeProduction(f, politique);
  const t = tresorerieAvecLeStock(f, politique, { delaiFournisseur: p.fournisseur! });
  return {
    plusBas: t.plusBas,
    juin: t.tresorerieFin,
    composantsEnStock: b.stocksDeFin.composantsHt,
    productionDuTrimestre: b.productionParTrimestre[1]!,
    dettesFournisseurs: t.fin.dettesFournisseurs,
    resultat: tableauDeBord(f, { delaiFournisseur: p.fournisseur!, jeuxAchetes: b.jeuxAchetes }).semestre.resultat,
  };
}

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois par entreprise (la fiche est figée). */
export function budgetsDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre(c);
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = f.semestre;
  const m = f.moisDeReference;
  const tva = s.tauxDeTva;
  const P = POLITIQUE_ENVISAGEE;
  const ventes = budgetDesVentes(f);
  const fiche = budgetsDeProduction(f, SANS_STOCK);
  const stock = budgetsDeProduction(f, P);
  const tFiche = budgetDeTresorerie(f);
  const tStock = tresorerieAvecLeStock(f, P);
  const matelas = f.seuilsDAlerte.tresorerie;
  const k = MOIS_GUIDE;
  const part = s.clienteles.find((x) => x.code === "particuliers")!;
  const ct = s.clienteles.find((x) => x.code === "campustech")!;
  const t2 = [k, k + 1, k + 2];
  const chiffreDuTrimestre = arrondi2(t2.reduce((t, i) => t + ventes.valeurs[i]!, 0));

  // Le curseur : le plus fort stock de jeux (en %) qui garde le point bas au matelas, enceintes à la politique.
  const positions = Array.from({ length: STOCK_DE_JEUX_DU_CURSEUR.max - STOCK_DE_JEUX_DU_CURSEUR.min + 1 }, (_, i) => STOCK_DE_JEUX_DU_CURSEUR.min + i);
  const pointBasAuStock = (j: number) => tresorerieAvecLeStock(f, { enceintes: P.enceintes, jeux: j / 100 }).plusBas.tresorerie;
  const jeuxMax = Math.max(...positions.filter((j) => pointBasAuStock(j) >= matelas));

  // Le laboratoire : le plus court délai du fournisseur qui fait tenir la politique au matelas.
  const depart = { enceintes: Math.round(P.enceintes * 100), jeux: Math.round(P.jeux * 100), fournisseur: s.fournisseur.delai };
  const L = LEVIERS_DU_LABORATOIRE;
  const delais = Array.from({ length: L.fournisseur.max - L.fournisseur.min + 1 }, (_, i) => L.fournisseur.min + i);
  const fournisseurMin = Math.min(...delais.filter((d) => laboratoireDesStocks(f, { ...depart, fournisseur: d }).plusBas.tresorerie >= matelas));

  // L'interdépendance : la commande annoncée pour mai, et les mois où chaque budget bouge.
  const g = ficheAvecUneCommande(f, COMMANDE_ANNONCEE.mois, COMMANDE_ANNONCEE.enceintes);
  const avecLaCommande = budgetsDeProduction(g, P);
  const achatsQuiBougent = avecLaCommande.mois.map((x, i) => x.achats - stock.mois[i]!.achats);
  const productionQuiBouge = avecLaCommande.mois.map((x, i) => x.production - stock.mois[i]!.production);
  const premierAchat = achatsQuiBougent.findIndex((d) => d !== 0);
  const premiereProduction = productionQuiBouge.findIndex((d) => d !== 0);

  const ecart = ecartDeTresorerieAuTrenteJuin(f, P);
  const mai = k + 1;
  return {
    f,
    s,
    m,
    tva,
    P,
    ventes,
    fiche,
    stock,
    tFiche,
    tStock,
    matelas,
    k,
    mai,
    part,
    ct,
    t2,
    chiffreDuTrimestre,
    jeuxMax,
    pointBasAuStock,
    depart,
    fournisseurMin,
    avecLaCommande,
    achatsQuiBougent,
    productionQuiBouge,
    premierAchat,
    premiereProduction,
    ecart,
    resultat: tableauDeBord(f).semestre.resultat,
    nom: (i: number) => (i < s.mois.length ? s.mois[i]!.nom : NOMS_APRES_JUIN[i - s.mois.length]!),
  };
}

export type BudgetsDuChapitre = ReturnType<typeof budgetsDuChapitre>;

/** Les ventes prévues du semestre, en enceintes, clientèle par clientèle. */
export function tableauDesVentes(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = budgetsDuChapitre(c);
  return {
    titre: `Le budget des ventes ${dE(x.f.entreprise)}, en enceintes`,
    colonnes: x.s.mois.map((m) => majuscule(m.nom)),
    lignes: [
      ...x.ventes.clienteles.map((k) => ({ libelle: k.nom, valeurs: k.quantites.map(qte) })),
      { libelle: "Total des ventes", valeurs: x.ventes.quantites.map(qte) },
    ],
  };
}

/** Les ventes prévues sur huit mois, pour les stocks souhaités : ceux de juin dépendent de juillet et d'août. */
export function tableauDesVentesPrevues(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = budgetsDuChapitre(c);
  const toutes = [...x.ventes.quantites, ...VENTES_PREVUES_APRES_JUIN];
  return {
    titre: "Les ventes prévues, toutes clientèles",
    colonnes: toutes.map((_, i) => majuscule(x.nom(i))),
    lignes: [{ libelle: "Enceintes vendues", valeurs: toutes.map(qte) }],
  };
}

/** Les budgets de production et des approvisionnements du semestre, avec la politique de stock. */
export function tableauDesBudgets(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = budgetsDuChapitre(c);
  const b = x.stock.mois;
  const ligne = (libelle: string, v: (m: (typeof b)[number]) => string) => ({ libelle, valeurs: b.map(v) });
  return {
    titre: "Les budgets de production et des approvisionnements, avec le stock",
    colonnes: x.s.mois.map((m) => majuscule(m.nom)),
    lignes: [
      ligne("Ventes", (m) => qte(m.ventes)),
      ligne("Production", (m) => qte(m.production)),
      ligne("Stock final d'enceintes", (m) => qte(m.enceintes.final)),
      ligne("Stock final de jeux", (m) => qte(m.jeux.final)),
      ligne("Jeux achetés", (m) => qte(m.achats)),
      ligne("Achats TTC, payés le mois suivant", (m) => eur(m.achatsTtc)),
    ],
  };
}

/** Le budget de trésorerie avec le stock, face à celui de la fiche. */
export function tableauDeLaTresorerie(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = budgetsDuChapitre(c);
  return {
    titre: "La trésorerie de fin de mois, avec et sans le stock",
    colonnes: x.s.mois.map((m) => majuscule(m.nom)),
    lignes: [
      { libelle: "Paiements au fournisseur, sans stock", valeurs: x.tFiche.mois.map((m) => eur(m.decaissements.fournisseur)) },
      { libelle: "Paiements au fournisseur, avec le stock", valeurs: x.tStock.mois.map((m) => eur(m.decaissements.fournisseur)) },
      { libelle: "Trésorerie de fin de mois, sans stock", valeurs: x.tFiche.mois.map((m) => eur(m.tresorerieFin)) },
      { libelle: "Trésorerie de fin de mois, avec le stock", valeurs: x.tStock.mois.map((m) => eur(m.tresorerieFin)) },
    ],
  };
}

/** Le budget de production du deuxième trimestre, à compléter. */
export function grilleDeProduction(c: Pick<Cas, "code">): TableauACompleter {
  const x = budgetsDuChapitre(c);
  const mois = x.t2.map((i) => x.stock.mois[i]!);
  const suivant = (i: number) => (i + 1 < x.s.mois.length ? x.stock.mois[i + 1]!.ventes : x.stock.juillet.ventes);
  return {
    titre: "Le budget de production du deuxième trimestre",
    colonnes: mois.map((m) => majuscule(m.nom)),
    lignes: [
      { libelle: "Ventes prévues", cellules: mois.map((m) => donnee(m.ventes, "enceintes")) },
      {
        libelle: "Stock final souhaité d'enceintes",
        cellules: mois.map((m, j) =>
          aSaisir(m.enceintes.final, `${pct(x.P.enceintes)} × ${qte(suivant(x.t2[j]!))} = ${qte(x.P.enceintes * suivant(x.t2[j]!))}, soit ${qte(m.enceintes.final)} à l'unité supérieure`, { unite: "enceintes", indice: "une part des ventes du mois suivant" }),
        ),
      },
      {
        libelle: "Stock initial d'enceintes",
        cellules: mois.map((m, j) =>
          aSaisir(m.enceintes.initial, `le stock final ${dE(x.nom(x.t2[j]! - 1))} : ${pct(x.P.enceintes)} × ${qte(m.ventes)}, soit ${qte(m.enceintes.initial)}`, { unite: "enceintes", indice: "le stock final du mois d'avant" }),
        ),
      },
      {
        libelle: "Production",
        fort: true,
        totalDe: { plus: [0, 1], moins: [2] },
        cellules: mois.map((m) => aSaisir(m.production, `${qte(m.ventes)} + ${qte(m.enceintes.final)} − ${qte(m.enceintes.initial)} = ${qte(m.production)}`, { unite: "enceintes" })),
      },
    ],
  };
}

/** Le budget des approvisionnements du deuxième trimestre, à compléter. */
export function grilleDesApprovisionnements(c: Pick<Cas, "code">): TableauACompleter {
  const x = budgetsDuChapitre(c);
  const mois = x.t2.map((i) => x.stock.mois[i]!);
  const productionSuivante = (i: number) => (i + 1 < x.s.mois.length ? x.stock.mois[i + 1]!.production : x.stock.juillet.production);
  const composants = x.m.coutVariable.composants;
  return {
    titre: "Le budget des approvisionnements du deuxième trimestre",
    colonnes: mois.map((m) => majuscule(m.nom)),
    lignes: [
      { libelle: "Consommation de jeux, un par enceinte produite", cellules: mois.map((m) => donnee(m.consommation, "jeux")) },
      {
        libelle: "Stock final souhaité de jeux",
        cellules: mois.map((m, j) =>
          aSaisir(m.jeux.final, `${pct(x.P.jeux)} × ${qte(productionSuivante(x.t2[j]!))} = ${qte(x.P.jeux * productionSuivante(x.t2[j]!))}, soit ${qte(m.jeux.final)} à l'unité supérieure`, { unite: "jeux", indice: "une part de la production du mois suivant" }),
        ),
      },
      {
        libelle: "Stock initial de jeux",
        cellules: mois.map((m, j) => aSaisir(m.jeux.initial, `le stock final ${dE(x.nom(x.t2[j]! - 1))} : ${pct(x.P.jeux)} × ${qte(m.production)}, soit ${qte(m.jeux.initial)}`, { unite: "jeux", indice: "le stock final du mois d'avant" })),
      },
      {
        libelle: "Jeux achetés",
        fort: true,
        totalDe: { plus: [0, 1], moins: [2] },
        cellules: mois.map((m) => aSaisir(m.achats, `${qte(m.consommation)} + ${qte(m.jeux.final)} − ${qte(m.jeux.initial)} = ${qte(m.achats)}`, { unite: "jeux" })),
      },
      { libelle: "Achats hors taxes", cellules: mois.map((m) => aSaisir(m.achatsHt, `${qte(m.achats)} × ${eur(composants)} = ${eur(m.achatsHt)}`, { indice: "les jeux achetés au prix d'un jeu" })) },
      { libelle: "Achats TTC, payés le mois suivant", cellules: mois.map((m) => aSaisir(m.achatsTtc, `${eur(m.achatsHt)} × ${qte(1 + x.tva)} = ${eur(m.achatsTtc)}`, { indice: "le hors taxes, TVA comprise" })) },
    ],
  };
}

export const DES_VENTES_AUX_ACHATS: Chapitre = {
  code: "des-ventes-aux-achats",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["BTS CG P5 · Analyse et prévision de l'activité", "DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "Des ventes aux achats : l'enchaînement des budgets",
  accroche:
    "Bâtir les budgets de NOVA dans l'ordre où ils se commandent : les ventes, la production compte tenu du stock d'enceintes, les approvisionnements compte tenu du stock de jeux, puis les paiements au fournisseur. Et voir ce qu'un stock de sécurité coûte en trésorerie, sans changer le résultat.",
  objectifs: [
    "Ordonner la démarche budgétaire, des ventes aux achats, et suivre ce qu'une prévision change en aval",
    "Bâtir le budget des ventes en quantités et en valeur, clientèle par clientèle",
    "Bâtir le budget de production et celui des approvisionnements compte tenu des stocks souhaités",
    "Faire entrer les achats dans le budget de trésorerie, TVA comprise",
    "Mesurer ce qu'une politique de stock coûte en trésorerie sans changer le résultat",
  ],
  libre: false,
  prerequis: ["budget-de-tresorerie"],
  ensuite: ["equilibrer-la-tresorerie"],
  entreprises: {
    codes: ENTREPRISES_DES_BUDGETS,
    pourquoi: "les budgets opérationnels se bâtissent ici sur le semestre de NOVA dans la simulation du cours, avec ses ventes, ses jeux de composants et son fournisseur ; la méthode vaut pour toute entreprise qui fabrique.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des ventes aux achats",
      notions: ["cash_budget", "stock"],
      tableau: tableauDesVentes,
      texte: (c) => {
        const x = budgetsDuChapitre(c);
        return [
          `Le budget de trésorerie ${dE(x.f.entreprise)} payait chaque mois au fournisseur les jeux de composants du mois d'avant. D'où viennent ces jeux ? D'un enchaînement de budgets, que ce chapitre bâtit dans l'ordre.`,
          `Tout part des ventes prévues. Elles disent ce qu'il faut produire, la production dit ce qu'il faut consommer de jeux, la consommation dit ce qu'il faut acheter. Les achats, enfin, disent ce qu'il faudra payer, et quand.`,
          `Ce sont les budgets opérationnels : celui des ventes, celui de la production, celui des approvisionnements. Le budget de trésorerie les reprend tous, avec les charges fixes, la TVA et l'emprunt : c'est un budget de synthèse.`,
          `Une enceinte se vend ${eur(x.m.prix)} HT et demande un jeu de composants à ${eur(x.m.coutVariable.composants)} HT, acheté chez ${x.s.fournisseur.nom} et payé le mois suivant. La TVA est de ${pct(x.tva)}.`,
        ];
      },
      repere: () =>
        "Production = ventes + stock final d'enceintes − stock initial. Consommation de jeux = production × jeux par enceinte. Achats de jeux = consommation + stock final de jeux − stock initial. Le stock final d'un mois est le stock initial du suivant.",
    },
    {
      id: "l-ordre-des-budgets",
      objectifs: [0],
      type: "choix",
      titre: "Par où commencer",
      notions: ["cash_budget"],
      question: (c) => `Le dirigeant ${dE(budgetsDuChapitre(c).f.entreprise)} prépare en décembre les budgets du semestre. Par lequel doit-il commencer ?`,
      options: () => [
        {
          texte: "Le budget des ventes",
          juste: true,
          retour:
            "Oui. Les ventes sont la contrainte de l'entreprise : on ne produit et on n'achète que pour vendre. Une erreur sur les ventes se propage donc à tous les budgets qui suivent, jusqu'à la trésorerie.",
        },
        {
          texte: "Le budget de trésorerie, qui dit ce qu'on peut dépenser",
          juste: false,
          retour: "Non : la trésorerie est la synthèse. Elle se calcule à partir des autres budgets, elle ne peut pas les précéder.",
        },
        {
          texte: "Le budget des approvisionnements, parce qu'il faut des jeux pour produire",
          juste: false,
          retour: "Non : combien de jeux acheter dépend de ce qu'on produira, qui dépend de ce qu'on vendra.",
        },
      ],
    },
    {
      id: "le-budget-des-ventes",
      objectifs: [1],
      type: "montants",
      titre: "Le budget des ventes",
      notions: ["revenue", "cash_budget"],
      tableau: tableauDesVentes,
      question: (c) => {
        const x = budgetsDuChapitre(c);
        const n = x.nom(x.k);
        return `Le budget des ventes se chiffre en quantités, puis en valeur hors taxes, au prix de ${eur(x.m.prix)}. Calculez les ventes ${dE(n)} aux particuliers en valeur, celles à CampusTech, le total ${dE(n)}, puis le chiffre d'affaires du deuxième trimestre.`;
      },
      champs: (c) => {
        const x = budgetsDuChapitre(c);
        const n = x.nom(x.k);
        const [p, ct] = x.ventes.clienteles;
        return [
          { libelle: `Ventes ${dE(n)} aux particuliers, HT`, attendu: p!.valeurs[x.k]!, calcul: `${qte(p!.quantites[x.k]!)} × ${eur(x.m.prix)} = ${eur(p!.valeurs[x.k]!)}` },
          { libelle: `Ventes ${dE(n)} à CampusTech, HT`, attendu: ct!.valeurs[x.k]!, calcul: `${qte(ct!.quantites[x.k]!)} × ${eur(x.m.prix)} = ${eur(ct!.valeurs[x.k]!)}` },
          { libelle: `Ventes ${dE(n)}, HT`, attendu: x.ventes.valeurs[x.k]!, calcul: `${eur(p!.valeurs[x.k]!)} + ${eur(ct!.valeurs[x.k]!)} = ${eur(x.ventes.valeurs[x.k]!)}` },
          {
            libelle: "Chiffre d'affaires du deuxième trimestre",
            attendu: x.chiffreDuTrimestre,
            calcul: `(${x.t2.map((i) => qte(x.ventes.quantites[i]!)).join(" + ")}) × ${eur(x.m.prix)} = ${eur(x.chiffreDuTrimestre)}`,
          },
        ];
      },
      explication: (c) => {
        const x = budgetsDuChapitre(c);
        return [
          `Le budget des ventes se tient clientèle par clientèle, parce que chacune paie à sa date : les particuliers à la commande, CampusTech bien plus tard. La valeur sert au compte de résultat ; les quantités, au budget de production.`,
          `Sur le semestre, ${x.f.entreprise} prévoit ${qte(x.ventes.totalQuantite)} enceintes, ${eur(x.ventes.totalValeur)} HT.`,
        ];
      },
    },
    {
      id: "le-flux-tendu",
      objectifs: [3],
      type: "choix",
      titre: "Sans stock, ce qu'on paie",
      notions: ["cash_budget", "payment_terms", "stock"],
      question: (c) => {
        const x = budgetsDuChapitre(c);
        return `Dans la fiche, ${x.f.entreprise} n'a aucun stock : elle produit ce qu'elle vend et achète les jeux qu'elle consomme. Le fournisseur facture le ${x.s.fournisseur.jourDeFacturation} et se paie à ${x.s.fournisseur.delai} jours. Que paie ${x.f.entreprise} au fournisseur en ${x.nom(x.mai)} ?`;
      },
      options: (c) => {
        const x = budgetsDuChapitre(c);
        const n = x.nom(x.k);
        const paye = x.tFiche.mois[x.mai]!.decaissements.fournisseur;
        const q = x.fiche.mois[x.k]!.achats;
        return [
          {
            texte: `${eur(paye)}, les jeux ${dE(n)} TTC`,
            juste: true,
            retour: `Oui. Sans stock, la production ${dE(n)} vaut ses ventes, ${qte(q)} enceintes, et les achats valent la consommation : ${qte(q)} jeux × ${eur(x.m.coutVariable.composants)} × ${qte(1 + x.tva)} = ${eur(paye)}, payés en ${x.nom(x.mai)}. C'est la ligne du fournisseur du budget de trésorerie.`,
          },
          {
            texte: `${eur(x.fiche.mois[x.k]!.achatsHt)}, les jeux ${dE(n)} hors taxes`,
            juste: false,
            retour: "Non : le fournisseur se paie toutes taxes comprises. La TVA déductible ne revient qu'avec la déclaration, le mois suivant.",
          },
          {
            texte: `${eur(x.fiche.mois[x.mai]!.achatsTtc)}, les jeux de ${x.nom(x.mai)} TTC`,
            juste: false,
            retour: `Non : à ${x.s.fournisseur.delai} jours, la facture du ${x.s.fournisseur.jourDeFacturation} se paie le mois suivant. Les jeux de ${x.nom(x.mai)} se paient en ${x.nom(x.mai + 1)}.`,
          },
        ];
      },
    },
    {
      id: "la-politique-de-stock",
      type: "lecture",
      titre: "Le stock que le dirigeant étudie",
      notions: ["stock", "cash_budget"],
      tableau: tableauDesVentesPrevues,
      texte: (c) => {
        const x = budgetsDuChapitre(c);
        return [
          `En janvier, le dirigeant étudie une autre politique : tenir un stock de sécurité. Une commande imprévue de CampusTech se servirait sans attendre, une livraison en retard n'arrêterait pas la ligne.`,
          `Chaque fin de mois, ${x.f.entreprise} garderait ${pct(x.P.enceintes)} des ventes du mois suivant en enceintes finies, et ${pct(x.P.jeux)} de la production du mois suivant en jeux. Chaque stock s'arrondit à l'unité supérieure, et les deux partent de zéro au 1er janvier.`,
          `Les stocks de juin dépendent de juillet et d'août : le tableau donne les ventes prévues jusque-là. Les autres coûts variables restent payés à la livraison, enceinte vendue par enceinte vendue. Seuls les jeux suivent la production.`,
        ];
      },
      repere: () => "Production = ventes + stock final − stock initial. Achats de jeux = consommation + stock final de jeux − stock initial de jeux.",
    },
    {
      id: "le-budget-de-production",
      objectifs: [2],
      type: "a-completer",
      titre: "Le budget de production",
      notions: ["stock", "capacity"],
      tableau: tableauDesVentesPrevues,
      question: (c) => {
        const x = budgetsDuChapitre(c);
        return `Bâtissez le budget de production du deuxième trimestre avec la politique de stock. Le stock final souhaité vaut ${pct(x.P.enceintes)} des ventes du mois suivant, à l'unité supérieure ; le stock initial est le stock final du mois d'avant. Puis calculez la production.`;
      },
      grille: grilleDeProduction,
      explication: (c) => {
        const x = budgetsDuChapitre(c);
        const j = x.stock.mois[x.k + 2]!;
        return [
          `Quand les ventes montent, le stock souhaité monte avec elles : la production dépasse les ventes. En ${j.nom}, c'est l'inverse, les ventes de ${x.nom(x.k + 3)} baissent : le stock se réduit et la production passe sous les ventes, ${qte(j.production)} enceintes pour ${qte(j.ventes)} vendues.`,
        ];
      },
    },
    {
      id: "le-budget-des-approvisionnements",
      objectifs: [2, 3],
      type: "a-completer",
      titre: "Le budget des approvisionnements",
      notions: ["stock", "cash_budget"],
      question: (c) => {
        const x = budgetsDuChapitre(c);
        return `La consommation de jeux est la production que vous venez de bâtir. Complétez le budget des approvisionnements : le stock final souhaité (${pct(x.P.jeux)} de la production du mois suivant, à l'unité supérieure ; la production de juillet est de ${qte(x.stock.juillet.production)}), le stock initial, les jeux achetés, puis leur coût hors taxes et TTC.`;
      },
      grille: grilleDesApprovisionnements,
      explication: (c) => {
        const x = budgetsDuChapitre(c);
        const a = x.stock.mois[x.k]!;
        return [
          `Les achats TTC sont la porte d'entrée du budget de trésorerie : les ${eur(a.achatsTtc)} ${dE(a.nom)} se paient en ${x.nom(x.mai)}. Leur TVA, ${eur(arrondi2(a.achatsHt * x.tva))}, se déduit sur la déclaration ${dE(a.nom)}, payée en ${x.nom(x.mai)} elle aussi.`,
        ];
      },
    },
    {
      id: "janvier-sans-aide",
      objectifs: [2],
      type: "montants",
      titre: "Janvier, sans aide",
      notions: ["stock", "cash_budget"],
      tableau: tableauDesVentesPrevues,
      question: (c) => {
        const x = budgetsDuChapitre(c);
        return `À vous, sans formule cette fois. En janvier, les deux stocks partent de zéro. Calculez le stock final d'enceintes de janvier, la production de janvier, celle de février, le stock final de jeux de janvier, les jeux achetés en janvier, puis ce que ${x.f.entreprise} paiera au fournisseur en février.`;
      },
      champs: (c) => {
        const x = budgetsDuChapitre(c);
        const j = x.stock.mois[0]!;
        const fe = x.stock.mois[1]!;
        const paye = x.tStock.mois[1]!.decaissements.fournisseur;
        return [
          { libelle: "Stock final d'enceintes de janvier", nature: "quantite", attendu: j.enceintes.final, calcul: `${pct(x.P.enceintes)} × ${qte(fe.ventes)} = ${qte(x.P.enceintes * fe.ventes)}, arrondi à l'unité supérieure : ${qte(j.enceintes.final)}` },
          { libelle: "Production de janvier", nature: "quantite", attendu: j.production, calcul: `${qte(j.ventes)} + ${qte(j.enceintes.final)} − 0 = ${qte(j.production)}` },
          { libelle: "Production de février", nature: "quantite", attendu: fe.production, calcul: `${qte(fe.ventes)} + ${qte(fe.enceintes.final)} − ${qte(fe.enceintes.initial)} = ${qte(fe.production)}` },
          { libelle: "Stock final de jeux de janvier", nature: "quantite", attendu: j.jeux.final, calcul: `${pct(x.P.jeux)} × ${qte(fe.production)} = ${qte(x.P.jeux * fe.production)}, arrondi à l'unité supérieure : ${qte(j.jeux.final)} (un jeu de moins laisserait le stock sous sa politique)` },
          { libelle: "Jeux achetés en janvier", nature: "quantite", attendu: j.achats, calcul: `${qte(j.consommation)} + ${qte(j.jeux.final)} − 0 = ${qte(j.achats)}` },
          { libelle: "Paiement au fournisseur en février", attendu: paye, calcul: `${qte(j.achats)} × ${eur(x.m.coutVariable.composants)} × ${qte(1 + x.tva)} = ${eur(paye)}` },
        ];
      },
      explication: (c) => {
        const x = budgetsDuChapitre(c);
        const j = x.stock.mois[0]!;
        return [
          `Janvier achète ${qte(j.achats)} jeux pour ${qte(j.ventes)} enceintes vendues : il paie les ventes du mois et les deux stocks, qui se constituent d'un coup. Sans stock, ${x.f.entreprise} paierait en février ${eur(x.tFiche.mois[1]!.decaissements.fournisseur)}.`,
        ];
      },
    },
    {
      id: "le-paiement-au-fournisseur",
      objectifs: [3],
      type: "montants",
      titre: "Ce que le stock change en mai",
      notions: ["cash_budget", "vat_payable"],
      tableau: tableauDesBudgets,
      question: (c) => {
        const x = budgetsDuChapitre(c);
        const n = x.nom(x.mai);
        return `Sans formule : prenez les achats dans le tableau. Calculez, avec le stock, le paiement au fournisseur en ${n}, la TVA payée en ${n} (celle ${dE(x.nom(x.k))}, sans stock ${eur(x.tFiche.mois[x.mai]!.decaissements.tva)}), puis ce que le stock fait sortir en plus en ${n}, TVA comprise.`;
      },
      champs: (c) => {
        const x = budgetsDuChapitre(c);
        const a = x.stock.mois[x.k]!;
        const sans = x.fiche.mois[x.k]!;
        const p = x.tStock.mois[x.mai]!.decaissements;
        const q = x.tFiche.mois[x.mai]!.decaissements;
        const enPlus = arrondi2(p.fournisseur + p.tva - q.fournisseur - q.tva);
        return [
          { libelle: `Paiement au fournisseur en ${x.nom(x.mai)}`, attendu: p.fournisseur, calcul: `les jeux ${dE(a.nom)} : ${qte(a.achats)} × ${eur(x.m.coutVariable.composants)} × ${qte(1 + x.tva)} = ${eur(p.fournisseur)}` },
          {
            libelle: `TVA payée en ${x.nom(x.mai)}`,
            attendu: p.tva,
            calcul: `${eur(q.tva)} − (${qte(a.achats)} − ${qte(sans.achats)}) × ${eur(x.m.coutVariable.composants)} × ${pct(x.tva)} de TVA déductible en plus = ${eur(p.tva)}`,
          },
          {
            libelle: `Ce que le stock fait sortir en plus en ${x.nom(x.mai)}`,
            attendu: enPlus,
            calcul: `(${eur(p.fournisseur)} − ${eur(q.fournisseur)}) + (${eur(p.tva)} − ${eur(q.tva)}) = ${eur(enPlus)}`,
          },
        ];
      },
      explication: (c) => {
        const x = budgetsDuChapitre(c);
        const a = x.stock.mois[x.k]!;
        const sans = x.fiche.mois[x.k]!;
        return [
          `Les ${qte(a.achats - sans.achats)} jeux achetés en plus ${dE(a.nom)} sortent TTC en ${x.nom(x.mai)}, mais leur TVA revient le même mois, en moins sur la déclaration : il ne manque que leur hors taxes, ${qte(a.achats - sans.achats)} × ${eur(x.m.coutVariable.composants)}.`,
        ];
      },
    },
    {
      id: "le-point-bas",
      objectifs: [3],
      type: "choix",
      titre: "Le nouveau point bas",
      notions: ["cash_budget", "stock"],
      tableau: tableauDeLaTresorerie,
      question: (c) => {
        const x = budgetsDuChapitre(c);
        const b = x.tStock.plusBas;
        return `Avec le stock, le point bas du semestre tombe en ${b.nom}, à ${eur(b.tresorerie)}, sous le matelas de ${eur(x.matelas)} que le dirigeant veut garder. Sans stock, ${b.nom} finissait à ${eur(x.tFiche.plusBas.tresorerie)}. Qu'est-ce qui creuse ${b.nom} ?`;
      },
      options: (c) => {
        const x = budgetsDuChapitre(c);
        const b = x.tStock.plusBas;
        const i = x.s.mois.findIndex((m) => m.nom === b.nom);
        const cumul = x.stock.mois.slice(0, i).reduce((t, m, j) => t + m.achats - x.fiche.mois[j]!.achats, 0);
        return [
          {
            texte: "Les deux stocks, payés dès février",
            juste: true,
            retour: `Oui. Les jeux achetés en plus de janvier à ${x.nom(i - 1)}, ${qte(cumul)}, sont payés avant la fin ${dE(b.nom)}. Ils dorment dans les stocks : la trésorerie les a avancés.`,
          },
          {
            texte: `Les ventes ${dE(b.nom)}, plus faibles qu'avant`,
            juste: false,
            retour: "Non : les ventes sont les mêmes que sans stock. Le stock change les achats et leurs dates, pas ce qui se vend.",
          },
          {
            texte: "Le prix des jeux, plus cher quand on en achète plus",
            juste: false,
            retour: `Non : le jeu coûte ${eur(x.m.coutVariable.composants)} HT dans les deux budgets. Ce sont les quantités achetées qui changent.`,
          },
          {
            texte: `Le stock de juin, déjà payé en ${b.nom}`,
            juste: false,
            retour: `Non : un achat se paie le mois suivant. En ${b.nom}, ${x.f.entreprise} paie les jeux de ${x.nom(i - 1)}, pas ceux de juin.`,
          },
        ];
      },
    },
    {
      id: "predire-le-resultat",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur le résultat",
      notions: ["stock", "income_statement"],
      question: (c) => {
        const x = budgetsDuChapitre(c);
        return `Avant de manipuler, pariez. Avec le stock, ${x.f.entreprise} achète ${qte(x.ecart.jeuxEnPlusJusquEnMai)} jeux de plus jusqu'en mai. Le résultat du semestre, ${eur(x.resultat)} sans stock, sera…`;
      },
      options: () => {
        const voir = "Faites varier le stock de jeux à l'étape suivante : le tableau montre le point bas, la trésorerie du 30 juin et le résultat.";
        return [
          { texte: "Le même", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Plus bas : ces jeux sont des charges en plus", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus haut : un stock est un actif", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-stock-au-curseur",
      objectifs: [4],
      type: "curseur",
      titre: "Le stock de jeux, au curseur",
      notions: ["stock", "cash_budget"],
      question: (c) => {
        const x = budgetsDuChapitre(c);
        return `Le stock d'enceintes reste à ${pct(x.P.enceintes)} des ventes du mois suivant. Faites varier le stock de jeux souhaité, de ${qte(STOCK_DE_JEUX_DU_CURSEUR.min)} à ${qte(STOCK_DE_JEUX_DU_CURSEUR.max)} % de la production du mois suivant. Une droite donne le point bas du semestre, l'autre le matelas de ${eur(x.matelas)}. Placez le curseur sur le plus fort stock qui garde le matelas, puis validez.`;
      },
      grandeur: () => ({ libelle: "Stock de jeux souhaité, en % de la production du mois suivant", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => {
        const x = budgetsDuChapitre(c);
        return { attendu: x.jeuxMax, min: STOCK_DE_JEUX_DU_CURSEUR.min, max: STOCK_DE_JEUX_DU_CURSEUR.max };
      },
      zones: ["Au-dessus du matelas", "Sous le matelas"],
      rates: () => ({
        dessous: "Le point bas reste au-dessus du matelas : un stock de jeux plus fort tiendrait encore.",
        dessus: "À ce stock, le point bas passe sous le matelas.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, j) => {
        const x = budgetsDuChapitre(c);
        const p = { enceintes: Math.round(x.P.enceintes * 100), jeux: j, fournisseur: x.s.fournisseur.delai };
        const l = laboratoireDesStocks(x.f, p);
        return [
          { libelle: "Composants en stock au 30 juin, HT", montant: l.composantsEnStock },
          { libelle: "Résultat du semestre", montant: l.resultat },
          { libelle: "Trésorerie au 30 juin", montant: l.juin },
          { libelle: "Trésorerie la plus basse du semestre", montant: l.plusBas.tresorerie, fort: true },
        ];
      },
      droites: (c) => {
        const x = budgetsDuChapitre(c);
        return { produit: (j) => x.pointBasAuStock(j), cout: () => x.matelas, libelles: ["Trésorerie la plus basse du semestre", "Le matelas"] };
      },
      explication: (c) => {
        const x = budgetsDuChapitre(c);
        return [
          `Au plus ${qte(x.jeuxMax)} % de stock de jeux, le point bas tient au-dessus du matelas : ${eur(x.pointBasAuStock(x.jeuxMax))}. Au-delà, il passe dessous.`,
          `Le résultat, lui, n'a pas bougé : ${eur(x.resultat)}. Un jeu en stock n'est pas consommé ; il ne devient une charge que le jour où l'enceinte qui le contient se vend. Mais il a été payé.`,
        ];
      },
    },
    {
      id: "ce-que-coute-le-stock",
      objectifs: [4],
      type: "montants",
      titre: "Ce que coûte le stock, à rebours",
      notions: ["stock", "cash_budget", "bfr"],
      tableau: tableauDesBudgets,
      question: (c) => {
        const x = budgetsDuChapitre(c);
        return `Sans formule : avec la politique de ${pct(x.P.enceintes)} et ${pct(x.P.jeux)}, calculez les jeux achetés en plus de janvier à mai, ce que le stock retire à la trésorerie du 30 juin, puis cette trésorerie (sans stock : ${eur(x.tFiche.tresorerieFin)}).`;
      },
      champs: (c) => {
        const x = budgetsDuChapitre(c);
        const mai = x.stock.mois[x.mai]!;
        return [
          {
            libelle: "Jeux achetés en plus de janvier à mai",
            nature: "quantite",
            attendu: x.ecart.jeuxEnPlusJusquEnMai,
            calcul: `ce sont les stocks du 31 mai, partis de zéro : ${qte(mai.enceintes.final)} enceintes, un jeu chacune, et ${qte(mai.jeux.final)} jeux, soit ${qte(x.ecart.jeuxEnPlusJusquEnMai)}`,
          },
          {
            libelle: "Ce que le stock retire à la trésorerie du 30 juin",
            attendu: -x.ecart.montant,
            calcul: `${qte(x.ecart.jeuxEnPlusJusquEnMai)} × ${eur(x.m.coutVariable.composants)} HT = ${eur(-x.ecart.montant)} : payés TTC le mois suivant, leur TVA revient avec la déclaration`,
          },
          { libelle: "Trésorerie au 30 juin, avec le stock", attendu: x.tStock.tresorerieFin, calcul: `${eur(x.tFiche.tresorerieFin)} − ${eur(-x.ecart.montant)} = ${eur(x.tStock.tresorerieFin)}` },
        ];
      },
      explication: (c) => {
        const x = budgetsDuChapitre(c);
        return [
          `Le stock immobilise de l'argent : ${eur(-x.ecart.montant)} au 30 juin, la valeur hors taxes des stocks du 31 mai. Les jeux achetés en plus en juin ne se paieront qu'en juillet.`,
          "C'est le besoin en fonds de roulement : un stock en plus, c'est de la trésorerie en moins, à résultat égal.",
        ];
      },
    },
    {
      id: "le-laboratoire-des-stocks",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire des stocks",
      notions: ["stock", "cash_budget", "payment_terms"],
      question: () =>
        "Faites varier le stock d'enceintes, le stock de jeux et le délai du fournisseur : le tableau suit le point bas, la trésorerie du 30 juin, les stocks et le résultat. Relevez le défi, puis cherchez ce que chaque levier change.",
      leviers: (c) => {
        const x = budgetsDuChapitre(c);
        const L = LEVIERS_DU_LABORATOIRE;
        return [
          { code: "enceintes", libelle: "Stock d'enceintes, en % des ventes du mois suivant", unite: "%", ...L.enceintes, depart: x.depart.enceintes },
          { code: "jeux", libelle: "Stock de jeux, en % de la production du mois suivant", unite: "%", ...L.jeux, depart: x.depart.jeux },
          { code: "fournisseur", libelle: "Délai de paiement du fournisseur", unite: "jours", ...L.fournisseur, depart: x.depart.fournisseur },
        ];
      },
      lecture: (c, p) => {
        const x = budgetsDuChapitre(c);
        const l = laboratoireDesStocks(x.f, p);
        const d = laboratoireDesStocks(x.f, x.depart);
        return [
          { libelle: "Production du deuxième trimestre", montant: l.productionDuTrimestre, unite: "enceintes", reference: d.productionDuTrimestre },
          { libelle: "Composants en stock au 30 juin, HT", montant: l.composantsEnStock, reference: d.composantsEnStock },
          { libelle: "Dettes fournisseurs au 30 juin", montant: l.dettesFournisseurs, reference: d.dettesFournisseurs },
          { libelle: "Résultat du semestre", montant: l.resultat, reference: d.resultat },
          { libelle: "Trésorerie au 30 juin", montant: l.juin, reference: d.juin },
          { libelle: "Trésorerie la plus basse du semestre", montant: l.plusBas.tresorerie, reference: d.plusBas.tresorerie, fort: true },
        ];
      },
      graphique: (c) => {
        const x = budgetsDuChapitre(c);
        return {
          levier: "jeux",
          courbes: [
            { libelle: "Trésorerie la plus basse du semestre", valeur: (p) => laboratoireDesStocks(x.f, p).plusBas.tresorerie },
            { libelle: "Le matelas", valeur: () => x.matelas },
          ],
        };
      },
      defi: (c) => {
        const x = budgetsDuChapitre(c);
        return {
          consigne: `Tenez au moins la politique étudiée, ${pct(x.P.enceintes)} d'enceintes et ${pct(x.P.jeux)} de jeux, sans que la trésorerie passe sous le matelas de ${eur(x.matelas)}.`,
          atteint: (p) => p.enceintes! >= x.depart.enceintes && p.jeux! >= x.depart.jeux && laboratoireDesStocks(x.f, p).plusBas.tresorerie >= x.matelas,
          indice: (p) => {
            const l = laboratoireDesStocks(x.f, p);
            if (p.enceintes! < x.depart.enceintes || p.jeux! < x.depart.jeux) return "Le défi demande au moins la politique étudiée : remontez les stocks, et cherchez un autre levier.";
            return `${majuscule(l.plusBas.nom)} finit à ${eur(l.plusBas.tresorerie)}. Les stocks se paient : cherchez à les payer plus tard.`;
          },
          solution: { ...x.depart, fournisseur: x.fournisseurMin },
        };
      },
      explication: (c, p) => {
        const x = budgetsDuChapitre(c);
        const l = laboratoireDesStocks(x.f, p);
        return [
          `Défi relevé : le point bas est ${l.plusBas.nom}, à ${eur(l.plusBas.tresorerie)}, et le résultat vaut toujours ${eur(l.resultat)}.`,
          `Payé à ${qte(x.fournisseurMin)} jours au moins, le fournisseur attend un mois de plus : il finance les stocks à la place de ${x.f.entreprise}. Le code de commerce plafonne ce délai à 60 jours après la facture.`,
          "Les stocks et les délais changent la trésorerie ; ils ne changent pas le résultat. Le budget des approvisionnements dit combien acheter, le budget de trésorerie dit si on peut le payer.",
        ];
      },
    },
    {
      id: "le-controle-de-vraisemblance",
      objectifs: [2],
      type: "choix",
      titre: "Le budget est-il vraisemblable ?",
      notions: ["capacity", "stock"],
      tableau: tableauDesBudgets,
      question: (c) => {
        const x = budgetsDuChapitre(c);
        const j = x.stock.mois.find((m) => m.production === x.stock.productionLaPlusForte)!;
        return `Avant de le transmettre, le contrôleur vérifie le budget. Avec le stock, ${j.nom} produit ${qte(j.production)} enceintes ; l'activité normale est de ${qte(x.stock.activiteNormale)} par mois, et la ligne en fait au plus ${qte(x.stock.capaciteDuTrimestre)} par trimestre. Le deuxième trimestre en demande ${qte(x.stock.productionParTrimestre[1]!)}. Que conclut-il ?`;
      },
      options: (c) => {
        const x = budgetsDuChapitre(c);
        const t = x.stock.productionParTrimestre[1]!;
        return [
          {
            texte: "Le budget tient : le trimestre reste sous la capacité",
            juste: true,
            retour: `Oui. ${qte(t)} enceintes au trimestre, c'est moins que les ${qte(x.stock.capaciteDuTrimestre)} de la ligne. Dépasser un peu l'activité normale un mois se fait sans heures de nuit : la capacité est le plafond, l'activité normale un repère.`,
          },
          {
            texte: "Une anomalie : un mois dépasse l'activité normale, il faut tout refaire",
            juste: false,
            retour: "Non : l'activité normale n'est pas un plafond. C'est la capacité du trimestre qui dirait si la production est possible.",
          },
          {
            texte: "Une anomalie : la production devrait toujours valoir les ventes",
            juste: false,
            retour: "Non : avec un stock, la production s'écarte des ventes, et c'est voulu. Elle les dépasse quand le stock monte, elle passe dessous quand il baisse.",
          },
        ];
      },
    },
    {
      id: "l-interdependance",
      objectifs: [0],
      type: "choix",
      titre: "Une prévision qui change",
      notions: ["stock", "cash_budget"],
      question: (c) => {
        const x = budgetsDuChapitre(c);
        return `En février, CampusTech annonce ${qte(COMMANDE_ANNONCEE.enceintes)} enceintes de plus en ${x.nom(COMMANDE_ANNONCEE.mois)}, payées comme les autres, en retard. Avec la politique de stock, quel est le premier mois dont un budget opérationnel change ?`;
      },
      options: (c) => {
        const x = budgetsDuChapitre(c);
        const a = x.premierAchat;
        const d = x.achatsQuiBougent[a]!;
        return [
          {
            texte: `${majuscule(x.nom(a))}, par les achats de jeux`,
            juste: true,
            retour: `Oui. Les ventes de ${x.nom(COMMANDE_ANNONCEE.mois)} relèvent le stock d'enceintes souhaité ${dE(x.nom(x.premiereProduction))}, donc la production ${dE(x.nom(x.premiereProduction))}, qui relève le stock de jeux souhaité ${dE(x.nom(a))} : ${qte(d)} jeux de plus à acheter dès ${x.nom(a)}. Une prévision se propage en remontant le temps.`,
          },
          {
            texte: `${majuscule(x.nom(COMMANDE_ANNONCEE.mois))}, le mois de la commande`,
            juste: false,
            retour: `Non : avec un stock, ce qu'on vend en ${x.nom(COMMANDE_ANNONCEE.mois)} se prépare avant. La production et les achats bougent plus tôt.`,
          },
          {
            texte: "Aucun : le stock de sécurité absorbe la commande",
            juste: false,
            retour: "Non : le stock servirait une commande imprévue. Celle-ci est annoncée : les budgets doivent la prévoir, et le stock se recalcule sur les nouvelles ventes.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["cash_budget", "stock"],
      tableau: tableauDesBudgets,
      texte: (c) => {
        const x = budgetsDuChapitre(c);
        return [
          `Vous avez bâti les budgets ${dE(x.f.entreprise)} dans l'ordre où ils se commandent. Les ventes d'abord, ${qte(x.ventes.totalQuantite)} enceintes et ${eur(x.ventes.totalValeur)} HT sur le semestre. Puis la production, compte tenu du stock d'enceintes, les approvisionnements, compte tenu du stock de jeux, et les paiements au fournisseur, qui entrent dans le budget de trésorerie.`,
          `Sans stock, les achats valent les ventes : c'est le budget de trésorerie du chapitre précédent. Avec la politique étudiée, le point bas tombe à ${eur(x.tStock.plusBas.tresorerie)} en ${x.tStock.plusBas.nom}, et le 30 juin perd ${eur(-x.ecart.montant)} ; le résultat ne bouge pas.`,
          "Au niveau de l'examen, vous savez ordonner la démarche budgétaire, bâtir les budgets des ventes, de production et des approvisionnements, en tirer les décaissements, contrôler leur vraisemblance, et suivre une prévision qui change d'un budget à l'autre.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la démarche, elle, est la même.",
        ];
      },
      repere: () =>
        "Ventes → production (ventes + stock final − stock initial) → consommation → achats (consommation + stock final − stock initial) → décaissements, le mois de l'échéance du fournisseur → budget de trésorerie.",
    },
  ],
};
