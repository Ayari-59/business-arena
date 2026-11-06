import { casDeLEntreprise } from "../cas";
import { DATE_DE_REVENTE, DEVIS_DU_FOURNISSEUR, TAUX_DE_TVA_DE_LA_CESSION, compteDAmortissement, planDAmortissement as planDuChapitre } from "../chapitres/immobilisations";
import { auCentime, planDAmortissement, type DateDuCours, type Immobilisation } from "./amortissement";

/**
 * LE MONDE DU COURS : LE REMPLACEMENT DE LA CUISINE DE LA TABLE D'AUGUSTIN (décision du propriétaire,
 * novembre 2026 : une activité par chapitre ; le format « bureau » ; chapitre « Immobilisations et
 * amortissements »).
 *
 * Le bureau (config/cours/bureaux/le-remplacement-de-la-cuisine.ts) lit tout ici. L'élève tient la
 * comptabilité de LA TABLE D'AUGUSTIN au début de juillet de la 3e année d'utilisation de sa cuisine :
 * l'ancienne vient d'être cédée, la nouvelle d'être installée.
 *
 * CE QUI VIENT DU CHAPITRE ET DU MONDE, ET NE S'ÉCRIT DONC PAS ICI :
 *   · la cuisine de l'entreprise, son prix hors taxes, sa mise en service du 6 janvier, sa durée et son
 *     compte (le cas figé, monde/cas-des-entreprises.ts, lu par `planDAmortissement` du chapitre) ;
 *   · la revente au 30 juin de la 3e année, au prix de l'occasion (40 % du prix neuf), et la TVA de la
 *     cession (DATE_DE_REVENTE, PRIX_DE_L_OCCASION, TAUX_DE_TVA_DE_LA_CESSION du chapitre) ;
 *   · le devis d'un équipement identique, ligne par ligne (DEVIS_DU_FOURNISSEUR du chapitre) : c'est la
 *     facture de la nouvelle cuisine ;
 *   · le plan linéaire au prorata des jours, en mois de 30 jours (monde/amortissement.ts).
 *
 * CE QUI EST CHOISI (hypothèses du bureau, chacune nommée ci-dessous et dite à l'élève) : la nouvelle
 * cuisine mise en service le 1er juillet, sa facture et celle de la cession payables à 30 jours, et un
 * devis d'une cuisine plus grande, reçu mais pas commandé.
 */

/** L'entreprise du bureau : LA TABLE D'AUGUSTIN, l'une des neuf où le chapitre se joue. */
export const ENTREPRISE_DE_LA_CUISINE = "bistrot";

/**
 * LA MISE EN SERVICE DE LA NOUVELLE CUISINE (hypothèse du bureau) : livrée, installée et essayée le
 * lendemain de la cession de l'ancienne, le 1er juillet de la 3e année (l'exercice 2, le premier étant 0).
 */
export const MISE_EN_SERVICE_DE_LA_NOUVELLE: DateDuCours = { jour: 1, mois: 7, exercice: DATE_DE_REVENTE.exercice };

/** LE DÉLAI DE PAIEMENT (hypothèse du bureau) : la facture du fournisseur et celle de la cession se règlent à 30 jours. */
export const DELAI_DES_FACTURES = 30;

/**
 * LE DEVIS D'UNE CUISINE PLUS GRANDE (hypothèse du bureau) : le fournisseur a joint à sa facture le devis
 * d'un modèle au prix catalogue relevé de moitié. Personne ne l'a commandé : un devis n'engage rien.
 */
export const DEVIS_D_UN_MODELE_PLUS_GRAND = 1.5;

/** Tout ce que le bureau lit : l'ancienne cuisine jusqu'à sa cession, la nouvelle de sa facture au 31 décembre. */
export function remplacementDeLaCuisine() {
  const c = casDeLEntreprise(ENTREPRISE_DE_LA_CUISINE);
  const p = planDuChapitre(c);
  const i = c.immobilisation;
  const d = p.devis;
  const tva = i.tauxTva;
  // L'ancienne : amortie jusqu'au jour de la cession, puis sortie.
  const ancienne = {
    designation: i.designation,
    compte: i.compte,
    acceptes: i.acceptes,
    compteDAmortissement: compteDAmortissement(i.compte),
    base: p.base,
    duree: p.duree,
    annuite: p.annuite,
    premiere: p.premiere,
    deuxieme: p.deuxieme,
    avantLaCession: auCentime(p.premiere + p.deuxieme),
    jours: p.joursRevente,
    dotation: p.dotationRevente,
    cumul: p.cumulRevente,
    valeurNette: p.vncRevente,
    prix: p.prixRevente,
    tvaDuPrix: p.tvaRevente,
    prixTtc: p.prixReventeTtc,
    resultat: p.resultatRevente,
  };
  // La nouvelle : la facture du devis, ce qui entre dans son coût, ce qui va en charges, sa première dotation.
  const tvaDuCout = auCentime(p.coutDAcquisition * tva);
  const tvaDesCharges = auCentime(p.chargesDuDevis * tva);
  const totalHt = auCentime(p.coutDAcquisition + p.chargesDuDevis);
  const immo: Immobilisation = { valeurBrute: p.coutDAcquisition, miseEnService: MISE_EN_SERVICE_DE_LA_NOUVELLE, dureeAns: p.duree };
  const plan = planDAmortissement(immo, "lineaire");
  const nouvelle = {
    devis: d,
    remise: DEVIS_DU_FOURNISSEUR.remise,
    prixNet: p.prixNet,
    cout: p.coutDAcquisition,
    charges: p.chargesDuDevis,
    totalHt,
    tauxTva: tva,
    tvaDuCout,
    tvaDesCharges,
    tva: auCentime(tvaDuCout + tvaDesCharges),
    ttc: auCentime(totalHt + tvaDuCout + tvaDesCharges),
    annuite: auCentime(p.coutDAcquisition / p.duree),
    jours: plan[0]!.prorata,
    dotation: plan[0]!.dotation,
    valeurNette: plan[0]!.valeurNette,
  };
  return { c, entreprise: c.entreprise, ancienne, nouvelle, tauxDeLaCession: TAUX_DE_TVA_DE_LA_CESSION, devisPlusGrand: auCentime(d.prix * DEVIS_D_UN_MODELE_PLUS_GRAND) };
}

export type RemplacementDeLaCuisine = ReturnType<typeof remplacementDeLaCuisine>;
