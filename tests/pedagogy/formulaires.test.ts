import { describe, expect, it } from "vitest";
import { ATELIERS } from "../../src/config/ateliers";
import {
  formulaireLivrable,
  formulairesAtelier,
  formulairesCsv,
  grilleEvaluationCsv,
  MOTS_DE_LIAISON,
} from "../../src/config/ateliers/formulaires";

/**
 * LE FORMULAIRE NE RÉDIGE PAS.
 *
 * Un formulaire de livrable est une phrase d'enseignant DÉCOUPÉE : le nom du
 * document en tête, une ligne à remplir par rubrique. Le découpage est
 * automatique, et c'est là qu'est le danger. Une machine qui range de la prose
 * peut faire deux choses, et les deux sont invisibles à la relecture : écrire
 * une rubrique que personne n'a demandée, ou en oublier une que l'enseignant
 * avait écrite. L'élève rendrait alors un document incomplet en croyant avoir
 * tout coché, ce qui est pire qu'une feuille blanche.
 *
 * Les deux gardes qui suivent ferment ces deux portes, et rien d'autre ne
 * compte vraiment ici.
 */
const TOUS = ATELIERS.flatMap((a) =>
  formulairesAtelier(a).map((f) => ({ code: a.code, f })),
);

describe("les formulaires des livrables", () => {
  it("chaque séance de chaque atelier a son formulaire", () => {
    expect(TOUS.length).toBeGreaterThan(25);
    for (const a of ATELIERS) {
      expect(formulairesAtelier(a).length, `${a.code}`).toBe(a.seances.length);
    }
  });

  it("rien d'ajouté : chaque rubrique est un morceau exact de la phrase", () => {
    // La garde qui interdit d'inventer. Un formulaire dont une ligne ne se
    // retrouve pas mot pour mot dans le livrable écrit par l'enseignant fait
    // dire à ce dernier une consigne qu'il n'a pas donnée.
    for (const { code, f } of TOUS) {
      const contexte = `${code}/S${f.seance}`;
      for (const bloc of [f.document, f.consigne, ...f.precisions, ...f.rubriques]) {
        if (bloc === null) continue;
        expect(f.phrase, `${contexte} : « ${bloc} » n'est pas dans le livrable`).toContain(bloc);
      }
    }
  });

  it("rien de perdu : la phrase découpée ne laisse que des mots de liaison", () => {
    // La garde symétrique, et la seule qui prouve vraiment le découpage. On
    // retire de la phrase, une à une, toutes les parties que le formulaire
    // affiche ; ce qui reste ne doit plus porter que la ponctuation et les
    // mots qui relient une énumération française. Un mot de contenu qui
    // survit est une consigne que l'élève ne verra jamais sur sa feuille.
    for (const { code, f } of TOUS) {
      let reste = f.phrase;
      for (const bloc of [f.document, f.consigne, ...f.precisions, ...f.rubriques]) {
        if (bloc === null) continue;
        const i = reste.indexOf(bloc);
        expect(i, `${code}/S${f.seance} : « ${bloc} » introuvable`).toBeGreaterThanOrEqual(0);
        reste = reste.slice(0, i) + reste.slice(i + bloc.length);
      }
      const oublies = reste
        .split(/[^\p{L}']+/u)
        .filter(Boolean)
        .filter((m) => !(MOTS_DE_LIAISON as readonly string[]).includes(m.toLowerCase()));
      expect(
        oublies,
        `${code}/S${f.seance} : le formulaire perd ${JSON.stringify(oublies)} de « ${f.phrase} »`,
      ).toEqual([]);
    }
  });

  it("aucune rubrique n'est un bout de phrase inutilisable", () => {
    // Un découpage juste peut rester bête : une ligne « une page » ou une
    // ligne de deux caractères se remplirait par une croix, et une ligne de
    // trois lignes n'est plus une rubrique mais un paragraphe.
    for (const { code, f } of TOUS) {
      expect(f.rubriques.length, `${code}/S${f.seance} : trop peu de rubriques`).toBeGreaterThanOrEqual(3);
      for (const r of f.rubriques) {
        const contexte = `${code}/S${f.seance} : « ${r} »`;
        expect(r.length, `${contexte} trop courte`).toBeGreaterThan(4);
        expect(r.length, `${contexte} trop longue pour une ligne`).toBeLessThan(120);
        expect(r, `${contexte} garde une ponctuation de découpe`).not.toMatch(/[,;:]/);
        expect(r, `${contexte} commence par un mot de liaison`).not.toMatch(
          new RegExp(`^(?:${MOTS_DE_LIAISON.join("|")})\\s`, "i"),
        );
      }
    }
  });

  it("une consigne distributive ne devient jamais une rubrique", () => {
    // « Pour chaque ligne, le prévu, le réalisé, l'écart » n'énumère pas cinq
    // choses à écrire mais quatre. Sans cette règle, l'élève cherchait quoi
    // écrire en face de « pour chaque ligne ».
    const avecConsigne = TOUS.filter(({ f }) => f.consigne !== null);
    expect(avecConsigne.length, "plus aucune consigne détectée").toBeGreaterThan(0);
    for (const { code, f } of TOUS) {
      for (const r of f.rubriques) {
        expect(r, `${code}/S${f.seance} : « ${r} » est une consigne, pas une rubrique`).not.toMatch(
          /^pour /i,
        );
      }
    }
  });

  it("le formulaire ne dit jamais comment l'enseignant anime", () => {
    // Le formulaire part avec l'élève. La préparation et le déroulé minuté
    // restent chez l'enseignant, comme dans le dossier.
    for (const a of ATELIERS) {
      const texte = formulairesCsv(a);
      for (const s of a.seances) {
        expect(texte, `${a.code}/S${s.numero} : la préparation part avec l'élève`).not.toContain(
          s.preparation,
        );
        for (const phase of s.deroule) {
          expect(texte, `${a.code}/S${s.numero} : le déroulé part avec l'élève`).not.toContain(
            phase.detail,
          );
        }
      }
    }
  });

  it("le tableur des formulaires laisse une case vide en face de chaque rubrique", () => {
    // Un formulaire dont la colonne de réponse manque est un texte, pas un
    // formulaire : il s'ouvrirait, se lirait, et ne se remplirait pas.
    for (const a of ATELIERS) {
      const texte = formulairesCsv(a);
      expect(texte.startsWith("﻿"), `${a.code} : sans signature d'octets`).toBe(true);
      const lignes = texte.slice(1).split("\r\n");
      for (const f of formulairesAtelier(a)) {
        for (const r of f.rubriques) {
          const ligne = lignes.find((l) => l === `${r};` || l === `"${r}";`);
          expect(ligne, `${a.code}/S${f.seance} : « ${r} » sans case à remplir`).toBeDefined();
        }
      }
    }
  });

  it("la grille de correction porte une colonne par équipe et tous les critères", () => {
    for (const a of ATELIERS) {
      const lignes = grilleEvaluationCsv(a).slice(1).split("\r\n");
      const entetes = lignes.filter((l) => l.includes("Équipe 1;"));
      expect(entetes.length, `${a.code} : aucune colonne d'équipe`).toBeGreaterThan(0);
      for (const l of entetes) {
        expect(
          l.split(";").filter((c) => c.startsWith("Équipe ")).length,
          `${a.code} : « ${l.slice(0, 40)}… » ne porte pas ${a.reglages.equipes} équipes`,
        ).toBe(a.reglages.equipes);
      }
      for (const s of a.seances) {
        for (const c of s.evaluation) {
          expect(
            lignes.some((l) => l.startsWith(`${c};`) || l.startsWith(`"${c}";`)),
            `${a.code}/S${s.numero} : le critère « ${c.slice(0, 40)}… » manque à la grille`,
          ).toBe(true);
        }
      }
      for (const c of a.evaluationFinale) {
        expect(
          lignes.some((l) => l.startsWith(`${c};`) || l.startsWith(`"${c}";`)),
          `${a.code} : l'évaluation finale manque à la grille`,
        ).toBe(true);
      }
    }
  });

  it("un livrable sans énumération ne fabrique pas un formulaire vide", () => {
    // Éprouvé sur une phrase qui n'énumère rien : mieux vaut un formulaire
    // sans rubrique qu'un formulaire qui en invente une.
    const nu = formulaireLivrable({
      ...ATELIERS[0]!.seances[0]!,
      livrable: "Une note de synthèse.",
    });
    expect(nu.rubriques).toEqual(["Une note de synthèse"]);
    expect(nu.document).toBeNull();
    expect(nu.consigne).toBeNull();
  });
});
