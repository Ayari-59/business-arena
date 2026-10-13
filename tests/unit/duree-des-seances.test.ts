import { describe, expect, it } from "vitest";
import { ATELIERS } from "@/config/ateliers";
import {
  avecQuestions,
  chargeDesSeances,
  decoupageEnCreneaux,
  estimationDuTour,
  estPhaseDeJeu,
  minutesDeJeu,
  verdict,
} from "@/config/ateliers/duree-des-seances";
import { MINUTES_PRISE_EN_MAIN } from "@/config/duree-du-tour";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";

/**
 * CE QUE CHAQUE SÉANCE LAISSE AU TOUR : le module que la fiche affiche et que
 * la garde des ateliers lit. Les règles sont celles du doc 12 : une phase de
 * jeu est une phase dont le titre annonce la décision ou dont le détail dit
 * qu'on saisit ; une alternative est une analyse ; une clôture ne joue rien.
 */
describe("la phase qui joue le tour", () => {
  const phase = (titre: string, detail = "") => ({ titre, detail });

  it("se reconnaît au titre qui annonce la décision", () => {
    for (const titre of [
      "Décisions du trimestre",
      "Décisions du mois",
      "Décider le tour 2",
      "Premier arbitrage et décisions",
      "Premières décisions",
      "Comité et décisions",
      "On décide",
      "On commande",
      "On fixe le prix",
      "Le premier prix",
      "Deuxième décision",
      "La décision du pic",
      "Le dernier tour",
      "Le dernier mois",
      "Plan de trésorerie, budget et décisions",
      "Communication et saisie",
    ]) {
      expect(estPhaseDeJeu(phase(titre)), titre).toBe(true);
    }
  });

  it("se reconnaît au détail qui dit qu'on saisit, qu'on valide ou qu'on joue", () => {
    expect(estPhaseDeJeu(phase("Le premier arbitrage", "L'équipe tranche, puis saisit ses décisions."))).toBe(true);
    expect(estPhaseDeJeu(phase("Le cycle", "L'équipe arbitre, puis valide son tour."))).toBe(true);
    expect(estPhaseDeJeu(phase("Tout ce qu'on sait", "Les équipes jouent le tour 6."))).toBe(true);
  });

  it("une alternative est une analyse, et une clôture ne joue rien", () => {
    expect(estPhaseDeJeu(phase("Décision ou marché", "Pour chaque composante, l'équipe se prononce."))).toBe(false);
    expect(estPhaseDeJeu(phase("Investir ou tenir", "L'équipe remplit la grille."))).toBe(false);
    expect(estPhaseDeJeu(phase("Les flux que la décision change", "Les équipes remplissent le tableau."))).toBe(false);
    expect(estPhaseDeJeu(phase("Clôture et résultats", "Vous clôturez ce que les équipes ont saisi."))).toBe(false);
    expect(estPhaseDeJeu(phase("Débriefing", "On compare ce que chacun a saisi."))).toBe(false);
    expect(estPhaseDeJeu(phase("On en parle", "La classe explique l'écart."))).toBe(false);
  });

  it("additionne les minutes des seules phases de jeu", () => {
    const s = {
      deroule: [
        phase("Le cadre"),
        { ...phase("Décider le tour 2"), minutes: 30 },
        { ...phase("Clôture"), minutes: 20 },
      ].map((p) => ({ minutes: 10, ...p })),
    };
    expect(minutesDeJeu(s)).toBe(30);
  });
});

describe("le verdict d'une séance", () => {
  it("est juste au quart au-dessus, serré entre, impossible en dessous", () => {
    expect(verdict(20, 25)).toBe("juste");
    expect(verdict(20, 24)).toBe("serree");
    expect(verdict(20, 20)).toBe("serree");
    expect(verdict(20, 19)).toBe("impossible");
  });
});

describe("l'estimation d'un tour d'atelier", () => {
  const cg1 = ATELIERS.find((a) => a.code === "cg1")!;
  const debutant = ATELIERS.find((a) => a.code === "debutant")!;

  it("compte la prise en main au premier tour joué, et plus ensuite", () => {
    const [s1, s2] = cg1.seances;
    expect(estimationDuTour(cg1, s1!)!.priseEnMain).toBe(MINUTES_PRISE_EN_MAIN);
    expect(estimationDuTour(cg1, s2!)!.priseEnMain).toBe(0);
  });

  it("ne compte l'analyse que si la partie pose des questions", () => {
    expect(avecQuestions(cg1)).toBe(true);
    expect(avecQuestions(debutant)).toBe(false);
    const d = estimationDuTour(debutant, debutant.seances[0]!)!;
    expect(d.analyse).toBe(0);
  });

  it("ne donne rien pour une séance qui ne joue aucun tour", () => {
    const sansTour = { tourJoue: null };
    expect(estimationDuTour(cg1, sansTour)).toBeNull();
  });

  it("au niveau voisin, l'estimation suit les champs que ce niveau ouvre", () => {
    const s2 = cg1.seances[1]!;
    const courant = estimationDuTour(cg1, s2)!;
    const plusHaut = estimationDuTour(cg1, s2, {
      preset: DIFFICULTY_PRESETS.find((p) => p.level === cg1.reglages.niveau + 1)!,
    })!;
    expect(plusHaut.saisie).toBeGreaterThan(courant.saisie);
  });

  it("la charge d'un atelier porte une ligne par séance jouée", () => {
    const lignes = chargeDesSeances(cg1);
    expect(lignes.map((l) => l.seance.numero)).toEqual(
      cg1.seances.filter((s) => s.tourJoue !== null).map((s) => s.numero),
    );
    for (const l of lignes) expect(l.minutesDeJeu).toBeGreaterThan(0);
  });
});

describe("le découpage en créneaux", () => {
  const p = (titre: string, minutes: number, detail = "") => ({ titre, minutes, detail });

  it("remplit les créneaux dans l'ordre, sans séparer la saisie de sa clôture", () => {
    const seance = {
      deroule: [p("Le cadre", 30), p("Le calcul", 40), p("Décider le tour 2", 40), p("Clôture", 20), p("Débriefing", 30)],
    };
    const creneaux = decoupageEnCreneaux(seance, 90)!;
    expect(creneaux.map((c) => c.phases.map((x) => x.titre))).toEqual([
      ["Le cadre", "Le calcul"],
      ["Décider le tour 2", "Clôture", "Débriefing"],
    ]);
    expect(creneaux.map((c) => c.minutes)).toEqual([70, 90]);
  });

  it("refuse une phase, ou un bloc de jeu et sa clôture, plus long que le créneau", () => {
    expect(decoupageEnCreneaux({ deroule: [p("La note", 100)] }, 90)).toBeNull();
    expect(decoupageEnCreneaux({ deroule: [p("Décisions du trimestre", 60), p("Clôture", 40)] }, 90)).toBeNull();
  });

  it("une séance qui tient dans le créneau fait un seul créneau", () => {
    const creneaux = decoupageEnCreneaux({ deroule: [p("A", 30), p("B", 30)] }, 90)!;
    expect(creneaux).toHaveLength(1);
    expect(creneaux[0]!.minutes).toBe(60);
  });
});
