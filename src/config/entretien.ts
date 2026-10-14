/**
 * L'AIDE DU BUDGET D'ENTRETIEN DIT DEUX CHIFFRES, PAS UNE MORALE.
 *
 * Elle disait « une maintenance insuffisante dégrade la disponibilité
 * machine ». C'est vrai, et c'est inutilisable : insuffisante à partir de quoi,
 * et où en est-on ? L'élève tapait donc un montant sans échelle, dans le seul
 * champ du tour dont l'effet ne se voit pas le tour où on le dépense.
 *
 * LES DEUX CHIFFRES EXISTENT POURTANT. Le scénario porte un budget de référence
 * (`production.maintenanceReference`, de 3 000 € pour une boutique à 9 000 €
 * pour un hôtel) : en dessous, la disponibilité s'use ; au-dessus, elle se
 * rétablit. Et l'état de l'entreprise porte la disponibilité du moment, celle
 * qui multiplie la capacité dans le moteur. Le classeur du cockpit donnait déjà
 * le premier aux élèves, sous le nom « Budget maintenance de référence par
 * tour » ; l'écran de décision, lui, les taisait tous les deux.
 *
 * Ce module tient la phrase à un seul endroit : elle paraît sous le champ en
 * mono-produit comme en gamme, et les deux ne doivent pas se mettre à diverger.
 */

/** Ce que l'écran sait de l'atelier au moment où le budget se décide. */
export interface EtatDeLAtelier {
  /** Le budget qui sépare l'usure du rétablissement, pour ce tour et ce métier. */
  maintenanceReference: number;
  /** Disponibilité machine courante (0..1). */
  availability: number;
}

/**
 * Une disponibilité à 99,5 % ou plus se lit « 100 % » une fois arrondie :
 * annoncer une usure invisible ferait chercher une panne là où il n'y en a pas.
 */
export const DISPONIBILITE_ENTIERE = 0.995;

export function aideDuBudgetEntretien(etat: EtatDeLAtelier | null | undefined): string {
  // Sans état d'atelier (partie sans capacité machine, instantané ancien), on
  // garde la phrase générale : mieux vaut une règle vraie qu'un chiffre inventé.
  if (!etat) return "Une maintenance insuffisante dégrade la disponibilité machine.";
  const seuil = Math.round(etat.maintenanceReference).toLocaleString("fr-FR");
  const pourcent = Math.round(etat.availability * 100);
  const etatDit =
    etat.availability < DISPONIBILITE_ENTIERE
      ? `Elle est à ${pourcent} %, et ne remonte qu'en dépensant au-dessus du seuil.`
      : `Elle est entière, à ${pourcent} %.`;
  return `En dessous de ${seuil} € la disponibilité se dégrade, au-dessus elle se rétablit. ${etatDit}`;
}
