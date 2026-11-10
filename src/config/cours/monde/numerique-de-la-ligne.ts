import { auCentime } from "./amortissement";
import { margeUnitaire } from "./capacite";
import { FICHE_DE_DIRECTION } from "./direction-de-nova";
import { ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA, JOURS_DE_MONTAGE_PAR_TRIMESTRE } from "./production-et-logistique";

/**
 * LE MONDE DU COURS : LE NUMÉRIQUE DANS LA PRODUCTION DE NOVA (enseignement commun de terminale STMG,
 * question 1.4, lot C).
 *
 * CE QUI VIENT DES FICHES : la ligne de 4 postes et ses 7 000 enceintes par trimestre (nova-capacite.ts),
 * les 58 jours de montage d'un trimestre (production-et-logistique.ts), la marge de 21 € d'une enceinte
 * (capacite.ts). Un poste arrêté un jour fait perdre le quart de ce que la ligne monte ce jour-là.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LES ARRÊTS IMPRÉVUS : sans surveillance, chaque poste tombe en panne quelques jours par an, le
 *     poste de soudure le plus souvent (4 jours), puis le poste de câblage (3), le montage du boîtier et
 *     l'emballage (1 chacun) ;
 *   · LES CAPTEURS CONNECTÉS : posés sur un poste, ils mesurent ses vibrations et sa température, et une
 *     application dans le nuage, entraînée sur les pannes passées, prévient avant la panne. L'arrêt se
 *     planifie alors en une demi-journée. Un poste équipé coûte 1 200 € par an (capteurs, abonnement) ;
 *   · LE CAS : NOVA reçoit 1 800 factures de fournisseurs par an ; la saisie d'une facture papier prend
 *     6 minutes à l'assistante, payée 25 € de l'heure charges comprises ; une plateforme de factures
 *     électroniques coûte 1 500 € par an, et ne laisse qu'une minute de vérification par facture.
 */

export const ENTREPRISES_DU_NUMERIQUE = ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA;

const f = FICHE_DE_DIRECTION;

export const POSTES_DE_LA_LIGNE: readonly { nom: string; joursDArret: number }[] = [
  { nom: "le poste de soudure", joursDArret: 4 },
  { nom: "le poste de câblage", joursDArret: 3 },
  { nom: "le montage du boîtier", joursDArret: 1 },
  { nom: "l'emballage", joursDArret: 1 },
];
export const CAPTEURS = { coutParPosteEtParAn: 1_200, arretPlanifie: 0.5 } as const;

/** Ce qu'un poste monte en un jour (à l'enceinte inférieure) et la marge qu'un jour d'arrêt fait perdre. */
export function jourDArret() {
  const parJour = Math.floor(f.ligne.capaciteParTrimestre / f.ligne.postes / JOURS_DE_MONTAGE_PAR_TRIMESTRE + 1e-9);
  return { capacite: f.ligne.capaciteParTrimestre, postes: f.ligne.postes, jours: JOURS_DE_MONTAGE_PAR_TRIMESTRE, parJour, marge: margeUnitaire(f), margePerdue: parJour * margeUnitaire(f) };
}

/** Les postes équipés de capteurs, des plus fragiles aux moins fragiles : ce qu'ils coûtent, ce qu'ils évitent, ce qu'ils laissent. */
export function capteurs(postesEquipes: number) {
  const j = jourDArret();
  const equipes = POSTES_DE_LA_LIGNE.slice(0, postesEquipes);
  const evites = auCentime(equipes.reduce((t, p) => t + (p.joursDArret - CAPTEURS.arretPlanifie), 0));
  const marge = auCentime(evites * j.margePerdue);
  const cout = postesEquipes * CAPTEURS.coutParPosteEtParAn;
  return { postesEquipes, evites, marge, cout, gain: auCentime(marge - cout) };
}

/** Le nombre de postes à équiper qui rapporte le plus. */
export function postesQuiRapportentLePlus() {
  let meilleur = 0;
  for (let n = 1; n <= POSTES_DE_LA_LIGNE.length; n++) if (capteurs(n).gain > capteurs(meilleur).gain) meilleur = n;
  return meilleur;
}

/** Le cas : la plateforme de factures électroniques. */
export const FACTURES = { parAn: 1_800, minutesPapier: 6, minutesElectronique: 1, coutHoraire: 25, plateforme: 1_500 } as const;

export function facturesElectroniques() {
  const k = FACTURES;
  const heuresGagnees = auCentime((k.parAn * (k.minutesPapier - k.minutesElectronique)) / 60);
  const economie = auCentime(heuresGagnees * k.coutHoraire);
  return { ...k, heuresGagnees, economie, gain: auCentime(economie - k.plateforme) };
}
