import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Repliable } from "@/components/repliable";
import { Tiroir } from "@/components/tiroir";
import {
  INSTANCES_DE_REPLI,
  SURFACES_COCKPIT,
  SURFACES_DE_LECTURE,
  SURFACES_PAPIER,
  estCockpit,
  estPapier,
} from "@/config/surfaces-de-lecture";

/**
 * LES DEUX SOLS SE DÉCLARENT (LOT 6A).
 *
 * Le lot 6A bascule l'écran de jeu sur le marine (cockpit) et laisse les zones
 * de LECTURE sur papier. Le critère est écrit dans `surfaces-de-lecture.ts` ;
 * cette garde l'énumère et tient trois invariants :
 *   · chaque surface déclare un rôle, un porteur et une raison ;
 *   · les deux ensembles sont disjoints (une surface n'est pas les deux sols) ;
 *   · les documents de lecture nommés par le brief sont bien du PAPIER, et les
 *     surfaces de pilotage bien du COCKPIT — on ne peut pas les y glisser par
 *     mégarde sans faire tomber la garde.
 */
describe("surfaces de lecture", () => {
  it("chaque surface est complète", () => {
    for (const s of SURFACES_DE_LECTURE) {
      expect(s.cle, "une clé").toBeTruthy();
      expect(s.porte, `un porteur pour ${s.cle}`).toBeTruthy();
      expect(s.raison.length, `une raison étoffée pour ${s.cle}`).toBeGreaterThan(20);
      expect(["papier", "cockpit"]).toContain(s.role);
    }
  });

  it("les clés sont uniques", () => {
    const cles = SURFACES_DE_LECTURE.map((s) => s.cle);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it("les deux sols sont disjoints", () => {
    for (const s of SURFACES_PAPIER) {
      expect(estPapier(s.cle)).toBe(true);
      expect(estCockpit(s.cle)).toBe(false);
    }
    for (const s of SURFACES_COCKPIT) {
      expect(estCockpit(s.cle)).toBe(true);
      expect(estPapier(s.cle)).toBe(false);
    }
  });

  it("les documents de lecture du brief sont du papier", () => {
    const attendus = [
      "courrier-du-tour",
      "situation-du-tour",
      "analyse-du-tour",
      "debrief-de-la-situation",
      "note-du-tour-precedent",
      "mandat-de-lequipe",
      "aides-longues",
      "textes-du-bilan",
      "faits-de-la-situation",
    ];
    for (const cle of attendus) {
      expect(estPapier(cle), `${cle} doit rester un document papier`).toBe(true);
    }
  });

  it("les surfaces de pilotage sont le cockpit", () => {
    const attendus = [
      "ardoise-des-chiffres",
      "feuille-de-decision",
      "bande-de-marche",
      "classement-des-equipes",
      "tableau-de-bord-du-tour-clos",
    ];
    for (const cle of attendus) {
      expect(estCockpit(cle), `${cle} doit rester du cockpit`).toBe(true);
    }
  });
});

/**
 * LE PAPIER SE PROUVE DANS LE CODE (LOT 6D).
 *
 * Le catalogue déclarait « papier » les aides longues et les textes du bilan
 * alors que l'écran les rendait sur le marine : la garde ci-dessus ne lisait
 * que le catalogue, elle ne pouvait pas le voir. Celles-ci lisent les sources.
 *   · chaque document du catalogue porte une PREUVE, un motif que son fichier
 *     doit contenir (la classe `papier`, la variante `surface="papier"`) ;
 *   · chaque `<Tiroir>` et chaque `<Repliable>` du dépôt est nommé dans
 *     `INSTANCES_DE_REPLI`, avec son sol, et le code pose bien ce sol :
 *     une instance nouvelle oblige à décider, une instance qui perd son papier
 *     fait tomber la garde ;
 *   · le sol PAR DÉFAUT des deux composants reste le cockpit : on ne bascule
 *     jamais un composant générique en entier.
 */
const SRC = join(process.cwd(), "src");

function sources(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return sources(chemin);
    return chemin.endsWith(".tsx") ? [chemin] : [];
  });
}

/**
 * Les balises ouvrantes d'un composant, attributs compris : on avance jusqu'au
 * `>` qui n'est ni dans une chaîne ni dans une expression `{…}` (un `=>` ou un
 * `<span>` passé en attribut n'y met pas fin).
 */
function balisesOuvrantes(source: string, composant: string): string[] {
  const balises: string[] = [];
  const debut = new RegExp(`<${composant}(?![A-Za-z0-9_])`, "g");
  let m: RegExpExecArray | null;
  while ((m = debut.exec(source))) {
    let i = m.index + m[0].length;
    let profondeur = 0;
    let guillemet: string | null = null;
    for (; i < source.length; i++) {
      const c = source[i];
      if (guillemet) {
        if (c === guillemet) guillemet = null;
        continue;
      }
      if (profondeur === 0 && (c === '"' || c === "'")) guillemet = c;
      else if (c === "{") profondeur++;
      else if (c === "}") profondeur--;
      else if (c === ">" && profondeur === 0) break;
    }
    balises.push(source.slice(m.index, i + 1));
  }
  return balises;
}

describe("le papier se prouve dans le code (lot 6D)", () => {
  it("chaque document du catalogue porte sa preuve, et son fichier la contient", () => {
    for (const s of SURFACES_PAPIER) {
      expect(s.preuve, `${s.cle} : un document sans preuve dans le code`).toBeDefined();
      const source = readFileSync(join(SRC, s.preuve!.fichier), "utf8");
      expect(
        s.preuve!.motif.test(source),
        `${s.cle} : ${s.preuve!.fichier} ne pose plus son papier (${s.preuve!.motif})`,
      ).toBe(true);
    }
  });

  it("chaque Tiroir et chaque Repliable du dépôt est déclaré, et porte le sol déclaré", () => {
    const restantes = INSTANCES_DE_REPLI.map((x) => ({ ...x }));
    const inconnues: string[] = [];
    const malPosees: string[] = [];
    let vues = 0;
    for (const chemin of sources(SRC)) {
      const fichier = relative(SRC, chemin);
      const source = readFileSync(chemin, "utf8");
      for (const composant of ["Tiroir", "Repliable"] as const) {
        for (const balise of balisesOuvrantes(source, composant)) {
          vues++;
          const i = restantes.findIndex(
            (x) => x.fichier === fichier && x.composant === composant && balise.includes(x.repere),
          );
          const resume = balise.replace(/\s+/g, " ").slice(0, 90);
          if (i < 0) {
            inconnues.push(`${fichier} : ${resume}`);
            continue;
          }
          const [instance] = restantes.splice(i, 1);
          const posee = /\bsurface="papier"/.test(balise) ? "papier" : "cockpit";
          if (posee !== instance!.surface) {
            malPosees.push(`${fichier} : ${resume} (déclaré ${instance!.surface}, posé ${posee})`);
          }
        }
      }
    }
    expect(vues, "aucune balise trouvée : la garde ne garde rien").toBeGreaterThan(30);
    expect(inconnues, `replis absents de INSTANCES_DE_REPLI :\n${inconnues.join("\n")}`).toEqual(
      [],
    );
    expect(malPosees, `sol déclaré et sol posé divergent :\n${malPosees.join("\n")}`).toEqual([]);
    expect(
      restantes.map((x) => `${x.fichier} : ${x.repere}`),
      "entrées sans instance dans le code",
    ).toEqual([]);
  });

  it("au moins une aide longue est réellement posée sur le papier", () => {
    expect(INSTANCES_DE_REPLI.filter((x) => x.surface === "papier").length).toBeGreaterThan(0);
  });

  it("le sol par défaut des replis génériques reste le cockpit", () => {
    const tiroir = (surface?: "papier" | "cockpit") =>
      renderToStaticMarkup(
        createElement(
          Tiroir,
          { titre: "Un titre", ...(surface ? { surface } : {}) } as ComponentProps<typeof Tiroir>,
          "texte",
        ),
      );
    const repli = (surface?: "papier" | "cockpit") =>
      renderToStaticMarkup(
        createElement(
          Repliable,
          { resume: "Un résumé", ...(surface ? { surface } : {}) } as ComponentProps<
            typeof Repliable
          >,
          "texte",
        ),
      );
    for (const html of [tiroir(), tiroir("cockpit"), repli(), repli("cockpit")]) {
      expect(html).not.toMatch(/class="[^"]*\bpapier\b/);
      expect(html).not.toContain("data-surface");
    }
    for (const html of [tiroir("papier"), repli("papier")]) {
      expect(html).toMatch(/<details[^>]*class="[^"]*\bpapier\b/);
      expect(html).toContain('data-surface="papier"');
      // Sur le papier, ni l'ambre vif ni le gris clair du cockpit sur le chevron.
      expect(html).not.toContain("text-amber-400/80");
    }
  });
});
