import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EpisodeJoue } from "@/components/episode/episode-joue";
import { EPISODES } from "@/pedagogy/episodes/registre";
import {
  accordsEntreParentheses,
  espacesJsxPerdues,
  espacesOrdinairesFautives,
  guillemetsDroits,
  LEXIQUE_INTERDIT,
  phrasesLongues,
  RACINE,
  sansExpressions,
  TEXTE_PROVISOIRE,
  textesDesSources,
  tiretsAuMilieu,
  tutoiements,
} from "../helpers/textes-du-depot";

/**
 * LA LANGUE DES SOURCES (audit de la langue, novembre 2026, section 6). Les gardes lisent les
 * textes que les sources portent (chaînes, gabarits, texte JSX ; jamais les commentaires), par
 * l'analyse syntaxique que l'audit a employée (tests/helpers/textes-du-depot.ts). Le cours, tel
 * qu'il est servi dans chaque entreprise, a ses propres gardes : tests/cours/langue-du-cours-servi.test.ts.
 *
 * Une liste d'exceptions nommées fige ce que l'audit a relevé hors du périmètre corrigé : elle
 * empêche d'en ajouter, elle n'exige pas de reprendre l'existant. Chaque exception porte son compte :
 * une occurrence de plus dans le même fichier fait échouer la garde.
 */

// Le retour de l'épisode enregistre la partie par une action serveur : sans base ici.
vi.mock("@/app/entreprises/episode/actions", () => ({ enregistrerPartieAction: vi.fn() }));

const PROSE = ["src/config", "src/pedagogy", "src/app", "src/components"] as const;
const textes = () => textesDesSources(PROSE);
const ou = (t: { fichier: string; ligne: number }) => `${t.fichier}:${t.ligne}`;

/** Le compte par fichier de ce qu'une règle trouve, comparé aux exceptions figées. */
function horsExceptions(trouves: readonly string[], exceptions: Readonly<Record<string, number>>): string[] {
  const parFichier = new Map<string, string[]>();
  for (const x of trouves) {
    const f = x.split(":")[0]!;
    parFichier.set(f, [...(parFichier.get(f) ?? []), x]);
  }
  return [...parFichier].flatMap(([f, xs]) => (xs.length > (exceptions[f] ?? 0) ? xs : []));
}

describe("la langue des sources", () => {
  it("1. aucun tiret au milieu d'une phrase, dans toute la prose", () => {
    const fautes = textes().flatMap((t) => tiretsAuMilieu(t.texte).map((x) => `${ou(t)} ${x}`));
    expect(fautes).toEqual([]);
  }, 120_000);

  it("4. un nombre calculé s'écrit en chiffres : ni {{lettres:}}, ni enLettres( ni EN_LETTRES[ hors des exceptions nommées", () => {
    // Les usages qui restent sont en tête de phrase (« Deux tours d'essai », « Aucun des… »,
    // « Première marche »), ou des épisodes que l'audit a laissés hors du périmètre corrigé.
    const EXCEPTIONS: Record<string, number> = {
      "src/components/podium.tsx": 2,
      "src/config/ateliers/essai.ts": 1,
      "src/config/episodes/freelances-ou-embauches.ts": 3,
      "src/config/episodes/negociations-annuelles.ts": 2,
      "src/config/episodes/postes-introuvables.ts": 4,
      "src/config/episodes/producteurs-qui-arretent.ts": 1,
      "src/config/episodes/spa-a-financer.ts": 2,
      "src/config/scenarios/situation-texte.ts": 2,
      "src/pedagogy/episodes/interim-qui-flambe.ts": 2,
      "src/pedagogy/episodes/marche-qui-s-ouvre.ts": 3,
      "src/pedagogy/episodes/negociations-annuelles.ts": 3,
      "src/pedagogy/episodes/producteurs-qui-arretent.ts": 3,
    };
    const fichiers = [...new Set(textes().map((t) => t.fichier))];
    const trouves = fichiers.flatMap((f) => {
      const source = readFileSync(join(RACINE, f), "utf8");
      return [...source.matchAll(/\{\{lettres:|enLettres\(|EN_LETTRES\[/g)].map((m) => `${f}:${source.slice(0, m.index).split("\n").length} ${m[0]}`);
    });
    expect(horsExceptions(trouves, EXCEPTIONS)).toEqual([]);
    expect(trouves.filter((x) => x.includes("{{lettres:"))).toEqual([]);
  }, 120_000);

  it("5. un accord se calcule : pas de « (s) », « (e) » dans la prose, hors des exceptions nommées", () => {
    const EXCEPTIONS: Record<string, number> = {
      "src/config/episodes/chutes-la-nuit.ts": 4,
      "src/pedagogy/episodes/practice-a-reorienter.ts": 1,
      "src/app/admin/effacements/actions.ts": 5,
    };
    const trouves = textes().flatMap((t) => accordsEntreParentheses(t.texte).map((x) => `${ou(t)} ${x}`));
    expect(horsExceptions(trouves, EXCEPTIONS)).toEqual([]);
  }, 120_000);

  it("6. pas de guillemets droits dans la prose, hors des exceptions nommées", () => {
    const EXCEPTIONS: Record<string, number> = { "src/config/cours/situations/par-chapitre/le-resultat-qui-manque.ts": 2 };
    const trouves = textes().flatMap((t) => guillemetsDroits(t.texte).map((x) => `${ou(t)} ${x}`));
    expect(horsExceptions(trouves, EXCEPTIONS)).toEqual([]);
  }, 120_000);

  it("7. un épisode s'affiche avec les insécables de la typographie française", () => {
    const fautes: string[] = [];
    for (const ep of EPISODES) {
      const html = renderToStaticMarkup(createElement(EpisodeJoue, { code: ep.code }));
      const texte = html
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, " ")
        .replace(/<[^>]+>/g, "\u0000")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&");
      for (const morceau of texte.split("\u0000")) for (const x of espacesOrdinairesFautives(morceau)) fautes.push(`${ep.code} ${x}`);
    }
    expect(fautes).toEqual([]);
  }, 120_000);

  it("8. le cours vouvoie : aucun tutoiement dans ses pages et ses composants, hors citation", () => {
    const fautes = textes()
      .filter((t) => /^src\/(components|app)\/cours\//.test(t.fichier))
      .flatMap((t) => tutoiements(t.texte).map((x) => `${ou(t)} ${x}`));
    expect(fautes).toEqual([]);
  }, 120_000);

  it("9. le lexique que la maison n'emploie plus, hors des exceptions nommées", () => {
    // « courriel » est le mot de la prose, « adresse électronique » celui des champs : « e-mail »
    // ne s'écrit plus. Les graphies que l'audit a laissées hors du périmètre corrigé sont figées.
    const EXCEPTIONS: Record<string, Record<string, number>> = {
      "évènement (événement)": { "src/config/ateliers/referentiels.ts": 1 },
      "co-animé, co-piloté, co-traitance (soudés)": {
        "src/config/episodes/appels-d-offres-en-rafale.ts": 1,
        "src/config/episodes/consultant-star.ts": 3,
        "src/config/episodes/promotion-refusee.ts": 4,
        "src/config/episodes/fiches/promotion-refusee.ts": 2,
        "src/pedagogy/episodes/promotion-refusee.ts": 1,
      },
      // Le texte de la partie de classe est aussi celui du catalogue en base (drizzle/0041) :
      // il se change dans /admin/offres, avec le catalogue, pas dans la seule configuration.
      "e-mail (courriel, adresse électronique)": { "src/config/tarifs.ts": 1 },
      "... (…)": {
        "src/config/episodes/agenda-qui-deborde.ts": 2,
        "src/config/episodes/pot-a-remplacer.ts": 1,
        "src/config/cours/chapitres/lire-le-compte-de-resultat.ts": 1,
      },
    };
    for (const { mot, re } of LEXIQUE_INTERDIT) {
      const trouves = textes()
        .filter((t) => re.test(sansExpressions(t.texte)))
        .map((t) => `${ou(t)} ${sansExpressions(t.texte).match(re)![0]}`);
      expect(horsExceptions(trouves, EXCEPTIONS[mot] ?? {}), mot).toEqual([]);
    }
  }, 120_000);

  it("10. phrases de plus de 40 mots : un plafond figé, qui empêche d'en ajouter", () => {
    // Garde informative : les phrases longues existantes (les corrigés numérotés des fiches,
    // surtout) ne sont pas à reprendre ici. Le plafond est leur nombre au 3 novembre 2026 ; il
    // ne monte pas. Quand on en raccourcit, on l'abaisse.
    const PLAFOND = 1_877;
    const longues = phrasesLongues(textes().map((t) => t.texte));
    expect(longues.size).toBeLessThanOrEqual(PLAFOND);
  }, 120_000);

  it("11. aucune espace perdue du JSX : un texte suivi d'un retour à la ligne puis d'une balise de texte porte un {\" \"}", () => {
    expect(espacesJsxPerdues(["src"])).toEqual([]);
  }, 120_000);

  it("12. aucun texte provisoire dans les pages : un champ inconnu s'écrit « [à compléter] », sans mention d'état", () => {
    const fautes = textesDesSources(["src/app"])
      .filter((t) => !/^src\/app\/(admin|api)\//.test(t.fichier))
      .filter((t) => TEXTE_PROVISOIRE.test(t.texte))
      .map((t) => `${ou(t)} ${t.texte.slice(0, 80)}`);
    expect(fautes).toEqual([]);
  }, 120_000);
});
