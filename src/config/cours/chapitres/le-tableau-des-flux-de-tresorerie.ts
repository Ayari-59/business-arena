import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import type { LeviersDeLaCloture } from "../monde/cloture";
import { EXERCICES_DU_COURS, type FicheDeLExercice } from "../monde/exercice-de-nova";
import { tableauDesFlux, type TableauDesFlux } from "../monde/tableaux-de-flux";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE TABLEAU DES FLUX DE TRÉSORERIE (comptabilité générale, palier 4 ; BTS CG P6 6.6.2,
 * DCG UE6).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le premier exercice de NOVA, sa clôture
 * (monde/cloture.ts), et le tableau des flux du modèle de l'Ordre des experts-comptables, méthode
 * indirecte, calculé dans monde/tableaux-de-flux.ts à partir d'un bilan d'ouverture vide, comme le
 * tableau de financement du chapitre précédent.
 *
 * L'objet : la variation de la trésorerie de l'année expliquée par trois familles de flux.
 * L'activité (la marge brute d'autofinancement, qui laisse les dépréciations de l'actif circulant
 * dans le besoin, moins la variation du besoin lié à l'activité en valeurs nettes, impôt et intérêts
 * compris), l'investissement, le financement. Puis ce qu'une charge calculée change (le résultat)
 * et ne change pas (la trésorerie de l'année), l'excédent de trésorerie d'exploitation, le flux
 * disponible, et les limites du tableau : un compte à terme bloqué un an n'est pas un équivalent de
 * trésorerie au sens strict.
 *
 * LES TEMPS DU CHAPITRE :
 *   · guidé : intro, trois-familles, la-mba (la formule est dans la question) ;
 *   · l'expérience avant la formule : predire-la-mba avant la-mba ; predire-la-depreciation puis
 *     le-laboratoire-des-flux (le mode d'amortissement, la perte sur Sonora, la provision, le délai
 *     de CampusTech ; un graphique du résultat, de la marge brute et du flux de l'activité selon la
 *     perte) ;
 *   · autonome : le-flux-de-l-activite, le-tableau-des-flux ;
 *   · expert : l-excedent-d-exploitation, le-flux-disponible, le-compte-a-terme, deux-tableaux ; et
 *     la synthèse.
 *
 * MATIÈRE : le cours du propriétaire sur la capacité d'autofinancement (« CAF = excédent de
 * trésorerie + variation du BFR », la MBA comme expression voisine) et sur le tableau de financement,
 * adapté à NOVA et au modèle des flux.
 */

/** Le tableau des flux se lit sur un exercice tenu en comptabilité : celui de NOVA. */
export const ENTREPRISES_DU_TABLEAU_DES_FLUX: readonly string[] = ["nova"];

/** Les leviers du laboratoire : le mode d'amortissement (à choix), la perte probable sur Sonora (en %), la provision (en euros), le délai de CampusTech (en jours). */
export const LEVIERS_DES_FLUX = {
  amortissement: [
    { valeur: 0, libelle: "Linéaire" },
    { valeur: 1, libelle: "Dégressif" },
  ],
  perte: { min: 0, max: 100, pas: 10 },
  provision: { min: 0, max: 12_000, pas: 1_000 },
  campustech: { min: 30, max: 120, pas: 5 },
} as const;

/** Le défi du laboratoire : un résultat net plus bas d'au moins cette somme. */
export const BAISSE_DU_RESULTAT_DU_DEFI = 10_000;

/** La solution que montre la correction : le dégressif, 80 % de perte sur Sonora, CampusTech payée à l'échéance convenue. */
export const SOLUTION_DES_FLUX = { amortissement: 1, perte: 80, delaiCampusTech: 60 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const signe = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);
/** Un montant retranché, sans « − − » : « − 12 000 € » ou « + 582,38 € ». */
const moins = (x: number) => (x < 0 ? `+ ${eur(-x)}` : `− ${eur(x)}`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);

const donnee = (valeur: number | null): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, indice?: string): CelluleACompleter => ({ valeur, saisir: true, calcul, ...(indice ? { indice } : {}) });

/** La fiche de l'exercice du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLExercice => EXERCICES_DU_COURS[c.code]!;

/** Le tableau des flux de l'exercice, avec ce que le chapitre en tire. */
export function fluxDuChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const x = tableauDesFlux(f);
  const t = x.t;
  const k = x.k;
  const sig = k.sig;
  return {
    ...x,
    f,
    entreprise: f.entreprise,
    ebe: sig.excedentBrutDExploitation,
    resultatFinancier: sig.resultatFinancier,
    impot: k.impot.impot,
    besoinDExploitation: k.fonctionnel.besoinDExploitation,
    dettesHorsExploitation: t.partie2.autresCrediteurs,
    compteCourant: t.compteCourant,
    placement: auCentime(t.partie2.disponibilites - t.compteCourant),
    interetsDuPlacement: k.soldes[f.placement.compteDesInteretsCourus] ?? 0,
    interetsPayes: auCentime((k.soldes["6611"] ?? 0) + (k.soldes["1688"] ?? 0)),
    loyer: k.soldes["6132"] ?? 0,
    salaires: k.soldes["641"] ?? 0,
    /** L'écart entre le flux de l'activité et l'excédent de trésorerie d'exploitation. */
    ecartALExcedent: auCentime(x.fluxDeLActivite - x.excedentDeTresorerieDExploitation),
    /** La part du financement dans la variation de la trésorerie. */
    partDuFinancement: Math.round((x.fluxDeFinancement / x.variationDeTresorerie) * 10_000) / 10_000,
  };
}

export type FluxDuChapitre = ReturnType<typeof fluxDuChapitre>;

/** Les leviers de la clôture à une position du laboratoire. */
const leviersDe = (p: Readonly<Record<string, number>>): Partial<LeviersDeLaCloture> => ({
  modeDAmortissement: p.amortissement === 1 ? "degressif" : "lineaire",
  tauxDePerteProbable: p.perte! / 100,
  provisionPourLitige: p.provision!,
  delaiCampusTech: p.delaiCampusTech!,
});

/** Une position du laboratoire : le tableau des flux à ces leviers. */
export const laboratoireDesFlux = (f: FicheDeLExercice, p: Readonly<Record<string, number>>): TableauDesFlux => tableauDesFlux(f, leviersDe(p));

/** Le départ du laboratoire : les choix de la fiche. */
export const departDesFlux = (f: FicheDeLExercice) => {
  const l = tableauDesFlux(f).k.leviers;
  return { amortissement: l.modeDAmortissement === "degressif" ? 1 : 0, perte: Math.round(l.tauxDePerteProbable * 100), provision: l.provisionPourLitige, delaiCampusTech: l.delaiCampusTech };
};

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

/** Ce que l'on sait déjà de l'exercice : le résultat et ses charges calculées, le besoin, les flux stables. */
export function lExerciceEnChiffres(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = fluxDuChapitre(c);
  const t = x.t;
  const l = (libelle: string, montant: number) => ({ libelle, valeurs: [eur(montant)] });
  return {
    titre: `${x.entreprise}, l'exercice en chiffres`,
    colonnes: ["Montant"],
    lignes: [
      l("Résultat net", x.resultatNet),
      l("Dotation aux amortissements de la ligne", x.amortissements),
      l("Dotation à la provision pour litige", x.provisions),
      l("Dotation à la dépréciation de Sonora", x.depreciationsDeLActifCirculant),
      l("Capacité d'autofinancement", x.caf),
      l("Besoin en fonds de roulement au 31 décembre, en brut", x.besoinBrut),
      l("Dépréciation des créances au bilan", x.depreciationsAuBilan),
      l("Ligne de montage achetée, hors taxes", t.emplois.acquisitions),
      l("Apport des associés", t.ressources.augmentationDeCapital),
      l("Emprunt reçu", t.ressources.nouveauxEmprunts),
      l("Capital remboursé", t.emplois.remboursements),
      l("Trésorerie nette au 31 décembre", x.tresorerieDeCloture),
    ],
  };
}

/** LE TABLEAU DES FLUX, à compléter : une colonne de montants signés, les trois flux et leur somme. */
export function grilleDesFlux(c: Pick<Cas, "code">): TableauACompleter {
  const x = fluxDuChapitre(c);
  const t = x.t;
  const dotations = auCentime(x.amortissements + x.provisions);
  return {
    titre: "Tableau des flux de trésorerie, méthode indirecte",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Résultat net", cellules: [donnee(x.resultatNet)] },
      { libelle: "Amortissements et provisions", cellules: [aSaisir(dotations, `${eur(x.amortissements)} + ${eur(x.provisions)} = ${eur(dotations)}, sans la dépréciation de Sonora`, "les dotations, sauf la dépréciation d'un actif circulant")] },
      { libelle: "Marge brute d'autofinancement", fort: true, totalDe: { plus: [0, 1] }, cellules: [aSaisir(x.margeBruteDAutofinancement, `${eur(x.resultatNet)} + ${eur(dotations)} = ${eur(x.margeBruteDAutofinancement)}`)] },
      {
        libelle: "Variation du besoin lié à l'activité",
        cellules: [aSaisir(x.besoinNetDeLActivite, `${eur(x.besoinBrut)} − ${eur(x.depreciationsAuBilan)} de dépréciation − ${eur(0)} à l'ouverture = ${signe(x.besoinNetDeLActivite)}`, "le besoin du 31 décembre en valeurs nettes, moins celui de l'ouverture")],
      },
      { libelle: "Flux de l'activité (A)", fort: true, totalDe: { plus: [2], moins: [3] }, cellules: [aSaisir(x.fluxDeLActivite, `${eur(x.margeBruteDAutofinancement)} ${moins(x.besoinNetDeLActivite)} = ${eur(x.fluxDeLActivite)}`)] },
      { libelle: "Acquisitions d'immobilisations", cellules: [aSaisir(-t.emplois.acquisitions, `la ligne, payée : ${signe(-t.emplois.acquisitions)}`, "un décaissement s'écrit en négatif")] },
      { libelle: "Cessions d'immobilisations", cellules: [donnee(t.ressources.cessions)] },
      { libelle: "Flux d'investissement (B)", fort: true, totalDe: { plus: [5, 6] }, cellules: [aSaisir(x.fluxDInvestissement, signe(x.fluxDInvestissement))] },
      { libelle: "Augmentation de capital", cellules: [aSaisir(t.ressources.augmentationDeCapital, `l'apport des associés : ${eur(t.ressources.augmentationDeCapital)}`)] },
      { libelle: "Emprunts reçus", cellules: [aSaisir(t.ressources.nouveauxEmprunts, `l'emprunt du 3 janvier : ${eur(t.ressources.nouveauxEmprunts)}`)] },
      { libelle: "Remboursements d'emprunts", cellules: [aSaisir(-t.emplois.remboursements, `le capital des échéances de l'année : ${signe(-t.emplois.remboursements)}`, "un décaissement s'écrit en négatif")] },
      { libelle: "Dividendes versés", cellules: [donnee(-t.emplois.dividendes + 0)] },
      { libelle: "Flux de financement (C)", fort: true, totalDe: { plus: [8, 9, 10, 11] }, cellules: [aSaisir(x.fluxDeFinancement, `${eur(t.ressources.augmentationDeCapital)} + ${eur(t.ressources.nouveauxEmprunts)} − ${eur(t.emplois.remboursements)} = ${eur(x.fluxDeFinancement)}`)] },
      { libelle: "Variation de la trésorerie (A + B + C)", fort: true, totalDe: { plus: [4, 7, 12] }, cellules: [aSaisir(x.variationDeTresorerie, `${eur(x.fluxDeLActivite)} ${signe(x.fluxDInvestissement)} ${signe(x.fluxDeFinancement)} = ${eur(x.variationDeTresorerie)}`)] },
      { libelle: "Trésorerie d'ouverture", cellules: [donnee(x.tresorerieDOuverture)] },
      { libelle: "Trésorerie de clôture", fort: true, totalDe: { plus: [13, 14] }, cellules: [aSaisir(x.tresorerieDeCloture, `${eur(x.tresorerieDOuverture)} + ${eur(x.variationDeTresorerie)} = ${eur(x.tresorerieDeCloture)}, celle du bilan`)] },
    ],
  };
}

const intro = (x: FluxDuChapitre) => [
  `Ce chapitre se joue dans la simulation du cours, chez ${x.entreprise}, sur son premier exercice, celui du tableau de financement. Le tableau de financement expliquait la variation du fonds de roulement ; le tableau des flux de trésorerie explique celle de la trésorerie, ${eur(x.variationDeTresorerie)} cette année, par trois familles de flux.`,
  "Les flux de l'activité : ce que l'exploitation, l'impôt et les intérêts ont fait rentrer et sortir. Les flux d'investissement : les immobilisations achetées et cédées. Les flux de financement : les apports, les emprunts reçus et remboursés, les dividendes. Le modèle est celui de l'Ordre des experts-comptables, en méthode indirecte : on part du résultat, et l'on corrige ce qui n'est pas de la trésorerie.",
  `Comme au chapitre précédent, le bilan d'ouverture est vide : ${x.entreprise} est née le 2 janvier. La trésorerie est celle du bilan fonctionnel : la banque, et le compte à terme avec ses intérêts courus.`,
];

export const LE_TABLEAU_DES_FLUX_DE_TRESORERIE: Chapitre = {
  code: "le-tableau-des-flux-de-tresorerie",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"],
  titre: "Le tableau des flux de trésorerie",
  accroche:
    "D'où vient la trésorerie de NOVA, et où est-elle allée ? L'activité, l'investissement, le financement : trois flux qui expliquent la trésorerie de l'année, et pourquoi une dépréciation fait baisser le résultat sans faire baisser la trésorerie.",
  objectifs: [
    "Calculer la marge brute d'autofinancement et la distinguer de la capacité d'autofinancement",
    "Calculer le flux de l'activité à partir du besoin en fonds de roulement en valeurs nettes",
    "Établir les flux d'investissement et de financement, et retrouver la variation de la trésorerie",
    "Montrer qu'une charge calculée change le résultat sans changer la trésorerie de l'année",
    "Interpréter un tableau des flux : flux disponible, excédent de trésorerie d'exploitation, limites",
  ],
  libre: false,
  prerequis: ["le-tableau-de-financement"],
  ensuite: ["le-diagnostic-financier-et-extra-financier"],
  entreprises: {
    codes: ENTREPRISES_DU_TABLEAU_DES_FLUX,
    pourquoi: "le tableau des flux se lit sur un exercice tenu en comptabilité de la création à la clôture, celui de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois flux pour une trésorerie",
      notions: ["net_treasury", "cash_budget"],
      tableau: lExerciceEnChiffres,
      texte: (c) => intro(fluxDuChapitre(c)),
      repere: () =>
        "Flux de l'activité = marge brute d'autofinancement − variation du besoin lié à l'activité. Marge brute d'autofinancement = résultat net + amortissements et provisions (hors dépréciations de l'actif circulant) − plus-values de cession. Variation de la trésorerie = flux de l'activité + flux d'investissement + flux de financement.",
    },
    {
      id: "trois-familles",
      objectifs: [2],
      type: "tri",
      titre: "Activité, investissement ou financement",
      notions: ["net_treasury", "loan_schedule"],
      question: () =>
        "Rangez chaque flux de l'exercice dans sa famille. Le modèle de l'Ordre des experts-comptables met dans l'activité tout ce qui fait vivre l'entreprise au quotidien, impôt et intérêts compris ; dans l'investissement, les immobilisations ; dans le financement, ce qui vient des associés et des prêteurs, ou leur retourne.",
      relance: "Demandez-vous qui est en face : un client, un fournisseur, un salarié ou l'État (l'activité), le vendeur d'une immobilisation (l'investissement), un associé ou une banque qui prête (le financement).",
      categories: [
        { code: "activite", libelle: "Activité" },
        { code: "investissement", libelle: "Investissement" },
        { code: "financement", libelle: "Financement" },
      ],
      elements: (c) => {
        const x = fluxDuChapitre(c);
        const t = x.t;
        return [
          { libelle: "Le paiement de la ligne de montage, hors taxes", montant: t.emplois.acquisitions, categorie: "investissement", pourquoi: "Une immobilisation achetée : un flux d'investissement." },
          { libelle: "L'apport des associés", montant: t.ressources.augmentationDeCapital, categorie: "financement", pourquoi: "Des associés qui apportent des fonds : un flux de financement." },
          { libelle: "L'emprunt reçu", montant: t.ressources.nouveauxEmprunts, categorie: "financement", pourquoi: "Un prêteur qui verse : un flux de financement." },
          { libelle: "Le capital remboursé aux échéances", montant: t.emplois.remboursements, categorie: "financement", pourquoi: "L'argent rendu au prêteur : un flux de financement, en sortie." },
          { libelle: "Les intérêts de l'emprunt payés", montant: x.interetsPayes, categorie: "activite", pourquoi: "Le modèle de l'Ordre les range dans l'activité, avec le résultat dont ils sont une charge. D'autres modèles les rangent en financement : il faut dire lequel on suit." },
          { libelle: "Le loyer du local", montant: x.loyer, categorie: "activite", pourquoi: "Une charge du quotidien : l'activité." },
          { libelle: "Les salaires", montant: x.salaires, categorie: "activite", pourquoi: "Une charge du quotidien : l'activité." },
          { libelle: "L'impôt sur les sociétés de l'année", montant: x.impot, categorie: "activite", pourquoi: "L'impôt naît du bénéfice de l'activité : il y reste, qu'il soit payé ou encore dû." },
        ];
      },
      explication: () => [
        "Trois familles, trois questions. L'activité : l'entreprise dégage-t-elle de la trésorerie en vivant ? L'investissement : combien met-elle dans son outil ? Le financement : qui paie la différence, les associés ou les prêteurs ?",
      ],
    },
    {
      id: "predire-la-mba",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur la marge brute",
      notions: ["depreciation", "net_treasury"],
      question: (c) => {
        const x = fluxDuChapitre(c);
        return `La capacité d'autofinancement vaut ${eur(x.caf)}. Le tableau des flux part d'une grandeur voisine, la marge brute d'autofinancement, qui ajoute au résultat les amortissements et les provisions, mais pas la dépréciation de la créance de Sonora. Pariez : elle est…`;
      },
      options: () => {
        const voir = "Calculez-la à l'étape suivante.";
        return [
          { texte: "Plus petite que la CAF", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Égale à la CAF : c'est un autre nom", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus grande : elle ajoute les intérêts payés", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-mba",
      objectifs: [0],
      type: "montants",
      titre: "La marge brute d'autofinancement",
      notions: ["depreciation", "income_statement"],
      tableau: lExerciceEnChiffres,
      question: (c) => {
        const x = fluxDuChapitre(c);
        return `Le résultat net vaut ${eur(x.resultatNet)}. Les dotations : ${eur(x.amortissements)} aux amortissements de la ligne, ${eur(x.provisions)} à la provision pour litige, ${eur(x.depreciationsDeLActifCirculant)} à la dépréciation de Sonora, une dépréciation de l'actif circulant. Calculez les amortissements et provisions que retient le tableau des flux, la marge brute d'autofinancement, puis son écart avec la capacité d'autofinancement.`;
      },
      champs: (c) => {
        const x = fluxDuChapitre(c);
        const dotations = auCentime(x.amortissements + x.provisions);
        return [
          { libelle: "Amortissements et provisions retenus", attendu: dotations, calcul: `${eur(x.amortissements)} + ${eur(x.provisions)} = ${eur(dotations)}` },
          { libelle: "Marge brute d'autofinancement", attendu: x.margeBruteDAutofinancement, calcul: `${eur(x.resultatNet)} + ${eur(dotations)} = ${eur(x.margeBruteDAutofinancement)}` },
          { libelle: "Écart avec la CAF", attendu: auCentime(x.caf - x.margeBruteDAutofinancement), calcul: `${eur(x.caf)} − ${eur(x.margeBruteDAutofinancement)} = ${eur(auCentime(x.caf - x.margeBruteDAutofinancement))}, la dépréciation de Sonora` },
        ];
      },
      explication: (c) => {
        const x = fluxDuChapitre(c);
        return [
          `L'écart est la dépréciation, ${eur(x.depreciationsDeLActifCirculant)}. Le tableau de financement la rendait par la CAF et prenait les créances en brut ; le tableau des flux la laisse dans le besoin, qu'il prend en net. Deux conventions, un même flux : vous allez le vérifier.`,
        ];
      },
    },
    {
      id: "le-flux-de-l-activite",
      objectifs: [1],
      type: "montants",
      titre: "Le flux de l'activité",
      notions: ["bfr", "net_treasury"],
      tableau: lExerciceEnChiffres,
      question: () =>
        "Sans formule cette fois : les chiffres sont dans le tableau. Calculez le besoin en fonds de roulement lié à l'activité en valeurs nettes au 31 décembre (l'ouverture est vide), le flux de l'activité, puis vérifiez-le par l'autre convention : la CAF moins la variation du besoin en brut.",
      champs: (c) => {
        const x = fluxDuChapitre(c);
        const parLaCaf = auCentime(x.caf - x.besoinBrut);
        return [
          { libelle: "Besoin lié à l'activité, en valeurs nettes", attendu: x.besoinNetDeLActivite, calcul: `${eur(x.besoinBrut)} − ${eur(x.depreciationsAuBilan)} = ${eur(x.besoinNetDeLActivite)}` },
          { libelle: "Flux de l'activité", attendu: x.fluxDeLActivite, calcul: `${eur(x.margeBruteDAutofinancement)} ${moins(x.besoinNetDeLActivite)} = ${eur(x.fluxDeLActivite)}` },
          { libelle: "CAF − variation du besoin en brut", attendu: parLaCaf, calcul: `${eur(x.caf)} − ${eur(x.besoinBrut)} = ${eur(parLaCaf)}` },
        ];
      },
      explication: (c) => {
        const x = fluxDuChapitre(c);
        return [
          `Les deux chemins donnent ${eur(x.fluxDeLActivite)} : la dépréciation s'ajoute d'un côté et se retranche de l'autre. Le besoin net est négatif : au 31 décembre, ce que ${x.entreprise} doit encore (fournisseurs, État, intérêts) dépasse ce qu'on lui doit. Le flux de l'activité dépasse donc un peu la marge brute.`,
          "C'est la phrase du cours sur la capacité d'autofinancement, retournée : la CAF est un flux potentiel ; ce qui en rentre vraiment en trésorerie, c'est la CAF moins ce que le besoin a retenu.",
        ];
      },
    },
    {
      id: "le-tableau-des-flux",
      objectifs: [2],
      type: "a-completer",
      titre: "Le tableau des flux, complet",
      notions: ["net_treasury", "loan_schedule", "frng"],
      tableau: lExerciceEnChiffres,
      question: () =>
        "À vous : complétez le tableau des flux, de la marge brute à la trésorerie de clôture. Un encaissement s'écrit en positif, un décaissement en négatif ; une variation du besoin se retranche.",
      grille: grilleDesFlux,
      explication: (c) => {
        const x = fluxDuChapitre(c);
        return [
          `La trésorerie de clôture retombe sur celle du bilan, ${eur(x.tresorerieDeCloture)}, et sur la variation de la partie II du tableau de financement : les deux tableaux expliquent la même trésorerie, par deux chemins.`,
          `L'activité a dégagé ${eur(x.fluxDeLActivite)}, l'investissement en a pris ${eur(-x.fluxDInvestissement)}, le financement en a apporté ${eur(x.fluxDeFinancement)}.`,
        ];
      },
    },
    {
      id: "predire-la-depreciation",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur Sonora perdue",
      notions: ["depreciation", "net_treasury"],
      question: (c) => {
        const x = fluxDuChapitre(c);
        return `Le dirigeant apprend que Sonora ne paiera sans doute rien : la dépréciation de sa créance passerait de ${pct(x.k.leviers.tauxDePerteProbable)} à ${pct(1)}. Le résultat net baisserait. Et le flux de l'activité de l'année, ${eur(x.fluxDeLActivite)}, …`;
      },
      options: () => {
        const voir = "Faites-le dans le laboratoire, à l'étape suivante.";
        return [
          { texte: "Ne bougerait pas", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Baisserait d'autant que le résultat", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Monterait de l'impôt économisé sur la dépréciation", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-flux",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du résultat et des flux",
      notions: ["depreciation", "net_treasury", "payment_terms"],
      question: () =>
        "Changez les choix de la clôture (le mode d'amortissement de la ligne, la perte probable sur Sonora, la provision pour litige) et le délai de paiement de CampusTech. Le tableau suit le résultat, la marge brute et le flux de l'activité ; le graphique, les trois selon la perte sur Sonora. Relevez le défi.",
      leviers: (c) => {
        const d = departDesFlux(ficheDe(c));
        const L = LEVIERS_DES_FLUX;
        return [
          { code: "amortissement", libelle: "Mode d'amortissement de la ligne", unite: "", min: 0, max: 1, pas: 1, depart: d.amortissement, choix: L.amortissement },
          { code: "perte", libelle: "Perte probable sur la créance de Sonora", unite: "%", ...L.perte, depart: d.perte },
          { code: "provision", libelle: "Provision pour litige", unite: "€", ...L.provision, depart: d.provision },
          { code: "delaiCampusTech", libelle: "Délai de paiement de CampusTech", unite: "jours", ...L.campustech, depart: d.delaiCampusTech },
        ];
      },
      lecture: (c, p) => {
        const f = ficheDe(c);
        const l = laboratoireDesFlux(f, p);
        const d = laboratoireDesFlux(f, departDesFlux(f));
        return [
          { libelle: "Résultat net", montant: l.resultatNet, reference: d.resultatNet },
          { libelle: "Impôt sur les sociétés, encore dû", montant: l.k.impot.impot, reference: d.k.impot.impot },
          { libelle: "Marge brute d'autofinancement", montant: l.margeBruteDAutofinancement, reference: d.margeBruteDAutofinancement },
          { libelle: "Variation du besoin lié à l'activité, en net", montant: l.besoinNetDeLActivite, reference: d.besoinNetDeLActivite },
          { libelle: "Flux de l'activité", montant: l.fluxDeLActivite, reference: d.fluxDeLActivite, fort: true },
          { libelle: "Variation de la trésorerie", montant: l.variationDeTresorerie, reference: d.variationDeTresorerie },
          { libelle: "Effet sur le flux de l'activité", montant: auCentime(l.fluxDeLActivite - d.fluxDeLActivite), reference: 0, effet: true },
        ];
      },
      graphique: (c) => {
        const f = ficheDe(c);
        return {
          levier: "perte",
          courbes: [
            { libelle: "Résultat net", valeur: (p) => laboratoireDesFlux(f, p).resultatNet },
            { libelle: "Marge brute d'autofinancement", valeur: (p) => laboratoireDesFlux(f, p).margeBruteDAutofinancement },
            { libelle: "Flux de l'activité", valeur: (p) => laboratoireDesFlux(f, p).fluxDeLActivite },
          ],
        };
      },
      defi: (c) => {
        const f = ficheDe(c);
        const d = laboratoireDesFlux(f, departDesFlux(f));
        return {
          consigne: `Faites baisser le résultat net d'au moins ${eur(BAISSE_DU_RESULTAT_DU_DEFI)} tout en faisant monter le flux de l'activité au-dessus de ${eur(d.fluxDeLActivite)}.`,
          atteint: (p) => {
            const l = laboratoireDesFlux(f, p);
            return l.resultatNet <= auCentime(d.resultatNet - BAISSE_DU_RESULTAT_DU_DEFI) && l.fluxDeLActivite > d.fluxDeLActivite;
          },
          indice: (p) => {
            const l = laboratoireDesFlux(f, p);
            if (l.resultatNet > auCentime(d.resultatNet - BAISSE_DU_RESULTAT_DU_DEFI))
              return `Le résultat net vaut ${eur(l.resultatNet)}, ${eur(auCentime(d.resultatNet - l.resultatNet))} de moins qu'au départ. Les choix de la clôture le font baisser : cumulez-les.`;
            return `Le résultat a assez baissé, mais le flux de l'activité vaut ${eur(l.fluxDeLActivite)}. Aucun choix de clôture ne le fait monter : cherchez ce qui fait rentrer l'argent plus tôt.`;
          },
          solution: { ...departDesFlux(f), ...SOLUTION_DES_FLUX },
        };
      },
      explication: (c, p) => {
        const f = ficheDe(c);
        const l = laboratoireDesFlux(f, p);
        const d = laboratoireDesFlux(f, departDesFlux(f));
        return [
          `Le résultat a perdu ${eur(auCentime(d.resultatNet - l.resultatNet))}, et le flux de l'activité a gagné ${eur(auCentime(l.fluxDeLActivite - d.fluxDeLActivite))}. Les choix de la clôture n'y sont pour rien : une dotation ne sort pas de la banque, et l'impôt qu'elle économise est encore dû au 31 décembre. Seul le délai de CampusTech a fait rentrer l'argent plus tôt.`,
          "Regardez le graphique : le résultat et la marge brute baissent avec la perte sur Sonora, le flux de l'activité reste plat. Le résultat mesure une richesse ; le tableau des flux, de l'argent. L'impôt économisé, lui, sortira moins de la trésorerie l'an prochain.",
        ];
      },
    },
    {
      id: "l-excedent-d-exploitation",
      objectifs: [4],
      type: "montants",
      titre: "L'excédent de trésorerie d'exploitation",
      notions: ["ebitda_margin", "bfr"],
      question: (c) => {
        const x = fluxDuChapitre(c);
        return `Les analystes isolent aussi l'exploitation seule : l'excédent de trésorerie d'exploitation, l'excédent brut d'exploitation (${eur(x.ebe)}) moins la variation du besoin d'exploitation, en brut. Calculez-le, puis son écart avec le flux de l'activité.`;
      },
      champs: (c) => {
        const x = fluxDuChapitre(c);
        return [
          { libelle: "Excédent de trésorerie d'exploitation", attendu: x.excedentDeTresorerieDExploitation, calcul: `${eur(x.ebe)} − ${eur(x.besoinDExploitation)} = ${eur(x.excedentDeTresorerieDExploitation)}` },
          { libelle: "Écart avec le flux de l'activité", attendu: x.ecartALExcedent, calcul: `${eur(x.fluxDeLActivite)} − ${eur(x.excedentDeTresorerieDExploitation)} = ${eur(x.ecartALExcedent)}` },
        ];
      },
      explication: (c) => {
        const x = fluxDuChapitre(c);
        return [
          `L'exploitation seule a dégagé ${eur(x.excedentDeTresorerieDExploitation)} : c'est elle qui fait vivre ${x.entreprise}. L'écart, ${eur(x.ecartALExcedent)}, vient de ce qui n'est pas l'exploitation : le résultat financier (${signe(x.resultatFinancier)}) et l'impôt (${signe(-x.impot)}), dont ${eur(x.dettesHorsExploitation)} restent dus au 31 décembre.`,
          "Un excédent de trésorerie d'exploitation négatif sur plusieurs années est l'alerte la plus grave : l'exploitation consomme de l'argent au lieu d'en produire.",
        ];
      },
    },
    {
      id: "le-flux-disponible",
      objectifs: [4],
      type: "montants",
      titre: "Le flux disponible",
      notions: ["net_treasury", "loan_schedule"],
      question: () =>
        "Trois chiffres pour lire le tableau. Le flux disponible (l'activité, une fois l'investissement payé), ce qui en reste une fois l'emprunt remboursé, et la part du financement dans la variation de la trésorerie, en pourcentage, au centième.",
      champs: (c) => {
        const x = fluxDuChapitre(c);
        return [
          { libelle: "Flux disponible", attendu: x.fluxDisponible, calcul: `${eur(x.fluxDeLActivite)} ${signe(x.fluxDInvestissement)} = ${eur(x.fluxDisponible)}` },
          { libelle: "Après le remboursement de l'emprunt", attendu: x.fluxApresRemboursement, calcul: `${eur(x.fluxDisponible)} − ${eur(x.t.emplois.remboursements)} = ${eur(x.fluxApresRemboursement)}` },
          { libelle: "Part du financement, en %", attendu: auCentime(x.partDuFinancement * 100), calcul: `${eur(x.fluxDeFinancement)} ÷ ${eur(x.variationDeTresorerie)} × 100 = ${pct(x.partDuFinancement)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = fluxDuChapitre(c);
        return [
          `L'activité paie l'investissement et le remboursement de l'année, et laisse ${eur(x.fluxApresRemboursement)} : c'est ce qu'elle a vraiment libéré. Mais ${pct(x.partDuFinancement)} de la trésorerie gagnée vient du financement, l'apport et l'emprunt de la création.`,
        ];
      },
    },
    {
      id: "le-compte-a-terme",
      objectifs: [4],
      type: "choix",
      titre: "Le compte à terme est-il de la trésorerie ?",
      notions: ["net_treasury"],
      question: (c) => {
        const x = fluxDuChapitre(c);
        return `La trésorerie du tableau compte le compte à terme, ${eur(x.placement)} intérêts courus compris, bloqué un an jusqu'au 6 janvier. Les normes internationales n'admettent comme équivalents de trésorerie que des placements très liquides, à 3 mois au plus. Selon elles, que deviendrait le tableau ?`;
      },
      options: (c) => {
        const x = fluxDuChapitre(c);
        return [
          {
            texte: "Le placement passerait en investissement ; la clôture, au seul compte courant",
            juste: true,
            retour: `Oui. La trésorerie de clôture ne serait plus que le compte courant, ${eur(x.compteCourant)} ; le placement du 6 janvier deviendrait un flux d'investissement, et ses intérêts courus, pas encore encaissés, sortiraient du flux de l'activité. Le total change ; les flux, eux, ne disent pas autre chose : il faut savoir quelle trésorerie un tableau retient.`,
          },
          {
            texte: "Rien : un placement reste de la trésorerie, puisqu'il revient en banque à l'échéance",
            juste: false,
            retour: `Non : bloqué un an, il ne sert pas à payer les dettes du moment. C'est toute la différence entre une trésorerie nette et une trésorerie libre, que le chapitre « Bilan fonctionnel et BFR » montrait déjà.`,
          },
          {
            texte: "Le placement passerait en financement, comme l'emprunt",
            juste: false,
            retour: "Non : le financement retrace ce que donnent et reçoivent les associés et les prêteurs. Un placement fait par l'entreprise est un emploi de ses fonds : un investissement.",
          },
        ];
      },
    },
    {
      id: "deux-tableaux",
      objectifs: [4],
      type: "choix",
      titre: "Deux tableaux, deux questions",
      notions: ["frng", "net_treasury"],
      question: () => "Le banquier a le tableau de financement et le tableau des flux de la même année. Lequel répond à quelle question ?",
      options: () => [
        {
          texte: "Le premier explique le fonds de roulement ; le second, la trésorerie par fonction",
          juste: true,
          retour:
            "Oui. Le tableau de financement part de l'équilibre du bilan fonctionnel : les ressources stables couvrent-elles les emplois stables, et que reste-t-il pour le besoin ? Le tableau des flux part de la trésorerie : l'activité en produit-elle, et qui finance le reste ? C'est pourquoi les banquiers le préfèrent aujourd'hui.",
        },
        {
          texte: "Ils disent la même chose : la variation de la trésorerie y est la même, à l'euro près",
          juste: false,
          retour: "Non : le chiffre final est le même, le chemin non. Le tableau de financement isole la variation du fonds de roulement ; le tableau des flux, le flux de l'activité.",
        },
        {
          texte: "Le premier sert aux associés, le second au fisc, qui contrôle l'impôt payé",
          juste: false,
          retour: "Non : l'un et l'autre servent l'analyse financière, celle des banquiers, des associés et de l'entreprise elle-même.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["net_treasury", "bfr", "depreciation"],
      texte: (c) => {
        const x = fluxDuChapitre(c);
        return [
          `Vous avez dressé le tableau des flux de trésorerie du premier exercice ${dE(x.entreprise)} : ${eur(x.fluxDeLActivite)} venus de l'activité, ${eur(-x.fluxDInvestissement)} investis, ${eur(x.fluxDeFinancement)} apportés par le financement, ${eur(x.variationDeTresorerie)} de trésorerie en plus.`,
          "Deux pièges. La marge brute d'autofinancement laisse les dépréciations de l'actif circulant dans le besoin, qu'elle prend en net : la CAF moins le besoin en brut donne le même flux. Et une charge calculée fait baisser le résultat, pas la trésorerie de l'année.",
          "Au niveau de l'examen, vous savez calculer la marge brute d'autofinancement, le flux de l'activité par le besoin en valeurs nettes, les flux d'investissement et de financement, et retrouver la trésorerie de clôture. Vous savez lire le tableau : l'excédent de trésorerie d'exploitation, le flux disponible, la part du financement, et la trésorerie que le tableau retient.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Flux de l'activité = MBA − variation du BFR en net = CAF − variation du BFR en brut. Excédent de trésorerie d'exploitation = EBE − variation du BFRE. Flux disponible = flux de l'activité + flux d'investissement.",
    },
  ],
};
