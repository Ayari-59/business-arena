/**
 * L'INVESTISSEMENT À CHOISIR — le modèle des investissements de la plateforme
 * logistique de Saint-Quentin-Fallavier.
 *
 * Une enveloppe de 700 k€ pour l'an prochain, trois dossiers qui n'y tiennent
 * pas ensemble — un stockeur automatique, des chariots électriques, un
 * logiciel de gestion d'entrepôt —, une mezzanine laissée inachevée par le
 * prédécesseur, treize semaines, six décisions.
 *
 * La valeur d'un investissement se joue sur des années ; un épisode dure un
 * trimestre. Le trimestre est donc jugé sur la VALEUR CRÉÉE ESTIMÉE en
 * semaine 13 : la VAN, au taux du groupe, de tout ce que les décisions du
 * trimestre ont engagé, recalculée avec ce que le trimestre a appris
 * (volumes constatés, coût réel du chantier, retard, cadence mesurée aux
 * essais, décision du groupe sur le rattachement des agences du Nord-Isère),
 * par rapport au statu quo : ne rien lancer, la mezzanine gelée. Le hasard
 * porte sur ce que le trimestre révèle, jamais sur les règles du calcul.
 *
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA VALEUR SE COMPTE EN EUROS, PAS EN POURCENTAGE NI EN ANNÉES. Le
 *     stockeur a le TRI le plus faible et le délai de récupération le plus
 *     long des trois dossiers ; c'est pourtant lui qui crée le plus de valeur,
 *     parce qu'il est plus gros et dure plus longtemps. Avec une enveloppe
 *     rationnée, la bonne combinaison est celle qui maximise la VAN totale
 *     dans l'enveloppe, valeur résiduelle et BFR récupéré compris.
 *   · CE QUI EST DÉPENSÉ EST DÉPENSÉ. Les 210 k€ déjà mis dans la mezzanine
 *     ne reviendront dans aucun cas : seuls comptent les flux à venir. Finir
 *     la mezzanine coûte plus qu'elle ne rapportera, et le stockeur, s'il est
 *     lancé, lui prend les petites pièces qu'elle devait accueillir. Les
 *     flux différés comptent aussi : des batteries au plomb moins chères à
 *     l'achat se remplacent au bout de quatre ans, et cinq années de
 *     maintenance prépayées valent plus que cinq annuités payées à terme échu.
 *   · LES PRÉVISIONS DU FOURNISSEUR SONT UN PARI, L'ATTENTE A UNE VALEUR. La
 *     version étendue qu'il propose ne sert que si le groupe rattache les
 *     agences du Nord-Isère (quatre chances sur dix, décision mi-décembre).
 *     L'acheter tout de suite, c'est parier ; garder le droit de l'acheter
 *     plus tard (une clause d'extension), puis attendre la décision du
 *     groupe, c'est ne payer que si elle sert. La garantie de cadence
 *     protège du pire, et se paie.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux d'actualisation du groupe. */
export const TAUX = 0.08;
/** Celui qu'il retient si les taux d'emprunt montent pendant le trimestre. */
export const TAUX_RELEVE = 0.09;
/** L'enveloppe d'investissements de la plateforme pour l'an prochain, stock non compris. */
export const ENVELOPPE = 700000;
/** Ce que le groupe ajoute à l'enveloppe s'il rattache les agences du Nord-Isère. */
export const ABONDEMENT = 100000;
/** La valeur que la direction attend des décisions du trimestre. */
export const OBJECTIF_VALEUR = 150000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : le dossier du comité se prépare dans l'urgence, à prix de conseil. */
export const PERTE_PAR_JOUR = 1500;
/** Les petites lignes préparées par jour, et la cadence de préparation, aujourd'hui. */
export const VOLUME_DEPART = 1150;
export const CADENCE_DEPART = 62;
/** Les heures annuelles d'un chariot, au dossier des chariots électriques. */
export const HEURES_DOSSIER = 2900;
/** La semaine de mise en service prévue du grand projet. */
export const MISE_EN_SERVICE = 10;
/** Les semaines où le chantier révèle son surcoût, puis son retard et le verdict du bureau de contrôle. */
export const ANNONCES = { surcout: 6, retard: 8 } as const;

/**
 * LE RATTACHEMENT DES AGENCES DU NORD-ISÈRE : le groupe décide mi-décembre,
 * quatre chances sur dix ; s'il dit oui, 30 % de petites lignes en plus à
 * partir d'avril (la treizième semaine de l'an prochain).
 */
export const RATTACHEMENT = { chance: 0.4, hausse: 0.3, semaine: 12, debut: 13 } as const;
/** La version de base absorbe 10 % de volume en plus ; chaque extension, 35 % de plus. */
export const CAPACITE = { base: 1.1, extension: 0.35 } as const;

export interface GrandProjet {
  id: "stockeur" | "wms";
  nom: string;
  investissement: number;
  /** Le stock à constituer au démarrage, récupéré en fin de projet. */
  bfr: number;
  residuelle: number;
  duree: number;
  /** Les gains bruts de chaque année, aux volumes et à la cadence du dossier. */
  gains: readonly number[];
  /** Le contrat de maintenance annuel, déduit des flux du dossier. */
  maintenance: number;
  /** La cadence de préparation des petites pièces au dossier, en lignes par heure. */
  cadence: number;
  extension: { prix: number; maintenance: number };
  contrat: { prepaye: number; interventions: number; panne: number };
}

/** Six tours de stockage verticales pour les petites pièces : visserie, quincaillerie, consommables. */
export const STOCKEUR: GrandProjet = {
  id: "stockeur",
  nom: "le stockeur automatique",
  investissement: 480000,
  bfr: 80000,
  residuelle: 50000,
  duree: 10,
  gains: Array.from({ length: 10 }, () => 111000),
  maintenance: 16000,
  cadence: 150,
  extension: { prix: 70000, maintenance: 3000 },
  contrat: { prepaye: 68000, interventions: 16000, panne: 9000 },
};

/** Le logiciel de gestion d'entrepôt : licences, paramétrage, intégration à l'ERP du groupe. */
export const WMS: GrandProjet = {
  id: "wms",
  nom: "le logiciel de gestion d'entrepôt",
  investissement: 250000,
  bfr: 0,
  residuelle: 0,
  duree: 6,
  gains: [32000, 90000, 90000, 90000, 90000, 90000],
  maintenance: 12000,
  cadence: 80,
  extension: { prix: 30000, maintenance: 2000 },
  contrat: { prepaye: 51000, interventions: 12000, panne: 7000 },
};

/** Dix chariots élévateurs électriques et leurs chargeurs, à la place des chariots au gaz. */
export const CHARIOTS = {
  investissement: 140000,
  economies: 48000,
  duree: 6,
  /** Les batteries au plomb tiennent quatre ans en double équipe. */
  renouvellement: 40000,
  anneeRenouvellement: 4,
  residuelle: 10000,
  plomb: 70000,
  lithium: { surcout: 36000, economies: 4000, residuelle: 6000 },
  report: { mois: 4, remise: 0.05 },
} as const;

/** La mezzanine de picking lancée par le prédécesseur, arrêtée depuis son départ. */
export const MEZZANINE = {
  dejaPaye: 210000,
  reste: 90000,
  flux: 11000,
  /** Une fois le stockeur en service, il prend les petites pièces qu'elle devait accueillir. */
  fluxAvecStockeur: 4000,
  fluxRattachement: 4000,
  duree: 10,
  renfort: 25000,
  chanceRenfort: 0.5,
  offres: { haute: 36000, basse: 24000 },
  chanceOffreHaute: 0.5,
  demontage: 4000,
  premierNiveau: { cout: 50000, flux: 6000 },
  /** Gelée : deux mois de stockage chez l'entreprise, et des éléments qui perdent de leur valeur. */
  gel: { stockageMensuel: 1500, mois: 2, decote: 0.85 },
} as const;

/** La clause d'extension : prix et délai garantis un an. Sans elle, nouveau tarif après novembre. */
export const CLAUSE = { prix: 2000, delai: 8 } as const;
export const TARIF = { hausse: 0.15, delai: 24, finDuPrix: 9 } as const;
/** La garantie de cadence : indemnités si la cadence mesurée est sous 95 % du dossier, trois ans. */
export const GARANTIE = { seuil: 0.95, annees: 3, prime: 0.01, chance: 0.5 } as const;
/** Quatre sites équipés sur dix ont une panne de jeunesse dans les premières semaines. */
export const CHANCE_PANNE = 0.4;
/** Le contrat de maintenance se négocie pour cinq ans. */
export const ANNEES_CONTRAT = 5;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  portefeuille: 0,
  fournisseur: 1,
  mezzanine: 2,
  batteries: 3,
  extension: 4,
  maintenance: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 9, 12] as const;

/** Ne rien changer, décision par décision : rien présenté au comité, rien signé, rien commandé. */
export const NEUTRE = [3, 3, 3, 1, 0, 1] as const;

/** Le grand projet que la décision de la semaine 1 lance : le stockeur, le WMS, ou aucun. */
export const grandProjet = (chemin: readonly number[]): GrandProjet | null =>
  chemin[D.portefeuille] === 0 ? WMS : chemin[D.portefeuille] === 3 ? null : STOCKEUR;
export const avecChariots = (chemin: readonly number[]) =>
  chemin[D.portefeuille] === 0 || chemin[D.portefeuille] === 1;

/* ---------------------------------------------------------------------------
 * LES CALCULS DE L'ANALYSTE : VAN, TRI, délais de récupération.
 * ------------------------------------------------------------------------- */

/** La VAN d'une suite de flux annuels, le premier en début de projet. */
export const van = (flux: readonly number[], taux: number) =>
  flux.reduce((s, f, t) => s + f / (1 + taux) ** t, 0);
/** La valeur actuelle d'une annuité de fin d'année. */
export const annuite = (n: number, taux: number) => (1 - (1 + taux) ** -n) / taux;

/** Le TRI : le taux qui annule la VAN, par dichotomie. */
export function tri(flux: readonly number[]): number {
  let bas = -0.5;
  let haut = 2;
  for (let i = 0; i < 200; i += 1) {
    const m = (bas + haut) / 2;
    if (van(flux, m) > 0) bas = m;
    else haut = m;
  }
  return (bas + haut) / 2;
}

/** Le délai de récupération, simple (taux nul) ou actualisé, en années. */
export function delaiDeRecuperation(flux: readonly number[], taux = 0): number | null {
  let cumul = flux[0]!;
  for (let t = 1; t < flux.length; t += 1) {
    const f = flux[t]! / (1 + taux) ** t;
    if (cumul < 0 && cumul + f >= 0) return t - 1 + -cumul / f;
    cumul += f;
  }
  return null;
}

/** Les flux des trois dossiers, en euros, tels que le contrôle de gestion les a établis. */
export const FLUX_DU_DOSSIER = {
  stockeur: [
    -STOCKEUR.investissement - STOCKEUR.bfr,
    ...STOCKEUR.gains.map(
      (g, i) =>
        g -
        STOCKEUR.maintenance +
        (i === STOCKEUR.duree - 1 ? STOCKEUR.residuelle + STOCKEUR.bfr : 0),
    ),
  ],
  wms: [-WMS.investissement, ...WMS.gains.map((g) => g - WMS.maintenance)],
  chariots: [
    -CHARIOTS.investissement,
    ...Array.from(
      { length: CHARIOTS.duree },
      (_, i) =>
        CHARIOTS.economies -
        (i + 1 === CHARIOTS.anneeRenouvellement ? CHARIOTS.renouvellement : 0) +
        (i + 1 === CHARIOTS.duree ? CHARIOTS.residuelle : 0),
    ),
  ],
} as const;

/** Ce que le passage au lithium change, sur la vie des chariots, à l'utilisation donnée. */
export function vanLithium(taux: number, utilisation = 1): number {
  const l = CHARIOTS.lithium;
  return (
    -l.surcout +
    l.economies * utilisation * annuite(CHARIOTS.duree, taux) +
    CHARIOTS.renouvellement / (1 + taux) ** CHARIOTS.anneeRenouvellement +
    l.residuelle / (1 + taux) ** CHARIOTS.duree
  );
}

/** Ce que coûte le report des chariots au printemps : quatre mois d'économies, contre une remise. */
export const vanReport = (taux: number, utilisation = 1) =>
  CHARIOTS.report.remise * CHARIOTS.investissement -
  (CHARIOTS.economies * utilisation * CHARIOTS.report.mois) / 12 / (1 + taux);

/** La valeur de la mezzanine gelée : deux mois de stockage, puis la revente d'éléments décotés. */
export const VALEUR_GEL =
  -MEZZANINE.gel.stockageMensuel * MEZZANINE.gel.mois +
  MEZZANINE.gel.decote * ((MEZZANINE.offres.haute + MEZZANINE.offres.basse) / 2) -
  MEZZANINE.demontage;

/** La VAN de chaque option de la mezzanine, flux à venir seulement : ce qui est payé est payé. */
export function vanMezzanine(
  option: number,
  o: { taux: number; stockeur: boolean; rattachement: boolean; renfort: boolean; offre: number },
): number {
  const a = annuite(MEZZANINE.duree, o.taux);
  switch (option) {
    case 0: {
      const flux =
        (o.stockeur ? MEZZANINE.fluxAvecStockeur : MEZZANINE.flux) +
        (o.rattachement ? MEZZANINE.fluxRattachement : 0);
      return -MEZZANINE.reste - (o.renfort ? MEZZANINE.renfort : 0) + flux * a;
    }
    case 1:
      return -MEZZANINE.premierNiveau.cout + MEZZANINE.premierNiveau.flux * a;
    case 2:
      return o.offre - MEZZANINE.demontage;
    default:
      return VALEUR_GEL;
  }
}

/* ---------------------------------------------------------------------------
 * LES GAINS DU GRAND PROJET, ANNÉE PAR ANNÉE.
 * ------------------------------------------------------------------------- */

/** La part du volume qu'une tranche de capacité [c0, c1] absorbe. */
const tranche = (v: number, c0: number, c1: number) => Math.min(v, c1) - Math.min(v, c0);

export interface Hypotheses {
  taux: number;
  /** Le niveau des volumes constaté, 1 au dossier. */
  niveau: number;
  rattachement: boolean;
  /** La cadence mesurée rapportée à celle du dossier. */
  cadence: number;
}

/**
 * Les gains actualisés d'une tranche de capacité, en service à partir d'une
 * semaine de l'an prochain (0 : dès janvier). Le rattachement ne joue qu'à
 * partir d'avril.
 */
function gainsDeTranche(
  p: GrandProjet,
  h: Hypotheses,
  c0: number,
  c1: number,
  depuis: number,
): number {
  const avec = h.niveau * (1 + (h.rattachement ? RATTACHEMENT.hausse : 0));
  let total = 0;
  p.gains.forEach((g, i) => {
    let part: number;
    if (i === 0) {
      const avant = Math.max(0, RATTACHEMENT.debut - Math.max(0, depuis));
      const apres = 52 - Math.max(RATTACHEMENT.debut, depuis);
      part = (avant * tranche(h.niveau, c0, c1) + Math.max(0, apres) * tranche(avec, c0, c1)) / 52;
    } else {
      part = tranche(avec, c0, c1);
    }
    total += (g * h.cadence * part) / (1 + h.taux) ** (i + 1);
  });
  return total;
}

/**
 * CE QUE VAUT UNE EXTENSION, commandée une semaine donnée, livrée après un
 * délai, au prix donné : les gains de la capacité qu'elle ajoute, moins son
 * prix et sa maintenance. `rang` : la première extension, ou une seconde.
 */
export function valeurExtension(
  p: GrandProjet,
  h: Hypotheses,
  o: { prix: number; commande: number; delai: number; rang?: number },
): number {
  const rang = o.rang ?? 1;
  const c0 = CAPACITE.base + CAPACITE.extension * (rang - 1);
  const service = o.commande + o.delai - SEMAINES;
  return (
    -o.prix +
    gainsDeTranche(p, h, c0, c0 + CAPACITE.extension, service) -
    p.extension.maintenance * annuite(p.duree, h.taux)
  );
}

/** Ce que l'analyste montre : l'extension, si le groupe dit oui, si le groupe dit non, et en espérance. */
export function sensibiliteExtension(
  p: GrandProjet,
  o: { prix: number; commande: number; delai: number; rang?: number },
  taux = TAUX,
) {
  const base = { taux, niveau: 1, cadence: 1 };
  const siOui = valeurExtension(p, { ...base, rattachement: true }, o);
  const siNon = valeurExtension(p, { ...base, rattachement: false }, o);
  return {
    siOui,
    siNon,
    esperance: RATTACHEMENT.chance * siOui + (1 - RATTACHEMENT.chance) * siNon,
  };
}

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
  effet: { taux?: number; prime?: number; revision?: number; pic?: number; retard?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "taux",
    titre: "Le groupe relève son taux d'actualisation",
    de: "Ségolène Marchais",
    role: "Directrice financière du groupe",
    texte:
      "Les taux d'emprunt ont encore monté : le taux d'actualisation du groupe passe de 8 % à 9 %, pour tous les projets, y compris ceux déjà lancés.",
    duree: 13,
    effet: { taux: TAUX_RELEVE },
  },
  {
    id: "prime",
    titre: "Une prime pour les chariots électriques",
    de: "Gaëlle Robineau",
    role: "Responsable technique du site",
    texte:
      "Le fournisseur d'énergie du groupe finance des certificats d'économies d'énergie : 900 € par chariot thermique remplacé par un électrique livré avant la fin de l'année, soit 9 000 € pour dix.",
    duree: 13,
    effet: { prime: 9000 },
  },
  {
    id: "revision",
    titre: "La clause de révision de prix joue",
    de: "Service achats",
    role: "Siège",
    texte:
      "L'indice de prix du contrat a pris 3 % depuis la signature : la clause de révision s'applique au solde du grand projet, 70 % du prix.",
    duree: 13,
    effet: { revision: 0.03 },
  },
  {
    id: "pic",
    titre: "Deux semaines de commandes exceptionnelles",
    de: "Sandro Pinheiro",
    role: "Chef d'équipe préparation",
    texte:
      "Un promoteur lance trois chantiers d'un coup : les petites lignes bondissent de 20 % pendant deux semaines. Ça ne durera pas.",
    duree: 2,
    effet: { pic: 1.2 },
  },
  {
    id: "informatique",
    titre: "Départ du chef de projet informatique du groupe",
    de: "Wassim Bouchareb",
    role: "Chef de projet informatique du groupe",
    texte:
      "Je quitte le groupe à la fin du mois. Mon successeur arrive dans trois semaines : les interfaces des projets en cours prennent deux semaines de retard.",
    duree: 1,
    effet: { retard: 2 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'écart de volume de chaque semaine, autour du niveau du trimestre (indices 1 à 13). */
  bruit: readonly number[];
  /** Le niveau des petites lignes, rapporté à celui du dossier. */
  niveau: number;
  rattachement: boolean;
  /** La cadence que mesureront les essais, rapportée à celle du dossier. */
  cadence: number;
  /** Les semaines de retard que le fournisseur annoncera. */
  retard: number;
  /** Le surcoût du chantier, en part du prix. */
  surcout: number;
  /** L'utilisation réelle des chariots, rapportée au dossier. */
  utilisation: number;
  /** Le bureau de contrôle exige-t-il un renfort si l'on termine la mezzanine ? */
  uRenfort: number;
  /** Le négociant fait-il l'offre haute ? */
  uOffre: number;
  /** Le fournisseur accepte-t-il de garantir la cadence ? */
  uGarantie: number;
  /** Une panne de jeunesse frappe-t-elle, et quelle semaine ? */
  uPanne: number;
  semainePanne: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000289 + 7);
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.035 * gauss(r), -0.09, 0.09));
  const niveau = borne(1 + 0.04 * gauss(r), 0.9, 1.1);
  const rattachement = r() < RATTACHEMENT.chance;
  const cadence = borne(0.97 + 0.07 * gauss(r), 0.8, 1.1);
  const ur = r();
  const retard = ur < 0.35 ? 0 : ur < 0.6 ? 1 : ur < 0.8 ? 2 : ur < 0.92 ? 3 : 4;
  const surcout = borne(0.03 + 0.025 * gauss(r), 0, 0.09);
  const utilisation = borne(1 + 0.08 * gauss(r), 0.8, 1.2);
  const uRenfort = r();
  const uOffre = r();
  const uGarantie = r();
  const uPanne = r();
  const semainePanne = r() < 0.5 ? 12 : 13;
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    bruit,
    niveau,
    rattachement,
    cadence,
    retard,
    surcout,
    utilisation,
    uRenfort,
    uOffre,
    uGarantie,
    uPanne,
    semainePanne,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Une fois sur deux, le bureau de contrôle exige un renfort de la mezzanine qu'on termine. */
export const renfortExige = (chemin: readonly number[], graine: number) =>
  chemin[D.mezzanine] === 0 && hasard(graine).uRenfort < MEZZANINE.chanceRenfort;

/** L'offre du négociant pour les éléments de la mezzanine. */
export const offreDeReprise = (graine: number) =>
  hasard(graine).uOffre < MEZZANINE.chanceOffreHaute
    ? MEZZANINE.offres.haute
    : MEZZANINE.offres.basse;

/** Une fois sur deux, le fournisseur accepte de garantir la cadence du dossier. */
export const garantieAcceptee = (graine: number) => hasard(graine).uGarantie < GARANTIE.chance;

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);

/** Le retard total de mise en service : celui du fournisseur, et celui de l'informatique s'il tombe avant. */
export function retardTotal(h: Hasard): number {
  const info = imprevu(h, "informatique");
  return h.retard + (info && info.semaine <= MISE_EN_SERVICE + h.retard ? 2 : 0);
}

/** La panne de jeunesse frappe-t-elle un projet en service ? */
export const panneDeJeunesse = (chemin: readonly number[], graine: number) => {
  const h = hasard(graine);
  return (
    grandProjet(chemin) !== null &&
    h.uPanne < CHANCE_PANNE &&
    MISE_EN_SERVICE + retardTotal(h) <= h.semainePanne
  );
};

/* ---------------------------------------------------------------------------
 * LA VALEUR CRÉÉE, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  /** Ce que la semaine a changé à l'estimation. */
  variation: number;
  /** L'enveloppe engagée, et l'enveloppe disponible. */
  engage: number;
  enveloppe: number;
  /** Les petites lignes préparées par jour. */
  volumes: number;
  /** La cadence de préparation des petites pièces, en lignes par heure. */
  cadence: number;
  /** Le retard de mise en service connu, en semaines. */
  retard: number;
  taux: number;
};

export interface Estimation {
  valeur: number;
  grand: number;
  chariots: number;
  mezzanine: number;
  engage: number;
  enveloppe: number;
}

/** Ce que l'on sait en fin de semaine w : le reste est pris aux hypothèses du dossier. */
function estimer(chemin: readonly number[], graine: number, w: number, jours: number): Estimation {
  const h = hasard(graine);
  const [, d2, d3, d4, d5, d6] = chemin;
  const dit = (k: number) => w >= EFFET[k]!;
  const tombe = (id: string) => {
    const i = imprevu(h, id);
    return i !== undefined && i.semaine <= w;
  };
  const taux = tombe("taux") ? TAUX_RELEVE : TAUX;
  let niveau = 1;
  if (w >= 1) {
    let s = 0;
    for (let k = 1; k <= w; k += 1) s += h.niveau * (1 + h.bruit[k]!);
    niveau = s / w;
  }
  const rattachement = w >= RATTACHEMENT.semaine && h.rattachement;
  const cadence = w >= MISE_EN_SERVICE ? h.cadence : 1;
  const hyp: Hypotheses = { taux, niveau, rattachement, cadence };
  const enveloppe = ENVELOPPE + (rattachement ? ABONDEMENT : 0);

  let valeur = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let engage = 0;
  let vGrand = 0;
  let vChariots = 0;
  let vMezzanine = 0;

  const p = dit(D.portefeuille) ? grandProjet(chemin) : null;
  if (p) {
    const surcout = w >= ANNONCES.surcout ? h.surcout * p.investissement : 0;
    const revision = tombe("revision")
      ? imprevu(h, "revision")!.imprevu.effet.revision! * 0.7 * p.investissement
      : 0;
    let retard = w >= ANNONCES.retard ? h.retard : 0;
    const info = imprevu(h, "informatique");
    if (info && info.semaine <= w && info.semaine <= MISE_EN_SERVICE + h.retard) retard += 2;
    const a = annuite(p.duree, taux);
    vGrand =
      -p.investissement -
      surcout -
      revision -
      p.bfr +
      gainsDeTranche(p, hyp, 0, CAPACITE.base, 0) -
      p.maintenance * a +
      (p.residuelle + p.bfr) / (1 + taux) ** p.duree;
    // Chaque semaine de retard, une semaine de gains de la première année en moins.
    vGrand -= (p.gains[0]! * cadence * Math.min(niveau, CAPACITE.base) * retard) / 52 / (1 + taux);
    engage += p.investissement + surcout + revision;

    let extensions = 0;
    if (dit(D.fournisseur)) {
      if (d2 === 0) {
        extensions = 1;
        vGrand += valeurExtension(p, hyp, {
          prix: p.extension.prix,
          commande: 0,
          delai: 0,
        });
        engage += p.extension.prix;
      } else if (d2 === 1 && garantieAcceptee(graine)) {
        const prime = GARANTIE.prime * p.investissement;
        let indemnite = 0;
        for (let y = 1; y <= GARANTIE.annees; y += 1) {
          indemnite += (Math.max(0, GARANTIE.seuil - cadence) * p.gains[y - 1]!) / (1 + taux) ** y;
        }
        vGrand += indemnite - prime;
        engage += prime;
      } else if (d2 === 2) {
        vGrand -= CLAUSE.prix;
      }
    }
    if (dit(D.extension)) {
      const clause = d2 === 2;
      if (d5 === 1) {
        // Commandée en semaine 9, au prix d'aujourd'hui.
        vGrand += valeurExtension(p, hyp, {
          prix: p.extension.prix,
          commande: TARIF.finDuPrix,
          delai: clause ? CLAUSE.delai : TARIF.delai,
          rang: extensions + 1,
        });
        engage += p.extension.prix;
      } else if (d5 === 2 && extensions === 0 && rattachement) {
        // Commandée mi-décembre, une fois le rattachement confirmé.
        const prix = clause ? p.extension.prix : p.extension.prix * (1 + TARIF.hausse);
        vGrand += valeurExtension(p, hyp, {
          prix,
          commande: RATTACHEMENT.semaine,
          delai: clause ? CLAUSE.delai : TARIF.delai,
        });
        engage += prix;
      }
    }
    if (dit(D.maintenance)) {
      const a5 = annuite(ANNEES_CONTRAT, taux);
      if (d6 === 2) vGrand += p.maintenance * a5 - p.contrat.prepaye;
      if (d6 === 1) {
        vGrand += (p.maintenance - p.contrat.interventions) * a5;
        if (
          h.uPanne < CHANCE_PANNE &&
          MISE_EN_SERVICE + retardTotal(h) <= h.semainePanne &&
          w >= h.semainePanne
        ) {
          vGrand -=
            p.contrat.panne + (p.gains[0]! * cadence * Math.min(niveau, CAPACITE.base)) / 52;
        }
      }
    }
  }

  if (dit(D.portefeuille) && avecChariots(chemin)) {
    const u = w >= EFFET[D.batteries] ? h.utilisation : 1;
    vChariots =
      -CHARIOTS.investissement +
      CHARIOTS.economies * u * annuite(CHARIOTS.duree, taux) -
      CHARIOTS.renouvellement / (1 + taux) ** CHARIOTS.anneeRenouvellement +
      CHARIOTS.residuelle / (1 + taux) ** CHARIOTS.duree;
    engage += CHARIOTS.investissement;
    const reporte = dit(D.batteries) && d4 === 2;
    if (tombe("prime") && !reporte) vChariots += imprevu(h, "prime")!.imprevu.effet.prime!;
    if (dit(D.batteries)) {
      if (d4 === 0) {
        vChariots += vanLithium(taux, u);
        engage += CHARIOTS.lithium.surcout;
      }
      if (d4 === 2) {
        vChariots += vanReport(taux, u);
        engage -= CHARIOTS.report.remise * CHARIOTS.investissement;
      }
    }
  }

  if (dit(D.mezzanine)) {
    vMezzanine =
      vanMezzanine(d3!, {
        taux,
        stockeur: grandProjet(chemin) === STOCKEUR,
        rattachement,
        renfort: w >= ANNONCES.retard && renfortExige(chemin, graine),
        offre: offreDeReprise(graine),
      }) - VALEUR_GEL;
  }

  valeur += vGrand + vChariots + vMezzanine;
  return { valeur, grand: vGrand, chariots: vChariots, mezzanine: vMezzanine, engage, enveloppe };
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  grand: GrandProjet | null;
  chariots: boolean;
  vanGrand: number;
  vanChariots: number;
  mezzanine: number;
  engage: number;
  enveloppe: number;
  rattachement: boolean;
  /** La cadence mesurée aux essais, rapportée à celle du dossier. */
  cadence: number;
  retard: number;
  surcout: number;
  garantie: boolean | null;
  /** L'option retenue pour la mezzanine. */
  mezzanineOption: number;
  renfort: boolean;
  offre: number | null;
  panne: boolean;
  extension: "etendue" | "commandee" | "attendue" | "aucune";
  taux: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  const p = grandProjet(chemin);
  const pic = imprevu(h, "pic");
  const info = imprevu(h, "informatique");
  let avant = 0;
  let fin: Estimation | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    const enPic = pic && w >= pic.semaine && w < pic.semaine + pic.imprevu.duree;
    let retard = 0;
    if (p) {
      if (w >= ANNONCES.retard) retard += h.retard;
      if (info && info.semaine <= w && info.semaine <= MISE_EN_SERVICE + h.retard) retard += 2;
    }
    const enService = p !== null && w >= MISE_EN_SERVICE + retardTotal(h);
    semaines.push({
      valeur: e.valeur,
      variation: e.valeur - avant,
      engage: e.engage,
      enveloppe: e.enveloppe,
      volumes: VOLUME_DEPART * h.niveau * (1 + h.bruit[w]!) * (enPic ? 1.2 : 1),
      cadence: enService ? p.cadence * h.cadence : CADENCE_DEPART,
      retard,
      taux: imprevu(h, "taux") && imprevu(h, "taux")!.semaine <= w ? TAUX_RELEVE : TAUX,
    });
    avant = e.valeur;
    fin = e;
  }
  const [, d2, d3, , d5] = chemin;
  const extension =
    p === null
      ? "aucune"
      : d2 === 0
        ? "etendue"
        : d5 === 1
          ? "commandee"
          : d5 === 2 && h.rattachement
            ? "attendue"
            : "aucune";
  return {
    semaines,
    objectif: fin!.valeur,
    grand: p,
    chariots: avecChariots(chemin),
    vanGrand: fin!.grand,
    vanChariots: fin!.chariots,
    mezzanine: fin!.mezzanine,
    engage: fin!.engage,
    enveloppe: fin!.enveloppe,
    rattachement: h.rattachement,
    cadence: h.cadence,
    retard: p ? retardTotal(h) : 0,
    surcout: p ? h.surcout * p.investissement : 0,
    garantie: p && d2 === 1 ? garantieAcceptee(graine) : null,
    mezzanineOption: d3!,
    renfort: renfortExige(chemin, graine),
    offre: d3 === 2 ? offreDeReprise(graine) : null,
    panne: panneDeJeunesse(chemin, graine),
    extension,
    taux: semaines[SEMAINES]!.taux,
  };
}

/** Ce qui s'est passé pendant des semaines : chantier, essais, mezzanine, rattachement, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    surcout: t.grand !== null && dans(ANNONCES.surcout),
    retard: t.grand !== null && dans(ANNONCES.retard),
    renfort: chemin[D.mezzanine] === 0 && dans(ANNONCES.retard),
    essais: t.grand !== null && dans(MISE_EN_SERVICE),
    rattachement: dans(RATTACHEMENT.semaine),
    panne: t.panne && dans(h.semainePanne),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureInvestissement {
  valeur: number | null;
  engage: number | null;
  volumes: number | null;
  cadence: number | null;
  retard: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  enveloppe: number | null;
  taux: number | null;
  surcout: number | null;
  miseEnService: number | null;
  heures: number | null;
}

/**
 * Ce que Myriam lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureInvestissement {
  const h = hasard(graine);
  const heures = HEURES_DOSSIER * h.utilisation;
  if (semaine === 0) {
    return {
      valeur: 0,
      engage: 0,
      volumes: VOLUME_DEPART,
      cadence: CADENCE_DEPART,
      retard: 0,
      enveloppe: ENVELOPPE,
      taux: TAUX,
      surcout: 0,
      miseEnService: MISE_EN_SERVICE,
      heures,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    valeur: s.valeur,
    engage: s.engage,
    volumes: s.volumes,
    cadence: s.cadence,
    retard: s.retard,
    enveloppe: s.enveloppe,
    taux: s.taux,
    surcout: semaine >= ANNONCES.surcout ? t.surcout : 0,
    miseEnService: MISE_EN_SERVICE + s.retard,
    heures,
  };
}
