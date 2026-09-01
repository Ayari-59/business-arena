import { attachModelQuestions, hints, type DecisionLever, type SituationCategory, type SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques d'ATLAS CONSEIL (services intellectuels).
 *
 * Le fil rouge du secteur : le taux d'occupation et le poste clients. La
 * capacité ne s'achète pas, elle se recrute ; et le résultat ne devient de
 * la trésorerie que soixante jours plus tard.
 */
export const CONSEIL_SITUATIONS: SituationDef[] = [
  {
    code: "conseil_t1_reprise",
    category: "prise_de_poste",
    title: "Douze consultants et un carnet",
    narrative:
      "Vous prenez la direction d'ATLAS CONSEIL : douze consultants, un carnet de commandes correct, 180 000 € de factures en attente de règlement et presque rien à l'actif immobilisé. Le trimestre offre 720 jours-consultants à vendre.",
    problem:
      "Dans un cabinet, qu'est-ce qui détermine le résultat, et pourquoi le chiffre d'affaires ne suffit-il pas à le dire ?",
    diagnosticOptions: [
      {
        id: "utilization",
        label: "Le taux d'occupation : la part des jours disponibles réellement facturés",
        correct: true,
      },
      {
        id: "rigid_costs",
        label: "Les salaires tombent que les consultants soient staffés ou sur le banc",
        correct: true,
      },
      {
        id: "headcount",
        label: "Le nombre de consultants, indépendamment de ce qu'ils facturent",
        correct: false,
      },
      {
        id: "revenue_only",
        label: "Le chiffre d'affaires seul suffit à juger la performance",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "capacite_jours",
        prompt:
          "Douze consultants disposant chacun de 60 jours ouvrés par trimestre : quelle est la capacité vendable ?",
        options: [
          { id: "a", label: "720 jours" },
          { id: "b", label: "1 440 jours" },
          { id: "c", label: "60 jours" },
          { id: "d", label: "Illimitée : il suffit de faire des heures supplémentaires" },
        ],
        correctOptionId: "a",
        explain:
          "12 × 60 = 720 jours. Cette capacité expire chaque trimestre : un jour non vendu ne se reporte pas, exactement comme une chambre d'hôtel vide.",
      },
      {
        id: "taux_equilibre",
        prompt:
          "Avec 470 € de marge par jour vendu et 198 000 € de charges de structure décaissées, quel taux d'occupation faut-il atteindre pour équilibrer ?",
        options: [
          { id: "a", label: "Environ 58 % (421 jours sur 720)" },
          { id: "b", label: "Environ 100 % (720 jours sur 720)" },
          { id: "c", label: "Environ 30 % (216 jours sur 720)" },
          { id: "d", label: "Environ 80 % (576 jours sur 720)" },
        ],
        correctOptionId: "a",
        explain:
          "198 000 ÷ 470 ≈ 421 jours, soit 58 % de 720. En ajoutant la prospection et l'outillage, le seuil réel monte vers 65 % : sous ce niveau, le cabinet perd de l'argent quelle que soit la qualité de ses missions.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      capacity_analysis: "acceptable",
      cvp_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["capacity", "contribution_margin", "fixed_costs", "breakeven"],
    hints: hints([
      "Comptez d'abord ce que le cabinet peut vendre : combien de consultants, combien de jours ouvrés chacun ?",
      "Un jour de consultant non vendu ne se rattrape pas au trimestre suivant : il disparaît.",
      "Vos charges de structure sont pour l'essentiel des SALAIRES : elles ne baissent pas quand le carnet se vide.",
      "Marge par jour = 560 − 90 = 470 €. Charges de structure décaissées = 198 000 € par trimestre.",
      "Seuil = 198 000 ÷ 470 ≈ 421 jours sur 720, soit 58 % d'occupation. Le taux d'occupation est au conseil ce que le taux de remplissage est à l'hôtellerie.",
    ]),
    trigger: { round: 1 },
    weight: 1,
    decisionLevers: [
      {
        field: "productionPlan",
        direction: "review",
        hint: "Évaluez combien de jours-consultants vous pouvez réellement vendre ce trimestre : un jour non vendu ne se rattrape pas, et c'est là que se joue votre résultat.",
      },
      {
        field: "price",
        direction: "review",
        hint: "Votre TJM détermine la marge par jour vendu. Vérifiez qu'il couvre bien vos charges de structure une fois rapportées au nombre de jours facturables.",
      },
    ],
  },
  {
    code: "conseil_t2_creances",
    category: "contexte_marche",
    title: "Soixante jours d'attente",
    narrative:
      "Vos grands comptes règlent à 60 jours, le secteur public aussi. Les missions sont livrées, les factures émises, le résultat est bon. Votre compte bancaire, lui, ne suit pas : 180 000 € dorment en créances.",
    problem:
      "Comment un cabinet sans stock ni machines peut-il avoir un besoin de financement aussi lourd ?",
    diagnosticOptions: [
      {
        id: "receivables_are_bfr",
        label: "Dans les services, le poste clients EST le besoin en fonds de roulement",
        correct: true,
      },
      {
        id: "salaries_first",
        label: "Les salaires se paient chaque mois, les clients paient deux mois plus tard : le décalage se finance",
        correct: true,
      },
      {
        id: "no_bfr",
        label: "Sans stock, un cabinet n'a pas de besoin en fonds de roulement",
        correct: false,
      },
      {
        id: "grow_out",
        label: "Il suffit de croître pour résorber le problème",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "bfr_services",
        prompt: "Le besoin en fonds de roulement d'un cabinet de conseil se compose surtout :",
        options: [
          { id: "a", label: "Des créances clients, diminuées des dettes fournisseurs et sociales" },
          { id: "b", label: "Des stocks de matières premières" },
          { id: "c", label: "Des immobilisations incorporelles" },
          { id: "d", label: "Du résultat net cumulé" },
        ],
        correctOptionId: "a",
        explain:
          "Sans stock, la formule se réduit à créances − dettes. Un cabinet en croissance voit ses créances gonfler plus vite que son résultat : croître ASSÈCHE la trésorerie au lieu de l'alimenter.",
      },
      {
        id: "mobilisation",
        prompt:
          "Vous mobilisez 100 000 € de créances par affacturage à 2,5 % de commission. Quel est l'effet ?",
        options: [
          { id: "a", label: "+97 500 € de trésorerie immédiate et 2 500 € de charges financières" },
          { id: "b", label: "+100 000 € de trésorerie sans aucun coût" },
          { id: "c", label: "+100 000 € de chiffre d'affaires" },
          { id: "d", label: "Aucun effet sur la trésorerie avant l'échéance" },
        ],
        correctOptionId: "a",
        explain:
          "Mobiliser le poste clients transforme une créance en cash, à un prix. C'est souvent le seul levier d'un cabinet, qui n'a ni stock à réduire ni actif à céder.",
      },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      cash_budget: "acceptable",
      return_analysis: "irrelevant",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["bfr", "frng", "net_treasury", "receivables_financing"],
    hints: hints([
      "Regardez votre bilan : quel poste, à lui seul, représente près de deux mois de chiffre d'affaires ?",
      "Vos consultants sont payés chaque mois. Vos clients vous paient soixante jours après la facture. Qui finance l'écart ?",
      "Sans stock ni machines, le BFR se réduit à une seule chose : le poste clients.",
      "TN = FRNG − BFR. Ici, le BFR est presque intégralement composé de créances : c'est là, et nulle part ailleurs, que se joue votre trésorerie.",
      "Trois leviers : négocier des acomptes, facturer plus tôt (à l'avancement plutôt qu'à la livraison), ou mobiliser le poste clients à un coût. Le troisième est immédiat mais se paie.",
    ]),
    trigger: { round: 2 },
    weight: 1.5,
    decisionLevers: [
      {
        field: "price",
        direction: "up",
        hint: "Négociez des acomptes ou facturez à l'avancement : chaque euro encaissé plus tôt réduit le BFR sans coûter un centime.",
      },
      {
        field: "marketingBudget",
        direction: "review",
        hint: "La prospection génère de nouvelles missions, donc de nouvelles créances. Calibrez votre développement commercial à la capacité de financement de votre poste clients.",
      },
    ],
  },
  {
    code: "conseil_t3_banc",
    category: "alerte_comptable",
    title: "Des consultants sur le banc",
    narrative:
      "L'été : les décideurs sont en congés, les marchés publics ne se notifient plus, le carnet se vide. Quatre de vos douze consultants n'ont aucune mission ce trimestre. Leurs salaires, eux, tombent normalement.",
    problem:
      "Faut-il baisser vos tarifs pour remplir le banc, ou tenir vos prix et accepter le creux ?",
    diagnosticOptions: [
      {
        id: "marginal_logic",
        label: "Une mission au-dessus des 90 € de frais variables améliore le résultat, même très en dessous du tarif habituel",
        correct: true,
      },
      {
        id: "price_reference",
        label: "Mais un tarif bradé devient la nouvelle référence du client pour toutes les missions suivantes",
        correct: true,
      },
      {
        id: "never_discount",
        label: "Il ne faut jamais descendre sous le taux journalier affiché",
        correct: false,
      },
      {
        id: "fire_now",
        label: "Licencier immédiatement les quatre consultants inoccupés",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "cout_pertinent",
        prompt:
          "Un client propose 260 € par jour pour une mission de trois semaines. Le salaire du consultant est de 210 € par jour. Faut-il accepter ?",
        options: [
          { id: "a", label: "Oui : le salaire est déjà engagé, seuls les 90 € de frais variables sont pertinents" },
          { id: "b", label: "Non : 260 € ne couvre pas les 210 € de salaire plus les 90 € de frais" },
          { id: "c", label: "Non : c'est sous le tarif journalier moyen de 560 €" },
          { id: "d", label: "Oui, mais seulement si le client accepte de payer comptant" },
        ],
        correctOptionId: "a",
        explain:
          "Le salaire tombe que le consultant soit staffé ou non : ce n'est pas un coût pertinent pour CETTE décision. 260 − 90 = 170 € de marge, contre 0 € s'il reste sur le banc. Le piège serait d'en faire une habitude.",
      },
      {
        id: "asymetrie_rh",
        prompt:
          "Licencier un consultant en période creuse, puis réembaucher au rebond : quel est le coût caché ?",
        options: [
          { id: "a", label: "Indemnité immédiate, puis coût de recrutement et délai avant que la capacité revienne" },
          { id: "b", label: "Aucun : l'effectif s'ajuste librement à l'activité" },
          { id: "c", label: "Uniquement l'indemnité de licenciement" },
          { id: "d", label: "Uniquement une baisse de la qualité perçue" },
        ],
        correctOptionId: "a",
        explain:
          "15 000 € pour licencier, 8 000 € pour recruter, et la capacité n'arrive qu'au tour suivant. Ajuster l'effectif au creux saisonnier coûte presque toujours plus cher que de traverser le creux.",
      },
    ],
    modelRelevance: {
      relevant_costs: "optimal",
      marginal_analysis: "acceptable",
      capacity_analysis: "acceptable",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["variable_costs", "contribution_margin", "capacity", "seasonality"],
    hints: hints([
      "Posez la question autrement : que rapporte un consultant qui reste sur le banc ?",
      "Comparez deux scénarios : mission à tarif réduit, ou aucune mission. Qu'est-ce qui change réellement dans vos charges ?",
      "Le salaire du consultant est engagé quoi qu'il arrive : c'est un coût non pertinent pour cette décision-ci.",
      "Seuls les 90 € de frais de mission varient. Toute mission au-dessus de ce seuil améliore le résultat du tour.",
      "Mais attention au tarif de référence : brader une fois sauve un trimestre, brader systématiquement détruit le taux journalier moyen de toutes les missions suivantes.",
    ]),
    trigger: { round: 3 },
    weight: 1.5,
    decisionLevers: [
      {
        field: "price",
        direction: "down",
        hint: "Un tarif réduit vaut mieux qu'un consultant sur le banc, tant que la journée dépasse les 90 € de frais variables. Mais attention à ne pas en faire la nouvelle référence.",
      },
      {
        field: "marketingBudget",
        direction: "up",
        hint: "Investir en prospection maintenant prépare le carnet du trimestre suivant : c'est une charge immédiate pour un effet différé, mais le creux est le pire moment pour couper.",
      },
      {
        field: "productionPlan",
        direction: "review",
        hint: "Réexaminez votre plan de missions : pouvez-vous accepter des formats plus courts ou plus souples pour occuper les consultants inactifs ?",
      },
    ],
  },
  {
    code: "conseil_t4_recrutement",
    category: "decision_strategique",
    title: "Le marché s'ouvre : êtes-vous prêts ?",
    narrative:
      "Un décret impose un audit à toutes les entreprises de plus de 250 salariés. Le marché s'ouvre pour tout le monde en même temps. Recruter un consultant coûte 8 000 €, et il ne produira qu'au trimestre suivant.",
    problem:
      "Une opportunité de marché ne se saisit qu'avec de la capacité disponible. Comment décidez-vous d'embaucher ?",
    diagnosticOptions: [
      {
        id: "capacity_first",
        label: "En comparant la demande attendue à la capacité actuelle : recruter n'a de sens que s'il manque des jours",
        correct: true,
      },
      {
        id: "lag_matters",
        label: "En tenant compte du décalage : la décision d'aujourd'hui produit son effet au tour suivant",
        correct: true,
      },
      {
        id: "hire_always",
        label: "En recrutant systématiquement : plus de consultants, plus de chiffre d'affaires",
        correct: false,
      },
      {
        id: "buy_capacity",
        label: "En investissant dans des outils pour augmenter la capacité sans embaucher",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "capacite_recrutee",
        prompt:
          "Dans un cabinet, comment la capacité de production augmente-t-elle ?",
        options: [
          { id: "a", label: "Uniquement par le recrutement ou la productivité : elle ne s'achète pas" },
          { id: "b", label: "En investissant dans des machines" },
          { id: "c", label: "En augmentant le taux journalier moyen" },
          { id: "d", label: "En allongeant les délais de paiement clients" },
        ],
        correctOptionId: "a",
        explain:
          "C'est la différence structurelle avec l'industrie ou l'hôtellerie : aucun investissement capacitaire n'est possible. La seule voie est humaine : recruter, ou former pour gagner en productivité.",
      },
      {
        id: "cout_recrutement",
        prompt:
          "Vous recrutez trois consultants pour 8 000 € chacun. Quel est l'effet sur le trimestre en cours ?",
        options: [
          { id: "a", label: "24 000 € de charges immédiates, et aucune capacité supplémentaire avant le tour suivant" },
          { id: "b", label: "24 000 € de charges et 180 jours vendables de plus dès ce tour" },
          { id: "c", label: "Aucune charge : le recrutement s'amortit" },
          { id: "d", label: "180 jours de plus, sans coût immédiat" },
        ],
        correctOptionId: "a",
        explain:
          "L'asymétrie est le cœur de la décision : le coût est immédiat, la capacité différée. Recruter au moment du pic, c'est payer pour un pic qu'on aura manqué.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      scenarios_method: "acceptable",
      relevant_costs: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["capacity", "productivity", "demand_market_share", "fixed_costs"],
    hints: hints([
      "Regardez votre taux d'occupation des derniers tours : avez-vous refusé des missions, ou eu du mal à staffer ?",
      "La demande supplémentaire ne vaut que si vous avez les jours-consultants pour la servir.",
      "Ici, aucun investissement capacitaire n'est possible : le seul levier est le recrutement, ou la formation qui améliore la productivité.",
      "Le coût de recrutement est immédiat (8 000 € par consultant), l'effet sur la capacité arrive au tour SUIVANT.",
      "Chiffrez : un consultant apporte 60 jours par trimestre. À 65 % d'occupation et 470 € de marge, cela fait ~18 300 € par trimestre, contre 12 600 € de salaire. La marge est réelle, mais mince si l'occupation ne suit pas.",
    ]),
    trigger: { round: 4 },
    weight: 1.5,
    decisionLevers: [
      {
        field: "productionPlan",
        direction: "up",
        hint: "La demande dépasse votre capacité : planifiez davantage de missions pour capter l'opportunité avant la concurrence.",
      },
      {
        field: "qualityBudget",
        direction: "up",
        hint: "La formation améliore la productivité de vos consultants actuels : c'est de la capacité supplémentaire sans le délai ni le coût du recrutement.",
      },
      {
        field: "marketingBudget",
        direction: "up",
        hint: "Investissez en prospection pour convertir la demande réglementaire en missions signées avant que le marché ne se referme.",
      },
    ],
  },
  {
    code: "conseil_detect_below_breakeven",
    category: "alerte_comptable",
    title: "Le banc coûte plus cher que les missions ne rapportent",
    narrative:
      "Résultat d'exploitation négatif. Les missions livrées étaient bonnes, les clients satisfaits, mais trop de jours-consultants sont restés invendus.",
    problem:
      "Vous êtes sous votre taux d'occupation d'équilibre. Quels leviers, et dans quel ordre ?",
    diagnosticOptions: [
      {
        id: "fill_bench",
        label: "Remplir le banc, même à tarif réduit : toute mission au-dessus des frais variables améliore le résultat",
        correct: true,
      },
      {
        id: "prospect",
        label: "Investir en prospection, en sachant que l'effet arrive avec retard",
        correct: true,
      },
      {
        id: "raise_tjm",
        label: "Augmenter le taux journalier moyen sans regarder l'occupation",
        correct: false,
      },
      {
        id: "wait",
        label: "Attendre que le marché reparte de lui-même",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "occupation_calc",
        prompt:
          "Vous avez vendu 380 jours sur 720 disponibles. Quel est votre taux d'occupation, et où vous situez-vous ?",
        options: [
          { id: "a", label: "53 %, sous le seuil d'équilibre de ~58 %" },
          { id: "b", label: "53 %, au-dessus du seuil d'équilibre" },
          { id: "c", label: "190 %, la capacité est saturée" },
          { id: "d", label: "On ne peut pas le savoir sans le chiffre d'affaires" },
        ],
        correctOptionId: "a",
        explain:
          "380 ÷ 720 ≈ 53 %. Il manque environ 41 jours pour atteindre les 421 du seuil, soit moins d'une mission longue. L'écart chiffré rend la décision concrète.",
      },
      {
        id: "prospection_retard",
        prompt: "Le budget de prospection agit sur le carnet de commandes :",
        options: [
          { id: "a", label: "Avec retard : c'est une charge immédiate pour un chiffre d'affaires différé" },
          { id: "b", label: "Immédiatement, dès le trimestre où il est engagé" },
          { id: "c", label: "Jamais : la prospection est une charge sans contrepartie" },
          { id: "d", label: "Proportionnellement au taux journalier moyen" },
        ],
        correctOptionId: "a",
        explain:
          "C'est ce qui rend la décision difficile : couper la prospection améliore le trimestre en cours et détériore les suivants. Le creux est exactement le moment où il faudrait prospecter davantage.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      capacity_analysis: "acceptable",
      relevant_costs: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["breakeven", "capacity", "safety_margin", "contribution_margin"],
    hints: hints([
      "Calculez votre taux d'occupation réel : jours vendus ÷ 720.",
      "Comparez-le au taux d'équilibre, environ 58 % avant budgets, 65 % une fois la prospection financée.",
      "Convertissez l'écart en jours : combien de jours-consultants manquent pour équilibrer ?",
      "Remplir le banc à tarif réduit reste préférable au banc vide, tant que le tarif dépasse 90 € de frais variables.",
      "Attention au piège du creux : couper la prospection redresse le trimestre en cours et creuse les suivants. C'est une charge immédiate pour un effet différé.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 1,
    decisionLevers: [
      {
        field: "price",
        direction: "down",
        hint: "Acceptez temporairement un TJM réduit pour remplir le banc : toute mission au-dessus de 90 € de frais variables améliore le résultat, même très en dessous du tarif habituel.",
      },
      {
        field: "marketingBudget",
        direction: "up",
        hint: "Augmentez la prospection pour remplir le carnet, même si l'effet est différé. Couper maintenant creuse le creux du trimestre suivant.",
      },
      {
        field: "productionPlan",
        direction: "up",
        hint: "Cherchez à vendre davantage de jours-consultants pour franchir le seuil d'occupation d'équilibre : chiffrez l'écart en jours, il est souvent plus petit qu'on ne croit.",
      },
    ],
  },
  {
    code: "conseil_detect_profitable_illiquid",
    category: "alerte_comptable",
    title: "Bénéficiaire et à découvert",
    narrative:
      "Le trimestre est bénéficiaire, le carnet est plein, les consultants sont staffés. Et pourtant, vous êtes à découvert : les grands comptes règlent à 60 jours, et vous venez d'en signer trois.",
    problem:
      "Pourquoi la croissance d'un cabinet assèche-t-elle sa trésorerie au lieu de l'alimenter ?",
    diagnosticOptions: [
      {
        id: "growth_eats_cash",
        label: "Plus de missions signifie plus de créances : le poste clients grossit avant que le cash n'arrive",
        correct: true,
      },
      {
        id: "salaries_now",
        label: "Les salaires se paient pendant la mission, la facture s'encaisse deux mois après la fin",
        correct: true,
      },
      {
        id: "profit_is_cash",
        label: "C'est impossible : un bénéfice est nécessairement de la trésorerie",
        correct: false,
      },
      {
        id: "sell_more",
        label: "Il suffit de signer davantage pour que la trésorerie revienne",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "croissance_bfr",
        prompt:
          "Un cabinet double son activité en un trimestre, à délais de paiement inchangés. Que devient son besoin en fonds de roulement ?",
        options: [
          { id: "a", label: "Il double à peu près : le BFR croît avec l'activité" },
          { id: "b", label: "Il diminue de moitié" },
          { id: "c", label: "Il reste stable" },
          { id: "d", label: "Il disparaît, absorbé par le résultat" },
        ],
        correctOptionId: "a",
        explain:
          "C'est le paradoxe de la croissance : elle consomme du cash avant d'en produire. Beaucoup de cabinets rentables déposent le bilan en pleine croissance, faute d'avoir financé leur poste clients.",
      },
      {
        id: "leviers_tresorerie",
        prompt: "Quel levier de trésorerie un cabinet de conseil n'a-t-il PAS à sa disposition ?",
        options: [
          { id: "a", label: "Réduire ses stocks" },
          { id: "b", label: "Mobiliser ses créances par escompte ou affacturage" },
          { id: "c", label: "Demander des acomptes à la signature" },
          { id: "d", label: "Facturer à l'avancement plutôt qu'à la livraison" },
        ],
        correctOptionId: "a",
        explain:
          "Un cabinet n'a pas de stock : ce levier classique lui est fermé. Il ne lui reste que le poste clients, d'où l'importance des acomptes et de la facturation à l'avancement, qui ne coûtent rien, contrairement à l'affacturage.",
      },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      cash_budget: "acceptable",
      return_analysis: "irrelevant",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["bfr", "frng", "net_treasury", "receivables_financing"],
    hints: hints([
      "Comparez le résultat net du tour à la variation de votre trésorerie : l'écart est instructif.",
      "Regardez le poste clients à l'ouverture et à la clôture : de combien a-t-il augmenté ?",
      "TN = FRNG − BFR. Sans stock, le BFR d'un cabinet est presque entièrement composé de créances clients.",
      "Chaque nouvelle mission signée à 60 jours ajoute au poste clients avant d'ajouter à la trésorerie. Croître, c'est financer ses clients.",
      "Vos leviers, par coût croissant : les acomptes (gratuits, à négocier), la facturation à l'avancement (gratuite), l'escompte, puis l'affacturage. Le stock, lui, n'existe pas ici.",
    ]),
    trigger: { detect: "profitable_illiquid" },
    weight: 1,
    decisionLevers: [
      {
        field: "price",
        direction: "review",
        hint: "Intégrez des acomptes ou une facturation à l'avancement dans vos conditions commerciales : c'est le levier de trésorerie gratuit d'un cabinet sans stock.",
      },
      {
        field: "marketingBudget",
        direction: "review",
        hint: "Chaque nouvelle mission signée gonfle le poste clients avant de produire du cash. Calibrez votre développement commercial à votre capacité de financement.",
      },
    ],
  },
  {
    code: "conseil_t5_mission_rabais",
    category: "decision_strategique",
    title: "Trois cent quatre-vingts euros la journée",
    narrative:
      "Une collectivité propose une mission de 60 jours à 380 € la journée, très en dessous de votre tarif habituel. Vos consultants sont salariés et payés quoi qu'il arrive ; sans cette mission, une partie d'entre eux resterait au bureau. Chaque jour de mission coûte environ 90 € de frais de déplacement et de documentation.",
    problem:
      "Accepter une mission bien en dessous du tarif : sabordage, ou bon calcul ?",
    diagnosticOptions: [
      {
        id: "salaire_engage",
        label: "Les salaires tombent que la mission soit prise ou non : ils ne départagent pas les deux options",
        correct: true,
      },
      {
        id: "marge_reelle",
        label: "Seuls les 90 € de frais de mission sont évités si l'on refuse : la journée laisse donc 290 €",
        correct: true,
      },
      {
        id: "sous_tarif_perte",
        label: "Toute mission vendue sous le tarif habituel se fait à perte",
        correct: false,
      },
      {
        id: "toujours_accepter",
        label: "Puisque la marge est positive, il faut accepter toutes les missions à bas prix",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "conseil_cout_marginal",
        prompt: "Le coût pertinent d'une journée de mission supplémentaire, pour un consultant déjà salarié, est…",
        options: [
          { id: "a", label: "Les seuls frais que la mission engendre : déplacement, documentation, sous-traitance éventuelle" },
          { id: "b", label: "Le salaire journalier du consultant, quoi qu'il arrive" },
          { id: "c", label: "Le tarif habituellement facturé au client" },
          { id: "d", label: "La part des charges de structure rapportée à une journée" },
        ],
        correctOptionId: "a",
        explain:
          "Le salaire est engagé : il sort de la caisse que le consultant soit en mission ou au bureau. Seuls les frais évitables entrent dans l'arbitrage.",
      },
      {
        id: "conseil_risque_tarif",
        prompt: "Le vrai danger d'une mission acceptée bien en dessous du tarif est…",
        options: [
          { id: "a", label: "Qu'elle devienne la référence du client pour les missions suivantes, et occupe des consultants indisponibles pour mieux payé" },
          { id: "b", label: "Qu'elle fasse baisser mécaniquement les salaires" },
          { id: "c", label: "Qu'elle augmente les charges de structure du cabinet" },
          { id: "d", label: "Qu'elle soit interdite par la réglementation des marchés publics" },
        ],
        correctOptionId: "a",
        explain:
          "Le calcul marginal dit oui quand le planning est vide. Il dit non dès qu'accepter empêche de servir un client mieux payé, ou installe durablement un tarif bas.",
      },
    ],
    modelRelevance: {
      marginal_analysis: "optimal",
      breakeven_analysis: "misleading",
      relevant_costs: "acceptable",
      capacity_analysis: "acceptable",
    },
    conceptCodes: ["variable_costs", "contribution_margin", "capacity", "margin_rates"],
    hints: hints([
      "Demandez-vous ce qui change réellement dans vos comptes si vous refusez cette mission.",
      "Les salaires de vos consultants sont-ils de ceux-là ? Ils tombent aussi quand le carnet est vide.",
      "Retranchez des 380 € les seuls frais que la mission engendre : ce qui reste va couvrir la structure.",
      "290 € de marge par jour valent mieux que zéro, TANT QUE le consultant n'avait rien d'autre à faire.",
      "Le raisonnement marginal s'arrête net dès que la capacité est prise : accepter, c'est alors renoncer à une mission mieux payée.",
    ]),
    trigger: { round: 5 },
    weight: 1,
    decisionLevers: [
      {
        field: "price",
        direction: "review",
        hint: "380 € est très en dessous du tarif habituel, mais la marge sur coût variable (290 €) est réelle. Le calcul marginal dit oui quand le planning est vide, non quand il est plein.",
      },
      {
        field: "productionPlan",
        direction: "review",
        hint: "Vérifiez si le consultant visé a d'autres missions possibles ce trimestre : accepter cette mission, c'est renoncer à toute mission mieux payée sur la même période.",
      },
    ],
  },
  {
    code: "conseil_t6_resistance",
    category: "contexte_marche",
    title: "Jusqu'où le cabinet peut-il encaisser",
    narrative:
      "Vous préparez le budget de l'année suivante. Un grand compte, qui pèse un quart de votre activité, laisse entendre qu'il pourrait internaliser. Vos charges de structure, elles, sont connues et ne bougeront pas : les salaires de douze consultants tombent chaque mois.",
    problem:
      "De combien votre activité peut-elle baisser avant que le cabinet ne perde de l'argent ?",
    diagnosticOptions: [
      {
        id: "marge_securite",
        label: "Il faut mesurer l'écart entre l'activité actuelle et le niveau d'équilibre",
        correct: true,
      },
      {
        id: "structure_rigide",
        label: "Des charges presque entièrement fixes rendent le résultat très sensible à une baisse d'activité",
        correct: true,
      },
      {
        id: "attendre",
        label: "Tant que le client n'est pas parti, il n'y a rien à calculer",
        correct: false,
      },
      {
        id: "baisser_tarif",
        label: "Baisser le tarif de tous les clients protège de ce risque",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "conseil_indice_securite",
        prompt: "L'indice de sécurité d'une entreprise se lit comme…",
        options: [
          { id: "a", label: "La part du chiffre d'affaires qui peut disparaître avant d'atteindre le seuil de rentabilité" },
          { id: "b", label: "Le pourcentage de clients fidèles d'une année sur l'autre" },
          { id: "c", label: "Le rapport entre trésorerie et dettes à court terme" },
          { id: "d", label: "La marge dégagée sur le client le plus important" },
        ],
        correctOptionId: "a",
        explain:
          "Il répond exactement à la question posée : combien puis-je perdre avant de basculer ? Un quart d'activité menacé face à un indice de 15 % est une alerte.",
      },
      {
        id: "conseil_levier",
        prompt: "Pourquoi une structure de coûts très fixe amplifie-t-elle les variations de résultat ?",
        options: [
          { id: "a", label: "Parce que les charges ne baissent pas quand l'activité baisse : toute la marge perdue se retranche du résultat" },
          { id: "b", label: "Parce que les charges fixes augmentent quand l'activité diminue" },
          { id: "c", label: "Parce que la marge unitaire dépend du volume vendu" },
          { id: "d", label: "Parce que l'impôt est calculé sur le chiffre d'affaires" },
        ],
        correctOptionId: "a",
        explain:
          "C'est le levier d'exploitation. Il joue dans les deux sens : très favorable quand l'activité monte, brutal quand elle descend.",
      },
    ],
    modelRelevance: {
      sensitivity_analysis: "optimal",
      return_analysis: "misleading",
      breakeven_analysis: "acceptable",
      scenarios_method: "acceptable",
    },
    conceptCodes: ["safety_margin", "breakeven", "fixed_costs", "profitability_vs_return"],
    hints: hints([
      "Reprenez votre seuil de rentabilité en jours-consultants, puis comparez-le aux jours réellement vendus.",
      "L'écart entre les deux est votre marge de sécurité. Rapportée à l'activité, elle donne un pourcentage.",
      "Comparez ce pourcentage au quart d'activité que représente le client menacé.",
      "Refaites le calcul en retirant ce client : le cabinet reste-t-il au-dessus du seuil ?",
      "Faites varier un paramètre à la fois, l'activité puis le tarif, et regardez lequel fait basculer le résultat le plus vite. C'est une analyse de sensibilité.",
    ]),
    trigger: { round: 6 },
    weight: 1,
    decisionLevers: [
      {
        field: "marketingBudget",
        direction: "up",
        hint: "Diversifiez votre portefeuille clients par la prospection : un quart de l'activité chez un seul client est une exposition dangereuse que seul un carnet plus large peut réduire.",
      },
      {
        field: "price",
        direction: "review",
        hint: "Simulez l'effet d'une variation de tarif sur votre seuil de rentabilité : avec des charges presque entièrement fixes, le levier d'exploitation amplifie chaque mouvement.",
      },
      {
        field: "productionPlan",
        direction: "review",
        hint: "Préparez un plan de missions alternatif sans le grand compte : combien de jours-consultants faudrait-il remplacer, et le carnet actuel peut-il absorber le choc ?",
      },
    ],
  },
  {
    code: "conseil_detect_idle_cash",
    category: "tresorerie_dormante",
    title: "Le compte se remplit, le carnet se vide",
    narrative:
      "Les grosses factures de fin de mission sont rentrées d'un coup : le compte affiche plus d'un trimestre et demi de charges de structure, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an, et facture le découvert 9 %. Le carnet de commandes, lui, est plus creux qu'il ne l'a été depuis longtemps.",
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
        label: "Le montant bloqué ne pourra régler aucune facture du trimestre : il faut d'abord chiffrer ce qui va sortir",
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
        id: "conseil_detect_idle_cash_placement_exces",
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
        id: "conseil_carnet_vide",
        prompt: "Dans un cabinet, une caisse pleine alors que le carnet se vide est un signal…",
        options: [
          { id: "a", label: "D'alerte : les salaires continueront de tomber alors que les encaissements vont s'arrêter" },
          { id: "b", label: "Rassurant : la trésorerie prouve la bonne santé du cabinet" },
          { id: "c", label: "Neutre : trésorerie et carnet de commandes sont sans rapport" },
          { id: "d", label: "Favorable : c'est le moment d'augmenter les tarifs" },
        ],
        correctOptionId: "a",
        explain:
          "Le solde d'aujourd'hui vient des missions d'hier. Avec des charges presque entièrement fixes, c'est précisément le moment de bloquer le moins possible.",
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
      "Comparez votre solde aux charges de structure d'un trimestre : combien de trimestres de salaires pourriez-vous payer sans facturer un seul jour ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro.",
      "Attention : le placement est bloqué jusqu'au tour suivant. Il ne réglera rien de ce qui tombera d'ici là.",
      "Projetez le trimestre à venir avec le carnet TEL QU'IL EST : les salaires de vos consultants tomberont, les encaissements peut-être pas.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte quatre fois ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ]),
    trigger: { detect: "idle_cash" },
    weight: 0.8,
    decisionLevers: [
      {
        field: "maintenanceBudget",
        direction: "review",
        hint: "Avant de bloquer du cash, vérifiez que votre outillage ne nécessite pas un investissement plus rentable que les 2 % du placement.",
      },
      {
        field: "marketingBudget",
        direction: "review",
        hint: "Un carnet qui se vide appelle de la prospection : mieux vaut investir dans le remplissage du carnet que bloquer du cash à 2 % pendant que les salaires continuent de tomber.",
      },
      {
        field: "productionPlan",
        direction: "review",
        hint: "Projetez vos missions du trimestre suivant : le cash d'aujourd'hui devra financer les salaires même si le carnet reste creux. Ne bloquez que l'excédent qui survit à cette projection.",
      },
    ],
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  conseil_detect_idle_cash:
    "Le budget de trésorerie confronte les encaissements attendus au carnet réel et aux salaires certains. C'est le seul document qui empêche de prendre un solde de fin de mission pour un excédent durable.",
  conseil_t5_mission_rabais:
    "L'analyse marginale ne retient que ce que la décision change : les frais de mission. Le salaire, engagé de toute façon, n'a rien à y faire, et le seuil de rentabilité répondrait à une autre question.",
  conseil_t6_resistance:
    "L'analyse de sensibilité fait varier un paramètre à la fois pour voir lequel fait basculer le résultat. C'est ce qui transforme une inquiétude en chiffre.",
  conseil_t1_reprise:
    "Le seuil de rentabilité traduit la question du métier en taux d'occupation : combien de jours faut-il facturer pour couvrir des salaires qui tombent de toute façon ?",
  conseil_t2_creances:
    "L'analyse FRNG / BFR est le seul outil qui explique qu'un cabinet rentable manque de trésorerie : sans stock, tout le BFR est dans le poste clients.",
  conseil_t3_banc:
    "L'analyse des coûts pertinents isole ce que la décision change vraiment, les 90 € de frais de mission, et écarte le salaire, engagé de toute façon.",
  conseil_t4_recrutement:
    "L'analyse de capacité confronte la demande attendue aux jours-consultants disponibles, et intègre le décalage propre au recrutement.",
  conseil_detect_below_breakeven:
    "Le seuil de rentabilité chiffre l'écart en jours-consultants et rend la décision concrète : combien de jours manque-t-il, exactement ?",
  conseil_detect_profitable_illiquid:
    "L'analyse FRNG / BFR montre que c'est le poste clients qui a bougé, pas le résultat : TN = FRNG − BFR.",
};

attachModelQuestions(CONSEIL_SITUATIONS, MODEL_EXPLAIN);
