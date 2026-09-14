import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * LE GUICHET DE L'ANIMATEUR.
 *
 * C'est le seul endroit du jeu où une décision n'est prise ni par une équipe
 * ni par le moteur, mais par une personne. Ce que ce test garde : qu'il ne
 * s'affiche pas quand il n'a rien à dire, qu'il donne à lire l'histoire de
 * l'équipe avant de demander une réponse, et qu'il ne laisse pas accorder une
 * aide qui n'arriverait nulle part.
 */

// Le panneau est lié aux actions serveur de l'espace enseignant, qui chargent
// `@/db` — lequel jette à l'import sans DATABASE_URL. On ne rend que du HTML.
vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

const { SubventionsPanel } = await import("@/components/subventions-panel");
type TeacherGameView = import("@/services/game.service").TeacherGameView;
type Demande = TeacherGameView["aidRequests"][number];

const demande = (over: Partial<Demande> = {}): Demande => ({
  id: "d1",
  teamId: "t1",
  teamName: "Les Tisserands",
  roundIndex: 3,
  montant: 30000,
  motif: "Tenir un tour de plus pour écouler le stock invendu.",
  statut: "pending",
  montantAccorde: null,
  note: null,
  encoreUtile: true,
  ...over,
});

const rendu = (demandes: Demande[]) =>
  renderToStaticMarkup(
    createElement(SubventionsPanel, { gameId: "partie-test", demandes }),
  );

describe("SubventionsPanel", () => {
  it("sans dossier, il ne s'affiche pas du tout", () => {
    // Un panneau vide sur la page de pilotage serait un bruit permanent pour
    // un dispositif que la plupart des parties ne toucheront jamais.
    expect(rendu([])).toBe("");
  });

  it("il donne à lire l'équipe, le tour, le montant et le motif", () => {
    const html = rendu([demande()]);
    expect(html).toContain("Les Tisserands");
    expect(html).toContain("tour 3");
    expect(html).toMatch(/30\s000\s€/);
    expect(html).toContain("stock invendu");
    // Les deux réponses possibles, et un mot à laisser.
    expect(html).toContain("Accorder");
    expect(html).toContain("Refuser");
    expect(html).toContain('name="note"');
  });

  it("le montant accordé est modifiable, mais jamais au-delà du demandé", () => {
    // Une faute de frappe de l'animateur ne doit pas offrir un million à une
    // équipe : le dossier fixe le plafond.
    expect(rendu([demande()])).toContain('max="30000"');
  });

  it("sur un tour déjà clos, accorder est fermé et la raison est dite", () => {
    const html = rendu([demande({ encoreUtile: false })]);
    expect(html).toContain("déjà clos");
    expect(html).toMatch(/Accorder[^<]*<\/button>/);
    expect(html).toContain("disabled");
  });

  it("les dossiers tranchés restent lisibles, avec la réponse donnée", () => {
    const html = rendu([
      demande({
        id: "d2",
        statut: "granted",
        montantAccorde: 15000,
        note: "Accordé une fois, pas deux.",
      }),
    ]);
    expect(html).toMatch(/15\s000\s€/);
    expect(html).toContain("accordée");
    expect(html).toContain("Accordé une fois, pas deux.");
    // Et plus aucun bouton : une réponse donnée ne se reprend pas.
    expect(html).not.toContain("Refuser");
  });
});
