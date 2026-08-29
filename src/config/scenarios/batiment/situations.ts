import { attachModelQuestions, hints, type SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de MARTEL & FILS (bâtiment, rénovation).
 *
 * Le fil rouge du secteur : l'entreprise paie tout d'avance et encaisse en
 * dernier. Un chantier gagné mal financé coûte plus cher qu'un chantier perdu.
 */
export const BATIMENT_SITUATIONS: SituationDef[] = [
  {
    code: "batiment_t1_marge",
    title: "Quatorze compagnons et un dépôt",
    narrative:
      "Vous reprenez MARTEL & FILS : quatorze compagnons, un dépôt, des échafaudages, et un carnet qui se remplit au coup par coup. Le mètre carré rénové se facture 380 €, il coûte 168 € de matériaux et 42 € de frais de chantier. Le reste tombe tous les trimestres, que les équipes travaillent ou non.",
    problem:
      "Combien de mètres carrés faut-il livrer dans le trimestre pour ne rien perdre ?",
    diagnosticOptions: [
      {
        id: "structure_fixe",
        label:
          "Les salaires des compagnons tombent que le chantier avance ou non : ce sont des charges de structure",
        correct: true,
      },
      {
        id: "marge_unitaire",
        label:
          "Chaque mètre carré laisse 170 € pour couvrir cette structure avant de dégager du résultat",
        correct: true,
      },
      {
        id: "materiaux_seuls",
        label: "Seuls les matériaux comptent : la main-d'œuvre est déjà payée de toute façon",
        correct: false,
      },
      {
        id: "plus_de_chantiers",
        label: "Il suffit de signer plus de chantiers, le reste suivra tout seul",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "marge_m2",
        prompt: "Quelle est la marge sur coût variable d'un mètre carré rénové ?",
        options: [
          { id: "a", label: "170 €, soit 380 − 168 − 42" },
          { id: "b", label: "212 €, soit 380 − 168" },
          { id: "c", label: "380 €, le prix facturé" },
          { id: "d", label: "42 €, les frais de chantier" },
        ],
        correctOptionId: "a",
        explain:
          "Matériaux et frais de chantier suivent la surface traitée : ils sont variables. Les 170 € qui restent servent d'abord à payer la structure, et seulement ensuite à faire du résultat.",
      },
      {
        id: "seuil_m2",
        prompt:
          "Avec 138 000 € de charges de structure décaissées par trimestre, à partir de quelle surface l'exercice devient-il bénéficiaire ?",
        options: [
          { id: "a", label: "Environ 810 m², soit un peu plus de la moitié de la capacité" },
          { id: "b", label: "Environ 1 500 m², la capacité entière" },
          { id: "c", label: "Environ 360 m²" },
          { id: "d", label: "Environ 1 200 m², le rythme actuel" },
        ],
        correctOptionId: "a",
        explain:
          "138 000 ÷ 170 ≈ 812 m². En dessous, chaque mètre carré manquant coûte 170 € de résultat ; au-dessus, il en rapporte autant.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cvp_analysis: "acceptable",
      capacity_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["contribution_margin", "fixed_costs", "breakeven", "variable_costs"],
    hints: hints([
      "Séparez ce qui suit la surface traitée de ce qui tombe quoi qu'il arrive.",
      "Les salaires des compagnons ne bougent pas d'un euro entre un trimestre chargé et un trimestre creux.",
      "Chaque mètre carré laisse 380 − 168 − 42 = 170 € pour la structure.",
      "Seuil = 138 000 ÷ 170 ≈ 810 m². Comparez-le à votre capacité de 1 500 m².",
      "Vous travaillez donc à 54 % de capacité rien que pour équilibrer. Tout ce qui est au-dessus part presque entièrement en résultat.",
    ]),
    trigger: { round: 1 },
    weight: 1,
  },
  {
    code: "batiment_t2_devis",
    title: "Le devis qu'il ne faudrait pas signer",
    narrative:
      "Un promoteur propose un lot de finitions à 268 € le mètre carré. Votre prix de revient complet ressort à 325 €, structure comprise. Votre conducteur de travaux veut refuser. Mais vos équipes ont deux semaines creuses en février, et elles seront payées de toute façon.",
    problem:
      "Ce chantier appauvrit-il l'entreprise, ou vaut-il mieux que le vide ?",
    diagnosticOptions: [
      {
        id: "couvre_variable",
        label:
          "À 268 €, le chantier couvre les 210 € de coût variable et laisse 58 € par mètre carré à la structure",
        correct: true,
      },
      {
        id: "structure_deja_payee",
        label:
          "Les charges de structure sont engagées de toute façon : elles ne changent pas selon que ce chantier est signé ou non",
        correct: true,
      },
      {
        id: "sous_prix_revient",
        label: "Sous le prix de revient complet, tout chantier fait perdre de l'argent",
        correct: false,
      },
      {
        id: "toujours_accepter",
        label:
          "Il faut accepter tout chantier qui couvre le coût variable, quelles que soient les circonstances",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "cout_pertinent",
        prompt:
          "Quels coûts faut-il retenir pour décider d'accepter ce chantier de remplissage ?",
        options: [
          { id: "a", label: "Les seuls coûts qui changent selon la décision : les 210 € variables" },
          { id: "b", label: "Le prix de revient complet de 325 €" },
          { id: "c", label: "Les matériaux uniquement" },
          { id: "d", label: "La totalité des charges de structure du trimestre" },
        ],
        correctOptionId: "a",
        explain:
          "Un coût pertinent est un coût que la décision fait varier. Les salaires et le dépôt seront payés que le chantier existe ou non : les intégrer conduirait à refuser une affaire qui enrichit l'entreprise.",
      },
      {
        id: "quand_refuser",
        prompt: "Dans quel cas faut-il refuser malgré une marge sur coût variable positive ?",
        options: [
          {
            id: "a",
            label:
              "Quand les équipes sont pleines : le chantier en chasserait un autre, mieux payé",
          },
          { id: "b", label: "Quand le client est un promoteur" },
          { id: "c", label: "Quand le prix est inférieur au prix de revient complet" },
          { id: "d", label: "Jamais, une marge positive se prend toujours" },
        ],
        correctOptionId: "a",
        explain:
          "Le raisonnement ne tient qu'à capacité disponible. Dès que les équipes sont saturées, le vrai coût du chantier devient la marge du chantier qu'il empêche : c'est un coût d'opportunité.",
      },
    ],
    modelRelevance: {
      relevant_costs: "optimal",
      marginal_analysis: "acceptable",
      breakeven_analysis: "misleading",
      npv: "irrelevant",
    },
    conceptCodes: ["variable_costs", "fixed_costs", "contribution_margin", "capacity"],
    hints: hints([
      "Demandez-vous ce qui change vraiment si vous refusez ce chantier.",
      "Les compagnons seront payés en février, chantier ou pas chantier.",
      "Le prix de revient complet répartit une structure qui, elle, ne bouge pas avec la décision.",
      "268 − 210 = 58 € par mètre carré qui n'existeraient pas sans ce chantier.",
      "La réponse s'inverse le jour où vos équipes sont pleines : il faudra alors comparer 58 € à la marge du chantier qu'on refuse pour celui-ci.",
    ]),
    trigger: { round: 2 },
    weight: 1,
  },
  {
    code: "batiment_t3_bfr",
    title: "Un carnet plein et un compte à sec",
    narrative:
      "Le trimestre est le meilleur depuis longtemps : les équipes n'ont pas arrêté, le résultat est positif. Pourtant votre comptable vous appelle : le compte est en découvert, et la traite des matériaux se présente lundi. Vos clients, eux, règlent entre trente et quatre-vingt-dix jours.",
    problem:
      "Comment une entreprise qui gagne de l'argent peut-elle ne plus en avoir en caisse ?",
    diagnosticOptions: [
      {
        id: "decalage",
        label:
          "L'entreprise paie matériaux et salaires avant d'encaisser : le décalage se finance",
        correct: true,
      },
      {
        id: "croissance_aggrave",
        label:
          "Plus l'activité augmente, plus ce décalage grossit : la croissance consomme de la trésorerie",
        correct: true,
      },
      {
        id: "encours_dort",
        label:
          "Les chantiers commencés et non facturés immobilisent du travail déjà payé",
        correct: true,
      },
      {
        id: "perte_cachee",
        label: "C'est le signe d'une perte que la comptabilité n'a pas encore enregistrée",
        correct: false,
      },
      {
        id: "erreur_banque",
        label: "C'est une erreur de la banque : un résultat positif se retrouve toujours en caisse",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "composants_bfr",
        prompt: "De quoi est fait le besoin en fonds de roulement de cette entreprise ?",
        options: [
          {
            id: "a",
            label: "Créances clients plus en-cours de chantier, moins dettes fournisseurs",
          },
          { id: "b", label: "Du résultat non encore distribué" },
          { id: "c", label: "Du montant de l'emprunt restant à rembourser" },
          { id: "d", label: "De la trésorerie disponible au dépôt" },
        ],
        correctOptionId: "a",
        explain:
          "Le besoin en fonds de roulement mesure ce que le cycle d'exploitation immobilise : ce que les clients doivent, plus le travail déjà fait et pas encore facturé, moins ce que les fournisseurs acceptent d'avancer.",
      },
      {
        id: "relation_tn",
        prompt: "Quelle relation lie la trésorerie nette aux deux autres agrégats ?",
        options: [
          { id: "a", label: "Trésorerie nette = fonds de roulement − besoin en fonds de roulement" },
          { id: "b", label: "Trésorerie nette = résultat − dividendes" },
          { id: "c", label: "Trésorerie nette = fonds de roulement + besoin en fonds de roulement" },
          { id: "d", label: "Trésorerie nette = chiffre d'affaires − charges décaissées" },
        ],
        correctOptionId: "a",
        explain:
          "Le fonds de roulement est ce que les ressources durables laissent disponible ; le besoin est ce que le cycle dévore. La trésorerie n'est que la différence, et elle devient négative dès que le besoin dépasse la ressource.",
      },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      cash_budget: "acceptable",
      breakeven_analysis: "misleading",
      elasticity_analysis: "irrelevant",
    },
    conceptCodes: ["bfr", "frng", "net_treasury", "stock"],
    hints: hints([
      "Un résultat se constate à la facture, une trésorerie au virement.",
      "Regardez le délai qui sépare le paiement des matériaux de l'encaissement du client.",
      "Ajoutez les chantiers commencés et non facturés : ce sont des salaires déjà versés.",
      "Besoin en fonds de roulement = créances + en-cours − dettes fournisseurs.",
      "Trésorerie nette = fonds de roulement − besoin. Votre besoin a grossi avec l'activité, le fonds de roulement n'a pas suivi.",
    ]),
    trigger: { round: 3 },
    weight: 1.2,
  },
  {
    code: "batiment_t4_retenue",
    title: "Cinq pour cent qui manquent toujours",
    narrative:
      "Le marché de la commune est terminé et réceptionné. La facture part, mais le maître d'ouvrage retient cinq pour cent au titre de la garantie de parfait achèvement, pour un an. Sur les autres chantiers, le mandatement arrive à quatre-vingt-dix jours. Et lundi, les salaires.",
    problem:
      "Quel outil montre le mois où vous manquerez de caisse, et de combien ?",
    diagnosticOptions: [
      {
        id: "budget_tresorerie",
        label:
          "Un budget de trésorerie qui date chaque encaissement et chaque décaissement, mois par mois",
        correct: true,
      },
      {
        id: "retenue_immobilise",
        label:
          "La retenue de garantie est un encaissement décalé d'un an : elle immobilise de la trésorerie sans rien coûter en résultat",
        correct: true,
      },
      {
        id: "compte_resultat_suffit",
        label: "Le compte de résultat prévisionnel suffit : s'il est positif, la caisse suivra",
        correct: false,
      },
      {
        id: "bilan_suffit",
        label: "Le bilan de fin d'exercice montrera le problème à temps",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "difference_budget",
        prompt:
          "Qu'est-ce qui distingue un budget de trésorerie d'un compte de résultat prévisionnel ?",
        options: [
          {
            id: "a",
            label:
              "Le budget de trésorerie date les flux ; le compte de résultat rattache les opérations à la période où elles sont réalisées",
          },
          { id: "b", label: "Le budget de trésorerie ne retient que les charges" },
          { id: "c", label: "Ils donnent le même résultat, présenté autrement" },
          { id: "d", label: "Le budget de trésorerie remplace le bilan prévisionnel" },
        ],
        correctOptionId: "a",
        explain:
          "Un résultat prévisionnel positif ne dit rien du mois où la caisse sera vide : seul le budget de trésorerie, qui suit les dates réelles de règlement, le montre.",
      },
      {
        id: "retenue_effet",
        prompt: "Quel est l'effet comptable d'une retenue de garantie de cinq pour cent ?",
        options: [
          {
            id: "a",
            label:
              "Le produit est acquis en totalité, mais cinq pour cent restent en créance pendant un an",
          },
          { id: "b", label: "Le chiffre d'affaires est amputé de cinq pour cent" },
          { id: "c", label: "C'est une charge exceptionnelle du trimestre" },
          { id: "d", label: "C'est une dette envers le maître d'ouvrage" },
        ],
        correctOptionId: "a",
        explain:
          "La retenue ne touche pas le résultat, elle touche la trésorerie. C'est précisément le genre de somme qu'un dirigeant croit avoir et qui n'arrivera que l'an prochain.",
      },
    ],
    modelRelevance: {
      cash_budget: "optimal",
      frng_bfr_analysis: "acceptable",
      variance_analysis: "acceptable",
      breakeven_analysis: "irrelevant",
    },
    conceptCodes: ["net_treasury", "bfr", "receivables_financing", "revenue"],
    hints: hints([
      "Cherchez l'outil qui répond à « quand », pas à « combien ».",
      "Un résultat annuel positif peut cacher trois mois de caisse négative.",
      "Datez chaque encaissement au jour où l'argent arrive vraiment, pas au jour de la facture.",
      "La retenue de garantie ne se voit pas au compte de résultat : elle dort au poste clients.",
      "Le budget de trésorerie mois par mois est le seul document qui affiche le trou et sa profondeur, donc le seul qui permette d'aller voir la banque avant qu'il ne s'ouvre.",
    ]),
    trigger: { round: 4 },
    weight: 1.1,
  },
  {
    code: "batiment_t5_sous_traiter",
    title: "Embaucher, sous-traiter ou refuser",
    narrative:
      "Le carnet déborde de six cents mètres carrés que vos équipes ne pourront pas absorber. Un confrère propose de les prendre en sous-traitance à 245 € le mètre carré. Embaucher deux compagnons coûterait 19 200 € par trimestre, plus 6 400 € de recrutement, et ils ne seraient opérationnels qu'au tour suivant.",
    problem:
      "Sous-traiter, embaucher ou laisser filer : que dit le calcul, et sur quel horizon ?",
    diagnosticOptions: [
      {
        id: "sous_traitance_marge",
        label:
          "Sous-traiter à 245 € laisse la différence avec le prix facturé, sans engager l'entreprise au-delà du chantier",
        correct: true,
      },
      {
        id: "embauche_engage",
        label:
          "Embaucher est une charge de structure : elle pèsera aussi les trimestres où le carnet se videra",
        correct: true,
      },
      {
        id: "delai_embauche",
        label:
          "L'embauche ne produit rien ce trimestre : elle ne répond pas au besoin immédiat",
        correct: true,
      },
      {
        id: "toujours_embaucher",
        label: "Embaucher est toujours préférable : la marge reste dans l'entreprise",
        correct: false,
      },
      {
        id: "refuser_prudent",
        label: "Refuser est la décision prudente : on ne prend pas de chantier qu'on ne fait pas soi-même",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "marge_sous_traitance",
        prompt:
          "Sur un mètre carré facturé 372 € et sous-traité 245 €, que gagne l'entreprise ?",
        options: [
          { id: "a", label: "127 €, sans consommer d'heures de ses propres compagnons" },
          { id: "b", label: "162 €, la marge habituelle" },
          { id: "c", label: "Rien : la marge part chez le sous-traitant" },
          { id: "d", label: "372 €, le prix facturé" },
        ],
        correctOptionId: "a",
        explain:
          "La sous-traitance transforme une marge de 162 € en marge de 127 €, mais sur une surface que l'entreprise n'aurait pas pu traiter du tout. La comparaison pertinente est 127 € contre zéro.",
      },
      {
        id: "horizon",
        prompt: "Sur quel horizon faut-il juger l'embauche de deux compagnons ?",
        options: [
          {
            id: "a",
            label:
              "Sur plusieurs trimestres : c'est un engagement durable qu'un carnet plein un seul trimestre ne justifie pas",
          },
          { id: "b", label: "Sur le trimestre en cours uniquement" },
          { id: "c", label: "Sur la durée du chantier concerné" },
          { id: "d", label: "L'horizon n'entre pas dans le calcul" },
        ],
        correctOptionId: "a",
        explain:
          "Une embauche se décide sur la charge durable, pas sur un pic. C'est la différence entre une décision d'exploitation, réversible, et une décision de structure, qui ne l'est pas.",
      },
    ],
    modelRelevance: {
      marginal_analysis: "optimal",
      relevant_costs: "acceptable",
      capacity_analysis: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["capacity", "contribution_margin", "fixed_costs", "productivity"],
    hints: hints([
      "Comparez chaque option à ce qui se passe si vous ne faites rien.",
      "Sous-traiter rapporte moins par mètre carré, mais sur une surface que vous ne pouviez pas traiter.",
      "L'embauche ne produit rien ce trimestre : le recrutement prend du temps.",
      "127 € de marge sur six cents mètres carrés, contre zéro si vous refusez.",
      "Et posez-vous la vraie question : ce carnet plein durera-t-il assez pour porter deux salaires trimestre après trimestre ?",
    ]),
    trigger: { round: 5 },
    weight: 1,
  },
  {
    code: "batiment_t6_nacelle",
    title: "La nacelle ou la location",
    narrative:
      "Vous louez une nacelle deux mois par trimestre, pour 11 000 € à chaque fois. L'acheter coûterait 96 000 €, amortissables sur six ans, avec 1 800 € d'entretien par trimestre. Votre banquier suivrait, à condition que le calcul tienne debout devant lui.",
    problem:
      "L'achat crée-t-il de la valeur, et à quelles conditions le calcul reste-t-il valable ?",
    diagnosticOptions: [
      {
        id: "flux_differentiels",
        label:
          "Il faut comparer les flux que la décision change : l'économie de location contre le décaissement d'achat et l'entretien",
        correct: true,
      },
      {
        id: "actualiser",
        label:
          "Les économies futures valent moins que l'argent d'aujourd'hui : il faut les actualiser",
        correct: true,
      },
      {
        id: "amortissement_flux",
        label: "L'amortissement est un décaissement à retenir dans le calcul de la valeur actuelle nette",
        correct: false,
      },
      {
        id: "moins_cher_donc_oui",
        label: "L'achat coûte moins cher au total : la décision est prise",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "van_signe",
        prompt: "Que signifie une valeur actuelle nette positive ?",
        options: [
          {
            id: "a",
            label:
              "Le projet rapporte plus que le coût du capital qu'il mobilise : il crée de la valeur",
          },
          { id: "b", label: "Le projet est rentable comptablement dès la première année" },
          { id: "c", label: "Le projet se rembourse en moins de trois ans" },
          { id: "d", label: "Le projet n'a aucun risque" },
        ],
        correctOptionId: "a",
        explain:
          "La valeur actuelle nette compare les flux futurs actualisés au décaissement initial. Positive, elle dit que le projet fait mieux que le taux exigé, pas qu'il est sans risque.",
      },
      {
        id: "amortissement_van",
        prompt: "Pourquoi l'amortissement n'entre-t-il pas directement dans les flux actualisés ?",
        options: [
          {
            id: "a",
            label:
              "Ce n'est pas un décaissement : l'argent est sorti à l'achat, l'amortissement ne fait que l'étaler comptablement",
          },
          { id: "b", label: "Parce qu'il est trop faible pour changer le résultat" },
          { id: "c", label: "Parce qu'il est déductible fiscalement" },
          { id: "d", label: "Parce qu'il ne concerne que le bilan" },
        ],
        correctOptionId: "a",
        explain:
          "Un calcul de valeur actuelle nette raisonne en flux de trésorerie. L'amortissement n'en est pas un ; il n'intervient qu'indirectement, par l'économie d'impôt qu'il procure.",
      },
    ],
    modelRelevance: {
      npv: "optimal",
      irr: "acceptable",
      return_analysis: "acceptable",
      breakeven_analysis: "irrelevant",
    },
    conceptCodes: ["discounting", "irr_payback", "profitability_vs_return", "fixed_costs"],
    hints: hints([
      "Ne comparez que ce que la décision change réellement.",
      "L'économie annuelle de location est le flux d'entrée du projet.",
      "L'entretien vient en déduction, l'amortissement non : ce n'est pas une sortie d'argent.",
      "Actualisez ces flux au taux que vous coûte votre financement.",
      "Et testez la fragilité du calcul : si vous ne louiez la nacelle qu'un mois par trimestre, la conclusion tiendrait-elle encore ?",
    ]),
    trigger: { round: 6 },
    weight: 1,
  },
  {
    code: "batiment_detect_idle_cash",
    title: "L'acompte du gros chantier dort sur le compte",
    narrative:
      "L'acompte de trente pour cent versé à la signature du marché de la commune est arrivé, et le compte affiche un solde comme vous n'en aviez pas vu depuis deux ans. La tentation est grande d'y voir un excédent. Mais cet argent n'est pas à vous : il doit payer les matériaux du chantier, les salaires des compagnons pendant les six mois de travaux, et il faudra encore tenir quatre-vingt-dix jours après la réception avant que le solde n'arrive. Le placer immobiliserait exactement la somme qui doit servir à travailler.",
    problem:
      "Ce solde est-il un excédent à placer, ou une avance à faire durer ?",
    diagnosticOptions: [
      {
        id: "avance_pas_excedent",
        label:
          "C'est une avance sur un chantier à venir : elle est déjà engagée par les dépenses qu'elle doit couvrir",
        correct: true,
      },
      {
        id: "dater_les_sorties",
        label:
          "Seul un budget de trésorerie mois par mois dira ce qui reste réellement disponible, et jusqu'à quand",
        correct: true,
      },
      {
        id: "placer_tout",
        label: "Un solde élevé est un excédent : le placer est toujours préférable à le laisser dormir",
        correct: false,
      },
      {
        id: "beneficier",
        label: "Cet acompte est un bénéfice acquis, puisqu'il est encaissé",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "acompte_nature",
        prompt: "Comptablement, qu'est-ce qu'un acompte reçu sur un chantier non commencé ?",
        options: [
          { id: "a", label: "Une dette envers le client, tant que la prestation n'est pas réalisée" },
          { id: "b", label: "Un produit acquis au trimestre de l'encaissement" },
          { id: "c", label: "Une créance client" },
          { id: "d", label: "Un apport en capital" },
        ],
        correctOptionId: "a",
        explain:
          "L'argent est là, mais il est dû en travail. Le confondre avec un résultat est la faute qui coule les entreprises du bâtiment un an après leur meilleur chantier.",
      },
      {
        id: "cout_immobilisation",
        prompt: "Que risque une entreprise qui place cet acompte à trois mois ?",
        options: [
          {
            id: "a",
            label:
              "Devoir financer par découvert, à un taux bien supérieur, les dépenses du chantier entre-temps",
          },
          { id: "b", label: "Rien : le placement se débloque à tout moment" },
          { id: "c", label: "Une amende du maître d'ouvrage" },
          { id: "d", label: "Une perte comptable immédiate" },
        ],
        correctOptionId: "a",
        explain:
          "Placer à deux pour cent ce qu'on refinancera à quatorze est l'arbitrage perdant type. Le placement ne se justifie que sur la part que le budget de trésorerie montre réellement inutile.",
      },
    ],
    modelRelevance: {
      cash_budget: "optimal",
      frng_bfr_analysis: "acceptable",
      relevant_costs: "acceptable",
      elasticity_analysis: "irrelevant",
    },
    conceptCodes: ["net_treasury", "bfr", "receivables_financing"],
    hints: hints([
      "Demandez-vous à quoi cet argent est destiné avant de le trouver disponible.",
      "Un acompte se reçoit avant le travail : il finance ce travail.",
      "Datez les sorties des six prochains mois : matériaux, salaires, échéances.",
      "Ce qui reste après ces sorties, et seulement cela, peut être placé.",
      "Comparez le taux du placement à celui de votre découvert : placer trop, c'est financer à quatorze pour cent ce qu'on rémunère à deux.",
    ]),
    trigger: { detect: "idle_cash" },
    weight: 0.8,
  },
  {
    code: "batiment_detect_capacite",
    title: "Les équipes ne suivent plus",
    narrative:
      "Vos compagnons enchaînent sans temps mort et vous refusez des chantiers chaque semaine. Le matériel, lui, tourne à plein : deux équipes attendent parfois le même échafaudage. La demande est là, la capacité ne l'est plus.",
    problem:
      "Laquelle des deux contraintes vous bloque vraiment, et laquelle desserrer d'abord ?",
    diagnosticOptions: [
      {
        id: "double_plafond",
        label:
          "Deux plafonds coexistent : les heures de compagnons et le matériel disponible. Le plus bas commande",
        correct: true,
      },
      {
        id: "desserrer_le_bon",
        label:
          "Desserrer la contrainte qui ne bloque pas ne produit pas un mètre carré de plus",
        correct: true,
      },
      {
        id: "embaucher_toujours",
        label: "Embaucher augmente toujours la production, quelle que soit la contrainte active",
        correct: false,
      },
      {
        id: "baisser_prix",
        label: "Il faut baisser les prix pour écouler la demande excédentaire",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "goulot",
        prompt: "Comment identifier la contrainte qui limite réellement la production ?",
        options: [
          {
            id: "a",
            label:
              "En comparant les deux plafonds exprimés dans la même unité : la plus faible est le goulot",
          },
          { id: "b", label: "En regardant celle qui coûte le plus cher" },
          { id: "c", label: "En prenant la moyenne des deux" },
          { id: "d", label: "En regardant le nombre de chantiers refusés" },
        ],
        correctOptionId: "a",
        explain:
          "Le panneau de capacité affiche les deux plafonds en mètres carrés par trimestre. Celui du bas est le seul qui décide ; investir sur l'autre ne change rien.",
      },
      {
        id: "delai_capacite",
        prompt: "Quel décalage sépare la décision d'investir de son effet sur la production ?",
        options: [
          { id: "a", label: "Le matériel acheté ce trimestre n'est en service qu'au suivant" },
          { id: "b", label: "L'effet est immédiat dès le paiement" },
          { id: "c", label: "Il faut deux trimestres complets" },
          { id: "d", label: "Aucun décalage : la capacité suit la demande" },
        ],
        correctOptionId: "a",
        explain:
          "Une capacité se décide avant d'en avoir besoin. Attendre la saturation pour investir, c'est perdre un trimestre entier de chantiers refusés.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      productivity_analysis: "acceptable",
      marginal_analysis: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["capacity", "productivity", "contribution_margin"],
    hints: hints([
      "Ouvrez le panneau de capacité : il donne les deux plafonds.",
      "Les heures de compagnons et le matériel s'expriment tous deux en mètres carrés par trimestre.",
      "Le plus bas des deux est le seul qui décide de ce que vous pouvez livrer.",
      "Investir sur l'autre ne produira pas un mètre carré supplémentaire.",
      "Et rappelez-vous que le matériel acheté ce trimestre n'entre en service qu'au suivant : la décision se prend un tour à l'avance.",
    ]),
    trigger: { detect: "capacity_saturated" },
    weight: 0.8,
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  batiment_t1_marge:
    "Le seuil de rentabilité traduit une structure lourde et une marge unitaire connue en une seule question : combien de mètres carrés faut-il livrer avant de gagner quoi que ce soit ?",
  batiment_t2_devis:
    "Les coûts pertinents écartent tout ce que la décision ne change pas. Le seuil de rentabilité, lui, répartirait une structure déjà engagée et ferait refuser une affaire qui enrichit l'entreprise.",
  batiment_t3_bfr:
    "L'analyse fonctionnelle sépare ce que le cycle immobilise de ce que les ressources durables financent, et montre pourquoi un exercice bénéficiaire peut vider un compte bancaire.",
  batiment_t4_retenue:
    "Le budget de trésorerie est le seul document qui date les flux. Il désigne le mois du trou et sa profondeur, ce qu'aucun compte de résultat prévisionnel ne fera jamais.",
  batiment_t5_sous_traiter:
    "L'analyse marginale compare le supplément de recette au supplément de coût de chaque option, y compris celle de ne rien faire, qui rapporte zéro.",
  batiment_t6_nacelle:
    "La valeur actuelle nette ramène des économies étalées sur six ans à une valeur d'aujourd'hui, seule façon de les comparer à un décaissement immédiat.",
  batiment_detect_idle_cash:
    "Le budget de trésorerie étale sur les mois du chantier les dépenses que cet acompte doit couvrir. Seul lui montre que ce solde n'est pas un excédent, mais une avance à faire durer.",
  batiment_detect_capacite:
    "L'analyse de capacité met les deux plafonds dans la même unité et désigne le goulot. Sans elle, on investit là où ça ne débloque rien.",
};

attachModelQuestions(BATIMENT_SITUATIONS, MODEL_EXPLAIN);
