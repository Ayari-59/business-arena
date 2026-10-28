/**
 * FICHE ENSEIGNANT · ÉPISODE 79, L'ASSISTANT D'IA QUI CHANGE LE MÉTIER.
 *
 * Un gain de productivité ne profite pas à l'entreprise qui le fait si elle
 * vend son temps : en régie, il part chez le client. Encadrer les usages,
 * mesurer le gain tâche par tâche, et changer la façon de facturer.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "assistant-ia",
  formations: ["dcg", "dscg", "but-gea"],
  programme: [
    "DCG · UE 8, Système d'information de gestion",
    "DSCG · UE 5, Management des systèmes d'information",
    "BUT GEA · Concevoir la stratégie de création de valeur",
  ],
  notion:
    "Un outil qui fait gagner du temps ne rapporte rien en soi : tout dépend de qui garde le temps gagné. L'erreur classique consiste à trancher entre interdire et tout ouvrir, en croyant les études qui promettent « 40 % de productivité », sans regarder comment le cabinet facture. Chez Atlas Conseil, 40 % des 8 550 jours du trimestre sont vendus en régie, au temps passé : si les synthèses, 12 % du temps des missions, vont deux fois plus vite, la régie facture 185 k€ de moins à facturation inchangée. Le gain mesuré par Teodora est réel mais inégal : 50 % sur les synthèses, 2 % sur le conseil lui-même, et les recommandations rédigées par l'assistant sont réécrites 35 fois sur 100. Pendant ce temps, 22 % des consultants s'en servent en cachette, sur des outils grand public. L'élève découvre qu'on ouvre avec trois règles simples plutôt qu'on interdit, qu'on mesure le gain tâche par tâche, qu'on apprend entre pairs, et qu'on passe la régie au forfait par livrable pour garder une part du gain, sans jamais facturer des jours qui n'ont pas été passés.",
  objectifs: [
    "Je calcule l'effet d'un gain de productivité sur le chiffre d'affaires selon le mode de facturation : au temps passé ou au forfait.",
    "Je mesure un gain de temps tâche par tâche, en tenant compte du temps de contrôle qu'il demande.",
    "Je choisis des règles d'usage d'un outil numérique qui se comprennent, se respectent et protègent les données des clients.",
    "Je négocie une demande de baisse de prix en partageant un gain mesuré, plutôt qu'en le cédant ou en le refusant en bloc.",
  ],
  prerequis:
    "Les notions de chiffre d'affaires, de marge, de prestation facturée au temps passé et au forfait doivent être connues. Les principes de la protection des données personnelles se rappellent en début de séance ; la mesure d'un gain de productivité par tâche se découvre en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/assistant-ia?hasard=30 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, la baisse de chiffre d'affaires en régie sur le trimestre si toutes les synthèses des missions en régie allaient deux fois plus vite, facturation inchangée, en k€, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (interdire, tout ouvrir, ouvrir avec trois règles, vingt volontaires), celle de la semaine 2 sur la régie et celle de la semaine 8 à Orvanne. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 2 : déclarer les jours prévus, ou proposer des forfaits.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir des sources de Tempora et de Teodora : 8 550 × 900 € = 7 695 k€ d'honoraires ; 40 % en régie, 3 078 k€ ; les synthèses font 12 % du temps et vont deux fois plus vite, soit 6 % des jours de régie en moins : 3 078 × 0,06 ≈ 185 k€. Vous faites expliquer les valeurs éloignées (462, 369 ou 480), puis vous demandez ce que la même baisse ferait sur un forfait : rien au chiffre d'affaires.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 1 : interdire, quand 22 % des consultants se servent déjà d'outils grand public et que plus de la moitié y ont collé des comptes rendus clients, ou tout ouvrir sans règle. Vous enchaînez sur la semaine 2, où vous faites lire la réponse d'Agnieszka Tréhin sur les jours déclarés qui n'ont pas été passés, puis sur la semaine 6 : le relevé des relectures tâche par tâche (3 corrections sur 100 sur les synthèses, 35 réécritures sur 100 sur les recommandations).",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 30, « Encadrer, vendre autrement, apprendre entre pairs » fait 814 k€ pour une marge budgétée de 650 k€, « Interdire en attendant le comité » 647 k€, et « Tout ouvrir pour ne pas prendre de retard » 312 k€. Vous montrez ensuite la décision la plus trompeuse : déclarer les jours prévus au contrat fait mieux que les forfaits 19 fois sur 30, tant que personne ne regarde les relevés ; sous le tirage n° 30, les jours facturés non passés sont découverts. Vous faites dire ce qui distingue la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : avant d'adopter un outil qui fait gagner du temps, savoir qui garde ce temps. Vous la déclinez en trois gestes : ouvrir avec des règles d'une page (données, anonymisation, relecture), mesurer le gain tâche par tâche et réserver l'outil là où il tient, et vendre un livrable plutôt que des jours. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 184.7,
    etapes: [
      "Source « Sortir de Tempora la facturation prévue du trimestre » : 190 consultants, 60 jours ouvrés, 75 % d'occupation, soit 8 550 jours facturables, au TJM moyen de 900 € : 8 550 × 900 = 7 695 000 €, soit 7 695 k€ d'honoraires.",
      "Même source : 40 % des jours sont vendus en régie, au temps passé : 0,40 × 7 695 = 3 078 k€. Le forfait, 60 %, ne change pas de prix quel que soit le temps passé.",
      "Source « Faire mesurer par Teodora ce que l'outil change dans son équipe » : les synthèses et comptes rendus font 12 % du temps des missions et vont deux fois plus vite, soit 50 % de temps en moins : 0,12 × 0,50 = 6 % des jours de régie disparaissent.",
      "Baisse de chiffre d'affaires en régie : 3 078 × 0,06 = 184,68 k€, soit environ 185 k€. Le chiffre ne dépend pas du hasard. L'épisode le juge juste à 5 k€ près, proche à 15 k€.",
    ],
    erreurs: [
      {
        valeur: 461.7,
        cause:
          "Les 6 % appliqués à tous les honoraires (7 695 × 0,06) : au forfait, le prix ne bouge pas, seule la régie perd les jours gagnés.",
      },
      {
        valeur: 369.4,
        cause:
          "Tout le temps des synthèses retiré (3 078 × 0,12) : elles vont deux fois plus vite, elles ne disparaissent pas ; on perd la moitié de leurs 12 %.",
      },
      {
        valeur: 480.2,
        cause:
          "Le gain de 15,6 % d'un utilisateur qui maîtrise l'outil partout (3 078 × 0,156) : la question ne porte que sur les synthèses.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Soazig Marchadier ne veut pas qu'une machine écrive des recommandations à des directeurs d'hôpital : interdire jusqu'au comité de juin paraît ce que font les cabinets sérieux, sans aucun risque d'erreur.",
      ceQuiLeDejoue:
        "Dragan Marinescu voit plus de 1 400 connexions par semaine vers des assistants grand public, et le questionnaire montre que 22 % des consultants s'en servent sur un compte personnel, plus de la moitié y ayant collé des comptes rendus clients. L'outil du cabinet, lui, a un hébergement maîtrisé. Chiamaka Darrigade le dit : « L'interdiction n'a jamais empêché personne de faire en cachette. » Rejouée sur les trente tirages à la place de l'ouverture avec trois règles, l'interdiction perd 215 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Halden Partners équipe ses consultants depuis janvier, les licences sont payées : Ruben Esnault veut tout ouvrir lundi, « les gens apprendront en s'en servant ».",
      ceQuiLeDejoue:
        "La mesure de Teodora montre que le gain se joue tâche par tâche : 50 % sur les synthèses, 2 % sur le conseil, et deux synthèses fausses l'ont obligée à imposer une relecture par un pair. Sans règle, les données clients et les livrables non relus exposent le cabinet, et en trois jours certains rédigent déjà des recommandations avec l'outil. Rejouée sur les trente tirages à la place de l'ouverture avec trois règles, l'ouverture sans règle perd 82 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Le chiffre d'affaires de la régie baisse et la courbe monte ; certains chefs de mission disent que le client achète un résultat, pas un temps : déclarer les jours prévus arrête la baisse, sans aucun coût.",
      ceQuiLeDejoue:
        "Agnieszka Tréhin le dit : une régie se facture au temps passé, sur des relevés que le client peut demander, et facturer des jours non passés, c'est facturer une prestation non réalisée ; chez un acheteur public, la résiliation, le remboursement et l'exclusion possible, pour un enjeu de plus de 250 k€. Le forfait par livrable au budget moins 3 % garde la part du gain au-delà de 3 %, légalement, et deux clients sur trois l'accepteraient. Rejouée sur les trente tirages à la place des forfaits, la consigne perd 60 k€ en moyenne ; elle fait mieux 19 fois sur 30, quand rien n'est découvert, et c'est ce qui la rend dangereuse.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Ruben le dit : « Sans objectif, rien ne bouge. » Un objectif de 15 % de jours gagnés par practice et l'outil obligatoire pour les comptes rendus paraissent la façon de ne laisser personne à l'écart.",
      ceQuiLeDejoue:
        "Le relevé des apprentissages montre que sept utilisateurs sur dix ont appris auprès d'un collègue, sur un vrai dossier, et gagnent environ 40 % de plus que ceux qui ont appris seuls ; le premier frein des autres tient en une phrase : « je n'ai vu aucun exemple dans mon métier ». Les 15 % dépassent même ce que la mesure de Teodora jugeait possible pour un utilisateur qui maîtrise l'outil partout (15,6 %), et Soazig prévient que ses consultants « colleront dedans n'importe quoi » pour atteindre l'objectif. Rejoué sur les trente tirages à la place des référents et des pratiques partagées, l'objectif perd 61 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le gain est sur toutes les tâches, et les relectures sont là pour rattraper les erreurs : garder le cap paraît la façon de gagner le plus.",
      ceQuiLeDejoue:
        "Le relevé des relectures, tâche par tâche : 3 corrections sur 100 sur les synthèses, mais 18 sur 100 sur les analyses chiffrées, des chiffres sans source présentés avec assurance, et 35 recommandations sur 100 réécrites entièrement, ce qui prend plus de temps que de les écrire soi-même. Sur le conseil, l'assistant coûte au lieu de rapporter. Rejoué sur les trente tirages à la place des usages recentrés, garder le cap perd 65 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "Des analyses fausses et des recommandations réécrites : suspendre l'assistant deux semaines pour un audit qualité paraît la réponse prudente.",
      ceQuiLeDejoue:
        "Le relevé dit déjà où l'outil tient et où il ne tient pas, sans audit : les synthèses tiennent, les recommandations non. Et la semaine 1 l'a montré : sans l'outil du cabinet, les consultants retournent aux outils grand public ; Youenn Mével le dit, « devinez ce que la moitié de l'équipe a fait ». Rejouée sur les trente tirages à la place des usages recentrés, la suspension perd 115 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Orvanne pèse 600 k€ par an et Kéroual propose −15 % : accepter −12 % paraît le prix pour garder le deuxième client privé du cabinet.",
      ceQuiLeDejoue:
        "Hocine Cassagne ne sait pas ce que l'assistant change sur cette mission : selon la deuxième année, environ 1,7 fois ou 0,5 fois le gain moyen de 7,8 %, une chance sur deux chacune ; −12 % donnent plus que tout gain probable. L'historique du compte montre que Gwilherm Le Nevez accepte un forfait quand le livrable est clair et le prix argumenté, et qu'en régie il paie déjà moins de jours quand l'équipe va plus vite. Rejouée sur les trente tirages à la place de la mesure suivie d'un forfait partagé, la baisse de 12 % perd 85 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Un forfait au budget moins 12 % donne au client sa baisse, et l'assistant fera le reste : la réponse part lundi.",
      ceQuiLeDejoue:
        "Le prix est fixé pour un an sur un gain qu'on ne connaît pas : si la deuxième année est faite d'ateliers, l'assistant n'y fait gagner qu'environ la moitié du gain moyen, loin des 12 %. Deux jours de manager, 2 200 €, disent lequel des deux scénarios on vend, et permettent de partager le gain mesuré à parts égales. Rejoué sur les trente tirages à la place de la mesure, le forfait à −12 % perd 42 k€ en moyenne ; il fait mieux 5 fois sur 30.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "La politique de 38 pages préparée avec les avocats couvre le cabinet : une liste fermée d'usages, toute nouvelle utilisation validée par le comité.",
      ceQuiLeDejoue:
        "Le bilan des usages avec Dragan et Agnieszka : les règles qui ont tenu sont celles qu'on a pu expliquer en une page ; une politique de 38 pages se lit rarement, et chaque usage à faire valider renvoie vers les outils grand public. Les propositions du second semestre, 1,4 M€, partiraient en régie par habitude, quand le forfait par défaut en vaudrait 51 k€ de plus. Rejouée sur les trente tirages à la place de la charte d'une page et du forfait par défaut, la politique complète perd 100 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 3,
      pourquoi:
        "Ruben le dit : la relecture obligatoire freine le gain ; la supprimer fait redevenir le temps de relecture du temps gagné.",
      ceQuiLeDejoue:
        "La relecture reprend un quart du gain hors conseil, d'après la mesure de Teodora, mais c'est elle qui a arrêté les deux synthèses fausses et qui supprime presque toutes les erreurs sur les analyses ; le mandat ne tolère aucun livrable faux chez un client. Teodora « croise les doigts » quand ses juniors envoient leurs premières versions directement. Rejouée sur les trente tirages à la place de la charte d'une page, la suppression de la relecture perd 57 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, la régie perdait 185 k€ si les synthèses allaient deux fois plus vite. Que perdait le forfait ? Qu'est-ce que ce calcul change au choix entre interdire et ouvrir ?",
    "22 % des consultants se servaient déjà d'outils grand public. Qu'est-ce qu'une interdiction change à ce chiffre, et qu'est-ce qu'une charte d'une page avec l'outil du cabinet y change ?",
    "Déclarer les jours prévus au contrat fait mieux que les forfaits 19 fois sur 30. Pourquoi est-ce pourtant la pire réponse de la semaine 2 ? Qu'est-ce qui la distingue, en droit, d'un forfait par livrable ?",
    "Le relevé des relectures donne 3 corrections sur 100 sur les synthèses et 35 réécritures sur 100 sur les recommandations. Que dit ce relevé de la façon de mesurer un gain de productivité ?",
    "Orvanne demande −12 %. Pourquoi la mesure de deux jours vaut-elle plus que la réponse immédiate, quand on ne sait pas ce que sera la deuxième année ?",
    "Sous le tirage n° 30, ceux qui ont interdit finissent à 647 k€, ceux qui ont tout ouvert à 312 k€, ceux qui ont encadré à 814 k€. Comment l'interdiction peut-elle faire mieux que l'ouverture sans règle et rester une mauvaise décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Quelle règle gardez-vous pour adopter un outil qui fait gagner du temps dans une entreprise qui vend son temps ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un cabinet facture un contrat de 200 k€ par an en régie. Un outil fait gagner 8 % du temps passé sur ce contrat. Au renouvellement, le cabinet peut le reconduire en régie, où le client paie les jours réellement passés, ou proposer un forfait par livrable au budget de l'an passé moins 3 %. 1) Quel chiffre d'affaires le contrat rapporte-t-il en régie, une fois le gain fait ? 2) Et au forfait ? 3) Quelle solution rapporte le plus, et de combien ? 4) Reprenez les questions avec un gain de 2 % seulement : que constatez-vous ?",
    corrige:
      "1) En régie, le client paie 8 % de jours en moins : 200 × 0,92 = 184 k€. 2) Au forfait, le prix est fixé : 200 × 0,97 = 194 k€, quel que soit le temps passé. 3) Le forfait rapporte 194 − 184 = 10 k€ de plus : le client gagne 3 % (6 k€), le cabinet garde le reste du gain. 4) Avec 2 % de gain : régie 200 × 0,98 = 196 k€, forfait 194 k€ ; le forfait rapporte 2 k€ de moins. Sous 3 % de gain, la remise du forfait coûte plus que ce qu'il permet de garder : il faut mesurer le gain avant de s'engager.",
  },
  evaluation: [
    "La baisse de la régie est calculée juste (7 695 k€ d'honoraires, 3 078 k€ en régie, 6 % de jours en moins, environ 185 k€) à partir des sources nommées.",
    "Les règles d'usage choisies protègent les données des clients et la qualité des livrables, et sont assez simples pour être respectées.",
    "Le gain de temps est apprécié tâche par tâche, temps de relecture compris, et l'usage est réservé aux tâches où il tient.",
    "La réponse à la régie et à Orvanne garde une part du gain par le mode de facturation, sans facturer de jours non passés ni céder une baisse non mesurée.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 30.",
  ],
  vigilance:
    "L'épisode ne traite la protection des données que par trois règles de bon sens : un enseignant pourra rappeler les obligations du règlement général sur la protection des données (base légale, minimisation, sous-traitants) et celles du règlement européen sur l'intelligence artificielle. Les conséquences de jours facturés et non passés chez un acheteur public sont reprises telles que l'épisode les pose.",
};
