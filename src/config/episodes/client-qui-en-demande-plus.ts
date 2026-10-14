/**
 * LE CLIENT QUI EN DEMANDE TOUJOURS PLUS — le contenu de l'épisode.
 *
 * Amélie Trégouët, directrice de mission dans la practice Performance
 * opérationnelle d'Atlas Conseil, conduit chez Morvanel (plats cuisinés et
 * conserves, usine de Loudéac) une mission au forfait de 420 k€. Restent
 * les phases 2 et 3, de septembre à fin novembre : 330 jours, 330 k€, cinq
 * consultants. Le directeur des opérations du client ajoute chaque semaine
 * une demande « rapide ». Six décisions, chacune précédée de ce qu'une
 * directrice de mission reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Leurs chiffres sont ceux du
 * modèle (src/engine/episodes/client-qui-en-demande-plus.ts) ; un test les
 * recalcule.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "perimetre",
    t: "Le périmètre glisse : chaque demande absorbée sans avenant coûte des jours non facturés et retarde ce que la sponsor a acheté",
  },
  {
    id: "besoins",
    t: "Le client a de vrais besoins nouveaux, que la mission ne couvre pas : c'est une occasion commerciale",
  },
  {
    id: "equipe",
    t: "L'équipe manque de séniorité et de productivité : il faut la renforcer pour tenir le plan",
  },
  {
    id: "client",
    t: "Le directeur des opérations teste le cabinet : il faut le tenir à distance et passer par la sponsor",
  },
] as const;

export type IdDiagnostic = (typeof DIAGNOSTICS)[number]["id"];

const BRIEUC = { de: "Brieuc Guilcher", role: "Directeur des opérations, Morvanel" } as const;
const AOURELL = {
  de: "Aourell Abgrall",
  role: "Directrice générale de Morvanel, sponsor",
} as const;
const ROKIA = { de: "Rokia Keïta", role: "Manager de la mission, Atlas Conseil" } as const;
const LOTHAIRE = {
  de: "Lothaire Demazure",
  role: "Associé, practice Performance opérationnelle",
} as const;
const ERELL = { de: "Erell Cozanet", role: "Contrôleuse de gestion, usine de Loudéac" } as const;
const ALAN = { de: "Alan Castanyer", role: "Chef d'atelier, ligne 3" } as const;
const PRUNE = {
  de: "Prune Lecoeur",
  role: "Contrôleuse de gestion",
} as const;
const TEMPORA = { de: "Tempora", role: "Suivi de la mission" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Quatre petites choses",
    jusqua: 2,
    messages: () => [
      {
        ...TEMPORA,
        heure: "07:30",
        alerte: true,
        texte:
          "Mission Morvanel, phases 2 et 3 (septembre à novembre) : 330 jours budgétés, 330 k€ au forfait. Taux de réalisation projeté : 100 %. Quatre demandes du client en attente de réponse.",
      },
      {
        ...BRIEUC,
        heure: "07:55",
        texte:
          "Amélie, j'ai mis quatre petites choses dans le dossier partagé, rien de bien long. Vos consultants sont sur place, ça ira vite.",
      },
      {
        ...AOURELL,
        heure: "09:10",
        texte:
          "Je compte sur vous pour les gains des lignes 1 et 3 au comité de fin novembre. Si c'est probant, nous parlerons d'une suite pour l'an prochain.",
      },
      {
        ...ROKIA,
        heure: "10:20",
        texte:
          "Brieuc passe tous les matins à la salle projet. L'équipe ne sait plus quoi lui répondre, et Briac a déjà commencé la ligne 4 « pour voir ».",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "proposition",
        titre: "Relire la proposition commerciale signée",
        cout: 1,
        nature: "decisive",
        resultat:
          "Phases 2 et 3 : 330 jours (310 d'équipe, 20 de direction de mission), 330 k€, soit un TJM moyen de 1 000 €. Périmètre : les lignes 1 et 3, les équipes de jour. Le lot 2 « pilotage de la performance » comprend un tableau de bord hebdomadaire des arrêts, prévu en semaine 8. Rien sur la ligne 4, les équipes de nuit ni les stocks. Article 7 : toute demande hors périmètre fait l'objet d'un avenant chiffré au TJM du forfait.",
      },
      {
        id: "tempora",
        titre: "Chiffrer les demandes en attente dans Tempora",
        cout: 1,
        nature: "decisive",
        resultat:
          "Les quatre demandes, estimées par l'équipe : étendre l'analyse des arrêts à la ligne 4 (14 jours), un tableau de bord hebdomadaire des arrêts pour le comité de direction de l'usine (6 jours), former les chefs d'équipe de nuit au changement de série rapide (8 jours), une analyse des stocks de produits finis avant l'inventaire (12 jours) : 40 jours en tout. Le plan de l'équipe est plein jusqu'à fin novembre : 310 jours de capacité pour 280 jours de travail et 30 jours de provision pour aléas. Coût de revient journalier moyen de l'équipe : 600 €.",
      },
      {
        id: "enveloppe",
        titre: "Déjeuner avec la contrôleuse de gestion de l'usine",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Erell Cozanet : « L'usine a une enveloppe d'amélioration continue de 150 k€ cette année ; 60 k€ ne sont pas engagés. Ce qui ne l'est pas à la revue budgétaire de fin octobre retourne au groupe. Brieuc le sait très bien. »",
      },
      {
        id: "trs",
        titre: "Refaire le point sur le TRS de la ligne 3",
        cout: 1,
        nature: "bruit",
        resultat:
          "Taux de rendement synthétique de la ligne 3 : 61 % en août, comme au diagnostic de juin. L'objectif de la mission, huit points de plus fin novembre, reste à portée : les changements de série pèsent toujours un tiers des arrêts.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Lothaire, l'associé",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Lothaire : « Avant de dire oui ou non, relis ce que Morvanel a acheté, et chiffre ce qu'il demande en plus. Un avenant se propose tôt, quand le client a encore du budget. Et ne dis jamais non sans proposer autre chose. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que répondez-vous à Brieuc ?",
    options: [
      {
        t: "Tout accepter : c'est le client, et la suite se jouera sur sa satisfaction",
        d: "Les quatre demandes entrent dans le plan de l'équipe, sans avenant. Brieuc sera ravi.",
      },
      {
        t: "Relire le contrat avec lui : avancer le tableau de bord, chiffrer le reste en avenant",
        d: "Le tableau de bord est au contrat. Les trois autres demandes font un avenant de 34 k€, réalisé par un consultant de la practice. Désormais, chaque demande passe par un registre.",
      },
      {
        t: "Répondre que ces demandes sortent du contrat",
        d: "Un courriel net : l'équipe s'en tient à la proposition signée.",
      },
      {
        t: "Les laisser en attente jusqu'au comité de pilotage intermédiaire",
        d: "On tranchera en semaine 6, quand le plan sera plus clair.",
      },
    ],
    reactions: [
      [
        {
          ...BRIEUC,
          texte:
            "Parfait. Je savais qu'on pouvait compter sur Atlas. J'aurai sûrement deux ou trois autres petites choses d'ici novembre.",
        },
      ],
      null,
      [
        {
          ...BRIEUC,
          texte:
            "J'ai relu votre proposition, moi aussi : le tableau de bord des arrêts y est, au lot 2. Je vous laisse vérifier. Pour le reste, j'ai compris.",
        },
      ],
      [
        {
          ...ROKIA,
          texte:
            "Brieuc n'a pas attendu : il est passé voir Briac pour la ligne 4, et Mai-Linh pour les stocks. Ils n'ont pas osé dire non.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · lundi",
    titre: "La ligne de surgelés démarre",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...BRIEUC,
        heure: "08:05",
        alerte: true,
        texte:
          "La nouvelle ligne de surgelés démarre en semaine 4. J'ai besoin de deux de vos consultants pendant trois semaines pour caler les changements de série. Vous êtes les mieux placés, et c'est l'affaire de quelques jours.",
      },
      {
        ...TEMPORA,
        heure: "08:30",
        texte: `Fin de semaine 2 : taux de réalisation projeté ${ctx.realisation} ; hors périmètre non facturé : ${ctx.absorbes} ; retard du cœur de mission : ${ctx.retard}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "budget",
        titre: "Rappeler Erell Cozanet sur le budget de l'usine",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.avenant1
              ? "« L'avenant de septembre a engagé 34 k€ ; il en reste 26 sur l'enveloppe, de quoi couvrir un avenant de 24 jours. »"
              : "« Les 60 k€ de l'enveloppe ne sont toujours pas engagés. »"
          } La revue budgétaire est dans six semaines ; après, ce qui reste retourne au groupe.${
            ctx.gratuit
              ? " « Entre nous, Brieuc dit partout que vos consultants font ça très bien, et sans facture. »"
              : ""
          }`,
      },
      {
        id: "benchmark",
        titre: "Revoir avec Aourell l'utilité du benchmark des quatre usines",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le benchmark (lot 3, 30 jours, semaines 9 à 12) devait nourrir le plan d'investissement du groupe, que le comité exécutif vient de repousser d'un an. Aourell : « Je n'en ai plus besoin cette année. Si vous avez mieux à faire de ces trente jours, proposez-moi. »",
      },
    ],
    question: "Que répondez-vous pour la ligne de surgelés ?",
    options: [
      {
        t: "Dire oui : l'équipe s'organise",
        d: "Deux consultants trois semaines sur la ligne de surgelés : 24 jours pris sur le plan.",
      },
      {
        t: "Proposer un avenant de 24 jours, avec un consultant de la practice",
        d: "24 k€, à signer par Brieuc cette semaine. L'équipe reste sur le cœur de mission.",
      },
      {
        t: "Proposer à Aourell l'échange : le démarrage à la place du benchmark des quatre usines",
        d: "Les 24 jours du démarrage remplacent les 30 jours du benchmark. Un livrable de moins au comité final.",
      },
      {
        t: "Refuser : l'équipe doit tenir le plan",
        d: "Brieuc trouvera quelqu'un d'autre pour sa ligne.",
      },
    ],
    reactions: [
      [
        {
          ...BRIEUC,
          texte: "Merci, Amélie. Théodule et Mai-Linh sont sur la ligne dès lundi.",
        },
      ],
      [
        {
          ...BRIEUC,
          texte: "Je regarde avec Erell et je vous réponds jeudi.",
        },
      ],
      [
        {
          ...AOURELL,
          texte:
            "Bonne idée. Le benchmark attendra l'an prochain ; démarrez la ligne de surgelés. Brieuc est ravi.",
        },
      ],
      [
        {
          ...BRIEUC,
          texte: "Très bien. Je me débrouillerai. Je m'en souviendrai aussi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · lundi",
    titre: "Le comité de pilotage intermédiaire",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...AOURELL,
        heure: "08:40",
        alerte: true,
        texte:
          "Comité de pilotage jeudi de la semaine 6. Je veux voir où en sont les lignes 1 et 3, et ce qui reste d'ici fin novembre.",
      },
      {
        ...TEMPORA,
        heure: "09:00",
        texte: `Fin de semaine 4 : retard du cœur de mission ${ctx.retard}, pour 30 jours de provision ; hors périmètre non facturé : ${ctx.absorbes}. Marge à terminaison projetée : ${ctx.marge}.`,
      },
    ],
    sources: [
      {
        id: "registre",
        titre: "Faire le compte de tout ce qui a été fait hors périmètre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Depuis septembre, l'équipe a passé ${ctx.absorbes} sur des demandes hors périmètre et des coups de main aux ateliers, non facturés : ${ctx.coutAbsorbe} de coût de revient, et un taux de réalisation projeté de ${ctx.realisation}. Le cœur de mission a ${ctx.retard} de retard. Aourell ne connaît aucune de ces demandes : elles passent toutes par Brieuc, en direct.`,
      },
      {
        id: "renfort",
        titre: "Demander à Lothaire un consultant en intercontrat",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Lothaire peut libérer Ewald Kerhoas dès la semaine 7. Comptez une semaine et demie avant qu'il soit efficace (9 jours à la charge de la mission) ; ensuite, il rattrape jusqu'à 27 jours de retard d'ici fin novembre.",
      },
    ],
    question: "Que faites-vous du comité de pilotage ?",
    options: [
      {
        t: "Présenter l'avancement, sans parler des demandes",
        d: "Ne pas mettre Brieuc en difficulté devant sa directrice générale.",
      },
      {
        t: "Mettre le registre des demandes à l'ordre du jour, et faire arbitrer Aourell",
        d: "Chaque demande, son coût en jours, son effet sur le plan. Désormais le comité tranche : avenant, échange ou report.",
      },
      {
        t: "Après le comité, envoyer un avenant de régularisation pour le hors-périmètre déjà fait",
        d: "Facturer les jours passés, au TJM du forfait.",
      },
      {
        t: "Ajouter un consultant à vos frais pour tenir les jalons",
        d: "Ewald, dès la semaine 7, tant qu'il y a du retard à rattraper.",
      },
    ],
    reactions: [
      [
        {
          ...AOURELL,
          texte: "Merci, c'est clair. Nous nous revoyons fin novembre pour le comité final.",
        },
      ],
      [
        {
          ...AOURELL,
          texte:
            "Je ne savais pas tout cela. Désormais, les demandes passent par ce comité, et j'arbitre. Brieuc, nous en reparlerons.",
        },
      ],
      [
        {
          ...ERELL,
          texte: "J'ai reçu votre avenant de régularisation. Je le transmets à Brieuc.",
        },
      ],
      [
        {
          ...LOTHAIRE,
          texte: "Ewald commence lundi. Rokia lui a préparé une semaine d'accueil.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · lundi",
    titre: "Les coups de main",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...PRUNE,
        heure: "09:15",
        alerte: true,
        texte: `Les relevés de temps de la mission Morvanel portent chaque semaine des lignes « divers usine » : ${ctx.fuite} depuis la semaine 3. Tu veux regarder ?`,
      },
      {
        ...ALAN,
        heure: "11:30",
        texte:
          "Coline nous sort le reporting des arrêts tous les matins, c'est devenu indispensable. Et Briac nous a refait le fichier des stocks de pièces, merci à lui.",
      },
    ],
    sources: [
      {
        id: "releves",
        titre: "Lire les relevés de Tempora ligne par ligne",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.fuite} de coups de main depuis la semaine 3, jamais demandés par écrit : le reporting quotidien des arrêts pour les chefs d'atelier, des extractions, des fichiers repris. La pente monte : 1,5 jour par semaine en septembre, un quart de jour de plus chaque semaine. Encore 2,5 jours cette semaine ; ensuite, si rien ne change, 20 jours d'ici fin novembre, soit 12 k€ de coût de revient pris sur le cœur de mission.`,
      },
      {
        id: "analyste",
        titre: "Demander à Brieuc qui pourrait reprendre le reporting",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Lilwenn Kersaudy, analyste méthodes de l'usine, peut reprendre le reporting des arrêts après deux jours de formation avec Coline. « Je préfère d'ailleurs l'avoir en main : vous partirez un jour. »",
      },
    ],
    question: "Que faites-vous des coups de main ?",
    options: [
      {
        t: "Laisser faire : ces coups de main font la relation avec les ateliers",
        d: "Rien ne change.",
      },
      {
        t: "Recadrer l'équipe et transférer le reporting à l'analyste de l'usine",
        d: "Deux jours de formation, puis l'usine le produit elle-même. Tout autre coup de main passe par le registre.",
      },
      {
        t: "Proposer le reporting en régie : une analyste deux à trois jours par semaine",
        d: "Facturé 650 € par jour, si Brieuc accepte de payer.",
      },
      {
        t: "Interdire à l'équipe tout travail hors périmètre",
        d: "Une consigne écrite, dès lundi.",
      },
    ],
    reactions: [
      [
        {
          ...ALAN,
          texte: "Merci, on ne saurait plus faire sans vous. Coline, tu peux ajouter la ligne 4 ?",
        },
      ],
      [
        {
          de: "Lilwenn Kersaudy",
          role: "Analyste méthodes, usine de Loudéac",
          texte: "Coline m'a tout montré. Je prends le reporting lundi, et je garde le fichier.",
        },
      ],
      null,
      [
        {
          ...ALAN,
          texte:
            "Bon. On fera sans vous. Ne comptez pas sur nos relevés d'arrêts avant midi, on a aussi du travail.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · lundi",
    titre: "Préparer la suite",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...AOURELL,
        heure: "08:20",
        alerte: true,
        texte:
          "Le budget de l'an prochain se tranche mi-novembre. Si Atlas a une idée de suite, c'est le moment.",
      },
      {
        ...LOTHAIRE,
        heure: "12:45",
        texte:
          "Une suite de 300 k€ chez Morvanel, ce serait la meilleure nouvelle de la practice cette année. Ne la laisse pas filer.",
      },
      {
        ...TEMPORA,
        heure: "18:00",
        texte: `Fin de semaine 8 : satisfaction de la sponsor estimée à ${ctx.satisfaction} sur 100, retard du cœur ${ctx.retard}.`,
      },
    ],
    sources: [
      {
        id: "orientations",
        titre: "Lire le compte rendu du dernier comité exécutif de Morvanel",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Deux pistes pour l'an prochain : consolider Loudéac (la ligne de surgelés, la ligne 4, les équipes de nuit) ou déployer la méthode dans les trois autres usines. Le comité n'a pas tranché ; Aourell le fera mi-novembre. Sur le papier, les deux se valent : à peu près une chance sur deux chacune.",
      },
      {
        id: "parking",
        titre: "Reprendre les demandes de Brieuc laissées en attente",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La ligne 4, les équipes de nuit, les stocks, la ligne de surgelés : de quoi écrire une suite de 300 k€ tout de suite, pour consolider Loudéac. Brieuc la porterait volontiers.",
      },
      {
        id: "chiffrage",
        titre: "Chiffrer la suite avec Prune",
        cout: 0.5,
        nature: "utile",
        resultat:
          "300 k€ d'honoraires à 35 % de marge : 105 k€. Un accord de principe au comité final est signé neuf fois sur dix (94,5 k€) ; une mise en concurrence avec Halden Partners et Kéroual Consulting se gagne trois fois sur dix (31,5 k€). Une remise de 10 % coûterait 30 k€ de marge.",
      },
    ],
    question: "Comment préparez-vous la suite ?",
    options: [
      {
        t: "Rédiger la proposition sur les demandes de Brieuc",
        d: "Consolider Loudéac : tout est déjà écrit, elle part cette semaine.",
      },
      {
        t: "Demander d'abord un entretien à Aourell sur ses priorités, puis écrire",
        d: "Deux jours de préparation et d'entretien ; la proposition part la semaine suivante, avant l'arbitrage du budget.",
      },
      {
        t: "Attendre le comité final : les résultats parleront d'eux-mêmes",
        d: "Rien à préparer d'ici là.",
      },
      {
        t: "Proposer la suite sur les demandes de Brieuc, avec 10 % de remise pour la verrouiller",
        d: "270 k€ au lieu de 300, si elle signe avant fin novembre.",
      },
    ],
    reactions: [
      [
        {
          ...BRIEUC,
          texte:
            "Enfin ! Je la défendrai devant Aourell, c'est exactement ce qu'il faut à l'usine.",
        },
      ],
      [
        {
          ...AOURELL,
          texte:
            "Volontiers. Mardi 8 heures, une heure. Venez avec des questions plutôt qu'avec un document.",
        },
      ],
      [
        {
          ...LOTHAIRE,
          texte: "Tu es sûre ? Le budget se tranche avant le comité final.",
        },
      ],
      [
        {
          ...BRIEUC,
          texte: "Dix pour cent de moins : Aourell appréciera le geste.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · lundi",
    titre: "La dernière demande",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...BRIEUC,
        heure: "08:10",
        alerte: true,
        texte:
          "Dernière chose, promis : vous pourriez me préparer la présentation des résultats au comité exécutif du groupe ? Six jours, pas plus.",
      },
      {
        ...TEMPORA,
        heure: "08:30",
        texte: `Fin de semaine 10 : retard du cœur de mission ${ctx.retard}, pour 30 jours de provision. Taux de réalisation projeté : ${ctx.realisation}.`,
      },
    ],
    sources: [
      {
        id: "avancement",
        titre: "Faire le point sur les livrables du cœur avec Rokia",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.aLHeure
            ? `Retard du cœur : ${ctx.retard}, pour 30 jours de provision. L'essentiel sera prêt au comité final, à une semaine près : Aourell jugera sur des livrables finis.`
            : `Retard du cœur : ${ctx.retard}, pour 30 jours de provision. Il manquera des livrables au comité final, et chaque jour pris ailleurs s'y verra : Aourell jugera d'abord ce qui n'est pas fini.`,
      },
    ],
    question: "Que répondez-vous à Brieuc ?",
    options: [
      {
        t: "Le faire, en plus, sans en parler",
        d: "Six jours de l'équipe sur les deux dernières semaines.",
      },
      {
        t: "Le faire, comme un geste annoncé et valorisé « offert » sur la facture finale",
        d: "Six jours de l'équipe ; Aourell et Brieuc savent ce qui est offert, et ce que cela vaut : 6 k€.",
      },
      {
        t: "En faire le premier livrable de la suite",
        d: "Rien d'ici fin novembre ; la présentation entre dans la proposition.",
      },
      {
        t: "Refuser : l'équipe doit finir le cœur de mission",
        d: "Brieuc fera sa présentation lui-même.",
      },
    ],
    reactions: [
      [{ ...BRIEUC, texte: "Merci, vous êtes formidables. Je n'oublierai pas." }],
      [
        {
          ...AOURELL,
          texte:
            "J'ai vu la ligne « offert » sur la facture. C'est élégant, et Brieuc a une belle présentation.",
        },
      ],
      [{ ...BRIEUC, texte: "D'accord. Ça ira dans la suite, si suite il y a." }],
      [
        {
          ...BRIEUC,
          texte: "Je la ferai moi-même. Dommage, c'était l'occasion de vous mettre en valeur.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Cadrer, chiffrer, arbitrer", chemin: [1, 1, 1, 1, 1, 1] },
  { nom: "Dire oui à tout", chemin: [0, 0, 0, 0, 3, 0] },
  { nom: "Attentisme", chemin: [3, 0, 0, 0, 2, 0] },
] as const;

/**
 * Les options réflexes, [décision, option] : accepter chaque demande pour faire plaisir au
 * client, laisser l'équipe rendre service, acheter la suite par une remise. Le silence au
 * comité intermédiaire (D3) n'y figure pas : il n'accepte rien de plus, il laisse seulement
 * filer ce qui est déjà en place.
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [3, 0],
  [4, 3],
  [5, 0],
] as const;

export const REPONSES = {
  avenant1Signe:
    "J'ai vu Erell : on prend l'avenant de 34 k€ sur l'enveloppe d'amélioration continue. Je préfère ça à attendre l'an prochain. Le tableau de bord avancé, c'est parfait.",
  avenant1Refuse:
    "Pas de budget pour un avenant, je n'ai pas réussi à convaincre le groupe. On laisse la ligne 4, la nuit et les stocks de côté. Dommage.",
  avenant2Signe: "Avenant signé pour la ligne de surgelés. Votre consultant est le bienvenu lundi.",
  avenant2Refuse:
    "Je ne signerai pas d'avenant pour ça. Je trouverai quelqu'un d'autre pour la ligne de surgelés.",
  regularisationPayee:
    "Brieuc a signé la moitié de votre avenant de régularisation, « pour solde de tout compte ». Il ne vous en reparlera pas, et ne vous en remerciera pas non plus.",
  regularisationRefusee:
    "Nous ne paierons pas après coup ce que vous avez fait sans devis. Aourell a été mise en copie de ma réponse.",
  regieAcceptee:
    "Va pour la régie : Coline continue le reporting, facturé à la journée. C'est plus simple pour tout le monde.",
  regieRefusee:
    "Payer pour un reporting que vous faisiez gratuitement ? Non. Continuez comme avant, on verra.",
  escalade:
    "Brieuc s'est plaint de vous en comité de direction : « Atlas nous dit non à tout. » Pouvons-nous en parler ?",
  erreur:
    "Les temps de changement de série du standard de la ligne 3 sont faux : vos consultants ont repris un fichier de la ligne 1. Mes chefs d'équipe ont perdu une semaine.",
  consolider:
    "Ma priorité pour l'an prochain, c'est de consolider Loudéac : la ligne de surgelés, la ligne 4, la nuit. Écrivez-moi ça.",
  deployer:
    "Ma priorité pour l'an prochain, c'est de déployer votre méthode dans les trois autres usines. Loudéac attendra. Écrivez-moi ça.",
  suiteAccordee:
    "Bravo pour ces trois mois. Je vous donne mon accord de principe pour la suite : envoyez-moi le contrat.",
  suiteEnConcurrence:
    "Merci pour ce travail. Pour la suite, je vais consulter : Halden Partners et Kéroual Consulting répondront aussi.",
} as const;
