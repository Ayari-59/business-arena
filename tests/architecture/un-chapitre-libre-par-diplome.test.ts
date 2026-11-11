import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EssaiDuDiplome } from "@/components/cours/essai-du-diplome";
import { BUREAUX } from "@/config/cours/bureaux";
import { DIPLOMES_PROPOSES, chapitresLibresParDiplome, essaiDuDiplome, essaiPour } from "@/config/cours/chapitres-libres";
import { competencesAffichees } from "@/config/cours/competences-affichees";
import { formationsAvecUnePage } from "@/config/couverture";
import { ENQUETES } from "@/config/cours/enquetes";
import { coursDuDiplome } from "@/config/cours/par-diplome";
import { CHAPITRES } from "@/config/cours/registre";
import { SCENARIOS } from "@/config/cours/scenarios";
import { SITUATIONS, casDuChapitre } from "@/config/cours/situations";
import { FORMATIONS_PROPOSEES } from "@/config/formations-proposees";
import { fichierLibre, sourcesDuCours } from "../../scripts/verifier-bundles";

/**
 * UN CHAPITRE LIBRE PAR DIPLÔME (décision du propriétaire, novembre 2026 ; audit du 10 novembre,
 * produit P1-1). Le premier chapitre du parcours de chaque diplôme, dans son ordre d'apprentissage,
 * est libre, avec son cas pratique dédié ; aucun autre chapitre ni cas ne l'est. La règle :
 * config/cours/chapitres-libres.ts. Les drapeaux restent dans les fichiers (`libre: true`), là où la
 * règle d'accès et la fouille des fichiers publics les lisent : cette garde vérifie qu'ils disent la
 * décision, ni plus ni moins.
 */

/** La liste que la décision donne en novembre 2026 : diplômes, chapitre, cas dédié. */
const LISTE_DE_NOVEMBRE: readonly [string[], string, string][] = [
  [["stmg"], "les-flux-de-l-entreprise", "l-acompte-du-client"],
  [["bts-cg", "dcg"], "prix-cout-et-marge", "le-fournisseur-augmente"],
  [["bts-mco"], "taux-de-marque-et-coefficient", "l-etiquette-du-concurrent"],
  [["bts-ndrc"], "negocier-le-prix", "la-remise-autorisee"],
  [["bts-gpme"], "choisir-son-fournisseur", "le-fournisseur-allonge-son-delai"],
  [["bts-sam"], "effectif-et-masse-salariale", "l-augmentation-generale"],
  [["bts-mhr"], "seuil-de-rentabilite", "le-loyer-qui-augmente"],
  [["but-gea"], "salaire-brut-net-cout", "la-prime-de-fin-d-annee"],
  [["but-tc", "but-gaco"], "marche-et-part-de-marche", "garder-sa-part-de-marche"],
  [["dscg"], "croitre-en-investissant", "voir-plus-grand"],
];

/** Les diplômes proposés qui ont des chapitres au cours, une option comptant pour le sien. */
const AVEC_DES_CHAPITRES = DIPLOMES_PROPOSES.filter((f) => coursDuDiplome(f.code)?.premier);

describe("un chapitre libre par diplôme", () => {
  it("la liste : un chapitre par diplôme qui a des chapitres, partagé quand deux diplômes commencent par le même", () => {
    expect(AVEC_DES_CHAPITRES.length).toBeGreaterThanOrEqual(12);
    expect(chapitresLibresParDiplome().map((l) => [l.diplomes.map((f) => f.code), l.chapitre.code, l.cas?.code])).toEqual(LISTE_DE_NOVEMBRE);
  });

  it("chaque diplôme a exactement un chapitre libre à lui : le premier de son ordre d'apprentissage, et il est libre", () => {
    for (const f of AVEC_DES_CHAPITRES) {
      const cours = coursDuDiplome(f.code)!;
      const ordre = cours.blocs.flatMap((b) => b.chapitres).sort((a, b) => a.rang - b.rang);
      expect(ordre[0]!.chapitre, f.code).toBe(cours.premier!.chapitre);
      expect(cours.premier!.chapitre.libre, `${f.code} : ${cours.premier!.chapitre.code} n'est pas libre`).toBe(true);
      expect(essaiDuDiplome(f.code)?.chapitre, f.code).toBe(cours.premier!.chapitre);
      // Le parcours d'un diplôme commence par un chapitre libre. Ceux d'autres diplômes peuvent y
      // paraître plus loin (le bac STMG reprend le premier chapitre du BTS CG, du BUT TC…) : ils sont
      // libres pour leur diplôme, et la page ne met en tête que celui de ce diplôme.
      expect(ordre.findIndex((l) => l.chapitre.libre), f.code).toBe(0);
    }
  });

  it("une option a l'essai de son diplôme", () => {
    for (const f of FORMATIONS_PROPOSEES.filter((x) => x.optionDe)) {
      expect(essaiDuDiplome(f.code), f.code).not.toBeNull();
      expect(essaiDuDiplome(f.code), f.code).toEqual(essaiDuDiplome(f.optionDe));
    }
  });

  it("son cas pratique dédié est libre, et ne reprend que lui", () => {
    for (const f of AVEC_DES_CHAPITRES) {
      const essai = essaiDuDiplome(f.code)!;
      expect(essai.cas, f.code).toBe(casDuChapitre(essai.chapitre.code));
      expect(essai.cas?.reprend, f.code).toEqual([essai.chapitre.code]);
      expect(essai.cas?.libre, `${f.code} : ${essai.cas?.code} n'est pas libre`).toBe(true);
    }
  });

  it("aucun autre chapitre, cas, enquête, bureau ni scénario n'est libre", () => {
    const liste = chapitresLibresParDiplome();
    expect(CHAPITRES.filter((c) => c.libre).map((c) => c.code).sort()).toEqual(liste.map((l) => l.chapitre.code).sort());
    expect(SITUATIONS.filter((s) => s.libre).map((s) => s.code).sort()).toEqual(liste.map((l) => l.cas!.code).sort());
    for (const x of [...ENQUETES, ...BUREAUX, ...SCENARIOS]) expect(x.libre, x.code).toBe(false);
  });

  /**
   * UN FICHIER QUE LA FOUILLE SAUTE NE PORTE RIEN DE RÉSERVÉ. La fouille des fichiers publics
   * (scripts/verifier-bundles.ts, `marqueursDuCours`) ne cherche pas les textes d'un fichier libre
   * (`fichierLibre`) : un contenu réservé exporté du même fichier, comme la suite d'un chapitre découpé
   * (« Les leviers du seuil », « S'aligner sur le concurrent »), y échapperait.
   */
  it("chaque fichier que la fouille des fichiers publics saute n'exporte que des contenus libres", async () => {
    const sautes = sourcesDuCours().filter((f) => fichierLibre(readFileSync(f, "utf8")));
    const liste = chapitresLibresParDiplome();
    const contenus = async (f: string) =>
      Object.values(await import(f)).filter(
        (x): x is { code: string; libre: boolean } => !!x && typeof x === "object" && "etapes" in x && "libre" in x && typeof (x as { code?: unknown }).code === "string",
      );
    const libresSautes: string[] = [];
    for (const f of sautes) {
      for (const x of await contenus(f)) {
        expect(x.libre, `${relative(process.cwd(), f)} : ${x.code} est réservé`).toBe(true);
        libresSautes.push(x.code);
      }
    }
    // Les deux chapitres découpés se fouillent en entier : leur suite est réservée.
    for (const f of ["src/config/cours/chapitres/seuil-de-rentabilite.ts", "src/config/cours/chapitres/taux-de-marque.ts"]) {
      expect(fichierLibre(readFileSync(join(process.cwd(), f), "utf8")), f).toBe(false);
    }
    expect(libresSautes.sort()).toEqual(
      liste.flatMap((l) => [l.chapitre.code, l.cas!.code]).filter((c) => !["seuil-de-rentabilite", "taux-de-marque-et-coefficient"].includes(c)).sort(),
    );
  });
});

/**
 * EN TÊTE DE LA PAGE DU DIPLÔME (audit du 10 novembre 2026, produit P1-1 : sur téléphone, l'essai était
 * au 24e écran sur 28, et c'était un chapitre de BTS CG sur la page du STMG). L'encart vit dans
 * l'en-tête de /parcours/<formation> et sous le nom du diplôme dans la vue de /cours ; il mène au chapitre
 * libre du diplôme et à son cas, le diplôme dans l'adresse. Qu'il se lise sans défiler à 390 px se
 * vérifie dans le navigateur (tests/e2e/cours.e2e.ts, « un chapitre libre par diplôme »).
 */
describe("l'essai en tête de la page du diplôme", () => {
  const lire = (f: string) => readFileSync(join(process.cwd(), f), "utf8");

  it("/parcours/<formation> le pose dans son en-tête, avant le tableau de couverture", () => {
    const page = lire("src/app/parcours/[formation]/page.tsx");
    expect(page).toContain("const essai = essaiDuDiplome(code);");
    const enTete = page.slice(page.indexOf("<EnTeteDePage"), page.indexOf("</EnTeteDePage>"));
    expect(enTete).toContain("<EssaiDuDiplome");
    expect(enTete).toContain("lien={(c) => `/cours/${c.code}?diplome=${essai.diplome.code}`}");
    expect(page.indexOf("<EssaiDuDiplome")).toBeLessThan(page.indexOf("data-tableau-de-couverture"));
  });

  it("la vue d'un diplôme de /cours le pose sous le nom du diplôme, avant ses chapitres", () => {
    const page = lire("src/app/cours/page.tsx");
    const programme = page.slice(page.indexOf('id="programme-titre"'));
    expect(programme.indexOf("<EssaiDuDiplome")).toBeGreaterThan(0);
    expect(programme.indexOf("<EssaiDuDiplome")).toBeLessThan(programme.indexOf("data-couverture-du-programme"));
    expect(programme).toContain("lien={(c) => lienDuChapitre(c, imposee?.code, essaiDuProgramme.diplome.code)}");
  });

  it("chaque page de diplôme a son essai, qui mène au chapitre et au cas, le diplôme dans l'adresse", () => {
    for (const f of formationsAvecUnePage()) {
      const essai = essaiDuDiplome(f.code);
      expect(essai, f.code).not.toBeNull();
      const d = essai!.diplome.code;
      const html = renderToStaticMarkup(createElement(EssaiDuDiplome, { essai: essai!, lien: (c) => `/cours/${c.code}?diplome=${d}` }));
      expect(html, f.code).toContain(`href="/cours/${essai!.chapitre.code}?diplome=${d}"`);
      expect(html, f.code).toContain(`href="/cours/${essai!.cas!.code}?diplome=${d}"`);
      expect(html, f.code).toContain(`data-essai-du-diplome="${d}"`);
      // Le diplôme de l'adresse est celui dont la page du chapitre montre les compétences.
      expect(competencesAffichees(essai!.chapitre, { demande: d }).formation, f.code).toBe(d);
    }
  });

  it("un contenu réservé du parcours propose le chapitre libre du diplôme d'où l'on vient", () => {
    for (const f of AVEC_DES_CHAPITRES) {
      const essai = essaiDuDiplome(f.code)!;
      const reserve = coursDuDiplome(f.code)!.blocs.flatMap((b) => b.chapitres).find((l) => !l.chapitre.libre)!.chapitre;
      expect(essaiPour(reserve, { demande: f.code }).href, `${f.code} : ${reserve.code}`).toBe(`/cours/${essai.chapitre.code}?diplome=${f.code}`);
    }
  });
});
