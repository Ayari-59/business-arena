/**
 * FICHE ENSEIGNANT · ÉPISODE 49, LE LIBRE-SERVICE QUI PERD.
 *
 * Les gestes d'un équipier de CAP, deux par bloc : recevoir et ranger,
 * réassortir et étiqueter, conseiller et régler une réclamation. Le piège :
 * aller vite, faire beau ou cacher plutôt que bien faire. Les chiffres du
 * hasard de la classe sont ceux de la graine 12.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "libre-service-qui-perd",
  formations: ["cap-epc"],
  programme: [
    "CAP EPC · Bloc 1, Recevoir et suivre les commandes",
    "CAP EPC · Bloc 2, Mettre en valeur et approvisionner",
    "CAP EPC · Bloc 3, Conseiller et accompagner le client dans son parcours d'achat",
  ],
  notion:
    "Un libre-service ne perd pas d'abord son argent par le vol : il le perd par des gestes faits trop vite. L'erreur classique consiste à signer le bon du chauffeur sans vérifier, à ranger les cartons neufs devant, à remplir le rayon à l'œil, à laisser des étiquettes fausses ou à cacher les produits abîmés, à vendre au client ce qu'il demande sans lui poser de question, et à renvoyer une réclamation vers quelqu'un d'autre. Dans l'épisode, l'élève joue Camille Royer, en CAP Équipier polyvalent du commerce, en apprentissage à l'agence Arvel Distribution de Bourgoin-Jallieu ; Samia Haddou, sa cheffe d'équipe, lui confie la réception des livraisons et le rayon colles et joints. Le trimestre dernier, le libre-service a perdu 9 620 € de démarque : 4 680 € de colis abîmés ou manquants vus après la livraison (49 %), 2 860 € de colles et mastics périmés au fond du rayon (30 %), 1 300 € de casse et seulement 780 € de vol. Les 8 livraisons du mois dernier ont toutes été signées sans réserve, et le transporteur n'a rien remboursé. L'élève découvre que vérifier les colis et écrire les réserves avant de signer prend 20 minutes et fait rembourser presque tout, que les dates courtes se mettent devant, que les commandes préparées la veille sont prêtes à l'heure, et que poser des questions au client évite de lui vendre la mauvaise colle.",
  objectifs: [
    "Je contrôle une livraison avec le bon de commande, et j'écris les réserves sur le bon du transporteur avant de signer.",
    "Je range le rayon en mettant devant ce qui périme le plus tôt, et je prépare les commandes clients à l'avance.",
    "Je réassortis d'abord les produits qui se vendent le plus, d'après les ventes de la veille, sans encombrer les allées.",
    "Je corrige les étiquettes, je pose le balisage, et je déclare les produits abîmés en démarque.",
    "Je questionne le client sur son chantier avant de le conseiller, et je règle sur place une réclamation simple.",
  ],
  prerequis:
    "La réception d'une livraison (bon de commande, bon de livraison), la rotation des produits et la démarque doivent avoir été vues en cours ou en entreprise. La réserve écrite sur le bon du transporteur et la découverte du besoin du client peuvent être découvertes pendant la séance. La prévision demande seulement une multiplication.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/libre-service-qui-perd?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous présentez Camille et Samia en deux phrases, et vous demandez d'écrire sur papier, avant de valider la semaine 1, le calcul du nombre de commandes clients à préparer en semaine 3, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la façon de recevoir les livraisons en semaine 1 (signer vite, vérifier et écrire les réserves, vérifier après, tout refuser), et ce que l'élève fait pour M. Bertin en semaine 8. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 6 : ranger les produits abîmés en réserve sans les déclarer.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous écrivez le repère au tableau : environ 8 commandes par jour d'ouverture, 6 jours d'ouverture par semaine. Vous faites faire la multiplication : 8 × 6 = 48 commandes. Puis vous montrez ce que le tableau de bord a compté sous le tirage n° 12 : 45 commandes, une semaine un peu calme (environ 6 % de moins). Vous faites expliquer les valeurs éloignées (8, 14, 56). Vous dites aux élèves qui ont écrit 48 que leur calcul est juste : c'est la semaine qui a été plus calme que d'habitude.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1. Les élèves qui ont signé vite expliquent pourquoi (le chauffeur est pressé, le rayon doit être plein avant 9 heures), puis la classe lit la feuille de démarque : la moitié des pertes vient des colis vus après la livraison, et le vol n'en fait pas un dixième. Vous enchaînez sur la semaine 6 : pourquoi cacher les produits abîmés fait baisser la démarque du mois, mais fausse le stock. Puis sur M. Bertin : quelles questions fallait-il lui poser ?",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Samia compare les pertes du trimestre au plafond de 40 000 € fixé par la directrice. Sous le tirage n° 12, « Contrôler, ranger, conseiller » finit 26 k€ sous le plafond, « Faire comme d'habitude » 21 k€ au-dessus, « Aller vite » 22,6 k€ au-dessus ; sur les trente tirages, la bonne façon de faire reste sous le plafond les 30 fois, les deux autres jamais. Vous faites remarquer que, dans cet épisode, le hasard ne change presque rien : ce sont les gestes qui font la différence.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau six gestes, un par décision : vérifier et écrire les réserves avant de signer ; dates courtes devant et commandes prêtes la veille ; réassortir les meilleures ventes d'abord, sans palette dans les allées ; étiquettes justes, abîmés déclarés ; questionner le client avant de conseiller ; régler la réclamation sur place. Les élèves recopient les gestes dans leur cahier et en choisissent un qu'ils ont vu, ou pas vu, en entreprise. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 45,
    etapes: [
      "Le repère de la prévision : environ 8 commandes clients à préparer par jour d'ouverture (comptoir, téléphone et site).",
      "Le libre-service est ouvert 6 jours par semaine.",
      "Le calcul : 8 × 6 = 48 commandes à préparer dans une semaine normale.",
      "Ce que le tableau de bord a compté en semaine 3, sous le tirage n° 12 : 45 commandes (44,9). La semaine a été un peu plus calme qu'une semaine normale, d'environ 6 %. L'épisode juge juste à 3 commandes près, proche à 8 ; selon les trente tirages, la semaine 3 compte de 43 à 52 commandes.",
      "Le chiffre ne dépend pas des décisions : il est le même pour toute la classe. Ce qui change avec les décisions, c'est combien de ces commandes sont prêtes quand le client arrive.",
    ],
    erreurs: [
      {
        valeur: 8,
        cause:
          "Les commandes d'un seul jour : l'élève a oublié de multiplier par les 6 jours d'ouverture de la semaine.",
      },
      {
        valeur: 14,
        cause:
          "8 + 6 au lieu de 8 × 6 : les deux nombres du repère ont été additionnés au lieu d'être multipliés.",
      },
      {
        valeur: 56,
        cause:
          "8 × 7 : la semaine comptée sur 7 jours, alors que le libre-service n'est ouvert que 6 jours.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le chauffeur est pressé et Kevin le dit : d'habitude, on signe vite et on range, pour que le rayon soit plein avant 9 heures.",
      ceQuiLeDejoue:
        "Les bons du mois dernier : 8 livraisons, toutes signées sans réserve, dont 2 avec un colis abîmé ou un manquant vu après le départ du chauffeur ; le transporteur n'a rien remboursé, « sans réserve écrite sur son bon, il n'y a pas de preuve ». La feuille de démarque montre que ces colis font 49 % des pertes du trimestre dernier, 4 680 €. Vérifier et écrire les réserves prend 20 minutes de plus par livraison. Rejoué sur les trente tirages à la place du contrôle avant signature, signer vite perd 4,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Ranger les cartons neufs devant remplit le rayon tout de suite, et préparer la commande quand le client arrive, c'est comme d'habitude.",
      ceQuiLeDejoue:
        "Samia a jeté un carton de mastics périmés trouvé au fond du rayon : les colles périmées font 2 860 € de pertes, 30 % de la démarque. La source sur les dates le montre : les tubes qui périment le plus tôt sont tous derrière. Et 26 % des clients attendent leur commande ; préparées la veille, presque toutes seraient prêtes (Julien Caron : « Je suis reparti en deux minutes »). Rejoué sur les trente tirages à la place des dates courtes devant et des commandes prêtes la veille, il perd 11,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi:
        "Sortir des palettes entières dans les allées évite les allers et retours : on va plus vite.",
      ceQuiLeDejoue:
        "Samia le dit : « une palette dans une allée ouverte au public, c'est dangereux », et les clients doivent se faufiler ; un client peut trébucher. La liste des ventes de la veille dit quoi réassortir d'abord : une petite partie des produits fait la moitié des ventes du samedi. Dix minutes pour la lire, puis le réassort dans l'ordre, avant l'ouverture. Rejoué sur les trente tirages à la place du réassort des meilleures ventes, il perd 8,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "La promotion commence lundi : poser vite le balisage la rend visible, et la caisse corrigera les prix.",
      ceQuiLeDejoue:
        "La comparaison des étiquettes : 12 étiquettes ne seront plus à jour lundi. En caisse, le client voit un autre prix que celui du rayon : l'agence doit appliquer le prix affiché, perd la différence, et le client se sent trompé (Kevin : « trois clients ce matin »). Les produits abîmés restés en rayon faussent aussi le stock. Rejoué sur les trente tirages à la place de la correction complète, le balisage seul perd 10,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "Ranger les abîmés en réserve sans les déclarer garde la démarque du mois basse : personne ne les verra.",
      ceQuiLeDejoue:
        "La source sur le stock de l'allée 4 l'explique : sur 30 produits comptés, 3 sont « en stock » dans le logiciel mais vides en rayon, et personne ne les recommande ; « un produit abîmé qu'on ne déclare pas fait la même erreur ». Les 400 € d'abîmés cachés reviennent tous d'un coup à l'inventaire, et le rayon reste vide entre-temps. Samia : la démarque qui monte « dit la vérité ». Rejoué sur les trente tirages à la place de la déclaration et du comptage, cacher les abîmés perd 5,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "Proposer la meilleure colle et tout le rayon carrelage fait un gros panier : plus il achète, mieux c'est pour l'agence.",
      ceQuiLeDejoue:
        "M. Bertin revient tout rendre le lundi : « la moitié ne servait à rien ». La source sur les retours le disait : la moitié des retours viennent de particuliers repartis avec le mauvais produit ou des produits inutiles, remboursés et souvent abîmés. Écouter son chantier (de grands carreaux sur un chauffage au sol) dit ce qu'il lui faut : la colle adaptée, un peigne, des croisillons, du joint. Rejoué sur les trente tirages à la place des questions et du conseil, le gros panier perd 12,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Ce n'est pas l'erreur de l'agence : le service client du site gère ces commandes.",
      ceQuiLeDejoue:
        "Mme Lefort a déjà appelé ce numéro, et on lui a dit de voir avec l'agence. La commande à l'écran montre ce qui s'est passé (le primaire en rupture mardi, le site n'a pas prévenu) et qu'un primaire équivalent, au même prix, est en rayon. Le cahier des réclamations le dit : ceux qu'on renvoie vers le service client du site reviennent rarement. Rejoué sur les trente tirages à la place de l'écoute et du primaire équivalent, le renvoi perd 6,2 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont pensé au vol, d'autres aux clients qui abîment les produits. Que disait la feuille de démarque du trimestre dernier ? Quelle source fallait-il lire en premier ?",
    "Pourquoi faut-il écrire la réserve sur le bon du transporteur avant de signer ? Que se passe-t-il quand on vérifie après le départ du chauffeur ?",
    "Ranger les cartons neufs devant ou derrière : qu'est-ce que ça change pour les colles et les mastics ? Comment s'appelle cette façon de ranger ?",
    "Cacher les produits abîmés fait baisser la démarque du mois. Pourquoi est-ce quand même une mauvaise idée ? Que devient le stock du logiciel ?",
    "M. Bertin demande « une colle pour du carrelage ». Quelles questions fallait-il lui poser ? Qu'est-ce que la colle la moins chère lui aurait coûté, à lui et à l'agence ?",
    "Mme Lefort n'a pas eu son pot de primaire. Ce n'était pas l'erreur de Camille : pourquoi est-ce quand même à elle de régler la réclamation ?",
    "Quel geste allez-vous refaire en entreprise ? Dites-le en une phrase.",
  ],
  prolongement: {
    enonce:
      "Un libre-service reçoit 2 livraisons par semaine, pendant 13 semaines. Trois livraisons sur dix arrivent avec un colis abîmé ou manquant, qui vaut en moyenne 600 €. Quand l'équipier écrit la réserve sur le bon du transporteur avant de signer, le fournisseur rembourse 90 % de la valeur. Quand il signe d'abord et vérifie après, il ne récupère que 10 %. Vérifier une livraison prend 20 minutes. 1) Combien de livraisons sur le trimestre ? 2) Combien de livraisons avec un problème, et quelle valeur en tout ? 3) Combien l'agence récupère-t-elle dans chaque cas, et combien perd-elle ? 4) Combien de temps faut-il pour vérifier toutes les livraisons du trimestre ? Le contrôle vaut-il ce temps ?",
    corrige:
      "1) 2 × 13 = 26 livraisons. 2) 26 × 0,3 = 7,8 livraisons, environ 8 ; 7,8 × 600 = 4 680 €. 3) Avec réserve avant de signer : 4 680 × 0,9 = 4 212 € récupérés, 468 € perdus. En signant d'abord : 4 680 × 0,1 = 468 € récupérés, 4 212 € perdus. Le contrôle fait économiser 4 212 − 468 = 3 744 €. 4) 26 × 20 = 520 minutes, soit 8 heures et 40 minutes sur le trimestre. Oui : moins de 9 heures de travail font économiser 3 744 €, plus de 400 € par heure.",
  },
  evaluation: [
    "Le calcul de la semaine 1 est posé et juste (8 × 6 = 48), et l'élève sait dire pourquoi la semaine 3 a compté un peu moins.",
    "La réception est faite dans l'ordre : comparer au bon de commande, regarder les colis, écrire les réserves, puis signer.",
    "Le rayon est rangé avec les dates courtes devant, réassorti d'après les ventes de la veille, avec des étiquettes justes et des abîmés déclarés.",
    "Le client est questionné sur son besoin avant d'être conseillé, et la réclamation est réglée sur place avec une solution.",
    "L'élève explique, sur une de ses décisions, pourquoi elle était bonne ou mauvaise, sans s'appuyer seulement sur le résultat du bilan.",
  ],
  vigilance:
    "Sous le tirage n° 12, la semaine 3 compte 44,9 commandes : le calcul attendu, 8 × 6 = 48, tombe à 3,1 commandes du réel, et le bilan le classe « proche » et non « juste ». Il faut le dire aux élèves et valoriser la méthode. Sur le droit : la réserve sur le bon du transporteur et le délai de trois jours pour protester par lettre recommandée après réception sans réserve relèvent du Code de commerce, à relire par l'enseignant avant la séance ; la règle du prix affiché en caisse (le client paie le prix de l'étiquette, sauf erreur grossière) est à présenter avec prudence.",
};
