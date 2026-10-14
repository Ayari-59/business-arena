/**
 * L'HEURE D'AIDE À DOMICILE — le modèle du service d'aide à domicile de Solvanne.
 *
 * Le service d'aide à domicile (SAAD) du pôle domicile de l'Association
 * Solvanne, à Dijon et Beaune : quelque 90 intervenantes, 95 000 heures
 * facturées par an, presque toutes au tarif horaire que le conseil
 * départemental de la Côte-d'Or fixe pour l'APA et la PCH, 24,80 €. Le service
 * a perdu 240 k€ l'an dernier ; la comptabilité annonce un coût de 26 € de
 * l'heure, ce qui ne fait que 114 k€ de perte. Treize semaines, d'avril à
 * juin, six décisions. Quatre mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · L'HEURE FACTURÉE PORTE TOUT CE QUI NE SE FACTURE PAS. Pour une heure
 *     passée chez un bénéficiaire, le service paie aussi des trajets, de la
 *     coordination, de la formation, des absences et des interventions
 *     annulées trop tard : 119 950 heures payées pour 95 000 facturées. La
 *     comptabilité divise les charges par les 100 000 heures planifiées
 *     (25,96 €) ; rapportées aux seules heures facturées, elles font 27,33 €,
 *     et la perte est de 2,53 € par heure, pas de 1,20 €. Le coût marginal
 *     d'une heure dépend de ce qui l'entoure : une heure longue sur une tournée
 *     dense coûte 22,18 €, un passage de trente minutes 28,52 €, une heure
 *     dans un village des Hautes-Côtes 32,62 €.
 *   · SECTORISER LES TOURNÉES RÉDUIT LES TRAJETS, AVEC RETARD. Des équipes
 *     attachées à un secteur font moins de route ; il faut un mois pour refaire
 *     les plannings, des bénéficiaires changent d'intervenante et quelques-uns
 *     s'en vont. Le gain est tiré au hasard (de 15 à 27 % des trajets).
 *   · REFUSER LES PETITES INTERVENTIONS PERD LES BÉNÉFICIAIRES LES PLUS
 *     DÉPENDANTS. Les passages de moins d'une heure (lever, repas, coucher)
 *     font 14 % des heures et 35 % des trajets : les refuser fait baisser la
 *     part des trajets, mais ces bénéficiaires, en GIR 1 et 2 pour la plupart,
 *     partent avec toutes leurs heures chez un autre service ; les contrats des
 *     intervenantes ne baissent pas aussi vite que les plannings (des heures
 *     payées sans intervention) ; et le département, qui compte sur le service
 *     pour assurer les plans d'aide, s'en souvient au moment du CPOM. Le
 *     réflexe inverse, multiplier les heures pour diluer les frais fixes, ne
 *     vaut que là où l'heure marginale coûte moins que le tarif.
 *   · LE CPOM SE NÉGOCIE SUR DES CHIFFRES JUSTES. Un dossier qui montre le coût
 *     de revient de l'heure facturée et un plan d'action obtient une
 *     majoration du tarif au 1er juillet, tirée au hasard selon sa qualité et
 *     la CONFIANCE du département, que les décisions du trimestre font monter
 *     (sectoriser, traiter les annulations, reprendre des bénéficiaires) ou
 *     baisser (refuser des plans d'aide, faire payer les familles, suspendre
 *     des passages l'été, un événement indésirable).
 *
 * L'OBJECTIF, en euros, est le résultat de l'exercice 2026 du service tel que
 * les sources permettent de l'estimer à la fin juin : le premier trimestre
 * réalisé (−61 k€), le trimestre joué, puis les vingt-six semaines de juillet
 * à décembre projetées au rythme de fin juin (heures, part des trajets,
 * annulations, temps non facturables, hors aléas de la semaine), avec la
 * majoration du CPOM sur les heures APA et PCH et ce que la préparation de
 * l'été change aux remplacements de juillet et d'août. Sans rien changer, le
 * service perd environ 240 k€, comme l'an dernier.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Association, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const SEMAINES_PAR_AN = 52;
/** Les semaines de juillet à décembre que la projection ajoute au trimestre. */
export const SEMAINES_PROJETEES = 26;
/** Dont celles de juillet et d'août, les congés d'été. */
export const SEMAINES_ETE = 9;
/** Le résultat du premier trimestre de l'exercice, déjà réalisé. */
export const RESULTAT_T1 = -61000;

/* ---------------------------------------------------------------------------
 * L'AN DERNIER, tel que la paie, le planning et la comptabilité l'ont arrêté.
 * Toutes les sources de l'épisode en sont tirées.
 * ------------------------------------------------------------------------- */

/** Les heures de l'an dernier : facturées, puis payées sans être facturées. */
export const AN_DERNIER = {
  facturees: 95000,
  /** Les interventions annulées trop tard pour être remplacées : payées, pas facturées. */
  annulees: 5000,
  /** Les trajets entre deux interventions, temps de travail payé. */
  trajets: 11400,
  /** Réunions d'équipe, transmissions, temps avec les responsables de secteur. */
  coordination: 3800,
  formation: 1900,
  /** Maladie et maintien de salaire, hors congés payés. */
  absences: 2850,
} as const;

export const HEURES_PAYEES =
  AN_DERNIER.facturees +
  AN_DERNIER.annulees +
  AN_DERNIER.trajets +
  AN_DERNIER.coordination +
  AN_DERNIER.formation +
  AN_DERNIER.absences;
/** Les heures planifiées chez les bénéficiaires, annulations comprises : le diviseur de la comptabilité. */
export const HEURES_PLANIFIEES = AN_DERNIER.facturees + AN_DERNIER.annulees;
/** Le coût chargé moyen d'une heure payée à une intervenante, congés payés compris. */
export const COUT_HORAIRE = 17;
export const SALAIRES = COUT_HORAIRE * HEURES_PAYEES;
/** L'indemnité kilométrique, et les kilomètres d'une heure de trajet en ville et dans les bourgs. */
export const INDEMNITE_KM = 0.4;
export const FRAIS_KM = 152000;
export const KM_PAR_HEURE_DE_TRAJET = FRAIS_KM / INDEMNITE_KM / AN_DERNIER.trajets;
/** Encadrement et structure : responsables de secteur, planification, locaux, télégestion, siège. */
export const STRUCTURE = 405000;
export const CHARGES = SALAIRES + FRAIS_KM + STRUCTURE;
export const TARIF = 24.8;
export const PRODUITS = TARIF * AN_DERNIER.facturees;
export const RESULTAT_AN_DERNIER = PRODUITS - CHARGES;
/** Ce que la comptabilité annonce : les charges divisées par les heures planifiées. */
export const COUT_APPARENT = CHARGES / HEURES_PLANIFIEES;
/** Le coût de revient complet d'une heure facturée : les charges divisées par les heures facturées. */
export const COUT_DE_REVIENT = CHARGES / AN_DERNIER.facturees;
/** La part des heures APA et PCH, sur lesquelles porte une majoration du CPOM. */
export const PART_APA = 0.88;
/** Ce que le conseil d'administration demande : ramener la perte de l'exercice sous 150 k€. */
export const OBJECTIF_EXERCICE = -150000;

/** Les temps payés non facturés, par heure facturée. */
export const RATIOS = {
  trajets: AN_DERNIER.trajets / AN_DERNIER.facturees,
  coordination: AN_DERNIER.coordination / AN_DERNIER.facturees,
  formation: AN_DERNIER.formation / AN_DERNIER.facturees,
  absences: AN_DERNIER.absences / AN_DERNIER.facturees,
  annulations: AN_DERNIER.annulees / AN_DERNIER.facturees,
} as const;
/** Ce qui accompagne chaque heure, quelle qu'elle soit : coordination, formation, absences, annulations. */
export const AUTRES_TEMPS =
  RATIOS.coordination + RATIOS.formation + RATIOS.absences + RATIOS.annulations;

/** La décomposition du coût de revient d'une heure facturée, en euros. */
export const PAR_HEURE = {
  intervention: COUT_HORAIRE,
  trajets: COUT_HORAIRE * RATIOS.trajets,
  km: FRAIS_KM / AN_DERNIER.facturees,
  coordination: COUT_HORAIRE * RATIOS.coordination,
  formation: COUT_HORAIRE * RATIOS.formation,
  absences: COUT_HORAIRE * RATIOS.absences,
  annulations: COUT_HORAIRE * RATIOS.annulations,
  structure: STRUCTURE / AN_DERNIER.facturees,
} as const;

/** Les passages de moins d'une heure : leur part des heures, et la route qu'ils demandent par heure. */
export const COURTES = { part: 0.14, trajets: 0.3 } as const;
/** Les autres heures des bénéficiaires qui ont des passages courts, en part des heures du service. */
export const AUTRES_HEURES_DEPENDANTS = 0.16;
/** La route que demande une heure longue, sur les tournées actuelles. */
export const TRAJETS_LONGUES =
  (RATIOS.trajets - COURTES.part * COURTES.trajets) / (1 - COURTES.part);
/** Une heure dans un village des Hautes-Côtes : 24 minutes de route et 16 km. */
export const RURAL = { trajets: 0.4, kmParHeureDeTrajet: 40 } as const;
/** Les heures nouvelles d'une relance commerciale, sur les tournées actuelles. */
export const TRAJETS_NOUVELLES = 0.1;

/** Le coût marginal d'une heure facturée, selon la route qu'elle demande : sans la structure. */
export const coutMarginal = (trajets: number, kmParHeureDeTrajet = KM_PAR_HEURE_DE_TRAJET) =>
  COUT_HORAIRE * (1 + trajets + AUTRES_TEMPS) + trajets * kmParHeureDeTrajet * INDEMNITE_KM;
export const COUT_MARGINAL = {
  longue: coutMarginal(TRAJETS_LONGUES),
  courte: coutMarginal(COURTES.trajets),
  rurale: coutMarginal(RURAL.trajets, RURAL.kmParHeureDeTrajet),
} as const;

/** Les heures facturées d'une semaine ordinaire. */
export const HEURES_SEMAINE = AN_DERNIER.facturees / SEMAINES_PAR_AN;
/** Les bénéficiaires de Présence Hautes-Côtes, en heures par semaine : sur nos tournées, et dans les villages. */
export const REPRISE = { dense: 60, rurale: 90 } as const;
/** Une fois les contrats ajustés, la part des heures perdues encore payée sans intervention. */
export const SOUS_ACTIVITE = { trimestre: 0.25, regime: 0.06 } as const;
/** Ce que coûte de plus une heure de remplacement en intérim : environ deux fois une heure salariée. */
export const SURCOUT_INTERIM = COUT_HORAIRE;
/** L'été : la part des heures remplacées, et la route en plus que fait un remplaçant par heure. */
export const ETE = {
  remplacees: 0.2,
  trajetsRemplacants: 0.22,
  trajetsFormes: 0.12,
  trajetsFormesSecteur: 0.06,
  nonAssurees: 0.04,
  partInterim: 0.25,
} as const;
/** Ce que coûtent les engagements de la dotation complémentaire, par heure APA ou PCH. */
export const ENGAGEMENTS = 0.4;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des demandes d'APA parties chez un autre service. */
export const PERTE_PAR_JOUR = 1200;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  levier: 0,
  annulations: 1,
  reprise: 2,
  coordination: 3,
  cpom: 4,
  ete: 5,
} as const;

/** Ne rien changer : attendre, laisser les annulations, refuser la reprise, garder les temps, reporter, l'été comme d'habitude. */
export const NEUTRE = [3, 3, 2, 2, 3, 3] as const;

export const COUTS = {
  sectorisation: 9000,
  campagne: 2500,
  recrutement: 1200,
  planificatrice: 250,
  appels: 500,
  facturation: 600,
  litiges: 150,
  repriseTout: 3000,
  repriseSecteurs: 1200,
  transmissions: 1500,
  depart: 2500,
  evenement: 2000,
  dossier: 1500,
  dossierDotation: 2500,
  binomes: 2600,
  signalement: 3000,
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
  effet: {
    /** Un multiplicateur des trajets. */
    trajets?: number;
    /** Un multiplicateur des annulations. */
    annulations?: number;
    /** Des absences en plus, en part des heures facturées. */
    absences?: number;
    /** De la coordination en plus, en part des heures facturées. */
    coordination?: number;
    /** Un coût ponctuel, la première semaine. */
    cout?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "gastro",
    titre: "Épidémie de gastro-entérite",
    de: "Thuy Chevrolat",
    role: "Infirmière coordinatrice du SSIAD",
    texte:
      "Une épidémie de gastro-entérite touche l'agglomération : des bénéficiaires hospitalisés sans prévenir, et des intervenantes malades à leur tour.",
    duree: 2,
    effet: { annulations: 1.6, absences: 0.015 },
  },
  {
    id: "telegestion",
    titre: "Panne du logiciel de télégestion",
    de: "Voahangy Rakotomalala",
    role: "Planificatrice, Dijon",
    texte:
      "Le logiciel de télégestion est tombé trois jours : plannings refaits au téléphone, tournées recousues à la main, et une heure de plus au bureau pour chaque responsable de secteur.",
    duree: 1,
    effet: { trajets: 1.1, coordination: 0.02 },
  },
  {
    id: "travaux",
    titre: "Travaux sur la rocade est de Dijon",
    de: "Voahangy Rakotomalala",
    role: "Planificatrice, Dijon",
    texte:
      "La rocade est fermée la nuit et réduite à une voie le jour : les tournées de Quetigny et de Chevigny-Saint-Sauveur prennent vingt minutes de plus.",
    duree: 2,
    effet: { trajets: 1.15 },
  },
  {
    id: "accident",
    titre: "Accident de trajet d'une intervenante",
    de: "Leonor Mathiot",
    role: "Responsable de secteur, Beaune",
    texte:
      "Une intervenante a été percutée à un carrefour de Savigny-lès-Beaune. Elle n'a rien de grave, mais sa voiture est immobilisée et elle est arrêtée trois semaines ; 1 800 € de franchise et de location.",
    duree: 3,
    effet: { absences: 0.006, cout: 1800 },
  },
  {
    id: "greve",
    titre: "Grève du réseau de bus et de tram",
    de: "Voahangy Rakotomalala",
    role: "Planificatrice, Dijon",
    texte:
      "Grève du réseau de bus et de tram de Dijon : les intervenantes qui n'ont pas de voiture sont redistribuées, et des passages sont décalés ou annulés.",
    duree: 1,
    effet: { trajets: 1.12, annulations: 1.25 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Les heures demandées par les plans d'aide, autour de 1. */
  activite: number;
  /** Les annulations, autour de 1. */
  annulations: number;
  /** Les absences, autour de 1. */
  absences: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La part des bénéficiaires aux passages courts qui partent, avec toutes leurs heures, si on les refuse. */
  departDependants: number;
  /** La part des trajets que la sectorisation supprime, une fois en place. */
  gainSecteur: number;
  /** La part des heures perdue parce que des bénéficiaires refusent de changer d'intervenante. */
  pertesSecteur: number;
  /** La cellule de coordination des sorties du CHU accepte-t-elle de signaler les hospitalisations ? */
  uCHU: number;
  /** La part des annulations qu'on pourrait facturer aux familles : ni hospitalisation, ni fait du service. */
  partFacturable: number;
  /** La part des heures perdue quand on facture les annulations aux familles. */
  departsFacturation: number;
  /** Une famille saisit-elle le département après un refus ? */
  uPlainte: number;
  /** Les heures nouvelles qu'une relance apporte, en part des heures du service. */
  nouvelles: number;
  /** La part de ces heures nouvelles hors des tournées actuelles. */
  partRurale: number;
  /** Un événement indésirable survient-il si les réunions d'équipe sont supprimées ? */
  uEvenement: number;
  /** Le nombre d'intervenantes qui démissionnent si les réunions sont supprimées. */
  departsCoordination: number;
  /** La décision du département sur le CPOM. */
  uCPOM: number;
  /** La part des heures perdue après l'été si l'on suspend les passages courts. */
  pertesEte: number;
  /** Une famille fait-elle un signalement si l'on suspend les passages courts l'été ? */
  uSignalement: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const entre = (r: () => number, a: number, b: number) => a + (b - a) * r();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000921 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      activite: borne(1 + 0.025 * gauss(r), 0.93, 1.07),
      annulations: borne(1 + 0.2 * gauss(r), 0.6, 1.5),
      absences: borne(1 + 0.2 * gauss(r), 0.6, 1.5),
    });
  }
  const departDependants = entre(r, 0.35, 0.65);
  const gainSecteur = entre(r, 0.15, 0.27);
  const pertesSecteur = entre(r, 0.003, 0.012);
  const uCHU = r();
  const partFacturable = entre(r, 0.2, 0.35);
  const departsFacturation = entre(r, 0.02, 0.05);
  const uPlainte = r();
  const nouvelles = entre(r, 0.04, 0.08);
  const partRurale = entre(r, 0.4, 0.65);
  const uEvenement = r();
  const departsCoordination = Math.floor(r() * 4);
  const uCPOM = r();
  const pertesEte = entre(r, 0.02, 0.05);
  const uSignalement = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    semaines,
    departDependants,
    gainSecteur,
    pertesSecteur,
    uCHU,
    partFacturable,
    departsFacturation,
    uPlainte,
    nouvelles,
    partRurale,
    uEvenement,
    departsCoordination,
    uCPOM,
    pertesEte,
    uSignalement,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** La cellule de coordination des sorties du CHU accepte six fois sur dix de signaler les hospitalisations. */
export const CHANCE_CHU = 0.6;
export const chuAccepte = (graine: number) => hasard(graine).uCHU < CHANCE_CHU;

/** Après un refus de passages courts, une famille saisit le département six fois sur dix. */
export const CHANCE_PLAINTE = 0.6;
export const plainte = (chemin: readonly number[], graine: number) =>
  chemin[D.levier] === 0 && hasard(graine).uPlainte < CHANCE_PLAINTE;

/** Sans réunions d'équipe, une alerte se perd un peu moins d'une fois sur deux. */
export const CHANCE_EVENEMENT = 0.45;
export const evenementIndesirable = (chemin: readonly number[], graine: number) =>
  chemin[D.coordination] === 0 && hasard(graine).uEvenement < CHANCE_EVENEMENT;

/** Sans réunions d'équipe, de zéro à trois intervenantes démissionnent. */
export const departsCoordination = (chemin: readonly number[], graine: number) =>
  chemin[D.coordination] === 0 ? hasard(graine).departsCoordination : 0;

/** Suspendre les passages courts l'été : une famille fait un signalement une fois sur deux. */
export const CHANCE_SIGNALEMENT = 0.5;
export const signalement = (chemin: readonly number[], graine: number) =>
  chemin[D.ete] === 0 && hasard(graine).uSignalement < CHANCE_SIGNALEMENT;

/**
 * LA CONFIANCE DU DÉPARTEMENT : ce que le trimestre lui a montré du service.
 *
 * Le département attend d'un service autorisé qu'il assure les plans d'aide de
 * son secteur et qu'il cherche ses propres économies avant de demander plus.
 */
export function confiance(chemin: readonly number[], graine: number): number {
  const [d1, d2, d3, d4, , d6] = chemin;
  let c = 0;
  if (d1 === 0) c -= plainte(chemin, graine) ? 0.3 : 0.2;
  if (d1 === 1) c += 0.1;
  if (d2 === 0) c -= 0.1;
  if (d2 === 1) c += 0.1;
  if (d2 === 2) c += 0.05;
  if (d3 === 0) c += 0.1;
  if (d3 === 1) c += 0.05;
  if (d3 === 2) c -= 0.1;
  if (d4 === 0) c -= evenementIndesirable(chemin, graine) ? 0.2 : 0.05;
  if (d6 === 0) c -= signalement(chemin, graine) ? 0.3 : 0.2;
  return c;
}

/**
 * LA RÉPONSE DU DÉPARTEMENT AU CPOM, au 1er juillet.
 *
 *   · le chiffrage de la comptabilité (26 €) n'explique pas la perte : au
 *     mieux 0,40 € « au titre de l'inflation » ;
 *   · un dossier complet et une demande mesurée : 1 € le plus souvent, 0,50 €
 *     sinon, rien quand la confiance est au plus bas ;
 *   · la dotation complémentaire de 2 € contre des engagements (0,40 € par
 *     heure) : tout ou rien, et plus souvent rien.
 */
export interface Majoration {
  /** La majoration accordée, en euros par heure APA ou PCH. */
  accordee: number;
  /** Ce que coûtent les engagements qui l'accompagnent, en euros par heure APA ou PCH. */
  engagements: number;
  /** La probabilité d'obtenir la demande entière, sous la confiance du trimestre. */
  chance: number;
}
export function majoration(chemin: readonly number[], graine: number): Majoration {
  const u = hasard(graine).uCPOM;
  const c = confiance(chemin, graine);
  switch (chemin[D.cpom]) {
    case 0: {
      const chance = borne(0.45 + c, 0.1, 0.85);
      return { accordee: u < chance ? 0.4 : 0, engagements: 0, chance };
    }
    case 1: {
      const chance = borne(0.55 + c, 0.1, 0.92);
      const accordee = u < chance ? 1 : u < Math.min(1, chance + 0.3) ? 0.5 : 0;
      return { accordee, engagements: 0, chance };
    }
    case 2: {
      const chance = borne(0.35 + c, 0.05, 0.8);
      return u < chance
        ? { accordee: 2, engagements: ENGAGEMENTS, chance }
        : { accordee: 0, engagements: 0, chance };
    }
    default:
      return { accordee: 0, engagements: 0, chance: 0 };
  }
}

/* ---------------------------------------------------------------------------
 * UNE SEMAINE DU SERVICE.
 * ------------------------------------------------------------------------- */

const rampe = (w: number, de: number, a: number) =>
  w < de ? 0 : w >= a ? 1 : (w - de + 1) / (a - de + 1);

interface Calcul {
  facturees: number;
  payees: number;
  trajets: number;
  annulees: number;
  /** Les heures perdues : bénéficiaires partis ou passages refusés. */
  perdues: number;
  produits: number;
  charges: number;
  km: number;
}

/** La semaine du « régime » de fin juin : toutes les décisions en place, sans aléa. */
const REGIME = 99;
const SANS_BRUIT: Bruit = { activite: 1, annulations: 1, absences: 1 };

function calculer(
  chemin: readonly number[],
  h: Hasard,
  w: number,
  n: Bruit,
  actifs: readonly ImprevuTire[],
  chu: boolean,
): Calcul {
  const [d1, d2, d3, d4] = chemin;
  const regime = w === REGIME;
  const effet = <K extends keyof Imprevu["effet"]>(k: K, neutre: number, cumul: "x" | "+") =>
    actifs.reduce((x, a) => {
      const e = a.imprevu.effet[k];
      return e == null ? x : cumul === "x" ? x * e : x + e;
    }, neutre);

  // Les heures que les plans d'aide demandent, passages courts et heures longues.
  const H = HEURES_SEMAINE * n.activite;
  let courtes = COURTES.part * H;
  let longues = (1 - COURTES.part) * H;
  let perdues = 0;
  if (d1 === 0 && w >= 3) {
    // Un passage court sur dix est regroupé avec une autre intervention ; les autres partent,
    // et la plupart de ces bénéficiaires partent avec toutes leurs heures.
    const r = rampe(w, 3, 8);
    const c = courtes * 0.9 * r;
    const l = AUTRES_HEURES_DEPENDANTS * H * h.departDependants * r;
    courtes -= c;
    longues -= l;
    perdues += c + l;
  }
  const perte = (part: number) => {
    perdues += part * (courtes + longues);
    courtes *= 1 - part;
    longues *= 1 - part;
  };
  if (d1 === 1 && w >= 4) perte(h.pertesSecteur * rampe(w, 4, 7));
  if (d2 === 0 && w >= 4) perte(h.departsFacturation * rampe(w, 4, 9));

  // Les heures en plus : une relance commerciale, la reprise de Présence Hautes-Côtes.
  let nouvellesDenses = 0;
  let nouvellesRurales = 0;
  if (d1 === 2 && w >= 3) {
    const t = HEURES_SEMAINE * h.nouvelles * rampe(w, 3, 8);
    nouvellesRurales = t * h.partRurale;
    nouvellesDenses = t - nouvellesRurales;
  }
  let repriseDense = 0;
  let repriseRurale = 0;
  if ((d3 === 0 || d3 === 1) && w >= 9) {
    const r = rampe(w, 9, 10);
    repriseDense = REPRISE.dense * r;
    if (d3 === 0) repriseRurale = REPRISE.rurale * r;
  }
  const facturees =
    courtes + longues + nouvellesDenses + nouvellesRurales + repriseDense + repriseRurale;

  // La route : les tournées de ville et de bourg, puis les villages.
  let secteur = 1;
  if (d1 === 1) {
    if (w >= 3 && w <= 5) secteur *= 1.05;
    secteur *= 1 - h.gainSecteur * rampe(w, 5, 9);
  }
  const trajetsDenses =
    (COURTES.trajets * courtes +
      TRAJETS_LONGUES * (longues + repriseDense) +
      TRAJETS_NOUVELLES * nouvellesDenses) *
    secteur *
    effet("trajets", 1, "x");
  const trajetsRuraux = RURAL.trajets * (nouvellesRurales + repriseRurale);

  // Les interventions annulées trop tard pour être remplacées.
  let tauxAnnulations = RATIOS.annulations * n.annulations * effet("annulations", 1, "x");
  if (d1 === 1 && w >= 4 && w <= 7) tauxAnnulations *= 1.12;
  if (d2 === 1 && w >= 3) tauxAnnulations *= 1 - (0.3 + (chu ? 0.15 : 0)) * rampe(w, 3, 5);
  if (d2 === 2 && w >= 3) tauxAnnulations *= 1 - 0.25 * rampe(w, 3, 4);
  if (d4 === 0 && w >= 9) tauxAnnulations *= 1.1;
  const annulees = tauxAnnulations * facturees;

  // Coordination, formation, absences.
  let coordination = RATIOS.coordination + effet("coordination", 0, "+");
  let formation = RATIOS.formation;
  let absences = RATIOS.absences * n.absences + effet("absences", 0, "+");
  if (d4 === 0 && w >= 7) {
    coordination = 0.015;
    // Les formations reportées se rattrapent à l'automne.
    formation = regime ? RATIOS.formation : 0;
  }
  if (d4 === 1 && w >= 7) coordination = 0.03;
  if (d4 === 0 && w >= 9) absences += 0.02;

  const sousActivite = (regime ? SOUS_ACTIVITE.regime : SOUS_ACTIVITE.trimestre) * perdues;
  const payees =
    facturees +
    trajetsDenses +
    trajetsRuraux +
    annulees +
    (coordination + formation + absences) * facturees +
    sousActivite;
  const km =
    INDEMNITE_KM *
    (KM_PAR_HEURE_DE_TRAJET * trajetsDenses + RURAL.kmParHeureDeTrajet * trajetsRuraux);
  let produits = TARIF * facturees;
  // Les annulations facturées aux familles, hors hospitalisations ; un tiers reste impayé.
  if (d2 === 0 && w >= 4) produits += TARIF * annulees * h.partFacturable * (2 / 3);
  const charges = COUT_HORAIRE * payees + km + STRUCTURE / SEMAINES_PAR_AN;
  return {
    facturees,
    payees,
    trajets: trajetsDenses + trajetsRuraux,
    annulees,
    perdues,
    produits,
    charges,
    km,
  };
}

export type Semaine = {
  /** Les heures facturées dans la semaine. */
  facturees: number;
  /** Les heures payées aux intervenantes par heure facturée. */
  ratio: number;
  /** Les heures de trajet, en part des heures facturées. */
  trajets: number;
  /** Les heures annulées trop tard, en part des heures facturées. */
  annulations: number;
  /** Le coût de revient de l'heure facturée dans la semaine : toutes les charges, divisées par les heures facturées. */
  cout: number;
  /** Le résultat de la semaine. */
  resultat: number;
  /** Le résultat du trimestre, à date. */
  cumul: number;
  produits: number;
  charges: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Le résultat projeté de l'exercice : premier trimestre, trimestre joué, juillet à décembre. */
  objectif: number;
  /** Le résultat du trimestre d'avril à juin. */
  resultatTrimestre: number;
  /** La projection de juillet à décembre. */
  projection: number;
  /** Le rythme de fin juin, par semaine, sans majoration ni été. */
  regimeSemaine: number;
  /** Les heures facturées par semaine, au rythme de fin juin. */
  heuresRegime: number;
  /** Le coût de revient de l'heure facturée, au rythme de fin juin. */
  coutRegime: number;
  ratioRegime: number;
  trajetsRegime: number;
  /** Ce que la préparation de l'été change à juillet et août. */
  ete: number;
  majoration: Majoration;
  confiance: number;
  chuAccepte: boolean;
  plainte: boolean;
  evenement: boolean;
  departs: number;
  signalement: boolean;
  /** Le coût de revient complet d'une heure facturée l'an dernier : la prévision. */
  coutDeRevient: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const chu = d2 === 1 && chuAccepte(graine);
  const evenement = evenementIndesirable(chemin, graine);
  const departs = departsCoordination(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let cumul = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const c = calculer(chemin, h, w, n, actifs, chu);
    let facturees = c.facturees;
    let produits = c.produits;
    let charges = c.charges;

    // Les dépenses ponctuelles.
    let ponctuel = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
    for (const a of actifs) if (a.semaine === w) ponctuel += a.imprevu.effet.cout ?? 0;
    if (d1 === 1 && w >= 2 && w <= 4) ponctuel += COUTS.sectorisation / 3;
    if (d1 === 2) {
      if (w === 2) ponctuel += COUTS.campagne;
      // Une intervenante recrutée pour chaque quarantaine d'heures nouvelles.
      if (w >= 3 && w <= 8) ponctuel += (COUTS.recrutement * HEURES_SEMAINE * h.nouvelles) / 40 / 6;
    }
    if (d2 === 0 && w === 4) ponctuel += COUTS.facturation;
    if (d2 === 0 && w >= 4) ponctuel += COUTS.litiges;
    if (d2 === 1 && w >= 3) ponctuel += COUTS.planificatrice;
    if (d2 === 2 && w >= 3) ponctuel += COUTS.appels;
    if (d3 === 0 && w === 9) ponctuel += COUTS.repriseTout;
    if (d3 === 1 && w === 9) ponctuel += COUTS.repriseSecteurs;
    if (d4 === 1 && w === 7) ponctuel += COUTS.transmissions;
    if (d4 === 0) {
      // Les démissions : un recrutement, et un mois d'heures non assurées.
      if (w === 10) ponctuel += departs * COUTS.depart;
      if (w >= 10 && w <= 13) {
        const nonAssurees = departs * 20;
        facturees -= nonAssurees;
        produits -= TARIF * nonAssurees;
        charges -= COUT_HORAIRE * nonAssurees;
      }
      if (evenement && w === 10) ponctuel += COUTS.evenement;
    }
    if (d5 === 1 && w === 9) ponctuel += COUTS.dossier;
    if (d5 === 2 && w === 9) ponctuel += COUTS.dossierDotation;
    if (d6 === 1 && w >= 12) ponctuel += COUTS.binomes / 2;

    charges += ponctuel;
    const resultat = produits - charges;
    cumul += resultat;
    semaines.push({
      facturees,
      ratio: c.payees / facturees,
      trajets: c.trajets / facturees,
      annulations: c.annulees / facturees,
      cout: charges / facturees,
      resultat,
      cumul,
      produits,
      charges,
    });
  }

  // LE RYTHME DE FIN JUIN : toutes les décisions en place, sans aléa de la semaine.
  const reg = calculer(chemin, h, REGIME, SANS_BRUIT, [], chu);
  let regimeCharges = reg.charges + (d2 === 1 ? COUTS.planificatrice : 0);
  if (d2 === 2) regimeCharges += COUTS.appels;
  if (d2 === 0) regimeCharges += COUTS.litiges;
  const regimeSemaine = reg.produits - regimeCharges;
  const m = majoration(chemin, graine);
  const cpom = SEMAINES_PROJETEES * PART_APA * reg.facturees * (m.accordee - m.engagements);

  // L'ÉTÉ : les remplacements de juillet et d'août, par rapport à l'été dernier.
  const remplacees = ETE.remplacees * reg.facturees * SEMAINES_ETE;
  const routeParHeure = COUT_HORAIRE + KM_PAR_HEURE_DE_TRAJET * INDEMNITE_KM;
  const contribution = TARIF - COUT_MARGINAL.longue;
  let ete = 0;
  if (d6 === 1) {
    const formes = d1 === 1 ? ETE.trajetsFormesSecteur : ETE.trajetsFormes;
    ete += (ETE.trajetsRemplacants - formes) * remplacees * routeParHeure;
    ete += (ETE.nonAssurees - 0.01) * reg.facturees * SEMAINES_ETE * contribution;
  }
  if (d6 === 2) {
    ete -= ETE.partInterim * remplacees * SURCOUT_INTERIM;
    ete += (ETE.nonAssurees - 0.01) * reg.facturees * SEMAINES_ETE * contribution;
  }
  if (d6 === 0) {
    // Les passages courts et le ménage suspendus : moins de remplaçants, mais des contrats payés,
    // et des bénéficiaires qui ne reviennent pas à la rentrée.
    const restantes = d1 === 0 ? 0.1 : 1;
    const courtes = COURTES.part * reg.facturees * restantes * SEMAINES_ETE;
    const menage = 0.1 * (1 - COURTES.part) * reg.facturees * SEMAINES_ETE;
    const suspendues = courtes + menage;
    ete += 0.4 * ETE.trajetsRemplacants * remplacees * routeParHeure;
    ete += courtes * (COUT_MARGINAL.courte - TARIF);
    ete -= menage * contribution;
    ete -= 0.3 * suspendues * COUT_HORAIRE;
    const apres = SEMAINES_PROJETEES - SEMAINES_ETE;
    const parties = h.pertesEte * reg.facturees;
    ete -= apres * parties * (TARIF - COUT_MARGINAL.longue + SOUS_ACTIVITE.regime * COUT_HORAIRE);
    if (signalement(chemin, graine)) ete -= COUTS.signalement;
  }

  const projection = SEMAINES_PROJETEES * regimeSemaine + cpom + ete;
  return {
    semaines,
    objectif: RESULTAT_T1 + cumul + projection,
    resultatTrimestre: cumul,
    projection,
    regimeSemaine,
    heuresRegime: reg.facturees,
    coutRegime: regimeCharges / reg.facturees,
    ratioRegime: reg.payees / reg.facturees,
    trajetsRegime: reg.trajets / reg.facturees,
    ete,
    majoration: m,
    confiance: confiance(chemin, graine),
    chuAccepte: chu,
    plainte: plainte(chemin, graine),
    evenement,
    departs,
    signalement: signalement(chemin, graine),
    coutDeRevient: COUT_DE_REVIENT,
  };
}

/** Ce qui s'est passé pendant des semaines : suites des décisions, et imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    refus: chemin[D.levier] === 0 && dans(4),
    plainte: t.plainte && dans(6),
    plannings: chemin[D.levier] === 1 && dans(5),
    tournees: chemin[D.levier] === 1 && dans(9),
    relance: chemin[D.levier] === 2 && dans(6),
    facturation: chemin[D.annulations] === 0 && dans(5),
    reprise: (chemin[D.reprise] === 0 || chemin[D.reprise] === 1) && dans(9),
    evenement: t.evenement && dans(10),
    departs: t.departs > 0 && dans(11),
    cpom: chemin[D.cpom] !== 3 && dans(12),
    suspension: chemin[D.ete] === 0 && dans(12),
    signalement: t.signalement && dans(13),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDomicile {
  facturees: number | null;
  ratio: number | null;
  trajets: number | null;
  cout: number | null;
  cumul: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  annulations: number | null;
  semaine: number | null;
}

/**
 * Ce que Delphin lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ». Au lundi de la semaine 1, on montre l'an dernier,
 * sans le coût de revient : c'est à lui de le calculer.
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDomicile {
  if (semaine === 0) {
    return {
      facturees: HEURES_SEMAINE,
      ratio: HEURES_PAYEES / AN_DERNIER.facturees,
      trajets: RATIOS.trajets,
      cout: null,
      cumul: null,
      annulations: RATIOS.annulations,
      semaine: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    facturees: s.facturees,
    ratio: s.ratio,
    trajets: s.trajets,
    cout: s.cout,
    cumul: s.cumul,
    annulations: s.annulations,
    semaine,
  };
}
