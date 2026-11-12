import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ATELIERS } from "@/config/ateliers";
import { coursDeLaFormation, formationsAvecUnePage } from "@/config/couverture";
import { coursDuDiplome, rechercherChapitres } from "@/config/cours/par-diplome";
import { PARCOURS_PROPOSES_A_CHOISIR, parcoursAChoisir, titreDuParcours } from "@/config/cours/parcours-de-formation";
import { diplomesParNiveau, programmeDuDiplome } from "@/config/cours/programme";
import { CHAPITRES, PARCOURS } from "@/config/cours/registre";
import { FORMATIONS, publicDeLAtelier } from "@/config/formations";
import {
  CHAPITRES_PROPOSES,
  FORMATIONS_PROPOSEES,
  FORMATIONS_RETIREES,
  chapitrePropose,
  formationProposee,
} from "@/config/formations-proposees";
import { chapitresDeLaNotion } from "@/pedagogy/cours/suites";

/**
 * AU LYCÉE, LE BAC STMG SEUL (décision du propriétaire, novembre 2026).
 *
 * Sept formations sortent du site public : le CAP, les secondes et les bacs professionnels. Le
 * bac STMG, le supérieur, la formation continue et les entreprises restent. Rien n'est supprimé :
 * une classe déjà créée sur un parcours retiré garde son parcours et ses chapitres. La règle vit
 * dans config/formations-proposees.ts ; cette garde la vérifie à chaque endroit où une formation
 * ou un chapitre se propose, et relit les pages qui présentent le site.
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

/** Les formations retirées, écrites ici aussi : une règle vidée par erreur ne passe pas. */
const RETIREES = ["bac-pro-agora", "bac-pro-mcv", "cap-epc", "seconde-mg", "seconde-pro-gatl", "seconde-pro-rc", "seconde-ses"];

/** Les parcours du cours qui suivent une formation retirée, recalculés ici. */
const PARCOURS_RETIRES = PARCOURS.filter((p) => p.formation && RETIREES.includes(p.formation)).map((p) => p.code);

/** Les mots d'un niveau retiré, dans un texte qui présente le site. */
const NIVEAU_RETIRE =
  /(?<!\p{L})(CAP|2de|seconde (?:professionnelle|générale|pro|option)|de la seconde|bacs? pro|baccalauréat professionnel)(?!\p{L})/u;

describe("la règle : au lycée, le bac STMG seul", () => {
  it("retire exactement le CAP, les secondes et les bacs professionnels", () => {
    expect([...FORMATIONS_RETIREES].sort()).toEqual(RETIREES);
    for (const code of RETIREES) expect(FORMATIONS.some((f) => f.code === code), code).toBe(true);
    expect(formationProposee("stmg")).toBe(true);
    expect(formationProposee("bts-cg")).toBe(true);
    expect(formationProposee("bts-mhr-bc")).toBe(true);
    expect(FORMATIONS_PROPOSEES.length).toBe(FORMATIONS.length - FORMATIONS_RETIREES.size);
  });

  it("retire les cinq parcours de ces formations, et leurs chapitres seulement", () => {
    expect(PARCOURS_RETIRES.sort()).toEqual(["cap-epc", "logistique", "seconde-mg", "seconde-ses", "vente"]);
    const retires = CHAPITRES.filter((c) => (PARCOURS_RETIRES as string[]).includes(c.parcours));
    expect(retires.length).toBe(20);
    expect(CHAPITRES_PROPOSES.length).toBe(CHAPITRES.length - retires.length);
    for (const c of retires) expect(chapitrePropose(c), c.code).toBe(false);
    // Les chapitres libres restent proposés : un par diplôme proposé, c'est la porte du cours.
    for (const c of CHAPITRES.filter((x) => x.libre)) expect(chapitrePropose(c), c.code).toBe(true);
  });

  it("aucune page de diplôme, aucun programme ni aucune tuile pour une formation retirée", () => {
    for (const code of RETIREES) {
      expect(formationsAvecUnePage().some((f) => f.code === code), code).toBe(false);
      expect(programmeDuDiplome(code), code).toBeNull();
      expect(coursDuDiplome(code), code).toBeNull();
    }
    for (const g of diplomesParNiveau()) for (const f of g.formations) expect(formationProposee(f.code), f.code).toBe(true);
    expect(formationsAvecUnePage().some((f) => f.code === "stmg")).toBe(true);
  });

  it("aucun chapitre retiré dans le cours d'une formation, la recherche ni les notions", () => {
    for (const f of FORMATIONS_PROPOSEES)
      for (const g of coursDeLaFormation(f.code)) for (const c of g.chapitres) expect(chapitrePropose(c), `${f.code} : ${c.code}`).toBe(true);
    for (const c of rechercherChapitres("prix")) expect(chapitrePropose(c), c.code).toBe(true);
    const notions = new Set(CHAPITRES.flatMap((c) => c.etapes.flatMap((e) => e.notions ?? [])));
    for (const n of notions) for (const l of chapitresDeLaNotion(n)) expect(chapitrePropose(CHAPITRES.find((c) => c.code === l.code)!), l.code).toBe(true);
  });

  it("une nouvelle classe ne choisit pas un parcours retiré ; une classe qui en a un le garde", () => {
    for (const code of PARCOURS_RETIRES) {
      expect(PARCOURS_PROPOSES_A_CHOISIR.some((p) => p.code === code), code).toBe(false);
      expect(parcoursAChoisir(code), code).toBe(true);
      expect(titreDuParcours(code), code).toBeTruthy();
    }
    expect(PARCOURS_PROPOSES_A_CHOISIR.some((p) => p.code === "stmg-sig")).toBe(true);
    expect(lire("src/services/cours.service.ts")).toMatch(/parcoursProposeAChoisir\(p\)/);
    for (const page of ["src/app/teacher/cours/page.tsx", "src/app/teacher/cours/[id]/page.tsx"])
      expect(lire(page), page).not.toMatch(/PARCOURS_A_CHOISIR\.map/);
  });

  it("les ateliers ne nomment plus une formation retirée", () => {
    for (const a of ATELIERS) expect(publicDeLAtelier(a), a.code).not.toMatch(NIVEAU_RETIRE);
  });

  it("les pages qui présentent le site ne nomment plus un niveau retiré", () => {
    for (const chemin of [
      "src/app/page.tsx",
      "src/app/cours/page.tsx",
      "src/app/enseignants/page.tsx",
      "src/app/parcours/page.tsx",
      "src/app/ecoles/page.tsx",
      // La page des lycées : le bac STMG et les BTS, rien d'autre (audit de l'offre du 11 novembre 2026, P1-3).
      "src/app/lycees/page.tsx",
      "src/components/page-des-lycees.tsx",
      "src/config/lycees.ts",
      "src/app/animations/page.tsx",
      "src/app/fonctionnalites/page.tsx",
      "src/app/teacher/games/[gameId]/page.tsx",
    ]) {
      // Les commentaires ne s'affichent pas : seule compte la page servie.
      const sansCommentaires = lire(chemin).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      expect(sansCommentaires, chemin).not.toMatch(NIVEAU_RETIRE);
    }
  });

  it("un chapitre retiré se joue encore, hors des moteurs de recherche", () => {
    expect(lire("src/app/cours/[chapitre]/page.tsx")).toMatch(/chapitrePropose\(c\) \? \{\} : \{ robots: \{ index: false/);
  });
});
