import { describe, expect, it } from "vitest";
import {
  CADENCE,
  CAPACITE_DEPART,
  COUTS,
  COUT_VARIABLE,
  D,
  DEMANDE,
  DEMANDE_JUILLET,
  DEPART,
  ETE,
  HEURES_CHANGEMENTS,
  HEURES_MICRO,
  IMPREVUS,
  JUIN,
  MCV,
  ORDONNANCEMENT,
  OUVERTURE,
  PENALITE,
  POSITIVE,
  PRIX,
  RELEVE,
  SAMEDI,
  SCELLAGE,
  SMED,
  TAUX_SERVICE,
  chanceDAdhesion,
  durees,
  hasard,
  risqueDAccident,
  simuler,
} from "../../src/engine/episodes/changements-de-format";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/changements-de-format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_CHANGEMENTS_FORMAT } from "../../src/pedagogy/episodes/changements-de-format";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les changements qui mangent la ligne » enseigne qu'un TRS se
 * décompose avant de se soigner : sur une ligne de produits frais aux
 * nombreuses références, la capacité perdue part d'abord aux changements de
 * format et aux nettoyages entre recettes. On la regagne en préparant hors
 * arrêt ce qui peut l'être (SMED, avec les conducteurs) et en ordonnant les
 * recettes sans allonger les séries, pas avec une deuxième ligne ni des
 * samedis, et jamais en écourtant un nettoyage. Ces tests verrouillent les
 * chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [2, 0, 1, 1, 0, 0];
const REFLEXE = [1, 2, 0, 2, 1, 1];
const ATTENTISTE = [3, 3, 3, 3, 3, 3];
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
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};

/** Un montant tel que les sources l'écrivent : « 6 500 € ». */
const euros = (v: number) => `${Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ")} €`;
const pourcent = (v: number, d = 0) =>
  `${(v * 100).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("le relevé des arrêts donne 17 heures de changements et de NEP, et un TRS de 57 %", () => {
    const releve = texte(0, "releve");
    expect(releve).toContain(`${RELEVE.formats} changements de format`);
    expect(releve).toContain(`de ${RELEVE.dureeFormat} minutes chacun`);
    expect(releve).toContain(`${RELEVE.nep} nettoyages en place`);
    expect(releve).toContain(`de ${RELEVE.dureeNep} minutes chacun, dont ${RELEVE.cycleNep}`);
    expect(releve).toContain(`${RELEVE.microArrets} micro-arrêts`);
    expect(releve).toContain(pourcent(RELEVE.malScelles, 1));
    expect(releve).toContain(`${RELEVE.purge.toLocaleString("fr-FR").replace(/\s/g, " ")} pots`);
    // Le calcul que la prévision demande : 6 × 65 + 9 × 70 = 1 020 minutes.
    expect(HEURES_CHANGEMENTS).toBe(17);
    expect(EPISODE_CHANGEMENTS_FORMAT.prevision.reel(simuler(MEILLEUR, 1))).toBe(17);
    expect(HEURES_MICRO).toBeCloseTo(9.79, 2);
    // Le TRS de départ et ses trois facteurs, que l'alerte de la semaine 1 annonce.
    expect(DEPART.trs).toBeCloseTo(0.57, 2);
    expect(DEPART.disponibilite * DEPART.performance * DEPART.qualite).toBeCloseTo(DEPART.trs, 9);
    expect(DEPART.disponibilite).toBeCloseTo((OUVERTURE - 17) / OUVERTURE, 9);
    const alerte = ETAPES[0]!.messages({})[0]!.texte;
    expect(alerte).toContain(pourcent(Math.round(DEPART.trs * 100) / 100));
    expect(alerte).toContain(
      `${(Math.round(DEPART.bons / 500) * 500).toLocaleString("fr-FR").replace(/\s/g, " ")} pots bons`,
    );
    expect(alerte).toContain(
      `${(DEMANDE[1] as number).toLocaleString("fr-FR").replace(/\s/g, " ")} pots commandés`,
    );
  });

  it("les pertes se rangent comme le dit le diagnostic juste : la moitié aux changements, un quart au doseur", () => {
    const perdues = OUVERTURE * (1 - DEPART.trs);
    const qualite = perdues - HEURES_CHANGEMENTS - HEURES_MICRO;
    expect(HEURES_CHANGEMENTS / perdues).toBeGreaterThan(0.45);
    expect(HEURES_CHANGEMENTS / perdues).toBeLessThan(0.55);
    expect(HEURES_MICRO / perdues).toBeGreaterThan(0.22);
    expect(HEURES_MICRO / perdues).toBeLessThan(0.3);
    expect(qualite / perdues).toBeLessThan(HEURES_MICRO / perdues);
    // Le coût variable d'un pot, poste par poste, et sa marge.
    expect(COUT_VARIABLE).toBeCloseTo(
      COUTS.lait + COUTS.ingredients + COUTS.emballages + COUTS.energieNep,
      9,
    );
    expect(MCV).toBeCloseTo(0.06, 9);
    expect(PRIX).toBe(0.19);
    // Ce qu'Iwan donne pour valoriser juillet, en centimes : prix, coût variable et son détail, marge.
    const centimes = (v: number) => (Math.round(v * 1000) / 10).toLocaleString("fr-FR");
    const juillet = texte(5, "juillet");
    expect(juillet).toContain(`${centimes(PRIX)} centimes net`);
    expect(juillet).toContain(`${centimes(COUT_VARIABLE)} centimes de coût variable`);
    expect(juillet).toContain(
      `lait ${centimes(COUTS.lait)}, ingrédients ${centimes(COUTS.ingredients)}, emballages ${centimes(COUTS.emballages)}, énergie et produits de NEP ${centimes(COUTS.energieNep)}`,
    );
    expect(juillet).toContain(`${centimes(MCV)} centimes de marge sur coût variable`);
    expect(juillet).toContain(`${(DEMANDE_JUILLET / 1e6).toLocaleString("fr-FR")} million`);
    // La pénalité logistique, annoncée en semaine 1.
    expect(PENALITE / PRIX).toBeCloseTo(0.2, 9);
    expect(ETAPES[0]!.messages({})[2]!.texte).toContain("20 % de la valeur");
    expect(ETAPES[0]!.messages({})[2]!.texte).toContain(pourcent(TAUX_SERVICE, 1));
  });

  it("le film, la matrice des recettes et la DLC sont chiffrés comme dans le modèle", () => {
    const video = texte(1, "video", { reponse: 2 });
    expect(video).toContain(`${RELEVE.dureeFormat - SMED.conducteurs.format} peuvent se faire`);
    expect(video).toContain(`${RELEVE.dureeNep - RELEVE.cycleNep} minutes d'un NEP`);
    expect(video).toContain(
      `${RELEVE.dureeNep - SMED.conducteurs.nep} sont du démontage et de l'attente`,
    );
    const facons = texte(1, "facons");
    expect(facons).toContain(euros(SMED.conducteurs.cout));
    expect(facons).toContain(euros(SMED.fabricant.cout));
    expect(facons).toContain(`livrés en semaine ${SMED.fabricant.debut}`);
    expect(facons).toContain(`${SMED.fabricant.format} minutes`);

    const roue = ORDONNANCEMENT[1]!;
    const campagnes = ORDONNANCEMENT[0]!;
    expect(texte(2, "matrice")).toContain(`${roue.nep} par semaine au lieu de ${RELEVE.nep}`);
    expect(texte(2, "matrice")).toContain(
      `${roue.formats} changements de format au lieu de ${RELEVE.formats}`,
    );
    const dlc = texte(2, "dlc");
    expect(dlc).toContain(`${campagnes.nep} NEP et ${campagnes.formats} changements de format`);
    expect(dlc).toContain(euros(campagnes.stockage));
    expect(dlc).toContain(`près de ${pourcent(campagnes.casse)}`);
  });

  it("le doseur, le plan de nettoyage, les samedis, le scellage et l'été sont chiffrés comme dans le modèle", () => {
    const doseur = texte(3, "doseur");
    expect(doseur).toContain(
      `de ${HEURES_MICRO.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} heures`,
    );
    expect(doseur).toContain(`à ${JUIN.microApres.toLocaleString("fr-FR")} heures`);
    expect(doseur).toContain(euros(6500));
    expect(doseur).toContain(euros(JUIN.doseur - 6500));
    expect(ETAPES[3]!.options[1]!.d).toContain(euros(JUIN.doseur));
    const plan = texte(3, "plan");
    expect(JUIN.risqueSanitaire).toBeGreaterThan(0.4);
    expect(JUIN.risqueSanitaire).toBeLessThan(0.5);
    expect(plan).toContain("près d'une fois sur deux");
    expect(POSITIVE.bloque).toBeCloseTo(3 / 5, 9);
    expect(plan).toContain("trois jours");
    expect(POSITIVE.declasse).toBe(0.5);
    expect(texte(3, "samedis")).toContain(euros(SAMEDI.cout));
    expect(texte(3, "samedis")).toContain(`${SAMEDI.heures} heures`);
    expect(JUIN.nepEcourte).toBe(25);
    expect(ETAPES[3]!.options[0]!.d).toContain("Vingt-cinq minutes");
    expect(ETAPES[3]!.options[0]!.t).toContain(
      `de ${RELEVE.dureeNep} à ${RELEVE.dureeNep - JUIN.nepEcourte} minutes`,
    );

    const film = texte(4, "film");
    expect(film).toContain(`${SCELLAGE.film.surcout * 100} centime`.replace(".", ","));
    expect(film).toContain(`autour de ${pourcent(SCELLAGE.film.apres)}`);
    expect(film).toContain(`près de ${pourcent(SCELLAGE.film.essaiRate)}`);
    expect(SCELLAGE.film.reussite).toBeCloseTo(2 / 3, 1);
    const tete = texte(4, "tete");
    expect(tete).toContain(euros(SCELLAGE.reglage.cout));
    expect(tete).toContain(`${pourcent(SCELLAGE.reglage.apres)} de pots écartés`);
    expect(tete).toContain(`${pourcent(1 - SCELLAGE.ralentir.cadence)}`);

    const ete = texte(5, "ete");
    expect(ete).toContain("la moitié du gain");
    expect(ETE[3]!.durabilite).toBe(0.5);
    expect(ete).toContain(pourcent(ETE[0]!.durabilite));
    expect(ete).toContain(pourcent(ETE[2]!.durabilite));
    expect(ETAPES[5]!.options[0]!.d).toContain(euros(ETE[0]!.cout));
    expect(ETAPES[5]!.options[1]!.d).toContain(euros(ETE[1]!.cout));
  });
});

describe("le modèle de la ligne 3", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.demande).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.demande,
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

  it("au départ, la ligne livre ce que le relevé annonce, et l'été la dépasse", () => {
    expect(DEPART.bons).toBeCloseTo(
      (OUVERTURE - HEURES_CHANGEMENTS - HEURES_MICRO) * CADENCE * (1 - RELEVE.malScelles) -
        (RELEVE.formats + RELEVE.nep) * RELEVE.purge,
      6,
    );
    expect(DEMANDE[1]).toBeGreaterThan(CAPACITE_DEPART);
    expect(DEMANDE[13]! / DEMANDE[1]!).toBeGreaterThan(1.25);
    expect(simuler(ATTENTISTE, 3).service).toBeLessThan(0.88);
    expect(simuler(MEILLEUR, 3).service).toBeGreaterThan(0.95);
  });

  it("écourter les NEP fait revenir un prélèvement positif près d'une fois sur deux, et jamais sinon", () => {
    const positifs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).positive > 0).length;
    expect(positifs(MEILLEUR)).toBe(0);
    expect(positifs(avec(MEILLEUR, D.juin, 0))).toBeGreaterThan(8);
    expect(positifs(avec(MEILLEUR, D.juin, 0))).toBeLessThan(20);
  });

  it("les samedis fatiguent : le risque d'accident n'existe qu'avec eux", () => {
    const accidents = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).accident > 0).length;
    expect(accidents(MEILLEUR)).toBe(0);
    expect(accidents([1, 0, 1, 2, 0, 0])).toBeGreaterThan(0);
    expect(risqueDAccident(0.3)).toBe(0);
    expect(risqueDAccident(0.9)).toBeGreaterThan(0.3);
  });

  it("garde des chiffres réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE, avec(MEILLEUR, D.juin, 0)]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.mcv).toBeGreaterThan(650000);
        expect(t.mcv).toBeLessThan(850000);
        expect(t.trsFinal).toBeGreaterThan(0.5);
        expect(t.trsFinal).toBeLessThan(0.8);
        for (const s of t.semaines.slice(1)) {
          expect(s!.trs).toBeGreaterThanOrEqual(EPISODE_CHANGEMENTS_FORMAT.courbe.graduations[0]!);
          expect(s!.trs).toBeLessThanOrEqual(EPISODE_CHANGEMENTS_FORMAT.courbe.graduations.at(-1)!);
        }
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : décomposer et attaquer les changements ; la deuxième ligne et les samedis coûtent cher", () => {
    const r = rejeu(MEILLEUR, D.reponse);
    expect(classement(MEILLEUR, D.reponse)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(40000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(15000);
  });

  it("D2 : le chantier avec les conducteurs ; l'équipe suit d'autant mieux qu'elle a été associée en semaine 1", () => {
    const r = rejeu(MEILLEUR, D.smed);
    expect(classement(MEILLEUR, D.smed)[0]).toBe(0);
    expect(r[0]!.attendu - Math.max(r[1]!.attendu, r[2]!.attendu)).toBeGreaterThan(15000);
    expect(chanceDAdhesion(MEILLEUR)).toBeGreaterThan(chanceDAdhesion(avec(MEILLEUR, 0, 1)));
    expect(chanceDAdhesion(MEILLEUR)).toBeGreaterThan(chanceDAdhesion(avec(MEILLEUR, 0, 3)));
    // Le gain arrive deux semaines après le début du chantier quand l'équipe suit.
    const g = GRAINES_DU_BILAN.find((x) => simuler(MEILLEUR, x).adhesion)!;
    expect(durees(MEILLEUR, g, 3).format).toBeGreaterThan(SMED.conducteurs.format);
    expect(durees(MEILLEUR, g, 4).format).toBe(SMED.conducteurs.format);
  });

  it("D3 : la roue quotidienne ; les longues séries ne valent plus rien quand le SMED a raccourci les changements", () => {
    const r = rejeu(MEILLEUR, D.ordonnancement);
    expect(classement(MEILLEUR, D.ordonnancement)[0]).toBe(1);
    const avecSmed = r[1]!.attendu - r[0]!.attendu;
    expect(avecSmed).toBeGreaterThan(25000);
    // Sans chantier sur les changements, chaque changement évité vaut plus : l'écart fond.
    const s = rejeu(avec(MEILLEUR, D.smed, 3), D.ordonnancement);
    expect(s[1]!.attendu - s[0]!.attendu).toBeLessThan(avecSmed / 2);
    // Et si rien d'autre n'est fait, les campagnes passent devant.
    const a = rejeu(ATTENTISTE, D.ordonnancement);
    expect(a[0]!.attendu).toBeGreaterThan(a[1]!.attendu);
  });

  it("D4 : réviser le doseur ; écourter les NEP est le pire pari, et le plus exposé", () => {
    const r = rejeu(MEILLEUR, D.juin);
    expect(classement(MEILLEUR, D.juin)[0]).toBe(1);
    expect(classement(MEILLEUR, D.juin).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(30000);
    expect(Math.min(...r.map((x) => x.p10))).toBe(r[0]!.p10);
    // Quand rien n'a été fait sur la ligne, les samedis rapportent plus qu'ils ne coûtent : le réflexe paraît marcher.
    const a = rejeu(ATTENTISTE, D.juin);
    expect(a[2]!.attendu).toBeGreaterThan(a[3]!.attendu);
  });

  it("D5 : le nouveau film est le meilleur pari, le réglage de la tête le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.scellage);
    expect(classement(MEILLEUR, D.scellage)[0]).toBe(0);
    expect(plusSure(MEILLEUR, D.scellage)).toBe(1);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(3000);
    expect(r[1]!.p10 - r[0]!.p10).toBeGreaterThan(10000);
  });

  it("D6 : ancrer les standards avant les congés ; la deuxième ligne n'apporte rien à l'été", () => {
    const r = rejeu(MEILLEUR, D.ete);
    expect(classement(MEILLEUR, D.ete)[0]).toBe(0);
    expect(classement(MEILLEUR, D.ete).at(-1)).toBe(1);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
  });

  it("décomposer avant de soigner bat les heures en plus et l'attentisme, en moyenne", () => {
    const [bon, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bon! - reflexe!).toBeGreaterThan(150000);
    expect(bon! - attentiste!).toBeGreaterThan(200000);
    expect(attentiste!).toBeGreaterThan(250000);
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
    expect(REFERENCES[1]!.chemin).toEqual(REFLEXE);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et aucun n'est dans la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_CHANGEMENTS_FORMAT, MEILLEUR, d, JOURS);
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
      ["releve", "planning"],
      ["video"],
      ["matrice", "dlc"],
      ["doseur", "plan"],
      ["film", "tete"],
      ["ete"],
    ],
    jours: JOURS,
    diagnostic: "changements",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 17,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 12, 4242]) {
      const a = analyser(EPISODE_CHANGEMENTS_FORMAT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a acheté des heures et une ligne, propose de chercher la capacité dans la ligne", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_CHANGEMENTS_FORMAT.comportements(
      p,
      analyser(EPISODE_CHANGEMENTS_FORMAT, p).trimestre,
    );
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_CHANGEMENTS_FORMAT.axe(c).titre).toBe(
      "Chercher la capacité dans la ligne avant d'en acheter",
    );
  });

  it("à qui a décidé sans enquêter, propose de décomposer le TRS d'abord", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_CHANGEMENTS_FORMAT.comportements(
      p,
      analyser(EPISODE_CHANGEMENTS_FORMAT, p).trimestre,
    );
    expect(EPISODE_CHANGEMENTS_FORMAT.axe(c).titre).toBe(
      "Décomposer le TRS avant de choisir le remède",
    );
  });

  it("ne pardonne jamais un NEP écourté, même quand aucun prélèvement ne revient positif", () => {
    const ecourte = avec(MEILLEUR, D.juin, 0);
    const g = GRAINES_DU_BILAN.find((x) => simuler(ecourte, x).positive === 0)!;
    const c = EPISODE_CHANGEMENTS_FORMAT.comportements(
      partie(ecourte, { graine: g }),
      simuler(ecourte, g, JOURS),
    );
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_CHANGEMENTS_FORMAT.axe(c).titre).toBe(
      "Préparer les changements ligne en marche, et ordonner les recettes",
    );
  });

  it("juge la prévision sur les 17 heures du relevé", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    expect(EPISODE_CHANGEMENTS_FORMAT.comportements(partie(MEILLEUR), t)[3]!.score).toBe(1);
    // Les seuls NEP (10,5 h), ou les changements avec les micro-arrêts (26,8 h) : loin du compte.
    for (const prevision of [10.5, 26.8]) {
      const c = EPISODE_CHANGEMENTS_FORMAT.comportements(
        partie(MEILLEUR, { prevision, confiance: 80 }),
        t,
      )[3]!;
      expect(c.score, `${prevision}`).toBe(0);
    }
  });

  it("dit le résultat en contribution, capacité de juillet comprise", () => {
    const t = simuler(MEILLEUR, 2);
    expect(EPISODE_CHANGEMENTS_FORMAT.bilan.titre(t)).toMatch(/capacité de juillet comprise/);
    expect(t.juillet).toBeGreaterThan(0);
    expect(simuler(ATTENTISTE, 2).juillet).toBe(0);
  });
});
