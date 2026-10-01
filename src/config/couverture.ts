import { ATELIERS } from "./ateliers";

/**
 * LA COUVERTURE D'UN RÉFÉRENTIEL, LUE DANS LES ATELIERS.
 *
 * La page des parcours répondait à la seule question qu'un enseignant pose
 * avant toutes les autres — « est-ce que ça couvre mon programme ? » — pour
 * quatre diplômes sur treize. Les neuf autres recevaient un nom et un lien.
 * Le tableau était écrit à la main, donc il n'existait que là où quelqu'un
 * l'avait écrit.
 *
 * OR LA RÉPONSE EST DÉJÀ DANS LES DONNÉES. Chaque séance d'atelier nomme les
 * blocs du référentiel qu'elle mobilise, avec les mots du référentiel lui-même
 * (`processus`). Regroupés par bloc, ils disent exactement quelles séances le
 * mettent en jeu, et combien il en reste. Ce comptage ne s'invente pas et ne
 * se périme pas : ajoutez une séance, la couverture suit.
 *
 * DEUX CHOSES QUE LE COMPTAGE NE SAIT PAS DIRE, et qui restent écrites ici.
 *
 * La première est l'adéquation. Un bloc présent dans deux séances sur six peut
 * être le cœur du jeu si ces deux séances sont celles qui décident de tout.
 * La part des séances donne donc un défaut honnête, qu'une valeur DÉCLARÉE
 * corrige là où l'auteur de l'atelier sait mieux. L'écart est visible en
 * relisant ce fichier, ce qui est le but : une correction se justifie.
 *
 * La seconde est ce qui se joue vraiment. « Bloc 3 · Assurer la gestion
 * opérationnelle » est le nom du référentiel, pas une promesse ; « compte de
 * résultat, stocks au CUMP, crise de trésorerie du tour 4 » en est une. Ces
 * phrases-là ne se dérivent d'aucun champ et vivent dans COMMENTAIRES.
 *
 * Elles viennent des tableaux jadis écrits à la main dans parcours.ts, d'où
 * elles ont été déplacées plutôt que recopiées : une phrase à deux endroits
 * est une phrase qui se contredira.
 */

/** Ce qu'un bloc de référentiel vaut dans l'atelier qui le mobilise. */
export type Adequation = "coeur" | "couvert" | "partiel";

export interface BlocCouvert {
  /** Le bloc, nommé comme son référentiel le nomme. */
  referentiel: string;
  /** Les séances qui le mettent en jeu, par leur numéro et leur titre. */
  seances: { numero: number; titre: string }[];
  /** Le nombre total de séances de l'atelier : « 3 sur 6 » n'a de sens qu'ainsi. */
  seancesEnTout: number;
  adequation: Adequation;
  /** Vrai si l'adéquation a été corrigée à la main plutôt que comptée. */
  declaree: boolean;
  /** Ce qui se joue réellement, quand quelqu'un a pris la peine de l'écrire. */
  commentaire?: string;
}

/**
 * CE QUI SE JOUE, BLOC PAR BLOC.
 *
 * La clé est le nom exact du bloc tel qu'une séance le nomme : une garde
 * vérifie qu'aucune clé ne désigne un bloc qui n'existe pas, faute de quoi une
 * phrase écrite pour un référentiel refondu resterait là sans jamais
 * s'afficher, et personne ne le saurait.
 */
const COMMENTAIRES: Record<string, string> = {
  "Création de valeur et performance · Première, sciences de gestion et numérique":
    "Tours 1-2 : fixer un prix face à SoundBox, lire son premier compte de résultat, découvrir le seuil dans la situation dédiée, puis suivre sa part de marché et son IPG.",
  "Temps et risque · Première, sciences de gestion et numérique":
    "Tour 4 : la crise de trésorerie (clients qui paient à 60 j). Cartes événements et arbitrage de l'assurance catastrophe : un coût certain contre un risque incertain.",
  "De l'individu à l'acteur · Première, sciences de gestion et numérique":
    "Le jeu se joue en équipe : chaque décision est un arbitrage collectif. La rémunération et la motivation se vivent au niveau Arbitrage (RH) pour les groupes avancés.",
  "Numérique et intelligence collective · Première, sciences de gestion et numérique":
    "Les KPI, graphiques et classements de l'arène sont l'information de gestion : apprendre à les lire, c'est le cours.",
  "Bloc 2 · Animer et dynamiser l'offre commerciale":
    "Chaque tour : arbitrer prix et budget marketing face à des segments à élasticités différentes, avec seuils psychologiques, sans oublier les cartes marché qui rebattent la demande.",
  "Bloc 3 · Assurer la gestion opérationnelle":
    "Le cœur du jeu : compte de résultat, stocks au CUMP, délais clients et fournisseurs, crise de trésorerie du tour 4, TVA à décaisser dans le BFR.",
  "Bloc 4 · Manager l'équipe commerciale":
    "Niveau Arbitrage : embaucher (effet au tour suivant), former (productivité), fixer l'indice de salaire. Sous-payer démotive et fait démissionner.",
  "Bloc 1 · Développer la relation client et assurer la vente conseil":
    "La fidélité par segment (part de marché passée) et la qualité perçue récompensent la constance : la relation client comme actif, pas comme slogan.",
  "Bloc 1 · Relation client et négociation-vente":
    "Le coût variable unitaire et le seuil de rentabilité donnent le prix plancher ; les délais clients (30-80 j) montrent ce qu'une condition de paiement coûte réellement en trésorerie.",
  "Bloc 3 · Relation client et animation de réseaux":
    "Observer SoundBox et Auris, réagir aux cartes marché, défendre sa part segment par segment, et le mode championnat pour animer la section.",
  "Bloc 2 · Relation client à distance et digitalisation":
    "Les tableaux de bord et KPI de l'arène servent de terrain de lecture de données : le jeu n'est pas un CRM simulé.",
  "P1 · Contrôle et traitement comptable des opérations commerciales":
    "Créances et dettes TTC calculées chaque tour à partir des délais réels (clients 30-80 j, fournisseurs 22 j) : le poste s'explique au lieu de s'apprendre.",
  "P3 · Gestion des obligations fiscales":
    "La mécanique TVA du moteur : résultat rigoureusement HT, flux TTC, dette « TVA à décaisser » payée le tour suivant, et son poids dans le BFR. L'IS se module à la création.",
  "P5 · Analyse et prévision de l'activité":
    "Le seuil recalculé chaque tour avec VOS charges de structure ; les situations « choisir le bon modèle » (CVP, coûts pertinents, analyse marginale) notées sur la pertinence du choix ; enfin l'atelier VAN/TRI qui se déclenche quand l'atelier sature : investir, sous-traiter ou renoncer, par le calcul.",
  "P6 · Analyse de la situation financière":
    "L'invariant affiché partout : TN = FRNG − BFR. La crise du tour 4 le rend inoubliable, le débriefing le formalise, l'IPG le note sur la durée.",
};

/**
 * LES ADÉQUATIONS CORRIGÉES À LA MAIN.
 *
 * Le défaut se compte ; ces entrées-là se justifient. P1 et P5 du BTS CG ne
 * paraissent que dans deux et trois séances sur six, ce qui les rangerait
 * parmi les blocs simplement couverts ; elles sont pourtant ce que l'atelier
 * fait faire du premier au dernier tour, parce que le moteur les recalcule à
 * chaque décision et pas seulement le jour où la séance les nomme.
 */
const ADEQUATION_DECLAREE: Record<string, Adequation> = {
  "P1 · Contrôle et traitement comptable des opérations commerciales": "coeur",
  "P5 · Analyse et prévision de l'activité": "coeur",
  "P6 · Analyse de la situation financière": "coeur",
  "P3 · Gestion des obligations fiscales": "coeur",
  "Bloc 1 · Relation client et négociation-vente": "coeur",
};

/**
 * L'ADÉQUATION PAR DÉFAUT : la part des séances qui mettent le bloc en jeu.
 *
 * Deux seuils, et ils sont justiciables. Un bloc présent dans la moitié des
 * séances ou plus tient l'atelier de bout en bout : c'est un cœur. Un bloc qui
 * ne paraît qu'une fois est abordé, pas travaillé : c'est un partiel, et le
 * dire vaut mieux que de le laisser croire. Entre les deux, couvert.
 */
function adequationComptee(seances: number, enTout: number): Adequation {
  if (seances * 2 >= enTout) return "coeur";
  if (seances > 1) return "couvert";
  return "partiel";
}

/**
 * La couverture d'un atelier : un bloc par ligne, du plus présent au moins
 * présent, pour que le tableau s'ouvre sur ce que l'atelier fait le plus.
 */
export function couvertureDeLAtelier(code: string): BlocCouvert[] {
  const atelier = ATELIERS.find((a) => a.code === code);
  if (!atelier) return [];
  const parBloc = new Map<string, { numero: number; titre: string }[]>();
  for (const seance of atelier.seances) {
    for (const bloc of seance.processus) {
      const liste = parBloc.get(bloc) ?? [];
      liste.push({ numero: seance.numero, titre: seance.titre });
      parBloc.set(bloc, liste);
    }
  }
  const enTout = atelier.seances.length;
  return [...parBloc.entries()]
    .map(([referentiel, seances]) => ({
      referentiel,
      seances,
      seancesEnTout: enTout,
      adequation:
        ADEQUATION_DECLAREE[referentiel] ??
        adequationComptee(seances.length, enTout),
      declaree: referentiel in ADEQUATION_DECLAREE,
      commentaire: COMMENTAIRES[referentiel],
    }))
    .sort((a, b) => b.seances.length - a.seances.length);
}

/** Les clés écrites à la main, pour que la garde vérifie qu'elles désignent un bloc réel. */
export const CLES_ECRITES = {
  commentaires: Object.keys(COMMENTAIRES),
  adequations: Object.keys(ADEQUATION_DECLAREE),
};

/** Tous les blocs de référentiel nommés par une séance, quel que soit l'atelier. */
export function tousLesBlocs(): string[] {
  const vus = new Set<string>();
  for (const a of ATELIERS)
    for (const s of a.seances) for (const p of s.processus) vus.add(p);
  return [...vus];
}

/**
 * CE QUE LE JEU COUVRE EN PLUS DES SÉANCES.
 *
 * Le tableau dérivé ne connaît que les blocs qu'une séance nomme. Le moteur,
 * lui, en travaille d'autres sans qu'un atelier leur consacre une séance : le
 * bloc social du BTS CG se joue à chaque décision de recrutement, dans aucune
 * séance en particulier. L'écrire sous le tableau plutôt que dedans garde la
 * distinction que le lecteur doit faire : une ligne du tableau est une séance
 * qu'il animera, cette note est une possibilité du moteur.
 */
export const AU_DELA_DES_SEANCES: Record<
  string,
  { referentiel: string; quoi: string }[]
> = {
  cg1: [
    {
      referentiel: "P4 · Gestion des relations sociales",
      quoi: "Le bloc RH (niveau Arbitrage) : masse salariale, coût d'un recrutement, d'un licenciement, d'une politique salariale, côté gestion et non côté paie réglementaire. Aucune séance de l'atelier ne lui est consacrée.",
    },
  ],
};

/** Un bloc de référentiel, vu depuis le diplôme et non depuis un déroulé. */
export interface BlocDuDiplome {
  referentiel: string;
  /** Où il se travaille, déroulé par déroulé : « 4 séances sur 5 » n'a de sens que par déroulé. */
  presences: {
    code: string;
    titre: string;
    seances: number[];
    seancesEnTout: number;
  }[];
  adequation: Adequation;
  declaree: boolean;
  commentaire?: string;
}

/**
 * LA COUVERTURE D'UN DIPLÔME, ET NON D'UN DÉROULÉ.
 *
 * La page des parcours affichait une couverture par déroulé. Pour le BTS MCO,
 * qui en a deux, elle montrait donc DEUX FOIS le même référentiel : « Bloc 3 ·
 * Assurer la gestion opérationnelle » apparaissait dans les deux tableaux, et
 * le lecteur devait recoudre lui-même ce que son diplôme exige. La page parlait
 * de ce que nous proposons, pas de ce qu'il doit couvrir.
 *
 * Le référentiel est pourtant une liste par DIPLÔME, pas par déroulé : il se
 * présente une fois, et chaque bloc dit ensuite où il se travaille. Un déroulé
 * qui n'est pas le sien n'oblige pas un enseignant à relire sa liste.
 *
 * LES SÉANCES NE S'ADDITIONNENT PAS d'un déroulé à l'autre. Deux déroulés pour
 * un même diplôme sont des chemins ALTERNATIFS, pas un parcours de onze
 * séances : les sommer annoncerait un volume que personne ne jouera. Chaque
 * présence garde donc son propre dénominateur.
 *
 * L'ADÉQUATION SE PREND AU MIEUX. Un bloc au cœur d'un déroulé et effleuré par
 * l'autre est au cœur du diplôme pour qui choisit le premier ; l'annoncer
 * comme partiel découragerait à tort.
 */
export function couvertureDuDiplome(codes: readonly string[]): BlocDuDiplome[] {
  const rang: Adequation[] = ["partiel", "couvert", "coeur"];
  const parBloc = new Map<string, BlocDuDiplome>();
  for (const code of codes) {
    const atelier = ATELIERS.find((a) => a.code === code);
    if (!atelier) continue;
    for (const bloc of couvertureDeLAtelier(code)) {
      const vu = parBloc.get(bloc.referentiel);
      const presence = {
        code,
        titre: atelier.titre,
        seances: bloc.seances.map((s) => s.numero),
        seancesEnTout: bloc.seancesEnTout,
      };
      if (!vu) {
        parBloc.set(bloc.referentiel, {
          referentiel: bloc.referentiel,
          presences: [presence],
          adequation: bloc.adequation,
          declaree: bloc.declaree,
          commentaire: bloc.commentaire,
        });
        continue;
      }
      vu.presences.push(presence);
      if (rang.indexOf(bloc.adequation) > rang.indexOf(vu.adequation)) {
        vu.adequation = bloc.adequation;
      }
      vu.declaree = vu.declaree || bloc.declaree;
    }
  }
  // Du bloc le plus travaillé au moins travaillé, part la plus forte en tête.
  const part = (b: BlocDuDiplome) =>
    Math.max(...b.presences.map((p) => p.seances.length / p.seancesEnTout));
  return [...parBloc.values()].sort((a, b) => part(b) - part(a));
}
