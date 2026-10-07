/**
 * LES APPRENTIS QUI DÉCROCHENT — le modèle de la salle de La Table d'Augustin d'Aix-les-Bains.
 *
 * Un restaurant de bistronomie, dix services par semaine, une salle de huit :
 * deux chefs de rang confirmés, un barman et cinq apprentis en alternance (trois
 * en CAP, deux en BTS), menés par la directrice de salle. L'an dernier, deux
 * contrats d'apprentissage ont été rompus. C'est la rentrée : deux nouveaux
 * arrivent. Treize semaines, de septembre à novembre, six décisions. Quatre
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE TUTORAT FAIT L'APPRENTI. Trois heures par semaine d'un chef de rang,
 *     pendant la mise en place, et un parcours par étapes (commis, rang à deux,
 *     rang seul) : l'apprenti gagne en autonomie trois fois plus vite, et en
 *     confiance au lieu d'en perdre. Sans tuteur qui en a le temps, il apprend
 *     seul, lentement, et il s'use.
 *   · SEUL AU RANG TROP TÔT, IL SE PERD. Un apprenti qui n'a pas encore le
 *     métier, mis seul au rang dans le coup de feu, fait des erreurs de service
 *     (commandes oubliées, attentes, additions fausses) que la maison rattrape
 *     en gestes et que les clients notent ; et il perd confiance. Les mêmes
 *     services calmes, une fois qu'il est prêt, le font progresser.
 *   · LE RYTHME DE L'ÉCOLE S'IMPOSE AU PLANNING. Les semaines de cours au CFA
 *     sont du temps de travail : les apprentis n'y sont pas au restaurant, et
 *     certaines semaines ils y sont tous. Un planning qui les ignore laisse la
 *     salle en sous-effectif ; un planning qui les retient au restaurant
 *     déclenche un conflit avec le CFA, et les apprentis paient la note.
 *   · LES RUPTURES TOMBENT AU HASARD. Chaque semaine, chaque apprenti peut
 *     rompre son contrat ; la probabilité dépend de sa confiance, du tutorat,
 *     d'un éventuel conflit avec le CFA, et elle est plus forte pour un nouveau.
 *     Une rupture coûte six semaines d'extra le temps de retrouver un apprenti,
 *     et les frais de recrutement et d'intégration du suivant : bien plus que
 *     le temps qu'on croyait gagner en le faisant servir tout de suite.
 *
 * Autour de ces mécanismes, des personnes dont la réponse est tirée au hasard,
 * avec des chances qui dépendent des choix : Bintou, apprentie de BTS, peut
 * tenir le rang d'une cheffe de rang arrêtée deux semaines (bien plus souvent
 * si un tuteur l'y a préparée ; ratée, elle peut rompre) ; le CFA accepte une
 * fois sur quatre de décaler une session ; Sanaa décroche pour une raison
 * concrète qu'un entretien permet de traiter ; les repas de groupe de fin
 * d'année se passent bien ou mal selon qui les sert.
 *
 * Le trimestre est jugé en euros : la contribution de la salle, c'est-à-dire la
 * marge sur coût matière des couverts servis et des ventes additionnelles, moins
 * la main-d'œuvre de la salle (confirmés, apprentis, extras, heures de tutorat),
 * plus les aides à l'apprentissage, moins les gestes commerciaux et le coût des
 * ruptures. Une rupture est comptée à son coût complet la semaine où elle tombe,
 * remplacement compris, même quand celui-ci court au-delà du trimestre.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : la directrice n'est pas au passe le samedi soir. */
export const PERTE_PAR_JOUR = 600;

/* ---------------------------------------------------------------------------
 * LE RESTAURANT : la demande, ce qu'un couvert rapporte, ce que la salle tient.
 * ------------------------------------------------------------------------- */

/** Les couverts que la salle pourrait servir dans une semaine de septembre. */
export const COUVERTS = 600;
/**
 * La saison, semaine par semaine : l'arrière-saison de septembre (terrasse et
 * curistes), octobre, les vacances de la Toussaint en semaine 8, puis le creux
 * de novembre. L'indice 0 est vide.
 */
export const SAISON = [
  0, 1, 1, 0.97, 0.95, 0.9, 0.88, 0.86, 0.9, 0.86, 0.78, 0.74, 0.72, 0.74,
] as const;
/** Le ticket moyen hors boissons et ventes additionnelles, en € HT. */
export const TICKET = 30;
export const RATIO_MATIERE = 0.3;
export const MARGE_COUVERT = TICKET * (1 - RATIO_MATIERE);
/** Apéritif, vin conseillé, dessert, café : ce qu'un serveur confirmé vend en plus par couvert. */
export const VENTES_ADD = 8;
export const MARGE_VENTES_ADD = 0.75;
/** Les couverts qu'un serveur confirmé tient dans une semaine. */
export const COUVERTS_PAR_SERVEUR = 130;
/** Garance au passe (0,6), Lisandro et Clervie au rang (1 chacun), Melchior au bar (0,5). */
export const CAPACITE_CONFIRMES = 3.1;
/** La paie des quatre confirmés de la salle, charges comprises, par semaine. */
export const COUT_CONFIRMES = 3450;

/* ---------------------------------------------------------------------------
 * LES APPRENTIS, LES EXTRAS, LE TUTORAT, LES RUPTURES.
 * ------------------------------------------------------------------------- */

export interface Apprenti {
  id: string;
  prenom: string;
  nom: string;
  diplome: "CAP" | "BTS";
  annee: 1 | 2;
  age: number;
  /** Ce qu'il coûte à la salle par semaine, charges et repas compris. */
  cout: number;
  /** De 0 à 1 : la part du métier de rang qu'il tient seul. */
  autonomie: number;
  /** De 0 à 1. */
  confiance: number;
}

export const APPRENTIS: readonly Apprenti[] = [
  {
    id: "bintou",
    prenom: "Bintou",
    nom: "Kanouté",
    diplome: "BTS",
    annee: 2,
    age: 21,
    cout: 290,
    autonomie: 0.55,
    confiance: 0.6,
  },
  {
    id: "kelian",
    prenom: "Kélian",
    nom: "Mabille",
    diplome: "CAP",
    annee: 2,
    age: 17,
    cout: 190,
    autonomie: 0.4,
    confiance: 0.55,
  },
  {
    id: "sanaa",
    prenom: "Sanaa",
    nom: "Oudghiri",
    diplome: "CAP",
    annee: 2,
    age: 18,
    cout: 230,
    autonomie: 0.35,
    confiance: 0.45,
  },
  {
    id: "nolhan",
    prenom: "Nolhan",
    nom: "Dumollard",
    diplome: "CAP",
    annee: 1,
    age: 16,
    cout: 140,
    autonomie: 0.05,
    confiance: 0.6,
  },
  {
    id: "iliana",
    prenom: "Iliana",
    nom: "Vuarchex",
    diplome: "BTS",
    annee: 1,
    age: 19,
    cout: 200,
    autonomie: 0.1,
    confiance: 0.6,
  },
];
/** Leur place dans l'équipe. */
export const A = { bintou: 0, kelian: 1, sanaa: 2, nolhan: 3, iliana: 4 } as const;

/** Ce qu'un apprenti coûte en moyenne à la salle par semaine : 210 €. */
export const COUT_APPRENTI_MOYEN = APPRENTIS.reduce((s, a) => s + a.cout, 0) / APPRENTIS.length;
/** Un apprenti recruté en cours d'année : CAP première année. */
export const RECRUE = { cout: 170, autonomie: 0.05, confiance: 0.55 } as const;

/** Un extra : 120 € le service ; pour tenir un rang, six services par semaine. */
export const COUT_EXTRA_SERVICE = 120;
export const SERVICES_PAR_SEMAINE = 6;
export const COUT_EXTRA = COUT_EXTRA_SERVICE * SERVICES_PAR_SEMAINE;
/** Fin septembre, les extras confirmés sont pris par les mariages : au dernier moment, 140 € le service. */
export const COUT_EXTRA_DERNIERE_MINUTE = 140 * SERVICES_PAR_SEMAINE;
/** Un extra connaît le métier, pas la maison. */
export const CAPACITE_EXTRA = 0.85;

/** Le temps qu'il faut pour trouver et faire signer un nouvel apprenti ; un extra tient le rang d'ici là. */
export const SEMAINES_DE_REMPLACEMENT = 6;
/** Recrutement, démarches auprès du CFA et de l'opérateur de compétences, doublure du remplaçant. */
export const FRAIS_RUPTURE = 1400;
/** L'arrivée d'une recrue en cours d'année : tenue, visite médicale, accueil, démarches. */
export const FRAIS_D_ARRIVEE = 300;
/** Une rupture d'un commun accord remplacée par deux recrues : le recrutement de la seconde. */
export const FRAIS_SECONDE_RECRUE = 700;
/**
 * LE COÛT D'UNE RUPTURE pour le restaurant : six semaines d'extra à la place d'un
 * apprenti, et les frais du remplacement. 6 × (720 − 210) + 1 400 = 4 460 €.
 */
export const COUT_RUPTURE =
  SEMAINES_DE_REMPLACEMENT * (COUT_EXTRA - COUT_APPRENTI_MOYEN) + FRAIS_RUPTURE;

/** L'aide à l'embauche d'un apprenti, première année de contrat, pour un groupe de plus de 250 salariés. */
export const AIDE_ANNUELLE = 2000;
export const AIDE_SEMAINE = AIDE_ANNUELLE / 52;

/** Trois heures de tutorat par semaine et par tuteur, payées en heures supplémentaires. */
export const HEURES_TUTORAT = 3;
export const COUT_TUTEUR = 80;
/** Sans heures dédiées, Lisandro, tuteur en titre des cinq, forme « quand il a le temps ». */
export const TUTORAT_DE_FOND = 0.12;

/** En dessous de cette autonomie, un apprenti seul au rang dans le coup de feu se perd. */
export const SEUIL_RANG = 0.45;
/** Au-delà de cette autonomie, un apprenti tient un rang seul, même un samedi. */
export const SEUIL_AUTONOME = 0.6;
/** Le geste moyen qui rattrape une erreur de service : dessert, verre ou café offert, remise. */
export const GESTE = 30;
/** Le risque hebdomadaire de rupture d'un apprenti de confiance moyenne, sans tutorat. */
export const RISQUE_DE_BASE = 0.014;
/** Les ruptures tombent à partir de la semaine 5 ; celle de Sanaa, à partir de la 7. */
export const DEBUT_RUPTURES = 5;

/* ---------------------------------------------------------------------------
 * LE CALENDRIER DU CFA : les semaines de cours sont du temps de travail.
 * ------------------------------------------------------------------------- */
export const ECOLE_BTS = [2, 3, 7, 8, 11, 12] as const;
export const ECOLE_CAP = [4, 8, 11] as const;
/** Si le CFA accepte de décaler les sessions de CAP des semaines 8 et 11. */
export const ECOLE_CAP_DECALEE = [4, 9, 13] as const;
/** Une fois sur quatre, le CFA accepte de décaler une session pour un employeur. */
export const CHANCE_CFA = 0.25;

/** Clervie, cheffe de rang, est opérée du genou : arrêt des semaines 5 et 6. */
export const ARRET_CLERVIE = [5, 6] as const;
/** La prime de Bintou pour deux semaines comme cheffe de rang. */
export const PRIME_BINTOU = 150;

/** Les repas de fin d'année d'entreprises vendus par Escale Événements : semaines 12 et 13. */
export const GROUPES = { parSemaine: 3, couverts: 50, menu: 52, semaines: [12, 13] } as const;
/** Une soirée de groupe ratée : la remise consentie au client sur sa facture. */
export const REMISE_GROUPE = 0.2;
export const COUT_EXTRA_GROUPE = 150;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  rentree: 0,
  calendrier: 1,
  arret: 2,
  sanaa: 3,
  recrues: 4,
  groupes: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 2, 2, 3] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  duree: number;
  effet: { demande?: number; capacite?: number; confirmes?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "caisse",
    titre: "Panne de la caisse et des terminaux de paiement",
    de: "Melchior Guichard",
    role: "Barman",
    texte:
      "La caisse et les deux terminaux sont tombés mercredi, jusqu'à vendredi midi : additions à la main, paiements au comptoir, des tables qui attendent pour régler.",
    duree: 1,
    effet: { capacite: 0.9 },
  },
  {
    id: "seminaire",
    titre: "Un séminaire déjeune à la Table",
    de: "Ludger Rennard",
    role: "Escale Événements",
    texte:
      "Le séminaire qu'Escale Événements accueille cette semaine à Aix déjeunera chez vous du mardi au jeudi : quarante couverts de plus chaque midi.",
    duree: 1,
    effet: { demande: 1.12 },
  },
  {
    id: "gastro",
    titre: "Gastro-entérite en salle",
    de: "Lisandro Esquerré",
    role: "Chef de rang",
    texte:
      "Melchior et moi avons attrapé la gastro qui traîne : on est arrêtés trois jours chacun. Garance, il va falloir tenir sans nous.",
    duree: 1,
    effet: { confirmes: 0.8 },
  },
  {
    id: "pluie",
    titre: "Fin anticipée de la terrasse",
    de: "Harmonie Desgranges",
    role: "Cheffe de cuisine",
    texte:
      "Deux semaines de pluie annoncées : on rentre la terrasse, et les réservations du soir ont déjà baissé.",
    duree: 2,
    effet: { demande: 0.9 },
  },
  {
    id: "presse",
    titre: "Un article dans la presse locale",
    de: "Théo Garrigues",
    role: "Directeur des restaurants du groupe",
    texte:
      "Le quotidien local consacre une page à la Table d'Aix : le téléphone sonne, attends-toi à du monde pendant quinze jours.",
    duree: 2,
    effet: { demande: 1.08 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

/** Les places de l'équipe : les cinq apprentis, puis les recrues possibles en cours de trimestre. */
const PLACES = 9;

export interface Hasard {
  /** Le bruit de la demande, semaine par semaine ; l'indice 0 est vide. */
  demande: readonly number[];
  /** Par place, par semaine : le tirage qui décide d'une rupture. */
  rupture: readonly (readonly number[])[];
  /** Par place, par semaine : les hauts et les bas d'un apprenti. */
  humeur: readonly (readonly number[])[];
  /** Bintou tient-elle le rang de Clervie ? */
  uBintou: number;
  /** Après un samedi raté, Bintou s'en va-t-elle ? */
  uBintouPart: number;
  /** Le CFA accepte-t-il de décaler les sessions de CAP ? */
  uCFA: number;
  /** Chaque soirée de groupe de fin d'année se passe-t-elle bien ? */
  uGroupes: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000577 + 7);
  // D'abord ce que des personnes décideront : les clients des groupes, le CFA, Bintou.
  const uGroupes = [r(), r(), r(), r(), r(), r()];
  const uCFA = r();
  const uBintou = r();
  const uBintouPart = r();
  const demande = [0];
  for (let w = 1; w <= SEMAINES; w += 1) demande.push(borne(1 + 0.05 * gauss(r), 0.88, 1.12));
  const rupture: number[][] = [];
  const humeur: number[][] = [];
  for (let p = 0; p < PLACES; p += 1) {
    const u = [0];
    const z = [0];
    for (let w = 1; w <= SEMAINES; w += 1) {
      u.push(r());
      z.push(gauss(r));
    }
    rupture.push(u);
    humeur.push(z);
  }
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { demande, rupture, humeur, uBintou, uBintouPart, uCFA, uGroupes, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Une fois sur quatre, le CFA accepte de décaler ; seul le fait de le demander compte. */
export const cfaDecale = (chemin: readonly number[], graine: number) =>
  chemin[D.calendrier] === 1 && hasard(graine).uCFA < CHANCE_CFA;

/**
 * BINTOU TIENT-ELLE LE RANG DE CLERVIE ?
 *
 * Elle n'a jamais tenu un rang seule un samedi. Préparée par un tuteur qui l'a
 * fait passer par le rang à deux, elle le tient plus de huit fois sur dix ; jetée
 * dans le bain sans préparation, une fois sur trois.
 */
export const chanceQueBintouTienne = (chemin: readonly number[]) =>
  chemin[D.rentree] === 0 ? 0.85 : 0.35;
export const bintouTient = (chemin: readonly number[], graine: number) =>
  chemin[D.arret] === 1 && hasard(graine).uBintou < chanceQueBintouTienne(chemin);

/** Le risque hebdomadaire de rupture d'un apprenti, selon sa confiance et ce qui l'entoure. */
/** Après un premier samedi raté comme cheffe de rang, Bintou s'en va six fois sur dix. */
export const CHANCE_DEPART_BINTOU = 0.6;
export const bintouPart = (chemin: readonly number[], graine: number) =>
  chemin[D.arret] === 1 &&
  !bintouTient(chemin, graine) &&
  hasard(graine).uBintouPart < CHANCE_DEPART_BINTOU;

export function risqueDeRupture(
  confiance: number,
  tutorat: number,
  nouveau: boolean,
  conflit: boolean,
): number {
  return (
    RISQUE_DE_BASE *
    Math.exp(3 * (0.5 - confiance)) *
    (1 - 0.5 * tutorat) *
    (nouveau ? 1.5 : 1) *
    (conflit ? 1.6 : 1)
  );
}

/** Une soirée de groupe ratée, selon l'autonomie moyenne des apprentis présents et l'organisation. */
export function risqueDeGroupeRate(choix: number, autonomie: number): number {
  if (choix === 0) return 0.05;
  if (choix === 2) return 0.08;
  if (choix === 1) return borne(0.4 + 1.5 * Math.max(0, 0.75 - autonomie), 0.4, 0.9);
  return borne(0.3 + 0.8 * Math.max(0, 0.7 - autonomie), 0.3, 0.7);
}

/** Les semaines de cours d'un apprenti, selon son diplôme et le calendrier retenu. */
const ecole = (diplome: "CAP" | "BTS", decale: boolean): readonly number[] =>
  diplome === "BTS" ? ECOLE_BTS : decale ? ECOLE_CAP_DECALEE : ECOLE_CAP;

/** Les apprentis au CFA une semaine donnée, sur les cinq de la rentrée. */
export const enCours = (w: number, decale = false) =>
  APPRENTIS.filter((a) => ecole(a.diplome, decale).includes(w)).length;

/**
 * Les extras que le planning réserve, à partir de la semaine 3, pour les semaines où trois
 * apprentis ou plus sont en cours : un en semaine 4, deux pendant la Toussaint, un en novembre.
 */
export const EXTRAS_DU_PLANNING: Readonly<Record<number, number>> = { 4: 1, 8: 2, 11: 1 };
export const extrasDuPlanning = (w: number) => EXTRAS_DU_PLANNING[w] ?? 0;
/** Les cours manqués se rattrapent : le CFA convoque les cinq la semaine 9, en pleine Toussaint. */
export const SEMAINE_DE_RATTRAPAGE = 9;

export interface Rupture {
  place: number;
  /** L'apprenti de la rentrée, ou « recrue » pour un apprenti arrivé en cours de trimestre. */
  id: string;
  nom: string;
  semaine: number;
  /** Rompu d'un commun accord à l'initiative de la directrice, plutôt que tombé au hasard. */
  accord: boolean;
}

export type Semaine = {
  /** La contribution de la salle cette semaine, en euros. */
  contribution: number;
  /** La contribution cumulée depuis le début du trimestre. */
  cumul: number;
  couverts: number;
  /** Les couverts refusés ou perdus faute de bras. */
  perdus: number;
  /** Les ventes additionnelles par couvert, en euros HT. */
  ventes: number;
  /** Les erreurs de service rattrapées par un geste. */
  incidents: number;
  /** Les apprentis sous contrat en fin de semaine. */
  apprentis: number;
  /** L'autonomie moyenne des apprentis sous contrat. */
  autonomie: number;
  /** La confiance moyenne des apprentis sous contrat. */
  confiance: number;
  /** Les apprentis sous contrat qui tiennent un rang seuls. */
  autonomes: number;
  /** La part de la demande que la salle ne peut pas tenir. */
  manque: number;
  extras: number;
  /** Le coût des ruptures tombées cette semaine. */
  ruptures: number;
  reputation: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La contribution de la salle sur le trimestre, ruptures et remplacements compris. */
  objectif: number;
  ruptures: readonly Rupture[];
  coutRuptures: number;
  couvertsTotal: number;
  perdusTotal: number;
  incidentsTotal: number;
  ventesMoyennes: number;
  extrasTotal: number;
  aides: number;
  tutorat: number;
  cfaDecale: boolean;
  /** Le CFA a signalé que des apprentis manquaient leurs cours. */
  cfaAlerte: boolean;
  bintouTient: boolean | null;
  groupesRates: number;
  apprentisFinal: number;
  autonomieFinale: number;
  /** Les apprentis de la rentrée encore là, et autonomes au rang, en semaine 13. */
  autonomes: number;
}

interface Place {
  /** L'apprenti de la rentrée qui tient la place, ou « recrue ». */
  id: string;
  nom: string;
  diplome: "CAP" | "BTS";
  cout: number;
  /** Une première année de contrat : l'aide est versée, et la rupture est libre les 45 premiers jours. */
  nouveau: boolean;
  a: number;
  c: number;
  /** "apprenti" sous contrat ; "extra" pendant le remplacement ; "vide" avant l'arrivée ou après le départ. */
  etat: "apprenti" | "extra" | "vide";
  /** La semaine où l'extra laisse la place au remplaçant. */
  finExtra: number;
  /** Mis en renfort au rang seul, quel que soit son niveau, dans le coup de feu. */
  renfort: boolean;
  /** Avant cette semaine, la place ne peut pas rompre. */
  protegeJusqua: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const decale = cfaDecale(chemin, graine);
  const tient = d3 === 1 ? bintouTient(chemin, graine) : null;
  const tutores = d1 === 0;

  const places: Place[] = APPRENTIS.map((a, i) => ({
    id: a.id,
    nom: `${a.prenom} ${a.nom}`,
    diplome: a.diplome,
    cout: a.cout,
    nouveau: a.annee === 1,
    a: a.autonomie,
    c: a.confiance,
    etat: "apprenti",
    finExtra: 0,
    renfort: false,
    protegeJusqua: i === A.sanaa || i === A.bintou ? 7 : DEBUT_RUPTURES,
  }));
  const recrue = (nom: string, renfort: boolean): Place => ({
    id: "recrue",
    nom,
    diplome: "CAP",
    cout: RECRUE.cout,
    nouveau: true,
    a: RECRUE.autonomie,
    c: RECRUE.confiance,
    etat: "vide",
    finExtra: 0,
    renfort,
    protegeJusqua: 0,
  });
  // Les recrues possibles : deux à la place de Sanaa (D4), deux ou une en semaine 9 (D5).
  places.push(
    recrue("la première recrue d'octobre", true),
    recrue("la seconde recrue d'octobre", true),
  );
  places.push(
    recrue("la recrue de novembre", d5 === 0),
    recrue("la seconde recrue de novembre", true),
  );

  const semaines: (Semaine | null)[] = [null];
  const ruptures: Rupture[] = [];
  let cumul = 0;
  let reputation = 1;
  let couvertsTotal = 0;
  let perdusTotal = 0;
  let incidentsTotal = 0;
  let ventesPonderees = 0;
  let extrasTotal = 0;
  let aides = 0;
  let tutoratTotal = 0;
  let coutRuptures = 0;
  let groupesRates = 0;
  let cfaAlerte = false;
  const perteEnquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  const rompre = (p: number, w: number, accord: boolean) => {
    const pl = places[p]!;
    ruptures.push({ place: p, id: pl.id, nom: pl.nom, semaine: w, accord });
    if (accord) {
      pl.etat = "vide";
    } else {
      pl.etat = "extra";
      pl.finExtra = w + SEMAINES_DE_REMPLACEMENT;
    }
    // Un départ pèse sur ceux qui restent.
    for (const autre of places) if (autre.etat === "apprenti") autre.c -= 0.03;
  };

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let fraisRuptures = 0;
    let fraisArrivees = 0;

    // Les arrivées et les départs décidés.
    // Humiliée par un samedi raté, Bintou rompt son contrat six fois sur dix.
    if (bintouPart(chemin, graine) && w === ARRET_CLERVIE[1]) {
      rompre(A.bintou, w, false);
      fraisRuptures += COUT_RUPTURE;
    }
    if (d4 === 3 && w === 7 && places[A.sanaa]!.id === "sanaa") {
      rompre(A.sanaa, 7, true);
      fraisRuptures += FRAIS_RUPTURE + FRAIS_SECONDE_RECRUE;
    }
    if (d4 === 3 && w === 8) {
      places[5]!.etat = "apprenti";
      places[6]!.etat = "apprenti";
    }
    if (w === 10 && (d5 === 0 || d5 === 1)) {
      places[7]!.etat = "apprenti";
      if (d5 === 0) places[8]!.etat = "apprenti";
      fraisArrivees += (d5 === 0 ? 2 : 1) * FRAIS_D_ARRIVEE;
    }
    // Après six semaines d'extra, un remplaçant signe : un CAP de première année.
    for (const pl of places) {
      if (pl.etat === "extra" && w >= pl.finExtra) {
        Object.assign(pl, recrue(`le remplaçant de ${pl.nom}`, false), { etat: "apprenti" });
      }
    }

    // Qui est au CFA, qui est au restaurant.
    const retenus = d2 === 2 && w >= 3 && w <= 6;
    const conflit = d2 === 2 && w >= 3;
    if (d2 === 2 && w === 7) cfaAlerte = true;
    const aLEcole = (pl: Place) =>
      (!retenus && ecole(pl.diplome, decale).includes(w)) ||
      (d2 === 2 && w === SEMAINE_DE_RATTRAPAGE && pl.id !== "recrue");
    const presents = places.map((pl) => pl.etat === "apprenti" && !aLEcole(pl));

    // La demande de la semaine.
    let demande = COUVERTS * SAISON[w]! * h.demande[w]! * reputation;
    for (const x of actifs) demande *= x.imprevu.effet.demande ?? 1;
    let besoin = demande / COUVERTS_PAR_SERVEUR;
    let fermeture = 0;
    if (d3 === 3 && (ARRET_CLERVIE as readonly number[]).includes(w)) {
      // Six tables fermées : la salle a moins à tenir, mais refuse du monde aux heures pleines.
      besoin -= 1;
      fermeture = 0.08;
    }

    // Ce que la salle tient : les confirmés, les extras, les apprentis.
    let capacite = CAPACITE_CONFIRMES;
    const clervieArretee = (ARRET_CLERVIE as readonly number[]).includes(w);
    if (clervieArretee) capacite -= 1;
    for (const x of actifs) capacite -= x.imprevu.effet.confirmes ?? 0;
    let extras = 0;
    if (d2 === 0 && w >= 3) extras += extrasDuPlanning(w);
    if (d3 === 0 && clervieArretee) extras += 1;
    // Après un premier samedi raté, Garance appelle un extra pour la seconde semaine.
    if (d3 === 1 && !tient && w === ARRET_CLERVIE[1]) extras += 1;
    const remplacants = places.filter((pl) => pl.etat === "extra").length;
    capacite += (extras + remplacants) * CAPACITE_EXTRA;
    let savoir = CAPACITE_CONFIRMES * 1 + (extras + remplacants) * CAPACITE_EXTRA * 0.7;
    if (clervieArretee) savoir -= 1;

    const bintouCheffe =
      d3 === 1 && clervieArretee && presents[A.bintou]! && (tient || w === ARRET_CLERVIE[0]);
    // Un apprenti en commis, aux côtés d'un tuteur, tient moins qu'au rang.
    const enCommis = (p: number) =>
      (d1 === 0 && places[p]!.a < SEUIL_RANG && !places[p]!.renfort) ||
      (d1 === 2 && w <= 4 && places[p]!.nouveau);
    const capaciteDe = (p: number) => {
      const pl = places[p]!;
      if (p === A.bintou && bintouCheffe) return tient ? 1.05 : 0.7;
      if (p === A.nolhan && bintouCheffe && tient) return 0.35;
      const k = enCommis(p) ? 0.08 + 0.5 * pl.a : 0.12 + 0.75 * pl.a;
      // Deux jours de formation d'accueil au siège, la première semaine.
      return d1 === 2 && w === 1 && pl.nouveau ? 0.6 * k : k;
    };
    places.forEach((pl, p) => {
      if (!presents[p]) return;
      const k = capaciteDe(p);
      capacite += k;
      savoir += k * (p === A.bintou && bintouCheffe ? (tient ? 0.95 : 0.5) : pl.a);
    });
    for (const x of actifs) capacite *= x.imprevu.effet.capacite ?? 1;
    const manque = Math.max(0, 1 - capacite / Math.max(0.1, besoin));
    const enDeficit = manque > 0.04;

    // Qui se retrouve seul au rang dans le coup de feu, sans en avoir encore le métier.
    const coupDeFeu = SAISON[w]! >= 0.86;
    const seul = places.map((pl, p) => {
      if (!presents[p] || pl.a >= SEUIL_RANG) return false;
      if (p === A.bintou && bintouCheffe) return false;
      if (pl.renfort) return true;
      if (d1 === 1 && coupDeFeu) return true;
      if ((d1 === 2 || d1 === 3) && enDeficit) return true;
      // Comme l'an dernier : les nouveaux au rang dès les samedis de septembre.
      if (d1 === 3 && pl.nouveau && w <= 4) return true;
      if (d3 === 2 && clervieArretee && (p === A.nolhan || p === A.iliana)) return true;
      return false;
    });
    // En novembre, chacun tient seul un rang sur les services calmes, son tuteur en retrait.
    const progression = d6 === 0 && w >= 11;

    // Le tutorat : des heures dédiées, partagées entre ceux qui en ont besoin.
    let heures = tutores ? HEURES_TUTORAT * (clervieArretee ? 1 : 2) : 0;
    if (enDeficit) heures *= 0.5;
    const demandeTutorat = places.reduce(
      (s, pl, p) => s + (presents[p] && pl.a < 0.85 ? (pl.nouveau ? 1.5 : 1) : 0),
      0,
    );
    const partTutorat = tutores ? Math.min(1, heures / Math.max(1, demandeTutorat)) : 0;
    const tutorat = places.map((pl, p) => {
      let t = tutores ? partTutorat : TUTORAT_DE_FOND;
      if (d1 === 2 && pl.nouveau && w <= 4 && p >= A.nolhan && p <= A.iliana) t = 0.25;
      if (p === A.nolhan && bintouCheffe && tient) t += 0.5;
      if (pl.id === "sanaa" && d4 === 1 && w >= 7) t = Math.max(t, tutores ? 1 : 0.5);
      return Math.min(1, t);
    });
    const coutTutorat = tutores ? COUT_TUTEUR * (clervieArretee ? 1 : 2) : 0;

    // Les erreurs de service.
    let incidents = 2 + 25 * manque;
    places.forEach((pl, p) => {
      if (seul[p]) incidents += 7 * (1 - pl.a / SEUIL_RANG) * SAISON[w]!;
      if (progression && presents[p] && pl.a < 0.4) incidents += 2 * (1 - pl.a / 0.4);
    });
    if (bintouCheffe && !tient) incidents += 25;
    incidents += 0.5 * (extras + remplacants);
    // L'extra pris au dernier moment pour le rang de Clervie ne connaît ni la carte ni la terrasse.
    if (d3 === 0 && clervieArretee) incidents += 2;
    // Deux apprentis pour six tables : des plats qui attendent, des tables qu'on oublie.
    const rangAuxNouveaux = d3 === 2 && clervieArretee;
    if (rangAuxNouveaux) incidents += 8;
    for (const x of actifs) if (x.imprevu.effet.capacite) incidents += 3;

    // Les couverts servis et ce qu'ils rapportent.
    const servis = demande * (1 - 0.9 * manque) * (1 - fermeture);
    const perdus = demande - servis;
    const qualite = savoir / Math.max(0.1, capacite);
    const ventes = VENTES_ADD * borne(qualite, 0, 1);
    let contribution = servis * (MARGE_COUVERT + ventes * MARGE_VENTES_ADD);

    // Les repas de groupe de fin d'année.
    if ((GROUPES.semaines as readonly number[]).includes(w)) {
      const presentsA = places.filter((pl, p) => presents[p] && pl.etat === "apprenti");
      const aMoy = presentsA.length
        ? presentsA.reduce((s, pl) => s + pl.a, 0) / presentsA.length
        : 0.5;
      const nb = d6 === 2 ? 2 : GROUPES.parSemaine;
      const k0 = (w - GROUPES.semaines[0]) * GROUPES.parSemaine;
      for (let k = 0; k < nb; k += 1) {
        const facture = GROUPES.couverts * GROUPES.menu;
        contribution += facture * (1 - RATIO_MATIERE);
        if (d6 === 0) contribution -= COUT_EXTRA_GROUPE;
        // Sans rien prévoir, la salle à la carte et le groupe se partagent les mêmes bras.
        if (d6 === 3) incidents += 4;
        if (h.uGroupes[k0 + k]! < risqueDeGroupeRate(d6!, aMoy)) {
          groupesRates += 1;
          contribution -= facture * REMISE_GROUPE;
          incidents += 5;
          for (const pl of presentsA) pl.c -= 0.08;
        }
      }
    }

    // La main-d'œuvre, les aides, les gestes.
    // L'extra qui tient le rang de Clervie est pris au dernier moment : 140 € le service.
    const extraDeDerniereMinute =
      (d3 === 0 && clervieArretee) || (d3 === 1 && !tient && w === ARRET_CLERVIE[1]) ? 1 : 0;
    let salaires =
      COUT_CONFIRMES +
      (extras - extraDeDerniereMinute) * COUT_EXTRA +
      extraDeDerniereMinute * COUT_EXTRA_DERNIERE_MINUTE +
      coutTutorat;
    let aide = 0;
    places.forEach((pl) => {
      if (pl.etat === "apprenti") {
        salaires += pl.cout;
        if (pl.nouveau) aide += AIDE_SEMAINE;
      } else if (pl.etat === "extra") {
        // Le surcoût de l'extra est compté dans le coût de la rupture.
        salaires += COUT_APPRENTI_MOYEN;
      }
    });
    if (d1 === 2 && w === 1) salaires += 300;
    if (bintouCheffe && w === ARRET_CLERVIE[0]) salaires += PRIME_BINTOU;
    const gestes = incidents * GESTE;
    contribution += aide - salaires - gestes;
    if (w === 1) contribution -= perteEnquete;

    // Ce que la semaine fait aux apprentis : l'autonomie, la confiance, le risque de partir.
    places.forEach((pl, p) => {
      if (pl.etat !== "apprenti") return;
      const t = tutorat[p]!;
      if (presents[p]) {
        let da = 0.01 + 0.04 * t;
        if (seul[p]) da += 0.008;
        if (progression && pl.a >= 0.4) da += 0.03;
        if (p === A.bintou && bintouCheffe && tient) da += 0.08;
        pl.a += da;
        let dc = -0.012 + 0.03 * t;
        if (seul[p]) dc -= 0.015 + 0.05 * (1 - pl.a / SEUIL_RANG);
        if (progression) dc += pl.a >= 0.4 ? 0.05 : -0.02;
        if (enDeficit) dc -= 0.015;
        if (p === A.bintou && bintouCheffe) dc += tient ? 0.12 : -0.4;
        if (rangAuxNouveaux && (p === A.nolhan || p === A.iliana)) dc -= 0.05;
        pl.c += dc;
      } else {
        pl.a += 0.006;
      }
      if (conflit) pl.c -= w <= 6 ? 0.06 : 0.015;
      // Sanaa : le dernier car part avant la fin du service du soir, jusqu'à ce qu'on en parle.
      if (pl.id === "sanaa" && !(d4 === 1 && w >= 7)) pl.c -= 0.06;
      if (pl.id === "sanaa" && w === 7) pl.c += d4 === 1 ? 0.15 : d4 === 0 ? -0.12 : 0;
      pl.c += 0.025 * h.humeur[p]![w]!;
      pl.a = borne(pl.a, 0, 1);
      pl.c = borne(pl.c, 0.05, 0.95);
    });
    tutoratTotal += coutTutorat;

    // Les ruptures, tirées au hasard.
    places.forEach((pl, p) => {
      if (pl.etat !== "apprenti" || w < pl.protegeJusqua || w < DEBUT_RUPTURES) return;
      let risque = risqueDeRupture(pl.c, tutorat[p]!, pl.nouveau, conflit);
      if (pl.id === "sanaa") risque *= d4 === 1 ? 0.5 : d4 === 0 ? 2 : 1.6;
      if (h.rupture[p]![w]! < risque) {
        rompre(p, w, false);
        fraisRuptures += COUT_RUPTURE;
      }
    });
    contribution -= fraisRuptures + fraisArrivees;
    coutRuptures += fraisRuptures;

    // La réputation : les erreurs se lisent dans les avis, et la demande des semaines suivantes.
    // Un samedi raté se lit tout de suite dans les avis.
    if (bintouCheffe && !tient) reputation -= 0.1;
    reputation = borne(
      reputation + 0.2 * (1 - reputation) - 0.002 * Math.max(0, incidents - 3),
      0.85,
      1,
    );

    cumul += contribution;
    couvertsTotal += servis;
    perdusTotal += perdus;
    incidentsTotal += incidents;
    ventesPonderees += ventes * servis;
    extrasTotal += extras + remplacants;
    aides += aide;
    const sous = places.filter((pl) => pl.etat === "apprenti");
    semaines.push({
      contribution,
      cumul,
      couverts: servis,
      perdus,
      ventes,
      incidents,
      apprentis: sous.length,
      autonomie: sous.length ? sous.reduce((s, pl) => s + pl.a, 0) / sous.length : 0,
      confiance: sous.length ? sous.reduce((s, pl) => s + pl.c, 0) / sous.length : 0,
      autonomes: sous.filter((pl) => pl.a >= SEUIL_AUTONOME).length,
      manque,
      extras: extras + remplacants,
      ruptures: fraisRuptures,
      reputation,
    });
  }

  const fin = semaines[SEMAINES]!;
  const rentree = places.slice(0, APPRENTIS.length);
  return {
    semaines,
    objectif: cumul,
    ruptures,
    coutRuptures,
    couvertsTotal,
    perdusTotal,
    incidentsTotal,
    ventesMoyennes: ventesPonderees / couvertsTotal,
    extrasTotal,
    aides,
    tutorat: tutoratTotal,
    cfaDecale: decale,
    cfaAlerte,
    bintouTient: tient,
    groupesRates,
    apprentisFinal: fin.apprentis,
    autonomieFinale: fin.autonomie,
    autonomes: rentree.filter(
      (pl, i) => !ruptures.some((r) => r.place === i) && pl.a >= SEUIL_AUTONOME,
    ).length,
  };
}

/** Ce qui s'est passé pendant des semaines : ruptures, alerte du CFA, Bintou, groupes, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    ruptures: t.ruptures.filter((r) => !r.accord && dans(r.semaine)),
    cfaAlerte: t.cfaAlerte && dans(7),
    bintou: t.bintouTient !== null && dans(5) ? t.bintouTient : null,
    groupes: dans(13) ? t.groupesRates : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureSalle {
  cumul: number | null;
  budgetADate: number | null;
  apprentis: number | null;
  autonomie: number | null;
  incidents: number | null;
  ventes: number | null;
  /** Lus par les messages et les sources, pas affichés. */
  ruptures: number | null;
  autonomes: number | null;
  confiance: number | null;
}

/** Le budget de contribution de la salle sur le trimestre. */
export const BUDGET = 110000;
const SAISON_TOTALE = SAISON.reduce((s: number, x: number) => s + x, 0);
export const budgetADate = (semaine: number) =>
  (BUDGET * SAISON.slice(0, semaine + 1).reduce((s: number, x: number) => s + x, 0)) /
  SAISON_TOTALE;

/** Ce que Garance lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureSalle {
  if (semaine === 0) {
    return {
      cumul: 0,
      budgetADate: 0,
      apprentis: APPRENTIS.length,
      autonomie: APPRENTIS.reduce((s, x) => s + x.autonomie, 0) / APPRENTIS.length,
      incidents: 4,
      ventes: 6.3,
      ruptures: 0,
      autonomes: 0,
      confiance: APPRENTIS.reduce((s, x) => s + x.confiance, 0) / APPRENTIS.length,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    cumul: s.cumul,
    budgetADate: budgetADate(semaine),
    apprentis: s.apprentis,
    autonomie: s.autonomie,
    incidents: s.incidents,
    ventes: s.ventes,
    ruptures: t.ruptures.filter((r) => r.semaine <= semaine).length,
    autonomes: s.autonomes,
    confiance: s.confiance,
  };
}
