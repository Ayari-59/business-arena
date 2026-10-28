/**
 * FICHE ENSEIGNANT · ÉPISODE 1, LE TRIMESTRE QUI DÉRAPE.
 *
 * Décomposer un indicateur commercial qui baisse avant d'agir : la moyenne de
 * l'agence cache deux portefeuilles qui décrochent, et la remise générale,
 * réflexe le plus fréquent, coûte plus de marge qu'elle n'en rapporte.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "trimestre-qui-derape",
  formations: ["bts-mco", "bts-ndrc", "but-tc"],
  programme: [
    "BTS MCO · Bloc 3, Assurer la gestion opérationnelle",
    "BTS NDRC · Bloc 1, Relation client et négociation-vente",
    "BUT TC · Vendre une offre commerciale",
  ],
  notion:
    "Un indicateur commercial qui baisse est une moyenne : avant d'agir, on le décompose par commercial, par client, par segment, et la cause est presque toujours locale. L'erreur classique consiste à lire une baisse de la transformation des devis comme un problème de prix, et à répondre par une remise générale, qui s'applique à toutes les ventes, y compris celles qui se seraient faites sans elle. Dans l'épisode, Claire Morel, cheffe de l'agence de Lyon d'Arvel Distribution, voit la transformation passer de 38 % à 33,6 % en trois semaines. Le détail par commercial concentre la baisse sur deux portefeuilles : celui de Karim (moins 11 points), en arrêt maladie et dont personne ne suit les devis, et celui de Julie (moins 4 points) ; les cinq autres sont stables. Un client perdu, M. Ferreira, le dit : « Rien contre vos prix », mais trois jours de livraison contre le lendemain chez Brico-Pro Rhône ; la comparaison des prix montre l'agence à 1,5 % près du concurrent. L'élève découvre que réaffecter 38 comptes et faire connaître le retrait en agence sous 2 heures règlent ce que trois remises (5 %, 3 %, puis 5 % pour finir) ne règlent pas, et qu'une surcharge se traite en retirant du travail, pas en payant une prime.",
  objectifs: [
    "Je décompose un indicateur global (la transformation des devis) par commercial et par client avant d'en chercher la cause.",
    "Je distingue une cause vérifiée dans les sources d'une explication plausible que rien ne montre, comme le prix ou la motivation.",
    "Je chiffre ce qu'une remise coûte sur toutes les ventes, et pas seulement ce qu'elle peut faire gagner.",
    "Je réponds à la surcharge d'un collaborateur en réduisant sa charge, et je juge une demande de remise d'un grand compte sur son poids dans le chiffre.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de devis, de taux de transformation, de marge brute et de délai de paiement des clients doivent être connues ; le calcul d'un pourcentage et d'une marge suffit. La décomposition d'une moyenne et le coût d'une remise peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/trimestre-qui-derape?hasard=19 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, la transformation des devis prévue pour la semaine 4, le raisonnement qui y mène, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : les sources ouvertes en semaine 1 (le détail par commercial a-t-il été consulté ?) et la réponse à Julie en semaine 5. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 9, la réponse à Delta.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute. Vous reconstruisez le raisonnement : 33,6 % au départ, ce que la réaffectation des comptes de Karim rend, ce que le délai de livraison retient jusqu'à la semaine 5 ; puis vous montrez ce que le hasard de la classe a fait de la semaine 4 (intempéries, grands comptes qui signent peu) : 31,4 %. Vous faites expliquer d'où viennent les valeurs éloignées : 38 %, 33,6 %, 27,7 %.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (remise, réaffectation, prospection, attente), de la semaine 5 (Julie) et de la semaine 9 (Delta). Pour la semaine 1, chaque camp cite la source qui l'a décidé ; pour Delta, vous faites calculer au tableau ce que rapportent les 40 000 € à 18 % de marge et ce que coûtent 8 % sur les 6 500 € de commandes habituelles par semaine. Pour Julie, vous faites dire ce que chaque option retire de sa charge.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer, et vous lisez avec la classe le rejeu de chaque décision sous trente tirages. Sous le tirage n° 19, « Diagnostic d'abord » finit à 364,9 k€ de marge, pénalités déduites, l'attentiste à 311,4 k€ et le réflexe remise à 301,9 k€. Vous montrez ensuite la décision où le hasard a récompensé un mauvais choix : sous ce tirage, Julie a tenu même chez ceux qui lui ont demandé de tenir. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : décomposer l'indicateur avant d'agir, vérifier la cause auprès d'un client, chiffrer une remise sur toutes les ventes qu'elle touche. Vous ajoutez la règle d'équipe : une surcharge se réduit, elle ne se paie pas. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 31.4,
    etapes: [
      "Point de départ (alerte du tableau de bord) : 33,6 % de transformation la semaine dernière, contre 38 % il y a un mois. Le détail par commercial situe la perte : moins 11 points sur le portefeuille de Karim, que personne ne suit, moins 4 points sur celui de Julie, rien ailleurs.",
      "Ce que la bonne décision rend : réaffecter les 38 comptes de Karim à Julie et Thomas dès la semaine 2 fait de nouveau suivre ses devis. Ce qu'elle ne rend pas : la livraison reste à trois jours (source de l'administration des ventes, préparation en 48 heures au lieu de 24) jusqu'à la réponse de la semaine 4, qui n'agit qu'à partir de la semaine 5.",
      "Sans aléa, le modèle donne environ 35,8 % en semaine 4 avec les comptes de Karim réaffectés, contre 33,6 % s'ils ne le sont pas : la réaffectation rend un peu plus de 2 points, le délai de livraison en retient le reste, et l'on ne revient pas à 38 %.",
      "Sous le tirage n° 19, la semaine 4 est mauvaise pour tout le monde : une semaine d'intempéries retire un cinquième des devis des artisans, et les grands comptes signent environ 17 % de moins que d'ordinaire. Le modèle donne 31,4 % (31,43) sur le chemin de la meilleure méthode.",
      "Le chiffre dépend du hasard et des décisions : de 31,4 % à 38,8 % selon les trente tirages pour la meilleure méthode, 35,3 % en moyenne ; sous le tirage de la classe, 29,4 % pour qui attend et 28,7 % pour qui lance la prospection. L'épisode juge juste à 1 point près, proche à 2,5.",
    ],
    erreurs: [
      {
        valeur: 38,
        cause:
          "Le retour au niveau d'il y a un mois dès la réaffectation, comme si les comptes de Karim expliquaient toute la baisse : le délai de livraison de trois jours pèse encore jusqu'à la semaine 5.",
      },
      {
        valeur: 33.6,
        cause:
          "Le chiffre de la semaine dernière reporté tel quel, comme si rien ne bougeait en quatre semaines, ni la réaffectation ni le hasard.",
      },
      {
        valeur: 27.7,
        cause:
          "La baisse prolongée au même rythme : 4,4 points en trois semaines, environ 1,5 point par semaine, quatre semaines de plus (33,6 − 4 × 1,47). C'est la prévision de qui ne fait rien, et même l'attentiste tombe à 29,4 %.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "La transformation baisse, les grands comptes signent ailleurs : une remise de 5 % paraît le moyen le plus rapide de regagner les affaires perdues avant le point de vendredi avec Marc.",
      ceQuiLeDejoue:
        "La comparaison des prix montre l'agence à 1,5 % près de Brico-Pro Rhône sur les 40 références les plus vendues, et M. Ferreira dit « rien contre vos prix ». Le détail par commercial place la baisse sur les portefeuilles de Karim et de Julie, et Marc lui-même conseille de regarder « où ça décroche exactement ». La remise coûte 5 points de marge sur tout le segment des grands comptes, et le Groupe Delta demande aussitôt de l'étendre à ses trois filiales. Rejouée sur les trente tirages à la place de la réaffectation, elle perd 29 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Les artisans partent pour le délai : une remise de 3 % compense l'attente, sans dépendre du dépôt.",
      ceQuiLeDejoue:
        "La remise ne raccourcit pas le délai, et le contrôle de gestion le constate : « vos clients demandent toujours quand ils seront livrés ». La source « Stock disponible à l'agence » montrait 70 % des références courantes des artisans en stock et un retrait possible sous 2 heures, que peu de clients connaissent : le faire savoir ne coûte rien. Le créneau du lendemain coûte 1 point de marge, la remise 3 points. Rejouée sur les trente tirages à la place de la livraison garantie, la remise perd 23 k€ en moyenne et ne fait jamais mieux ; le retrait en agence, lui, ne perd que 0,4 k€.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Marc rappelle l'objectif de chiffre d'affaires à deux semaines de la fin : 5 % sur tout font du chiffre tout de suite.",
      ceQuiLeDejoue:
        "Thomas le dit dans sa réaction : plusieurs clients avancent des achats qu'ils prévoyaient au trimestre prochain. La remise s'applique à toutes les ventes des deux dernières semaines, alors que Julie signale une quinzaine de devis d'artisans qui dorment depuis plus de trois semaines, à relancer sans remise. Rejouée sur les trente tirages à la place des relances, la remise de fin de trimestre perd 5,7 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, la transformation de l'agence perdait 4,4 points. Qu'est-ce que le détail par commercial a changé à votre lecture ? Qu'aurait-on décidé en ne regardant que la moyenne ?",
    "Ceux qui ont retenu le prix comme cause principale : quelle source le montrait ? Que disaient la comparaison des prix et l'appel à M. Ferreira ?",
    "Garantir la livraison le lendemain coûte 1 point de marge ; faire connaître le retrait en agence sous 2 heures ne coûte rien. Sur les trente tirages, les deux finissent à 0,4 k€ l'un de l'autre. Pourquoi deux réponses si différentes donnent-elles presque le même résultat ?",
    "Julie a tenu jusqu'au bout sous le tirage n° 19, même chez ceux qui lui ont demandé de tenir, et ceux-là finissent 0,9 k€ au-dessus de ceux qui lui ont retiré six comptes. Pourtant, avec les comptes de Karim en plus, elle avait 45 % de risque de s'arrêter, contre environ 11 % si on lui retirait des comptes. Leur choix était-il bon ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Delta demande 8 % pour 40 000 € de commande. Combien rapportent les 40 000 € à 18 % de marge ? Combien coûtent 8 % sur ses 6 500 € de commandes habituelles par semaine, pendant quatre semaines ? Que change la contre-proposition à 4 %, que Delta accepte un peu plus d'une fois sur deux ?",
    "Le réflexe remise finit le trimestre avec 59,8 k€ de remises pour un budget de 40 k€ et 25,9 % de marge pour un mandat de 30 %. Combien de chiffre d'affaires en plus aurait-il fallu pour compenser ?",
    "Quelle règle gardez-vous avant d'accorder une remise ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Une agence vend 36 000 € par semaine aux grands comptes, à 26 % de marge brute. 1) Quelle marge brute dégage-t-elle par semaine sur ce segment ? 2) Une remise de 5 % retire 5 points de marge sur ce chiffre d'affaires et fait signer 5 % de chiffre d'affaires en plus. Quelle marge reste-t-il par semaine, et combien l'agence perd-elle ? 3) De combien le chiffre d'affaires devrait-il augmenter pour que la marge revienne à son niveau d'avant la remise ? 4) Autre piste : un portefeuille qui n'est plus suivi reçoit 60 000 € de demandes de devis par semaine et a perdu 11 points de transformation ; ses ventes sont à 36 % de marge. Combien de marge par semaine rapporte le fait de le faire suivre à nouveau ?",
    corrige:
      "1) 36 000 × 0,26 = 9 360 € par semaine. 2) Chiffre d'affaires de 36 000 × 1,05 = 37 800 €, à 21 % de marge : 7 938 €, soit 1 422 € de moins par semaine. 3) Il faut 9 360 / 0,21 ≈ 44 571 € de chiffre d'affaires, soit environ 23,8 % de plus : bien plus que les 5 % gagnés. 4) 60 000 × 0,11 = 6 600 € de ventes retrouvées par semaine, à 36 % : 2 376 € de marge, sans rien céder sur les prix.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 s'appuie sur le détail par commercial et sur l'appel au client perdu, et l'élève dit pourquoi la comparaison des prix écarte la piste du prix.",
    "La prévision de la transformation en semaine 4 est construite par un raisonnement écrit (point de départ, ce que la réaffectation rend, ce que le délai retient), et l'écart avec 31,4 % est expliqué.",
    "Chaque remise envisagée est chiffrée sur toutes les ventes qu'elle touche, et comparée à une réponse qui traite la cause (le suivi des devis, le délai de livraison, les devis en attente).",
    "La réponse à la surcharge de Julie est justifiée par ce qu'elle retire de sa charge, pas par la reconnaissance de son effort.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 19.",
  ],
  vigilance:
    "Le corrigé de 31,4 % est celui du modèle sous le tirage n° 19, qui est le plus défavorable des trente pour la semaine 4 : les sources de la semaine 1 permettent de raisonner (une remontée partielle depuis 33,6 %), pas de trouver ce chiffre. C'est la méthode qu'il faut corriger. Le modèle traite une remise comme des points de marge retirés au chiffre d'affaires, et refacture le délai de paiement au-delà de 55 jours à 1 500 € par jour : une convention interne de l'épisode, pas une règle de droit.",
};
