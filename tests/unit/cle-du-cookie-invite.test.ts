import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

/**
 * LE COOKIE INVITÉ A SA PROPRE CLÉ (audit d'octobre 2026, P2-7).
 *
 * Il était signé d'AUTH_SECRET lui-même, par la même fonction que la session. Il est
 * maintenant signé d'une clé dérivée pour ce seul usage, différente de celle de la
 * session. Un cookie de l'ancien schéma reste reconnu : il dure un an et il est la seule
 * mémoire des parties solo du joueur ; il est réémis sous la nouvelle clé dès qu'un
 * cookie peut être posé.
 */

vi.mock("next/headers", () => ({ cookies: async () => new Map() }));
vi.mock("@/db", () => ({ db: {} }));

const { signerInvite, lireInvite } = await import("@/lib/guest");
const { cleDerivee } = await import("@/lib/cles");

const RACINE = "racine-de-test";
const ID = "0b9c6a8e-0000-4000-8000-000000000001";
const ancien = (id: string) => `${id}.${createHmac("sha256", RACINE).update(id).digest("hex").slice(0, 32)}`;

describe("cookie invité", () => {
  it("signe d'une clé dérivée, ni AUTH_SECRET ni la clé de session", () => {
    expect(cleDerivee("invite", RACINE)).not.toBe(cleDerivee("session", RACINE));
    expect(signerInvite(ID, RACINE)).not.toBe(ancien(ID));
    expect(lireInvite(signerInvite(ID, RACINE), RACINE)).toEqual({ id: ID, ancien: false });
  });

  it("relit encore un cookie de l'ancien schéma, en le marquant à réémettre", () => {
    expect(lireInvite(ancien(ID), RACINE)).toEqual({ id: ID, ancien: true });
  });

  it("refuse une valeur forgée ou signée d'une autre racine", () => {
    expect(lireInvite(signerInvite(ID, "autre"), RACINE)).toBeNull();
    expect(lireInvite(`${ID}.deadbeef`, RACINE)).toBeNull();
    expect(lireInvite(ID, RACINE)).toBeNull();
  });
});
