import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { ATELIERS } from "../../src/config/ateliers";
import { cockpitAtelier } from "../../src/config/ateliers/cockpit-atelier";
import { cockpitSpec, colonne, referencesResolues } from "../../src/config/ateliers/cockpit";
import { dossierEleve, dossierEnseignant } from "../../src/config/ateliers/dossiers";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { rendreClasseur } from "../../src/lib/xlsx";

/**
 * UN CLASSEUR ENGENDRÉ NE DOIT PAS MENTIR.
 *
 * Le cockpit est un fichier de formules : une référence décalée d'un rang
 * donne un classeur qui s'ouvre, qui calcule, et dont les « ventes prévues »
 * se calculent sur la ligne du prix. On le relit donc comme un tableur le
 * ferait — chaque référence résolue vers l'intitulé de sa ligne — et on
 * vérifie que les formules qui portent la leçon visent les bonnes lignes,
 * dans les onze ateliers, mono-produit ou à gamme.
 */
describe("le cockpit de prévision", () => {
  it("les colonnes des tours se nomment comme un tableur", () => {
    expect(colonne(0)).toBe("B");
    expect(colonne(24)).toBe("Z");
    expect(colonne(25)).toBe("AA");
  });

  it("chaque atelier a son cockpit, et aucune formule n'y vise le vide", () => {
    for (const a of ATELIERS) {
      const spec = cockpitAtelier(a);
      expect(spec.feuilles.map((f) => f.nom)).toEqual([
        "Paramètres",
        "Prévision logistique",
        "Prévision résultat",
      ]);
      const references = referencesResolues(spec);
      expect(references.length, `${a.code} : aucune formule`).toBeGreaterThan(20);
      const perdues = references.flatMap((r) =>
        r.cibles.filter((c) => c.startsWith("?")).map((c) => `${r.feuille} L${r.ligne} « ${r.intitule} » → ${c}`),
      );
      expect(perdues, `${a.code} : références vers des lignes sans intitulé`).toEqual([]);
    }
  });

  it("les formules qui portent la leçon visent les bonnes lignes", () => {
    // Pour chaque intitulé, les lignes que sa formule doit viser ; une entrée
    // à plusieurs termes accepte l'un OU l'autre (la ligne existe par
    // référence dans la logistique et en total dans le résultat).
    const attendus: Record<string, string[][]> = {
      "Ventes prévues": [["Disponible à la vente"], ["Demande prévue (à saisir)"]],
      "Disponible à la vente": [["en début de tour"], ["à saisir"]],
      "Chiffre d'affaires prévu": [["(à saisir)"], ["Ventes prévues"]],
      "Coût variable des ventes": [["Ventes prévues", "toutes références"]],
      "Marge sur coût variable": [["Chiffre d'affaires"], ["Coût variable des ventes"]],
      "Résultat d'exploitation": [["Marge sur coût variable"], ["Charges de structure"], ["Amortissements"]],
      "Trésorerie en fin de tour": [
        ["Trésorerie en début de tour"],
        ["Encaissements clients"],
        ["Charges décaissées"],
        ["Échéance d'emprunt"],
      ],
      "Au-delà du découvert autorisé": [["Trésorerie en fin de tour"], ["Découvert autorisé"]],
    };
    for (const a of ATELIERS) {
      const references = referencesResolues(cockpitAtelier(a));
      for (const [intitule, cibles] of Object.entries(attendus)) {
        const lignes = references.filter((r) => r.intitule === intitule);
        expect(lignes.length, `${a.code} : « ${intitule} » absent`).toBeGreaterThan(0);
        for (const ligne of lignes) {
          for (const alternatives of cibles) {
            expect(
              ligne.cibles.some((c) => alternatives.some((alt) => c.includes(alt))),
              `${a.code} · ${ligne.feuille} : « ${intitule} » (${ligne.formule}) ne renvoie pas à « ${alternatives.join(" / ")} » mais à ${ligne.cibles.join(" | ")}`,
            ).toBe(true);
          }
        }
      }
      // Le début d'un tour est la fin du précédent : la deuxième colonne du
      // début de trésorerie renvoie à la fin de trésorerie, jamais à une
      // autre ligne.
      const debuts = references.filter((r) => r.intitule === "Trésorerie en début de tour");
      expect(debuts.length).toBeGreaterThan(1);
      expect(debuts[1]!.cibles).toEqual(["Trésorerie en fin de tour"]);
      const stocks = references.filter((r) => r.intitule.endsWith("en début de tour") && !r.intitule.startsWith("Trésorerie"));
      for (const s of stocks.slice(1)) {
        if (s.formule.startsWith("'")) continue; // première colonne : l'ouverture, dans Paramètres
        expect(s.cibles[0], `${a.code} : ${s.formule}`).toMatch(/en fin de tour$/);
      }
    }
  });

  it("MAILLE & CO a une prévision par référence et un total qui les additionne", () => {
    const boutique = ATELIERS.find((a) => a.reglages.scenarioCode === "boutique")!;
    const spec = cockpitAtelier(boutique);
    const logistique = spec.feuilles[1]!;
    const sections = logistique.lignes.filter((l) => l[0]?.style === "section").map((l) => l[0]!.v);
    expect(sections).toEqual([
      "PULL COL ROND",
      "CARDIGAN BOUTONNÉ",
      "PULL MÉRINOS PREMIUM",
      "ÉCHARPE",
      "BONNET",
      "TOUTES RÉFÉRENCES",
    ]);
    const total = referencesResolues(spec).find((r) => r.intitule.startsWith("Total ") && r.intitule.includes("rayon"))!;
    expect(total.cibles.filter((c) => c.includes("à saisir"))).toHaveLength(5);
    // La demande préremplie d'un accessoire est plus forte à Noël qu'en été.
    const bonnet = logistique.lignes.findIndex((l) => l[0]?.v === "BONNET");
    const demande = logistique.lignes[bonnet + 1]!;
    expect(demande[0]!.v).toBe("Demande prévue (à saisir)");
    expect(Number(demande[4]!.v)).toBeGreaterThan(Number(demande[2]!.v) * 3);
  });

  it("une équipe en cours de partie reçoit ses tours restants et son historique", () => {
    const definition = scenarioByCode("boutique");
    const spec = cockpitSpec({
      scenario: definition,
      config: definition.scenario,
      tours: [3, 4, 5, 6],
      concurrents: 3,
      historique: {
        equipe: "Les Tricoteuses",
        tours: [
          {
            tour: 1,
            produits: [{ code: "bonnet", prix: 25, misEnRayon: 800, vendu: 700, manque: 50, stockFin: 350, chiffreAffaires: 17500 }],
            chiffreAffaires: 200000,
            resultatNet: 5000,
            tresorerieNette: 30000,
          },
          {
            tour: 2,
            produits: [{ code: "bonnet", prix: 26, misEnRayon: 300, vendu: 400, manque: 0, stockFin: 250, chiffreAffaires: 10400 }],
            chiffreAffaires: 210000,
            resultatNet: 8000,
            tresorerieNette: 25000,
          },
        ],
        ouverture: { tour: 3, stocks: { bonnet: 250 }, caisse: 25000, creances: 12000, dettesFournisseurs: 9000 },
      },
    });
    expect(spec.feuilles.map((f) => f.nom)).toContain("Historique");
    const logistique = spec.feuilles[1]!;
    expect(logistique.lignes[3]!.slice(1).map((c) => c.v)).toEqual(["Tour 3", "Tour 4", "Tour 5", "Tour 6"]);
    // Le stock d'ouverture et la caisse sont ceux de l'équipe, pas ceux du scénario.
    const parametres = spec.feuilles[0]!;
    const bonnet = parametres.lignes.find((l) => l[0]?.v === "Bonnet")!;
    expect(bonnet[6]!.v).toBe(250);
    const caisse = parametres.lignes.find((l) => l[0]?.v === "Trésorerie")!;
    expect(caisse[1]!.v).toBe(25000);
    // La demande préremplie part du dernier tour vu (400 vendus, 0 manqué au
    // tour 2, saison 0,2) ramené à la saison du tour 4 (2,3).
    const rangBonnet = logistique.lignes.findIndex((l) => l[0]?.v === "BONNET");
    const demande = logistique.lignes[rangBonnet + 1]!;
    expect(Number(demande[2]!.v)).toBe(Math.round((400 * 2.3) / 0.2));
  });

  it("se rend en .xlsx : une feuille par onglet, des formules qui restent des formules", async () => {
    const boutique = ATELIERS.find((a) => a.reglages.scenarioCode === "boutique")!;
    const spec = cockpitAtelier(boutique);
    const fichier = await rendreClasseur(spec);
    expect(fichier.length).toBeGreaterThan(5000);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(fichier as unknown as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual(spec.feuilles.map((f) => f.nom));
    const logistique = wb.getWorksheet("Prévision logistique")!;
    let formules = 0;
    logistique.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.formula) formules += 1;
      });
    });
    expect(formules).toBeGreaterThan(50);
  });

  it("reste un document d'élève : aucun corrigé, aucune préparation dedans", () => {
    for (const a of ATELIERS) {
      const texte = JSON.stringify(cockpitAtelier(a));
      for (const { corriges } of dossierEnseignant(a).situations) {
        for (const c of corriges) {
          expect(texte.includes(c.reponse), `${a.code} : une réponse est dans le cockpit`).toBe(false);
        }
      }
    }
  });
});

describe("le cockpit de NOVA · gamme : la R&D et la marque", () => {
  const gea = () => ATELIERS.find((a) => a.code === "gea")!;

  it("la Studio ne se vend pas tant que sa R&D cumulée n'atteint pas son coût", () => {
    const spec = cockpitAtelier(gea());
    const parametres = spec.feuilles[0]!;
    const libelles = parametres.lignes.map((l) => String(l[0]?.v ?? ""));
    expect(libelles).toContain("Coût de développement · NOVA Studio");
    expect(parametres.lignes.find((l) => l[0]?.v === "Coût de développement · NOVA Studio")![1]!.v).toBe(25000);
    expect(parametres.lignes.find((l) => l[0]?.v === "Vendable au plus tôt au tour · NOVA Studio")![1]!.v).toBe(2);
    expect(parametres.lignes.find((l) => l[0]?.v === "Déjà engagé avant le tour 1 · NOVA Studio")![1]!.v).toBe(0);
    // Go et One sont livrées prêtes : rien à développer.
    expect(libelles.filter((l) => l.startsWith("Coût de développement"))).toHaveLength(1);

    const references = referencesResolues(spec);
    const logistique = spec.feuilles[1]!;
    const rangStudio = logistique.lignes.findIndex((l) => l[0]?.v === "NOVA STUDIO");
    const rangGo = logistique.lignes.findIndex((l) => l[0]?.v === "NOVA GO");
    const bloc = (debut: number) =>
      logistique.lignes.slice(debut + 1).map((l) => String(l[0]?.v ?? "")).slice(0, 15);
    expect(bloc(rangStudio)).toContain("Vendable ce tour (1 = oui, 0 = pas encore)");
    expect(bloc(rangGo)).not.toContain("Vendable ce tour (1 = oui, 0 = pas encore)");
    // La R&D de la Studio est préremplie de quoi la lancer dès le premier tour, rien ensuite.
    const rd = logistique.lignes.find((l) => String(l[0]?.v).startsWith("Recherche et développement (à saisir — préremplie"))!;
    expect(rd[1]!.f).toMatch(/^MAX\(0,'Paramètres'!B\d+-'Paramètres'!B\d+\)$/);
    expect(rd[2]!.v).toBe(0);
    // Vendable = R&D cumulée ≥ coût ET tour ≥ tour minimal ; ventes et mise en fabrication en dépendent.
    const vendable = references.filter((r) => r.intitule.startsWith("Vendable ce tour"));
    expect(vendable).toHaveLength(4);
    expect(vendable[0]!.cibles).toEqual(
      expect.arrayContaining(["R&D cumulée à l'ouverture du tour", "Coût de développement · NOVA Studio", "Vendable au plus tôt au tour · NOVA Studio"]),
    );
    const ventesStudio = references.filter(
      (r) => r.feuille === "Prévision logistique" && r.intitule === "Ventes prévues" && r.cibles.some((c) => c.startsWith("Vendable ce tour")),
    );
    expect(ventesStudio).toHaveLength(4);
    const ventesTotales = references.filter((r) => r.feuille === "Prévision logistique" && r.intitule === "Ventes prévues");
    expect(ventesTotales).toHaveLength(12);
    // La R&D cumulée d'un tour est celle du précédent plus ce qu'on y a engagé.
    const cumul = references.filter((r) => r.intitule === "R&D cumulée à l'ouverture du tour");
    expect(cumul[0]!.cibles).toEqual(["Déjà engagé avant le tour 1 · NOVA Studio"]);
    expect(cumul[1]!.cibles).toEqual(["R&D cumulée à l'ouverture du tour", "Recherche et développement (à saisir — préremplie : de quoi lancer la référence)"]);
  });

  it("la R&D et la marque pèsent sur le résultat et sur la trésorerie", () => {
    const references = referencesResolues(cockpitAtelier(gea()));
    const resultat = (intitule: string) => references.find((r) => r.feuille === "Prévision résultat" && r.intitule === intitule)!;
    expect(resultat("Recherche et développement").cibles).toEqual(["Recherche et développement, toutes références"]);
    expect(resultat("Budget de marque (à saisir)").cibles).toEqual(["Budget de marque de référence par tour"]);
    expect(resultat("Résultat d'exploitation").cibles).toEqual(
      expect.arrayContaining(["Recherche et développement", "Budget de marque (à saisir)", "Budget marketing (à saisir)"]),
    );
    const decaissees = references.find((r) => r.feuille === "Prévision résultat" && r.intitule.startsWith("Charges décaissées"))!;
    expect(decaissees.intitule).toBe("Charges décaissées (structure, marketing, marque, qualité, maintenance, R&D, impôt)");
    expect(decaissees.cibles).toEqual(
      expect.arrayContaining(["Recherche et développement", "Budget de marque (à saisir)", "Impôt sur les bénéfices"]),
    );
    // Un secteur sans levier n'a ni l'une ni l'autre.
    const stmg = referencesResolues(cockpitAtelier(ATELIERS.find((a) => a.code === "stmg")!));
    expect(stmg.some((r) => r.intitule.startsWith("Recherche et développement"))).toBe(false);
    expect(stmg.some((r) => r.intitule.startsWith("Budget de marque"))).toBe(false);
  });

  it("un niveau qui ferme la R&D prévoit la Studio livrée prête", () => {
    const definition = scenarioByCode("nova-gamme");
    const spec = cockpitSpec({ scenario: definition, tours: [1, 2, 3, 4], concurrents: 8, sansRd: true });
    const texte = JSON.stringify(spec);
    expect(texte).not.toContain("Vendable ce tour");
    expect(texte).not.toContain("Recherche et développement");
    expect(texte).toContain("Budget de marque (à saisir)");
  });

  it("une équipe dont la Studio est lancée n'a plus rien à financer, et son historique porte la R&D", () => {
    const definition = scenarioByCode("nova-gamme");
    const spec = cockpitSpec({
      scenario: definition,
      config: definition.scenario,
      tours: [2, 3, 4],
      concurrents: 3,
      historique: {
        equipe: "Les Acoustiques",
        tours: [
          {
            tour: 1,
            produits: [
              { code: "nova-go", prix: 59, misEnRayon: 900, vendu: 850, manque: 0, stockFin: 50, chiffreAffaires: 50150, rdEngage: 0 },
              { code: "nova-one", prix: 99, misEnRayon: 700, vendu: 650, manque: 20, stockFin: 50, chiffreAffaires: 64350, rdEngage: 0 },
              { code: "nova-studio", prix: 129, misEnRayon: 0, vendu: 0, manque: 0, stockFin: 0, chiffreAffaires: 0, rdEngage: 25000 },
            ],
            chiffreAffaires: 114500,
            resultatNet: -12000,
            tresorerieNette: 40000,
          },
        ],
        ouverture: {
          tour: 2,
          stocks: { "nova-go": 50, "nova-one": 50, "nova-studio": 0 },
          caisse: 40000,
          creances: 30000,
          dettesFournisseurs: 20000,
          developpement: { "nova-studio": { engage: 25000, lancee: true } },
        },
      },
    });
    const texte = JSON.stringify(spec);
    expect(texte).not.toContain("Vendable ce tour");
    expect(texte).toContain("Toutes les références sont lancées");
    const historique = spec.feuilles[3]!;
    const rangStudio = historique.lignes.findIndex((l) => l[0]?.v === "NOVA STUDIO");
    const rd = historique.lignes.slice(rangStudio).find((l) => l[0]?.v === "Recherche et développement")!;
    expect(rd[1]!.v).toBe(25000);
    // Une Studio en cours de développement repart de ce qui est engagé.
    const enCours = cockpitSpec({
      scenario: definition,
      config: definition.scenario,
      tours: [2, 3, 4],
      concurrents: 3,
      historique: {
        equipe: "Les Prudents",
        tours: [],
        ouverture: {
          tour: 2,
          stocks: {},
          caisse: 40000,
          creances: 0,
          dettesFournisseurs: 0,
          developpement: { "nova-studio": { engage: 10000, lancee: false } },
        },
      },
    });
    const parametres = enCours.feuilles[0]!;
    expect(parametres.lignes.find((l) => l[0]?.v === "Déjà engagé avant le tour 2 · NOVA Studio")![1]!.v).toBe(10000);
    expect(JSON.stringify(enCours)).toContain("Vendable ce tour");
  });
});

describe("les dossiers de service", () => {
  it("chaque atelier distribue quatre services, chacun avec ses chiffres et ses questions", () => {
    for (const a of ATELIERS) {
      const dossier = dossierEleve(a);
      expect(dossier.services.map((s) => s.code)).toEqual(["approvisionnement", "commercial", "rh", "financier"]);
      for (const s of dossier.services) {
        expect(s.lignes.length, `${a.code}/${s.code} : aucun chiffre`).toBeGreaterThan(1);
        expect(s.questions.length, `${a.code}/${s.code} : aucune question`).toBeGreaterThanOrEqual(3);
        expect(s.questions.length, `${a.code}/${s.code} : trop de questions`).toBeLessThanOrEqual(4);
        expect(s.mission.length, `${a.code}/${s.code}`).toBeGreaterThan(40);
        for (const l of s.lignes) expect(l.valeur, `${a.code}/${s.code}/${l.libelle}`).not.toMatch(/NaN|undefined/);
      }
      expect(dossier.gamme.length).toBeGreaterThan(0);
    }
  });

  it("MAILLE & CO présente ses cinq références, un secteur mono-produit une seule", () => {
    const mco = ATELIERS.find((a) => a.code === "mco")!;
    const gamme = dossierEleve(mco).gamme;
    expect(gamme.map((g) => g.nom)).toEqual([
      "Pull col rond",
      "Cardigan boutonné",
      "Pull mérinos premium",
      "Écharpe",
      "Bonnet",
    ]);
    expect(gamme.find((g) => g.nom === "Bonnet")!.stockOuverture).toBe(250);
    expect(gamme.find((g) => g.nom === "Pull mérinos premium")!.margeUsuelle).toBeGreaterThan(
      gamme.find((g) => g.nom === "Bonnet")!.margeUsuelle * 3,
    );
    const stmg = ATELIERS.find((a) => a.code === "stmg")!;
    expect(dossierEleve(stmg).gamme).toHaveLength(1);
  });
});
