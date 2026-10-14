import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

import {
  CourrierRecommande,
  Enveloppe,
  EnveloppeOuverte,
  Lettre,
  Message,
} from "@/components/courrier";
import { courrierParCode } from "@/config/courriers/registre";
import { COURRIERS_DE_ROUTINE } from "@/config/courriers/routine";
import { LETTRES_DE_MISSION } from "@/config/courriers/mission";
import { destinataireDuCourrier } from "@/config/courriers/destinataire";
import { SCENARIOS } from "@/config/scenarios/registry";

/**
 * LE NOM DE L'ENTREPRISE SUR LE COURRIER.
 *
 * Le propriétaire : « C'est mieux quand le nom de l'entreprise figure à
 * l'en-tête du courrier et sur l'enveloppe. » La fenêtre de l'enveloppe disait
 * « L'entreprise » et la lettre « Votre entreprise ». Le pli est désormais
 * adressé : le nom de l'entreprise, le service visé, comme une lettre
 * d'affaires (bloc expéditeur, bloc destinataire, date, objet).
 */

const html = (el: ReturnType<typeof createElement>) => renderToStaticMarkup(el);
/** Le nom tel que React l'écrit dans le HTML (l'apostrophe échappée, l'esperluette aussi). */
const echappe = (t: string) => t.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");

describe("à qui le courrier est adressé", () => {
  it("en solo, l'entreprise du scénario ; en classe, le nom que l'équipe s'est donné", () => {
    expect(destinataireDuCourrier({ kind: "solo", entreprise: "NOVA", equipe: "NOVA" })).toEqual({
      nom: "NOVA",
      ville: null,
    });
    // Une partie solo d'avant le nettoyage porte « (vous) » : jamais sur l'enveloppe.
    expect(destinataireDuCourrier({ kind: "solo", entreprise: "NOVA", equipe: "NOVA (vous)" }).nom).toBe("NOVA");
    expect(destinataireDuCourrier({ kind: "class", entreprise: "NOVA", equipe: "Les Audacieux" }).nom).toBe(
      "Les Audacieux",
    );
    // Une équipe encore numérotée reçoit le courrier au nom de l'entreprise.
    expect(destinataireDuCourrier({ kind: "class", entreprise: "L'ESCALE", equipe: "Équipe 3" }).nom).toBe(
      "L'ESCALE",
    );
    // Rien d'inventé : pas de ville tant que la partie n'en donne pas.
    expect(destinataireDuCourrier({ kind: "solo", entreprise: "NOVA" }).ville).toBeNull();
    expect(destinataireDuCourrier({ kind: "solo", entreprise: "NOVA", ville: " Brest " }).ville).toBe("Brest");
  });

  it("aucun scénario ne porte de ville : l'adresse n'en invente pas", () => {
    const registre = readFileSync(join(process.cwd(), "src/config/scenarios/registry.ts"), "utf8");
    expect(registre).not.toMatch(/\bville:\s*"/);
  });
});

describe("les neuf entreprises et leurs gammes : le nom sur l'enveloppe et en tête de la lettre", () => {
  const noms = [...new Set(SCENARIOS.map((s) => s.playerTeamName))];

  it("il y a bien neuf entreprises, gammes comprises", () => {
    expect(noms).toHaveLength(9);
    expect(noms).toContain("LA TABLE D'AUGUSTIN");
  });

  it.each(SCENARIOS.map((s) => [s.code, s.playerTeamName, s.scenario.events.map((e) => e.code)] as const))(
    "%s (%s) : chaque pli de sa liasse est adressé",
    (_code, entreprise, codes) => {
      const adresse = destinataireDuCourrier({ kind: "solo", entreprise });
      const tous = [
        ...codes.filter((c) => courrierParCode.has(c)),
        COURRIERS_DE_ROUTINE[0]!.code,
        LETTRES_DE_MISSION[0]!.code,
      ];
      expect(tous.length).toBeGreaterThan(2);
      for (const code of tous) {
        const rendu = html(createElement(CourrierRecommande, { code, adresse, quand: "Trimestre 2" }));
        const c = courrierParCode.get(code);
        // Sur l'objet fermé (enveloppe ou ligne de boîte de réception)…
        if (c?.pli === "email") expect(rendu, code).toContain(`À ${echappe(entreprise)}`);
        else
          expect(rendu, code).toMatch(
            new RegExp(`data-nom-du-destinataire=""[^>]*>${echappe(entreprise).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<`),
          );
        // …et sur la lettre ou le message ouvert.
        expect(rendu.split(echappe(entreprise)).length - 1, code).toBeGreaterThanOrEqual(2);
        expect(rendu, code).not.toContain("Votre entreprise");
        expect(rendu, code).not.toMatch(/>L&#x27;entreprise</);
      }
    },
  );
});

describe("la lettre d'affaires : expéditeur, destinataire, date, objet", () => {
  const adresse = { nom: "LA TABLE D'AUGUSTIN", ville: null };

  it("le bloc destinataire vient sous l'expéditeur, puis la date, puis l'objet", () => {
    const l = html(createElement(Lettre, { code: "bank_penalties", adresse, quand: "Trimestre 4" }));
    const expediteur = l.indexOf(courrierParCode.get("bank_penalties")!.expediteur.replace(/'/g, "&#x27;"));
    const destinataire = l.indexOf("data-destinataire-de-la-lettre");
    const date = l.indexOf("Trimestre 4");
    const objet = l.indexOf("Objet :");
    expect(expediteur).toBeGreaterThan(-1);
    expect(destinataire).toBeGreaterThan(expediteur);
    expect(date).toBeGreaterThan(destinataire);
    expect(objet).toBeGreaterThan(date);
    expect(l).toContain("LA TABLE D&#x27;AUGUSTIN");
    expect(l).toContain("À l&#x27;attention de la direction générale");
    // Aucun utilitaire de couleur du site ne traverse le papier.
    expect(l).not.toMatch(/class="[^"]*\b(?:text|bg|border)-(?:slate|amber|sky|emerald|fuchsia|red)-\d/);
  });

  it("la note de service s'adresse à la direction, sans formule", () => {
    const l = html(createElement(Lettre, { code: "machine_breakdown", adresse }));
    expect(l).toContain("Direction générale");
    expect(l).not.toContain("À l&#x27;attention de");
  });

  it("l'enveloppe porte le nom et la ligne d'attention ; un nom long revient à la ligne", () => {
    const e = html(createElement(Enveloppe, { code: "bank_penalties", liasse: "LA TABLE", adresse }));
    expect(e).toContain('data-destinataire-du-pli=""');
    expect(e).toContain("LA TABLE D&#x27;AUGUSTIN");
    expect(e).toContain("À l&#x27;attention de la direction");
    expect(e).toContain("[overflow-wrap:anywhere]");
    expect(e).toContain("max-w-full");
    expect(e).not.toMatch(/class="[^"]*\b(?:text|bg|border)-(?:slate|amber|sky|emerald|fuchsia|red)-\d/);
    // L'enveloppe posée à côté de la lettre aussi.
    const posee = html(createElement(EnveloppeOuverte, { code: "bank_penalties", adresse }));
    expect(posee).toContain("LA TABLE D&#x27;AUGUSTIN");
    expect(posee).toContain("enveloppe-posee-nom");
  });

  it("le courriel : « À » porte le nom de l'entreprise", () => {
    const email = [...courrierParCode.values()].find((c) => c.pli === "email")!;
    const m = html(createElement(Message, { code: email.code, adresse }));
    expect(m).toContain("LA TABLE D&#x27;AUGUSTIN");
    expect(m).toContain("direction générale");
  });

  it("sans adresse (la liasse imprimée de l'enseignant), le pli reste anonyme", () => {
    const e = html(createElement(Enveloppe, { code: "bank_penalties", destinataire: "Une entreprise" }));
    expect(e).toContain("Une entreprise");
    expect(e).not.toContain("data-nom-du-destinataire");
  });
});
