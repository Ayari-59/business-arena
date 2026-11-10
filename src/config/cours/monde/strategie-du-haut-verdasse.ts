import { arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { HAUT_VERDASSE, SOUTIEN_AU_HANDBALL, totalDe } from "./haut-verdasse";

/**
 * LE MONDE DU COURS : LA STRATÉGIE DE LA COMMUNAUTÉ DE COMMUNES DU HAUT-VERDASSE (management de première
 * STMG, question 3.2, lot B).
 *
 * L'organisation publique du cours (haut-verdasse.ts) mène une stratégie, mais pour l'intérêt général :
 * ses domaines (le sport, la lecture), ses principes (continuité, égalité, adaptabilité), ses modes
 * d'intervention (la régie ou la délégation de service public), ses niveaux (l'État, l'Europe), ses
 * groupes de pression, ses contrôles. Le chapitre se joue chez NOVA, l'entreprise du cas, à qui il
 * oppose cette organisation qui ne cherche pas le profit ; il lit sa fiche sans en recopier un chiffre.
 *
 * HYPOTHÈSES DU COURS (la piscine, et ce que coûterait de la déléguer) :
 *   · LES ENTRÉES : 52 000 par an, scolaires comprises, celles que dit la fiche de la piscine ;
 *   · LES CHARGES DE FONCTIONNEMENT DE LA PISCINE : 520 000 € par an (l'énergie, l'eau, les produits,
 *     l'entretien), une part des charges de fonctionnement du budget ; son personnel, ses agents au coût
 *     moyen d'un agent ;
 *   · LA DÉLÉGATION : une entreprise propose de tenir la piscine pour six ans, aux tarifs et aux horaires
 *     que fixe la communauté. Elle garde les entrées et demande une contribution annuelle, pour les
 *     obligations de service public qu'elle accepte (les créneaux scolaires, l'ouverture l'été, les tarifs
 *     réduits). La communauté garde le contrôle du contrat, qui lui coûte 30 000 € par an (un agent à
 *     mi-temps et un audit). Les agents de la piscine rejoindraient les autres services, ou le délégataire.
 *
 * LE CAS DU CHAPITRE (hypothèse du cours) : ouvrir la médiathèque le dimanche après-midi, 40 dimanches
 * par an, avec 2 agents pendant 5 heures, à 35 € de l'heure chargés (la majoration du dimanche
 * comprise) ; 120 visites attendues chaque dimanche.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les parts payées par les usagers se donnaient au dixième,
 * elles sont à deux décimales.
 */

export const ENTREPRISES_DE_LA_STRATEGIE_PUBLIQUE = ENTREPRISES_DE_LA_DIRECTION;

export const ENTREES_DE_LA_PISCINE = 52_000;
export const CHARGES_DE_LA_PISCINE = 520_000;
export const DELEGATION = { annees: 6, controleParAn: 30_000 } as const;
export const CONTRIBUTIONS_ESSAYEES = { min: 400_000, max: 800_000, pas: 10_000 } as const;

const h = HAUT_VERDASSE;
const service = (code: string) => h.services.find((s) => s.code === code)!;
const recetteDe = (code: string) => h.recettesDesUsagers.find((r) => r.code === code)!.montant;

/** La piscine en régie : ses charges, ses recettes, son coût net pour la communauté. */
export function piscineEnRegie() {
  const agents = service("piscine").agents;
  const personnel = agents * h.agents.coutMoyenAnnuel;
  const charges = personnel + CHARGES_DE_LA_PISCINE;
  const recettes = recetteDe("piscine");
  const coutNet = charges - recettes;
  return {
    nom: service("piscine").nom,
    agents,
    coutMoyen: h.agents.coutMoyenAnnuel,
    personnel,
    fonctionnement: CHARGES_DE_LA_PISCINE,
    charges,
    recettes,
    coutNet,
    entrees: ENTREES_DE_LA_PISCINE,
    coutNetParEntree: auCentime(coutNet / ENTREES_DE_LA_PISCINE),
    /** La part des charges payée par les usagers, en pour cent au dixième. */
    partDesUsagers: arrondi2((recettes / charges) * 100),
  };
}

/** La piscine déléguée : ce qu'elle coûterait à la communauté, à une contribution donnée. */
export function piscineDeleguee(contribution: number) {
  const regie = piscineEnRegie();
  const cout = contribution + DELEGATION.controleParAn;
  return { contribution, controle: DELEGATION.controleParAn, cout, regie: regie.coutNet, ecart: cout - regie.coutNet };
}

/** La plus haute contribution, de 10 000 en 10 000 €, où la délégation coûte moins que la régie. */
export function contributionMaximale() {
  let c = CONTRIBUTIONS_ESSAYEES.min;
  while (c + CONTRIBUTIONS_ESSAYEES.pas <= CONTRIBUTIONS_ESSAYEES.max && piscineDeleguee(c + CONTRIBUTIONS_ESSAYEES.pas).ecart < 0) c += CONTRIBUTIONS_ESSAYEES.pas;
  return c;
}

/** Le budget de fonctionnement, ses totaux, et la part des impôts et dotations. */
export function budgetDeLaCommunaute() {
  const recettes = totalDe(h.budget.recettes);
  const depenses = totalDe(h.budget.depenses);
  const usagers = h.budget.recettes.find((r) => r.code === "usagers")!.montant;
  return { recettes, depenses, usagers, partDesUsagers: arrondi2((usagers / recettes) * 100), subventionDuClub: SOUTIEN_AU_HANDBALL.subvention };
}

/** Le cas : la médiathèque ouverte le dimanche. */
export const DIMANCHES = { dimanches: 40, agents: 2, heures: 5, coutHoraire: 35, visitesParDimanche: 120 } as const;

export function mediathequeLeDimanche() {
  const d = DIMANCHES;
  const cout = d.dimanches * d.agents * d.heures * d.coutHoraire;
  const visites = d.dimanches * d.visitesParDimanche;
  const budget = budgetDeLaCommunaute();
  return {
    ...d,
    nom: service("mediatheque").nom,
    cout,
    visites,
    coutParVisite: auCentime(cout / visites),
    /** La part du budget de fonctionnement que ce coût représente, en pour cent au centième. */
    partDuBudget: arrondi2((cout / budget.depenses) * 100),
  };
}

export const HAUT_VERDASSE_DE_LA_STRATEGIE = HAUT_VERDASSE;

export type Principe = "continuite" | "egalite" | "adaptabilite";
export type Niveau = "central" | "territorial" | "europeen";
