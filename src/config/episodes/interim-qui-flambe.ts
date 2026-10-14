/**
 * L'INTÉRIM QUI FLAMBE — le contenu de l'épisode.
 *
 * Cassien Calvayrac est le directeur des ressources humaines de l'Association
 * Solvanne. L'an dernier, Soralis Intérim Santé lui a facturé 1,9 M€, 60 % de
 * plus que l'année d'avant : surtout des infirmiers, surtout des week-ends,
 * surtout dans trois EHPAD (Chalon-sur-Saône, Beaune, Dijon-Grésilles). Le
 * CPOM impose un retour à l'équilibre, et la directrice générale veut une note
 * qui plafonne l'intérim. Janvier commence, avec la grippe. Six décisions,
 * chacune précédée de ce qu'un DRH reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle ; un test les recalcule.
 *
 * Association, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";
import {
  ABSENCES_SOCLE,
  CABINET,
  CAMPAGNE_ETE,
  CDD_POSTE,
  CONGES,
  CONGES_INTERNES,
  CONTRAT,
  COORDINATION,
  DEUXIEME_AGENCE,
  EPIDEMIES,
  ENVELOPPE,
  HEURES_AN,
  HEURES_POSTE_COUT,
  HIVER,
  INTERIM_ASSOCIATION,
  INTERIM_DEPART,
  INTERIM_HEURE,
  INTERIM_POSTE,
  POOL_AN,
  POOL_CAPACITE,
  POOL_CAPACITE_AN,
  POOL_DEPLACEMENTS,
  POOL_PRIME,
  POOLS,
  PLAFOND,
  RENFORT,
  REMISE_SORALIS,
  SALAIRE_HEURE,
  SALAIRE_POSTE,
  SERVICE,
  SERVICE_PIC,
  SEUIL_POOL,
  SURCOUT_ANNUEL_IDE,
  VACANTS_DEPART,
  recoursParMotif,
} from "@/engine/episodes/interim-qui-flambe";
import { euros, kE, nombre, taux } from "./format";

export const DIAGNOSTICS = [
  {
    id: "symptome",
    t: "L'intérim est un symptôme : des postes vacants tenus en intérim depuis des mois, des absences imprévues que rien d'interne ne remplace, des congés planifiés trop tard pour être remplacés autrement",
  },
  {
    id: "vacances",
    t: "Ce sont les postes d'infirmier vacants : tant qu'ils ne seront pas pourvus, l'intérim restera",
  },
  {
    id: "tarif",
    t: "Soralis Intérim Santé facture trop cher : c'est le tarif qu'il faut faire baisser",
  },
  {
    id: "facilite",
    t: "Les établissements appellent l'agence trop facilement : il manque un contrôle du siège sur chaque demande",
  },
] as const;

const URSULE = { de: "Ursule Mauvernay", role: "Directrice générale" } as const;
const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice administrative et financière",
} as const;
const SIGISMOND = {
  de: "Sigismond Ravanel",
  role: "Directeur de l'EHPAD de Chalon-sur-Saône",
} as const;
const GUILLEMETTE = {
  de: "Guillemette Bouchardat",
  role: "Infirmière coordinatrice, EHPAD de Beaune",
} as const;
const ADALGISE = {
  de: "Adalgise Ansquer",
  role: "Directrice de l'EHPAD de Dijon-Grésilles",
} as const;
const ILINCA = {
  de: "Ilinca Gautheron",
  role: "Responsable de l'agence Soralis Intérim Santé de Dijon",
} as const;
const HAROUN = {
  de: "Haroun Moissenet",
  role: "Infirmier intérimaire, en mission à Chalon",
} as const;
const MARIAMA = {
  de: "Mariama Grosjacques",
  role: "Aide-soignante à Beaune, élue au CSE",
} as const;
const FADILA = {
  de: "Fadila Benmansour",
  role: "Responsable de la paie et des plannings, siège",
} as const;
const IOANA = {
  de: "Dr Ioana Mureșan",
  role: "Médecin coordonnateur, EHPAD de Chalon-sur-Saône",
} as const;
const MIHAELA = { de: "Mihaela Vasilescu", role: "Contrôleuse de gestion, siège" } as const;
const TABLEAU = "Tableau de bord des remplacements";

/** Les recours de l'an dernier, par motif, tels que la source les donne. */
const IDE = recoursParMotif("ide");
const AS = recoursParMotif("as");
const part = (x: number, total: number) => taux(x / total, 0);
/** Ce que coûte un poste de 12 heures, selon qui le tient. */
const poste = (v: number) => euros(v);

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La facture de l'intérim",
    jusqua: 2,
    messages: () => [
      {
        de: TABLEAU,
        role: "Alerte automatique",
        heure: "07:40",
        alerte: true,
        texte: `Intérim de l'an dernier : ${kE(INTERIM_ASSOCIATION)} pour l'association, 60 % de plus que l'année précédente. La semaine dernière, Chalon, Beaune et Dijon-Grésilles ont commandé ${kE(INTERIM_DEPART)} à Soralis Intérim Santé.`,
      },
      {
        ...URSULE,
        heure: "08:50",
        texte: `Cassien, le CPOM nous impose un retour à l'équilibre, et l'ARS a lu notre ERRD : le surcoût de remplacement des trois EHPAD doit tenir dans ${kE(ENVELOPPE)} cette année. Je veux une note signée vendredi : plus d'intérim sans accord du siège, et un plafond par établissement. Tu me la prépares ?`,
      },
      {
        ...SIGISMOND,
        heure: "10:15",
        texte:
          "Cassien, si on me plafonne l'intérim en plein mois de janvier, je ferme des postes d'infirmier le week-end. Je préfère le dire maintenant. La grippe arrive, le bulletin régional l'annonce pour février.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "recours",
        titre: "Analyser les recours de l'an dernier par motif et par établissement",
        cout: 1,
        nature: "decisive",
        resultat: `Les trois EHPAD pèsent ${kE(INTERIM_DEPART * 52)} des ${kE(INTERIM_ASSOCIATION)}, ${part(INTERIM_DEPART * 52, INTERIM_ASSOCIATION)} : Chalon 42 %, Beaune 34 %, Dijon-Grésilles 24 %. Une semaine ordinaire, ils commandent ${nombre(IDE.total, 0)} postes de 12 heures d'infirmier et ${nombre(AS.total, 0)} d'aide-soignant. Pour les infirmiers : ${part(IDE.vacants, IDE.total)} tiennent les ${VACANTS_DEPART.ide} postes vacants, ${part(IDE.absences, IDE.total)} remplacent des absences imprévues, ${part(IDE.conges, IDE.total)} des congés. Pour les aides-soignants : ${part(AS.vacants, AS.total)} pour les ${VACANTS_DEPART.as} postes vacants, ${part(AS.absences, AS.total)} pour des absences imprévues, ${part(AS.conges, AS.total)} pour des congés. Les absences imprévues tombent pour moitié un samedi ou un dimanche. Aucun établissement n'a de remplaçant interne : on appelle quelques volontaires, puis l'agence.`,
      },
      {
        id: "contrat",
        titre: "Relire le contrat et les factures de Soralis Intérim Santé",
        cout: 0.5,
        nature: "decisive",
        resultat: `Soralis facture ${euros(INTERIM_HEURE.ide)} l'heure d'infirmier et ${euros(INTERIM_HEURE.as)} l'heure d'aide-soignant, tarif unique, week-ends compris : un poste de 12 heures coûte ${poste(INTERIM_POSTE.ide)} et ${poste(INTERIM_POSTE.as)}. Elle pourvoit ${taux(SERVICE, 0)} des postes demandés, ${taux(SERVICE - SERVICE_PIC, 0)} seulement au pic de la grippe de février dernier. Sur les postes vacants de Chalon et de Beaune, ce sont les trois mêmes infirmiers qui viennent chaque semaine depuis septembre, avec deux vacataires de Solvanne.`,
      },
      {
        id: "paie",
        titre: "Demander à la paie ce que coûte un salarié",
        cout: 1,
        nature: "decisive",
        resultat: `Un infirmier salarié coûte ${euros(SALAIRE_HEURE.ide)} de l'heure, charges comprises, un aide-soignant ${euros(SALAIRE_HEURE.as)} ; un temps plein fait ${nombre(HEURES_AN, 0)} heures par an. Un poste de 12 heures : ${poste(SALAIRE_POSTE.ide)} et ${poste(SALAIRE_POSTE.as)}. En heures majorées de 25 % (un volontaire sur son repos) : ${poste(HEURES_POSTE_COUT.ide)} et ${poste(HEURES_POSTE_COUT.as)} ; en CDD, prime de précarité et congés payés compris : ${poste(CDD_POSTE.ide)} et ${poste(CDD_POSTE.as)}. Les plannings sont publiés quinze jours avant : quatre congés sur cinq sont remplacés par l'intérim, faute de temps pour trouver mieux.`,
      },
      {
        id: "marche",
        titre: "Comparer les tarifs de Soralis à ceux d'autres agences",
        cout: 1,
        nature: "bruit",
        resultat:
          "Deux autres agences de la région facturent l'heure d'infirmier entre 57 et 63 € ; Soralis est dans la moyenne. L'une d'elles ferait 4 % de moins, mais ne garantit pas les week-ends. Les EHPAD d'Orchidia Résidences ont obtenu de Soralis une remise contre l'exclusivité.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Médéric Amegavi, directeur de la Clinique du Val Solvanne",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Médéric : « À la clinique, on a cessé de regarder la facture de l'agence. On regarde pourquoi on l'appelle. Ce n'est pas la même réponse pour un poste vide depuis six mois et pour une infirmière qui a la grippe un samedi. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous à la directrice générale vendredi ?",
    options: [
      {
        t: "Faire signer la note : plus d'intérim pour absences et congés sans accord du siège, et un plafond par établissement",
        d: `Au plus ${PLAFOND.ide} postes d'infirmier et ${PLAFOND.as} d'aide-soignant par semaine pour les trois EHPAD. Les postes vacants restent tenus.`,
      },
      {
        t: "Renégocier le tarif de Soralis Intérim Santé contre l'exclusivité",
        d: `Une remise de ${taux(REMISE_SORALIS.forte, 0)} est sur la table, contre l'engagement de ne travailler qu'avec elle.`,
      },
      {
        t: "Publier les plannings huit semaines à l'avance et ouvrir une bourse de remplacement aux salariés et aux vacataires",
        d: `Chaque remplacement est d'abord proposé en interne, en heures majorées ou en CDD ; l'agence en dernier recours. Une coordinatrice à mi-temps au siège : ${euros(COORDINATION)} par semaine.`,
      },
      {
        t: "Laisser les établissements gérer, et faire le point fin mars",
        d: "Ne coûte rien de plus. Chacun connaît ses équipes.",
      },
    ],
    reactions: [
      [
        {
          ...SIGISMOND,
          texte:
            "La note est arrivée. Samedi, je n'avais pas d'accord du siège à 6 heures du matin : une aide-soignante a fait les gestes de l'infirmière manquante, et j'ai rappelé une collègue sur son repos.",
        },
      ],
      null,
      [
        {
          ...MARIAMA,
          texte:
            "Les plannings de février et mars sont affichés. Plusieurs collègues ont déjà pris des remplacements dans la bourse : on choisit, on est payé en heures majorées, et on travaille avec des gens qu'on connaît.",
        },
      ],
      [
        {
          ...URSULE,
          texte: "Pas de note, pas de plan ? Je relirai la facture de Soralis fin mars, alors.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Un pool de remplacement ?",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...GUILLEMETTE,
        heure: "09:20",
        alerte: true,
        texte:
          "Cassien, trois infirmières en arrêt cette semaine à Beaune, dont deux pour le week-end. Si on avait deux ou trois infirmiers qui connaissent la maison et qu'on puisse appeler, je n'appellerais pas Soralis.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 2 : ${ctx.interim} d'intérim, ${ctx.nonPourvus} postes de 12 heures non pourvus, ${ctx.absences} postes d'absence imprévue à remplacer.`,
      },
      {
        ...EUDOXIE,
        heure: "18:30",
        texte:
          "Un pool, ce sont des salaires fixes, qu'il y ait des absences ou non. Combien en faut-il, et à partir de quand ça paie ? Je veux le calcul avant de signer quoi que ce soit.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "absences",
        titre: "Relire les absences imprévues de l'an dernier, semaine par semaine",
        cout: 0.5,
        nature: "decisive",
        resultat: `Hors épidémie, les trois EHPAD ont à remplacer chaque semaine ${ABSENCES_SOCLE.ide} postes de 12 heures d'infirmier et ${ABSENCES_SOCLE.as} d'aide-soignant d'absences imprévues : c'est le socle, d'avril à décembre, à 10 % près. L'hiver en ajoute ${taux(HIVER - 1, 0)}, et la grippe de février dernier les a portés à ${nombre(ABSENCES_SOCLE.ide * (HIVER + 1), 0)} et ${nombre(ABSENCES_SOCLE.as * (HIVER + 1), 0)} pendant deux semaines. Les congés à remplacer, eux, vont de ${CONGES[0]!.ide} postes d'infirmier par semaine l'hiver à ${CONGES[2]!.ide} l'été.`,
      },
      {
        id: "pool",
        titre: "Chiffrer un pool de remplacement avec la paie",
        cout: 0.5,
        nature: "decisive",
        resultat: `Un infirmier du pool, en CDI, coûte ${euros(POOL_AN.ide)} par an : son salaire, une prime de polyvalence de ${euros(POOL_PRIME)} et ${euros(POOL_DEPLACEMENTS.ide)} de déplacements entre Chalon, Beaune et Dijon. Un aide-soignant, ${euros(POOL_AN.as)}. Chacun tient ${POOL_CAPACITE_AN} postes de 12 heures par an, ses congés et ses absences déduits, soit ${nombre(POOL_CAPACITE)} par semaine. Il remplace d'abord les absences imprévues ; ses heures libres servent aux congés. Chaque poste qu'il tient à la place de l'agence évite un poste d'intérim à ${euros(INTERIM_POSTE.ide)} ou ${euros(INTERIM_POSTE.as)} ; à la place d'un volontaire ou d'un CDD, il n'évite presque rien. Il paie donc s'il tient au moins ${nombre(SEUIL_POOL.ide, 0)} postes par an qui seraient partis à l'intérim, ${taux(SEUIL_POOL.ide / POOL_CAPACITE_AN, 0)} de sa capacité ; en dessous, c'est un salaire qui attend.`,
      },
      {
        id: "cse",
        titre: "En parler aux élus du CSE",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Mariama Grosjacques : « Des volontaires, il y en aura, si on choisit de quel site on dépend et si la prime suit. Ce qu'on ne veut pas, c'est le pool qui sert à boucher les trous du planning de toute l'association. »",
      },
    ],
    question: "Que faites-vous ?",
    options: [
      {
        t: "Pas de pool : les établissements gardent la main",
        d: "Ne coûte rien de plus. Les absences continuent d'aller à l'agence.",
      },
      {
        t: `Un pool dimensionné sur le socle des absences : ${POOLS.socle.ide} infirmiers et ${POOLS.socle.as} aides-soignants`,
        d: `Recrutés parmi les volontaires et les vacataires, opérationnels en semaine 5. ${kE(POOLS.socle.ide * POOL_AN.ide + POOLS.socle.as * POOL_AN.as)} par an.`,
      },
      {
        t: `Un pool dimensionné sur le pic de février : ${POOLS.pic.ide} infirmiers et ${POOLS.pic.as} aides-soignants`,
        d: `Opérationnel en semaine 6, le temps de recruter. ${kE(POOLS.pic.ide * POOL_AN.ide + POOLS.pic.as * POOL_AN.as)} par an.`,
      },
      {
        t: `Le pool du socle, et un renfort d'hiver en CDD jusqu'à fin mars : ${RENFORT.ide} infirmiers et ${RENFORT.as} aides-soignants de plus`,
        d: "Le renfort arrive en semaine 6 et s'arrête avec l'hiver, au coût d'un CDD.",
      },
    ],
    reactions: [
      [
        {
          ...GUILLEMETTE,
          texte: "Bien reçu. J'ai rappelé Soralis pour le week-end.",
        },
      ],
      [
        {
          ...MARIAMA,
          texte:
            "Onze candidatures pour le pool en trois jours, dont deux vacataires qui travaillent déjà chez nous. Ils commencent en semaine 5.",
        },
      ],
      [
        {
          ...FADILA,
          texte:
            "Vingt-deux personnes à recruter : on aura tout le monde en semaine 6. D'ici là, il faut leur trouver des remplacements à faire.",
        },
      ],
      [
        {
          ...FADILA,
          texte:
            "Le pool du socle démarre en semaine 5, le renfort en semaine 6. Les contrats du renfort s'arrêtent fin mars.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les postes vacants",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...SIGISMOND,
        heure: "11:05",
        alerte: true,
        texte: `Cassien, ${ctx.vacantsIde} postes d'infirmier sont vacants dans les trois EHPAD, deux chez moi depuis septembre. Aucune candidature depuis Noël. Haroun, l'infirmier que Soralis nous envoie chaque semaine, connaît mieux mes résidents que certains salariés.`,
      },
      {
        ...HAROUN,
        heure: "14:30",
        texte:
          "Monsieur Calvayrac, je peux vous parler franchement ? L'intérim me va parce que je choisis mes jours. Si je savais mon planning deux mois à l'avance, je ne serais pas contre un contrat chez vous.",
      },
    ],
    sources: [
      {
        id: "reguliers",
        titre: "Regarder qui tient les postes vacants, et ce qu'ils demandent",
        cout: 0.5,
        nature: "decisive",
        resultat: `Cinq remplaçants tiennent l'essentiel des postes vacants : trois infirmiers de Soralis, dont Haroun Moissenet, et deux vacataires de Solvanne, dont Quynh Desvignes. Interrogés par Fadila, ils demandent tous la même chose : un planning connu longtemps à l'avance. Un poste d'infirmier tenu en intérim coûte ${kE(SURCOUT_ANNUEL_IDE)} de plus par an qu'un salarié. Et la clause du contrat de Soralis qui interdirait d'embaucher ses intérimaires est réputée non écrite : le code du travail l'interdit.`,
      },
      {
        id: "cabinet",
        titre: "Consulter un cabinet de recrutement spécialisé",
        cout: 0.5,
        nature: "utile",
        resultat: `Le cabinet facture ${euros(CABINET.honoraires)} par recrutement réussi et conseille une prime d'engagement de ${euros(CABINET.prime)}. Pour des infirmiers en EHPAD, il réussit une recherche sur deux, en huit semaines : une arrivée en semaine ${CABINET.arrivee}, au mieux.`,
      },
    ],
    question: "Que faites-vous des postes vacants ?",
    options: [
      {
        t: "Proposer un CDI aux remplaçants réguliers, avec un planning choisi deux mois à l'avance et la reprise de leur ancienneté",
        d: "Les cinq qui viennent chaque semaine. Ils prendraient leur poste en semaine 8, à la fin de leur mission. Ils diront oui, ou pas.",
      },
      {
        t: "Confier deux recherches à un cabinet, avec une prime d'engagement",
        d: `${euros(CABINET.annonce)} d'annonces, puis ${euros(CABINET.honoraires)} et ${euros(CABINET.prime)} par recrue. Arrivée en semaine ${CABINET.arrivee}, si le cabinet trouve.`,
      },
      {
        t: "Garder l'intérim sur ces postes jusqu'à l'été",
        d: "Les remplaçants connaissent les résidents ; rien ne change.",
      },
      {
        t: "Proposer aux remplaçants réguliers un CDD de huit mois, avec le même planning choisi",
        d: "Ils gardent leur liberté au bout de huit mois. Ils commenceraient en semaine 6, au coût d'un CDD.",
      },
    ],
    reactions: [
      [
        {
          ...FADILA,
          texte:
            "Les cinq propositions de CDI sont parties ce matin, avec les plannings d'avril et de mai. Ils répondent d'ici la semaine prochaine.",
        },
      ],
      [
        {
          ...FADILA,
          texte: "Le cabinet a publié les annonces lundi. Premiers entretiens dans trois semaines.",
        },
      ],
      [
        {
          ...SIGISMOND,
          texte: "Très bien. Haroun reste en mission chez nous, tant que Soralis nous l'envoie.",
        },
      ],
      [
        {
          ...FADILA,
          texte:
            "Les cinq propositions de CDD sont parties ce matin, avec les plannings jusqu'à l'automne. Ils répondent d'ici lundi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "La grippe",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...IOANA,
        heure: "08:10",
        alerte: true,
        texte: `Cas groupés de grippe dans deux unités de Chalon, et le bulletin régional décrit une épidémie ${ctx.epidemie}, avec un pic attendu dans deux à trois semaines. Les soignants tombent malades à leur tour.`,
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 6 : ${ctx.absences} postes d'absence imprévue à remplacer, ${ctx.nonPourvus} non pourvus, ${ctx.interim} d'intérim.${ctx.avecPool ? ` Le pool a tenu ${ctx.poolUtilisation} de sa capacité.` : ""}`,
      },
      {
        ...URSULE,
        heure: "18:40",
        texte:
          "Les directeurs me demandent des consignes pour les trois semaines qui viennent. Qu'est-ce qu'on leur dit ?",
      },
    ],
    sources: [
      {
        id: "pic",
        titre: "Faire le point avec les établissements sur les trois semaines à venir",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Au pic, les absences imprévues pourraient doubler. Soralis prévient : tous ses clients appellent en même temps, elle ne pourvoira qu'environ ${ctx.servicePic} des postes demandés. Ce qui coûte le moins, dans l'ordre : ${ctx.avecPool ? "le pool, déjà payé, " : ""}les volontaires en heures majorées (${poste(HEURES_POSTE_COUT.ide)} le poste d'infirmier), puis l'agence (${poste(INTERIM_POSTE.ide)}). Un poste d'infirmier laissé vide en pleine épidémie, c'est 90 résidents, dont des malades à surveiller et à faire boire, pour une seule infirmière. Les animations et les bilans non urgents peuvent attendre trois semaines ; les intérimaires déjà venus connaissent les résidents.`,
      },
      {
        id: "economies",
        titre: "Demander à la contrôleuse de gestion ce que la note a économisé",
        cout: 0.5,
        nature: "bruit",
        resultat: (ctx) =>
          ctx.note
            ? `Mihaela Vasilescu : « Depuis la note, l'intérim a baissé, ${ctx.interim} la semaine dernière. Mais ${ctx.nonPourvus} postes sont restés vides, et les rappels sur repos ont doublé. »`
            : `Mihaela Vasilescu : « Il n'y a pas de note, donc rien à mesurer. L'intérim de la semaine dernière : ${ctx.interim}. »`,
      },
    ],
    question: "Quelles consignes donnez-vous pour le pic ?",
    options: [
      {
        t: "Pas d'intérim pour les absences pendant le pic : rappeler les agents sur leurs repos et regrouper les soins",
        d: "Les postes vacants restent tenus. L'intérim pour absences et congés est suspendu jusqu'à la fin du pic.",
      },
      {
        t: "Comme d'habitude : chaque établissement appelle Soralis pour chaque absence, sans plafond pendant le pic",
        d: "Le plafond, s'il y en a un, est levé pour trois semaines.",
      },
      {
        t: "Un plan de continuité gradué : le pool d'abord, puis les volontaires, puis Soralis en demandant les intérimaires déjà venus, et ce qui peut attendre reporté",
        d: "Le plafond, s'il y en a un, est levé pour trois semaines. Le pool va là où l'épidémie frappe.",
      },
    ],
    reactions: [
      [
        {
          ...GUILLEMETTE,
          texte:
            "Trois collègues rappelées sur leurs repos ce week-end, dont une qui sortait d'une grippe. Samedi soir, une seule infirmière pour 88 résidents.",
        },
      ],
      [
        {
          ...ILINCA,
          texte:
            "Nous faisons au mieux, mais tous nos clients appellent en même temps. Certains postes du week-end ne seront pas pourvus.",
        },
      ],
      [
        {
          ...ADALGISE,
          texte:
            "Le tableau des volontaires est rempli jusqu'à dimanche. Soralis nous envoie les infirmiers qu'on connaît, et on a décalé les bilans non urgents à mars.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Les congés de l'été",
    jusqua: 10,
    messages: () => [
      {
        ...FADILA,
        heure: "10:30",
        alerte: true,
        texte: `Chaque année, les congés d'été sont validés en mai et les plannings publiés à quinze jours. L'été dernier, il fallait remplacer ${CONGES[2]!.ide} postes d'infirmier et ${CONGES[2]!.as} d'aide-soignant de congés par semaine, et l'intérim en a pris quatre sur cinq.`,
      },
      {
        ...EUDOXIE,
        heure: "11:15",
        texte:
          "Et si on limitait les congés d'été à deux semaines par personne ? Moins de congés à remplacer, moins d'intérim.",
      },
    ],
    sources: [
      {
        id: "ete",
        titre: "Chiffrer les remplacements de l'été avec la paie",
        cout: 0.5,
        nature: "decisive",
        resultat: `Des congés arrêtés avant le 31 mars et des plannings publiés jusqu'à fin juin laissent le temps de recruter en avril des CDD de trois mois : jeunes diplômés de juin, étudiants en soins infirmiers comme aides-soignants. Les EHPAD qui le font remplacent ${taux(CONGES_INTERNES.ete, 0)} de leurs congés d'été en interne, à ${poste(CDD_POSTE.ide)} le poste d'infirmier au lieu de ${poste(INTERIM_POSTE.ide)}. La campagne coûte ${euros(CAMPAGNE_ETE)}.`,
      },
      {
        id: "droit",
        titre: "Vérifier ce que dit le droit des congés, et ce qu'en pensent les équipes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le congé principal doit compter au moins douze jours ouvrables continus entre le 1er mai et le 31 octobre : deux semaines, c'est légal. Mais dans l'enquête de l'an dernier, six soignants sur dix citent les congés d'été parmi les raisons de partir, et Beaune a perdu deux aides-soignantes en septembre pour cette raison.",
      },
    ],
    question: "Comment préparez-vous l'été ?",
    options: [
      {
        t: "Arrêter les congés d'été avant le 31 mars, publier les plannings jusqu'à fin juin, et signer en avril des CDD de trois mois",
        d: `Une campagne de recrutement en avril, ${euros(CAMPAGNE_ETE)}.`,
      },
      {
        t: "Limiter les congés d'été à deux semaines consécutives par personne",
        d: "Moins de congés à remplacer en juillet et en août.",
      },
      {
        t: "Comme chaque année : congés validés en mai, plannings à quinze jours",
        d: "L'intérim prendra l'été, comme d'habitude.",
      },
    ],
    reactions: [
      [
        {
          ...MARIAMA,
          texte:
            "Pour la première fois, on saura en avril qui part quand. Les collègues s'arrangent entre elles, et les CDD d'été connaîtront la maison avant juillet.",
        },
      ],
      [
        {
          ...MARIAMA,
          texte:
            "La note sur les congés est affichée. En salle de pause, deux collègues parlent déjà de regarder ailleurs pour l'été.",
        },
      ],
      [
        {
          ...FADILA,
          texte: "Entendu. On fera comme d'habitude, en mai.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le contrat-cadre de Soralis",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...ILINCA,
        heure: "09:00",
        alerte: true,
        texte: `Monsieur Calvayrac, nous vous proposons un contrat-cadre d'avril à décembre : ${taux(CONTRAT.remise, 0)} sur tous nos tarifs, et la priorité sur nos intérimaires, contre un volume minimal de ${kE(CONTRAT.engagement)} facturés sur la période. Le volume non consommé serait facturé à ${taux(CONTRAT.dedit, 0)}. Réponse avant le 31 mars.`,
      },
      {
        ...URSULE,
        heure: "12:20",
        texte: `${taux(CONTRAT.remise, 0)} de remise, c'est exactement le genre de chose que l'ARS aime lire dans un ERRD. Surcoût de remplacement à date : ${ctx.surcout}. Tu en penses quoi ?`,
      },
    ],
    sources: [
      {
        id: "projection",
        titre: "Projeter l'intérim d'avril à décembre avec ce qui est en place",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Avec les postes, le pool, les plannings et les contrats en place aujourd'hui, sans épidémie, Soralis facturerait environ ${ctx.projection} d'avril à décembre, au tarif actuel. Le volume minimal du contrat-cadre est de ${kE(CONTRAT.engagement)}. En dessous, chaque euro non consommé coûte ${nombre(CONTRAT.dedit * 100, 0)} centimes.`,
      },
      {
        id: "orchidia",
        titre: "Se renseigner sur le contrat d'Orchidia Résidences",
        cout: 0.5,
        nature: "utile",
        resultat: `Orchidia Résidences a signé un contrat de ce type il y a deux ans, puis monté son propre pool de remplacement : elle a payé un dédit l'année suivante. Une deuxième agence de la région accepterait d'être référencée à ${taux(DEUXIEME_AGENCE.remise, 0)} sous Soralis, sans volume minimal, pour ${euros(DEUXIEME_AGENCE.frais)} de frais d'ouverture.`,
      },
    ],
    question: "Que répondez-vous à Soralis ?",
    options: [
      {
        t: "Signer le contrat-cadre",
        d: `${taux(CONTRAT.remise, 0)} sur tous les tarifs dès la semaine 12, contre ${kE(CONTRAT.engagement)} de volume minimal d'avril à décembre.`,
      },
      {
        t: "Garder Soralis sans engagement, en dernier recours, et suivre chaque mois les recours par motif et par établissement",
        d: "Chaque demande d'intérim est justifiée par son motif ; le comité de direction revoit le tableau chaque mois.",
      },
      {
        t: "Référencer une deuxième agence pour mettre Soralis en concurrence",
        d: `${taux(DEUXIEME_AGENCE.remise, 0)} sous le tarif de Soralis, ${euros(DEUXIEME_AGENCE.frais)} de frais d'ouverture.`,
      },
      {
        t: "Ne pas répondre et laisser le contrat actuel courir",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...ILINCA,
          texte: "Merci de votre confiance. Le contrat-cadre prend effet lundi.",
        },
      ],
      [
        {
          ...MIHAELA,
          texte:
            "Le premier tableau mensuel est prêt : recours par motif et par établissement, et ce que chacun a trouvé en interne avant d'appeler l'agence.",
        },
      ],
      [
        {
          ...ILINCA,
          texte: "Nous prenons acte. Nous resterons à votre disposition, au tarif actuel.",
        },
      ],
      [
        {
          ...ILINCA,
          texte: "Sans réponse de votre part, notre offre tombe le 31 mars.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Traiter les causes de l'intérim", chemin: [2, 1, 0, 2, 0, 1] },
  { nom: "Plafonner la dépense et négocier le tarif", chemin: [0, 0, 2, 0, 1, 0] },
  { nom: "Attentiste", chemin: [3, 0, 2, 1, 2, 3] },
] as const;

/**
 * Les réflexes d'un DRH sous la pression d'une facture, [décision, option] : plafonner
 * l'intérim par une note, ou faire baisser le tarif de l'agence (contre l'exclusivité, puis
 * contre un volume minimal). Limiter les congés d'été n'y figure pas : c'est réduire le besoin,
 * pas plafonner la dépense ni négocier le prix.
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [3, 0],
  [5, 0],
] as const;

export const REPONSES = {
  remiseForte: `Nous acceptons ${taux(REMISE_SORALIS.forte, 0)} de remise, contre l'exclusivité. Nous vous enverrons les intérimaires disponibles.`,
  remiseFaible: `Nous ne pouvons pas aller au-delà de ${taux(REMISE_SORALIS.faible, 0)}, contre l'exclusivité. Nous vous enverrons les intérimaires disponibles.`,
  reguliersPerdus:
    "Haroun et les deux autres infirmiers de Soralis ne viennent plus : l'agence les a envoyés chez des clients à plein tarif. Leurs remplaçants découvrent les résidents.",
} as const;

/** Le nom de l'épidémie, tel que le bulletin régional le donne. */
export const nomEpidemie = (amplitude: number) =>
  amplitude >= EPIDEMIES.forte.amplitude
    ? "forte"
    : amplitude >= EPIDEMIES.moyenne.amplitude
      ? "d'intensité moyenne"
      : "plutôt faible";
