import { describe, expect, it } from "vitest";
import { ATELIERS, dureeTotaleHeures } from "../../src/config/ateliers";
import { SCENARIOS, scenarioByCode } from "../../src/config/scenarios/registry";
import { DIFFICULTY_PRESETS } from "../../src/config/difficulty";

/**
 * Garde-fous des ateliers professionnels.
 *
 * Un déroulé pédagogique se lit comme un contrat : l'enseignant y prend des
 * engagements de temps devant sa classe. Une séance annoncée quatre heures dont
 * le minutage en fait cinq lui explose au visage en salle, et il ne reviendra
 * pas. Ces règles-là ne se vérifient pas à la relecture, elles se vérifient
 * ici.
 */
describe("ateliers professionnels", () => {
  it("les codes d'atelier sont uniques", () => {
    const codes = ATELIERS.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("le minutage de chaque séance fait exactement sa durée annoncée", () => {
    // C'est la règle qui compte : un déroulé qui déborde est un déroulé faux.
    for (const a of ATELIERS) {
      for (const s of a.seances) {
        const somme = s.deroule.reduce((t, p) => t + p.minutes, 0);
        expect(somme, `${a.code}/séance ${s.numero} : minutage ≠ durée annoncée`).toBe(
          s.dureeMinutes,
        );
      }
    }
  });

  it("les séances se suivent sans trou et jouent les tours dans l'ordre", () => {
    for (const a of ATELIERS) {
      expect(a.seances.map((s) => s.numero), a.code).toEqual(a.seances.map((_, i) => i + 1));
      const tours = a.seances.map((s) => s.tourJoue).filter((t): t is number => t !== null);
      expect([...tours].sort((x, y) => x - y), `${a.code} : tours dans le désordre`).toEqual(tours);
    }
  });

  it("l'atelier ne demande jamais plus de tours que la partie n'en compte", () => {
    // Une séance 7 dans une partie de six tours n'a rien à jouer.
    for (const a of ATELIERS) {
      const scenario = scenarioByCode(a.reglages.scenarioCode);
      for (const s of a.seances) {
        if (s.tourJoue === null) continue;
        expect(
          s.tourJoue,
          `${a.code}/séance ${s.numero} : tour ${s.tourJoue} hors de la partie`,
        ).toBeLessThanOrEqual(scenario.scenario.roundsCount);
      }
    }
  });

  it("les réglages annoncés existent vraiment dans le produit", () => {
    // Le pire défaut possible : un atelier qui décrit une partie qu'on ne peut
    // pas créer. L'enseignant le découvrirait devant sa classe.
    for (const a of ATELIERS) {
      expect(
        SCENARIOS.some((s) => s.code === a.reglages.scenarioCode),
        `${a.code} : secteur inconnu « ${a.reglages.scenarioCode} »`,
      ).toBe(true);
      const preset = DIFFICULTY_PRESETS.find((p) => p.level === a.reglages.niveau);
      expect(preset, `${a.code} : niveau ${a.reglages.niveau} inexistant`).toBeDefined();
      expect(preset!.name, `${a.code} : le nom du niveau ne correspond plus`).toBe(
        a.reglages.niveauNom,
      );
      expect(["month", "quarter", "year"], a.code).toContain(a.reglages.periodicite);
      expect(a.reglages.equipes, a.code).toBeGreaterThanOrEqual(1);
      expect(
        a.reglages.equipes,
        `${a.code} : plus d'équipes que la création n'en accepte`,
      ).toBeLessThanOrEqual(8);
      expect(a.reglages.bots, a.code).toBeGreaterThanOrEqual(0);
      expect(a.reglages.bots, a.code).toBeLessThanOrEqual(4);
    }
  });

  it("un niveau qui n'ouvre pas le financement ne peut pas porter une séance de trésorerie", () => {
    // La séance du plan de trésorerie suppose que la banque existe, donc que le
    // niveau ouvre les décisions de financement. Annoncer l'une sans l'autre
    // enverrait l'enseignant chercher un panneau absent.
    for (const a of ATELIERS) {
      const preset = DIFFICULTY_PRESETS.find((p) => p.level === a.reglages.niveau)!;
      const parleFinancement = a.seances.some((s) =>
        /trésorerie|emprunt|financement|banque/i.test(`${s.titre} ${s.objectif}`),
      );
      if (!parleFinancement) continue;
      expect(
        preset.decisions.finance,
        `${a.code} : séance de financement au niveau ${preset.level}, qui ne l'ouvre pas`,
      ).toBe(true);
    }
  });

  it("chaque séance produit une trace et dit ce qui est évalué", () => {
    // La règle qui fait la différence entre un atelier et une partie de jeu :
    // rien ne se joue sans laisser d'écrit.
    for (const a of ATELIERS) {
      for (const s of a.seances) {
        expect(s.livrable.length, `${a.code}/séance ${s.numero} : pas de livrable`).toBeGreaterThan(
          40,
        );
        expect(
          s.tracePasseport.length,
          `${a.code}/séance ${s.numero} : pas de trace de passeport`,
        ).toBeGreaterThan(40);
        // Une trace de passeport se rédige à la première personne : c'est
        // l'élève qui atteste, pas le professeur qui décrit.
        expect(
          /^J[e']/.test(s.tracePasseport),
          `${a.code}/séance ${s.numero} : la trace n'est pas à la première personne`,
        ).toBe(true);
        expect(s.evaluation.length, `${a.code}/séance ${s.numero}`).toBeGreaterThanOrEqual(3);
        expect(s.competences.length, `${a.code}/séance ${s.numero}`).toBeGreaterThanOrEqual(3);
        for (const c of s.competences) {
          expect(
            /^J[e']/.test(c),
            `${a.code}/séance ${s.numero} : « ${c.slice(0, 40)}… » n'est pas un acte`,
          ).toBe(true);
        }
        expect(s.processus.length, `${a.code}/séance ${s.numero}`).toBeGreaterThanOrEqual(1);
        expect(s.notions.length, `${a.code}/séance ${s.numero}`).toBeGreaterThanOrEqual(3);
        expect(s.preparation.length, `${a.code}/séance ${s.numero}`).toBeGreaterThan(60);
      }
    }
  });

  it("le format annoncé dit le vrai nombre d'heures", () => {
    // « 6 séances de 4 h » se confronte au minutage réel : la promesse de la
    // carte doit tomber juste, sinon elle ment sur la vitrine.
    for (const a of ATELIERS) {
      const heures = dureeTotaleHeures(a);
      const m = /(\d+)\s*séances?\s*de\s*(\d+)\s*h/i.exec(a.format);
      expect(m, `${a.code} : format « ${a.format} » illisible`).not.toBeNull();
      expect(Number(m![1]), `${a.code} : nombre de séances annoncé`).toBe(a.seances.length);
      expect(Number(m![1]) * Number(m![2]), `${a.code} : volume annoncé ≠ minutage`).toBe(heures);
    }
  });

  it("un atelier s'annonce, se note et se prolonge", () => {
    for (const a of ATELIERS) {
      expect(a.titre.length, a.code).toBeGreaterThan(10);
      expect(a.resume.length, a.code).toBeGreaterThan(40);
      expect(a.pitch.length, a.code).toBeGreaterThan(80);
      expect(a.pourquoi.length, `${a.code} : le pourquoi tient du slogan`).toBeGreaterThan(200);
      expect(
        a.seances.length,
        `${a.code} : un atelier d'une séance n'est pas un atelier`,
      ).toBeGreaterThanOrEqual(3);
      expect(a.formats.length, `${a.code} : un seul tempo proposé`).toBeGreaterThanOrEqual(2);
      expect(a.evaluationFinale.length, a.code).toBeGreaterThanOrEqual(3);
      expect(a.prolongements.length, a.code).toBeGreaterThanOrEqual(2);
      expect(a.faq.length, a.code).toBeGreaterThanOrEqual(4);
      for (const f of a.faq) {
        expect(f.question.trim().endsWith("?"), `${a.code} : « ${f.question} »`).toBe(true);
        expect(f.reponse.length, `${a.code}/${f.question}`).toBeGreaterThan(80);
      }
    }
  });

  it("aucune prose d'atelier ne coupe une phrase par un tiret", () => {
    // Contrainte de style tenue partout ailleurs. Le tiret des mots composés
    // reste permis : on ne cherche que celui encadré d'espaces.
    const inciseur = /[\wÀ-ÿ][ ]+[—–][ ]+[\wÀ-ÿ]/;
    for (const a of ATELIERS) {
      const proses = [
        a.titre,
        a.resume,
        a.pitch,
        a.pourquoi,
        a.reglages.notes,
        ...a.formats.flatMap((f) => [f.nom, f.quand, f.comment]),
        ...a.evaluationFinale,
        ...a.prolongements,
        ...a.faq.flatMap((f) => [f.question, f.reponse]),
        ...a.seances.flatMap((s) => [
          s.titre,
          s.objectif,
          s.preparation,
          s.livrable,
          s.tracePasseport,
          ...s.competences,
          ...s.evaluation,
          ...s.deroule.flatMap((p) => [p.titre, p.detail]),
        ]),
      ];
      for (const prose of proses) {
        expect(prose, `${a.code} : « ${prose.slice(0, 50)}… »`).not.toMatch(inciseur);
      }
    }
  });
});
