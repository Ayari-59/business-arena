/**
 * FICHE ENSEIGNANT · ÉPISODE 78, LA PRACTICE DONT LE MARCHÉ S'ÉTEINT.
 *
 * Reconvertir une équipe dont le marché s'arrête à une date connue : compter
 * l'intercontrat qui arrive, faire apprendre sur de vraies missions avec des
 * experts, et traiter chaque personne selon sa situation plutôt qu'en bloc.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "practice-a-reorienter",
  formations: ["dcg", "but-gea", "dscg"],
  programme: [
    "DCG · UE 7, Management des organisations",
    "BUT GEA · Gérer le développement des ressources humaines",
    "DSCG · UE 3, Contrôle de gestion et stratégie",
  ],
  notion:
    "Quand un marché s'éteint à une date connue, le danger n'est pas le trimestre en cours, plein, mais celui d'après, vide : l'intercontrat se calcule dès aujourd'hui. Deux erreurs se répondent. La première consiste à remplir l'automne avec les derniers audits et à « préparer la suite l'an prochain » ; la seconde, à tout basculer d'un coup, certification en salle pour tous et annonce par courriel. Dans la practice Énergie et bâtiment d'Atlas Conseil, les audits réglementaires faisaient 60 % de l'activité et s'arrêtent au 31 décembre : de décembre à février, 18 consultants offrent 864 jours staffables pour 94 jours d'audits et 264 jours d'AMO, soit 506 jours d'intercontrat à 420 € le jour. Les industriels audités veulent bien de la décarbonation, mais avec quelqu'un qui l'a déjà fait (« Un certificat ne me suffit pas », dit le responsable énergie des Fonderies du Blavet) : sans expert ni référence, Atlas signe à peine une proposition sur cinq. L'élève découvre qu'on reconvertit par étapes, des experts qui encadrent deux binômes chacun sur de vraies missions, à hauteur du carnet, et que les quatre qui ne veulent pas changer appellent quatre réponses différentes.",
  objectifs: [
    "Je calcule une capacité et une charge en jours sur une période, et j'en tire l'intercontrat attendu et son coût.",
    "Je dimensionne une reconversion sur ce que le carnet peut occuper et sur ce que les experts peuvent encadrer.",
    "Je distingue une formation en salle d'un apprentissage sur mission, et je dis ce qui rend un consultant vendable.",
    "Je compare les issues possibles pour un salarié qui ne veut pas changer de métier (mobilité, départ accompagné, départ subi), avec leur coût.",
  ],
  prerequis:
    "Les notions de capacité, de charge, de taux d'occupation et de coût d'un jour non facturé doivent être connues. Le cycle de vie d'un marché et la notion de compétence distinctive se rappellent en début de séance ; la reconversion par binômes se découvre en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/practice-a-reorienter?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, l'intercontrat de décembre à février si rien ne change, en jours, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (les audits d'abord, la reconversion par étapes, la bascule, l'attente), celle de la semaine 5 sur la formation et celle de la semaine 7 sur les quatre qui ne veulent pas changer. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 3 : deux expertes, une seule, ou les indépendants de Freelancia.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir du plan de charge : 18 consultants × 48 jours staffables = 864 jours ; 70 + 24 + 0 = 94 jours d'audits signés et 22 × 12 = 264 jours d'AMO ; 864 − 358 = 506 jours d'intercontrat, soit 506 × 420 = 212 520 € de jours sans mission. Vous faites expliquer les valeurs éloignées (600, 770 ou 722).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 1 : remplir l'automne d'audits remisés ou lancer un premier noyau chez les clients audités, et vous faites relire la phrase du responsable énergie des Fonderies du Blavet. Vous enchaînez sur la semaine 5 (certifier les 18 pour 32 400 € ou quatre volontaires en binôme, vendables seuls 12 semaines plus tard) et sur la semaine 7, où vous faites dire, pour chacun des quatre, l'issue qu'il demande et ce qu'elle coûte, comparée à un départ subi de 35 000 €.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 12, « Reconvertir par étapes » fait 81 k€ de valeur pour un objectif de 60 k€, « Les audits d'abord » −44 k€, et « Tout basculer d'un coup » −215 k€. Vous montrez ensuite ce que le hasard a fait sous ce tirage : les Conserveries de l'Aulne ont préféré Halden et ses trois références, et la feuille de route proposée n'a pas été signée ; la proposition restait la bonne décision, avec six chances sur dix quand on a des experts à montrer. Vous faites dire ce qui distingue la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : compter le vide qui arrive, puis reconvertir à hauteur du carnet. Vous la déclinez en trois gestes : finir ce qui paie sans s'y enfermer, faire apprendre sur de vraies missions avec quelqu'un qui l'a déjà fait, et traiter chaque personne selon sa situation. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 506,
    etapes: [
      "Source « Extraire de Tempora le plan de charge jusqu'en février » : de décembre à février, 12 semaines ouvrées une fois les congés déduits, à 4 jours staffables par semaine, soit 48 jours par consultant ; pour 18 consultants : 18 × 48 = 864 jours staffables.",
      "Même source : audits signés à produire, décembre 70 jours, janvier 24, février 0, soit 94 jours ; l'AMO tient 22 jours par semaine toute l'année, soit 22 × 12 = 264 jours. Charge : 94 + 264 = 358 jours.",
      "Intercontrat si rien ne change : 864 − 358 = 506 jours. Au coût de 420 € le jour sans mission que donne Gustave Herbelin : 506 × 420 = 212 520 €.",
      "Le chiffre ne dépend pas du hasard : 506 jours pour toute la classe, et c'est ce que Tempora annonce encore en semaine 1. L'épisode le juge juste à 20 jours près, proche à 60.",
    ],
    erreurs: [
      {
        valeur: 600,
        cause:
          "Les 94 jours d'audits de décembre et janvier oubliés (864 − 264) : les audits ne s'arrêtent pas le 31 décembre dans le plan de charge, il en reste à produire.",
      },
      {
        valeur: 770,
        cause:
          "L'AMO oubliée (864 − 94) : elle occupe 22 jours par semaine toute l'année, soit 264 jours sur la période.",
      },
      {
        valeur: 722,
        cause:
          "Cinq jours staffables par semaine au lieu de quatre (18 × 60 − 358) : le cinquième jour va aux congés, à l'avant-vente et à la vie du cabinet.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Septembre est plein, des clients en retard appellent encore, et Mylène Berthomieu le dit : en les relançant, on remplit octobre. Le présent paie, la suite peut attendre l'an prochain.",
      ceQuiLeDejoue:
        "Le plan de charge montre février à zéro audit et 506 jours d'intercontrat de décembre à février ; les audits relancés sont remisés à 700 €. Les clients industriels préparent déjà leur décarbonation, et Halden Partners leur a présenté trois références. Olympe Lavallière le dit : « N'attends pas qu'ils soient finis pour préparer la suite. » Rejoué sur les trente tirages à la place de la reconversion par étapes, remplir l'automne perd 132 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Le marché s'éteint au 31 décembre : annoncer la bascule de toute la practice dès octobre paraît un signal fort, pour l'équipe comme pour le marché.",
      ceQuiLeDejoue:
        "Les audits signés paient encore jusqu'en janvier, et retirer cinq consultants des audits pour se former fragilise des clients qui demandent déjà « si on arrête ». Les entretiens annuels montrent une équipe partagée : six volontaires, quatre qui ne veulent pas changer, huit qui attendent de voir. Et une formation ne rend personne vendable : le client veut quelqu'un qui l'a déjà fait. Rejouée sur les trente tirages à la place de la reconversion par étapes, la bascule perd 84 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Les ingénieurs thermiciens de la practice connaissent l'énergie : ils sauront s'y mettre, et ne recruter personne ne coûte rien.",
      ceQuiLeDejoue:
        "Les propositions perdues contre Halden portent la même phrase : « pas de référence, pas d'expert identifié ». Sans expert ni référence, Atlas signe à peine une proposition sur cinq, et Atlas Formation compte 22 semaines pour devenir vendable sans personne qui sache, contre 12 en binôme avec une experte. Ayoub Ferrec ne sait toujours pas quoi répondre aux Fonderies. Rejoué sur les trente tirages à la place des deux expertes, ne recruter personne perd 72 k€ en moyenne ; il ne fait mieux que 5 fois sur 30.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Certifier toute l'équipe en octobre met tout le monde au même niveau, d'un coup, et le comité trouve l'idée excellente.",
      ceQuiLeDejoue:
        "Atlas Formation le dit : un consultant formé en salle connaît les méthodes, mais il n'est pas vendable ; il le devient sur une première mission réelle, en binôme. Le devis ne dit pas combien de certifiés ont mené une mission, et cinq jours de salle pour 18 consultants en octobre décalent une vingtaine de visites d'audit par semaine. Rejouée sur les trente tirages à la place des quatre volontaires en binôme, la certification pour tous perd 104 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi:
        "Les audits de novembre doivent être faits : pas de binôme cette année, on formera en janvier, quand les audits seront finis.",
      ceQuiLeDejoue:
        "Un binôme lancé en janvier n'est vendable seul que 12 semaines plus tard, quand l'intercontrat sera déjà là. Le point de Tempora montre que les audits laissent 13 jours libres par semaine en octobre et 24 en novembre : quatre binômes y tiennent à peu près. Six consultants avaient demandé à faire de la décarbonation. Rejoué sur les trente tirages à la place des quatre binômes, attendre janvier perd 65 k€ en moyenne ; il ne fait mieux que 2 fois sur 30.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "La même règle pour tous paraît la plus juste : tout le monde passe à la décarbonation en janvier, pas d'exception, pas de coût.",
      ceQuiLeDejoue:
        "Les entretiens un par un montrent quatre situations : Maodez Peyrade, à dix-huit mois de la retraite, reprendrait l'AMO ; Gwenola Toullec partirait monter son bureau d'études si on l'aide, sinon elle écoutera Kéroual et un client la suivrait ; Esteban Calvez est attendu par la Performance opérationnelle au 1er décembre ; Niamh Thépaut essaiera si elle est encadrée. Un départ subi coûte 35 000 €, une rupture conventionnelle accompagnée 18 000 €. Rejouée sur les trente tirages à la place du cas par cas, la même règle pour tous perd 35 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Les audits seront faits, et rien ne presse : on en reparlera en janvier, sans rien coûter d'ici là.",
      ceQuiLeDejoue:
        "La mobilité d'Esteban suppose de le savoir avant le 1er décembre, Gwenola écoute déjà Kéroual, et un consultant sans mission de décembre à février coûte 48 jours d'intercontrat, 20 160 €. Mylène le rappelle : « L'équipe attend une réponse. » Rejoué sur les trente tirages à la place du cas par cas, attendre janvier perd 25 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "L'audit des Conserveries paie tout de suite, 700 € par jour, et les binômes pourront reprendre en décembre.",
      ceQuiLeDejoue:
        "La charge de novembre montre que les 40 jours se font avec ceux qui restent sur l'audit, quitte à finir quelques jours en décembre, avant l'échéance ; rappeler les binômes arrêterait leur apprentissage quatre semaines. Et les Conserveries préparent un plan de décarbonation pour leur conseil de mars : une feuille de route de 40 jours proposée avec l'audit a à peu près six chances sur dix avec des experts à montrer. Rejoué sur les trente tirages à la place de l'audit avec la feuille de route, rappeler les binômes perd 26 k€ en moyenne ; il ne fait mieux que 2 fois sur 30.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "La practice ne fait plus d'audits : décliner envoie un message clair, pour l'équipe comme pour le marché.",
      ceQuiLeDejoue:
        "L'audit est payé et faisable avant l'échéance, et c'est la porte d'entrée vers la décarbonation des quatre sites : Adélaïde Fourcroy préférait Atlas, « nous vous connaissons ». Décliner l'envoie chez Kéroual Consulting avec la feuille de route. Rejoué sur les trente tirages à la place de l'audit avec la feuille de route, décliner perd 44 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Repartir en janvier d'un même pas sur le nouveau métier, les dix-huit en décarbonation et dix jours de formation chacun, paraît la conclusion logique de la reconversion.",
      ceQuiLeDejoue:
        "Le bilan du carnet le dit : une deuxième vague de binômes ne sert que si le carnet a de quoi l'occuper, un binôme par cent jours signés, dans la limite de ce que les deux expertes peuvent encadrer. La Performance opérationnelle peut prendre trois consultants six semaines, 72 jours à 550 €, si elle le sait avant le 1er décembre, et Maodez demande à qui laisser les marchés d'AMO. Rejoué sur les trente tirages à la place du plan personne par personne, tout basculer perd 101 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Le plan stratégique du cabinet arrive en janvier : attendre évite de décider deux fois.",
      ceQuiLeDejoue:
        "Tempora annonce 464 jours d'intercontrat de décembre à février avec ce qui est signé, à 420 € chacun, et les prêts à la Performance opérationnelle se décident avant le 1er décembre. Olympe Lavallière l'avait dit dès la semaine 1 : le comité reposera la même question, avec trois mois de moins. Rejoué sur les trente tirages à la place du plan personne par personne, attendre perd 40 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le plan de charge de septembre était plein. Qu'est-ce qui, dans le même tableau, annonçait 506 jours d'intercontrat de décembre à février, et combien coûtent-ils ?",
    "« Un certificat ne me suffit pas », dit le responsable énergie des Fonderies du Blavet. Qu'est-ce qui rend un consultant vendable, et pourquoi la certification de toute l'équipe ne répond-elle pas à cette question ?",
    "Une experte encadre deux binômes, et un binôme est vendable seul 12 semaines plus tard. Combien de binômes la practice pouvait-elle former d'ici février, et qu'est-ce qui limite ce nombre : les experts, le carnet ou les audits ?",
    "Maodez, Gwenola, Esteban, Niamh : quelle issue convient à chacun, et que coûterait de leur appliquer à tous la même règle ?",
    "Sous le tirage n° 12, les Conserveries ont choisi Halden pour leur feuille de route. Fallait-il ne pas la proposer ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Ceux qui ont tout basculé d'un coup finissent à −215 k€ sous le tirage n° 12, ceux qui ont gardé les audits à −44 k€, ceux qui ont reconverti par étapes à 81 k€. Comment deux erreurs opposées peuvent-elles coûter aussi cher l'une que l'autre ?",
    "Quelle règle gardez-vous pour reconvertir une équipe dont le marché s'éteint ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Une agence de diagnostics immobiliers emploie 10 techniciens, à 4 jours staffables par semaine. Sur les 10 semaines ouvrées de la période qui vient, elle a 90 jours de diagnostics signés et un contrat de suivi qui occupe 12 jours par semaine. Un jour sans mission coûte 420 €. 1) Calculez la capacité, la charge et l'intercontrat attendus sur la période. 2) Que coûte cet intercontrat ? 3) Une autre agence du groupe propose de prendre trois techniciens pendant 6 semaines, à 4 jours par semaine, refacturés 550 € le jour. Combien de jours d'intercontrat restent-ils, et quel chiffre d'affaires la cession apporte-t-elle ?",
    corrige:
      "1) Capacité : 10 × 4 × 10 = 400 jours ; charge : 90 + 12 × 10 = 210 jours ; intercontrat : 400 − 210 = 190 jours. 2) 190 × 420 = 79 800 €. 3) La cession occupe 3 × 6 × 4 = 72 jours : il reste 190 − 72 = 118 jours d'intercontrat, soit 118 × 420 = 49 560 €, et la cession apporte 72 × 550 = 39 600 € de chiffre d'affaires interne.",
  },
  evaluation: [
    "L'intercontrat de décembre à février est calculé juste (864 jours staffables, 358 jours de charge, 506 jours) à partir de la source nommée, et chiffré en euros.",
    "La reconversion proposée est dimensionnée sur le carnet et sur l'encadrement des experts, avec l'apprentissage sur mission plutôt qu'en salle.",
    "Les quatre consultants qui ne veulent pas changer reçoivent chacun une réponse adaptée à sa situation, comparée au coût d'un départ subi.",
    "Les dernières commandes d'audit sont traitées comme une porte d'entrée vers le nouveau métier, sans arrêter la reconversion.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La rupture conventionnelle individuelle suppose l'accord libre des deux parties et l'homologation de l'administration ; un « plan de départs collectif, négocié avec le CSE » renvoie, selon sa forme (rupture conventionnelle collective ou plan de départs volontaires), à un accord collectif ou à une procédure que l'enseignant de droit social précisera. Une issue proposée à un salarié en raison de son âge doit être maniée avec prudence au regard de l'interdiction des discriminations.",
};
