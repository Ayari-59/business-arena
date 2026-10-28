/**
 * FICHE ENSEIGNANT · ÉPISODE 100, LE LOT QU'IL FAUT PEUT-ÊTRE RAPPELER.
 *
 * La gestion d'une alerte sanitaire : protéger d'abord, sans attendre la
 * preuve, puis délimiter le périmètre sur les faits (les enregistrements de
 * la ligne, les échantillons conservés), et chercher la source au lieu de
 * nettoyer plus fort. Le piège : attendre la confirmation pour ne pas affoler
 * les clients, ou tout rappeler par peur. Les chiffres du hasard de la classe
 * sont ceux de la graine 11, les moyennes celles des 30 tirages du bilan.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "lot-a-rappeler",
  formations: ["bts-gpme", "but-gea"],
  programme: [
    "BTS GPME · Bloc 2, Participer à la gestion des risques de la PME",
    "BUT GEA · Analyser les processus de l'organisation dans son environnement",
  ],
  notion:
    "Une alerte sanitaire se gère sous incertitude : le résultat n'est pas confirmé, les produits sont déjà chez les clients, et chaque heure en met davantage dans les assiettes. Deux erreurs se répondent : attendre la preuve pour ne pas affoler les enseignes, ou tout retirer par peur, sans périmètre. Le bon geste protège d'abord ce qui peut l'être, informe l'autorité, puis délimite le périmètre sur les faits. Dans l'épisode, un vendredi à 17 h, l'autocontrôle du lot L3-279-K de fromage blanc de l'usine de Pontivy de la Laiterie de Kerbrélan revient présomptif positif à Listeria monocytogenes ; la confirmation arrivera lundi soir, environ trois présomptifs sur quatre sont confirmés, et deux palettes expédiées sur trois sont encore en entrepôt ou en magasin ce soir, quatre sur dix lundi. Les enregistrements de la ligne bornent le périmètre : six lots, 37 palettes, remplis entre deux nettoyages complets, car un rinçage ne borne rien. L'élève découvre que la loi demande d'agir dès qu'on a des raisons de penser qu'un aliment n'est pas sûr, que les échantillons conservés disent jusqu'où va le risque mieux que la peur, et qu'une souche installée dans un joint se cherche en zone 1 au lieu de se noyer sous la désinfection.",
  objectifs: [
    "Je délimite le périmètre d'un retrait à partir des enregistrements de production et des nettoyages complets d'une ligne.",
    "J'agis sous incertitude en protégeant d'abord ce qui peut l'être, et j'informe l'autorité compétente comme le texte le demande.",
    "J'utilise une information disponible (échantillons conservés, prélèvements ciblés) pour élargir ou lever un retrait sur des faits.",
    "Je distingue un traitement qui cherche la source d'un traitement qui nettoie la surface, et je relie un incident à la révision du plan de contrôle.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de traçabilité, de lot, de risque et de non-conformité doivent avoir été vues ; une addition suffit pour le calcul. Le retrait, le rappel, le présomptif et la confirmation d'une analyse, le nettoyage en place et le zonage des prélèvements peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/lot-a-rappeler?hasard=11 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez la situation en deux phrases (un vendredi à 17 h, un présomptif positif, les palettes parties) sans parler de périmètre, et vous demandez de noter sur papier le nombre de palettes calculé en semaine 1 et la décision prise ce soir-là.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la décision du vendredi soir (attendre, le seul lot, les six lots, un mois) et celle de la semaine 4 sur la zone de conditionnement. Un binôme qui a fini tôt reprend les enregistrements de la ligne et dessine sur une frise les deux NEP, les deux rinçages, le joint changé et les six lots.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe à partir des enregistrements de la ligne 3 et du guide de gestion des alertes : les lots entre la NEP du lundi et celle du jeudi, rinçages compris. Vous faites expliquer les valeurs éloignées (7, 31 ou 61), puis vous faites dire pourquoi les six palettes encore à quai comptent : bloquer, c'est aussi ne pas expédier.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix du vendredi soir, de la semaine 2 (le redémarrage) et de la semaine 4 (la source). Pour le vendredi, vous faites lire l'article 19 du règlement européen et le message d'Ysée Bescond : deux palettes sur trois encore en circulation ce soir, quatre sur dix lundi. Pour la semaine 4, vous faites lire l'historique environnemental : aucun prélèvement en zone 1 depuis le printemps, et une souche installée dans un joint qui survit aux NEP.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 11, le résultat est confirmé et la souche est installée dans la remplisseuse : la méthode coûte 206 k€, tout retirer 270 k€, attendre 477 k€, avec une DDPP prévenue trop tard, une suspension chez Celtis et la presse. Vous faites ensuite lire les trente tirages : attendre, redémarrer comme avant ou désinfecter sans démonter font mieux que la méthode une fois sur deux, quand le présomptif n'est pas confirmé ou que la contamination était ponctuelle. C'est le moment de séparer la qualité d'une décision de son résultat, et de rappeler qu'une obligation légale ne se joue pas aux probabilités.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : protéger d'abord, délimiter sur les faits, chercher la source. Vous la déclinez en trois gestes : bloquer et informer dès qu'on a des raisons de penser qu'un aliment n'est pas sûr ; borner le périmètre par les nettoyages complets et l'ajuster par les échantillons conservés ; prélever là où la souche peut vivre, en zone 1. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 37,
    etapes: [
      "Source « Tirer les enregistrements de la ligne 3 et des NEP de la semaine » : NEP complètes le lundi à 5 h et le jeudi à 5 h ; entre les deux, deux rinçages à l'eau chaude aux changements de format, mardi et mercredi, qui ne sont pas des nettoyages.",
      "Source « Relire le règlement sur la sécurité des aliments et le guide de gestion des alertes » : à défaut d'éléments plus précis, le périmètre couvre tous les lots produits entre deux nettoyages-désinfections complets ; un rinçage ne le borne pas.",
      "Lots remplis entre les deux NEP : L3-278-K, 7 palettes ; L3-278-C, 5 ; L3-279-K, 7 (le lot présomptif) ; L3-279-O, 5 ; L3-280-K, 7 ; L3-280-C, 6, encore à quai.",
      "Palettes à bloquer et retirer : 7 + 5 + 7 + 5 + 7 + 6 = 37, dont 6 à bloquer à quai et 31 à retirer chez Celtis et Opaline. Le chiffre ne dépend pas du hasard ; l'épisode le juge juste à 1 palette près, proche à 5.",
      "Les 24 palettes remplies après la NEP du jeudi sont hors du périmètre : un nettoyage complet les sépare du lot présomptif. Les lots voisins se jugent ensuite sur les échantillons conservés, pas par précaution.",
    ],
    erreurs: [
      {
        valeur: 7,
        cause:
          "Le seul lot présomptif L3-279-K : une contamination après pasteurisation touche tout ce que la ligne a rempli entre deux nettoyages complets, et les rinçages du mardi et du mercredi ne bornent rien.",
      },
      {
        valeur: 31,
        cause:
          "Les six palettes du L3-280-C, encore à quai, sont oubliées parce qu'elles ne sont pas parties : il faut aussi les bloquer, sinon elles partent lundi.",
      },
      {
        valeur: 61,
        cause:
          "Les 24 palettes remplies après la NEP du jeudi sont ajoutées : un nettoyage-désinfection complet borne le périmètre, et ces lots ne s'élargissent que si les échantillons conservés le demandent.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Baptistin Haddadi le dit : un présomptif n'est pas un résultat, et appeler Celtis un vendredi soir pour rien, c'est risquer le contrat du fromage blanc à sa marque.",
      ceQuiLeDejoue:
        "L'article 19 du règlement européen : l'exploitant qui a des raisons de penser qu'une denrée mise sur le marché n'est pas sûre engage immédiatement son retrait et en informe les autorités ; le laboratoire, lui aussi, transmettra un résultat préjudiciable. La microbiologiste confirme environ trois présomptifs sur quatre, et Ysée Bescond chiffre ce que coûte l'attente : deux palettes sur trois encore en circulation ce soir, quatre sur dix lundi. Sous le tirage n° 11, attendre coûte 33 k€ de plus ; rejoué sur les trente tirages, 25 k€ de plus en moyenne, même s'il fait mieux 14 fois sur 30, quand la confirmation ne vient pas.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Rappeler tout le fromage blanc du dernier mois, c'est être sûr de n'avoir rien oublié : personne ne pourra dire qu'on a minimisé.",
      ceQuiLeDejoue:
        "Les enregistrements de la ligne bornent le périmètre à 37 palettes entre deux NEP complètes, et Efflam Jézéquel le rappelle : le périmètre se prend dans les enregistrements, pas dans les craintes. Un rappel des consommateurs, publié sur RappelConso, s'ajoute au retrait quand le produit a pu atteindre le consommateur et que le retrait ne suffit pas ; 240 palettes et un avis publié un vendredi soir ont mis la marque dans la presse avant minuit. Rejoué sur les trente tirages à la place des six lots, le rappel d'un mois coûte 56 k€ de plus en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "La NEP de 5 h est faite, 60 palettes sont commandées et Celtis attend mercredi : une rupture, ce sont des pénalités et une place en rayon perdue.",
      ceQuiLeDejoue:
        "L'historique environnemental : aucun prélèvement en zone 1 depuis le printemps, Listeria spp. deux fois sur le siphon sous la remplisseuse, et une souche installée dans un joint survit aux NEP. Zbigniew Galliou se souvient du joint fendu changé le mardi. La libération positive coûte 2 500 € par semaine et la campagne de 40 prélèvements 3 500 €. Sous le tirage n° 11, la souche était dans la remplisseuse et redémarrer comme avant coûte 91 k€ de plus ; rejoué sur les trente tirages, 27 k€ de plus en moyenne, même s'il fait mieux 19 fois sur 30.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Un deuxième communiqué, ce serait avouer qu'on ne maîtrise rien : on s'en tient au périmètre annoncé.",
      ceQuiLeDejoue:
        "Les échantillons conservés : un pot de chaque lot gardé jusqu'à sa DLC, 13 analyses à 180 €, résultats mercredi. Une souche installée se retrouve presque toujours dans les lots voisins, une contamination ponctuelle reste dans les lots du mardi : l'analyse dit lequel des deux. Tréphine Laouénan demande avant toute remise en rayon si le périmètre tient. Sous le tirage n° 11, cinq des huit lots voisins étaient positifs, et s'en tenir au périmètre coûte 76 k€ de plus ; sur les trente tirages, 19 k€ de plus en moyenne, même s'il fait mieux 12 fois.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Trois semaines de production depuis la dernière analyse négative : plus personne ne pourra dire que c'était trop peu.",
      ceQuiLeDejoue:
        "Ysée Bescond chiffre l'extension : 180 palettes dont la plupart des pots sont mangés, des remboursements sans rien récupérer, et 50 € par magasin dans 230 magasins à chaque opération. Les échantillons conservés coûtent 2 340 € et disent quels lots sont touchés. Rejoué sur les trente tirages à la place des analyses, le retrait de trois semaines coûte 48 k€ de plus en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Une désinfection choc le samedi, la ligne repart lundi : démonter la remplisseuse, c'est deux jours d'arrêt, et chaque jour se voit chez les enseignes.",
      ceQuiLeDejoue:
        "Klervi Nédélec relit les résultats : une désinfection sans démonter tue ce qui est en surface, rarement ce qui est dans un joint, une fois sur cinq. Rechercher la source coûte 9 000 € et deux jours, et trouve une niche environ six fois sur sept quand une campagne a dit où chercher. Efflam Jézéquel décrit une récidive : nouveau retrait, nouvel avis de rappel, mise en demeure de la DDPP. Sous le tirage n° 11, la niche était là et la désinfection coûte 137 k€ de plus ; sur les trente tirages, 34 k€ de plus en moyenne, même si elle fait mieux 19 fois sur 30.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "Un beau prospectus en novembre, 30 % de remise sur le fromage blanc : les acheteurs de Celtis seront contents, et l'incident sera oublié.",
      ceQuiLeDejoue:
        "Tréphine Laouénan le dit : la décision appartient à la direction qualité de Celtis, pas à ses acheteurs, et elle veut voir la traçabilité, les résultats, la source et le plan d'actions ; elle a suspendu l'an dernier le fournisseur qui contestait ses frais de retrait. L'opération coûte 18 000 €, et la direction qualité maintient sa demande d'audit. Rejouée sur les trente tirages à la place de l'audit reçu, la promotion coûte 23 k€ de plus en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "Le vendredi à 17 h, le résultat n'est qu'un présomptif. Qu'est-ce que l'article 19 du règlement demande à l'exploitant, et à partir de quand ? Que change le fait que deux palettes sur trois soient encore en circulation ce soir, quatre sur dix lundi ?",
    "Pourquoi le périmètre va-t-il de la NEP du lundi à celle du jeudi, et pas du lot présomptif seul ? Qu'est-ce qu'un rinçage ne fait pas, qu'une NEP complète fait ?",
    "Les échantillons conservés coûtaient 2 340 €. Sous le tirage n° 11, qu'ont-ils montré, et qu'auriez-vous retiré sans eux ? Pourquoi est-ce une meilleure base qu'une extension par précaution ?",
    "Attendre la confirmation, redémarrer comme avant, désinfecter sans démonter : chacune de ces décisions fait mieux que la méthode à peu près une fois sur deux sur les trente tirages, et coûte plus en moyenne. Qu'est-ce qui distingue la qualité d'une décision de son résultat ? Et une obligation légale peut-elle se décider aux probabilités ?",
    "La souche était dans le corps d'une vanne de la remplisseuse, alors que le plan de prélèvements regardait surtout les sols et les siphons. Que dit l'auditeur IFS de mars, et que doit changer le plan d'échantillonnage ?",
    "Celtis demande un audit, Baptistin propose une promotion. Qui décide chez Celtis, et sur quoi ? Pourquoi la promotion ne répond-elle pas à la question posée ?",
    "Quelle règle gardez-vous pour le prochain présomptif positif ? Formulez-la en une phrase, avec le périmètre dedans.",
  ],
  prolongement: {
    enonce:
      "Sur la ligne 2 d'une fromagerie, les nettoyages-désinfections complets ont lieu le mardi à 6 h et le vendredi à 6 h ; le mercredi, un rinçage à l'eau chaude au changement de format. Lots remplis : mardi, M1 (8 palettes) et M2 (4) ; mercredi, E1 (8) et E2 (4) ; jeudi, J1 (8), dont 3 palettes encore à quai ; vendredi après la NEP, V1 (6). L'autocontrôle du lot E1 revient présomptif positif à Listeria monocytogenes. 1) Quels lots et combien de palettes faut-il bloquer et retirer ? Combien sont encore à quai ? 2) Chaque opération de retrait coûte 50 € par magasin dans les 150 magasins de l'enseigne. Que coûte une opération, et que coûterait une seconde si le périmètre devait être élargi après coup ? 3) Faire analyser les échantillons conservés des cinq lots du périmètre et des deux lots voisins coûte 180 € l'analyse : combien, et que permet ce montant ?",
    corrige:
      "1) Les lots remplis entre la NEP du mardi et celle du vendredi, rinçage compris : M1, M2, E1, E2 et J1, soit 8 + 4 + 8 + 4 + 8 = 32 palettes, dont 3 à bloquer à quai et 29 à retirer. V1 est séparé par la NEP du vendredi. 2) 150 × 50 = 7 500 € par opération ; une seconde opération coûterait 7 500 € de plus. 3) 7 × 180 = 1 260 € : moins du cinquième d'une opération de retrait, pour savoir si la contamination est installée (lots voisins positifs) ou ponctuelle, et élargir ou lever le retrait sur des faits, avec l'accord de l'autorité.",
  },
  evaluation: [
    "Le périmètre est calculé juste (six lots, 37 palettes, entre deux nettoyages complets, palettes à quai comprises) à partir des enregistrements de la ligne et de la règle du guide.",
    "La décision du vendredi soir est argumentée par l'obligation de l'exploitant et par la circulation des produits, et non par le seul coût commercial.",
    "L'extension ou la levée du retrait s'appuie sur une information obtenue (échantillons conservés, prélèvements), pas sur la précaution ou la crainte du communiqué.",
    "Le traitement de la ligne et le plan de contrôle proposé cherchent la source (zone 1, recherche à chaque positif), et l'élève dit pourquoi une désinfection de surface ne suffit pas.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 11.",
  ],
  vigilance:
    "L'épisode reprend les articles 18 et 19 du règlement (CE) n° 178/2002 sur la traçabilité, le retrait et l'information des autorités, la distinction entre retrait et rappel, l'obligation du laboratoire de transmettre un résultat préjudiciable, et une règle de périmètre « entre deux nettoyages-désinfections complets » qu'il attribue au guide de gestion des alertes : un professionnel de la qualité en agroalimentaire ou un enseignant de sciences et technologies des aliments doit relire ces règles, leur formulation exacte et leurs mises à jour (procédure de rappel, publication sur le site public des rappels de produits) avant de les présenter comme telles. Les fréquences (trois présomptifs sur quatre confirmés, une niche trouvée six fois sur sept) sont des hypothèses de l'épisode. Le bilan chiffre l'alerte en euros : il faut rappeler aux élèves que la santé des consommateurs n'est pas une ligne de ce compte, et qu'une obligation légale ne se juge pas à son coût moyen sur trente tirages.",
};
