import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { PreuvesDusageBande } from "@/components/preuves-dusage";
import {
  PLANCHER,
  PREUVES_PUBLIEES_PAR_DEFAUT,
  assezPourEtreDit,
  type PreuvesPubliees,
} from "@/config/preuves-dusage";

/**
 * PROUVER L'USAGE SANS L'INVENTER.
 *
 * « Adopté par des centaines d'enseignants » sous un témoignage signé d'un
 * prénom ne prouve rien : c'est invérifiable, et c'est le défaut du cockpit aux
 * chiffres inventés qu'on vient de retirer de l'accueil. Ce qui doit tenir :
 *
 * · LE PLANCHER : en dessous, on n'affiche rien. Trois parties prouveraient
 *   l'inverse de ce qu'on leur demande.
 * · AUCUN NOM : des totaux, et rien qui descende à la ligne près.
 * · LE RELEVÉ EST DATÉ : un compteur sans date ne se vérifie pas.
 * · CE QUI SE PUBLIE EST UN RÉGLAGE : un compteur exact peut desservir la page
 *   qui le porte (« classes créées : 0 »), et le remède est de ne pas le
 *   publier, jamais de maquiller la valeur. La bande ne rend donc que les
 *   compteurs demandés, et rien du tout s'il n'en reste aucun.
 */

const TOUS: PreuvesPubliees = { parties: true, tours: true, decisions: true, classes: true };

const rendu = (
  preuves: Parameters<typeof PreuvesDusageBande>[0]["preuves"],
  publiees: PreuvesPubliees = TOUS,
) => renderToStaticMarkup(createElement(PreuvesDusageBande, { preuves, publiees }));

const releve = (parties: number, tours: number) => ({
  parties,
  tours,
  decisions: 1234,
  classes: 42,
  releveLe: new Date("2026-09-27T10:00:00Z"),
});

describe("les preuves d'usage", () => {
  it("se taisent tant que les chiffres ne prouvent rien", () => {
    expect(assezPourEtreDit({ parties: PLANCHER.parties - 1, tours: 9999 })).toBe(false);
    expect(assezPourEtreDit({ parties: 9999, tours: PLANCHER.tours - 1 })).toBe(false);
    expect(assezPourEtreDit({ parties: PLANCHER.parties, tours: PLANCHER.tours })).toBe(true);
    // Et sans relevé du tout, la bande disparaît au lieu d'afficher des zéros.
    expect(rendu(null)).toBe("");
  });

  it("donne les quatre totaux et la date du relevé", () => {
    const html = rendu(releve(120, 640));
    expect(html).toContain("120");
    expect(html).toContain("640");
    // Le séparateur de milliers français est une espace fine insécable : on
    // le demande à la même source que le composant plutôt que de le taper.
    expect(html).toContain((1234).toLocaleString("fr-FR"));
    expect(html).toContain("parties jouées");
    expect(html).toContain("tours résolus");
    expect(html).toContain("décisions prises");
    expect(html).toContain("classes créées");
    // L'attribut est rendu en `dateTime` par le rendu statique ; HTML ne
    // distingue pas la casse des attributs, on ne la teste donc pas non plus.
    expect(html.toLowerCase()).toContain('datetime="2026-09-27"');
  });

  it("ne publie que les compteurs demandés", () => {
    // Le réglage par défaut tait « classes créées », qui vaut zéro sur une
    // page destinée aux enseignants. La valeur n'est pas touchée : elle n'est
    // pas publiée.
    expect(PREUVES_PUBLIEES_PAR_DEFAUT.classes).toBe(false);
    const parDefaut = rendu(releve(120, 640), PREUVES_PUBLIEES_PAR_DEFAUT);
    expect(parDefaut).toContain("parties jouées");
    expect(parDefaut).not.toContain("classes créées");
    // Et si plus rien n'est demandé, la bande entière disparaît plutôt que de
    // poser un titre au-dessus du vide.
    expect(
      rendu(releve(120, 640), { parties: false, tours: false, decisions: false, classes: false }),
    ).toBe("");
  });

  it("compte les décisions que son libellé annonce", () => {
    // Le compteur comptait le statut `validated`. Or une ligne validée passe à
    // `locked` dès que son tour est résolu : il ne comptait donc que les
    // décisions dont le tour n'est pas encore tombé — « 2 » à côté de « 317
    // tours résolus ». Et à la résolution, les sept concurrents pilotés par
    // l'ordinateur reçoivent une ligne eux aussi : les compter multiplierait
    // le chiffre par huit.
    const source = readFileSync(
      join(process.cwd(), "src/services/preuves-dusage.service.ts"),
      "utf8",
    );
    expect(source).toContain('inArray(decisions.status, ["validated", "locked"])');
    expect(source).toContain('eq(teams.controller, "human")');
    expect(source).not.toMatch(/\$\{decisions\.status\} = 'validated'/);
  });

  it("ne nomme personne, et le dit", () => {
    const html = rendu(releve(120, 640));
    expect(html).toContain("comptés dans la base du site");
    expect(html).toMatch(/Aucun établissement/);
  });

  it("ne lit que des totaux, jamais une ligne", () => {
    // La garde qui compte : une requête qui ramènerait des lignes nommées
    // (un établissement, un enseignant) n'aurait rien à faire sur une page
    // publique. Le service ne sait compter que des entiers.
    const source = readFileSync(
      join(process.cwd(), "src/services/preuves-dusage.service.ts"),
      "utf8",
    );
    const requetes = source.match(/db\s*\n?\s*\.select\(\{[^}]*\}\)/g) ?? [];
    expect(requetes.length).toBeGreaterThan(0);
    for (const r of requetes) {
      expect(r, `une requête ne compte pas : ${r}`).toMatch(/count\(/);
    }
    // Et rien n'en sort qui ne soit un nombre ou une date.
    expect(source).not.toMatch(/\.name\b|\bemail\b|pseudo/);
  });

  it("survit à une base absente", () => {
    // Une vitrine ne tombe pas parce qu'un compteur n'a pas répondu : la
    // requête est enveloppée, et l'échec rend `null`.
    const source = readFileSync(
      join(process.cwd(), "src/services/preuves-dusage.service.ts"),
      "utf8",
    );
    expect(source).toMatch(/catch\s*\(/);
    expect(source).toContain("valeur = null");
  });

  it("est posée avant les promesses de la page enseignants", () => {
    const page = readFileSync(join(process.cwd(), "src/app/enseignants/page.tsx"), "utf8");
    expect(page).toContain("<PreuvesDusageBande");
    // Les quatre engagements disent ce que le produit FERA — sans compte
    // élève, rien à installer ; les totaux disent ce qu'il a déjà fait, et
    // viennent donc d'abord. C'est la seule chose de cette page qu'un lecteur
    // n'a pas à croire sur parole : la faire passer après les promesses la
    // rangerait avec elles.
    //
    // Les engagements tenaient une section à eux, et ce test cherchait leur
    // boucle ; ils sont descendus sous les boutons de la bande finale, où une
    // objection se lève vraiment. L'ordre, lui, ne change pas.
    expect(page.indexOf("<PreuvesDusageBande")).toBeLessThan(page.indexOf("mentions={CONFIANCE}"));
    expect(page).toContain("mentions={CONFIANCE}");
  });
});
