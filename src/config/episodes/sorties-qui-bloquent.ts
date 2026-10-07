/**
 * LES SORTIES QUI BLOQUENT — le contenu de l'épisode.
 *
 * Médéric Amegavi dirige la clinique du Val Solvanne, l'établissement de
 * soins médicaux et de réadaptation (SMR) de l'Association Solvanne, à
 * Dijon : 120 lits, des patients adressés par le centre hospitalier
 * universitaire et les cliniques de l'agglomération. La durée moyenne de
 * séjour est passée de 28 à 34 jours, le court séjour attend dix jours une
 * place, et le conseil d'administration propose de rouvrir quinze lits. Six
 * décisions, chacune précédée de ce qu'un directeur de SMR reçoit vraiment.
 *
 * La leçon tient au PARCOURS DU PATIENT : une durée de séjour qui s'allonge
 * vient souvent de l'aval. Les soins n'ont pas changé ; des patients
 * médicalement sortants attendent une place en EHPAD, un SSIAD, un domicile
 * aménagé. On réduit la durée de séjour en préparant la sortie dès l'entrée
 * et en passant des conventions avec l'aval, pas en ajoutant des lits, qui se
 * remplissent des mêmes séjours bloqués, ni en imposant une durée aux
 * médecins, qui fait revenir les patients sortis trop tôt. Toutes les
 * données sont dans les sources ; aucune ne fait le raisonnement à la place
 * du joueur.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Établissements, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const URSULE = { de: "Ursule Mauvernay", role: "Directrice générale de l'association" } as const;
const NESTOR = { de: "Nestor Mongrenier", role: "Président du conseil d'administration" } as const;
const MAIDER = { de: "Dr Maïder Arrighi", role: "Présidente de la CME de la clinique" } as const;
const SOLAL = { de: "Solal Benhamza", role: "Cadre supérieur de santé, admissions" } as const;
const RAMATOULAYE = {
  de: "Ramatoulaye Soumaré",
  role: "Assistante sociale de la clinique",
} as const;
const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice administrative et financière, siège",
} as const;
const SABRI = {
  de: "Sabri Mabanza",
  role: "Cadre de la cellule de gestion des lits, CHU",
} as const;
const OYONO = { de: "Pr Ernest Oyono", role: "Chef du service d'orthopédie, CHU" } as const;
const EDMEE = {
  de: "Edmée Faucompré",
  role: "Directrice de l'EHPAD de Dijon-Montchapet",
} as const;
const TIFENN = { de: "Tifenn Kervadec", role: "Ergothérapeute de la clinique" } as const;
const THUY = { de: "Thuy Chevrolat", role: "Infirmière coordinatrice du SSIAD" } as const;
const AUBIERGE = { de: "Aubierge Rabotin", role: "Fille d'un patient" } as const;
const MARIN = { de: "Marin Peyrebrune", role: "Directeur régional, Orchidia Résidences" } as const;
const AUDE = {
  de: "Aude Lantenois",
  role: "Responsable qualité et gestion des risques",
} as const;
const IMENE = {
  de: "Dr Imène Bellocq",
  role: "Médecin du département d'information médicale",
} as const;
const TABLEAU = { de: "Suivi de la clinique", role: "Point hebdomadaire" } as const;

/** Ce qu'une place réservée devient, selon que la sortie est préparée dès l'entrée ou non. */
export function placesReservees(ctx: Contexte): string {
  return ctx.prep
    ? "Depuis que les sorties se préparent dès l'entrée, le dossier est presque toujours prêt quand le médecin déclare le patient sortant : une place proposée trouve son patient."
    : "Aujourd'hui, une fois sur deux, le dossier n'est pas prêt quand une place se libère : la demande d'EHPAD part le jour où le médecin déclare le patient sortant, pas avant.";
}

export const DIAGNOSTICS = [
  {
    id: "aval",
    t: "Les soins durent toujours 28 jours : ce sont les sorties qui bloquent. Des patients médicalement sortants attendent une place, une aide ou un domicile aménagé que personne n'a préparés à temps",
  },
  {
    id: "places",
    t: "L'aval manque de places : les EHPAD et les SSIAD du département sont pleins, et la clinique n'y peut rien",
  },
  {
    id: "lits",
    t: "La clinique manque de lits : la demande du court séjour a dépassé ce que 120 lits peuvent accueillir",
  },
  {
    id: "medecins",
    t: "Les médecins gardent leurs patients trop longtemps : sans objectif de durée, les séjours s'étirent",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Trente-quatre jours",
    jusqua: 2,
    messages: (ctx) => [
      {
        ...TABLEAU,
        heure: "07:30",
        alerte: true,
        texte: `Début octobre. Durée moyenne de séjour : ${ctx.dms}, contre 28 il y a deux ans. Taux d'occupation : 97 %. Délai de réponse aux demandes du court séjour : ${ctx.delai}.`,
      },
      {
        ...NESTOR,
        heure: "08:45",
        texte:
          "Monsieur Amegavi, le conseil a regardé les chiffres : le CHU attend, nos lits sont pleins. L'aile Est est fermée depuis 2021 et l'ARS nous autorise toujours ces quinze lits. Rouvrons-la. J'aimerais votre proposition pour le conseil de fin octobre.",
      },
      {
        ...SABRI,
        heure: "09:30",
        texte:
          "Bonjour Monsieur Amegavi. J'ai quatorze patients d'orthopédie et de neurologie inscrits chez vous, dont certains depuis dix jours. Les chirurgiens me demandent s'ils doivent chercher ailleurs.",
      },
      {
        ...MAIDER,
        heure: "11:10",
        texte:
          "Je préfère le dire avant qu'on me le demande : mes confrères ne gardent personne pour le plaisir. Les rééducations ne sont pas plus longues qu'avant.",
      },
      {
        ...IMENE,
        heure: "12:20",
        texte:
          "Si vous voulez savoir qui occupe vos lits, je peux faire avec les médecins une revue des dossiers de tous les patients présents. Comptez un jour et demi.",
      },
      {
        ...URSULE,
        heure: "14:00",
        texte:
          "Médéric, le président veut des lits. Avant de les promettre, dites-moi ce qui allonge les séjours. Le CPOM nous engage sur la durée de séjour, pas sur le nombre de lits.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "revue",
        titre: "Faire avec le DIM une revue des dossiers des patients présents",
        cout: 1.5,
        nature: "decisive",
        resultat:
          "Dr Imène Bellocq : « Le jour de la revue, 116 patients présents. 21 sont médicalement sortants : leurs soins sont finis, ils attendent leur aval. 11 attendent une place en EHPAD, 4 un SSIAD ou une aide à domicile, 4 l'aménagement de leur domicile, 2 une mesure de protection. Les soins durent 28 jours en moyenne, comme il y a deux ans. Quatre patients sur dix ont besoin d'une solution d'aval ; ceux-là attendent en moyenne 15 jours, médicalement sortants. Les demandes d'EHPAD, d'APA ou d'aménagement partent le jour où le médecin déclare le patient sortant, pas avant. Depuis trois mois, le nombre de patients bloqués ne baisse pas. »",
      },
      {
        id: "flux",
        titre: "Reprendre avec Solal les admissions et les demandes",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Solal Benhamza : « Nous admettons 24 patients par semaine ; il y a deux ans, 29. Nous recevons 31 demandes par semaine, de cinq services : l'orthopédie, la neurologie, la gériatrie aiguë et la médecine interne du CHU, et la clinique chirurgicale des Valendons. Une demande attend une place 10 jours en moyenne, et chaque semaine, le court séjour en place 7 ailleurs. Chaque lit qui se libère est pris le jour même. »",
      },
      {
        id: "finances",
        titre: "Demander à la direction financière ce que rapportent un séjour et un lit",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Eudoxie Rambourg : « Un séjour nous rapporte en moyenne 4 600 € de recette d'activité, pour 600 € de charges variables ; c'est la semaine de soins qui est valorisée, et au-delà de la borne haute du groupe médico-économique, une journée d'attente ne rapporte presque rien. Rouvrir l'aile Est : 12 000 € de remise en état et 15 500 € de personnel par semaine, dont une bonne part en intérim, à partir de la semaine 5. La dotation ne bouge pas avant la prochaine campagne budgétaire. Notre EPRD a été construit sur 33 jours de durée moyenne de séjour : 1 284 k€ de résultat d'activité pour le trimestre. Et un service qui prend l'habitude d'adresser ailleurs nous envoie 40 % de demandes en moins pendant au moins un an : 30 000 € de recettes perdues. »",
      },
      {
        id: "comparaison",
        titre: "Comparer la durée de séjour avec les autres SMR de la région",
        cout: 1,
        nature: "bruit",
        resultat:
          "Les SMR de Bourgogne-Franche-Comté affichent une durée moyenne de séjour de 31 jours. Deux établissements comparables ont ouvert des lits l'an dernier ; ils déclarent un taux d'occupation de 95 %.",
      },
      {
        id: "conseil",
        titre: "Appeler Euriell Lagardelle, ancienne directrice d'un SMR",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Euriell Lagardelle : « Avant d'ouvrir des lits, regarde qui les occupe. Chez nous, l'allongement venait de patients guéris qui attendaient une sortie qu'on n'avait pas préparée. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous au conseil d'administration ?",
    options: [
      {
        t: "Rouvrir les quinze lits de l'aile Est",
        d: "12 000 € de remise en état, puis 15 500 € de personnel par semaine à partir de la semaine 5. L'ARS a déjà autorisé ces lits.",
      },
      {
        t: "Préparer chaque sortie dès l'entrée : date de sortie prévisionnelle, assistante sociale sollicitée sous 48 heures, staff de sortie hebdomadaire",
        d: "Une demi-assistante sociale en renfort et une heure de staff par unité : 750 € par semaine.",
      },
      {
        t: "Fixer aux médecins une durée de séjour cible de 28 jours",
        d: "Rien à payer. Chaque médecin reçoit chaque lundi la durée de séjour de ses patients.",
      },
      {
        t: "Attendre la revue de pertinence de l'ARS, au printemps",
        d: "Rien ne change ce trimestre.",
      },
    ],
    reactions: [
      [
        {
          ...NESTOR,
          texte:
            "Parfait. Le conseil votera la réouverture. Recrutez dès maintenant : il faudra du monde pour la semaine 5.",
        },
      ],
      [
        {
          ...RAMATOULAYE,
          texte:
            "Enfin. Dès lundi, je vois chaque patient dans les 48 heures de son admission, et chaque dossier a une date de sortie prévisionnelle. Les familles seront prévenues plus tôt.",
        },
      ],
      [
        {
          ...MAIDER,
          texte:
            "Nous l'appliquerons. Mais une durée cible ne trouve pas de place en EHPAD ; elle pousse seulement à sortir ceux qui pourraient rentrer chez eux, prêts ou non.",
        },
      ],
      [
        {
          ...URSULE,
          texte: "Le conseil attendait une réponse. Je le lui dirai, mais il ne sera pas content.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Les dossiers en attente",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...TABLEAU,
        heure: "08:00",
        alerte: true,
        texte: `Fin de semaine 3 : ${ctx.bloques} patients médicalement sortants, durée moyenne de séjour ${ctx.dms}, délai de réponse ${ctx.delai}.`,
      },
      {
        ...AUBIERGE,
        heure: "10:20",
        texte:
          "Monsieur le directeur, on nous dit depuis trois semaines que mon père est « sortant ». Mais la salle de bains n'est pas faite, et personne ne passe chez lui. Que doit-on faire ?",
      },
      {
        ...MAIDER,
        heure: "11:45",
        texte:
          "Huit de nos patients attendent une aide ou des travaux. Leurs familles sont là : ils pourraient rentrer dès lundi, et on libérerait autant de lits.",
      },
      {
        ...RAMATOULAYE,
        heure: "15:30",
        texte:
          "Je reprends les dossiers en attente un par un, mais seule, à ce rythme, il me faudra des semaines.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "dossiers",
        titre: "Reprendre avec l'assistante sociale l'état des dossiers en attente",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ramatoulaye Soumaré : « Sur les 21 patients du jour de la revue, 9 attendent encore leur dossier : demande d'EHPAD incomplète, APA pas demandée, devis d'aménagement, saisine du juge des tutelles. Les 12 autres ont un dossier complet et attendent une place ou des travaux. Repris un par un par une petite équipe, un dossier se boucle trois fois plus vite. Une cellule de sortie, avec moi, une cadre et un médecin, coûterait 3 500 € de vacations et d'heures, des semaines 4 à 7. »",
      },
      {
        id: "retours",
        titre: "Demander à la qualité ce que deviennent les sorties sans aide prête",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Aude Lantenois : « L'an dernier, un patient sur trois rentré chez lui avant que son aide ou son aménagement soient en place est revenu par les urgences du CHU, le plus souvent après une chute. La direction financière estime chaque réhospitalisation à 2 800 € pour nous. Et le CHU les compte. »",
      },
      {
        id: "temporaire",
        titre: "Demander aux EHPAD de l'association des places d'hébergement temporaire",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Edmée Faucompré : « L'hébergement temporaire en sortie d'hospitalisation, c'est trente jours chez nous, avec un reste à charge réduit au forfait journalier ; l'ARS le finance. En octobre, entre une et quatre places sont libres dans nos six EHPAD, selon les semaines. Ensuite, il faut une place permanente. »",
      },
    ],
    question: "Que faites-vous pour les patients qui attendent aujourd'hui ?",
    options: [
      {
        t: "Monter une cellule de sortie : l'assistante sociale, une cadre et un médecin reprennent les dossiers un par un",
        d: "3 500 € de vacations et d'heures, des semaines 4 à 7.",
      },
      {
        t: "Faire rentrer chez eux, avec leur famille, les patients qui attendent une aide ou un aménagement",
        d: "Des lits libérés dès la semaine 4. Les familles s'organisent en attendant.",
      },
      {
        t: "Demander un hébergement temporaire en EHPAD pour les patients qui attendent une place",
        d: "Rien à payer pour la clinique. Autant de patients que de places temporaires libres.",
      },
      {
        t: "Laisser les dossiers suivre leur cours",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...RAMATOULAYE,
          texte:
            "La cellule se réunit lundi et jeudi. Premiers dossiers bouclés : deux demandes d'APA envoyées, une habilitation familiale déposée.",
        },
      ],
      [
        {
          ...AUBIERGE,
          texte:
            "Mon père rentre lundi. Je vais dormir chez lui en attendant les travaux. J'espère qu'on fait bien.",
        },
        {
          ...AUDE,
          texte:
            "Cinq ou six sorties la même semaine sans aide en place : je fais appeler chacun à J+7.",
        },
      ],
      null,
      [
        {
          ...SOLAL,
          texte: "D'accord. Le CHU m'a encore appelé ce matin pour ses patients inscrits.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Des places chez l'aval",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...URSULE,
        heure: "08:30",
        alerte: true,
        texte:
          "Médéric, le comité de direction de mardi parle de l'aval de la clinique. Nous avons six EHPAD et un SSIAD : vous pouvez demander des places prioritaires pour vos sortants. Que proposez-vous ?",
      },
      {
        ...EDMEE,
        heure: "10:00",
        texte:
          "Je comprends la clinique, mais j'ai quarante personnes sur ma liste d'attente, dont des familles qui attendent depuis des mois. Réserver des places à vos patients, c'est passer devant elles.",
      },
      {
        ...EUDOXIE,
        heure: "10:45",
        texte:
          "Médéric, toute réservation de places se paie : je veux savoir ce qu'elle rapporte en lits libérés avant le comité.",
      },
      {
        ...MARIN,
        heure: "11:15",
        texte:
          "Monsieur Amegavi, nos résidences de Dijon et de Beaune ont de la place. Nous pouvons signer une convention de priorité avec la clinique.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Fin de semaine 5 : ${ctx.bloques} patients médicalement sortants, durée moyenne de séjour ${ctx.dms}, délai de réponse ${ctx.delai}.`,
      },
    ],
    sources: [
      {
        id: "conventions",
        titre: "Chiffrer les conventions possibles avec la directrice financière",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Eudoxie Rambourg : « Une convention avec nos EHPAD et notre SSIAD réduirait de moitié l'attente d'une place en EHPAD et de 45 % celle d'une prise en charge par le SSIAD, à partir de la semaine 7 si les directeurs signent ; nous payons les journées où une place réservée attend, environ 1 000 € par semaine. Imposée par la directrice générale, elle passerait en comité de direction : effet en semaine 9, et des directeurs contraints réservent moins. Avec Orchidia Résidences et un SSIAD d'une autre association : l'attente d'EHPAD baisserait de 35 %, celle du SSIAD de 30 %, à partir de la semaine 8 si leurs directions acceptent, pour 1 600 € par semaine ; leurs prix d'hébergement font hésiter les familles. »",
      },
      {
        id: "placesPretes",
        titre: "Demander à l'assistante sociale si les dossiers suivront",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Ramatoulaye Soumaré : « Une place réservée n'attend que 48 heures : sans dossier complet, elle part au suivant de la liste de l'EHPAD, et la réservation se paie quand même. ${placesReservees(ctx)} »`,
      },
      {
        id: "directeurs",
        titre: "Sonder les directeurs d'EHPAD de l'association",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Edmée Faucompré : « Nous sommes partagés. Trois collègues sont prêts à signer si la clinique prépare ses dossiers ; les autres craignent leurs listes d'attente et leur taux d'occupation. Je dirais une chance sur deux. Orchidia, eux, ont des chambres vides : ils signeront plus volontiers, mais leurs tarifs ne conviennent pas à toutes les familles. »",
      },
    ],
    question: "Quelle convention passez-vous avec l'aval ?",
    options: [
      {
        t: "Négocier avec les directeurs des EHPAD et du SSIAD de l'association une convention de places prioritaires",
        d: "Des places dès la semaine 7 si les directeurs signent. Environ 1 000 € par semaine de places réservées.",
      },
      {
        t: "Signer avec Orchidia Résidences et un SSIAD hors association",
        d: "Des places dès la semaine 8 si leurs directions acceptent. 1 600 € par semaine.",
      },
      {
        t: "Demander à la directrice générale d'imposer la convention aux établissements de l'association",
        d: "Passage au comité de direction : des places à partir de la semaine 9, que les directeurs le veuillent ou non.",
      },
      {
        t: "Pas de convention : continuer au cas par cas",
        d: "Rien à payer.",
      },
    ],
    reactions: [
      null,
      null,
      [
        {
          ...URSULE,
          texte:
            "Je l'inscris au comité de direction de la semaine 8. Les directeurs appliqueront. Ils ne vous en remercieront pas.",
        },
      ],
      [
        {
          ...SOLAL,
          texte:
            "Entendu. Ramatoulaye continuera d'appeler les EHPAD un par un pour chaque patient.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Rentrer chez soi",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...TIFENN,
        heure: "09:00",
        alerte: true,
        texte:
          "Plusieurs patients sont prêts à rentrer chez eux mais attendent des travaux : une douche à l'italienne, des barres d'appui, un lit au rez-de-chaussée. Les artisans parlent de début décembre.",
      },
      {
        ...MAIDER,
        heure: "11:30",
        texte:
          "Ces patients n'ont plus rien à faire chez nous. Leurs familles sont prêtes à les reprendre. Pourquoi les garder ?",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Fin de semaine 7 : ${ctx.bloques} patients médicalement sortants, durée moyenne de séjour ${ctx.dms}. Réhospitalisations depuis le début du trimestre : ${ctx.rehosp}.`,
      },
    ],
    sources: [
      {
        id: "visites",
        titre: "Demander à l'ergothérapeute ce qu'on peut faire en attendant les travaux",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Tifenn Kervadec : « Je peux faire une visite à domicile dans la semaine, et nous louons ce qu'il faut en attendant les travaux : lit médicalisé, chaise de douche, barres d'appui provisoires, rehausseur. Le SAAD de l'association passe matin et soir. L'attente des travaux passe d'une dizaine de jours en moyenne à moins de deux. Location et temps d'ergothérapeute : 500 € par semaine. »",
      },
      {
        id: "chutes",
        titre: "Demander à la qualité ce que deviennent les sorties sans aménagement",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Aude Lantenois : « Un patient sur trois qui rentre sans aménagement ni aide revient par les urgences du CHU dans le mois, le plus souvent après une chute. Chaque retour : 2 800 € pour nous, une déclaration d'événement indésirable, et le CHU qui compte. Depuis le début du trimestre : ${ctx.rehosp} réhospitalisations. »`,
      },
      {
        id: "artisans",
        titre: "Appeler les artisans pour avancer les travaux",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Les deux artisans habituels ont des carnets pleins jusqu'à Noël. L'un propose de passer en heures supplémentaires, contre une majoration à la charge des familles.",
      },
    ],
    question: "Que faites-vous pour les patients qui attendent un aménagement ?",
    options: [
      {
        t: "Les laisser rentrer chez eux maintenant : la famille s'organise en attendant les travaux",
        d: "Les lits se libèrent tout de suite. Rien à payer.",
      },
      {
        t: "Un aménagement provisoire : visite de l'ergothérapeute, aides techniques louées, passages du SAAD de l'association",
        d: "500 € par semaine. Les patients rentrent dans un domicile adapté, en attendant les travaux.",
      },
      {
        t: "Attendre la fin des travaux",
        d: "Les patients restent jusqu'à ce que leur domicile soit prêt.",
      },
    ],
    reactions: [
      [
        {
          ...AUBIERGE,
          texte:
            "On reprend mon père à la maison. Nous dormons à tour de rôle chez lui. La salle de bains, on fera avec.",
        },
      ],
      [
        {
          ...TIFENN,
          texte:
            "Première visite faite à Chenôve : le lit est livré demain, le SAAD commence lundi. Le patient rentre mardi.",
        },
      ],
      [
        {
          ...MAIDER,
          texte: "Bien. Nous les garderons donc jusqu'en décembre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "L'épidémie",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...SABRI,
        heure: "08:10",
        alerte: true,
        texte:
          "L'épidémie de grippe arrive : le CHU déclenche son plan de tension. Nos services vont vous adresser un cinquième de demandes en plus jusqu'à Noël.",
      },
      {
        ...OYONO,
        heure: "09:40",
        texte:
          "Monsieur Amegavi, si vous pouviez prendre mes opérés plus tôt, à J3 au lieu de J5, même pas tout à fait stabilisés, cela nous sauverait l'hiver.",
      },
      {
        ...NESTOR,
        heure: "12:00",
        texte:
          "Avec l'épidémie, c'est le moment d'ouvrir des lits de renfort. L'agence d'intérim peut nous fournir du personnel.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Fin de semaine 9 : résultat d'activité ${ctx.resultat} pour un EPRD à date de ${ctx.eprdADate}. Délai de réponse ${ctx.delai}, ${ctx.perdus}.`,
      },
    ],
    sources: [
      {
        id: "sortiesDuJour",
        titre: "Regarder avec Solal à quelle heure et quel jour sortent les patients",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Solal Benhamza : « Un tiers de nos sorties se font après 16 heures, aucune le samedi : le lit reste vide une nuit ou un week-end. Sortir avant midi et le samedi nous ferait passer de 97 % à 99 % d'occupation, l'équivalent de 2,4 lits, pour 900 € par semaine de majorations du samedi. Nous pourrions alors réserver chaque jour deux places au CHU, avec une réponse sous 48 heures. ${
            ctx.prep
              ? "Avec les dates de sortie prévisionnelles, nous savons la veille quels lits se libèrent."
              : "Sans date de sortie prévisionnelle, nous ne saurons qu'au dernier moment quels lits se libèrent : on n'en tirera que la moitié."
          } »`,
      },
      {
        id: "instables",
        titre: "Demander à la CME ce que deviennent les transferts précoces",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Dr Maïder Arrighi : « Un opéré pris à J3, pas stabilisé, c'est un patient sur seize qui repart au CHU dans la semaine : infection, décompensation. Chaque retransfert coûte autant qu'une réhospitalisation, et c'est au CHU qu'on le reproche ensuite. »",
      },
      {
        id: "renfort",
        titre: "Demander un devis à Soralis Intérim Santé",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Soralis Intérim Santé : dix lits de renfort des semaines 10 à 13 demandent infirmiers, aides-soignants et agents de service en intérim : 12 500 € par semaine, et 5 000 € pour préparer les chambres.",
      },
    ],
    question: "Comment traversez-vous l'épidémie ?",
    options: [
      {
        t: "Ouvrir dix lits de renfort avec Soralis Intérim Santé",
        d: "5 000 € de préparation, 12 500 € par semaine d'intérim, des semaines 10 à 13.",
      },
      {
        t: "Accepter les transferts plus précoces que le CHU demande",
        d: "Rien à payer. Le CHU libère ses lits plus vite.",
      },
      {
        t: "Sortir avant midi et le samedi, et réserver chaque jour deux places au CHU",
        d: "900 € par semaine de majorations du samedi. Réponse au CHU sous 48 heures.",
      },
      {
        t: "Ne rien changer",
        d: "La clinique fait comme chaque hiver.",
      },
    ],
    reactions: [
      [
        {
          ...SOLAL,
          texte:
            "Les dix lits ouvrent en semaine 10, à moitié pourvus. Soralis nous envoie des intérimaires qui ne connaissent ni Carnéo ni les patients.",
        },
      ],
      [
        {
          ...OYONO,
          texte: "Merci, Monsieur Amegavi. Mes internes vous appellent dès lundi.",
        },
      ],
      [
        {
          ...SABRI,
          texte:
            "Deux places par jour, une réponse sous 48 heures : je préviens les services. Ça change tout pour nous.",
        },
      ],
      [
        {
          ...SABRI,
          texte: "Entendu. Nous chercherons d'autres solutions pour nos patients.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Les fêtes",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...SOLAL,
        heure: "09:00",
        alerte: true,
        texte:
          "Comme chaque année, je propose de fermer douze lits pendant les fêtes : la moitié de l'équipe pose ses congés, et l'intérim coûte double.",
      },
      {
        ...THUY,
        heure: "10:30",
        texte:
          "Pendant les fêtes, le SSIAD tourne avec une équipe réduite. Je ne prendrai presque personne de nouveau entre le 20 décembre et le 2 janvier, sauf si on programme les entrées avant.",
      },
      {
        ...MAIDER,
        heure: "14:15",
        texte:
          "Beaucoup de patients presque prêts voudraient passer Noël chez eux. On pourrait les laisser sortir un peu plus tôt.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Fin de semaine 11 : résultat d'activité ${ctx.resultat} pour un EPRD à date de ${ctx.eprdADate}. ${ctx.bloques} patients médicalement sortants.`,
      },
    ],
    sources: [
      {
        id: "fetes",
        titre: "Relire avec l'assistante sociale les deux dernières fins d'année",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ramatoulaye Soumaré : « Les deux dernières années, pendant les fêtes, les EHPAD et le SSIAD ont admis moitié moins vite : l'attente d'une place s'allonge de moitié. Quand on programme les entrées avant le 23 décembre avec eux et qu'une assistante sociale assure une permanence, l'attente reste au niveau d'un mois ordinaire, même un peu en dessous. La permanence et les transports coûtent 1 500 €. »",
      },
      {
        id: "fermeture",
        titre: "Chiffrer la fermeture de douze lits avec la direction financière",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Eudoxie Rambourg : « Fermer douze lits deux semaines économise 9 000 € d'intérim par semaine. Mais ces lits ne prennent plus de patients, et le CHU sera encore en plan de tension. »",
      },
      {
        id: "noel",
        titre: "Demander à la qualité ce que deviennent les sorties avancées pour Noël",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Aude Lantenois : « Les sorties avancées des fêtes de l'an dernier : un patient sur quatre aux soins écourtés est revenu en janvier, un sur trois parmi ceux dont l'aide n'était pas prête. »",
      },
    ],
    question: "Comment passez-vous les fêtes ?",
    options: [
      {
        t: "Fermer douze lits pendant les fêtes, comme chaque année",
        d: "9 000 € d'intérim économisés par semaine, semaines 12 et 13.",
      },
      {
        t: "Programmer les sorties avant les fêtes : entrées en EHPAD et au SSIAD avancées, permanence de l'assistante sociale",
        d: "1 500 € de permanence et de transports.",
      },
      {
        t: "Laisser sortir pour Noël les patients presque prêts",
        d: "Des lits libérés avant les fêtes, des familles contentes.",
      },
      {
        t: "Ne rien changer",
        d: "Tous les lits restent ouverts, l'aval tourne au ralenti.",
      },
    ],
    reactions: [
      [
        {
          ...SOLAL,
          texte:
            "Les douze lits ferment le 19 au soir. Je préviens la cellule de gestion des lits du CHU.",
        },
      ],
      [
        {
          ...THUY,
          texte:
            "J'ai cinq entrées programmées avant le 23, et les EHPAD de Beaune et de Montchapet en prennent trois.",
        },
      ],
      [
        {
          ...MAIDER,
          texte: "Les sorties sont signées. Les familles sont ravies. Nous verrons en janvier.",
        },
      ],
      [
        {
          ...RAMATOULAYE,
          texte: "Je serai en congé la deuxième semaine. Les dossiers attendront mon retour.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Préparer la sortie dès l'entrée", chemin: [1, 0, 0, 1, 2, 1] },
  { nom: "Des lits et une durée cible", chemin: [0, 1, 3, 0, 0, 2] },
  { nom: "Attentiste", chemin: [3, 3, 3, 2, 3, 3] },
] as const;

/**
 * Les réflexes du métier quand les lits sont pleins : en ajouter (l'aile, le
 * renfort d'hiver), ou faire sortir plus vite sans que l'aval soit prêt
 * (la durée cible, le retour en famille, les sorties de Noël). [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 1],
  [3, 0],
  [4, 0],
  [5, 2],
] as const;

export const REPONSES = {
  interneAcceptee:
    "Les directeurs ont signé : à partir de la semaine 7, nos EHPAD et le SSIAD réservent des places aux sortants de la clinique, à condition que les dossiers soient prêts.",
  interneRefusee:
    "Les directeurs n'ont pas voulu signer : nos listes d'attente passent d'abord. Nous continuerons à étudier vos demandes une par une.",
  externeAcceptee:
    "Notre direction a validé la convention : vos patients seront prioritaires dans nos résidences de Dijon et de Beaune à partir de la semaine 8.",
  externeRefusee:
    "Après réflexion, notre direction préfère ne pas réserver de places. Nous restons à votre disposition au cas par cas.",
  temporaire: (n: number) =>
    `${n === 1 ? "Une place" : `${n} places`} d'hébergement temporaire ${n === 1 ? "est libre" : "sont libres"} dans nos EHPAD : nous accueillons ${n === 1 ? "un patient" : `${n} patients`} de la clinique dès lundi.`,
} as const;
