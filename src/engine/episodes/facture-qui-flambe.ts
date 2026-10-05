/**
 * LA FACTURE QUI FLAMBE — le modèle de l'énergie d'Arvel Distribution.
 *
 * Une plateforme logistique de 18 000 m² sous onze mètres de plafond, sept
 * agences, un contrat d'électricité et de gaz qui arrive à échéance à la fin
 * de la semaine 4, et un hiver qui commence. Treize semaines, six décisions.
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · L'ÉNERGIE PART QUAND LES SITES SONT FERMÉS. Près de la moitié des MWh
 *     sont consommés la nuit et le week-end : aérothermes qui chauffent un
 *     dépôt vide à 17 °C, éclairage oublié, compresseur qui fuit, agences
 *     sans programmateur. Couper ce talon ne gêne personne. Couper le
 *     chauffage partout, au contraire, gêne tout le monde : l'adhésion
 *     s'effondre, les radiateurs d'appoint sortent des placards, les
 *     consignes sont contournées, et le CSE peut exercer son droit d'alerte.
 *     L'efficacité d'un plan de sobriété dépend de deux choses : savoir où
 *     agir (les sous-compteurs) et l'adhésion des équipes.
 *   · LE PRIX FIXE PROTÈGE, ET SE PAIE. Le marché est volatil, et une vague
 *     de froid le fait flamber. Un contrat à prix fixe est sûr mais porte une
 *     prime de risque ; celui du fournisseur historique, signé dans l'urgence,
 *     y ajoute une clause de volume serrée qui facture la sous-consommation :
 *     il fait payer les économies mêmes qu'on va faire. Le contrat mixte (un
 *     ruban fixe, moins cher, sur la moitié du volume historique, le reste au
 *     prix du marché) laisse la sobriété porter sur la part indexée : le
 *     meilleur en moyenne, un peu moins sûr que le prix fixe négocié. Tout
 *     indexer, c'est s'exposer entièrement au froid.
 *   · LA PREUVE CONVAINC, L'AFFICHAGE FAIT FUIR. Ostral Construction, le plus
 *     gros client, exige un bilan carbone et un plan de réduction chiffré pour
 *     renouveler son contrat. Un plan fondé sur des mesures et des actions
 *     engagées le convainc ; une brochure ou des garanties d'origine, que son
 *     auditeur sait lire, le font partir.
 *
 * Le trimestre est jugé en euros : l'écart au budget énergie du trimestre,
 * en comptant la marge d'un trimestre d'Ostral si le contrat n'est pas
 * renouvelé.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les degrés-jours de chauffage d'une semaine normale, d'octobre à fin décembre, à Lyon. */
export const DJU = [0, 35, 45, 55, 62, 70, 78, 85, 90, 95, 100, 105, 110, 112] as const;
/** Le gaz de chauffage, en MWh par degré-jour : la plateforme, puis les agences. */
export const GAZ_DEPOT = 0.62;
export const GAZ_AGENCES = 0.42;
/** La part du chauffage qui tourne sites fermés, la nuit et le week-end. */
export const NUIT_DEPOT = 0.55;
export const NUIT_AGENCES = 0.4;
/** L'électricité d'une semaine, en MWh. */
export const ELEC_TALON_INCOMPRESSIBLE = 8;
/** Éclairage oublié, compresseur qui fuit, ventilation et convecteurs des agences, la nuit. */
export const ELEC_TALON_EVITABLE = 10;
export const ELEC_JOUR = 18;
/** L'éclairage de la plateforme pendant les heures d'ouverture. */
export const ELEC_ECLAIRAGE = 12;

/** L'ancien contrat, jusqu'à la fin de la semaine 4, en €/MWh tout compris. */
export const ANCIEN = { elec: 95, gaz: 40 } as const;
/** Le prix à terme du trimestre à la signature, en €/MWh tout compris. */
export const MARCHE = { elec: 160, gaz: 62 } as const;
/** La semaine où le nouveau contrat s'applique. */
export const DEBUT_CONTRAT = 5;
/** Les prix des contrats, rapportés au prix à terme. */
export const PRIX = {
  historique: 1.22,
  fixe: 1.1,
  ruban: 1.04,
  /** Les frais de gestion de la part indexée. */
  indexe: 1.03,
} as const;
/** Le ruban du contrat mixte : la moitié du volume historique. */
export const PART_RUBAN = 0.5;
/**
 * La clause de volume des contrats fixes : en deçà de 90 % du volume
 * contractuel chez le fournisseur historique, de 70 % dans l'offre négociée
 * par le courtier…
 */
export const TOLERANCE = { historique: 0.9, fixe: 0.7 } as const;
/** … l'écart est facturé à 35 % du prix. */
export const PENALITE_VOLUME = 0.35;

/** Les facteurs d'émission, en tonnes de CO₂ par MWh. */
export const CO2 = { elec: 0.052, gaz: 0.227 } as const;

/** Le budget énergie du trimestre : l'an dernier plus 45 %, pas un euro de plus. */
export const BUDGET = 150000;
/** La marge d'un trimestre du contrat d'Ostral Construction. */
export const MARGE_OSTRAL = 45000;
export const OBJECTIF_INDICE = 85;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des nuits de chauffage et d'éclairage pour rien. */
export const PERTE_PAR_JOUR = 1200;
/** Les produits qui craignent le gel, perdus si le dépôt gèle. */
export const PERTE_GEL = 35000;
/** Ce que le réseau paie, par semaine de froid, à un site qui sait baisser sa pointe. */
export const EFFACEMENT = 2500;
/** La remise qu'Ostral exige pour attendre le plan. */
export const REMISE_DELAI = 4000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  premier: 0,
  contrat: 1,
  sobriete: 2,
  investissement: 3,
  ostral: 4,
  froid: 5,
} as const;

/** Ne rien changer, décision par décision : le contrat se renouvelle chez le fournisseur historique. */
export const NEUTRE = [3, 0, 3, 3, 3, 3] as const;

export const COUTS = {
  sousCompteurs: 2800,
  affiches: 600,
  courtier: 1500,
  referents: 1500,
  defi: 1000,
  /** Le loyer hebdomadaire des LED, aides déduites, à partir de la semaine 9. */
  led: 550,
  /** Celui des déstratificateurs et des rideaux d'air. */
  destrat: 120,
  etude: 9000,
  bilanCarbone: 4000,
  brochure: 1500,
  garanties: 6000,
  regroupement: 1000,
  couverture: 500,
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
  effet: { cout?: number; elec?: number; conso?: number; acheminement?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "chaudiere",
    titre: "Panne de chaudière dans une agence",
    de: "Killian Le Goff",
    role: "Technicien de maintenance",
    texte:
      "La chaudière de l'agence de Vaulx a lâché : échangeur percé. Chauffage provisoire loué et réparation, 3 200 €.",
    duree: 1,
    effet: { cout: 3200 },
  },
  {
    id: "acheminement",
    titre: "Hausse du tarif d'acheminement",
    de: "Noémie Lacaze",
    role: "Comptable fournisseurs",
    texte:
      "Le tarif d'acheminement de l'électricité augmente de 6 €/MWh jusqu'à la fin du trimestre, quel que soit le contrat.",
    duree: 13,
    effet: { acheminement: 6 },
  },
  {
    id: "regularisation",
    titre: "Régularisation d'un relevé estimé",
    de: "Noémie Lacaze",
    role: "Comptable fournisseurs",
    texte:
      "Le distributeur a relevé le compteur de gaz de l'agence de Décines, estimé depuis un an : 4 100 € de régularisation.",
    duree: 1,
    effet: { cout: 4100 },
  },
  {
    id: "samedis",
    titre: "Deux samedis d'ouverture pour un chantier",
    de: "Hakim Boukhari",
    role: "Chef de la plateforme de Saint-Priest",
    texte:
      "Un promoteur livre deux immeubles d'un coup : la plateforme ouvre deux samedis de suite, chauffée et éclairée.",
    duree: 2,
    effet: { conso: 1.08 },
  },
  {
    id: "compresseur",
    titre: "Fuite sur le réseau d'air comprimé",
    de: "Killian Le Goff",
    role: "Technicien de maintenance",
    texte:
      "Un raccord a cédé sur le réseau d'air comprimé du quai 4 : le compresseur tourne en continu, le temps de trouver la pièce.",
    duree: 3,
    effet: { elec: 3 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Les degrés-jours réels de chaque semaine, vague de froid comprise. */
  dju: readonly number[];
  /** Le prix du marché, rapporté au prix à terme de la signature. */
  marche: readonly number[];
  /** Une vague de froid frappe-t-elle les semaines 11 à 13 ? */
  froid: boolean;
  /** Le CSE exerce-t-il son droit d'alerte si l'on coupe le chauffage contre l'avis des équipes ? */
  uCse: number;
  /** Les produits gèlent-ils si le dépôt est coupé pendant le froid ? */
  uGel: number;
  /** Ostral renouvelle-t-il son contrat ? */
  uOstral: number;
  /** Ostral accepte-t-il d'attendre le plan ? */
  uDelai: number;
  imprevus: readonly ImprevuTire[];
}

/** Quatre chances sur dix d'une vague de froid à partir de la semaine 11. */
export const CHANCE_FROID = 0.4;
export const SEMAINE_FROID = 11;
/** Pendant la vague de froid, les degrés-jours et les prix du marché montent. */
export const FROID = { dju: 1.35, marche: 1.7 } as const;
/** La volatilité hebdomadaire du marché. */
export const VOLATILITE = 0.065;

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000151 + 7);
  const meteo: number[] = [0];
  const marche: number[] = [1];
  let m = 1;
  for (let w = 1; w <= SEMAINES; w += 1) {
    meteo.push(Math.min(1.3, Math.max(0.75, 1 + 0.12 * gauss(r))));
    m *= Math.exp(VOLATILITE * gauss(r) - (VOLATILITE * VOLATILITE) / 2);
    marche.push(m);
  }
  const froid = r() < CHANCE_FROID;
  const uCse = r();
  const uGel = r();
  const uOstral = r();
  const uDelai = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const dju = meteo.map((x, w) =>
    w ? DJU[w]! * x * (froid && w >= SEMAINE_FROID ? FROID.dju : 1) : 0,
  );
  const prix = marche.map((x, w) => (froid && w >= SEMAINE_FROID ? x * FROID.marche : x));
  const h = { dju, marche: prix, froid, uCse, uGel, uOstral, uDelai, imprevus };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Le CSE exerce son droit d'alerte une fois sur deux quand on coupe contre des équipes qui n'adhèrent plus. */
export const risqueAlerte = (adhesion: number) => (adhesion < 0.35 ? 0.5 : 0);

/** Les produits gèlent trois fois sur quatre si l'on coupe le chauffage du dépôt pendant le froid. */
export const CHANCE_GEL = 0.75;
export const depotGele = (chemin: readonly number[], graine: number) => {
  const h = hasard(graine);
  return chemin[D.froid] === 1 && h.froid && h.uGel < CHANCE_GEL;
};

/** Ostral accepte d'attendre le plan un peu plus d'une fois sur trois, contre une remise. */
export const CHANCE_DELAI = 0.35;
export const ostralAttend = (graine: number) => hasard(graine).uDelai < CHANCE_DELAI;

/**
 * OSTRAL RENOUVELLE-T-IL ?
 *
 * Son auditeur lit le plan comme un acheteur lit un devis : des émissions
 * mesurées, des actions engagées et chiffrées, une baisse déjà visible. Il
 * écarte la compensation, les garanties d'origine seules et les engagements
 * sans preuve.
 */
export function chanceOstral(chemin: readonly number[], reductionVisible: boolean): number {
  const mesure = chemin[D.premier] === 1;
  const engage = chemin[D.investissement] === 0 || chemin[D.investissement] === 1;
  switch (chemin[D.ostral]) {
    case 0:
      return Math.min(
        0.95,
        0.55 +
          (mesure ? 0.25 : 0) +
          (reductionVisible ? 0.1 : 0) +
          (engage ? 0.05 : 0) +
          (chemin[D.investissement] === 2 ? 0.08 : 0),
      );
    case 1:
      return 0.2;
    case 2:
      return 0.4 + (reductionVisible ? 0.05 : 0);
    default:
      return 0.1;
  }
}

export type Semaine = {
  /** L'électricité et le gaz consommés dans la semaine, en MWh. */
  elec: number;
  gaz: number;
  conso: number;
  /** La consommation corrigée du climat : 100, c'est l'an dernier à météo égale. */
  indice: number;
  /** La part de l'énergie consommée sites fermés. */
  horsHoraires: number;
  /** Le prix de l'électricité sur le marché, en €/MWh. */
  prixMarche: number;
  /** Ce que la semaine a coûté : énergie, mesures, pénalités, pertes. */
  cout: number;
  /** La marge d'Ostral perdue, s'il ne renouvelle pas : comptée en semaine 12. */
  ostral: number;
  /** Le coût cumulé depuis le début du trimestre, hors marge d'Ostral. */
  couts: number;
  /** Les émissions cumulées, en tonnes de CO₂. */
  co2: number;
  adhesion: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget énergie, marge d'Ostral comprise : positif, sous le budget. */
  objectif: number;
  /** Le coût du trimestre, hors marge d'Ostral. */
  cout: number;
  energie: number;
  penaliteVolume: number;
  ostralRenouvelle: boolean;
  ostralAttend: boolean;
  chanceOstral: number;
  alerteCse: number;
  gel: boolean;
  froid: boolean;
  effacement: number;
  indiceMoyen: number;
  co2: number;
  co2Reference: number;
  adhesionFinale: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

interface Leviers {
  depotNuit: number;
  depotJour: number;
  agNuit: number;
  agJour: number;
  talon: number;
  eclairage: number;
  radiateurs: number;
}
const AUCUN: Leviers = {
  depotNuit: 0,
  depotJour: 0,
  agNuit: 0,
  agJour: 0,
  talon: 0,
  eclairage: 0,
  radiateurs: 0,
};
const maxi = (a: Leviers, b: Leviers): Leviers => ({
  depotNuit: Math.max(a.depotNuit, b.depotNuit),
  depotJour: Math.max(a.depotJour, b.depotJour),
  agNuit: Math.max(a.agNuit, b.agNuit),
  agJour: Math.max(a.agJour, b.agJour),
  talon: Math.max(a.talon, b.talon),
  eclairage: Math.max(a.eclairage, b.eclairage),
  radiateurs: a.radiateurs + b.radiateurs,
});
const fois = (l: Leviers, k: number): Leviers => ({
  depotNuit: l.depotNuit * k,
  depotJour: l.depotJour * k,
  agNuit: l.agNuit * k,
  agJour: l.agJour * k,
  talon: l.talon * k,
  eclairage: l.eclairage * k,
  radiateurs: l.radiateurs,
});

/** Ce que consomme une semaine, leviers appliqués. */
function consommer(dju: number, l: Leviers, ledActif: boolean, destratActif: boolean) {
  const destrat = destratActif ? 0.75 : 1;
  const gazDepotNuit = GAZ_DEPOT * NUIT_DEPOT * dju * (1 - l.depotNuit) * destrat;
  const gazDepotJour = GAZ_DEPOT * (1 - NUIT_DEPOT) * dju * (1 - l.depotJour) * destrat;
  const gazAgNuit = GAZ_AGENCES * NUIT_AGENCES * dju * (1 - l.agNuit);
  const gazAgJour = GAZ_AGENCES * (1 - NUIT_AGENCES) * dju * (1 - l.agJour);
  const led = ledActif ? 0.55 : 1;
  // L'éclairage de nuit oublié : 4 des 10 MWh évitables du talon.
  const talon =
    ELEC_TALON_INCOMPRESSIBLE + ELEC_TALON_EVITABLE * (1 - l.talon) * (ledActif ? 0.82 : 1);
  const jour = ELEC_JOUR + ELEC_ECLAIRAGE * (1 - l.eclairage) * led + l.radiateurs;
  const gaz = gazDepotNuit + gazDepotJour + gazAgNuit + gazAgJour;
  const nuit = gazDepotNuit + gazAgNuit + talon;
  return { elec: talon + jour, gaz, nuit };
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const mesure = d1 === 1;
  const gele = depotGele(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let adhesion = 0.55;
  let couts = 0;
  let energie = 0;
  let co2 = 0;
  let co2Reference = 0;
  let alerteCse = 0;
  let effacement = 0;
  // La clause de volume se règle sur les semaines du nouveau contrat.
  let volumeElec = 0;
  let volumeGaz = 0;
  let historiqueElec = 0;
  let historiqueGaz = 0;
  let penaliteVolume = 0;
  let renouvelle = true;
  let perteOstral = 0;
  let chance = 1;
  const attend = d5 === 3 && h.uDelai < CHANCE_DELAI;
  const indices: number[] = [];

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;

    // L'adhésion des équipes : ce qu'on leur impose, ce qu'on leur montre.
    if (w === 2) {
      if (d1 === 0) adhesion = 0.25;
      if (d1 === 2) adhesion += 0.05;
    }
    if (w === DEBUT_CONTRAT) {
      if (d3 === 0) adhesion += 0.2 + (mesure ? 0.1 : 0) + (d1 === 0 ? 0.1 : 0);
      if (d3 === 1) adhesion -= 0.15;
      if (d3 === 2) adhesion += 0.1;
    }
    adhesion = borne(adhesion, 0.05, 0.95);

    // Le droit d'alerte du CSE, quand on coupe contre des équipes qui n'adhèrent plus.
    const coupeD1 = d1 === 0 && w >= 2 && (w < DEBUT_CONTRAT || d3 === 3);
    const coupeD3 = d3 === 1 && w >= DEBUT_CONTRAT;
    if (!alerteCse && ((d1 === 0 && w === 4) || (d3 === 1 && w === 7))) {
      if ((coupeD1 || coupeD3) && h.uCse < risqueAlerte(adhesion)) {
        alerteCse = w;
        adhesion = Math.max(0.05, adhesion - 0.1);
      }
    }
    const leve = alerteCse > 0 && w > alerteCse;

    // Les leviers de la semaine.
    let l = AUCUN;
    if (coupeD1 && !leve) {
      const obeissance = 0.35 + 0.65 * adhesion;
      l = maxi(
        l,
        fois(
          {
            depotNuit: 0.3,
            depotJour: 0.3,
            agNuit: 0.3,
            agJour: 0.3,
            talon: 0,
            eclairage: 0.4,
            radiateurs: 0,
          },
          obeissance,
        ),
      );
      l = { ...l, radiateurs: 6 * (1 - adhesion) };
    }
    if (mesure && w >= 3) {
      // Les sous-compteurs montrent le compresseur et les programmateurs : on les règle aussitôt.
      l = maxi(l, { ...AUCUN, talon: 0.3, depotNuit: 0.15 });
    }
    if (d1 === 2 && w >= 2) {
      l = maxi(l, fois({ ...AUCUN, talon: 0.15, agJour: 0.05, eclairage: 0.1 }, adhesion));
    }
    if (w >= DEBUT_CONTRAT) {
      if (d3 === 0) {
        const e = (mesure ? 1 : 0.6) * (0.5 + 0.5 * adhesion);
        l = maxi(
          l,
          fois(
            {
              depotNuit: 0.5,
              depotJour: 0.1,
              agNuit: 0.5,
              agJour: 0.1,
              talon: 0.65,
              eclairage: 0.15,
              radiateurs: 0,
            },
            e,
          ),
        );
      }
      if (d3 === 1 && !leve) {
        const obeissance = 0.6 + 0.4 * adhesion;
        l = maxi(
          l,
          fois(
            { ...AUCUN, depotNuit: 0.2, depotJour: 0.2, agNuit: 0.22, agJour: 0.22 },
            obeissance,
          ),
        );
        l = { ...l, radiateurs: l.radiateurs + 2.5 * (1 - adhesion) };
      }
      if (d3 === 2) {
        const e = (mesure ? 1 : 0.7) * adhesion;
        l = maxi(
          l,
          fois(
            { ...AUCUN, depotNuit: 0.15, agNuit: 0.3, agJour: 0.08, talon: 0.4, eclairage: 0.1 },
            e,
          ),
        );
      }
    }
    // Le plan grand froid : hors-gel des zones de stockage pendant les fêtes.
    if (d6 === 0 && w >= 12) {
      l = { ...l, depotNuit: Math.max(l.depotNuit, 0.7), depotJour: Math.max(l.depotJour, 0.2) };
    }
    // Le dépôt coupé pendant les fêtes : seuls les bureaux restent chauffés.
    if (d6 === 1 && w >= 12) l = { ...l, depotNuit: 0.85, depotJour: 0.75 };

    const ledActif = d4 === 0 && w >= 9;
    const destratActif = d4 === 1 && w >= 9;
    const c = consommer(h.dju[w]!, l, ledActif, destratActif);
    const ref = consommer(h.dju[w]!, AUCUN, false, false);
    let elec = c.elec;
    let gaz = c.gaz;
    for (const a of actifs) {
      elec = elec * (a.imprevu.effet.conso ?? 1) + (a.imprevu.effet.elec ?? 0);
      gaz *= a.imprevu.effet.conso ?? 1;
    }
    const conso = elec + gaz;
    const indice = (100 * (c.elec + c.gaz)) / (ref.elec + ref.gaz);
    indices.push(indice);

    // Le prix : l'ancien contrat, puis le nouveau.
    const m = h.marche[w]!;
    const acheminement = actifs.reduce((s, a) => s + (a.imprevu.effet.acheminement ?? 0), 0);
    let facture = 0;
    if (w < DEBUT_CONTRAT) {
      facture = elec * ANCIEN.elec + gaz * ANCIEN.gaz;
    } else {
      const indexe = (e: number, g: number) => PRIX.indexe * m * (e * MARCHE.elec + g * MARCHE.gaz);
      if (d2 === 0 || d2 === 2) {
        const k = d2 === 0 ? PRIX.historique : PRIX.fixe;
        facture = k * (elec * MARCHE.elec + gaz * MARCHE.gaz);
        volumeElec += elec;
        volumeGaz += gaz;
        historiqueElec += ref.elec;
        historiqueGaz += ref.gaz;
      } else if (d2 === 1) {
        // Le ruban : la moitié du volume historique à prix fixe, le reste au marché (ou revendu).
        const re = PART_RUBAN * ref.elec;
        const rg = PART_RUBAN * ref.gaz;
        facture = PRIX.ruban * (re * MARCHE.elec + rg * MARCHE.gaz);
        const couvert = d6 === 2 && w >= SEMAINE_FROID;
        const prixReste = couvert ? h.marche[10]! * couvertureFin() : m;
        facture += PRIX.indexe * prixReste * ((elec - re) * MARCHE.elec + (gaz - rg) * MARCHE.gaz);
      } else {
        const couvert = d6 === 2 && w >= SEMAINE_FROID;
        facture = couvert
          ? PRIX.indexe * h.marche[10]! * couvertureFin() * (elec * MARCHE.elec + gaz * MARCHE.gaz)
          : indexe(elec, gaz);
      }
    }
    facture += elec * acheminement;
    energie += facture;
    cout += facture;

    // La clause de volume, réglée en fin de trimestre.
    if (w === SEMAINES && (d2 === 0 || d2 === 2)) {
      const k = d2 === 0 ? PRIX.historique : PRIX.fixe;
      const tolerance = d2 === 0 ? TOLERANCE.historique : TOLERANCE.fixe;
      const manqueElec = Math.max(0, tolerance * historiqueElec - volumeElec);
      const manqueGaz = Math.max(0, tolerance * historiqueGaz - volumeGaz);
      penaliteVolume = PENALITE_VOLUME * k * (manqueElec * MARCHE.elec + manqueGaz * MARCHE.gaz);
      cout += penaliteVolume;
    }

    // Les mesures et leurs frais.
    if (d1 === 1 && w === 2) cout += COUTS.sousCompteurs;
    if (d1 === 2 && w === 2) cout += COUTS.affiches;
    if ((d2 === 1 || d2 === 2 || d2 === 3) && w === 4) cout += COUTS.courtier;
    if (d3 === 0 && w === 5) cout += COUTS.referents;
    if (d3 === 2 && w === 5) cout += COUTS.defi;
    if (ledActif) cout += COUTS.led;
    if (destratActif) cout += COUTS.destrat;
    if (d4 === 2 && w === 8) cout += COUTS.etude;
    if (d5 === 0 && w === 9) cout += COUTS.bilanCarbone;
    if (d5 === 1 && w === 9) cout += COUTS.brochure;
    if (d5 === 2 && w === 9) cout += COUTS.garanties;
    if (d6 === 0 && w === 11) cout += COUTS.regroupement;
    if (d6 === 2 && w === 11) cout += COUTS.couverture;
    if (attend && w === 9) cout += REMISE_DELAI;
    for (const a of actifs) if (a.semaine === w) cout += a.imprevu.effet.cout ?? 0;

    // L'effacement : le réseau rémunère les sites qui baissent leur pointe pendant le froid.
    if (d6 === 0 && h.froid && w >= SEMAINE_FROID) {
      const e = (mesure || d3 === 0 ? 1 : 0.4) * EFFACEMENT;
      effacement += e;
      cout -= e;
    }
    // Le dépôt gèle : peintures, colles, mastics et adjuvants à la benne.
    if (gele && w === 12) cout += PERTE_GEL;

    // Ostral décide en semaine 12, sur le plan reçu en semaine 10.
    if (w === 12) {
      const visible = indices.slice(6, 10).reduce((s, x) => s + x, 0) / 4 <= OBJECTIF_INDICE;
      chance = attend ? 1 : chanceOstral(chemin, visible);
      renouvelle = h.uOstral < chance;
      if (!renouvelle) perteOstral = MARGE_OSTRAL;
    }

    couts += cout;
    co2 += elec * CO2.elec + gaz * CO2.gaz;
    co2Reference += ref.elec * CO2.elec + ref.gaz * CO2.gaz;
    semaines.push({
      elec,
      gaz,
      conso,
      indice,
      horsHoraires: c.nuit / (c.elec + c.gaz),
      prixMarche: m * MARCHE.elec,
      cout,
      ostral: w === 12 ? perteOstral : 0,
      couts,
      co2,
      adhesion,
    });
  }

  return {
    semaines,
    objectif: BUDGET - couts - perteOstral,
    cout: couts,
    energie,
    penaliteVolume,
    ostralRenouvelle: renouvelle,
    ostralAttend: attend,
    chanceOstral: chance,
    alerteCse,
    gel: gele,
    froid: h.froid,
    effacement,
    indiceMoyen: indices.slice(4).reduce((s, x) => s + x, 0) / (SEMAINES - 4),
    co2,
    co2Reference,
    adhesionFinale: adhesion,
  };
}

/**
 * LA COUVERTURE DE FIN DE TRIMESTRE : le prix auquel on bloque, en semaine 10,
 * la part indexée des trois dernières semaines. Le marché paie déjà le risque
 * de froid, plus une prime : on paie un peu plus en moyenne, beaucoup moins
 * dans les mauvais tirages.
 */
export const couvertureFin = () => (1 + CHANCE_FROID * (FROID.marche - 1)) * 1.03;

/** Ce qui s'est passé pendant des semaines : CSE, froid, gel, Ostral, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    alerteCse: t.alerteCse > 0 && dans(t.alerteCse),
    froid: t.froid && dans(SEMAINE_FROID),
    gel: t.gel && dans(12),
    ostral: chemin[D.ostral] !== undefined && dans(12) ? t.ostralRenouvelle : null,
    penalite: t.penaliteVolume > 0 && dans(13),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureEnergie {
  couts: number | null;
  indice: number | null;
  prixMarche: number | null;
  horsHoraires: number | null;
  co2: number | null;
  budgetADate: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  conso: number | null;
  co2ADate: number | null;
  adhesion: number | null;
}

/** La part du budget consommée à chaque semaine, au rythme des degrés-jours et du nouveau contrat. */
const PROFIL_BUDGET = (() => {
  const poids = DJU.map((dju, w) => {
    if (!w) return 0;
    const c = consommer(dju, AUCUN, false, false);
    const k = w < DEBUT_CONTRAT ? 1 : 1.8;
    return k * (c.elec * ANCIEN.elec + c.gaz * ANCIEN.gaz);
  });
  const total = poids.reduce((s, x) => s + x, 0);
  let cumul = 0;
  return poids.map((p) => {
    cumul += p;
    return cumul / total;
  });
})();

/** La situation du lundi de la semaine 1 : la dernière semaine de septembre. */
export const DEPART = (() => {
  const c = consommer(30, AUCUN, false, false);
  return { conso: c.elec + c.gaz, horsHoraires: c.nuit / (c.elec + c.gaz) };
})();

/**
 * Ce que Cyprien lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ». La part consommée sites fermés n'est connue
 * qu'une fois les sous-compteurs posés.
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureEnergie {
  const mesure = decisions[D.premier] === 1;
  if (semaine === 0) {
    return {
      couts: 0,
      indice: 100,
      prixMarche: MARCHE.elec,
      horsHoraires: null,
      co2: 0,
      budgetADate: 0,
      conso: DEPART.conso,
      co2ADate: 0,
      adhesion: 0.55,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  let reference = 0;
  const h = hasard(graine);
  for (let w = 1; w <= semaine; w += 1) {
    const c = consommer(h.dju[w]!, AUCUN, false, false);
    reference += c.elec * CO2.elec + c.gaz * CO2.gaz;
  }
  return {
    couts: s.couts,
    indice: s.indice,
    prixMarche: s.prixMarche,
    horsHoraires: mesure && semaine >= 3 ? s.horsHoraires : null,
    co2: s.co2,
    budgetADate: BUDGET * PROFIL_BUDGET[semaine]!,
    conso: s.conso,
    co2ADate: reference,
    adhesion: s.adhesion,
  };
}
