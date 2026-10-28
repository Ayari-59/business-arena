import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime as arrondiDeLArene } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { anneeDuCours } from "../monde/annee-du-cours";
import { auCentime, joursCompris, JOURS_DE_L_ANNEE } from "../monde/amortissement";
import {
  capaciteDAutofinancement,
  cloture,
  impotSurLesSocietes,
  interetsDuPlacement,
  partageDeLaValeurAjoutee,
  passer,
  resultatDesSoldes,
  soldesIntermediaires,
  type LigneDEcriture,
  type Soldes,
} from "../monde/cloture";
import { empruntALaCloture } from "../monde/emprunt";
import { EXERCICES_DU_COURS, type FicheDeLExercice } from "../monde/exercice-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : SOLDES INTERMÉDIAIRES DE GESTION ET CAF (comptabilité générale, palier 4 ; BTS CG, DCG
 * UE6, BUT GEA et GACO).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le premier
 * exercice de NOVA a une fiche figée (monde/exercice-de-nova.ts), clôturé par le modèle du cours
 * (monde/cloture.ts : `cloture`, `soldesIntermediaires`, `capaciteDAutofinancement`,
 * `partageDeLaValeurAjoutee`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : le compte de résultat de l'exercice, travaux d'inventaire et impôt passés, lu solde par
 * solde (production, consommations en provenance des tiers, valeur ajoutée, excédent brut
 * d'exploitation, résultat d'exploitation, résultat financier, résultat courant avant impôt, résultat
 * net), la capacité d'autofinancement par ses deux méthodes, le partage de la valeur ajoutée, puis,
 * en expert, les retraitements de l'analyste (crédit-bail, personnel extérieur) et le coût d'un
 * emprunt gardé pour être placé à un taux plus bas.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, production-et-consommations, valeur-ajoutee, ebe, caf (la formule au repère ou
 *     dans la question, qui nomme les comptes) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-location
 *     puis louer-la-ligne (un curseur sur le loyer d'une ligne louée au lieu d'achetée : le coût de
 *     l'achat face à celui de la location, qui se croisent à 11 800 € par an, l'EBE qui baisse du
 *     loyer) avant ce-que-mesure-l-ebe ; predire-la-caf puis le-laboratoire-de-l-ebe (le mode
 *     d'amortissement, la perte probable sur Sonora, le taux de l'emprunt, la ligne louée : ce qui fait
 *     bouger l'EBE et ce qui ne le fait pas, et la CAF qui monte quand les dotations montent) avant
 *     caf ;
 *   · autonome : jusqu-au-resultat, caf-et-tresorerie, partage-de-la-valeur-ajoutee (ni formule ni
 *     chiffres donnés ; le calcul de la correction montre le chemin) ;
 *   · expert : les-retraitements (une variante chiffrée, le tableau à compléter avec et sans
 *     retraitements), pourquoi-retraiter (une critique), emprunter-pour-placer (quatre montants
 *     enchaînés) et garder-l-emprunt (un jugement).
 *
 * L'EXPORT DE COMPATIBILITÉ `soldesDeGestion(c)` lit encore l'année figée de l'arène
 * (monde/annee-du-cours.ts et `c.annee`), dans toutes les entreprises : « L'effectif et la masse
 * salariale » en dépend encore. Les chapitres de gestion et finance du Bac STMG et leurs cas sont
 * passés sur le monde du cours (monde/comptes-du-lycee.ts). Le chapitre lui-même ne s'en sert plus.
 */

/** Les entreprises du chapitre : celles qui ont un exercice dans le monde du cours, NOVA seule. */
export const ENTREPRISES_DES_SOLDES: readonly string[] = Object.keys(EXERCICES_DU_COURS);

/** Les bornes du curseur du loyer annuel de la ligne louée, en euros. */
export const LOYER_DU_CURSEUR = { min: 6_000, max: 18_000 } as const;

/** Les bornes et le pas du taux de l'emprunt et de la perte probable dans le laboratoire, en %. */
export const TAUX_DU_LABORATOIRE = { min: 3, max: 9, pas: 0.5 } as const;
export const PERTE_DU_LABORATOIRE = { min: 0, max: 100, pas: 5 } as const;

/** Le défi du laboratoire : faire baisser le résultat courant avant impôt d'au moins 10 000 €. */
export const BAISSE_DU_DEFI = 10_000;

/**
 * LA VARIANTE DES RETRAITEMENTS, hypothèse du cours : la même année de NOVA, autrement organisée.
 *   · la ligne est prise en crédit-bail au lieu d'être achetée : 13 000 € de redevances sur
 *     l'exercice, plus de dotation, et les 60 000 € gardés restent placés au taux du compte à terme ;
 *   · un salarié sur quatre est remplacé par un intérimaire mis à disposition par une agence, au même
 *     coût que le salarié (salaire et charges) : le changement est de rangement, pas de dépense.
 */
export const REDEVANCES_DE_CREDIT_BAIL = 13_000;
export const SALARIES_REMPLACES_PAR_L_INTERIM = 1;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number) => `${qte(x)} %`;
/** Un terme d'une somme : « + 4 500 € » ou « − 34 500 € ». */
const terme = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const enPourcent = (x: number) => auCentime(x * 100);

/** La fiche de l'exercice du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLExercice => EXERCICES_DU_COURS[c.code]!;

/** Le solde d'un compte, du côté où il se lit : un produit au crédit, une charge au débit. */
const solde = (s: Soldes, compte: string) => auCentime(compte.startsWith("7") ? -(s[compte] ?? 0) : (s[compte] ?? 0));
const ligneDuCompte = (balance: FicheDeLExercice["balanceAvantInventaire"], compte: string) => {
  const l = balance.find((x) => x.compte === compte)!;
  return auCentime(Math.abs(l.debit - l.credit));
};

/** L'impôt de la fiche retiré des soldes, pour qu'une variante le recalcule. */
function avantImpot(s: Soldes, impot: number): Soldes {
  return passer(s, [
    { compte: "695", debit: 0, credit: impot },
    { compte: "444", debit: impot, credit: 0 },
  ]);
}

/** L'impôt d'une variante, calculé sur son résultat et passé. */
function avecLImpot(f: FicheDeLExercice, s: Soldes) {
  const resultatAvantImpot = resultatDesSoldes(s);
  const impot = impotSurLesSocietes(resultatAvantImpot, f.impot).impot;
  const soldes = passer(s, [
    { compte: "695", debit: impot, credit: 0 },
    { compte: "444", debit: 0, credit: impot },
  ]);
  return { soldes: soldes as Soldes, resultatAvantImpot, impot, sig: soldesIntermediaires(soldes), caf: capaciteDAutofinancement(soldes) };
}

/** Les choix d'une année de NOVA rejouée par le chapitre. */
export interface ChoixDeLAnnee {
  degressif: boolean;
  /** La perte probable sur la créance de Sonora, en part de son hors taxes. */
  tauxDePerte: number;
  tauxDeLEmprunt: number;
  /** Le loyer annuel de la ligne si elle est louée au lieu d'être achetée ; 0 : achetée, comme dans la fiche. */
  loyerDeLaLigne: number;
}

/**
 * L'ANNÉE DE NOVA AVEC D'AUTRES CHOIX : le mode d'amortissement et la perte probable passent par le
 * modèle de la clôture ; le taux de l'emprunt change la charge d'intérêts de l'exercice (payés et
 * courus, monde/emprunt.ts) ; la ligne louée remplace sa dotation par le loyer de l'exercice, et les
 * 60 000 € qu'elle n'a pas coûté restent placés au taux du compte à terme. L'impôt est recalculé.
 */
export function anneeDeNova(f: FicheDeLExercice, choix: Partial<ChoixDeLAnnee> = {}) {
  const l: ChoixDeLAnnee = { degressif: false, tauxDePerte: f.sonora.redressement.tauxDePerteProbable, tauxDeLEmprunt: f.pret.tauxAnnuel, loyerDeLaLigne: 0, ...choix };
  const k = cloture(f, { modeDAmortissement: l.degressif ? "degressif" : "lineaire", tauxDePerteProbable: l.tauxDePerte });
  const lignes: LigneDEcriture[] = [];
  const interets = empruntALaCloture({ ...f.pret, tauxAnnuel: l.tauxDeLEmprunt }).chargeDInterets;
  const enPlus = auCentime(interets - empruntALaCloture(f.pret).chargeDInterets);
  if (enPlus !== 0) lignes.push({ compte: "6611", debit: enPlus, credit: 0 }, { compte: "512", debit: 0, credit: enPlus });
  const jours = joursCompris(f.equipement.miseEnService, f.cloture);
  const dotation = k.travaux.find((t) => t.code === "dotation")!.montant;
  const loyer = auCentime((l.loyerDeLaLigne * jours) / JOURS_DE_L_ANNEE);
  const placementGarde = l.loyerDeLaLigne > 0 ? interetsDuPlacement(f.equipement.ht, f.placement.tauxAnnuel, f.equipement.miseEnService, f.cloture) : 0;
  if (l.loyerDeLaLigne > 0) {
    lignes.push(
      { compte: "6811", debit: 0, credit: dotation },
      { compte: f.equipement.compteDAmortissement, debit: dotation, credit: 0 },
      { compte: "6132", debit: loyer, credit: 0 },
      { compte: "512", debit: 0, credit: loyer },
      { compte: f.placement.compteDesInteretsCourus, debit: placementGarde, credit: 0 },
      { compte: f.placement.compteDeProduit, debit: 0, credit: placementGarde },
    );
  }
  const a = avecLImpot(f, passer(avantImpot(k.soldes, k.impot.impot), lignes));
  return { choix: l, ...a, interets, loyer, placementGarde, dotationDeLaLigne: l.loyerDeLaLigne > 0 ? 0 : dotation };
}

/** La même année de NOVA, la ligne en crédit-bail et un salarié remplacé par un intérimaire : la variante des retraitements. */
export function novaAutrementOrganisee(f: FicheDeLExercice) {
  const k = cloture(f);
  const salaires = auCentime(((k.soldes["641"] ?? 0) * SALARIES_REMPLACES_PAR_L_INTERIM) / f.paie.effectif);
  const charges = auCentime(((k.soldes["645"] ?? 0) * SALARIES_REMPLACES_PAR_L_INTERIM) / f.paie.effectif);
  const interim = auCentime(salaires + charges);
  const dotation = k.travaux.find((t) => t.code === "dotation")!.montant;
  const placementGarde = interetsDuPlacement(f.equipement.ht, f.placement.tauxAnnuel, f.equipement.miseEnService, f.cloture);
  const a = avecLImpot(
    f,
    passer(avantImpot(k.soldes, k.impot.impot), [
      { compte: "641", debit: 0, credit: salaires },
      { compte: "645", debit: 0, credit: charges },
      { compte: "621", debit: interim, credit: 0 },
      { compte: "6811", debit: 0, credit: dotation },
      { compte: f.equipement.compteDAmortissement, debit: dotation, credit: 0 },
      { compte: "612", debit: REDEVANCES_DE_CREDIT_BAIL, credit: 0 },
      { compte: "512", debit: 0, credit: REDEVANCES_DE_CREDIT_BAIL },
      { compte: f.placement.compteDesInteretsCourus, debit: placementGarde, credit: 0 },
      { compte: f.placement.compteDeProduit, debit: 0, credit: placementGarde },
    ]),
  );
  const retraite = soldesIntermediaires(a.soldes, { personnelExterieur: interim, creditBail: { redevances: REDEVANCES_DE_CREDIT_BAIL, dotationEquivalente: dotation } });
  return { ...a, interim, dotationEquivalente: dotation, partInterets: auCentime(REDEVANCES_DE_CREDIT_BAIL - dotation), placementGarde, retraite };
}

/** Les soldes de l'exercice et tout ce que le chapitre et son cas demandent. */
export function soldesDeNova(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const k = cloture(f);
  const s = k.soldes;
  const sig = k.sig;
  const b = f.balanceAvantInventaire;
  const travail = (code: string) => k.travaux.find((t) => t.code === code)!.montant;
  const achatsConsommes = auCentime(solde(s, "601") + solde(s, "6031"));
  const services = auCentime(solde(s, "6132") + solde(s, "616"));
  const partage = partageDeLaValeurAjoutee(sig);
  const emprunt = empruntALaCloture(f.pret);
  // L'étape d'expert : les 80 000 € empruntés, gardés et placés au taux du compte à terme.
  const produitDesFondsPlaces = interetsDuPlacement(f.pret.capital, f.placement.tauxAnnuel, f.placement.date, f.cloture);
  const coutNetAvantImpot = auCentime(emprunt.chargeDInterets - produitDesFondsPlaces);
  // NOVA est au-delà du plafond du taux réduit : un euro de charge en plus économise le taux normal.
  const coutNetApresImpot = auCentime(coutNetAvantImpot * (1 - f.impot.tauxNormal));
  // La ligne louée : le loyer annuel qui coûte à l'exercice ce que coûte l'achat (dotation et placement perdu).
  const jours = joursCompris(f.equipement.miseEnService, f.cloture);
  const loyerDEquilibre = Math.floor(f.equipement.ht / f.equipement.dureeAns + f.equipement.ht * f.placement.tauxAnnuel + 1e-9);
  const louee = anneeDeNova(f, { loyerDeLaLigne: loyerDEquilibre });
  const degressif = anneeDeNova(f, { degressif: true });
  const tresorerieDeDepart = auCentime(f.apport.montant + f.pret.capital - f.equipement.ttc);
  const tresorerieDeFin = auCentime((s["512"] ?? 0) + (s[f.placement.compte] ?? 0));
  return {
    f,
    k,
    entreprise: f.entreprise,
    sig,
    caf: k.caf,
    resultatNet: k.resultatNet,
    impot: k.impot.impot,
    ventesDeLaBalance: ligneDuCompte(b, "701"),
    factureAEtablir: travail("factureAEtablir"),
    produitConstateDAvance: travail("produitConstateDAvance"),
    achatsDeLaBalance: ligneDuCompte(b, "601"),
    factureNonParvenue: travail("factureNonParvenue"),
    stockFinal: travail("stock"),
    achatsConsommes,
    achatsNonStockes: solde(s, "606"),
    loyerDuLocal: solde(s, "6132"),
    assurance: solde(s, "616"),
    services,
    remunerations: solde(s, "641"),
    chargesSociales: solde(s, "645"),
    dotationDeLaLigne: travail("dotation"),
    depreciation: travail("creanceDouteuse"),
    provision: travail("provision"),
    interetsDeLEmprunt: emprunt.chargeDInterets,
    interetsPayes: emprunt.interetsPayes,
    interetsCourus: emprunt.interetsCourus.montant,
    escompte: solde(s, "665"),
    interetsDuPlacement: solde(s, f.placement.compteDeProduit),
    tauxDeValeurAjoutee: enPourcent(sig.valeurAjoutee / sig.production),
    partDuPersonnel: enPourcent(partage.personnel),
    partDesPreteurs: enPourcent(partage.preteurs),
    partDeLEtat: enPourcent(partage.etat),
    capitalRembourse: emprunt.capitalRembourse,
    tresorerieDeDepart,
    tresorerieDeFin,
    variationDeTresorerie: auCentime(tresorerieDeFin - tresorerieDeDepart),
    produitDesFondsPlaces,
    coutNetAvantImpot,
    coutNetApresImpot,
    /** L'écart des taux de l'emprunt et du placement, en points. */
    ecartDesTaux: auCentime((f.pret.tauxAnnuel - f.placement.tauxAnnuel) * 100),
    /** L'erreur classique : l'écart des taux sur tout le capital, sans le remboursement ni le prorata. */
    ecartDesTauxSurLeCapital: auCentime(f.pret.capital * (f.pret.tauxAnnuel - f.placement.tauxAnnuel)),
    jours,
    loyerDEquilibre,
    louee,
    degressif,
    variante: novaAutrementOrganisee(f),
  };
}

export type SoldesDeNova = ReturnType<typeof soldesDeNova>;

/** Une position du laboratoire de l'EBE : le mode (1 dégressif), la perte et le taux en %, la ligne (1 louée). */
export function laboratoireDeLEbe(x: SoldesDeNova, p: Readonly<Record<string, number>>) {
  return anneeDeNova(x.f, { degressif: p.mode === 1, tauxDePerte: p.perte! / 100, tauxDeLEmprunt: p.taux! / 100, loyerDeLaLigne: p.ligne === 1 ? x.loyerDEquilibre : 0 });
}

/** Les libellés des comptes de gestion du compte de résultat de NOVA. */
const LIBELLES: Readonly<Record<string, string>> = {
  "701": "Ventes de produits finis",
  "764": "Revenus du compte à terme",
  "601": "Achats de composants",
  "6031": "Variation du stock de composants",
  "606": "Achats non stockés (emballage, transport, énergie)",
  "6132": "Loyer du local",
  "616": "Assurance",
  "641": "Rémunérations du personnel",
  "645": "Charges sociales",
  "6811": "Dotation aux amortissements",
  "6815": "Dotation aux provisions (litige)",
  "6817": "Dotation aux dépréciations (créance de Sonora)",
  "6611": "Intérêts de l'emprunt",
  "665": "Escomptes accordés",
  "695": "Impôt sur les sociétés",
};

/** Le compte de résultat de l'exercice, compte par compte : ce que l'élève a sous les yeux. */
export function compteDeResultatDeNova(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = soldesDeNova(c);
  const comptes = Object.entries(x.k.soldes)
    .filter(([compte, v]) => (compte.startsWith("6") || compte.startsWith("7")) && v !== 0)
    .map(([compte]) => compte)
    .sort((a, b) => (a.startsWith("7") === b.startsWith("7") ? a.localeCompare(b) : a.startsWith("7") ? -1 : 1));
  return {
    titre: `Le compte de résultat ${dE(x.entreprise)}, premier exercice`,
    colonnes: ["Compte", "Montant"],
    lignes: [
      ...comptes.map((compte) => ({ libelle: LIBELLES[compte] ?? `Compte ${compte}`, valeurs: [compte, eur(solde(x.k.soldes, compte))] })),
      { libelle: "Résultat net", valeurs: ["", eur(x.resultatNet)] },
    ],
  };
}

/** La variante des retraitements : ce qui change, et ce qui ne change pas. */
function tableauDeLaVariante(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = soldesDeNova(c);
  const v = x.variante;
  return {
    titre: `${x.entreprise} autrement organisée, la même année`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Redevances de crédit-bail de la ligne, au lieu de l'achat (612)", valeurs: [eur(REDEVANCES_DE_CREDIT_BAIL)] },
      { libelle: "Dotation de la ligne, si elle avait été achetée", valeurs: [eur(v.dotationEquivalente)] },
      { libelle: "Intérimaire mis à disposition, au lieu d'un salarié (621)", valeurs: [eur(v.interim)] },
      { libelle: "Salaire et charges du salarié remplacé", valeurs: [eur(v.interim)] },
      { libelle: "Intérêts du compte à terme sur l'argent de la ligne, gardé", valeurs: [eur(v.placementGarde)] },
      { libelle: "Consommations en provenance des tiers de la variante", valeurs: [eur(v.sig.consommations)] },
      { libelle: "Charges de personnel de la variante", valeurs: [eur(v.sig.personnel)] },
      { libelle: "Dotations aux amortissements, dépréciations et provisions de la variante", valeurs: [eur(v.sig.dotations)] },
      { libelle: "Charges financières de la variante", valeurs: [eur(v.sig.chargesFinancieres)] },
    ],
  };
}

export const SOLDES_INTERMEDIAIRES: Chapitre = {
  code: "soldes-intermediaires-de-gestion",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [
    "BTS CG P6 · Analyse de la situation financière",
    "DCG UE6 · Finance d'entreprise",
    "BUT GACO · Participer au pilotage interne de l'organisation",
    "BUT GEA · Évaluer l'activité de l'organisation",
  ],
  titre: "Soldes intermédiaires de gestion et CAF",
  accroche:
    "Le résultat dit combien l'exercice a laissé ; les soldes disent où il l'a gagné ou perdu. Puis la capacité d'autofinancement, le partage de la valeur ajoutée, et les retraitements de l'analyste : ce qui fait bouger l'excédent brut d'exploitation, et ce qui ne le fait pas.",
  objectifs: [
    "Calculer la production, les consommations en provenance des tiers et la valeur ajoutée",
    "Calculer l'excédent brut d'exploitation, puis descendre jusqu'au résultat net",
    "Calculer la capacité d'autofinancement par ses deux méthodes, et la distinguer de la trésorerie",
    "Lire le partage de la valeur ajoutée et retraiter le crédit-bail et le personnel extérieur",
    "Dire ce qu'un choix de financement, d'amortissement ou de location fait à chaque solde",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_SOLDES,
    pourquoi:
      "les soldes se lisent sur un exercice clôturé pour de vrai, celui de NOVA, tenu dans la simulation du cours de la création à la clôture : une seule NOVA, la même d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Où l'exercice a gagné, où il a perdu",
      notions: ["income_statement"],
      tableau: compteDeResultatDeNova,
      texte: (c) => {
        const x = soldesDeNova(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, sur le premier exercice ${dE(x.entreprise)}, clôturé au 31 décembre N : la balance, les travaux d'inventaire, les régularisations et l'impôt sont passés. Voici son compte de résultat, compte par compte. Il se termine sur un résultat net de ${eur(x.resultatNet)}.`,
          "Un seul chiffre ne dit pas d'où il vient. Les soldes intermédiaires de gestion découpent le compte de résultat en étages : ce que l'activité a créé, ce qu'en ont pris le personnel, l'usure de l'équipement et les risques, les prêteurs, l'État. Chaque étage répond à une question.",
          `Ce que la simulation suppose : ${x.entreprise} fabrique ce qu'elle livre et ne garde aucune enceinte finie (pas de production stockée), ne revend rien en l'état (pas de marge commerciale), ne paie pas encore d'impôts et taxes (la cotisation foncière n'est pas due l'année de la création) et ne connaît ni subvention ni opération exceptionnelle. L'escompte accordé à Sonora est une charge financière.`,
        ];
      },
      repere: () =>
        "Production, valeur ajoutée, excédent brut d'exploitation, résultat d'exploitation, résultat courant avant impôt, résultat net : chaque solde se calcule à partir du précédent.",
    },
    {
      id: "production-et-consommations",
      type: "montants",
      titre: "La production et les consommations",
      notions: ["income_statement", "stock"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `La production vendue est le solde du compte 701, régularisations comprises : ${eur(x.ventesDeLaBalance)} de la balance, plus la facture à établir, moins le produit constaté d'avance. Les achats consommés sont les achats de composants (${eur(x.achatsDeLaBalance)} de la balance et la facture non parvenue), moins le stock qui reste. Les consommations en provenance des tiers ajoutent les achats non stockés (606) et les services extérieurs (loyer et assurance). Calculez-les.`;
      },
      champs: (c) => {
        const x = soldesDeNova(c);
        return [
          {
            libelle: "Production de l'exercice",
            attendu: x.sig.production,
            calcul: `${eur(x.ventesDeLaBalance)} ${terme(x.factureAEtablir)} de facture à établir ${terme(-x.produitConstateDAvance)} de produit constaté d'avance = ${eur(x.sig.production)}`,
          },
          {
            libelle: "Achats consommés de composants",
            attendu: x.achatsConsommes,
            calcul: `${eur(x.achatsDeLaBalance)} ${terme(x.factureNonParvenue)} de facture non parvenue ${terme(-x.stockFinal)} de stock final = ${eur(x.achatsConsommes)}`,
          },
          {
            libelle: "Consommations en provenance des tiers",
            attendu: x.sig.consommations,
            calcul: `${eur(x.achatsConsommes)} + ${eur(x.achatsNonStockes)} + ${eur(x.loyerDuLocal)} de loyer + ${eur(x.assurance)} d'assurance = ${eur(x.sig.consommations)}`,
          },
        ];
      },
      explication: (c) => {
        const x = soldesDeNova(c);
        return [
          `Les régularisations ont déjà joué : la production compte la commande urgente livrée en décembre et pas les enceintes livrées en janvier ; les consommations comptent les composants sans facture et pas ceux qui restent en stock, ni la part de l'assurance qui couvre N+1. Un solde de gestion n'est juste que sur des comptes régularisés.`,
          `Le stock final, ${eur(x.stockFinal)}, ne se retrouve pas en production stockée : ce sont des composants, pas des enceintes. Il diminue les achats consommés.`,
        ];
      },
    },
    {
      id: "valeur-ajoutee",
      type: "montants",
      titre: "La valeur ajoutée",
      notions: ["income_statement"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `La valeur ajoutée est la marge commerciale plus la production, moins les consommations en provenance des tiers : ce que ${x.entreprise} a créé en plus de ce qu'elle a acheté à d'autres entreprises. Calculez-la, puis le taux de valeur ajoutée (valeur ajoutée ÷ production × 100).`;
      },
      champs: (c) => {
        const x = soldesDeNova(c);
        return [
          { libelle: "Valeur ajoutée", attendu: x.sig.valeurAjoutee, calcul: `0 € de marge commerciale + ${eur(x.sig.production)} − ${eur(x.sig.consommations)} = ${eur(x.sig.valeurAjoutee)}` },
          { libelle: "Taux de valeur ajoutée (%)", attendu: x.tauxDeValeurAjoutee, calcul: `${eur(x.sig.valeurAjoutee)} ÷ ${eur(x.sig.production)} × 100 = ${pct(x.tauxDeValeurAjoutee)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = soldesDeNova(c);
        return [
          `Sur 100 € de production, ${x.entreprise} en crée ${eur(x.tauxDeValeurAjoutee)} elle-même : un assembleur achète beaucoup. La valeur ajoutée, ${eur(x.sig.valeurAjoutee)}, va se partager entre le personnel, l'État, les prêteurs, et ce qui reste à l'entreprise.`,
        ];
      },
    },
    {
      id: "ebe",
      type: "montants",
      titre: "L'excédent brut d'exploitation",
      notions: ["ebitda_margin"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `L'excédent brut d'exploitation est la valeur ajoutée, plus les subventions d'exploitation, moins les impôts et taxes et les charges de personnel. ${x.entreprise} n'a ni subvention ni impôts et taxes cette année. Calculez les charges de personnel (rémunérations, ${eur(x.remunerations)}, et charges sociales, ${eur(x.chargesSociales)}), puis l'excédent brut d'exploitation.`;
      },
      champs: (c) => {
        const x = soldesDeNova(c);
        return [
          { libelle: "Charges de personnel", attendu: x.sig.personnel, calcul: `${eur(x.remunerations)} + ${eur(x.chargesSociales)} = ${eur(x.sig.personnel)}` },
          { libelle: "Excédent brut d'exploitation", attendu: x.sig.excedentBrutDExploitation, calcul: `${eur(x.sig.valeurAjoutee)} − ${eur(x.sig.personnel)} = ${eur(x.sig.excedentBrutDExploitation)}` },
        ];
      },
      explication: (c) => {
        const x = soldesDeNova(c);
        return [
          `L'activité de ${x.entreprise}, une fois payés ses fournisseurs et son personnel, dégage ${eur(x.sig.excedentBrutDExploitation)}. Rien de ce qui vient après (l'usure de la ligne, la créance douteuse, le litige, les intérêts, l'impôt) n'y entre.`,
        ];
      },
    },
    {
      id: "predire-la-location",
      type: "choix",
      titre: "Pariez sur la ligne louée",
      notions: ["ebitda_margin", "depreciation"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `Avant de calculer, pariez. Supposez que ${x.entreprise} ait loué sa ligne de montage au lieu de l'acheter, à un loyer qui laisse le résultat de l'exercice exactement le même. Son excédent brut d'exploitation serait…`;
      },
      options: (c) => {
        const x = soldesDeNova(c);
        const ebe = x.louee.sig.excedentBrutDExploitation;
        const voir = "Louez la ligne à l'étape suivante : le curseur montre ce que le loyer fait à l'EBE et au résultat.";
        return [
          { texte: "Plus bas : le loyer est une consommation, la dotation ne l'était pas", juste: ebe < x.sig.excedentBrutDExploitation, retour: `Bon pari. ${voir}` },
          { texte: "Le même : le résultat ne change pas", juste: ebe === x.sig.excedentBrutDExploitation, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus haut : la dotation disparaît", juste: ebe > x.sig.excedentBrutDExploitation, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "louer-la-ligne",
      type: "curseur",
      titre: "Louez la ligne",
      notions: ["ebitda_margin", "depreciation"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `Faites louer la ligne de ${LOYER_DU_CURSEUR.min.toLocaleString("fr-FR")} à ${LOYER_DU_CURSEUR.max.toLocaleString("fr-FR")} € par an, à partir du 6 janvier. Louée, elle ne s'amortit plus, et les ${eur(x.f.equipement.ht)} qu'elle n'a pas coûté restent placés à ${pct(x.f.placement.tauxAnnuel * 100)}. Une droite donne ce que l'achat coûte à l'exercice, l'autre ce que coûte la location. Placez le curseur sur le loyer le plus haut où louer ne coûte pas plus qu'acheter, puis validez.`;
      },
      grandeur: () => ({ libelle: "Loyer annuel de la ligne", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: soldesDeNova(c).loyerDEquilibre, min: LOYER_DU_CURSEUR.min, max: LOYER_DU_CURSEUR.max }),
      zones: ["Louer ne coûte pas plus", "Acheter coûte moins"],
      rates: () => ({
        dessous: "À ce loyer, louer coûte encore moins qu'acheter : le loyer peut monter.",
        dessus: "À ce loyer, la location coûte plus que l'achat à l'exercice : cherchez plus bas.",
      }),
      montrer: "Montrer le loyer",
      lecture: (c, loyer) => {
        const x = soldesDeNova(c);
        const a = anneeDeNova(x.f, { loyerDeLaLigne: loyer });
        return [
          { libelle: "Loyer de l'exercice", montant: a.loyer },
          { libelle: "Excédent brut d'exploitation, ligne louée", montant: a.sig.excedentBrutDExploitation },
          { libelle: "Résultat courant avant impôt, ligne louée", montant: a.sig.resultatCourantAvantImpot, fort: true },
          { libelle: "Résultat courant avant impôt, ligne achetée", montant: x.sig.resultatCourantAvantImpot },
          { libelle: "Capacité d'autofinancement, ligne louée", montant: a.caf.additive },
        ];
      },
      droites: (c) => {
        const x = soldesDeNova(c);
        const e = x.f.equipement;
        const part = x.jours / JOURS_DE_L_ANNEE;
        return {
          produit: () => (e.ht / e.dureeAns) * part + e.ht * x.f.placement.tauxAnnuel * part,
          cout: (loyer) => loyer * part,
          libelles: ["Ce que l'achat coûte à l'exercice", "Ce que la location coûte à l'exercice"],
        };
      },
      explication: (c) => {
        const x = soldesDeNova(c);
        const l = x.louee;
        return [
          `Jusqu'à ${eur(x.loyerDEquilibre)} par an, louer ne coûte pas plus qu'acheter : c'est l'annuité d'amortissement, ${eur(auCentime(x.f.equipement.ht / x.f.equipement.dureeAns))}, plus ce que les ${eur(x.f.equipement.ht)} rapporteraient placés, ${eur(auCentime(x.f.equipement.ht * x.f.placement.tauxAnnuel))}. Sur l'exercice, ${qte(x.jours)} jours, la dotation de ${eur(x.dotationDeLaLigne)} et ${eur(l.placementGarde)} d'intérêts face à ${eur(l.loyer)} de loyer.`,
          `À ce loyer, le résultat courant est le même, ${eur(l.sig.resultatCourantAvantImpot)}, mais l'EBE tombe de ${eur(x.sig.excedentBrutDExploitation)} à ${eur(l.sig.excedentBrutDExploitation)} : le loyer est une consommation, au-dessus de l'EBE ; la dotation et les intérêts sont en dessous. Et la capacité d'autofinancement baisse de la dotation, qui ne sortait pas de la caisse.`,
        ];
      },
    },
    {
      id: "ce-que-mesure-l-ebe",
      type: "choix",
      titre: "Ce que mesure l'EBE",
      notions: ["ebitda_margin"],
      question: () => "Pourquoi l'analyste regarde-t-il l'excédent brut d'exploitation avant le résultat, pour juger l'activité d'une entreprise ?",
      options: () => [
        {
          texte: "Parce qu'il ne dépend ni de la façon dont l'entreprise est financée, ni de sa politique d'amortissement : il mesure l'activité seule",
          juste: true,
          retour:
            "C'est cela. Les intérêts dépendent de la dette choisie, les dotations du plan d'amortissement. L'EBE se calcule avant les deux : deux entreprises au même métier se comparent par leur EBE, quelle que soit leur dette. Le curseur a montré sa limite : louer ou acheter le même équipement le fait bouger. C'est ce que les retraitements corrigent.",
        },
        {
          texte: "Parce qu'il est toujours plus élevé que le résultat, et présente mieux",
          juste: false,
          retour: "Il est souvent plus élevé, mais ce n'est pas sa raison d'être. Il isole l'activité de ses choix de financement et d'amortissement.",
        },
        {
          texte: "Parce que c'est la trésorerie que l'entreprise a gagnée dans l'année",
          juste: false,
          retour: "Pas tout à fait : l'EBE compte les ventes facturées, pas encaissées. Les délais des clients et des fournisseurs l'éloignent de la trésorerie, on le verra avec la CAF.",
        },
      ],
    },
    {
      id: "jusqu-au-resultat",
      type: "montants",
      titre: "Du résultat d'exploitation au résultat net",
      notions: ["income_statement", "depreciation"],
      question: () =>
        "Sans formule cette fois. Descendez la cascade jusqu'au résultat net : le résultat d'exploitation, le résultat financier, le résultat courant avant impôt, puis le résultat net. Négatif pour un résultat en perte.",
      champs: (c) => {
        const x = soldesDeNova(c);
        const g = x.sig;
        return [
          {
            libelle: "Résultat d'exploitation",
            attendu: g.resultatDExploitation,
            calcul: `${eur(g.excedentBrutDExploitation)} − (${eur(x.dotationDeLaLigne)} d'amortissement + ${eur(x.depreciation)} de dépréciation + ${eur(x.provision)} de provision) = ${eur(g.resultatDExploitation)}`,
          },
          {
            libelle: "Résultat financier",
            attendu: g.resultatFinancier,
            calcul: `${eur(x.interetsDuPlacement)} d'intérêts du placement − (${eur(x.interetsDeLEmprunt)} d'intérêts de l'emprunt + ${eur(x.escompte)} d'escompte) = ${eur(g.resultatFinancier)}`,
          },
          { libelle: "Résultat courant avant impôt", attendu: g.resultatCourantAvantImpot, calcul: `${eur(g.resultatDExploitation)} ${terme(g.resultatFinancier)} = ${eur(g.resultatCourantAvantImpot)}` },
          { libelle: "Résultat net", attendu: g.resultatNet, calcul: `${eur(g.resultatCourantAvantImpot)} + 0 € d'exceptionnel − ${eur(x.impot)} d'impôt = ${eur(g.resultatNet)}` },
        ];
      },
      explication: (c) => {
        const x = soldesDeNova(c);
        return [
          `Les dotations ne sont pas que l'usure de la ligne : la dépréciation de la créance de Sonora et la provision pour le litige sont aussi des charges calculées, sous l'EBE. Les intérêts de l'emprunt comptent les ${eur(x.interetsCourus)} courus au 31 décembre, et l'escompte accordé à Sonora est une charge financière.`,
          `Sans opération exceptionnelle, le résultat courant avant impôt est le résultat avant impôt de la clôture, ${eur(x.sig.resultatCourantAvantImpot)}.`,
        ];
      },
    },
    {
      id: "predire-la-caf",
      type: "choix",
      titre: "Pariez sur la CAF",
      notions: ["depreciation", "income_statement"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `Avant de calculer, pariez. ${x.entreprise} passe sa ligne en amortissement dégressif : la dotation de l'exercice monte de ${eur(x.dotationDeLaLigne)} à ${eur(x.degressif.dotationDeLaLigne)}, et le résultat baisse. Sa capacité d'autofinancement…`;
      },
      options: (c) => {
        const x = soldesDeNova(c);
        const apres = x.degressif.caf.additive;
        const voir = "Le laboratoire suivant fait jouer le mode d'amortissement avec d'autres choix : regardez la CAF à chaque essai.";
        return [
          { texte: "Baisse avec le résultat", juste: apres < x.caf.additive, retour: `Pari à vérifier. ${voir}` },
          { texte: "Ne bouge pas : la dotation ne sort pas de la caisse", juste: apres === x.caf.additive, retour: `Pari à vérifier. ${voir}` },
          { texte: "Monte, alors que le résultat baisse", juste: apres > x.caf.additive, retour: `Bon pari. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-ebe",
      type: "simulation",
      titre: "Le laboratoire de l'EBE",
      notions: ["ebitda_margin", "depreciation", "income_statement"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `Rejouez l'exercice ${dE(x.entreprise)} avec d'autres choix : le mode d'amortissement de la ligne, la perte estimée sur la créance de Sonora, le taux de l'emprunt, la ligne louée ${eur(x.loyerDEquilibre)} par an au lieu d'être achetée. Le tableau suit l'EBE, le résultat courant et la CAF, l'impôt recalculé. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = soldesDeNova(c);
        return [
          {
            code: "mode",
            libelle: "Amortissement de la ligne",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: 0,
            choix: [
              { valeur: 0, libelle: "linéaire" },
              { valeur: 1, libelle: "dégressif" },
            ],
          },
          { code: "perte", libelle: "Perte estimée sur la créance de Sonora", unite: "%", ...PERTE_DU_LABORATOIRE, depart: enPourcent(x.f.sonora.redressement.tauxDePerteProbable) },
          { code: "taux", libelle: "Taux de l'emprunt", unite: "%", ...TAUX_DU_LABORATOIRE, depart: enPourcent(x.f.pret.tauxAnnuel) },
          {
            code: "ligne",
            libelle: "La ligne de montage",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: 0,
            choix: [
              { valeur: 0, libelle: "achetée" },
              { valeur: 1, libelle: `louée ${eur(x.loyerDEquilibre)} par an` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = soldesDeNova(c);
        const a = laboratoireDeLEbe(x, p);
        return [
          { libelle: "Excédent brut d'exploitation", montant: a.sig.excedentBrutDExploitation, reference: x.sig.excedentBrutDExploitation },
          { libelle: "Résultat d'exploitation", montant: a.sig.resultatDExploitation, reference: x.sig.resultatDExploitation },
          { libelle: "Résultat courant avant impôt", montant: a.sig.resultatCourantAvantImpot, reference: x.sig.resultatCourantAvantImpot },
          { libelle: "Impôt sur les sociétés", montant: a.impot, reference: x.impot },
          { libelle: "Capacité d'autofinancement", montant: a.caf.additive, reference: x.caf.additive },
          { libelle: "L'EBE, face au départ", montant: auCentime(a.sig.excedentBrutDExploitation - x.sig.excedentBrutDExploitation), reference: 0, effet: true },
          { libelle: "Le résultat courant, face au départ", montant: auCentime(a.sig.resultatCourantAvantImpot - x.sig.resultatCourantAvantImpot), reference: 0, effet: true, fort: true },
          { libelle: "La CAF, face au départ", montant: auCentime(a.caf.additive - x.caf.additive), reference: 0, effet: true },
        ].map((y) => ({ ...y, montant: y.montant + 0 }));
      },
      defi: (c) => {
        const x = soldesDeNova(c);
        const ecarts = (p: Readonly<Record<string, number>>) => {
          const a = laboratoireDeLEbe(x, p);
          return {
            ebe: auCentime(a.sig.excedentBrutDExploitation - x.sig.excedentBrutDExploitation),
            rcai: auCentime(a.sig.resultatCourantAvantImpot - x.sig.resultatCourantAvantImpot),
            caf: auCentime(a.caf.additive - x.caf.additive),
          };
        };
        return {
          consigne: `Faites baisser le résultat courant avant impôt d'au moins ${eur(BAISSE_DU_DEFI)}, sans faire baisser ni l'EBE ni la capacité d'autofinancement.`,
          atteint: (p) => {
            const e = ecarts(p);
            return e.rcai <= -BAISSE_DU_DEFI && e.ebe >= 0 && e.caf >= 0;
          },
          indice: (p) => {
            const e = ecarts(p);
            if (e.ebe < 0) return `L'EBE a baissé de ${eur(-e.ebe)} : le loyer de la ligne est une consommation. Gardez la ligne achetée.`;
            if (e.caf < 0) return `La CAF a baissé de ${eur(-e.caf)} : des intérêts en plus se paient, ils sortent de la caisse. Cherchez une charge qui ne se paie pas.`;
            const baisse = e.rcai < 0 ? `n'a baissé que de ${eur(-e.rcai)}` : "n'a pas baissé";
            return `Le résultat courant ${baisse}. Quelles charges baissent le résultat sans rien faire sortir de la caisse ?`;
          },
          solution: { mode: 1, perte: 50, taux: enPourcent(x.f.pret.tauxAnnuel), ligne: 0 },
        };
      },
      explication: (c, p) => {
        const x = soldesDeNova(c);
        const a = laboratoireDeLEbe(x, p);
        const rcai = auCentime(x.sig.resultatCourantAvantImpot - a.sig.resultatCourantAvantImpot);
        return [
          `Le résultat courant a perdu ${eur(rcai)}, l'EBE n'a pas bougé, et la capacité d'autofinancement a gagné ${eur(auCentime(a.caf.additive - x.caf.additive))}. Le dégressif et une perte estimée plus forte sont des charges calculées : elles ne sortent pas de la caisse, mais elles font payer ${eur(auCentime(x.impot - a.impot))} d'impôt en moins.`,
          "Le taux de l'emprunt, lui, baisse le résultat et la CAF ensemble : des intérêts se paient. Et la ligne louée baisse l'EBE sans toucher le résultat. L'EBE ne voit que l'exploitation : ni le financement, ni l'amortissement, ni les provisions. C'est ce qui le rend comparable, et ce qui oblige à retraiter la location.",
        ];
      },
    },
    {
      id: "caf",
      type: "montants",
      titre: "La capacité d'autofinancement",
      notions: ["income_statement", "net_treasury", "depreciation"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `La capacité d'autofinancement est ce que l'activité de l'exercice laisse à ${x.entreprise} pour investir, rembourser ou distribuer. Méthode additive : le résultat net plus les charges calculées (les dotations), moins les reprises. Méthode soustractive : l'EBE plus les produits encaissables, moins les charges décaissables et l'impôt. Calculez les dotations à rajouter, puis la CAF des deux façons.`;
      },
      champs: (c) => {
        const x = soldesDeNova(c);
        return [
          {
            libelle: "Dotations à rajouter au résultat",
            attendu: x.caf.dotations,
            calcul: `${eur(x.dotationDeLaLigne)} + ${eur(x.depreciation)} + ${eur(x.provision)} = ${eur(x.caf.dotations)}`,
          },
          { libelle: "CAF, méthode additive", attendu: x.caf.additive, calcul: `${eur(x.resultatNet)} + ${eur(x.caf.dotations)} = ${eur(x.caf.additive)}` },
          {
            libelle: "CAF, méthode soustractive",
            attendu: x.caf.soustractive,
            calcul: `${eur(x.sig.excedentBrutDExploitation)} + ${eur(x.interetsDuPlacement)} d'intérêts du placement − ${eur(x.sig.chargesFinancieres)} de charges financières − ${eur(x.impot)} d'impôt = ${eur(x.caf.soustractive)}`,
          },
        ];
      },
      explication: (c) => {
        const x = soldesDeNova(c);
        return [
          "Les deux chemins arrivent au même chiffre : les dotations sont les seules charges de l'exercice qui ne se paient pas, et ce sont elles que la méthode additive rajoute. Les intérêts du placement, versés en janvier, sont encaissables : la CAF les compte.",
          `${x.entreprise} peut financer ${eur(x.caf.additive)} d'investissements ou de remboursements avec ce que son activité a dégagé. Le laboratoire l'a montré : plus de dotations, c'est moins de résultat mais plus de CAF, par l'impôt économisé.`,
        ];
      },
    },
    {
      id: "caf-et-tresorerie",
      type: "choix",
      titre: "La CAF et la trésorerie",
      notions: ["net_treasury", "bfr"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `La CAF ${dE(x.entreprise)} est de ${eur(x.caf.additive)}. Pourtant, entre le 6 janvier, la ligne payée (${eur(x.tresorerieDeDepart)} en banque et sur le compte à terme), et le 31 décembre (${eur(x.tresorerieDeFin)}), la trésorerie n'a gagné que ${eur(x.variationDeTresorerie)}. Pourquoi les deux chiffres diffèrent-ils ?`;
      },
      options: (c) => {
        const x = soldesDeNova(c);
        return [
          {
            texte: `Parce que la CAF compte l'encaissable, pas l'encaissé, et ignore les ${eur(x.capitalRembourse)} d'emprunt remboursés et les écarts de délais`,
            juste: true,
            retour: `C'est cela. La CAF est une capacité : ce que l'activité permet de financer. La trésorerie, ce qui reste une fois payés les écarts de délais (clients, fournisseurs, stock, TVA, impôt dû), les ${eur(x.capitalRembourse)} de capital remboursé et les intérêts du placement encore à recevoir. Le bilan fonctionnel, au chapitre suivant, met ces flux en face.`,
          },
          {
            texte: "Parce que la CAF comprend la dotation aux amortissements, qui sort de la banque",
            juste: false,
            retour: "C'est l'inverse : la dotation ne sort pas de la banque, c'est pour cela que la CAF la rajoute au résultat.",
          },
          {
            texte: `Parce que les ${eur(x.interetsDuPlacement)} d'intérêts du placement ne sont pas dans la CAF`,
            juste: false,
            retour: "C'est l'inverse : la CAF les compte, ils sont encaissables. Ils ne sont pas encore en banque, et c'est l'une des raisons de l'écart.",
          },
        ];
      },
    },
    {
      id: "partage-de-la-valeur-ajoutee",
      type: "montants",
      titre: "Le partage de la valeur ajoutée",
      notions: ["income_statement", "payroll"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `La valeur ajoutée ${dE(x.entreprise)}, ${eur(x.sig.valeurAjoutee)}, se partage. Quelle part en prennent le personnel, les prêteurs et l'État ? Donnez chaque part en % de la valeur ajoutée, au centième.`;
      },
      champs: (c) => {
        const x = soldesDeNova(c);
        const va = eur(x.sig.valeurAjoutee);
        return [
          { libelle: "Part du personnel (%)", attendu: x.partDuPersonnel, calcul: `${eur(x.sig.personnel)} de charges de personnel ÷ ${va} × 100 = ${pct(x.partDuPersonnel)}`, tolerance: 0.01 },
          { libelle: "Part des prêteurs (%)", attendu: x.partDesPreteurs, calcul: `${eur(x.sig.chargesFinancieres)} de charges financières ÷ ${va} × 100 = ${pct(x.partDesPreteurs)}`, tolerance: 0.01 },
          { libelle: "Part de l'État (%)", attendu: x.partDeLEtat, calcul: `(0 € d'impôts et taxes + ${eur(x.impot)} d'impôt sur les sociétés) ÷ ${va} × 100 = ${pct(x.partDeLEtat)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = soldesDeNova(c);
        const reste = auCentime(100 - x.partDuPersonnel - x.partDesPreteurs - x.partDeLEtat);
        return [
          `Le personnel prend ${pct(x.partDuPersonnel)} de la valeur ajoutée, l'État ${pct(x.partDeLEtat)}, les prêteurs ${pct(x.partDesPreteurs)} : il reste ${pct(reste)} à l'entreprise, pour renouveler son équipement, couvrir ses risques et rémunérer ses associés.`,
          "Une part du personnel forte dit une activité de main-d'œuvre ; une part des prêteurs forte, une entreprise endettée. Ces parts se comparent d'une année à l'autre, et entre entreprises du même métier.",
        ];
      },
    },
    {
      id: "les-retraitements",
      type: "montants",
      titre: "Les retraitements de l'analyste",
      notions: ["ebitda_margin", "depreciation", "payroll"],
      tableau: tableauDeLaVariante,
      question: (c) => {
        const x = soldesDeNova(c);
        return `Variante : la même année, ${x.entreprise} a pris sa ligne en crédit-bail au lieu de l'acheter, et remplacé un salarié par un intérimaire, au même coût. Calculez la valeur ajoutée et l'EBE de la variante tels que le compte de résultat les donne, puis retraitez comme l'analyste : l'intérim rangé avec le personnel, le crédit-bail traité comme un achat financé par emprunt (une dotation, et des intérêts pour le reste). Donnez la valeur ajoutée et l'EBE retraités, et les charges financières retraitées.`;
      },
      champs: (c) => {
        const x = soldesDeNova(c);
        const v = x.variante;
        const brut = v.sig;
        const r = v.retraite;
        return [
          { libelle: "Valeur ajoutée de la variante, sans retraitement", attendu: brut.valeurAjoutee, calcul: `${eur(brut.production)} − ${eur(brut.consommations)} = ${eur(brut.valeurAjoutee)}` },
          { libelle: "EBE de la variante, sans retraitement", attendu: brut.excedentBrutDExploitation, calcul: `${eur(brut.valeurAjoutee)} − ${eur(brut.personnel)} = ${eur(brut.excedentBrutDExploitation)}` },
          {
            libelle: "Valeur ajoutée retraitée",
            attendu: r.valeurAjoutee,
            calcul: `${eur(brut.valeurAjoutee)} + ${eur(v.interim)} d'intérim + ${eur(REDEVANCES_DE_CREDIT_BAIL)} de redevances = ${eur(r.valeurAjoutee)}`,
          },
          { libelle: "EBE retraité", attendu: r.excedentBrutDExploitation, calcul: `${eur(r.valeurAjoutee)} − (${eur(brut.personnel)} + ${eur(v.interim)}) = ${eur(r.excedentBrutDExploitation)}` },
          {
            libelle: "Charges financières retraitées",
            attendu: r.chargesFinancieres,
            calcul: `${eur(brut.chargesFinancieres)} + (${eur(REDEVANCES_DE_CREDIT_BAIL)} − ${eur(v.dotationEquivalente)} de dotation) = ${eur(r.chargesFinancieres)}`,
          },
        ];
      },
      explication: (c) => {
        const x = soldesDeNova(c);
        const v = x.variante;
        return [
          `Sans retraitement, la variante paraît créer ${eur(auCentime(x.sig.valeurAjoutee - v.sig.valeurAjoutee))} de valeur ajoutée en moins et dégager ${eur(auCentime(x.sig.excedentBrutDExploitation - v.sig.excedentBrutDExploitation))} d'EBE en moins, alors que l'atelier, les ventes et le personnel au travail sont les mêmes. Retraitée, elle retrouve la valeur ajoutée et l'EBE ${dE(x.entreprise)} propriétaire et employeur : ${eur(v.retraite.valeurAjoutee)} et ${eur(v.retraite.excedentBrutDExploitation)}.`,
          `Le résultat courant ne bouge pas, ${eur(v.retraite.resultatCourantAvantImpot)} dans les deux lectures : la redevance se partage entre une dotation, ${eur(v.dotationEquivalente)}, et des intérêts, ${eur(v.partInterets)}. Un retraitement change les étages, jamais le bas de la cascade.`,
        ];
      },
    },
    {
      id: "pourquoi-retraiter",
      type: "choix",
      titre: "Pourquoi retraiter",
      notions: ["ebitda_margin"],
      question: () => "Pourquoi la Banque de France et les analystes retraitent-ils le crédit-bail et le personnel extérieur avant de comparer deux entreprises ?",
      options: () => [
        {
          texte: "Pour que la façon de tenir l'équipement et d'employer le personnel ne change ni la valeur ajoutée ni l'EBE",
          juste: true,
          retour:
            "C'est cela : la réalité économique avant la forme juridique. Une ligne en crédit-bail sert l'atelier comme une ligne achetée à crédit ; un intérimaire travaille comme un salarié. Retraitées, deux entreprises au même métier se comparent sur leur activité.",
        },
        {
          texte: "Parce que le crédit-bail est juridiquement un emprunt",
          juste: false,
          retour: "Non : juridiquement, c'est une location, et l'entreprise n'est pas propriétaire. Le retraitement est économique : il traite la redevance comme si l'équipement avait été acheté à crédit.",
        },
        {
          texte: "Pour faire monter l'EBE des entreprises qui louent leur équipement",
          juste: false,
          retour: "L'EBE retraité monte, mais ce n'est pas le but : le retraitement rend comparable, il ne flatte pas. Le résultat, lui, ne change pas.",
        },
        {
          texte: "Parce que les redevances et l'intérim ne sont pas déductibles de l'impôt",
          juste: false,
          retour: "Ils le sont, comme les salaires et les dotations. Le retraitement ne touche ni le résultat ni l'impôt : seulement le rangement des charges entre les étages.",
        },
      ],
    },
    {
      id: "emprunter-pour-placer",
      type: "montants",
      titre: "Emprunter à 5 % pour placer à 3 %",
      notions: ["loan_schedule", "profitability_vs_return"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `${x.entreprise} a emprunté ${eur(x.f.pret.capital)} à ${pct(x.f.pret.tauxAnnuel * 100)} le 3 janvier, et placé sa réserve à ${pct(x.f.placement.tauxAnnuel * 100)} le 6 : sans l'emprunt, ces ${eur(x.f.pret.capital)} n'auraient pas été placés. Chiffrez sur l'exercice ce que l'emprunt a coûté (intérêts payés et courus), ce que les mêmes fonds ont rapporté placés, le coût net avant impôt, puis après impôt.`;
      },
      champs: (c) => {
        const x = soldesDeNova(c);
        return [
          {
            libelle: "Ce que l'emprunt a coûté sur l'exercice",
            attendu: x.interetsDeLEmprunt,
            calcul: `${eur(x.interetsPayes)} d'intérêts payés + ${eur(x.interetsCourus)} d'intérêts courus = ${eur(x.interetsDeLEmprunt)}`,
          },
          {
            libelle: "Ce que les mêmes fonds ont rapporté placés",
            attendu: x.produitDesFondsPlaces,
            calcul: `${eur(x.f.pret.capital)} × ${pct(x.f.placement.tauxAnnuel * 100)} × ${qte(joursCompris(x.f.placement.date, x.f.cloture))} ÷ 360 = ${eur(x.produitDesFondsPlaces)}`,
          },
          { libelle: "Coût net avant impôt", attendu: x.coutNetAvantImpot, calcul: `${eur(x.interetsDeLEmprunt)} − ${eur(x.produitDesFondsPlaces)} = ${eur(x.coutNetAvantImpot)}` },
          {
            libelle: "Coût net après impôt",
            attendu: x.coutNetApresImpot,
            calcul: `${eur(x.coutNetAvantImpot)} × (1 − ${pct(x.f.impot.tauxNormal * 100)}) = ${eur(x.coutNetApresImpot)} : ${x.entreprise} est imposée au taux normal sur ses derniers euros`,
          },
        ];
      },
      explication: (c) => {
        const x = soldesDeNova(c);
        return [
          `Garder l'emprunt pour placer a coûté ${eur(x.coutNetApresImpot)} après impôt. Ce n'est pas ${eur(x.ecartDesTauxSurLeCapital)}, ${qte(x.ecartDesTaux)} points sur tout le capital : l'emprunt se rembourse chaque trimestre, ses intérêts portent sur un capital qui baisse, quand le placement garde son montant.`,
          "Le coût se loge au résultat financier, sous le résultat d'exploitation : l'EBE ne le voit pas. Une entreprise qui emprunte plus cher qu'elle ne place joue un effet de levier à l'envers.",
        ];
      },
    },
    {
      id: "garder-l-emprunt",
      type: "choix",
      titre: "Fallait-il emprunter",
      notions: ["loan_schedule", "profitability_vs_return"],
      question: (c) => {
        const x = soldesDeNova(c);
        return `Le dirigeant lit le chiffre : ${eur(x.coutNetApresImpot)} perdus après impôt à garder l'emprunt pour placer. « Ai-je eu tort d'emprunter ? » Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = soldesDeNova(c);
        return [
          {
            texte: "Sur le rendement, oui ; il ne se justifie que par la réserve qu'il garde pour la gamme à venir",
            juste: true,
            retour: `Oui. Placer à ${pct(x.f.placement.tauxAnnuel * 100)} ce qu'on emprunte à ${pct(x.f.pret.tauxAnnuel * 100)} ne rapporte jamais : chaque euro gardé coûte l'écart des taux. Ce coût, ${eur(x.coutNetApresImpot)} cette année, est le prix d'une réserve ; il se justifie si la seconde ligne et le lancement de la gamme en ont besoin, et si la banque risque de prêter moins facilement plus tard.`,
          },
          {
            texte: `Non : le placement rapporte ${eur(x.interetsDuPlacement)}, plus que les ${eur(x.interetsDeLEmprunt)} d'intérêts de l'emprunt`,
            juste: false,
            retour: `Non : c'est comparer des montants qui ne portent pas sur la même somme. Le placement rapporte ${eur(x.interetsDuPlacement)} sur ${eur(x.f.placement.montant)} ; sur les seuls ${eur(x.f.pret.capital)} empruntés, il ne rapporte que ${eur(x.produitDesFondsPlaces)}.`,
          },
          {
            texte: `Non : l'emprunt ne coûte que ${eur(x.ecartDesTauxSurLeCapital)}, ${qte(x.ecartDesTaux)} points sur ${eur(x.f.pret.capital)}`,
            juste: false,
            retour: `Le chiffre est faux, et le jugement aussi : le coût net est de ${eur(x.coutNetAvantImpot)} avant impôt. Les ${qte(x.ecartDesTaux)} points jouent sur un capital qui se rembourse, et le placement court ${qte(x.jours)} jours.`,
          },
          {
            texte: `Oui : il a perdu ${eur(x.interetsDeLEmprunt)}, tout le coût de l'emprunt`,
            juste: false,
            retour: `Non : c'est oublier ce que les fonds empruntés ont rapporté placés, ${eur(x.produitDesFondsPlaces)}. Le coût de la décision est l'écart, ${eur(x.coutNetAvantImpot)} avant impôt.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement", "ebitda_margin"],
      texte: (c) => {
        const x = soldesDeNova(c);
        return [
          `Vous avez lu l'exercice ${dE(x.entreprise)} étage par étage : ${eur(x.sig.valeurAjoutee)} de valeur ajoutée, ${eur(x.sig.excedentBrutDExploitation)} d'excédent brut d'exploitation, ${eur(x.sig.resultatDExploitation)} de résultat d'exploitation, ${eur(x.resultatNet)} de résultat net, et ${eur(x.caf.additive)} de capacité d'autofinancement, la même par les deux méthodes. Le personnel prend ${pct(x.partDuPersonnel)} de la valeur ajoutée.`,
          "Le curseur et le laboratoire l'ont montré : l'EBE ignore le financement, l'amortissement et les provisions, mais pas la location, qui est une consommation. Les dotations baissent le résultat et font monter la CAF par l'impôt économisé ; les intérêts baissent les deux.",
          "Au niveau de l'examen, vous savez dresser le tableau des soldes intermédiaires de gestion sur des comptes régularisés, calculer la CAF par les deux méthodes et la distinguer de la trésorerie, lire le partage de la valeur ajoutée, retraiter le crédit-bail et le personnel extérieur, et chiffrer, impôt compris, ce que coûte un emprunt gardé pour être placé.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Valeur ajoutée = marge commerciale + production − consommations en provenance des tiers. EBE = valeur ajoutée + subventions − impôts et taxes − personnel. CAF = résultat net + dotations − reprises, ou EBE + produits encaissables − charges décaissables − impôt.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// L'EXPORT DE COMPATIBILITÉ : L'ANNÉE FIGÉE DE L'ARÈNE, POUR LES CHAPITRES QUI LA LISENT ENCORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES SOLDES DE L'ANNÉE FIGÉE DE L'ARÈNE, dans toutes les entreprises du cours : l'export que lit
 * encore « L'effectif et la masse salariale ». C'est le calcul de l'ancien chapitre, à l'identique : les grandes masses de
 * l'année (`c.annee`), la dotation et la variation du stock en travaux d'inventaire, l'impôt au taux
 * de l'arène, et la trésorerie de l'année figée (monde/annee-du-cours.ts). Le chapitre ne la lit pas :
 * il joue sur l'exercice de NOVA du monde du cours (`soldesDeNova`).
 */
export function soldesDeGestion(c: Cas) {
  const a = c.annee;
  const autres = arrondiDeLArene(a.autresCoutsVariables + a.qualite);
  const chargesAvant = arrondiDeLArene(a.achats + autres + a.commissions + a.publicite + a.entretien + a.loyerEtFrais + a.personnel + a.interets);
  const resultatAvantInventaire = arrondiDeLArene(a.ventes - chargesAvant);
  const variation = a.stock ? arrondiDeLArene(a.stock.final - a.stock.initial) : 0;
  const resultatAvantImpot = arrondiDeLArene(resultatAvantInventaire - a.dotation + variation);
  const impot = resultatAvantImpot > 0 ? Math.round(resultatAvantImpot * a.tauxIS) : 0;
  const k = { ...a, autres, chargesAvant, resultatAvantInventaire, variation, resultatAvantImpot, impot, resultatNet: arrondiDeLArene(resultatAvantImpot - impot) };
  const marchandises = k.stock?.nature === "marchandises" || c.achat.compte.startsWith("607");
  // Le stock qui a baissé dans l'année s'ajoute aux achats (marchandises) ou se retranche de la
  // production (en-cours) : la variation est le stock final moins l'initial.
  const coutDesVendues = marchandises ? arrondiDeLArene(k.achats - k.variation) : 0;
  const margeCommerciale = marchandises ? arrondiDeLArene(k.ventes - coutDesVendues) : 0;
  const production = marchandises ? 0 : arrondiDeLArene(k.ventes + k.variation);
  const consommations = arrondiDeLArene((marchandises ? 0 : k.achats) + k.autres + k.commissions + k.publicite + k.entretien + k.loyerEtFrais);
  const valeurAjoutee = arrondiDeLArene(margeCommerciale + production - consommations);
  const ebe = arrondiDeLArene(valeurAjoutee - k.personnel);
  const resultatExploitation = arrondiDeLArene(ebe - k.dotation);
  const rcai = arrondiDeLArene(resultatExploitation - k.interets);
  const resultatNet = arrondiDeLArene(rcai - k.impot);
  const cafAdditive = arrondiDeLArene(resultatNet + k.dotation);
  const cafSoustractive = arrondiDeLArene(ebe - k.interets - k.impot);
  const r = anneeDuCours(c.code).partie.rounds;
  const tresorerie = {
    debut: arrondiDeLArene(r[0]!.results["joueur"]!.cashFlow.opening),
    fin: arrondiDeLArene(r[r.length - 1]!.results["joueur"]!.cashFlow.closing),
  };
  return {
    ...k,
    marchandises,
    coutDesVendues,
    margeCommerciale,
    production,
    consommations,
    valeurAjoutee,
    ebe,
    resultatExploitation,
    rcai,
    resultatNet,
    cafAdditive,
    cafSoustractive,
    tresorerie: { ...tresorerie, variation: arrondiDeLArene(tresorerie.fin - tresorerie.debut) },
    ebeDeLArene: arrondiDeLArene(r.reduce((t, x) => t + x.results["joueur"]!.incomeStatement.ebitda, 0)),
  };
}
