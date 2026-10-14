import { describe, expect, it } from "vitest";
import {
  COURRIERS,
  COURRIERS_MARCHE_CODES,
  courrierParCode,
  courriersPourCodes,
} from "../src/config/courriers/registre";
import { dureeDuCourrier } from "../src/config/courriers/types";
import { RSE_CARD_CODES } from "../src/engine/rse";
import { SCENARIOS } from "../src/config/scenarios/registry";

// Les courriers RSE sont TRANSVERSES : appelés par le moteur sur le standing
// de l'entreprise, ils n'appartiennent à aucun scénario et n'ont pas
// d'événement de scénario correspondant. On les tient donc à part de
// l'invariant « un courrier ⇔ un événement de scénario ».
const RSE_CODES = new Set<string>(Object.values(RSE_CARD_CODES));

describe("le registre du courrier", () => {
  it("chaque événement de chaque scénario a son courrier, et réciproquement", () => {
    // Deux scénarios du même métier partagent la même liasse : NOVA en une
    // référence et NOVA en trois jouent les mêmes événements, sous les mêmes
    // codes. Un code d'événement ne compte donc qu'une fois.
    const eventCodes = [
      ...new Set(SCENARIOS.flatMap((d) => d.scenario.events.map((e) => e.code))),
    ].sort();
    const codesDuCourrier = COURRIERS.map((c) => c.code)
      .filter((c) => !RSE_CODES.has(c))
      .sort();
    expect(codesDuCourrier).toEqual(eventCodes);
  });

  it("les courriers RSE transverses existent et s'adressent à l'entreprise", () => {
    for (const code of RSE_CODES) {
      const courrier = courrierParCode.get(code);
      expect(courrier, `courrier RSE manquant : ${code}`).toBeDefined();
      expect(courrier!.scope).toBe("team");
    }
  });

  it("aucun code de courrier n'est partagé entre deux secteurs", () => {
    const codes = COURRIERS.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("le destinataire du courrier reflète la portée de l'événement", () => {
    for (const definition of SCENARIOS) {
      for (const event of definition.scenario.events) {
        const courrier = courrierParCode.get(event.code);
        expect(courrier, `courrier manquant pour ${event.code}`).toBeDefined();
        expect(courrier!.scope, `portée incohérente pour ${event.code}`).toBe(
          event.scope === "company" ? "team" : "market",
        );
      }
    }
  });

  it("un courrier a toujours un expéditeur, un objet, un corps et une signature", () => {
    for (const c of COURRIERS) {
      expect(c.expediteur.length, c.code).toBeGreaterThan(5);
      expect(c.objet.length, c.code).toBeGreaterThan(8);
      expect(c.corps.length, c.code).toBeGreaterThan(60);
      expect(c.signataire.length, c.code).toBeGreaterThan(2);
      expect(c.effet.length, c.code).toBeGreaterThan(5);
      expect(c.enJeu.length, c.code).toBeGreaterThan(10);
    }
  });

  it("le corps de la lettre ne se contente pas de répéter son objet", () => {
    for (const c of COURRIERS) {
      expect(c.corps.toLowerCase(), c.code).not.toContain(c.objet.toLowerCase());
    }
  });

  it("une mise en demeure part en recommandé ; rien n'engage tout le monde", () => {
    for (const c of COURRIERS) {
      if (/mise en demeure|fermeture administrative|sanction|notification d'attribution/i.test(c.objet)) {
        expect(c.pli, `${c.code} engage : il part en recommandé`).toBe("recommande");
      }
    }
    // Les deux plis existent : tout envoyer en recommandé banaliserait l'alerte.
    expect(COURRIERS.some((c) => c.pli === "recommande")).toBe(true);
    expect(COURRIERS.some((c) => c.pli === "simple")).toBe(true);
  });

  it("la distribution générale exclut les plis adressés (équité)", () => {
    const companyScoped = SCENARIOS.flatMap((d) =>
      d.scenario.events.filter((e) => e.scope === "company").map((e) => e.code),
    );
    for (const code of companyScoped) {
      expect(COURRIERS_MARCHE_CODES).not.toContain(code);
    }
    expect(COURRIERS_MARCHE_CODES.length).toBeGreaterThanOrEqual(8);
    for (const code of COURRIERS_MARCHE_CODES) expect(courrierParCode.has(code)).toBe(true);
  });

  it("chaque secteur a sa liasse : on ne distribue jamais le courrier d'un autre", () => {
    for (const definition of SCENARIOS) {
      const codes = definition.scenario.events.map((e) => e.code);
      const liasse = courriersPourCodes(codes);
      expect(liasse.map((c) => c.code).sort()).toEqual([...codes].sort());
      // et chaque liasse permet d'animer une classe : les deux destinataires existent
      expect(liasse.some((c) => c.scope === "market")).toBe(true);
      expect(liasse.some((c) => c.scope === "team")).toBe(true);
    }
  });
});

/**
 * CE QUE LE COURRIER ANNONCE, LE MOTEUR LE FAIT.
 *
 * Le texte de l'effet est écrit à la main ; les modificateurs du moteur sont
 * dans le scénario. Rien ne les reliait : un courrier pouvait annoncer +20 %
 * là où le moteur appliquait ×1,15, ou « 1 400 palettes » là où il en ajoutait
 * 900 (constaté sur ROUTE & CIE). Cette garde lit le texte de chaque lettre et
 * le confronte à la définition de l'événement :
 *   · la durée (« pendant 2 tours », sinon un tour) est celle du moteur ;
 *   · le pourcentage annoncé (+20 %, −10 %, ×1,5) est l'un des multiplicateurs ;
 *   · la quantité d'une commande ferme est celle ajoutée par le moteur.
 * Un courrier sans chiffre lisible échoue aussi : l'élève doit pouvoir calculer.
 */
describe("le courrier dit ce que le moteur fait", () => {
  const lire = (label: string) => {
    const pct = label.match(/([+−-])\s?(\d+(?:[.,]\d+)?)\s?%/);
    if (pct) return { genre: "pct" as const, valeur: (pct[1] === "+" ? 1 : -1) * Number(pct[2]!.replace(",", ".")) };
    const mul = label.match(/×\s?(\d+(?:[.,]\d+)?)/);
    if (mul) return { genre: "pct" as const, valeur: Math.round((Number(mul[1]!.replace(",", ".")) - 1) * 100) };
    // « Commande ferme de 900 palettes » ou « +600 unités (échelle trimestre) » :
    // une quantité absolue, celle que le moteur ajoute (base trimestre).
    const commande =
      label.match(/[Cc]ommande ferme de (\d[\d\s\u202f\u00a0]*)/) ??
      label.match(/^\+\s?(\d[\d\s\u202f\u00a0]*)\s[^%]/);
    if (commande) return { genre: "commande" as const, valeur: Number(commande[1]!.replace(/[\s\u202f\u00a0]/g, "")) };
    return null;
  };

  const evenements = new Map<string, { code: string; duration: number; modifiers: { target: string; op: string; value: number }[] }>();
  for (const d of SCENARIOS) for (const ev of d.scenario.events) if (!evenements.has(ev.code)) evenements.set(ev.code, ev);

  for (const [code, ev] of evenements) {
    const courrier = courrierParCode.get(code);
    if (!courrier) continue; // couvert par « chaque événement a son courrier »
    it(`${code} : durée et effet annoncés = ceux du moteur`, () => {
      expect(dureeDuCourrier(courrier), "durée").toBe(ev.duration);
      const annonce = lire(courrier.effet);
      expect(annonce, `chiffre lisible dans « ${courrier.effet} »`).not.toBeNull();
      if (annonce!.genre === "pct") {
        const multiplicateurs = ev.modifiers.filter((m) => m.op === "mul").map((m) => Math.round((m.value - 1) * 100));
        expect(multiplicateurs, "un multiplicateur").not.toHaveLength(0);
        expect(multiplicateurs, `« ${courrier.effet} » vs ${JSON.stringify(ev.modifiers)}`).toContain(annonce!.valeur);
      } else {
        const commande = ev.modifiers.find((m) => m.target === "order" && m.op === "add");
        expect(commande, "une commande ferme dans le moteur").toBeDefined();
        expect(commande!.value, `« ${courrier.effet} »`).toBe(annonce!.valeur);
      }
    });
  }
});

