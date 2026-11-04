import { auCentime } from "./amortissement";
import { CENTRES_DE_RESPONSABILITE } from "./centres-de-nova";
import { donneesDuMois, tableauDeBord } from "./couts-et-budgets";
import { PAIE_DU_MOIS } from "./exercice-de-nova";
import { DELAI_CONVENU_DE_CAMPUSTECH, NOVA_GESTION, type FicheDeGestion } from "./nova-gestion";
import { HEURES_LEGALES_PAR_MOIS, SEUIL_D_ALERTE_DE_L_ABSENTEISME } from "./ressources-humaines-de-nova";

/**
 * LE MONDE DU COURS : LE TABLEAU DE BORD DURABLE DE NOVA (le chapitre « Les indicateurs de durabilité
 * au tableau de bord », DCG UE11 4.1 et DSCG UE3 3.2).
 *
 * LE TABLEAU DE BORD EST CELUI DU CHAPITRE « TABLEAU DE BORD ». Les six mois de janvier à juin, les
 * enceintes vendues, le chiffre d'affaires, le résultat, la trésorerie et la part de marché de chaque
 * mois viennent de `tableauDeBord` (couts-et-budgets.ts), au centime : ce fichier ne les recalcule pas,
 * il leur ajoute des indicateurs de durabilité, environnementaux, sociaux et de gouvernance (ESG).
 *
 * CE QUI VIENT DES AUTRES FICHES : l'équipe de quatre opérateurs à 151,67 heures par mois (la paie du
 * cours), le seuil d'alerte de l'absentéisme (3 %, celui des indicateurs sociaux), le délai de paiement
 * du fournisseur de composants (22 jours, nova-gestion.ts), le délai légal entre professionnels
 * (60 jours, code de commerce L. 441-10) et la part de CampusTech dans les ventes. Les 16 € d'autres
 * coûts variables d'une enceinte comprennent l'énergie de la chaîne et l'emballage ; le loyer, les
 * charges du bâtiment.
 *
 * LES HYPOTHÈSES DU CHAPITRE, nommées et commentées ci-dessous : l'énergie de la chaîne et du bâtiment,
 * le facteur d'émission de l'électricité, les emballages des jeux de composants et leur valorisation,
 * les heures d'absence et l'accident du semestre, et les seuils d'alerte des indicateurs de durabilité.
 * La garde tests/cours/les-indicateurs-de-durabilite.test.ts refait chaque chiffre à la main.
 */

const MOIS_DU_SEMESTRE = 6;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

/**
 * L'ÉNERGIE (hypothèse du cours) : la chaîne consomme 1,2 kWh par enceinte montée (les fers à souder,
 * les visseuses, le banc d'écoute) ; le bâtiment, 1 500 kWh par mois quoi qu'on fabrique (l'éclairage,
 * le chauffage, les ordinateurs). Une part fixe, une part variable : comme un coût.
 */
export const KWH_PAR_ENCEINTE = 1.2;
export const KWH_DU_BATIMENT_PAR_MOIS = 1_500;

/** LE FACTEUR D'ÉMISSION DE L'ÉLECTRICITÉ (hypothèse du cours, un ordre de grandeur du réseau français) : 0,052 kg de CO2 équivalent par kWh. */
export const KG_CO2_PAR_KWH = 0.052;

/**
 * LES DÉCHETS (hypothèse du cours) : chaque jeu de composants arrive dans 0,35 kg de carton et de mousse.
 * Le recycleur reprend les cartons, 60 % du poids ; les mousses partent en benne. À partir d'avril, le
 * fournisseur reprend aussi ses mousses : 85 % du poids est valorisé.
 */
export const KG_D_EMBALLAGE_PAR_ENCEINTE = 0.35;
export const PART_VALORISEE = { avant: 0.6, apres: 0.85, aPartirDu: 3 } as const;

/**
 * LE SOCIAL DU SEMESTRE (hypothèse du cours) : les heures d'absence de l'équipe chaque mois (une
 * grippe en février), et un accident du travail avec arrêt en mars (une coupure en ouvrant un carton).
 */
export const HEURES_D_ABSENCE_DU_SEMESTRE = [16, 30, 12, 0, 18, 8] as const;
export const ACCIDENTS_DU_SEMESTRE = [0, 0, 1, 0, 0, 0] as const;

/**
 * LES SEUILS D'ALERTE DE LA DURABILITÉ (hypothèses du cours, sauf l'absentéisme et le délai légal) : un
 * voyant s'allume quand l'énergie dépasse 2,2 kWh par enceinte, quand la part valorisée des déchets
 * passe sous 70 %, quand l'absentéisme dépasse 3 % des heures payées, quand le délai de paiement des
 * fournisseurs dépasse le délai légal.
 */
export const SEUILS_DE_DURABILITE = {
  kwhParEnceinte: 2.2,
  partValorisee: 0.7,
  absenteisme: SEUIL_D_ALERTE_DE_L_ABSENTEISME,
  delaiFournisseurs: DELAI_CONVENU_DE_CAMPUSTECH,
} as const;

export type CodeDeVoyantDurable = keyof typeof SEUILS_DE_DURABILITE;

/** Le pilier de chaque indicateur, et le centre de NOVA qui en répond. */
export type PilierESG = "environnement" | "social" | "gouvernance";
export type CodeDIndicateurDurable = "kwhParEnceinte" | "co2ParEnceinte" | "partValorisee" | "absenteisme" | "tauxDeFrequence" | "delaiFournisseurs" | "partDuPremierClient";

/**
 * LES INDICATEURS DE DURABILITÉ DU TABLEAU DE BORD : leur pilier, le centre de responsabilité qui en
 * répond (l'atelier ou le service commercial de « Piloter un centre », la direction pour le reste), le
 * maillon de la chaîne de valeur où ils se mesurent, et la norme européenne de durabilité (ESRS) qu'ils
 * servent.
 */
export const INDICATEURS_DURABLES: readonly { code: CodeDIndicateurDurable; libelle: string; pilier: PilierESG; centre: string; maillon: string; norme: string }[] = [
  { code: "kwhParEnceinte", libelle: "Énergie par enceinte (kWh)", pilier: "environnement", centre: CENTRES_DE_RESPONSABILITE.atelier.nom, maillon: "la production", norme: "ESRS E1, changement climatique" },
  { code: "co2ParEnceinte", libelle: "Émissions par enceinte (kg de CO2 équivalent)", pilier: "environnement", centre: CENTRES_DE_RESPONSABILITE.atelier.nom, maillon: "la production", norme: "ESRS E1, changement climatique" },
  { code: "partValorisee", libelle: "Part des déchets valorisés", pilier: "environnement", centre: CENTRES_DE_RESPONSABILITE.atelier.nom, maillon: "les approvisionnements", norme: "ESRS E5, ressources et économie circulaire" },
  { code: "absenteisme", libelle: "Taux d'absentéisme", pilier: "social", centre: "La direction", maillon: "toute la chaîne", norme: "ESRS S1, effectifs de l'entreprise" },
  { code: "tauxDeFrequence", libelle: "Taux de fréquence des accidents du travail", pilier: "social", centre: CENTRES_DE_RESPONSABILITE.atelier.nom, maillon: "la production", norme: "ESRS S1, effectifs de l'entreprise" },
  { code: "delaiFournisseurs", libelle: "Délai de paiement des fournisseurs (jours)", pilier: "gouvernance", centre: "La direction", maillon: "les approvisionnements", norme: "ESRS G1, conduite des affaires" },
  { code: "partDuPremierClient", libelle: "Part du premier client professionnel dans les ventes", pilier: "gouvernance", centre: CENTRES_DE_RESPONSABILITE.commercial.nom, maillon: "la distribution", norme: "aucune : un risque de dépendance" },
];

/** Les leviers d'un mois : ses enceintes, l'énergie de la chaîne par enceinte, la part valorisée des déchets. */
export interface LeviersDurables {
  quantite: number;
  kwhParEnceinte: number;
  partValorisee: number;
}

/** La part valorisée des déchets d'un mois (0 : janvier), selon la reprise des mousses. */
export const partValoriseeDuMois = (mois: number) => (mois >= PART_VALORISEE.aPartirDu ? PART_VALORISEE.apres : PART_VALORISEE.avant);

/** Le résultat d'un mois à `quantite` enceintes : marge sur coût variable − charges fixes (le tableau de bord, sans publicité). */
export function resultatAuVolume(f: FicheDeGestion, quantite: number) {
  const d = donneesDuMois(f);
  return auCentime(quantite * (f.moisDeReference.prix - d.coutVariableUnitaire) - d.chargesFixes);
}

/**
 * LES INDICATEURS DE DURABILITÉ D'UN MOIS. Énergie = enceintes × kWh par enceinte + bâtiment ; énergie
 * par enceinte = énergie ÷ enceintes (une intensité : elle monte quand le volume baisse) ; émissions =
 * énergie × facteur. Déchets = enceintes × emballage ; part valorisée, celle du mois. Absentéisme =
 * heures d'absence ÷ heures payées (4 × 151,67) ; taux de fréquence = accidents avec arrêt × 1 000 000 ÷
 * heures travaillées (heures payées − absences). Délai fournisseurs, celui du contrat ; part du premier
 * client professionnel = ses enceintes ÷ celles du mois.
 */
export function indicateursDurablesDuMois(f: FicheDeGestion, mois: number, leviers: Partial<LeviersDurables> = {}) {
  const ventes = f.semestre.clienteles.map((c) => c.quantites[mois]!);
  const quantite = leviers.quantite ?? somme(ventes);
  const kwhParEnceinteDeLaChaine = leviers.kwhParEnceinte ?? KWH_PAR_ENCEINTE;
  const part = leviers.partValorisee ?? partValoriseeDuMois(mois);
  const kwh = auCentime(quantite * kwhParEnceinteDeLaChaine + KWH_DU_BATIMENT_PAR_MOIS);
  const co2 = auCentime(kwh * KG_CO2_PAR_KWH);
  const dechets = auCentime(quantite * KG_D_EMBALLAGE_PAR_ENCEINTE);
  const effectif = PAIE_DU_MOIS.effectif;
  const heuresPayees = auCentime(effectif * HEURES_LEGALES_PAR_MOIS);
  const absences = HEURES_D_ABSENCE_DU_SEMESTRE[mois]!;
  const heuresTravaillees = auCentime(heuresPayees - absences);
  const accidents = ACCIDENTS_DU_SEMESTRE[mois]!;
  const campustech = f.semestre.clienteles.find((c) => c.code === "campustech")!.quantites[mois]!;
  const valeurs: Record<CodeDIndicateurDurable, number> = {
    kwhParEnceinte: kwh / quantite,
    co2ParEnceinte: co2 / quantite,
    partValorisee: part,
    absenteisme: absences / heuresPayees,
    tauxDeFrequence: (accidents * 1_000_000) / heuresTravaillees,
    delaiFournisseurs: f.semestre.fournisseur.delai,
    partDuPremierClient: campustech / quantite,
  };
  const s = SEUILS_DE_DURABILITE;
  const voyants: Record<CodeDeVoyantDurable, boolean> = {
    kwhParEnceinte: valeurs.kwhParEnceinte > s.kwhParEnceinte + 1e-9,
    partValorisee: valeurs.partValorisee < s.partValorisee - 1e-9,
    absenteisme: valeurs.absenteisme > s.absenteisme + 1e-9,
    delaiFournisseurs: valeurs.delaiFournisseurs > s.delaiFournisseurs,
  };
  return {
    nom: f.semestre.mois[mois]!.nom,
    quantite,
    kwh,
    co2,
    dechets,
    valorises: auCentime(dechets * part),
    effectif,
    heuresPayees,
    absences,
    heuresTravaillees,
    accidents,
    campustech,
    valeurs,
    voyants,
    resultat: resultatAuVolume(f, quantite),
  };
}

/**
 * LE TABLEAU DE BORD DURABLE DU SEMESTRE : chaque mois, les indicateurs financiers du tableau de bord
 * (au centime) et les indicateurs de durabilité ; puis le semestre, chaque intensité recalculée sur les
 * totaux (et non en moyenne des mois).
 */
export function tableauDeBordDurable(f: FicheDeGestion = NOVA_GESTION) {
  const bord = tableauDeBord(f);
  const mois = Array.from({ length: MOIS_DU_SEMESTRE }, (_, i) => {
    const d = indicateursDurablesDuMois(f, i);
    const b = bord.mois[i]!;
    return { ...d, financier: { chiffreDAffaires: b.chiffreDAffaires, resultat: b.resultat, tresorerie: b.tresorerie, partDeMarche: b.partDeMarche } };
  });
  const total = (g: (m: (typeof mois)[number]) => number) => somme(mois.map(g));
  const quantite = total((m) => m.quantite);
  const kwh = auCentime(total((m) => m.kwh));
  const co2 = auCentime(total((m) => m.co2));
  const dechets = auCentime(total((m) => m.dechets));
  const valorises = auCentime(total((m) => m.valorises));
  const heuresPayees = auCentime(total((m) => m.heuresPayees));
  const absences = total((m) => m.absences);
  const heuresTravaillees = auCentime(total((m) => m.heuresTravaillees));
  const accidents = total((m) => m.accidents);
  return {
    mois,
    semestre: {
      quantite,
      kwh,
      co2,
      dechets,
      valorises,
      heuresPayees,
      absences,
      heuresTravaillees,
      accidents,
      kwhParEnceinte: kwh / quantite,
      co2ParEnceinte: co2 / quantite,
      partValorisee: valorises / dechets,
      absenteisme: absences / heuresPayees,
      tauxDeFrequence: (accidents * 1_000_000) / heuresTravaillees,
      chiffreDAffaires: bord.semestre.chiffreDAffaires,
      resultat: bord.semestre.resultat,
      /** Les émissions pour 1 000 € de chiffre d'affaires : une intensité financière. */
      co2ParMilleEuros: (co2 / bord.semestre.chiffreDAffaires) * 1_000,
    },
  };
}

/** Le plus petit volume du mois où l'énergie par enceinte tient sous son seuil : bâtiment ÷ (seuil − chaîne), à l'unité supérieure. */
export const volumeSousLeSeuilDEnergie = (kwhParEnceinte: number = KWH_PAR_ENCEINTE) =>
  Math.ceil(KWH_DU_BATIMENT_PAR_MOIS / (SEUILS_DE_DURABILITE.kwhParEnceinte - kwhParEnceinte) - 1e-9);

/** Le seuil de rentabilité du mois, en enceintes : charges fixes ÷ marge sur coût variable, à l'unité supérieure. */
export function seuilEnEnceintes(f: FicheDeGestion = NOVA_GESTION) {
  const d = donneesDuMois(f);
  return Math.ceil(d.chargesFixes / (f.moisDeReference.prix - d.coutVariableUnitaire) - 1e-9);
}
