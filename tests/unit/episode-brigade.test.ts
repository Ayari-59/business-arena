import { describe, expect, it } from "vitest";
import {
  AU_PASSE,
  CA_SEMAINE,
  COUP_DE_FEU_DEPART,
  COUVERTS,
  COUVERTS_SEMAINE,
  D,
  DEMANDE_FETES,
  EXTRA,
  GROUPE,
  HEURES_SUP_DEPART,
  HEURE_SUP,
  IMPREVUS,
  MASSE_SALARIALE,
  PART_COUP_DE_FEU,
  RATIO_MENU_GROUPE,
  SAISONNIER,
  SALLE_SAMEDI,
  SEUIL_PIC,
  SURCOUT_LABO,
  TICKET,
  groupesDeplaces,
  hasard,
  risqueDeDepart,
  simuler,
  tauxDeRetour,
} from "../../src/engine/episodes/brigade-a-bout";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/brigade-a-bout";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_BRIGADE } from "../../src/pedagogy/episodes/brigade-a-bout";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La brigade à bout » enseigne qu'en cuisine on tient une équipe
 * en organisant le travail autour des pics, pas en ajoutant des heures : les
 * coupures et le planning de la veille usent plus que le volume d'heures, un
 * coup de feu sous-dimensionné concentre les assiettes retournées et les
 * heures, la polyvalence coûte en novembre et sécurise décembre, et le second
 * part d'autant plus souvent que la brigade est usée. Ces tests verrouillent
 * les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [1, 0, 0, 1, 1, 1];
const REFLEXE = [0, 1, 3, 0, 0, 0];
const ATTENTISTE = [3, 3, 3, 3, 2, 2];
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
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};

/** Un nombre tel que les sources l'écrivent : « 1 372 ». */
const fr = (v: number) => Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ");
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("le coup de feu chronométré donne la prévision : 22,5 couverts par cuisinier", () => {
    const coup = texte(0, "coupDeFeu");
    expect(coup).toContain(`${COUVERTS.samedi} couverts`);
    expect(coup).toContain("les trois quarts");
    expect(PART_COUP_DE_FEU).toBe(0.75);
    expect(coup).toContain("quatre cuisiniers");
    expect(AU_PASSE).toBe(4);
    expect(coup).toContain(`au-delà de ${SEUIL_PIC} couverts`);
    expect(coup).toContain(`cinq cuisiniers pour ${COUVERTS.midi} couverts`);
    expect(COUP_DE_FEU_DEPART).toBe(22.5);
    expect(EPISODE_BRIGADE.prevision.reel(simuler(MEILLEUR, 1))).toBe(22.5);
  });

  it("les heures, les assiettes retournées et les effectifs de septembre sont ceux du modèle", () => {
    const planning = texte(0, "planning");
    expect(planning).toContain(`${HEURES_SUP_DEPART} par semaine`);
    expect(EPISODE_BRIGADE.etapes[0]!.messages({})[0]!.texte).toContain(
      `${4 * HEURES_SUP_DEPART} heures supplémentaires`,
    );
    // Les assiettes retournées d'un mois de quatre samedis à 22,5 couverts par cuisinier.
    const samedi = COUVERTS.samedi * tauxDeRetour(COUP_DE_FEU_DEPART);
    const reste = (COUVERTS_SEMAINE - COUVERTS.samedi) * 0.012;
    const retours = texte(0, "retours");
    expect(retours).toContain(`${Math.round(4 * (samedi + reste))} assiettes retournées`);
    expect(retours).toContain(`dont ${Math.round(4 * samedi)} un samedi soir`);
    expect(retours).toContain(`${Math.round(tauxDeRetour(COUP_DE_FEU_DEPART) * 100)} %`);
    expect(EPISODE_BRIGADE.etapes[0]!.messages({})[0]!.texte).toContain(
      `${Math.round(samedi)} assiettes retournées`,
    );
    // Au repère de 18 couverts, le taux retombe à celui d'un mois ordinaire.
    expect(tauxDeRetour(SEUIL_PIC)).toBeLessThan(0.025);
    const effectifs = texte(0, "effectifs");
    expect(effectifs).toContain(`${COUVERTS_SEMAINE} couverts par semaine`);
    expect(effectifs).toContain(`${Math.round(COUVERTS_SEMAINE / 9)} couverts par personne`);
    expect(effectifs).toContain(`${Math.round((MASSE_SALARIALE / CA_SEMAINE) * 100)} %`);
  });

  it("les coûts des options et du laboratoire sont chiffrés comme dans le modèle", () => {
    const [heures, , extra] = ETAPES[0]!.options;
    expect(heures!.d).toContain(`${fr(Math.round((32 * HEURE_SUP) / 10) * 10)} €`);
    expect(extra!.d).toContain(`${EXTRA} €`);
    expect(ETAPES[1]!.options[1]!.d).toContain(`${fr(10 * HEURE_SUP)} €`);
    expect(texte(1, "labo")).toContain(
      `environ ${fr(Math.floor((SURCOUT_LABO * CA_SEMAINE) / 10) * 10)} € par semaine`,
    );
    expect(ETAPES[2]!.options[2]!.d).toContain(`${SAISONNIER.semaine} € par semaine`);
    expect(ETAPES[2]!.options[2]!.d).toContain(`${SAISONNIER.recrutement} € de recrutement`);
    expect(ETAPES[2]!.options[1]!.d).toContain(`${2 * EXTRA} € par semaine`);
  });

  it("un groupe le samedi soir remplace des clients à la carte : 140 € de plus seulement", () => {
    const marge = texte(3, "marge");
    const ca = GROUPE.couverts * TICKET.groupe;
    const remplace = GROUPE.couverts * TICKET.samedi;
    expect(marge).toContain(`${fr(ca)} €`);
    expect(marge).toContain(`${fr(remplace)} €`);
    expect(marge).toContain(`${fr(ca - remplace)} €`);
    expect(marge).toContain(`${Math.round(RATIO_MENU_GROUPE * 100)} %`);
    expect(ca - remplace).toBe(140);
    expect(ETAPES[5]!.messages({})[0]!.texte).toContain(`${DEMANDE_FETES} demandes`);
    expect(ETAPES[5]!.messages({})[0]!.texte).toContain(`${SALLE_SAMEDI} couverts`);
  });
});

describe("le modèle de la cuisine", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.absences).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.absences,
      6,
    );
    expect(hasard(5)).toBe(hasard(5));
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

  it("le planning bâti sur le pic ramène le coup de feu près du repère ; l'attente le laisse filer", () => {
    const bon = simuler(MEILLEUR, 3);
    const neutre = simuler(ATTENTISTE, 3);
    expect(bon.chargeSamediMoyenne).toBeLessThan(SEUIL_PIC);
    expect(neutre.chargeSamediMoyenne).toBeGreaterThan(SEUIL_PIC + 4);
    expect(bon.heuresSup).toBeLessThan(neutre.heuresSup / 2);
    expect(bon.retoursMoyens).toBeLessThan(0.02);
  });

  it("les coupures usent plus que les heures : le planning stable fait baisser l'usure sans ajouter d'heures", () => {
    const planning = simuler(avec(ATTENTISTE, D.planning, 1), 4);
    const heures = simuler(avec(ATTENTISTE, D.planning, 0), 4);
    expect(planning.semaines[8]!.usure).toBeLessThan(heures.semaines[8]!.usure - 0.2);
    expect(planning.heuresSup).toBeLessThan(heures.heuresSup);
  });

  it("le second part bien plus souvent quand la brigade est usée, et les samedis de groupe pèsent", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).secondPart).length;
    expect(departs(MEILLEUR)).toBeLessThan(10);
    expect(departs(ATTENTISTE)).toBeGreaterThan(18);
    expect(risqueDeDepart(0.3, 5, 0)).toBeGreaterThan(risqueDeDepart(0.3, 0, 0) + 0.2);
    expect(risqueDeDepart(0.3, 0, 2)).toBeLessThan(risqueDeDepart(0.3, 0, 0));
    expect(risqueDeDepart(1, 5, 3)).toBe(0.85);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : bâtir le planning sur le pic bat de loin les heures supplémentaires et l'extra", () => {
    const r = rejeu(MEILLEUR, D.planning);
    expect(classement(MEILLEUR, D.planning)[0]).toBe(1);
    expect(classement(MEILLEUR, D.planning).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(25000);
  });

  it("D2 : mutualiser la mise en place paie quand le planning est stable ; sinon, le laboratoire fait mieux", () => {
    const stable = rejeu(MEILLEUR, D.miseEnPlace);
    expect(classement(MEILLEUR, D.miseEnPlace)[0]).toBe(0);
    expect(stable[0]!.attendu - stable[2]!.attendu).toBeGreaterThan(4000);
    const instable = rejeu(avec(MEILLEUR, D.planning, 3), D.miseEnPlace);
    expect(instable[2]!.attendu).toBeGreaterThan(instable[0]!.attendu);
    expect(classement(MEILLEUR, D.miseEnPlace).at(-1)).toBe(1);
  });

  it("D3 : former deux commis est le meilleur choix en moyenne ; le saisonnier protège mieux des mauvais tirages", () => {
    const r = rejeu(MEILLEUR, D.polyvalence);
    expect(classement(MEILLEUR, D.polyvalence)[0]).toBe(0);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(1500);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(2000);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(2);
    expect(r[2]!.p10 - r[0]!.p10).toBeGreaterThan(3000);
  });

  it("D4 : garder les groupes hors du samedi soir bat tout accepter", () => {
    const r = rejeu(MEILLEUR, D.groupes);
    expect(classement(MEILLEUR, D.groupes)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(5000);
    // Le hasard dit combien d'entreprises acceptent un autre soir : trois, ou une seule.
    const deplaces = GRAINES_DU_BILAN.map(groupesDeplaces);
    expect(new Set(deplaces)).toEqual(new Set([1, 3]));
  });

  it("D5 : la carte courte pensée pour le coup de feu bat la carte de fêtes à la minute", () => {
    const r = rejeu(MEILLEUR, D.carte);
    expect(classement(MEILLEUR, D.carte)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
  });

  it("D6 : deux services à heures fixes battent les tables poussées", () => {
    const r = rejeu(MEILLEUR, D.fetes);
    expect(classement(MEILLEUR, D.fetes)[0]).toBe(1);
    expect(classement(MEILLEUR, D.fetes).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(2500);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_BRIGADE, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("organiser la brigade autour des pics bat les heures et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(30000);
    expect(methode! - attentiste!).toBeGreaterThan(25000);
    expect(attentiste).toBeGreaterThan(50000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["planning", "coupDeFeu"],
      ["production"],
      ["absences"],
      ["samedis"],
      ["dressage"],
      ["reservations"],
    ],
    jours: JOURS,
    diagnostic: "pics",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 22,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_BRIGADE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a pris tous les réflexes, propose d'organiser le pic plutôt qu'ajouter des heures", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_BRIGADE.comportements(p, analyser(EPISODE_BRIGADE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_BRIGADE.axe(c).titre).toBe("Organiser le pic plutôt qu'ajouter des heures");
  });

  it("à qui a décidé sans enquêter, propose de regarder à quelle heure le travail arrive", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_BRIGADE.comportements(p, analyser(EPISODE_BRIGADE, p).trimestre);
    expect(EPISODE_BRIGADE.axe(c).titre).toBe("Regarder à quelle heure le travail arrive");
  });

  it("juge la prévision du coup de feu au couvert près", () => {
    const t = simuler(MEILLEUR, 11);
    const calibrage = (prevision: number) =>
      EPISODE_BRIGADE.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(22.5)).toBe(1);
    expect(calibrage(24)).toBe(0.6);
    expect(calibrage(18)).toBe(0);
  });

  it("dit le résultat en marge, au regard du budget", () => {
    expect(EPISODE_BRIGADE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/au-dessus du budget/);
    expect(EPISODE_BRIGADE.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous le budget/);
  });
});
