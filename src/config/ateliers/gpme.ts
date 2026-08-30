import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS GPME.
 *
 * Six séances de trois heures sur ATLAS CONSEIL. Le cabinet a été retenu parce
 * qu'il EST une PME au sens du diplôme : une douzaine de personnes, un dirigeant
 * qui décide de tout, presque aucun actif immobilisé et un poste clients qui
 * pèse plus lourd que tout le reste du bilan.
 *
 * Les quatre activités du référentiel y trouvent chacune leur séance : la
 * relation clients et fournisseurs par les délais de règlement, les risques par
 * la dépendance à un donneur d'ordres, le personnel par le recrutement d'un
 * consultant, le développement par la décision de croître ou non.
 */
export const ATELIER_GPME: AtelierDefinition = {
  code: "gpme",
  titre: "Assister le dirigeant d'une PME pendant cinq trimestres",
  diplome: "BTS Gestion de la PME",
  annee: "Deuxième année",
  nature: "Atelier professionnel",
  traceLabel: "passeport professionnel",
  referentielLabel: "Activités",
  referentielAccord: "mobilisées",
  pitch:
    "Six séances de trois heures. Chaque équipe seconde la direction du même cabinet, relance ses clients, assure ses risques, recrute ou renonce, défend ses prix, et rend à chaque séance un document que le dirigeant pourrait signer.",
  resume:
    "Cinq trimestres dans un cabinet de conseil de douze personnes, du diagnostic d'entrée au rapport d'activité présenté au dirigeant.",
  difficulte: 3,
  difficulteLabel: "Approfondissement",
  format: "6 séances de 3 h",
  pourquoi:
    "Dans une PME, personne n'a de service dédié : la même personne relance un client en retard le matin et prépare un recrutement l'après-midi, et les deux décisions se tiennent par la trésorerie. C'est ce lien-là qu'un dossier découpé par activité ne fait jamais sentir. Ici l'équipe décide de recruter au trimestre trois et se retrouve au trimestre quatre à devoir payer un salaire de plus avec des créances qui ne rentrent pas. Les activités du référentiel cessent d'être des chapitres séparés : ce sont les quatre faces d'une même décision.",
  reglages: {
    scenarioCode: "conseil",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 4,
    niveauNom: "Arbitrage",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 5,
    effectifParEquipe: "trois élèves",
    notes:
      "ATLAS CONSEIL vend du temps, qui ne se stocke pas : une journée non vendue est perdue. Sa capacité ne s'achète pas, elle se recrute, avec le délai et le coût que cela suppose. Son bilan est presque entièrement fait de créances clients, ce qui rend le poste clients concret plutôt que théorique. Le niveau retenu ouvre le personnel, le financement et l'assurance, c'est-à-dire les trois leviers que le référentiel demande de savoir manier. Le monde variable est décoché pour que les écarts entre équipes viennent de leurs décisions.",
  },
  seances: [
    {
      numero: 1,
      titre: "Prendre la mesure du cabinet",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: [
        "A4 · Soutenir le fonctionnement et le développement de la PME",
        "A1 · Gérer la relation avec les clients et les fournisseurs",
      ],
      objectif:
        "Établir le diagnostic d'entrée d'une PME de services : ce qu'elle vend, ce qui la limite, et où dort son argent.",
      competences: [
        "Je lis les documents de synthèse d'une PME et j'en tire ce qu'elle possède et ce qu'on lui doit.",
        "Je repère que la ressource d'un cabinet est le temps de ses équipes, et qu'il ne se stocke pas.",
        "Je rédige une note de diagnostic hiérarchisée, destinée à un dirigeant qui n'a pas le temps de tout lire.",
      ],
      notions: [
        "actif et passif d'une PME de services",
        "créances clients",
        "charges de structure",
        "capacité de production en jours",
        "taux d'occupation",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez les équipes de trois avec des rôles nommés : relation clients, ressources humaines, suivi financier. Imprimez la trame de note de diagnostic, une page maximum, contrainte comprise.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : six séances, cinq trimestres, un seul cabinet, une note rendue à chaque fin de séance et jamais plus d'une page.",
        },
        {
          minutes: 40,
          titre: "Lecture du bilan d'entrée",
          detail:
            "Chaque équipe relève où se trouve l'argent du cabinet. La surprise est toujours la même : il n'est ni en caisse ni en machines, il est chez les clients.",
        },
        {
          minutes: 35,
          titre: "Ce qui limite l'activité",
          detail:
            "L'équipe calcule combien de journées le cabinet peut vendre au maximum dans le trimestre, et ce que coûte une journée non vendue. La notion de taux d'occupation naît de ce calcul plutôt que d'une définition.",
        },
        {
          minutes: 35,
          titre: "Premier arbitrage et décisions",
          detail:
            "L'arène pose un arbitrage à deux issues. L'équipe tranche, motive son choix en trois lignes, puis saisit son tarif journalier et son budget de prospection.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le trimestre. Chaque équipe reçoit son taux d'occupation, son tarif réalisé et son délai de règlement moyen.",
        },
        {
          minutes: 35,
          titre: "Débriefing",
          detail:
            "Deux équipes lisent leur note de diagnostic. Vous ne dites pas laquelle a raison : vous affichez les deux comptes de résultat.",
        },
      ],
      livrable:
        "La note de diagnostic d'entrée, une page pour le dirigeant : ce que vend le cabinet, ce qui le limite, où se trouve son argent, et le choix retenu au premier arbitrage avec sa justification.",
      tracePasseport:
        "J'ai établi le diagnostic d'entrée d'une PME de services à partir de ses documents de synthèse et j'ai justifié une première décision de gestion.",
      evaluation: [
        "La note tient sur une page et hiérarchise, au lieu de tout énumérer.",
        "La ressource limitante est nommée en jours vendables, pas en euros.",
        "Le poids des créances clients dans le bilan est relevé.",
      ],
    },
    {
      numero: 2,
      titre: "Faire rentrer l'argent",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: [
        "A1 · Gérer la relation avec les clients et les fournisseurs",
        "A2 · Participer à la gestion des risques de la PME",
      ],
      objectif:
        "Comprendre pourquoi un cabinet rentable peut manquer d'argent, et agir sur le délai de règlement plutôt que sur le carnet de commandes.",
      competences: [
        "Je calcule le délai moyen de règlement de mes clients et je le traduis en euros immobilisés.",
        "Je choisis entre attendre, relancer, escompter ou céder une créance, en comparant ce que chaque solution coûte.",
        "Je rédige une procédure de relance applicable par une PME sans service de recouvrement.",
      ],
      notions: [
        "délai de règlement client",
        "encours clients",
        "besoin en fonds de roulement",
        "escompte et affacturage",
        "procédure de relance",
      ],
      preparation:
        "Relisez les outils de mobilisation des créances proposés par le jeu, pour pouvoir orienter sans décider à la place des équipes. Préparez la trame de procédure de relance en quatre étapes, à compléter par les équipes.",
      deroule: [
        {
          minutes: 20,
          titre: "Rentable et sans trésorerie",
          detail:
            "Les équipes constatent l'écart entre leur résultat et ce qu'il reste en banque. La situation est fréquente dans le jeu comme en cabinet, et c'est le point de départ.",
        },
        {
          minutes: 40,
          titre: "Le poste clients en euros",
          detail:
            "Chaque équipe calcule son délai moyen de règlement et le montant immobilisé chez ses clients, puis ce qu'un mois de délai en moins libérerait.",
        },
        {
          minutes: 35,
          titre: "Quatre solutions, quatre coûts",
          detail:
            "L'équipe compare attendre, relancer, escompter et céder la créance, et chiffre ce que chacune coûte. La gratuité apparente de la relance se discute : elle coûte du temps et parfois un client.",
        },
        {
          minutes: 35,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des décisions, y compris celles qui touchent au financement du besoin. L'équipe écrit ce qu'elle attend de sa décision sur sa trésorerie de fin de trimestre.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Le délai de règlement et la trésorerie nette de chaque équipe s'affichent côte à côte.",
        },
        {
          minutes: 30,
          titre: "Débriefing",
          detail:
            "On compare une équipe qui a mobilisé ses créances et une qui a attendu. La différence de résultat est petite ; la différence de trésorerie ne l'est pas.",
        },
      ],
      livrable:
        "La note sur le poste clients : le délai moyen constaté, le montant immobilisé, les quatre solutions comparées avec leur coût, la solution retenue, et la procédure de relance en quatre étapes.",
      tracePasseport:
        "J'ai mesuré le poste clients d'une PME, comparé les solutions de mobilisation des créances et rédigé une procédure de relance.",
      evaluation: [
        "Le délai de règlement est traduit en euros immobilisés, pas laissé en jours.",
        "Les quatre solutions sont chiffrées, y compris celle qui paraît gratuite.",
        "La procédure de relance est applicable par une PME sans service dédié.",
      ],
    },
    {
      numero: 3,
      titre: "Les risques d'une petite structure",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: [
        "A2 · Participer à la gestion des risques de la PME",
        "A4 · Soutenir le fonctionnement et le développement de la PME",
      ],
      objectif:
        "Recenser les risques qui pèsent sur une PME de douze personnes, mesurer ce qu'ils coûteraient, et décider lesquels transférer et lesquels garder.",
      competences: [
        "J'identifie les risques propres à une petite structure, dont la dépendance à un donneur d'ordres.",
        "Je chiffre l'impact d'un risque plutôt que de le qualifier de fort ou faible.",
        "J'arbitre entre supporter un risque, le réduire et le transférer à un assureur.",
      ],
      notions: [
        "cartographie des risques",
        "dépendance client",
        "sous-activité",
        "transfert de risque et assurance",
        "coût d'un sinistre non couvert",
      ],
      preparation:
        "Repérez les couvertures d'assurance proposées dans le scénario et ce que chacune couvre réellement, pour pouvoir répondre sans souffler la réponse. Préparez une grille de cartographie à deux entrées, probabilité et impact, vierge.",
      deroule: [
        {
          minutes: 20,
          titre: "Les consultants au banc",
          detail:
            "Les équipes constatent ce que coûte une équipe qui ne facture pas, et découvrent que la sous-activité est un risque au même titre qu'un sinistre.",
        },
        {
          minutes: 40,
          titre: "Cartographier",
          detail:
            "Chaque équipe place ses risques sur la grille, avec un chiffre d'impact pour chacun. Un risque sans montant reste une inquiétude, pas un risque.",
        },
        {
          minutes: 35,
          titre: "Garder ou transférer",
          detail:
            "L'équipe compare le coût annuel d'une couverture et le coût du sinistre qu'elle éviterait. Certains risques ne s'assurent pas : ceux-là se réduisent ou s'acceptent, et il faut le dire.",
        },
        {
          minutes: 35,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des décisions, dont la couverture retenue. L'équipe écrit ce qu'elle accepte de supporter seule.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. Les événements du trimestre tombent, et l'on voit qui était couvert. Le hasard fait ici partie de la leçon.",
        },
        {
          minutes: 30,
          titre: "Débriefing",
          detail:
            "On regarde les équipes touchées et les équipes épargnées, et l'on distingue une bonne décision d'un bon résultat. C'est la séance où cette distinction s'installe.",
        },
      ],
      livrable:
        "La cartographie des risques du cabinet : chaque risque avec sa probabilité, son impact chiffré, la décision prise à son sujet, et la justification des risques conservés sans couverture.",
      tracePasseport:
        "J'ai cartographié les risques d'une PME, chiffré leur impact et arbitré entre les conserver, les réduire et les transférer.",
      evaluation: [
        "Chaque risque porte un montant, pas seulement une couleur.",
        "La dépendance à un donneur d'ordres figure dans la cartographie.",
        "Les risques conservés sont assumés explicitement, avec ce qu'ils coûteraient.",
      ],
    },
    {
      numero: 4,
      titre: "Recruter, et à quel moment",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: [
        "A3 · Gérer le personnel et contribuer à la gestion des ressources humaines",
        "A4 · Soutenir le fonctionnement et le développement de la PME",
      ],
      objectif:
        "Décider d'une embauche dans une structure où un salaire de plus se voit immédiatement sur la trésorerie, et où le carnet n'est jamais garanti.",
      competences: [
        "Je calcule le nombre de journées qu'un consultant supplémentaire doit vendre pour se payer.",
        "Je situe le moment où recruter, entre la surcharge qui fait perdre des clients et l'embauche qui devance le carnet.",
        "Je prépare une décision d'embauche argumentée devant un dirigeant qui la financera.",
      ],
      notions: [
        "coût complet d'un salarié",
        "capacité de production",
        "sous-traitance d'appoint",
        "seuil de rentabilité d'un recrutement",
        "délai de montée en compétence",
      ],
      preparation:
        "Vérifiez que le niveau de la partie ouvre bien les décisions de personnel, sans quoi la séance n'a pas de support. Préparez la fiche de décision d'embauche, avec la ligne de calcul du nombre de journées à vendre laissée vide.",
      deroule: [
        {
          minutes: 20,
          titre: "Où en est le carnet",
          detail:
            "Chaque équipe relève son taux d'occupation des trimestres joués et dit si elle sature ou si elle a du mou.",
        },
        {
          minutes: 40,
          titre: "Ce que coûte un consultant de plus",
          detail:
            "L'équipe calcule le coût complet annuel d'un recrutement, puis le nombre de journées qu'il faut lui vendre pour qu'il se paie. Le chiffre obtenu se compare au taux d'occupation actuel.",
        },
        {
          minutes: 35,
          titre: "Recruter ou sous-traiter",
          detail:
            "L'équipe compare l'embauche et le renfort ponctuel : l'un engage durablement et coûte moins cher à la journée, l'autre coûte plus cher et se rend. Le bon choix dépend de ce que l'équipe croit du carnet à venir.",
        },
        {
          minutes: 35,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des décisions. L'équipe qui recrute écrit ce qu'elle attend en journées vendues supplémentaires.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez. L'effet d'un recrutement ne se lit pas entièrement ce trimestre : il faut le dire pour éviter des conclusions hâtives.",
        },
        {
          minutes: 30,
          titre: "Débriefing",
          detail:
            "On oppose une équipe qui a recruté et une qui a sous-traité, en gardant ouverte la question de savoir laquelle aura eu raison au trimestre suivant.",
        },
      ],
      livrable:
        "La fiche de décision d'embauche : le coût complet du poste, le nombre de journées à vendre pour l'amortir, la comparaison avec le renfort ponctuel, la décision, et l'effet attendu chiffré.",
      tracePasseport:
        "J'ai préparé une décision de recrutement dans une PME en chiffrant le coût complet du poste et le volume d'activité nécessaire pour l'amortir.",
      evaluation: [
        "Le coût du poste est un coût complet, pas un salaire brut.",
        "Le volume à vendre est comparé au taux d'occupation réellement constaté.",
        "L'alternative du renfort ponctuel est examinée, même si elle est écartée.",
      ],
    },
    {
      numero: 5,
      titre: "Défendre son prix",
      dureeMinutes: 180,
      tourJoue: 5,
      processus: [
        "A1 · Gérer la relation avec les clients et les fournisseurs",
        "A4 · Soutenir le fonctionnement et le développement de la PME",
      ],
      objectif:
        "Répondre à une demande de remise importante en sachant ce qu'elle retire à la marge et ce que son refus coûterait.",
      competences: [
        "Je calcule ce qu'une remise retire à la marge et le volume qu'il faudrait pour la compenser.",
        "J'évalue ce que représente un client dans mon activité avant de décider de le perdre.",
        "Je construis une réponse commerciale qui n'est ni l'acceptation ni le refus sec.",
      ],
      notions: [
        "marge sur coût variable",
        "remise commerciale",
        "dépendance à un client",
        "contrepartie de négociation",
        "coût d'une journée non vendue",
      ],
      preparation:
        "Préparez trois contreparties possibles à une remise, sans les donner : volume, délai de règlement, durée d'engagement. Les équipes doivent les trouver, mais vous devez pouvoir relancer celles qui butent.",
      deroule: [
        {
          minutes: 20,
          titre: "La demande",
          detail:
            "L'arène pose la situation du trimestre. Chaque équipe la lit et note sa première réaction, avant tout calcul. Cette réaction sera comparée à la décision finale.",
        },
        {
          minutes: 40,
          titre: "Ce que coûte la remise",
          detail:
            "L'équipe chiffre l'effet de la remise sur sa marge, puis le volume qu'il faudrait pour la compenser, puis ce que la perte du client représenterait dans son activité.",
        },
        {
          minutes: 30,
          titre: "Chercher la contrepartie",
          detail:
            "Une remise se donne, elle ne se subit pas : l'équipe cherche ce qu'elle peut demander en échange. Le raccourci fréquent est de ne demander que du volume.",
        },
        {
          minutes: 35,
          titre: "Décisions du trimestre",
          detail:
            "Saisie des décisions, avec la réponse commerciale rédigée en trois phrases comme si elle partait au client.",
        },
        {
          minutes: 25,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le dernier trimestre joué. Les équipes voient l'effet de leur réponse sur leur marge et sur leur occupation.",
        },
        {
          minutes: 30,
          titre: "Débriefing",
          detail:
            "On compare les premières réactions notées en début de séance et les décisions finales. L'écart entre les deux est ce que l'atelier a produit.",
        },
      ],
      livrable:
        "La réponse commerciale argumentée : l'effet chiffré de la remise sur la marge, le volume de compensation, le poids du client dans l'activité, la contrepartie demandée, et la réponse en trois phrases.",
      tracePasseport:
        "J'ai répondu à une demande de remise en chiffrant son effet sur la marge et en construisant une contrepartie négociable.",
      evaluation: [
        "Le volume de compensation est calculé sur la marge, jamais sur le chiffre d'affaires.",
        "Le poids du client dans l'activité est exprimé en part, pas en impression.",
        "Une contrepartie autre que le volume est proposée.",
      ],
    },
    {
      numero: 6,
      titre: "Rendre compte au dirigeant",
      dureeMinutes: 180,
      tourJoue: null,
      processus: [
        "A4 · Soutenir le fonctionnement et le développement de la PME",
        "A2 · Participer à la gestion des risques de la PME",
      ],
      objectif:
        "Construire le rapport d'activité des cinq trimestres et le présenter oralement à un dirigeant qui décidera de l'année suivante.",
      competences: [
        "Je construis un tableau de bord de PME qui tient sur une page et qui se lit.",
        "Je relie les décisions prises et les résultats obtenus, sans en attribuer le mérite au hasard.",
        "Je présente oralement une gestion et je réponds aux objections d'un dirigeant.",
      ],
      notions: [
        "tableau de bord de PME",
        "taux d'occupation",
        "délai de règlement",
        "compte rendu d'activité",
        "préconisation",
      ],
      preparation:
        "Annoncez la présentation à la séance précédente et remettez la grille aux équipes. Prévoyez un ordre de passage tiré au sort et un jury où siège un élève d'une autre équipe.",
      deroule: [
        {
          minutes: 10,
          titre: "Consignes et tirage",
          detail:
            "Rappel de la grille et tirage de l'ordre. Sept minutes de présentation, trois minutes de questions.",
        },
        {
          minutes: 55,
          titre: "Construction du rapport",
          detail:
            "Les équipes reprennent les cinq trimestres. Contrainte : une page de tableau de bord, quatre indicateurs au maximum, et deux préconisations pour l'année suivante.",
        },
        {
          minutes: 25,
          titre: "Préparation de l'oral",
          detail:
            "Répartition de la parole et anticipation des objections. Vous repérez les tableaux illisibles avant projection.",
        },
        {
          minutes: 65,
          titre: "Présentations",
          detail:
            "Passage des équipes devant le jury. Les questions portent d'abord sur les préconisations : ce sont elles qui engagent.",
        },
        {
          minutes: 25,
          titre: "Bilan de l'atelier",
          detail:
            "Vous rendez le classement puis vous l'écartez : ce qui se note est le rapport et sa présentation. Chaque élève rédige ses phrases de passeport professionnel.",
        },
      ],
      livrable:
        "Le rapport d'activité : le tableau de bord des cinq trimestres sur une page, quatre indicateurs justifiés, deux préconisations chiffrées pour l'année suivante, et la présentation orale de sept minutes.",
      tracePasseport:
        "J'ai rédigé le rapport d'activité d'une PME sur cinq trimestres et je l'ai présenté oralement avec des préconisations chiffrées.",
      evaluation: [
        "Le tableau tient sur une page et se lit sans commentaire.",
        "Les préconisations sont chiffrées et rattachées à une activité du référentiel.",
        "L'oral assume au moins une erreur de gestion et dit ce qui serait fait autrement.",
      ],
    },
  ],
  formats: [
    {
      nom: "Six séances hebdomadaires",
      quand: "Le format d'origine, sur six semaines consécutives.",
      comment:
        "Une séance par semaine, un trimestre par séance. L'intervalle laisse aux équipes le temps de rédiger leur note et à vous celui de la lire avant la séance suivante.",
    },
    {
      nom: "Trois demi-journées",
      quand: "Quand l'emploi du temps donne des blocs de six heures.",
      comment:
        "Deux séances par demi-journée avec une pause franche entre les deux. Gardez la séance du recrutement en début de bloc : elle demande des calculs que la fatigue abîme.",
    },
    {
      nom: "Fil rouge sur l'année",
      quand: "Quand l'atelier accompagne les quatre activités du référentiel.",
      comment:
        "Une séance par période, dans l'ordre des activités traitées en cours. La partie reste ouverte entre deux séances, ce qui permet de faire préparer les décisions hors classe.",
    },
  ],
  evaluationFinale: [
    "Les cinq notes intermédiaires, une par séance jouée, pour la moitié de la note.",
    "Le rapport d'activité de la dernière séance, pour un quart.",
    "La présentation orale et les réponses aux objections, pour le dernier quart.",
    "Le classement du jeu n'entre pas dans la note : une équipe peut finir dernière et rendre le meilleur rapport.",
  ],
  prolongements: [
    "Rejouer les cinq trimestres avec le monde variable activé, pour que les équipes éprouvent la différence entre une bonne décision et un bon résultat.",
    "Basculer sur le secteur du bâtiment, autre PME mais avec des chantiers en cours et des situations de travaux, pour opposer deux façons d'immobiliser de l'argent.",
    "Faire jouer le sixième trimestre en autonomie et le noter sur le seul écart entre les préconisations annoncées et les décisions réellement prises.",
  ],
  faq: [
    {
      question: "Un cabinet de conseil est-il représentatif d'une PME ?",
      reponse:
        "Sur ce que le référentiel demande, oui : un dirigeant qui décide de tout, une douzaine de salariés, aucun service support, et une trésorerie qui dépend entièrement des délais de règlement. Ce qu'il n'a pas, c'est un stock. Si vous tenez à travailler le stock et les approvisionnements, conduisez le même déroulé sur le secteur du bâtiment, qui porte des chantiers en cours.",
    },
    {
      question: "Les quatre activités sont-elles réellement couvertes ?",
      reponse:
        "Chacune tient une séance entière et se retrouve dans le rapport final. La relation fournisseurs est en revanche moins servie que la relation clients, parce que le cabinet achète peu : si ce point est évalué dans votre établissement, la séance sur les renforts extérieurs est l'endroit où l'accrocher.",
    },
    {
      question: "Le niveau retenu ouvre beaucoup de décisions, n'est-ce pas trop ?",
      reponse:
        "Il ouvre le personnel, le financement et l'assurance, qui sont exactement les trois leviers des activités du référentiel. En retirer un rendrait une séance sans support. En deuxième année, c'est le bon niveau ; en première année, descendez d'un cran et remplacez la séance de recrutement par une seconde séance sur le poste clients.",
    },
    {
      question: "Comment traiter la séance des risques si aucun sinistre ne tombe ?",
      reponse:
        "C'est le meilleur cas de figure pour la leçon. Une équipe qui s'est assurée et n'a rien subi a payé pour rien, et pourtant elle a bien décidé. C'est précisément la distinction entre une bonne décision et un bon résultat, et le débriefing est écrit pour l'installer à ce moment-là.",
    },
    {
      question: "Peut-on utiliser cet atelier en préparation de l'épreuve professionnelle ?",
      reponse:
        "Les livrables ont été conçus pour cela : une note d'une page par séance, un rapport d'activité et une présentation orale avec questions. Ils ne remplacent pas les situations vécues en stage, qui restent la matière de l'épreuve, mais ils donnent aux élèves l'entraînement à l'écrit court et à l'oral argumenté qui leur manque le plus souvent.",
    },
  ],
};
