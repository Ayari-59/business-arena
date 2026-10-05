/**
 * LE NOUVEAU SERVICE — le contenu de l'épisode.
 *
 * Chloé Renaud, cheffe de produit au siège d'Arvel Distribution, lance un
 * service de location de matériel de chantier pour les artisans : échafaudages
 * roulants, bétonnières, perforateurs, petit outillage. La direction est
 * enthousiaste et veut les douze agences au trimestre ; Ferlane Location, un
 * loueur spécialisé, tient déjà le marché ; personne n'a vérifié ce que les
 * artisans loueraient, ni à quel prix. Six décisions, chacune précédée de ce
 * qu'une cheffe de produit reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que la
 * joueuse ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "inconnue",
    t: "Personne ne sait combien les artisans loueraient, ni à quel prix : il faut le mesurer avant d'acheter le parc des douze agences",
  },
  {
    id: "concurrent",
    t: "Ferlane tient déjà le marché : il faut une offre qui se distingue de la sienne",
  },
  {
    id: "vitesse",
    t: "Le risque est d'arriver trop tard : il faut être dans les douze agences avant que Ferlane ne s'y installe",
  },
  {
    id: "notoriete",
    t: "Les artisans ne savent pas encore qu'Arvel va louer : il faut d'abord faire connaître l'offre",
  },
] as const;

const DIRECTION = {
  de: "Rodolphe Laborde",
  role: "Directeur commercial",
} as const;
const IDRISSA = {
  de: "Idrissa Sangaré",
  role: "Directeur de l'offre",
} as const;
const AURELIA = {
  de: "Aurélia Monteiro",
  role: "Directrice de l'agence de Vénissieux",
} as const;
const TAREK = {
  de: "Tarek Hamdi",
  role: "Directeur de l'agence de Meyzieu",
} as const;
const NASSIM = {
  de: "Nassim Cherif",
  role: "Vendeur comptoir, Vénissieux",
} as const;
const JEANNE = {
  de: "Jeanne Bellamy",
  role: "Contrôleuse de gestion",
} as const;
const SOLENE = { de: "Romane Eymard", role: "Responsable marketing" } as const;
const SUIVI = {
  de: "Tableau de suivi du service",
  role: "Point hebdomadaire",
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Douze agences au trimestre",
    jusqua: 2,
    messages: () => [
      {
        ...DIRECTION,
        heure: "08:10",
        alerte: true,
        texte:
          "Chloé, le comité a validé la location de matériel. Je veux les douze agences avant la fin du trimestre : nos artisans nous la demandent, et chaque mois qui passe, c'est Ferlane qui encaisse. Le plan compte 18 locations par agence et par semaine.",
      },
      {
        ...SOLENE,
        heure: "09:00",
        texte:
          "Notre sondage est formidable : 78 % des artisans trouvent l'idée intéressante. Je peux préparer l'affichage pour les douze agences dès la semaine prochaine.",
      },
      {
        ...JEANNE,
        heure: "10:30",
        texte:
          "Pour info, un parc complet, c'est 30 k€ de matériel par agence, soit 360 k€ pour les douze. À amortir sur quatre ans, et je ne le passerai pas à sa valeur d'achat s'il ne tourne pas.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "comptoir",
        titre: "Interroger les artisans au comptoir de deux agences",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur 40 artisans interrogés, 31 se disent intéressés. Mais quand on leur demande ce qu'ils ont loué le mois dernier, 11 seulement ont loué quelque chose, deux jours et demi en moyenne, surtout des bétonnières et des échafaudages roulants. Ce qu'ils paieraient : « un peu moins que Ferlane », et surtout pas de détour. Ce qui les agace chez Ferlane : la caution de 500 € et le nettoyage facturé 40 € sans prévenir.",
      },
      {
        id: "ferlane",
        titre: "Étudier l'activité de Ferlane dans la région",
        cout: 1,
        nature: "decisive",
        resultat:
          "Ferlane a quatre agences autour de Lyon. Sur les vingt-cinq références qu'Arvel prévoit de louer, chacune fait entre 8 et 16 locations par semaine selon les mois. Son taux d'utilisation moyen tourne autour de 60 % ; un ancien de chez eux le dit sans détour : « En dessous de 50 %, un parc ne paie pas. Et la moitié de la marge part en casse, en retards et en nettoyage si on ne contrôle pas les retours. »",
      },
      {
        id: "sondage",
        titre: "Lire le détail du sondage du marketing",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "1 200 artisans ont répondu en ligne. 78 % trouvent « intéressante » l'idée d'une location en agence ; 64 % disent qu'ils l'utiliseraient « sûrement » ou « probablement ». Le questionnaire ne demandait ni à quel prix, ni à quelle fréquence.",
      },
      {
        id: "plan",
        titre: "Relire le plan d'affaires de la direction",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le plan compte 18 locations par agence et par semaine dans les douze agences, dès la semaine 4. Il ne dit pas d'où vient ce chiffre. Une agence équipée d'un parc complet coûte environ 850 € par semaine (amortissement, financement, une demi-journée de comptoir) : il lui faut une dizaine de locations par semaine pour couvrir ses frais.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Idrissa Sangaré",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Idrissa : « Ne te demande pas s'ils aiment l'idée. Demande-toi combien ils loueraient, à quel prix, et ce que coûte un parc qui attend. Le moins cher pour l'apprendre, c'est rarement une étude. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment lancez-vous le service ?",
    options: [
      {
        t: "Lancer dans les douze agences en semaine 4, comme la direction le demande",
        d: "Un parc complet par agence : 360 k€ de matériel, 2 500 € de lancement par agence. Deux semaines pour former les comptoirs.",
      },
      {
        t: "Lancer dans les six plus grosses agences en semaine 4",
        d: "180 k€ de matériel, 15 000 € de lancement. La moitié de la promesse, tout de suite.",
      },
      {
        t: "Faire un pilote à Vénissieux et Meyzieu, avec un petit parc",
        d: "28 k€ de matériel, 4 000 € de lancement, ouverture dès la semaine 2. Les autres agences attendront.",
      },
      {
        t: "Commander une étude de marché avant de lancer quoi que ce soit",
        d: "Un cabinet interroge 400 artisans et analyse Ferlane : 16 000 €, résultats en semaine 9.",
      },
    ],
    reactions: [
      [
        {
          ...DIRECTION,
          texte:
            "Parfait. J'annonce au comité les douze agences en semaine 4. Le fournisseur livre le parc complet la semaine prochaine.",
        },
      ],
      [
        {
          ...DIRECTION,
          texte:
            "Six, c'est un début. Saint-Priest, Villeurbanne, Vaulx, Décines, Bron et Vénissieux ouvrent en semaine 4. Les six autres suivront vite, j'espère.",
        },
      ],
      [
        {
          ...AURELIA,
          texte:
            "Le petit parc est arrivé : deux échafaudages, trois bétonnières, quelques perforateurs. Nassim a fait une place au fond du dépôt. On ouvre lundi.",
        },
      ],
      [
        {
          ...DIRECTION,
          texte:
            "Une étude ? Huit semaines pour apprendre ce que Ferlane sait déjà ? Bon. Mais je veux une recommandation ferme en semaine 9.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les premiers chiffres",
    jusqua: 4,
    messages: (ctx) =>
      ctx.loue
        ? [
            {
              ...SOLENE,
              heure: "11:20",
              alerte: true,
              texte: `${ctx.devis} demandes de devis en une semaine ! Le comité adore ce chiffre. Je propose qu'on le suive chaque lundi, agence par agence.`,
            },
            {
              ...SUIVI,
              heure: "18:00",
              texte: `Semaine 2 : ${ctx.locations} locations dans ${ctx.agences} ; ${ctx.refuses} artisans repartis sans matériel, faute de parc disponible.`,
            },
          ]
        : [
            {
              ...SOLENE,
              heure: "11:20",
              alerte: true,
              texte: ctx.etude
                ? "Le cabinet a commencé ses entretiens. En attendant, je propose qu'on prépare le tableau que le comité suivra chaque lundi quand le service sera lancé."
                : "Les affiches sont prêtes pour l'ouverture de la semaine 4. Je propose qu'on suive les demandes de devis chaque lundi, agence par agence : c'est ce que le comité veut voir.",
            },
            {
              ...JEANNE,
              heure: "15:40",
              texte:
                "Avant que le service démarre, dites-moi ce que vous voulez suivre. Ce qui n'est pas saisi au comptoir dès le premier jour ne se reconstitue pas après.",
            },
          ],
    reevaluation: true,
    sources: [
      {
        id: "devis",
        titre: "Comparer les demandes de devis et les locations",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.loue
              ? `Cette semaine : ${ctx.devis} demandes de devis, ${ctx.locations} locations. `
              : ""
          }Chez Ferlane comme dans le pilote d'une autre enseigne, une demande de devis sur trois devient une location. Les devis suivent la publicité et les relances ; les locations suivent les chantiers. Un artisan qui compare trois loueurs fait trois devis.`,
      },
      {
        id: "loueurs",
        titre: "Demander à Idrissa ce que suivent les loueurs",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Idrissa : « Les loueurs regardent trois chiffres. Le taux d'utilisation du parc : en dessous de 50 %, il ne paie pas. La marge par location, après casse, nettoyage et transport. Et la part des clients qui reviennent louer. Le reste, c'est pour les plaquettes. »",
      },
    ],
    question: "Que suivez-vous chaque semaine ?",
    options: [
      {
        t: "L'utilisation du parc, la marge par location et les clients qui reviennent",
        d: "Un tableau hebdomadaire par agence, rempli au retour du matériel : 1 000 € de paramétrage.",
      },
      {
        t: "Les demandes de devis : c'est ce que regarde la direction",
        d: "Les agences relancent chaque devis ; le chiffre monte vite.",
      },
      {
        t: "Le chiffre d'affaires de location, agence par agence",
        d: "Il sort tout seul de la caisse.",
      },
      {
        t: "Pas de tableau particulier : on fera le bilan à la fin du trimestre",
        d: "Les agences ont assez à faire.",
      },
    ],
    reactions: [
      [
        {
          ...JEANNE,
          texte:
            "C'est paramétré. Chaque retour de matériel est saisi : date, état, temps de nettoyage. Vous aurez vos trois chiffres le lundi matin.",
        },
      ],
      [
        {
          ...SOLENE,
          texte: "Super ! Je mets le compteur de devis en page d'accueil de l'intranet.",
        },
      ],
      [
        {
          ...JEANNE,
          texte:
            "Le chiffre d'affaires, je l'ai déjà. Il ne dira pas ce que coûtent la casse et les retards, mais il est là.",
        },
      ],
      [
        {
          ...TAREK,
          texte: "Tant mieux, on a déjà assez de tableaux. On verra bien à la fin.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Ce que le terrain raconte",
    jusqua: 6,
    messages: (ctx) =>
      ctx.loue
        ? [
            {
              ...NASSIM,
              heure: "07:50",
              alerte: true,
              texte:
                "Trois bétonnières revenues avec du béton durci dans la cuve : quarante minutes de burin chacune. Un échafaudage rendu avec deux jours de retard, alors qu'un couvreur l'attendait. Et un perforateur qui ne démarre plus, personne ne sait depuis quand.",
            },
            {
              ...SUIVI,
              heure: "18:00",
              texte: `Semaine 4 : ${ctx.locations} locations dans ${ctx.agences}, utilisation du parc ${ctx.utilisation}, marge par location ${ctx.marge}. ${ctx.devis} demandes de devis.`,
            },
            {
              ...DIRECTION,
              heure: "18:30",
              texte:
                "Le démarrage est un peu mou, non ? Une baisse de prix ferait décoller les chiffres avant le comité.",
            },
          ]
        : [
            {
              ...IDRISSA,
              heure: "09:15",
              alerte: true,
              texte:
                "Le cabinet n'a encore rien à dire. Pendant ce temps, Ferlane a ouvert un point de retrait à Bron. Il faut au moins décider de l'offre qu'on lancera.",
            },
            {
              ...DIRECTION,
              heure: "18:30",
              texte:
                "Quand on lancera, je veux un prix qui fasse venir du monde. Une baisse de prix, ça se voit tout de suite.",
            },
          ],
    sources: [
      {
        id: "clients",
        titre: "Appeler six artisans qui ont loué, ou voulu louer",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le prix leur va, à peu près. Ce qui les gêne : la caution en chèque, l'absence de forfait demi-journée (« la bétonnière, je n'en ai besoin que le matin »), et le matériel attendu qui n'est pas revenu. Rui Mendes, maçon : « Si vous me facturez le nettoyage, dites-le avant, je rincerai. Et rappelez-moi la veille du retour, je ne suis pas contre. »",
      },
      {
        id: "retours",
        titre: "Passer une matinée au retour du matériel",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `${
            ctx.loue
              ? `Marge par location cette semaine : ${ctx.marge}. `
              : "Chez Ferlane, à Bron, on vous laisse regarder. "
          }Un matériel sur quatre revient en retard et bloque la location suivante. Le nettoyage d'une bétonnière sale prend quarante minutes ; personne ne vérifie l'état au retour, et la casse se découvre au client suivant. Un échafaudage dont un plateau était fissuré a été reloué le lendemain.`,
      },
    ],
    question: "Que changez-vous à l'offre ?",
    options: [
      {
        t: "Baisser les prix de 15 % pour faire décoller les locations",
        d: "Une affiche en agence, effet immédiat sur les devis.",
      },
      {
        t: "Ajuster l'offre avec les clients : caution, contrôle au retour, forfait demi-journée, nettoyage annoncé",
        d: "Une check-list au comptoir, une heure de formation, une nouvelle grille : 1 800 €.",
      },
      {
        t: "Livrer gratuitement sur chantier pour se démarquer de Ferlane",
        d: "Le camion de l'agence fait la tournée : environ 18 € par location.",
      },
      {
        t: "Ne rien changer : quatre semaines, c'est trop tôt pour juger",
        d: "On garde l'offre de départ.",
      },
    ],
    reactions: [
      [
        {
          ...NASSIM,
          texte:
            "Les devis ont bondi avec l'affiche. Mais les artisans qui louaient déjà paient 15 % de moins, et le parc n'en loue pas plus quand il est déjà dehors.",
        },
      ],
      [
        {
          de: "Rui Mendes",
          role: "Maçon",
          texte:
            "La demi-journée, c'est exactement ce qu'il me fallait. Et on m'a prévenu pour le nettoyage : j'ai rincé la bétonnière avant de la ramener.",
        },
      ],
      [
        {
          ...TAREK,
          texte:
            "Le camion fait trois tournées de plus par semaine. Les artisans sont contents ; le chauffeur, beaucoup moins.",
        },
      ],
      [
        {
          ...NASSIM,
          texte: "Encore deux bétonnières sales ce matin. On fait avec.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Étendre, ou pas",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...DIRECTION,
        heure: "08:20",
        alerte: true,
        texte: ctx.etude
          ? "Le comité s'impatiente : toujours aucune agence ne loue. Il faut décider maintenant de ce qu'on fera des résultats de l'étude, qui tombent en semaine 9 ; le parc pourra être là en semaine 10."
          : "Le comité veut les douze agences avant la fin du trimestre. Le fournisseur peut livrer la semaine prochaine. On y va ?",
      },
      ...(ctx.loue
        ? [
            {
              ...SUIVI,
              heure: "18:00",
              texte: `Semaine 6 : ${ctx.locations} locations dans ${ctx.agences}, utilisation ${ctx.utilisation}, marge par location ${ctx.marge}, ${ctx.retour} de clients qui reviennent. ${ctx.devis} demandes de devis.`,
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "seuils",
        titre: "Mettre les chiffres du service face aux seuils de rentabilité",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.loue
              ? `Par agence et par semaine : ${ctx.locationsParAgence} locations et ${ctx.refusesParAgence} artisans repartis sans matériel, soit une demande d'environ ${ctx.demandeParAgence} locations. `
              : "Aucun chiffre réel avant l'étude. "
          }Jeanne a fait le calcul : une agence qui ouvre maintenant ne rembourse son lancement et son parc dans le trimestre qu'au-dessus de 13 locations par semaine ; une agence qui loue moins de 5 locations perd de l'argent chaque semaine. Et les agences ne se valent pas : Saint-Priest ou Villeurbanne font un tiers de plus que la moyenne, Tassin ou Villefranche un quart de moins.`,
      },
    ],
    question: "Que faites-vous du déploiement ?",
    options: [
      {
        t: "Équiper les douze agences, comme la direction l'a promis",
        d: "Le parc complet partout dès la semaine prochaine : 30 k€ de matériel et 2 500 € de lancement par agence ouverte.",
      },
      {
        t: "Garder le dispositif actuel jusqu'à la fin du trimestre",
        d: "Ni extension ni fermeture : on aura plus de recul au trimestre prochain.",
      },
      {
        t: "Étendre ou réduire agence par agence, selon des seuils fixés d'avance",
        d: "Ouvrir là où la demande attendue dépasse 13 locations par semaine, fermer là où elle tombe sous 5, d'après votre tableau de suivi.",
      },
      {
        t: "Arrêter le service et revendre le parc",
        d: "Le matériel, presque neuf, se revend 10 % sous son prix d'achat.",
      },
    ],
    reactions: [
      [
        {
          ...DIRECTION,
          texte: "Enfin ! J'annonce au comité les douze agences. Le parc arrive lundi.",
        },
      ],
      [
        {
          ...DIRECTION,
          texte: "Encore attendre… Le comité va me demander pourquoi Ferlane avance et pas nous.",
        },
      ],
      [
        {
          ...IDRISSA,
          texte:
            "Bien. Les seuils sont écrits avant de regarder les chiffres : personne ne pourra les tordre après. On applique, agence par agence.",
        },
      ],
      [
        {
          ...DIRECTION,
          texte: "Arrêter ? Après tout ce qu'on a annoncé ? Tu me fais un mot pour le comité.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Ferlane baisse ses prix",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...NASSIM,
        heure: "07:30",
        alerte: true,
        texte:
          "Ferlane a collé des affiches à la sortie de notre parking : −15 % pour les artisans à moins de cinq kilomètres de nos agences. Deux clients m'en ont parlé ce matin.",
      },
      {
        de: "Armand Fauvel",
        role: "Directeur régional, Ferlane Location",
        heure: "10:45",
        texte:
          "Madame Renaud, plutôt que de nous battre sur les prix, nous pourrions parler. Vos comptoirs, notre matériel : réfléchissez-y.",
      },
      {
        ...DIRECTION,
        heure: "11:30",
        texte: ctx.loue
          ? "Il faut s'aligner, non ? On ne va pas perdre nos clients pour quinze pour cent."
          : "Ferlane casse ses prix avant même qu'on soit lancés. Il faut savoir ce qu'on répondra.",
      },
    ],
    sources: [
      {
        id: "artisans",
        titre: "Demander aux artisans pourquoi ils louent chez Arvel",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sept sur dix louent chez Arvel parce qu'ils chargent le matériel avec leurs matériaux, à 6 h 30, sur la même facture, au vendeur qu'ils connaissent. Le prix vient après. Ludovic Pasquier, couvreur : « Ferlane ouvre à 7 h 30 et livre le lendemain. Moi, à 7 h 30, je suis sur le toit. »",
      },
      {
        id: "proposition",
        titre: "Rappeler Armand Fauvel pour entendre sa proposition",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Ferlane reprendrait le parc d'Arvel à 95 % de sa valeur et ferait des agences ses points relais : 30 € par location pour Arvel, sans parc, sans casse, sans comptoir dédié. Il veut voir vos chiffres avant de signer quoi que ce soit.",
      },
    ],
    question: "Comment répondez-vous à Ferlane ?",
    options: [
      {
        t: "Baisser vos prix de 15 % pour suivre Ferlane",
        d: "La grille change lundi dans toutes les agences qui louent.",
      },
      {
        t: "Jouer ce que Ferlane n'a pas : réservation au vendeur habituel, retrait à 6 h 30 avec les matériaux, une seule facture",
        d: "Un module de réservation au comptoir et une heure de formation : 1 200 €.",
      },
      {
        t: "Proposer à Ferlane un partenariat : il reprend le parc, nos agences deviennent ses points relais",
        d: "Plus de parc ni de casse à porter, 30 € par location. Ferlane dira oui, ou pas.",
      },
      {
        t: "Ne pas réagir : nos clients ne sont pas les siens",
        d: "Aucune dépense.",
      },
    ],
    reactions: [
      [
        {
          ...JEANNE,
          texte:
            "La nouvelle grille est en place. Chaque location rapporte 15 % de moins ; on verra si le volume compense.",
        },
      ],
      [
        {
          ...NASSIM,
          texte:
            "Les artisans réservent par téléphone la veille et chargent la bétonnière avec le ciment à 6 h 30. Deux m'ont dit qu'ils ne voyaient pas l'intérêt d'aller chez Ferlane.",
        },
      ],
      null,
      [
        {
          ...NASSIM,
          texte:
            "Trois habitués sont allés voir chez Ferlane cette semaine. Ils ne sont pas revenus.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Avant le comité",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...DIRECTION,
        heure: "08:00",
        alerte: true,
        texte:
          "Le comité se réunit en semaine 13 et décidera de la suite. Je veux des chiffres qui donnent envie. Romane propose un e-mailing à nos 9 000 artisans.",
      },
      {
        ...SUIVI,
        heure: "18:00",
        texte: ctx.loue
          ? `Semaine 10 : ${ctx.locations} locations dans ${ctx.agences}, utilisation ${ctx.utilisation}, ${ctx.retour} de clients qui reviennent. Contribution du service depuis le début du trimestre : ${ctx.cumul}.`
          : `Semaine 10 : aucune agence ne loue. Contribution du service depuis le début du trimestre : ${ctx.cumul}.`,
      },
    ],
    sources: [
      {
        id: "fideles",
        titre: "Regarder qui revient louer, et qui ne revient pas",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.loue ? `${ctx.retour} des artisans qui ont loué une fois sont revenus. ` : ""
          }Ceux qui reviennent achètent aussi leurs matériaux chez Arvel : un tiers de panier en plus. Sur ceux qui ne sont pas revenus, la moitié n'a jamais été rappelée ; plusieurs avaient un chantier en cours.`,
      },
    ],
    question: "Que faites-vous d'ici au comité ?",
    options: [
      {
        t: "Rappeler les artisans qui ont loué une fois, avec un « pack chantier » location et matériaux",
        d: "Une demi-journée d'appels par agence, une remise sur les matériaux : 800 €.",
      },
      {
        t: "Envoyer un e-mailing aux 9 000 artisans clients pour faire monter les chiffres avant le comité",
        d: "Conception et envoi : 4 500 €. Les demandes de devis vont s'envoler.",
      },
      {
        t: "Ne rien changer jusqu'au comité",
        d: "Les chiffres parleront d'eux-mêmes.",
      },
    ],
    reactions: [
      [
        {
          de: "Ludovic Pasquier",
          role: "Couvreur",
          texte:
            "On m'a rappelé pour l'échafaudage, avec une remise sur les liteaux. J'ai deux toitures en mai : je reprends le même.",
        },
      ],
      [
        {
          ...SOLENE,
          texte:
            "L'e-mailing est parti : les devis explosent ! Bon, beaucoup demandent du matériel qu'on n'a pas, ou dans une agence qui ne loue pas.",
        },
      ],
      [
        {
          ...DIRECTION,
          texte: "Bien. On présentera ce qu'on a.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare la joueuse, sous son hasard. */
export const REFERENCES = [
  { nom: "Tester, mesurer, étendre", chemin: [2, 0, 1, 2, 1, 0] },
  { nom: "Tenir la promesse", chemin: [0, 1, 0, 0, 0, 1] },
  { nom: "Attendre l'étude", chemin: [3, 3, 3, 1, 3, 2] },
] as const;

/** Les options qui tiennent la promesse faite à la direction, au prix du parc ou de la marge : [décision, option]. */
export const PROMESSES = [
  [0, 0],
  [1, 1],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 1],
] as const;

/** Les options qui attendent une information parfaite au lieu de l'aller chercher : [décision, option]. */
export const ATTENTES = [
  [0, 3],
  [1, 3],
  [2, 3],
  [3, 1],
  [4, 3],
  [5, 2],
] as const;

export const REPONSES = {
  ferlaneAccepte:
    "Marché conclu. Nous reprenons votre parc en semaine 10, et vos comptoirs deviennent nos points relais : 30 € par location, sans rien d'autre à porter.",
  ferlaneRefuse:
    "J'ai regardé vos chiffres. Votre parc ne nous intéresse pas, et nos clients viennent déjà chez nous. Merci quand même.",
} as const;
