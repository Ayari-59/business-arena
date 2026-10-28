/**
 * FICHE ENSEIGNANT · ÉPISODE 77, EMBAUCHER OU LOUER DES FREELANCES.
 *
 * Dimensionner un noyau permanent sur la demande sûre et couvrir la part
 * incertaine en flexibilité : un CDI est un coût fixe, un freelance un coût
 * variable plus cher au jour, et le choix se fait contrat par contrat.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "freelances-ou-embauches",
  formations: ["dcg", "but-gea", "bts-gpme"],
  programme: [
    "DCG · UE 11, Contrôle de gestion",
    "BUT GEA · Aider à la prise de décision",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
  ],
  notion:
    "Une demande qui double ne dit pas combien de personnes embaucher : il faut séparer ce qu'on est sûr de vendre dans un an de ce qui peut retomber. L'erreur classique consiste à recruter sur la demande totale, huit CDI pour huit consultants qui manquent, ou à l'inverse à tout louer parce que c'est sans engagement. Dans la practice Data d'Atlas Conseil, Ruben Esnault a 38 ETP de missions pour 30 consultants ; mais le carnet, ligne à ligne, ne porte que 33 ETP sur des contrats-cadres, des marchés notifiés et des clients récurrents, et les 5 autres tiennent à une échéance réglementaire que Bruxelles peut reporter le 26 mars (environ 45 %). Un consultant en CDI coûte 83 200 € par an, en mission ou non, soit 528 € par jour facturé à 75 % d'occupation ; un freelance 770 €, et rien entre deux missions. L'élève découvre qu'on embauche le noyau durable, qu'on loue la vague en payant la flexibilité, qu'on ne met pas un freelance là où le client ne peut pas s'en passer, et qu'on change d'avis quand une demande devient ferme.",
  objectifs: [
    "Je sépare, dans un carnet de commandes, la demande durable de la demande incertaine, en lisant la nature et l'échéance de chaque contrat.",
    "Je compare le coût d'un salarié, fixe, et celui d'un prestataire, variable, au jour facturé et selon l'occupation.",
    "Je calcule ce qu'un recrutement de plus rapporte en espérance quand la demande dépend d'un événement incertain.",
    "Je juge un engagement commercial (une remise contre une durée) sur ce qu'il coûte si la demande retombe.",
  ],
  prerequis:
    "Les notions de charges fixes et variables, de coût salarial chargé et de taux d'occupation doivent être connues. L'espérance mathématique d'un gain (montant × probabilité, sommé sur les issues) se rappelle en début de séance ; la distinction entre demande durable et demande incertaine se découvre en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/freelances-ou-embauches?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, la part durable de la demande, en consultants équivalents temps plein, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (huit CDI, trois CDI et des freelances, tout en freelances, rien), celle de la semaine 6 sur l'extension de Kervalis et celle de la semaine 8 sur les quatre consultants de Kéroual. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 8.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir du carnet de missions : 10 ETP de plateforme chez Kervalis, 7 au GHT, 6 chez Pellerau, 4 à la Mutuelle du Lay, 6 chez les clients récurrents, soit 33 ETP ; les 2 ETP du bon de commande de Kervalis et les 3 ETP des ETI tiennent à l'échéance du 30 juin. Vous faites expliquer les valeurs éloignées (38, 35 ou 27), puis vous en tirez le plan : 33 − 30 = 3 CDI.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 1 et vous faites comparer au tableau le coût d'un jour facturé : 83 200 / 157,5 ≈ 528 € pour un CDI, 770 € pour un freelance, pour un TJM de vente de 950 €. Vous enchaînez sur la semaine 6, où l'extension de Kervalis devient ferme jusqu'en 2028 et fait passer la demande durable à 35 ETP, puis sur la semaine 8 : ce qu'un consultant de plus ferait d'avril à décembre selon l'issue du vote, et pourquoi on appelle les clients avant d'embaucher.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 12, « Dimensionner le noyau sur la demande sûre » fait 3 049 k€ de marge attendue sur l'année, « Embaucher parce que la demande est là » 2 595 k€, et l'attentisme 2 721 k€ : les embauches sur la demande totale font moins bien que ne rien faire. Vous montrez ensuite qu'en semaine 1, les huit CDI font mieux 6 fois sur 30, quand la demande s'élargit, et perdent 160 k€ en moyenne. Vous faites dire ce qui distingue la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : compter les contrats avant de compter les gens. Vous la déclinez en trois gestes : embaucher la demande sûre dans un an, louer la part qui peut retomber sans s'engager sur sa durée, et garder ses salariés sur les clients qui ne peuvent pas se passer d'eux. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 33,
    etapes: [
      "Source « Reprendre le carnet de missions, ligne à ligne, avec Maïmouna » : 38 ETP à staffer cette semaine, à trier selon ce qui porte chaque ligne.",
      "Durable : Banque Kervalis, plateforme de données, 10 ETP (contrat-cadre jusqu'en 2028) ; GHT Estuaire-Vendée, 7 ETP (marché notifié jusqu'en 2027) ; Pellerau Industries, 6 ETP (contrat annuel renouvelé depuis six ans) ; Mutuelle du Lay, 4 ETP (contrat-cadre de deux ans) ; six clients récurrents, 6 ETP. Total : 10 + 7 + 6 + 4 + 6 = 33 ETP.",
      "Incertain : le bon de commande de mise en conformité de Kervalis, 2 ETP, et les missions des quatre ETI, 3 ETP, soit 5 ETP qui tiennent toutes à l'échéance du 30 juin, que le vote du 26 mars peut reporter.",
      "Avec 30 consultants en poste, le noyau manque de 33 − 30 = 3 CDI ; les 5 ETP de la vague se louent. Le chiffre ne dépend pas du hasard. L'épisode le juge juste à 0,5 ETP près, proche à 2 ETP.",
    ],
    erreurs: [
      {
        valeur: 38,
        cause:
          "Toute la demande prise pour durable : les 5 ETP de mise en conformité s'arrêtent avec l'échéance réglementaire, et pourraient s'arrêter dès avril.",
      },
      {
        valeur: 35,
        cause:
          "Les 12 ETP de Kervalis comptés ensemble (12 + 7 + 6 + 4 + 6) : 2 d'entre eux sont un bon de commande de mise en conformité qui s'arrête au 30 juin.",
      },
      {
        valeur: 27,
        cause:
          "Les seuls contrats-cadres et marchés (10 + 7 + 6 + 4) : les six clients récurrents, 6 ETP, reviennent chaque année et font partie de la demande sûre.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Il manque huit consultants, la présidente ne veut pas une mission chez Halden faute de monde, et un recrutement prend deux à trois mois : ouvrir huit postes tout de suite paraît la seule façon de suivre la demande.",
      ceQuiLeDejoue:
        "Le carnet ne porte que 33 ETP durables pour 30 en poste ; les 5 autres tiennent à l'échéance du 30 juin, que la note de Maître Ruth Vauchelet donne reportée à environ 45 %, et la vague s'arrêterait dès avril. Un CDI coûte 83 200 € par an, en mission ou en intercontrat, et le cabinet prévient qu'au-delà de trois postes à la fois ses délais s'allongent. Fantine Pennec le dit : « Ce que tu es sûr de vendre dans un an, tu l'embauches ; le reste, tu le loues. » Rejoués sur les trente tirages à la place de trois CDI et des freelances, les huit recrutements perdent 160 k€ en moyenne ; ils font mieux 6 fois sur 30, quand l'échéance est élargie.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Depuis la semaine 1, les freelances couvrent ce qui manque, vite et sans engagement : deux freelances de plus pour l'extension, c'est la même solution, démarrage en semaine 9.",
      ceQuiLeDejoue:
        "L'avenant n° 3 rend ces 2 ETP fermes jusqu'en décembre 2028, révisables seulement à la hausse : la demande durable passe de 33 à 35 ETP, et la question de Victoire Lanoë (« Et ça, c'est certain ? ») a sa réponse. Garder un freelance sur ce poste coûte 1 095 € de marge par semaine de plus qu'un CDI ; convertir un freelance coûte 8 400 € et il est en poste dès la semaine 9, sept fois sur dix. Rejoué sur les trente tirages à la place de la conversion, le freelance de plus perd 67 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Quatre seniors disponibles en avril, sans frais de cabinet ni préavis, avec la demande qu'on a : la présidente « ne voit pas ce qu'il y a à réfléchir ».",
      ceQuiLeDejoue:
        "Le calcul de l'occupation montre que les contrats-cadres sont couverts : un consultant de plus irait sur la vague, avec 0 semaine de mission sur 39 si l'échéance est reportée (environ 45 %), 13 si elle est maintenue (35 %), 39 si elle est élargie (20 %), soit environ 12 semaines en moyenne, pour 93 350 € chargés par an chacun. Maïmouna rappelle que les clients qui avaient budgété la suite avant un vote ne s'étaient trompés qu'une fois sur dix : deux jours d'appels, 3 800 €, disent ce qui est sûr. Rejouées sur les trente tirages à la place des appels, les quatre embauches perdent 104 k€ en moyenne ; elles font mieux 6 fois sur 30.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Halden Partners annonce quarante recrutements data cette année, et la présidente veut un plan qui montre que la practice grandit : cinq recrutements de plus paraissent la réponse.",
      ceQuiLeDejoue:
        "L'annonce de Halden ne dit rien de la demande d'Atlas, et l'an dernier ses trente-cinq recrutements annoncés n'ont fait grandir son effectif data que de douze. La source sur les départs montre ce qui menace vraiment le noyau : un départ par trimestre, trois à quatre mois pour remplacer, quand une cooptation lancée dès l'annonce arrive avant que le poste soit vide, pour 3 000 €. Le vote de Bruxelles tombe après le comité. Rejoué sur les trente tirages à la place du noyau et de la flexibilité, le plan de croissance perd 93 k€ en moyenne ; il fait mieux 6 fois sur 30.",
    },
  ],
  debrief: [
    "En semaine 1, la demande disait 38 ETP. Qu'est-ce qui, dans chaque ligne du carnet, permettait de dire qu'un poste était durable ou non ?",
    "Un CDI revient à 528 € le jour facturé, un freelance à 770 €. Pourquoi le freelance, plus cher au jour, peut-il être le moins cher sur une demande qui peut s'arrêter en avril ?",
    "En semaine 2, pourquoi mettre les consultants d'Atlas chez Kervalis et les freelances chez Pellerau, plutôt que l'inverse ? Que coûte un freelance qui part en cours de mission ?",
    "L'accord-cadre de Freelancia fait gagner environ 11 000 € si les six freelances restent jusqu'en septembre. Combien d'arrêts faut-il pour que l'économie disparaisse, et de quoi dépendent-ils ?",
    "En semaine 6, l'extension de Kervalis est ferme jusqu'en 2028. Qu'est-ce qui a changé, et pourquoi la bonne réponse n'est-elle plus la même qu'en semaine 1 ?",
    "Sous le tirage n° 12, l'échéance est maintenue au 30 juin. Ceux qui ont embauché sur la demande totale finissent à 2 595 k€, ceux qui ont dimensionné le noyau à 3 049 k€. Si l'échéance avait été élargie, les huit CDI auraient-ils été une bonne décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Quelle règle gardez-vous pour choisir entre embaucher et louer ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un bureau d'études vend ses ingénieurs 950 € par jour. Un ingénieur en CDI coûte 83 200 € par an, en mission ou non, et peut facturer au plus 157,5 jours par an ; un ingénieur indépendant coûte 770 € par jour facturé, et rien entre deux missions. 1) À partir de combien de jours facturés dans l'année un CDI coûte-t-il moins cher qu'un indépendant ? 2) Une nouvelle mission dépend d'une réglementation : reportée (45 %), elle ne donne aucun jour ; maintenue (35 %), 45 jours ; élargie (20 %), 157,5 jours. Combien de jours facturés peut-on attendre, en moyenne ? 3) Faut-il embaucher ou louer pour cette mission ? Comparez la marge attendue des deux solutions.",
    corrige:
      "1) Le CDI coûte moins cher dès que 770 × N dépasse 83 200, soit N > 83 200 / 770 ≈ 108 jours facturés dans l'année. 2) 0,45 × 0 + 0,35 × 45 + 0,20 × 157,5 = 0 + 15,75 + 31,5 = 47,25 jours. 3) Louer : (950 − 770) × 47,25 = 180 × 47,25 = 8 505 € de marge attendue, sans perte dans aucune issue. Embaucher : 950 × 47,25 − 83 200 = 44 887,50 − 83 200 = −38 312,50 €. Il faut louer : 47 jours attendus, c'est loin des 108 jours qui rendraient le CDI moins cher.",
  },
  evaluation: [
    "La demande durable est calculée juste (33 ETP) à partir du carnet nommé, chaque ligne classée selon le contrat qui la porte.",
    "La comparaison entre un CDI et un freelance s'appuie sur le coût du jour facturé et sur ce que coûte chacun quand la demande s'arrête.",
    "Les recrutements proposés en semaines 6 et 8 sont justifiés par une demande devenue ferme ou vérifiée auprès des clients, pas par une occasion.",
    "Le choix de l'accord-cadre est argumenté avec le coût d'un arrêt rapporté à l'économie attendue.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Le recours à des indépendants placés durablement chez un client par un intermédiaire touche à des règles que l'épisode ne pose pas : risque de requalification en contrat de travail en cas de lien de subordination, et prêt de main-d'œuvre à but lucratif, interdit hors des cadres prévus par la loi. L'enseignant de droit social pourra les rappeler ; la clause de non-sollicitation et ses frais de rachat relèvent du contrat entre les parties.",
};
