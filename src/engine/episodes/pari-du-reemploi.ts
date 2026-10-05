/**
 * LE PARI DU RÉEMPLOI — le modèle de la filière de réemploi que la direction
 * RSE et nouvelles activités d'Arvel Distribution peut lancer, ou non.
 *
 * Un projet de décret oblige les distributeurs de matériaux à reprendre les
 * déchets triés de leurs clients artisans et leur fixera peut-être un
 * objectif de réemploi. Il ouvre une activité : collecter chez les
 * démolisseurs et en agence les matériaux qui se réemploient (menuiseries,
 * sanitaires, radiateurs, bois de charpente, carrelage), les trier, les
 * revendre. Treize semaines, six décisions : la posture présentée au comité,
 * les conventions avec les démolisseurs, l'accord-cadre de la Métropole, le
 * rythme d'ouverture des comptoirs, l'offre de l'éco-organisme, l'équipement
 * de tri.
 *
 * COMMENT LA VALEUR EST ESTIMÉE. Une stratégie se joue sur des années, un
 * épisode sur un trimestre. Le trimestre est jugé sur la VALEUR CRÉÉE
 * ESTIMÉE en semaine 13, en euros :
 *
 *   résultat du trimestre (études, bennes, aménagements, annonce, premières
 *   marges) ;
 *   + la VAN, au taux du groupe (9 %), sur les cinq ans des conventions, des
 *     positions prises : marge de la filière (ventes de réemploi moins prix
 *     garanti, collecte, tri, recyclage de l'invendu, comptoirs, équipe),
 *     marge et notoriété de l'accord-cadre s'il est gagné, économies sur la
 *     reprise obligatoire par rapport au tarif standard de l'éco-organisme ;
 *   − les équipements payés et les dédits ;
 *   − la contribution libératoire due si le décret est durci et que la
 *     filière ne réemploie pas assez.
 *
 * Elle est recalculée chaque semaine avec ce que le trimestre a révélé : le
 * taux d'écoulement mesuré au premier bilan (semaine 6), la réaction de
 * Vercoran (semaine 5), le résultat de l'accord-cadre (semaine 10), le
 * décret publié (semaine 12). Tant qu'une chose n'est pas sue, elle est prise
 * aux hypothèses du plan, ou en espérance sur ses probabilités. Le statu quo
 * — ne rien engager, se mettre en conformité au tarif standard — vaut zéro,
 * sauf la contribution libératoire qu'il paiera si le décret est durci.
 *
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · CE QUI EST RARE SE PREND TÔT, CE QUI S'ACHÈTE PEUT ATTENDRE. Six
 *     démolisseurs tiennent 60 % du gisement de la métropole ; une convention
 *     de cinq ans les lie à un seul distributeur. Les deux grands signés,
 *     c'est la matière de la filière pour cinq ans, et une référence pour les
 *     marchés publics. La plateforme de tri, elle, s'achète à tout moment :
 *     commandée avant les volumes, elle est surdimensionnée et perd la
 *     subvention de la Région, qui exclut tout projet déjà commandé.
 *   · LA RÉACTION DU CONCURRENT DÉPEND DE CE QU'ON LUI LAISSE. Vercoran a
 *     pris en sept semaines les grands démolisseurs de Grenoble ; sa
 *     plateforme y tourne à 55 % et il lui faut des volumes. Il ne viendra à
 *     Lyon que si les grands gisements sont libres, et d'autant plus vite
 *     qu'une annonce bruyante lui dit que le marché vaut la peine. Une fois
 *     entré, il tire les prix vers le bas et dispute les marchés publics.
 *   · LE PLAN SE RÉVISE SUR LES PREMIERS CHIFFRES. Le plan validé suppose 60 %
 *     de matériaux écoulés et des ventes réparties sur six agences ; le
 *     premier bilan en mesure 40 à 50 %, et deux agences font l'essentiel des
 *     ventes. Tenir le plan coûte ; les comptoirs se dimensionnent sur ce qui
 *     sort. De même, une offre chiffrée sur les hypothèses du plan gagne
 *     l'accord-cadre au prix qui perd de l'argent : la caractérisation des
 *     bâtiments coûte, et change le prix.
 *
 * Le hasard porte sur le décret (durci, maintenu, repoussé), les taux
 * d'écoulement, la décision de Vercoran (dont la probabilité dépend des
 * choix), l'attribution de l'accord-cadre et l'offre de l'éco-organisme ; il
 * est tiré d'avance : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux d'actualisation du groupe pour une activité nouvelle. */
export const TAUX = 0.09;
/** La durée des conventions avec les démolisseurs : l'horizon de la valeur. */
export const HORIZON = 5;
/** La valeur que le comité attend des décisions du trimestre. */
export const OBJECTIF_VALEUR = 150000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : le dossier du comité se boucle avec un cabinet. */
export const PERTE_PAR_JOUR = 3000;

/* ---------------------------------------------------------------------------
 * LE GISEMENT DE LA MÉTROPOLE.
 * ------------------------------------------------------------------------- */

/**
 * Ce que l'observatoire régional des déchets publie : les déchets du
 * bâtiment de la métropole, la part de produits et équipements déposables
 * selon les diagnostics avant démolition, la part de ceux-ci en état d'être
 * réemployés, et la part que tiennent les six principaux démolisseurs.
 */
export const GISEMENT = {
  dechets: 400000,
  deposables: 0.15,
  reemployables: 0.15,
  partDesSix: 0.6,
} as const;

/** Le volume réemployable accessible chaque année dans la métropole : ce que la semaine 1 demande. */
export const VOLUME_ACCESSIBLE = Math.round(
  GISEMENT.dechets * GISEMENT.deposables * GISEMENT.reemployables,
);

/** Les deux grands démolisseurs, et les quatre moyens, en tonnes réemployables par an. */
export const DEMOLISSEURS = {
  sartel: 1400,
  grollier: 1000,
  moyens: 4,
  parMoyen: 750,
} as const;
export const DEUX_GRANDS = DEMOLISSEURS.sartel + DEMOLISSEURS.grollier;
export const VOLUME_DES_SIX = Math.round(VOLUME_ACCESSIBLE * GISEMENT.partDesSix);

/** L'économie d'une tonne réemployable collectée, en euros. */
export const FILIERE = {
  /** Le prix moyen de revente d'une tonne réemployée, net de remises. */
  prix: 400,
  collecte: 45,
  collecteAgence: 25,
  /** Le prix garanti au démolisseur par une convention de cinq ans. */
  prixGaranti: 12,
  /** Le prix qu'exigera un démolisseur à la fin d'un accord d'essai : il connaît sa valeur. */
  prixRenouvele: 20,
  /** Le tri sous-traité, par tonne. */
  triSousTraite: 85,
  /** Ce qui ne se revend pas part au recyclage. */
  recyclage: 20,
  /** L'équipe de la filière : un responsable et un acheteur de gisements. */
  animation: 45000,
  /** Les bennes mises à disposition de chaque démolisseur signé. */
  bennes: 15000,
} as const;

/** Le taux d'écoulement : la part des matériaux collectés qui se revend. */
export const ECOULEMENT = { plan: 0.55, moyen: 0.45, ecart: 0.02, min: 0.41, max: 0.49 } as const;

/**
 * LES COMPTOIRS DU RÉEMPLOI. Les deux agences de Gerland et de Villeurbanne
 * vendent l'essentiel ; les quatre autres du plan, très peu. La vente
 * directe aux maîtres d'ouvrage écoule 250 t par an sans comptoir ; le reste
 * part sur la place de marché de l'éco-organisme, 15 % moins cher.
 */
export const COMPTOIRS = {
  capaciteBon: 550,
  capaciteAutre: 60,
  amenagement: 12000,
  fixe: 10000,
  direct: 250,
  placeDeMarche: 0.85,
} as const;

/* ---------------------------------------------------------------------------
 * LE DÉCRET ET LE MARCHÉ.
 * ------------------------------------------------------------------------- */

export interface Scenario {
  id: "durci" | "maintenu" | "repousse";
  nom: string;
  chance: number;
  /** Le prix du réemploi, rapporté au prix d'aujourd'hui : la demande publique suit le décret. */
  prix: number;
  /** La reprise obligatoire des déchets triés en agence s'applique-t-elle ? */
  obligation: boolean;
}

/** Le décret paraît en semaine 12 ; la fédération en donne les chances, à peu près. */
export const SCENARIOS: readonly Scenario[] = [
  { id: "durci", nom: "durci", chance: 0.3, prix: 1.06, obligation: true },
  { id: "maintenu", nom: "maintenu", chance: 0.45, prix: 1, obligation: true },
  { id: "repousse", nom: "repoussé de deux ans", chance: 0.25, prix: 0.92, obligation: false },
];
export const PUBLICATION = 12;
/** Décret durci : chaque distributeur réemploie 600 t par an dès la deuxième année, ou paie 90 € par tonne manquante. */
export const OBJECTIF_REEMPLOI = { tonnes: 600, contribution: 90 } as const;
/** La reprise obligatoire entre en vigueur au 1er juillet : la moitié de la première année. */
export const DEMI_ANNEE = 0.5;

/* ---------------------------------------------------------------------------
 * VERCORAN, LE CONCURRENT.
 * ------------------------------------------------------------------------- */

/**
 * La chance que Vercoran entre à Lyon en semaine 5 et signe les démolisseurs
 * encore libres. Elle dépend de ce qu'Arvel lui laisse : sa plateforme de
 * Grenoble a besoin des grands volumes, les quatre moyens seuls ne paient
 * pas le transport ; une annonce bruyante sans gisement lui dit que le marché
 * vaut la peine ; l'attente déclarée du comité lui laisse le temps.
 */
export const VERCORAN = {
  semaine: 5,
  /** Selon la réponse aux démolisseurs : conventions, essai, attente, Sartel seul. */
  base: [0.2, 0.55, 0.6, 0.4],
  annonce: 0.2,
  attente: 0.2,
  max: 0.9,
  /** Entré, il tire les prix du réemploi de la métropole vers le bas dès la deuxième année. */
  pression: 0.06,
  /** Et il dispute l'accord-cadre. */
  accord: 0.8,
} as const;

/* ---------------------------------------------------------------------------
 * L'ACCORD-CADRE DE LA MÉTROPOLE.
 * ------------------------------------------------------------------------- */

/**
 * Quatre ans de dépose soignée, de tri et de revente des matériaux des
 * bâtiments que la Métropole démolit : 800 t par an, payées à la tonne au
 * prix de l'offre ; le titulaire garde la revente. Le coût net d'une tonne
 * dépend de la part qui se réemploie, que seule une caractérisation mesure.
 * Les concurrents, qui ont visité les sites, chiffrent au coût réel plus
 * 30 € ; chaque euro au-dessus de leur prix coûte 1,2 point de chance.
 */
export const ACCORD = {
  volume: 1000,
  annees: 4,
  depose: 280,
  /** La marge que le plan prend sur son coût, et que reprend une offre caractérisée. */
  marge: 25,
  /** La marge de sécurité de l'offre prudente, ajoutée au prix du plan. */
  securite: 120,
  margeConcurrents: 30,
  pente: 0.012,
  /** La valeur d'une première référence publique pour les marchés à venir. */
  notoriete: 40000,
  preparation: 5000,
  caracterisation: 15000,
  attribution: 10,
} as const;
/** L'accord-cadre agrandi, si l'imprévu tombe. */
export const VOLUME_RELEVE = 1200;
/** Le taux de réemploi des bâtiments de la Métropole : 60 % au plan ; mesuré, entre 30 et 60 %. */
export const REEMPLOI_METROPOLE = {
  plan: 0.55,
  moyen: 0.45,
  ecart: 0.08,
  min: 0.3,
  max: 0.6,
} as const;

/** Le coût net d'une tonne de l'accord-cadre, selon la part qui se réemploie. */
export const coutAccord = (reemploi: number, indice = 1) =>
  ACCORD.depose - reemploi * FILIERE.prix * indice + (1 - reemploi) * FILIERE.recyclage;
/** Le prix du plan : son coût à 60 %, plus sa marge. */
export const PRIX_DU_PLAN = Math.round(coutAccord(REEMPLOI_METROPOLE.plan) + ACCORD.marge);
export const PRIX_PRUDENT = PRIX_DU_PLAN + ACCORD.securite;

/* ---------------------------------------------------------------------------
 * LA REPRISE OBLIGATOIRE ET L'OFFRE D'ORRÉA, L'ÉCO-ORGANISME.
 * ------------------------------------------------------------------------- */

/**
 * Les agences reprendront 3 000 t de déchets triés par an, dont 300 t de
 * matériaux réemployables. Orréa propose, jusqu'en semaine 12, une reprise
 * clé en main à 22 € la tonne, flux réemployables compris, ou la seule
 * reprise des déchets non réemployables au même prix ; sans contrat, son
 * tarif standard est de 26 €. Tout faire soi-même coûte 30 € la tonne. Les
 * contrats ne prennent effet qu'avec l'obligation : attendre le décret ne
 * protège de rien, et l'offre peut être prise par d'autres distributeurs.
 */
export const REPRISE = {
  dechets: 3000,
  reemployables: 300,
  cleEnMain: 22,
  standard: 26,
  propre: 30,
  chanceCaduque: 0.5,
} as const;

/* ---------------------------------------------------------------------------
 * LES ÉQUIPEMENTS DE TRI.
 * ------------------------------------------------------------------------- */

export interface Equipement {
  id: "plateforme" | "ligne";
  nom: string;
  capacite: number;
  prix: number;
  /** Le coût de tri d'une tonne, contre 100 € sous-traité. */
  variable: number;
  fixe: number;
}

export const PLATEFORME: Equipement = {
  id: "plateforme",
  nom: "la plateforme de tri",
  capacite: 8000,
  prix: 480000,
  variable: 48,
  fixe: 50000,
};
export const LIGNE: Equipement = {
  id: "ligne",
  nom: "la ligne de tri modulaire",
  capacite: 4000,
  prix: 160000,
  variable: 55,
  fixe: 25000,
};
/** La subvention de la Région, pour les dossiers déposés avant toute commande. */
export const SUBVENTION = 0.3;
export const SUBVENTION_RELEVEE = 0.4;
/** Ce que vaut encore un équipement au bout des cinq ans, rapporté à son prix : il dure dix ans et plus. */
export const VALEUR_RESIDUELLE = 0.4;
/** Ce que coûte de réduire, ou d'annuler, une plateforme déjà commandée. */
export const DEDIT = { reduire: 50000, annuler: 80000 } as const;

/** Ce que coûtent les imprévus : le gazole par tonne collectée, l'incendie par tonne triée l'an 1. */
export const GAZOLE = 3;
export const INCENDIE = 20;
/** La marge du lot du bailleur, pour qui a déjà de la matière. */
export const LOT_DU_BAILLEUR = 12000;
/** Les semaines de collecte du trimestre, une fois les conventions signées. */
export const SEMAINES_DE_COLLECTE = 8;

/** Les dépenses du trimestre. */
export const ANNONCE = 20000;
export const PILOTE = 25000;
export const DOSSIER = 5000;
/** Une commande au salon est en service à mi-année ; une commande de décembre, l'année suivante. */
export const SERVICE_ANTICIPE = 0.5;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */

export const D = {
  posture: 0,
  conventions: 1,
  accord: 2,
  comptoirs: 3,
  orrea: 4,
  equipement: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 9, 12] as const;

/** Ne rien changer : attendre, ne rien signer, ne pas répondre, ne rien ouvrir, attendre le décret, sous-traiter. */
export const NEUTRE = [2, 2, 2, 2, 3, 2] as const;

/** La chance que Vercoran entre, selon la posture et la réponse aux démolisseurs. */
export function chanceVercoran(chemin: readonly number[]): number {
  const d1 = chemin[D.posture] ?? NEUTRE[D.posture];
  const d2 = chemin[D.conventions] ?? NEUTRE[D.conventions];
  const signal = d1 === 0 ? VERCORAN.annonce : d1 === 2 ? VERCORAN.attente : 0;
  return Math.min(VERCORAN.max, VERCORAN.base[d2]! + signal);
}

/** Le prix remis pour l'accord-cadre, selon l'offre et le taux de réemploi mesuré. */
export function prixRemis(d3: number, reemploi: number): number | null {
  if (d3 === 0) return PRIX_DU_PLAN;
  if (d3 === 1) return coutAccord(reemploi) + ACCORD.marge;
  if (d3 === 3) return PRIX_PRUDENT;
  return null;
}

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */

export interface Imprevu {
  id: "gazole" | "incendie" | "bailleur" | "volume" | "subvention";
  titre: string;
  de: string;
  role: string;
  texte: string;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "gazole",
    titre: "Le gazole renchérit la collecte",
    de: "Victorine Lagadec",
    role: "Responsable transport, région Rhône",
    texte:
      "Le gazole a pris 12 % depuis la rentrée. Nos transporteurs répercutent : 3 € de plus par tonne collectée, sur toute la durée des contrats indexés.",
  },
  {
    id: "incendie",
    titre: "Incendie chez le trieur sous-traitant",
    de: "Honoré Vercelli",
    role: "Directeur, Tri Lyonnais Services",
    texte:
      "Un incendie a détruit notre hall de tri de Saint-Fons. Nous reconstruisons ; d'ici là, nos clients sont triés à Saint-Étienne, 20 € de plus par tonne pendant un an.",
  },
  {
    id: "bailleur",
    titre: "Un bailleur social commande un lot de réemploi",
    de: "Prudence Mabiala",
    role: "Cheffe de projet, Habitat Saône-Rhône",
    texte:
      "Pour notre réhabilitation de Vaulx-en-Velin, nous cherchons 150 t de menuiseries et de sanitaires de réemploi d'ici la fin de l'année, au prix public.",
  },
  {
    id: "volume",
    titre: "La Métropole agrandit son accord-cadre",
    de: "Isidore Ferrari-Lebel",
    role: "Acheteur public, Métropole",
    texte: `Le plan de démolition des collèges est avancé : l'accord-cadre de dépose et de réemploi passe de ${ACCORD.volume.toLocaleString("fr-FR")} à ${VOLUME_RELEVE.toLocaleString("fr-FR")} t par an, aux mêmes conditions.`,
  },
  {
    id: "subvention",
    titre: "La Région relève sa subvention",
    de: "Philippine Bonnardel",
    role: "Chargée de mission économie circulaire, Région",
    texte:
      "La Région porte l'aide aux équipements de tri de 30 à 40 % pour les dossiers déposés avant le 31 décembre, toujours avant toute commande.",
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le décret qui paraîtra en semaine 12 : un indice de SCENARIOS. */
  scenario: number;
  /** Le taux d'écoulement de la filière, mesuré au premier bilan. */
  ecoulement: number;
  /** Le taux de réemploi des bâtiments de la Métropole. */
  reemploi: number;
  /** Vercoran entre-t-il ? Il entre si ce tirage est sous sa chance. */
  uVercoran: number;
  /** La Métropole retient-elle l'offre d'Arvel ? */
  uAccord: number;
  /** L'offre d'Orréa est-elle prise par d'autres avant le décret ? */
  uOrrea: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000403 + 7);
  const u = r();
  let scenario = SCENARIOS.length - 1;
  let cumul = 0;
  for (let i = 0; i < SCENARIOS.length; i += 1) {
    cumul += SCENARIOS[i]!.chance;
    if (u < cumul) {
      scenario = i;
      break;
    }
  }
  const ecoulement = borne(
    ECOULEMENT.moyen + ECOULEMENT.ecart * gauss(r),
    ECOULEMENT.min,
    ECOULEMENT.max,
  );
  const reemploi = borne(
    REEMPLOI_METROPOLE.moyen + REEMPLOI_METROPOLE.ecart * gauss(r),
    REEMPLOI_METROPOLE.min,
    REEMPLOI_METROPOLE.max,
  );
  const uVercoran = r();
  const uAccord = r();
  const uOrrea = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = { scenario, ecoulement, reemploi, uVercoran, uAccord, uOrrea, imprevus };
  tirages.set(graine, h);
  return h;
}

const imprevu = (h: Hasard, id: Imprevu["id"]) => h.imprevus.find((i) => i.imprevu.id === id);

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Vercoran entre-t-il à Lyon en semaine 5 ? */
export const vercoranEntre = (chemin: readonly number[], graine: number) =>
  hasard(graine).uVercoran < chanceVercoran(chemin);

/** Ce qui joue sur la chance de gagner l'accord-cadre, hors prix : les références, le concurrent. */
export function facteurAccord(chemin: readonly number[], vercoran: boolean): number {
  const d1 = chemin[D.posture] ?? NEUTRE[D.posture];
  const d2 = chemin[D.conventions] ?? NEUTRE[D.conventions];
  const references = d2 === 0 || d2 === 3 ? 1 : d2 === 1 ? 0.85 : d1 === 3 ? 0.7 : 0.5;
  return references * (d1 === 2 ? 0.5 : 1) * (vercoran ? VERCORAN.accord : 1);
}

/** La chance que la Métropole retienne une offre, à ce prix, face à des concurrents qui chiffrent au coût réel. */
export function chanceAccord(prix: number, reemploi: number, facteur: number): number {
  const concurrents = coutAccord(reemploi) + ACCORD.margeConcurrents;
  return facteur * borne(0.5 + (concurrents - prix) * ACCORD.pente, 0, 0.9);
}

export function accordGagne(chemin: readonly number[], graine: number): boolean | null {
  const h = hasard(graine);
  const prix = prixRemis(chemin[D.accord]!, h.reemploi);
  if (prix === null) return null;
  return (
    h.uAccord < chanceAccord(prix, h.reemploi, facteurAccord(chemin, vercoranEntre(chemin, graine)))
  );
}

/** L'offre d'Orréa a-t-elle été prise par d'autres pendant qu'Arvel attendait le décret ? */
export const offreCaduque = (graine: number) => hasard(graine).uOrrea < REPRISE.chanceCaduque;

/* ---------------------------------------------------------------------------
 * LA VALEUR D'UN ÉTAT DU MONDE ENTIÈREMENT CONNU.
 * ------------------------------------------------------------------------- */

const actualise = (annee: number) => 1 / (1 + TAUX) ** annee;
/** La valeur actuelle d'une annuité de fin d'année. */
export const annuite = (n: number, taux = TAUX) => (1 - (1 + taux) ** -n) / taux;

/** Ce qui, du monde, est su ou supposé au moment de l'estimation. */
export interface Monde {
  scenario: number;
  ecoulement: number;
  reemploi: number;
  vercoran: boolean;
  gagne: boolean;
  caduque: boolean;
  gazole: boolean;
  incendie: boolean;
  bailleur: boolean;
  volumeAccord: number;
  subvention: number;
}

export interface Detail {
  valeur: number;
  /** Les dépenses et marges du trimestre lui-même. */
  trimestre: number;
  filiere: number;
  accord: number;
  reprise: number;
  equipement: number;
  contribution: number;
  /** Les sommes engagées : équipements, dédits, bennes, études, aménagements. */
  engage: number;
  /** Les tonnes réemployables par an sous convention avec Arvel. */
  gisement: number;
}

/** L'équipement de tri qui résulte de la posture et de la décision de décembre. */
export function equipementRetenu(
  d1: number | undefined,
  d6: number | undefined,
): { eq: Equipement | null; service: number; prix: number; dedit: number; subventionne: boolean } {
  if (d1 === 0) {
    if (d6 === undefined || d6 === 0)
      return {
        eq: PLATEFORME,
        service: SERVICE_ANTICIPE,
        prix: PLATEFORME.prix,
        dedit: 0,
        subventionne: false,
      };
    if (d6 === 1)
      return { eq: LIGNE, service: 0, prix: LIGNE.prix, dedit: DEDIT.reduire, subventionne: false };
    return { eq: null, service: 0, prix: 0, dedit: DEDIT.annuler, subventionne: false };
  }
  if (d6 === 0)
    return { eq: PLATEFORME, service: 0, prix: PLATEFORME.prix, dedit: 0, subventionne: true };
  if (d6 === 1) return { eq: LIGNE, service: 0, prix: LIGNE.prix, dedit: 0, subventionne: true };
  return { eq: null, service: 0, prix: 0, dedit: 0, subventionne: false };
}

/**
 * LA VALEUR CRÉÉE, pour des décisions données (`undefined` : pas encore
 * prise) dans un monde donné. Les flux sont annuels, en fin d'année, sur les
 * cinq ans des conventions ; les dépenses du trimestre ne s'actualisent pas.
 */
export function valeurDans(
  decisions: readonly (number | undefined)[],
  m: Monde,
  jours: number,
): Detail {
  const [d1, d2, d3, d4, d5, d6] = decisions;
  const sc = SCENARIOS[m.scenario]!;

  let trimestre = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let engage = 0;
  if (d1 === 0) trimestre -= ANNONCE;
  if (d1 === 3) trimestre -= PILOTE;
  if (d1 === 3) engage += PILOTE;

  // Les conventions avec les démolisseurs : volumes et prix garanti, année par année.
  const conv = (annee: number): { t: number; prix: number } => {
    let r = { t: 0, prix: 0 };
    if (d2 === 0) r = { t: DEUX_GRANDS, prix: FILIERE.prixGaranti };
    if (d2 === 3) r = { t: DEMOLISSEURS.sartel, prix: FILIERE.prixGaranti };
    if (d2 === 1)
      r =
        annee === 1
          ? { t: DEUX_GRANDS, prix: 0 }
          : m.vercoran
            ? { t: 0, prix: 0 }
            : { t: DEUX_GRANDS, prix: FILIERE.prixRenouvele };
    // Sans équipe avant le décret, les conventions ne démarrent qu'en avril.
    if (d1 === 2 && annee === 1) r = { ...r, t: r.t * DEMI_ANNEE };
    return r;
  };
  const bennes = d2 === 0 || d2 === 1 ? 2 * FILIERE.bennes : d2 === 3 ? FILIERE.bennes : 0;
  trimestre -= bennes;
  engage += bennes;

  // L'équipement de tri.
  const e = equipementRetenu(d1, d6);
  const taux = e.subventionne ? m.subvention : 0;
  const capex = e.prix * (1 - taux) + e.dedit;
  if (d6 !== undefined && d1 !== 0 && e.eq) trimestre -= DOSSIER;
  engage += capex;

  // Les flux réemployables d'agence, si l'obligation s'applique et qu'Arvel les garde.
  const garde = d5 === 1 || d5 === 2 || (d5 === 3 && !m.caduque);
  const agence = (annee: number) =>
    sc.obligation && garde ? REPRISE.reemployables * (annee === 1 ? DEMI_ANNEE : 1) : 0;

  // Les comptoirs : l'an 1 selon la décision ; ensuite, deux comptoirs pour qui a de quoi vendre.
  const amenagement =
    d4 === 0 || d4 === 3 ? 6 * COMPTOIRS.amenagement : d4 === 1 ? 2 * COMPTOIRS.amenagement : 0;
  trimestre -= amenagement;
  engage += amenagement;

  let filiere = 0;
  let reprise = 0;
  let contribution = 0;
  let accord = 0;
  let equipement = -capex + (e.eq ? e.prix * VALEUR_RESIDUELLE * actualise(HORIZON) : 0);

  // L'accord-cadre.
  const prix = d3 === undefined ? null : prixRemis(d3, m.reemploi);
  if (prix !== null) {
    trimestre -= ACCORD.preparation + (d3 === 1 ? ACCORD.caracterisation : 0);
    engage += ACCORD.preparation + (d3 === 1 ? ACCORD.caracterisation : 0);
  }
  const accordReemploye = (annee: number) =>
    prix !== null && m.gagne && sc.obligation && annee <= ACCORD.annees
      ? m.reemploi * m.volumeAccord
      : 0;
  // Si le décret est repoussé, la Métropole déclare la consultation sans suite.
  const notifie = prix !== null && m.gagne && sc.obligation;
  if (notifie) {
    accord += ACCORD.notoriete;
    for (let a = 1; a <= ACCORD.annees; a += 1) {
      const p = FILIERE.prix * sc.prix * (m.vercoran && a >= 2 ? 1 - VERCORAN.pression : 1);
      const marge = prix + m.reemploi * p - ACCORD.depose - (1 - m.reemploi) * FILIERE.recyclage;
      accord += m.volumeAccord * marge * actualise(a);
    }
  }

  for (let a = 1; a <= HORIZON; a += 1) {
    const c = conv(a);
    const ag = agence(a);
    const v = c.t + ag;
    const vendus = m.ecoulement * v;
    // Les comptoirs ouverts cette année, et ce qu'ils peuvent vendre.
    let comptoirs: { bons: number; autres: number; part: number } = { bons: 0, autres: 0, part: 1 };
    if (a === 1 && d4 !== undefined) {
      if (d4 === 0) comptoirs = { bons: 2, autres: 4, part: 1 };
      if (d4 === 1) comptoirs = { bons: 2, autres: 0, part: 1 };
      if (d4 === 3) comptoirs = { bons: 2, autres: 4, part: 0.5 };
    } else if (vendus > 0) {
      comptoirs = { bons: 2, autres: 0, part: 1 };
    }
    if (a === 1 && d4 === 2 && conv(2).t + agence(2) > 0) {
      // Les deux comptoirs s'ouvrent en fin d'année.
      filiere -= 2 * COMPTOIRS.amenagement * actualise(1);
    }
    const capacite =
      comptoirs.bons * COMPTOIRS.capaciteBon +
      comptoirs.autres * COMPTOIRS.capaciteAutre * comptoirs.part +
      COMPTOIRS.direct;
    const pleinPrix = Math.min(vendus, capacite);
    const p = FILIERE.prix * sc.prix * (m.vercoran && a >= 2 ? 1 - VERCORAN.pression : 1);
    const revenu = p * (pleinPrix + COMPTOIRS.placeDeMarche * (vendus - pleinPrix));
    // Le tri se compte sous-traité ; ce que l'équipement fait gagner va à l'équipement.
    const triST = FILIERE.triSousTraite + (m.incendie && a === 1 ? INCENDIE : 0);
    const enService = e.eq ? (a === 1 ? e.service : 1) : 0;
    const gainTri = e.eq
      ? enService * (Math.min(v, e.eq.capacite) * (triST - e.eq.variable) - e.eq.fixe)
      : 0;
    const couts =
      c.t * (c.prix + FILIERE.collecte + (m.gazole ? GAZOLE : 0)) +
      ag * FILIERE.collecteAgence +
      v * triST +
      (1 - m.ecoulement) * v * FILIERE.recyclage +
      (comptoirs.bons + comptoirs.autres * comptoirs.part) * COMPTOIRS.fixe +
      (c.t > 0 ? FILIERE.animation * (d1 === 2 && a === 1 ? DEMI_ANNEE : 1) : 0);
    filiere += (revenu - couts) * actualise(a);
    equipement += gainTri * actualise(a);

    // La reprise obligatoire : l'économie par rapport au tarif standard d'Orréa.
    if (sc.obligation && d5 !== undefined) {
      const standard = REPRISE.standard * REPRISE.dechets;
      const nonReemployables = REPRISE.dechets - REPRISE.reemployables;
      const cout =
        d5 === 0
          ? REPRISE.cleEnMain * REPRISE.dechets
          : d5 === 1
            ? REPRISE.cleEnMain * nonReemployables
            : d5 === 2
              ? REPRISE.propre * nonReemployables
              : m.caduque
                ? standard
                : REPRISE.cleEnMain * nonReemployables;
      reprise += (standard - cout) * (a === 1 ? DEMI_ANNEE : 1) * actualise(a);
    }

    // Le décret durci : la contribution libératoire sur ce qui manque à l'objectif.
    if (sc.id === "durci" && a >= 2) {
      const manque = Math.max(0, OBJECTIF_REEMPLOI.tonnes - vendus - accordReemploye(a));
      contribution += manque * OBJECTIF_REEMPLOI.contribution * actualise(a);
    }
  }

  // Les premières semaines de collecte, et le lot du bailleur s'il tombe.
  const c1 = conv(1);
  if (c1.t > 0 && d2 !== undefined) {
    const triST = FILIERE.triSousTraite + (m.incendie ? INCENDIE : 0);
    const margeTonne =
      m.ecoulement * FILIERE.prix -
      c1.prix -
      FILIERE.collecte -
      triST -
      (1 - m.ecoulement) * FILIERE.recyclage;
    trimestre += (c1.t * SEMAINES_DE_COLLECTE * margeTonne) / 52;
    if (m.bailleur) trimestre += LOT_DU_BAILLEUR;
  }

  const valeur = trimestre + filiere + accord + reprise + equipement - contribution;
  return {
    valeur,
    trimestre,
    filiere,
    accord,
    reprise,
    equipement,
    contribution,
    engage,
    gisement: d2 === 0 || d2 === 1 ? DEUX_GRANDS : d2 === 3 ? DEMOLISSEURS.sartel : 0,
  };
}

/* ---------------------------------------------------------------------------
 * LES CALCULS QUE LES SOURCES MONTRENT, aux hypothèses qu'elles disent.
 * ------------------------------------------------------------------------- */

/** La marge d'une tonne collectée, au prix d'aujourd'hui, tri sous-traité sauf mention. */
export const margeParTonne = (
  ecoulement: number,
  o: { prixGaranti?: number; collecte?: number; tri?: number } = {},
) =>
  ecoulement * FILIERE.prix -
  (o.prixGaranti ?? FILIERE.prixGaranti) -
  (o.collecte ?? FILIERE.collecte) -
  (o.tri ?? FILIERE.triSousTraite) -
  (1 - ecoulement) * FILIERE.recyclage;

/** Ce que coûte à la marge chaque point d'écoulement en moins, par tonne. */
export const SENSIBILITE_ECOULEMENT = (FILIERE.prix + FILIERE.recyclage) / 100;

/** Les tonnes vendables par an, et ce que deux, ou six, comptoirs peuvent en vendre au plein prix. */
export const CAPACITE_DEUX = 2 * COMPTOIRS.capaciteBon + COMPTOIRS.direct;
export const CAPACITE_SIX =
  2 * COMPTOIRS.capaciteBon + 4 * COMPTOIRS.capaciteAutre + COMPTOIRS.direct;

/**
 * LA VAN D'UN ÉQUIPEMENT DE TRI, à un volume annuel donné : son prix (net de
 * la subvention), les économies sur le tri sous-traité à partir de sa mise
 * en service, sa valeur au bout des cinq ans. `service` : la part de la
 * première année où il tourne déjà.
 */
export function vanEquipement(
  eq: Equipement,
  volume: number,
  o: { subvention?: number; service?: number; dedit?: number } = {},
): number {
  let v =
    -eq.prix * (1 - (o.subvention ?? 0)) -
    (o.dedit ?? 0) +
    eq.prix * VALEUR_RESIDUELLE * actualise(HORIZON);
  for (let a = 1; a <= HORIZON; a += 1) {
    const enService = a === 1 ? (o.service ?? 0) : 1;
    v +=
      enService *
      (Math.min(volume, eq.capacite) * (FILIERE.triSousTraite - eq.variable) - eq.fixe) *
      actualise(a);
  }
  return v;
}

/* ---------------------------------------------------------------------------
 * CE QUE L'ON SAIT EN FIN DE SEMAINE : le reste en espérance, ou au plan.
 * ------------------------------------------------------------------------- */

type Pondere<T> = readonly (readonly [T, number])[];

const CHAMPS = [
  "valeur",
  "trimestre",
  "filiere",
  "accord",
  "reprise",
  "equipement",
  "contribution",
  "engage",
  "gisement",
] as const;

/**
 * La valeur estimée en fin de semaine w : les décisions prises, les imprévus
 * tombés, ce que le trimestre a révélé ; le taux d'écoulement et le taux de
 * réemploi des bâtiments au plan tant qu'ils ne sont pas mesurés ; le
 * décret, Vercoran, l'accord-cadre et l'offre d'Orréa en espérance tant
 * qu'ils ne sont pas connus.
 */
export function estimer(
  chemin: readonly number[],
  graine: number,
  w: number,
  jours: number,
): Detail {
  const h = hasard(graine);
  const decisions = chemin.map((o, k) => (w >= EFFET[k]! ? o : undefined));
  const connu = NEUTRE.map((n, i) => decisions[i] ?? n);
  const tombe = (id: Imprevu["id"]) => {
    const i = imprevu(h, id);
    return i !== undefined && i.semaine <= w;
  };
  const ecoulement = w >= BILAN ? h.ecoulement : ECOULEMENT.plan;
  const reemploi =
    w >= ACCORD.attribution || (decisions[D.accord] === 1 && w >= EFFET[D.accord])
      ? h.reemploi
      : REEMPLOI_METROPOLE.plan;
  const scenarios: Pondere<number> =
    w >= PUBLICATION ? [[h.scenario, 1]] : SCENARIOS.map((s, i) => [i, s.chance] as const);
  const pV = chanceVercoran(connu);
  const vercorans: Pondere<boolean> =
    w >= VERCORAN.semaine
      ? [[vercoranEntre(chemin, graine), 1]]
      : [
          [true, pV],
          [false, 1 - pV],
        ];
  const prix = decisions[D.accord] === undefined ? null : prixRemis(decisions[D.accord]!, reemploi);
  const caduques: Pondere<boolean> =
    w >= PUBLICATION || decisions[D.orrea] !== 3
      ? [[offreCaduque(graine), 1]]
      : [
          [true, REPRISE.chanceCaduque],
          [false, 1 - REPRISE.chanceCaduque],
        ];
  const total = Object.fromEntries(CHAMPS.map((c) => [c, 0])) as Record<keyof Detail, number>;
  for (const [vercoran, pv] of vercorans) {
    let gagnes: Pondere<boolean>;
    if (prix === null) gagnes = [[false, 1]];
    else if (w >= ACCORD.attribution) gagnes = [[accordGagne(chemin, graine) === true, 1]];
    else {
      const p = chanceAccord(prix, reemploi, facteurAccord(connu, vercoran));
      gagnes = [
        [true, p],
        [false, 1 - p],
      ];
    }
    for (const [gagne, pg] of gagnes) {
      for (const [scenario, ps] of scenarios) {
        for (const [caduque, pc] of caduques) {
          const d = valeurDans(
            decisions,
            {
              scenario,
              ecoulement,
              reemploi,
              vercoran,
              gagne,
              caduque,
              gazole: tombe("gazole"),
              incendie: tombe("incendie"),
              bailleur: tombe("bailleur"),
              volumeAccord: tombe("volume") ? VOLUME_RELEVE : ACCORD.volume,
              subvention: tombe("subvention") ? SUBVENTION_RELEVEE : SUBVENTION,
            },
            jours,
          );
          const poids = pv * pg * ps * pc;
          for (const c of CHAMPS) total[c] += poids * d[c];
        }
      }
    }
  }
  return total;
}

/** Le premier bilan des conventions, qui mesure le taux d'écoulement. */
export const BILAN = 6;

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  /** Ce que la semaine a changé à l'estimation. */
  variation: number;
  /** Les tonnes réemployables par an sous contrat avec Arvel. */
  gisement: number;
  engage: number;
  /** Le taux d'écoulement : au plan, puis mesuré. */
  ecoulement: number;
  /** La part du volume des six démolisseurs prise par la concurrence. */
  concurrence: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  detail: Detail;
  scenario: Scenario;
  vercoran: boolean;
  chanceVercoran: number;
  /** null : pas d'offre. */
  accord: boolean | null;
  prixRemis: number | null;
  chanceAccord: number | null;
  ecoulement: number;
  reemploi: number;
  caduque: boolean;
  equipement: Equipement | null;
  gisement: number;
  /** Les tonnes par an encore sous convention à partir de l'an prochain. */
  conventions: number;
  /** Les tonnes par an que la filière collectera à partir de l'an prochain, flux d'agence compris. */
  volume: number;
  /** Les tonnes réemployées vendues la deuxième année : ce que compte l'objectif du décret durci. */
  reemployees: number;
}

/** La part du volume des six démolisseurs que Vercoran a prise, s'il est entré. */
export function partPrise(chemin: readonly number[], graine: number, w: number): number {
  if (w < VERCORAN.semaine || !vercoranEntre(chemin, graine)) return 0;
  const d2 = chemin[D.conventions];
  const arvel = d2 === 0 ? DEUX_GRANDS : d2 === 3 ? DEMOLISSEURS.sartel : 0;
  return (VOLUME_DES_SIX - arvel) / VOLUME_DES_SIX;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let avant = 0;
  let fin: Detail | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    semaines.push({
      valeur: e.valeur,
      variation: e.valeur - avant,
      gisement: e.gisement,
      engage: e.engage,
      ecoulement: w >= BILAN ? h.ecoulement : ECOULEMENT.plan,
      concurrence: partPrise(chemin, graine, w),
    });
    avant = e.valeur;
    fin = e;
  }
  const prix = prixRemis(chemin[D.accord]!, h.reemploi);
  const vercoran = vercoranEntre(chemin, graine);
  const e = equipementRetenu(chemin[D.posture], chemin[D.equipement]);
  const d2 = chemin[D.conventions];
  const conv2 =
    d2 === 0
      ? DEUX_GRANDS
      : d2 === 3
        ? DEMOLISSEURS.sartel
        : d2 === 1 && !vercoran
          ? DEUX_GRANDS
          : 0;
  const sc = SCENARIOS[h.scenario]!;
  const garde =
    chemin[D.orrea] === 1 ||
    chemin[D.orrea] === 2 ||
    (chemin[D.orrea] === 3 && !offreCaduque(graine));
  const agence = sc.obligation && garde ? REPRISE.reemployables : 0;
  const gagne = accordGagne(chemin, graine);
  return {
    semaines,
    objectif: fin!.valeur,
    detail: fin!,
    scenario: sc,
    vercoran,
    chanceVercoran: chanceVercoran(chemin),
    accord: gagne,
    prixRemis: prix,
    chanceAccord:
      prix === null ? null : chanceAccord(prix, h.reemploi, facteurAccord(chemin, vercoran)),
    ecoulement: h.ecoulement,
    reemploi: h.reemploi,
    caduque: chemin[D.orrea] === 3 && offreCaduque(graine),
    equipement: e.eq,
    gisement: fin!.gisement,
    conventions: conv2,
    volume: conv2 + agence,
    reemployees:
      h.ecoulement * (conv2 + agence) + (gagne && sc.obligation ? h.reemploi * ACCORD.volume : 0),
  };
}

/** Ce qui s'est passé pendant des semaines : Vercoran, le bilan, l'accord-cadre, Orréa, le décret, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    vercoran: dans(VERCORAN.semaine),
    bilan: dans(BILAN),
    accord: dans(ACCORD.attribution) && prixRemis(chemin[D.accord]!, h.reemploi) !== null,
    orrea: dans(PUBLICATION) && chemin[D.orrea] === 3,
    decret: dans(PUBLICATION),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureReemploi {
  valeur: number | null;
  gisement: number | null;
  engage: number | null;
  ecoulement: number | null;
  concurrence: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  mesure: number | null;
  reemploi: number | null;
  vercoran: number | null;
  subvention: number | null;
  volumeAccord: number | null;
  incendie: number | null;
}

/**
 * Ce qu'Ysaline lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureReemploi {
  const h = hasard(graine);
  const tombe = (id: Imprevu["id"]) => {
    const i = imprevu(h, id);
    return i !== undefined && i.semaine <= semaine;
  };
  const communs = {
    subvention: tombe("subvention") ? SUBVENTION_RELEVEE : SUBVENTION,
    volumeAccord: tombe("volume") ? VOLUME_RELEVE : ACCORD.volume,
    incendie: tombe("incendie") ? 1 : 0,
    reemploi: h.reemploi,
  };
  if (semaine === 0) {
    return {
      valeur: 0,
      gisement: 0,
      engage: 0,
      ecoulement: ECOULEMENT.plan,
      concurrence: 0,
      mesure: 0,
      vercoran: -1,
      ...communs,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    valeur: s.valeur,
    gisement: s.gisement,
    engage: s.engage,
    ecoulement: s.ecoulement,
    concurrence: s.concurrence,
    mesure: semaine >= BILAN ? 1 : 0,
    vercoran: semaine >= VERCORAN.semaine ? (t.vercoran ? 1 : 0) : -1,
    ...communs,
  };
}
