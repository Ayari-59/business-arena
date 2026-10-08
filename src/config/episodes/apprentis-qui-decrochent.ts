/**
 * LES APPRENTIS QUI DÉCROCHENT — le contenu de l'épisode.
 *
 * Garance Royet est directrice de salle de La Table d'Augustin d'Aix-les-Bains,
 * le restaurant de bistronomie du Groupe Escale : soixante-dix places et une
 * terrasse, dix services par semaine. Sa salle compte huit personnes, dont cinq
 * apprentis ; deux contrats d'apprentissage ont été rompus l'an dernier. C'est la
 * rentrée de septembre, deux nouveaux arrivent. Six décisions, de septembre à
 * novembre, chacune précédée de ce qu'une directrice de salle reçoit vraiment :
 * le directeur des restaurants, les chefs de rang, la formatrice du CFA, la
 * chargée de l'alternance, les apprentis eux-mêmes.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles donnent
 * sont calculés sur le modèle (src/engine/episodes/apprentis-qui-decrochent.ts).
 *
 * On parle de jeunes de seize à vingt et un ans : les messages restent
 * respectueux, et aucun n'y est présenté comme paresseux. Un apprenti qui
 * décroche dit quelque chose de la manière dont on le forme.
 *
 * Groupe, restaurant, CFA, personnes et chiffres sont fictifs.
 */
import {
  AIDE_SEMAINE,
  ARRET_CLERVIE,
  CAPACITE_CONFIRMES,
  COUT_APPRENTI_MOYEN,
  COUT_EXTRA,
  COUT_EXTRA_DERNIERE_MINUTE,
  COUT_EXTRA_GROUPE,
  COUT_EXTRA_SERVICE,
  COUT_TUTEUR,
  COUVERTS,
  COUVERTS_PAR_SERVEUR,
  EXTRAS_DU_PLANNING,
  FRAIS_RUPTURE,
  FRAIS_SECONDE_RECRUE,
  GROUPES,
  HEURES_TUTORAT,
  PRIME_BINTOU,
  RECRUE,
  REMISE_GROUPE,
  SAISON,
  SEMAINES_DE_REMPLACEMENT,
  SEMAINE_DE_RATTRAPAGE,
  SERVICES_PAR_SEMAINE,
} from "@/engine/episodes/apprentis-qui-decrochent";
import { euros, nombre, taux } from "./format";
import type { Etape } from "./types";

const LISANDRO = { de: "Lisandro Esquerré", role: "Chef de rang" } as const;
const ZENOBIE = { de: "Zénobie Ballandras", role: "Cheffe de rang" } as const;
const THEO = { de: "Théo Garrigues", role: "Directeur des restaurants du groupe" } as const;
const NOELINE = {
  de: "Noéline Garrouste",
  role: "Formatrice référente, CFA des Deux Lacs",
} as const;
const KASSANDRA = {
  de: "Kassandra Oudin",
  role: "Chargée de l'alternance, ressources humaines",
} as const;

/** Ce que coûtent les extras que le planning réserve pour les semaines de cours. */
export const SEMAINES_D_EXTRA = Object.values(EXTRAS_DU_PLANNING).reduce((s, n) => s + n, 0);
export const COUT_DU_PLANNING = SEMAINES_D_EXTRA * COUT_EXTRA;
/** La part des couverts de la Toussaint que la salle tiendrait sans aucun apprenti ni renfort. */
export const PART_TENUE_TOUSSAINT =
  CAPACITE_CONFIRMES / ((COUVERTS * SAISON[8]) / COUVERTS_PAR_SERVEUR);
/** La facture d'une soirée de groupe, et la remise quand elle est ratée. */
export const FACTURE_GROUPE = GROUPES.couverts * GROUPES.menu;
export const REMISE_D_UNE_SOIREE = FACTURE_GROUPE * REMISE_GROUPE;

export const DIAGNOSTICS = [
  {
    id: "tutorat",
    t: "Les apprentis apprennent seuls, dans le coup de feu : personne n'a le temps de les former, et ils décrochent",
  },
  {
    id: "calendrier",
    t: "Le planning de la salle ignore le calendrier du CFA : les semaines de cours désorganisent le service et usent tout le monde",
  },
  {
    id: "motivation",
    t: "Les jeunes ne tiennent plus le service coupé et le rythme de la restauration : ils manquent de motivation",
  },
  {
    id: "effectif",
    t: "La salle manque de bras : il faut davantage d'apprentis pour absorber les départs",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La rentrée des apprentis",
    jusqua: 2,
    messages: () => [
      {
        ...THEO,
        heure: "08:10",
        alerte: true,
        texte:
          "Garance, le trimestre commence : septembre à novembre, la rentrée des apprentis, la fin de saison des curistes, puis le creux de novembre. L'an dernier, Aix a rompu deux contrats d'apprentissage, Annecy aucun. Je veux que cette année se passe autrement.",
      },
      {
        ...LISANDRO,
        heure: "10:30",
        texte:
          "Nolhan et Iliana arrivent ce matin. Je les mets où ? Samedi soir, on a 140 couverts réservés et la terrasse.",
      },
      {
        ...KASSANDRA,
        heure: "11:05",
        texte:
          "Les contrats de Nolhan (CAP, 16 ans) et d'Iliana (BTS, 19 ans) sont enregistrés. Pendant leurs 45 premiers jours de formation pratique au restaurant, l'un ou l'autre peut rompre le contrat sans motif.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "ruptures",
        titre: "Relire le dossier des deux ruptures de l'an dernier",
        cout: 1,
        nature: "decisive",
        resultat: `Jocelin Perrache, CAP première année, a été mis seul au rang de la terrasse dès son deuxième samedi : trois services difficiles, des remarques devant les clients, et il a rompu en semaine 7, pendant ses 45 premiers jours. Eugénie Mathon, BTS, est partie en novembre après un conflit avec le CFA : on l'avait gardée au restaurant une semaine de cours. Kadiatou Sidibé, contrôleuse de gestion des restaurants, a chiffré le départ de Jocelin : il a fallu ${nombre(SEMAINES_DE_REMPLACEMENT)} semaines pour trouver et faire signer un nouvel apprenti ; d'ici là, un extra a tenu son rang, ${nombre(SERVICES_PAR_SEMAINE)} services par semaine à ${euros(COUT_EXTRA_SERVICE)} le service, quand un apprenti coûte en moyenne ${euros(COUT_APPRENTI_MOYEN)} par semaine à la salle, charges et repas compris. Recrutement, démarches auprès du CFA et de l'opérateur de compétences, doublure du remplaçant : ${euros(FRAIS_RUPTURE)}.`,
      },
      {
        id: "service",
        titre: "Passer le service du samedi soir en salle, à côté des apprentis",
        cout: 1,
        nature: "decisive",
        resultat:
          "Lisandro, tuteur en titre des cinq apprentis, n'a pas une minute pour eux : il tient son rang et rattrape ceux des autres. Kélian se débrouille seul sur quatre tables ; Sanaa passe la soirée au débarrassage ; Nolhan suit qui il peut, un plateau à la main. Après le service, Kélian : « L'an dernier, on m'a mis au rang la deuxième semaine. Un samedi, j'ai failli tout arrêter. Personne ne m'avait montré comment on prend une table de huit. »",
      },
      {
        id: "cfa",
        titre: "Appeler la formatrice référente du CFA",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Noéline Garrouste : « Vos BTS seront en cours les semaines 2 et 3, 7 et 8, 11 et 12 ; vos CAP, les semaines 4, 8 et 11. Chez nous, en restauration, un contrat sur quatre est rompu avant son terme, et la moitié des ruptures tombent dans les trois premiers mois. Ceux qui tiennent ont presque toujours un tuteur qui a du temps pour eux. »",
      },
      {
        id: "salaires",
        titre: "Comparer le coût d'un apprenti et celui d'un extra",
        cout: 1,
        nature: "bruit",
        resultat: `À l'heure, un apprenti coûte trois à quatre fois moins cher qu'un extra. Deux recrues de plus en CAP première année coûteraient ${euros(2 * RECRUE.cout)} par semaine à elles deux, avant l'aide à l'embauche ; un extra pour la même semaine, ${euros(COUT_EXTRA)}.`,
      },
      {
        id: "conseil",
        titre: "Demander conseil à Léocadie Faustin, directrice de salle de la Table d'Annecy",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Léocadie : « Chez nous, chaque apprenti a un tuteur qui a trois heures par semaine pour lui pendant la mise en place, et personne n'est seul au rang avant d'avoir fait ses semaines de commis. Une rupture en deux ans, pour onze apprentis. Le temps du tuteur, c'est ce qui coûte le moins. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment organisez-vous la rentrée des apprentis ?",
    options: [
      {
        t: "Nommer Lisandro et Zénobie tuteurs, avec trois heures par semaine chacun pendant la mise en place, et un parcours en trois étapes pour chaque apprenti : commis, rang à deux, rang seul",
        d: `${nombre(2 * HEURES_TUTORAT)} heures de tutorat par semaine, ${euros(2 * COUT_TUTEUR)} en heures supplémentaires. Les nouveaux commencent en commis : un peu moins de bras au début.`,
      },
      {
        t: "Mettre Nolhan et Iliana au rang dès ce week-end, en renfort sur les services chargés, avec les autres apprentis",
        d: "Ne coûte rien. Deux rangs de plus le vendredi et le samedi soir, dès cette semaine.",
      },
      {
        t: "Envoyer Nolhan et Iliana à la formation d'accueil du groupe, deux jours au siège, puis les mettre en commis aux côtés de Lisandro pendant un mois",
        d: "300 € de frais de déplacement. Deux jours sans eux cette semaine.",
      },
      {
        t: "Garder l'organisation de l'an dernier : Lisandro tuteur en titre des cinq, chacun apprend en servant",
        d: "Ne coûte rien. Les apprentis disponibles renforcent les rangs qui manquent de bras.",
      },
    ],
    reactions: [
      [
        {
          ...ZENOBIE,
          texte:
            "Trois heures le mardi et le jeudi pendant la mise en place, c'est faisable. J'ai écrit le parcours d'Iliana : commis jusqu'à ce qu'elle sache prendre une table seule, pas avant.",
        },
      ],
      [
        {
          de: "Nolhan Dumollard",
          role: "Apprenti, CAP 1re année",
          texte:
            "J'ai eu quatre tables samedi. J'ai oublié une commande et renversé un verre de rouge sur une cliente. Personne n'avait le temps de me montrer.",
        },
      ],
      [
        {
          de: "Iliana Vuarchex",
          role: "Apprentie, BTS 1re année",
          texte:
            "La formation au siège était bien. Ici, je plie des serviettes et je regarde Lisandro courir.",
        },
      ],
      [
        {
          ...LISANDRO,
          texte: "Tuteur des cinq, comme l'an dernier. Je fais ce que je peux entre deux tables.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le calendrier du CFA",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...NOELINE,
        heure: "09:15",
        alerte: true,
        texte:
          "Bonjour Madame Royet, voici le calendrier du trimestre. BTS en cours les semaines 2 et 3, 7 et 8, 11 et 12 ; CAP les semaines 4, 8 et 11. Les semaines 8 et 11, vos cinq apprentis seront chez nous.",
      },
      {
        ...LISANDRO,
        heure: "11:40",
        texte: `La semaine 8, c'est la Toussaint : on attend ${nombre(COUVERTS * SAISON[8], 0)} couverts dans la semaine. À quatre, avec Zénobie, Melchior et toi, on ne les tiendra pas.`,
      },
      {
        de: "Tableau de bord de la salle",
        role: "Point hebdomadaire",
        heure: "23:30",
        texte: `Semaine 2 : ${ctx.incidents} erreurs de service rattrapées par un geste. Autonomie moyenne des apprentis : ${ctx.autonomie}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "planning",
        titre: "Croiser le calendrier du CFA et les réservations",
        cout: 0.5,
        nature: "decisive",
        resultat: `D'ici la fin du trimestre, trois semaines posent problème : la semaine 4 (les trois CAP en cours), la semaine 8, en pleine Toussaint, et la semaine 11 (les cinq). Sans renfort, la salle ne tiendrait que ${taux(PART_TENUE_TOUSSAINT, 0)} des couverts de la semaine 8. Il faudrait un extra en semaine 4, deux en semaine 8 et un en semaine 11 : ${nombre(SEMAINES_D_EXTRA)} semaines d'extra, ${euros(COUT_DU_PLANNING)}.`,
      },
      {
        id: "regles",
        titre: "Relire ce que le contrat d'apprentissage impose",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le temps passé au CFA est du temps de travail : l'employeur doit laisser l'apprenti suivre ses cours, et le CFA signale les absences. Les cours manqués se rattrapent, aux dates que fixe le CFA.",
      },
      {
        id: "decaler",
        titre: "Demander à Noéline si le CFA peut décaler une session",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Noéline : « Le calendrier est commun à quatorze apprentis de onze entreprises. Nous l'avons déjà décalé pour un employeur, rarement : une demande sur quatre, peut-être. »",
      },
    ],
    question: "Comment bâtissez-vous le planning de la salle ?",
    options: [
      {
        t: "Bâtir le planning de la salle sur le calendrier du CFA, avec des extras réservés dès maintenant pour les semaines 4, 8 et 11",
        d: `${nombre(SEMAINES_D_EXTRA)} semaines d'extra : ${euros(COUT_DU_PLANNING)}. Les apprentis vont en cours.`,
      },
      {
        t: "Demander au CFA de décaler les sessions de CAP des semaines 8 et 11",
        d: "Ne coûte rien. Le CFA décidera.",
      },
      {
        t: "Garder les apprentis au restaurant les semaines où la salle en a besoin ; ils rattraperont les cours",
        d: "Ne coûte rien. Tout le monde au restaurant, dès la semaine 3.",
      },
      {
        t: "Faire avec : les semaines de cours, la salle tourne avec ceux qui sont là",
        d: "Ne coûte rien. Moins de bras certaines semaines.",
      },
    ],
    reactions: [
      [
        {
          ...KASSANDRA,
          texte:
            "Les extras sont réservés auprès de l'agence pour les semaines 4, 8 et 11. Le planning de la salle est affiché avec les semaines de cours en couleur.",
        },
      ],
      null,
      [
        {
          ...NOELINE,
          texte:
            "Madame Royet, Bintou et Iliana ne sont pas venues en cours cette semaine. Je note leurs absences.",
        },
      ],
      [
        {
          ...ZENOBIE,
          texte: "Les semaines de cours, on fera ce qu'on peut. On fermera peut-être des tables.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Zénobie s'arrête",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...ZENOBIE,
        heure: "09:20",
        alerte: true,
        texte: `Garance, la clinique m'a donné une date pour mon genou : lundi. Arrêt de deux semaines, les semaines ${ARRET_CLERVIE[0]} et ${ARRET_CLERVIE[1]}. Désolée de te prévenir si tard.`,
      },
      {
        ...LISANDRO,
        heure: "10:05",
        texte:
          "Son rang, c'est six tables : la terrasse et le fond de salle. Les samedis de fin septembre sont encore pleins. Il faut quelqu'un.",
      },
      {
        de: "Tableau de bord de la salle",
        role: "Point hebdomadaire",
        heure: "23:30",
        texte: `Semaine 4 : ${ctx.incidents} erreurs de service. Autonomie moyenne des apprentis : ${ctx.autonomie}.`,
      },
    ],
    sources: [
      {
        id: "bintou",
        titre: "Demander à Lisandro où en est Bintou",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.tutore
            ? "Lisandro : « Depuis la rentrée, je la fais tenir un rang à deux avec moi pendant le tutorat. Elle connaît la carte, les vins, elle anticipe. Je la vois tenir celui de Zénobie, avec Nolhan en commis. Un premier samedi seule, il y a toujours un risque : mais plus de huit fois sur dix, ça passe. »"
            : "Lisandro : « Bintou sait servir, mais elle n'a jamais tenu un rang seule un samedi, et personne ne l'y a préparée. Une fois sur trois, ça passe. Sinon, c'est elle qui en sortira cassée. »",
      },
      {
        id: "extra",
        titre: "Appeler l'agence d'extras",
        cout: 0.5,
        nature: "utile",
        resultat: `Fin septembre, les extras confirmés sont pris par les mariages. Il en reste un, au dernier moment : ${euros(COUT_EXTRA_DERNIERE_MINUTE / SERVICES_PAR_SEMAINE)} le service, ${nombre(SERVICES_PAR_SEMAINE)} services par semaine, ${euros(2 * COUT_EXTRA_DERNIERE_MINUTE)} pour les deux semaines. Il connaît le métier, pas la maison.`,
      },
    ],
    question: "Qui tient le rang de Zénobie ?",
    options: [
      {
        t: "Prendre un extra confirmé pour tenir son rang les deux semaines",
        d: `${euros(2 * COUT_EXTRA_DERNIERE_MINUTE)} : au dernier moment, ${euros(COUT_EXTRA_DERNIERE_MINUTE / SERVICES_PAR_SEMAINE)} le service.`,
      },
      {
        t: "Confier son rang à Bintou, cheffe de rang pour deux semaines, avec Nolhan en commis à ses côtés",
        d: `Une prime de ${euros(PRIME_BINTOU)}. Bintou n'a jamais tenu un rang seule un samedi.`,
      },
      {
        t: "Confier son rang à Nolhan et Iliana : c'est comme ça qu'on apprend",
        d: "Ne coûte rien. Deux apprentis pour six tables.",
      },
      {
        t: "Fermer son rang, six tables, pendant deux semaines",
        d: "Ne coûte rien. Moins de couverts aux heures pleines.",
      },
    ],
    reactions: [
      [
        {
          ...LISANDRO,
          texte:
            "L'extra connaît le métier. Il cherche encore où sont les verres à vin, mais le rang tourne.",
        },
      ],
      [
        {
          de: "Bintou Kanouté",
          role: "Apprentie, BTS 2e année",
          texte: "Merci de me faire confiance. Nolhan sera avec moi, je lui montrerai les vins.",
        },
      ],
      [
        {
          de: "Iliana Vuarchex",
          role: "Apprentie, BTS 1re année",
          texte:
            "Six tables à deux, un samedi de septembre. On a couru tout le service, et la table 14 a attendu son plat quarante minutes.",
        },
      ],
      [
        {
          de: "Harmonie Desgranges",
          role: "Cheffe de cuisine",
          texte: "Six tables de moins : la cuisine respire, mais on a refusé du monde samedi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Sanaa décroche",
    jusqua: 8,
    messages: () => [
      {
        ...NOELINE,
        heure: "09:00",
        alerte: true,
        texte:
          "Madame Royet, Sanaa a manqué deux jours de cours la semaine 4 et elle dort en classe. Elle a dit à une camarade qu'elle allait arrêter.",
      },
      {
        ...LISANDRO,
        heure: "12:10",
        texte: "Sanaa est encore arrivée en retard au service du midi. Troisième fois ce mois-ci.",
      },
      {
        ...THEO,
        heure: "16:45",
        texte:
          "Si elle veut partir, laisse-la partir. Le CFA a encore des candidats : prends-en deux à sa place, ça te fera des bras pour la Toussaint.",
      },
    ],
    sources: [
      {
        id: "sanaa",
        titre: "Prendre une demi-heure avec Sanaa",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sanaa habite un village à vingt kilomètres. Depuis la rentrée, le dernier car part à 22 h 10 ; elle finit les services du soir vers 23 heures et rentre en stop, ou attend que sa mère vienne la chercher. Une soirée sur deux, elle est au débarrassage « parce qu'il faut bien quelqu'un ». « Si c'est pour débarrasser, autant travailler au supermarché. Personne ne m'a dit ce que je devais savoir faire à Noël. »",
      },
      {
        id: "formatrice",
        titre: "Appeler sa formatrice au CFA",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Noéline : « Ses notes de travaux pratiques sont bonnes : elle a du métier. Quand un apprenti parle d'arrêter, un entretien à trois, avec un parcours écrit pour les semaines qui viennent, règle souvent la question, à condition de traiter ce qui le fait décrocher. »",
      },
      {
        id: "reglement",
        titre: "Relire le règlement intérieur sur les retards",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Trois retards non justifiés dans le mois peuvent donner lieu à un avertissement écrit, remis en main propre.",
      },
    ],
    question: "Que faites-vous pour Sanaa ?",
    options: [
      {
        t: "Lui adresser un avertissement écrit pour ses retards",
        d: "Un courrier remis en main propre. Le règlement le prévoit.",
      },
      {
        t: "Organiser un entretien à trois avec sa formatrice et son tuteur : des horaires qui lui permettent de rentrer, et un parcours écrit pour les semaines qui viennent",
        d: "Une heure à trois. Sanaa finit à 22 heures les soirs de semaine.",
      },
      {
        t: "Laisser passer : beaucoup d'apprentis ont un coup de mou en octobre",
        d: "Ne coûte rien.",
      },
      {
        t: "Lui proposer une rupture d'un commun accord, et prendre à sa place deux apprentis de la liste du CFA",
        d: `Les deux nouveaux arrivent en semaine 8, en renfort le week-end. Recrutement et démarches : ${euros(FRAIS_RUPTURE + FRAIS_SECONDE_RECRUE)}.`,
      },
    ],
    reactions: [
      [
        {
          de: "Sanaa Oudghiri",
          role: "Apprentie, CAP 2e année",
          texte: "J'ai signé l'avertissement. Je ne vois pas ce que ça change pour mon car.",
        },
      ],
      [
        {
          de: "Sanaa Oudghiri",
          role: "Apprentie, CAP 2e année",
          texte:
            "Finir à 22 heures, je peux rentrer. Et un parcours écrit, c'est la première fois qu'on me dit ce que je dois savoir faire à Noël.",
        },
      ],
      [
        {
          ...LISANDRO,
          texte: "Sanaa est de plus en plus absente, même quand elle est là.",
        },
      ],
      [
        {
          ...KASSANDRA,
          texte:
            "La rupture d'un commun accord est signée, elle prend effet lundi. Les deux nouveaux commencent la semaine 8. Le CFA demande qui sera leur maître d'apprentissage.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Deux contrats de plus ?",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...THEO,
        heure: "08:30",
        alerte: true,
        texte:
          "Le CFA a encore des candidats sans entreprise, et un contrat peut commencer jusqu'à trois mois après la rentrée. Prends-en deux de plus : avec l'aide à l'embauche, ça ne coûte presque rien, et tu auras des bras pour les fêtes.",
      },
      {
        ...KASSANDRA,
        heure: "10:15",
        texte: "Deux candidats en CAP sont disponibles. Ils pourraient commencer en semaine 10.",
      },
      {
        de: "Tableau de bord de la salle",
        role: "Point hebdomadaire",
        heure: "23:30",
        texte: `${ctx.apprentis} apprentis sous contrat en fin de semaine 8. Autonomie moyenne : ${ctx.autonomie}.`,
      },
    ],
    sources: [
      {
        id: "tuteurs",
        titre: "Compter les tuteurs et le temps de tutorat",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Un maître d'apprentissage peut accueillir deux apprentis au plus : avec Lisandro, Zénobie et vous, la salle peut en former six. Vous en avez ${ctx.apprentis}. ${
            ctx.tutore
              ? `Les ${nombre(2 * HEURES_TUTORAT)} heures de tutorat de la semaine se partageraient entre ${Number(ctx.apprentis) + 2} apprentis.`
              : "Personne n'a d'heures de tutorat : deux recrues apprendraient en servant."
          } En novembre, la salle attend un quart de couverts de moins qu'en septembre.`,
      },
      {
        id: "recrues",
        titre: "Chiffrer deux recrues",
        cout: 0.5,
        nature: "utile",
        resultat: `Deux CAP première année : ${euros(RECRUE.cout)} par semaine chacun, moins l'aide à l'embauche de 2 000 € par an, ${euros(AIDE_SEMAINE)} par semaine. Il leur faudra deux mois au moins avant de tenir un rang seuls.`,
      },
    ],
    question: "Que répondez-vous à Théo ?",
    options: [
      {
        t: "Signer les deux contrats, et mettre les nouveaux en renfort au rang des services du week-end dès leur arrivée",
        d: `${euros(2 * RECRUE.cout)} par semaine à eux deux, avant l'aide à l'embauche. Deux paires de bras pour les samedis.`,
      },
      {
        t: "Signer un contrat, et confier le nouveau à un tuteur, avec le même parcours que les autres",
        d: `${euros(RECRUE.cout)} par semaine, avant l'aide à l'embauche.`,
      },
      {
        t: "N'en signer aucun : garder le temps des tuteurs pour ceux qui sont là, et réserver dès maintenant deux extras pour les fêtes de décembre",
        d: "Ne coûte rien ce trimestre.",
      },
    ],
    reactions: [
      [
        {
          ...LISANDRO,
          texte:
            "Les deux nouveaux ont fait leur premier samedi au rang. Je n'ai pas eu le temps de leur montrer où sont les couverts à poisson.",
        },
      ],
      [
        {
          ...ZENOBIE,
          texte: "Je prends le nouveau en commis avec moi. Il écoute, il apprendra.",
        },
      ],
      [
        {
          ...THEO,
          texte: "Bon. Tu me diras en décembre si tu avais raison.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Les repas de fin d'année",
    jusqua: 13,
    messages: () => [
      {
        de: "Ludger Rennard",
        role: "Escale Événements",
        heure: "09:40",
        alerte: true,
        texte: `Bonne nouvelle : six repas de fin d'année d'entreprises vendus pour la Table d'Aix, le jeudi, le vendredi et le samedi des semaines 12 et 13. ${nombre(GROUPES.couverts)} couverts chacun, menu à ${euros(GROUPES.menu)} HT, en plus de la salle à la carte.`,
      },
      {
        ...LISANDRO,
        heure: "11:20",
        texte: "Six soirées de groupe en plus de la carte. Il faut décider qui sert quoi.",
      },
      {
        ...THEO,
        heure: "17:00",
        texte: "Et la salle est calme en novembre : profites-en pour serrer les coûts.",
      },
    ],
    sources: [
      {
        id: "pret",
        titre: "Faire le point avec les tuteurs sur ce que chaque apprenti sait faire seul",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Autonomie moyenne des apprentis : ${ctx.autonomie} ; ${ctx.autonomes} sur ${ctx.apprentis} tiennent aujourd'hui un rang seuls. Une tablée de cinquante, c'est cinq tables de dix qu'il faut servir ensemble, plat par plat : un apprenti qui n'a jamais tenu un rang seul s'y noie, et même un apprenti autonome a besoin d'un confirmé à côté de lui. Les services du mardi et du mercredi, eux, font trente couverts : l'endroit où l'on apprend à tenir un rang seul.`,
      },
      {
        id: "groupes",
        titre: "Relire le bilan des repas de groupe de l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat: `Une soirée ratée, c'est une remise de ${taux(REMISE_GROUPE, 0)} sur la facture : ${euros(REMISE_D_UNE_SOIREE)} sur ${euros(FACTURE_GROUPE)}. Un extra pour la soirée coûte ${euros(COUT_EXTRA_GROUPE)} ; la brigade sert alors en binômes, un confirmé ou un extra avec chaque apprenti.`,
      },
    ],
    question: "Comment préparez-vous les repas de fin d'année ?",
    options: [
      {
        t: "Servir les groupes en binômes apprenti–confirmé, avec un extra par soirée, et faire tenir à chaque apprenti un rang seul sur les services calmes de novembre, tuteur en retrait",
        d: `Six extras de soirée : ${euros(6 * COUT_EXTRA_GROUPE)}.`,
      },
      {
        t: "Faire servir les groupes par les apprentis, une table de dix chacun, sans extra : c'est pour ça qu'on les forme",
        d: "Ne coûte rien. Les confirmés gardent la salle à la carte.",
      },
      {
        t: "Ne prendre que deux soirées de groupe par semaine, sans extra",
        d: "Quatre soirées sur six. La salle n'est pas débordée.",
      },
      {
        t: "Ne rien prévoir de particulier : la salle prendra les groupes avec la carte",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...ZENOBIE,
          texte:
            "Iliana a tenu son rang seule mardi midi. J'étais au bar, je n'ai rien eu à reprendre.",
        },
      ],
      [
        {
          de: "Melchior Guichard",
          role: "Barman",
          texte: "Chaque apprenti aura sa table de dix. Ça va être sportif.",
        },
      ],
      [
        {
          de: "Ludger Rennard",
          role: "Escale Événements",
          texte: "Je replace les deux soirées à L'Escale Aix-les-Bains. Dommage pour la Table.",
        },
      ],
      [
        {
          ...LISANDRO,
          texte: "On prendra les groupes comme ils viennent.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Former avant de faire servir", chemin: [0, 0, 1, 1, 2, 0] },
  { nom: "Des bras pour la salle", chemin: [1, 2, 2, 3, 0, 1] },
  { nom: "Attentiste", chemin: [3, 3, 3, 2, 2, 3] },
] as const;

/**
 * Les options qui emploient un apprenti comme main-d'œuvre d'appoint : au rang seul dans le
 * coup de feu avant qu'il en ait le métier, retenu au restaurant pendant ses cours, remplacé
 * par d'autres apprentis plutôt que formé. [décision, option].
 */
export const REFLEXES = [
  [0, 1],
  [1, 2],
  [2, 2],
  [3, 3],
  [4, 0],
  [5, 1],
] as const;

export const REPONSES = {
  cfaDecale:
    "Exceptionnellement, nous décalons les sessions de CAP des semaines 8 et 11 aux semaines 9 et 13. Ne nous le redemandez pas trop souvent.",
  cfaRefuse:
    "Le calendrier est commun à quatorze apprentis de onze entreprises : je ne peux pas le décaler pour un seul restaurant. Les semaines 8 et 11 restent des semaines de cours.",
  cfaAlerte: `Madame Royet, vos cinq apprentis ont manqué des cours ce mois-ci. Le temps de formation est du temps de travail : l'employeur doit laisser l'apprenti y assister. Les cours manqués seront rattrapés en semaine ${SEMAINE_DE_RATTRAPAGE}, pendant la Toussaint.`,
  bintouTient:
    "Premier samedi comme cheffe de rang : six tables, pas un plat renvoyé, et Nolhan a servi ses premiers vins au verre. Je garde le rang la semaine prochaine.",
  bintouCraque:
    "Samedi, Bintou a perdu pied au deuxième service : deux tables parties sans dessert, une addition fausse, un avis assassin dimanche matin. Elle a pleuré au vestiaire. J'appelle un extra pour la semaine prochaine.",
} as const;
