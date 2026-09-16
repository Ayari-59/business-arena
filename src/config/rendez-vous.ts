/**
 * LA PRISE DE RENDEZ-VOUS TÉLÉPHONIQUE : ce qui se règle sans toucher au code
 * du calcul.
 *
 * Un enseignant qui hésite préfère souvent vingt minutes de conversation à un
 * échange de courriels. La page /rendez-vous lui propose des créneaux, et ces
 * créneaux se règlent sur l'agenda Google de la personne qui répond : ce qui y
 * est occupé (cours, réunions, jours fériés) n'est jamais proposé. Ce fichier
 * fixe le cadre dans lequel l'agenda découpe : les plages ouvertes à l'appel,
 * la durée d'un créneau, le préavis et l'horizon.
 *
 * Les plages sont volontairement larges : c'est l'agenda qui retire les heures
 * de cours, pas ce fichier. Les changer ici suffit ; rien d'autre ne les
 * connaît.
 */

/** Le fuseau dans lequel les plages sont écrites et les créneaux affichés. */
export const FUSEAU = "Europe/Paris";

/** Un appel dure une demi-heure ; c'est aussi le pas entre deux créneaux. */
export const DUREE_MINUTES = 30;

/** On ne réserve pas pour dans dix minutes : au moins ce délai avant l'appel. */
export const PREAVIS_HEURES = 24;

/** Jusqu'où l'on propose des créneaux, en jours à partir d'aujourd'hui. */
export const HORIZON_JOURS = 21;

/** Une plage horaire ouverte à l'appel, en heure de Paris (« 09:00 »). */
export interface Plage {
  debut: string;
  fin: string;
}

/**
 * Les plages ouvertes, par jour de la semaine (0 = dimanche … 6 = samedi,
 * comme `Date#getDay`). Un jour absent n'a aucun créneau.
 */
export const PLAGES: Readonly<Record<number, readonly Plage[]>> = {
  1: [{ debut: "09:00", fin: "12:30" }, { debut: "13:30", fin: "19:00" }],
  2: [{ debut: "09:00", fin: "12:30" }, { debut: "13:30", fin: "19:00" }],
  3: [{ debut: "09:00", fin: "12:30" }, { debut: "13:30", fin: "19:00" }],
  4: [{ debut: "09:00", fin: "12:30" }, { debut: "13:30", fin: "19:00" }],
  5: [{ debut: "09:00", fin: "12:30" }, { debut: "13:30", fin: "19:00" }],
  6: [{ debut: "09:00", fin: "12:00" }],
};

/** Plafond : trois réservations par adresse d'origine et par heure. */
export const PLAFOND_PAR_IP_PAR_HEURE = 3;
