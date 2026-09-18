import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BandeauCourriers,
  courriersQuiMeConcernent,
  type CourrierAnnonce,
} from "@/components/bandeau-courriers";

/**
 * LE COURRIER DISTRIBUÉ SE VOIT SANS DÉFILER, QUEL QUE SOIT L'ONGLET.
 *
 * Constaté en production : l'annonce d'un courrier distribué par l'enseignant
 * était rendue en bas de l'onglet Situation, invisible depuis l'onglet
 * Décisions. Le bandeau se pose au-dessus des onglets, et ne montre à une
 * équipe que ce qui s'applique à elle.
 */

const MARCHE: CourrierAnnonce = {
  code: "raw_material_spike",
  teamId: null,
  teamName: null,
  isMyTeam: false,
};
const POUR_MOI: CourrierAnnonce = {
  code: "machine_breakdown",
  teamId: "eq-1",
  teamName: "Équipe 1",
  isMyTeam: true,
};
const POUR_UNE_AUTRE: CourrierAnnonce = {
  code: "machine_breakdown",
  teamId: "eq-2",
  teamName: "Équipe 2",
  isMyTeam: false,
};

function rendu(courriers: CourrierAnnonce[]): string {
  return renderToStaticMarkup(createElement(BandeauCourriers, { courriers }));
}

describe("BandeauCourriers", () => {
  it("un courrier de marché : expéditeur, objet, effet, destinataire et lien vers la lettre", () => {
    const html = rendu([MARCHE]);
    expect(html).toContain("Revalorisation de nos tarifs");
    expect(html).toContain("Électro-Composants Rhin");
    expect(html).toContain("Coût des matières +20 % pendant 2 tours");
    expect(html).toContain("Tout le marché");
    expect(html).toContain('href="#situation"');
    expect(html).toContain("vous adresse un courrier");
  });

  it("un courrier adressé à mon entreprise est signalé comme tel", () => {
    const html = rendu([POUR_MOI]);
    expect(html).toContain("Votre entreprise");
    expect(html).toContain("Arrêt de la ligne principale");
  });

  it("un courrier adressé à une autre entreprise ne m'est pas annoncé", () => {
    expect(rendu([POUR_UNE_AUTRE])).toBe("");
    expect(courriersQuiMeConcernent([POUR_UNE_AUTRE, MARCHE])).toEqual([MARCHE]);
  });

  it("sans courrier, rien n'est rendu", () => {
    expect(rendu([])).toBe("");
  });

  it("plusieurs courriers : le titre s'accorde", () => {
    const html = rendu([MARCHE, POUR_MOI]);
    expect(html).toContain("vous adresse des courriers");
  });
});

describe("place du bandeau dans l'arène", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "app", "arena", "[gameId]", "page.tsx"),
    "utf8",
  );

  it("le bandeau est rendu avant l'accordéon de périodes, pas dedans", () => {
    const bandeau = source.indexOf("<BandeauCourriers");
    // On vise l'OUVERTURE de l'accordéon, pas n'importe quel parcours de
    // `periods` : l'en-tête en fait un aussi, pour la frise des tours.
    const accordeon = source.indexOf("{periods.map((p) => {");
    expect(bandeau).toBeGreaterThan(-1);
    expect(accordeon).toBeGreaterThan(-1);
    expect(bandeau).toBeLessThan(accordeon);
  });

  it("la lettre entière reste dans la période active", () => {
    // On vérifie que le bloc détaillé EXISTE, pas sa formulation : son titre ne
    // répète plus le bandeau mot pour mot — c'était le doublon que le bandeau
    // avait créé — et figer la phrase ici ferait échouer ce test sur une simple
    // retouche de texte. Sa place, elle, ne se lit pas dans l'ordre du fichier :
    // les sections sont déclarées en constantes avant d'être posées dans la page.
    expect(source).toContain("<CourrierRecommande");
    expect(source).toContain("annonce");
  });
});
