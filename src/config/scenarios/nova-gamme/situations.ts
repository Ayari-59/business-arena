/**
 * Situations pédagogiques de NOVA · GAMME.
 *
 * Même dramaturgie que le NOVA d'origine (reprise, guerre des prix, atelier
 * qui plafonne, paradoxe du tour 4, hausse matières, grand oral), mais posée
 * sur trois références qui se disputent le même atelier. Ce que la gamme
 * ajoute à chaque tour : le MIX. Une marge se lit par référence, un seuil se
 * calcule à mix constant, un facteur rare s'arbitre à la marge par unité de
 * capacité, et une trésorerie se creuse différemment selon qui paie à quel
 * délai. Les types et la mécanique vivent dans ../situation-kit.ts.
 */

import { attachModelQuestions, hints } from "../situation-kit";
import type { SituationDef } from "../situation-kit";

export const NOVA_GAMME_SITUATIONS: SituationDef[] = [
  {
    code: "novag_t1_reprise",
    category: "prise_de_poste",
    title: "Trois enceintes, un atelier",
    narrative:
      "Vous reprenez NOVA. L'ancien dirigeant vous laisse un atelier, quatre opérateurs, deux enceintes en vente, la Go de poche et la One qui a fait la marque, et un prototype de Studio dans les cartons : il faudra le financer pour le vendre. SoundBox casse les prix sur les deux premières, Auris ne vend presque que du haut de gamme.",
    problem:
      "Avant de fixer vos prix et vos volumes : que doit rapporter chaque enceinte, combien faut-il en vendre pour ne pas perdre d'argent, et la Studio vaut-elle sa recherche ?",
    diagnosticOptions: [
      { id: "novag_marge_par_reference", label: "Chaque référence a sa marge sur coût variable, et elles n'ont rien à voir entre elles", correct: true },
      { id: "novag_seuil_mix", label: "Le seuil de rentabilité dépend du mix vendu : plus de Studio, moins d'enceintes à vendre", correct: true },
      { id: "novag_rd_horizon", label: "La recherche se paie maintenant et ne rapporte qu'une fois la Studio en vente : c'est un investissement à horizon", correct: true },
      { id: "novag_meme_prix", label: "Il faut aligner les trois prix sur celui de la One pour simplifier", correct: false },
      { id: "novag_max_volume", label: "Produire l'atelier à plein de Go, l'enceinte la plus demandée, quoi qu'il arrive", correct: false },
    ],
    quiz: [
      {
        id: "novag_mcv_reference",
        prompt: "La marge sur coût variable d'une référence, c'est…",
        options: [
          { id: "a", label: "Son prix de vente moins son coût variable unitaire" },
          { id: "b", label: "Son prix de vente moins sa part des charges de structure" },
          { id: "c", label: "Le chiffre d'affaires de la gamme divisé par trois" },
          { id: "d", label: "Son prix de vente multiplié par ses ventes" },
        ],
        correctOptionId: "a",
        explain:
          "Chaque enceinte vendue laisse (prix − coût variable) pour éponger les charges de structure. Une Studio en laisse près de cinq fois plus qu'une Go : ce n'est pas le même produit pour le compte de résultat.",
      },
      {
        id: "novag_seuil_mix_constant",
        prompt: "Avec plusieurs références, le seuil de rentabilité en volume se calcule…",
        options: [
          { id: "a", label: "Charges de structure ÷ marge sur coût variable MOYENNE, pondérée par le mix prévu" },
          { id: "b", label: "Charges de structure ÷ marge de la référence la plus vendue" },
          { id: "c", label: "Un seuil par référence, en divisant les charges de structure par trois" },
          { id: "d", label: "Capacité de l'atelier × taux d'utilisation" },
        ],
        correctOptionId: "a",
        explain:
          "Les charges de structure sont communes : on les divise par la marge moyenne d'une enceinte vendue, au mix prévu. Changer le mix change le seuil, sans toucher à un seul prix.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cvp_analysis: "acceptable",
      marginal_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["revenue", "fixed_costs", "variable_costs", "contribution_margin", "breakeven"],
    hints: hints([
      "Regardez vos charges : certaines tombent chaque trimestre, que vous vendiez des Go, des One ou rien du tout.",
      "Combien laisse une Go une fois ses composants et sa main-d'œuvre payés ? Et une Studio ?",
      "Il existe un volume précis, toutes références confondues, à partir duquel vous cessez de perdre de l'argent — et il dépend de ce que vous vendez.",
      "Une analyse du seuil de rentabilité à mix constant donnerait un objectif chiffré à votre premier trimestre.",
      "Calculez la marge moyenne d'une enceinte au mix prévu (15 € la Go, 21 € la One, 59 € la Studio une fois lancée), puis divisez les charges de structure par cette marge. Et comparez le coût de développement de la Studio aux marges qu'elle rapportera d'ici Noël : financée dès ce tour, elle se vend au suivant.",
    ]),
    trigger: { round: 1 },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "review", hint: "Trois prix, trois marges unitaires : c'est le mix de ces marges qui fixe le nombre d'enceintes nécessaires pour couvrir les charges de structure." },
      { field: "productionPlan", direction: "review", hint: "Des plans qui se partagent le même atelier : trop de Go remplit les lignes pour peu de marge. La Studio, elle, ne se produit qu'une fois développée : sa R&D se décide maintenant, et se finance." },
    ],
  },
  {
    code: "novag_t2_trois_marches",
    category: "contexte_marche",
    title: "Trois marchés, trois réactions",
    narrative:
      "Le premier tour a tranché. Sur la Go, SoundBox a baissé son prix de quelques euros, l'a crié partout, et les lycéens ont suivi en masse ; sur la One, les étudiants ont bougé aussi, moins vite. Chez les passionnés, rien : ils ont acheté au prix fort, chez celui qui parlait de qualité et avait la meilleure réputation.",
    problem:
      "Pourquoi les références ne réagissent-elles pas de la même façon au prix, comment fixer chacun des prix, et sur quel axe communiquer pour le prochain tour ?",
    diagnosticOptions: [
      { id: "novag_elasticites", label: "Chaque référence a ses clients, donc sa sensibilité au prix : forte sur la Go, faible sur la Studio", correct: true },
      { id: "novag_seuils_psy", label: "Sur la Go et la One, des niveaux de prix agissent comme des seuils psychologiques", correct: true },
      { id: "novag_axe_coherent", label: "Le même budget rend plus quand l'axe de communication dit ce que la clientèle regarde : le prix aux lycéens, la qualité aux passionnés", correct: true },
      { id: "novag_qualite_effondree", label: "Notre qualité s'est effondrée d'un tour à l'autre", correct: false },
      { id: "novag_un_seul_prix", label: "Il faut réagir sur toute la gamme avec la même baisse en pourcentage", correct: false },
    ],
    quiz: [
      {
        id: "novag_elasticite_calc",
        prompt: "Sur la Go, l'élasticité-prix est proche de −2,4. Une baisse de prix de 5 % fait varier sa demande d'environ…",
        options: [
          { id: "a", label: "+12 %" },
          { id: "b", label: "+5 %" },
          { id: "c", label: "+2,4 %" },
          { id: "d", label: "−12 %" },
        ],
        correctOptionId: "a",
        explain:
          "e = %ΔQ ÷ %ΔP : la variation de demande vaut l'élasticité × la variation de prix, soit −2,4 × (−5 %) = +12 %. Sur la Studio, avec une élasticité proche de −0,7, la même baisse ne rapporterait que 3,5 % de volume pour 5 % de marge perdue.",
      },
      {
        id: "novag_baisse_qui_paie",
        prompt: "Une baisse de prix augmente le chiffre d'affaires d'une référence seulement si…",
        options: [
          { id: "a", label: "Sa demande est élastique : le volume gagné en pourcentage dépasse le prix perdu" },
          { id: "b", label: "Elle est la référence la plus chère de la gamme" },
          { id: "c", label: "Les concurrents baissent aussi leur prix" },
          { id: "d", label: "Le stock est vide" },
        ],
        correctOptionId: "a",
        explain:
          "Élasticité au-delà de 1 en valeur absolue : le volume compense la baisse, le chiffre d'affaires monte. En deçà, la baisse ne fait que réduire la marge. La Go et la Studio ne sont pas du même côté de cette ligne.",
      },
    ],
    modelRelevance: {
      elasticity_analysis: "optimal",
      psych_pricing: "acceptable",
      breakeven_analysis: "acceptable",
      cash_budget: "irrelevant",
      capacity_analysis: "misleading",
    },
    conceptCodes: ["price_elasticity", "psych_price", "segmentation", "demand_market_share"],
    hints: hints([
      "Comparez, référence par référence, la baisse de prix du concurrent et le mouvement de vos ventes.",
      "Quels clients achètent une Go ? Une Studio ? Ont-ils le même rapport au prix ?",
      "La sensibilité au prix se mesure : c'est l'élasticité, et elle est propre à chaque marché de la gamme.",
      "Une analyse de l'élasticité, référence par référence, dirait où une baisse rapporte et où elle ne fait que coûter.",
      "Baissez là où l'élasticité dépasse 1 en valeur absolue (la Go, la One sous ses seuils) ; tenez le prix de la Studio, et soignez plutôt sa qualité. Puis donnez au budget l'axe qui parle à la clientèle visée : le prix n'est crédible que si vous êtes vraiment moins cher, et changer d'axe chaque tour use la notoriété.",
    ]),
    trigger: { round: 2 },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "review", hint: "Trois marchés, trois élasticités : une baisse qui paie sur la Go coûte de la marge sur la Studio sans rien rapporter en volume." },
      { field: "marketingBudget", direction: "review", hint: "Le budget se partage entre la marque, qui bâtit une notoriété lente pour toute la gamme, et chaque référence, à effet immédiat ; l'axe choisi décide de ce qu'il rend auprès de chaque clientèle." },
      { field: "qualityBudget", direction: "review", hint: "Les clients de la Studio arbitrent sur la qualité perçue bien plus que sur le prix : c'est là que le budget qualité rend le plus." },
    ],
  },
  {
    code: "novag_t3_facteur_rare",
    category: "decision_strategique",
    title: "Quoi produire, quand tout se vend",
    narrative:
      "La demande décolle, la Studio est sur le marché chez ceux qui l'ont développée, et CampusTech vous ouvre ses rayons pour la One. Mais l'atelier a plafonné : les plans additionnés dépassaient ce que les lignes peuvent sortir, la coupe a été proportionnelle, et des clients sont repartis les mains vides… sur la Studio comme sur la Go.",
    problem:
      "Votre marché demande plus que votre atelier ne produit. Quelle référence produire en priorité, et que préparer avant le pic de fin d'année ?",
    diagnosticOptions: [
      { id: "novag_marge_par_capacite", label: "Quand la capacité manque, on classe les références par marge rapportée à l'unité de capacité qu'elles consomment", correct: true },
      { id: "novag_stock_avant_pic", label: "Il faut produire AVANT le pic pour constituer du stock, sur les références qui se vendront à Noël", correct: true },
      { id: "novag_prix_go", label: "Il suffit d'augmenter fortement le prix de la Go pour retrouver de la place", correct: false },
      { id: "novag_coupe_egale", label: "La coupe proportionnelle de l'atelier est la bonne règle : elle est équitable entre les références", correct: false },
    ],
    quiz: [
      {
        id: "novag_facteur_rare",
        prompt: "Quand un facteur de production est rare, la référence à produire en priorité est celle qui a…",
        options: [
          { id: "a", label: "La plus forte marge sur coût variable par unité du facteur rare" },
          { id: "b", label: "Le prix de vente le plus élevé" },
          { id: "c", label: "Le plus gros volume de demande" },
          { id: "d", label: "Le coût variable le plus bas" },
        ],
        correctOptionId: "a",
        explain:
          "Ce n'est ni le prix ni le volume qui comptent, mais ce que chaque heure ou chaque passage sur les lignes rapporte. Sur un atelier compté en enceintes, la Studio rapporte près de cinq fois plus qu'une Go pour la même place : on la sert d'abord, jusqu'à épuiser sa demande.",
      },
      {
        id: "novag_stock_anticipation",
        prompt: "Un stock d'anticipation sert à…",
        options: [
          { id: "a", label: "Produire avant le pic saisonnier pour servir une demande qui dépassera la capacité d'un tour" },
          { id: "b", label: "Faire baisser le besoin en fonds de roulement" },
          { id: "c", label: "Réduire le coût variable unitaire" },
          { id: "d", label: "Se protéger d'une hausse des taux d'intérêt" },
        ],
        correctOptionId: "a",
        explain:
          "Quand le pic dépasse la capacité d'un tour, la seule issue est de produire à l'avance. Le stock immobilise du cash, mais il sauve les ventes : et sur une gamme, on stocke ce qui se vendra à Noël, la Go des cadeaux avant tout.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      marginal_analysis: "acceptable",
      relevant_costs: "acceptable",
      breakeven_analysis: "irrelevant",
      elasticity_analysis: "misleading",
    },
    conceptCodes: ["capacity", "stock", "seasonality", "contribution_margin"],
    hints: hints([
      "Regardez la colonne « Manqué » de chacun de vos marchés : ces clients voulaient acheter, et pas tous la même enceinte.",
      "Vos trois plans additionnés ont-ils atteint votre plafond ? Qui a été coupé, et de combien ?",
      "Quand l'atelier est le goulot, chaque enceinte produite en prend la place d'une autre : que rapporte cette place selon la référence ?",
      "Une analyse de capacité, croisée avec la marge de chaque référence et la saisonnalité, dirait quoi produire dès maintenant.",
      "Classez les références par marge par enceinte (59 € la Studio, 21 € la One, 15 € la Go), servez la demande dans cet ordre, et produisez au plafond dès ce tour pour stocker la Go et la One avant Noël.",
    ]),
    trigger: { round: 3 },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "up", hint: "Produire au plafond AVANT le pic constitue le stock qui servira la demande quand la capacité d'un tour ne suffira plus — en commençant par la référence qui rapporte le plus par enceinte." },
      { field: "maintenanceBudget", direction: "review", hint: "La disponibilité des lignes dépend de la maintenance : négliger l'entretien réduit la capacité réelle, pour toute la gamme à la fois." },
    ],
  },
  {
    code: "novag_t4_paradoxe",
    category: "contexte_marche",
    title: "Le paradoxe du succès",
    narrative:
      "Trimestre record : Noël a doublé les Go, CampusTech a passé sa grosse commande de One, les studios ont pris leurs Studio. Le résultat est positif… et pourtant votre banquier appelle : le compte vire au rouge. La grande distribution règle à soixante jours, CampusTech à quatre-vingts, et les composants, eux, ont été payés.",
    problem:
      "Votre entreprise gagne de l'argent mais n'en a plus en caisse. Identifiez les causes de ce paradoxe, référence par référence.",
    diagnosticOptions: [
      { id: "novag_creances", label: "Le chiffre d'affaires du pic est devenu des créances, pas du cash : chaque circuit paie à son délai", correct: true },
      { id: "novag_bfr_croissance", label: "La croissance gonfle le besoin en fonds de roulement plus vite que les ressources", correct: true },
      { id: "novag_resultat_faux", label: "Le résultat comptable est faux, il faut le recalculer", correct: false },
      { id: "novag_go_coupable", label: "La Go est déficitaire, c'est elle qui a vidé la caisse", correct: false },
    ],
    quiz: [
      {
        id: "novag_tn_formule",
        prompt: "La trésorerie nette est égale à…",
        options: [
          { id: "a", label: "FRNG − BFR" },
          { id: "b", label: "FRNG + BFR" },
          { id: "c", label: "Chiffre d'affaires − charges décaissées" },
          { id: "d", label: "Résultat net + amortissements" },
        ],
        correctOptionId: "a",
        explain:
          "TN = FRNG − BFR : quand la croissance gonfle le BFR plus vite que le FRNG, la caisse se vide, même en gagnant de l'argent. Et une gamme creuse le BFR à plusieurs vitesses : la vente aux lycéens est encaissée le jour même, celle de la grande distribution deux mois plus tard.",
      },
      {
        id: "novag_creances_par_circuit",
        prompt: "À chiffre d'affaires égal, quelle référence pèse le plus sur le besoin en fonds de roulement ?",
        options: [
          { id: "a", label: "Celle dont les clients règlent le plus tard" },
          { id: "b", label: "Celle qui a la plus forte marge" },
          { id: "c", label: "Celle qui se vend le plus en volume" },
          { id: "d", label: "Celle dont les composants coûtent le moins cher" },
        ],
        correctOptionId: "a",
        explain:
          "Le BFR, c'est de l'argent avancé en attendant d'être payé. Une One vendue à CampusTech attend quatre-vingts jours, une Go vendue à un lycéen est encaissée aussitôt : à chiffre d'affaires égal, ce n'est pas la même avance.",
      },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      cash_budget: "optimal",
      breakeven_analysis: "misleading",
      return_analysis: "irrelevant",
      npv: "irrelevant",
    },
    conceptCodes: ["frng", "bfr", "net_treasury", "receivables_financing", "loan_schedule"],
    hints: hints([
      "Examinez ce qui a le plus évolué à votre bilan depuis le tour dernier.",
      "Quel élément du cycle d'exploitation (stocks, créances clients, dettes fournisseurs) a explosé ? Et qui, parmi vos clients, ne vous a pas encore payé ?",
      "Chaque circuit a son délai : lycéens et étudiants au comptant, studios à trente jours, grande distribution à soixante, CampusTech à quatre-vingts.",
      "Une analyse FRNG / BFR décomposerait votre trésorerie et montrerait où elle est partie, référence par référence.",
      "Calculez le FRNG (ressources stables − immobilisations), puis le BFR (stocks + créances − fournisseurs) : TN = FRNG − BFR. Leviers : mobiliser les créances, emprunter, ou vendre plus au comptant.",
    ]),
    trigger: { round: 4 },
    weight: 1.5,
    decisionLevers: [
      { field: "price", direction: "review", hint: "Le prix détermine le volume vendu, et le volume vendu à crédit devient des créances : plus de ventes à CampusTech, plus d'argent qui attend." },
      { field: "productionPlan", direction: "review", hint: "Chaque enceinte produite mobilise du cash (composants, main-d'œuvre) bien avant l'encaissement, et la Studio en mobilise le plus." },
    ],
  },
  {
    code: "novag_t5_matieres",
    category: "decision_strategique",
    title: "La hausse ne frappe pas toute la gamme pareil",
    narrative:
      "Le contrecoup saisonnier tasse les ventes, et les composants ont renchéri de 20 %. Sur la Go, la hausse pèse quelques euros ; sur la Studio, bien davantage. En comité, on compare aussi : Auris affiche un résultat plus faible que d'autres, mais avec deux fois moins de capitaux engagés.",
    problem:
      "La hausse des matières déplace les marges de vos trois références. Laquelle en souffre le plus, faut-il répercuter, et comment jugez-vous vraiment une performance ?",
    diagnosticOptions: [
      { id: "novag_hausse_inegale", label: "La hausse frappe chaque référence au prorata de ses composants : la Studio perd le plus en euros, la Go le plus en proportion", correct: true },
      { id: "novag_relatif_capitaux", label: "Un résultat se juge par rapport aux capitaux engagés pour l'obtenir", correct: true },
      { id: "novag_hausse_uniforme", label: "Il faut augmenter les trois prix du même pourcentage", correct: false },
      { id: "novag_couper_tout", label: "Il faut couper tous les budgets pour restaurer le résultat", correct: false },
    ],
    quiz: [
      {
        id: "novag_sensibilite",
        prompt: "Une analyse de sensibilité sert à…",
        options: [
          { id: "a", label: "Mesurer combien le résultat bouge quand une hypothèse (coût des composants, prix, volume) varie" },
          { id: "b", label: "Calculer le prix psychologique de chaque référence" },
          { id: "c", label: "Répartir les charges de structure entre les références" },
          { id: "d", label: "Choisir le fournisseur le moins cher" },
        ],
        correctOptionId: "a",
        explain:
          "On fait varier une hypothèse à la fois et on lit l'effet sur la marge de chaque référence. Une hausse de 20 % des composants retire environ 2 € à la Go et près de 10 € à la Studio : la même nouvelle n'a pas le même poids sur les trois lignes.",
      },
      {
        id: "novag_rentabilite",
        prompt: "La rentabilité économique rapporte…",
        options: [
          { id: "a", label: "Le résultat d'exploitation net d'impôt aux capitaux engagés (capitaux propres + dettes)" },
          { id: "b", label: "Le résultat net au chiffre d'affaires" },
          { id: "c", label: "Le chiffre d'affaires au total du bilan" },
          { id: "d", label: "La marge unitaire au prix de vente" },
        ],
        correctOptionId: "a",
        explain:
          "La rentabilité juge la performance de l'outil de production, indépendamment de la manière dont il est financé. La profitabilité (résultat ÷ chiffre d'affaires) raconte autre chose : deux entreprises de tailles différentes ne se comparent qu'en rentabilité.",
      },
    ],
    modelRelevance: {
      sensitivity_analysis: "optimal",
      return_analysis: "optimal",
      breakeven_analysis: "acceptable",
      frng_bfr_analysis: "irrelevant",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["profitability_vs_return", "contribution_margin", "margin_rates", "variable_costs"],
    hints: hints([
      "Combien de composants entrent dans une Go ? Dans une Studio ? La hausse est un pourcentage de ce montant-là.",
      "Recalculez la marge de chaque référence avec les nouveaux coûts : laquelle a le plus perdu en euros, laquelle en proportion ?",
      "Répercuter la hausse n'a pas le même effet partout : rappelez-vous l'élasticité de chaque marché.",
      "Une analyse de sensibilité, référence par référence, dirait où la hausse fait mal et où elle se supporte ; une analyse de rentabilité départagerait les performances.",
      "Répercutez surtout sur la Studio, dont les clients tolèrent le prix, tenez la Go, et calculez Re = REX net d'impôt ÷ (capitaux propres + dettes) pour vous comparer.",
    ]),
    trigger: { round: 5 },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "review", hint: "Répercuter la hausse : oui sur la Studio, dont le marché tolère le prix ; avec prudence sur la Go, où quelques euros font fuir les lycéens." },
      { field: "qualityBudget", direction: "review", hint: "Chaque référence a son catalogue de composants : c'est le moment de comparer, ligne par ligne, prix d'achat, bonus de qualité et délai de règlement, avant d'ajuster le budget qualité." },
    ],
  },
  {
    code: "novag_t6_cap",
    category: "decision_strategique",
    title: "Le grand oral",
    narrative:
      "Dernier tour : votre conseil d'administration attend un cap assumé. Garder les trois références ? Abandonner la Go, qui remplit l'atelier pour une marge mince ? Tout miser sur la Studio, dont le marché est petit ? Tout, vous ne pourrez pas.",
    problem:
      "Quel mix final choisissez-vous, et surtout : sur quels critères le défendez-vous ?",
    diagnosticOptions: [
      { id: "novag_criteres", label: "Un bon arbitrage explicite ses critères et leurs pondérations", correct: true },
      { id: "novag_coherence", label: "Le mix retenu doit être cohérent avec le positionnement tenu depuis le début", correct: true },
      { id: "novag_copier", label: "Copier le mix du leader du classement suffit", correct: false },
      { id: "novag_abandon_facile", label: "Une référence à faible marge unitaire est toujours à abandonner", correct: false },
    ],
    quiz: [
      {
        id: "novag_matrice",
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
        id: "novag_abandon_reference",
        prompt: "Abandonner une référence améliore le résultat seulement si…",
        options: [
          { id: "a", label: "La marge sur coût variable qu'elle dégageait est inférieure aux charges de structure qu'on économise, ou si la capacité libérée se vend mieux ailleurs" },
          { id: "b", label: "Son prix de vente est le plus bas de la gamme" },
          { id: "c", label: "Sa marge unitaire est inférieure à celle des autres références" },
          { id: "d", label: "Elle représente moins d'un tiers du chiffre d'affaires" },
        ],
        correctOptionId: "a",
        explain:
          "Les charges de structure restent, que la Go existe ou non. Tant qu'elle dégage une marge positive et que l'atelier a de la place, elle contribue. Elle ne devient un mauvais choix que lorsque sa place sur les lignes vaudrait plus en Studio.",
      },
    ],
    modelRelevance: {
      multicriteria_matrix: "optimal",
      scenarios_method: "acceptable",
      relevant_costs: "acceptable",
      cvp_analysis: "acceptable",
    },
    conceptCodes: ["profitability_vs_return", "safety_margin", "demand_market_share", "contribution_margin"],
    hints: hints([
      "Relisez votre trajectoire : quelle référence vous a fait gagner, laquelle vous a fait souffrir ?",
      "Quels critères comptent pour VOTRE entreprise aujourd'hui : marge, part de marché, trésorerie, image ?",
      "Quand plusieurs critères se disputent une décision, il faut les pondérer explicitement.",
      "Une matrice multicritère structurerait votre arbitrage final, mix par mix.",
      "Listez trois mix (gamme complète, sans la Go, tout Studio), notez-les de 1 à 5 sur marge / part de marché / trésorerie, pondérez selon votre situation, choisissez la meilleure note pondérée.",
    ]),
    trigger: { round: 6 },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "review", hint: "Trois prix, un positionnement : ils traduisent votre cap et engagent le résultat." },
      { field: "productionPlan", direction: "review", hint: "Dernier tour : le stock final est perdu, sur chaque référence. Ajustez chaque plan au plus près de la demande attendue." },
      { field: "marketingBudget", direction: "review", hint: "Investir en marketing au dernier tour ne rapporte que si l'effet est immédiat : arbitrage court terme." },
    ],
  },

  // -------------------------------------------------------------------------
  // Situations DÉTECTÉES : déclenchées par l'état de l'entreprise, à tout tour.
  // -------------------------------------------------------------------------
  {
    code: "novag_detect_profitable_illiquid",
    category: "alerte_comptable",
    title: "Rentable, et pourtant à découvert",
    narrative:
      "Le compte de résultat est bénéficiaire, et la banque signale un compte à découvert. Vos ventes à crédit ont grossi : CampusTech, la grande distribution et les studios paient plus tard que vous ne payez vos composants.",
    problem:
      "Comment une entreprise qui gagne de l'argent peut-elle en manquer, et par quoi commencer ?",
    diagnosticOptions: [
      { id: "novag_di_creances", label: "Les ventes à crédit ont gonflé les créances : le résultat est là, le cash pas encore", correct: true },
      { id: "novag_di_stock", label: "Le stock d'enceintes produites d'avance immobilise de l'argent", correct: true },
      { id: "novag_di_faux", label: "Le résultat est faux, il faut le recalculer", correct: false },
      { id: "novag_di_marketing", label: "C'est le marketing qui a vidé la caisse à lui seul", correct: false },
    ],
    quiz: [
      {
        id: "novag_di_bfr",
        prompt: "Le besoin en fonds de roulement, c'est…",
        options: [
          { id: "a", label: "Stocks + créances clients − dettes fournisseurs" },
          { id: "b", label: "Capitaux propres − immobilisations" },
          { id: "c", label: "Chiffre d'affaires − charges variables" },
          { id: "d", label: "Trésorerie + emprunts" },
        ],
        correctOptionId: "a",
        explain:
          "Le BFR est l'argent avancé par l'entreprise pour faire tourner son cycle : payer les composants et produire avant d'être payée. Il grossit avec les ventes à crédit et avec le stock.",
      },
      {
        id: "novag_di_mobiliser",
        prompt: "L'escompte et l'affacturage permettent de…",
        options: [
          { id: "a", label: "Transformer des créances clients en cash immédiat, contre un coût financier" },
          { id: "b", label: "Réduire les charges de structure" },
          { id: "c", label: "Augmenter le résultat net" },
          { id: "d", label: "Reporter le paiement des fournisseurs" },
        ],
        correctOptionId: "a",
        explain:
          "Mobiliser le poste clients avance l'encaissement : la créance devient du cash aujourd'hui, moyennant agios ou commission.",
      },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      cash_budget: "acceptable",
      breakeven_analysis: "misleading",
      npv: "irrelevant",
    },
    conceptCodes: ["frng", "bfr", "net_treasury", "receivables_financing"],
    hints: hints([
      "Le résultat et la trésorerie ne mesurent pas la même chose.",
      "Regardez vos créances clients et votre stock : combien d'argent y dort ?",
      "Qui, parmi vos clients, vous paie à soixante ou quatre-vingts jours ? Combien leur avez-vous vendu ce tour ?",
      "Une analyse FRNG / BFR décomposerait votre trésorerie et dirait lequel des deux termes a bougé.",
      "Calculez TN = FRNG − BFR, puis agissez sur le BFR : mobilisez les créances, réduisez le stock, ou financez la croissance par un emprunt.",
    ]),
    trigger: { detect: "profitable_illiquid" },
    weight: 1.2,
    decisionLevers: [
      { field: "productionPlan", direction: "down", hint: "Chaque enceinte stockée immobilise son coût variable : ajustez chaque plan à la demande attendue pour alléger le BFR." },
    ],
  },
  {
    code: "novag_detect_stockout",
    category: "alerte_comptable",
    title: "Une référence manque, une autre dort",
    narrative:
      "Des clients sont repartis sans l'enceinte qu'ils voulaient : votre stock de cette référence était vide. Pendant ce temps, une autre référence dort en réserve. L'atelier n'a pas manqué de capacité, il a produit le mauvais mix.",
    problem:
      "Pourquoi manque-t-on d'une référence alors qu'on en stocke une autre, et comment répartir la production au prochain tour ?",
    diagnosticOptions: [
      { id: "novag_so_mix", label: "Les plans par référence ne suivaient pas les demandes par référence", correct: true },
      { id: "novag_so_saison", label: "La saisonnalité n'est pas la même sur chaque référence : la Go double à Noël, pas la Studio", correct: true },
      { id: "novag_so_capacite", label: "L'atelier manque de capacité, il faut investir", correct: false },
      { id: "novag_so_prix", label: "Il faut baisser le prix de la référence stockée pour l'écouler à tout prix", correct: false },
    ],
    quiz: [
      {
        id: "novag_so_rupture",
        prompt: "Une rupture sur une référence coûte…",
        options: [
          { id: "a", label: "La marge des ventes perdues, et parfois le client, parti chez un concurrent" },
          { id: "b", label: "Rien : les clients reviendront au tour suivant" },
          { id: "c", label: "Le coût variable des enceintes non produites" },
          { id: "d", label: "Une pénalité versée à la banque" },
        ],
        correctOptionId: "a",
        explain:
          "Une vente manquée, c'est une marge qui n'existera jamais, et un client qui a trouvé ailleurs revient rarement, surtout sur les marchés peu fidèles de la Go.",
      },
      {
        id: "novag_so_plan",
        prompt: "Le plan de production d'une référence se dimensionne à partir de…",
        options: [
          { id: "a", label: "Sa demande attendue, sa saisonnalité et son stock restant" },
          { id: "b", label: "La demande totale de la gamme divisée par le nombre de références" },
          { id: "c", label: "La capacité de l'atelier divisée par trois" },
          { id: "d", label: "Ses ventes du tour précédent, sans autre correction" },
        ],
        correctOptionId: "a",
        explain:
          "Chaque référence a son marché et sa saison : le plan se prévoit référence par référence, puis la somme se ramène à ce que l'atelier peut sortir.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      scenarios_method: "acceptable",
      elasticity_analysis: "irrelevant",
      npv: "misleading",
    },
    conceptCodes: ["stock", "seasonality", "capacity", "demand_market_share"],
    hints: hints([
      "Regardez la colonne « Manqué » de chaque marché, et le stock de chaque référence.",
      "Les trois plans étaient-ils proportionnels aux trois demandes ?",
      "Chaque référence a sa saison : laquelle monte au prochain tour, laquelle redescend ?",
      "Une analyse de capacité, référence par référence et croisée avec la saisonnalité, dimensionnerait vos trois plans.",
      "Prévoyez la demande de chaque référence pour le prochain tour, retirez son stock, et répartissez l'atelier dans cet ordre : d'abord ce qui manque, pas ce qui dort.",
    ]),
    trigger: { detect: "stockout" },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "review", hint: "Le plan se prévoit par référence : demande attendue, saison, stock restant. La somme se ramène ensuite à l'atelier." },
    ],
  },
  {
    code: "novag_detect_below_breakeven",
    category: "alerte_comptable",
    title: "Le trimestre s'est terminé dans le rouge",
    narrative:
      "Le résultat du tour est négatif : la marge dégagée par les trois références n'a pas couvert les charges de structure. Ce n'est pas forcément une question de volume : un atelier plein de Go peut perdre de l'argent là où un atelier moins rempli de Studio en gagne.",
    problem:
      "Pourquoi la marge n'a-t-elle pas couvert les charges, et quel levier est le plus efficace : le prix, le volume, ou le mix ?",
    diagnosticOptions: [
      { id: "novag_bb_mix", label: "Le mix vendu a fait baisser la marge moyenne par enceinte, et donc relevé le seuil", correct: true },
      { id: "novag_bb_volume", label: "Le volume vendu est resté sous le seuil de rentabilité", correct: true },
      { id: "novag_bb_fixes", label: "Il faut couper les charges de structure, quoi qu'il en coûte à la capacité", correct: false },
      { id: "novag_bb_tout_go", label: "Il faut produire plus de Go, l'enceinte la plus demandée", correct: false },
    ],
    quiz: [
      {
        id: "novag_bb_levier",
        prompt: "Pour repasser au-dessus du seuil de rentabilité avec plusieurs références, le levier le plus direct est…",
        options: [
          { id: "a", label: "Déplacer le mix vers les références à plus forte marge, tant que leur marché suit" },
          { id: "b", label: "Baisser tous les prix pour vendre plus" },
          { id: "c", label: "Produire au maximum de la capacité sur chaque référence" },
          { id: "d", label: "Supprimer le budget de maintenance" },
        ],
        correctOptionId: "a",
        explain:
          "Le seuil dépend de la marge moyenne par enceinte : vendre une Studio à la place de quatre Go rapporte plus pour moins de capacité. Le volume compte aussi, mais le mix agit sans un euro de plus.",
      },
      {
        id: "novag_bb_marge_moyenne",
        prompt: "La marge sur coût variable moyenne d'une gamme se calcule…",
        options: [
          { id: "a", label: "En pondérant la marge de chaque référence par sa part dans les ventes" },
          { id: "b", label: "En faisant la moyenne simple des trois marges unitaires" },
          { id: "c", label: "En retenant la marge de la référence la plus vendue" },
          { id: "d", label: "En divisant les charges de structure par le nombre de références" },
        ],
        correctOptionId: "a",
        explain:
          "Une moyenne simple ignore que la Go se vend deux fois plus que la Studio. La marge moyenne, et donc le seuil, se pondère par le mix réel.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cvp_analysis: "acceptable",
      marginal_analysis: "acceptable",
      frng_bfr_analysis: "irrelevant",
    },
    conceptCodes: ["breakeven", "contribution_margin", "fixed_costs", "safety_margin"],
    hints: hints([
      "Le résultat est négatif : la marge n'a pas couvert les charges de structure. De combien ?",
      "Quelle marge chaque enceinte vendue a-t-elle laissée, en moyenne, sur ce tour ?",
      "Le mix a-t-il glissé vers la Go ? Une enceinte à faible marge remplit l'atelier sans remplir la caisse.",
      "Une analyse du seuil de rentabilité, recalculée au mix réel, dirait combien il manque, et quel levier y répond le mieux.",
      "Recalculez la marge moyenne au mix vendu, divisez les charges de structure par elle, et comparez au volume : déplacez le mix vers la Studio et la One avant de toucher aux prix.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "review", hint: "Le mix se décide au plan : donnez la place de l'atelier aux références qui rapportent le plus par enceinte, tant que leur marché suit." },
      { field: "price", direction: "review", hint: "Une hausse de prix relève la marge unitaire, mais chaque marché la tolère différemment : la Studio bien, la Go mal." },
    ],
  },
  {
    code: "novag_detect_capacity_saturated",
    category: "alerte_comptable",
    title: "L'atelier est plein, sur toute la gamme",
    narrative:
      "Vos lignes tournent à plein et la demande dépasse encore : des clients sont repartis sur les trois références. Deux issues : agrandir l'atelier, ce qui coûte aujourd'hui et rapporte demain, ou réserver la capacité existante aux références qui rapportent le plus.",
    problem:
      "Faut-il investir dans des lignes supplémentaires, ou mieux employer celles que vous avez ?",
    diagnosticOptions: [
      { id: "novag_cs_flux", label: "Un investissement se juge en comparant son coût d'aujourd'hui aux flux qu'il rapportera, actualisés", correct: true },
      { id: "novag_cs_remix", label: "Avant d'investir, réallouer la capacité aux références à plus forte marge par enceinte libère du résultat sans un euro", correct: true },
      { id: "novag_cs_toujours", label: "Quand la demande dépasse, il faut toujours investir, le plus tôt possible", correct: false },
      { id: "novag_cs_jamais", label: "Il ne faut jamais investir en fin de partie", correct: false },
    ],
    quiz: [
      {
        id: "novag_cs_van",
        prompt: "La valeur actuelle nette d'un investissement, c'est…",
        options: [
          { id: "a", label: "La somme des flux futurs actualisés, moins le coût initial" },
          { id: "b", label: "Le coût initial divisé par la durée d'amortissement" },
          { id: "c", label: "Le chiffre d'affaires supplémentaire de la première année" },
          { id: "d", label: "La valeur de revente des lignes" },
        ],
        correctOptionId: "a",
        explain:
          "Un euro dans deux ans vaut moins qu'un euro aujourd'hui : on actualise les marges futures avant de les comparer au coût. Et ces marges futures dépendent du mix qu'on produira sur les nouvelles lignes.",
      },
      {
        id: "novag_cs_capacite_libre",
        prompt: "Réserver l'atelier à la Studio plutôt qu'à la Go est pertinent tant que…",
        options: [
          { id: "a", label: "La demande de Studio n'est pas épuisée : au-delà, une Go vendue vaut mieux qu'une Studio invendue" },
          { id: "b", label: "Le prix de la Studio reste le plus élevé de la gamme" },
          { id: "c", label: "Le stock de Go n'est pas nul" },
          { id: "d", label: "Les concurrents ne vendent pas de Studio" },
        ],
        correctOptionId: "a",
        explain:
          "Le facteur rare se sert dans l'ordre des marges par enceinte, mais chaque référence a un marché fini : on remplit la Studio jusqu'à sa demande, puis la One, puis la Go.",
      },
    ],
    modelRelevance: {
      npv: "optimal",
      capacity_analysis: "acceptable",
      irr: "acceptable",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["capacity", "discounting", "irr_payback", "contribution_margin"],
    hints: hints([
      "Vos lignes ont-elles produit tout ce que les trois marchés demandaient ? Combien de ventes manquées, et sur quelle référence ?",
      "Investir aujourd'hui, c'est décaisser maintenant pour vendre plus tard : combien de trimestres reste-t-il pour rentabiliser ?",
      "Avant d'agrandir, demandez-vous si l'atelier actuel produit le bon mix : une place donnée à la Go rapporte cinq fois moins qu'une place donnée à la Studio.",
      "Une VAN comparerait le coût des lignes aux marges futures actualisées du mix qu'elles produiront.",
      "Calculez d'abord ce que rapporte un remix à capacité constante ; puis la VAN des lignes supplémentaires sur les tours restants, au mix le plus rentable que leur demande permet.",
    ]),
    trigger: { detect: "capacity_saturated" },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "review", hint: "À capacité constante, le plan est le levier : servez d'abord la référence qui rapporte le plus par enceinte. Et si vous investissez, les lignes n'arrivent qu'au tour suivant : la VAN se calcule sur les tours qui restent." },
      { field: "maintenanceBudget", direction: "review", hint: "Avant d'acheter des lignes, vérifiez la disponibilité de celles que vous avez : un atelier mal entretenu perd de la capacité pour toute la gamme." },
    ],
  },
  {
    code: "novag_detect_idle_cash",
    category: "tresorerie_dormante",
    title: "La caisse pleine d'après-Noël",
    narrative:
      "Les ventes du pic ont été encaissées, CampusTech et la grande distribution ont fini par payer, et le compte affiche plus d'un trimestre de charges de structure d'avance, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an. Il facture par ailleurs votre découvert 9 %. Les composants des trois références, eux, se paient avant que la première enceinte ne soit vendue, et la Studio en consomme le plus.",
    problem:
      "Cet argent qui dort, faut-il le placer, et jusqu'à quel montant ?",
    diagnosticOptions: [
      { id: "novag_ic_cout_opportunite", label: "Une trésorerie qui dort ne coûte rien, mais ne rapporte rien non plus : c'est un manque à gagner", correct: true },
      { id: "novag_ic_garder", label: "Le montant bloqué ne pourra régler aucune facture du trimestre : il faut d'abord chiffrer ce qui va sortir, mix compris", correct: true },
      { id: "novag_ic_tout", label: "Puisque le placement rapporte, autant y mettre la totalité du solde", correct: false },
      { id: "novag_ic_exploitation", label: "Placer améliore le résultat d'exploitation de l'entreprise", correct: false },
    ],
    quiz: [
      {
        id: "novag_ic_exces",
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
        id: "novag_ic_decaissements",
        prompt: "Dans une gamme, les décaissements du tour à venir dépendent surtout…",
        options: [
          { id: "a", label: "Du mix produit : une Studio coûte quatre fois plus de composants qu'une Go, payés avant la vente" },
          { id: "b", label: "Du chiffre d'affaires du tour passé" },
          { id: "c", label: "Du nombre de références au catalogue" },
          { id: "d", label: "Du résultat net attendu" },
        ],
        correctOptionId: "a",
        explain:
          "Le budget de trésorerie projette ce qui sortira : composants et main-d'œuvre de chaque référence au plan prévu, charges de structure, échéance d'emprunt. Plus le mix penche vers la Studio, plus l'avance est lourde.",
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
      "Comparez votre solde aux charges de structure d'un seul trimestre : de combien de tours d'avance disposez-vous ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro.",
      "Attention : le placement est bloqué jusqu'au tour suivant. Il ne réglera ni les composants, ni les salaires, ni l'échéance d'emprunt de ce trimestre.",
      "Projetez donc les décaissements du tour à venir, référence par référence, avant de décider du montant : c'est un budget de trésorerie, même sommaire.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte quatre fois ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ]),
    trigger: { detect: "idle_cash" },
    weight: 0.8,
    decisionLevers: [
      { field: "productionPlan", direction: "review", hint: "Les trois plans déterminent les décaissements du tour : chiffrez-les, référence par référence, avant de décider combien placer." },
    ],
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  novag_t1_reprise:
    "Le seuil de rentabilité, calculé à mix constant, donne un objectif chiffré au premier trimestre : le volume d'enceintes, toutes références confondues, qui couvre exactement les charges de structure. La recherche sur la Studio s'y ajoute en charge, et se juge sur les marges qu'elle apportera.",
  novag_t2_trois_marches:
    "L'analyse de l'élasticité mesure la sensibilité au prix de CHAQUE marché de la gamme : c'est elle qui dit où une baisse rapporte du volume et où elle ne fait que coûter de la marge.",
  novag_t3_facteur_rare:
    "L'analyse de capacité identifie la contrainte qui plafonne l'atelier et, croisée avec la marge de chaque référence, dit quoi produire en priorité, et quoi stocker avant le pic.",
  novag_t4_paradoxe:
    "L'analyse FRNG / BFR (ou le budget de trésorerie) décompose la trésorerie et montre où l'argent est parti : dans les créances des circuits qui paient tard.",
  novag_t5_matieres:
    "L'analyse de sensibilité mesure ce qu'une hausse des composants retire à chaque référence ; l'analyse de rentabilité rapporte le résultat aux capitaux engagés pour départager des entreprises de tailles différentes.",
  novag_t6_cap:
    "La matrice multicritère structure l'arbitrage du mix final : critères explicites, pondérations assumées, options comparées sur la même grille.",
  novag_detect_profitable_illiquid:
    "L'analyse FRNG / BFR est l'outil de ce diagnostic : TN = FRNG − BFR, et l'un des deux termes a bougé.",
  novag_detect_stockout:
    "L'analyse de capacité, référence par référence et croisée avec la saisonnalité de chacune, dimensionne des plans qui anticipent la demande au lieu de la subir.",
  novag_detect_below_breakeven:
    "Le seuil de rentabilité, recalculé au mix réellement vendu, dit combien il manque et quel levier (mix, prix, volume) est le plus efficace.",
  novag_detect_capacity_saturated:
    "La VAN compare le coût des lignes d'aujourd'hui aux marges futures actualisées du mix qu'elles produiront ; le seuil de rentabilité, trompeur ici, ignore le temps.",
  novag_detect_idle_cash:
    "Le budget de trésorerie projette les décaissements du tour à venir, composants de chaque référence compris : il est le seul à dire quelle part du solde peut être bloquée sans risquer le découvert.",
};

attachModelQuestions(NOVA_GAMME_SITUATIONS, MODEL_EXPLAIN);
