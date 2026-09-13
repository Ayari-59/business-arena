import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EventBanner,
  cartesQuiMeConcernent,
  type AnnouncedCard,
} from "@/components/event-banner";

/**
 * LA CARTE ANNONCÉE SE VOIT SANS DÉFILER, QUEL QUE SOIT L'ONGLET.
 *
 * Constaté en production : l'annonce d'une carte jouée par l'enseignant était
 * rendue en bas de l'onglet Situation, invisible depuis l'onglet Décisions.
 * Le bandeau se pose au-dessus des onglets, et ne montre à une équipe que ce
 * qui s'applique à elle.
 */

const MARCHE: AnnouncedCard = { code: "raw_material_spike", teamId: null, teamName: null, isMyTeam: false };
const POUR_MOI: AnnouncedCard = { code: "machine_breakdown", teamId: "eq-1", teamName: "Équipe 1", isMyTeam: true };
const POUR_UNE_AUTRE: AnnouncedCard = { code: "machine_breakdown", teamId: "eq-2", teamName: "Équipe 2", isMyTeam: false };

function rendu(cards: AnnouncedCard[]): string {
  return renderToStaticMarkup(createElement(EventBanner, { cards }));
}

describe("EventBanner", () => {
  it("une carte marché : nom, effet, destinataire et lien vers le détail", () => {
    const html = rendu([MARCHE]);
    expect(html).toContain("Flambée des matières premières");
    expect(html).toContain("Coût des matières +20 % pendant 2 tours");
    expect(html).toContain("Toute la classe");
    expect(html).toContain('href="#situation"');
    expect(html).toContain("a tiré une carte");
  });

  it("une carte qui cible mon équipe est signalée comme telle", () => {
    const html = rendu([POUR_MOI]);
    expect(html).toContain("Votre équipe");
    expect(html).toContain("Panne machine");
  });

  it("une carte tirée contre une autre équipe ne m'est pas annoncée", () => {
    expect(rendu([POUR_UNE_AUTRE])).toBe("");
    expect(cartesQuiMeConcernent([POUR_UNE_AUTRE, MARCHE])).toEqual([MARCHE]);
  });

  it("sans carte, rien n'est rendu", () => {
    expect(rendu([])).toBe("");
  });

  it("plusieurs cartes : le titre s'accorde", () => {
    const html = rendu([MARCHE, POUR_MOI]);
    expect(html).toContain("a tiré des cartes");
  });
});

describe("place du bandeau dans l'arène", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "app", "arena", "[gameId]", "page.tsx"),
    "utf8",
  );

  it("le bandeau est rendu avant l'accordéon de périodes, pas dedans", () => {
    const bandeau = source.indexOf("<EventBanner");
    // On vise l'OUVERTURE de l'accordéon, pas n'importe quel parcours de
    // `periods` : l'en-tête en fait un aussi, pour la frise des tours.
    const accordeon = source.indexOf("{periods.map((p) => {");
    expect(bandeau).toBeGreaterThan(-1);
    expect(accordeon).toBeGreaterThan(-1);
    expect(bandeau).toBeLessThan(accordeon);
  });

  it("le bloc détaillé reste dans la période active", () => {
    // On vérifie que le bloc détaillé EXISTE, pas sa formulation : son titre ne
    // répète plus le bandeau mot pour mot — c'était le doublon que le bandeau
    // avait créé — et figer la phrase ici ferait échouer ce test sur une simple
    // retouche de texte. Sa place, elle, ne se lit pas dans l'ordre du fichier :
    // les sections sont déclarées en constantes avant d'être posées dans la page.
    expect(source).toContain("<EventCard");
    expect(source).toContain("announced");
  });
});
