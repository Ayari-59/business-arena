import { describe, expect, it, vi } from "vitest";

/**
 * LE JETON DE SESSION : SIGNÉ, DATÉ, VERSIONNÉ.
 *
 * Constaté (audit croisé §07) : le cookie signait « id.rôle », sans date ni
 * révocation. Ici, la partie pure : un jeton se relit s'il est signé, complet
 * et non expiré ; l'ancien format, un jeton forgé sans exp, un jeton expiré
 * ou signé d'une autre clé sont refusés.
 */

vi.mock("next/headers", () => ({ cookies: async () => new Map() }));
vi.mock("@/db", () => ({ db: {} }));

const { DUREE_SESSION_MS, DUREE_MAXIMALE_SESSION_MS, FIN_DES_JETONS_SANS_CLE_DERIVEE, decodeToken, encodeToken } =
  await import("@/lib/session");
const { createHmac } = await import("node:crypto");

const CLE = "cle-de-test";
const NOW = 1_800_000_000_000;

function jeton(surcharge: Partial<Parameters<typeof encodeToken>[0]> = {}) {
  return encodeToken(
    { id: "prof-1", role: "teacher", v: 1, iat: NOW, exp: NOW + DUREE_SESSION_MS, ...surcharge },
    CLE,
  );
}

describe("decodeToken", () => {
  it("relit un jeton signé, complet et à jour", () => {
    expect(decodeToken(jeton(), NOW + 1000, CLE)).toEqual({
      id: "prof-1",
      role: "teacher",
      v: 1,
      iat: NOW,
      exp: NOW + DUREE_SESSION_MS,
      auth: NOW,
    });
  });

  it("refuse un jeton expiré", () => {
    expect(decodeToken(jeton(), NOW + DUREE_SESSION_MS + 1, CLE)).toBeNull();
  });

  it("refuse un jeton forgé sans exp, ou l'ancien format « id.rôle.signature »", () => {
    const sansExp = Buffer.from(JSON.stringify({ id: "prof-1", role: "teacher", v: 1, iat: NOW }))
      .toString("base64url");
    // Même signé correctement, il manque exp : refusé.
    const signe = encodeToken({ id: "x", role: "teacher", v: 1, iat: 0, exp: 0 }, CLE).split(".")[1];
    expect(decodeToken(`${sansExp}.${signe}`, NOW, CLE)).toBeNull();
    expect(decodeToken("prof-1.teacher.deadbeefdeadbeefdeadbeefdeadbeef", NOW, CLE)).toBeNull();
    expect(decodeToken("", NOW, CLE)).toBeNull();
    expect(decodeToken(undefined, NOW, CLE)).toBeNull();
  });

  it("refuse un jeton signé avec une autre clé, ou dont le corps a été modifié", () => {
    expect(decodeToken(jeton(), NOW, "autre-cle")).toBeNull();
    const [corps, signature] = jeton().split(".") as [string, string];
    const corpsModifie = Buffer.from(
      JSON.stringify({ id: "admin", role: "teacher", v: 1, iat: NOW, exp: NOW + DUREE_SESSION_MS }),
    ).toString("base64url");
    expect(decodeToken(`${corpsModifie}.${signature}`, NOW, CLE)).toBeNull();
    expect(decodeToken(`${corps}.${signature.replace(/^./, "0")}`, NOW, CLE)).toBeNull();
  });

  it("porte la version de session : un jeton de version 1 reste lisible comme tel", () => {
    // C'est getSession qui compare à la version du compte ; le jeton, lui,
    // dit seulement pour quelle version il a été émis.
    expect(decodeToken(jeton({ v: 3 }), NOW, CLE)?.v).toBe(3);
  });
});

/**
 * LA CLÉ PROPRE À LA SESSION, ET LA DURÉE MAXIMALE ABSOLUE (audit d'octobre 2026, P2-7 et P2-8).
 *
 * Le jeton est signé d'une clé dérivée d'AUTH_SECRET pour ce seul usage. Un jeton signé
 * avec AUTH_SECRET lui-même (l'ancien schéma) reste lu tant qu'il a été émis avant la fin
 * de la transition : pas de déconnexion en masse, et le renouvellement glissant le
 * réémet sous la nouvelle clé. La session, renouvelée ou non, ne dépasse pas une durée
 * maximale comptée depuis la connexion.
 */
describe("clé dérivée et durée maximale", () => {
  const ancienJeton = (p: Record<string, unknown>) => {
    const corps = Buffer.from(JSON.stringify(p), "utf8").toString("base64url");
    return `${corps}.${createHmac("sha256", CLE).update(corps).digest("hex").slice(0, 32)}`;
  };
  const AVANT = FIN_DES_JETONS_SANS_CLE_DERIVEE - 10 * 24 * 3600 * 1000;

  it("ne signe plus avec AUTH_SECRET lui-même", () => {
    const [corps, signature] = jeton().split(".") as [string, string];
    expect(signature).not.toBe(createHmac("sha256", CLE).update(corps).digest("hex").slice(0, 32));
  });

  it("relit un jeton de l'ancien schéma émis avant la fin de la transition, sa connexion datée de iat", () => {
    const t = ancienJeton({ id: "prof-1", role: "teacher", v: 1, iat: AVANT, exp: AVANT + DUREE_SESSION_MS });
    expect(decodeToken(t, AVANT + 1000, CLE)?.auth).toBe(AVANT);
  });

  it("refuse un jeton de l'ancien schéma émis après la fin de la transition", () => {
    const apres = FIN_DES_JETONS_SANS_CLE_DERIVEE + 1;
    const t = ancienJeton({ id: "prof-1", role: "teacher", v: 1, iat: apres, exp: apres + DUREE_SESSION_MS });
    expect(decodeToken(t, apres + 1000, CLE)).toBeNull();
  });

  it("refuse une session renouvelée au-delà de la durée maximale depuis la connexion", () => {
    const connexion = NOW - DUREE_MAXIMALE_SESSION_MS - 1;
    // Renouvelée hier : exp encore loin, mais la connexion a plus que la durée maximale.
    const t = jeton({ iat: NOW - 1000, exp: NOW + DUREE_SESSION_MS, auth: connexion });
    expect(decodeToken(t, NOW, CLE)).toBeNull();
    const juste = jeton({ iat: NOW - 1000, exp: NOW + DUREE_SESSION_MS, auth: connexion + 2 });
    expect(decodeToken(juste, NOW, CLE)?.auth).toBe(connexion + 2);
  });

  it("une durée maximale nommée, plus longue que la durée glissante", () => {
    expect(DUREE_MAXIMALE_SESSION_MS).toBe(90 * 24 * 60 * 60 * 1000);
    expect(DUREE_MAXIMALE_SESSION_MS).toBeGreaterThan(DUREE_SESSION_MS);
  });
});
