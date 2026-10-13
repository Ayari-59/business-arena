import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATELIERS } from "../../src/config/ateliers";
import { LEVIERS } from "../../src/config/decisions";
import { DIFFICULTY_PRESETS } from "../../src/config/difficulty";
import { SCENARIOS, scenarioByCode } from "../../src/config/scenarios/registry";
import { dossierEnseignant } from "../../src/config/ateliers/dossiers";
import {
  dossierDuResponsable,
  dossiersDesResponsables,
} from "../../src/config/ateliers/dossiers-des-responsables";
import {
  conceptsSansRole,
  effectifsConseilles,
  KPI_PAR_ROLE,
  LEVIERS_PAR_ROLE,
  leviersSansRole,
  repartitionSelonEffectif,
  RESPONSABLES,
  ROLES,
  roleDuKpi,
} from "../../src/config/ateliers/roles";

/**
 * CINQ DOSSIERS, ET RIEN NE TOMBE ENTRE DEUX CHAISES.
 *
 * Les dossiers des responsables se déduisent des mêmes données que le dossier
 * de l'équipe, filtrées par poste. Ce qui se casse en silence, c'est la
 * RÉPARTITION : un levier que personne ne porte, un indicateur que personne
 * ne lit, une case fermée au niveau qu'un dossier réclame quand même, ou une
 * réponse de situation qui glisse dans un document distribué. Aucune de ces
 * fautes ne se voit à la relecture ; elles se voient en classe.
 */

/** Les leviers que le niveau ouvre, recalculés depuis les préréglages et non lus du code vérifié. */
function leviersOuverts(niveau: number, scenarioCode: string): string[] {
  const preset = DIFFICULTY_PRESETS.find((p) => p.level === niveau)!;
  const config = scenarioByCode(scenarioCode).scenario;
  const offert = (champ: string) =>
    champ === "brandMarketingBudget"
      ? Boolean(config.communication) && Boolean(config.products)
      : champ === "communicationAxis"
        ? Boolean(config.communication)
        : true;
  return LEVIERS.filter(
    (l) =>
      (l.ouvertPar === "toujours" ||
        l.ouvertPar === "secteur" ||
        preset.decisions[l.ouvertPar] === true) &&
      offert(l.champ),
  ).map((l) => l.nom);
}

describe("les correspondances de roles.ts", () => {
  it("chaque levier du registre a exactement un responsable, et aucun responsable ne tient un levier fantôme", () => {
    expect(leviersSansRole().map((l) => l.champ)).toEqual([]);
    const champs = new Set(LEVIERS.map((l) => l.champ));
    for (const champ of Object.keys(LEVIERS_PAR_ROLE)) {
      expect(champs.has(champ), `${champ} : un levier qui n'est pas dans le registre`).toBe(true);
    }
    // La direction ne tient aucun levier : la table ne la connaît pas.
    for (const [champ, ligne] of Object.entries(LEVIERS_PAR_ROLE)) {
      expect(RESPONSABLES.map((r) => r.code), `${champ} : responsable inconnu`).toContain(ligne.role);
      expect(ligne.effet.length, `${champ} : effet non écrit`).toBeGreaterThan(40);
    }
  });

  it("chaque indicateur de chaque secteur a un lecteur", () => {
    for (const s of SCENARIOS) {
      for (const kpi of scenarioByCode(s.code).kpis) {
        expect(() => roleDuKpi(kpi.key), `${s.code} : « ${kpi.label} » (${kpi.key}) sans responsable`).not.toThrow();
      }
    }
    // Et la table ne nomme que des indicateurs qui existent.
    const connus = new Set(SCENARIOS.flatMap((s) => scenarioByCode(s.code).kpis.map((k) => k.key)));
    for (const key of Object.keys(KPI_PAR_ROLE)) {
      expect(connus.has(key), `${key} : un indicateur qu'aucun secteur ne déclare`).toBe(true);
    }
  });

  it("chaque fiche du catalogue de notions a son responsable, ou va à tous", () => {
    expect(conceptsSansRole()).toEqual([]);
  });

  it("la règle de répartition lit l'effectif de chaque fiche, et dit quelque chose à chaque taille", () => {
    for (const a of ATELIERS) {
      const tailles = effectifsConseilles(a.reglages.effectifParEquipe);
      expect(tailles.length, `${a.code} : « ${a.reglages.effectifParEquipe} » n'a pas été lu`).toBeGreaterThan(0);
    }
    expect(effectifsConseilles("un élève par filière, donc cinq élèves")).toEqual([5]);
    expect(effectifsConseilles("trois ou quatre élèves")).toEqual([3, 4]);
    // À cinq, un élève tient la direction seul ; en dessous elle tourne.
    expect(repartitionSelonEffectif(5, { leviersRhOuverts: true })).toContain("tient la direction générale seul");
    for (const n of [2, 3, 4]) {
      expect(repartitionSelonEffectif(n, { leviersRhOuverts: true })).toContain("tourne chaque tour");
    }
    // À trois : les RH vont au financier sans levier RH, au producteur sinon.
    expect(repartitionSelonEffectif(3, { leviersRhOuverts: false })).toContain("responsable financier tient aussi les ressources humaines");
    expect(repartitionSelonEffectif(3, { leviersRhOuverts: true })).toContain("responsable production et approvisionnement tient aussi les ressources humaines");
  });
});

describe("les cinq dossiers d'un atelier", () => {
  it("il y en a cinq, la direction en premier, et chacun porte le titre de son poste", () => {
    for (const a of ATELIERS) {
      const dossiers = dossiersDesResponsables(a);
      expect(dossiers.map((d) => d.role.code)).toEqual(ROLES.map((r) => r.code));
      expect(dossiers[0]!.role.code).toBe("direction");
      for (const d of dossiers) {
        expect(d.mission.length, `${a.code}/${d.role.code} : mission vide`).toBeGreaterThan(40);
        expect(d.seances.length, `${a.code}/${d.role.code} : séances manquantes`).toBe(a.seances.length);
        expect(d.feuille.tours).toEqual(Array.from({ length: a.reglages.tours }, (_, i) => i + 1));
        expect(d.indicateurs.length, `${a.code}/${d.role.code} : rien à lire à la clôture`).toBeGreaterThan(0);
        expect(d.repartition.length, `${a.code}/${d.role.code} : pas de règle de répartition`).toBeGreaterThan(0);
      }
    }
  });

  it("aucun dossier ne demande une décision que le niveau ferme, et les quatre responsables couvrent tout ce qu'il ouvre", () => {
    for (const a of ATELIERS) {
      const ouverts = leviersOuverts(a.reglages.niveau, a.reglages.scenarioCode);
      const dossiers = dossiersDesResponsables(a);
      const portes: string[] = [];
      for (const d of dossiers) {
        for (const l of d.decisions) {
          expect(ouverts, `${a.code}/${d.role.code} : « ${l.nom} » est fermé à ce niveau`).toContain(l.nom);
          portes.push(l.nom);
        }
        expect(d.feuille.decisions).toEqual(d.decisions.map((l) => l.nom));
        // Les séances qui jouent un tour demandent exactement ses décisions.
        for (const s of d.seances) {
          const joue = s.essai || s.tourJoue !== null;
          expect(s.decisions, `${a.code}/${d.role.code}/S${s.numero}`).toEqual(joue ? d.decisions.map((l) => l.nom) : []);
        }
      }
      // Rien entre deux chaises, et rien en double.
      expect([...portes].sort(), `${a.code} : les leviers ouverts ne sont pas tous portés`).toEqual([...ouverts].sort());
    }
  });

  it("la direction ne porte aucun levier, seulement la note, et sa liste de contrôle ne cite que des leviers ouverts", () => {
    for (const a of ATELIERS) {
      const direction = dossierDuResponsable(a, "direction");
      expect(direction.decisions).toEqual([]);
      expect(direction.feuille.decisions).toEqual([]);
      expect(direction.chiffres).toBeNull();
      expect(direction.direction).not.toBeNull();
      const { porte, controle, mandat, synthese } = direction.direction!;
      expect(porte.join("\n")).toContain("note de justification");
      expect(porte.join("\n")).toContain("validation");
      expect(synthese).toHaveLength(5);
      // Le mandat lit le moteur : six dimensions qui pondèrent cent pour cent.
      expect(mandat.dimensions).toHaveLength(6);
      expect(Math.round(mandat.dimensions.reduce((s, d) => s + d.poids, 0) * 100)).toBe(100);
      expect(mandat.tours).toBe(a.reglages.tours);
      // La liste de contrôle, par champ ET par nom : chaque levier cité est ouvert.
      const ouvertsParChamp = new Set(
        LEVIERS.filter((l) => leviersOuverts(a.reglages.niveau, a.reglages.scenarioCode).includes(l.nom)).map((l) => l.champ),
      );
      const fermes = LEVIERS.filter((l) => !ouvertsParChamp.has(l.champ));
      for (const point of controle) {
        expect(point.leviers.length, `${a.code} : un point de contrôle sans levier`).toBeGreaterThan(0);
        for (const champ of point.leviers) {
          expect(ouvertsParChamp.has(champ), `${a.code} : la liste de contrôle cite « ${champ} », fermé à ce niveau`).toBe(true);
        }
        for (const f of fermes) {
          expect(
            point.question.toLowerCase().includes(f.nom.toLowerCase()),
            `${a.code} : la question « ${point.question} » nomme « ${f.nom} », fermé à ce niveau`,
          ).toBe(false);
        }
      }
      // Le volume est toujours ouvert : la liste n'est jamais vide.
      expect(controle.length).toBeGreaterThan(0);
    }
  });

  it("un responsable sans levier au niveau garde un dossier qui dit ce qu'il surveille et quand ses leviers s'ouvrent", () => {
    // Les RH n'ouvrent qu'à partir du niveau qui déclare `hr` : en dessous,
    // le responsable surveille l'effectif et la masse salariale.
    const sansRh = ATELIERS.filter(
      (a) => DIFFICULTY_PRESETS.find((p) => p.level === a.reglages.niveau)!.decisions.hr !== true,
    );
    expect(sansRh.length, "aucun atelier sans levier RH : la garde ne vérifie rien").toBeGreaterThan(0);
    for (const a of sansRh) {
      const rh = dossierDuResponsable(a, "rh");
      expect(rh.decisions).toEqual([]);
      expect(rh.indicateurs.join("\n")).toContain("Effectif");
      expect(rh.indicateurs.join("\n")).toContain("Masse salariale");
      expect(rh.ouverture, `${a.code} : le dossier RH ne dit pas quand ses leviers s'ouvrent`).not.toBeNull();
      expect(rh.ouverture!.leviers).toContain("Embauches");
      expect(rh.ouverture!.niveau).toBeGreaterThan(a.reglages.niveau);
    }
  });

  it("chaque indicateur du métier est lu par un responsable, et les communs par qui les regarde", () => {
    for (const a of ATELIERS) {
      const dossiers = dossiersDesResponsables(a);
      const lus = new Set(dossiers.flatMap((d) => d.indicateurs));
      for (const kpi of scenarioByCode(a.reglages.scenarioCode).kpis) {
        expect(lus.has(kpi.label), `${a.code} : « ${kpi.label} » n'est lu par personne`).toBe(true);
      }
      for (const commun of ["Ventes du tour", "Chiffre d'affaires", "Résultat du tour", "Trésorerie à la clôture", "Place au classement"]) {
        expect(lus.has(commun), `${a.code} : « ${commun} » n'est lu par personne`).toBe(true);
      }
    }
  });

  it("les questions aux autres nomment l'interlocuteur", () => {
    for (const a of ATELIERS) {
      for (const d of dossiersDesResponsables(a)) {
        expect(d.aDemander.length, `${a.code}/${d.role.code}`).toBeGreaterThan(0);
        for (const q of d.aDemander) {
          expect(q, `${a.code}/${d.role.code} : « ${q} »`).toMatch(/^Demandez (au responsable|à la direction)/);
        }
      }
    }
  });

  it("aucun dossier de responsable ne porte une réponse, une correction, un indice, ni la partition de l'enseignant", () => {
    // La même garde que le dossier de l'équipe, étendue aux cinq dossiers.
    for (const a of ATELIERS) {
      const prof = dossierEnseignant(a);
      for (const d of dossiersDesResponsables(a)) {
        // Tout ce que le responsable LIT, mis bout à bout : la même assiette
        // que le dossier de l'équipe. Les chiffres du domaine (prix, écarts
        // de coût, délais) en sont exclus pour les réponses : une option de
        // quiz qui vaut « +10 % » tombe sur l'écart de coût d'un fournisseur,
        // et ce n'est pas une réponse qui fuit, c'est un nombre.
        const distribue = [
          d.mission,
          ...d.decisions.flatMap((l) => [l.nom, l.effet]),
          ...(d.ouverture?.leviers ?? []),
          ...d.indicateurs,
          ...d.seances.flatMap((s) => [s.titre, s.objectif ?? "", s.livrable ?? "", s.trace ?? "", ...s.decisions, ...s.notions]),
          ...d.aDemander,
          ...d.aVerifier,
          ...d.repartition,
          ...(d.direction
            ? [
                d.direction.mandat.objectif,
                ...d.direction.mandat.regles,
                d.direction.mandat.premierArbitrage.question,
                ...d.direction.mandat.premierArbitrage.routes.flatMap((r) => [r.label, r.gain, r.risque]),
                ...d.direction.porte,
                ...d.direction.controle.map((c) => c.question),
                ...d.direction.synthese,
              ]
            : []),
        ].join("\n");
        const tout = JSON.stringify(d);
        for (const { situation, corriges } of prof.situations) {
          for (const c of corriges) {
            expect(distribue.includes(c.reponse), `${a.code}/${d.role.code} : une bonne réponse est distribuée`).toBe(false);
            expect(distribue.includes(c.explication), `${a.code}/${d.role.code} : une correction est distribuée`).toBe(false);
          }
          for (const indice of situation.hints) {
            expect(distribue.includes(indice.text), `${a.code}/${d.role.code} : un indice est distribué`).toBe(false);
          }
          // Et le dossier ne dit pas non plus ce qu'il faut cocher au diagnostic.
          for (const o of situation.diagnosticOptions) {
            expect(distribue.includes(o.label), `${a.code}/${d.role.code} : une proposition du diagnostic est distribuée`).toBe(false);
          }
        }
        // La partition de l'enseignant, elle, ne doit être NULLE PART, chiffres compris.
        for (const s of a.seances) {
          expect(tout.includes(s.preparation.slice(0, 40)), `${a.code}/${d.role.code}/S${s.numero} : la préparation est distribuée`).toBe(false);
          for (const phase of s.deroule) {
            expect(tout.includes(phase.detail.slice(0, 40)), `${a.code}/${d.role.code}/S${s.numero} : le déroulé minuté est distribué`).toBe(false);
          }
        }
      }
    }
  });

  it("les pages des responsables sont publiques, référencées, et ne lisent pas les corrigés", () => {
    const page = readFileSync("src/app/animations/[code]/dossier/[role]/page.tsx", "utf-8");
    expect(page).not.toContain("dossierEnseignant");
    expect(page).not.toContain("getSession");
    expect(page, "la page des responsables se rend à la requête, comme le dossier").toContain('dynamic = "force-dynamic"');
    expect(page, "pas de dynamicParams = false : la leçon du 404 des guides").not.toContain("dynamicParams");
    const sitemap = readFileSync("src/app/sitemap.ts", "utf-8");
    expect(sitemap, "le plan du site ignore les dossiers des responsables").toContain("/dossier/${r.code}");
    const fiche = readFileSync("src/app/animations/[code]/page.tsx", "utf-8");
    expect(fiche, "la fiche ne propose pas les dossiers des responsables").toContain("/dossier/${r.code}");
    const dossier = readFileSync("src/app/animations/[code]/dossier/page.tsx", "utf-8");
    expect(dossier, "le dossier de l'équipe n'a pas son sommaire des responsables").toContain("data-sommaire-des-responsables");
  });
});
