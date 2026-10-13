import type { Guide } from "./types";

/**
 * LE GUIDE DE L'ÉTUDIANT : du code donné en classe au bilan de fin de partie.
 *
 * Écrit pour quelqu'un qui n'a jamais joué : rejoindre, nommer son entreprise, garder
 * son code de reprise, lire l'écran, décider en équipe, envoyer, lire ce que le marché a
 * répondu, et finir. L'examen individuel et le téléphone viennent en dernier, parce
 * qu'ils ne concernent pas tout le monde.
 */
export const GUIDE_ETUDIANT: Guide = {
  public: "etudiant",
  nomDuPublic: "Étudiant",
  titre: "Guide de l'étudiant",
  surtitre: "Guide de prise en main",
  chapeau:
    "Votre enseignant vous a donné un code. Ce guide vous mène de ce code à votre premier tour joué, puis jusqu'au bilan de la partie. Sans compte, sans e-mail.",
  description:
    "Le guide de l'étudiant : rejoindre une partie avec un code, reprendre avec son code de reprise, lire le tableau de bord et la feuille de décision, décider en équipe, lire les résultats et le courrier, le bilan, mérite ou chance, l'examen et le téléphone.",
  pourQui: "Vous êtes élève ou étudiant, et votre enseignant vous a donné un code de partie ou d'examen.",
  resultat: "Vous savez rejoindre votre équipe, prendre et envoyer vos décisions, et lire ce que le marché vous répond.",
  version: "2026-10-12",
  enCinqMinutes: [
    "Ouvrez la page « Rejoindre une partie », tapez le code donné par votre enseignant et votre prénom, puis « Rejoindre la partie ».",
    "Lisez la situation du tour, puis passez à « Décider ».",
    "Parcourez votre feuille de décision avec « Suivant », puis envoyez-la avec « Valider les décisions de l'équipe ».",
    "Attendez la clôture du tour par votre enseignant : la page se met à jour d'elle-même avec vos résultats.",
  ],
  etapes: [
    {
      id: "rejoindre",
      titre: "Rejoindre la partie avec le code",
      faire: [
        "Ouvrez la page « Rejoindre une partie », depuis le bouton en haut du site ou en scannant le QR code projeté.",
        "Tapez le code donné par votre enseignant, puis votre prénom.",
        "Cliquez sur « Rejoindre la partie ».",
      ],
      voir: "Vous arrivez dans la partie, placé automatiquement dans l'équipe la moins remplie.",
      erreur:
        "Le message « Code de partie inconnu. » : le code a été mal recopié. Relisez-le au tableau, caractère par caractère.",
      capture: {
        fichier: "rejoindre",
        largeur: 1280,
        hauteur: 800,
        alt: "La page Rejoindre une partie : le champ du code, le champ du prénom et le bouton pour entrer.",
        reperes: [
          { cible: 'input[name="code"]', legende: "Le code donné par votre enseignant." },
          { cible: 'input[name="pseudo"]', legende: "Votre prénom, ou un pseudo." },
        ],
      },
    },
    {
      id: "equipe",
      titre: "Nommer votre entreprise et retrouver votre équipe",
      faire: [
        "Dans « Nommez votre entreprise », choisissez un emblème et un nom, puis « Adopter ce nom ».",
        "Sous la feuille de décision, la composition des équipes dit qui joue avec vous. Si vos camarades sont dans une autre équipe, cliquez sur « Rejoindre » à côté de la leur.",
      ],
      voir: "Le nom de votre entreprise suit vos résultats jusqu'au classement final.",
      erreur:
        "Changer d'équipe trop tard : le nom et les équipes se figent à la clôture du premier tour.",
      capture: {
        fichier: "equipe",
        largeur: 1280,
        hauteur: 800,
        alt: "Le haut de la partie : le nom de l'entreprise à choisir, son emblème et le bouton Adopter ce nom.",
        reperes: [
          { cible: "text=Nommez votre entreprise", legende: "Le nom de votre entreprise, à choisir au premier tour." },
          { cible: "role=button[name='Adopter ce nom']", legende: "La validation du nom." },
        ],
      },
    },
    {
      id: "reprise",
      titre: "Garder votre code de reprise",
      faire: [
        "En bas de la page, dépliez « Mon code de reprise ».",
        "Notez ce code, ou photographiez son QR code : il est à vous seul.",
        "Sur un autre appareil, ouvrez la page « Reprendre ma partie », tapez le code et cliquez sur « Reprendre ma partie ».",
      ],
      voir: "Vous retrouvez votre partie au tour où vous l'avez laissée, avec tout ce que vous y avez fait.",
      erreur:
        "Montrer son code à un voisin : qui le lit peut jouer à votre place. Si c'est arrivé, prenez-en un autre avec « Prendre un autre code ».",
      capture: {
        fichier: "reprise",
        largeur: 1280,
        hauteur: 800,
        alt: "Le tiroir Mon code de reprise, déplié : le code personnel, son QR code et le bouton pour en prendre un autre.",
        reperes: [{ cible: "text=Mon code de reprise", legende: "Votre code personnel, pour changer d'appareil." }],
      },
    },
    {
      id: "cockpit",
      titre: "Lire le haut de l'écran",
      faire: [
        "En tête : votre entreprise, le tour en cours et quelques chiffres du marché, comme le prix usuel ou la demande de saison.",
        "Le tour se joue en trois temps : « Situation », puis « Analyser », puis « Décider ». Lisez la situation avant de décider.",
        "La ligne sous le titre dit combien d'équipes ont déjà rendu.",
        "Si votre enseignant a prévu un tour d'essai, un bandeau le dit : ce tour se joue comme un vrai, mais rien n'en compte, et la partie repart ensuite de zéro. Le bandeau annonce alors que la vraie partie commence.",
      ],
      voir: "Une situation d'entreprise : un problème qui se pose, pas un exercice. À vous de comprendre ce qui se joue.",
      erreur:
        "Sauter la situation pour aller droit aux chiffres. La situation dit ce que le marché prépare, et ses questions comptent dans votre note.",
      capture: {
        fichier: "cockpit",
        largeur: 1280,
        hauteur: 800,
        alt: "Le haut de la partie : l'entreprise, le tour en cours, les chiffres du marché et les trois temps du tour.",
        reperes: [
          { cible: "text=Demande de saison >> nth=0", legende: "Les chiffres du marché, avant de décider." },
          { cible: "role=tab[name=/Situation/] >> nth=0", legende: "Les trois temps du tour, dans l'ordre." },
        ],
      },
    },
    {
      id: "feuille",
      titre: "Remplir la feuille de décision en équipe",
      faire: [
        "Dans « Décider », la feuille de décision avance par rubriques, de « Vendre » à « Valider ». Leur nombre dépend du niveau de la partie.",
        "Commencez par vos ventes estimées, votre prix et votre plan de production.",
        "Le « Résultat estimé », en haut de la feuille, se met à jour à chaque changement : discutez-en en équipe avant d'aller plus loin.",
        "Passez d'une rubrique à l'autre avec « Suivant ».",
      ],
      voir: "Chaque champ est prérempli par une proposition à ajuster. Vos décisions restent modifiables jusqu'à la clôture du tour.",
      erreur:
        "Prendre la proposition pour une réponse. Elle reconduit la situation de départ : c'est à vous de l'ajuster au marché.",
      capture: {
        fichier: "feuille",
        largeur: 1280,
        hauteur: 800,
        alt: "La feuille de décision : le résultat estimé en haut, les rubriques, les ventes estimées, le prix et le plan de production.",
        reperes: [
          { cible: "text=Résultat estimé >> nth=0", legende: "Le résultat estimé, recalculé à chaque saisie." },
          { cible: "text=Votre feuille de décision", legende: "Les rubriques de la feuille, dans l'ordre." },
        ],
      },
      sautDePage: true,
    },
    {
      id: "envoyer",
      titre: "Envoyer les décisions de l'équipe",
      faire: [
        "À la dernière rubrique, relisez le récapitulatif de ce que vous engagez.",
        "Si vous le souhaitez, écrivez en une phrase ce que vous attendez de vos choix : vous y reviendrez au tour suivant, face au résultat.",
        "Cliquez sur « Valider les décisions de l'équipe ».",
        "Si un garde-fou vous signale une valeur laissée telle quelle, confirmez avec « Oui, je garde ces valeurs » ou revenez la corriger.",
      ],
      voir: "Le bandeau dit que vos décisions sont enregistrées, en attente de la clôture du tour. La page se met à jour d'elle-même.",
      erreur:
        "Envoyer chacun de son côté. Une équipe n'envoie qu'une feuille : décidez ensemble, puis un seul d'entre vous valide.",
      capture: {
        fichier: "envoyer",
        largeur: 1280,
        hauteur: 800,
        alt: "La dernière rubrique de la feuille de décision et le bouton Valider les décisions de l'équipe.",
        reperes: [{ cible: "role=button[name=/Valider les décisions de l.équipe/]", legende: "L'envoi de la feuille, pour toute l'équipe." }],
      },
    },
    {
      id: "resultats",
      titre: "Lire ce que le marché a répondu, et le courrier",
      faire: [
        "Quand votre enseignant a clos le tour, vos résultats s'ouvrent au-dessus du tour suivant.",
        "Le verdict du tour dit votre résultat et ses causes les plus fortes : ventes manquées, prix, coûts.",
        "Lisez le courrier du tour : une lettre d'un client, d'un fournisseur ou de la banque, et parfois la Gazette. Ce qu'il annonce compte pour la suite.",
        "Puis cliquez sur le bouton qui vous fait passer au tour suivant, et décidez.",
      ],
      voir: "Vos comptes complets se déplient sous les indicateurs : compte de résultat, bilan, trésorerie.",
      erreur:
        "Passer au tour suivant sans lire le verdict. C'est sur les résultats d'un tour que se décide le suivant.",
      capture: {
        fichier: "resultats",
        largeur: 1280,
        hauteur: 800,
        alt: "Les résultats d'un tour clos : le verdict, la perte ou le bénéfice, et ce qui l'explique.",
        reperes: [
          { cible: "text=Le verdict >> nth=0", legende: "Le verdict du tour : votre résultat." },
          { cible: "text=Les causes les plus fortes", legende: "Ce qui l'explique d'abord." },
        ],
      },
      sautDePage: true,
    },
    {
      id: "bilan",
      titre: "Lire le bilan de la partie",
      faire: [
        "Au dernier tour clos, la partie s'arrête sur son bilan : vos résultats sur toute la partie, tour par tour, et ce que la presse annonçait.",
        "Votre place apparaît quand votre enseignant révèle le classement final.",
        "Relisez les tours où tout a basculé : ce sont ceux dont votre enseignant parlera au débrief.",
      ],
      voir: "Le bilan reste ouvert : vous pouvez y revenir avec votre code de reprise. Si votre enseignant l'a prévu, une carte « Évaluez vos coéquipiers » s'y ajoute.",
      erreur: "Ne regarder que le classement. Le bilan dit pourquoi, et c'est ce qui se réutilise dans la partie suivante.",
      capture: {
        fichier: "bilan",
        largeur: 1280,
        hauteur: 800,
        alt: "Le bilan d'une partie de classe terminée : le classement final et les résultats.",
        reperes: [
          { cible: "text=Votre place >> nth=0", legende: "Votre place, une fois le classement révélé." },
          { cible: "text=Votre résultat net, tour par tour", legende: "Vos résultats, tour par tour." },
        ],
      },
    },
    {
      id: "coequipiers",
      titre: "Évaluer vos coéquipiers",
      faire: [
        "Au bilan, dans la carte « Évaluez vos coéquipiers », cliquez sur « Évaluer mes coéquipiers ».",
        "Pour chaque coéquipier, donnez une note par critère. Si votre enseignant l'a demandé, notez-vous aussi dans « Et vous ? ».",
        "« Un mot pour votre enseignant (facultatif) » : lui seul le lit, avec votre nom.",
        "Cliquez sur « Envoyer mon évaluation ». Vous pouvez la modifier jusqu'à la clôture avec « Mettre à jour mon évaluation ».",
      ],
      voir: "Quand votre enseignant publie, la carte devient « Ce que vos coéquipiers disent de vous » : vos moyennes, critère par critère, sans le nom de qui a noté.",
      erreur:
        "Noter tout le monde pareil pour éviter la question. Vos coéquipiers ne sauront jamais ce que vous leur avez donné : notez ce que vous avez vu.",
      capture: {
        fichier: "coequipiers",
        largeur: 1280,
        hauteur: 800,
        alt: "Le formulaire d'évaluation des coéquipiers : pour chaque coéquipier, une note par critère, et le bouton Envoyer mon évaluation.",
        reperes: [{ cible: "[data-coequipier] >> nth=0", legende: "Un coéquipier, et ses critères à noter, puis le mot pour votre enseignant." }],
      },
      sautDePage: true,
    },
    {
      id: "merite",
      titre: "Mérite ou chance : relire une partie solo",
      faire: [
        "Lancez une partie solo depuis la page « Jouer maintenant » et jouez-la jusqu'au bout.",
        "Au bilan, trois blocs s'ajoutent : « Vos décisions tenaient-elles ? », « Ce que la partie montre » et « Et ensuite ».",
        "Le premier rejoue vos décisions sur d'autres marchés possibles, à côté de celles d'un bon gestionnaire : il dit si votre place tenait à vos choix ou au hasard.",
      ],
      voir: "Un verdict en un mot, la fourchette des places que vos décisions auraient obtenues, et le niveau conseillé pour la suite.",
      erreur:
        "Conclure d'un bon classement que tout était juste. Une place gagnée par chance se perd à la partie suivante : le bloc le dit.",
      capture: {
        fichier: "merite",
        largeur: 1280,
        hauteur: 800,
        alt: "Le bilan d'une partie solo : le bloc Vos décisions tenaient-elles, avec le verdict et la distribution des résultats.",
        reperes: [{ cible: "text=Vos décisions tenaient-elles ?", legende: "Ce qui tenait à vos décisions, et ce qui tenait au hasard." }],
      },
    },
    {
      id: "examen",
      titre: "Passer un examen individuel",
      faire: [
        "Ouvrez le lien donné par votre enseignant, ou la page de l'examen : tapez le « Code de l'examen » et cliquez sur « Continuer ».",
        "Lisez les règles, donnez votre nom et prénom et votre numéro d'étudiant, puis « Commencer l'examen ».",
        "Jouez seul, tour après tour. Un tour dont la durée est échue se clôt avec vos décisions reconduites.",
        "Si vous ouvrez l'examen depuis votre cours Moodle, votre note arrive aussi dans le carnet de notes du cours quand votre enseignant publie les résultats.",
      ],
      voir: "À la fin, un reçu daté. Votre note et votre relevé par compétence paraissent quand votre enseignant les publie.",
      erreur:
        "Fermer la page en cours d'examen sans noter votre code de reprise : il vous rend votre copie sur un autre appareil.",
      capture: {
        fichier: "examen",
        largeur: 1280,
        hauteur: 800,
        alt: "La page d'un examen individuel : les règles, le nom et le numéro d'étudiant, et le bouton Commencer l'examen.",
        reperes: [{ cible: "role=button[name=\"Commencer l'examen\"]", legende: "Le départ de l'examen, quand vous êtes prêt." }],
      },
      sautDePage: true,
    },
    {
      id: "mobile",
      titre: "Jouer sur un téléphone",
      faire: [
        "Tout se joue aussi sur un téléphone : entrez par la même page, avec le même code.",
        "Le tour se déroule écran par écran : la barre du haut dit où vous en êtes, et « Continuer » mène à l'écran suivant, jusqu'aux décisions.",
        "Le menu de la barre ouvre votre profil, les fiches notions et ce guide.",
      ],
      voir: "Les mêmes contenus que sur un ordinateur, un écran à la fois.",
      erreur:
        "Jouer à plusieurs téléphones dans la même équipe sans se parler. Une seule feuille compte : mettez-vous d'accord avant de valider.",
      capture: {
        fichier: "mobile",
        largeur: 1280,
        hauteur: 800,
        alt: "Trois écrans de téléphone : la page pour rejoindre, le briefing du tour et un écran de décision.",
        reperes: [],
      },
    },
  ],
  plusLoin: [
    {
      titre: "Comprendre les notions",
      texte: "Chaque notion du jeu expliquée, reliée à ce que montre votre tableau de bord.",
      lien: { href: "/notions", libelle: "Ouvrir les fiches notions" },
    },
    {
      titre: "S'entraîner seul",
      texte: "Une partie solo, sans compte, face à des concurrents simulés : le meilleur entraînement avant une séance ou un examen.",
      lien: { href: "/jouer", libelle: "Jouer maintenant" },
    },
    {
      titre: "Les règles du jeu",
      texte: "Le tour, les indices, le courrier et le score, réunis au même endroit.",
      lien: { href: "/guide", libelle: "Lire le guide du jeu" },
    },
  ],
  faq: [
    {
      question: "J'ai perdu mon code de reprise.",
      reponse:
        "En classe, votre enseignant a la liste des codes de la partie : il peut vous le relire. En solo, il n'y a pas de secours : le code s'affiche dans le menu de la partie, sur l'appareil où vous avez joué.",
      lien: { href: "/reprendre", libelle: "Reprendre ma partie" },
    },
    {
      question: "Mon équipe est incomplète.",
      reponse:
        "Jouez à ceux qui sont là : une équipe peut être tenue par un seul élève. Si personne n'envoie, les dernières décisions sont reconduites à la clôture.",
    },
    {
      question: "J'arrive en retard.",
      reponse:
        "Entrez avec le même code : vous êtes placé dans l'équipe la moins remplie. Avant la clôture du premier tour, vous pouvez rejoindre l'équipe de vos camarades.",
    },
    {
      question: "Je suis sur l'ordinateur d'un autre élève.",
      reponse:
        "Si la page vous appelle par un autre prénom, cliquez sur « Ce n'est pas moi » avant de jouer, puis entrez avec votre code.",
    },
    {
      question: "Quelles données sont gardées sur moi ?",
      reponse:
        "Votre pseudo et un identifiant technique, rien d'autre : ni e-mail, ni nom de famille, ni date de naissance. Pour un examen, le nom et le numéro que vous donnez servent à votre enseignant.",
      lien: { href: "/mentions-legales", libelle: "Lire les mentions légales" },
    },
  ],
  aVenir: [],
};
