import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { PieceDuBureau } from "../bureaux/types";
import { dateDe } from "../chapitres/la-cloture";
import { DIVIDENDE_DEMANDE_PAR_ACTION } from "../monde/comptabilite-approfondie";
import { empruntALaCloture } from "../monde/emprunt";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import {
  JOUR_DES_FLUX_DE_L_ASSISTANTE,
  ecartsDeLAssistante,
  fluxDeLAssistante,
  fluxJustes,
  totauxDesFlux,
  type ErreurDesFlux,
  type LignesDesFlux,
} from "../monde/flux-de-l-assistante";
import { tableauDesFlux } from "../monde/tableaux-de-flux";
import { eur, etapeDuControle, terme, type LigneDuDossier } from "./lignes-du-dossier";
import type { Enquete } from "./types";

/**
 * L'ENQUÊTE : LE TABLEAU DES FLUX DE L'ASSISTANTE (comptabilité générale, palier 4 ; la suite du
 * chapitre « Le tableau des flux de trésorerie »).
 *
 * En mars N+1, l'assistante comptable a dressé le tableau des flux de trésorerie du premier exercice de
 * NOVA, méthode indirecte, pour la banque. Sa trésorerie de clôture ne retombe pas sur celle du bilan.
 * L'élève contrôle chaque ligne, nomme l'erreur de chaque fausse, refait le tableau, puis explique
 * l'écart au président. Le format « enquête » sur un document de synthèse : enquetes/lignes-du-dossier.ts.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : monde/tableaux-de-flux.ts pour les bons,
 * monde/flux-de-l-assistante.ts pour ceux de l'assistante.
 */

const f = EXERCICE_DE_NOVA;
const x = tableauDesFlux(f);
const j = fluxJustes(f);
const a = fluxDeLAssistante(f);
const tj = totauxDesFlux(j);
const ta = totauxDesFlux(a);
const ecarts = ecartsDeLAssistante(f);
const e = empruntALaCloture(f.pret);
const ecartDeTresorerie = Math.round((tj.cloture - ta.cloture) * 100) / 100;

const JOUR = dateDe(JOUR_DES_FLUX_DE_L_ASSISTANTE);
const AU_31_DECEMBRE = `${dateDe(f.cloture)} N`;

// ─────────────────────────────────────────────────────────────────────────────
// LE DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "Le tableau des flux pour la banque",
  paragraphes: [
    "Bonjour,",
    `Notre assistante a dressé le tableau des flux de trésorerie de N. Elle trouve une trésorerie de clôture de ${eur(ta.cloture)}, quand le bilan en porte ${eur(x.tresorerieDeCloture)}. Elle pense à un oubli dans le bilan.`,
    "Contrôlez son tableau ligne par ligne. Pour chaque ligne fausse, dites-moi ce qui ne va pas. Puis refaites le tableau, et dites-moi d'où venait l'écart.",
    "Merci. Le président",
  ],
};

const CHIFFRES: PieceDuBureau = {
  code: "chiffres",
  nature: "note",
  titre: "L'exercice en chiffres",
  de: "Le service comptable de NOVA",
  a: "L'assistante",
  date: AU_31_DECEMBRE,
  objet: "Ce que disent le compte de résultat et le bilan",
  montants: [
    { libelle: "Résultat net", montant: x.resultatNet },
    { libelle: "Dotation aux amortissements de la ligne", montant: x.amortissements },
    { libelle: "Dotation à la provision pour litige", montant: x.provisions },
    { libelle: "Dotation à la dépréciation de la créance de Sonora", montant: x.depreciationsDeLActifCirculant },
    { libelle: "Besoin en fonds de roulement au 31 décembre, en brut", montant: x.besoinBrut },
    { libelle: "Dépréciation des créances au bilan", montant: x.depreciationsAuBilan },
    { libelle: "Trésorerie au 31 décembre : la banque et le compte à terme", montant: x.tresorerieDeCloture, fort: true },
  ],
  mention: "NOVA est née le 2 janvier N : le bilan d'ouverture est vide.",
};

const FACTURE: PieceDuBureau = {
  code: "facture",
  nature: "facture",
  titre: "Facture de la ligne de montage",
  de: "Le fabricant de la ligne",
  a: "NOVA",
  date: `${dateDe(f.equipement.dateDAchat)} N`,
  objet: "Ligne de montage, payée à la livraison",
  montants: [
    { libelle: "Hors taxes", montant: f.equipement.ht },
    { libelle: "TVA", montant: f.equipement.tva },
    { libelle: "Toutes taxes comprises, payé", montant: f.equipement.ttc, fort: true },
  ],
  mention: "La TVA de la ligne a été récupérée sur les déclarations de N.",
};

const EMPRUNT: PieceDuBureau = {
  code: "emprunt",
  nature: "extrait",
  titre: "Les échéances de l'emprunt payées en N",
  de: "La banque de NOVA",
  a: "NOVA",
  date: AU_31_DECEMBRE,
  paragraphes: [`Emprunt reçu le ${dateDe(f.pret.versement)} N : ${eur(f.pret.capital)}.`],
  lignes: e.echeances.flatMap((y) => [
    { date: `${dateDe(y.date)} N`, libelle: `Échéance n° ${y.numero}, capital`, montant: -y.amortissement },
    { date: `${dateDe(y.date)} N`, libelle: `Échéance n° ${y.numero}, intérêts`, montant: -y.interets },
  ]),
  montants: [
    { libelle: "Capital remboursé en N", montant: e.capitalRembourse },
    { libelle: "Intérêts payés en N", montant: e.interetsPayes, fort: true },
  ],
};

const AFFECTATION: PieceDuBureau = {
  code: "affectation",
  nature: "lettre",
  titre: "Le projet d'affectation du bénéfice de N",
  de: "Le président de NOVA",
  a: "Les associés",
  date: JOUR,
  objet: "Assemblée de juin N+1",
  paragraphes: [`Je proposerai à l'assemblée de juin N+1 un dividende de ${eur(DIVIDENDE_DEMANDE_PAR_ACTION)} par action, soit ${eur(ecarts.dividendeDeN)}, mis en paiement après le vote.`],
};

/** Les lignes d'un tableau des flux, dans l'ordre du modèle, avec leurs totaux. */
const montantsDuTableau = (l: LignesDesFlux) => {
  const t = totauxDesFlux(l);
  return [
    { libelle: "Résultat net", montant: l.resultatNet },
    { libelle: "Amortissements et provisions", montant: l.amortissementsEtProvisions },
    { libelle: "Marge brute d'autofinancement", montant: t.margeBrute },
    { libelle: "Variation du besoin lié à l'activité, retranchée", montant: l.variationDuBesoin },
    { libelle: "Flux de l'activité", montant: t.activite, fort: true },
    { libelle: "Acquisitions d'immobilisations, décaissées", montant: l.acquisitions },
    { libelle: "Flux d'investissement", montant: t.investissement, fort: true },
    { libelle: "Augmentation de capital", montant: l.augmentationDeCapital },
    { libelle: "Emprunts reçus", montant: l.empruntsRecus },
    { libelle: "Remboursements d'emprunts, décaissés", montant: l.remboursements },
    { libelle: "Dividendes versés", montant: l.dividendes },
    { libelle: "Flux de financement", montant: t.financement, fort: true },
    { libelle: "Trésorerie de clôture", montant: t.cloture, fort: true },
  ];
};

const TABLEAU: PieceDuBureau = {
  code: "tableau",
  nature: "note",
  titre: "Le tableau des flux de l'assistante",
  de: "L'assistante comptable",
  a: "Le président",
  date: JOUR,
  objet: "Tableau des flux de trésorerie de N, méthode indirecte",
  paragraphes: [
    `Le besoin lié à l'activité, en valeurs nettes : ${eur(x.besoinBrut)} et ${eur(x.depreciationsAuBilan)} de dépréciation, soit ${eur(a.variationDuBesoin)} à retrancher.`,
    "Les montants sont écrits sans leur signe ; les décaissements se retranchent.",
  ],
  montants: montantsDuTableau(a),
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, CHIFFRES, FACTURE, EMPRUNT, AFFECTATION, TABLEAU];

// ─────────────────────────────────────────────────────────────────────────────
// LE CONTRÔLE
// ─────────────────────────────────────────────────────────────────────────────

/** Les raisons : les cinq erreurs et trois leurres ; la plus longue est un leurre. */
const RAISONS: readonly { code: ErreurDesFlux | "brut" | "ouverture" | "provision"; libelle: string }[] = [
  { code: "depreciation", libelle: "Une dépréciation de l'actif circulant est ajoutée" },
  { code: "signe", libelle: "Le signe est inversé" },
  { code: "tva", libelle: "La TVA récupérée est comprise" },
  { code: "interets", libelle: "Des intérêts sont comptés dans le financement" },
  { code: "exercice", libelle: "Un flux de l'exercice suivant est compté" },
  { code: "brut", libelle: "Le besoin est pris en valeurs brutes" },
  { code: "provision", libelle: "La provision est oubliée" },
  { code: "ouverture", libelle: "L'apport de la création est compté dans la trésorerie d'ouverture au lieu des flux" },
];

const LIGNES: readonly LigneDuDossier[] = [
  { code: "resultat", libelle: "Résultat net", piece: "chiffres", dossier: a.resultatNet, juste: j.resultatNet, raison: null, pourquoi: "Juste : la méthode indirecte part du résultat net de l'exercice." },
  {
    code: "dotations",
    libelle: "Amortissements et provisions",
    piece: "chiffres",
    dossier: a.amortissementsEtProvisions,
    juste: j.amortissementsEtProvisions,
    raison: "depreciation",
    pourquoi: `Fausse : la dépréciation de Sonora, ${eur(ecarts.depreciation)}, est une dépréciation de l'actif circulant. Le modèle la laisse dans le besoin, pris en valeurs nettes. L'ajouter ici, c'est la compter deux fois.`,
  },
  {
    code: "besoin",
    libelle: "Variation du besoin lié à l'activité",
    piece: "tableau",
    dossier: a.variationDuBesoin,
    juste: j.variationDuBesoin,
    raison: "signe",
    pourquoi: `Fausse : en valeurs nettes, le besoin du 31 décembre vaut ${eur(x.besoinBrut)} − ${eur(x.depreciationsAuBilan)} = ${eur(j.variationDuBesoin)}. Il est négatif : en le retranchant, la trésorerie de l'activité monte. L'assistante en a changé le signe.`,
  },
  {
    code: "acquisitions",
    libelle: "Acquisitions d'immobilisations",
    piece: "facture",
    dossier: a.acquisitions,
    juste: j.acquisitions,
    raison: "tva",
    pourquoi: `Fausse : la TVA de la ligne, ${eur(ecarts.tvaDeLaLigne)}, est sortie puis revenue dans l'année. Le flux d'investissement retient le prix hors taxes, ${eur(f.equipement.ht)}.`,
  },
  { code: "capital", libelle: "Augmentation de capital", piece: "chiffres", dossier: a.augmentationDeCapital, juste: j.augmentationDeCapital, raison: null, pourquoi: "Juste : le bilan d'ouverture est vide, l'apport du 2 janvier est un flux de financement de l'année." },
  { code: "emprunts", libelle: "Emprunts reçus", piece: "emprunt", dossier: a.empruntsRecus, juste: j.empruntsRecus, raison: null, pourquoi: `Juste : l'emprunt reçu le ${dateDe(f.pret.versement)}, ${eur(f.pret.capital)}.` },
  {
    code: "remboursements",
    libelle: "Remboursements d'emprunts",
    piece: "emprunt",
    dossier: a.remboursements,
    juste: j.remboursements,
    raison: "interets",
    pourquoi: `Fausse : les intérêts payés, ${eur(ecarts.interetsPayes)}, sont des charges : ils sont déjà dans le résultat, donc dans le flux de l'activité. Le financement ne retient que le capital remboursé, ${eur(e.capitalRembourse)}.`,
  },
  {
    code: "dividendes",
    libelle: "Dividendes versés",
    piece: "affectation",
    dossier: a.dividendes,
    juste: j.dividendes,
    raison: "exercice",
    pourquoi: `Fausse : le dividende sur le bénéfice de N, ${eur(ecarts.dividendeDeN)}, sera voté et payé en N+1. Aucun dividende n'a été versé en N : zéro.`,
  },
];

const nombreDErreurs = LIGNES.filter((l) => l.raison).length;

// ─────────────────────────────────────────────────────────────────────────────
// LE TABLEAU CORRIGÉ
// ─────────────────────────────────────────────────────────────────────────────

/** Le tableau des flux corrigé : celui de l'assistante en regard, le juste à saisir, totaux compris. */
export function grilleDesFluxCorriges(): TableauACompleter {
  const donnee = (valeur: number): CelluleACompleter => ({ valeur });
  const saisir = (valeur: number, calcul: string, indice: string): CelluleACompleter => ({ valeur, saisir: true, calcul, indice });
  const ligne = (libelle: string, assistante: number, juste: CelluleACompleter, total?: { plus: number[]; moins?: number[] }) => ({
    libelle,
    ...(total ? { fort: true, totalDe: total } : {}),
    cellules: [donnee(assistante), juste],
  });
  return {
    titre: "Tableau des flux de trésorerie de N, corrigé",
    colonnes: ["L'assistante", "Corrigé"],
    lignes: [
      /* 0 */ ligne("Résultat net", a.resultatNet, saisir(j.resultatNet, `le résultat de l'exercice, ${eur(j.resultatNet)}`, "le point de départ de la méthode indirecte")),
      /* 1 */ ligne("Amortissements et provisions", a.amortissementsEtProvisions, saisir(j.amortissementsEtProvisions, `${eur(x.amortissements)} + ${eur(x.provisions)} = ${eur(j.amortissementsEtProvisions)}, sans la dépréciation de Sonora`, "les dotations, sauf la dépréciation d'un actif circulant")),
      /* 2 */ ligne("Marge brute d'autofinancement", ta.margeBrute, saisir(tj.margeBrute, `${eur(j.resultatNet)} + ${eur(j.amortissementsEtProvisions)} = ${eur(tj.margeBrute)}`, "le résultat plus les amortissements et provisions"), { plus: [0, 1] }),
      /* 3 */ ligne("Variation du besoin lié à l'activité", a.variationDuBesoin, saisir(j.variationDuBesoin, `${eur(x.besoinBrut)} − ${eur(x.depreciationsAuBilan)} − ${eur(0)} à l'ouverture = ${eur(j.variationDuBesoin)}`, "le besoin du 31 décembre en valeurs nettes, moins celui de l'ouverture")),
      /* 4 */ ligne("Flux de l'activité (A)", ta.activite, saisir(tj.activite, `${eur(tj.margeBrute)} ${terme(-j.variationDuBesoin)} = ${eur(tj.activite)}`, "la marge brute moins la variation du besoin"), { plus: [2], moins: [3] }),
      /* 5 */ ligne("Acquisitions d'immobilisations", a.acquisitions, saisir(j.acquisitions, `la ligne, hors taxes : ${eur(j.acquisitions)}`, "un décaissement s'écrit en négatif")),
      /* 6 */ ligne("Cessions d'immobilisations", a.cessions, donnee(j.cessions)),
      /* 7 */ ligne("Flux d'investissement (B)", ta.investissement, saisir(tj.investissement, eur(tj.investissement), "les acquisitions et les cessions"), { plus: [5, 6] }),
      /* 8 */ ligne("Augmentation de capital", a.augmentationDeCapital, saisir(j.augmentationDeCapital, `l'apport des associés : ${eur(j.augmentationDeCapital)}`, "l'apport de la création")),
      /* 9 */ ligne("Emprunts reçus", a.empruntsRecus, saisir(j.empruntsRecus, `l'emprunt : ${eur(j.empruntsRecus)}`, "le capital reçu de la banque")),
      /* 10 */ ligne("Remboursements d'emprunts", a.remboursements, saisir(j.remboursements, `le capital des échéances de N : ${eur(j.remboursements)}`, "le capital seul, en négatif")),
      /* 11 */ ligne("Dividendes versés", a.dividendes, saisir(j.dividendes, "aucun dividende versé en N : zéro", "ce qui a été payé aux associés pendant l'exercice")),
      /* 12 */ ligne("Flux de financement (C)", ta.financement, saisir(tj.financement, `${eur(j.augmentationDeCapital)} + ${eur(j.empruntsRecus)} ${terme(j.remboursements)} = ${eur(tj.financement)}`, "les apports et les emprunts, moins les remboursements et les dividendes"), { plus: [8, 9, 10, 11] }),
      /* 13 */ ligne("Variation de la trésorerie (A + B + C)", ta.variation, saisir(tj.variation, `${eur(tj.activite)} ${terme(tj.investissement)} ${terme(tj.financement)} = ${eur(tj.variation)}`, "la somme des trois flux"), { plus: [4, 7, 12] }),
      /* 14 */ ligne("Trésorerie d'ouverture", a.tresorerieDOuverture, donnee(j.tresorerieDOuverture)),
      /* 15 */ ligne("Trésorerie de clôture", ta.cloture, saisir(tj.cloture, `${eur(j.tresorerieDOuverture)} + ${eur(tj.variation)} = ${eur(tj.cloture)}, celle du bilan`, "l'ouverture plus la variation"), { plus: [13, 14] }),
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ENQUÊTE
// ─────────────────────────────────────────────────────────────────────────────

export const LE_TABLEAU_DES_FLUX_DE_L_ASSISTANTE: Enquete = {
  format: "enquete",
  code: "le-tableau-des-flux-de-l-assistante",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-tableau-des-flux-de-tresorerie"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Enquête : le tableau des flux de l'assistante",
  accroche: "Le tableau des flux de l'assistante ne retombe pas sur la trésorerie du bilan. Contrôlez chaque ligne, nommez les erreurs, refaites le tableau, puis expliquez l'écart au président.",
  objectifs: [
    "Contrôler un tableau des flux de trésorerie, méthode indirecte, ligne par ligne",
    "Nommer l'erreur d'une ligne : la dépréciation, le signe, la TVA, les intérêts, l'exercice",
    "Refaire les trois flux et retrouver la trésorerie du bilan",
    "Expliquer un écart de trésorerie par ses causes, chiffres à l'appui",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. L'assistante comptable a dressé le tableau des flux du premier exercice pour la banque.`,
    "Sur votre poste, le dossier : le courriel du président, l'exercice en chiffres, la facture de la ligne, les échéances de l'emprunt, le projet d'affectation du bénéfice et le tableau de l'assistante. Certaines lignes sont justes, d'autres non : c'est votre enquête.",
  ],
  pile: PILE,
  etapes: [
    etapeDuControle({
      id: "le-controle",
      titre: "Contrôler les lignes",
      consigne: "Pour chaque ligne du tableau de l'assistante, dites si elle est juste. Si elle est fausse, choisissez ce qui ne va pas.",
      pieces: ["tableau", "chiffres"],
      raisons: RAISONS,
      lignes: LIGNES,
      explication: [`${nombreDErreurs} lignes sur ${LIGNES.length} sont fausses, chacune d'une nature différente. Ce n'est pas le bilan qui oublie quelque chose : c'est le tableau.`],
    }),
    {
      id: "le-tableau",
      type: "etat",
      titre: "Refaire le tableau",
      consigne: "Complétez la colonne corrigée. Un décaissement s'écrit en négatif ; la variation du besoin s'écrit avec son signe, puis se retranche.",
      pieces: ["chiffres", "emprunt"],
      grille: grilleDesFluxCorriges(),
      reussite: "Le tableau des flux corrigé retombe sur la trésorerie du bilan.",
      explication: [
        `Corrigé, le tableau retombe sur la trésorerie du bilan, ${eur(tj.cloture)} : l'activité ${eur(tj.activite)}, l'investissement ${eur(tj.investissement)}, le financement ${eur(tj.financement)}.`,
        `L'écart de l'assistante, ${eur(ecartDeTresorerie)}, est la somme de ses erreurs : la dépréciation, le signe du besoin, la TVA de la ligne, les intérêts et le dividende de N+1.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez au président, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "l-ecart",
          question: `D'où venait l'écart de ${eur(ecartDeTresorerie)} entre le tableau et le bilan ?`,
          options: [
            { texte: "Des erreurs du tableau, dont la plus forte est le dividende", juste: true, retour: `Oui : le dividende de N+1, ${eur(ecarts.dividendeDeN)}, la TVA de la ligne, ${eur(ecarts.tvaDeLaLigne)}, et les intérêts, ${eur(ecarts.interetsPayes)}, l'emportent sur la dépréciation comptée deux fois.` },
            { texte: "D'un oubli dans le bilan, comme le pensait l'assistante", juste: false, retour: "Non : le bilan est celui de la clôture, contrôlée. Un tableau des flux doit retomber sur lui ; c'est le tableau qu'on corrige." },
            { texte: "Du compte à terme, qui n'est pas de la trésorerie au sens strict", juste: false, retour: "Non : le bilan et le tableau prennent tous deux la banque et le compte à terme. Le choix est discutable, mais il ne crée pas d'écart." },
            { texte: "De la dépréciation de Sonora, qu'il fallait retrancher du résultat net avant tout le reste", juste: false, retour: "Non : la dépréciation est déjà dans le résultat. Elle ne se reprend pas dans la marge brute, puisque le besoin est en valeurs nettes." },
          ],
        },
        {
          id: "l-activite",
          question: "Quel flux de l'activité NOVA a-t-elle dégagé en N ?",
          options: [
            { texte: `${eur(tj.activite)}`, juste: true, retour: `Oui : ${eur(tj.margeBrute)} de marge brute d'autofinancement, et un besoin net de ${eur(j.variationDuBesoin)} qui, retranché, l'augmente.` },
            { texte: `${eur(ta.activite)}, celui de l'assistante`, juste: false, retour: "Non : la dépréciation y est comptée deux fois, et le besoin a le mauvais signe." },
            { texte: `${eur(x.caf)}, la capacité d'autofinancement`, juste: false, retour: "Non : la capacité d'autofinancement ne tient pas compte de la variation du besoin. Le flux de l'activité, si." },
          ],
        },
      ],
      explication: [`Votre réponse au président : le bilan est juste ; corrigé, le tableau des flux explique la trésorerie de ${eur(tj.cloture)}. Il peut partir à la banque.`],
    },
  ],
};
