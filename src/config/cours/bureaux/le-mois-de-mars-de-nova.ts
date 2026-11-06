import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { casDeLEntreprise } from "../cas";
import { dateDuCours, moisEtJour } from "../dates";
import { budgetDeTresorerie } from "../monde/couts-et-budgets";
import { FICHE_DE_GESTION, moisDuBudget } from "../monde/gestion-et-information";
import { DELAI_CONVENU_DE_CAMPUSTECH, DELAI_DE_CAMPUSTECH } from "../monde/nova-gestion";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LE MOIS DE MARS DE NOVA (comptabilité générale, palier 1 ; la suite du chapitre
 * « Charges et produits, encaissements et décaissements » et de son cas, « Rembourser une part du prêt
 * en février »).
 *
 * Début avril N, le président de NOVA s'étonne : mars a été le meilleur mois de ventes du trimestre, et
 * la banque a baissé. L'élève ouvre la pile de mars (les ventes, les factures, la paie, l'avis
 * d'échéance de l'emprunt, le relevé), range chaque opération deux fois, comme le chapitre (au résultat,
 * puis à la banque), dresse les deux comptes du mois, puis répond au président.
 *
 * UN CRAN PLUS LOIN QUE LE CAS : les montants ne sont pas donnés dans un tableau, ils se lisent sur les
 * pièces, hors taxes ou taxes comprises selon la pièce. Et mars porte ce que février n'avait pas :
 * l'échéance trimestrielle de l'emprunt, dont seuls les intérêts sont une charge.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : le mois de mars du budget de trésorerie du
 * contrôle de gestion (moisDuBudget et budgetDeTresorerie, sur la fiche de NOVA), les jours du mois du
 * cas figé de NOVA (cas-des-entreprises.ts). Aucune hypothèse nouvelle, sauf la place du mois dans
 * l'année (MARS_DANS_LE_SEMESTRE, JOURS_AVANT_MARS), qui ne change aucun chiffre.
 */

/** Mars, dans les mois du semestre du budget (0 : janvier). */
export const MARS_DANS_LE_SEMESTRE = 2;

/** Les jours de l'année avant le 1er mars (janvier, 31 jours ; février, 28) : le 1er mars est le 60e jour. */
export const JOURS_AVANT_MARS = 59;

/** Le dernier jour de mars : les prélèvements des prestataires et l'échéance du trimestre y tombent. */
export const FIN_DE_MARS = 31;

/**
 * Le jour où la TVA de février est prélevée (hypothèse du bureau, qui ne change aucun chiffre) : le
 * télérèglement de la déclaration mensuelle tombe dans la seconde quinzaine du mois. // À VÉRIFIER : la
 * date limite dépend de l'entreprise.
 */
export const JOUR_DE_LA_TVA = 20;

const c = casDeLEntreprise("nova");
const f = FICHE_DE_GESTION;
const m = moisDuBudget(f, MARS_DANS_LE_SEMESTRE);
const b = budgetDeTresorerie(f).mois[MARS_DANS_LE_SEMESTRE]!;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const mars = (jour: number) => `${dateDuCours(JOURS_AVANT_MARS + jour)} N`;
/** Le jour du mois d'une date du cas de janvier, reportée en mars (le 5 du mois, le 28 du mois). */
const leJour = (n: number) => moisEtJour(n).jour;

const particuliers = m.ventes.find((v) => v.code === "particuliers")!;
const campustech = m.ventes.find((v) => v.code === "campustech")!;
const d = m.decaissements;
const echeance = b.emprunt;
const cotisationsDeMars = f.semestre.paie.cotisations;
const tvaDeMars = b.tva.aPayerLeMoisSuivant;

/** Les chiffres du mois : ce que le bureau attend, calculé une fois. */
export function moisDeMars() {
  const encaissements = m.encaissements.total;
  const decaissements = d.total;
  return {
    m,
    particuliers,
    campustech,
    echeance,
    cotisationsDeMars,
    tvaDeMars,
    produits: m.produits,
    charges: m.totalDesCharges,
    resultat: m.resultat,
    encaissements,
    decaissements,
    variation: Math.round((encaissements - decaissements) * 100) / 100 + 0,
    debut: m.tresorerieDebut,
    fin: m.tresorerieFin,
    /** Ce que mars laisse à payer en avril à Électro-Composants et à l'URSSAF. */
    aPayerEnAvril: Math.round((m.composantsTtc + cotisationsDeMars) * 100) / 100 + 0,
  };
}

const x = moisDeMars();

/** Les jours de mars : la facture du fournisseur, sa date de paiement, le loyer, la paie, l'URSSAF, la facture du client. */
const JOURS = {
  fournisseur: f.semestre.fournisseur.jourDeFacturation,
  paiementDuFournisseur: leJour(c.achat.echeance),
  loyer: c.loyer.date,
  paie: c.personnel.date,
  urssaf: leJour(c.personnel.dateUrssaf),
  campustech: f.semestre.clienteles.find((k) => k.code === "campustech")!.jourDeFacturation,
  echeance: FIN_DE_MARS,
  remises: f.semestre.clienteles.find((k) => k.code === "particuliers")!.jourDeFacturation,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: `${dateDuCours(JOURS_AVANT_MARS + 31 + 2)} N`,
  objet: "Le mois de mars",
  paragraphes: [
    "Bonjour,",
    `Mars a été notre meilleur mois du trimestre : ${qte(m.quantite)} enceintes vendues. Et pourtant, le relevé le dit, la banque est passée de ${eur(x.debut)} à ${eur(x.fin)}. Je n'y comprends rien.`,
    "Pouvez-vous reprendre la pile de mars ? Je voudrais savoir ce que nous avons gagné en mars, pourquoi la banque baisse quand même, et ce que l'échéance de l'emprunt nous a coûté.",
    "Merci. Le président",
  ],
};

const REMISES: PieceDuBureau = {
  code: "remises",
  nature: "bordereau",
  titre: "Les ventes en ligne de mars, payées par carte",
  de: "La banque de NOVA, service monétique",
  a: "NOVA",
  date: mars(FIN_DE_MARS),
  paragraphes: [`${qte(particuliers.quantite)} enceintes vendues aux particuliers, payées par carte à la commande et créditées sur le compte courant dans le mois.`],
  montants: [
    { libelle: "Ventes, hors taxes", montant: particuliers.ht },
    { libelle: "TVA collectée", montant: Math.round((particuliers.ttc - particuliers.ht) * 100) / 100 },
    { libelle: "Crédité sur le compte, taxes comprises", montant: particuliers.ttc, fort: true },
  ],
};

const FACTURE_DE_CAMPUSTECH: PieceDuBureau = {
  code: "facture-campustech",
  nature: "facture",
  titre: `Facture de vente à CampusTech du ${JOURS.campustech} mars`,
  de: "NOVA",
  a: "CampusTech",
  date: mars(JOURS.campustech),
  objet: `${qte(campustech.quantite)} enceintes livrées en mars`,
  montants: [
    { libelle: `${qte(campustech.quantite)} enceintes à ${eur(f.moisDeReference.prix)}, hors taxes`, montant: campustech.ht },
    { libelle: "TVA", montant: Math.round((campustech.ttc - campustech.ht) * 100) / 100 },
    { libelle: "Total taxes comprises", montant: campustech.ttc, fort: true },
  ],
  mention: `Payable à ${DELAI_CONVENU_DE_CAMPUSTECH} jours, le ${dateDuCours(JOURS_AVANT_MARS + JOURS.campustech + DELAI_CONVENU_DE_CAMPUSTECH)}. CampusTech règle d'habitude à ${DELAI_DE_CAMPUSTECH} jours, le ${dateDuCours(JOURS_AVANT_MARS + JOURS.campustech + DELAI_DE_CAMPUSTECH)}.`,
};

const FACTURE_DU_FOURNISSEUR: PieceDuBureau = {
  code: "facture-composants",
  nature: "facture",
  titre: `Facture d'Électro-Composants du ${JOURS.fournisseur} mars`,
  de: f.semestre.fournisseur.nom,
  a: "NOVA",
  date: mars(JOURS.fournisseur),
  objet: "Les composants des enceintes de mars",
  montants: [
    { libelle: `${qte(m.quantite)} jeux de composants à ${eur(f.moisDeReference.coutVariable.composants)}, hors taxes`, montant: m.charges.composants },
    { libelle: "TVA", montant: Math.round((m.composantsTtc - m.charges.composants) * 100) / 100 },
    { libelle: "Total taxes comprises", montant: m.composantsTtc, fort: true },
  ],
  mention: `À payer le ${dateDuCours(JOURS_AVANT_MARS + 31 + JOURS.paiementDuFournisseur)}, par virement.`,
};

const PRESTATAIRES: PieceDuBureau = {
  code: "prestataires",
  nature: "facture",
  titre: "Factures de l'emballage, du transport et de l'énergie de mars",
  de: "Les prestataires de NOVA",
  a: "NOVA",
  date: mars(FIN_DE_MARS),
  objet: `Les ${f.moisDeReference.autresCoutsVariables}, pour les enceintes de mars`,
  montants: [
    { libelle: "Total hors taxes", montant: m.charges.autres },
    { libelle: "TVA", montant: Math.round((m.autresTtc - m.charges.autres) * 100) / 100 },
    { libelle: "Total taxes comprises", montant: m.autresTtc, fort: true },
  ],
  mention: "Payées dans le mois, par prélèvement.",
};

const PAIE: PieceDuBureau = {
  code: "paie",
  nature: "note",
  titre: "Le journal de paie de mars",
  de: "Le service de paie de NOVA",
  a: "Le service comptable",
  date: mars(JOURS.paie),
  objet: `${qte(c.personnel.effectif)} opérateurs`,
  montants: [
    { libelle: "Salaires bruts", montant: c.personnel.brut },
    { libelle: "Cotisations patronales", montant: c.personnel.cotisationsPatronales },
    { libelle: "Coût du personnel du mois", montant: m.charges.personnel, fort: true },
    { libelle: `Salaires nets, virés le ${mars(JOURS.paie)}`, montant: d.salairesNets },
    { libelle: `Cotisations salariales et patronales, à verser à l'URSSAF le ${dateDuCours(JOURS_AVANT_MARS + 31 + JOURS.urssaf)}`, montant: cotisationsDeMars },
  ],
};

const AVIS_D_ECHEANCE: PieceDuBureau = {
  code: "echeance",
  nature: "avis",
  titre: "Avis d'échéance de l'emprunt",
  de: "La banque de NOVA, service des prêts",
  a: "NOVA",
  date: mars(JOURS.echeance),
  objet: "Échéance trimestrielle",
  paragraphes: [`Nous prélevons ce jour sur votre compte courant l'échéance de votre emprunt de ${eur(f.semestre.emprunt.capitalRestantDu)}.`],
  montants: [
    { libelle: "Capital remboursé", montant: echeance.capital },
    { libelle: "Intérêts du trimestre", montant: echeance.interets },
    { libelle: "Montant prélevé", montant: d.emprunt, fort: true },
  ],
  mention: `Capital restant dû après l'échéance : ${eur(f.semestre.emprunt.capitalRestantDu - echeance.capital)}.`,
};

const RELEVE: PieceDuBureau = {
  code: "releve",
  nature: "releve",
  titre: "Relevé du compte courant, mars",
  de: "La banque de NOVA",
  a: "NOVA, SAS",
  date: mars(FIN_DE_MARS),
  lignes: [
    { date: mars(JOURS.paiementDuFournisseur), libelle: "Virement émis, Électro-Composants, facture de février", montant: -d.fournisseur },
    { date: mars(JOURS.loyer), libelle: "Prélèvement, loyer de mars", montant: -d.loyer },
    { date: mars(JOURS.urssaf), libelle: "Prélèvement, URSSAF, cotisations de février", montant: -d.cotisations },
    { date: mars(JOUR_DE_LA_TVA), libelle: "Prélèvement, impôts, TVA de février", montant: -d.tva },
    { date: mars(JOURS.paie), libelle: "Virements de salaires", montant: -d.salairesNets },
    { date: mars(FIN_DE_MARS), libelle: "Prélèvements, emballage, transport et énergie", montant: -d.autresCoutsVariables },
    { date: mars(JOURS.remises), libelle: "Remises de cartes du mois", montant: m.encaissements.particuliers },
    { date: mars(JOURS.echeance), libelle: "Échéance de prêt", montant: -d.emprunt },
  ],
  montants: [
    { libelle: "Solde créditeur au 28 février N", montant: x.debut },
    { libelle: "Solde créditeur au 31 mars N", montant: x.fin, fort: true },
  ],
  mention: "Débit : ce qui sort du compte ; crédit : ce qui y entre, vu de la banque.",
};

const AMORTISSEMENT: PieceDuBureau = {
  code: "amortissement",
  nature: "note",
  titre: "Le plan d'amortissement de la ligne de montage",
  de: "Le service comptable de NOVA",
  a: "Le service comptable",
  date: "janvier N",
  paragraphes: ["La ligne de montage, payée à son achat en janvier, s'use au fil des mois : son usure est comptée chaque mois, sans que rien ne soit payé."],
  montants: [{ libelle: "Usure de la ligne, chaque mois", montant: m.charges.dotation, fort: true }],
};

/** La pile, telle qu'elle est posée sur le bureau : le courriel dessus, puis les pièces du mois. */
const PILE: readonly PieceDuBureau[] = [COURRIEL, REMISES, FACTURE_DE_CAMPUSTECH, FACTURE_DU_FOURNISSEUR, PRESTATAIRES, PAIE, AVIS_D_ECHEANCE, AMORTISSEMENT, RELEVE];

// ─────────────────────────────────────────────────────────────────────────────
// LES DEUX TRIS
// ─────────────────────────────────────────────────────────────────────────────

const AU_RESULTAT = [
  { code: "charge", libelle: "Charge" },
  { code: "produit", libelle: "Produit" },
  { code: "ni", libelle: "Ni l'un ni l'autre" },
] as const;

const A_LA_BANQUE = [
  { code: "encaissement", libelle: "Encaissement" },
  { code: "decaissement", libelle: "Décaissement" },
  { code: "rien", libelle: "Rien en mars" },
] as const;

const ELEMENTS_DU_RESULTAT = [
  { code: "ventes-en-ligne", piece: "remises", libelle: "Ventes en ligne de mars, hors taxes", montant: particuliers.ht, categorie: "produit", pourquoi: "Des ventes du mois : un produit, payé ou non." },
  { code: "vente-campustech", piece: "facture-campustech", libelle: "Vente de mars à CampusTech, hors taxes", montant: campustech.ht, categorie: "produit", pourquoi: "Une vente de mars : un produit de mars, même si CampusTech ne paiera qu'en juin." },
  { code: "composants-de-mars", piece: "facture-composants", libelle: "Composants de mars, hors taxes", montant: m.charges.composants, categorie: "charge", pourquoi: "Les composants des enceintes de mars se consomment en mars : une charge du mois, payée en avril." },
  { code: "composants-de-fevrier", piece: "releve", libelle: "Composants de février, payés en mars", montant: d.fournisseur, categorie: "ni", pourquoi: "La charge a été comptée en février : la payer en mars solde une dette, rien de plus." },
  { code: "prestataires", piece: "prestataires", libelle: "Emballage, transport et énergie de mars, hors taxes", montant: m.charges.autres, categorie: "charge", pourquoi: "Des services consommés pour les enceintes du mois : une charge." },
  { code: "loyer", piece: "releve", libelle: "Loyer de mars", montant: m.charges.loyer, categorie: "charge", pourquoi: "Un mois d'occupation du local, consommé." },
  { code: "personnel", piece: "paie", libelle: "Salaires bruts et cotisations patronales de mars", montant: m.charges.personnel, categorie: "charge", pourquoi: "Le travail de mars, pour tout ce qu'il coûte : le brut et les cotisations patronales." },
  { code: "cotisations-de-fevrier", piece: "releve", libelle: "Cotisations de février, versées à l'URSSAF", montant: d.cotisations, categorie: "ni", pourquoi: "Elles étaient une charge de février : les verser solde la dette envers l'URSSAF." },
  { code: "tva-de-fevrier", piece: "releve", libelle: "TVA de février, reversée à l'État", montant: d.tva, categorie: "ni", pourquoi: "La TVA n'est ni une charge ni un produit : NOVA la collecte pour l'État, puis la lui reverse." },
  { code: "capital", piece: "echeance", libelle: "Capital de l'emprunt remboursé", montant: echeance.capital, categorie: "ni", pourquoi: "NOVA rend ce qu'on lui a prêté : sa dette baisse d'autant, elle n'est pas plus pauvre." },
  { code: "interets", piece: "echeance", libelle: "Intérêts de l'emprunt", montant: echeance.interets, categorie: "charge", pourquoi: "Les intérêts paient le service de la banque : c'est la seule part de l'échéance qui soit une charge." },
  { code: "usure", piece: "amortissement", libelle: "Usure de la ligne de montage en mars", montant: m.charges.dotation, categorie: "charge", pourquoi: "Une charge calculée : la ligne s'use, aucun argent ne sort." },
];

const ELEMENTS_DE_LA_BANQUE = [
  { code: "ventes-en-ligne", piece: "remises", libelle: "Ventes en ligne de mars, taxes comprises", montant: particuliers.ttc, categorie: "encaissement", pourquoi: "Payées par carte à la commande : l'argent est sur le compte dans le mois." },
  { code: "vente-campustech", piece: "facture-campustech", libelle: "Facture de mars de CampusTech", montant: campustech.ttc, categorie: "rien", pourquoi: `CampusTech paie à ${DELAI_DE_CAMPUSTECH} jours : rien n'entre en mars, ni pour cette facture ni pour celles de janvier et de février.` },
  { code: "composants-de-mars", piece: "facture-composants", libelle: "Facture de mars d'Électro-Composants", montant: m.composantsTtc, categorie: "rien", pourquoi: "Elle se paie le 1er avril : la charge est en mars, le décaissement en avril." },
  { code: "composants-de-fevrier", piece: "releve", libelle: "Facture de février d'Électro-Composants", montant: d.fournisseur, categorie: "decaissement", pourquoi: "Virée le 1er mars : l'argent sort en mars, pour une charge de février." },
  { code: "prestataires", piece: "prestataires", libelle: "Emballage, transport et énergie de mars", montant: m.autresTtc, categorie: "decaissement", pourquoi: "Payés dans le mois, taxes comprises." },
  { code: "loyer", piece: "releve", libelle: "Loyer de mars", montant: d.loyer, categorie: "decaissement", pourquoi: "Prélevé dans le mois : charge et décaissement tombent ensemble." },
  { code: "salaires-nets", piece: "paie", libelle: "Salaires nets de mars", montant: d.salairesNets, categorie: "decaissement", pourquoi: "Les opérateurs sont payés à la fin du mois." },
  { code: "cotisations-de-mars", piece: "paie", libelle: "Cotisations de mars", montant: cotisationsDeMars, categorie: "rien", pourquoi: "Elles se versent à l'URSSAF en avril." },
  { code: "cotisations-de-fevrier", piece: "releve", libelle: "Cotisations de février", montant: d.cotisations, categorie: "decaissement", pourquoi: "Versées à l'URSSAF en mars, pour la paie de février." },
  { code: "tva-de-fevrier", piece: "releve", libelle: "TVA de février", montant: d.tva, categorie: "decaissement", pourquoi: "Reversée à l'État en mars : de l'argent qui sort sans être une charge." },
  { code: "echeance", piece: "echeance", libelle: "Échéance de l'emprunt, capital et intérêts", montant: d.emprunt, categorie: "decaissement", pourquoi: "Prélevée le 31 mars, en entier : la banque ne distingue pas le capital des intérêts." },
  { code: "usure", piece: "amortissement", libelle: "Usure de la ligne de montage", montant: m.charges.dotation, categorie: "rien", pourquoi: "L'usure ne se paie pas : la ligne a été payée à son achat." },
];

// ─────────────────────────────────────────────────────────────────────────────
// LES DEUX COMPTES DU MOIS
// ─────────────────────────────────────────────────────────────────────────────

const k = m.charges;
const somme = (xs: readonly number[]) => xs.map(eur).join(" + ");

/** Le résultat et la banque de mars, côte à côte : un tableau à compléter, corrigé au serveur. */
export function grilleDuMois(): TableauACompleter {
  const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });
  return {
    titre: "Le mois de mars, au résultat et à la banque",
    colonnes: ["Résultat", "Banque"],
    lignes: [
      {
        libelle: "Ce qui entre : produits, encaissements",
        cellules: [
          saisir(x.produits, `${somme([particuliers.ht, campustech.ht])} = ${eur(x.produits)}`, "les ventes du mois, hors taxes, payées ou non"),
          saisir(x.encaissements, `les remises de cartes seules : ${eur(x.encaissements)}`, "l'argent arrivé sur le compte en mars, taxes comprises"),
        ],
      },
      {
        libelle: "Ce qui sort : charges, décaissements",
        cellules: [
          saisir(-x.charges, `${somme([k.composants, k.autres, k.loyer, k.personnel, k.interets, k.dotation])} = ${eur(x.charges)}, qui se retranchent`, "les charges du mois, en négatif"),
          saisir(-x.decaissements, `${somme([d.fournisseur, d.autresCoutsVariables, d.loyer, d.salairesNets, d.cotisations, d.tva, d.emprunt])} = ${eur(x.decaissements)}, qui se retranchent`, "l'argent sorti du compte en mars, en négatif"),
        ],
      },
      {
        libelle: "Résultat de mars, variation de la banque",
        fort: true,
        totalDe: { plus: [0, 1] },
        cellules: [
          saisir(x.resultat, `${eur(x.produits)} − ${eur(x.charges)} = ${eur(x.resultat)}`, "ce qui entre, moins ce qui sort"),
          saisir(x.variation, `${eur(x.encaissements)} − ${eur(x.decaissements)} = ${eur(x.variation)}`, "ce qui entre, moins ce qui sort"),
        ],
      },
    ],
  };
}

const ecart = Math.round((x.resultat - x.variation) * 100) / 100 + 0;

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

export const LE_MOIS_DE_MARS_DE_NOVA: Bureau = {
  code: "le-mois-de-mars-de-nova",
  parcours: "comptabilite-generale",
  palier: 1,
  blocs: [],
  reprend: ["charges-produits-encaissements"],
  commanditaire: "Le président",
  entreprise: { code: c.code, nom: c.entreprise },
  titre: "Au bureau : le mois de mars de NOVA",
  accroche: "Mars a été le meilleur mois de ventes du trimestre, et la banque a baissé. Ouvrez la pile de mars, rangez chaque opération au résultat et à la banque, puis répondez au président.",
  objectifs: [
    "Lire sur une pièce ce qui est une charge, un produit, ou ni l'un ni l'autre",
    "Dire ce qui entre ou sort de la banque dans le mois, et ce qui attend",
    "Calculer le résultat d'un mois et la variation de sa banque, côte à côte",
    "Séparer, dans une échéance d'emprunt, le capital des intérêts",
  ],
  libre: false,
  accueil: [
    `Le ${dateDuCours(JOURS_AVANT_MARS + 31 + 2)} N, au siège de NOVA. Le trimestre est fini ; le président attend vos chiffres de mars.`,
    "Sur votre poste, la pile de mars : le courriel du président dessus, puis les ventes, les factures, la paie, l'avis d'échéance de l'emprunt et le relevé de banque. Chaque pièce dit un montant ; à vous de voir ce qu'il touche.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "au-resultat",
      type: "classement",
      titre: "Ranger mars au résultat",
      consigne: "Pour chaque opération de mars, ouvrez sa pièce et dites si elle enrichit NOVA (un produit), l'appauvrit (une charge), ou ni l'un ni l'autre.",
      pieces: ["courriel"],
      categories: AU_RESULTAT,
      elements: ELEMENTS_DU_RESULTAT,
      explication: [
        "Le résultat de mars compte les ventes et les consommations de mars, payées ou non. Ce qui solde une dette de février, la TVA et le capital remboursé n'y entrent pas : ils ne rendent NOVA ni plus riche ni plus pauvre.",
      ],
    },
    {
      id: "a-la-banque",
      type: "classement",
      titre: "Ranger mars à la banque",
      consigne: "Les mêmes opérations, taxes comprises cette fois : font-elles entrer de l'argent sur le compte en mars, en sortir, ou rien en mars ?",
      pieces: ["releve"],
      categories: A_LA_BANQUE,
      elements: ELEMENTS_DE_LA_BANQUE,
      explication: [
        `Le relevé ne montre qu'une entrée, les remises de cartes. Il montre aussi trois paiements de février, la facture d'Électro-Composants, les cotisations et la TVA, et l'échéance entière de l'emprunt, ${eur(d.emprunt)}.`,
      ],
    },
    {
      id: "les-deux-comptes",
      type: "etat",
      titre: "Le résultat et la banque de mars",
      consigne: "Complétez le tableau : ce qui entre et ce qui sort, au résultat (hors taxes) et à la banque (taxes comprises). Ce qui sort se met en négatif.",
      pieces: ["releve"],
      grille: grilleDuMois(),
      explication: [
        `Mars fait un bénéfice de ${eur(x.resultat)}, et la banque baisse de ${eur(-x.variation)}. Les deux comptes ne mesurent pas la même chose : l'un ce que NOVA gagne, l'autre l'argent qui bouge.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez aux trois questions du courriel, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "le-resultat",
          question: "Qu'avons-nous gagné en mars ?",
          options: [
            { texte: `Un bénéfice de ${eur(x.resultat)}`, juste: true, retour: `Oui : ${eur(x.produits)} de produits, moins ${eur(x.charges)} de charges. Les ventes de CampusTech y sont, payées ou non ; le capital remboursé n'y est pas.` },
            { texte: `Une perte de ${eur(-x.variation)}, ce que la banque a perdu`, juste: false, retour: "Non : c'est la variation de la banque. Le résultat compte ce que NOVA a gagné ou consommé en mars, pas l'argent qui a bougé." },
            { texte: `Un bénéfice de ${eur(x.resultat - echeance.capital)}, une fois l'échéance comptée en entier`, juste: false, retour: `Non : seuls les intérêts, ${eur(echeance.interets)}, sont une charge. Le capital rendu, ${eur(echeance.capital)}, baisse la dette, pas la richesse de NOVA.` },
            { texte: `Un bénéfice de ${eur(x.resultat + k.dotation)}, l'usure de la ligne mise à part puisqu'elle ne se paie pas`, juste: false, retour: `Non : l'usure de la ligne, ${eur(k.dotation)}, est une charge du mois, même si rien ne se paie. La ligne a perdu de sa valeur.` },
          ],
        },
        {
          id: "la-banque",
          question: "Pourquoi la banque baisse-t-elle quand même ?",
          options: [
            { texte: "Mars paie février et le capital, et attend l'argent de CampusTech", juste: true, retour: `Oui : la facture de février d'Électro-Composants, ${eur(d.fournisseur)}, ses cotisations et sa TVA sortent en mars, avec le capital de l'emprunt ; CampusTech n'a rien versé. L'écart avec le résultat est de ${eur(ecart)}.` },
            { texte: "Le bénéfice de mars est trop faible pour payer les charges du mois", juste: false, retour: "Non : un bénéfice dit que les produits couvrent les charges. La banque baisse parce que l'argent ne bouge pas au moment où naissent les charges et les produits." },
            { texte: "La TVA collectée sur les ventes de mars est partie à l'État dans le mois", juste: false, retour: `Non : la TVA de mars, ${eur(tvaDeMars)}, se reverse en avril. C'est celle de février qui part en mars.` },
            { texte: "L'usure de la ligne a été prélevée par la banque à la fin du mois", juste: false, retour: "Non : l'usure ne se paie à personne. Elle baisse le résultat, jamais la banque." },
          ],
        },
        {
          id: "l-echeance",
          question: `Que coûte l'échéance de ${eur(d.emprunt)} au résultat de mars ?`,
          options: [
            { texte: `${eur(echeance.interets)}, les intérêts`, juste: true, retour: `Oui : les intérêts paient le prêt ; le capital, ${eur(echeance.capital)}, se rend. Toute l'échéance sort de la banque, seuls les intérêts sont une charge.` },
            { texte: `${eur(d.emprunt)}, tout ce que la banque a prélevé`, juste: false, retour: `Non : le capital remboursé n'appauvrit pas NOVA, qui doit ${eur(echeance.capital)} de moins à la banque.` },
            { texte: `${eur(echeance.capital)}, le capital remboursé`, juste: false, retour: "Non : c'est l'inverse. Le capital rendu baisse la dette ; ce sont les intérêts qui coûtent." },
            { texte: "Rien, puisque l'emprunt finance la ligne de montage", juste: false, retour: `Non : le prêt a un prix, les intérêts, ${eur(echeance.interets)} ce trimestre. Ils sont une charge de mars.` },
          ],
        },
      ],
      explication: [
        `Votre réponse : mars gagne ${eur(x.resultat)} ; la banque baisse de ${eur(-x.variation)} parce que mars paie des dettes de février et le capital de l'emprunt, et que CampusTech paie tard ; l'échéance ne coûte que ses intérêts, ${eur(echeance.interets)}.`,
        `Et avril s'annonce : la facture de mars d'Électro-Composants et les cotisations de mars, ${eur(x.aPayerEnAvril)}, sortiront de la banque, sans être des charges d'avril.`,
      ],
    },
  ],
};
