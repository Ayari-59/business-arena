import { describe, expect, it } from "vitest";
import { blocsDuChapitre } from "../../src/config/couverture";
import { MATIERES_COUVERTES_EN_ENTIER } from "../../src/config/cours/matieres-en-entier";
import { coursDuDiplome } from "../../src/config/cours/par-diplome";
import { CHAPITRES } from "../../src/config/cours/registre";

/**
 * LES SYSTÈMES D'INFORMATION DE GESTION DE TERMINALE, COUVERTS EN ENTIER (lot F du chantier STMG).
 *
 * Les quatre thèmes ne portent plus « en cours » sur /cours?diplome=stmg, et chacun montre les chapitres
 * qui couvrent ses huit questions (audit du chantier STMG, section 6) ; la preuve est dans
 * config/cours/matieres-en-entier.ts. Un chapitre s'affiche sous l'entrée que le référentiel nomme la
 * première (par-diplome.ts) : les chapitres du lot ne citent donc que leur thème du SIG, nommé après ceux
 * de la SGN de première. Les chapitres du SIG qui existaient restent où ils étaient, et
 * « Le système d'information comptable » reste sous la gestion et finance.
 */

const PARTIE = "Terminale, systèmes d'information de gestion";

const ATTENDUS: Record<string, readonly string[]> = {
  "Thème 1 · Organisation et numérisation": ["le-systeme-d-information-de-nova", "securiser-le-systeme-d-information", "ce-que-coute-un-outil-numerique"],
  "Thème 2 · Management du système d'information et performance": ["la-fonction-systeme-d-information", "conduire-un-projet-de-si", "une-donnee-fausse"],
  "Thème 3 · Information, action et décision": [
    "la-base-de-donnees-relationnelle",
    "interroger-la-base-en-sql",
    "automatiser-un-traitement",
    "des-donnees-a-l-information",
    "construire-un-indicateur-juste",
  ],
  "Thème 4 · Système d'information et échange": ["documents-structures-et-metadonnees", "reseaux-et-informatique-en-nuage"],
};

const NOUVEAUX = Object.values(ATTENDUS).flatMap((codes) => codes.filter((c) => CHAPITRES.find((x) => x.code === c)?.parcours === "stmg-sig" && !["ce-que-coute-un-outil-numerique", "une-donnee-fausse", "des-donnees-a-l-information", "construire-un-indicateur-juste"].includes(c)));

const chapitre = (code: string) => CHAPITRES.find((c) => c.code === code)!;

describe("les systèmes d'information de gestion de terminale, sur la page du bac STMG", () => {
  const blocs = coursDuDiplome("stmg")!.blocs.filter((b) => b.partie === PARTIE);

  it("compte quatre thèmes, aucun « en cours »", () => {
    expect(blocs.map((b) => b.bloc)).toEqual(Object.keys(ATTENDUS));
    for (const b of blocs) expect(b.enCours, b.bloc!).toBe(false);
  });

  it("chaque thème montre les chapitres qui couvrent ses questions, tous au niveau du lycée", () => {
    for (const b of blocs) {
      const codes = b.chapitres.map((c) => c.chapitre.code);
      for (const code of ATTENDUS[b.bloc!]!) expect(codes, `${b.bloc} : ${code}`).toContain(code);
      for (const l of b.chapitres) expect(l.chapitre.palier, l.chapitre.code).toBe(1);
    }
  });

  it("sous le thème 1, le système d'information de NOVA vient avant ce que coûte un outil numérique", () => {
    // Décision du propriétaire (10 novembre 2026) : le chapitre qui pose les bases passe en premier.
    const t1 = blocs.find((b) => b.bloc === "Thème 1 · Organisation et numérisation")!;
    const codes = t1.chapitres.map((c) => c.chapitre.code);
    expect(codes.indexOf("le-systeme-d-information-de-nova")).toBeLessThan(codes.indexOf("ce-que-coute-un-outil-numerique"));
  });

  it("chaque thème est déclaré complet une fois, avec sa preuve", () => {
    for (const bloc of Object.keys(ATTENDUS)) {
      const m = MATIERES_COUVERTES_EN_ENTIER.filter((x) => x.formation === "stmg" && x.partie === PARTIE && x.bloc === bloc);
      expect(m, bloc).toHaveLength(1);
      expect(m[0]!.preuve, bloc).toMatch(/lot F/);
    }
  });

  it("les neuf chapitres du lot ne citent qu'un thème du SIG, et ont chacun leur cas", () => {
    expect(NOUVEAUX).toHaveLength(9);
    for (const code of NOUVEAUX) expect(blocsDuChapitre(chapitre(code), "stmg"), code).toHaveLength(1);
  });

  it("le système d'information comptable reste sous la gestion et finance", () => {
    const gf = coursDuDiplome("stmg")!.blocs.find((b) => b.partie === "Terminale, gestion et finance" && b.bloc === "Thème 1 · Appliquer les règles comptables")!;
    expect(gf.chapitres.map((c) => c.chapitre.code)).toContain("le-systeme-d-information-comptable");
  });
});
