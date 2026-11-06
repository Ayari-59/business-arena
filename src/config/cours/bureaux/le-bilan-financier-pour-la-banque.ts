import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { dateDe } from "../chapitres/la-cloture";
import { eur, nombre } from "../enquetes/lignes-du-dossier";
import { auCentime, type DateDuCours } from "../monde/amortissement";
import { DIVIDENDE_DEMANDE_PAR_ACTION } from "../monde/comptabilite-approfondie";
import { empruntALaCloture } from "../monde/emprunt";
import { EXERCICE_DE_NOVA, MOIS_DE_L_EXERCICE, SUITES_EN_N_PLUS_1 } from "../monde/exercice-de-nova";
import { PART_DU_PRIX_NEUF_A_LA_REVENTE, REGLES_DE_LA_BANQUE, structureDeNova } from "../monde/structure-financiere";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LE BILAN FINANCIER POUR LA BANQUE (comptabilité générale, palier 4 ; la suite du chapitre
 * « Ratios de structure et bilan financier »).
 *
 * Début février N+1, la banque examine la demande de NOVA pour sa gamme : elle veut le bilan financier du
 * 31 décembre N et ses ratios, face à ses règles. Le chapitre donne les reclassements ; au bureau, chacun
 * se lit sur une pièce : le tableau de l'emprunt (les échéances de N+1), la lettre de l'avocat (le
 * jugement attendu), l'avis du compte à terme (son échéance), l'estimation d'un revendeur (la valeur de
 * la ligne), le projet d'affectation (le dividende). L'élève reclasse chaque poste, dresse le bilan
 * financier, calcule les ratios, puis répond à la banque.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : monde/structure-financiere.ts
 * (`structureDeNova`), sur la clôture de NOVA, et le contrat de prêt (monde/emprunt.ts).
 */

const f = EXERCICE_DE_NOVA;
const x = structureDeNova(f);
const p = x.postes;
const b = x.financier;
const r = x.ratios;
const e = empruntALaCloture(f.pret);
const regles = REGLES_DE_LA_BANQUE;

/** Le jour où l'élève ouvre la pile (hypothèse du bureau). */
export const JOUR_DU_BILAN_FINANCIER: DateDuCours = { jour: 9, mois: 2, exercice: 1 };
/** Le jour où l'avocat a écrit (hypothèse du bureau). */
const JOUR_DE_L_AVOCAT: DateDuCours = { jour: 20, mois: 1, exercice: 1 };
const JOUR = dateDe(JOUR_DU_BILAN_FINANCIER);
const AU_31_DECEMBRE = `${dateDe(f.cloture)} N`;
const MOIS_DU_JUGEMENT = MOIS_DE_L_EXERCICE[SUITES_EN_N_PLUS_1.litige.date.mois - 1]!;
const capitauxPropresAvant = auCentime(p.capital + p.resultat);
const dettesDExploitation = auCentime(p.fournisseurs + p.dettesFiscalesEtSociales + p.produitConstateDAvance);
const fois = (n: number) => `${nombre(n)} fois`;

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
  objet: "Le bilan financier pour la banque",
  paragraphes: [
    "Bonjour,",
    "La banque examine notre demande pour la gamme. Elle veut notre bilan financier du 31 décembre et ses ratios, et elle a ses règles : sa lettre est jointe.",
    "Je vous joins aussi ce que j'ai reçu ces dernières semaines. Dites-moi si nous tenons les règles, et ce que la banque risque de discuter.",
    "Merci. Le président",
  ],
};

const LETTRE: PieceDuBureau = {
  code: "lettre",
  nature: "lettre",
  titre: "Lettre de la banque",
  de: "La chargée d'affaires de la banque de NOVA",
  a: "Le président de NOVA",
  date: JOUR,
  objet: "Les éléments de votre dossier",
  paragraphes: [
    "Monsieur le Président,",
    "Nous lisons le bilan selon la liquidité et l'exigibilité, à plus ou à moins d'un an, après la répartition du résultat et à la valeur de réalisation de l'actif.",
    `Nos règles, d'abord sur la dette : au plus ${nombre(regles.capaciteDeRemboursement)} années de capacité d'autofinancement, et au plus ${nombre(regles.endettement)} fois les capitaux propres.`,
    `Puis sur la structure : des ressources propres d'au moins ${nombre(regles.independance * 100)} % des ressources stables, et au moins ${nombre(regles.liquiditeGenerale)} euro d'actif à moins d'un an pour un euro de dettes à moins d'un an.`,
    "Veuillez agréer, Monsieur le Président, nos salutations distinguées.",
  ],
};

const BILAN: PieceDuBureau = {
  code: "bilan",
  nature: "note",
  titre: "Le bilan comptable au 31 décembre N, en valeurs nettes",
  de: "La comptabilité de NOVA",
  a: "Le président",
  date: AU_31_DECEMBRE,
  objet: "Avant répartition du résultat",
  montants: [
    { libelle: "Ligne de montage, valeur nette comptable", montant: p.immobilisationsNettes },
    { libelle: "Stock de composants", montant: p.stock },
    { libelle: "Clients, nets de la dépréciation", montant: p.clientsNets },
    { libelle: "Autres créances (TVA à récupérer)", montant: p.autresCreances },
    { libelle: "Charge constatée d'avance", montant: p.chargesConstateesDAvance },
    { libelle: "Compte à terme et ses intérêts courus", montant: p.placement },
    { libelle: "Banque", montant: p.banque },
    { libelle: "Capital", montant: p.capital },
    { libelle: "Résultat de l'exercice", montant: p.resultat },
    { libelle: "Provision pour litige", montant: p.provision },
    { libelle: "Emprunt, capital restant dû", montant: p.capitalRestantDu },
    { libelle: "Intérêts courus de l'emprunt", montant: p.interetsCourus },
    { libelle: "Fournisseurs", montant: p.fournisseurs },
    { libelle: "Dettes fiscales et sociales, impôt dû compris", montant: p.dettesFiscalesEtSociales },
    { libelle: "Produit constaté d'avance", montant: p.produitConstateDAvance },
    { libelle: "Total du bilan", montant: x.k.bilan.totalActif, fort: true },
  ],
};

const EMPRUNT: PieceDuBureau = {
  code: "emprunt",
  nature: "extrait",
  titre: "Le tableau d'amortissement de l'emprunt, N+1",
  de: "La banque de NOVA",
  a: "NOVA",
  date: AU_31_DECEMBRE,
  paragraphes: [`Capital restant dû : ${eur(e.capitalRestantDu)}. Les intérêts courus au 31 décembre, ${eur(p.interetsCourus)}, se paient avec l'échéance du ${dateDe(e.interetsCourus.echeanceSuivante!.date)}.`],
  montants: [
    { libelle: "Capital remboursé par les échéances de N+1", montant: e.partAMoinsDUnAn },
    { libelle: "Capital restant dû au 31 décembre N+1", montant: auCentime(e.capitalRestantDu - e.partAMoinsDUnAn), fort: true },
  ],
};

const AVOCAT: PieceDuBureau = {
  code: "avocat",
  nature: "lettre",
  titre: "Lettre de l'avocat de NOVA",
  de: "L'avocat de NOVA",
  a: "Le président de NOVA",
  date: dateDe(JOUR_DE_L_AVOCAT),
  objet: "Le litige avec votre client",
  paragraphes: [`L'audience est fixée : le tribunal devrait rendre son jugement en ${MOIS_DU_JUGEMENT} N+1. Je maintiens mon estimation d'une condamnation de l'ordre de ${eur(f.litige.montantProbable)}, payable dès le jugement.`],
};

const AVIS: PieceDuBureau = {
  code: "avis",
  nature: "avis",
  titre: "Avis du compte à terme",
  de: "La banque de NOVA",
  a: "NOVA",
  date: AU_31_DECEMBRE,
  objet: "Échéance de votre placement",
  paragraphes: [`Votre compte à terme arrive à échéance le ${dateDe(f.placement.echeance)}. Le capital et ses intérêts seront versés sur votre compte courant.`],
  montants: [{ libelle: "Capital et intérêts courus au 31 décembre N", montant: p.placement, fort: true }],
};

const ESTIMATION: PieceDuBureau = {
  code: "estimation",
  nature: "lettre",
  titre: "Estimation d'un revendeur de machines",
  de: "Un revendeur de matériel d'occasion",
  a: "Le président de NOVA",
  date: AU_31_DECEMBRE,
  objet: "Votre ligne de montage",
  paragraphes: [`Pour une ligne de cet âge, nous offririons ${nombre(PART_DU_PRIX_NEUF_A_LA_REVENTE * 100)} % de son prix neuf hors taxes, ${eur(f.equipement.ht)}.`],
  montants: [{ libelle: "Prix de rachat proposé", montant: b.valeurDeRevente, fort: true }],
};

const AFFECTATION: PieceDuBureau = {
  code: "affectation",
  nature: "lettre",
  titre: "Le projet d'affectation du bénéfice de N",
  de: "Le président de NOVA",
  a: "Les associés",
  date: JOUR,
  objet: "Assemblée de juin N+1",
  paragraphes: [`Je proposerai un dividende de ${eur(DIVIDENDE_DEMANDE_PAR_ACTION)} par action, soit ${eur(p.dividende)}, payé après le vote. Le reste du bénéfice ira aux réserves et au report à nouveau.`],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, LETTRE, BILAN, EMPRUNT, AVOCAT, AVIS, ESTIMATION, AFFECTATION];

// ─────────────────────────────────────────────────────────────────────────────
// LE RECLASSEMENT
// ─────────────────────────────────────────────────────────────────────────────

const MASSES = [
  { code: "actif-plus", libelle: "Actif à plus d'un an" },
  { code: "actif-moins", libelle: "Actif à moins d'un an" },
  { code: "capitaux", libelle: "Capitaux propres" },
  { code: "dettes-plus", libelle: "Dettes à plus d'un an" },
  { code: "dettes-moins", libelle: "Dettes à moins d'un an" },
] as const;

const ELEMENTS = [
  { code: "ligne", libelle: "La ligne de montage, à sa valeur de rachat", montant: b.valeurDeRevente, piece: "estimation", categorie: "actif-plus", pourquoi: "Une immobilisation que NOVA garde : elle se réalise à plus d'un an, à sa valeur de réalisation." },
  { code: "moins-value", libelle: "La moins-value latente de la ligne, retranchée", montant: b.moinsValueLatente, piece: "estimation", categorie: "capitaux", pourquoi: "La ligne vaut moins que sa valeur nette comptable : l'écart se retranche de l'actif et des capitaux propres." },
  { code: "stock", libelle: "Le stock de composants", montant: p.stock, piece: "bilan", categorie: "actif-moins", pourquoi: "Consommé dans les semaines qui viennent : à moins d'un an." },
  { code: "clients", libelle: "Les clients, nets", montant: p.clientsNets, piece: "bilan", categorie: "actif-moins", pourquoi: "Des créances payables dans l'année : à moins d'un an, pour leur valeur nette." },
  { code: "compte-a-terme", libelle: "Le compte à terme et ses intérêts courus", montant: p.placement, piece: "avis", categorie: "actif-moins", pourquoi: `Il revient le ${dateDe(f.placement.echeance)} : un actif à moins d'un an, presque une disponibilité.` },
  { code: "charge", libelle: "La charge constatée d'avance", montant: p.chargesConstateesDAvance, piece: "bilan", categorie: "actif-moins", pourquoi: "Elle se consomme en N+1 : à moins d'un an." },
  { code: "banque", libelle: "La banque", montant: p.banque, piece: "bilan", categorie: "actif-moins", pourquoi: "Une disponibilité." },
  { code: "capitaux", libelle: "Le capital et le bénéfice mis en réserve", montant: auCentime(capitauxPropresAvant - p.dividende), piece: "affectation", categorie: "capitaux", pourquoi: "Après répartition, ce qui reste du bénéfice demeure aux capitaux propres." },
  { code: "dividende", libelle: "Le dividende proposé", montant: p.dividende, piece: "affectation", categorie: "dettes-moins", pourquoi: "Voté en juin N+1, il sera payé dans l'année : après répartition, c'est une dette à moins d'un an." },
  { code: "provision", libelle: "La provision pour litige", montant: p.provision, piece: "avocat", categorie: "dettes-moins", pourquoi: `Le jugement est attendu en ${MOIS_DU_JUGEMENT} N+1 : la sortie probable est à moins d'un an.` },
  { code: "echeances", libelle: "L'emprunt, le capital des échéances de N+1", montant: b.echeancesAMoinsDUnAn, piece: "emprunt", categorie: "dettes-moins", pourquoi: "Remboursé dans les douze mois : une dette à moins d'un an." },
  { code: "reste", libelle: "L'emprunt, le reste du capital", montant: b.dettesPlusDUnAn, piece: "emprunt", categorie: "dettes-plus", pourquoi: "Remboursé après N+1 : une dette à plus d'un an." },
  { code: "interets", libelle: "Les intérêts courus de l'emprunt", montant: p.interetsCourus, piece: "emprunt", categorie: "dettes-moins", pourquoi: `Payés le ${dateDe(e.interetsCourus.echeanceSuivante!.date)} : à moins d'un an.` },
  { code: "dettes", libelle: "Les fournisseurs, les dettes fiscales et sociales, le produit constaté d'avance", montant: dettesDExploitation, piece: "bilan", categorie: "dettes-moins", pourquoi: "Des dettes d'exploitation et l'impôt dû, payés dans l'année." },
];

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN FINANCIER ET LES RATIOS
// ─────────────────────────────────────────────────────────────────────────────

const saisir = (valeur: number, calcul: string, indice: string, unite?: string) => ({ valeur, saisir: true, calcul, indice, ...(unite ? { unite } : {}) });

/** Le bilan financier, en masses. */
export function grilleDuBilanFinancier(): TableauACompleter {
  return {
    titre: "Le bilan financier au 31 décembre N, après répartition",
    colonnes: ["Montant"],
    lignes: [
      /* 0 */ { libelle: "Actif à plus d'un an", cellules: [saisir(b.actifPlusDUnAn, `la ligne à sa valeur de rachat, ${eur(b.actifPlusDUnAn)}`, "les immobilisations, à leur valeur de réalisation")] },
      /* 1 */ { libelle: "Actif à moins d'un an", cellules: [saisir(b.actifMoinsDUnAn, `${eur(p.stock)} + ${eur(b.creances)} + ${eur(p.placement)} + ${eur(p.banque)} = ${eur(b.actifMoinsDUnAn)}`, "le stock, les créances, le compte à terme et la banque")] },
      /* 2 */ { libelle: "Total de l'actif", fort: true, totalDe: { plus: [0, 1] }, cellules: [saisir(b.totalActif, `${eur(b.actifPlusDUnAn)} + ${eur(b.actifMoinsDUnAn)} = ${eur(b.totalActif)}`, "les deux masses de l'actif")] },
      /* 3 */ {
        libelle: "Capitaux propres",
        cellules: [saisir(b.capitauxPropres, `${eur(capitauxPropresAvant)} − ${eur(p.dividende)} de dividende − ${eur(b.moinsValueLatente)} de moins-value = ${eur(b.capitauxPropres)}`, "les capitaux propres, moins le dividende et la moins-value latente")],
      },
      /* 4 */ { libelle: "Dettes à plus d'un an", cellules: [saisir(b.dettesPlusDUnAn, `${eur(p.capitalRestantDu)} − ${eur(b.echeancesAMoinsDUnAn)} = ${eur(b.dettesPlusDUnAn)}`, "le capital de l'emprunt remboursé après N+1")] },
      /* 5 */ {
        libelle: "Dettes à moins d'un an",
        cellules: [saisir(b.dettesMoinsDUnAn, `${eur(b.echeancesAMoinsDUnAn)} + ${eur(p.provision)} + ${eur(b.autresDettesAMoinsDUnAn)} + ${eur(p.dividende)} = ${eur(b.dettesMoinsDUnAn)}`, "les échéances de N+1, la provision, les autres dettes et le dividende")],
      },
      /* 6 */ { libelle: "Total du passif", fort: true, totalDe: { plus: [3, 4, 5] }, cellules: [saisir(b.totalPassif, `${eur(b.capitauxPropres)} + ${eur(b.dettesPlusDUnAn)} + ${eur(b.dettesMoinsDUnAn)} = ${eur(b.totalPassif)}`, "les trois masses du passif")] },
      /* 7 */ {
        libelle: "Fonds de roulement financier",
        fort: true,
        totalDe: { plus: [3, 4], moins: [0] },
        cellules: [saisir(b.fondsDeRoulementFinancier, `${eur(b.capitauxPermanents)} − ${eur(b.actifPlusDUnAn)} = ${eur(b.fondsDeRoulementFinancier)}`, "les capitaux permanents moins l'actif à plus d'un an")],
      },
    ],
  };
}

/** Les ratios de la banque, au centième. */
export function grilleDesRatios(): TableauACompleter {
  const ratio = (libelle: string, valeur: number, calcul: string, indice: string, unite = "fois") => ({ libelle, cellules: [saisir(valeur, calcul, indice, unite)] });
  return {
    titre: "Les ratios du dossier, au centième",
    colonnes: ["Ratio"],
    lignes: [
      ratio("Liquidité générale", b.liquiditeGenerale, `${eur(b.actifMoinsDUnAn)} ÷ ${eur(b.dettesMoinsDUnAn)} = ${nombre(b.liquiditeGenerale)}`, "l'actif à moins d'un an sur les dettes à moins d'un an"),
      ratio("Liquidité immédiate", b.liquiditeImmediate, `${eur(p.banque)} ÷ ${eur(b.dettesMoinsDUnAn)} = ${nombre(b.liquiditeImmediate)}`, "les disponibilités sur les dettes à moins d'un an"),
      ratio("Autonomie financière", b.autonomie, `${eur(b.capitauxPropres)} ÷ ${eur(b.totalPassif)} = ${nombre(b.autonomie)} %`, "les capitaux propres sur le total du bilan financier, en pour cent", "%"),
      ratio("Indépendance financière", r.independance, `${eur(x.ressourcesPropres)} ÷ ${eur(x.ressourcesStables)} = ${nombre(r.independance)} %`, "les ressources propres sur les ressources stables, au bilan fonctionnel, en pour cent", "%"),
      ratio("Endettement", r.endettement, `${eur(x.dettesFinancieres)} ÷ ${eur(x.capitauxPropres)} = ${nombre(r.endettement)}`, "les dettes financières sur les capitaux propres"),
      ratio("Capacité de remboursement", r.capacite, `${eur(x.dettesFinancieres)} ÷ ${eur(x.caf)} = ${nombre(r.capacite)}`, "les dettes financières sur la capacité d'autofinancement"),
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

export const LE_BILAN_FINANCIER_POUR_LA_BANQUE: Bureau = {
  code: "le-bilan-financier-pour-la-banque",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["ratios-de-structure-et-bilan-financier"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Au bureau : le bilan financier pour la banque",
  accroche: "La banque veut le bilan financier de NOVA et ses ratios, face à ses règles. Chaque reclassement se lit sur une pièce de la pile : trouvez-la, reclassez, calculez, puis répondez.",
  objectifs: [
    "Reclasser chaque poste à plus ou à moins d'un an, d'après les pièces qui le disent",
    "Dresser un bilan financier après répartition, à la valeur de réalisation",
    "Calculer les ratios de liquidité, d'autonomie et de structure",
    "Juger un dossier face aux règles d'une banque, et dire ce qu'elle discutera",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. La banque examine la demande pour la gamme.`,
    "Sur votre poste, la pile : le courriel du président dessus, la lettre de la banque, le bilan comptable, le tableau de l'emprunt, la lettre de l'avocat, l'avis du compte à terme, l'estimation d'un revendeur et le projet d'affectation. Chaque pièce dit où va un poste.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "le-reclassement",
      type: "classement",
      titre: "Reclasser les postes",
      consigne: "Pour chaque poste, ouvrez la pièce qui en parle, puis rangez-le dans sa masse du bilan financier.",
      pieces: ["lettre"],
      categories: MASSES,
      elements: ELEMENTS,
      explication: ["Le bilan financier range selon l'échéance réelle. L'emprunt se coupe en deux, la provision et le dividende deviennent des dettes à moins d'un an, la ligne se lit à sa valeur de rachat."],
    },
    {
      id: "le-bilan-financier",
      type: "etat",
      titre: "Dresser le bilan financier",
      consigne: "Complétez les masses du bilan financier, puis le fonds de roulement financier.",
      pieces: ["bilan"],
      grille: grilleDuBilanFinancier(),
      reussite: "Le bilan financier est équilibré.",
      explication: [`L'actif et le passif retombent sur ${eur(b.totalActif)}, moins que le bilan comptable : la moins-value latente sort des deux côtés. Le fonds de roulement financier est de ${eur(b.fondsDeRoulementFinancier)}.`],
    },
    {
      id: "les-ratios",
      type: "etat",
      titre: "Calculer les ratios",
      consigne: "Calculez chaque ratio au centième. Les deux derniers se lisent sur le bilan fonctionnel : le chapitre les a déjà vus.",
      pieces: ["lettre", "bilan"],
      grille: grilleDesRatios(),
      reussite: "Les ratios sont justes.",
      explication: [`Toutes les règles de la banque sont tenues, et largement : un endettement de ${fois(r.endettement)}, une capacité de remboursement de ${nombre(r.capacite)} année, une liquidité générale de ${fois(b.liquiditeGenerale)}.`],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez au président, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "les-regles",
          question: "NOVA tient-elle les règles de la banque ?",
          options: [
            { texte: "Oui, toutes", juste: true, retour: `Oui : ${fois(r.capacite)} la CAF pour ${nombre(regles.capaciteDeRemboursement)} admises, ${fois(r.endettement)} les capitaux propres pour ${nombre(regles.endettement)}, ${nombre(r.independance)} % d'indépendance, une liquidité de ${fois(b.liquiditeGenerale)}.` },
            { texte: "Non, la liquidité immédiate est sous 1", juste: false, retour: `Non : la banque n'a pas de règle de liquidité immédiate, et le compte à terme revient le ${dateDe(f.placement.echeance)}.` },
            { texte: "Non, l'autonomie financière est sous la moitié du bilan", juste: false, retour: "Non : la règle porte sur l'indépendance financière, au bilan fonctionnel, et elle est tenue." },
            { texte: "On ne peut pas le dire avant que l'assemblée ait voté le dividende de juin", juste: false, retour: "Non : le bilan financier se lit après la répartition proposée ; le dividende y est déjà une dette." },
          ],
        },
        {
          id: "l-immediate",
          question: `La liquidité immédiate n'est que de ${nombre(b.liquiditeImmediate)}. Faut-il s'en inquiéter ?`,
          options: [
            { texte: "Non, le compte à terme revient en janvier", juste: true, retour: `Oui : le ${dateDe(f.placement.echeance)}, il rejoint la banque, et la liquidité immédiate passe à ${nombre(b.liquiditeAuSixJanvier)}.` },
            { texte: "Oui, NOVA ne peut pas payer ses dettes de janvier", juste: false, retour: `Non : la banque porte ${eur(p.banque)}, et les dettes à moins d'un an s'étalent sur toute l'année.` },
            { texte: "Oui, il faut négocier un découvert avant la fin de février pour payer les fournisseurs", juste: false, retour: "Non : avec le compte à terme revenu, NOVA a plus de disponibilités que de dettes à moins d'un an." },
          ],
        },
        {
          id: "le-dividende",
          question: "Pourquoi le dividende proposé est-il une dette dans le bilan financier ?",
          options: [
            { texte: "Il sera payé avant un an", juste: true, retour: `Oui : voté en juin N+1, il sort de la trésorerie dans l'année. Après répartition, il quitte les capitaux propres, ${eur(p.dividende)}.` },
            { texte: "Il est déjà payé aux associés", juste: false, retour: "Non : il n'est ni voté ni payé au 31 décembre. Le bilan financier anticipe la répartition." },
            { texte: "Le bénéfice de N appartient aux associés dès la clôture, avant toute assemblée", juste: false, retour: "Non : c'est l'assemblée qui décide. Le bilan financier se lit après la répartition qu'on lui propose." },
          ],
        },
      ],
      explication: [`Votre réponse au président : le bilan financier totalise ${eur(b.totalActif)} ; toutes les règles de la banque sont tenues. Elle discutera surtout la valeur de la ligne et la trésorerie de janvier, que le compte à terme assure.`],
    },
  ],
};
