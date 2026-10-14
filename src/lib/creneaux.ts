import { parisLocalToUtc, utcToParisLocalInput } from "./paris-time";
import { FUSEAU, type Plage } from "@/config/rendez-vous";

/**
 * LE CALCUL DES CRÉNEAUX : des plages ouvertes, moins ce qui est occupé.
 *
 * Fonction pure, sans réseau ni base : elle reçoit l'instant présent, les
 * plages ouvertes, la durée d'un créneau, le préavis, l'horizon et la liste
 * des périodes occupées (agenda Google et rendez-vous déjà pris, mêlés), et
 * rend les créneaux qui restent. Tout se raisonne en heure de Paris, via les
 * conversions déjà utilisées pour le planning des tours : le décalage se
 * mesure à la date concernée, l'heure d'été ne décale rien.
 */

export interface Intervalle {
  debut: Date;
  fin: Date;
}

export type Creneau = Intervalle;

export interface ParametresCreneaux {
  now: Date;
  plages: Readonly<Record<number, readonly Plage[]>>;
  dureeMinutes: number;
  preavisMinutes: number;
  horizonJours: number;
  occupes: readonly Intervalle[];
}

/** La date civile de Paris (« 2026-09-18 ») et son jour de semaine, pour un instant. */
export function jourDeParis(d: Date): { date: string; jourSemaine: number } {
  const date = utcToParisLocalInput(d).slice(0, 10);
  return { date, jourSemaine: new Date(`${date}T12:00:00Z`).getUTCDay() };
}

const chevauche = (a: Intervalle, b: Intervalle) =>
  a.debut.getTime() < b.fin.getTime() && a.fin.getTime() > b.debut.getTime();

export function creneauxDisponibles(p: ParametresCreneaux): Creneau[] {
  const duree = p.dureeMinutes * 60_000;
  const seuil = p.now.getTime() + p.preavisMinutes * 60_000;
  const resultat: Creneau[] = [];
  const datesVues = new Set<string>();
  // On avance de vingt-quatre heures en vingt-quatre heures ; au changement
  // d'heure, deux pas peuvent tomber sur la même date civile ou en sauter une
  // à minuit près : on dédoublonne par date, ce qui suffit.
  for (let j = 0; j <= p.horizonJours; j++) {
    const { date, jourSemaine } = jourDeParis(new Date(p.now.getTime() + j * 86_400_000));
    if (datesVues.has(date)) continue;
    datesVues.add(date);
    for (const plage of p.plages[jourSemaine] ?? []) {
      const finPlage = parisLocalToUtc(`${date}T${plage.fin}`);
      const debutPlage = parisLocalToUtc(`${date}T${plage.debut}`);
      if (!finPlage || !debutPlage) continue;
      let debut: Date = debutPlage;
      while (debut.getTime() + duree <= finPlage.getTime()) {
        const fin = new Date(debut.getTime() + duree);
        const creneau = { debut, fin };
        if (debut.getTime() >= seuil && !p.occupes.some((o) => chevauche(creneau, o))) {
          resultat.push(creneau);
        }
        debut = fin;
      }
    }
  }
  return resultat;
}

/** Ce que la page affiche : un jour, ses créneaux, chacun avec son heure murale. */
export interface JourDeCreneaux {
  /** « 2026-09-18 », la clé du jour. */
  date: string;
  /** « jeudi 18 septembre ». */
  libelle: string;
  creneaux: { iso: string; heure: string }[];
}

const formatJour = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const formatHeure = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** « 14 h 30 », comme on l'écrit en français. */
export function libelleHeure(d: Date): string {
  const [h, m] = formatHeure.format(d).split(":");
  return `${Number(h)} h ${m}`;
}

/** « jeudi 18 septembre ». */
export function libelleJour(d: Date): string {
  return formatJour.format(d);
}

/** « jeudi 18 septembre à 14 h 30 ». */
export function libelleCreneau(d: Date): string {
  return `${libelleJour(d)} à ${libelleHeure(d)}`;
}

export function parJour(creneaux: readonly Creneau[]): JourDeCreneaux[] {
  const jours = new Map<string, JourDeCreneaux>();
  for (const c of creneaux) {
    const { date } = jourDeParis(c.debut);
    let jour = jours.get(date);
    if (!jour) {
      jour = { date, libelle: libelleJour(c.debut), creneaux: [] };
      jours.set(date, jour);
    }
    jour.creneaux.push({ iso: c.debut.toISOString(), heure: libelleHeure(c.debut) });
  }
  return [...jours.values()];
}
