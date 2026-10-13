import { describe, expect, it } from "vitest";
import { ATELIERS } from "@/config/ateliers";
import { adaptationsDuNiveau, minutesEnClair, MOTS_DES_LEVIERS } from "@/config/ateliers/adaptations";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { LIBELLES_DES_LEVIERS } from "@/config/tableau-des-niveaux";
import { familyOf } from "@/config/scenarios/registry";

/**
 * ADAPTER LE NIVEAU : ce que la fiche affiche sous « Adapter le niveau » se
 * lit dans les préréglages, les familles de scénarios et le modèle de durée.
 * Ces gardes vérifient que la lecture est juste sur des fiches réelles, et
 * qu'elle suivrait un préréglage retouché.
 */
const atelier = (code: string) => ATELIERS.find((a) => a.code === code)!;

describe("les crans voisins d'un atelier", () => {
  it("un cran plus bas ferme ce que le niveau courant ouvrait, et nomme les séances qui en vivent", () => {
    const { bas } = adaptationsDuNiveau(atelier("cg1"));
    expect(bas).not.toBeNull();
    expect(bas!.niveau).toBe(2);
    expect(bas!.niveauNom).toBe(DIFFICULTY_PRESETS.find((p) => p.level === 2)!.name);
    expect(bas!.ferme).toContain(LIBELLES_DES_LEVIERS.creances.court);
    expect(bas!.ferme).toContain(LIBELLES_DES_LEVIERS.hr.court);
    expect(bas!.ouvre).toEqual([]);
    expect(bas!.bascule).toBeNull();
    // Les séances 3 et 5 portent sur la trésorerie et les créances, que le niveau 2 ferme.
    expect(bas!.seances.map((s) => s.numero)).toEqual(expect.arrayContaining([3, 5]));
    expect(bas!.minutesParTour.max).toBeLessThan(0);
  });

  it("un cran plus haut ouvre, et bascule l'entreprise en gamme quand la famille le dit", () => {
    const { haut } = adaptationsDuNiveau(atelier("cg1"));
    expect(haut!.niveau).toBe(4);
    expect(haut!.ouvre).toEqual(
      expect.arrayContaining([
        LIBELLES_DES_LEVIERS.investment.court,
        LIBELLES_DES_LEVIERS.finance.court,
        LIBELLES_DES_LEVIERS.insurance.court,
      ]),
    );
    expect(haut!.ferme).toEqual([]);
    const famille = familyOf("nova")!;
    expect(haut!.scenarioCode).toBe(famille.gamme);
    expect(haut!.bascule).not.toBeNull();
    // La séance 1 donne les réglages de création : elle change avec l'entreprise.
    expect(haut!.seances.map((s) => s.numero)).toContain(1);
    expect(haut!.minutesParTour.min).toBeGreaterThan(0);
  });

  it("le premier niveau n'a pas de cran plus bas, le dernier pas de cran plus haut", () => {
    expect(adaptationsDuNiveau(atelier("stmg")).bas).toBeNull();
    expect(adaptationsDuNiveau(atelier("stmg")).haut).not.toBeNull();
    const dernier = DIFFICULTY_PRESETS.reduce((m, p) => Math.max(m, p.level), 0);
    const dcg = atelier("dcg");
    const { haut } = adaptationsDuNiveau(dcg);
    expect(haut!.niveau).toBe(dcg.reglages.niveau + 1);
    if (haut!.niveau === dernier) {
      expect(haut!.ouvre).toContain(LIBELLES_DES_LEVIERS.dividend.court);
    }
  });

  it("un concours ne s'adapte pas, et le dit", () => {
    const campus = adaptationsDuNiveau(atelier("campus"));
    expect(campus.bas).toBeNull();
    expect(campus.haut).toBeNull();
    expect(campus.raison).toMatch(/concours/i);
  });

  it("descendre sous le niveau de la gamme ramène à un seul produit", () => {
    // La boutique de maille passe en gamme au niveau 3 : un cran plus bas, elle
    // ne vend plus qu'un article, et les séances écrites pour la gamme le disent.
    const mco = atelier("mco");
    const famille = familyOf(mco.reglages.scenarioCode)!;
    const { bas } = adaptationsDuNiveau(mco);
    expect(bas!.scenarioCode).toBe(famille.mono);
    expect(bas!.bascule?.vers).toBeTruthy();
  });

  it("chaque levier des préréglages a ses mots, et chaque atelier a deux crans ou une raison", () => {
    for (const cle of Object.keys(DIFFICULTY_PRESETS[0]!.decisions)) {
      expect(MOTS_DES_LEVIERS[cle as keyof typeof MOTS_DES_LEVIERS], cle).toBeInstanceOf(RegExp);
    }
    for (const a of ATELIERS) {
      const ad = adaptationsDuNiveau(a);
      expect(ad.bas !== null || ad.haut !== null || ad.raison !== null, a.code).toBe(true);
    }
  });
});

describe("les minutes en clair", () => {
  it("dit moins, plus, ou rien", () => {
    expect(minutesEnClair({ min: -3, max: -3 })).toBe("environ 3 min de moins par tour");
    expect(minutesEnClair({ min: 2, max: 5 })).toBe("2 à 5 min de plus par tour");
    expect(minutesEnClair({ min: 0, max: 0 })).toBe("aucun changement de durée par tour");
  });
});
