/**
 * LES LITS QUI RESTENT VIDES — le contenu de l'épisode.
 *
 * Corentine Baradat dirige l'EHPAD de Beaune de l'Association Solvanne :
 * 88 places, un taux d'occupation tombé à 91 %, huit lits vides en moyenne et
 * soixante noms sur la liste d'attente. Le siège parle de baisser le prix de
 * journée ou de lancer une campagne de publicité. Janvier à mars : six
 * décisions, chacune précédée de ce qu'une directrice d'EHPAD reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Chaque chiffre qu'elles
 * donnent vient des constantes du modèle ; le test de l'épisode le vérifie.
 *
 * Établissement, personnes et chiffres sont fictifs.
 */
import {
  BAISSE_PAR_JOUR,
  CHANCE_EXTENSION,
  COUTS,
  COUT_INADAPTEE,
  DELAI_COMMISSION_RAPIDE,
  DELAI_DEPART,
  DELAI_REMISE_RAPIDE,
  DEPENDANCE,
  ETAPES_DU_DELAI,
  LISTE,
  NUITS_DE_RENFORT,
  NUIT_INTERIM,
  PLACES_ASH,
  PLACES_LIBRES,
  PRIX_ASH,
  PRIX_LIBRE,
  PRIX_MOYEN,
  RECETTE_JOUR,
} from "@/engine/episodes/lits-vides";
import type { Etape } from "./types";
import { euros } from "./format";

/** Un prix au centime, comme sur une grille tarifaire : « 74,10 € ». */
export const centimes = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export const DIAGNOSTICS = [
  {
    id: "circuit",
    t: "Les chambres restent vides parce que le circuit d'admission est lent : commission mensuelle, dossiers incomplets, liste d'attente jamais mise à jour",
  },
  {
    id: "prescripteurs",
    t: "L'hôpital, le SSIAD et les médecins traitants adressent moins de demandes à l'établissement",
  },
  { id: "prix", t: "Le prix de journée est trop élevé pour les familles du Beaunois" },
  {
    id: "notoriete",
    t: "L'établissement manque de notoriété : les familles ne pensent pas à lui",
  },
] as const;

export const CORENTINE = { de: "Corentine Baradat", role: "Directrice" } as const;
export const GUILLEMETTE = {
  de: "Guillemette Bouchardat",
  role: "Infirmière coordinatrice (IDEC)",
} as const;
export const DOROTA = { de: "Dr Dorota Jeannenot", role: "Médecin coordonnateur" } as const;
export const HOURIA = { de: "Houria Chaudat", role: "Secrétaire, accueil et admissions" } as const;
export const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice administrative et financière, siège",
} as const;
export const YAMINA = { de: "Yamina Lapostolle", role: "Assistante sociale, hôpital" } as const;
export const VALERE = {
  de: "Valère Bellefontaine",
  role: "Directeur de l'EHPAD de Montbard",
} as const;
export const SULPICE = { de: "Sulpice Guyennot", role: "Responsable technique" } as const;
export const MARIETOU = { de: "Mariétou Dembélé", role: "Aide-soignante de nuit" } as const;
export const ROCIO = {
  de: "Rocío Pirès",
  role: "Directrice, Orchidia Résidences Beaune",
} as const;
export const ISAAC = { de: "Dr Isaac Bénévent", role: "Médecin traitant, Beaune" } as const;

const { remise, commission, appels, dossier, visite, entree } = ETAPES_DU_DELAI;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Huit lits vides",
    jusqua: 2,
    messages: () => [
      {
        de: "Tableau de bord de l'établissement",
        role: "Point mensuel",
        heure: "07:50",
        alerte: true,
        texte: `Taux d'occupation de décembre : 91 %, soit huit lits vides en moyenne sur 88, pour une cible de 97 %. Liste d'attente : ${LISTE.inscrits} inscrits.`,
      },
      {
        ...EUDOXIE,
        heure: "09:10",
        texte:
          "Corentine, Beaune est le seul de nos six EHPAD sous 95 %. Au siège, on pense à deux pistes : baisser de 5 % le prix de journée de tes places à tarif libre, ou lancer la campagne de publicité que l'agence nous a proposée. Dis-moi vendredi ce que tu retiens.",
      },
      {
        ...GUILLEMETTE,
        heure: "10:30",
        texte:
          "Trois chambres libérées depuis Noël, dont deux après une hospitalisation pour la grippe. La commission d'admission se réunit le deuxième mardi du mois : la prochaine, c'est le 12.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "parcours",
        titre: "Reconstituer le parcours des dix dernières entrées",
        cout: 1,
        nature: "decisive",
        resultat: `De la libération d'une chambre à l'entrée du résident suivant, ${DELAI_DEPART} jours en moyenne : ${remise} jours de remise en état ; ${commission} jours d'attente de la commission mensuelle ; ${appels} jours d'appels de la liste, parce qu'on appelle dans l'ordre d'inscription : en moyenne cinq appels sans suite avant de trouver une personne qui veut entrer, deux jours de rappels chacun, puis deux jours pour l'appel qui aboutit ; ${dossier} jours pour compléter un dossier (le volet médical manque six fois sur dix) ; ${visite} jours pour caler la visite de préadmission, faite une demi-journée par semaine ; ${entree} jours pour la date d'entrée choisie par la famille.`,
      },
      {
        id: "recettes",
        titre: "Relire ce que rapporte une journée dans l'EPRD",
        cout: 0.5,
        nature: "decisive",
        resultat: `Hébergement : ${PLACES_ASH} places habilitées à l'aide sociale à ${PRIX_ASH} € (prix arrêté par le conseil départemental), ${PLACES_LIBRES} places à tarif libre à ${PRIX_LIBRE} €, soit ${PRIX_MOYEN} € en moyenne par journée facturée. Dépendance : ${DEPENDANCE} € en moyenne par journée (le ticket modérateur payé par le résident, et l'APA que le département de la Côte-d'Or verse à la journée de présence). Soins : un forfait annuel de l'ARS, qui ne dépend pas des journées à court terme ; l'ARS peut le moduler à la baisse si l'occupation reste basse sur l'année. Une journée vide, c'est donc ${RECETTE_JOUR} € qui ne seront pas facturés.`,
      },
      {
        id: "prix",
        titre: "Comparer les prix des EHPAD du Beaunois",
        cout: 1,
        nature: "utile",
        resultat: `Vos places à tarif libre sont à ${PRIX_LIBRE} € ; l'EHPAD public voisin est à 71 €, un établissement associatif de la côte à 82 €. Orchidia Résidences, qui ouvre à Beaune début février, annonce 104 €. Sur les dix-neuf familles qui ont décliné une place l'an dernier, deux ont parlé du prix ; onze avaient trouvé ailleurs pendant qu'on les faisait attendre.`,
      },
      {
        id: "agence",
        titre: "Lire la proposition de l'agence de communication",
        cout: 1,
        nature: "bruit",
        resultat: `Une campagne de six semaines : affichage dans Beaune, un spot sur une radio locale, une page dans le magazine municipal et des publications sur les réseaux sociaux. ${euros(COUTS.campagne)}. L'agence promet « une hausse de la notoriété assistée de 15 points » et « un flux de nouvelles demandes ».`,
      },
      {
        id: "conseil",
        titre: "Appeler Valère, directeur de l'EHPAD de Montbard",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Valère : « Montbard était à 92 % il y a deux ans. Avant de toucher au prix, chronomètre une chambre vide, de la libération à l'entrée. Chez nous, la moitié du délai, c'était l'attente de la commission. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que répondez-vous au siège vendredi ?",
    options: [
      {
        t: "Baisser de 5 % le prix de journée des places à tarif libre",
        d: `De ${PRIX_LIBRE} € à ${centimes(PRIX_LIBRE - BAISSE_PAR_JOUR)}, pour tous les résidents de ces places : deux prix dans le même couloir ne se défendraient pas.`,
      },
      {
        t: "Chronométrer le circuit d'admission et le resserrer",
        d: `Commission chaque semaine (l'IDEC, le médecin coordonnateur et vous), chambre remise en état sous 48 heures. ${euros(COUTS.commission)} de temps sur le trimestre.`,
      },
      {
        t: "Lancer la campagne de publicité proposée par l'agence",
        d: `Six semaines d'affichage, de radio et de réseaux sociaux à partir de la semaine 3. ${euros(COUTS.campagne)}.`,
      },
      {
        t: "Attendre le printemps",
        d: "L'hiver libère des chambres ; les admissions reprendront quand les épidémies seront passées.",
      },
    ],
    reactions: [
      [
        {
          ...EUDOXIE,
          texte: `C'est noté : la grille passe à ${centimes(PRIX_LIBRE - BAISSE_PAR_JOUR)} dès la semaine prochaine. Les familles des résidents actuels ont reçu le courrier ; plusieurs ont appelé pour remercier.`,
        },
      ],
      [
        {
          ...GUILLEMETTE,
          texte: `Première commission hebdomadaire mardi : deux dossiers validés en une heure. Sulpice s'engage à rendre une chambre prête en ${DELAI_REMISE_RAPIDE} jours, ${DELAI_COMMISSION_RAPIDE} jours au plus pour la décision.`,
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "L'agence lance la campagne en semaine 3. Elle te demande des photos des jardins et un résident souriant, avec son accord.",
        },
      ],
      [
        {
          ...GUILLEMETTE,
          texte:
            "La chambre 108 est libre depuis le 28 décembre. On la proposera à la commission du 12.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · lundi",
    titre: "Soixante noms sur la liste",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...HOURIA,
        heure: "09:20",
        alerte: true,
        texte:
          "Pour la chambre 112, j'ai appelé six personnes de la liste depuis jeudi. Une a une place à Nuits-Saint-Georges depuis octobre, deux familles « ne sont pas prêtes », un monsieur est décédé en novembre, et j'attends deux rappels.",
      },
      {
        de: "Tableau de bord de l'établissement",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 2 : taux d'occupation ${ctx.occupation}, ${ctx.vides} lits vides. Délai entre une chambre libérée et l'entrée suivante : ${ctx.delai}. Liste d'attente : ${ctx.inscrits} inscrits.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "echantillon",
        titre: "Appeler soi-même cinq inscrits tirés au sort",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur cinq inscrits, un seul veut entrer maintenant. Deux ont une place ailleurs depuis l'automne ; une fille a « inscrit maman par précaution, pour plus tard » ; un monsieur relève d'une unité d'hébergement renforcé que l'établissement n'a pas. Aucun n'avait prévenu.",
      },
      {
        id: "temps",
        titre: "Demander à l'IDEC ce que coûterait d'appeler toute la liste",
        cout: 0.5,
        nature: "utile",
        resultat: `Soixante appels, des rappels, des familles qui hésitent : deux jours pour Guillemette, trois pour Houria, pendant lesquels il faut les remplacer. ${euros(COUTS.appels)}. Un courrier demandant de confirmer coûte ${euros(COUTS.courrier)}, mais à Chalon moins d'une famille sur deux avait répondu.`,
      },
    ],
    question: "Que faites-vous de la liste d'attente ?",
    options: [
      {
        t: "Faire appeler les soixante inscrits pour savoir qui veut entrer, quand, et dans quel état",
        d: `L'IDEC et la secrétaire, cette semaine, remplacées pendant ce temps. ${euros(COUTS.appels)}.`,
      },
      {
        t: "Garder la liste telle quelle et appeler dans l'ordre à chaque chambre libérée",
        d: "C'est la règle d'équité de l'établissement : premier inscrit, premier appelé.",
      },
      {
        t: "Écrire aux soixante inscrits pour leur demander de confirmer",
        d: `Un courrier avec un coupon-réponse, relancé une fois. ${euros(COUTS.courrier)}.`,
      },
      {
        t: "Ouvrir l'inscription en ligne sur le site de Solvanne pour allonger la liste",
        d: `Un formulaire sur le site, relayé par la campagne du siège. ${euros(COUTS.enLigne)}.`,
      },
    ],
    reactions: [
      [
        {
          ...GUILLEMETTE,
          texte: `C'est fait. Sur ${LISTE.inscrits} inscrits : ${LISTE.ailleurs} ont déjà une place ailleurs, ${LISTE.pasMaintenant} ne veulent pas entrer avant l'été, ${LISTE.partis} sont décédés ou partis, ${LISTE.horsProfil} relèvent d'une unité que nous n'avons pas. Il en reste ${LISTE.actifs} qui veulent et peuvent entrer maintenant. La vraie liste tient sur une page.`,
        },
      ],
      [
        {
          ...HOURIA,
          texte: "J'ai fini par trouver quelqu'un pour la 112 : la neuvième personne appelée.",
        },
      ],
      [
        {
          ...HOURIA,
          texte:
            "Les courriers sont partis. Les premiers coupons reviennent ; on fera le point dans trois semaines.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Le formulaire est en ligne. Huit inscriptions la première semaine : la liste s'allonge, c'est bon signe.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · lundi",
    titre: "Orchidia ouvre à Beaune",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...YAMINA,
        heure: "11:15",
        alerte: true,
        texte:
          "Madame Baradat, je vous préviens par honnêteté : Orchidia Résidences ouvre début février, à la sortie de Beaune. Leur directrice est passée dans les services. Ils répondent à une demande d'admission en 48 heures. Chez vous, la dernière réponse a mis trois semaines, et la patiente était sortie entre-temps.",
      },
      {
        ...EUDOXIE,
        heure: "14:40",
        texte:
          "Orchidia offre les frais de dossier et promet « une entrée sous huit jours ». Tu ne crois pas qu'un geste commercial s'impose ?",
      },
      {
        de: "Tableau de bord de l'établissement",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 4 : taux d'occupation ${ctx.occupation}, ${ctx.vides} lits vides, délai entre une chambre libérée et l'entrée suivante : ${ctx.delai}.`,
      },
    ],
    sources: [
      {
        id: "demandes",
        titre: "Reprendre les demandes reçues de l'hôpital depuis septembre",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Trente-quatre demandes de l'hôpital en quatre mois, neuf entrées. Quatorze ont été perdues parce que la réponse est arrivée après la sortie du patient : l'hôpital attend une réponse en 72 heures, la vôtre arrivait en dix-neuf jours. Quand le dossier transmis par le service est complet, le volet médical ne manque plus. Les demandes de l'hôpital pèsent la moitié de vos entrées.",
      },
      {
        id: "orchidia",
        titre: "Se renseigner sur Orchidia à Chalon-sur-Saône",
        cout: 0.5,
        nature: "utile",
        resultat:
          "À Chalon, Orchidia a signé en trois mois une convention avec l'hôpital local : un interlocuteur unique, une réponse en 48 heures. Le directeur de l'EHPAD de Solvanne à Chalon : « Ils ont eu la convention parce que nous mettions des semaines à répondre. Là où l'EHPAD voisin répond vite, l'hôpital ne leur donne pas l'exclusivité. »",
      },
      {
        id: "proximite",
        titre: "Faire le point avec le SSIAD de Solvanne et deux médecins traitants",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'infirmière coordinatrice du SSIAD suit une dizaine de personnes à Beaune pour qui le domicile ne tient plus ; personne ne lui a jamais demandé de les orienter vers l'EHPAD. Dr Isaac Bénévent : « Je ne sais pas qui appeler chez vous, ni ce qu'il faut dans le dossier. »",
      },
    ],
    question: "Comment répondez-vous à l'arrivée d'Orchidia ?",
    options: [
      {
        t: "Proposer au service social de l'hôpital une convention : réponse sous 72 heures, dossier type, un interlocuteur",
        d: `L'IDEC passe une demi-journée par semaine à l'hôpital. ${euros(COUTS.convention)}. L'hôpital acceptera ou non.`,
      },
      {
        t: "Faire la tournée des prescripteurs de proximité : SSIAD, médecins traitants, dispositif d'appui à la coordination",
        d: `Une fiche d'admission simple, un numéro direct, un point chaque mois. ${euros(COUTS.reseau)}.`,
      },
      {
        t: "Offrir quinze jours d'hébergement à chaque nouvel entrant, comme geste d'accueil",
        d: `${euros(COUTS.geste)} par entrée, annoncés aux familles et aux prescripteurs.`,
      },
      {
        t: "Ne rien changer : la réputation de Solvanne à Beaune suffit",
        d: "Trente ans d'existence et une équipe connue des familles.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...ISAAC,
          texte:
            "Merci pour la fiche et le numéro direct. J'ai deux patients pour qui le domicile ne tient plus : je vous les adresse cette semaine.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Le geste est annoncé. Les familles demandent surtout quand une chambre sera libre.",
        },
      ],
      [
        {
          ...YAMINA,
          texte:
            "Je comprends. Je transmettrai les demandes aux deux établissements, et la famille choisira celui qui répondra le premier.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · lundi",
    titre: "Sur dossier, comme Orchidia",
    jusqua: 8,
    messages: () => [
      {
        ...YAMINA,
        heure: "10:05",
        alerte: true,
        texte:
          "Orchidia admet sur dossier, sans visite, en 48 heures. J'ai deux patientes qui sortent jeudi. Si vous voulez nos patients, il faudra faire pareil.",
      },
      {
        ...DOROTA,
        heure: "12:30",
        texte:
          "Je ne signe pas une admission sans que quelqu'un de chez nous ait vu la personne. L'une des deux dames a des troubles du comportement la nuit ; l'unité protégée est complète, et nous sommes deux aides-soignantes la nuit pour 88 résidents.",
      },
    ],
    sources: [
      {
        id: "chalon",
        titre: "Relire ce qu'ont donné les admissions sur dossier à Chalon l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat: `Dix admissions faites sur dossier seul, en sortie d'hospitalisation, pour aller plus vite : trois dépassaient ce que l'unité pouvait accompagner. Chaque fois, ${NUITS_DE_RENFORT} nuits de renfort en intérim chez Soralis Intérim Santé, à ${euros(NUIT_INTERIM)} la nuit, soit ${euros(COUT_INADAPTEE)} ; une chute avec fracture ; une réorientation vers une unité d'hébergement renforcé au bout d'un mois, et la chambre de nouveau vide. Avec une évaluation, même rapide, une admission sur vingt-cinq.`,
      },
      {
        id: "rapide",
        titre:
          "Demander à l'IDEC et au médecin coordonnateur ce que demande une évaluation sous 72 heures",
        cout: 0.5,
        nature: "utile",
        resultat: `Guillemette peut voir la personne à l'hôpital ou à domicile dans les 72 heures si le service envoie la grille AGGIR, le traitement et les transmissions de nuit ; Dr Jeannenot lit le dossier le soir même. Trois jours au lieu de sept, et deux demi-journées d'IDEC par semaine : ${euros(COUTS.evaluation)} sur le reste du trimestre.`,
      },
    ],
    question: "Que changez-vous à la préadmission ?",
    options: [
      {
        t: "Admettre sur dossier, sans visite, comme Orchidia",
        d: "Réponse en 48 heures, entrée dans la semaine. Le médecin coordonnateur lit le dossier après l'entrée.",
      },
      {
        t: "Évaluer sous 72 heures : l'IDEC voit la personne à l'hôpital ou chez elle, le médecin coordonnateur lit le dossier",
        d: `La décision tombe en trois jours au lieu de sept. ${euros(COUTS.evaluation)} de temps d'IDEC.`,
      },
      {
        t: "Garder la visite de préadmission telle qu'elle est",
        d: "Une demi-journée par semaine, à l'EHPAD, avec la famille.",
      },
      {
        t: "Ne plus prendre de sorties d'hospitalisation jusqu'au printemps",
        d: "Les profils sont trop lourds en hiver ; on admettra depuis le domicile.",
      },
    ],
    reactions: [
      [
        {
          ...DOROTA,
          texte:
            "C'est votre décision. Je demande qu'elle soit écrite, et que l'équipe de nuit soit prévenue de chaque entrée.",
        },
      ],
      [
        {
          ...YAMINA,
          texte:
            "Guillemette est passée voir nos deux patientes mercredi. Une entre lundi chez vous ; pour l'autre, elle nous a orientés vers l'unité d'hébergement renforcé de Dijon. C'est exactement ce qu'il nous faut.",
        },
      ],
      [
        {
          ...YAMINA,
          texte:
            "La visite était fixée à mardi prochain. Les deux patientes sont sorties jeudi : l'une est partie chez Orchidia.",
        },
      ],
      [
        {
          ...YAMINA,
          texte:
            "Bien reçu. Nous n'enverrons plus de demandes à Beaune d'ici le printemps. Je le regrette.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · lundi",
    titre: "La grippe aux Tilleuls",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...DOROTA,
        heure: "08:15",
        alerte: true,
        texte:
          "Onze résidents de l'aile des Tilleuls ont la grippe depuis samedi. Signalement fait à l'ARS, l'équipe d'hygiène de l'hôpital passe ce matin. Les autres ailes n'ont aucun cas pour l'instant.",
      },
      {
        ...HOURIA,
        heure: "09:40",
        texte: `Trois entrées sont prévues d'ici deux semaines, dont une aux Tilleuls. Les familles demandent si elles sont maintenues. Pour mémoire : ${ctx.vides} lits vides en fin de semaine 8.`,
      },
    ],
    sources: [
      {
        id: "hygiene",
        titre: "Lire l'avis écrit de l'équipe d'hygiène",
        cout: 0.5,
        nature: "decisive",
        resultat: `Pas d'entrée dans l'aile des Tilleuls jusqu'à huit jours après le dernier cas. Les autres ailes peuvent accueillir, avec les précautions habituelles et l'accord des familles, prévenues de la situation. Faire entrer un résident fragile dans l'aile touchée l'expose, ainsi que l'équipe qui l'installe. D'expérience, une épidémie sur trois environ gagne une autre aile malgré tout (${Math.round(CHANCE_EXTENSION * 100)} % des cas dans la région cet hiver) : il faut alors suspendre là aussi.`,
      },
      {
        id: "entrees",
        titre: "Voir avec Houria où en sont les entrées prévues",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux entrées sont prévues dans l'aile du Parc, une aux Tilleuls. Les dossiers et les visites des deux suivantes peuvent se faire pendant la suspension, pour qu'elles entrent dès la levée.",
      },
    ],
    question: "Que faites-vous des admissions pendant l'épidémie ?",
    options: [
      {
        t: "Suspendre toutes les admissions jusqu'à la levée des mesures",
        d: "Dans toutes les ailes, jusqu'à huit jours après le dernier cas. Aucun risque d'entrée à annuler.",
      },
      {
        t: "Suspendre les entrées aux Tilleuls seulement, et préparer les suivantes pour la levée",
        d: "Les entrées du Parc sont maintenues, avec l'accord des familles ; dossiers et visites continuent.",
      },
      {
        t: "Maintenir toutes les entrées prévues, Tilleuls compris",
        d: "Les familles attendent ; les nouveaux résidents seront installés le plus loin possible des malades.",
      },
      {
        t: "Reporter toutes les entrées en avril",
        d: "On rouvrira les admissions quand l'hiver sera passé.",
      },
    ],
    reactions: [
      [
        {
          ...HOURIA,
          texte:
            "J'ai prévenu les trois familles. Deux attendront ; la troisième regarde du côté d'Orchidia.",
        },
      ],
      [
        {
          ...GUILLEMETTE,
          texte:
            "Les deux entrées du Parc sont faites, les familles ont été prévenues. Les visites des deux suivantes sont calées pour la levée.",
        },
      ],
      [
        {
          ...MARIETOU,
          texte:
            "On a installé la nouvelle résidente aux Tilleuls samedi, entre deux chambres en isolement. Cette nuit, on était deux pour tout l'étage.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Reporter en avril ? Corentine, ça fait trois semaines de lits vides de plus. Explique-moi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · lundi",
    titre: "Préparer le printemps",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...EUDOXIE,
        heure: "09:00",
        alerte: true,
        texte: `Le conseil d'administration se réunit le 2 avril et l'EPRD sera révisé. Beaune est à ${ctx.occupation} d'occupation la semaine dernière. Qu'est-ce que je présente pour le printemps ?`,
      },
      {
        de: "Tableau de bord de l'établissement",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 10 : ${ctx.vides} lits vides. Délai entre une chambre libérée et l'entrée suivante : ${ctx.delai}. Liste d'attente : ${ctx.inscrits} inscrits, dont ${ctx.actifs} prêts à entrer.`,
      },
    ],
    sources: [
      {
        id: "delai",
        titre: "Suivre le délai de vacance chambre par chambre depuis janvier",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Délai actuel entre une chambre libérée et l'entrée suivante : ${ctx.delai}, contre ${DELAI_DEPART} jours en décembre. ${
            ctx.circuit
              ? "Le gain tient à des habitudes nouvelles : la commission du mardi, la chambre prête en 48 heures, la liste rappelée."
              : "Le circuit n'a pas changé depuis décembre."
          } Valère : « À Montbard, rien n'était écrit la première année ; dès que l'IDEC a été absente, le délai a repris la moitié de ce qu'il avait perdu. Depuis que la procédure est écrite et suivie chaque semaine, il tient. »`,
      },
      {
        id: "printemps",
        titre: "Lire la nouvelle proposition de l'agence pour le printemps",
        cout: 0.5,
        nature: "bruit",
        resultat: `Une « campagne de printemps » sur les réseaux sociaux et en affichage, ${euros(COUTS.campagnePrintemps)}, avec « un ciblage des aidants de 50 à 65 ans ». L'agence cite la notoriété gagnée en février.`,
      },
    ],
    question: "Que présentez-vous au conseil d'administration ?",
    options: [
      {
        t: "Demander le budget d'une campagne de publicité au printemps",
        d: `${euros(COUTS.campagnePrintemps)}, d'avril à juin.`,
      },
      {
        t: "Écrire le circuit d'admission dans une procédure, suivre le délai de vacance chaque semaine, tenir un point mensuel avec les prescripteurs",
        d: "Ne coûte rien. Un indicateur de plus au tableau de bord de l'établissement.",
      },
      {
        t: "Annoncer une baisse de 5 % du prix de journée des places libres au 1er avril",
        d: `${centimes(PRIX_LIBRE - BAISSE_PAR_JOUR)} au lieu de ${PRIX_LIBRE} €, pour remplir avant l'été.`,
      },
      {
        t: "Ne rien formaliser : l'équipe a pris le pli",
        d: "Le conseil d'administration aura les chiffres du trimestre.",
      },
    ],
    reactions: [
      [
        {
          ...EUDOXIE,
          texte:
            "Le conseil d'administration valide la campagne de printemps. Le trésorier demande comment on mesurera ce qu'elle rapporte.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Le conseil d'administration a apprécié le délai de vacance chambre par chambre. La directrice générale veut la même procédure dans les cinq autres EHPAD.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Le conseil d'administration vote la baisse, sans enthousiasme : le trésorier rappelle qu'elle porte sur toutes les journées des places libres.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte: "Le conseil d'administration prend acte des chiffres. On en reparlera en juin.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Fluidifier l'admission", chemin: [1, 0, 0, 1, 1, 1] },
  { nom: "Baisser le prix et communiquer", chemin: [0, 3, 2, 0, 2, 2] },
  { nom: "Attendre le printemps", chemin: [3, 1, 3, 2, 0, 3] },
] as const;

/**
 * Les réflexes de l'épisode, [décision, option] : remplir par le prix ou la notoriété (la baisse,
 * la publicité, l'inscription en ligne, le geste commercial), ou admettre vite sans évaluer (sur
 * dossier seul, toutes les entrées maintenues pendant l'épidémie).
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 3],
  [2, 2],
  [3, 0],
  [4, 2],
  [5, 0],
  [5, 2],
] as const;

export const REPONSES = {
  conventionOui:
    "Le chef du service social accepte la convention : un dossier type, une réponse sous 72 heures, Guillemette comme interlocutrice. Il veut voir les premières réponses avant de l'annoncer aux services.",
  conventionNon:
    "Le chef du service social préfère ne rien signer avec un établissement en particulier pour l'instant. Il continuera de vous adresser des demandes, comme aux autres.",
} as const;
