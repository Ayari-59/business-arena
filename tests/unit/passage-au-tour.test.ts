import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PassageAuTour } from "@/components/passage-au-tour";

/**
 * L'ÉTAPE ENTRE LES RÉSULTATS ET LA DÉCISION SUIVANTE.
 *
 * La boucle à enseigner est : décider → voir → COMPRENDRE → décider mieux.
 * L'écran donnait les deux bouts en même temps, et rien n'obligeait à s'arrêter
 * au milieu.
 *
 * Deux règles à garder, et elles tirent en sens contraire : l'étape doit
 * exister quand il y a quelque chose à lire, et disparaître quand il n'y a rien
 * — au premier tour, elle ne ferait que retarder l'entrée dans le jeu.
 *
 * Le rendu serveur montre toujours l'état FERMÉ (`getServerSnapshot` vaut
 * false) : c'est exactement ce qu'on veut vérifier ici, puisque c'est ce que
 * voit un élève qui arrive.
 */

const rendu = (labelPrecedent: string | null) => {
  // Les props passent par une variable, comme dans tiroir.test.ts : en objet
  // littéral, `children` déclencherait `react/no-children-prop`, et en
  // troisième argument de createElement, TypeScript le réclamerait quand même
  // dans les props.
  const props: Parameters<typeof PassageAuTour>[0] = {
    gameId: "partie-1",
    tour: 2,
    labelTour: "Tour 2",
    labelPrecedent,
    children: createElement("p", null, "le formulaire de décision"),
  };
  return renderToStaticMarkup(createElement(PassageAuTour, props));
};

describe("PassageAuTour", () => {
  it("au premier tour, aucune étape : il n'y a rien à lire avant", () => {
    const html = rendu(null);
    expect(html).toContain("le formulaire de décision");
    expect(html).not.toContain("Passer au");
  });

  it("après un tour clos, le formulaire cède la place à l'invitation", () => {
    const html = rendu("Tour 1");
    // Le formulaire n'est pas seulement masqué : il n'est pas rendu.
    expect(html).not.toContain("le formulaire de décision");
    // Et l'écran dit où sont les résultats, et ce que fait le bouton.
    expect(html).toContain("Tour 1");
    expect(html).toContain("Passer au tour 2");
  });

  it("l'étape nomme les deux tours : celui qu'on quitte et celui qu'on ouvre", () => {
    // Un repli qui ne dit pas ce qu'il cache est un contenu perdu — la même
    // règle que les tiroirs de l'arène.
    const html = rendu("Trimestre 3");
    expect(html).toContain("Trimestre 3");
    expect(html).toContain("Passer au tour 2");
  });

  it("c'est un bouton, pas un lien : rien ne navigue", () => {
    // Le tour s'ouvre sur place. Un lien promettrait un changement de page et
    // ferait perdre le brouillon de décision en cours de saisie.
    const html = rendu("Tour 1");
    expect(html).toContain('type="button"');
    expect(html).not.toContain("<a ");
  });
});
