import { describe, expect, it } from "vitest";
import {
  METHODE_DES_PAIRS,
  bornesValables,
  calculerLEquipe,
  lireUneNoteDEquipe,
  noteIndividuelle,
  phraseDuSignal,
  type NotesDonnees,
} from "@/config/pairs/calcul";
import {
  CRITERES_PAR_DEFAUT,
  ECHELLE_DES_PAIRS,
  criteresRetenus,
  tourDeMiParcours,
} from "@/config/pairs/criteres";
import { csvDesPairs, nomDuFichierDesPairs } from "@/config/pairs/export";

/**
 * LE FACTEUR INDIVIDUEL (config/pairs/calcul.ts), CAS PAR CAS.
 *
 * Chaque règle écrite en tête du module a son cas ici : le cas d'école, l'équipe de deux,
 * le non-répondant, l'équipe muette, les bornes, l'auto-évaluation exclue (et incluse), la
 * réponse devenue incomplète, puis les signaux et la note individuelle.
 */

const C = ["a", "b"];
/** Une réponse où chaque critère reçoit la même note. */
const r = (evaluateur: string, evalue: string, note: number, criteres = C): NotesDonnees => ({
  evaluateur,
  evalue,
  notes: Object.fromEntries(criteres.map((c) => [c, note])),
});
const de = (res: ReturnType<typeof calculerLEquipe>, id: string) => res.membres.find((m) => m.userId === id)!;

describe("la méthode est versionnée", () => {
  it("v1 : WebPA, bornes 0,8 et 1,2, seuils des signaux", () => {
    // Changer l'une de ces valeurs change les facteurs déjà affichés : c'est une version
    // nouvelle, pas une retouche.
    expect(METHODE_DES_PAIRS).toMatchObject({
      code: "webpa",
      version: 1,
      bornes: { basse: 0.8, haute: 1.2 },
      seuils: { ecartAuto: 1, tresBas: 2, desaccord: 2 },
    });
  });
});

describe("le facteur WebPA", () => {
  it("le cas d'école : trois membres, tous répondent", () => {
    // A donne 5 à B et 3 à C ; B donne 4 à A et 2 à C ; C donne 4 à A et 4 à B.
    const res = calculerLEquipe({
      membres: ["A", "B", "C"],
      criteres: C,
      reponses: [r("A", "B", 5), r("A", "C", 3), r("B", "A", 4), r("B", "C", 2), r("C", "A", 4), r("C", "B", 4)],
    });
    // Parts reçues : A = 16/24 + 16/32 = 1,1667 ; B = 20/32 + 16/32 = 1,125 ; C = 12/32 + 8/24 = 0,7083.
    // Part attendue : 2 répondants × 1/2 = 1.
    expect(de(res, "A").facteurBrut).toBeCloseTo(1.1667, 4);
    expect(de(res, "B").facteurBrut).toBeCloseTo(1.125, 4);
    expect(de(res, "C").facteurBrut).toBeCloseTo(0.7083, 4);
    expect(de(res, "A").facteur).toBe(1.17);
    expect(de(res, "B").facteur).toBe(1.13);
    // C est ramené à la borne basse, et le signal le dit.
    expect(de(res, "C").facteur).toBe(0.8);
    expect(de(res, "C").signaux).toContainEqual({ code: "borne", brut: 0.71 });
    // La somme des facteurs bruts vaut le nombre de membres quand tous répondent.
    expect(res.membres.reduce((s, m) => s + m.facteurBrut, 0)).toBeCloseTo(3, 3);
    expect(res.repondants).toBe(3);
    expect(de(res, "A").moyennes).toEqual({ a: 4, b: 4 });
    expect(de(res, "C").moyenne).toBe(2.5);
  });

  it("insensible à la sévérité : noter tout le monde 2 ou 5 ne déplace rien", () => {
    const res = calculerLEquipe({
      membres: ["A", "B", "C"],
      criteres: C,
      reponses: [r("A", "B", 2), r("A", "C", 2), r("B", "A", 5), r("B", "C", 5), r("C", "A", 3), r("C", "B", 3)],
    });
    for (const m of res.membres) {
      expect(m.facteur).toBe(1);
      expect(m.regle).toBe("calcule");
    }
  });

  it("un non-répondant : ses notes données ne comptent pas, il reçoit celles des autres", () => {
    // C ne répond qu'à moitié (il a oublié B) : il n'est pas répondant. Ce qu'il a donné à A
    // (un 1, qui ferait plonger A) ne compte pas.
    const res = calculerLEquipe({
      membres: ["A", "B", "C"],
      criteres: C,
      reponses: [r("A", "B", 4), r("A", "C", 2), r("B", "A", 4), r("B", "C", 2), r("C", "A", 1)],
    });
    expect(res.repondants).toBe(2);
    expect(de(res, "C").aRepondu).toBe(false);
    // A est noté par B seul : 4 face à 2, part 2/3, attendue 1/2.
    expect(de(res, "A").facteurBrut).toBeCloseTo(4 / 3, 4);
    expect(de(res, "A").facteur).toBe(1.2);
    expect(de(res, "A").evaluateurs).toBe(1);
    // C reçoit les notes de A et B : 2 face à 4, part 1/3 deux fois, attendue 1.
    expect(de(res, "C").facteurBrut).toBeCloseTo(2 / 3, 4);
    expect(de(res, "C").evaluateurs).toBe(2);
    expect(de(res, "C").moyenne).toBe(2);
  });

  it("une équipe où personne n'a répondu : facteur 1 pour tous", () => {
    const res = calculerLEquipe({ membres: ["A", "B", "C"], criteres: C, reponses: [] });
    expect(res.repondants).toBe(0);
    for (const m of res.membres) {
      expect(m.facteur).toBe(1);
      expect(m.regle).toBe("personne-n-a-repondu");
      expect(m.moyenne).toBeNull();
    }
  });

  it("le seul répondant de l'équipe n'est noté par personne : facteur 1", () => {
    const res = calculerLEquipe({ membres: ["A", "B", "C"], criteres: C, reponses: [r("A", "B", 5), r("A", "C", 1)] });
    expect(de(res, "A").regle).toBe("personne-ne-l-a-note");
    expect(de(res, "A").facteur).toBe(1);
    // Les deux autres sont notés par A seul : 5 face à 1.
    expect(de(res, "B").facteurBrut).toBeCloseTo(10 / 12 / 0.5, 4);
    expect(de(res, "B").facteur).toBe(1.2);
    expect(de(res, "C").facteur).toBe(0.8);
  });

  it("une équipe de deux : le facteur reste à 1, les moyennes et les signaux se lisent", () => {
    const res = calculerLEquipe({ membres: ["A", "B"], criteres: C, reponses: [r("A", "B", 1), r("B", "A", 5)] });
    for (const m of res.membres) {
      expect(m.regle).toBe("equipe-de-deux");
      expect(m.facteur).toBe(1);
    }
    expect(de(res, "B").moyenne).toBe(1);
    // Un seul évaluateur suffit à « très bas par tous » dans une équipe de deux.
    expect(de(res, "B").signaux).toContainEqual({ code: "tres-bas", evaluateurs: 1 });
  });

  it("un membre sans coéquipier : facteur 1, rien à évaluer", () => {
    const res = calculerLEquipe({ membres: ["A"], criteres: C, reponses: [r("A", "A", 5)] });
    expect(de(res, "A").regle).toBe("seul");
    expect(de(res, "A").facteur).toBe(1);
    expect(res.repondants).toBe(0);
  });

  it("les bornes réglées s'appliquent, et le facteur est arrondi au centième", () => {
    const reponses = [r("A", "B", 5), r("A", "C", 3), r("B", "A", 4), r("B", "C", 2), r("C", "A", 4), r("C", "B", 4)];
    const large = calculerLEquipe({ membres: ["A", "B", "C"], criteres: C, reponses, bornes: { basse: 0.5, haute: 1.5 } });
    expect(de(large, "C").facteur).toBe(0.71);
    expect(de(large, "C").signaux.some((s) => s.code === "borne")).toBe(false);
    const serre = calculerLEquipe({ membres: ["A", "B", "C"], criteres: C, reponses, bornes: { basse: 0.9, haute: 1.1 } });
    expect(de(serre, "A").facteur).toBe(1.1);
    expect(de(serre, "C").facteur).toBe(0.9);
  });

  it("l'auto-évaluation est exclue du facteur par défaut, et montrée à part", () => {
    const pairs = [r("A", "B", 4), r("A", "C", 4), r("B", "A", 4), r("B", "C", 4), r("C", "A", 4), r("C", "B", 4)];
    // C se met 5, A se met 1 : rien ne bouge dans le facteur.
    const res = calculerLEquipe({ membres: ["A", "B", "C"], criteres: C, reponses: [...pairs, r("C", "C", 5), r("A", "A", 1)] });
    for (const m of res.membres) expect(m.facteur).toBe(1);
    expect(de(res, "C").auto).toEqual({ a: 5, b: 5 });
    expect(de(res, "C").autoMoyenne).toBe(5);
    expect(de(res, "C").moyenne).toBe(4);
    expect(de(res, "B").auto).toBeNull();
    expect(de(res, "C").signaux).toContainEqual({ code: "auto-surestime", ecart: 1 });
    expect(de(res, "A").signaux).toContainEqual({ code: "auto-sous-estime", ecart: 3 });
  });

  it("la méthode sait inclure l'auto-évaluation : chacun partage aussi avec lui-même", () => {
    const res = calculerLEquipe({
      membres: ["A", "B"],
      criteres: C,
      reponses: [r("A", "A", 3), r("A", "B", 5), r("B", "A", 3), r("B", "B", 5)],
      autoDansLeFacteur: true,
      bornes: { basse: 0.5, haute: 1.5 },
    });
    // Chacun donne 3/8 à A et 5/8 à B ; attendu 2 × 1/2 = 1.
    expect(de(res, "A").regle).toBe("calcule");
    expect(de(res, "A").facteur).toBe(0.75);
    expect(de(res, "B").facteur).toBe(1.25);
  });

  it("un membre arrivé après coup rend incomplètes les réponses qui ne le notent pas", () => {
    const res = calculerLEquipe({
      membres: ["A", "B", "C", "D"],
      criteres: C,
      reponses: [r("A", "B", 5), r("A", "C", 3), r("B", "A", 4), r("B", "C", 2), r("C", "A", 4), r("C", "B", 4)],
    });
    expect(res.repondants).toBe(0);
    expect(de(res, "D").regle).toBe("personne-n-a-repondu");
  });

  it("une réponse donnée par, ou sur, quelqu'un qui a quitté l'équipe est ignorée", () => {
    const res = calculerLEquipe({
      membres: ["A", "B", "C"],
      criteres: C,
      reponses: [r("A", "B", 4), r("A", "C", 4), r("B", "A", 4), r("B", "C", 4), r("C", "A", 4), r("C", "B", 4), r("X", "A", 1), r("A", "X", 5)],
    });
    for (const m of res.membres) expect(m.facteur).toBe(1);
    expect(de(res, "A").evaluateurs).toBe(2);
  });

  it("une note hors de l'échelle rend la réponse incomplète", () => {
    const res = calculerLEquipe({
      membres: ["A", "B", "C"],
      criteres: C,
      reponses: [
        { evaluateur: "A", evalue: "B", notes: { a: 6, b: 5 } },
        r("A", "C", 3),
        r("B", "A", 4),
        r("B", "C", 4),
        r("C", "A", 4),
        r("C", "B", 4),
      ],
    });
    expect(de(res, "A").aRepondu).toBe(false);
    expect(res.repondants).toBe(2);
  });
});

describe("les signaux", () => {
  it("noté très bas par tous : chaque évaluateur donne 2 ou moins en moyenne", () => {
    const res = calculerLEquipe({
      membres: ["A", "B", "C"],
      criteres: C,
      reponses: [r("A", "B", 4), r("A", "C", 2), r("B", "A", 4), r("B", "C", 1), r("C", "A", 4), r("C", "B", 4)],
    });
    expect(de(res, "C").signaux).toContainEqual({ code: "tres-bas", evaluateurs: 2 });
    expect(de(res, "A").signaux.some((s) => s.code === "tres-bas")).toBe(false);
  });

  it("très bas par UN évaluateur sur deux ne suffit pas", () => {
    const res = calculerLEquipe({
      membres: ["A", "B", "C"],
      criteres: C,
      reponses: [r("A", "B", 4), r("A", "C", 2), r("B", "A", 4), r("B", "C", 4), r("C", "A", 4), r("C", "B", 4)],
    });
    expect(de(res, "C").signaux.some((s) => s.code === "tres-bas")).toBe(false);
  });

  it("désaccord fort : deux évaluateurs à deux points d'écart, signalé sur l'équipe", () => {
    const res = calculerLEquipe({
      membres: ["A", "B", "C"],
      criteres: C,
      reponses: [r("A", "B", 3), r("A", "C", 5), r("B", "A", 3), r("B", "C", 2), r("C", "A", 3), r("C", "B", 3)],
    });
    expect(de(res, "C").signaux).toContainEqual({ code: "desaccord", ecart: 3 });
    expect(res.desaccord).toBe(true);
    const calme = calculerLEquipe({
      membres: ["A", "B", "C"],
      criteres: C,
      reponses: [r("A", "B", 3), r("A", "C", 4), r("B", "A", 3), r("B", "C", 3), r("C", "A", 3), r("C", "B", 3)],
    });
    expect(calme.desaccord).toBe(false);
  });

  it("chaque signal se dit en une phrase, sans tiret", () => {
    for (const s of [
      { code: "auto-surestime", ecart: 1.5 },
      { code: "auto-sous-estime", ecart: 1 },
      { code: "tres-bas", evaluateurs: 2 },
      { code: "desaccord", ecart: 2 },
      { code: "borne", brut: 0.65 },
    ] as const) {
      const phrase = phraseDuSignal(s);
      expect(phrase.length).toBeGreaterThan(10);
      expect(phrase).not.toMatch(/ [-–—] /);
    }
    expect(phraseDuSignal({ code: "borne", brut: 0.65 })).toContain("0,65");
  });
});

describe("la note individuelle", () => {
  it("note d'équipe × facteur, bornée au barème, au dixième", () => {
    expect(noteIndividuelle(14, 1.17, 20)).toBe(16.4);
    expect(noteIndividuelle(18, 1.2, 20)).toBe(20);
    expect(noteIndividuelle(90, 1.2, 100)).toBe(100);
    expect(noteIndividuelle(12, 0.8, 20)).toBe(9.6);
    expect(noteIndividuelle(null, 1.1, 20)).toBeNull();
  });

  it("la saisie d'une note d'équipe : virgule française, dans le barème", () => {
    expect(lireUneNoteDEquipe("14,5", 20)).toBe(14.5);
    expect(lireUneNoteDEquipe(" 12 ", 20)).toBe(12);
    expect(lireUneNoteDEquipe("", 20)).toBeNull();
    expect(lireUneNoteDEquipe("21", 20)).toBe("invalide");
    expect(lireUneNoteDEquipe("85", 100)).toBe(85);
    expect(lireUneNoteDEquipe("-3", 20)).toBe("invalide");
    expect(lireUneNoteDEquipe("=1+1", 20)).toBe("invalide");
  });

  it("des bornes valables : parmi les valeurs proposées, autour de 1", () => {
    expect(bornesValables({ basse: 0.8, haute: 1.2 })).toBe(true);
    expect(bornesValables({ basse: 1, haute: 1 })).toBe(false);
    expect(bornesValables({ basse: 0.75, haute: 1.2 })).toBe(false);
    expect(bornesValables({ basse: 1.1, haute: 1.2 })).toBe(false);
  });
});

describe("les critères et les moments", () => {
  it("quatre critères par défaut, une échelle de 1 à 5 avec ses libellés", () => {
    expect(CRITERES_PAR_DEFAUT.map((c) => c.libelle)).toEqual([
      "Contribution aux décisions",
      "Fiabilité et présence",
      "Écoute et coopération",
      "Qualité des analyses",
    ]);
    expect(ECHELLE_DES_PAIRS.map((e) => e.note)).toEqual([1, 2, 3, 4, 5]);
    for (const c of CRITERES_PAR_DEFAUT) expect(`${c.libelle} ${c.aide}`).not.toMatch(/ [-–—] /);
  });

  it("les critères retenus : cochés, puis libres, jamais aucun", () => {
    expect(criteresRetenus({ coches: ["ecoute", "decisions"], libres: ["  Ponctualité  ", "", "Rédaction", "Trop"] }).map((c) => c.code)).toEqual([
      "decisions",
      "ecoute",
      "libre-1",
      "libre-2",
    ]);
    expect(criteresRetenus({ coches: [], libres: [] })).toHaveLength(CRITERES_PAR_DEFAUT.length);
  });

  it("la mi-parcours s'ouvre à la clôture de la moitié des tours, arrondie au-dessus", () => {
    expect(tourDeMiParcours(6)).toBe(3);
    expect(tourDeMiParcours(5)).toBe(3);
    expect(tourDeMiParcours(3)).toBe(2);
    expect(tourDeMiParcours(1)).toBe(1);
  });
});

describe("l'export", () => {
  it("point-virgule, BOM, virgule décimale, formules neutralisées, nom daté en ASCII", () => {
    const res = calculerLEquipe({
      membres: ["A", "B", "C"],
      criteres: C,
      reponses: [r("A", "B", 5), r("A", "C", 3), r("B", "A", 4), r("B", "C", 2), r("C", "A", 4), r("C", "B", 4)],
    });
    const le = new Date("2026-10-12T10:00:00Z");
    const { nom, contenu } = csvDesPairs({
      partie: "Seconde 3 · NOVA",
      criteres: [
        { code: "a", libelle: "Critère A", aide: "" },
        { code: "b", libelle: "Critère B", aide: "" },
      ],
      bareme: 20,
      lignes: res.membres.map((m) => ({
        equipe: "Équipe 1",
        nom: m.userId === "A" ? "=HYPERLIEN()" : m.userId,
        identification: "saisie",
        moment: "fin",
        resultat: m,
        noteDEquipe: 14,
        noteIndividuelle: noteIndividuelle(14, m.facteur, 20),
      })),
      le,
    });
    expect(nom).toBe("coequipiers-seconde-3-nova-2026-10-12.csv");
    expect(nomDuFichierDesPairs("Évaluation", le)).toMatch(/^coequipiers-evaluation-2026-10-12\.csv$/);
    expect(contenu.startsWith("﻿")).toBe(true);
    const lignes = contenu.trim().split("\r\n");
    expect(lignes).toHaveLength(4);
    expect(lignes[0]).toContain("Note individuelle (sur 20)");
    expect(lignes[0]!.split(";")).toHaveLength(15);
    expect(contenu).toContain("'=HYPERLIEN()");
    const c = lignes.find((l) => l.startsWith("Équipe 1;C;"))!;
    expect(c).toContain(";0,71;0,8;14;11,2;");
    expect(c).toContain("Facteur ramené dans les bornes");
    // Ni adresse électronique, ni commentaire : l'export ne sort que des notes et des facteurs.
    expect(contenu).not.toMatch(/@/);
  });
});
