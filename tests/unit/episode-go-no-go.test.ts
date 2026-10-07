import { describe, expect, it } from "vitest";
import {
  AN_DERNIER,
  CAPACITE,
  COUT_D_UN_MARCHE_GAGNE,
  COUT_JOUR,
  D,
  DILUTION,
  IMPREVUS,
  MARCHES,
  MONTANT_DES_DOUZE,
  PRIX,
  RATIO_COUT,
  RENFORT,
  TJM_PUBLIC,
  critereElargi,
  haldenAgressif,
  hasard,
  marche,
  noter,
  reponses,
  simuler,
} from "../../src/engine/episodes/appels-d-offres-en-rafale";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/appels-d-offres-en-rafale";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import {
  mesurerDecision,
  prixDeLaSecurite,
  SEUIL_QUALITE,
} from "../../src/pedagogy/episodes/mesures";
import {
  COUT_EN_KE,
  EPISODE_GO_NO_GO,
  TRANSFORMATION_AN_DERNIER,
} from "../../src/pedagogy/episodes/appels-d-offres-en-rafale";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les appels d'offres en rafale » enseigne qu'un cabinet gagne en
 * choisissant ses appels d'offres sur la probabilité de gain et la marge,
 * puis en y mettant ses meilleures forces : la note technique se fait avec le
 * temps des seniors et l'avantage du cabinet, chaque réponse coûte des jours
 * pris à l'intercontrat ou aux missions facturables, le prix ne pèse que ce
 * que la grille lui donne, et un marché taillé pour le sortant se repère dans
 * le dossier. Ces tests verrouillent les classements qui le disent, et
 * recalculent depuis le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const VOLUME = [0, 0, 0, 0, 0, 0];
const FIL_DE_L_EAU = [3, 2, 0, 2, 2, 2];
const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
/** L'option qui protège le mieux dans les mauvais tirages. */
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
const k = (v: number) => Math.round(v / 1000);
/** Le contexte que le joueur a sous les yeux au moment d'une étape. */
const contexte = (etape: number, decisions: readonly number[], graine = 3): Contexte => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  return EPISODE_GO_NO_GO.contexte(EPISODE_GO_NO_GO.lire(decisions, graine, 0, semaine), decisions);
};
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 3) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string"
    ? s.resultat
    : s.resultat(contexte(etape, decisions, graine));
};

describe("le modèle des appels d'offres", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // L'offre concurrente de Kermelin est la même, quoi qu'on décide.
    const kermelin = (c: readonly number[]) =>
      noter(reponses(c, 12).find((r) => r.marche.id === "kermelin")!, 6, 12);
    expect(kermelin(MEILLEUR).techniqueConcurrent).toBeCloseTo(
      kermelin(VOLUME).techniqueConcurrent,
      9,
    );
    expect(kermelin(MEILLEUR).prixRelatifConcurrent).toBe(kermelin(VOLUME).prixRelatifConcurrent);
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(hasard(g).imprevus.length).toBeGreaterThanOrEqual(1);
      expect(hasard(g).imprevus.length).toBeLessThanOrEqual(2);
      for (const i of hasard(g).imprevus) {
        expect(i.semaine).toBeGreaterThanOrEqual(2);
        expect(i.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("une procédure n'est déclarée sans suite qu'après la remise des offres", () => {
    for (const g of GRAINES_DU_BILAN) {
      for (const i of hasard(g).imprevus) {
        if (!i.imprevu.effet.sansSuite || !i.marche) continue;
        expect(marche(i.marche).remise).toBeLessThan(i.semaine);
        expect(marche(i.marche).attribution).toBeGreaterThan(i.semaine);
      }
    }
  });

  it("Halden casse ses prix et la Métropole élargit son critère selon le hasard, pas toujours", () => {
    const halden = GRAINES_DU_BILAN.filter(haldenAgressif).length;
    expect(halden).toBeGreaterThan(10);
    expect(halden).toBeLessThan(25);
    const elargi = GRAINES_DU_BILAN.filter(critereElargi).length;
    expect(elargi).toBeGreaterThan(3);
    expect(elargi).toBeLessThan(18);
  });

  it("le marché taillé pour Kéroual ne se gagne pas, même à fond", () => {
    const aFond = [1, 0, 1, 1, 1, 1];
    const gagnes = GRAINES_DU_BILAN.filter(
      (g) => simuler(aFond, g).issues.find((x) => x.id === "metropole")!.etat === "gagne",
    ).length;
    expect(gagnes).toBeLessThanOrEqual(1);
  });

  it("répondre à tout prend des jours aux missions facturables, et fait glisser des missions", () => {
    const glissements = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).glissement).length;
    expect(glissements(VOLUME)).toBeGreaterThan(glissements(MEILLEUR) + 5);
    expect(simuler(VOLUME, 3).joursFacturables).toBeGreaterThan(5);
  });

  it("les bonnes décisions transforment bien plus que le volume", () => {
    const taux = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).transformation));
    expect(taux(MEILLEUR)).toBeGreaterThan(0.55);
    expect(taux(VOLUME)).toBeLessThan(0.3);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le coût d'avant-vente d'un marché gagné l'an dernier, que la semaine 1 demande, se pose depuis Tempora", () => {
    const aLaMain = (64 * 720 + 148 * 380) / 4;
    expect(COUT_D_UN_MARCHE_GAGNE).toBeCloseTo(aLaMain, 9);
    expect(COUT_EN_KE).toBeCloseTo(25.58, 9);
    expect(EPISODE_GO_NO_GO.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(25.58, 9);
    expect(TRANSFORMATION_AN_DERNIER).toBeCloseTo(4 / 19, 9);
    const tempora = source(0, "tempora", []);
    expect(tempora).toContain(`${AN_DERNIER.reponses} réponses`);
    expect(tempora).toContain(`${AN_DERNIER.gagnes} marchés gagnés`);
    expect(tempora).toContain(`${AN_DERNIER.seniors} jours de managers et d'associés`);
    expect(tempora).toContain(`${AN_DERNIER.consultants} jours de consultants`);
    expect(tempora).toContain(`${COUT_JOUR.senior} € et ${COUT_JOUR.consultant} € par jour`);
  });

  it("la marge de Kermelin à chaque prix est celle que la source affiche", () => {
    const coutDUnJour = 0.25 * 720 + 0.75 * 380;
    expect(RATIO_COUT * TJM_PUBLIC).toBeCloseTo(coutDUnJour, 9);
    const montant = marche("kermelin").montant;
    const auPrix = montant * (1 - coutDUnJour / 820);
    const aligne = montant * (0.85 - coutDUnJour / 820);
    expect(k(auPrix)).toBe(121);
    expect(k(aligne)).toBe(79);
    const texte = source(3, "marge", [1, 1, 1]);
    expect(texte).toContain(`${Math.round(coutDUnJour)} €`);
    expect(texte).toContain(`la marge du marché est de ${k(auPrix)} k€`);
    expect(texte).toContain(`(TJM de ${Math.round(820 * PRIX.aligne)} €), ${k(aligne)} k€`);
    // Quinze pour cent sous nous, Halden reprend 6 points sur 40 ; deux jours d'associé en valent 4,2 sur 60.
    expect(40 - 40 * 0.85).toBeCloseTo(6, 9);
    expect(RENFORT * 60).toBeCloseTo(4.2, 9);
    expect(source(3, "formule", [1, 1, 1])).toContain("6 points sur le prix");
    expect(source(3, "formule", [1, 1, 1])).toContain("environ 4,2 points");
  });

  it("les notes des mémoires de l'an dernier et la dilution sont celles du modèle", () => {
    // Un mémoire type avec nos références : 0,56 de la note ; piloté chez un client : 0,71.
    const type = 0.5 + 0.06;
    const pilote = 0.5 + 0.06 + 0.05 + 0.1;
    expect(Math.round(60 * type)).toBe(34);
    expect(Math.round(60 * pilote)).toBe(43);
    expect(source(2, "notes", [1, 1])).toContain("34 sur 60");
    expect(source(2, "notes", [1, 1])).toContain("43 sur 60");
    expect(DILUTION * 60).toBeCloseTo(0.72, 9);
    expect(source(0, "rapports", [])).toContain("environ 0,7 point");
  });

  it("le prix serré, les montants et le plan de charge sont ceux du modèle", () => {
    expect(MONTANT_DES_DOUZE).toBe(2_220_000);
    expect(ETAPES[0]!.messages({})[0]!.texte).toContain("2,2 M€");
    expect(ETAPES[0]!.options[0]!.d).toContain(`${Math.round(TJM_PUBLIC * PRIX.serre)} €`);
    const six = ["metropole", "kermelin", "ght", "departement", "argoat", "sdis"];
    expect(six.reduce((s, id) => s + marche(id).montant, 0)).toBe(1_550_000);
    expect(
      [...MARCHES]
        .filter((m) => m.id !== "dechets")
        .sort((a, b) => b.montant - a.montant)
        .slice(0, 6)
        .map((m) => m.id)
        .sort(),
    ).toEqual([...six].sort());
    const charge = source(2, "charge", [1, 1]);
    expect(charge).toContain(`Piloter les 5 réponses retenues demanderait 20 jours`);
    expect(charge).toContain(`${CAPACITE.consultant} jours d'intercontrat`);
  });

  it("les rapports d'analyse de la semaine 9 disent ce que les notes du modèle disent", () => {
    for (const g of [3, 5, 8]) {
      const t = simuler(VOLUME, g, 0);
      const perdus = t.issues.filter((x) => x.etat === "perdu" && marche(x.id).attribution <= 9);
      const ctx = contexte(5, VOLUME.slice(0, 5), g);
      expect(ctx.perdus).toBe(perdus.length);
      const moinsChers = perdus.filter((x) => x.prix < x.notation.prixRelatifConcurrent).length;
      expect(t.semaines[9]!.moinsChers).toBe(moinsChers);
      const ecart = moyenne(
        perdus.map((x) => x.notation.technique - x.notation.techniqueConcurrent),
      );
      expect(t.semaines[9]!.ecartTechnique).toBeCloseTo(ecart, 9);
      // Sur le volume, on perd sur la technique, pas sur le prix.
      expect(ecart).toBeLessThan(0);
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : choisir cinq dossiers à la grille bat répondre à tout, les plus gros, ou le fil de l'eau", () => {
    const r = rejeu(MEILLEUR, D.selection);
    expect(classement(MEILLEUR, D.selection)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(50000);
  });

  it("D2 : décliner le marché taillé pour Kéroual et rencontrer le DGS bat y répondre à fond", () => {
    const r = rejeu(MEILLEUR, D.metropole);
    expect(classement(MEILLEUR, D.metropole)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(12000);
    expect(r[1]!.attendu - Math.max(r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(10000);
  });

  it("D3 : un senior au pilotage de chaque réponse vaut bien plus que l'intercontrat seul ; sur douze réponses, il se prend aux missions", () => {
    const r = rejeu(MEILLEUR, D.redaction);
    expect(classement(MEILLEUR, D.redaction)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(80000);
    // Piloter cinq réponses tient dans le temps commercial ; en piloter douze le prend aux missions facturables.
    const prisAuxMissions = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).joursFacturables));
    const glissements = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).glissement).length;
    expect(prisAuxMissions(MEILLEUR)).toBeLessThan(5);
    expect(prisAuxMissions([0, 1, 1, 1, 1, 1])).toBeGreaterThan(40);
    expect(glissements([0, 1, 1, 1, 1, 1])).toBeGreaterThan(15);
    expect(glissements(MEILLEUR)).toBe(0);
  });

  it("D4 : garder le prix et renforcer le mémoire bat l'alignement ; s'aligner protège, mais coûte trop", () => {
    const r = rejeu(MEILLEUR, D.prix);
    expect(classement(MEILLEUR, D.prix)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
    // L'alignement gagne plus souvent, et protège des mauvais trimestres : au prix de 20 k€ d'espérance.
    expect(plusSure(MEILLEUR, D.prix)).toBe(0);
  });

  it("D5 : piloter le treizième est le meilleur en moyenne ; décliner ou se grouper protège mieux", () => {
    const r = rejeu(MEILLEUR, D.treizieme);
    expect(classement(MEILLEUR, D.treizieme)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(4500);
    expect(plusSure(MEILLEUR, D.treizieme)).not.toBe(1);
    expect(r[3]!.p10).toBeGreaterThan(r[1]!.p10);
  });

  it("D5 : la valeur du pilotage tient aux choix d'avant ; après avoir répondu à tout, mieux vaut décliner", () => {
    expect(classement([0, 1, 1, 1, 1, 1], D.treizieme)[0]).toBe(2);
    // Sans le rendez-vous de la semaine 4, le pilotage perd l'essentiel de son avance.
    const avance = (c: readonly number[]) => {
      const x = rejeu(c, D.treizieme);
      return x[1]!.attendu - x[0]!.attendu;
    };
    expect(avance(MEILLEUR)).toBeGreaterThan(avance([1, 2, 1, 1, 1, 1]) + 1000);
  });

  it("D6 : reprendre les mémoires sur les sous-critères perdus bat la baisse de prix et le référé", () => {
    const r = rejeu(MEILLEUR, D.fin);
    expect(classement(MEILLEUR, D.fin)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
  });

  it("choisir où répondre bat nettement faire du volume et le fil de l'eau", () => {
    const [bonne, volume, fil] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne!).toBeGreaterThan(200000);
    expect(bonne! - volume!).toBeGreaterThan(150000);
    expect(bonne! - fil!).toBeGreaterThan(150000);
    expect(volume!).toBeGreaterThan(-50000);
    expect(fil!).toBeGreaterThan(-50000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_GO_NO_GO, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(
        option === m.plusSure &&
          m.meilleure.moyenne - option.moyenne < prixDeLaSecurite(m.meilleure.p10, m.meilleure.p90),
      ).toBe(false);
    }
    const bonne: readonly number[] = REFERENCES[0].chemin;
    expect(REFLEXES.some(([d, o]) => bonne[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["tempora", "rapports"],
      ["dce"],
      ["notes"],
      ["formule"],
      ["charge2", "besoin"],
      ["analyse"],
    ],
    jours: JOURS,
    diagnostic: "selection",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 25.6,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_GO_NO_GO, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a fait du volume à chaque décision, propose de choisir ses appels d'offres", () => {
    const p = partie(VOLUME);
    const c = EPISODE_GO_NO_GO.comportements(p, analyser(EPISODE_GO_NO_GO, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_GO_NO_GO.axe(c).titre).toBe(
      "Choisir ses appels d'offres plutôt que faire du volume",
    );
  });

  it("à qui a décidé sans enquêter, propose de regarder ce que coûtent ses réponses", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_GO_NO_GO.comportements(p, analyser(EPISODE_GO_NO_GO, p).trimestre);
    expect(EPISODE_GO_NO_GO.axe(c).titre).toBe("Regarder ce que coûtent vos réponses");
  });

  it("à qui a répondu au fil de l'eau sans piloter, propose de concentrer ses forces", () => {
    const p = partie(FIL_DE_L_EAU, { diagnostic: "seniors" });
    const c = EPISODE_GO_NO_GO.comportements(p, analyser(EPISODE_GO_NO_GO, p).trimestre);
    expect(c[4]!.score).toBe(0);
    expect(c[1]!.score).toBe(0.6);
    expect(EPISODE_GO_NO_GO.axe(c).titre).toBe("Mettre ses meilleures forces sur peu de réponses");
  });

  it("juge le coût d'un marché gagné calculé en semaine 1 : juste, proche, ou faute d'avoir divisé par les marchés gagnés", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_GO_NO_GO.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(25.6)).toBe(1);
    expect(score(27.5)).toBe(0.6);
    // Divisé par les réponses plutôt que par les marchés gagnés : 5,4 k€.
    expect(score((64 * 720 + 148 * 380) / 19 / 1000)).toBe(0);
    // Tous les jours au coût d'un consultant : 19,9 k€.
    expect(score((212 * 380) / 4 / 1000)).toBe(0);
  });

  it("dit le résultat en marge nette, ou en pertes", () => {
    expect(EPISODE_GO_NO_GO.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/de marge nette/);
    const perte = GRAINES_DU_BILAN.map((g) => simuler(VOLUME, g)).find((t) => t.objectif < 0)!;
    expect(EPISODE_GO_NO_GO.bilan.titre(perte)).toMatch(/de pertes/);
  });
});
