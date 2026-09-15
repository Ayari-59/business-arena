import { describe, expect, it, vi } from "vitest";
import { envoyerCourriel } from "@/lib/courriel";

/**
 * L'ENVOI D'UN COURRIEL NE DÉPEND QUE DE L'ENVIRONNEMENT.
 * Sans clé, rien ne part et la fonction le dit ; avec une clé, un seul POST
 * vers Resend, avec le destinataire, le sujet, le texte et l'adresse de
 * réponse. Un refus est un résultat, pas une exception.
 */
const courriel = { a: "contact@example.org", sujet: "Test", texte: "Bonjour", repondreA: "prof@lycee.fr" };

describe("envoyerCourriel", () => {
  it("sans clé : non envoyé, sans appel réseau", async () => {
    const poster = vi.fn();
    const r = await envoyerCourriel(courriel, {}, poster as unknown as typeof fetch);
    expect(r).toEqual({ envoye: false, raison: "non_configure" });
    expect(poster).not.toHaveBeenCalled();
  });

  it("avec une clé : un POST autorisé, le contenu attendu, « Répondre » vers l'enseignant", async () => {
    const poster = vi.fn(async () => ({ ok: true, status: 200 }));
    const r = await envoyerCourriel(
      courriel,
      { RESEND_API_KEY: "re_test", MAIL_FROM: "Business Arena <contact@business-arena.fr>" },
      poster as unknown as typeof fetch,
    );
    expect(r).toEqual({ envoye: true });
    expect(poster).toHaveBeenCalledTimes(1);
    const [url, init] = poster.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      from: "Business Arena <contact@business-arena.fr>",
      to: ["contact@example.org"],
      subject: "Test",
      text: "Bonjour",
      reply_to: "prof@lycee.fr",
    });
  });

  it("un refus du fournisseur est un résultat, pas une exception", async () => {
    const poster = vi.fn(async () => ({ ok: false, status: 422 }));
    const r = await envoyerCourriel(courriel, { RESEND_API_KEY: "re_test" }, poster as unknown as typeof fetch);
    expect(r).toEqual({ envoye: false, raison: "refuse", detail: "HTTP 422" });
  });

  it("un réseau injoignable aussi", async () => {
    const poster = vi.fn(async () => { throw new Error("ECONNRESET"); });
    const r = await envoyerCourriel(courriel, { RESEND_API_KEY: "re_test" }, poster as unknown as typeof fetch);
    expect(r).toMatchObject({ envoye: false, raison: "injoignable" });
  });
});
