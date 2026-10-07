import { describe, expect, it } from "vitest";
import {
  AFFAIRES,
  AVIS,
  BUDGET,
  CHAMBRES,
  COTE_COUR,
  COTE_RUE,
  COUTS,
  D,
  IMPREVUS,
  LOISIRS,
  MANQUE_PAR_DIXIEME,
  NOTE_DEPART,
  NOTE_REFERENCE,
  NUITEES_PAR_DIXIEME,
  NUITEES_PREVUES,
  PRIX_GRILLE,
  PRIX_PAR_DIXIEME,
  chanceDeLacher,
  climLache,
  effetPrix,
  hasard,
  incitationDetectee,
  prixTenable,
  simuler,
  tableauDeBord,
} from "../../src/engine/episodes/note-qui-chute";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  REFERENCES,
  REFLEXES,
  partLoisirs,
} from "../../src/config/episodes/note-qui-chute";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_NOTE_EN_LIGNE } from "../../src/pedagogy/episodes/note-qui-chute";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La note qui chute » enseigne qu'une note en ligne se répare par
 * la cause que les avis montrent quand on les compte par thème — les
 * climatiseurs des chambres côté gare — et non par des gestes, des relances
 * ou des avis achetés ; qu'elle se mesure dans le prix qu'on peut tenir ; et
 * qu'elle réagit avec retard. Ces tests verrouillent les chiffres des sources
 * et les classements qui le disent.
 */

const MEILLEUR = [1, 0, 2, 1, 1, 1];
const IMAGE = [0, 1, 0, 2, 2, 0];
const ATTENTISTE = [3, 3, 1, 3, 3, 3];
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

/** Un montant tel que les sources l'écrivent : « 5 400 € ». */
const euros = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} €`;
const pct = (v: number) => `${Math.round(v * 100)} %`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("la revenue manager donne de quoi calculer le manque à gagner d'un dixième", () => {
    const valeur = texte(0, "valeur");
    expect(valeur).toContain(`${euros(PRIX_PAR_DIXIEME)} de prix moyen`);
    expect(valeur).toContain(`${NUITEES_PAR_DIXIEME} nuitées par trimestre`);
    expect(valeur).toContain(`${NUITEES_PREVUES.toLocaleString("fr-FR")} nuitées`);
    expect(valeur).toContain(`${euros(PRIX_GRILLE)} de prix moyen`);
    // 1 € sur 5 100 nuitées, plus 20 nuitées perdues au classement à 102 € : 7 140 €.
    expect(NUITEES_PREVUES).toBe(5100);
    expect(MANQUE_PAR_DIXIEME).toBe(PRIX_PAR_DIXIEME * 5100 + NUITEES_PAR_DIXIEME * 102);
    expect(MANQUE_PAR_DIXIEME).toBe(7140);
    expect(EPISODE_NOTE_EN_LIGNE.prevision.reel(simuler(MEILLEUR, 1))).toBe(7140);
    // Le budget de l'été est ces nuitées à ce prix moyen.
    expect(BUDGET).toBe(NUITEES_PREVUES * PRIX_GRILLE);
  });

  it("la note de départ est celle des messages, et le prix tenable celui de la comparaison", () => {
    expect(NOTE_DEPART).toBeGreaterThan(8.05);
    expect(NOTE_DEPART).toBeLessThan(8.15);
    const lu = EPISODE_NOTE_EN_LIGNE.lire([], 1, 0, 0);
    const ctx = EPISODE_NOTE_EN_LIGNE.contexte(lu, []);
    expect(ETAPES[0]!.messages(ctx)[0]!.texte).toContain("8,1 sur 10");
    expect(ETAPES[0]!.messages(ctx)[0]!.texte).toContain("contre 8,7");
    // À 8,1, six dixièmes sous 8,7 : 102 € − 6 € = 96 €.
    expect(prixTenable(8.1)).toBeCloseTo(96, 6);
    expect(prixTenable(NOTE_REFERENCE)).toBe(PRIX_GRILLE);
    expect(ctx.tenable).toBe(euros(96));
    expect(texte(2, "voisins", ctx)).toContain(`tenir est d'environ ${euros(96)}`);
    // Au prix tenable, la demande est celle de la note d'avant ; au-dessus, elle fuit plus vite
    // qu'elle ne vient en dessous.
    expect(effetPrix(96, 96)).toBe(1);
    expect(1 - effetPrix(106, 96)).toBeGreaterThan(effetPrix(86, 96) - 1);
  });

  it("les avis par thème et l'observation du buffet tiennent les chiffres du modèle", () => {
    const themes = texte(0, "themes");
    expect(COTE_RUE + COTE_COUR).toBe(CHAMBRES);
    expect(themes).toContain(`${COTE_RUE} chambres côté place de la gare`);
    expect(themes).toContain(`${COTE_COUR} chambres côté cour`);
    // Les clients de loisirs : un sur quatre en juin, près de deux sur trois à la mi-août.
    expect(partLoisirs(1)).toBe(LOISIRS[0]! / (AFFAIRES[0]! + LOISIRS[0]!));
    expect(partLoisirs(1)).toBe(0.25);
    expect(partLoisirs(10)).toBeCloseTo(0.65, 2);
    const buffet = texte(1, "buffet");
    expect(buffet).toContain(`${pct(partLoisirs(1))} des clients`);
    expect(buffet).toContain(`ils seront ${pct(partLoisirs(10))}`);
  });

  it("les coûts des options et des devis sont ceux du modèle", () => {
    expect(ETAPES[D.cause]!.options[1]!.d).toContain(euros(COUTS.climatisation));
    expect(ETAPES[D.petitDej]!.options[0]!.d).toContain(euros(COUTS.extraPdj));
    expect(texte(D.canicule, "location")).toContain(euros(COUTS.climMobiles));
    expect(texte(D.canicule, "delogements")).toContain(euros(COUTS.delogement));
    expect(texte(D.avis, "reponses")).toContain(pct(AVIS.conversionReponse));
    expect(texte(D.fin, "aix")).toContain(`${AVIS.relanceTardive} avis`);
    // Le frigoriste dit « près d'une fois sur deux » en forte canicule, « presque sûrement » sinon.
    const forte = GRAINES_DU_BILAN.find((g) => hasard(g).uCanicule < 0.5)!;
    const moderee = GRAINES_DU_BILAN.find((g) => hasard(g).uCanicule >= 0.5)!;
    expect(chanceDeLacher(forte)).toBeLessThan(0.5);
    expect(chanceDeLacher(forte)).toBeGreaterThan(0.4);
    expect(chanceDeLacher(moderee)).toBeLessThanOrEqual(0.1);
  });
});

describe("le modèle de l'hôtel", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(5)).toBe(hasard(5));
    expect(simuler(MEILLEUR, 12).semaines[1]!.nuitees).toBeCloseTo(
      simuler([2, ...MEILLEUR.slice(1)], 12).semaines[1]!.nuitees,
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

  it("la note réagit avec retard : elle baisse encore après la réparation, puis remonte", () => {
    for (const g of [1, 2, 3]) {
      const t = simuler(MEILLEUR, g, JOURS);
      const notes = t.semaines.slice(1).map((s) => s!.note);
      expect(Math.min(...notes.slice(0, 4))).toBeLessThan(NOTE_DEPART);
      expect(t.noteFinale).toBeGreaterThan(8.5);
      // En semaine 7, avant la canicule, les avis récents sont nettement au-dessus de la note.
      const l = tableauDeBord(MEILLEUR.slice(0, 4), g, JOURS, 7);
      expect(l.noteRecente! - l.note!).toBeGreaterThan(0.2);
    }
    // Sans réparation, la note continue de glisser et sort du filtre « 8 et plus ».
    const t = simuler(ATTENTISTE, 3, JOURS);
    expect(t.noteFinale).toBeLessThan(7.9);
    expect(t.semainesSousFiltre).toBeGreaterThan(6);
  });

  it("les climatiseurs réparés lâchent parfois en canicule ; les avis récompensés sont détectés une fois sur deux", () => {
    const laches = GRAINES_DU_BILAN.filter((g) => climLache(MEILLEUR, g)).length;
    expect(laches).toBeGreaterThanOrEqual(4);
    expect(laches).toBeLessThanOrEqual(12);
    expect(GRAINES_DU_BILAN.some((g) => climLache(ATTENTISTE, g))).toBe(false);
    const achat = [1, 0, 2, 0, 1, 1];
    const detectes = GRAINES_DU_BILAN.filter((g) => incitationDetectee(achat, g)).length;
    expect(detectes).toBeGreaterThan(9);
    expect(detectes).toBeLessThan(21);
    expect(GRAINES_DU_BILAN.some((g) => incitationDetectee(MEILLEUR, g))).toBe(false);
  });

  it("garde des chiffres réalistes", () => {
    for (const c of [MEILLEUR, IMAGE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.objectif).toBeGreaterThan(340000);
        expect(t.objectif).toBeLessThan(BUDGET);
        expect(t.occupation).toBeGreaterThan(0.5);
        expect(t.occupation).toBeLessThan(0.85);
        expect(t.prixMoyen).toBeGreaterThan(88);
        expect(t.prixMoyen).toBeLessThan(105);
        for (const s of t.semaines.slice(1)) {
          expect(s!.note).toBeGreaterThan(7);
          expect(s!.note).toBeLessThan(9.5);
        }
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : réparer les climatiseurs côté gare ; gestes et relances ne remontent pas la note", () => {
    const r = rejeu(MEILLEUR, D.cause);
    expect(classement(MEILLEUR, D.cause)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(
      30000,
    );
    // Le réflexe fait pire que l'attente : la relance fait écrire les mécontents.
    expect(r[0]!.attendu).toBeLessThan(r[3]!.attendu);
  });

  it("D2 : l'extra et la seconde livraison battent le petit-déjeuner offert et le service à table", () => {
    const r = rejeu(MEILLEUR, D.petitDej);
    expect(classement(MEILLEUR, D.petitDej)[0]).toBe(0);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(2000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(4000);
  });

  it("D3 : le prix suit la note ; la baisse générale coûte, sauf quand la note n'est pas réparée", () => {
    const r = rejeu(MEILLEUR, D.prix);
    expect(classement(MEILLEUR, D.prix)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(6000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(6000);
    // Climatiseurs non réparés, la note s'effondre : baisser de 10 € devient presque juste, et
    // tenir la grille le pire choix.
    const s = rejeu(IMAGE, D.prix);
    expect(s[2]!.attendu - s[0]!.attendu).toBeLessThan(2000);
    expect(classement(IMAGE, D.prix).at(-1)).toBe(1);
  });

  it("D4 : répondre soi-même ; les avis récompensés paient parfois, et perdent en moyenne", () => {
    const r = rejeu(MEILLEUR, D.avis);
    expect(classement(MEILLEUR, D.avis)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(8000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(4000);
    const m = mesurerDecision(EPISODE_NOTE_EN_LIGNE, MEILLEUR, D.avis, JOURS);
    expect(m.options[0]!.trompeuse).toBe(true);
    expect(m.options[0]!.p10).toBe(Math.min(...m.options.map((o) => o.p10)));
  });

  it("D5 : la cour d'abord est le meilleur pari, la location le choix le plus sûr ; sans réparation, la location s'impose", () => {
    const r = rejeu(MEILLEUR, D.canicule);
    expect(classement(MEILLEUR, D.canicule)[0]).toBe(1);
    expect(plusSure(MEILLEUR, D.canicule)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(1000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeLessThan(3000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(5000);
    // Sans remise en état, les mobiles valent bien plus que leur prix.
    for (const c of [IMAGE, ATTENTISTE]) {
      const s = rejeu(c, D.canicule);
      expect(classement(c, D.canicule)[0]).toBe(0);
      expect(s[0]!.attendu - s[3]!.attendu).toBeGreaterThan(10000);
    }
  });

  it("D6 : demander un avis au départ et tenir le cap ; la relance tardive et la promotion coûtent", () => {
    const r = rejeu(MEILLEUR, D.fin);
    expect(classement(MEILLEUR, D.fin)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(1000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(2500);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(6000);
  });

  it("réparer la cause et tenir le prix bat l'image et l'attentisme, en moyenne", () => {
    const [bon, image, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bon! - image!).toBeGreaterThan(50000);
    expect(bon! - attentiste!).toBeGreaterThan(50000);
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
    expect(REFERENCES[1]!.chemin).toEqual(IMAGE);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et aucun n'est dans la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_NOTE_EN_LIGNE, MEILLEUR, d, JOURS);
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
    consultes: [["themes", "valeur"], ["buffet"], ["voisins"], ["regles"], ["tenue"], ["recents"]],
    jours: JOURS,
    diagnostic: "climatisation",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 7100,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_NOTE_EN_LIGNE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a soigné l'image, propose de réparer l'hôtel", () => {
    const p = partie(IMAGE);
    const c = EPISODE_NOTE_EN_LIGNE.comportements(p, analyser(EPISODE_NOTE_EN_LIGNE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_NOTE_EN_LIGNE.axe(c).titre).toBe("Réparer l'hôtel, pas l'image");
  });

  it("à qui a décidé sans enquêter, propose de lire les avis par thème", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_NOTE_EN_LIGNE.comportements(p, analyser(EPISODE_NOTE_EN_LIGNE, p).trimestre);
    expect(EPISODE_NOTE_EN_LIGNE.axe(c).titre).toBe("Lire les avis par thème avant d'agir");
  });

  it("juge la prévision sur le manque à gagner d'un dixième, prix et classement compris", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    expect(EPISODE_NOTE_EN_LIGNE.comportements(partie(MEILLEUR), t)[3]!.score).toBe(1);
    // Qui oublie le classement des plateformes ne compte que 5 100 € : loin du compte.
    const prixSeul = EPISODE_NOTE_EN_LIGNE.comportements(
      partie(MEILLEUR, { prevision: 5100, confiance: 80 }),
      t,
    )[3]!;
    expect(prixSeul.score).toBe(0);
  });

  it("dit le résultat en chiffre d'affaires net, et les tuiles du meilleur chemin tiennent", () => {
    const t = simuler(MEILLEUR, 2, JOURS);
    expect(EPISODE_NOTE_EN_LIGNE.bilan.titre(t)).toMatch(/chiffre d'affaires hébergement net/);
    expect(EPISODE_NOTE_EN_LIGNE.bilan.tuiles(t).filter((x) => x.tenu).length).toBeGreaterThan(2);
    expect(
      EPISODE_NOTE_EN_LIGNE.bilan.tuiles(simuler(ATTENTISTE, 2, JOURS)).some((x) => x.tenu),
    ).toBe(false);
  });
});
