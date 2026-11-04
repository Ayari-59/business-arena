import { describe, expect, it } from "vitest";
import {
  EVALUER_UN_INVESTISSEMENT_DURABLE,
  SOLUTION_DE_LA_TRANSITION,
  laboratoireDeLaTransition,
} from "../../src/config/cours/chapitres/evaluer-un-investissement-durable";
import { LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS } from "../../src/config/cours/chapitres/le-tri-et-le-choix-entre-deux-projets";
import { exerciceDe } from "../../src/config/cours/monde/diagnostic-de-nova";
import { fluxDuProjet, van } from "../../src/config/cours/monde/finance";
import { EQUIPEMENTS_D_EFFICACITE, SUBVENTION_DE_L_EFFICACITE, TAUX_DU_PROJET_VERT, deuxDevisDeChauffage, deuxProjetsDurables } from "../../src/config/cours/monde/investissement-durable";
import { PROJET_LIGNE_MANUELLE, PROJET_LIGNE_SEMI_AUTOMATIQUE } from "../../src/config/cours/monde/projets-et-financement";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { DEUX_DEVIS_POUR_CHAUFFER_L_ATELIER } from "../../src/config/cours/situations/par-chapitre/deux-devis-pour-chauffer-l-atelier";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * ÉVALUER UN INVESTISSEMENT DURABLE (DCG UE6, 2.4), refait à la main : les projets A et B du chapitre
 * « Le TRI et le choix entre deux projets », les équipements d'efficacité (12 000 €, 30 % de
 * subvention, 8 000 kWh par an), la hausse attendue de l'électricité (0,10 € par kWh), le prêt vert
 * (60 % à 3 % au lieu de 5 %), l'impôt à 25 % et le coût du capital à 9 %.
 */

const ch = EVALUER_UN_INVESTISSEMENT_DURABLE;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
/** Une VAN à la main : la somme des flux actualisés, au centime. */
const vanALaMain = (flux: readonly number[], r: number) => c(flux.reduce((s, f, k) => s + f / (1 + r) ** k, 0));

describe("l'investissement durable : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(PROGRAMME["comptabilite-generale"][4]!).toContain(ch.titre);
    expect([ch.parcours, ch.palier]).toEqual(["comptabilite-generale", 4]);
    expect(ch.blocs).toEqual(["DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["la-valeur-actuelle-nette", LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS.code]);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const i of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true);
  });

  it("« Le TRI et le choix entre deux projets » y mène, par « Et ensuite »", () => {
    expect(suitesDuChapitre(LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS.code).ensuite).toEqual([{ code: ch.code, titre: ch.titre }]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, DEUX_DEVIS_POUR_CHAUFFER_L_ATELIER]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("les flux et les taux, refaits à la main", () => {
  it("A et B sont les projets du chapitre sur le TRI : 58 847,24 € et 68 397,29 € de VAN à 9 %", () => {
    const x = deuxProjetsDurables();
    expect(x.vanDeA).toBe(van(fluxDuProjet(PROJET_LIGNE_MANUELLE).flux, 0.09));
    expect(x.vanDeB).toBe(van(fluxDuProjet(PROJET_LIGNE_SEMI_AUTOMATIQUE).flux, 0.09));
    expect([x.vanDeA, x.vanDeB]).toEqual([58_847.24, 68_397.29]);
  });

  it("l'efficacité : −8 400 € à la date 0, 2 150 € par an, 3 400 € la dernière année ; 775,16 € de VAN", () => {
    const annuel = c(8_000 * (0.2 + 0.1) * 0.75 + (12_000 / 6) * 0.25 - (3_600 / 6) * 0.25);
    expect(annuel).toBe(2_150);
    // La revente : 60 % de 2 000 € de valeur nette, et l'impôt économisé sur la moins-value ; l'impôt sur le sixième de subvention restant.
    const derniere = annuel + (1_200 + 800 * 0.25) - 600 * 0.25;
    const flux = [-12_000 + 3_600, annuel, annuel, annuel, annuel, derniere];
    expect(attendus(ch, "les-flux-de-l-efficacite")).toEqual([-8_400, 2_150, 3_400, vanALaMain(flux, 0.09)]);
    expect(vanALaMain(flux, 0.09)).toBe(775.16);
    expect(juste(ch, "predire-l-efficacite")).toEqual(["Proche de zéro"]);
  });

  it("le risque de B : 20 000 kWh × 0,10 € = 2 000 €, 1 500 € après impôt ; VAN de B, 62 562,81 €", () => {
    const risque = vanALaMain([0, -1_500, -1_500, -1_500, -1_500, -1_500], 0.09);
    expect(attendus(ch, "le-risque-de-b")).toEqual([2_000, 1_500, risque, c(68_397.29 + risque)]);
  });

  it("le taux vert : 9 % − 60 % × 2 % × 75 % = 8,1 % ; A durable, 65 694,39 €, passe devant B", () => {
    expect(TAUX_DU_PROJET_VERT).toBe(0.081);
    const x = deuxProjetsDurables();
    expect(x.aDurable).toEqual(fluxDuProjet(PROJET_LIGNE_MANUELLE).flux.map((f, k) => c(f + x.efficacite.flux[k]!)));
    expect(attendus(ch, "le-taux-vert")).toEqual([8.1, vanALaMain(x.aDurable, 0.081)]);
    expect(x.vanDeADurable).toBeGreaterThan(x.vanDeBAvecLeRisque);
    expect(x.vanDeADurableA9).toBeLessThan(x.vanDeBAvecLeRisque);
  });

  it("le tri : les montants dans les flux, le prêt vert dans le taux", () => {
    const t = triDe(ch, "flux-ou-taux");
    expect(t["La subvention de l'efficacité énergétique"]).toBe("flux");
    expect(t["La hausse attendue que B subit chaque année"]).toBe("flux");
    expect(t["Les intérêts que le prêt vert épargne la première année"]).toBe("taux");
  });

  it("les critères extra-financiers : 28 000 kWh par an, 7,28 t de CO2 en cinq ans, 10,71 % d'investissement aligné", () => {
    expect(attendus(ch, "les-criteres-extra-financiers")).toEqual([28_000, c((28_000 * 0.052 * 5) / 1_000), c((12_000 / 112_000) * 100)]);
  });
});

describe("le laboratoire : sans aide ni prêt vert, il faut 0,18 € de hausse attendue", () => {
  it("à 0,17 €, B garde l'avance ; à 0,18 €, A durable passe devant ; la solution relève le défi", () => {
    const a17 = laboratoireDeLaTransition({ hausse: 0.17, subvention: 0, tauxVert: 5 });
    const a18 = laboratoireDeLaTransition(SOLUTION_DE_LA_TRANSITION);
    expect(a17.tauxVert).toBe(0.09);
    expect(a17.vanDeADurable).toBeLessThan(a17.vanDeBAvecLeRisque);
    expect(a18.vanDeADurable).toBeGreaterThanOrEqual(a18.vanDeBAvecLeRisque);
    expect(juste(ch, "predire-sans-aide")).toEqual(["Non : B repasserait devant"]);
    const e = gardeDuLaboratoire(chapitreDuCas(ch, NOVA), "le-laboratoire-de-la-transition");
    const d = e.defi(NOVA);
    expect(d.atteint({ ...SOLUTION_DE_LA_TRANSITION, hausse: 0.19 })).toBe(false);
    expect(d.atteint({ ...SOLUTION_DE_LA_TRANSITION, subvention: 30 })).toBe(false);
  });
});

describe("une seule NOVA : A durable est la seconde ligne du diagnostic de N + 1", () => {
  it("la seconde ligne, ses moules et les équipements d'efficacité sont les investissements de N + 1 ; la subvention y entre", () => {
    const n1 = exerciceDe("N+1");
    expect(n1.investissements).toBe(PROJET_LIGNE_MANUELLE.actifs.reduce((s, a) => s + a.montant, 0) + EQUIPEMENTS_D_EFFICACITE.montant);
    expect(n1.subventionRecue).toBe(SUBVENTION_DE_L_EFFICACITE);
    expect(n1.enceintesDeLaGamme).toBe(PROJET_LIGNE_MANUELLE.produits[0]!.quantites[0]! + PROJET_LIGNE_MANUELLE.produits[1]!.quantites[0]!);
  });
});

describe("le cas dédié : deux devis pour chauffer l'atelier", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(DEUX_DEVIS_POUR_CHAUFFER_L_ATELIER);
    gardeDuCas(DEUX_DEVIS_POUR_CHAUFFER_L_ATELIER, ch);
  });

  it("6 000 kWh économisés, −6 400 € puis 1 510 € par an pendant dix ans : 3 290,66 € de VAN avec l'aide, −4 769,10 € sans", () => {
    const annuel = c(6_000 * 0.3 * 0.75 + 1_600 * 0.25 - 960 * 0.25);
    expect(annuel).toBe(1_510);
    const avec = vanALaMain([-6_400, ...Array(10).fill(annuel)], 0.09);
    const sans = vanALaMain([-16_000, ...Array(10).fill(6_000 * 0.3 * 0.75 + 1_600 * 0.25)], 0.09);
    const montants = (id: string) => etape(chapitreDuCas(DEUX_DEVIS_POUR_CHAUFFER_L_ATELIER, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("les-flux")).toEqual([6_000, -6_400, 1_510]);
    expect(montants("la-van")).toEqual([avec, sans]);
    expect([avec, sans]).toEqual([3_290.66, -4_769.1]);
    expect(deuxDevisDeChauffage().tonnesEvitees).toBe(c((6_000 * 0.052 * 10) / 1_000));
  });
});
