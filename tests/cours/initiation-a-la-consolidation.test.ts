import { describe, expect, it } from "vitest";
import { INITIATION_A_LA_CONSOLIDATION as CH, plusPetitInteretControlant } from "../../src/config/cours/chapitres/initiation-a-la-consolidation";
import { exerciceDe } from "../../src/config/cours/monde/diagnostic-de-nova";
import { AUDIO_COMPTOIR, NOVA_DIFFUSION, PART_DE_NOVA, PRET_A_LA_FILIALE, VENTES_A_LA_FILIALE, groupeNova, pourcentages } from "../../src/config/cours/monde/groupe-nova";
import { PRIX_DE_L_ENCEINTE } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LE_DIRECTEUR_VEUT_PLUS_D_ACTIONS, PART_DEMANDEE_PAR_LE_DIRECTEUR, directeurAvecPlusDActions } from "../../src/config/cours/situations/par-chapitre/le-directeur-veut-plus-d-actions";
import { THEMES } from "../../src/config/cours/themes";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { NOVA, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { reponseSansIndice } from "./gardes-de-l-ue10";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";

/**
 * INITIATION À LA CONSOLIDATION (BTS CG P2 2.7.1 et 2.7.2), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : NOVA DIFFUSION, 1 000 actions de 10 €, 80 % à NOVA ; 1 200 One achetées à 59 €
 * (70 800 €), revendues 79 € (94 800 €) ; 8 500 € de charges externes, 9 300 € de personnel ; le prêt
 * de 12 000 € à 4 % sur 6 mois (240 €) ; l'impôt à 15 % ; la dernière livraison, 100 One, due toutes
 * taxes comprises ; AUDIO COMPTOIR à 60 % par la filiale.
 */

const r2 = (x: number) => Math.round(x * 100) / 100;
const avantImpot = 94_800 - 70_800 - 8_500 - 9_300 - 240;
const resultat = r2(avantImpot - avantImpot * 0.15);

describe("le chapitre et son cas, dans leur parcours", () => {
  it("au registre, au programme de la comptabilité générale (palier 4), au thème, étiqueté BTS CG P2", () => {
    expect(CHAPITRES).toContain(CH);
    gardeDuProgramme(CH, PROGRAMME["comptabilite-generale"][4]!);
    expect(CH.palier).toBe(4);
    expect(CH.blocs).toEqual(["BTS CG P2 · Contrôle et production de l'information financière"]);
    expect(THEMES.some((t) => t.chapitres.includes(CH.code))).toBe(true);
    expect(CH.etapes.length).toBeLessThanOrEqual(20);
    for (const code of [...(CH.prerequis ?? []), ...(CH.ensuite ?? [])]) expect(CHAPITRES.some((x) => x.code === code), code).toBe(true);
  });

  it("textes propres, une seule bonne réponse qui n'est jamais la plus longue, notions existantes, servis par le serveur", () => {
    gardesDeTexte(CH);
    reponseSansIndice(CH);
  });

  it("son cas lui est dédié", () => {
    gardeDuCas(LE_DIRECTEUR_VEUT_PLUS_D_ACTIONS, CH);
    reponseSansIndice(LE_DIRECTEUR_VEUT_PLUS_D_ACTIONS);
    expect(CAS_PAR_CHAPITRE).toContain(LE_DIRECTEUR_VEUT_PLUS_D_ACTIONS);
  });
});

describe("le groupe, refait à la main", () => {
  it("les hypothèses de la filiale sont des constantes nommées", () => {
    expect(NOVA_DIFFUSION).toMatchObject({ forme: "SAS", actions: 1_000, nominal: 10 });
    expect([PART_DE_NOVA, AUDIO_COMPTOIR.partDeLaFiliale]).toEqual([0.8, 0.6]);
    expect(PRET_A_LA_FILIALE).toEqual({ montant: 12_000, taux: 0.04, mois: 6 });
    expect(VENTES_A_LA_FILIALE).toEqual({ enceintes: 1_200, prixDeRevente: 79, enceintesDeLaDerniereLivraison: 100 });
    expect(PRIX_DE_L_ENCEINTE).toBe(59);
  });

  it("les comptes de la filiale : 5 960 € avant impôt, 894 € d'impôt, 5 066 € de résultat ; le bilan s'équilibre", () => {
    const g = groupeNova();
    expect([g.avantImpot, g.impot, g.resultat]).toEqual([avantImpot, r2(avantImpot * 0.15), resultat]);
    expect(resultat).toBe(5_066);
    expect(g.totalDuBilan).toBe(r2(10_000 + 5_066 + 12_000 + 7_080 + 894));
    expect(r2(g.clients + g.banque)).toBe(g.totalDuBilan);
  });

  it("le tri : deux contrôles exclusifs, un conjoint, une influence notable, un hors périmètre", () => {
    expect(Object.values(triDe(CH, "les-types-de-controle"))).toEqual(["exclusif", "exclusif", "conjoint", "notable", "hors"]);
    expect(juste(CH, "la-methode")).toEqual(["L'intégration globale de ses comptes"]);
    expect(juste(CH, "pourquoi-consolider")).toEqual([`Par ses titres, à leur coût : ${montantEcrit(8_000)}`]);
  });

  it("les pourcentages : 80 % et 80 % dans la filiale ; 60 % de contrôle et 80 × 60 = 48 % d'intérêts dans la boutique", () => {
    expect(attendus(CH, "les-pourcentages")).toEqual([80, 80, 60, 48]);
    // Sans le contrôle de la filiale, le contrôle de la boutique ne passe pas.
    expect(pourcentages(0.5, 0.6).controleIndirect).toBe(0);
  });

  it("le laboratoire : le contrôle avec le moins d'intérêts, 55 % × 55 % = 30,25 %, la seule position", () => {
    expect(plusPetitInteretControlant()).toEqual({ nova: 55, filiale: 55, interets: 0.3025 });
    const e = gardeDuLaboratoire(CH, "le-laboratoire-des-pourcentages");
    expect(e.defi(NOVA).solution).toEqual({ nova: 55, filiale: 55 });
  });

  it("les opérations réciproques : 70 800 €, 100 × 59 × 1,2 = 7 080 €, 12 000 €, 12 000 × 4 % × 6 ÷ 12 = 240 €", () => {
    expect(attendus(CH, "les-operations-reciproques")).toEqual([1_200 * 59, r2(100 * 59 * 1.2), 12_000, 240]);
    expect(juste(CH, "le-resultat-du-groupe")).toEqual(["Non, chaque élimination ôte autant des deux côtés"]);
  });

  it("le chiffre d'affaires du groupe : celui de NOVA au diagnostic de N + 1, plus 94 800 €, moins 70 800 €", () => {
    const ca = exerciceDe("N+1").production;
    expect(attendus(CH, "le-chiffre-d-affaires-du-groupe")).toEqual([r2(ca + 94_800), r2(ca + 94_800 - 70_800)]);
  });

  it("le partage : 8 000 et 2 000 € du capital, 4 052,80 et 1 013,20 € du résultat ; le tableau se tient", () => {
    const t = etape(chapitreDuCas(CH, NOVA), "le-partage-des-capitaux-propres", "a-completer").grille(NOVA);
    expect(incoherencesDuTableau(t)).toEqual([]);
    expect(t.lignes.map((l) => l.cellules.map((x) => x.valeur))).toEqual([
      [8_000, 2_000, 10_000],
      [r2(resultat * 0.8), r2(resultat - r2(resultat * 0.8)), resultat],
      [r2((10_000 + resultat) * 0.8), r2(10_000 + resultat - r2((10_000 + resultat) * 0.8)), 10_000 + resultat],
    ]);
    expect(attendus(CH, "l-elimination-des-titres")).toEqual([8_000, 8_000, 0, r2(2_000 + 1_013.2)]);
    expect(juste(CH, "ce-qui-change")).toEqual(["Il disparaît, avec l'emprunt de la filiale"]);
  });
});

describe("le cas : le directeur veut plus d'actions", () => {
  it("à 70 %, le contrôle reste : 60 % de contrôle, 70 × 60 = 42 % d'intérêts dans la boutique, 30 % de 15 066 € aux minoritaires", () => {
    expect(PART_DEMANDEE_PAR_LE_DIRECTEUR).toBe(0.3);
    const k = directeurAvecPlusDActions();
    expect([k.part, k.p.controleIndirect, k.p.interetsIndirects, k.minoritaires]).toEqual([0.7, 0.6, 0.42, r2(15_066 * 0.3)]);
  });
});
