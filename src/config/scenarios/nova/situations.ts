/**
 * Situations pédagogiques de NOVA (doc 03 §1, doc 07 §2).
 *
 * Principe §3 : le joueur rencontre d'abord une SITUATION d'entreprise et une
 * question OUVERTE — jamais « calculez le BFR ». Les indices (5 niveaux,
 * coûts croissants — doc 03 §4) mènent progressivement de l'observation à la
 * méthode. La matrice modelRelevance évalue la compétence « choisir le bon
 * modèle » (§7) : un modèle `misleading` mène au contresens classique.
 *
 * Les types et la mécanique (barème d'indices, question du modèle) vivent
 * dans ../situation-kit.ts : ici, uniquement le contenu de NOVA.
 */

import { attachModelQuestions, hints } from "../situation-kit";
import type {
  DecisionLever,
  DetectCode,
  ModelRelevance,
  QuizQuestionDef,
  SituationDef,
  SituationHintDef,
} from "../situation-kit";

export type {
  DecisionLever,
  DetectCode,
  ModelRelevance,
  QuizQuestionDef,
  SituationDef,
  SituationHintDef,
};

export const NOVA_SITUATIONS: SituationDef[] = [
  {
    code: "nova_t1_takeover",
    title: "Prise en main",
    narrative:
      "Vous venez de reprendre NOVA. L'ancien dirigeant vous laisse un atelier, quatre opérateurs, un produit apprécié, et un marché où SoundBox casse les prix pendant qu'Auris vise le haut de gamme.",
    problem:
      "Avant de fixer votre prix et votre production : de quoi votre entreprise a-t-elle besoin chaque période pour ne pas perdre d'argent ?",
    diagnosticOptions: [
      { id: "cover_fixed", label: "Vendre assez d'unités pour couvrir les charges de structure", correct: true },
      { id: "unit_margin", label: "Que chaque unité vendue rapporte plus que son coût variable", correct: true },
      { id: "max_volume", label: "Produire au maximum de la capacité, quoi qu'il arrive", correct: false },
      { id: "lowest_price", label: "Avoir le prix le plus bas du marché", correct: false },
    ],
    quiz: [
      {
        id: "unit_margin",
        prompt: "La marge sur coût variable unitaire, c'est…",
        options: [
          { id: "a", label: "Prix de vente − coût variable unitaire" },
          { id: "b", label: "Prix de vente − charges de structure" },
          { id: "c", label: "Chiffre d'affaires − résultat net" },
          { id: "d", label: "Prix de vente × quantités vendues" },
        ],
        correctOptionId: "a",
        explain:
          "Chaque unité vendue laisse (prix − coût variable) pour éponger les charges de structure, puis dégager du résultat.",
      },
      {
        id: "breakeven_formula",
        prompt: "Le seuil de rentabilité en volume se calcule…",
        options: [
          { id: "a", label: "Charges de structure ÷ marge sur coût variable unitaire" },
          { id: "b", label: "Chiffre d'affaires ÷ prix de vente" },
          { id: "c", label: "Charges de structure × marge unitaire" },
          { id: "d", label: "Capacité machine × taux d'utilisation" },
        ],
        correctOptionId: "a",
        explain:
          "Le seuil est le volume à partir duquel la marge dégagée couvre exactement les charges de structure : au-delà, chaque unité crée du résultat.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cvp_analysis: "acceptable",
      psych_pricing: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["revenue", "fixed_costs", "variable_costs", "contribution_margin", "breakeven"],
    hints: hints([
      "Regardez vos charges : certaines tombent chaque période, que vous vendiez ou non.",
      "Combien chaque enceinte vendue laisse-t-elle une fois ses coûts variables payés ?",
      "Il existe un volume de ventes précis à partir duquel vous cessez de perdre de l'argent.",
      "Une analyse du seuil de rentabilité donnerait un objectif chiffré à votre premier trimestre.",
      "Divisez les charges de structure par la marge sur coût variable unitaire (prix − 38 €) : c'est votre seuil en volume.",
    ]),
    trigger: { round: 1 },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "review", hint: "Le prix fixe la marge unitaire — et donc le nombre d'unités nécessaires pour couvrir les charges fixes." },
      { field: "productionPlan", direction: "review", hint: "Produire trop crée du stock mort ; produire trop peu fait perdre des ventes. Le seuil de rentabilité donne le plancher." },
    ],
  },
  {
    code: "nova_t2_price_war",
    title: "Le prix fait la demande",
    narrative:
      "Vos ventes du premier tour sont tombées. Sur le segment étudiant, SoundBox affiche un prix agressif et rafle des parts de marché, pendant que les passionnés, eux, n'ont presque pas bougé.",
    problem:
      "Pourquoi vos segments réagissent-ils si différemment, et comment fixer votre prix pour le prochain tour ?",
    diagnosticOptions: [
      { id: "elastic_students", label: "Les étudiants sont très sensibles au prix, les passionnés beaucoup moins", correct: true },
      { id: "psych_threshold", label: "Certains niveaux de prix (50 €, 60 €) agissent comme des seuils psychologiques", correct: true },
      { id: "quality_drop", label: "Notre qualité s'est effondrée d'un tour à l'autre", correct: false },
      { id: "market_shrink", label: "Le marché total est en train de disparaître", correct: false },
    ],
    quiz: [
      {
        id: "elasticity_calc",
        prompt:
          "Avec une élasticité-prix de −2, une baisse de prix de 5 % fait varier la demande d'environ…",
        options: [
          { id: "a", label: "+10 %" },
          { id: "b", label: "+2 %" },
          { id: "c", label: "+5 %" },
          { id: "d", label: "−10 %" },
        ],
        correctOptionId: "a",
        explain:
          "e = %ΔQ ÷ %ΔP : la variation de demande vaut l'élasticité × la variation de prix, soit −2 × (−5 %) = +10 %.",
      },
      {
        id: "psych_threshold",
        prompt: "Un seuil psychologique de prix, c'est…",
        options: [
          { id: "a", label: "Un niveau (50 €, 60 €…) au passage duquel la demande décroche brutalement" },
          { id: "b", label: "Le prix en dessous duquel la vente est interdite" },
          { id: "c", label: "Le coût de revient de l'unité" },
          { id: "d", label: "Le prix moyen pratiqué par les concurrents" },
        ],
        correctOptionId: "a",
        explain:
          "59,90 € et 60,10 € ne racontent pas la même histoire au client : franchir le seuil coûte bien plus que 20 centimes de demande.",
      },
    ],
    modelRelevance: {
      elasticity_analysis: "optimal",
      psych_pricing: "optimal",
      cvp_analysis: "acceptable",
      breakeven_analysis: "acceptable",
      relevant_costs: "irrelevant",
    },
    conceptCodes: ["price_elasticity", "psych_price", "segmentation", "demand_market_share"],
    hints: hints([
      "Comparez la baisse de vos ventes segment par segment : elle n'est pas uniforme.",
      "De combien vos ventes étudiantes ont-elles chuté, pour quel écart de prix avec SoundBox ?",
      "La sensibilité de la demande au prix porte un nom : elle se mesure, segment par segment.",
      "Une analyse d'élasticité, complétée par les seuils de prix psychologiques, éclairerait votre choix.",
      "Testez un prix juste sous un seuil (59,90 plutôt que 60) et estimez e = %ΔQ / %ΔP par segment pour choisir.",
    ]),
    trigger: { round: 2 },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "review", hint: "L'élasticité varie par segment : un même mouvement de prix n'a pas le même effet sur les étudiants et les passionnés." },
      { field: "marketingBudget", direction: "review", hint: "Le marketing amplifie l'attractivité, mais ne compense pas un prix mal positionné par rapport aux seuils psychologiques." },
    ],
  },
  {
    code: "nova_t3_capacity",
    title: "Produire n'est pas vendre",
    narrative:
      "La demande décolle : marketing, croissance du marché… et la chaîne CampusTech vous ouvre ses rayons. Mais l'atelier a plafonné et des clients sont repartis les mains vides.",
    problem:
      "Votre marché demande plus que vous ne produisez. Qu'est-ce qui limite réellement votre production, et que pouvez-vous y faire avant le pic de fin d'année ?",
    diagnosticOptions: [
      { id: "machine_limit", label: "La capacité machine (et sa disponibilité) plafonne la production", correct: true },
      { id: "anticipate_stock", label: "Il faut produire AVANT le pic pour constituer du stock", correct: true },
      { id: "price_too_low", label: "Le prix est trop bas, il suffit de l'augmenter fortement", correct: false },
      { id: "hire_sales", label: "Le problème vient du manque de commerciaux", correct: false },
    ],
    quiz: [
      {
        id: "real_constraint",
        prompt: "La production réellement possible sur un tour est limitée par…",
        options: [
          { id: "a", label: "La contrainte la plus serrée : capacité machine × disponibilité, ou heures de main-d'œuvre" },
          { id: "b", label: "Le plan de production décidé, quoi qu'il arrive" },
          { id: "c", label: "La demande du marché" },
          { id: "d", label: "Le budget marketing engagé" },
        ],
        correctOptionId: "a",
        explain:
          "On produit au minimum du plan ET des capacités : c'est toujours la contrainte la plus serrée qui décide, et la repérer est le premier réflexe.",
      },
      {
        id: "anticipation_stock",
        prompt: "Un stock d'anticipation sert à…",
        options: [
          { id: "a", label: "Produire avant le pic saisonnier pour servir une demande qui dépassera la capacité d'un tour" },
          { id: "b", label: "Faire baisser le besoin en fonds de roulement" },
          { id: "c", label: "Réduire le coût variable unitaire" },
          { id: "d", label: "Se protéger d'une hausse des taux d'intérêt" },
        ],
        correctOptionId: "a",
        explain:
          "Quand le pic dépasse la capacité d'un tour, la seule issue est de produire à l'avance : le stock immobilise du cash, mais il sauve les ventes.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      productivity_analysis: "acceptable",
      cvp_analysis: "acceptable",
      breakeven_analysis: "irrelevant",
      elasticity_analysis: "misleading",
    },
    conceptCodes: ["capacity", "stock", "seasonality", "productivity"],
    hints: hints([
      "Regardez la colonne « Manqué » de votre tableau de marché : ces clients voulaient acheter.",
      "Votre production a-t-elle atteint votre plan… ou votre plafond ?",
      "Capacité machine, disponibilité, main-d'œuvre : la contrainte la plus serrée décide de tout.",
      "Une analyse de capacité, croisée avec la saisonnalité, dirait quoi produire dès maintenant.",
      "Produisez au plafond dès ce tour pour stocker : le pic du tour 4 dépassera largement vos 7 000 unités.",
    ]),
    trigger: { round: 3 },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "up", hint: "Produire au plafond AVANT le pic constitue le stock qui servira la demande quand la capacité d'un tour ne suffira plus." },
      { field: "maintenanceBudget", direction: "review", hint: "La disponibilité machine dépend de la maintenance : négliger l'entretien réduit la capacité réelle." },
    ],
  },
  {
    code: "nova_t4_paradox",
    title: "Le paradoxe du succès",
    narrative:
      "Trimestre record : le pic saisonnier et la grosse commande CampusTech gonflent votre chiffre d'affaires, le résultat est positif… et pourtant votre banquier appelle : le compte vire au rouge.",
    problem:
      "Votre entreprise gagne de l'argent mais n'en a plus en caisse. Identifiez les causes possibles de ce paradoxe.",
    diagnosticOptions: [
      { id: "receivables", label: "CampusTech paie à 80 jours : le CA est devenu des créances, pas du cash", correct: true },
      { id: "bfr_growth", label: "La croissance gonfle le besoin en fonds de roulement plus vite que les ressources", correct: true },
      { id: "fake_profit", label: "Le résultat comptable est faux, il faut le recalculer", correct: false },
      { id: "too_much_marketing", label: "Le budget marketing a vidé la caisse à lui seul", correct: false },
    ],
    quiz: [
      {
        id: "tn_formula",
        prompt: "La trésorerie nette est égale à…",
        options: [
          { id: "a", label: "FRNG − BFR" },
          { id: "b", label: "FRNG + BFR" },
          { id: "c", label: "Chiffre d'affaires − charges décaissées" },
          { id: "d", label: "Résultat net + amortissements" },
        ],
        correctOptionId: "a",
        explain:
          "TN = FRNG − BFR : quand la croissance gonfle le BFR plus vite que le FRNG, la caisse se vide, même en gagnant de l'argent.",
      },
      {
        id: "mobilize_receivables",
        prompt: "L'escompte et l'affacturage permettent de…",
        options: [
          { id: "a", label: "Transformer des créances clients en cash immédiat, contre un coût financier" },
          { id: "b", label: "Réduire les charges de structure" },
          { id: "c", label: "Augmenter le résultat net" },
          { id: "d", label: "Reporter le paiement des fournisseurs" },
        ],
        correctOptionId: "a",
        explain:
          "Mobiliser le poste clients avance l'encaissement : la créance devient du cash aujourd'hui, moyennant agios (escompte) ou commission (affacturage).",
      },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      cash_budget: "optimal",
      breakeven_analysis: "misleading",
      return_analysis: "irrelevant",
      cvp_analysis: "irrelevant",
    },
    conceptCodes: ["frng", "bfr", "net_treasury", "receivables_financing", "loan_schedule"],
    hints: hints([
      "Examinez ce qui a le plus évolué à votre bilan depuis le tour dernier.",
      "Quel élément du cycle d'exploitation (stocks, créances clients, dettes fournisseurs) a explosé ?",
      "Réfléchissez au financement du cycle d'exploitation : qui avance l'argent entre la vente et l'encaissement ?",
      "Une analyse FRNG / BFR décomposerait votre trésorerie et montrerait où elle est partie.",
      "Calculez le FRNG (ressources stables − immobilisations), puis le BFR (stocks + créances − fournisseurs) : TN = FRNG − BFR. Levier : emprunt, ou négocier les délais.",
    ]),
    trigger: { round: 4 },
    weight: 1.5,
    decisionLevers: [
      { field: "price", direction: "review", hint: "Le prix détermine le délai d'encaissement via le volume vendu : plus de ventes, plus de créances." },
      { field: "productionPlan", direction: "review", hint: "Chaque unité produite mobilise du cash (matières, main-d'œuvre) bien avant l'encaissement de la vente." },
    ],
  },
  {
    code: "nova_t5_returns",
    title: "Gagner de l'argent… ou être rentable ?",
    narrative:
      "Le contrecoup saisonnier tasse les ventes et les matières premières ont renchéri de 20 %. En comité, on compare : Auris affiche un résultat plus faible que d'autres, mais avec deux fois moins de capitaux engagés.",
    problem:
      "Entre « gagner beaucoup » et « bien utiliser l'argent investi », comment jugez-vous vraiment une performance ?",
    diagnosticOptions: [
      { id: "relative_to_capital", label: "Un résultat se juge par rapport aux capitaux engagés pour l'obtenir", correct: true },
      { id: "margin_squeeze", label: "La hausse des matières comprime la marge sur coût variable et relève le seuil", correct: true },
      { id: "big_profit_wins", label: "Le plus gros résultat en euros est toujours la meilleure performance", correct: false },
      { id: "cut_all_costs", label: "Il faut couper tous les budgets pour restaurer le résultat", correct: false },
    ],
    quiz: [
      {
        id: "return_economic",
        prompt: "La rentabilité économique rapporte…",
        options: [
          { id: "a", label: "Le résultat d'exploitation net d'IS aux capitaux engagés (capitaux propres + dettes)" },
          { id: "b", label: "Le résultat net au chiffre d'affaires" },
          { id: "c", label: "Le chiffre d'affaires au total du bilan" },
          { id: "d", label: "La marge unitaire au prix de vente" },
        ],
        correctOptionId: "a",
        explain:
          "La rentabilité économique juge la performance de l'outil de production, indépendamment de la manière dont il est financé.",
      },
      {
        id: "profitability_def",
        prompt: "La profitabilité, elle, rapporte…",
        options: [
          { id: "a", label: "Le résultat au chiffre d'affaires" },
          { id: "b", label: "Le résultat aux capitaux engagés" },
          { id: "c", label: "Le chiffre d'affaires aux capitaux propres" },
          { id: "d", label: "Les dividendes au résultat" },
        ],
        correctOptionId: "a",
        explain:
          "Profitabilité (résultat ÷ CA) et rentabilité (résultat ÷ capitaux) ne racontent pas la même histoire : 20 000 € gagnés avec 200 000 € investis battent 30 000 € avec 500 000 €.",
      },
    ],
    modelRelevance: {
      return_analysis: "optimal",
      breakeven_analysis: "acceptable",
      cvp_analysis: "acceptable",
      frng_bfr_analysis: "irrelevant",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["profitability_vs_return", "contribution_margin", "breakeven", "margin_rates"],
    hints: hints([
      "Deux entreprises, deux résultats, deux tailles de bilan : que compare-t-on vraiment ?",
      "20 000 € de résultat avec 200 000 € investis, est-ce mieux que 30 000 € avec 500 000 € ?",
      "Rapporter le résultat au CA (profitabilité) ou aux capitaux (rentabilité) ne raconte pas la même histoire.",
      "Une analyse de rentabilité (économique et financière) départagerait les performances.",
      "Calculez Re = REX net d'IS / (capitaux propres + dettes) et Rf = résultat net / capitaux propres, et recalculez votre seuil avec le nouveau coût matière.",
    ]),
    trigger: { round: 5 },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "review", hint: "Le prix agit sur la marge ET sur le volume : la rentabilité se joue sur le couple, pas sur l'un seul." },
      { field: "qualityBudget", direction: "review", hint: "La qualité soutient le prix et la fidélité, mais chaque euro de budget qualité pèse sur la rentabilité immédiate." },
    ],
  },
  {
    code: "nova_t6_final",
    title: "Le grand oral",
    narrative:
      "Dernier tour : votre conseil d'administration attend un cap assumé. Consolider la marge ? Défendre la part de marché ? Reconstituer la trésorerie ? Tout, vous ne pourrez pas.",
    problem:
      "Quel arbitrage final choisissez-vous, et surtout : sur quels critères le défendez-vous ?",
    diagnosticOptions: [
      { id: "explicit_criteria", label: "Un bon arbitrage explicite ses critères et leurs pondérations", correct: true },
      { id: "coherent_story", label: "Les décisions doivent être cohérentes avec le positionnement tenu depuis le début", correct: true },
      { id: "copy_leader", label: "Copier la stratégie du leader du classement suffit", correct: false },
      { id: "last_round_max", label: "Au dernier tour, seul le résultat immédiat compte, peu importe le bilan", correct: false },
    ],
    quiz: [
      {
        id: "matrix_def",
        prompt: "Arbitrer avec une matrice multicritère, c'est…",
        options: [
          { id: "a", label: "Noter chaque option sur des critères explicites et pondérés, puis comparer les totaux" },
          { id: "b", label: "Copier l'option choisie par le leader du classement" },
          { id: "c", label: "Ne retenir qu'un seul critère : le résultat immédiat" },
          { id: "d", label: "Faire voter l'équipe à main levée" },
        ],
        correctOptionId: "a",
        explain:
          "Expliciter critères et pondérations rend l'arbitrage défendable : on peut être en désaccord sur les poids, plus sur la démarche.",
      },
      {
        id: "safety_margin",
        prompt: "La marge de sécurité mesure…",
        options: [
          { id: "a", label: "L'écart entre le chiffre d'affaires et le seuil de rentabilité" },
          { id: "b", label: "Le stock restant en fin de tour" },
          { id: "c", label: "L'écart de prix avec le concurrent le moins cher" },
          { id: "d", label: "Le découvert autorisé encore disponible" },
        ],
        correctOptionId: "a",
        explain:
          "Plus le CA est loin au-dessus du seuil, mieux l'entreprise encaisse les chocs : c'est un critère de solidité pour l'arbitrage final.",
      },
    ],
    modelRelevance: {
      multicriteria_matrix: "optimal",
      scenarios_method: "acceptable",
      sensitivity_analysis: "acceptable",
      cvp_analysis: "acceptable",
    },
    conceptCodes: ["profitability_vs_return", "safety_margin", "demand_market_share"],
    hints: hints([
      "Relisez votre trajectoire : où avez-vous gagné, où avez-vous souffert ?",
      "Quels critères comptent pour VOTRE entreprise aujourd'hui : marge, part de marché, trésorerie ?",
      "Quand plusieurs critères se disputent une décision, il faut les pondérer explicitement.",
      "Une matrice multicritère structurerait votre arbitrage final.",
      "Listez 3 options, notez-les de 1 à 5 sur marge / part de marché / trésorerie, pondérez selon votre situation, choisissez la meilleure note pondérée.",
    ]),
    trigger: { round: 6 },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "review", hint: "Le prix est le levier le plus visible : il traduit votre positionnement et engage le résultat." },
      { field: "productionPlan", direction: "review", hint: "Dernier tour : le stock final est perdu. Ajustez la production au plus près de la demande attendue." },
      { field: "marketingBudget", direction: "review", hint: "Investir en marketing au dernier tour ne rapporte que si l'effet est immédiat : arbitrage court terme." },
    ],
  },

  // --- Situations détectées (doc 03 §1.1) -------------------------------
  {
    code: "detect_profitable_illiquid",
    title: "Bénéficiaire… mais à découvert",
    narrative:
      "Vos comptes du tour écoulé affichent un résultat positif, et pourtant votre trésorerie nette est passée dans le rouge.",
    problem: "Comment expliquer qu'une entreprise qui gagne de l'argent se retrouve à découvert ?",
    diagnosticOptions: [
      { id: "cash_vs_profit", label: "Le résultat est comptable ; la trésorerie dépend des encaissements réels", correct: true },
      { id: "bfr_up", label: "Stocks et créances ont absorbé le cash (BFR en hausse)", correct: true },
      { id: "accounting_error", label: "C'est forcément une erreur de calcul", correct: false },
    ],
    quiz: [
      {
        id: "profit_vs_cash",
        prompt: "Le résultat peut être positif quand la caisse est vide parce que…",
        options: [
          { id: "a", label: "Le résultat enregistre des ventes non encore encaissées et des charges non encore décaissées" },
          { id: "b", label: "Le résultat comptable est une estimation forcément fausse" },
          { id: "c", label: "La banque prélève le résultat en fin de période" },
          { id: "d", label: "Les amortissements vident la caisse chaque tour" },
        ],
        correctOptionId: "a",
        explain:
          "Le résultat suit les flux COMPTABLES, la trésorerie les flux ENCAISSÉS : entre les deux vivent créances, stocks et dettes fournisseurs.",
      },
      {
        id: "bfr_cash_link",
        prompt: "À FRNG constant, une hausse du BFR…",
        options: [
          { id: "a", label: "Fait baisser la trésorerie nette d'autant" },
          { id: "b", label: "Fait monter la trésorerie nette" },
          { id: "c", label: "Ne change rien à la trésorerie" },
          { id: "d", label: "Augmente mécaniquement le résultat" },
        ],
        correctOptionId: "a",
        explain:
          "TN = FRNG − BFR : chaque euro immobilisé en plus dans le cycle d'exploitation est un euro de moins en caisse.",
      },
    ],
    modelRelevance: { frng_bfr_analysis: "optimal", cash_budget: "acceptable", breakeven_analysis: "misleading" },
    conceptCodes: ["net_treasury", "bfr", "frng"],
    hints: hints([
      "Comparez l'évolution de votre résultat et celle de votre trésorerie : elles divergent.",
      "Où est passé l'argent des ventes que vous avez pourtant réalisées ?",
      "Vendre n'est pas encaisser : le cycle d'exploitation immobilise des fonds.",
      "L'analyse FRNG / BFR est l'outil de ce diagnostic.",
      "TN = FRNG − BFR : calculez les deux termes et regardez lequel a bougé.",
    ]),
    trigger: { detect: "profitable_illiquid" },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "review", hint: "Chaque unité produite immobilise du cash en stocks et créances : produire moins réduit le BFR." },
      { field: "price", direction: "up", hint: "Un prix plus élevé réduit le volume à servir et accélère la couverture du BFR par euro vendu." },
    ],
  },
  {
    code: "detect_stockout",
    title: "Des clients repartis sans acheter",
    narrative:
      "Au tour écoulé, une part importante de la demande qui vous était adressée n'a pas pu être servie : votre stock était vide.",
    problem: "Que vous coûte réellement une rupture, et comment l'éviter au prochain tour ?",
    diagnosticOptions: [
      { id: "lost_margin", label: "Chaque vente manquée est une marge perdue et un client déçu", correct: true },
      { id: "plan_ahead", label: "Le plan de production doit anticiper la demande, pas la suivre", correct: true },
      { id: "good_sign", label: "Une rupture prouve que tout va bien puisque tout est vendu", correct: false },
    ],
    quiz: [
      {
        id: "stockout_cost",
        prompt: "Le premier coût d'une rupture de stock, c'est…",
        options: [
          { id: "a", label: "La marge sur coût variable des ventes manquées, et des clients déçus" },
          { id: "b", label: "Le coût de production des unités déjà vendues" },
          { id: "c", label: "Une pénalité automatiquement versée aux fournisseurs" },
          { id: "d", label: "Aucun : tout vendre est la preuve d'un succès" },
        ],
        correctOptionId: "a",
        explain:
          "Chaque unité non servie emportait sa marge sur coût variable, et un client déçu se souvient, ce qui pèse sur la demande future.",
      },
      {
        id: "avoid_stockout",
        prompt: "Pour éviter la rupture au prochain pic de demande…",
        options: [
          { id: "a", label: "Produire à l'avance pour constituer un stock, dans la limite des capacités" },
          { id: "b", label: "Attendre le pic et produire à ce moment-là" },
          { id: "c", label: "Baisser le prix pour vendre encore plus vite" },
          { id: "d", label: "Réduire le budget marketing" },
        ],
        correctOptionId: "a",
        explain:
          "Le plan de production doit ANTICIPER la demande, pas la suivre : le pic dépasse la capacité d'un tour, le stock se construit avant.",
      },
    ],
    modelRelevance: { capacity_analysis: "optimal", cvp_analysis: "acceptable", elasticity_analysis: "misleading" },
    conceptCodes: ["stock", "capacity", "seasonality"],
    hints: hints([
      "La colonne « Manqué » de votre marché n'est pas anecdotique ce tour-ci.",
      "Votre production a-t-elle suivi la demande… ou le plan de la période passée ?",
      "Un stock d'anticipation se construit avant que la demande n'arrive.",
      "Une analyse de capacité croisée avec la saisonnalité dimensionnerait votre plan.",
      "Planifiez production = demande prévue × (1 + marge de sécurité) dans la limite de vos capacités, en produisant l'excédent un tour avant le pic.",
    ]),
    trigger: { detect: "stockout" },
    weight: 0.8,
    decisionLevers: [
      { field: "productionPlan", direction: "up", hint: "Planifiez au-dessus de la demande attendue pour constituer un stock de sécurité avant le pic." },
      { field: "maintenanceBudget", direction: "review", hint: "La capacité réelle dépend de la disponibilité machine : un entretien négligé ampute la production." },
    ],
  },
  {
    code: "detect_below_breakeven",
    title: "Sous la ligne de flottaison",
    narrative: "Le tour écoulé s'est soldé par une perte : vos ventes n'ont pas couvert vos charges.",
    problem: "Votre entreprise perd de l'argent. Où se situe le problème : volume, prix, ou coûts ?",
    diagnosticOptions: [
      { id: "under_threshold", label: "Le volume vendu est resté sous le seuil de rentabilité", correct: true },
      { id: "check_margin", label: "Il faut vérifier la marge sur coût variable et le poids des fixes", correct: true },
      { id: "always_lower_price", label: "Baisser le prix augmente toujours le résultat", correct: false },
    ],
    quiz: [
      {
        id: "under_threshold_meaning",
        prompt: "Être sous le seuil de rentabilité signifie que…",
        options: [
          { id: "a", label: "La marge sur coût variable dégagée ne couvre pas les charges de structure" },
          { id: "b", label: "Le prix est inférieur au coût variable unitaire" },
          { id: "c", label: "La trésorerie est négative" },
          { id: "d", label: "La capacité de production est saturée" },
        ],
        correctOptionId: "a",
        explain:
          "Sous le seuil, chaque période détruit du résultat : les unités vendues rapportent, mais pas assez pour payer la structure.",
      },
      {
        id: "lower_threshold",
        prompt: "Pour abaisser le seuil de rentabilité, on peut…",
        options: [
          { id: "a", label: "Réduire les charges de structure ou augmenter la marge unitaire (prix, coûts variables)" },
          { id: "b", label: "Produire davantage d'unités" },
          { id: "c", label: "Allonger les délais de paiement accordés aux clients" },
          { id: "d", label: "Emprunter davantage" },
        ],
        correctOptionId: "a",
        explain:
          "SR = charges de structure ÷ marge unitaire : seuls les deux termes de la fraction déplacent le seuil ; le volume, lui, dit où vous êtes PAR RAPPORT au seuil.",
      },
    ],
    modelRelevance: { breakeven_analysis: "optimal", cvp_analysis: "optimal", frng_bfr_analysis: "irrelevant" },
    conceptCodes: [
      "breakeven",
      "contribution_margin",
      "fixed_costs",
      "safety_margin",
      // Le seuil dit COMBIEN vendre, le point mort dit QUAND on y arrive. Un
      // écart de volume reste abstrait ; « le trimestre s'est terminé avant
      // que vous n'atteigniez l'équilibre » ne l'est pas.
      "dead_point",
    ],
    hints: hints([
      "Comparez vos unités vendues à celles qu'il aurait fallu vendre pour équilibrer.",
      "Votre marge unitaire couvre-t-elle, multipliée par vos ventes, vos charges de structure ?",
      "Traduisez l'écart en jours : (seuil en valeur ÷ chiffre d'affaires) × la durée du tour donne la date à laquelle vous auriez atteint l'équilibre. Au-delà de la fin du tour, vous ne l'avez jamais atteint.",
      "Une analyse coût-volume-profit montrerait quel levier (prix, volume, coûts) est le plus efficace.",
      "SR = fixes / (prix − coût variable unitaire) : jouez chaque levier dans la formule et comparez.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 0.8,
    decisionLevers: [
      { field: "price", direction: "up", hint: "Augmenter le prix relève la marge unitaire et abaisse le seuil de rentabilité — si la demande suit." },
      { field: "productionPlan", direction: "review", hint: "Produire au-delà du volume vendable crée du stock et aggrave la perte : ajustez au volume réaliste." },
      { field: "marketingBudget", direction: "review", hint: "Le marketing pèse dans les charges fixes : chaque euro doit être comparé au volume de ventes supplémentaire qu'il génère." },
    ],
  },
  {
    code: "detect_capacity_saturated",
    title: "L'atelier au taquet",
    narrative:
      "Vos machines ont tourné à plein régime, et pourtant des clients sont repartis les mains vides. Votre équipementier propose 2 000 unités de capacité trimestrielle supplémentaire pour 40 000 €, amortis sur 16 trimestres. Un sous-traitant, lui, facture 52 € l'unité finie. Chaque enceinte vendue 59 € dégage environ 21 € de marge sur coût variable.",
    problem:
      "Investir, sous-traiter, ou laisser filer la demande : sur quel CALCUL fondez-vous la réponse, plutôt que sur l'intuition ?",
    diagnosticOptions: [
      { id: "npv_compare", label: "Comparer le coût d'aujourd'hui aux flux futurs ACTUALISÉS qu'il génère", correct: true },
      { id: "lost_margin", label: "Les ventes manquées sont un manque à gagner mesurable : unités perdues × marge sur coût variable", correct: true },
      { id: "count_depreciation", label: "Compter l'amortissement comme un décaissement dans les flux du projet", correct: false },
      { id: "full_book", label: "Investir dès que le carnet est plein, le calcul se fera après", correct: false },
    ],
    quiz: [
      {
        id: "discounting_def",
        prompt: "Actualiser un flux futur, c'est…",
        options: [
          { id: "a", label: "Le convertir en euros d'aujourd'hui en le divisant par (1 + taux)ⁿ" },
          { id: "b", label: "Le corriger de l'inflation passée" },
          { id: "c", label: "L'augmenter des intérêts à recevoir" },
          { id: "d", label: "Le remplacer par sa valeur comptable" },
        ],
        correctOptionId: "a",
        explain:
          "Un euro dans un an vaut moins qu'un euro aujourd'hui : l'actualisation ramène tous les flux à la même date pour pouvoir les comparer.",
      },
      {
        id: "npv_rule",
        prompt: "Selon le critère de la VAN, on investit quand…",
        options: [
          { id: "a", label: "La VAN est positive : les flux futurs actualisés dépassent le capital investi" },
          { id: "b", label: "Le TRI est inférieur au taux d'emprunt" },
          { id: "c", label: "Le carnet de commandes est plein" },
          { id: "d", label: "L'amortissement de l'ancienne machine est terminé" },
        ],
        correctOptionId: "a",
        explain:
          "VAN > 0 : le projet rapporte plus que ce qu'il coûte, taux de financement compris. Le TRI, lui, doit être SUPÉRIEUR au taux pour dire oui.",
      },
    ],
    modelRelevance: {
      npv: "optimal",
      irr: "acceptable",
      relevant_costs: "acceptable",
      marginal_analysis: "acceptable",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["discounting", "irr_payback", "capacity", "contribution_margin"],
    hints: hints([
      "Regardez vos ventes manquées : chaque unité non servie emportait sa marge sur coût variable.",
      "L'investissement coûte aujourd'hui ; ses gains tombent sur plusieurs tours. Comment comparer des euros d'aujourd'hui et des euros de demain ?",
      "Un euro dans un an vaut moins qu'un euro aujourd'hui : c'est l'actualisation, et votre taux d'emprunt donne le taux de référence.",
      "La VAN actualise les flux futurs et les compare au capital investi ; le TRI est le taux qui l'annule ; les coûts pertinents comparent investir et sous-traiter.",
      "VAN ≈ −40 000 + Σ (unités supplémentaires vendues × 21 €) / (1 + 1,25 %)^t sur 16 trimestres. VAN > 0 ⇒ investissez ; sinon comparez à la sous-traitance : 59 − 52 = 7 € de marge par unité sous-traitée, sans immobiliser un euro.",
    ]),
    trigger: { detect: "capacity_saturated" },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "up", hint: "Poussez la production au plafond disponible pour ne pas laisser de marge sur la table." },
      { field: "maintenanceBudget", direction: "up", hint: "La maintenance augmente la disponibilité machine : chaque point gagné libère des unités supplémentaires." },
      { field: "price", direction: "review", hint: "Si la demande dépasse durablement la capacité, un prix plus élevé rationalise les ventes et améliore la marge." },
    ],
  },
  {
    code: "detect_idle_cash",
    title: "L'argent qui dort",
    narrative:
      "Le trimestre s'est bien passé. Votre compte affiche plus d'un tour et demi de charges de structure, aucun découvert, et cet argent ne fait rien. Votre banquier propose de placer une partie du solde : il vous le bloque jusqu'au trimestre suivant et vous le rend avec 2 % l'an. Le même banquier facture votre découvert 9 %.",
    problem:
      "Cet argent qui dort, faut-il le placer, et jusqu'à quel montant ?",
    diagnosticOptions: [
      {
        id: "cout_opportunite",
        label: "Une trésorerie qui dort ne coûte rien, mais ne rapporte rien non plus : c'est un manque à gagner",
        correct: true,
      },
      {
        id: "garder_de_quoi_payer",
        label: "Le montant bloqué ne pourra payer aucune facture du trimestre : il faut d'abord chiffrer ce qui va sortir",
        correct: true,
      },
      {
        id: "tout_placer",
        label: "Puisque le placement rapporte, autant y mettre la totalité du solde",
        correct: false,
      },
      {
        id: "ameliore_exploitation",
        label: "Placer améliore le résultat d'exploitation de l'entreprise",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "nova_placement_exces",
        prompt: "Placer la totalité de sa trésorerie expose l'entreprise à…",
        options: [
          { id: "a", label: "Ouvrir un découvert à 9 % tout en détenant un placement à 2 %" },
          { id: "b", label: "Perdre le capital placé si le trimestre est mauvais" },
          { id: "c", label: "Un redressement fiscal sur les produits financiers" },
          { id: "d", label: "Une baisse mécanique de son chiffre d'affaires" },
        ],
        correctOptionId: "a",
        explain:
          "Le placement est bloqué : il ne paie rien pendant le tour. Si les décaissements dépassent ce qui reste en caisse, la banque ouvre un découvert, et vous payez d'un côté quatre fois ce que vous gagnez de l'autre.",
      },
      {
        id: "nova_produits_financiers",
        prompt: "Les intérêts d'un placement apparaissent au compte de résultat…",
        options: [
          { id: "a", label: "En produits financiers, donc sous le résultat d'exploitation" },
          { id: "b", label: "En chiffre d'affaires, comme toute recette" },
          { id: "c", label: "En diminution des charges de structure" },
          { id: "d", label: "Nulle part : ils ne touchent que la trésorerie" },
        ],
        correctOptionId: "a",
        explain:
          "Le résultat d'exploitation mesure le métier, pas la gestion de la trésorerie. Bien placer améliore le résultat NET sans rien changer à la performance de l'atelier, et c'est très bien ainsi : les deux se jugent séparément.",
      },
    ],
    modelRelevance: {
      cash_budget: "optimal",
      breakeven_analysis: "misleading",
      frng_bfr_analysis: "acceptable",
      npv: "acceptable",
    },
    conceptCodes: ["net_treasury", "frng", "bfr", "profitability_vs_return"],
    hints: hints([
      "Comparez votre solde de trésorerie aux charges de structure d'un seul trimestre : de combien de tours d'avance disposez-vous ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro.",
      "Attention : le placement est bloqué jusqu'au tour suivant. Il ne réglera ni les matières, ni les salaires, ni l'échéance d'emprunt de ce trimestre.",
      "Projetez donc les décaissements du tour à venir avant de décider du montant : c'est un budget de trésorerie, même sommaire.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte quatre fois ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ]),
    trigger: { detect: "idle_cash" },
    weight: 0.8,
    decisionLevers: [
      { field: "productionPlan", direction: "review", hint: "Le plan de production détermine les décaissements du tour : projetez-les avant de décider combien placer." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Question « quel modèle d'analyse mobilisez-vous ? » — même forme QCM que le
// reste (pas de liste déroulante) : jusqu'à 4 options tirées de la matrice de
// pertinence de la situation, notées en crédit partiel (§7). Ajoutée en
// dernière question du QCM de chaque situation.
// ---------------------------------------------------------------------------

const MODEL_EXPLAIN: Record<string, string> = {
  detect_idle_cash:
    "Le budget de trésorerie projette les décaissements du tour à venir : il est le seul à dire quelle part du solde peut être bloquée sans risquer le découvert. Le seuil de rentabilité, lui, ne parle jamais de trésorerie.",
  nova_t1_takeover:
    "Le seuil de rentabilité donne un objectif chiffré au premier trimestre : le volume de ventes qui couvre exactement les charges de structure.",
  nova_t2_price_war:
    "L'analyse de l'élasticité (avec les seuils psychologiques) mesure la sensibilité de CHAQUE segment au prix, la clé quand ils réagissent différemment.",
  nova_t3_capacity:
    "L'analyse de capacité identifie la contrainte qui plafonne la production et, croisée avec la saisonnalité, dit quoi produire dès maintenant.",
  nova_t4_paradox:
    "L'analyse FRNG / BFR (ou le budget de trésorerie) décompose la trésorerie et montre où l'argent est parti ; le seuil de rentabilité, lui, ne parle que du résultat.",
  nova_t5_returns:
    "L'analyse de rentabilité rapporte le résultat aux capitaux engagés : c'est elle qui départage deux performances de tailles différentes.",
  nova_t6_final:
    "La matrice multicritère structure l'arbitrage : critères explicites, pondérations assumées, options comparées sur la même grille.",
  detect_profitable_illiquid:
    "L'analyse FRNG / BFR est l'outil de ce diagnostic : TN = FRNG − BFR, et l'un des deux termes a bougé.",
  detect_stockout:
    "L'analyse de capacité, croisée avec la saisonnalité, dimensionne un plan de production qui anticipe la demande au lieu de la subir.",
  detect_below_breakeven:
    "Le seuil de rentabilité (et l'analyse coût-volume-profit) dit combien il faut vendre, et quel levier (prix, volume, coûts) est le plus efficace.",
  detect_capacity_saturated:
    "La VAN compare le coût d'aujourd'hui aux flux futurs actualisés ; le seuil de rentabilité, trompeur ici, ignore le temps.",
};

attachModelQuestions(NOVA_SITUATIONS, MODEL_EXPLAIN);

export const situationByCode = new Map(NOVA_SITUATIONS.map((s) => [s.code, s]));
