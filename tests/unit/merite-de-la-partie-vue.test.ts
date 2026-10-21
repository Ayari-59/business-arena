import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Le composant charge aussi le verdict côté serveur (session, licence, base) :
// on ne rend ici que la vue, sans aucune requête. Fermer la frontière suffit.
vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

const { MeriteDeLaPartieVue } = await import("@/components/merite-de-la-partie");
const { GRAINES_DU_MERITE, verdictDuMerite } = await import("@/pedagogy/merite/verdict");
const { PHRASE_DE_LA_REFERENCE, PHRASE_DE_LA_REFERENCE_A_LA_DEMANDE, phraseDeLaReference } = await import(
  "@/pedagogy/merite/reference"
);
type IssueDuRejeu = import("@/pedagogy/merite/rejeu").IssueDuRejeu;
type SuiteAffichee = import("@/components/merite-de-la-partie").SuiteAffichee;

/**
 * LA VUE DU BILAN « MÉRITE OU CHANCE » : ce que la page dit de la référence, et
 * le niveau conseillé quand il est fermé sans licence.
 *
 * L'e2e joue une vraie partie dont le geste unique (+8 % au premier tour) est
 * fragile face à un bon gestionnaire : elle ne fait jamais monter d'un niveau,
 * donc ne montre plus le niveau fermé. Cette garde le rend ici, sur un verdict
 * fabriqué, sans base ni navigateur.
 */

const issue = (graine: number, resultat: number, rang = 2): IssueDuRejeu => ({
  graine,
  joueur: { ipg: 50, rang, resultatNetCumule: resultat, chiffreDAffairesCumule: 400_000, tresorerieFinale: 0, tresorerieLaPlusBasse: 0, defaillant: false },
  sur: 3,
  resultatParTour: [resultat / 2, resultat / 2],
  parEquipe: {},
  tours: [],
});

/** Des décisions solides (24 marchés sur 30, de loin) au niveau 3 : la suite propose le niveau 4. */
const verdict = verdictDuMerite({
  joue: issue(999, 60_000),
  joueur: GRAINES_DU_MERITE.map((g, i) => issue(g, 40_000 + 1000 * i, 1)),
  reference: GRAINES_DU_MERITE.map((g, i) => issue(g, i < 6 ? 40_000 + 1000 * i + 500 : 30_000 + 1000 * i, 2)),
  libelles: ["Trimestre 1", "Trimestre 2"],
  niveau: 3,
  niveauMax: 6,
  entreprise: "nova",
  entreprises: ["nova", "hotel"],
});

const suite = (ferme: boolean): SuiteAffichee => ({
  niveau: verdict.suite.niveau,
  nomDuNiveau: "Arbitrage",
  entreprise: verdict.suite.entreprise,
  nomDeLEntreprise: "NOVA",
  memeEntreprise: verdict.suite.memeEntreprise,
  pourquoi: verdict.suite.pourquoi,
  href: ferme ? null : `/jouer?secteur=nova&niveau=${verdict.suite.niveau}`,
  ferme: ferme ? { message: "Les niveaux 4 à 6 sont inclus dans les offres.", tarifs: "/tarifs" } : null,
});

const rendre = (ferme: boolean) =>
  renderToStaticMarkup(createElement(MeriteDeLaPartieVue, { verdict, suite: suite(ferme) }));

describe("la vue du bilan : la référence se nomme et dit ce qu'elle fait", () => {
  it("le verdict fabriqué est solide et propose le niveau 4", () => {
    expect(verdict.cas).toBe("merite");
    expect(verdict.suite).toMatchObject({ sens: "monter", niveau: 4 });
  });

  it("l'en-tête nomme un bon gestionnaire, et une ligne dit ce qu'il fait", () => {
    const html = rendre(false);
    expect(html).toContain("et celles d&#x27;un bon gestionnaire sur les mêmes");
    expect(html).toContain("data-qui-est-la-reference");
    expect(html).toContain(PHRASE_DE_LA_REFERENCE.replace(/'/g, "&#x27;"));
    expect(html).not.toMatch(/[Gg]estion de référence/);
  });

  it("une partie à la demande : la ligne dit ce que fait SON bon gestionnaire, sans chiffre ni seuil", () => {
    expect(phraseDeLaReference({ propositionALaDemande: true })).toBe(PHRASE_DE_LA_REFERENCE_A_LA_DEMANDE);
    expect(phraseDeLaReference({})).toBe(PHRASE_DE_LA_REFERENCE);
    expect(PHRASE_DE_LA_REFERENCE_A_LA_DEMANDE).not.toBe(PHRASE_DE_LA_REFERENCE);
    for (const phrase of [PHRASE_DE_LA_REFERENCE, PHRASE_DE_LA_REFERENCE_A_LA_DEMANDE]) expect(phrase).not.toMatch(/\d/);
    const html = renderToStaticMarkup(
      createElement(MeriteDeLaPartieVue, { verdict, suite: suite(false), phrase: PHRASE_DE_LA_REFERENCE_A_LA_DEMANDE }),
    );
    expect(html).toContain(PHRASE_DE_LA_REFERENCE_A_LA_DEMANDE.replace(/'/g, "&#x27;"));
    expect(html).not.toContain(PHRASE_DE_LA_REFERENCE.replace(/'/g, "&#x27;"));
  });

  it("la distribution nomme ses deux rangées en toutes lettres", () => {
    const html = rendre(false);
    expect(html).toMatch(/data-rangee="joueur"[\s\S]*Vos décisions/);
    expect(html).toMatch(/data-rangee="reference"[\s\S]*Un bon gestionnaire/);
  });
});

describe("et ensuite : un niveau fermé se montre sans se lancer", () => {
  it("fermé sans licence : la phrase des offres, le lien des tarifs, aucun lien de lancement", () => {
    const html = rendre(true);
    expect(html).toContain("data-niveau-ferme");
    expect(html).toContain("Niveau 4 fermé sans licence.");
    expect(html).toContain("inclus dans les offres");
    expect(html).toContain('href="/tarifs"');
    expect(html).not.toContain("data-lien-de-la-suite");
  });

  it("ouvert : le lien secondaire qui règle /jouer, et rien de fermé", () => {
    const html = rendre(false);
    expect(html).toContain('href="/jouer?secteur=nova&amp;niveau=4"');
    expect(html).toContain("data-lien-de-la-suite");
    expect(html).not.toContain("data-niveau-ferme");
  });
});
