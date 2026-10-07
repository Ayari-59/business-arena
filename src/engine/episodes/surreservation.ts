/**
 * LES CHAMBRES VENDUES DEUX FOIS — le modèle de la surréservation du Groupe Escale.
 *
 * De septembre à novembre, salons et congrès remplissent quatre des huit hôtels
 * du groupe (Annecy-Centre, L'Escale Lac, Chambéry-Gare, Annemasse) : ces
 * soirs-là, la demande dépasse les chambres, et chaque client qui ne vient pas
 * laisse une chambre vide qu'on ne revendra jamais. Lucile Fabbri, revenue
 * manager, fixe la surréservation : combien de réservations accepter au-delà
 * des chambres. Treize semaines, six décisions. Trois mécanismes font
 * l'épisode, et le joueur doit les découvrir :
 *
 *   · DEUX COÛTS QUI SE COMPARENT EN ESPÉRANCE. Une chambre vide coûte sa
 *     marge : le prix moyen du soir moins les 21 € de coût variable d'une
 *     nuitée. Un client délogé coûte la nuit payée chez un confrère, le taxi,
 *     un geste, et le risque de le perdre. Une réservation de plus vaut la
 *     peine tant que la probabilité qu'elle remplisse une chambre vide,
 *     multipliée par la marge, dépasse la probabilité qu'elle fasse déloger
 *     quelqu'un, multipliée par le coût d'un délogement. Refuser toute
 *     surréservation laisse des chambres vides chaque soir de congrès ;
 *     surréserver de 5 % partout déloge là où les clients ne font presque pas
 *     défection. Surréserver de la moyenne des défections oublie que les deux
 *     erreurs n'ont pas le même coût.
 *   · LES DÉFECTIONS DÉPENDENT DU SEGMENT ET DE LA GARANTIE. Un client en
 *     tarif non remboursable ne fait presque jamais défection (et paie s'il ne
 *     vient pas) ; un client d'affaires sans garantie annule au dernier
 *     moment une fois sur six, davantage pendant les salons de novembre. Exiger
 *     une garantie fait baisser les défections et encaisser les no-shows, mais
 *     fait perdre de la demande et peut fâcher un compte d'entreprise ; un
 *     acompte en fait perdre davantage. Le bon niveau de surréservation se
 *     recalcule chaque fois que la garantie, le segment ou le soir change.
 *   · LE COÛT D'UN DÉLOGEMENT DÉPEND DE QUI, ET DE QUAND. Déloger le dernier
 *     arrivé, c'est souvent déloger un client d'affaires fidèle, et risquer
 *     son compte : 2 400 € de marge par an. Choisir dès 18 heures des clients
 *     de passage, et les prévenir, ramène le délogement à son coût direct. Les
 *     soirs où toute la ville est pleine, il n'y a plus de confrère à côté :
 *     taxi jusqu'à Aix-les-Bains, chambre au prix fort, et le même calcul
 *     donne une surréservation plus faible.
 *
 * Le hasard décide des défections de chaque soir (et du niveau général des
 * défections de cet automne, qu'on ne connaît qu'en le constatant), de la
 * demande, des imprévus, des clients fidèles délogés qui partent, et de la
 * réponse de Sarvélec, le premier compte d'Annemasse, à une demande de
 * garantie.
 *
 * Le trimestre est jugé en euros : la marge hébergement des soirs de forte
 * demande (nuitées vendues moins leur coût variable, plus les défections
 * encaissées), nette des coûts de délogement, de la marge annuelle des clients
 * perdus et des avis négatifs.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/** Le coût variable d'une nuitée, poste par poste : il ne dépend que des chambres occupées. */
export const CV_NUITEE = { linge: 7, accueil: 2, energie: 3, menage: 9 } as const;
export const CV = CV_NUITEE.linge + CV_NUITEE.accueil + CV_NUITEE.energie + CV_NUITEE.menage;

/* ---------------------------------------------------------------------------
 * LES SEGMENTS ET LEURS DÉFECTIONS.
 * ------------------------------------------------------------------------- */

export type Segment = "nr" | "carte" | "affaires" | "groupe" | "cure";
export const SEGMENTS: readonly Segment[] = ["nr", "carte", "affaires", "groupe", "cure"];
export type Mix = Readonly<Record<Segment, number>>;

/**
 * Les défections des soirs de forte demande — no-shows et annulations trop
 * tardives pour revendre la chambre —, par segment, sur les deux derniers
 * automnes (septembre et octobre).
 */
export const DEFECTION: Mix = { nr: 0.02, carte: 0.06, affaires: 0.16, groupe: 0.03, cure: 0.005 };
/** En novembre, les salons professionnels : les entreprises désinscrivent au dernier moment. */
export const DEFECTION_NOVEMBRE: Mix = {
  nr: 0.02,
  carte: 0.07,
  affaires: 0.26,
  groupe: 0.03,
  cure: 0.005,
};
/** Les soirs du grand congrès : les congressistes ont leur chambre comprise dans l'inscription, et viennent. */
export const DEFECTION_CONGRES: Mix = { ...DEFECTION, groupe: 0.015 };
/** La part du prix encaissée sur une défection : le non remboursable et la cure prépayée sont payés, la garantie carte se recouvre six fois sur dix. */
export const ENCAISSE: Mix = { nr: 1, carte: 0.6, affaires: 0, groupe: 0, cure: 1 };

/** Les hôtels qui affichent complet certains soirs de l'automne ; Megève est fermé jusqu'à la mi-décembre. */
export type HotelId = "annecy" | "lac" | "chambery" | "annemasse" | "evian" | "aix" | "albertville";
export type TypeDeSoir = "normal" | "plein";

export interface Hotel {
  id: HotelId;
  nom: string;
  chambres: number;
  /** Le prix moyen d'une nuitée les soirs de forte demande ; « plein » : quand toute la ville est pleine. */
  prix: Readonly<Record<TypeDeSoir, number>>;
  mix: Mix;
  mixPlein?: Mix;
  mixNovembre?: Mix;
  /** La part de clients d'affaires fidèles parmi les derniers arrivés du soir. */
  fideles: number;
  /** La part de clients de passage (loisirs, affaires ponctuelles) parmi les clients du soir. */
  passage: number;
}

export const HOTELS: Readonly<Record<HotelId, Hotel>> = {
  annecy: {
    id: "annecy",
    nom: "L'Escale Annecy-Centre",
    chambres: 60,
    prix: { normal: 158, plein: 219 },
    mix: { nr: 0.25, carte: 0.3, affaires: 0.3, groupe: 0.15, cure: 0 },
    mixPlein: { nr: 0.35, carte: 0.08, affaires: 0.02, groupe: 0.55, cure: 0 },
    fideles: 0.35,
    passage: 0.5,
  },
  lac: {
    id: "lac",
    nom: "L'Escale Lac",
    chambres: 84,
    prix: { normal: 189, plein: 259 },
    mix: { nr: 0.65, carte: 0.27, affaires: 0.02, groupe: 0.06, cure: 0 },
    mixPlein: { nr: 0.4, carte: 0.1, affaires: 0, groupe: 0.5, cure: 0 },
    fideles: 0.08,
    passage: 0.8,
  },
  chambery: {
    id: "chambery",
    nom: "L'Escale Chambéry-Gare",
    chambres: 72,
    prix: { normal: 142, plein: 142 },
    mix: { nr: 0.15, carte: 0.2, affaires: 0.5, groupe: 0.15, cure: 0 },
    mixNovembre: { nr: 0.1, carte: 0.15, affaires: 0.65, groupe: 0.1, cure: 0 },
    fideles: 0.55,
    passage: 0.3,
  },
  annemasse: {
    id: "annemasse",
    nom: "L'Escale Annemasse",
    chambres: 78,
    prix: { normal: 149, plein: 149 },
    mix: { nr: 0.15, carte: 0.2, affaires: 0.55, groupe: 0.1, cure: 0 },
    mixNovembre: { nr: 0.1, carte: 0.15, affaires: 0.65, groupe: 0.1, cure: 0 },
    fideles: 0.55,
    passage: 0.25,
  },
  evian: {
    id: "evian",
    nom: "L'Escale Évian",
    chambres: 66,
    prix: { normal: 214, plein: 214 },
    mix: { nr: 0.25, carte: 0.1, affaires: 0, groupe: 0.65, cure: 0 },
    fideles: 0.15,
    passage: 0.35,
  },
  aix: {
    id: "aix",
    nom: "L'Escale Aix-les-Bains",
    chambres: 56,
    prix: { normal: 124, plein: 124 },
    mix: { nr: 0.05, carte: 0.1, affaires: 0.1, groupe: 0.05, cure: 0.7 },
    fideles: 0.2,
    passage: 0.2,
  },
  albertville: {
    id: "albertville",
    nom: "L'Escale Albertville",
    chambres: 44,
    prix: { normal: 96, plein: 96 },
    mix: { nr: 0.1, carte: 0.2, affaires: 0, groupe: 0.7, cure: 0 },
    fideles: 0.1,
    passage: 0.3,
  },
};
export const HOTELS_ORDRE: readonly HotelId[] = [
  "annecy",
  "lac",
  "chambery",
  "annemasse",
  "evian",
  "aix",
  "albertville",
];

/** Les semaines de novembre, celles des salons professionnels. */
export const NOVEMBRE = 9;

/* ---------------------------------------------------------------------------
 * LE CALENDRIER DES SOIRS DE FORTE DEMANDE : salons, congrès, week-ends de septembre.
 * ------------------------------------------------------------------------- */

export interface Soir {
  semaine: number;
  hotel: HotelId;
  type: TypeDeSoir;
}

/** Par semaine : [hôtel, nombre de soirs, type]. La semaine 7 est celle du grand congrès d'Annecy. */
const CALENDRIER: readonly (readonly [HotelId, number, TypeDeSoir][])[] = [
  [],
  [
    ["lac", 2, "normal"],
    ["annecy", 2, "normal"],
    ["evian", 1, "normal"],
  ],
  [
    ["lac", 2, "normal"],
    ["annecy", 1, "normal"],
    ["chambery", 2, "normal"],
    ["evian", 1, "normal"],
    ["aix", 1, "normal"],
    ["albertville", 1, "normal"],
  ],
  [
    ["lac", 2, "normal"],
    ["chambery", 3, "normal"],
    ["annemasse", 2, "normal"],
    ["evian", 1, "normal"],
    ["aix", 1, "normal"],
  ],
  [
    ["lac", 2, "normal"],
    ["annecy", 2, "normal"],
    ["annemasse", 2, "normal"],
    ["evian", 1, "normal"],
  ],
  [
    ["annecy", 2, "normal"],
    ["chambery", 2, "normal"],
    ["annemasse", 2, "normal"],
    ["evian", 1, "normal"],
    ["aix", 1, "normal"],
    ["albertville", 1, "normal"],
  ],
  [
    ["lac", 1, "normal"],
    ["chambery", 3, "normal"],
    ["annemasse", 2, "normal"],
    ["evian", 1, "normal"],
    ["aix", 1, "normal"],
  ],
  [
    ["annecy", 4, "plein"],
    ["lac", 4, "plein"],
    ["annemasse", 2, "normal"],
  ],
  [
    ["annecy", 1, "normal"],
    ["chambery", 2, "normal"],
    ["annemasse", 2, "normal"],
    ["evian", 1, "normal"],
    ["albertville", 1, "normal"],
  ],
  [
    ["chambery", 3, "normal"],
    ["annemasse", 2, "normal"],
  ],
  [
    ["chambery", 2, "normal"],
    ["annemasse", 3, "normal"],
    ["albertville", 1, "normal"],
  ],
  [
    ["chambery", 3, "normal"],
    ["annemasse", 3, "normal"],
  ],
  [
    ["annecy", 2, "normal"],
    ["chambery", 2, "normal"],
    ["annemasse", 2, "normal"],
    ["albertville", 1, "normal"],
  ],
  [
    ["chambery", 2, "normal"],
    ["annemasse", 2, "normal"],
  ],
];

export const SOIRS: readonly Soir[] = CALENDRIER.flatMap((liste, semaine) =>
  liste.flatMap(([hotel, n, type]) => Array.from({ length: n }, () => ({ semaine, hotel, type }))),
);
export const SOIRS_PAR_SEMAINE = CALENDRIER.map((l) => l.reduce((s, [, n]) => s + n, 0));

/**
 * La demande d'un soir de forte demande au-delà des chambres : de 6 à 26 %, de 15 à 35 % pour
 * les salons de novembre, de 35 à 55 % au grand congrès.
 */
export const EXCES = {
  normal: 0.06,
  novembre: 0.15,
  ecart: 0.2,
  plein: 0.35,
} as const;

/** Le grand congrès d'Annecy : quatre soirs, toute la ville est pleine. */
export const CONGRES = { semaine: 7, soirs: 4, hotels: ["annecy", "lac"] as const } as const;
/** Le salon de Chambéry de la semaine 3, sur lequel porte la prévision de la semaine 1. */
export const SOIR_DE_REFERENCE = { hotel: "chambery" as HotelId, semaine: 3 } as const;

/* ---------------------------------------------------------------------------
 * CE QUE COÛTE UN DÉLOGEMENT.
 * ------------------------------------------------------------------------- */

/** Un délogement chez un confrère : la nuit, le taxi, un geste (petit-déjeuner et bouteille au retour). */
export const DELOGEMENT = {
  confrere: 165,
  taxi: 30,
  geste: 35,
  /** Quand toute la ville est pleine : la dernière chambre libre est à Aix-les-Bains, au prix fort. */
  confrerePlein: 260,
  taxiPlein: 120,
  gestePlein: 50,
  /** Vers nos propres hôtels (Aix-les-Bains, Évian, Albertville) : la chambre ne coûte que son coût variable, le taxi est long. */
  taxiNosHotels: 75,
  /** Le bon d'achat offert aux clients qui acceptent de partir. */
  bonVolontaire: 100,
  /** La part des délogements qu'on fait avec des volontaires ; les autres, au dernier arrivé. */
  partVolontaires: 0.6,
} as const;

/** Ce qu'un client délogé peut emporter avec lui. */
export const CLIENT = {
  /** Un client de passage : la marge de ses séjours à venir, et la part qui ne revient pas après un délogement. */
  valeurPassage: 400,
  pertePassage: 0.075,
  /** Envoyé loin, dans un hôtel qu'il n'a pas choisi. */
  pertePassageLoin: 0.12,
  /** Un client d'affaires fidèle, et le compte de son entreprise : 40 nuitées par an à 100 € de marge. */
  valeurFidele: 4000,
  perteFidele: 0.2,
  perteFideleLoin: 0.3,
} as const;

/** Cinq délogements le même soir dans le même hôtel, et les avis tombent : il faut payer la mise en avant pour remonter. */
export const AVIS = { seuil: 5, cout: 2000 } as const;

/** Les règles de délogement de la décision 2. */
export const REGLE = { dernier: 0, designe: 1, nosHotels: 2, volontaires: 3 } as const;

export interface CoutDeDelogement {
  /** La nuit, le taxi, le geste : ce que coûte chaque délogement. */
  direct: number;
  /** La part de clients fidèles parmi les délogés. */
  partFideles: number;
  /** La probabilité qu'un fidèle délogé parte, et qu'un client de passage ne revienne pas. */
  perteFidele: number;
  pertePassage: number;
}

export function coutDeDelogement(regle: number, hotel: Hotel, type: TypeDeSoir): CoutDeDelogement {
  const plein = type === "plein";
  const chezUnConfrere =
    (plein ? DELOGEMENT.confrerePlein : DELOGEMENT.confrere) +
    (plein ? DELOGEMENT.taxiPlein : DELOGEMENT.taxi) +
    (plein ? DELOGEMENT.gestePlein : DELOGEMENT.geste);
  // Quand toute la ville est pleine, le client délogé dort à quarante-cinq minutes : il le pardonne moins.
  const perteFidele = plein ? CLIENT.perteFideleLoin : CLIENT.perteFidele;
  const pertePassage = plein ? CLIENT.pertePassageLoin : CLIENT.pertePassage;
  if (regle === REGLE.designe) {
    return { direct: chezUnConfrere, partFideles: 0, perteFidele, pertePassage };
  }
  if (regle === REGLE.nosHotels) {
    return {
      direct:
        CV +
        (plein ? DELOGEMENT.taxiPlein : DELOGEMENT.taxiNosHotels) +
        (plein ? DELOGEMENT.gestePlein : DELOGEMENT.geste),
      partFideles: hotel.fideles,
      perteFidele: CLIENT.perteFideleLoin,
      pertePassage: CLIENT.pertePassageLoin,
    };
  }
  if (regle === REGLE.volontaires) {
    return {
      direct: chezUnConfrere + DELOGEMENT.partVolontaires * DELOGEMENT.bonVolontaire,
      partFideles: (1 - DELOGEMENT.partVolontaires) * hotel.fideles,
      perteFidele,
      pertePassage: (1 - DELOGEMENT.partVolontaires) * pertePassage,
    };
  }
  return { direct: chezUnConfrere, partFideles: hotel.fideles, perteFidele, pertePassage };
}

/** Le coût attendu d'un délogement : direct, plus la valeur des clients qu'on risque de perdre. */
export function coutAttendu(c: CoutDeDelogement): number {
  return (
    c.direct +
    c.partFideles * c.perteFidele * CLIENT.valeurFidele +
    (1 - c.partFideles) * c.pertePassage * CLIENT.valeurPassage
  );
}

/** Le délogement d'un client de passage chez un confrère, un soir ordinaire : 260 €. */
export const COUT_DELOGEMENT_PASSAGE =
  DELOGEMENT.confrere +
  DELOGEMENT.taxi +
  DELOGEMENT.geste +
  CLIENT.pertePassage * CLIENT.valeurPassage;
/** Le délogement d'un client d'affaires fidèle : 1 030 €. */
export const COUT_DELOGEMENT_FIDELE =
  DELOGEMENT.confrere +
  DELOGEMENT.taxi +
  DELOGEMENT.geste +
  CLIENT.perteFidele * CLIENT.valeurFidele;

/* ---------------------------------------------------------------------------
 * LA GARANTIE DES RÉSERVATIONS (décision 3, à partir de la semaine 5).
 * ------------------------------------------------------------------------- */

export interface Garantie {
  /** Ce que la garantie fait aux défections, par segment. */
  defection: Mix;
  encaisse: Mix;
  /** Ce qu'elle fait à la demande. */
  demande: Mix;
  /** Le risque que Sarvélec, premier compte d'Annemasse, parte chez Orméa Hotels. */
  risqueSarvelec: number;
}

const UN: Mix = { nr: 1, carte: 1, affaires: 1, groupe: 1, cure: 1 };

export const GARANTIES: readonly Garantie[] = [
  // Rien ne change : les tarifs d'entreprise restent annulables jusqu'à 18 heures le jour même.
  { defection: UN, encaisse: ENCAISSE, demande: UN, risqueSarvelec: 0 },
  // Une carte de garantie pour toutes les réservations des soirs de forte demande, comptes compris.
  {
    defection: { ...UN, affaires: 0.7 },
    encaisse: { ...ENCAISSE, affaires: 0.5 },
    demande: { ...UN, affaires: 0.95 },
    risqueSarvelec: 0.25,
  },
  // Une carte pour les clients de passage, une garantie société (engagement écrit) pour les comptes.
  {
    defection: { ...UN, affaires: 0.8 },
    encaisse: { ...ENCAISSE, affaires: 0.34 },
    demande: { ...UN, affaires: 0.98 },
    risqueSarvelec: 0,
  },
  // Un acompte de 30 % à la réservation, pour tous.
  {
    defection: { ...UN, affaires: 0.5, carte: 0.6 },
    encaisse: { ...ENCAISSE, affaires: 0.3 },
    demande: { ...UN, affaires: 0.88, carte: 0.94 },
    risqueSarvelec: 0.5,
  },
];
export const GARANTIE_DES = 5;
/** Sarvélec : 200 nuitées par an à Annemasse, 100 € de marge chacune. */
export const SARVELEC = { valeur: 20000, nuitees: 200 } as const;

/** Le module de surréservation automatique de Hostéo : le taux moyen de défection de l'année, partout. */
export const MODULE_HOSTEO = { taux: 0.04, abonnement: 900 } as const;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des réceptions qui refusent des réservations « parce que c'est plein ». */
export const PERTE_PAR_JOUR = 1500;

/** Le budget de marge hébergement des soirs de forte demande, pour le trimestre. */
export const BUDGET = 890000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  politique: 0,
  deloger: 1,
  garantie: 2,
  congres: 3,
  novembre: 4,
  pression: 5,
} as const;

/** Ne rien changer : pas de surréservation, le dernier arrivé délogé, pas de garantie, rien de particulier au congrès, rien en novembre, la politique maintenue. */
export const NEUTRE = [0, 0, 0, 0, 0, 1] as const;

/* ---------------------------------------------------------------------------
 * LE CALCUL : la surréservation qui maximise la marge espérée d'un soir.
 * ------------------------------------------------------------------------- */

/** Le taux de défection moyen d'un soir, selon les segments présents. */
export function tauxMoyen(mix: Mix, taux: Mix, garantie: Garantie = GARANTIES[0]!): number {
  let poids = 0;
  let t = 0;
  for (const s of SEGMENTS) {
    const part = mix[s] * garantie.demande[s];
    poids += part;
    t += part * taux[s] * garantie.defection[s];
  }
  return t / poids;
}

/** La probabilité d'avoir au plus k défections parmi n réservations, chacune avec la probabilité p. */
export function auPlus(k: number, n: number, p: number): number {
  let pmf = (1 - p) ** n;
  let cumul = pmf;
  for (let i = 0; i < k && i < n; i += 1) {
    pmf *= ((n - i) / (i + 1)) * (p / (1 - p));
    cumul += pmf;
  }
  return Math.min(1, cumul);
}

/** Le nombre de défections d'un soir, tiré par l'inverse de la loi binomiale (un tirage uniforme suffit). */
export function defectionsTirees(u: number, n: number, p: number): number {
  if (n <= 0 || p <= 0) return 0;
  let pmf = (1 - p) ** n;
  let cumul = pmf;
  let k = 0;
  while (cumul < u && k < n) {
    pmf *= ((n - k) / (k + 1)) * (p / (1 - p));
    k += 1;
    cumul += pmf;
  }
  return k;
}

/**
 * La marge espérée d'un soir où l'on accepte x réservations au-delà des
 * chambres : les chambres occupées à leur marge, moins les délogements à
 * leur coût, et le risque d'un soir à cinq délogements. Les défections
 * encaissées n'y changent rien : on les touche quel que soit x.
 */
export function margeEsperee(chambres: number, x: number, p: number, marge: number, cout: number) {
  const n = chambres + x;
  let pmf = (1 - p) ** n;
  let v = 0;
  for (let k = 0; k <= n; k += 1) {
    const presents = n - k;
    const deloges = Math.max(0, presents - chambres);
    v +=
      pmf *
      (Math.min(chambres, presents) * marge -
        deloges * cout -
        (deloges >= AVIS.seuil ? AVIS.cout : 0));
    pmf *= ((n - k) / (k + 1)) * (p / (1 - p));
  }
  return v;
}

const optimums = new Map<string, number>();

/** La surréservation qui maximise la marge espérée : on ajoute une réservation tant qu'elle rapporte plus qu'elle ne risque. */
export function surreservationOptimale(
  chambres: number,
  p: number,
  marge: number,
  cout: number,
): number {
  const cle = `${chambres}|${p.toFixed(6)}|${marge}|${cout.toFixed(3)}`;
  const deja = optimums.get(cle);
  if (deja !== undefined) return deja;
  let meilleur = 0;
  let valeur = margeEsperee(chambres, 0, p, marge, cout);
  for (let x = 1; x <= 25; x += 1) {
    const v = margeEsperee(chambres, x, p, marge, cout);
    if (v > valeur + 1e-9) {
      valeur = v;
      meilleur = x;
    }
  }
  optimums.set(cle, meilleur);
  return meilleur;
}

/** La règle de la page : la plus petite surréservation x telle que P(défections ≤ x) atteigne marge / (marge + coût). */
export function surreservationParLaRegle(
  chambres: number,
  p: number,
  marge: number,
  cout: number,
): number {
  const seuil = marge / (marge + cout);
  let x = 0;
  while (auPlus(x, chambres, p) < seuil) x += 1;
  return x;
}

/** La marge d'une chambre occupée, un soir de forte demande. */
export const margeDUneNuitee = (hotel: Hotel, type: TypeDeSoir) => hotel.prix[type] - CV;

/** Le taux de défection du soir de référence (Chambéry-Gare, un soir de salon), selon l'historique. */
export const TAUX_REFERENCE = tauxMoyen(HOTELS.chambery.mix, DEFECTION);
/** La surréservation qui maximise la marge espérée le soir du salon de la semaine 3, en délogeant un client de passage. */
export const SURRESERVATION_REFERENCE = surreservationOptimale(
  HOTELS.chambery.chambres,
  TAUX_REFERENCE,
  margeDUneNuitee(HOTELS.chambery, "normal"),
  COUT_DELOGEMENT_PASSAGE,
);

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
  effet: {
    /** Multiplie les défections de tous les soirs. */
    defection?: number;
    /** Des chambres hors service dans un hôtel. */
    horsService?: { hotel: HotelId; chambres: number };
    /** Des réservations vendues en trop par les plateformes. */
    enTrop?: number;
    /** Un hôtel perd sa forte demande. */
    sansDemande?: HotelId;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "greve",
    titre: "Grève des trains régionaux",
    de: "Réception",
    role: "L'Escale Chambéry-Gare",
    texte:
      "Deux jours de grève dans les trains régionaux : les clients d'affaires qui venaient de Lyon et de Grenoble annulent à la dernière minute.",
    duree: 1,
    effet: { defection: 1.7 },
  },
  {
    id: "degat",
    titre: "Dégât des eaux à Annemasse",
    de: "Direction technique",
    role: "Siège, Annecy",
    texte:
      "Une colonne d'eau a cédé au deuxième étage de L'Escale Annemasse : cinq chambres hors service toute la semaine, le temps de changer les moquettes.",
    duree: 1,
    effet: { horsService: { hotel: "annemasse", chambres: 5 } },
  },
  {
    id: "canaux",
    titre: "Panne du gestionnaire de canaux",
    de: "Systèmes d'information",
    role: "Siège, Annecy",
    texte:
      "La liaison entre Hostéo et les plateformes est tombée trois jours : Bookalia et Voyagio ont continué de vendre des chambres déjà vendues, trois de trop par soir et par hôtel.",
    duree: 1,
    effet: { enTrop: 3 },
  },
  {
    id: "autoroute",
    titre: "Autoroute coupée entre Annecy et Chambéry",
    de: "Réception",
    role: "L'Escale Annecy-Centre",
    texte:
      "Un éboulement coupe l'autoroute entre Annecy et Chambéry pendant quatre jours : beaucoup de clients renoncent au dernier moment.",
    duree: 1,
    effet: { defection: 1.5 },
  },
  {
    id: "salon",
    titre: "Salon reporté à Genève",
    de: "Direction",
    role: "L'Escale Annemasse",
    texte:
      "Le salon industriel de Genève est reporté au printemps : les soirs qu'il devait remplir à Annemasse ne le sont plus, et les réservations s'annulent dans les délais.",
    duree: 2,
    effet: { sansDemande: "annemasse" },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le niveau général des défections de cet automne, rapporté à l'historique. */
  phi: number;
  /** Par soir : la demande au-delà des chambres, et le tirage des défections. */
  demande: readonly number[];
  defection: readonly number[];
  /** Pour chaque client fidèle délogé, dans l'ordre : part-il ? */
  fideles: readonly number[];
  /** Sarvélec accepte-t-il la garantie demandée ? */
  uSarvelec: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000609 + 7);
  const phi = Math.min(1.3, Math.max(0.75, Math.exp(0.13 * gauss(r))));
  const demande: number[] = [];
  const defection: number[] = [];
  for (let i = 0; i < SOIRS.length; i += 1) {
    demande.push(r());
    defection.push(r());
  }
  const fideles = Array.from({ length: 80 }, () => r());
  const uSarvelec = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { phi, demande, defection, fideles, uSarvelec, imprevus };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUE LES DÉCISIONS METTENT EN PLACE, soir par soir.
 * ------------------------------------------------------------------------- */

/** La règle de délogement en vigueur : le dernier arrivé jusqu'à la décision 2. */
export const regleEnVigueur = (chemin: readonly number[], semaine: number) =>
  semaine <= 2 ? REGLE.dernier : (chemin[D.deloger] ?? REGLE.dernier);
/** La garantie en vigueur : aucune avant la semaine 5. */
export const garantieEnVigueur = (chemin: readonly number[], semaine: number) =>
  semaine < GARANTIE_DES ? 0 : (chemin[D.garantie] ?? 0);

/** Sarvélec part-il chez Orméa Hotels ? Seulement si on lui demande une carte, ou un acompte. */
export const sarvelecPartSiDemande = (choix: number, graine: number) =>
  hasard(graine).uSarvelec < GARANTIES[choix]!.risqueSarvelec;
export const sarvelecParti = (chemin: readonly number[], graine: number) =>
  sarvelecPartSiDemande(chemin[D.garantie] ?? 0, graine);

/** Le mélange de segments d'un soir. */
export function mixDuSoir(hotel: Hotel, soir: Soir): Mix {
  if (soir.type === "plein" && hotel.mixPlein) return hotel.mixPlein;
  if (soir.semaine >= NOVEMBRE && hotel.mixNovembre) return hotel.mixNovembre;
  return hotel.mix;
}
export const tauxDuSoir = (soir: Soir): Mix =>
  soir.type === "plein"
    ? DEFECTION_CONGRES
    : soir.semaine >= NOVEMBRE
      ? DEFECTION_NOVEMBRE
      : DEFECTION;

/**
 * La surréservation calculée : la marge espérée maximale, avec ce que Lucile
 * sait au moment du calcul — les défections historiques ou constatées, le
 * segment, la garantie en vigueur, le coût d'un délogement selon la règle.
 */
function calculee(
  hotel: Hotel,
  mix: Mix,
  taux: Mix,
  garantie: Garantie,
  phi: number,
  regle: number,
  type: TypeDeSoir,
): number {
  const p = Math.min(0.9, tauxMoyen(mix, taux, garantie) * phi);
  return surreservationOptimale(
    hotel.chambres,
    p,
    margeDUneNuitee(hotel, type),
    coutAttendu(coutDeDelogement(regle, hotel, type)),
  );
}

/** La surréservation de la politique choisie en semaine 1, un soir ordinaire. */
function politiqueDeDepart(chemin: readonly number[], hotel: Hotel, soir: Soir): number {
  const d1 = chemin[D.politique] ?? 0;
  if (d1 === 1) return Math.round(0.05 * hotel.chambres);
  if (d1 === 3) return Math.round(tauxMoyen(hotel.mix, DEFECTION) * hotel.chambres);
  if (d1 === 2) {
    const g = GARANTIES[garantieEnVigueur(chemin, soir.semaine)]!;
    return calculee(
      hotel,
      hotel.mix,
      DEFECTION,
      g,
      1,
      regleEnVigueur(chemin, soir.semaine),
      "normal",
    );
  }
  return 0;
}

/** La surréservation d'un soir, selon toutes les décisions prises avant lui. */
export function surreservationDuSoir(
  chemin: readonly number[],
  soir: Soir,
  phiConstate: number,
): number {
  const hotel = HOTELS[soir.hotel];
  const g = GARANTIES[garantieEnVigueur(chemin, soir.semaine)]!;
  const regle = regleEnVigueur(chemin, soir.semaine);
  let x = politiqueDeDepart(chemin, hotel, soir);

  if (soir.type === "plein") {
    const d4 = chemin[D.congres] ?? 0;
    if (d4 === 1) x += 3;
    else if (d4 === 2) {
      x = calculee(hotel, mixDuSoir(hotel, soir), DEFECTION_CONGRES, g, 1, regle, "plein");
    } else if (d4 === 3) x = 0;
  }

  // Novembre : mettre à jour la méthode choisie en semaine 1 avec les défections constatées et
  // le profil des salons. Une règle uniforme ou une interdiction n'ont rien à mettre à jour.
  if (soir.semaine >= NOVEMBRE) {
    const d5 = chemin[D.novembre] ?? 0;
    const d1 = chemin[D.politique] ?? 0;
    const mix = mixDuSoir(hotel, soir);
    if (d5 === 1 && d1 === 2) {
      x = calculee(hotel, mix, tauxDuSoir(soir), g, phiConstate, regle, "normal");
    } else if (d5 === 1 && d1 === 3) {
      x = Math.round(tauxMoyen(mix, tauxDuSoir(soir), g) * phiConstate * hotel.chambres);
    } else if (d5 === 2) x += 2;
    else if (d5 === 3) x = Math.round(MODULE_HOSTEO.taux * hotel.chambres);
  }

  if (soir.semaine >= 11) {
    const d6 = chemin[D.pression] ?? 1;
    if (d6 === 0) x = 0;
    else if (d6 === 2) x = Math.min(x, 2);
    else if (d6 === 3) x = Math.round(x / 2);
  }
  return x;
}

/* ---------------------------------------------------------------------------
 * LA SIMULATION.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  soirs: number;
  /** Réservations acceptées au-delà des chambres, en moyenne par soir. */
  surreservation: number;
  occupees: number;
  capacite: number;
  /** Chambres restées vides par défection. */
  vides: number;
  deloges: number;
  fidelesDeloges: number;
  /** Chambres que la surréservation a remplies, et leur marge. */
  remplies: number;
  margeRemplies: number;
  /** Marge des nuitées, défections encaissées comprises. */
  margeNuitees: number;
  /** Nuits, taxis, gestes, clients perdus, avis : tout ce que les délogements ont coûté. */
  coutDelogements: number;
  /** La marge nette de la semaine. */
  marge: number;
  /** Ce que coûtent les chambres vides et les délogements, par soir de forte demande. */
  coutParSoir: number;
  margeCumul: number;
  videsCumul: number;
  delogesCumul: number;
  coutDelogementsCumul: number;
  occupeesCumul: number;
  capaciteCumul: number;
  /** Le taux d'occupation des soirs de forte demande, depuis le début du trimestre. */
  to: number;
};

export interface SoireeNoire {
  semaine: number;
  hotel: HotelId;
  deloges: number;
}

export interface ClientPerdu {
  semaine: number;
  hotel: HotelId;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge hébergement des soirs de forte demande, nette des coûts de délogement et des clients perdus. */
  objectif: number;
  margeNuitees: number;
  encaisse: number;
  vides: number;
  deloges: number;
  fidelesDeloges: number;
  /** Les clients fidèles partis après un délogement. */
  fidelesPerdus: number;
  pertes: readonly ClientPerdu[];
  remplies: number;
  margeRemplies: number;
  coutDirect: number;
  valeurPerdue: number;
  soireesNoires: readonly SoireeNoire[];
  sarvelecParti: boolean;
  /** Le niveau des défections constaté sur les semaines 1 à 8, rapporté à l'historique. */
  phiConstate: number;
  /** Les défections constatées et attendues des semaines 1 à 8, par réservation. */
  tauxConstate: number;
  tauxAttendu: number;
  /** Le taux d'occupation des soirs de forte demande sur le trimestre. */
  to: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  const sarvelec = sarvelecParti(chemin, graine);

  let margeCumul = 0;
  let videsCumul = 0;
  let delogesCumul = 0;
  let coutCumul = 0;
  let occupeesCumul = 0;
  let capaciteCumul = 0;
  let fidelesCumul = 0;
  let fidelesPerdus = 0;
  let margeNuitees = 0;
  let encaisse = 0;
  let remplies = 0;
  let margeRemplies = 0;
  const pertes: ClientPerdu[] = [];
  let coutDirect = 0;
  let valeurPerdue = 0;
  const soireesNoires: SoireeNoire[] = [];
  // Ce que Lucile constate des défections jusqu'à la semaine 8, pour recalculer en novembre.
  let defConstatees = 0;
  let defAttendues = 0;
  let reservationsConstatees = 0;
  let phiConstate = 1;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let multDefection = 1;
    let enTrop = 0;
    for (const a of actifs) {
      multDefection *= a.imprevu.effet.defection ?? 1;
      enTrop += a.imprevu.effet.enTrop ?? 0;
    }
    if (w === NOVEMBRE) {
      phiConstate = defAttendues > 0 ? defConstatees / defAttendues : 1;
    }
    const g = GARANTIES[garantieEnVigueur(chemin, w)]!;
    const regle = regleEnVigueur(chemin, w);

    const s = {
      soirs: 0,
      surreservation: 0,
      occupees: 0,
      capacite: 0,
      vides: 0,
      deloges: 0,
      fidelesDeloges: 0,
      remplies: 0,
      margeRemplies: 0,
      margeNuitees: 0,
      coutDelogements: 0,
      margeDesVides: 0,
    };

    SOIRS.forEach((soir, i) => {
      if (soir.semaine !== w) return;
      const hotel = HOTELS[soir.hotel];
      const mix = mixDuSoir(hotel, soir);
      const taux = tauxDuSoir(soir);
      const hs = actifs.find((a) => a.imprevu.effet.horsService?.hotel === soir.hotel);
      const chambres = hotel.chambres - (hs?.imprevu.effet.horsService?.chambres ?? 0);
      const sansDemande = actifs.some((a) => a.imprevu.effet.sansDemande === soir.hotel);

      // La demande du soir, au-delà des chambres ; la garantie en fait perdre une part.
      const exces = sansDemande
        ? -0.08
        : soir.type === "plein"
          ? EXCES.plein + EXCES.ecart * h.demande[i]!
          : (hotel.mixNovembre && w >= NOVEMBRE ? EXCES.novembre : EXCES.normal) +
            EXCES.ecart * h.demande[i]!;
      let demande = 0;
      let tauxSoir = 0;
      let encaisseParDefection = 0;
      for (const seg of SEGMENTS) {
        const d = hotel.chambres * (1 + exces) * mix[seg] * g.demande[seg];
        demande += d;
        const p = taux[seg] * g.defection[seg];
        tauxSoir += d * p;
        encaisseParDefection += d * p * g.encaisse[seg];
      }
      encaisseParDefection /= Math.max(1e-9, tauxSoir);
      tauxSoir = Math.min(0.9, (tauxSoir / demande) * h.phi * multDefection);

      const x = surreservationDuSoir(chemin, soir, phiConstate);
      const reservations = Math.min(Math.floor(demande), hotel.chambres + x) + enTrop;
      const defs = defectionsTirees(h.defection[i]!, reservations, tauxSoir);
      const presents = reservations - defs;
      const occupees = Math.min(chambres, presents);
      const deloges = Math.max(0, presents - chambres);
      const vides = chambres - occupees;

      // Sans surréservation, avec le même tirage : ce que la surréservation a rempli.
      const sansSurres = Math.min(Math.floor(demande), hotel.chambres) + enTrop;
      const occupeesSans = Math.min(
        chambres,
        sansSurres - defectionsTirees(h.defection[i]!, sansSurres, tauxSoir),
      );

      const prix = hotel.prix[soir.type];
      const margeSoir = occupees * (prix - CV) + defs * encaisseParDefection * prix;
      encaisse += defs * encaisseParDefection * prix;

      // Les délogements : qui, à quel coût, et qui part.
      const c = coutDeDelogement(regle, hotel, soir.type);
      const passagePresents = hotel.passage * hotel.chambres;
      const fideles =
        regle === REGLE.designe ? Math.max(0, deloges - passagePresents) : deloges * c.partFideles;
      let cout = deloges * c.direct + (deloges - fideles) * c.pertePassage * CLIENT.valeurPassage;
      coutDirect += deloges * c.direct;
      valeurPerdue += (deloges - fideles) * c.pertePassage * CLIENT.valeurPassage;
      const avant = Math.floor(fidelesCumul + 1e-9);
      fidelesCumul += fideles;
      const apres = Math.floor(fidelesCumul + 1e-9);
      for (let k = avant; k < apres; k += 1) {
        if ((h.fideles[k] ?? 1) < c.perteFidele) {
          fidelesPerdus += 1;
          pertes.push({ semaine: w, hotel: soir.hotel });
          cout += CLIENT.valeurFidele;
          valeurPerdue += CLIENT.valeurFidele;
        }
      }
      if (deloges >= AVIS.seuil) {
        cout += AVIS.cout;
        soireesNoires.push({ semaine: w, hotel: soir.hotel, deloges });
      }

      if (w < NOVEMBRE) {
        defConstatees += defs;
        defAttendues += reservations * tauxMoyen(mix, taux, g);
        reservationsConstatees += reservations;
      }

      s.soirs += 1;
      s.surreservation += x;
      s.occupees += occupees;
      s.capacite += chambres;
      s.vides += vides;
      s.deloges += deloges;
      s.fidelesDeloges += fideles;
      s.remplies += Math.max(0, occupees - occupeesSans);
      s.margeRemplies += Math.max(0, occupees - occupeesSans) * (prix - CV);
      s.margeNuitees += margeSoir;
      s.coutDelogements += cout;
      s.margeDesVides += vides * (prix - CV);
    });

    // Ce que la semaine coûte en plus : un client perdu, un module, une enquête trop longue.
    let autres = 0;
    if (sarvelec && w === GARANTIE_DES) autres += SARVELEC.valeur;
    if ((chemin[D.novembre] ?? 0) === 3 && w === NOVEMBRE) autres += MODULE_HOSTEO.abonnement;
    if (w === 1) autres += Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
    if (sarvelec && w === GARANTIE_DES) valeurPerdue += SARVELEC.valeur;

    const marge = s.margeNuitees - s.coutDelogements - autres;
    margeCumul += marge;
    margeNuitees += s.margeNuitees;
    videsCumul += s.vides;
    delogesCumul += s.deloges;
    coutCumul += s.coutDelogements;
    occupeesCumul += s.occupees;
    capaciteCumul += s.capacite;
    remplies += s.remplies;
    margeRemplies += s.margeRemplies;
    const { margeDesVides, ...semaine } = s;
    semaines.push({
      ...semaine,
      surreservation: s.surreservation / Math.max(1, s.soirs),
      marge,
      coutParSoir: (margeDesVides + s.coutDelogements) / Math.max(1, s.soirs),
      margeCumul,
      videsCumul,
      delogesCumul,
      coutDelogementsCumul: coutCumul,
      occupeesCumul,
      capaciteCumul,
      to: occupeesCumul / Math.max(1, capaciteCumul),
    });
  }

  return {
    semaines,
    objectif: margeCumul,
    margeNuitees,
    encaisse,
    vides: videsCumul,
    deloges: delogesCumul,
    fidelesDeloges: fidelesCumul,
    fidelesPerdus,
    pertes,
    remplies,
    margeRemplies,
    coutDirect,
    valeurPerdue,
    soireesNoires,
    sarvelecParti: sarvelec,
    phiConstate,
    tauxConstate: reservationsConstatees ? defConstatees / reservationsConstatees : 0,
    tauxAttendu: reservationsConstatees ? defAttendues / reservationsConstatees : 0,
    to: occupeesCumul / Math.max(1, capaciteCumul),
  };
}

/** Ce qui s'est passé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const semaines = t.semaines.slice(de, a + 1) as Semaine[];
  return {
    sarvelec: t.sarvelecParti && dans(GARANTIE_DES),
    pertes: t.pertes.filter((p) => dans(p.semaine)),
    soireesNoires: t.soireesNoires.filter((n) => dans(n.semaine)),
    deloges: semaines.reduce((x, w) => x + w.deloges, 0),
    fidelesDeloges: semaines.reduce((x, w) => x + w.fidelesDeloges, 0),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

/* ---------------------------------------------------------------------------
 * LE TABLEAU DE BORD du revenue management.
 * ------------------------------------------------------------------------- */

/** La marge que chaque semaine apporterait, toutes chambres vendues : la cadence du budget. */
const MARGE_PLEINE_SEMAINE = Array.from({ length: SEMAINES + 1 }, (_, w) =>
  SOIRS.filter((x) => x.semaine === w).reduce(
    (t, x) => t + HOTELS[x.hotel].chambres * margeDUneNuitee(HOTELS[x.hotel], x.type),
    0,
  ),
);
/** La part du budget de marge acquise à la fin de chaque semaine. */
export const BUDGET_A_DATE = (() => {
  const total = MARGE_PLEINE_SEMAINE.reduce((t, x) => t + x, 0);
  let cumul = 0;
  return MARGE_PLEINE_SEMAINE.map((x) => {
    cumul += x;
    return (BUDGET * cumul) / total;
  });
})();

export interface LectureRevenue {
  marge: number | null;
  to: number | null;
  vides: number | null;
  deloges: number | null;
  couts: number | null;
  budgetADate: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  fideles: number | null;
  fidelesPerdus: number | null;
  remplies: number | null;
  margeRemplies: number | null;
  noires: number | null;
  sarvelec: number | null;
  tauxConstate: number | null;
  tauxAttendu: number | null;
  phi: number | null;
}

/**
 * Ce que Lucile lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureRevenue {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  if (semaine === 0) {
    return {
      marge: 0,
      to: null,
      vides: 0,
      deloges: 0,
      couts: 0,
      budgetADate: 0,
      fideles: 0,
      fidelesPerdus: 0,
      remplies: 0,
      margeRemplies: 0,
      noires: 0,
      sarvelec: 0,
      tauxConstate: null,
      tauxAttendu: null,
      phi: null,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const jusque = (t.semaines.slice(1, semaine + 1) as Semaine[]).reduce(
    (x, w) => ({
      fideles: x.fideles + w.fidelesDeloges,
      remplies: x.remplies + w.remplies,
      margeRemplies: x.margeRemplies + w.margeRemplies,
    }),
    { fideles: 0, remplies: 0, margeRemplies: 0 },
  );
  const novembre = semaine >= NOVEMBRE - 1;
  return {
    marge: s.margeCumul,
    to: s.to,
    vides: s.videsCumul,
    deloges: s.delogesCumul,
    couts: s.coutDelogementsCumul,
    budgetADate: BUDGET_A_DATE[semaine]!,
    ...jusque,
    fidelesPerdus: t.pertes.filter((p) => p.semaine <= semaine).length,
    noires: t.soireesNoires.filter((n) => n.semaine <= semaine).length,
    sarvelec: t.sarvelecParti && semaine >= GARANTIE_DES ? 1 : 0,
    tauxConstate: novembre ? t.tauxConstate : null,
    tauxAttendu: novembre ? t.tauxAttendu : null,
    phi: novembre ? t.phiConstate : null,
  };
}
