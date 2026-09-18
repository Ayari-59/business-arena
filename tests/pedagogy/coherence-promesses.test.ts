import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import type { SituationDef } from "../../src/config/scenarios/situation-kit";
import { COURRIERS } from "../../src/config/courriers/registre";

/**
 * CE QUE LE JEU RACONTE DOIT ÊTRE CE QUE LE JEU FAIT.
 *
 * Deux fautes de la même famille, trouvées par un diagnostic complet, et que
 * rien ne surveillait :
 *
 *  1. UN ÉNONCÉ QUI AFFIRME UN FAIT QUE SON DÉCLENCHEMENT NE GARANTIT PAS.
 *     « Le paradoxe du succès » raconte un trimestre record avec la caisse
 *     dans le rouge ; ouvert à une équipe qui venait de perdre 108 000 €, il
 *     n'enseignait pas le paradoxe, il apprenait à ne pas lire ses résultats.
 *     La parade : un énoncé qui affirme un état doit exiger le code de
 *     détection correspondant.
 *
 *  2. UNE PROMESSE QUE LE PRODUIT NE TIENT PLUS. Le plan de trésorerie a
 *     quitté le formulaire (deux champs à remplir de tête, dont l'un
 *     interdisait d'emprunter). Restaient : deux cartes événement qui
 *     félicitaient l'élève pour un plan qu'il n'a jamais déposé, et des
 *     séances d'atelier qui faisaient « déposer le plan » puis annonçaient
 *     que la banque jugerait sa fiabilité. Un enseignant suivant la fiche en
 *     classe se serait retrouvé devant un écran qui ne demande rien.
 *
 * Ces gardes lisent le contenu, pas le code : c'est le contenu qui ment en
 * premier, et c'est lui que l'élève lit.
 */

/** Les faits qu'un énoncé peut affirmer, et le code qui les garantit. */
const AFFIRMATIONS: { detect: string; quoi: string; motifs: RegExp[] }[] = [
  {
    detect: "profitable_illiquid",
    quoi: "un résultat positif malgré une trésorerie négative",
    motifs: [
      /trimestre record/i,
      /victime de (son|votre) succès/i,
      /r[ée]sultat (est |reste )?(b[ée]n[ée]ficiaire|positif)/i,
      /vous gagnez de l['’]argent/i,
    ],
  },
  {
    detect: "stockout",
    quoi: "une rupture de stock",
    motifs: [/en rupture/i, /rupture de stock/i, /stock [ée]puis[ée]/i, /[ée]tag[èe]res vides/i],
  },
  {
    detect: "capacity_saturated",
    quoi: "une capacité saturée",
    motifs: [/[àa] pleine capacit[ée]/i, /capacit[ée] satur[ée]e/i, /refus[ée] des (clients|commandes|r[ée]servations)/i],
  },
  {
    detect: "below_breakeven",
    quoi: "une exploitation sous son seuil de rentabilité",
    motifs: [/sous (votre |le )?seuil de rentabilit[ée]/i, /vous perdez de l['’]argent/i],
  },
  {
    detect: "idle_cash",
    quoi: "une trésorerie excédentaire qui dort",
    motifs: [/tr[ée]sorerie (qui )?dort/i, /exc[ée]dent de tr[ée]sorerie/i],
  },
];

describe("un énoncé n'affirme que ce que son déclenchement garantit", () => {
  const situations: { secteur: string; s: SituationDef }[] = SCENARIOS.flatMap((d) =>
    d.situations.map((s) => ({ secteur: d.scenario.code, s })),
  );

  it("le corpus est bien lu (sans quoi le silence ne vaudrait rien)", () => {
    expect(situations.length).toBeGreaterThan(50);
  });

  it("aucun énoncé ne raconte un état que le tour ne garantit pas", () => {
    const fautifs: string[] = [];
    for (const { secteur, s } of situations) {
      // SEUL CE QUE L'ÉNONCÉ AFFIRME compte : titre, récit, question posée.
      // Les options de diagnostic parlent du CONCEPT, pas des résultats.
      const affirme = [s.title, s.narrative, s.problem].filter(Boolean).join(" ");
      const garanti =
        "detect" in s.trigger ? s.trigger.detect : s.trigger.requires;
      for (const a of AFFIRMATIONS) {
        if (!a.motifs.some((r) => r.test(affirme))) continue;
        if (garanti !== a.detect) {
          fautifs.push(`${secteur} · ${s.code} affirme ${a.quoi} sans exiger « ${a.detect} »`);
        }
      }
    }
    expect(fautifs, `énoncés qui affirment ce qu'ils ne garantissent pas :\n${fautifs.join("\n")}`).toEqual([]);
  });
});

describe("rien ne promet un plan de trésorerie que l'arène ne demande plus", () => {
  const PROMESSES = [
    /d[ée]pose son plan/i,
    /plan de tr[ée]sorerie d[ée]pos[ée]/i,
    /plan de tr[ée]sorerie a convaincu/i,
    /pas de plan, pas d['’]emprunt/i,
    /fiabilit[ée] de (ses|leurs) plans/i,
    /la banque pr[êe]te contre un plan/i,
  ];
  const fautes = (nom: string, texte: string) =>
    PROMESSES.filter((r) => r.test(texte)).map((r) => `${nom} : ${r}`);

  it("aucun courrier ne félicite l'élève pour un plan qu'il n'a pas déposé", () => {
    const fautifs = COURRIERS.flatMap((c) =>
      fautes(c.code, [c.expediteur, c.objet, c.corps, c.effet, c.enJeu].join(" ")),
    );
    expect(fautifs, fautifs.join("\n")).toEqual([]);
  });

  it("aucune fiche d'atelier ne fait déposer un plan ni n'annonce que la banque le jugera", () => {
    const dossier = join(process.cwd(), "src/config/ateliers");
    const fichiers = readdirSync(dossier).filter((f) => f.endsWith(".ts"));
    expect(fichiers.length).toBeGreaterThan(3);
    const fautifs = fichiers.flatMap((f) => fautes(f, readFileSync(join(dossier, f), "utf8")));
    expect(fautifs, `fiches d'atelier périmées :\n${fautifs.join("\n")}`).toEqual([]);
  });

  it("aucun énoncé de situation ne demande de déposer un plan", () => {
    const fautifs = SCENARIOS.flatMap((d) =>
      d.situations.flatMap((s) =>
        fautes(`${d.scenario.code} · ${s.code}`, [s.title, s.narrative, s.problem].join(" ")),
      ),
    );
    expect(fautifs, fautifs.join("\n")).toEqual([]);
  });
});
