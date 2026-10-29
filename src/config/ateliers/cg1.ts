import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS CG, première année.
 *
 * Sept séances de deux heures, un tour d'essai puis une partie de six tours, un
 * tour par séance. L'entreprise est la même du début à la fin : c'est ce qui
 * distingue un atelier d'une suite d'exercices. Les élèves ne calculent pas un
 * seuil de rentabilité, ils calculent LEUR seuil, celui de l'entreprise qu'ils
 * ont mal pilotée la semaine précédente.
 *
 * C'est un atelier de PREMIÈRE année, et il en a le périmètre : une seule
 * enceinte à produire et à vendre (la gamme attend la seconde année), un
 * niveau de jeu qui ouvre la mobilisation des créances sans ouvrir l'emprunt
 * ni l'investissement (les ressources humaines, ouvertes au même niveau,
 * restent à leur effectif de départ), et des séances qui restent dans les processus de première
 * année — opérations commerciales, TVA, stocks, seuil, budget de trésorerie.
 * Le bilan fonctionnel et le financement du poste clients par le calcul
 * viennent en seconde année, avec la gamme.
 *
 * Chaque séance produit un livrable et une phrase de passeport professionnel.
 * Un jeu d'entreprise sans trace écrite ne s'évalue pas.
 */
export const ATELIER_CG1: AtelierDefinition = {
  code: "cg1",
  titre: "Six trimestres chez Nova, du bilan d'ouverture au débriefing",
  formations: ["bts-cg"],
  annee: "Première année",
  nature: "Atelier professionnel",
  traceLabel: "passeport professionnel",
  referentielLabel: "Processus",
  referentielAccord: "mobilisés",
  pitch:
    "Sept séances de deux heures. Chaque équipe dirige la même entreprise du premier au dernier tour, décide, subit ses décisions, et produit à chaque séance un document professionnel qui s'évalue.",
  resume:
    "Une partie de six trimestres étalée sur sept séances, du diagnostic d'ouverture à la note de gestion, sur une seule enceinte et avec les seuls outils de première année.",
  difficulte: 2,
  difficulteLabel: "Initiation",
  format: "7 séances de 2 h",
  pourquoi:
    "En atelier professionnel, la difficulté n'est pas de faire calculer un seuil de rentabilité : c'est de faire comprendre à quoi il sert. Un dossier fournit les chiffres et demande la réponse. Ici les chiffres sont ceux que l'équipe a produits au tour précédent, personne ne connaît la réponse, et une décision prise sans le calcul se paie au tour suivant. Le compte de résultat, le stock, la TVA à décaisser et la caisse ne sont plus des documents à recopier : ce sont les conséquences de ce que l'équipe a fait. Et parce que c'est une première année, une seule chose nouvelle par séance, sur une seule enceinte.",
  reglages: {
    scenarioCode: "nova",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 3,
    niveauNom: "Pilotage",
    equipes: 6,
    bots: 2,
    tva: true,
    mondeVariable: false,
    quizMode: "Questions de connaissances activées",
    tours: 6,
    tourDEssai: 1,
    effectifParEquipe: "trois élèves",
    notes:
      "NOVA se joue ici en une seule enceinte : un stock, un coût de production, un seuil de rentabilité qui ne dépend pas d'un mix. La gamme de trois références, et le seuil qui bouge avec le mix, attendent la seconde année. Le niveau Pilotage ouvre la mobilisation des créances, ce qu'il faut pour les séances 4 et 6, et les ressources humaines, que l'atelier laisse à l'effectif de départ ; l'emprunt et l'investissement, qui n'ont pas leur place en première année, n'y sont pas : un manque de trésorerie, la banque le couvre seule par le découvert, à son taux. La TVA est activée pour la séance 6. Le monde variable est décoché pour que toutes vos classes jouent la même économie et que vos corrigés restent valables d'une année sur l'autre. Deux concurrents pilotés par la machine suffisent à ce que le marché résiste.",
  },
  seances: [
    {
      numero: 1,
      titre: "Entrer dans NOVA sur un tour d'essai",
      dureeMinutes: 120,
      tourJoue: null,
      essai: true,
      processus: [
        "P1 · Contrôle et traitement comptable des opérations commerciales",
      ],
      objectif:
        "Apprendre le jeu avant que rien ne compte : lire le mandat de NOVA, ses trois références d'enceintes et son atelier, jouer un trimestre d'essai de bout en bout, lire ses premiers résultats, puis lancer la vraie partie.",
      competences: [
        "Je présente une entreprise manufacturière en une page : ce qu'elle fabrique, pour qui, avec quelle capacité de production.",
        "Je repère, sur l'écran de décision, ce qui se décide chaque trimestre et ce que le niveau de la partie laisse fixé.",
        "Je lis un premier compte de résultat et je distingue les produits vendus, le résultat et la trésorerie de fin de trimestre.",
      ],
      notions: [
        "unité produite et capacité de l'atelier",
        "charges de structure d'une période",
        "cycle d'exploitation et besoin en fonds de roulement",
        "compte de résultat et trésorerie",
      ],
      preparation:
        "Créez la partie depuis votre espace avec ces réglages : scénario nova, un trimestre par tour, niveau Pilotage, six tours, six équipes, deux concurrents machine, TVA activée, monde variable décoché, questions de connaissances activées, et dans « Tour d'essai » un tour, sans cocher l'enchaînement automatique : c'est vous qui commencerez la vraie partie depuis l'ardoise en fin de séance. Notez le code d'invitation. Constituez les équipes à l'avance : trois élèves par équipe, rôles tournants d'une séance à l'autre. Imprimez la fiche d'identité de l'entreprise, vierge.",
      deroule: [
        {
          minutes: 10,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle : sept séances, un tour d'essai qui ne compte pas puis six trimestres, une seule entreprise, un document rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code et nomment leur entreprise.",
        },
        {
          minutes: 25,
          titre: "L'entreprise, lue à l'écran",
          detail:
            "Chaque équipe lit le mandat de NOVA, ses trois références d'enceintes avec leur prix de revient, la capacité de l'atelier, les délais de règlement des clients et des fournisseurs. Elle remplit la première moitié de sa fiche d'identité : ce que fabrique l'entreprise, à qui elle vend, et avec quels moyens.",
        },
        {
          minutes: 25,
          titre: "Le tour d'essai",
          detail:
            "Le bandeau de l'arène dit que rien ne compte. Chaque équipe lit la situation du trimestre, décide de son mix de production et de ses prix de vente, puis saisit ses décisions. Vous ne corrigez rien : un volume mal calibré est exactement ce que l'essai est fait pour absorber.",
        },
        {
          minutes: 20,
          titre: "Clôture de l'essai et premiers résultats",
          detail:
            "Vous clôturez le tour d'essai depuis votre espace. Chaque équipe lit son chiffre d'affaires, son résultat et sa trésorerie de fin de trimestre, et reporte les trois chiffres sur sa fiche d'identité.",
        },
        {
          minutes: 20,
          titre: "Ce que l'essai apprend",
          detail:
            "Vous affichez deux équipes côte à côte : un mix, un prix, un résultat, une trésorerie. Qui a vendu le plus, qui a gagné le plus, et pourquoi ce n'est pas la même équipe. Le tableau de flux montre que ce qui a été facturé n'est pas encore rentré : c'est la phrase que l'atelier répétera pendant six trimestres.",
        },
        {
          minutes: 20,
          titre: "La vraie partie commence",
          detail:
            "Les équipes terminent leur fiche d'identité. Vous appuyez sur « Commencer la vraie partie » depuis l'ardoise, vous confirmez, et toutes les entreprises repartent de l'état initial. Les équipes voient le bandeau de départ et lisent la situation du premier trimestre, cette fois pour de vrai.",
        },
      ],
      livrable:
        "La fiche d'identité de NOVA, une page : ce que fabrique et vend l'entreprise, ses trois références avec leur prix de revient, la capacité de l'atelier, les délais de règlement, les charges qui tombent chaque trimestre, et les trois chiffres du tour d'essai.",
      tracePasseport:
        "J'ai présenté une entreprise manufacturière sur une page à partir de ses écrans de décision et de ses premiers résultats d'essai, pour ouvrir mon passeport professionnel.",
      evaluation: [
        "Les trois références sont listées avec leur prix de revient.",
        "La capacité de l'atelier et les délais de règlement sont renseignés.",
        "Les trois chiffres de l'essai sont exacts, et la différence entre le résultat et la trésorerie est relevée.",
      ],
    },
    {
      numero: 2,
      titre: "Prendre l'entreprise en main",
      dureeMinutes: 120,
      tourJoue: 1,
      processus: [
        "P1 · Contrôle et traitement comptable des opérations commerciales",
      ],
      objectif:
        "Lire les documents de synthèse d'une entreprise inconnue et en tirer un diagnostic, avant de décider quoi que ce soit.",
      competences: [
        "Je lis un bilan d'ouverture et j'en tire ce que l'entreprise possède, ce qu'elle doit et ce qui lui reste.",
        "Je repère la contrainte qui limite l'activité, et je la distingue d'un simple manque de moyens.",
        "Je formule un diagnostic écrit, hiérarchisé, sans recopier les documents.",
      ],
      notions: [
        "actif et passif",
        "capitaux propres",
        "dettes financières",
        "charges fixes et charges variables",
      ],
      preparation:
        "Reprenez la partie créée à la séance d'essai et notez son code d'invitation. Constituez les équipes à l'avance : trois élèves par équipe, un rôle par élève (direction, production, finances), rôles tournants d'une séance à l'autre. Imprimez la fiche de diagnostic vierge, et distribuez une semaine avant le bilan d'ouverture et le compte de résultat de NOVA, tels que la partie les affiche. À préparer par les équipes avant la séance : chaque élève lit seul ces deux documents chez lui et apporte trois constats écrits ; la séance part de ces constats, elle ne commence pas par la découverte des documents.",
      deroule: [
        {
          minutes: 10,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle du jeu : sept séances, six trimestres, une seule entreprise, et un document rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code.",
        },
        {
          minutes: 20,
          titre: "Lecture individuelle",
          detail:
            "Chaque élève relit seul, dans l'arène, le bilan d'ouverture et le compte de résultat de son entreprise, et arrête les trois constats qu'il a préparés. Aucune discussion à ce moment : un diagnostic collectif commence par des lectures séparées.",
        },
        {
          minutes: 25,
          titre: "Diagnostic d'équipe",
          detail:
            "L'équipe confronte ses lectures et remplit la fiche de diagnostic. Vous circulez sans corriger : les erreurs de lecture se paieront au tour 1, et c'est ce qui les rendra mémorables.",
        },
        {
          minutes: 30,
          titre: "Le premier arbitrage",
          detail:
            "L'arène pose au tour 1 un arbitrage à deux issues, chacune avec ce qu'elle rapporte et ce qu'elle coûte. L'équipe tranche, motive son choix en trois lignes, puis saisit ses décisions : un prix, un volume à produire, un budget de marketing.",
        },
        {
          minutes: 15,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le tour depuis votre espace. Les états financiers du trimestre apparaissent pour chaque équipe, avec le classement.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "Une équipe présente son diagnostic, une autre le sien. Vous ne dites pas qui a raison : vous montrez le compte de résultat de chacune. C'est lui qui tranche. La fiche de diagnostic se termine hors séance, avec le choix retenu et sa justification.",
        },
      ],
      livrable:
        "La fiche de diagnostic d'ouverture, une page : ce que l'entreprise possède, ce qu'elle doit, ce qu'elle sait faire, la contrainte qui la limite, et le choix retenu au premier arbitrage avec sa justification.",
      tracePasseport:
        "J'ai justifié une décision de gestion par l'analyse des documents de synthèse d'une entreprise.",
      evaluation: [
        "Les montants cités sont exacts et proviennent bien des documents.",
        "Les constats sont hiérarchisés : le plus déterminant vient en premier.",
        "La contrainte identifiée est la bonne, et elle est nommée, pas devinée.",
        "La justification du choix mobilise le diagnostic et pas une intuition.",
      ],
    },
    {
      numero: 3,
      titre: "Le coût, le prix, le seuil",
      dureeMinutes: 120,
      tourJoue: 2,
      processus: ["P5 · Analyse et prévision de l'activité"],
      objectif:
        "Calculer le seuil de rentabilité de sa propre entreprise et s'en servir pour fixer un prix.",
      competences: [
        "Je distingue une charge variable d'une charge de structure sur un compte de résultat réel.",
        "Je calcule une marge sur coût variable unitaire et un taux de marge.",
        "Je calcule un seuil de rentabilité en volume et en valeur, et j'en déduis une marge de sécurité.",
        "Je fixe un prix de vente en tenant compte du seuil et de la réaction des clients.",
      ],
      notions: [
        "charges variables et charges de structure",
        "marge sur coût variable",
        "taux de marge sur coût variable",
        "seuil de rentabilité",
        "marge de sécurité",
      ],
      preparation:
        "Rien à créer : la partie continue. À préparer par les équipes avant la séance : depuis leur espace, le compte de résultat du tour 1 recopié en deux colonnes, les charges qui suivent le volume et celles qui tombent quoi qu'il arrive, sans trancher encore le cas du marketing ; la séance part de ce tri. Préparez au tableau le compte de résultat du tour 1 d'une équipe volontaire, il servira d'exemple commun. Le panneau du seuil de l'arène restera fermé jusqu'au calcul à la main.",
      deroule: [
        {
          minutes: 10,
          titre: "Reprise",
          detail:
            "Les résultats du tour 1 sont affichés. Vous demandez à chaque équipe combien elle a gagné, puis combien elle devait vendre pour ne rien perdre. Personne ne sait. C'est la séance.",
        },
        {
          minutes: 20,
          titre: "Le tri des charges",
          detail:
            "Chaque équipe reprend le tri qu'elle a préparé sur son compte de résultat du tour 1 et le défend : celles qui suivent le volume, celles qui tombent quoi qu'il arrive. Le marketing pose la vraie question, et il faut la trancher.",
        },
        {
          minutes: 25,
          titre: "Le calcul, à la main",
          detail:
            "Marge sur coût variable unitaire, taux de marge, seuil en volume, seuil en valeur, marge de sécurité. Sur papier, avec leurs chiffres, avant d'aller voir ce que le jeu affiche.",
        },
        {
          minutes: 10,
          titre: "Confrontation",
          detail:
            "Le panneau du seuil de l'arène est recalculé chaque tour avec les charges de structure de l'équipe. Ils comparent. Les écarts viennent presque toujours du classement des charges, et cet écart est la leçon.",
        },
        {
          minutes: 25,
          titre: "Décider le tour 2",
          detail:
            "Le prix se fixe maintenant avec le seuil sous les yeux. Chaque équipe écrit le volume qu'elle doit atteindre à son nouveau prix, puis saisit ses décisions.",
        },
        {
          minutes: 30,
          titre: "Clôture et débriefing",
          detail:
            "Vous clôturez. On compare le volume visé et le volume vendu, et on cherche pourquoi ils diffèrent : le prix a fait fuir des clients, ou le stock n'a pas suivi. La feuille de calcul du seuil se met au propre hors séance.",
        },
      ],
      livrable:
        "La feuille de calcul du seuil : tri des charges justifié, marge sur coût variable, seuil en volume et en valeur, marge de sécurité, et le prix retenu pour le tour 2 avec le volume qu'il faut atteindre.",
      tracePasseport:
        "J'ai fixé un prix de vente à partir du seuil de rentabilité calculé sur le compte de résultat de mon entreprise.",
      evaluation: [
        "Le tri des charges est justifié, y compris pour le budget de marketing.",
        "Les calculs sont exacts et les unités sont écrites.",
        "Le seuil est interprété : l'élève dit ce qu'il faut vendre, pas seulement le chiffre.",
        "Le prix retenu est cohérent avec le seuil annoncé.",
      ],
    },
    {
      numero: 4,
      titre: "Vendre n'est pas encaisser",
      dureeMinutes: 120,
      tourJoue: 3,
      processus: [
        "P5 · Analyse et prévision de l'activité",
        "P6 · Analyse de la situation financière",
      ],
      objectif:
        "Construire le budget de trésorerie du trimestre dans le cockpit, en déduire un besoin de trésorerie chiffré et daté, choisir comment le couvrir, puis mesurer l'écart avec le réalisé.",
      competences: [
        "Je distingue une charge d'un décaissement, et un produit d'un encaissement.",
        "Je construis un budget de trésorerie à partir de décisions prévues et de délais de règlement.",
        "Je présente un besoin de trésorerie chiffré et daté, et la façon de le couvrir.",
        "Je mesure l'écart entre ma prévision et le réalisé, et j'en cherche la cause.",
      ],
      notions: [
        "encaissements et décaissements",
        "délais de règlement clients et fournisseurs",
        "budget de trésorerie",
        "découvert autorisé",
        "mobilisation des créances",
      ],
      preparation:
        "Le cockpit de l'équipe (à télécharger depuis la page de la partie) porte une feuille de prévision du résultat et de la trésorerie, qui se recalcule à chaque hypothèse : c'est elle que les équipes renseignent, ligne à ligne, avant de saisir leurs décisions. À préparer par les équipes avant la séance : le cockpit téléchargé et sa feuille de prévision renseignée avec les délais du scénario et les décisions qu'elles envisagent pour le trimestre, jusqu'au solde de fin de trimestre ; la séance part de ce budget et le corrige, elle ne le construit pas. Vérifiez que la partie tourne au niveau Pilotage : c'est lui qui ouvre l'escompte et l'affacturage. L'emprunt n'y est pas : la banque couvre un manque par le découvert, à son taux.",
      deroule: [
        {
          minutes: 10,
          titre: "Résultat et caisse ne sont pas la même chose",
          detail:
            "Vous mettez côte à côte le résultat du tour 2 et la variation de trésorerie du même tour. Ils ne coïncident pas. Vous ne l'expliquez pas encore : vous le faites constater.",
        },
        {
          minutes: 25,
          titre: "Le budget, sur tableur",
          detail:
            "Chaque équipe reprend le budget qu'elle a préparé dans le cockpit et le passe au crible des délais du scénario : les particuliers paient comptant, le compte-clé à soixante jours convenus mais en retard, à quatre-vingts jours, quand il arrive au troisième trimestre, l'export à quatre-vingt-dix ; les fournisseurs se règlent selon le contrat retenu. Le solde de fin de trimestre est la ligne qui compte.",
        },
        {
          minutes: 20,
          titre: "Le besoin, chiffré et daté",
          detail:
            "Chaque équipe écrit en une ligne ce qui lui manque, quand, et pourquoi. Une équipe le lit à voix haute. Un besoin qu'on ne sait pas dater n'est pas un besoin, c'est une inquiétude.",
        },
        {
          minutes: 30,
          titre: "Décider le tour 3",
          detail:
            "Mobiliser des créances, ajuster la production, ou laisser le découvert couvrir : l'équipe choisit, et ce qu'elle mobilise doit correspondre au besoin que son budget démontre. Au-delà du découvert consenti, la banque cède elle-même les créances, et le fait payer ; elle lit à chaque clôture comment la trésorerie a été tenue.",
        },
        {
          minutes: 15,
          titre: "Clôture",
          detail:
            "Vous clôturez. Le verdict de la banque apparaît : trésorerie tenue ou non, confiance en hausse ou en baisse, découvert consenti pour le trimestre suivant.",
        },
        {
          minutes: 20,
          titre: "L'écart",
          detail:
            "Chaque équipe reprend son budget et repère, ligne par ligne, d'où vient l'écart. Un écart qui se répète dans le même sens n'est pas de la malchance, c'est une erreur de méthode. La note d'écart s'écrit hors séance, ligne par ligne, avec la cause de chacun.",
        },
      ],
      livrable:
        "Le budget de trésorerie du trimestre dans le cockpit, et la note d'écart qui l'accompagne : pour chaque ligne, le prévu, le réalisé, l'écart et sa cause.",
      tracePasseport:
        "J'ai justifié la couverture d'un besoin de trésorerie par un budget que j'ai établi puis confronté au réalisé.",
      evaluation: [
        "Les décaissements sont datés selon les délais réels, pas au moment de la charge.",
        "Le montant mobilisé correspond au besoin que le budget démontre.",
        "Les causes d'écart sont cherchées dans les décisions, pas mises sur le compte du hasard.",
        "Le tableur est lisible par quelqu'un qui ne l'a pas construit.",
      ],
    },
    {
      numero: 5,
      titre: "Produire, stocker, encaisser",
      dureeMinutes: 120,
      tourJoue: 4,
      processus: [
        "P2 · Contrôle et production de l'information financière",
        "P6 · Analyse de la situation financière",
      ],
      objectif:
        "Évaluer le stock au coût unitaire moyen pondéré, lire la variation de stock au compte de résultat, et expliquer pourquoi un trimestre bénéficiaire peut laisser la caisse à découvert.",
      competences: [
        "Je calcule un coût unitaire moyen pondéré à partir du stock initial et des entrées du trimestre.",
        "Je lis la production stockée au compte de résultat et je dis ce qu'elle est : un produit qui n'a rien encaissé.",
        "Je retrouve, poste par poste, où est passé l'argent d'un trimestre bénéficiaire : stock, créances, TVA à décaisser.",
        "Je propose une action qui libère de la trésorerie et je dis ce qu'elle coûte.",
      ],
      notions: [
        "coût unitaire moyen pondéré",
        "variation de stock et production stockée",
        "créances clients",
        "résultat et trésorerie",
      ],
      preparation:
        "C'est le tour où l'activité s'emballe : le chiffre d'affaires monte, le résultat suit, la caisse descend. Rien à régler : le scénario s'en charge. Distribuez à la fin de la séance précédente une fiche de stock vierge (stock initial, entrées, sorties, stock final). À préparer par les équipes avant la séance : cette fiche remplie avec leurs propres chiffres du tour 3, depuis leur espace, stock initial au coût du tour précédent, entrées au coût de production du trimestre, sorties au coût unitaire moyen pondéré ; la séance part de cette fiche. Préparez au tableau le petit tableau « où est passé l'argent » à trois lignes.",
      deroule: [
        {
          minutes: 10,
          titre: "Le constat",
          detail:
            "Le chiffre d'affaires monte, le résultat suit, et la trésorerie descend. Vous laissez les équipes buter dessus quelques minutes avant d'ouvrir la séance.",
        },
        {
          minutes: 25,
          titre: "Le stock, ce qu'il vaut",
          detail:
            "Chaque équipe reprend la fiche de stock qu'elle a préparée, vérifie son coût unitaire moyen pondéré, puis compare son stock final au montant du bilan. L'égalité tombe juste, ce qui n'arrive jamais dans un exercice inventé, et une fiche qui ne tombe pas juste se corrige ici.",
        },
        {
          minutes: 15,
          titre: "La production stockée",
          detail:
            "Au compte de résultat, la production stockée est un produit. Mais elle n'a rien encaissé : c'est de la marchandise dans la réserve, valorisée au coût. Les équipes qui ont produit plus qu'elles n'ont vendu voient leur résultat tenu par un produit qui n'est pas une vente.",
        },
        {
          minutes: 25,
          titre: "Où est passé l'argent",
          detail:
            "Trois lignes : ce que le stock a absorbé, ce que les créances clients ont absorbé, ce que la TVA à décaisser a retenu. La somme explique l'écart entre le résultat et la caisse, à l'euro près. Pas de bilan fonctionnel : il viendra en seconde année, quand le vocabulaire sera là.",
        },
        {
          minutes: 30,
          titre: "Décider le tour 4",
          detail:
            "Comment desserrer l'étau : produire moins pour vider le stock, vendre moins cher, mobiliser les créances, laisser le découvert courir. Chaque solution a son prix, et l'équipe doit dire lequel elle accepte de payer.",
        },
        {
          minutes: 15,
          titre: "Clôture",
          detail:
            "Vous clôturez. Les équipes qui n'ont rien fait découvrent l'affacturage forcé : la banque a cédé leurs créances à leur place, et le leur a fait payer. Le tableau « où est passé l'argent » se met au propre hors séance, avec l'action chiffrée pour le tour suivant.",
        },
      ],
      livrable:
        "La fiche de stock et le tableau « où est passé l'argent » : le stock du trimestre au coût unitaire moyen pondéré, son rapprochement avec le bilan, l'écart entre le résultat et la caisse expliqué ligne à ligne, et une action chiffrée pour le tour suivant.",
      tracePasseport:
        "J'ai expliqué pourquoi un trimestre bénéficiaire a laissé la trésorerie à découvert, à partir d'un stock évalué au coût unitaire moyen pondéré et rapproché du compte de résultat.",
      evaluation: [
        "Le coût unitaire moyen pondéré est exact et le stock final se retrouve au bilan.",
        "La production stockée est expliquée comme un produit sans encaissement, pas comme une vente.",
        "Le tableau « où est passé l'argent » boucle : ses trois lignes expliquent l'écart.",
        "L'action proposée est chiffrée et sa contrepartie est nommée.",
      ],
    },
    {
      numero: 6,
      titre: "La TVA, les délais et le poste clients",
      dureeMinutes: 120,
      tourJoue: 5,
      processus: [
        "P3 · Gestion des obligations fiscales",
        "P1 · Contrôle et traitement comptable des opérations commerciales",
      ],
      objectif:
        "Comprendre le poids de la TVA et des délais de règlement dans la trésorerie, et calculer ce que coûte de mobiliser une créance avant son terme.",
      competences: [
        "Je calcule une TVA collectée, une TVA déductible et une TVA à décaisser.",
        "J'explique pourquoi une taxe neutre pour le résultat pèse sur la trésorerie.",
        "Je calcule le coût d'un escompte et celui d'un affacturage sur mes propres créances, au prorata du trimestre.",
        "Je choisis de mobiliser ou non mes créances, et je justifie mon choix par le calcul.",
      ],
      notions: [
        "TVA collectée, déductible, à décaisser",
        "flux toutes taxes comprises et résultat hors taxes",
        "escompte",
        "affacturage",
      ],
      preparation:
        "Vérifiez que la TVA est bien activée dans les paramètres économiques de la partie. Au cinquième trimestre, le scénario fait bondir le coût des matières de 20 % pour deux trimestres : annoncez-le en ouverture, la lecture du financement se fera sur un compte de résultat que ce choc a déplacé. Reprenez le tableau « où est passé l'argent » de la séance 5 : sa troisième ligne est le sujet du jour. À préparer par les équipes avant la séance : retrouver dans leur bilan, depuis leur espace, la TVA à décaisser du tour 4, et calculer la TVA collectée et la TVA déductible qui la composent ; la séance part de ces trois montants. Préparez une créance chiffrée au tableau pour l'exercice de comparaison.",
      deroule: [
        {
          minutes: 15,
          titre: "La TVA n'est pas une charge",
          detail:
            "Le résultat de l'arène est rigoureusement hors taxes, les flux sont toutes taxes comprises, et la TVA à décaisser est une dette payée le trimestre suivant. Les équipes confrontent les montants qu'elles ont préparés à ce que dit leur bilan.",
        },
        {
          minutes: 15,
          titre: "Son poids dans la caisse",
          detail:
            "Ils reprennent la troisième ligne du tableau de la séance 5 et la refont pour le tour 5 : combien la TVA, neutre pour le résultat, a retenu dans la caisse ce trimestre. Une taxe qui ne coûte rien peut immobiliser beaucoup.",
        },
        {
          minutes: 25,
          titre: "Escompte ou affacturage",
          detail:
            "Sur leurs propres créances, ils calculent le coût de chacun des deux, au prorata du trimestre, et concluent. Le moins cher n'est pas toujours le plus disponible, et c'est le sujet.",
        },
        {
          minutes: 30,
          titre: "Décider le tour 5",
          detail:
            "L'équipe applique sa conclusion et saisit ses décisions, budget de trésorerie mis à jour dans le cockpit.",
        },
        {
          minutes: 15,
          titre: "Clôture",
          detail:
            "Vous clôturez. Le coût du financement apparaît dans le tableau de flux, à la ligne près.",
        },
        {
          minutes: 20,
          titre: "Débriefing",
          detail:
            "On compare le coût annoncé par les équipes et celui qui figure au compte de résultat. Les écarts viennent presque toujours du prorata. La note de TVA et de financement se met au propre hors séance.",
        },
      ],
      livrable:
        "La note de TVA et de financement : la TVA à décaisser du trimestre, son poids dans la caisse, le tableau comparatif escompte contre affacturage, et la décision retenue.",
      tracePasseport:
        "J'ai comparé par le calcul deux façons de mobiliser une créance, après avoir mesuré le poids de la TVA à décaisser dans la trésorerie.",
      evaluation: [
        "La TVA à décaisser est exacte et son mécanisme est expliqué en une phrase juste.",
        "La distinction entre neutralité pour le résultat et poids pour la trésorerie est établie.",
        "Les deux coûts sont calculés au prorata de la durée réelle.",
        "La décision suit le calcul et mentionne la contrainte de disponibilité.",
      ],
    },
    {
      numero: 7,
      titre: "Rendre compte",
      dureeMinutes: 120,
      tourJoue: 6,
      processus: [
        "P5 · Analyse et prévision de l'activité",
        "P7 · Fiabilisation de l'information et système d'information comptable (SIC)",
      ],
      objectif:
        "Produire une note de gestion de deux pages sur six trimestres à partir du relevé exporté, et la présenter en cinq minutes.",
      competences: [
        "J'exporte des données de gestion et je les contrôle avant de les utiliser.",
        "Je construis une série sur plusieurs périodes et j'en tire une évolution.",
        "Je rédige une note de gestion qui explique des résultats plutôt que de les décrire.",
        "Je présente une analyse à l'oral et je réponds à une question chiffrée.",
      ],
      notions: [
        "évolution en valeur et en pourcentage",
        "contrôle de cohérence",
        "note de gestion",
      ],
      preparation:
        "Distribuez à la fin de la séance précédente la trame de la note (deux pages, trois parties) et la grille d'oral. À préparer par les équipes avant la séance : la trame remplie sur les cinq premiers trimestres, depuis leur espace, avec le brouillon du graphique ; le sixième tour s'ajoute en séance, la note ne s'y écrit pas. Depuis la page de la partie, exportez le relevé au format tableur une fois le tour 6 clôturé : il contient les six tours de chaque équipe. Prévoyez un jury, même symbolique.",
      deroule: [
        {
          minutes: 20,
          titre: "Le dernier tour",
          detail:
            "Les équipes jouent le tour 6 avec tout ce qu'elles savent. Vous clôturez, le classement final tombe.",
        },
        {
          minutes: 10,
          titre: "Récupérer et contrôler",
          detail:
            "Chaque équipe reçoit le relevé exporté et vérifie sa cohérence : les six tours sont là, les totaux se recoupent, aucune ligne ne manque. Un tableau qu'on n'a pas contrôlé ne se commente pas.",
        },
        {
          minutes: 30,
          titre: "La note",
          detail:
            "Deux pages, trois parties : ce que l'entreprise a vendu et gagné, tour par tour ; ce qui s'est passé dans la caisse ; la décision qu'ils regrettent et ce qu'ils feraient autrement. Un graphique, issu du relevé. Les équipes reprennent la trame qu'elles ont préparée, y ajoutent le sixième tour et arrêtent le graphique ; la mise au propre se termine hors classe.",
        },
        {
          minutes: 45,
          titre: "Présentations",
          detail:
            "Sept minutes par équipe : cinq de présentation, deux de questions. Une question obligatoire du jury : montrez-nous le trimestre où la caisse a décroché, et dites pourquoi.",
        },
        {
          minutes: 15,
          titre: "Retour au groupe",
          detail:
            "Vous reprenez ce que le classement final ne dit pas : l'équipe la mieux classée n'est pas toujours celle qui a le mieux raisonné, et vous montrez pourquoi.",
        },
      ],
      livrable:
        "La note de gestion : deux pages, le diagnostic des six trimestres, le graphique issu du relevé exporté, et la présentation de cinq minutes.",
      tracePasseport:
        "J'ai produit et présenté une note de gestion sur six périodes à partir de données exportées et contrôlées.",
      evaluation: [
        "Les données de la note se retrouvent dans le relevé, sans écart.",
        "La note explique les résultats au lieu de les paraphraser.",
        "Le graphique sert la démonstration et porte ses unités.",
        "À l'oral, l'équipe assume ses décisions et répond avec des chiffres.",
      ],
    },
  ],
  formats: [
    {
      nom: "Atelier hebdomadaire",
      quand: "Sept semaines consécutives, deux heures par semaine",
      comment:
        "Le tempo pour lequel l'atelier est écrit. Une séance, un trimestre, un livrable. L'attente d'une semaine entre deux tours joue en votre faveur : les équipes reviennent avec leurs calculs faits et leurs regrets aussi.",
    },
    {
      nom: "Semaine bloquée",
      quand: "La veille et cinq jours, sept séances de deux heures",
      comment:
        "La séance d'essai la veille, puis une séance le matin et une l'après-midi les trois premiers jours de la semaine, puis les livrables et les présentations. Le travail à préparer avant chaque séance se fait alors entre la séance du matin et celle de l'après-midi. Prévoyez deux heures de plus pour la note : deux pages ne s'écrivent pas entre deux tours.",
    },
    {
      nom: "Fil rouge sur l'année",
      quand: "Sept séances réparties sur les deux premiers trimestres",
      comment:
        "Une séance toutes les trois ou quatre semaines, placée juste après le cours qui donne l'outil. Le seuil de rentabilité vient d'être vu, la séance 3 le fait servir ; la TVA vient d'être vue, la séance 6 la fait peser. C'est le montage qui ancre le mieux, et celui qui demande le plus de discipline : la partie reste ouverte des mois.",
    },
  ],
  evaluationFinale: [
    "Six livrables d'équipe, un par séance jouée, notés sur les critères annoncés au début de chaque séance.",
    "La note de gestion et sa présentation, qui pèsent le plus lourd parce qu'elles rassemblent tout.",
    "La note pédagogique que la plateforme calcule pour chaque équipe : diagnostics justes, modèles d'analyse bien choisis, questions de connaissances, indices consommés. Elle éclaire le travail de raisonnement, que les livrables ne montrent pas toujours.",
    "Le classement final ne compte pas dans la note. Une équipe peut bien raisonner et mal finir : c'est la vie des entreprises, ce ne doit pas être celle des élèves.",
  ],
  faq: [
    {
      question: "Faut-il savoir jouer soi-même avant d'animer ?",
      reponse:
        "Non, mais il faut avoir joué une partie solo une fois, environ quarante minutes, pour savoir où sont les écrans. L'atelier ne vous demande jamais de décider à la place des équipes : votre travail est de clôturer les tours et d'animer les débriefings.",
    },
    {
      question: "Pourquoi une seule enceinte, et pas la gamme ?",
      reponse:
        "Parce qu'en première année le seuil de rentabilité doit d'abord se comprendre sur un produit : une marge, un volume, un point où l'on ne perd plus. Avec trois références, le seuil dépend du mix vendu, et c'est une autre leçon. La gamme, avec le niveau Arbitrage qui l'ouvre, est le prolongement naturel en seconde année.",
    },
    {
      question:
        "Que se passe-t-il si une équipe fait faillite en cours de route ?",
      reponse:
        "Rien ne s'arrête. Une entreprise en découvert au-delà du plafond voit ses créances cédées d'office, elle continue de jouer, et elle a beaucoup à raconter en séance 5. Une équipe qui se plante donne souvent la meilleure note de gestion, à condition que vous le disiez dès la première séance.",
    },
    {
      question: "Combien d'élèves par équipe ?",
      reponse:
        "Trois, avec un rôle chacun et des rôles qui tournent d'une séance à l'autre. À deux, un élève finit par décider seul. À quatre, un élève regarde.",
    },
    {
      question: "Peut-on rattraper une séance manquée ?",
      reponse:
        "Oui. Une équipe absente peut saisir ses décisions à distance avant que vous ne clôturiez le tour. Si personne ne les saisit, le tour se joue avec des décisions neutres et l'équipe reprend au tour suivant, avec un trimestre de retard qui se voit dans ses chiffres.",
    },
    {
      question: "Faut-il des ordinateurs pour tout le monde ?",
      reponse:
        "Un poste par équipe suffit pour jouer. Le cockpit de la séance 4 et la note de la séance 7 demandent en revanche de quoi travailler à plusieurs, en salle informatique ou sur les portables des élèves.",
    },
    {
      question: "Peut-on changer de secteur d'entreprise ?",
      reponse:
        "Oui, tous les secteurs se jouent avec le même déroulé. NOVA est recommandé parce qu'il porte un stock, un coût de production et des délais de règlement, les trois matières de la première année. Un secteur sans stock, comme la restauration ou l'hôtellerie, retire à la séance 5 son objet.",
    },
    {
      question: "Quelles épreuves du BTS cet atelier prépare-t-il ?",
      reponse:
        "L'épreuve E5, situations de contrôle de gestion et d'analyse financière, pour le seuil, le budget de trésorerie et les écarts ; l'épreuve E4, traitement et contrôle des opérations comptables, fiscales et sociales, pour la TVA et les stocks ; et l'épreuve E6, parcours de professionnalisation, dont le passeport professionnel que chaque séance nourrit est la pièce centrale. Vérifiez les intitulés sur le référentiel en vigueur dans votre académie.",
    },
  ],
  prolongements: [
    "Rejouer le même atelier sur LA TABLE D'AUGUSTIN, où rien ne se stocke : les élèves découvrent que la moitié de leurs réflexes venaient du stock et pas de la gestion.",
    "En seconde année, passer NOVA en gamme avec le niveau Arbitrage : trois références, un seuil qui dépend du mix, le bilan fonctionnel et le financement du poste clients par le calcul.",
    "Prolonger la séance 6 vers le calcul et le décaissement de l'impôt sur les sociétés, modulable dans les paramètres économiques de la partie.",
    "Monter un concours entre classes à partir de la même partie, avec groupes tirés au sort et décisions verrouillées.",
  ],
};
