/**
 * FORMER SES PROPRES SOIGNANTS — le contenu de l'épisode.
 *
 * Prisca Echeverria est responsable formation et compétences de l'Association
 * Solvanne, au siège de Dijon. À la rentrée, 34 postes d'aides-soignants sont
 * vacants, et 40 des 110 agents de service hospitaliers font fonction
 * d'aide-soignant sans en avoir le diplôme. Six décisions, de septembre à
 * novembre, chacune précédée de ce qu'une responsable formation reçoit
 * vraiment : la directrice générale, le conseiller de l'OPCO, la directrice de
 * l'IFAS, les cadres de santé, la responsable qualité, les tutrices, les agents
 * eux-mêmes.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles donnent
 * sont calculés sur le modèle (src/engine/episodes/former-ses-soignants.ts).
 *
 * Un événement indésirable grave touche une résidente : il se dit sobrement,
 * sans faute individuelle mise en scène. Le faisant fonction est une
 * organisation que l'employeur a construite, pas une faute des agents.
 *
 * Association, institut, personnes et chiffres sont fictifs.
 */
import {
  APPRENTI,
  APPRENTI_RESTE,
  BINOMES_DE_NUIT,
  BUDGET_SEMAINE,
  CAMPAGNE,
  COUT_VACANCE_SEMAINE,
  COUVERTURE,
  DISTANCE,
  FAISANT_FONCTION,
  FF_NUIT,
  FORMATION_TUTRICE,
  HEURES_TUTRICE,
  INSPECTION,
  INSTITUT,
  INSTITUT_NET,
  MAINTIEN,
  MODULES,
  NOUVELLES_TUTRICES,
  ORCHIDIA,
  PILOTE,
  PLACES_PAR_TUTRICE,
  POSTES_VACANTS,
  SURCOUT_INTERIM,
  TAUX_HORAIRE_TUTRICE,
  TUTRICES,
  VAE,
  VAE_NET,
  AGENTS_DE_SERVICE,
} from "@/engine/episodes/former-ses-soignants";
import { euros, nombre, taux } from "./format";
import type { Etape } from "./types";

const URSULE = { de: "Ursule Mauvernay", role: "Directrice générale" } as const;
const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice administrative et financière",
} as const;
const MADELEINE = {
  de: "Madeleine Sirugue",
  role: "Directrice qualité et gestion des risques, siège",
} as const;
const ISAIE = { de: "Isaïe Bazerolles", role: "Conseiller emploi-formation, OPCO" } as const;
const APOLONIA = { de: "Apolonia Malecot", role: "Directrice de l'IFAS de Dijon" } as const;
const GHJULIA = { de: "Ghjulia Chaudenay", role: "Cadre de santé, EHPAD de Montbard" } as const;
const MAURICETTE = {
  de: "Mauricette Péclard",
  role: "Aide-soignante tutrice, EHPAD de Beaune",
} as const;
const NADJET = {
  de: "Nadjet Ouardiri",
  role: "Agente de service faisant fonction, Dijon-Grésilles",
} as const;
const WENDELINE = { de: "Wendeline Lagoutte", role: "Chargée de recrutement" } as const;
const CORNELIU = { de: "Corneliu Mainferme", role: "Délégué syndical" } as const;

/** Les chiffres que les sources affichent, calculés sur le modèle. */
export const PLACES_DE_TUTORAT = TUTRICES * PLACES_PAR_TUTRICE;
export const COUT_TUTRICES_SEMAINE = NOUVELLES_TUTRICES * HEURES_TUTRICE * TAUX_HORAIRE_TUTRICE;
export const FORMATION_TUTRICES_NETTE = (NOUVELLES_TUTRICES * FORMATION_TUTRICE) / 2;
export const COUT_NUIT_SANS_FF = FF_NUIT * SURCOUT_INTERIM;
export const COUT_BINOMES = BINOMES_DE_NUIT * SURCOUT_INTERIM;
export const APPORT_APPRENTI = APPRENTI.binome * SURCOUT_INTERIM;
export const APPORT_APPRENTI_SEUL = APPRENTI.seul * SURCOUT_INTERIM;
/** Ce que les huit candidats de la cohorte pilote couvriraient en faisant fonction à plein temps. */
export const APPORT_PILOTE_FF = 2 * SURCOUT_INTERIM;

export const DIAGNOSTICS = [
  {
    id: "penurie",
    t: "Le métier est en pénurie : on ne trouvera pas trente-quatre aides-soignants dehors, il faut qualifier nos propres agents, à commencer par ceux qui font déjà fonction",
  },
  {
    id: "glissement",
    t: "Le faisant fonction est devenu l'organisation normale : un glissement de tâches qui expose les résidents et l'association",
  },
  {
    id: "attractivite",
    t: "Nos salaires et nos primes ne suivent pas : Orchidia et l'intérim attirent les aides-soignants que nous pourrions recruter",
  },
  {
    id: "recrutement",
    t: "Nos recrutements sont trop lents et trop discrets : il faut professionnaliser les campagnes et les annonces",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Trente-quatre postes vacants à la rentrée",
    jusqua: 2,
    messages: () => [
      {
        de: "Tableau de bord des ressources humaines",
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte: `Postes d'aides-soignants vacants : ${POSTES_VACANTS}. Agents de service faisant fonction d'aide-soignant : ${FAISANT_FONCTION} sur ${AGENTS_DE_SERVICE}. Intérim et heures supplémentaires la semaine dernière : ${euros(COUT_VACANCE_SEMAINE)}, pour ${euros(BUDGET_SEMAINE)} prévus à l'EPRD.`,
      },
      {
        ...URSULE,
        heure: "08:45",
        texte:
          "Prisca, c'est la rentrée des instituts : septembre à novembre, c'est maintenant que se décident les parcours de l'année. Je veux ton plan vendredi. L'enveloppe de la rentrée, 60 k€ hors OPCO, n'en financera qu'un. Le conseil d'administration me demande pourquoi l'intérim a doublé en deux ans.",
      },
      {
        ...GHJULIA,
        heure: "09:20",
        texte:
          "Cette nuit encore : une agente de service faisant fonction et une aide-soignante d'intérim qui ne connaît pas les résidents, pour soixante-dix résidents. Je fais les plannings avec ce que j'ai.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "marche",
        titre: "Relire le bilan de la campagne de recrutement de l'an dernier",
        cout: 1,
        nature: "decisive",
        resultat: `${WENDELINE.de}, chargée de recrutement : « Prime d'embauche de 2 000 €, annonces, deux salons : 14 000 € de campagne. Cinq aides-soignantes signées en quatre mois, dont trois venues d'EHPAD voisins. Trois sont parties avant un an, deux chez Orchidia. » Dans les instituts de la région, 92 % des élèves aides-soignants ont un employeur avant leur diplôme : celui qui a financé leur parcours ou les a pris en apprentissage. Sur les cinq dernières années, ${taux(MAINTIEN.externe, 0)} des recrues externes de l'association sont encore là un an après leur arrivée.`,
      },
      {
        id: "parcours",
        titre: "Faire le point avec le conseiller de l'OPCO sur les parcours qualifiants",
        cout: 1,
        nature: "decisive",
        resultat: `${ISAIE.de} : « VAE accompagnée : ${euros(VAE.frais)} par candidat, dont ${euros(VAE.opco)} pris en charge par l'OPCO, environ ${VAE.mois} mois jusqu'au jury. Sur cent candidats accompagnés, ${nombre(VAE.totale * 100)} obtiennent une validation totale au premier jury, ${nombre(VAE.partielle * 100)} une validation partielle, les autres abandonnent ou échouent ; ${nombre(VAE.completent * 10)} validations partielles sur dix complètent les blocs manquants dans les dix-huit mois. Formation complète à l'institut : ${euros(INSTITUT.frais)}, dont ${euros(INSTITUT.opco)} pour nous, et le salaire pris en charge pendant les ${INSTITUT.mois} mois de formation ; ${nombre(INSTITUT.reussite * 10)} sur dix sont diplômés, mais l'agent quitte le terrain. Apprentissage : dix-huit mois, formation financée, salaire à votre charge. Et les diplômés formés chez leur employeur restent : ${nombre(MAINTIEN.interne * 10)} sur dix y sont encore un an après. »`,
      },
      {
        id: "faisant",
        titre: "Demander à la responsable qualité ce que représente le faisant fonction",
        cout: 0.5,
        nature: "utile",
        resultat: `${MADELEINE.de} : « ${FAISANT_FONCTION} agents de service font fonction, soit ${nombre(COUVERTURE.faisantFonction)} équivalents temps plein, dont ${nombre(FF_NUIT)} la nuit. Sur les onze événements indésirables graves de l'an dernier où un agent faisait fonction, sept sont survenus la nuit : des chutes pendant un transfert, surtout. Le CPOM nous demande de résorber le faisant fonction ; en inspection, l'ARS regarde s'il est encadré, et s'il existe un plan pour qualifier les agents. »`,
      },
      {
        id: "salaires",
        titre: "Comparer nos salaires d'aides-soignants à ceux d'Orchidia et de l'hôpital",
        cout: 1,
        nature: "bruit",
        resultat: `${EUDOXIE.de} : « À ancienneté égale, nos aides-soignants gagnent 1 % de moins qu'à Orchidia Résidences et 2 % de plus qu'au centre hospitalier, revalorisations comprises. Orchidia verse une prime d'embauche ; nous, pas cette année. »`,
      },
      {
        id: "conseil",
        titre: "Demander conseil à Ursule Mauvernay",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Ursule : « Avant de chercher des diplômés qui n'existent pas, regarde qui fait déjà le travail chez nous, et ce qu'il lui faudrait pour en avoir le diplôme. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quel plan proposez-vous pour la rentrée ?",
    options: [
      {
        t: "Lancer une campagne de recrutement externe, avec une prime d'embauche",
        d: `${euros(CAMPAGNE.prime)} par aide-soignant diplômé recruté, annonces, salons, cooptation : ${euros(CAMPAGNE.frais)} de campagne. Les premières recrues dans un mois.`,
      },
      {
        t: "Engager vingt agents faisant fonction dans une VAE accompagnée",
        d: `Les vingt volontaires les plus expérimentés : un accompagnateur, deux heures par semaine remplacées, un jury dans dix mois. ${euros(VAE_NET)} par candidat après l'OPCO.`,
      },
      {
        t: "Envoyer dix agents de service en formation complète à l'institut",
        d: `Dix mois à l'IFAS de Dijon, salaire pris en charge par l'OPCO. ${euros(INSTITUT_NET)} par agent après l'OPCO, et dix agents de moins sur le terrain.`,
      },
      {
        t: "Tenir avec l'intérim et le faisant fonction, en attendant des candidats",
        d: "Pas de dépense nouvelle. Les agents de service continuent de faire fonction là où il manque un aide-soignant.",
      },
    ],
    reactions: [
      [
        {
          ...WENDELINE,
          texte:
            "L'annonce part demain sur les sites d'emploi, et nous aurons un stand au salon de Dijon. Orchidia en aura un aussi, juste en face.",
        },
      ],
      [
        {
          ...NADJET,
          texte:
            "Huit ans que je fais les toilettes et les transferts sans le diplôme. Si on m'aide pour le livret, j'y vais. Nous sommes vingt-six à avoir levé la main.",
        },
      ],
      [
        {
          ...APOLONIA,
          texte:
            "Nous prenons vos dix agents à la rentrée. Ils feront leurs stages dans vos EHPAD une partie de l'année.",
        },
      ],
      [
        {
          ...GHJULIA,
          texte: "Donc rien ne change. Je refais les plannings de novembre avec les mêmes trous.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Qui va suivre les parcours ?",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...MAURICETTE,
        heure: "13:40",
        alerte: true,
        texte: `Nous sommes ${TUTRICES} tutrices formées pour toute l'association, et j'ai déjà deux stagiaires de l'IFAS. Si on m'en confie d'autres, je les suivrai entre deux toilettes.`,
      },
      {
        de: "Tableau de bord des ressources humaines",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Personnes engagées dans un parcours qualifiant : ${ctx.parcours}. Postes d'aides-soignants vacants : ${ctx.vacants}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "tutorat",
        titre: "Compter les places de tutorat et ce que chaque parcours en demande",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Une tutrice suit deux parcours de front : ${TUTRICES} tutrices, ${PLACES_DE_TUTORAT} places. Un candidat VAE en prend une (le livret se construit avec une aide-soignante qui l'observe au travail), un apprenti une et demie, un agent à l'institut une demie pour ses stages, une recrue une demie pendant ses six semaines d'intégration. Le plan de la rentrée en occupera ${ctx.placesDuPlan} dès la semaine 3. Or l'IFAS annonce une rentrée en apprentissage en novembre, et la cohorte pilote de l'an dernier passe son jury le même mois. Au-delà des places, chaque candidat est moins suivi : dans les EHPAD où une tutrice suivait quatre candidats, un tiers n'a pas déposé son livret.`,
      },
      {
        id: "formation",
        titre: "Demander à l'OPCO ce que coûte la formation de tutrices",
        cout: 0.5,
        nature: "utile",
        resultat: `${ISAIE.de} : « Trois jours de formation de tuteur : ${euros(FORMATION_TUTRICE)} par personne, la moitié prise en charge. Pour ${NOUVELLES_TUTRICES} tutrices de plus, ${euros(FORMATION_TUTRICES_NETTE)} pour vous, puis leurs ${HEURES_TUTRICE} heures de tutorat par semaine à remplacer : ${euros(COUT_TUTRICES_SEMAINE)} par semaine. »`,
      },
    ],
    question: "Comment organisez-vous le suivi des parcours ?",
    options: [
      {
        t: "Former huit tutrices de plus et leur dégager deux heures par semaine",
        d: `Formation en semaines 3 et 4 (${euros(FORMATION_TUTRICES_NETTE)} après l'OPCO), puis ${euros(COUT_TUTRICES_SEMAINE)} par semaine d'heures remplacées. ${NOUVELLES_TUTRICES * PLACES_PAR_TUTRICE} places de plus.`,
      },
      {
        t: "Confier le suivi aux cadres de santé, en plus de leur travail",
        d: "Rien à payer. Chaque cadre prendra quelques candidats, entre deux plannings.",
      },
      {
        t: "Faire accompagner les candidats VAE à distance par un organisme",
        d: `${euros(DISTANCE.frais)} par candidat : des séances en visioconférence pour écrire le livret. Les tutrices gardent le reste.`,
      },
      {
        t: "Garder les quatorze tutrices actuelles",
        d: "Elles se répartiront les parcours comme d'habitude.",
      },
    ],
    reactions: [
      [
        {
          ...MAURICETTE,
          texte:
            "Deux heures par semaine, inscrites au planning : là, je peux vraiment suivre quelqu'un. Les nouvelles tutrices commencent leur formation lundi.",
        },
      ],
      [
        {
          ...GHJULIA,
          texte:
            "Je prendrai deux candidates. Je les verrai quand je pourrai, honnêtement : les plannings passent avant.",
        },
      ],
      [
        {
          ...NADJET,
          texte:
            "Les séances en visioconférence aident à écrire. Mais personne ne me regarde faire un soin pour me dire ce qui manque.",
        },
      ],
      [
        {
          ...MAURICETTE,
          texte: "On fera comme d'habitude : chacune ce qu'elle peut.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · jeudi",
    titre: "Une chute la nuit à Montbard",
    jusqua: 6,
    messages: () => [
      {
        ...MADELEINE,
        heure: "08:10",
        alerte: true,
        texte:
          "Événement indésirable grave déclaré à l'EHPAD de Montbard, dans la nuit de mardi : une résidente a chuté pendant un transfert du lit au fauteuil, fait seule par une agente de service faisant fonction. Fracture du poignet, deux jours d'hospitalisation. Elle est revenue parmi nous ; sa famille a écrit à l'ARS.",
      },
      {
        ...GHJULIA,
        heure: "09:30",
        texte:
          "L'aide-soignante d'intérim était à l'autre étage. L'agente a fait ce qu'on lui demande toutes les nuits. Elle est effondrée.",
      },
      {
        ...URSULE,
        heure: "11:00",
        texte:
          "L'ARS peut venir d'ici la fin du trimestre. Qu'est-ce qu'on change, concrètement, au faisant fonction ?",
      },
    ],
    sources: [
      {
        id: "analyse",
        titre: "Lire l'analyse des causes de la chute",
        cout: 0.5,
        nature: "decisive",
        resultat: `${MADELEINE.de} : « Pas de faute individuelle : la nuit à Montbard repose sur une agente faisant fonction et une intérimaire. Le verticalisateur demande deux personnes ; seule, l'agente n'avait pas le choix. Sur nos ${nombre(COUVERTURE.faisantFonction)} équivalents temps plein de faisant fonction, ${nombre(FF_NUIT)} sont de nuit, et la nuit porte l'essentiel du risque. Un binôme de nuit, où l'agent de service ne fait jamais seul un transfert ni un soin d'aide-soignant, demande ${BINOMES_DE_NUIT} poste d'intérim de nuit, soit ${euros(COUT_BINOMES)} par semaine ; supprimer tout faisant fonction la nuit en demande ${nombre(FF_NUIT)}, soit ${euros(COUT_NUIT_SANS_FF)} par semaine. »`,
      },
      {
        id: "inspection",
        titre: "Appeler le directeur de l'EHPAD d'Auxonne, inspecté l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `« L'ARS a regardé trois choses : qui fait quoi la nuit, les fiches de tâches des agents de service, et le plan pour les qualifier. Un faisant fonction encadré, avec des agents engagés dans un diplôme, nous a valu des recommandations ; un établissement voisin, sans plan, a eu une injonction sur ses nuits. Là où le faisant fonction tient toute l'organisation, c'est une injonction d'y mettre fin : ${nombre(INSPECTION.semaines)} semaines d'intérim à payer le temps de se réorganiser. » ${
            ctx.plan
              ? "Votre plan de qualification de la rentrée est déjà engagé."
              : "Vous n'avez engagé aucun parcours qualifiant à la rentrée."
          }`,
      },
      {
        id: "juriste",
        titre: "Consulter le juriste de l'association sur une sanction",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Une sanction serait fragile : le glissement de tâches est organisé par l'employeur, qui en porte la responsabilité. Elle ferait surtout une chose : que plus personne ne déclare d'événement indésirable. »",
      },
    ],
    question: "Que changez-vous au faisant fonction ?",
    options: [
      {
        t: "Supprimer le faisant fonction la nuit : une aide-soignante d'intérim sur chaque nuit concernée",
        d: `${nombre(FF_NUIT)} postes d'intérim de nuit, ${euros(COUT_NUIT_SANS_FF)} par semaine. Le jour, des fiches de tâches et des binômes.`,
      },
      {
        t: "Encadrer le faisant fonction : ce qu'un agent de service ne fait jamais seul, et des binômes de nuit",
        d: `Des fiches de tâches, un binôme pour les transferts de nuit (un poste d'intérim, ${euros(COUT_BINOMES)} par semaine), et les agents qui font fonction en priorité dans les parcours.`,
      },
      {
        t: "Rappeler la règle par note de service, et continuer",
        d: "Une note à tous les EHPAD. Les plannings ne changent pas.",
      },
      {
        t: "Engager une procédure disciplinaire contre l'agente",
        d: "Un avertissement pour un transfert fait seule. Un message clair aux équipes.",
      },
    ],
    reactions: [
      [
        {
          ...GHJULIA,
          texte:
            "Une aide-soignante diplômée chaque nuit : les équipes de nuit respirent. La facture d'intérim, elle, grimpe.",
        },
      ],
      [
        {
          ...NADJET,
          texte:
            "On sait enfin ce qu'on a le droit de faire seules. La nuit, on attend l'aide-soignante pour lever un résident, même si ça prend dix minutes.",
        },
      ],
      [
        {
          ...CORNELIU,
          texte:
            "Une note de service ne met pas une aide-soignante de plus la nuit. Les agents feront comme avant, parce qu'ils n'ont pas le choix.",
        },
      ],
      [
        {
          ...CORNELIU,
          texte:
            "Vous sanctionnez une agente pour ce que le planning lui demande. Les agents ne déclareront plus rien, et vos candidates en VAE se demandent si elles ont envie de rester.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "L'IFAS ouvre une rentrée en apprentissage",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...APOLONIA,
        heure: "10:15",
        alerte: true,
        texte:
          "L'IFAS ouvre en novembre une rentrée en apprentissage : dix-huit mois, la formation est financée par l'OPCO. Je peux vous réserver jusqu'à dix places. Il me faut votre réponse la semaine prochaine.",
      },
      {
        ...WENDELINE,
        heure: "14:00",
        texte:
          "J'ai déjà quatorze candidatures d'apprentis, dont six adultes en reconversion. Orchidia a réservé douze places.",
      },
      {
        de: "Tableau de bord des ressources humaines",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Places de tutorat occupées : ${ctx.chargeTexte} sur ${ctx.capacite}. Postes vacants : ${ctx.vacants}.`,
      },
    ],
    sources: [
      {
        id: "charge",
        titre: "Recompter les places de tutorat pour novembre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Aujourd'hui, ${ctx.chargeTexte} places sont prises sur ${ctx.capacite}. Dix apprentis en prendraient quinze, cinq en prendraient sept et demie, à partir de la semaine 9. La cohorte pilote passe son jury en semaine 10 : si l'on finance des modules à ses candidats en validation partielle, ils prendront ${nombre(PILOTE.partielle / 2)} places de plus. Au-delà des places, ce ne sont pas les derniers arrivés qui sont moins suivis, ce sont tous les candidats : la réussite baisse et les abandons montent pour tout le monde.`,
      },
      {
        id: "cout",
        titre: "Chiffrer un apprenti avec la directrice financière",
        cout: 0.5,
        nature: "utile",
        resultat: `${EUDOXIE.de} : « Un apprenti coûte ${euros(APPRENTI.salaire)} par semaine, salaire chargé : beaucoup sont adultes. En binôme, à partir de sa troisième semaine, il apporte un peu moins d'un tiers de poste : ${euros(APPORT_APPRENTI)} d'intérim évité par semaine. Sur ses dix-huit mois, il restera ${euros(APPRENTI_RESTE)} à notre charge après le trimestre. ${nombre(APPRENTI.reussite * 10)} apprentis suivis sur dix sont diplômés. »`,
      },
    ],
    question: "Combien d'apprentis prenez-vous ?",
    options: [
      {
        t: "Prendre dix apprentis",
        d: `Dix contrats de dix-huit mois, chacun avec une tutrice nommée. ${euros(APPRENTI.salaire)} par semaine et par apprenti.`,
      },
      {
        t: "Prendre cinq apprentis",
        d: "Cinq contrats, chacun avec une tutrice nommée.",
      },
      {
        t: "Ne pas prendre d'apprentis cette année",
        d: "Les parcours en cours suffisent.",
      },
      {
        t: "Prendre dix apprentis et les compter dans l'effectif soignant dès leur arrivée",
        d: `Ils tiennent presque un poste chacun tout de suite : ${euros(APPORT_APPRENTI_SEUL)} d'intérim évité par semaine et par apprenti.`,
      },
    ],
    reactions: [
      [
        {
          ...APOLONIA,
          texte:
            "Dix places réservées. Chaque apprenti aura sa tutrice nommée : je viendrai vérifier en décembre.",
        },
      ],
      [
        {
          ...APOLONIA,
          texte: "Cinq places réservées. Les cinq autres iront à Orchidia, qui en demande.",
        },
      ],
      [
        {
          ...WENDELINE,
          texte:
            "Je préviens les quatorze candidats. Plusieurs ont déjà une proposition d'Orchidia.",
        },
      ],
      [
        {
          ...MAURICETTE,
          texte:
            "Ils arrivent lundi et ils sont déjà au planning, seuls sur des chambres. Ils ne sont pas là pour boucher les trous.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Orchidia ouvre à Chenôve",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...WENDELINE,
        heure: "09:05",
        alerte: true,
        texte:
          "Orchidia Résidences ouvre le mois prochain un EHPAD de cent dix places à Chenôve, avec une prime d'embauche de 4 000 € pour les aides-soignants. Trois de nos aides-soignantes de Dijon-Grésilles ont posé leur démission : Safiatou Koïta, Tamara Ostafi et Begoña Vaudable.",
      },
      {
        ...CORNELIU,
        heure: "11:30",
        texte:
          "Si vous payez pour retenir celles qui partent, celles qui restent vont demander pourquoi elles n'ont rien.",
      },
      {
        de: "Tableau de bord des ressources humaines",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Postes d'aides-soignants vacants : ${ctx.vacants}. Diplômés attendus d'ici dix-huit mois : ${ctx.diplomes}.`,
      },
    ],
    sources: [
      {
        id: "entretiens",
        titre: "Recevoir les trois aides-soignantes",
        cout: 0.5,
        nature: "decisive",
        resultat: `Toutes trois sont arrivées il y a un an avec la prime de 2 000 €, désormais acquise. Safiatou : « La prime, c'est bien, mais ce qui m'use, ce sont les plannings changés la veille. » Tamara voudrait transmettre : « Cet été, j'ai formé deux intérimaires ; personne ne l'a su. » Begoña habite Chenôve. Dans les établissements de l'association, une contre-offre de prime a retenu ${nombre(ORCHIDIA.reste[0]! * 5)} partantes sur cinq, un rôle de tutrice reconnu ${nombre(ORCHIDIA.reste[1]! * 5)} sur cinq, une mutation de jour un peu moins d'une sur deux. Mais un an plus tard, ${taux(MAINTIEN.externe, 0)} seulement de celles qu'une prime avait retenues étaient encore là, contre ${taux(MAINTIEN.tutrice, 0)} des tutrices.`,
      },
      {
        id: "prime",
        titre: "Chiffrer l'alignement sur Orchidia",
        cout: 0.5,
        nature: "utile",
        resultat: `${EUDOXIE.de} : « S'aligner, c'est ${euros(ORCHIDIA.primeRetention)} à chacune des trois pour rester, et la prime d'embauche à ${euros(CAMPAGNE.primeAlignee)}. Les autres l'apprendront : à Chalon, l'an dernier, une prime de rétention a valu neuf demandes d'alignement en un mois, et ${euros(ORCHIDIA.iniquite)} pour les apaiser. Un rôle de tutrice, avec la formation et une prime de tutorat de 100 € par mois, revient à ${euros(ORCHIDIA.tutorat)} par personne sur l'année. »`,
      },
    ],
    question: "Que proposez-vous aux trois aides-soignantes ?",
    options: [
      {
        t: "S'aligner sur Orchidia : une prime pour rester, et la prime d'embauche à 4 000 €",
        d: `${euros(ORCHIDIA.primeRetention)} à chacune si elle reste. Les prochaines recrues toucheront ${euros(CAMPAGNE.primeAlignee)}.`,
      },
      {
        t: "Leur proposer un rôle de tutrice reconnu, avec des plannings stables",
        d: `Formation de tutrice, prime de tutorat, plannings fixés un mois à l'avance : ${euros(ORCHIDIA.tutorat)} par personne sur l'année.`,
      },
      {
        t: "Les laisser partir et compter sur l'intérim",
        d: "Trois postes de plus à couvrir dès la semaine 10.",
      },
      {
        t: "Leur proposer une mutation dans l'EHPAD de leur choix, sur un poste de jour",
        d: "Rien à payer. Il faut trouver trois postes de jour qui se libèrent.",
      },
    ],
    reactions: [
      null,
      null,
      [
        {
          ...WENDELINE,
          texte:
            "Les trois partent à la fin de la semaine 9. J'ai demandé trois intérimaires à Soralis Intérim Santé.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le jury de la cohorte pilote",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Service formation et compétences",
        role: "Siège",
        heure: "09:00",
        alerte: true,
        texte: `Résultats du jury de VAE de novembre pour la cohorte pilote de l'an dernier : sur ${PILOTE.candidats} candidats, ${PILOTE.totale} validations totales — ils prendront un poste d'aide-soignant en semaine 12 — et ${PILOTE.partielle} validations partielles.`,
      },
      {
        ...GHJULIA,
        heure: "11:20",
        texte:
          "Les huit sont à un ou deux blocs du diplôme. Le plus simple, ce serait de les mettre sur des postes d'aide-soignant, nuits comprises : ils savent faire.",
      },
      {
        de: "Tableau de bord des ressources humaines",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Places de tutorat occupées : ${ctx.chargeTexte} sur ${ctx.capacite}. Diplômés attendus d'ici dix-huit mois : ${ctx.diplomes}.`,
      },
    ],
    sources: [
      {
        id: "jury",
        titre: "Lire les résultats bloc par bloc avec la directrice de l'IFAS",
        cout: 0.5,
        nature: "decisive",
        resultat: `${APOLONIA.de} : « Il manque à chacun un ou deux blocs, presque toujours les soins et l'évaluation de l'état de la personne. L'IFAS ouvre en janvier des modules courts sur ces blocs : ${euros(MODULES.frais)} par candidat après l'OPCO, et une demi-place de tutorat pendant les stages. Avec les modules et une tutrice, ${taux(MODULES.reussite, 0)} valident dans l'année ; seuls, ${taux(MODULES.seul, 0)} ; maintenus en faisant fonction sur des postes d'aide-soignant, nuits comprises, sans temps pour préparer, ${taux(MODULES.ff, 0)}. La formation complète en diplôme ${taux(MODULES.institut, 0)}, mais les retire du terrain dix mois. »`,
      },
      {
        id: "planning",
        titre: "Compter ce que les huit apporteraient aux plannings",
        cout: 0.5,
        nature: "utile",
        resultat: `${GHJULIA.de} : « En faisant fonction à plein temps, nuits comprises, les huit couvriraient deux postes d'aide-soignant : ${euros(APPORT_PILOTE_FF)} d'intérim de moins par semaine. Mais ce seraient huit agents non diplômés de plus sur des soins d'aide-soignant, et deux de plus la nuit. »`,
      },
    ],
    question: "Que proposez-vous aux huit candidats en validation partielle ?",
    options: [
      {
        t: "Financer les modules manquants à l'IFAS, avec une tutrice pour chacun",
        d: `${euros(MODULES.frais)} par candidat après l'OPCO, et une demi-place de tutorat chacun dès la semaine 11.`,
      },
      {
        t: "Les laisser préparer seuls un nouveau passage devant le jury",
        d: "Rien à payer. Ils ont cinq ans pour valider les blocs manquants.",
      },
      {
        t: "Les placer sur des postes d'aide-soignant, nuits comprises, en attendant",
        d: `Deux postes d'intérim de moins, ${euros(APPORT_PILOTE_FF)} par semaine. Ils ont presque le diplôme.`,
      },
      {
        t: "Les inscrire en formation complète à l'institut",
        d: `${euros(INSTITUT_NET)} par agent après l'OPCO, et dix mois hors du terrain à partir de janvier.`,
      },
    ],
    reactions: [
      [
        {
          de: "Oumayma Gaudrat",
          role: "Agente faisant fonction, cohorte pilote",
          texte:
            "Deux blocs, trois semaines de modules et une tutrice : je repasse en juin, et cette fois je l'aurai.",
        },
      ],
      [
        {
          ...GHJULIA,
          texte: "Ils réviseront le soir, après leurs postes. Certains vont laisser tomber.",
        },
      ],
      [
        {
          ...MADELEINE,
          texte:
            "Huit agents non diplômés de plus sur des postes d'aide-soignant, la nuit : c'est exactement ce que le CPOM nous demande de résorber.",
        },
      ],
      [
        {
          ...APOLONIA,
          texte:
            "Huit places réservées en janvier. Ils reprendront tout le programme, y compris ce qu'ils savent déjà.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Former ses soignants", chemin: [1, 0, 1, 0, 1, 0] },
  { nom: "Recruter dehors, à coups de primes", chemin: [0, 3, 2, 3, 0, 2] },
  { nom: "Attentiste", chemin: [3, 3, 2, 2, 2, 1] },
] as const;

/**
 * Les réflexes du métier en pénurie : recruter dehors à coups de primes, ou laisser des agents
 * non diplômés tenir des postes de soignants (le faisant fonction, les apprentis comptés dans
 * l'effectif, les candidats presque diplômés mis sur des postes d'aide-soignant). [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [2, 2],
  [3, 3],
  [4, 0],
  [5, 2],
] as const;

/** Ce que disent les trois aides-soignantes sollicitées par Orchidia, selon combien restent. */
export const PARTANTES = ["Safiatou Koïta", "Tamara Ostafi", "Begoña Vaudable"] as const;
