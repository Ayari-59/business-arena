/**
 * LES CONSULTANTS QUI PARTENT À DEUX ANS — le contenu de l'épisode.
 *
 * Maëline Courtecuisse dirige les ressources humaines d'Atlas Conseil : 240
 * collaborateurs, dont 190 consultants facturables, cinq practices, un siège
 * à Nantes. L'an dernier, 24 % des consultants sont partis, surtout entre
 * dix-huit mois et trois ans d'ancienneté, vers les clients et vers Halden
 * Partners. Janvier : le comité de direction arrête la campagne
 * d'augmentations, et plusieurs associés veulent 6 % pour tout le monde. Six
 * décisions, chacune précédée de ce qu'une directrice des ressources humaines
 * de cabinet reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : les entretiens de départ par segment, le coût d'un
 * départ, ce que coûtent la hausse générale et le rattrapage ciblé, le besoin
 * de juniors au printemps.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  CHANCE_EXPERTISE,
  COUT_AN_DERNIER,
  COUT_DEPART,
  COUT_HAUSSE_CIBLEE,
  COUT_HAUSSE_GENERALE,
  COUT_PRIME_FIDELITE,
  DEPARTS_AN_DERNIER,
  ECART_MARCHE,
  ECART_MOYEN,
  EFFECTIFS,
  ENTRETIENS,
  ENVELOPPE,
  ENVELOPPE_CIBLEE,
  HAUSSE_DES_AUTRES,
  HAUSSE_GENERALE,
  MASSE_CONSULTANTS,
  MASSE_DATA,
  MESURES,
  PLAN,
  POOL,
  PRIME_FIDELITE,
  PRIME_HALDEN,
  PYRAMIDE,
  QUESTIONNAIRES,
  RATTRAPAGE_DATA,
  TAUX_AN_DERNIER,
  coutDUnDepart,
  departsAnDernier,
  tauxAnDernier,
  type Segment,
} from "@/engine/episodes/departs-a-deux-ans";
import { euros, kE, nombre, taux } from "./format";
import type { Etape } from "./types";

/** Des milliers d'euros au dixième : « 47,5 k€ ». */
export const kE1 = (v: number) => `${nombre(v / 1000)} k€`;
const pct = (v: number) => taux(v, 0);

export const VICTOIRE = { de: "Victoire Lanoë", role: "Présidente d'Atlas Conseil" } as const;
export const GUSTAVE = {
  de: "Gustave Herbelin",
  role: "Directeur administratif et financier",
} as const;
export const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
export const AISSATOU = {
  de: "Aïssatou Ndour",
  role: "Responsable du staffing et du recrutement",
} as const;
export const ABEL = {
  de: "Abel Quintin",
  role: "Directeur de la practice Énergie et bâtiment",
} as const;
export const NOE = {
  de: "Noé Akintola",
  role: "Directeur de la practice Performance opérationnelle",
} as const;
export const RUBEN = {
  de: "Ruben Esnault",
  role: "Directeur de la practice Data et systèmes d'information",
} as const;
export const LILOU = {
  de: "Lilou Paganel",
  role: "Consultante, Organisation et transformation",
} as const;
export const LOMIG = {
  de: "Lomig Lemercier",
  role: "Consultant senior, Énergie et bâtiment",
} as const;
export const JAKEZ = { de: "Jakez Kerzerho", role: "Manager data, bureau de Rennes" } as const;
export const HAMIDOU = { de: "Hamidou Thoraval", role: "Secrétaire du CSE" } as const;
const TABLEAU = { de: "Suivi des départs", role: "Point hebdomadaire" } as const;

const NOMS: Record<Segment, string> = {
  juniors: "Analystes et consultants",
  seniors: "Consultants seniors et managers",
  data: "Profils data",
};

/** Ce que disent les 46 entretiens de départ, lus par segment et par raison principale. */
export const LECTURE_PAR_SEGMENT = (["juniors", "seniors", "data"] as const)
  .map((s) => {
    const e = ENTRETIENS[s];
    return `${NOMS[s]} (${EFFECTIFS[s]}, ${departsAnDernier(s)} départs, ${pct(tauxAnDernier(s))}) : missions répétitives ou intercontrat sans contenu ${e.missions}, absence de perspective ${e.perspectives}, rémunération ${e.salaire}, autres raisons ${e.autres}.`;
  })
  .join(" ");

/** Le calcul du coût d'un départ de consultant à deux ans, tel que le contrôle de gestion le pose. */
export function calculDuCout(): string {
  const j = COUT_DEPART.juniors;
  return `Pour un consultant de deux ans : le recrutement du remplaçant, ${kE1(j.recrutement)} (annonces, prime de cooptation ou cabinet, temps des entretiens) ; le poste vide, ${j.semainesVides} semaines en moyenne entre le départ et l'arrivée, à ${kE1(j.margeParSemaine)} de marge perdue par semaine ; la montée en compétence, ${j.joursDeMontee} jours que la recrue ne facture pas sur ses quatre premiers mois, à ${euros(j.tjm)} le jour ; et un départ sur ${j.client} qui coûte une mission chez le client, ${kE1(j.margeClient)} de marge. Le même calcul donne ${kE(coutDUnDepart("seniors"))} pour un senior, ${kE(coutDUnDepart("data"))} pour un profil data.`;
}

export const DIAGNOSTICS = [
  {
    id: "segments",
    t: "Les départs n'ont pas la même cause selon les profils : missions répétitives et intercontrat chez les juniors, absence de perspective chez les seniors, rémunération chez les profils data. Il faut répondre à chaque segment par sa cause",
  },
  {
    id: "missions",
    t: "Les consultants partent parce que les missions sont répétitives et l'intercontrat trop long : il faut revoir le staffing",
  },
  {
    id: "salaires",
    t: "Atlas paie sous le marché et Halden paie mieux : il faut aligner les salaires",
  },
  {
    id: "marche",
    t: "Le marché des consultants est tendu partout : partir à deux ans fait partie du métier, on n'y peut pas grand-chose",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "24 % de départs",
    jusqua: 2,
    messages: () => [
      {
        de: "Tableau de bord des ressources humaines",
        role: "Bilan annuel",
        heure: "07:50",
        alerte: true,
        texte: `Premier trimestre : janvier à mars. L'an dernier, ${DEPARTS_AN_DERNIER} consultants sur 190 ont démissionné, soit ${pct(TAUX_AN_DERNIER)}, dont sept sur dix entre dix-huit mois et trois ans d'ancienneté. Coût estimé par le contrôle de gestion : ${nombre(COUT_AN_DERNIER / 1e6)} M€, autant que le résultat d'exploitation.`,
      },
      {
        ...VICTOIRE,
        heure: "08:40",
        texte:
          "Maëline, le comité de direction arrête la campagne d'augmentations la semaine prochaine. Plusieurs associés veulent 6 % pour tout le monde, pour s'aligner sur Halden. Je veux ta recommandation, chiffrée. On dit aussi que Halden ouvre un bureau à Nantes cette année : une chance sur deux, d'après mes contacts.",
      },
      {
        ...LILOU,
        heure: "10:15",
        texte:
          "Trois personnes de ma promotion sont parties en décembre, deux chez des clients, une chez Halden. Personne ne leur avait demandé ce qui n'allait pas avant leur lettre de démission.",
      },
      {
        ...HAMIDOU,
        heure: "11:30",
        texte:
          "Le CSE demandera 6 % aux négociations annuelles. Les consultants comparent avec les offres de Halden, qui circulent.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "entretiens",
        titre: "Relire les 46 entretiens de départ de l'an dernier, par segment",
        cout: 1,
        nature: "decisive",
        resultat: `Raison principale de chaque départ. ${LECTURE_PAR_SEGMENT}`,
      },
      {
        id: "cout",
        titre: "Demander au contrôle de gestion ce que coûte un départ",
        cout: 1,
        nature: "decisive",
        resultat: `Prune Lecoeur : « ${calculDuCout()} »`,
      },
      {
        id: "questionnaires",
        titre: "Lire la synthèse des questionnaires de sortie",
        cout: 0.5,
        nature: "bruit",
        resultat: `Plusieurs réponses possibles, sur ${DEPARTS_AN_DERNIER} questionnaires : rémunération ${QUESTIONNAIRES.salaire} (${pct(QUESTIONNAIRES.salaire / DEPARTS_AN_DERNIER)}), intérêt des missions ${QUESTIONNAIRES.missions}, perspectives ${QUESTIONNAIRES.perspectives}, équilibre de vie ${QUESTIONNAIRES.equilibre}. La rémunération arrive en tête.`,
      },
      {
        id: "remuneration",
        titre: "Lire l'étude de rémunération du cabinet spécialisé",
        cout: 1,
        nature: "utile",
        resultat: `Atlas paie en moyenne ${pct(ECART_MOYEN)} sous la médiane du marché : ${pct(ECART_MARCHE.juniors)} pour les analystes et consultants, ${pct(ECART_MARCHE.seniors)} pour les seniors, ${pct(ECART_MARCHE.data)} pour les profils data. Halden paie ${pct(PRIME_HALDEN)} de plus qu'Atlas. ${pct(HAUSSE_GENERALE)} pour tous, c'est ${nombre((HAUSSE_GENERALE - ENVELOPPE) * 100)} points de plus que l'enveloppe de ${pct(ENVELOPPE)}, sur ${nombre(MASSE_CONSULTANTS / 1e6)} M€ de masse salariale chargée des consultants. Un rattrapage de ${pct(RATTRAPAGE_DATA)} pour les ${EFFECTIFS.data} profils data coûte ${kE(RATTRAPAGE_DATA * MASSE_DATA)} par an.`,
      },
      {
        id: "conseil",
        titre: "Appeler une directrice des ressources humaines d'un autre cabinet",
        cout: 0.5,
        nature: "aide",
        resultat:
          "« Avant de parler salaires au comité, regarde qui part, à quelle ancienneté, et pour quelle raison principale. Une moyenne de cabinet ne dit rien à personne. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que recommandez-vous au comité de direction pour la campagne d'augmentations ?",
    options: [
      {
        t: "Augmenter tous les consultants de 6 % pour s'aligner sur le marché",
        d: `Deux fois l'enveloppe prévue, dès la paie de février : ${kE(COUT_HAUSSE_GENERALE)} de plus cette année.`,
      },
      {
        t: "Garder l'enveloppe, mais la répartir par segment : rattrapage de 10 % pour les profils data, promotions financées, le reste au mérite",
        d: `Enveloppe portée de ${pct(ENVELOPPE)} à ${nombre(ENVELOPPE_CIBLEE * 100)} % : ${kE(COUT_HAUSSE_CIBLEE)} de plus cette année. Les autres auront ${nombre(HAUSSE_DES_AUTRES * 100)} % en moyenne.`,
      },
      {
        t: "Appliquer la campagne prévue : 3 % pour tous",
        d: "Dans le budget, comme chaque année.",
      },
      {
        t: "Verser une prime de fidélité de 3 000 € à chaque consultant qui atteint deux ans d'ancienneté",
        d: `Une trentaine de bénéficiaires par an : ${kE(COUT_PRIME_FIDELITE)} cette année, charges comprises.`,
      },
    ],
    reactions: [
      [
        {
          ...GUSTAVE,
          texte: `6 % pour tous : ${kE(COUT_HAUSSE_GENERALE)} de plus cette année, et chaque année ensuite. Je l'inscris au budget révisé.`,
        },
      ],
      [
        {
          ...RUBEN,
          texte:
            "Mes data scientists ont reçu leur lettre : 10 %. Deux d'entre eux ont décliné un entretien chez Halden cette semaine.",
        },
      ],
      [
        {
          ...HAMIDOU,
          texte:
            "3 % pour tous, comme chaque année. Personne n'est surpris, personne n'est content.",
        },
      ],
      [
        {
          ...LILOU,
          texte: `Une prime de ${euros(PRIME_FIDELITE.brut)} à deux ans ? Je resterai au moins jusqu'à la prime, c'est sûr.`,
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Quatorze juniors en intercontrat",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...AISSATOU,
        heure: "09:10",
        alerte: true,
        texte: `Janvier, comme chaque année : les collectivités et les hôpitaux n'ont pas encore notifié leurs marchés, ${ctx.intercontrat} consultants sont en intercontrat, dont quatorze juniors. Un industriel nous propose six postes en régie, de 9 à 12 mois, pour de la saisie et du contrôle de données de production, à 600 € par jour.`,
      },
      {
        ...GUSTAVE,
        heure: "11:45",
        texte:
          "Le taux d'occupation des juniors est à 66 % en janvier, pour une cible de 75 %. Six régies, c'est quatre points de plus tout de suite. Une journée non vendue ne se rattrape pas.",
      },
      {
        ...LILOU,
        heure: "15:20",
        texte:
          "En intercontrat, on fait des diapositives d'avant-vente que personne ne relit. Et après, on repart sur la même mission que l'an dernier, chez le même client.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "tempora",
        titre: "Extraire de Tempora le parcours des juniors partis",
        cout: 0.5,
        nature: "decisive",
        resultat: `Des ${departsAnDernier("juniors")} juniors partis l'an dernier, 19 avaient passé plus de douze mois sur la même mission ou plus de trente jours d'affilée en intercontrat ; chez ceux qui restent, c'est un sur trois. Aucun n'avait choisi sa mission : le staffing se décide entre managers de practice, au premier disponible.`,
      },
      {
        id: "regie",
        titre: "Lire la proposition de régie",
        cout: 0.5,
        nature: "utile",
        resultat: `Six postes au même endroit, sur la même tâche, de 9 à 12 mois. Marge attendue : ${kE(MESURES.margeRegie)} sur l'année, net des missions qu'il faudra refuser au printemps quand les marchés publics arriveront.`,
      },
    ],
    question: "Que faites-vous de l'intercontrat des juniors ?",
    options: [
      {
        t: "Staffer les juniors en intercontrat sur les six régies longues",
        d: `Taux d'occupation des juniors en hausse dès février, ${kE(MESURES.margeRegie)} de marge sur l'année.`,
      },
      {
        t: "Ouvrir une bourse aux missions dans Tempora, limiter à douze mois une même mission, et confier l'intercontrat à des projets internes formateurs",
        d: `Un chargé de staffing à mi-temps et des passations : ${kE(MESURES.bourse)} sur l'année.`,
      },
      {
        t: "Former les juniors en intercontrat : certifications et ateliers, trois jours par mois",
        d: `${kE(MESURES.formation)} sur l'année.`,
      },
      {
        t: "Laisser le staffing aux managers de practice, comme aujourd'hui",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...AISSATOU,
          texte:
            "Les six sont partis chez l'industriel lundi. L'un d'eux m'a demandé si c'était une punition.",
        },
      ],
      [
        {
          ...AISSATOU,
          texte:
            "La bourse est ouverte : 31 candidatures sur les missions du printemps en une semaine, dont onze pour changer de practice.",
        },
      ],
      [
        {
          ...LILOU,
          texte: "La formation est bien. Mais en mars, je repars sur la même mission.",
        },
      ],
      [
        {
          ...LILOU,
          texte: "Rien ne change, donc. On attend que les marchés publics arrivent.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les seniors ne voient pas la suite",
    jusqua: 6,
    messages: () => [
      {
        ...LOMIG,
        heure: "08:55",
        alerte: true,
        texte:
          "Cinq ans chez Atlas, toujours senior. On me dit que je passerai manager « quand il y aura une équipe ». Halden m'a appelé deux fois ce mois-ci.",
      },
      {
        ...VICTOIRE,
        heure: "12:10",
        texte:
          "Publions la grille de carrière dès lundi : les critères de passage manager, le calendrier des comités. Ça prend une heure, et on montre qu'on bouge.",
      },
    ],
    sources: [
      {
        id: "seniors",
        titre: "Relire les entretiens des seniors partis faute de perspective",
        cout: 0.5,
        nature: "decisive",
        resultat: `Des ${ENTRETIENS.seniors.perspectives} seniors partis faute de perspective, trois sont devenus managers chez Halden ; trois sont partis chez des clients comme experts, sans encadrer personne. La grille d'Atlas ne connaît qu'une voie, manager, et personne n'a demandé aux quarante seniors en poste ce qu'ils attendent.`,
      },
      {
        id: "maintien",
        titre: "Demander ce que coûtent des entretiens de maintien",
        cout: 0.5,
        nature: "utile",
        resultat: `Quarante entretiens d'une heure avec les seniors de trois à six ans d'ancienneté, menés par les ressources humaines et non par leur manager : deux semaines, ${kE(MESURES.entretiens)} de temps et d'ajustements si une filière d'expertise s'ouvre. Dans les cabinets qui l'ont fait, une fois sur deux ou un peu plus (${pct(CHANCE_EXPERTISE)} selon le cabinet de rémunération), la majorité des seniors veut aussi une filière d'expertise.`,
      },
    ],
    question: "Comment donnez-vous une perspective aux seniors ?",
    options: [
      {
        t: "Publier dès lundi la grille de carrière actuelle, avec les critères de passage manager",
        d: `Rapide : ${kE(MESURES.grille)} de communication.`,
      },
      {
        t: "Mener d'abord des entretiens de maintien avec les seniors, puis publier des parcours qui leur répondent : manager, expertise, mobilité entre practices",
        d: `Publication en semaine 7. ${kE(MESURES.entretiens)} de temps et d'ajustements.`,
      },
      {
        t: "Promouvoir tout de suite huit seniors managers, pour retenir les meilleurs",
        d: `Augmentations de promotion et managers sans équipe : ${kE(MESURES.promotions)} sur l'année.`,
      },
      {
        t: "Attendre le comité de promotion de juin",
        d: "Ne coûte rien d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...LOMIG,
          texte: "J'ai lu la grille. Pour progresser, il faut encadrer, si je comprends bien.",
        },
      ],
      null,
      [
        {
          ...AISSATOU,
          texte:
            "Huit managers de plus, mais pas huit équipes : quatre d'entre eux resteront staffés comme seniors, au salaire de manager.",
        },
      ],
      [
        {
          ...LOMIG,
          texte: "Juin. D'accord. On verra qui sera encore là.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Six consultants sans mission, une practice qui recrute",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...NOE,
        heure: "09:30",
        alerte: true,
        texte:
          "Six de mes consultants sont en intercontrat depuis novembre : l'industrie a gelé ses programmes. Ils s'ennuient, et deux ont mis leur profil à jour sur les réseaux professionnels.",
      },
      {
        ...ABEL,
        heure: "10:05",
        texte:
          "J'ai six postes d'auditeur énergétique ouverts : les obligations de rénovation du tertiaire font exploser la demande. Je veux des ingénieurs confirmés, pas des consultants en organisation.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Démissions depuis janvier : ${ctx.demissions}, contre ${ctx.reference} au même stade l'an dernier. ${
          ctx.halden
            ? "Halden a confirmé l'ouverture de son bureau nantais."
            : "Halden reste à Paris cette année."
        }`,
      },
    ],
    sources: [
      {
        id: "certification",
        titre: "Se renseigner sur la certification d'auditeur énergétique",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Six semaines de formation certifiante, ${kE(POOL.formation)} par personne. Les reconversions réussissent ${pct(POOL.reussite.avecBourse)} du temps quand les candidats sont volontaires et repérés sur leurs souhaits, ${pct(POOL.reussite.sans)} quand on les désigne. ${
            ctx.bourse
              ? "Avec la bourse aux missions, quatre volontaires se sont déjà signalés."
              : "Sans bourse aux missions, il faudra désigner les quatre."
          } Si deux échouent, Abel devra prendre deux indépendants en urgence : ${kE(POOL.urgence)}.`,
      },
      {
        id: "harnois",
        titre: "Demander à Abel ce que coûte un auditeur recruté dehors",
        cout: 0.5,
        nature: "utile",
        resultat: `Un auditeur confirmé : ${kE(POOL.recrutementAuditeur)} de recrutement et trois mois de délai. Et d'après Tempora, quand l'intercontrat dure, près d'un consultant sur deux part dans l'année.`,
      },
    ],
    question: "Que faites-vous des six consultants de Performance opérationnelle ?",
    options: [
      {
        t: "Laisser Énergie et bâtiment recruter ses six auditeurs dehors ; les six attendent la reprise industrielle",
        d: "Chacun son métier. Rien de plus à payer.",
      },
      {
        t: "Organiser la mobilité : quatre d'entre eux rejoignent Énergie et bâtiment, avec la certification et un binôme senior ; deux recrutements dehors seulement",
        d: `${kE(POOL.partants * POOL.formation)} de formation, quatre recrutements de moins. Résultat de la certification en semaine 12.`,
      },
      {
        t: "Les prêter à Énergie et bâtiment en renfort, sans changer de practice, le temps de la reprise",
        d: `Facturés en appui des auditeurs : ${kE(POOL.margePret)} de marge. Énergie recrute ses six auditeurs.`,
      },
      {
        t: "Les affecter à l'avant-vente et aux appels d'offres publics du printemps",
        d: "Ne coûte rien, et les réponses aux marchés seront mieux préparées.",
      },
    ],
    reactions: [
      [
        {
          ...NOE,
          texte: "Je leur ai dit d'attendre. Ils ont souri poliment.",
        },
      ],
      [
        {
          ...ABEL,
          texte:
            "J'étais sceptique. Mais ils savent animer un atelier client, ce que mes ingénieurs font mal. On verra à la certification.",
        },
      ],
      [
        {
          ...ABEL,
          texte: "Merci pour le renfort. Mes auditeurs leur confient les relevés et les tableaux.",
        },
      ],
      [
        {
          ...NOE,
          texte: "Ils répondent aux appels d'offres. Ça les occupe.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le plan de recrutement du printemps",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...AISSATOU,
        heure: "09:00",
        alerte: true,
        texte: `Les écoles attendent nos promesses d'embauche pour la vague de printemps. Le budget prévoit ${PLAN.printemps} juniors, calés sur les départs de l'an dernier. ${PLAN.recale} promesses sont déjà signées.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Démissions depuis janvier : ${ctx.demissions}, contre ${ctx.reference} au même stade l'an dernier. Taux de départ estimé sur l'année : ${ctx.taux}.`,
      },
      {
        ...VICTOIRE,
        heure: "18:20",
        texte: `Le budget dit ${PLAN.printemps}. On a toujours recruté pour compenser les départs, ce n'est pas le moment de changer de méthode.`,
      },
    ],
    sources: [
      {
        id: "besoin",
        titre: "Recalculer le besoin de juniors avec les départs de l'année",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Au rythme de départs estimé aujourd'hui (${ctx.taux} sur l'année), il faut ${ctx.besoin} juniors au printemps pour remplacer les partants d'ici décembre, et non ${PLAN.printemps}. Un junior en trop, c'est quatre mois d'intercontrat, ${kE(PLAN.surplus)}, et des juniors qui s'en lassent ; un junior qui manque, des missions refusées ou sous-traitées sur Freelancia, ${kE(PLAN.manque)}.`,
      },
      {
        id: "ecoles",
        titre: "Appeler les relations écoles",
        cout: 0.5,
        nature: "utile",
        resultat: `Une deuxième vague en juin peut compléter le printemps : chaque recrue arrive plus tard, ${kE(PLAN.retardJuin)} de missions décalées. Tout geler coûte ${kE(PLAN.retardGel)} par recrue décalée, et notre place dans les forums de trois écoles : ${kE(PLAN.ecoles)} pour la retrouver l'an prochain.`,
      },
    ],
    question: "Que faites-vous du plan de recrutement ?",
    options: [
      {
        t: `Confirmer le plan du budget : ${PLAN.printemps} juniors au printemps`,
        d: "Les promesses partent lundi.",
      },
      {
        t: `Recaler le plan sur les départs constatés : les ${PLAN.recale} promesses signées au printemps, le reste décidé en juin selon les départs`,
        d: "Une deuxième vague en juin si besoin, avec des arrivées plus tardives.",
      },
      {
        t: `Recruter ${PLAN.accelere} juniors, pour prendre de l'avance sur Halden`,
        d: "Six de plus que le budget.",
      },
      {
        t: "Geler tous les recrutements jusqu'à l'été",
        d: "Les écoles seront prévenues ; on recrutera en juin ce qui manque.",
      },
    ],
    reactions: [
      [
        {
          ...AISSATOU,
          texte: `Les ${PLAN.printemps} promesses sont parties. Les écoles nous remercient.`,
        },
      ],
      [
        {
          ...AISSATOU,
          texte:
            "Dix arrivées au printemps, et un point sur les départs le 15 juin pour décider de la deuxième vague.",
        },
      ],
      [
        {
          ...GUSTAVE,
          texte: "Six juniors de plus que le budget. Où les staffe-t-on en septembre ?",
        },
      ],
      [
        {
          ...AISSATOU,
          texte:
            "Deux écoles m'ont déjà dit qu'elles proposeraient nos créneaux de forum à Kéroual Consulting.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Il manque six seniors",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...NOE,
        heure: "08:45",
        alerte: true,
        texte: `Un manager encadre en moyenne sept juniors, contre quatre il y a deux ans : il manque ${PYRAMIDE.manque} seniors dans la pyramide. Deux livrables sont partis chez des clients sans relecture ce mois-ci.`,
      },
      {
        ...VICTOIRE,
        heure: "11:00",
        texte:
          "Recrutons six seniors chez Halden et Kéroual, au prix du marché, et on n'en parle plus.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Taux de départ estimé sur l'année : ${ctx.taux}. Économie nette estimée : ${ctx.economie}.`,
      },
    ],
    sources: [
      {
        id: "pyramide",
        titre: "Comparer les façons de combler la pyramide",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Six seniors recrutés chez Halden ou Kéroual : ${kE(PYRAMIDE.recrutementSenior)} de cabinet chacun, et ${pct(PYRAMIDE.primeMarche)} au-dessus de notre grille ; les ${EFFECTIFS.seniors} seniors d'Atlas l'apprendront à la première réunion de practice. ${
            ctx.parcours
              ? "Neuf consultants confirmés remplissent les critères de passage senior publiés : six promotions, avec un mentor manager et une formation à l'encadrement,"
              : "Neuf consultants confirmés seraient prêts, mais aucun critère n'est publié : une promotion risque d'être lue comme du favoritisme. Six promotions, avec un mentor et une formation à l'encadrement,"
          } coûtent ${kE(PYRAMIDE.promotion)} sur l'année.`,
      },
      {
        id: "freelancia",
        titre: "Demander un devis à Freelancia",
        cout: 0.5,
        nature: "utile",
        resultat: `Six seniors indépendants pour encadrer les missions à risque : 1 100 € par jour, ${kE(PYRAMIDE.freelancia)} d'ici décembre. Ils partiront à la fin de leur contrat.`,
      },
    ],
    question: "Comment comblez-vous la pyramide ?",
    options: [
      {
        t: "Recruter six seniors chez Halden et Kéroual, au prix du marché",
        d: `${kE(PYRAMIDE.manque * PYRAMIDE.recrutementSenior)} de cabinet ; arrivées en juin.`,
      },
      {
        t: "Promouvoir seniors six consultants confirmés sur les critères publiés, avec un mentor manager et une formation à l'encadrement",
        d: `${kE(PYRAMIDE.promotion)} sur l'année. Ils apprendront en encadrant.`,
      },
      {
        t: "Prendre six seniors indépendants sur Freelancia pour les missions à risque",
        d: `${kE(PYRAMIDE.freelancia)} d'ici décembre.`,
      },
      {
        t: "Laisser les managers absorber l'encadrement jusqu'à l'été",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...LOMIG,
          texte:
            "Il paraît que les nouveaux seniors arrivent avec 12 % de plus que nous. C'est vrai ?",
        },
      ],
      [
        {
          ...LILOU,
          texte:
            "Deux consultants de ma promotion passent seniors, sur des critères que tout le monde connaît. Ça change la façon de voir les deux ans qui viennent.",
        },
      ],
      [
        {
          ...GUSTAVE,
          texte: "Freelancia facture ce que nos seniors coûteraient en un an, pour neuf mois.",
        },
      ],
      [
        {
          ...NOE,
          texte: "Mes managers relisent le soir. Ils tiendront jusqu'à l'été, j'espère.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Lire par segment, puis traiter chaque cause", chemin: [1, 1, 1, 1, 1, 1] },
  { nom: "S'aligner sur le marché", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [2, 3, 3, 0, 0, 3] },
] as const;

/**
 * Les réflexes du métier : [décision, option]. Augmenter tout le monde,
 * remplir l'occupation avec des régies, publier sans demander, recruter comme
 * le budget le dit, acheter des seniors au prix du marché.
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  entretiensExpertise:
    "Les quarante entretiens sont faits. Vingt-quatre seniors veulent progresser sans encadrer : une filière d'expertise, avec des grades et des tarifs. Les autres veulent passer manager, avec des critères clairs. Les parcours publiés en semaine 7 proposent les deux, et la mobilité entre practices.",
  entretiensManager:
    "Les quarante entretiens sont faits. La plupart veulent passer manager, avec des critères et un calendrier clairs ; une poignée préfère l'expertise. Les parcours publiés en semaine 7 disent les deux, et ouvrent la mobilité entre practices.",
  haldenOui:
    "Halden Partners confirme l'ouverture d'un bureau à Nantes au printemps : trente recrutements annoncés, d'abord des seniors et des profils data.",
  haldenNon:
    "Halden Partners repousse son bureau nantais à l'an prochain : ils recruteront depuis Paris.",
} as const;
