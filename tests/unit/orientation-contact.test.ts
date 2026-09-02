import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrientationForm } from "@/components/orientation-form";

/**
 * LA PAGE D'ORIENTATION NE PARLE PAS DE SA CONFIGURATION.
 *
 * Constaté en production : sous la recommandation, tout visiteur lisait
 * « L'adresse de contact n'est pas encore renseignée : la recommandation
 * ci-dessus reste valable, seul l'envoi du message manque. » C'est un état
 * interne de la plateforme, adressé à l'administrateur, servi à l'enseignant.
 *
 * La règle : avec une adresse, le bouton d'envoi est là ; sans adresse, il
 * n'est pas là, et rien ne vient l'expliquer.
 */

const ETAT_INTERNE = "pas encore renseignée";

function rendu(contactEmail: string): string {
  return renderToStaticMarkup(createElement(OrientationForm, { contactEmail }));
}

describe("orientation : exposition de l'adresse de contact", () => {
  it("sans adresse configurée, aucun message d'état interne n'est servi", () => {
    const html = rendu("");
    expect(html).not.toContain(ETAT_INTERNE);
    expect(html).not.toContain("mailto:");
    expect(html).toContain("Ce que nous vous conseillons");
  });

  it("avec une adresse configurée, le bouton d'envoi est actif et le message absent", () => {
    const html = rendu("contact@example.org");
    expect(html).not.toContain(ETAT_INTERNE);
    expect(html).toContain("mailto:contact@example.org");
    expect(html).toContain("Nous écrire avec ce profil");
  });
});
