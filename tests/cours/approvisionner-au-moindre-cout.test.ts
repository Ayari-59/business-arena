import { describe, expect, it } from "vitest";
import { APPROVISIONNER_AU_MOINDRE_COUT } from "../../src/config/cours/chapitres/approvisionner-au-moindre-cout";
import {
  consommationDeNPlus1,
  coutDePossession,
  coutPourNCommandes,
  coutTotalDApprovisionnement,
  meilleurNombreDeCommandes,
  repartitionNormale,
  risqueDeRupture,
  securiteAuRisque,
  securiteParLaTable,
  tableauDesTranches,
  troisJoursFaceALaLoi,
  wilson,
} from "../../src/config/cours/monde/approvisionnement-de-nova";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { DEUX_COMMANDES_PAR_AN, TARIF_AVEC_L_OFFRE, deuxCommandes } from "../../src/config/cours/situations/par-chapitre/deux-commandes-par-an";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * APPROVISIONNER AU MOINDRE COÛT (DCG UE11 § 3.2) : chaque chiffre refait à la main. D = 5 800 + 7 000
 * + 6 200 + 7 000 = 26 000 jeux ; cl = 200 € ; cs = 10 % × 22 € + 0,40 € = 2,60 € ; le tarif à 22 €,
 * 21,78 € dès 2 600 jeux, 21,67 € dès 6 500 ; la consommation du délai, normale de moyenne 600 jeux
 * et d'écart type 50.
 */

const ch = APPROVISIONNER_AU_MOINDRE_COUT;

describe("approvisionner au moindre coût : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite le DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.blocs.map((b) => b.split(" · ")[0])).toEqual(["DCG UE11", "BUT GEA"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    expect(new Set(ch.etapes.map((e) => e.titre)).size).toBe(ch.etapes.length);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const e of chapitreDuCas(ch, NOVA).etapes) {
      if (e.type !== "choix") continue;
      const o = e.options(NOVA, VIDE);
      const bonne = o.find((k) => k.juste)!;
      expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
    }
  });
});

describe("le modèle de Wilson, refait à la main", () => {
  it("12 commandes par an : 2 400 € de passation, 26 000 ÷ 24 × 2,60 = 2 816,67 € de possession, 5 216,67 €", () => {
    expect(consommationDeNPlus1()).toEqual({ trimestres: [5_800, 7_000, 6_200, 7_000], annee: 26_000 });
    expect(coutDePossession()).toBe(2.6);
    const a = coutPourNCommandes(12);
    expect([a.passation, a.possession, a.total]).toEqual([2_400, 2_816.67, 5_216.67]);
    expect(Math.round((26_000 / 24) * 2.6 * 100) / 100).toBe(2_816.67);
    expect(attendus(ch, "le-cout-d-aujourd-hui")).toEqual([2.6, 26_000 / 12, 2_400, 2_816.67, 5_216.67]);
  });

  it("Q* = √(2 × 26 000 × 200 ÷ 2,60) = 2 000 jeux, 13 commandes, une toutes les 4 semaines, 5 200 €", () => {
    expect(Math.sqrt((2 * 26_000 * 200) / 2.6)).toBe(2_000);
    const w = wilson();
    expect([w.quantite, w.commandes, w.semaines, w.passation, w.possession, w.total]).toEqual([2_000, 13, 4, 2_600, 2_600, 5_200]);
    expect(attendus(ch, "la-formule-de-wilson")).toEqual([2_000, 13, 4, 5_200]);
    expect(meilleurNombreDeCommandes()).toBe(13);
    expect(coutPourNCommandes(14).total).toBeGreaterThan(5_200);
    const e = gardeDuLaboratoire(ch, "le-laboratoire-de-wilson");
    expect(e.defi(NOVA).solution).toEqual({ commandes: 13 });
    expect(juste(ch, "a-l-optimum")).toEqual(["Le coût est plat près de l'optimum"]);
  });
});

describe("le tarif dégressif, refait à la main", () => {
  it("les trois tranches : 577 200 € à 2 000 jeux, 571 631,40 € à 2 600 (la borne), 572 562,75 € à 6 500 (la borne)", () => {
    const t = tableauDesTranches();
    expect(t.lignes.map((l) => [l.prix, l.dedans, l.retenue, l.achat, l.total, l.totalDApprovisionnement])).toEqual([
      [22, true, 2_000, 572_000, 5_200, 577_200],
      [21.78, false, 2_600, 566_280, 5_351.4, 571_631.4],
      [21.67, false, 6_500, 563_420, 9_142.75, 572_562.75],
    ]);
    expect(26_000 * 21.78 + 10 * 200 + 1_300 * (0.1 * 21.78 + 0.4)).toBeCloseTo(571_631.4, 6);
    expect(t.lignes[1]!.qEtoile).toBeCloseTo(Math.sqrt((2 * 26_000 * 200) / 2.578), 9);
    expect(t.lignes[1]!.qEtoile).toBeLessThan(2_600);
    expect(t.meilleure.retenue).toBe(2_600);
    expect(incoherencesDuTableau(etape(ch, "le-tableau-des-tranches", "a-completer").grille(NOVA))).toEqual([]);
    expect(juste(ch, "le-choix-de-la-tranche")[0]!.replace(/\s/g, " ")).toBe("10 commandes de 2 600 jeux");
  });

  it("le laboratoire du tarif : seule la quantité de 2 600 jeux relève le défi, et le départ (2 000 jeux) ne le relève pas", () => {
    expect(coutTotalDApprovisionnement(2_600).totalDApprovisionnement).toBe(571_631.4);
    expect(coutTotalDApprovisionnement(2_700).totalDApprovisionnement).toBeGreaterThan(571_631.4);
    const e = gardeDuLaboratoire(ch, "le-laboratoire-du-tarif");
    expect(e.defi(NOVA).solution).toEqual({ quantite: 2_600 });
  });
});

describe("l'avenir aléatoire, refait à la main", () => {
  it("la consommation du délai : 100 jeux par jour × 6 jours = 600 ; commander à 600, c'est une rupture sur deux", () => {
    expect(attendus(ch, "le-point-de-commande")).toEqual([600, 26]);
    expect(risqueDeRupture(0)).toBeCloseTo(0.5, 7);
    expect(repartitionNormale(1.645)).toBeCloseTo(0.95, 3);
    expect(repartitionNormale(1.96)).toBeCloseTo(0.975, 3);
    expect(juste(ch, "predire-le-risque")).toEqual(["Une commande sur deux"]);
  });

  it("le stock de sécurité : 1,645 × 50 = 82,25, soit 83 jeux ; point de commande 683 ; 83 × 2,578 = 213,97 € par an", () => {
    expect(securiteAuRisque()).toBe(83);
    expect(risqueDeRupture(82)).toBeGreaterThan(0.05);
    expect(risqueDeRupture(83)).toBeLessThan(0.05);
    const s = securiteParLaTable();
    expect([s.brut, s.securite, s.pointDeCommande, s.coutAnnuel]).toEqual([82.25, 83, 683, 213.97]);
    expect(attendus(ch, "la-securite-par-la-table")).toEqual([83, 683, 213.97]);
    const e = gardeDuLaboratoire(ch, "le-laboratoire-du-stock-de-securite");
    expect(e.defi(NOVA).solution).toEqual({ securite: 83 });
  });

  it("l'expert : les 3 jours (300 jeux, t = 6) coûtent 773,40 € ; à 99 %, 2,33 × 50 = 116,5, soit 117 jeux, 87,66 € de plus, 0,1 rupture par an", () => {
    const t = troisJoursFaceALaLoi();
    expect([t.securite, t.z, t.coutAnnuel]).toEqual([300, 6, 773.4]);
    expect(t.risque).toBeLessThan(1e-8);
    expect(juste(ch, "trois-jours-ou-la-loi")).toEqual(["Ils ne couvrent pas le même aléa"]);
    const [securite, plus, ruptures] = attendus(ch, "un-service-a-99");
    expect([securite, plus]).toEqual([117, 87.66]);
    expect(ruptures).toBeCloseTo(0.1, 9);
  });
});

describe("le cas dédié : deux commandes par an", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(DEUX_COMMANDES_PAR_AN);
    gardeDuCas(DEUX_COMMANDES_PAR_AN, ch);
  });

  it("à 21,56 €, cs = 2,556 € ; 560 560 € d'achat, 2 × 200 + 6 500 × 2,556 = 17 014 € de gestion, 577 574 € : 5 942,60 € de plus", () => {
    expect(TARIF_AVEC_L_OFFRE.at(-1)).toEqual({ des: 13_000, prix: 21.56, remise: 0.02 });
    const x = deuxCommandes();
    expect([x.offre.cs, x.offre.achat, x.offre.total, x.offre.totalDApprovisionnement]).toEqual([2.556, 560_560, 17_014, 577_574]);
    expect([x.remiseGagnee, x.gestionEnPlus, x.ecart]).toEqual([5_720, 11_662.6, 5_942.6]);
    expect(5_720 - 11_662.6).toBeCloseTo(-5_942.6, 6);
    expect(attendus(DEUX_COMMANDES_PAR_AN, "le-cout-de-l-offre")).toEqual([2.556, 560_560, 17_014, 577_574]);
    expect(juste(DEUX_COMMANDES_PAR_AN, "reponse")[0]!.replace(/\s/g, " ")).toBe("Refuser : l'offre coûte 5 942,60 € de plus par an");
  });
});
