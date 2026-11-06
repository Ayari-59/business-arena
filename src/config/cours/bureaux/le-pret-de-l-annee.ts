import { montantEcrit, type EcritureAttendue } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { clotureDe, JOURS_DU_MOIS, type DateDuCours } from "../monde/amortissement";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import { ECHEANCES_A_PASSER, ECHEANCE_MAL_PASSEE, JOUR_DU_BUREAU, pretDeLAnnee } from "../monde/pret-de-l-annee";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LE PRÊT DE L'ANNÉE (comptabilité générale, palier 3 ; la suite du chapitre « L'emprunt et
 * ses intérêts » et de son cas, « Un deuxième prêt »).
 *
 * Le 5 janvier N+1, avant la clôture de N, la pile du prêt de NOVA attend sur le poste de l'élève : le
 * contrat, l'avis de versement, l'extrait du compte 164, deux avis d'échéance, le relevé de janvier et
 * une proposition de la banque. Le président a passé lui-même le versement et la première échéance,
 * celle-ci de travers. L'élève classe la pile, passe les écritures qui manquent et la correction, lit
 * l'emprunt au 31 décembre, puis répond au président. Tous les chiffres se calculent dans le monde du
 * cours (monde/pret-de-l-annee.ts, qui lit monde/emprunt.ts) ; ce fichier écrit la pile, les consignes
 * et les corrigés, qui ne partent jamais au navigateur (pedagogy/cours/bureau-servi.ts).
 *
 * UN CRAN PLUS LOIN QUE LE CHAPITRE : les écritures ne sont plus demandées une à une ; l'élève voit
 * lui-même ce qui est déjà passé, ce qui manque, ce qui est faux, et ce qui attend la clôture. Le piège :
 * l'échéance du 3 janvier N+1, au relevé de janvier, ne se passe pas en N, mais elle fixe les intérêts
 * courus.
 */

const f = EXERCICE_DE_NOVA;
const x = pretDeLAnnee(f);
const eur = (n: number) => montantEcrit(n + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} %`.replace(/^-/, "−");
const nombre = (n: number) => n.toLocaleString("fr-FR");
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
/** Une date de la pile : « 3 avril N », « 3 janvier N+1 ». */
const jour = (d: DateDuCours) => `${d.jour === 1 ? "1er" : d.jour} ${MOIS[d.mois - 1]} N${d.exercice ? `+${d.exercice}` : ""}`;
const echeance = (k: number) => x.e(k);
const AU_31_DECEMBRE = jour(clotureDe(0));
/** Les lignes du tableau d'amortissement que la pièce du contrat montre. */
const LIGNES_DU_CONTRAT = 5;

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "La comptabilité",
  date: jour(JOUR_DU_BUREAU),
  objet: "Le prêt, avant la clôture",
  paragraphes: [
    "Bonjour,",
    "J'ai passé moi-même le versement du prêt et la première échéance. Le reste est dans la pile.",
    "Pouvez-vous passer ce qui manque, vérifier ce que j'ai fait, et me dire ce que l'emprunt doit montrer au 31 décembre ?",
    "Je veux aussi savoir ce que le prêt nous a coûté cette année, et si la proposition de la banque vaut le coup.",
    "Merci. Le président",
  ],
};

const CONTRAT: PieceDuBureau = {
  code: "contrat",
  nature: "contrat",
  titre: "Le contrat de prêt",
  de: "La banque de NOVA",
  a: "Le président de NOVA",
  date: jour(x.contrat.versement),
  objet: "Prêt professionnel, conditions particulières",
  paragraphes: [
    `Montant : ${eur(x.contrat.capital)}, versés le ${jour(x.contrat.versement)}.`,
    `Taux : ${pct(x.contrat.tauxAnnuel)} l'an, soit ${pct(x.i)} par trimestre. Durée : ${nombre(x.contrat.dureeAns)} ans, ${nombre(x.tableau.length)} échéances trimestrielles, à la date anniversaire du versement.`,
    "Amortissement constant : chaque échéance rembourse la même part du capital, et les intérêts du trimestre sur le capital restant dû.",
  ],
  montants: x.tableau.slice(0, LIGNES_DU_CONTRAT).map((l) => ({ libelle: `Échéance n° ${l.numero}, le ${jour(l.date)} : ${eur(l.amortissement)} de capital et ${eur(l.interets)} d'intérêts`, montant: l.echeance })),
  mention: `Les ${nombre(LIGNES_DU_CONTRAT)} premières lignes du tableau d'amortissement, joint au contrat.`,
};

const AVIS_DE_VERSEMENT: PieceDuBureau = {
  code: "versement",
  nature: "avis",
  titre: "Avis de versement des fonds",
  de: "La banque de NOVA",
  a: "NOVA",
  date: jour(x.contrat.versement),
  objet: "Mise à disposition de votre prêt",
  montants: [{ libelle: "Porté au crédit de votre compte", montant: x.contrat.capital, fort: true }],
};

const EXTRAIT_DU_164: PieceDuBureau = {
  code: "extrait-164",
  nature: "extrait",
  titre: "Extrait du compte 164, au 5 janvier",
  de: "La comptabilité de NOVA",
  a: "La comptabilité",
  date: jour(JOUR_DU_BUREAU),
  lignes: [
    { date: jour(x.contrat.versement), libelle: "Emprunt bancaire", montant: -x.contrat.capital },
    { date: jour(x.mal.date), libelle: `Échéance n° ${ECHEANCE_MAL_PASSEE} de l'emprunt`, montant: x.mal.echeance },
  ],
  montants: [{ libelle: "Solde créditeur", montant: x.soldeDu164Avant, fort: true }],
  mention: "Le compte 6611, intérêts des emprunts, n'a reçu aucune écriture cette année.",
};

/** Un avis d'échéance du prêt : le capital, les intérêts, le prélèvement, le capital restant dû. */
function avisDEcheance(k: number): PieceDuBureau {
  const l = echeance(k);
  return {
    code: `avis-${k}`,
    nature: "avis",
    titre: `Avis d'échéance n° ${k}`,
    de: "La banque de NOVA",
    a: "NOVA",
    date: jour(l.date),
    objet: "Votre prêt professionnel",
    montants: [
      { libelle: "Capital remboursé", montant: l.amortissement },
      { libelle: `Intérêts (${pct(x.contrat.tauxAnnuel)} l'an, un trimestre)`, montant: l.interets },
      { libelle: "Montant prélevé", montant: l.echeance, fort: true },
      { libelle: "Capital restant dû", montant: l.capitalFin },
    ],
  };
}

const RELEVE_DE_JANVIER: PieceDuBureau = {
  code: "releve-janvier",
  nature: "releve",
  titre: "Relevé de banque, début janvier N+1",
  de: "La banque de NOVA",
  a: "NOVA",
  date: jour(JOUR_DU_BUREAU),
  lignes: [{ date: jour(x.suivante.date), libelle: `Prélèvement, échéance n° ${x.suivante.numero} du prêt`, montant: -x.suivante.echeance }],
  mention: `Détail de l'échéance : ${eur(x.suivante.amortissement)} de capital et ${eur(x.suivante.interets)} d'intérêts.`,
};

const PROPOSITION: PieceDuBureau = {
  code: "proposition",
  nature: "lettre",
  titre: "Une proposition de la banque",
  de: "La banque de NOVA",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Des échéances toutes égales",
  paragraphes: [
    `Nous vous proposons de rembourser les ${nombre(x.restantes)} dernières échéances, à partir de celle du ${jour(x.premiereDeLAvenant.date)}, par une échéance constante, au même taux.`,
    `L'échéance d'avril passerait de ${eur(x.premiereDeLAvenant.echeance)} à ${eur(x.constante)}. L'avenant serait signé en janvier N+1 ; celle de janvier ne change pas.`,
  ],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, CONTRAT, AVIS_DE_VERSEMENT, EXTRAIT_DU_164, avisDEcheance(2), avisDEcheance(3), RELEVE_DE_JANVIER, PROPOSITION];

// ─────────────────────────────────────────────────────────────────────────────
// LES ÉCRITURES
// ─────────────────────────────────────────────────────────────────────────────

/** L'écriture d'une échéance : le capital au 164, les intérêts au 6611, la banque pour le prélèvement. */
function ecritureDEcheance(k: number): EcritureAttendue {
  const l = echeance(k);
  return {
    date: jour(l.date),
    libelle: `Échéance n° ${k} de l'emprunt`,
    lignes: [
      { role: "le capital remboursé, qui réduit la dette", compte: "164", acceptes: ["1641"], sens: "debit", montant: l.amortissement, indice: "le capital remboursé de l'avis" },
      { role: "les intérêts du trimestre", compte: "6611", acceptes: ["661"], sens: "debit", montant: l.interets, indice: "les intérêts de l'avis" },
      { role: "le prélèvement sur le compte en banque", compte: "512", sens: "credit", montant: l.echeance, indice: "le montant prélevé" },
    ],
  };
}

const CORRECTION: EcritureAttendue = {
  date: AU_31_DECEMBRE,
  libelle: `Correction de l'échéance n° ${ECHEANCE_MAL_PASSEE} : les intérêts sortent du 164`,
  lignes: [
    { role: "les intérêts de l'échéance n° 1, qui manquaient aux charges", compte: "6611", acceptes: ["661"], sens: "debit", montant: x.correction, indice: "les intérêts de l'échéance n° 1, au tableau du contrat" },
    { role: "la dette, remise à son montant", compte: "164", acceptes: ["1641"], sens: "credit", montant: x.correction, indice: "ce que le 164 a reçu de trop au débit" },
  ],
};

const INTERETS_COURUS: EcritureAttendue = {
  date: AU_31_DECEMBRE,
  libelle: "Intérêts courus sur l'emprunt",
  lignes: [
    { role: "la charge d'intérêts de l'exercice", compte: "6611", acceptes: ["661"], sens: "debit", montant: x.courus.montant, indice: "les intérêts de l'échéance de janvier, au prorata des jours de N" },
    { role: "la dette d'intérêts courus", compte: "1688", sens: "credit", montant: x.courus.montant, indice: "les intérêts courus calculés" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// L'EMPRUNT AU 31 DÉCEMBRE
// ─────────────────────────────────────────────────────────────────────────────

const a = x.annee;
const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });

/** L'emprunt au 31 décembre N : un tableau à compléter, corrigé au serveur. */
export function grilleDeLEmprunt(): TableauACompleter {
  return {
    titre: "L'emprunt au 31 décembre N",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Prélevé par la banque dans l'année", cellules: [saisir(a.decaissements, `${a.echeances.map((l) => eur(l.echeance)).join(" + ")} = ${eur(a.decaissements)}`, `les ${nombre(a.echeances.length)} échéances de N, capital et intérêts`)] },
      { libelle: "Intérêts payés dans l'année", cellules: [saisir(a.interetsPayes, `${a.echeances.map((l) => eur(l.interets)).join(" + ")} = ${eur(a.interetsPayes)}`, `la part d'intérêts des ${nombre(a.echeances.length)} échéances`)] },
      {
        libelle: "Intérêts courus au 31 décembre",
        cellules: [saisir(x.courus.montant, `${eur(x.suivante.interets)} × ${nombre(x.courus.jours)} ÷ ${nombre(x.courus.joursDeLaPeriode)} = ${eur(x.courus.montant)}`, "les intérêts de l'échéance de janvier, au prorata des jours de N")],
      },
      {
        libelle: "Charge d'intérêts de l'exercice",
        fort: true,
        totalDe: { plus: [1, 2] },
        cellules: [saisir(a.chargeDInterets, `${eur(a.interetsPayes)} + ${eur(x.courus.montant)} = ${eur(a.chargeDInterets)}`, "les intérêts payés et les intérêts courus")],
      },
      { libelle: "Capital restant dû au 31 décembre", cellules: [saisir(a.capitalRestantDu, `${eur(x.contrat.capital)} − ${nombre(a.echeances.length)} × ${eur(x.capital)} = ${eur(a.capitalRestantDu)}`, "le capital emprunté, moins le capital remboursé en N")] },
      { libelle: "Dont à rembourser dans les douze mois", cellules: [saisir(a.partAMoinsDUnAn, `${nombre(a.partAMoinsDUnAn / x.capital)} échéances × ${eur(x.capital)} = ${eur(a.partAMoinsDUnAn)}`, "le capital des échéances de N+1")] },
      { libelle: "Dont à plus d'un an", cellules: [saisir(x.partAPlusDUnAn, `${eur(a.capitalRestantDu)} − ${eur(a.partAMoinsDUnAn)} = ${eur(x.partAPlusDUnAn)}`, "le capital restant dû, moins la part des douze mois")] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

const [deux, trois] = ECHEANCES_A_PASSER;
const coutDuMauvaisCompte = eur(a.chargeDInterets - x.correction);

export const LE_PRET_DE_L_ANNEE: Bureau = {
  code: "le-pret-de-l-annee",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["l-emprunt"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Au bureau : le prêt de l'année",
  accroche: "Début janvier, la pile du prêt de NOVA attend la clôture. Triez les pièces, passez ce qui manque, corrigez ce qui est faux, lisez l'emprunt au 31 décembre, puis répondez au président.",
  objectifs: [
    "Trier les pièces d'un emprunt : ce qui est déjà passé, ce qui manque, ce qui est faux, ce qui attend la clôture",
    "Passer les échéances d'un emprunt, la correction d'une échéance mal passée et les intérêts courus",
    "Lire l'emprunt au 31 décembre : la charge d'intérêts, le capital restant dû et sa part à moins d'un an",
    "Dire au dirigeant ce que le prêt a coûté, et ce que vaut un changement de mode de remboursement",
  ],
  libre: false,
  accueil: [
    `Le ${jour(JOUR_DU_BUREAU)}, au siège de NOVA. Les comptes de N ne sont pas encore clos, et le prêt de ${eur(x.contrat.capital)} n'est suivi qu'à moitié.`,
    "Sur votre poste, la pile du prêt : le courriel du président dessus, puis les pièces de l'année. Ouvrez-les une à une. Rien ne vous dit ce qui est déjà passé : l'extrait du compte 164 vous le montre.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "la-pile",
      type: "classement",
      titre: "Classer la pile",
      consigne: "Ouvrez chaque pièce et dites ce qu'elle demande en N : une écriture à saisir, une écriture déjà passée à corriger, une écriture de clôture, ou rien.",
      pieces: ["courriel", "extrait-164"],
      categories: [
        { code: "a-saisir", libelle: "À saisir" },
        { code: "a-corriger", libelle: "À corriger" },
        { code: "a-la-cloture", libelle: "Pour la clôture" },
        { code: "rien", libelle: "Rien à saisir" },
      ],
      elements: [
        { code: "contrat", piece: "contrat", libelle: CONTRAT.titre, categorie: "rien", pourquoi: "Le contrat fixe les conditions et le tableau : il sert à contrôler, il ne se saisit pas." },
        { code: "versement", piece: "versement", libelle: AVIS_DE_VERSEMENT.titre, categorie: "rien", pourquoi: `Le président l'a déjà passé : l'extrait du 164 porte les ${eur(x.contrat.capital)} au crédit. Le repasser doublerait la dette.` },
        {
          code: "extrait-164",
          piece: "extrait-164",
          libelle: EXTRAIT_DU_164.titre,
          categorie: "a-corriger",
          pourquoi: `L'échéance n° ${ECHEANCE_MAL_PASSEE} y est passée en entier, ${eur(x.mal.echeance)}, au débit du 164 : ses ${eur(x.mal.interets)} d'intérêts n'ont rien à faire dans la dette.`,
        },
        { code: `avis-${deux}`, piece: `avis-${deux}`, libelle: `Avis d'échéance n° ${deux}`, categorie: "a-saisir", pourquoi: `Prélevée le ${jour(echeance(deux).date)}, l'échéance n'est pas au 164 : elle se saisit.` },
        { code: `avis-${trois}`, piece: `avis-${trois}`, libelle: `Avis d'échéance n° ${trois}`, categorie: "a-saisir", pourquoi: `Prélevée le ${jour(echeance(trois).date)}, l'échéance manque encore : elle se saisit.` },
        {
          code: "releve-janvier",
          piece: "releve-janvier",
          libelle: RELEVE_DE_JANVIER.titre,
          categorie: "a-la-cloture",
          pourquoi: `L'échéance du ${jour(x.suivante.date)} appartient à N+1 et ne se saisit pas en N. Mais ses intérêts sont nés en partie en N : ils fixent les intérêts courus.`,
        },
        { code: "proposition", piece: "proposition", libelle: PROPOSITION.titre, categorie: "rien", pourquoi: "Une proposition n'est pas une opération : rien ne change en N, même si le président la signe en janvier." },
      ],
      explication: [
        "Une pièce ne se saisit pas parce qu'elle est dans la pile. L'extrait du 164 dit ce qui est déjà passé ; les avis disent ce qui manque ; le relevé de janvier n'entre en N que par ses intérêts courus.",
      ],
    },
    {
      id: "les-ecritures",
      type: "journal",
      titre: "Passer les écritures",
      consigne: "Passez au journal de N, une à une et dans l'ordre que vous voulez, la correction de l'échéance mal passée, les échéances qui manquent, puis les intérêts courus au 31 décembre.",
      pieces: ["contrat", "extrait-164", `avis-${deux}`, `avis-${trois}`, "releve-janvier"],
      ecritures: [
        {
          id: "correction",
          ecriture: CORRECTION,
          indices: ["L'échéance n° 1 est au 164 pour tout son montant : la part d'intérêts doit en sortir.", "Le 6611 se débite des intérêts de l'échéance n° 1 ; le 164 se crédite d'autant. La banque ne bouge pas."],
        },
        ...ECHEANCES_A_PASSER.map((k) => ({
          id: `echeance-${k}`,
          ecriture: ecritureDEcheance(k),
          indices: ["Deux lignes au débit : la dette qui baisse (164) et les intérêts (6611).", "Une ligne au crédit : la banque, pour le montant prélevé."],
        })),
        {
          id: "interets-courus",
          ecriture: INTERETS_COURUS,
          indices: [
            `L'échéance du ${jour(x.suivante.date)} paie les intérêts nés depuis le ${jour(x.courus.depuis!)}.`,
            `Mois de ${nombre(JOURS_DU_MOIS)} jours, jour de départ et jour d'arrivée compris : la part de N, au débit du 6611 et au crédit du 1688.`,
          ],
        },
      ],
      explication: [
        `Le 164 porte désormais ${eur(a.capitalRestantDu)}, le capital restant dû du tableau. Le 6611 porte ${eur(a.chargeDInterets)} : les intérêts des ${nombre(a.echeances.length)} échéances et ceux qui ont couru depuis le ${jour(x.courus.depuis!)}.`,
      ],
    },
    {
      id: "l-emprunt",
      type: "etat",
      titre: "L'emprunt au 31 décembre",
      consigne: "Complétez le tableau de l'emprunt au 31 décembre N : ce que la banque a prélevé, la charge d'intérêts de l'exercice, le capital restant dû et sa répartition.",
      pieces: ["contrat"],
      grille: grilleDeLEmprunt(),
      explication: [
        `La banque a prélevé ${eur(a.decaissements)} ; le compte de résultat n'en retient que ${eur(a.interetsPayes)}, et y ajoute ${eur(x.courus.montant)} d'intérêts courus. Le reste a remboursé la dette.`,
        `Au bilan, ${eur(a.capitalRestantDu)} d'emprunt, dont ${eur(a.partAMoinsDUnAn)} à rembourser dans les douze mois : l'annexe le précise.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez aux questions du courriel, chiffres à l'appui.",
      pieces: ["courriel", "proposition"],
      questions: [
        {
          id: "le-cout",
          question: "Que le prêt a-t-il coûté à NOVA cette année ?",
          options: [
            { texte: `${eur(a.chargeDInterets)} d'intérêts`, juste: true, retour: `Oui : ${eur(a.interetsPayes)} payés et ${eur(x.courus.montant)} courus. Le capital remboursé n'est pas un coût, il éteint une dette.` },
            { texte: `${eur(a.decaissements)}, tout ce que la banque a prélevé`, juste: false, retour: `Non : ${eur(a.capitalRembourse)} de ces prélèvements remboursent la dette. Seuls les intérêts coûtent.` },
            { texte: `${eur(a.interetsPayes)}, les intérêts des ${nombre(a.echeances.length)} avis`, juste: false, retour: `Presque : il manque les ${eur(x.courus.montant)} nés depuis le ${jour(x.courus.depuis!)}, payés en janvier mais dus à N.` },
            { texte: `${coutDuMauvaisCompte}, ce que portait le 6611 sans la correction`, juste: false, retour: `Non : sans la correction, le 6611 oubliait les ${eur(x.correction)} d'intérêts de l'échéance n° 1.` },
          ],
        },
        {
          id: "la-correction",
          question: `Que changeait l'échéance n° ${ECHEANCE_MAL_PASSEE} passée en entier au 164 ?`,
          options: [
            { texte: `Le résultat était trop haut de ${eur(x.correction)}, la dette trop basse d'autant`, juste: true, retour: `Oui : les ${eur(x.correction)} d'intérêts manquaient aux charges, et le 164 avait baissé de ${eur(x.mal.echeance)} au lieu de ${eur(x.capital)}.` },
            { texte: "Rien : la banque a bien été payée du bon montant, et le prélèvement figure au relevé", juste: false, retour: "Non : le prélèvement était juste, mais son partage entre la dette et la charge était faux. Le résultat et le bilan l'étaient aussi." },
            { texte: `La dette était trop haute de ${eur(x.correction)}`, juste: false, retour: `Non : le 164 a reçu trop au débit, il était donc trop bas. La correction le remonte de ${eur(x.correction)}.` },
          ],
        },
        {
          id: "la-proposition",
          question: `Passer en échéances constantes de ${eur(x.constante)}, au même taux : qu'en dites-vous au président ?`,
          options: [
            { texte: "Elle allège les premières échéances, mais garde la dette plus longtemps", juste: true, retour: "Oui : au même taux, aucun mode n'est plus cher. Les échéances constantes soulagent la trésorerie au début ; en échange, le capital baisse moins vite et porte des intérêts plus longtemps." },
            { texte: "Elle baisse le coût du prêt, puisque chaque échéance à venir sera plus légère que prévu", juste: false, retour: "Non : les premières échéances sont plus légères parce qu'elles remboursent moins de capital. Les intérêts de toute la durée montent." },
            { texte: "Elle change les comptes de N, et il faut la passer au 31 décembre", juste: false, retour: "Non : l'avenant se signe en janvier, pour les échéances à venir. Rien ne change dans les comptes de N." },
            { texte: "Elle est plus chère, car son taux réel est plus élevé", juste: false, retour: "Non : le taux est le même. Les intérêts de plus rémunèrent un capital gardé plus longtemps, pas un taux plus cher." },
          ],
        },
      ],
      explication: [
        `Votre réponse : le prêt a coûté ${eur(a.chargeDInterets)} à N ; le bilan porte ${eur(a.capitalRestantDu)} d'emprunt et ${eur(x.courus.montant)} d'intérêts courus. La proposition de la banque se juge sur la trésorerie, pas sur le coût.`,
      ],
    },
  ],
};
