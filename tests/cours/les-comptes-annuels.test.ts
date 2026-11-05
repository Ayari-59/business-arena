import { describe, expect, it } from "vitest";
import {
  LES_COMPTES_ANNUELS,
  grilleDesEcheances,
  grilleDesImmobilisations,
  grilleDuBilan,
  grilleDuCompteDeResultat,
} from "../../src/config/cours/chapitres/les-comptes-annuels";
import { annexe, comptesAnnuels, optionsComptables, optionsDuMoindreImpot, situationIntermediaire, tailleDeNova } from "../../src/config/cours/monde/comptes-annuels";
import { CLOTURE_DE_LA_FICHE } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LA_SITUATION_DE_SEPTEMBRE, situationDeSeptembre } from "../../src/config/cours/situations/par-chapitre/la-situation-de-septembre";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";

/**
 * LES COMPTES ANNUELS DE N DE NOVA, refaits à la main sur la clôture figée : 1 390 276 € de ventes,
 * 1 290 113,11 € de charges d'exploitation, 100 162,89 € de résultat d'exploitation, −194,93 € de
 * financier, 20 742 € d'impôt, 79 225,96 € de bénéfice ; un bilan de 432 256,34 €. La situation au
 * 30 juin N : 10 859 enceintes vendues (8 939 aux particuliers, 1 920 à CampusTech) à 59 €, et les
 * douzièmes de la dotation, des intérêts de l'emprunt et du compte à terme.
 */

const ch = LES_COMPTES_ANNUELS;
const c = (v: number) => Math.round(v * 100) / 100 + 0;

describe("les comptes annuels : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
  }, 60_000);

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le BTS CG P2", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    const programme = PROGRAMME["comptabilite-generale"][4]!;
    expect(programme[programme.indexOf(ch.titre) - 1]).toBe("Les capitaux propres : constituer, augmenter, affecter");
    expect(ch.blocs).toEqual(["BTS CG P2 · Contrôle et production de l'information financière"]);
    expect(THEMES.find((t) => t.code === "comptabilite")!.chapitres).toContain(ch.code);
    for (const code of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.some((x) => x.code === code), code).toBe(true);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const i of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LA_SITUATION_DE_SEPTEMBRE]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("le compte de résultat et le bilan, sans toucher la fiche figée", () => {
  it("les résultats sont ceux de la clôture : exploitation, courant, net", () => {
    const r = comptesAnnuels().resultat;
    const s = CLOTURE_DE_LA_FICHE.soldes;
    expect(r.resultatDExploitation).toBe(s.resultatDExploitation);
    expect(r.resultatFinancier).toBe(s.resultatFinancier);
    expect(r.resultatCourant).toBe(s.resultatCourantAvantImpot);
    expect(r.impot).toBe(CLOTURE_DE_LA_FICHE.impot);
    expect(r.resultatNet).toBe(CLOTURE_DE_LA_FICHE.resultatNet);
    expect(r.chargesExternes).toBe(377_744 + 236_400 + 1_500);
    expect(r.chargesFinancieres).toBe(c(3_681.11 + 448.4));
    expect(comptesAnnuels().bilan.totalActif).toBe(CLOTURE_DE_LA_FICHE.totalDuBilan);
  });

  it("les deux grilles tiennent leurs totaux", () => {
    for (const g of [grilleDuCompteDeResultat(), grilleDuBilan(), grilleDesImmobilisations(), grilleDesEcheances()]) expect(incoherencesDuTableau(g), g.titre).toEqual([]);
  });

  it("NOVA ne dépasse qu'un seuil des micro-entreprises (le chiffre d'affaires) : elle peut se passer d'annexe", () => {
    const t = tailleDeNova();
    expect([t.bilan, t.chiffreDAffaires, t.effectif]).toEqual([432_256.34, 1_390_276, 4]);
    expect([t.depassesMicro, t.micro, t.petite]).toEqual([1, true, true]);
    expect(juste(ch, "quel-systeme-pour-nova")).toEqual(["Se dispenser d'annexe et demander la confidentialité"]);
  });
});

describe("l'annexe", () => {
  it("immobilisations 60 000 €, amortissements 9 861,11 €, provision 5 000 €, dépréciation 11 210 €", () => {
    const x = annexe();
    expect([x.immobilisations.fin, x.amortissements.fin, x.provisionPourLitige.fin, x.depreciationDesCreances.fin]).toEqual([60_000, 9_861.11, 5_000, 11_210]);
  });

  it("l'emprunt : 4 échéances de 4 000 € et 831,11 € d'intérêts courus à un an, 52 000 € au-delà", () => {
    const x = annexe();
    expect([x.echeancesDeN1, x.capitalAUnAn, x.interetsCourus, x.empruntAUnAn, x.empruntAPlusDUnAn]).toEqual([4, 16_000, 831.11, 16_831.11, 52_000]);
    expect(c(x.empruntAUnAn + x.empruntAPlusDUnAn)).toBe(comptesAnnuels().bilan.passif.emprunts);
  });

  it("le tri range les méthodes, les compléments et l'engagement du bail", () => {
    const t = triDe(ch, "les-informations-de-l-annexe");
    expect(Object.values(t).filter((x) => x === "regle")).toHaveLength(3);
    expect(Object.values(t).filter((x) => x === "complement")).toHaveLength(2);
    expect(Object.values(t).filter((x) => x === "engagement")).toHaveLength(1);
  });
});

describe("les options comptables", () => {
  it("le dégressif et le coût moyen de la période font le moins d'impôt : 18 832 € contre 20 742 €", () => {
    expect(optionsDuMoindreImpot()).toEqual([{ mode: 2, methode: 1, impot: 18_832 }]);
    expect(optionsComptables(1, 1).impot).toBe(20_742);
    expect(optionsComptables(2, 1).dotation).toBe(17_500);
    expect(optionsComptables(1, 3).stock).toBe(13_800);
    gardeDuLaboratoire(ch, "le-laboratoire-des-options");
    expect(juste(ch, "le-conseil")).toEqual(["Choisir une fois, puis s'y tenir"]);
  });
});

describe("la situation au 30 juin, par l'abonnement", () => {
  it("les flux : 640 681 € de ventes, 238 898 € de composants ; les douzièmes : 4 930,56 €, 1 840,56 €, 1 967,29 €", () => {
    const s = situationIntermediaire(6);
    expect(s.ventes).toBe((8_939 + 1_920) * 59);
    expect(s.achats).toBe(10_859 * 22);
    expect(s.chargesExternes).toBe(10_859 * 16 + 6 * 19_700);
    expect([s.salaires, s.chargesSociales]).toEqual([45_000, 18_900]);
    expect(attendus(ch, "l-abonnement")).toEqual([4_930.56, 1_840.56, 1_967.29]);
  });

  it("le résultat du semestre, 41 135,17 € avant impôt, n'est pas la moitié de l'année", () => {
    expect(attendus(ch, "le-resultat-du-semestre")).toEqual([41_008.44, 126.73, 41_135.17]);
    expect(situationIntermediaire(6).auProrata).toBe(c(99_967.96 / 2));
    expect(juste(ch, "le-semestre-n-est-pas-la-moitie")).toEqual(["L'activité n'est pas régulière"]);
  });
});

describe("le cas dédié : la situation de septembre", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LA_SITUATION_DE_SEPTEMBRE);
    gardeDuCas(LA_SITUATION_DE_SEPTEMBRE, ch);
  });

  it("9 mois, Sonora et son escompte compris : 68 064,88 € avant impôt ; la règle de trois en ferait 90 753,17 €", () => {
    const n = situationDeSeptembre();
    expect(n.s.ventes).toBe(c(982_291));
    expect(n.s.escompte).toBe(448.4);
    const montants = (id: string) => etape(chapitreDuCas(LA_SITUATION_DE_SEPTEMBRE, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("les-douziemes")).toEqual([7_395.83, 2_760.83, 2_950.94]);
    expect(montants("le-resultat")).toEqual([68_323.17, -258.29, 68_064.88]);
    expect(n.regleDeTrois).toBe(c((68_064.88 * 12) / 9));
    const r = etape(LA_SITUATION_DE_SEPTEMBRE, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Non : la fin d'année n'est pas comme le début"]);
  });
});
