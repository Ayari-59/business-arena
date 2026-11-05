import { describe, expect, it } from "vitest";
import { ACQUERIR_ET_FINANCER_UNE_IMMOBILISATION as CH } from "../../src/config/cours/chapitres/acquerir-et-financer-une-immobilisation";
import { CABINE, CHARIOT, DATES_DE_LA_SUBVENTION, GRANDE_REVISION, MODES_DE_LA_CABINE, cabine, creditBailDuBanc, subvention } from "../../src/config/cours/monde/acquisition-et-financement";
import { exerciceDe } from "../../src/config/cours/monde/diagnostic-de-nova";
import { CREDIT_BAIL_DU_BANC } from "../../src/config/cours/monde/financement-de-la-gamme";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LA_CABINE_SUBVENTIONNEE, TAUX_D_AIDE_A_LA_CABINE, cabineSubventionnee } from "../../src/config/cours/situations/par-chapitre/la-cabine-subventionnee";
import { THEMES } from "../../src/config/cours/themes";
import type { EtapeEcriture } from "../../src/config/cours/types";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { NOVA, attendus, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { reponseSansIndice } from "./gardes-de-l-ue10";

/**
 * ACQUÉRIR ET FINANCER UNE IMMOBILISATION (BTS CG P1 1.5.2 et 1.5.6, P2 2.3.2), ET SON CAS, CHEZ NOVA
 * EN N + 1.
 *
 * Refait à la main : le chariot, 14 000 € HT, 30 % d'acompte (4 200 €), TVA 2 800 € à la livraison ;
 * la cabine, 3 800 + 140 × 32 + 1 720 = 10 000 €, 400 heures sur 5 000 en N + 1 ; la subvention,
 * 30 % de 12 000 € = 3 600 €, sur 6 ans, 359 jours en N + 1 ; le banc, 5 redevances de 6 600 € et une
 * option de 1 500 € ; la grande révision, 7 200 € sur 3 exercices.
 */

const r2 = (x: number) => Math.round(x * 100) / 100;
const ecritureDe = (id: string) => {
  const e = CH.etapes.find((x) => x.id === id);
  if (!e || e.type !== "ecriture") throw new Error(`${id} : écriture attendue`);
  return (e as EtapeEcriture).ecriture(NOVA);
};
const lignes = (id: string) => ecritureDe(id).lignes.map((l) => [l.compte, l.sens, l.montant]);

describe("le chapitre et son cas, dans leur parcours", () => {
  it("au registre, au programme de la comptabilité générale (palier 4), au thème, étiqueté BTS CG P1 et P2", () => {
    expect(CHAPITRES).toContain(CH);
    gardeDuProgramme(CH, PROGRAMME["comptabilite-generale"][4]!);
    expect(CH.parcours).toBe("comptabilite-generale");
    expect(CH.palier).toBe(4);
    expect(CH.blocs).toEqual(["BTS CG P1 · Contrôle et traitement comptable des opérations commerciales", "BTS CG P2 · Contrôle et production de l'information financière"]);
    expect(THEMES.some((t) => t.chapitres.includes(CH.code))).toBe(true);
    expect(CH.etapes.length).toBeLessThanOrEqual(20);
    expect(CH.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(CH.objectifs.length).toBeLessThanOrEqual(5);
    for (const code of [...(CH.prerequis ?? []), ...(CH.ensuite ?? [])]) expect(CHAPITRES.some((x) => x.code === code), code).toBe(true);
  });

  it("textes propres, une seule bonne réponse qui n'est jamais la plus longue, notions existantes, servis par le serveur", () => {
    gardesDeTexte(CH);
    reponseSansIndice(CH);
  });

  it("son cas lui est dédié", () => {
    gardeDuCas(LA_CABINE_SUBVENTIONNEE, CH);
    reponseSansIndice(LA_CABINE_SUBVENTIONNEE);
    expect(CAS_PAR_CHAPITRE).toContain(LA_CABINE_SUBVENTIONNEE);
  });
});

describe("les écritures, refaites à la main", () => {
  it("chaque écriture s'équilibre, sur des comptes du plan, et le correcteur accepte la correction", () => {
    for (const e of CH.etapes) {
      if (e.type !== "ecriture") continue;
      const a = e.ecriture(NOVA);
      expect(equilibree(enEcriture(a)), e.id).toBe(true);
      for (const l of a.lignes) {
        expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
        for (const x of l.acceptes ?? []) expect(compteDuPlan(x), `${e.id} : ${x}`).toBeDefined();
      }
      expect(corriger(enSaisie(a), a).juste, e.id).toBe(true);
    }
  });

  it("l'acompte : 14 000 × 30 % = 4 200 € au 238, sans TVA ; la facture l'impute : 16 800 − 4 200 = 12 600 € au 404", () => {
    expect([CHARIOT.ht, CHARIOT.tauxDAcompte]).toEqual([14_000, 0.3]);
    expect(lignes("l-acompte")).toEqual([
      ["238", "debit", 4_200],
      ["512", "credit", 4_200],
    ]);
    expect(juste(CH, "la-tva-de-l-acompte")).toEqual(["Pour un bien, la TVA est due à la livraison"]);
    expect(lignes("la-facture-du-chariot")).toEqual([
      ["2154", "debit", 14_000],
      ["44562", "debit", 2_800],
      ["238", "credit", 4_200],
      ["404", "credit", 16_800 - 4_200],
    ]);
  });

  it("la cabine : 3 800 + 4 480 + 1 720 = 10 000 € de coût de production, au 2181 contre le 722", () => {
    expect(attendus(CH, "le-cout-de-production")).toEqual([140 * 32, 3_800 + 140 * 32 + 1_720]);
    expect(lignes("la-production-immobilisee")).toEqual([
      ["2181", "debit", 10_000],
      ["722", "credit", 10_000],
    ]);
    expect(juste(CH, "predire-la-production")).toEqual(["Retrouve ce qu'il serait sans la cabine"]);
  });

  it("la subvention : 3 600 € accordés (441 / 131), versés (512 / 441) ; 600 × 359 ÷ 360 = 598,33 € repris (139 / 777)", () => {
    expect(DATES_DE_LA_SUBVENTION).toEqual({ octroi: "2 janvier N + 1", versement: "15 mars N + 1" });
    expect(lignes("l-octroi-de-la-subvention")).toEqual([
      ["441", "debit", 3_600],
      ["131", "credit", 3_600],
    ]);
    expect(lignes("le-versement-de-la-subvention")).toEqual([
      ["512", "debit", 3_600],
      ["441", "credit", 3_600],
    ]);
    const qp = r2((3_600 / 6) * (359 / 360));
    expect(qp).toBe(598.33);
    expect(attendus(CH, "la-quote-part")).toEqual([600, qp, r2(3_600 - qp), r2(r2((12_000 / 6) * (359 / 360)) - qp)]);
    expect(lignes("la-reprise-au-journal")).toEqual([
      ["139", "debit", qp],
      ["777", "credit", qp],
    ]);
  });

  it("le crédit-bail : 6 600 € HT et 1 320 € de TVA le 31 décembre N + 1 ; 4 × 6 600 + 1 500 = 27 900 € hors bilan", () => {
    expect(lignes("la-redevance")).toEqual([
      ["6122", "debit", 6_600],
      ["44566", "debit", 1_320],
      ["512", "credit", 7_920],
    ]);
    expect(attendus(CH, "l-engagement-hors-bilan")).toEqual([4 * 6_600, 4 * 6_600 + 1_500]);
  });

  it("la grande révision : 7 200 ÷ 3 = 2 400 € au 6815 et au 1572", () => {
    expect(GRANDE_REVISION).toMatchObject({ devis: 7_200, exercices: 3 });
    expect(lignes("la-provision-pour-gros-entretien")).toEqual([
      ["6815", "debit", 2_400],
      ["1572", "credit", 2_400],
    ]);
  });
});

describe("les unités d'œuvre, refaites à la main", () => {
  it("N + 1 : 10 000 × 400 ÷ 5 000 = 800 €, plus que le linéaire, 10 000 ÷ 5 × 90 ÷ 360 = 500 €", () => {
    expect(attendus(CH, "le-plan-en-unites")).toEqual([800, 9_200, 4_600]);
    expect(cabine().dotationLineaire).toBe(500);
    expect(juste(CH, "predire-les-unites")).toEqual(["Plus forte, car elle a beaucoup servi"]);
  });

  it("le plan modifié : 9 200 × 1 800 ÷ 5 400 = 3 066,67 € au lieu de 9 200 × 1 800 ÷ 4 600 = 3 600 €", () => {
    expect(attendus(CH, "le-plan-modifie")).toEqual([r2((9_200 * 1_800) / 5_400), r2((9_200 * 1_800) / 4_600), r2(r2((9_200 * 1_800) / 4_600) - r2((9_200 * 1_800) / 5_400))]);
  });

  it("le laboratoire : la seule position qui relève le défi est en unités d'œuvre, à 250 heures (10 000 × 250 ÷ 5 000 = 500 €)", () => {
    const e = gardeDuLaboratoire(CH, "le-laboratoire-de-la-cabine");
    expect(e.defi(NOVA).solution).toEqual({ mode: MODES_DE_LA_CABINE.unites, heures: 250 });
    expect(e.graphique).toBeDefined();
    expect(e.leviers(NOVA).some((l) => l.choix)).toBe(true);
  });
});

describe("une seule NOVA", () => {
  it("la subvention et sa quote-part de N + 1 sont celles du diagnostic de trois exercices", () => {
    const s = subvention();
    const n1 = exerciceDe("N+1");
    expect(n1.subventionRecue).toBe(s.montant);
    expect(n1.quotePartDeSubvention).toBe(s.quotePart);
    expect(n1.subventionAuBilan).toBe(s.resteAuBilan);
  });

  it("le banc est celui du cas « Le banc en crédit-bail », au même contrat", () => {
    const b = creditBailDuBanc();
    expect([b.valeur, b.redevance, b.dureeAns, b.option]).toEqual([CREDIT_BAIL_DU_BANC.valeur, CREDIT_BAIL_DU_BANC.redevance, CREDIT_BAIL_DU_BANC.dureeAns, CREDIT_BAIL_DU_BANC.option]);
  });
});

describe("le cas : la cabine subventionnée", () => {
  it("40 % de 10 000 € = 4 000 € ; 4 000 × 800 ÷ 10 000 = 320 € en N + 1 ; 4 000 × 3 066,67 ÷ 10 000 = 1 226,67 € en N + 2", () => {
    expect(TAUX_D_AIDE_A_LA_CABINE).toBe(0.4);
    const k = cabineSubventionnee();
    expect([k.aide, k.quotePartN1, k.resteFinN1, k.chargeNetteN1, k.quotePartN2]).toEqual([4_000, 320, 3_680, 480, r2((4_000 * r2((9_200 * 1_800) / 5_400)) / 10_000)]);
    expect(CABINE.heuresDeNPlus1).toBe(400);
  });
});
