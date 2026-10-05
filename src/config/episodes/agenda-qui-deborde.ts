/**
 * L'AGENDA QUI DÉBORDE — le contenu de l'épisode.
 *
 * Clovis Lemaistre dirige l'agence Arvel Distribution de Genas, agrandie
 * l'an dernier : deux adjoints, douze personnes, et un directeur par qui tout
 * passe. Il travaille soixante heures par semaine, les dossiers attendent sa
 * signature, le drive n'avance pas, aucun entretien annuel n'est fait, et il
 * commence à se tromper. Six décisions, chacune précédée de ce qu'un
 * directeur d'agence reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "goulot",
    t: "Tout passe par vous : les dossiers attendent votre signature, et c'est l'attente qui coûte",
  },
  {
    id: "reunions",
    t: "Les réunions et les interruptions dévorent vos journées",
  },
  {
    id: "adjoints",
    t: "Vos adjoints ne sont pas au niveau : ils vous remontent tout",
  },
  {
    id: "effectif",
    t: "L'agence a grandi sans renfort : il manque une personne à l'encadrement",
  },
] as const;

const GWENAELLE = {
  de: "Gwenaëlle Kerjean",
  role: "Adjointe, responsable des ventes",
} as const;
const TARIQ = {
  de: "Tariq Lahlou",
  role: "Adjoint, responsable du dépôt",
} as const;
const HORTENSE = {
  de: "Hortense Valadier",
  role: "Directrice régionale",
} as const;
const MAELLE = { de: "Coralie Courtois", role: "Assistante d'agence" } as const;
const NAWEL = { de: "Nawel Hamidi", role: "Vendeuse comptoir" } as const;
const RODRIGUE = { de: "Rodrigue Ekambi", role: "Chef de cour" } as const;
const BILAL = { de: "Bilal Ouédraogo", role: "Technico-commercial" } as const;
const GASPARD = {
  de: "Gaspard Lhermitte",
  role: "Contrôleur de gestion régional",
} as const;
const MIREILLE = { de: "Mireille Dupuy", role: "Ressources humaines" } as const;
const TABLEAU = "Tableau de bord de l'agence";

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Soixante heures, et toujours en retard",
    jusqua: 2,
    messages: () => [
      {
        de: TABLEAU,
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte:
          "64 dossiers attendent votre signature (devis, remises, plannings, bons d'achat), depuis 3,9 jours en moyenne. Vos heures la semaine dernière : 61.",
      },
      {
        ...HORTENSE,
        heure: "08:15",
        texte:
          "Clovis, l'agrandissement devait faire de Genas la vitrine de la région. Le drive n'avance pas, aucun entretien annuel n'est fait, et Constructions Aubrac me dit qu'il attend son devis depuis huit jours. On en parle vendredi.",
      },
      {
        ...GWENAELLE,
        heure: "09:10",
        texte:
          "Trois devis prêts depuis jeudi sur ton bureau. Menuiserie Oberti a rappelé deux fois. Je leur dis quoi ?",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "agenda",
        titre: "Relever une semaine de votre agenda, heure par heure",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur 61 heures : 14 en réunions, 9 en interruptions (« tu as deux minutes ? »), 38 à signer 82 dossiers. Aucune heure sur le drive, aucun entretien annuel. Sept dossiers sur dix sont des devis de moins de 5 000 € ou des plannings que vos adjoints ont déjà préparés : vous les relisez, puis vous signez.",
      },
      {
        id: "attente",
        titre: "Mesurer ce qui attend sur votre bureau",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "64 dossiers en attente, depuis 3,9 jours en moyenne. Les devis signés en moins de deux jours se transforment à 58 % ; au-delà de trois jours, à 31 %. Les plannings validés après 16 heures obligent le dépôt à refaire les tournées du lendemain.",
      },
      {
        id: "adjoints",
        titre: "Écouter vos deux adjoints",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Gwenaëlle : « Je chiffre tous les devis, mais je ne peux pas accorder 3 % de remise sans toi. Les clients l'ont compris : ils t'appellent directement. » Tariq : « Les plannings, je les fais, tu les relis, je les refais. Personne ne m'a jamais dit jusqu'où je pouvais décider. »",
      },
      {
        id: "effectif",
        titre: "Comparer l'effectif aux agences de même taille",
        cout: 1,
        nature: "bruit",
        resultat:
          "14 personnes pour 6,1 M€ de chiffre d'affaires annuel : dans la moyenne des agences de la région, qui en comptent de 13 à 15. Aucune n'a plus d'encadrement.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Hortense Valadier",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Hortense : « Avant de travailler plus, regarde ce qui n'a pas besoin de passer par toi. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous pour reprendre la main ?",
    options: [
      {
        t: "Travailler plus : arriver à 6 h 30 et passer le samedi matin sur les dossiers",
        d: "Huit heures de plus par semaine pour vider la pile. Ne coûte rien à l'agence.",
      },
      {
        t: "Déléguer par paliers, avec un cadre écrit",
        d: "Gwenaëlle signe les devis jusqu'à 5 000 € et 5 % de remise, Tariq valide les plannings ; vous contrôlez un dossier sur cinq. Six heures par semaine pour les former, au début.",
      },
      {
        t: "Tout déléguer d'un coup : chaque adjoint signe ce qui relève de son secteur, dès lundi",
        d: "Votre bureau se vide tout de suite, sans temps de formation.",
      },
      {
        t: "Tenir : le rythme se calmera quand l'agrandissement sera digéré",
        d: "Rien ne change. L'équipe fait avec.",
      },
    ],
    reactions: [
      [
        {
          ...MAELLE,
          texte:
            "Vous étiez là à 6 h 30 ce matin. La pile baisse, mais Gwenaëlle et Tariq attendent toujours vos réponses pour les dossiers du jour.",
        },
      ],
      [
        {
          ...GWENAELLE,
          texte: "5 000 € et 5 %, c'est clair. Je t'apporte mes premiers devis à contrôler jeudi.",
        },
        {
          ...TARIQ,
          texte:
            "Si je valide les plannings, je ne les fais qu'une fois. On gagne une demi-journée.",
        },
      ],
      [
        {
          ...TARIQ,
          texte:
            "D'accord pour tout signer. Mais jusqu'où ? J'ai validé deux tournées qui se chevauchent ce matin, et personne pour me dire si c'était à moi de trancher.",
        },
      ],
      [
        {
          ...GWENAELLE,
          texte: "Oberti a rappelé. Je lui ai dit « en fin de semaine ». Pour la troisième fois.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "La réunion du lundi",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...NAWEL,
        heure: "12:40",
        alerte: true,
        texte:
          "La réunion de lundi a duré deux heures quarante. On était quatorze autour de la table, dont une heure sur les tournées du dépôt. Pendant ce temps, personne au comptoir, et six artisans qui attendaient.",
      },
      {
        ...RODRIGUE,
        heure: "16:05",
        texte: ctx.delegue
          ? "Tariq a validé le planning de lundi. Je repasse quand même te voir pour les deux tournées qu'il n'a pas osé trancher."
          : "Clovis, il me faut ton accord pour le planning de lundi. Je repasse dans une heure.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Dossiers en attente en fin de semaine 2 : ${ctx.file}, depuis ${ctx.delai} en moyenne. Vos heures cette semaine : ${ctx.heures}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "reunions",
        titre: "Compter le temps que l'agence passe en réunion",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La réunion du lundi : quatorze personnes pendant 2 h 30, soit 35 heures de travail par semaine ; la moitié des sujets ne concernent que deux ou trois personnes, sans ordre du jour ni décision écrite. S'y ajoutent vos rendez-vous fournisseurs (2 h) et la conférence régionale (3 h). Et on passe à votre bureau onze fois par jour pour une question « rapide ».",
      },
      {
        id: "delegation",
        titre: "Faire le point avec vos adjoints",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.cadre
            ? "Gwenaëlle a signé 31 devis cette semaine ; vous en avez contrôlé six, un seul à corriger. « La règle des 5 %, c'est simple : les clients ne t'appellent plus pour ça. »"
            : ctx.sansCadre
              ? "Les adjoints signent tout, sans savoir jusqu'où aller. Tariq vous renvoie un dossier sur deux « pour être sûr », et deux remises de 12 % sont parties sans que personne ne les voie."
              : "Rien n'a changé : tout passe encore par vous. Gwenaëlle : « Je prépare, tu signes. Comme avant. »",
      },
    ],
    question: "Que faites-vous des réunions ?",
    options: [
      {
        t: "Alléger : un point de quinze minutes debout chaque matin avec les adjoints, la réunion du lundi en 45 minutes avec un ordre du jour",
        d: "Les fournisseurs sont reçus par les adjoints. Sept heures de moins par semaine pour vous, et l'équipe au comptoir.",
      },
      {
        t: "Ajouter un point d'une heure chaque soir avec les adjoints pour tout reprendre",
        d: "Vous saurez tout ce qui se passe. Cinq heures de plus par semaine, pour vous et pour eux.",
      },
      {
        t: "Supprimer toutes les réunions internes : chacun vient vous voir quand il a besoin",
        d: "Neuf heures de libérées dans votre agenda.",
      },
      {
        t: "Garder le rythme actuel",
        d: "Les réunions sont là pour que tout le monde soit au courant.",
      },
    ],
    reactions: [
      [
        {
          ...NAWEL,
          texte:
            "Quarante-cinq minutes, un ordre du jour, et on sait qui fait quoi en sortant. Le comptoir n'a pas été vide une seule fois.",
        },
      ],
      [
        {
          ...TARIQ,
          texte:
            "Une heure chaque soir à te raconter la journée... Du coup, je finis mes plannings après 19 heures.",
        },
      ],
      [
        {
          ...RODRIGUE,
          texte:
            "Plus de réunion, d'accord. Mais maintenant tout le monde passe à ton bureau, et personne ne sait ce que le dépôt a prévu demain.",
        },
      ],
      [
        {
          ...NAWEL,
          texte: "Lundi prochain, même réunion. Je préviens les artisans qu'on ouvre à 10 h 30 ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le drive n'avance pas",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...HORTENSE,
        heure: "09:00",
        alerte: true,
        texte:
          "Clovis, l'ouverture du drive est annoncée aux clients pour la semaine 9 : le courrier est parti. Où en est le dossier ? Il me faut le plan de circulation et les consignes de sécurité avant la réception des travaux, en semaine 8.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "09:05",
        texte: `Projet du drive : ${ctx.projet} du travail fait. Dossiers en attente : ${ctx.file}. Vos heures cette semaine : ${ctx.heures}.`,
      },
    ],
    sources: [
      {
        id: "reste",
        titre: "Lister ce qui reste à faire pour ouvrir le drive",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Il reste 28 heures de travail : plan de circulation, consignes de sécurité, formation des quatre caristes au chargement en drive, signalétique, message aux clients. Rien n'est bloquant ; il manque quelqu'un qui y consacre du temps chaque semaine. Si rien n'est prêt en semaine 9, la région ouvrira quand même, et il faudra finir dans l'urgence.",
      },
      {
        id: "tariq",
        titre: "Demander à Tariq ce qu'il en pense",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Tariq : « Le drive, c'est ma cour et mes caristes. J'ai participé à l'ouverture d'une cour couverte à Vienne, comme chef d'équipe, jamais comme pilote. Si tu me le confies, il me faut une demi-heure avec toi chaque semaine. »${
            ctx.sansCadre
              ? " Il ajoute : « En ce moment, je signe tout le dépôt sans savoir jusqu'où aller. Je ne sais pas où je trouverais le temps. »"
              : ""
          }`,
      },
    ],
    question: "Comment faites-vous avancer le drive ?",
    options: [
      {
        t: "Bloquer deux demi-journées par semaine dans votre agenda, téléphone coupé",
        d: "Huit heures par semaine sur le projet, que vous pilotez. Autant de moins pour les dossiers.",
      },
      {
        t: "Confier le pilotage à Tariq, avec un point d'étape d'une demi-heure par semaine",
        d: "C'est sa cour et ses caristes. Il ne l'a jamais fait seul.",
      },
      {
        t: "Avancer le soir et le week-end, quand l'agence est calme",
        d: "Huit heures de plus par semaine, sans toucher aux journées.",
      },
      {
        t: "Le traiter quand les urgences seront réglées",
        d: "Les clients d'abord.",
      },
    ],
    reactions: [
      [
        {
          ...MAELLE,
          texte:
            "J'ai bloqué le mardi et le jeudi après-midi dans votre agenda. Je dis à tout le monde que vous n'êtes pas là.",
        },
      ],
      null,
      [
        {
          ...MAELLE,
          texte:
            "Votre mail sur le plan de circulation est parti dimanche à 23 h 40. Tariq l'a lu lundi à 6 heures.",
        },
      ],
      [
        {
          ...HORTENSE,
          texte: "Je note. La semaine 9 ne bougera pas : les clients ont reçu le courrier.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Les entretiens annuels",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...MIREILLE,
        heure: "10:30",
        alerte: true,
        texte:
          "Clovis, la campagne d'entretiens annuels se clôt en semaine 13. Pour l'agence de Genas : zéro sur quatorze. Je dois remonter les chiffres à la direction.",
      },
      {
        ...GWENAELLE,
        heure: "11:15",
        texte: ctx.cadre
          ? "Pour mon entretien, ça fait dix-huit mois. Maintenant que je signe une partie des devis, j'aimerais qu'on parle de la suite."
          : "Pour mon entretien, ça fait dix-huit mois. J'aimerais qu'on parle de ce que je fais ici, et de ce que je pourrais faire.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Dossiers en attente : ${ctx.file}. Vos heures cette semaine : ${ctx.heures}.`,
      },
    ],
    sources: [
      {
        id: "anciens",
        titre: "Relire les entretiens de l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Gwenaëlle y demandait « plus de responsabilités, et de pouvoir signer ». Trois vendeurs voulaient une formation aux nouveaux isolants, jamais organisée. Rodrigue signalait des plannings changés trois fois par semaine. Rien n'a été suivi : les quatorze entretiens avaient été faits en une journée, en décembre.",
      },
      {
        id: "regle",
        titre: "Demander aux ressources humaines comment les mener",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Mireille : « Le groupe recommande que chacun soit reçu par son responsable direct : pour les douze personnes des équipes, ce sont vos adjoints, à condition de les préparer. Compte une heure et demie par entretien, préparation comprise. »",
      },
    ],
    question: "Comment menez-vous les entretiens ?",
    options: [
      {
        t: "Les mener tous vous-même, deux par semaine, préparés, en commençant par vos adjoints",
        d: "Une heure et demie chacun, préparation comprise : trois heures par semaine jusqu'à la fin du trimestre.",
      },
      {
        t: "Les faire tous en une journée, en semaine 13, avec le formulaire",
        d: "Une demi-heure par personne. La campagne sera bouclée à temps.",
      },
      {
        t: "Recevoir vos deux adjoints cette semaine, et leur confier les entretiens de leurs équipes",
        d: "Une heure de préparation avec eux, une grille commune ; ils mènent les douze autres en trois semaines.",
      },
      {
        t: "Les reporter au trimestre prochain",
        d: "Il y a plus urgent. Les ressources humaines attendront.",
      },
    ],
    reactions: [
      [
        {
          ...GWENAELLE,
          texte:
            "Merci d'avoir commencé par moi. On a enfin parlé de ce que je pourrais prendre en charge.",
        },
      ],
      [
        {
          ...MIREILLE,
          texte: "Quatorze entretiens en une journée... La campagne sera bouclée, sur le papier.",
        },
      ],
      [
        {
          ...GWENAELLE,
          texte:
            "On a fait mon entretien hier. C'est la première fois qu'on parle de mon évolution.",
        },
        {
          ...TARIQ,
          texte:
            "Mener les entretiens de mes caristes, je ne l'ai jamais fait. Avec la grille et une heure de préparation, ça ira.",
        },
      ],
      [
        {
          ...GWENAELLE,
          texte: "Encore reporté. D'accord.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le devis Aubrac",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...GASPARD,
        heure: "09:20",
        alerte: true,
        texte: `Clovis, le devis de Constructions Aubrac pour la résidence des Tilleuls est parti presque sans marge : ${
          ctx.cadre
            ? "4 300 € perdus. Signé par Gwenaëlle, dans son seuil : le chantier avait été découpé en quatre devis de moins de 5 000 €."
            : ctx.sansCadre
              ? "5 200 € perdus. Signé par Gwenaëlle, avec 15 % de remise."
              : "4 100 € perdus. Signé par vous mardi à 21 h 50, au tarif de l'an dernier."
        }`,
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Erreurs de décision depuis le début du trimestre : ${ctx.erreursCumul}. Dossiers en attente : ${ctx.file}. Vos heures cette semaine : ${ctx.heures}.`,
      },
    ],
    sources: [
      {
        id: "cause",
        titre: "Reprendre le dossier avec la personne qui l'a signé",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.cadre
            ? "La règle disait « 5 000 € par devis », pas « par chantier ». Gwenaëlle : « Le client voulait une réponse le jour même, tu étais en réunion. J'ai découpé pour rester dans les clous. » Un double regard au-delà de 15 000 € par chantier aurait suffi. Le reste de ses devis est juste."
            : ctx.sansCadre
              ? "Gwenaëlle : « Personne ne m'a dit jusqu'où je pouvais aller. Le client menaçait de partir, j'ai accordé ce qu'il demandait. » Sur le mois, onze remises dépassent 10 %, toutes accordées sans règle."
              : "Vous l'avez signé entre deux dossiers, après 21 heures, sans voir que la grille tarifaire avait changé. Sur le mois, sept de vos erreurs sur dix ont été signées après 19 heures.",
      },
      {
        id: "erreurs",
        titre: "Compter les erreurs du trimestre",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `${ctx.erreursCumul} erreurs de décision depuis la semaine 1 : remises de trop, mauvais tarifs, livraisons en double.${
            ctx.epuise
              ? " À la visite de mardi, le médecin du travail vous a trouvé « épuisé » et vous a demandé de lever le pied."
              : ""
          }`,
      },
    ],
    question: "Comment réagissez-vous à l'erreur ?",
    options: [
      {
        t: "Reprendre vous-même la signature de tous les devis, sans exception",
        d: "Plus rien ne part sans votre visa.",
      },
      {
        t: "Chercher la cause avec la personne qui a signé, et ajouter une règle : un double regard au-delà de 15 000 € par chantier",
        d: "Une heure à deux, une règle de plus, et chacun continue de signer ce qui est à lui.",
      },
      {
        t: "Relire tout ce que signent vos adjoints avant envoi",
        d: "Ils continuent de signer ; vous relisez tout, le soir.",
      },
      {
        t: "Passer à autre chose : une erreur, ça arrive",
        d: "Le client est prévenu, le devis corrigé.",
      },
    ],
    reactions: [
      [
        {
          ...GWENAELLE,
          texte: "Bien compris : plus rien ne part sans ta signature. Je préviens les clients.",
        },
      ],
      [
        {
          ...GWENAELLE,
          texte:
            "La règle des 15 000 € par chantier, c'est clair. Merci d'avoir cherché la cause avec moi plutôt que de tout reprendre.",
        },
      ],
      [
        {
          ...TARIQ,
          texte:
            "Si tu relis tout, à quoi ça sert que je signe ? Je t'envoie mes plannings, tu me diras.",
        },
      ],
      [
        {
          ...GASPARD,
          texte: "Je passe l'avoir. Si la cause n'est pas traitée, on la reverra.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "L'appel d'offres du groupe scolaire",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...BILAL,
        heure: "08:40",
        alerte: true,
        texte:
          "Clovis, la mairie lance l'appel d'offres pour les fournitures du nouveau groupe scolaire : 60 000 € de matériaux, livraisons dès la semaine 12. Remise des offres vendredi prochain. Les deux négoces concurrents répondent.",
      },
      {
        ...HORTENSE,
        heure: "09:30",
        texte: ctx.drive
          ? "C'est exactement le type de marché que le drive doit nous apporter. Qui le monte ?"
          : "C'est le type de marché que le drive devait nous apporter. Qui le monte ?",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Dossiers en attente : ${ctx.file}. Vos heures cette semaine : ${ctx.heures}.`,
      },
    ],
    sources: [
      {
        id: "marche",
        titre: "Lire le cahier des charges avec Bilal",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Douze heures de travail : des prix ligne à ligne sur 140 références, un planning de livraison, des échantillons. Le prix compte pour 60 %. Bilal : « Celle qui connaît nos prix nets et les artisans du chantier, c'est Gwenaëlle : elle chiffre leurs devis depuis deux ans. »${
            ctx.autonome
              ? " Elle signe seule une grande partie des devis de l'agence depuis deux mois."
              : " Elle n'a jamais décidé seule d'un prix."
          }`,
      },
      {
        id: "historique",
        titre: "Regarder les derniers appels d'offres de l'agence",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'agence a répondu à deux marchés l'an dernier, montés par le directeur dans l'urgence : perdus tous les deux, sur le prix des isolants, que les vendeurs connaissaient mieux que lui.",
      },
    ],
    question: "Qui monte l'offre ?",
    options: [
      {
        t: "La monter vous-même, le soir et le samedi",
        d: "Douze heures en deux semaines, en plus de vos journées.",
      },
      {
        t: "La confier à Gwenaëlle, avec un cadre : vous fixez le prix plancher et relisez la stratégie",
        d: "Deux heures avec elle. Une partie de ses devis vous revient pendant une semaine.",
      },
      {
        t: "La monter vous-même, sur vos heures de bureau",
        d: "Douze heures en deux semaines, prises sur les dossiers.",
      },
      {
        t: "Ne pas répondre cette fois",
        d: "L'agence a assez à faire.",
      },
    ],
    reactions: [
      [
        {
          ...MAELLE,
          texte: "L'offre est partie jeudi à 23 heures. Vous avez dormi, cette semaine ?",
        },
      ],
      [
        {
          ...GWENAELLE,
          texte:
            "Le prix plancher est noté. Je connais les artisans du chantier : je sais où on peut être meilleurs que les autres.",
        },
      ],
      [
        {
          ...MAELLE,
          texte:
            "Vous êtes enfermé avec le dossier. Quatre personnes attendent devant votre porte.",
        },
      ],
      [
        {
          ...BILAL,
          texte:
            "Dommage. Le négoce de la zone industrielle a déjà affiché le marché dans son agence.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  {
    nom: "Déléguer avec un cadre, protéger l'important",
    chemin: [1, 0, 1, 2, 1, 1],
  },
  { nom: "Travailler plus, tout contrôler", chemin: [0, 1, 2, 1, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du directeur débordé — travailler plus, tout contrôler, ou
 * tout lâcher sans cadre : [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 1],
  [2, 2],
  [3, 1],
  [4, 0],
  [4, 2],
  [5, 0],
] as const;

export const REPONSES = {
  tariqSur:
    "Je prends. Je connais la cour par cœur, et mes caristes me suivront. Tu auras le plan de circulation dans deux semaines.",
  tariqSerre:
    "Je prends. Ce sera serré pour la signalétique et la formation des caristes, mais j'y arriverai.",
  tariqHesitant:
    "Je prends, mais je te le dis franchement : les consignes de sécurité et la commission, je ne l'ai jamais fait. J'apprendrai en marchant.",
  pointTariqOk:
    "Point d'étape : plan de circulation validé, caristes formés la semaine prochaine. On sera prêts en semaine 8.",
  pointTariqRetard:
    "Point d'étape : je suis en retard. Les consignes de sécurité m'ont pris deux fois plus que prévu, et la signalétique n'est pas commandée. On ne sera pas prêts pour la semaine 9.",
  crise:
    "Le drive a ouvert lundi comme annoncé, et rien n'était prêt : des artisans sont repartis sans charger, les caristes ont fait des heures. Clovis, il me faut ce dossier bouclé cette semaine.",
  ouverture: "Le drive tourne : quarante artisans chargés le premier jour, dix minutes chacun.",
  arret:
    "Votre médecin vous arrête une semaine. Les dossiers qui vous attendent s'empilent ; Hortense ne signe que les urgences.",
  depart:
    "Clovis, j'ai accepté un poste de responsable d'agence chez un concurrent. Je pars à la fin du trimestre. Je voulais des responsabilités : je les ai trouvées ailleurs.",
  offreGagnee: "Le groupe scolaire nous a retenus ! Premières livraisons lundi.",
  offrePerdue:
    "Le groupe scolaire a choisi un concurrent, moins cher de 3 % sur les plaques et les isolants.",
  sansReunion:
    "Deux tournées sont parties ce matin avec le même camion : personne ne savait que l'autre était prévue.",
  entretiensPortes:
    "Mes cinq entretiens sont faits. Rodrigue veut se former au pilotage du drive, et deux caristes proposent de revoir l'ordre de chargement. J'ai de quoi faire.",
  entretiensSubis:
    "Mes entretiens sont faits. Honnêtement, je ne savais pas quoi leur promettre : je ne décide de rien.",
} as const;
