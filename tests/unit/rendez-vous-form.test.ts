import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { RendezVousForm } from "@/components/rendez-vous-form";

/**
 * LE FORMULAIRE MONTRE LES CRÉNEAUX ET RECUEILLE QUI APPELER.
 * Les créneaux viennent de la page ; le formulaire les affiche par jour, retient
 * le choix dans un champ caché, et demande nom, établissement, numéro, e-mail.
 */
const jours = [
  {
    date: "2026-09-17",
    libelle: "jeudi 17 septembre",
    creneaux: [
      { iso: "2026-09-17T10:00:00.000Z", heure: "12 h 00" },
      { iso: "2026-09-17T12:30:00.000Z", heure: "14 h 30" },
    ],
  },
  { date: "2026-09-18", libelle: "vendredi 18 septembre", creneaux: [{ iso: "2026-09-18T07:00:00.000Z", heure: "9 h 00" }] },
];

describe("rendez-vous : le formulaire", () => {
  const html = renderToStaticMarkup(createElement(RendezVousForm, { jours }));

  it("affiche les jours et les heures du premier jour", () => {
    expect(html).toContain("jeudi 17 septembre");
    expect(html).toContain("12 h 00");
    expect(html).toContain("14 h 30");
    expect(html).toContain("2 libres");
    expect(html).toContain("1 libres");
  });

  it("recueille qui appeler, sous des noms de champs lus par l'action", () => {
    for (const champ of ["creneau", "nom", "etablissement", "telephone", "email", "message"]) {
      expect(html, champ).toContain(`name="${champ}"`);
    }
    expect(html).toContain('name="site"');
    expect(html).toMatch(/<label class="hidden"[^>]*aria-hidden="true"/);
    // Sans créneau choisi, on ne peut pas envoyer.
    expect(html).toMatch(/<button type="submit" disabled=""/);
  });

  it("sans créneau libre, le dit et renvoie vers l'orientation", () => {
    const vide = renderToStaticMarkup(createElement(RendezVousForm, { jours: [] }));
    expect(vide).toContain("Aucun créneau libre");
    expect(vide).toContain('href="/orientation"');
  });

  it("une fois réservé, le créneau se dit en toutes lettres et le bouton s'efface", () => {
    const apres = renderToStaticMarkup(
      createElement(RendezVousForm, {
        jours,
        initial: { error: null, ok: { quand: "jeudi 17 septembre à 14 h 30", email: "prof@lycee.fr", dansAgenda: true }, values: null },
      }),
    );
    expect(apres).toContain("Rendez-vous confirmé");
    expect(apres).toContain("jeudi 17 septembre à 14 h 30");
    expect(apres).toContain("prof@lycee.fr");
    expect(apres).toContain("invitation d&#x27;agenda");
    expect(apres).not.toContain("Réserver ce créneau");
  });

  it("après un échec, la saisie et le créneau choisi reviennent", () => {
    const rejoue = renderToStaticMarkup(
      createElement(RendezVousForm, {
        jours,
        initial: {
          error: "Numéro de téléphone invalide",
          ok: null,
          values: { creneau: "2026-09-18T07:00:00.000Z", nom: "Mme Martin", etablissement: "Lycée Pasteur", telephone: "x", email: "m@l.fr", message: "" },
        },
      }),
    );
    expect(rejoue).toContain("Numéro de téléphone invalide");
    expect(rejoue).toContain('value="Mme Martin"');
    expect(rejoue).toContain('value="2026-09-18T07:00:00.000Z"');
    expect(rejoue).toContain("vendredi 18 septembre à 9 h 00");
  });
});
