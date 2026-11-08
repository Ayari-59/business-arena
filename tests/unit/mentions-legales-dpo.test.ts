import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MentionsLegalesPage from "@/app/mentions-legales/page";
import { VENDEUR } from "@/config/editeur";

/**
 * PAS DE DÉLÉGUÉ À LA PROTECTION DES DONNÉES : LA PAGE LE DIT, ET DIT À QUI ÉCRIRE.
 *
 * Décision du propriétaire : aucun DPO n'est désigné. Les mentions légales doivent le dire
 * dans la partie sur les droits, donner l'adresse de contact déjà utilisée pour les exercer,
 * et rappeler le droit de réclamation auprès de la CNIL. Lu sur la page rendue.
 */

const texte = renderToStaticMarkup(createElement(MentionsLegalesPage))
  .replace(/<[^>]+>/g, " ")
  .replace(/&#x27;|&apos;/g, "'")
  .replace(/\s+/g, " ");

describe("mentions légales : pas de DPO", () => {
  const debutDesDroits = texte.indexOf("vous disposez de droits");
  const finDesDroits = texte.indexOf("Cookies", debutDesDroits);
  const droits = texte.slice(debutDesDroits, finDesDroits);

  it("la partie sur les droits existe", () => {
    expect(debutDesDroits).toBeGreaterThan(0);
    expect(finDesDroits).toBeGreaterThan(debutDesDroits);
  });

  it("dit qu'aucun délégué à la protection des données n'est désigné, et donne l'adresse de contact", () => {
    expect(droits).toMatch(/Aucun délégué à la protection des données \(DPO\) n'est désigné/);
    const phrase = droits.slice(droits.indexOf("Aucun délégué"));
    expect(phrase.slice(0, 250)).toContain(VENDEUR.contact);
  });

  it("rappelle la réclamation auprès de la CNIL", () => {
    expect(droits).toMatch(/réclamation à la CNIL/);
  });

  it("n'ajoute ni téléphone ni autre adresse électronique que celle du contact", () => {
    const adresses = new Set(droits.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []);
    expect([...adresses]).toEqual([VENDEUR.contact]);
    expect(droits).not.toMatch(/(?:\+33|\b0[1-9])(?:[ .]?\d{2}){4}/);
  });
});
