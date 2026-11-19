import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LES NOMS DES OFFRES SE LISENT AU CATALOGUE EN VIGUEUR (décision du propriétaire,
 * novembre 2026 : il renomme lui-même les offres dans /admin/offres, et le nouveau nom doit
 * se lire partout sur le site, au prochain rendu).
 *
 * `OFFRES.<code>.nom` (config/tarifs.ts) n'est que la VALEUR PAR DÉFAUT : catalogue absent,
 * base neuve, tests. Une phrase servie qui nomme une offre prend les noms du catalogue
 * (`nomsDuCatalogue`, services/catalogue.service.ts `lireLesNoms`) en paramètre. Cette garde
 * refuse, dans src/ :
 *  · `OFFRES.<code>.nom` ou `OFFRES[…].nom` hors de config/tarifs.ts, et, dans
 *    config/tarifs.ts, hors des valeurs par défaut (`NOMS_PAR_DEFAUT`, le catalogue par défaut) ;
 *  · les phrases figées sur les noms par défaut (`LES_OFFRES_DE_L_ARENE`, `REFUS_DU_DOSSIER`…),
 *    importées hors de config/tarifs.ts : elles ne servent qu'aux tests ;
 *  · un nom d'offre écrit en toutes lettres dans le code servi (« l'offre Classe »,
 *    « Épisodes manager »…), sauf les homonymes listés et justifiés ci-dessous.
 * Les documents déjà émis (licences, devis) gardent le nom copié qu'ils portent : ils ne
 * passent pas par ici.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  return readdirSync(racine).flatMap((e) => {
    const c = join(racine, e);
    return statSync(c).isDirectory() ? fichiers(c) : /\.tsx?$/.test(e) ? [c] : [];
  });
}

/** Le code seul : les commentaires racontent l'histoire et citent les noms. */
const blanc = (m: string) => m.replace(/[^\n]/g, "");
const code = (t: string) =>
  t
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blanc)
    .replace(/\/\*[\s\S]*?\*\//g, blanc)
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s\/\/ .*$/gm, "");

const TOUS = fichiers(SRC).map((f) => ({ chemin: f.slice(SRC.length + 1), texte: code(readFileSync(f, "utf8")) }));
const TARIFS = "config/tarifs.ts";

/** Les phrases de config/tarifs.ts calculées sur les noms par défaut : pour les tests seulement. */
const FIGEES_SUR_LES_NOMS_PAR_DEFAUT = [
  "NOMS_PAR_DEFAUT",
  "MARQUE_DE_L_ARENE",
  "LES_OFFRES_DE_L_ARENE",
  "LES_OFFRES_DE_L_ARENE_EN_TETE",
  "MARQUE_DES_EPISODES",
  "LIGNE_DE_PRIX",
  "REPONSE_COMBIEN",
  "REFUS_DE_LA_CLASSE",
  "REFUS_DU_DOSSIER",
  "REFUS_DU_RELEVE",
  "REFUS_DES_COHORTES",
  "POURQUOI_LA_DECOUVERTE",
  "CONSEIL_SANS_LICENCE",
  "LIBELLES_DU_DEVIS",
  "CONDITIONS_DE_VENTE",
  "QUESTIONS_TARIFS",
  "ARGUMENTS_POUR_LES_ECOLES",
  "VARIABLES_PAR_DEFAUT",
];

/** Ce qu'un fichier importe de config/tarifs.ts. */
function importsDesTarifs(texte: string): string[] {
  const blocs = [...texte.matchAll(/import\s*\{([^}]*)\}\s*from\s*["'](?:@\/config\/tarifs|\.\/tarifs|\.\.\/tarifs|\.\.\/\.\.\/tarifs)["']/g)];
  return blocs.flatMap((b) =>
    b[1]!
      .split(",")
      .map((x) => x.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]!)
      .filter(Boolean),
  );
}

/**
 * LES NOMS D'OFFRE, en toutes lettres, tels qu'une phrase servie les écrirait. Les noms par
 * défaut sont écrits ici, exprès : la garde ne lit pas config/tarifs.ts pour savoir quoi refuser.
 */
const NOMS_EN_TOUTES_LETTRES: { quoi: string; motif: RegExp }[] = [
  { quoi: "« offre/licence Classe, Programme, Campus »", motif: /\b(?:[Oo]ffres?|[Ll]icences?|[Dd]evis) (?:Classe|Programme|Campus)\b/ },
  { quoi: "« Classe, Programme »", motif: /\bClasse,? (?:Programme|Campus)\b|\bProgramme (?:ou|et) Campus\b/ },
  { quoi: "« Programme » ou « Campus » seul", motif: /(?:^|[^\p{L}\-_./])(?:Programme|Campus)(?![\p{L}\-_./])/u },
  { quoi: "« Essai gratuit »", motif: /Essai gratuit/ },
  { quoi: "« Réseaux d'établissements »", motif: /Réseaux d(?:'|&apos;)établissements/ },
  { quoi: "« Épisodes manager »", motif: /Épisodes manager/ },
];

/**
 * LES HOMONYMES, LAISSÉS EXPRÈS (fichier, et ce que le mot y nomme). Un contenu de jeu ou de
 * cours dit « programme » au sens courant (le programme de production, d'un diplôme, d'une
 * fête) ; « Épisodes manager » nomme aussi la RUBRIQUE du site (fil d'Ariane, titre de page,
 * menu), pas l'offre qui la vend.
 */
const JEU = /^(?:config\/episodes\/(?!demos\.ts)|config\/scenarios\/|config\/cours\/|config\/courriers\/|config\/ateliers\/|engine\/|pedagogy\/)/;
const HOMONYMES: { chemin: string; motif: RegExp; pourquoi: string }[] = [
  { chemin: "app/concours/[code]/page.tsx", motif: /Programme/, pourquoi: "le programme daté du concours" },
  { chemin: "app/entreprises/page.tsx", motif: /Épisodes manager/, pourquoi: "la rubrique « Nouveau · Épisodes manager »" },
  { chemin: "app/entreprises/offre/page.tsx", motif: /Épisodes manager/, pourquoi: "le titre de la page de la rubrique" },
  { chemin: "app/entreprises/episode/page.tsx", motif: /Épisodes manager/, pourquoi: "le titre et le fil d'Ariane de la rubrique" },
  { chemin: "app/entreprises/episode/[code]/page.tsx", motif: /Épisodes manager/, pourquoi: "le fil d'Ariane de la rubrique" },
  { chemin: "app/entreprises/episode/rejoindre/page.tsx", motif: /Épisodes manager/, pourquoi: "le fil d'Ariane de la rubrique" },
  { chemin: "app/entreprises/episode/profil/page.tsx", motif: /Épisodes manager/, pourquoi: "le fil d'Ariane de la rubrique" },
  { chemin: "app/entreprises/episode/animation/[cle]/page.tsx", motif: /Épisodes manager/, pourquoi: "le fil d'Ariane de la rubrique" },
  { chemin: "components/episode/episode-joue.tsx", motif: /Épisodes manager/, pourquoi: "le fil d'Ariane de la rubrique" },
  { chemin: "config/guides/formateur.ts", motif: /Épisodes manager/, pourquoi: "l'entrée « Épisodes manager » du menu de l'espace" },
];

describe("les noms des offres se lisent au catalogue en vigueur", () => {
  it("`OFFRES.<code>.nom` ne sert qu'aux valeurs par défaut de config/tarifs.ts", () => {
    const fautes = TOUS.flatMap(({ chemin, texte }) => {
      const lignes = texte.split("\n");
      return lignes.flatMap((l, i) => {
        if (!/OFFRES(?:\.[a-z]+|\[[^\]]+\])\.nom\b/.test(l)) return [];
        if (chemin === TARIFS) {
          // Les valeurs par défaut : la table des noms par défaut, le catalogue par défaut.
          const avant = lignes.slice(Math.max(0, i - 40), i).join("\n");
          const dansLesNomsParDefaut = /export const NOMS_PAR_DEFAUT[^;]*$/.test(avant);
          const dansLeCatalogueParDefaut = /^\s*(?:nom|devisLibelle): (?:OFFRES\.[a-z]+\.nom|`\$\{OFFRES\.[a-z]+\.nom\}[^`$]*`),$/.test(l);
          if (dansLesNomsParDefaut || dansLeCatalogueParDefaut) return [];
        }
        return [`${chemin}:${i + 1} : ${l.trim()}`];
      });
    });
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("les phrases figées sur les noms par défaut ne s'importent pas dans src/", () => {
    const fautes = TOUS.filter(({ chemin }) => chemin !== TARIFS).flatMap(({ chemin, texte }) =>
      importsDesTarifs(texte)
        .filter((x) => FIGEES_SUR_LES_NOMS_PAR_DEFAUT.includes(x))
        .map((x) => `${chemin} : importe ${x}`),
    );
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("aucun nom d'offre en toutes lettres dans le code servi, hors homonymes justifiés", () => {
    const fautes = TOUS.filter(({ chemin }) => chemin !== TARIFS && !JEU.test(chemin)).flatMap(({ chemin, texte }) =>
      texte.split("\n").flatMap((l, i) =>
        NOMS_EN_TOUTES_LETTRES.filter(({ motif }) => motif.test(l))
          .filter(({ motif }) => !HOMONYMES.some((h) => h.chemin === chemin && h.motif.test(l) && motif.test(l)))
          .map(({ quoi }) => `${chemin}:${i + 1} : ${quoi} : ${l.trim().slice(0, 140)}`),
      ),
    );
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("chaque homonyme laissé existe encore (la liste ne garde pas de place vide)", () => {
    const vides = HOMONYMES.filter((h) => {
      const f = TOUS.find((x) => x.chemin === h.chemin);
      return !f || !h.motif.test(f.texte);
    }).map((h) => `${h.chemin} : ${h.pourquoi}`);
    expect(vides, vides.join("\n")).toEqual([]);
  });
});
