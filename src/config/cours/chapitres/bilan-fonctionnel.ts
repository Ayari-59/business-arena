import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime as auCentimeDeLArene } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { anneeDuCours } from "../monde/annee-du-cours";
import { auCentime, joursCompris } from "../monde/amortissement";
import { cloture, interetsDuPlacement, sommeDesComptes } from "../monde/cloture";
import { EXERCICES_DU_COURS, type FicheDeLExercice } from "../monde/exercice-de-nova";
import { DELAI_CONVENU_DE_CAMPUSTECH } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : BILAN FONCTIONNEL ET BFR (comptabilité générale, palier 4 ; BTS CG, DCG, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le premier
 * exercice de NOVA a une fiche figée (monde/exercice-de-nova.ts), et sa clôture se calcule par le
 * modèle du cours (monde/cloture.ts, `cloture`), travaux d'inventaire et impôt compris. Une évolution
 * du moteur ne change rien ici. Le chapitre se joue chez NOVA seule : c'est la seule entreprise du
 * cours dont l'exercice est tenu en comptabilité, de la création à la clôture (une seule NOVA).
 *
 * L'objet : le bilan comptable du 31 décembre relu par fonction. Les reclassements (amortissements,
 * dépréciation et provision en ressources stables, actif en valeur brute ; intérêts courus de
 * l'emprunt et impôt dû hors exploitation ; TVA née des ventes et des achats en exploitation ; le
 * compte à terme et ses intérêts courus en trésorerie active), puis le fonds de roulement net global,
 * le besoin en fonds de roulement d'exploitation et hors exploitation, la trésorerie nette, et
 * l'égalité FRNG − BFR = TN. Puis ce que l'exercice a changé depuis la création (le fonds de
 * roulement a grandi de la CAF moins le capital remboursé), le BFR normatif en jours de chiffre
 * d'affaires, et ce que coûtent des délais.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, les-reclassements, les-interets-courus, frng, bfr-d-exploitation (la formule est
 *     au repère, la question nomme les chiffres) ;
 *   · autonome : hors-exploitation-et-tresorerie, depuis-la-creation, le-bfr-normatif (ni formule ni
 *     chiffres donnés ; le calcul de la correction montre le chemin) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-variation
 *     avant depuis-la-creation ; predire-la-place-de-marche puis la-place-de-marche (un curseur sur le
 *     délai de reversement des ventes aux particuliers, le fonds de roulement face au besoin) avant
 *     le-bfr-normatif ; predire-le-stock puis le-laboratoire-du-besoin (délais de CampusTech et du
 *     fournisseur, stock, placement ; un graphique de la trésorerie nette selon le délai de
 *     CampusTech, en marches) avant les ratios ;
 *   · expert : les-ratios-de-rotation et le-ratio-et-le-contrat (trois ratios, et la critique d'une
 *     photo du 31 décembre), la-croissance (une variante chiffrée : 20 % de ventes en plus), puis
 *     garder-la-tresorerie et emprunter-pour-garder (emprunter à 5 % pour garder une trésorerie placée
 *     à 3 % : le coût net, puis le jugement) ; et la synthèse.
 *
 * CE QUE LA SIMULATION SUPPOSE (dit à l'élève dans l'intro) : les hypothèses de la fiche (un compte à
 * terme de 12 mois à 3 %, bloqué jusqu'au 6 janvier N+1 ; des particuliers qui paient à la commande ;
 * CampusTech, payée en retard, 80 jours après sa facture pour 60 convenus ; le fournisseur de composants à 22 jours ; aucun investissement après
 * janvier, aucun dividende), et celles du chapitre, des constantes nommées ci-dessous.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA PLACE DE MARCHÉ (hypothèse du cours) : NOVA confierait ses ventes aux particuliers à une place de
 * marché, qui encaisse la commande et la reverse à NOVA quelques jours plus tard, toutes taxes
 * comprises et sans commission. Le cours suppose les ventes étalées également sur 360 jours : la
 * créance du 31 décembre vaut d jours de ventes aux particuliers TTC. Le pari et le BFR normatif
 * prennent un reversement à 30 jours ; le curseur fait varier le délai de 0 à 120 jours.
 */
export const PLACE_DE_MARCHE = { delai: 30, max: 120 } as const;

/**
 * LE STOCK DE LA GAMME (hypothèse du cours) : pour lancer la gamme de N+1 dès janvier, le dirigeant
 * voudrait finir l'exercice avec 3 000 jeux de composants au lieu de 600. Chaque jeu de plus serait
 * acheté en décembre au coût moyen du mois et payé comptant ; sa TVA viendrait en déduction de la
 * déclaration de décembre. Le résultat ne bouge pas (l'achat et la variation de stock se compensent).
 */
export const STOCK_POUR_LA_GAMME = 3_000;

/** Les bornes des leviers du laboratoire : le délai de CampusTech, celui du fournisseur, le stock en jeux. */
export const LEVIERS_DU_LABORATOIRE = {
  campustech: { min: 30, max: 120, pas: 5 },
  fournisseur: { min: 0, max: 60, pas: 1 },
  stock: { min: 0, max: STOCK_POUR_LA_GAMME, pas: 100 },
  placement: { min: 0, pas: 1_000 },
} as const;

/** La solution que montre la correction du laboratoire : CampusTech à 60 jours, le fournisseur à 51 jours. */
export const SOLUTION_DU_LABORATOIRE = { delaiCampusTech: 60, delaiFournisseur: 51 } as const;

/**
 * LA CROISSANCE (hypothèse du cours, reprise par le cas « Vendre plus, financer plus ») : 20 % de
 * chiffre d'affaires en plus l'an prochain, une année de forte croissance pour une petite entreprise.
 * À structure constante (mêmes clients, mêmes délais, même stock en jours), le besoin d'exploitation
 * suit le chiffre d'affaires ; le besoin hors exploitation n'en dépend pas.
 */
export const CROISSANCE_DES_VENTES = 0.2;

/** Le bilan fonctionnel se lit sur un exercice tenu en comptabilité : celui de NOVA. */
export const ENTREPRISES_DU_BILAN_FONCTIONNEL: readonly string[] = ["nova"];

// ─────────────────────────────────────────────────────────────────────────────
// LES ÉCRITURES DU TEXTE
// ─────────────────────────────────────────────────────────────────────────────

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number, decimales = 2) => n.toLocaleString("fr-FR", { maximumFractionDigits: decimales }).replace(/^-/, "−");
/** Un nombre de jours, accordé : « 1 jour », « 8,34 jours ». */
const jours = (n: number) => `${qte(n)} jour${Math.abs(n) >= 2 ? "s" : ""}`;
/** Un montant retranché, sans « − − » : « − 12 000 € » ou « + 1 372,38 € ». */
const moins = (x: number) => (x < 0 ? `+ ${eur(-x)}` : `− ${eur(x)}`);
/** Un montant signé : « + 93 297,07 € », « − 1 372,38 € ». */
const signe = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);
const pct = (t: number) => `${qte(t * 100)} %`;
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « que NOVA », « qu'Escale ». */
const queE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN DE L'EXERCICE, RELU PAR FONCTION
// ─────────────────────────────────────────────────────────────────────────────

/** La fiche de l'exercice du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLExercice => EXERCICES_DU_COURS[c.code]!;

/**
 * Le bilan fonctionnel de l'exercice, et tout ce que le chapitre et son cas en tirent. Les postes se
 * lisent sur les soldes de la clôture (monde/cloture.ts) ; les masses sont celles du modèle, que le
 * chapitre redécompose poste par poste pour l'élève.
 */
export function bilanDeLExercice(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const k = cloture(f);
  const s = k.soldes;
  const fo = k.fonctionnel;
  const credit = (prefixes: readonly string[]) => auCentime(-sommeDesComptes(s, prefixes));
  const debit = (prefixes: readonly string[]) => sommeDesComptes(s, prefixes);

  // Le bilan comptable, poste par poste.
  const postes = {
    ligneBrute: sommeDesComptes(s, ["2"], ["28", "29"]),
    amortissements: credit(["28"]),
    stock: debit(["31"]),
    clientsBruts: debit(["411", "416", "418"]),
    depreciationDesClients: credit(["491"]),
    tvaDeductible: debit(["44586"]),
    chargeConstateeDAvance: debit(["486"]),
    compteATerme: s[f.placement.compte] ?? 0,
    interetsDuPlacement: debit(["5088"]),
    banque: debit(["512"]),
    capital: credit(["101"]),
    resultat: k.resultatNet,
    provision: credit(["15"]),
    emprunt: credit(["164"]),
    interetsCourus: credit(["1688"]),
    fournisseurs: credit(["401", "408"]),
    dettesSociales: credit(["42", "43", "442"]),
    tvaADecaisser: credit(["4455", "44587"]),
    impot: credit(["444"]),
    produitConstateDAvance: credit(["487"]),
  };
  const placement = auCentime(postes.compteATerme + postes.interetsDuPlacement);
  const capitauxPropres = auCentime(postes.capital + postes.resultat);
  const amortissementsEtDepreciations = auCentime(postes.amortissements + postes.depreciationDesClients);
  const caHt = k.sig.productionVendue;

  // La création, au soir du 6 janvier : l'apport et le prêt reçus, la ligne payée, le placement fait.
  const banqueDeDepart = auCentime(f.apport.montant + f.pret.capital - f.equipement.ttc - f.placement.montant);
  const creation = {
    capital: f.apport.montant,
    emprunt: f.pret.capital,
    ligne: f.equipement.ht,
    tvaDeLaLigne: f.equipement.tva,
    placement: f.placement.montant,
    banque: banqueDeDepart,
    fondsDeRoulement: auCentime(f.apport.montant + f.pret.capital - f.equipement.ht),
    besoin: f.equipement.tva,
    tresorerie: auCentime(banqueDeDepart + f.placement.montant),
  };
  const rembourse = auCentime(f.pret.capital - postes.emprunt);
  const caf = k.caf.additive;

  // Les ventes aux particuliers, toutes taxes comprises : ce que la place de marché garderait.
  const ventesAuxParticuliersTtc = auCentime(f.ventesAuxParticuliers.reduce((t, q) => t + q, 0) * f.prixDeLEnceinte * (1 + f.tauxDeTva));
  const unJourDeParticuliers = auCentime(ventesAuxParticuliersTtc / 360);

  // Les ratios de rotation : sur le chiffre d'affaires TTC, les achats de composants TTC, la consommation.
  const achatsDeComposants = debit(["601"]);
  // La consommation : les achats, moins la variation du stock (le stock final est au crédit du 6031).
  const consommationDeComposants = auCentime(achatsDeComposants + debit(["6031"]));

  // Emprunter à 5 % pour garder une trésorerie placée à 3 % : l'exercice, au taux marginal d'impôt.
  const coutDeLEmprunt = debit(["6611"]);
  const placementDuPret = interetsDuPlacement(f.pret.capital, f.placement.tauxAnnuel, f.placement.date, f.cloture);
  const tauxMarginal = k.impot.baseAuTauxNormal > 0 ? f.impot.tauxNormal : f.impot.tauxReduit;
  const coutNetAvantImpot = auCentime(coutDeLEmprunt - placementDuPret);

  return {
    f,
    k,
    entreprise: f.entreprise,
    postes,
    placement,
    capitauxPropres,
    amortissementsEtDepreciations,
    emploisStables: fo.emploisStables,
    ressourcesStables: fo.ressourcesStables.total,
    fondsDeRoulement: fo.fondsDeRoulement,
    actifDExploitation: fo.actifDExploitation,
    passifDExploitation: fo.passifDExploitation,
    besoinDExploitation: fo.besoinDExploitation,
    besoinHorsExploitation: fo.besoinHorsExploitation,
    besoin: fo.besoinEnFondsDeRoulement,
    tresorerieActive: fo.tresorerieActive,
    tresoreriePassive: fo.tresoreriePassive,
    tresorerieNette: fo.tresorerieNette,
    creation,
    rembourse,
    caf,
    variationDuFondsDeRoulement: auCentime(fo.fondsDeRoulement - creation.fondsDeRoulement),
    variationDuBesoin: auCentime(fo.besoinEnFondsDeRoulement - creation.besoin),
    variationDeLaTresorerie: auCentime(fo.tresorerieNette - creation.tresorerie),
    caHt,
    caTtc: auCentime(caHt * (1 + f.tauxDeTva)),
    ventesAuxParticuliersTtc,
    unJourDeParticuliers,
    // Le BFR normatif : chaque poste en jours de chiffre d'affaires hors taxes.
    besoinEnJours: auCentime((fo.besoinDExploitation / caHt) * 360),
    coefficientDesParticuliers: Math.round((ventesAuxParticuliersTtc / caHt) * 10_000) / 10_000,
    placeDeMarcheEnJours: auCentime((PLACE_DE_MARCHE.delai * ventesAuxParticuliersTtc) / caHt),
    // Les ratios de rotation.
    delaiClients: auCentime((postes.clientsBruts * 360) / (caHt * (1 + f.tauxDeTva))),
    achatsDeComposantsTtc: auCentime(achatsDeComposants * (1 + f.tauxDeTva)),
    delaiFournisseurs: auCentime((postes.fournisseurs * 360) / (achatsDeComposants * (1 + f.tauxDeTva))),
    consommationDeComposants,
    rotationDuStock: auCentime((postes.stock * 360) / consommationDeComposants),
    // La croissance, à structure constante.
    caApresCroissance: auCentime(caHt * (1 + CROISSANCE_DES_VENTES)),
    besoinDExploitationApres: auCentime(fo.besoinDExploitation * (1 + CROISSANCE_DES_VENTES)),
    supplementDeBesoin: auCentime(auCentime(fo.besoinDExploitation * (1 + CROISSANCE_DES_VENTES)) - fo.besoinDExploitation),
    // Emprunter pour garder la trésorerie.
    coutDeLEmprunt,
    joursDuPlacement: joursCompris(f.placement.date, f.cloture),
    placementDuPret,
    tauxMarginal,
    coutNetAvantImpot,
    coutNetApresImpot: auCentime(coutNetAvantImpot * (1 - tauxMarginal)),
    /** Le coût de l'emprunt jugé à l'erreur classique : 2 points d'écart sur le capital emprunté, une année pleine, avant impôt. */
    ecartDeTauxSurLeCapital: auCentime(f.pret.capital * (f.pret.tauxAnnuel - f.placement.tauxAnnuel)),
  };
}

export type BilanDeLExercice = ReturnType<typeof bilanDeLExercice>;

/** La place de marché à d jours : sa créance, le besoin, la trésorerie nette et le compte courant. */
export function placeDeMarche(x: BilanDeLExercice, delai: number) {
  const creance = auCentime((x.ventesAuxParticuliersTtc * delai) / 360);
  const besoin = auCentime(x.besoin + creance);
  return { creance, besoin, tresorerieNette: auCentime(x.fondsDeRoulement - besoin), compteCourant: auCentime(x.postes.banque - creance) };
}

/** Le délai de reversement le plus long qui garde une grandeur (la trésorerie nette, le compte courant) à zéro ou au-dessus. */
const delaiLePlusLong = (x: BilanDeLExercice, montant: number) => Math.floor((montant * 360) / x.ventesAuxParticuliersTtc + 1e-9);

/** Le délai le plus long de la place de marché sans trésorerie nette négative, et sans compte courant négatif. */
export function delaisDeLaPlaceDeMarche(x: BilanDeLExercice) {
  return { tresorerieNette: delaiLePlusLong(x, x.tresorerieNette), compteCourant: delaiLePlusLong(x, x.postes.banque) };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE LABORATOIRE : LES DÉLAIS, LE STOCK, LE PLACEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * La fiche avec une autre somme placée le 6 janvier : le compte à terme change, le compte courant
 * d'autant ; les intérêts, l'impôt et le résultat suivent par le modèle. La fiche n'est pas touchée.
 */
function ficheAvecLePlacement(f: FicheDeLExercice, montant: number): FicheDeLExercice {
  const ecart = auCentime(f.placement.montant - montant);
  return {
    ...f,
    placement: { ...f.placement, montant },
    balanceAvantInventaire: f.balanceAvantInventaire.map((l) => {
      if (l.compte === f.placement.compte) return { ...l, debit: montant };
      if (l.compte === "512") return { ...l, debit: auCentime(l.debit + ecart) };
      return l;
    }),
  };
}

const CLOTURES_DU_LABORATOIRE = new Map<string, ReturnType<typeof cloture>>();

/** La clôture à une position des délais et du placement (mise de côté : le graphique la lit souvent). */
function clotureDuLaboratoire(f: FicheDeLExercice, delaiCampusTech: number, delaiFournisseur: number, placement: number) {
  const cle = `${f.code}|${delaiCampusTech}|${delaiFournisseur}|${placement}`;
  let k = CLOTURES_DU_LABORATOIRE.get(cle);
  if (!k) {
    const fiche = placement === f.placement.montant ? f : ficheAvecLePlacement(f, placement);
    k = cloture(fiche, { delaiCampusTech, delaiFournisseur });
    CLOTURES_DU_LABORATOIRE.set(cle, k);
  }
  return k;
}

/** Les jeux de composants en stock au 31 décembre, selon la fiche de stock de décembre. */
const jeuxEnStock = (f: FicheDeLExercice) => f.composantsDeDecembre.mouvements.reduce((t, m) => t + (m.sens === "entree" ? m.quantite : -m.quantite), f.composantsDeDecembre.initial.quantite);

/** La position du laboratoire : les délais en jours, le stock en jeux, le placement en euros. */
export type PositionDuLaboratoire = Readonly<Record<string, number>>;

/** Le bilan fonctionnel à une position du laboratoire. */
export function laboratoireDuBesoin(x: BilanDeLExercice, p: PositionDuLaboratoire) {
  const k = clotureDuLaboratoire(x.f, p.delaiCampusTech!, p.delaiFournisseur!, p.placement!);
  const fo = k.fonctionnel;
  const quantiteDeDepart = jeuxEnStock(x.f);
  const coutMoyen = auCentime(x.postes.stock / quantiteDeDepart);
  const stockEnPlus = auCentime((p.stock! - quantiteDeDepart) * coutMoyen);
  // Payé comptant TVA comprise ; la TVA de plus vient en déduction de la TVA à décaisser.
  const paye = auCentime(stockEnPlus * (1 + x.f.tauxDeTva));
  return {
    stock: auCentime(x.postes.stock + stockEnPlus),
    coutMoyen,
    quantiteDeDepart,
    paye,
    fondsDeRoulement: fo.fondsDeRoulement,
    besoinDExploitation: auCentime(fo.besoinDExploitation + paye),
    besoin: auCentime(fo.besoinEnFondsDeRoulement + paye),
    tresorerieNette: auCentime(fo.tresorerieNette - paye),
    compteCourant: auCentime((k.soldes["512"] ?? 0) - paye),
    placement: auCentime((k.soldes[x.f.placement.compte] ?? 0) + (k.soldes[x.f.placement.compteDesInteretsCourus] ?? 0)),
  };
}

/** Le départ du laboratoire : la fiche. */
export function departDuLaboratoire(x: BilanDeLExercice): PositionDuLaboratoire {
  return { delaiCampusTech: x.f.campustech.delai, delaiFournisseur: x.f.fournisseur.delai, stock: jeuxEnStock(x.f), placement: x.f.placement.montant };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

/** Le bilan comptable du 31 décembre : l'actif en brut, amortissements et net ; le passif, en net. */
export function bilanComptableDuTrenteEtUn(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = bilanDeLExercice(c);
  const p = x.postes;
  const actif = (libelle: string, brut: number, amortissements: number) => ({ libelle, valeurs: [eur(brut), amortissements ? eur(amortissements) : "", eur(auCentime(brut - amortissements))] });
  const passif = (libelle: string, montant: number) => ({ libelle, valeurs: ["", "", eur(montant)] });
  return {
    titre: `Le bilan comptable ${dE(x.entreprise)} au 31 décembre`,
    colonnes: ["Brut", "Amortissements et dépréciations", "Net"],
    lignes: [
      actif("Ligne de montage", p.ligneBrute, p.amortissements),
      actif("Stock de composants", p.stock, 0),
      actif("Clients (CampusTech, Sonora, facture à établir)", p.clientsBruts, p.depreciationDesClients),
      actif("TVA déductible sur la facture non parvenue", p.tvaDeductible, 0),
      actif("Charge constatée d'avance", p.chargeConstateeDAvance, 0),
      actif("Compte à terme et ses intérêts courus", x.placement, 0),
      actif("Banque (le compte courant)", p.banque, 0),
      { libelle: "Total de l'actif", valeurs: ["", "", eur(x.k.bilan.totalActif)] },
      passif("Capital", p.capital),
      passif("Résultat de l'exercice", p.resultat),
      passif("Provision pour litige", p.provision),
      passif("Emprunt, capital restant dû", p.emprunt),
      passif("Intérêts courus de l'emprunt", p.interetsCourus),
      passif("Fournisseurs et facture non parvenue", p.fournisseurs),
      passif("Dettes sociales (URSSAF, retraite, prélèvement à la source)", p.dettesSociales),
      passif("TVA à décaisser (déclaration de décembre, facture à établir)", p.tvaADecaisser),
      passif("Impôt sur les sociétés dû", p.impot),
      passif("Produit constaté d'avance", p.produitConstateDAvance),
      { libelle: "Total du passif", valeurs: ["", "", eur(x.k.bilan.totalPassif)] },
    ],
  };
}

/** La création et la clôture, côte à côte : ce que l'élève compare. */
function deLaCreationALaCloture(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = bilanDeLExercice(c);
  const p = x.postes;
  const deux = (libelle: string, a: number | null, b: number | null) => ({ libelle, valeurs: [a === null ? "" : eur(a), b === null ? "" : eur(b)] });
  return {
    titre: `${x.entreprise}, de la création à la clôture`,
    colonnes: ["6 janvier, au soir", "31 décembre"],
    lignes: [
      deux("Capital et résultat", x.creation.capital, x.capitauxPropres),
      deux("Amortissements, dépréciations et provisions", 0, auCentime(x.amortissementsEtDepreciations + p.provision)),
      deux("Emprunt, capital restant dû", x.creation.emprunt, p.emprunt),
      deux("Ligne de montage, valeur brute", x.creation.ligne, p.ligneBrute),
      deux("TVA de la ligne, à récupérer (hors exploitation)", x.creation.tvaDeLaLigne, 0),
      deux("Besoin en fonds de roulement", null, x.besoin),
      deux("Compte à terme (et ses intérêts courus)", x.creation.placement, x.placement),
      deux("Banque (le compte courant)", x.creation.banque, p.banque),
      deux("Capacité d'autofinancement de l'exercice", null, x.caf),
    ],
  };
}

const intro = (x: BilanDeLExercice) => {
  const f = x.f;
  return [
    `Ce chapitre se joue dans la simulation du cours, chez ${x.entreprise}, sur son premier exercice. La création, la première semaine de janvier : ${eur(f.apport.montant)} d'apport, ${eur(f.pret.capital)} empruntés à ${pct(f.pret.tauxAnnuel)} sur ${f.pret.dureeAns} ans, une ligne de montage à ${eur(f.equipement.ht)} hors taxes, et ${eur(f.placement.montant)} placés le 6 janvier sur un compte à terme. Puis une année de ventes, et la clôture du 31 décembre, travaux d'inventaire et impôt compris. Voici le bilan comptable qui en sort.`,
    `La simulation suppose : un compte à terme de ${f.placement.dureeMois} mois à ${pct(f.placement.tauxAnnuel)}, bloqué jusqu'au 6 janvier N+1 ; des particuliers qui paient à la commande ; CampusTech, qui doit payer à ${DELAI_CONVENU_DE_CAMPUSTECH} jours et paie en retard, ${f.campustech.delai} jours après sa facture, le fournisseur de composants à ${f.fournisseur.delai} jours ; aucun investissement après janvier, aucun dividende. Les expériences du chapitre ajoutent leurs propres hypothèses, dites à chaque fois.`,
    "Le bilan comptable range par nature, en valeurs nettes. Le bilan fonctionnel range par fonction, en valeurs brutes, sur trois étages. En haut, le cycle d'investissement et de financement : les emplois stables (les immobilisations, à leur valeur brute) et les ressources stables (les capitaux propres, les amortissements, les dépréciations et les provisions, les dettes financières). Au milieu, le cycle d'exploitation : les stocks, les clients, les fournisseurs, et ce qui ne relève pas de l'exploitation à part. En bas, la trésorerie : la banque et les placements à moins d'un an, moins les découverts.",
  ];
};

export const BILAN_FONCTIONNEL: Chapitre = {
  code: "bilan-fonctionnel-et-bfr",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [
    "BTS CG P6 · Analyse de la situation financière",
    "DCG UE6 · Finance d'entreprise",
    "BUT GEA · Évaluer l'activité de l'organisation",
  ],
  titre: "Bilan fonctionnel et BFR",
  accroche:
    "Le bilan de NOVA au 31 décembre relu par fonction : ce qui finance durablement l'entreprise, ce que son exploitation retient, ce qui reste en trésorerie. Pourquoi la trésorerie nette vaut toujours l'un moins l'autre, ce que coûtent des délais, et pourquoi une trésorerie nette n'est pas une trésorerie libre.",
  objectifs: [
    "Reclasser un bilan par fonction : amortissements, dépréciations et provisions, intérêts courus, impôt dû, placements",
    "Calculer le fonds de roulement net global, le besoin en fonds de roulement d'exploitation et hors exploitation, la trésorerie nette",
    "Expliquer la variation du fonds de roulement depuis la création par la CAF et le remboursement de l'emprunt",
    "Exprimer le besoin en fonds de roulement en jours de chiffre d'affaires, et chiffrer l'effet d'un délai ou d'une croissance",
    "Calculer et critiquer les ratios de rotation, et juger une trésorerie gardée grâce à un emprunt",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_BILAN_FONCTIONNEL,
    pourquoi: "le bilan fonctionnel se lit sur un exercice tenu en comptabilité de la création à la clôture, celui de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le bilan, relu par fonction",
      notions: ["balance_sheet"],
      tableau: bilanComptableDuTrenteEtUn,
      texte: (c) => intro(bilanDeLExercice(c)),
      repere: () =>
        "Fonds de roulement net global = ressources stables − emplois stables. Besoin en fonds de roulement = actif circulant d'exploitation et hors exploitation − dettes d'exploitation et hors exploitation. Trésorerie nette = trésorerie active − trésorerie passive = fonds de roulement − besoin en fonds de roulement.",
    },
    {
      id: "les-reclassements",
      objectifs: [0],
      type: "tri",
      titre: "Les reclassements",
      notions: ["balance_sheet", "frng", "bfr"],
      tableau: bilanComptableDuTrenteEtUn,
      question: () =>
        "Rangez chaque poste à son étage du bilan fonctionnel. Les immobilisations y sont en valeur brute ; tout ce qui finance durablement l'entreprise monte en ressources stables ; ce qui ne relève ni du financement durable ni du cycle des ventes et des achats va hors exploitation ; la trésorerie, c'est ce qui est disponible ou le sera dans l'année.",
      categories: [
        { code: "ressources", libelle: "Ressources stables" },
        { code: "emplois", libelle: "Emplois stables" },
        { code: "exploitation", libelle: "Exploitation" },
        { code: "hors-exploitation", libelle: "Hors exploitation" },
        { code: "tresorerie", libelle: "Trésorerie" },
      ],
      elements: (c) => {
        const x = bilanDeLExercice(c);
        const p = x.postes;
        return [
          { libelle: "Amortissements de la ligne de montage", montant: p.amortissements, categorie: "ressources", pourquoi: "La ligne reste à l'actif pour sa valeur brute ; son usure, une charge qui n'est pas sortie de la banque, finance l'entreprise : une ressource propre." },
          { libelle: "Dépréciation de la créance de Sonora", montant: p.depreciationDesClients, categorie: "ressources", pourquoi: "La créance reste au besoin d'exploitation pour son montant brut ; sa dépréciation rejoint les amortissements dans les ressources stables." },
          { libelle: "Provision pour litige", montant: p.provision, categorie: "ressources", pourquoi: "Tant que le litige n'est pas jugé, la provision reste dans l'entreprise : le bilan fonctionnel la range avec les capitaux propres." },
          { libelle: "Emprunt, capital restant dû", montant: p.emprunt, categorie: "ressources", pourquoi: "Il se rembourse sur des années, selon un échéancier : une ressource stable, sans ses intérêts courus." },
          { libelle: "Intérêts courus de l'emprunt", montant: p.interetsCourus, categorie: "hors-exploitation", pourquoi: "Ils seront payés le 3 janvier avec l'échéance : une dette à court terme, née du financement et non des ventes. Elle sort des ressources stables." },
          { libelle: "Ligne de montage, valeur brute", montant: p.ligneBrute, categorie: "emplois", pourquoi: "Un investissement durable : un emploi stable, pour sa valeur d'origine." },
          { libelle: "TVA à décaisser", montant: p.tvaADecaisser, categorie: "exploitation", pourquoi: "Elle naît des ventes et des achats du mois : elle suit le cycle d'exploitation. Seule la TVA d'un investissement, comme celle de la ligne en janvier, se range hors exploitation." },
          { libelle: "Impôt sur les sociétés dû", montant: p.impot, categorie: "hors-exploitation", pourquoi: "Il naît du bénéfice de l'année, pas du cycle des ventes et des achats : hors exploitation." },
          { libelle: "Charge constatée d'avance", montant: p.chargeConstateeDAvance, categorie: "exploitation", pourquoi: "L'assurance payée pour N+1 : une charge d'exploitation payée d'avance, au besoin d'exploitation." },
          { libelle: "Produit constaté d'avance", montant: p.produitConstateDAvance, categorie: "exploitation", pourquoi: "Des enceintes facturées et pas encore livrées : une dette du cycle des ventes." },
          { libelle: "Compte à terme et ses intérêts courus", montant: x.placement, categorie: "tresorerie", pourquoi: "Un placement d'un an au plus, qui revient en banque à l'échéance, intérêts compris : de la trésorerie active." },
        ];
      },
      explication: (c) => {
        const x = bilanDeLExercice(c);
        return [
          `Trois reclassements font tout le bilan fonctionnel. L'actif revient en valeurs brutes, et les ${eur(auCentime(x.amortissementsEtDepreciations + x.postes.provision))} d'amortissements, de dépréciation et de provision montent en ressources stables. Les intérêts courus quittent l'emprunt pour le hors exploitation. Le placement à moins d'un an descend en trésorerie.`,
        ];
      },
    },
    {
      id: "les-interets-courus",
      objectifs: [0],
      type: "choix",
      titre: "Deux intérêts courus, deux étages",
      notions: ["balance_sheet", "net_treasury"],
      question: (c) => {
        const x = bilanDeLExercice(c);
        return `Au 31 décembre, ${x.entreprise} doit ${eur(x.postes.interetsCourus)} d'intérêts courus sur son emprunt, et la banque lui doit ${eur(x.postes.interetsDuPlacement)} d'intérêts courus sur son compte à terme. Dans le bilan fonctionnel, pourquoi ne vont-ils pas au même étage ?`;
      },
      options: (c) => {
        const x = bilanDeLExercice(c);
        return [
          {
            texte: "Ceux du placement suivent le placement en trésorerie ; ceux de l'emprunt, dus le 3 janvier, vont hors exploitation",
            juste: true,
            retour: `C'est cela. Le compte à terme échoit le 6 janvier : ${eur(x.placement)}, intérêts compris, reviendront en banque dans l'année ; c'est de la trésorerie active. Les intérêts de l'emprunt seront payés avec l'échéance du 3 janvier : ils ne financent pas durablement, ils sortent des ressources stables et vont au passif hors exploitation.`,
          },
          {
            texte: "Ils vont tous deux hors exploitation : ce sont des intérêts, des opérations financières",
            juste: false,
            retour: `Non pour ceux du placement : ils sont attachés au compte à terme, qui revient en banque le 6 janvier. Les séparer du placement couperait en deux une même trésorerie de ${eur(x.placement)}.`,
          },
          {
            texte: "Chacun suit son capital : l'emprunt en ressources stables, le placement en trésorerie",
            juste: false,
            retour: `Non pour ceux de l'emprunt : ${eur(x.postes.interetsCourus)} payés le 3 janvier ne financent rien durablement. Les laisser avec l'emprunt gonfle les ressources stables, donc le fonds de roulement.`,
          },
          {
            texte: `Le compte à terme et ses intérêts sont un emploi stable : l'argent est bloqué ${x.f.placement.dureeMois} mois`,
            juste: false,
            retour: "Non : bloqué jusqu'au 6 janvier, il sera disponible dans l'année. Un placement à moins d'un an, destiné à servir de réserve, est de la trésorerie active ; seul un placement destiné à rester durablement serait un emploi stable (un titre immobilisé).",
          },
        ];
      },
    },
    {
      id: "frng",
      objectifs: [1],
      type: "montants",
      titre: "Le fonds de roulement net global",
      notions: ["frng"],
      tableau: bilanComptableDuTrenteEtUn,
      question: (c) => {
        const x = bilanDeLExercice(c);
        const p = x.postes;
        return `Au 31 décembre. Les ressources stables : les capitaux propres (le capital, ${eur(p.capital)}, et le résultat, ${eur(p.resultat)}), les amortissements et les dépréciations (${eur(p.amortissements)} sur la ligne, ${eur(p.depreciationDesClients)} sur la créance de Sonora), la provision pour litige (${eur(p.provision)}) et l'emprunt sans ses intérêts courus (${eur(p.emprunt)}). Les emplois stables : la ligne de montage à sa valeur brute, ${eur(x.emploisStables)}. Calculez les ressources stables, puis le fonds de roulement net global.`;
      },
      champs: (c) => {
        const x = bilanDeLExercice(c);
        const p = x.postes;
        return [
          {
            libelle: "Ressources stables",
            attendu: x.ressourcesStables,
            calcul: `${eur(p.capital)} + ${eur(p.resultat)} + ${eur(p.amortissements)} + ${eur(p.depreciationDesClients)} + ${eur(p.provision)} + ${eur(p.emprunt)} = ${eur(x.ressourcesStables)}`,
          },
          { libelle: "Fonds de roulement net global", attendu: x.fondsDeRoulement, calcul: `${eur(x.ressourcesStables)} − ${eur(x.emploisStables)} = ${eur(x.fondsDeRoulement)}` },
        ];
      },
      explication: (c) => {
        const x = bilanDeLExercice(c);
        return [
          `Les ressources stables couvrent la ligne de montage, et il en reste ${eur(x.fondsDeRoulement)} pour financer le cycle d'exploitation et la trésorerie.`,
          "Les amortissements, la dépréciation et la provision sont des ressources : des charges qui ne sont pas sorties de la banque, de l'argent resté dans l'entreprise. C'est pourquoi l'actif se lit en brut : sinon on les compterait deux fois.",
        ];
      },
    },
    {
      id: "bfr-d-exploitation",
      objectifs: [1],
      type: "montants",
      titre: "Le besoin en fonds de roulement d'exploitation",
      notions: ["bfr", "payment_terms"],
      tableau: bilanComptableDuTrenteEtUn,
      question: (c) => {
        const x = bilanDeLExercice(c);
        const p = x.postes;
        return `L'actif d'exploitation, en valeurs brutes : le stock (${eur(p.stock)}), les créances clients avant leur dépréciation (${eur(p.clientsBruts)}, facture à établir comprise), la TVA déductible de la facture non parvenue (${eur(p.tvaDeductible)}) et la charge constatée d'avance (${eur(p.chargeConstateeDAvance)}). Le passif d'exploitation : les fournisseurs et la facture non parvenue (${eur(p.fournisseurs)}), les dettes sociales (${eur(p.dettesSociales)}), la TVA à décaisser (${eur(p.tvaADecaisser)}) et le produit constaté d'avance (${eur(p.produitConstateDAvance)}). Calculez l'actif d'exploitation, le passif d'exploitation, puis le besoin en fonds de roulement d'exploitation.`;
      },
      champs: (c) => {
        const x = bilanDeLExercice(c);
        const p = x.postes;
        return [
          { libelle: "Actif d'exploitation", attendu: x.actifDExploitation, calcul: `${eur(p.stock)} + ${eur(p.clientsBruts)} + ${eur(p.tvaDeductible)} + ${eur(p.chargeConstateeDAvance)} = ${eur(x.actifDExploitation)}` },
          {
            libelle: "Passif d'exploitation",
            attendu: x.passifDExploitation,
            calcul: `${eur(p.fournisseurs)} + ${eur(p.dettesSociales)} + ${eur(p.tvaADecaisser)} + ${eur(p.produitConstateDAvance)} = ${eur(x.passifDExploitation)}`,
          },
          { libelle: "Besoin en fonds de roulement d'exploitation", attendu: x.besoinDExploitation, calcul: `${eur(x.actifDExploitation)} − ${eur(x.passifDExploitation)} = ${eur(x.besoinDExploitation)}` },
        ];
      },
      explication: (c) => {
        const x = bilanDeLExercice(c);
        return [
          `Le cycle d'exploitation ${dE(x.entreprise)} immobilise ${eur(x.besoinDExploitation)} : ce qu'il a avancé aux clients et au stock, moins ce que les fournisseurs, l'État et les salariés lui font crédit. C'est peu, pour ${eur(x.caHt)} de chiffre d'affaires : les particuliers paient à la commande.`,
        ];
      },
    },
    {
      id: "hors-exploitation-et-tresorerie",
      objectifs: [1],
      type: "montants",
      titre: "Hors exploitation, et la trésorerie nette",
      notions: ["bfr", "net_treasury"],
      tableau: bilanComptableDuTrenteEtUn,
      question: () =>
        "Sans les chiffres cette fois : ils sont dans le bilan. Calculez le besoin en fonds de roulement hors exploitation (négatif quand c'est une ressource), le besoin en fonds de roulement total, la trésorerie nette par le bas du bilan, puis vérifiez-la par le haut : le fonds de roulement moins le besoin.",
      champs: (c) => {
        const x = bilanDeLExercice(c);
        const p = x.postes;
        return [
          {
            libelle: "Besoin en fonds de roulement hors exploitation",
            attendu: x.besoinHorsExploitation,
            calcul: `${eur(x.k.fonctionnel.actifHorsExploitation)} − (${eur(p.impot)} d'impôt dû + ${eur(p.interetsCourus)} d'intérêts courus) = ${eur(x.besoinHorsExploitation)}`,
          },
          { libelle: "Besoin en fonds de roulement", attendu: x.besoin, calcul: `${eur(x.besoinDExploitation)} ${moins(-x.besoinHorsExploitation)} = ${eur(x.besoin)}` },
          {
            libelle: "Trésorerie nette, par la trésorerie",
            attendu: x.tresorerieNette,
            calcul: `${eur(p.banque)} + ${eur(p.compteATerme)} + ${eur(p.interetsDuPlacement)}${x.tresoreriePassive > 0 ? ` − ${eur(x.tresoreriePassive)}` : ""} = ${eur(x.tresorerieNette)}`,
          },
          { libelle: "Fonds de roulement − besoin en fonds de roulement", attendu: auCentime(x.fondsDeRoulement - x.besoin), calcul: `${eur(x.fondsDeRoulement)} ${moins(x.besoin)} = ${eur(auCentime(x.fondsDeRoulement - x.besoin))}` },
        ];
      },
      explication: (c) => {
        const x = bilanDeLExercice(c);
        return [
          "Les deux calculs tombent sur le même chiffre, et c'est toujours le cas : le bilan s'équilibre, et la trésorerie est ce que le fonds de roulement laisse une fois le besoin financé.",
          `Le hors exploitation est une ressource de ${eur(-x.besoinHorsExploitation)} : l'impôt et les intérêts sont dus, pas encore payés. Une ressource à quelques semaines : en janvier et en mai, elle sortira de la trésorerie.`,
        ];
      },
    },
    {
      id: "predire-la-variation",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la trésorerie de l'année",
      notions: ["net_treasury", "frng"],
      question: (c) => {
        const x = bilanDeLExercice(c);
        return `Avant de calculer, pariez. Sur l'exercice, ${x.entreprise} a dégagé ${eur(x.postes.resultat)} de résultat net et remboursé ${eur(x.rembourse)} d'emprunt ; elle n'a rien investi après janvier. De la création au 31 décembre, sa trésorerie nette a augmenté…`;
      },
      options: (c) => {
        const x = bilanDeLExercice(c);
        const voir = "Faites le compte à l'étape suivante : la création et la clôture, côte à côte.";
        const v = x.variationDeLaTresorerie;
        const plus = v > x.postes.resultat;
        const diminue = v === auCentime(x.postes.resultat - x.rembourse);
        const pari = (juste: boolean) => `${juste ? "Bon pari." : "Pari à vérifier."} ${voir}`;
        return [
          { texte: "De plus que le résultat net", juste: plus, retour: pari(plus) },
          { texte: "Du résultat net moins le capital remboursé", juste: !plus && diminue, retour: pari(!plus && diminue) },
          { texte: "De moins que le résultat net", juste: !plus && !diminue, retour: pari(!plus && !diminue) },
        ];
      },
    },
    {
      id: "depuis-la-creation",
      objectifs: [2],
      type: "montants",
      titre: "De la création à la clôture",
      notions: ["frng", "bfr", "net_treasury"],
      tableau: deLaCreationALaCloture,
      question: () =>
        "Le 6 janvier au soir, la ligne est payée et le placement fait. Retrouvez le fonds de roulement et le besoin en fonds de roulement de ce jour-là, puis ce que l'exercice a changé : la variation du fonds de roulement, du besoin et de la trésorerie nette. Négatif pour une baisse.",
      champs: (c) => {
        const x = bilanDeLExercice(c);
        const k = x.creation;
        return [
          { libelle: "Fonds de roulement au 6 janvier", attendu: k.fondsDeRoulement, calcul: `${eur(k.capital)} + ${eur(k.emprunt)} − ${eur(k.ligne)} = ${eur(k.fondsDeRoulement)}` },
          { libelle: "Besoin en fonds de roulement au 6 janvier", attendu: k.besoin, calcul: `la TVA de la ligne, à récupérer : ${eur(k.besoin)}, hors exploitation` },
          { libelle: "Variation du fonds de roulement", attendu: x.variationDuFondsDeRoulement, calcul: `${eur(x.fondsDeRoulement)} − ${eur(k.fondsDeRoulement)} = ${signe(x.variationDuFondsDeRoulement)}` },
          { libelle: "Variation du besoin en fonds de roulement", attendu: x.variationDuBesoin, calcul: `${eur(x.besoin)} − ${eur(k.besoin)} = ${signe(x.variationDuBesoin)}` },
          {
            libelle: "Variation de la trésorerie nette",
            attendu: x.variationDeLaTresorerie,
            calcul: `${signe(x.variationDuFondsDeRoulement)} − (${signe(x.variationDuBesoin)}) = ${signe(x.variationDeLaTresorerie)}, soit ${eur(x.tresorerieNette)} − ${eur(k.tresorerie)}`,
          },
        ];
      },
      explication: (c) => {
        const x = bilanDeLExercice(c);
        return [
          `Le fonds de roulement a grandi de la capacité d'autofinancement, ${eur(x.caf)}, moins le capital remboursé, ${eur(x.rembourse)} : ${eur(x.caf)} − ${eur(x.rembourse)} = ${eur(auCentime(x.caf - x.rembourse))}. Aucun investissement, aucun dividende, aucun apport ni emprunt nouveau ne s'y ajoutent.`,
          `La trésorerie a gagné ${eur(x.variationDeLaTresorerie)}, plus que le résultat net (${eur(x.postes.resultat)}) : la CAF y ajoute les charges qui ne sortent pas (la dotation, la dépréciation, la provision), et le besoin ${x.variationDuBesoin < 0 ? `a baissé de ${eur(-x.variationDuBesoin)}, la TVA de la ligne récupérée valant plus que le besoin de fin d'année` : `a grandi de ${eur(x.variationDuBesoin)}`}. Variation de la trésorerie = variation du fonds de roulement − variation du besoin.`,
        ];
      },
    },
    {
      id: "predire-la-place-de-marche",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur la place de marché",
      notions: ["bfr", "payment_terms", "receivables_financing"],
      question: (c) => {
        const x = bilanDeLExercice(c);
        return `Les particuliers paient aujourd'hui à la commande. Supposez ${queE(x.entreprise)} confie ces ventes à une place de marché, qui encaisse les commandes et les lui reverse à ${PLACE_DE_MARCHE.delai} jours, sans commission. Au 31 décembre…`;
      },
      options: () => {
        const voir = "Faites varier le délai de reversement à l'étape suivante : le graphique montre ce qui bouge, et ce qui ne bouge pas.";
        return [
          { texte: "Le fonds de roulement ne bouge pas ; le besoin grossit, et la trésorerie baisse d'autant", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Le fonds de roulement baisse avec la trésorerie, le besoin ne bouge pas", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Rien ne bouge : l'argent arrive quand même, ${PLACE_DE_MARCHE.delai} jours plus tard`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-place-de-marche",
      objectifs: [3],
      type: "curseur",
      titre: "La place de marché qui reverse à d jours",
      notions: ["bfr", "payment_terms", "net_treasury"],
      question: (c) => {
        const x = bilanDeLExercice(c);
        return `Faites varier le délai de reversement de la place de marché, de 0 à ${PLACE_DE_MARCHE.max} jours. Le cours suppose les ventes aux particuliers (${eur(x.ventesAuxParticuliersTtc)} toutes taxes comprises sur l'année) étalées également sur 360 jours. Une droite donne le fonds de roulement, l'autre le besoin en fonds de roulement. Jusqu'à quel délai la trésorerie nette reste-t-elle positive ou nulle ? Placez le curseur sur le délai le plus long, au jour près.`;
      },
      grandeur: () => ({ libelle: "Délai de reversement de la place de marché", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => {
        const x = bilanDeLExercice(c);
        return { attendu: delaisDeLaPlaceDeMarche(x).tresorerieNette, max: PLACE_DE_MARCHE.max };
      },
      zones: ["Trésorerie nette positive", "Trésorerie nette négative"],
      rates: () => ({
        dessous: "Plus long, la trésorerie nette reste positive : cherchez le délai le plus long.",
        dessus: "À ce délai, le besoin dépasse le fonds de roulement : la trésorerie nette passe sous zéro.",
      }),
      montrer: "Montrer le délai",
      lecture: (c, d) => {
        const x = bilanDeLExercice(c);
        const m = placeDeMarche(x, d);
        return [
          { libelle: "Créance sur la place de marché", montant: m.creance },
          { libelle: "Besoin en fonds de roulement", montant: m.besoin },
          { libelle: "Fonds de roulement", montant: x.fondsDeRoulement },
          { libelle: "Trésorerie nette", montant: m.tresorerieNette, fort: true },
          { libelle: "Dont le compte courant, hors compte à terme", montant: m.compteCourant },
        ];
      },
      droites: (c) => {
        const x = bilanDeLExercice(c);
        return { produit: () => x.fondsDeRoulement, cout: (d) => x.besoin + (x.ventesAuxParticuliersTtc * d) / 360, libelles: ["Fonds de roulement", "Besoin en fonds de roulement"] };
      },
      explication: (c) => {
        const x = bilanDeLExercice(c);
        const d = delaisDeLaPlaceDeMarche(x);
        return [
          `Chaque jour de reversement immobilise ${eur(x.unJourDeParticuliers)}, un jour de ventes aux particuliers toutes taxes comprises. Le fonds de roulement ne bouge pas ; le besoin monte d'autant, et la trésorerie nette baisse d'autant. Au-delà de ${jours(d.tresorerieNette)}, le besoin dépasse le fonds de roulement.`,
          `Mais regardez le compte courant : il passe sous zéro dès ${jours(d.compteCourant + 1)}. La trésorerie nette compte le compte à terme, ${eur(x.placement)}, bloqué jusqu'au 6 janvier : entre ${jours(d.compteCourant + 1)} et ${jours(d.tresorerieNette)}, ${x.entreprise} serait à découvert, une trésorerie passive, avec une trésorerie nette encore positive.`,
        ];
      },
    },
    {
      id: "le-bfr-normatif",
      objectifs: [3],
      type: "montants",
      titre: "Le BFR normatif, en jours de chiffre d'affaires",
      notions: ["bfr", "payment_terms"],
      question: (c) => {
        const x = bilanDeLExercice(c);
        return `Le besoin se compare d'une entreprise à l'autre en jours de chiffre d'affaires hors taxes (${eur(x.caHt)} sur l'exercice). Exprimez le besoin en fonds de roulement d'exploitation en jours, au centième. Puis la place de marché à ${PLACE_DE_MARCHE.delai} jours : sa créance se compte en jours de ventes aux particuliers toutes taxes comprises ; calculez le coefficient qui les ramène en chiffre d'affaires hors taxes, au dix-millième, et ce que la créance pèserait en jours de chiffre d'affaires.`;
      },
      champs: (c) => {
        const x = bilanDeLExercice(c);
        return [
          {
            libelle: "Besoin d'exploitation, en jours de chiffre d'affaires",
            attendu: x.besoinEnJours,
            calcul: `${eur(x.besoinDExploitation)} ÷ ${eur(x.caHt)} × 360 = ${qte(x.besoinEnJours)} jours`,
            tolerance: 0.01,
          },
          {
            libelle: "Coefficient de structure des ventes aux particuliers",
            attendu: x.coefficientDesParticuliers,
            calcul: `${eur(x.ventesAuxParticuliersTtc)} ÷ ${eur(x.caHt)} = ${qte(x.coefficientDesParticuliers, 4)}`,
            tolerance: 0.001,
          },
          {
            libelle: "Créance de la place de marché, en jours de chiffre d'affaires",
            attendu: x.placeDeMarcheEnJours,
            calcul: `${PLACE_DE_MARCHE.delai} jours × ${qte(x.coefficientDesParticuliers, 4)} = ${qte(x.placeDeMarcheEnJours)} jours`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const x = bilanDeLExercice(c);
        const total = auCentime(x.besoinEnJours + x.placeDeMarcheEnJours);
        return [
          `C'est la méthode du besoin normatif : chaque poste s'écrit en jours de chiffre d'affaires hors taxes, son délai multiplié par un coefficient de structure (ce que pèse son flux face au chiffre d'affaires). Le besoin ${dE(x.entreprise)}, ${jours(x.besoinEnJours)}, passerait à ${jours(total)} avec la place de marché : le curseur l'a montré en euros.`,
          "Le besoin normatif suppose un besoin proportionnel au chiffre d'affaires, à délais et à structure constants. Il sert à prévoir : un chiffre d'affaires prévu multiplié par des jours donne le besoin à financer.",
        ];
      },
    },
    {
      id: "predire-le-stock",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le stock de la gamme",
      notions: ["bfr", "stock"],
      question: (c) => {
        const x = bilanDeLExercice(c);
        const l = laboratoireDuBesoin(x, departDuLaboratoire(x));
        return `Pour lancer la gamme dès janvier, le dirigeant voudrait finir l'exercice avec ${qte(STOCK_POUR_LA_GAMME)} jeux de composants au lieu de ${qte(l.quantiteDeDepart)}, achetés en décembre au coût moyen du mois, ${eur(l.coutMoyen)} hors taxes, et payés comptant. Pariez : au 31 décembre, chaque jeu de plus fait baisser la trésorerie nette…`;
      },
      options: (c) => {
        const x = bilanDeLExercice(c);
        const l = laboratoireDuBesoin(x, departDuLaboratoire(x));
        const voir = "Faites-le dans le laboratoire, à l'étape suivante.";
        return [
          { texte: `De ${eur(auCentime(l.coutMoyen * (1 + x.f.tauxDeTva)))}, son prix toutes taxes comprises`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `De ${eur(l.coutMoyen)}, son prix hors taxes : la TVA est récupérée`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "De rien : le stock reste à l'actif, le résultat ne bouge pas", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-besoin",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du besoin",
      notions: ["bfr", "payment_terms", "net_treasury", "stock"],
      question: (c) => {
        const x = bilanDeLExercice(c);
        return `Faites varier le délai de CampusTech, celui du fournisseur de composants (un délai plus long que ${x.f.fournisseur.delai} jours laisse plus de factures dues au 31 décembre), le stock de composants et la somme placée le 6 janvier. Le tableau suit le bilan fonctionnel ; le graphique, la trésorerie nette selon le délai de CampusTech. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = bilanDeLExercice(c);
        const d = departDuLaboratoire(x);
        const L = LEVIERS_DU_LABORATOIRE;
        return [
          { code: "delaiCampusTech", libelle: "Délai de paiement de CampusTech", unite: "jours", ...L.campustech, depart: d.delaiCampusTech! },
          { code: "delaiFournisseur", libelle: "Délai accordé par le fournisseur de composants", unite: "jours", ...L.fournisseur, depart: d.delaiFournisseur! },
          { code: "stock", libelle: "Jeux de composants en stock au 31 décembre", unite: "jeux", ...L.stock, depart: d.stock! },
          { code: "placement", libelle: "Somme placée le 6 janvier", unite: "€", min: L.placement.min, max: x.creation.tresorerie, pas: L.placement.pas, depart: d.placement! },
        ];
      },
      lecture: (c, p) => {
        const x = bilanDeLExercice(c);
        const l = laboratoireDuBesoin(x, p);
        const d = laboratoireDuBesoin(x, departDuLaboratoire(x));
        return [
          { libelle: "Fonds de roulement", montant: l.fondsDeRoulement, reference: d.fondsDeRoulement },
          { libelle: "Stock de composants", montant: l.stock, reference: d.stock },
          { libelle: "Besoin en fonds de roulement d'exploitation", montant: l.besoinDExploitation, reference: d.besoinDExploitation },
          { libelle: "Besoin en fonds de roulement", montant: l.besoin, reference: d.besoin },
          { libelle: "Trésorerie nette", montant: l.tresorerieNette, reference: d.tresorerieNette, fort: true },
          { libelle: "Dont le compte courant", montant: l.compteCourant, reference: d.compteCourant },
          { libelle: "Dont le compte à terme et ses intérêts", montant: l.placement, reference: d.placement },
          { libelle: "Effet sur la trésorerie nette", montant: auCentime(l.tresorerieNette - d.tresorerieNette), reference: 0, effet: true },
        ];
      },
      graphique: (c) => {
        const x = bilanDeLExercice(c);
        return {
          levier: "delaiCampusTech",
          courbes: [
            { libelle: "Trésorerie nette", valeur: (p) => laboratoireDuBesoin(x, p).tresorerieNette },
            { libelle: "Besoin en fonds de roulement", valeur: (p) => laboratoireDuBesoin(x, p).besoin },
            { libelle: "Fonds de roulement", valeur: (p) => laboratoireDuBesoin(x, p).fondsDeRoulement },
          ],
        };
      },
      defi: (c) => {
        const x = bilanDeLExercice(c);
        const depart = laboratoireDuBesoin(x, departDuLaboratoire(x));
        return {
          consigne: `Finissez l'exercice avec ${qte(STOCK_POUR_LA_GAMME)} jeux en stock, sans que la trésorerie nette descende sous celle du départ, ${eur(depart.tresorerieNette)}.`,
          atteint: (p) => p.stock! >= STOCK_POUR_LA_GAMME && laboratoireDuBesoin(x, p).tresorerieNette >= depart.tresorerieNette,
          indice: (p) => {
            if (p.stock! < STOCK_POUR_LA_GAMME) return `Le stock compte ${qte(p.stock!)} jeux : montez-le à ${qte(STOCK_POUR_LA_GAMME)}, puis cherchez ce qui rend la trésorerie qu'il a coûtée.`;
            const l = laboratoireDuBesoin(x, p);
            return `La trésorerie nette vaut ${eur(l.tresorerieNette)}, ${eur(auCentime(depart.tresorerieNette - l.tresorerieNette))} de moins qu'au départ. Le placement n'y change presque rien : jouez sur les délais. Attention, un délai ne compte au 31 décembre que s'il fait passer une facture de l'autre côté de la date.`;
          },
          solution: { ...SOLUTION_DU_LABORATOIRE, stock: STOCK_POUR_LA_GAMME, placement: x.f.placement.montant },
        };
      },
      explication: (c, p) => {
        const x = bilanDeLExercice(c);
        const l = laboratoireDuBesoin(x, p);
        const d = laboratoireDuBesoin(x, departDuLaboratoire(x));
        return [
          `Le stock de la gamme a coûté ${eur(auCentime(l.paye - d.paye))} de trésorerie : le prix des jeux toutes taxes comprises, puisque la TVA ne revient qu'en janvier, par une TVA à décaisser plus petite. Les délais l'ont rendu : la trésorerie nette vaut ${eur(l.tresorerieNette)}. Le fonds de roulement, lui, ${l.fondsDeRoulement === d.fondsDeRoulement ? "n'a pas bougé" : `n'a bougé que des intérêts du placement, à ${eur(l.fondsDeRoulement)}`} : tout passe par le besoin, et la trésorerie suit, euro pour euro.`,
          "Le graphique descend par marches : un délai ne change le bilan que s'il fait passer une facture de l'autre côté du 31 décembre. Le bilan est une photo ; c'est pourquoi les ratios qui le lisent se critiquent.",
          "Et le placement : placer plus ou moins ne change la trésorerie nette que de ses intérêts, il change le compte courant. Le compte à terme est de la trésorerie, mais pas une trésorerie libre avant le 6 janvier.",
        ];
      },
    },
    {
      id: "les-ratios-de-rotation",
      objectifs: [4],
      type: "montants",
      titre: "Les ratios de rotation",
      notions: ["payment_terms", "stock_rotation"],
      tableau: bilanComptableDuTrenteEtUn,
      question: (c) => {
        const x = bilanDeLExercice(c);
        return `Trois ratios, au centième de jour, sur 360 jours. Le délai de règlement des clients (sur le chiffre d'affaires toutes taxes comprises, ${eur(x.caTtc)}), le délai de règlement des fournisseurs (sur les achats de composants toutes taxes comprises, ${eur(x.achatsDeComposantsTtc)} ; les autres achats se paient comptant) et la durée de rotation du stock de composants (sur leur consommation, ${eur(x.consommationDeComposants)}).`;
      },
      champs: (c) => {
        const x = bilanDeLExercice(c);
        const p = x.postes;
        return [
          { libelle: "Délai de règlement des clients", attendu: x.delaiClients, calcul: `${eur(p.clientsBruts)} ÷ ${eur(x.caTtc)} × 360 = ${qte(x.delaiClients)} jours`, tolerance: 0.05 },
          { libelle: "Délai de règlement des fournisseurs", attendu: x.delaiFournisseurs, calcul: `${eur(p.fournisseurs)} ÷ ${eur(x.achatsDeComposantsTtc)} × 360 = ${qte(x.delaiFournisseurs)} jours`, tolerance: 0.05 },
          { libelle: "Durée de rotation du stock", attendu: x.rotationDuStock, calcul: `${eur(p.stock)} ÷ ${eur(x.consommationDeComposants)} × 360 = ${qte(x.rotationDuStock)} jours`, tolerance: 0.05 },
        ];
      },
      explication: (c) => {
        const x = bilanDeLExercice(c);
        return [
          `Les créances et les dettes se rapportent à des flux toutes taxes comprises, le stock à un flux hors taxes : le ratio compare ce qui est comparable. Les clients paient en moyenne à ${jours(x.delaiClients)}, alors que CampusTech paie en retard, ${x.f.campustech.delai} jours après sa facture pour ${DELAI_CONVENU_DE_CAMPUSTECH} convenus : la moyenne mêle les particuliers, qui paient à la commande, et des créances qui n'ont rien de normal, comme celle de Sonora.`,
        ];
      },
    },
    {
      id: "le-ratio-et-le-contrat",
      objectifs: [4],
      type: "choix",
      titre: "Le ratio et le contrat",
      notions: ["payment_terms"],
      question: (c) => {
        const x = bilanDeLExercice(c);
        return `Le ratio donne un délai fournisseurs de ${jours(x.delaiFournisseurs)}, alors qu'Électro-Composants est payé à ${x.f.fournisseur.delai} jours, et toujours à l'heure. D'où vient l'écart ?`;
      },
      options: (c) => {
        const x = bilanDeLExercice(c);
        return [
          {
            texte: "De décembre : le dépannage de Composants Express s'ajoute à la facture du mois, et le bilan est une photo de ce jour",
            juste: true,
            retour: `Oui. Au 31 décembre, ${eur(x.postes.fournisseurs)} restent dus : la facture de décembre d'Électro-Composants, et la facture non parvenue du dépannage, autant que la première. Rapportées aux achats moyens de l'année, elles font ${jours(x.delaiFournisseurs)}. Un ratio du bilan dit la situation d'un jour, pas le contrat.`,
          },
          {
            texte: "D'un retard de paiement : NOVA paie son fournisseur plus tard que prévu",
            juste: false,
            retour: "Non : la fiche paie chaque facture d'Électro-Composants à son échéance. Un ratio ne prouve pas un retard ; il faut regarder les factures qui le composent.",
          },
          {
            texte: "D'une erreur de base : la dette est toutes taxes comprises, les achats aussi doivent l'être",
            juste: false,
            retour: `Non : le calcul prend déjà les achats toutes taxes comprises, ${eur(x.achatsDeComposantsTtc)}. Pris hors taxes, il donnerait encore plus de jours.`,
          },
        ];
      },
    },
    {
      id: "la-croissance",
      objectifs: [3],
      type: "montants",
      titre: "Variante : 20 % de ventes en plus",
      notions: ["bfr", "frng", "net_treasury"],
      question: () =>
        `Le directeur commercial vise ${pct(CROISSANCE_DES_VENTES)} de chiffre d'affaires en plus, à structure constante : mêmes clients, mêmes délais, même stock en jours. Calculez le chiffre d'affaires hors taxes visé, le besoin en fonds de roulement d'exploitation qui irait avec, et le supplément à financer.`,
      champs: (c) => {
        const x = bilanDeLExercice(c);
        return [
          { libelle: "Chiffre d'affaires visé", attendu: x.caApresCroissance, calcul: `${eur(x.caHt)} × ${qte(1 + CROISSANCE_DES_VENTES)} = ${eur(x.caApresCroissance)}` },
          {
            libelle: "Besoin d'exploitation après la croissance",
            attendu: x.besoinDExploitationApres,
            calcul: `${qte(x.besoinEnJours)} jours de ${eur(x.caApresCroissance)} : ${eur(x.besoinDExploitation)} × ${qte(1 + CROISSANCE_DES_VENTES)} = ${eur(x.besoinDExploitationApres)}`,
            tolerance: 1,
          },
          { libelle: "Supplément de besoin à financer", attendu: x.supplementDeBesoin, calcul: `${eur(x.besoinDExploitationApres)} − ${eur(x.besoinDExploitation)} = ${eur(x.supplementDeBesoin)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = bilanDeLExercice(c);
        return [
          `La croissance immobilise ${eur(x.supplementDeBesoin)} de plus : de l'argent avancé avant d'être encaissé. Le besoin hors exploitation, lui, ne suit pas les ventes. Ici le supplément est faible, parce que ${x.entreprise} vend surtout au comptant ; à ${jours(x.besoinEnJours + x.placeDeMarcheEnJours)} de chiffre d'affaires, avec la place de marché, il serait autrement lourd.`,
          "C'est l'effet ciseaux à surveiller : le besoin grandit avec le chiffre d'affaires, tout de suite ; la capacité d'autofinancement grandit avec la marge, plus tard. Une croissance rentable peut manquer de trésorerie.",
        ];
      },
    },
    {
      id: "garder-la-tresorerie",
      objectifs: [4],
      type: "montants",
      titre: "Emprunter à 5 % pour garder une trésorerie à 3 %",
      notions: ["net_treasury", "loan_schedule"],
      question: (c) => {
        const x = bilanDeLExercice(c);
        return `${x.entreprise} finit l'exercice avec ${eur(x.tresorerieNette)} de trésorerie nette, et doit encore ${eur(x.postes.emprunt)} à la banque. Sans l'emprunt, elle aurait placé ${eur(x.f.pret.capital)} de moins le 6 janvier. Sur l'exercice, calculez ce que l'emprunt a coûté en intérêts (payés et courus), ce que ces ${eur(x.f.pret.capital)} auraient rapporté placés au taux du compte à terme jusqu'au 31 décembre, puis le coût net de l'emprunt après impôt, au taux marginal de ${pct(x.tauxMarginal)}.`;
      },
      champs: (c) => {
        const x = bilanDeLExercice(c);
        return [
          {
            libelle: "Intérêts de l'emprunt sur l'exercice",
            attendu: x.coutDeLEmprunt,
            calcul: `${eur(auCentime(x.coutDeLEmprunt - x.postes.interetsCourus))} payés aux échéances + ${eur(x.postes.interetsCourus)} courus = ${eur(x.coutDeLEmprunt)}`,
          },
          {
            libelle: "Ce que le capital emprunté aurait rapporté placé",
            attendu: x.placementDuPret,
            calcul: `${eur(x.f.pret.capital)} × ${pct(x.f.placement.tauxAnnuel)} × ${x.joursDuPlacement} ÷ 360 = ${eur(x.placementDuPret)}`,
          },
          {
            libelle: "Coût net de l'emprunt, après impôt",
            attendu: x.coutNetApresImpot,
            calcul: `(${eur(x.coutDeLEmprunt)} − ${eur(x.placementDuPret)}) × (1 − ${pct(x.tauxMarginal)}) = ${eur(x.coutNetAvantImpot)} × ${qte(1 - x.tauxMarginal)} = ${eur(x.coutNetApresImpot)}`,
          },
        ];
      },
      explication: (c) => {
        const x = bilanDeLExercice(c);
        return [
          `Garder l'emprunt a coûté ${eur(x.coutNetAvantImpot)} de plus que de placer moins, ${eur(x.coutNetApresImpot)} après impôt : les intérêts sont déductibles, chaque euro d'intérêt n'en coûte que ${qte(1 - x.tauxMarginal)}. C'est le prix d'une trésorerie gardée.`,
        ];
      },
    },
    {
      id: "emprunter-pour-garder",
      objectifs: [4],
      type: "choix",
      titre: "Garder la trésorerie, ou rembourser ?",
      notions: ["net_treasury", "frng"],
      question: (c) => {
        const x = bilanDeLExercice(c);
        return `Un associé s'étonne : « ${eur(x.tresorerieNette)} de trésorerie, et l'on paie ${pct(x.f.pret.tauxAnnuel)} sur ${eur(x.postes.emprunt)} d'emprunt ? Remboursons. » Le compte à terme garde la réserve de la seconde ligne et de la gamme de N+1. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = bilanDeLExercice(c);
        return [
          {
            texte: `Garder se défend : la réserve a coûté ${eur(x.coutNetApresImpot)} après impôt, et finance la seconde ligne sans nouveau prêt`,
            juste: true,
            retour: `Oui. Le coût d'une trésorerie de précaution se chiffre : ${eur(x.coutNetApresImpot)} sur l'exercice, après impôt. En face, un prêt déjà obtenu, une seconde ligne à financer en N+1, et un besoin qui peut grossir vite (la place de marché l'a montré). Il faut seulement savoir que ${eur(x.postes.emprunt)} de cette trésorerie sont dus à la banque : elle n'est pas un excédent libre.`,
          },
          {
            texte: `Rembourser : emprunter à ${pct(x.f.pret.tauxAnnuel)} pour placer à ${pct(x.f.placement.tauxAnnuel)}, c'est perdre ${eur(x.ecartDeTauxSurLeCapital)} par an`,
            juste: false,
            retour: `Non : ${pct(x.f.pret.tauxAnnuel - x.f.placement.tauxAnnuel)} sur ${eur(x.f.pret.capital)} pour une année pleine, c'est oublier le capital remboursé, les jours de l'exercice et l'impôt. Le coût réel est de ${eur(x.coutNetApresImpot)} après impôt ; reste à juger s'il vaut la réserve.`,
          },
          {
            texte: `Garder : le placement rapporte ${eur(x.postes.interetsDuPlacement)}, plus que les ${eur(x.coutDeLEmprunt)} d'intérêts de l'emprunt`,
            juste: false,
            retour: `Non : c'est comparer des bases différentes. Le placement porte sur ${eur(x.f.placement.montant)}, l'emprunt sur ${eur(x.f.pret.capital)} ; à capital égal, l'emprunt coûte plus qu'il ne rapporte placé.`,
          },
          {
            texte: "Garder : une trésorerie nette positive ne coûte rien, elle appartient à l'entreprise",
            juste: false,
            retour: `Non : une partie de cette trésorerie est empruntée, et elle coûte ses intérêts. La trésorerie nette ne dit pas d'où vient l'argent : le haut du bilan le dit.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["balance_sheet", "frng", "bfr", "net_treasury"],
      texte: (c) => {
        const x = bilanDeLExercice(c);
        return [
          `Vous avez relu le bilan ${dE(x.entreprise)} par fonction : un fonds de roulement de ${eur(x.fondsDeRoulement)}, un besoin de ${eur(x.besoin)} (${eur(x.besoinDExploitation)} d'exploitation, ${eur(x.besoinHorsExploitation)} hors exploitation), une trésorerie nette de ${eur(x.tresorerieNette)}. Depuis la création, le fonds de roulement a grandi de la CAF moins le capital remboursé.`,
          `Deux pièges. Une trésorerie nette positive n'est pas une trésorerie libre : ${eur(x.placement)} sont bloqués jusqu'au 6 janvier, et ${eur(x.postes.emprunt)} sont dus à la banque. Et un ratio lit une photo du 31 décembre : il se critique avant de se croire.`,
          "Au niveau de l'examen, vous savez reclasser un bilan (valeurs brutes, amortissements, dépréciations et provisions, intérêts courus, impôt dû, placements), calculer le fonds de roulement, le besoin d'exploitation et hors exploitation et la trésorerie nette, expliquer leur variation, exprimer le besoin en jours de chiffre d'affaires et chiffrer l'effet d'un délai ou d'une croissance, calculer et critiquer les ratios de rotation, et juger le coût d'une trésorerie gardée.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Trésorerie nette = fonds de roulement − besoin en fonds de roulement. Variation du fonds de roulement = CAF − investissements − remboursements + apports et emprunts nouveaux − dividendes. Besoin normatif = Σ délai × coefficient de structure, en jours de chiffre d'affaires hors taxes.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// L'EXPORT DE COMPATIBILITÉ : L'ANNÉE FIGÉE DES NEUF ENTREPRISES
// ─────────────────────────────────────────────────────────────────────────────

interface Masses {
  immobilisationsNettes: number;
  stocks: number;
  creances: number;
  /** TVA nette due à l'État (négative : un crédit de TVA). */
  tva: number;
  placements: number;
  banque: number;
  capitauxPropres: number;
  emprunts: number;
  fournisseurs: number;
  decouvert: number;
}

/** Le fonds de roulement, le besoin en fonds de roulement et la trésorerie nette d'un bilan en grandes masses. */
function fonctions(m: Masses, brut: number, amortissements: number) {
  const ressourcesStables = auCentimeDeLArene(m.capitauxPropres + amortissements + m.emprunts);
  const frng = auCentimeDeLArene(ressourcesStables - brut);
  const bfr = auCentimeDeLArene(m.stocks + m.creances - m.fournisseurs - m.tva);
  const tresorerieActive = auCentimeDeLArene(m.banque + m.placements);
  const tn = auCentimeDeLArene(tresorerieActive - m.decouvert);
  return { brut, amortissements, ressourcesStables, frng, bfr, tresorerieActive, tn };
}

/**
 * EXPORT DE COMPATIBILITÉ, QUE LE CHAPITRE NE LIT PLUS : le bilan en grandes masses de l'année du
 * cours figée (monde/annee-du-cours.ts), au 1er janvier et au 31 décembre, dans chacune des neuf
 * entreprises. Les quatre chapitres du Bac STMG qui le lisaient (lire-le-bilan,
 * financer-l-entreprise, fonds-de-roulement-et-tresorerie, rentabilite) sont passés sur le monde du
 * cours (monde/comptes-du-lycee.ts) : plus aucun chapitre ne le lit, seule sa garde
 * (tests/cours/bilan-fonctionnel.test.ts) le garde au centime. La dotation et les ventes de l'année
 * sont celles des trimestres figés.
 */
export function bilanFonctionnel(c: Pick<Cas, "code">) {
  const { partie, depart } = anneeDuCours(c.code);
  const tours = partie.rounds.map((r) => r.results["joueur"]!);
  const f = depart.finance;
  const b = tours[tours.length - 1]!.balanceSheet;
  const debut: Masses = {
    immobilisationsNettes: f.fixedAssetsNet,
    stocks: f.inventoryValue,
    creances: f.receivables,
    tva: 0,
    placements: 0,
    banque: f.cash,
    capitauxPropres: f.equity,
    emprunts: f.financialDebt,
    fournisseurs: f.payables,
    decouvert: f.overdraft,
  };
  const fin: Masses = {
    immobilisationsNettes: auCentimeDeLArene(b.fixedAssetsNet + (b.goodwill ?? 0)),
    stocks: auCentimeDeLArene(b.inventoryValue),
    creances: auCentimeDeLArene(b.receivables),
    tva: auCentimeDeLArene(b.vatLiability ?? 0),
    placements: auCentimeDeLArene(b.shortTermInvestment ?? 0),
    banque: auCentimeDeLArene(b.cash),
    capitauxPropres: auCentimeDeLArene(b.equity),
    emprunts: auCentimeDeLArene(b.financialDebt),
    fournisseurs: auCentimeDeLArene(b.payables),
    decouvert: auCentimeDeLArene(b.overdraft),
  };
  const dotation = auCentimeDeLArene(tours.reduce((t, r) => t + r.incomeStatement.depreciation, 0));
  const ventes = auCentimeDeLArene(tours.reduce((t, r) => t + r.incomeStatement.revenue, 0));
  const investissements = auCentimeDeLArene(fin.immobilisationsNettes - debut.immobilisationsNettes + dotation);
  const brut = auCentimeDeLArene(debut.immobilisationsNettes + investissements);
  const avant = fonctions(debut, debut.immobilisationsNettes, 0);
  const apres = fonctions(fin, brut, dotation);
  return {
    debut,
    fin,
    avant,
    apres,
    investissements,
    empruntNet: auCentimeDeLArene(fin.emprunts - debut.emprunts),
    variationFrng: auCentimeDeLArene(apres.frng - avant.frng),
    variationBfr: auCentimeDeLArene(apres.bfr - avant.bfr),
    variationTn: auCentimeDeLArene(apres.tn - avant.tn),
    ventes,
  };
}
