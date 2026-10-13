import type { Guide } from "./types";

/**
 * LE GUIDE DU RÉFÉRENT D'ÉTABLISSEMENT OU INFORMATIQUE.
 *
 * Le seul des quatre qui parle technique, et qui l'explique : LTI 1.3, inscription
 * dynamique, fédération d'identité. Il ne recopie pas /integration, qui garde les
 * adresses lues du code (lti/constantes.ts, saml/constantes.ts) : il y renvoie.
 */
export const GUIDE_ETABLISSEMENT: Guide = {
  public: "etablissement",
  nomDuPublic: "Référent établissement",
  titre: "Guide du référent établissement",
  surtitre: "Guide de prise en main",
  chapeau:
    "Pour la direction, le référent numérique ou le service informatique : ce que la licence ouvre, comment rattacher les enseignants, ajouter la simulation à Moodle ou Canvas, se connecter par RENATER, et ce que deviennent les données.",
  description:
    "Le guide du référent établissement et informatique : licence, comptes enseignants, ajout à Moodle et Canvas par LTI 1.3 pas à pas, connexion RENATER, données personnelles et RGPD.",
  pourQui:
    "Vous déployez Business Arena dans un établissement : direction, référent numérique, administrateur Moodle ou délégué à la protection des données.",
  resultat:
    "Vous savez rattacher vos enseignants à la licence, ajouter l'outil à votre plateforme de cours, et répondre aux questions sur les données.",
  version: "2026-10-12",
  enCinqMinutes: [
    "Connectez-vous à l'espace enseignant avec le compte administrateur de votre établissement, puis ouvrez « Mon établissement ».",
    "Vérifiez la licence : son offre, ses dates et le nombre d'enseignants rattachés.",
    "Cliquez sur « + générer un code enseignant » et envoyez ce code à vos collègues : ils le saisissent en créant leur compte.",
    "Pour Moodle, demandez votre adresse d'inscription et collez-la dans la gestion des outils externes.",
  ],
  etapes: [
    {
      id: "licence",
      titre: "Lire la licence et ce qu'elle ouvre",
      faire: [
        "Ouvrez « Mon établissement » depuis l'espace enseignant. Ce lien n'apparaît que pour l'administrateur de l'établissement.",
        "Le bloc « Licence » dit l'offre, ses dates, les jours restants et le nombre d'enseignants rattachés.",
        "Les parties de classe sont ouvertes par les offres {{offresArene}} ; les cohortes d'épisodes manager par les offres {{offresEpisodes}} ; l'examen individuel par les offres {{offresExamen}}.",
      ],
      voir: "Une licence qui arrive à échéance le dit en tête. Les classes en cours vont jusqu'au bout ; c'est l'ouverture de nouvelles parties qui s'arrête à la date de fin.",
      erreur:
        "Chercher la licence dans le compte d'un enseignant. Elle appartient à l'établissement : un enseignant la voit seulement en une ligne, en tête de ses parties.",
      capture: {
        fichier: "licence",
        largeur: 1280,
        hauteur: 800,
        alt: "La page d'administration de l'établissement : la licence, ses dates, et les compteurs d'enseignants, d'élèves, de parties et de concours.",
        reperes: [
          { cible: "text=Licence · >> nth=0", legende: "L'offre souscrite, et ses dates." },
          { cible: "text=Inviter des enseignants", legende: "Les codes pour rattacher les enseignants." },
        ],
      },
      lien: { href: "/tarifs", libelle: "Voir les offres" },
    },
    {
      id: "enseignants",
      titre: "Rattacher les comptes enseignants",
      faire: [
        "Dans « Inviter des enseignants », cliquez sur « + générer un code enseignant ».",
        "Envoyez ce code à vos collègues. En créant leur compte, ils le saisissent dans le champ du code d'invitation : leur compte rejoint l'établissement et sa licence.",
        "Le tableau de l'équipe pédagogique liste les enseignants rattachés. Un code se désactive d'un clic sur sa croix.",
      ],
      voir: "Chaque enseignant rattaché compte dans le nombre couvert par la licence.",
      erreur:
        "Laisser un enseignant s'inscrire sans le code : il crée alors un établissement à part, sans licence. Il suffit de lui envoyer le code avant son inscription.",
      capture: {
        fichier: "enseignants",
        largeur: 1280,
        hauteur: 800,
        alt: "Le bloc Inviter des enseignants : un code actif, le bouton pour en générer un autre, et l'équipe pédagogique.",
        reperes: [
          { cible: "role=button[name='+ générer un code enseignant']", legende: "Un nouveau code d'invitation." },
          { cible: "text=Équipe pédagogique", legende: "Les enseignants rattachés." },
        ],
      },
    },
    {
      id: "moodle-court",
      titre: "Moodle : la voie courte, par inscription dynamique",
      faire: [
        "LTI 1.3 est la norme qui permet à une plateforme de cours d'ouvrir un outil externe en lui disant qui clique, sans mot de passe de plus. L'inscription dynamique fait l'échange des clés en une seule adresse.",
        "Demandez votre adresse d'inscription : elle est propre à votre établissement et ne sert qu'une fois.",
        "Dans Moodle : Administration du site, Plugins, Modules d'activité, Outil externe, Gérer les outils. Collez l'adresse dans « URL de l'outil », puis « Ajouter LTI Advantage ».",
        "Vérifiez le nom de votre établissement et confirmez. L'outil apparaît en attente : activez-le, puis réglez le conteneur de lancement par défaut sur « Nouvelle fenêtre ».",
      ],
      voir: "Business Arena apparaît dans la liste des outils externes du site, prêt à être ajouté dans un cours.",
      erreur:
        "Garder l'ouverture dans la page du cours. Pour sa sécurité, le site refuse de s'afficher dans une autre page : réglé autrement qu'en nouvelle fenêtre, l'outil montre un bouton pour s'ouvrir à côté.",
      capture: {
        fichier: "moodle-court",
        largeur: 1280,
        hauteur: 800,
        alt: "La page Intégration du site : la voie courte par inscription dynamique, pas à pas.",
        reperes: [{ cible: "#dynamique", legende: "Les gestes dans Moodle, dans l'ordre." }],
      },
      lien: { href: "/integration", libelle: "La page d'intégration, avec les adresses" },
    },
    {
      id: "moodle-manuel",
      titre: "Moodle, Canvas et les autres : la voie manuelle",
      faire: [
        "Si votre plateforme ne connaît pas l'inscription dynamique, créez l'outil à la main en version LTI 1.3, avec une clé publique donnée par adresse de jeu de clés.",
        "Recopiez les adresses de la page d'intégration : adresse de l'outil, connexion, redirection, sélection de contenu et jeu de clés publiques.",
        "Renvoyez-nous ce que votre plateforme affiche : l'identifiant de la plateforme, le client_id, le deployment_id et ses trois adresses. Nous les rattachons à votre établissement.",
      ],
      voir: "Les mêmes écrans pour l'enseignant et l'élève que par la voie courte.",
      erreur:
        "Recopier une adresse à la main. Copiez-les depuis la page d'intégration : elles sont lues du code de l'outil et ne peuvent pas différer de celles qu'il sert.",
      capture: {
        fichier: "moodle-manuel",
        largeur: 1280,
        hauteur: 800,
        alt: "La page Intégration : les adresses de l'outil à recopier dans la plateforme de cours.",
        reperes: [{ cible: "#manuelle", legende: "Les adresses à recopier." }],
      },
      lien: { href: "/integration#manuelle", libelle: "Les adresses de l'outil" },
    },
    {
      id: "moodle-activite",
      titre: "Ce que voient l'enseignant et l'élève dans le cours",
      faire: [
        "L'enseignant ajoute une activité « Outil externe » dans son cours et choisit Business Arena.",
        "À la première ouverture, l'écran « Que doit ouvrir cette activité ? » lui propose une de ses parties, une nouvelle partie, une cohorte d'épisodes ou un examen, selon la licence.",
        "Ensuite, l'activité le mène directement au pilotage. L'élève, lui, clique et arrive dans sa partie, réparti dans une équipe, sans compte ni code.",
      ],
      voir: "Le prénom envoyé par la plateforme sert de pseudo à l'élève ; s'il n'est pas envoyé, l'élève en choisit un à son arrivée.",
      erreur:
        "Ouvrir l'activité en élève avant que l'enseignant l'ait configurée : l'élève lit alors que son enseignant n'a pas encore choisi la partie. Il revient plus tard.",
      capture: {
        fichier: "moodle-activite",
        largeur: 1280,
        hauteur: 800,
        alt: "L'écran de première ouverture d'une activité, côté enseignant : choisir ce que l'activité ouvre.",
        reperes: [{ cible: "text=Que doit ouvrir cette activité ?", legende: "Le choix, fait une seule fois par activité." }],
      },
    },
    {
      id: "notes",
      titre: "Les notes dans le carnet de Moodle",
      faire: [
        "Dans la configuration de l'outil Business Arena, sous « Services IMS LTI Assignment and Grade », choisissez « Utiliser ce service pour la synchronisation des notes et la gestion des colonnes ». C'est le service de notes de LTI Advantage ; sans lui, rien ne change, et les notes se recopient à la main.",
        "L'enseignant qui ouvre l'activité lit alors que Moodle accepte les notes. Il crée son examen et relie l'activité avec « Relier l'activité à cet examen ».",
        "À la publication des résultats, pas avant, la note de chaque candidat venu du cours part dans le carnet, dans une colonne nommée « Business Arena · » suivi du nom de l'examen. Retirer la publication la remet en attente.",
        "Une partie de classe n'envoie aucune note, seulement sa progression : elle se joue en équipe, et la note reste celle de l'enseignant.",
      ],
      voir: "Sur la page de l'examen, l'encart du carnet de notes de la plateforme dit combien de notes sont parties, l'erreur éventuelle de la plateforme, et propose « Renvoyer les notes ».",
      erreur:
        "Attendre les notes dans Moodle avant la publication. Elles ne partent qu'au moment où l'enseignant publie les résultats, et seulement pour les candidats venus du cours.",
      capture: {
        fichier: "notes",
        largeur: 1280,
        hauteur: 800,
        alt: "La page d'un examen relié à Moodle : l'encart du carnet de notes, qui dit que les notes sont envoyées, et le bouton Renvoyer les notes.",
        reperes: [
          { cible: "[data-resume-du-retour]", legende: "Combien de notes sont parties dans le carnet." },
          { cible: "role=button[name='Renvoyer les notes']", legende: "Le renvoi, après une erreur de la plateforme." },
        ],
      },
      lien: { href: "/integration#notes", libelle: "Le retour des notes, dans la page d'intégration" },
    },
    {
      id: "renater",
      titre: "Se connecter avec l'établissement (RENATER)",
      faire: [
        "Pour les universités, écoles et organismes de la Fédération Éducation-Recherche : la fédération d'identité permet de se connecter avec ses identifiants habituels de l'établissement.",
        "Sur la page de connexion des enseignants, sur l'entrée par code et sur l'invitation d'une cohorte, le bouton « Se connecter avec mon établissement » mène au service de découverte de RENATER.",
        "L'enseignant d'un établissement client arrive dans son espace, rattaché à la licence. L'étudiant retrouve ses parties sur n'importe quel appareil, sans code de reprise.",
        "Pour votre service informatique, la page d'intégration donne l'identifiant du fournisseur de services, ses métadonnées et son adresse de retour.",
      ],
      voir: "Le compte d'un enseignant se crée à sa première connexion.",
      erreur:
        "Attendre un nom ou un e-mail d'étudiant. L'identifiant reçu est pseudonyme et propre à Business Arena : aucun nom ni e-mail d'étudiant n'est conservé.",
      capture: {
        fichier: "renater",
        largeur: 1280,
        hauteur: 800,
        alt: "La page Intégration, section RENATER : qui peut se connecter, ce que la connexion ouvre et les données reçues.",
        reperes: [{ cible: "#renater", legende: "La connexion par la fédération, et ce qui transite." }],
      },
      lien: { href: "/integration#renater", libelle: "Le détail technique de la connexion" },
      sautDePage: true,
    },
    {
      id: "donnees",
      titre: "Les données personnelles et le RGPD",
      faire: [
        "Côté élève, la plateforme garde un pseudo librement choisi et un identifiant technique aléatoire. Aucun compte, aucun e-mail, aucun nom de famille.",
        "Par la plateforme de cours, elle reçoit un identifiant dont elle ne garde qu'une empreinte chiffrée, le prénom s'il est envoyé, le rôle et le titre du cours. Quand la plateforme accorde le retour des notes, l'identifiant d'un élève est gardé chiffré : c'est l'adresse de sa note dans le carnet.",
        "Pour l'évaluation entre coéquipiers d'une partie de classe, les notes données et les commentaires ne sont lus que par l'enseignant ; chaque élève ne reçoit que ses moyennes, sans le nom de qui a noté.",
        "Côté enseignant, le nom, l'e-mail et l'établissement servent au compte.",
        "La finalité et la durée de conservation de chaque donnée sont écrites dans les mentions légales : c'est la page à transmettre à votre délégué à la protection des données.",
      ],
      voir: "Un tableau par catégorie de personnes : les données, leur finalité et leur durée.",
      erreur:
        "Faire saisir aux élèves leur nom complet comme pseudo. Un prénom, ou un prénom d'emprunt, suffit à jouer.",
      capture: {
        fichier: "donnees",
        largeur: 1280,
        hauteur: 800,
        alt: "Les mentions légales, section Données personnelles : le tableau des données, de leur finalité et de leur durée.",
        reperes: [{ cible: "text=Données personnelles (RGPD)", legende: "Le tableau des données conservées." }],
      },
      lien: { href: "/mentions-legales", libelle: "Lire les mentions légales" },
    },
  ],
  plusLoin: [
    {
      titre: "L'intégration en détail",
      texte: "Les adresses de l'outil, la sélection de contenu, la nouvelle fenêtre et les données qui transitent.",
      lien: { href: "/integration", libelle: "Ouvrir la page d'intégration" },
    },
    {
      titre: "Pour les écoles et les universités",
      texte: "L'arène, les épisodes manager et les compétences mesurées, à montrer à un jury d'accréditation.",
      lien: { href: "/ecoles", libelle: "Écoles de commerce et universités" },
    },
    {
      titre: "Préparer le déploiement",
      texte: "Un rendez-vous pour parler de votre établissement, de vos classes et de votre plateforme de cours.",
      lien: { href: "/rendez-vous", libelle: "Prendre rendez-vous" },
    },
  ],
  faq: [
    {
      question: "Un enseignant a perdu le code d'invitation.",
      reponse: "Générez-en un autre dans « Mon établissement ». Les enseignants déjà rattachés ne sont pas touchés.",
    },
    {
      question: "Notre licence couvre combien d'enseignants ?",
      reponse:
        "Le bloc de la licence dit le nombre d'enseignants rattachés et le plafond couvert, s'il y en a un.",
    },
    {
      question: "Que se passe-t-il à la fin de la licence ?",
      reponse:
        "Les parties en cours vont jusqu'au bout. Ce qui s'arrête, c'est la création de nouvelles parties, cohortes et examens.",
      lien: { href: "/tarifs", libelle: "Voir les offres" },
    },
    {
      question: "Pourquoi un enseignant voit-il des niveaux fermés ?",
      reponse:
        "Une offre peut ne couvrir qu'une entreprise ou qu'un niveau. Ce qu'elle ne couvre pas reste visible, marqué du nom de l'offre qui l'ouvre.",
    },
    {
      question: "Les notes ne sont pas arrivées dans Moodle.",
      reponse:
        "Vérifiez que le service de notes est activé dans la configuration de l'outil, que l'examen est relié à l'activité, et que l'enseignant a publié les résultats. L'encart de la page de l'examen dit l'erreur, s'il y en a une, et « Renvoyer les notes » les renvoie.",
      lien: { href: "/integration#notes", libelle: "Le retour des notes" },
    },
    {
      question: "Les élèves doivent-ils donner une adresse e-mail ?",
      reponse: "Non, jamais. Un code et un pseudo suffisent, ou un clic depuis la plateforme de cours.",
      lien: { href: "/mentions-legales", libelle: "Lire les mentions légales" },
    },
  ],
  aVenir: [],
};
