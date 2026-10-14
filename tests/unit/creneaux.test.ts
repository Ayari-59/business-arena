import { describe, expect, it } from "vitest";
import { creneauxDisponibles, jourDeParis, libelleCreneau, libelleHeure, parJour } from "@/lib/creneaux";
import { PLAGES } from "@/config/rendez-vous";

/**
 * LES CRÉNEAUX SONT LES PLAGES OUVERTES, MOINS L'OCCUPÉ, MOINS LE PRÉAVIS.
 *
 * Tout se raisonne en heure de Paris : une plage « 09:00 » commence à 07:00 Z
 * en été et à 08:00 Z en hiver. Le calcul est pur ; on le vérifie sur des
 * instants choisis, sans réseau ni base.
 */
const base = {
  plages: PLAGES,
  dureeMinutes: 30,
  preavisMinutes: 24 * 60,
  horizonJours: 7,
  occupes: [] as { debut: Date; fin: Date }[],
};

// Mercredi 16 septembre 2026, 12:00 à Paris (heure d'été : 10:00 Z).
const now = new Date("2026-09-16T10:00:00Z");

describe("creneauxDisponibles", () => {
  const creneaux = creneauxDisponibles({ ...base, now });

  it("rien avant le préavis : le premier créneau est le lendemain à la même heure ou après", () => {
    expect(creneaux.length).toBeGreaterThan(0);
    expect(creneaux[0]!.debut.getTime()).toBeGreaterThanOrEqual(now.getTime() + 24 * 3_600_000);
    // Jeudi 17 septembre 12:00 Paris = 10:00 Z ; la plage du matin finit à
    // 12:30, le créneau 12:00-12:30 est donc le premier.
    expect(creneaux[0]!.debut.toISOString()).toBe("2026-09-17T10:00:00.000Z");
  });

  it("chaque créneau tient dans une plage ouverte du bon jour, en heure de Paris", () => {
    for (const c of creneaux) {
      const { jourSemaine } = jourDeParis(c.debut);
      const plages = PLAGES[jourSemaine] ?? [];
      const heure = libelleHeure(c.debut).replace(" h ", ":").padStart(5, "0");
      const heureFin = libelleHeure(c.fin).replace(" h ", ":").padStart(5, "0");
      expect(
        plages.some((p) => p.debut <= heure && heureFin <= p.fin),
        `${c.debut.toISOString()} (${heure}) hors plage`,
      ).toBe(true);
    }
  });

  it("aucun créneau le dimanche ; le samedi, le matin seulement", () => {
    const dimanche = creneaux.filter((c) => jourDeParis(c.debut).jourSemaine === 0);
    expect(dimanche).toEqual([]);
    const samedi = creneaux.filter((c) => jourDeParis(c.debut).jourSemaine === 6);
    expect(samedi.length).toBe(6); // 9:00 → 12:00 par pas de 30 min
    expect(libelleHeure(samedi[samedi.length - 1]!.debut)).toBe("11 h 30");
  });

  it("une période occupée retire les créneaux qui la chevauchent, et eux seuls", () => {
    // Vendredi 18 septembre, occupé de 10:15 à 11:10 Paris (08:15 → 09:10 Z).
    const occupes = [{ debut: new Date("2026-09-18T08:15:00Z"), fin: new Date("2026-09-18T09:10:00Z") }];
    const avec = creneauxDisponibles({ ...base, now, occupes });
    const retires = creneaux.filter((c) => !avec.some((a) => a.debut.getTime() === c.debut.getTime()));
    expect(retires.map((c) => libelleHeure(c.debut))).toEqual(["10 h 00", "10 h 30", "11 h 00"]);
  });

  it("une journée entière occupée (jour férié, événement sur la journée) ne propose rien", () => {
    const occupes = [{ debut: new Date("2026-09-17T22:00:00Z"), fin: new Date("2026-09-18T22:00:00Z") }];
    const avec = creneauxDisponibles({ ...base, now, occupes });
    expect(avec.some((c) => jourDeParis(c.debut).date === "2026-09-18")).toBe(false);
    expect(avec.some((c) => jourDeParis(c.debut).date === "2026-09-17")).toBe(true);
  });

  it("en hiver, 9 h à Paris est 8 h Z ; l'horizon borne la liste", () => {
    // Lundi 9 novembre 2026, 12:00 Z.
    const hiver = new Date("2026-11-09T12:00:00Z");
    const c = creneauxDisponibles({ ...base, now: hiver, horizonJours: 2 });
    const mercredi = c.filter((x) => jourDeParis(x.debut).date === "2026-11-11");
    expect(mercredi[0]!.debut.toISOString()).toBe("2026-11-11T08:00:00.000Z");
    expect(c.every((x) => jourDeParis(x.debut).date <= "2026-11-11")).toBe(true);
  });
});

describe("libellés et regroupement", () => {
  it("« jeudi 17 septembre à 14 h 30 », heure de Paris", () => {
    expect(libelleCreneau(new Date("2026-09-17T12:30:00Z"))).toBe("jeudi 17 septembre à 14 h 30");
    expect(libelleHeure(new Date("2026-11-11T08:00:00Z"))).toBe("9 h 00");
  });

  it("parJour groupe par date civile de Paris, dans l'ordre", () => {
    const jours = parJour(creneauxDisponibles({ ...base, now }));
    expect(jours[0]!.date).toBe("2026-09-17");
    expect(jours[0]!.libelle).toBe("jeudi 17 septembre");
    expect(jours[0]!.creneaux[0]).toEqual({ iso: "2026-09-17T10:00:00.000Z", heure: "12 h 00" });
    expect(jours.map((j) => j.date)).toEqual([...jours.map((j) => j.date)].sort());
    expect(jours.some((j) => j.date === "2026-09-20")).toBe(false); // dimanche
  });
});
