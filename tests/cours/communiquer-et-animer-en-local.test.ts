import { describe, expect, it } from "vitest";
import { COMMUNIQUER_ET_ANIMER_EN_LOCAL, ENTREPRISES_DE_LA_COMMUNICATION, tableauACompleterDesSupports } from "../../src/config/cours/chapitres/communiquer-et-animer-en-local";
import { BUDGET_COUPE, SUPPORTS, planDeCommunication } from "../../src/config/cours/monde/communication-locale";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { PROGRAMME } from "../../src/config/cours/registre";
import { MILLE_EUROS_POUR_COMMUNIQUER } from "../../src/config/cours/situations/par-chapitre/mille-euros-pour-communiquer";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { BOUTIQUE, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * COMMUNIQUER ET ANIMER EN LOCAL (BTS MCO, bloc 2), À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : MILLE
 * EUROS POUR COMMUNIQUER.
 *
 * Refait à la main sur les passants de janvier : 3 160 entrées, 600 passages en caisse, 32,18 € de
 * marge d'une vente (19 310 € ÷ 600). Entrées = contacts × taux de retour ; ventes = entrées × 600 ÷
 * 3 160, à l'unité la plus proche ; ce qu'une action laisse = ventes × 32,18 € − son coût. Le budget,
 * celui de la fiche : 1 500 €.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const MARGE = 32.18;
const ventes = (e: number) => Math.round((e * 600) / 3_160);
const laisse = (e: number, cout: number) => c(ventes(e) * MARGE - cout);
const posts = (b: number) => laisse(Math.round(Math.min(b * 50, 25_000) * 0.006), b);
const VITRINE = laisse(300, 900);

describe("communiquer et animer en local : le chapitre et son cas", () => {
  it("au palier 4 du BTS MCO, bloc 2, au programme, à la boutique seule ; le cas lui est dédié", () => {
    const ch = COMMUNIQUER_ET_ANIMER_EN_LOCAL;
    expect([ch.parcours, ch.palier]).toEqual(["mco", 4]);
    gardeDuProgramme(ch, PROGRAMME.mco[4]!, () => "bts-mco", /^BTS MCO /);
    expect([...ENTREPRISES_DE_LA_COMMUNICATION]).toEqual(["boutique"]);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    expect(f.charges.publicite).toBe(1_500);
    gardeDuCas(MILLE_EUROS_POUR_COMMUNIQUER, ch);
  });

  it("le coût par contact, puis ce que chaque support laisse : la vitrine 934,26 €, les tracts 11,42 €, la soirée −92,56 €", () => {
    expect(attendus(COMMUNIQUER_ET_ANIMER_EN_LOCAL, "le-cout-par-contact")).toEqual([0.12, 0.02, 0.03]);
    const attendu = { tracts: laisse(100, 600), sms: laisse(80, 250), posts: laisse(120, 400), vitrine: VITRINE, soiree: laisse(40, 350) };
    expect(attendu).toEqual({ tracts: 11.42, sms: 232.7, posts: 340.14, vitrine: 934.26, soiree: -92.56 });
    const g = tableauACompleterDesSupports(BOUTIQUE);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.map((l) => l.cellules[3]!.valeur)).toEqual(SUPPORTS.map((s) => attendu[s.code]));
    expect(g.lignes[0]!.cellules.every((x) => !x.saisir)).toBe(true);
    // Le retour, à deux décimales : ce que l'action laisse ÷ ce qu'elle coûte × 100.
    const retour = (l: number, cout: number) => Math.round((l / cout) * 10_000) / 100;
    expect(attendus(COMMUNIQUER_ET_ANIMER_EN_LOCAL, "le-retour-sur-investissement")).toEqual([retour(934.26, 900), retour(232.7, 250), retour(340.14, 400)]);
    expect([retour(934.26, 900), retour(232.7, 250), retour(340.14, 400)]).toEqual([103.81, 93.08, 85.04]);
  });

  it("le curseur : 98 entrées paient les tracts, 97 non", () => {
    expect([ventes(97) * MARGE < 600, ventes(98) * MARGE >= 600]).toEqual([true, true]);
    gardeDuCurseur(COMMUNIQUER_ET_ANIMER_EN_LOCAL, "les-tracts-au-curseur", 98);
  });

  it("le laboratoire : la vitrine et 500 € de publications, 1 335,30 € ; au-delà de 500 €, plus personne de nouveau", () => {
    expect(c(VITRINE + posts(500))).toBe(1_335.3);
    expect([posts(500), posts(600)]).toEqual([401.04, 301.04]);
    const e = gardeDuLaboratoire(COMMUNIQUER_ET_ANIMER_EN_LOCAL, "le-laboratoire-du-plan");
    expect(e.defi(BOUTIQUE).solution).toEqual({ vitrine: 1, posts: 500 });
    // Avec le SMS au fichier loué, le calcul ferait mieux : c'est la loi qui l'écarte.
    expect(c(VITRINE + laisse(80, 250) + posts(300))).toBe(1_414.02);
    expect(juste(COMMUNIQUER_ET_ANIMER_EN_LOCAL, "le-plan-retenu")[0]).toMatch(/^La vitrine et 500 €/);
    expect(juste(COMMUNIQUER_ET_ANIMER_EN_LOCAL, "le-sms")[0]).toMatch(/consentement préalable/);
    expect(juste(COMMUNIQUER_ET_ANIMER_EN_LOCAL, "le-plus-petit-cout")[0]).toMatch(/^Au-delà de 500 €/);
  });

  it("le cas : dans 1 000 €, la vitrine et 100 € de publications ; la coupe coûte 307,96 €", () => {
    expect(BUDGET_COUPE).toBe(1_000);
    expect(attendus(MILLE_EUROS_POUR_COMMUNIQUER, "les-plans")).toEqual([VITRINE, posts(500), c(VITRINE + posts(100))]);
    expect(c(VITRINE + posts(100))).toBe(1_027.34);
    expect(planDeCommunication(f, true, 200, BUDGET_COUPE).dansLeBudget).toBe(false);
    expect(attendus(MILLE_EUROS_POUR_COMMUNIQUER, "ce-que-coute-la-coupe")).toEqual([400, 307.96]);
    expect(juste(MILLE_EUROS_POUR_COMMUNIQUER, "reponse")[0]).toMatch(/^Garder la vitrine et 100 €/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre et le cas", () => {
    gardesDeTexte(COMMUNIQUER_ET_ANIMER_EN_LOCAL);
    gardesDeTexte(MILLE_EUROS_POUR_COMMUNIQUER);
  });
});
