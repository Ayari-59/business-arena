import { describe, expect, it } from "vitest";
import {
  explicationDeLaSolutionMontree,
  manqueDeDecimales,
  phraseDeReprise,
  remarqueDuChampRefuse,
  verdictDuRetour,
  type ChampRefuse,
} from "@/pedagogy/cours/aides-du-guide";
import { cleDeCellule, corrigerLeTableau, remarquesDuTableau, type TableauACompleter } from "@/pedagogy/cours/tableau-a-completer";
import { CHAPITRES } from "@/config/cours/registre";
import { casDeLEntreprise } from "@/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { chapitreDuCas } from "@/pedagogy/cours/deroule";
import { servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";

/**
 * LES RETOURS D'EXERCICE DISENT CE QUI S'EST PASSÉ (audit UX du 11 novembre 2026, P2-5 ; décision du
 * propriétaire du même jour) :
 *  · « Solution montrée : … » quand l'élève a demandé la solution d'un laboratoire, au lieu du texte de
 *    réussite (« Défi relevé : … ») ;
 *  · un seul « Non » devant le retour d'une option fausse ;
 *  · « valeur » au lieu de « montant » pour un taux ;
 *  · « Arrondissez à 2 décimales » quand l'écart vient de la précision (« 54,5 » pour 54,55).
 * (« Entre 0 et 100 % » sous une prévision d'épisode : tests/episodes/faits-de-la-partie.test.ts.)
 */

const montant = (libelle: string, imprecis = false): ChampRefuse => ({ libelle, nature: "montant", imprecis });
const taux = (libelle: string, imprecis = false): ChampRefuse => ({ libelle, nature: "pourcentage", imprecis });

describe("un taux n'est pas un montant, et un calcul arrêté trop tôt n'est pas un calcul faux", () => {
  it("le message dit « valeur » dès qu'un champ refusé n'est pas un montant", () => {
    expect(phraseDeReprise([taux("Taux de marque (%)")], undefined)).toBe(
      "Une valeur ne convient pas encore. Reprenez-les à partir des données de l'énoncé.",
    );
    expect(phraseDeReprise([taux("Taux de marque (%)"), montant("Prix de vente")], undefined)).toMatch(/^Des valeurs ne conviennent pas encore\./);
    expect(phraseDeReprise([montant("Prix de vente")], undefined)).toMatch(/^Un montant ne convient pas encore\./);
  });

  it("« Arrondissez à 2 décimales » quand l'écart vient de la précision, seul ou avec un calcul faux", () => {
    expect(phraseDeReprise([taux("Taux de marque (%)", true)], undefined)).toBe("Une valeur ne convient pas encore. Arrondissez à 2 décimales.");
    expect(phraseDeReprise([taux("Taux (%)", true), taux("Coefficient (%)", true)], undefined)).toBe(
      "Des valeurs ne conviennent pas encore. Arrondissez-les à 2 décimales.",
    );
    expect(phraseDeReprise([taux("Taux de marque (%)", true), montant("Prix de vente")], "tva")).toBe(
      "Des valeurs ne conviennent pas encore. Reprenez-les à partir de l'énoncé et des comptes affichés. Arrondissez à 2 décimales : Taux de marque (%).",
    );
  });

  it("le bon calcul arrêté trop tôt : moins de deux décimales, à moins d'une unité de son dernier chiffre", () => {
    const champ = { libelle: "Taux de marque (%)", attendu: 54.55 };
    // Le cas du journal de l'audit (s-variantes.log) : 54,5 ; 54,6 ; 55 pour 54,55.
    for (const t of ["54,5", "54,6", "55", "54", "54,5 %", "54.5"]) expect(manqueDeDecimales(t, champ), t).toBe(true);
    // Un calcul faux, ou écrit à deux décimales, ne l'est pas.
    for (const t of ["54,4", "53", "54,50", "54,54", "abc", "", "5,5"]) expect(manqueDeDecimales(t, champ), t).toBe(false);
    // Un attendu qui s'écrit avec aussi peu de décimales : l'écart est un calcul faux.
    expect(manqueDeDecimales("120,4", { libelle: "Coefficient (%)", attendu: 120 })).toBe(false);
    expect(manqueDeDecimales("12", { libelle: "Marge", attendu: 12.5 })).toBe(true);
    // L'autre chemin compte comme l'attendu.
    expect(manqueDeDecimales("10,8", { libelle: "Stock final", attendu: 10.79, autreChemin: 10.83 })).toBe(true);
    // Une quantité et un coefficient suivent leur propre règle.
    expect(manqueDeDecimales("12", { libelle: "Articles", attendu: 12.4, nature: "quantite" })).toBe(false);
    expect(manqueDeDecimales("0,96", { libelle: "Coefficient", attendu: 0.9568, nature: "coefficient" })).toBe(false);
  });

  it("l'enseignant lit ce qui n'allait pas, dans les mêmes mots", () => {
    expect(remarqueDuChampRefuse(montant("Prix de vente"))).toBe("Prix de vente : montant faux");
    expect(remarqueDuChampRefuse(taux("Taux de marque (%)"))).toBe("Taux de marque (%) : valeur fausse");
    expect(remarqueDuChampRefuse(taux("Taux de marque (%)", true))).toBe("Taux de marque (%) : pas assez de décimales");
  });

  it("une cellule d'un tableau à compléter le dit aussi", () => {
    const t: TableauACompleter = {
      titre: "Le loyer",
      colonnes: ["Montant", "Part"],
      lignes: [{ libelle: "Loyer", cellules: [{ valeur: 1250 }, { valeur: 54.55, saisir: true, unite: "%" }] }],
    };
    expect(corrigerLeTableau(t, { [cleDeCellule(0, 1)]: "54,55" }).juste).toBe(true);
    const imprecise = corrigerLeTableau(t, { [cleDeCellule(0, 1)]: "54,5" });
    expect(remarquesDuTableau(t, imprecise)).toEqual(["Loyer, Part : arrondissez à 2 décimales."]);
    const fausse = corrigerLeTableau(t, { [cleDeCellule(0, 1)]: "50" });
    expect(remarquesDuTableau(t, fausse).join(" ")).not.toContain("arrondissez");
  });
});

describe("un seul « Non »", () => {
  it("quand le texte de l'option dit déjà non, le « Non » en gras est le sien", () => {
    expect(verdictDuRetour(false, "Non : 100 € est ce que l'entreprise paie.")).toEqual({ verdict: "Non", suite: " : 100 € est ce que l'entreprise paie." });
    expect(verdictDuRetour(false, "Non : c'est une charge.")).toEqual({ verdict: "Non", suite: " : c'est une charge." });
    // Sinon, le verdict d'avant.
    expect(verdictDuRetour(false, "Pari à vérifier : …")).toEqual({ verdict: "Non · ", suite: "Pari à vérifier : …" });
    expect(verdictDuRetour(false, "Nonobstant la règle, …").verdict).toBe("Non · ");
    expect(verdictDuRetour(true, "Oui : 1 875 €.")).toEqual({ verdict: "Juste · ", suite: "Oui : 1 875 €." });
  });

  it("le texte affiché ne double jamais le « Non », sur toutes les options fausses du cours", () => {
    const doubles: string[] = [];
    let fausses = 0;
    for (const c of CHAPITRES) {
      const cas = casDeLEntreprise((c.entreprises?.codes ?? ENTREPRISES_DU_COURS)[0]!);
      for (const e of servirLeChapitre(c, cas).etapes) {
        if (e.type !== "choix" && e.type !== "comparaison") continue;
        for (const o of e.options) {
          if (o.juste) continue;
          fausses += 1;
          const { verdict, suite } = verdictDuRetour(false, o.retour);
          // Le début de ce que l'élève lit : « Non · Non : » serait deux fois non.
          if (/^Non\W+Non\b/u.test(`${verdict}${suite}`)) doubles.push(`${c.code} : ${verdict}${suite.slice(0, 30)}`);
        }
      }
    }
    expect(fausses).toBeGreaterThan(500);
    expect(doubles).toEqual([]);
  }, 120_000);
});

describe("« Solution montrée », pas « Défi relevé »", () => {
  it("l'ouverture du texte de réussite change, le reste non", () => {
    expect(explicationDeLaSolutionMontree(["Défi relevé : 75 € nets de plus demandent 96,15 € de brut.", "Chaque euro net coûte 1,82 €."])).toEqual([
      "Solution montrée : 75 € nets de plus demandent 96,15 € de brut.",
      "Chaque euro net coûte 1,82 €.",
    ]);
    expect(explicationDeLaSolutionMontree(["Défi relevé : à 7,50 €, la marge tient."])).toEqual(["Solution montrée : à 7,50 €, la marge tient."]);
    // « Défi relevé. » aussi, suivi d'une phrase (le contrôle de gestion dans l'organisation).
    expect(explicationDeLaSolutionMontree(["Défi relevé. Jugée sur sa marge, la responsable choisit 60 €."])).toEqual([
      "Solution montrée : jugée sur sa marge, la responsable choisit 60 €.",
    ]);
  });

  it("une explication qui commence autrement prend la même ouverture, en minuscule sauf un sigle ou un nom", () => {
    expect(explicationDeLaSolutionMontree(["À 4,25 % sur 5 ans, le crédit coûte 8 925 €."])[0]).toBe("Solution montrée : à 4,25 % sur 5 ans, le crédit coûte 8 925 €.");
    expect(explicationDeLaSolutionMontree(["L'effet net est nul."])[0]).toBe("Solution montrée : l'effet net est nul.");
    expect(explicationDeLaSolutionMontree(["NOVA paie 1 200 € de plus."])[0]).toBe("Solution montrée : NOVA paie 1 200 € de plus.");
    expect(explicationDeLaSolutionMontree(["AsiaComponents, plus loin, livre en retard."])[0]).toBe("Solution montrée : AsiaComponents, plus loin, livre en retard.");
    expect(explicationDeLaSolutionMontree([])).toEqual([]);
  });

  it("aucun laboratoire du cours, solution montrée, ne dit « Défi relevé »", () => {
    const fautes: string[] = [];
    let laboratoires = 0;
    for (const c of CHAPITRES) {
      for (const code of c.entreprises?.codes ?? ENTREPRISES_DU_COURS) {
        const cas = casDeLEntreprise(code);
        for (const e of chapitreDuCas(c, cas).etapes) {
          if (e.type !== "simulation") continue;
          laboratoires += 1;
          const montree = explicationDeLaSolutionMontree(e.explication(cas, e.defi(cas).solution));
          if (!montree[0]?.startsWith("Solution montrée : ") || /défi relevé/iu.test(montree.join(" "))) fautes.push(`${c.code} · ${code}`);
        }
      }
    }
    expect(laboratoires).toBeGreaterThan(200);
    expect(fautes).toEqual([]);
  }, 120_000);
});
