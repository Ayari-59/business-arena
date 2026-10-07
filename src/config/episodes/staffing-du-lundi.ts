/**
 * LE STAFFING DU LUNDI — le contenu de l'épisode.
 *
 * Aïssatou Ndour est responsable du staffing du bureau de Nantes d'Atlas
 * Conseil : soixante consultants, et chaque lundi des missions qui démarrent.
 * C'est la rentrée : huit analystes arrivent, trois associés réclament les
 * mêmes seniors, et Tempora annonce un mois d'octobre plein qui ne l'est pas.
 * Six décisions, de septembre à novembre, chacune précédée de ce qu'une
 * responsable du staffing reçoit vraiment.
 *
 * La leçon : affecter selon la valeur et le risque des missions (protéger
 * les missions critiques, faire grandir les juniors en binôme, employer
 * l'intercontrat à l'avant-vente et à la formation), pas « premier associé
 * arrivé, premier servi ». Chaque chiffre que donne une source est celui du
 * modèle (src/engine/episodes/staffing-du-lundi.ts).
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Etape, Message } from "./types";

export const DIAGNOSTICS = [
  {
    id: "valeurRisque",
    t: "Le staffing suit l'ordre des demandes des associés, pas la valeur et le risque des missions : les seniors vont là où ils comptent le moins",
  },
  {
    id: "reservations",
    t: "Les réservations de précaution des associés faussent le plan de charge et bloquent le staffing",
  },
  {
    id: "seniors",
    t: "Le bureau manque de seniors : il faut recruter ou faire appel à des indépendants",
  },
  {
    id: "juniors",
    t: "Les analystes arrivés en septembre ne sont pas encore facturables : ils plombent le taux d'occupation",
  },
] as const;

const HAUTECOEUR = {
  de: "Sosthène Hautecoeur",
  role: "Associé, Performance opérationnelle",
} as const;
const QUEMENEUR = {
  de: "Éléonore Quémeneur",
  role: "Associée, Organisation et transformation",
} as const;
const HAMELIN = {
  de: "Ladislas Hamelin",
  role: "Associé, Data et systèmes d'information",
} as const;
const LECOEUR = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
const QUERNE = { de: "Svetlana Querné", role: "Chargée de compte, Freelancia" } as const;
const OBINNA = { de: "Obinna Abiola", role: "Analyste, arrivé en septembre" } as const;

/** Ce que la première manager d'Obinna dit de lui, selon sa rentrée. */
const RENTREE_OBINNA: Record<string, string> = {
  binome:
    "Sa manager : « Six semaines en binôme : il anime un entretien seul, il structure bien. Des ateliers avec des élus, il n'en a jamais vu. »",
  formation:
    "Sa manager : « Deux semaines de formation, puis quatre en binôme : sérieux, méthodique, mais jamais encore face à des élus. »",
  seul: "Sa manager : « Seul chez un client depuis septembre, il a beaucoup appris à ses dépens : un livrable a dû être repris. Des élus, jamais. »",
};

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Trois associés, deux seniors",
    jusqua: 2,
    messages: () => [
      {
        de: "Tempora",
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte:
          "Plan de charge d'octobre : 91 % des jours disponibles sont staffés ou réservés. Huit analystes arrivent demain, mardi 1er septembre, sans mission.",
      },
      {
        ...HAUTECOEUR,
        heure: "08:05",
        texte:
          "Aïssatou, je t'ai écrit vendredi soir, je suis donc le premier : il me faut Gonzalo et Ombline chez Distrimer dès ce matin. Diagnostic des achats, huit semaines en régie. Client historique, je ne veux prendre aucun risque.",
      },
      {
        ...QUEMENEUR,
        heure: "08:40",
        texte:
          "Le forfait du centre hospitalier de l'Estuaire démarre aujourd'hui : 260 k€, les blocs opératoires, un comité de pilotage en semaine 7. Il me faut un pilote. Gonzalo, idéalement, mais Sosthène m'a dit qu'il le prenait.",
      },
      {
        ...HAMELIN,
        heure: "09:10",
        texte:
          "Je garde mes trois confirmés réservés jusqu'à fin novembre : Assurances Ligériennes peut signer d'un jour à l'autre. Et je prendrais bien deux analystes pour de la saisie de données.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "plan",
        titre: "Détailler le plan de charge d'octobre dans Tempora",
        cout: 1,
        nature: "decisive",
        resultat:
          "Octobre (semaines 6 à 9) : 20 jours ouvrés pour 60 consultants, moins 60 jours de congés posés, soit 1 140 jours disponibles. Tempora en montre 1 038 staffés : 91 %. Le détail : 786 jours sur des missions signées ; 72 jours sur trois propositions remises, en phase finale, qui se gagnent d'habitude une fois sur deux ; 180 jours réservés « par précaution » par des associés, sans proposition remise. Au printemps, aucun jour réservé par précaution n'a été facturé à la date prévue : quand la mission est venue, elle a démarré plus tard, avec d'autres consultants.",
      },
      {
        id: "fiches",
        titre: "Lire les fiches des missions qui démarrent",
        cout: 1,
        nature: "decisive",
        resultat:
          "Distrimer : régie, diagnostic des achats, deux consultants pendant huit semaines. Le client paie au profil : 1 100 € par jour pour un senior, 850 € pour un confirmé. Atlas en a fait quatorze de ce type, sans incident. Centre hospitalier de l'Estuaire : forfait de 260 k€, 260 jours prévus sur treize semaines, pénalité de retard de 1 % par semaine. Sur nos forfaits hospitaliers des trois dernières années, ceux pilotés par un senior ont dépassé leurs jours prévus de 3 % ; ceux pilotés par un confirmé, de 22 %, et un comité de pilotage sur deux y a tourné à la crise (18 k€ de reprise et de pénalités), contre moins d'un sur dix avec un senior. Le contrôle de gestion valorise un jour de dépassement à 400 €.",
      },
      {
        id: "juniors",
        titre: "Relire le bilan des analystes de l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Placés seuls, les analystes ont été facturés à 80 % dès septembre, mais ont dépassé d'un jour par semaine, et le client d'un sur trois s'est plaint (6 000 € d'avoir et de reprise). En binôme avec un confirmé, une demi-journée d'encadrement par semaine, ils ont été facturés à 60 % les trois premières semaines, 85 % jusqu'à fin octobre, 95 % ensuite, sans une plainte ; en novembre, ils tenaient seuls une partie de mission.",
      },
      {
        id: "preferences",
        titre: "Faire le tour des associés et classer les consultants qu'ils demandent",
        cout: 1,
        nature: "bruit",
        resultat:
          "Tous citent les mêmes : Gonzalo Meyrieux en tête, Ombline Rouxel ensuite, Jannick Corbineau pour les séminaires. Sosthène : « Gonzalo, c'est la garantie d'un client content. » Le classement dit qui est demandé, pas où il compte.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Victoire Lanoë",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Victoire : « Ne te demande pas qui a écrit le premier. Demande-toi où un senior évite le plus de dégâts, et ce que vaut vraiment ce qui est réservé dans Tempora. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment staffez-vous la rentrée ?",
    options: [
      {
        t: "Servir les associés dans l'ordre de leurs demandes",
        d: "Gonzalo et Ombline chez Distrimer, Sosthène ayant demandé le premier ; le CH piloté par Jannick Corbineau, confirmé ; les analystes placés seuls là où les associés en veulent.",
      },
      {
        t: "Staffer selon la valeur et le risque des missions",
        d: "Gonzalo pilote le CH ; Ombline et Jannick chez Distrimer ; chaque analyste en binôme avec un confirmé, une demi-journée d'encadrement par semaine.",
      },
      {
        t: "Gonzalo au CH, et les analystes d'abord en formation",
        d: "Ombline et Jannick chez Distrimer ; les huit analystes deux semaines chez Atlas Formation (4 000 €), puis en binôme.",
      },
      {
        t: "Faire arbitrer le comité des associés de lundi prochain",
        d: "Une semaine pour que les associés s'accordent entre eux ; les missions attendent leur équipe.",
      },
    ],
    reactions: [
      [
        { ...HAUTECOEUR, texte: "Parfait. Distrimer aura ce qu'on a de mieux." },
        {
          ...QUEMENEUR,
          texte:
            "Jannick est solide, mais il n'a jamais tenu un directoire d'hôpital. On verra au comité de pilotage.",
        },
      ],
      [
        {
          ...HAUTECOEUR,
          texte:
            "Ombline et Jannick ? Distrimer paiera moins cher, c'est déjà ça. S'il y a le moindre souci, je remonte.",
        },
        {
          de: "Gonzalo Meyrieux",
          role: "Senior manager",
          texte:
            "Je démarre au CH cet après-midi avec Éléonore. Le directeur des opérations nous attend.",
        },
      ],
      [
        {
          de: "Philothée Brézac",
          role: "Responsable d'Atlas Formation",
          texte:
            "Les huit analystes commencent demain : conduite d'entretien, modélisation des processus, tableur avancé. Ils seront staffables en semaine 3.",
        },
      ],
      [
        {
          ...QUEMENEUR,
          texte:
            "Le CH démarre sans pilote. Le directeur des opérations m'a déjà demandé qui serait son interlocuteur.",
        },
        { ...HAUTECOEUR, texte: "Une semaine de perdue chez Distrimer. Je n'en reviens pas." },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Une mission signée, personne pour la faire",
    jusqua: 4,
    messages: (ctx) => [
      {
        de: "Mariannick Kerdoncuff",
        role: "Directrice supply chain, Coopérative laitière du Bocage",
        heure: "10:15",
        alerte: true,
        texte:
          "Nous avons signé hier. Nous comptons sur trois consultants le lundi 21 septembre, pour neuf semaines.",
      },
      {
        de: "Tempora",
        role: "Recherche de disponibilités",
        heure: "10:30",
        texte: `Confirmés disponibles à partir de la semaine 4 : aucun. Trois confirmés de la practice Data sont réservés par Ladislas Hamelin jusqu'au 27 novembre (« Assurances Ligériennes, à confirmer »). Taux d'occupation du bureau en semaine 2 : ${ctx.occupation}.`,
      },
      {
        ...HAMELIN,
        heure: "11:00",
        texte:
          "Ne touche pas à mes trois-là. Ligériennes va signer, je le sens. S'ils signent et que je n'ai personne, c'est un client de trois ans que je perds.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "historique",
        titre: "Relire l'historique des réservations de Ladislas",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur ses dix dernières réservations « de précaution », trois ont débouché sur une mission. Pour Assurances Ligériennes, aucune proposition n'est remise : leur comité de direction décide jeudi prochain s'il lance le programme (160 k€ sur trois ans, 56 k€ de marge prévue). S'il signe, il démarre en semaine 7, avec des consultants qui connaissent leurs données : des indépendants ne feraient pas l'affaire.",
      },
      {
        id: "coop",
        titre: "Chiffrer la mission de la coopérative",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Trois confirmés à 850 € par jour, en régie : 12 750 € d'honoraires par semaine, des semaines 4 à 12. La coopérative a aussi consulté Kéroual Consulting : si nous demandons de décaler à novembre, elle partira une fois sur deux.",
      },
      {
        id: "freelancia",
        titre: "Demander ses tarifs à Freelancia",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Svetlana Querné : trois indépendants en supply chain disponibles en semaine 4, à 650 € par jour. Revendus 850 €, ils laissent 3 000 € de marge par semaine au bureau. Aucun profil data avant janvier.",
      },
    ],
    question: "Que faites-vous des trois confirmés réservés ?",
    options: [
      {
        t: "Respecter la réservation de Ladislas",
        d: "Les trois restent réservés ; vous proposez à la coopérative de démarrer en novembre.",
      },
      {
        t: "Lever la réservation et staffer la coopérative",
        d: "Les trois confirmés démarrent le 21 septembre. Si Ligériennes signe, Ladislas n'aura personne.",
      },
      {
        t: "Appeler Ligériennes avec Ladislas avant de trancher",
        d: "Vous attendez leur comité de jeudi : la coopérative démarre une semaine plus tard, avec les confirmés ou avec des indépendants selon la réponse.",
      },
      {
        t: "Staffer la coopérative avec des indépendants de Freelancia",
        d: "La réservation tient ; trois indépendants à 650 € par jour démarrent le 21 septembre.",
      },
    ],
    reactions: [
      null,
      [
        { ...HAMELIN, texte: "Tu prendras la responsabilité si Ligériennes signe." },
        {
          de: "Mariannick Kerdoncuff",
          role: "Directrice supply chain, Coopérative laitière du Bocage",
          texte: "Parfait, nous vous attendons lundi 21.",
        },
      ],
      null,
      [
        { ...QUERNE, texte: "Les trois consultants sont confirmés pour le 21 septembre." },
        {
          de: "Mariannick Kerdoncuff",
          role: "Directrice supply chain, Coopérative laitière du Bocage",
          texte: "Des indépendants ? Du moment que le travail est fait.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le creux d'octobre",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...LECOEUR,
        heure: "09:00",
        alerte: true,
        texte: `Le conseil départemental reporte sa mission à janvier. Cinq consultants sans mission du 5 au 30 octobre : un senior, deux confirmés, deux analystes. Taux d'occupation de la semaine 4 : ${ctx.occupation}.`,
      },
      {
        de: "Ottavio Dumaine",
        role: "Directeur des opérations, Halden Partners",
        heure: "11:20",
        texte:
          "Nous cherchons quatre consultants pour l'inventaire des données d'un assureur : saisie et contrôle, 450 € par jour, engagement ferme jusqu'au 27 novembre. Je peux signer lundi.",
      },
      {
        de: "Sterenn Le Scao",
        role: "Responsable des propositions",
        heure: "14:00",
        texte:
          "Trois propositions se jouent en octobre et en novembre. Comme d'habitude, on les écrira le soir, entre deux missions.",
      },
    ],
    sources: [
      {
        id: "pipeline",
        titre: "Faire le point sur les propositions en cours",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Achats Publics de l'Ouest, accord-cadre d'organisation des achats hospitaliers : 180 k€, décision en semaine 9, nos chances à 30 %. Mutuelle des Marais, pilotage des données de gestion : 120 k€, semaine 10, 35 %. Fonderies de la Sèvre, supply chain du site de Cholet : 90 k€, semaine 11, 40 %. Une mission signée laisse 35 % de marge. L'an dernier, les propositions préparées par des consultants dédiés (pré-diagnostic, mémoire technique, soutenance répétée) se sont gagnées vingt points plus souvent.",
      },
      {
        id: "novembre",
        titre: "Regarder le carnet de novembre",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "À partir du 2 novembre (semaine 10), le rush de fin d'année des clients privés demande tous les consultants disponibles : quatre confirmés et analystes de plus y seraient facturés 750 € par jour en moyenne. Ceux qui seront chez Halden n'y seront pas, et les missions gagnées d'ici là démarreraient avec des indépendants, pour 15 % de marge en moins.",
      },
      {
        id: "formation",
        titre: "Demander à Atlas Formation ce qu'elle propose",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Philothée Brézac : une certification en conduite de projet, en quatre semaines. Le marché d'Achats Publics de l'Ouest note les certifications de l'équipe proposée : avec une équipe certifiée, nos chances y gagneraient dix points. Pour les analystes, la certification améliore aussi leur facturation de novembre.",
      },
    ],
    question: "Que font les cinq consultants en octobre ?",
    options: [
      {
        t: "Accepter la sous-traitance de Halden Partners",
        d: "Quatre consultants à 450 € par jour jusqu'au 27 novembre : 9 000 € d'honoraires par semaine dès le 5 octobre.",
      },
      {
        t: "Les mettre sur l'avant-vente, et former les analystes",
        d: "Le senior et les deux confirmés préparent les trois propositions ; les deux analystes passent la certification. Pas d'honoraires en octobre.",
      },
      {
        t: "Les former tous chez Atlas Formation",
        d: "Quatre semaines de certification en conduite de projet pour les cinq. Pas d'honoraires en octobre.",
      },
      {
        t: "Les garder disponibles pour réagir vite",
        d: "Ils restent en intercontrat, prêts pour la première mission qui tombe.",
      },
    ],
    reactions: [
      [
        {
          de: "Ottavio Dumaine",
          role: "Directeur des opérations, Halden Partners",
          texte:
            "Signé. Vos quatre consultants commencent le 5 octobre chez notre client, jusqu'au 27 novembre.",
        },
        { ...LECOEUR, texte: "L'occupation d'octobre remonte de sept points." },
      ],
      [
        {
          de: "Sterenn Le Scao",
          role: "Responsable des propositions",
          texte:
            "Pour la première fois, les mémoires techniques sont écrits par des gens qui ont le temps. Le pré-diagnostic de la Mutuelle des Marais est déjà prêt.",
        },
      ],
      [
        {
          de: "Philothée Brézac",
          role: "Responsable d'Atlas Formation",
          texte: "Les cinq sont inscrits. Examen le 30 octobre.",
        },
      ],
      [
        {
          ...LECOEUR,
          texte:
            "Cinq consultants en intercontrat : près de 10 000 € de salaires par semaine sans honoraires en face.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Un analyste seul au Pays de Retz",
    jusqua: 8,
    messages: () => [
      {
        ...HAUTECOEUR,
        heure: "10:10",
        alerte: true,
        texte:
          "J'ai signé la cartographie des processus RH du Pays de Retz : forfait de 42 k€, sept semaines à partir de lundi. Obinna la fera seul : 35 jours d'analyste à 300 €, la mission est rentable à 75 %. Ne me colle pas un confirmé dessus.",
      },
      {
        ...OBINNA,
        heure: "12:30",
        texte: "Je suis partant. Je n'ai jamais animé un atelier avec des élus, mais j'apprendrai.",
      },
      {
        de: "Jacinthe Lostanlen",
        role: "Directrice générale adjointe, Pays de Retz",
        heure: "15:00",
        texte:
          "Les ateliers démarrent mardi avec les chefs de service. Le livrable passe en bureau communautaire fin novembre.",
      },
    ],
    sources: [
      {
        id: "premieres",
        titre: "Relire les forfaits confiés seuls à des analystes de première année",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Six sur dix ont dérapé ; quatre sur dix pour ceux qui avaient passé leur rentrée en binôme, un peu moins d'un sur deux après une formation. Un livrable refusé coûte vingt-cinq jours de reprise par un confirmé, pris sur la facturation de novembre (850 € le jour), et un avoir de 10 %. En binôme avec un confirmé une demi-journée par semaine, un sur vingt dérape, et la reprise est deux fois moindre.",
      },
      {
        id: "obinna",
        titre: "Faire le point avec Obinna et sa première manager",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) => RENTREE_OBINNA[String(ctx.rentree)] ?? RENTREE_OBINNA.seul!,
      },
      {
        id: "confirme",
        titre: "Chiffrer l'option d'un confirmé seul",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un confirmé ferait le forfait en trente jours, pris sur sa facturation (850 € le jour). Obinna irait sur une autre mission, facturé à 85 %.",
      },
    ],
    question: "Qui fait la mission du Pays de Retz ?",
    options: [
      {
        t: "Obinna seul, comme le demande Sosthène",
        d: "Un analyste à temps plein, sept semaines : la mission la plus rentable sur le papier.",
      },
      {
        t: "Obinna en binôme avec un confirmé",
        d: "Un confirmé l'encadre une demi-journée par semaine : 3,5 jours pris sur sa facturation.",
      },
      {
        t: "Un confirmé seul, Obinna sur une autre mission",
        d: "Trente jours de confirmé sur le forfait ; Obinna facturé ailleurs.",
      },
    ],
    reactions: [
      [{ ...OBINNA, texte: "C'est parti. Premier atelier mardi, je prépare tout ce week-end." }],
      [
        {
          ...HAUTECOEUR,
          texte: "Une demi-journée par semaine, soit. Mais c'est sur ta marge, pas sur la mienne.",
        },
        { ...OBINNA, texte: "Merci. Je préférais ne pas découvrir les élus tout seul." },
      ],
      [
        { ...HAUTECOEUR, texte: "Un confirmé sur une cartographie ? Tu me coûtes ma marge." },
        { ...OBINNA, texte: "Dommage. Je rejoins une mission de la practice lundi." },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "L'avenant des urgences",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...QUEMENEUR,
        heure: "09:30",
        alerte: true,
        texte: ctx.crise
          ? "Le comité de pilotage de la semaine 7 a été tendu, mais le directoire veut aller plus loin : un avenant de 48 k€ pour étendre la mission aux urgences, du 2 au 27 novembre. Il faut un senior, et vite."
          : "Le comité de pilotage s'est bien passé : le directoire signe un avenant de 48 k€ pour étendre la mission aux urgences, du 2 au 27 novembre. Il me faut un senior pour le piloter.",
      },
      {
        ...HAUTECOEUR,
        heure: "10:45",
        texte:
          "Distrimer prolonge en novembre : la mise en œuvre du plan fournisseurs. Ombline reste, évidemment : on ne change pas une équipe qui gagne.",
      },
      {
        de: "Tempora",
        role: "Recherche de disponibilités",
        heure: "11:00",
        texte:
          "Seniors disponibles en semaine 10 : aucun. Ombline Rouxel est chez Distrimer jusqu'au 27 novembre.",
      },
    ],
    sources: [
      {
        id: "suite",
        titre: "Lire le compte rendu de Distrimer et le cahier des charges de la suite",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le diagnostic est validé ; la suite, c'est la mise en œuvre du plan fournisseurs : des relances, des tableaux de suivi, des comités mensuels, que l'équipe a rodés. Le client paie au profil : avec Ombline et un confirmé, 9 750 € par semaine ; avec un confirmé et un analyste, 7 500 €. ${
            ctx.autonomes
              ? "Un des analystes de septembre, formé en binôme depuis la rentrée, tient seul le suivi fournisseurs depuis trois semaines."
              : "Aucun analyste n'est prêt à tenir seul le suivi : ceux de septembre, placés seuls, ont surtout appris à éteindre des incendies. Sans senior ni analyste autonome, le client se plaint six fois sur dix."
          }`,
      },
      {
        id: "avenants",
        titre: "Relire l'historique des avenants hospitaliers",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Un avenant de quinze jours par semaine piloté par un confirmé a dépassé ses jours de 25 % ; par un senior, de 3 %. La tranche optionnelle du CH (140 k€, soit 49 k€ de marge prévue) se décide après la restitution de la semaine 13 : un avenant mal tenu fait baisser nos chances de vingt points, un pilote indépendant ou un report, de dix.",
      },
      {
        id: "manager",
        titre: "Demander un manager à Freelancia",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Svetlana Querné : un manager du secteur hospitalier disponible le 2 novembre, à 1 000 € par jour. Il ne connaît ni l'équipe ni le directoire.",
      },
    ],
    question: "Qui pilote l'avenant des urgences ?",
    options: [
      {
        t: "Garder les équipes en place, et confier l'avenant à un confirmé",
        d: "Ombline reste chez Distrimer, comme le veut Sosthène ; un confirmé quitte le rush de novembre pour piloter les urgences.",
      },
      {
        t: "Basculer Ombline sur l'avenant, et confier Distrimer à un confirmé et un analyste",
        d: "La suite de Distrimer facturée 7 500 € par semaine au lieu de 9 750 € ; un analyste quitte le rush.",
      },
      {
        t: "Prendre un manager indépendant de Freelancia",
        d: "1 000 € par jour pendant quatre semaines ; les équipes ne bougent pas.",
      },
      {
        t: "Proposer au CH de décaler l'avenant en janvier",
        d: "Personne ne bouge ; les 48 k€ attendront le trimestre prochain.",
      },
    ],
    reactions: [
      [{ ...QUEMENEUR, texte: "Un confirmé pour les urgences… Le directoire va s'en apercevoir." }],
      [
        {
          ...HAUTECOEUR,
          texte: "Tu me prends Ombline en pleine mise en œuvre. Si Distrimer râle, je te l'envoie.",
        },
        {
          de: "Ombline Rouxel",
          role: "Consultante senior",
          texte: "Je connais l'équipe du CH : je démarre lundi 2 aux urgences.",
        },
      ],
      [
        { ...QUERNE, texte: "Notre manager démarre le 2 novembre au CH." },
        { ...QUEMENEUR, texte: "Un indépendant devant le directoire… Il faudra bien le briefer." },
      ],
      [
        {
          de: "Alaric Delhommeau",
          role: "Directeur des opérations, CH de l'Estuaire",
          texte: "Janvier ? Nous avions besoin de vous en novembre. Nous en tiendrons compte.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · lundi",
    titre: "La restitution et le séminaire",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...HAUTECOEUR,
        heure: "08:15",
        alerte: true,
        texte:
          "Distrimer veut un séminaire de direction en semaines 12 et 13 : dix jours en régie. J'ai demandé Gonzalo le premier, ce matin à 7 heures. Le client le connaît.",
      },
      {
        ...QUEMENEUR,
        heure: "08:50",
        texte: `La restitution au directoire du CH a lieu le 26 novembre : l'affermissement de la tranche optionnelle, 140 k€, s'y joue. Je veux un senior qui connaît le dossier pour la préparer et la tenir.${
          ctx.crise ? " Après le comité de crise d'octobre, nous n'avons pas droit à l'erreur." : ""
        }`,
      },
      {
        ...HAMELIN,
        heure: "09:20",
        texte:
          "Je réserve deux confirmés à partir du 16 novembre pour préparer un démarrage en janvier. Rien n'est signé, mais je veux qu'ils soient prêts.",
      },
    ],
    sources: [
      {
        id: "seminaire",
        titre: "Lire la demande de Distrimer",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Animation d'un séminaire de direction et synthèse des décisions : dix jours en régie. Le client paie au profil : 1 100 € le jour pour un senior, 850 € pour un confirmé. Jannick Corbineau a animé les trois derniers séminaires de ce type, avec d'excellents retours.",
      },
      {
        id: "restitutions",
        titre: "Relire les restitutions des tranches optionnelles",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur nos dernières tranches optionnelles hospitalières, une restitution tenue sans senior a fait baisser de vingt points les chances d'affermissement. La tranche du CH vaut 49 k€ de marge prévue.",
      },
      {
        id: "janvier",
        titre: "Demander à Ladislas où en est sa piste de janvier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Pas de proposition remise : « un premier rendez-vous en décembre ». Deux confirmés réservés deux semaines, c'est 17 000 € de facturation du rush qui ne se fera pas.",
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Servir les demandes : Gonzalo au séminaire, la réservation de janvier accordée",
        d: "Sosthène a demandé le premier ; Ladislas aura ses deux confirmés ; la restitution reste à l'équipe en place.",
      },
      {
        t: "Un senior sur la restitution, Jannick au séminaire, pas de réservation sans proposition",
        d: "Le séminaire facturé au tarif d'un confirmé ; les deux confirmés de Ladislas restent sur le rush.",
      },
      {
        t: "Un senior sur la restitution, Jannick au séminaire, la réservation de janvier accordée",
        d: "Le séminaire au tarif d'un confirmé ; deux confirmés mis de côté pour janvier.",
      },
    ],
    reactions: [
      [
        { ...HAUTECOEUR, texte: "Merci. Distrimer est ravi d'avoir Gonzalo." },
        {
          ...QUEMENEUR,
          texte: "Je tiendrai la restitution avec l'équipe. Sans senior, je ne promets rien.",
        },
      ],
      [
        {
          ...HAUTECOEUR,
          texte: "Jannick plutôt que Gonzalo… Le client sera content quand même, je suppose.",
        },
        { ...HAMELIN, texte: "Pas de réservation ? Tu me mets en difficulté pour janvier." },
        { ...QUEMENEUR, texte: "Merci. On prépare la restitution dès demain." },
      ],
      [
        { ...HAMELIN, texte: "Mes deux confirmés sont bloqués à partir du 16. Merci." },
        { ...QUEMENEUR, texte: "Merci pour la restitution." },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Staffer selon la valeur et le risque", chemin: [1, 2, 1, 1, 1, 1] },
  { nom: "Premier associé arrivé, premier servi", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 0, 3, 0, 0, 0] },
] as const;

/**
 * Les options du réflexe du métier : donner à chaque associé ce qu'il réclame, dans l'ordre
 * des demandes, et remplir l'intercontrat avec n'importe quelle mission. [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  coopPart:
    "Nous ne pouvons pas attendre novembre. Nous avons signé ce matin avec Kéroual Consulting.",
  coopAttend: "Novembre, c'est tard, mais nous attendrons. Ne nous décevez pas.",
  prospectSigne:
    "Ligériennes a validé le programme jeudi : démarrage en semaine 7. Je garde mes trois confirmés ; la coopérative démarrera lundi 28 avec des indépendants.",
  prospectRepousse:
    "Leur comité a repoussé le programme à janvier. Je lâche mes trois confirmés : ils démarrent à la coopérative lundi 28.",
  prospectPerdu:
    "Ligériennes a signé, et démarre lundi. Je n'ai personne : ils sont partis chez Halden Partners. Trois ans de programme.",
  copilCrise:
    "Comité de pilotage difficile au CH : le planning des blocs a glissé, le directoire a exigé un plan de reprise. Il faudra des jours de plus, et la pénalité tombe.",
  copilBien: "Comité de pilotage du CH : le directoire valide les premiers scénarios. Bon point.",
  incident:
    "Un client se plaint d'un analyste placé seul depuis septembre : livrable à reprendre, avoir à faire.",
  retzDerape:
    "Le bureau communautaire a refusé la cartographie : trop de trous. Il faut un confirmé pour reprendre, et un avoir.",
  retzTient:
    "Livrable du Pays de Retz validé par le bureau communautaire. Obinna a tenu ses ateliers.",
  distrimerMecontent:
    "Judicaël Lemarié, chez Distrimer, se plaint : le suivi fournisseurs a pris du retard depuis le départ d'Ombline. Il demande un geste.",
  trancheAffermie:
    "Le directoire affermit la tranche optionnelle : 140 k€ de plus pour l'an prochain.",
  trancheRefusee:
    "Le directoire n'affermit pas la tranche optionnelle : il veut remettre la suite en concurrence.",
  halden:
    "Le rush de novembre démarre, et quatre de nos consultants sont chez Halden jusqu'au 27. Les missions de fin d'année prennent des indépendants.",
} as const;

/** Le message de Ladislas, une fois la réponse de Ligériennes connue. */
export const reponseProspect = (signe: boolean): Message => ({
  ...HAMELIN,
  texte: signe ? REPONSES.prospectSigne : REPONSES.prospectRepousse,
});
