import { enEcriture, montantEcrit, type EcritureAttendue } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { intituleDe } from "../../../pedagogy/cours/plan-comptable";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { LigneDeCompte, PieceDuBureau } from "../bureaux/types";
import {
  CESSION_D_ONDES,
  DATE_D_ARRETE,
  DOUBLON,
  FACTURE_DE_CAMPUSTECH,
  LCR_DE_DECEMBRE,
  LCR_DE_VIBRA,
  VIBRA,
  annulationDuDoublon,
  bordereauDEscompte,
  bordereauDuFactor,
  dateEcrite,
  factureDEnceintes,
  impayeDeVibra,
  type DateDuCompte,
} from "../monde/compte-client-de-nova";
import type { Enquete } from "./types";

/**
 * L'ENQUÊTE : LES EFFETS DE L'INTÉRIMAIRE (comptabilité générale, palier 4 ; la suite du chapitre « Le
 * compte client : lettrage, effets de commerce, balance âgée » et de son cas, « Vibra repasse commande »).
 *
 * Fin juin N+1, un comptable intérimaire a tenu six mois les comptes clients de NOVA, pendant un congé. Le
 * responsable veut une relecture avant de dresser la balance âgée du semestre. L'élève reçoit le dossier
 * (la note de passation, les huit écritures de l'intérimaire), trie les écritures, rectifie les fausses,
 * puis chiffre ce que chaque erreur faussait : le résultat, les créances clients, la banque.
 *
 * UN CRAN PLUS LOIN QUE LE CHAPITRE : le chapitre faisait passer chaque écriture des effets et du
 * factor ; l'enquête les fait contrôler, et chiffrer leurs erreurs sur trois soldes à la fois. Le piège :
 * une erreur peut fausser le bilan sans toucher au résultat, ou changer la nature d'une charge sans
 * changer son total.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS (monde/compte-client-de-nova.ts) : les écritures
 * justes sont celles du chapitre, refaites sur les mêmes fonctions ; celles de l'intérimaire les lisent de
 * travers. Aucune hypothèse nouvelle, sauf l'intérimaire et la date de l'enquête.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auJournal = (d: DateDuCompte) => `${dateEcrite(d)} N+1`;

/** Le jour où l'élève ouvre le dossier (hypothèse de l'enquête) : le 30 juin N+1, la fin du semestre. */
export const JOUR_DE_L_ENQUETE: DateDuCompte = { jour: 30, mois: 6, exercice: 1 };

export type NatureDeLErreur = "sens" | "compte-d-effet" | "nature-de-charge" | "creance" | "retenue";
type CodeDEcriture = "doublon" | "lcr" | "escompte" | "bordereau" | "encaissement" | "impaye" | "cession" | "factor";

type Ligne = { compte: string; debit: number; credit: number };
const d = (compte: string, montant: number): Ligne => ({ compte, debit: montant, credit: 0 });
const k = (compte: string, montant: number): Ligne => ({ compte, debit: 0, credit: montant });

const doublon = annulationDuDoublon();
const escompte = bordereauDEscompte();
const vibra = factureDEnceintes(VIBRA.enceintes);
const impaye = impayeDeVibra();
const factor = bordereauDuFactor();

// ─────────────────────────────────────────────────────────────────────────────
// LES ÉCRITURES JUSTES (celles du chapitre, sur les mêmes chiffres)
// ─────────────────────────────────────────────────────────────────────────────

const JUSTES: Readonly<Record<CodeDEcriture, EcritureAttendue>> = {
  doublon: {
    date: auJournal(DATE_D_ARRETE),
    libelle: "Annulation du virement de CampusTech saisi deux fois",
    lignes: [
      { role: "la créance sur CampusTech, rétablie", compte: "411", sens: "debit", montant: doublon.montant, indice: "le montant du virement en double" },
      { role: "la banque, ramenée à ce qu'elle a vraiment reçu", compte: "512", sens: "credit", montant: doublon.montant, indice: "le même montant" },
    ],
  },
  lcr: {
    date: auJournal(LCR_DE_DECEMBRE.acceptation),
    libelle: "LCR acceptée par CampusTech, facture du 20 décembre",
    lignes: [
      { role: "l'effet à recevoir", compte: "413", sens: "debit", montant: FACTURE_DE_CAMPUSTECH.ttc, indice: "le montant de la facture" },
      { role: "la créance ordinaire, qui change de forme", compte: "411", sens: "credit", montant: FACTURE_DE_CAMPUSTECH.ttc, indice: "le même montant" },
    ],
  },
  escompte: {
    date: auJournal(LCR_DE_DECEMBRE.remise),
    libelle: "Remise à l'escompte de la LCR de CampusTech",
    lignes: [
      { role: "l'effet remis à l'escompte", compte: "5114", sens: "debit", montant: escompte.nominal, indice: "le nominal de l'effet" },
      { role: "l'effet qui quitte le portefeuille", compte: "413", sens: "credit", montant: escompte.nominal, indice: "le même nominal" },
    ],
  },
  bordereau: {
    date: auJournal(LCR_DE_DECEMBRE.remise),
    libelle: "Bordereau d'escompte, LCR de CampusTech",
    lignes: [
      { role: "le net crédité en banque", compte: "512", sens: "debit", montant: escompte.net, indice: "le net du bordereau" },
      { role: "l'agio, un intérêt", compte: "6616", acceptes: ["661"], sens: "debit", montant: escompte.agio, indice: "l'agio du bordereau" },
      { role: "la commission, un service bancaire", compte: "627", sens: "debit", montant: escompte.commission, indice: "la commission du bordereau" },
      { role: "l'effet escompté, qui sort", compte: "5114", sens: "credit", montant: escompte.nominal, indice: "le nominal de l'effet" },
    ],
  },
  encaissement: {
    date: auJournal(LCR_DE_VIBRA.remise),
    libelle: "Remise à l'encaissement de la LCR de Vibra",
    lignes: [
      { role: "l'effet remis à l'encaissement", compte: "5113", sens: "debit", montant: vibra.ttc, indice: "le nominal de l'effet" },
      { role: "l'effet qui quitte le portefeuille", compte: "413", sens: "credit", montant: vibra.ttc, indice: "le même nominal" },
    ],
  },
  impaye: {
    date: auJournal(LCR_DE_VIBRA.impaye),
    libelle: "LCR de Vibra impayée",
    lignes: [
      { role: "la créance sur Vibra, qui revient", compte: "411", sens: "debit", montant: impaye.nominal, indice: "le nominal de l'effet" },
      { role: "les frais d'impayé", compte: "627", sens: "debit", montant: impaye.frais, indice: "les frais hors taxes de l'avis" },
      { role: "la TVA déductible sur les frais", compte: "44566", sens: "debit", montant: impaye.tva, indice: "la TVA de l'avis" },
      { role: "l'effet à l'encaissement, qui ne sera pas payé", compte: "5113", sens: "credit", montant: impaye.nominal, indice: "le nominal de l'effet" },
      { role: "la banque, débitée des frais", compte: "512", sens: "credit", montant: impaye.debitBanque, indice: "les frais toutes taxes comprises" },
    ],
  },
  cession: {
    date: auJournal(CESSION_D_ONDES.date),
    libelle: "Facture d'Ondes cédée au factor",
    lignes: [
      { role: "la créance sur le factor", compte: "467", sens: "debit", montant: factor.ttc, indice: "le montant de la facture" },
      { role: "la créance sur Ondes, qui sort", compte: "411", sens: "credit", montant: factor.ttc, indice: "le même montant" },
    ],
  },
  factor: {
    date: auJournal(CESSION_D_ONDES.date),
    libelle: "Bordereau du factor, facture d'Ondes",
    lignes: [
      { role: "l'argent viré", compte: "512", sens: "debit", montant: factor.verseAuJournal, indice: "le versement du bordereau" },
      { role: "la commission d'affacturage, un service", compte: "6225", acceptes: ["622"], sens: "debit", montant: factor.commission, indice: "la commission d'affacturage" },
      { role: "la TVA déductible sur la commission", compte: "44566", sens: "debit", montant: factor.tva, indice: "la TVA du bordereau" },
      { role: "la commission de financement, un intérêt", compte: "6616", acceptes: ["661"], sens: "debit", montant: factor.financement, indice: "la commission de financement" },
      { role: "ce que le factor a réglé de sa dette", compte: "467", sens: "credit", montant: factor.avance, indice: "la facture moins la retenue de garantie" },
    ],
  },
};

/** Les huit écritures du dossier, dans l'ordre du journal : celle de l'intérimaire, et la nature de l'erreur s'il y en a une. */
export const DOSSIER_DE_L_INTERIMAIRE: readonly { code: CodeDEcriture; titre: string; interimaire: readonly Ligne[]; erreur?: NatureDeLErreur }[] = [
  { code: "lcr", titre: "La LCR acceptée par CampusTech", interimaire: [d("413", FACTURE_DE_CAMPUSTECH.ttc), k("411", FACTURE_DE_CAMPUSTECH.ttc)] },
  { code: "escompte", titre: "La remise à l'escompte", interimaire: [d("5113", escompte.nominal), k("413", escompte.nominal)], erreur: "compte-d-effet" },
  { code: "bordereau", titre: "Le bordereau d'escompte", interimaire: [d("512", escompte.net), d("627", escompte.cout), k("5114", escompte.nominal)], erreur: "nature-de-charge" },
  { code: "doublon", titre: "L'annulation du virement en double", interimaire: [d("512", doublon.montant), k("411", doublon.montant)], erreur: "sens" },
  { code: "cession", titre: "La facture d'Ondes cédée au factor", interimaire: [d("467", factor.ttc), k("411", factor.ttc)] },
  {
    code: "factor",
    titre: "Le bordereau du factor",
    interimaire: [d("512", factor.verseAuJournal), d("6225", auCentime(factor.commission + factor.retenue)), d("44566", factor.tva), d("6616", factor.financement), k("467", factor.ttc)],
    erreur: "retenue",
  },
  { code: "encaissement", titre: "La LCR de Vibra remise à l'encaissement", interimaire: [d("5113", vibra.ttc), k("413", vibra.ttc)] },
  { code: "impaye", titre: "La LCR de Vibra impayée", interimaire: [d("413", impaye.nominal), d("627", impaye.frais), d("44566", impaye.tva), k("5113", impaye.nominal), k("512", impaye.debitBanque)], erreur: "creance" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CE QUE CHAQUE ERREUR FAUSSE
// ─────────────────────────────────────────────────────────────────────────────

/** Les trois soldes que l'enquête suit : le résultat (produits moins charges), les clients au 411, la banque au 512. */
function soldesSuivis(lignes: readonly Ligne[]) {
  const somme = (f: (l: Ligne) => boolean, signe: (l: Ligne) => number) => auCentime(lignes.filter(f).reduce((t, l) => t + signe(l), 0));
  return {
    resultat: somme((l) => /^[67]/.test(l.compte), (l) => l.credit - l.debit),
    clients: somme((l) => l.compte === "411", (l) => l.debit - l.credit),
    banque: somme((l) => l.compte === "512", (l) => l.debit - l.credit),
  };
}

/** Ce que chaque rectification change aux trois soldes (le juste moins l'intérimaire), et le total. */
export function effetsDesRectifications() {
  const effets = DOSSIER_DE_L_INTERIMAIRE.filter((x) => x.erreur).map((x) => {
    const juste = soldesSuivis(enEcriture(JUSTES[x.code]).lignes);
    const faux = soldesSuivis(x.interimaire);
    return { code: x.code, resultat: auCentime(juste.resultat - faux.resultat), clients: auCentime(juste.clients - faux.clients), banque: auCentime(juste.banque - faux.banque) };
  });
  const total = (champ: "resultat" | "clients" | "banque") => auCentime(effets.reduce((t, e) => t + e[champ], 0));
  return { effets, total: { resultat: total("resultat"), clients: total("clients"), banque: total("banque") } };
}

const r = effetsDesRectifications();
const effetDe = (code: CodeDEcriture) => r.effets.find((e) => e.code === code)!;

// ─────────────────────────────────────────────────────────────────────────────
// LE DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du responsable comptable",
  de: "Le responsable comptable de NOVA",
  a: "Le service comptable",
  date: auJournal(JOUR_DE_L_ENQUETE),
  objet: "Les comptes clients pendant le congé",
  paragraphes: [
    "Bonjour,",
    "Pendant mon congé, de janvier à juin, l'intérimaire a passé les effets, l'escompte, le factor et le doublon de CampusTech. Avant de dresser la balance âgée du semestre, je veux une relecture complète.",
    "Pour chaque écriture, dites-moi si elle est juste. Pour chaque écriture fausse, la raison et l'écriture juste. Puis chiffrez ce que ses erreurs faussaient : le résultat, les créances clients et la banque.",
    "Merci. Le responsable comptable",
  ],
};

const NOTE: PieceDuBureau = {
  code: "passation",
  nature: "note",
  titre: "La note de passation",
  de: "Le responsable comptable de NOVA",
  a: "L'intérimaire",
  date: auJournal({ jour: 2, mois: 1, exercice: 1 }),
  objet: "Ce qui vous attend",
  paragraphes: [
    `Le ${dateEcrite(LCR_DE_DECEMBRE.acceptation)}, CampusTech acceptera une LCR de ${eur(FACTURE_DE_CAMPUSTECH.ttc)} pour sa facture du 20 décembre, payable le ${dateEcrite(LCR_DE_DECEMBRE.echeance)}. Nous la remettrons à l'escompte le ${dateEcrite(LCR_DE_DECEMBRE.remise)}.`,
    `Le bordereau d'escompte retiendra ${eur(escompte.agio)} d'agio, l'intérêt de ${escompte.jours} jours, et ${eur(escompte.commission)} de commission, exonérée de TVA : ${eur(escompte.net)} nets.`,
    `Le virement de CampusTech du ${dateEcrite(DOUBLON.date)}, pour sa facture de ${DOUBLON.facture}, a été importé deux fois du relevé : ${eur(doublon.montant)} à annuler au ${dateEcrite(DATE_D_ARRETE)}.`,
    `Le ${dateEcrite(CESSION_D_ONDES.date)}, la facture d'${factor.client}, ${eur(factor.ttc)}, partira chez le factor. Il gardera ${pct(factor.retenue / factor.ttc)} de retenue de garantie jusqu'au paiement de la chaîne, et prendra ses deux commissions.`,
    `${VIBRA.nom} a accepté une LCR de ${eur(vibra.ttc)}, payable le ${dateEcrite(LCR_DE_VIBRA.echeance)} ; nous la remettrons à l'encaissement le ${dateEcrite(LCR_DE_VIBRA.remise)}. Si elle revient impayée, la banque prendra ${eur(impaye.frais)} de frais hors taxes.`,
  ],
};

const enComptes = (lignes: readonly Ligne[]): LigneDeCompte[] => lignes.map((l) => ({ compte: l.compte, intitule: intituleDe(l.compte), debit: l.debit, credit: l.credit }));
const numeroDe = (code: CodeDEcriture) => DOSSIER_DE_L_INTERIMAIRE.findIndex((x) => x.code === code) + 1;
const titreDe = (x: (typeof DOSSIER_DE_L_INTERIMAIRE)[number]) => `Écriture ${numeroDe(x.code)} : ${x.titre.charAt(0).toLowerCase()}${x.titre.slice(1)}`;
const pieceDe = (code: CodeDEcriture) => `ecriture-${code}`;

const ECRITURES: PieceDuBureau[] = DOSSIER_DE_L_INTERIMAIRE.map((x) => ({
  code: pieceDe(x.code),
  nature: "ecriture",
  titre: titreDe(x),
  de: "L'intérimaire",
  a: "Le service comptable",
  date: JUSTES[x.code].date,
  comptes: enComptes(x.interimaire),
}));

const PILE: readonly PieceDuBureau[] = [COURRIEL, NOTE, ...ECRITURES];

// ─────────────────────────────────────────────────────────────────────────────
// LE TRI ET LA RECTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

const POURQUOI_DES_JUSTES: Partial<Record<CodeDEcriture, string>> = {
  lcr: "Juste : la créance change de forme, du 411 au 413, pour le montant de la facture.",
  cession: "Juste : la créance change de débiteur, d'Ondes au factor, du 411 au 467.",
  encaissement: "Juste : l'effet quitte le portefeuille pour le compte des effets à l'encaissement.",
};

/** Les raisons à choisir : les cinq natures, et deux leurres ; la plus longue est un leurre. */
const RAISONS: readonly { code: NatureDeLErreur | "tva" | "montant"; libelle: string }[] = [
  { code: "sens", libelle: "Le débit et le crédit sont inversés" },
  { code: "compte-d-effet", libelle: "L'escompte est confondu avec l'encaissement" },
  { code: "nature-de-charge", libelle: "Un intérêt est passé en service bancaire" },
  { code: "creance", libelle: "L'effet impayé reste un effet" },
  { code: "retenue", libelle: "La retenue de garantie est passée en charge" },
  { code: "tva", libelle: "La TVA est oubliée" },
  { code: "montant", libelle: "Le montant retenu est le net du bordereau, et non le nominal de l'effet" },
];

const TEXTES: Readonly<Record<NatureDeLErreur, { pourquoi: string; indices: string[] }>> = {
  "compte-d-effet": {
    pourquoi: "L'effet est remis à l'escompte : il va au 5114, effets à l'escompte. Le 5113 est celui des effets remis à l'encaissement, que la banque présente sans rien avancer.",
    indices: ["Relisez la note : que fait NOVA de la LCR le 10 janvier ?", "L'escompte et l'encaissement ont chacun leur compte de valeurs à l'encaissement."],
  },
  "nature-de-charge": {
    pourquoi: `L'agio, ${eur(escompte.agio)}, rémunère l'argent avancé : c'est un intérêt, au 6616 ; seule la commission, ${eur(escompte.commission)}, est un service bancaire. Le total des charges est juste, le résultat aussi : c'est le résultat financier qui était faux.`,
    indices: ["Que rémunère l'agio : un service, ou de l'argent avancé ?", "Un intérêt est une charge financière."],
  },
  sens: {
    pourquoi: `Annuler le doublon, c'est passer l'écriture inverse du virement en trop : 411 au débit, 512 au crédit. L'intérimaire a repassé le doublon une seconde fois : ${eur(effetDe("doublon").clients)} de créances en moins, autant de banque en trop.`,
    indices: ["Le virement en double avait débité la banque et crédité le client : que fait l'annulation ?", "La créance revient au débit du 411."],
  },
  retenue: {
    pourquoi: `La retenue de garantie, ${eur(factor.retenue)}, n'est pas perdue : le factor la doit encore et la virera quand la chaîne aura payé. Elle reste au débit du 467 ; en charge, elle retirait ${eur(effetDe("factor").resultat)} au résultat.`,
    indices: ["La retenue de garantie, NOVA la reverra-t-elle ?", "Le 467 ne se crédite que de ce que le factor a réglé : la facture moins la retenue."],
  },
  creance: {
    pourquoi: `Un effet impayé ne sera pas payé : il ne revient pas au portefeuille, au 413. Vibra redevient un client qui doit sa facture, au 411, et la relance suit cette créance : ${eur(impaye.nominal)} de créances clients manquaient.`,
    indices: ["L'effet a été présenté et refusé : peut-il encore servir ?", "La créance revient au compte du client."],
  },
};

const RECTIFICATIONS = DOSSIER_DE_L_INTERIMAIRE.filter((x) => x.erreur).map((x) => ({ id: x.code, raison: x.erreur!, ecriture: JUSTES[x.code], pourquoi: TEXTES[x.erreur!].pourquoi, indices: TEXTES[x.erreur!].indices }));

// ─────────────────────────────────────────────────────────────────────────────
// L'EFFET DES ERREURS
// ─────────────────────────────────────────────────────────────────────────────

/** Ce que chaque rectification change aux trois soldes : un tableau à compléter, corrigé au serveur. */
export function grilleDesEffets(): TableauACompleter {
  const champs = ["resultat", "clients", "banque"] as const;
  const indices = { resultat: "les charges et les produits qui changent, en plus ou en moins", clients: "ce que le 411 gagne ou perd", banque: "ce que le 512 gagne ou perd" } as const;
  const lignes = r.effets.map((e) => ({
    libelle: DOSSIER_DE_L_INTERIMAIRE.find((x) => x.code === e.code)!.titre,
    cellules: champs.map((ch) => ({ valeur: e[ch], saisir: true, calcul: e[ch] === 0 ? "aucun effet : zéro" : `${eur(e[ch])}`, indice: indices[ch] })),
  }));
  return {
    titre: "Ce que les rectifications changent",
    colonnes: ["Résultat", "Clients, 411", "Banque, 512"],
    lignes: [
      ...lignes,
      {
        libelle: "Total",
        fort: true,
        totalDe: { plus: lignes.map((_, i) => i) },
        cellules: champs.map((ch) => ({ valeur: r.total[ch], saisir: true, calcul: `${r.effets.map((e) => eur(e[ch])).join(" + ")} = ${eur(r.total[ch])}`, indice: "la somme de la colonne" })),
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ENQUÊTE
// ─────────────────────────────────────────────────────────────────────────────

export const LES_EFFETS_DE_L_INTERIMAIRE: Enquete = {
  format: "enquete",
  code: "les-effets-de-l-interimaire",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-compte-client"],
  commanditaire: "Le responsable comptable",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Enquête : les effets de l'intérimaire",
  accroche: "Un intérimaire a tenu les comptes clients de NOVA pendant un congé : effets, escompte, factor, doublon. Relisez ses écritures, trouvez les erreurs, rectifiez, puis chiffrez ce qu'elles faussaient.",
  objectifs: [
    "Contrôler les écritures des effets de commerce, de l'escompte et de l'affacturage",
    "Nommer la nature d'une erreur : le sens, le compte, la nature d'une charge, la créance, la retenue",
    "Passer l'écriture juste de chaque opération fausse",
    "Mesurer l'effet d'une erreur sur le résultat, les créances clients et la banque",
  ],
  libre: false,
  accueil: [
    `Le ${auJournal(JOUR_DE_L_ENQUETE)}, au service comptable de NOVA. Le semestre se clôt ; le responsable revient de congé et veut une relecture des comptes clients avant la balance âgée.`,
    "Sur votre poste, le dossier : son courriel, la note de passation qu'il avait laissée, et les écritures de l'intérimaire. Certaines sont justes, d'autres non. Rien ne vous dit lesquelles.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "le-tri",
      type: "classement",
      titre: "Trier les écritures",
      consigne: "Ouvrez chaque écriture de l'intérimaire, comparez-la à la note de passation, puis dites si elle est juste ou fausse.",
      pieces: ["courriel", "passation"],
      categories: [
        { code: "juste", libelle: "Juste" },
        { code: "fausse", libelle: "Fausse" },
      ],
      elements: DOSSIER_DE_L_INTERIMAIRE.map((x) => ({
        code: x.code,
        piece: pieceDe(x.code),
        libelle: titreDe(x),
        categorie: x.erreur ? "fausse" : "juste",
        pourquoi: x.erreur ? "Fausse : vous direz pourquoi, et vous la rectifierez, à l'étape suivante." : POURQUOI_DES_JUSTES[x.code]!,
      })),
      explication: [`${RECTIFICATIONS.length} écritures sur ${DOSSIER_DE_L_INTERIMAIRE.length} sont fausses, et toutes sont équilibrées : l'équilibre ne prouve pas qu'une écriture est juste.`],
    },
    {
      id: "les-rectifications",
      type: "rectification",
      titre: "Rectifier les écritures fausses",
      consigne: "Pour chaque écriture fausse, choisissez la raison de l'erreur, puis passez l'écriture juste à sa place. Le formulaire part de l'écriture de l'intérimaire.",
      pieces: ["passation"],
      depuis: { etape: "le-tri", dans: "fausse" },
      raisons: RAISONS,
      ecritures: RECTIFICATIONS,
      explication: [
        "Cinq erreurs, cinq natures : un compte d'effet confondu, un intérêt rangé en service, une annulation passée dans le mauvais sens, une retenue de garantie prise pour une charge, un effet impayé laissé en portefeuille.",
      ],
    },
    {
      id: "les-effets",
      type: "etat",
      titre: "Chiffrer ce que les erreurs faussaient",
      consigne: "Pour chaque rectification, dites ce qu'elle change au résultat, au compte 411 et au compte 512, en négatif si elle les baisse ; zéro si elle n'y change rien. Puis faites les totaux.",
      pieces: ["courriel"],
      grille: grilleDesEffets(),
      explication: [
        `Deux erreurs sur cinq ne touchaient ni le résultat, ni les clients, ni la banque. Les autres faussaient le résultat de ${eur(r.total.resultat)}, les créances clients de ${eur(r.total.clients)} et la banque de ${eur(-r.total.banque)} de trop.`,
        "Une balance âgée dressée sur ces comptes aurait oublié Vibra et une facture de CampusTech : la relance serait partie trop tard.",
      ],
    },
  ],
};
