import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { ApercuArene, ApercuPilotage, ApercuProjection } from "@/components/apercus";

/**
 * TROIS CAPTURES DE MÊME HAUTEUR.
 *
 * Mesurés côte à côte, les trois aperçus de la page enseignants faisaient 358,
 * 202 et 222 pixels : un écart de 156 px, trois bas de carte en escalier et
 * trois légendes à trois hauteurs différentes. Trois captures alignées disent
 * « voici le produit » ; trois cartes en escalier disent « voici trois bouts
 * de page ».
 *
 * L'alignement ne tient à aucune hauteur écrite en dur — il n'y en a pas, et il
 * ne faut pas qu'il y en ait : le contenu de chaque aperçu peut changer. Il
 * tient à quatre classes, que ce fichier nomme une par une, parce qu'en retirer
 * une seule rouvre l'escalier sans que rien ne le signale.
 */

const rendus = {
  arene: renderToStaticMarkup(createElement(ApercuArene, {})),
  projection: renderToStaticMarkup(createElement(ApercuProjection, {})),
  pilotage: renderToStaticMarkup(createElement(ApercuPilotage, {})),
};

/** La première balise d'un rendu, avec ses attributs. */
const figure = (html: string) => html.slice(0, html.indexOf(">") + 1);

/** Le cadre : la div qui suit immédiatement la figure. */
const cadre = (html: string) => {
  const apres = html.slice(html.indexOf(">") + 1);
  return apres.slice(0, apres.indexOf(">") + 1);
};

describe("les trois aperçus s'alignent", () => {
  for (const [nom, html] of Object.entries(rendus)) {
    it(`${nom} : la figure prend toute sa case, le cadre prend tout le reste`, () => {
      // La grille étire ses cases par défaut ; encore faut-il que la figure
      // occupe la sienne, sinon elle garde la hauteur de son contenu.
      expect(figure(html)).toContain("h-full");
      expect(figure(html)).toContain("flex-col");
      // Le cadre prend ce que la légende laisse : c'est lui qui s'égalise.
      expect(cadre(html)).toContain("flex-1");
      // Et il est lui-même une boîte flexible, pour que son contenu s'étire
      // avec lui au lieu de laisser un fond vide sous lui.
      expect(cadre(html)).toMatch(/class="[^"]*\bflex\b/);
    });

    it(`${nom} : la légende a une boîte de hauteur fixe`, () => {
      // Sans elle, une légende plus longue d'un mot reprendrait une ligne à SON
      // cadre, et l'escalier reviendrait sans qu'on voie pourquoi.
      const legende = html.slice(html.indexOf("<figcaption"));
      expect(legende.slice(0, legende.indexOf(">"))).toContain("min-h-8");
    });

    it(`${nom} : aucune hauteur écrite en dur`, () => {
      // Une hauteur figée alignerait les trois cadres aujourd'hui et les
      // ferait déborder au premier mot ajouté dans l'un d'eux.
      expect(html).not.toMatch(/\bh-\[\d/);
      expect(html).not.toMatch(/style="[^"]*height/);
    });
  }

  it("la console de pilotage pose son geste au bas du panneau", () => {
    // C'est elle qui reçoit le plus d'espace en trop. Il tombe sous le tableau,
    // là où une vraie console met son bouton — et non en bas de page, sous un
    // fond vide.
    expect(rendus.pilotage).toContain("mt-auto");
    expect(rendus.pilotage.indexOf("mt-auto")).toBeGreaterThan(
      rendus.pilotage.indexOf("</table>"),
    );
  });

  it("l'écran projeté garde son contenu au centre", () => {
    // Un écran projeté qui grandit garde son code au milieu : c'est ce que
    // voit une classe.
    expect(rendus.projection).toContain("justify-center");
  });
});
