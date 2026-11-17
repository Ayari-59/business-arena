import { describe, expect, it } from "vitest";
import {
  etatDuLancement,
  lancementALaCreation,
  lireLeLancement,
  ouvertureDuTour,
  statutSonde,
} from "@/lib/lancement-du-tour";
import { computePlayWindow } from "@/lib/play-window";

/** Le tour suivant attend le professeur, ou le calendrier : la logique pure. */

const NOW = new Date("2026-11-17T09:00:00Z");
const MARQUE = { lancementDesTours: { regle: "professeur", lances: {} } };
const tour = (o: Partial<{ id: string; index: number; status: string; opensAt: Date | null }> = {}) => ({
  id: "t2",
  index: 2,
  status: "open",
  opensAt: null,
  ...o,
});

describe("le marqueur", () => {
  it("se pose sur la classe de l'enseignant, jamais sur le solo ni le concours", () => {
    expect(lancementALaCreation({ kind: "class", mode: "learning" })).toEqual({ regle: "professeur", lances: {} });
    expect(lancementALaCreation({ kind: "solo", mode: "learning" })).toBeUndefined();
    expect(lancementALaCreation({ kind: "class", mode: "competition" })).toBeUndefined();
    expect(lancementALaCreation({ kind: "class", mode: "contest" })).toBeUndefined();
  });

  it("absent ou illisible, la partie enchaîne comme avant", () => {
    expect(lireLeLancement({ level: 1 })).toBeNull();
    expect(lireLeLancement({ lancementDesTours: { regle: "autre" } })).toBeNull();
    expect(lireLeLancement(null)).toBeNull();
    expect(etatDuLancement({ profil: { level: 1 }, essai: null, tour: tour(), now: NOW }).enAttente).toBe(false);
  });
});

describe("l'état du tour", () => {
  it("le premier tour ne s'attend jamais ; un tour clos ou à venir non plus", () => {
    for (const t of [tour({ index: 1 }), tour({ status: "resolved" }), tour({ status: "pending" })]) {
      expect(etatDuLancement({ profil: MARQUE, essai: null, tour: t, now: NOW }).concerne).toBe(false);
    }
  });

  it("ni lancé ni daté : il attend le professeur", () => {
    expect(etatDuLancement({ profil: MARQUE, essai: null, tour: tour(), now: NOW })).toEqual({
      concerne: true,
      lanceLe: null,
      enAttente: true,
      ouvertureAuto: null,
    });
  });

  it("daté : il attend sa date, puis s'ouvre seul", () => {
    const demain = new Date(NOW.getTime() + 86_400_000);
    const hier = new Date(NOW.getTime() - 86_400_000);
    expect(etatDuLancement({ profil: MARQUE, essai: null, tour: tour({ opensAt: demain }), now: NOW })).toMatchObject({
      enAttente: true,
      ouvertureAuto: demain,
    });
    expect(etatDuLancement({ profil: MARQUE, essai: null, tour: tour({ opensAt: hier }), now: NOW }).enAttente).toBe(false);
  });

  it("lancé : il se joue, même avant sa date", () => {
    const profil = { lancementDesTours: { regle: "professeur", lances: { t2: "2026-11-17T08:00:00.000Z" } } };
    const demain = new Date(NOW.getTime() + 86_400_000);
    const etat = etatDuLancement({ profil, essai: null, tour: tour({ opensAt: demain }), now: NOW });
    expect(etat).toMatchObject({ enAttente: false, lanceLe: new Date("2026-11-17T08:00:00.000Z") });
    // Le lancement d'un autre tour (la partie recommencée) ne compte pas.
    expect(etatDuLancement({ profil, essai: null, tour: tour({ id: "autre" }), now: NOW }).enAttente).toBe(true);
  });

  it("pendant l'essai, jusqu'à la bascule, les tours enchaînent", () => {
    for (const phase of ["en_cours", "termine", "bascule"]) {
      expect(etatDuLancement({ profil: MARQUE, essai: { phase }, tour: tour(), now: NOW }).enAttente).toBe(false);
    }
    expect(etatDuLancement({ profil: MARQUE, essai: { phase: "fini" }, tour: tour(), now: NOW }).enAttente).toBe(true);
  });

  it("le sondeur lit « attente » tant que le tour attend", () => {
    const attend = etatDuLancement({ profil: MARQUE, essai: null, tour: tour(), now: NOW });
    expect(statutSonde("open", attend)).toBe("attente");
    expect(statutSonde("open", etatDuLancement({ profil: {}, essai: null, tour: tour(), now: NOW }))).toBe("open");
  });
});

describe("le verrou et la mesure du temps", () => {
  it("le verrou dit « pas encore ouvert », sauf un tour clôturé par le planning", () => {
    const w = computePlayWindow({ now: NOW, attenteDuLancement: { tour: 2 } });
    expect(w).toMatchObject({ playable: false, state: "before", attenteDuLancement: { tour: 2 } });
    const clos = computePlayWindow({
      now: NOW,
      roundDeadline: new Date(NOW.getTime() - 1000),
      attenteDuLancement: { tour: 2 },
    });
    expect(clos.state).toBe("after");
    expect(computePlayWindow({ now: NOW }).playable).toBe(true);
  });

  it("le temps du tour court depuis son lancement ; sans marqueur, depuis la clôture", () => {
    const cloture = new Date("2026-11-17T08:00:00Z");
    const lance = "2026-11-17T08:20:00.000Z";
    const profil = { lancementDesTours: { regle: "professeur", lances: { t2: lance } } };
    expect(ouvertureDuTour({ profil, essai: null, tour: { id: "t2", opensAt: null }, clotureDuPrecedent: cloture })).toEqual(
      new Date(lance),
    );
    expect(ouvertureDuTour({ profil: MARQUE, essai: null, tour: { id: "t2", opensAt: null }, clotureDuPrecedent: cloture })).toBeNull();
    expect(ouvertureDuTour({ profil: {}, essai: null, tour: { id: "t2", opensAt: null }, clotureDuPrecedent: cloture })).toEqual(
      cloture,
    );
  });
});
