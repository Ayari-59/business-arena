import { describe, expect, it } from "vitest";
import {
  SECURISER_LES_PROCESSUS,
  SOLUTION_DU_CADRAGE,
  cadrageDuLaboratoire,
  departDuCadrage,
  grilleDuCadrage,
} from "../../src/config/cours/chapitres/securiser-les-processus";
import { CLOTURE_DE_LA_FICHE, EXERCICE_DE_NOVA } from "../../src/config/cours/monde/exercice-de-nova";
import { DROITS_DU_PGI, TACHES_DES_ACHATS, cadrageDeLaTva, controleDeLaPaie, fraudeEvitee } from "../../src/config/cours/monde/securite-des-processus";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LA_FACTURE_RECUE_DEUX_FOIS, factureEnDouble } from "../../src/config/cours/situations/par-chapitre/la-facture-recue-deux-fois";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * SÉCURISER LES PROCESSUS DE NOVA, refait à la main sur l'exercice N clos. La facture de décembre
 * d'Électro-Composants, 1 500 jeux à 22 € TTC : 39 600 € ; le résultat net, 79 225,96 € ; le compte
 * courant, 115 734,87 €. Le cadrage de la TVA : 1 390 276 € de ventes comptabilisées, moins
 * 11 800 € de facture à établir, plus 7 080 € de produit constaté d'avance, moins 448,40 € d'escompte,
 * 1 385 107,60 € de base, 277 021,52 € de TVA. La DSN de décembre : 7 500 € de brut, 4 050 € à
 * l'URSSAF, 750 € à la retraite, 121,27 € de prélèvement, les soldes 431, 437 et 442.
 */

const ch = SECURISER_LES_PROCESSUS;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const f = EXERCICE_DE_NOVA;

describe("sécuriser les processus : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
  });

  it("est au registre, au programme (palier 4), au thème, et cite les quatre processus du BTS CG", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual([
      "BTS CG P1 · Contrôle et traitement comptable des opérations commerciales",
      "BTS CG P2 · Contrôle et production de l'information financière",
      "BTS CG P3 · Gestion des obligations fiscales",
      "BTS CG P4 · Gestion des relations sociales",
    ]);
    expect(THEMES.find((t) => t.code === "comptabilite")!.chapitres).toContain(ch.code);
    for (const code of [...(ch.prerequis ?? []), ...(ch.ensuite ?? [])]) expect(CHAPITRES.map((x) => x.code), code).toContain(code);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const i of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LA_FACTURE_RECUE_DEUX_FOIS]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("l'organisation et la séparation des fonctions", () => {
  it("chaque fonction est tenue, et personne ne cumule l'enregistrement et la détention des fonds", () => {
    const t = triDe(ch, "les-quatre-fonctions");
    expect(new Set(Object.values(t))).toEqual(new Set(["autoriser", "detenir", "enregistrer", "controler"]));
    const collaborateur = new Set(TACHES_DES_ACHATS.filter((x) => x.acteur === "collaborateur").map((x) => x.fonction));
    expect(collaborateur.has("detenir")).toBe(false);
    expect(collaborateur.has("autoriser")).toBe(false);
    const droits = triDe(ch, "les-droits-du-pgi");
    expect(droits["Émettre les virements depuis le PGI"]).toBe("presidente");
    expect(DROITS_DU_PGI.filter((d) => d.titulaire === "collaborateur").every((d) => !/virement/i.test(d.libelle))).toBe(true);
    expect(juste(ch, "le-cumul-de-la-presidente")[0]).toMatch(/^Il compense/);
  });
});

describe("la fraude évitée", () => {
  it("39 600 € : 49,98 % du résultat net de N, 34,22 % du compte courant", () => {
    const x = fraudeEvitee(f);
    expect(x.facture).toBe(c(1_500 * 22 * 1.2));
    expect(x.resultatNet).toBe(CLOTURE_DE_LA_FICHE.resultatNet);
    expect(x.compteCourant).toBe(115_734.87);
    expect(attendus(ch, "ce-que-la-fraude-aurait-coute")).toEqual([39_600, c((39_600 / 79_225.96) * 100), c((39_600 / 115_734.87) * 100)]);
    expect(juste(ch, "la-procedure-qui-arrete")[0]).toMatch(/^Un contre-appel/);
  });
});

describe("les contrôles de cohérence", () => {
  it("le cadrage : 1 390 276 − 11 800 + 7 080 − 448,40 = 1 385 107,60 € déclarés, l'écart de 5 168,40 € expliqué", () => {
    const x = cadrageDeLaTva(f);
    expect(x.ventesComptabilisees).toBe(CLOTURE_DE_LA_FICHE.soldes.production);
    expect(x.factureAEtablir).toBe(CLOTURE_DE_LA_FICHE.travaux.factureAEtablir);
    expect(x.produitConstateDAvance).toBe(CLOTURE_DE_LA_FICHE.travaux.produitConstateDAvance);
    expect(x.base).toBe(c(1_385_556 - 448.4));
    expect(x.tvaCollectee).toBe(c(1_385_107.6 * 0.2));
    expect(x.ecart).toBe(c(11_800 - 7_080 + 448.4));
    const g = grilleDuCadrage(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.map((l) => l.cellules[0]!.valeur)).toEqual([1_390_276, 11_800, 7_080, 448.4, 1_385_107.6]);
  });

  it("le laboratoire : les ventes ne bougent pas ; facturer à la livraison ne laisse que l'escompte", () => {
    for (const commande of [0, 1]) for (const livraison of [0, 1]) expect(cadrageDuLaboratoire(f, { commande, livraison }).ventesComptabilisees).toBe(1_390_276);
    expect(cadrageDuLaboratoire(f, departDuCadrage()).decalages).toBe(11_800 - 7_080);
    expect(cadrageDuLaboratoire(f, SOLUTION_DU_CADRAGE).ecart).toBe(448.4);
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-facturation");
  });

  it("la DSN de décembre retombe sur les comptes 431, 437 et 442, et le brut de l'année sur le 641", () => {
    const p = controleDeLaPaie(f);
    expect(p.dsn).toEqual({ urssaf: c(7_500 * 0.54), retraite: c(7_500 * 0.1), prelevement: 121.27 });
    expect(p.ecarts).toEqual({ urssaf: 0, retraite: 0, prelevement: 0, brut: 0 });
    expect(attendus(ch, "la-dsn-face-aux-comptes")).toEqual([4_050, 0, 750, 90_000]);
  });
});

describe("l'archivage et le contrôle extérieur", () => {
  it("les durées : 10 ans les livres et les pièces, 6 ans le fiscal, 5 ans les bulletins et les contrats", () => {
    const t = triDe(ch, "conserver-les-documents");
    expect(t["Les factures d'achat et de vente"]).toBe("comptable");
    expect(t["Le grand livre, la balance et le FEC"]).toBe("comptable");
    expect(t["Les déclarations de TVA déposées"]).toBe("fiscale");
    expect(t["Le double des bulletins de paie"]).toBe("cinq");
    expect(juste(ch, "le-fichier-des-ecritures")[0]).toMatch(/^Le FEC de N/);
    expect(juste(ch, "la-periode-close")[0]).toMatch(/^Je la date du premier jour ouvert/);
    expect(juste(ch, "le-compte-rendu")[0]).toMatch(/^Archiver chaque accusé de dépôt/);
  });
});

describe("le cas dédié : la facture reçue deux fois", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LA_FACTURE_RECUE_DEUX_FOIS);
    gardeDuCas(LA_FACTURE_RECUE_DEUX_FOIS, ch);
  });

  it("la seconde saisie : 34 500 € d'achats, 6 900 € de TVA et 41 400 € de dette en trop, ceux de la facture non parvenue", () => {
    const x = factureEnDouble(NOVA);
    expect([x.chargeEnTrop, x.tvaEnTrop, x.detteEnTrop]).toEqual([f.factureNonParvenue.ht, f.factureNonParvenue.tva, f.factureNonParvenue.ttc]);
    const montants = etape(chapitreDuCas(LA_FACTURE_RECUE_DEUX_FOIS, NOVA), "ce-qui-est-fausse", "montants").champs(NOVA, VIDE).map((k) => k.attendu);
    expect(montants).toEqual([34_500, 6_900, 41_400]);
    const r = etape(LA_FACTURE_RECUE_DEUX_FOIS, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Une seule entrée des factures, et le contrôle des doublons"]);
  });
});
