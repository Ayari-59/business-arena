/**
 * LA RÉNOVATION SANS FERMER — le modèle de L'Escale Chambéry-Gare.
 *
 * Un hôtel 3 étoiles de 72 chambres sur quatre étages de dix-huit, à deux pas
 * de la gare, plein en semaine de clients d'affaires de septembre à juin. Le
 * 4e étage a été refait il y a deux ans ; les trois autres (54 chambres)
 * doivent l'être avant la rentrée de septembre : salles de bains, sols,
 * peintures, literie. Le trimestre va de juin à août : juin est encore un mois
 * d'affaires (70 chambres occupées du lundi au jeudi), juillet et surtout août
 * sont le creux de la clientèle d'affaires, que remplacent en partie des
 * touristes de passage et des groupes, surtout le samedi.
 *
 * Quatre mécanismes font l'épisode, et la joueuse doit les découvrir :
 *
 *   · LA CHAMBRE FERMÉE NE COÛTE QUE LES NUITS OÙ L'HÔTEL AURAIT ÉTÉ PLEIN. Une
 *     nuit invendue est perdue pour toujours, mais fermer un étage ne fait
 *     perdre que les nuits où la demande dépasse les chambres restantes. En
 *     juin, du lundi au jeudi, chaque chambre fermée est une nuit perdue à
 *     98 € ; en août, hors samedis, l'hôtel n'aurait pas rempli les étages
 *     fermés. Regrouper le chantier dans le creux coûte peu de chiffre.
 *   · LES NUISANCES COÛTENT PLUS QUE LES CHAMBRES FERMÉES. Chaque client logé
 *     au-dessus, au-dessous ou à côté du chantier est exposé : la chambre se
 *     vend moins cher (tarif « travaux », −15 %), il se plaint et obtient un
 *     geste, il note mal sur Bookalia et Voyagio, et s'il voyage pour son
 *     entreprise, son entreprise s'en souvient à la rentrée. Garder tout
 *     l'hôtel ouvert avec des lots de chambres en travaux sur tous les étages,
 *     « pour ne perdre aucune nuit », expose presque tout le monde pendant
 *     treize semaines, juin compris. On isole les clients en logeant d'abord
 *     les clients d'affaires loin du chantier, ce qui n'est possible que s'il
 *     reste de la place ailleurs : dans le creux, pas en juin. On prévient et
 *     on compense avant la plainte : un client prévenu, avec un petit geste
 *     prévu d'avance, se plaint trois fois moins et note mieux qu'un client
 *     surpris qu'on rembourse.
 *   · LE CHANTIER PREND DU RETARD, SURTOUT MORCELÉ. L'entreprise tire un retard
 *     au hasard, plus grand en site occupé (lots de six chambres, protections
 *     à refaire, travaux arrêtés à chaque plainte) que sur un étage fermé, et
 *     plus petit quand l'hôtel est fermé. Un retard qui déborde en septembre
 *     coûte cher : chambres fermées au plus fort de la clientèle d'affaires,
 *     clients délogés, ingénieurs de Cimalp exposés au bruit.
 *   · LE RETARD SE VOIT TARD, ET SE RATTRAPE TÔT. En semaine 8, le retard
 *     apparaît. Les comptes rendus de l'entreprise n'en montrent qu'une part ;
 *     un pointage chambre par chambre le montre entier. Rattraper (une équipe
 *     de renfort, les samedis) se dimensionne sur le retard VU : sans
 *     pointage, on n'en rattrape qu'une partie. Maintenir le plan en comptant
 *     sur l'entreprise laisse le retard grossir ; décaler la fin en septembre
 *     l'accepte, mais évite au moins de déloger des clients.
 *
 * Le trimestre est jugé en euros : le chiffre d'affaires hébergement de juin à
 * août, MOINS les gestes commerciaux, les pénalités (clients délogés) et le
 * surcoût de chantier (protections, équipes et samedis de renfort, pointage,
 * immobilisation des équipes), PLUS l'effet attendu sur la clientèle
 * d'affaires de la rentrée, recalculé en semaine 13 avec ce que le trimestre
 * a révélé : le chiffre perdu en septembre si le chantier y déborde, la note
 * des plateformes en fin d'été, l'usure des comptes d'affaires exposés au
 * bruit, et la décision de Cimalp Ingénierie, le premier compte de l'hôtel,
 * de renouveler ou non son contrat d'automne. Cet effet est presque toujours
 * négatif : un chantier sans aucune nuisance n'existe pas.
 *
 * Le hasard : la demande de chaque semaine, un scénario d'été (fort, normal ou
 * creux, une chance sur quatre, deux, une), le retard de l'entreprise, la
 * disponibilité d'une équipe de renfort en août, la réponse de Cimalp, un avis
 * qui fait le tour des plateformes, et un ou deux imprévus.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CHAMBRES = 72;
/** Chambres par étage ; trois étages à rénover, le 4e l'est déjà. */
export const ETAGE = 18;
export const A_RENOVER = 54;
export const NOTE_DEPART = 8.4;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, l'entreprise facture l'immobilisation des équipes réservées. */
export const PERTE_PAR_JOUR = 1500;

export type Mois = "juin" | "juillet" | "aout" | "septembre";
/** Juin : semaines 1 à 4 ; juillet : 5 à 9 ; août : 10 à 13. */
export const mois = (w: number): Mois =>
  w <= 4 ? "juin" : w <= 9 ? "juillet" : w <= 13 ? "aout" : "septembre";

/**
 * LES PRÉVISIONS DE RÉSERVATIONS, nuit par nuit, du dimanche au samedi : les
 * chambres que l'hôtel vendrait s'il avait toutes ses chambres, en été normal.
 */
export const PROFILS: Record<Mois, readonly number[]> = {
  juin: [52, 68, 70, 70, 66, 44, 50],
  juillet: [44, 50, 52, 52, 50, 54, 62],
  aout: [36, 40, 42, 42, 40, 50, 60],
  septembre: [56, 70, 72, 72, 68, 46, 54],
};
/** Le prix moyen prévu de chaque mois, en euros, petit-déjeuner non compris. */
export const PRIX: Record<Mois, number> = { juin: 98, juillet: 90, aout: 86, septembre: 102 };
/** La part des clients qui voyagent pour leur entreprise. */
export const PART_AFFAIRES: Record<Mois, number> = {
  juin: 0.65,
  juillet: 0.35,
  aout: 0.15,
  septembre: 0.7,
};
/** Le tarif « travaux » des chambres voisines du chantier. */
export const REMISE_VOISINES = 0.15;

/** Les nuits qu'un mois-type ferait perdre par semaine si l'hôtel n'avait que `capacite` chambres. */
export const nuitsPerdues = (m: Mois, capacite: number) =>
  PROFILS[m].reduce((t, n) => t + Math.max(0, n - capacite), 0);

/** Le chiffre d'affaires hébergement perdu en fermant deux étages pendant les quatre semaines d'août. */
export const PERTE_DEUX_ETAGES_AOUT = 4 * nuitsPerdues("aout", CHAMBRES - 2 * ETAGE) * PRIX.aout;

/** Le chiffre d'affaires hébergement d'une semaine sans travaux, en été normal. */
export const caSansTravaux = (m: Mois) =>
  PROFILS[m].reduce((t, n) => t + Math.min(CHAMBRES, n), 0) * PRIX[m];
/** Le budget du trimestre, sans travaux : ce que l'hôtel aurait fait en été normal. */
export const BUDGET = Array.from({ length: SEMAINES }, (_, i) => caSansTravaux(mois(i + 1))).reduce(
  (t, x) => t + x,
  0,
);

/** Le scénario d'été : il joue sur les touristes et les groupes de juillet et d'août. */
export const SCENARIOS = [
  { id: "fort", nom: "un été fort", facteur: 1.08, chance: 0.25 },
  { id: "normal", nom: "un été normal", facteur: 1, chance: 0.5 },
  { id: "creux", nom: "un été creux", facteur: 0.92, chance: 0.25 },
] as const;

/**
 * CIMALP INGÉNIERIE, le premier compte d'affaires de l'hôtel : ses ingénieurs
 * suivent les chantiers ferroviaires de la Maurienne. Son contrat d'automne
 * (septembre à décembre) se renouvelle chaque année en septembre.
 */
export const CIMALP = {
  /** Nuitées de septembre à décembre, au tarif négocié. */
  nuitees: 480,
  prix: 92,
  /** La part de ces nuits que l'hôtel revendrait à d'autres clients s'il perdait Cimalp. */
  revente: 0.4,
  /** Nuitées par semaine pendant le trimestre : juin, juillet, août. */
  parSemaine: { juin: 12, juillet: 8, aout: 2, septembre: 14 } as Record<Mois, number>,
} as const;
/** Ce que perdre le contrat d'automne de Cimalp coûte, nuits revendues déduites. */
export const PERTE_CIMALP = Math.round(CIMALP.nuitees * CIMALP.prix * (1 - CIMALP.revente));

/** Les gestes et les pénalités. */
export const GESTES = {
  /** Ce qu'une plainte coûte en moyenne : près d'une demi-nuit remboursée. */
  plainte: 40,
  /** Le geste prévu d'avance : le petit-déjeuner offert à chaque chambre exposée, à son coût de revient. */
  petitDejeuner: 4,
  /** Reloger un client déjà réservé dans un autre hôtel : la différence de prix et le taxi. */
  delogement: 75,
  /** La part des nuits perdues de septembre déjà réservées, donc à déloger si rien n'est fermé à temps. */
  dejaReserve: 0.6,
} as const;
/** Ce que coûte à la rentrée un point de note perdu sur les plateformes, en euros. */
export const COUT_DU_POINT = 25000;
/** Ce que coûte à la rentrée une nuit d'affaires exposée au chantier : les comptes qui réduisent leurs réservations. */
export const USURE_AFFAIRES = 10;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */

/** Les décisions, par leur place dans le chemin. */
export const D = {
  phasage: 0,
  clients: 1,
  occupation: 2,
  suivi: 3,
  retard: 4,
  cimalp: 5,
} as const;

/** Les options de chaque décision. */
export const O = {
  phasage: { lots: 0, etageParEtage: 1, creux: 2, fermer: 3 },
  clients: { rien: 0, prevenir: 1, annoncer: 2, baisser: 3 },
  occupation: { habitude: 0, plan: 1, tarif: 2, protections: 3 },
  suivi: { comptesRendus: 0, pointage: 1, tournee: 2, penalites: 3 },
  retard: { maintenir: 0, rattraper: 1, decaler: 2, cadence: 3 },
  cimalp: { remise: 0, visite: 1, ormea: 2, attendre: 3 },
} as const;

/** Ne rien changer, décision par décision : le planning de l'entreprise, rien d'annoncé, Hostéo comme d'habitude. */
export const NEUTRE = [0, 0, 0, 0, 0, 3] as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 9, 11] as const;

/**
 * LES PHASES DE CHAQUE PHASAGE, en semaines prévues : de `de` à `a` exclu.
 * `fermees` : chambres retirées de la vente ; `loin` : chambres ouvertes qui ne
 * sont ni à côté, ni au-dessus, ni au-dessous du chantier ; `intensite` : ce
 * que les voisins entendent (des lots en site occupé s'entendent aussi du
 * couloir).
 */
export interface Phase {
  de: number;
  a: number;
  chambres: number;
  fermees: number;
  loin: number;
  intensite: number;
}

export interface Phasage {
  phases: readonly Phase[];
  /** Le facteur du retard de l'entreprise : morcelé, il grossit. */
  retard: number;
  /** Le surcoût de chantier propre au phasage, en euros. */
  surcout: number;
}

export const PHASAGES: readonly Phasage[] = [
  // Tout ouvert : des lots de six chambres en rotation sur les trois étages, une équipe.
  {
    phases: [{ de: 2, a: 14, chambres: 54, fermees: 6, loin: 24, intensite: 1.1 }],
    retard: 1.4,
    surcout: 9000,
  },
  // Un étage fermé à la fois, une équipe : le 1er, le 2e, puis le 3e.
  {
    phases: [
      { de: 2, a: 5, chambres: 18, fermees: 18, loin: 36, intensite: 1 },
      { de: 5, a: 8, chambres: 18, fermees: 18, loin: 18, intensite: 1 },
      { de: 8, a: 11, chambres: 18, fermees: 18, loin: 18, intensite: 1 },
    ],
    retard: 1,
    surcout: 2000,
  },
  // Dans le creux : le 3e étage de mi-juillet au 2 août, puis le 1er et le 2e ensemble en août.
  {
    phases: [
      { de: 7, a: 10, chambres: 18, fermees: 18, loin: 18, intensite: 1 },
      { de: 10, a: 13, chambres: 36, fermees: 36, loin: 18, intensite: 1 },
    ],
    retard: 0.9,
    surcout: 6000,
  },
  // L'hôtel fermé trois semaines en août, trois équipes.
  {
    phases: [{ de: 10, a: 13, chambres: 54, fermees: 72, loin: 0, intensite: 0 }],
    retard: 0.5,
    surcout: 15000,
  },
];

export const debutDuChantier = (p: Phasage) => p.phases[0]!.de;
export const finPrevue = (p: Phasage) => p.phases.at(-1)!.a;

/** Ce que le plan d'occupation, les protections et la cadence changent au bruit et au rythme. */
export const OCCUPATION = {
  /** Travaux bruyants entre 9 h 30 et 17 h, quand les clients sont sortis : le bruit perçu baisse, l'entreprise avance moins vite. */
  horaires: { bruit: 0.65, retard: 0.3 },
  /** Portes acoustiques et joints sur les étages voisins. */
  protections: { bruit: 0.75, cout: 8000 },
} as const;

/** Le suivi du chantier : la part du retard que la directrice voit en semaine 8. */
export const SUIVI = [
  { vu: 0.3, cout: 0, retard: 1 },
  { vu: 1, cout: 1500, retard: 1 },
  { vu: 0.55, cout: 0, retard: 1 },
  { vu: 0.3, cout: 2500, retard: 0.85 },
] as const;

/** Le rattrapage : une équipe de renfort et les samedis, ou les samedis seuls si personne n'est libre. */
export const RATTRAPAGE = {
  mobilisation: 1500,
  /** Par semaine de retard rattrapée. */
  renfort: 5000,
  samedis: 3000,
  /** La chance qu'une équipe soit libre en août, quand le bâtiment est en congés. */
  chanceRenfort: 0.55,
  /** Ce que les samedis seuls rattrapent du retard vu. */
  partSamedis: 0.3,
  /** Ce qu'un retard laissé à lui-même gagne encore d'ici la fin. */
  derive: 1.25,
  /** La cadence forcée (bruit dès 7 h 30, samedis compris) : ce qu'elle rattrape par semaine restante. */
  cadence: 0.5,
  coutCadence: 3000,
  bruitCadence: 1.7,
} as const;

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
  effet: { demande?: number; affaires?: number; plaintes?: number; note?: number; retard?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "greve",
    titre: "Grève des contrôleurs",
    de: "Réception",
    role: "L'Escale Chambéry-Gare",
    texte:
      "Grève des contrôleurs sur les lignes de Lyon et de Paris : les clients d'affaires annulent par dizaines, la gare est vide.",
    duree: 1,
    effet: { affaires: 0.7 },
  },
  {
    id: "congres",
    titre: "Un congrès au parc des expositions",
    de: "Revenue management",
    role: "Siège, Annecy",
    texte:
      "Un congrès médical de 1 500 personnes au parc des expositions de Chambéry : tous les hôtels de la ville sont pleins, la demande monte de 15 % sur la semaine.",
    duree: 1,
    effet: { demande: 1.15 },
  },
  {
    id: "canicule",
    titre: "Canicule",
    de: "Réception",
    role: "L'Escale Chambéry-Gare",
    texte:
      "Canicule sur la Savoie : les clients dorment fenêtres ouvertes, le bruit du chantier porte plus loin et les plaintes montent.",
    duree: 2,
    effet: { plaintes: 1.4 },
  },
  {
    id: "ascenseur",
    titre: "Panne de l'ascenseur",
    de: "Maintenance",
    role: "L'Escale Chambéry-Gare",
    texte:
      "L'ascenseur est en panne trois jours, en attente d'une pièce : valises dans l'escalier, clients mécontents, avis en ligne.",
    duree: 1,
    effet: { note: 0.12 },
  },
  {
    id: "receveurs",
    titre: "Livraison des receveurs de douche en retard",
    de: "Mérandaz Second Œuvre",
    role: "Entreprise de travaux",
    texte:
      "Le fabricant des receveurs de douche livre avec deux semaines de retard une partie de la commande : l'entreprise réorganise, et perd quelques jours.",
    duree: 1,
    effet: { retard: 0.4 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit de la demande, semaine par semaine ; l'indice 0 n'est pas utilisé. */
  demande: readonly number[];
  scenario: number;
  /** Le retard de base de l'entreprise, en semaines, avant le phasage. */
  retard: number;
  /** Une équipe de renfort est-elle libre en août ? */
  uRenfort: number;
  /** Cimalp renouvelle-t-il son contrat d'automne ? */
  uCimalp: number;
  /** L'avis d'un client exposé fait-il le tour des plateformes ? */
  uAvis: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000589 + 7);
  const demande = [Math.min(1.1, Math.max(0.9, 1 + 0.04 * gauss(r)))];
  for (let i = 1; i <= SEMAINES; i += 1) {
    demande.push(Math.min(1.1, Math.max(0.9, 1 + 0.04 * gauss(r))));
  }
  const u = r();
  const scenario =
    u < SCENARIOS[0].chance ? 0 : u < SCENARIOS[0].chance + SCENARIOS[1].chance ? 1 : 2;
  // Le retard de base : nul une fois sur huit, moins d'une semaine une fois sur deux, plus de
  // deux semaines une fois sur quatre. Le phasage le grossit ou le réduit.
  const ur = r();
  const retard = Math.min(3.5, Math.max(0, -1.6 * Math.log(1 - ur) - 0.2));
  const uRenfort = r();
  const uCimalp = r();
  const uAvis = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { demande, scenario, retard, uRenfort, uCimalp, uAvis, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Une équipe de renfort est libre en août une fois sur deux, à peine plus. */
export const renfortDisponible = (graine: number) =>
  hasard(graine).uRenfort < RATTRAPAGE.chanceRenfort;

/* ---------------------------------------------------------------------------
 * LE RETARD ET L'AVANCEMENT.
 * ------------------------------------------------------------------------- */

/** Le retard que l'entreprise prendra si rien n'est fait, en semaines. */
export function retardBrut(chemin: readonly number[], graine: number): number {
  const h = hasard(graine);
  const p = PHASAGES[chemin[D.phasage]!]!;
  let r = Math.min(3, h.retard * p.retard) * SUIVI[chemin[D.suivi]!]!.retard;
  if (chemin[D.occupation] === O.occupation.plan) r += OCCUPATION.horaires.retard;
  // Un imprévu de chantier ne retarde que si le chantier est en cours cette semaine-là.
  for (const i of h.imprevus) {
    const t = i.imprevu.effet.retard;
    if (t && i.semaine >= debutDuChantier(p) && i.semaine < finPrevue(p)) r += t;
  }
  return r;
}

/** Le retard que la directrice voit en semaine 8, selon la façon dont elle suit le chantier. */
export const retardVu = (chemin: readonly number[], graine: number) =>
  retardBrut(chemin, graine) * SUIVI[chemin[D.suivi]!]!.vu;

/** Le retard final, en semaines, après la décision de la semaine 8, et ce que le rattrapage coûte. */
export function retardFinal(
  chemin: readonly number[],
  graine: number,
): { retard: number; cout: number; renfort: boolean | null } {
  const brut = retardBrut(chemin, graine);
  const vu = retardVu(chemin, graine);
  const p = PHASAGES[chemin[D.phasage]!]!;
  switch (chemin[D.retard]) {
    case O.retard.rattraper: {
      const renfort = renfortDisponible(graine);
      const recupere = renfort ? vu : vu * RATTRAPAGE.partSamedis;
      // Ce qui n'a pas été vu continue de grossir.
      return {
        retard: Math.max(0, vu - recupere) + (brut - vu) * RATTRAPAGE.derive,
        cout:
          RATTRAPAGE.mobilisation + recupere * (renfort ? RATTRAPAGE.renfort : RATTRAPAGE.samedis),
        renfort,
      };
    }
    case O.retard.decaler:
      return { retard: brut, cout: 0, renfort: null };
    case O.retard.cadence: {
      const restantes = Math.max(0, finPrevue(p) - Math.max(9, debutDuChantier(p)));
      const recupere = Math.min(brut, RATTRAPAGE.cadence * restantes);
      return {
        retard: brut - recupere,
        cout: RATTRAPAGE.coutCadence + restantes * 600,
        renfort: null,
      };
    }
    default:
      return { retard: brut * RATTRAPAGE.derive, cout: 0, renfort: null };
  }
}

/**
 * L'AVANCEMENT, en « semaines de planning » : `tau[w]` est l'avancement au
 * début de la semaine w. Avant la semaine 9, le chantier avance au rythme que
 * le retard brut lui impose ; à partir de la semaine 9, au rythme que la
 * décision de la semaine 8 lui donne. Le retard ne compresse jamais le reste
 * du chantier de plus de 40 %.
 */
export function avancement(chemin: readonly number[], graine: number) {
  const p = PHASAGES[chemin[D.phasage]!]!;
  const s0 = debutDuChantier(p);
  const fin = finPrevue(p);
  const L = fin - s0;
  const brut = retardBrut(chemin, graine);
  const final = retardFinal(chemin, graine);
  // Un chantier qui démarre après la décision de la semaine 8 se joue tout entier au rythme d'après.
  if (s0 >= 9) {
    const k = Math.max(0.6, (L + final.retard) / L);
    const libre = (w: number) => (w <= s0 ? w : s0 + (w - s0) / k);
    return { tau: (w: number) => Math.min(fin, libre(w)), libre, fin: s0 + L * k, final, brut };
  }
  const kAvant = (L + brut) / L;
  const tau9 = s0 + (9 - s0) / kAvant;
  const accumule = 9 - tau9;
  const restePrevu = fin - tau9;
  const resteReel = Math.max(0.6 * restePrevu, restePrevu + final.retard - accumule);
  const kApres = resteReel / restePrevu;
  const libre = (w: number) => {
    if (w <= s0) return w;
    if (w <= 9) return s0 + (w - s0) / kAvant;
    return tau9 + (w - 9) / kApres;
  };
  return { tau: (w: number) => Math.min(fin, libre(w)), libre, fin: 9 + resteReel, final, brut };
}

/** Les chambres rénovées livrées au début de la semaine w : un étage à la fois, ou au fil des lots. */
export function livrees(chemin: readonly number[], graine: number, w: number): number {
  const p = PHASAGES[chemin[D.phasage]!]!;
  const t = avancement(chemin, graine).tau(w);
  return p.phases.reduce((n, ph) => {
    if (t >= ph.a - 1e-9) return n + ph.chambres;
    // Les lots se livrent au fil de l'eau ; un étage fermé, quand il est fini.
    if (p.phases.length === 1 && ph.fermees < ph.chambres && t > ph.de) {
      return n + Math.floor((ph.chambres * (t - ph.de)) / (ph.a - ph.de));
    }
    return n;
  }, 0);
}

/** Les chambres livrées que le planning prévoyait au début de la semaine w. */
export function livreesPrevues(phasage: number, w: number): number {
  const p = PHASAGES[phasage]!;
  return p.phases.reduce((n, ph) => {
    if (w >= ph.a) return n + ph.chambres;
    if (p.phases.length === 1 && ph.fermees < ph.chambres && w > ph.de) {
      return n + Math.floor((ph.chambres * (w - ph.de)) / (ph.a - ph.de));
    }
    return n;
  }, 0);
}

/* ---------------------------------------------------------------------------
 * UNE SEMAINE D'HÔTEL.
 * ------------------------------------------------------------------------- */

/** Ce que les clients vivent d'un chantier : la part de la semaine, les chambres fermées, les voisins. */
interface Configuration {
  /** Les phases en cours cette semaine, et la part de la semaine qu'elles occupent. */
  parts: readonly { phase: Phase; part: number }[];
}

function configuration(chemin: readonly number[], graine: number, w: number): Configuration {
  const p = PHASAGES[chemin[D.phasage]!]!;
  const av = avancement(chemin, graine);
  // Une semaine où le planning avance de t0 à t1 : chaque phase en prend sa part, et la fin du
  // chantier en milieu de semaine rend le reste de la semaine aux clients.
  const t0 = av.libre(w);
  const t1 = av.libre(w + 1);
  const parts = p.phases.flatMap((ph) => {
    const recouvre = Math.max(0, Math.min(t1, ph.a) - Math.max(t0, ph.de));
    return recouvre > 0 ? [{ phase: ph, part: recouvre / (t1 - t0) }] : [];
  });
  return { parts };
}

/** Le résultat d'une nuit-type de la semaine, sous une phase de chantier (ou aucune). */
interface Nuit {
  vendues: number;
  /** Chambres vendues voisines du chantier. */
  exposees: number;
  exposeesAffaires: number;
  affaires: number;
}

/**
 * UNE NUIT : on vend jusqu'à la capacité ouverte. Le plan d'occupation loge
 * d'abord les clients d'affaires, puis les autres, loin du chantier, et ne
 * vend les chambres voisines qu'en dernier : il n'isole que s'il reste de la
 * place loin du chantier. Sinon, Hostéo répartit les clients sur tous les
 * étages ouverts, et chacun a la même chance d'être voisin.
 */
function nuit(demande: number, partAffaires: number, phase: Phase | null, plan: boolean): Nuit {
  const ouvertes = CHAMBRES - (phase?.fermees ?? 0);
  const vendues = Math.min(ouvertes, demande);
  const affaires = vendues * partAffaires;
  if (!phase || ouvertes <= 0) return { vendues, exposees: 0, exposeesAffaires: 0, affaires };
  if (plan) {
    return {
      vendues,
      exposees: Math.max(0, vendues - phase.loin),
      exposeesAffaires: Math.max(0, affaires - phase.loin),
      affaires,
    };
  }
  const voisins = (ouvertes - phase.loin) / ouvertes;
  return { vendues, exposees: vendues * voisins, exposeesAffaires: affaires * voisins, affaires };
}

export type Semaine = {
  /** Nuitées vendues dans la semaine. */
  nuitees: number;
  /** Chiffre d'affaires hébergement de la semaine, en euros. */
  ca: number;
  /** Chiffre d'affaires hébergement cumulé. */
  caCumule: number;
  to: number;
  revpar: number;
  /** Nuitées vendues voisines du chantier. */
  exposees: number;
  exposeesAffaires: number;
  /** La gêne de la semaine, rapportée aux nuitées : 0, personne ; 1, tout le monde. */
  gene: number;
  note: number;
  gestes: number;
  plaintes: number;
  /** Gestes, pénalités et surcoûts de chantier cumulés. */
  couts: number;
  /** Chambres rénovées livrées en fin de semaine. */
  livrees: number;
  livreesPrevues: number;
  fermees: number;
  /** La part des nuits des ingénieurs de Cimalp passées à côté du chantier depuis juin. */
  cimalpExposes: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Le chiffre d'affaires du trimestre moins gestes, pénalités et surcoût, plus l'effet attendu de la rentrée. */
  objectif: number;
  ca: number;
  gestes: number;
  penalites: number;
  surcout: number;
  /** L'effet attendu sur la rentrée : septembre perdu, note, comptes usés, Cimalp. */
  rentree: number;
  caSeptembre: number;
  effetNote: number;
  usure: number;
  scenario: number;
  /** Le retard final, en semaines, et la fin réelle du chantier (le début de la semaine où il s'achève). */
  retard: number;
  retardBrut: number;
  retardVu: number;
  finChantier: number;
  /** Les semaines de chantier qui débordent sur septembre. */
  debord: number;
  renfort: boolean | null;
  avisViral: boolean;
  /** La chance que Cimalp ne renouvelle pas, et ce qu'il a fait. */
  risqueCimalp: number;
  expositionCimalp: number;
  cimalpPart: boolean;
  noteFinale: number;
  /** La part des nuitées du trimestre vendues voisines du chantier. */
  partExposee: number;
  nuitsAffairesExposees: number;
  plaintes: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** La surprise des clients : un client prévenu se plaint moins et note mieux. */
export const SURPRISE = [1, 0.3, 0.6, 0.9] as const;
/** La part des nuits gênées qui finissent en plainte à la réception. */
export const PLAINTES = [0.12, 0.03, 0.09, 0.11] as const;
/** Un client qui découvre le chantier sans avoir été prévenu peut exiger d'être relogé ailleurs. */
export const RELOGES_SANS_ANNONCE = 0.04;
/** Le tarif « travaux » affiché : −25 % sur les chambres voisines, qui rend le bruit plus acceptable. */
export const TARIF = { remise: 0.25, plaintes: 0.6, gene: 0.75, demande: 1.02 } as const;
/** La gêne de fond d'un chantier pour tous les clients : poussière, ascenseur, entrée. */
export const GENE_DIFFUSE = 0.08;

/** La semaine de l'avis qui fait le tour des plateformes, s'il part. */
export const SEMAINE_AVIS = 5;

/** La chance que l'avis d'un client exposé en juin fasse le tour des plateformes. */
export const chanceDAvis = (geneJuin: number) => borne(2.2 * geneJuin, 0, 0.6);

/**
 * CIMALP RENOUVELLE-T-IL ? Son acheteuse lit ce que ses ingénieurs ont vécu :
 * la part de leurs nuits passées à côté du chantier, ce qu'on leur avait dit
 * avant, le chantier qui déborde sur la rentrée, et ce qu'on lui propose en
 * semaine 10.
 */
export function risqueCimalp(
  chemin: readonly number[],
  expositionCimalp: number,
  debord: number,
): number {
  let r = 0.25 + 0.9 * expositionCimalp;
  const deborde = debord > 0.15;
  if (deborde) r += chemin[D.retard] === O.retard.decaler ? 0.15 : 0.3;
  if (chemin[D.clients] === O.clients.prevenir) r -= 0.08;
  switch (chemin[D.cimalp]) {
    case O.cimalp.remise:
      r -= 0.06;
      break;
    case O.cimalp.visite:
      r -= deborde ? 0 : 0.18;
      break;
    case O.cimalp.ormea:
      r -= deborde ? 0.35 : 0;
      break;
    default:
      r += 0.05;
  }
  return borne(r, 0.01, 0.85);
}

/** La remise de 10 % sur le contrat d'automne de Cimalp. */
export const REMISE_CIMALP = Math.round(0.1 * CIMALP.nuitees * CIMALP.prix);
/** Loger les ingénieurs de Cimalp à l'Orméa tant que le chantier dure : la réservation, puis la différence de prix. */
export const ORMEA = { fixe: 1000, parSemaine: 1700 } as const;

/** Ce que les décisions déjà prises font à une semaine. */
interface Regime {
  /** Le chantier a été annoncé aux clients (et comment). */
  annonce: number;
  occupation: number;
  /** La cadence forcée : bruit dès 7 h 30 et le samedi. */
  cadence: boolean;
}

const regime = (chemin: readonly number[], w: number): Regime => ({
  annonce: w >= EFFET[D.clients] ? chemin[D.clients]! : O.clients.rien,
  occupation: w >= EFFET[D.occupation] ? chemin[D.occupation]! : O.occupation.habitude,
  cadence: w >= EFFET[D.retard] && chemin[D.retard] === O.retard.cadence,
});

/** Le bruit que les voisins du chantier perçoivent, selon les horaires, les protections et la cadence. */
function bruitPercu(r: Regime): number {
  let b = 1;
  if (r.occupation === O.occupation.plan) b *= OCCUPATION.horaires.bruit;
  if (r.occupation === O.occupation.protections) b *= OCCUPATION.protections.bruit;
  if (r.cadence)
    b = RATTRAPAGE.bruitCadence * (r.occupation === O.occupation.protections ? 0.75 : 1);
  return b;
}

/**
 * UNE SEMAINE D'HÔTEL sous un chantier : ce qui se vend, à quel prix, qui est
 * exposé, ce que la gêne coûte en plaintes et en gestes.
 */
function uneSemaine(
  m: Mois,
  phases: readonly { phase: Phase | null; part: number }[],
  facteur: number,
  partAffaires: number,
  r: Regime,
  plaintesEnPlus = 1,
) {
  const plan = r.occupation === O.occupation.plan;
  const tarif = r.occupation === O.occupation.tarif;
  const bruit = bruitPercu(r);
  let vendues = 0;
  let exposees = 0;
  let exposeesAff = 0;
  let affaires = 0;
  let geneNuits = 0;
  let fermees = 0;
  for (const { phase, part } of phases) {
    for (const base of PROFILS[m]) {
      const n = nuit(
        base * facteur * (phase && tarif ? TARIF.demande : 1),
        partAffaires,
        phase,
        plan,
      );
      vendues += part * n.vendues;
      exposees += part * n.exposees;
      exposeesAff += part * n.exposeesAffaires;
      affaires += part * n.affaires;
      if (phase) {
        // Les clients d'affaires sont là tôt le matin et le soir, et travaillent dans leur chambre.
        const voisins = n.exposees + 0.3 * n.exposeesAffaires;
        const diffus = GENE_DIFFUSE * n.vendues * (r.cadence ? 2.5 : 1);
        geneNuits += part * (phase.intensite * bruit * voisins * (tarif ? TARIF.gene : 1) + diffus);
      }
    }
    if (phase) fermees += part * phase.fermees;
  }
  geneNuits *= plaintesEnPlus;
  const remise = tarif ? TARIF.remise : REMISE_VOISINES;
  const ca = PRIX[m] * (vendues - remise * exposees);
  const plaintes = geneNuits * PLAINTES[r.annonce]! * (tarif ? TARIF.plaintes : 1);
  let gestes = plaintes * GESTES.plainte;
  if (r.annonce === O.clients.prevenir) gestes += GESTES.petitDejeuner * exposees;
  const sansAnnonce = r.annonce === O.clients.rien || r.annonce === O.clients.baisser;
  const reloges = sansAnnonce ? RELOGES_SANS_ANNONCE * exposees : 0;
  const gene = vendues > 0 ? (geneNuits * SURPRISE[r.annonce]!) / vendues : 0;
  return {
    vendues,
    exposees,
    exposeesAff,
    affaires,
    geneNuits,
    gene,
    ca,
    plaintes,
    gestes,
    reloges,
    fermees,
    bruit,
  };
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const p = PHASAGES[chemin[D.phasage]!]!;
  const av = avancement(chemin, graine);
  const final = av.final;
  const facteurEte = SCENARIOS[h.scenario]!.facteur;

  /** Le surcoût engagé à la fin de la semaine w : le phasage d'abord, le suivi, puis le rattrapage. */
  const surcoutA = (w: number) => {
    let c = p.surcout + Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
    if (w >= EFFET[D.occupation] && chemin[D.occupation] === O.occupation.protections) {
      c += OCCUPATION.protections.cout;
    }
    if (w >= EFFET[D.suivi]) c += SUIVI[chemin[D.suivi]!]!.cout;
    if (w >= EFFET[D.retard]) c += final.cout;
    return c;
  };

  const semaines: (Semaine | null)[] = [null];
  let caCumule = 0;
  let gestes = 0;
  let penalites = 0;
  let note = NOTE_DEPART;
  let plaintes = 0;
  let nuitees = 0;
  let exposeesTotal = 0;
  let affairesExposees = 0;
  let geneJuin = 0;
  let expoCimalp = 0;
  let nuitsCimalp = 0;
  let avisViral = false;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const m = mois(w);
    const r = regime(chemin, w);
    const conf = configuration(chemin, graine, w);
    const enChantier = conf.parts.length > 0;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const partAff = PART_AFFAIRES[m];
    const loisirs = 1 - partAff;

    // La demande : le profil du mois, l'été pour les touristes, la note sur les plateformes.
    let facteur = h.demande[w]!;
    if (m === "juillet" || m === "aout") facteur *= 1 + (facteurEte - 1) * loisirs;
    facteur *= 1 - 0.05 * loisirs * Math.max(0, NOTE_DEPART - note);
    if (enChantier && (r.annonce === O.clients.prevenir || r.annonce === O.clients.annoncer)) {
      facteur *= 1 - 0.04 * loisirs;
    }
    if (enChantier && r.annonce === O.clients.baisser) facteur *= 1.03;
    // Une grève vide la gare : les clients d'affaires manquent, pas les touristes.
    let affaires = 1;
    let plaintesEnPlus = 1;
    for (const a of actifs) {
      facteur *= a.imprevu.effet.demande ?? 1;
      affaires *= a.imprevu.effet.affaires ?? 1;
      plaintesEnPlus *= a.imprevu.effet.plaintes ?? 1;
    }
    const partSemaine = (partAff * affaires) / (partAff * affaires + loisirs);
    facteur *= partAff * affaires + loisirs;

    const phases: { phase: Phase | null; part: number }[] = [...conf.parts];
    const reste = 1 - phases.reduce((t, x) => t + x.part, 0);
    if (reste > 1e-9) phases.push({ phase: null, part: reste });
    const s = uneSemaine(m, phases, facteur, partSemaine, r, plaintesEnPlus);
    let ca = s.ca;
    if (enChantier && r.annonce === O.clients.baisser) ca *= 0.9;
    let gestesSemaine = s.gestes;
    for (const a of actifs) if (a.imprevu.effet.note) gestesSemaine += 600;
    penalites += s.reloges * GESTES.delogement;

    // La note des plateformes suit les avis de la semaine, avec retard.
    note += 0.3 * (NOTE_DEPART - 1.3 * s.gene - note);
    for (const a of actifs) note -= a.imprevu.effet.note ?? 0;
    if (w >= 2 && w <= 4) geneJuin += s.gene / 3;
    if (w === SEMAINE_AVIS && h.uAvis < chanceDAvis(geneJuin)) {
      avisViral = true;
      note -= 0.25;
    }
    note = borne(note, 6, NOTE_DEPART);

    // Les ingénieurs de Cimalp : la part de leurs nuits passées à côté du chantier.
    const nCimalp = CIMALP.parSemaine[m];
    if (s.affaires > 0) {
      const intensite = conf.parts.reduce((t, x) => t + x.part * x.phase.intensite, 0);
      const surpris = SURPRISE[r.annonce]!;
      expoCimalp +=
        nCimalp *
        (s.exposeesAff / s.affaires) *
        Math.min(1.3, intensite * s.bruit) *
        (0.5 + 0.5 * surpris);
    }
    nuitsCimalp += nCimalp;

    caCumule += ca;
    gestes += gestesSemaine;
    plaintes += s.plaintes;
    nuitees += s.vendues;
    exposeesTotal += s.exposees;
    affairesExposees += s.exposeesAff;
    semaines.push({
      nuitees: s.vendues,
      ca,
      caCumule,
      to: s.vendues / (CHAMBRES * 7),
      revpar: ca / (CHAMBRES * 7),
      exposees: s.exposees,
      exposeesAffaires: s.exposeesAff,
      gene: s.gene,
      note,
      gestes: gestesSemaine,
      plaintes: s.plaintes,
      couts: gestes + penalites + surcoutA(w),
      livrees: livrees(chemin, graine, w + 1),
      livreesPrevues: livreesPrevues(chemin[D.phasage]!, w + 1),
      fermees: s.fermees,
      cimalpExposes: nuitsCimalp > 0 ? expoCimalp / nuitsCimalp : 0,
    });
  }

  // SEPTEMBRE : le chantier qui déborde ferme les chambres qui restent à finir, au plus fort des affaires.
  const debord = Math.max(0, av.fin - (SEMAINES + 1));
  let caSeptembre = 0;
  if (debord > 1e-9) {
    const derniere = p.phases.at(-1)!;
    const reste = (A_RENOVER * debord) / Math.max(1e-9, av.fin - debutDuChantier(p));
    const fermees = borne(reste * 2, 6, Math.max(6, Math.min(derniere.fermees, 36)));
    const enSeptembre: Phase = {
      ...derniere,
      fermees,
      loin: Math.min(derniere.loin || ETAGE, CHAMBRES - fermees),
      intensite: Math.max(1, derniere.intensite),
    };
    const r = regime(chemin, SEMAINES);
    const sans = uneSemaine("septembre", [{ phase: null, part: 1 }], 1, PART_AFFAIRES.septembre, r);
    const avec = uneSemaine(
      "septembre",
      [{ phase: enSeptembre, part: 1 }],
      1,
      PART_AFFAIRES.septembre,
      r,
    );
    caSeptembre = debord * (sans.ca - avec.ca);
    // Sans décision de décaler, les clients déjà réservés sur les chambres fermées sont délogés.
    if (chemin[D.retard] !== O.retard.decaler) {
      penalites += debord * (sans.vendues - avec.vendues) * GESTES.dejaReserve * GESTES.delogement;
    }
    gestes += debord * avec.gestes;
    affairesExposees += debord * avec.exposeesAff;
    const semainesCimalp = Math.min(debord, 2);
    expoCimalp +=
      semainesCimalp *
      CIMALP.parSemaine.septembre *
      (avec.affaires > 0 ? avec.exposeesAff / avec.affaires : 0);
    nuitsCimalp += semainesCimalp * CIMALP.parSemaine.septembre;
  }

  const expositionCimalp = nuitsCimalp > 0 ? expoCimalp / nuitsCimalp : 0;
  const risque = risqueCimalp(chemin, expositionCimalp, debord);
  const cimalpPart = h.uCimalp < risque;
  let surcout = surcoutA(SEMAINES);
  if (chemin[D.cimalp] === O.cimalp.ormea) {
    surcout += ORMEA.fixe + ORMEA.parSemaine * Math.min(debord, 4);
  }
  const effetNote = -COUT_DU_POINT * Math.max(0, NOTE_DEPART - note);
  const usure = -USURE_AFFAIRES * affairesExposees;
  let rentree = -caSeptembre + effetNote + usure;
  if (cimalpPart) rentree -= PERTE_CIMALP;
  if (chemin[D.cimalp] === O.cimalp.remise && !cimalpPart) rentree -= REMISE_CIMALP;

  const objectif = caCumule - gestes - penalites - surcout + rentree;
  return {
    semaines,
    objectif,
    ca: caCumule,
    gestes,
    penalites,
    surcout,
    rentree,
    caSeptembre,
    effetNote,
    usure,
    scenario: h.scenario,
    retard: final.retard,
    retardBrut: av.brut,
    retardVu: retardVu(chemin, graine),
    finChantier: av.fin,
    debord,
    renfort: final.renfort,
    avisViral,
    risqueCimalp: risque,
    expositionCimalp,
    cimalpPart,
    noteFinale: note,
    partExposee: nuitees > 0 ? exposeesTotal / nuitees : 0,
    nuitsAffairesExposees: affairesExposees,
    plaintes,
  };
}

/** Ce qui s'est passé pendant des semaines : l'avis, la fin du chantier, Cimalp, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    avisViral: t.avisViral && dans(SEMAINE_AVIS),
    finDuTrimestre: dans(SEMAINES),
    trimestre: t,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureHotel {
  revpar: number | null;
  to: number | null;
  note: number | null;
  livrees: number | null;
  couts: number | null;
  /** Ce que les messages et les sources lisent, sans l'afficher. */
  livreesPrevues: number | null;
  exposees: number | null;
  retardVu: number | null;
  finChantier: number | null;
  debord: number | null;
  cimalpExposes: number | null;
  plaintes: number | null;
}

/** Ce qu'Ana lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureHotel {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  if (semaine === 0) {
    return {
      revpar: 79,
      to: 0.82,
      note: NOTE_DEPART,
      livrees: 0,
      couts: 0,
      livreesPrevues: 0,
      exposees: 0,
      retardVu: 0,
      finChantier: finPrevue(PHASAGES[chemin[D.phasage]!]!),
      debord: 0,
      cimalpExposes: 0,
      plaintes: 0,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    revpar: s.revpar,
    to: s.to,
    note: s.note,
    livrees: s.livrees,
    couts: s.couts,
    livreesPrevues: s.livreesPrevues,
    exposees: s.nuitees > 0 ? s.exposees / s.nuitees : 0,
    retardVu: t.retardVu,
    finChantier: t.finChantier,
    debord: t.debord,
    cimalpExposes: s.cimalpExposes,
    plaintes: t.semaines.slice(1, semaine + 1).reduce((x, w) => x + w!.plaintes, 0),
  };
}
