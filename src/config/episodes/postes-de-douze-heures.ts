/**
 * PASSER EN DOUZE HEURES — le contenu de l'épisode.
 *
 * Irène Ferrandin est cadre de santé d'une unité de 40 lits de soins médicaux
 * et de réadaptation, à la clinique du Val Solvanne (Association Solvanne,
 * Dijon). Une moitié de son équipe veut passer des postes de 7 h 30 aux postes
 * de 12 heures, l'autre n'en veut pas ; la direction voudrait aller vite, pour
 * recruter ; le CSE doit être consulté. Six décisions, de septembre à
 * novembre, chacune précédée de ce qu'une cadre de santé reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles donnent
 * sont ceux du modèle (le test de l'épisode les recalcule).
 *
 * Établissement, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";
import { euros, nombre } from "./format";
import {
  ABSENCE_BASE,
  COEXISTENCE,
  COUT_EI,
  EI_BASE,
  EXPERTISE,
  JOURNEES,
  PART_ALIGNEE,
  PROBA_UNITE_B,
  RELEVES_12H,
  RELEVES_7H30,
  REMPLACEMENT_12H,
  REMPLACEMENT_7H30,
  SEUIL_CORRECTION,
  SURCOUT_VACANCE,
  TAUX_HORAIRE,
  TAUX_INTERIM,
  VACANCES_DEPART,
  type Releve,
} from "@/engine/episodes/postes-de-douze-heures";

export const DIAGNOSTICS = [
  {
    id: "effets",
    t: "Personne ne sait ce que les 12 heures feraient ici : leurs effets, bons et mauvais, dépendent de la trame et de l'équipe, et se mesurent",
  },
  {
    id: "attractivite",
    t: "L'unité ne recrute plus : sans postes de 12 heures, les trois postes vacants resteront à l'intérim",
  },
  {
    id: "camps",
    t: "L'équipe est coupée en deux camps : il faut trancher vite pour retrouver le calme",
  },
  {
    id: "securite",
    t: "Le poste de 12 heures met les patients en danger : la fatigue de fin de poste fait les erreurs",
  },
] as const;

const releves = (rs: readonly Releve[]) =>
  rs
    .map(
      (r) =>
        `à ${r.heure}, ${r.minutes} minutes de transmissions, ${r.arrivent} soignants du poste de ${r.poste} qui arrivent`,
    )
    .join(" ; ");

/** Le surcoût d'un poste vacant tenu en intérim, tel que les RH le donnent. */
const VACANCE_TEXTE = `Un poste vacant tenu en intérim coûte ${euros(SURCOUT_VACANCE)} de plus par semaine qu'un poste pourvu.`;

const pct = (v: number) => `${Math.round(v * 100)} %`;
const enDouze = (ctx: Contexte) => Number(ctx.douze) > 0;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Une équipe coupée en deux",
    jusqua: 2,
    messages: () => [
      {
        de: "Riwanon Ravaillé",
        role: "Infirmière, porte-parole des volontaires",
        heure: "07:20",
        alerte: true,
        texte:
          "Irène, on est quinze sur vingt-six, en jour, à vouloir passer en 12 heures. Trois jours de travail au lieu de cinq, deux fois moins de trajets. Le CHU le fait déjà, et c'est là que partent les jeunes. On aimerait une réponse avant le 1er octobre.",
      },
      {
        de: "Nuria Chaudrier",
        role: "Aide-soignante",
        heure: "08:05",
        texte:
          "Douze heures debout à mon âge, avec les transferts et les toilettes, je ne tiendrai pas. Et Anthéa a trois enfants : la crèche ferme à 18 h 30. On n'est pas contre les autres, mais qu'on ne nous l'impose pas.",
      },
      {
        de: "Médéric Amegavi",
        role: "Directeur de la clinique",
        heure: "09:30",
        texte:
          "Irène, nous sommes le 1er septembre. Si les 12 heures font revenir les candidats, passons toute la clinique au 1er octobre : les trois unités d'un coup, ce sera plus simple. Donnez-moi votre avis vendredi.",
      },
      {
        de: "Térence Mabru",
        role: "Responsable des ressources humaines de la clinique",
        heure: "11:15",
        texte: `Point recrutement : vos ${VACANCES_DEPART} postes vacants (deux infirmiers, un aide-soignant) sont toujours tenus par Soralis Intérim Santé. Sur les dix derniers candidats reçus, sept ont demandé s'il y avait des postes en 12 heures. ${VACANCE_TEXTE}`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "trames",
        titre: "Comparer la trame actuelle et le projet de trame en 12 heures, relève par relève",
        cout: 1,
        nature: "decisive",
        resultat: `En 7 h 30, trois relèves par jour : ${releves(RELEVES_7H30)}. Dans le projet en 12 heures (6 h 45-19 h et 18 h 45-7 h), deux relèves : ${releves(RELEVES_12H)}. Pendant une transmission, l'équipe qui arrive est déjà payée : ce sont des heures de chevauchement. L'unité les comble aujourd'hui par de l'intérim, à ${euros(TAUX_INTERIM)} l'heure contre ${euros(TAUX_HORAIRE)} pour une heure salariée.`,
      },
      {
        id: "etudes",
        titre: "Lire ce que disent les études et les unités déjà passées en 12 heures",
        cout: 1,
        nature: "decisive",
        resultat:
          "Une relève de moins, c'est moins d'informations perdues : environ 30 % des événements indésirables naissent aux transmissions. Les postes de 12 heures attirent les candidats. Mais après la dixième heure, les erreurs augmentent, d'autant plus que les postes s'enchaînent (au-delà de trois) et que la pause n'est pas vraiment prise ; l'absentéisme suit. L'ampleur varie beaucoup d'une équipe à l'autre : les unités qui ont réussi ont d'abord mesuré, sur un secteur, avant d'étendre.",
      },
      {
        id: "equipe",
        titre: "Recevoir les deux groupes, chacun à son tour",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les volontaires veulent surtout des semaines libérées ; Nabou Cissokho, jeune infirmière, dit qu'on lui propose un poste en 12 heures au CHU. Les autres ne contestent pas le principe pour ceux qui le veulent : Anthéa Galmiche, infirmière, partira si on le lui impose ; Nuria Chaudrier demanderait sa mutation. Tous disent la même chose : « qu'on ne décide pas pour nous ».",
      },
      {
        id: "absences",
        titre: "Comparer l'absentéisme de l'unité à celui des deux autres unités",
        cout: 1,
        nature: "bruit",
        resultat: `${pct(ABSENCE_BASE)} dans votre unité, 11,6 % en neurologie, 12,4 % en gériatrie. Rien qui distingue votre équipe.`,
      },
      {
        id: "conseil",
        titre: "Demander conseil à Bénigne Vauthrin, directrice des soins",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Bénigne : « Ni pour, ni contre par principe. Ce qui compte, c'est ce que ce changement fait aux patients et à l'équipe : regardez-le, comptez-le, et emmenez le CSE avec vous plutôt que de le mettre devant le fait accompli. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous au directeur ?",
    options: [
      {
        t: "Passer toute la clinique en 12 heures au 1er octobre",
        d: "Les trois unités d'hospitalisation sur la trame de votre unité. L'argument du recrutement porte tout de suite ; le CSE recevra le projet.",
      },
      {
        t: "Expérimenter trois mois sur un secteur de votre unité, avec les volontaires et des indicateurs relevés dès septembre",
        d: "Un secteur de 20 lits en 12 heures, l'autre en 7 h 30. Erreurs heure par heure, absences, candidatures : un bilan chiffré en décembre.",
      },
      {
        t: "Passer toute votre unité en 12 heures au 1er octobre",
        d: "Une seule organisation pour toute l'équipe, sans phase d'essai. Ceux qui sont contre s'adapteront.",
      },
      {
        t: "Refuser : l'unité reste en 7 h 30",
        d: "La continuité des soins d'abord, le débat est clos. Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          de: "Médéric Amegavi",
          role: "Directeur de la clinique",
          texte:
            "Parfait. J'annonce aux trois unités le passage en 12 heures au 1er octobre. Vous préparez la trame ?",
        },
      ],
      [
        {
          de: "Riwanon Ravaillé",
          role: "Infirmière, porte-parole des volontaires",
          texte:
            "Un secteur, c'est moins que ce qu'on espérait, mais c'est un début. On sera quinze volontaires pour le tenir.",
        },
      ],
      [
        {
          de: "Anthéa Galmiche",
          role: "Infirmière",
          texte:
            "Donc c'est décidé sans nous. Je vais regarder ce que je peux faire pour mes enfants à partir d'octobre.",
        },
      ],
      [
        {
          de: "Riwanon Ravaillé",
          role: "Infirmière, porte-parole des volontaires",
          texte: "On ne pourra même pas essayer ? Plusieurs collègues vont regarder ailleurs.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "La trame des 12 heures",
    jusqua: 3,
    messages: (ctx) => [
      {
        de: "Riwanon Ravaillé",
        role: "Infirmière, porte-parole des volontaires",
        heure: "14:10",
        alerte: true,
        texte: ctx.refus
          ? "Même si la réponse est non, voici la trame que nous avions préparée : jusqu'à quatre postes de 12 heures d'affilée, puis quatre jours de repos. Nous demandons que la question reste ouverte."
          : "Voici la trame que nous avons préparée : jusqu'à quatre postes de 12 heures d'affilée, puis quatre jours de repos. La pause de 30 minutes, on la prendra quand le service le permet. C'est ce qui nous libère de vraies semaines.",
      },
      {
        de: "Dr Saïda Escudié",
        role: "Médecin de médecine physique et de réadaptation",
        heure: "16:40",
        texte:
          "Je n'ai pas d'avis sur les horaires. Je tiens à ce que les soins techniques de fin de journée, les anticoagulants et les pansements complexes, restent faits par quelqu'un de reposé.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "nuits",
        titre:
          "Relire les erreurs déclarées par l'équipe de nuit, qui fait déjà des postes de 10 heures",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur un an, les erreurs de la nuit se concentrent dans les deux dernières heures du poste, et surtout la troisième et la quatrième nuit d'affilée. Les semaines où la pause n'a pas été prise faute de relais, on en compte presque deux fois plus.",
      },
      {
        id: "medecinTravail",
        titre: "Demander l'avis du médecin du travail",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Dr Bertrande Fauchereau : « Trois postes de 12 heures d'affilée au plus, et une vraie pause, loin du service, tenue par un collègue. Au-delà, on ne récupère plus. Deux postes au plus, c'est encore plus sûr, mais les volontaires y perdent l'essentiel de ce qu'ils cherchent. »",
      },
    ],
    question: "Quelle trame retenez-vous pour les postes de 12 heures ?",
    options: [
      {
        t: "La trame des volontaires : jusqu'à quatre postes d'affilée, pause de 30 minutes quand le service le permet",
        d: "La plus attendue par l'équipe et par les candidats. Ne coûte rien de plus.",
      },
      {
        t: "Trois postes d'affilée au plus, et une pause de 45 minutes tenue par un binôme",
        d: "Un peu moins de semaines libérées. Les pauses relayées coûtent 320 € par semaine pour toute l'unité.",
      },
      {
        t: "Deux postes d'affilée au plus, pause de 30 minutes",
        d: "La plus prudente. Peu de semaines libérées : l'argument du recrutement s'affaiblit.",
      },
    ],
    reactions: [
      [
        {
          de: "Riwanon Ravaillé",
          role: "Infirmière, porte-parole des volontaires",
          texte: "Merci ! Avec quatre jours de repos d'affilée, l'équipe est ravie.",
        },
      ],
      [
        {
          de: "Mirela Vlasceanu",
          role: "Aide-soignante, volontaire",
          texte:
            "Trois jours au plus, c'est raisonnable. Et une vraie pause, on n'en a jamais eu : à voir si le binôme tient.",
        },
      ],
      [
        {
          de: "Riwanon Ravaillé",
          role: "Infirmière, porte-parole des volontaires",
          texte:
            "Deux jours au plus ? On fera presque autant d'allers-retours qu'avant. Certains se demandent si ça vaut la peine.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Le CSE",
    jusqua: 7,
    messages: (ctx) => [
      {
        de: "Norbert Guillemaud",
        role: "Secrétaire du CSE",
        heure: "10:00",
        alerte: true,
        texte: ctx.refus
          ? "Madame Ferrandin, des salariés de votre unité nous demandent pourquoi les 12 heures sont refusées sans discussion. Le CSE souhaite en parler à sa prochaine réunion."
          : "Madame Ferrandin, nous apprenons par les couloirs qu'un passage en 12 heures se prépare. Le CSE doit être consulté avant tout changement d'organisation du travail. Quand comptez-vous nous présenter le projet ?",
      },
      {
        de: "Médéric Amegavi",
        role: "Directeur de la clinique",
        heure: "12:30",
        texte: ctx.refus
          ? "Le CSE veut parler de vos horaires. Il n'y a pas de projet, je leur dirai simplement que la réponse est non."
          : "Le 1er octobre, c'est mercredi en huit. Les plannings d'octobre sont prêts : je préfère qu'on démarre et qu'on fasse le point avec le CSE en décembre.",
      },
    ],
    sources: [
      {
        id: "precedents",
        titre: "Relire ce que le CSE a fait des deux derniers projets d'horaires",
        cout: 0.5,
        nature: "decisive",
        resultat: `En 2023, les nouveaux horaires de la cuisine, mis en place puis présentés au CSE : expertise votée, quatre mois de suspension, et ${euros(EXPERTISE)} pour la clinique. En 2024, la réorganisation de l'hôpital de jour, présentée avant le démarrage avec des indicateurs et un bilan prévu à trois mois : avis favorable, deux réserves, aucune expertise.`,
      },
      {
        id: "juriste",
        titre: "Consulter la juriste sociale du siège",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le Code du travail plafonne la journée à 10 heures ; un accord collectif peut la porter à 12. L'accord d'établissement de la clinique le permet, après consultation du CSE, qui doit précéder la décision. Le CSE peut voter une expertise sur un projet important qui modifie les conditions de travail : l'employeur en paie 80 %. Un changement mis en place sans consultation l'expose à un délit d'entrave.",
      },
    ],
    question: "Comment associez-vous le CSE ?",
    options: [
      {
        t: "Lui présenter le projet et ses chiffres avant le démarrage, et attendre son avis",
        d: "Une réunion extraordinaire la semaine prochaine : le démarrage glisse d'une semaine.",
      },
      {
        t: "Démarrer au 1er octobre et présenter le bilan au CSE en décembre",
        d: "Les plannings d'octobre sont prêts. Le CSE sera informé du démarrage.",
      },
      {
        t: "Négocier d'abord un accord avec les syndicats, et démarrer en janvier",
        d: "Trois mois de discussion, aucun risque de conflit. Rien ne change d'ici là.",
      },
    ],
    reactions: [
      [
        {
          de: "Norbert Guillemaud",
          role: "Secrétaire du CSE",
          texte: "Réunion extraordinaire fixée à jeudi prochain. Merci de nous consulter avant.",
        },
      ],
      [
        {
          de: "Norbert Guillemaud",
          role: "Secrétaire du CSE",
          texte:
            "Nous prenons note que la décision est prise avant que nous en ayons été saisis. Nous en reparlerons.",
        },
      ],
      [
        {
          de: "Riwanon Ravaillé",
          role: "Infirmière, porte-parole des volontaires",
          texte: "Janvier… On attendra. J'espère que personne ne partira d'ici là.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Les premiers chiffres",
    jusqua: 9,
    messages: (ctx) =>
      enDouze(ctx)
        ? [
            {
              de: "Aude Lantenois",
              role: "Responsable qualité et gestion des risques",
              heure: "09:15",
              alerte: true,
              texte: ctx.indicateurs
                ? "Le tableau de suivi de l'expérimentation est à jour : trois semaines en 12 heures. Je vous l'envoie avant le comité de suivi."
                : "Plusieurs déclarations d'erreurs remontent de votre unité depuis octobre, sans qu'on sache à quelle heure du poste. Faute d'indicateurs relevés avant, je ne peux rien comparer.",
            },
            {
              de: "Riwanon Ravaillé",
              role: "Infirmière, porte-parole des volontaires",
              heure: "13:00",
              texte: ctx.trameLongue
                ? "Tout le monde est content des jours libérés. Le quatrième jour, en fin de poste, on est cuits, il faut le dire aussi."
                : "Tout le monde est content des jours libérés. La dernière heure est longue, il faut le dire aussi.",
            },
            {
              de: "Médéric Amegavi",
              role: "Directeur de la clinique",
              heure: "17:30",
              texte: ctx.clinique
                ? "Les trois unités tournent en 12 heures. Les candidatures arrivent ; tenons bon."
                : "Les candidatures arrivent. Pourquoi ne pas étendre aux deux autres unités dès novembre ?",
            },
          ]
        : [
            {
              de: "Aude Lantenois",
              role: "Responsable qualité et gestion des risques",
              heure: "09:15",
              texte: ctx.conflit
                ? "Avec l'expertise votée par le CSE, l'unité est en 7 h 30. Rien de nouveau dans les déclarations."
                : "L'unité est en 7 h 30 : les déclarations d'événements indésirables sont à leur niveau habituel.",
            },
            {
              de: "Médéric Amegavi",
              role: "Directeur de la clinique",
              heure: "17:30",
              texte:
                "Les autres cliniques de l'agglomération recrutent en 12 heures. Pourquoi ne pas lancer les deux autres unités dès novembre ?",
            },
          ],
    sources: [
      {
        id: "heures",
        titre: "Lire les erreurs déclarées heure par heure depuis le démarrage",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          !enDouze(ctx)
            ? "L'unité est en 7 h 30 : il n'y a rien à comparer."
            : ctx.indicateurs
              ? `Erreurs et presque-erreurs déclarées dans le secteur en 12 heures : ${ctx.excesPct} de plus après la dixième heure que pendant les huit premières, à charge comparable. Le protocole avait fixé un seuil d'alerte à ${pct(SEUIL_CORRECTION)}. Absentéisme de l'unité : ${ctx.absenteisme}. Soralis remplace ${pct(REMPLACEMENT_12H)} des absences sur un poste de 12 heures, contre ${pct(REMPLACEMENT_7H30)} en 7 h 30.`
              : "Personne n'a noté l'heure des déclarations avant le démarrage, ni depuis : on ne peut pas dire si les erreurs viennent de la fin des postes. Les impressions divergent selon qui on interroge.",
      },
      {
        id: "secteur",
        titre: "Passer une fin de poste avec l'équipe en 12 heures",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          enDouze(ctx)
            ? `À 18 heures, les transmissions sont plus complètes qu'avant : une seule relève, et le temps de la faire. Mais les pansements et les anticoagulants du soir sont faits par des soignants debout depuis onze heures${ctx.pauseProtegee ? ", même quand la pause a été prise" : ", et la pause a sauté deux fois sur trois"}.`
            : "Personne n'est en 12 heures : l'équipe en parle encore, sans plus.",
      },
    ],
    question: "Que faites-vous des premiers chiffres ?",
    options: [
      {
        t: "Continuer sans rien changer jusqu'au bilan",
        d: "Trois semaines, c'est trop tôt pour conclure. Rien ne coûte.",
      },
      {
        t: "Corriger ce que montrent les chiffres, au comité de suivi",
        d: "Avec l'équipe : trame, pauses, soins à risque avant la dixième heure, selon les indicateurs. Le planning est repris.",
      },
      {
        t: "Arrêter et revenir aux 7 h 30 en semaine 8",
        d: "Au premier doute, on revient à ce qu'on connaît.",
      },
      {
        t: "Étendre les 12 heures aux deux autres unités dès novembre",
        d: "Les candidatures arrivent : on en fait profiter toute la clinique.",
      },
    ],
    reactions: [
      [
        {
          de: "Riwanon Ravaillé",
          role: "Infirmière, porte-parole des volontaires",
          texte: "On continue. On verra en décembre.",
        },
      ],
      [
        {
          de: "Aude Lantenois",
          role: "Responsable qualité et gestion des risques",
          texte:
            "Le comité de suivi s'est réuni avec l'équipe. Ce qui a été décidé est affiché en salle de soins.",
        },
      ],
      [
        {
          de: "Nabou Cissokho",
          role: "Infirmière",
          texte: "Déjà fini ? On n'a même pas eu le temps de voir ce que ça donnait.",
        },
      ],
      [
        {
          de: "Hugolin Cottineau",
          role: "Cadre de santé de l'unité de neurologie",
          texte:
            "Je l'apprends par la note de service. Mon équipe n'a rien demandé, et la moitié a des enfants en bas âge.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Deux rythmes dans une équipe",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Yvelise Pontarlier",
        role: "Chargée de clientèle, Soralis Intérim Santé",
        heure: "10:20",
        alerte: Number(ctx.douze) > 0 && Number(ctx.douze) < 1,
        texte:
          Number(ctx.douze) > 0 && Number(ctx.douze) < 1
            ? "Madame Ferrandin, vos demandes changent : des missions de 14 h 30 à 19 h, d'autres de 7 heures à 19 heures. Ces bouts de poste, je les trouve mal, et ils se facturent comme des postes entiers."
            : "Madame Ferrandin, je vous confirme nos tarifs pour novembre. Rien ne change de notre côté.",
      },
      {
        de: "Nuria Chaudrier",
        role: "Aide-soignante",
        heure: "15:45",
        texte: enDouze(ctx)
          ? "On ne sait plus qui relève qui. Les 7 h 30 arrivent au milieu des transmissions des 12 heures, et l'après-midi, on court après tout le monde."
          : "Au moins, en 7 h 30, on sait qui relève qui.",
      },
    ],
    sources: [
      {
        id: "planning",
        titre: "Compter ce que les deux rythmes coûtent au planning",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          Number(ctx.douze) > 0 && Number(ctx.douze) < 1
            ? `Deux rythmes dont les relèves ne tombent pas aux mêmes heures : des trous de fin d'après-midi comblés par l'intérim, des plannings refaits chaque semaine. Environ ${euros(COEXISTENCE)} par semaine. Si les postes de 7 h 30 devenaient 7 h-14 h 30 et 11 h 30-19 h, toutes les relèves tomberaient à 7 heures et à 19 heures : il en resterait ${pct(PART_ALIGNEE)}.`
            : "L'unité n'a qu'un seul rythme : le planning ne coûte rien de plus qu'avant.",
      },
      {
        id: "septTrente",
        titre: "Demander à ceux qui restent en 7 h 30 ce qu'ils accepteraient",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Anthéa et Nuria garderaient volontiers des postes de 7 h 30 décalés (7 h-14 h 30, ou 11 h 30-19 h) si leurs horaires sont connus un mois à l'avance. Une seule chose les ferait partir : qu'on leur impose les 12 heures.",
      },
    ],
    question: "Quelle organisation retenez-vous pour finir le trimestre ?",
    options: [
      {
        t: "Laisser chacun choisir son rythme, mois par mois",
        d: "La souplesse que l'équipe apprécie. Le planning se refait chaque mois.",
      },
      {
        t: "Aligner les horaires des postes de 7 h 30 sur les relèves de 7 heures et 19 heures",
        d: "Postes de 7 h-14 h 30 et 11 h 30-19 h. 1 000 € pour reprendre les plannings.",
      },
      {
        t: "Passer toute l'unité en 12 heures en semaine 11",
        d: "Un seul rythme, un seul planning. Ceux qui sont contre s'y feront.",
      },
      {
        t: "Revenir à un seul rythme : les 7 h 30 pour tous en semaine 11",
        d: "Un seul planning, celui d'avant.",
      },
    ],
    reactions: [
      [
        {
          de: "Mirela Vlasceanu",
          role: "Aide-soignante, volontaire",
          texte:
            "Chacun fait son mois. Le planning est affiché tard, mais tout le monde s'y retrouve à peu près.",
        },
      ],
      [
        {
          de: "Nuria Chaudrier",
          role: "Aide-soignante",
          texte:
            "Avec les mêmes heures de relève pour tous, on se retrouve enfin aux transmissions.",
        },
      ],
      [
        {
          de: "Anthéa Galmiche",
          role: "Infirmière",
          texte: "Donc, en semaine 11, c'est 12 heures pour tout le monde. Je vais devoir choisir.",
        },
      ],
      [
        {
          de: "Riwanon Ravaillé",
          role: "Infirmière, porte-parole des volontaires",
          texte:
            "Retour à la case départ. Je ne sais pas comment je vais l'annoncer aux volontaires.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Ce que vous proposez pour janvier",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Médéric Amegavi",
        role: "Directeur de la clinique",
        heure: "08:45",
        alerte: true,
        texte:
          "Le directoire arrête les plannings de janvier le mois prochain. Qu'est-ce que vous proposez, pour votre unité et pour la clinique ?",
      },
      {
        de: "Tableau de suivi de l'unité",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 11 : ${ctx.ei} événements indésirables pour 1 000 journées (niveau habituel : ${nombre((EI_BASE / JOURNEES) * 1000)}), absentéisme ${ctx.absenteisme}, ${ctx.vacants} postes vacants.`,
      },
    ],
    sources: [
      {
        id: "bilan",
        titre: "Faire le bilan chiffré du trimestre avec la responsable qualité",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.indicateurs && ctx.aTourne
            ? `Le tableau de suivi répond aux questions de septembre : chevauchements, erreurs heure par heure (${ctx.excesPct} de plus après la dixième heure avec la trame de départ${ctx.corrige ? ", moins depuis la correction" : ""}), absences, candidatures. Chaque événement indésirable évité vaut ${euros(COUT_EI)} (journées de séjour, analyse, prise en charge). De quoi dire ce qu'il faut garder, corriger ou abandonner, et le présenter au CSE.`
            : "Sans indicateurs relevés avant et pendant, le bilan tient en impressions : les uns sont ravis, les autres épuisés. Rien ne permet de dire ce qu'il faut garder.",
      },
      {
        id: "neurologie",
        titre: "Demander à Hugolin Cottineau, cadre de l'unité de neurologie, ce qu'il en pense",
        cout: 0.5,
        nature: "utile",
        resultat: `Hugolin : « Si c'est le même protocole, un secteur, des volontaires, des indicateurs et le CSE avant, je suis prêt à essayer. Mon équipe a beaucoup de parents de jeunes enfants : je ne veux pas qu'on leur impose quoi que ce soit. » Il estime à ${pct(PROBA_UNITE_B)} environ ses chances de réunir assez de volontaires.`,
      },
    ],
    question: "Que proposez-vous pour janvier ?",
    options: [
      {
        t: "Généraliser les 12 heures à toute la clinique en janvier",
        d: "Les trois unités, toutes les équipes, sur la trame actuelle. Un seul modèle pour recruter.",
      },
      {
        t: "Présenter le bilan chiffré au CSE, garder ce qui a fait ses preuves, et proposer une expérimentation à la neurologie",
        d: "Selon les chiffres : maintenir, corriger ou abandonner, avec l'avis du CSE. Hugolin Cottineau décidera avec son équipe.",
      },
      {
        t: "Revenir aux 7 h 30 partout en janvier",
        d: "On ferme le sujet pour de bon.",
      },
      {
        t: "Prolonger l'organisation actuelle trois mois sans trancher",
        d: "On en reparlera au printemps.",
      },
    ],
    reactions: [
      [
        {
          de: "Norbert Guillemaud",
          role: "Secrétaire du CSE",
          texte:
            "Une généralisation à toute la clinique est un projet important : le CSE demandera à être consulté, et se réserve de voter une expertise.",
        },
      ],
      null,
      [
        {
          de: "Riwanon Ravaillé",
          role: "Infirmière, porte-parole des volontaires",
          texte:
            "Les volontaires sont déçus. Deux d'entre eux ont déjà regardé les annonces du CHU.",
        },
      ],
      [
        {
          de: "Térence Mabru",
          role: "Responsable des ressources humaines de la clinique",
          texte:
            "Les candidats me demandent si les postes en 12 heures existeront encore au printemps. Je ne sais pas quoi leur répondre.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Expérimenter et mesurer", chemin: [1, 1, 0, 1, 1, 1] },
  { nom: "Généraliser au 1er octobre", chemin: [0, 0, 1, 3, 2, 0] },
  { nom: "Attentiste", chemin: [3, 0, 1, 0, 0, 3] },
] as const;

/**
 * Les options qui tranchent par principe, sans mesurer : imposer les 12 heures (à la clinique, à
 * l'unité, sans consulter le CSE, aux autres unités) ou les refuser (d'emblée, au premier doute,
 * en revenant aux 7 h 30). [décision, option]. Passer toute l'unité en 12 heures en semaine 11
 * (D5) n'y figure pas : il vient après une expérimentation, et le bilan le juge proche de la
 * meilleure option sur le meilleur chemin.
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [0, 3],
  [2, 1],
  [3, 2],
  [3, 3],
  [4, 3],
  [5, 0],
  [5, 2],
] as const;

export const REPONSES = {
  uniteBAccepte:
    "J'en ai parlé à mon équipe : huit volontaires pour un secteur, et le même protocole que le vôtre. On présente le projet au CSE de janvier.",
  uniteBRefuse:
    "J'ai consulté mon équipe : pas assez de volontaires pour tenir un secteur. On en reparlera après votre bilan de printemps.",
} as const;
