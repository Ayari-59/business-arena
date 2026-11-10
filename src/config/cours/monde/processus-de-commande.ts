import { CAMPUSTECH } from "./exercice-de-nova";
import { CHARGES_FIXES_DU_MOIS, PRIX_DE_L_ENCEINTE } from "./nova-gestion";
import { HEURES_LEGALES_PAR_MOIS } from "./ressources-humaines-de-nova";

/**
 * LE MONDE DU COURS : LE PROCESSUS DE LA COMMANDE DE CAMPUSTECH, AVEC OU SANS PGI (le chapitre « Le
 * processus et le PGI », SGN de première T2.3).
 *
 * CE QUI VIENT DES FICHES : la commande mensuelle de CampusTech (320 enceintes, facturées le 20, payées
 * 80 jours plus tard : exercice-de-nova.ts, CAMPUSTECH), le prix d'une enceinte (59 €), et la paie du
 * mois des quatre salariés (10 650 € charges comprises, nova-gestion.ts) sur 151,67 heures chacun.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · aujourd'hui, chaque service a son outil (un tableur des ventes, le planning de l'atelier, un
 *     logiciel de facturation) : la commande se ressaisit deux fois, et chaque transmission attend que
 *     le service suivant la lise ; les durées des activités sont celles du tableau ci-dessous ;
 *   · un progiciel de gestion intégré (PGI) en nuage ne garde qu'une base de données : la commande
 *     saisie une fois est vue de tous, les deux ressaisies disparaissent, et avec elles leur attente.
 *     Il coûte 75 € par mois et par poste, pour 4 postes ;
 *   · chaque ressaisie prend 30 minutes de travail par commande.
 */

export type ServiceDeNova = "commercial" | "atelier" | "expedition" | "comptabilite" | "client";
export type FluxDuProcessus = "information" | "physique" | "financier";

export interface ActiviteDuProcessus {
  code: string;
  libelle: string;
  acteur: ServiceDeNova;
  flux: FluxDuProcessus;
  /** Les jours ouvrés que l'activité prend, sans PGI et avec. */
  jours: { sans: number; avec: number };
  /** Une ressaisie : le PGI la supprime. */
  ressaisie?: true;
}

export const ACTIVITES_DE_LA_COMMANDE: readonly ActiviteDuProcessus[] = [
  { code: "saisie", libelle: "Recevoir la commande et la saisir", acteur: "commercial", flux: "information", jours: { sans: 1, avec: 1 } },
  { code: "planning", libelle: "Ressaisir la commande dans le planning de l'atelier", acteur: "atelier", flux: "information", jours: { sans: 2, avec: 0 }, ressaisie: true },
  { code: "montage", libelle: "Monter et contrôler les enceintes", acteur: "atelier", flux: "physique", jours: { sans: 5, avec: 5 } },
  { code: "expedition", libelle: "Préparer et expédier la livraison", acteur: "expedition", flux: "physique", jours: { sans: 1, avec: 1 } },
  { code: "facture", libelle: "Ressaisir la livraison et envoyer la facture", acteur: "comptabilite", flux: "information", jours: { sans: 3, avec: 0 }, ressaisie: true },
];

/** Ce que coûte le PGI, et ce que prend une ressaisie (hypothèses du cours). */
export const PGI_EN_NUAGE = { parPosteEtParMois: 75, postes: 4, minutesParRessaisie: 30 } as const;

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** L'heure de travail d'un salarié de NOVA, charges comprises, au centime. */
export const COUT_HORAIRE_DE_NOVA = auCentime(CHARGES_FIXES_DU_MOIS.personnel / 4 / HEURES_LEGALES_PAR_MOIS);

/** Le processus, de la commande à la facture et à l'encaissement, sans PGI et avec. */
export function processusDeLaCommande() {
  const somme = (cle: "sans" | "avec") => ACTIVITES_DE_LA_COMMANDE.reduce((n, a) => n + a.jours[cle], 0);
  const sans = somme("sans");
  const avec = somme("avec");
  const ressaisies = ACTIVITES_DE_LA_COMMANDE.filter((a) => a.ressaisie).length;
  return {
    sans,
    avec,
    joursGagnes: sans - avec,
    delaiDePaiement: CAMPUSTECH.delai,
    /** De la commande à l'argent : jusqu'à la facture, puis le délai de CampusTech. */
    encaissementSans: sans + CAMPUSTECH.delai,
    encaissementAvec: avec + CAMPUSTECH.delai,
    ressaisies,
    montantDeLaCommande: CAMPUSTECH.enceintesParFacture * PRIX_DE_L_ENCEINTE,
    /** Les heures de ressaisie qu'une commande demande sans PGI. */
    heuresParCommande: (ressaisies * PGI_EN_NUAGE.minutesParRessaisie) / 60,
    abonnement: PGI_EN_NUAGE.parPosteEtParMois * PGI_EN_NUAGE.postes,
  };
}

/** Ce que le PGI fait économiser en un mois, pour un nombre de commandes traitées. */
export function economieDuPgi(commandes: number, postes: number = PGI_EN_NUAGE.postes) {
  const k = processusDeLaCommande();
  const temps = auCentime(commandes * k.heuresParCommande * COUT_HORAIRE_DE_NOVA);
  const abonnement = postes * PGI_EN_NUAGE.parPosteEtParMois;
  return { commandes, postes, temps, abonnement, gain: auCentime(temps - abonnement) };
}

/**
 * LE PGI POUR TOUTE L'ÉQUIPE (hypothèse du cas « Deux postes de plus ») : le président veut ouvrir le
 * PGI à 6 postes, l'expédition et lui-même en plus ; NOVA traite 40 commandes par mois, celles de
 * CampusTech et des revendeurs.
 */
export const PGI_POUR_TOUTE_L_EQUIPE = { postes: 6, commandesParMois: 40 } as const;

/** Le plus petit nombre de commandes par mois à partir duquel le temps gagné paie l'abonnement. */
export const COMMANDES_QUI_PAIENT_LE_PGI = Math.ceil(processusDeLaCommande().abonnement / (processusDeLaCommande().heuresParCommande * COUT_HORAIRE_DE_NOVA) - 1e-9);
