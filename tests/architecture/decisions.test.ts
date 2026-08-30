import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DIFFICULTY_PRESETS } from "../../src/config/difficulty";
import { etendueDesDecisions, LEVIERS, leviersDuNiveau } from "../../src/config/decisions";

/**
 * Le registre des leviers de décision.
 *
 * Il sert à deux choses qui ne se parlent pas : annoncer sur la page d'accueil
 * combien de décisions une équipe prend par tour, et donner l'ordre du
 * formulaire. Rien dans le langage n'oblige le registre et le formulaire à
 * rester d'accord, et un désaccord ne casse rien de visible : la page annonce
 * simplement un nombre faux, ce que personne ne remarque.
 */
const FORMULAIRE = readFileSync("src/components/decision-form.tsx", "utf-8");
const ACCUEIL = readFileSync("src/app/page.tsx", "utf-8");

/** Les `name` des champs de décision réellement posés par le formulaire. */
const champsDuFormulaire = new Set(
  // Deux écritures cohabitent : l'attribut JSX `name="…"` et la propriété
  // `name: "…"` des études, qui sont posées depuis une liste.
  [...FORMULAIRE.matchAll(/name[:=]\s*"([A-Za-z_]+)"/g)]
    .map((m) => m[1]!)
    // Ces deux là ne sont pas des décisions de gestion : l'un porte le choix du
    // modèle d'analyse, l'autre le champ technique du bouton de validation.
    .filter((n) => !["quiz_model_choice", "options"].includes(n)),
);

describe("leviers de décision", () => {
  it("chaque champ du formulaire est un levier déclaré", () => {
    const inconnus = [...champsDuFormulaire].filter(
      (champ) => !LEVIERS.some((l) => l.champ === champ),
    );
    expect(
      inconnus,
      `champs présents à l'écran et absents du registre : ${inconnus.join(", ")}`,
    ).toEqual([]);
  });

  it("aucun levier déclaré ne manque au formulaire", () => {
    // L'inverse compte autant : un levier retiré de l'écran mais laissé au
    // registre gonflerait le nombre annoncé sur la page d'accueil.
    const fantomes = LEVIERS.filter((l) => !champsDuFormulaire.has(l.champ));
    expect(
      fantomes.map((l) => l.champ),
      "leviers déclarés que le formulaire ne pose plus",
    ).toEqual([]);
  });

  it("un niveau plus élevé ouvre plus de décisions, jamais moins", () => {
    const comptes = DIFFICULTY_PRESETS.map((p) => leviersDuNiveau(p.level).length);
    for (let i = 1; i < comptes.length; i += 1) {
      expect(
        comptes[i],
        `niveau ${DIFFICULTY_PRESETS[i]!.level} : ${comptes[i]} décisions contre ${comptes[i - 1]} au précédent`,
      ).toBeGreaterThanOrEqual(comptes[i - 1]!);
    }
    const { minimum, maximum } = etendueDesDecisions();
    expect(minimum).toBeGreaterThan(0);
    expect(maximum).toBeGreaterThan(minimum);
  });

  it("l'accueil compte les décisions au lieu de les écrire", () => {
    const { minimum, maximum } = etendueDesDecisions();
    expect(ACCUEIL, "la page n'ouvre pas le registre des leviers").toContain(
      "etendueDesDecisions",
    );
    expect(
      ACCUEIL,
      `« ${minimum} » ou « ${maximum} » est écrit en dur dans la page`,
    ).not.toMatch(new RegExp(`${minimum} à ${maximum} décisions`));
  });

  it("le formulaire suit l'ordre du registre", () => {
    // L'ordre du registre est celui du cycle d'exploitation : on vend, on
    // achète, on fait venir les clients, on paie ses équipes, on finance, on se
    // couvre, on s'informe, on prévoit. Le choix du fournisseur se trouvait
    // auparavant en dernier, après l'assurance, alors qu'il fixe le coût
    // d'achat de ce qu'on vend.
    const position = (champ: string) =>
      Math.max(FORMULAIRE.indexOf(`name="${champ}"`), FORMULAIRE.indexOf(`name: "${champ}"`));
    const attendus = LEVIERS.filter((l) => position(l.champ) >= 0);
    const desordre: string[] = [];
    for (let i = 1; i < attendus.length; i += 1) {
      const precedent = attendus[i - 1]!;
      const courant = attendus[i]!;
      if (position(courant.champ) < position(precedent.champ)) {
        desordre.push(`« ${courant.nom} » avant « ${precedent.nom} »`);
      }
    }
    expect(desordre, `ordre du formulaire : ${desordre.join(" ; ")}`).toEqual([]);
  });
});
