import { montantEcrit, type EcritureAttendue } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { PLAFOND_DE_LA_RESERVE_LEGALE } from "../monde/affectation-du-resultat";
import { ASSEMBLEE_DE_N_PLUS_1, DIVIDENDE_PROPOSE_DU_CAS, INTERET_STATUTAIRE, affectationDeNova, augmentation } from "../monde/capitaux-propres";
import { RESERVE_LEGALE } from "../monde/comptabilite-approfondie";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import { assembleeDeJuin } from "../monde/assemblee-de-juin";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : L'ASSEMBLÉE DE JUIN (comptabilité générale, palier 4 ; la suite du chapitre « Les
 * capitaux propres : constituer, augmenter, affecter » et de son cas, « Un dividende plus gros »).
 *
 * Début juillet N+1, la pile de l'assemblée du 15 juin attend : le procès-verbal (l'affectation du
 * bénéfice de N et l'augmentation de capital), le courriel de l'actionnaire que l'assemblée n'a pas
 * suivie, le certificat du dépositaire, la facture des honoraires, le relevé de banque. L'élève dit ce
 * que chaque opération fait aux capitaux propres, passe les quatre écritures, dresse les capitaux
 * propres au 1er juillet, puis répond au président. Tous les chiffres se calculent dans le monde du
 * cours (monde/assemblee-de-juin.ts, qui lit monde/capitaux-propres.ts) ; ce fichier écrit la pile, les
 * consignes et les corrigés, qui ne partent jamais au navigateur.
 *
 * UN CRAN PLUS LOIN QUE LE CHAPITRE : les opérations ne sont plus données une à une ni en variantes ;
 * elles arrivent ensemble, et l'élève les enchaîne jusqu'aux capitaux propres d'après, avec le nouveau
 * plafond de la réserve légale. Le piège : la proposition de l'actionnaire, qui n'a pas été votée.
 */

const f = EXERCICE_DE_NOVA;
const x = affectationDeNova();
const a = augmentation();
const j = assembleeDeJuin();
const eur = (n: number) => montantEcrit(n + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`.replace(/^-/, "−");
const nombre = (n: number) => n.toLocaleString("fr-FR");
const AG = `${ASSEMBLEE_DE_N_PLUS_1.date} N+1`;
const PAIEMENT = `${ASSEMBLEE_DE_N_PLUS_1.miseEnPaiement} N+1`;
const AUGMENTATION = a.date.replace("N + 1", "N+1");

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "La comptabilité",
  date: "3 juillet N+1",
  objet: "Après l'assemblée",
  paragraphes: [
    "Bonjour,",
    "L'assemblée du 15 juin a tout voté : l'affectation du bénéfice de N et l'augmentation de capital. Les pièces sont dans la pile.",
    "Pouvez-vous tout passer, puis me dire où en sont nos capitaux propres au 1er juillet ?",
    "Je voudrais aussi savoir ce que l'opération a fait à notre trésorerie, et ce qu'il faudra encore mettre en réserve légale.",
    "Merci. Le président",
  ],
};

const PROCES_VERBAL: PieceDuBureau = {
  code: "proces-verbal",
  nature: "proces-verbal",
  titre: "Procès-verbal de l'assemblée du 15 juin",
  de: "L'assemblée générale des associés de NOVA",
  a: "Le registre des décisions",
  date: AG,
  objet: "Comptes de N, affectation, augmentation de capital",
  paragraphes: [
    `Première décision. L'assemblée approuve les comptes de N, qui font apparaître un bénéfice de ${eur(x.benefice)}.`,
    `Deuxième décision. Le bénéfice est affecté ainsi : ${pct(RESERVE_LEGALE)} à la réserve légale, ${eur(x.reservesFacultatives)} aux réserves facultatives, un dividende de ${eur(x.dividendeParAction)} par action, le solde en report à nouveau.`,
    `Le dividende comprend l'intérêt statutaire de ${pct(INTERET_STATUTAIRE)} du capital libéré. Il sera mis en paiement le ${PAIEMENT}.`,
    `Troisième décision. Le capital est augmenté par l'émission de ${nombre(a.nouvelles)} actions nouvelles de ${eur(a.nominal)} de nominal, une pour ${nombre(a.parite)} anciennes, au prix de ${eur(a.prix)}, libérées en entier à la souscription.`,
    "Les frais de l'opération s'imputeront sur la prime d'émission.",
  ],
};

const COURRIEL_DE_L_ACTIONNAIRE: PieceDuBureau = {
  code: "actionnaire",
  nature: "courriel",
  titre: "Courriel d'une actionnaire",
  de: "Une actionnaire de NOVA",
  a: "Le président de NOVA",
  date: "1er juin N+1",
  objet: "Le dividende",
  paragraphes: [
    `Je proposerai à l'assemblée un dividende de ${eur(DIVIDENDE_PROPOSE_DU_CAS)} par action, en gardant les réserves facultatives du projet.`,
    "Pouvez-vous l'inscrire à l'ordre du jour ?",
  ],
};

const CERTIFICAT: PieceDuBureau = {
  code: "certificat",
  nature: "avis",
  titre: "Certificat du dépositaire des fonds",
  de: "La banque de NOVA",
  a: "Le président de NOVA",
  date: AUGMENTATION,
  objet: "Augmentation de capital de NOVA",
  paragraphes: [`Nous certifions avoir reçu les souscriptions de ${nombre(a.nouvelles)} actions nouvelles, libérées en entier, et porté les fonds au crédit de votre compte.`],
  montants: [{ libelle: `${nombre(a.nouvelles)} actions à ${eur(a.prix)}`, montant: a.fonds, fort: true }],
};

const FACTURE: PieceDuBureau = {
  code: "honoraires",
  nature: "facture",
  titre: "Facture des honoraires de l'augmentation",
  de: "Le cabinet d'avocats de NOVA",
  a: "NOVA",
  date: AUGMENTATION,
  objet: "Rédaction des actes de l'augmentation de capital",
  montants: [
    { libelle: "Honoraires hors taxes", montant: a.frais.honoraires },
    { libelle: `TVA à ${pct(a.frais.tauxDeTva)}`, montant: a.frais.tva },
    { libelle: "Payé par virement le 30 juin", montant: a.frais.paye, fort: true },
  ],
};

const RELEVE: PieceDuBureau = {
  code: "releve",
  nature: "releve",
  titre: "Relevé de banque, fin juin et début juillet",
  de: "La banque de NOVA",
  a: "NOVA",
  date: "2 juillet N+1",
  lignes: [
    { date: AUGMENTATION, libelle: "Virement reçu, souscriptions de l'augmentation de capital", montant: a.fonds },
    { date: AUGMENTATION, libelle: "Virement émis, cabinet d'avocats", montant: -a.frais.paye },
    { date: PAIEMENT, libelle: "Virements émis, dividendes aux associés", montant: -x.dividendes },
  ],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, PROCES_VERBAL, COURRIEL_DE_L_ACTIONNAIRE, CERTIFICAT, FACTURE, RELEVE];

// ─────────────────────────────────────────────────────────────────────────────
// LES ÉCRITURES
// ─────────────────────────────────────────────────────────────────────────────

const AFFECTATION: EcritureAttendue = {
  date: AG,
  libelle: "Affectation du résultat de N",
  lignes: [
    { role: "le résultat, qui se solde", compte: "120", sens: "debit", montant: x.benefice, indice: "tout le bénéfice de N" },
    { role: "la réserve légale", compte: "1061", sens: "credit", montant: x.reserveLegale, indice: "la part de la loi, sous le plafond" },
    { role: "les réserves facultatives", compte: "1068", sens: "credit", montant: x.reservesFacultatives, indice: "les réserves votées" },
    { role: "les dividendes dus aux associés", compte: "457", sens: "credit", montant: x.dividendes, indice: "le dividende par action, pour toutes les actions anciennes" },
    { role: "le report à nouveau", compte: "110", sens: "credit", montant: x.reportANouveau, indice: "ce qui reste du bénéfice distribuable" },
  ],
};

const SOUSCRIPTION: EcritureAttendue = {
  date: AUGMENTATION,
  libelle: "Augmentation de capital en numéraire",
  lignes: [
    { role: "l'argent reçu des souscripteurs", compte: "512", sens: "debit", montant: a.fonds, indice: "les actions nouvelles au prix d'émission" },
    { role: "le capital, pour le nominal des actions nouvelles", compte: "1013", acceptes: ["101"], sens: "credit", montant: a.capital, indice: "les actions nouvelles au nominal" },
    { role: "la prime d'émission", compte: "1041", sens: "credit", montant: a.prime, indice: "l'excédent du prix sur le nominal" },
  ],
};

const FRAIS: EcritureAttendue = {
  date: AUGMENTATION,
  libelle: "Frais d'augmentation de capital, imputés sur la prime",
  lignes: [
    { role: "la prime d'émission, qui absorbe les frais", compte: "1041", sens: "debit", montant: a.frais.honoraires, indice: "les honoraires hors taxes" },
    { role: "la TVA déductible", compte: "44566", sens: "debit", montant: a.frais.tva, indice: "la TVA de la facture" },
    { role: "l'argent qui sort", compte: "512", sens: "credit", montant: a.frais.paye, indice: "le toutes taxes comprises" },
  ],
};

const MISE_EN_PAIEMENT: EcritureAttendue = {
  date: PAIEMENT,
  libelle: "Mise en paiement des dividendes",
  lignes: [
    { role: "la dette envers les associés, qui s'éteint", compte: "457", sens: "debit", montant: x.dividendes, indice: "le dividende total" },
    { role: "l'argent qui sort", compte: "512", sens: "credit", montant: x.dividendes, indice: "le dividende total" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LES CAPITAUX PROPRES AU 1ER JUILLET
// ─────────────────────────────────────────────────────────────────────────────

const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });

/** Les capitaux propres de NOVA au 1er juillet N+1, et la réserve légale à venir : un tableau à compléter. */
export function grilleDesCapitauxPropres(): TableauACompleter {
  return {
    titre: "Les capitaux propres de NOVA au 1er juillet N+1",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Capital", cellules: [saisir(a.capitalApres, `${eur(x.capital)} + ${nombre(a.nouvelles)} × ${eur(a.nominal)} = ${eur(a.capitalApres)}`, "le capital ancien, plus le nominal des actions nouvelles")] },
      { libelle: "Prime d'émission", cellules: [saisir(a.frais.primeRestante, `${nombre(a.nouvelles)} × (${eur(a.prix)} − ${eur(a.nominal)}) − ${eur(a.frais.honoraires)} = ${eur(a.frais.primeRestante)}`, "la prime, moins les frais hors taxes")] },
      { libelle: "Réserve légale", cellules: [saisir(x.reserveLegale, `${eur(x.benefice)} × ${pct(RESERVE_LEGALE)} = ${eur(x.reserveLegale)}`, "la dotation votée en juin")] },
      { libelle: "Réserves facultatives", cellules: [saisir(x.reservesFacultatives, `les réserves votées : ${eur(x.reservesFacultatives)}`, "les réserves votées en juin")] },
      { libelle: "Report à nouveau", cellules: [saisir(x.reportANouveau, `${eur(x.distribuable)} − ${eur(x.dividendes)} − ${eur(x.reservesFacultatives)} = ${eur(x.reportANouveau)}`, "ce qui reste du bénéfice distribuable")] },
      {
        libelle: "Capitaux propres",
        fort: true,
        totalDe: { plus: [0, 1, 2, 3, 4] },
        cellules: [saisir(j.capitauxPropres, `${eur(a.capitalApres)} + ${eur(a.frais.primeRestante)} + ${eur(x.reserveLegale)} + ${eur(x.reservesFacultatives)} + ${eur(x.reportANouveau)} = ${eur(j.capitauxPropres)}`, "la somme des lignes")],
      },
      { libelle: "Nouveau plafond de la réserve légale", cellules: [saisir(a.plafondApres, `${eur(a.capitalApres)} × ${pct(PLAFOND_DE_LA_RESERVE_LEGALE)} = ${eur(a.plafondApres)}`, "le dixième du capital augmenté")] },
      { libelle: "Ce qu'il reste à doter", cellules: [saisir(a.resteADoter, `${eur(a.plafondApres)} − ${eur(x.reserveLegale)} = ${eur(a.resteADoter)}`, "le plafond, moins la réserve déjà dotée")] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

export const L_ASSEMBLEE_DE_JUIN: Bureau = {
  code: "l-assemblee-de-juin",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["les-capitaux-propres"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Au bureau : l'assemblée de juin",
  accroche: "L'assemblée a voté l'affectation et l'augmentation de capital. Dites ce que chaque opération fait aux capitaux propres, passez-les, dressez les capitaux propres au 1er juillet, puis répondez au président.",
  objectifs: [
    "Dire ce qu'une affectation, une augmentation de capital, des frais imputés sur la prime et un paiement de dividendes font aux capitaux propres",
    "Passer ces écritures à partir du procès-verbal et des pièces",
    "Dresser les capitaux propres après l'assemblée et le nouveau plafond de la réserve légale",
    "Écarter une proposition que l'assemblée n'a pas votée",
  ],
  libre: false,
  accueil: [
    "Le 3 juillet N+1, au siège de NOVA. L'assemblée du 15 juin s'est tenue ; rien n'en est encore passé au journal.",
    "Sur votre poste, la pile : le courriel du président dessus, puis le procès-verbal et les pièces de l'opération. Le procès-verbal fait foi : seul ce qu'il dit a été décidé.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "les-operations",
      type: "classement",
      titre: "Ce que chaque opération fait aux capitaux propres",
      consigne: "Ouvrez chaque pièce et dites ce que l'opération qu'elle porte fait au total des capitaux propres de NOVA : il monte, il baisse, ou il ne bouge pas.",
      pieces: ["courriel", "proces-verbal"],
      categories: [
        { code: "monte", libelle: "Ils montent" },
        { code: "baisse", libelle: "Ils baissent" },
        { code: "rien", libelle: "Ils ne bougent pas" },
      ],
      elements: [
        { code: "affectation", piece: "proces-verbal", libelle: "L'affectation du bénéfice de N", categorie: "baisse", pourquoi: `Les réserves et le report restent dans les capitaux propres ; les ${eur(x.dividendes)} de dividendes en sortent, vers une dette envers les associés.` },
        { code: "souscription", piece: "certificat", libelle: "La souscription des actions nouvelles", categorie: "monte", pourquoi: `${eur(a.fonds)} entrent : ${eur(a.capital)} de capital et ${eur(a.prime)} de prime d'émission.` },
        { code: "honoraires", piece: "honoraires", libelle: "Les honoraires de l'augmentation", categorie: "baisse", pourquoi: `Imputés sur la prime, les ${eur(a.frais.honoraires)} hors taxes la diminuent ; la TVA, déductible, n'y touche pas.` },
        { code: "dividendes", piece: "releve", libelle: "Le paiement des dividendes", categorie: "rien", pourquoi: "La dette envers les associés s'éteint et la banque baisse : les capitaux propres ont baissé le jour du vote, pas le jour du paiement." },
        { code: "actionnaire", piece: "actionnaire", libelle: "La proposition de l'actionnaire", categorie: "rien", pourquoi: `Le procès-verbal retient ${eur(x.dividendeParAction)} par action : la proposition à ${eur(DIVIDENDE_PROPOSE_DU_CAS)} n'a pas été votée, elle ne s'enregistre pas.` },
      ],
      explication: [
        `L'affectation et les frais baissent les capitaux propres, la souscription les monte. Le vote du dividende les baisse, son paiement ne change que la trésorerie. Au total : ${eur(x.capitauxPropresAvant)} avant l'assemblée, ${eur(j.capitauxPropres)} après.`,
      ],
    },
    {
      id: "les-ecritures",
      type: "journal",
      titre: "Passer les écritures",
      consigne: "Passez au journal les écritures de l'assemblée et de l'augmentation, une à une, dans l'ordre que vous voulez : l'affectation, la souscription, les frais, la mise en paiement.",
      pieces: ["proces-verbal", "certificat", "honoraires", "releve"],
      ecritures: [
        { id: "affectation", ecriture: AFFECTATION, indices: ["Le 120 se solde au débit, pour tout le bénéfice.", "Au crédit : la réserve légale, les réserves facultatives, les dividendes dus (457), le report à nouveau."] },
        { id: "souscription", ecriture: SOUSCRIPTION, indices: ["La banque reçoit le prix d'émission.", "Au crédit, le capital au nominal (1013), l'excédent en prime d'émission (1041)."] },
        { id: "frais", ecriture: FRAIS, indices: ["Imputés sur la prime : le 1041 se débite, sans passer par une charge.", "La TVA reste déductible ; la banque paie le toutes taxes comprises."] },
        { id: "mise-en-paiement", ecriture: MISE_EN_PAIEMENT, indices: ["La dette du 457 se solde au débit ; la banque, au crédit."] },
      ],
      explication: [
        `Le compte 512 a reçu ${eur(a.fonds)} et versé ${eur(j.sorties)} : ${eur(j.tresorerie)} de plus en banque sur ces quelques jours, dont ${eur(a.frais.tva)} de TVA que l'État rendra.`,
      ],
    },
    {
      id: "les-capitaux-propres",
      type: "etat",
      titre: "Les capitaux propres au 1er juillet",
      consigne: "Complétez les capitaux propres de NOVA au 1er juillet N+1, une fois l'assemblée et l'augmentation passées, puis le nouveau plafond de la réserve légale et ce qu'il reste à y doter.",
      pieces: ["proces-verbal"],
      grille: grilleDesCapitauxPropres(),
      explication: [
        `Les capitaux propres passent de ${eur(x.capitauxPropresAvant)} à ${eur(j.capitauxPropres)} : ${eur(x.dividendes)} sortis vers les associés, ${eur(a.fonds)} apportés, ${eur(a.frais.honoraires)} de frais sur la prime.`,
        `Le plafond de la réserve légale monte avec le capital : ${eur(a.plafondApres)}. Les prochaines assemblées doteront la réserve jusqu'à ce qu'elle l'atteigne.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez aux questions du courriel, chiffres à l'appui.",
      pieces: ["courriel", "releve"],
      questions: [
        {
          id: "la-tresorerie",
          question: "Qu'est-ce que l'assemblée et l'augmentation ont fait au compte en banque, du 30 juin au 1er juillet ?",
          options: [
            { texte: `${eur(j.tresorerie)} de plus`, juste: true, retour: `Oui : ${eur(a.fonds)} reçus, ${eur(a.frais.paye)} d'honoraires et ${eur(x.dividendes)} de dividendes versés. La TVA des honoraires, ${eur(a.frais.tva)}, reviendra par la déclaration.` },
            { texte: `${eur(a.fonds)} de plus, le montant de l'augmentation`, juste: false, retour: `Non : les honoraires et les dividendes sont sortis aussi, ${eur(j.sorties)} en tout.` },
            { texte: `${eur(j.capitauxPropres - x.capitauxPropresAvant)}, ce que les capitaux propres ont gagné`, juste: false, retour: "Non : le dividende a quitté les capitaux propres le jour du vote, et la TVA ne les touche pas. Trésorerie et capitaux propres ne bougent pas du même montant." },
          ],
        },
        {
          id: "les-frais",
          question: `Les ${eur(a.frais.honoraires)} d'honoraires, imputés sur la prime, que changent-ils au résultat de N+1 ?`,
          options: [
            { texte: "Rien : ils ne passent pas en charges", juste: true, retour: "Oui : ils diminuent la prime d'émission, sans jamais passer par le compte de résultat. NOVA aurait pu aussi les passer en charges, ou en frais d'établissement." },
            { texte: `Ils baissent le résultat de ${eur(a.frais.paye)}, toutes taxes comprises`, juste: false, retour: "Non : imputés sur la prime, ils ne touchent pas le résultat ; et la TVA, déductible, ne serait jamais une charge." },
            { texte: `Ils baissent le résultat de ${eur(a.frais.honoraires)}, comme toute facture d'honoraires reçue dans l'année`, juste: false, retour: "Non : c'est le cas s'ils passent en charges. L'assemblée a choisi de les imputer sur la prime." },
          ],
        },
        {
          id: "la-reserve",
          question: "Que faudra-t-il encore mettre en réserve légale ?",
          options: [
            { texte: `${eur(a.resteADoter)}, jusqu'au nouveau plafond`, juste: true, retour: `Oui : le plafond est le dixième du capital, ${eur(a.plafondApres)} désormais ; la réserve en a ${eur(x.reserveLegale)}. Chaque année, ${pct(RESERVE_LEGALE)} du bénéfice y ira jusque-là.` },
            { texte: `${eur(x.plafond - x.reserveLegale)}, jusqu'au plafond d'avant l'augmentation`, juste: false, retour: `Non : le plafond suit le capital, qui est passé à ${eur(a.capitalApres)}.` },
            { texte: "Rien : la réserve légale ne se dote que l'année de la création de la société", juste: false, retour: `Non : chaque année, ${pct(RESERVE_LEGALE)} du bénéfice y va, jusqu'à ce qu'elle atteigne le dixième du capital.` },
          ],
        },
      ],
      explication: [
        `Votre réponse : ${eur(j.capitauxPropres)} de capitaux propres au 1er juillet, ${eur(j.tresorerie)} de plus en banque, ${eur(a.resteADoter)} encore à doter en réserve légale.`,
      ],
    },
  ],
};
