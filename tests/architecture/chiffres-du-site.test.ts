import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));

import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { THEMES } from "@/config/cours/themes";
import { dureeDuChapitre, dureeEnClair } from "@/config/cours/duree";
import { FORMATIONS, formationProposee } from "@/config/formations";
import { PARCOURS } from "@/config/cours/registre";
import { coursDeLaFormation } from "@/config/couverture";
import { briques, leCoursEnChiffres } from "@/config/articulation";
import { DESCRIPTION_ACCUEIL, LIGNE_DE_PARTAGE } from "@/config/seo";
import { LeCoursEnBref } from "@/components/le-cours-en-bref";

/**
 * LES CHIFFRES DU SITE, RECOMPTÉS (audit du 10 novembre 2026, P0-1).
 *
 * Le site annonçait 255 chapitres, 262 cas pratiques et 18 formations : il en propose 235,
 * 242 et 12. Les nombres comptaient tout le registre, formations retirées comprises
 * (config/formations-proposees.ts). Cette garde recompte ce qui est proposé, à partir du
 * registre et de la seule liste des formations retirées, sans passer par les filtres du code
 * qu'elle vérifie, et exige que chaque nombre publié soit celui-là.
 *
 *  1. les nombres de la source unique (config/chiffres-du-cours.ts) ;
 *  2. ceux des quatre briques, de l'encart, de la description et de l'image de partage ;
 *  3. « avec leur laboratoire » seulement quand chaque chapitre en a un ;
 *  4. aucun autre fichier publié ne compte le registre entier ;
 *  5. « le premier chapitre est libre » ne s'écrit pas quand le premier listé est réservé.
 */

// Le recompte, à la main : un chapitre est proposé quand son parcours n'a pas de formation,
// ou que sa formation (son diplôme, pour une option) n'est pas retirée.
const proposeAuRecompte = (code: string) => {
  const ch = CHAPITRES.find((c) => c.code === code)!;
  const formation = PARCOURS.find((p) => p.code === ch.parcours)?.formation;
  return !formation || formationProposee(formation);
};
const CHAPITRES_RECOMPTES = CHAPITRES.filter((c) => proposeAuRecompte(c.code));
const CAS_RECOMPTES = SITUATIONS.filter((s) => s.reprend.every(proposeAuRecompte));
const LABORATOIRES_RECOMPTES = CHAPITRES_RECOMPTES.filter((c) => c.etapes.some((e) => e.type === "simulation"));
const FORMATIONS_RECOMPTEES = FORMATIONS.filter(
  (f) => !f.optionDe && formationProposee(f.code) && coursDeLaFormation(f.code).length > 0,
);

const texte = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/\s+/g, " ");

describe("1. la source unique compte ce qui est proposé", () => {
  it("le registre filtré n'est pas le registre entier (sinon la garde ne prouve rien)", () => {
    expect(CHAPITRES_RECOMPTES.length).toBeLessThan(CHAPITRES.length);
    expect(CAS_RECOMPTES.length).toBeLessThan(SITUATIONS.length);
  });

  it("chapitres, laboratoires, cas pratiques et formations", () => {
    const n = leCoursEnChiffres();
    expect(n.chapitres).toBe(CHAPITRES_RECOMPTES.length);
    expect(n.avecLaboratoire).toBe(LABORATOIRES_RECOMPTES.length);
    expect(n.casPratiques).toBe(CAS_RECOMPTES.length);
    expect(n.formations).toBe(FORMATIONS_RECOMPTEES.length);
  });

  it("le catalogue par thème liste ces chapitres et ces cas, ni plus ni moins", () => {
    const duCatalogue = THEMES.flatMap((t) => t.chapitres).filter(proposeAuRecompte);
    expect(new Set(duCatalogue).size).toBe(CHAPITRES_RECOMPTES.length);
  });
});

describe("2. chaque nombre publié est celui de la source", () => {
  it("les briques du cours et des cas pratiques, avec leurs durées", () => {
    const [cours, cas] = briques();
    expect(cours!.compte).toBe(`${CHAPITRES_RECOMPTES.length} chapitres`);
    expect(cas!.compte).toBe(`${CAS_RECOMPTES.length} cas pratiques`);
    const bornes = (l: readonly Parameters<typeof dureeDuChapitre>[0][]) => {
      const m = l.map(dureeDuChapitre);
      return [dureeEnClair(Math.min(...m)), dureeEnClair(Math.max(...m))];
    };
    for (const d of bornes(CHAPITRES_RECOMPTES)) expect(cours!.forme).toContain(d);
    for (const d of bornes(CAS_RECOMPTES)) expect(cas!.forme).toContain(d);
  });

  it("l'encart des pages des publics", () => {
    const t = texte(renderToStaticMarkup(createElement(LeCoursEnBref)));
    expect(t).toContain(`${CHAPITRES_RECOMPTES.length} chapitres`);
    expect(t).toContain(`${CAS_RECOMPTES.length} cas pratiques`);
    expect(t).toContain(`référentiels de ${FORMATIONS_RECOMPTEES.length} formations`);
  });

  it("la description du site et l'image de partage", () => {
    for (const ligne of [DESCRIPTION_ACCUEIL, LIGNE_DE_PARTAGE]) {
      expect(ligne).toContain(`${CHAPITRES_RECOMPTES.length} chapitres`);
      expect(ligne).toContain(`${CAS_RECOMPTES.length} cas pratiques`);
      expect(ligne).not.toContain(`${CHAPITRES.length} chapitres`);
      expect(ligne).not.toContain(`${SITUATIONS.length} cas pratiques`);
    }
  });

  it("/enseignants relie ses formations servies aux formations du cours", () => {
    const page = readFileSync(join(process.cwd(), "src/app/enseignants/page.tsx"), "utf8");
    expect(page).toMatch(/leCoursEnChiffres\(\)\.formations/);
  });
});

describe("3. « avec leur laboratoire » seulement s'il est vrai", () => {
  it("la description dit combien de chapitres ont leur laboratoire", () => {
    if (LABORATOIRES_RECOMPTES.length === CHAPITRES_RECOMPTES.length) return;
    expect(DESCRIPTION_ACCUEIL).not.toMatch(/\d+ chapitres guidés avec leur laboratoire/);
    expect(DESCRIPTION_ACCUEIL).toContain(`dont ${LABORATOIRES_RECOMPTES.length} avec leur laboratoire`);
  });
});

const SRC = join(process.cwd(), "src");
const fichiers = (dossier: string): string[] =>
  readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.tsx?$/.test(nom) ? [chemin] : [];
  });
// Le contenu des chapitres et des cas n'est pas un texte du site sur lui-même.
const CONTENU = /^config\/cours\/(chapitres|situations|monde)\//;
const PUBLIES = fichiers(SRC).filter((f) => !CONTENU.test(relative(SRC, f)));
const sansCommentaires = (source: string) =>
  source
    .split("\n")
    .filter((l) => !/^\s*(\*|\/\/|\/\*|\{\/\*)/.test(l))
    .join("\n");

describe("4. une seule source pour chaque nombre", () => {
  it("aucun fichier ne compte le registre entier des chapitres ou des cas pour l'afficher", () => {
    const fautifs = PUBLIES.filter((f) => /\b(CHAPITRES|SITUATIONS)\.length\b/.test(sansCommentaires(readFileSync(f, "utf8")))).map(
      (f) => relative(SRC, f),
    );
    expect(fautifs).toEqual([]);
  });
});

describe("5. un chapitre libre n'est pas dit « premier » du catalogue quand il ne l'est pas", () => {
  // Un chapitre libre par diplôme, le premier de son parcours (config/cours/chapitres-libres.ts) : un
  // texte peut dire « le premier de son parcours », pas « le premier chapitre » tout court.
  const premierDuCatalogue = THEMES.flatMap((t) => t.chapitres).find(proposeAuRecompte);

  it("aucun texte publié ne dit que le premier chapitre est libre", () => {
    if (CHAPITRES.some((c) => c.libre && c.code === premierDuCatalogue)) return;
    const PREMIER_LIBRE = /premier chapitre[^.;]{0,60}(libre|gratuit)|le premier est libre/i;
    const fautifs = PUBLIES.filter((f) => PREMIER_LIBRE.test(sansCommentaires(readFileSync(f, "utf8")))).map((f) =>
      relative(SRC, f),
    );
    expect(fautifs).toEqual([]);
  });
});
