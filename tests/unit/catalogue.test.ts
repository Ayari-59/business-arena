import { describe, expect, it } from "vitest";
import {
  chiffrerLeDevis,
  cleDEtablissement,
  erreurDeRemise,
  libelleDeLaRemise,
  montantDeLaRemise,
  palierDeLArene,
  promotionEnCours,
  remplir,
  texteDuBandeau,
  verifierLeCode,
  type CodePromo,
} from "@/config/catalogue";
import { CATALOGUE_PAR_DEFAUT, LIBELLES_DU_DEVIS, libellesDuDevisDe, PARAMETRAGE_DES_OFFRES } from "@/config/tarifs";

/**
 * LES RÈGLES PURES DU CATALOGUE (config/catalogue.ts) : remises, codes promo, bandeau,
 * variables, palier de l'arène, libellés du devis. Le service les applique côté serveur
 * (tests/integration/catalogue-offres.test.ts) ; elles se vérifient ici sans base.
 */

const espaces = (t: string) => t.replace(/[  ]/g, " ");
const JOUR = 24 * 60 * 60 * 1000;
const MAINTENANT = new Date("2026-11-10T10:00:00Z");

const code = (patch: Partial<CodePromo> = {}): CodePromo => ({
  id: "x",
  code: "RENTREE",
  typeRemise: "pourcentage",
  valeur: 20,
  offres: ["programme"],
  debut: null,
  fin: new Date("2026-12-01T00:00:00+01:00"),
  utilisationsMax: null,
  utilisations: 0,
  unParEtablissement: true,
  actif: true,
  affiche: true,
  ...patch,
});
const demande = (patch: Partial<Parameters<typeof verifierLeCode>[1]> = {}) => ({
  offre: "programme",
  nomDeLOffre: "Offre Programme",
  maintenant: MAINTENANT,
  dejaUtiliseParLEtablissement: false,
  ...patch,
});

describe("les remises", () => {
  it("un pourcentage ou un montant, jamais plus que le prix, arrondi au centime", () => {
    expect(montantDeLaRemise(99000, { type: "pourcentage", valeur: 20 })).toBe(19800);
    expect(montantDeLaRemise(29000, { type: "pourcentage", valeur: 33 })).toBe(9570);
    expect(montantDeLaRemise(29000, { type: "montant", valeur: 50000 })).toBe(29000);
    expect(montantDeLaRemise(29000, { type: "pourcentage", valeur: 100 })).toBe(29000);
    expect(erreurDeRemise({ type: "pourcentage", valeur: 120 })).toMatch(/100 %/);
    expect(erreurDeRemise({ type: "montant", valeur: 0 })).toMatch(/positive/);
    expect(espaces(libelleDeLaRemise({ type: "montant", valeur: 15000 }))).toBe("−150 €");
  });

  it("le devis chiffré : sur devis, seule la remise est connue ; jamais de taxe", () => {
    expect(chiffrerLeDevis(99000, { type: "pourcentage", valeur: 10 })).toMatchObject({
      prixCatalogueCents: 99000,
      remiseCents: 9900,
      prixRemiseCents: 89100,
    });
    expect(chiffrerLeDevis(null, { type: "pourcentage", valeur: 10 })).toMatchObject({
      prixCatalogueCents: null,
      remiseCents: null,
      prixRemiseCents: null,
    });
    expect(JSON.stringify(chiffrerLeDevis(99000, { type: "montant", valeur: 100 }))).not.toMatch(/HT|TTC/);
  });
});

describe("la règle d'un code promo", () => {
  it("accepte un code valable, refuse chaque cas avec sa raison", () => {
    expect(verifierLeCode(code(), demande())).toEqual({ ok: true });
    const raison = (c: CodePromo | null, d = demande()) => {
      const v = verifierLeCode(c, d);
      return v.ok ? "ok" : v.raison;
    };
    expect(raison(null)).toBe("inconnu");
    expect(raison(code({ actif: false }))).toBe("inactif");
    expect(raison(code({ debut: new Date(MAINTENANT.getTime() + JOUR) }))).toBe("a_venir");
    expect(raison(code({ fin: MAINTENANT }))).toBe("expire");
    expect(raison(code({ utilisationsMax: 3, utilisations: 3 }))).toBe("epuise");
    expect(raison(code(), demande({ offre: "campus", nomDeLOffre: "Offre Campus" }))).toBe("hors_offre");
    expect(raison(code(), demande({ dejaUtiliseParLEtablissement: true }))).toBe("deja_utilise");
    expect(raison(code({ unParEtablissement: false }), demande({ dejaUtiliseParLEtablissement: true }))).toBe("ok");
    expect(raison(code({ offres: null }), demande({ offre: "campus" }))).toBe("ok");
  });

  it("l'établissement : l'UAI ou le SIRET s'il est donné, sinon le nom sans casse, accents ni ponctuation", () => {
    expect(cleDEtablissement("Lycée Pasteur", " 0590001a ")).toBe("id:0590001A");
    expect(cleDEtablissement("Lycée Victor-Hugo", "")).toBe(cleDEtablissement("lycee victor hugo", ""));
  });

  it("le bandeau : en cours entre ses dates, dit le dernier jour, retiré à la fin ou épuisé", () => {
    const c = code();
    expect(promotionEnCours(c, MAINTENANT)).toBe(true);
    expect(espaces(texteDuBandeau(c, (x) => (x === "programme" ? "Programme" : x)))).toBe(
      "−20 % sur Programme jusqu'au 30 novembre avec le code RENTREE",
    );
    expect(promotionEnCours(c, new Date("2026-12-01T00:00:00+01:00"))).toBe(false);
    expect(promotionEnCours(code({ fin: null }), MAINTENANT)).toBe(false);
    expect(promotionEnCours(code({ affiche: false }), MAINTENANT)).toBe(false);
    expect(promotionEnCours(code({ utilisationsMax: 1, utilisations: 1 }), MAINTENANT)).toBe(false);
  });
});

describe("les textes et les paramètres des offres", () => {
  it("les variables se remplissent ; une inconnue reste visible", () => {
    expect(remplir("Les {entreprises} entreprises, {x}.", { entreprises: "9" })).toBe("Les 9 entreprises, {x}.");
  });

  it("le palier de l'arène suit les paramètres : Classe, Programme, Campus", () => {
    expect(palierDeLArene(PARAMETRAGE_DES_OFFRES.classe)).toBe("classe");
    expect(palierDeLArene(PARAMETRAGE_DES_OFFRES.programme)).toBe("programme");
    expect(palierDeLArene(PARAMETRAGE_DES_OFFRES.campus)).toBe("campus");
  });

  it("les libellés du devis d'une offre de la grille sont ceux d'avant le catalogue", () => {
    for (const o of CATALOGUE_PAR_DEFAUT.offres.filter((x) => x.code in LIBELLES_DU_DEVIS)) {
      expect(libellesDuDevisDe(o), o.code).toEqual(LIBELLES_DU_DEVIS[o.code as keyof typeof LIBELLES_DU_DEVIS]);
    }
  });
});
