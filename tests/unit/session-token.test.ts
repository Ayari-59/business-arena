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

const { DUREE_SESSION_MS, decodeToken, encodeToken } = await import("@/lib/session");

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
