import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { etapesEleve, etapesEnseignant, type FaitsDeLaPartie } from "@/config/fiches";

/**
 * LES DEUX FICHES D'UNE PAGE.
 *
 * Le guide en ligne est complet, mais une page web ne se distribue pas en
 * salle. Ces gardes tiennent deux choses : la fiche tient sur une feuille, et
 * elle ne promet aucun geste que l'appli ne fait pas — une fiche qui envoie
 * chercher un bouton inexistant ne se rouvre jamais.
 */

const FAITS: FaitsDeLaPartie = {
  scenario: "NOVA · gamme",
  entreprise: "NOVA",
  code: "K7M2PR",
  adresse: "www.business-arena.fr/join",
  niveau: { rang: 3, nom: "Pilotage" },
  tours: 6,
  periode: "trimestre",
  champs: 10,
  avecQuiz: true,
  minutesTourCourant: 10,
  minutesPremierTour: 19,
  mesure: false,
  equipes: 5,
  premierTourDejaJoue: false,
};

const texte = (etapes: { titre: string; texte: string }[]) =>
  etapes.map((e) => `${e.titre} ${e.texte}`).join(" ");

describe("la fiche élève", () => {
  const etapes = etapesEleve(FAITS);

  it("va de l'entrée par code à la validation, sans détour", () => {
    expect(etapes[0]!.titre).toContain("code");
    expect(etapes[etapes.length - 1]!.titre).toContain("Validez");
  });

  it("porte le code et l'adresse de CETTE partie", () => {
    expect(etapes[0]!.texte).toContain("K7M2PR");
    expect(etapes[0]!.texte).toContain("www.business-arena.fr/join");
  });

  it("dit les deux pièges qu'on ne devine pas", () => {
    const tout = texte(etapes);
    // Le poste partagé, et l'échéance après laquelle plus rien ne passe.
    expect(tout).toContain("Ce n'est pas moi");
    expect(tout).toContain("Après l'échéance");
  });

  it("nomme les onglets tels qu'ils s'appellent à l'écran", () => {
    const tout = texte(etapes);
    for (const onglet of ["Situation", "Analyser", "Décider"]) {
      expect(tout, onglet).toContain(`« ${onglet} »`);
    }
  });

  it("annonce le nombre de champs de la partie, pas un nombre en général", () => {
    expect(texte(etapes)).toContain("10 champs");
    expect(texte(etapesEleve({ ...FAITS, champs: 23 }))).toContain("23 champs");
  });

  it("sans questions de connaissances, elle ne les promet pas", () => {
    const sans = texte(etapesEleve({ ...FAITS, avecQuiz: false }));
    expect(sans).not.toContain("répondez aux questions");
    expect(sans).toContain("diagnostic");
  });

  it("tient sur une feuille : sept étapes, aucune qui déborde", () => {
    expect(etapes.length).toBeLessThanOrEqual(7);
    for (const e of etapes) {
      expect(e.texte.length, `${e.titre} : ${e.texte.length} signes`).toBeLessThanOrEqual(340);
      expect(e.titre.length).toBeLessThanOrEqual(34);
    }
  });
});

describe("la fiche enseignant", () => {
  const etapes = etapesEnseignant(FAITS);

  it("suit l'ordre d'une séance, de la préparation au relevé", () => {
    expect(etapes[0]!.titre).toContain("Avant");
    expect(etapes[etapes.length - 1]!.titre).toContain("Après");
  });

  it("envoie vers les écrans qui existent, sous leur nom", () => {
    const tout = texte(etapes);
    for (const ecran of [
      "Projeter pour la classe",
      "Observation de séance",
      "Planning des tours",
      "Clore le tour",
    ]) {
      expect(tout, ecran).toContain(ecran);
    }
  });

  it("annonce les deux durées au premier tour, une seule ensuite", () => {
    expect(texte(etapes)).toContain("19 min pour le premier tour");
    const plusTard = texte(etapesEnseignant({ ...FAITS, premierTourDejaJoue: true }));
    expect(plusTard).not.toContain("premier tour");
    expect(plusTard).toContain("10 min");
  });

  it("dit quand le chiffre est mesuré plutôt qu'estimé", () => {
    expect(texte(etapesEnseignant({ ...FAITS, mesure: true }))).toContain("mesuré chez vous");
    expect(texte(etapes)).not.toContain("mesuré chez vous");
  });

  it("tient sur une feuille", () => {
    expect(etapes.length).toBeLessThanOrEqual(7);
    for (const e of etapes) {
      expect(e.texte.length, `${e.titre} : ${e.texte.length} signes`).toBeLessThanOrEqual(340);
    }
  });
});

describe("imprimées depuis la partie", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
  const page = lire("src/app/teacher/games/[gameId]/fiches/page.tsx");

  it("la page lit la partie réelle : code, niveau, champs, durée", () => {
    expect(page).toContain("getTeacherGameView");
    expect(page).toContain("view.joinCode");
    expect(page).toContain("view.chargeDuTour");
    expect(page).toContain("dureeDuTour");
  });

  it("la durée suit la même règle que l'écran de pilotage : mesure d'abord", () => {
    expect(page).toContain("getObservationSeance");
    expect(page).toContain("minutesMedianes ?? estimationCourante.minutes");
  });

  it("elle s'imprime : thème clair, A4, chrome d'écran masqué", () => {
    expect(page).toContain('data-theme="clair"');
    expect(page).toContain("@page { size: A4 portrait");
    expect(page).toContain("no-print");
  });

  it("le pilotage y mène depuis le ticket du code", () => {
    const pilotage = lire("src/app/teacher/games/[gameId]/page.tsx");
    const ticket = pilotage.slice(pilotage.indexOf('aria-label="Code d\'invitation"'));
    expect(ticket).toContain("/fiches");
    expect(ticket).toContain("Fiches à imprimer");
  });
});
