/**
 * LE GRAND COMPTE QUI VEUT L'EXCLUSIVITÉ — le contenu de l'épisode.
 *
 * Kenji Lefranc est directeur commercial grands comptes d'Arvel
 * Distribution. Le groupe Sarlève, entreprise générale de construction, lui
 * propose un contrat-cadre de trois ans : 5 M€ par an sur la région
 * Lyon-Rhône, près d'un quart de son chiffre d'affaires, contre des prix
 * serrés, une exclusivité réciproque, un stock et une cellule dédiés, et
 * soixante jours de délai de paiement. Six décisions, chacune précédée de ce
 * qu'un directeur commercial reçoit vraiment : la direction générale qui
 * veut une recommandation, un directeur régional qui veut remplir ses
 * dépôts, un acheteur qui fait jouer la concurrence, deux clients fidèles
 * qu'il faudrait cesser de livrer.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : la contribution annuelle aux conditions proposées,
 * la part de Sarlève dans la région, la valeur de l'extension selon le
 * carnet de commandes, ce que coûterait un point de prix, ce que coûterait
 * la rupture.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const GONZAGUE = {
  de: "Gonzague Hennequin",
  role: "Directeur général d'Arvel Distribution",
} as const;
const ROSALIE = {
  de: "Rosalie Fontenay",
  role: "Directrice administrative et financière",
} as const;
const ELIOTT = { de: "Eliott Brasseur", role: "Directeur régional Lyon-Rhône" } as const;
const AUGUSTIN = { de: "Augustin Delcourt", role: "Directeur des achats, groupe Sarlève" } as const;
const NADIR = { de: "Nadir Boumediene", role: "Chargé d'affaires, compte Sarlève" } as const;
const OUMOU = { de: "Oumou Sylla", role: "Responsable du dépôt de Corbas" } as const;
const WEN = { de: "Wen Zhao", role: "Contrôleuse de gestion commerciale" } as const;
const YVON = { de: "Yvon Moulinier", role: "Président de Moulinier Construction" } as const;
const ANAELLE = { de: "Anaëlle Robin", role: "Juriste d'Arvel Distribution" } as const;

/** Le contrat est-il signé, ou en passe de l'être ? */
const avecContrat = (ctx: Contexte) => ctx.statut === "signe" || ctx.statut === "plusTard";

export const DIAGNOSTICS = [
  {
    id: "dependance",
    t: "Le volume a de la valeur, mais il crée une dépendance : il faut chiffrer ce qu'elle coûte — clients exclus, actifs dédiés, pouvoir de Sarlève à la revue des prix — et négocier les clauses qui la bornent",
  },
  {
    id: "marge",
    t: "Une fois la cellule, le crédit client, le stock et les clients exclus déduits, le contrat reste rentable : il faut le signer et surveiller sa marge",
  },
  {
    id: "volume",
    t: "Trois ans de volume garanti, c'est la sécurité de la région et des remises fabricants : il faut signer avant Lestrade",
  },
  {
    id: "risque",
    t: "Un quart du chiffre d'affaires de la région sur un seul client, c'est un risque inacceptable : il faut décliner",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Un quart de la région sur un seul client",
    jusqua: 2,
    messages: () => [
      {
        ...GONZAGUE,
        heure: "08:10",
        alerte: true,
        texte:
          "Kenji, Sarlève nous propose son contrat-cadre : trois ans, 5 M€ par an sur la région Lyon-Rhône. Le comité de direction se réunit jeudi, et j'attends ta recommandation, chiffrée. Leur directeur des achats veut une réponse en fin de semaine.",
      },
      {
        ...AUGUSTIN,
        heure: "09:05",
        texte:
          "Monsieur Lefranc, nos conditions sont dans le projet de contrat : prix de groupe, exclusivité réciproque, stock dédié, soixante jours. Lestrade Négoce est prêt à signer les mêmes. Je préférerais travailler avec vous : vos dépôts sont mieux placés.",
      },
      {
        ...ELIOTT,
        heure: "10:30",
        texte:
          "5 M€ par an, Kenji ! Le dépôt de Corbas est à moitié vide et les fabricants nous feraient enfin passer les paliers de remise. Trois ans de volume, ça ne se refuse pas.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "conditions",
        titre: "Lire le projet de contrat-cadre, ligne par ligne",
        cout: 1,
        nature: "decisive",
        resultat:
          "5 M€ HT d'achats par an pendant trois ans, aux prix du groupe : 8 % de marge sur coût variable, contre 11 % pour nos grands comptes. Une cellule dédiée — un chargé d'affaires, deux préparateurs, un camion-grue loué, une zone réservée au dépôt de Corbas — : 150 k€ par an, fixes. 400 k€ de stock dédié avant les premières livraisons. Paiement à 60 jours, contre 30 pour nos grands comptes. Exclusivité réciproque pendant toute la durée du contrat : Arvel ne livre plus Moulinier Construction ni Batival. Les prix sont révisés chaque année d'un commun accord ; à défaut d'accord, chaque partie peut résilier avec trois mois de préavis. Les volumes sont indicatifs.",
      },
      {
        id: "chiffrage",
        titre: "Demander à Rosalie Fontenay ce que le contrat coûterait à Arvel",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Rosalie Fontenay : « Le crédit court terme nous coûte 5 % par an. Trente jours de plus, ce sont des créances en plus, toutes taxes comprises (TVA à 20 %) ; compte l'année à 360 jours. Le stock coûte 8 % par an à porter : financement, assurance, démarque. Le volume nous ferait franchir trois paliers chez les fabricants : 40 k€ de remises de fin d'année de plus par an. Corbas a la place : aucun coût fixe de plus en dehors de la cellule. Moulinier et Batival, c'est 800 k€ HT d'achats par an, à 11 % de marge sur coût variable, livraison comprise. »",
      },
      {
        id: "sarleve",
        titre: "Se renseigner sur Sarlève et sur ses fournisseurs",
        cout: 1,
        nature: "utile",
        resultat:
          "Sarlève vit surtout du logement neuf. Son carnet de commandes tient à dix-huit mois, mais les permis ralentissent : les analystes du secteur donnent à peu près une chance sur deux à son activité de tenir sur trois ans, trois sur dix de se tasser d'un quart, une sur cinq de reculer de moitié. Augustin Delcourt a signé l'an dernier en Savoie avec un négociant qui avait obtenu une indexation des prix et une exclusivité de deux ans ; à Clermont-Ferrand, il est parti chez un concurrent quand le négociant a refusé toute exclusivité. Lestrade n'a pas de dépôt à l'est de Lyon.",
      },
      {
        id: "projection",
        titre: "Lire la projection de l'équipe commerciale",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "« Le plus gros contrat de l'histoire de la région » : 15 M€ de chiffre d'affaires sur trois ans, 1,2 M€ de marge, des dépôts pleins et des remises fabricants qui profitent à toutes les agences. La projection ne dit rien des coûts du contrat ni des clients qu'il fait perdre.",
      },
      {
        id: "conseil",
        titre: "Appeler Ghislain Merle, ancien directeur grands comptes",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Ghislain Merle : « Un grand contrat se juge à ce qu'il coûte autant qu'à ce qu'il rapporte : les clients qu'on ne livre plus, ce qu'on immobilise pour lui, et ce que vaudra ta position le jour où il renégociera. Ne refuse pas le volume, borne la dépendance : négocie la sortie avant l'entrée. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que recommandez-vous au comité de direction ?",
    options: [
      {
        t: "Accepter le contrat tel quel : trois ans de volume, avant que Lestrade ne le prenne",
        d: "Signature en fin de semaine, aux conditions de Sarlève. Premières livraisons en semaine 3.",
      },
      {
        t: "Accepter le principe, en négociant quatre clauses : exclusivité limitée à deux ans, indexation des prix, volume minimal garanti à 75 %, reprise du stock dédié",
        d: "Sarlève demandera une contrepartie sur le prix. Il peut accepter, consulter Lestrade d'abord, ou signer avec lui.",
      },
      {
        t: "Accepter le volume, mais sans exclusivité : Arvel garde Moulinier et Batival",
        d: "Sarlève demandera un point de prix de plus. Il peut accepter, revenir plus tard, ou signer avec Lestrade.",
      },
      {
        t: "Décliner : un quart de la région sur un seul client, c'est trop",
        d: "Rien n'est engagé. Sarlève signera avec Lestrade.",
      },
    ],
    reactions: [
      [
        {
          ...AUGUSTIN,
          texte:
            "Merci, Monsieur Lefranc. Nous signons vendredi ; nos premiers chantiers vous attendent en semaine 3.",
        },
      ],
      null,
      null,
      [
        {
          ...AUGUSTIN,
          texte: "Je le regrette. Nous signons avec Lestrade Négoce.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le stock dédié",
    jusqua: 4,
    messages: (ctx) => [
      ctx.statut === "signe"
        ? {
            ...AUGUSTIN,
            heure: "09:00",
            alerte: true,
            texte:
              "Nos premiers chantiers démarrent la semaine prochaine. Le contrat prévoit 400 k€ de stock dédié avant les premières livraisons : où en êtes-vous ?",
          }
        : ctx.statut === "plusTard"
          ? {
              ...AUGUSTIN,
              heure: "09:00",
              alerte: true,
              texte:
                "Nous consultons Lestrade sur vos propositions et revenons vers vous d'ici un mois. Si nous signons avec vous, nos chantiers démarreront aussitôt : le stock dédié devra être prêt.",
            }
          : {
              ...ELIOTT,
              heure: "09:00",
              alerte: true,
              texte:
                "Sarlève a signé avec Lestrade, qui monte un stock dédié à Saint-Priest. Il n'y a rien à constituer chez nous ; j'aurai du mal à remplir Corbas.",
            },
      ...(avecContrat(ctx)
        ? [
            {
              ...OUMOU,
              heure: "11:00",
              texte:
                "Corbas a la place pour 400 k€ de stock dédié. Mais ce sont des références que nos artisans n'achètent pas : des menuiseries aux cotes des programmes de Sarlève, des isolants en épaisseurs spéciales. Ce qui reste en rayon ne se vend à personne d'autre.",
            },
            {
              ...ROSALIE,
              heure: "14:30",
              texte:
                "Kenji, 400 k€ de stock dédié, c'est autant de trésorerie immobilisée, à 8 % par an. Avant de remplir les allées, dis-moi ce que Sarlève commande vraiment.",
            },
          ]
        : []),
    ],
    reevaluation: true,
    sources: [
      {
        id: "planning",
        titre: "Demander à Sarlève le planning ferme de ses chantiers",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur les six premiers mois, la moitié du volume annoncé est en commandes fermes ; le reste dépend de permis et de financements à venir. Un stock de sécurité de 200 k€, réapprovisionné sur les commandes fermes, couvre les délais des fabricants, au prix de commandes plus fréquentes (4 k€ par an) et d'un risque : une fois sur trois, un chantier attend une livraison, et le contrat prévoit 10 k€ de pénalités. Un stock dédié en trop s'écoule avec 35 % de décote, ce qui reste en fin de contrat avec 15 %.",
      },
      {
        id: "fabricants",
        titre: "Demander aux fabricants s'ils tiendraient le stock en dépôt",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Les trois fabricants acceptent de tenir le stock dédié en dépôt à Corbas : Arvel ne paie qu'à la sortie, rien à porter ni à déprécier. En échange, ils reprennent 2,5 points de remise sur les références concernées, 1,8 M€ d'achats par an au volume annoncé.${
            ctx.clauses
              ? " Avec la clause de reprise, Sarlève rachèterait de toute façon au prix coûtant le stock dédié devenu inutile."
              : ""
          }`,
      },
    ],
    question: "Comment constituez-vous le stock dédié ?",
    options: [
      {
        t: "Constituer les 400 k€ de stock dédié tout de suite, comme le contrat le demande",
        d: "400 k€ à porter à 8 % par an ; Sarlève est servi sans attente.",
      },
      {
        t: "Faire tenir le stock en dépôt par les fabricants",
        d: "Rien à porter ; 2,5 points de remise perdus sur les références concernées.",
      },
      {
        t: "Constituer un stock de sécurité de 200 k€ et réapprovisionner sur les commandes fermes",
        d: "200 k€ à porter, des commandes plus fréquentes aux fabricants ; un chantier peut attendre une livraison.",
      },
    ],
    reactions: [
      [
        {
          ...OUMOU,
          texte:
            "C'est noté : 400 k€ de stock dédié, en rayon dès la signature. Je réserve deux allées à Sarlève.",
        },
      ],
      [
        {
          ...OUMOU,
          texte:
            "C'est noté : les fabricants tiendront le stock en dépôt chez nous. Je leur réserve une zone fermée, à leur nom.",
        },
      ],
      [
        {
          ...OUMOU,
          texte:
            "C'est noté : 200 k€ de stock de sécurité, et un réapprovisionnement chaque semaine sur les commandes fermes.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Moulinier et Batival",
    jusqua: 6,
    messages: (ctx) => [
      ctx.exclusivite
        ? {
            ...YVON,
            heure: "08:40",
            alerte: true,
            texte:
              "Monsieur Lefranc, mon conducteur de travaux me dit que vous ne nous livrerez plus, à cause de Sarlève. Dix ans de commandes chez vous, et je l'apprends par un chauffeur ?",
          }
        : {
            ...YVON,
            heure: "08:40",
            texte: avecContrat(ctx)
              ? "Monsieur Lefranc, on me dit que vous avez refusé de nous lâcher pour Sarlève. Je m'en souviendrai."
              : "Monsieur Lefranc, on me dit que Sarlève est parti chez Lestrade. Tant mieux pour nous : vous restez notre fournisseur.",
          },
      {
        ...ELIOTT,
        heure: "10:15",
        texte: ctx.exclusivite
          ? "Mes commerciaux voudraient lancer une campagne vers d'autres entreprises générales pour compenser Moulinier et Batival : 30 k€ de remises d'accueil. Ou on écrit aux deux, et on passe à autre chose."
          : "Personne à exclure chez nous : Moulinier et Batival restent clients. Rien à décider de ce côté.",
      },
    ],
    sources: [
      {
        id: "retour",
        titre: "Regarder ce que sont devenus les clients perdus pour une exclusivité",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Il y a six ans, l'exclusivité d'un promoteur nous a fait perdre trois clients. Ceux qu'on avait prévenus par lettre ont mis en moyenne près d'un an à revenir, quelques-uns jamais, et d'autant plus lentement que l'exclusivité avait duré. Le seul qu'on était allé voir, avec un interlocuteur désigné et des conditions garanties pour son retour, est revenu le mois où l'exclusivité a pris fin. Au rythme de Moulinier et Batival, une année de marge, c'est 88 k€.",
      },
      {
        id: "conquete",
        titre: "Évaluer la campagne de conquête proposée",
        cout: 0.5,
        nature: "utile",
        resultat:
          "30 k€ de remises d'accueil et deux commerciaux pendant deux mois. Les dernières campagnes de ce type ont fait signer une entreprise générale un peu moins d'une fois sur deux, pour environ 40 k€ de marge par an ; la réponse se saura en semaine 10.",
      },
    ],
    question: "Que faites-vous pour Moulinier et Batival ?",
    options: [
      {
        t: "Leur écrire que l'exclusivité impose d'arrêter les livraisons à la signature",
        d: "Une lettre du service juridique ; rien à dépenser.",
      },
      {
        t: "Lancer une campagne de conquête d'autres entreprises générales pour compenser",
        d: "30 k€ de remises d'accueil et deux commerciaux pendant deux mois.",
      },
      {
        t: "Les recevoir, leur expliquer, et préparer leur retour à la fin de l'exclusivité",
        d: "Une rencontre chacun, un interlocuteur désigné, des conditions garanties au retour : 6 k€ de gestes et de temps.",
      },
    ],
    reactions: [
      [
        {
          ...ANAELLE,
          texte:
            "Les lettres partent ce soir, en recommandé. Elles rappellent la date de fin des livraisons et rien d'autre.",
        },
      ],
      [
        {
          ...ELIOTT,
          texte: "On lance la campagne lundi. Mes deux meilleurs commerciaux sont dessus.",
        },
      ],
      [
        {
          ...YVON,
          texte:
            "Je préfère l'entendre de vous. Gardez-nous la place : quand ce sera fini, on reviendra, aux conditions que vous dites.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Sarlève veut étendre le contrat à l'Isère",
    jusqua: 7,
    messages: (ctx) => [
      avecContrat(ctx)
        ? {
            ...AUGUSTIN,
            heure: "09:30",
            alerte: true,
            texte:
              "Notre filiale Sarlève Dauphiné voudrait les mêmes conditions : 1,5 M€ de plus par an, livrés depuis un entrepôt près de Bourgoin-Jallieu, à partir du printemps. Il me faut votre réponse sous quinze jours.",
          }
        : {
            ...ELIOTT,
            heure: "09:30",
            alerte: true,
            texte:
              "Sarlève étend son contrat à sa filiale iséroise, et Lestrade cherche un entrepôt à Bourgoin. Si un jour on nous propose la même chose, il faudra savoir quoi répondre.",
          },
      ...(avecContrat(ctx)
        ? [
            {
              ...ELIOTT,
              heure: "10:45",
              texte:
                "1,5 M€ de plus, et les remises qui vont avec ! Un entrepôt à Bourgoin, c'est 60 k€ de loyer par an : on le remplira.",
            },
            {
              ...WEN,
              heure: "14:20",
              texte: `Avec sa filiale, Sarlève pèserait ${ctx.partExtension} du chiffre d'affaires de la région.`,
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "extension",
        titre: "Chiffrer l'extension selon l'activité de la filiale",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Un entrepôt en bail ferme de trois ans (60 k€ par an, 40 k€ d'aménagement), sous-louable à moitié prix si le contrat s'arrête. Aux conditions ${
            avecContrat(ctx) ? "du contrat" : "que Sarlève propose"
          }, l'extension crée ${ctx.extSolide} si l'activité de la filiale tient, et en détruit ${ctx.extTassement} si elle se tasse, ${ctx.extRetournement} si elle se retourne : la filiale, qui ne fait que du logement neuf, serait la première touchée. Avec une chance sur deux, trois sur dix et une sur cinq, c'est ${ctx.extEsperance} en espérance. L'engagement de volume minimal ne couvre pas la filiale.`,
      },
      {
        id: "analyse",
        titre: "Demander au cabinet Ardoise Conseil ce que dirait une analyse du carnet de Sarlève",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ronan Le Gall : « En deux semaines et pour 6 k€, nous analysons le carnet de commandes, les comptes et les permis de Sarlève. Un groupe solide, nous le reconnaissons 85 fois sur 100. Un tassement, nous le prenons pour de la solidité une fois sur quatre ; un retournement, une fois sur vingt. Vous auriez notre conclusion avant de répondre. »",
      },
    ],
    question: "Que répondez-vous à l'extension ?",
    options: [
      {
        t: "Accepter l'extension : plus de volume, plus de remises",
        d: "Un entrepôt à Bourgoin en bail ferme de trois ans ; livraisons au printemps.",
      },
      {
        t: "Refuser : Sarlève pèserait plus d'un quart de la région",
        d: "Rien à engager. Sarlève Dauphiné se fournira ailleurs.",
      },
      {
        t: "Faire analyser le carnet et les comptes de Sarlève, et n'accepter que si la conclusion est bonne",
        d: "6 k€ et deux semaines ; la réponse à Sarlève attendra le rapport.",
      },
    ],
    reactions: [
      [
        {
          ...ELIOTT,
          texte: "Parfait. Je visite deux entrepôts à Bourgoin la semaine prochaine.",
        },
      ],
      [
        {
          ...WEN,
          texte:
            "C'est noté. Sarlève restera sous le quart du chiffre d'affaires de la région, s'il reste chez nous.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le chantier des Vergnes est suspendu",
    jusqua: 10,
    messages: (ctx) =>
      avecContrat(ctx)
        ? [
            {
              ...NADIR,
              heure: "08:20",
              alerte: true,
              texte:
                "Sarlève suspend le chantier de la ZAC des Vergnes, à Décines : 140 logements, le promoteur cherche un nouveau financement. Six mois au moins. Une partie du stock dédié était prête pour lui.",
            },
            {
              ...WEN,
              heure: "09:30",
              texte:
                "L'agence de notation qui suit les entreprises du BTP vient de dégrader la note de Sarlève d'un cran : « carnet de commandes en baisse sur le logement neuf ».",
            },
            {
              ...ELIOTT,
              heure: "11:00",
              texte:
                "Un chantier suspendu, ça arrive tous les ans. On a signé pour trois ans : on garde le stock pour la reprise des Vergnes et la cellule au complet. Sarlève doit voir qu'on est solides.",
            },
          ]
        : [
            {
              ...NADIR,
              heure: "08:20",
              alerte: true,
              texte:
                "Sarlève suspend le chantier de la ZAC des Vergnes, à Décines. Lestrade a une partie de son stock dédié sur les bras. Rien de notre côté.",
            },
            {
              ...WEN,
              heure: "09:30",
              texte:
                "L'agence de notation qui suit les entreprises du BTP a dégradé la note de Sarlève d'un cran.",
            },
          ],
    sources: [
      {
        id: "signal",
        titre: "Mesurer ce que le signal change pour l'engagement",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          avecContrat(ctx)
            ? `Les Vergnes, c'est 8 % du volume de l'année et 15 % du stock dédié${
                ctx.stockDedie ? ` (${ctx.stockVergnes} sur ${ctx.stockDedie})` : ""
              }. La note dégradée confirme le risque qu'on connaissait : le carnet de décembre dira si l'activité tient. Si elle recule, le volume de Sarlève baisse, pas la cellule (150 k€ par an) ni le stock dédié. Réviser maintenant : ramener la cellule au volume réel, jamais sous 60 % ; réapprovisionner sur les commandes fermes ; rendre aux fabricants le stock des Vergnes, à 10 % de frais de retour. Si l'activité tient, la réorganisation aura coûté 10 k€, et la cellule reviendra à son effectif.${
                ctx.clauses
                  ? " Le volume minimal garanti protège la marge, pas les coûts de la cellule."
                  : ""
              }`
            : "Aucun contrat : le signal ne change rien pour Arvel, sinon qu'il dit ce qu'aurait coûté une exclusivité sans clause.",
      },
      {
        id: "directeur",
        titre: "Appeler le directeur financier de Sarlève",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Il parle d'un « décalage de programmes » et d'un carnet « solide à dix-huit mois », et refuse de donner des chiffres avant la publication de décembre. Il rappelle que les volumes du contrat sont indicatifs.",
      },
    ],
    question: "Que faites-vous de l'engagement pris avec Sarlève ?",
    options: [
      {
        t: "Tenir le cap : un chantier suspendu ne change pas un contrat de trois ans",
        d: "Le stock reste en rayon pour la reprise des Vergnes, la cellule au complet.",
      },
      {
        t: "Réviser l'engagement : la cellule au volume réel, le stock sur les commandes fermes, le stock des Vergnes rendu aux fabricants",
        d: "10 k€ de réorganisation et 10 % de frais de retour ; le dispositif suit le volume de Sarlève.",
      },
      {
        t: "Rendre le stock des Vergnes et geler les réassorts, sans toucher à la cellule",
        d: "10 % de frais de retour ; la cellule reste au complet.",
      },
    ],
    reactions: [
      [
        {
          ...ELIOTT,
          texte: "Bien. On ne lâche pas un client de trois ans au premier coup de vent.",
        },
      ],
      [
        {
          ...NADIR,
          texte:
            "Je préviens Sarlève : nous suivons leurs commandes fermes semaine par semaine, et la cellule suivra leur volume. Un préparateur repart en agence lundi.",
        },
      ],
      [
        {
          ...OUMOU,
          texte: "Le stock des Vergnes repart chez les fabricants jeudi. Le reste ne bouge pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La revue annuelle des prix",
    jusqua: 13,
    messages: (ctx) =>
      avecContrat(ctx)
        ? [
            {
              ...AUGUSTIN,
              heure: "09:15",
              alerte: true,
              texte: ctx.clauses
                ? "Monsieur Lefranc, pour la revue annuelle : Lestrade nous propose un point de moins que vos prix. Je sais que la clause d'indexation fixe la révision, mais je vous demande un geste pour les deux années qui restent."
                : "Monsieur Lefranc, pour la revue annuelle : Lestrade nous propose un point de moins que vos prix. Je vous demande de vous aligner pour les deux années qui restent. À défaut d'accord, le contrat permet à chacun de reprendre sa liberté.",
            },
            {
              ...ELIOTT,
              heure: "10:40",
              texte:
                "On ne peut pas perdre un quart de la région à trois mois de la clôture. Donne-lui son point, et n'en parlons plus.",
            },
            {
              ...WEN,
              heure: "15:00",
              texte: `Un point de prix sur les deux années qui restent, c'est ${ctx.baisse} de valeur, au taux du groupe.`,
            },
          ]
        : [
            {
              ...ELIOTT,
              heure: "09:15",
              alerte: true,
              texte:
                "Lestrade baisse ses prix chez nos artisans de l'Est lyonnais : le volume de Sarlève lui donne de la marge pour attaquer. Rien à négocier avec Sarlève de notre côté.",
            },
          ],
    sources: [
      {
        id: "position",
        titre: "Mesurer ce que la rupture coûterait à chacun",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          avecContrat(ctx)
            ? `Si Sarlève résiliait au terme de la première année, Arvel perdrait ${ctx.rupture} de valeur, tout compris : deux années de contribution, ${
                ctx.clauses
                  ? "le stock dédié repris par Sarlève au prix coûtant"
                  : "le stock dédié à écouler avec 35 % de décote"
              }, un Lestrade renforcé, moins la marge de Moulinier et Batival retrouvée plus tôt. Sarlève, lui, devrait monter une cellule chez Lestrade en pleine saison. ${
                ctx.clauses
                  ? "Avec la clause d'indexation, sa demande n'a pas de fondement contractuel : face à un échange, un groupe comme Sarlève résilie une fois sur vingt ; face à un refus sec, une fois sur cinq."
                  : "Sans clause d'indexation, la revue se fait d'un commun accord : face à un refus sec, un groupe comme Sarlève résilie un peu plus d'une fois sur deux ; face à un échange, trois fois sur dix."
              } Un engagement de volume ferme à 85 % garantirait la marge si l'activité recule.`
            : "Aucun contrat : rien à mesurer.",
      },
      {
        id: "lestrade",
        titre: "Vérifier l'offre de Lestrade",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Lestrade a bien remis une offre à Sarlève, mais sans cellule dédiée ni camion-grue, depuis un dépôt à vingt-cinq kilomètres des chantiers. Son point de prix en moins ne compte pas la logistique que Sarlève devrait reprendre à sa charge.",
      },
    ],
    question: "Que répondez-vous à la demande de baisse ?",
    options: [
      {
        t: "Accorder le point de baisse pour garder le contrat",
        d: "Un point de prix en moins sur les années 2 et 3 ; le contrat est sauf.",
      },
      {
        t: "Tenir les prix : la baisse demandée n'a pas lieu d'être",
        d: "Aucune baisse ; Sarlève peut résilier au terme de la première année.",
      },
      {
        t: "Proposer un échange : 0,4 point contre un engagement de volume ferme à 85 % sur deux ans",
        d: "Une baisse limitée contre un volume garanti ; Sarlève peut accepter ou résilier.",
      },
    ],
    reactions: [
      [
        {
          ...AUGUSTIN,
          texte: "Merci, Monsieur Lefranc. Je savais que nous trouverions un terrain d'entente.",
        },
      ],
      [
        {
          ...NADIR,
          texte:
            "Je transmets notre réponse à Sarlève. Delcourt doit en parler à sa direction générale.",
        },
      ],
      [
        {
          ...NADIR,
          texte:
            "Je transmets la proposition à Sarlève. Delcourt doit en parler à sa direction générale.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Chiffrer et borner la dépendance", chemin: [1, 2, 2, 2, 1, 2] },
  { nom: "Prendre le volume", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Refuser par principe", chemin: [3, 0, 0, 1, 0, 1] },
] as const;

/**
 * Les réflexes du directeur commercial devant un grand compte : signer le
 * volume tel quel, ou le refuser par principe ; immobiliser ce que le client
 * demande ; traiter les clients exclus par lettre ; prendre encore plus de
 * volume sans s'informer ; persister malgré le signal ; céder à la revue des
 * prix parce qu'on dépend du client. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  clausesAccepte:
    "Vos clauses sont dures, mais je les connais : nous avons signé les mêmes en Savoie. Va pour deux ans d'exclusivité, l'indexation, le volume minimal et la reprise du stock, contre un demi-point de prix. Nous signons vendredi.",
  clausesPlusTard:
    "Je dois consulter Lestrade sur vos clauses avant de signer quoi que ce soit. Je reviens vers vous d'ici un mois.",
  clausesLestrade:
    "Lestrade signe nos conditions sans discuter. Je le regrette, Monsieur Lefranc : nous partons avec eux.",
  sansExclusiviteAccepte:
    "Sans exclusivité, ce n'est pas notre modèle. Mais vos dépôts sont les mieux placés : va, contre un point de prix de plus.",
  sansExclusivitePlusTard:
    "L'exclusivité n'est pas un détail pour nous. Je consulte Lestrade, et je reviens vers vous d'ici un mois.",
  sansExclusiviteLestrade:
    "Nous ne voulons pas que nos concurrents profitent des mêmes dépôts et des mêmes conditions. Nous signons avec Lestrade.",
  signatureTardive:
    "Nous avons vu Lestrade : il n'a pas de dépôt à l'est de Lyon. Nous signons vos conditions, avec trois dixièmes de point de plus : c'est son devis.",
  analyseFavorable:
    "Notre conclusion : carnet de commandes solide, comptes sains, permis en ordre. Sarlève peut tenir le rythme annoncé. Vous pouvez accepter l'extension.",
  analyseDefavorable:
    "Notre conclusion : carnet en baisse sur le logement neuf, deux programmes sans financement, des permis qui tardent. Nous ne recommandons pas d'engager un entrepôt pour la filiale.",
  extensionSignee: "Sarlève Dauphiné signe : livraisons depuis Bourgoin à partir du printemps.",
  extensionRefusee:
    "Sarlève Dauphiné se fournira chez Lestrade. Le contrat principal n'est pas touché.",
  rupture:
    "Le stock de sécurité n'a pas suffi : un chantier de Sarlève a attendu ses menuiseries trois jours. 10 k€ de pénalités de retard.",
  pasDeRupture:
    "Le stock de sécurité a tenu : toutes les livraisons de Sarlève sont parties à l'heure.",
  conqueteReussie:
    "Les Bâtisseurs du Forez signent avec nous : environ 40 k€ de marge par an. La campagne a payé.",
  conqueteRatee:
    "La campagne n'a rien donné : les entreprises générales démarchées restent chez leurs fournisseurs. Les 30 k€ de remises d'accueil sont dépensés.",
  revueAccepte:
    "Ma direction générale accepte votre réponse. Nous continuons ensemble, aux conditions dites.",
  revueResilie:
    "Ma direction générale a tranché : faute d'accord, nous reprenons notre liberté au terme de la première année. Nous partons chez Lestrade.",
  carnet: [
    "Sarlève publie son carnet de commandes : dix-huit mois de travaux, stable. Son activité tiendra le rythme annoncé.",
    "Sarlève publie son carnet de commandes : en baisse sur le logement neuf. Son activité devrait se tasser d'un quart l'an prochain.",
    "Sarlève publie son carnet de commandes : en net recul, trois programmes abandonnés. Son activité devrait reculer de moitié l'an prochain.",
  ],
} as const;
