import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GUIDES,
  LARGEUR_REDUITE,
  cheminDuGuide,
  guideResolu,
  hauteurReduite,
  imageDeLaCapture,
  proseDuGuide,
} from "@/config/guides";
import { JETONS, jetonsDe, valeursDesJetons } from "@/config/guides/jetons";
import { CATALOGUE_PAR_DEFAUT } from "@/config/tarifs";

/**
 * LES GUIDES DE PRISE EN MAIN NE MENTENT PAS SUR L'ÉCRAN QU'ILS DÉCRIVENT.
 *
 * Un guide vieillit en silence : un bouton change de nom, une capture disparaît, une
 * offre change de composition, et la page continue d'afficher l'ancien monde. Ces gardes
 * tiennent ce qui peut se vérifier sans navigateur :
 *   · chaque guide déclaré a sa page ;
 *   · chaque capture citée existe, en deux tailles, aux dimensions déclarées, et légère ;
 *   · chaque libellé cité entre « » existe dans le code de l'application ;
 *   · aucun prix, aucun chiffre écrit à la main : ce qui se compte entre par un jeton ;
 *   · chaque lien interne mène à une page ;
 *   · les fonctions en chantier ne sont pas décrites, mais leur place est gardée ;
 *   · le script des captures sait photographier chaque étape ;
 *   · les portes d'entrée (pied de page, espace enseignant, arène, intégration) existent.
 */

const RACINE = process.cwd();
const SRC = join(RACINE, "src");
const lire = (chemin: string) => readFileSync(join(RACINE, chemin), "utf8");

function fichiers(dossier: string, filtre: RegExp): string[] {
  return readdirSync(dossier).flatMap((e) => {
    const c = join(dossier, e);
    return statSync(c).isDirectory() ? fichiers(c, filtre) : filtre.test(e) ? [c] : [];
  });
}

/** La taille d'un WebP, lue dans son en-tête (VP8 avec perte, VP8L sans perte, VP8X étendu). */
function tailleWebp(chemin: string): { largeur: number; hauteur: number } {
  const b = readFileSync(chemin);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`${chemin} n'est pas un WebP`);
  }
  const bloc = b.toString("ascii", 12, 16);
  if (bloc === "VP8 ") return { largeur: b.readUInt16LE(26) & 0x3fff, hauteur: b.readUInt16LE(28) & 0x3fff };
  if (bloc === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { largeur: (bits & 0x3fff) + 1, hauteur: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (bloc === "VP8X") return { largeur: b.readUIntLE(24, 3) + 1, hauteur: b.readUIntLE(27, 3) + 1 };
  throw new Error(`${chemin} : bloc WebP inconnu (${bloc})`);
}

/** Une route de app/, segments dynamiques compris ([public], [code]…). */
function routeExiste(href: string): boolean {
  const chemin = href.split("#")[0]!.split("?")[0]!;
  let dossier = join(SRC, "app");
  for (const s of chemin === "/" ? [] : chemin.slice(1).split("/")) {
    if (existsSync(join(dossier, s))) {
      dossier = join(dossier, s);
      continue;
    }
    const crochets = readdirSync(dossier).filter((d) => /^\[[a-zA-Z]+\]$/.test(d));
    if (crochets.length !== 1) return false;
    dossier = join(dossier, crochets[0]!);
  }
  return existsSync(join(dossier, "page.tsx"));
}

/** Tout le code de l'application, hors du registre des guides, tel que l'écran le lit. */
const CODE_DE_L_APPLICATION = fichiers(SRC, /\.tsx?$/)
  .filter((f) => !f.includes(join("src", "config", "guides")))
  .map((f) =>
    readFileSync(f, "utf8")
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\{" "\}/g, " ")
      .replace(/\s+/g, " "),
  )
  .join("\n");

const VALEURS = valeursDesJetons(CATALOGUE_PAR_DEFAUT);

describe("les guides de prise en main", () => {
  it("chaque guide déclaré a sa page, et une seule", () => {
    expect(GUIDES.length).toBeGreaterThanOrEqual(4);
    expect(new Set(GUIDES.map((g) => g.public)).size).toBe(GUIDES.length);
    // La page dynamique se génère pour chaque guide du registre, et pour lui seul.
    const page = lire("src/app/guides/[public]/page.tsx");
    expect(page).toContain("return GUIDES.map((g) => ({ public: g.public }));");
    expect(page).toContain("export const dynamicParams = false;");
    expect(existsSync(join(SRC, "app", "guides", "[public]", "page.tsx"))).toBe(true);
    expect(existsSync(join(SRC, "app", "guides", "page.tsx"))).toBe(true);
    for (const g of GUIDES) {
      expect(routeExiste(cheminDuGuide(g.public)), g.public).toBe(true);
      expect(g.enCinqMinutes.length, `${g.public} : « En 5 minutes » vide`).toBeGreaterThan(1);
      expect(g.etapes.length, `${g.public} : trop peu d'étapes`).toBeGreaterThan(4);
      expect(g.faq.length, `${g.public} : FAQ vide`).toBeGreaterThan(2);
      expect(g.plusLoin.length, `${g.public} : « Aller plus loin » vide`).toBeGreaterThan(1);
      expect(g.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const ids = g.etapes.map((e) => e.id);
      expect(new Set(ids).size, `${g.public} : deux étapes de même ancre`).toBe(ids.length);
    }
  });

  it("chaque capture citée existe, en deux tailles, aux dimensions déclarées, et pèse moins de 125 Ko", () => {
    const fautes: string[] = [];
    for (const g of GUIDES) {
      for (const e of g.etapes) {
        const c = e.capture;
        for (const [reduite, largeur, hauteur] of [
          [false, c.largeur, c.hauteur],
          [true, LARGEUR_REDUITE, hauteurReduite(c)],
        ] as const) {
          const chemin = join(RACINE, "public", imageDeLaCapture(g.public, c, reduite));
          if (!existsSync(chemin)) {
            fautes.push(`${chemin} : absente`);
            continue;
          }
          const t = tailleWebp(chemin);
          if (t.largeur !== largeur || t.hauteur !== hauteur) {
            fautes.push(`${chemin} : ${t.largeur}×${t.hauteur}, déclarée ${largeur}×${hauteur}`);
          }
          if (statSync(chemin).size > 125_000) fautes.push(`${chemin} : ${statSync(chemin).size} octets`);
        }
        if (c.alt.trim().length < 20) fautes.push(`${g.public}/${e.id} : texte de remplacement trop court`);
      }
    }
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("chaque libellé cité entre « » existe dans le code de l'application", () => {
    const absents: string[] = [];
    for (const g of GUIDES) {
      for (const texte of proseDuGuide(g)) {
        for (const m of texte.matchAll(/«\s*([^»]+?)\s*»/g)) {
          const libelle = m[1]!.replace(/\s+/g, " ");
          // Le libellé ENTIER, borné comme l'écran le borne (une chaîne, une balise, des
          // guillemets) : « Créer mon compte » ne passe pas pour « Créer mon compte
          // enseignant ». Un pictogramme peut le précéder, une flèche le suivre.
          const echappe = libelle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const borne = new RegExp(`[>"'\`«]\\s*(?:[⬇+↻] ?)?${echappe}\\s*(?:→|…)?\\s*[<"'\`»{]`);
          if (!borne.test(CODE_DE_L_APPLICATION)) absents.push(`${g.public} : « ${libelle} »`);
        }
      }
    }
    expect(absents, `libellés cités qui n'existent plus à l'écran :\n${absents.join("\n")}`).toEqual([]);
  });

  it("aucun prix, aucun chiffre écrit à la main, aucun tiret au milieu d'une phrase", () => {
    const fautes: string[] = [];
    for (const g of GUIDES) {
      for (const texte of proseDuGuide(g)) {
        // Le nom d'une norme n'est pas un chiffre de configuration.
        if (/\d/.test(texte.replace(/\bLTI 1\.3\b/g, ""))) fautes.push(`${g.public} : un chiffre dans « ${texte.slice(0, 70)} »`);
        if (/€|\beuros?\b|\bHT\b|\bTTC\b/i.test(texte)) fautes.push(`${g.public} : un prix dans « ${texte.slice(0, 70)} »`);
        if (/\s[—–]\s/.test(texte)) fautes.push(`${g.public} : un tiret dans « ${texte.slice(0, 70)} »`);
      }
    }
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("ce qui se compte entre par un jeton connu, résolu depuis la configuration et le catalogue", () => {
    for (const g of GUIDES) {
      for (const texte of proseDuGuide(g)) {
        for (const j of jetonsDe(texte)) expect(JETONS, `${g.public} : jeton {{${j}}}`).toContain(j);
      }
      const resolu = guideResolu(g, VALEURS);
      expect(JSON.stringify(resolu)).not.toContain("{{");
    }
    // Les jetons lisent bien la source : un niveau de plus dans la configuration, ou une
    // offre renommée au catalogue, se lit dans le guide sans qu'on le réécrive.
    expect(VALEURS.offresExamen.length).toBeGreaterThan(0);
    const renomme = valeursDesJetons({
      ...CATALOGUE_PAR_DEFAUT,
      offres: CATALOGUE_PAR_DEFAUT.offres.map((o) => (o.code === "campus" ? { ...o, nom: "Université" } : o)),
    });
    expect(renomme.offresArene).toContain("Université");
    expect(renomme.offresArene).not.toContain("Campus");
  });

  it("chaque lien interne d'un guide, et de ses pages, mène à une page", () => {
    const morts: string[] = [];
    const hrefs = GUIDES.flatMap((g) => [
      ...g.etapes.flatMap((e) => (e.lien ? [e.lien.href] : [])),
      ...g.plusLoin.map((p) => p.lien.href),
      ...g.faq.flatMap((q) => (q.lien ? [q.lien.href] : [])),
    ]);
    for (const page of ["src/app/guides/page.tsx", "src/app/guides/[public]/page.tsx"]) {
      for (const m of lire(page).matchAll(/href(?:=|: )"(\/[^"]*)"/g)) hrefs.push(m[1]!);
    }
    expect(hrefs.length).toBeGreaterThan(20);
    for (const h of hrefs) if (!routeExiste(h)) morts.push(h);
    expect(morts, `liens sans page :\n${morts.join("\n")}`).toEqual([]);
  });

  it("une fonction en chantier n'est pas décrite, mais sa place est gardée (aucune aujourd'hui)", () => {
    for (const g of GUIDES) {
      const ids = g.etapes.map((e) => e.id);
      for (const a of g.aVenir) expect(ids, `${g.public} : ${a.fonction} ancrée à « ${a.apres} »`).toContain(a.apres);
      expect(g.aVenir, `${g.public} : une fonction attendue n'est plus en chantier`).toEqual([]);
    }
  });

  it("le tour d'essai, l'évaluation entre coéquipiers et le retour des notes, livrés, sont décrits là où ils se jouent", () => {
    const prose = (p: string) => proseDuGuide(GUIDES.find((g) => g.public === p)!).join("\n");
    expect(prose("enseignant")).toMatch(/Tour d'essai · ne compte pas/);
    expect(prose("enseignant")).toMatch(/Commencer la vraie partie/);
    expect(prose("etudiant")).toMatch(/tour d'essai/i);
    expect(prose("enseignant")).toMatch(/Évaluation entre coéquipiers/);
    expect(prose("enseignant")).toMatch(/Renvoyer les notes/);
    expect(prose("etudiant")).toMatch(/Évaluez vos coéquipiers/);
    expect(prose("etudiant")).toMatch(/carnet de notes/);
    expect(prose("etablissement")).toMatch(/Assignment and Grade/);
    expect(prose("etablissement")).toMatch(/coéquipiers/);
  });

  it("le script des captures photographie chaque étape, et n'écrit aucune adresse réelle", () => {
    const script = lire("scripts/captures-des-guides.mts");
    for (const g of GUIDES) {
      for (const e of g.etapes) {
        expect(script, `${g.public}/${e.capture.fichier} : aucune prise dans le script`).toContain(`"${e.capture.fichier}"`);
      }
    }
    for (const m of script.matchAll(/[\w.+-]+@([\w-]+\.)+[a-z]+/gi)) {
      expect(m[0], "une adresse de démonstration se termine en .example").toMatch(/\.example$/);
    }
    expect(script).toContain("École de démonstration");
  });

  it("les portes d'entrée mènent au bon guide", () => {
    expect(lire("src/components/pied-de-page.tsx")).toContain("LIEN_GUIDES");
    const plan = lire("src/config/navigation.ts");
    expect(plan).toMatch(/LIEN_GUIDES: LienDeMenu = \{\s*href: "\/guides"/);
    // L'espace enseignant (sa pastille « Aide ») et l'arène (son menu) lisent le
    // plan : c'est là que les deux adresses s'écrivent, une fois chacune.
    expect(plan).toContain('href: "/guides/enseignant"');
    expect(plan).toContain('href: "/guides/etudiant"');
    expect(lire("src/components/en-tete-enseignant.tsx")).toContain("NAVIGATION_ENSEIGNANT");
    expect(lire("src/app/arena/[gameId]/page.tsx")).toContain("<MenuDeLArene");
    expect(lire("src/components/barre-de-jeu.tsx")).toContain("<MenuDeLArene");
    expect(lire("src/components/menu-de-l-arene.tsx")).toContain("data-lien-guide-etudiant");
    expect(lire("src/app/integration/page.tsx")).toContain('href="/guides/etablissement"');
    expect(lire("src/app/join/page.tsx")).toContain('href="/guides/etudiant"');
    expect(lire("src/app/teacher/login/page.tsx")).toContain('href="/guides/enseignant"');
  });
});
