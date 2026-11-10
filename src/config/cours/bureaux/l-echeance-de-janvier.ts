import { arrondi, eur, pct as enPoints, quotient2, type NatureDuNombre } from "../../../pedagogy/cours/deux-decimales";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { auCentime } from "../monde/amortissement";
import { dateEcrite as dateDuCompte } from "../monde/compte-client-de-nova";
import { EQUIPEMENT, PLACEMENT } from "../monde/exercice-de-nova";
import {
  INFLATION_PREVUE,
  PAIEMENT_ECHELONNE,
  PAS_DU_VERSEMENT,
  RENOUVELLEMENT,
  TAUX_DE_LA_BANQUE,
  coefficientDeValeurAcquise,
  interetsCourusDeLaReserve,
  interetsSimples,
  offreEchelonnee,
  prixFuturDeLaLigne,
  tauxReel,
  versementQuiSuffit,
} from "../monde/valeur-et-temps";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : L'ÉCHÉANCE DE JANVIER (comptabilité générale, palier 4 ; DCG UE6 2.1).
 *
 * La suite du chapitre « La valeur et le temps », au bureau : le 6 janvier N+1, le compte à terme de NOVA
 * arrive à échéance, le fournisseur de la ligne semi-automatique attend une réponse à son offre en
 * annuités, et la première ligne sera à remplacer fin N+5. Le président attend ses réponses. L'élève
 * classe les sommes du dossier (d'aujourd'hui, à actualiser, à capitaliser), chiffre l'échéance et la
 * part de ses intérêts qui revient à N+1, compare les deux façons de payer la ligne en valeur actuelle,
 * calcule le versement qui paie la ligne neuve inflation comprise, puis répond.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS (monde/valeur-et-temps.ts, exercice-de-nova.ts) ;
 * ce fichier écrit la pile, les consignes et les corrigés, qui ne partent jamais au navigateur
 * (pedagogy/cours/bureau-servi.ts). Aucune hypothèse nouvelle sur NOVA.
 *
 * POURQUOI UN BUREAU : le chapitre manie des sommes à des dates différentes ; au bureau, elles arrivent
 * en pièces, et le geste est de les ramener à une même date avant de les comparer. Le piège : additionner
 * les annuités du fournisseur, ou réunir le prix d'aujourd'hui pour une ligne qu'on paiera dans 5 ans.
 */

/** Un jour du cours, écrit : « 6 janvier ». */
const dateEcrite = (d: { jour: number; mois: number }) => dateDuCompte({ jour: d.jour, mois: d.mois });
/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);
const nb = (x: number, d = 4) => (x + 0).toLocaleString("fr-FR", { maximumFractionDigits: d });

const JOUR_DU_BUREAU = PLACEMENT.echeance;
const JOUR = `${dateEcrite(JOUR_DU_BUREAU)} N+1`;
const n = RENOUVELLEMENT.versements;
const FIN = `fin N+${n}`;

/** Les chiffres du bureau, tous lus ou calculés dans le monde du cours. */
export function chiffresDeLEcheance() {
  const interets = interetsSimples(PLACEMENT.montant, PLACEMENT.tauxAnnuel, PLACEMENT.dureeMois / 12);
  const courus = interetsCourusDeLaReserve();
  const offre = offreEchelonnee();
  const prixFutur = prixFuturDeLaLigne();
  // Le coefficient au dix-millième, et les versements qui partent de lui, comme sur la copie (deux-decimales.ts).
  const coefficient = arrondi(coefficientDeValeurAcquise(RENOUVELLEMENT.taux, n), 4);
  return {
    interets,
    courus,
    partDeN1: auCentime(interets - courus),
    verse: auCentime(PLACEMENT.montant + interets),
    offre,
    prixFutur,
    coefficient,
    versementNecessaire: quotient2(prixFutur, coefficient),
    versementSansInflation: quotient2(RENOUVELLEMENT.prixDAujourdHui, coefficient),
    suffit: versementQuiSuffit(),
    reel: tauxReel(RENOUVELLEMENT.taux, INFLATION_PREVUE),
  };
}

const x = chiffresDeLEcheance();

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "Les sommes à régler cette semaine",
  paragraphes: [
    "Bonjour,",
    "Le compte à terme est échu ce matin. Dites-moi ce que la banque nous verse, et ce qui, dans ses intérêts, est un produit de cette année.",
    `Le fournisseur de la ligne attend notre réponse : ${eur(PAIEMENT_ECHELONNE.comptant)} comptant, ou ses annuités. Laquelle prenons-nous ?`,
    `Enfin, la première ligne sera à remplacer ${FIN}. Combien faut-il placer chaque année pour la payer ?`,
    "Merci. Le président",
  ],
};

const AVIS: PieceDuBureau = {
  code: "avis",
  nature: "avis",
  titre: "Avis d'échéance du compte à terme",
  de: "La banque de NOVA",
  a: "NOVA",
  date: JOUR,
  objet: "Votre compte à terme arrive à échéance",
  paragraphes: [
    `Placement de ${eur(PLACEMENT.montant)} du ${dateEcrite(PLACEMENT.date)} N au ${dateEcrite(PLACEMENT.echeance)} N+1, à ${pct(PLACEMENT.tauxAnnuel)} l'an, intérêts simples, année de 360 jours.`,
    "Capital et intérêts sont virés ce jour sur votre compte courant.",
  ],
};

const NOTE_DE_CLOTURE: PieceDuBureau = {
  code: "cloture",
  nature: "note",
  titre: "Note de clôture : les intérêts courus",
  de: "Le service comptable de NOVA",
  a: "Le président",
  date: "31 décembre N",
  objet: "Le produit à recevoir du compte à terme",
  paragraphes: ["Les intérêts du compte à terme courus du 6 janvier au 31 décembre N ont été comptés en produit de N, à recevoir à l'échéance."],
  montants: [{ libelle: "Intérêts courus au 31 décembre N", montant: x.courus, fort: true }],
};

const OFFRE_DU_FOURNISSEUR: PieceDuBureau = {
  code: "fournisseur",
  nature: "lettre",
  titre: "L'offre du fournisseur de la ligne",
  de: "Le fournisseur de la ligne semi-automatique",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Vos conditions de paiement",
  paragraphes: [
    `Prix de la ligne : ${eur(PAIEMENT_ECHELONNE.comptant)} hors taxes, payables comptant le 1er janvier N+1.`,
    `Ou, à votre choix, ${PAIEMENT_ECHELONNE.annees} annuités de ${eur(PAIEMENT_ECHELONNE.annuite)}, payées à la fin de chaque année, de N+1 à N+${PAIEMENT_ECHELONNE.annees}. Sans frais de dossier.`,
  ],
};

const OFFRE_DE_LA_BANQUE: PieceDuBureau = {
  code: "banque",
  nature: "lettre",
  titre: "L'offre de la banque",
  de: "La banque de NOVA",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Le financement de votre ligne",
  paragraphes: [`Nous vous prêtons ${eur(PAIEMENT_ECHELONNE.comptant)} à ${pct(TAUX_DE_LA_BANQUE)} l'an sur ${PAIEMENT_ECHELONNE.annees} ans, remboursés par annuités constantes, la première un an après le versement.`],
};

const FICHE_DE_LA_LIGNE: PieceDuBureau = {
  code: "ligne",
  nature: "note",
  titre: "Fiche de la première ligne",
  de: "Le service comptable de NOVA",
  a: "Le président",
  date: JOUR,
  paragraphes: [
    `${EQUIPEMENT.designation}, achetée ${eur(EQUIPEMENT.ht)} hors taxes et mise en service en janvier N. Usée en ${EQUIPEMENT.dureeAns} ans : à remplacer ${FIN}.`,
    `Le président veut placer une somme égale à la fin de chaque année, de N+1 à N+${n}, au taux du compte à terme, ${pct(RENOUVELLEMENT.taux)}. Le dernier versement tombe le jour de l'achat.`,
  ],
};

const INFLATION: PieceDuBureau = {
  code: "inflation",
  nature: "note",
  titre: "Note sur les prix",
  de: "Le contrôle de gestion de NOVA",
  a: "Le président",
  date: JOUR,
  paragraphes: [`Les prix devraient monter de ${pct(INFLATION_PREVUE)} par an, la cible de la banque centrale ; ceux des machines aussi. Une ligne neuve coûterait aujourd'hui ce qu'a coûté la première.`],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, AVIS, NOTE_DE_CLOTURE, OFFRE_DU_FOURNISSEUR, OFFRE_DE_LA_BANQUE, FICHE_DE_LA_LIGNE, INFLATION];

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

const saisir = (valeur: number, calcul: string, indice: string, autres: { tolerance?: number; unite?: string; horsTotal?: boolean; nature?: NatureDuNombre } = {}) => ({ valeur, saisir: true, calcul, indice, ...autres });

/** L'échéance du compte à terme : ce que la banque verse, et la part des intérêts qui revient à N+1. */
export function grilleDeLEcheance(): TableauACompleter {
  return {
    titre: `L'échéance du compte à terme, le ${JOUR}`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Capital placé", cellules: [{ valeur: PLACEMENT.montant }] },
      { libelle: "Intérêts de l'année de placement", cellules: [saisir(x.interets, `${eur(PLACEMENT.montant)} × ${pct(PLACEMENT.tauxAnnuel)} × 360 ÷ 360 = ${eur(x.interets)}`, "le capital × le taux, pour une année entière")] },
      { libelle: "Somme versée à l'échéance", fort: true, totalDe: { plus: [0, 1] }, cellules: [saisir(x.verse, `${eur(PLACEMENT.montant)} + ${eur(x.interets)} = ${eur(x.verse)}`, "le capital et ses intérêts")] },
      { libelle: "Intérêts déjà comptés en produit de N", cellules: [{ valeur: x.courus }] },
      {
        libelle: "Intérêts qui sont un produit de N+1",
        fort: true,
        totalDe: { plus: [1], moins: [3] },
        cellules: [saisir(x.partDeN1, `${eur(x.interets)} − ${eur(x.courus)} = ${eur(x.partDeN1)}`, "les intérêts de l'année, moins ceux que la clôture a déjà comptés")],
      },
    ],
  };
}

/** Les annuités du fournisseur, ramenées au 1er janvier N+1 au taux de la banque. */
export function grilleDesDeuxPaiements(): TableauACompleter {
  const o = x.offre;
  return {
    titre: "Les annuités du fournisseur, face au comptant",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Total des annuités", cellules: [saisir(o.total, `${o.annees} × ${eur(o.annuite)} = ${eur(o.total)}`, "les annuités additionnées, sans tenir compte des dates", { horsTotal: true })] },
      {
        libelle: `Valeur actuelle des annuités à ${pct(TAUX_DE_LA_BANQUE)}`,
        cellules: [saisir(o.valeurActuelle, `${eur(o.annuite)} × (1 − ${nb(1 + TAUX_DE_LA_BANQUE)}^−${o.annees}) ÷ ${nb(TAUX_DE_LA_BANQUE)} = ${eur(o.valeurActuelle)}`, "l'annuité × (1 − (1 + i)^−n) ÷ i, au taux de la banque")],
      },
      { libelle: "Prix comptant", cellules: [{ valeur: o.comptant }] },
      {
        libelle: "Ce que les annuités coûtent de plus, en valeur d'aujourd'hui",
        fort: true,
        totalDe: { plus: [1], moins: [2] },
        cellules: [saisir(o.surcout, `${eur(o.valeurActuelle)} − ${eur(o.comptant)} = ${eur(o.surcout)}`, "la valeur actuelle des annuités, moins le comptant")],
      },
      {
        libelle: "Annuité constante du prêt de la banque",
        cellules: [saisir(o.annuiteDeLaBanque, `${eur(o.comptant)} × ${nb(TAUX_DE_LA_BANQUE)} ÷ (1 − ${nb(1 + TAUX_DE_LA_BANQUE)}^−${o.annees}) = ${eur(o.annuiteDeLaBanque)}`, "C × i ÷ (1 − (1 + i)^−n)", { horsTotal: true })],
      },
    ],
  };
}

/** La réserve de renouvellement : le prix de la ligne neuve, et le versement qui la paie. */
export function grilleDeLaReserve(): TableauACompleter {
  const r = RENOUVELLEMENT;
  return {
    titre: `La réserve de la ligne neuve, ${FIN}`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: `Prix d'une ligne neuve ${FIN}`, cellules: [saisir(x.prixFutur, `${eur(r.prixDAujourdHui)} × ${nb(1 + INFLATION_PREVUE)}^${n} = ${eur(x.prixFutur)}`, "le prix d'aujourd'hui, capitalisé au taux de l'inflation")] },
      {
        libelle: `Coefficient de valeur acquise de ${n} annuités`,
        cellules: [saisir(x.coefficient, `(${nb(1 + r.taux)}^${n} − 1) ÷ ${nb(r.taux)} = ${nb(x.coefficient)}`, "((1 + i)^n − 1) ÷ i, au taux du compte à terme", { tolerance: 0.0001, unite: "", nature: "coefficient" })],
      },
      { libelle: "Versement annuel qui réunit ce prix", cellules: [saisir(x.versementNecessaire, `${eur(x.prixFutur)} ÷ ${nb(x.coefficient)} = ${eur(x.versementNecessaire)}`, "le prix futur ÷ le coefficient")] },
      { libelle: `Versement retenu, au pas de ${eur(PAS_DU_VERSEMENT)} au-dessus`, cellules: [saisir(x.suffit, `${eur(x.versementNecessaire)}, arrondis au pas de ${eur(PAS_DU_VERSEMENT)} au-dessus : ${eur(x.suffit)}`, "le versement, arrondi vers le haut")] },
      {
        libelle: "Taux réel du placement",
        cellules: [saisir(auCentime(x.reel * 100), `${nb(1 + r.taux)} ÷ ${nb(1 + INFLATION_PREVUE)} − 1 = ${pct(x.reel)}`, "(1 + taux nominal) ÷ (1 + inflation) − 1, en %", { tolerance: 0.01, unite: "%" })],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

const o = x.offre;

export const L_ECHEANCE_DE_JANVIER: Bureau = {
  code: "l-echeance-de-janvier",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["la-valeur-et-le-temps"],
  commanditaire: "Le président",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Au bureau : l'échéance de janvier",
  accroche: "Le compte à terme est échu, le fournisseur de la ligne attend sa réponse, la première ligne s'use. Ramenez chaque somme à sa date, comparez, puis répondez au président.",
  objectifs: [
    "Dire, pour chaque somme d'un dossier, si elle se lit aujourd'hui, s'actualise ou se capitalise",
    "Calculer les intérêts simples d'un placement et la part qui revient à l'exercice",
    "Comparer les façons de payer par la valeur actuelle de leurs flux",
    "Calculer le versement annuel qui réunit un prix futur, l'inflation comprise",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. La clôture de N est passée ; les sommes du dossier attendent une réponse cette semaine.`,
    "Sur votre poste, la pile : le courriel du président dessus, puis les pièces. Elles ne tombent pas à la même date : c'est votre travail de les comparer quand même.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "les-dates",
      type: "classement",
      titre: "Ramener chaque somme à sa date",
      consigne: "Pour chaque somme du dossier, dites ce qu'il faut en faire pour la comparer : la lire telle quelle, c'est une somme d'aujourd'hui ; l'actualiser ; ou la capitaliser.",
      pieces: ["courriel"],
      categories: [
        { code: "aujourd-hui", libelle: "Une somme d'aujourd'hui" },
        { code: "actualiser", libelle: "À actualiser" },
        { code: "capitaliser", libelle: "À capitaliser" },
      ],
      elements: [
        { code: "echeance", piece: "avis", libelle: "Le capital et les intérêts du compte à terme, virés ce matin", categorie: "aujourd-hui", pourquoi: `Ils tombent le ${JOUR} : une somme d'aujourd'hui, qui se lit telle quelle.` },
        { code: "comptant", piece: "fournisseur", libelle: `Le prix comptant de la ligne, ${eur(o.comptant)}`, categorie: "aujourd-hui", pourquoi: "Payé le 1er janvier N+1 : une somme d'aujourd'hui, à laquelle on compare les autres." },
        { code: "annuites", piece: "fournisseur", libelle: `Les annuités du fournisseur, ${eur(o.annuite)} chacune`, categorie: "actualiser", pourquoi: `Elles tombent de fin N+1 à fin N+${o.annees} : pour les comparer au comptant, on les ramène à aujourd'hui.` },
        { code: "prix-neuf", piece: "inflation", libelle: `Le prix d'une ligne neuve, ${eur(RENOUVELLEMENT.prixDAujourdHui)} aujourd'hui`, categorie: "capitaliser", pourquoi: `La ligne se paiera ${FIN} : son prix se porte à cette date, au taux de l'inflation.` },
        { code: "versements", piece: "ligne", libelle: `Les versements de la réserve, de fin N+1 à ${FIN}`, categorie: "capitaliser", pourquoi: `Ils servent à payer ${FIN} : leur valeur acquise se calcule à cette date.` },
      ],
      explication: [
        "Les sommes ne se comparent qu'à la même date. Les annuités se ramènent au jour du comptant ; le prix de la ligne neuve et les versements de la réserve se portent au jour de l'achat.",
      ],
    },
    {
      id: "l-echeance",
      type: "etat",
      titre: "Chiffrer l'échéance",
      consigne: "Complétez le tableau : les intérêts de l'année de placement, la somme virée ce matin, et la part des intérêts qui est un produit de N+1.",
      pieces: ["avis", "cloture"],
      grille: grilleDeLEcheance(),
      explication: [
        `La banque verse ${eur(x.verse)}. Mais ${eur(x.courus)} d'intérêts sont déjà dans le résultat de N, en produit à recevoir : seuls ${eur(x.partDeN1)}, ceux des derniers jours, sont un produit de N+1.`,
      ],
    },
    {
      id: "les-deux-paiements",
      type: "etat",
      titre: "Comparer les paiements",
      consigne: `Complétez le tableau : le total des annuités, leur valeur actuelle au taux de la banque, ce qu'elles coûtent de plus que le comptant, et l'annuité du prêt de la banque.`,
      pieces: ["fournisseur", "banque"],
      grille: grilleDesDeuxPaiements(),
      explication: [
        `Additionnées, les annuités font ${eur(o.total)}, mais elles tombent plus tard. Au taux de la banque, elles valent ${eur(o.valeurActuelle)} aujourd'hui : ${eur(o.surcout)} de plus que le comptant.`,
        `Le fournisseur prête donc plus cher que la banque, à ${pct(o.tauxActuariel)} : la banque prendrait ${eur(o.annuiteDeLaBanque)} par an pour le même prix.`,
      ],
    },
    {
      id: "la-reserve",
      type: "etat",
      titre: "Préparer la ligne neuve",
      consigne: "Complétez le tableau : le prix d'une ligne neuve à la date de l'achat, le coefficient de valeur acquise, le versement qui réunit ce prix, le versement retenu, et le taux réel du placement, en %.",
      pieces: ["ligne", "inflation"],
      grille: grilleDeLaReserve(),
      explication: [
        `Une ligne neuve coûtera ${eur(x.prixFutur)} ${FIN}. Au prix d'aujourd'hui, ${eur(x.versementSansInflation)} par an auraient suffi ; il faut ${eur(x.suffit)}.`,
        `Le placement ne rapporte que ${pct(x.reel)} en pouvoir d'achat : l'inflation mange une part de son taux.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez aux questions du courriel, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "les-interets",
          question: "Quelle part des intérêts du compte à terme est un produit de N+1 ?",
          options: [
            { texte: eur(x.partDeN1), juste: true, retour: `Oui : ${eur(x.interets)} d'intérêts pour l'année, dont ${eur(x.courus)} déjà comptés en N.` },
            { texte: `${eur(x.interets)}, puisqu'ils sont versés en N+1`, juste: false, retour: "Non : un produit appartient à l'exercice où il court, pas à celui où il est payé. La clôture a déjà compté la part de N." },
            { texte: `${eur(x.courus)}, ceux de la note de clôture`, juste: false, retour: "Non : ceux-là sont la part de N, déjà dans son résultat. Il reste les intérêts des derniers jours." },
            { texte: "Aucune, tous les intérêts ont été comptés en N", juste: false, retour: `Non : la clôture n'a compté que les jours de N. Le placement a couru jusqu'au ${dateEcrite(PLACEMENT.echeance)}.` },
          ],
        },
        {
          id: "la-ligne",
          question: "Comment NOVA doit-elle payer la ligne semi-automatique ?",
          options: [
            { texte: "Comptant, avec le prêt de la banque", juste: true, retour: `Oui : au taux de la banque, les annuités valent ${eur(o.valeurActuelle)}, plus que les ${eur(o.comptant)} du comptant. Le fournisseur prête à ${pct(o.tauxActuariel)}.` },
            { texte: `Par les annuités du fournisseur, qui ne demandent aucun frais de dossier`, juste: false, retour: "Non : l'absence de frais ne dit rien du taux. En valeur actuelle, les annuités coûtent plus que le comptant." },
            { texte: `Comptant, parce que les annuités font ${eur(o.total)} au total`, juste: false, retour: "La conclusion est juste, la raison non : additionner des sommes de dates différentes oublie le prix du temps. C'est la valeur actuelle qui tranche." },
          ],
        },
        {
          id: "le-versement",
          question: "Combien NOVA doit-elle placer chaque année pour payer la ligne neuve ?",
          options: [
            { texte: eur(x.suffit), juste: true, retour: `Oui : le prix futur, ${eur(x.prixFutur)}, ÷ ${nb(x.coefficient)} = ${eur(x.versementNecessaire)}, arrondis à ${eur(x.suffit)}.` },
            { texte: `${eur(x.versementSansInflation)}, le prix d'aujourd'hui réuni par les versements`, juste: false, retour: `Non : en ${n} ans, la ligne neuve aura pris l'inflation. Ce versement réunit ${eur(RENOUVELLEMENT.prixDAujourdHui)}, pas ${eur(x.prixFutur)}.` },
            { texte: `${eur(auCentime(x.prixFutur / n))}, le prix futur partagé en ${n} parts`, juste: false, retour: "Non : les versements placés rapportent des intérêts ; il en faut moins que le prix partagé." },
          ],
        },
      ],
      explication: [
        `Votre réponse : la banque verse ${eur(x.verse)}, dont ${eur(x.partDeN1)} de produit de N+1 ; la ligne se paie comptant, avec le prêt de la banque ; la réserve demande ${eur(x.suffit)} par an.`,
      ],
    },
  ],
};
