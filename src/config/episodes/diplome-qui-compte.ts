/**
 * LE DIPLÔME QUI COMPTE : le contenu de l'épisode.
 *
 * Noa Martin est en alternance au service des ressources humaines du Groupe
 * Escale, à Annecy. Avec Marwa Selmi, chargée de recrutement, Noa prépare le
 * recrutement des saisonniers de l'été. Six décisions de seconde, qui font
 * raisonner sur la question du programme de SES : quelles relations entre le
 * diplôme, l'emploi et le salaire ? Lire un tableau, affecter les candidats,
 * placer chacun dans la grille, utiliser le réseau, comparer diplôme et
 * expérience, expliquer un écart de salaire.
 *
 * Les données du tableau des diplômes et la grille de salaires sont fictives,
 * et le texte le dit : elles sont plausibles, pas officielles.
 *
 * Chaque chiffre qu'une source donne au joueur se lit dans les constantes du
 * modèle. Les sources portent leur NATURE (décisive, utile, bruit, aide), que
 * le joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes, données et chiffres sont fictifs.
 */
import {
  CANDIDATURES,
  GRILLE,
  PART_DE_CAP,
  POSTES_QUALIFIES,
  POSTES_SANS_QUALIFICATION,
  RECHERCHE,
  RENFORT_QUALIFIE,
  RENFORT_SANS_QUALIFICATION,
  TABLEAU_DES_DIPLOMES,
} from "@/engine/episodes/diplome-qui-compte";
import { euros, taux } from "./format";
import type { Etape } from "./types";

const MOUNIR = {
  de: "Mounir Belghazi",
  role: "Directeur des ressources humaines",
} as const;
const MARWA = { de: "Marwa Selmi", role: "Chargée de recrutement" } as const;
const ALIENOR = {
  de: "Aliénor Duchosal",
  role: "Directrice de L'Escale Annecy",
} as const;
const CHEF = {
  de: "Bastien Revil",
  role: "Chef de cuisine, L'Escale Annecy",
} as const;
const KARIM = { de: "Karim Haddad", role: "Cuisinier, candidat" } as const;
const LEA = {
  de: "Léa Perrier",
  role: "Commis de cuisine, CAP de juin",
} as const;
const TABLEAU = {
  de: "Tableau de bord de la saison",
  role: "Point hebdomadaire",
} as const;

/** Un pourcentage entier : « 65 % ». */
const pc = (v: number) => taux(v, 0);
/** Le tableau des diplômes, ligne par ligne. */
const LIGNES = TABLEAU_DES_DIPLOMES.map(
  (l) =>
    `${l.diplome} : ${pc(l.emploi)} en emploi, ${euros(l.salaire)} net par mois`,
).join(" ; ");

export const DIAGNOSTICS = [
  {
    id: "rarete",
    t: "Les titulaires d'un CAP de cuisine trouvent presque tous un emploi : en juin, ils sont rares, il faut aller les chercher et les payer à leur niveau",
  },
  {
    id: "logement",
    t: "Les saisonniers ne trouvent pas à se loger autour du lac",
  },
  { id: "jeunes", t: "Les jeunes ne veulent plus travailler en cuisine" },
  {
    id: "salaires",
    t: "Les salaires du groupe sont trop bas pour tous les postes",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Les postes de cuisine restent vides",
    jusqua: 2,
    messages: () => [
      {
        ...MARWA,
        heure: "09:00",
        alerte: true,
        texte: `Noa, ${CANDIDATURES} candidatures pour la saison, mais presque personne pour les ${POSTES_QUALIFIES} postes de cuisine. Les ${POSTES_SANS_QUALIFICATION} postes de plonge, de ménage et d'aide en salle, eux, se rempliront.`,
      },
      {
        ...MOUNIR,
        heure: "11:30",
        texte:
          "La saison commence dans quinze jours. Je veux savoir vendredi comment on remplit la cuisine, et à quel prix.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "tableau",
        titre: "Lire le tableau de l'emploi et du salaire selon le diplôme",
        cout: 1,
        nature: "decisive",
        resultat: `Données fictives, inspirées des enquêtes publiques sur les jeunes trois ans après leur formation. ${LIGNES}. Plus le diplôme est élevé, plus on trouve un emploi, et mieux il est payé. Un CAP de cuisine est un diplôme recherché : ceux qui l'ont sont vite embauchés.`,
      },
      {
        id: "candidatures",
        titre: "Trier les candidatures par diplôme",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Peu de candidats ont un CAP, et presque aucun en cuisine. Dans la région, les titulaires du CAP de cuisine sont déjà en poste, ou finissent leur année dans les lycées hôteliers et les centres de formation d'apprentis.",
      },
      {
        id: "article",
        titre: "Lire un article sur la motivation des jeunes",
        cout: 1,
        nature: "bruit",
        resultat:
          "« Les jeunes veulent du sens », dit l'article, sans chiffre ni enquête.",
      },
      {
        id: "logement",
        titre: "Demander à Marwa comment se logent les saisonniers",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Marwa : « Le groupe loue des appartements pour les saisonniers. Le logement compte, mais ceux qui refusent nos postes de cuisine ont déjà un emploi ailleurs. »",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Mounir",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Mounir : « Regarde qui a le diplôme qu'on cherche, et où ces gens-là se trouvent en juin. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment cherchez-vous les cuisiniers de la saison ?",
    options: [
      {
        t: "Publier une seule annonce pour tous les postes, sans diplôme demandé",
        d: "Simple et rapide : tout le monde peut postuler.",
      },
      {
        t: "Embaucher des étudiants sans CAP en cuisine, moins chers à payer",
        d: "Ils sont nombreux, disponibles, et payés au premier niveau de la grille.",
      },
      {
        t: "Aller chercher les titulaires du CAP dans les lycées et les CFA",
        d: `Des rencontres dans les lycées hôteliers et les centres d'apprentis, avec le salaire du niveau CAP de la grille : ${euros(GRILLE.niveau2)} brut par mois.`,
      },
      {
        t: "Confier tous les postes de cuisine à une agence d'intérim",
        d: "L'agence trouve des cuisiniers diplômés. Chaque semaine d'intérim coûte plus cher qu'un salarié.",
      },
    ],
    reactions: [
      [
        {
          ...CHEF,
          texte:
            "J'ai reçu des candidats sympathiques. La moitié n'a jamais tenu un couteau de cuisine.",
        },
      ],
      [
        {
          ...CHEF,
          texte:
            "Des étudiants motivés, mais il faut tout leur apprendre, en plein service.",
        },
      ],
      [
        {
          ...CHEF,
          texte: `${RECHERCHE[2].cap} titulaires du CAP de cuisine, et ils ont déjà fait des stages. On va pouvoir travailler.`,
        },
      ],
      [
        {
          ...MOUNIR,
          texte: "L'agence a trouvé. Mais regarde la facture chaque semaine.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Qui va où ?",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...MARWA,
        heure: "14:00",
        alerte: true,
        texte:
          "Les saisonniers arrivent lundi. Il faut décider qui va en cuisine, qui va à la plonge, au ménage et en salle.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `En cuisine : ${ctx.cap} titulaires du CAP, ${ctx.sansCap} sans CAP, ${ctx.vides} postes vides.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "postes",
        titre: "Lire les fiches de poste avec le chef de cuisine",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les postes de cuisine demandent les gestes du CAP : découper, cuire, respecter l'hygiène. La plonge et le ménage s'apprennent en une demi-journée de formation.",
      },
      {
        id: "saisons",
        titre: "Regarder qui est parti l'été dernier, et pourquoi",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'été dernier, les titulaires du CAP placés à la plonge sont partis au bout de trois semaines : ils avaient un diplôme, et trouvaient ailleurs un poste à leur niveau. Les autres départs venaient de saisonniers jamais formés.",
      },
    ],
    question: "Comment affectez-vous les saisonniers ?",
    options: [
      {
        t: "Le CAP en cuisine, les autres à la plonge avec une formation courte",
        d: "Une demi-journée de formation pour chaque poste sans qualification.",
      },
      {
        t: "Mettre des titulaires du CAP partout, même à la plonge, pour la qualité",
        d: "Des gens diplômés à tous les postes, c'est rassurant.",
      },
      {
        t: "Mettre les moins chers partout, y compris en cuisine, pour le budget",
        d: "Le premier niveau de la grille pour presque tout le monde.",
      },
      {
        t: "Donner le premier poste libre au premier arrivé, c'est plus juste",
        d: "Personne ne peut se plaindre d'un passe-droit.",
      },
    ],
    reactions: [
      [
        {
          ...CHEF,
          texte:
            "Chacun est à sa place, et la plonge a été formée lundi matin. Le service tourne.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Trois titulaires du CAP font la plonge. Ils demandent déjà quand ils passeront en cuisine.",
        },
      ],
      [
        {
          ...CHEF,
          texte: "J'ai trois débutants en cuisine. Les plats reviennent.",
        },
      ],
      [
        {
          ...CHEF,
          texte:
            "Deux CAP à la plonge, deux débutants en cuisine. On a tout mélangé.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "La grille de salaires",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...MOUNIR,
        heure: "10:00",
        alerte: true,
        texte:
          "Noa, il faut faire les contrats. Où place-t-on chacun dans la grille ? Je rappelle qu'on n'a pas de budget à jeter par les fenêtres.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Départs depuis le début de la saison : ${ctx.departs}.`,
      },
    ],
    sources: [
      {
        id: "grille",
        titre: "Lire la grille de salaires du groupe",
        cout: 0.5,
        nature: "decisive",
        resultat: `Une grille fictive, celle du Groupe Escale. Niveau 1, sans diplôme : ${euros(GRILLE.niveau1)} brut par mois. Niveau 2, avec un CAP : ${euros(GRILLE.niveau2)}. Niveau 3, un CAP et de l'expérience, ou une expérience reconnue : ${euros(GRILLE.niveau3)}. Le niveau dépend du diplôme et de l'expérience, pas de la personne.`,
      },
      {
        id: "concurrents",
        titre: "Regarder ce que paient les hôtels voisins",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les hôtels du lac paient les titulaires du CAP de cuisine au moins au niveau 2. Un cuisinier diplômé payé au minimum trouve facilement mieux à côté.",
      },
    ],
    question: "Comment placez-vous chacun dans la grille ?",
    options: [
      {
        t: "Payer tout le monde au niveau 1, diplôme ou pas, pour tenir le budget",
        d: "La masse salariale la plus basse possible.",
      },
      {
        t: "Négocier au cas par cas, selon ce que chacun demande",
        d: "Ceux qui insistent obtiennent un peu plus. Les autres ne demandent rien.",
      },
      {
        t: "Payer un peu plus ceux qu'un salarié a recommandés",
        d: "Une récompense pour la confiance de nos salariés.",
      },
      {
        t: "Placer chacun dans la grille selon son diplôme et son expérience",
        d: "Niveau 1, 2 ou 3 : la même règle pour tous.",
      },
    ],
    reactions: [
      [
        {
          ...MARWA,
          texte:
            "Deux cuisiniers diplômés ont signé ailleurs, mieux payés. Ils sont partis vendredi.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Les saisonniers comparent leurs fiches de paie. Ceux qui n'ont rien demandé sont furieux.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Les autres ont compris qu'il valait mieux être recommandé que diplômé. L'ambiance est mauvaise.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Chacun sait pourquoi il est à son niveau. Personne n'a contesté.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le renfort de juillet",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...ALIENOR,
        heure: "09:30",
        alerte: true,
        texte: `Juillet arrive : il me faut ${RENFORT_QUALIFIE} personnes de plus en cuisine et ${RENFORT_SANS_QUALIFICATION} en salle, dès la semaine prochaine.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Postes vides en ce moment : ${ctx.vides}.`,
      },
    ],
    sources: [
      {
        id: "cooptation",
        titre:
          "Regarder comment ont été recrutés les saisonniers des étés passés",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Quatre saisonniers sur dix sont venus par un salarié qui les connaissait : le réseau aide beaucoup à trouver un emploi, parfois autant que le diplôme. Mais les amis recommandés n'avaient pas toujours la qualification du poste.",
      },
      {
        id: "delais",
        titre: "Demander à Marwa combien de temps prend un recrutement",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Marwa : « Par une annonce et les lycées, trois semaines. Par les salariés, quelques jours. En mêlant les deux, on tient la semaine prochaine. »",
      },
    ],
    question: "Comment recrutez-vous le renfort ?",
    options: [
      {
        t: "Recruter seulement par cooptation : les amis des salariés, c'est rapide",
        d: "Des personnes recommandées, qui arrivent la semaine prochaine.",
      },
      {
        t: "Interdire la cooptation, pour que tout le monde ait les mêmes chances",
        d: "Seulement des annonces et les lycées. Trois semaines de délai.",
      },
      {
        t: "Prendre la cooptation comme une source parmi d'autres, mêmes critères",
        d: "Les recommandés passent le même entretien et sont placés dans la même grille.",
      },
      {
        t: "Offrir une prime à chaque salarié qui fait venir quelqu'un",
        d: "Une prime par recrue, sans autre condition. Les salariés vont s'activer.",
      },
    ],
    reactions: [
      [
        {
          ...CHEF,
          texte:
            "Les copains sont arrivés vite. Deux sur trois n'avaient jamais fait de cuisine.",
        },
      ],
      [
        {
          ...ALIENOR,
          texte:
            "Trois semaines sans renfort, en plein mois de juillet. Nous refusons des clients.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Des recommandés et des candidats des lycées, tous vus de la même façon : le renfort est là.",
        },
      ],
      [
        {
          ...CHEF,
          texte:
            "La prime a fait venir du monde. Pas toujours les bonnes personnes pour la cuisine.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Diplôme ou expérience ?",
    jusqua: 10,
    messages: () => [
      {
        ...CHEF,
        heure: "16:00",
        alerte: true,
        texte:
          "Mon chef de partie part. J'ai deux candidats : Karim, six ans en cuisine sans diplôme, et Léa, CAP de juin, sans expérience. Qui prend-on, et à quel niveau ?",
      },
      {
        ...KARIM,
        heure: "16:30",
        texte:
          "Je n'ai pas de diplôme, mais je tiens un poste de chaud depuis six ans. On peut me mettre à l'essai.",
      },
    ],
    sources: [
      {
        id: "essai",
        titre: "Organiser un essai d'une matinée en cuisine pour les deux",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Karim tient le poste sans aide et dirige les commis. Léa travaille proprement, mais elle découvre la cadence d'un service. Un diplôme dit ce qu'on a appris ; l'expérience, ce qu'on sait déjà faire.",
      },
      {
        id: "vae",
        titre: "Demander à Marwa ce qu'est la VAE",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Marwa : « La validation des acquis de l'expérience permet d'obtenir un diplôme grâce à ce qu'on a fait au travail. Karim pourrait obtenir son CAP sans retourner à l'école. Notre grille reconnaît déjà l'expérience au niveau 3. »",
      },
    ],
    question: "Qui prenez-vous comme chef de partie, et à quel niveau ?",
    options: [
      {
        t: "Léa, parce que le diplôme protège : on prend toujours le diplômé",
        d: "Le diplôme est une garantie. Léa apprendra le poste.",
      },
      {
        t: "Karim au niveau 3 après un essai, Léa en commis, et la VAE proposée",
        d: "L'expérience de Karim est reconnue dans la grille, et il peut obtenir son CAP par la VAE.",
      },
      {
        t: "Karim, mais au niveau 1, puisqu'il n'a pas de diplôme",
        d: "Il a l'expérience, et il coûte le prix d'un débutant.",
      },
      {
        t: "Ne plus prendre que des gens expérimentés, et refuser les jeunes diplômés",
        d: "Plus de débutants à former en pleine saison.",
      },
    ],
    reactions: [
      [
        {
          ...CHEF,
          texte:
            "Léa fait de son mieux, mais un service de chef de partie, c'est autre chose. Les plats attendent.",
        },
      ],
      [
        {
          ...KARIM,
          texte:
            "Niveau 3, et on me parle de la VAE. Je vais enfin avoir mon CAP.",
        },
      ],
      [
        {
          ...KARIM,
          texte:
            "Je fais le travail d'un chef de partie au salaire d'un débutant. Je ne resterai pas.",
        },
      ],
      [
        {
          ...LEA,
          texte:
            "On m'a dit qu'il n'y avait plus de place pour les jeunes diplômés. Je vais voir ailleurs.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Pourquoi je gagne moins ?",
    jusqua: 13,
    messages: () => [
      {
        ...LEA,
        heure: "15:20",
        alerte: true,
        texte:
          "Karim gagne plus que moi, alors que c'est moi qui ai le CAP. Ce n'est pas normal. Pourquoi ?",
      },
      {
        ...MOUNIR,
        heure: "15:45",
        texte:
          "Noa, tu peux lui répondre ? Fais attention : tout le monde regarde comment on traite ce genre de question.",
      },
    ],
    sources: [
      {
        id: "fiche",
        titre: "Comparer les deux fiches de paie avec la grille",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Léa est au niveau 2, celui du CAP. Karim est au niveau 3 : six ans d'expérience reconnus. Le salaire suit le diplôme et l'expérience, et Léa passera au niveau 3 avec l'ancienneté.",
      },
      {
        id: "retour",
        titre: "Regarder qui revient d'une saison à l'autre",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les saisonniers qui reviennent l'année suivante disent souvent qu'ils ont été traités avec des règles claires. Un saisonnier qui revient, c'est un recrutement et une formation de moins.",
      },
    ],
    question: "Que répondez-vous à Léa ?",
    options: [
      {
        t: "Lui répondre que c'est comme ça, et que la grille ne se discute pas",
        d: "Une réponse courte, qui ferme la discussion.",
      },
      {
        t: "Lui dire que Karim a mieux négocié son salaire qu'elle",
        d: "C'est simple à comprendre, et elle saura pour la prochaine fois.",
      },
      {
        t: "Aligner sa paie sur celle de Karim, pour éviter le conflit",
        d: "Elle sera contente, et le problème est réglé tout de suite.",
      },
      {
        t: "Lui montrer la grille, et lui dire comment elle progressera",
        d: "Le niveau dépend du diplôme et de l'expérience ; elle passera au niveau 3 avec l'ancienneté.",
      },
    ],
    reactions: [
      [{ ...LEA, texte: "D'accord. Je ne reviendrai pas l'été prochain." }],
      [
        {
          ...LEA,
          texte:
            "Il suffit donc de négocier ? Tout le monde va venir réclamer.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Léa est contente. Mais six autres saisonniers demandent maintenant la même chose.",
        },
      ],
      [
        {
          ...LEA,
          texte:
            "Je comprends mieux. Si je reviens l'été prochain, je serai plus près du niveau 3.",
        },
      ],
    ],
  },
];

/** La prévision de la semaine 1 : une multiplication guidée, les candidatures par la part de titulaires du CAP. */
export const PREVISION = {
  candidatures: CANDIDATURES,
  part: PART_DE_CAP,
} as const;

/** Les trois manières de faire auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Le diplôme, l'expérience et la grille", chemin: [2, 0, 3, 2, 1, 3] },
  { nom: "Le moins cher d'abord", chemin: [1, 2, 0, 3, 2, 2] },
  { nom: "Faire comme d'habitude", chemin: [0, 3, 1, 0, 0, 0] },
] as const;

/**
 * Les réponses réflexes : prendre les moins chers, payer tout le monde au
 * minimum, ne recruter que par le réseau, croire que le diplôme suffit,
 * fermer la discussion. [décision, option].
 */
export const REFLEXES = [
  [0, 1],
  [1, 2],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  departsDeLaPlonge:
    "Les titulaires du CAP placés à la plonge sont partis : ils ont trouvé un poste de cuisine à leur niveau, dans un autre hôtel.",
  departKarim:
    "Karim est parti : un restaurant d'Annecy le paie comme un chef de partie.",
} as const;
