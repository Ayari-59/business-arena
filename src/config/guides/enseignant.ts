import type { Guide } from "./types";

/**
 * LE GUIDE DE L'ENSEIGNANT : de la création du compte au rapport d'accréditation.
 *
 * L'ordre est celui d'une année réelle : un compte, une partie de classe, une séance
 * (le code, les tours, la révélation, la Gazette, le débrief), puis ce qui vient
 * ensuite (les cohortes, l'examen, le carnet d'usage). Les captures viennent de
 * scripts/captures-des-guides.mts, sur une base neuve et des données de démonstration.
 */
export const GUIDE_ENSEIGNANT: Guide = {
  public: "enseignant",
  nomDuPublic: "Enseignant",
  titre: "Guide de l'enseignant",
  surtitre: "Guide de prise en main",
  chapeau:
    "Créer votre compte, lancer une partie de classe, animer chaque tour devant vos élèves, puis aller jusqu'à l'examen individuel et au rapport d'accréditation. Chaque étape montre l'écran réel.",
  description:
    "Le guide de prise en main de l'enseignant : compte, partie de classe, code d'invitation, animation tour par tour, révélation en projection, Gazette, débrief, cohortes, examen individuel et carnet d'usage, avec les écrans réels.",
  pourQui: "Vous enseignez la gestion, l'économie ou le management, et vous voulez faire jouer une classe.",
  resultat:
    "Vous savez créer une partie, la faire rejoindre, animer un tour jusqu'à la révélation, et faire passer un examen individuel.",
  version: "2026-10-12",
  enCinqMinutes: [
    "Ouvrez l'espace enseignant et créez votre compte avec « Créer un compte ».",
    "Dans « Mes parties », cliquez sur « Nouvelle partie », gardez les réglages proposés et validez avec « Créer la partie et obtenir le code d'invitation ».",
    "Écrivez le code au tableau, ou ouvrez « Projeter pour la classe » : vos élèves le tapent sur la page « Rejoindre une partie ».",
    "Quand les équipes ont validé, cliquez sur le bouton qui clôt le tour, puis sur « Clore et simuler » : les résultats arrivent chez chaque équipe.",
  ],
  etapes: [
    {
      id: "compte",
      titre: "Créer votre compte enseignant",
      faire: [
        "Ouvrez « Espace enseignant » en haut à droite du site, puis « Créer un compte ».",
        "Donnez votre nom, votre e-mail et un mot de passe.",
        "Si votre établissement vous a donné un code d'invitation, saisissez-le : votre compte rejoint l'établissement et sa licence. Sinon, écrivez le nom de votre établissement.",
        "Validez avec « Créer mon compte enseignant ».",
      ],
      voir: "Vous arrivez sur « Mes parties », votre page d'accueil. La ligne du haut dit l'offre de votre établissement et sa date de fin.",
      erreur:
        "Créer son compte sans le code d'invitation de l'établissement : le compte n'est alors rattaché à aucune licence. Demandez le code à votre référent avant de vous inscrire.",
      capture: {
        fichier: "compte",
        largeur: 1280,
        hauteur: 800,
        alt: "La page Espace enseignant, formulaire de création de compte ouvert : nom, code d'invitation, établissement, e-mail et mot de passe.",
        reperes: [
          { cible: 'input[name="inviteCode"]', legende: "Le code d'invitation de votre établissement, s'il vous en a donné un." },
          { cible: 'role=button[name="Créer mon compte enseignant"]', legende: "Le bouton qui crée le compte." },
        ],
      },
    },
    {
      id: "nouvelle-partie",
      titre: "Créer une partie de classe",
      faire: [
        "Dans « Mes parties », cliquez sur « Nouvelle partie ».",
        "Choisissez l'entreprise que joueront vos élèves : chaque secteur enseigne quelque chose de propre, dit sous la liste.",
        "Réglez le nombre d'équipes d'élèves, puis le nombre de concurrents pilotés par l'ordinateur.",
      ],
      voir: "Le formulaire « Nouvelle partie de classe » s'ouvre sous le bouton. Une entreprise ou un niveau que votre licence ne couvre pas est marqué du nom de l'offre qui l'ouvre.",
      erreur:
        "Prévoir une équipe par élève. Une équipe de quelques élèves discute ses choix, et c'est cette discussion qui fait apprendre.",
      capture: {
        fichier: "nouvelle-partie",
        largeur: 1280,
        hauteur: 800,
        alt: "Le formulaire Nouvelle partie de classe : la liste des entreprises jouables, le nombre d'équipes et de concurrents.",
        reperes: [
          { cible: 'select[name="scenarioCode"]', legende: "L'entreprise que joue la classe." },
          { cible: 'select[name="humanTeamsCount"]', legende: "Le nombre d'équipes d'élèves." },
          { cible: 'select[name="botCount"]', legende: "Les concurrents pilotés par l'ordinateur." },
        ],
      },
    },
    {
      id: "reglages",
      titre: "Régler le niveau, la durée et les questions",
      faire: [
        "Choisissez la périodicité : un mois, un trimestre ou une année par tour.",
        "Dans « Tours joués », raccourcissez la partie pour qu'elle tienne dans vos séances.",
        "Choisissez le niveau de difficulté, de {{premierNiveau}} à {{dernierNiveau}} : il règle les décisions ouvertes aux élèves, le plafond d'indices et la fréquence des événements.",
        "Laissez cochée l'option « Monde variable » pour que chaque partie diffère, ou décochez-la pour rejouer le scénario de vos supports imprimés.",
        "Dans « Tour d'essai », laissez « Aucun » ou choisissez un ou deux tours pour de faux avant la vraie partie : les équipes s'entraînent, rien ne compte, la partie repart ensuite de zéro.",
        "Cochez « Évaluation entre coéquipiers · à la fin de la partie » si vous voulez que chaque élève note la contribution de ses coéquipiers en fin de partie.",
        "Validez avec « Créer la partie et obtenir le code d'invitation ».",
      ],
      voir: "La page de pilotage de la partie s'ouvre : en tête, le niveau et le monde choisis, puis le tour en cours et le code d'invitation.",
      erreur:
        "Commencer trop haut. Un premier niveau bien joué vaut mieux qu'un niveau élevé subi : la page Jouer montre, niveau par niveau, ce que chacun ouvre.",
      capture: {
        fichier: "reglages",
        largeur: 1280,
        hauteur: 800,
        alt: "La suite du formulaire : périodicité, tours joués, niveau de difficulté et monde variable.",
        reperes: [
          { cible: 'select[name="roundsCount"]', legende: "Le nombre de tours, pour tenir dans vos séances." },
          { cible: 'select[name="level"]', legende: "Le niveau de difficulté." },
          { cible: "text=Monde variable · chaque partie diffère", legende: "Un monde qui change d'une partie à l'autre, ou le scénario classique." },
        ],
      },
      lien: { href: "/jouer", libelle: "Comparer les niveaux sur la page Jouer" },
    },
    {
      id: "essai",
      titre: "Faire jouer un tour d'essai",
      faire: [
        "Si vous avez choisi un tour d'essai à la création, la partie s'ouvre dessus : l'ardoise dit « Tour d'essai · ne compte pas », et vos élèves lisent le même bandeau.",
        "Les équipes jouent le tour comme un vrai : elles lisent la situation, décident, envoient. Clôturez-le avec le bouton qui clôt le tour d'essai, puis « Clore et simuler ».",
        "Commentez les résultats avec la classe : c'est le moment d'expliquer ce que montre la feuille, sans enjeu.",
        "Cliquez sur « Commencer la vraie partie » et confirmez : toutes les entreprises repartent de l'état initial du scénario, au tour un.",
        "Si vous aviez coché « Commencer la vraie partie dès la fin de l'essai », ce passage se fait tout seul à la clôture de l'essai.",
      ],
      voir: "Après le passage, l'ardoise dit que la vraie partie a commencé, et « Revoir le tour d'essai » garde ses résultats sous la main. Rien de l'essai ne compte : ni le classement, ni le bilan, ni les exports, ni l'évaluation entre coéquipiers, ni les notes envoyées à Moodle.",
      erreur:
        "Laisser la classe croire que l'essai compte. Dites-le avant : les équipes qui jouent l'essai comme une répétition profitent ensuite de la vraie partie.",
      capture: {
        fichier: "essai",
        largeur: 1280,
        hauteur: 800,
        alt: "Le pilotage pendant le tour d'essai : l'ardoise qui dit que le tour ne compte pas, le bouton qui clôt l'essai et le bouton Commencer la vraie partie.",
        reperes: [
          { cible: "text=Tour d'essai · ne compte pas", legende: "L'ardoise, pendant l'essai." },
          { cible: "role=button[name=/Clore le tour d.essai/]", legende: "La clôture du tour d'essai." },
          { cible: "role=button[name='Commencer la vraie partie']", legende: "Le passage à la vraie partie, à confirmer." },
        ],
      },
    },
    {
      id: "code",
      titre: "Donner le code à la classe",
      faire: [
        "Lisez le code d'invitation en tête de la page de pilotage.",
        "Écrivez-le au tableau, ou ouvrez « Projeter pour la classe » sur le vidéoprojecteur : le code s'affiche en grand, avec son QR code.",
        "Pour un environnement numérique de travail, « Copier pour Pronote / École Directe » prépare un message prêt à coller.",
        "Les « Cartons de table » s'impriment : un carton par équipe, que les élèves scannent pour rejoindre leur table.",
      ],
      voir: "Dans le tableau des équipes, le nom de chaque élève apparaît à mesure qu'il rejoint. Les élèves sont répartis automatiquement dans l'équipe la moins remplie.",
      erreur:
        "Confondre le code de la partie et le code de reprise d'un élève. Le code de la partie sert à tous, une seule fois ; le code de reprise est personnel et sert à revenir.",
      capture: {
        fichier: "code",
        largeur: 1280,
        hauteur: 800,
        alt: "La page de pilotage : le tour en cours, le code d'invitation et le tableau des équipes.",
        reperes: [
          { cible: "#code-invitation", legende: "Le code d'invitation de la partie, et son QR code." },
          { cible: "role=button[name='Copier pour Pronote / École Directe']", legende: "Un message prêt à coller dans l'environnement numérique de travail." },
          { cible: "text=Projeter pour la classe", legende: "Le code en grand, pour le vidéoprojecteur." },
        ],
      },
    },
    {
      id: "tour",
      titre: "Animer un tour",
      faire: [
        "Laissez les équipes lire la situation, l'analyser et décider. Le tableau des équipes dit en direct qui a validé.",
        "Si vous le souhaitez, distribuez un courrier : choisissez le destinataire puis le pli, et cliquez sur « Distribuer le courrier ». Il est annoncé aux équipes et s'applique à la clôture.",
        "Quand les équipes ont validé, cliquez sur le bouton qui clôt le tour en cours, puis confirmez avec « Clore et simuler ».",
      ],
      voir: "La simulation calcule les résultats de toutes les entreprises. Le tour suivant s'ouvre, et chaque équipe trouve son verdict et son courrier.",
      erreur:
        "Attendre une équipe silencieuse. Elle ne bloque jamais la partie : à la clôture, ses dernières décisions sont reconduites, et elle le lit dans son débriefing.",
      capture: {
        fichier: "tour",
        largeur: 1280,
        hauteur: 800,
        alt: "Le pilotage pendant un tour : la confirmation de clôture, qui rappelle combien d'équipes ont validé, et le tableau des équipes.",
        reperes: [
          { cible: "text=équipes ont validé >> nth=0", legende: "Combien d'équipes ont validé leurs décisions." },
          { cible: "role=button[name='Clore et simuler']", legende: "La confirmation : le tour est simulé et les résultats publiés." },
          { cible: "text=Équipes · état des décisions", legende: "L'état des décisions, équipe par équipe." },
        ],
      },
      sautDePage: true,
    },
    {
      id: "revelation",
      titre: "Révéler le classement en projection",
      faire: [
        "Gardez la page « Projeter pour la classe » ouverte sur le vidéoprojecteur, onglet « Classement ».",
        "Après la clôture, le classement reste sous embargo : les élèves ne le voient pas encore.",
        "Au moment choisi, cliquez sur « Révéler le classement » dans votre page de pilotage. Le mur joue la révélation seul, sans que vous touchiez au second écran.",
        "Pour la revoir, utilisez « Rejouer la révélation » ; la touche Échap la passe.",
      ],
      voir: "Les équipes apparaissent une à une, avec leurs résultats, jusqu'au podium.",
      erreur:
        "Projeter la page de pilotage elle-même. Elle montre les codes de reprise et les réglages : projetez toujours la page prévue pour la classe.",
      capture: {
        fichier: "revelation",
        largeur: 1280,
        hauteur: 720,
        alt: "La projection pour la classe, onglet Classement : le podium et les résultats de chaque équipe après la révélation.",
        reperes: [
          { cible: "role=button[name=/Classement/]", legende: "L'onglet du classement, sur le vidéoprojecteur." },
          { cible: "[data-podium]", legende: "Le podium, révélé en dernier." },
          { cible: "role=button[name=/Rejouer la révélation/]", legende: "Rejouer la révélation devant la classe." },
        ],
      },
    },
    {
      id: "gazette",
      titre: "Lire et ajuster la Gazette",
      faire: [
        "Dans la rubrique « Animer », la Gazette de l'Arène montre l'article du tour en cours et l'aperçu du suivant.",
        "Vous le lisez avant vos élèves. Pour orienter la séance, choisissez « Remplacer par mon article », écrivez-le, puis « Publier mon article ».",
        "Pour un tour sans presse, choisissez « Ne pas publier ».",
      ],
      voir: "Vos élèves lisent l'article dans le courrier du tour, sans savoir qui l'a écrit.",
      erreur:
        "Annoncer dans l'article ce qui va arriver. La Gazette parle de tendances : un article qui donne la réponse retire la décision aux équipes.",
      capture: {
        fichier: "gazette",
        largeur: 1280,
        hauteur: 800,
        alt: "La Gazette de l'Arène dans le pilotage : l'article à paraître, les boutons pour le remplacer ou ne pas le publier.",
        reperes: [
          { cible: "role=button[name='Remplacer par mon article'] >> nth=0", legende: "Écrire votre propre article." },
          { cible: "role=button[name='Ne pas publier'] >> nth=0", legende: "Un tour sans presse." },
        ],
      },
    },
    {
      id: "debrief",
      titre: "Débriefer avec la classe",
      faire: [
        "Dans la rubrique « Lire », la « Vue pédagogique » montre les notions exposées, la maîtrise mesurée et les indices consommés par équipe.",
        "Le « Relevé de notes » sépare la note des situations rendues et le score de gestion. Le lien « Tableur (une ligne par élève) » l'exporte.",
        "Ouvrez « Observation de séance » pour suivre la participation tour par tour.",
        "Pour parler de mérite et de chance, faites jouer une partie solo à chacun : à la fin, son bilan rejoue ses décisions sur d'autres marchés et sépare ce qui tenait de la décision de ce qui tenait du hasard.",
      ],
      voir: "Les notions à reprendre en cours apparaissent en tête, de la plus fragile à la plus solide.",
      erreur:
        "Juger une équipe sur son seul résultat. Une bonne analyse peut mener à un mauvais trimestre : le relevé garde les deux mesures séparées pour que vous en parliez.",
      capture: {
        fichier: "debrief",
        largeur: 1280,
        hauteur: 800,
        alt: "La rubrique Lire du pilotage : le classement, la vue pédagogique avec les notions exposées et la maîtrise mesurée.",
        reperes: [
          { cible: "text=Vue pédagogique", legende: "Ce que la classe a compris, notion par notion." },
          { cible: "h2:has-text('Relevé de notes')", legende: "La note et le score de gestion, séparés." },
        ],
      },
      lien: { href: "/manuel", libelle: "Comment l'application évalue : le manuel" },
      sautDePage: true,
    },
    {
      id: "coequipiers",
      titre: "Faire évaluer les coéquipiers entre eux",
      faire: [
        "Depuis la page de pilotage, ouvrez « Évaluation entre coéquipiers ». Si vous ne l'avez pas cochée à la création, activez-la ici avec « Enregistrer les réglages ».",
        "Réglez le moment, les critères et ce que l'élève remplit en plus : une auto-évaluation, un commentaire libre que vous seul lisez.",
        "À la fin de la partie, chaque élève voit la carte « Évaluez vos coéquipiers » et note chacun d'eux, critère par critère.",
        "Relisez les réponses : le taux de réponse, le facteur de chaque élève, les signaux à regarder et les commentaires avec leur auteur.",
        "Saisissez la note de chaque équipe, puis « Enregistrer les notes d'équipe » : la note individuelle en découle par le facteur.",
        "Cliquez sur « Publier » : chaque élève voit alors ses moyennes, sans le nom de qui a noté. « Exporter (tableur) » donne le fichier pour votre logiciel de notes.",
      ],
      voir: "Un tableau par équipe : la moyenne reçue par chaque élève, son facteur et sa note individuelle. Le calcul est écrit sous les réglages, avec sa version.",
      erreur:
        "Publier avant que l'équipe ait répondu. Un élève qui n'a pas répondu reçoit les notes des autres, mais les siennes ne comptent pas : attendez le taux de réponse complet.",
      capture: {
        fichier: "coequipiers",
        largeur: 1280,
        hauteur: 800,
        alt: "La page Évaluation entre coéquipiers côté enseignant : le taux de réponse, les facteurs de chaque élève et la note d'équipe à saisir.",
        reperes: [
          { cible: "[data-taux-de-reponse]", legende: "Combien d'élèves ont répondu." },
          { cible: "[data-tableau-pairs] >> nth=0", legende: "La moyenne, le facteur et la note de chaque élève ; plus bas, les notes d'équipe et « Publier »." },
        ],
      },
      sautDePage: true,
    },
    {
      id: "cohortes",
      titre: "Faire jouer des épisodes manager en cohorte",
      faire: [
        "Ouvrez « Mes cohortes », donnez un nom à la cohorte et cochez les épisodes que vos élèves joueront.",
        "Cliquez sur « Créer la cohorte » : la cohorte reçoit un code et un lien.",
        "Donnez le lien avec « Copier le lien », ou projetez le code avec « Projeter le code ».",
        "Suivez qui a joué dans la « Vue de l'animateur ».",
      ],
      voir: "Les élèves rejoignent sans compte et ne voient que les épisodes cochés. Le compte des participants monte sur la carte de la cohorte.",
      erreur:
        "Cocher tous les épisodes. Choisissez ceux qui servent votre séance : les autres restent fermés aux élèves, qui ne se dispersent pas.",
      capture: {
        fichier: "cohortes",
        largeur: 1280,
        hauteur: 800,
        alt: "La page d'une cohorte : son code, son lien à copier et les épisodes choisis.",
        reperes: [
          { cible: "#code-de-la-cohorte", legende: "Le code de la cohorte." },
          { cible: "role=button[name='Copier le lien']", legende: "Le lien à envoyer à la classe." },
        ],
      },
      lien: { href: "/guides/formateur", libelle: "Le détail des épisodes : guide du formateur" },
    },
    {
      id: "examen-creation",
      titre: "Préparer un examen individuel",
      faire: [
        "Ouvrez « Mes examens ». L'examen individuel est inclus dans les offres {{offresExamen}}.",
        "Nommez l'examen, choisissez l'entreprise, le niveau, le nombre de tours et la durée maximale d'un tour.",
        "Fixez l'ouverture et la fermeture, et le nombre de tentatives par candidat.",
        "Choisissez le marché : le même pour tous, ou un lot de marchés d'égale difficulté pour que deux voisins ne jouent pas le même.",
        "Choisissez la grille de notation, puis « Créer l'examen ».",
      ],
      voir: "L'examen reçoit un code et un lien. La grille est copiée dans l'examen : elle ne change plus ensuite.",
      erreur:
        "Laisser le « Résultat estimé » visible quand vous voulez mesurer le calcul. Décochez-le si l'estimation fait partie de ce que vous évaluez.",
      capture: {
        fichier: "examen-creation",
        largeur: 1280,
        hauteur: 800,
        alt: "Le formulaire Nouvel examen : nom, entreprise, niveau, nombre de tours, durée, ouverture et fermeture.",
        reperes: [
          { cible: "role=textbox[name=\"Nom de l'examen\"]", legende: "Le nom de l'examen, que voient les candidats." },
          { cible: "role=combobox[name='Niveau']", legende: "Le niveau, le même pour tous les candidats." },
          { cible: 'input[name="tours"]', legende: "Le nombre de tours et la durée d'un tour." },
        ],
      },
      sautDePage: true,
    },
    {
      id: "examen-suivi",
      titre: "Suivre l'examen et publier les résultats",
      faire: [
        "Donnez le code ou le lien de l'examen. Chaque candidat le passe seul, sans compte, avec son nom et son numéro d'étudiant.",
        "Suivez les copies en direct : la page se relit d'elle-même.",
        "Quand les copies sont remises, lisez la distribution des notes et les compétences de la promotion.",
        "Cliquez sur « Publier les résultats » : chaque candidat voit alors sa note et son relevé. « Exporter (tableur) » donne le fichier pour votre logiciel de notes.",
        "Si l'examen est relié à une activité de votre cours Moodle, l'encart du carnet de notes dit combien de notes sont parties à la publication. En cas d'erreur de la plateforme, « Renvoyer les notes » les renvoie.",
      ],
      voir: "Tant que vous n'avez pas publié, chaque candidat ne voit que son reçu.",
      erreur:
        "Publier avant que toutes les copies soient notées. Attendez que chaque ligne indique sa note ; vous pouvez retirer une publication avec « Retirer la publication ».",
      capture: {
        fichier: "examen-suivi",
        largeur: 1280,
        hauteur: 800,
        alt: "La page d'un examen : les candidats, leur état, leurs compétences atteintes, et les boutons pour publier et exporter.",
        reperes: [
          { cible: "role=button[name='Publier les résultats']", legende: "La publication, qui montre les notes aux candidats." },
          { cible: "text=Exporter (tableur)", legende: "Le fichier des notes." },
        ],
      },
    },
    {
      id: "accreditation",
      titre: "Imprimer le rapport d'accréditation",
      faire: [
        "Depuis la page de l'examen, ouvrez « Rapport d'accréditation ».",
        "Imprimez-le ou enregistrez-le en PDF depuis votre navigateur.",
      ],
      voir: "Une page, sans nom d'étudiant : la grille, la moyenne par compétence et la part de la promotion au seuil.",
      erreur:
        "L'ouvrir avant la remise des copies : il ne contient rien tant qu'aucune copie n'est notée.",
      capture: {
        fichier: "accreditation",
        largeur: 1280,
        hauteur: 800,
        alt: "Le rapport d'accréditation d'un examen : la grille de notation et les compétences de la promotion.",
        reperes: [{ cible: "text=Compétence >> nth=0", legende: "Les compétences mesurées, et la part au seuil." }],
      },
    },
    {
      id: "carnet",
      titre: "Relire le carnet d'usage",
      faire: [
        "Ouvrez « Carnet d'usage » dans la navigation de votre espace.",
        "Lisez « Les situations qui résistent » : les plus difficiles pour vos classes viennent en tête.",
        "Repérez les notions les moins ancrées, toutes classes confondues : ce sont celles à reprendre en cours.",
      ],
      voir: "Les compteurs de vos parties, équipes, situations débriefées et indices ouverts.",
      erreur:
        "Lire une situation ratée par une seule classe comme un défaut de la classe. Ratée par plusieurs, c'est l'énoncé ou la séance qu'il faut revoir.",
      capture: {
        fichier: "carnet",
        largeur: 1280,
        hauteur: 800,
        alt: "Le carnet d'usage : les compteurs, et les situations qui résistent, classées de la plus difficile à la plus facile.",
        reperes: [{ cible: "text=Les situations qui résistent", legende: "Les situations les plus difficiles, en tête." }],
      },
    },
  ],
  plusLoin: [
    {
      titre: "Des séances clés en main",
      texte: "Les ateliers donnent un déroulé de plusieurs séances, avec les réglages, les livrables et une grille d'évaluation.",
      lien: { href: "/animations", libelle: "Voir les ateliers" },
    },
    {
      titre: "Comment l'application évalue",
      texte: "L'indice, les niveaux et leurs leviers, le barème des indices et les situations manquées, lus dans la configuration.",
      lien: { href: "/manuel", libelle: "Lire le manuel de l'enseignant" },
    },
    {
      titre: "Les règles du jeu et les concours",
      texte: "Le tour vu par l'élève, le courrier, le score et le championnat entre classes.",
      lien: { href: "/guide", libelle: "Lire le guide du jeu" },
    },
    {
      titre: "Les notions mobilisées",
      texte: "Chaque notion expliquée et reliée à ce que montre le tableau de bord de l'élève.",
      lien: { href: "/notions", libelle: "Ouvrir les fiches notions" },
    },
  ],
  faq: [
    {
      question: "Un élève a perdu son code de reprise.",
      reponse:
        "Ouvrez « Codes de reprise des joueurs » dans la page de pilotage : vous y lisez le code de chaque élève et pouvez le lui relire.",
    },
    {
      question: "Le tour d'essai compte-t-il quelque part ?",
      reponse:
        "Non. Ni dans le classement, ni dans le bilan, ni dans les exports, ni dans l'évaluation entre coéquipiers, ni dans les notes envoyées à Moodle. Ses résultats restent lisibles dans « Revoir le tour d'essai ».",
    },
    {
      question: "Une équipe est incomplète, ou absente.",
      reponse:
        "La partie n'est jamais bloquée : à la clôture, les dernières décisions de l'équipe sont reconduites. Un élève seul peut tenir une équipe.",
    },
    {
      question: "Un élève arrive en retard.",
      reponse:
        "Il rejoint avec le même code, tant que la partie n'est pas terminée. Il est placé dans l'équipe la moins remplie, et peut changer d'équipe jusqu'à la clôture du premier tour.",
    },
    {
      question: "Ma licence couvre-t-elle cette partie ?",
      reponse:
        "La ligne en tête de « Mes parties » dit l'offre de votre établissement et sa date de fin. Les parties de classe sont ouvertes par les offres {{offresArene}}.",
      lien: { href: "/tarifs", libelle: "Voir les offres" },
    },
    {
      question: "Pourquoi certains niveaux sont-ils fermés ?",
      reponse:
        "Un niveau que votre licence ne couvre pas reste visible dans le choix, marqué du nom de l'offre qui l'ouvre. La création est refusée tant que la licence ne le couvre pas.",
    },
    {
      question: "Mes élèves voient-ils qui les a notés ?",
      reponse:
        "Non. Une fois publiées, chacun ne reçoit que ses moyennes, critère par critère. Les commentaires et leurs auteurs ne sont lus que par vous.",
    },
    {
      question: "Quelles données de mes élèves sont gardées ?",
      reponse:
        "Un pseudo librement choisi et un identifiant technique. Aucun e-mail, aucun nom de famille, aucune date de naissance.",
      lien: { href: "/mentions-legales", libelle: "Lire les mentions légales" },
    },
  ],
  aVenir: [],
};
