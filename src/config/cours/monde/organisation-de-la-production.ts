import { auCentime } from "./amortissement";
import { margeUnitaire } from "./capacite";
import { FICHE_DE_DIRECTION } from "./direction-de-nova";
import { COUT_DE_STOCKAGE_PAR_TRIMESTRE, ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA, anneeAvec, anneeAvecDeLAvance, enceintesParOperateur } from "./production-et-logistique";

/**
 * LE MONDE DU COURS : ORGANISER LA PRODUCTION DE NOVA, MODES, FLUX ET LOGISTIQUE (enseignement commun de
 * terminale STMG, question 1.3, lot C).
 *
 * Aucun chiffre nouveau pour la ligne : ce fichier relit production-et-logistique.ts et nova-capacite.ts
 * (0,25 heure par enceinte, 1 800 enceintes par opérateur et par trimestre, la ligne de 7 000 enceintes
 * par trimestre, la demande de N + 1 : 5 800, 7 400, 6 200 et 7 800, la marge de 21 € d'une enceinte,
 * 1,50 € pour garder une enceinte finie un trimestre). Le laboratoire pousse le flux : monter d'avance au
 * 3e trimestre ce que Noël demandera au-delà de la ligne, au lieu de produire seulement à la commande.
 *
 * LE CAS DU CHAPITRE (hypothèse du cours) : NOVA reprend les enceintes usagées de ses clients ; un
 * prestataire de recyclage lui facture 1,20 € par enceinte, et récupère les composants : NOVA en
 * revend pour 2,10 € par enceinte reprise. Elle en espère 2 400 la première année, et une campagne qui
 * les annonce coûte 900 €.
 */

export const ENTREPRISES_DE_L_ORGANISATION_DE_LA_PRODUCTION = ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA;

const f = FICHE_DE_DIRECTION;

/** Les avances que le laboratoire essaie au 3e trimestre, pour Noël. */
export const AVANCES_ESSAYEES = { min: 0, max: 1_200, pas: 100 } as const;

/** La productivité de la ligne : enceintes par heure de montage, par opérateur et par trimestre, et le taux d'utilisation d'un trimestre de N + 1. */
export function productivite(trimestre: number = 1) {
  const a = anneeAvec(f);
  const t = a.trimestres[trimestre - 1]!;
  return {
    heuresParEnceinte: f.operateurs.heuresParEnceinte,
    heuresParMois: f.operateurs.heuresParMois,
    parHeure: 1 / f.operateurs.heuresParEnceinte,
    parOperateur: enceintesParOperateur(f),
    capacite: t.capacite,
    demande: t.demande,
    utilisationPct: Math.round((Math.min(t.demande, t.capacite) / t.capacite) * 1000) / 10,
  };
}

/** L'année N + 1 en flux tiré (rien d'avance) ou poussé (une avance montée au 3e trimestre pour Noël). */
export function avancePourNoel(avance: number) {
  const a = anneeAvecDeLAvance(f, [0, 0, avance, 0]);
  const t3 = a.trimestres[2]!;
  const t4 = a.trimestres[3]!;
  return { avance, montees: t3.montees, stock: t3.stock, refuseesANoel: t4.refusees, stockage: a.stockage, margeGagnee: a.margeGagnee, gain: a.gain, demandeDeNoel: t4.demande, capaciteDeNoel: t4.capacite, libreAuT3: t3.capacite - t3.demande, coutDuStock: COUT_DE_STOCKAGE_PAR_TRIMESTRE, marge: margeUnitaire(f) };
}

/** La plus petite avance, de 100 en 100, qui ne refuse aucun client à Noël. */
export function avanceQuiServitNoel() {
  let x = AVANCES_ESSAYEES.min;
  while (x < AVANCES_ESSAYEES.max && avancePourNoel(x).refuseesANoel > 0) x += AVANCES_ESSAYEES.pas;
  return x;
}

/** Le cas : la reprise des enceintes usagées. */
export const REPRISE = { recyclageParEnceinte: 1.2, composantsRevendus: 2.1, reprisesAttendues: 2_400, campagne: 900 } as const;

export function repriseDesEnceintes(reprises: number = REPRISE.reprisesAttendues) {
  const r = REPRISE;
  const parEnceinte = auCentime(r.composantsRevendus - r.recyclageParEnceinte);
  return { reprises, parEnceinte, gain: auCentime(reprises * parEnceinte - r.campagne), pourPayerLaCampagne: Math.ceil(r.campagne / parEnceinte - 1e-9) };
}
