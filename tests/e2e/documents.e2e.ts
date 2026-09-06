import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur } from "./helpers/browser";
import { ATELIERS } from "../../src/config/ateliers";
import { formulairesAtelier } from "../../src/config/ateliers/formulaires";
import { dossierEnseignant } from "../../src/config/ateliers/dossiers";

/**
 * LES DOCUMENTS QU'ON IMPRIME ET QU'ON DISTRIBUE.
 *
 * Les gardes unitaires vérifient la DONNÉE des formulaires : qu'un découpage
 * n'invente ni ne perd de rubrique. Elles ne peuvent rien dire de la page, et
 * c'est pourtant la page qu'on photocopie. Une liste rendue vide par un
 * mauvais sélecteur, une rubrique qui tombe hors du cadre à l'impression, un
 * corrigé qui se retrouve sur la feuille de l'élève : rien de tout cela ne se
 * voit hors d'un vrai navigateur.
 *
 * Les deux choses vérifiées sont donc celles qui font mal en classe : que
 * l'élève voie CHAQUE rubrique qu'on lui demande, et qu'il ne voie AUCUNE des
 * réponses aux situations qu'il va rencontrer.
 */
let navigateur: Browser;
let page: Page;

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  page = await navigateur.newPage();
}, 60_000);

afterAll(async () => {
  await navigateur?.close();
});

describe("les documents d'un atelier", () => {
  for (const atelier of ATELIERS) {
    it(`${atelier.code} : chaque rubrique demandée est sur la feuille`, async () => {
      await aller(page, `/animations/${atelier.code}/formulaires`);
      // La page met les intitulés en capitales et les rubriques en majuscule
      // initiale : c'est de la typographie, elle ne change pas ce qui est
      // demandé. On compare donc ce qui est écrit, pas comment c'est dessiné.
      const texte = (await page.locator("main").innerText()).toLowerCase();
      for (const f of formulairesAtelier(atelier)) {
        expect(texte, `${atelier.code}/S${f.seance} : la séance manque`).toContain(
          f.seanceTitre.toLowerCase(),
        );
        for (const r of f.rubriques) {
          expect(
            texte,
            `${atelier.code}/S${f.seance} : « ${r} » absente de la feuille`,
          ).toContain(r.toLowerCase());
        }
        for (const c of f.evaluation) {
          expect(texte, `${atelier.code}/S${f.seance} : critère absent`).toContain(c.toLowerCase());
        }
      }
    }, 60_000);
  }

  it("aucune feuille distribuée ne porte de corrigé", async () => {
    // La faute qu'on ne rattrape pas : elle ne se voit ni à la relecture ni à
    // l'impression, elle se voit en classe, quand toute la salle répond juste
    // sans avoir cherché.
    for (const atelier of ATELIERS) {
      const prof = dossierEnseignant(atelier);
      for (const chemin of ["formulaires", "dossier"]) {
        await aller(page, `/animations/${atelier.code}/${chemin}`);
        const texte = await page.locator("main").innerText();
        for (const s of prof.situations) {
          for (const c of s.corriges) {
            expect(
              texte,
              `${atelier.code}/${chemin} : l'explication de « ${s.situation.code} » est distribuée`,
            ).not.toContain(c.explication);
          }
        }
        for (const seance of atelier.seances) {
          expect(
            texte,
            `${atelier.code}/${chemin} : la préparation de la séance ${seance.numero} est distribuée`,
          ).not.toContain(seance.preparation);
        }
      }
    }
  }, 120_000);
});
