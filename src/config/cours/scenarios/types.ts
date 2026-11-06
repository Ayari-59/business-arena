import type { EtapeDeReponse, PieceDuBureau } from "../bureaux/types";
import type { Chapitre } from "../types";

/**
 * UN SCÉNARIO À EMBRANCHEMENTS (décision du propriétaire, novembre 2026) : un format de cours par la
 * simulation. L'élève prend une décision, voit ses conséquences chiffrées, puis prend la suivante ; ses
 * choix précédents changent la situation des décisions suivantes. À la fin, un bilan compare sa suite à
 * la meilleure, chiffres à l'appui, et une ou deux questions vérifient qu'il a compris.
 *
 * Il reprend du bureau (bureaux/types.ts) ce qui décide de l'accès (le parcours, le palier, `libre`, les
 * chapitres repris), ce qui le présente (le titre, l'accroche, le commanditaire), ses pièces et ses
 * questions de compréhension. Comme lui, il est servi sans corrigé : la page ne sert que la première
 * décision ; chaque choix remonte à une action serveur (app/cours/scenario/actions.ts), qui calcule la
 * conséquence, puis sert la situation suivante, ou le bilan. Les branches non choisies et la meilleure
 * suite ne partent jamais au navigateur avant la fin.
 *
 * CHAQUE BRANCHE SE CALCULE : la situation, la conséquence et le bilan sont des fonctions pures de la
 * suite des choix, qui lisent le monde du cours ; aucune n'est écrite à la main.
 *
 * Il vit hors du registre des chapitres et des cas (config/cours/scenarios) : il ne compte ni dans le
 * catalogue, ni dans la couverture, ni parmi les cas dédiés.
 */

/** Un chiffre de la situation ou de la conséquence : un libellé, un montant ou un texte, et son ancienne valeur. */
export interface ChiffreDuScenario {
  libelle: string;
  valeur: string;
  /** La valeur avant le choix, quand la conséquence la compare. */
  avant?: string;
  /** Un chiffre qui alerte (un dépassement), ou qui rassure. */
  ton?: "alerte" | "bon";
}

/** Une option d'une décision : son code, et ce que l'élève lit. Rien n'y dit ce qu'elle donnera. */
export interface OptionDuScenario {
  code: string;
  texte: string;
}

/** La situation au moment d'une décision : ce que l'élève a sous les yeux, et les options. */
export interface SituationDuScenario {
  titre: string;
  /** La question posée, en une phrase. */
  consigne: string;
  paragraphes: readonly string[];
  chiffres: readonly ChiffreDuScenario[];
  pieces: readonly PieceDuBureau[];
  options: readonly OptionDuScenario[];
}

/** Ce qu'un choix a donné, calculé une fois le choix fait. */
export interface ConsequenceDuScenario {
  titre: string;
  paragraphes: readonly string[];
  chiffres: readonly ChiffreDuScenario[];
}

/** Une suite résumée pour le bilan : les choix, et ce qu'ils ont donné. */
export interface SuiteResumee {
  choix: readonly { decision: string; option: string }[];
  chiffres: readonly ChiffreDuScenario[];
}

/** Le bilan d'une suite complète : la fin atteinte, la suite de l'élève face à la meilleure. */
export interface BilanDuScenario {
  fin: { code: string; titre: string; paragraphes: readonly string[] };
  /** La suite de l'élève est-elle la meilleure ? */
  meilleure: boolean;
  eleve: SuiteResumee;
  reference: SuiteResumee;
  /** Pourquoi la meilleure suite l'est, et ce qui sépare celle de l'élève. */
  comparaison: readonly string[];
}

export interface Scenario extends Pick<Chapitre, "code" | "parcours" | "palier" | "blocs" | "titre" | "accroche" | "objectifs" | "libre"> {
  /** Les chapitres dont le scénario reprend les notions : il s'ouvre avec eux, comme un cas dédié. */
  reprend: readonly string[];
  /** Qui décide (« Le président »). */
  commanditaire: string;
  entreprise: { code: string; nom: string };
  /** Le mot d'accueil, avant la première décision. */
  accueil: readonly string[];
  /** Les décisions, dans l'ordre : leur identifiant, leur titre court, les codes de leurs options. */
  decisions: readonly { id: string; titre: string; options: readonly string[] }[];
  /** La situation de la décision suivante, après les choix déjà faits (`avant`, dans l'ordre). */
  situation(avant: readonly string[]): SituationDuScenario;
  /** La conséquence du dernier choix de la suite. */
  consequence(suite: readonly string[]): ConsequenceDuScenario;
  /** Le bilan d'une suite complète. */
  bilan(suite: readonly string[]): BilanDuScenario;
  /** Les questions de compréhension, servies avec le bilan et corrigées au serveur, comme celles du bureau. */
  questions: EtapeDeReponse;
}
