import { eur, pct as enPoints } from "../../../pedagogy/cours/deux-decimales";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { EXERCICES_DU_COURS, type FicheDeLExercice } from "../monde/exercice-de-nova";
import { DELAI_CONVENU_DE_CAMPUSTECH } from "../monde/nova-gestion";
import { REMBOURSEMENT_ANTICIPE, tableauDeFinancement, type TableauDeFinancement } from "../monde/tableaux-de-flux";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE TABLEAU DE FINANCEMENT (comptabilité générale, palier 4 ; BTS CG P6 6.6.1, DCG UE6).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le premier exercice de NOVA, sa clôture
 * (monde/cloture.ts) et son bilan fonctionnel, ceux du chapitre « Bilan fonctionnel et BFR » ; le
 * tableau se calcule dans monde/tableaux-de-flux.ts. Le bilan d'ouverture est vide (NOVA naît le
 * 2 janvier) : c'est le tableau d'un premier exercice, colonne « N − 1 » vide, et chaque variation
 * vaut le poste du 31 décembre.
 *
 * L'objet : le modèle du plan comptable en deux parties. La partie I range les emplois et les
 * ressources stables de l'exercice (la ligne, le capital remboursé ; la capacité d'autofinancement,
 * l'apport, l'emprunt reçu) et en tire la variation du fonds de roulement net global. La partie II
 * dit où cette variation est allée : le besoin d'exploitation (en valeurs brutes), le hors
 * exploitation, la trésorerie. Puis ce qui change l'une sans toucher l'autre, et la lecture du
 * tableau : comment l'exercice a été financé, ce qu'un premier exercice ne dit pas.
 *
 * LES TEMPS DU CHAPITRE :
 *   · guidé : intro, emplois-ou-ressources, la-partie-1 (les montants sont dans la question) ;
 *   · l'expérience avant la formule : predire-la-tresorerie avant la partie I ; predire-la-partie-2
 *     avant la partie II ; predire-le-remboursement puis le-laboratoire-du-tableau (les délais et un
 *     remboursement anticipé ; un graphique des trois variations selon le remboursement) ;
 *   · autonome : la-verification, la-partie-2 (ni montants ni formule dans la question) ;
 *   · expert : les-valeurs-brutes, lire-le-tableau, les-ratios-du-tableau, un-premier-exercice ; et
 *     la synthèse.
 *
 * MATIÈRE : le cours du propriétaire sur le tableau de financement (introduction, partie I,
 * partie II : les rubriques, le sens des variations, la vérification par deux bilans successifs),
 * adapté à NOVA.
 */

/** Le tableau de financement se lit sur un exercice tenu en comptabilité : celui de NOVA. */
export const ENTREPRISES_DU_TABLEAU_DE_FINANCEMENT: readonly string[] = ["nova"];

/** Les leviers du laboratoire : les délais de CampusTech et du fournisseur (en jours), le remboursement anticipé (en euros). */
export const LEVIERS_DU_TABLEAU = {
  campustech: { min: 30, max: 120, pas: 5 },
  fournisseur: { min: 0, max: 60, pas: 1 },
  remboursement: { min: 0, max: REMBOURSEMENT_ANTICIPE.max, pas: REMBOURSEMENT_ANTICIPE.pas },
} as const;

/** Le défi du laboratoire : rembourser au moins cette somme par anticipation. */
export const REMBOURSEMENT_DU_DEFI = 40_000;

/** La solution que montre la correction : le fournisseur à 51 jours, 40 000 € remboursés. */
export const SOLUTION_DU_TABLEAU = { delaiFournisseur: 51, remboursement: REMBOURSEMENT_DU_DEFI } as const;

/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** Un montant signé : « + 93 297,07 € », « − 1 372,38 € ». */
const signe = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);

const donnee = (valeur: number | null): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, indice?: string): CelluleACompleter => ({ valeur, saisir: true, calcul, ...(indice ? { indice } : {}) });

/** La fiche de l'exercice du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLExercice => EXERCICES_DU_COURS[c.code]!;

/** Le tableau de financement de l'exercice, avec ce que le chapitre en tire. */
export function financementDuChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = tableauDeFinancement(f);
  const fo = t.k.fonctionnel;
  const p = t.partie2;
  const k = t.k;
  const dotations = k.caf.dotations;
  return {
    f,
    t,
    entreprise: f.entreprise,
    fo,
    p,
    resultat: k.resultatNet,
    dotations,
    amortissements: k.soldes["6811"] ?? 0,
    depreciation: k.soldes["6817"] ?? 0,
    provision: k.soldes["6815"] ?? 0,
    interetsPayes: auCentime((k.soldes["6611"] ?? 0) - (-(k.soldes["1688"] ?? 0))),
    impot: k.impot.impot,
    placement: auCentime((k.soldes[f.placement.compte] ?? 0) + (k.soldes[f.placement.compteDesInteretsCourus] ?? 0)),
    /** La part de la capacité d'autofinancement dans les ressources de l'exercice. */
    partDeLaCaf: Math.round((t.ressources.caf / t.totalDesRessources) * 10_000) / 10_000,
    /** L'autofinancement : la CAF moins les dividendes de l'exercice. */
    autofinancement: auCentime(t.ressources.caf - t.emplois.dividendes),
    /** La couverture des acquisitions par l'autofinancement. */
    couverture: Math.round(((t.ressources.caf - t.emplois.dividendes) / t.emplois.acquisitions) * 10_000) / 10_000,
    /** La part de la variation du fonds de roulement que le besoin absorbe. */
    partAbsorbee: Math.round((p.variationDuBesoin / t.variationDuFondsDeRoulement) * 10_000) / 10_000,
    /** Ce que la création a apporté de l'extérieur : l'apport et l'emprunt reçu. */
    externe: auCentime(t.ressources.augmentationDeCapital + t.ressources.nouveauxEmprunts),
  };
}

export type FinancementDuChapitre = ReturnType<typeof financementDuChapitre>;

/** Une position du laboratoire : les délais et le remboursement anticipé. */
export function laboratoireDuTableau(f: FicheDeLExercice, p: Readonly<Record<string, number>>): TableauDeFinancement {
  return tableauDeFinancement(f, { delaiCampusTech: p.delaiCampusTech!, delaiFournisseur: p.delaiFournisseur! }, { remboursementAnticipe: p.remboursement! });
}

/** Le départ du laboratoire : la fiche, sans remboursement anticipé. */
export const departDuTableau = (f: FicheDeLExercice) => ({ delaiCampusTech: f.campustech.delai, delaiFournisseur: f.fournisseur.delai, remboursement: 0 });

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

/** Le bilan fonctionnel à l'ouverture (vide) et au 31 décembre : ce que le tableau explique. */
export function deuxBilansFonctionnels(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = financementDuChapitre(c);
  const fo = x.fo;
  const r = fo.ressourcesStables;
  const ligne = (libelle: string, montant: number) => ({ libelle, valeurs: [eur(0), eur(montant)] });
  return {
    titre: `Le bilan fonctionnel ${dE(x.entreprise)}, à l'ouverture et au 31 décembre`,
    colonnes: ["Ouverture", "31 décembre"],
    lignes: [
      ligne("Emplois stables (la ligne, en brut)", fo.emploisStables),
      ligne("Capitaux propres (capital et résultat)", r.capitauxPropres),
      ligne("Amortissements et dépréciations", r.amortissementsEtDepreciations),
      ligne("Provision pour litige", r.provisions),
      ligne("Emprunt, capital restant dû", r.dettesFinancieres),
      ligne("Fonds de roulement net global", fo.fondsDeRoulement),
      ligne("Stock de composants", x.p.stocks),
      ligne("Créances d'exploitation, en brut", x.p.creancesDExploitation),
      ligne("Dettes d'exploitation", x.p.dettesDExploitation),
      ligne("Dettes hors exploitation (impôt, intérêts courus)", x.p.autresCrediteurs),
      ligne("Besoin en fonds de roulement", fo.besoinEnFondsDeRoulement),
      ligne("Trésorerie nette (banque, compte à terme)", fo.tresorerieNette),
    ],
  };
}

/** Ce que l'exercice a fait, en flux : la CAF, la création, l'emprunt. */
export function lesFluxDeLExercice(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = financementDuChapitre(c);
  const t = x.t;
  return {
    titre: `${x.entreprise}, l'exercice en quelques flux`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Capacité d'autofinancement (chapitre des soldes intermédiaires)", valeurs: [eur(t.ressources.caf)] },
      { libelle: "Apport des associés en capital, le 2 janvier", valeurs: [eur(t.ressources.augmentationDeCapital)] },
      { libelle: "Emprunt reçu le 3 janvier", valeurs: [eur(t.ressources.nouveauxEmprunts)] },
      { libelle: "Capital remboursé aux échéances de l'année", valeurs: [eur(t.emplois.remboursements)] },
      { libelle: "Ligne de montage achetée le 6 janvier, hors taxes", valeurs: [eur(t.emplois.acquisitions)] },
      { libelle: "Dividendes mis en paiement", valeurs: [eur(t.emplois.dividendes)] },
      { libelle: "Cessions d'immobilisations", valeurs: [eur(t.ressources.cessions)] },
    ],
  };
}

/** LA PARTIE I, à compléter : les emplois, les ressources, la variation du fonds de roulement. */
export function grilleDeLaPartie1(c: Pick<Cas, "code">): TableauACompleter {
  const x = financementDuChapitre(c);
  const t = x.t;
  const e = t.emplois;
  const r = t.ressources;
  return {
    titre: "Tableau de financement, partie I",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Distributions mises en paiement", cellules: [donnee(e.dividendes)] },
      { libelle: "Acquisitions d'immobilisations", cellules: [aSaisir(e.acquisitions, `la ligne de montage, hors taxes : ${eur(e.acquisitions)}`, "le prix de la ligne, sans sa TVA")] },
      { libelle: "Remboursements de dettes financières", cellules: [aSaisir(e.remboursements, `${eur(r.nouveauxEmprunts)} reçus − ${eur(t.empruntRestant)} restant dus = ${eur(e.remboursements)}`, "le capital emprunté moins ce qui reste dû")] },
      { libelle: "Total des emplois", fort: true, totalDe: { plus: [0, 1, 2] }, cellules: [aSaisir(t.totalDesEmplois, `${eur(e.dividendes)} + ${eur(e.acquisitions)} + ${eur(e.remboursements)} = ${eur(t.totalDesEmplois)}`)] },
      { libelle: "Capacité d'autofinancement", cellules: [aSaisir(r.caf, `celle des soldes intermédiaires : ${eur(r.caf)}`)] },
      { libelle: "Cessions d'immobilisations", cellules: [donnee(r.cessions)] },
      { libelle: "Augmentation des capitaux propres", cellules: [aSaisir(r.augmentationDeCapital, `l'apport des associés : ${eur(r.augmentationDeCapital)}`)] },
      { libelle: "Augmentation des dettes financières", cellules: [aSaisir(r.nouveauxEmprunts, `l'emprunt reçu le 3 janvier : ${eur(r.nouveauxEmprunts)}`)] },
      { libelle: "Total des ressources", fort: true, totalDe: { plus: [4, 5, 6, 7] }, cellules: [aSaisir(t.totalDesRessources, `${eur(r.caf)} + ${eur(r.cessions)} + ${eur(r.augmentationDeCapital)} + ${eur(r.nouveauxEmprunts)} = ${eur(t.totalDesRessources)}`)] },
      {
        libelle: "Variation du fonds de roulement net global",
        fort: true,
        totalDe: { plus: [8], moins: [3] },
        cellules: [aSaisir(t.variationDuFondsDeRoulement, `${eur(t.totalDesRessources)} − ${eur(t.totalDesEmplois)} = ${eur(t.variationDuFondsDeRoulement)}, une ressource nette`)],
      },
    ],
  };
}

/** LA PARTIE II, à compléter : les besoins et les dégagements, section par section. */
export function grilleDeLaPartie2(c: Pick<Cas, "code">): TableauACompleter {
  const x = financementDuChapitre(c);
  const p = x.p;
  const besoin = (valeur: number, calcul: string, indice?: string): CelluleACompleter[] => [aSaisir(valeur, calcul, indice), donnee(null)];
  const degagement = (valeur: number, calcul: string, indice?: string): CelluleACompleter[] => [donnee(null), aSaisir(valeur, calcul, indice)];
  const solde = (valeur: number, calcul: string) => (valeur >= 0 ? besoin(valeur, calcul) : degagement(-valeur, calcul));
  return {
    titre: "Tableau de financement, partie II",
    colonnes: ["Besoins", "Dégagements"],
    lignes: [
      { libelle: "Stocks", cellules: besoin(p.stocks, `${eur(p.stocks)} − ${eur(0)} : le stock est apparu, un besoin`, "le stock du 31 décembre moins celui de l'ouverture") },
      {
        libelle: "Créances d'exploitation, en brut",
        cellules: besoin(p.creancesDExploitation, `clients avant dépréciation, TVA déductible, charge constatée d'avance : ${eur(p.creancesDExploitation)}`, "les créances avant leur dépréciation"),
      },
      { libelle: "Dettes d'exploitation", cellules: degagement(p.dettesDExploitation, `fournisseurs, dettes sociales, TVA à décaisser, produit constaté d'avance : ${eur(p.dettesDExploitation)}`, "une dette qui augmente dégage une ressource") },
      {
        libelle: "Totaux de l'exploitation",
        totalDe: { plus: [0, 1, 2] },
        cellules: [aSaisir(auCentime(p.stocks + p.creancesDExploitation), `${eur(p.stocks)} + ${eur(p.creancesDExploitation)} = ${eur(auCentime(p.stocks + p.creancesDExploitation))}`), aSaisir(p.dettesDExploitation, eur(p.dettesDExploitation))],
      },
      { libelle: "Variation nette d'exploitation (A)", fort: true, cellules: solde(p.variationDExploitation, `${eur(auCentime(p.stocks + p.creancesDExploitation))} − ${eur(p.dettesDExploitation)} = ${signe(p.variationDExploitation)}`) },
      { libelle: "Autres débiteurs", cellules: [donnee(p.autresDebiteurs), donnee(null)] },
      { libelle: "Autres créditeurs (impôt dû, intérêts courus)", cellules: degagement(p.autresCrediteurs, `${eur(x.impot)} + ${eur(auCentime(p.autresCrediteurs - x.impot))} = ${eur(p.autresCrediteurs)}`, "l'impôt dû et les intérêts courus de l'emprunt") },
      { libelle: "Variation nette hors exploitation (B)", fort: true, cellules: solde(p.variationHorsExploitation, `${eur(p.autresDebiteurs)} − ${eur(p.autresCrediteurs)} = ${signe(p.variationHorsExploitation)}`) },
      { libelle: "Total A + B", fort: true, cellules: solde(p.variationDuBesoin, `${signe(p.variationDExploitation)} ${signe(p.variationHorsExploitation)} = ${signe(p.variationDuBesoin)}`) },
      { libelle: "Disponibilités et placements", cellules: besoin(p.disponibilites, `banque et compte à terme, intérêts courus compris : ${eur(p.disponibilites)}`, "la trésorerie active du 31 décembre moins celle de l'ouverture") },
      { libelle: "Concours bancaires courants", cellules: [donnee(null), donnee(p.concoursBancaires)] },
      { libelle: "Variation nette de trésorerie (C)", fort: true, cellules: solde(p.variationDeTresorerie, `${eur(p.disponibilites)} − ${eur(p.concoursBancaires)} = ${signe(p.variationDeTresorerie)}`) },
      { libelle: "Variation du fonds de roulement (A + B + C)", fort: true, cellules: solde(p.total, `${signe(p.variationDuBesoin)} ${signe(p.variationDeTresorerie)} = ${signe(p.total)}, un emploi net`) },
    ],
  };
}

const intro = (x: FinancementDuChapitre) => [
  `Ce chapitre se joue dans la simulation du cours, chez ${x.entreprise}, sur son premier exercice : celui du chapitre « Bilan fonctionnel et BFR ». Le bilan fonctionnel du 31 décembre dit où en est ${x.entreprise} ; il ne dit pas comment elle y est arrivée. Le tableau de financement le dit : il explique, flux par flux, le passage d'un bilan fonctionnel au suivant.`,
  `${x.entreprise} est née le 2 janvier : son bilan d'ouverture est vide. C'est le tableau d'un premier exercice, la colonne de l'exercice précédent est vide, et chaque variation vaut le poste du 31 décembre. Les flux de l'année expliquent donc tout le bilan.`,
  "Le tableau du plan comptable a deux parties. La partie I range les emplois stables de l'exercice (ce qui a été investi, remboursé, distribué) et ses ressources stables (la capacité d'autofinancement, les cessions, les apports, les emprunts nouveaux). Son solde est la variation du fonds de roulement net global. La partie II dit à quoi cette variation a servi : le besoin d'exploitation, le hors exploitation, la trésorerie.",
];

export const LE_TABLEAU_DE_FINANCEMENT: Chapitre = {
  code: "le-tableau-de-financement",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"],
  titre: "Le tableau de financement",
  accroche:
    "Le bilan fonctionnel dit où en est NOVA au 31 décembre ; le tableau de financement dit comment elle y est arrivée. Les emplois et les ressources stables de l'année, la variation du fonds de roulement, puis ce que le besoin et la trésorerie en ont fait, et ce qu'un banquier en lit.",
  objectifs: [
    "Distinguer les emplois et les ressources stables de l'exercice de ce qui relève de la partie II",
    "Établir la partie I du tableau de financement et en tirer la variation du fonds de roulement net global",
    "Établir la partie II : la variation du besoin d'exploitation, hors exploitation et de la trésorerie",
    "Vérifier l'égalité des deux parties et dire ce qui change l'une sans toucher l'autre",
    "Interpréter un tableau de financement : comment l'exercice a été financé, et ses limites",
  ],
  libre: false,
  prerequis: ["soldes-intermediaires-de-gestion", "bilan-fonctionnel-et-bfr"],
  ensuite: ["le-tableau-des-flux-de-tresorerie"],
  entreprises: {
    codes: ENTREPRISES_DU_TABLEAU_DE_FINANCEMENT,
    pourquoi: "le tableau de financement se lit sur un exercice tenu en comptabilité de la création à la clôture, celui de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Du bilan au tableau des flux de l'année",
      notions: ["balance_sheet", "frng"],
      tableau: deuxBilansFonctionnels,
      texte: (c) => intro(financementDuChapitre(c)),
      repere: () =>
        "Partie I : variation du fonds de roulement net global = ressources stables de l'exercice − emplois stables de l'exercice. Partie II : variation du fonds de roulement = variation du besoin d'exploitation + variation du besoin hors exploitation + variation de la trésorerie nette.",
    },
    {
      id: "predire-la-tresorerie",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur la trésorerie de l'année",
      notions: ["net_treasury", "frng"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Avant de dresser le tableau, pariez. Sur l'exercice, l'activité ${dE(x.entreprise)} a dégagé une capacité d'autofinancement de ${eur(x.t.ressources.caf)}. Au 31 décembre, sa trésorerie nette a augmenté…`;
      },
      options: () => {
        const voir = "Le tableau de financement va le montrer : ce n'est pas la seule ressource de l'année.";
        return [
          { texte: "De plus que la CAF", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "D'autant que la CAF", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "De moins que la CAF, investissement payé", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "emplois-ou-ressources",
      objectifs: [0],
      type: "tri",
      titre: "Partie I, partie II, ou déjà dans la CAF",
      notions: ["frng", "bfr", "depreciation"],
      tableau: lesFluxDeLExercice,
      question: () =>
        "Rangez chaque élément de l'exercice. La partie I ne retient que les flux stables : ce qui a été investi, remboursé ou distribué (les emplois), et ce qui a financé durablement (les ressources). Le cycle d'exploitation, le hors exploitation et la trésorerie vont en partie II. Et une charge déjà comptée dans la capacité d'autofinancement n'a pas de ligne à elle.",
      relance: "Demandez-vous si l'élément finance ou consomme durablement, s'il naît du cycle des ventes et des achats, ou s'il est déjà dans la capacité d'autofinancement.",
      categories: [
        { code: "emplois", libelle: "Emplois stables (partie I)" },
        { code: "ressources", libelle: "Ressources stables (partie I)" },
        { code: "partie-2", libelle: "Partie II" },
        { code: "caf", libelle: "Déjà dans la CAF" },
      ],
      elements: (c) => {
        const x = financementDuChapitre(c);
        const t = x.t;
        return [
          { libelle: "La ligne de montage achetée en janvier", montant: t.emplois.acquisitions, categorie: "emplois", pourquoi: "Un investissement durable : une acquisition d'immobilisation, pour son prix hors taxes." },
          { libelle: "Le capital remboursé aux échéances", montant: t.emplois.remboursements, categorie: "emplois", pourquoi: "Rembourser une dette financière consomme des ressources stables : un emploi." },
          { libelle: "L'apport des associés", montant: t.ressources.augmentationDeCapital, categorie: "ressources", pourquoi: "Une augmentation des capitaux propres : une ressource stable." },
          { libelle: "L'emprunt reçu le 3 janvier", montant: t.ressources.nouveauxEmprunts, categorie: "ressources", pourquoi: "Une augmentation des dettes financières, pour son montant reçu : une ressource stable." },
          { libelle: "La capacité d'autofinancement", montant: t.ressources.caf, categorie: "ressources", pourquoi: "La ressource que l'activité a dégagée elle-même : la première ligne des ressources." },
          { libelle: "La dotation aux amortissements de la ligne", montant: x.amortissements, categorie: "caf", pourquoi: "Une charge qui n'est pas sortie de la banque : la CAF l'a déjà ajoutée au résultat. Lui donner une ligne la compterait deux fois." },
          { libelle: "La dépréciation de la créance de Sonora", montant: x.depreciation, categorie: "caf", pourquoi: "Elle aussi est rendue par la CAF ; c'est pourquoi la partie II prend les créances en valeur brute." },
          { libelle: "Les intérêts de l'emprunt payés aux échéances", montant: x.interetsPayes, categorie: "caf", pourquoi: "Une charge financière décaissée : elle a déjà diminué la CAF. Seul le capital remboursé va en partie I." },
          { libelle: "Le stock de composants au 31 décembre", montant: x.p.stocks, categorie: "partie-2", pourquoi: "Un poste du cycle d'exploitation : sa variation est un besoin de la partie II." },
          { libelle: "L'impôt sur les sociétés dû", montant: x.impot, categorie: "partie-2", pourquoi: "Une dette hors exploitation : sa variation est un dégagement de la partie II." },
          { libelle: "Le compte à terme et ses intérêts courus", montant: x.placement, categorie: "partie-2", pourquoi: "Un placement à moins d'un an : de la trésorerie, en bas de la partie II." },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `La partie I ne garde que ce qui touche au haut du bilan fonctionnel. Les charges calculées n'y ont pas de ligne : elles sont dans la CAF, ${eur(x.t.ressources.caf)}, qui les a rendues au résultat. Les intérêts non plus : ils ont diminué la CAF.`,
        ];
      },
    },
    {
      id: "la-partie-1",
      objectifs: [1],
      type: "a-completer",
      titre: "La partie I : emplois et ressources",
      notions: ["frng", "loan_schedule"],
      tableau: lesFluxDeLExercice,
      question: (c) => {
        const x = financementDuChapitre(c);
        const t = x.t;
        return `Complétez la partie I. Les emplois : aucune distribution, la ligne de montage (${eur(t.emplois.acquisitions)} hors taxes), le capital remboursé (${eur(t.ressources.nouveauxEmprunts)} empruntés, ${eur(t.empruntRestant)} encore dus au 31 décembre). Les ressources : la capacité d'autofinancement (${eur(t.ressources.caf)}), aucune cession, l'apport (${eur(t.ressources.augmentationDeCapital)}) et l'emprunt reçu. Variation du fonds de roulement = total des ressources − total des emplois.`;
      },
      grille: grilleDeLaPartie1,
      explication: (c) => {
        const x = financementDuChapitre(c);
        const t = x.t;
        return [
          `Les ressources dépassent les emplois de ${eur(t.variationDuFondsDeRoulement)} : une ressource nette, le fonds de roulement a grandi d'autant. Les emplois se comptent hors taxes : la TVA de la ligne, récupérée, n'est pas un investissement.`,
          `L'emprunt se lit des deux côtés, jamais en solde : ${eur(t.ressources.nouveauxEmprunts)} reçus en ressource, ${eur(t.emplois.remboursements)} remboursés en emploi. Le solde, ${eur(t.empruntRestant)}, cacherait ce qui s'est passé.`,
        ];
      },
    },
    {
      id: "la-verification",
      objectifs: [3],
      type: "montants",
      titre: "Vérifier par les deux bilans",
      notions: ["frng"],
      tableau: deuxBilansFonctionnels,
      question: () =>
        "Sans formule cette fois. Vérifiez la partie I par les deux bilans fonctionnels : retrouvez le fonds de roulement du 31 décembre, puis sa variation depuis l'ouverture. Puis calculez la part de la capacité d'autofinancement dans les ressources de l'exercice, en pourcentage, au centième.",
      champs: (c) => {
        const x = financementDuChapitre(c);
        const t = x.t;
        const r = x.fo.ressourcesStables;
        return [
          {
            libelle: "Fonds de roulement au 31 décembre",
            attendu: t.fondsDeRoulementDeCloture,
            calcul: `${eur(r.capitauxPropres)} + ${eur(r.amortissementsEtDepreciations)} + ${eur(r.provisions)} + ${eur(r.dettesFinancieres)} − ${eur(x.fo.emploisStables)} = ${eur(t.fondsDeRoulementDeCloture)}`,
          },
          { libelle: "Variation du fonds de roulement depuis l'ouverture", attendu: t.variationDuFondsDeRoulement, calcul: `${eur(t.fondsDeRoulementDeCloture)} − ${eur(0)} = ${eur(t.variationDuFondsDeRoulement)}, celle de la partie I` },
          {
            libelle: "Part de la CAF dans les ressources, en %",
            attendu: auCentime(x.partDeLaCaf * 100),
            calcul: `${eur(t.ressources.caf)} ÷ ${eur(t.totalDesRessources)} × 100 = ${pct(x.partDeLaCaf)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Les deux chemins tombent sur ${eur(x.t.variationDuFondsDeRoulement)} : la partie I explique la variation du haut du bilan fonctionnel, flux par flux. C'est la vérification que demande l'examen.`,
          `Moins d'un tiers des ressources vient de l'activité : ${pct(x.partDeLaCaf)}. Le reste, ${eur(x.externe)}, vient de l'apport et de l'emprunt : c'est l'année de la création.`,
        ];
      },
    },
    {
      id: "predire-la-partie-2",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la partie II",
      notions: ["bfr", "net_treasury"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Le fonds de roulement a grandi de ${eur(x.t.variationDuFondsDeRoulement)}. La partie II dira à quoi cette ressource a servi. Où, d'après vous, est passé l'essentiel ?`;
      },
      options: () => {
        const voir = "Complétez la partie II à l'étape suivante.";
        return [
          { texte: "En trésorerie", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Dans les créances sur les clients", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Dans le stock de composants de décembre", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-partie-2",
      objectifs: [2],
      type: "a-completer",
      titre: "La partie II : où est allée la ressource",
      notions: ["bfr", "net_treasury", "payment_terms"],
      tableau: deuxBilansFonctionnels,
      question: () =>
        "À vous, sans les montants : ils sont dans les deux bilans. Une hausse d'un actif est un besoin, une hausse d'une dette est un dégagement ; chaque section se solde du côté le plus fort. Les créances se prennent en valeur brute, avant leur dépréciation.",
      grille: grilleDeLaPartie2,
      explication: (c) => {
        const x = financementDuChapitre(c);
        const p = x.p;
        return [
          `L'exploitation a consommé ${eur(p.variationDExploitation)}, le hors exploitation en a dégagé ${eur(-p.variationHorsExploitation)} (l'impôt et les intérêts dus, pas encore payés) : le besoin n'a absorbé que ${eur(p.variationDuBesoin)}. Le reste, ${eur(p.variationDeTresorerie)}, est en trésorerie.`,
          `Le total de la partie II, ${eur(p.total)}, est un emploi net : la variation du fonds de roulement de la partie I, de l'autre côté. Les deux parties s'équilibrent toujours, puisque le bilan s'équilibre.`,
        ];
      },
    },
    {
      id: "les-valeurs-brutes",
      objectifs: [2],
      type: "choix",
      titre: "Pourquoi les créances en brut",
      notions: ["depreciation", "bfr"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Un camarade a pris les créances nettes de leur dépréciation, ${eur(x.depreciation)} de moins. Sa partie II ne retombe plus sur la partie I. Pourquoi ?`;
      },
      options: (c) => {
        const x = financementDuChapitre(c);
        return [
          {
            texte: "La CAF a déjà rendu la dépréciation : l'ôter des créances la compte deux fois",
            juste: true,
            retour: `Oui. La dépréciation de Sonora est une charge calculée : la CAF l'ajoute au résultat, elle est donc dans la partie I. En partie II, les créances restent en brut. Prises nettes, elles baisseraient le besoin de ${eur(x.depreciation)} : l'écart exact entre ses deux parties.`,
          },
          {
            texte: "Une dépréciation se range en trésorerie, avec les placements et la banque du 31 décembre",
            juste: false,
            retour: "Non : elle ne sort ni n'entre en banque. C'est une charge calculée, que la CAF a déjà rendue au résultat.",
          },
          {
            texte: "Les créances de Sonora ne relèvent pas de l'exploitation",
            juste: false,
            retour: "Non : ce sont des ventes de l'année, du cycle d'exploitation. Seule leur dépréciation pose la question, et la CAF y répond.",
          },
        ];
      },
    },
    {
      id: "predire-le-remboursement",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur un remboursement anticipé",
      notions: ["frng", "loan_schedule", "net_treasury"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Supposez que ${x.entreprise} rembourse le 31 décembre ${eur(REMBOURSEMENT_DU_DEFI)} d'emprunt par anticipation, sans indemnité. Dans le tableau de financement…`;
      },
      options: () => {
        const voir = "Faites-le dans le laboratoire, à l'étape suivante.";
        return [
          { texte: "Les emplois et la trésorerie bougent d'autant ; le besoin, non", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Seule la trésorerie baisse : c'est un flux de banque", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Rien ne bouge : l'emprunt et la banque baissent ensemble, le bilan reste équilibré", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-tableau",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des deux parties",
      notions: ["frng", "bfr", "net_treasury", "payment_terms"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Faites varier le délai de paiement de CampusTech (${x.f.campustech.delai} jours aujourd'hui, ${DELAI_CONVENU_DE_CAMPUSTECH} convenus), celui accordé par le fournisseur de composants (${x.f.fournisseur.delai} jours), et un remboursement anticipé de l'emprunt le 31 décembre, sans indemnité. Le tableau suit les deux parties ; le graphique, les trois variations selon le remboursement. Relevez le défi.`;
      },
      leviers: (c) => {
        const d = departDuTableau(ficheDe(c));
        const L = LEVIERS_DU_TABLEAU;
        return [
          { code: "delaiCampusTech", libelle: "Délai de paiement de CampusTech", unite: "jours", ...L.campustech, depart: d.delaiCampusTech },
          { code: "delaiFournisseur", libelle: "Délai accordé par le fournisseur de composants", unite: "jours", ...L.fournisseur, depart: d.delaiFournisseur },
          { code: "remboursement", libelle: "Remboursement anticipé le 31 décembre", unite: "€", ...L.remboursement, depart: d.remboursement },
        ];
      },
      lecture: (c, p) => {
        const f = ficheDe(c);
        const l = laboratoireDuTableau(f, p);
        const d = laboratoireDuTableau(f, departDuTableau(f));
        return [
          { libelle: "Emplois stables de l'exercice", montant: l.totalDesEmplois, reference: d.totalDesEmplois },
          { libelle: "Ressources stables de l'exercice", montant: l.totalDesRessources, reference: d.totalDesRessources },
          { libelle: "Variation du fonds de roulement", montant: l.variationDuFondsDeRoulement, reference: d.variationDuFondsDeRoulement },
          { libelle: "Variation du besoin d'exploitation", montant: l.partie2.variationDExploitation, reference: d.partie2.variationDExploitation },
          { libelle: "Variation du besoin hors exploitation", montant: l.partie2.variationHorsExploitation, reference: d.partie2.variationHorsExploitation },
          { libelle: "Variation de la trésorerie nette", montant: l.partie2.variationDeTresorerie, reference: d.partie2.variationDeTresorerie, fort: true },
          { libelle: "Effet sur la trésorerie nette", montant: auCentime(l.partie2.variationDeTresorerie - d.partie2.variationDeTresorerie), reference: 0, effet: true },
        ];
      },
      graphique: (c) => {
        const f = ficheDe(c);
        return {
          levier: "remboursement",
          courbes: [
            { libelle: "Variation du fonds de roulement", valeur: (p) => laboratoireDuTableau(f, p).variationDuFondsDeRoulement },
            { libelle: "Variation du besoin en fonds de roulement", valeur: (p) => laboratoireDuTableau(f, p).partie2.variationDuBesoin },
            { libelle: "Variation de la trésorerie nette", valeur: (p) => laboratoireDuTableau(f, p).partie2.variationDeTresorerie },
          ],
        };
      },
      defi: (c) => {
        const f = ficheDe(c);
        const depart = laboratoireDuTableau(f, departDuTableau(f));
        return {
          consigne: `Remboursez au moins ${eur(REMBOURSEMENT_DU_DEFI)} par anticipation, sans que la variation de la trésorerie nette descende sous celle du départ, ${eur(depart.partie2.variationDeTresorerie)}.`,
          atteint: (p) => p.remboursement! >= REMBOURSEMENT_DU_DEFI && laboratoireDuTableau(f, p).partie2.variationDeTresorerie >= depart.partie2.variationDeTresorerie,
          indice: (p) => {
            if (p.remboursement! < REMBOURSEMENT_DU_DEFI) return `Le remboursement anticipé vaut ${eur(p.remboursement!)} : portez-le à ${eur(REMBOURSEMENT_DU_DEFI)} au moins, puis cherchez ce qui rend la trésorerie qu'il a coûtée.`;
            const l = laboratoireDuTableau(f, p);
            return `La trésorerie a varié de ${eur(l.partie2.variationDeTresorerie)}, ${eur(auCentime(depart.partie2.variationDeTresorerie - l.partie2.variationDeTresorerie))} de moins qu'au départ. Le fonds de roulement a baissé du remboursement : seul le besoin peut rendre la différence. Jouez sur les délais ; un délai ne compte que s'il fait passer une facture de l'autre côté du 31 décembre.`;
          },
          solution: { ...departDuTableau(f), ...SOLUTION_DU_TABLEAU },
        };
      },
      explication: (c, p) => {
        const f = ficheDe(c);
        const l = laboratoireDuTableau(f, p);
        const d = laboratoireDuTableau(f, departDuTableau(f));
        return [
          `Le remboursement est un emploi de la partie I : le fonds de roulement a varié de ${eur(l.variationDuFondsDeRoulement)}, ${eur(auCentime(d.variationDuFondsDeRoulement - l.variationDuFondsDeRoulement))} de moins. Les délais, eux, n'ont pas touché la partie I : ils ont baissé le besoin de ${eur(auCentime(d.partie2.variationDuBesoin - l.partie2.variationDuBesoin))}, et la trésorerie a tenu.`,
          "Le défi est relevé, mais regardez comment : une dette à long terme payée grâce à des dettes à quelques semaines. La partie I s'est affaiblie, la trésorerie ne tient que par un délai qui peut se refermer. C'est ce que le tableau de financement fait voir, et qu'un seul bilan cache.",
        ];
      },
    },
    {
      id: "lire-le-tableau",
      objectifs: [4],
      type: "choix",
      titre: "Comment l'exercice a été financé",
      notions: ["frng", "net_treasury"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Un banquier lit le tableau de financement ${dE(x.entreprise)} : ${eur(x.t.totalDesEmplois)} d'emplois, ${eur(x.t.totalDesRessources)} de ressources, dont ${eur(x.t.ressources.caf)} de CAF. Quelle lecture en fait-il ?`;
      },
      options: (c) => {
        const x = financementDuChapitre(c);
        const t = x.t;
        return [
          {
            texte: "La CAF couvre seule les emplois ; l'apport et l'emprunt restent en caisse",
            juste: true,
            retour: `Oui. ${eur(t.ressources.caf)} de CAF suffisent à payer la ligne et le capital remboursé, ${eur(t.totalDesEmplois)}. Les ${eur(x.externe)} de l'apport et de l'emprunt n'ont rien financé de stable cette année : ils sont en trésorerie, en réserve pour la seconde ligne.`,
          },
          {
            texte: "L'emprunt a financé la ligne : un investissement financé par la dette, comme il se doit",
            juste: false,
            retour: `Non : le tableau ne flèche pas une ressource vers un emploi. Il compare des totaux, et la CAF, ${eur(t.ressources.caf)}, couvre à elle seule les ${eur(t.totalDesEmplois)} d'emplois.`,
          },
          {
            texte: "Une situation tendue : le besoin d'exploitation a consommé une part de la ressource",
            juste: false,
            retour: `Non : le besoin n'a absorbé que ${eur(x.p.variationDuBesoin)} sur ${eur(t.variationDuFondsDeRoulement)}, le hors exploitation compensant presque l'exploitation.`,
          },
        ];
      },
    },
    {
      id: "les-ratios-du-tableau",
      objectifs: [4],
      type: "montants",
      titre: "Trois chiffres pour lire le tableau",
      notions: ["frng", "bfr"],
      question: () =>
        "Trois indicateurs que le banquier tire du tableau, au centième pour les pourcentages. L'autofinancement de l'exercice (la CAF moins les dividendes mis en paiement), la couverture des acquisitions par l'autofinancement, et la part de la variation du fonds de roulement que le besoin a absorbée.",
      champs: (c) => {
        const x = financementDuChapitre(c);
        const t = x.t;
        return [
          { libelle: "Autofinancement de l'exercice", attendu: x.autofinancement, calcul: `${eur(t.ressources.caf)} − ${eur(t.emplois.dividendes)} = ${eur(x.autofinancement)}` },
          { libelle: "Couverture des acquisitions, en %", attendu: auCentime(x.couverture * 100), calcul: `${eur(x.autofinancement)} ÷ ${eur(t.emplois.acquisitions)} × 100 = ${pct(x.couverture)}`, tolerance: 0.01 },
          { libelle: "Part absorbée par le besoin, en %", attendu: auCentime(x.partAbsorbee * 100), calcul: `${eur(x.p.variationDuBesoin)} ÷ ${eur(t.variationDuFondsDeRoulement)} × 100 = ${pct(x.partAbsorbee)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `L'autofinancement couvre ${pct(x.couverture)} de l'investissement de l'année : au-delà de 100 %, l'entreprise investit sans dépendre de personne. Et le besoin n'a pris que ${pct(x.partAbsorbee)} de la ressource nette : l'exploitation se finance presque seule, les particuliers payant à la commande.`,
        ];
      },
    },
    {
      id: "un-premier-exercice",
      objectifs: [4],
      type: "choix",
      titre: "Ce qu'un premier tableau ne dit pas",
      notions: ["net_treasury", "frng"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Le dirigeant se félicite : « ${eur(x.p.variationDeTresorerie)} de trésorerie en plus en un an, notre exploitation est une mine d'or. » Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = financementDuChapitre(c);
        return [
          {
            texte: "Que la création en apporte l'essentiel, et qu'un tableau ne fait pas une tendance",
            juste: true,
            retour: `Oui. ${eur(x.externe)} viennent de l'apport et de l'emprunt, une fois pour toutes ; la CAF n'en apporte que ${eur(x.t.ressources.caf)}. Et ${eur(x.placement)} sont bloqués sur le compte à terme. Un premier exercice part de rien : seuls les tableaux des années suivantes diront si l'activité dégage durablement de la trésorerie.`,
          },
          {
            texte: "Qu'il a raison : la variation de la trésorerie mesure ce que l'exploitation a dégagé dans l'année",
            juste: false,
            retour: `Non : la trésorerie mêle tous les flux de l'année. Celui de l'activité n'en est qu'une part ; le tableau des flux de trésorerie, au chapitre suivant, la sépare.`,
          },
          {
            texte: "Que c'est trop : une trésorerie si haute signale un besoin mal financé",
            juste: false,
            retour: "Non : c'est l'inverse. Une trésorerie positive dit que le fonds de roulement couvre le besoin ; elle peut coûter, mais elle ne signale pas un besoin mal financé.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["frng", "bfr", "net_treasury"],
      texte: (c) => {
        const x = financementDuChapitre(c);
        const t = x.t;
        return [
          `Vous avez dressé le tableau de financement du premier exercice ${dE(x.entreprise)}. Partie I : ${eur(t.totalDesRessources)} de ressources stables, ${eur(t.totalDesEmplois)} d'emplois, une variation du fonds de roulement de ${eur(t.variationDuFondsDeRoulement)}. Partie II : ${eur(x.p.variationDuBesoin)} absorbés par le besoin, ${eur(x.p.variationDeTresorerie)} en trésorerie.`,
          "Trois pièges. Les charges calculées et les intérêts n'ont pas de ligne : ils sont dans la CAF. Les créances se prennent en brut. Et l'emprunt se lit des deux côtés, le reçu et le remboursé, jamais en solde.",
          "Au niveau de l'examen, vous savez classer les flux de l'exercice, établir les deux parties du tableau de financement et les vérifier par deux bilans fonctionnels successifs. Vous savez dire qu'une décision de financement change la partie I et qu'un délai ne change que la partie II. Et vous savez lire le tableau : la couverture des emplois par l'autofinancement, ce que le besoin absorbe, ce qu'un premier exercice ne dit pas.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Variation du FRNG = ressources stables − emplois stables de l'exercice = variation du BFRE + variation du BFRHE + variation de la trésorerie nette. Ressources : CAF, cessions, apports, emprunts nouveaux. Emplois : dividendes, acquisitions hors taxes, remboursements.",
    },
  ],
};
