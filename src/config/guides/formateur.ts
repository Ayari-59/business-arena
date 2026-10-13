import type { Guide } from "./types";

/**
 * LE GUIDE DU FORMATEUR EN ENTREPRISE : les épisodes manager.
 *
 * Un épisode est un trimestre dans la peau d'un manager, joué seul, sans compte. Le
 * formateur choisit les épisodes, les fait jouer en cohorte, suit la promotion dans la
 * vue de l'animateur et débriefe sur le bilan, qui sépare la qualité des décisions du
 * hasard. Le profil décisionnel prolonge la formation au-delà de la séance.
 */
export const GUIDE_FORMATEUR: Guide = {
  public: "formateur",
  nomDuPublic: "Formateur en entreprise",
  titre: "Guide du formateur",
  surtitre: "Guide de prise en main",
  chapeau:
    "Faire jouer des épisodes manager à un groupe en formation : choisir les épisodes par thème et par métier, régler le niveau, ouvrir une cohorte, suivre la promotion et débriefer sur la qualité des décisions.",
  description:
    "Le guide du formateur en entreprise : les épisodes manager, le catalogue par thème et par métier, les niveaux, la cohorte, la vue de l'animateur, le bilan qui sépare décision et hasard, le profil décisionnel et l'objectif choisi.",
  pourQui:
    "Vous formez des managers, en entreprise ou en organisme de formation, et vous cherchez des cas qui se jouent plutôt qu'ils ne se lisent.",
  resultat:
    "Vous savez choisir les épisodes d'une séance, ouvrir une cohorte, suivre qui a joué, et débriefer à partir du bilan et du profil.",
  version: "2026-10-12",
  enCinqMinutes: [
    "Ouvrez « Épisodes manager » et jouez vous-même un épisode : « Commencer l'épisode ».",
    "Dans l'espace enseignant, ouvrez « Mes cohortes », nommez la cohorte, cochez les épisodes et cliquez sur « Créer la cohorte ».",
    "Envoyez le lien avec « Copier le lien », ou projetez le code avec « Projeter le code ».",
    "Pendant la séance, suivez la promotion dans la « Vue de l'animateur ».",
  ],
  etapes: [
    {
      id: "catalogue",
      titre: "Parcourir le catalogue des épisodes",
      faire: [
        "Ouvrez « Épisodes manager ». Le catalogue compte {{nombreDEpisodes}} épisodes, rangés par métier : {{metiersDesEpisodes}}.",
        "Dans un métier, les épisodes sont rangés par thème : vendre, piloter les chiffres, manager une équipe, conduire le changement, et d'autres.",
        "Chaque carte dit la situation du manager et ce qu'elle travaille. Choisissez le métier le plus proche de celui de vos participants.",
      ],
      voir: "Les épisodes que votre licence ouvre se lancent ; les épisodes de démonstration se jouent sans licence.",
      erreur:
        "Choisir un épisode pour son titre. Lisez la fiche de l'épisode : elle dit la compétence travaillée et le déroulé de la séance.",
      capture: {
        fichier: "catalogue",
        largeur: 1280,
        hauteur: 800,
        alt: "Le catalogue des épisodes manager : les métiers, et les thèmes du premier métier avec leur nombre d'épisodes.",
        reperes: [{ cible: "text=Mon profil décisionnel >> nth=0", legende: "Le profil, construit à mesure des épisodes joués." }],
      },
      lien: { href: "/enseignants/episodes", libelle: "Les fiches des épisodes en classe" },
    },
    {
      id: "episode",
      titre: "Lire un épisode et choisir son niveau",
      faire: [
        "Ouvrez un épisode : le tableau de bord du manager, la situation et le mandat du trimestre s'affichent avant de commencer.",
        "Choisissez le niveau : {{niveauxDesEpisodes}}. Le niveau change ce que le participant sait et voit, pas le trimestre : le bilan juge les décisions de la même façon.",
        "Cliquez sur « Commencer l'épisode ».",
      ],
      voir: "Une suite de décisions dans le trimestre, avec des sources à consulter avant de trancher, et des chiffres qui bougent avec chaque choix.",
      erreur:
        "Mettre un groupe de débutants au niveau le plus difficile. Le premier niveau donne des repères de méthode et l'effet de chaque choix tout de suite.",
      capture: {
        fichier: "episode",
        largeur: 1280,
        hauteur: 800,
        alt: "La page d'un épisode avant de commencer : le tableau de bord, la situation, le mandat du trimestre et le choix du niveau.",
        reperes: [
          { cible: "text=Votre mandat pour le trimestre", legende: "Ce sur quoi le manager sera jugé." },
          { cible: "role=button[name=\"Commencer l'épisode\"]", legende: "Le départ, après le choix du niveau." },
        ],
      },
    },
    {
      id: "cohorte",
      titre: "Ouvrir une cohorte pour votre groupe",
      faire: [
        "Dans l'espace enseignant, ouvrez « Mes cohortes ». Les cohortes sont ouvertes par les offres {{offresEpisodes}}.",
        "Donnez un nom à la cohorte, puis cochez les épisodes du groupe, métier par métier.",
        "Cliquez sur « Créer la cohorte ».",
      ],
      voir: "La cohorte reçoit un code et un lien. Les participants ouvrent les épisodes cochés à tous les niveaux ; les autres leur restent fermés.",
      erreur:
        "Ne cocher aucun épisode : la création est refusée avec le message « Cochez au moins un épisode. ».",
      capture: {
        fichier: "cohorte",
        largeur: 1280,
        hauteur: 800,
        alt: "Le formulaire Nouvelle cohorte : le nom de la cohorte et les épisodes à cocher, rangés par métier.",
        reperes: [
          { cible: "#nouvelle-cohorte input[type=text], #nouvelle-cohorte input:not([type]) >> nth=0", legende: "Le nom de la cohorte." },
          { cible: "legend:has-text('Les épisodes')", legende: "Les épisodes du groupe, rangés par métier." },
        ],
      },
    },
    {
      id: "diffuser",
      titre: "Diffuser le code et faire rejoindre",
      faire: [
        "Sur la page de la cohorte, envoyez le lien avec « Copier le lien », ou ouvrez « Projeter le code » sur l'écran de la salle.",
        "Les participants ouvrent le lien, ou tapent le code sur la page « Rejoindre une cohorte », puis cliquent sur « Rejoindre la cohorte ».",
        "Ils arrivent sur la liste de leurs épisodes et commencent quand vous le dites.",
      ],
      voir: "Sans compte ni e-mail : la cohorte reconnaît l'appareil du participant.",
      erreur:
        "Laisser la cohorte ouverte après la session. Fermez-la avec « Clore la cohorte » : un retardataire lit alors qu'elle est close.",
      capture: {
        fichier: "diffuser",
        largeur: 1280,
        hauteur: 800,
        alt: "La page d'une cohorte : son code, son lien à copier, le code à projeter et les épisodes choisis.",
        reperes: [
          { cible: "#code-de-la-cohorte", legende: "Le code de la cohorte." },
          { cible: "role=link[name='Projeter le code']", legende: "Le code en grand, pour la salle." },
        ],
      },
    },
    {
      id: "animation",
      titre: "Suivre la promotion dans la vue de l'animateur",
      faire: [
        "Depuis « Mes cohortes », ouvrez la « Vue de l'animateur » de la cohorte.",
        "Lisez combien de membres ont rejoint, et combien ont joué au moins un épisode.",
        "Quand le groupe est assez nombreux, la vue montre l'avancement, les compétences du groupe et la répartition des choix.",
      ],
      voir: "Une vue de groupe : ni nom, ni profil individuel, et aucun chiffre tant que le groupe est trop petit pour que personne ne soit reconnaissable.",
      erreur:
        "Attendre des scores après un seul épisode. Un score se confirme sur plusieurs épisodes ; avant, la vue montre les observations.",
      capture: {
        fichier: "animation",
        largeur: 1280,
        hauteur: 800,
        alt: "La vue de l'animateur d'une cohorte : les membres, les épisodes qui comptent et les compétences du groupe.",
        reperes: [
          { cible: "text=/membres, dont/ >> nth=0", legende: "Qui a rejoint, et qui a joué." },
          { cible: "text=Avancement >> nth=0", legende: "L'avancement du groupe, épisode par épisode." },
        ],
      },
      sautDePage: true,
    },
    {
      id: "bilan",
      titre: "Débriefer sur le bilan de l'épisode",
      faire: [
        "À la fin de l'épisode, le bilan donne le résultat du trimestre, puis ce que le hasard y a pris ou donné.",
        "Le bilan rejoue chaque décision sous les mêmes tirages au hasard : il sépare la qualité des décisions de la chance du trimestre.",
        "Lancez la discussion sur « Vos choix tenaient-ils ? » et sur « D'autres manières de décider » : ce que la stratégie de référence aurait fait, au même hasard.",
      ],
      voir: "Les objectifs atteints ou manqués, le trimestre semaine par semaine, et un axe de travail pour le participant.",
      erreur:
        "Féliciter le meilleur résultat. Un bon trimestre peut venir du hasard : c'est la robustesse des choix qu'il faut discuter.",
      capture: {
        fichier: "bilan",
        largeur: 1280,
        hauteur: 800,
        alt: "Le bilan d'un épisode : le résultat du trimestre, la part du hasard et les objectifs atteints ou manqués.",
        reperes: [{ cible: "text=Bilan de l'épisode >> nth=0", legende: "Le résultat, et ce que le hasard y a pris." }],
      },
    },
    {
      id: "profil",
      titre: "Le profil décisionnel et l'objectif choisi",
      faire: [
        "Après quelques épisodes, chaque participant ouvre « Mon profil décisionnel » : ses compétences de décision, les observations qui les fondent et ses décisions.",
        "Dans « La compétence que je travaille », il choisit son objectif, puis « Choisir » : les épisodes proposés ensuite visent cette compétence.",
        "Il peut aussi « Laisser mon profil choisir », ou tout effacer depuis la même page.",
      ],
      voir: "Un profil qui décrit des décisions prises dans des situations simulées. Il ne mesure ni la personnalité, ni le potentiel, ni la performance au poste.",
      erreur:
        "Présenter le profil comme une évaluation du participant. C'est un outil de progression, qui lui appartient : il reste sur son appareil.",
      capture: {
        fichier: "profil",
        largeur: 1280,
        hauteur: 800,
        alt: "Le profil décisionnel : les compétences de décision, leurs observations et la compétence choisie comme objectif.",
        reperes: [
          { cible: "role=combobox[name='La compétence que je travaille']", legende: "L'objectif choisi : la compétence que le participant travaille." },
          { cible: "text=Niveau conseillé >> nth=0", legende: "Le niveau conseillé, et les épisodes proposés ensuite." },
        ],
      },
    },
  ],
  plusLoin: [
    {
      titre: "Les épisodes en séance",
      texte: "Chaque épisode a sa fiche pour l'animateur : la compétence, le déroulé et les questions du débrief.",
      lien: { href: "/enseignants/episodes", libelle: "Épisodes en classe" },
    },
    {
      titre: "Pour les entreprises",
      texte: "Les entreprises jouables de l'arène, si vous voulez prolonger la formation par une simulation en équipe.",
      lien: { href: "/entreprises", libelle: "Voir les entreprises" },
    },
    {
      titre: "Une offre pour votre organisme",
      texte: "Les épisodes manager se proposent sur devis, pour une entreprise ou un organisme de formation.",
      lien: { href: "/tarifs", libelle: "Voir les offres" },
    },
  ],
  faq: [
    {
      question: "Un participant a perdu le lien de la cohorte.",
      reponse: "Il tape le code de la cohorte sur la page « Rejoindre une cohorte ». Le code reste lisible sur la page de la cohorte.",
    },
    {
      question: "Un participant arrive en retard.",
      reponse: "Tant que la cohorte n'est pas close, il la rejoint avec le même lien et joue les mêmes épisodes.",
    },
    {
      question: "Faut-il une licence ?",
      reponse:
        "Les épisodes de démonstration se jouent sans licence. Les autres, et les cohortes, sont ouverts par les offres {{offresEpisodes}}.",
      lien: { href: "/tarifs", libelle: "Voir les offres" },
    },
    {
      question: "Pourquoi un épisode est-il fermé ?",
      reponse:
        "Dans une cohorte, seuls les épisodes cochés par le formateur s'ouvrent. Hors cohorte et sans licence, seuls les épisodes de démonstration se lancent.",
    },
    {
      question: "Que garde-t-on des participants ?",
      reponse:
        "Les choix faits dans les épisodes, sur l'appareil, sans le nom ni aucun texte saisi. Le participant peut les effacer depuis son profil.",
      lien: { href: "/mentions-legales", libelle: "Lire les mentions légales" },
    },
  ],
  aVenir: [],
};
