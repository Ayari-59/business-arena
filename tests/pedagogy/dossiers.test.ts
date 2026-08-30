import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATELIERS } from "../../src/config/ateliers";
import { dossierEleve, dossierEnseignant } from "../../src/config/ateliers/dossiers";

/**
 * AUCUNE RÉPONSE NE PASSE DU CÔTÉ DE L'ÉLÈVE.
 *
 * Les deux dossiers d'un atelier se déduisent des mêmes données : c'est la
 * RÉPARTITION entre les deux publics qui est le travail, et c'est elle qui se
 * casse en silence. Une bonne réponse qui glisse dans le dossier distribué ne
 * se voit pas à la relecture, elle se voit en classe, quand toute la salle
 * répond juste sans avoir cherché.
 *
 * On ne vérifie donc pas que le dossier de l'élève est bien fait : on vérifie
 * qu'il ne contient RIEN de ce qui doit rester chez l'enseignant.
 */
describe("les deux dossiers d'un atelier", () => {
  it("chaque atelier a ses deux dossiers, et ils sont remplis", () => {
    for (const a of ATELIERS) {
      const eleve = dossierEleve(a);
      const prof = dossierEnseignant(a);
      expect(eleve.seances.length, `${a.code} : dossier élève sans séance`).toBe(a.seances.length);
      expect(prof.situations.length, `${a.code} : aucune situation à corriger`).toBeGreaterThan(0);
      for (const s of prof.situations) {
        expect(s.attendus.length, `${a.code}/${s.situation.code} : aucun attendu`).toBeGreaterThan(0);
        expect(s.leurres.length, `${a.code}/${s.situation.code} : aucun leurre`).toBeGreaterThan(0);
        expect(s.corriges.length, `${a.code}/${s.situation.code} : aucun corrigé`).toBeGreaterThan(0);
        for (const c of s.corriges) {
          expect(c.reponse.length, `${a.code}/${s.situation.code} : réponse vide`).toBeGreaterThan(0);
          expect(c.explication.length, `${a.code}/${s.situation.code} : explication vide`).toBeGreaterThan(20);
        }
      }
    }
  });

  it("le dossier de l'élève ne porte aucune réponse, aucune correction, aucun indice", () => {
    for (const a of ATELIERS) {
      const eleve = dossierEleve(a);
      const prof = dossierEnseignant(a);
      // Tout ce que l'élève lira, mis bout à bout.
      const distribue = [
        eleve.entreprise.contexte,
        eleve.entreprise.promesse,
        ...eleve.evaluationFinale,
        ...eleve.seances.flatMap((s) => [
          s.titre,
          s.objectif,
          s.livrable,
          s.trace,
          ...s.competences,
          ...s.evaluation,
          ...s.notions,
        ]),
      ].join("\n");

      for (const { situation, corriges } of prof.situations) {
        for (const c of corriges) {
          expect(
            distribue.includes(c.reponse),
            `${a.code} : une bonne réponse est dans le dossier distribué`,
          ).toBe(false);
          expect(
            distribue.includes(c.explication),
            `${a.code} : une correction est dans le dossier distribué`,
          ).toBe(false);
        }
        for (const indice of situation.hints) {
          expect(
            distribue.includes(indice.text),
            `${a.code} : un indice est dans le dossier distribué`,
          ).toBe(false);
        }
      }
    }
  });

  it("le dossier de l'élève ne porte pas non plus la partition de l'enseignant", () => {
    // La préparation et le minutage disent COMMENT on anime. Les donner à
    // l'élève, c'est lui montrer les ficelles avant le tour de magie, et lui
    // apprendre à jouer la séance plutôt que l'entreprise.
    for (const a of ATELIERS) {
      const eleve = dossierEleve(a);
      const distribue = JSON.stringify(eleve);
      for (const s of a.seances) {
        expect(
          distribue.includes(s.preparation.slice(0, 40)),
          `${a.code}/séance ${s.numero} : la préparation est dans le dossier élève`,
        ).toBe(false);
        for (const phase of s.deroule) {
          expect(
            distribue.includes(phase.detail.slice(0, 40)),
            `${a.code}/séance ${s.numero} : le déroulé minuté est dans le dossier élève`,
          ).toBe(false);
        }
      }
    }
  });

  it("les corrigés restent derrière la session, le dossier élève reste public", () => {
    // Le partage des deux pages est ce qui rend la séparation réelle : une
    // page de corrigés en accès libre annulerait tout le reste.
    const corriges = readFileSync("src/app/teacher/ateliers/[code]/dossier/page.tsx", "utf-8");
    expect(corriges, "la page des corrigés ne demande pas de session").toContain("getSession()");
    expect(corriges, "la page des corrigés ne renvoie pas au login").toContain(
      'redirect("/teacher/login")',
    );
    const eleve = readFileSync("src/app/ateliers/[code]/dossier/page.tsx", "utf-8");
    expect(eleve, "le dossier élève lit les corrigés").not.toContain("dossierEnseignant");
  });
});
