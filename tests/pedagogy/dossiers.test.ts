import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATELIERS } from "../../src/config/ateliers";
import { LEVIERS } from "../../src/config/decisions";
import { DIFFICULTY_PRESETS } from "../../src/config/difficulty";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import {
  dossierEleve,
  dossierEnseignant,
  tableauDeBordCsv,
} from "../../src/config/ateliers/dossiers";
import { dossiersDeService } from "../../src/config/ateliers/services";

/**
 * AUCUNE RÉPONSE NE PASSE DU CÔTÉ DE L'ÉLÈVE.
 *
 * Les deux dossiers d'un atelier se déduisent des mêmes données : c'est la
 * RÉPARTITION entre les deux publics qui est le travail, et c'est elle qui se
 * casse en silence. Une bonne réponse qui glisse dans le dossier distribué ne
 * se voit pas à la relecture, elle se voit en classe, quand toute la salle
 * répond juste sans avoir cherché.
 *
 * On ne vérifie donc pas que le dossier de l'élève est bien fait : on vérifie
 * qu'il ne contient RIEN de ce qui doit rester chez l'enseignant.
 */
describe("les deux dossiers d'un atelier", () => {
  it("chaque atelier a ses deux dossiers, et ils sont remplis", () => {
    for (const a of ATELIERS) {
      const eleve = dossierEleve(a);
      const prof = dossierEnseignant(a);
      expect(eleve.seances.length, `${a.code} : dossier élève sans séance`).toBe(a.seances.length);
      expect(prof.situations.length, `${a.code} : aucune situation à corriger`).toBeGreaterThan(0);
      for (const s of prof.situations) {
        expect(s.attendus.length, `${a.code}/${s.situation.code} : aucun attendu`).toBeGreaterThan(0);
        expect(s.leurres.length, `${a.code}/${s.situation.code} : aucun leurre`).toBeGreaterThan(0);
        expect(s.corriges.length, `${a.code}/${s.situation.code} : aucun corrigé`).toBeGreaterThan(0);
        for (const c of s.corriges) {
          expect(c.reponse.length, `${a.code}/${s.situation.code} : réponse vide`).toBeGreaterThan(0);
          expect(c.explication.length, `${a.code}/${s.situation.code} : explication vide`).toBeGreaterThan(20);
        }
      }
    }
  });

  it("le tableau de bord ne demande que des décisions que le niveau ouvre", () => {
    // Une feuille qui réclame un plan de trésorerie à un niveau qui n'ouvre pas
    // la banque envoie l'équipe chercher une case qui n'existe pas à l'écran,
    // et lui fait croire qu'elle a raté quelque chose. L'inverse est aussi
    // fâcheux : oublier la ligne de la décision qui décide de tout.
    //
    // L'attendu est recalculé ici depuis les préréglages, et non lu de la
    // fonction que le dossier appelle : une garde qui emprunte le code qu'elle
    // vérifie ne verrait pas ce code se tromper.
    for (const a of ATELIERS) {
      const preset = DIFFICULTY_PRESETS.find((p) => p.level === a.reglages.niveau)!;
      const config = scenarioByCode(a.reglages.scenarioCode).scenario;
      // La marque et l'axe n'existent qu'avec un levier communication (la
      // marque, en gamme seulement) : un secteur qui ne le déclare pas n'a
      // pas ces cases à l'écran.
      const offert = (champ: string) =>
        champ === "brandMarketingBudget"
          ? Boolean(config.communication) && Boolean(config.products)
          : champ === "communicationAxis"
            ? Boolean(config.communication)
            : true;
      const ouverts = LEVIERS.filter(
        (l) =>
          (l.ouvertPar === "toujours" ||
            l.ouvertPar === "secteur" ||
            preset.decisions[l.ouvertPar] === true) &&
          offert(l.champ),
      ).map((l) => l.nom);
      const { decisions, resultats, tours } = dossierEleve(a).tableauDeBord;

      expect(decisions, `${a.code} : les lignes de décision ne suivent pas le niveau`).toEqual(
        ouverts,
      );
      expect(tours, `${a.code} : le tableau ne couvre pas la partie`).toEqual(
        Array.from({ length: a.reglages.tours }, (_, i) => i + 1),
      );
      // Les indicateurs du métier y sont : c'est ce qui distingue le tableau de
      // bord d'un hôtel de celui d'un atelier.
      for (const kpi of scenarioByCode(a.reglages.scenarioCode).kpis) {
        expect(resultats, `${a.code} : « ${kpi.label} » absent du tableau`).toContain(kpi.label);
      }
      expect(resultats.length, `${a.code} : trop peu de lignes de résultat`).toBeGreaterThan(4);
    }
  });

  it("le dossier de l'élève ne porte aucune réponse, aucune correction, aucun indice", () => {
    for (const a of ATELIERS) {
      const eleve = dossierEleve(a);
      const prof = dossierEnseignant(a);
      // Tout ce que l'élève lira, mis bout à bout.
      const distribue = [
        eleve.entreprise.contexte,
        eleve.entreprise.promesse,
        ...eleve.evaluationFinale,
        ...eleve.seances.flatMap((s) => [
          s.titre,
          s.objectif,
          s.livrable,
          s.trace,
          ...s.competences,
          ...s.evaluation,
          ...s.notions,
        ]),
      ].join("\n");

      for (const { situation, corriges } of prof.situations) {
        for (const c of corriges) {
          expect(
            distribue.includes(c.reponse),
            `${a.code} : une bonne réponse est dans le dossier distribué`,
          ).toBe(false);
          expect(
            distribue.includes(c.explication),
            `${a.code} : une correction est dans le dossier distribué`,
          ).toBe(false);
        }
        for (const indice of situation.hints) {
          expect(
            distribue.includes(indice.text),
            `${a.code} : un indice est dans le dossier distribué`,
          ).toBe(false);
        }
      }
    }
  });

  it("le dossier de l'élève ne porte pas non plus la partition de l'enseignant", () => {
    // La préparation et le minutage disent COMMENT on anime. Les donner à
    // l'élève, c'est lui montrer les ficelles avant le tour de magie, et lui
    // apprendre à jouer la séance plutôt que l'entreprise.
    for (const a of ATELIERS) {
      const eleve = dossierEleve(a);
      const distribue = JSON.stringify(eleve);
      for (const s of a.seances) {
        expect(
          distribue.includes(s.preparation.slice(0, 40)),
          `${a.code}/séance ${s.numero} : la préparation est dans le dossier élève`,
        ).toBe(false);
        for (const phase of s.deroule) {
          expect(
            distribue.includes(phase.detail.slice(0, 40)),
            `${a.code}/séance ${s.numero} : le déroulé minuté est dans le dossier élève`,
          ).toBe(false);
        }
      }
    }
  });

  it("les corrigés restent derrière la session, le dossier élève reste public", () => {
    // Le partage des deux pages est ce qui rend la séparation réelle : une
    // page de corrigés en accès libre annulerait tout le reste.
    const corriges = readFileSync("src/app/teacher/animations/[code]/dossier/page.tsx", "utf-8");
    expect(corriges, "la page des corrigés ne demande pas de session").toContain("getSession()");
    expect(corriges, "la page des corrigés ne renvoie pas au login").toContain(
      'redirect("/teacher/login")',
    );
    const eleve = readFileSync("src/app/animations/[code]/dossier/page.tsx", "utf-8");
    expect(eleve, "le dossier élève lit les corrigés").not.toContain("dossierEnseignant");
  });

  it("les formules du tableur pointent sur les bonnes lignes", () => {
    // Le défaut propre à un tableur engendré : une référence décalée d'un rang
    // donne un fichier qui s'ouvre, qui calcule, et qui ment. L'équipe ferait
    // confiance à un chiffre d'affaires recalculé sur la ligne du budget
    // marketing sans qu'aucune erreur ne s'affiche.
    //
    // On relit donc le fichier comme un tableur le lirait : on résout chaque
    // référence et on vérifie qu'elle tombe sur l'intitulé attendu.
    for (const a of ATELIERS) {
      const lignes = tableauDeBordCsv(a)
        .replace(/^\ufeff/, "")
        .split("\r\n")
        .map((l) => l.split(";"));
      const intitule = (reference: string) => {
        const rang = Number(reference.slice(1));
        return lignes[rang - 1]?.[0] ?? "";
      };
      const formules = lignes.filter((l) => l[1]?.startsWith("="));
      const titres = formules.map((l) => l[0]);
      // Deux calculs ne dépendent que de lignes toujours présentes, et doivent
      // donc être là partout. Le troisième compare les ventes à ce qu'on avait
      // prévu : il n'existe que si le niveau ouvre la prévision, et l'imposer
      // à un niveau de découverte ferait référencer une ligne absente.
      expect(titres, `${a.code} : le chiffre d'affaires ne se recalcule pas`).toContain(
        "Chiffre d'affaires recalculé (prix × ventes)",
      );
      expect(titres, `${a.code} : le résultat ne se cumule pas`).toContain(
        "Résultat cumulé depuis le premier tour",
      );

      const attendus: Record<string, string[]> = {
        "Chiffre d'affaires recalculé (prix × ventes)": ["Prix de vente", "Ventes du tour"],
        "Écart entre les ventes prévues et les ventes réelles": [
          "Ventes du tour",
          "Ventes prévues",
        ],
        "Résultat cumulé depuis le premier tour": ["Résultat du tour"],
      };
      for (const ligne of formules) {
        const cibles = attendus[ligne[0]!];
        if (!cibles) continue;
        const references = [...ligne[1]!.matchAll(/[A-Z]\d+/g)].map((m) => m[0]);
        const vus = references.map(intitule);
        for (const cible of cibles) {
          expect(
            vus,
            `${a.code} : « ${ligne[0]} » ne renvoie pas à « ${cible} » mais à ${vus.join(", ")}`,
          ).toContain(cible);
        }
      }

      // Et le fichier reste un document d'élève : aucune correction dedans.
      const csv = tableauDeBordCsv(a);
      for (const { corriges } of dossierEnseignant(a).situations) {
        for (const c of corriges) {
          expect(csv.includes(c.reponse), `${a.code} : une réponse est dans le tableur`).toBe(false);
        }
      }
    }
  });
});

describe("les dossiers de service savent la R&D et la communication", () => {
  it("NOVA · gamme annonce la Studio à développer, la marque et l'axe ; un secteur sans levier n'en dit rien", () => {
    const gea = ATELIERS.find((a) => a.code === "gea")!;
    const services = dossierEleve(gea).services;
    const par = (code: string) => services.find((s) => s.code === code)!;
    const appro = par("approvisionnement");
    expect(appro.lignes.find((l) => l.libelle === "À développer avant de vendre : NOVA Studio")!.valeur).toContain("25 000 €");
    expect(appro.lignes.find((l) => l.libelle === "À développer avant de vendre : NOVA Studio")!.valeur).toContain("au plus tôt au tour 2");
    expect(appro.lignes.some((l) => l.libelle.startsWith("À développer avant de vendre : NOVA Go"))).toBe(false);
    const commercial = par("commercial");
    expect(commercial.mission).toContain("l'axe de communication");
    expect(commercial.lignes.find((l) => l.libelle === "Budget de marque de référence par tour")!.valeur).toContain("4 000 €");
    expect(commercial.lignes.find((l) => l.libelle === "Axe de communication (un seul par tour)")!.valeur).toContain("×1,3");
    expect(commercial.tableau!.entetes.at(-1)).toBe("Axe qui porte · axe qui dessert");
    // Les lycéens comparent les prix : le prix porte, la qualité dessert. Les passionnés : l'inverse.
    const ligne = (nom: string) => commercial.tableau!.lignes.find((l) => l[0]!.startsWith(nom))!.at(-1)!;
    expect(ligne("Lycéens")).toMatch(/^prix · .*qualité/);
    expect(ligne("Passionnés")).toMatch(/^qualité.* · prix$/);
    const financier = par("financier");
    expect(financier.lignes.find((l) => l.libelle === "R&D à financer avant de vendre NOVA Studio")!.valeur).toContain("25 000 €");
    expect(financier.questions).toHaveLength(4);
    // Le tableau de bord de l'équipe a les deux cases.
    expect(dossierEleve(gea).tableauDeBord.decisions).toEqual(
      expect.arrayContaining(["Budget de marque", "Axe de communication", "Recherche et développement"]),
    );

    const stmg = ATELIERS.find((a) => a.code === "stmg")!;
    const texte = JSON.stringify(dossierEleve(stmg).services);
    expect(texte).not.toContain("À développer");
    expect(texte).not.toContain("Budget de marque");
    expect(texte).not.toContain("Axe de communication");
    expect(dossierEleve(stmg).tableauDeBord.decisions).not.toContain("Budget de marque");
    expect(dossierEleve(stmg).tableauDeBord.decisions).not.toContain("Axe de communication");
  });

  it("un niveau qui ferme la R&D ne promet aucun développement", () => {
    const nova = scenarioByCode("nova-gamme");
    const texte = JSON.stringify(dossiersDeService(nova, 4, { sansRd: true }));
    expect(texte).not.toContain("À développer");
    expect(texte).not.toContain("R&D à financer");
    expect(texte).toContain("Budget de marque");
  });
});
