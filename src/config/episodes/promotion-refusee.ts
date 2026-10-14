/**
 * LA PROMOTION QU'IL FAUDRA REFUSER — le contenu de l'épisode.
 *
 * Noé Akintola dirige une équipe de douze consultants de la practice
 * Performance opérationnelle, au bureau de Paris d'Atlas Conseil. D'octobre à
 * décembre : les entretiens annuels, puis le comité de promotion. Trois
 * seniors visent le grade de manager, il n'y a qu'une place, et le plus
 * apprécié des trois n'est pas prêt à encadrer. Six décisions, chacune
 * précédée de ce qu'un directeur reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle : le test de l'épisode les recalcule.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "criteres",
    t: "Rien n'est écrit : sans critères explicites ni faits de l'année, le comité suivra les soutiens, et la décision sera indéfendable devant ceux qui ne passeront pas",
  },
  {
    id: "annonce",
    t: "Le vrai risque est de perdre les deux seniors qui ne seront pas promus : c'est l'annonce qu'il faut soigner",
  },
  {
    id: "elric",
    t: "Elric est le plus apprécié des clients et de l'équipe : le perdre serait le pire, il faut le faire promouvoir",
  },
  {
    id: "places",
    t: "Une place pour trois bons seniors : la pyramide du bureau est trop étroite, il faut obtenir une deuxième place",
  },
] as const;

const EWA = { de: "Ewa Mazurier", role: "Associée, responsable du bureau de Paris" } as const;
const ELRIC = { de: "Elric Mérindol", role: "Consultant senior" } as const;
const TAHINA = { de: "Tahina Rakotoarisoa", role: "Consultante senior" } as const;
const VASCO = { de: "Vasco Tanneau", role: "Consultant senior" } as const;
const BATHILDE = {
  de: "Bathilde Sarrail",
  role: "Directrice, practice Data, bureau de Paris",
} as const;
const WASSILA = {
  de: "Wassila Mokrane",
  role: "Manager, practice Performance opérationnelle",
} as const;
const SEVERINE = { de: "Séverine Le Duigou", role: "Responsable RH, bureau de Paris" } as const;

const texte = (v: Contexte[string] | undefined) => String(v ?? "");

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Une place pour trois",
    jusqua: 2,
    messages: () => [
      {
        ...EWA,
        heure: "08:10",
        alerte: true,
        texte:
          "Noé, la campagne d'évaluation s'ouvre ce matin, pour le trimestre d'octobre à décembre. Le comité de promotion du bureau se réunit le jeudi de la semaine 6. Pour ta practice, une seule place de manager cette année : la pyramide n'en supporte pas davantage. Tes trois seniors sont candidats. J'attends ton dossier en semaine 5.",
      },
      {
        ...ELRIC,
        heure: "09:20",
        texte:
          "Noé, je ne vais pas tourner autour : cette année, c'est la bonne pour moi. Brévallon m'a encore redemandé nommément pour la phase 2.",
      },
      {
        ...BATHILDE,
        heure: "11:45",
        texte:
          "Je te préviens par amitié : je porterai Vasco au comité. Huit mois sur ma mission, il l'a mérité.",
      },
      {
        ...WASSILA,
        heure: "12:30",
        texte:
          "Tu sais que tout le bureau adore Elric ? Si tu ne le fais pas passer, on risque de le perdre. Halden l'appelle tous les trois mois.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "faits",
        titre: "Relire dans Tempora les évaluations de fin de mission des trois candidats",
        cout: 1,
        nature: "decisive",
        resultat:
          "Tahina a piloté deux missions comme manager de fait : taux de réalisation de 98 % et 101 %, et les analystes qu'elle a encadrés demandent à retravailler avec elle. Vasco a co-piloté une mission dans l'équipe de Bathilde, où le budget restait à la manager : évaluations solides sur l'analyse, aucun retour d'analyste. Elric a la meilleure satisfaction client du bureau, 4,8 sur 5 sur ses trois missions ; mais la seule qu'il a co-pilotée a fini à 84 % de taux de réalisation, 22 jours de dépassement sur le forfait, et deux analystes ont demandé à ne plus être staffés avec lui. Il n'a jamais construit un budget ni négocié un avenant.",
      },
      {
        id: "depart",
        titre: "Demander au contrôle de gestion ce qu'a coûté le dernier départ d'un senior",
        cout: 1,
        nature: "decisive",
        resultat:
          "Rahel Tesfaye reprend le départ de mars. Les honoraires du cabinet de recrutement : 20 % du salaire annuel brut, qui est de 62 k€ pour un senior. Douze semaines de vacance avant l'arrivée de la remplaçante, pendant lesquelles le bureau a perdu la contribution d'un senior : 210 jours ouvrés par an à 75 % d'occupation et 1 000 € de TJM, moins son salaire chargé (62 k€ brut et 45 % de charges), soit 1 300 € par semaine sur 52 semaines. Puis vingt jours facturables de moins pendant l'intégration de la remplaçante, au TJM d'un senior.",
      },
      {
        id: "promotions",
        titre: "Demander à Ewa comment se sont passées les dernières promotions",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Sur les quatre derniers dossiers arrivés au comité sans grille écrite, trois sont allés au candidat qu'un second directeur soutenait. Et les deux managers promus sans avoir jamais piloté de mission nous ont coûté chacun environ 60 k€ la première année : des forfaits dépassés, et un analyste parti. »",
      },
      {
        id: "salaires",
        titre: "Comparer leur rémunération au marché avec l'étude annuelle",
        cout: 1,
        nature: "bruit",
        resultat:
          "Les trois sont dans la médiane parisienne des consultants seniors en conseil en management, à 2 % près. Rien ne les distingue l'un de l'autre.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Yvain Quillévéré, associé fondateur, à Nantes",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Yvain : « Un comité se gagne avant le comité, avec des faits, pas avec de l'affection. Et pense dès maintenant à ce que tu diras aux deux qui ne passeront pas : c'est là qu'on les perd. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment préparez-vous le comité de promotion ?",
    options: [
      {
        t: "Porter la candidature d'Elric : c'est le plus apprécié, et le perdre coûterait cher",
        d: "Un dossier centré sur lui, ses retours clients en tête. Ne prend pas de temps.",
      },
      {
        t: "Écrire la grille du grade de manager et rassembler les faits de l'année pour les trois : fins de mission, budgets pilotés, retours des analystes",
        d: "Quatre jours de votre temps hors mission sur deux semaines, soit 5 200 € non facturés.",
      },
      {
        t: "Demander à chacun une auto-évaluation écrite, et la transmettre au comité",
        d: "Une journée de chaque senior hors mission, soit 3 000 € non facturés.",
      },
      {
        t: "Présenter les trois comme chaque année : trois très bons seniors, au comité de choisir",
        d: "Le dossier habituel, une page par candidat. Rien à engager.",
      },
    ],
    reactions: [
      [
        {
          ...EWA,
          texte:
            "Ton dossier sur Elric est bien reçu, et très flatteur. Ceux de Tahina et de Vasco tiennent en trois lignes.",
        },
      ],
      [
        {
          ...WASSILA,
          texte:
            "Je t'ai envoyé mes retours sur Tahina et Elric, avec les chiffres des deux missions. Une heure de travail : on devrait le faire toute l'année.",
        },
      ],
      [
        {
          ...VASCO,
          texte:
            "J'ai rempli l'auto-évaluation. Difficile de savoir ce qu'on attend de nous : il n'y a pas de grille.",
        },
      ],
      [
        {
          ...EWA,
          texte: "Noté : trois pages, trois candidats excellents. Le comité fera son travail.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les entretiens annuels",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...SEVERINE,
        heure: "09:00",
        texte:
          "Rappel : les entretiens annuels sont à faire avant la fin de la semaine 4 et à saisir dans Tempora. Ce sont eux que le comité relira.",
      },
      {
        ...ELRIC,
        heure: "14:40",
        alerte: true,
        texte:
          "On se voit mardi pour mon entretien ? J'aimerais savoir où tu en es pour le comité. Je ne te cache pas que Halden m'a rappelé.",
      },
      {
        de: "Tempora",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Occupation de l'équipe cette semaine : ${texte(ctx.occupation)}. Engagement moyen des trois candidats au baromètre : ${texte(ctx.engagement)}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "grille",
        titre: "Relire la grille du grade de manager du cabinet",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Quatre critères : piloter une mission et son budget, avec un taux de réalisation d'au moins 95 % ; encadrer et faire progresser une équipe ; développer le client, avant-vente et avenants ; contribuer au cabinet. Un candidat doit avoir démontré les deux premiers sur au moins une mission complète. ${
            ctx.faits
              ? "Votre dossier les documente pour chacun des trois."
              : "Vous n'avez pas les faits pour les documenter : les entretiens en resteront aux impressions."
          }`,
      },
      {
        id: "cafe",
        titre: "Prendre un café avec Elric avant son entretien",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Il est sûr d'être prêt : « les clients me demandent ». Il ne sait pas que deux analystes ont demandé à ne plus travailler avec lui ; personne ne le lui a dit.",
      },
    ],
    question: "Comment menez-vous les entretiens des trois candidats ?",
    options: [
      {
        t: "Assurer Elric de votre soutien au comité, pour qu'il ne parte pas",
        d: "Il saura qu'il peut compter sur vous. Les deux autres auront un entretien classique.",
      },
      {
        t: "Dire à chacun, faits à l'appui, où il en est sur chaque critère du grade, et ce qui lui manque",
        d: "Des entretiens plus longs et plus difficiles, surtout avec Elric.",
      },
      {
        t: "Rester neutre : « c'est le comité qui décidera »",
        d: "Des entretiens sans surprise.",
      },
      {
        t: "Reporter les entretiens des trois candidats après le comité, pour ne rien préjuger",
        d: "Les entretiens glissent en décembre.",
      },
    ],
    reactions: [
      [
        { ...ELRIC, texte: "Merci, Noé. Ça compte beaucoup. Je ne regarde plus ailleurs." },
        {
          ...TAHINA,
          texte: "On m'a dit que tu soutenais Elric. Je me demande à quoi a servi mon année.",
        },
      ],
      [
        {
          ...ELRIC,
          texte:
            "Personne ne m'avait parlé des analystes. C'est dur à entendre. Mais au moins je sais où j'en suis.",
        },
        {
          ...TAHINA,
          texte:
            "C'est la première fois qu'un entretien me dit précisément ce qu'on attend de moi.",
        },
      ],
      [{ ...TAHINA, texte: "Le comité décidera, d'accord. Mais sur quoi ?" }],
      [
        {
          ...SEVERINE,
          texte: "Les trois entretiens sont reportés en décembre. Tempora les marque en retard.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "La note au comité",
    jusqua: 6,
    messages: () => [
      {
        ...EWA,
        heure: "10:15",
        alerte: true,
        texte:
          "Le comité se tient jeudi en huit. Il me faut ta note avant mardi : ta recommandation, et ce qui la fonde.",
      },
      {
        ...BATHILDE,
        heure: "16:50",
        texte:
          "Noé, et si on s'arrangeait ? Je pousse Vasco cette année, je soutiens ton Elric l'an prochain. On sort du comité contents tous les deux.",
      },
    ],
    sources: [
      {
        id: "calibrage",
        titre: "Demander à Ewa comment le comité tranchera",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Huit directeurs, cinq places pour tout le bureau. « Ceux qui arrivent avec des faits, critère par critère, emportent la décision. Sinon, on suit celui qui parle le plus fort, et Bathilde parlera fort. » ${
            ctx.faits
              ? "Votre dossier documente les quatre critères pour les trois candidats."
              : "Votre dossier, lui, tient en impressions."
          }`,
      },
      {
        id: "echange",
        titre: "Sonder Bathilde sur son échange",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Elle ne peut rien garantir pour l'an prochain : le comité aura d'autres candidats, et de nouveau une seule place pour votre practice. « Disons que je ferai de mon mieux. »",
      },
    ],
    question: "Que portez-vous au comité ?",
    options: [
      {
        t: "Défendre Elric de toutes vos forces : ses clients, et le risque de le perdre",
        d: "Une journée pour écrire une note centrée sur lui, soit 1 300 € non facturés.",
      },
      {
        t: "Présenter les trois critère par critère, faits à l'appui, et recommander Tahina",
        d: "Une journée pour écrire la note, soit 1 300 € non facturés.",
      },
      {
        t: "Accepter l'échange avec Bathilde : Vasco cette année, Elric l'an prochain, et le dire à Elric",
        d: "Bathilde doit encore dire oui.",
      },
      {
        t: "Transmettre les dossiers sans recommandation : au comité de calibrer",
        d: "Rien de plus à écrire.",
      },
    ],
    reactions: [
      [{ ...EWA, texte: "Ta note sur Elric est très convaincue. On en parlera jeudi." }],
      [{ ...EWA, texte: "Ta note est la plus documentée du bureau. Merci." }],
      null,
      [{ ...EWA, texte: "Reçu. Sans recommandation, le comité calibrera seul." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le comité a tranché",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...EWA,
        heure: "08:30",
        alerte: true,
        texte: `Le comité a retenu ${texte(ctx.promuNom)}. Le courriel du bureau annoncera les promotions lundi à midi, comme chaque année, sauf si tu préfères l'annoncer toi-même avant.`,
      },
      {
        de: texte(ctx.premierNom),
        role: texte(ctx.premierRole),
        heure: "09:10",
        texte: `Noé, le comité a fini hier soir, j'ai cru comprendre. ${
          ctx.promis
            ? "Tu m'avais dit que l'an prochain serait le mien. C'est toujours vrai ?"
            : "Tu passes me voir ?"
        }`,
      },
    ],
    sources: [
      {
        id: "nonretenus",
        titre: "Demander à Séverine ce que sont devenus les non-retenus des deux dernières années",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Six non-retenus en deux ans à Paris. Les trois qui l'ont appris par le courriel du bureau sont partis dans les six mois. Des trois reçus en face par leur directeur, avec un plan de progression écrit et une date de réexamen, un seul est parti.",
      },
      {
        id: "promesses",
        titre: "Demander à Ewa ce que deviennent les promesses de promotion",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Trois promesses de promotion faites à Paris en quatre ans. Deux n'ont pas été tenues : le comité avait d'autres dossiers. Les deux consultants sont partis dans les six mois. Un directeur ne promet pas ce que le comité décide. »",
      },
    ],
    question: "Comment annoncez-vous la décision aux deux non-retenus ?",
    options: [
      {
        t: "Laisser partir le courriel du bureau lundi, et recevoir ceux qui le demandent",
        d: "La procédure habituelle. Rien à préparer.",
      },
      {
        t: "Recevoir chacun des deux en face dès lundi matin : la décision, les critères qui ont manqué, un plan de progression écrit et une date de réexamen en juin",
        d: "Une journée de préparation et d'entretiens, soit 1 300 € non facturés.",
      },
      {
        t: "Attendre la mi-décembre pour l'annoncer, quand les missions en cours seront livrées",
        d: "Le courriel du bureau est retenu jusque-là. Personne n'est déstabilisé chez les clients.",
      },
      {
        t: "Promettre au plus déçu des deux qu'il sera promu l'an prochain",
        d: "Une conversation en face, et un engagement pour le comité de l'an prochain.",
      },
    ],
    reactions: [
      [
        {
          ...WASSILA,
          texte: "Le courriel est parti à midi. Le plateau a été très silencieux cet après-midi.",
        },
      ],
      [
        {
          ...WASSILA,
          texte:
            "Tu les as reçus tous les deux avant midi. Ils sont déçus, mais ils savent pourquoi, et ce qu'ils ont à faire d'ici juin.",
        },
      ],
      [
        {
          ...WASSILA,
          texte:
            "Le bruit court déjà : quelqu'un a vu la liste dans le compte rendu du comité. Les deux attendent toujours que tu leur parles.",
        },
      ],
      [
        {
          ...EWA,
          texte:
            "Tu as promis la promotion de l'an prochain ? Noé, ce n'est pas toi qui la donnes : le comité aura d'autres dossiers.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "La demande de compensation",
    jusqua: 10,
    messages: (ctx) => [
      {
        de: texte(ctx.premierNom),
        role: texte(ctx.premierRole),
        heure: "17:30",
        alerte: true,
        texte:
          "J'ai réfléchi. Je reste si mon année est reconnue : 8 % d'augmentation, hors grille. Halden Partners m'en propose quinze.",
      },
      {
        ...SEVERINE,
        heure: "18:05",
        texte:
          "Rappel : les révisions de janvier se font dans la grille, par grade, dans une enveloppe de 3 %.",
      },
      {
        de: "Tempora",
        role: "Point hebdomadaire",
        heure: "18:30",
        texte: `Engagement de ${texte(ctx.premierNom)} au baromètre : ${texte(ctx.engagementPremier)}. Engagement de ${texte(ctx.secondNom)} : ${texte(ctx.engagementSecond)}.`,
      },
    ],
    sources: [
      {
        id: "remuneration",
        titre: "Relire avec Séverine les règles de rémunération",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les augmentations sont visibles des managers dans Tempora : le coût des ressources sert au staffing. L'an dernier, deux ajustements hors grille ont été connus de tout le bureau en un mois, et quatre seniors ont demandé un rattrapage. Huit pour cent sur un salaire de senior de 62 k€ brut, c'est 7,2 k€ par an charges comprises ; un rattrapage de 4 % pour deux autres seniors coûterait autant.",
      },
      {
        id: "plan",
        titre: "Demander à Wassila ce que demande un vrai plan de progression",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Une formation au pilotage de mission, 2 800 €. Un co-pilotage avec moi dès janvier, un point par mois, et le réexamen en juin sur la grille. Après un refus, on ne demande pas d'abord de l'argent : on demande à savoir qu'on a un chemin. »",
      },
    ],
    question: "Que lui répondez-vous ?",
    options: [
      {
        t: "Lui accorder les 8 % hors grille, pour le garder",
        d: "7,2 k€ par an, charges comprises.",
      },
      {
        t: "Appliquer la grille, et financer son plan de progression : la formation au pilotage de mission, un co-pilotage dès janvier, le réexamen en juin",
        d: "2 800 € de formation ; l'augmentation de son grade, dans l'enveloppe.",
      },
      {
        t: "Lui verser discrètement une prime exceptionnelle de 5 000 €",
        d: "7,3 k€ charges comprises, sur la paie de novembre.",
      },
      {
        t: "Refuser : la grille est la grille, il n'y a rien à discuter",
        d: "Rien à engager.",
      },
    ],
    reactions: [
      [
        {
          ...SEVERINE,
          texte:
            "Je saisis l'augmentation. Elle apparaîtra dans Tempora au 1er janvier, avec le nouveau coût de ressource.",
        },
      ],
      [
        {
          ...WASSILA,
          texte:
            "J'ai inscrit la formation et calé le co-pilotage de janvier. On fait le point en juin.",
        },
      ],
      [
        {
          ...SEVERINE,
          texte: "La prime partira sur la paie de novembre, sans mention particulière.",
        },
      ],
      [{ ...SEVERINE, texte: "Noté. Je lui confirme les règles par écrit ?" }],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La prise de poste",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...EWA,
        heure: "09:00",
        alerte: true,
        texte: `${texte(ctx.promuNom)} devient manager au 1er janvier. Il faut boucler le staffing de janvier, et le cadrage de la mission des Hôpitaux de Seine-Amont se tient en semaine 12. Qui le mène ?`,
      },
      {
        de: "Tempora",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Valeur de l'équipe estimée à date : ${texte(ctx.valeur)}. Démissions remises ce trimestre : ${texte(ctx.departs)}.`,
      },
    ],
    sources: [
      {
        id: "premiers",
        titre: "Regarder le premier trimestre des managers promus l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ceux qui ont commencé par une seule mission, en binôme avec un manager expérimenté, ont tenu leurs forfaits. Celle qui a reçu deux missions et cinq consultants d'emblée a fini à 86 % de taux de réalisation, et son premier cadrage a coûté une réduction de périmètre de 30 k€.",
      },
      {
        id: "charge",
        titre: "Regarder le plan de charge de janvier dans Tempora",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux missions démarrent en janvier : les Hôpitaux de Seine-Amont et la phase 2 de Brévallon. Les piloter vous-même prendrait huit jours en janvier, pris sur l'avant-vente : 10,4 k€ au TJM d'un directeur.",
      },
    ],
    question: "Comment organisez-vous la prise de poste du nouveau manager ?",
    options: [
      {
        t: "Lui confier les deux missions de janvier et cinq consultants : c'est en pilotant qu'on apprend",
        d: "Le staffing est bouclé. Rien à engager.",
      },
      {
        t: "Organiser sa prise de poste : une seule mission d'abord, en binôme avec Wassila, et un point chaque mois",
        d: "Quatre jours de Wassila sur le trimestre suivant, 4,4 k€.",
      },
      {
        t: "Garder vous-même le pilotage des deux missions en janvier, le temps de la prise de poste",
        d: "Huit jours de votre temps en janvier, pris sur l'avant-vente.",
      },
    ],
    reactions: [
      [
        {
          ...WASSILA,
          texte:
            "Deux missions et cinq consultants dès le premier mois… J'espère qu'on ne le regrettera pas.",
        },
      ],
      [{ ...WASSILA, texte: "Le binôme est calé. Je l'accompagne au cadrage de Seine-Amont." }],
      [
        {
          ...EWA,
          texte: "Tu gardes le pilotage ? Alors tu ne seras pas en avant-vente en janvier.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Des critères, des faits, et le dire en face", chemin: [1, 1, 1, 1, 1, 1] },
  { nom: "Garder le plus apprécié", chemin: [0, 0, 0, 3, 0, 0] },
  { nom: "Laisser le comité trancher", chemin: [3, 3, 3, 2, 3, 2] },
] as const;

/**
 * Les réflexes du directeur devant une promotion disputée : porter le plus
 * apprécié pour ne pas le perdre (le dossier, l'entretien, le comité), lui
 * promettre la promotion de l'an prochain sans critère (l'échange avec
 * Bathilde, la promesse à l'annonce), et compenser hors des critères
 * (l'augmentation hors grille, la prime discrète). [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [2, 2],
  [3, 3],
  [4, 0],
  [4, 2],
] as const;

export const REPONSES = {
  accordAccepte:
    "Marché conclu : Vasco cette année, et je soutiendrai Elric l'an prochain. Tu le lui dis ?",
  accordRefuse:
    "Réflexion faite, non : je ne peux pas engager le comité de l'an prochain. Que le meilleur dossier gagne jeudi.",
  comite: [
    "Le comité a retenu Elric. Bathilde a plaidé pour Vasco ; ta note sur Elric a pesé, et personne n'a posé de questions sur ses missions.",
    "Le comité a retenu Tahina. Ta note, critère par critère, a fait la différence : Bathilde elle-même a reconnu que Tahina avait déjà piloté deux missions.",
    "Le comité a retenu Vasco. Bathilde a plaidé longtemps, et rien dans les dossiers ne permettait de départager les trois sur l'encadrement.",
  ],
  comiteAccord:
    "Le comité a retenu Vasco, comme convenu avec Bathilde. Personne n'a discuté les autres dossiers.",
  departs: [
    "Noé, je pars. Halden Partners m'a fait une offre de manager, et je n'ai plus de raison de dire non. Je fais mon préavis jusqu'en mars.",
    "Noé, je pars chez Halden Partners, comme manager. Ce que j'ai fait cette année n'a pas compté ici. Je fais mon préavis jusqu'en mars.",
    "Noé, je pars chez Kéroual Consulting. Je fais mon préavis jusqu'en mars.",
  ],
  reste:
    "J'ai décliné les chasseurs de Halden. Je reste, et je compte bien repasser devant le comité.",
  decouverte:
    "Tout le plateau sait qu'une compensation a été accordée après le comité. Deux seniors ont demandé un rendez-vous pour parler de leur salaire, et le promu demande si sa promotion valait moins.",
  cadrageReussi:
    "Le cadrage de Seine-Amont s'est bien passé : périmètre confirmé, le client a apprécié la méthode.",
  cadrageRate:
    "Le cadrage de Seine-Amont s'est mal passé : planning flou, équipe mal briefée. Le client réduit le périmètre de la mission, 30 k€ de moins.",
} as const;
