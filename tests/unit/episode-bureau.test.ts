import { describe, expect, it } from "vitest";
import {
  D,
  EN_ATTENTE_DEPART,
  FACTURES_PAR_SEMAINE,
  IMPREVUS,
  O,
  erreurDecouverte,
  hasard,
  simuler,
} from "../../src/engine/episodes/bureau-qui-s-echauffe";
import {
  GRAINES_DU_BILAN,
  moyenne,
  rejouerAvec,
} from "../../src/engine/episodes/commun";
import {
  ETAPES,
  PREVISION,
  REFERENCES,
} from "../../src/config/episodes/bureau-qui-s-echauffe";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_BUREAU } from "../../src/pedagogy/episodes/bureau-qui-s-echauffe";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le bureau qui s'échauffe » fait jouer un employé de bureau en
 * seconde professionnelle GA-TL. Il enseigne qu'une facture se vérifie avant
 * d'être payée, et surtout comment parler aux autres : écouter un
 * interlocuteur en colère, dire un désaccord en face, dire tôt une erreur,
 * recevoir une remarque. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 2, 0, 3, 2, 0];
const EVITER = [2, 1, 1, 0, 3, 2];
const HABITUDE = [2, 0, 1, 0, 0, 1];
const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) =>
  simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
/** Ce que la meilleure option fait de plus que l'option donnée, en moyenne sur trente tirages. */
const ecart = (chemin: readonly number[], d: number, option: number) => {
  const r = rejeu(chemin, d);
  return Math.max(...r.map((x) => x.attendu)) - r[option]!.attendu;
};

describe("le modèle du bureau", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[3]!.recues).toBeCloseTo(
      simuler(HABITUDE, 12).semaines[3]!.recues,
      6,
    );
    expect(hasard(5)).toBe(hasard(5));
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(hasard(g).imprevus.length).toBeGreaterThanOrEqual(1);
      expect(hasard(g).imprevus.length).toBeLessThanOrEqual(2);
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) =>
        hasard(g).imprevus.map((i) => i.imprevu.id),
      ),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("la prévision se fait par une multiplication guidée, que le réalisé suit de près", () => {
    expect(PREVISION.parJour * PREVISION.jours).toBe(FACTURES_PAR_SEMAINE);
    // Sauf quand la fin des grands chantiers tombe en semaine 3 : un imprévu ne se prévoit pas.
    const afflux = (g: number) =>
      hasard(g).imprevus.some(
        (i) =>
          i.imprevu.effet.factures &&
          i.semaine <= 3 &&
          3 < i.semaine + i.imprevu.duree,
      );
    const ordinaires = GRAINES_DU_BILAN.filter((g) => !afflux(g));
    expect(ordinaires.length).toBeGreaterThan(20);
    for (const g of ordinaires) {
      const reel = EPISODE_BUREAU.prevision.reel(simuler(MEILLEUR, g));
      expect(Math.abs(reel - FACTURES_PAR_SEMAINE)).toBeLessThan(
        0.15 * FACTURES_PAR_SEMAINE,
      );
    }
  });

  it("avec la bannette, la pile redescend sous une semaine de factures ; l'habitude la laisse grossir", () => {
    expect(simuler(MEILLEUR, 3).enAttenteFinale).toBeLessThan(
      FACTURES_PAR_SEMAINE,
    );
    expect(simuler(HABITUDE, 3).enAttenteFinale).toBeGreaterThan(
      EN_ATTENTE_DEPART * 2,
    );
    expect(simuler(MEILLEUR, 3).ententeFinale).toBeGreaterThan(7);
    expect(simuler(HABITUDE, 3).ententeFinale).toBeLessThan(5);
  });

  it("payer sans vérifier vide la pile, mais fait payer à tort", () => {
    const payer = [...MEILLEUR];
    payer[D.factures] = O.factures.payerSansVerifier;
    const t = simuler(payer, 4);
    expect(t.enAttenteFinale).toBeLessThan(
      simuler(MEILLEUR, 4).enAttenteFinale,
    );
    expect(t.payeATort).toBeGreaterThan(simuler(MEILLEUR, 4).payeATort + 10000);
  });

  it("l'erreur cachée est découverte six fois sur dix environ, et seulement cachée", () => {
    const cacher = [...MEILLEUR];
    cacher[D.erreur] = O.erreur.cacher;
    const n = GRAINES_DU_BILAN.filter((g) =>
      erreurDecouverte(cacher, g),
    ).length;
    expect(n).toBeGreaterThan(12);
    expect(n).toBeLessThan(26);
    expect(GRAINES_DU_BILAN.some((g) => erreurDecouverte(MEILLEUR, g))).toBe(
      false,
    );
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : une bannette convenue avec le dépôt bat payer sans vérifier, les mails et les heures", () => {
    expect(classement(MEILLEUR, D.factures)[0]).toBe(O.factures.bannette);
    expect(
      ecart(MEILLEUR, D.factures, O.factures.payerSansVerifier),
    ).toBeGreaterThan(3000);
  });

  it("D2 : écouter le transporteur bat le renvoyer, lui promettre ou lui répondre sur le même ton", () => {
    const c = classement(MEILLEUR, D.transporteur);
    expect(c[0]).toBe(O.transporteur.ecouter);
    expect(c.at(-1)).toBe(O.transporteur.memeTon);
    expect(
      ecart(MEILLEUR, D.transporteur, O.transporteur.promettre),
    ).toBeGreaterThan(3000);
  });

  it("D3 : parler à Fabienne en face bat se taire, se plaindre dans son dos ou la reprendre en public", () => {
    const c = classement(MEILLEUR, D.desaccord);
    expect(c[0]).toBe(O.desaccord.parler);
    expect(c.at(-1)).toBe(O.desaccord.enPublic);
  });

  it("D4 : dire l'erreur tout de suite bat la cacher, la faire dire ou l'écrire sans détail", () => {
    const c = classement(MEILLEUR, D.erreur);
    expect(c[0]).toBe(O.erreur.dire);
    expect(c.at(-1)).toBe(O.erreur.cacher);
  });

  it("D5 : vérifier contre le bon de livraison bat défendre la facture, renvoyer ou céder", () => {
    const c = classement(MEILLEUR, D.telephone);
    expect(c[0]).toBe(O.telephone.verifier);
    expect(ecart(MEILLEUR, D.telephone, O.telephone.remise)).toBeGreaterThan(
      3000,
    );
  });

  it("D6 : écouter la remarque et faire le dossier à deux bat se justifier ou se vexer", () => {
    const c = classement(MEILLEUR, D.remarque);
    expect(c[0]).toBe(O.remarque.ecouter);
    expect(c.at(-1)).toBe(O.remarque.seVexer);
  });

  it("écouter, vérifier, dire bat éviter les conflits et faire comme d'habitude, en moyenne", () => {
    const [bien, eviter, habitude] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bien).toBeGreaterThan(0);
    expect(eviter).toBeLessThan(0);
    expect(habitude).toBeLessThan(0);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (
    chemin: readonly number[],
    extra: Partial<PartieJouee> = {},
  ): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["pile", "quai"],
      ["dossier"],
      ["semaine"],
      ["saisie", "avoir"],
      ["bon", "cahier"],
      ["erreurs"],
    ],
    jours: JOURS,
    diagnostic: "circuit",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 60,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_BUREAU, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui évite les conflits, juge faibles ses décisions et propose d'écouter, vérifier, dire en face", () => {
    const p = partie(EVITER);
    const a = analyser(EPISODE_BUREAU, p);
    expect(a.decisions.filter((d) => d.bonne)).toHaveLength(0);
    const c = EPISODE_BUREAU.comportements(p, a.trimestre);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_BUREAU.axe(c).titre).toBe("Écouter, vérifier, dire en face");
  });

  it("à qui a décidé sans rien vérifier, propose de regarder pourquoi les factures attendent", () => {
    const p = partie(MEILLEUR, {
      consultes: [[], [], [], [], [], []],
      jours: 0,
    });
    const c = EPISODE_BUREAU.comportements(
      p,
      analyser(EPISODE_BUREAU, p).trimestre,
    );
    expect(EPISODE_BUREAU.axe(c).titre).toBe(
      "Regarder pourquoi les factures attendent",
    );
  });

  it("dit le résultat en écart au plafond du bureau", () => {
    expect(EPISODE_BUREAU.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /sous le plafond du bureau/,
    );
    expect(EPISODE_BUREAU.bilan.titre(simuler(HABITUDE, 4242))).toMatch(
      /au-delà du plafond du bureau/,
    );
  });

  it("ne trahit pas la bonne réponse par sa longueur : la meilleure option n'est la plus longue que deux fois au plus", () => {
    // Un élève qui prend toujours l'option la plus longue, la plus détaillée,
    // ne doit pas trouver la méthode sans réfléchir.
    const longues = ETAPES.filter((e, d) => {
      const longueurs = e.options.map((o) => o.t.length);
      return longueurs[MEILLEUR[d]!]! >= Math.max(...longueurs);
    });
    expect(
      longues.map((e) => e.titre).length,
      longues.map((e) => e.titre).join(", "),
    ).toBeLessThanOrEqual(2);
  });

  it("n'écrit aucun tiret au milieu d'une phrase", () => {
    const textes: string[] = [];
    const ctx = {
      enAttente: "1",
      retards: "1",
      litiges: "1",
      entente: "1",
      couts: "1 k€",
    };
    for (const e of ETAPES) {
      textes.push(e.titre, e.question, ...e.messages(ctx).map((m) => m.texte));
      for (const s of e.sources)
        textes.push(
          s.titre,
          typeof s.resultat === "string" ? s.resultat : s.resultat(ctx),
        );
      for (const o of e.options) textes.push(o.t, o.d);
      for (const r of e.reactions)
        for (const m of r ?? []) textes.push(m.texte);
    }
    textes.push(
      EPISODE_BUREAU.persona,
      EPISODE_BUREAU.resume,
      EPISODE_BUREAU.jugement,
    );
    for (const t of textes) expect(t, t).not.toMatch(/\s[–—]\s/);
  });
});
