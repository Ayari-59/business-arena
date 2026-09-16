import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · BTS CG, première année.
 *
 * Six séances de trois heures, une partie de six tours, un tour par séance.
 * L'entreprise est la même du début à la fin : c'est ce qui distingue un
 * atelier d'une suite d'exercices. Les élèves ne calculent pas un seuil de
 * rentabilité, ils calculent LEUR seuil, celui de l'entreprise qu'ils ont mal
 * pilotée la semaine précédente.
 *
 * C'est un atelier de PREMIÈRE année, et il en a le périmètre : une seule
 * enceinte à produire et à vendre (la gamme attend la seconde année), un
 * niveau de jeu qui ouvre le financement sans ouvrir le recrutement ni
 * l'investissement, et des séances qui restent dans les processus de première
 * année — opérations commerciales, TVA, stocks, seuil, budget de trésorerie.
 * Le bilan fonctionnel et le financement du poste clients par le calcul
 * viennent en seconde année, avec la gamme.
 *
 * Chaque séance produit un livrable et une phrase de passeport professionnel.
 * Un jeu d'entreprise sans trace écrite ne s'évalue pas.
 */
export const ATELIER_CG1: AtelierDefinition = {
  code: "cg1",
  titre: "Piloter une entreprise pendant six trimestres",
  diplome: "BTS Comptabilité et Gestion",
  annee: "Première année",
  nature: "Atelier professionnel",
  traceLabel: "passeport professionnel",
  referentielLabel: "Processus",
  referentielAccord: "mobilisés",
  pitch:
    "Six séances de trois heures. Chaque équipe dirige la même entreprise du premier au dernier tour, décide, subit ses décisions, et produit à chaque séance un document professionnel qui s'évalue.",
  resume:
    "Une partie de six trimestres étalée sur six séances, du diagnostic d'ouverture à la note de gestion, sur une seule enceinte et avec les seuls outils de première année.",
  difficulte: 2,
  difficulteLabel: "Initiation",
  format: "6 séances de 3 h",
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
    effectifParEquipe: "trois élèves",
    notes:
      "NOVA se joue ici en une seule enceinte : un stock, un coût de production, un seuil de rentabilité qui ne dépend pas d'un mix. La gamme de trois références, et le seuil qui bouge avec le mix, attendent la seconde année. Le niveau Pilotage ouvre l'emprunt, l'apport des associés et la mobilisation des créances, ce qu'il faut pour les séances 3 et 5, sans ouvrir le recrutement ni l'investissement, qui n'ont pas leur place en première année. La TVA est activée pour la séance 5. Le monde variable est décoché pour que toutes vos classes jouent la même économie et que vos corrigés restent valables d'une année sur l'autre. Deux concurrents pilotés par la machine suffisent à ce que le marché résiste.",
  },
  seances: [
    {
      numero: 1,
      titre: "Prendre l'entreprise en main",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: [
        "P1 · Contrôle et traitement comptable des opérations commerciales",
        "P7 · Fiabilisation de l'information et système d'information comptable (SIC)",
      ],
      objectif:
        "Lire les documents de synthèse d'une entreprise inconnue et en tirer un diagnostic, avant de décider quoi que ce soit.",
      competences: [
        "Je lis un bilan d'ouverture et j'en tire ce que l'entreprise possède, ce qu'elle doit et ce qui lui reste.",
        "Je repère la contrainte qui limite l'activité, et je la distingue d'un simple manque de moyens.",
        "Je formule un diagnostic écrit, hiérarchisé, sans recopier les documents.",
      ],
      notions: ["actif et passif", "capitaux propres", "dettes financières", "charges fixes et charges variables"],
      preparation:
        "Créez la partie avec ces réglages : NOVA (une seule enceinte), un trimestre par tour, niveau 3 · Pilotage, six tours, six équipes, deux concurrents machine, TVA activée, monde variable décoché, questions de connaissances activées. Notez le code d'invitation. Constituez les équipes à l'avance : trois élèves par équipe, un rôle par élève (direction, production, finances), rôles tournants d'une séance à l'autre. Imprimez la fiche de diagnostic vierge.",
      deroule: [
        {
          minutes: 15,
          titre: "Le cadre",
          detail:
            "Vous annoncez la règle du jeu : six séances, six trimestres, une seule entreprise, et un document rendu à chaque fin de séance. Les équipes rejoignent la partie avec le code.",
        },
        {
          minutes: 30,
          titre: "Lecture individuelle",
          detail:
            "Chaque élève lit seul le bilan d'ouverture et le compte de résultat de son entreprise, et note trois constats. Aucune discussion à ce moment : un diagnostic collectif commence par des lectures séparées.",
        },
        {
          minutes: 30,
          titre: "Diagnostic d'équipe",
          detail:
            "L'équipe confronte ses lectures et remplit la fiche de diagnostic. Vous circulez sans corriger : les erreurs de lecture se paieront au tour 1, et c'est ce qui les rendra mémorables.",
        },
        {
          minutes: 45,
          titre: "Le premier arbitrage",
          detail:
            "L'arène pose au tour 1 un arbitrage à deux issues, chacune avec ce qu'elle rapporte et ce qu'elle coûte. L'équipe tranche, motive son choix en trois lignes, puis saisit ses décisions : un prix, un volume à produire, un budget de marketing.",
        },
        {
          minutes: 20,
          titre: "Clôture et résultats",
          detail:
            "Vous clôturez le tour depuis votre espace. Les états financiers du trimestre apparaissent pour chaque équipe, avec le classement.",
        },
        {
          minutes: 40,
          titre: "Débriefing",
          detail:
            "Une équipe présente son diagnostic, une autre le sien. Vous ne dites pas qui a raison : vous montrez le compte de résultat de chacune. C'est lui qui tranche.",
        },
      ],
      livrable:
        "La fiche de diagnostic d'ouverture, une page : ce que l'entreprise possède, ce qu'elle doit, ce qu'elle sait faire, la contrainte qui la limite, et le choix retenu au premier arbitrage avec sa justification.",
      tracePasseport:
        "J'ai analysé la situation d'une entreprise à partir de ses documents de synthèse, et j'ai justifié une décision de gestion à partir de ce diagnostic.",
      evaluation: [
        "Les montants cités sont exacts et proviennent bien des documents.",
        "Les constats sont hiérarchisés : le plus déterminant vient en premier.",
        "La contrainte identifiée est la bonne, et elle est nommée, pas devinée.",
        "La justification du choix mobilise le diagnostic et pas une intuition.",
      ],
    },
    {
      numero: 2,
      titre: "Le coût, le prix, le seuil",
      dureeMinutes: 180,
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
        "Rien à créer : la partie continue. Préparez au tableau le compte de résultat du tour 1 d'une équipe volontaire, il servira d'exemple commun. Le panneau du seuil de l'arène restera fermé jusqu'au calcul à la main.",
      deroule: [
        {
          minutes: 20,
          titre: "Reprise",
          detail:
            "Les résultats du tour 1 sont affichés. Vous demandez à chaque équipe combien elle a gagné, puis combien elle devait vendre pour ne rien perdre. Personne ne sait. C'est la séance.",
        },
        {
          minutes: 40,
          titre: "Le tri des charges",
          detail:
            "Sur le compte de résultat du tour 1, chaque équipe classe ses charges : celles qui suivent le volume, celles qui tombent quoi qu'il arrive. Le marketing pose la vraie question, et il faut la trancher.",
        },
        {
          minutes: 30,
          titre: "Le calcul, à la main",
          detail:
            "Marge sur coût variable unitaire, taux de marge, seuil en volume, seuil en valeur, marge de sécurité. Sur papier, avec leurs chiffres, avant d'aller voir ce que le jeu affiche.",
        },
        {
          minutes: 15,
          titre: "Confrontation",
          detail:
            "Le panneau du seuil de l'arène est recalculé chaque tour avec les charges de structure de l'équipe. Ils comparent. Les écarts viennent presque toujours du classement des charges, et cet écart est la leçon.",
        },
        {
          minutes: 40,
          titre: "Décider le tour 2",
          detail:
            "Le prix se fixe maintenant avec le seuil sous les yeux. Chaque équipe écrit le volume qu'elle doit atteindre à son nouveau prix, puis saisit ses décisions.",
        },
        {
          minutes: 35,
          titre: "Clôture et débriefing",
          detail:
            "Vous clôturez. On compare le volume visé et le volume vendu, et on cherche pourquoi ils diffèrent : le prix a fait fuir des clients, ou le stock n'a pas suivi.",
        },
      ],
      livrable:
        "La feuille de calcul du seuil : tri des charges justifié, marge sur coût variable, seuil en volume et en valeur, marge de sécurité, et le prix retenu pour le tour 2 avec le volume qu'il faut atteindre.",
      tracePasseport:
        "J'ai calculé le seuil de rentabilité d'une entreprise à partir de son compte de résultat, et je m'en suis servi pour fixer un prix de vente.",
      evaluation: [
        "Le tri des charges est justifié, y compris pour le budget de marketing.",
        "Les calculs sont exacts et les unités sont écrites.",
        "Le seuil est interprété : l'élève dit ce qu'il faut vendre, pas seulement le chiffre.",
        "Le prix retenu est cohérent avec le seuil annoncé.",
      ],
    },
    {
      numero: 3,
      titre: "Vendre n'est pas encaisser",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: [
        "P1 · Contrôle et traitement comptable des opérations commerciales",
        "P5 · Analyse et prévision de l'activité",
      ],
      objectif:
        "Construire le budget de trésorerie du trimestre dans le cockpit, en déduire un besoin de financement chiffré et daté, puis mesurer l'écart avec le réalisé.",
      competences: [
        "Je distingue une charge d'un décaissement, et un produit d'un encaissement.",
        "Je construis un budget de trésorerie à partir de décisions prévues et de délais de règlement.",
        "Je présente un besoin de financement chiffré et daté.",
        "Je mesure l'écart entre ma prévision et le réalisé, et j'en cherche la cause.",
      ],
      notions: [
        "encaissements et décaissements",
        "délais de règlement clients et fournisseurs",
        "budget de trésorerie",
        "découvert autorisé",
        "emprunt",
      ],
      preparation:
        "Le cockpit de l'équipe (à télécharger depuis la page de la partie) porte une feuille de prévision du résultat et de la trésorerie, qui se recalcule à chaque hypothèse : c'est elle que les équipes renseignent, ligne à ligne, avant de saisir leurs décisions. Vérifiez que la partie tourne au niveau Pilotage : c'est lui qui ouvre l'emprunt et l'apport des associés.",
      deroule: [
        {
          minutes: 20,
          titre: "Résultat et caisse ne sont pas la même chose",
          detail:
            "Vous mettez côte à côte le résultat du tour 2 et la variation de trésorerie du même tour. Ils ne coïncident pas. Vous ne l'expliquez pas encore : vous le faites constater.",
        },
        {
          minutes: 45,
          titre: "Le budget, sur tableur",
          detail:
            "Chaque équipe prévoit ses encaissements et ses décaissements du trimestre à venir, à partir de ses décisions et des délais du scénario : les particuliers paient comptant, le compte-clé à quatre-vingts jours quand il arrive au troisième trimestre, l'export à quatre-vingt-dix ; les fournisseurs se règlent selon le contrat retenu. Le solde de fin de trimestre est la ligne qui compte.",
        },
        {
          minutes: 25,
          titre: "Le besoin, chiffré et daté",
          detail:
            "Chaque équipe écrit en une ligne ce qui lui manque, quand, et pourquoi. Une équipe le lit à voix haute. Un besoin qu'on ne sait pas dater n'est pas un besoin, c'est une inquiétude.",
        },
        {
          minutes: 30,
          titre: "Décider le tour 3",
          detail:
            "Emprunter, faire appel aux associés, ou ne rien faire : l'équipe choisit, et le montant demandé doit correspondre au besoin que son budget démontre. La banque prête dans la limite de ce que les capitaux propres autorisent, et elle lit à chaque clôture comment la trésorerie a été tenue.",
        },
        {
          minutes: 20,
          titre: "Clôture",
          detail:
            "Vous clôturez. Le verdict de la banque apparaît : trésorerie tenue ou non, confiance en hausse ou en baisse, découvert consenti pour le trimestre suivant.",
        },
        {
          minutes: 40,
          titre: "L'écart",
          detail:
            "Chaque équipe reprend son budget et écrit, ligne par ligne, d'où vient l'écart. Un écart qui se répète dans le même sens n'est pas de la malchance, c'est une erreur de méthode.",
        },
      ],
      livrable:
        "Le budget de trésorerie du trimestre dans le cockpit, et la note d'écart qui l'accompagne : pour chaque ligne, le prévu, le réalisé, l'écart et sa cause.",
      tracePasseport:
        "J'ai établi un budget de trésorerie, je m'en suis servi pour justifier une demande de financement, et j'ai analysé les écarts avec le réalisé.",
      evaluation: [
        "Les décaissements sont datés selon les délais réels, pas au moment de la charge.",
        "Le besoin de financement demandé correspond à celui que le budget démontre.",
        "Les causes d'écart sont cherchées dans les décisions, pas mises sur le compte du hasard.",
        "Le tableur est lisible par quelqu'un qui ne l'a pas construit.",
      ],
    },
    {
      numero: 4,
      titre: "Produire, stocker, encaisser",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: [
        "P2 · Contrôle et production de l'information financière",
        "P1 · Contrôle et traitement comptable des opérations commerciales",
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
        "C'est le tour où l'activité s'emballe : le chiffre d'affaires monte, le résultat suit, la caisse descend. Rien à régler : le scénario s'en charge. Préparez au tableau une fiche de stock vierge (stock initial, entrées, sorties, stock final) et le petit tableau « où est passé l'argent » à trois lignes.",
      deroule: [
        {
          minutes: 20,
          titre: "Le constat",
          detail:
            "Le chiffre d'affaires monte, le résultat suit, et la trésorerie descend. Vous laissez les équipes buter dessus une bonne dizaine de minutes avant d'ouvrir la séance.",
        },
        {
          minutes: 40,
          titre: "Le stock, ce qu'il vaut",
          detail:
            "Chaque équipe remplit sa fiche de stock avec ses propres chiffres : stock initial au coût du tour précédent, entrées au coût de production du trimestre, sorties au coût unitaire moyen pondéré. Puis elle compare son stock final au montant du bilan. L'égalité tombe juste, ce qui n'arrive jamais dans un exercice inventé.",
        },
        {
          minutes: 30,
          titre: "La production stockée",
          detail:
            "Au compte de résultat, la production stockée est un produit. Mais elle n'a rien encaissé : c'est de la marchandise dans la réserve, valorisée au coût. Les équipes qui ont produit plus qu'elles n'ont vendu voient leur résultat tenu par un produit qui n'est pas une vente.",
        },
        {
          minutes: 40,
          titre: "Où est passé l'argent",
          detail:
            "Trois lignes : ce que le stock a absorbé, ce que les créances clients ont absorbé, ce que la TVA à décaisser a retenu. La somme explique l'écart entre le résultat et la caisse, à l'euro près. Pas de bilan fonctionnel : il viendra en seconde année, quand le vocabulaire sera là.",
        },
        {
          minutes: 30,
          titre: "Décider le tour 4",
          detail:
            "Comment desserrer l'étau : produire moins pour vider le stock, vendre moins cher, mobiliser les créances, emprunter. Chaque solution a son prix, et l'équipe doit dire lequel elle accepte de payer.",
        },
        {
          minutes: 20,
          titre: "Clôture",
          detail:
            "Vous clôturez. Les équipes qui n'ont rien fait découvrent l'affacturage forcé : la banque a cédé leurs créances à leur place, et le leur a fait payer.",
        },
      ],
      livrable:
        "La fiche de stock du trimestre au coût unitaire moyen pondéré, rapprochée du bilan, et le tableau « où est passé l'argent » qui explique l'écart entre le résultat et la caisse, avec une action chiffrée pour le tour suivant.",
      tracePasseport:
        "J'ai évalué un stock au coût unitaire moyen pondéré, rapproché la production stockée du compte de résultat, et expliqué pourquoi un trimestre bénéficiaire avait laissé la trésorerie à découvert.",
      evaluation: [
        "Le coût unitaire moyen pondéré est exact et le stock final se retrouve au bilan.",
        "La production stockée est expliquée comme un produit sans encaissement, pas comme une vente.",
        "Le tableau « où est passé l'argent » boucle : ses trois lignes expliquent l'écart.",
        "L'action proposée est chiffrée et sa contrepartie est nommée.",
      ],
    },
    {
      numero: 5,
      titre: "La TVA, les délais et le poste clients",
      dureeMinutes: 180,
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
        "Vérifiez que la TVA est bien activée dans les paramètres économiques de la partie. Au cinquième trimestre, le scénario fait bondir le coût des matières de 20 % pour deux trimestres : annoncez-le en ouverture, la lecture du financement se fera sur un compte de résultat que ce choc a déplacé. Reprenez le tableau « où est passé l'argent » de la séance 4 : sa troisième ligne est le sujet du jour. Préparez une créance chiffrée au tableau pour l'exercice de comparaison.",
      deroule: [
        {
          minutes: 30,
          titre: "La TVA n'est pas une charge",
          detail:
            "Le résultat de l'arène est rigoureusement hors taxes, les flux sont toutes taxes comprises, et la TVA à décaisser est une dette payée le trimestre suivant. Les équipes retrouvent le montant dans leur bilan.",
        },
        {
          minutes: 30,
          titre: "Son poids dans la caisse",
          detail:
            "Ils reprennent la troisième ligne du tableau de la séance 4 et la refont pour le tour 5 : combien la TVA, neutre pour le résultat, a retenu dans la caisse ce trimestre. Une taxe qui ne coûte rien peut immobiliser beaucoup.",
        },
        {
          minutes: 40,
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
          minutes: 20,
          titre: "Clôture",
          detail:
            "Vous clôturez. Le coût du financement apparaît dans le tableau de flux, à la ligne près.",
        },
        {
          minutes: 30,
          titre: "Débriefing",
          detail:
            "On compare le coût annoncé par les équipes et celui qui figure au compte de résultat. Les écarts viennent presque toujours du prorata.",
        },
      ],
      livrable:
        "Le calcul de la TVA à décaisser du trimestre, son poids dans la caisse, et le tableau comparatif escompte contre affacturage avec la décision retenue.",
      tracePasseport:
        "J'ai calculé une TVA à décaisser, mesuré son poids dans la trésorerie, et comparé par le calcul deux façons de mobiliser une créance.",
      evaluation: [
        "La TVA à décaisser est exacte et son mécanisme est expliqué en une phrase juste.",
        "La distinction entre neutralité pour le résultat et poids pour la trésorerie est établie.",
        "Les deux coûts sont calculés au prorata de la durée réelle.",
        "La décision suit le calcul et mentionne la contrainte de disponibilité.",
      ],
    },
    {
      numero: 6,
      titre: "Rendre compte",
      dureeMinutes: 180,
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
        "Depuis la page de la partie, exportez le relevé au format tableur : il contient les six tours de chaque équipe. Distribuez la trame de la note (deux pages, trois parties) et la grille d'oral. Prévoyez un jury, même symbolique.",
      deroule: [
        {
          minutes: 20,
          titre: "Le dernier tour",
          detail:
            "Les équipes jouent le tour 6 avec tout ce qu'elles savent. Vous clôturez, le classement final tombe.",
        },
        {
          minutes: 20,
          titre: "Récupérer et contrôler",
          detail:
            "Chaque équipe reçoit le relevé exporté et vérifie sa cohérence : les six tours sont là, les totaux se recoupent, aucune ligne ne manque. Un tableau qu'on n'a pas contrôlé ne se commente pas.",
        },
        {
          minutes: 60,
          titre: "La note",
          detail:
            "Deux pages, trois parties : ce que l'entreprise a vendu et gagné, tour par tour ; ce qui s'est passé dans la caisse ; la décision qu'ils regrettent et ce qu'ils feraient autrement. Un graphique, issu du relevé. La séance en pose la structure et l'essentiel du texte ; la mise au propre se termine hors classe.",
        },
        {
          minutes: 60,
          titre: "Présentations",
          detail:
            "Sept minutes par équipe : cinq de présentation, deux de questions. Une question obligatoire du jury : montrez-nous le trimestre où la caisse a décroché, et dites pourquoi.",
        },
        {
          minutes: 20,
          titre: "Retour au groupe",
          detail:
            "Vous reprenez ce que le classement final ne dit pas : l'équipe la mieux classée n'est pas toujours celle qui a le mieux raisonné, et vous montrez pourquoi.",
        },
      ],
      livrable:
        "La note de gestion de deux pages, son graphique issu du relevé exporté, et la présentation de cinq minutes.",
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
      quand: "Six semaines consécutives, trois heures par semaine",
      comment:
        "Le tempo pour lequel l'atelier est écrit. Une séance, un trimestre, un livrable. L'attente d'une semaine entre deux tours joue en votre faveur : les équipes reviennent avec leurs calculs faits et leurs regrets aussi.",
    },
    {
      nom: "Semaine bloquée",
      quand: "Cinq jours, six demi-journées de trois heures",
      comment:
        "Les six séances tiennent dans la semaine, à raison d'une le matin et une l'après-midi les trois premiers jours, puis les livrables et les présentations. Prévoyez une demi-journée de plus pour la note : deux pages ne s'écrivent pas entre deux tours.",
    },
    {
      nom: "Fil rouge sur l'année",
      quand: "Six séances réparties sur les deux premiers trimestres",
      comment:
        "Une séance toutes les trois ou quatre semaines, placée juste après le cours qui donne l'outil. Le seuil de rentabilité vient d'être vu, la séance 2 le fait servir ; la TVA vient d'être vue, la séance 5 la fait peser. C'est le montage qui ancre le mieux, et celui qui demande le plus de discipline : la partie reste ouverte des mois.",
    },
  ],
  evaluationFinale: [
    "Six livrables d'équipe, un par séance, notés sur les critères annoncés au début de chaque séance.",
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
      question: "Que se passe-t-il si une équipe fait faillite en cours de route ?",
      reponse:
        "Rien ne s'arrête. Une entreprise en découvert au-delà du plafond voit ses créances cédées d'office, elle continue de jouer, et elle a beaucoup à raconter en séance 4. Une équipe qui se plante donne souvent la meilleure note de gestion, à condition que vous le disiez dès la première séance.",
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
        "Un poste par équipe suffit pour jouer. Le cockpit de la séance 3 et la note de la séance 6 demandent en revanche de quoi travailler à plusieurs, en salle informatique ou sur les portables des élèves.",
    },
    {
      question: "Peut-on changer de secteur d'entreprise ?",
      reponse:
        "Oui, tous les secteurs se jouent avec le même déroulé. NOVA est recommandé parce qu'il porte un stock, un coût de production et des délais de règlement, les trois matières de la première année. Un secteur sans stock, comme la restauration ou l'hôtellerie, retire à la séance 4 son objet.",
    },
  ],
  prolongements: [
    "Rejouer le même atelier sur LA TABLE D'AUGUSTIN, où rien ne se stocke : les élèves découvrent que la moitié de leurs réflexes venaient du stock et pas de la gestion.",
    "En seconde année, passer NOVA en gamme avec le niveau Arbitrage : trois références, un seuil qui dépend du mix, le bilan fonctionnel et le financement du poste clients par le calcul.",
    "Prolonger la séance 5 vers le calcul et le décaissement de l'impôt sur les sociétés, modulable dans les paramètres économiques de la partie.",
    "Monter un concours entre classes à partir de la même partie, avec groupes tirés au sort et décisions verrouillées.",
  ],
};
