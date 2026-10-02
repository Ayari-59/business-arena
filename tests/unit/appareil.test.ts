import { describe, expect, it } from "vitest";
import { detecterTelephone } from "../../src/lib/appareil";

/**
 * Ce que dit la requête de l'appareil, et ce qu'on en tire : un tiroir fermé par
 * défaut ne doit viser que les téléphones.
 */
const entetes = (h: Record<string, string>) => ({
  get: (nom: string) => h[nom.toLowerCase()] ?? null,
});

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const ORDINATEUR =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const IPAD =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

describe("détection d'un téléphone", () => {
  it("l'indice des navigateurs récents fait foi, dans les deux sens", () => {
    expect(
      detecterTelephone(
        entetes({ "sec-ch-ua-mobile": "?1", "user-agent": ORDINATEUR }),
      ),
    ).toBe(true);
    expect(
      detecterTelephone(
        entetes({ "sec-ch-ua-mobile": "?0", "user-agent": IPHONE }),
      ),
    ).toBe(false);
  });

  it("sans indice (Safari), l'agent utilisateur tranche", () => {
    expect(detecterTelephone(entetes({ "user-agent": IPHONE }))).toBe(true);
    expect(detecterTelephone(entetes({ "user-agent": ANDROID }))).toBe(true);
  });

  it("un ordinateur et une tablette reçoivent l'affichage large", () => {
    expect(detecterTelephone(entetes({ "user-agent": ORDINATEUR }))).toBe(
      false,
    );
    expect(detecterTelephone(entetes({ "user-agent": IPAD }))).toBe(false);
  });

  it("sans aucun en-tête, ce n'est pas un téléphone : l'affichage complet est le repli sûr", () => {
    expect(detecterTelephone(entetes({}))).toBe(false);
  });
});
