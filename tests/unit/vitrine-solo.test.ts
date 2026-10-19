import { describe, expect, it } from "vitest";
import { messageNiveauxReserves } from "@/config/tarifs";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { DEFAULT_SCENARIO_CODE, SCENARIO_CHOICES } from "@/config/scenarios/registry";
import {
  aDeuxEtages,
  ENTREPRISE_VITRINE_PAR_DEFAUT,
  NIVEAU_MAX,
  niveauMaxPour,
  niveauReserve,
  niveauxFermes,
  normaliserVitrine,
  VERSION_DE_LA_REGLE,
  vitrineAEnregistrer,
  VITRINE_SOLO_PAR_DEFAUT,
  type VitrineSolo,
} from "@/config/vitrine-solo";

/**
 * LES NIVEAUX OUVERTS SANS LICENCE (héritière de la vitrine du solo public).
 *
 * Décision du propriétaire : sans licence, niveaux 1 à 3 pour toutes les entreprises ;
 * une licence en cours ouvre tout. La règle est la même pour l'écran (qui marque et
 * explique) et pour le serveur (qui refuse la création) ; l'administrateur peut encore
 * l'ajuster, et ce qu'il enregistre porte la version qui le fait foi.
 */

const allumee: VitrineSolo = { active: true, entrepriseOuverte: "nova", niveauMaxAutres: 3 };
const enregistree = (v: VitrineSolo) => ({ ...v, version: VERSION_DE_LA_REGLE });

describe("par défaut : niveaux 1 à 3, pour toutes les entreprises, sans licence", () => {
  it("la règle est allumée, sans entreprise ouverte, au niveau 3", () => {
    expect(VITRINE_SOLO_PAR_DEFAUT).toEqual({
      active: true,
      entrepriseOuverte: "",
      niveauMaxAutres: 3,
    });
    expect(aDeuxEtages(VITRINE_SOLO_PAR_DEFAUT)).toBe(false);
  });

  it("chaque entreprise s'arrête au niveau 3 sans licence", () => {
    for (const s of SCENARIO_CHOICES) {
      expect(niveauMaxPour(VITRINE_SOLO_PAR_DEFAUT, s.code), s.code).toBe(3);
      expect([1, 2, 3].some((n) => niveauReserve(VITRINE_SOLO_PAR_DEFAUT, s.code, n))).toBe(false);
      expect([4, 5, 6].every((n) => niveauReserve(VITRINE_SOLO_PAR_DEFAUT, s.code, n))).toBe(true);
    }
  });

  it("une licence en cours ouvre les six niveaux", () => {
    for (const s of SCENARIO_CHOICES) {
      expect(niveauMaxPour(VITRINE_SOLO_PAR_DEFAUT, s.code, true), s.code).toBe(6);
      expect([4, 5, 6].some((n) => niveauReserve(VITRINE_SOLO_PAR_DEFAUT, s.code, n, true))).toBe(
        false,
      );
    }
  });

  it("l'entreprise de l'ancienne vitrine reste celle du registre, si l'admin la rouvre", () => {
    expect(ENTREPRISE_VITRINE_PAR_DEFAUT).toBe(DEFAULT_SCENARIO_CODE);
    expect(SCENARIO_CHOICES.some((s) => s.code === ENTREPRISE_VITRINE_PAR_DEFAUT)).toBe(true);
  });
});

/**
 * LE MODULE N'A QU'UNE BORNE, ET LE PARCOURS S'ARRÊTE À SIX.
 *
 * `NIVEAU_MAX` est le dernier niveau : l'examen, le mérite, le choix de niveau
 * d'une licence, les phrases des offres et la création d'une partie le lisent. Un
 * septième niveau « Groupe » a vécu à côté d'elle quelques jours, avec sa propre
 * constante ; il est retiré du produit (décision du propriétaire, octobre 2026),
 * et plus RIEN ne s'y crée — ni le réglage de la Découverte, ni une licence.
 */
describe("le parcours s'arrête à six, et il n'y a rien au-delà", () => {
  it("NIVEAU_MAX est le dernier des six préréglages du parcours", () => {
    expect(NIVEAU_MAX).toBe(DIFFICULTY_PRESETS[DIFFICULTY_PRESETS.length - 1]!.level);
    expect(DIFFICULTY_PRESETS).toHaveLength(NIVEAU_MAX);
  });

  it("au-delà du parcours, tout est fermé : aucun réglage, aucune licence n'y crée", () => {
    for (const v of [
      VITRINE_SOLO_PAR_DEFAUT,
      allumee,
      { active: false, entrepriseOuverte: "", niveauMaxAutres: 6 },
      { active: true, entrepriseOuverte: "nova", niveauMaxAutres: 6 },
    ] satisfies VitrineSolo[]) {
      for (const n of [NIVEAU_MAX + 1, NIVEAU_MAX + 2]) {
        expect(niveauReserve(v, "nova", n), JSON.stringify(v)).toBe(true);
        expect(niveauReserve(v, "nova", n, true), JSON.stringify(v)).toBe(true);
      }
      expect(niveauMaxPour(v, "nova", true)).toBe(NIVEAU_MAX);
    }
  });
});

describe("l'administrateur ajuste la règle", () => {
  it("une entreprise rouverte se joue à tous les niveaux, les autres non", () => {
    expect(niveauMaxPour(allumee, "nova")).toBe(6);
    expect(aDeuxEtages(allumee)).toBe(true);
    for (const s of SCENARIO_CHOICES.filter((c) => c.code !== "nova")) {
      expect(niveauMaxPour(allumee, s.code), s.code).toBe(3);
      expect([4, 5, 6].every((n) => niveauReserve(allumee, s.code, n)), s.code).toBe(true);
    }
  });

  it("le maximum se règle", () => {
    expect(niveauMaxPour({ ...allumee, niveauMaxAutres: 1 }, "hotel")).toBe(1);
    expect(niveauReserve({ ...allumee, niveauMaxAutres: 5 }, "hotel", 6)).toBe(true);
    expect(niveauReserve({ ...allumee, niveauMaxAutres: 5 }, "hotel", 5)).toBe(false);
  });

  it("éteinte, tout est ouvert à tous", () => {
    const eteinte = { ...VITRINE_SOLO_PAR_DEFAUT, active: false };
    for (const s of SCENARIO_CHOICES) {
      for (const n of [1, 2, 3, 4, 5, 6]) expect(niveauReserve(eteinte, s.code, n)).toBe(false);
    }
  });
});

describe("ce qui est enregistré", () => {
  it("un réglage d'avant la décision, sans version, est lu comme le défaut", () => {
    // Le défaut d'alors (« éteinte ») était écrit en base dès qu'on enregistrait /admin :
    // il ne doit pas rouvrir les niveaux 4 à 6 en production.
    expect(
      normaliserVitrine({ active: false, entrepriseOuverte: "nova", niveauMaxAutres: 3 }),
    ).toEqual(VITRINE_SOLO_PAR_DEFAUT);
    expect(normaliserVitrine(allumee)).toEqual(VITRINE_SOLO_PAR_DEFAUT);
    expect(normaliserVitrine(undefined)).toEqual(VITRINE_SOLO_PAR_DEFAUT);
  });

  it("un réglage de la version en cours fait foi, champ par champ", () => {
    expect(normaliserVitrine(enregistree(allumee))).toEqual(allumee);
    const eteinte = { ...VITRINE_SOLO_PAR_DEFAUT, active: false };
    expect(normaliserVitrine(enregistree(eteinte))).toEqual(eteinte);
    const v = (x: Record<string, unknown>) =>
      normaliserVitrine({ version: VERSION_DE_LA_REGLE, ...x });
    expect(v({ active: "oui" }).active).toBe(false);
    expect(v({ active: true, niveauMaxAutres: 99 }).niveauMaxAutres).toBe(3);
    expect(v({ active: true, niveauMaxAutres: 0 }).niveauMaxAutres).toBe(3);
    expect(v({ active: true, niveauMaxAutres: "2" }).niveauMaxAutres).toBe(2);
    expect(v({ active: true, entrepriseOuverte: "  " }).entrepriseOuverte).toBe("");
    expect(v({ active: true, entrepriseOuverte: " hotel " }).entrepriseOuverte).toBe("hotel");
  });

  it("ce que l'administrateur enregistre porte la version, et se relit à l'identique", () => {
    const pose = vitrineAEnregistrer(allumee);
    expect(pose.version).toBe(VERSION_DE_LA_REGLE);
    expect(normaliserVitrine(pose)).toEqual(allumee);
    expect(normaliserVitrine(vitrineAEnregistrer(VITRINE_SOLO_PAR_DEFAUT))).toEqual(
      VITRINE_SOLO_PAR_DEFAUT,
    );
  });
});

describe("le message", () => {
  it("dit quels niveaux sont fermés et quelles offres les incluent", () => {
    expect(messageNiveauxReserves(VITRINE_SOLO_PAR_DEFAUT)).toBe(
      "Les niveaux 4 à 6 sont inclus dans les offres Classe, Programme et Campus.",
    );
    expect(messageNiveauxReserves({ ...allumee, niveauMaxAutres: 5 })).toBe(
      "Le niveau 6 est inclus dans les offres Classe, Programme et Campus.",
    );
    expect(niveauxFermes(VITRINE_SOLO_PAR_DEFAUT)).toBe("Les niveaux 4 à 6");
  });
});
