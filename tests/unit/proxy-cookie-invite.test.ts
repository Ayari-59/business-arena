import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "@/proxy";
import { COOKIE_INVITE, DUREE_COOKIE_INVITE_S } from "@/lib/cookie-invite";

/**
 * LE COOKIE INVITÉ SE PROLONGE À CHAQUE VISITE, ET NE SE FABRIQUE JAMAIS.
 *
 * Il est la seule mémoire de qui est le joueur. Le proxy renvoie la valeur reçue
 * avec une durée neuve ; sans cookie, il n'en crée pas — c'est au rendu, qui
 * sait le signer, de le faire.
 */

function requete(cookie?: string) {
  return new NextRequest("https://exemple.test/jouer", {
    headers: cookie ? { cookie: `${COOKIE_INVITE}=${cookie}` } : {},
  });
}

describe("proxy du cookie invité", () => {
  it("renvoie le cookie reçu avec une durée d'un an à partir de maintenant", () => {
    const reponse = proxy(requete("abc.def"));
    const pose = reponse.cookies.get(COOKIE_INVITE);
    expect(pose?.value).toBe("abc.def");
    expect(reponse.headers.get("set-cookie")).toContain(`Max-Age=${DUREE_COOKIE_INVITE_S}`);
    expect(reponse.headers.get("set-cookie")).toMatch(/HttpOnly/i);
    expect(reponse.headers.get("set-cookie")).toMatch(/SameSite=lax/i);
  });

  it("ne crée jamais de cookie pour un visiteur qui n'en a pas", () => {
    expect(proxy(requete()).headers.get("set-cookie")).toBeNull();
  });

  it("ne tourne que sur les pages de jeu, et seulement avec le cookie", () => {
    const sources = config.matcher.map((m) => m.source);
    expect(sources).toEqual(["/", "/jouer", "/profile", "/reprendre", "/arena/:path*"]);
    for (const m of config.matcher) {
      expect(m.has).toEqual([{ type: "cookie", key: COOKIE_INVITE }]);
    }
  });
});
