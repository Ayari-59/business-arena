import { ATELIERS, type AtelierDefinition } from "./index";
import { scenarioByCode, type ScenarioDefinition } from "../scenarios/registry";
import type { SituationDef } from "../scenarios/situation-kit";

/**
 * LES DEUX DOSSIERS D'UN ATELIER.
 *
 * La fiche d'un atelier est un document d'ENSEIGNANT : elle dit ce qu'il
 * prépare avant la séance, comment il minute son déroulé, ce qu'il regarde
 * dans un livrable. La donner aux élèves reviendrait à leur donner la
 * partition du chef d'orchestre.
 *
 * Il manquait donc son pendant, écrit du côté de l'élève : l'entreprise qu'il
 * va diriger, ce qu'on attend de lui séance après séance, ce qu'il rend et sur
 * quoi il sera regardé. Rien de plus, et surtout pas la préparation.
 *
 * Et il manquait à l'enseignant ce que la fiche ne porte pas : les situations
 * que la partie fera surgir pendant l'atelier, avec leurs corrigés. Il les
 * découvrait jusqu'ici en même temps que sa classe.
 *
 * Aucun contenu n'est inventé ici. Les deux dossiers se déduisent du registre :
 * c'est la répartition entre les deux publics qui est le travail, et c'est elle
 * qu'une garde surveille, parce qu'une réponse qui passe du mauvais côté ne se
 * voit pas à la relecture.
 */

/**
 * Ce que l'élève reçoit : ce qu'il doit faire, jamais comment on l'anime.
 *
 * La structure ne porte QUE des champs destinés à l'élève, recopiés un à un.
 * Une première version transportait l'atelier et le scénario entiers, et se
 * contentait de n'en afficher qu'une partie : la page était juste, la donnée
 * ne l'était pas. Elle emmenait la préparation de l'enseignant, son déroulé
 * minuté, et surtout les situations du secteur avec toutes leurs réponses. Il
 * suffisait qu'un composant client la reçoive un jour pour que le corrigé
 * parte dans le navigateur.
 */
export interface DossierEleve {
  entete: {
    titre: string;
    pitch: string;
    diplome: string;
    annee: string;
    format: string;
    /** Le document que la trace de chaque séance vient nourrir. */
    traceLabel: string;
  };
  entreprise: {
    titre: string;
    promesse: string;
    contexte: string;
    premierArbitrage: {
      question: string;
      routes: { label: string; gain: string; risque: string }[];
    };
  };
  /** Le nombre de tours joués, tel que la partie sera créée. */
  tours: number;
  periodicite: "month" | "quarter" | "year";
  seances: {
    numero: number;
    titre: string;
    tourJoue: number | null;
    objectif: string;
    /** À la première personne : c'est l'élève qui atteste. */
    competences: string[];
    notions: string[];
    livrable: string;
    trace: string;
    evaluation: string[];
  }[];
  /** Comment l'atelier se note, ce que l'élève a le droit de savoir. */
  evaluationFinale: string[];
}

/** Ce que l'enseignant a en plus : les situations, et leurs corrigés. */
export interface DossierEnseignant {
  atelier: AtelierDefinition;
  scenario: ScenarioDefinition;
  /** Les situations que la partie déclenchera, dans l'ordre où elles viennent. */
  situations: {
    situation: SituationDef;
    /** « Tour 3 » ou « Au diagnostic », selon son déclencheur. */
    quand: string;
    /** Les propositions justes du diagnostic. */
    attendus: string[];
    /** Les leurres, qui disent ce que la classe croira. */
    leurres: string[];
    corriges: { question: string; reponse: string; explication: string }[];
  }[];
}

/** Les séances d'un atelier, vues par l'élève. */
export function dossierEleve(atelier: AtelierDefinition): DossierEleve {
  const scenario = scenarioByCode(atelier.reglages.scenarioCode);
  return {
    entete: {
      titre: atelier.titre,
      pitch: atelier.pitch,
      diplome: atelier.diplome,
      annee: atelier.annee,
      format: atelier.format,
      traceLabel: atelier.traceLabel,
    },
    entreprise: {
      titre: scenario.title,
      promesse: scenario.tagline,
      contexte: scenario.context,
      premierArbitrage: {
        question: scenario.dilemma.question,
        routes: scenario.dilemma.routes.map((r) => ({
          label: r.label,
          gain: r.gain,
          risque: r.risque,
        })),
      },
    },
    tours: atelier.reglages.tours,
    periodicite: atelier.reglages.periodicite,
    seances: atelier.seances.map((s) => ({
      numero: s.numero,
      titre: s.titre,
      tourJoue: s.tourJoue,
      objectif: s.objectif,
      competences: [...s.competences],
      notions: [...s.notions],
      livrable: s.livrable,
      trace: s.tracePasseport,
      evaluation: [...s.evaluation],
    })),
    evaluationFinale: [...atelier.evaluationFinale],
  };
}

/**
 * Les situations que l'atelier fera surgir.
 *
 * Celles qui se déclenchent à un tour donné ne viennent que si la partie va
 * jusque là : un atelier de quatre tours ne verra jamais la situation du
 * sixième, et l'annoncer à l'enseignant serait lui promettre une séance qui
 * n'aura pas lieu. Celles qui se déclenchent sur un état de l'entreprise
 * peuvent tomber n'importe quand, ou jamais.
 */
export function dossierEnseignant(atelier: AtelierDefinition): DossierEnseignant {
  const scenario = scenarioByCode(atelier.reglages.scenarioCode);
  const retenues = scenario.situations.filter(
    (s) => !("round" in s.trigger) || s.trigger.round <= atelier.reglages.tours,
  );
  const rang = (s: SituationDef) => ("round" in s.trigger ? s.trigger.round : 99);

  return {
    atelier,
    scenario,
    situations: [...retenues]
      .sort((a, b) => rang(a) - rang(b))
      .map((situation) => ({
        situation,
        quand:
          "round" in situation.trigger
            ? `Tour ${situation.trigger.round}`
            : "Quand l'entreprise en arrive là",
        attendus: situation.diagnosticOptions.filter((o) => o.correct).map((o) => o.label),
        leurres: situation.diagnosticOptions.filter((o) => !o.correct).map((o) => o.label),
        corriges: situation.quiz.map((q) => ({
          question: q.prompt,
          reponse: q.options.find((o) => o.id === q.correctOptionId)?.label ?? "",
          explication: q.explain,
        })),
      })),
  };
}

/** Les ateliers qui ont leurs deux dossiers, c'est à dire tous. */
export function ateliersAvecDossiers(): AtelierDefinition[] {
  return [...ATELIERS];
}
