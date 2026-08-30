import { attachModelQuestions, hints, type SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de ROUTE & CIE (transport routier).
 *
 * Le fil rouge du secteur : le camion part de toute façon. Tout le métier
 * consiste à décider ce qu'on met dedans, et à quel prix, avant qu'il ne parte.
 */
export const TRANSPORT_SITUATIONS: SituationDef[] = [
  {
    code: "transport_t1_revient",
    title: "Ce que coûte vraiment une palette",
    narrative:
      "Vous reprenez ROUTE & CIE : sept porteurs, dix chauffeurs, un dépôt. La palette se facture 74 € en moyenne. Le gazole et les péages coûtent 18 €, l'entretien et les pneumatiques 7 €. Tout le reste, la conduite comprise, tombe chaque trimestre à l'identique.",
    problem:
      "Combien de palettes faut-il charger dans le trimestre pour couvrir la structure ?",
    diagnosticOptions: [
      {
        id: "chauffeurs_fixes",
        label:
          "Les salaires des chauffeurs sont mensuels : ils ne suivent pas le nombre de palettes chargées",
        correct: true,
      },
      {
        id: "marge_palette",
        label: "Chaque palette laisse 49 € pour couvrir cette structure",
        correct: true,
      },
      {
        id: "gazole_seul",
        label: "Le coût d'une palette se résume au gazole consommé pour la livrer",
        correct: false,
      },
      {
        id: "prix_moyen_suffit",
        label: "Un prix moyen supérieur au coût moyen garantit le résultat",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "marge_unitaire",
        prompt: "Quelle est la marge sur coût variable d'une palette livrée ?",
        options: [
          { id: "a", label: "49 €, soit 74 − 18 − 7" },
          { id: "b", label: "56 €, soit 74 − 18" },
          { id: "c", label: "74 €, le prix facturé" },
          { id: "d", label: "7 €, l'entretien" },
        ],
        correctOptionId: "a",
        explain:
          "Gazole, péages, entretien et pneumatiques suivent les kilomètres parcourus : ils sont variables. Les 49 € restants paient les chauffeurs, le dépôt et la flotte, et la conduite à elle seule en prend la plus grosse part.",
      },
      {
        id: "seuil_palettes",
        prompt:
          "Avec 186 000 € de charges de structure décaissées, à partir de combien de palettes le trimestre devient-il bénéficiaire ?",
        options: [
          { id: "a", label: "Environ 3 800, soit 38 % de la capacité de la flotte" },
          { id: "b", label: "Environ 10 000, la flotte au complet" },
          { id: "c", label: "Environ 2 500" },
          { id: "d", label: "Environ 7 400, le rythme actuel" },
        ],
        correctOptionId: "a",
        explain:
          "186 000 ÷ 49 ≈ 3 796 palettes. Ce seuil ne couvre que les charges décaissées : les amortissements de la flotte, les budgets d'entretien et de qualité et les intérêts s'y ajoutent, et portent le vrai point mort près de 4 900 palettes. Sous ce seuil, les camions roulent et l'entreprise perd de l'argent en roulant : c'est la situation la plus dangereuse du métier.",
      },
    ],
    modelRelevance: {
      cvp_analysis: "optimal",
      breakeven_analysis: "acceptable",
      capacity_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["variable_costs", "fixed_costs", "contribution_margin", "breakeven"],
    hints: hints([
      "Séparez ce qui dépend des kilomètres de ce qui tombe tous les mois.",
      "Un chauffeur est payé qu'il transporte vingt palettes ou trente.",
      "Chaque palette laisse 74 − 18 − 7 = 49 € pour la structure.",
      "Seuil décaissé = 186 000 ÷ 49 ≈ 3 800 palettes par trimestre.",
      "Rapporté à 10 000 palettes de capacité, il faut donc remplir les camions à 38 % rien que pour couvrir ce qui se décaisse, et près de la moitié pour couvrir aussi la flotte.",
    ]),
    trigger: { round: 1 },
    weight: 1,
  },
  {
    code: "transport_t2_retour_vide",
    title: "Le camion qui rentre à vide",
    narrative:
      "Vos porteurs partent chargés vers la métropole et reviennent vides trois fois sur quatre. Le gazole du retour est brûlé, le chauffeur est payé, les péages sont réglés. La bourse de fret propose des lots à 52 € la palette pour ces retours, bien en dessous de votre prix moyen.",
    problem:
      "Faut-il charger ces lots mal payés, ou tenir son prix et rentrer à vide ?",
    diagnosticOptions: [
      {
        id: "cout_retour_engage",
        label:
          "Le retour a lieu de toute façon : son gazole et son chauffeur sont déjà engagés",
        correct: true,
      },
      {
        id: "marge_incrementale",
        label:
          "Un lot à 52 € rapporte tout ce qui dépasse le coût de manutention supplémentaire",
        correct: true,
      },
      {
        id: "casse_les_prix",
        label:
          "Accepter ces prix habitue le marché à les payer : c'est un risque commercial réel",
        correct: true,
      },
      {
        id: "jamais_sous_le_prix",
        label: "Il ne faut jamais charger en dessous du prix moyen : c'est vendre à perte",
        correct: false,
      },
      {
        id: "prendre_tout",
        label: "Il faut accepter tous les lots de la bourse, quel que soit le prix",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "capacite_perissable",
        prompt: "Que devient une place non vendue dans un camion qui part ?",
        options: [
          { id: "a", label: "Elle est perdue définitivement : elle ne se reporte pas au tour suivant" },
          { id: "b", label: "Elle est stockée et revendue plus tard" },
          { id: "c", label: "Elle réduit le coût du prochain voyage" },
          { id: "d", label: "Elle apparaît en stock au bilan" },
        ],
        correctOptionId: "a",
        explain:
          "La capacité de transport est périssable, comme une nuit d'hôtel ou un couvert. C'est ce qui justifie de vendre le dernier mètre de plancher très en dessous du prix moyen.",
      },
      {
        id: "limite_du_raisonnement",
        prompt: "Quelle est la limite de ce raisonnement sur les retours à vide ?",
        options: [
          {
            id: "a",
            label:
              "Il ne vaut que pour le remplissage résiduel : appliqué à tout le trafic, il ne couvre plus la structure",
          },
          { id: "b", label: "Il ne vaut que pour les lots alimentaires" },
          { id: "c", label: "Il n'a aucune limite tant que la marge est positive" },
          { id: "d", label: "Il suppose que le gazole soit stable" },
        ],
        correctOptionId: "a",
        explain:
          "Vendre au coût marginal est juste sur la marge, faux sur la masse. Une entreprise qui facture tout son trafic au prix des retours à vide ne paie plus ses chauffeurs.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      marginal_analysis: "acceptable",
      relevant_costs: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["capacity", "contribution_margin", "variable_costs", "margin_rates"],
    hints: hints([
      "Demandez-vous ce que coûte le retour si vous ne chargez rien.",
      "Le gazole, les péages et le chauffeur du retour sont engagés dans les deux cas.",
      "Le seul coût supplémentaire d'un lot de retour est sa manutention.",
      "Tout ce qui dépasse ce coût est de la marge qui n'existerait pas autrement.",
      "Mais la règle ne vaut que pour le remplissage résiduel : si tout votre trafic passait à ce prix, la structure ne serait plus couverte.",
    ]),
    trigger: { round: 2 },
    weight: 1,
  },
  {
    code: "transport_t3_gazole",
    title: "Le gazole prend dix-huit pour cent",
    narrative:
      "Le carburant a bondi de dix-huit pour cent en six semaines. Personne dans l'entreprise n'a rien décidé, et pourtant chaque palette coûte désormais 3,24 € de plus. Vos contrats industriels sont signés pour l'année, la bourse de fret, elle, s'ajuste en quelques jours.",
    problem:
      "De combien le résultat du trimestre bouge-t-il, et que faire des contrats déjà signés ?",
    diagnosticOptions: [
      {
        id: "effet_massif",
        label:
          "Une hausse du coût variable frappe chaque palette : l'effet sur le résultat est le surcoût multiplié par le volume",
        correct: true,
      },
      {
        id: "marge_ecrasee",
        label:
          "La marge unitaire tombe de 49 à 45,76 €, ce qui remonte mécaniquement le seuil de rentabilité",
        correct: true,
      },
      {
        id: "indexation",
        label:
          "Une clause d'indexation gazole transfère ce risque au client au lieu de le subir",
        correct: true,
      },
      {
        id: "compenser_volume",
        label: "Il suffit de transporter plus de palettes pour compenser la hausse",
        correct: false,
      },
      {
        id: "sans_effet",
        label: "Les contrats signés protègent l'entreprise : le résultat ne bouge pas",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "nouveau_seuil",
        prompt:
          "Avec une marge unitaire tombée à 45,76 €, quel devient le seuil de rentabilité décaissé du trimestre ?",
        options: [
          { id: "a", label: "Environ 4 050 palettes, contre 3 800 auparavant" },
          { id: "b", label: "Il ne change pas : le seuil dépend des charges fixes" },
          { id: "c", label: "Environ 3 300 palettes" },
          { id: "d", label: "Environ 10 000 palettes" },
        ],
        correctOptionId: "a",
        explain:
          "186 000 ÷ 45,76 ≈ 4 065. Le seuil ne bouge que de deux cent cinquante palettes, et c'est le résultat qu'il faut regarder : 3,24 € multipliés par les sept mille palettes du trimestre, c'est près de la moitié du bénéfice trimestriel effacée par une ligne que personne n'a décidée.",
      },
      {
        id: "sensibilite",
        prompt: "Que mesure une analyse de sensibilité dans cette situation ?",
        options: [
          {
            id: "a",
            label:
              "De combien le résultat varie quand une hypothèse bouge, et laquelle compte le plus",
          },
          { id: "b", label: "La probabilité que le gazole augmente encore" },
          { id: "c", label: "Le prix moyen du marché" },
          { id: "d", label: "La rentabilité d'un investissement de flotte" },
        ],
        correctOptionId: "a",
        explain:
          "Elle hiérarchise les fragilités. Dans le transport, elle montre presque toujours que le prix du gazole pèse davantage que le volume transporté, ce qui oriente la négociation commerciale.",
      },
    ],
    modelRelevance: {
      sensitivity_analysis: "optimal",
      cvp_analysis: "acceptable",
      breakeven_analysis: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["variable_costs", "contribution_margin", "breakeven", "safety_margin"],
    hints: hints([
      "Le surcoût porte sur chaque palette : multipliez-le par le volume du trimestre.",
      "La marge unitaire passe de 49 à 45,76 €.",
      "Les charges de structure, elles, n'ont pas bougé.",
      "Nouveau seuil décaissé = 186 000 ÷ 45,76 ≈ 4 050 palettes.",
      "Reste la question commerciale : qui supporte ce risque à l'avenir, vous ou votre client ? C'est ce que règle une clause d'indexation.",
    ]),
    trigger: { round: 3 },
    weight: 1.1,
  },
  {
    code: "transport_t4_grand_compte",
    title: "Le grand compte qui paie à soixante jours",
    narrative:
      "Votre plus gros client industriel représente près du tiers du trafic et règle à soixante jours. Le gazole, lui, se paie à quinze jours en carte accréditive, et les chauffeurs le 30 de chaque mois. Le trimestre est bénéficiaire, et pourtant le découvert se creuse.",
    problem:
      "Que faut-il regarder pour comprendre, et quels leviers existent sur le poste clients ?",
    diagnosticOptions: [
      {
        id: "decalage_encaissement",
        label:
          "L'entreprise décaisse à quinze et trente jours ce qu'elle encaisse à soixante : le cycle consomme de la trésorerie",
        correct: true,
      },
      {
        id: "concentration",
        label:
          "La concentration du chiffre d'affaires sur un client aggrave le risque autant que le besoin de financement",
        correct: true,
      },
      {
        id: "mobiliser_creances",
        label:
          "Escompte et affacturage permettent d'avancer ces créances, contre un coût qu'il faut comparer",
        correct: true,
      },
      {
        id: "resultat_faux",
        label: "Le résultat doit être faux : un trimestre bénéficiaire remplit toujours la caisse",
        correct: false,
      },
      {
        id: "augmenter_prix",
        label: "Augmenter les prix résoudrait ce problème de trésorerie",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "dso",
        prompt: "Que mesure le délai moyen de règlement client, et pourquoi compte-t-il ici ?",
        options: [
          {
            id: "a",
            label:
              "Le nombre de jours de chiffre d'affaires immobilisés en créances : chaque jour gagné libère de la trésorerie",
          },
          { id: "b", label: "Le délai moyen de livraison des marchandises" },
          { id: "c", label: "La durée moyenne d'un contrat client" },
          { id: "d", label: "Le temps de rotation de la flotte" },
        ],
        correctOptionId: "a",
        explain:
          "Créances rapportées au chiffre d'affaires, multipliées par la durée de la période. Dans un métier à marge courte, dix jours de délai en moins valent souvent plus qu'un point de prix.",
      },
      {
        id: "cout_mobilisation",
        prompt: "Comment comparer l'escompte et l'affacturage sur une même créance ?",
        options: [
          {
            id: "a",
            label:
              "En ramenant les deux coûts à la même durée, celle qui reste à courir jusqu'à l'échéance",
          },
          { id: "b", label: "En comparant directement le taux annuel et la commission" },
          { id: "c", label: "En retenant systématiquement le moins cher affiché" },
          { id: "d", label: "Les deux coûtent la même chose" },
        ],
        correctOptionId: "a",
        explain:
          "Un taux annuel et une commission forfaitaire ne se comparent pas tels quels. Il faut proratiser le premier sur les jours réellement financés, sans quoi la conclusion s'inverse.",
      },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      cash_budget: "acceptable",
      relevant_costs: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["bfr", "net_treasury", "receivables_financing", "frng"],
    hints: hints([
      "Comparez la date où vous payez et la date où vous encaissez.",
      "Le gazole part à quinze jours, les salaires le 30, le client règle à soixante.",
      "Ce décalage, multiplié par le chiffre d'affaires, c'est votre besoin en fonds de roulement.",
      "Trésorerie nette = fonds de roulement − besoin : votre besoin a grossi avec le trafic.",
      "Deux leviers existent sur ce poste : raccourcir le délai négocié, ou mobiliser la créance en comparant honnêtement escompte et affacturage au prorata des jours financés.",
    ]),
    trigger: { round: 4 },
    weight: 1.2,
  },
  {
    code: "transport_t5_flotte",
    title: "Renouveler la flotte ou la réparer",
    narrative:
      "Trois de vos porteurs ont passé les huit cents mille kilomètres. Leur entretien coûte 21 000 € par trimestre et grimpe, leurs pannes immobilisent des tournées. Les remplacer coûterait 315 000 €, financés sur six ans, pour un entretien retombant à 5 500 € et une consommation en baisse de neuf pour cent.",
    problem:
      "Le renouvellement crée-t-il de la valeur, et sur quels flux le démontrer ?",
    diagnosticOptions: [
      {
        id: "flux_differentiels",
        label:
          "Il faut chiffrer les flux que la décision change : entretien évité, gazole économisé, immobilisations en moins",
        correct: true,
      },
      {
        id: "actualiser",
        label:
          "Ces économies s'étalent sur six ans : elles doivent être ramenées à la valeur d'aujourd'hui",
        correct: true,
      },
      {
        id: "valeur_revente",
        label: "La valeur de revente des anciens porteurs entre dans le calcul",
        correct: true,
      },
      {
        id: "amortissement_flux",
        label: "L'amortissement des nouveaux porteurs est un flux de trésorerie sortant",
        correct: false,
      },
      {
        id: "trop_cher",
        label: "315 000 € est un montant trop élevé : la décision se tranche sans calcul",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "economie_annuelle",
        prompt:
          "Quelle économie d'entretien le renouvellement procure-t-il chaque trimestre ?",
        options: [
          { id: "a", label: "15 500 €, soit 21 000 − 5 500, avant même l'effet sur le gazole" },
          { id: "b", label: "21 000 €, la totalité de l'entretien actuel" },
          { id: "c", label: "5 500 €, le nouvel entretien" },
          { id: "d", label: "Aucune : l'entretien est une charge de structure" },
        ],
        correctOptionId: "a",
        explain:
          "Seul l'écart compte. Ces 15 500 € trimestriels, plus l'économie de carburant et les tournées qui ne sont plus immobilisées, forment les flux d'entrée du projet.",
      },
      {
        id: "van_vs_payback",
        prompt: "Pourquoi le seul délai de récupération ne suffit-il pas à trancher ?",
        options: [
          {
            id: "a",
            label:
              "Il ignore ce qui se passe après le remboursement et ne tient pas compte de la valeur du temps",
          },
          { id: "b", label: "Il est trop long à calculer" },
          { id: "c", label: "Il ne s'applique qu'aux investissements immatériels" },
          { id: "d", label: "Il donne toujours le même résultat que la valeur actuelle nette" },
        ],
        correctOptionId: "a",
        explain:
          "Le délai de récupération rassure sur le risque mais ne mesure aucune création de valeur. Deux projets peuvent se rembourser en trois ans et n'avoir rien à voir sur les six suivantes.",
      },
    ],
    modelRelevance: {
      npv: "optimal",
      irr: "acceptable",
      return_analysis: "acceptable",
      elasticity_analysis: "irrelevant",
    },
    conceptCodes: ["discounting", "irr_payback", "profitability_vs_return", "capacity"],
    hints: hints([
      "Ne retenez que ce qui change entre garder et remplacer.",
      "L'entretien passe de 21 000 à 5 500 € par trimestre.",
      "Ajoutez l'économie de gazole et les tournées qui ne sont plus perdues en panne.",
      "L'amortissement n'est pas un flux : l'argent sort à l'achat, une seule fois.",
      "Actualisez ces flux au coût de votre financement, et comparez au décaissement initial diminué de la revente des anciens porteurs.",
    ]),
    trigger: { round: 5 },
    weight: 1,
  },
  {
    code: "transport_t6_contrat_refuse",
    title: "Le contrat qu'il faut savoir refuser",
    narrative:
      "Un distributeur propose un contrat annuel de six mille palettes à 57 €, à condition d'immobiliser trois porteurs à son service exclusif. Vos autres clients paient en moyenne 78 €. La flotte est déjà remplie à quatre-vingts pour cent.",
    problem:
      "Que coûte réellement ce contrat, une fois la flotte prise en compte ?",
    diagnosticOptions: [
      {
        id: "cout_opportunite",
        label:
          "Trois porteurs immobilisés ne transportent plus le trafic à 78 € : c'est un coût d'opportunité",
        correct: true,
      },
      {
        id: "comparer_marges",
        label:
          "La comparaison porte sur les marges par unité de capacité rare, pas sur les prix affichés",
        correct: true,
      },
      {
        id: "volume_rassure",
        label: "Un contrat annuel de six mille palettes sécurise l'activité : il faut le prendre",
        correct: false,
      },
      {
        id: "marge_positive_suffit",
        label: "À 57 €, la marge sur coût variable reste positive : cela suffit à accepter",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "ressource_rare",
        prompt: "Quand la capacité est saturée, sur quoi la comparaison doit-elle porter ?",
        options: [
          {
            id: "a",
            label: "Sur la marge dégagée par unité de ressource rare, ici le camion mobilisé",
          },
          { id: "b", label: "Sur le prix facturé à la palette" },
          { id: "c", label: "Sur le chiffre d'affaires total du contrat" },
          { id: "d", label: "Sur la durée d'engagement" },
        ],
        correctOptionId: "a",
        explain:
          "À capacité libre, toute marge positive enrichit. À capacité saturée, accepter une affaire, c'est en refuser une autre : la bonne unité de comparaison devient la ressource qui manque.",
      },
      {
        id: "quand_accepter",
        prompt: "Dans quel cas ce contrat redeviendrait-il intéressant ?",
        options: [
          {
            id: "a",
            label:
              "Si la flotte était sous-employée, ou s'il remplissait des retours aujourd'hui perdus",
          },
          { id: "b", label: "Si le distributeur payait comptant" },
          { id: "c", label: "Si le gazole baissait" },
          { id: "d", label: "Dans aucun cas : le prix est trop bas" },
        ],
        correctOptionId: "a",
        explain:
          "La même affaire est bonne ou mauvaise selon le taux de remplissage. C'est pourquoi la décision commerciale ne se prend jamais sans regarder d'abord la capacité.",
      },
    ],
    modelRelevance: {
      relevant_costs: "optimal",
      marginal_analysis: "acceptable",
      capacity_analysis: "acceptable",
      irr: "irrelevant",
    },
    conceptCodes: ["capacity", "contribution_margin", "margin_rates", "variable_costs"],
    hints: hints([
      "Demandez-vous ce que feraient ces trois porteurs sans ce contrat.",
      "Votre flotte est remplie à quatre-vingts pour cent : la capacité n'est pas libre.",
      "Accepter, c'est refuser le trafic à 78 € que ces camions transportaient.",
      "Comparez donc les marges par camion mobilisé, pas les prix à la palette.",
      "Et notez que la réponse s'inverserait si la flotte tournait à moitié vide : la même affaire n'a pas la même valeur selon le remplissage.",
    ]),
    trigger: { round: 6 },
    weight: 1,
  },
  {
    code: "transport_detect_idle_cash",
    title: "L'affacturage a rempli le compte",
    narrative:
      "Vous avez cédé une partie du poste clients pour passer un cap, et le compte affiche aujourd'hui un solde confortable. Il serait tentant d'y voir un excédent à placer. Mais cet argent est le produit de créances déjà vendues : il ne reviendra pas une seconde fois, et il doit couvrir le gazole des prochaines semaines, les salaires de fin de mois et l'échéance du crédit de flotte. Le placer à trois mois immobiliserait exactement ce qui doit faire rouler les camions.",
    problem:
      "Ce solde est-il disponible, et comment savoir quelle part l'est vraiment ?",
    diagnosticOptions: [
      {
        id: "produit_avance",
        label:
          "C'est le produit d'une avance sur créances : il remplace un encaissement futur, il ne s'y ajoute pas",
        correct: true,
      },
      {
        id: "dater_les_sorties",
        label:
          "Seul un budget de trésorerie daté dira ce qui reste réellement disponible, et pour combien de temps",
        correct: true,
      },
      {
        id: "excedent",
        label: "Un solde élevé est un excédent : il faut le placer sans attendre",
        correct: false,
      },
      {
        id: "resultat",
        label: "Cet encaissement améliore le résultat du trimestre",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "nature_affacturage",
        prompt: "Quel est l'effet d'une cession de créances sur le résultat et sur la trésorerie ?",
        options: [
          {
            id: "a",
            label:
              "La trésorerie augmente immédiatement, le résultat baisse du montant de la commission",
          },
          { id: "b", label: "Le résultat augmente du montant cédé" },
          { id: "c", label: "Ni le résultat ni la trésorerie ne bougent" },
          { id: "d", label: "Le chiffre d'affaires augmente" },
        ],
        correctOptionId: "a",
        explain:
          "L'affacturage avance de l'argent déjà gagné et facture ce service. Il règle un problème de trésorerie, jamais un problème de rentabilité, et il coûte à chaque fois.",
      },
      {
        id: "placer_quoi",
        prompt: "Quelle part de ce solde peut légitimement être placée ?",
        options: [
          {
            id: "a",
            label:
              "Celle qui reste après avoir daté toutes les sorties de la période de blocage",
          },
          { id: "b", label: "La totalité, puisque l'argent est encaissé" },
          { id: "c", label: "La moitié, par prudence" },
          { id: "d", label: "Rien : placer est toujours une erreur" },
        ],
        correctOptionId: "a",
        explain:
          "Placer à deux pour cent ce qu'on refinancera à treize par découvert est l'arbitrage perdant type. Seul le budget de trésorerie dit où se trouve la part réellement inutile.",
      },
    ],
    modelRelevance: {
      cash_budget: "optimal",
      frng_bfr_analysis: "acceptable",
      relevant_costs: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["net_treasury", "receivables_financing", "bfr"],
    hints: hints([
      "Demandez-vous d'où vient cet argent avant de le déclarer disponible.",
      "Une créance cédée ne sera pas encaissée une deuxième fois.",
      "Datez les sorties des prochaines semaines : gazole, salaires, échéance de flotte.",
      "Ce qui reste après ces sorties, et seulement cela, peut être immobilisé.",
      "Comparez enfin le taux du placement à celui de votre découvert : l'écart montre à quel point l'erreur se paie cher.",
    ]),
    trigger: { detect: "idle_cash" },
    weight: 0.8,
  },
  {
    code: "transport_detect_sous_seuil",
    title: "Les camions roulent, l'entreprise perd",
    narrative:
      "Le trafic du trimestre est passé sous le seuil de rentabilité. Les camions ont pourtant roulé, les chauffeurs ont fait leurs heures, et le carnet n'était pas vide. C'est la situation la plus traître du transport : l'activité donne l'illusion de la santé.",
    problem:
      "De combien manque-t-il, et sur quel levier agir en premier ?",
    diagnosticOptions: [
      {
        id: "ecart_en_palettes",
        label:
          "L'écart au seuil se convertit en nombre de palettes : c'est ce qui rend la décision concrète",
        correct: true,
      },
      {
        id: "trois_leviers",
        label:
          "Trois leviers existent : le prix, le volume et le coût variable. Ils ne se valent pas",
        correct: true,
      },
      {
        id: "rouler_plus",
        label: "Il suffit de rouler davantage : l'activité finit toujours par couvrir les charges",
        correct: false,
      },
      {
        id: "licencier",
        label: "Réduire l'effectif est la seule réponse à un trimestre déficitaire",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "levier_prix",
        prompt:
          "Pourquoi un euro de prix en plus pèse-t-il davantage qu'un euro de coût variable en moins ?",
        options: [
          {
            id: "a",
            label:
              "Il ne pèse pas davantage : les deux augmentent la marge unitaire d'un euro, mais le prix fait fuir des clients",
          },
          { id: "b", label: "Parce que le prix n'a pas d'effet sur la demande" },
          { id: "c", label: "Parce que le coût variable est fixe" },
          { id: "d", label: "Parce que le prix est décidé par le client" },
        ],
        correctOptionId: "a",
        explain:
          "Sur la marge unitaire, l'effet est identique. La différence est commerciale : la hausse de prix se paie en volume perdu, l'économie de coût non. C'est pourquoi on cherche d'abord le coût.",
      },
      {
        id: "marge_securite",
        prompt: "Que mesure la marge de sécurité ?",
        options: [
          {
            id: "a",
            label:
              "De combien l'activité peut baisser avant que l'exercice ne devienne déficitaire",
          },
          { id: "b", label: "Le montant de trésorerie disponible" },
          { id: "c", label: "La part de contrats garantis" },
          { id: "d", label: "Le taux de remplissage de la flotte" },
        ],
        correctOptionId: "a",
        explain:
          "Elle transforme le seuil en indicateur de fragilité. Une marge de sécurité de cinq pour cent dans un métier saisonnier annonce un trimestre déficitaire dès la première mauvaise saison.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cvp_analysis: "acceptable",
      variance_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["breakeven", "safety_margin", "contribution_margin", "dead_point"],
    hints: hints([
      "Commencez par mesurer l'écart, en euros puis en palettes.",
      "Divisez le manque à gagner par la marge unitaire de 49 €.",
      "Vous obtenez le nombre de palettes qui vous ont manqué : un objectif, pas une inquiétude.",
      "Trois leviers agissent sur cet écart : le prix, le volume et le coût variable.",
      "Le prix se paie en clients perdus, le volume dépend du marché : commencez par le coût variable, le seul que vous maîtrisez entièrement.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 0.9,
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  transport_t1_revient:
    "Le modèle coût-volume-profit relie en une seule lecture le prix, le coût variable et une structure lourde, et répond directement à la question du remplissage minimal.",
  transport_t2_retour_vide:
    "L'analyse de capacité rappelle qu'une place non vendue est perdue à jamais, ce qui justifie de vendre le remplissage résiduel très en dessous du prix moyen.",
  transport_t3_gazole:
    "L'analyse de sensibilité hiérarchise les fragilités et montre que, dans ce métier, le prix du gazole déplace le résultat bien plus que le volume transporté.",
  transport_t4_grand_compte:
    "L'analyse fonctionnelle montre ce que le compte de résultat cache : payer à quinze jours ce qu'on encaisse à soixante immobilise une trésorerie proportionnelle au trafic.",
  transport_t5_flotte:
    "La valeur actuelle nette ramène six ans d'économies d'entretien et de carburant à une valeur d'aujourd'hui, seule façon de les comparer à un décaissement immédiat.",
  transport_t6_contrat_refuse:
    "Les coûts pertinents intègrent le coût d'opportunité des camions immobilisés, que la seule marge sur coût variable ignore complètement.",
  transport_detect_idle_cash:
    "Le budget de trésorerie date les sorties que ce solde doit couvrir. Seul lui distingue une avance sur créances d'un excédent réellement disponible.",
  transport_detect_sous_seuil:
    "Le seuil de rentabilité convertit l'écart en nombre de palettes et rend la décision concrète, levier par levier.",
};

attachModelQuestions(TRANSPORT_SITUATIONS, MODEL_EXPLAIN);
