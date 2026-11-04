import { coutMoyenDUnDefaut, margeUnitaire } from "./capacite";
import { coefficientDeConfiance, probabiliteSous } from "./loi-normale";
import type { FicheDeLaCapacite } from "./nova-capacite";
import { qualiteAuBudget } from "./production-et-logistique";

/**
 * LE MONDE DU COURS : LE PILOTAGE DE LA QUALITÉ SUR LA LIGNE DE NOVA (DCG UE 11, programme 2025, 4.3
 * « Aider au pilotage de la qualité » : outils de gestion de la qualité, loi normale, échantillonnage
 * sous l'angle des estimations, intervalle de confiance d'une moyenne).
 *
 * Ce fichier ne recopie aucun chiffre de la qualité de NOVA : il relit la fiche de capacité
 * (nova-capacite.ts, capacite.ts, relus par production-et-logistique.ts), celle des chapitres
 * « Produire bien » et « Le coût de la non-qualité ». L'année N + 1, au budget de prévention actuel :
 * 26 000 enceintes, 3,5 % de défauts, soit 910 ; le contrôle final en trouve 80 %, qui se retouchent
 * (20 €) ; les autres partent chez le client et reviennent sous garantie (100 €), et chacun fait perdre
 * 3 ventes, 21 € de marge chacune.
 *
 * LES HYPOTHÈSES DU CHAPITRE sont les constantes ci-dessous, chacune nommée et commentée : le poids
 * d'une enceinte et sa tolérance, la part des autres causes de défaut, la dérive du réglage, la pesée
 * en bout de ligne, l'échantillon horaire et le relevé du jour.
 */

/**
 * LE POIDS D'UNE ENCEINTE FINIE (hypothèse du cours) : le cahier des charges veut 850 g, à 25 g près.
 * Une enceinte hors de cette tolérance a un aimant mal centré ou un excès de colle : elle sonne mal,
 * c'est un défaut. Bien réglée, la machine de collage donne un poids qui suit la loi normale
 * N(850 ; 10) : de nombreuses petites causes indépendantes, aucune prépondérante.
 */
export const POIDS_D_UNE_ENCEINTE = { cible: 850, tolerance: 25, ecartType: 10 } as const;

/**
 * LES AUTRES CAUSES DE DÉFAUT (hypothèse du cours) : les défauts de l'année qui ne viennent pas du
 * poids se partagent entre quatre causes, dans ces proportions. Le dernier compte prend l'arrondi.
 */
export const AUTRES_CAUSES_DE_DEFAUT = [
  { code: "soudure", libelle: "Soudure froide d'un câble", part: 0.45 },
  { code: "membrane", libelle: "Membrane rayée au montage", part: 0.25 },
  { code: "appairage", libelle: "Appairage sans fil défaillant", part: 0.18 },
  { code: "autres", libelle: "Autres causes", part: 0.12 },
] as const;

/** LA DÉRIVE DU RÉGLAGE (hypothèse du cours) : la buse de colle s'encrasse, le poids moyen monte à 855 g, l'écart-type ne change pas. */
export const POIDS_DERIVE = 855;

/**
 * LA PESÉE EN BOUT DE LIGNE (hypothèse du cours) : une balance automatique qui écarte toute enceinte
 * hors du poids avant l'emballage, 12 000 € par an (sa location, son étalonnage). Un défaut de poids
 * se retouche alors toujours ; aucun ne part chez le client.
 */
export const PESEE_EN_BOUT_DE_LIGNE = 12_000;

/** L'ÉCHANTILLON HORAIRE (hypothèse du cours) : chaque heure, le contrôleur pèse 25 enceintes prises au hasard. */
export const ECHANTILLON_HORAIRE = 25;

/** LA CONFIANCE DES INTERVALLES DU CHAPITRE : 95 %. */
export const CONFIANCE_DE_L_ESTIMATION = 0.95;

/**
 * LE RELEVÉ DU JOUR (hypothèse du cours) : 50 enceintes pesées au hasard dans la production d'une
 * journée, par classes de 5 g. Ses bornes commencent à 830 g.
 */
export const RELEVE_DU_JOUR = { premiereBorne: 830, largeur: 5, effectifs: [1, 2, 5, 7, 10, 10, 8, 4, 2, 1] } as const;

/** LA PRÉCISION VOULUE SUR LA MOYENNE (hypothèse du cours) : la connaître à 1 g près. */
export const PRECISION_VOULUE = 1;

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

/** Les parts d'une production de poids N(m ; σ) sous la tolérance, au-dessus, et hors tolérance en tout. */
export function partHorsTolerance(moyenne: number, ecartType: number, p: { cible: number; tolerance: number } = POIDS_D_UNE_ENCEINTE) {
  const sous = probabiliteSous(p.cible - p.tolerance, moyenne, ecartType);
  const dessus = 1 - probabiliteSous(p.cible + p.tolerance, moyenne, ecartType);
  return { sous, dessus, hors: sous + dessus };
}

/** Ce que coûte un défaut, ventes perdues comprises : le coût moyen d'un défaut, plus la marge des ventes qu'un défaut livré fait perdre. */
export function coutDUnDefautTout(f: FicheDeLaCapacite) {
  const q = f.qualite;
  return auCentime(coutMoyenDUnDefaut(f) + (1 - q.controleFinal.tauxDeDetection) * q.ventesPerduesParDefautLivre * margeUnitaire(f));
}

/** Ce qu'un défaut de poids coûte de moins quand la pesée le trouve toujours : il se retouche, au lieu de coûter le défaut moyen. */
export const economieDeLaPesee = (f: FicheDeLaCapacite) => auCentime(coutDUnDefautTout(f) - f.qualite.coutDUnDefautDetecte);

/** Le nombre de défauts de poids par an à partir duquel la pesée coûte moins qu'elle n'évite. */
export const seuilDeLaPesee = (f: FicheDeLaCapacite) => Math.ceil(PESEE_EN_BOUT_DE_LIGNE / economieDeLaPesee(f) - 1e-9);

/** Les défauts de poids de l'année, pour un réglage et un écart-type, et ce qu'ils coûtent. */
export function defautsDePoids(f: FicheDeLaCapacite, moyenne: number = POIDS_D_UNE_ENCEINTE.cible, ecartType: number = POIDS_D_UNE_ENCEINTE.ecartType) {
  const volume = qualiteAuBudget(f).volume;
  const p = partHorsTolerance(moyenne, ecartType);
  const nombre = volume * p.hors;
  return { volume, ...p, nombre, cout: auCentime(nombre * coutDUnDefautTout(f)) };
}

/**
 * LE DIAGRAMME DE PARETO DES DÉFAUTS DE L'ANNÉE : les défauts de poids, relevés à l'unité, que la loi
 * normale prévoit sur la ligne bien réglée ; les autres, partagés entre les autres causes. Classés par
 * nombre décroissant, avec leur part et la part cumulée.
 */
export function paretoDesDefauts(f: FicheDeLaCapacite) {
  const total = qualiteAuBudget(f).defauts;
  const poids = Math.round(defautsDePoids(f).nombre);
  const reste = total - poids;
  const autres = AUTRES_CAUSES_DE_DEFAUT.map((c) => ({ code: c.code as string, libelle: c.libelle as string, nombre: Math.round(reste * c.part) }));
  autres[autres.length - 1]!.nombre = reste - somme(autres.slice(0, -1).map((c) => c.nombre));
  const causes = [{ code: "poids", libelle: "Poids hors tolérance (aimant, colle)", nombre: poids }, ...autres].sort((a, b) => b.nombre - a.nombre);
  let cumul = 0;
  return {
    total,
    causes: causes.map((c) => {
      cumul += c.nombre;
      return { ...c, part: c.nombre / total, cumul: cumul / total };
    }),
  };
}

/** L'écart-type de la moyenne d'un échantillon de taille n : σ ÷ √n. */
export const ecartTypeDeLaMoyenne = (ecartType: number, n: number) => ecartType / Math.sqrt(n);

/** Le relevé du jour : ses classes, sa moyenne, son écart-type observé et l'estimation de l'écart-type de la production. */
export function releveDuJour() {
  const r = RELEVE_DU_JOUR;
  const classes = r.effectifs.map((n, i) => ({ de: r.premiereBorne + i * r.largeur, a: r.premiereBorne + (i + 1) * r.largeur, centre: r.premiereBorne + (i + 0.5) * r.largeur, effectif: n }));
  const n = somme(r.effectifs);
  const moyenne = somme(classes.map((c) => c.effectif * c.centre)) / n;
  const variance = somme(classes.map((c) => c.effectif * (c.centre - moyenne) ** 2)) / n;
  const ecartTypeObserve = Math.sqrt(variance);
  return { classes, n, moyenne, ecartTypeObserve, estimationDeLEcartType: ecartTypeObserve * Math.sqrt(n / (n - 1)) };
}

/** L'intervalle de confiance d'une moyenne : x̄ ± t × σ ÷ √n. */
export function intervalleDeConfiance(moyenne: number, ecartType: number, n: number, t: number) {
  const demi = (t * ecartType) / Math.sqrt(n);
  return { demi, bas: moyenne - demi, haut: moyenne + demi };
}

/** La taille d'échantillon qui donne la moyenne à `precision` près : n ≥ (t × σ ÷ précision)², à l'entier supérieur. */
export const tailleDEchantillon = (ecartType: number, precision: number, t: number) => Math.ceil(((t * ecartType) / precision) ** 2 - 1e-9);

/** Le laboratoire : une position (réglage, écart-type, taille de l'échantillon, confiance en %) et ce qu'elle donne. */
export function laboratoireDeLaLigne(f: FicheDeLaCapacite, p: Readonly<Record<string, number>>) {
  const d = defautsDePoids(f, p.reglage!, p.ecartType!);
  const t = coefficientDeConfiance(p.confiance! / 100);
  return { ...d, demi: intervalleDeConfiance(p.reglage!, p.ecartType!, p.taille!, t).demi };
}
