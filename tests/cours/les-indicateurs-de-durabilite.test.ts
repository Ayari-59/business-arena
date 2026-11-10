import { describe, expect, it } from "vitest";
import { LES_INDICATEURS_DE_DURABILITE, defiDurableAtteint, laboratoireDurable } from "../../src/config/cours/chapitres/les-indicateurs-de-durabilite";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE, casDuChapitre } from "../../src/config/cours/situations";
import { LES_INDICATEURS_QUE_DEMANDE_CAMPUSTECH } from "../../src/config/cours/situations/par-chapitre/les-indicateurs-que-demande-campustech";
import { INDICATEURS_DURABLES, seuilEnEnceintes, tableauDeBordDurable, volumeSousLeSeuilDEnergie } from "../../src/config/cours/monde/tableau-de-bord-durable";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { missionDuChapitre } from "../../src/config/cours/jouez";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * LES INDICATEURS DE DURABILITÉ AU TABLEAU DE BORD (janvier à juin chez NOVA) : chaque chiffre refait à
 * la main, à partir des ventes du semestre (1 590, 1 450, 1 738, 1 900, 2 030 et 2 151 enceintes) et des
 * hypothèses du chapitre (1,2 kWh par enceinte et 1 500 kWh de bâtiment par mois, 0,052 kg de CO2
 * équivalent par kWh, 0,35 kg d'emballage par enceinte valorisé à 60 % puis 85 % dès avril, 16, 30, 12,
 * 0, 18 et 8 heures d'absence, un accident en mars, 4 opérateurs à 151,67 heures).
 */

const ch = LES_INDICATEURS_DE_DURABILITE;
const cent = (v: number) => (Math.sign(v) * Math.round(Number((Math.abs(v) * 100).toPrecision(15)))) / 100 + 0;

describe("les indicateurs de durabilité : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite la DCG UE11, la DSCG UE3 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.blocs).toEqual(["DCG UE11 · Contrôle de gestion", "DSCG UE3 · Contrôle de gestion et stratégie", "BUT GEA · Concevoir des outils de contrôle de gestion"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["tableau-de-bord", "la-responsabilite-societale"]);
    expect(ch.ensuite).toEqual(["ce-que-rapporte-l-engagement"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const k of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(k)), `objectif ${k}`).toBe(true);
    expect(missionDuChapitre(ch.code, NOVA)).not.toBeNull();
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LES_INDICATEURS_QUE_DEMANDE_CAMPUSTECH]) {
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

  it("chaque indicateur a un pilier, un centre, un maillon et une norme", () => {
    expect(INDICATEURS_DURABLES.map((i) => i.pilier)).toEqual(["environnement", "environnement", "environnement", "social", "social", "gouvernance", "gouvernance"]);
    for (const i of INDICATEURS_DURABLES) for (const x of [i.centre, i.maillon, i.norme]) expect(x.length, i.code).toBeGreaterThan(0);
    expect(juste(ch, "les-trois-piliers")).toEqual(["Énergie et déchets : environnement ; absentéisme : social ; délai : gouvernance"]);
  });
});

describe("l'énergie, refaite à la main", () => {
  it("février : 1 450 × 1,2 + 1 500 = 3 240 kWh, 2,23 kWh par enceinte, 168,48 kg ; le voyant s'allume", () => {
    expect(cent(1_450 * 1.2 + 1_500)).toBe(3_240);
    expect(attendus(ch, "l-energie-de-fevrier")).toEqual([3_240, cent(3_240 / 1_450), cent(3_240 * 0.052)]);
    expect(tableauDeBordDurable().mois[1]!.voyants.kwhParEnceinte).toBe(true);
    expect(juste(ch, "predire-l-intensite")).toEqual(["S'éteindrait"]);
  });

  it("le volume qui éteint le voyant : 1 500 ÷ (2,2 − 1,2) = 1 500 enceintes ; le seuil de rentabilité : 31 183 ÷ 21, soit 1 485", () => {
    expect(volumeSousLeSeuilDEnergie()).toBe(1_500);
    expect(seuilEnEnceintes()).toBe(Math.ceil(31_183 / 21));
    expect(attendus(ch, "le-seuil-d-energie")).toEqual([1_500, 1_485]);
  });

  it("le laboratoire : février tel quel échoue ; 1 500 enceintes, 1,2 kWh et 70 % réussit ; l'absentéisme reste allumé", () => {
    const e = etape(ch, "le-laboratoire-durable", "simulation");
    const depart = Object.fromEntries(e.leviers(NOVA).map((l) => [l.code, l.depart]));
    expect(depart).toEqual({ quantite: 1_450, kwh: 1.2, valorisee: 60 });
    const d = e.defi(NOVA);
    expect(d.solution).toEqual({ quantite: 1_500, kwh: 1.2, valorisee: 70 });
    expect([d.atteint(depart), d.atteint(d.solution)]).toEqual([false, true]);
    // 1 490 enceintes : le résultat est positif (1 490 × 21 − 31 183 = 107 €), mais 1,2 + 1 500 ÷ 1 490 dépasse 2,2 kWh.
    expect(laboratoireDurable(NOVA_GESTION, { quantite: 1_490, kwh: 1.2, valorisee: 70 }).resultat).toBe(1_490 * 21 - 31_183);
    expect(defiDurableAtteint(NOVA_GESTION, { quantite: 1_490, kwh: 1.2, valorisee: 70 })).toBe(false);
    expect(defiDurableAtteint(NOVA_GESTION, { quantite: 1_490, kwh: 1.1, valorisee: 70 })).toBe(true);
    expect(laboratoireDurable(NOVA_GESTION, d.solution).voyants.absenteisme).toBe(true);
  });
});

describe("mars, le semestre et les risques, refaits à la main", () => {
  it("mars : 3 585,60 kWh, 2,06 kWh par enceinte, 186,45 kg, 608,30 kg dont 364,98 valorisés, 1,98 % d'absentéisme, un taux de fréquence de 1 681,58", () => {
    const g = etape(ch, "le-tableau-de-mars", "a-completer").grille(NOVA);
    const heures = cent(4 * 151.67);
    expect(g.lignes.map((l) => l.cellules[0]!.valeur)).toEqual([
      cent(1_738 * 1.2 + 1_500),
      cent(3_585.6 / 1_738),
      cent(3_585.6 * 0.052),
      cent(1_738 * 0.35),
      cent(608.3 * 0.6),
      cent((12 / heures) * 100),
      cent(1_000_000 / (heures - 12)),
    ]);
    expect(juste(ch, "le-taux-de-frequence")).toEqual(["Non : un accident sur une base minuscule"]);
  });

  it("le semestre, sur les totaux : 22 030,80 kWh ÷ 10 859 = 2,03 ; 2 812,48 ÷ 3 800,65 kg = 74 % ; 1 145,60 kg pour 640 681 €", () => {
    const s = tableauDeBordDurable().semestre;
    expect([s.quantite, s.kwh, s.dechets, s.valorises, s.co2, s.chiffreDAffaires]).toEqual([10_859, 22_030.8, 3_800.65, 2_812.48, 1_145.6, 640_681]);
    expect(attendus(ch, "le-semestre")).toEqual([cent(22_030.8 / 10_859), cent((2_812.48 / 3_800.65) * 100), cent((1_145.6 / 640_681) * 1_000)]);
    expect(juste(ch, "qui-repond-de-l-energie")).toEqual(["Au chef d'atelier, en séparant chaîne et bâtiment"]);
    expect(juste(ch, "la-chaine-de-valeur")).toEqual(["Le levier était en amont, chez le fournisseur"]);
    expect(juste(ch, "traduire-la-norme").map((t) => t.replace(/\s/g, " "))).toEqual(["Le délai de paiement des fournisseurs, 22 jours"]);
    expect(juste(ch, "les-risques-de-la-mesure")).toEqual(["Le voyant s'éteindrait sans un kWh de moins"]);
    expect(juste(ch, "concevoir-le-tableau")).toEqual(["Une dizaine d'indicateurs, chacun avec cible, seuil et responsable"]);
  });
});

describe("le cas dédié : les indicateurs que demande CampusTech", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LES_INDICATEURS_QUE_DEMANDE_CAMPUSTECH);
    expect(casDuChapitre(ch.code)).toBe(LES_INDICATEURS_QUE_DEMANDE_CAMPUSTECH);
    gardeDuCas(LES_INDICATEURS_QUE_DEMANDE_CAMPUSTECH, ch);
  });

  it("le semestre : 2,03 kWh, 105,50 g, 74 %, un taux de fréquence de 1 000 000 ÷ 3 556,08 = 281,21 ; le semestre entier, pas juin", () => {
    expect(attendus(LES_INDICATEURS_QUE_DEMANDE_CAMPUSTECH, "les-indicateurs-du-semestre")).toEqual([2.03, cent((1_145.6 / 10_859) * 1000), 74, 281.21]);
    expect(cent(1_000_000 / 3_556.08)).toBeCloseTo(281.21, 2);
    const r = etape(LES_INDICATEURS_QUE_DEMANDE_CAMPUSTECH, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Le semestre entier, avec ses bases de calcul"]);
  });
});
