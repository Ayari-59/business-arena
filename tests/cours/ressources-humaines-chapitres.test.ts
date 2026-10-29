import { describe, expect, it } from "vitest";
import { EFFECTIF_ET_MASSE_SALARIALE } from "../../src/config/cours/chapitres/effectif-et-masse-salariale";
import { FORMER } from "../../src/config/cours/chapitres/former";
import { INDICATEURS_SOCIAUX } from "../../src/config/cours/chapitres/indicateurs-sociaux";
import { RECRUTER } from "../../src/config/cours/chapitres/recruter";
import { REMUNERATION_ET_MOTIVATION } from "../../src/config/cours/chapitres/remuneration-et-motivation";
import { SALAIRE_BRUT_NET_COUT } from "../../src/config/cours/chapitres/salaire-brut-net-cout";
import { compteDuLycee, exerciceDe } from "../../src/config/cours/monde/comptes-du-lycee";
import { BALANCE_AVANT_INVENTAIRE } from "../../src/config/cours/monde/exercice-de-nova";
import {
  COUT_D_UNE_MINUTE_GAGNEE_PAR_OPERATEUR,
  COUT_MAXIMAL_D_UN_POSTE,
  ENVELOPPE_DE_LA_HAUSSE,
  HEURES_D_ABSENCE,
  PLAFOND_DES_FRAIS_DE_PERSONNEL,
  SEUIL_D_ALERTE_DE_L_ABSENTEISME,
  SMIC_MENSUEL_BRUT,
  VENTES_PERDUES_ACCEPTEES,
  indicateursDeNPlus1,
  remunerationDeNPlus1,
} from "../../src/config/cours/monde/ressources-humaines-de-nova";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { EMBAUCHER_POUR_LA_SAISON, embaucheDeSaison } from "../../src/config/cours/situations/embaucher-pour-la-saison";
import { DOUBLER_LE_BUDGET_DE_FORMATION, budgetDouble } from "../../src/config/cours/situations/par-chapitre/doubler-le-budget-de-formation";
import { EMBAUCHER_UN_TRIMESTRE_PLUS_TARD, embaucheDecalee } from "../../src/config/cours/situations/par-chapitre/embaucher-un-trimestre-plus-tard";
import { L_AUGMENTATION_GENERALE, augmentationGenerale } from "../../src/config/cours/situations/par-chapitre/l-augmentation-generale";
import { L_EQUIPE_DEMANDE_UNE_AUGMENTATION, hausseDemandee } from "../../src/config/cours/situations/par-chapitre/l-equipe-demande-une-augmentation";
import { LA_MASSE_SALARIALE_QUI_BAISSE, masseQuiBaisse } from "../../src/config/cours/situations/par-chapitre/la-masse-salariale-qui-baisse";
import { LA_PRIME_DE_FIN_D_ANNEE, primeDeFinDAnnee } from "../../src/config/cours/situations/par-chapitre/la-prime-de-fin-d-annee";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre } from "../../src/config/cours/types";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * LE PARCOURS « BAC STMG · RESSOURCES HUMAINES » SUR LE MONDE DU COURS (lot M6) : SES SIX CHAPITRES
 * ET LEURS CAS, CHEZ NOVA.
 *
 * Refait à la main sur les fiches de NOVA : 4 opérateurs à 1 875 € bruts (7 500 € à eux quatre),
 * 22 % de cotisations salariales et 42 % de patronales (la paie de l'exercice et du chapitre « La
 * paie »), 127 800 € de personnel au premier exercice (les comptes 641 et 645 de la balance),
 * 1 390 276 € de ventes et 1 314 984,62 € de charges (le compte de résultat du lycée) ; en N + 1, la
 * demande de 5 800, 7 400, 6 200 et 7 800 enceintes, une ligne de 7 000 par trimestre, 600 enceintes
 * par opérateur et par mois (180 heures à 0,3 heure), 21 € de marge par enceinte, le marché à 2 000 €
 * et le seuil de démission à 95 %, le recrutement de 2 mois à 3 000 €, le départ du 31 mars.
 */

const c2 = (x: number) => Math.round(x * 100) / 100 + 0;
const SIX: readonly Chapitre[] = [EFFECTIF_ET_MASSE_SALARIALE, SALAIRE_BRUT_NET_COUT, RECRUTER, REMUNERATION_ET_MOTIVATION, FORMER, INDICATEURS_SOCIAUX];

/** La bonne réponse d'un cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation) {
  const e = etape(chapitreDuCas(s, NOVA), s.etapes.at(-1)!.id, "choix");
  const options = e.options(NOVA, VIDE);
  const bonne = options.find((o) => o.juste)!;
  expect(bonne.texte.length, `${s.code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

describe("le parcours ressources humaines du bac STMG, sur le monde du cours", () => {
  it("a ses six chapitres dans l'ordre de sa carte, au palier 1, chez NOVA seule, et ses cas leur sont dédiés", () => {
    expect(CHAPITRES.filter((c) => c.parcours === "stmg-rh").map((c) => c.titre)).toEqual(PROGRAMME["stmg-rh"][1]);
    expect(PARCOURS.find((p) => p.code === "stmg-rh")!.resume).not.toMatch(/arène/);
    for (const ch of SIX) gardeDuProgramme(ch, PROGRAMME["stmg-rh"][1]!);
    gardeDuCas(LA_PRIME_DE_FIN_D_ANNEE, SALAIRE_BRUT_NET_COUT);
    gardeDuCas(L_AUGMENTATION_GENERALE, EFFECTIF_ET_MASSE_SALARIALE);
    gardeDuCas(EMBAUCHER_UN_TRIMESTRE_PLUS_TARD, RECRUTER);
    gardeDuCas(L_EQUIPE_DEMANDE_UNE_AUGMENTATION, REMUNERATION_ET_MOTIVATION);
    gardeDuCas(DOUBLER_LE_BUDGET_DE_FORMATION, FORMER);
    gardeDuCas(LA_MASSE_SALARIALE_QUI_BAISSE, INDICATEURS_SOCIAUX);
    // Le cas de synthèse reprend deux chapitres : il se joue chez NOVA comme eux.
    expect(EMBAUCHER_POUR_LA_SAISON.reprend).toEqual(["effectif-et-masse-salariale", "salaire-brut-net-cout"]);
    gardeDuCas(EMBAUCHER_POUR_LA_SAISON, EFFECTIF_ET_MASSE_SALARIALE);
    for (const s of [LA_PRIME_DE_FIN_D_ANNEE, L_AUGMENTATION_GENERALE, EMBAUCHER_UN_TRIMESTRE_PLUS_TARD, L_EQUIPE_DEMANDE_UNE_AUGMENTATION, DOUBLER_LE_BUDGET_DE_FORMATION, LA_MASSE_SALARIALE_QUI_BAISSE, EMBAUCHER_POUR_LA_SAISON]) reponseSansIndice(s);
  });

  it("textes propres, une seule bonne réponse, notions existantes, servis par le serveur", () => {
    for (const ch of SIX) gardesDeTexte(ch);
  });

  it("la paie de NOVA est la même d'une fiche à l'autre : 7 500 € bruts, 127 800 € de personnel sur l'année, au-dessus du SMIC", () => {
    const k = compteDuLycee(exerciceDe("nova"));
    const balance = (compte: string) => BALANCE_AVANT_INVENTAIRE.find((l) => l.compte === compte)!.debit;
    expect(k.personnel).toBe(balance("641") + balance("645"));
    expect(k.personnel).toBe(12 * 7_500 * 1.42);
    expect(1_875).toBeGreaterThan(SMIC_MENSUEL_BRUT);
    // 12,02 € de l'heure, 35 heures par semaine, 52 semaines, sur 12 mois.
    expect(SMIC_MENSUEL_BRUT).toBe(c2((12.02 * 35 * 52) / 12));
  });
});

describe("du salaire brut au coût pour l'entreprise", () => {
  it("le bulletin d'un opérateur : 1 875 € bruts, 412,50 € retenus, 1 462,50 € nets, 787,50 € patronales, 2 662,50 € de coût", () => {
    expect(attendus(SALAIRE_BRUT_NET_COUT, "net")).toEqual([7_500 / 4, 1_875 * 0.22, 1_875 - 412.5]);
    expect(attendus(SALAIRE_BRUT_NET_COUT, "cout")).toEqual([1_875 * 0.42, 1_875 + 787.5, c2((2_662.5 / 1_462.5) * 100)]);
    expect(attendus(SALAIRE_BRUT_NET_COUT, "cout")[2]).toBe(182.05);
    // 100 € nets : 100 ÷ 0,78 = 128,21 € de brut, × 1,42 = 182,06 €.
    expect(juste(SALAIRE_BRUT_NET_COUT, "augmentation")).toEqual(["182,06 €"]);
  });

  it("le curseur : un poste à 2 800 € paie au plus 1 971 € bruts (2 798,82 €) ; à 1 972 €, il coûterait 2 800,24 €", () => {
    expect(COUT_MAXIMAL_D_UN_POSTE).toBe(2_800);
    gardeDuCurseur(SALAIRE_BRUT_NET_COUT, "le-brut-du-poste", 1_971);
    expect([c2(1_971 * 1.42), c2(1_972 * 1.42)]).toEqual([2_798.82, 2_800.24]);
  });

  it("le laboratoire : 75 € nets de plus coûtent 136,53 €, dans l'enveloppe de 150 € ; 100 € en coûteraient 182,06 €", () => {
    expect(ENVELOPPE_DE_LA_HAUSSE).toBe(150);
    const e = gardeDuLaboratoire(SALAIRE_BRUT_NET_COUT, "le-laboratoire-de-la-hausse");
    expect(e.defi(NOVA).solution).toEqual({ net: 75 });
    expect(c2(c2(75 / 0.78) * 1.42)).toBe(136.53);
  });
});

describe("l'effectif et la masse salariale", () => {
  it("31 950 € par salarié et par an, 127 800 € de masse salariale, 9,7 % des charges, 9,2 % des ventes, 347 569 € par salarié", () => {
    expect(attendus(EFFECTIF_ET_MASSE_SALARIALE, "masse")).toEqual([2_662.5 * 12, 31_950 * 4]);
    expect(attendus(EFFECTIF_ET_MASSE_SALARIALE, "poids")).toEqual([
      Math.round((127_800 / 1_314_984.62) * 1000) / 10,
      Math.round((127_800 / 1_390_276) * 1000) / 10,
      Math.round(1_390_276 / 4),
    ]);
    expect(attendus(EFFECTIF_ET_MASSE_SALARIALE, "poids")).toEqual([9.7, 9.2, 347_569]);
    expect(juste(EFFECTIF_ET_MASSE_SALARIALE, "embauche")).toEqual([`De ${montantEcrit(31_950)}, son coût annuel`]);
  });

  it("le curseur : avec 5 salariés, il faut 27 077 enceintes pour rester sous 10 % des ventes", () => {
    expect(PLAFOND_DES_FRAIS_DE_PERSONNEL).toBe(0.1);
    gardeDuCurseur(EFFECTIF_ET_MASSE_SALARIALE, "les-ventes-d-un-salarie-de-plus", Math.ceil((5 * 31_950) / (59 * 0.1)));
    expect(Math.ceil((5 * 31_950) / 5.9)).toBe(27_077);
  });

  it("le laboratoire : 8 % de hausse générale gardent la masse salariale sous 139 027,60 € ; 9 % la portent à 139 302 €", () => {
    const e = gardeDuLaboratoire(EFFECTIF_ET_MASSE_SALARIALE, "le-laboratoire-de-la-hausse-generale");
    expect(e.defi(NOVA).solution).toEqual({ hausse: 8 });
    expect(127_800 * 1.08).toBeLessThanOrEqual(1_390_276 * 0.1);
    expect(127_800 * 1.09).toBeGreaterThan(1_390_276 * 0.1);
  });
});

describe("recruter", () => {
  it("lancé en janvier, la recrue arrive le 1er mars : 3 000 € + 10 mois à 2 662,50 € = 29 625 €, 1 411 enceintes pour se payer", () => {
    expect(attendus(RECRUTER, "cout")).toEqual([3_000 + 10 * 2_662.5, Math.ceil(29_625 / 21)]);
    expect(attendus(RECRUTER, "cout")[1]).toBe(1_411);
  });

  it("la ligne borne le printemps et Noël : 26 000 enceintes avec ou sans recrue, l'embauche ne fait rien vendre", () => {
    const plan = 5_800 + 7_000 + 6_200 + 7_000;
    expect(attendus(RECRUTER, "l-annee")).toEqual([plan, plan, 0]);
    expect(juste(RECRUTER, "verdict")).toEqual(["Elle ne fait rien vendre : l'équipe ne limite pas les ventes"]);
  });

  it("le curseur : 1 411 enceintes font 29 631 € de marge ; 1 410, 29 610 €", () => {
    gardeDuCurseur(RECRUTER, "les-ventes-qui-paient-l-embauche", 1_411);
    expect([1_411 * 21, 1_410 * 21]).toEqual([29_631, 29_610]);
  });

  it("le laboratoire : seuls un cinquième poste et une recrue servent les 27 200 enceintes ; le poste seul en refuse 800", () => {
    const e = gardeDuLaboratoire(RECRUTER, "le-laboratoire-de-l-atelier");
    expect(e.defi(NOVA).solution).toEqual({ poste: 1, embauche: 1 });
    const refusees = (p: number, r: number) => e.lecture(NOVA, { poste: p, embauche: r }).find((l) => l.libelle === "Enceintes refusées")!.montant;
    // Le poste seul : l'équipe (7 200) borne le printemps (7 400) et Noël (7 800).
    expect([refusees(0, 0), refusees(0, 1), refusees(1, 0), refusees(1, 1)]).toEqual([1_200, 1_200, 200 + 600, 0]);
  });
});

describe("former pour être plus efficace", () => {
  it("à 16 minutes l'enceinte, 675 par mois, 8 100 par trimestre : les 800 enceintes que l'équipe refusait, 16 800 € de marge", () => {
    expect(attendus(FORMER, "gain")).toEqual([(180 * 60) / 16, 675 * 4 * 3, 200 + 600, 800 * 21]);
    expect(attendus(FORMER, "cout")).toEqual([2 * COUT_D_UNE_MINUTE_GAGNEE_PAR_OPERATEUR * 4, 16_800 - 6_000]);
    expect(juste(FORMER, "comparer")).toEqual(["Former : le même gain, pour bien moins cher"]);
  });

  it("le curseur : la marge paie le stage jusqu'à 4 200 € par opérateur", () => {
    gardeDuCurseur(FORMER, "le-prix-du-stage", 16_800 / 4);
  });

  it("le laboratoire : 16 minutes rapportent 10 800 €, plus que 17 (10 020 €) et 15 (7 800 €)", () => {
    const e = gardeDuLaboratoire(FORMER, "le-laboratoire-du-stage");
    expect(e.defi(NOVA).solution).toEqual({ minutes: 16 });
    // À 17 minutes : 635 par mois, 7 620 par trimestre, Noël refuse 180 enceintes.
    expect(Math.floor((180 * 60) / 17) * 12).toBe(7_620);
    expect((800 - 180) * 21 - 3_000).toBe(10_020);
    expect(800 * 21 - 9_000).toBe(7_800);
  });
});

describe("rémunération et motivation", () => {
  it("96,2 % du marché en N, 93,8 % en N + 1, sous le seuil : 1 900 € le gardent, 1 704 € par an, face à 24 975 € pour un départ", () => {
    expect(attendus(REMUNERATION_ET_MOTIVATION, "le-marche")).toEqual([96.2, 93.8, Math.ceil(2_000 * 0.95)]);
    // Le départ : 1 300 enceintes perdues × 21 €, 3 000 € de recrutement, 2 mois de salaire non versés.
    expect(attendus(REMUNERATION_ET_MOTIVATION, "le-cout-de-chaque-choix")).toEqual([25 * 12 * 4 * 1.42, 1_300 * 21 + 3_000 - 2 * 2_662.5]);
    expect(juste(REMUNERATION_ET_MOTIVATION, "sans-rien-changer")).toEqual(["Le départ d'un opérateur, payé sous le seuil"]);
  });

  it("le curseur : jusqu'à 366 € par mois, l'augmentation coûte moins qu'un départ", () => {
    gardeDuCurseur(REMUNERATION_ET_MOTIVATION, "jusqu-ou-augmenter", Math.floor(24_975 / (12 * 4 * 1.42)));
    expect(Math.floor(24_975 / 68.16)).toBe(366);
  });

  it("le laboratoire : 25 € par mois sans prime gardent l'équipe ; une prime de 1 000 € seule ne la garde pas", () => {
    const e = gardeDuLaboratoire(REMUNERATION_ET_MOTIVATION, "le-laboratoire-de-la-remuneration");
    expect(e.defi(NOVA).solution).toEqual({ augmentation: 25, prime: 0 });
    expect(remunerationDeNPlus1(0, 1_000).garde).toBe(false);
    expect(remunerationDeNPlus1(0, 1_000).coutDeLAnnee).toBe(c2(1_000 * 4 * 1.42 + 24_975));
  });
});

describe("les indicateurs sociaux", () => {
  it("46 mois payés : 3,83 salariés en moyenne, 26,1 % de rotation, 8 280 heures prévues, 3,5 % d'absentéisme", () => {
    expect(attendus(INDICATEURS_SOCIAUX, "rotation")).toEqual([3.83, Math.round((1 / (46 / 12)) * 1000) / 10]);
    expect(attendus(INDICATEURS_SOCIAUX, "absenteisme")).toEqual([46 * 180, Math.round((HEURES_D_ABSENCE / 8_280) * 1000) / 10]);
    expect(attendus(INDICATEURS_SOCIAUX, "absenteisme")[1]).toBe(3.5);
  });

  it("le chiffre d'affaires par salarié monte de 17,9 % au 2e trimestre, quand l'équipe fond et que 1 300 enceintes manquent", () => {
    const s = indicateursDeNPlus1();
    // Avril et mai à 3 opérateurs, juin à 3 et demi : 1 800 + 1 800 + 2 100 enceintes.
    expect(s.trimestres[1]!.ventes).toBe(5_700);
    expect(Math.round(s.trimestres[0]!.caParSalarie)).toBe((5_800 * 59) / 4);
    expect(Math.round(s.trimestres[1]!.caParSalarie)).toBe(Math.round((5_700 * 59) / (10 / 3)));
    expect(Math.round(((100_890 / 85_550) - 1) * 1000) / 10).toBe(17.9);
    expect(juste(INDICATEURS_SOCIAUX, "un-indicateur-qui-trompe")).toEqual(["Il monte parce que l'équipe a fondu, pas parce qu'elle vend mieux"]);
  });

  it("le curseur : 248 heures d'absence tiennent sous 3 % des 8 280 heures prévues", () => {
    expect(SEUIL_D_ALERTE_DE_L_ABSENTEISME).toBe(0.03);
    gardeDuCurseur(INDICATEURS_SOCIAUX, "les-absences-tolerees", Math.floor(8_280 * 0.03));
  });

  it("le laboratoire : seul un remplaçant arrivé le 1er mai garde les ventes perdues sous 1 000 enceintes (700)", () => {
    expect(VENTES_PERDUES_ACCEPTEES).toBe(1_000);
    const e = gardeDuLaboratoire(INDICATEURS_SOCIAUX, "le-laboratoire-du-remplacement");
    expect(e.defi(NOVA).solution).toEqual({ arrivee: 5 });
    // Mai : 3 opérateurs et demi ; juin : 4. Le trimestre 2 monte 1 800 + 2 100 + 2 400 = 6 300 enceintes, pour 7 000.
    expect([5, 6, 7, 8].map((a) => indicateursDeNPlus1(a).ventesPerdues)).toEqual([7_000 - 6_300, 7_000 - 5_700, 7_000 - 5_400, 7_000 - 5_400]);
  });
});

describe("les cas pratiques du parcours", () => {
  it("embaucher pour la saison : 7 987,50 € pour le trimestre de Noël, 381 enceintes à vendre, et une ligne déjà pleine", () => {
    const r = embaucheDeSaison();
    expect([r.coutDeLaSaison, r.masseAvec, r.tauxAvec, r.ventesNecessaires, r.caNecessaire]).toEqual([
      3 * 2_662.5,
      127_800 + 7_987.5,
      Math.round((135_787.5 / 1_390_276) * 1000) / 10,
      Math.ceil(7_987.5 / 21),
      381 * 59,
    ]);
    expect([r.avecLeBrut, r.avecLePrix, r.surLAnnee]).toEqual([Math.ceil((1_875 * 3) / 21), Math.ceil(7_987.5 / 59), Math.ceil(31_950 / 21)]);
    expect([r.equipeAvec, r.noel.capaciteOutil, r.enPlusANoel]).toEqual([9_000, 7_000, 0]);
  });

  it("la prime de fin d'année : 1 % de 1 390 276 € en coût, 2 447,67 € bruts et 1 909,18 € nets par opérateur", () => {
    const r = primeDeFinDAnnee(NOVA);
    expect([r.enveloppe, r.parSalarie, r.brut, r.salariales, r.net]).toEqual([13_902.76, 3_475.69, c2(3_475.69 / 1.42), c2(2_447.67 * 0.22), c2(2_447.67 - 538.49)]);
  });

  it("l'augmentation générale de 3 % : 131 634 € de masse salariale, 9,5 % des ventes", () => {
    const r = augmentationGenerale(NOVA);
    expect([r.masseApres, r.tauxApres, r.ventesNecessaires]).toEqual([127_800 * 1.03, 9.5, c2(1_390_276 * 1.03)]);
  });

  it("embaucher un trimestre plus tard : lancé en avril, 21 637,50 € au lieu de 29 625 €, et les mêmes 800 enceintes", () => {
    const k = embaucheDecalee();
    expect([k.tot.coutDeLaRecrue, k.tard.coutDeLaRecrue, k.economie]).toEqual([29_625, 3_000 + 7 * 2_662.5, 7_987.5]);
    // Arrivée le 1er juin, à moitié : avril 2 400, mai 2 400, juin 2 700 enceintes, assez pour le printemps (7 400).
    expect(k.tard.joue.trimestres[1]!.capaciteEquipe).toBe(7_500);
    expect([k.tot.enceintesDeLaRecrue, k.tard.enceintesDeLaRecrue, k.verdict]).toEqual([800, 800, "attendre"]);
  });

  it("doubler le budget de formation : 14 minutes pour 12 000 €, aucune enceinte de plus, 4 800 € au lieu de 10 800 €", () => {
    const k = budgetDouble();
    expect([k.d.minutes, k.d.cout, k.d.equipe, k.enceintesEnPlus, k.d.gain, k.f.gain, k.verdict]).toEqual([14, 4 * 750 * 4, Math.floor(10_800 / 14) * 12, 0, 16_800 - 12_000, 10_800, "garder"]);
  });

  it("l'équipe demande 10 % : 187,50 € par mois, 12 780 € par an, 103,1 % du marché", () => {
    const k = hausseDemandee();
    expect([k.augmentation, k.r.coutDeLAugmentation, k.partApres, k.sansLesPatronales]).toEqual([187.5, 187.5 * 12 * 4 * 1.42, 103.1, 187.5 * 48]);
  });

  it("la masse salariale qui baisse : 5 325 € de moins, −4,2 %, pour 27 300 € de marge perdue et 24 975 € de coût", () => {
    const k = masseQuiBaisse();
    expect([k.baisse, k.evolutionDeLaMasse, k.s.margePerdue, k.coutNet]).toEqual([2 * 2_662.5, Math.round((122_475 / 127_800 - 1) * 1000) / 10, 1_300 * 21, 27_300 + 3_000 - 5_325]);
  });
});
