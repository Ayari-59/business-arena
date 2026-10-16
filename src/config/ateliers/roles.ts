import { LEVIERS, leviersDuNiveau, type LevierDeDecision } from "../decisions";
import { DIFFICULTY_PRESETS } from "../difficulty";
import { CONCEPTS } from "../pedagogy/concepts";
import type { EngineScenarioConfig } from "../../engine/types";
import { ficheDeNotion } from "./notions";

/**
 * LES CINQ RESPONSABLES D'UNE ÉQUIPE.
 *
 * Une équipe de jeu d'entreprise se répartit les postes, et chaque poste a
 * besoin de SON document : ce qu'il décide, ce qu'il lit à la clôture, ce
 * qu'il prépare pour la séance. Le dossier de l'équipe disait tout à tout le
 * monde ; le propriétaire veut un dossier par responsable, à part.
 *
 * Ce module ne porte que des CORRESPONDANCES, écrites une seule fois :
 *   · levier de décision → responsable (chaque levier du registre, un seul
 *     responsable, et les cinq dossiers d'un atelier couvrent ensemble tous
 *     les leviers que son niveau ouvre : rien ne tombe entre deux chaises) ;
 *   · indicateur sectoriel → responsable (par code, pour chaque secteur) ;
 *   · notion du catalogue → responsable (par code de fiche ; une notion sans
 *     responsable va à tous) ;
 *   · et la règle de répartition quand l'équipe compte moins de cinq élèves.
 *
 * Ce que chaque levier CHANGE dans le moteur est écrit ici en une phrase,
 * depuis le moteur (`src/engine/**`) et non de mémoire, avec le tour à partir
 * duquel il agit : l'élève doit savoir qu'une embauche décidée ce tour ne
 * produit qu'au suivant avant de la décider, pas après.
 *
 * Les codes `commercial`, `approvisionnement`, `rh`, `financier` sont ceux des
 * dossiers de service (`services.ts`) : ils restent, seuls les titres
 * changent. La direction générale s'ajoute : elle ne tient aucune case du
 * formulaire, sauf la note qui justifie les choix, et la validation du tour.
 */

export type CodeDeResponsable = "commercial" | "approvisionnement" | "rh" | "financier";
export type CodeDeRole = "direction" | CodeDeResponsable;

export interface RoleDeLEquipe {
  code: CodeDeRole;
  /** Le titre du poste, tel qu'un élève le lit sur son dossier. */
  titre: string;
  /** Le titre du dossier (« Dossier du responsable financier »). */
  titreDuDossier: string;
  /** Comment les autres s'adressent à lui (« au responsable financier »). */
  interlocuteur: string;
  /** Le domaine, en deux mots, pour le sommaire. */
  domaine: string;
}

/** Les cinq rôles, la direction en premier : c'est elle qui valide. */
export const ROLES: readonly RoleDeLEquipe[] = [
  {
    code: "direction",
    titre: "Direction générale",
    titreDuDossier: "Dossier de la direction générale",
    interlocuteur: "à la direction générale",
    domaine: "Le mandat, la note de justification, la validation du tour",
  },
  {
    code: "commercial",
    titre: "Responsable marketing et commercial",
    titreDuDossier: "Dossier du responsable marketing et commercial",
    interlocuteur: "au responsable marketing et commercial",
    domaine: "Le prix, le marketing, les clientèles",
  },
  {
    code: "approvisionnement",
    titre: "Responsable production et approvisionnement",
    titreDuDossier: "Dossier du responsable production et approvisionnement",
    interlocuteur: "au responsable production et approvisionnement",
    domaine: "Le volume, le fournisseur, la capacité, la qualité",
  },
  {
    code: "rh",
    titre: "Responsable des ressources humaines",
    titreDuDossier: "Dossier du responsable des ressources humaines",
    interlocuteur: "au responsable des ressources humaines",
    domaine: "L'effectif, la formation, les salaires",
  },
  {
    code: "financier",
    titre: "Responsable financier",
    titreDuDossier: "Dossier du responsable financier",
    interlocuteur: "au responsable financier",
    domaine: "La trésorerie, l'emprunt, les créances, le résultat",
  },
];

export const roleByCode = new Map(ROLES.map((r) => [r.code, r]));

/** Les quatre responsables, sans la direction : ceux qui tiennent des leviers. */
export const RESPONSABLES: readonly RoleDeLEquipe[] = ROLES.filter(
  (r) => r.code !== "direction",
);

/* ---------------------------------------------------------------------------
 * LEVIER → RESPONSABLE, et ce que le levier change dans le moteur.
 * ------------------------------------------------------------------------- */

/** À partir de quand une décision du tour se voit. */
export type MomentDEffet = "ce tour" | "le tour suivant" | "les tours suivants" | "avec les résultats du tour";

export interface EffetDUnLevier {
  role: CodeDeResponsable;
  /** Ce que le levier change dans le moteur, en une phrase, écrite depuis `src/engine`. */
  effet: string;
  /** Le tour à partir duquel il agit. */
  agit: MomentDEffet;
}

/**
 * Chaque champ du registre des leviers, une fois. Une garde vérifie que la
 * table couvre exactement `LEVIERS` : un levier ajouté au registre sans ligne
 * ici ferait chercher à un élève une décision que personne ne porte.
 */
export const LEVIERS_PAR_ROLE: Record<string, EffetDUnLevier> = {
  // --- Marketing et commercial : vendre ---------------------------------
  price: {
    role: "commercial",
    effet:
      "Fixe le prix auquel le marché achète : chaque clientèle le compare au prix qu'elle a l'habitude de payer, décroche au-delà de ses seuils psychologiques et se méfie sous son prix plancher (engine/market/attraction).",
    agit: "ce tour",
  },
  marketingBudget: {
    role: "commercial",
    effet:
      "Attire la demande du tour à rendements décroissants ; sans budget, une partie de la clientèle ne vient pas, et l'effet s'éteint avec la dépense (engine/market/attraction).",
    agit: "ce tour",
  },
  brandMarketingBudget: {
    role: "commercial",
    effet:
      "Bâtit une notoriété qui profite à toute la gamme au tour suivant et s'use si l'on cesse (engine/market/communication).",
    agit: "le tour suivant",
  },
  communicationAxis: {
    role: "commercial",
    effet:
      "Donne un axe au même euro de marketing : il rend plus auprès des clientèles sensibles à cet axe et dessert les autres ; en changer use une part de la notoriété acquise (engine/market/communication).",
    agit: "ce tour",
  },
  acceptOrder: {
    role: "commercial",
    effet:
      "Accepte la commande ferme proposée ce tour : ses unités sont livrées à son prix et réglées à son délai, prises sur la production du tour (engine/simulation).",
    agit: "ce tour",
  },
  studyMarket: {
    role: "commercial",
    effet:
      "Achète un rapport, facturé en charge de structure : demande par clientèle, parts de marché, prix moyens et résultats des concurrents (engine/simulation).",
    agit: "avec les résultats du tour",
  },
  studyPrice: {
    role: "commercial",
    effet:
      "Achète un rapport, facturé en charge de structure : élasticités estimées par clientèle, seuils psychologiques, prix de référence (engine/simulation).",
    agit: "avec les résultats du tour",
  },
  // --- Production et approvisionnement : produire -----------------------
  productionPlan: {
    role: "approvisionnement",
    effet:
      "Fixe la quantité à produire ou à servir ; le moteur la ramène à la capacité et aux heures de l'équipe, et ce qui n'est pas vendu dort en stock ou se perd (engine/production).",
    agit: "ce tour",
  },
  supplierChoice: {
    role: "approvisionnement",
    effet:
      "Choisit qui fournit : son coût multiplie le prix des matières, son délai décale le paiement, sa qualité et son risque de rupture jouent sur le tour ; le choix se reconduit (engine/simulation).",
    agit: "ce tour",
  },
  qualityBudget: {
    role: "approvisionnement",
    effet:
      "Élève la qualité produite à rendements décroissants et réduit les rebuts ; la qualité que les clients perçoivent suit avec inertie, donc l'effet s'installe sur plusieurs tours (engine/production).",
    agit: "ce tour",
  },
  maintenanceBudget: {
    role: "approvisionnement",
    effet:
      "Sous le budget de référence, la disponibilité de l'outil baisse au tour suivant et les rebuts montent ; au budget de référence, elle se maintient, et au-delà rien de plus (engine/production).",
    agit: "le tour suivant",
  },
  rdBudget: {
    role: "approvisionnement",
    effet:
      "Se décaisse ce tour ; élève le niveau technique avec inertie et, cumulé jusqu'au coût de développement, rend une référence vendable au tour qui suit (engine/simulation).",
    agit: "le tour suivant",
  },
  machineCapacityUnits: {
    role: "approvisionnement",
    effet:
      "Achète de la capacité : décaissée maintenant, en service au tour suivant, amortie ensuite (engine/simulation).",
    agit: "le tour suivant",
  },
  rseBudget: {
    role: "approvisionnement",
    effet:
      "Charge décaissée ce tour qui bâtit lentement un capital d'image ; la demande n'y répond qu'aux tours suivants, et il retombe si l'on cesse (engine/rse).",
    agit: "les tours suivants",
  },
  rseInvestment: {
    role: "approvisionnement",
    effet:
      "Charge décaissée ce tour qui bâtit un capital « process propre », lequel réduit durablement les rebuts, avec inertie (engine/rse).",
    agit: "les tours suivants",
  },
  // --- Ressources humaines : l'équipe -----------------------------------
  hire: {
    role: "rh",
    effet:
      "Coûte le recrutement ce tour ; la personne travaille à partir du tour suivant, dans la limite des embauches possibles par tour et de l'effectif maximal (engine/hr).",
    agit: "le tour suivant",
  },
  fire: {
    role: "rh",
    effet:
      "Coûte l'indemnité ce tour ; l'effectif baisse au tour suivant, jamais sous un salarié (engine/hr).",
    agit: "le tour suivant",
  },
  trainingBudget: {
    role: "rh",
    effet:
      "Se dépense ce tour ; élève la productivité du tour suivant, à rendements décroissants et plafonnée (engine/hr).",
    agit: "le tour suivant",
  },
  salaryPercent: {
    role: "rh",
    effet:
      "Fixe le salaire par rapport au marché : seul l'écart se facture ; sous le marché la productivité du tour baisse et, sous le seuil d'attrition, un salarié part chaque tour (engine/hr).",
    agit: "ce tour",
  },
  // --- Financier : la caisse ---------------------------------------------
  newLoan: {
    role: "financier",
    effet:
      "Entre en caisse ce tour, dans la limite de ce que la banque prête au regard des capitaux propres ; les échéances se prélèvent ensuite chaque tour, intérêts compris (engine/simulation).",
    agit: "ce tour",
  },
  loanRepayment: {
    role: "financier",
    effet:
      "Rembourse par anticipation, au-delà de l'échéance obligatoire : la somme sort de caisse ce tour et allège les intérêts des tours suivants (engine/simulation).",
    agit: "ce tour",
  },
  capitalIncrease: {
    role: "financier",
    effet:
      "Apport des associés en caisse ce tour, dans la limite de l'enveloppe totale qu'ils consentent ; il ne se rembourse pas (engine/simulation).",
    agit: "ce tour",
  },
  dividend: {
    role: "financier",
    effet:
      "Verse aux associés, pris sur les réserves des tours passés, jamais sur le résultat du tour en cours ; la caisse n'est pas un plafond, le découvert peut en payer le prix (engine/simulation).",
    agit: "ce tour",
  },
  discount: {
    role: "financier",
    effet:
      "Encaisse tout de suite une part des créances clients, contre un intérêt au taux d'escompte pour la durée du tour (engine/finance/statements).",
    agit: "ce tour",
  },
  factoring: {
    role: "financier",
    effet:
      "Cède des créances au factor, encaissées tout de suite moins sa commission (engine/finance/statements).",
    agit: "ce tour",
  },
  placement: {
    role: "financier",
    effet:
      "Place de la trésorerie qui quitte la caisse ce tour et revient au tour suivant avec ses intérêts ; placer ce qu'on n'a pas fait payer un découvert (engine/finance/statements).",
    agit: "le tour suivant",
  },
  insurance: {
    role: "financier",
    effet:
      "Paie une prime en charge de structure chaque tour ; en échange, les aléas couverts par la formule ne touchent pas l'entreprise (engine/simulation).",
    agit: "ce tour",
  },
  studyFinance: {
    role: "financier",
    effet:
      "Achète un rapport, facturé en charge de structure : ratios, structure des coûts, seuil de rentabilité, comparaison sectorielle (engine/simulation).",
    agit: "avec les résultats du tour",
  },
  studyProject: {
    role: "financier",
    effet:
      "Achète un rapport, facturé en charge de structure : valeur actuelle nette, taux de rentabilité interne et délai de récupération d'un investissement, arbitrage de la commande du tour (engine/investment).",
    agit: "avec les résultats du tour",
  },
};

/** Le responsable d'un levier, par champ du formulaire. */
export function roleDuLevier(champ: string): CodeDeResponsable {
  const ligne = LEVIERS_PAR_ROLE[champ];
  if (!ligne) throw new Error(`Levier sans responsable : ${champ}`);
  return ligne.role;
}

/** Un levier, tel que le dossier d'un responsable le présente. */
export interface LevierDuResponsable {
  champ: string;
  nom: string;
  effet: string;
  agit: MomentDEffet;
}

/** Les leviers d'un responsable, parmi ceux que le niveau ouvre pour ce scénario. */
export function leviersDuResponsable(
  role: CodeDeRole,
  niveau: number,
  scenario: EngineScenarioConfig,
): LevierDuResponsable[] {
  if (role === "direction") return [];
  return leviersDuNiveau(niveau, scenario)
    .filter((l) => roleDuLevier(l.champ) === role)
    .map((l) => ({
      champ: l.champ,
      nom: l.nom,
      effet: LEVIERS_PAR_ROLE[l.champ]!.effet,
      agit: LEVIERS_PAR_ROLE[l.champ]!.agit,
    }));
}

/**
 * Le premier niveau qui ouvre un levier de ce responsable que le niveau donné
 * n'ouvre pas encore, et ce qu'il ouvre : « ses leviers s'ouvrent au niveau 3 ».
 * Null si tout est déjà ouvert, ou si rien ne s'ouvre jamais.
 */
export function prochaineOuverture(
  role: CodeDeResponsable,
  niveau: number,
  scenario: EngineScenarioConfig,
): { niveau: number; niveauNom: string; leviers: string[] } | null {
  const deja = new Set(leviersDuResponsable(role, niveau, scenario).map((l) => l.champ));
  for (const preset of [...DIFFICULTY_PRESETS].sort((a, b) => a.level - b.level)) {
    if (preset.level <= niveau) continue;
    const nouveaux = leviersDuResponsable(role, preset.level, scenario).filter(
      (l) => !deja.has(l.champ),
    );
    if (nouveaux.length > 0) {
      return { niveau: preset.level, niveauNom: preset.name, leviers: nouveaux.map((l) => l.nom) };
    }
  }
  return null;
}

/**
 * Ce qu'un responsable SURVEILLE même sans levier : les lignes de sa feuille
 * de décision qui ne sont pas des décisions. Sans chiffre : ce sont des
 * intitulés, les valeurs se lisent de la partie.
 */
export const VEILLE_PAR_ROLE: Record<CodeDeResponsable, readonly string[]> = {
  commercial: [],
  approvisionnement: [],
  rh: ["Effectif", "Productivité", "Masse salariale"],
  financier: [],
};

/* ---------------------------------------------------------------------------
 * INDICATEUR → RESPONSABLE.
 * ------------------------------------------------------------------------- */

/**
 * Les résultats que toute équipe relève à la clôture (`dossiers.ts`,
 * RESULTATS_COMMUNS), et qui les lit. « Place au classement » est à la
 * direction, qui l'inscrit aussi sur sa feuille de synthèse.
 */
export const RESULTATS_COMMUNS_PAR_ROLE: Record<string, readonly CodeDeRole[]> = {
  "Ventes du tour": ["commercial", "approvisionnement"],
  "Chiffre d'affaires": ["commercial", "financier"],
  "Résultat du tour": ["financier", "direction"],
  "Trésorerie à la clôture": ["financier", "direction"],
  "Place au classement": ["direction"],
};

/**
 * Les indicateurs du métier, par CODE (`scenarios/sector-kpis.ts`), et qui les
 * lit. Un même code sert à plusieurs secteurs (le taux d'occupation d'un hôtel
 * et d'un cabinet, le panier moyen d'une boutique et d'un site) : il a le même
 * lecteur partout, parce qu'il dit la même chose. Une garde vérifie que
 * chaque indicateur de chaque secteur a sa ligne ici.
 */
export const KPI_PAR_ROLE: Record<string, CodeDeResponsable> = {
  // Industrie
  utilisation: "approvisionnement",
  marge_unitaire: "commercial",
  ecoulement_stock: "approvisionnement",
  // Hôtellerie et conseil
  taux_occupation: "approvisionnement",
  pmc: "commercial",
  revpar: "commercial",
  tjm: "commercial",
  dso: "financier",
  // Commerce, vente en ligne, abonnement
  panier_moyen: "commercial",
  transformation: "commercial",
  attrition: "commercial",
  cac: "commercial",
  marge_apres_acquisition: "commercial",
  revenu_par_adherent: "commercial",
  ltv: "commercial",
  // Restauration
  ratio_matieres: "approvisionnement",
  ticket_moyen: "commercial",
  remplissage: "approvisionnement",
  // Bâtiment
  prix_m2: "commercial",
  bfr_jours: "financier",
  part_encours: "financier",
  emploi_compagnons: "rh",
  // Transport
  taux_remplissage: "approvisionnement",
  prix_palette: "commercial",
  part_carburant: "approvisionnement",
  dso_transport: "financier",
};

export function roleDuKpi(key: string): CodeDeResponsable {
  const role = KPI_PAR_ROLE[key];
  if (!role) throw new Error(`Indicateur sans responsable : ${key}`);
  return role;
}

/* ---------------------------------------------------------------------------
 * NOTION → RESPONSABLE.
 * ------------------------------------------------------------------------- */

/**
 * Chaque fiche du catalogue (`pedagogy/concepts.ts`), par code, et le
 * responsable qui la travaille ; « tous » quand elle est à toute l'équipe (le
 * tableau de bord). Une notion de séance qu'aucune fiche ne couvre va aussi à
 * tous : ce qui n'est pas attribué se voit, il ne se perd pas.
 */
export const NOTIONS_PAR_ROLE: Record<string, CodeDeResponsable | "tous"> = {
  demand_market_share: "commercial",
  price_elasticity: "commercial",
  psych_price: "commercial",
  seasonality: "commercial",
  revenue: "commercial",
  segmentation: "commercial",
  margin_rates: "commercial",
  markup_coefficient: "commercial",
  markdown: "commercial",
  average_basket: "commercial",
  conversion_rate: "commercial",
  assortment: "commercial",
  sales_per_sqm: "commercial",
  distribution_commission: "commercial",
  customer_acquisition_cost: "commercial",
  occupancy_revpar: "commercial",
  brand_capital: "commercial",
  standard_costing: "approvisionnement",
  cost_variance: "approvisionnement",
  material_price_variance: "approvisionnement",
  efficiency_variance: "approvisionnement",
  variable_costs: "approvisionnement",
  capacity: "approvisionnement",
  stock: "approvisionnement",
  stock_rotation: "approvisionnement",
  weighted_average_cost: "approvisionnement",
  full_unit_cost: "approvisionnement",
  csr_index: "approvisionnement",
  productivity: "rh",
  fixed_costs: "financier",
  contribution_margin: "financier",
  breakeven: "financier",
  dead_point: "financier",
  safety_margin: "financier",
  operating_leverage: "financier",
  frng: "financier",
  bfr: "financier",
  net_treasury: "financier",
  profitability_vs_return: "financier",
  discounting: "financier",
  irr_payback: "financier",
  loan_schedule: "financier",
  receivables_financing: "financier",
  ebitda_margin: "financier",
  depreciation: "financier",
  payment_terms: "financier",
  cash_budget: "financier",
  vat_payable: "financier",
  volume_price_variance: "financier",
  income_statement: "financier",
  balance_sheet: "financier",
  dashboard: "tous",
  // Niveau 7 « Groupe » : la valeur et le groupe au financier, les rachats à
  // tous, le choix de fabriquer ou faire fabriquer à l'approvisionnement.
  enterprise_value: "financier",
  total_shareholder_return: "financier",
  dilution_issuance: "financier",
  goodwill_impairment: "financier",
  consolidation: "financier",
  minority_translation: "financier",
  currency_risk: "financier",
  vertical_integration: "tous",
  make_or_buy: "approvisionnement",
  // NOVA Home : la cannibalisation au commercial, l'option et l'immobilisation au financier.
  cannibalization: "commercial",
  staged_investment: "financier",
  development_costs: "financier",
};

/** Le responsable d'une notion citée par une séance, ou « tous ». */
export function roleDeLaNotion(notion: string): CodeDeResponsable | "tous" {
  const fiche = ficheDeNotion(notion);
  if (!fiche) return "tous";
  return NOTIONS_PAR_ROLE[fiche.code] ?? "tous";
}

/** Les notions d'une séance qui reviennent à ce responsable, celles de tous comprises. */
export function notionsDuResponsable(role: CodeDeRole, notions: readonly string[]): string[] {
  return notions.filter((n) => {
    const r = roleDeLaNotion(n);
    return r === "tous" || r === role;
  });
}

/** Toutes les fiches du catalogue ont-elles leur ligne ? (lu par la garde) */
export function conceptsSansRole(): string[] {
  return CONCEPTS.map((c) => c.code).filter((code) => !(code in NOTIONS_PAR_ROLE));
}

/* ---------------------------------------------------------------------------
 * LA RÉPARTITION SELON L'EFFECTIF.
 * ------------------------------------------------------------------------- */

const NOMBRES: Record<string, number> = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6 };

/**
 * Les tailles d'équipe que la fiche conseille, lues dans `effectifParEquipe`
 * (« trois élèves », « trois ou quatre élèves », « un élève par filière, donc
 * cinq élèves »). Seul le pluriel compte : « un élève par filière » dit la
 * composition, pas la taille.
 */
export function effectifsConseilles(effectifParEquipe: string): number[] {
  const texte = effectifParEquipe.toLowerCase();
  const vus = new Set<number>();
  for (const m of texte.matchAll(/\b(un|une|deux|trois|quatre|cinq|six)(?: ou (un|une|deux|trois|quatre|cinq|six))? élèves\b/g)) {
    for (const mot of [m[1], m[2]]) {
      if (mot && NOMBRES[mot]) vus.add(NOMBRES[mot]);
    }
  }
  return [...vus].sort((a, b) => a - b);
}

/**
 * LA RÈGLE, ÉCRITE UNE FOIS.
 *
 * À cinq, un élève par dossier, la direction comprise. En dessous, les quatre
 * dossiers de responsable se partagent, et la direction générale TOURNE
 * chaque tour entre ceux qui restent : chacun valide au moins un tour.
 *
 * À trois, le dossier des ressources humaines va au responsable financier
 * quand le niveau n'ouvre aucun levier RH (il n'y a qu'à surveiller
 * l'effectif et la masse salariale, qui sont des charges), et au responsable
 * production et approvisionnement sinon (les embauches, la formation et les
 * salaires suivent le volume). À deux, marketing et commercial avec les
 * ressources humaines d'un côté, production et approvisionnement avec la
 * finance de l'autre.
 */
export function repartitionSelonEffectif(
  effectif: number,
  options: { leviersRhOuverts: boolean },
): string {
  switch (effectif) {
    case 5:
      return "À cinq : un élève par dossier, et le cinquième tient la direction générale seul : la note de justification, la synthèse du tour et la validation.";
    case 4:
      return "À quatre : un responsable par dossier ; la direction générale tourne chaque tour entre les quatre responsables, et celui qui la tient valide le tour.";
    case 3:
      return options.leviersRhOuverts
        ? "À trois : le responsable production et approvisionnement tient aussi les ressources humaines, parce que les embauches, la formation et les salaires suivent le volume qu'il décide ; la direction générale tourne chaque tour entre les trois."
        : "À trois : le responsable financier tient aussi les ressources humaines, parce qu'à ce niveau aucun levier RH n'est ouvert et qu'il reste à surveiller l'effectif et la masse salariale, qui sont des charges ; la direction générale tourne chaque tour entre les trois.";
    case 2:
      return "À deux : l'un tient le marketing et le commercial avec les ressources humaines, l'autre la production et l'approvisionnement avec la finance ; la direction générale tourne chaque tour entre les deux.";
    default:
      return `À ${effectif} : un responsable par dossier, la direction générale tourne chaque tour entre les responsables, et les élèves en plus se répartissent les dossiers les plus chargés.`;
  }
}

/** La règle pour un atelier : une phrase par taille d'équipe que sa fiche conseille. */
export function repartitionDeLAtelier(args: {
  effectifParEquipe: string;
  niveau: number;
  scenario: EngineScenarioConfig;
}): string[] {
  const leviersRhOuverts = leviersDuResponsable("rh", args.niveau, args.scenario).length > 0;
  return effectifsConseilles(args.effectifParEquipe).map((n) =>
    repartitionSelonEffectif(n, { leviersRhOuverts }),
  );
}

/* ---------------------------------------------------------------------------
 * LA LISTE DE CONTRÔLE DE LA DIRECTION.
 * ------------------------------------------------------------------------- */

export interface PointDeControle {
  /** La question que la direction pose avant de valider. */
  question: string;
  /** Les leviers que la question cite, par champ : tous ouverts au niveau (garde). */
  leviers: string[];
  /** Les responsables à mettre d'accord. */
  entre: CodeDeResponsable[];
}

/**
 * La cohérence entre les quatre responsables, déduite des leviers que le
 * niveau ouvre : chaque ligne ne cite que des décisions que l'écran propose.
 * Une ligne qui demanderait d'accorder l'emprunt et l'investissement à un
 * niveau qui n'ouvre ni l'un ni l'autre enverrait la direction chercher deux
 * cases qui n'existent pas.
 */
export function listeDeControle(niveau: number, scenario: EngineScenarioConfig): PointDeControle[] {
  const ouverts = new Map(leviersDuNiveau(niveau, scenario).map((l) => [l.champ, l] as const));
  const a = (champ: string) => ouverts.has(champ);
  const nom = (champ: string) => ouverts.get(champ)!.nom.toLowerCase();
  const points: PointDeControle[] = [];

  // Le volume et ce qui le borne.
  if (a("productionPlan")) {
    const leviers = ["productionPlan", ...(a("hire") ? ["hire"] : []), ...(a("machineCapacityUnits") ? ["machineCapacityUnits"] : [])];
    points.push({
      question: `Le ${nom("productionPlan")} tient-il dans la capacité et dans les heures de l'équipe${a("hire") ? `, et si non, les ${nom("hire")} du tour ne produiront qu'au tour suivant` : ""}${a("machineCapacityUnits") ? `, comme l'${nom("machineCapacityUnits")}` : ""} ?`,
      leviers,
      entre: ["approvisionnement", ...(a("hire") ? (["rh"] as CodeDeResponsable[]) : [])],
    });
  }
  // Le prix et le marketing, face aux concurrents.
  if (a("price") && a("marketingBudget")) {
    points.push({
      question: `Le ${nom("price")} et le ${nom("marketingBudget")} racontent-ils la même chose à la clientèle visée, et où nous placent-ils face aux autres équipes qui vendent aux mêmes clients ?`,
      leviers: ["price", "marketingBudget"],
      entre: ["commercial"],
    });
  }
  // Ce qui sort de caisse avant de rapporter.
  if (a("hire") || a("machineCapacityUnits") || a("rdBudget")) {
    const leviers = ["hire", "machineCapacityUnits", "rdBudget", "newLoan"].filter(a);
    const cites = leviers.filter((c) => c !== "newLoan").map(nom);
    points.push({
      question: `${cites.join(", ")} : ce qui se paie ce tour et ne rapporte qu'au suivant tient-il dans la trésorerie prévue${a("newLoan") ? `, ou faut-il un ${nom("newLoan")}` : ", sachant que la banque ne propose pas d'emprunt à ce niveau"} ?`,
      leviers,
      entre: ["financier", ...(a("hire") ? (["rh"] as CodeDeResponsable[]) : []), "approvisionnement"],
    });
  }
  // Le fournisseur et la qualité.
  if (a("supplierChoice")) {
    points.push({
      question: a("qualityBudget")
        ? `Le ${nom("supplierChoice")} et le ${nom("qualityBudget")} vont-ils dans le même sens : un fournisseur moins cher et moins sûr demande plus de qualité pour tenir les rebuts ?`
        : `Le ${nom("supplierChoice")} se paie-t-il comptant ou à délai, et le responsable financier le sait-il ?`,
      leviers: ["supplierChoice", ...(a("qualityBudget") ? ["qualityBudget"] : [])],
      entre: ["approvisionnement", "financier"],
    });
  }
  // Les créances et la caisse.
  if (a("discount") || a("factoring")) {
    const leviers = ["discount", "factoring"].filter(a);
    points.push({
      question: `${leviers.map(nom).join(" ou ")} : mobiliser des créances coûte ; la caisse du tour en a-t-elle besoin, délais de règlement des clientèles compris ?`,
      leviers,
      entre: ["financier", "commercial"],
    });
  }
  // Le dividende et le résultat.
  if (a("dividend")) {
    points.push({
      question: `Le ${nom("dividend")} se prend sur les réserves des tours passés : le résultat des tours précédents le permet-il, et la caisse suit-elle ?`,
      leviers: ["dividend"],
      entre: ["financier"],
    });
  }
  // Payer maintenant pour gagner plus tard.
  if (a("rseBudget") || a("placement")) {
    const leviers = ["rseBudget", "rseInvestment", "placement"].filter(a);
    points.push({
      question: `${leviers.map(nom).join(", ")} : ces sommes quittent la caisse ce tour et ne reviennent qu'aux tours suivants ; les tours qui restent suffisent-ils pour qu'elles rapportent ?`,
      leviers,
      entre: ["financier", "approvisionnement"],
    });
  }
  // Une question commence par une majuscule, même quand elle s'ouvre sur le
  // nom d'un levier, que l'écran écrit en minuscules dans la phrase.
  return points.map((p) => ({ ...p, question: p.question.charAt(0).toUpperCase() + p.question.slice(1) }));
}

/** Les leviers du registre que personne ne tient, pour la garde. */
export function leviersSansRole(): LevierDeDecision[] {
  return LEVIERS.filter((l) => !(l.champ in LEVIERS_PAR_ROLE));
}
