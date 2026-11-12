import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));

import { DevisForm, type OffreDuFormulaire } from "@/components/devis-form";
import { ChapitreReserve } from "@/components/cours/chapitre-reserve";
import { demandeLeParcoursAuDevis } from "@/config/catalogue";
import { PARCOURS_DU_DEVIS, parcoursDuDevis } from "@/config/cours/devis-du-cours";
import { parcoursDuContenu } from "@/config/cours/devis-du-contenu";
import {
  CE_QU_EST_UN_PARCOURS,
  CHAPITRES_DES_PARCOURS_DE_FORMATION,
  PARCOURS_PROPOSES_A_CHOISIR,
  codesDesGroupes,
  parcoursDuDiplome,
  parcoursRangesParDiplome,
} from "@/config/cours/parcours-de-formation";
import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { vueDOrientation } from "@/config/orientation";
import { lienDuDevisDuCours, parametrageRequisAuDevis, parcoursRequisAuDevis, SOURCE_DU_COURS } from "@/config/parametrage-du-devis";
import { CATALOGUE_PAR_DEFAUT, ENTREPRISES, NIVEAUX_DE_L_ARENE } from "@/config/tarifs";

/**
 * LE DEVIS DEMANDE LE DIPLÔME OU LE PARCOURS (audit produit du 10 novembre 2026, P1-4).
 *
 * Le devis ne demandait ni le diplôme ni le parcours, et imposait sous Classe une entreprise et un
 * niveau de l'arène à l'enseignant qui voulait le cours : « l'enseignant de STMG qui veut le cours doit
 * choisir “NOVA, niveau 3” sans savoir pourquoi, et le vendeur ne reçoit pas l'information dont il a
 * besoin pour attribuer les parcours ». Ce que cette garde tient, sans base :
 *  · la liste est celle que l'enseignant voit en créant sa classe, rangée par diplôme, le cours du
 *    diplôme en premier, chaque entrée avec son nombre de chapitres et les diplômes qu'elle sert
 *    (décision du propriétaire, 11 novembre 2026), et une phrase dit ce qu'est un parcours ;
 *  · elle paraît pour les offres qui ouvrent le cours à une école (Classe, Programme, Campus), facultative ;
 *  · une demande qui vient du cours la trouve préremplie quand le diplôme est connu (le cours de ce
 *    diplôme, depuis sa page), et n'exige ni entreprise ni niveau ; le chapitre réservé, l'aide au
 *    choix et la classe du cours sans offre y mènent.
 * Le côté serveur (demande enregistrée, courriels) : tests/integration/devis-du-diplome.test.ts.
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), "src", chemin), "utf8");
const texte = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/\s+/g, " ");

const BASE = { organisation: "École ou établissement", exempleOrganisation: "", identifiant: "UAI (facultatif)" };
const OFFRES: OffreDuFormulaire[] = [
  { code: "classe", offre: "Offre Classe", ...BASE, entreprise: true, niveau: true, parcours: true },
  { code: "programme", offre: "Offre Programme", ...BASE, entreprise: true, effectif: "Enseignants", parcours: true },
  { code: "episodes", offre: "Épisodes manager", ...BASE, effectif: "Enseignants" },
];
const PROPS = {
  offres: OFFRES,
  offreInitiale: "classe",
  entreprises: ENTREPRISES.map((e) => ({ code: e.code, nom: e.nom })),
  niveaux: NIVEAUX_DE_L_ARENE,
  vendeur: "V",
  mentionTva: "TVA",
  contact: "c@x.test",
  parcours: PARCOURS_DU_DEVIS,
  ceQuEstUnParcours: CE_QU_EST_UN_PARCOURS,
};
const rendu = (props: Partial<Parameters<typeof DevisForm>[0]> = {}) => renderToStaticMarkup(createElement(DevisForm, { ...PROPS, ...props }));
const REQUIS = (nom: string) => new RegExp(`<select[^>]*required[^>]*name="${nom}"|<select[^>]*name="${nom}"[^>]*required`);

describe("la liste : les parcours que l'enseignant voit en créant sa classe", () => {
  it("rangés par diplôme, le cours du diplôme en premier, chacun avec son nombre de chapitres et les diplômes qu'il sert", () => {
    expect(PARCOURS_DU_DEVIS).toEqual(parcoursRangesParDiplome());
    // Chaque parcours proposé, une fois.
    const codes = codesDesGroupes(PARCOURS_DU_DEVIS);
    expect([...codes].sort()).toEqual(PARCOURS_PROPOSES_A_CHOISIR.map((p) => p.code).sort());
    expect(new Set(codes).size).toBe(codes.length);
    // Un groupe par diplôme, le cours du diplôme en premier ; les matières à la fin.
    expect(PARCOURS_DU_DEVIS.slice(0, 2).map((g) => g.libelle)).toEqual(["STMG", "BTS CG"]);
    expect(PARCOURS_DU_DEVIS.at(-1)!.cle).toBe("matieres");
    for (const g of PARCOURS_DU_DEVIS.slice(0, -1)) {
      const leCours = parcoursDuDiplome(g.cle);
      if (leCours) expect(g.parcours[0]!.code, g.cle).toBe(leCours);
    }
    expect(PARCOURS_DU_DEVIS[0]!.parcours.map((p) => p.code)).toEqual(["bac-stmg", "stmg", "stmg-gf", "stmg-rh", "stmg-sig", "stmg-management"]);
    expect(PARCOURS_DU_DEVIS[1]!.parcours[0]!.libelle).toMatch(/^BTS CG · Le cours du diplôme · \d+ chapitres$/);
    expect(PARCOURS_DU_DEVIS.at(-1)!.parcours.find((p) => p.code === "comptabilite-generale")!.libelle).toMatch(
      /^Comptabilité générale · \d+ chapitres · BTS CG, DCG/,
    );
    for (const p of PARCOURS_DU_DEVIS.flatMap((g) => g.parcours)) expect(p.libelle, p.code).toMatch(/ · \d+ chapitres?( · |$)/);
    // La même liste à la création d'une classe (/teacher/cours) et sur la page d'une classe héritée.
    expect(lire("app/teacher/cours/page.tsx")).toMatch(/parcoursRangesParDiplome\(aChoisir\.map/);
    expect(lire("app/teacher/cours/[id]/page.tsx")).toMatch(/parcoursRangesParDiplome\(\s*PARCOURS_PROPOSES_A_CHOISIR\.filter/);
  });

  it("le formulaire la reçoit du serveur et n'importe pas le registre du cours", () => {
    const formulaire = lire("components/devis-form.tsx");
    expect(formulaire).not.toMatch(/from "@\/config\/cours/);
    expect(formulaire).not.toMatch(/from "@\/config\/tarifs"/);
    const page = lire("app/devis/page.tsx");
    expect(page).toContain("parcours={PARCOURS_DU_DEVIS}");
    expect(page).toContain("demandeLeParcoursAuDevis(o)");
    expect(page).toContain("parcoursDuDevis(parcours, diplome)");
  });
});

describe("quelles offres le demandent", () => {
  it("celles qui ouvrent le cours à une école : Classe, Programme, Campus", () => {
    const demandent = CATALOGUE_PAR_DEFAUT.offres.filter(demandeLeParcoursAuDevis).map((o) => o.code);
    expect(demandent).toEqual(["classe", "programme", "campus"]);
  });

  it("le champ paraît pour elles, facultatif, et seulement pour elles", () => {
    const classe = rendu();
    expect(classe).toContain('data-champ-devis="parcours"');
    expect(texte(classe)).toContain("Le diplôme ou le parcours");
    expect(classe).not.toMatch(REQUIS("parcours"));
    expect(texte(classe)).toContain("Facultatif : il dit à l'équipe pour quel diplôme préparer le cours.");
    // Les options : « À préciser plus tard », puis la liste, dans l'ordre, un groupe par diplôme.
    const options = [...classe.matchAll(/<select[^>]*name="parcours"[\s\S]*?<\/select>/g)][0]![0];
    const valeurs = [...options.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]);
    expect(valeurs).toEqual(["", ...codesDesGroupes(PARCOURS_DU_DEVIS)]);
    expect(options).toContain(">À préciser plus tard<");
    expect([...options.matchAll(/<optgroup label="([^"]*)"/g)].map((m) => m[1])).toEqual(PARCOURS_DU_DEVIS.map((g) => g.libelle));
    for (const p of PARCOURS_DU_DEVIS.flatMap((g) => g.parcours)) expect(texte(options)).toContain(p.libelle);
    // Et la phrase qui dit ce qu'est un parcours, liée au champ.
    expect(texte(classe)).toContain(CE_QU_EST_UN_PARCOURS);
    expect(classe).toMatch(/<select[^>]*aria-describedby="ce-qu-est-un-parcours"[^>]*name="parcours"|<select[^>]*name="parcours"[^>]*aria-describedby="ce-qu-est-un-parcours"/);
    expect(rendu({ offreInitiale: "programme" })).toContain('data-champ-devis="parcours"');
    expect(rendu({ offreInitiale: "episodes" })).not.toContain('name="parcours"');
  });

  it("ailleurs, le formulaire ne change pas : Classe exige toujours entreprise et niveau", () => {
    const classe = rendu();
    expect(classe).toMatch(REQUIS("entreprise"));
    expect(classe).toMatch(REQUIS("niveau"));
    expect(classe).not.toContain('name="source"');
    expect(parametrageRequisAuDevis({ entreprise: true, niveau: true })).toBe(true);
    expect(parametrageRequisAuDevis({ entreprise: true, niveau: true }, "tarifs")).toBe(true);
  });
});

describe("une demande qui vient du cours", () => {
  it("préremplit le parcours, et n'exige ni l'entreprise ni le niveau", () => {
    const html = rendu({ parcoursInitial: "stmg-gf", source: SOURCE_DU_COURS });
    expect(html).toMatch(/<option value="stmg-gf" selected/);
    expect(html).not.toMatch(REQUIS("entreprise"));
    expect(html).not.toMatch(REQUIS("niveau"));
    expect(texte(html)).toContain("Facultatif : un choix pédagogique que l'équipe pourra faire.");
    expect(html).toMatch(/<input type="hidden" name="source" value="cours"\/>/);
    expect(parametrageRequisAuDevis({ entreprise: true, niveau: true }, SOURCE_DU_COURS)).toBe(false);
    // Après un refus, la saisie l'emporte sur le préremplissage.
    const apres = rendu({
      parcoursInitial: "stmg-gf",
      source: SOURCE_DU_COURS,
      initial: { error: "x", champ: "email", ok: null, values: { offre: "classe", parcours: "mco" } },
    });
    expect(apres).toMatch(/<option value="mco" selected/);
  });

  it("sous Classe, exige le diplôme ou le parcours (décision du propriétaire du 11 novembre 2026)", () => {
    const html = rendu({ source: SOURCE_DU_COURS });
    expect(html).toMatch(REQUIS("parcours"));
    const options = [...html.matchAll(/<select[^>]*name="parcours"[\s\S]*?<\/select>/g)][0]![0];
    expect(options).toMatch(/<option value="" disabled=""[^>]*>Choisir le diplôme ou le parcours<\/option>/);
    expect(texte(html)).not.toContain("Facultatif : il dit à l'équipe pour quel diplôme préparer le cours.");
    // Prérempli, il reste exigé : l'enseignant peut en changer, pas le vider.
    expect(rendu({ parcoursInitial: "stmg-gf", source: SOURCE_DU_COURS })).toMatch(REQUIS("parcours"));
    // Facultatif partout ailleurs : Programme venu du cours (Campus n'est pas dans ce formulaire de
    // test ; la règle le dit plus bas), et Classe depuis /tarifs.
    const programme = rendu({ offreInitiale: "programme", source: SOURCE_DU_COURS });
    expect(programme).not.toMatch(REQUIS("parcours"));
    expect(texte(programme)).toContain("Facultatif : il dit à l'équipe pour quel diplôme préparer le cours.");
    expect(rendu()).not.toMatch(REQUIS("parcours"));
    expect(parcoursRequisAuDevis("classe", SOURCE_DU_COURS)).toBe(true);
    expect(parcoursRequisAuDevis("classe", null)).toBe(false);
    expect(parcoursRequisAuDevis("classe", "tarifs")).toBe(false);
    expect(parcoursRequisAuDevis("programme", SOURCE_DU_COURS)).toBe(false);
    expect(parcoursRequisAuDevis("campus", SOURCE_DU_COURS)).toBe(false);
  });

  it("l'adresse : l'offre Classe, la source, et le parcours s'il est connu", () => {
    expect(lienDuDevisDuCours()).toBe("/devis?offre=classe&source=cours");
    expect(lienDuDevisDuCours(null)).toBe("/devis?offre=classe&source=cours");
    expect(lienDuDevisDuCours("stmg-gf")).toBe("/devis?offre=classe&source=cours&parcours=stmg-gf");
  });

  it("`?parcours=` tel quel ; `?diplome=` : le cours du diplôme, sinon le parcours d'un diplôme qui n'en a qu'un, sinon rien", () => {
    expect(parcoursDuDevis("stmg-gf")).toBe("stmg-gf");
    expect(parcoursDuDevis("stmg")).toBe("stmg");
    expect(parcoursDuDevis("stmg-gf", "bts-mco")).toBe("stmg-gf");
    expect(parcoursDuDevis(null, "but-gea")).toBe("but-gea");
    expect(parcoursDuDevis(null, "bts-mco")).toBe("mco");
    // Le cours du diplôme (décision du propriétaire, 11 novembre 2026) : le DSCG en entier, et non
    // plus « DSCG · Finance » ; le bac STMG et le BTS CG ont le leur. Le code du diplôme STMG est aussi
    // celui du parcours de mercatique : comme diplôme, il vaut le cours du bac STMG.
    expect(parcoursDuDevis(undefined, "dscg")).toBe("dscg");
    expect(parcoursDuDevis(null, "stmg")).toBe("bac-stmg");
    expect(parcoursDuDevis(null, "bts-cg")).toBe("bts-cg");
    expect(parcoursDuDevis(null, "bts-mhr-bc")).toBe("bts-mhr");
    // Un parcours passé comme diplôme vaut ce parcours.
    expect(parcoursDuDevis(null, "stmg-gf")).toBe("stmg-gf");
    // Inconnu, retiré, ou mal formé : ignoré.
    expect(parcoursDuDevis("inconnu")).toBeNull();
    expect(parcoursDuDevis("seconde-mg")).toBeNull();
    expect(parcoursDuDevis(null, "seconde-mg")).toBeNull();
    expect(parcoursDuDevis(null, "inconnu")).toBeNull();
    expect(parcoursDuDevis(["stmg-gf"], ["bts-mco"])).toBeNull();
    expect(parcoursDuDevis(undefined)).toBeNull();
    expect(parcoursDuDevis("", "")).toBeNull();
  });

  it("depuis un contenu réservé : le parcours du diplôme d'où l'on vient, sinon le sien", () => {
    const gf = CHAPITRES.find((c) => c.parcours === "stmg-gf")!;
    expect(parcoursDuContenu(gf)).toBe("stmg-gf");
    // Depuis la page du bac STMG, le cours du bac STMG (décision du propriétaire, 11 novembre 2026).
    expect(parcoursDuContenu(gf, "stmg")).toBe("bac-stmg");
    // Depuis la page du BTS CG, deux chapitres de deux matières mènent au même parcours, celui du BTS CG.
    const ecarts = CHAPITRES.find((c) => c.code === "analyse-des-ecarts")!;
    const cloture = CHAPITRES.find((c) => c.parcours === "comptabilite-generale" && CHAPITRES_DES_PARCOURS_DE_FORMATION["bts-cg"]!.includes(c.code))!;
    expect(parcoursDuContenu(ecarts, "bts-cg")).toBe("bts-cg");
    expect(parcoursDuContenu(ecarts)).toBe("controle-de-gestion");
    expect(parcoursDuContenu(cloture, "bts-cg")).toBe("bts-cg");
    expect(parcoursDuContenu(cloture)).toBe("comptabilite-generale");
    // Un chapitre de comptabilité générale que le BUT GEA regroupe : depuis la page du BUT GEA, le BUT GEA.
    const gea = CHAPITRES.find((c) => c.parcours === "comptabilite-generale" && CHAPITRES_DES_PARCOURS_DE_FORMATION["but-gea"]!.includes(c.code))!;
    expect(parcoursDuContenu(gea)).toBe("comptabilite-generale");
    expect(parcoursDuContenu(gea, "but-gea")).toBe("but-gea");
    // Un diplôme qui ne l'ouvre pas ne change rien.
    expect(parcoursDuContenu(gea, "bts-mco")).toBe("comptabilite-generale");
    // Chaque chapitre et chaque cas proposé mène à un parcours de la liste, ou à aucun.
    const codes = new Set(codesDesGroupes(PARCOURS_DU_DEVIS));
    for (const c of [...CHAPITRES, ...SITUATIONS]) {
      const p = parcoursDuContenu(c);
      if (p !== null) expect(codes.has(p), c.code).toBe(true);
    }
  });

  it("le chapitre réservé, ses cas, l'aide au choix et la classe du cours sans offre y mènent", () => {
    const reserve = renderToStaticMarkup(
      createElement(ChapitreReserve, {
        titre: "T",
        reserve: "Ce chapitre est réservé",
        essai: { href: "/cours/x", titre: "X", sigle: null },
        eleve: null,
        devis: lienDuDevisDuCours("stmg-gf"),
      }),
    );
    expect(reserve).toContain('href="/devis?offre=classe&amp;source=cours&amp;parcours=stmg-gf"');
    expect(texte(reserve)).toContain("Demander un devis");
    // Sans parcours connu, la demande vient quand même du cours.
    const sansParcours = renderToStaticMarkup(
      createElement(ChapitreReserve, { titre: "T", reserve: "R", essai: { href: "/cours/x", titre: "X", sigle: null }, eleve: null }),
    );
    expect(sansParcours).toContain('href="/devis?offre=classe&amp;source=cours"');
    expect(lire("app/cours/[chapitre]/page.tsx")).toContain("devis={lienDuDevisDuCours(parcoursDuContenu(chapitre, diplomeDeLAdresse(diplome)))}");
    for (const [page, contenu] of [
      ["app/cours/enquete/[code]/page.tsx", "enquete"],
      ["app/cours/bureau/[code]/page.tsx", "bureau"],
      ["app/cours/scenario/[code]/page.tsx", "scenario"],
    ]) {
      expect(lire(page!), page).toContain(`devis={lienDuDevisDuCours(parcoursDuContenu(${contenu}))}`);
    }
    expect(lire("components/orientation-form.tsx")).toContain("href={lienDuDevisDuCours(vue.parcoursDuCours[diplome])}");
    expect(lire("app/teacher/cours/page.tsx")).toContain("href={lienDuDevisDuCours()}");
    expect(lire("app/teacher/cours/[id]/page.tsx")).toContain("href={lienDuDevisDuCours(classe.parcours)}");
  });

  it("l'aide au choix connaît le parcours d'un diplôme quand il n'en a qu'un", () => {
    const vue = vueDOrientation();
    const codes = new Set(codesDesGroupes(PARCOURS_DU_DEVIS));
    const valeurs = Object.entries(vue.parcoursDuCours);
    expect(valeurs.length).toBeGreaterThan(0);
    for (const [atelier, parcours] of valeurs) {
      expect(vue.diplomes.some((d) => d.code === atelier), atelier).toBe(true);
      expect(codes.has(parcours), `${atelier} : ${parcours}`).toBe(true);
    }
  });
});

describe("l'équipe lit le parcours là où elle lit les devis", () => {
  it("dans la liste des demandes de /admin, sous son nom", () => {
    const admin = lire("app/admin/page.tsx");
    expect(admin).toMatch(/\{d\.parcours \? \([\s\S]{0,120}\{LIBELLE_DU_PARCOURS\}[\s\S]{0,120}\{titreDuParcours\(d\.parcours\) \?\? d\.parcours\}/);
  });
});

/**
 * LE DEVIS NE CHARGE PAS LE COURS. La liste des parcours vit sans les chapitres
 * (config/cours/parcours.ts, config/cours/parcours-a-choisir.ts). Tirée du registre, elle ajoutait à
 * la première demande de devis le chargement de tous les chapitres (près d'une demi-seconde
 * mesurée, le registre compilé pèse plus de dix mégaoctets) : la recette du code promo, qui attend
 * le refus en une seconde, échouait. La page du devis, son action, le service des devis et l'aide au
 * choix n'atteignent donc pas le registre, même de proche en proche.
 */
describe("le devis ne charge pas le registre du cours", () => {
  const SRC = join(process.cwd(), "src");
  const REGISTRE = join(SRC, "config", "cours", "registre.ts");
  /** Les imports qui chargent du code (pas les `import type`), résolus en fichiers. */
  function importsDe(fichier: string): string[] {
    const source = readFileSync(fichier, "utf8");
    const chemins: string[] = [];
    for (const m of source.matchAll(/^(?:import|export)\s+(?!type\b)[\s\S]*?\sfrom\s+"([^"]+)"/gm)) chemins.push(m[1]!);
    for (const m of source.matchAll(/^import\s+"([^"]+)"/gm)) chemins.push(m[1]!);
    return chemins.flatMap((c) => {
      const base = c.startsWith("@/") ? join(SRC, c.slice(2)) : c.startsWith(".") ? resolve(dirname(fichier), c) : null;
      if (!base) return [];
      const candidat = [`${base}.ts`, `${base}.tsx`, join(base, "index.ts")].find((x) => existsSync(x));
      return candidat ? [candidat] : [];
    });
  }
  /** Le premier chemin d'imports qui atteint le registre, ou rien. */
  function cheminVersLeRegistre(depart: string): string[] | null {
    const vus = new Set<string>();
    const pile: string[][] = [[join(SRC, depart)]];
    while (pile.length) {
      const chemin = pile.pop()!;
      const ici = chemin.at(-1)!;
      if (ici === REGISTRE) return chemin.map((x) => relative(SRC, x));
      if (vus.has(ici)) continue;
      vus.add(ici);
      for (const suivant of importsDe(ici)) pile.push([...chemin, suivant]);
    }
    return null;
  }

  it.each([
    "app/devis/page.tsx",
    "app/devis/actions.ts",
    "services/devis.service.ts",
    "components/devis-form.tsx",
    "config/orientation.ts",
    "config/cours/devis-du-cours.ts",
    "config/cours/parcours-a-choisir.ts",
  ])("%s n'atteint pas le registre", (f) => {
    expect(cheminVersLeRegistre(f)).toBeNull();
  });

  it("la garde voit le registre, même de proche en proche", () => {
    expect(cheminVersLeRegistre("config/cours/devis-du-contenu.ts")).not.toBeNull();
    expect(cheminVersLeRegistre("config/cours/parcours-de-formation.ts")).toEqual([
      "config/cours/parcours-de-formation.ts",
      "config/cours/registre.ts",
    ]);
  });
});
