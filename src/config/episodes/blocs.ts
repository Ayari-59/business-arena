/**
 * LES BLOCS QUE LES ÉPISODES FONT TRAVAILLER.
 *
 * Demande du propriétaire (octobre 2026) : « Trouve le moyen de couvrir tous
 * les thèmes, trouve un jeu complémentaire ou une situation annexe pour que
 * les cours soient complets, notamment au lycée. » Le jeu complémentaire
 * existait : les épisodes manager, un trimestre et six décisions chacun. Ils
 * travaillaient des thèmes que ni les ateliers ni le cours ne touchent, et le
 * tableau de couverture ne le savait pas.
 *
 * Chaque épisode cite ici les entrées qu'il travaille, préfixées du diplôme
 * comme les chapitres du cours (« STMG Thème 3 · … », « 2de pro RC … »), et
 * la garde de la couverture vérifie que chacune désigne une entrée du texte.
 *
 * LA RÈGLE DE RETENUE EST STRICTE. Un épisode ne cite une entrée que si deux
 * de ses décisions au moins font faire à l'élève ce que l'entrée demande, lu
 * dans ses décisions, ses sources et son bilan, pas dans son titre. Le relevé,
 * décision par décision avec ses lignes, a été fait sur le contenu des
 * épisodes. Une seule décision, ou une partie seulement de l'entrée, ne suffit
 * pas : l'épisode de l'agence qui démarre touche l'idée et le modèle
 * économique, pas la création d'une entreprise, et il ne coche donc pas le
 * thème « S'engager et entreprendre » de la seconde.
 *
 * LE POINT DE VUE. L'élève joue un responsable dans tous les épisodes, sauf
 * ceux de la famille « Le premier poste ». Une entrée qui décrit le geste d'un employé ou d'un équipier (le CAP
 * Équipier polyvalent du commerce, les relations interpersonnelles de la
 * seconde GA-TL) n'est donc pas cochée par un épisode qui la fait seulement
 * décider d'en haut : ces entrées attendent des situations écrites à hauteur
 * d'employé. La famille « Le premier poste » les réunit : dans « Le
 * libre-service qui perd », l'élève joue un équipier en CAP, et ses six
 * décisions sont des gestes d'équipier, deux par bloc du CAP ; dans « Le
 * bureau qui s'échauffe », un employé de bureau en seconde professionnelle,
 * dont cinq décisions sur six se jouent dans la relation avec les autres.
 */

// Les intitulés cités, une fois chacun : une faute de frappe se verrait
// partout, et la garde n'aurait qu'un endroit à pointer.
const RC_OMNICANAL = "2de pro RC Intégrer la relation client dans un cadre « omnicanal »";
const RC_INFORMATION =
  "2de pro RC Collecter et exploiter l'information dans le cadre de la relation client";
const GATL_RELATIONS = "2de pro GATL 1 · Gérer des relations interpersonnelles";
const GATL_ADMINISTRATIF =
  "2de pro GATL 3 · Mettre en œuvre et contrôler les processus administratifs";
const GATL_REGLEMENTATION =
  "2de pro GATL 5 · Assurer le respect de la réglementation, des normes et traiter les dysfonctionnements";
const AGORA_CLIENTS =
  "Bac pro AGORA Bloc 1 · Gérer des relations avec les clients, les usagers et les adhérents";
const MCV_SUIVRE = "Bac pro MCV Bloc 2 · Suivre les ventes";
const RHC_COMPETENCES =
  "STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences";
const RHC_COHESION =
  "STMG Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social";
const SIG_NUMERISATION = "STMG Thème 1 · Organisation et numérisation";
const SIG_PERFORMANCE = "STMG Thème 2 · Management du système d'information et performance";
const SIG_DECISION = "STMG Thème 3 · Information, action et décision";
const EPC_COMMANDES = "CAP EPC Bloc 1 · Recevoir et suivre les commandes";
const EPC_RAYON = "CAP EPC Bloc 2 · Mettre en valeur et approvisionner";
const EPC_CLIENT =
  "CAP EPC Bloc 3 · Conseiller et accompagner le client dans son parcours d'achat";

export const BLOCS_DES_EPISODES: Readonly<Record<string, readonly string[]>> = {
  // Trier et dater les demandes à distance, préparer réponses types et FAQ,
  // donner un délai précis à chaque client en attente.
  "equipe-qui-s-epuise": [RC_OMNICANAL, AGORA_CLIENTS],
  // Reconstituer le parcours en ligne, lever les blocages, relier le web et le
  // comptoir par le retrait en agence.
  "site-qui-ne-vend-pas": [RC_OMNICANAL],
  // Écouter les appels, suivre la commande prise au premier appel, ouvrir une
  // ligne prioritaire ; choisir les quatre indicateurs qui disent le vrai.
  "indicateur-qui-ment": [RC_OMNICANAL, SIG_DECISION],
  // Appeler les clients partis, extraire leur fréquence de commande, croiser
  // les sources, installer une alerte hebdomadaire.
  "client-qui-s-en-va": [RC_INFORMATION, MCV_SUIVRE],
  // Classer les avis par thème, y répondre, demander un avis à chaque départ.
  "note-qui-chute": [RC_INFORMATION, MCV_SUIVRE],
  // Suivre une facture du courrier au virement, revoir les délégations,
  // régulariser plutôt qu'antidater, instaurer un contrôle interne.
  "controle-qui-s-annonce": [GATL_ADMINISTRATIF, GATL_REGLEMENTATION],
  // Le registre des presque-accidents, le CACES expiré, séparer piétons et
  // chariots, analyser chaque fiche sans chercher de coupable.
  "quai-dangereux": [GATL_REGLEMENTATION],
  // Bloquer le lot, monter le dossier de garantie, contrôler à réception ;
  // traiter les retours et dire aux clients ce qui se passe.
  "reclamation-qui-enfle": [GATL_REGLEMENTATION, MCV_SUIVRE],
  // Des créneaux réalistes, la confirmation de la veille, une date donnée à
  // chaque client : le suivi de la commande jusqu'à la livraison.
  "tournees-qui-debordent": [MCV_SUIVRE],
  // Le parcours d'admission des usagers, la liste d'attente remise à jour, une
  // procédure et son indicateur.
  "lits-vides": [AGORA_CLIENTS],
  // La balance âgée, les factures rejetées corrigées, les relances des seules
  // factures échues et non contestées.
  "factures-qui-dorment": [AGORA_CLIENTS],
  // Redéfinir le poste, l'entretien structuré, le parrain, le point de mi-période.
  "poste-qui-reste-vide": [RHC_COMPETENCES],
  // La cartographie des compétences, les binômes, le savoir écrit, la transmission.
  "competences-qui-manquent": [RHC_COMPETENCES],
  // La matrice de polyvalence, les standards, l'échelon, l'habilitation.
  "polyvalence-des-operateurs": [RHC_COMPETENCES],
  // La VAE accompagnée, les tutrices formées, les apprentis, le rôle reconnu.
  "former-ses-soignants": [RHC_COMPETENCES],
  // Ouvrir les chiffres aux élus, tenir la promesse, une commission de suivi.
  "preavis-de-greve": [RHC_COHESION],
  // Réunir les deux équipes, protéger la transmission, des temps communs.
  "equipes-jour-et-nuit": [RHC_COHESION],
  // Les absences décomposées, les plannings publiés, le retour sans enjeu
  // disciplinaire.
  "absenteisme-qui-s-installe": [RHC_COHESION],
  // Le dossier de soins numérique : organisation du travail, accès, données.
  "dossier-de-soins": [SIG_NUMERISATION],
  // Le système d'information qui tombe : mode dégradé, reprise, ce qu'il coûte.
  "panne-qui-paralyse": [SIG_PERFORMANCE],
  // Un projet de système d'information qui glisse : jalons, périmètre, coût.
  "projet-qui-glisse": [SIG_PERFORMANCE],
  // L'élève joue l'équipier. Bloc 1 : pointer la livraison avec le bon de
  // commande et écrire les réserves (D1), ranger ce qui périme le plus tôt
  // devant et préparer les commandes clients la veille (D2). Bloc 2 :
  // réassortir d'après les ventes de la veille et remettre en façade (D3),
  // corriger les étiquettes, poser le balisage, déclarer la démarque et faire
  // l'inventaire tournant (D4). Bloc 3 : accueillir le particulier, le
  // questionner, le conseiller et proposer les produits utiles (D5), régler
  // sur place le retrait incomplet d'une commande du site (D6).
  "libre-service-qui-perd": [EPC_COMMANDES, EPC_RAYON, EPC_CLIENT],
  // L'élève joue l'employé de bureau. Relations : accueillir le transporteur
  // en colère (D2), régler en face le désaccord avec une collègue (D3), dire
  // une erreur à sa responsable (D4), répondre au client agacé (D5), recevoir
  // une remarque sur son travail (D6). Processus administratifs : rapprocher
  // bon de commande, bon de livraison et facture (D1), faire établir l'avoir
  // d'un double paiement (D4), contrôler une facture contre le bon signé
  // (D5), relire ses saisies et réclamer les avoirs avant la clôture (D6).
  "bureau-qui-s-echauffe": [GATL_RELATIONS, GATL_ADMINISTRATIF],
};
