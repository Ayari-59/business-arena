/**
 * L'HEURE D'AIDE À DOMICILE — le contenu de l'épisode.
 *
 * Delphin Diakhaby est responsable du pôle domicile de l'Association
 * Solvanne : le SSIAD et le service d'aide à domicile de Dijon et Beaune. Le
 * service d'aide à domicile a perdu 240 k€ l'an dernier ; le département paie
 * l'heure 24,80 €, la comptabilité annonce un coût de 26 €. Six décisions,
 * d'avril à juin, chacune précédée de ce qu'un responsable de pôle reçoit
 * vraiment.
 *
 * Tous les chiffres des sources sont tirés des constantes du modèle
 * (src/engine/episodes/heure-a-domicile.ts) ; le test de l'épisode en
 * recalcule plusieurs.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Association, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const URSULE = {
  de: "Ursule Mauvernay",
  role: "Directrice générale de l'Association Solvanne",
} as const;
const MIHAELA = { de: "Mihaela Vasilescu", role: "Contrôleuse de gestion, siège" } as const;
const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice administrative et financière",
} as const;
const LEONOR = { de: "Leonor Mathiot", role: "Responsable de secteur, Beaune" } as const;
const VOAHANGY = { de: "Voahangy Rakotomalala", role: "Planificatrice, Dijon" } as const;
const HASMIK = { de: "Hasmik Vartanian", role: "Auxiliaire de vie, secteur de Chenôve" } as const;
const SETTIMIO = { de: "Settimio Naudot", role: "Président de Présence Hautes-Côtes" } as const;
const STAVROS = { de: "Stavros Gruère", role: "Directeur des Quatre Vallées Domicile" } as const;
const CARMELA = { de: "Carmela Ladey", role: "Fille d'une bénéficiaire, Chenôve" } as const;
const YVELISE = {
  de: "Yvelise Pontarlier",
  role: "Chargée de clientèle, Soralis Intérim Santé",
} as const;
const DEPARTEMENT = {
  de: "Conseil départemental de la Côte-d'Or",
  role: "Direction de l'autonomie, service de la tarification",
} as const;
const TABLEAU = { de: "Tableau de bord du service", role: "Point hebdomadaire" } as const;

export const DIAGNOSTICS = [
  {
    id: "revient",
    t: "L'heure facturée coûte bien plus que 26 € : les trajets, la coordination, la formation, les absences et les annulations, payés mais pas facturés, ne sont rapportés qu'aux heures qui se facturent",
  },
  {
    id: "trajets",
    t: "Les tournées sont trop dispersées : les trajets entre deux interventions sont le plus gros temps payé et non facturé",
  },
  {
    id: "courtes",
    t: "Les passages de moins d'une heure coûtent plus qu'ils ne rapportent : ce sont eux qui font le déficit",
  },
  {
    id: "structure",
    t: "Le service porte trop de frais de structure et de siège pour son activité",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Une heure à 26 €, une perte de 240 k€",
    jusqua: 2,
    messages: () => [
      {
        ...URSULE,
        heure: "08:10",
        alerte: true,
        texte:
          "Delphin, l'aide à domicile a perdu 240 k€ l'an dernier, et le premier trimestre est déjà à −61 k€. Le conseil d'administration veut que la perte de l'exercice repasse sous 150 k€, et le dossier pour l'avenant au CPOM part fin mai. Vendredi, en réunion de direction, j'attends ton plan pour avril à juin.",
      },
      {
        ...MIHAELA,
        heure: "09:00",
        texte:
          "Pour ta réunion : la comptabilité calcule un coût de 26 € l'heure, et le département nous paie 24,80 €. On perd 1,20 € par heure. Je n'arrive pas à retrouver les 240 k€ avec ça, mais c'est le chiffre officiel.",
      },
      {
        ...LEONOR,
        heure: "09:40",
        texte:
          "À Beaune, ce sont les passages de trente minutes qui nous tuent : un lever à Pommard, un repas à Meursault, un coucher à Savigny. Les filles passent plus de temps en voiture que chez les gens. Si on n'acceptait plus que des heures pleines, les tournées respireraient.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "paie",
        titre: "Rapprocher la paie et le planning de l'an dernier",
        cout: 1,
        nature: "decisive",
        resultat:
          "L'an dernier, 119 950 heures payées aux intervenantes pour 95 000 heures facturées. Les 24 950 autres : 11 400 heures de trajet entre deux interventions, 5 000 heures d'interventions annulées trop tard pour être remplacées, 3 800 heures de coordination (réunions d'équipe, transmissions, temps avec les responsables de secteur), 2 850 heures d'absences rémunérées hors congés payés, 1 900 heures de formation. Une heure payée coûte en moyenne 17,00 € chargés, congés payés compris.",
      },
      {
        id: "comptes",
        titre: "Reprendre le calcul de la comptabilité avec Mihaela Vasilescu",
        cout: 1,
        nature: "decisive",
        resultat:
          "Les charges du service l'an dernier : 2 039 k€ de salaires chargés des intervenantes, 152 k€ de frais kilométriques (0,40 € du kilomètre), 405 k€ d'encadrement et de structure (quatre responsables de secteur, deux planificatrices, les locaux de Dijon et de Beaune, la télégestion, la quote-part du siège), soit 2 596 k€. Les produits : 2 356 k€, 95 000 heures à 24,80 €. La comptabilité divise les charges par les 100 000 heures planifiées chez les bénéficiaires, annulations comprises : 25,96 €, arrondi à 26 €.",
      },
      {
        id: "courtes",
        titre: "Analyser les passages de moins d'une heure",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les passages de moins d'une heure (lever, aide au repas, coucher) font 14 % des heures facturées et 35 % des trajets : 18 minutes de route par heure facturée, contre un peu plus de 5 pour les interventions plus longues. Sept bénéficiaires sur dix qui en ont sont en GIR 1 ou 2, et ils ont aussi des interventions plus longues : 16 % des heures du service. L'autorisation et le CPOM engagent le service à assurer les plans d'aide APA de son secteur.",
      },
      {
        id: "tarifs",
        titre: "Comparer les tarifs horaires des départements de la région",
        cout: 1,
        nature: "bruit",
        resultat:
          "Le tarif horaire de l'APA à domicile va de 24,10 € à 25,60 € selon les départements de Bourgogne-Franche-Comté ; la Côte-d'Or est dans la moyenne. Le tarif plancher national a été relevé en janvier.",
      },
      {
        id: "conseil",
        titre: "Appeler Hawa Febvre, qui dirige un service d'aide à domicile en Saône-et-Loire",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Hawa : « Une heure ne coûte pas ce que coûte l'heure passée chez le bénéficiaire. Divise tout ce que tu paies par ce que tu factures vraiment, et regarde ce qui s'intercale entre les deux. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quel plan présentez-vous vendredi ?",
    options: [
      {
        t: "Ne plus accepter d'interventions de moins d'une heure, et proposer aux bénéficiaires de regrouper leurs passages",
        d: "À partir de la semaine 3. Les passages courts font les tournées les plus longues : la part des trajets baissera.",
      },
      {
        t: "Sectoriser les tournées : six secteurs, chacun avec son équipe d'intervenantes",
        d: "Les planificatrices refont les plannings avec les responsables de secteur ; 9 000 € de paramétrage et de réunions. Premiers effets dans un mois, et des bénéficiaires changeront d'intervenante.",
      },
      {
        t: "Développer l'activité pour mieux absorber les frais fixes : accepter toutes les demandes, même hors de nos tournées",
        d: "Une relance des CCAS et des caisses de retraite, 2 500 €, et des recrutements au fil des heures nouvelles.",
      },
      {
        t: "Attendre le chiffrage de la comptabilité pour le dossier du CPOM",
        d: "Rien ne change d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...LEONOR,
          texte:
            "On a commencé à appeler les familles. Plusieurs nous demandent qui fera le lever de leur mère, puisque nous ne le ferons plus.",
        },
      ],
      [
        {
          ...VOAHANGY,
          texte:
            "On a tracé les six secteurs sur la carte. Il va falloir annoncer à certains bénéficiaires que leur intervenante change : ça ne va pas plaire à tout le monde.",
        },
      ],
      [
        {
          ...MIHAELA,
          texte:
            "La relance est partie aux CCAS et aux caisses de retraite. Plus d'heures sur les mêmes frais fixes, le coût de l'heure ne peut que baisser.",
        },
      ],
      [
        {
          ...URSULE,
          texte:
            "Attendre, d'accord, mais la perte, elle, n'attend pas. Je veux un plan au plus tard pour le dossier du CPOM.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Personne derrière la porte",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...HASMIK,
        heure: "11:15",
        alerte: true,
        texte:
          "Mardi matin, je suis allée faire la toilette de M. Fyot à Chenôve : personne. Il était hospitalisé depuis dimanche, et personne ne nous a prévenus. Jeudi, pareil chez une dame de Longvic. Je suis payée, mais je n'ai rien fait.",
      },
      {
        ...VOAHANGY,
        heure: "14:30",
        texte: `Cette semaine, ${ctx.annulations} des heures facturées ont été annulées trop tard pour être remplacées. Quand j'apprends l'annulation à 8 heures, je n'ai personne à qui proposer le créneau.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 2 : ${ctx.facturees} heures facturées, ${ctx.ratio} heure payée pour une heure facturée, coût de revient de l'heure facturée ${ctx.cout}. Résultat du trimestre à date : ${ctx.cumul}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "annulations",
        titre: "Relire les annulations des quatre dernières semaines",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Une intervention planifiée sur vingt est annulée trop tard pour être remplacée. Six fois sur dix, c'est une hospitalisation que personne n'a signalée au service ; une fois sur quatre, un bénéficiaire absent ou une famille qui a oublié de prévenir ; le reste tient à nos propres changements de planning. L'intervenante est payée dans tous les cas. Dans la moitié des hospitalisations, le SSIAD ou un infirmier libéral le savait dès la veille au soir ; les autres se décident la nuit, aux urgences.",
      },
      {
        id: "ssiad",
        titre: "Demander à Thuy Chevrolat comment le SSIAD apprend les hospitalisations",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Thuy : « Une quarantaine de vos bénéficiaires sont aussi suivis par le SSIAD : on sait souvent avant vous qu'ils partent à l'hôpital. Et la cellule de coordination des sorties du CHU prévient les services qui le lui demandent, quand elle a leur nom dans le dossier. »",
      },
    ],
    question: "Que faites-vous des annulations ?",
    options: [
      {
        t: "Facturer aux familles les interventions annulées moins de 48 heures avant, hors hospitalisation",
        d: "Un avenant au règlement de fonctionnement et un courrier aux familles, 600 €. Une recette nouvelle dès la semaine 4.",
      },
      {
        t: "Organiser l'alerte des hospitalisations avec le SSIAD, les infirmiers et le CHU, et réaffecter le jour même les heures libérées",
        d: "Une planificatrice chargée des réaffectations, 250 € par semaine. Le CHU dira s'il joue le jeu.",
      },
      {
        t: "Faire appeler la veille chaque bénéficiaire par les planificatrices",
        d: "Un renfort de planification, 500 € par semaine, dès la semaine 3.",
      },
      {
        t: "Ne rien changer : les annulations font partie du métier",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...LEONOR,
          texte:
            "Le courrier est parti. Le téléphone n'arrête pas : des familles qui demandent si on va leur facturer le jour où leur père était aux urgences.",
        },
      ],
      null,
      [
        {
          ...VOAHANGY,
          texte:
            "On appelle tout le monde la veille. Beaucoup répondent « oui, à demain »… et partent à l'hôpital dans la nuit.",
        },
      ],
      [
        {
          ...HASMIK,
          texte: "D'accord. On continuera à trouver des portes fermées.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Une association ferme",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...DEPARTEMENT,
        heure: "10:00",
        alerte: true,
        texte:
          "L'association Présence Hautes-Côtes cesse son activité fin mai. Ses 60 bénéficiaires, 150 heures par semaine, doivent être repris. Le département souhaite connaître votre position d'ici quinze jours.",
      },
      {
        ...MIHAELA,
        heure: "11:30",
        texte:
          "7 800 heures de plus par an, c'est une aubaine : à 26 € dont plus de 4 € de structure, chaque heure en plus nous rapporte 3 €, et le coût de l'heure baisse pour tout le monde.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 4 : ${ctx.facturees} heures facturées, trajets ${ctx.trajets} des heures facturées, coût de revient de l'heure facturée ${ctx.cout}. Résultat du trimestre à date : ${ctx.cumul}.`,
      },
    ],
    sources: [
      {
        id: "carte",
        titre: "Situer les 60 bénéficiaires sur la carte des tournées",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "24 bénéficiaires, 60 heures par semaine, habitent Nuits-Saint-Georges, Gevrey-Chambertin et des communes déjà sur nos tournées. Les 36 autres, 90 heures par semaine, vivent dans les villages des Hautes-Côtes, autour de Bligny-sur-Ouche : 24 minutes de route et 16 km par heure facturée, contre 7 minutes en moyenne sur nos tournées.",
      },
      {
        id: "partenaire",
        titre: "Appeler Stavros Gruère, des Quatre Vallées Domicile",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Stavros : « Nous intervenons déjà dans onze de ces villages depuis Bligny. Les 36 bénéficiaires des Hautes-Côtes, nous pouvons les prendre si le département nous les confie ; vos tournées de Nuits et de Gevrey, nous n'y allons pas. »",
      },
    ],
    question: "Que répondez-vous au département ?",
    options: [
      {
        t: "Tout reprendre : 7 800 heures de plus par an pour mieux absorber les frais fixes",
        d: "Les 60 bénéficiaires et les intervenantes qui les suivent, à partir de la semaine 9. 3 000 € d'intégration.",
      },
      {
        t: "Reprendre les 24 bénéficiaires de nos tournées, et proposer que les villages soient confiés aux Quatre Vallées Domicile",
        d: "60 heures par semaine à partir de la semaine 9, 1 200 € d'intégration. Une proposition à faire accepter au département.",
      },
      {
        t: "Refuser : le service perd déjà assez d'argent",
        d: "Le département cherchera un autre repreneur.",
      },
    ],
    reactions: [
      [
        {
          ...DEPARTEMENT,
          texte:
            "Le département vous remercie de reprendre l'ensemble des bénéficiaires. Les transferts de dossiers commencent la semaine prochaine.",
        },
      ],
      [
        {
          ...STAVROS,
          texte:
            "Le département a accepté : nous prenons les Hautes-Côtes, vous Nuits et Gevrey. On se partage les dossiers lundi.",
        },
      ],
      [
        {
          ...SETTIMIO,
          texte:
            "Je comprends. Mais je ne sais pas qui ira chez nos bénéficiaires de Nuits, qui sont pourtant sur votre route.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Couper dans le temps non facturé",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...EUDOXIE,
        heure: "09:20",
        alerte: true,
        texte:
          "Delphin, pour 100 heures facturées, vous en payez 126. Je vous demande de supprimer la réunion d'équipe hebdomadaire de chaque secteur et de reporter les formations à l'automne : ce sont des heures payées que personne ne nous rembourse.",
      },
      {
        ...LEONOR,
        heure: "10:05",
        texte:
          "La réunion du mardi, c'est le seul moment où les filles se voient. C'est là qu'on apprend que Mme Pétiard ne mange plus ou que M. Rouhier tombe.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 6 : ${ctx.ratio} heure payée pour une heure facturée, coût de revient de l'heure facturée ${ctx.cout}. Résultat du trimestre à date : ${ctx.cumul}.`,
      },
    ],
    sources: [
      {
        id: "reunions",
        titre: "Relire l'essai du secteur de Beaune en 2024",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "En 2024, le secteur de Beaune a remplacé ses réunions par des messages pendant trois mois : les absences de ses intervenantes sont passées de 3 à 5 % des heures, deux sont parties, et les annulations non signalées ont augmenté d'un dixième. À Talant, les transmissions écrites sur la télégestion ont pris deux fois moins de temps qu'une réunion sur deux, pour les mêmes informations.",
      },
      {
        id: "formations",
        titre: "Regarder les formations du trimestre",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Gestes et postures, transferts des personnes alitées, prévention des chutes : l'OPCO en finance la moitié. Les reporter ne fait que les décaler à l'automne.",
      },
    ],
    question: "Que répondez-vous à la directrice financière ?",
    options: [
      {
        t: "Supprimer les réunions d'équipe et reporter les formations à l'automne",
        d: "Dès la semaine 7. Les transmissions se feront au fil de l'eau.",
      },
      {
        t: "Garder une réunion par quinzaine, passer les transmissions quotidiennes sur la télégestion, maintenir les formations",
        d: "1 500 € de paramétrage et de formation au module de transmissions.",
      },
      {
        t: "Ne rien changer, et expliquer à la direction financière ce que ces temps protègent",
        d: "Les réunions et les formations restent comme elles sont.",
      },
    ],
    reactions: [
      [
        {
          ...LEONOR,
          texte:
            "J'ai annoncé la fin des réunions. Personne n'a rien dit. Deux filles m'ont demandé à qui elles devaient signaler ce qu'elles voient chez les gens.",
        },
      ],
      [
        {
          ...HASMIK,
          texte:
            "Les transmissions sur le téléphone, c'est pratique : je lis le soir ce qu'a noté ma collègue du matin. Et on se voit quand même toutes les deux semaines.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Entendu. Mais alors, montrez-moi où vous trouvez les économies, parce que je ne les vois pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le dossier du CPOM",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...DEPARTEMENT,
        heure: "09:00",
        alerte: true,
        texte:
          "Rappel : les dossiers tarifaires pour les avenants aux CPOM des services d'aide à domicile sont à déposer avant le 31 mai. Les majorations prendront effet au 1er juillet.",
      },
      {
        ...MIHAELA,
        heure: "10:30",
        texte:
          "J'ai le chiffrage officiel prêt à partir : 26 € de coût, 24,80 € de tarif, on demande 1,20 € de plus. Ça part en une heure.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 8 : coût de revient de l'heure facturée ${ctx.cout}, trajets ${ctx.trajets} des heures facturées. Résultat du trimestre à date : ${ctx.cumul}.`,
      },
    ],
    sources: [
      {
        id: "note",
        titre: "Lire la note du département sur les avenants tarifaires",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le département demande un coût de revient par heure facturée, ses composantes, et le plan d'action du service. Sur ce dossier, il peut majorer le tarif jusqu'à 1 € de l'heure. La dotation complémentaire, jusqu'à 2 € de l'heure, suppose des engagements : interventions le soir et le week-end, accompagnement des GIR 1 et 2, zones peu denses. L'an dernier, deux dossiers complets sur trois ont obtenu tout ou partie de leur demande ; aucun dossier sans calcul de coût n'a obtenu plus de 0,40 €. Le département regarde aussi les refus de plans d'aide et les réclamations des familles.",
      },
      {
        id: "engagements",
        titre: "Demander à Mihaela ce que coûteraient les engagements",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Mihaela : « Les majorations du soir et du week-end, et un peu plus de route : à peu près 0,40 € par heure APA ou PCH. Ces heures font 88 % des nôtres. Pour te donner l'ordre de grandeur : 1 € de l'heure au 1er juillet, c'est environ 42 k€ d'ici décembre. »",
      },
    ],
    question: "Quel dossier déposez-vous ?",
    options: [
      {
        t: "Transmettre le chiffrage de la comptabilité : 26 € de coût, et demander 1,20 € de plus",
        d: "Prêt tout de suite, sans frais.",
      },
      {
        t: "Un dossier complet et une demande mesurée : le coût de revient de l'heure facturée, ses composantes, le plan d'action, et 1 € de majoration",
        d: "Deux jours de travail avec Mihaela et une mise en forme, 1 500 €.",
      },
      {
        t: "Le même dossier, en demandant la dotation complémentaire de 2 € contre des engagements",
        d: "Interventions le soir et le week-end, GIR 1 et 2, zones peu denses. 2 500 € de préparation ; le département accorde tout ou rien.",
      },
      {
        t: "Reporter la demande à l'an prochain",
        d: "Pas de dossier cette année.",
      },
    ],
    reactions: [
      [
        {
          ...MIHAELA,
          texte: "C'est parti. Le département a accusé réception.",
        },
      ],
      [
        {
          ...MIHAELA,
          texte:
            "Le dossier est déposé : 27,33 € de coût de revient par heure facturée, ligne par ligne, et ce qu'on a engagé depuis avril.",
        },
      ],
      [
        {
          ...MIHAELA,
          texte:
            "Le dossier est déposé, avec les engagements chiffrés. Le département nous a fait savoir que les demandes de dotation complémentaire seraient nombreuses cette année.",
        },
      ],
      [
        {
          ...URSULE,
          texte:
            "Je l'expliquerai au conseil d'administration. Mais sans majoration, la perte restera.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Préparer l'été",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...VOAHANGY,
        heure: "09:45",
        alerte: true,
        texte:
          "Les congés d'été sont posés : en juillet et en août, une heure sur cinq sera faite par quelqu'un d'autre que l'intervenante habituelle. Il faut décider maintenant comment on remplace.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 10 : ${ctx.facturees} heures facturées, coût de revient de l'heure facturée ${ctx.cout}. Résultat du trimestre à date : ${ctx.cumul}.`,
      },
    ],
    sources: [
      {
        id: "ete",
        titre: "Relire le bilan de l'été dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les remplaçants recrutés fin juin et envoyés là où il manquait quelqu'un ont fait 13 minutes de route de plus par heure facturée que les titulaires, et 4 % des heures de juillet et d'août n'ont pas été assurées. Les quelques-uns qui avaient fait deux jours en binôme sur un même secteur n'en ont fait que 7 de plus ; sur un secteur déjà découpé, ce serait moitié moins.",
      },
      {
        id: "soralis",
        titre: "Demander une offre à Soralis Intérim Santé",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Yvelise Pontarlier : « Nous avons des aides à domicile disponibles en juillet et en août, pour un quart de vos remplacements environ. Comptez à peu près deux fois le coût d'une heure salariée. Elles ne connaissent ni vos bénéficiaires ni vos tournées. »",
      },
    ],
    question: "Comment préparez-vous l'été ?",
    options: [
      {
        t: "Suspendre en juillet et en août les passages de moins d'une heure et le ménage non essentiel",
        d: "Moins de remplacements à trouver. Un courrier aux familles dès la semaine 12.",
      },
      {
        t: "Recruter dès maintenant des remplaçants d'été, chacun rattaché à un secteur et formé deux jours en binôme",
        d: "2 600 € de binômes et d'annonces en juin.",
      },
      {
        t: "Confier une partie des remplacements à Soralis Intérim Santé",
        d: "Un quart des remplacements, sans recrutement à faire.",
      },
      {
        t: "Faire comme chaque été : recruter fin juin et compléter par des heures complémentaires",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...CARMELA,
          texte:
            "Ma mère ne peut pas se lever seule. Vous m'expliquez qui va le faire en juillet ? J'ai écrit au département.",
        },
      ],
      [
        {
          ...LEONOR,
          texte:
            "Six remplaçantes recrutées, deux étudiantes infirmières et quatre aides à domicile. Elles font leurs binômes la semaine prochaine, chacune sur le secteur qu'elle gardera tout l'été.",
        },
      ],
      [
        {
          ...YVELISE,
          texte:
            "C'est noté : nous vous réservons nos aides à domicile pour juillet et août. Les plannings nous arriveront la veille, comme d'habitude.",
        },
      ],
      [
        {
          ...VOAHANGY,
          texte: "Comme chaque année, alors. On fera au mieux en juillet.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  {
    nom: "Chiffrer juste, puis agir sur les tournées et les annulations",
    chemin: [1, 1, 1, 1, 2, 1],
  },
  { nom: "Couper les petites interventions et diluer les frais fixes", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 2, 2, 3, 3] },
] as const;

/**
 * Les réflexes du coût apparent : refuser les passages courts, multiplier les
 * heures pour diluer les frais fixes (une relance partout, la reprise des
 * villages), faire payer les annulations aux familles, couper la coordination
 * et la formation, négocier sur les 26 € de la comptabilité, suspendre les
 * passages courts l'été. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  chuOui:
    "La cellule de coordination des sorties du CHU accepte : dès qu'un de vos bénéficiaires est admis, nous vous envoyons un message. Le SSIAD fera de même.",
  chuNon:
    "La cellule de coordination des sorties du CHU ne peut pas s'engager : trop de services le demandent. Le SSIAD et les infirmiers libéraux vous préviendront, eux.",
  refus:
    "Sur les bénéficiaires à qui on a proposé de regrouper leurs passages, presque aucun n'a accepté : un lever et un coucher ne se regroupent pas. Plusieurs familles cherchent un autre service, pour toutes leurs heures.",
  plainte:
    "Le département a reçu la plainte d'une famille dont la mère, en GIR 1, n'a plus de passage du soir. Il vous rappelle que votre autorisation et votre CPOM vous engagent à assurer les plans d'aide de votre secteur, et note ce refus dans votre dossier.",
  plannings:
    "Les nouveaux plannings par secteur sont en place. Quelques bénéficiaires ont refusé de changer d'intervenante, et l'une a préféré partir chez un autre service.",
  tournees:
    "Les tournées raccourcissent : les intervenantes enchaînent des bénéficiaires du même quartier, et les kilomètres baissent chaque semaine.",
  relance:
    "Les heures nouvelles arrivent : surtout des communes que nos tournées ne desservent pas, à vingt minutes de la dernière intervention.",
  facturation:
    "Trois familles ont contesté leur facture d'annulation ; deux ont trouvé un autre service. Une assistante sociale du CHU nous demande si nous facturons aussi les jours d'hospitalisation.",
  repriseTout:
    "Les 60 bénéficiaires de Présence Hautes-Côtes sont repris. Les intervenantes des villages font leurs premières tournées : beaucoup de route entre deux maisons.",
  repriseSecteurs:
    "Les 24 bénéficiaires de Nuits et de Gevrey sont intégrés dans nos tournées ; les Quatre Vallées Domicile ont pris les villages.",
  evenement:
    "Un bénéficiaire de Quetigny a été hospitalisé après une chute. Son intervenante avait remarqué depuis plusieurs jours qu'il se levait difficilement, mais l'information n'est pas remontée. Sa famille a adressé une réclamation au service et au département.",
  departs: (n: number) =>
    `${n === 1 ? "Une intervenante a" : `${n} intervenantes ont`} donné ${n === 1 ? "sa" : "leur"} démission : « on se sent seules sur la route ». Recrutement à relancer, et des heures non assurées en attendant.`,
  suspension:
    "Le courrier sur la suspension des passages courts cet été est parti. Les responsables de secteur reçoivent des appels inquiets.",
  signalement:
    "Le département a reçu le signalement d'une famille sur la suspension des passages du soir cet été, pour une bénéficiaire qui ne peut pas se coucher seule. Il vous demande de rétablir les plans d'aide et en tiendra compte.",
} as const;

/** La notification du département sur le CPOM, selon le dossier et ce qu'il accorde. */
export function notificationCPOM(dossier: number, accordee: number): string {
  if (dossier === 0) {
    return accordee > 0
      ? "Votre dossier fait état d'un coût de 26 €, qui n'explique pas votre déficit. Le département vous accorde 0,40 € de l'heure au 1er juillet, au titre de l'évolution des salaires."
      : "Votre dossier fait état d'un coût de 26 €, qui n'explique pas votre déficit. Faute d'analyse du coût de revient, le département ne peut pas retenir votre demande cette année.";
  }
  if (dossier === 1) {
    return accordee >= 1
      ? "Le département retient votre analyse du coût de revient de l'heure facturée et votre plan d'action : votre tarif est majoré de 1 € de l'heure au 1er juillet."
      : accordee > 0
        ? "Le département retient votre analyse, mais son enveloppe est contrainte : votre tarif est majoré de 0,50 € de l'heure au 1er juillet."
        : "Le département prend note de votre analyse, mais ne peut pas majorer votre tarif cette année, au vu des réclamations reçues sur le service.";
  }
  return accordee > 0
    ? "Le département vous accorde la dotation complémentaire de 2 € de l'heure au 1er juillet, avec les engagements de votre dossier : interventions le soir et le week-end, GIR 1 et 2, zones peu denses."
    : "Les demandes de dotation complémentaire dépassent l'enveloppe : le département ne retient pas la vôtre cette année, et ne majore pas votre tarif.";
}
