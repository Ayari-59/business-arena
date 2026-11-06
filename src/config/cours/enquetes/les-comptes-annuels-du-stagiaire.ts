import type { PieceDuBureau } from "../bureaux/types";
import { dateDe } from "../chapitres/la-cloture";
import {
  MOIS_DE_LA_SITUATION,
  MOIS_POUR_APPROUVER,
  SEUILS_A_DEPASSER,
  SEUILS_DES_MICRO_ENTREPRISES,
  annexe,
  comptesAnnuels,
  situationIntermediaire,
  tailleDeNova,
} from "../monde/comptes-annuels";
import { JOUR_DES_COMPTES_DU_STAGIAIRE, comptesDuStagiaire, effetsDesErreurs, type ErreurDesComptes } from "../monde/comptes-annuels-du-stagiaire";
import { empruntALaCloture } from "../monde/emprunt";
import { EXERCICE_DE_NOVA, MOIS_DE_L_EXERCICE } from "../monde/exercice-de-nova";
import { eur, etapeDuControle, grilleDesMontantsJustes, nombre, type LigneDuDossier } from "./lignes-du-dossier";
import type { Enquete } from "./types";

/**
 * L'ENQUÊTE : LES COMPTES ANNUELS DU STAGIAIRE (comptabilité générale, palier 4 ; la suite du chapitre
 * « Les comptes annuels : présentation, annexe et situation intermédiaire »).
 *
 * En mars N+1, le stagiaire a mis en forme les comptes de N pour l'assemblée, et il a joint la situation
 * au 30 juin que la banque avait reçue. Le président ne convoquera pas les associés sans qu'on les ait
 * relus. L'élève contrôle neuf montants (le compte de résultat, le bilan, l'annexe, les seuils, la
 * situation), nomme l'erreur de chaque faux, rend le montant juste de chacun, puis répond au président.
 * Le format « enquête » sur un document de synthèse : enquetes/lignes-du-dossier.ts.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : monde/comptes-annuels.ts pour les bons,
 * monde/comptes-annuels-du-stagiaire.ts pour ceux du stagiaire.
 */

const f = EXERCICE_DE_NOVA;
const c = comptesAnnuels(f);
const r = c.resultat;
const b = c.bilan;
const x = annexe(f);
const t = tailleDeNova(f);
const s = situationIntermediaire(MOIS_DE_LA_SITUATION, f);
const e = empruntALaCloture(f.pret);
const montants = comptesDuStagiaire(f);
const effets = effetsDesErreurs(f);
const m = (code: string) => montants.find((y) => y.code === code)!;

const JOUR = dateDe(JOUR_DES_COMPTES_DU_STAGIAIRE);
const AU_31_DECEMBRE = `${dateDe(f.cloture)} N`;
const MOIS = MOIS_DE_LA_SITUATION;
const FIN_DE_LA_SITUATION = `${dateDe({ jour: 30, mois: MOIS_DE_LA_SITUATION })} N`;
const MOIS_LIMITE = MOIS_DE_L_EXERCICE[(f.cloture.mois + MOIS_POUR_APPROUVER - 1) % 12]!;

// ─────────────────────────────────────────────────────────────────────────────
// LE DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

/** Les intitulés des comptes de la balance, tels que le plan comptable de NOVA les écrit. */
const INTITULES: Readonly<Record<string, string>> = {
  "101": "Capital",
  "164": "Emprunt auprès de la banque",
  "1511": "Provision pour litige",
  "1688": "Intérêts courus sur l'emprunt",
  "2154": "Ligne de montage",
  "28154": "Amortissements de la ligne",
  "31": "Stock de composants",
  "401": "Fournisseurs",
  "408": "Fournisseurs, factures non parvenues",
  "411": "Clients",
  "416": "Clients douteux",
  "418": "Clients, factures à établir",
  "431": "Sécurité sociale",
  "437": "Caisse de retraite",
  "442": "Prélèvement à la source",
  "444": "Impôt sur les sociétés dû",
  "4455": "TVA à décaisser",
  "44586": "TVA sur facture non parvenue",
  "44587": "TVA sur facture à établir",
  "486": "Charge constatée d'avance",
  "487": "Produit constaté d'avance",
  "491": "Dépréciation des clients",
  "508": "Compte à terme",
  "5088": "Intérêts courus du compte à terme",
  "512": "Banque",
  "601": "Achats de composants",
  "6031": "Variation du stock de composants",
  "606": "Achats non stockés",
  "6132": "Loyer du local",
  "616": "Assurance",
  "641": "Rémunérations du personnel",
  "645": "Charges sociales",
  "6611": "Intérêts de l'emprunt",
  "665": "Escomptes accordés",
  "6811": "Dotation aux amortissements",
  "6815": "Dotation à la provision pour litige",
  "6817": "Dotation à la dépréciation des clients",
  "695": "Impôt sur les sociétés",
  "701": "Ventes de produits finis",
  "764": "Revenus du compte à terme",
};

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "Les comptes de N avant l'assemblée",
  paragraphes: [
    "Bonjour,",
    `Notre stagiaire a mis en forme les comptes annuels de N. L'assemblée doit les approuver avant la fin de ${MOIS_LIMITE}, puis ils partiront au greffe. Il me dit que NOVA n'est plus une micro-entreprise, et que nous devrons donc publier une annexe.`,
    "Avant que je convoque les associés, relisez ses montants un à un. Pour chaque montant faux, dites-moi ce qui ne va pas, et donnez-moi le bon.",
    "Merci. Le président",
  ],
};

const BALANCE: PieceDuBureau = {
  code: "balance",
  nature: "balance",
  titre: "Balance après inventaire au 31 décembre N",
  de: "La comptabilité de NOVA",
  a: "Le service comptable",
  date: AU_31_DECEMBRE,
  comptes: Object.entries(c.k.soldes)
    .filter(([, v]) => Math.abs(v) > 0.004)
    .sort(([y], [z]) => y.localeCompare(z))
    .map(([compte, v]) => ({ compte, intitule: INTITULES[compte] ?? `Compte ${compte}`, debit: v > 0 ? v : 0, credit: v < 0 ? -v : 0 })),
  mention: "Travaux d'inventaire et impôt passés. Le stock final de matières est au crédit du 6031.",
};

const PROJET: PieceDuBureau = {
  code: "projet",
  nature: "note",
  titre: "Le projet de comptes annuels du stagiaire",
  de: "Le stagiaire",
  a: "Le président",
  date: JOUR,
  objet: "Compte de résultat et bilan de N, système de base",
  montants: [
    { libelle: "Compte de résultat : variation des stocks de matières", montant: m("variation-des-stocks").stagiaire },
    { libelle: "Compte de résultat : autres achats et charges externes", montant: m("charges-externes").stagiaire },
    { libelle: "Compte de résultat : charges financières", montant: m("charges-financieres").stagiaire },
    { libelle: "Compte de résultat : résultat de l'exercice", montant: r.resultatNet, fort: true },
    { libelle: "Bilan : immobilisations corporelles, montant net", montant: m("immobilisations").stagiaire },
    { libelle: "Bilan : provisions pour risques", montant: m("provisions").stagiaire },
    { libelle: "Bilan : emprunts et dettes financières", montant: m("emprunts").stagiaire },
    { libelle: "Bilan : total de l'actif", montant: b.totalActif, fort: true },
    { libelle: "Bilan : total du passif", montant: effets.passifDuStagiaire, fort: true },
  ],
  mention: "La variation des stocks est écrite en positif, comme le stock du 31 décembre. Le passif ne retombe pas tout à fait sur l'actif : je cherche encore.",
};

const ANNEXE: PieceDuBureau = {
  code: "annexe",
  nature: "note",
  titre: "L'annexe et les seuils, selon le stagiaire",
  de: "Le stagiaire",
  a: "Le président",
  date: JOUR,
  objet: "État des dettes, taille de NOVA",
  paragraphes: [
    `État des dettes : l'emprunt, ${eur(m("emprunt-a-plus-d-un-an").stagiaire)} à plus d'un an.`,
    `Les seuils des micro-entreprises : ${eur(SEUILS_DES_MICRO_ENTREPRISES.bilan)} de total du bilan, ${eur(SEUILS_DES_MICRO_ENTREPRISES.chiffreDAffaires)} de chiffre d'affaires, ${nombre(SEUILS_DES_MICRO_ENTREPRISES.effectif)} salariés. Une entreprise en sort quand elle en dépasse ${nombre(SEUILS_A_DEPASSER)}.`,
    `NOVA : un total du bilan de ${eur(m("total-pour-les-seuils").stagiaire)}, toutes les valeurs de l'actif additionnées avant amortissements et dépréciations ; un chiffre d'affaires de ${eur(t.chiffreDAffaires)} ; ${nombre(t.effectif)} salariés. Seuils dépassés : ${nombre(effets.seuilsDuStagiaire)}. NOVA n'est plus une micro-entreprise.`,
  ],
};

const EMPRUNT: PieceDuBureau = {
  code: "emprunt",
  nature: "extrait",
  titre: "Le tableau d'amortissement de l'emprunt, extrait",
  de: "La banque de NOVA",
  a: "NOVA",
  date: AU_31_DECEMBRE,
  paragraphes: [`Remboursement par trimestre, ${eur(e.interetsCourus.echeanceSuivante!.amortissement)} de capital à chaque échéance. Prochaine échéance le ${dateDe(e.interetsCourus.echeanceSuivante!.date)}.`],
  montants: [
    { libelle: "Capital restant dû au 31 décembre N", montant: e.capitalRestantDu },
    { libelle: "Capital des échéances de N+1", montant: e.partAMoinsDUnAn },
    { libelle: "Intérêts courus au 31 décembre N", montant: e.interetsCourus.montant, fort: true },
  ],
};

const SITUATION: PieceDuBureau = {
  code: "situation",
  nature: "note",
  titre: `La situation au ${FIN_DE_LA_SITUATION}`,
  de: "Le stagiaire",
  a: "Le président",
  date: JOUR,
  objet: "Le résultat du premier semestre, pour la banque",
  paragraphes: [
    `Les ${MOIS} premiers mois, tirés du journal : ${eur(s.ventes)} de ventes, ${eur(s.achats)} d'achats de composants, ${eur(s.chargesExternes)} de charges externes, ${eur(s.salaires)} de salaires et ${eur(s.chargesSociales)} de charges sociales. Aucun stock à la fin de juin.`,
    `Les charges et les produits de l'année entière : ${eur(s.dotationAnnuelle)} de dotation aux amortissements, ${eur(s.interetsAnnuels)} d'intérêts de l'emprunt, ${eur(s.placementAnnuel)} d'intérêts du compte à terme.`,
    `Mon résultat avant impôt du semestre : la part de l'année, ${eur(r.resultatCourant)} × ${MOIS} ÷ 12 = ${eur(m("resultat-du-semestre").stagiaire)}.`,
  ],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, BALANCE, PROJET, ANNEXE, EMPRUNT, SITUATION];


// ─────────────────────────────────────────────────────────────────────────────
// LE CONTRÔLE ET LES MONTANTS JUSTES
// ─────────────────────────────────────────────────────────────────────────────

/** Les raisons : les six erreurs et deux leurres ; la plus longue est un leurre. */
const RAISONS: readonly { code: ErreurDesComptes | "tva" | "exercice"; libelle: string }[] = [
  { code: "signe", libelle: "Le signe est inversé" },
  { code: "depreciation", libelle: "Une dépréciation est prise pour une provision" },
  { code: "interets-courus", libelle: "Les intérêts courus sont oubliés" },
  { code: "echeances", libelle: "Ce qui échoit dans l'année n'est pas séparé" },
  { code: "brut", libelle: "Le montant est pris en brut, au lieu du net" },
  { code: "prorata", libelle: "Le montant de l'année est pris au prorata" },
  { code: "tva", libelle: "La TVA est comprise" },
  { code: "exercice", libelle: "Le montant appartient à l'exercice suivant, qui n'est pas encore clos" },
];

const brutDe = (y: { juste: number; stagiaire: number }) => eur(y.stagiaire - y.juste);

const LIGNES: readonly LigneDuDossier[] = [
  {
    code: "variation-des-stocks",
    libelle: "Compte de résultat : variation des stocks de matières",
    piece: "projet",
    dossier: m("variation-des-stocks").stagiaire,
    juste: m("variation-des-stocks").juste,
    raison: "signe",
    pourquoi: `Fausse : la variation des stocks vaut le stock initial moins le stock final, zéro moins ${eur(-r.variationDeStock)}. Elle s'écrit ${eur(r.variationDeStock)} parmi les charges : un stock qui monte diminue les charges de l'exercice.`,
    calcul: `${eur(0)} − ${eur(-r.variationDeStock)} = ${eur(r.variationDeStock)}`,
    indice: "le stock initial moins le stock final",
  },
  {
    code: "charges-externes",
    libelle: "Compte de résultat : autres achats et charges externes",
    piece: "projet",
    dossier: m("charges-externes").stagiaire,
    juste: m("charges-externes").juste,
    raison: null,
    pourquoi: `Juste : les achats non stockés, le loyer et l'assurance, ${eur(r.chargesExternes)}.`,
    calcul: `les comptes 606, 6132 et 616 : ${eur(r.chargesExternes)}`,
    indice: "les achats non stockés et les services extérieurs",
  },
  {
    code: "charges-financieres",
    libelle: "Compte de résultat : charges financières",
    piece: "projet",
    dossier: m("charges-financieres").stagiaire,
    juste: m("charges-financieres").juste,
    raison: null,
    pourquoi: `Juste : les intérêts de l'emprunt, payés et courus, et l'escompte accordé à Sonora, ${eur(r.chargesFinancieres)}.`,
    calcul: `les comptes 6611 et 665 : ${eur(r.chargesFinancieres)}`,
    indice: "les intérêts et les escomptes accordés",
  },
  {
    code: "immobilisations",
    libelle: "Bilan : immobilisations corporelles, montant net",
    piece: "projet",
    dossier: m("immobilisations").stagiaire,
    juste: m("immobilisations").juste,
    raison: null,
    pourquoi: `Juste : ${eur(b.actif.immobilisations.brut)} moins ${eur(b.actif.immobilisations.amortissements)} d'amortissements, ${eur(b.actif.immobilisations.net)}.`,
    calcul: `${eur(b.actif.immobilisations.brut)} − ${eur(b.actif.immobilisations.amortissements)} = ${eur(b.actif.immobilisations.net)}`,
    indice: "le brut moins les amortissements",
  },
  {
    code: "provisions",
    libelle: "Bilan : provisions pour risques",
    piece: "projet",
    dossier: m("provisions").stagiaire,
    juste: m("provisions").juste,
    raison: "depreciation",
    pourquoi: `Fausse : la dépréciation de la créance de Sonora, ${eur(b.actif.clients.depreciation)}, se retranche des clients à l'actif. La compter aussi au passif, c'est la compter deux fois. Seul le litige est une provision pour risques : ${eur(b.passif.provisions)}.`,
    calcul: `${eur(m("provisions").stagiaire)} − ${eur(b.actif.clients.depreciation)} de dépréciation = ${eur(b.passif.provisions)}`,
    indice: "la seule provision du compte 15",
  },
  {
    code: "emprunts",
    libelle: "Bilan : emprunts et dettes financières",
    piece: "emprunt",
    dossier: m("emprunts").stagiaire,
    juste: m("emprunts").juste,
    raison: "interets-courus",
    pourquoi: `Fausse : la ligne porte le capital restant dû et les intérêts courus, ${eur(x.interetsCourus)}. C'est l'écart qui manque au passif du stagiaire.`,
    calcul: `${eur(e.capitalRestantDu)} + ${eur(x.interetsCourus)} = ${eur(b.passif.emprunts)}`,
    indice: "le 164 et le 1688",
  },
  {
    code: "emprunt-a-plus-d-un-an",
    libelle: "Annexe, état des dettes : l'emprunt à plus d'un an",
    piece: "annexe",
    dossier: m("emprunt-a-plus-d-un-an").stagiaire,
    juste: m("emprunt-a-plus-d-un-an").juste,
    raison: "echeances",
    pourquoi: `Fausse : les ${nombre(x.echeancesDeN1)} échéances de N+1, ${eur(x.capitalAUnAn)} de capital, se paient avant un an. Il reste ${eur(x.empruntAPlusDUnAn)} à plus d'un an.`,
    calcul: `${eur(e.capitalRestantDu)} − ${eur(x.capitalAUnAn)} = ${eur(x.empruntAPlusDUnAn)}`,
    indice: "le capital restant dû, moins ce qui se rembourse en N+1",
  },
  {
    code: "total-pour-les-seuils",
    libelle: "Seuils : le total du bilan de NOVA",
    piece: "annexe",
    dossier: m("total-pour-les-seuils").stagiaire,
    juste: m("total-pour-les-seuils").juste,
    raison: "brut",
    pourquoi: `Fausse : le total du bilan des seuils est celui du bilan, en valeurs nettes, ${eur(t.bilan)}. Le stagiaire y a ajouté ${brutDe(m("total-pour-les-seuils"))} d'amortissements et de dépréciations : il croit NOVA sortie de la catégorie.`,
    calcul: `le total de l'actif net : ${eur(t.bilan)}`,
    indice: "le total du bilan, tel qu'il est publié",
  },
  {
    code: "resultat-du-semestre",
    libelle: `Situation au ${FIN_DE_LA_SITUATION} : le résultat avant impôt`,
    piece: "situation",
    dossier: m("resultat-du-semestre").stagiaire,
    juste: m("resultat-du-semestre").juste,
    raison: "prorata",
    pourquoi: `Fausse : une situation s'établit sur les ${MOIS} mois. Les flux du journal, plus ${MOIS} douzièmes des charges et produits de l'année, la méthode de l'abonnement : ${eur(s.resultatAvantImpot)}. Le second semestre, avec Sonora et la clôture, ne ressemble pas au premier.`,
    calcul: `${eur(s.ventes)} − ${eur(s.achats)} − ${eur(s.chargesExternes)} − ${eur(s.salaires)} − ${eur(s.chargesSociales)} − ${eur(s.dotation)} + ${eur(s.placement)} − ${eur(s.interets)} = ${eur(s.resultatAvantImpot)}`,
    indice: `les ${MOIS} mois du journal, et ${MOIS} douzièmes de chaque montant de l'année`,
  },
];

const nombreDErreurs = LIGNES.filter((l) => l.raison).length;

// ─────────────────────────────────────────────────────────────────────────────
// L'ENQUÊTE
// ─────────────────────────────────────────────────────────────────────────────

/** La grille des montants justes : celle de l'étape, exportée pour les gardes. */
export const grilleDesComptesJustes = () => grilleDesMontantsJustes("Les montants des comptes de N, corrigés", LIGNES, ["Le stagiaire", "Le montant juste"]);

export const LES_COMPTES_ANNUELS_DU_STAGIAIRE: Enquete = {
  format: "enquete",
  code: "les-comptes-annuels-du-stagiaire",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["les-comptes-annuels"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Enquête : les comptes annuels du stagiaire",
  accroche: "Le stagiaire a mis en forme les comptes de N pour l'assemblée, et son passif ne retombe pas sur l'actif. Relisez ses montants, nommez les erreurs, rendez les bons, puis dites au président ce que NOVA doit publier.",
  objectifs: [
    "Contrôler un compte de résultat et un bilan du système de base, ligne par ligne",
    "Contrôler l'état des dettes de l'annexe et la position face aux seuils",
    "Distinguer une situation intermédiaire d'un prorata du résultat de l'année",
    "Nommer la nature d'une erreur de présentation, et rendre le montant juste",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. Les comptes de N sont arrêtés ; le stagiaire les a mis en forme pour l'assemblée des associés.`,
    "Sur votre poste, le dossier : le courriel du président, la balance après inventaire, le projet de comptes du stagiaire, son annexe, le tableau de l'emprunt et la situation au ${FIN_DE_LA_SITUATION}. Certains montants sont justes, d'autres non : c'est votre enquête.",
  ],
  pile: PILE,
  etapes: [
    etapeDuControle({
      id: "le-controle",
      titre: "Contrôler les montants",
      consigne: "Pour chaque montant du stagiaire, dites s'il est juste. S'il est faux, choisissez ce qui ne va pas.",
      pieces: ["projet", "balance"],
      raisons: RAISONS,
      lignes: LIGNES,
      explication: [
        `${nombreDErreurs} montants sur ${LIGNES.length} sont faux, chacun d'une nature différente. Ceux des provisions et des emprunts faussent le bilan : le passif du stagiaire dépasse l'actif de ${eur(effets.ecartDuBilan)}.`,
      ],
    }),
    {
      id: "les-montants",
      type: "etat",
      titre: "Rendre les montants justes",
      consigne: "Pour chaque ligne, écrivez le montant juste, celui du stagiaire s'il est bon. Une charge qui diminue s'écrit en négatif.",
      pieces: ["balance", "emprunt", "situation"],
      grille: grilleDesComptesJustes(),
      reussite: "Les montants corrigés sont justes.",
      explication: [
        `Corrigé, le passif retombe sur l'actif, ${eur(b.totalActif)}. NOVA ne dépasse qu'un seuil des micro-entreprises, le chiffre d'affaires.`,
        `Le premier semestre a dégagé ${eur(s.resultatAvantImpot)} avant impôt, et non ${eur(s.auProrata)} : un semestre n'est pas la moitié de l'année.`,
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
          id: "la-taille",
          question: "NOVA est-elle encore une micro-entreprise ?",
          options: [
            { texte: "Oui, seul son chiffre d'affaires dépasse le seuil", juste: true, retour: `Oui : ${eur(t.bilan)} de total du bilan, sous ${eur(SEUILS_DES_MICRO_ENTREPRISES.bilan)} ; ${nombre(t.effectif)} salariés. Seul le chiffre d'affaires dépasse son seuil. NOVA peut se dispenser d'annexe, mais la banque voudra sans doute la lire.` },
            { texte: "Non, le total du bilan et le chiffre d'affaires dépassent leurs seuils", juste: false, retour: `Non : c'est le total brut qui dépasse ${eur(SEUILS_DES_MICRO_ENTREPRISES.bilan)}. Le total du bilan publié, en net, est de ${eur(t.bilan)}.` },
            { texte: "Non, une société par actions n'est jamais une micro-entreprise", juste: false, retour: "Non : les seuils s'appliquent aux sociétés commerciales, quelle que soit leur forme ; ce sont eux qui décident." },
            { texte: "On ne le saura qu'après l'approbation des comptes par l'assemblée", juste: false, retour: "Non : les seuils se lisent sur les comptes arrêtés, à la clôture. L'approbation ne change pas ces chiffres." },
          ],
        },
        {
          id: "le-bilan",
          question: "Pourquoi le passif du stagiaire ne retombait-il pas sur l'actif ?",
          options: [
            {
              texte: "La dépréciation comptée deux fois, les intérêts courus oubliés",
              juste: true,
              retour: `Oui : ${eur(b.actif.clients.depreciation)} de trop aux provisions, ${eur(x.interetsCourus)} de moins aux emprunts, soit ${eur(effets.ecartDuBilan)} d'écart.`,
            },
            { texte: "La variation des stocks écrite en positif dans le compte de résultat", juste: false, retour: "Non : une erreur du compte de résultat ne touche le bilan que par le résultat, et le stagiaire a gardé le bon résultat." },
            { texte: "L'emprunt à plus d'un an mal découpé dans l'état des dettes de l'annexe", juste: false, retour: "Non : l'annexe détaille le bilan, elle ne le change pas. Le total de l'emprunt reste le même." },
          ],
        },
        {
          id: "le-semestre",
          question: "Quel résultat avant impôt la banque doit-elle lire pour le premier semestre ?",
          options: [
            { texte: `${eur(s.resultatAvantImpot)}`, juste: true, retour: `Oui : les ${MOIS} mois du journal, et ${MOIS} douzièmes des charges et produits de l'année, par la méthode de l'abonnement.` },
            { texte: `${eur(s.auProrata)}, la part du résultat de l'année`, juste: false, retour: "Non : le second semestre a été plus fort que le premier. Une situation se calcule, elle ne se partage pas." },
            { texte: `${eur(s.resultatAvantImpot + s.dotation)}, sans la dotation, qui n'est connue qu'à la clôture`, juste: false, retour: `Non : la dotation de l'année est connue dès la mise en service ; la situation en prend ${MOIS} douzièmes.` },
          ],
        },
      ],
      explication: [
        `Votre réponse au président : NOVA reste une micro-entreprise ; son bilan, corrigé, totalise ${eur(b.totalActif)} ; le premier semestre a dégagé ${eur(s.resultatAvantImpot)} avant impôt. Les comptes peuvent partir à l'assemblée.`,
      ],
    },
  ],
};
