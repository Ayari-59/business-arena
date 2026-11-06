import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { casDeLEntreprise } from "../cas";
import { dateDuCours, moisEtJour } from "../dates";
import { budgetDeTresorerie } from "../monde/couts-et-budgets";
import { FICHE_DE_GESTION, MOIS_DU_PREMIER_TRIMESTRE, moisDuBudget, premierTrimestreALaBanque } from "../monde/gestion-et-information";
import { DELAI_CONVENU_DE_CAMPUSTECH, DELAI_DE_CAMPUSTECH } from "../monde/nova-gestion";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LES PARTENAIRES AU 31 MARS (comptabilité générale, palier 1 ; la suite du chapitre « Les
 * flux de l'entreprise » et de son cas, « L'acompte du client »).
 *
 * Le premier trimestre de NOVA est clos. Le président veut savoir qui NOVA a payé, qui l'a payée, et ce
 * qui reste à régler au 31 mars, dans un sens et dans l'autre. L'élève ouvre la pile (le relevé du
 * trimestre, le compte de CampusTech, la facture de mars d'Électro-Composants, la paie de mars, la
 * déclaration de TVA, le tableau de l'emprunt, la quittance du loyer), range chaque flux par partenaire,
 * dit ce qu'il y a en face de chaque flux financier, dresse ce qui reste dû, puis répond.
 *
 * UN CRAN PLUS LOIN QUE LE CAS : le cas faisait le compte d'un mois ; le bureau, celui d'un trimestre,
 * pièce par pièce, et pour tous les partenaires. Le piège : ce qui reste dû ne se lit pas sur le relevé,
 * qui ne montre que ce qui a été payé.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : le premier trimestre vu de la banque
 * (premierTrimestreALaBanque, monde/gestion-et-information.ts), le mois de mars du budget de trésorerie
 * (moisDuBudget, budgetDeTresorerie), les jours du cas figé de NOVA. Aucune hypothèse nouvelle.
 */

/** Mars, dans les mois du semestre du budget (0 : janvier). */
const MARS = MOIS_DU_PREMIER_TRIMESTRE.at(-1)!;

/** Les jours de l'année avant le 1er de chaque mois du trimestre : 0, 31, 59. */
export const JOURS_AVANT_LE_MOIS = [0, 31, 59] as const;

const c = casDeLEntreprise("nova");
const f = FICHE_DE_GESTION;
const t = premierTrimestreALaBanque();
const m = moisDuBudget(f, MARS);
const b = budgetDeTresorerie(f).mois[MARS]!;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const leJour = (n: number) => moisEtJour(n).jour;
const NOMS = ["janvier", "février", "mars"] as const;

const ligneDe = (code: string) => t.lignes.find((l) => l.code === code)!;
const campustech = f.semestre.clienteles.find((k) => k.code === "campustech")!;
const FACTURES_DE_CAMPUSTECH = MOIS_DU_PREMIER_TRIMESTRE.map((k) => ({
  mois: NOMS[k],
  jour: JOURS_AVANT_LE_MOIS[k] + campustech.jourDeFacturation,
  ttc: auCentime(campustech.quantites[k]! * f.moisDeReference.prix * (1 + f.semestre.tauxDeTva)),
}));

/** Ce qui reste à régler au 31 mars, partenaire par partenaire. */
export function resteAuTrenteEtUnMars() {
  const capitalRestantDu = auCentime(f.semestre.emprunt.capitalRestantDu - t.capitalRembourse);
  const doit = { fournisseur: m.composantsTtc, urssaf: f.semestre.paie.cotisations, etat: b.tva.aPayerLeMoisSuivant, banque: capitalRestantDu, salaries: 0 };
  return {
    attend: t.duParCampusTech,
    doit,
    totalDu: auCentime(Object.values(doit).reduce((s, x) => s + x, 0)),
    capitalRestantDu,
    /** La banque au 31 mars si CampusTech avait payé au délai convenu. */
    banqueAuDelaiConvenu: premierTrimestreALaBanque(undefined, { delaiCampusTech: DELAI_CONVENU_DE_CAMPUSTECH }).fin,
  };
}

const r = resteAuTrenteEtUnMars();

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const AVRIL = `${dateDuCours(JOURS_AVANT_LE_MOIS[2] + 31 + 2)} N`;
const AU_31_MARS = `${dateDuCours(JOURS_AVANT_LE_MOIS[2] + 31)} N`;

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: AVRIL,
  objet: "Nos partenaires, fin mars",
  paragraphes: [
    "Bonjour,",
    "Le trimestre est clos, et je dois le présenter aux actionnaires. Je voudrais savoir qui nous avons payé, qui nous a payés, et ce qui reste à régler au 31 mars, dans un sens et dans l'autre.",
    `Trois questions en particulier : combien CampusTech nous doit, ce que nous devons encore à la banque, et où en serait notre compte si CampusTech payait à ${DELAI_CONVENU_DE_CAMPUSTECH} jours, comme convenu.`,
    "Merci. Le président",
  ],
};

const RELEVE: PieceDuBureau = {
  code: "releve",
  nature: "releve",
  titre: "Le compte courant, janvier à mars",
  de: "La banque de NOVA",
  a: "NOVA, SAS",
  date: AU_31_MARS,
  lignes: t.lignes.map((l) => ({ date: "janvier à mars N", libelle: l.libelle, montant: l.montant })),
  montants: [
    { libelle: "Solde au 6 janvier N, la ligne payée et le reste placé", montant: t.debut },
    { libelle: "Solde au 31 mars N", montant: t.fin, fort: true },
  ],
  mention: "Le relevé du trimestre, regroupé par nature. Débit : ce qui sort ; crédit : ce qui entre.",
};

const COMPTE_DE_CAMPUSTECH: PieceDuBureau = {
  code: "campustech",
  nature: "extrait",
  titre: "Le compte de CampusTech",
  de: "La comptabilité clients de NOVA",
  a: "Le service comptable",
  date: AU_31_MARS,
  lignes: FACTURES_DE_CAMPUSTECH.map((x) => ({ date: `${dateDuCours(x.jour)} N`, libelle: `Facture de ${x.mois}, ${qte(campustech.quantites[NOMS.indexOf(x.mois)]!)} enceintes`, montant: x.ttc })),
  montants: [{ libelle: "Reste dû au 31 mars N", montant: t.duParCampusTech, fort: true }],
  mention: `Délai convenu : ${DELAI_CONVENU_DE_CAMPUSTECH} jours après la facture. CampusTech règle d'habitude à ${DELAI_DE_CAMPUSTECH} jours ; sa facture de janvier le sera le ${dateDuCours(FACTURES_DE_CAMPUSTECH[0]!.jour + DELAI_DE_CAMPUSTECH)}.`,
};

const FACTURE_DU_FOURNISSEUR: PieceDuBureau = {
  code: "facture-composants",
  nature: "facture",
  titre: `Facture d'Électro-Composants du ${f.semestre.fournisseur.jourDeFacturation} mars`,
  de: f.semestre.fournisseur.nom,
  a: "NOVA",
  date: `${dateDuCours(JOURS_AVANT_LE_MOIS[2] + f.semestre.fournisseur.jourDeFacturation)} N`,
  objet: `${qte(m.quantite)} jeux de composants`,
  montants: [
    { libelle: "Total hors taxes", montant: m.charges.composants },
    { libelle: "TVA", montant: auCentime(m.composantsTtc - m.charges.composants) },
    { libelle: "Total taxes comprises", montant: m.composantsTtc, fort: true },
  ],
  mention: `À payer le ${dateDuCours(JOURS_AVANT_LE_MOIS[2] + 31 + leJour(c.achat.echeance))}. Les factures de janvier et de février sont payées.`,
};

const PAIE: PieceDuBureau = {
  code: "paie",
  nature: "note",
  titre: "Le journal de paie de mars",
  de: "Le service de paie de NOVA",
  a: "Le service comptable",
  date: `${dateDuCours(JOURS_AVANT_LE_MOIS[2] + c.personnel.date)} N`,
  montants: [
    { libelle: `Salaires nets, virés le ${dateDuCours(JOURS_AVANT_LE_MOIS[2] + c.personnel.date)}`, montant: f.semestre.paie.net },
    { libelle: `Cotisations, à verser à l'URSSAF le ${dateDuCours(JOURS_AVANT_LE_MOIS[2] + 31 + leJour(c.personnel.dateUrssaf))}`, montant: f.semestre.paie.cotisations, fort: true },
  ],
  mention: "Les cotisations de janvier et de février sont versées.",
};

const TVA: PieceDuBureau = {
  code: "tva",
  nature: "bordereau",
  titre: "La déclaration de TVA de mars",
  de: "Le service comptable de NOVA",
  a: "Le service des impôts des entreprises",
  date: AVRIL,
  montants: [
    { libelle: "TVA collectée sur les ventes de mars", montant: b.tva.collectee },
    { libelle: "TVA déductible sur les achats de mars", montant: b.tva.deductible },
    { libelle: "TVA à reverser en avril", montant: b.tva.aPayerLeMoisSuivant, fort: true },
  ],
  mention: "Les TVA de janvier et de février sont reversées.",
};

const EMPRUNT: PieceDuBureau = {
  code: "emprunt",
  nature: "avis",
  titre: "Le tableau de l'emprunt",
  de: "La banque de NOVA, service des prêts",
  a: "NOVA",
  date: AU_31_MARS,
  montants: [
    { libelle: "Capital emprunté", montant: f.semestre.emprunt.capitalRestantDu },
    { libelle: "Échéance du 31 mars : capital remboursé", montant: t.capitalRembourse },
    { libelle: "Échéance du 31 mars : intérêts du trimestre", montant: t.interets },
    { libelle: "Capital restant dû après l'échéance", montant: r.capitalRestantDu, fort: true },
  ],
  mention: "Prochaine échéance : fin juin. Ses intérêts courront sur le capital restant dû.",
};

const QUITTANCE: PieceDuBureau = {
  code: "quittance",
  nature: "lettre",
  titre: "La quittance du loyer de mars",
  de: "Le propriétaire du local",
  a: "NOVA",
  date: `${dateDuCours(JOURS_AVANT_LE_MOIS[2] + c.loyer.date)} N`,
  paragraphes: [`Je reconnais avoir reçu de NOVA le loyer de mars, ${eur(f.moisDeReference.chargesFixes.loyer)}, pour l'occupation du local. NOVA ne me doit rien d'autre à ce jour.`],
};

/** La pile, telle qu'elle est posée sur le bureau. */
const PILE: readonly PieceDuBureau[] = [COURRIEL, RELEVE, COMPTE_DE_CAMPUSTECH, FACTURE_DU_FOURNISSEUR, PAIE, TVA, EMPRUNT, QUITTANCE];

// ─────────────────────────────────────────────────────────────────────────────
// LES DEUX TRIS
// ─────────────────────────────────────────────────────────────────────────────

const PARTENAIRES = [
  { code: "associes", libelle: "Associés" },
  { code: "banque", libelle: "Banque" },
  { code: "fournisseurs", libelle: "Fournisseurs" },
  { code: "clients", libelle: "Clients" },
  { code: "salaries", libelle: "Salariés" },
  { code: "etat", libelle: "État et organismes sociaux" },
] as const;

const ELEMENTS_DES_PARTENAIRES = [
  { code: "particuliers", piece: "releve", libelle: "Encaissements des ventes en ligne", montant: ligneDe("particuliers").montant, categorie: "clients", pourquoi: "Les particuliers achètent en ligne et paient par carte : ce sont des clients." },
  { code: "campustech", piece: "campustech", libelle: "Factures de CampusTech, non réglées", montant: t.duParCampusTech, categorie: "clients", pourquoi: "CampusTech achète les enceintes de ses magasins : un client professionnel, qui paie plus tard." },
  { code: "fournisseur", piece: "releve", libelle: "Paiements à Électro-Composants", montant: -ligneDe("fournisseur").montant, categorie: "fournisseurs", pourquoi: "Électro-Composants vend les composants des enceintes." },
  { code: "autres", piece: "releve", libelle: "Emballage, transport et énergie payés", montant: -ligneDe("autres").montant, categorie: "fournisseurs", pourquoi: "Des prestataires vendent leurs services : ce sont des fournisseurs." },
  { code: "loyer", piece: "quittance", libelle: "Loyer du local", montant: -ligneDe("loyer").montant, categorie: "fournisseurs", pourquoi: "Le propriétaire vend l'usage de son local : c'est un fournisseur, même s'il ne livre rien." },
  { code: "salaires", piece: "releve", libelle: "Salaires nets versés", montant: -ligneDe("salaires").montant, categorie: "salaries", pourquoi: "Le salaire paie le travail des opérateurs." },
  { code: "cotisations", piece: "releve", libelle: "Cotisations versées à l'URSSAF", montant: -ligneDe("cotisations").montant, categorie: "etat", pourquoi: "L'URSSAF est un organisme social : les cotisations financent la protection sociale." },
  { code: "tva", piece: "releve", libelle: "TVA reversée", montant: -ligneDe("tva").montant, categorie: "etat", pourquoi: "NOVA collecte la TVA sur ses ventes et la reverse à l'État." },
  { code: "emprunt", piece: "emprunt", libelle: "Échéance de l'emprunt", montant: -ligneDe("emprunt").montant, categorie: "banque", pourquoi: "La banque a prêté : NOVA lui rend le capital, avec des intérêts." },
];

const DEUX_SENS = [
  { code: "les-deux", libelle: "Un flux réel, et son paiement dans le trimestre" },
  { code: "reel-seul", libelle: "Un flux réel, payé plus tard" },
  { code: "financier-seul", libelle: "Un flux financier, sans flux réel en face" },
] as const;

const ELEMENTS_DES_DEUX_SENS = [
  { code: "ventes-en-ligne", piece: "releve", libelle: "Les enceintes vendues en ligne", montant: ligneDe("particuliers").montant, categorie: "les-deux", pourquoi: "Les enceintes partent, l'argent arrive à la commande : les deux flux dans le trimestre." },
  { code: "ventes-campustech", piece: "campustech", libelle: "Les enceintes livrées à CampusTech", montant: t.duParCampusTech, categorie: "reel-seul", pourquoi: "Les enceintes sont livrées ; l'argent viendra à partir d'avril. Entre les deux, CampusTech doit." },
  { code: "composants-payes", piece: "releve", libelle: "Les composants de janvier et de février", montant: -ligneDe("fournisseur").montant, categorie: "les-deux", pourquoi: "Livrés, puis payés le 1er du mois suivant : les deux flux tombent dans le trimestre." },
  { code: "composants-de-mars", piece: "facture-composants", libelle: "Les composants de mars", montant: m.composantsTtc, categorie: "reel-seul", pourquoi: "Livrés en mars, payés le 1er avril : NOVA doit, au 31 mars." },
  { code: "loyer", piece: "quittance", libelle: "L'usage du local, de janvier à mars", montant: -ligneDe("loyer").montant, categorie: "les-deux", pourquoi: "Le local sert chaque mois, et chaque loyer se paie dans le mois." },
  { code: "travail", piece: "paie", libelle: "Le travail des opérateurs, payé par les salaires nets", montant: -ligneDe("salaires").montant, categorie: "les-deux", pourquoi: "Le travail du mois, payé à la fin du mois." },
  { code: "capital", piece: "emprunt", libelle: "Le capital de l'emprunt remboursé", montant: t.capitalRembourse, categorie: "financier-seul", pourquoi: "Rien n'est livré : NOVA rend l'argent qu'on lui a prêté." },
  { code: "tva", piece: "releve", libelle: "La TVA reversée à l'État", montant: -ligneDe("tva").montant, categorie: "financier-seul", pourquoi: "L'État ne livre rien en échange : NOVA lui reverse ce qu'elle a collecté pour lui." },
];

// ─────────────────────────────────────────────────────────────────────────────
// CE QUI RESTE À RÉGLER
// ─────────────────────────────────────────────────────────────────────────────

/** Ce qui reste à régler au 31 mars : un tableau à compléter, corrigé au serveur. */
export function grilleDuReste(): TableauACompleter {
  const vide = { valeur: null };
  const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });
  const n = 6;
  return {
    titre: "Ce qui reste à régler au 31 mars",
    colonnes: ["NOVA attend", "NOVA doit"],
    lignes: [
      { libelle: "CampusTech", cellules: [saisir(r.attend, `${FACTURES_DE_CAMPUSTECH.map((x) => eur(x.ttc)).join(" + ")} = ${eur(r.attend)}, ses trois factures`, "les factures du trimestre que CampusTech n'a pas réglées"), vide] },
      { libelle: "Électro-Composants", cellules: [vide, saisir(r.doit.fournisseur, `la facture de mars, ${eur(r.doit.fournisseur)}, payable le 1er avril`, "la facture qui n'est pas encore payée")] },
      { libelle: "L'URSSAF", cellules: [vide, saisir(r.doit.urssaf, `les cotisations de mars, ${eur(r.doit.urssaf)}`, "les cotisations qui se versent le mois suivant")] },
      { libelle: "L'État, la TVA", cellules: [vide, saisir(r.doit.etat, `la TVA de mars, ${eur(r.doit.etat)}`, "la TVA qui se reverse le mois suivant")] },
      { libelle: "La banque, l'emprunt", cellules: [vide, saisir(r.doit.banque, `${eur(f.semestre.emprunt.capitalRestantDu)} − ${eur(t.capitalRembourse)} = ${eur(r.doit.banque)} de capital`, "le capital qui reste à rendre")] },
      { libelle: "Les salariés", cellules: [vide, saisir(r.doit.salaries, "les salaires de mars sont versés : zéro", "ce qui n'est pas encore versé aux opérateurs")] },
      {
        libelle: "Total",
        fort: true,
        totalDe: { plus: Array.from({ length: n }, (_, i) => i) },
        cellules: [saisir(r.attend, `${eur(r.attend)}`, "la somme de la colonne"), saisir(r.totalDu, `${Object.values(r.doit).map(eur).join(" + ")} = ${eur(r.totalDu)}`, "la somme de la colonne")],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

export const LES_PARTENAIRES_AU_31_MARS: Bureau = {
  code: "les-partenaires-au-31-mars",
  parcours: "comptabilite-generale",
  palier: 1,
  blocs: [],
  reprend: ["les-flux-de-l-entreprise"],
  commanditaire: "Le président",
  entreprise: { code: c.code, nom: c.entreprise },
  titre: "Au bureau : les partenaires au 31 mars",
  accroche: "Le premier trimestre de NOVA est clos. Qui a-t-elle payé, qui l'a payée, et que reste-t-il à régler ? Ouvrez la pile, rangez chaque flux, puis répondez au président.",
  objectifs: [
    "Ranger chaque flux d'un trimestre selon le partenaire qu'il concerne",
    "Dire ce qu'il y a en face d'un flux financier : un flux réel, ou rien",
    "Dresser ce que les partenaires doivent à l'entreprise, et ce qu'elle leur doit",
    "Voir ce que le délai d'un client change à la banque",
  ],
  libre: false,
  accueil: [
    `Le ${AVRIL}, au siège de NOVA. Le premier trimestre est clos ; le président prépare sa présentation aux actionnaires.`,
    "Sur votre poste, la pile : le courriel du président dessus, puis le relevé du trimestre, le compte de CampusTech et les dernières pièces de mars. Le relevé dit ce qui est payé ; les autres pièces, ce qui reste.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "qui-est-en-face",
      type: "classement",
      titre: "Qui est en face ?",
      consigne: "Pour chaque flux du trimestre, ouvrez sa pièce et dites quel partenaire il concerne.",
      pieces: ["courriel"],
      categories: PARTENAIRES,
      elements: ELEMENTS_DES_PARTENAIRES,
      explication: [
        "Cinq partenaires apparaissent dans le trimestre. Les associés n'y sont pas : leur apport a été versé à la création, et ils ne reçoivent rien avant l'assemblée qui approuve les comptes.",
      ],
    },
    {
      id: "les-deux-sens",
      type: "classement",
      titre: "Les deux sens",
      consigne: "Pour chaque opération, dites ce qui circule : un flux réel et son paiement dans le trimestre, un flux réel dont le paiement viendra plus tard, ou un flux financier sans rien en face.",
      pieces: ["releve"],
      categories: DEUX_SENS,
      elements: ELEMENTS_DES_DEUX_SENS,
      explication: [
        "Quand le flux réel part avant l'argent, une dette ou une créance naît entre les deux : CampusTech doit à NOVA, NOVA doit à Électro-Composants. Le relevé ne les montre pas ; les factures, si.",
      ],
    },
    {
      id: "ce-qui-reste",
      type: "etat",
      titre: "Ce qui reste à régler",
      consigne: "Complétez le tableau au 31 mars : ce que chaque partenaire doit encore à NOVA, ce que NOVA lui doit encore. Un partenaire réglé vaut zéro.",
      pieces: ["campustech", "facture-composants", "paie", "tva", "emprunt"],
      grille: grilleDuReste(),
      explication: [
        `Au 31 mars, NOVA attend ${eur(r.attend)} de CampusTech et doit ${eur(r.totalDu)}, dont ${eur(r.capitalRestantDu)} à la banque, à rendre sur plusieurs années. Rien de cela ne se lit sur le relevé.`,
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
          id: "campustech",
          question: "Combien CampusTech nous doit-il au 31 mars ?",
          options: [
            { texte: `${eur(r.attend)}, ses trois factures`, juste: true, retour: `Oui : CampusTech paie à ${DELAI_DE_CAMPUSTECH} jours ; même sa facture de janvier ne sera réglée qu'en avril.` },
            { texte: `${eur(FACTURES_DE_CAMPUSTECH[2]!.ttc)}, la seule facture de mars, les autres étant échues`, juste: false, retour: "Non : une facture échue et impayée reste due. CampusTech doit les trois." },
            { texte: `${eur(FACTURES_DE_CAMPUSTECH[1]!.ttc + FACTURES_DE_CAMPUSTECH[2]!.ttc)}, février et mars, janvier ayant été payé à ${DELAI_CONVENU_DE_CAMPUSTECH} jours`, juste: false, retour: `Non : le délai convenu est de ${DELAI_CONVENU_DE_CAMPUSTECH} jours, mais CampusTech paie en retard. Le relevé ne montre aucun encaissement de sa part.` },
            { texte: "Rien, puisque le relevé ne porte aucune ligne de CampusTech", juste: false, retour: "Non : le relevé montre ce qui est payé. Ce que CampusTech doit se lit sur son compte, dans les factures." },
          ],
        },
        {
          id: "la-banque",
          question: "Que devons-nous encore à la banque ?",
          options: [
            { texte: `${eur(r.capitalRestantDu)} de capital`, juste: true, retour: `Oui : ${eur(f.semestre.emprunt.capitalRestantDu)} prêtés, ${eur(t.capitalRembourse)} rendus le 31 mars. Les intérêts des trimestres suivants ne sont pas encore dus : ils naîtront avec le temps.` },
            { texte: `${eur(f.semestre.emprunt.capitalRestantDu)}, le montant prêté en janvier`, juste: false, retour: `Non : l'échéance du 31 mars a rendu ${eur(t.capitalRembourse)} de capital.` },
            { texte: `${eur(r.capitalRestantDu + t.interets)}, le capital et les intérêts du trimestre suivant`, juste: false, retour: "Non : les intérêts payent le temps qui passe. Ceux du trimestre suivant ne sont pas encore dus au 31 mars." },
            { texte: "Rien ce trimestre, puisque l'échéance est payée", juste: false, retour: "Non : l'échéance règle une part du prêt. Le reste du capital est toujours dû." },
          ],
        },
        {
          id: "le-delai",
          question: `Si CampusTech payait à ${DELAI_CONVENU_DE_CAMPUSTECH} jours, comme convenu, combien aurions-nous en banque au 31 mars ?`,
          options: [
            { texte: `${eur(r.banqueAuDelaiConvenu)}`, juste: true, retour: `Oui : la facture de janvier, ${eur(FACTURES_DE_CAMPUSTECH[0]!.ttc)}, serait arrivée en mars. Le retard de CampusTech coûte ce montant à la banque, sans rien changer aux ventes.` },
            { texte: `${eur(t.fin)}, rien ne change : les ventes sont les mêmes`, juste: false, retour: "Non : les ventes sont les mêmes, mais l'argent arrive plus tôt. Le flux financier se décale, pas le flux réel." },
            { texte: `${eur(auCentime(t.fin + t.duParCampusTech))}, les trois factures encaissées`, juste: false, retour: `Non : à ${DELAI_CONVENU_DE_CAMPUSTECH} jours, seule la facture de janvier est payée avant le 31 mars ; celles de février et de mars tombent après.` },
            { texte: `${eur(auCentime(t.fin - FACTURES_DE_CAMPUSTECH[0]!.ttc))}, une facture de moins`, juste: false, retour: "Non : payer plus tôt fait entrer l'argent plus tôt. La banque monte, elle ne baisse pas." },
          ],
        },
      ],
      explication: [
        `Votre réponse : CampusTech doit ${eur(r.attend)} ; NOVA doit encore ${eur(r.capitalRestantDu)} de capital à la banque ; au délai convenu, la banque porterait ${eur(r.banqueAuDelaiConvenu)} au 31 mars.`,
      ],
    },
  ],
};
