import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Le retour du bilan garde la partie par une action serveur, dans un effet : au rendu statique, rien ne part.
vi.mock("@/app/entreprises/episode/actions", () => ({ enregistrerPartieAction: vi.fn() }));

import { EcranDeLEpisode, nouvelEtat, plageDeLaPrevision, type EtatDeLEpisode } from "@/components/episode/episode-joue";
import { cleDeLaPartie, gesteDeReprise, lireLesFaits, type FaitsDeLaPartie } from "@/components/episode/faits-de-la-partie";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import { introServie, reglagesDesNiveaux, servirLaPartie, type DemandeDePartie } from "@/pedagogy/episodes/partie-servie";

/**
 * UN ÉPISODE REPREND AU MÊME ÉCRAN, ET L'ATTENTE NE VIDE PLUS LA PAGE (décisions du propriétaire du 11 novembre
 * 2026 ; audit UX du même jour, P1-6, P2-3, P2-4, P2-5).
 *  · Les faits de la partie se gardent dans le stockage de session (graine, niveau, écran, décisions,
 *    vérifications, diagnostic, prévision), rien de la vue du serveur ni aucun texte saisi ; au
 *    rechargement, le serveur rejoue la partie à partir d'eux et rend l'écran où l'on était.
 *  · Pendant l'attente, la scène garde sa hauteur, et l'en-tête n'avance qu'avec la réponse.
 *  · « Démonstration » seulement pour une démonstration jouée hors licence.
 *  · Une prévision hors de sa plage le dit sous le champ.
 */

const ep = episodeParCode("trimestre-qui-derape")!;
const n = ep.etapes.length;
const NIVEAUX = ["decouverte", "standard", "expert"] as const;
const GESTES = Object.fromEntries(
  ["maj", "onNiveau", "commencer", "recommencer", "suivante", "consulter", "valider", "etapeSuivante", "reessayer", "autreHasard", "memeHasard"].map((g) => [g, () => {}]),
) as never;

const rendre = (s: EtatDeLEpisode, props: { licence?: boolean; hauteurReservee?: number | null } = {}) =>
  renderToStaticMarkup(
    createElement(EcranDeLEpisode, {
      intro: introServie(ep),
      reglages: reglagesDesNiveaux(),
      niveaux: NIVEAUX,
      offre: null,
      licence: props.licence ?? true,
      cours: null,
      s,
      choisi: s.niveau ?? "standard",
      hauteurReservee: props.hauteurReservee ?? null,
      gestes: GESTES,
    }),
  );

const servir = (geste: DemandeDePartie["geste"], decisions: number[], fin: DemandeDePartie["fin"] = null) =>
  servirLaPartie(ep, { code: ep.code, geste, niveau: "standard", graine: 11, decisions, consultes: ep.etapes.map(() => []), fin, precedente: null }, { sansLicence: false });

/** Les faits d'une partie arrêtée à la conséquence de la première décision. */
const faitsALaConsequence = (): FaitsDeLaPartie => ({
  v: 1,
  code: ep.code,
  graine: 11,
  cle: "00000000-0000-4000-8000-000000000000",
  niveau: "standard",
  ecran: "jeu",
  etape: 0,
  phase: "consequence",
  decisions: [1],
  consultes: ep.etapes.map(() => []),
  jours: 0,
  diagnostic: { principal: ep.diagnostics[0]!.id, second: null },
  reevaluation: { choix: null, principal: null },
  prevision: { valeur: "34", confiance: 60 },
  choix: 1,
  precedente: null,
});

describe("les faits de la partie, gardés dans l'onglet", () => {
  it("se relisent tels quels, et seulement s'ils tiennent dans l'épisode", () => {
    const f = faitsALaConsequence();
    expect(lireLesFaits(JSON.parse(JSON.stringify(f)), ep.code, n, NIVEAUX)).toEqual(f);
    expect(lireLesFaits(f, "un-autre-episode", n, NIVEAUX)).toBeNull();
    expect(lireLesFaits({ ...f, v: 2 }, ep.code, n, NIVEAUX)).toBeNull();
    // Un niveau que l'accès n'ouvre plus : la partie repart de l'introduction.
    expect(lireLesFaits(f, ep.code, n, ["decouverte"])).toBeNull();
    // À la conséquence, la décision de l'étape est prise ; avant, non.
    expect(lireLesFaits({ ...f, decisions: [] }, ep.code, n, NIVEAUX)).toBeNull();
    expect(lireLesFaits({ ...f, phase: "decision" }, ep.code, n, NIVEAUX)).toBeNull();
    expect(lireLesFaits({ ...f, phase: "decision", decisions: [] }, ep.code, n, NIVEAUX)).not.toBeNull();
    expect(lireLesFaits({ ...f, ecran: "bilan" }, ep.code, n, NIVEAUX)).toBeNull();
    expect(lireLesFaits("n'importe quoi", ep.code, n, NIVEAUX)).toBeNull();
    expect(lireLesFaits({ ...f, consultes: [["x".repeat(61)], ...f.consultes.slice(1)] }, ep.code, n, NIVEAUX)).toBeNull();
  });

  it("rien de la vue du serveur ni aucun texte saisi : ce qui se relit, ce sont des faits", () => {
    const f = faitsALaConsequence();
    const brut = { ...f, vue: { bilan: "le corrigé" }, justifications: ["Ce que j'attends"] };
    const lu = lireLesFaits(brut, ep.code, n, NIVEAUX)!;
    expect(Object.keys(lu).sort()).toEqual(Object.keys(f).sort());
    expect(JSON.stringify(lu)).not.toContain("le corrigé");
    // L'écran ne garde que ces faits : ni la vue, ni la justification ne vont au stockage.
    const source = readFileSync("src/components/episode/episode-joue.tsx", "utf8");
    const garde = source.slice(source.indexOf("const faits: FaitsDeLaPartie = {"), source.indexOf("window.sessionStorage.setItem(cleDeSession"));
    expect(garde).not.toMatch(/\bvue\b|justifications|attente|erreur/);
    expect(source).toContain("window.sessionStorage.setItem(cleDeSession, JSON.stringify(faits))");
    expect(cleDeLaPartie(ep.code)).toBe(`episode:${ep.code}:partie`);
  });

  it("le serveur rejoue la partie à partir d'eux et rend l'écran où l'on était", () => {
    const f = faitsALaConsequence();
    expect(gesteDeReprise(f)).toBe("valider");
    expect(gesteDeReprise({ ecran: "jeu", phase: "signal" })).toBe("verifier");
    expect(gesteDeReprise({ ecran: "bilan", phase: "consequence" })).toBe("valider");
    // La conséquence de la première décision, rejouée, est celle qu'on avait vue.
    const vue = servir(gesteDeReprise(f), f.decisions);
    expect(vue.consequence?.indice).toBe(0);
    expect(vue).toEqual(servir("valider", [1]));
    // Une étape en cours se relit comme une vérification, qui ne change rien.
    const avant = servir("verifier", [1]);
    expect(avant.etape?.indice).toBe(1);
    expect(avant.consequence).toBeNull();
  });
});

describe("pendant l'attente, la page garde sa hauteur et l'en-tête n'avance qu'avec la réponse", () => {
  it("la conséquence attendue : l'en-tête reste à la décision, la phrase reste, la scène garde sa hauteur", () => {
    // La décision 1 vient d'être validée : la vue est encore celle du geste d'avant (l'étape 1).
    const vueDeLEtape = servir("commencer", []);
    const attente: EtatDeLEpisode = {
      ...nouvelEtat(n, 11, "standard", null),
      ecran: "jeu",
      etape: 0,
      phase: "consequence",
      decisions: [1],
      vue: vueDeLEtape,
      attente: "valider",
    };
    const html = rendre(attente, { hauteurReservee: 812 });
    expect(html).toContain("Les semaines passent…");
    expect(html).toContain("min-height:812px");
    // L'en-tête dit le moment de la décision, pas « Fin de semaine ».
    expect(html).not.toContain("Fin de semaine");
    expect(html).toContain(vueDeLEtape.etape!.moment.replace(/'/g, "&#x27;"));
    // La décision n'est pas encore comptée prise, et le fil montre la décision.
    expect(html).toContain('aria-label="Décision 1, en cours"');
    expect(html).not.toContain('aria-label="Décision 1, prise"');
    expect(html).toMatch(/aria-current="step"[^>]*>(?:(?!<\/li>).)*Décision<\/li>/);
    // La réponse arrive : l'en-tête avance avec elle.
    const repondu = rendre({ ...attente, vue: servir("valider", [1]), attente: null });
    expect(repondu).toMatch(/Fin de semaine \d/);
    expect(repondu).toContain('aria-label="Décision 1, prise"');
    expect(repondu).not.toContain("min-height");
  });

  it("le trimestre qui se prépare : « Avant de commencer » jusqu'à la première étape", () => {
    const html = rendre({ ...nouvelEtat(n, 11, "standard", null), ecran: "jeu", attente: "commencer" }, { hauteurReservee: 1200 });
    expect(html).toContain("Le trimestre se prépare…");
    expect(html).toContain("Avant de commencer");
    expect(html).toContain("min-height:1200px");
    expect(html).not.toContain(", en cours");
  });
});

describe("le badge et la plage de la prévision", () => {
  it("« Données fictives » sous licence, « Démonstration » seulement hors licence", () => {
    const intro = { ...nouvelEtat(n), niveau: "standard" as const };
    const sous = rendre(intro, { licence: true });
    expect(sous).toContain(">Données fictives<");
    expect(sous).not.toContain("Démonstration · données fictives");
    expect(rendre({ ...intro, niveau: "decouverte" }, { licence: false })).toContain(">Démonstration · données fictives<");
  });

  it("une prévision hors de sa plage dit « Entre 0 et 100 % » sous le champ", () => {
    expect(plageDeLaPrevision({ min: 0, max: 100, unite: "%" })).toBe("Entre 0 et 100 %");
    expect(plageDeLaPrevision({ min: -500, max: 1000, unite: "k€" })).toBe("Entre −500 et 1 000 k€");
    expect(plageDeLaPrevision({ min: 0, max: 60, unite: " " })).toBe("Entre 0 et 60");
    const vue = servir("commencer", []);
    const decision: EtatDeLEpisode = { ...nouvelEtat(n, 11, "standard", null), ecran: "jeu", phase: "decision", vue, diagnostic: { principal: ep.diagnostics[0]!.id, second: null } };
    const p = vue.etape!.prevision!;
    const hors = rendre({ ...decision, prevision: { valeur: String(p.max * 11), confiance: 60 } });
    expect(hors).toContain(plageDeLaPrevision(p).replace(/ (%|k€)/, " $1"));
    expect(hors).toContain('aria-invalid="true"');
    const dedans = rendre({ ...decision, prevision: { valeur: String(p.min), confiance: 60 } });
    expect(dedans).not.toContain("data-prevision-hors-plage");
    // Vide, la décision ne se valide pas, sans message : rien n'est encore écrit.
    expect(rendre({ ...decision, prevision: { valeur: "", confiance: 60 } })).not.toContain("data-prevision-hors-plage");
  });
});
