import { describe, expect, it } from "vitest";
import { momentDeLActivite as brut } from "@/lib/moment-de-l-activite";
import { espacesOrdinaires } from "@/lib/typographie";

const momentDeLActivite = (quand: Date, maintenant: Date) => espacesOrdinaires(brut(quand, maintenant));

/**
 * QUAND UN ÉLÈVE A TRAVAILLÉ POUR LA DERNIÈRE FOIS (audit UX du 11 novembre 2026, P1-2 : la ligne de
 * chaque élève, en tête du suivi de la classe), à l'heure de Paris.
 */
describe("le moment de la dernière activité", () => {
  const maintenant = new Date("2026-11-11T15:30:00Z"); // 16 h 30 à Paris

  it("dans l'heure, les minutes ; le jour même et la veille, l'heure de Paris ; au-delà, le jour", () => {
    expect(momentDeLActivite(new Date("2026-11-11T15:29:40Z"), maintenant)).toBe("à l'instant");
    expect(momentDeLActivite(new Date("2026-11-11T15:25:00Z"), maintenant)).toBe("il y a 5 min");
    expect(momentDeLActivite(new Date("2026-11-11T08:05:00Z"), maintenant)).toBe("aujourd'hui à 09 h 05");
    expect(momentDeLActivite(new Date("2026-11-10T17:45:00Z"), maintenant)).toBe("hier à 18 h 45");
    expect(momentDeLActivite(new Date("2026-11-07T10:00:00Z"), maintenant)).toBe("samedi");
    expect(momentDeLActivite(new Date("2026-10-02T10:00:00Z"), maintenant)).toBe("2 octobre");
  });

  it("une heure ou une durée ne se coupe pas en fin de ligne : espaces insécables", () => {
    expect(brut(new Date("2026-11-11T08:05:00Z"), maintenant)).toBe("aujourd'hui à 09\u00a0h\u00a005");
    expect(brut(new Date("2026-11-11T15:25:00Z"), maintenant)).toBe("il y a 5\u00a0min");
  });

  it("minuit à Paris sépare les jours, pas minuit UTC", () => {
    // 23 h 30 UTC le 10 novembre : 0 h 30 le 11 à Paris, aujourd'hui.
    expect(momentDeLActivite(new Date("2026-11-10T23:30:00Z"), maintenant)).toBe("aujourd'hui à 00 h 30");
  });
});
