import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BilanDePartie } from "@/components/bilan-de-partie";
import { bilanDeLaPartie, type TourDuBilan } from "@/pedagogy/bilan-de-partie";

/**
 * SIX TOURS DE TRAVAIL MÉRITENT MIEUX QU'UNE LIGNE.
 *
 * L'écran de fin disait « Partie terminée », un montant cumulé et deux boutons.
 * Ce qui s'était joué pendant la séance restait dispersé dans un accordéon.
 *
 * Ce que ce test garde : les chiffres sont ceux de TOUTE la partie (sauf la
 * trésorerie, qui est un solde), le tour décisif n'est pas le meilleur tour, et
 * l'écran ne promet pas un classement qui n'est pas ouvert.
 */

const tours = (...lignes: [number, number, number, number][]): TourDuBilan[] =>
  lignes.map(([round, ca, resultat, tresorerie]) => ({
    round,
    libelle: `Trimestre ${round}`,
    ca,
    resultat,
    tresorerie,
  }));

const sansEspacesFines = (t: string) =>
  t.replace(/[  ]/g, " ").replace(/&#x27;/g, "'");

/** Le texte lu à l'écran : sans balises (un « 2e » et son « sur 6 » sont deux spans). */
const texteDe = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("le bilan de la partie", () => {
  it("cumule ce qui se cumule, et garde le solde de trésorerie de la fin", () => {
    const b = bilanDeLaPartie(tours([1, 1000, -200, 500], [2, 1500, 300, 800], [3, 2000, 600, 900]))!;
    expect(b.caCumule).toBe(4500);
    expect(b.resultatCumule).toBe(700);
    // La trésorerie est un solde : l'additionner n'aurait aucun sens.
    expect(b.tresorerieFinale).toBe(900);
    expect(b.tours).toBe(3);
    expect(b.beneficiaire).toBe(true);
  });

  it("le tour décisif n'est pas le meilleur tour", () => {
    // Le redressement se joue au 2 (de −800 à +100, soit 900 de mieux) ; le
    // meilleur résultat tombe au 4, sans que rien y ait basculé.
    const b = bilanDeLaPartie(
      tours([1, 900, -800, 100], [2, 1200, 100, 200], [3, 1300, 150, 250], [4, 1400, 300, 400]),
    )!;
    expect(b.tourDecisif?.tour.round).toBe(2);
    expect(b.tourDecisif?.gain).toBe(900);
    expect(b.meilleurTour?.round).toBe(4);
  });

  it("sans progression, pas de tour décisif inventé", () => {
    const b = bilanDeLaPartie(tours([1, 900, 300, 500], [2, 800, 100, 400]))!;
    expect(b.tourDecisif).toBeNull();
  });

  it("un seul tour joué reste un bilan, sans tour décisif", () => {
    const b = bilanDeLaPartie(tours([1, 900, 300, 500]))!;
    expect(b.tours).toBe(1);
    expect(b.tourDecisif).toBeNull();
    expect(b.meilleurTour?.round).toBe(1);
  });

  it("aucune partie jouée, aucun bilan", () => {
    expect(bilanDeLaPartie([])).toBeNull();
  });
});

describe("l'écran de fin", () => {
  const rendu = (props: Parameters<typeof BilanDePartie>[0]) =>
    sansEspacesFines(renderToStaticMarkup(createElement(BilanDePartie, props)));

  const bilan = bilanDeLaPartie(
    tours([1, 900, -800, 100], [2, 1200, 100, 200], [3, 1300, 150, 250], [4, 1400, 300, 400]),
  )!;

  it("raconte la partie : ce qui a été fait, quand, et ce qui a été réussi", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan,
      reussites: { acquises: 6, total: 10, derniere: "Le marché vous suit" },
      place: { rang: 2, total: 6 },
      motDeClassement: null,
    });
    expect(html).toContain("Clôture de l'exercice · 4 tours");
    expect(html).toContain("4 800 €"); // le CA de toute la partie
    expect(html).toContain("Votre tour décisif");
    expect(html).toContain("Trimestre 2");
    expect(html).toContain("6 sur 10");
    expect(html).toContain("Le marché vous suit");
    expect(texteDe(html)).toContain("2e sur 6");
  });

  it("ne promet pas un classement que l'enseignant n'a pas ouvert", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan,
      reussites: { acquises: 1, total: 10, derniere: null },
      place: null,
      motDeClassement: "Le classement final sera révélé par votre enseignant.",
    });
    expect(html).toContain("révélé par votre enseignant");
    expect(html).not.toContain("sur 6.");
    // Sans réussite nommée, la phrase reste correcte.
    expect(html).toContain("1 sur 10.");
  });

  it("le record ne compare qu'à soi, et sait qu'il vient d'être battu", () => {
    const avec = (record: { monIpg: number; meilleur: number | null }) =>
      rendu({
        titre: "Partie terminée.",
        bilan,
        reussites: { acquises: 4, total: 10, derniere: null },
        place: null,
        motDeClassement: null,
        record,
      });
    expect(avec({ monIpg: 71, meilleur: 64 })).toContain("Nouveau record");
    expect(avec({ monIpg: 61, meilleur: 64 })).toContain("Votre record tient");
    // Première partie sur ce métier : il n'y a rien à battre, seulement une
    // référence à poser.
    const premiere = avec({ monIpg: 62, meilleur: null });
    expect(premiere).toContain("Votre première sur ce métier");
    expect(premiere).toContain("référence à battre");
  });

  it("sans record fourni (partie de classe), l'écran n'en parle pas", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan,
      reussites: { acquises: 4, total: 10, derniere: null },
      place: null,
      motDeClassement: null,
    });
    expect(html).not.toContain("record");
    expect(html).not.toContain("IPG");
  });

  it("la première place se dit « 1re », pas « 1e »", () => {
    const html = rendu({
      titre: "Victoire ! Volt domine le marché.",
      victoire: true,
      bilan,
      reussites: { acquises: 9, total: 10, derniere: "Pari tenu" },
      place: { rang: 1, total: 4 },
      motDeClassement: null,
    });
    expect(texteDe(html)).toContain("1re sur 4");
    expect(html).toContain("Victoire");
  });
});

/**
 * LA CLÔTURE EN CÉRÉMONIE (lot P2) : le rang dit une fois, un vrai podium, la
 * courbe des tours, et l'or réservé au verdict.
 */
describe("la clôture en cérémonie", () => {
  const rendu = (props: Parameters<typeof BilanDePartie>[0]) =>
    sansEspacesFines(renderToStaticMarkup(createElement(BilanDePartie, props)));
  const enPerte = bilanDeLaPartie(
    tours(
      [1, 298_000, -2_587, 49_617],
      [2, 298_000, -2_157, 48_460],
      [3, 298_000, -2_127, 12_783],
      [4, 298_000, -4_137, -30_000],
      [5, 298_000, -28_321, -28_200],
      [6, 298_000, -28_388, -27_120],
    ),
  )!;
  const podium = [
    { nom: "Auris", rang: 1, moi: false, ipg: 43.4 },
    { nom: "NOVA", rang: 2, moi: true, ipg: 43.2 },
    { nom: "SoundBox", rang: 3, moi: false, ipg: 41.8 },
  ];
  const bilan = bilanDeLaPartie(
    tours([1, 900, -800, 100], [2, 1200, 100, 200], [3, 1300, 150, 250], [4, 1400, 300, 400]),
  )!;
  const cloture = (html: string) =>
    html.slice(html.indexOf("data-cloture-de-l-exercice"), html.indexOf('data-bilan-lecture'));

  it("le rang n'est écrit qu'une fois, et l'IPG en petit", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan: enPerte,
      reussites: { acquises: 2, total: 9, derniere: null },
      place: { rang: 2, total: 3 },
      motDeClassement: null,
      podium,
    });
    const texte = texteDe(cloture(html));
    // « 2e », « 2e sur 3 », « 2e sur 3 au classement final », la marche :
    // quatre fois avant le lot P2. Une seule désormais.
    expect(texte.match(/\b2e\b/g) ?? []).toHaveLength(1);
    expect(texte).toContain("2e sur 3");
    expect(texte).toContain("Classement final à l'IPG · IPG 43");
    // Pas de pastille « 2 » à côté du rang : la seule pastille est sur la marche.
    expect(cloture(html).match(/class="pastille-rang /g) ?? []).toHaveLength(3);
  });

  it("le podium a trois marches de hauteurs distinctes, la 1re au centre et la plus haute", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan: enPerte,
      reussites: { acquises: 2, total: 9, derniere: null },
      place: { rang: 2, total: 3 },
      motDeClassement: null,
      podium,
    });
    const marches = [...html.matchAll(/data-marche="(\d)"[\s\S]*?class="marche-de-podium marche-de-podium-\d[^"]*\bh-(\d+)\b/g)].map(
      (m) => ({ rang: Number(m[1]), hauteur: Number(m[2]) }),
    );
    // L'ordre de lecture : l'argent, l'or, le bronze.
    expect(marches.map((m) => m.rang)).toEqual([2, 1, 3]);
    const h = Object.fromEntries(marches.map((m) => [m.rang, m.hauteur]));
    expect(h[1]!).toBeGreaterThan(h[2]!);
    expect(h[2]!).toBeGreaterThan(h[3]!);
    // Le nom, l'IPG et « vous » au-dessus des marches.
    for (const nom of ["Auris", "NOVA", "SoundBox"]) expect(html).toContain(nom);
    expect(texteDe(html)).toContain("IPG 43 · vous");
  });

  it("hors du podium, l'équipe est nommée sans réécrire son rang", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan: enPerte,
      reussites: { acquises: 2, total: 9, derniere: null },
      place: { rang: 5, total: 8 },
      motDeClassement: null,
      podium: [...podium.map((m) => ({ ...m, moi: false })), { nom: "Volt", rang: 5, moi: true, ipg: 30 }],
    });
    const texte = texteDe(cloture(html));
    expect(texte.match(/\b5e\b/g) ?? []).toHaveLength(1);
    expect(texte).toContain("5e sur 8");
    expect(texte).toContain("Vous, Volt : hors du podium");
  });

  it("quand tous les tours sont en perte, ni « meilleur tour » ni filet d'or : le tour le plus maîtrisé", () => {
    expect(enPerte.toutEnPerte).toBe(true);
    const html = rendu({
      titre: "Partie terminée.",
      bilan: enPerte,
      reussites: { acquises: 2, total: 9, derniere: null },
      place: null,
      motDeClassement: null,
    });
    expect(html).not.toContain("Votre meilleur tour");
    expect(html).toContain("Votre tour le plus maîtrisé");
    const encadre = html.slice(html.indexOf('data-meilleur-tour="le-plus-maitrise"') - 200);
    expect(encadre.slice(0, encadre.indexOf("</li>"))).not.toMatch(/filet-or|texte-or/);
  });

  it("dès qu'un tour est positif, « Votre meilleur tour » garde son filet d'or", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan,
      reussites: { acquises: 2, total: 9, derniere: null },
      place: null,
      motDeClassement: null,
    });
    expect(bilan.toutEnPerte).toBe(false);
    expect(html).toContain("Votre meilleur tour");
    expect(html).not.toContain("le plus maîtrisé");
    expect(html).toMatch(/data-meilleur-tour="meilleur" class="[^"]*filet-or/);
  });

  it("la courbe des tours trace le résultat net de chaque tour, sur une échelle, avec le zéro", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan: enPerte,
      reussites: { acquises: 2, total: 9, derniere: null },
      place: null,
      motDeClassement: null,
    });
    expect(html).toContain("data-courbe-des-tours");
    // Deux dessins (ordinateur, téléphone), une ligne du zéro chacun.
    expect(html.match(/data-zero=""/g) ?? []).toHaveLength(2);
    expect(html.match(/data-dernier-point=""/g) ?? []).toHaveLength(2);
    // Les six valeurs, dans le tableau lu par une synthèse vocale.
    for (const v of ["−2 587 €", "−28 388 €"]) expect(html).toContain(v);
  });

  it("le lieu de l'entreprise en fond, décoratif ; les actions après la lecture", () => {
    const html = rendu({
      titre: "Partie terminée.",
      bilan: enPerte,
      reussites: { acquises: 2, total: 9, derniere: null },
      place: null,
      motDeClassement: null,
      lieu: { scenario: "nova", secteur: "industrie" },
      children: createElement("a", { href: "/jouer" }, "Rejouer NOVA"),
    });
    expect(html).toMatch(/<img[^>]*aria-hidden="true"[^>]*data-lieu-photo="nova"/);
    expect(html.indexOf("data-bilan-lecture")).toBeLessThan(html.indexOf("Rejouer NOVA"));
  });
});
