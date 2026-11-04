import { describe, expect, it } from "vitest";
import {
  PILOTER_UN_CENTRE,
  centresDuChapitre,
  defiDesCessionsAtteint,
  laboratoireDesCessions,
} from "../../src/config/cours/chapitres/piloter-un-centre";
import { TABLEAU_DE_BORD } from "../../src/config/cours/chapitres/tableau-de-bord";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE, casDuChapitre } from "../../src/config/cours/situations";
import { LE_SOUS_TRAITANT_BAISSE_SON_PRIX, sousTraitantMoinsCher } from "../../src/config/cours/situations/par-chapitre/le-sous-traitant-baisse-son-prix";
import { coutCibleDeLaGo, fixesDesCentres, seuilDeLAtelier } from "../../src/config/cours/monde/centres-de-nova";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { missionDuChapitre } from "../../src/config/cours/jouez";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * PILOTER UN CENTRE (janvier à mars N chez NOVA, en deux centres) : chaque chiffre refait à la main, à
 * partir de la fiche (1 590, 1 450 et 1 738 enceintes à 59 € ; 22 € de composants et 16 € d'autres coûts
 * variables ; les charges fixes de janvier réparties par le coût complet : 4 863,55 € d'approvisionnement
 * et 18 604,60 € de production pour l'atelier, 7 714,85 € de distribution pour le service commercial ;
 * l'activité normale de 2 120 enceintes ; le sous-traitant à 52 € ; la NOVA Go à 34 € et 19 €).
 */

const ch = PILOTER_UN_CENTRE;
const x = centresDuChapitre(NOVA);
const cent = (v: number) => (Math.sign(v) * Math.round(Number((Math.abs(v) * 100).toPrecision(15)))) / 100 + 0;
const FIXES_ATELIER = 4_863.55 + 18_604.6;
const FIXES_COMMERCIAL = 7_714.85;

describe("piloter un centre : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite le BTS CG P5, le DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.blocs).toEqual(["BTS CG P5 · Analyse et prévision de l'activité", "DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["cout-complet", "tableau-de-bord"]);
    expect(ch.ensuite).toEqual(["les-ecarts-et-leurs-responsables"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const k of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(k)), `objectif ${k}`).toBe(true);
    expect(missionDuChapitre("piloter-un-centre", NOVA)).not.toBeNull();
  });

  it("le tableau de bord y mène, par « Et ensuite »", () => {
    expect(TABLEAU_DE_BORD.ensuite).toEqual([ch.code]);
    expect(suitesDuChapitre("tableau-de-bord").ensuite).toEqual([{ code: ch.code, titre: "Piloter un centre" }]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LE_SOUS_TRAITANT_BAISSE_SON_PRIX]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });

  it("les tableaux à compléter tiennent leurs totaux", () => {
    for (const e of ch.etapes) if (e.type === "a-completer") expect(incoherencesDuTableau(e.grille(NOVA)), e.id).toEqual([]);
  });
});

describe("les trois prix de cession, refaits à la main", () => {
  it("les charges fixes des centres : 23 468,15 € à l'atelier, 7 714,85 € au service commercial, les 31 183 € du mois", () => {
    expect(fixesDesCentres(NOVA_GESTION)).toEqual({ atelier: cent(FIXES_ATELIER), commercial: FIXES_COMMERCIAL });
    expect(cent(FIXES_ATELIER + FIXES_COMMERCIAL)).toBe(19_700 + 10_650 + 833);
  });

  it("le coût standard 49,07 €, les charges réelles 83 888,15 €, le coût réel 52,76 €", () => {
    expect(cent(38 + FIXES_ATELIER / 2_120)).toBe(49.07);
    expect(cent(1_590 * 38 + FIXES_ATELIER)).toBe(83_888.15);
    expect(cent(83_888.15 / 1_590)).toBe(52.76);
    expect(attendus(ch, "les-trois-prix")).toEqual([49.07, 83_888.15, 52.76]);
  });

  it("au prix de marché : 82 680 € de cessions, l'atelier −1 208,15 €, le service commercial 3 415,15 €, NOVA 2 207 €", () => {
    const cessions = 1_590 * 52;
    expect(cessions).toBe(82_680);
    expect(cent(cessions - 83_888.15)).toBe(-1_208.15);
    expect(cent(1_590 * 59 - cessions - FIXES_COMMERCIAL)).toBe(3_415.15);
    expect(attendus(ch, "les-resultats-au-prix-de-marche")).toEqual([82_680, -1_208.15, 3_415.15, 2_207]);
  });

  it("les trois partages : le résultat de NOVA est 2 207 € dans les trois colonnes", () => {
    const g = etape(ch, "les-trois-partages", "a-completer").grille(NOVA);
    expect(g.lignes[1]!.cellules.map((c) => c.valeur)).toEqual([82_680, cent(1_590 * 49.07), 83_888.15]);
    expect(g.lignes[2]!.cellules.map((c) => c.valeur)).toEqual([-1_208.15, cent(1_590 * 49.07 - 83_888.15), 0]);
    expect(cent(1_590 * 49.07 - 83_888.15)).toBe(-5_866.85);
    expect(g.lignes[3]!.cellules.map((c) => c.valeur)).toEqual([3_415.15, 8_073.85, 2_207]);
    expect(g.lignes[4]!.cellules.map((c) => c.valeur)).toEqual([2_207, 2_207, 2_207]);
    expect(juste(ch, "predire-le-partage")).toEqual(["Ne changerait pas"]);
  });

  it("les bonnes réponses : la sous-activité, les dérives transmises", () => {
    expect(juste(ch, "la-sous-activite")[0]).toMatch(/^Des ventes : 75 % de l'activité normale$/);
    expect(juste(ch, "le-cout-reel-et-les-comportements")).toEqual(["L'atelier transmet ses dérives à l'autre centre"]);
  });
});

describe("le seuil de l'atelier, le sous-traitant et le laboratoire", () => {
  it("le seuil de l'atelier au prix de marché : 23 468,15 ÷ 14 = 1 676,30, soit 1 677 enceintes", () => {
    expect(FIXES_ATELIER / 14).toBeCloseTo(1_676.3, 2);
    expect(seuilDeLAtelier(NOVA_GESTION, 52)).toBe(1_677);
    expect(seuilDeLAtelier(NOVA_GESTION, 38)).toBeNull();
    gardeDuCurseur(ch, "le-seuil-de-l-atelier", 1_677);
    expect(juste(ch, "predire-le-seuil").map((t) => t.replace(/\s/g, " "))).toEqual(["Entre 1 590 et 2 120"]);
  });

  it("acheter au sous-traitant : le service commercial 3 415,15 €, l'atelier −23 468,15 €, NOVA −20 053 €, une perte de 22 260 €", () => {
    expect(cent(93_810 - 82_680 - FIXES_COMMERCIAL)).toBe(3_415.15);
    expect(cent(3_415.15 - FIXES_ATELIER)).toBe(-20_053);
    expect(cent(2_207 + 20_053)).toBe(1_590 * (52 - 38));
    expect(attendus(ch, "acheter-au-sous-traitant")).toEqual([3_415.15, -23_468.15, -20_053, 22_260]);
  });

  it("le laboratoire : le départ à 53 € et 1 590 enceintes échoue, 52 € et 1 680 enceintes réussit ; le prix ne change pas le résultat de NOVA", () => {
    const e = etape(ch, "le-laboratoire-des-cessions", "simulation");
    const leviers = e.leviers(NOVA);
    const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
    expect(depart).toEqual({ cession: 53, quantite: 1_590, fournisseur: 0 });
    const d = e.defi(NOVA);
    expect(d.solution).toEqual({ cession: 52, quantite: 1_680, fournisseur: 0 });
    expect([d.atteint(depart), d.atteint(d.solution)]).toEqual([false, true]);
    // À 52 € et 1 680 enceintes : l'atelier 1 680 × 14 − 23 468,15, le service commercial 1 680 × 7 − 7 714,85.
    const r = laboratoireDesCessions(NOVA_GESTION, d.solution);
    expect([r.atelier.resultat, r.commercial.resultat, r.nova]).toEqual([cent(1_680 * 14 - FIXES_ATELIER), cent(1_680 * 7 - FIXES_COMMERCIAL), 1_680 * 21 - 31_183]);
    // Au volume de janvier, aucun prix de cession ne relève le défi.
    for (let p = 38; p <= 60; p++) expect(defiDesCessionsAtteint(NOVA_GESTION, { cession: p, quantite: 1_590, fournisseur: 0 }), `${p} €`).toBe(false);
    // Le prix de cession ne change pas le résultat de NOVA ; le sous-traitant le baisse de 14 € par enceinte.
    for (const p of [38, 45, 52, 60]) expect(laboratoireDesCessions(NOVA_GESTION, { cession: p, quantite: 1_590, fournisseur: 0 }).nova).toBe(2_207);
    expect(laboratoireDesCessions(NOVA_GESTION, { cession: 52, quantite: 1_590, fournisseur: 1 }).nova).toBe(2_207 - 1_590 * 14);
    // Le graphique : trois courbes selon le prix de cession.
    expect(e.graphique!(NOVA).courbes.map((c) => c.valeur({ ...depart, cession: 52 }))).toEqual([-1_208.15, 3_415.15, 2_207]);
  });
});

describe("le coût cible de la NOVA Go, refait à la main", () => {
  it("34 € − 15 € = 19 € ; le projet à 23,50 € dépasse de 4,50 € et ne laisse que 10,50 €", () => {
    expect(attendus(ch, "le-cout-cible")).toEqual([19, 4.5, 10.5]);
  });

  it("par fonction : 7,60 €, 5,70 €, 3,80 €, 1,90 € de cibles ; −0,40 €, 2,60 €, 0,30 €, 2 € d'écarts ; la Go lancée coûte son coût cible, son coût variable de la gamme", () => {
    const g = etape(ch, "le-cout-cible-par-fonction", "a-completer").grille(NOVA);
    expect(g.lignes.map((l) => l.cellules[2]!.valeur)).toEqual([7.6, 5.7, 3.8, 1.9, 19]);
    expect(g.lignes.map((l) => l.cellules[3]!.valeur)).toEqual([-0.4, 2.6, 0.3, 2, 4.5]);
    expect(cent(7.2 + 8.3 + 4.1 + 3.9)).toBe(23.5);
    expect(coutCibleDeLaGo().coutRetenu).toBe(19);
    expect(juste(ch, "ou-chercher-l-economie")).toEqual(["Batterie et connexion d'abord ; le son peut recevoir plus"]);
  });
});

describe("le PGI et le reporting, refaits à la main", () => {
  it("la requête : une somme des ventes de février par client, et février : 66 670 € + 18 880 € = 85 550 €, 75 400 € d'achats, 2 435,15 €", () => {
    expect(juste(ch, "la-requete-du-pgi")).toEqual(["SELECT code_client, SUM(quantite * prix_ht) FROM VENTES WHERE mois = 2 GROUP BY code_client"]);
    expect([1_130 * 59, 320 * 59]).toEqual([66_670, 18_880]);
    expect(cent(85_550 - 1_450 * 52 - FIXES_COMMERCIAL)).toBe(2_435.15);
    expect(attendus(ch, "l-extraction-de-fevrier")).toEqual([85_550, 75_400, 2_435.15]);
  });

  it("le reporting de mars : 1 738 enceintes, l'atelier 863,85 €, le service commercial 4 451,15 €, NOVA 5 315 €, les cessions éliminées", () => {
    const g = etape(ch, "le-reporting-de-mars", "a-completer").grille(NOVA);
    expect(g.lignes[0]!.cellules.map((c) => c.valeur)).toEqual([null, 1_738 * 59, null, 102_542]);
    expect(g.lignes[1]!.cellules.map((c) => c.valeur)).toEqual([90_376, null, -90_376, 0]);
    expect(g.lignes[3]!.cellules.map((c) => c.valeur)).toEqual([1_738 * 38, null, null, 66_044]);
    expect(cent(90_376 - 66_044 - FIXES_ATELIER)).toBe(863.85);
    expect(cent(102_542 - 90_376 - FIXES_COMMERCIAL)).toBe(4_451.15);
    expect(g.lignes.at(-1)!.cellules.map((c) => c.valeur)).toEqual([863.85, 4_451.15, 0, 5_315]);
    // Le trimestre : −1 208,15 − 3 168,15 + 863,85 à l'atelier ; 3 415,15 + 2 435,15 + 4 451,15 au service commercial.
    expect(x.reporting.trimestre).toEqual({ atelier: -3_512.45, commercial: 10_301.45, nova: 2_207 - 733 + 5_315, eliminations: (1_590 + 1_450 + 1_738) * 52 });
    expect(juste(ch, "la-remontee-des-comptes")).toEqual(["Les mêmes règles et la même date que l'autre centre"]);
  });
});

describe("le cas dédié : le sous-traitant baisse son prix", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LE_SOUS_TRAITANT_BAISSE_SON_PRIX);
    expect(casDuChapitre(ch.code)).toBe(LE_SOUS_TRAITANT_BAISSE_SON_PRIX);
    gardeDuCas(LE_SOUS_TRAITANT_BAISSE_SON_PRIX, ch);
  });

  it("à 48 € dehors : le service commercial 9 775,15 €, l'atelier −23 468,15 €, NOVA −13 693 € ; aligné à 48 € : l'atelier −7 568,15 €, NOVA 2 207 €, 15 900 € de mieux", () => {
    const n = sousTraitantMoinsCher(NOVA);
    expect(cent(1_590 * (59 - 48) - FIXES_COMMERCIAL)).toBe(9_775.15);
    expect(attendus(LE_SOUS_TRAITANT_BAISSE_SON_PRIX, "si-elle-achete-dehors")).toEqual([9_775.15, -23_468.15, -13_693]);
    expect(cent(1_590 * (48 - 38) - FIXES_ATELIER)).toBe(-7_568.15);
    expect(attendus(LE_SOUS_TRAITANT_BAISSE_SON_PRIX, "si-l-atelier-suit-le-marche")).toEqual([-7_568.15, 9_775.15, 2_207, 15_900]);
    expect(n.perte).toBe(1_590 * (48 - 38));
    const r = etape(LE_SOUS_TRAITANT_BAISSE_SON_PRIX, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["Non : l'atelier fournit, mais à 48 €"]);
  });
});
