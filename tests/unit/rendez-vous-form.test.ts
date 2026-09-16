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
const periode = { debut: "2026-09-16", fin: "2026-10-07" };

describe("rendez-vous : le formulaire", () => {
  const html = renderToStaticMarkup(createElement(RendezVousForm, { jours, periode }));

  it("un calendrier en grille, rien de choisi d'avance : les heures n'apparaissent qu'après le choix d'un jour", () => {
    expect(html).toContain('role="grid"');
    expect(html).toContain("septembre – octobre 2026");
    // Les deux jours libres sont des boutons ; le 19, sans créneau, n'en est pas un.
    expect(html).toContain('aria-label="jeudi 17 septembre, 2 créneaux"');
    expect(html).toContain('aria-label="vendredi 18 septembre, 1 créneaux"');
    expect(html).not.toContain('aria-label="samedi 19 septembre');
    // Semaines complètes, du lundi 14 septembre au dimanche 11 octobre ; le 1er octobre porte son mois.
    expect(html).toContain(">14<");
    expect(html).toContain(">1 oct.<");
    expect(html).not.toContain("12 h 00");
    expect(html).toContain("Choisissez un jour");
    expect(html).not.toContain('aria-pressed="true"');
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
    const vide = renderToStaticMarkup(createElement(RendezVousForm, { jours: [], periode }));
    expect(vide).toContain("Aucun créneau libre");
    expect(vide).toContain('href="/orientation"');
  });

  it("une fois réservé, le créneau se dit en toutes lettres et le bouton s'efface", () => {
    const apres = renderToStaticMarkup(
      createElement(RendezVousForm, {
        jours,
        periode,
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
        periode,
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
    expect(rejoue).toContain('aria-pressed="true"');
  });
});
