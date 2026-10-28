/**
 * FICHE ENSEIGNANT · ÉPISODE 14, LA RÉCLAMATION QUI ENFLE.
 *
 * Traiter une réclamation à sa source : la traçabilité par numéro de série,
 * le blocage d'un lot, le rappel ciblé et l'information franche des clients.
 * Le piège : un geste à chaque plainte, qui remet en circulation l'appareil qui cassera.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "reclamation-qui-enfle",
  formations: ["seconde-pro-gatl", "bac-pro-mcv", "bts-gpme"],
  programme: [
    "2de pro GATL · 5, Assurer le respect de la réglementation, des normes et traiter les dysfonctionnements",
    "Bac pro MCV · Bloc 2, Suivre les ventes",
    "BTS GPME · Bloc 1, Gérer la relation avec les clients et les fournisseurs de la PME",
  ],
  notion:
    "Une réclamation qui enfle se traite à sa source, pas plainte par plainte. L'erreur classique consiste à remplacer chaque appareil au comptoir avec un petit geste, pour garder le client, ou à l'inverse à tout retirer de la vente d'un coup. Dans l'épisode, Laure Bertin dirige la qualité et le SAV d'Arvel Distribution : le malaxeur Vantrel MX-160 revient 9 fois la semaine dernière contre 3 par semaine au printemps, 16 réclamations attendent, Pélissier Construction menace de partir et Vantrel nie tout défaut. Le relevé des numéros de série montre que 28 des 31 appareils revenus en six semaines viennent du lot L-2607, qui fait encore 60 % du stock des agences (120 appareils), et que les agences s'en servent pour remplacer les appareils cassés : chaque geste remet en circulation un appareil qui cassera. L'atelier trouve le même pignon usé jusqu'au métal, quand un appareil d'un autre lot à 400 heures est intact. L'élève découvre qu'il faut tracer et bloquer le lot, échanger les appareils de ceux qui les font travailler dur avant qu'ils ne cassent, dire la vérité aux clients, et qu'un fournisseur ne paie que devant un dossier par numéro de série.",
  objectifs: [
    "Je relie des réclamations à leur cause en relevant les numéros de série et le lot de fabrication.",
    "Je bloque un lot défectueux au lieu de retirer tout le produit ou de remplacer au cas par cas.",
    "Je compare le coût attendu d'une panne et celui d'un échange planifié pour décider d'un rappel ciblé.",
    "Je monte un dossier de garantie documenté pour obtenir la prise en charge du fournisseur.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de réclamation, de garantie, de satisfaction client et de traçabilité doivent avoir été vues en cours ; le calcul d'une probabilité simple sur plusieurs semaines aide pour le rappel. Le lot de fabrication et le rappel ciblé peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/reclamation-qui-enfle?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le nombre de MX-160 qui reviendront en panne en semaine 4 et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la réponse de la semaine 1 aux retours (remplacer, tracer et bloquer, tout retirer, attendre) et celle de la semaine 4 à Vantrel, où la classe se partage souvent entre le dossier et l'accord amiable. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 6 : tout le lot rappelé au lieu des seuls maçons et chapistes.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites le raisonnement : environ 2 à 3 retours ordinaires par semaine, et le reste du lot L-2607 ; bloquer le lot coupe le flux des remplacements, mais les quelque 100 appareils du lot déjà chez les clients continuent de casser. Sous le tirage n° 12, le modèle donne 8,9 retours en semaine 4 avec le lot bloqué, 12,7 pour ceux qui ont continué de remplacer en rayon. Vous faites expliquer les valeurs éloignées (3, 13).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 (échanger les dix malaxeurs de Pélissier, avoir de 10 %, haut de gamme, attendre) et de la semaine 4. Vous faites lire la vérification des appareils de Pélissier : tous du lot, et un échange pris au hasard en rayon a plus d'une chance sur deux de lui rendre le même problème si le lot n'est pas bloqué. Pour Vantrel, vous faites lire les conditions de garantie : 80 % des coûts directs sur dossier documenté, numéros de série à l'appui.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Trouver le lot, puis agir » finit 31,3 k€ sous le budget de non-qualité de 55 k€, « Un geste à chaque plainte » 19,9 k€ au-delà, et l'attentisme 65 k€ au-delà ; sur les trente tirages, la première méthode reste sous le budget 30 fois, les deux autres jamais. Vous séparez la qualité d'une décision de son résultat sur la semaine 10 : le lot L-2611 mis en rayon sans contrôle a gagné 1,2 k€ sous le tirage de la classe, parce qu'il était bon.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les quatre temps du traitement d'une réclamation qui enfle : savoir ce qui casse (lot, usage, client) avant d'agir ; couper le flux à la source en bloquant le lot ; échanger avant la panne ceux pour qui la panne coûte cher ; dire aux clients ce qui se passe, et prouver au fournisseur ce qui casse. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 9,
    etapes: [
      "Alerte du lundi : 9 retours la semaine dernière, contre 3 par semaine au printemps. Les retours ordinaires des autres lots, sous garantie normale, sont de l'ordre de 2 à 3 par semaine ; le reste vient du lot.",
      "Source « Relever les numéros de série » : 28 des 31 appareils revenus en six semaines sont du lot L-2607, qui fait encore 60 % du stock des agences (120 appareils sur 200), et les agences s'en servent pour remplacer. Tant que le lot reste en rayon, chaque panne remplacée et chaque vente remettent un appareil du lot chez un client : c'est ce qui fait monter le flux.",
      "Si le lot est bloqué dès la semaine 2, plus aucun appareil du lot ne sort. Mais la centaine d'appareils du lot déjà chez les clients (50 chez des maçons et chapistes, 46 chez d'autres métiers, 10 chez Pélissier) continue de casser, quelques-uns chaque semaine, et chacun est remplacé par un appareil sain. Les dix de Pélissier, échangés en semaine 3 contre des appareils sains, sortent du compte. Le flux reste donc autour de 9 et commence à peine à baisser.",
      "Sous le tirage n° 12, le modèle donne 9,7 retours en semaine 2, 8,3 en semaine 3 et 8,9 en semaine 4, une semaine de chantiers plus chargée. Pour ceux qui ont continué de remplacer en rayon ou d'attendre, il en donne 12,7.",
      "L'épisode juge juste à 2 retours près, proche à 3,5. Selon les trente tirages du bilan, la valeur va de 5,8 à 9,7 avec le lot bloqué.",
    ],
    erreurs: [
      {
        valeur: 3,
        cause:
          "Le retour au niveau du printemps, comme si bloquer le lot en rayon arrêtait aussi les pannes des appareils déjà vendus : une centaine restent chez les clients et cassent encore.",
      },
      {
        valeur: 13,
        cause:
          "La tendance des dernières semaines prolongée (de 3 à 9 retours, environ un de plus chaque semaine), sans voir que le blocage coupe le flux des remplacements : c'est ce que voient ceux qui remplacent en rayon (12,7), pas ceux qui ont bloqué le lot.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le client repart content tout de suite : on échange au comptoir avec un avoir de 50 €, et on ne perd personne.",
      ceQuiLeDejoue:
        "Le relevé des numéros de série le montrait : 28 retours sur 31 viennent du lot L-2607, qui fait 60 % du stock en rayon, et c'est avec lui que les agences remplacent. Sonia Bakri le voit dès la première semaine : « j'en revois déjà qui reviennent avec l'appareil qu'on leur a donné il y a quinze jours ». Sans numéros relevés, il n'y a pas non plus de dossier pour Vantrel. Rejoué sur les trente tirages à la place du blocage du lot, il perd 44,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi: "Plus aucun risque : on retire tous les MX-160 de la vente et on rembourse.",
      ceQuiLeDejoue:
        "Thibault Rousset, après démontage : « Sur un MX-160 d'un autre lot qui a 400 heures de chantier, le pignon est intact. Ce n'est pas le modèle, c'est la pièce de ce lot. » Retirer tout prive les agences des 80 appareils sains et des ventes d'une trentaine de malaxeurs par semaine, alors que bloquer le seul lot coûte 1 500 €. Rejoué sur les trente tirages, le retrait perd 38,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi: "Pélissier est fâché : un avoir de 10 % sur ses achats du trimestre montre qu'on le prend au sérieux.",
      ceQuiLeDejoue:
        "Ses dix malaxeurs sont tous du lot L-2607 : avec le lot bloqué, les échanger contre des appareils des autres lots, qui tiennent, coûte 10 × 270 = 2 700 €, contre 6 000 € pour l'avoir, qui lui laisse les mêmes appareils. Pélissier le dit : « mes chapes ne se coulent pas avec des avoirs ». Rejoué sur les trente tirages à la place de l'échange, l'avoir perd 14,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi: "Un modèle haut de gamme d'une autre marque : là, Pélissier est sûr de ne plus tomber en panne.",
      ceQuiLeDejoue:
        "Le problème est la pièce d'un lot, pas le MX-160 : les appareils des autres lots tiennent. Dix appareils à 560 € coûtent 5 600 €, sans retour possible, pour le même résultat qu'un échange à 2 700 €. Rejoué sur les trente tirages à la place de l'échange, le haut de gamme perd 8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi: "Rappeler tous les MX-160 vendus depuis l'été, tous lots confondus : on est sûr de n'en oublier aucun.",
      ceQuiLeDejoue:
        "Le croisement des ventes avec le métier des clients le disait : les 150 MX-160 des autres lots vendus depuis l'été n'ont pas de problème. Les inspecter coûte 150 × 60 = 9 000 € pour des appareils sains, et échanger ceux du lot chez les clients occasionnels, qui ne cassent qu'une fois sur cinquante par semaine, paie des appareils qui auraient tenu. Rejoué sur les trente tirages à la place du rappel des maçons et chapistes, il perd 11,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi: "Le bruit court sur le groupe d'artisans : un bon d'achat de 40 € à chaque client qui se manifeste calme les choses.",
      ceQuiLeDejoue:
        "Sur le groupe, personne ne réclame de geste commercial ; les questions sont « est-ce que le mien va casser ? », « comment je le sais ? », « qui paie ? », et un maçon écrit : « Ce qui m'énerve, ce n'est pas la panne, c'est qu'on ne m'ait rien dit. » Le courrier aux acheteurs du lot coûte 600 €. Les clients prennent le bon et reposent la question. Rejoué sur les trente tirages à la place du courrier, le bon d'achat perd 4,2 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu des clients qui abusent de la garantie, d'autres un modèle mal conçu, d'autres un lot. Quelle source permettait de trancher, et qu'a-t-elle coûté ?",
    "Pourquoi un remplacement au comptoir, geste commercial sincère, fait-il monter les retours des semaines suivantes ? Que se passe-t-il quand le lot défectueux fait 60 % du rayon ?",
    "Un maçon du lot casse une fois sur dix par semaine, un client occasionnel une fois sur cinquante. Pourquoi rappeler les uns et pas les autres ? Que coûte une panne sur chantier comparée à un échange planifié ?",
    "Sous le tirage de la classe, Vantrel a payé 80 % des coûts devant le dossier, comme 24 fois sur 30. L'accord amiable à 40 % fait mieux 6 fois sur 30, quand Vantrel refuse le dossier. Lequel choisissez-vous, et que faut-il avoir fait en semaine 1 pour que le dossier tienne ?",
    "Sous le tirage n° 12, Pélissier est resté chez Arvel, quelle que soit la réponse qu'on lui a faite : l'appel courtois n'y a coûté que 1 k€. En moyenne sur les trente tirages, il en coûte 14,4 k€. Que vaut une décision jugée sur ce seul tirage ?",
    "Ceux qui ont mis le lot L-2611 en rayon sans contrôle ont gagné 1,2 k€ sous le tirage de la classe, et le contrôle au banc fait moins bien 19 fois sur 30. Il rapporte pourtant 6,7 k€ de plus en moyenne : pourquoi ? Qu'auriez-vous fait d'un lot dont Vantrel n'avait aucun rapport d'essai ?",
    "Quelle règle gardez-vous face à des réclamations qui enflent ? Formulez-la en une phrase, avec le lot et le client dedans.",
  ],
  prolongement: {
    enonce:
      "Un lot de perceuses défectueuses est chez deux sortes de clients : 40 chez des professionnels, où chaque appareil casse avec une chance sur dix chaque semaine, et 60 chez des particuliers, avec une chance sur cinquante. Une panne coûte 300 € (appareil et course), plus 260 € de prêt et de dédommagement chez un professionnel arrêté. Un échange planifié coûte 270 €. On raisonne sur 13 semaines. 1) Quelle est la probabilité qu'un appareil casse dans les 13 semaines, pour chaque sorte de client ? 2) Quel est le coût attendu des pannes, par appareil puis par groupe, si l'on ne rappelle rien ? 3) Comparez trois choix : ne rien rappeler, rappeler tout le lot, rappeler les seuls professionnels.",
    corrige:
      "1) Professionnels : 1 − 0,9^13 ≈ 1 − 0,254 = 0,746, soit environ 75 %. Particuliers : 1 − 0,98^13 ≈ 1 − 0,769 = 0,231, soit environ 23 %. 2) Professionnels : 0,746 × (300 + 260) ≈ 418 € par appareil, soit environ 16 700 € pour 40. Particuliers : 0,231 × 300 ≈ 69 € par appareil, soit environ 4 160 € pour 60. 3) Ne rien rappeler : environ 16 700 + 4 160 = 20 860 €. Tout rappeler : 100 × 270 = 27 000 €. Rappeler les seuls professionnels : 40 × 270 = 10 800 €, plus les pannes attendues des particuliers, environ 4 160 €, soit environ 14 960 €. Le rappel ciblé est le moins cher : un échange de 270 € vaut la peine là où la panne attendue coûte plus (418 €), pas là où elle coûte moins (69 €).",
  },
  evaluation: [
    "La prévision de la semaine 1 distingue le flux que coupe le blocage du lot des appareils déjà vendus, qui continuent de casser.",
    "Le diagnostic s'appuie sur les numéros de série et le démontage : un lot, pas un modèle, pas des clients qui abusent.",
    "La décision de rappel est justifiée par une comparaison chiffrée entre le coût attendu d'une panne et celui d'un échange, selon l'usage du client.",
    "La réponse au fournisseur et l'information des clients reposent sur la preuve et la franchise plutôt que sur des gestes commerciaux.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous le tirage de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "La prise en charge de 80 % par Vantrel relève de ses conditions contractuelles de garantie, inventées par l'épisode ; elle ne remplace pas les garanties légales dues aux clients (conformité, vices cachés), qu'un enseignant de droit pourra rappeler. Le rappel est présenté ici comme un choix économique : si un défaut menaçait la sécurité des utilisateurs, l'information et le rappel pourraient devenir des obligations.",
};
