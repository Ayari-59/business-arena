import { describe, expect, it, vi } from "vitest";

// La règle de la classe est une fonction pure ; son module lit l'offre en base, qu'aucun test ici n'appelle.
vi.mock("@/db", () => ({ db: {} }));
import { coursDeLaFormation } from "../../src/config/couverture";
import { coursDuDiplome, chapitresDuParcoursDansLOrdre } from "../../src/config/cours/par-diplome";
import {
  CHAPITRES_DES_PARCOURS_DE_FORMATION,
  PARCOURS_A_CHOISIR,
  PARCOURS_DE_FORMATION,
  PARCOURS_PROPOSES_A_CHOISIR,
  annonceursDe,
  chapitresDuParcoursAChoisir,
  chapitresDuParcoursDeFormation,
  ouvertAvecUnLibere,
  parcoursAChoisir,
  parcoursDuDiplome,
  parcoursQuiOuvrent,
  tailleDesParcours,
  titreDuParcours,
} from "../../src/config/cours/parcours-de-formation";
import { TAILLE_DES_PARCOURS } from "../../src/config/cours/taille-des-parcours";
import { CHAPITRES, PARCOURS } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { FORMATIONS_PROPOSEES } from "../../src/config/formations-proposees";
import { chapitreOuvertALaClasse, libereALaClasse } from "../../src/services/chapitres-de-la-classe";

/**
 * UN PARCOURS PAR DIPLÔME (décision du propriétaire, 11 novembre 2026 ; audit du même jour : offre P1-1,
 * pédagogie P1-6, UX P1-4). Le bac STMG, le BTS CG, le BTS SAM, le BTS MHR, le DCG et le DSCG ont,
 * comme les trois BUT avant eux, leur parcours de formation : le cours du diplôme. Il regroupe des
 * chapitres existants, sans en dupliquer aucun ni toucher au champ `parcours`, et sa liste est celle
 * de la page du diplôme (/cours?diplome=…), lue, jamais recopiée. Une classe peut le choisir : il
 * ouvre ses chapitres et leurs cas.
 *
 * LES PRÉREQUIS ANNONCÉS S'OUVRENT AVEC LE CHAPITRE QUI LES ANNONCE (même décision) : aucun prérequis
 * qu'un chapitre ouvert à la classe annonce ne lui reste fermé, de proche en proche.
 */

const PAR_CODE = new Map(CHAPITRES.map((c) => [c.code, c]));

describe("le cours de chaque diplôme, un parcours", () => {
  it("le bac STMG, le BTS CG, le BTS SAM, le BTS MHR, les trois BUT, le DCG et le DSCG, sous un code qu'aucun parcours du registre ne porte", () => {
    expect(PARCOURS_DE_FORMATION.map((p) => p.formation)).toEqual(["stmg", "bts-cg", "bts-sam", "bts-mhr", "but-gea", "but-tc", "but-gaco", "dcg", "dscg"]);
    for (const p of PARCOURS_DE_FORMATION) {
      expect(PARCOURS.map((x) => x.code as string), p.code).not.toContain(p.code);
      expect(p.titre, p.code).toMatch(/ · Le cours du diplôme$/);
      expect(parcoursDuDiplome(p.formation)).toBe(p.code);
    }
    expect(new Set(PARCOURS_A_CHOISIR.map((p) => p.code)).size).toBe(PARCOURS.length + PARCOURS_DE_FORMATION.length);
    // Une option compte pour son diplôme ; un diplôme que ses parcours du registre couvrent déjà n'en a pas.
    expect(parcoursDuDiplome("bts-mhr-bc")).toBe("bts-mhr");
    expect(parcoursDuDiplome("bts-mco")).toBeNull();
    for (const p of PARCOURS_DE_FORMATION) expect(PARCOURS_PROPOSES_A_CHOISIR.some((x) => x.code === p.code), p.code).toBe(true);
  });

  it("chaque liste est la page de son diplôme, chapitre pour chapitre, et aucun autre", () => {
    for (const p of PARCOURS_DE_FORMATION) {
      const page = coursDeLaFormation(p.formation).flatMap((g) => g.chapitres.map((c) => c.code));
      const cours = coursDuDiplome(p.formation)!.blocs.flatMap((b) => b.chapitres.map((l) => l.chapitre.code));
      const liste = CHAPITRES_DES_PARCOURS_DE_FORMATION[p.code]!;
      expect([...liste].sort(), p.code).toEqual([...page].sort());
      expect([...liste].sort(), p.code).toEqual([...cours].sort());
      expect(liste.length, p.code).toBeGreaterThanOrEqual(3);
    }
    // Le DCG en entier, et non plus les 5 chapitres de « DCG · Comptabilité approfondie » ; le BTS CG
    // et le BTS SAM ont le leur.
    expect(CHAPITRES_DES_PARCOURS_DE_FORMATION.dcg!.length).toBeGreaterThan(CHAPITRES.filter((c) => c.parcours === "dcg-comptabilite-approfondie").length);
    expect(CHAPITRES_DES_PARCOURS_DE_FORMATION["dcg"]).toEqual(expect.arrayContaining(["le-test-de-depreciation", "l-augmentation-de-capital"]));
    expect(CHAPITRES_DES_PARCOURS_DE_FORMATION["but-gea"]).toEqual(expect.arrayContaining(["le-test-de-depreciation", "l-augmentation-de-capital"]));
  });

  it("aucun chapitre n'est dupliqué : chacun garde son seul parcours, et le registre n'a pas grandi", () => {
    const codes = Object.values(CHAPITRES_DES_PARCOURS_DE_FORMATION).flat();
    for (const code of codes) expect(CHAPITRES.filter((c) => c.code === code), code).toHaveLength(1);
    for (const p of PARCOURS_DE_FORMATION) expect(CHAPITRES.some((c) => (c.parcours as string) === p.code), p.code).toBe(false);
    // Un chapitre regroupé par plusieurs parcours reste un seul chapitre (la paie : le BTS CG, le DCG, les BUT…).
    const paie = PAR_CODE.get("la-paie")!;
    const ouvrent = parcoursQuiOuvrent(paie);
    expect(ouvrent[0]).toBe("comptabilite-generale");
    expect(ouvrent).toEqual(expect.arrayContaining(["bts-cg", "dcg", "but-gea", "but-gaco"]));
  });

  it("les chapitres d'un parcours de formation se rangent par palier ; ceux d'un parcours, dans l'ordre de la page", () => {
    const k = chapitresDuParcoursDeFormation("but-gea").map((c) => c.palier);
    expect(k).toEqual([...k].sort((a, b) => a - b));
    for (const p of PARCOURS_DE_FORMATION) {
      const rangs = coursDuDiplome(p.formation)!.blocs.flatMap((b) => b.chapitres).sort((a, b) => a.rang - b.rang).map((l) => l.chapitre.code);
      expect(chapitresDuParcoursDansLOrdre(p.code).map((c) => c.code), p.code).toEqual(rangs);
    }
    // Un parcours du registre : ses chapitres, prérequis d'abord.
    const cg = chapitresDuParcoursDansLOrdre("controle-de-gestion").map((c) => c.code);
    expect([...cg].sort()).toEqual(CHAPITRES.filter((c) => c.parcours === "controle-de-gestion").map((c) => c.code).sort());
    for (const [i, code] of cg.entries()) {
      for (const pre of PAR_CODE.get(code)!.prerequis ?? []) if (cg.includes(pre)) expect(cg.indexOf(pre), `${pre} avant ${code}`).toBeLessThan(i);
    }
    expect(chapitresDuParcoursDansLOrdre(null)).toEqual([]);
  });

  it("un cas dédié s'ouvre avec le chapitre qu'il reprend", () => {
    const cas = casDuChapitre("le-test-de-depreciation")!;
    expect(parcoursQuiOuvrent(cas)).toEqual(expect.arrayContaining(["but-gea", "dcg"]));
  });

  it("la classe : sous Classe ou Programme, le cours d'un diplôme ouvre ses chapitres et ferme les autres ; sous Campus, tout", () => {
    for (const p of PARCOURS_DE_FORMATION) {
      const classe = { parcours: p.code, heritee: false };
      const dedans = CHAPITRES.find((c) => !c.libre && CHAPITRES_DES_PARCOURS_DE_FORMATION[p.code]!.includes(c.code));
      const dehors = CHAPITRES.find((c) => !c.libre && !parcoursQuiOuvrent(c).includes(p.code))!;
      for (const offre of ["classe", "programme"] as const) {
        if (dedans) expect(chapitreOuvertALaClasse(offre, classe, dedans), `${p.code} ${offre}`).toBe(true);
        expect(chapitreOuvertALaClasse(offre, classe, dehors), `${p.code} ${offre}`).toBe(false);
      }
      expect(chapitreOuvertALaClasse("campus", classe, dehors)).toBe(true);
      if (dedans) expect(chapitreOuvertALaClasse(null, classe, dedans)).toBe(false);
    }
    // Le champ parcours d'origine ouvre toujours ses chapitres.
    const dedans = CHAPITRES.find((c) => !c.libre && CHAPITRES_DES_PARCOURS_DE_FORMATION["but-gea"]!.includes(c.code))!;
    expect(chapitreOuvertALaClasse("classe", { parcours: dedans.parcours, heritee: false }, dedans)).toBe(true);
  });

  it("le cours d'un diplôme se choisit, et se nomme sur la page de la classe", () => {
    expect(parcoursAChoisir("but-tc")).toBe(true);
    expect(parcoursAChoisir("bts-cg")).toBe(true);
    expect(parcoursAChoisir("bac-stmg")).toBe(true);
    expect(parcoursAChoisir("mco")).toBe(true);
    expect(parcoursAChoisir("but")).toBe(false);
    expect(titreDuParcours("but-gaco")).toBe("BUT GACO · Le cours du diplôme");
    expect(titreDuParcours("dcg")).toBe("DCG · Le cours du diplôme");
  });
});

describe("les prérequis annoncés s'ouvrent avec le chapitre qui les annonce", () => {
  const avecPrerequis = CHAPITRES.filter((c) => (c.prerequis ?? []).length > 0);

  it("aucun prérequis annoncé ne reste fermé à une classe, quel que soit son parcours, de proche en proche", () => {
    expect(avecPrerequis.length).toBeGreaterThan(50);
    const fermes: string[] = [];
    for (const p of PARCOURS_PROPOSES_A_CHOISIR) {
      const ouverts = CHAPITRES.filter((c) => parcoursQuiOuvrent(c).includes(p.code));
      for (const c of ouverts) for (const pre of c.prerequis ?? []) if (!parcoursQuiOuvrent(PAR_CODE.get(pre)!).includes(p.code)) fermes.push(`${p.code} : ${c.code} → ${pre}`);
    }
    expect(fermes).toEqual([]);
  });

  it("un prérequis hors du parcours s'ouvre par le parcours du chapitre qui l'annonce, et son cas avec lui", () => {
    // Un chapitre de l'UE10 du DCG annonce des chapitres de comptabilité générale, hors de
    // « DCG · Comptabilité approfondie » : ils s'ouvrent à une classe de ce parcours.
    const approfondie = CHAPITRES.filter((c) => c.parcours === "dcg-comptabilite-approfondie");
    const horsDuParcours = approfondie.flatMap((c) => c.prerequis ?? []).filter((x) => PAR_CODE.get(x)!.parcours !== "dcg-comptabilite-approfondie");
    expect(horsDuParcours.length).toBeGreaterThan(0);
    for (const pre of horsDuParcours) {
      expect(parcoursQuiOuvrent(PAR_CODE.get(pre)!), pre).toContain("dcg-comptabilite-approfondie");
      const cas = casDuChapitre(pre);
      if (cas) expect(parcoursQuiOuvrent(cas), cas.code).toContain("dcg-comptabilite-approfondie");
    }
    // Le parcours propre reste le premier : c'est lui que le devis d'un contenu réservé préremplit.
    for (const c of CHAPITRES) expect(parcoursQuiOuvrent(c)[0], c.code).toBe(c.parcours);
  });

  it("de proche en proche : le prérequis d'un prérequis compte parmi ceux qui l'annoncent", () => {
    const chaine = avecPrerequis.find((c) => (c.prerequis ?? []).some((p) => (PAR_CODE.get(p)?.prerequis ?? []).length > 0))!;
    const intermediaire = (chaine.prerequis ?? []).find((p) => (PAR_CODE.get(p)?.prerequis ?? []).length > 0)!;
    const premier = PAR_CODE.get(intermediaire)!.prerequis![0]!;
    expect(annonceursDe(premier).has(intermediaire)).toBe(true);
    expect(annonceursDe(premier).has(chaine.code)).toBe(true);
  });

  it("une classe qui libère un chapitre libère ses prérequis avec lui, pas plus", () => {
    const c = avecPrerequis.find((x) => !x.libre && (x.prerequis ?? []).some((p) => !PAR_CODE.get(p)!.libre))!;
    const pre = PAR_CODE.get((c.prerequis ?? []).find((p) => !PAR_CODE.get(p)!.libre)!)!;
    const liberes = new Set([c.code]);
    expect(ouvertAvecUnLibere(liberes, pre.code)).toBe(c.code);
    expect(libereALaClasse("chapitre", liberes, pre)).toBe(true);
    expect(libereALaClasse("chapitre", new Set<string>(), pre)).toBe(false);
    // Celui qui l'annonce ne s'ouvre pas avec son prérequis.
    expect(libereALaClasse("chapitre", new Set([pre.code]), c)).toBe(false);
  });
});

describe("la taille de chaque parcours, écrite pour le devis", () => {
  it("config/cours/taille-des-parcours.ts est à jour : relancer scripts/compter-les-parcours.ts sinon", () => {
    expect(TAILLE_DES_PARCOURS, "npx tsx scripts/compter-les-parcours.ts").toEqual(tailleDesParcours());
  });

  it("le cours d'un diplôme compte les chapitres de sa page et sert son diplôme ; une matière, les diplômes dont la page la cite", () => {
    for (const p of PARCOURS_DE_FORMATION) {
      expect(TAILLE_DES_PARCOURS[p.code], p.code).toEqual({ chapitres: CHAPITRES_DES_PARCOURS_DE_FORMATION[p.code]!.length, diplomes: [p.formation] });
    }
    const cg = TAILLE_DES_PARCOURS["comptabilite-generale"]!;
    expect(cg.chapitres).toBe(chapitresDuParcoursAChoisir("comptabilite-generale").length);
    for (const d of cg.diplomes) {
      const page = new Set(coursDeLaFormation(d).flatMap((g) => g.chapitres.map((c) => c.code)));
      expect(chapitresDuParcoursAChoisir("comptabilite-generale").some((c) => page.has(c.code)), d).toBe(true);
    }
    // Un parcours qui suit un diplôme le nomme d'abord.
    expect(TAILLE_DES_PARCOURS["dcg-comptabilite-approfondie"]!.diplomes[0]).toBe("dcg");
    // Chaque parcours proposé a sa taille, et aucun autre.
    expect(Object.keys(TAILLE_DES_PARCOURS).sort()).toEqual(PARCOURS_PROPOSES_A_CHOISIR.map((p) => p.code).sort());
    for (const d of Object.values(TAILLE_DES_PARCOURS).flatMap((t) => t.diplomes)) expect(FORMATIONS_PROPOSEES.some((f) => f.code === d), d).toBe(true);
  });
});
