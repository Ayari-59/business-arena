/**
 * LE POSTE QUI RESTE VIDE — le contenu de l'épisode.
 *
 * Claire Dubreuil dirige l'agence Arvel Distribution de Villefranche-sur-Saône.
 * Julien, l'un de ses cinq technico-commerciaux, est parti il y a trois
 * semaines ; ses 52 clients pèsent sur les quatre autres, l'annonce n'attire
 * personne, et un client lui recommande un candidat. Six décisions, chacune
 * précédée de ce qu'une responsable d'agence reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "annonce",
    t: "L'annonce, recopiée de l'ancienne, décrit mal le poste : elle n'attire pas ceux qui font ce métier",
  },
  {
    id: "marche",
    t: "Les bons technico-commerciaux sont rares : il faut aller les chercher là où ils sont",
  },
  { id: "salaire", t: "La rémunération proposée est trop basse pour le marché" },
  { id: "visibilite", t: "L'annonce n'est pas assez diffusée : trop peu de gens la voient" },
] as const;

export type IdDiagnostic = (typeof DIAGNOSTICS)[number]["id"];

/** Les personnes du recrutement, par le code que le tableau de bord lit. */
export const CANDIDATS = [
  "Jordan Ferrand",
  "Samia Belkacem",
  "Maxime Girard",
  "Laura Vidal",
  "Thibault Marchand",
] as const;

/** Il ou elle, selon la personne. */
export const pronomDuCandidat = (code: number | null | undefined) =>
  code === 1 || code === 3 ? "Elle" : "Il";

export const nomDuCandidat = (code: number | string | boolean | null | undefined) =>
  typeof code === "number" ? (CANDIDATS[code] ?? "la recrue") : "la recrue";

const AURELIE = { de: "Aurélie Chassagne", role: "Chargée de recrutement, siège" } as const;
const NICOLAS = { de: "Nicolas Perrin", role: "Technico-commercial senior" } as const;
const SYLVIE = { de: "Sylvie Bernard", role: "Responsable du comptoir" } as const;
const GERALD = { de: "Gérald Fontaine", role: "Directeur régional" } as const;
const BASTIEN = { de: "Bastien Roux", role: "Technico-commercial" } as const;
const GILLES = { de: "Gilles Peyrot", role: "Plombier-chauffagiste, client" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le poste reste vide",
    jusqua: 2,
    messages: () => [
      {
        de: "Tableau de bord de l'agence",
        role: "Alerte automatique",
        heure: "07:40",
        alerte: true,
        texte:
          "Poste de technico-commercial vacant depuis 3 semaines. 9 candidatures reçues, dont 1 profil terrain. Les 52 clients de Julien Faure sont répartis sur l'équipe : charge à 125 %.",
      },
      {
        ...GERALD,
        heure: "08:15",
        texte:
          "Claire, le portefeuille de Julien, c'est plus de 120 k€ de marge par trimestre. Dis-moi vendredi comment tu le remplaces, et quand.",
      },
      {
        ...BASTIEN,
        heure: "08:50",
        texte:
          "J'ai pris treize clients de Julien en plus des miens. Je fais les urgences, pas les visites. Trois m'ont déjà demandé qui allait s'occuper d'eux.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "annonce",
        titre: "Relire l'annonce et la fiche de poste",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'annonce est celle de 2017, recopiée : « Vendeur conseil H/F, bac+2, cinq ans d'expérience dans le négoce exigés. » Ni le secteur, ni la rémunération, ni le véhicule, ni la part de terrain. Julien passait pourtant quatre jours sur cinq chez les artisans.",
      },
      {
        id: "candidats",
        titre: "Rappeler les candidats déjà reçus",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur les 9 candidats, 6 sont vendeurs en magasin ou au comptoir, attirés par l'intitulé. Le seul technico-commercial du lot croyait à un poste sédentaire : « Mettez le secteur, la rémunération et le véhicule dans l'annonce, et ceux qui font ce métier répondront. »",
      },
      {
        id: "salaires",
        titre: "Comparer la rémunération au marché",
        cout: 1,
        nature: "bruit",
        resultat:
          "Fixe de 2 500 € brut par mois, variable de 6 000 € par an, véhicule de service : dans la moyenne régionale du négoce, d'après l'enquête du groupe. Rien d'anormal.",
      },
      {
        id: "portefeuille",
        titre: "Faire le point sur le portefeuille de Julien",
        cout: 0.5,
        nature: "utile",
        resultat:
          "52 clients actifs. Douze font 58 % de la marge ; trois de ces douze ont reçu la visite d'un concurrent depuis le départ de Julien. Les quarante autres commandent surtout au comptoir.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Gérald",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Gérald : « Avant de diffuser plus, demande-toi qui lirait ton annonce et aurait envie d'y répondre. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que faites-vous de l'annonce ?",
    options: [
      {
        t: "Rediffuser l'annonce sur trois sites d'emploi payants",
        d: "La même annonce, vue par beaucoup plus de monde. 1 800 €.",
      },
      {
        t: "Redéfinir le poste avec l'équipe et réécrire l'annonce",
        d: "Missions réelles, secteur, rémunération, véhicule ; diffusée aussi auprès des clients et des fournisseurs. 400 €, en ligne la semaine prochaine.",
      },
      {
        t: "Confier la recherche à un cabinet de recrutement",
        d: "Le cabinet cherche dans son réseau et présente une courte liste. 9 000 € d'honoraires.",
      },
      {
        t: "Garder l'annonce actuelle et patienter",
        d: "Elle est en ligne depuis trois semaines : les candidatures finiront par venir.",
      },
    ],
    reactions: [
      [
        {
          ...AURELIE,
          texte:
            "L'annonce est en ligne sur les trois sites. Les candidatures arrivent : surtout des vendeurs de magasin.",
        },
      ],
      [
        {
          ...NICOLAS,
          texte:
            "On a passé une heure à décrire ce que faisait vraiment Julien. L'annonce part lundi, et deux artisans m'ont déjà dit qu'ils la feraient tourner.",
        },
      ],
      null,
      [
        {
          ...BASTIEN,
          texte: "Toujours personne ? On tient, mais pas longtemps.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "L'équipe sature",
    jusqua: 4,
    messages: (ctx) => [
      {
        de: "Mélanie Garcia",
        role: "Technico-commerciale",
        heure: "11:30",
        alerte: true,
        texte:
          "Claire, je n'ai vu aucun de mes clients cette semaine : je n'ai fait que les dépannages de ceux de Julien. Ça ne peut pas durer.",
      },
      {
        ...GILLES,
        heure: "14:10",
        texte:
          "Bonjour Claire. Il paraît que vous cherchez quelqu'un. Le fils d'un ami, Jordan Ferrand, est vendeur dans une grande surface de bricolage : un garçon formidable, tout le monde l'adore. Il est libre tout de suite. Je vous l'envoie ?",
      },
      {
        de: "Tableau de bord de l'agence",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Candidatures reçues en deux semaines : ${ctx.candidatures}, dont ${ctx.profils}. Charge de l'équipe : ${ctx.charge}. Clients du portefeuille perdus : ${ctx.clientsPerdus}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "marges",
        titre: "Classer les 52 clients par marge et par risque",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Douze clients font 58 % de la marge du portefeuille ; trois n'ont vu personne depuis le départ de Julien. Les quarante autres commandent surtout au comptoir et se contentent d'un appel par mois.",
      },
      {
        id: "equipe",
        titre: "Faire le point avec chaque commercial",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Bastien rentre à 20 heures depuis trois semaines. Nicolas pourrait tenir les gros clients si on le déchargeait du reste ; Sylvie propose que le comptoir appelle les petits clients chaque lundi.",
      },
    ],
    question:
      "Comment faites-vous suivre le portefeuille de Julien d'ici l'arrivée de son remplaçant ?",
    options: [
      {
        t: "Garder la répartition actuelle",
        d: "Chacun ses treize clients en plus des siens. Ne coûte rien.",
      },
      {
        t: "Trier le portefeuille : les douze gros clients à Nicolas et Mélanie, les autres suivis par le comptoir",
        d: "Un appel par semaine du comptoir aux petits clients. La prospection de l'équipe est suspendue en attendant.",
      },
      {
        t: "Demander à l'équipe de tout visiter, avec une prime",
        d: "Chacun garde ses clients de Julien et les voit tous. 1 500 € de prime par semaine jusqu'à l'arrivée du remplaçant.",
      },
      {
        t: "Reprendre vous-même le portefeuille",
        d: "Trois jours par semaine chez les clients de Julien ; l'agence tourne sans vous ces jours-là.",
      },
    ],
    reactions: [
      [
        {
          ...BASTIEN,
          texte: "D'accord. On continue comme ça, en serrant les dents.",
        },
      ],
      [
        {
          ...SYLVIE,
          texte:
            "Le comptoir a appelé les petits clients de Julien ce lundi. Ils apprécient qu'on pense à eux, et deux ont passé commande dans la foulée.",
        },
      ],
      [
        {
          de: "Anthony Lefèvre",
          role: "Technico-commercial",
          texte: "La prime, c'est bien. Mais je n'ai toujours que cinq jours dans la semaine.",
        },
      ],
      [
        {
          ...SYLVIE,
          texte:
            "Les jours où vous êtes sur la route, les litiges et les commandes fournisseurs attendent votre retour.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le coup de cœur",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...GILLES,
        heure: "08:20",
        alerte: true,
        texte:
          "Alors, Jordan ? Il m'a dit que le courant était bien passé au café mardi. Il attend votre réponse, et il a d'autres pistes.",
      },
      {
        ...AURELIE,
        heure: "10:00",
        texte: `${ctx.candidatures} candidatures depuis le début du trimestre, dont ${ctx.profils}. ${
          ctx.cabinetLent
            ? "Le cabinet présentera sa courte liste en semaine 6."
            : "Je peux caler les entretiens la semaine prochaine."
        }`,
      },
      {
        ...NICOLAS,
        heure: "12:30",
        texte:
          "J'ai croisé Jordan au club de rugby. Sympa, du bagou, il connaît tout le monde. Après, vendre du placo à un plaquiste, c'est autre chose.",
      },
    ],
    sources: [
      {
        id: "references",
        titre: "Appeler l'ancien responsable de Jordan",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.coeurBon
            ? "« Jordan ? Fiable, et les clients le réclament. Il a monté seul notre espace pour les professionnels, et il relance chaque devis. Je le regretterai. »"
            : "« Jordan ? Un contact formidable, tout le monde l'aime. Mais ses devis restaient sans suite : il ne relançait jamais. Avant nous, il avait quitté un poste de commercial avant la fin de sa période d'essai. »",
      },
      {
        id: "grille",
        titre: "Préparer une grille d'entretien avec Nicolas",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Cinq questions identiques pour tous, une mise en situation (un artisan mécontent, un devis à chiffrer en vingt minutes), une note par critère donnée à deux. Une demi-journée par candidat.",
      },
    ],
    question: "Comment choisissez-vous ?",
    options: [
      {
        t: "Recruter Jordan sans autre entretien",
        d: "La recommandation de M. Peyrot vaut garantie. Le poste est pourvu, on arrête de chercher.",
      },
      {
        t: "Recevoir Jordan et les meilleurs candidats en entretien structuré",
        d: "Mêmes questions, mise en situation, grille notée à deux avec Nicolas, références. Une semaine d'entretiens.",
      },
      {
        t: "Recevoir Jordan et les meilleurs candidats, et choisir au feeling",
        d: "Une heure de discussion avec chacun. Une semaine d'entretiens.",
      },
      {
        t: "Attendre le profil idéal : cinq ans de négoce et un carnet d'adresses",
        d: "Ni Jordan ni les candidats actuels ne cochent toutes les cases. On décide dans deux semaines.",
      },
    ],
    reactions: [
      [
        {
          ...GILLES,
          texte: "Merci Claire, vous ne le regretterez pas. Jordan est ravi.",
        },
      ],
      [
        {
          ...NICOLAS,
          texte:
            "La grille est prête. On reçoit quatre candidats mardi et mercredi, Jordan compris, et on note chacun de son côté avant d'en parler.",
        },
      ],
      [
        {
          ...AURELIE,
          texte: "Les entretiens sont calés mardi et mercredi, une heure chacun.",
        },
      ],
      [
        {
          ...GILLES,
          texte: "Jordan ne va pas attendre éternellement, vous savez.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "L'offre",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...AURELIE,
        heure: "09:30",
        alerte: true,
        texte: ctx.retenu
          ? ctx.relance
            ? "Personne n'a atteint la note minimale de la grille. J'ai relancé l'annonce ; la candidate la plus prometteuse de la nouvelle vague est Laura Vidal. Elle a aussi un entretien chez un concurrent."
            : `Votre choix se porte sur ${ctx.retenu}. ${ctx.pronom} a aussi un deuxième entretien chez un concurrent mardi prochain.`
          : ctx.attente
            ? "Toujours pas le profil idéal. Deux bons candidats de la première vague ont relancé : ils ont d'autres pistes."
            : "Les entretiens ont glissé d'une semaine : ils auront lieu lundi et mardi prochains.",
      },
      {
        ...GERALD,
        heure: "11:15",
        texte:
          "Je te rappelle la procédure : toute embauche passe par le comité RH du jeudi, puis par un entretien avec moi. Compte une dizaine de jours.",
      },
    ],
    sources: [
      {
        id: "pistes",
        titre: "Appeler le candidat retenu pour connaître ses autres pistes",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.retenu
            ? `${ctx.retenu} a une offre d'un concurrent, à confirmer sous huit jours. Le salaire n'est pas le premier critère : savoir ce qu'on vendra, à qui, avec quel véhicule et quel accompagnement. « Celui qui me répond le premier avec une offre claire aura une longueur d'avance. »`
            : "Les meilleurs candidats rencontrés ont chacun une autre offre en cours. Tous disent la même chose : ils répondront à celui qui se décide le premier, avec une offre claire.",
      },
      {
        id: "validation",
        titre: "Demander à Gérald s'il peut valider sans attendre le comité",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Gérald : « Dans la fourchette budgétée, je valide par mail dans la journée. Une prime d'arrivée, je peux la prendre sur mon budget, mais elle reste chère. »",
      },
    ],
    question: "Comment faites-vous l'offre ?",
    options: [
      {
        t: "Faire une offre ferme sous 48 heures, complète",
        d: "Haut de la fourchette, variable, véhicule et plan d'intégration écrits. Validée par Gérald par mail.",
      },
      {
        t: "Suivre la procédure habituelle",
        d: "Comité RH du jeudi, puis entretien avec Gérald : une réponse au candidat dans une dizaine de jours.",
      },
      {
        t: "Faire une offre en bas de fourchette, pour garder de la marge",
        d: "On verra s'il négocie. 2 000 € de moins par an sur le fixe.",
      },
      {
        t: "Surenchérir pour être sûr qu'il signe",
        d: "Une prime d'arrivée de 3 000 € et un fixe au-dessus de l'offre concurrente.",
      },
    ],
    reactions: [
      [
        {
          ...AURELIE,
          texte:
            "Entendu : une offre ferme et complète, sous 48 heures. Je joins le plan d'intégration.",
        },
      ],
      [
        {
          ...AURELIE,
          texte: "Entendu : le dossier passera par le comité de jeudi prochain.",
        },
      ],
      [
        {
          ...AURELIE,
          texte: "Entendu : on part du bas de la fourchette, et on attend sa contre-proposition.",
        },
      ],
      [
        {
          ...GERALD,
          texte: "C'est cher. Mais si c'est le bon, ça se rattrape : je valide la prime.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Les premières semaines",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...AURELIE,
        heure: "09:00",
        alerte: true,
        texte: ctx.enPoste
          ? `${ctx.recrue} est en poste depuis ${ctx.semainesEnPoste} semaine${Number(ctx.semainesEnPoste) > 1 ? "s" : ""}. Le parcours d'accueil du groupe tient en une journée : badge, véhicule, logiciel. Pour la suite, c'est à l'agence de voir.`
          : ctx.arrivee
            ? `${ctx.recrue} prend son poste en semaine ${ctx.arrivee}. Le parcours d'accueil du groupe tient en une journée : badge, véhicule, logiciel. Pour la suite, c'est à l'agence de voir.`
            : "Pas de prise de poste prévue avant la fin du trimestre. Ce que vous décidez pour l'intégration vaudra pour la prochaine recrue.",
      },
      {
        ...NICOLAS,
        heure: "14:40",
        texte:
          "Qui va présenter la recrue aux gros clients de Julien ? Trois d'entre eux m'ont demandé à qui ils auraient affaire.",
      },
    ],
    sources: [
      {
        id: "parrain",
        titre: "Demander à Nicolas s'il peut être parrain",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.equipePoussee
            ? "Nicolas : « Honnêtement, avec toutes les visites en plus, je n'ai pas une heure. Je le ferai, mais à moitié. »"
            : ctx.surLaRoute
              ? "Nicolas : « D'accord, si on bloque deux demi-journées par semaine pendant un mois. Toi, de toute façon, tu es déjà sur la route trois jours sur cinq. »"
              : "Nicolas : « D'accord, si on bloque deux demi-journées par semaine pendant un mois. Je l'emmène chez les douze gros clients. »",
      },
      {
        id: "historique",
        titre: "Regarder comment se sont passées les dernières arrivées de commerciaux",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur les huit dernières recrues commerciales de la région, trois sont parties avant la fin de leur période d'essai : toutes avaient démarré seules, avec le fichier clients. Celles qui avaient eu un parrain étaient autonomes en cinq à six semaines.",
      },
    ],
    question: "Comment organisez-vous les premières semaines de la recrue ?",
    options: [
      {
        t: "Un parrain, un plan de six semaines, et les gros clients présentés en binôme",
        d: "Nicolas accompagne la recrue deux demi-journées par semaine pendant un mois.",
      },
      {
        t: "Lui confier le fichier clients et le véhicule : on apprend sur le terrain",
        d: "La recrue s'organise. Ne coûte rien.",
      },
      {
        t: "L'envoyer deux semaines en formation produits au siège",
        d: "Catalogue, logiciel de devis, techniques de vente. 1 800 €, puis le terrain.",
      },
      {
        t: "L'accompagner vous-même sur toutes ses visites pendant un mois",
        d: "Vous serez moins à l'agence pendant ce temps.",
      },
    ],
    reactions: [
      [
        {
          ...NICOLAS,
          texte:
            "Le plan des six semaines est prêt, et la tournée des gros clients en binôme commence dès que la recrue est là. Trois d'entre eux m'ont dit qu'ils apprécieraient.",
        },
      ],
      [
        {
          ...BASTIEN,
          texte:
            "Le fichier clients et les clés du véhicule, c'est tout ? Remarque, on a tous commencé comme ça. Enfin, ceux qui sont restés.",
        },
      ],
      [
        {
          ...AURELIE,
          texte:
            "La formation produits au siège est réservée : deux semaines, dès l'arrivée de la recrue.",
        },
      ],
      [
        {
          ...SYLVIE,
          texte: "Si vous êtes sur la route avec la recrue, on gérera l'agence comme on peut.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La période d'essai",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...GERALD,
        heure: "08:30",
        alerte: true,
        texte: ctx.enPoste
          ? `Trois semaines avant la fin du trimestre. Où en est ${ctx.recrue} ? Il faudra décider avant la fin de sa période d'essai.`
          : "Trois semaines avant la fin du trimestre, et toujours personne sur le portefeuille de Julien. Qu'est-ce que tu prévois ?",
      },
      {
        de: "Tableau de bord de l'agence",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Montée en charge de la recrue : ${ctx.montee}. Clients du portefeuille perdus depuis le début du trimestre : ${ctx.clientsPerdus}. Charge de l'équipe : ${ctx.charge}.`,
      },
    ],
    sources: [
      {
        id: "retours",
        titre: "Recueillir l'avis de Nicolas et de trois clients sur la recrue",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.recrueBonne === "bonne"
            ? "Les clients trouvent la recrue sérieuse et réactive. Nicolas : « Il lui manque encore les produits techniques, mais elle relance tout. Avec des objectifs clairs, elle sera autonome d'ici la fin de sa période d'essai. »"
            : ctx.recrueBonne === "mauvaise"
              ? "Deux clients sur trois signalent des devis faux ou jamais relancés. Nicolas : « Agréable, mais ne suit rien. Les clients me rappellent, moi. »"
              : "Il n'y a pas encore de recrue à évaluer : l'équipe porte toujours le portefeuille.",
      },
    ],
    question: "Que faites-vous à mi-période d'essai ?",
    options: [
      {
        t: "Faire un point structuré : retours des clients, trois objectifs pour finir la période d'essai",
        d: "Une heure avec la recrue et Nicolas, et une décision à l'échéance sur ces objectifs.",
      },
      {
        t: "Rompre la période d'essai et relancer le recrutement",
        d: "Pour ne pas prendre de risque. Le portefeuille repasse à l'équipe.",
      },
      {
        t: "Laisser la période d'essai courir",
        d: "On verra à la fin.",
      },
      {
        t: "Lui fixer un objectif de chiffre d'affaires, avec une prime à la clé",
        d: "1 500 € en fin de trimestre si l'objectif est atteint.",
      },
    ],
    reactions: [
      [
        {
          ...NICOLAS,
          texte:
            "Le point est fait : chacun sait ce qu'on attend d'ici la fin de la période d'essai, et sur quoi on décidera.",
        },
      ],
      [
        {
          ...BASTIEN,
          texte: "On reprend les clients de Julien. Encore.",
        },
      ],
      [
        {
          ...SYLVIE,
          texte: "La période d'essai suit son cours. Personne ne sait trop où on en est.",
        },
      ],
      [
        {
          de: "Anthony Lefèvre",
          role: "Technico-commercial",
          texte:
            "Un objectif chiffré à trois semaines de la fin du trimestre : la course au chiffre est lancée, la prospection attendra.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Bonne méthode", chemin: [1, 1, 1, 0, 0, 0] },
  { nom: "Le coup de cœur", chemin: [0, 0, 0, 1, 1, 2] },
  { nom: "Attendre le candidat parfait", chemin: [3, 0, 3, 1, 1, 2] },
] as const;

/** Les réflexes du recrutement sous pression : [décision, option]. */
export const REFLEXES = [
  [0, 0],
  [2, 0],
  [2, 3],
  [3, 1],
  [4, 1],
] as const;

export const REPONSES = {
  cabinetRapide:
    "Nous avons déjà dans notre vivier une technico-commerciale qui correspond : courte liste de trois candidats en semaine 4.",
  cabinetLent:
    "Nous lançons la recherche. Comptez une courte liste de trois candidats en semaine 6 : le marché est tendu.",
} as const;
