import { auCentime, rangDuJour, type DateDuCours } from "./amortissement";
import { bilanDuLycee } from "./comptes-du-lycee";
import type { FicheDeLExercice } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : OPTIMISER LA TRÉSORERIE DE NOVA, AU LYCÉE (Bac STMG, gestion et finance, 3.2).
 *
 * Le point de départ est le bilan du 31 décembre du premier exercice de NOVA (comptes-du-lycee.ts,
 * `bilanDuLycee`), le même que celui du chapitre « Fonds de roulement, besoin en fonds de roulement
 * et trésorerie », au centime. Deux questions s'y posent :
 *
 *   · L'EXCÉDENT : ce que NOVA peut placer, une fois mis de côté ce qu'elle doit payer dans le mois
 *     (ses fournisseurs, l'État et le personnel), et ce que cela rapporte selon le placement ;
 *   · LE MANQUE : le compte à terme de la fiche est bloqué jusqu'à son échéance, le 6 janvier. Un
 *     équipement payé comptant le 31 décembre au-delà de ce qu'il y a en banque met la banque à
 *     découvert pendant ces quelques jours, alors même que la trésorerie reste positive. Quatre
 *     solutions le couvrent : le découvert, l'escompte de la facture de décembre de CampusTech,
 *     une avance des associés en compte courant, ou casser le compte à terme.
 *
 * Les jours se comptent sur le calendrier commercial du cours (mois de 30 jours, année de 360
 * jours, amortissement.ts), comme les banques comptent leurs agios. Les taux ci-dessous sont des
 * HYPOTHÈSES DU COURS, des ordres de grandeur du marché pour une petite entreprise.
 */

/** Le taux annuel des agios d'un découvert (HYPOTHÈSE DU COURS) : le découvert est le concours le plus cher à l'année. */
export const TAUX_DU_DECOUVERT = 0.1;

/** Le taux annuel de l'escompte d'une créance (HYPOTHÈSE DU COURS) : moins cher que le découvert, mais compté jusqu'à l'échéance de la créance. */
export const TAUX_DE_L_ESCOMPTE = 0.06;

/** L'intérêt que NOVA verse à ses associés sur une avance en compte courant (HYPOTHÈSE DU COURS). */
export const TAUX_DU_COMPTE_COURANT = 0.02;

/**
 * Le taux d'un compte rémunéré, où l'argent reste disponible à tout moment (HYPOTHÈSE DU COURS) :
 * plus bas que celui du compte à terme de la fiche, qui bloque l'argent un an.
 */
export const TAUX_DU_COMPTE_REMUNERE = 0.01;

/** Les jours d'une année pour la banque : 360, l'année commerciale. */
export const JOURS_DE_L_ANNEE_BANCAIRE = 360;

/**
 * Les solutions pour couvrir un manque passager, dans l'ordre du levier à choix du laboratoire.
 * HYPOTHÈSES DU COURS : l'escompte porte sur la facture de décembre de CampusTech, que NOVA lui a
 * fait accepter sous forme d'effet de commerce, et le découvert couvre le reste ; les associés
 * peuvent avancer tout ce qui manque ; un compte à terme cassé avant son échéance rend son
 * capital, sans aucun intérêt, et le découvert couvre ce qu'il ne couvre pas.
 */
export const SOLUTIONS_DU_MANQUE = ["decouvert", "escompte", "compte-courant", "casser"] as const;
export type SolutionDuManque = (typeof SOLUTIONS_DU_MANQUE)[number];

/** Les jours entre deux dates du cours, sur le calendrier commercial. */
const joursEntre = (debut: DateDuCours, fin: DateDuCours) => Math.max(0, rangDuJour(fin) - rangDuJour(debut));

/** Ce que coûte un concours de `montant` pendant `jours` jours au taux annuel `taux`. */
export const agios = (montant: number, taux: number, jours: number) => auCentime((Math.max(0, montant) * taux * jours) / JOURS_DE_L_ANNEE_BANCAIRE);

/** La trésorerie du 31 décembre, lue pour l'optimiser : l'excédent, puis ce qui couvrirait un manque. */
export function tresorerieAOptimiser(f: FicheDeLExercice) {
  const b = bilanDuLycee(f);
  const cloture: DateDuCours = { jour: f.cloture.jour, mois: f.cloture.mois };
  const banque = b.poste("banque");
  const placement = b.poste("placement");
  // HYPOTHÈSE DU COURS, par prudence : les fournisseurs, l'État et le personnel se paient tous dans
  // les semaines qui viennent (l'impôt sur les bénéfices un peu plus tard, en vérité) ; cet argent
  // ne se place pas.
  const aPayerDansLeMois = auCentime(b.poste("fournisseurs") + b.poste("etat"));
  const excedent = auCentime(b.tresorerie - aPayerDansLeMois);
  // La deuxième ligne du chapitre « Financer l'entreprise », que NOVA paiera dans l'année.
  const besoinDeLAnnee = f.equipement.ht;
  const aBloquer = auCentime(excedent - besoinDeLAnnee);
  // La facture de décembre de CampusTech, la dernière de l'année : celle que la banque escompterait.
  const facture = f.creances.filter((x) => x.client === f.campustech.nom).at(-1)!;
  return {
    f,
    b,
    entreprise: f.entreprise,
    banque,
    placement,
    capitalPlace: f.placement.montant,
    interetsDuPlacement: auCentime(placement - f.placement.montant),
    tauxDuPlacement: f.placement.tauxAnnuel,
    tresorerie: b.tresorerie,
    aPayerDansLeMois,
    excedent,
    /** L'excédent placé un an au taux du compte à terme. */
    interetsSurLExcedent: auCentime(excedent * f.placement.tauxAnnuel),
    besoinDeLAnnee,
    aBloquer,
    interetsBloques: auCentime(aBloquer * f.placement.tauxAnnuel),
    interetsDisponibles: auCentime(besoinDeLAnnee * TAUX_DU_COMPTE_REMUNERE),
    interetsDuPartage: auCentime(auCentime(aBloquer * f.placement.tauxAnnuel) + auCentime(besoinDeLAnnee * TAUX_DU_COMPTE_REMUNERE)),
    /** Les jours où le compte à terme reste bloqué après la clôture. */
    joursDeBlocage: joursEntre(cloture, f.placement.echeance),
    facture: { ttc: facture.ttc, jours: joursEntre(cloture, facture.echeance), echeance: facture.echeance },
  };
}

export type TresorerieAOptimiser = ReturnType<typeof tresorerieAOptimiser>;

/** Le prix le plus haut d'un équipement payé comptant le 31 décembre sans découvert : ce qu'il y a en banque. */
export const prixSansDecouvert = (k: TresorerieAOptimiser) => Math.floor(k.banque + 1e-9);

/**
 * UN ÉQUIPEMENT PAYÉ COMPTANT LE 31 DÉCEMBRE, ET LA SOLUTION QUI COUVRE LE MANQUE. Le manque est ce
 * que la banque ne couvre pas ; il dure jusqu'à l'échéance du compte à terme (`joursDeBlocage`),
 * qui rend alors bien plus que lui. L'escompte, lui, se paie jusqu'à l'échéance de la facture.
 */
export function couvrirLeManque(k: TresorerieAOptimiser, prix: number, solution: SolutionDuManque) {
  const manque = auCentime(Math.max(0, prix - k.banque));
  const jours = k.joursDeBlocage;
  const escompte = solution === "escompte" && manque > 0 ? k.facture.ttc : 0;
  const compteCourant = solution === "compte-courant" ? manque : 0;
  const casse = solution === "casser" && manque > 0 ? k.capitalPlace : 0;
  const decouvert = auCentime(Math.max(0, manque - escompte - compteCourant - casse));
  const coutDuDecouvert = agios(decouvert, TAUX_DU_DECOUVERT, jours);
  const coutDeLEscompte = agios(escompte, TAUX_DE_L_ESCOMPTE, k.facture.jours);
  const coutDuCompteCourant = agios(compteCourant, TAUX_DU_COMPTE_COURANT, jours);
  const interetsPerdus = casse > 0 ? k.interetsDuPlacement : 0;
  return {
    prix,
    solution,
    banqueApres: auCentime(k.banque - prix),
    manque,
    jours,
    escompte,
    compteCourant,
    casse,
    decouvert,
    coutDuDecouvert,
    coutDeLEscompte,
    coutDuCompteCourant,
    interetsPerdus,
    cout: auCentime(coutDuDecouvert + coutDeLEscompte + coutDuCompteCourant + interetsPerdus),
  };
}
