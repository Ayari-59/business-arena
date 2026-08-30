import { ATELIERS, type AtelierDefinition } from "./index";
import { scenarioByCode, type ScenarioDefinition } from "../scenarios/registry";
import { leviersDuNiveau } from "../decisions";
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
  /**
   * Le tableau de bord à remplir, tour après tour.
   *
   * Les lignes se lisent du produit et non d'une liste écrite ici : les
   * décisions sont exactement les leviers que le niveau de l'atelier ouvre, ni
   * plus ni moins, et les indicateurs sont ceux du métier. Un tableau qui
   * demanderait une décision fermée, ou qui oublierait celle qui décide de
   * tout, ferait chercher à l'équipe une case qui n'existe pas à l'écran.
   *
   * Les tours sont en COLONNES et les lignes en face : une vingtaine de
   * décisions mises en colonnes ne tiendrait sur aucune feuille, et c'est de
   * toute façon dans ce sens qu'on lit une trajectoire.
   */
  tableauDeBord: {
    decisions: string[];
    resultats: string[];
    tours: number[];
  };
}

/**
 * Ce que toute équipe relève à la clôture, quel que soit le métier.
 *
 * Les indicateurs sectoriels s'y ajoutent : on ne pilote pas un hôtel avec les
 * chiffres d'un atelier, mais tout le monde compte ses ventes et son résultat.
 */
const RESULTATS_COMMUNS = [
  "Ventes du tour",
  "Chiffre d'affaires",
  "Résultat du tour",
  "Trésorerie à la clôture",
] as const;

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
    tableauDeBord: {
      decisions: leviersDuNiveau(atelier.reglages.niveau).map((l) => l.nom),
      resultats: [...RESULTATS_COMMUNS, ...scenario.kpis.map((k) => k.label), "Place au classement"],
      tours: Array.from({ length: atelier.reglages.tours }, (_, i) => i + 1),
    },
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

/**
 * LE TABLEAU DE BORD EN TABLEUR.
 *
 * La page imprimée se remplit au stylo ; ce fichier se remplit à l'écran, et
 * surtout il CALCULE. C'est la différence entre une grille et un outil : trois
 * lignes se recalculent seules à mesure que l'équipe saisit ses tours, et ce
 * sont les trois relectures qu'on veut lui faire prendre en réflexe. Le
 * chiffre d'affaires qu'elle recalcule elle même et qui doit retomber sur
 * celui du jeu. L'écart entre ce qu'elle avait prévu et ce qui est arrivé. Et
 * le résultat cumulé, seule ligne qui dise si la partie va bien, là où le
 * résultat d'un tour ne dit rien.
 *
 * Les formules n'emploient que des opérateurs. Un tableur français attend
 * SOMME et un tableur anglais SUM : un fichier qui nommerait une fonction
 * s'ouvrirait cassé sur la moitié des machines d'une salle informatique.
 *
 * Les numéros de ligne sont calculés, jamais écrits : une référence décalée
 * d'un rang donnerait un tableau qui s'ouvre, qui calcule, et qui ment.
 */

/** Une cellule : guillemets échappés, séparateur protégé. */
function cellule(valeur: string): string {
  return /[";\n]/.test(valeur) ? `"${valeur.replace(/"/g, '""')}"` : valeur;
}

/** La lettre de colonne d'un tour : le tour 1 est en B, la première portant les intitulés. */
const colonne = (index: number) => String.fromCharCode(66 + index);

export function tableauDeBordCsv(atelier: AtelierDefinition): string {
  const dossier = dossierEleve(atelier);
  const { decisions, resultats, tours } = dossier.tableauDeBord;
  const lignes: string[][] = [];
  const vide = tours.map(() => "");

  lignes.push([dossier.entete.titre, ...vide]);
  lignes.push([dossier.entreprise.titre, ...vide]);
  lignes.push(["Équipe :", ...vide]);
  lignes.push([]);
  lignes.push(["", ...tours.map((t) => `Tour ${t}`)]);

  lignes.push(["CE QUE NOUS DÉCIDONS", ...vide]);
  const premiereDecision = lignes.length + 1;
  for (const d of decisions) lignes.push([d, ...vide]);

  lignes.push([]);
  lignes.push(["CE QUE CELA A DONNÉ", ...vide]);
  const premierResultat = lignes.length + 1;
  for (const r of resultats) lignes.push([r, ...vide]);

  /** Le numéro de ligne d'un intitulé, tel que le tableur le comptera. */
  const ligneDe = (liste: string[], depart: number, nom: string) => {
    const i = liste.indexOf(nom);
    return i === -1 ? null : depart + i;
  };
  const prix = ligneDe(decisions, premiereDecision, "Prix de vente");
  const prevues = ligneDe(decisions, premiereDecision, "Ventes prévues");
  const ventes = ligneDe(resultats, premierResultat, "Ventes du tour");
  const resultat = ligneDe(resultats, premierResultat, "Résultat du tour");

  lignes.push([]);
  lignes.push(["CE QUE LE TABLEUR RECALCULE POUR VOUS", ...vide]);

  if (prix !== null && ventes !== null) {
    lignes.push([
      "Chiffre d'affaires recalculé (prix × ventes)",
      ...tours.map((_, i) => `=${colonne(i)}${prix}*${colonne(i)}${ventes}`),
    ]);
  }
  if (prevues !== null && ventes !== null) {
    lignes.push([
      "Écart entre les ventes prévues et les ventes réelles",
      ...tours.map((_, i) => `=${colonne(i)}${ventes}-${colonne(i)}${prevues}`),
    ]);
  }
  if (resultat !== null) {
    const cumul = lignes.length + 1;
    lignes.push([
      "Résultat cumulé depuis le premier tour",
      ...tours.map((_, i) =>
        i === 0
          ? `=${colonne(0)}${resultat}`
          : `=${colonne(i - 1)}${cumul}+${colonne(i)}${resultat}`,
      ),
    ]);
  }

  // Signature d'octets en tête : c'est elle qui fait lire les accents à Excel.
  return "\ufeff" + lignes.map((l) => l.map(cellule).join(";")).join("\r\n") + "\r\n";
}
