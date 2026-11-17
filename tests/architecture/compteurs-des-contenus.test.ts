import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));

import { CHAPITRES, PARCOURS } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { THEMES } from "@/config/cours/themes";
import { TAILLE_DES_PARCOURS } from "@/config/cours/taille-des-parcours";
import { diplomesParNiveau } from "@/config/cours/programme";
import { ATELIERS, NOMBRE_D_ATELIERS } from "@/config/ateliers";
import { DECISIONS_PAR_EPISODE, FAMILLES, NOMBRE_D_EPISODES } from "@/config/familles-des-episodes";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { DECOUVERTE_PAR_DEFAUT } from "@/config/decouverte";
import { FORMATIONS_RETIREES, chapitrePropose } from "@/config/formations-proposees";
import { coursDeLaFormation, formationsAvecUnePage } from "@/config/couverture";
import { briques } from "@/config/articulation";
import { compterLeCatalogue, compterLesAteliers, compterLesDemos, regleDuCours, type RegistreDuCours } from "@/config/chiffres-du-site";
import {
  CHIFFRES_DU_COURS,
  REGISTRE_DU_COURS,
  chapitresDeLaTuile,
  contenusDuTheme,
  parcoursDeLaTuile,
  situationProposee,
} from "@/config/chiffres-du-cours";
import { coursOuvert } from "@/services/cours.service";

/**
 * LES COMPTEURS DES CONTENUS, CATÉGORIE PAR CATÉGORIE (chantier des compteurs, novembre 2026).
 *
 * Le site n'a pas de base pour ses contenus : chapitres, cas pratiques, ateliers et épisodes vivent
 * dans le code, sans statut brouillon ni archivé (décision du propriétaire). Les tests agissent donc
 * sur des REGISTRES DE TEST : le registre réel, copié, auquel on ajoute ou retire un contenu, et que
 * les règles de comptage (config/chiffres-du-site.ts) recomptent. Les équivalences :
 *  · publier un contenu : l'ajouter à une formation proposée ;
 *  · un brouillon : un contenu d'une formation retirée (il reste au registre, sans compter) ;
 *  · archiver : retirer sa formation (`FORMATIONS_RETIREES`).
 * Puis les sources réelles : chaque nombre publié est celui que la règle calcule sur le registre.
 */

const REEL = {
  cours: REGISTRE_DU_COURS,
  ateliers: ATELIERS,
  familles: FAMILLES,
  decouverte: DECOUVERTE_PAR_DEFAUT,
};
type Catalogue = typeof REEL;
const compter = (r: Catalogue) => compterLeCatalogue(r);
const avecLeCours = (r: Catalogue, cours: Partial<RegistreDuCours>): Catalogue => ({ ...r, cours: { ...r.cours, ...cours } });
const AVANT = compter(REEL);

/** Ce qui a changé d'un comptage à l'autre, catégorie par catégorie. */
const ecart = (apres: ReturnType<typeof compter>) =>
  Object.fromEntries(Object.entries(apres).flatMap(([k, v]) => (v === AVANT[k as keyof typeof AVANT] ? [] : [[k, v - AVANT[k as keyof typeof AVANT]]])));

const unChapitre = (code: string, parcours: string, laboratoire = false) => ({
  code,
  parcours,
  etapes: [{ type: laboratoire ? "simulation" : "question" }],
});

// Un parcours proposé qui suit un diplôme, et un parcours d'une formation retirée.
const PROPOSE = PARCOURS.find((p) => p.code === "ndrc")!;
const RETIRE = PARCOURS.find((p) => p.formation && FORMATIONS_RETIREES.has(p.formation))!;
const UN_CHAPITRE_PROPOSE = CHAPITRES.find((c) => c.parcours === PROPOSE.code)!;

describe("0. la règle de comptage est celle de l'offre, et le registre réel donne les nombres publiés", () => {
  it("un chapitre et un cas comptent exactement quand l'offre les propose", () => {
    const regle = regleDuCours(REGISTRE_DU_COURS);
    for (const c of CHAPITRES) expect(regle.chapitrePropose(c), c.code).toBe(chapitrePropose(c));
    for (const s of SITUATIONS) expect(regle.situationProposee(s), s.code).toBe(situationProposee(s));
    expect(PROPOSE.formation).toBeTruthy();
    expect(RETIRE).toBeDefined();
  });

  it("les nombres du registre réel sont ceux que les sources publient", () => {
    expect(AVANT).toEqual({
      chapitres: CHIFFRES_DU_COURS.chapitres,
      avecLaboratoire: CHIFFRES_DU_COURS.avecLaboratoire,
      casPratiques: CHIFFRES_DU_COURS.casPratiques,
      ateliers: NOMBRE_D_ATELIERS,
      episodes: NOMBRE_D_EPISODES,
      demos: DECOUVERTE_PAR_DEFAUT.demos.length,
    });
    // Le registre filtré n'est pas le registre entier : sinon la règle ne prouverait rien.
    expect(AVANT.chapitres).toBeLessThan(CHAPITRES.length);
    expect(AVANT.casPratiques).toBeLessThan(SITUATIONS.length);
  });
});

describe("1. chapitres", () => {
  it("ajouter un chapitre à une formation proposée augmente le compteur des chapitres, et lui seul", () => {
    const apres = compter(avecLeCours(REEL, { chapitres: [...CHAPITRES, unChapitre("chapitre-de-test", PROPOSE.code)] }));
    expect(ecart(apres)).toEqual({ chapitres: 1 });
  });

  it("avec son laboratoire, il compte aussi parmi les chapitres qui en ont un", () => {
    const apres = compter(avecLeCours(REEL, { chapitres: [...CHAPITRES, unChapitre("chapitre-de-test", PROPOSE.code, true)] }));
    expect(ecart(apres)).toEqual({ chapitres: 1, avecLaboratoire: 1 });
  });

  it("un chapitre d'une formation retirée (l'équivalent du brouillon) ne change aucun compteur public", () => {
    const chapitre = unChapitre("chapitre-retire-de-test", RETIRE.code, true);
    const cas = { code: "cas-retire-de-test", reprend: [chapitre.code] };
    const apres = compter(avecLeCours(REEL, { chapitres: [...CHAPITRES, chapitre], situations: [...SITUATIONS, cas] }));
    expect(ecart(apres)).toEqual({});
  });

  it("retirer une formation (l'équivalent de l'archivage) fait baisser les compteurs de ses chapitres et de leurs cas", () => {
    const formation = PROPOSE.formation!;
    // Le recompte attendu, à la main : les chapitres des parcours de cette formation (ou de ses options).
    const parcoursRetires = new Set(PARCOURS.filter((p) => p.formation === formation).map((p) => p.code));
    const chapitresRetires = new Set(CHAPITRES.filter((c) => parcoursRetires.has(c.parcours)).map((c) => c.code));
    const casRetires = SITUATIONS.filter((s) => situationProposee(s) && s.reprend.some((c) => chapitresRetires.has(c)));
    expect(chapitresRetires.size).toBeGreaterThan(0);
    const apres = compter(avecLeCours(REEL, { formationsRetirees: new Set([...FORMATIONS_RETIREES, formation]) }));
    expect(apres.chapitres).toBe(AVANT.chapitres - chapitresRetires.size);
    expect(apres.casPratiques).toBe(AVANT.casPratiques - casRetires.length);
    expect(apres.ateliers).toBe(AVANT.ateliers);
    expect(apres.episodes).toBe(AVANT.episodes);
  });

  it("un chapitre servi par plusieurs diplômes compte une fois", () => {
    // Au registre : la somme des pages des diplômes dépasse le total, l'union le vaut.
    const pages = formationsAvecUnePage().map((f) => coursDeLaFormation(f.code).flatMap((g) => g.chapitres.map((c) => c.code)));
    expect(pages.reduce((n, p) => n + p.length, 0)).toBeGreaterThan(CHIFFRES_DU_COURS.chapitres);
    expect(new Set(pages.flat()).size).toBe(CHIFFRES_DU_COURS.chapitres);
    // Dans un registre de test : le même chapitre écrit deux fois compte pour un.
    const apres = compter(avecLeCours(REEL, { chapitres: [...CHAPITRES, UN_CHAPITRE_PROPOSE] }));
    expect(ecart(apres)).toEqual({});
  });
});

describe("2. cas pratiques", () => {
  it("ajouter un cas pratique n'augmente que le compteur des cas", () => {
    const apres = compter(avecLeCours(REEL, { situations: [...SITUATIONS, { code: "cas-de-test", reprend: [UN_CHAPITRE_PROPOSE.code] }] }));
    expect(ecart(apres)).toEqual({ casPratiques: 1 });
  });

  it("un cas lié à plusieurs chapitres et plusieurs notions compte une fois", () => {
    const plusieurs = CHAPITRES.filter(chapitrePropose).slice(0, 4).map((c) => c.code);
    const cas = { code: "cas-de-synthese-de-test", reprend: plusieurs };
    const apres = compter(avecLeCours(REEL, { situations: [...SITUATIONS, cas, cas] }));
    expect(ecart(apres)).toEqual({ casPratiques: 1 });
  });

  it("un cas qui reprend un chapitre retiré ne compte pas", () => {
    const retire = CHAPITRES.find((c) => c.parcours === RETIRE.code)!;
    const apres = compter(avecLeCours(REEL, { situations: [...SITUATIONS, { code: "cas-de-test", reprend: [UN_CHAPITRE_PROPOSE.code, retire.code] }] }));
    expect(ecart(apres)).toEqual({});
  });
});

describe("3. ateliers", () => {
  it("un atelier de plusieurs séances compte pour un", () => {
    const seances = ATELIERS.reduce((n, a) => n + a.seances.length, 0);
    expect(seances).toBeGreaterThan(ATELIERS.length);
    expect(NOMBRE_D_ATELIERS).toBe(ATELIERS.length);
    expect(compterLesAteliers([{ code: "atelier-de-test", seances: [1, 2, 3, 4, 5, 6, 7] } as { code: string }])).toBe(1);
    const apres = compter({ ...REEL, ateliers: [...ATELIERS, { ...ATELIERS[0]!, code: "atelier-de-test" }] });
    expect(ecart(apres)).toEqual({ ateliers: 1 });
  });
});

describe("4. épisodes manager", () => {
  it("un épisode de six décisions compte pour un, et le nom des pages vaut le registre", () => {
    for (const e of EPISODES) expect(e.etapes.length, e.code).toBe(DECISIONS_PAR_EPISODE);
    expect(NOMBRE_D_EPISODES).toBe(EPISODES.length);
    expect(NOMBRE_D_EPISODES).not.toBe(EPISODES.length * DECISIONS_PAR_EPISODE);
    const apres = compter({ ...REEL, familles: [...FAMILLES, { ...FAMILLES[0]!, code: "famille-de-test", episodes: ["episode-de-test"] }] });
    expect(ecart(apres)).toEqual({ episodes: 1 });
  });

  it("un épisode rangé dans deux familles compte une fois", () => {
    const apres = compter({ ...REEL, familles: [...FAMILLES, { ...FAMILLES[0]!, code: "famille-de-test", episodes: [FAMILLES[0]!.episodes[0]!] }] });
    expect(ecart(apres)).toEqual({});
  });
});

describe("5. démonstrations", () => {
  it("le nombre suit le réglage de la Découverte, pas la constante du code", () => {
    expect(compterLesDemos({ demos: ["client-qui-s-en-va", "lits-vides"] })).toBe(2);
    expect(ecart(compter({ ...REEL, decouverte: { ...DECOUVERTE_PAR_DEFAUT, demos: ["lits-vides"] } }))).toEqual({ demos: -(AVANT.demos - 1) });
    const page = readFileSync(join(process.cwd(), "src/app/entreprises/offre/page.tsx"), "utf8");
    expect(page).toContain("demos={compterLesDemos(decouverte)}");
  });

  it("la phrase de /entreprises/offre dit le nombre réglé", async () => {
    const { OffreDesEntreprises } = (await import("@/components/offre-des-entreprises")) as unknown as {
      OffreDesEntreprises: ComponentType<Record<string, unknown>>;
    };
    const rendre = (demos: number) =>
      renderToStaticMarkup(createElement(OffreDesEntreprises, { colonnes: [], tarif: null, demos }))
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
    expect(rendre(3)).toContain("3 épisodes de démonstration se jouent gratuitement");
    expect(rendre(1)).toContain("1 épisode de démonstration se joue gratuitement");
    expect(rendre(0)).not.toMatch(/démonstration/);
  });
});

describe("6. un contenu sous licence compte au catalogue, sans s'ouvrir au visiteur", () => {
  it("un chapitre réservé compte, mais coursOuvert le refuse à un visiteur sans licence ; un libre s'ouvre", async () => {
    const reserves = CHAPITRES.filter((c) => chapitrePropose(c) && !c.libre);
    const libres = CHAPITRES.filter((c) => chapitrePropose(c) && c.libre);
    expect(reserves.length + libres.length).toBe(CHIFFRES_DU_COURS.chapitres);
    expect(reserves.length).toBeGreaterThan(libres.length);
    for (const c of reserves.slice(0, 5)) expect(await coursOuvert({}, c), c.code).toBe(false);
    for (const c of libres) expect(await coursOuvert({}, c), c.code).toBe(true);
  });
});

describe("7. l'accueil et /cours affichent les mêmes totaux", () => {
  it("les briques (accueil et /cours), le catalogue par thème et sa phrase lisent la même source", () => {
    const [cours, cas] = briques();
    expect(cours!.compte).toBe(`${CHIFFRES_DU_COURS.chapitres} chapitres`);
    expect(cas!.compte).toBe(`${CHIFFRES_DU_COURS.casPratiques} cas pratiques`);
    const themes = THEMES.map((t) => contenusDuTheme(t));
    expect(themes.reduce((n, t) => n + t.nombreDeChapitres, 0)).toBe(CHIFFRES_DU_COURS.chapitres);
    expect(themes.reduce((n, t) => n + t.nombreDeCas, 0)).toBe(CHIFFRES_DU_COURS.casPratiques);
    const page = readFileSync(join(process.cwd(), "src/app/cours/page.tsx"), "utf8");
    expect(page).toContain("{CHIFFRES_DU_COURS.chapitres} chapitres en {THEMES.length} thèmes");
    expect(page).toContain("contenusDuTheme(theme)");
    for (const f of ["src/components/accueil-formats.tsx", "src/components/articulation-du-cours.tsx"]) {
      expect(readFileSync(join(process.cwd(), f), "utf8"), f).toMatch(/briques\(\)/);
    }
  });

  it("un thème compte ses chapitres proposés, et les cas dont le premier chapitre y est rangé", () => {
    for (const t of THEMES) {
      const n = contenusDuTheme(t);
      const proposes = t.chapitres.filter((code) => chapitrePropose(CHAPITRES.find((c) => c.code === code)!));
      expect(n.nombreDeChapitres, t.code).toBe(proposes.length);
      for (const s of n.casDeSynthese) expect(situationProposee(s), s.code).toBe(true);
    }
  });
});

describe("8. les tuiles des diplômes sur /cours", () => {
  const tuiles = diplomesParNiveau().flatMap((g) => g.formations);

  it("chaque tuile dit le nombre de chapitres du parcours qu'une classe de ce diplôme peut choisir", () => {
    for (const f of tuiles) {
      const parcours = parcoursDeLaTuile(f.code);
      expect(parcours, `${f.code} : aucun parcours à choisir`).not.toBeNull();
      expect(chapitresDeLaTuile(f.code), f.code).toBe(TAILLE_DES_PARCOURS[parcours!]!.chapitres);
    }
    // Le BTS NDRC : 15, le parcours « ndrc », et non les 16 de sa page.
    expect(chapitresDeLaTuile("bts-ndrc")).toBe(15);
    expect(coursDeLaFormation("bts-ndrc").reduce((n, g) => n + g.chapitres.length, 0)).toBe(16);
  });

  it("une option est fondue dans la tuile de son diplôme", () => {
    const options = tuiles.filter((f) => f.optionDe);
    expect(options.map((f) => f.code)).toEqual(["bts-mhr-bc"]);
    for (const o of options) expect(parcoursDeLaTuile(o.code)).toBe(parcoursDeLaTuile(o.optionDe!));
    const page = readFileSync(join(process.cwd(), "src/app/cours/page.tsx"), "utf8");
    expect(page).toContain(".filter((f) => !f.optionDe)");
    expect(page).toContain("chapitresDeLaTuile(f.code)");
  });
});

/**
 * 9. LE CACHE. Les compteurs de contenus sont des constantes des modules, calculées au chargement à
 * partir des registres du code : ils ne changent qu'avec un déploiement, qui reconstruit tout. Relevé
 * sur le build (next build, colonne « Route ») : toutes les pages qui les affichent sont rendues à la
 * demande (ƒ), y compris celles qui déclarent `revalidate = 300` ; seule l'image de partage
 * (/opengraph-image) est rendue au build (○), et elle relit la même constante. Le seul nombre lu en
 * base est celui des démonstrations : le catalogue est en cache (`unstable_cache`, étiquette
 * « catalogue »), invalidé par chaque enregistrement de /admin/offres, qui revalide aussi
 * /entreprises/offre (app/admin/offres/actions.ts).
 */
const RENDU_DES_PAGES: Record<string, string> = {
  "page.tsx": "export const revalidate = 300;",
  "cours/page.tsx": 'export const dynamic = "force-dynamic";',
  "tarifs/page.tsx": "export const revalidate = 300;",
  "entreprises/offre/page.tsx": "export const revalidate = 300;",
  "entreprises/episode/page.tsx": 'export const dynamic = "force-dynamic";',
  "orientation/page.tsx": "export const revalidate = 300;",
  "lycees/page.tsx": "export const revalidate = 300;",
  "enseignants/page.tsx": "",
  "ecoles/page.tsx": "",
  "fonctionnalites/page.tsx": "",
  "entreprises/page.tsx": "",
  "animations/page.tsx": "",
  "parcours/page.tsx": "",
};

const SRC = join(process.cwd(), "src");
const fichiers = (dossier: string): string[] =>
  readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.tsx?$/.test(nom) ? [chemin] : [];
  });
const CONTENU = /^config\/cours\/(chapitres|situations|monde|bureaux|enquetes|scenarios)\//;
const sansCommentaires = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !/^\s*(\*|\/\/|\{\/\*)/.test(l))
    .join("\n");

describe("9. le cache, et aucune valeur figée à la main", () => {
  it("chaque page qui affiche ces nombres déclare le rendu documenté", () => {
    for (const [page, attendu] of Object.entries(RENDU_DES_PAGES)) {
      const declare = readFileSync(join(SRC, "app", page), "utf8")
        .split("\n")
        .filter((l) => /^export const (revalidate|dynamic)\b/.test(l))
        .join("\n");
      expect(declare, page).toBe(attendu);
    }
    expect(readFileSync(join(SRC, "app/admin/offres/actions.ts"), "utf8")).toContain('"/entreprises/offre"');
  });

  it("aucun fichier publié n'écrit à la main un nombre de chapitres, de cas, d'ateliers ou d'épisodes", () => {
    const FIGE = /\b\d{2,} (chapitres|cas pratiques|ateliers|épisodes|démonstrations|formations)\b/;
    const fautifs = fichiers(SRC)
      .filter((f) => !CONTENU.test(relative(SRC, f)))
      .filter((f) => FIGE.test(sansCommentaires(readFileSync(f, "utf8"))))
      .map((f) => relative(SRC, f));
    expect(fautifs).toEqual([]);
  });
});
