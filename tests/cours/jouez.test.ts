import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import {
  LIEUX_DE_L_ARENE,
  MISSIONS_AU_NIVEAU_DE_LEUR_DECISION,
  NIVEAU_SANS_LICENCE,
  missionAffichee,
  missionDuChapitre,
  niveauDeLaGamme,
} from "../../src/config/cours/jouez";
import { scenarioByCode, scenarioCodeForLevel } from "../../src/config/scenarios/registry";

/**
 * « ET MAINTENANT, JOUEZ-LE » TIENT SES PROMESSES.
 *
 * Chaque chapitre, dans chaque entreprise où il se joue, finit sur une mission. Elle ouvre une
 * partie que l'élève peut lancer (le niveau sans licence, sauf quand la notion n'existe qu'au
 * delà), elle ne cite que des écrans qui existent sous ce nom, et les mots de la feuille de
 * décision qu'elle reprend sont ceux de l'entreprise à ce niveau.
 */

const jouables = (codes?: readonly string[]) => codes ?? ENTREPRISES_DU_COURS;

/** Les fichiers où s'écrivent les titres de la feuille de décision. */
const FORMULAIRE = ["src/components/decision-form.tsx", "src/config/etapes-des-modules.ts"].map((f) => readFileSync(join(process.cwd(), f), "utf8"));

describe("une mission par chapitre et par entreprise", () => {
  for (const chapitre of CHAPITRES) {
    it(chapitre.code, () => {
      for (const code of jouables(chapitre.entreprises?.codes)) {
        const cas = casDeLEntreprise(code);
        const m = missionDuChapitre(chapitre.code, cas);
        expect(m, `${chapitre.code} chez ${code}`).not.toBeNull();
        expect(m!.faire).toContain(cas.entreprise);
        expect(m!.lieux.length).toBeGreaterThan(0);
        for (const texte of [m!.faire, m!.chercher]) {
          expect(texte).not.toMatch(/\b(de|à) les? /);
          expect(texte).not.toMatch(/ [-–—] /);
          expect(texte).toMatch(/[.?!]$/);
        }
        // Les mots entre guillemets sont ceux de la feuille de décision, au niveau joué : le
        // prix et le volume de l'entreprise, ses fournisseurs, ou un titre écrit dans le formulaire.
        const def = scenarioByCode(scenarioCodeForLevel(code, m!.niveau));
        const feuille = [def.vocabulary.priceLabel, def.vocabulary.productionPlanLabel];
        const fournisseurs = (def.scenario.suppliers ?? []).map((s) => s.name);
        for (const [, mot = ""] of m!.faire.matchAll(/« ([^»]+) »/g)) {
          if (feuille.includes(mot)) continue;
          if (fournisseurs.includes(mot)) continue;
          expect(FORMULAIRE.some((t) => t.includes(`"${mot}"`) || t.includes(`legend="${mot}"`)), `${chapitre.code} chez ${code} : « ${mot} »`).toBe(true);
        }
        const affichee = missionAffichee(chapitre.code, cas)!;
        expect(affichee.adresse).toBe(`/jouer?secteur=${code}&niveau=${m!.niveau}`);
        if (m!.niveau <= NIVEAU_SANS_LICENCE) expect(affichee.reservee).toBeNull();
      }
    });
  }

  it("un chapitre inconnu n'a pas de mission", () => {
    expect(missionDuChapitre("n-existe-pas", casDeLEntreprise("nova"))).toBeNull();
  });
});

describe("le niveau de la mission", () => {
  it("reste dans ce qu'un élève joue sans licence, sauf une décision qui n'existe qu'au-delà (la gamme, l'assurance)", () => {
    for (const chapitre of CHAPITRES) {
      for (const code of jouables(chapitre.entreprises?.codes)) {
        const m = missionDuChapitre(chapitre.code, casDeLEntreprise(code))!;
        if (m.niveau <= NIVEAU_SANS_LICENCE) continue;
        // Au-delà, seule une décision qui n'existe qu'au-delà le justifie, et la mission se joue
        // au niveau qui l'ouvre : la gamme, ou l'assurance (BTS GPME).
        const auNiveauDeLaDecision = MISSIONS_AU_NIVEAU_DE_LEUR_DECISION[chapitre.code];
        if (auNiveauDeLaDecision !== undefined) {
          expect(m.niveau).toBe(auNiveauDeLaDecision);
          expect(auNiveauDeLaDecision).toBeGreaterThan(NIVEAU_SANS_LICENCE);
        } else {
          expect(["cout-par-produit", "assortiment", "portefeuille-abc"]).toContain(chapitre.code);
          expect(m.niveau).toBe(niveauDeLaGamme(code));
        }
        expect(missionAffichee(chapitre.code, casDeLEntreprise(code))!.reservee).toContain(`niveau ${m.niveau} est inclus`);
      }
    }
  });

  it("le coût par produit se joue là où l'entreprise vend plusieurs références", () => {
    const avecGamme = ENTREPRISES_DU_COURS.filter((c) => niveauDeLaGamme(c) !== null);
    expect(avecGamme.length).toBeGreaterThan(0);
    for (const code of avecGamme) {
      const n = niveauDeLaGamme(code)!;
      expect(scenarioCodeForLevel(code, n)).not.toBe(scenarioCodeForLevel(code, 1));
      expect(scenarioCodeForLevel(code, n - 1)).toBe(scenarioCodeForLevel(code, 1));
    }
  });
});

describe("les écrans cités existent sous ce nom", () => {
  for (const [cle, lieu] of Object.entries(LIEUX_DE_L_ARENE)) {
    it(cle, () => {
      for (const r of lieu.reperes) {
        expect(readFileSync(join(process.cwd(), r.fichier), "utf8"), `${r.texte} dans ${r.fichier}`).toContain(r.texte);
      }
    });
  }

  it("chaque écran du registre sert au moins une mission", () => {
    const servis = new Set(
      CHAPITRES.flatMap((ch) => jouables(ch.entreprises?.codes).flatMap((code) => missionDuChapitre(ch.code, casDeLEntreprise(code))!.lieux)),
    );
    expect([...servis].sort()).toEqual(Object.keys(LIEUX_DE_L_ARENE).sort());
  });
});

/**
 * LA MISSION COLLE AU CHAPITRE RÉÉCRIT (audit du contenu, octobre 2026). L'arène et le monde du cours ne
 * disent pas tout pareil : quand l'écran diffère du chapitre (un libellé de producteur pour un commerce,
 * un autre escompte, une TVA comptée à la facture, une machine à une autre échelle, la TVA dans le BFR),
 * la mission le dit, au lieu de laisser l'élève croire qu'il retrouvera le chapitre tel quel.
 */
describe("la mission dit où l'arène s'écarte du chapitre", () => {
  const mission = (chapitre: string, code: string) => missionDuChapitre(chapitre, casDeLEntreprise(code))!;
  const texte = (chapitre: string, code: string) => `${mission(chapitre, code).faire} ${mission(chapitre, code).chercher}`.replace(/[\u00a0\u202f]/g, " ");

  it("un commerce a un stock de marchandises, même si l'écran parle de produits finis", () => {
    for (const code of ["boutique", "ecommerce"]) {
      expect(texte("les-stocks", code)).toMatch(/marchandises/);
      expect(texte("les-stocks", code)).toMatch(/ne fabrique rien/);
    }
    expect(texte("stock-du-point-de-vente", "boutique")).toMatch(/marchandises/);
  });

  it("l'escompte de l'arène est bancaire, celui du chapitre est de règlement", () => {
    expect(texte("remises-et-reglements", "nova")).toMatch(/escompte bancaire/);
    expect(texte("remises-et-reglements", "nova")).toMatch(/escompte de règlement/);
  });

  it("la TVA de MARTEL & FILS est comptée à la facture dans l'arène, aux encaissements dans le chapitre", () => {
    for (const chapitre of ["la-declaration-de-tva", "la-tva-et-la-tresorerie"]) {
      expect(texte(chapitre, "batiment")).toMatch(/à la facture/);
      expect(texte(chapitre, "batiment")).toMatch(/aux encaissements/);
    }
  });

  it("les machines de l'arène ne sont pas les projets du chapitre : la mission donne les deux échelles", () => {
    expect(texte("le-tri-et-le-choix-entre-deux-projets", "nova")).not.toMatch(/la machine du projet B/);
    expect(texte("le-tri-et-le-choix-entre-deux-projets", "nova")).toMatch(/30 000 € dans l'arène, 150 000 €/);
    expect(texte("la-valeur-actuelle-nette", "nova")).toMatch(/15 000 €.*60 000 €.*40 000 €/);
  });

  it("le BFR de l'arène retranche la TVA à décaisser, et la mission le fait recalculer", () => {
    expect(texte("bilan-fonctionnel-et-bfr", "nova")).toMatch(/− TVA à décaisser/);
  });
});
