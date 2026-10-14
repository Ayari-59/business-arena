/**
 * LA FACTURE D'ÉNERGIE DE L'USINE — le modèle de l'énergie de l'usine de
 * Loudéac, Laiterie de Kerbrélan.
 *
 * Six lignes de conditionnement en pots, des chambres froides, de l'eau
 * glacée, des nettoyages en place (NEP) à l'eau chaude, des pasteurisateurs,
 * un réseau d'air comprimé. La facture d'électricité et de gaz est passée de
 * 2,9 à 5,1 M€ en deux ans. Le trimestre va de juillet à septembre : l'été, les
 * groupes froids à plein régime, et une canicule possible. Le directeur
 * financier veut signer un prix fixe sur trois ans pour tout le volume, au
 * niveau actuel ; la production propose d'arrêter une ligne aux heures les
 * plus chères. Cinq mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · LA PREMIÈRE ÉCONOMIE EST CELLE QU'ON MESURE. Une campagne de
 *     sous-comptage répartit la consommation par usage : le froid et l'eau
 *     chaude des NEP dominent, et l'air comprimé fuit d'environ 30 %, jour et
 *     nuit, toute l'année. Ce qui est mesuré se répare bien : sans relevés, on
 *     ne trouve les fuites qu'à l'oreille, et on règle les groupes froids à
 *     l'estime. La mesure dimensionne aussi l'investissement et le contrat.
 *   · LES RÉGLAGES COÛTENT PEU ET AGISSENT VITE ; L'INVESTISSEMENT SE CALCULE.
 *     Réparer les fuites, baisser la pression du réseau d'un bar, laisser
 *     flotter la haute pression des groupes froids, remplacer les purgeurs de
 *     vapeur : quelques dizaines de milliers d'euros, effet en deux semaines.
 *     La récupération de chaleur sur les condenseurs des groupes froids
 *     préchauffe l'eau des NEP : un investissement au délai de récupération
 *     calculable, rentable s'il est dimensionné sur les besoins mesurés. La
 *     pompe à chaleur haute température, plus ambitieuse, remplace du gaz à
 *     52 €/MWh par de l'électricité à 145 €/MWh : elle ne paie pas.
 *   · LE PRIX FIXE PROTÈGE, ET FIGE. Le prix de marché de l'électricité est
 *     tiré au hasard, semaine après semaine, et une canicule le fait flamber.
 *     Un prix fixe sur tout le volume protège, mais trois ans au niveau
 *     actuel figent un prix haut quand le marché à terme est plus bas, et une
 *     clause de volume facture les économies qu'on va faire. Couvrir le talon
 *     mesuré (le froid et les utilités, qui tournent jour et nuit) par un
 *     ruban à prix fixe et laisser le reste au marché arbitre espérance et
 *     robustesse : le meilleur en moyenne ; le prix fixe d'un an sur le volume
 *     mesuré est plus sûr, et plus cher.
 *   · ARRÊTER UNE LIGNE AUX HEURES CHÈRES NE RAPPORTE RIEN. Le contrat est
 *     indexé sur la moyenne mensuelle du marché : seul l'acheminement
 *     distingue les heures, de 12 €/MWh en été. Ce qu'on ne produit pas à
 *     18 heures se rattrape le samedi en heures majorées, ou ne se rattrape
 *     pas : les produits frais ne se stockent pas d'avance, et les ruptures se
 *     paient en pénalités logistiques, puis en déréférencement.
 *   · LA CHAÎNE DU FROID N'EST PAS UNE VARIABLE. Relever la consigne des
 *     chambres froides économise un peu de froid et invalide les durées de vie
 *     validées : autocontrôles non conformes, lots bloqués, parfois un rappel.
 *     La sanction est tirée au hasard ; son espérance dépasse de loin
 *     l'économie. Préparer les groupes froids à la canicule protège ; louer un
 *     groupe de secours protège mieux encore des mauvais tirages, et coûte.
 *
 * L'OBJECTIF, en euros : l'écart au budget énergie du trimestre (la facture,
 * les mesures, les ruptures, les sanctions et les pannes), plus l'écart au
 * budget énergie des douze mois suivants tel que la fin du trimestre permet de
 * l'estimer : la consommation au rythme atteint en semaine 13 (corrigée de la
 * saison et de la dérive des réglages), au prix du contrat engagé et du marché
 * à terme de la semaine 13, avec les annuités des investissements ; moins, pour
 * un contrat de trois ans, ce qu'il coûtera de plus que le marché à terme les
 * deux années suivantes. Le hasard porte sur ce que le trimestre révèle (le
 * marché, la canicule, les pannes, les contrôles), jamais sur les règles du
 * calcul.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LES CONSOMMATIONS D'UNE SEMAINE D'ÉTÉ, PAR USAGE, en MWh.
 * ------------------------------------------------------------------------- */
/** Les groupes froids : chambres froides, eau glacée de refroidissement des produits. */
export const FROID = 175;
/** L'air comprimé que les machines consomment vraiment. */
export const AIR_UTILE = 43;
/** La puissance appelée par les fuites d'air, jour et nuit, toute l'année, en kW. */
export const FUITES_KW = 110;
/** Les heures d'une année : le réseau d'air reste sous pression sans arrêt. */
export const HEURES_AN = 8760;
/** Les fuites, en MWh d'électricité par semaine. */
export const FUITES = (FUITES_KW * 168) / 1000;
export const AIR = AIR_UTILE + FUITES;
/** Moteurs des lignes, homogénéisateurs, pompes, conditionnement. */
export const PROCESS = 150;
/** Éclairage, ventilation, traitement des eaux, bureaux. */
export const UTILITES = 55;
export const ECLAIRAGE = 12;
export const ELEC = FROID + AIR + PROCESS + UTILITES;
/** Le gaz : l'eau chaude des nettoyages en place, et la vapeur des pasteurisateurs. */
export const GAZ_NEP = 250;
export const GAZ_VAPEUR = 290;
export const GAZ = GAZ_NEP + GAZ_VAPEUR;
/** Sur l'année, le froid ne travaille qu'aux quatre cinquièmes de l'été. */
export const SAISON_FROID = 0.8;
/** La consommation annuelle d'électricité au rythme actuel : le « volume actuel » du contrat. */
export const ELEC_AN = Math.round((ELEC - FROID * (1 - SAISON_FROID)) * 52);
export const GAZ_AN = GAZ * 52;
/** L'électricité perdue chaque année dans les fuites d'air comprimé, en MWh : la prévision. */
export const FUITES_AN = (FUITES_KW * HEURES_AN) / 1000;

/* ---------------------------------------------------------------------------
 * LES PRIX, en €/MWh.
 * ------------------------------------------------------------------------- */
/** Acheminement, taxes et contributions de l'électricité : ils ne suivent pas le marché. */
export const ACHEMINEMENT = 42;
/** Le prix de base du marché de gros au début du trimestre. */
export const SPOT = 96;
/** La forme de consommation de l'usine (le jour, la semaine) coûte plus que le ruban. */
export const PROFIL = 1.04;
/** La marge du fournisseur sur le contrat indexé actuel. */
export const MARGE_INDEXE = 3;
/** Le gaz : prix fixe tout compris, signé l'an dernier jusqu'à la fin de l'an prochain. */
export const PRIX_GAZ = 52;
/** L'écart d'acheminement entre heures pleines et heures creuses, en été. */
export const ECART_HEURES = 12;
/** Le prix de l'électricité tout compris au début du trimestre, contrat indexé. */
export const PRIX_ELEC = ACHEMINEMENT + SPOT * PROFIL + MARGE_INDEXE;
/** Le marché à terme des douze prochains mois, rapporté au prix de base : un peu plus bas. */
export const A_TERME = 0.98;
/** Le marché à terme suit la moitié environ des mouvements du prix de base. */
export const SENSIBILITE_TERME = 0.6;
/** Les deux années suivantes, au marché à terme, rapportées à la première. */
export const TERME_SUIVANTS = [0.99, 0.98] as const;
/** La volatilité hebdomadaire du prix de base. */
export const VOLATILITE = 0.025;

/* ---------------------------------------------------------------------------
 * LES CONTRATS proposés en semaine 8, qui s'appliquent en semaine 10.
 * ------------------------------------------------------------------------- */
export const DEBUT_CONTRAT = 10;
export const CONTRAT = {
  /** L'offre du fournisseur : trois ans au niveau actuel, sur tout le volume actuel. */
  triennal: 103,
  /** Le ruban : le marché à terme plus 2 €/MWh, sur 60 % du volume mesuré. */
  margeRuban: 2,
  partRuban: 0.6,
  /** Le prix fixe d'un an sur tout le volume : la forme comprise, plus 3,5 €/MWh. */
  margeFixe: 3.5,
  /** La clause de volume des prix fixes : en deçà de 95 % du volume contractuel… */
  tolerance: 0.95,
  /** … chaque MWh non consommé est facturé 40 €. */
  penalite: 40,
  /** Un ruban plus gros que la consommation se revend au marché moins 8 €/MWh. */
  revente: 8,
} as const;

/* ---------------------------------------------------------------------------
 * LES BUDGETS, LES COÛTS ET LES RISQUES.
 * ------------------------------------------------------------------------- */
/** Le budget énergie du trimestre, électricité et gaz. */
export const BUDGET = 1240000;
/** Le budget énergie de l'an prochain, que la direction financière a mis au plan. */
export const BUDGET_AN = 4350000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : une semaine de plus avec les fuites et les réglages d'avant. */
export const PERTE_PAR_JOUR = 3000;
/** L'annuité d'un investissement sur dix ans à 8 % : 14,9 % du montant net par an. */
export const ANNUITE = 0.149;

export const COUTS = {
  campagne: 16000,
  audit: 32000,
  reglages: 22000,
  note: 2000,
  preparation: 18000,
  location: 50000,
  suivi: 9000,
  /** Les sous-compteurs à poser si personne ne l'a fait : le suivi en a besoin. */
  sousCompteurs: 16000,
  /** Le suivi et les tournées de détection, chaque année. */
  suiviAnnuel: 12000,
} as const;

export const INVESTISSEMENTS = {
  /** Le compresseur à vitesse variable : 12 % d'électricité d'air en moins, à partir de la semaine 10. */
  compresseur: { montant: 165000, aide: 0, gain: 0.12 },
  /** La récupération de chaleur sur les condenseurs : 26 % du gaz des NEP. */
  recuperation: { montant: 520000, aide: 80000, aideReduite: 45000, gain: 0.26 },
  /** La récupération et une pompe à chaleur haute température : 60 % du gaz des NEP. */
  pompe: { montant: 1400000, aide: 160000, aideReduite: 110000, gain: 0.6, cop: 2.8 },
  /** Une chaudière à condensation : 5 % de tout le gaz. */
  chaudiere: { montant: 380000, aide: 30000, gain: 0.05 },
  /** Le relamping LED : la moitié de l'éclairage. */
  led: { montant: 160000, aide: 0, gain: 0.5 },
} as const;
/** Le rendement de la chaudière : la chaleur que donne un MWh de gaz. */
export const RENDEMENT_CHAUDIERE = 0.92;
/** Les chiffres que les sources donnent des investissements : gains annuels, montants nets, délais. */
export const RECUPERATION = (() => {
  const i = INVESTISSEMENTS.recuperation;
  const gazEvite = i.gain * GAZ_NEP * 52;
  const gain = gazEvite * PRIX_GAZ;
  const net = i.montant - i.aide;
  return { gazEvite, gain, net, delai: net / gain, annuite: net * ANNUITE };
})();
export const POMPE = (() => {
  const i = INVESTISSEMENTS.pompe;
  const gazEvite = i.gain * GAZ_NEP * 52;
  // La pompe fournit la chaleur que la récupération ne couvre pas.
  const elec =
    ((i.gain - INVESTISSEMENTS.recuperation.gain) * GAZ_NEP * RENDEMENT_CHAUDIERE * 52) / i.cop;
  const gain = gazEvite * PRIX_GAZ - elec * PRIX_ELEC;
  const net = i.montant - i.aide;
  return { gazEvite, elec, gain, net, annuite: net * ANNUITE };
})();
export const LED = (() => {
  const mwh = INVESTISSEMENTS.led.gain * ECLAIRAGE * 52;
  return { mwh, gain: mwh * PRIX_ELEC, annuite: INVESTISSEMENTS.led.montant * ANNUITE };
})();
/** Une fois sur trois, le dossier de certificats d'économies d'énergie est réduit. */
export const CHANCE_AIDE_REDUITE = 0.35;

/** Les réglages : leur effet, avec les relevés par usage, et à l'estime. */
export const REGLAGES = {
  /** Pendant la campagne de mesure, le technicien répare sur-le-champ les plus grosses fuites. */
  fuitesCampagne: 0.15,
  fuitesMesure: 0.75,
  fuitesEstime: 0.35,
  fuitesNote: 0.1,
  /** Un bar de moins sur le réseau : l'air utile et les fuites baissent. */
  pressionUtile: 0.06,
  pressionFuites: 0.08,
  hpMesure: 0.07,
  hpEstime: 0.035,
  purgeursMesure: 0.05,
  purgeursEstime: 0.025,
} as const;
/** Sans suivi, 40 % des fuites réparées reviennent dans l'année et les réglages dérivent d'un tiers. */
export const RETOUR_FUITES = 0.4;
export const DERIVE = 0.3;
/** La tournée de détection du suivi trouve encore 30 % des fuites restantes. */
export const TOURNEE = 0.3;

/** La ligne 5 arrêtée de 17 à 21 heures, cinq jours sur sept. */
export const LIGNE = {
  /** La puissance de la ligne, en MW, et les heures arrêtées par semaine. */
  puissance: 0.38,
  heures: 20,
  /** Le rattrapage du samedi, en heures majorées. */
  heuresDecalees: 3400,
  /** Les pénalités logistiques et les ventes perdues d'une semaine de ruptures. */
  ruptures: 4800,
  /** Ce que les ruptures retirent au taux de service. */
  service: 0.011,
} as const;
/** L'économie d'une semaine d'arrêt : l'énergie est consommée à une autre heure, à 12 €/MWh de moins. */
export const ECONOMIE_LIGNE = LIGNE.puissance * LIGNE.heures * ECART_HEURES;
/** Le déréférencement d'une référence par Celtis : la marge perdue estimée sur douze mois. */
export const DEREFERENCEMENT = 70000;
export const TAUX_SERVICE = 0.987;
export const OBJECTIF_SERVICE = 0.985;

/** La consigne des chambres froides relevée de 2 °C : 8 % de froid en moins. */
export const RELEVE_FROID = 0.08;
/** Ce que coûtent des lots bloqués et déclassés, et un retrait-rappel. */
export const NON_CONFORMITE = 60000;
export const RAPPEL = 420000;
export const CHANCE_RAPPEL = 0.12;
export const CHANCE_NON_CONFORMITE = 0.4;

/** Une panne de groupe froid en pleine canicule : produits détruits ou déclassés, ruptures. */
export const PERTE_PANNE = 240000;
/** La même avec un groupe de secours déjà raccordé : quelques heures de bascule. */
export const PERTE_PANNE_SECOURS = 12000;
/** La préparation des groupes froids : 3 % de froid en moins, et 10 % de plus pendant la canicule. */
export const PREPARATION = { froid: 0.03, canicule: 0.1 } as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  mesure: 0,
  reglages: 1,
  canicule: 2,
  chaleur: 3,
  contrat: 4,
  suivi: 5,
} as const;

/** Ne rien changer, décision par décision : rester au contrat indexé. */
export const NEUTRE = [3, 3, 3, 2, 3, 3] as const;

/* ---------------------------------------------------------------------------
 * LE HASARD : la canicule, le marché, les imprévus.
 * ------------------------------------------------------------------------- */
export type NomCanicule = "aucune" | "moderee" | "forte";
export const CANICULES: Record<
  NomCanicule,
  {
    p: number;
    nom: string;
    semaines: number;
    froid: number;
    prix: number;
    /** Le risque de panne d'un groupe froid : non préparé, préparé. */
    panne: readonly [number, number];
  }
> = {
  aucune: { p: 0.35, nom: "pas de canicule", semaines: 0, froid: 0, prix: 1, panne: [0, 0] },
  moderee: {
    p: 0.4,
    nom: "une canicule modérée",
    semaines: 2,
    froid: 0.15,
    prix: 1.3,
    panne: [0.3, 0.12],
  },
  forte: {
    p: 0.25,
    nom: "une forte canicule",
    semaines: 3,
    froid: 0.28,
    prix: 1.7,
    panne: [0.7, 0.4],
  },
};

export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  duree: number;
  effet: { cout?: number; process?: number; vapeur?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "microcoupure",
    titre: "Micro-coupure du réseau électrique",
    de: "Erwann Tromeur",
    role: "Chef de l'atelier de conditionnement",
    texte:
      "Un orage a provoqué une micro-coupure de deux secondes : les six lignes se sont arrêtées, deux NEP sont à refaire et les pots en cours de dosage sont déclassés. 16 000 € de perte.",
    duree: 1,
    effet: { cout: 16000 },
  },
  {
    id: "compresseur",
    titre: "Panne d'un compresseur d'air",
    de: "Klervi Nédélec",
    role: "Responsable maintenance",
    texte:
      "Le compresseur n° 2 a cassé un roulement. Un compresseur de location tourne deux semaines, le temps de la réparation : 9 500 €.",
    duree: 1,
    effet: { cout: 9500 },
  },
  {
    id: "promotion",
    titre: "Opération promotionnelle de Celtis",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Celtis lance une opération sur les yaourts aromatisés : 8 % de production en plus pendant deux semaines, et autant de nettoyages.",
    duree: 2,
    effet: { process: 1.08, vapeur: 1.05 },
  },
  {
    id: "bruleur",
    titre: "Brûleur de chaudière déréglé",
    de: "Klervi Nédélec",
    role: "Responsable maintenance",
    texte:
      "Le brûleur de la chaudière vapeur s'est déréglé : 7 % de gaz en plus pendant deux semaines, le temps que le chauffagiste passe.",
    duree: 2,
    effet: { vapeur: 1.07 },
  },
  {
    id: "regularisation",
    titre: "Régularisation de l'acheminement",
    de: "Iwan Szymanski",
    role: "Directeur administratif et financier",
    texte:
      "Le gestionnaire du réseau régularise un an de dépassements de puissance souscrite : 12 400 € sur la facture de ce mois.",
    duree: 1,
    effet: { cout: 12400 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le prix de base du marché, rapporté à celui du début du trimestre, hors pic de canicule. */
  marche: readonly number[];
  canicule: NomCanicule;
  /** La première semaine de canicule. */
  debutCanicule: number;
  /** Un groupe froid tombe-t-il en panne pendant la canicule ? */
  uPanne: number;
  /** Les contrôles sanctionnent-ils une consigne de froid relevée ? */
  uSanction: number;
  /** Celtis déréférence-t-il une référence après des ruptures ? */
  uRupture: number;
  /** Ce que la chaleur récupérée couvre vraiment des besoins des NEP. */
  uTaille: number;
  /** Le dossier de certificats d'économies d'énergie est-il réduit ? */
  uAide: number;
  /** Le bruit du taux de service, semaine par semaine. */
  service: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001093 + 7);
  const marche: number[] = [1];
  const service: number[] = [0];
  let m = 1;
  for (let w = 1; w <= SEMAINES; w += 1) {
    m *= Math.exp(VOLATILITE * gauss(r) - (VOLATILITE * VOLATILITE) / 2);
    marche.push(m);
    service.push(Math.min(0.004, Math.max(-0.004, 0.0015 * gauss(r))));
  }
  const u = r();
  const canicule: NomCanicule =
    u < CANICULES.aucune.p
      ? "aucune"
      : u < CANICULES.aucune.p + CANICULES.moderee.p
        ? "moderee"
        : "forte";
  const debutCanicule = 5 + Math.floor(r() * 2);
  const uPanne = r();
  const uSanction = r();
  const uRupture = r();
  const uTaille = r();
  const uAide = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = {
    marche,
    canicule,
    debutCanicule,
    uPanne,
    uSanction,
    uRupture,
    uTaille,
    uAide,
    service,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/** La semaine est-elle dans la canicule ? */
export const enCanicule = (h: Hasard, w: number) =>
  w >= h.debutCanicule && w < h.debutCanicule + CANICULES[h.canicule].semaines;

/** Le marché à terme des douze prochains mois, en €/MWh, tel qu'on le lit en semaine `w`. */
export const aTerme = (graine: number, w: number) =>
  SPOT * A_TERME * (1 + SENSIBILITE_TERME * (hasard(graine).marche[w]! - 1));

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Les relevés par usage existent : la campagne dès la semaine 2, l'audit à partir de la semaine 5. */
export const mesureDes = (chemin: readonly number[], w: number) =>
  (chemin[D.mesure] === 1 && w >= 2) || (chemin[D.mesure] === 2 && w >= 5);

/** Le risque qu'un groupe froid tombe en panne pendant la canicule. */
export function risquePanne(chemin: readonly number[], canicule: NomCanicule): number {
  const prepare = chemin[D.canicule] === 1 || chemin[D.canicule] === 2;
  return CANICULES[canicule].panne[prepare ? 1 : 0];
}
export const pannePendantCanicule = (chemin: readonly number[], graine: number) => {
  const h = hasard(graine);
  return h.uPanne < risquePanne(chemin, h.canicule);
};

/** La consigne relevée est sanctionnée : un rappel, ou des lots bloqués, ou rien. */
export function sanction(chemin: readonly number[], graine: number): "rappel" | "lots" | null {
  if (chemin[D.canicule] !== 0) return null;
  const u = hasard(graine).uSanction;
  return u < CHANCE_RAPPEL ? "rappel" : u < CHANCE_NON_CONFORMITE ? "lots" : null;
}

/** Les semaines où la ligne 5 est arrêtée aux heures chères. */
export const ligneArretee = (chemin: readonly number[], w: number) =>
  (chemin[D.mesure] === 0 && w >= 2 && w <= 9) || (chemin[D.suivi] === 1 && w >= 11);

/** Le risque que Celtis déréférence une référence : il grandit avec les semaines de ruptures. */
export function risqueDereferencement(chemin: readonly number[]): number {
  const ete = chemin[D.mesure] === 0;
  const septembre = chemin[D.suivi] === 1;
  return ete && septembre ? 0.45 : ete ? 0.35 : septembre ? 0.15 : 0;
}
export const dereference = (chemin: readonly number[], graine: number) =>
  hasard(graine).uRupture < risqueDereferencement(chemin);
/** La semaine où Celtis l'annonce. */
export const semaineDereferencement = (chemin: readonly number[]) =>
  chemin[D.mesure] === 0 ? 9 : 13;

/** Le dossier d'aide de la récupération de chaleur est-il réduit ? */
export const aideReduite = (graine: number) => hasard(graine).uAide < CHANCE_AIDE_REDUITE;

/**
 * CE QUE LA CHALEUR RÉCUPÉRÉE COUVRE VRAIMENT. Dimensionnée sur les besoins
 * mesurés des NEP, elle donne ce qui est promis, à quelques pourcents près ;
 * dimensionnée sur la puissance plaque des groupes froids, elle tombe souvent
 * aux heures où les NEP ne tournent pas.
 */
export function tauxDeCouverture(chemin: readonly number[], graine: number): number {
  const u = hasard(graine).uTaille;
  return mesureDes(chemin, 6) ? 0.9 + 0.15 * u : 0.45 + 0.55 * u;
}

/* ---------------------------------------------------------------------------
 * LA CONSOMMATION D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */
interface Etat {
  /** La part des fuites réparées. */
  fuites: number;
  pression: boolean;
  hp: number;
  purgeurs: number;
  preparation: boolean;
  releve: boolean;
  compresseur: boolean;
  recuperation: number;
  pompe: number;
  chaudiere: boolean;
  led: boolean;
  note: boolean;
}

/** Ce que consomme une semaine dans un état donné ; `canicule` : la hausse du froid. */
function consommer(e: Etat, canicule: number, saison = 1) {
  const froid =
    FROID *
    saison *
    (1 + canicule) *
    (1 - e.hp) *
    (1 - (e.preparation ? PREPARATION.froid + (canicule > 0 ? PREPARATION.canicule : 0) : 0)) *
    (1 - (e.releve ? RELEVE_FROID : 0));
  const fuites = FUITES * (1 - e.fuites) * (e.pression ? 1 - REGLAGES.pressionFuites : 1);
  const utile = AIR_UTILE * (e.pression ? 1 - REGLAGES.pressionUtile : 1);
  const air = (utile + fuites) * (e.compresseur ? 1 - INVESTISSEMENTS.compresseur.gain : 1);
  const utilites =
    (UTILITES - (e.led ? ECLAIRAGE * INVESTISSEMENTS.led.gain : 0)) * (e.note ? 0.98 : 1);
  const nep = GAZ_NEP * (1 - e.recuperation - e.pompe);
  // La pompe à chaleur fournit la chaleur que la récupération ne couvre pas, à partir d'électricité.
  const pac = (GAZ_NEP * e.pompe * RENDEMENT_CHAUDIERE) / INVESTISSEMENTS.pompe.cop;
  const vapeur = GAZ_VAPEUR * (1 - e.purgeurs);
  const chaudiere = e.chaudiere ? 1 - INVESTISSEMENTS.chaudiere.gain : 1;
  return {
    froid,
    air,
    fuitesKw: (FUITES_KW * fuites) / FUITES,
    process: PROCESS,
    utilites: utilites + pac,
    nep: nep * chaudiere,
    vapeur: vapeur * chaudiere,
  };
}

/** L'état de l'usine en semaine `w`, décisions appliquées. */
function etat(chemin: readonly number[], graine: number, w: number): Etat {
  const [, d2, d3, d4, , d6] = chemin;
  const mesure = mesureDes(chemin, 2);
  let fuites = chemin[D.mesure] === 1 && w >= 2 ? REGLAGES.fuitesCampagne : 0;
  if (d2 === 0 && w >= 4) fuites = mesure ? REGLAGES.fuitesMesure : REGLAGES.fuitesEstime;
  if (d2 === 2 && w >= 4) fuites = Math.max(fuites, REGLAGES.fuitesNote);
  if (d6 === 0 && w >= 12) fuites += TOURNEE * (1 - fuites);
  const reglages = d2 === 0 && w >= 4;
  const couverture = tauxDeCouverture(chemin, graine);
  return {
    fuites,
    pression: reglages,
    hp: reglages ? (mesure ? REGLAGES.hpMesure : REGLAGES.hpEstime) : 0,
    purgeurs: reglages ? (mesure ? REGLAGES.purgeursMesure : REGLAGES.purgeursEstime) : 0,
    preparation: (d3 === 1 || d3 === 2) && w >= 5,
    releve: d3 === 0 && w >= 5 && w <= 8,
    compresseur: d2 === 1 && w >= 10,
    recuperation:
      (d4 === 0 && w >= 12) || (d4 === 1 && w >= 13)
        ? INVESTISSEMENTS.recuperation.gain * couverture
        : 0,
    pompe:
      d4 === 1 && w >= 13
        ? (INVESTISSEMENTS.pompe.gain - INVESTISSEMENTS.recuperation.gain) * couverture
        : 0,
    chaudiere: d4 === 3 && w >= 12,
    led: d6 === 2 && w >= 13,
    note: d2 === 2 && w >= 3,
  };
}

/** L'état que l'usine garde sur l'année qui suit : sans suivi, les fuites reviennent et les réglages dérivent. */
function etatDurable(chemin: readonly number[], graine: number): Etat {
  const e = etat(chemin, graine, SEMAINES);
  const suivi = chemin[D.suivi] === 0;
  const garde = suivi ? 1 : 1 - DERIVE;
  return {
    ...e,
    fuites: suivi ? e.fuites : e.fuites * (1 - RETOUR_FUITES),
    hp: e.hp * garde,
    purgeurs: e.purgeurs * garde,
    preparation: e.preparation,
    releve: false,
    note: false,
    // Les investissements décidés travaillent toute l'année qui suit.
    recuperation:
      chemin[D.chaleur] === 0 || chemin[D.chaleur] === 1
        ? INVESTISSEMENTS.recuperation.gain * tauxDeCouverture(chemin, graine)
        : 0,
    pompe:
      chemin[D.chaleur] === 1
        ? (INVESTISSEMENTS.pompe.gain - INVESTISSEMENTS.recuperation.gain) *
          tauxDeCouverture(chemin, graine)
        : 0,
    chaudiere: chemin[D.chaleur] === 3,
    compresseur: chemin[D.reglages] === 1,
    led: chemin[D.suivi] === 2,
  };
}

/** La consommation d'une année dans un état donné, en MWh : électricité, gaz. */
function annee(e: Etat) {
  const c = consommer(e, 0, SAISON_FROID);
  return {
    elec: 52 * (c.froid + c.air + c.process + c.utilites),
    gaz: 52 * (c.nep + c.vapeur),
  };
}

/**
 * LE VOLUME MESURÉ, celui sur lequel on peut dimensionner un contrat en
 * semaine 8 : la consommation d'une année au rythme que les décisions déjà
 * prises vont donner, sans suivi. Sans relevés par usage, on n'a que le volume
 * des douze derniers mois.
 */
export function volumeMesure(chemin: readonly number[], graine: number): number {
  if (!mesureDes(chemin, 8)) return ELEC_AN;
  const c = [...chemin];
  c[D.suivi] = 3;
  return Math.round(annee(etatDurable(c, graine)).elec);
}

/* ---------------------------------------------------------------------------
 * LE CONTRAT : ce que coûte la fourniture d'électricité.
 * ------------------------------------------------------------------------- */
/** La pénalité de la clause de volume d'un prix fixe. */
const penalite = (contractuel: number, consomme: number) =>
  Math.max(0, CONTRAT.tolerance * contractuel - consomme) * CONTRAT.penalite;

/** Le prix d'un MWh indexé, quand le prix de base vaut `base` €/MWh. */
const indexe = (base: number) => base * PROFIL + MARGE_INDEXE;

/** La fourniture d'un volume `v` (MWh) au contrat `k`, avec un prix de base `base` et le terme `f8` de la signature. */
function fourniture(
  k: number,
  v: number,
  base: number,
  f8: number,
  vMesure: number,
  periode: number,
): number {
  if (k === 0) return v * CONTRAT.triennal;
  if (k === 1) {
    const ruban = CONTRAT.partRuban * vMesure * periode;
    const prixRuban = f8 + CONTRAT.margeRuban;
    return (
      ruban * prixRuban +
      Math.max(0, v - ruban) * indexe(base) -
      Math.max(0, ruban - v) * (base - CONTRAT.revente)
    );
  }
  if (k === 2) return v * (f8 * PROFIL + CONTRAT.margeFixe);
  return v * indexe(base);
}

export type Semaine = {
  /** L'électricité et le gaz consommés dans la semaine, en MWh. */
  elec: number;
  gaz: number;
  froid: number;
  /** La puissance appelée par les fuites d'air, en kW. */
  fuitesKw: number;
  /** Le prix de l'électricité de la semaine, tout compris, au contrat indexé, en €/MWh. */
  prixMarche: number;
  /** Le prix payé, tout compris, en €/MWh d'électricité. */
  prixPaye: number;
  /** La facture d'énergie de la semaine. */
  facture: number;
  /** Mesures, ruptures, sanctions, pannes et imprévus de la semaine. */
  autres: number;
  cout: number;
  /** Le cumul depuis le début du trimestre. */
  couts: number;
  factures: number;
  service: number;
  canicule: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Ce que le trimestre et les douze mois suivants coûtent de moins que leurs budgets ; plus c'est haut, mieux c'est. */
  objectif: number;
  /** L'écart au budget du trimestre. */
  ecartTrimestre: number;
  /** L'écart au budget de l'an prochain, estimé en semaine 13. */
  ecartAnnee: number;
  /** Ce que le contrat de trois ans coûtera de plus que le marché à terme les deux années suivantes. */
  auDela: number;
  facture: number;
  couts: number;
  /** Mesures, ruptures, sanctions et pannes du trimestre. */
  autres: number;
  ruptures: number;
  /** L'année suivante : consommations, coût, et ce que les investissements y coûtent. */
  annee: { elec: number; gaz: number; cout: number; annuites: number; fourniture: number };
  /** Les économies d'énergie que l'usine garde sur l'année qui suit, en MWh et en euros. */
  economiesMwh: number;
  economies: number;
  volumeMesure: number;
  penaliteVolume: number;
  aTerme13: number;
  canicule: NomCanicule;
  panne: boolean;
  /** Une panne sans groupe de secours : des produits à déclasser. */
  casse: boolean;
  sanction: "rappel" | "lots" | null;
  dereference: boolean;
  aideReduite: boolean;
  serviceMoyen: number;
  elecMoyenne: number;
}

/** Les annuités des investissements décidés, sur douze mois. */
function annuites(chemin: readonly number[], graine: number): number {
  const reduite = aideReduite(graine);
  let a = 0;
  if (chemin[D.reglages] === 1) a += INVESTISSEMENTS.compresseur.montant;
  const ch = chemin[D.chaleur];
  if (ch === 0) {
    const i = INVESTISSEMENTS.recuperation;
    a += i.montant - (reduite ? i.aideReduite : i.aide);
  }
  if (ch === 1) {
    const i = INVESTISSEMENTS.pompe;
    a += i.montant - (reduite ? i.aideReduite : i.aide);
  }
  if (ch === 3) a += INVESTISSEMENTS.chaudiere.montant - INVESTISSEMENTS.chaudiere.aide;
  if (chemin[D.suivi] === 2) a += INVESTISSEMENTS.led.montant;
  return a * ANNUITE;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, , d5, d6] = chemin;
  const can = CANICULES[h.canicule];
  const panne = pannePendantCanicule(chemin, graine) && can.semaines > 0;
  const semainePanne = h.debutCanicule + 1;
  const sanct = sanction(chemin, graine);
  const deref = dereference(chemin, graine);
  const vMesure = volumeMesure(chemin, graine);
  const f8 = aTerme(graine, 8);
  const semaines: (Semaine | null)[] = [null];
  let couts = 0;
  let factures = 0;
  let autresTotal = 0;
  let ruptures = 0;
  let elecTotal = 0;
  let serviceTotal = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const chaud = enCanicule(h, w);
    const e = etat(chemin, graine, w);
    const c = consommer(e, chaud ? can.froid : 0);
    let process = c.process;
    let vapeur = c.vapeur;
    let nep = c.nep;
    for (const a of actifs) {
      process *= a.imprevu.effet.process ?? 1;
      vapeur *= a.imprevu.effet.vapeur ?? 1;
      nep *= a.imprevu.effet.process ? 1.05 : 1;
    }
    const elec = c.froid + c.air + process + c.utilites;
    const gaz = nep + vapeur;

    // Le prix : le contrat indexé jusqu'en semaine 9, puis le contrat choisi.
    const base = SPOT * h.marche[w]! * (chaud ? can.prix : 1);
    const k = w >= DEBUT_CONTRAT ? (d5 ?? 3) : 3;
    let four = fourniture(k, elec, base, f8, vMesure, 1 / 52);
    const arretee = ligneArretee(chemin, w);
    // Arrêter la ligne aux heures chères : l'énergie se consomme à une autre heure, 12 €/MWh moins cher.
    if (arretee) four -= ECONOMIE_LIGNE;
    const facture = elec * ACHEMINEMENT + four + gaz * PRIX_GAZ;

    // Les mesures, les ruptures, les sanctions, les pannes, les imprévus.
    let autres = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
    if (d1 === 1 && w === 2) autres += COUTS.campagne;
    if (d1 === 2 && w === 5) autres += COUTS.audit;
    if (d2 === 0 && (w === 3 || w === 4)) autres += COUTS.reglages / 2;
    if (d2 === 2 && w === 3) autres += COUTS.note;
    if ((d3 === 1 || d3 === 2) && w === 5) autres += COUTS.preparation;
    if (d3 === 2 && w === 5) autres += COUTS.location;
    if (d6 === 0 && w === 11) {
      autres += COUTS.suivi + (mesureDes(chemin, 11) ? 0 : COUTS.sousCompteurs);
    }
    let service = TAUX_SERVICE + h.service[w]!;
    if (arretee) {
      const r = LIGNE.heuresDecalees + LIGNE.ruptures;
      autres += r;
      ruptures += r;
      service -= LIGNE.service;
    }
    if (deref && w === semaineDereferencement(chemin)) {
      autres += DEREFERENCEMENT;
      ruptures += DEREFERENCEMENT;
    }
    if (panne && w === semainePanne) {
      autres += d3 === 2 ? PERTE_PANNE_SECOURS : PERTE_PANNE;
      if (d3 !== 2) service -= 0.02;
    }
    if (sanct === "lots" && w === 7) {
      autres += NON_CONFORMITE;
      service -= 0.01;
    }
    if (sanct === "rappel" && w === 8) {
      autres += RAPPEL;
      service -= 0.02;
    }
    for (const a of actifs) if (a.semaine === w) autres += a.imprevu.effet.cout ?? 0;
    for (const a of actifs) if (a.imprevu.effet.process) service -= 0.002;

    const cout = facture + autres;
    couts += cout;
    factures += facture;
    autresTotal += autres;
    elecTotal += elec;
    serviceTotal += service;
    semaines.push({
      elec,
      gaz,
      froid: c.froid,
      fuitesKw: c.fuitesKw,
      prixMarche: ACHEMINEMENT + indexe(base),
      prixPaye: ACHEMINEMENT + four / elec,
      facture,
      autres,
      cout,
      couts,
      factures,
      service,
      canicule: chaud ? 1 : 0,
    });
  }

  // L'année qui suit, estimée en semaine 13.
  const durable = etatDurable(chemin, graine);
  const an = annee(durable);
  const f13 = aTerme(graine, SEMAINES);
  const k = d5 ?? 3;
  const four = fourniture(k, an.elec, f13, f8, vMesure, 1);
  const contractuel = k === 0 ? ELEC_AN : vMesure;
  const penaliteVolume = k === 0 || k === 2 ? penalite(contractuel, an.elec) : 0;
  const ann = annuites(chemin, graine);
  const suiviAnnuel = d6 === 0 ? COUTS.suiviAnnuel : 0;
  const coutAnnee =
    an.elec * ACHEMINEMENT + four + penaliteVolume + an.gaz * PRIX_GAZ + ann + suiviAnnuel;
  // Le contrat de trois ans, les deux années suivantes, comparé au marché à terme.
  let auDela = 0;
  if (k === 0) {
    for (const t of TERME_SUIVANTS) {
      auDela += an.elec * (CONTRAT.triennal - indexe(f13 * t)) + penaliteVolume;
    }
  }
  const reference = annee(etatDurable([3, 3, 3, 2, 3, 3], graine));
  const economiesMwh = reference.elec + reference.gaz - an.elec - an.gaz;
  const economies =
    (reference.elec - an.elec) * (ACHEMINEMENT + indexe(f13)) + (reference.gaz - an.gaz) * PRIX_GAZ;

  const ecartTrimestre = BUDGET - couts;
  const ecartAnnee = BUDGET_AN - coutAnnee;
  return {
    semaines,
    objectif: ecartTrimestre + ecartAnnee - auDela,
    ecartTrimestre,
    ecartAnnee,
    auDela,
    facture: factures,
    couts,
    autres: autresTotal,
    ruptures,
    annee: { elec: an.elec, gaz: an.gaz, cout: coutAnnee, annuites: ann, fourniture: four },
    economiesMwh,
    economies,
    volumeMesure: vMesure,
    penaliteVolume,
    aTerme13: f13,
    canicule: h.canicule,
    panne,
    casse: panne && d3 !== 2,
    sanction: sanct,
    dereference: deref,
    aideReduite: (chemin[D.chaleur] === 0 || chemin[D.chaleur] === 1) && aideReduite(graine),
    serviceMoyen: serviceTotal / SEMAINES,
    elecMoyenne: elecTotal / SEMAINES,
  };
}

/** Ce qui s'est passé pendant des semaines : canicule, panne, contrôles, Celtis, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    t,
    canicule: h.canicule !== "aucune" && dans(h.debutCanicule),
    panne: t.panne && dans(h.debutCanicule + 1),
    lots: t.sanction === "lots" && dans(7),
    rappel: t.sanction === "rappel" && dans(8),
    dereference: t.dereference && dans(semaineDereferencement(chemin)),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureEnergie {
  facture: number | null;
  elec: number | null;
  prixMarche: number | null;
  fuitesKw: number | null;
  service: number | null;
  budgetADate: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  gaz: number | null;
  froid: number | null;
  couts: number | null;
  aTerme: number | null;
  volumeMesure: number | null;
  canicule: number | null;
}

/** La part du budget du trimestre consommée à chaque semaine : un peu plus en été qu'en septembre. */
const PROFIL_BUDGET = (() => {
  const poids = Array.from({ length: SEMAINES + 1 }, (_, w): number =>
    w === 0 ? 0 : w <= 9 ? 1.03 : 0.95,
  );
  const total = poids.reduce((s, x) => s + x, 0);
  let cumul = 0;
  return poids.map((p) => {
    cumul += p;
    return cumul / total;
  });
})();

/**
 * Ce que Djibril lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ». La puissance des fuites n'est connue qu'une fois
 * les relevés faits.
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureEnergie {
  if (semaine === 0) {
    return {
      facture: 0,
      elec: ELEC,
      prixMarche: PRIX_ELEC,
      fuitesKw: null,
      service: TAUX_SERVICE,
      budgetADate: 0,
      gaz: GAZ,
      froid: FROID,
      couts: 0,
      aTerme: SPOT * A_TERME,
      volumeMesure: ELEC_AN,
      canicule: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    facture: s.factures,
    elec: s.elec,
    prixMarche: s.prixMarche,
    fuitesKw: mesureDes(chemin, semaine) ? s.fuitesKw : null,
    service: s.service,
    budgetADate: BUDGET * PROFIL_BUDGET[semaine]!,
    gaz: s.gaz,
    froid: s.froid,
    couts: s.couts,
    aTerme: aTerme(graine, semaine),
    volumeMesure: volumeMesure(chemin, graine),
    canicule: s.canicule,
  };
}
