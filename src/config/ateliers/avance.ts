import type { AtelierDefinition } from "./types";

/**
 * ATELIER D'APPROFONDISSEMENT · NIVEAU AVANCÉ.
 *
 * Six séances de trois heures sur le transport, choisi pour la richesse de ses
 * arbitrages : deux clientèles qui s'opposent, des contrats industriels
 * réguliers mais exigeants et une bourse de fret qui remplit les retours, des
 * délais de règlement qui creusent le besoin en fonds de roulement, une flotte
 * que l'on agrandit véhicule par véhicule, et un pic de demande qui met la
 * capacité sous tension. Le niveau ouvre tous les leviers de gestion, et le
 * monde variable est activé : ici une bonne décision peut mal finir, ce qui est
 * le vrai métier.
 *
 * Cinq trimestres joués, un pic au quatrième, puis une sixième séance qui bâtit
 * le diagnostic stratégique et le défend. Cet atelier suppose des équipes déjà
 * rodées à la gestion : il revient sur les notions en les tenant ensemble sous
 * incertitude, plutôt que de les apprendre une à une.
 */
export const ATELIER_AVANCE: AtelierDefinition = {
  code: "avance",
  titre: "Piloter sous incertitude une entreprise de transport",
  diplome: "Approfondissement, toutes filières",
  annee: "Niveau avancé",
  nature: "Atelier d'approfondissement",
  traceLabel: "dossier de synthèse",
  referentielLabel: "Compétences de gestion",
  referentielAccord: "mobilisées",
  pitch:
    "Six séances de trois heures. Chaque équipe dirige la même entreprise de transport sur cinq trimestres, arbitre entre contrats industriels et bourse de fret, finance un besoin en fonds de roulement qui s'emballe, agrandit ou renouvelle sa flotte, place ses excédents, et affronte un monde variable où l'aléa a le dernier mot. Un diagnostic stratégique clôt le tout.",
  resume:
    "Cinq trimestres à la tête d'un transporteur, du mix de clientèles au diagnostic stratégique, sous un monde variable où l'aléa fait partie du jeu.",
  difficulte: 4,
  difficulteLabel: "Avancé",
  format: "6 séances de 3 h",
  pourquoi:
    "Une équipe qui maîtrise chaque notion séparément échoue encore à les tenir ensemble, parce que la réalité ne pose jamais un problème à la fois. Ici la décision de flotte engage la trésorerie, le choix des contrats fixe le besoin en fonds de roulement, le pic impose un recrutement qu'il faudra financer, et le monde variable défait parfois le raisonnement le plus juste. L'équipe apprend que la bonne stratégie n'est pas celle qui gagne à tous les coups, mais celle qui survit à un mauvais trimestre sans se rompre, et cela ne s'enseigne qu'en le vivant sur plusieurs tours enchaînés.",
  reglages: {
    scenarioCode: "transport",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 5,
    niveauNom: "Stratégie",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: true,
    quizMode: "Questions de connaissances activées",
    tours: 5,
    effectifParEquipe: "quatre élèves",
    notes:
      "Le transport oppose des contrats industriels réguliers et une bourse de fret plus volatile, avec des délais de règlement qui pèsent sur la trésorerie et une flotte lourde à financer. Le niveau retenu ouvre tous les leviers : trésorerie, assurance, recrutement, investissement et placement des excédents. Le monde variable est activé volontairement : à ce niveau, l'aléa fait partie de l'exercice, et l'objet de l'atelier est d'apprendre à décider quand même. Réservez cet atelier à des équipes déjà rodées.",
  },
  seances: [
    {
      numero: 1,
      titre: "Lire la rentabilité à la palette",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: [
        "Volet 1 · Analyser les coûts et la rentabilité",
        "Volet 2 · Construire une stratégie commerciale",
      ],
      objectif:
        "Reconstituer le coût de revient d'une palette transportée et la marge de chaque clientèle, pour décider d'un premier mix entre contrats et fret.",
      competences: [
        "Je calcule un coût de revient à la palette à partir des charges d'un transporteur.",
        "Je compare la marge d'un contrat industriel à celle d'un chargement de la bourse de fret.",
        "Je décide d'un premier équilibre entre une clientèle régulière et une clientèle volatile.",
      ],
      notions: [
        "coût de revient à la palette",
        "taux de remplissage des retours",
        "marge par clientèle",
        "mix de clientèles",
        "charges fixes d'une flotte",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez des équipes de quatre, une par domaine : coûts, commercial, flotte, finance. Imprimez la fiche de coût à la palette vierge. Prévenez que le monde variable est actif : une décision juste pourra mal tourner, et ce ne sera pas une erreur.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre et le contrat",
          detail:
            "Vous annoncez la règle : six séances, cinq trimestres, un seul transporteur, un document rendu à chaque fois, et un monde qui réserve des surprises. Les équipes rejoignent la partie.",
        },
        {
          minutes: 35,
          titre: "Le coût d'une palette",
          detail:
            "Chaque équipe reconstitue ce que coûte une palette transportée, charges de flotte comprises, en tenant compte des retours à vide qui ne rapportent rien.",
        },
        {
          minutes: 35,
          titre: "Deux clientèles qui s'opposent",
          detail:
            "L'équipe compare la marge d'un contrat industriel, régulier mais exigeant, et celle d'un chargement de la bourse de fret, opportuniste et volatile. Le mix n'est pas neutre.",
        },
        {
          minutes: 35,
          titre: "Premier arbitrage et décisions",
          detail:
            "L'arène pose un arbitrage à deux issues. L'équipe tranche son mix de clientèles et son prix, motive son choix, puis saisit ses décisions.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit son compte de résultat, sa marge par clientèle et sa place au classement.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "Deux équipes présentent leur coût à la palette et leur mix, et les confrontent à leur résultat. Vous affichez les deux comptes de résultat côte à côte.",
        },
      ],
      livrable:
        "La fiche de rentabilité, une page : le coût de revient à la palette, la marge de chaque clientèle, le mix retenu entre contrats et fret, et sa justification chiffrée.",
      tracePasseport:
        "J'ai calculé la rentabilité à la palette d'un transporteur et arbitré un mix entre une clientèle régulière et une clientèle volatile.",
      evaluation: [
        "Le coût à la palette intègre les charges de flotte, pas seulement le carburant.",
        "La marge de chaque clientèle est calculée, pas estimée.",
        "Le mix retenu est justifié par les marges, pas par une préférence.",
      ],
    },
    {
      numero: 2,
      titre: "Le camion qui rentre à vide",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: [
        "Volet 1 · Analyser les coûts et la rentabilité",
        "Volet 2 · Construire une stratégie commerciale",
      ],
      objectif:
        "Décider s'il faut charger, sur les retours à vide, des lots de la bourse de fret payés sous le coût de revient complet : distinguer le coût déjà engagé du coût que la décision ajoute, et fixer le prix plancher d'une capacité qui se perd si elle ne roule pas.",
      competences: [
        "Je distingue, dans le coût de revient complet d'une palette, ce qui est engagé de toute façon de ce que la décision ajoute.",
        "Je calcule la marge qu'un lot payé sous le coût complet laisse tout de même, et je la compare à celle d'un retour à vide.",
        "Je fixe un prix plancher qui tient compte du risque commercial d'habituer le marché à un tarif bas.",
      ],
      notions: [
        "coût de revient complet et coût marginal",
        "marge sur coût variable",
        "capacité périssable",
        "prix plancher",
        "coût d'opportunité",
      ],
      preparation:
        "Relisez la situation du deuxième trimestre : les porteurs rentrent à vide trois fois sur quatre, la bourse propose des lots à 52 € la palette quand le prix moyen est de 74 € et le coût complet proche de 54 €. Le coût de route d'une palette, carburant et péages, tourne autour de 25 € : c'est le seul chiffre que la décision ajoute, le reste est payé que le camion roule ou non. Préparez au tableau un compte à deux colonnes, retour à vide et retour chargé à 52 €, que les équipes rempliront. Le monde variable est activé : un aléa peut faire mentir le trimestre, et c'est déjà l'objet de l'exercice.",
      deroule: [
        {
          minutes: 20,
          titre: "Retour sur le premier trimestre",
          detail:
            "Chaque équipe relit son résultat, son taux de remplissage et l'aléa qu'elle a subi ou évité. Vous notez qui a gagné en résultat mais dont les camions rentrent vides.",
        },
        {
          minutes: 40,
          titre: "Ce que coûte un retour à vide",
          detail:
            "Les équipes remplissent le compte à deux colonnes. Le chauffeur est payé et le camion s'amortit dans les deux cas : un lot à 52 € laisse 27 € de plus qu'un retour à vide, alors que le coût complet dit qu'on vend à perte. La séance tient dans cette contradiction, et l'équipe doit dire laquelle des deux lectures sert la décision.",
        },
        {
          minutes: 30,
          titre: "Le prix plancher",
          detail:
            "Chaque équipe fixe le tarif au-dessous duquel elle refuse un lot de retour, et écrit pourquoi ce n'est ni le coût complet ni le coût de route : un marché habitué à 52 € finira par le demander sur l'aller. Le prix plancher est une décision commerciale autant qu'un calcul.",
        },
        {
          minutes: 35,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête son mix entre contrats industriels, distribution et bourse, son prix, et le volume qu'elle vise, puis écrit le taux de remplissage qu'elle attend. Cette prévision sera relue au tour suivant.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Le taux de remplissage et le prix moyen à la palette apparaissent côte à côte, et une équipe qui a chargé ses retours lit ce que cela a fait à son prix moyen comme à son résultat.",
        },
        {
          minutes: 35,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a chargé la bourse et une équipe qui a tenu son prix. La question qui reste ouverte : le prix moyen le plus élevé est-il le résultat le plus élevé.",
        },
      ],
      livrable:
        "La note de coût marginal : le coût complet d'une palette décomposé entre engagé et ajouté, la marge d'un retour chargé face au retour à vide, le prix plancher retenu avec sa justification commerciale, et l'écart entre le remplissage prévu et le remplissage réalisé.",
      tracePasseport:
        "J'ai fixé le prix plancher d'un lot de retour en séparant le coût que la décision ajoutait du coût déjà engagé.",
      evaluation: [
        "Le coût complet est décomposé entre ce qui est engagé et ce que la décision ajoute.",
        "Le prix plancher est justifié par le risque commercial, pas seulement par un calcul de marge.",
        "La capacité perdue d'un retour à vide est chiffrée comme un coût d'opportunité.",
      ],
    },
    {
      numero: 3,
      titre: "Le gazole prend dix-huit pour cent",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: [
        "Volet 1 · Analyser les coûts et la rentabilité",
        "Volet 4 · Décider en avenir incertain",
      ],
      objectif:
        "Répercuter une hausse du gazole clientèle par clientèle selon sa sensibilité au prix, et préparer le pic du trimestre suivant : un véhicule acheté et un conducteur embauché ce trimestre ne servent qu'au suivant.",
      competences: [
        "Je mesure ce qu'une hausse du carburant fait à la marge d'une palette et au poids du carburant dans le prix.",
        "Je répercute une hausse de coût différemment selon la sensibilité au prix de chaque clientèle.",
        "Je dimensionne un véhicule et un recrutement pour un pic que je ne verrai qu'au trimestre suivant.",
      ],
      notions: [
        "sensibilité au prix des clientèles",
        "répercussion d'une hausse de coût",
        "investissement et amortissement",
        "capacité et flexibilité",
        "délai de mise en service",
      ],
      preparation:
        "Le scénario fait bondir le gazole de 18 % ce trimestre : annoncez-le en ouverture, il pèse sur chaque palette roulée. Les industriels sous contrat sont peu sensibles au prix, la grande distribution l'est beaucoup, la bourse de fret l'est plus encore : la hausse ne se répercute pas pareil sur les trois. Relisez la saisonnalité : le quatrième trimestre est le pic de l'année, surtout pour la distribution. Les véhicules s'achètent typés, fourgon à 45 000 € pour 1 000 palettes, porteur à 95 000 € pour 2 000, semi-remorque à 165 000 € pour 3 000, et entrent en service au trimestre suivant. Les conducteurs embauchés, 2 800 € par recrutement, arrivent eux aussi au trimestre suivant, dans la limite de dix-huit salariés. Préparez une grille à trois colonnes, répercuter, absorber, préparer le pic, que les équipes rempliront.",
      deroule: [
        {
          minutes: 20,
          titre: "Relecture des prévisions",
          detail:
            "Chaque équipe confronte le remplissage prévu à celui obtenu, et lit le poids du carburant dans son prix avant la hausse.",
        },
        {
          minutes: 40,
          titre: "Répercuter ou absorber",
          detail:
            "Les équipes chiffrent ce que la hausse retire à la marge d'une palette, puis décident clientèle par clientèle : répercuter aux industriels qui suivront, moins à la distribution qui partirait, presque rien à la bourse qui n'attend que cela. Une hausse uniforme est la réponse facile, et la séance est faite pour la refuser.",
        },
        {
          minutes: 30,
          titre: "Préparer un pic qu'on ne voit pas encore",
          detail:
            "Chaque équipe remplit la troisième colonne : le véhicule qu'elle achète et les conducteurs qu'elle embauche pour un trimestre qui n'est pas celui-ci. Elle écrit à quelle condition son choix reste bon si le pic déçoit, parce que le monde variable peut le faire.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "L'équipe arrête ses prix par clientèle, son mix, son investissement et son recrutement, et inscrit la capacité qu'elle attend au trimestre suivant.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. La répercussion se lit tout de suite dans le prix moyen et les volumes par clientèle. Le véhicule et les conducteurs, eux, ne se lisent encore que dans la trésorerie : la capacité arrive au trimestre suivant.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a répercuté uniformément et une équipe qui a modulé par clientèle, puis celles qui ont préparé le pic et celles qui attendent de le voir. La question qui reste ouverte : peut-on décider d'une capacité pour une demande qu'on ne connaît pas encore.",
        },
      ],
      livrable:
        "La note de répercussion : l'effet de la hausse sur la marge d'une palette, la répercussion retenue par clientèle avec sa justification par la sensibilité au prix, le véhicule et le recrutement décidés pour le pic, et la condition qui les rend bons si la demande déçoit.",
      tracePasseport:
        "J'ai répercuté une hausse de coût clientèle par clientèle selon leur sensibilité au prix, en préparant une capacité pour un trimestre que je ne voyais pas encore.",
      evaluation: [
        "La répercussion diffère par clientèle et se justifie par la sensibilité au prix de chacune.",
        "Le véhicule et le recrutement sont décidés pour le trimestre suivant, en le disant.",
        "La décision énonce la condition à laquelle elle reste bonne si le pic déçoit.",
      ],
    },
    {
      numero: 4,
      titre: "Le grand compte qui paie à soixante jours, en plein pic",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: [
        "Volet 3 · Piloter la trésorerie et le financement",
        "Volet 2 · Construire une stratégie commerciale",
      ],
      objectif:
        "Traverser le trimestre de pointe sans que la trésorerie se rompe : un client industriel pèse près du tiers du trafic et règle à soixante jours quand le gazole se paie à quinze jours et les chauffeurs à la fin du mois. Servir plus, c'est avancer plus.",
      competences: [
        "Je relie le besoin en fonds de roulement d'un transporteur aux délais de règlement de ses clientèles et de ses fournisseurs.",
        "Je construis un plan de trésorerie de trimestre de pointe et j'y repère le point de tension.",
        "Je compare l'escompte et l'affacturage sur leur coût, et je mesure le risque d'un chiffre d'affaires concentré sur un client.",
      ],
      notions: [
        "besoin en fonds de roulement",
        "délai de règlement client",
        "escompte et affacturage",
        "concentration du chiffre d'affaires",
        "plan de trésorerie",
      ],
      preparation:
        "C'est la séance qui décide de l'exercice : prévoyez d'y consacrer tout le temps annoncé. La demande culmine ce trimestre, la distribution plus encore que le reste, et les équipes qui ont préparé leur capacité au trimestre précédent la reçoivent maintenant. Relisez la situation du quatrième trimestre : bénéficiaire, et pourtant à découvert, parce que l'entreprise encaisse à soixante jours ce qu'elle décaisse à quinze et trente. Préparez la fiche de plan de pointe, où l'équipe écrira son solde de trésorerie attendu, le financement de ses créances et les contrats qu'elle sert en priorité AVANT de connaître le résultat. Les délais des clientèles sont dans le jeu : industriels à soixante jours, distribution à quarante-cinq, bourse comptant.",
      deroule: [
        {
          minutes: 15,
          titre: "Ce que dit le trimestre",
          detail:
            "Vous rappelez sans chiffre que la demande va culminer. Les équipes retrouvent seules l'ampleur du pic dans les informations du jeu, mesurent l'écart avec la capacité qu'elles ont reçue, et lisent leur délai de règlement client moyen.",
        },
        {
          minutes: 40,
          titre: "Le cycle qui avance de l'argent",
          detail:
            "Chaque équipe reconstitue son cycle du trimestre : le gazole à quinze jours, les chauffeurs à la fin du mois, les industriels à soixante jours. Elle projette son solde de trésorerie et découvre que servir plus de palettes creuse le découvert avant de remplir la caisse.",
        },
        {
          minutes: 30,
          titre: "Financer les créances, choisir les clients",
          detail:
            "L'équipe compare l'escompte et l'affacturage sur leur coût, décide de la part des créances qu'elle mobilise, et choisit les contrats qu'elle honore en priorité si la capacité ne suffit pas : la bourse payée comptant soulage la caisse, l'industriel à soixante jours la creuse mais reste fidèle. Elle chiffre aussi ce que lui coûterait de perdre son grand compte.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie du mix, des prix, de la mobilisation des créances et de la couverture du découvert. La fiche de plan de pointe reste sur la table, visible.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre de pointe. Le solde de trésorerie réalisé apparaît à côté du solde prévu, le coût du financement dans le résultat, et le monde variable a corsé la note pour certaines.",
        },
        {
          minutes: 45,
          titre: "Débriefing",
          detail:
            "Chaque équipe compare son plan et son résultat. Celle qui a le plus roulé a-t-elle le mieux gagné, et celle qui a le mieux gagné a-t-elle encore de la caisse : les deux questions n'ont pas la même réponse, et c'est le cours.",
        },
      ],
      livrable:
        "La fiche de plan de pointe : le besoin en fonds de roulement du trimestre reconstitué à partir des délais, le solde de trésorerie prévu, le financement des créances retenu avec son coût, les contrats servis en priorité, et l'écart au solde réalisé après clôture.",
      tracePasseport:
        "J'ai financé le besoin en fonds de roulement d'un trimestre de pointe en mobilisant des créances à soixante jours, après avoir chiffré ce que servir davantage coûtait en trésorerie.",
      evaluation: [
        "Le besoin en fonds de roulement est reconstitué à partir des délais de règlement, clients et fournisseurs.",
        "L'escompte et l'affacturage sont comparés sur leur coût, et la part mobilisée est justifiée.",
        "La priorité donnée aux contrats tient compte du délai de règlement et pas seulement de la marge.",
      ],
    },
    {
      numero: 5,
      titre: "Renouveler la flotte ou la réparer",
      dureeMinutes: 180,
      tourJoue: 5,
      processus: [
        "Volet 3 · Piloter la trésorerie et le financement",
        "Volet 4 · Décider en avenir incertain",
      ],
      objectif:
        "Décider par la valeur actuelle nette si trois porteurs usés se remplacent ou se réparent, en ne comptant que les flux que la décision change, puis employer les excédents dégagés par le pic sans se priver de la réserve qu'impose un monde variable.",
      competences: [
        "Je retiens, dans un projet de renouvellement, les seuls flux que la décision change : entretien évité, carburant économisé, revente des anciens véhicules.",
        "Je ramène des flux étalés sur plusieurs années à leur valeur d'aujourd'hui, et je décide sur leur somme.",
        "Je décide d'un placement des excédents de trésorerie en gardant une réserve de sécurité chiffrée.",
      ],
      notions: [
        "flux de trésorerie différentiels",
        "valeur actuelle nette et actualisation",
        "valeur de revente",
        "placement et rendement",
        "réserve de sécurité",
      ],
      preparation:
        "Relisez la situation du cinquième trimestre : trois porteurs dont l'entretien coûte 21 000 € par trimestre et grimpe, à remplacer pour 315 000 € financés sur six ans, contre un entretien retombant à 5 500 € et neuf pour cent de gazole en moins. Dans le jeu, la décision se prend en revendant des porteurs et en en achetant, et le placement des excédents rapporte deux pour cent l'an. Préparez au tableau un tableau de flux vierge, année par année, où les équipes n'inscriront que ce que la décision change. Prévoyez que certaines équipes sortent du pic à sec, et adaptez leur travail à la couverture plutôt qu'au placement.",
      deroule: [
        {
          minutes: 20,
          titre: "Après la pointe",
          detail:
            "Chaque équipe fait le point de sa trésorerie après le pic : certaines débordent d'excédents, d'autres pansent un aléa ou un découvert de croissance. Le travail de la séance n'est pas le même pour toutes, et c'est voulu.",
        },
        {
          minutes: 40,
          titre: "Les flux que la décision change",
          detail:
            "Les équipes remplissent le tableau : l'entretien évité, le gazole économisé, la revente des anciens porteurs, et le prix des nouveaux. L'amortissement n'y entre pas, ce n'est pas un flux. Puis elles actualisent et lisent le signe de la somme. Une équipe qui compare le coût d'achat aux économies d'un seul trimestre conclut à l'envers.",
        },
        {
          minutes: 30,
          titre: "Une trésorerie qui dort ne rapporte rien",
          detail:
            "Les équipes en excédent chiffrent ce que leur trésorerie inactive laisse perdre, ce qu'un placement rapporterait, et la réserve qu'un monde variable impose de garder devant un dernier trimestre incertain. Les autres chiffrent le coût de leur couverture.",
        },
        {
          minutes: 30,
          titre: "Décisions du trimestre",
          detail:
            "Saisie de la revente et de l'achat de véhicules, du placement ou de la couverture selon la situation, du mix et du prix. Chaque équipe écrit ce qu'elle attend de son choix.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le dernier trimestre joué. Le rendement d'un placement, ou le coût d'une couverture, apparaît dans le résultat de chaque équipe, et les véhicules revendus ont quitté le bilan.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a renouvelé et une équipe qui a réparé, puis une équipe qui a fait travailler son excédent et une équipe qui l'a laissé dormir, sans oublier celle qu'un aléa a rattrapée. La question qui reste ouverte : jusqu'où engager quand demain est incertain.",
        },
      ],
      livrable:
        "La note de renouvellement : le tableau des flux différentiels année par année, la valeur actuelle nette et la décision qu'elle fonde, le montant d'excédent disponible, la réserve gardée, et le placement ou la couverture retenue avec son effet attendu.",
      tracePasseport:
        "J'ai décidé du renouvellement d'une flotte par la valeur actuelle nette des seuls flux que la décision changeait.",
      evaluation: [
        "Seuls les flux que la décision change entrent dans le tableau, et l'amortissement n'y est pas.",
        "Les flux sont actualisés et la décision se fonde sur leur somme, pas sur un seul trimestre.",
        "Le placement laisse une réserve justifiée par l'incertitude du dernier trimestre.",
      ],
    },
    {
      numero: 6,
      titre: "Bâtir le diagnostic stratégique",
      dureeMinutes: 180,
      tourJoue: null,
      processus: [
        "Volet 2 · Construire une stratégie commerciale",
        "Volet 5 · Rendre compte et convaincre",
      ],
      objectif:
        "Construire le diagnostic stratégique des cinq trimestres, de la rentabilité à la résistance aux aléas, et le défendre oralement comme devant un comité de direction.",
      competences: [
        "Je construis un diagnostic stratégique qui relie la rentabilité, la trésorerie et la résistance au risque.",
        "Je choisis les indicateurs qui expliquent une trajectoire, et j'écarte ceux qui l'habillent.",
        "Je défends oralement une stratégie et ses arbitrages devant un jury qui conteste.",
      ],
      notions: [
        "diagnostic stratégique",
        "trajectoire de performance",
        "résistance aux aléas",
        "arbitrages structurants",
        "compte rendu à une direction",
      ],
      preparation:
        "Annoncez la soutenance à la séance précédente et donnez la grille d'évaluation. Prévoyez un ordre de passage tiré au sort et un temps de parole tenu au chronomètre pour chaque groupe. Préparez, pour le jury, une question qui oblige chaque équipe à assumer un arbitrage risqué.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes et tirage",
          detail:
            "Rappel de la grille, tirage de l'ordre de passage. Chaque équipe disposera d'un temps de présentation court suivi de questions du jury, qui contestera au moins un arbitrage.",
        },
        {
          minutes: 50,
          titre: "Construction du diagnostic",
          detail:
            "Les équipes reprennent les cinq trimestres et bâtissent leur diagnostic. Contrainte forte : une seule page, quatre indicateurs au maximum, chacun justifié, dont un qui mesure la résistance aux aléas subis.",
        },
        {
          minutes: 20,
          titre: "Préparation de l'oral",
          detail:
            "Répartition de la parole, anticipation des objections du jury. Vous passez dans les équipes pour repérer les diagnostics qui masquent un mauvais trimestre plutôt que de l'assumer.",
        },
        {
          minutes: 75,
          titre: "Passage des équipes",
          detail:
            "Huit minutes de présentation et quatre minutes de questions par équipe. Chaque équipe présente son diagnostic puis affronte les questions du jury, formé de vous et de deux élèves d'une autre équipe qui contestent au moins un arbitrage chacun.",
        },
        {
          minutes: 25,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement final, puis vous le mettez de côté : ce qui se note est le diagnostic et sa défense. Chaque élève écrit les trois phrases de son dossier de synthèse.",
        },
      ],
      livrable:
        "Le diagnostic stratégique des cinq trimestres : une page, quatre indicateurs justifiés dont un de résistance au risque, l'aléa qui a le plus pesé et la réponse qui lui a été apportée, et la présentation orale de huit minutes qui le défend.",
      tracePasseport:
        "J'ai bâti le diagnostic stratégique d'une entreprise sur cinq trimestres et je l'ai défendu oralement devant un jury qui contestait mes arbitrages.",
      evaluation: [
        "Le diagnostic relie la rentabilité, la trésorerie et la résistance aux aléas.",
        "Chaque indicateur retenu est justifié par ce qu'il explique de la trajectoire.",
        "L'oral assume un arbitrage risqué et le défend, plutôt que de le masquer.",
      ],
    },
  ],
  formats: [
    {
      nom: "Six séances hebdomadaires",
      quand: "Le format d'origine, sur six semaines consécutives.",
      comment:
        "Une séance par semaine, un trimestre par séance. La semaine entre deux séances laisse le temps de préparer un livrable exigeant, et à vous celui de le lire finement.",
    },
    {
      nom: "Deux semaines intensives",
      quand: "En module d'approfondissement ou de spécialité.",
      comment:
        "Trois séances par semaine sur deux semaines. Le rythme soutenu sert la mémoire des arbitrages, mais réservez ce tempo à des équipes qui tiennent la charge cognitive.",
    },
    {
      nom: "Fil rouge de projet",
      quand:
        "Quand l'atelier porte un projet tutoré ou une étude de cas filée.",
      comment:
        "Une séance toutes les deux semaines, chacune préparée par un travail personnel remis en amont. La partie reste ouverte entre deux séances, et le diagnostic final s'enrichit du temps long.",
    },
  ],
  evaluationFinale: [
    "Les cinq livrables intermédiaires, notés au fil des séances, pour la moitié de la note.",
    "Le diagnostic stratégique de la dernière séance, pour un quart.",
    "La soutenance et la défense des arbitrages devant le jury, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : sous monde variable, une équipe bien pilotée peut finir derrière un aléa, et son diagnostic vaut mieux que sa place.",
  ],
  prolongements: [
    "Rejouer la même partie avec un aléa différent pour montrer qu'une stratégie robuste résiste à plusieurs mondes, quand une stratégie chanceuse n'en tient qu'un.",
    "Basculer sur le secteur du bâtiment pour retrouver, sur un autre métier, la tension entre des marchés qui remplissent le planning et des clients qui règlent vite.",
    "Ouvrir le dernier niveau, où la distribution de dividendes s'ajoute aux arbitrages, pour poser la question de la rémunération de l'actionnaire face au financement de la croissance.",
  ],
  faq: [
    {
      question: "Faut-il avoir fait un atelier de gestion avant celui-ci ?",
      reponse:
        "Oui, franchement. Cet atelier suppose que les notions de marge, de seuil, de besoin en fonds de roulement et d'investissement soient déjà acquises : il ne les enseigne pas une à une, il apprend à les tenir ensemble sous incertitude. Une équipe qui découvre le coût de revient ici serait submergée. Passez d'abord par un atelier de section de technicien ou par l'animation de découverte.",
    },
    {
      question:
        "Pourquoi activer le monde variable, qui introduit de la chance ?",
      reponse:
        "Parce qu'à ce niveau, la chance est précisément l'objet. Une gestion qui ne réussit qu'en univers certain n'a rien appris du métier réel, où un aléa défait la meilleure prévision. Le monde variable oblige à décider en gardant des réserves, à préférer la robustesse à l'optimum, et à assumer qu'un bon choix puisse mal finir. C'est ce que la sixième séance demande de défendre.",
    },
    {
      question:
        "Cinq trimestres et six séances font un atelier long, peut-on le raccourcir ?",
      reponse:
        "Oui, en retirant la cinquième séance et en créant la partie sur quatre tours : le renouvellement de la flotte et le placement des excédents se traitent alors au début de la séance de diagnostic, devenue cinquième, sur l'énoncé plutôt que dans le jeu. Vous perdez la respiration entre engager et employer la trésorerie, mais l'atelier tient alors en cinq séances. Ne descendez pas en dessous : le pic de la quatrième a besoin de trois trimestres joués derrière lui.",
    },
    {
      question:
        "Le niveau ouvre tous les leviers, n'est-ce pas trop de décisions à la fois ?",
      reponse:
        "C'est justement l'exercice. Aux niveaux précédents, chaque atelier isole un levier ; ici l'enjeu est de les tenir ensemble, parce que la réalité ne les sépare jamais. Le déroulé aide en donnant à chaque séance un arbitrage dominant, mais il n'interdit pas aux équipes d'agir sur le reste. Une équipe qui se disperse le paiera, et cette leçon vaut d'être vécue.",
    },
    {
      question:
        "Comment noter une équipe qu'un aléa a punie malgré de bonnes décisions ?",
      reponse:
        "Sur ses décisions et sa lucidité, jamais sur son résultat. Une équipe qui a bien raisonné, gardé ses réserves, et qu'un aléa a tout de même rattrapée doit être mieux notée qu'une équipe qui a gagné par chance sans savoir pourquoi. Le diagnostic final est fait pour ça : il révèle qui a compris sa trajectoire, aléa compris.",
    },
  ],
};
