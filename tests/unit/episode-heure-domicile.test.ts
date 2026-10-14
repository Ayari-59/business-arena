import { describe, expect, it } from "vitest";
import {
  AN_DERNIER,
  CHARGES,
  COUT_APPARENT,
  COUT_DE_REVIENT,
  COUT_HORAIRE,
  COUT_MARGINAL,
  COURTES,
  D,
  FRAIS_KM,
  HEURES_PAYEES,
  HEURES_PLANIFIEES,
  HEURES_SEMAINE,
  IMPREVUS,
  PAR_HEURE,
  PART_APA,
  PRODUITS,
  RATIOS,
  RESULTAT_AN_DERNIER,
  RURAL,
  SALAIRES,
  SEMAINES_PROJETEES,
  STRUCTURE,
  TARIF,
  TRAJETS_LONGUES,
  confiance,
  hasard,
  majoration,
  plainte,
  simuler,
} from "../../src/engine/episodes/heure-a-domicile";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/heure-a-domicile";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_HEURE_DOMICILE } from "../../src/pedagogy/episodes/heure-a-domicile";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'heure d'aide à domicile » enseigne le coût de revient d'une
 * heure facturée : il porte les trajets, la coordination, la formation, les
 * absences et les annulations, payés sans être facturés ; rapporté aux seules
 * heures facturées, il dépasse de loin le coût que la comptabilité annonce.
 * On agit sur les tournées, les annulations et le CPOM, pas en refusant les
 * petites interventions ni en diluant les frais fixes. Ces tests verrouillent
 * les classements qui le disent, et la cohérence des chiffres donnés au joueur
 * avec les constantes du modèle.
 */

const MEILLEUR = [1, 1, 1, 1, 2, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [3, 3, 2, 2, 3, 3];
const JOURS = 2;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
const source = (etape: number, id: string) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat({});
};
/** Un nombre écrit comme les sources l'écrivent : espace des milliers, virgule décimale. */
const ecrit = (v: number, d = 0) =>
  v
    .toFixed(d)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const ke = (v: number) => `${ecrit(Math.round(v / 1000))} k€`;
const minutes = (heures: number) => Math.round(heures * 60);

describe("les chiffres donnés au joueur sont ceux du modèle", () => {
  it("la paie : 119 950 heures payées pour 95 000 facturées, et le détail des heures non facturées", () => {
    const texte = source(0, "paie");
    expect(texte).toContain(`${ecrit(HEURES_PAYEES)} heures payées`);
    expect(texte).toContain(`${ecrit(AN_DERNIER.facturees)} heures facturées`);
    expect(texte).toContain(`${ecrit(HEURES_PAYEES - AN_DERNIER.facturees)} autres`);
    for (const k of ["trajets", "annulees", "coordination", "absences", "formation"] as const) {
      expect(texte).toContain(`${ecrit(AN_DERNIER[k])} heures`);
    }
    expect(texte).toContain(`${ecrit(COUT_HORAIRE, 2)} €`);
  });

  it("les comptes : 2 596 k€ de charges, 26 € sur les heures planifiées, 27,33 € sur les heures facturées", () => {
    const texte = source(0, "comptes");
    for (const v of [SALAIRES, FRAIS_KM, STRUCTURE, CHARGES, PRODUITS])
      expect(texte).toContain(ke(v));
    expect(texte).toContain(`${ecrit(HEURES_PLANIFIEES)} heures planifiées`);
    expect(texte).toContain(`${ecrit(COUT_APPARENT, 2)} €, arrondi à 26 €`);
    expect(Math.round(COUT_APPARENT)).toBe(26);
    expect(ke(RESULTAT_AN_DERNIER)).toBe("-240 k€");
    // La perte n'est pas de 1,20 € par heure (114 k€) mais de 2,53 €.
    expect((26 - TARIF) * AN_DERNIER.facturees).toBeCloseTo(114000, 0);
    expect(COUT_DE_REVIENT - TARIF).toBeCloseTo(-RESULTAT_AN_DERNIER / AN_DERNIER.facturees, 9);
    expect(COUT_DE_REVIENT).toBeCloseTo(27.33, 2);
    // Ligne par ligne, la décomposition retombe sur le même coût.
    const somme = Object.values(PAR_HEURE).reduce((s, x) => s + x, 0);
    expect(somme).toBeCloseTo(COUT_DE_REVIENT, 9);
    expect(EPISODE_HEURE_DOMICILE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(27.33, 2);
  });

  it("les passages courts : 14 % des heures, 35 % des trajets, 18 minutes de route par heure", () => {
    const texte = source(0, "courtes");
    expect(texte).toContain(`${Math.round(COURTES.part * 100)} % des heures facturées`);
    expect(texte).toContain(
      `${Math.round(((COURTES.part * COURTES.trajets) / RATIOS.trajets) * 100)} % des trajets`,
    );
    expect(texte).toContain(`${minutes(COURTES.trajets)} minutes de route`);
    expect(minutes(TRAJETS_LONGUES)).toBe(5);
    // Une heure courte coûte plus que le tarif, une heure longue moins.
    expect(COUT_MARGINAL.courte).toBeGreaterThan(TARIF);
    expect(COUT_MARGINAL.longue).toBeLessThan(TARIF);
  });

  it("la carte de la reprise : une heure dans les villages coûte plus de 32 €", () => {
    const texte = source(2, "carte");
    expect(texte).toContain(`${minutes(RURAL.trajets)} minutes de route`);
    expect(texte).toContain(`${RURAL.trajets * RURAL.kmParHeureDeTrajet} km par heure facturée`);
    expect(texte).toContain(`contre ${minutes(RATIOS.trajets)} minutes`);
    expect(COUT_MARGINAL.rurale).toBeCloseTo(32.62, 2);
    // Le calcul de Mihaela : 3 € de contribution par heure, si l'on croit au coût apparent.
    expect(Math.round(TARIF - (COUT_APPARENT - PAR_HEURE.structure))).toBe(3);
  });

  it("l'ordre de grandeur du CPOM : 1 € de l'heure au 1er juillet, environ 42 k€ d'ici décembre", () => {
    expect(source(4, "engagements")).toContain(`${Math.round(PART_APA * 100)} %`);
    expect(Math.round((PART_APA * HEURES_SEMAINE * SEMAINES_PROJETEES) / 1000)).toBe(42);
    expect(source(4, "engagements")).toContain("environ 42 k€");
  });
});

describe("le modèle du service d'aide à domicile", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.facturees).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.facturees,
      6,
    );
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

  it("sans rien changer, l'exercice perd à peu près ce qu'il perdait l'an dernier", () => {
    const neutre = attendu(ATTENTISTE);
    expect(neutre).toBeGreaterThan(RESULTAT_AN_DERNIER - 15000);
    expect(neutre).toBeLessThan(RESULTAT_AN_DERNIER + 15000);
  });

  it("refuser les passages courts baisse la part des trajets, mais monte le coût de l'heure", () => {
    const refus = simuler([0, 3, 2, 2, 3, 3], 5);
    const neutre = simuler(ATTENTISTE, 5);
    expect(refus.trajetsRegime).toBeLessThan(neutre.trajetsRegime - 0.015);
    expect(refus.coutRegime).toBeGreaterThan(neutre.coutRegime);
    expect(refus.heuresRegime).toBeLessThan(0.85 * neutre.heuresRegime);
  });

  it("une famille saisit le département après un refus environ six fois sur dix, jamais sinon", () => {
    const n = GRAINES_DU_BILAN.filter((g) => plainte(REFLEXE, g)).length;
    expect(n).toBeGreaterThan(12);
    expect(n).toBeLessThan(24);
    expect(GRAINES_DU_BILAN.some((g) => plainte(MEILLEUR, g))).toBe(false);
    expect(confiance(MEILLEUR, 1)).toBeGreaterThan(confiance(REFLEXE, 1) + 0.5);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : sectoriser les tournées ; refuser les passages courts est le pire, diluer ne paie pas", () => {
    const c = classement(MEILLEUR, D.levier);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.levier, 1, 3)).toBeGreaterThan(30000);
    expect(ecart(MEILLEUR, D.levier, 3, 0)).toBeGreaterThan(15000);
    expect(ecart(MEILLEUR, D.levier, 3, 2)).toBeGreaterThan(5000);
  });

  it("D2 : alerter et réaffecter ; faire payer les familles est le pire", () => {
    const c = classement(MEILLEUR, D.annulations);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.annulations, 1, 3)).toBeGreaterThan(10000);
  });

  it("D3 : reprendre les bénéficiaires de nos tournées, pas les villages ; tout reprendre ne dilue rien", () => {
    const c = classement(MEILLEUR, D.reprise);
    expect(c[0]).toBe(1);
    expect(ecart(MEILLEUR, D.reprise, 1, 0)).toBeGreaterThan(10000);
  });

  it("D4 : alléger les transmissions sans supprimer les réunions ni les formations", () => {
    const c = classement(MEILLEUR, D.coordination);
    expect(c).toEqual([1, 2, 0]);
    expect(ecart(MEILLEUR, D.coordination, 1, 0)).toBeGreaterThan(8000);
  });

  it("D5 : la dotation complémentaire rapporte le plus en moyenne, la demande mesurée est la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.cpom);
    const c = classement(MEILLEUR, D.cpom);
    expect(c[0]).toBe(2);
    expect(c.slice(-2).sort()).toEqual([0, 3]);
    expect(r[1]!.p10).toBeGreaterThan(r[2]!.p10 + 10000);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[1]!.p10);
    // Après un refus de passages courts, le département ne suit plus la demande ambitieuse.
    const apresRefus = [0, ...MEILLEUR.slice(1)];
    expect(ecart(apresRefus, D.cpom, 1, 2)).toBeGreaterThan(0);
    expect(majoration(apresRefus, 3).chance).toBeLessThan(majoration(MEILLEUR, 3).chance);
  });

  it("D6 : des remplaçants rattachés à un secteur, surtout quand les tournées sont sectorisées", () => {
    const c = classement(MEILLEUR, D.ete);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    const sansSecteurs = [3, ...MEILLEUR.slice(1)];
    expect(ecart(MEILLEUR, D.ete, 1, 3)).toBeGreaterThan(ecart(sansSecteurs, D.ete, 1, 3) + 4000);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_HEURE_DOMICILE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}, option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option === o && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    for (const [d, o] of REFLEXES) expect(REFERENCES[0].chemin[d]).not.toBe(o);
  });

  it("chiffrer juste puis agir bat nettement le réflexe et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - attentiste!).toBeGreaterThan(60000);
    expect(attentiste! - reflexe!).toBeGreaterThan(10000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["paie", "comptes"], ["annulations"], ["carte"], ["reunions"], ["note"], ["ete"]],
    jours: JOURS,
    diagnostic: "revient",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 27.3,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_HEURE_DOMICILE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi le coût apparent, propose d'agir sur les tournées", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_HEURE_DOMICILE.comportements(
      p,
      analyser(EPISODE_HEURE_DOMICILE, p).trimestre,
    );
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_HEURE_DOMICILE.axe(c).titre).toBe(
      "Agir sur les tournées, pas sur les petites interventions",
    );
  });

  it("à qui a décidé sans enquêter, propose de refaire le calcul de l'heure", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_HEURE_DOMICILE.comportements(
      p,
      analyser(EPISODE_HEURE_DOMICILE, p).trimestre,
    );
    expect(EPISODE_HEURE_DOMICILE.axe(c).titre).toBe("Refaire le calcul de l'heure");
  });

  it("calibre la prévision sur le coût de revient : 26 € n'est pas juste, 27,33 € l'est", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    expect(
      EPISODE_HEURE_DOMICILE.comportements(partie(MEILLEUR, { prevision: 26 }), t)[3]!.score,
    ).toBe(0);
    expect(EPISODE_HEURE_DOMICILE.comportements(partie(MEILLEUR), t)[3]!.score).toBe(1);
    expect(EPISODE_HEURE_DOMICILE.bilan.titre(t)).toMatch(/Exercice projeté/);
  });
});
