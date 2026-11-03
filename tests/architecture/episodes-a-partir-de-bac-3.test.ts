import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { createElement, type FC } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { referentielDeCitation } from "@/config/ateliers/referentiels";
import { couvertureDeLaFormation, formationsAvecUnePage, tableauDeCouverture } from "@/config/couverture";
import { programmeDuDiplome } from "@/config/cours/programme";
import { CHAPITRES, PARCOURS } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { FAMILLES } from "@/config/episodes/familles";
import { FICHES, FICHES_LISTEES } from "@/config/episodes/fiches";
import { briques } from "@/config/articulation";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/config/site";
import {
  ANNEES_APRES_LE_BAC,
  formationDeLaLigne,
  formationOuverteAuxEpisodes,
  NIVEAU_MINIMUM_DES_EPISODES,
  PUBLIC_DES_EPISODES,
} from "@/config/episodes/public-des-episodes";
import { FORMATIONS } from "@/config/formations";
import { CATALOGUE_PAR_DEFAUT, LIBELLES_DU_DEVIS } from "@/config/tarifs";
import { suitesDuChapitre } from "@/pedagogy/cours/suites";

/**
 * LES ÉPISODES MANAGER À PARTIR DE BAC + 3 (décision du propriétaire, novembre 2026).
 *
 * Aucune page, aucun registre ni aucune suite n'annonce un épisode pour une formation de niveau
 * inférieur à bac + 3 : ni le CAP, ni la seconde, ni le bac professionnel, ni le bac STMG, ni le
 * BTS. La règle vit dans config/episodes/public-des-episodes.ts ; cette garde la vérifie à
 * chaque endroit où un épisode rencontre une formation, et recalcule elle-même ce que chaque
 * chapitre sert, pour ne pas se contenter de relire la règle.
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

/**
 * Les mots d'un niveau fermé, dans un texte qui présente des épisodes. « Seconde » seule n'y est
 * pas (« une seconde demande »), ni « première » (« une matière première ») : leurs formes
 * scolaires, oui.
 */
const NIVEAU_FERME =
  /(?<!\p{L})(CAP|BTS|STMG|lycée|lycées|lycéens?|2de|seconde (?:professionnelle|générale|pro)|bac pro|baccalauréat professionnel|bac STMG|terminale STMG|première STMG)(?!\p{L})/iu;

describe("la règle : à partir de bac + 3", () => {
  it("ouvre exactement le BUT, le DCG et le DSCG parmi les formations du registre", () => {
    expect(NIVEAU_MINIMUM_DES_EPISODES).toBe(3);
    const ouvertes = FORMATIONS.filter((f) => formationOuverteAuxEpisodes(f.code)).map((f) => f.code);
    expect(ouvertes).toEqual(["but-gea", "but-tc", "but-gaco", "dcg", "dscg"]);
  });

  it("donne un niveau à chaque formation du registre, une option comptant pour son diplôme", () => {
    for (const f of FORMATIONS) {
      if (f.optionDe) expect(ANNEES_APRES_LE_BAC[f.code], f.code).toBeUndefined();
      else expect(ANNEES_APRES_LE_BAC[f.code], `${f.code} : sans niveau`).toBeTypeOf("number");
    }
    for (const code of Object.keys(ANNEES_APRES_LE_BAC)) expect(FORMATIONS.some((f) => f.code === code), code).toBe(true);
  });

  it("se dit en clair, sans nommer un niveau fermé", () => {
    expect(PUBLIC_DES_EPISODES).toMatch(/bac \+ 3/);
    expect(PUBLIC_DES_EPISODES).not.toMatch(NIVEAU_FERME);
  });
});

describe("le registre des fiches enseignant", () => {
  it("n'annonce aucune formation fermée", () => {
    for (const fiche of FICHES)
      for (const c of fiche.formations) expect(formationOuverteAuxEpisodes(c), `${fiche.code} annonce ${c}`).toBe(true);
  });

  it("ne cite aucune ligne de programme d'une formation fermée", () => {
    for (const fiche of FICHES)
      for (const ligne of fiche.programme) {
        const code = formationDeLaLigne(ligne);
        if (code) expect(formationOuverteAuxEpisodes(code), `${fiche.code} : « ${ligne} »`).toBe(true);
        expect(ligne, `${fiche.code} : « ${ligne} »`).not.toMatch(/^(CAP|BTS|STMG|2de|Bac pro|Seconde|Terminale|Première)\b/);
      }
  });

  it("garde toutes les fiches : aucun épisode n'est retiré", () => {
    expect(FICHES.length).toBe(FAMILLES.flatMap((f) => f.episodes).length);
  });
});

describe("la couverture et le programme d'une formation fermée", () => {
  it("ne comptent aucun épisode", () => {
    for (const f of formationsAvecUnePage().filter((x) => !formationOuverteAuxEpisodes(x.code))) {
      for (const b of couvertureDeLaFormation(f.code))
        expect(b.situations.map((s) => s.code), `${f.code} / ${b.referentiel}`).toEqual([]);
      for (const l of tableauDeCouverture(f.code).lignes)
        expect(l.couverture?.situations ?? [], `${f.code} / ${l.bloc}`).toEqual([]);
      expect(programmeDuDiplome(f.code)!.episodes, f.code).toEqual([]);
    }
  });

  it("la page du diplôme ne montre la colonne et la section des épisodes qu'à une formation ouverte", () => {
    const page = lire("src/app/parcours/[formation]/page.tsx");
    expect(page).toMatch(/formationOuverteAuxEpisodes\(code\)/);
    expect(page).toMatch(/avecEpisodes \?/);
  });
});

/** Ce qu'un chapitre sert, recalculé ici : la formation que suit son parcours, et celles dont il cite un bloc. */
function formationsServies(code: string): Set<string> {
  const situation = SITUATIONS.find((s) => s.code === code);
  const codes = situation ? situation.reprend : [code];
  const servies = new Set<string>();
  for (const c of codes) {
    const chapitre = CHAPITRES.find((x) => x.code === c);
    if (!chapitre) continue;
    const suivie = PARCOURS.find((p) => p.code === chapitre.parcours)?.formation;
    if (suivie) servies.add(suivie);
    for (const bloc of chapitre.blocs) {
      const cite = referentielDeCitation(bloc);
      if (cite) servies.add(cite.code);
    }
  }
  return servies;
}

describe("les suites d'un chapitre (« Et ensuite »)", () => {
  it("ne proposent aucun épisode à la fin d'un chapitre écrit pour les seules formations fermées", () => {
    let fermes = 0;
    for (const c of [...CHAPITRES, ...SITUATIONS]) {
      const servies = [...formationsServies(c.code)];
      if (servies.length === 0 || servies.some(formationOuverteAuxEpisodes)) continue;
      fermes++;
      const s = suitesDuChapitre(c.code);
      expect(s.episodes, `${c.code} (${servies.join(", ")})`).toEqual([]);
      expect(s.episodesDuTheme, c.code).toBe(0);
    }
    expect(fermes, "aucun chapitre fermé : la garde ne garde rien").toBeGreaterThan(0);
  });

  it("en proposent toujours à la fin d'un chapitre qui sert une formation ouverte", () => {
    for (const c of CHAPITRES) {
      if (![...formationsServies(c.code)].some(formationOuverteAuxEpisodes)) continue;
      const s = suitesDuChapitre(c.code);
      if (s.episodesDuTheme > 0) expect(s.episodes.length, c.code).toBeGreaterThan(0);
    }
  });
});

describe("les textes qui présentent les épisodes", () => {
  it("les familles du catalogue ne s'adressent à aucun niveau fermé", () => {
    for (const f of FAMILLES) expect(f.texte, f.code).not.toMatch(NIVEAU_FERME);
  });

  it("l'offre Épisodes manager ne nomme aucun niveau fermé", () => {
    for (const code of ["episodes", "entreprise"] as const) {
      expect(LIBELLES_DU_DEVIS[code].exempleOrganisation ?? "", code).not.toMatch(NIVEAU_FERME);
      const offre = CATALOGUE_PAR_DEFAUT.offres.find((o) => o.code === code)!;
      const textes = [offre.nom, offre.sousTitre, ...offre.inclus, ...(offre.formules ?? []).flatMap((x) => [x.nom, ...x.inclus])];
      for (const t of textes) expect(t, code).not.toMatch(NIVEAU_FERME);
    }
  });

  it("les pages des épisodes en classe disent le public, et ne lisent que le registre filtré", () => {
    for (const chemin of ["src/app/enseignants/episodes/page.tsx", "src/app/enseignants/episodes/[code]/page.tsx"]) {
      const page = lire(chemin);
      expect(page, chemin).toMatch(/PUBLIC_DES_EPISODES|A_PARTIR_DE_BAC_3/);
      expect(page, chemin).not.toMatch(/FICHES_ECRITES/);
    }
  });
});

/**
 * LES ÉPISODES SANS FORMATION OUVERTE NE SONT PLUS LISTÉS (décision du propriétaire, novembre
 * 2026). Une fiche qui ne cite plus aucune formation ouverte aux épisodes ne s'annonçait plus
 * que « À partir de bac + 3 » : elle quitte la page Épisodes en classe, ses tiroirs et ses
 * compteurs, le plan du site et l'index des moteurs. Son adresse reste valide, et l'épisode
 * reste au catalogue des entreprises (formation continue).
 */
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/session", () => ({ getSession: async () => null }));
vi.mock("@/services/acces.service", () => ({ unCompteAvecEpisodes: async () => false }));
vi.mock("@/services/catalogue.service", async (original) => ({
  ...(await original<object>()),
  lireLaDecouverte: async () => ({ demos: [], niveauDesDemos: "decouverte" }),
}));

/** Les fiches sans formation ouverte, recalculées ici depuis les formations qu'elles citent. */
const sansFormationOuverte = () => FICHES.filter((f) => !f.formations.some(formationOuverteAuxEpisodes)).map((f) => f.code);

describe("les épisodes dont la fiche ne cite aucune formation ouverte", () => {
  const listees = FICHES_LISTEES;
  const retires = sansFormationOuverte();

  it("existent, et restent au registre des fiches et des épisodes", () => {
    expect(retires.length, "aucune fiche à retirer : la garde ne garde rien").toBeGreaterThan(0);
    for (const code of retires) expect(FICHES.some((f) => f.code === code), code).toBe(true);
  });

  it("le registre que la page lit ne range que les fiches qui citent une formation ouverte", () => {
    expect(listees.map((f) => f.code)).toEqual(FICHES.filter((f) => !retires.includes(f.code)).map((f) => f.code));
  });

  it("quittent la page Épisodes en classe, ses tiroirs et ses compteurs", async () => {
    const Page = (await import("@/app/enseignants/episodes/page")).default as unknown as FC;
    const html = renderToStaticMarkup(createElement(Page));
    const fiches = html.match(/Lire la fiche de l(?:&#x27;|'|’)épisode/g) ?? [];
    expect(fiches.length).toBe(FICHES.length - retires.length);
    for (const code of retires) expect(html, code).not.toContain(`/enseignants/episodes/${code}"`);
    // Plus aucune carte ne s'annonce pour le seul public de la règle.
    expect(html).not.toMatch(/Épisode\s\d+\s·\s(?:À|à)\spartir\sde\sbac/);
    // Les compteurs des tiroirs comptent ce qui est rangé.
    const comptes = [...html.matchAll(/(\d+) fiches?</g)].map((m) => Number(m[1]));
    expect(comptes.length).toBeGreaterThan(0);
    for (const n of comptes) expect(n).toBeLessThanOrEqual(FICHES.length - retires.length);
  });

  it("quittent le plan du site, et leur fiche, toujours lisible, dit noindex", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    const page = (await import("@/app/enseignants/episodes/[code]/page")) as {
      generateMetadata: (p: { params: Promise<{ code: string }> }) => Promise<Metadata>;
    };
    for (const code of retires) {
      expect(urls, code).not.toContain(`${SITE_URL}/enseignants/episodes/${code}`);
      // L'épisode lui-même reste au catalogue des entreprises.
      expect(urls, code).toContain(`${SITE_URL}/entreprises/episode/${code}`);
      const m = await page.generateMetadata({ params: Promise.resolve({ code }) });
      expect(m.title, code).not.toBe("Fiche introuvable");
      expect(m.robots, code).toMatchObject({ index: false });
    }
    for (const f of listees) {
      expect(urls, f.code).toContain(`${SITE_URL}/enseignants/episodes/${f.code}`);
      expect((await page.generateMetadata({ params: Promise.resolve({ code: f.code }) })).robots, f.code).toBeUndefined();
    }
  });

  it("aucune page publique ne les compte parmi les épisodes « à partir de bac + 3 »", () => {
    const episodes = briques().find((b) => b.code === "episodes")!;
    expect(episodes.forme).toMatch(/bac\s\+\s3/);
    expect(episodes.compte).toBe(`${FICHES.length - retires.length} épisodes`);
    // /ecoles dit combien de fiches se lisent sur la page Épisodes en classe : celles qui y sont.
    expect(lire("src/app/ecoles/page.tsx")).toMatch(/\$\{FICHES_LISTEES\.length\} fiches se lisent/);
  });
});
