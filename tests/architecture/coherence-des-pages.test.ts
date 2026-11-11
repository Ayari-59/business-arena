import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NAVIGATION } from "@/config/navigation";

/**
 * CE QUE LES PAGES PROMETTENT, CONTRE CE QUE LE CODE FAIT (audit d'octobre 2026).
 *
 * L'audit a relevé des pages qui disaient autre chose que le code : des ateliers
 * « librement utilisables » dont le dossier demande une licence, des épisodes qui
 * « se jouent sans compte » sans dire qu'ils demandent l'offre épisodes, un
 * chapitre réservé sans chemin vers les offres, un formulaire de quatre questions
 * annoncé en trois, et le concours sous un nom anglais que le menu avait retiré.
 */
const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

describe("les promesses d'accès suivent le code", () => {
  it("les ateliers disent ce qui est libre et ce qui demande une licence", () => {
    const page = lire("src/app/animations/page.tsx");
    expect(page).not.toMatch(/librement\s+utilisables/);
    expect(page).toContain("data-acces-des-ateliers");
  });

  it("les épisodes en classe disent que la cohorte demande l'offre épisodes", () => {
    const page = lire("src/app/enseignants/episodes/page.tsx");
    expect(page).not.toMatch(/Les épisodes se jouent\s+sans compte/);
    expect(page).toContain("OFFRES.episodes.nom");
  });

  it("un chapitre réservé mène au chapitre libre de son diplôme, aux offres et au devis", () => {
    // La page du chapitre réservé vit dans son composant (audit UX du 29 octobre 2026 : une
    // variante pour l'élève, sans vente) ; la page du chapitre le rend.
    expect(lire("src/app/cours/[chapitre]/page.tsx")).toContain("<ChapitreReserve");
    const page = lire("src/components/cours/chapitre-reserve.tsx");
    expect(page).toContain("data-acces-du-cours");
    expect(page).toContain("href={LIEN_TARIFS}");
    // Le devis de l'offre Classe : pas d'offre « cours seul » (décision du propriétaire).
    // « Le cours seul » n'est plus un choix du devis : le cours vient avec l'offre (audit de l'offre).
    expect(page).toContain('href="/devis?offre=classe"');
    // Le chapitre libre le plus proche : celui du diplôme d'où l'on vient (config/cours/chapitres-libres.ts, `essaiPour`).
    expect(page).toContain("href={essai.href}");
    expect(lire("src/app/cours/[chapitre]/page.tsx")).toContain("essai={essaiPour(chapitre,");
  });
});

describe("un nom par chose, et les bons comptes", () => {
  it("le concours s'appelle partout « concours entre classes », jamais « Championship »", () => {
    for (const f of [
      "src/app/page.tsx",
      "src/app/fonctionnalites/page.tsx",
      "src/app/teacher/page.tsx",
      "src/services/competition.service.ts",
      "src/services/demo.service.ts",
    ])
      expect(lire(f), f).not.toContain("Championship");
  });

  it("l'orientation annonce autant de questions qu'elle en pose", () => {
    const formulaire = lire("src/components/orientation-form.tsx");
    const posees = formulaire.match(/\{question\(\d, "/g)?.length ?? 0;
    expect(posees).toBe(4);
    expect(formulaire).toContain("Répondez aux quatre questions");
    expect(formulaire).toContain("sur 4");
    expect(lire("src/app/orientation/page.tsx")).toContain("Répondez à quatre questions");
    // La page promettait de demander « le temps dont vous disposez », ce que le formulaire ne fait pas.
    expect(lire("src/app/orientation/page.tsx")).not.toContain("temps dont vous disposez");
  });
});

describe("le menu range chaque page chez son public", () => {
  it("l'élève a une seule porte pour tous les codes, concours compris ; l'explication est chez les enseignants", () => {
    // Novembre 2026 : « J'ai un code » (/join) conduit un code de concours à /compete
    // (services/rejoindre.service.ts) ; l'entrée séparée du concours quitte le menu.
    const groupe = (code: string) => NAVIGATION.find((g) => g.code === code)!.liens.map((l) => l.href);
    expect(groupe("eleves")).toContain("/join");
    expect(NAVIGATION.flatMap((g) => g.liens.map((l) => l.href))).not.toContain("/compete");
    expect(lire("src/services/rejoindre.service.ts")).toContain("`/compete?code=");
    expect(groupe("enseignants")).toContain("/guide#concours");
  });
});

