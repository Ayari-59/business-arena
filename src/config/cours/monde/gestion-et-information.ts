import { auCentime } from "./amortissement";
import { anneeAvec, anneeDuMarche, type AnneeDuMarche } from "./attractivite";
import { capaciteDeLEquipe } from "./capacite";
import { compteDuLycee, enceintesDeLAnnee, exerciceDe } from "./comptes-du-lycee";
import { budgetDeTresorerie, tableauDeBord } from "./couts-et-budgets";
import { MARCHE_A_TROIS, type CodeDEnseigne, type CodeDeStrategie, type FicheDuMarche } from "./marche-a-trois";
import { NOVA_CAPACITE, type FicheDeLaCapacite } from "./nova-capacite";
import { NOVA_GESTION, type CodeDeClientele, type FicheDeGestion } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LA GESTION DE BASE ET L'INFORMATION, SUR NOVA (lot M3 : les flux, charges et
 * encaissements, prix coût et marge, créer des richesses, les acteurs et la valeur, évaluer son
 * activité, décider avec des chiffres, se fixer des objectifs, construire un indicateur juste, des
 * données à l'information, une donnée fausse, une information à temps, ce que coûte un outil
 * numérique).
 *
 * UNE SEULE NOVA. Ce fichier n'a pas de chiffres à lui : il relit les fiches déjà écrites et les
 * compte avec les mots du palier 1.
 *   · LE SEMESTRE DU CONTRÔLE DE GESTION (nova-gestion.ts, budgetDeTresorerie et tableauDeBord de
 *     couts-et-budgets.ts) : le premier trimestre vu de la banque et du compte de résultat (les
 *     flux, charges et encaissements), le mois de janvier (prix, coût et marge), les six mois du
 *     semestre (évaluer son activité), la table des ventes mois par mois et clientèle par clientèle
 *     (des données à l'information).
 *   · LE PREMIER EXERCICE (comptes-du-lycee.ts, le même que la comptabilité au centime) : ce que
 *     chaque acteur reçoit (les acteurs et la valeur).
 *   · LE MARCHÉ À TROIS (marche-a-trois.ts et attractivite.ts) : NOVA, SoundBox et Auris sur l'année
 *     type (créer des richesses, décider avec des chiffres, construire un indicateur juste).
 *   · LA CAPACITÉ (nova-capacite.ts et capacite.ts) : les quatre trimestres réalisés de l'année N et
 *     la demande prévue de N + 1 (se fixer des objectifs, une donnée fausse, une information à
 *     temps, ce que coûte un outil numérique).
 *
 * Les seules hypothèses nouvelles sont des constantes nommées ci-dessous, chacune commentée à sa
 * place. Chaque fonction qu'un curseur ou un laboratoire lit prend ses leviers en paramètres : la
 * même fiche et les mêmes leviers donnent toujours les mêmes chiffres. La garde
 * tests/cours/gestion-et-information.test.ts refait chaque chiffre à la main.
 *
 * CONVENTIONS : hors taxes, sauf ce qui passe par la banque (toutes taxes comprises, comme dans le
 * budget de trésorerie) ; les quantités à l'enceinte ; les montants au centime.
 */

const somme = (xs: readonly number[]) => auCentime(xs.reduce((t, x) => t + x, 0));
/** Arrondi à l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Les entreprises des chapitres du lot : NOVA seule, celle dont le monde du cours tient le semestre, l'exercice, le marché et la capacité. */
export const ENTREPRISES_DE_LA_GESTION_DE_BASE: readonly string[] = [NOVA_GESTION.code];

export const FICHE_DE_GESTION: FicheDeGestion = NOVA_GESTION;
export const FICHE_DU_MARCHE: FicheDuMarche = MARCHE_A_TROIS;
export const FICHE_DE_CAPACITE: FicheDeLaCapacite = NOVA_CAPACITE;

/** La marge sur coût variable d'une enceinte : 59 − 22 − 16 = 21 €. */
export const margeDUneEnceinte = (f: FicheDeGestion = FICHE_DE_GESTION) =>
  auCentime(f.moisDeReference.prix - f.moisDeReference.coutVariable.composants - f.moisDeReference.coutVariable.autres);

/** Les charges fixes d'un mois de référence : loyer, personnel et usure de la ligne (31 183 €). */
export const chargesFixesDuMois = (f: FicheDeGestion = FICHE_DE_GESTION) =>
  somme(Object.values(f.moisDeReference.chargesFixes));

// ═════════════════════════════════════════════════════════════════════════════
// 1. LE PREMIER TRIMESTRE : LA BANQUE ET LE RÉSULTAT (les flux ; charges et encaissements)
// ═════════════════════════════════════════════════════════════════════════════

/** Les mois du premier trimestre dans le semestre (janvier, février, mars). */
export const MOIS_DU_PREMIER_TRIMESTRE = [0, 1, 2] as const;

/** Les délais de paiement que le laboratoire des flux propose à CampusTech, en jours. */
export const DELAIS_ESSAYES = [0, 30, 60, 80] as const;

/** Ce qu'un levier change au premier trimestre. */
export interface LeviersDuPremierTrimestre {
  /** Des enceintes vendues en plus aux particuliers en mars, payées par carte à la commande. */
  ventesEnPlusEnMars: number;
  /** Le jour où CampusTech paie, après sa facture (80 dans la fiche : 20 jours de retard sur les 60 convenus). */
  delaiCampusTech: number;
  /** Un remboursement anticipé de l'emprunt, le 31 mars (capital seulement, sans pénalité). */
  remboursementAnticipe: number;
}

/** La fiche de gestion, les ventes de mars aux particuliers augmentées. */
function ficheAvecLesVentesDeMars(f: FicheDeGestion, enPlus: number): FicheDeGestion {
  if (!enPlus) return f;
  return {
    ...f,
    semestre: {
      ...f.semestre,
      clienteles: f.semestre.clienteles.map((c) => (c.code === "particuliers" ? { ...c, quantites: c.quantites.map((q, k) => (k === 2 ? q + enPlus : q)) } : c)),
    },
  };
}

/** Une ligne de la banque : ce qui entre (positif) ou sort (négatif) sur le trimestre, toutes taxes comprises. */
export interface LigneDeLaBanque {
  code: string;
  libelle: string;
  montant: number;
}

/**
 * LE PREMIER TRIMESTRE VU DE LA BANQUE : les trois premiers mois du budget de trésorerie de NOVA
 * (couts-et-budgets.ts), rangés par partenaire. Le compte courant part de 25 000 €, ce qui y reste
 * le 6 janvier, la ligne de montage payée et le reste placé sur le compte à terme. Le remboursement
 * anticipé (un levier, nul dans la fiche) sort le 31 mars.
 */
export function premierTrimestreALaBanque(f: FicheDeGestion = FICHE_DE_GESTION, leviers: Partial<LeviersDuPremierTrimestre> = {}) {
  const fiche = ficheAvecLesVentesDeMars(f, leviers.ventesEnPlusEnMars ?? 0);
  const delais = leviers.delaiCampusTech !== undefined ? { ...Object.fromEntries(fiche.semestre.clienteles.map((c) => [c.code, c.delai])), campustech: leviers.delaiCampusTech } : undefined;
  const budget = budgetDeTresorerie(fiche, delais ? { delais: delais as Record<CodeDeClientele, number> } : {});
  const mois = MOIS_DU_PREMIER_TRIMESTRE.map((k) => budget.mois[k]!);
  const total = (f: (m: (typeof mois)[number]) => number) => somme(mois.map(f));
  const remboursementAnticipe = leviers.remboursementAnticipe ?? 0;
  const campustech = fiche.semestre.clienteles.find((c) => c.code === "campustech")!;
  const facturesDeCampusTech = somme(MOIS_DU_PREMIER_TRIMESTRE.map((k) => auCentime(campustech.quantites[k]! * fiche.moisDeReference.prix * (1 + fiche.semestre.tauxDeTva))));
  const lignes: LigneDeLaBanque[] = [
    { code: "particuliers", libelle: "Encaissements des particuliers (cartes bancaires)", montant: total((m) => m.encaissements.particuliers) },
    { code: "campustech", libelle: "Encaissements de CampusTech", montant: total((m) => m.encaissements.campustech) },
    { code: "fournisseur", libelle: "Paiements à Électro-Composants (composants)", montant: -total((m) => m.decaissements.fournisseur) },
    { code: "autres", libelle: "Emballage, transport et énergie payés", montant: -total((m) => m.decaissements.autresCoutsVariables) },
    { code: "loyer", libelle: "Loyer du local", montant: -total((m) => m.decaissements.loyer) },
    { code: "salaires", libelle: "Salaires nets versés", montant: -total((m) => m.decaissements.salairesNets) },
    { code: "cotisations", libelle: "Cotisations sociales versées à l'URSSAF", montant: -total((m) => m.decaissements.cotisations) },
    { code: "tva", libelle: "TVA reversée à l'État", montant: -total((m) => m.decaissements.tva) },
    { code: "emprunt", libelle: "Échéance de l'emprunt (capital et intérêts)", montant: -total((m) => m.decaissements.emprunt) },
    { code: "anticipe", libelle: "Remboursement anticipé de l'emprunt", montant: -remboursementAnticipe },
  ].filter((l) => l.montant !== 0);
  const entrees = somme(lignes.filter((l) => l.montant > 0).map((l) => l.montant));
  const sorties = somme(lignes.filter((l) => l.montant < 0).map((l) => -l.montant));
  const debut = mois[0]!.tresorerieDebut;
  const fin = auCentime(mois[2]!.tresorerieFin - remboursementAnticipe);
  return {
    lignes,
    debut,
    fin,
    entrees,
    sorties,
    variation: auCentime(entrees - sorties),
    /** Les ventes du trimestre, toutes taxes comprises : ce que les clients doivent payer. */
    ventesTtc: total((m) => m.ventesTtc),
    /** Ce que CampusTech doit encore au 31 mars, toutes taxes comprises. */
    duParCampusTech: auCentime(facturesDeCampusTech - total((m) => m.encaissements.campustech)),
    facturesDeCampusTech,
    capitalRembourse: total((m) => m.emprunt.capital),
    interets: total((m) => m.emprunt.interets),
    /** La trésorerie de fin de mars sous laquelle le voyant du tableau de bord s'allume (10 000 €). */
    seuilDAlerte: f.seuilsDAlerte.tresorerie,
  };
}

export type BanqueDuTrimestre = ReturnType<typeof premierTrimestreALaBanque>;

/** Les enceintes vendues en plus en mars aux particuliers qu'il faut pour que la banque ne baisse pas sur le trimestre. */
export function ventesDeMarsPourLaBanque(f: FicheDeGestion = FICHE_DE_GESTION) {
  for (let q = 0; q <= 1_000; q++) if (premierTrimestreALaBanque(f, { ventesEnPlusEnMars: q }).variation >= 0) return q;
  throw new Error("Aucune vente de mars ne remet la banque à flot");
}

/** Le délai le plus long, parmi ceux essayés, qui laisse la banque au moins à son niveau du 1er janvier. */
export const delaiQuiGardeLaBanque = (f: FicheDeGestion = FICHE_DE_GESTION) =>
  Math.max(...DELAIS_ESSAYES.filter((d) => premierTrimestreALaBanque(f, { delaiCampusTech: d }).variation >= 0));

/** Le pas du remboursement anticipé, en euros. */
export const PAS_DU_REMBOURSEMENT = 1_000;

/** Le plus gros remboursement anticipé, au pas de 1 000 €, qui laisse au 31 mars au moins le seuil d'alerte de la trésorerie. */
export function remboursementPossible(f: FicheDeGestion = FICHE_DE_GESTION) {
  const b = premierTrimestreALaBanque(f);
  return Math.floor((b.fin - b.seuilDAlerte) / PAS_DU_REMBOURSEMENT + 1e-9) * PAS_DU_REMBOURSEMENT;
}

/**
 * LE COMPTE DE RÉSULTAT DU PREMIER TRIMESTRE, celui que le contrôle de gestion tient (les mêmes
 * enceintes, le même prix, les mêmes coûts que le budget de trésorerie) : les ventes hors taxes, les
 * composants et les autres coûts variables des enceintes vendues, trois mois de loyer, de personnel
 * (salaires bruts et cotisations patronales) et d'usure de la ligne (833 € par mois en gestion), et
 * les intérêts de l'échéance de mars. Un résultat avant impôt : l'impôt se calcule sur l'année.
 */
export function premierTrimestreAuResultat(f: FicheDeGestion = FICHE_DE_GESTION, leviers: Partial<Pick<LeviersDuPremierTrimestre, "ventesEnPlusEnMars">> = {}) {
  const fiche = ficheAvecLesVentesDeMars(f, leviers.ventesEnPlusEnMars ?? 0);
  const budget = budgetDeTresorerie(fiche);
  const mois = MOIS_DU_PREMIER_TRIMESTRE.map((k) => budget.mois[k]!);
  const m = fiche.moisDeReference;
  const quantite = mois.reduce((t, x) => t + x.quantite, 0);
  const charges = [
    { code: "composants", libelle: "Composants des enceintes vendues", montant: auCentime(quantite * m.coutVariable.composants) },
    { code: "autres", libelle: `Autres coûts variables (${m.autresCoutsVariables})`, montant: auCentime(quantite * m.coutVariable.autres) },
    { code: "loyer", libelle: "Loyer du local", montant: auCentime(3 * m.chargesFixes.loyer) },
    { code: "personnel", libelle: "Salaires et cotisations patronales", montant: auCentime(3 * m.chargesFixes.personnel) },
    { code: "dotation", libelle: "Dotation aux amortissements (usure de la ligne)", montant: auCentime(3 * m.chargesFixes.amortissement) },
    { code: "interets", libelle: "Intérêts de l'emprunt", montant: somme(mois.map((x) => x.emprunt.interets)) },
  ];
  const produits = somme(mois.map((x) => x.ventesHt));
  const totalCharges = somme(charges.map((c) => c.montant));
  return {
    quantite,
    produits,
    charges,
    totalCharges,
    resultat: auCentime(produits - totalCharges),
    dotation: charges.find((c) => c.code === "dotation")!.montant,
    interets: charges.find((c) => c.code === "interets")!.montant,
    /** Les charges qui ne bougent pas avec les ventes : loyer, personnel, usure et intérêts. */
    chargesFixes: somme(charges.filter((c) => c.code !== "composants" && c.code !== "autres").map((c) => c.montant)),
  };
}

/**
 * UN MOIS DU SEMESTRE, VU DU RÉSULTAT ET DE LA BANQUE (le cas « Rembourser une part du prêt en
 * février ») : les ventes de chaque clientèle, hors taxes et taxes comprises, les composants et les
 * autres coûts des enceintes du mois, le loyer, le personnel, l'usure de la ligne (833 € en gestion)
 * et les intérêts s'il y a une échéance ; et ce que le budget de trésorerie fait entrer et sortir ce
 * mois-là. `k` compte les mois depuis janvier (1 : février).
 */
export function moisDuBudget(f: FicheDeGestion = FICHE_DE_GESTION, k: number) {
  const budget = budgetDeTresorerie(f);
  const b = budget.mois[k]!;
  const m = f.moisDeReference;
  const tva = f.semestre.tauxDeTva;
  const ventes = f.semestre.clienteles.map((c) => {
    const ht = auCentime(c.quantites[k]! * m.prix);
    return { code: c.code, nom: c.nom, quantite: c.quantites[k]!, ht, ttc: auCentime(ht * (1 + tva)) };
  });
  const composants = auCentime(b.quantite * m.coutVariable.composants);
  const autres = auCentime(b.quantite * m.coutVariable.autres);
  const charges = { composants, autres, loyer: m.chargesFixes.loyer, personnel: m.chargesFixes.personnel, dotation: m.chargesFixes.amortissement, interets: b.emprunt.interets };
  const produits = b.ventesHt;
  const totalDesCharges = somme(Object.values(charges));
  return {
    nom: b.nom,
    quantite: b.quantite,
    ventes,
    produits,
    charges,
    totalDesCharges,
    resultat: auCentime(produits - totalDesCharges),
    composantsTtc: auCentime(composants * (1 + tva)),
    autresTtc: auCentime(autres * (1 + tva)),
    encaissements: b.encaissements,
    decaissements: b.decaissements,
    tresorerieDebut: b.tresorerieDebut,
    tresorerieFin: b.tresorerieFin,
  };
}

/** Les enceintes à vendre sur le trimestre pour que le résultat ne soit pas négatif : charges fixes ÷ marge d'une enceinte. */
export const seuilDuPremierTrimestre = (f: FicheDeGestion = FICHE_DE_GESTION) => plafond(premierTrimestreAuResultat(f).chargesFixes / margeDUneEnceinte(f));

// ═════════════════════════════════════════════════════════════════════════════
// 2. PRIX, COÛT ET MARGE : LE MOIS DE JANVIER
// ═════════════════════════════════════════════════════════════════════════════

/** LA BAISSE DE PRIX ÉTUDIÉE : 10 %, l'écart de prix que le contrôle de gestion essaie (nova-gestion.ts). */
export const baisseDePrixEtudiee = (f: FicheDeGestion = FICHE_DE_GESTION) => f.decision.ecartDePrix;

/** Le pas du laboratoire des quantités, en enceintes. */
export const PAS_DES_QUANTITES = 10;

/** Le prix, le coût et la marge d'une enceinte, et ceux du mois de janvier ; le prix et la quantité peuvent changer. */
export function margeDuMois(f: FicheDeGestion = FICHE_DE_GESTION, leviers: Partial<{ prix: number; quantite: number }> = {}) {
  const m = f.moisDeReference;
  const prix = leviers.prix ?? m.prix;
  const quantite = leviers.quantite ?? m.quantite;
  const cout = auCentime(m.coutVariable.composants + m.coutVariable.autres);
  const marge = auCentime(prix - cout);
  const margeTotale = auCentime(marge * quantite);
  const chargesFixes = chargesFixesDuMois(f);
  return {
    mois: m.nom,
    prix,
    composants: m.coutVariable.composants,
    autres: m.coutVariable.autres,
    autresCoutsVariables: m.autresCoutsVariables,
    cout,
    marge,
    tauxDeMarge: auDixieme((marge / cout) * 100),
    tauxDeMarque: auDixieme((marge / prix) * 100),
    quantite,
    margeDuMois: margeTotale,
    chargesFixes,
    resultat: auCentime(margeTotale - chargesFixes),
    tauxDeTva: f.semestre.tauxDeTva,
    prixTtc: auCentime(prix * (1 + f.semestre.tauxDeTva)),
  };
}

/** Le prix plancher, à l'euro : le plus bas qui couvre les charges fixes du mois à quantités égales. */
export function prixPlancherDuMois(f: FicheDeGestion = FICHE_DE_GESTION) {
  const k = margeDuMois(f);
  return plafond(k.cout + k.chargesFixes / k.quantite);
}

/** Le prix baissé, et les enceintes à vendre, au pas du laboratoire, pour garder la marge du mois de janvier. */
export function quantitePourGarderLaMarge(f: FicheDeGestion = FICHE_DE_GESTION) {
  const avant = margeDuMois(f);
  const prix = auCentime(avant.prix * (1 - baisseDePrixEtudiee(f)));
  const juste = plafond(avant.margeDuMois / margeDuMois(f, { prix }).marge);
  return { prix, juste, auPas: plafond(juste / PAS_DES_QUANTITES) * PAS_DES_QUANTITES };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA RICHESSE CRÉÉE PAR LE MARCHÉ À TROIS (créer des richesses)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * CE QUE LES CHARGES FIXES PAIENT, enseigne par enseigne, sur l'année type. Pour NOVA, les charges de
 * janvier de nova-gestion.ts douze fois (le loyer, 19 700 €, le personnel, 10 650 €, et l'usure de
 * la ligne, 833 €, par mois). HYPOTHÈSES DU COURS pour les deux concurrents, dont la fiche ne donne
 * que le total : SoundBox (640 000 €, une grande usine) paie 320 000 € de personnel, 200 000 € de
 * loyer et de frais, et use 120 000 € d'équipement ; Auris (135 000 €, un petit atelier) paie
 * 90 000 € de personnel, 35 000 € de loyer et de frais, et use 10 000 € d'équipement.
 */
export const CHARGES_FIXES_DES_ENSEIGNES: Readonly<Record<CodeDEnseigne, { personnel: number; loyerEtFrais: number; amortissement: number }>> = {
  nova: {
    personnel: 12 * NOVA_GESTION.moisDeReference.chargesFixes.personnel,
    loyerEtFrais: 12 * NOVA_GESTION.moisDeReference.chargesFixes.loyer,
    amortissement: 12 * NOVA_GESTION.moisDeReference.chargesFixes.amortissement,
  },
  soundbox: { personnel: 320_000, loyerEtFrais: 200_000, amortissement: 120_000 },
  auris: { personnel: 90_000, loyerEtFrais: 35_000, amortissement: 10_000 },
};

/**
 * Le taux de l'impôt sur les bénéfices du marché à trois : 25 %, celui du scénario nova de l'arène
 * (nova-capacite.ts), sur le résultat de l'année type. Le marché à trois ne compte pas d'emprunt :
 * aucune enseigne n'y paie d'intérêts.
 */
export const tauxDeLImpotDuMarche = (f: FicheDeLaCapacite = FICHE_DE_CAPACITE) => f.investissement.tauxDImpot;

/** Les comptes d'une enseigne, rangés comme l'économiste les lit. */
export interface ComptesDUneEnseigne {
  code: CodeDEnseigne;
  nom: string;
  ventes: number;
  production: number;
  achats: number;
  budgets: number;
  loyerEtFrais: number;
  consommations: number;
  valeurAjoutee: number;
  salaires: number;
  impot: number;
  /** Ce que l'enseigne garde : son bénéfice et l'usure de son équipement. */
  profit: number;
  benefice: number;
  amortissement: number;
}

/** Les comptes d'une enseigne d'une année du marché à trois. */
export function comptesDUneEnseigne(e: AnneeDuMarche["enseignes"][number]): ComptesDUneEnseigne {
  const fixes = CHARGES_FIXES_DES_ENSEIGNES[e.code];
  const consommations = auCentime(e.coutsVariables + e.budgets + fixes.loyerEtFrais);
  const valeurAjoutee = auCentime(e.chiffreDAffaires - consommations);
  const impot = auCentime(Math.max(0, e.resultat) * tauxDeLImpotDuMarche());
  const benefice = auCentime(e.resultat - impot);
  return {
    code: e.code,
    nom: e.nom,
    ventes: e.ventes,
    production: e.chiffreDAffaires,
    achats: e.coutsVariables,
    budgets: e.budgets,
    loyerEtFrais: fixes.loyerEtFrais,
    consommations,
    valeurAjoutee,
    salaires: fixes.personnel,
    impot,
    profit: auCentime(valeurAjoutee - fixes.personnel - impot),
    benefice,
    amortissement: fixes.amortissement,
  };
}

/** Les stratégies que le laboratoire de la richesse propose à NOVA. */
export const STRATEGIES_DE_LA_RICHESSE: readonly CodeDeStrategie[] = ["milieu", "couts", "differenciation"];

/** La richesse créée par le marché à trois, NOVA d'abord, pour une stratégie de NOVA. */
export function richesseDuMarche(f: FicheDuMarche = FICHE_DU_MARCHE, strategie: CodeDeStrategie = "milieu", marcheParTrimestre?: number) {
  const marche = marcheParTrimestre !== undefined ? { marcheParTrimestre } : {};
  const annee = strategie === "milieu" ? anneeDuMarche(f, marche) : anneeAvec(f, strategie, marche);
  const enseignes = annee.enseignes.map(comptesDUneEnseigne);
  const total = (k: (e: ComptesDUneEnseigne) => number) => somme(enseignes.map(k));
  const valeurAjoutee = total((e) => e.valeurAjoutee);
  const salaires = total((e) => e.salaires);
  return {
    strategie,
    enseignes,
    nova: enseignes[0]!,
    concurrents: [enseignes[1]!, enseignes[2]!] as const,
    production: total((e) => e.production),
    consommations: total((e) => e.consommations),
    valeurAjoutee,
    salaires,
    partDesSalaires: auDixieme((salaires / valeurAjoutee) * 100),
    plusGrandeValeur: enseignes.reduce((g, x) => (x.valeurAjoutee > g.valeurAjoutee ? x : g)),
    plusGrosChiffre: enseignes.reduce((g, x) => (x.production > g.production ? x : g)),
    enPerte: enseignes.filter((e) => e.benefice < 0),
  };
}

/**
 * LA CROISSANCE DU MARCHÉ L'ANNÉE SUIVANTE (hypothèse du cas « Le marché a-t-il grandi ? ») : 10 %
 * d'enceintes vendues en plus chaque trimestre, à l'enceinte près, les offres des trois enseignes
 * inchangées. Chacune garde sa part ; la capacité ne borne personne.
 */
export const CROISSANCE_DU_MARCHE = 0.1;

/** Le marché d'un trimestre de l'année suivante, à l'enceinte près. */
export const MARCHE_DE_L_ANNEE_SUIVANTE = Math.round(MARCHE_A_TROIS.marche.parTrimestre * (1 + CROISSANCE_DU_MARCHE));

/** La valeur ajoutée de NOVA pour des ventes données, à son prix et ses budgets d'aujourd'hui. */
export function valeurAjouteeDeNova(f: FicheDuMarche = FICHE_DU_MARCHE, ventes: number) {
  const n = anneeDuMarche(f).nova;
  const fixes = CHARGES_FIXES_DES_ENSEIGNES.nova;
  return auCentime(ventes * n.margeUnitaire - n.budgets - fixes.loyerEtFrais);
}

/** Les enceintes à vendre dans l'année pour que la valeur ajoutée de NOVA paie ses salaires. */
export const ventesQuiPaientLesSalaires = (f: FicheDuMarche = FICHE_DU_MARCHE) => {
  const n = anneeDuMarche(f).nova;
  const fixes = CHARGES_FIXES_DES_ENSEIGNES.nova;
  return plafond((fixes.personnel + n.budgets + fixes.loyerEtFrais) / n.margeUnitaire);
};

/** La stratégie, parmi celles du laboratoire, où NOVA crée le plus de valeur ajoutée. */
export const strategieQuiCreeLePlus = (f: FicheDuMarche = FICHE_DU_MARCHE) =>
  STRATEGIES_DE_LA_RICHESSE.reduce((g, s) => (richesseDuMarche(f, s).nova.valeurAjoutee > richesseDuMarche(f, g).nova.valeurAjoutee ? s : g));

// ═════════════════════════════════════════════════════════════════════════════
// 4. LES ACTEURS ET LA VALEUR : LE PREMIER EXERCICE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LA HAUSSE DEMANDÉE PAR LES SALARIÉS (hypothèse du cours) : 5 % de plus sur tous les salaires et
 * leurs cotisations, toute l'année. C'est l'ordre de grandeur d'une négociation annuelle.
 */
export const HAUSSE_DEMANDEE = 0.05;

/**
 * LE RÉSULTAT QUE LES ASSOCIÉS VEULENT GARDER (hypothèse du cours) : 70 000 € de résultat net, à
 * peu près ce que l'exercice a laissé (79 225,96 €) moins un dixième, pour la négociation.
 */
export const RESULTAT_VOULU_PAR_LES_ASSOCIES = 70_000;

/** Le pas du prix dans le laboratoire des acteurs, en euros. */
export const PAS_DU_PRIX_DES_ACTEURS = 0.1;

/**
 * Ce que chaque acteur reçoit dans le premier exercice, une hausse des salaires et un prix posés. Les
 * fournisseurs et prestataires reçoivent les consommations (composants, emballage, transport et
 * énergie, loyer, assurance) ; les salariés, les salaires et leurs cotisations ; les prêteurs, les
 * intérêts ; l'État, l'impôt sur les bénéfices ; les associés, le résultat net, que NOVA garde
 * (aucun dividende n'est versé). Un prix ou une quantité qui change fait varier les ventes et les
 * coûts variables, et rien d'autre (l'hypothèse de comptes-du-lycee.ts).
 */
export function partsDesActeurs(hausseDesSalaires = 0, prix?: number, quantite?: number) {
  const f = exerciceDe("nova");
  const varie = prix !== undefined || quantite !== undefined;
  const k = compteDuLycee(f, { hausseDesSalaires, ...(varie ? { prix: prix ?? f.prixDeLEnceinte, quantite: quantite ?? enceintesDeLAnnee(f) } : {}) });
  return {
    prix: k.prix,
    enceintes: k.quantite,
    ventes: k.ventes,
    fournisseurs: k.consommations,
    salaries: k.personnel,
    preteurs: k.ligne("interets"),
    etat: k.impot,
    associes: k.resultatNet,
    resultatAvantImpot: k.resultatAvantImpot,
  };
}

export type QuiPaie = "associes" | "etat" | "clients";

/** La hausse demandée, ce qu'elle coûte et qui la paie ; la plus forte hausse que les associés acceptent. */
export function hausseDesSalaires(hausse = HAUSSE_DEMANDEE) {
  const avant = partsDesActeurs();
  const apres = partsDesActeurs(hausse);
  const ecartDeSalaires = auCentime(apres.salaries - avant.salaries);
  const ecartDImpot = auCentime(apres.etat - avant.etat);
  const ecartDeResultat = auCentime(apres.associes - avant.associes);
  return {
    avant,
    apres,
    ecartDeSalaires,
    ecartDImpot,
    ecartDeResultat,
    partDesAssocies: auDixieme((-ecartDeResultat / ecartDeSalaires) * 100),
    partDeLEtat: auDixieme((-ecartDImpot / ecartDeSalaires) * 100),
    quiPaie: (-ecartDeResultat >= -ecartDImpot ? "associes" : "etat") as QuiPaie,
  };
}

/** La plus forte hausse des salaires, en pour cent entier, qui laisse aux associés le résultat qu'ils veulent garder. */
export function hausseQueLesAssociesAcceptent() {
  let h = 0;
  while (partsDesActeurs((h + 1) / 100).associes >= RESULTAT_VOULU_PAR_LES_ASSOCIES) h++;
  return h;
}

/** Le plus petit prix, au pas de 0,10 €, qui rend aux associés, avec la hausse demandée, le résultat net de l'exercice. */
export function prixQuiPaieLaHausse(hausse = HAUSSE_DEMANDEE) {
  const avant = partsDesActeurs().associes;
  const base = partsDesActeurs().prix;
  for (let k = 0; k <= 100; k++) {
    const prix = auCentime(base + k * PAS_DU_PRIX_DES_ACTEURS);
    if (partsDesActeurs(hausse, prix).associes >= avant) return prix;
  }
  throw new Error("Aucun prix ne paie la hausse");
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. ÉVALUER SON ACTIVITÉ : LES SIX MOIS DU SEMESTRE
// ═════════════════════════════════════════════════════════════════════════════

/** Le prix moyen d'une enceinte se lit comme stable quand il bouge de moins de 1 % (hypothèse du cours, la règle de lecture). */
export const PRIX_STABLE = 0.01;

/** Le pas du prix dans le laboratoire du semestre, en euros. */
export const PAS_DU_PRIX_DU_SEMESTRE = 0.5;

/** Les quatre indicateurs de chaque mois du semestre : chiffre d'affaires, ventes, résultat, trésorerie de fin de mois. */
export function semestreDeNova(f: FicheDeGestion = FICHE_DE_GESTION, prix?: number) {
  const t = tableauDeBord(f, prix !== undefined ? { prix } : {});
  return t.mois.map((m) => ({ nom: m.nom, chiffreDAffaires: m.chiffreDAffaires, ventes: m.quantite, resultat: m.resultat, tresorerie: m.tresorerie, marge: m.marge }));
}

/** Les enceintes à vendre en plus dans le mois le plus faible pour qu'il ne soit plus en perte. */
export function moisLePlusFaible(f: FicheDeGestion = FICHE_DE_GESTION) {
  const s = semestreDeNova(f);
  const pire = s.reduce((m, x) => (x.resultat < m.resultat ? x : m));
  const enPlus = plafond(-pire.resultat / margeDUneEnceinte(f));
  return { ...pire, enPlus };
}

/** Le plus petit prix, au pas de 0,50 €, qui met chaque mois du semestre en bénéfice, à ventes égales. */
export function prixQuiMetChaqueMoisEnBenefice(f: FicheDeGestion = FICHE_DE_GESTION) {
  for (let k = 0; k <= 40; k++) {
    const prix = auCentime(f.moisDeReference.prix + k * PAS_DU_PRIX_DU_SEMESTRE);
    if (semestreDeNova(f, prix).every((m) => m.resultat >= 0)) return prix;
  }
  throw new Error("Aucun prix ne met chaque mois en bénéfice");
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. DÉCIDER AVEC DES CHIFFRES : LA PUBLICITÉ, SUR LE MARCHÉ À TROIS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LA PUBLICITÉ ENVISAGÉE (hypothèse du cours) : 4 000 € par trimestre, 16 000 € sur l'année, le
 * premier point de la courbe de la communication (marche-a-trois.ts). NOVA n'en fait pas
 * aujourd'hui.
 */
export const PUBLICITE_ENVISAGEE = 4_000;

/** Les budgets de publicité par trimestre que le laboratoire essaie : de 0 à 16 000 €, par 1 000 €. */
export const BUDGETS_ESSAYES = { min: 0, max: 16_000, pas: 1_000 } as const;

/** L'année de NOVA avec un budget de publicité par trimestre. */
export function anneeAvecLaPublicite(f: FicheDuMarche = FICHE_DU_MARCHE, budgetParTrimestre: number) {
  const n = anneeDuMarche(f, { nova: { budgetCommunication: budgetParTrimestre } }).nova;
  return { budgetParTrimestre, publicite: n.budgetCommunication, ventes: n.ventes, chiffreDAffaires: n.chiffreDAffaires, marge: n.marge, resultat: n.resultat, margeUnitaire: n.margeUnitaire };
}

export type VerdictDeLaPublicite = "garder" | "s-en-passer";

/** Les deux choix, ce que la prévision demande, et ce que l'année jouée constate. */
export function deuxChoix(f: FicheDuMarche = FICHE_DU_MARCHE) {
  const sans = anneeAvecLaPublicite(f, 0);
  const avec = anneeAvecLaPublicite(f, PUBLICITE_ENVISAGEE);
  const budget = avec.publicite;
  const ventesAGagner = plafond(budget / sans.margeUnitaire);
  const ventesGagnees = avec.ventes - sans.ventes;
  const ecartDeResultat = auCentime(avec.resultat - sans.resultat);
  return {
    sans,
    avec,
    budget,
    margeUnitaire: sans.margeUnitaire,
    ventesAGagner,
    ventesGagnees,
    margeGagnee: auCentime(avec.marge - sans.marge),
    ecartDeResultat,
    verdict: (ecartDeResultat > 0 ? "garder" : "s-en-passer") as VerdictDeLaPublicite,
  };
}

/** Le budget par trimestre, parmi ceux essayés, qui donne le meilleur résultat de l'année. */
export function meilleurBudgetDePublicite(f: FicheDuMarche = FICHE_DU_MARCHE) {
  let meilleur = { budget: BUDGETS_ESSAYES.min, resultat: -Infinity };
  for (let b = BUDGETS_ESSAYES.min; b <= BUDGETS_ESSAYES.max; b += BUDGETS_ESSAYES.pas) {
    const r = anneeAvecLaPublicite(f, b).resultat;
    if (r > meilleur.resultat) meilleur = { budget: b, resultat: r };
  }
  return meilleur.budget;
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. SE FIXER DES OBJECTIFS : L'ANNÉE N RÉALISÉE, L'ANNÉE N + 1 PRÉVUE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LA PART DE LA CAPACITÉ QUE L'OBJECTIF VISE (hypothèse du cours) : 70 %. Un objectif ambitieux sans
 * être hors de portée : ni le plein (que la moindre panne ou la moindre saison creuse rend
 * impossible), ni la moitié (qu'on atteint sans rien changer).
 */
export const TAUX_DE_CAPACITE_VISE = 0.7;

/** Les taux que le laboratoire des objectifs essaie : de 50 % à 100 %, par 5 points. */
export const TAUX_ESSAYES = { min: 50, max: 100, pas: 5 } as const;

export type Origine = "demande" | "production";
export type VerdictDeLObjectif = "tenu" | "a-revoir" | "mal-pose";

/** La capacité d'un trimestre : la plus petite de celle de la ligne et de celle de l'équipe. */
export function capaciteDuTrimestre(f: FicheDeLaCapacite = FICHE_DE_CAPACITE) {
  const outil = f.ligne.capaciteParTrimestre;
  const equipe = capaciteDeLEquipe(f);
  return { outil, equipe, capacite: Math.min(outil, equipe) };
}

/**
 * Les ventes d'une année, trimestre par trimestre : en N, celles qui ont été livrées (toute la
 * demande a été servie) ; en N + 1, la demande prévue, dans la limite de la capacité.
 */
export function ventesDeLAnnee(f: FicheDeLaCapacite = FICHE_DE_CAPACITE, annee: "N" | "N+1" = "N") {
  const { capacite } = capaciteDuTrimestre(f);
  const demande = annee === "N" ? f.anneeN.demande : f.anneeNPlus1.demande;
  return demande.map((d) => ({ demande: d, ventes: Math.min(d, capacite), manquees: Math.max(0, d - capacite) }));
}

/** L'objectif posé en janvier, et une année suivie face à lui. */
export function suiviDesObjectifs(f: FicheDeLaCapacite = FICHE_DE_CAPACITE, taux = TAUX_DE_CAPACITE_VISE, annee: "N" | "N+1" = "N") {
  const cap = capaciteDuTrimestre(f);
  const objectif = Math.round(cap.capacite * taux);
  const trimestres = ventesDeLAnnee(f, annee).map((x, i) => ({
    numero: i + 1,
    ...x,
    ecart: x.ventes - objectif,
    tenu: x.ventes >= objectif,
    origine: (x.demande < objectif ? "demande" : "production") as Origine,
  }));
  const objectifDeLAnnee = objectif * trimestres.length;
  const ventesTotales = trimestres.reduce((t, x) => t + x.ventes, 0);
  const demandeTotale = trimestres.reduce((t, x) => t + x.demande, 0);
  return {
    taux,
    ...cap,
    objectif,
    trimestres,
    objectifDeLAnnee,
    ventesDeLAnnee: ventesTotales,
    demandeDeLAnnee: demandeTotale,
    ecartDeLAnnee: ventesTotales - objectifDeLAnnee,
    realisation: auDixieme((ventesTotales / objectifDeLAnnee) * 100),
    tenus: trimestres.filter((x) => x.tenu).length,
    pire: trimestres.reduce((m, x) => (x.ecart < m.ecart ? x : m)),
    verdict: (ventesTotales >= objectifDeLAnnee ? "tenu" : demandeTotale >= objectifDeLAnnee ? "a-revoir" : "mal-pose") as VerdictDeLObjectif,
  };
}

/** Le plus haut taux de capacité, en pour cent entier, que chaque trimestre d'une année aurait tenu. */
export function tauxTenuChaqueTrimestre(f: FicheDeLaCapacite = FICHE_DE_CAPACITE, annee: "N" | "N+1" = "N", pas = 1) {
  const { capacite } = capaciteDuTrimestre(f);
  const pire = Math.min(...ventesDeLAnnee(f, annee).map((x) => x.ventes));
  let t = 0;
  while (Math.round((capacite * (t + pas)) / 100) <= pire && t + pas <= 100) t += pas;
  return t;
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. CONSTRUIRE UN INDICATEUR JUSTE : LE PRIX MOYEN DU MARCHÉ À TROIS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LA RÈGLE DE LECTURE DU COURS : un indice de prix à moins de 5 points de 100 se lit comme aligné
 * sur le marché ; en dessous de 95, l'enseigne vend moins cher que le marché ; au-dessus de 105,
 * plus cher. C'est l'écart que la carte du marché à trois retient pour une stratégie.
 */
export const ECART_ALIGNE = 5;

/** Les prix de NOVA que le laboratoire de l'indicateur essaie : de 55 à 70 €, à l'euro. */
export const PRIX_ESSAYES = { min: 55, max: 70, pas: 1 } as const;

export type Position = "dessous" | "aligne" | "dessus";
export const positionDe = (indice: number): Position => (indice < 100 - ECART_ALIGNE ? "dessous" : indice > 100 + ECART_ALIGNE ? "dessus" : "aligne");

/** Les enseignes de l'année et les deux façons de calculer le prix moyen du marché ; le prix de NOVA peut changer. */
export function indicateurDuPrix(f: FicheDuMarche = FICHE_DU_MARCHE, prixDeNova?: number, ventesDAuris?: number) {
  const a = anneeDuMarche(f, prixDeNova !== undefined ? { nova: { prix: prixDeNova } } : {});
  const enseignes = a.enseignes.map((e) => {
    const ventes = e.code === "auris" && ventesDAuris !== undefined ? ventesDAuris : e.ventes;
    return { code: e.code, nom: e.nom, ventes, prix: e.offre.prix, chiffreDAffaires: auCentime(ventes * e.offre.prix) };
  });
  const nova = enseignes[0]!;
  const moyenneSimple = auCentime(somme(enseignes.map((e) => e.prix)) / enseignes.length);
  const ventesTotales = enseignes.reduce((t, e) => t + e.ventes, 0);
  const chiffreTotal = somme(enseignes.map((e) => e.chiffreDAffaires));
  const prixPondere = auCentime(chiffreTotal / ventesTotales);
  const indiceSimple = Math.round((nova.prix / moyenneSimple) * 100);
  const indicePondere = Math.round((nova.prix / prixPondere) * 100);
  return {
    enseignes,
    nova,
    sommeDesPrix: somme(enseignes.map((e) => e.prix)),
    moyenneSimple,
    ventesTotales,
    chiffreTotal,
    prixPondere,
    indiceSimple,
    indicePondere,
    positionSimple: positionDe(indiceSimple),
    positionPonderee: positionDe(indicePondere),
    plusVendue: [...enseignes].sort((x, y) => y.ventes - x.ventes)[0]!,
  };
}

/** Les ventes d'Auris à partir desquelles le prix moyen pondéré rejoint la moyenne simple (les deux autres enseignes tenues). */
export function ventesDAurisPourLaMoyenneSimple(f: FicheDuMarche = FICHE_DU_MARCHE) {
  const k = indicateurDuPrix(f);
  const [n, s, a] = k.enseignes as [(typeof k.enseignes)[number], (typeof k.enseignes)[number], (typeof k.enseignes)[number]];
  return plafond((k.moyenneSimple * (n.ventes + s.ventes) - n.chiffreDAffaires - s.chiffreDAffaires) / (a.prix - k.moyenneSimple));
}

/** Le prix le plus haut de NOVA, à l'euro, où elle reste alignée sur le prix moyen pondéré. */
export function prixLePlusHautAligne(f: FicheDuMarche = FICHE_DU_MARCHE) {
  let p = f.enseignes[0]!.offre.prix;
  while (p + PRIX_ESSAYES.pas <= PRIX_ESSAYES.max && indicateurDuPrix(f, p + PRIX_ESSAYES.pas).positionPonderee === "aligne") p += PRIX_ESSAYES.pas;
  return p;
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. DES DONNÉES À L'INFORMATION : LA TABLE DES VENTES DU SEMESTRE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LA RÈGLE DE LECTURE DU COURS : d'un trimestre à l'autre, une part du chiffre d'affaires qui bouge
 * de moins de 1 point se lit comme stable.
 */
export const PART_STABLE = 1;

export interface LigneDeVentes {
  numero: number;
  /** Le mois, de 1 (janvier) à 6 (juin). */
  mois: number;
  nomDuMois: string;
  trimestre: 1 | 2;
  clientele: CodeDeClientele;
  nomDeLaClientele: string;
  ventes: number;
  chiffreDAffaires: number;
}

/** La table des ventes du semestre : une ligne par mois et par clientèle, les particuliers d'abord. */
export function tableDesVentes(f: FicheDeGestion = FICHE_DE_GESTION): LigneDeVentes[] {
  const prix = f.moisDeReference.prix;
  return f.semestre.mois.flatMap((m, k) =>
    f.semestre.clienteles.map((c) => ({
      mois: k + 1,
      nomDuMois: m.nom,
      trimestre: (k < 3 ? 1 : 2) as 1 | 2,
      clientele: c.code,
      nomDeLaClientele: c.code === "particuliers" ? "Particuliers" : c.nom,
      ventes: c.quantites[k]!,
      chiffreDAffaires: auCentime(c.quantites[k]! * prix),
    })),
  ).map((l, i) => ({ numero: i + 1, ...l }));
}

export type LectureDeLaPart = "monte" | "stable" | "baisse";

/** Ce que la table donne une fois triée, regroupée et calculée : la part de CampusTech, trimestre par trimestre. */
export function donneesALInformation(f: FicheDeGestion = FICHE_DE_GESTION) {
  const lignes = tableDesVentes(f);
  const total = (garder: (l: LigneDeVentes) => boolean) => somme(lignes.filter(garder).map((l) => l.chiffreDAffaires));
  const trimestre = (t: 1 | 2) => {
    const tout = total((l) => l.trimestre === t);
    const campustech = total((l) => l.trimestre === t && l.clientele === "campustech");
    return { total: tout, campustech, particuliers: auCentime(tout - campustech), part: auDixieme((campustech / tout) * 100) };
  };
  const premier = trimestre(1);
  const second = trimestre(2);
  const ecart = auDixieme(second.part - premier.part);
  const parMois = f.semestre.mois.map((m, k) => {
    const tout = total((l) => l.mois === k + 1);
    const campustech = total((l) => l.mois === k + 1 && l.clientele === "campustech");
    return { nom: m.nom, total: tout, campustech, part: auDixieme((campustech / tout) * 100) };
  });
  return {
    lignes,
    premier,
    second,
    ecart,
    lecture: (ecart > PART_STABLE ? "monte" : ecart < -PART_STABLE ? "baisse" : "stable") as LectureDeLaPart,
    parClientele: f.semestre.clienteles.map((c) => ({ code: c.code, nom: c.code === "particuliers" ? "Particuliers" : c.nom, chiffre: total((l) => l.clientele === c.code), lignes: lignes.filter((l) => l.clientele === c.code).length })),
    parMois,
    /** Le mois où la part de CampusTech est la plus faible. */
    moisLePlusFaible: parMois.reduce((m, x) => (x.part < m.part ? x : m)),
  };
}

/** Les enceintes par mois que CampusTech devrait commander au deuxième trimestre pour y garder sa part du premier. */
export function commandePourGarderLaPart(f: FicheDeGestion = FICHE_DE_GESTION) {
  const k = donneesALInformation(f);
  const prix = f.moisDeReference.prix;
  const partVisee = k.premier.campustech / k.premier.total;
  // 3 × q × prix ≥ part × (particuliers + 3 × q × prix)
  return plafond((partVisee * k.second.particuliers) / (3 * prix * (1 - partVisee)));
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. UNE DONNÉE FAUSSE : L'EXTRAIT DES TRIMESTRES 1 À 3 DE L'ANNÉE N
// ═════════════════════════════════════════════════════════════════════════════

/** Les trimestres de l'extrait, ceux dont le gérant fait la moyenne. */
export const TRIMESTRES_DE_L_EXTRAIT = [1, 2, 3] as const;

/** Le trimestre de l'extrait où l'erreur de saisie est glissée (hypothèse du cours). */
export const TRIMESTRE_DE_L_ERREUR = 3;

/**
 * L'ERREUR DE SAISIE (hypothèse du cours) : la virgule des ventes glisse d'un rang vers la gauche,
 * et la valeur saisie est celle des vraies ventes divisée par 10 (5 810 devient 581). C'est l'erreur
 * de la saisie à la main, au clavier numérique.
 */
export const FACTEUR_DE_LA_VIRGULE = 10;

/** Le trimestre décidé sur la prévision : celui qui suit l'extrait. */
export const TRIMESTRE_DECIDE = 4;

/**
 * LES RÈGLES DE PRÉVISION que le laboratoire compare : la moyenne des trois trimestres de l'extrait
 * (celle du gérant), ou le dernier trimestre seul.
 */
export type RegleDePrevision = "moyenne" | "dernier";

/**
 * L'extrait du tableur (les ventes de chaque trimestre de N, au prix de l'enceinte), la valeur saisie
 * du trimestre faux, et le chiffre d'affaires facturé, juste.
 */
export function extraitDuTableur(f: FicheDeLaCapacite = FICHE_DE_CAPACITE) {
  const prix = f.enceinte.prix;
  return TRIMESTRES_DE_L_EXTRAIT.map((t) => {
    const ventes = f.anneeN.demande[t - 1]!;
    const saisie = t === TRIMESTRE_DE_L_ERREUR ? ventes / FACTEUR_DE_LA_VIRGULE : ventes;
    const chiffreDAffaires = auCentime(ventes * prix);
    const recalcule = auCentime(saisie * prix);
    return { trimestre: t, ventes, saisie, prix, chiffreDAffaires, recalcule, ecart: auCentime(chiffreDAffaires - recalcule) };
  });
}

/** La prévision du trimestre 4 selon une règle, sur l'extrait juste ou faux, à l'enceinte. */
export function prevision(f: FicheDeLaCapacite = FICHE_DE_CAPACITE, regle: RegleDePrevision = "moyenne", juste = true) {
  const valeurs = extraitDuTableur(f).map((l) => (juste ? l.ventes : l.saisie));
  return Math.round(regle === "moyenne" ? valeurs.reduce((t, x) => t + x, 0) / valeurs.length : valeurs.at(-1)!);
}

/**
 * Le trimestre 4 de N rejoué, la production calée sur une prévision (HYPOTHÈSE DU COURS : NOVA ne
 * fabrique que ce que son plan prévoit, dans la limite de sa capacité, et sans stock d'enceintes
 * finies ; la demande qui dépasse le plan repart sans être servie). La marge est celle des
 * enceintes vendues ; les charges fixes ne changent pas avec le plan : l'écart de marge est l'écart
 * de résultat.
 */
export function trimestreDecide(f: FicheDeLaCapacite = FICHE_DE_CAPACITE, plan: number) {
  const demande = f.anneeN.demande[TRIMESTRE_DECIDE - 1]!;
  const { capacite } = capaciteDuTrimestre(f);
  const vendues = Math.min(demande, plan, capacite);
  const marge = auCentime(vendues * (f.enceinte.prix - f.enceinte.coutVariable.composants - f.enceinte.coutVariable.autres));
  return { plan, demande, vendues, manquees: demande - vendues, marge };
}

export type VerdictDeLaDonnee = "l-erreur-coute" | "rien-ne-change";

/** L'extrait, sa donnée fausse, les deux prévisions de la moyenne, et le trimestre 4 sur chacune. */
export function donneeFausse(f: FicheDeLaCapacite = FICHE_DE_CAPACITE) {
  const lignes = extraitDuTableur(f);
  const fausse = lignes.find((l) => l.trimestre === TRIMESTRE_DE_L_ERREUR)!;
  const previsionJuste = prevision(f, "moyenne", true);
  const previsionFausse = prevision(f, "moyenne", false);
  const juste = trimestreDecide(f, previsionJuste);
  const faux = trimestreDecide(f, previsionFausse);
  const coutDeLErreur = auCentime(juste.marge - faux.marge);
  return {
    lignes,
    fausse,
    prix: f.enceinte.prix,
    sommeJuste: lignes.reduce((t, l) => t + l.ventes, 0),
    sommeFausse: auDixieme(lignes.reduce((t, l) => t + l.saisie, 0)),
    previsionJuste,
    previsionFausse,
    ecartDePrevision: previsionJuste - previsionFausse,
    ecartDePrevisionEnPourcentage: auDixieme(((previsionJuste - previsionFausse) / previsionJuste) * 100),
    juste,
    faux,
    ventesPerdues: juste.vendues - faux.vendues,
    coutDeLErreur,
    verdict: (coutDeLErreur > 0 ? "l-erreur-coute" : "rien-ne-change") as VerdictDeLaDonnee,
  };
}

/** La combinaison du laboratoire (donnée juste ou fausse, règle) qui fait manquer le moins de ventes au trimestre 4. */
export function meilleureCombinaison(f: FicheDeLaCapacite = FICHE_DE_CAPACITE) {
  const essais = ([true, false] as const).flatMap((juste) => (["moyenne", "dernier"] as const).map((regle) => ({ juste, regle, manquees: trimestreDecide(f, prevision(f, regle, juste)).manquees })));
  return essais.reduce((m, x) => (x.manquees < m.manquees ? x : m));
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. UNE INFORMATION À TEMPS : L'ANNÉE N REJOUÉE AVEC UN RETARD
// ═════════════════════════════════════════════════════════════════════════════

/** LE RETARD DU COURS : les chiffres des ventes arrivent avec un trimestre de retard (hypothèse du cours). */
export const RETARD = 1;

/** LE RETARD PLUS LONG, comparé au premier : deux trimestres (hypothèse du cours). */
export const RETARD_LONG = 2;

/** Le trimestre de la question « sur quels chiffres l'équipe décide-t-elle ? ». */
export const TRIMESTRE_DE_LA_QUESTION = 3;

/** Le pas de la précaution du laboratoire, en enceintes. */
export const PAS_DE_LA_PRECAUTION = 100;

/**
 * L'ÉQUIPE ET SES CHIFFRES (hypothèses du cours). Ceux qui vendent connaissent les commandes du
 * trimestre ; ceux qui fixent la production décident sur les chiffres qui leur arrivent.
 *   · À JOUR, le plan d'un trimestre est sa demande (les commandes arrivent au fil de l'eau).
 *   · AVEC UN RETARD de r trimestres, le plan d'un trimestre est la demande du trimestre r plus tôt ;
 *     les r premiers trimestres gardent le plan du départ, la demande du premier trimestre, que les
 *     commandes de janvier font connaître.
 *   · Une PRÉCAUTION (un levier, nulle dans la fiche) s'ajoute à chaque plan après le premier.
 *   · NOVA fabrique son plan dans la limite de sa capacité. Ce qui ne se vend pas reste en stock et
 *     se vend au trimestre suivant ; la demande qui dépasse ce qui est disponible repart sans être
 *     servie. Le stock s'évalue à son coût variable : il ne change pas le résultat, que seule la
 *     marge des enceintes vendues fait bouger (les charges fixes, 31 183 € par mois, ne changent
 *     pas avec le plan).
 */
export function anneeAvecUnRetard(f: FicheDeLaCapacite = FICHE_DE_CAPACITE, retard = 0, precaution = 0) {
  const demande = f.anneeN.demande;
  const { capacite } = capaciteDuTrimestre(f);
  const coutVariable = auCentime(f.enceinte.coutVariable.composants + f.enceinte.coutVariable.autres);
  const marge = auCentime(f.enceinte.prix - coutVariable);
  const chargesFixes = auCentime(3 * chargesFixesDuMois());
  let stock = 0;
  const trimestres = demande.map((d, i) => {
    const source = Math.max(0, i - retard);
    const plan = (retard === 0 ? d : demande[i < retard ? 0 : source]!) + (i > 0 ? precaution : 0);
    const produit = Math.min(plan, capacite);
    const disponible = produit + stock;
    const ventes = Math.min(d, disponible);
    stock = disponible - ventes;
    return { trimestre: i + 1, demande: d, plan, produit, ventes, nonServie: d - ventes, stock, resultat: auCentime(ventes * marge - chargesFixes) };
  });
  const total = (k: "ventes" | "nonServie") => trimestres.reduce((t, x) => t + x[k], 0);
  return {
    retard,
    precaution,
    trimestres,
    ventes: total("ventes"),
    nonServie: total("nonServie"),
    stockFinal: stock,
    valeurDuStockFinal: auCentime(stock * coutVariable),
    chiffreDAffaires: auCentime(total("ventes") * f.enceinte.prix),
    resultat: somme(trimestres.map((x) => x.resultat)),
    marge,
  };
}

export type AnneeDeLEquipe = ReturnType<typeof anneeAvecUnRetard>;
export type SensDuPlan = "trop-bas" | "trop-haut" | "egal";
export type VerdictDuRetardLong = "au-moins-le-double" | "plus-mais-moins-du-double" | "moins";

/** L'année à jour, les deux années en retard, et ce que chaque retard coûte. */
export function informationATemps(f: FicheDeLaCapacite = FICHE_DE_CAPACITE) {
  const aJour = anneeAvecUnRetard(f, 0);
  const enRetard = anneeAvecUnRetard(f, RETARD);
  const long = anneeAvecUnRetard(f, RETARD_LONG);
  const ecarts = enRetard.trimestres.map((t, i) => ({ trimestre: t.trimestre, ecart: t.plan - aJour.trimestres[i]!.plan }));
  const plusGrand = Math.max(...ecarts.map((e) => Math.abs(e.ecart)));
  const plusTouche = ecarts.find((e) => Math.abs(e.ecart) === plusGrand)!;
  const coutDuRetard = auCentime(aJour.resultat - enRetard.resultat);
  const coutDuRetardLong = auCentime(aJour.resultat - long.resultat);
  return {
    aJour,
    enRetard,
    long,
    ecarts,
    plusTouche: { ...plusTouche, aJour: aJour.trimestres[plusTouche.trimestre - 1]!, enRetard: enRetard.trimestres[plusTouche.trimestre - 1]! },
    sens: (plusTouche.ecart < 0 ? "trop-bas" : plusTouche.ecart > 0 ? "trop-haut" : "egal") as SensDuPlan,
    ventesPerdues: aJour.ventes - enRetard.ventes,
    coutDuRetard,
    partDuResultat: auDixieme((coutDuRetard / aJour.resultat) * 100),
    coutDuRetardLong,
    verdict: (coutDuRetardLong >= 2 * coutDuRetard ? "au-moins-le-double" : coutDuRetardLong >= coutDuRetard ? "plus-mais-moins-du-double" : "moins") as VerdictDuRetardLong,
  };
}

/** La précaution qu'il faut ajouter au plan en retard d'un trimestre pour servir toute la demande du trimestre le plus touché. */
export function precautionDuTrimestreLePlusTouche(f: FicheDeLaCapacite = FICHE_DE_CAPACITE) {
  const p = informationATemps(f).plusTouche;
  return Math.max(0, -p.ecart);
}

/** La plus petite précaution, au pas du laboratoire, qui sert toute la demande de l'année avec deux trimestres de retard. */
export function precautionPourToutServir(f: FicheDeLaCapacite = FICHE_DE_CAPACITE, retard = RETARD_LONG) {
  for (let p = 0; p <= 3_000; p += PAS_DE_LA_PRECAUTION) if (anneeAvecUnRetard(f, retard, p).nonServie === 0) return p;
  throw new Error("Aucune précaution ne sert toute la demande");
}

// ═════════════════════════════════════════════════════════════════════════════
// 12. CE QUE COÛTE UN OUTIL NUMÉRIQUE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * L'ABONNEMENT AU LOGICIEL (hypothèse du cas) : 40 € par utilisateur et par mois, hors taxes, dans
 * l'ordre de grandeur des logiciels de gestion commerciale en ligne pour les petites entreprises.
 */
export const ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS = 40;

/** LA MISE EN PLACE (hypothèse du cas), payée une fois : le paramétrage et la reprise des données. */
export const MISE_EN_PLACE = 2_500;

/** LA FORMATION (hypothèse du cas), payée une fois : une journée par le prestataire, pour chaque utilisateur. */
export const FORMATION_PAR_UTILISATEUR = 300;

/**
 * LE GAIN DE L'OUTIL (hypothèse du cas). Aujourd'hui, les chiffres des ventes de NOVA arrivent à ceux
 * qui fixent la production avec un trimestre de retard (le tableur se consolide une fois par
 * trimestre : l'équipe en retard du chapitre « Une information qui circule à temps »). Quand toute
 * l'équipe s'en sert, l'outil fait retrouver 30 % des ventes que ce retard fait manquer : les
 * commandes suivies au jour le jour font voir la demande plus tôt, sans la prévoir toute.
 */
export const PART_DES_VENTES_RETROUVEES = 0.3;

/**
 * L'ADOPTION DE LA PREMIÈRE ANNÉE (hypothèse du cas) : 60 % de l'équipe se sert vraiment de l'outil,
 * les autres gardent le tableur et le carnet. Le gain suit cette part ; l'abonnement se paie pour
 * chaque utilisateur inscrit.
 */
export const ADOPTION_DE_LA_PREMIERE_ANNEE = 0.6;

/** Les mois d'une année d'abonnement. */
export const MOIS_PAR_AN = 12;

/** Les taux d'adoption que le laboratoire de l'outil essaie : de 0 à 100 %, par 10 points. */
export const ADOPTIONS_ESSAYEES = { min: 0, max: 100, pas: 10 } as const;

export type VerdictDeLOutil = "rembourse-dans-l-annee" | "rembourse-en-plus-d-un-an" | "ne-couvre-pas-l-abonnement";

/** Ce que l'outil coûte et rapporte, pour une adoption donnée (0,6 : 60 % de l'équipe). */
export function outilNumerique(f: FicheDeLaCapacite = FICHE_DE_CAPACITE, adoption = ADOPTION_DE_LA_PREMIERE_ANNEE) {
  const info = informationATemps(f);
  const utilisateurs = f.operateurs.nombre;
  const abonnement = utilisateurs * ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS * MOIS_PAR_AN;
  const formation = utilisateurs * FORMATION_PAR_UTILISATEUR;
  const depart = MISE_EN_PLACE + formation;
  const coutPremiereAnnee = abonnement + depart;
  const ventesManquees = info.ventesPerdues;
  const ventesRetrouvees = Math.round(ventesManquees * PART_DES_VENTES_RETROUVEES);
  const marge = info.aJour.marge;
  const gain = auCentime(ventesRetrouvees * marge);
  const gainNet = auCentime(gain - abonnement);
  const gainAdopte = auCentime(gain * adoption);
  const gainNetAdopte = auCentime(gainAdopte - abonnement);
  return {
    utilisateurs,
    ventesManquees,
    marge,
    abonnement,
    formation,
    depart,
    coutPremiereAnnee,
    ventesRetrouvees,
    gain,
    gainNet,
    delai: auDixieme((depart / gainNet) * MOIS_PAR_AN),
    seuilDAdoption: auDixieme((abonnement / gain) * 100),
    adoption,
    gainAdopte,
    gainNetAdopte,
    delaiAdopte: gainNetAdopte > 0 ? auDixieme((depart / gainNetAdopte) * MOIS_PAR_AN) : null,
    soldePremiereAnneeAdopte: auCentime(gainAdopte - coutPremiereAnnee),
    verdict: (gainNetAdopte <= 0 ? "ne-couvre-pas-l-abonnement" : gainAdopte >= coutPremiereAnnee ? "rembourse-dans-l-annee" : "rembourse-en-plus-d-un-an") as VerdictDeLOutil,
  };
}

/** Le plus petit taux d'adoption, en pour cent entier, où le gain couvre l'abonnement. */
export const adoptionQuiPaieLAbonnement = (f: FicheDeLaCapacite = FICHE_DE_CAPACITE) => {
  const o = outilNumerique(f);
  return plafond((o.abonnement / o.gain) * 100);
};

/** Le plus petit taux d'adoption, au pas du laboratoire, où le gain de la première année couvre tout son coût. */
export function adoptionQuiRembourseDansLAnnee(f: FicheDeLaCapacite = FICHE_DE_CAPACITE) {
  for (let a = ADOPTIONS_ESSAYEES.min; a <= ADOPTIONS_ESSAYEES.max; a += ADOPTIONS_ESSAYEES.pas) {
    const o = outilNumerique(f, a / 100);
    if (o.gainAdopte >= o.coutPremiereAnnee) return a;
  }
  throw new Error("Aucune adoption ne rembourse l'outil dans l'année");
}
