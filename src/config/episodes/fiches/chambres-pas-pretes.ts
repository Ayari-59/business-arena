/**
 * FICHE ENSEIGNANT · ÉPISODE 57, LES CHAMBRES PAS PRÊTES À 15 H.
 *
 * Un flux de travail se pilote par son goulot : ici le linge, qui fait
 * attendre l'équipe le matin, puis l'ordre de nettoyage, qui décide qui attend
 * à 15 h. Le piège : demander des bras (l'intérim) quand l'équipe perd déjà
 * quatre heures à attendre.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "chambres-pas-pretes",
  formations: ["bts-mhr", "bts-mhr-bc"],
  programme: [
    "BTS MHR · Bloc 3, Management de la production de services en hôtellerie restauration",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
  ],
  notion:
    "Quand un service n'est pas prêt à l'heure, le réflexe est de conclure qu'il manque du monde. L'erreur classique consiste à ajouter des heures (intérim, prise de poste plus tôt) sans regarder à quelle heure l'équipe n'a rien à faire, et pourquoi. Dans l'épisode, L'Escale Annemasse, 78 chambres et une clientèle d'affaires qui arrive dès 13 h, a quatre chambres pas prêtes à 15 h chaque jour chargé, et le directeur est prêt à signer pour des intérimaires. La matinée à la lingerie montre le goulot : le linge resté dans les offices ne couvre que 18 départs, la Blanchisserie du Fier livre à 11 h, les draps sont aux étages à 11 h 30, et l'équipe de six attend, une fois faites les recouches déjà libres : quatre heures perdues le lundi décrit, ce qui manque à 15 h. Une parure de plus par lit coûte 140 € par semaine, quand deux intérimaires en coûtent 1 456 € et attendent le linge comme les autres. L'élève découvre qu'on cherche le goulot avant d'ajouter de la capacité, que l'ordre de nettoyage d'après la liste d'arrivées décide qui attend, qu'une recouche proposée vaut mieux qu'une recouche imposée, et que des heures peu productives et mal formées se paient en oublis et en note.",
  objectifs: [
    "Je reconstitue la journée d'une équipe et je calcule le temps perdu à attendre une ressource.",
    "Je repère le goulot d'un flux de travail et je le traite avant d'ajouter des heures.",
    "J'organise l'ordre du travail d'après les besoins des clients (la liste d'arrivées) plutôt que d'après l'habitude.",
    "Je compare l'intérim, les heures complémentaires et la formation sur leur coût, leur productivité et leurs défauts.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "L'organisation du service des étages (départ, recouche, gouvernante, lingerie) et la notion de productivité (chambres par personne et par jour) doivent être connues. Le goulot d'étranglement et le stock tampon peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/chambres-pas-pretes?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez Djeneba Touré, gouvernante générale, et les clients d'Helvardis qui ont attendu leur chambre, et vous demandez de noter sur papier, avant de valider la semaine 1, les heures d'équipe perdues à attendre le linge le lundi décrit et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez la proposition de la semaine 1 (intérim, linge, prise de poste à 7 h, rien) et la préparation du salon de février en semaine 6, où la classe se partage. Un binôme qui a fini tôt dessine sur papier la matinée de l'équipe, de 8 h 15 à 11 h 30, avec et sans le stock tampon.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous dessinez au tableau une frise de 8 h 15 à 11 h 30, puis vous faites le compte avec la classe : six personnes pendant 195 minutes, 18 départs que le linge permet et 15 recouches libres à 9 h, soit 930 minutes de travail pour 1 170 minutes de présence. Il reste 240 minutes, quatre heures, à attendre les draps. Vous faites expliquer les valeurs éloignées (9 h, 1 h ou 0 h), puis vous montrez que ces quatre heures valent plus de six départs à 35 minutes : à peu près ce qui manque à 15 h.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 (l'ordre des chambres) et de la semaine 6 (le salon). Ceux qui ont pris des intérimaires défendent leur choix ; vous faites lire la réaction de Réka Varga (« à 10 h 30, on sera huit à attendre les draps au lieu de six ») et l'essai de Rosine, « tous les départs d'abord », qui bute sur le même 18e départ. Pour le salon, vous faites calculer la charge (38 h 45 de chambres pour 26 h de travail à quatre) et comparer les heures complémentaires à 20,90 €, l'intérim à 26 € aux deux tiers de la productivité, et l'intérim formé.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Le flux d'abord » finit 8,4 k€ au-dessus du budget de l'hébergement, avec moins d'une chambre pas prête à 15 h par jour chargé et une note remontée à 8,6 ; « Attentiste » finit 47,3 k€ en dessous, et « Des bras en plus » 69,4 k€ en dessous, avec plus de mille heures d'intérim et une note tombée à 8,0. Vous faites remarquer que les bras en plus font moins bien que l'immobilité. Vous montrez ensuite le salon : sur les trente tirages, l'intérim formé fait mieux que les heures complémentaires 12 fois, quand l'équipe ne suit qu'à moitié, et perd pourtant en moyenne. Sous le tirage n° 12, l'équipe a suivi.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : regarder à quelle heure l'équipe n'a rien à faire, et pourquoi, avant de demander des bras. Vous la déclinez : un stock tampon qui supprime l'attente du linge, l'ordre de nettoyage tiré de la liste d'arrivées, la recouche proposée avec une contrepartie, le contrôle ciblé avec une check-list, et des renforts qui connaissent les standards. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 4,
    etapes: [
      "Source « Relire le planning et la feuille d'étage de lundi » : six personnes, chariots prêts à 8 h 15 ; 44 départs à 35 minutes, libres avant 10 h, et 30 recouches à 20 minutes, dont la moitié libres à 9 h et les autres vers 11 h 30.",
      "Source « Passer la matinée à la lingerie avec Zahia » : le linge des offices couvre 18 départs ; les draps livrés à 11 h sont aux étages à 11 h 30. Jusqu'à 11 h 30, l'équipe est présente 6 × 195 = 1 170 minutes.",
      "Le travail possible avant 11 h 30 : 18 départs × 35 = 630 minutes, plus les 15 recouches libres à 9 h × 20 = 300 minutes, soit 930 minutes.",
      "Temps perdu à attendre le linge : 1 170 − 930 = 240 minutes, soit 4 heures. Le chiffre ne dépend pas du hasard : 4 heures pour toute la classe ; l'épisode le juge juste à une demi-heure près, proche à une heure et demie.",
      "Ces 4 heures valent près de sept départs à 35 minutes : avec le linge du matin, ils seraient faits avant midi, et les chambres attendues à 13 h seraient prêtes.",
    ],
    erreurs: [
      {
        valeur: 9,
        cause:
          "Les 15 recouches libres à 9 h oubliées (1 170 − 630 = 540 minutes) : l'équipe les fait en attendant les draps.",
      },
      {
        valeur: 1,
        cause:
          "Le linge compté aux étages à 11 h, à la livraison (6 × 165 − 930 = 60 minutes) : Zahia met une demi-heure à trier et monter les chariots.",
      },
      {
        valeur: 0,
        cause:
          "Les 30 recouches comptées comme libres dès le matin : la moitié des clients en séjour ne quittent leur chambre que vers 11 h 30.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le directeur est prêt à signer, Helvardis a rappelé, et deux personnes de plus, c'est forcément plus de chambres faites.",
      ceQuiLeDejoue:
        "La matinée à la lingerie montre que l'équipe attend le linge passé le 18e départ : deux intérimaires attendent avec elle, et Réka Varga le dit, on sera huit à attendre au lieu de six. Zahia Merabet avait la solution, une parure de plus par lit à 140 € par semaine, quand l'intérim coûte 1 456 €. Dragana Petković conseillait de regarder d'abord à quelle heure l'équipe n'a rien à faire. Rejoués sur les trente tirages à la place du stock tampon, les intérimaires perdent 31,9 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Les chambres ne sont pas finies à 15 h : un intérimaire l'après-midi finira celles qui restent.",
      ceQuiLeDejoue:
        "La source « Voir avec Aloïs ce que la liste d'arrivées peut dire » : trois clients en départ sur dix arrivent avant 15 h, presque tous des comptes entreprises, et Hostéo peut sortir chaque soir la liste des arrivées avec l'heure annoncée. Les chambres prêtes à 10 h au premier étaient celles des clients du soir. Faire d'abord les chambres attendues coûte vingt minutes par jour à Rosine ; l'intérimaire coûte 520 € par semaine, et il faut le suivre. Rejoué sur les trente tirages à la place de l'ordre tiré de la liste d'arrivées, il perd 18,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Il manque près de deux personnes par jour de salon : l'agence en garantit deux, c'est simple et sûr.",
      ceQuiLeDejoue:
        "L'agence le dit elle-même : sans formation, une intérimaire fait les deux tiers du travail d'une titulaire et oublie quelque chose dans une chambre sur onze, contre une sur cinquante. Les temps partiels prendraient des heures complémentaires à 20,90 €, et Esperanza et Ilda pourraient décaler une partie de leurs congés pour 150 € de prime chacune ; si l'on tient à l'intérim, le former deux jours en binôme le rend bien plus productif. Rejoués sur les trente tirages à la place des heures complémentaires, les intérimaires non formés perdent 2,5 k€ en moyenne, et ne font mieux qu'une fois.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "32 chambres à faire pour 12 h 30 : trois intérimaires le mardi, c'est la garantie d'être prêt.",
      ceQuiLeDejoue:
        "Le plan du mardi avec Rosine : 32 départs, 18 h 40 de travail, un peu plus de trois heures à six ; faites en premier, les chambres du groupe sont prêtes avant midi si l'équipe est au complet, à condition de commander 20 parures de plus (90 €). Sans rooming list, Aloïs prévoit trois quarts d'heure de file au comptoir. Une fois sur trois, le car arrive vers 11 h 30, et Navelis Aéro vaut 10 752 € de marge s'il revient. Rejoués sur les trente tirages à la place de la préparation avec la réception, les intérimaires perdent 5,4 k€ en moyenne et ne font jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le directeur voyait un manque de bras, le siège une équipe trop lente. Qu'est-ce que la matinée à la lingerie montrait ? À quelle heure l'équipe n'avait-elle rien à faire, et pourquoi ?",
    "Quatre heures perdues le matin, quatre chambres pas prêtes à 15 h : comment relier les deux chiffres ? Pourquoi une parure de plus par lit fait-elle plus que deux intérimaires ?",
    "Pourquoi faire « tous les départs d'abord » ne suffisait-il pas, quand faire d'abord les chambres attendues avant 15 h réglait l'attente au comptoir ?",
    "La recouche à la demande : proposée avec une boisson, ou imposée par une affichette « Un geste pour la planète ». Qu'est-ce qui distingue les deux pour le client, et pour la note ?",
    "Pour le salon, l'intérim formé fait mieux que les heures complémentaires environ quatre fois sur dix, quand l'équipe ne suit qu'à moitié. Sous le tirage n° 12, elle a suivi. Si elle n'avait pas suivi, le choix des heures complémentaires aurait-il été mauvais ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "« Des bras en plus » finit sous « Attentiste ». Comment des heures payées en plus peuvent-elles faire moins bien que l'immobilité ?",
    "Quelle règle laissez-vous à Rosine Kabongo pour le prochain jour où les chambres ne seront pas prêtes ? Formulez-la en une phrase, avec le mot « goulot » dedans.",
  ],
  prolongement: {
    enonce:
      "Un hôtel de 50 chambres a cinq femmes et valets de chambre, chariots prêts à 8 h. Le jour décrit compte 35 départs à 30 minutes et 20 recouches à 20 minutes, dont la moitié libres à 9 h. Le linge des offices couvre 12 départs ; les draps livrés sont aux étages à 11 h 30. 1) Combien de minutes l'équipe est-elle présente avant 11 h 30 ? 2) Combien de minutes de travail peut-elle faire avant 11 h 30 ? 3) Combien d'heures perd-elle à attendre le linge ? 4) Une parure de plus par lit coûte 120 € par semaine ; un intérimaire coûte 26 € de l'heure, sept heures, quatre jours. Que coûte chacun par semaine, et lequel supprime l'attente ?",
    corrige:
      "1) De 8 h à 11 h 30 : 210 minutes × 5 = 1 050 minutes. 2) 12 départs × 30 = 360 minutes, plus 10 recouches libres × 20 = 200 minutes : 560 minutes. 3) 1 050 − 560 = 490 minutes, soit 8 h 10 perdues, l'équivalent de plus de seize départs. 4) La parure coûte 120 € par semaine et supprime l'attente : avec du linge pour les 35 départs, l'équipe a 35 × 30 + 200 = 1 250 minutes de travail possible avant 11 h 30, plus que ses 1 050 minutes de présence : elle n'attend plus. L'intérimaire coûte 26 × 7 × 4 = 728 € par semaine et attend le linge comme les autres : il ajoute 210 minutes de présence, et autant d'attente.",
  },
  evaluation: [
    "Le temps perdu à attendre le linge est calculé juste à partir des deux sources de la semaine 1, avec les recouches libres et l'heure où le linge arrive aux étages.",
    "Le diagnostic distingue le goulot (le linge, l'ordre de nettoyage) d'un manque d'effectif ou de productivité, avec les chiffres des sources.",
    "Chaque renfort est comparé sur son coût, sa productivité et ses défauts, et non sur le seul nombre d'heures ajoutées.",
    "Le contrôle de la qualité est ciblé sur les chambres à risque et argumenté par ce qu'il coûte en temps de libération des chambres.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode majore de 10 % les heures complémentaires des temps partiels et de 25 % les heures supplémentaires : ce sont les taux légaux de base, sous réserve des limites (heures complémentaires dans la limite du dixième ou du tiers de la durée prévue au contrat selon l'accord applicable) et des accords de branche, que l'enseignant voudra rappeler. Décaler des congés déjà posés suppose l'accord des salariées.",
};
