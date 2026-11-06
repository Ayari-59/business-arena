import { describe, expect, it } from "vitest";
import { enquetesDuChapitre } from "../../src/config/cours/enquetes";
import { LA_REVISION_DE_L_ASSISTANT as e, grilleDuResultatRevise } from "../../src/config/cours/enquetes/la-revision-de-l-assistant";
import type { EtapeDeClassement, EtapeDeRectification } from "../../src/config/cours/bureaux/types";
import { EXERCICE_N1_DE_NOVA } from "../../src/config/cours/monde/projets-et-financement";
import { ERREURS_DE_L_ASSISTANT, effetSurLeResultat, resultatDeLAssistant, revisionDeLAssistant } from "../../src/config/cours/monde/revision-de-l-assistant";
import { verifierUnBureau } from "../helpers/activites-du-cours";

/**
 * L'ENQUÊTE DE LA RÉVISION DE L'ASSISTANT (monde/revision-de-l-assistant.ts,
 * enquetes/la-revision-de-l-assistant.ts). Chaque chiffre de l'assistant refait à la main depuis le
 * dossier de révision du cours ; le résultat corrigé est celui de « L'impôt sur les sociétés » (une seule
 * NOVA) ; puis la forme, le service et la langue.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const d = revisionDeLAssistant();
const r = resultatDeLAssistant();
const de = (code: string) => d.find((x) => x.code === code)!;

describe("le dossier de l'assistant, chaque chiffre à la main", () => {
  it("sept écritures, deux justes, cinq erreurs de natures différentes", () => {
    expect(d).toHaveLength(7);
    expect(d.filter((x) => !x.erreur).map((x) => x.code)).toEqual(["frais", "amende"]);
    expect(new Set(Object.values(ERREURS_DE_L_ASSISTANT)).size).toBe(5);
  });

  it("chaque erreur, chiffrée", () => {
    // L'acompte de 3 600 € pris pour une vente toutes taxes comprises : 3 000 € de ventes, 600 € de TVA.
    expect(de("acompte").assistant.map((l) => l.credit)).toEqual([0, 3_000, 600]);
    // Les congés : le dixième du brut de l'année (111 561,50 €), au lieu de juin à décembre (69 011,50 €).
    expect(de("conges").assistant[0]!.debit).toBe(c(111_561.5 * 0.1));
    expect(de("conges").juste[0]!.debit).toBe(c(69_011.5 * 0.1));
    expect(de("conges").juste[1]!.debit).toBe(c(6_901.15 * 0.42));
    // Le forfait social : 20 % de 6 000 €, qui n'est pas dû.
    expect(de("participation").assistant[1]).toEqual({ compte: "645", debit: 1_200, credit: 0 });
    // Les batteries : 500 × 6 € de coût, au lieu de 500 × (6 − 1,20) €.
    expect([de("batteries").assistant[0]!.debit, de("batteries").juste[0]!.debit]).toEqual([3_000, 2_400]);
    // La garantie : 26 000 × 3,5 % × 20 % = 182 défauts livrés, la moitié à venir, 100 € chacun.
    expect([de("garantie").assistant[0]!.debit, de("garantie").juste[0]!.debit]).toEqual([18_200, 9_100]);
  });

  it("le résultat annoncé, et le résultat révisé : 118 460 €, celui de l'impôt", () => {
    expect(r.ecarts.map((x) => x.ecart)).toEqual([-3_000, 0, c(11_156.15 - 6_901.15 + c(11_156.15 * 0.42) - 2_898.48), 1_200, 0, 600, 9_100]);
    expect(r.corrige).toBe(118_460);
    expect(r.corrige).toBe(EXERCICE_N1_DE_NOVA.resultatComptable);
    expect(r.annonce).toBe(c(r.provisoire + d.reduce((t, x) => t + effetSurLeResultat(x.assistant), 0)));
    expect(grilleDuResultatRevise().lignes.map((l) => l.cellules[0]!.valeur)).toEqual([r.annonce, r.correction, 118_460]);
  });

  it("le tri et la rectification suivent le dossier", () => {
    const tri = e.etapes.find((x) => x.id === "le-tri") as EtapeDeClassement;
    expect(tri.elements.filter((x) => x.categorie === "fausse").map((x) => x.code)).toEqual(Object.keys(ERREURS_DE_L_ASSISTANT));
    const rect = e.etapes.find((x) => x.id === "les-rectifications") as EtapeDeRectification;
    for (const x of rect.ecritures) expect(x.raison, x.id).toBe(ERREURS_DE_L_ASSISTANT[x.id as keyof typeof ERREURS_DE_L_ASSISTANT]);
  });
});

describe("la forme, le service et la langue", () => {
  it("une enquête de 6 à 10 écritures, que le chapitre ouvre", () => {
    verifierUnBureau(e, { pieces: [8, 12], etapes: [3, 4] });
    expect(enquetesDuChapitre("le-dossier-de-revision").map((y) => y.code)).toContain(e.code);
  });
});
