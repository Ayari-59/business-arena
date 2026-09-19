import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * LA LIASSE À IMPRIMER : ce qu'on tient dans les mains en classe.
 *
 * Deux manques réparés, que ces tests tiennent :
 *
 *   1. LE CHOIX DE LA LIASSE NE VIVAIT QUE DANS L'ADRESSE. Le lien de la page
 *      de partie renseignait `?scenario=`, celui du guide non : on tombait sur
 *      la première liasse venue, sans pouvoir en changer autrement qu'en
 *      éditant l'URL à la main.
 *
 *   2. LES COURRIERS DE ROUTINE NE S'IMPRIMAIENT JAMAIS. Ils ne sont attachés
 *      à aucun scénario — c'est leur nature, ils comblent les tours où rien ne
 *      tombe. En séance papier, l'enseignant n'avait donc rien à donner ces
 *      tours-là, ce qui vide de son sens la règle du facteur qui passe
 *      toujours.
 */

let recherche = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(recherche),
  useRouter: () => ({ replace: () => {} }),
}));

async function page(query: string): Promise<string> {
  recherche = query;
  const { default: Page } = await import("@/app/teacher/courriers/print/page");
  return renderToStaticMarkup(createElement(Page));
}

describe("la liasse se choisit sur la page", () => {
  it("le sélecteur propose une liasse par secteur, sans doublon de gamme", async () => {
    const html = await page("scenario=hotel");
    for (const nom of [
      "NOVA", "MAILLE &amp; CO", "L&#x27;ESCALE", "LA TABLE D&#x27;AUGUSTIN",
      "ATLAS CONSEIL", "PIXEL &amp; CO", "VOLT FITNESS", "MARTEL &amp; FILS", "ROUTE &amp; CIE",
    ]) {
      expect(html, `${nom} manque au sélecteur`).toContain(nom);
    }
    // Un secteur et sa variante « gamme » jouent le même courrier : une seule
    // entrée, sinon l'enseignant choisit entre deux liasses identiques.
    // Neuf secteurs, plus les deux piles qui n'en dépendent pas : les courriers
    // de routine et les lettres de mission.
    const options = html.match(/<option /g) ?? [];
    expect(options.length, "neuf secteurs et deux piles hors secteur").toBe(11);
    expect(html).toContain("Courriers de routine");
    expect(html).toContain("Lettres de mission");
  });

  it("sans paramètre, la page reste utilisable : le sélecteur est là", async () => {
    // La faute d'origine : arriver par le guide et se retrouver coincé sur une
    // liasse qu'on n'a pas demandée.
    expect(await page("")).toContain('id="liasse"');
  });
});

describe("le format de la feuille", () => {
  /** Le nombre de plis de chaque feuille, dans l'ordre. */
  function plisParFeuille(html: string): number[] {
    return html
      .split('class="print-sheet"')
      .slice(1)
      .map((morceau) => (morceau.match(/class="print-pair"/g) ?? []).length);
  }

  it("A4 portrait : l'enseignant n'a pas à tourner la feuille", async () => {
    /*
     * La liasse s'imprimait en paysage. Le format était juste au millimètre,
     * mais il demandait de penser à changer l'orientation : une imprimante de
     * salle des profs sort du portrait par défaut, et un paysage imprimé en
     * portrait rogne la moitié des plis.
     */
    const html = await page("scenario=hotel");
    expect(html).toContain("A4 portrait");
    expect(html).not.toContain("A4 landscape");
  });

  it("trois plis par feuille, jamais quatre", async () => {
    // Un pli de 138 mm ne tient qu'une fois sur les 198 mm utiles d'une A4
    // portrait : ils s'empilent par trois. Vérifié au navigateur, le PDF sort
    // exactement une page par feuille — aucune ne déborde.
    for (const q of ["scenario=hotel", "scenario=routine", "scenario=nova"]) {
      const compte = plisParFeuille(await page(q));
      expect(compte.length, `${q} n'a produit aucune feuille`).toBeGreaterThan(0);
      for (const n of compte) {
        expect(n, `une feuille porte ${n} plis : ${q}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it("le pli garde sa taille : c'est la lettre qui devait rester lisible", async () => {
    // La tentation, en portrait, était d'en remettre quatre en les rétrécissant.
    // Chaque moitié serait tombée à 47 mm, et le texte avec.
    const html = await page("scenario=hotel");
    expect(html).toContain("width: 138mm");
    expect(html).toContain("height: 92mm");
  });
});

describe("la liasse de routine", () => {
  it("s'imprime, et elle est seule à le faire sans scénario", async () => {
    const html = await page("scenario=routine");
    expect(html).toContain("Courriers de routine");
    expect(html).toContain("Situation intermédiaire au terme du trimestre");
  });

  it("n'annonce ni courrier de marché ni lettre vierge", async () => {
    // Les six sont tous adressés à une entreprise, et ils ne s'inventent pas :
    // une section de marché vide ou une lettre vierge n'auraient rien à dire.
    const html = await page("scenario=routine");
    expect(html).not.toContain("Courrier de marché");
    expect(html).not.toContain("lettre vierge");
  });

  it("ne promet pas une saisie dans l'application, qui n'existe pas pour eux", async () => {
    // Ces courriers ne correspondent à aucun événement du moteur : les
    // présenter comme distribuables enseignerait un geste impossible.
    const html = await page("scenario=routine");
    expect(html).not.toContain("saisissez-le dans l&#x27;application");
    expect(html).toContain("ne changent aucun compte");
  });

  it("le secteur, lui, garde sa lettre vierge et ses deux sections", async () => {
    const html = await page("scenario=hotel");
    expect(html).toContain("Courrier de marché");
    expect(html).toContain("Plis adressés");
    expect(html).toContain("lettre vierge");
  });
});
