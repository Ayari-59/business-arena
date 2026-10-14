/**
 * LES COMPÉTENCES QUI MANQUENT — le contenu de l'épisode.
 *
 * Martine Guillot est responsable de l'atelier de découpe et de façonnage
 * d'Arvel Distribution, à Vénissieux : douze opérateurs qui débitent,
 * usinent et chantent les panneaux pour les menuisiers et les agenceurs. Le
 * sur-mesure monte chaque semaine ; la machine de découpe numérique qui le
 * produit n'est pilotée que par deux opérateurs, René et Joaquim, qui partent
 * à la retraite en semaine 9 et en semaine 12. Six décisions, chacune
 * précédée de ce qu'une responsable d'atelier reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "transmission",
    t: "Le savoir-faire de la machine tient en deux personnes, et il faut des semaines pour le transmettre : la relève doit commencer maintenant, à côté d'elles",
  },
  {
    id: "remplacement",
    t: "Il va manquer deux opérateurs : il faut les remplacer avant qu'ils partent",
  },
  {
    id: "formation",
    t: "L'équipe n'a jamais été formée à la machine : une formation du fabricant comblera l'écart",
  },
  {
    id: "capacite",
    t: "L'atelier manque de capacité pour suivre la hausse du sur-mesure",
  },
] as const;

const RENE = {
  de: "René Vuillermoz",
  role: "Régleur-programmeur, machine numérique",
} as const;
const JOAQUIM = {
  de: "Joaquim Carvalhal",
  role: "Opérateur machine numérique",
} as const;
const HAMZA = { de: "Hamza Tlili", role: "Opérateur de découpe" } as const;
const OCEANE = {
  de: "Océane Pignol",
  role: "Opératrice de façonnage",
} as const;
const ABDOU = { de: "Abdou Diatta", role: "Opérateur de façonnage" } as const;
const GHISLAINE = {
  de: "Ghislaine Pradal",
  role: "Directrice du site",
} as const;
const ENGUERRAND = {
  de: "Enguerrand Arnoux",
  role: "Chargé d'affaires sur-mesure",
} as const;
const RH = { de: "Edwige Quéméner", role: "Ressources humaines" } as const;
const TABLEAU = {
  de: "Tableau de bord de l'atelier",
  role: "Point hebdomadaire",
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Deux départs, une machine",
    jusqua: 2,
    messages: () => [
      {
        ...GHISLAINE,
        heure: "07:40",
        alerte: true,
        texte:
          "Martine, la DRH m'a confirmé les dates : René part à la retraite fin de semaine 8, Joaquim fin de semaine 11. Ce sont les deux seuls qui font tourner la machine numérique, et le sur-mesure, c'est là que l'atelier gagne sa marge. Je veux savoir vendredi comment tu passes le cap.",
      },
      {
        ...TABLEAU,
        role: "Alerte automatique",
        heure: "08:00",
        texte:
          "Commandes sur mesure la semaine dernière : 30, toutes faites à l'atelier (+3 % par semaine depuis trois mois). Enveloppe compétences du trimestre (formation, recrutement, renforts) : 12 000 €.",
      },
      {
        ...RENE,
        heure: "09:15",
        texte:
          "Martine, on en parle depuis un an, de ce départ. Moi je veux bien montrer, mais cette machine, il m'a fallu deux ans pour la sentir. Ça ne s'apprend pas en une semaine avant le pot.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "cartographie",
        titre: "Faire la cartographie des compétences de l'atelier",
        cout: 1,
        nature: "decisive",
        resultat:
          "Douze opérateurs, neuf savoir-faire. Programmer la machine, la régler, usiner les pièces complexes : René et Joaquim, personne d'autre. Hamza lit les plans et prépare les panneaux pour René ; Océane fait le façonnage des pièces sur mesure et connaît les gammes ; Abdou s'en sort sur les plans simples. Le sur-mesure fait 58 % de la marge de l'atelier.",
      },
      {
        id: "fabricant",
        titre: "Appeler le formateur du fabricant de la machine",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Aurélien Lacoste, formateur : « Nos trois jours apprennent l'interface et les fonctions de base, sur nos pièces d'exemple. Pour vos pièces à vous, comptez deux à trois mois de pratique à côté de quelqu'un qui les connaît. Les clients qui envoient leurs gens en stage sans tuteur derrière nous rappellent souvent. »",
      },
      {
        id: "marche",
        titre: "Demander à un cabinet l'état du marché des opérateurs en commande numérique",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Clarisse Perret, consultante : « Un opérateur confirmé, tout le monde le cherche. Comptez huit à dix semaines, 7 000 € d'honoraires, et un salaire au-dessus de votre grille. On trouve à peu près une fois sur deux. Et il connaîtra les machines, pas vos pièces. »",
      },
      {
        id: "productivite",
        titre: "Comparer la productivité de l'atelier aux autres sites du groupe",
        cout: 1,
        nature: "bruit",
        resultat:
          "Mètres de chant posés par heure, panneaux débités par poste : l'atelier est dans la moyenne des quatre sites du groupe, un peu au-dessus sur le débit.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Ghislaine",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Ghislaine : « Avant de chercher qui remplacera René, regarde ce que René sait que personne d'autre ne sait. Et combien de temps il faut pour l'apprendre. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment préparez-vous les deux départs ?",
    options: [
      {
        t: "Lancer tout de suite le recrutement d'un opérateur confirmé en commande numérique",
        d: "Un cabinet spécialisé, 7 000 € sur l'enveloppe, moitié au lancement, moitié à l'arrivée. Arrivée espérée vers la semaine 10.",
      },
      {
        t: "Mettre Hamza et Océane en binôme avec René et Joaquim dès la semaine prochaine, sur les vraies commandes",
        d: "Chacun à mi-temps sur la machine à côté de son tuteur. Leur travail de découpe repris en heures : 700 € par semaine. René et Joaquim iront un peu moins vite.",
      },
      {
        t: "Inscrire quatre opérateurs à la formation du fabricant de la machine",
        d: "Hamza, Océane, Yohann et Teddy, trois jours en semaine 3. 7 600 € sur l'enveloppe, plus les heures de remplacement.",
      },
      {
        t: "Attendre : René et Joaquim sont là jusqu'aux semaines 8 et 11",
        d: "On s'organisera le moment venu. Aucun coût d'ici là.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...RENE,
          texte:
            "Hamza à côté de moi lundi ? D'accord. Je commence par les plans de travail droits, il verra les pièces complexes après. Il faudra qu'il pose des questions, moi j'ai pas l'habitude d'expliquer.",
        },
        {
          ...OCEANE,
          texte:
            "Merci, Martine. Ça fait un an que je regarde Joaquim faire en me disant que j'aimerais bien.",
        },
      ],
      [
        {
          ...RH,
          texte:
            "Les quatre inscriptions sont faites pour la session de la semaine 3, chez le fabricant, à Villefranche. Il reste 4 400 € sur l'enveloppe.",
        },
      ],
      [
        {
          ...GHISLAINE,
          texte: "Attendre quoi, exactement ? Je te rappelle que le sur-mesure ne baisse pas, lui.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Ce qui n'est écrit nulle part",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...JOAQUIM,
        heure: "10:20",
        alerte: true,
        texte:
          "Martine, René était absent hier matin et j'ai dû refaire un programme de caisson qu'il avait sur sa clé USB. Deux heures perdues. On a un problème : la moitié de ce qu'on sait faire n'est écrit nulle part.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Commandes sur mesure en semaine 2 : ${ctx.demande}, dont ${ctx.faites} faites à l'atelier. Maîtrise de la relève : ${ctx.releve}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "programmes",
        titre: "Faire l'inventaire des programmes et des réglages de la machine",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur 212 programmes de pièces récurrentes, 87 ne sont que sur la clé USB de René, 41 sur celle de Joaquim. Aucune fiche de réglage : les corrections d'outil, les vitesses par type de panneau, l'ordre d'usinage des pièces complexes sont dans leur tête. Refaire un programme perdu prend une à trois heures.",
      },
      {
        id: "binome",
        titre: "Demander à René comment se passe la transmission",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.binome
            ? "René : « Hamza apprend vite, il a fait seul ses premiers plans de travail droits. Ce qui lui manque, c'est ce que je fais sans y penser : pourquoi je ralentis sur le stratifié, pourquoi je retourne les panneaux de tel fournisseur. Si je l'écrivais avec lui, il l'aurait sous les yeux après mon départ. »"
            : "René : « Personne n'est venu me voir. Je veux bien montrer, mais il faut que quelqu'un soit à côté de moi à la machine, et longtemps. »",
      },
    ],
    question: "Que faites-vous de ce savoir qui n'est écrit nulle part ?",
    options: [
      {
        t: "Bloquer une demi-journée par semaine à René et Joaquim pour écrire leurs fiches de réglage et ranger leurs programmes, avec ceux qui prendront la suite",
        d: "Jusqu'au départ de Joaquim. La machine tournera un peu moins pendant ces demi-journées.",
      },
      {
        t: "Leur demander de noter l'essentiel quand ils ont un moment",
        d: "Sans temps dédié. Ne coûte rien.",
      },
      {
        t: "Acheter le module de bibliothèque de programmes du fabricant",
        d: "4 000 € sur l'enveloppe. Les programmes sont centralisés et sauvegardés sur le serveur.",
      },
      {
        t: "Ne rien formaliser : le savoir passera de la main à la main",
        d: "Ils ont toujours fait comme ça.",
      },
    ],
    reactions: [
      [
        {
          ...JOAQUIM,
          texte:
            "Première fiche faite : le plan de travail en compact, avec les vitesses et les pièges. Océane l'a relue et m'a posé trois questions que je ne me posais plus. C'est long, mais ça vaut le coup.",
        },
      ],
      [
        {
          ...RENE,
          texte:
            "J'ai commencé un cahier. Trois pages pour l'instant. Avec les commandes, le soir, j'ai pas trop la tête à écrire.",
        },
      ],
      [
        {
          de: "Fabricant de la machine",
          role: "Service après-vente",
          texte:
            "Le module est installé. Vos programmes seront sauvegardés sur le serveur à chaque utilisation. Les réglages fins restent à la main de l'opérateur.",
        },
      ],
      [
        {
          ...JOAQUIM,
          texte:
            "Comme tu veux. Mais le jour où je ne suis plus là, ne m'appelle pas pour un programme.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Et si l'un d'eux manquait ?",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...ABDOU,
        heure: "08:10",
        texte:
          "Martine, je sais lire un plan et j'ai fait les caissons de façonnage pendant deux ans. Si un jour il faut quelqu'un en plus à la machine, je suis volontaire.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        alerte: true,
        texte: `Semaine 4 : ${ctx.service} des commandes sur mesure faites à l'atelier. Pilotes autonomes sur la machine : ${ctx.pilotes}. Maîtrise de la relève : ${ctx.releve}.`,
      },
    ],
    sources: [
      {
        id: "matrice",
        titre: "Relire la cartographie : que se passe-t-il si un pilote manque ?",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.binome
              ? "Après les départs, la machine reposera sur Hamza et Océane. Que l'un des deux manque une semaine, ou apprenne moins vite que prévu, et la moitié du sur-mesure part en sous-traitance."
              : "Après les départs, personne n'est prêt à reprendre la machine : chaque absence comptera double."
          } Abdou est le seul autre opérateur qui lit les plans et connaît les pièces sur mesure.`,
      },
      {
        id: "absences",
        titre: "Regarder les absences de l'atelier sur un an",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une semaine sur vingt, en moyenne, chaque opérateur est absent : maladie, enfant malade, accident. Sur un trimestre, il est presque certain qu'au moins un pilote manque une semaine.",
      },
    ],
    question: "Formez-vous quelqu'un d'autre à la machine ?",
    options: [
      {
        t: "Former Abdou comme troisième pilote, sur les pièces répétitives, aux côtés de ceux qui apprennent déjà",
        d: "Un quart de son temps sur la machine, davantage après les départs. 300 € par semaine de travail repris.",
      },
      {
        t: "Inscrire trois opérateurs de plus à la formation du fabricant, dont Abdou",
        d: "Trois jours en semaine 6, 5 700 € sur l'enveloppe. Ensuite, ils pilotent ce qu'ils peuvent.",
      },
      {
        t: "Faire passer les douze opérateurs sur la machine, une demi-journée chacun par semaine",
        d: "Tout le monde la connaîtra un peu. 900 € par semaine d'heures de réorganisation.",
      },
      {
        t: "Garder chacun à son poste : la découpe a besoin de tout le monde",
        d: "Pas de temps perdu, pas de coût.",
      },
    ],
    reactions: [
      [
        {
          ...ABDOU,
          texte:
            "Première matinée avec Hamza sur les façades droites. Il m'explique ce que René lui a appris la semaine dernière : en l'expliquant, il le comprend mieux, il dit.",
        },
      ],
      [
        {
          ...RH,
          texte:
            "Trois inscriptions de plus pour la session de la semaine 6. L'enveloppe est entamée d'autant.",
        },
      ],
      [
        {
          ...JOAQUIM,
          texte:
            "J'ai eu Yohann ce matin, Teddy cet après-midi. Le temps de leur montrer où sont les boutons, la demi-journée est finie. Et deux panneaux de compact sont partis au rebut.",
        },
      ],
      [
        {
          ...ABDOU,
          texte: "D'accord. Je reste au façonnage.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "L'agenceur veut plus",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...ENGUERRAND,
        heure: "11:30",
        alerte: true,
        texte:
          "Martine, Agencements Ferlay veut nous confier tous ses caissons et ses plans de travail à partir de la semaine 8 : dix commandes sur mesure de plus par semaine, avec des pénalités si on livre en retard. C'est le plus gros contrat de l'année pour l'atelier. Je lui réponds lundi.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 5 : ${ctx.demande} commandes sur mesure, ${ctx.service} faites à l'atelier. Maîtrise de la relève : ${ctx.releve}.`,
      },
    ],
    sources: [
      {
        id: "capacite",
        titre: "Calculer ce que la machine pourra faire après les départs",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Avec René et Joaquim, la machine fait jusqu'à 44 commandes par semaine. Après leur départ, elle fera ce que la relève saura faire. La demande attendue en semaine 12 : environ 40 commandes, 50 avec le contrat. ${
            ctx.relevePrete
              ? "Au rythme où la relève progresse, l'atelier devrait suivre, sans marge s'il manque quelqu'un."
              : "Au rythme actuel, la relève n'en fera pas la moitié."
          }`,
      },
      {
        id: "contrat",
        titre: "Lire les conditions du contrat",
        cout: 0.5,
        nature: "utile",
        resultat:
          "400 € de pénalité par commande livrée en retard. Et si les retards durent deux semaines de suite, l'agenceur nous répercute ses pénalités de chantier : 5 000 €. Ferlay accepterait un volume plafonné à cinq commandes par semaine, avec des délais souples et sans pénalité.",
      },
    ],
    question: "Que répondez-vous à l'agenceur ?",
    options: [
      {
        t: "Accepter tout le contrat",
        d: "Dix commandes de plus par semaine à partir de la semaine 8, pénalités de retard comprises.",
      },
      {
        t: "Accepter un volume plafonné à cinq commandes par semaine, avec des délais souples",
        d: "La moitié du volume, sans pénalité.",
      },
      {
        t: "Refuser poliment : ce n'est pas le moment",
        d: "Ferlay ira voir ailleurs.",
      },
    ],
    reactions: [
      [
        {
          ...ENGUERRAND,
          texte:
            "Signé ! Ferlay est ravi. Les premières commandes arrivent en semaine 8, je t'envoie le planning.",
        },
      ],
      [
        {
          ...ENGUERRAND,
          texte:
            "Ferlay a accepté le plafond. Il aurait préféré tout nous confier, mais il comprend. Cinq commandes par semaine à partir de la semaine 8.",
        },
      ],
      [
        {
          ...ENGUERRAND,
          texte:
            "J'ai prévenu Ferlay. Il est déçu, et il va consulter un atelier de Villeurbanne. Je ne suis pas sûr qu'il revienne.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le dernier mois de René",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...RH,
        heure: "09:00",
        texte:
          "Martine, le pot de départ de René est prévu vendredi prochain, fin de semaine 8. Si tu veux lui proposer quelque chose, c'est maintenant : après, il aura liquidé sa retraite et fait ses plans.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        alerte: true,
        texte: `Semaine 7 : ${ctx.service} des commandes sur mesure faites à l'atelier. Pilotes autonomes sur la machine : ${ctx.pilotes}, René compris. Maîtrise de la relève : ${ctx.releve}.`,
      },
    ],
    sources: [
      {
        id: "retraite",
        titre: "Demander aux ressources humaines ce que permet le cumul emploi-retraite",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "René peut liquider sa retraite et reprendre un contrat à temps partiel chez nous, sans plafond de revenus : deux jours par semaine, 500 € chargés par semaine, à partir de la semaine 9. Reporter son départ à plein temps, en revanche, l'obligerait à décaler sa retraite et ses projets : c'est rarement accepté.",
      },
      {
        id: "cafe",
        titre: "Prendre un café avec René",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.valorise
            ? "René : « Hamza m'a demandé si je reviendrais de temps en temps. Ça m'a touché. Deux jours par semaine, je ne dis pas non. À plein temps, ma femme me tue : on part en Bretagne en septembre. »"
            : "René : « Trente-huit ans ici, et c'est la première fois qu'on me demande ce que je sais faire. Un peu tard, non ? »",
      },
    ],
    question: "Que proposez-vous à René ?",
    options: [
      {
        t: "Lui proposer un cumul emploi-retraite : deux jours par semaine pour transmettre et reprendre les pièces difficiles",
        d: "De la semaine 9 à la fin du trimestre, 500 € par semaine sur l'enveloppe. Il dira oui, ou pas.",
      },
      {
        t: "Lui demander de reporter son départ de trois mois, à plein temps, avec une prime",
        d: "6 000 € de prime s'il accepte. Il dira oui, ou pas.",
      },
      {
        t: "Lui demander de rester joignable par téléphone en cas de blocage",
        d: "Gratuit, et il a dit qu'il répondrait.",
      },
      {
        t: "Organiser un beau pot de départ, et laisser la relève se débrouiller",
        d: "Il l'a bien mérité.",
      },
    ],
    reactions: [
      [
        {
          ...RENE,
          texte:
            "Deux jours par semaine… Laisse-moi en parler à la maison. Je te réponds la semaine prochaine.",
        },
      ],
      [
        {
          ...RENE,
          texte:
            "Trois mois de plus ? Je ne m'y attendais pas. Il faut que j'en parle à ma femme, on a des projets. Je te dis ça la semaine prochaine.",
        },
      ],
      [
        {
          ...RENE,
          texte: "Bien sûr, appelle-moi. Si je suis à la pêche, je rappellerai le soir.",
        },
      ],
      [
        {
          ...RENE,
          texte: "Merci pour le pot, Martine. Trente-huit ans, ça passe vite.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Joaquim s'en va",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...JOAQUIM,
        heure: "14:00",
        alerte: true,
        texte: `Martine, plus qu'une semaine pour moi. ${
          ctx.relevePrete
            ? "La relève tient la machine, mais il reste des pièces complexes que personne n'a encore faites seul."
            : "Franchement, je ne vois pas qui fera tourner la machine lundi en huit."
        } On fait comment ?`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 10 : ${ctx.demande} commandes sur mesure, ${ctx.service} faites à l'atelier, ${ctx.sousTraitees} sous-traitées. Pilotes autonomes : ${ctx.pilotes}. Maîtrise de la relève : ${ctx.releve}.`,
      },
    ],
    sources: [
      {
        id: "validation",
        titre: "Passer en revue avec Joaquim les pièces que chaque pilote sait faire seul",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.relevePrete
            ? "Sur les vingt-six familles de pièces, la relève en fait seule dix-neuf. Les sept autres, des caissons d'angle et des usinages de compact, Joaquim pourrait les valider avec chacun sa dernière semaine, pièce par pièce. Ce qui ne serait pas validé partirait en sous-traitance plutôt qu'au rebut."
            : "Sur les vingt-six familles de pièces, la relève en fait seule quatre ou cinq. Une semaine de validation n'y changera pas grand-chose : il faudrait quelqu'un qui sache déjà piloter une machine numérique.",
      },
    ],
    question: "Comment organisez-vous le départ de Joaquim ?",
    options: [
      {
        t: "Organiser la passation : Joaquim valide chaque pilote, pièce par pièce, sur ce qu'il ne maîtrise pas encore",
        d: "Sa dernière semaine, en partie hors production. Ce qui n'est pas validé part en sous-traitance.",
      },
      {
        t: "Faire venir un intérimaire spécialisé en commande numérique pour les semaines 12 et 13",
        d: "2 000 € par semaine sur l'enveloppe. Il connaît les machines, pas nos pièces.",
      },
      {
        t: "Demander à Joaquim des heures supplémentaires sa dernière semaine pour avancer les commandes",
        d: "900 €. La machine tournera plus tard le soir.",
      },
      {
        t: "Ne rien prévoir de particulier",
        d: "La relève prendra la suite.",
      },
    ],
    reactions: [
      [
        {
          ...JOAQUIM,
          texte:
            "On a fait les caissons d'angle avec Océane ce matin, les usinages de compact avec Hamza cet après-midi. Je leur ai laissé mes programmes et mon numéro. Je pars tranquille.",
        },
      ],
      [
        {
          de: "Agence d'intérim",
          role: "Prestataire",
          texte:
            "Nous vous envoyons Wilfried, cinq ans sur des centres d'usinage dans la menuiserie industrielle. Il commence lundi de la semaine 12.",
        },
      ],
      [
        {
          ...JOAQUIM,
          texte: "Je resterai jusqu'à 19 heures toute la semaine. Après, il faudra faire sans moi.",
        },
      ],
      [
        {
          ...JOAQUIM,
          texte: "D'accord. Je laisse ma clé USB sur l'établi, on ne sait jamais.",
        },
        {
          ...HAMZA,
          texte:
            "Les caissons d'angle, je ne les ai jamais faits seul. On verra lundi en huit, je suppose.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Transmettre tôt", chemin: [1, 0, 0, 0, 0, 0] },
  { nom: "Acheter la compétence dehors", chemin: [0, 2, 1, 0, 3, 1] },
  { nom: "Attendre les départs", chemin: [3, 3, 3, 2, 3, 3] },
] as const;

/**
 * Les réflexes du métier face à des compétences qui partent : attendre puis
 * recruter dehors, envoyer du monde en formation générique, faire tourner
 * tout le monde sans former personne, ou acheter la bibliothèque de
 * programmes du fabricant au lieu de faire écrire ce qu'on sait.
 * [décision, option].
 * Une option que le bilan juge défendable sur le meilleur chemin n'y figure
 * pas, pour que le bilan et ce constat ne se contredisent pas.
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 2],
  [2, 1],
  [2, 2],
] as const;

export const REPONSES = {
  cabinetConfiant:
    "Mission lancée. Bonne nouvelle : nous avons déjà deux profils qui pourraient convenir. Je vous tiens au courant d'ici quelques semaines.",
  cabinetPrudent:
    "Mission lancée. Je ne vous cache pas que le marché est très tendu : personne en vue pour l'instant. Je vous tiens au courant d'ici quelques semaines.",
  cabinetTrouve: (semaine: number) =>
    `Nous avons notre candidat : un opérateur confirmé, dix ans de commande numérique dans l'ameublement. Il a démissionné, il arrive en semaine ${semaine}.`,
  cabinetRate:
    "Nos deux candidats ont accepté d'autres offres. Nous continuons la recherche, mais pas d'arrivée possible avant le trimestre prochain.",
  reneOui:
    "C'est d'accord pour deux jours par semaine. Le mardi et le jeudi. Ma femme dit que ça me fera du bien de ne pas tourner en rond.",
  reneProlonge:
    "On en a parlé à la maison : je reste jusqu'à la fin du trimestre. La Bretagne attendra un peu.",
  reneNon:
    "J'ai bien réfléchi, Martine : non. Trente-huit ans, ça suffit. Je pars comme prévu vendredi.",
} as const;
