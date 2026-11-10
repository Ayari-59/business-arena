import { describe, expect, it } from "vitest";
import { referentielDeCitation } from "@/config/ateliers/referentiels";
import { competencesAffichees, formationDuParcours } from "@/config/cours/competences-affichees";
import { CHAPITRES, PARCOURS, chapitreParCode } from "@/config/cours/registre";
import { blocsDuChapitre, referentielDeLaFormation } from "@/config/couverture";
import { casDeLEntreprise } from "@/config/cours/cas";
import { servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";

/**
 * LES COMPÉTENCES DU DIPLÔME D'OÙ L'ON VIENT (demande du propriétaire, novembre 2026) : la page d'un
 * chapitre n'annonce que les blocs du diplôme qu'on prépare, pas tous les référentiels que le chapitre
 * touche. La règle : config/cours/competences-affichees.ts.
 */

const DEVISES = chapitreParCode("les-operations-en-devises")!;

describe("« Les opérations en devises », qui cite le DCG, le BUT GEA et deux processus du BTS CG", () => {
  it("cite bien quatre blocs de trois diplômes : l'exemple tient", () => {
    expect(DEVISES.blocs.map((b) => referentielDeCitation(b)?.code)).toEqual(["dcg", "but-gea", "bts-cg", "bts-cg"]);
  });

  it("depuis le DCG, ne montre que l'UE10, sous un titre qui nomme le DCG", () => {
    expect(competencesAffichees(DEVISES, { demande: "dcg" })).toEqual({
      formation: "dcg",
      libelle: "Compétences du référentiel · DCG",
      blocs: ["UE10 · Comptabilité approfondie"],
      source: "adresse",
    });
  });

  it("depuis le BTS CG, montre P1 et P2", () => {
    const c = competencesAffichees(DEVISES, { demande: "bts-cg" });
    expect(c.libelle).toBe("Compétences du référentiel · BTS CG");
    expect(c.blocs).toEqual(["P1 · Contrôle et traitement comptable des opérations commerciales", "P2 · Contrôle et production de l'information financière"]);
  });

  it("sans contexte, montre le diplôme de son parcours, le DCG", () => {
    expect(PARCOURS.find((p) => p.code === DEVISES.parcours)!.formation).toBe("dcg");
    const c = competencesAffichees(DEVISES);
    expect([c.formation, c.source, c.blocs]).toEqual(["dcg", "chapitre", ["UE10 · Comptabilité approfondie"]]);
  });

  it("un diplôme inconnu, ou que le chapitre ne cite pas, retombe sur le diplôme du chapitre", () => {
    for (const demande of ["inconnu", "bts-mco", "", null]) {
      const c = competencesAffichees(DEVISES, { demande });
      expect([c.formation, c.source], String(demande)).toEqual(["dcg", "chapitre"]);
    }
  });

  it("la classe l'emporte sur l'adresse", () => {
    const c = competencesAffichees(DEVISES, { classe: "but-gea", demande: "bts-cg" });
    expect([c.formation, c.source, c.libelle]).toEqual(["but-gea", "classe", "Compétences du référentiel · BUT GEA"]);
    expect(competencesAffichees(DEVISES, { classe: "dcg-comptabilite-approfondie", demande: "bts-cg" }).formation).toBe("dcg");
  });

  it("une classe sans diplôme (un parcours de discipline, aucun parcours) laisse décider l'adresse", () => {
    expect(formationDuParcours("comptabilite-generale")).toBeNull();
    expect(competencesAffichees(DEVISES, { classe: "comptabilite-generale", demande: "bts-cg" }).formation).toBe("bts-cg");
    expect(competencesAffichees(DEVISES, { classe: null, demande: "bts-cg" }).formation).toBe("bts-cg");
  });

  it("le guide ne reçoit que les blocs retenus, et le titre qui les nomme", () => {
    const servi = servirLeChapitre(DEVISES, casDeLEntreprise("nova"), competencesAffichees(DEVISES, { demande: "dcg" }));
    expect(servi.blocs).toEqual(["UE10 · Comptabilité approfondie"]);
    expect(servi.referentiel).toBe("Compétences du référentiel · DCG");
    expect(JSON.stringify(servi)).not.toContain("BTS CG");
  });
});

describe("un chapitre d'un parcours de discipline, qui ne suit aucune formation", () => {
  const seuil = CHAPITRES.find((c) => formationDuParcours(c.parcours) === null && new Set(c.blocs.map((b) => referentielDeCitation(b)?.code)).size > 1)!;

  it("montre sans contexte le référentiel du premier bloc qu'il cite", () => {
    const premier = referentielDeCitation(seuil.blocs[0]!)!.code;
    const c = competencesAffichees(seuil);
    expect([c.formation, c.source]).toEqual([premier, "chapitre"]);
    expect(c.blocs).toEqual(blocsDuChapitre(seuil, premier));
  });
});

describe("la règle, sur tout le cours", () => {
  it("chaque chapitre qui cite un bloc en montre au moins un, d'un seul référentiel, celui du titre", () => {
    for (const c of CHAPITRES.filter((x) => x.blocs.length > 0)) {
      const affichees = competencesAffichees(c);
      expect(affichees.blocs.length, c.code).toBeGreaterThan(0);
      const entrees = referentielDeLaFormation(affichees.formation!)!.entrees;
      for (const b of affichees.blocs) expect(entrees, `${c.code} : ${b}`).toContain(b);
    }
  });

  it("depuis chaque diplôme qu'un chapitre cite, il montre exactement les blocs de ce diplôme", () => {
    for (const c of CHAPITRES) {
      for (const f of new Set(c.blocs.map((b) => referentielDeCitation(b)?.code).filter((x): x is string => Boolean(x)))) {
        const attendus = blocsDuChapitre(c, f);
        if (attendus.length === 0) continue;
        expect(competencesAffichees(c, { demande: f }).blocs, `${c.code} depuis ${f}`).toEqual(attendus);
      }
    }
  });
});
