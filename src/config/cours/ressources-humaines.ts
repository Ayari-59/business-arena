import { runGame, soldUnits } from "../../engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState, RoundDecisions } from "../../engine/types";
import { scenarioByCode } from "../scenarios/registry";
import { GRAINE_DU_COURS } from "./arene-du-cours";
import { decisionsDuCours, scenarioDuCours } from "./arene-du-cours";

/**
 * LES CONDITIONS DES RESSOURCES HUMAINES : CE QUE LE COURS SUPPOSE, ET POURQUOI.
 *
 * Les chapitres du parcours Bac STMG · Ressources humaines prennent leurs chiffres dans
 * l'arène : l'effectif, le coût d'un salarié, le coût d'une embauche, la sensibilité de la
 * motivation au salaire, le seuil sous lequel un salarié démissionne, ce que rapporte la
 * formation. Tout cela est dans le scénario de chaque entreprise (`hr`), et le moteur le joue
 * (src/engine/hr). Ce que le cours choisit, la décision qu'il fait rejouer, est posé ici, une
 * fois, avec sa raison.
 *
 * L'ARÈNE REJOUE L'ANNÉE AVEC UNE DÉCISION DE PLUS. Même réglage, même graine, mêmes
 * concurrents que l'année du cours (`anneeJouee`) : seule la décision de ressources humaines
 * change. Une embauche, une démission ou une formation prennent effet au trimestre suivant,
 * comme dans l'arène ; l'année entière se rejoue donc, pour que l'effet se voie.
 */

/** Une hausse du salaire net, en euros par mois : l'ordre de grandeur d'une demande d'augmentation. */
export const HAUSSE_DU_NET = 100;

/**
 * L'écart d'indice de salaire que le cours fait jouer : 10 %, en plus ou en moins. C'est une
 * négociation salariale crédible, et c'est assez pour franchir le seuil de démission de chaque
 * entreprise du cours (entre 95 % et 98 % du salaire de référence) : la baisse se voit dans
 * l'effectif dès le trimestre suivant.
 */
export const ECART_D_INDICE = 0.1;

/** L'embauche que le cours fait jouer : un salarié, au premier trimestre, présent dès le deuxième. */
export const EMBAUCHES = 1;

/**
 * Le budget de formation que le cours fait jouer, en multiples de l'échelle de formation du
 * scénario (`hr.trainingScale`) : une fois l'échelle. C'est le budget de référence de chaque
 * entreprise, celui pour lequel le moteur a été réglé ; la productivité y gagne
 * sensibilité × ln 2, et les budgets plus gros rapportent de moins en moins.
 */
export const BUDGET_DE_FORMATION_EN_ECHELLES = 1;

type DecisionsRH = NonNullable<RoundDecisions["hr"]>;

const annees = new Map<string, CompanyRoundResult[]>();

/**
 * L'année du cours rejouée, la décision de ressources humaines de chaque trimestre changée.
 * Les trimestres se comptent comme le moteur les compte, à partir de 1 : `rh(1)` est la
 * décision du premier. Une décision absente laisse le trimestre tel que la gestion équilibrée le
 * joue. `cle` nomme la variante, pour ne la jouer qu'une fois.
 */
export function rejouerLAnnee(code: string, cle: string, rh: (tour: number) => DecisionsRH | undefined): CompanyRoundResult[] {
  const k = `${code}:${cle}`;
  const deja = annees.get(k);
  if (deja) return deja;
  const def = scenarioByCode(code);
  const scenario = scenarioDuCours(def.scenario, 4);
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const partie = runGame({
    scenario,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: decisionsDuCours(entreprises, scenario, (tour, d) => {
      const changee = rh(tour);
      return changee ? { ...d, hr: changee } : undefined;
    }),
  });
  const resultats = partie.rounds.map((t) => t.results["joueur"]!);
  annees.set(k, resultats);
  return resultats;
}

/** Les unités vendues d'un trimestre rejoué. */
export const vendues = (r: CompanyRoundResult) => soldUnits(r);
