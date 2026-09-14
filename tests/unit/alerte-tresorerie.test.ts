import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Le bandeau porte désormais le formulaire de demande de subvention, qui est
// lié à une action serveur — laquelle traverse `@/db`, dont l'import jette sans
// DATABASE_URL. Fermer cette frontière suffit : aucune requête n'est faite ici,
// on ne rend que du HTML.
vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

const { AlerteTresorerie } = await import("@/components/alerte-tresorerie");
type GameView = import("@/services/game-view.service").GameView;

/**
 * UNE ÉQUIPE GELÉE NE VOYAIT RIEN.
 *
 * La cessation de paiements se disait à deux endroits : une ligne rouge dans
 * l'onglet Finance d'une carte de tour — il fallait ouvrir l'onglet —, et le
 * statut « défaillante » dans le classement, que l'animateur révèle quand il
 * le décide. Une entreprise à l'arrêt pouvait donc continuer à recevoir des
 * décisions que le moteur ignorait en silence.
 *
 * Ce que ce test garde : l'alerte dit le montant qui manque et le nombre de
 * tours restants. Sans le montant, l'élève ne sait pas quoi viser ; sans le
 * compte à rebours, il ne sait pas qu'il y en a un.
 */

type Alerte = NonNullable<GameView["alerteTresorerie"]>;

const alerte = (over: Partial<Alerte> = {}): Alerte => ({
  crise: true,
  defaillante: false,
  toursConsecutifs: 1,
  toursAvantDefaillance: 2,
  tresorerieNette: -76000,
  plafondDecouvert: 30000,
  manque: 46000,
  financementObligatoire: true,
  ...over,
});

type Props = Parameters<typeof AlerteTresorerie>[0];
const rendu = (a: Alerte, extra: Partial<Props> = {}) =>
  renderToStaticMarkup(
    createElement(AlerteTresorerie, { gameId: "partie-test", alerte: a, ...extra }),
  );

/** Une exigence de sauvetage : par défaut, le mur (les deux leviers épuisés). */
const exigence = (over: Partial<NonNullable<Props["exigence"]>> = {}) => ({
  manque: 46000,
  capaciteEmprunt: 10000,
  enveloppeApport: 6000,
  ...over,
});

describe("AlerteTresorerie", () => {
  it("en crise, elle dit ce qui manque et ce qui arrive si rien ne change", () => {
    const html = rendu(alerte());
    expect(html).toMatch(/46\s000\s€/);
    expect(html).toMatch(/30\s000\s€/);
    // Un compte à rebours qu'on ne voit pas n'en est pas un.
    expect(html).toContain("Encore un tour");
    // Et les leviers sont nommés : on ne demande pas de deviner.
    expect(html).toContain("Emprunt");
    expect(html).toContain("apport des associés");
  });

  it("le compte à rebours s'accorde avec le nombre de tours restants", () => {
    const html = rendu(alerte({ toursConsecutifs: 1, toursAvantDefaillance: 4 }));
    expect(html).toContain("Encore 3 tours");
  });

  it("défaillante, elle dit l'arrêt et le seul chemin qui en sort", () => {
    const html = rendu(alerte({ defaillante: true, toursConsecutifs: 2 }));
    expect(html).toContain("cessation de paiements");
    expect(html).toContain("ne produit plus");
    // Le montant du retour à flot, pas seulement le constat de l'arrêt.
    expect(html).toMatch(/46\s000\s€/);
    expect(html).not.toContain("Encore");
  });

  it("c'est une alerte, au sens des lecteurs d'écran", () => {
    // Un bandeau que seule la couleur signale n'existe pas pour tout le monde.
    expect(rendu(alerte())).toContain('role="alert"');
    expect(rendu(alerte({ defaillante: true }))).toContain('role="alert"');
  });

  it("au pied du mur, elle ouvre la demande de subvention et chiffre ce qui manquerait", () => {
    // LE CAS QUI FAISAIT L'IMPASSE : emprunt et apport utilisés à fond, et le
    // compte n'y est toujours pas. L'équipe ne pouvait ni jouer ni renoncer.
    const html = rendu(alerte(), { exigence: exigence() });
    expect(html).toContain("Demande de subvention exceptionnelle");
    // 46 000 − 10 000 − 6 000 : ce que l'aide aurait à couvrir, proposé et plafonné.
    expect(html).toMatch(/30\s000\s€/);
    expect(html).toContain('name="montant"');
    expect(html).toContain('name="motif"');
  });

  it("tant qu'il reste un levier, aucune demande n'est proposée", () => {
    // La porte de l'aide exceptionnelle ne s'ouvre pas à qui n'a pas d'abord
    // poussé les siennes.
    const html = rendu(alerte(), {
      exigence: exigence({ capaciteEmprunt: 60000, enveloppeApport: 0 }),
    });
    expect(html).not.toContain("Demande de subvention exceptionnelle");
  });

  it("en solo, elle le dit plutôt que d'ouvrir un formulaire sans destinataire", () => {
    const html = rendu(alerte(), { exigence: exigence({ avecAnimateur: false }) });
    expect(html).not.toContain('name="montant"');
    expect(html).toContain("sans filet");
  });

  it("une fois la demande déposée, elle en donne l'état plutôt que le formulaire", () => {
    const attente = rendu(alerte(), {
      exigence: exigence(),
      demande: {
        id: "d1",
        roundIndex: 3,
        montant: 30000,
        motif: "Écouler le stock invendu.",
        statut: "pending",
        montantAccorde: null,
        note: null,
      },
    });
    expect(attente).not.toContain('name="montant"');
    expect(attente).toContain("doit encore l&#x27;instruire");

    const accordee = rendu(alerte(), {
      exigence: exigence(),
      demande: {
        id: "d1",
        roundIndex: 3,
        montant: 30000,
        motif: "Écouler le stock invendu.",
        statut: "granted",
        montantAccorde: 25000,
        note: "Accordé une fois, pas deux.",
      },
    });
    expect(accordee).toMatch(/25\s000\s€/);
    expect(accordee).toContain("encaissée à la clôture");
    expect(accordee).toContain("Accordé une fois, pas deux.");

    const refusee = rendu(alerte(), {
      exigence: exigence(),
      demande: {
        id: "d1",
        roundIndex: 3,
        montant: 30000,
        motif: "Écouler le stock invendu.",
        statut: "refused",
        montantAccorde: null,
        note: null,
      },
    });
    expect(refusee).toContain("refusée");
    expect(refusee).not.toContain('name="montant"');
  });
});
