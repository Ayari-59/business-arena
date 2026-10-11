import { describe, expect, it } from "vitest";
import { lireDomaines, normaliserDomaine, normaliserListe, refusDuDomaine } from "@/config/inscriptions";

/**
 * LES DOMAINES D'E-MAIL AUTORISÉS OU BLOQUÉS À L'INSCRIPTION (/admin/inscrits) : une saisie
 * libre devient une liste propre ; un domaine couvre ses sous-domaines ; le blocage passe
 * avant l'autorisation ; une liste d'autorisés vide laisse tout passer.
 */
describe("les règles de domaine", () => {
  it("une saisie libre devient une liste propre, et dit ce qu'elle ignore", () => {
    expect(lireDomaines("@Ac-Lille.FR\nuniv-lille.fr, ac-lille.fr ;  *.yopmail.com pas_un_domaine")).toEqual({
      domaines: ["ac-lille.fr", "univ-lille.fr", "yopmail.com"],
      ignores: ["pas_un_domaine"],
    });
    expect(normaliserDomaine("localhost")).toBeNull();
    expect(normaliserListe("ac-lille.fr")).toEqual([]);
    expect(normaliserListe(["AC-LILLE.FR", 3, "x"])).toEqual(["ac-lille.fr"]);
  });

  it("sous-domaines couverts, blocage prioritaire, liste vide : tout passe", () => {
    const regles = { domainesAutorises: ["ac-lille.fr", "univ-lille.fr"], domainesBloques: ["etu.univ-lille.fr"] };
    expect(refusDuDomaine("prof@ac-lille.fr", regles)).toBeNull();
    expect(refusDuDomaine("prof@iut.univ-lille.fr", regles)).toBeNull();
    expect(refusDuDomaine("eleve@etu.univ-lille.fr", regles)).toMatch(/ne sont pas acceptées/);
    expect(refusDuDomaine("prof@gmail.com", regles)).toMatch(/réservées/);
    expect(refusDuDomaine("prof@xac-lille.fr", regles)).toMatch(/réservées/);
    expect(refusDuDomaine("prof@gmail.com", { domainesAutorises: [], domainesBloques: [] })).toBeNull();
    expect(refusDuDomaine("x@yopmail.com", { domainesAutorises: [], domainesBloques: ["yopmail.com"] })).not.toBeNull();
  });

  it("un code d'invitation valide passe outre les autorisés, jamais les bloqués", () => {
    const regles = { domainesAutorises: ["ac-lille.fr"], domainesBloques: ["yopmail.com"] };
    expect(refusDuDomaine("prof@gmail.com", regles, { parInvitation: true })).toBeNull();
    expect(refusDuDomaine("x@yopmail.com", regles, { parInvitation: true })).toMatch(/ne sont pas acceptées/);
    expect(refusDuDomaine("prof@gmail.com", regles, { parInvitation: false })).toMatch(/réservées/);
  });
});
