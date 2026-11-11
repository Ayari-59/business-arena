import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CATALOGUE_PAR_DEFAUT, LE_COURS_PAR_OFFRE, OFFRES } from "@/config/tarifs";
import { instructionsDe, tagsSurDisque } from "../helpers/migrations";

/**
 * LA MIGRATION 0059 ALIGNE LE CATALOGUE EN BASE SUR LE CODE (décision du propriétaire, 11 novembre
 * 2026 ; audit de l'offre du même jour, section 9), SANS RIEN ÉCRASER DE CE QUE LE PROPRIÉTAIRE A
 * RÉDIGÉ. Sur un Postgres embarqué, les migrations jusqu'à la 0058 donnent la base telle qu'elle est
 * en production pour ces quatre textes ; la 0059 les remplace là où l'ancien texte est encore en place,
 * et seulement là ; rejouée, elle ne change rien. Le catalogue migré entier, comparé à la grille :
 * tests/integration/catalogue-offres.test.ts.
 */

const MIGRATION = "0059_catalogue_aligne_sur_le_code";
const ANCIENS = {
  nom: "Découverte",
  coursGratuit: "Le premier chapitre du cours et son cas pratique, en libre accès.",
  coursClasse: "Le cours : les chapitres du parcours de la classe et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.",
  ateliersClasse: "Les ateliers clés en main qui se jouent avec cette entreprise et ce niveau, avec déroulé, corrigés et dossier enseignant.",
};
const grille = (code: string) => CATALOGUE_PAR_DEFAUT.offres.find((o) => o.code === code)!;

let client: PGlite;
const appliquer = async (tags: readonly string[]) => {
  for (const tag of tags) for (const instruction of instructionsDe(tag)) await client.exec(instruction);
};
const lire = async (code: string) =>
  (await client.query<{ nom: string; inclus: string[] }>(`select nom, inclus from catalogue_offres where code = $1`, [code])).rows[0]!;

beforeAll(async () => {
  client = new PGlite();
  const tous = tagsSurDisque();
  expect(tous).toContain(MIGRATION);
  await appliquer(tous.filter((t) => t < MIGRATION));
}, 120_000);

afterAll(async () => {
  await client?.close();
});

describe("la migration 0059", () => {
  it("avant elle, la base garde les quatre anciens textes", async () => {
    const gratuite = await lire("decouverte");
    const classe = await lire("classe");
    expect(gratuite.nom).toBe(ANCIENS.nom);
    expect(gratuite.inclus).toContain(ANCIENS.coursGratuit);
    expect(classe.inclus).toContain(ANCIENS.coursClasse);
    expect(classe.inclus).toContain(ANCIENS.ateliersClasse);
  });

  it("elle les remplace par les textes du code, à leur place dans la liste, et ne touche à rien d'autre", async () => {
    const avant = (await client.query<{ code: string; inclus: string[] }>(`select code, inclus from catalogue_offres order by code`)).rows;
    await appliquer([MIGRATION]);
    const gratuite = await lire("decouverte");
    const classe = await lire("classe");
    expect(gratuite.nom).toBe(OFFRES.decouverte.nom);
    expect(gratuite.inclus).toEqual(grille("decouverte").inclus);
    expect(gratuite.inclus).toContain(LE_COURS_PAR_OFFRE.decouverte);
    expect(gratuite.inclus).toContain("Un chapitre libre par diplôme et son cas pratique, en libre accès.");
    expect(classe.inclus).toEqual(grille("classe").inclus);
    expect(classe.inclus).toContain(LE_COURS_PAR_OFFRE.classe);
    // Les autres offres n'ont pas bougé.
    const apres = (await client.query<{ code: string; inclus: string[] }>(`select code, inclus from catalogue_offres order by code`)).rows;
    for (const a of apres.filter((o) => o.code !== "decouverte" && o.code !== "classe")) {
      expect(a.inclus, a.code).toEqual(avant.find((o) => o.code === a.code)!.inclus);
    }
  });

  it("rejouée, elle ne change rien", async () => {
    const avant = await lire("classe");
    await appliquer([MIGRATION, MIGRATION]);
    expect(await lire("classe")).toEqual(avant);
  });

  it("elle n'écrase pas ce que le propriétaire a rédigé dans /admin/offres", async () => {
    // Le propriétaire a renommé l'offre gratuite et réécrit la ligne du cours de Classe ; l'ancienne
    // ligne des ateliers est encore en place.
    const reecrite = "Le cours : le parcours de votre diplôme, pour toutes vos classes.";
    await client.query(`update catalogue_offres set nom = 'Essai sans compte' where code = 'decouverte'`);
    const classe = grille("classe").inclus.map((l) =>
      l === LE_COURS_PAR_OFFRE.classe ? reecrite : l.startsWith("Les ateliers clés en main écrits") ? ANCIENS.ateliersClasse : l,
    );
    await client.query(`update catalogue_offres set inclus = $1::jsonb where code = 'classe'`, [JSON.stringify(classe)]);
    await appliquer([MIGRATION]);
    expect((await lire("decouverte")).nom).toBe("Essai sans compte");
    const lue = (await lire("classe")).inclus;
    expect(lue).toContain(reecrite);
    expect(lue).not.toContain(LE_COURS_PAR_OFFRE.classe);
    // L'ancienne ligne des ateliers, elle, est remplacée.
    expect(lue).not.toContain(ANCIENS.ateliersClasse);
    expect(lue).toEqual(grille("classe").inclus.map((l) => (l === LE_COURS_PAR_OFFRE.classe ? reecrite : l)));
  });
});
