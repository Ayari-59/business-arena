/**
 * FICHE ENSEIGNANT · ÉPISODE 88, L'HEURE D'AIDE À DOMICILE.
 *
 * Le coût de revient de l'heure facturée d'un service d'aide à domicile :
 * trajets, annulations, coordination, absences et formation sont payés et ne
 * se facturent pas. Le piège est de diviser les charges par les heures
 * planifiées, puis de couper les passages courts et la coordination.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "heure-a-domicile",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "BTS CG · P5, Analyse et prévision de l'activité",
    "DCG · UE 11, Contrôle de gestion",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  notion:
    "Le coût de revient d'une heure de service se calcule sur l'unité que l'on vend : l'heure facturée. Entre l'heure payée et l'heure facturée s'intercalent les trajets, les annulations tardives, la coordination, les absences et la formation, que le service paie et que personne ne rembourse. L'erreur classique consiste à diviser les charges par une base trop large (les heures planifiées, annulations comprises), puis à chercher le déficit dans ce qui se voit : les passages courts, les réunions d'équipe, les frais fixes à « diluer ». Dans l'épisode, le service d'aide à domicile de l'Association Solvanne, à Dijon et Beaune, a perdu 240 k€ ; le département paie l'heure 24,80 €, et la comptabilité annonce un coût de 26 € qui n'explique pas la perte. Le rapprochement de la paie et du planning donne 119 950 heures payées pour 95 000 facturées ; le compte donne 2 596 k€ de charges. Divisées par les heures facturées, elles font 27,33 € de l'heure : 2,53 € de perte par heure, soit les 240 k€. L'élève découvre qu'on réduit le coût de l'heure en raccourcissant les trajets par secteur et en réaffectant les heures annulées, pas en refusant des plans d'aide ni en supprimant la coordination qui protège les bénéficiaires, et qu'un dossier tarifaire qui montre ce calcul obtient ce qu'un chiffre faux n'obtient pas.",
  objectifs: [
    "Je calcule le coût de revient complet d'une heure facturée en rapportant toutes les charges aux seules heures qui se facturent.",
    "Je décompose l'écart entre heures payées et heures facturées par nature (trajets, annulations, coordination, absences, formation).",
    "Je mesure ce qu'une mesure fait au coût de l'heure : moins d'heures payées non facturées, ou plus d'heures facturées.",
    "J'évalue une activité nouvelle à son coût propre (les trajets qu'elle ajoute), et non à la dilution des frais fixes.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Le coût de revient complet, la distinction entre charges directes et indirectes, et le choix d'une unité d'œuvre doivent avoir été vus en cours. L'APA, le plan d'aide et le rôle du département peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/heure-a-domicile?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous écrivez au tableau les deux chiffres de Mihaela Vasilescu (26 € de coût, 24,80 € de tarif) et la perte de 240 k€, et vous demandez de noter sur papier le coût de revient de l'heure facturée calculé en semaine 1, avec son calcul, et le plan présenté vendredi.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez le plan de la semaine 1 (passages courts, secteurs, relance, attente), la réponse au département sur les bénéficiaires de Présence Hautes-Côtes (semaine 4) et le dossier du CPOM (semaine 8), où la classe se partage. Un binôme qui a fini tôt retrouve les 240 k€ de perte à partir du coût de l'heure facturée.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les coûts relevés, puis vous refaites le calcul avec la classe à partir des deux sources : les charges du compte (2 596 k€) et les heures facturées (95 000). Vous faites expliquer les valeurs éloignées (25,96 €, 21,64 € ou 17 €). Vous retrouvez ensuite la perte : (27,33 − 24,80) × 95 000 ≈ 240 k€, et vous faites remarquer que le chiffre de la comptabilité, lui, n'en explique que la moitié.",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 et de la semaine 8. Pour la semaine 1, faites lire l'analyse des passages courts : 14 % des heures, 35 % des trajets, mais sept bénéficiaires sur dix en GIR 1 ou 2, et un service engagé à assurer les plans d'aide. Pour la semaine 4, faites calculer ce que coûtent les trajets d'une heure dans les Hautes-Côtes (24 minutes et 16 km) face au raisonnement de Mihaela sur la dilution des frais fixes. Pour la semaine 8, faites lire la note du département : aucun dossier sans calcul de coût n'a obtenu plus de 0,40 €.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Chiffrer juste, puis agir sur les tournées et les annulations » finit l'exercice à 98,1 k€ de perte estimée, sous l'objectif de 150 k€, quand « Attentiste » perd 244,4 k€ et « Couper les petites interventions et diluer les frais fixes » 274,7 k€. Le département a accordé la dotation complémentaire, mais la cellule du CHU a refusé l'alerte des hospitalisations. Vous faites lire la semaine 8 : la dotation de 2 € est accordée environ deux fois sur trois, et la demande mesurée de 1 € fait mieux 10 fois sur 30. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la formule de l'épisode : coût de revient de l'heure facturée = charges totales / heures facturées, et le ratio qui la commande : heures payées / heures facturées (1,26 au départ). Vous en tirez la règle : on agit sur le temps qui s'intercale (trajets, annulations), on garde le temps qui protège (coordination, formation), et on n'évite pas une heure qui coûte en la refusant à un bénéficiaire qui en a besoin. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 27.33,
    etapes: [
      "Source « Reprendre le calcul de la comptabilité avec Mihaela Vasilescu » : 2 039 k€ de salaires chargés des intervenantes + 152 k€ de frais kilométriques + 405 k€ d'encadrement et de structure = 2 596 k€ de charges.",
      "Source « Rapprocher la paie et le planning de l'an dernier » : 95 000 heures facturées, pour 119 950 heures payées. Les 24 950 heures d'écart (trajets, annulations, coordination, absences, formation) sont payées et ne se facturent pas.",
      "Coût de revient complet d'une heure facturée : 2 596 000 / 95 000 ≈ 27,33 €. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 0,25 € près, proche à 0,80 €.",
      "Contrôle : (27,33 − 24,80) × 95 000 ≈ 240 k€, la perte de l'an dernier. Avec les 25,96 € de la comptabilité, on n'en retrouverait que (25,96 − 24,80) × 95 000 ≈ 110 k€.",
      "Pour la suite : le ratio heures payées / heures facturées vaut 119 950 / 95 000 ≈ 1,26 ; c'est lui que les secteurs et la réaffectation des heures annulées font baisser.",
    ],
    erreurs: [
      {
        valeur: 25.96,
        cause:
          "Le chiffre de la comptabilité : les charges divisées par les 100 000 heures planifiées, annulations comprises (2 596 000 / 100 000). Les 5 000 heures annulées ne se facturent pas.",
      },
      {
        valeur: 21.64,
        cause:
          "Les charges divisées par les 119 950 heures payées : c'est le coût d'une heure payée, pas d'une heure vendue.",
      },
      {
        valeur: 17,
        cause:
          "Le coût d'une heure payée d'intervenante, salaire chargé seul (source de la paie) : il manque les heures non facturées, les frais kilométriques et la structure.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Leonor Mathiot le dit : les passages de trente minutes font les tournées les plus longues ; n'accepter que des heures pleines ferait respirer les tournées.",
      ceQuiLeDejoue:
        "L'analyse des passages courts : 14 % des heures facturées et 35 % des trajets, mais sept bénéficiaires sur dix qui en ont sont en GIR 1 ou 2, avec aussi des interventions plus longues, soit 16 % des heures du service ; et l'autorisation comme le CPOM engagent le service à assurer les plans d'aide de son secteur. Un lever et un coucher ne se regroupent pas : les familles partent pour toutes leurs heures, et le département reçoit des plaintes. Rejoué sur les trente tirages à la place de la sectorisation, le refus des passages courts perd 85 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Plus d'heures sur les mêmes frais fixes : le coût de l'heure ne peut que baisser, dit Mihaela Vasilescu.",
      ceQuiLeDejoue:
        "Le rapprochement de la paie montre que le coût vient des 24 950 heures payées non facturées, dont 11 400 de trajet, pas des 405 k€ de structure. Des heures acceptées hors des tournées arrivent à vingt minutes de la dernière intervention : elles ajoutent du trajet payé et non facturé, et augmentent la perte au lieu de la diluer. Rejouée sur les trente tirages à la place de la sectorisation, la relance perd 63 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Une intervention annulée trop tard est payée à l'intervenante : la facturer aux familles, c'est une recette nouvelle dès la semaine 4.",
      ceQuiLeDejoue:
        "La relecture des annulations : six fois sur dix, c'est une hospitalisation que personne n'a signalée, et dans la moitié des cas le SSIAD ou un infirmier libéral le savait dès la veille. Facturer ne réaffecte aucune heure et fait partir des familles ; une assistante sociale du CHU demande si le service facture aussi les jours d'hospitalisation. Organiser l'alerte et réaffecter le jour même coûte 250 € par semaine. Rejouée sur les trente tirages, la facturation des annulations perd 33 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "7 800 heures de plus par an, une aubaine : à 26 € dont plus de 4 € de structure, chaque heure en plus rapporterait 3 €.",
      ceQuiLeDejoue:
        "La carte des tournées : 24 bénéficiaires, 60 heures par semaine, sont sur les tournées de Nuits et de Gevrey ; les 36 autres, 90 heures, vivent dans les Hautes-Côtes, à 24 minutes de route et 16 km par heure facturée, contre 7 minutes en moyenne. Stavros Gruère, des Quatre Vallées Domicile, intervient déjà dans onze de ces villages. Rejouée sur les trente tirages à la place du partage, la reprise de tout perd 16 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Pour 100 heures facturées, 126 sont payées : la réunion d'équipe et les formations sont des heures que personne ne rembourse.",
      ceQuiLeDejoue:
        "L'essai de Beaune en 2024 : sans réunions pendant trois mois, les absences sont passées de 3 à 5 % des heures, deux intervenantes sont parties, et les annulations non signalées ont augmenté d'un dixième. Les formations (gestes et postures, transferts, prévention des chutes) sont à moitié financées par l'OPCO, et les reporter ne fait que les décaler. À Talant, les transmissions sur la télégestion prennent deux fois moins de temps qu'une réunion sur deux. Rejouée sur les trente tirages, la suppression perd 14 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le chiffrage officiel est prêt, il part en une heure et sans frais : 26 € de coût, 1,20 € de majoration demandée.",
      ceQuiLeDejoue:
        "La note du département demande un coût de revient par heure facturée, ses composantes et un plan d'action ; aucun dossier sans calcul de coût n'a obtenu plus de 0,40 €, et deux dossiers complets sur trois ont obtenu tout ou partie de leur demande. Le chiffre de 26 € n'explique pas la perte, et le département le voit. Rejoué sur les trente tirages à la place du dossier avec dotation complémentaire, le chiffrage de la comptabilité fait mieux 10 fois, quand la dotation est refusée, mais perd 31 k€ en moyenne.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "En juillet et en août, une heure sur cinq doit être remplacée : suspendre les passages courts et le ménage non essentiel réduit les remplacements à trouver.",
      ceQuiLeDejoue:
        "Les passages courts sont les levers, les repas et les couchers de bénéficiaires en GIR 1 ou 2 : Carmela Ladey écrit au département parce que sa mère ne peut pas se lever seule, et le département demande de rétablir les plans d'aide. Le bilan de l'été dernier montre que des remplaçants rattachés à un secteur et formés deux jours en binôme font la moitié de la route en plus des autres. Rejouée sur les trente tirages, la suspension perd 46 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, la comptabilité trouvait 26 €, et ce chiffre n'expliquait pas la perte. Qu'est-ce qui était faux : les charges, ou la base sur laquelle on les divisait ? Pourquoi l'unité de calcul doit-elle être l'heure facturée ?",
    "Sur 119 950 heures payées, 24 950 ne se facturent pas. Lesquelles peut-on réduire sans nuire aux bénéficiaires ni aux intervenantes, et lesquelles faut-il garder ?",
    "Mihaela pensait que 7 800 heures de plus feraient baisser le coût de l'heure. Pourquoi la reprise des villages des Hautes-Côtes l'aurait-elle fait monter ? Quel calcul fallait-il faire à la place de la dilution des frais fixes ?",
    "Les passages courts coûtent cher en trajets. Pourquoi le service ne peut-il pas les refuser ? Qu'est-ce qui distingue un coût à réduire d'une activité à supprimer ?",
    "Sous le tirage n° 12, le département a accordé la dotation complémentaire de 2 €. Sur les trente tirages, la demande mesurée de 1 € fait mieux 10 fois, quand la dotation est refusée. Laquelle déposez-vous, et sur quel critère ?",
    "Sous le tirage n° 12, la cellule du CHU a refusé de prévenir le service des hospitalisations. L'alerte organisée avec le SSIAD restait-elle le bon choix ? Pourquoi ?",
    "Quelle règle gardez-vous pour calculer le coût d'un service ? Formulez-la en une phrase, avec le mot « facturée » dedans.",
  ],
  prolongement: {
    enonce:
      "Un service d'aide à domicile a payé 40 000 heures à ses intervenantes l'an dernier, pour 32 000 heures facturées au tarif de 25 € ; 34 000 heures avaient été planifiées. Une heure payée coûte 18 € chargés ; les frais kilométriques s'élèvent à 60 k€ et l'encadrement et la structure à 180 k€. 1) Calculez les charges totales et le coût de revient complet d'une heure facturée. 2) Quel coût trouverait-on en divisant par les heures planifiées ? 3) Quel est le résultat du service ? Vérifiez-le avec le coût de l'heure facturée. 4) Une alerte des hospitalisations permet de réaffecter et de facturer 1 000 des heures aujourd'hui payées pour rien, sans heure payée de plus. Que deviennent le coût de l'heure facturée et le résultat ?",
    corrige:
      "1) 40 000 × 18 = 720 000 € de salaires ; 720 000 + 60 000 + 180 000 = 960 000 € de charges ; 960 000 / 32 000 = 30 € par heure facturée. 2) 960 000 / 34 000 ≈ 28,24 €. 3) 32 000 × 25 = 800 000 € de produits ; 800 000 − 960 000 = −160 000 €, soit (30 − 25) × 32 000. 4) 33 000 heures facturées pour les mêmes 960 000 € : 960 000 / 33 000 ≈ 29,09 € ; résultat : 33 000 × 25 − 960 000 = −135 000 €, soit 25 000 € de mieux.",
  },
  evaluation: [
    "Le coût de revient de l'heure facturée est calculé juste (2 596 k€ / 95 000 ≈ 27,33 €), et l'élève explique pourquoi les 26 € de la comptabilité sont faux.",
    "La perte de l'exercice est retrouvée à partir de l'écart entre le coût de l'heure facturée et le tarif.",
    "Chaque mesure est jugée sur ce qu'elle fait au ratio heures payées / heures facturées, ou au nombre d'heures facturées.",
    "Aucune mesure ne retire à un bénéficiaire une aide de son plan d'aide, et l'élève sait dire pourquoi le service y est tenu.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Le financement des services d'aide à domicile change souvent : le tarif plancher national de l'APA et de la PCH, sa revalorisation annuelle et la dotation complémentaire liée à des engagements sont repris tels que l'épisode les pose (jusqu'à 1 € de majoration, jusqu'à 2 € de dotation) et doivent être vérifiés sur les textes en vigueur. La facturation aux familles d'une intervention annulée relève du règlement de fonctionnement et du document individuel de prise en charge, et du droit de la consommation : l'épisode ne la détaille pas. L'obligation d'assurer les plans d'aide de son secteur est celle qu'il fixe à l'autorisation et au CPOM du service fictif.",
};
