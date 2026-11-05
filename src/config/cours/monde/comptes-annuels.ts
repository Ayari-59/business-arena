import { auCentime } from "./amortissement";
import { cloture, type LeviersDeLaCloture } from "./cloture";
import { empruntALaCloture } from "./emprunt";
import { EXERCICE_DE_NOVA, type FicheDeLExercice } from "./exercice-de-nova";
import { facture } from "./facture";

/**
 * LE MONDE DU COURS : LES COMPTES ANNUELS DE NOVA POUR L'EXERCICE N, LEUR ANNEXE ET UNE SITUATION
 * INTERMÉDIAIRE (BTS CG P2, 2.1.2, 2.4.1 à 2.4.3 ; chapitre « Les comptes annuels : présentation,
 * annexe et situation intermédiaire »).
 *
 * UNE SEULE NOVA : tout se lit sur la fiche figée de N (exercice-de-nova.ts) et sa clôture
 * (cloture.ts, `cloture`), sans en changer un chiffre. Le compte de résultat et le bilan sont ceux
 * du chapitre « La clôture », rangés selon les modèles du plan comptable ; l'annexe en tire ses
 * tableaux ; l'état des échéances lit le contrat de prêt (emprunt.ts, `empruntALaCloture`).
 *
 * LA SITUATION INTERMÉDIAIRE se fait sur l'exercice N lui-même, à la fin d'un mois donné (le 30 juin
 * au chapitre, le 30 septembre au cas) : les ventes, les achats, le loyer et la paie sont ceux de la
 * fiche, mois par mois ; les charges et les produits connus pour l'année entière (la dotation aux
 * amortissements du plan, les intérêts de l'emprunt du tableau d'amortissement, les intérêts du
 * compte à terme) s'y prennent par douzièmes : c'est la méthode de l'abonnement. NOVA achète chaque
 * mois les composants qu'elle consomme jusqu'en novembre : son stock est nul à la fin de chacun de
 * ces mois.
 *
 * LA VEILLE (décision D9) : le règlement ANC n° 2022-06, applicable aux exercices ouverts depuis le
 * 1er janvier 2025, modernise la présentation des comptes (le résultat exceptionnel recentré, les
 * transferts de charges supprimés). Le référentiel du BTS, plus ancien, enseigne les modèles du
 * PCG de 2014 : le chapitre les suit et signale la réforme.
 */
export const REGLEMENT_DE_PRESENTATION = { numero: "2022-06", exercicesOuvertsDepuis: "1er janvier 2025" } as const; // À VÉRIFIER

/**
 * LES SEUILS DES PETITES ET DES MICRO-ENTREPRISES (Code de commerce, L. 123-16 et D. 123-200) : une
 * entreprise en relève si elle ne dépasse pas deux des trois seuils (total du bilan, chiffre
 * d'affaires net, effectif moyen). Une micro-entreprise est dispensée d'annexe et peut garder ses
 * comptes confidentiels ; une petite entreprise présente des comptes abrégés et peut garder son
 * compte de résultat confidentiel.
 */
export const SEUILS_DES_MICRO_ENTREPRISES = { bilan: 450_000, chiffreDAffaires: 900_000, effectif: 10 } as const; // À VÉRIFIER (relevés en 2024)
export const SEUILS_DES_PETITES_ENTREPRISES = { bilan: 7_500_000, chiffreDAffaires: 15_000_000, effectif: 50 } as const; // À VÉRIFIER (relevés en 2024)

/** Le nombre de seuils qu'il faut dépasser pour sortir d'une catégorie. */
export const SEUILS_A_DEPASSER = 2;

/** LE DÉPÔT DES COMPTES AU GREFFE : dans le mois qui suit l'approbation, 2 mois par voie électronique. */
export const DEPOT_AU_GREFFE = { delaiEnMois: 1, delaiElectroniqueEnMois: 2 } as const; // À VÉRIFIER (L. 232-21 et L. 232-23)

/** L'approbation des comptes par l'assemblée : dans les 6 mois de la clôture. */
export const MOIS_POUR_APPROUVER = 6;

const somme = (xs: readonly number[]) => auCentime(xs.reduce((t, x) => t + x, 0));
const solde = (s: Readonly<Record<string, number>>, ...comptes: string[]) => somme(comptes.map((c) => s[c] ?? 0));

const CALCULES = new Map<string, ReturnType<typeof calculerLesComptes>>();

/** Les comptes annuels de N, gardés une fois calculés pour une fiche et des leviers donnés (la clôture se refait sinon à chaque texte). */
export function comptesAnnuels(f: FicheDeLExercice = EXERCICE_DE_NOVA, leviers: Partial<LeviersDeLaCloture> = {}) {
  const cle = `${f.code}:${JSON.stringify(leviers)}`;
  if (!CALCULES.has(cle)) CALCULES.set(cle, calculerLesComptes(f, leviers));
  return CALCULES.get(cle)!;
}

function calculerLesComptes(f: FicheDeLExercice, leviers: Partial<LeviersDeLaCloture>) {
  const k = cloture(f, leviers);
  const s = k.soldes;
  const ventes = -solde(s, "701");
  const achats = solde(s, "601");
  const variationDeStock = solde(s, "6031");
  const chargesExternes = solde(s, "606", "6132", "616");
  const salaires = solde(s, "641");
  const chargesSociales = solde(s, "645");
  const amortissements = solde(s, "6811");
  const depreciations = solde(s, "6817");
  const provisions = solde(s, "6815");
  const chargesDExploitation = somme([achats, variationDeStock, chargesExternes, salaires, chargesSociales, amortissements, depreciations, provisions]);
  const resultatDExploitation = auCentime(ventes - chargesDExploitation);
  const produitsFinanciers = -solde(s, "764");
  const chargesFinancieres = solde(s, "6611", "665");
  const resultatFinancier = auCentime(produitsFinanciers - chargesFinancieres);
  const resultatCourant = auCentime(resultatDExploitation + resultatFinancier);
  const impot = solde(s, "695");
  const b = k.bilan;
  return {
    k,
    entreprise: f.entreprise,
    resultat: {
      ventes,
      achats,
      variationDeStock,
      chargesExternes,
      salaires,
      chargesSociales,
      amortissements,
      depreciations,
      provisions,
      chargesDExploitation,
      resultatDExploitation,
      produitsFinanciers,
      chargesFinancieres,
      resultatFinancier,
      resultatCourant,
      resultatExceptionnel: 0,
      impot,
      resultatNet: auCentime(resultatCourant - impot),
    },
    bilan: b,
    sig: k.sig,
  };
}

/** Le nombre de seuils dépassés, et si l'entreprise relève de la catégorie. */
function categorie(seuils: { bilan: number; chiffreDAffaires: number; effectif: number }, x: { bilan: number; chiffreDAffaires: number; effectif: number }) {
  const depasses = [x.bilan > seuils.bilan, x.chiffreDAffaires > seuils.chiffreDAffaires, x.effectif > seuils.effectif].filter(Boolean).length;
  return { depasses, enReleve: depasses < SEUILS_A_DEPASSER };
}

/** La taille de NOVA face aux seuils : son total du bilan, son chiffre d'affaires, son effectif. */
export function tailleDeNova(f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const c = comptesAnnuels(f);
  const x = { bilan: c.bilan.totalActif, chiffreDAffaires: c.resultat.ventes, effectif: f.paie.effectif };
  const micro = categorie(SEUILS_DES_MICRO_ENTREPRISES, x);
  const petite = categorie(SEUILS_DES_PETITES_ENTREPRISES, x);
  return { ...x, micro: micro.enReleve, depassesMicro: micro.depasses, petite: petite.enReleve, depassesPetite: petite.depasses };
}

/** Les tableaux chiffrés de l'annexe : immobilisations, amortissements, provisions et dépréciations, échéances. */
export function annexe(f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const c = comptesAnnuels(f);
  const b = c.bilan;
  const e = empruntALaCloture(f.pret, 0);
  const empruntAUnAn = auCentime(e.partAMoinsDUnAn + e.interetsCourus.montant);
  const empruntAPlusDUnAn = auCentime(b.passif.emprunts - empruntAUnAn);
  return {
    immobilisations: { debut: 0, augmentations: b.actif.immobilisations.brut, fin: b.actif.immobilisations.brut },
    amortissements: { debut: 0, dotations: b.actif.immobilisations.amortissements, fin: b.actif.immobilisations.amortissements },
    provisionPourLitige: { debut: 0, dotations: b.passif.provisions, fin: b.passif.provisions },
    depreciationDesCreances: { debut: 0, dotations: b.actif.clients.depreciation, fin: b.actif.clients.depreciation },
    creances: [
      { libelle: "Clients et comptes rattachés, en brut", unAn: b.actif.clients.brut, plusDUnAn: 0 },
      { libelle: "Autres créances (la TVA à récupérer)", unAn: b.actif.autresCreances, plusDUnAn: 0 },
      { libelle: "Charges constatées d'avance", unAn: b.actif.chargesConstateesDAvance, plusDUnAn: 0 },
    ],
    dettes: [
      { libelle: "Emprunt et intérêts courus", unAn: empruntAUnAn, plusDUnAn: empruntAPlusDUnAn },
      { libelle: "Fournisseurs et comptes rattachés", unAn: b.passif.fournisseurs, plusDUnAn: 0 },
      { libelle: "Dettes fiscales et sociales", unAn: b.passif.dettesFiscalesEtSociales, plusDUnAn: 0 },
      { libelle: "Produits constatés d'avance", unAn: b.passif.produitsConstatesDAvance, plusDUnAn: 0 },
    ],
    capitalAUnAn: e.partAMoinsDUnAn,
    interetsCourus: e.interetsCourus.montant,
    empruntAUnAn,
    empruntAPlusDUnAn,
    echeancesDeN1: e.partAMoinsDUnAn / (f.pret.capital / (f.pret.dureeAns * f.pret.echeancesParAn)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES OPTIONS COMPTABLES (2.1.2) : CE QUE CHANGENT LE MODE D'AMORTISSEMENT ET LA MÉTHODE DE STOCK
// ─────────────────────────────────────────────────────────────────────────────

/** Les codes des leviers du laboratoire. */
export const MODES_DU_LABORATOIRE = [
  { valeur: 1, libelle: "Linéaire", mode: "lineaire" },
  { valeur: 2, libelle: "Dégressif", mode: "degressif" },
] as const;
export const METHODES_DU_LABORATOIRE = [
  { valeur: 1, libelle: "Coût moyen de la période", methode: "cmup-periode" },
  { valeur: 2, libelle: "Coût moyen après chaque entrée", methode: "cmup-apres-chaque-entree" },
  { valeur: 3, libelle: "Premier entré, premier sorti", methode: "peps" },
] as const;

/** Les comptes de N avec un mode d'amortissement et une méthode de stock, par leurs codes. */
export function optionsComptables(mode: number, methode: number, f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const m = MODES_DU_LABORATOIRE.find((x) => x.valeur === mode)!;
  const s = METHODES_DU_LABORATOIRE.find((x) => x.valeur === methode)!;
  const c = comptesAnnuels(f, { modeDAmortissement: m.mode, methodeDeStock: s.methode });
  return {
    dotation: c.resultat.amortissements,
    stock: c.bilan.actif.stocks.net,
    resultatAvantImpot: c.resultat.resultatCourant,
    impot: c.resultat.impot,
    resultatNet: c.resultat.resultatNet,
    capitauxPropres: c.bilan.passif.capitauxPropres.total,
  };
}

/** Le mode et la méthode de la fiche (linéaire, coût moyen de la période), par leurs codes. */
export const OPTIONS_DE_LA_FICHE = { mode: 1, methode: 1 } as const;

/** La combinaison qui fait payer le moins d'impôt en N. */
export function optionsDuMoindreImpot() {
  const toutes = MODES_DU_LABORATOIRE.flatMap((m) => METHODES_DU_LABORATOIRE.map((s) => ({ mode: m.valeur, methode: s.valeur, impot: optionsComptables(m.valeur, s.valeur).impot })));
  const min = Math.min(...toutes.map((x) => x.impot));
  return toutes.filter((x) => x.impot === min);
}

// ─────────────────────────────────────────────────────────────────────────────
// LA SITUATION INTERMÉDIAIRE, PAR LA MÉTHODE DE L'ABONNEMENT
// ─────────────────────────────────────────────────────────────────────────────

/** Les mois de la situation du chapitre et de celle du cas. */
export const MOIS_DE_LA_SITUATION = 6;
export const MOIS_DE_LA_SITUATION_DU_CAS = 9;

/** La situation à la fin du mois `mois` (1 à 11) : les flux réels du mois, et les douzièmes des charges et produits annuels. */
export function situationIntermediaire(mois: number, f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const annuel = comptesAnnuels(f);
  const e = empruntALaCloture(f.pret, 0);
  const m = Array.from({ length: mois }, (_, i) => i);
  const p = f.prixDeLEnceinte;
  // Les ventes du mois : particuliers et CampusTech au prix ; Sonora en septembre, après sa remise, avec son escompte.
  const sonora = facture(f.facturesSonora.septembre);
  const avecSonora = mois >= f.sonora.premiereCommande.date.mois;
  const ventes = auCentime(somme(m.map((i) => (f.ventesAuxParticuliers[i]! + f.campustech.enceintesParFacture) * p)) + (avecSonora ? sonora.netCommercial : 0));
  const escompte = avecSonora ? sonora.escompte : 0;
  const achats = somme(m.map((i) => f.facturesDeComposantsHt[i]!));
  const chargesExternes = auCentime(somme(m.map((i) => f.livraisons[i]! * f.autresCoutsDeLEnceinte)) + mois * f.loyer.montant);
  const salaires = auCentime(mois * f.paie.brut);
  const chargesSociales = auCentime(salaires * (f.tauxDeLaPaie.patronalUrssaf + f.tauxDeLaPaie.patronalRetraite));
  const part = mois / 12;
  const dotationAnnuelle = annuel.resultat.amortissements;
  const dotation = auCentime(dotationAnnuelle * part);
  const interetsAnnuels = e.chargeDInterets;
  const interets = auCentime(interetsAnnuels * part);
  const placementAnnuel = annuel.resultat.produitsFinanciers;
  const placement = auCentime(placementAnnuel * part);
  const resultatDExploitation = auCentime(ventes - achats - chargesExternes - salaires - chargesSociales - dotation);
  const resultatFinancier = auCentime(placement - interets - escompte);
  return {
    mois,
    ventes,
    achats,
    chargesExternes,
    salaires,
    chargesSociales,
    dotationAnnuelle,
    dotation,
    interetsAnnuels,
    interets,
    placementAnnuel,
    placement,
    escompte,
    stock: 0,
    resultatDExploitation,
    resultatFinancier,
    resultatAvantImpot: auCentime(resultatDExploitation + resultatFinancier),
    /** Le résultat avant impôt de l'année, pour comparer : une situation n'en est pas la part au prorata. */
    resultatAvantImpotAnnuel: annuel.resultat.resultatCourant,
    auProrata: auCentime(annuel.resultat.resultatCourant * part),
  };
}
