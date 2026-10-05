/**
 * LE TALENT QUI VEUT PARTIR — le contenu de l'épisode.
 *
 * Grégoire Chevalier est directeur commercial d'Arvel Distribution pour la
 * région lyonnaise : six agences, six chefs d'agence. La meilleure, Héloïse
 * Kervella, a été approchée par les Comptoirs Valdane ; Habib Amrani et
 * Mathilde Guérin montrent des signes de lassitude ; la politique salariale
 * du groupe ne laisse presque aucune marge, et un poste de responsable
 * régional pourrait s'ouvrir dans six mois. Six décisions, chacune précédée
 * de ce qu'un directeur commercial reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * On parle de personnes : les messages restent respectueux, et personne n'y
 * est présenté comme déloyal. Partir est un droit ; donner envie de rester
 * est le travail du manager.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "besoins",
    t: "Chacun a sa raison de partir, et ce n'est pas d'abord le salaire : des perspectives pour Héloïse, une charge tenable pour Habib, de la reconnaissance pour Mathilde",
  },
  {
    id: "charge",
    t: "La région tourne en sous-effectif : vos chefs d'agence sont épuisés",
  },
  {
    id: "salaire",
    t: "Les salaires du groupe ne suivent plus le marché : Valdane paie mieux",
  },
  {
    id: "marche",
    t: "Le marché de l'emploi est tendu : ces départs sont dans l'air du temps, on n'y peut pas grand-chose",
  },
] as const;

const HELOISE = {
  de: "Héloïse Kervella",
  role: "Cheffe de l'agence de Vénissieux",
} as const;
const HABIB = {
  de: "Habib Amrani",
  role: "Chef de l'agence de Givors",
} as const;
const MATHILDE = {
  de: "Mathilde Guérin",
  role: "Cheffe de l'agence de Tassin",
} as const;
const KOFI = {
  de: "Kofi Mensah",
  role: "Adjoint de l'agence de Vénissieux",
} as const;
const HENRI = {
  de: "Henri Dumoulin",
  role: "Directeur général délégué",
} as const;
const SIDONIE = {
  de: "Sidonie Brisset",
  role: "Ressources humaines, région",
} as const;
const AMBROISE = {
  de: "Ambroise Ancelin",
  role: "Contrôleur de gestion régional",
} as const;
const BAROMETRE = {
  de: "Baromètre des chefs d'agence",
  role: "Questionnaire du vendredi",
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La meilleure est approchée",
    jusqua: 2,
    messages: () => [
      {
        de: "Loïc Tanguy",
        role: "Commercial d'un fabricant de menuiseries",
        heure: "07:55",
        alerte: true,
        texte:
          "Grégoire, je vous le dis en ami : j'ai vu Héloïse Kervella jeudi au salon de Chassieu, longuement, avec le directeur régional des Comptoirs Valdane. Ils montent une direction de secteur et cherchent quelqu'un pour la tenir.",
      },
      {
        ...AMBROISE,
        heure: "08:30",
        texte:
          "Point de la région : Vénissieux reste la première marge des six agences, 36 k€ par semaine. Givors recule de 4 % sur un an, avec un poste de vendeur vacant depuis cinq mois. Baromètre des chefs d'agence : 47 sur 100, contre 61 il y a un an.",
      },
      {
        ...HABIB,
        heure: "dim. 23:48",
        texte:
          "Grégoire, je n'ai pas eu le temps de faire le reporting du groupe et celui de la région cette semaine. Je ferai les deux mardi. Désolé.",
      },
      {
        ...SIDONIE,
        heure: "09:10",
        texte:
          "Pour mémoire : la campagne salariale est bouclée, 2,5 % d'enveloppe pour les cadres. Toute augmentation individuelle au-delà demande une dérogation d'Henri.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "entretiens",
        titre: "Relire les entretiens annuels d'Héloïse, de Habib et de Mathilde",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Héloïse, neuf ans de maison, a demandé deux années de suite « un rôle plus large que mon agence » ; la case « suite donnée » est vide. Habib écrit « charge de travail intenable » : 52 heures par semaine, un vendeur non remplacé depuis cinq mois, deux reportings hebdomadaires qui disent la même chose. Mathilde a gagné 2,1 points de marge en un an, la meilleure progression de la région ; son entretien n'en dit pas un mot. Aucun des trois ne parle de salaire en premier.",
      },
      {
        id: "dejeuner",
        titre: "Déjeuner avec Héloïse, sans ordre du jour",
        cout: 1,
        nature: "decisive",
        resultat:
          "Elle ne nie pas : Valdane lui propose une direction de secteur sur trois agences, et 12 % de plus. « Honnêtement, l'argent n'est pas le sujet. Ça fait deux ans que je demande à faire autre chose que faire tourner mon agence, et personne ne me répond. Là-bas, quelqu'un m'a écoutée. » Elle doit répondre à Valdane d'ici quinze jours.",
      },
      {
        id: "salaires",
        titre: "Comparer leurs salaires au marché avec Sidonie Brisset",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les trois sont payés dans la médiane du marché, à 4 % près. Sidonie ajoute : remplacer un chef d'agence prend quatre mois et coûte 30 k€ (cabinet, intégration du successeur) ; une agence sans chef perd près de 10 % de sa marge, et quand il part chez un concurrent, des clients le suivent.",
      },
      {
        id: "turnover",
        titre: "Consulter les statistiques de départs du groupe",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "7 % de départs par an chez les chefs d'agence du groupe, autant que dans le reste du négoce. La région est dans la moyenne. Rien d'alarmant sur le papier.",
      },
      {
        id: "henri",
        titre: "Demander conseil à Henri Dumoulin",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Henri : « On ne retient pas quelqu'un en lui courant après le jour où il démissionne. On le retient en sachant avant lui ce qui lui manque. Et ne me demande pas de dérogation pour acheter du temps. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que faites-vous cette semaine ?",
    options: [
      {
        t: "Proposer tout de suite 10 % d'augmentation à Héloïse, pour couper court",
        d: "Une dérogation à demander à Henri : 1 500 € sur le trimestre. Elle saura qu'on tient à elle.",
      },
      {
        t: "Mener un entretien de rétention avec Héloïse, Habib et Mathilde : ce qui les fait rester, ce qui pourrait les faire partir",
        d: "Une heure avec chacun, dans son agence, cette semaine. Aucune promesse à ce stade.",
      },
      {
        t: "Réunir les six chefs d'agence en séminaire pour remobiliser l'équipe",
        d: "Deux jours dans le Beaujolais, avec un intervenant. 4 500 €.",
      },
      {
        t: "Ne rien brusquer : elle n'a rien dit, et personne n'est irremplaçable",
        d: "Si une démission arrive, on recrutera.",
      },
    ],
    reactions: [
      [
        {
          ...HELOISE,
          texte: "Merci, c'est généreux, je ne m'y attendais pas. Je vais réfléchir à tout ça.",
        },
        {
          ...HENRI,
          texte:
            "Je signe la dérogation. Mais une augmentation qui ne répond pas à la question qu'on se pose, ça ne tient pas longtemps.",
        },
      ],
      [
        {
          ...HELOISE,
          texte:
            "C'est la première fois qu'on me demande ce qui me ferait rester. Je veux encadrer, faire grandir des gens, pas seulement faire tourner mon agence.",
        },
        {
          ...HABIB,
          texte:
            "Ce qui me ferait rester ? Un vendeur, et un reporting au lieu de deux. Je ne demande pas la lune.",
        },
        {
          ...MATHILDE,
          texte:
            "Qu'on voie ce qu'on fait à Tassin, et qu'on me laisse décider de ce qui marche ici. C'est tout.",
        },
      ],
      [
        {
          ...MATHILDE,
          texte: "Deux journées agréables. Lundi matin, rien n'avait changé à Tassin.",
        },
        {
          ...HABIB,
          texte: "J'ai passé le séminaire à rappeler l'agence. Personne ne peut me remplacer.",
        },
      ],
      [
        {
          ...KOFI,
          texte: "Héloïse a pris deux après-midi cette semaine. Elle n'a pas dit pourquoi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "L'offre écrite",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...HELOISE,
        heure: "17:40",
        alerte: true,
        texte: `Grégoire, je préfère vous le dire en face : les Comptoirs Valdane m'ont fait une offre écrite. Direction de secteur, trois agences, 12 % de plus. Je dois répondre vendredi prochain. ${
          ctx.ecoute
            ? "Vous savez déjà ce qui me pèse ; je n'ai pas encore décidé."
            : "Je n'ai pas encore décidé."
        }`,
      },
      {
        ...HENRI,
        heure: "18:05",
        texte:
          "Je viens d'apprendre pour Héloïse. Le comité de direction parle de créer un poste de responsable régional dans six mois, mais rien n'est fait. Ne promets rien en mon nom.",
      },
      {
        ...BAROMETRE,
        heure: "18:30",
        texte: `Engagement d'Héloïse, de Habib et de Mathilde : ${ctx.engagement} sur 100 en moyenne. Risque de départ le plus élevé : ${ctx.risque}, pour ${ctx.qui}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "notes",
        titre: "Relire ce que vous savez de ce qu'Héloïse attend",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.ecoute
            ? "Vos notes de l'entretien : elle veut encadrer et transmettre, pas collectionner les dossiers. Elle cite Kofi, son adjoint, « prêt à tenir l'agence deux jours par semaine ». Le salaire est venu en dernier, et seulement parce que vous l'avez demandé."
            : "Vous n'avez pas de notes : vous ne lui avez jamais demandé ce qu'elle voulait. Son dernier entretien annuel parle d'« un rôle plus large », sans plus de précision. Vous devinez.",
      },
      {
        id: "comite",
        titre: "Demander à Henri où en est le poste de responsable régional",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Henri : « Le comité tranchera en semaine 10. Ces créations de poste, j'en ai vu geler une sur deux. Et c'est le comité qui choisira, sur dossier. Ce qui ne t'empêche pas de préparer des candidats. »",
      },
      {
        id: "contreoffres",
        titre: "Demander à Sidonie ce que deviennent les contre-offres",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur les cinq dernières contre-offres du groupe pour retenir un cadre, quatre ont été acceptées ; trois de ces quatre personnes sont parties dans l'année. Et à chaque fois, l'augmentation a fini par se savoir.",
      },
    ],
    question: "Que répondez-vous à Héloïse ?",
    options: [
      {
        t: "S'aligner sur Valdane : 12 % de plus, et une prime de fidélité",
        d: "La contre-offre, avec une dérogation d'Henri : 5 500 € sur le trimestre. Valdane aura du mal à suivre.",
      },
      {
        t: "Lui promettre le poste de responsable régional s'il s'ouvre",
        d: "Elle aurait ce qu'elle cherche, sans quitter la maison. Ne coûte rien aujourd'hui.",
      },
      {
        t: "Lui proposer un parcours : une mission régionale dès maintenant, et une préparation au poste régional, sans le lui promettre",
        d: "Les grands comptes de trois agences à piloter, l'école de management du groupe, Kofi qui tient l'agence deux jours par semaine. 3 500 €.",
      },
      {
        t: "La laisser décider : si elle part, on recrutera",
        d: "Un chef d'agence se remplace.",
      },
    ],
    reactions: [
      [
        {
          ...HELOISE,
          texte: "Je ne pensais pas que vous iriez jusque-là. Je vous réponds avant vendredi.",
        },
      ],
      [
        {
          ...HELOISE,
          texte:
            "Responsable régionale… C'est exactement ce que j'avais besoin d'entendre. Je vous réponds avant vendredi.",
        },
      ],
      [
        {
          ...HELOISE,
          texte:
            "Une mission tout de suite, et un vrai chemin vers la suite, sans promesse en l'air. Laissez-moi en parler à la maison ; je vous réponds avant vendredi.",
        },
      ],
      [
        {
          ...KOFI,
          texte: "Héloïse a passé l'après-midi au téléphone, porte fermée.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Habib ne tient plus",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...HABIB,
        heure: "jeu. 23:12",
        alerte: true,
        texte:
          "Grégoire, troisième samedi d'affilée au comptoir parce qu'il me manque un vendeur. J'ai raté l'anniversaire de mon fils. Je ne sais pas combien de temps je vais tenir comme ça.",
      },
      {
        ...AMBROISE,
        heure: "09:00",
        texte: `Givors : marge en recul de 4 % sur un an, des artisans qui attendent au comptoir le samedi. ${
          ctx.heloiseTot
            ? "Vénissieux : Kofi tient l'agence depuis la démission d'Héloïse."
            : "Vénissieux et Tassin tiennent leur budget."
        }`,
      },
      {
        ...SIDONIE,
        heure: "11:30",
        texte:
          "Le gel des embauches est levé pour les postes de vente. Si tu veux recruter à Givors, c'est possible dès maintenant.",
      },
    ],
    sources: [
      {
        id: "agenda",
        titre: "Regarder l'agenda et les heures de Habib",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "52 heures par semaine depuis trois mois, dont 11 au comptoir pour couvrir le poste vacant. Le lundi matin, quatre heures à remplir deux reportings qui disent la même chose, l'un pour le groupe, l'autre pour la région. Pas une semaine de congé depuis Pâques.",
      },
      {
        id: "cabinet",
        titre: "Demander au cabinet de recrutement ses délais",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le cabinet a deux vendeurs expérimentés en vue, qui viendraient d'un concurrent avec une partie de leurs clients. Six fois sur dix, il place quelqu'un en trois semaines ; sinon, il faut compter deux mois de plus. Une agence d'intérim peut fournir un vendeur dès lundi, moins rodé.",
      },
    ],
    question: "Que faites-vous pour Habib ?",
    options: [
      {
        t: "Lui verser une prime exceptionnelle de 3 000 € pour son engagement",
        d: "Avec la paie du mois. Il verra que ses efforts sont reconnus.",
      },
      {
        t: "Recruter un vendeur en CDI par cabinet, et supprimer le reporting régional en double",
        d: "4 000 € de cabinet, puis 800 € par semaine. Arrivée en semaine 7 si le cabinet trouve vite, plus tard sinon.",
      },
      {
        t: "Prendre un vendeur intérimaire dès lundi, et supprimer le reporting régional en double",
        d: "1 500 € par semaine jusqu'à la fin du trimestre. Il faudra le former un peu.",
      },
      {
        t: "Lui demander de tenir jusqu'à l'été : tout le monde est sous pression",
        d: "Ne coûte rien. Le poste sera rouvert l'an prochain.",
      },
    ],
    reactions: [
      [
        {
          ...HABIB,
          texte: "Merci pour la prime. Samedi, je serai quand même au comptoir.",
        },
      ],
      null,
      [
        {
          ...HABIB,
          texte:
            "L'intérimaire commence lundi. Il ne connaît pas encore les références, mais il tiendra le comptoir le samedi. Et quatre heures de reporting en moins : merci.",
        },
      ],
      [
        {
          ...HABIB,
          texte: "Jusqu'à l'été. D'accord. Je ferai ce que je peux.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Mathilde se lasse",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...MATHILDE,
        heure: "11:20",
        alerte: true,
        texte: ctx.fuite
          ? "Grégoire, j'ai appris qu'il y avait eu des augmentations hors campagne dans la région. Tassin a fait la meilleure progression de l'année, et personne ne l'a jamais dit. Je commence à me demander ce qu'il faut faire pour exister ici."
          : "Grégoire, je viens de lire la lettre du groupe : « Vénissieux, agence du trimestre ». Tassin a fait la meilleure progression de l'année, et personne ne l'a jamais dit. Et mon projet d'ouvrir à 6 h 30 avec un drive pour les artisans vient d'être refusé une deuxième fois, sans explication.",
      },
      {
        ...SIDONIE,
        heure: "14:05",
        texte:
          "Mathilde m'a demandé sa grille de rémunération et les règles de mobilité du groupe. Ça ressemble à quelqu'un qui prépare la suite.",
      },
      {
        ...BAROMETRE,
        heure: "17:00",
        texte: `Engagement des chefs d'agence clés : ${ctx.engagement} sur 100. Risque de départ le plus élevé : ${ctx.risque}, pour ${ctx.qui}.`,
      },
    ],
    sources: [
      {
        id: "tassin",
        titre: "Comparer les résultats de Tassin à ceux de la région",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "+2,1 points de marge en un an, la meilleure progression des six agences, et le plus fort taux de clients actifs. Son projet d'ouverture à 6 h 30 avec un drive chantier, refusé deux fois, a été repris presque tel quel par une agence de Valdane à Écully. Avec succès.",
      },
      {
        id: "grille",
        titre: "Regarder sa rémunération avec Sidonie",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Mathilde est payée 2 % au-dessus de la médiane de sa fonction. Une augmentation hors campagne demande une dérogation, et se saurait vite : les six chefs d'agence se parlent chaque semaine.",
      },
    ],
    question: "Que faites-vous pour Mathilde ?",
    options: [
      {
        t: "Reconnaître ses résultats devant les chefs d'agence, et lui confier le pilote du drive chantier, avec la latitude de décider",
        d: "Un mot à la réunion régionale, et 2 500 € de budget pour le pilote à Tassin. C'est elle qui décide de l'organisation.",
      },
      {
        t: "Lui accorder 5 % d'augmentation pour qu'elle ne parte pas elle aussi",
        d: "Une dérogation de plus à demander à Henri : 900 € sur le trimestre.",
      },
      {
        t: "Lancer une revue des salaires des six chefs d'agence, sur critères publiés, dans l'enveloppe",
        d: "À la campagne de janvier, la même règle pour tous. Rien de plus pour Mathilde d'ici là.",
      },
      {
        t: "Lui expliquer que la politique du groupe ne permet rien cette année",
        d: "Honnête, et ça ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...MATHILDE,
          texte:
            "Merci de l'avoir dit devant tout le monde. Le drive, je le monte en trois semaines, et je sais déjà avec qui.",
        },
      ],
      [
        {
          ...MATHILDE,
          texte: "Merci. Ce n'était pas vraiment ce que je demandais, mais merci.",
        },
      ],
      [
        {
          ...HABIB,
          texte: "Des critères écrits, la même règle pour tous : enfin.",
        },
        {
          ...MATHILDE,
          texte: "C'est juste. Pour moi, ça ne change pas grand-chose d'ici janvier.",
        },
      ],
      [
        {
          ...MATHILDE,
          texte: "Je comprends. Je ne demandais pas d'argent, mais je comprends.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le poste régional",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...HENRI,
        heure: "09:00",
        alerte: true,
        texte:
          "Grégoire, le comité de direction tranchera en semaine 10 sur la création du poste de responsable régional. D'ici là, je veux savoir comment tu prépares la région. Les rumeurs courent déjà.",
      },
      {
        ...HABIB,
        heure: "10:40",
        texte:
          "On dit qu'un poste régional va s'ouvrir. Quinze ans que je suis là : j'aimerais au moins savoir sur quels critères on choisira.",
      },
      ...(ctx.heloisePartie
        ? []
        : [
            {
              ...HELOISE,
              heure: "12:15",
              texte: ctx.promesse
                ? "Le poste régional, on en parle partout. Vous me l'aviez promis : j'y compte."
                : ctx.mission
                  ? "La mission grands comptes avance bien : Givors et Tassin ont repris deux chantiers à Valdane. Si le poste régional s'ouvre, j'aimerais être candidate."
                  : "J'ai entendu parler du poste régional. Je me demande si j'ai une chance.",
            },
          ]),
    ],
    sources: [
      {
        id: "criteres",
        titre: "Demander à Henri comment le comité choisira",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Henri : « Le comité choisira sur dossier, entre des candidats préparés. Il peut aussi geler le poste : ça arrive une fois sur deux. Une recommandation de ta part pèsera ; un nom annoncé avant l'heure le braquerait. »",
      },
      {
        id: "sonder",
        titre: "Sonder Habib sur le poste",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Habib : « Si c'est Héloïse, je l'accepterai, elle est très bonne. Mais je veux qu'on me le dise en face, sur des critères, et pas l'apprendre à la machine à café. »",
      },
    ],
    question: "Comment préparez-vous la région au poste régional ?",
    options: [
      {
        t: "Annoncer dès maintenant qui vous recommandez pour le poste",
        d: "Un nom, à la réunion des chefs d'agence. Le message est clair, et l'élu est rassuré.",
      },
      {
        t: "Ne rien dire tant que le comité n'a pas tranché",
        d: "Pas d'annonce, pas de promesse. On verra en semaine 10.",
      },
      {
        t: "Ouvrir une préparation au poste à ceux qui le veulent, avec des critères écrits",
        d: "Six mois de mises en situation, de formation et de mentorat par Henri, pour les volontaires. 2 000 €. Aucune promesse sur le choix final.",
      },
      {
        t: "Proposer au comité un recrutement externe, pour ne froisser personne",
        d: "Un profil expérimenté, venu d'ailleurs. Personne en interne ne sera déçu d'avoir été écarté.",
      },
    ],
    reactions: [
      [
        {
          ...MATHILDE,
          texte:
            "Un nom annoncé avant même que le comité ait décidé. Les autres ont compris qu'ils n'avaient pas leur chance.",
        },
      ],
      [
        {
          ...HENRI,
          texte: "Prudent. Mais dans une région, le silence se remplit vite.",
        },
      ],
      [
        {
          ...HABIB,
          texte:
            "Des critères écrits, une préparation ouverte : je me porte candidat. Et que le meilleur gagne.",
        },
      ],
      [
        {
          ...HABIB,
          texte: "Un externe. Donc aucun de nous n'était à la hauteur. Message reçu.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Valdane vise Kofi",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...KOFI,
        heure: "08:15",
        alerte: true,
        texte: ctx.heloiseTot
          ? "Grégoire, Héloïse m'a appelé : Valdane me propose de la rejoindre comme chef d'agence adjoint, 8 % de plus. Je tiens Vénissieux depuis son départ, et je ne sais toujours pas ce que je deviens ici."
          : "Grégoire, les Comptoirs Valdane m'ont proposé un poste de chef d'agence adjoint, 8 % de plus. Je voulais vous le dire avant de répondre.",
      },
      {
        ...HENRI,
        heure: "09:30",
        texte: `Deux semaines avant la fin du trimestre. ${ctx.postes} de tes quatre personnes clés sont encore en poste, et Valdane n'a pas fini de recruter chez nous.`,
      },
    ],
    sources: [
      {
        id: "kofi",
        titre: "Prendre un café avec Kofi",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.mission
            ? "Depuis qu'Héloïse est en mission, Kofi tient l'agence deux jours par semaine : « J'adore ça. Je voudrais en faire plus, pas partir. Valdane m'offre surtout un titre. »"
            : ctx.heloiseTot
              ? "Kofi tient Vénissieux depuis le départ d'Héloïse, sans titre ni visibilité : « Je fais le travail d'un chef d'agence avec la paie d'un adjoint, et personne ne m'a dit ce que je deviendrai. »"
              : "Kofi : « Héloïse fait tout elle-même, je ne vois pas ce que je pourrais apprendre de plus ici. Valdane m'offre surtout un titre. »",
      },
    ],
    question: "Que répondez-vous à Kofi ?",
    options: [
      {
        t: "S'aligner sur l'offre de Valdane",
        d: "8 % de plus, avec une dérogation d'Henri : 2 500 € sur le trimestre.",
      },
      {
        t: "Lui confier une délégation réelle : chef d'agence délégué, avec un périmètre écrit",
        d: "Un titre, des décisions qu'il prend seul, deux jours de formation. 1 000 €.",
      },
      {
        t: "Le laisser partir : un adjoint, ça se remplace",
        d: "Le poste sera publié en janvier.",
      },
    ],
    reactions: [
      [
        {
          ...KOFI,
          texte:
            "Je ne pensais pas valoir 8 % de plus d'un coup. Je vous donne ma réponse la semaine prochaine.",
        },
      ],
      [
        {
          ...KOFI,
          texte:
            "Chef d'agence délégué, avec mes propres décisions… Je vous donne ma réponse la semaine prochaine.",
        },
      ],
      [
        {
          ...KOFI,
          texte: "D'accord. Je vous donne ma réponse la semaine prochaine.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Écouter et construire un parcours", chemin: [1, 2, 1, 0, 2, 1] },
  { nom: "Surenchérir sur le salaire", chemin: [0, 0, 0, 1, 0, 0] },
  { nom: "Personne n'est irremplaçable", chemin: [3, 3, 3, 3, 1, 2] },
] as const;

/** Les options qui répondent par l'argent seul, ou qui laissent partir : [décision, option]. */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [1, 3],
  [2, 0],
  [2, 3],
  [3, 1],
  [3, 3],
  [5, 0],
  [5, 2],
] as const;

export const REPONSES = {
  /** La réponse d'Héloïse à Valdane, selon ce qu'on lui a proposé. */
  heloiseReste: [
    "J'ai dit non à Valdane. Merci pour l'effort, vraiment.",
    "J'ai dit non à Valdane. Je compte sur vous pour le poste.",
    "J'ai dit non à Valdane. Je commence la mission lundi, et j'ai déjà une idée pour les grands comptes de Givors.",
    "J'ai dit non à Valdane, pour cette fois. Je reste, mais je ne vous cache pas que j'attends autre chose.",
  ],
  heloisePart: [
    "J'ai accepté l'offre de Valdane. Ce n'était pas une question d'argent, et je crois que vous ne l'avez pas entendu. Je vous demande de réduire mon préavis : je partirai à la fin de la semaine 5.",
    "J'ai accepté l'offre de Valdane. Une promesse sur un poste qui n'existe pas encore, ce n'était pas assez. Je partirai à la fin de la semaine 5.",
    "J'ai accepté l'offre de Valdane. Votre proposition était sérieuse, et j'ai hésité jusqu'au bout. Je partirai à la fin de la semaine 5.",
    "J'ai accepté l'offre de Valdane. Je partirai à la fin de la semaine 5, si vous acceptez de réduire mon préavis.",
  ],
  cabinetRapide:
    "Le cabinet a trouvé : Corentin Vaudrey, huit ans de comptoir chez un concurrent, arrive à Givors en semaine 7 avec quelques-uns de ses clients.",
  cabinetLent:
    "Les deux candidats ont décliné au dernier moment. Le cabinet relance sa recherche : pas d'arrivée avant la semaine 11.",
  reportingSupprime:
    "Le reporting en double supprimé, ce sont déjà quatre heures de gagnées chaque lundi. Merci.",
  posteCree:
    "Le comité de direction a validé la création du poste de responsable régional. Il sera pourvu dans six mois, sur dossier.",
  posteGele:
    "Le comité de direction a gelé la création du poste de responsable régional, pour un an au moins. Budget oblige.",
  promesseRompue: [
    "Le poste est gelé. Vous me l'aviez promis, Grégoire. Je ne sais plus très bien quoi croire ici.",
    "Le poste est gelé. Vous l'aviez annoncé devant tout le monde, Grégoire. Je ne sais plus très bien quoi croire ici.",
  ],
  fuite:
    "Deux chefs d'agence m'ont demandé si les augmentations hors campagne étaient ouvertes à tous. Visiblement, ça s'est su.",
  heloiseRepart: [
    "Valdane est revenu me chercher, et cette fois j'ai dit oui. L'augmentation n'a rien changé à ce qui me manquait. Je pars à la fin du trimestre.",
    "Valdane est revenu me chercher, et cette fois j'ai dit oui. Après le gel du poste, je n'avais plus de raison de rester. Je pars à la fin du trimestre.",
    "Valdane est revenu me chercher, et cette fois j'ai dit oui. Je pars à la fin du trimestre.",
  ],
  habibPart:
    "Grégoire, je démissionne. Un négoce indépendant de la vallée du Gier me propose une agence avec une vraie équipe. Quinze ans ici, mais je n'en peux plus. Je partirai à la fin de la semaine prochaine, d'un commun accord avec Sidonie.",
  mathildePart:
    "Grégoire, j'ai accepté un poste de directrice d'agence dans un autre groupe, qui me laisse monter mon projet. Je partirai à la fin de la semaine prochaine.",
  /** La réponse de Kofi à Valdane, selon ce qu'on lui a proposé. */
  kofiReste: [
    "J'ai dit non à Valdane. Merci de vous être aligné.",
    "J'ai dit non à Valdane. Chef d'agence délégué : je commence lundi, et j'ai déjà ma liste.",
    "Finalement, je reste. Pour l'instant.",
  ],
  kofiPart: [
    "J'ai accepté chez Valdane. Merci pour l'effort, mais ce n'était pas l'argent que je cherchais.",
    "J'ai accepté chez Valdane. La délégation arrivait un peu tard : j'avais déjà donné ma parole.",
    "J'ai accepté chez Valdane. Je pars à la fin du mois.",
  ],
} as const;
