/**
 * L'EDI QUI S'IMPOSE : le contenu de l'épisode.
 *
 * Lou Le Bihan travaille à l'administration des ventes de la Laiterie de
 * Kerbrélan, à Loudéac. Celtis, la première enseigne cliente, impose
 * l'échange de données informatisé : commandes, avis d'expédition et
 * factures en messages normalisés. Six décisions de terminale STMG, au
 * niveau de la personne qui fait les échanges, pas de la direction : comment
 * recevoir les commandes, traiter les rejets, sécuriser le canal, émettre la
 * facture électronique, parler le même langage que le transporteur, et
 * choisir les prochains partenaires à raccorder.
 *
 * Chaque chiffre qu'une source donne au joueur se lit dans les constantes du
 * modèle. Les sources portent leur NATURE (décisive, utile, bruit, aide), que
 * le joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  COMMANDES_AUTRES_ENSEIGNES,
  COMMANDES_PAR_MAGASIN,
  COMMANDES_PAR_SEMAINE,
  COUT_ERREUR,
  COUT_INCIDENT,
  HAUSSE_DES_COMMANDES,
  MAGASINS,
  MESSAGES_PAR_COMMANDE,
  PALETTES_PAR_SEMAINE,
  PETITS_CLIENTS,
  RACCORDEMENT_PETIT_CLIENT,
  RECEPTION,
  SEMAINES_DE_RODAGE,
  SEMAINE_EXIGENCE,
  SEMAINE_FACTURE_ELECTRONIQUE,
  TAUX_DE_REJET,
  TRANSPORT,
} from "@/engine/episodes/edi-qui-s-impose";
import { euros, nombre, taux } from "./format";
import type { Etape } from "./types";

const NAIM = {
  de: "Naïm Lefeuvre",
  role: "Directeur des grands comptes et des MDD",
} as const;
const MALO = { de: "Malo Jézéquel", role: "Service informatique" } as const;
const CELTIS = {
  de: "Bastien Ollivier",
  role: "Responsable des échanges, Celtis",
} as const;
const ERWAN = { de: "Erwan Le Du", role: "Transports Le Du" } as const;
const GWENOLA = {
  de: "Gwenola Rio",
  role: "Administration des ventes",
} as const;
const TABLEAU = {
  de: "Tableau de bord des ventes",
  role: "Point hebdomadaire",
} as const;

/** Un pourcentage entier : « 6 % ». */
const pc = (v: number) => taux(v, 0);
const MANUEL = RECEPTION[0];

export const DIAGNOSTICS = [
  {
    id: "ressaisie",
    t: "Les commandes sont recopiées à la main : chaque recopie est une erreur possible, et l'enseigne veut des messages qu'elle lit sans ressaisie",
  },
  {
    id: "codes",
    t: "Les codes de nos fiches articles ne sont pas ceux de l'enseigne : nos documents sont rejetés",
  },
  {
    id: "volumes",
    t: "Il y a trop de commandes pour l'équipe de l'administration des ventes",
  },
  { id: "enseigne", t: "Celtis exige trop de ses fournisseurs" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Celtis passe à l'EDI",
    jusqua: 2,
    messages: () => [
      {
        ...CELTIS,
        heure: "08:05",
        alerte: true,
        texte:
          "À partir de la semaine prochaine, nos magasins passent leurs commandes en EDI. Nous attendons de chaque fournisseur l'avis d'expédition et la facture dans le même format. Les documents papier et les mails ne seront plus traités.",
      },
      {
        ...NAIM,
        heure: "09:00",
        texte:
          "Lou, c'est toi qui reçois les commandes de Celtis. Dis-moi vendredi comment tu veux t'organiser. Je ne veux pas de pénalités.",
      },
      {
        ...TABLEAU,
        role: "Alerte automatique",
        heure: "09:15",
        texte: `Le mois dernier : ${pc(MANUEL.erreur)} des commandes Celtis saisies avec une erreur, et ${pc(TAUX_DE_REJET)} de nos avis d'expédition et factures rejetés par l'enseigne.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "erreurs",
        titre: "Compter les erreurs de saisie du mois dernier",
        cout: 0.5,
        nature: "decisive",
        resultat: `${pc(MANUEL.erreur)} des commandes recopiées du portail de Celtis portaient une erreur : une quantité, une référence, un magasin. Chacune a coûté une pénalité logistique et des produits frais perdus, environ ${euros(COUT_ERREUR)}. Recopier une commande prend ${MANUEL.minutes} minutes.`,
      },
      {
        id: "cahier",
        titre: "Lire le cahier des charges EDI de Celtis",
        cout: 1,
        nature: "decisive",
        resultat:
          "Celtis envoie des messages normalisés, lisibles par n'importe quel logiciel qui connaît le standard, et attend la réponse dans le même langage. Trois façons de se raccorder : un écran web chez un prestataire, où l'on recopie encore ; un logiciel de gestion relié, qui lit et écrit les messages seul ; ou une dérogation, facturée chaque semaine.",
      },
      {
        id: "volumes",
        titre: "Comparer les volumes de commandes à l'an dernier",
        cout: 1,
        nature: "bruit",
        resultat: `Les commandes de Celtis ont augmenté de ${pc(HAUSSE_DES_COMMANDES)} en un an.`,
      },
      {
        id: "logiciel",
        titre:
          "Demander au service informatique ce que peut faire le logiciel de gestion",
        cout: 0.5,
        nature: "utile",
        resultat: `Malo : « Le logiciel peut lire et écrire les messages EDI, avec un prestataire qui fait la traduction. Il faut ${SEMAINES_DE_RODAGE} semaines de réglages, et quelques erreurs pendant ce temps. »`,
      },
      {
        id: "conseil",
        titre: "Demander conseil à Naïm",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Naïm : « Avant de choisir un outil, regarde ce que nous coûte une commande recopiée. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment recevez-vous les commandes de Celtis ?",
    options: [
      {
        t: "Recopier les commandes du portail Celtis, comme avant, sans rien payer",
        d: `Aucun outil à acheter. ${MANUEL.minutes} minutes par commande, et le risque d'erreur reste le même.`,
      },
      {
        t: "Prendre un écran web chez un prestataire, moins cher qu'un logiciel relié",
        d: "Un abonnement modeste. Les commandes arrivent en EDI, mais il faut encore les recopier dans le logiciel.",
      },
      {
        t: "Relier le logiciel de gestion à l'EDI par un prestataire",
        d: `Une mise en place, puis ${SEMAINES_DE_RODAGE} semaines de réglages. Ensuite, les commandes entrent seules, et les réponses partent seules.`,
      },
      {
        t: "Demander une dérogation à Celtis, et garder le fax et le mail",
        d: "Rien ne change pour l'équipe. Celtis facture la non-conformité chaque semaine.",
      },
    ],
    reactions: [
      [
        {
          ...GWENOLA,
          texte:
            "On recopie, encore et encore. Hier, j'ai livré 40 cartons à un magasin qui en voulait 4.",
        },
      ],
      [
        {
          ...GWENOLA,
          texte:
            "L'écran est plus clair que le portail. Mais on recopie toujours tout dans le logiciel.",
        },
      ],
      [
        {
          ...MALO,
          texte:
            "Les premières commandes sont entrées seules ce matin. Il reste des réglages, mais personne n'a rien recopié.",
        },
      ],
      [
        {
          ...CELTIS,
          texte:
            "Dérogation accordée, mais facturée chaque semaine. Elle ne durera pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les messages rejetés",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...CELTIS,
        heure: "11:30",
        alerte: true,
        texte: `Cette semaine encore, ${ctx.rejets} de vos messages ont été rejetés : code article inconnu, lieu de livraison absent, unité fausse. Un message rejeté n'est pas traité.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Commandes saisies avec une erreur : ${ctx.erreurs}. Messages rejetés : ${ctx.rejets}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "rejets",
        titre: "Lire les motifs des messages rejetés",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Presque tous les rejets viennent des mêmes fiches articles : le code article n'est pas celui du standard, le code du lieu de livraison manque, le carton est compté en unités. Corrigé dans le message, le défaut revient au message suivant.",
      },
      {
        id: "guide",
        titre: "Lire le guide des codes de Celtis",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le guide décrit le standard commun à toute la grande distribution : un code par article, un code par lieu de livraison, des unités définies. Une fiche article à jour sert pour tous les messages, et pour tous les clients qui utilisent ce standard.",
      },
    ],
    question: "Que faites-vous des messages rejetés ?",
    options: [
      {
        t: "Corriger chaque message rejeté à la main, puis le renvoyer à Celtis",
        d: "Un quart d'heure par message. Le message repart vite.",
      },
      {
        t: "Mettre les fiches articles aux codes du standard de l'enseigne",
        d: "Une journée et demie, une fois. Ensuite, les messages partent justes.",
      },
      {
        t: "Renvoyer les documents rejetés en PDF par mail, pour aller plus vite",
        d: "Le document part tout de suite, sous une forme que chacun sait lire.",
      },
      {
        t: "Payer le prestataire pour qu'il corrige chaque rejet à votre place",
        d: "Quelques euros par rejet. Vous n'y passez plus de temps.",
      },
    ],
    reactions: [
      [
        {
          ...GWENOLA,
          texte:
            "J'ai corrigé trente messages cette semaine. Les mêmes erreurs reviennent chaque jour.",
        },
      ],
      [
        {
          ...CELTIS,
          texte:
            "Vos messages passent maintenant sans rejet. Merci d'avoir suivi le guide.",
        },
      ],
      [
        {
          ...CELTIS,
          texte:
            "Nous ne traitons pas les PDF. Vos factures attendront le bon format pour être payées.",
        },
      ],
      [
        {
          ...MALO,
          texte:
            "Le prestataire corrige, et facture. Mais les fiches n'ont pas changé : les rejets continuent.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Sécuriser les échanges",
    jusqua: 6,
    messages: () => [
      {
        ...MALO,
        heure: "10:00",
        alerte: true,
        texte:
          "Nos fichiers partent sur un serveur protégé par un seul mot de passe, que dix personnes connaissent. Une laiterie voisine s'est fait détourner une facture le mois dernier.",
      },
      {
        ...CELTIS,
        heure: "14:20",
        texte: `À partir de la semaine ${SEMAINE_EXIGENCE}, nous exigerons de nos fournisseurs un canal d'échange sécurisé reconnu.`,
      },
    ],
    sources: [
      {
        id: "risques",
        titre: "Faire le point avec Malo sur les risques",
        cout: 0.5,
        nature: "decisive",
        resultat: `Un mot de passe partagé ou un mail peuvent être interceptés : un fichier de factures modifié, des coordonnées bancaires changées. Une fraude de ce genre coûte vite ${euros(COUT_INCIDENT)}.`,
      },
      {
        id: "partenaires",
        titre: "Demander à Celtis ce que ses partenaires utilisent",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Celtis et ses fournisseurs utilisent un protocole sécurisé reconnu, avec des certificats : les fichiers sont chiffrés, et chacun sait les lire. Un chiffrement maison, que les autres ne connaissent pas, rend les fichiers illisibles pour eux.",
      },
    ],
    question: "Comment sécurisez-vous les échanges ?",
    options: [
      {
        t: "Garder le serveur et son mot de passe partagé : rien n'est arrivé",
        d: "Aucun coût, aucun changement pour les partenaires.",
      },
      {
        t: "Envoyer les fichiers par mail, avec le mot de passe dans un second mail",
        d: "Simple, et un peu plus sûr qu'un mot de passe connu de tous.",
      },
      {
        t: "Chiffrer les fichiers avec un outil gratuit, sans gêner les partenaires",
        d: "Un logiciel gratuit trouvé en ligne. Les fichiers sont chiffrés dès demain.",
      },
      {
        t: "Passer au canal sécurisé que Celtis et ses fournisseurs utilisent",
        d: "Des certificats et un accès nominatif par personne. Une mise en place, puis un petit abonnement.",
      },
    ],
    reactions: [
      [
        {
          ...MALO,
          texte:
            "Rien ne change. J'espère seulement que personne ne s'intéresse à nos fichiers.",
        },
      ],
      [
        {
          ...GWENOLA,
          texte:
            "Deux mails pour chaque fichier. On s'y fait, mais Celtis n'en veut pas.",
        },
      ],
      [
        {
          ...CELTIS,
          texte:
            "Nous recevons des fichiers que nous ne savons pas ouvrir. Ils sont rejetés.",
        },
      ],
      [
        {
          ...CELTIS,
          texte:
            "Le canal est en place et reconnu par nos systèmes. Rien à signaler.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "La facture électronique",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...CELTIS,
        heure: "09:30",
        alerte: true,
        texte: `À partir de la semaine ${SEMAINE_FACTURE_ELECTRONIQUE}, nous n'accepterons plus que des factures électroniques, transmises par une plateforme agréée.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Messages rejetés cette semaine : ${ctx.rejets}. Ce que les échanges ont coûté depuis le début du trimestre : ${ctx.couts}.`,
      },
    ],
    sources: [
      {
        id: "reforme",
        titre: "Lire ce que dit la réforme de la facture électronique",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Une facture électronique est un fichier structuré, que le logiciel du client lit sans ressaisie, transmis par une plateforme agréée. Un PDF envoyé par mail n'en est pas une.",
      },
      {
        id: "portail",
        titre: "Regarder le portail fournisseur de Celtis",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le portail permet de saisir chaque facture à la main dans un formulaire. Il ne sert que pour Celtis, et toutes les factures n'y passent pas.",
      },
    ],
    question: "Comment préparez-vous la facture électronique ?",
    options: [
      {
        t: "Choisir une plateforme agréée, reliée au logiciel de gestion",
        d: "Une mise en place, puis quelques centimes par facture. Les factures partent seules, au bon format.",
      },
      {
        t: "Continuer les PDF par mail : c'est déjà une facture numérique",
        d: "Aucun changement, et les clients reçoivent leurs factures tout de suite.",
      },
      {
        t: "Saisir chaque facture sur le portail fournisseur de Celtis",
        d: "Aucun outil à payer. Quelques minutes par facture.",
      },
      {
        t: "Revenir au papier posté, le temps que la réforme se précise",
        d: "Un timbre par facture. Rien à changer dans le logiciel.",
      },
    ],
    reactions: [
      [
        {
          ...MALO,
          texte:
            "La plateforme est reliée : les factures partent au bon format, sans ressaisie.",
        },
      ],
      [
        {
          ...CELTIS,
          texte:
            "Vos PDF ne sont plus traités. Les factures concernées ne seront pas payées.",
        },
      ],
      [
        {
          ...GWENOLA,
          texte:
            "Je passe mes après-midi sur le portail, et certaines factures y sont refusées.",
        },
      ],
      [{ ...CELTIS, texte: "Nous ne traitons plus les factures papier." }],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le transporteur",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...ERWAN,
        heure: "07:40",
        alerte: true,
        texte: `Cette semaine, l'entrepôt de Celtis a refusé ${ctx.palettes} de vos palettes : le bon papier ne correspondait pas à ce qu'il attendait. Mes chauffeurs attendent au quai.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Palettes refusées cette semaine : ${ctx.palettes}.`,
      },
    ],
    sources: [
      {
        id: "quai",
        titre:
          "Demander à l'entrepôt de Celtis pourquoi il refuse les palettes",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'entrepôt reçoit l'avis d'expédition avant le camion, et lit l'étiquette normalisée de chaque palette. Une palette sans étiquette du standard, ou qui ne figure pas sur l'avis, est contrôlée à la main ou refusée.",
      },
      {
        id: "transporteur",
        titre: "Demander à Erwan ce que son entreprise sait lire",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Erwan : « Mon logiciel lit les avis d'expédition au même standard que Celtis. Un fichier maison, je dois le recopier. Mes propres étiquettes, l'entrepôt ne les connaît pas. »",
      },
    ],
    question: "Comment travaillez-vous avec le transporteur ?",
    options: [
      {
        t: "Garder le bon de livraison papier avec les palettes, qui a toujours servi",
        d: `Rien à changer. ${PALETTES_PAR_SEMAINE} palettes par semaine, ${pc(TRANSPORT[0].refus)} refusées en ce moment.`,
      },
      {
        t: "Envoyer chaque soir au transporteur un tableau de nos expéditions",
        d: "Un tableur, simple à remplir. Le transporteur le recopie dans son logiciel.",
      },
      {
        t: "Laisser le transporteur imprimer ses propres étiquettes à son dépôt",
        d: "Il connaît son métier. Il facture l'impression chaque semaine.",
      },
      {
        t: "Adopter avec lui l'avis d'expédition et l'étiquette du standard",
        d: "Une imprimante d'étiquettes, une fois. Le même langage pour la laiterie, le transporteur et l'entrepôt.",
      },
    ],
    reactions: [
      [
        {
          ...ERWAN,
          texte:
            "Encore des palettes refusées ce matin. Je vais devoir facturer l'attente.",
        },
      ],
      [
        {
          ...ERWAN,
          texte:
            "Mon équipe recopie votre tableau chaque soir. Il y a forcément des erreurs.",
        },
      ],
      [
        {
          ...ERWAN,
          texte:
            "Mes étiquettes sont belles, mais l'entrepôt de Celtis ne sait pas les lire.",
        },
      ],
      [
        {
          ...ERWAN,
          texte:
            "Les avis d'expédition arrivent avant le camion, et l'entrepôt scanne les palettes sans contrôle. Mes chauffeurs repartent en vingt minutes.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Ce que coûte chaque échange",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...NAIM,
        heure: "15:00",
        alerte: true,
        texte:
          "Lou, les deux autres enseignes et nos petits clients nous demandent s'ils peuvent passer à l'EDI. Que proposes-tu ?",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Ce que les échanges ont coûté depuis le début du trimestre : ${ctx.couts}.`,
      },
    ],
    sources: [
      {
        id: "cout",
        titre: "Calculer ce que coûte une commande, client par client",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les deux autres enseignes passent ${COMMANDES_AUTRES_ENSEIGNES} commandes par semaine, toutes recopiées, avec le même taux d'erreur qu'avant chez Celtis. Les ${PETITS_CLIENTS} petites crémeries et épiceries fines commandent une ou deux fois par mois ; raccorder chacune coûte environ ${euros(RACCORDEMENT_PETIT_CLIENT)}.`,
      },
      {
        id: "formats",
        titre: "Demander à Malo ce que demande chaque client",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les deux enseignes utilisent le même standard que Celtis. Les petits clients veulent chacun un format différent : un tableur, un mail, un bon de commande papier.",
      },
    ],
    question: "Quels clients raccordez-vous à l'EDI ?",
    options: [
      {
        t: "Raccorder tous les clients, jusqu'aux petites crémeries, en une fois",
        d: "Tout le monde au même régime. Un raccordement par client.",
      },
      {
        t: "Raccorder d'abord les deux enseignes, qui font le plus de commandes",
        d: "Elles parlent déjà le standard : le logiciel est prêt à les recevoir.",
      },
      {
        t: "Ne raccorder personne de plus : un client en EDI, ça suffit",
        d: "Aucun coût de plus. Les autres commandes restent recopiées.",
      },
      {
        t: "Accepter le format de chaque client, et s'adapter à chacun",
        d: "Chaque client garde ses habitudes. Un traducteur par format à entretenir.",
      },
    ],
    reactions: [
      [
        {
          ...MALO,
          texte:
            "Vingt-cinq raccordements pour des clients qui commandent deux fois par mois. Ça fait cher la commande.",
        },
      ],
      [
        {
          ...NAIM,
          texte: `Les deux enseignes sont raccordées : ${nombre(COMMANDES_AUTRES_ENSEIGNES, 0)} commandes par semaine de moins à recopier.`,
        },
      ],
      [
        {
          ...GWENOLA,
          texte:
            "On recopie toujours les commandes des deux autres enseignes. Avec les mêmes erreurs.",
        },
      ],
      [
        {
          ...MALO,
          texte:
            "J'entretiens maintenant un traducteur par client. Au moindre changement, tout casse.",
        },
      ],
    ],
  },
];

/** La prévision de la semaine 1 : une multiplication guidée, les magasins par leurs commandes de la semaine. */
export const PREVISION = {
  magasins: MAGASINS,
  parMagasin: COMMANDES_PAR_MAGASIN,
  total: COMMANDES_PAR_SEMAINE,
  messages: MESSAGES_PAR_COMMANDE,
} as const;

/** Les trois manières de faire auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Un langage commun, sans ressaisie", chemin: [2, 1, 3, 0, 3, 1] },
  { nom: "Le moins cher tout de suite", chemin: [0, 3, 0, 2, 1, 2] },
  { nom: "Faire comme d'habitude", chemin: [0, 0, 0, 1, 0, 2] },
] as const;

/**
 * Les réponses réflexes : refuser l'EDI, revenir au PDF, garder un canal
 * fragile, appeler numérique ce qui n'est pas structuré, inventer son propre
 * format, ou tout raccorder sans compter. [décision, option].
 */
export const REFLEXES = [
  [0, 3],
  [1, 2],
  [2, 0],
  [3, 1],
  [4, 1],
  [5, 0],
] as const;

export const REPONSES = {
  incident:
    "Une facture a été détournée : un fichier modifié en route a changé les coordonnées bancaires. L'argent est parti.",
  facturesRefusees:
    "Celtis refuse les factures qui ne sont pas électroniques : elles ne seront payées qu'une fois refaites au bon format.",
} as const;
