import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LE CHANTIER « PROGRESSION, ÉPISODES ET LISIBILITÉ » DE L'AUDIT DU 11 NOVEMBRE 2026, GARDÉ SUR LA SOURCE.
 *
 * Ce qu'un rendu ou un navigateur vérifie ailleurs (tests/e2e/cours.e2e.ts, tests/e2e/mobile.e2e.ts,
 * tests/episodes/reprise-et-attente.test.ts) se garde ici dans le code, pour ne pas revenir par un
 * composant neuf :
 *  · P2-11 : chaque curseur dit sa valeur avec son unité (`aria-valuetext`) ; la liste « Courrier au
 *    hasard » a son étiquette ; les zones qui défilent de côté à 390 px sont nommées et s'atteignent au
 *    clavier ; les petits liens des pages de diplôme font 24 px de haut (tests/e2e/accessibilite.e2e.ts
 *    les mesure avec axe-core) ;
 *  · P2-2 : la calculatrice se replie sur téléphone, et Échap rend le focus à son bouton ;
 *  · P1-5 : la progression de l'élève de classe se relit au serveur, et l'élève a son code de reprise ;
 *  · P1-6 : l'épisode garde ses faits dans le stockage de session.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");

function fichiers(racine: string): string[] {
  return readdirSync(racine).flatMap((e) => {
    const chemin = join(racine, e);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : chemin.endsWith(".tsx") ? [chemin] : [];
  });
}

/** Les balises ouvrantes `<input …>` d'une source, entières (attributs sur plusieurs lignes compris). */
function balisesInput(source: string): string[] {
  const balises: string[] = [];
  let i = source.indexOf("<input");
  while (i >= 0) {
    let profondeur = 0;
    let j = i;
    for (; j < source.length; j++) {
      const c = source[j];
      if (c === "{") profondeur++;
      else if (c === "}") profondeur--;
      else if (c === ">" && profondeur === 0) break;
    }
    balises.push(source.slice(i, j + 1));
    i = source.indexOf("<input", j);
  }
  return balises;
}

describe("P2-11 · l'accessibilité", () => {
  it("chaque curseur du site dit sa valeur avec son unité (aria-valuetext)", () => {
    const curseurs: string[] = [];
    const sansUnite: string[] = [];
    for (const f of fichiers(SRC)) {
      for (const b of balisesInput(readFileSync(f, "utf8"))) {
        if (!/type="range"/.test(b)) continue;
        curseurs.push(f);
        if (!/aria-valuetext=/.test(b)) sansUnite.push(f.slice(SRC.length));
      }
    }
    expect(curseurs.length).toBeGreaterThanOrEqual(6);
    expect(sansUnite).toEqual([]);
  });

  it("la liste « Courrier au hasard » du pilotage a son étiquette", () => {
    const source = lire("components/distribution-courrier.tsx");
    const option = source.indexOf("Courrier au hasard</option>");
    expect(option).toBeGreaterThan(0);
    const liste = source.slice(source.lastIndexOf("<select", option), option);
    expect(liste).toMatch(/aria-label="[^"]+"/);
  });

  it("une zone qui défile de côté est une région nommée, dans la tabulation", () => {
    const zone = lire("components/zone-qui-defile.tsx");
    expect(zone).toContain('role="region"');
    expect(zone).toContain("aria-label={nom}");
    expect(zone).toContain("tabIndex={0}");
  });

  it("le pilotage : le tableau des équipes et le relevé de notes (celui qu'axe-core relève à 390 px)", () => {
    const pilotage = lire("app/teacher/games/[gameId]/page.tsx");
    const equipes = pilotage.slice(pilotage.indexOf("Équipes · état des décisions du"), pilotage.indexOf("<JustificationsReview"));
    expect(equipes).toContain("<ZoneQuiDefile");
    expect(equipes).not.toContain('className="overflow-x-auto"');
    const releve = pilotage.slice(pilotage.indexOf("Relevé de notes</h2>"), pilotage.indexOf("Aucun tour clôturé"));
    expect(releve.length).toBeGreaterThan(100);
    expect(releve).toContain("<ZoneQuiDefile");
    expect(releve).not.toContain('className="overflow-x-auto"');
  });

  it("le profil : la progression, épisode par épisode", () => {
    const profil = lire("app/entreprises/episode/profil/page.tsx");
    const progression = profil.slice(profil.indexOf("profil.progression.points.length > 0 && ("), profil.indexOf('aria-labelledby="suite-titre"'));
    expect(progression).toContain("<ZoneQuiDefile");
  });

  it("l'introduction d'épisode : la ligne du tableau de bord, qui défile sous l'en-tête", () => {
    const ligne = lire("components/episode/tableau-de-bord.tsx");
    const repere = ligne.indexOf("data-indicateurs-qui-defilent");
    expect(repere).toBeGreaterThan(0);
    const zoneDeLaLigne = ligne.slice(ligne.lastIndexOf("<span", repere), ligne.indexOf("{indicateurs.map", repere));
    expect(zoneDeLaLigne).toContain("overflow-x-auto");
    expect(zoneDeLaLigne).toMatch(/tabIndex=\{0\}/);
    expect(zoneDeLaLigne).toMatch(/aria-label="[^"]+"/);
    // La ligne garde le nom de tout ce qu'elle montre.
    expect(ligne).toContain("aria-label={resume}");
  });

  it("les liens des cas pratiques et le résumé « Objectifs » des pages de diplôme font au moins 24 px de haut", () => {
    const cours = lire("app/cours/page.tsx");
    const cas = cours.slice(cours.indexOf("function CasDuChapitre("), cours.indexOf("\n}\n", cours.indexOf("function CasDuChapitre(")));
    const liens = [...cas.matchAll(/<Link\b[^>]*?className="([^"]+)"/gs)].map((m) => m[1]!);
    expect(liens.length).toBe(4);
    for (const c of liens) expect(c.split(" "), c).toEqual(expect.arrayContaining(["min-h-6", "items-center"]));
    const objectifs = cours.slice(cours.indexOf('data-objectifs=""'), cours.indexOf("</summary>", cours.indexOf('data-objectifs=""')));
    expect(objectifs).toMatch(/<summary className="[^"]*\bmin-h-6\b/);
  });
});

describe("P2-2 · la calculatrice sur téléphone", () => {
  const calculatrice = lire("components/cours/calculatrice.tsx");

  it("un bandeau bas qui se replie d'un geste, sa valeur gardée", () => {
    expect(calculatrice).toContain("max-sm:inset-x-0 max-sm:bottom-0");
    expect(calculatrice).toContain("data-replier-la-calculatrice");
    expect(calculatrice).toMatch(/aria-expanded=\{!repliee\}/);
    // Repliée, elle garde sa ligne de calcul : la valeur reste dans son champ.
    expect(calculatrice).toMatch(/value=\{saisie\}/);
    const css = readFileSync(join(SRC, "app", "globals.css"), "utf8");
    expect(css).toContain("main:has([data-calculatrice][data-ouverte])");
    expect(css).toContain("main:has([data-calculatrice][data-ouverte][data-repliee])");
  });

  it("Échap la ferme et rend le focus au bouton « Calculatrice »", () => {
    expect(calculatrice).toMatch(/e\.key !== "Escape"/);
    expect(calculatrice).toContain("bouton.current?.focus()");
    expect(calculatrice).toContain("ref={bouton}");
  });
});

describe("P1-5 · la progression de l'élève de classe et son code de reprise", () => {
  it("la page d'un chapitre donne au guide la progression enregistrée, que le guide reprend sans la sienne", () => {
    const page = lire("app/cours/[chapitre]/page.tsx");
    expect(page).toContain("progressionDeLEleve(userId, chapitre.code)");
    expect(page).toContain("repriseDuServeur={repriseDuServeur}");
    const guide = lire("components/cours/chapitre-guide.tsx");
    expect(guide).toContain("useSuivi(`cours:${code}:${cas.code}`, repriseDuServeur)");
  });

  it("le serveur fond l'envoi dans ce qui est enregistré", () => {
    expect(lire("services/cours.service.ts")).toContain("progressionLaPlusAvancee(");
  });

  it("« Ma classe » montre le code de reprise du profil, et /cours/reprendre le reprend", () => {
    const cours = lire("app/cours/page.tsx");
    expect(cours).toContain("codeDeRepriseDuProfil(userId, true)");
    expect(cours).toContain("<MonCodeDeReprise");
    expect(lire("app/cours/reprendre/page.tsx")).toContain("<FormulaireRepriseEnClasse");
    const actions = lire("app/cours/actions.ts");
    expect(actions).toContain("reprendreProfil({");
    expect(actions).toContain("porteur:");
    expect(actions).toContain("setGuestCookie(r.userId)");
  });
});

describe("P1-6 · l'épisode garde ses faits dans l'onglet", () => {
  it("le stockage de session, lu au montage, écrit à chaque geste", () => {
    const episode = lire("components/episode/episode-joue.tsx");
    expect(episode).toContain("window.sessionStorage.getItem(cleDeSession)");
    expect(episode).toContain("window.sessionStorage.setItem(cleDeSession, JSON.stringify(faits))");
    expect(episode).toContain("gesteDeReprise(faits)");
  });
});
