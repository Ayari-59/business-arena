import { describe, expect, it } from "vitest";
import {
  BAILLEUR,
  BROCHE,
  COUT_COMPLET,
  D,
  DEMANDEES,
  DISPONIBLES,
  ESCALIER,
  FENETRE,
  IMPREVUS,
  LEVIERS,
  OUVERTURE,
  PORTE,
  PRODUITS,
  PROMOTEUR,
  REGLAGES,
  REGLE,
  coutVariable,
  hasard,
  margeParHeure,
  margeUnitaire,
  planifier,
  simuler,
  tauxDeMarge,
} from "../../src/engine/episodes/atelier-sature";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/atelier-sature";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_ATELIER_SATURE } from "../../src/pedagogy/episodes/atelier-sature";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'atelier saturé » enseigne le facteur rare : quand le centre
 * d'usinage est plein, une pièce se juge sur sa marge sur coût variable par
 * heure de machine, pas sur sa marge unitaire ni sur son taux de marge ; une
 * heure de machine vaut ce que rapporte la pièce qu'on refuse pour la
 * libérer, et c'est ce qu'il faut ajouter au coût variable d'une commande,
 * compter dans un arrêt, et comparer au prix d'une heure ajoutée. Ces tests
 * verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [1, 1, 1, 0, 1, 1];
const REFLEXE = [0, 0, 0, 1, 0, 0];
const ATTENTISTE = [3, 2, 3, 0, 3, 2];
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

/** Un montant tel que les sources l'écrivent : « 2 800 € ». */
const euros = (v: number) => `${Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ")} €`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const [fenetre, porte, escalier] = [PRODUITS[FENETRE]!, PRODUITS[PORTE]!, PRODUITS[ESCALIER]!];

describe("les chiffres que les sources donnent au joueur", () => {
  it("les fiches de coût donnent les prix et les coûts variables du modèle", () => {
    const fiches = texte(0, "fiches");
    for (const p of PRODUITS) {
      expect(fiches).toContain(euros(p.prix));
      for (const c of Object.values(p.couts)) expect(fiches).toContain(euros(c));
    }
    // Le coût variable de l'escalier (2 800 €) est la somme des postes que la fiche détaille.
    expect(coutVariable(escalier)).toBe(2800);
    expect(margeUnitaire(escalier)).toBe(2800);
    expect(EPISODE_ATELIER_SATURE.etapes[0]!.messages({ charge: "126 %" })[2]!.texte).toContain(
      euros(margeUnitaire(escalier)),
    );
  });

  it("la marge par heure de machine renverse le classement par pièce et par taux", () => {
    expect([margeParHeure(fenetre), margeParHeure(porte), margeParHeure(escalier)]).toEqual([
      810, 650, 400,
    ]);
    // L'escalier a la plus forte marge unitaire et le meilleur taux de marge…
    expect(margeUnitaire(escalier)).toBeGreaterThan(margeUnitaire(porte));
    expect(margeUnitaire(porte)).toBeGreaterThan(margeUnitaire(fenetre));
    expect(tauxDeMarge(escalier)).toBeCloseTo(0.5, 6);
    expect(tauxDeMarge(fenetre)).toBeCloseTo(0.45, 6);
    expect(tauxDeMarge(porte)).toBeCloseTo(0.4, 6);
    // … et la plus faible marge par heure : c'est le chiffre que la prévision demande.
    const t = simuler(MEILLEUR, 1);
    expect(EPISODE_ATELIER_SATURE.prevision.reel(t)).toBe(400);
  });

  it("la charge du poste donne les heures du modèle : 48 demandées pour 38 disponibles", () => {
    const charge = texte(0, "charge");
    expect(DISPONIBLES).toBe(OUVERTURE - REGLAGES);
    expect(charge).toContain(`${OUVERTURE} heures d'ouverture`);
    expect(charge).toContain(`dont ${REGLAGES} de réglages`);
    expect(charge).toContain(`soit ${DISPONIBLES} heures d'usinage`);
    expect(charge).toContain(`la demande en réclame ${DEMANDEES}`);
    for (const p of PRODUITS) expect(charge).toContain(`${p.demande * p.heures} pour`);
  });

  it("le coût complet donne le résultat par pièce que le diagnostic trompeur reprend", () => {
    const complet = texte(0, "coutComplet");
    for (const p of PRODUITS) {
      expect(complet).toContain(euros(COUT_COMPLET[p.code]));
      expect(complet).toContain(euros(p.prix - COUT_COMPLET[p.code]));
    }
  });

  it("la commande du bailleur, les leviers, la broche et le promoteur sont chiffrés comme dans le modèle", () => {
    const portes = texte(1, "fichePorte");
    expect(portes).toContain(euros(BAILLEUR.coutVariable));
    expect(portes).toContain(`${BAILLEUR.quantite * BAILLEUR.heures} heures sur six semaines`);
    expect(BAILLEUR.a - BAILLEUR.de + 1).toBe(6);
    // Le prix plancher, machine bien classée : le coût variable, plus les heures valorisées à
    // la marge par heure de l'escalier, que la commande évince.
    const plancher = BAILLEUR.coutVariable + BAILLEUR.heures * margeParHeure(escalier);
    expect(plancher).toBe(1500);
    expect(BAILLEUR.prixPropose).toBeLessThan(plancher);
    expect(BAILLEUR.prixContre).toBeGreaterThan(plancher);
    // La contre-proposition reste sous le plancher d'un planning au premier arrivé (591 €/h).
    const moyenneParHeure =
      PRODUITS.reduce((s, p) => s + p.demande * margeUnitaire(p), 0) / DEMANDEES;
    expect(texte(1, "refusBailleur", { regle: 3 })).toContain(`${Math.round(moyenneParHeure)} €`);
    expect(BAILLEUR.coutVariable + BAILLEUR.heures * moyenneParHeure).toBeGreaterThan(
      BAILLEUR.prixContre,
    );

    const leviers = texte(2, "leviers");
    expect(leviers).toContain(`${LEVIERS.equipeHeures} heures de machine en plus`);
    expect(leviers).toContain(euros(LEVIERS.equipeCout));
    expect(leviers).toContain(euros(LEVIERS.outillage));
    expect(texte(2, "industriel")).toContain(euros(LEVIERS.achatFenetre));

    const broche = texte(3, "expertise");
    expect(broche).toContain(euros(BROCHE.reparation));
    expect(broche).toContain(euros(BROCHE.changement));
    expect(broche).toContain(euros(BROCHE.majorationSamedi));
    expect(broche).toContain(`${BROCHE.ralentissement * 100} %`);

    const promoteur = texte(5, "fichePromoteur");
    expect(promoteur).toContain(euros(PROMOTEUR.coutVariable));
    expect((PROMOTEUR.prix - PROMOTEUR.coutVariable) / PROMOTEUR.heures).toBeGreaterThan(
      margeParHeure(escalier),
    );
  });
});

describe("le modèle de l'atelier", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.heuresDisponibles).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.heuresDisponibles,
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

  it("le planning sert les pièces dans l'ordre de sa règle, jusqu'à la dernière heure", () => {
    const articles = PRODUITS.map((p) => ({ prix: p.prix, cv: coutVariable(p), heures: p.heures }));
    const demandes = PRODUITS.map((p) => p.demande);
    const parHeure = planifier(REGLE.margeParHeure, articles, demandes, DISPONIBLES);
    expect(parHeure[FENETRE]).toBe(30);
    expect(parHeure[PORTE]).toBe(6);
    expect(parHeure[ESCALIER]).toBeCloseTo(11 / 7, 6);
    const parPiece = planifier(REGLE.margeUnitaire, articles, demandes, DISPONIBLES);
    expect(parPiece[ESCALIER]).toBe(3);
    expect(parPiece[FENETRE]).toBeCloseTo(10, 6);
    const mcv = (s: number[]) => s.reduce((x, n, i) => x + n * margeUnitaire(PRODUITS[i]!), 0);
    // Dix heures refusées : 4 000 € d'escaliers, ou 8 100 € de fenêtres.
    expect(mcv(parHeure) - mcv(parPiece)).toBeCloseTo(4100, 6);
  });

  it("l'artisan part quand ses fenêtres ne sont pas servies, et seulement alors", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).clientParti).length;
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(REFLEXE)).toBeGreaterThan(15);
  });

  it("garde des chiffres réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.marge).toBeGreaterThan(150000);
        expect(t.marge).toBeLessThan(400000);
        expect(t.margeHeure).toBeGreaterThan(400);
        expect(t.margeHeure).toBeLessThan(810);
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : classer par marge par heure de machine ; la marge unitaire et le taux de marge coûtent cher", () => {
    const r = rejeu(MEILLEUR, D.planning);
    expect(classement(MEILLEUR, D.planning)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
  });

  it("D2 : contre-proposer au-dessus du plancher, si le planning est bien classé ; sinon, décliner", () => {
    const r = rejeu(MEILLEUR, D.bailleur);
    expect(classement(MEILLEUR, D.bailleur)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    // Au premier arrivé, premier servi, l'heure de machine vaut plus : 1 650 € ne la paient plus.
    const auPremierArrive = [3, ...MEILLEUR.slice(1)];
    expect(classement(auPremierArrive, D.bailleur)[0]).toBe(2);
    expect(classement(REFLEXE, D.bailleur)[0]).toBe(2);
  });

  it("D3 : la deuxième équipe paie ; sortir les fenêtres de la machine est le pire choix, sauf mal classé", () => {
    const c = classement(MEILLEUR, D.goulot);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    // Avec l'escalier en tête, sortir les fenêtres vaut mieux que ne rien faire : le réflexe
    // paraît marcher, parce qu'il répare en partie un mauvais classement.
    const r = rejeu(REFLEXE, D.goulot);
    expect(r[0]!.attendu).toBeGreaterThan(r[3]!.attendu);
  });

  it("D4 : laisser tourner est le meilleur pari, le changement un samedi le plus sûr ; l'arrêt en semaine coûte", () => {
    const r = rejeu(MEILLEUR, D.broche);
    expect(classement(MEILLEUR, D.broche)[0]).toBe(0);
    expect(plusSure(MEILLEUR, D.broche)).toBe(2);
    expect(r[0]!.attendu - r[2]!.attendu).toBeLessThan(3000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(2000);
  });

  it("D5 : le samedi pendant le pic bat la promotion sur les escaliers", () => {
    const r = rejeu(MEILLEUR, D.pic);
    expect(classement(MEILLEUR, D.pic)[0]).toBe(1);
    expect(classement(MEILLEUR, D.pic).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
  });

  it("D6 : les escaliers du promoteur paient l'heure mieux que la dernière pièce servie ; le chiffre d'affaires, non", () => {
    const r = rejeu(MEILLEUR, D.fin);
    expect(classement(MEILLEUR, D.fin)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(2000);
    // Mal classé, le même promoteur évince des fenêtres : il ne vaut plus la peine.
    const auPremierArrive = [3, ...MEILLEUR.slice(1)];
    expect(classement(auPremierArrive, D.fin)[0]).toBe(2);
  });

  it("raisonner par heure de machine bat la marge par pièce et l'attentisme, en moyenne", () => {
    const [bon, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bon).toBeGreaterThan(0);
    expect(bon! - attentiste!).toBeGreaterThan(40000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
    expect(REFERENCES[1]!.chemin).toEqual(REFLEXE);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et aucun n'est dans la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_ATELIER_SATURE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      const bonne =
        option.qualite >= 0.7 ||
        (option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000);
      expect(bonne, `D${d + 1} option ${o}`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["fiches", "charge"],
      ["fichePorte", "refusBailleur"],
      ["leviers", "refusLevier"],
      ["expertise", "refusBroche"],
      ["historique"],
      ["fichePromoteur"],
    ],
    jours: JOURS,
    diagnostic: "facteurRare",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 400,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_ATELIER_SATURE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a jugé les pièces sur leur marge unitaire, propose de classer par heure de machine", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_ATELIER_SATURE.comportements(
      p,
      analyser(EPISODE_ATELIER_SATURE, p).trimestre,
    );
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_ATELIER_SATURE.axe(c).titre).toBe("Classer par heure de machine, pas par pièce");
  });

  it("à qui a décidé sans enquêter, propose de trouver le goulot", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_ATELIER_SATURE.comportements(
      p,
      analyser(EPISODE_ATELIER_SATURE, p).trimestre,
    );
    expect(EPISODE_ATELIER_SATURE.axe(c).titre).toBe("Trouver le goulot avant de trancher");
  });

  it("juge la prévision sur la marge par heure de l'escalier", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const juste = EPISODE_ATELIER_SATURE.comportements(partie(MEILLEUR), t)[3]!;
    expect(juste.score).toBe(1);
    // Le résultat par pièce du coût complet, divisé par les heures : 129 €, loin du compte.
    const complet = EPISODE_ATELIER_SATURE.comportements(
      partie(MEILLEUR, { prevision: 129, confiance: 80 }),
      t,
    )[3]!;
    expect(complet.score).toBe(0);
  });

  it("dit le résultat en écart au budget de marge", () => {
    expect(EPISODE_ATELIER_SATURE.bilan.titre(simuler(MEILLEUR, 2))).toMatch(/au-dessus du budget/);
    expect(EPISODE_ATELIER_SATURE.bilan.titre(simuler(REFLEXE, 2))).toMatch(/sous le budget/);
  });
});
