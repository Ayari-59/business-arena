import { auCentime } from "./amortissement";
import { cloture, impotSurLesSocietes, sommeDesComptes, type Soldes } from "./cloture";
import { EXERCICES_DU_COURS, type FicheDeLExercice } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : LES COMPTES DE NOVA, LUS AU LYCÉE (Bac STMG, gestion et finance).
 *
 * Les six chapitres du parcours « Bac STMG · Gestion et finance » (le compte de résultat, le bilan,
 * la valeur ajoutée, la rentabilité, le fonds de roulement, le financement) lisent le premier
 * exercice de NOVA, celui de la fiche figée (exercice-de-nova.ts), clôturé par le modèle du cours
 * (cloture.ts) : le même que « Soldes intermédiaires de gestion » et « Bilan fonctionnel et BFR »,
 * au centime. Ce fichier le range en grandes masses, avec les mots du lycée, et le rejoue quand un
 * laboratoire fait bouger un levier. Il ne lit ni le moteur, ni l'arène.
 *
 * CE QUI EST SIMPLIFIÉ, ET POURQUOI (le niveau est celui du bac) :
 *   · le bilan comptable se lit en valeurs nettes ; le fonds de roulement, le besoin et la
 *     trésorerie sont exactement ceux du bilan fonctionnel du supérieur (cloture.ts), nommés avec
 *     les mots du lycée : les dettes de moins d'un an (fournisseurs, État et personnel, intérêts
 *     courus, ventes facturées d'avance) sont les dettes du cycle ;
 *   · les variantes ne rejouent que ce que leur levier change (hypothèses ci-dessous).
 */

/** Les entreprises dont un exercice est tenu dans le monde du cours : NOVA seule. */
export const ENTREPRISES_DES_COMPTES_DU_LYCEE: readonly string[] = Object.keys(EXERCICES_DU_COURS);

/** La fiche de l'exercice d'une entreprise du cours. */
export const exerciceDe = (code: string): FicheDeLExercice => {
  const f = EXERCICES_DU_COURS[code];
  if (!f) throw new Error(`Pas d'exercice du cours pour l'entreprise ${code}`);
  return f;
};

const debit = (s: Soldes, prefixes: readonly string[], sauf: readonly string[] = []) => sommeDesComptes(s, prefixes, sauf);
const credit = (s: Soldes, prefixes: readonly string[], sauf: readonly string[] = []) => auCentime(-sommeDesComptes(s, prefixes, sauf));

// ─────────────────────────────────────────────────────────────────────────────
// LE COMPTE DE RÉSULTAT
// ─────────────────────────────────────────────────────────────────────────────

export type NatureDeLaLigne = "produit" | "activite" | "financement" | "impot";

export interface LigneDuCompte {
  code: string;
  libelle: string;
  montant: number;
  nature: NatureDeLaLigne;
  /** Une consommation venue d'une autre entreprise : elle se retranche de la production pour la valeur ajoutée. */
  consommation?: boolean;
}

/** Les comptes de gestion de l'exercice, rangés en lignes du lycée : chaque compte de classe 6 ou 7 a sa ligne (la garde le vérifie). */
const LIGNES: readonly { code: string; libelle: string; nature: NatureDeLaLigne; comptes: readonly string[]; consommation?: boolean }[] = [
  { code: "ventes", libelle: "Ventes d'enceintes", nature: "produit", comptes: ["70"] },
  { code: "placement", libelle: "Revenus du compte à terme", nature: "produit", comptes: ["76"] },
  { code: "composants", libelle: "Composants consommés", nature: "activite", comptes: ["601", "6031"], consommation: true },
  { code: "emballage", libelle: "Emballage, transport et énergie", nature: "activite", comptes: ["606"], consommation: true },
  { code: "loyer", libelle: "Loyer du local", nature: "activite", comptes: ["613"], consommation: true },
  { code: "assurance", libelle: "Assurance", nature: "activite", comptes: ["616"], consommation: true },
  { code: "personnel", libelle: "Personnel (salaires et cotisations)", nature: "activite", comptes: ["64"] },
  { code: "usure", libelle: "Usure de la ligne de montage (amortissement)", nature: "activite", comptes: ["6811"] },
  { code: "risques", libelle: "Risques de l'année (créance de Sonora, litige)", nature: "activite", comptes: ["6815", "6817"] },
  { code: "interets", libelle: "Intérêts de l'emprunt", nature: "financement", comptes: ["661"] },
  { code: "escompte", libelle: "Escomptes accordés aux clients", nature: "financement", comptes: ["665"] },
  { code: "impot", libelle: "Impôt sur les bénéfices", nature: "impot", comptes: ["695"] },
];

/** Ce qu'un laboratoire change à l'année : le prix, les enceintes vendues, les salaires, des intérêts de plus. */
export interface VarianteDeLAnnee {
  /** Le prix d'une enceinte, hors taxes. */
  prix: number;
  /** Les enceintes vendues dans l'année. */
  quantite: number;
  /** La hausse des salaires et de leurs cotisations, en part (0,1 : 10 %). */
  hausseDesSalaires: number;
  /** Les intérêts d'un emprunt nouveau, sur l'année. */
  interetsEnPlus: number;
}

/**
 * LE COÛT D'UNE ENCEINTE DE PLUS OU DE MOINS (hypothèse du cours, celle du contrôle de gestion) :
 * ses composants (le prix du jeu chez Électro-Composants) et ses autres coûts variables
 * (emballage, transport, énergie), ceux de la fiche. Le loyer, l'assurance, le personnel, l'usure
 * de la ligne et les risques de l'année ne bougent pas avec les ventes.
 */
export const coutVariableDeLEnceinte = (f: FicheDeLExercice) => auCentime(f.fournisseur.prixDuJeu + f.autresCoutsDeLEnceinte);

/** Les enceintes que les ventes de la fiche représentent : le chiffre d'affaires au prix de l'enceinte. */
export const enceintesDeLAnnee = (f: FicheDeLExercice) => Math.round(credit(cloture(f).soldes, ["70"]) / f.prixDeLEnceinte);

/**
 * LE COMPTE DE RÉSULTAT DE L'ANNÉE, en lignes du lycée, et ses totaux. Sans variante, c'est celui de
 * la clôture au centime. Une variante rejoue l'année :
 *   · HYPOTHÈSE : un prix ou une quantité qui change fait varier les ventes (prix × quantité) et les
 *     coûts variables des enceintes en plus ou en moins (`coutVariableDeLEnceinte`), et rien
 *     d'autre ; le cours ne dit pas ici combien de clients un prix plus haut ferait fuir ;
 *   · la hausse des salaires s'applique aux salaires et à leurs cotisations, toute l'année ;
 *   · l'impôt se recalcule sur le nouveau résultat, au barème de la fiche.
 */
export function compteDuLycee(f: FicheDeLExercice, v: Partial<VarianteDeLAnnee> = {}) {
  const k = cloture(f);
  const s = k.soldes;
  const quantiteDeLaFiche = enceintesDeLAnnee(f);
  const prix = v.prix ?? f.prixDeLEnceinte;
  const quantite = v.quantite ?? quantiteDeLaFiche;
  const ecart = quantite - quantiteDeLaFiche;
  const base = Object.fromEntries(LIGNES.map((l) => [l.code, l.nature === "produit" ? credit(s, l.comptes) : debit(s, l.comptes)])) as Record<string, number>;
  const varie = v.prix !== undefined || v.quantite !== undefined;
  const montants: Record<string, number> = {
    ...base,
    ventes: varie ? auCentime(prix * quantite) : base.ventes!,
    composants: auCentime(base.composants! + ecart * f.fournisseur.prixDuJeu),
    emballage: auCentime(base.emballage! + ecart * f.autresCoutsDeLEnceinte),
    personnel: auCentime(base.personnel! * (1 + (v.hausseDesSalaires ?? 0))),
    interets: auCentime(base.interets! + (v.interetsEnPlus ?? 0)),
  };
  const somme = (filtre: (l: (typeof LIGNES)[number]) => boolean) => auCentime(LIGNES.filter(filtre).reduce((t, l) => t + montants[l.code]!, 0));
  const ventes = montants.ventes!;
  const produits = somme((l) => l.nature === "produit");
  const activite = somme((l) => l.nature === "activite");
  const financement = somme((l) => l.nature === "financement");
  const consommations = somme((l) => !!l.consommation);
  const resultatDActivite = auCentime(ventes - activite);
  const resultatAvantImpot = auCentime(produits - activite - financement);
  // L'impôt de la clôture est celui de ce barème sur le même résultat (la garde le vérifie) : il se recalcule toujours.
  const impot = impotSurLesSocietes(resultatAvantImpot, f.impot).impot;
  montants.impot = impot;
  const charges = auCentime(activite + financement + impot);
  const resultatNet = auCentime(produits - charges);
  const dotations = auCentime(montants.usure! + montants.risques!);
  const valeurAjoutee = auCentime(ventes - consommations);
  const lignes: LigneDuCompte[] = LIGNES.map((l) => ({ code: l.code, libelle: l.libelle, montant: montants[l.code]!, nature: l.nature, ...(l.consommation ? { consommation: true } : {}) }));
  const ligne = (code: string) => montants[code]!;
  return {
    f,
    entreprise: f.entreprise,
    prix,
    quantite,
    quantiteDeLaFiche,
    coutVariable: coutVariableDeLEnceinte(f),
    lignes,
    ligne,
    ventes,
    produitsFinanciers: ligne("placement"),
    produits,
    activite,
    resultatDActivite,
    financement,
    resultatAvantImpot,
    impot,
    charges,
    resultatNet,
    personnel: ligne("personnel"),
    dotations,
    consommations,
    valeurAjoutee,
    /** La capacité d'autofinancement : le résultat net, plus les dotations, des charges qui ne font sortir aucun argent. */
    caf: auCentime(resultatNet + dotations),
    /** Le résultat net rapporté aux ventes (une part : 0,057 pour 5,7 %). */
    tauxDeResultat: resultatNet / ventes,
    /** Ce que les lignes laissent de côté dans les comptes de gestion : zéro (la garde le vérifie). */
    nonRange: auCentime(debit(s, ["6", "7"]) - (activite + financement + base.impot! - produits)),
  };
}

export type CompteDuLycee = ReturnType<typeof compteDuLycee>;

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN DU 31 DÉCEMBRE
// ─────────────────────────────────────────────────────────────────────────────

export type CoteDuBilan = "actif" | "passif";

export interface PosteDuBilan {
  code: string;
  libelle: string;
  montant: number;
  cote: CoteDuBilan;
}

/** Ce qu'un laboratoire change au bilan du 31 décembre. */
export interface VarianteDuBilan {
  /** Le jour où CampusTech paie, après sa facture (80 dans la fiche : 20 jours de retard sur les 60 convenus). */
  delaiCampusTech: number;
  /** Le délai de paiement d'Électro-Composants, en jours (22 dans la fiche). */
  delaiFournisseur: number;
  /** Un équipement de plus, acheté et payé le 31 décembre, hors taxes. */
  equipement: number;
  /** Un dividende versé aux associés le 31 décembre. */
  dividende: number;
  /** Un apport nouveau des associés, versé en banque le 31 décembre. */
  apport: number;
  /** Un emprunt nouveau, versé en banque le 31 décembre. */
  emprunt: number;
}

/**
 * LE BILAN DU 31 DÉCEMBRE, en postes du lycée, ses totaux, le fonds de roulement, le besoin en fonds
 * de roulement et la trésorerie. Sans variante, c'est celui de la clôture au centime. Une variante :
 *   · les délais de CampusTech et du fournisseur rejouent la clôture (cloture.ts) : ils déplacent de
 *     l'argent entre la banque, les clients et les fournisseurs, sans toucher au résultat ;
 *   · HYPOTHÈSE : l'équipement, le dividende, l'apport et l'emprunt nouveaux passent le 31 décembre,
 *     par la banque ; ils ne changent donc rien au compte de résultat de l'année. La TVA de
 *     l'équipement est laissée de côté (elle se récupère). Une banque qui passe sous zéro devient
 *     un découvert ; le compte à terme reste bloqué jusqu'à son échéance.
 */
export function bilanDuLycee(f: FicheDeLExercice, v: Partial<VarianteDuBilan> = {}) {
  const k = cloture(f, {
    ...(v.delaiCampusTech !== undefined ? { delaiCampusTech: v.delaiCampusTech } : {}),
    ...(v.delaiFournisseur !== undefined ? { delaiFournisseur: v.delaiFournisseur } : {}),
  });
  const s = k.soldes;
  const b = k.bilan;
  const equipementEnPlus = v.equipement ?? 0;
  const dividende = v.dividende ?? 0;
  const apport = v.apport ?? 0;
  const empruntEnPlus = v.emprunt ?? 0;
  const banqueAvant = debit(s, ["5"], ["50"]);
  const banqueApres = auCentime(banqueAvant - equipementEnPlus - dividende + apport + empruntEnPlus);
  const postes: PosteDuBilan[] = [
    { code: "equipement", libelle: "Équipement (valeur nette)", montant: auCentime(b.actif.immobilisations.net + equipementEnPlus), cote: "actif" },
    { code: "stocks", libelle: "Stock de composants", montant: b.actif.stocks.net, cote: "actif" },
    { code: "clients", libelle: "Créances sur les clients", montant: b.actif.clients.net, cote: "actif" },
    { code: "autresCreances", libelle: "Autres créances (TVA à récupérer, assurance payée d'avance)", montant: auCentime(b.actif.autresCreances + b.actif.chargesConstateesDAvance), cote: "actif" },
    { code: "placement", libelle: "Compte à terme (intérêts compris)", montant: b.actif.valeursMobilieresDePlacement, cote: "actif" },
    { code: "banque", libelle: "Banque", montant: Math.max(0, banqueApres), cote: "actif" },
    { code: "capitauxPropres", libelle: "Capitaux propres (capital et résultat de l'année)", montant: auCentime(b.passif.capitauxPropres.total - dividende + apport), cote: "passif" },
    { code: "provision", libelle: "Provision pour litige", montant: b.passif.provisions, cote: "passif" },
    { code: "emprunt", libelle: "Emprunt (capital restant dû)", montant: auCentime(credit(s, ["16", "17"], ["1688"]) + empruntEnPlus), cote: "passif" },
    { code: "fournisseurs", libelle: "Dettes envers les fournisseurs", montant: b.passif.fournisseurs, cote: "passif" },
    { code: "etat", libelle: "Dettes envers l'État et le personnel (TVA, impôt, cotisations)", montant: b.passif.dettesFiscalesEtSociales, cote: "passif" },
    {
      code: "autresDettes",
      libelle: "Autres dettes (intérêts courus, ventes facturées d'avance)",
      montant: auCentime(credit(s, ["1688"]) + b.passif.autresDettes + b.passif.produitsConstatesDAvance),
      cote: "passif",
    },
    { code: "decouvert", libelle: "Découvert bancaire", montant: Math.max(0, auCentime(-banqueApres)), cote: "passif" },
  ];
  const p = Object.fromEntries(postes.map((x) => [x.code, x.montant])) as Record<string, number>;
  const total = (cote: CoteDuBilan) => auCentime(postes.filter((x) => x.cote === cote).reduce((t, x) => t + x.montant, 0));
  const actif = total("actif");
  const passif = total("passif");
  const capitauxPropres = p.capitauxPropres!;
  const dettes = auCentime(passif - capitauxPropres);
  // Le fonds de roulement et le besoin sont ceux du bilan fonctionnel de la clôture (le chapitre
  // « Bilan fonctionnel et BFR »), au centime : l'équipement à sa valeur d'origine, les
  // amortissements et la dépréciation de la créance de Sonora avec les ressources durables, les
  // clients à leur montant brut. Seuls les mots changent.
  const fo = k.fonctionnel;
  const equipementBrut = auCentime(fo.emploisStables + equipementEnPlus);
  const amortissementsEtDepreciations = fo.ressourcesStables.amortissementsEtDepreciations;
  const clientsBruts = b.actif.clients.brut;
  const ressourcesDurables = auCentime(capitauxPropres + amortissementsEtDepreciations + p.provision! + p.emprunt!);
  const fondsDeRoulement = auCentime(ressourcesDurables - equipementBrut);
  const besoinsDuCycle = auCentime(p.stocks! + clientsBruts + p.autresCreances!);
  const dettesDuCycle = auCentime(p.fournisseurs! + p.etat! + p.autresDettes!);
  const besoin = auCentime(besoinsDuCycle - dettesDuCycle);
  const disponible = auCentime(p.placement! + p.banque!);
  return {
    f,
    entreprise: f.entreprise,
    postes,
    poste: (code: string) => p[code]!,
    actif,
    passif,
    capitauxPropres,
    dettes,
    disponible,
    decouvert: p.decouvert!,
    /** Ce qu'il faut payer dans l'année : les dettes du cycle et le découvert. */
    aCourtTerme: auCentime(dettesDuCycle + p.decouvert!),
    equipementBrut,
    amortissementsEtDepreciations,
    clientsBruts,
    ressourcesDurables,
    fondsDeRoulement,
    besoinsDuCycle,
    dettesDuCycle,
    besoin,
    tresorerie: auCentime(disponible - p.decouvert!),
    /** La part des capitaux propres dans le total du passif (une part : 0,53 pour 53 %). */
    autonomie: capitauxPropres / passif,
    /** L'emprunt rapporté aux capitaux propres. */
    endettement: p.emprunt! / capitauxPropres,
    /** Le bilan fonctionnel de la clôture, pour la garde qui compare le lycée au supérieur. */
    fonctionnel: fo,
  };
}

export type BilanDuLycee = ReturnType<typeof bilanDuLycee>;
