import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CREATION_PREMIER_BILAN } from "../../src/config/cours/chapitres/creation-premier-bilan";
import { LE_CADRE_DE_LA_COMPTABILITE, repartitionDesFormes } from "../../src/config/cours/chapitres/le-cadre-de-la-comptabilite";
import { CAS_DES_ENTREPRISES } from "../../src/config/cours/monde/cas-des-entreprises";
import {
  ATELIER_DE_REPARATION,
  CRITERES_DE_NOVA,
  FORMES,
  FORMES_DES_ENTREPRISES,
  MANQUE_POUR_UNE_SA,
  commissaireAuxComptes,
  formeDe,
  resultatSelonLesPrincipes,
} from "../../src/config/cours/monde/cadre-de-la-comptabilite";
import { CLOTURE_DE_LA_FICHE } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { CREER_L_ATELIER_DE_REPARATION } from "../../src/config/cours/situations/par-chapitre/creer-l-atelier-de-reparation";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";

/**
 * LE CADRE DE LA COMPTABILITÉ (NOVA en N + 1) : la forme des neuf entreprises du cours, attestée par
 * leurs sources ; le seuil du commissaire aux comptes ; le laboratoire des principes, qui refait la
 * clôture de N travail par travail (CLOTURE_DE_LA_FICHE) ; le cas de l'atelier de réparation.
 */

const ch = LE_CADRE_DE_LA_COMPTABILITE;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const SRC = join(process.cwd(), "src");

describe("le cadre de la comptabilité : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 3), au thème, et cite le BTS CG P1 et P2", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][3]!);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(3);
    expect(ch.blocs).toEqual(["BTS CG P1 · Contrôle et traitement comptable des opérations commerciales", "BTS CG P2 · Contrôle et production de l'information financière"]);
    expect(THEMES.find((t) => t.code === "comptabilite")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual([CREATION_PREMIER_BILAN.code]);
    expect(ch.ensuite).toEqual(["ventes-et-achats-au-complet"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    ch.objectifs.forEach((_, i) => expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true));
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const x of [ch, CREER_L_ATELIER_DE_REPARATION]) {
      for (const e of chapitreDuCas(x, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });

  it("n'écrit jamais « gérant » pour NOVA, une SAS", () => {
    const source = readFileSync(join(SRC, "config/cours/chapitres/le-cadre-de-la-comptabilite.ts"), "utf8");
    expect(source).not.toMatch(/gérant[^\n]*NOVA|NOVA[^\n]*gérant/i);
  });
});

describe("la forme des neuf entreprises du cours", () => {
  it("chaque entreprise du cours a une forme, et une seule fiche par entreprise", () => {
    expect(Object.keys(FORMES_DES_ENTREPRISES).sort()).toEqual(Object.keys(CAS_DES_ENTREPRISES).sort());
    for (const code of Object.keys(CAS_DES_ENTREPRISES)) expect(Object.keys(FORMES)).toContain(FORMES_DES_ENTREPRISES[code]!.forme);
  });

  it("NOVA est une SAS, MARTEL & FILS une entreprise individuelle (décisions du propriétaire)", () => {
    expect(CAS_DES_ENTREPRISES.nova!.entreprise).toBe("NOVA");
    expect(formeDe("nova").code).toBe("SAS");
    expect(FORMES_DES_ENTREPRISES.nova!.dirigeant).toBe("le président");
    expect(CAS_DES_ENTREPRISES.batiment!.entreprise).toBe("MARTEL & FILS");
    expect(formeDe("batiment").code).toBe("EI");
    expect(() => formeDe("inconnue")).toThrow();
  });

  it("chaque forme est attestée par un extrait de ses sources, qui y figure vraiment", () => {
    for (const [code, f] of Object.entries(FORMES_DES_ENTREPRISES)) {
      expect(f.preuves.length, code).toBeGreaterThan(0);
      for (const p of f.preuves) expect(readFileSync(join(SRC, p.fichier), "utf8"), `${code} : ${p.fichier}`).toContain(p.extrait);
    }
  });

  it("le vocabulaire des sources du cours ne contredit pas la forme (NOVA mise à part, corrigée à part)", () => {
    const lignes: string[] = [];
    const lire = (dossier: string) => {
      for (const e of readdirSync(dossier, { withFileTypes: true })) {
        const chemin = join(dossier, e.name);
        if (e.isDirectory()) lire(chemin);
        else if (e.name.endsWith(".ts")) lignes.push(...readFileSync(chemin, "utf8").split("\n"));
      }
    };
    lire(join(SRC, "config/cours"));
    // Les mots qui trahiraient une autre forme, dans une ligne qui nomme l'entreprise.
    const contraires: Record<string, RegExp> = {
      SARL: /\bactionnaires?\b|\bactions\b|\bprésidente?\b|conseil d'administration/i,
      SAS: /\bgérante?s?\b|parts sociales/i,
      EI: /\bactionnaires?\b|\bactions\b|\bassociés?\b|parts sociales/i,
    };
    for (const [code, f] of Object.entries(FORMES_DES_ENTREPRISES)) {
      if (code === "nova") continue;
      const nom = CAS_DES_ENTREPRISES[code]!.entreprise;
      const fautives = lignes.filter((l) => l.includes(nom) && !l.includes("FORMES_DES_ENTREPRISES") && contraires[f.forme]!.test(l));
      expect(fautives, `${nom} (${f.forme})`).toEqual([]);
    }
  });

  it("le tri du chapitre range les neuf entreprises dans leur forme", () => {
    const t = triDe(ch, "les-neuf-entreprises");
    expect(Object.keys(t)).toHaveLength(9);
    expect(Object.values(t).filter((x) => x === "SARL")).toHaveLength(5);
    expect(Object.values(t).filter((x) => x === "SAS")).toHaveLength(3);
    expect(Object.values(t).filter((x) => x === "EI")).toHaveLength(1);
    expect(repartitionDesFormes()).toBe("5 SARL, 3 SAS et 1 entreprise individuelle");
  });

  it("les formes : une SA demande 37 000 € de capital, la SARL, l'EURL et la SAS un capital libre, l'EI aucun", () => {
    expect(FORMES.SA.capitalMinimal).toBe(37_000);
    expect([FORMES.SARL, FORMES.EURL, FORMES.SAS].map((f) => f.capitalMinimal)).toEqual([1, 1, 1]);
    expect(FORMES.EI.capitalMinimal).toBeNull();
    expect(FORMES.EI.titres).toBeNull();
  });
});

describe("le commissaire aux comptes et les principes, refaits à la main", () => {
  it("NOVA à la clôture de N : 432 256,34 € de bilan, 1 390 276 € de chiffre d'affaires, 4 salariés, aucun seuil dépassé", () => {
    expect(CRITERES_DE_NOVA).toEqual({ totalDuBilan: 432_256.34, chiffreDAffaires: 1_390_276, effectif: 4 });
    expect(commissaireAuxComptes(CRITERES_DE_NOVA)).toEqual({ depasses: 0, obligatoire: false });
    expect(commissaireAuxComptes({ totalDuBilan: 5_000_000, chiffreDAffaires: 9_000_000, effectif: 10 })).toEqual({ depasses: 2, obligatoire: true });
    expect(commissaireAuxComptes({ totalDuBilan: 5_000_000, chiffreDAffaires: 1, effectif: 10 })).toEqual({ depasses: 1, obligatoire: false });
    expect(juste(ch, "le-commissaire-aux-comptes")).toEqual(["Non : elle ne dépasse aucun seuil"]);
  });

  it("les deux principes appliqués : le résultat net publié, 79 225,96 €", () => {
    expect(resultatSelonLesPrincipes({ prudence: 1, independance: 1 })).toMatchObject({ resultatAvantImpot: 99_967.96, resultatNet: CLOTURE_DE_LA_FICHE.resultatNet, ecart: 0 });
  });

  it("sans prudence : la dépréciation de Sonora (11 210 €) et la provision (5 000 €) oubliées, 116 177,96 € avant impôt", () => {
    const r = resultatSelonLesPrincipes({ prudence: 0, independance: 1 });
    expect(r.resultatAvantImpot).toBe(c(99_967.96 + 11_210 + 5_000));
    // L'impôt : 15 % jusqu'à 42 500 €, 25 % au-delà, à l'euro.
    expect(r.impot).toBe(Math.round(42_500 * 0.15 + (116_177.96 - 42_500) * 0.25));
    expect(r.resultatNet).toBe(c(116_177.96 - r.impot));
    expect(juste(ch, "predire-la-prudence")).toEqual(["Plus haut"]);
  });

  it("sans indépendance des exercices : les six travaux de rattachement oubliés, 122 144,49 € avant impôt", () => {
    const r = resultatSelonLesPrincipes({ prudence: 1, independance: 0 });
    expect(r.resultatAvantImpot).toBe(c(99_967.96 + 34_500 - 4_500 - 11_800 + 7_080 + 831.11 - 3_934.58));
    expect(r.oublies).toHaveLength(6);
  });

  it("le premier jet, sans les deux : 28 789,53 € de résultat net de trop ; le laboratoire n'a qu'une solution", () => {
    const r = resultatSelonLesPrincipes({ prudence: 0, independance: 0 });
    expect(r.resultatAvantImpot).toBe(c(99_967.96 + 16_210 + 22_176.53));
    expect(r.ecart).toBe(c(r.resultatNet - 79_225.96));
    expect(r.ecart).toBe(28_789.53);
    gardeDuLaboratoire(ch, "le-laboratoire-des-principes");
  });

  it("les principes en acte, et les réponses de la veille, de l'annexe et de la forme", () => {
    const t = triDe(ch, "les-principes-en-acte");
    expect(Object.values(t).sort()).toEqual(["continuite", "independance", "permanence", "permanence", "prudence"]);
    expect(juste(ch, "la-veille")).toEqual(["Il trace le texte, adapte le PGI et prévient la direction"]);
    expect(juste(ch, "la-forme-qui-convient")).toEqual(["Une SAS à associé unique (SASU)"]);
  });
});

describe("le cas dédié : créer l'atelier de réparation", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(CREER_L_ATELIER_DE_REPARATION);
    gardeDuCas(CREER_L_ATELIER_DE_REPARATION, ch);
  });

  it("4 000 € d'apports : 33 000 € manqueraient pour une SA ; aucun seuil dépassé ; la SAS", () => {
    expect(ATELIER_DE_REPARATION.apports).toBe(4_000);
    expect(MANQUE_POUR_UNE_SA).toBe(37_000 - 4_000);
    const montants = etape(chapitreDuCas(CREER_L_ATELIER_DE_REPARATION, NOVA), "les-chiffres", "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants).toEqual([33_000, 0]);
    const r = etape(CREER_L_ATELIER_DE_REPARATION, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Une SAS"]);
  });
});
