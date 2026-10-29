import { JOURS_PAR_AN } from "../remises";
import { anneeDuMarche, type BilanDUneEnseigne } from "./attractivite";
import type { ClienteleDuMarche, CodeDeClientele, FicheMercatique } from "./mercatique-de-nova";

/**
 * LE MODÈLE DU MARCHÉ DE NOVA, POUR L'ÉCONOMIE ET LA MERCATIQUE (lot M4) : tout se calcule sur la
 * fiche (monde/mercatique-de-nova.ts), en fonctions pures. Les leviers qu'un curseur ou un
 * laboratoire fait bouger (un prix, une quantité mise en vente, un budget, un délai, une remise) sont
 * des paramètres ; leur valeur de départ est dans la fiche.
 *
 *   1. LA DEMANDE ET L'OFFRE DU TRIMESTRE : la droite de demande (à l'enceinte inférieure), la
 *      quantité mise en vente, la quantité échangée (la plus petite des deux), ce qui reste.
 *   2. LE PRIX D'ÉQUILIBRE : pénurie, excédent ou équilibre (à 1 % de l'offre près), le tâtonnement
 *      par pas de 10 % du prix, l'essai au milieu, le prix le plus bas sans pénurie.
 *   3. LA DEMANDE RÉPOND AU PRIX : l'élasticité entre deux prix, le chiffre d'affaires et la marge.
 *   4. LES CLIENTÈLES : le poids, la part de marché et la réserve de chaque segment, ses sensibilités,
 *      le tarif réservé à une clientèle.
 *   5. LE PRIX PSYCHOLOGIQUE : les repères de prix, le saut au seuil, la remise la plus forte que la
 *      clientèle croit encore.
 *   6. LA PART DE MARCHÉ : le marché de toutes les enceintes, NOVA et ses deux concurrents, trimestre
 *      par trimestre.
 *   7. LA CONCURRENCE ET LA COMMUNICATION : l'année type du marché à trois (attractivite.ts).
 *   8. LES CANAUX DE DISTRIBUTION : le canal direct, CampusTech, l'attente et la remise.
 *
 * CONVENTIONS : les montants sont au centime, les pourcentages au dixième (comme l'élève les écrit),
 * une élasticité au centième ; une demande se compte à l'enceinte inférieure, des ventes nécessaires
 * à l'enceinte supérieure.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;
const plancher = (x: number) => Math.floor(x + 1e-9);
const plafond = (x: number) => Math.ceil(x - 1e-9);
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

/** Les positions d'une grille, de min à max par pas. */
export const grille = (min: number, max: number, pas: number) =>
  Array.from({ length: Math.round((max - min) / pas) + 1 }, (_, i) => Math.round((min + i * pas) * 100) / 100);

// ═════════════════════════════════════════════════════════════════════════════
// 0. NOVA : SON PRIX, SES COÛTS, SON OFFRE
// ═════════════════════════════════════════════════════════════════════════════

export const prixDeNova = (f: FicheMercatique) => f.gestion.decision.prix;
export const coutVariable = (f: FicheMercatique) => f.gestion.moisDeReference.coutVariable.composants + f.gestion.moisDeReference.coutVariable.autres;
export const margeUnitaire = (f: FicheMercatique) => auCentime(prixDeNova(f) - coutVariable(f));
/** Ce que la ligne a fabriqué au premier trimestre : l'offre du trimestre (NOVA n'a pas de stock d'enceintes finies). */
export const offreDuTrimestre = (f: FicheMercatique) => f.gestion.decision.production;
export const capacite = (f: FicheMercatique) => f.gestion.decision.capacite;

// ═════════════════════════════════════════════════════════════════════════════
// 1. LA DEMANDE ET L'OFFRE DU TRIMESTRE
// ═════════════════════════════════════════════════════════════════════════════

export type TrimestreLu = 1 | 4;

/** Ce que la saison fait à la demande : les livraisons du trimestre de l'année N, rapportées à celles du premier. */
export const coefficientDeSaison = (f: FicheMercatique, trimestre: TrimestreLu = 1) => f.ventesDeLAnneeN[trimestre - 1]! / f.ventesDeLAnneeN[0]!;

/** La demande reçue par NOVA en un trimestre, au prix p : la droite de la fiche, à la saison du trimestre, à l'enceinte inférieure. */
export function demandeAuPrix(f: FicheMercatique, prix: number, trimestre: TrimestreLu = 1) {
  const d = f.gestion.decision.demande;
  return Math.max(0, plancher(coefficientDeSaison(f, trimestre) * (d.aPrixNul - d.perdueParEuro * prix)));
}

/** Le marché d'un trimestre vu de NOVA : la demande, l'offre, ce qui s'échange et ce qui reste. */
export interface MarcheDuTrimestre {
  prix: number;
  demande: number;
  offre: number;
  echangee: number;
  /** La demande que l'offre n'a pas servie : des acheteurs repartis sans rien. */
  nonServie: number;
  /** L'offre qui n'a pas trouvé d'acheteur. */
  nonVendue: number;
}

/** Les leviers d'un trimestre : le prix, la quantité mise en vente, le trimestre (sa saison). */
export interface LeviersDuTrimestre {
  prix: number;
  offre: number;
  trimestre: TrimestreLu;
}

/** L'offre de départ d'un trimestre : ce que la ligne a fabriqué au premier, toute sa capacité en fin d'année. */
export const offreDeDepart = (f: FicheMercatique, trimestre: TrimestreLu = 1) => (trimestre === 1 ? offreDuTrimestre(f) : capacite(f));

/** Le marché d'un trimestre : la quantité échangée est la plus petite de la demande et de l'offre. */
export function marcheAuPrix(f: FicheMercatique, leviers: Partial<LeviersDuTrimestre> = {}): MarcheDuTrimestre {
  const trimestre = leviers.trimestre ?? 1;
  const prix = leviers.prix ?? prixDeNova(f);
  const offre = leviers.offre ?? offreDeDepart(f, trimestre);
  const demande = demandeAuPrix(f, prix, trimestre);
  const echangee = Math.min(demande, offre);
  return { prix, demande, offre, echangee, nonServie: demande - echangee, nonVendue: offre - echangee };
}

export type SensDeLaDemande = "baisse" | "hausse" | "aucun";

/** Le premier trimestre à trois prix (10 % moins cher, le prix de NOVA, 10 % plus cher), la même quantité mise en vente. */
export function troisPrix(f: FicheMercatique, offre = offreDuTrimestre(f)) {
  const p = prixDeNova(f);
  const e = f.ecartDePrix;
  const [bas, base, haut] = [1 - e, 1, 1 + e].map((k) => marcheAuPrix(f, { prix: auCentime(p * k), offre })) as [MarcheDuTrimestre, MarcheDuTrimestre, MarcheDuTrimestre];
  const sens: SensDeLaDemande =
    bas.demande > base.demande && base.demande > haut.demande ? "baisse" : bas.demande < base.demande && base.demande < haut.demande ? "hausse" : "aucun";
  return {
    bas,
    base,
    haut,
    sens,
    ecart: Math.round(e * 100),
    demandeEnPlus: bas.demande - base.demande,
    demandeEnMoins: base.demande - haut.demande,
    echangeeEnPlus: bas.echangee - base.echangee,
  };
}

/** Le prix le plus bas, à l'euro, auquel une offre donnée sert toute la demande du trimestre. */
export function prixLePlusBasServi(f: FicheMercatique, offre: number, trimestre: TrimestreLu = 1) {
  let p = Math.ceil(prixDeNova(f) * 2);
  while (p > 0 && demandeAuPrix(f, p - 1, trimestre) <= offre) p--;
  while (demandeAuPrix(f, p, trimestre) > offre) p++;
  return p;
}

/** La saison du marché de toutes les enceintes, mois par mois sur le semestre : le total, le mois le plus fort et le plus faible. */
export function saisonDuMarche(f: FicheMercatique) {
  const s = f.gestion.semestre;
  const mois = s.mois.map((m, i) => ({ nom: m.nom, ventes: s.marche[i]! }));
  const plusFort = mois.reduce((a, b) => (b.ventes > a.ventes ? b : a));
  const plusFaible = mois.reduce((a, b) => (b.ventes < a.ventes ? b : a));
  return { mois, total: somme(mois.map((m) => m.ventes)), plusFort, plusFaible, ecart: plusFort.ventes - plusFaible.ventes };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. LE PRIX D'ÉQUILIBRE
// ═════════════════════════════════════════════════════════════════════════════

export type SituationDuMarche = "penurie" | "excedent" | "equilibre";

/** Pénurie, excédent ou équilibre : la demande et l'offre comparées, à la marge d'équilibre près (1 % de l'offre). */
export function situationDuMarche(f: FicheMercatique, m: Pick<MarcheDuTrimestre, "demande" | "offre">): SituationDuMarche {
  if (Math.abs(m.demande - m.offre) <= f.margeDEquilibre * m.offre + 1e-9) return "equilibre";
  return m.demande > m.offre ? "penurie" : "excedent";
}

export interface Essai extends MarcheDuTrimestre {
  /** L'écart au prix de départ, en pas de 10 %. */
  pas: number;
}

export type OuEstLEquilibre = "sous-le-milieu" | "au-milieu" | "au-dessus-du-milieu";

/**
 * LE TÂTONNEMENT : du prix de NOVA, par pas de 10 %, vers le haut tant que la demande dépasse l'offre,
 * vers le bas tant que l'offre la dépasse, jusqu'au premier prix où la situation s'inverse (huit pas au
 * plus) ; puis un essai au milieu de l'intervalle trouvé. La quantité mise en vente ne bouge pas.
 */
export function chercherLePrix(f: FicheMercatique, trimestre: TrimestreLu = 1, offre = offreDeDepart(f, trimestre)) {
  const depart = marcheAuPrix(f, { trimestre, offre });
  const situation = situationDuMarche(f, depart);
  const sens = depart.demande >= depart.offre ? 1 : -1;
  const essais: Essai[] = [{ pas: 0, ...depart }];
  for (let k = 1; k <= 8; k++) {
    const m = marcheAuPrix(f, { trimestre, offre, prix: auCentime(depart.prix * (1 + sens * k * f.ecartDePrix)) });
    essais.push({ pas: sens * k, ...m });
    if ((m.demande - m.offre) * sens <= 0) break;
  }
  const dernier = essais.at(-1)!;
  const avant = essais.at(-2)!;
  if ((dernier.demande - dernier.offre) * sens > 0) throw new Error("Le marché ne s'inverse pas en huit pas");
  const [bas, haut] = avant.prix < dernier.prix ? [avant, dernier] : [dernier, avant];
  const milieu = marcheAuPrix(f, { trimestre, offre, prix: auCentime((bas.prix + haut.prix) / 2) });
  const s = situationDuMarche(f, milieu);
  const equilibre: OuEstLEquilibre = s === "equilibre" ? "au-milieu" : milieu.demande > milieu.offre ? "au-dessus-du-milieu" : "sous-le-milieu";
  return { trimestre, depart, situation, sens, essais, avant, dernier, bas, haut, milieu, equilibre, auDessus: sens > 0 };
}

export type RechercheDuPrix = ReturnType<typeof chercherLePrix>;

/** Le prix d'une grille où la demande s'écarte le moins d'une offre donnée (le premier en cas d'égalité). */
export const prixLePlusProche = (f: FicheMercatique, prix: readonly number[], offre: number, trimestre: TrimestreLu = 1) =>
  prix.reduce((a, b) => (Math.abs(demandeAuPrix(f, b, trimestre) - offre) < Math.abs(demandeAuPrix(f, a, trimestre) - offre) ? b : a));

/** Le prix le plus haut, à l'euro, auquel la demande absorbe encore toute une offre (pas d'excédent). */
export function prixLePlusHautSansExcedent(f: FicheMercatique, offre: number, trimestre: TrimestreLu = 1) {
  let p = 0;
  while (demandeAuPrix(f, p + 1, trimestre) >= offre) p++;
  return p;
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA DEMANDE RÉPOND AU PRIX
// ═════════════════════════════════════════════════════════════════════════════

/** La demande à trois prix, l'élasticité entre le prix de NOVA et le prix 10 % plus cher, et le chiffre d'affaires. */
export function demandeEtPrix(f: FicheMercatique) {
  const t = troisPrix(f);
  const [bas, base, haut] = [t.bas, t.base, t.haut];
  const variationDemande = auDixieme((haut.demande / base.demande - 1) * 100);
  const variationPrix = auDixieme((haut.prix / base.prix - 1) * 100);
  const elasticite = auCentieme(variationDemande / variationPrix);
  const caAvant = Math.round(base.demande * base.prix);
  const caApres = Math.round(haut.demande * haut.prix);
  return {
    bas,
    base,
    haut,
    ecart: t.ecart,
    variationDemande,
    variationPrix,
    elasticite,
    elastique: Math.abs(elasticite) > 1,
    caAvant,
    caApres,
    variationCa: auDixieme((caApres / caAvant - 1) * 100),
    gagneDemandeEnBaissant: auDixieme((bas.demande / base.demande - 1) * 100),
  };
}

/** Le premier trimestre à un prix, si NOVA servait toute la demande dans la limite de sa ligne : ventes, chiffre d'affaires, marge sur coût variable. */
export function trimestreAuPrix(f: FicheMercatique, prix: number) {
  const demande = demandeAuPrix(f, prix);
  const ventes = Math.min(demande, capacite(f));
  return { prix, demande, ventes, chiffreDAffaires: auCentime(ventes * prix), marge: auCentime(ventes * (prix - coutVariable(f))) };
}

/** Le prix d'une grille qui laisse la plus grande marge sur coût variable au premier trimestre (le premier en cas d'égalité). */
export const meilleurPrix = (f: FicheMercatique, prix: readonly number[]) =>
  prix.map((p) => trimestreAuPrix(f, p)).reduce((a, b) => (b.marge > a.marge ? b : a));

// ═════════════════════════════════════════════════════════════════════════════
// 4. LES CLIENTÈLES
// ═════════════════════════════════════════════════════════════════════════════

export const clienteleDe = (f: FicheMercatique, code: CodeDeClientele) => {
  const k = f.clienteles.find((x) => x.code === code);
  if (!k) throw new Error(`Pas de clientèle ${code}`);
  return k;
};

/**
 * La demande d'une clientèle au prix p (sa droite, sans arrondi : à l'euro ou au demi-euro, elle tombe
 * juste). Avec le seuil : passé son seuil rond, elle perd le saut au seuil.
 */
export function demandeDeLaClientele(f: FicheMercatique, k: ClienteleDuMarche, prix: number, avecLeSeuil = false) {
  const droite = Math.max(0, k.demandeAPrixNul - k.perdueParEuro * prix);
  const saut = avecLeSeuil && k.seuil !== null && prix >= k.seuil - 1e-9 ? 1 - f.sautAuSeuil : 1;
  return Math.round(droite * saut * 1e6) / 1e6;
}

/** Les clientèles du premier trimestre au prix de NOVA : taille, demande reçue, chiffre d'affaires, poids, part, réserve, sensibilités. */
export function segmentation(f: FicheMercatique) {
  const prix = prixDeNova(f);
  const e = f.ecartDePrix;
  const brutes = f.clienteles.map((k) => {
    const demande = demandeDeLaClientele(f, k, prix);
    return { k, demande, chiffreDAffaires: auCentime(demande * prix) };
  });
  const chiffreDAffaires = auCentime(somme(brutes.map((x) => x.chiffreDAffaires)));
  const clienteles = brutes.map(({ k, demande, chiffreDAffaires: ca }) => ({
    code: k.code,
    nom: k.nom,
    taille: k.tailleDuSegment,
    demande,
    chiffreDAffaires: ca,
    poids: auDixieme((ca / chiffreDAffaires) * 100),
    part: auDixieme((demande / k.tailleDuSegment) * 100),
    aGagner: k.tailleDuSegment - demande,
    /** La demande perdue, en %, si le prix montait de 10 %. */
    sensibilitePrix: auDixieme(((k.perdueParEuro * prix * e) / demande) * 100),
    /** L'élasticité de la demande au prix de NOVA : la demande perdue en % quand le prix monte de 1 %. */
    elasticite: auCentieme((k.perdueParEuro * prix) / demande),
    qualite: k.qualite,
    publicite: k.publicite,
    prixNormal: k.prixNormal,
  }));
  type K = (typeof clienteles)[number];
  const max = (g: (x: K) => number) => clienteles.reduce((a, b) => (g(b) > g(a) ? b : a));
  return {
    clienteles,
    chiffreDAffaires,
    demande: somme(clienteles.map((x) => x.demande)),
    marche: somme(clienteles.map((x) => x.taille)),
    plusGrosse: max((x) => x.chiffreDAffaires),
    reserve: max((x) => x.aGagner),
    premium: clienteles.find((x) => x.qualite === "forte")!,
    promotion: max((x) => x.sensibilitePrix),
    publicite: clienteles.find((x) => x.publicite === "forte")!,
    ecart: Math.round(e * 100),
  };
}

export type Segment = ReturnType<typeof segmentation>["clienteles"][number];

/** La clientèle qui réagit le plus au prix : celle dont la demande baisse le plus quand le prix monte. */
export const clienteleLaPlusSensible = (f: FicheMercatique) => segmentation(f).promotion;

/** Un tarif réservé à une clientèle : sa demande à ce prix et la marge sur coût variable qu'elle laisse. */
export function tarifReserve(f: FicheMercatique, code: CodeDeClientele, prix: number) {
  const demande = demandeDeLaClientele(f, clienteleDe(f, code), prix);
  return { prix, demande, marge: auCentime(demande * (prix - coutVariable(f))) };
}

/** Le tarif le plus bas, à l'euro, qui laisse au moins la marge que la clientèle laisse au prix de NOVA. */
export function tarifLePlusBasSansPerte(f: FicheMercatique, code: CodeDeClientele) {
  const aujourdhui = tarifReserve(f, code, prixDeNova(f)).marge;
  let p = prixDeNova(f);
  while (tarifReserve(f, code, p - 1).marge >= aujourdhui - 1e-9) p--;
  return p;
}

/** Le tarif d'une grille qui laisse la plus grande marge sur la clientèle. */
export const meilleurTarif = (f: FicheMercatique, code: CodeDeClientele, prix: readonly number[]) =>
  prix.map((p) => tarifReserve(f, code, p)).reduce((a, b) => (b.marge > a.marge ? b : a));

// ═════════════════════════════════════════════════════════════════════════════
// 5. LE PRIX PSYCHOLOGIQUE
// ═════════════════════════════════════════════════════════════════════════════

/** Les repères de prix de chaque clientèle, la clientèle du seuil (le premier seuil au-dessus du prix), et ce que coûtent vingt centimes de part et d'autre. */
export function prixPsychologique(f: FicheMercatique) {
  const prix = prixDeNova(f);
  const clienteles = f.clienteles.map((k) => ({
    code: k.code,
    nom: k.nom,
    tropBas: k.mefiance,
    normal: k.prixNormal,
    seuil: k.seuil,
    ecart: auDixieme((prix / k.prixNormal - 1) * 100),
    k,
  }));
  const etudie = clienteles.filter((x) => x.seuil !== null && x.seuil >= prix).reduce((a, b) => (b.seuil! < a.seuil! ? b : a));
  const seuil = etudie.seuil!;
  const sous = auCentime(seuil - 0.1);
  const dessus = auCentime(seuil + 0.1);
  const demandeSous = demandeDeLaClientele(f, etudie.k, sous, true);
  const demandeDessus = demandeDeLaClientele(f, etudie.k, dessus, true);
  const perte = auDixieme((1 - demandeDessus / demandeSous) * 100);
  const hausse = Math.round((dessus / sous - 1) * 10_000) / 100;
  const demande = demandeDeLaClientele(f, etudie.k, prix);
  return {
    prix,
    clienteles,
    etudie,
    seuil,
    sous,
    dessus,
    demandeSous,
    demandeDessus,
    perte,
    hausse,
    rapport: Math.round(perte / hausse),
    elasticite: auCentieme((etudie.k.perdueParEuro * prix) / demande),
    avantageux: clienteles.reduce((a, b) => (b.ecart < a.ecart ? b : a)),
  };
}

/** Le prix remisé d'une remise en pourcentage entier. */
export const prixRemise = (f: FicheMercatique, remise: number) => auCentime(prixDeNova(f) * (1 - remise / 100));

/** La remise la plus forte, en pourcentage entier, qui laisse le prix au niveau où la clientèle étudiée ne doute pas encore. */
export function remiseLaPlusForte(f: FicheMercatique) {
  const mefiance = prixPsychologique(f).etudie.tropBas;
  let r = 0;
  while (prixRemise(f, r + 1) >= mefiance) r++;
  return r;
}

/** La clientèle du seuil à un prix : sa demande (saut compris) et la marge sur coût variable qu'elle laisse. */
export function clienteleDuSeuil(f: FicheMercatique, prix: number) {
  const k = prixPsychologique(f).etudie.k;
  const demande = demandeDeLaClientele(f, k, prix, true);
  return { prix, demande, marge: auCentime(demande * (prix - coutVariable(f))) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. LA PART DE MARCHÉ
// ═════════════════════════════════════════════════════════════════════════════

export interface EnseigneDuTrimestre {
  code: string;
  nom: string;
  ventes: number;
  prix: number;
  chiffreDAffaires: number;
  /** La part du marché de toutes les enceintes, en %, au dixième. */
  part: number;
}

/**
 * Le marché d'un trimestre du semestre (1 : janvier à mars, 2 : avril à juin) : sa taille (le marché
 * de toutes les enceintes), les ventes de NOVA (les particuliers et CampusTech) et celles de ses deux
 * concurrents. HYPOTHÈSE DU COURS : sur tout le marché, SoundBox et Auris vendent, face à NOVA, dans
 * les proportions de l'année type du marché à trois (33 808 et 14 616 enceintes pour 21 576), à
 * l'enceinte près.
 */
export function trimestreDuMarche(f: FicheMercatique, trimestre: 1 | 2) {
  const s = f.gestion.semestre;
  const mois = [0, 1, 2].map((i) => (trimestre - 1) * 3 + i);
  const marche = somme(mois.map((i) => s.marche[i]!));
  const ventesDeNova = somme(s.clienteles.flatMap((k) => mois.map((i) => k.quantites[i]!)));
  const annee = anneeDuMarche(f.marche);
  const enseignes: EnseigneDuTrimestre[] = annee.enseignes.map((e) => {
    const ventes = e.code === "nova" ? ventesDeNova : Math.round((ventesDeNova * e.ventes) / annee.nova.ventes);
    return { code: e.code, nom: e.nom, ventes, prix: e.offre.prix, chiffreDAffaires: auCentime(ventes * e.offre.prix), part: auDixieme((ventes / marche) * 100) };
  });
  return { trimestre, marche, enseignes, nova: enseignes[0]! };
}

/** Le marché du premier trimestre, celui du deuxième, et ce qui a bougé entre les deux. */
export function marcheEtPart(f: FicheMercatique) {
  const debut = trimestreDuMarche(f, 1);
  const fin = trimestreDuMarche(f, 2);
  const parVentes = [...debut.enseignes].sort((a, b) => b.ventes - a.ventes);
  const leader = parVentes[0]!;
  const premierConcurrent = parVentes.find((e) => e.code !== "nova")!;
  const e = debut.nova;
  const ventesDesTrois = somme(debut.enseignes.map((x) => x.ventes));
  return {
    debut,
    fin,
    leader,
    premierConcurrent,
    rang: parVentes.findIndex((x) => x.code === "nova") + 1,
    partRelative: auCentieme(e.part / premierConcurrent.part),
    autres: auDixieme(100 - somme(debut.enseignes.map((x) => x.part))),
    ventesDesTrois,
    plusCher: [...debut.enseignes].sort((a, b) => b.prix - a.prix)[0]!,
    moinsCher: [...debut.enseignes].sort((a, b) => a.prix - b.prix)[0]!,
    evolutionDuMarche: auDixieme((fin.marche / debut.marche - 1) * 100),
    evolutionDesVentes: auDixieme((fin.nova.ventes / e.ventes - 1) * 100),
    points: auDixieme(fin.nova.part - e.part),
  };
}

/** La part de marché, en %, au dixième, que donnent des ventes sur un marché. */
export const partDe = (ventes: number, marche: number) => auDixieme((ventes / marche) * 100);

/** Les ventes qu'il faut, à l'enceinte supérieure, pour tenir une part (en %) d'un marché. */
export const ventesPourLaPart = (marche: number, part: number) => plafond((marche * part) / 100);

// ═════════════════════════════════════════════════════════════════════════════
// 7. LA CONCURRENCE ET LA COMMUNICATION (L'ANNÉE TYPE DU MARCHÉ À TROIS)
// ═════════════════════════════════════════════════════════════════════════════

export interface Vendeur {
  code: string;
  nom: string;
  ventes: number;
  demande: number;
  chiffreDAffaires: number;
  prix: number;
  /** La qualité que les clients lui reconnaissent (1 : la NOVA One d'aujourd'hui), au centième. */
  qualite: number;
  benefice: number;
}

const vendeur = (e: BilanDUneEnseigne): Vendeur => ({
  code: e.code,
  nom: e.nom,
  ventes: e.ventes,
  demande: e.demande,
  chiffreDAffaires: e.chiffreDAffaires,
  prix: e.offre.prix,
  qualite: auCentieme(e.qualite),
  benefice: e.resultat,
});

/** Les trois vendeurs de l'année type, NOVA à un prix, NOVA d'abord. */
export const vendeursAuPrix = (f: FicheMercatique, prix = prixDeNova(f)) => anneeDuMarche(f.marche, { nova: { prix } }).enseignes.map(vendeur);

/** Les parts de marché des trois vendeurs : chacun ses ventes, sur les ventes des trois. */
export function partsDesVendeurs(vendeurs: readonly Vendeur[]) {
  const total = somme(vendeurs.map((v) => v.ventes));
  return { total, parts: vendeurs.map((v) => auDixieme((v.ventes / total) * 100)) };
}

export type OuVontLesClients = "premier" | "second" | "personne";
export type Verdict = "gagne-plus" | "gagne-moins";
export type PlaceDuPlusVendeur = "moins-cher" | "milieu" | "plus-cher";

/** L'année type, puis NOVA à son prix monté d'une hausse : où partent les clients, et ce que la hausse fait au bénéfice. */
export function laConcurrence(f: FicheMercatique, hausse = f.ecartDePrix) {
  const prix = { avant: prixDeNova(f), apres: auCentime(prixDeNova(f) * (1 + hausse)) };
  const avant = vendeursAuPrix(f, prix.avant);
  const apres = vendeursAuPrix(f, prix.apres);
  const { total, parts } = partsDesVendeurs(avant);
  const { total: totalApres, parts: partsApres } = partsDesVendeurs(apres);
  const [e, a, b] = avant as [Vendeur, Vendeur, Vendeur];
  const [e2, a2, b2] = apres as [Vendeur, Vendeur, Vendeur];
  const parPrix = [...avant].sort((x, y) => x.prix - y.prix);
  const plusVendeur = avant.reduce((g, x) => (x.ventes > g.ventes ? x : g));
  const place: PlaceDuPlusVendeur = plusVendeur === parPrix[0] ? "moins-cher" : plusVendeur === parPrix[2] ? "plus-cher" : "milieu";
  const perdues = e.ventes - e2.ventes;
  const gagneesA = a2.ventes - a.ventes;
  const gagneesB = b2.ventes - b.ventes;
  // Un client qui ne trouve pas d'enceinte chez un concurrent plein n'achète nulle part : les refusées en plus.
  const refuseesEnPlus = somme(apres.map((v) => v.demande - v.ventes)) - somme(avant.map((v) => v.demande - v.ventes));
  const destinations: [OuVontLesClients, number][] = [
    ["premier", gagneesA],
    ["second", gagneesB],
    ["personne", refuseesEnPlus],
  ];
  const ecartDeBenefice = auCentime(e2.benefice - e.benefice);
  return {
    hausse,
    prix,
    marche: f.marche.marche.parTrimestre * f.marche.marche.trimestres,
    avant,
    apres,
    entreprise: e,
    concurrents: [a, b] as const,
    ventesDuMarche: total,
    parts,
    ventesDuMarcheApres: totalApres,
    partsApres,
    parPrix,
    plusVendeur,
    place,
    perdues,
    gagneesA,
    gagneesB,
    refuseesEnPlus,
    ouVontLesClients: destinations.reduce((g, x) => (x[1] > g[1] ? x : g))[0],
    ecartDeBenefice,
    points: auDixieme(partsApres[0]! - parts[0]!),
    verdict: (ecartDeBenefice > 0 ? "gagne-plus" : "gagne-moins") as Verdict,
  };
}

/** NOVA à un prix, sur l'année type : ses ventes, sa marge, ses charges, son bénéfice, et les ventes des deux autres. */
export function novaAuPrix(f: FicheMercatique, prix: number) {
  const a = anneeDuMarche(f.marche, { nova: { prix } });
  return { prix, ventes: a.nova.ventes, demande: a.nova.demande, marge: a.nova.marge, charges: a.nova.charges, benefice: a.nova.resultat, soundbox: a.soundbox.ventes, auris: a.auris.ventes };
}

/** Le prix le plus haut, à l'euro, auquel la marge de NOVA couvre encore ses charges de l'année. */
export function prixLePlusHautRentable(f: FicheMercatique) {
  let p = prixDeNova(f);
  while (novaAuPrix(f, p + 1).benefice >= 0) p++;
  return p;
}

/** Le prix d'une grille qui donne à NOVA le plus grand bénéfice de l'année type (le premier en cas d'égalité). */
export const meilleurPrixDeLAnnee = (f: FicheMercatique, prix: readonly number[]) =>
  prix.map((p) => novaAuPrix(f, p)).reduce((a, b) => (b.benefice > a.benefice ? b : a));

/**
 * Un trimestre de l'année type avec un budget de communication : les ventes de NOVA, leur marge, et
 * le résultat du trimestre (un quart des charges de l'année, budgets compris : l'année type a quatre
 * trimestres égaux).
 */
export function trimestreAuBudget(f: FicheMercatique, budget: number) {
  const a = anneeDuMarche(f.marche, { nova: { budgetCommunication: budget } }).nova;
  const ventes = a.trimestres[0]!.ventes;
  return { budget, ventes, chiffreDAffaires: auCentime(ventes * a.offre.prix), marge: auCentime(ventes * a.margeUnitaire), resultat: auCentime(a.resultat / a.trimestres.length) };
}

/** Les budgets que le chapitre essaie, ce que la campagne proposée rapporte, et le meilleur budget. */
export function communication(f: FicheMercatique) {
  const budgets = f.facteursDeBudget.map((k) => ({ facteur: k, ...trimestreAuBudget(f, k * f.campagneProposee) }));
  const sans = budgets[0]!;
  const jouee = budgets.find((x) => x.facteur === 1)!;
  const ventesEnPlus = jouee.ventes - sans.ventes;
  const margeEnPlus = auCentime(jouee.marge - sans.marge);
  const derniers = budgets.slice(-2);
  return {
    budgets,
    sans,
    jouee,
    ventesEnPlus,
    coutParVente: auCentime(jouee.budget / ventesEnPlus),
    margeEnPlus,
    gain: auCentime(margeEnPlus - jouee.budget),
    meilleur: budgets.reduce((a, b) => (b.resultat > a.resultat ? b : a)),
    plafond: derniers[1]!.ventes === derniers[0]!.ventes,
    margeUnitaire: margeUnitaire(f),
  };
}

/** Les ventes gagnées qu'il faut pour qu'une campagne se paie, à la marge d'une enceinte, à l'enceinte supérieure. */
export const ventesPourPayer = (f: FicheMercatique, budget: number) => plafond(budget / margeUnitaire(f));

/** Le budget d'une grille qui laisse le meilleur résultat du trimestre. */
export const meilleurBudget = (f: FicheMercatique, budgets: readonly number[]) =>
  budgets.map((b) => trimestreAuBudget(f, b)).reduce((a, b) => (b.resultat > a.resultat ? b : a));

// ═════════════════════════════════════════════════════════════════════════════
// 8. LES CANAUX DE DISTRIBUTION
// ═════════════════════════════════════════════════════════════════════════════

/** Ce que coûte l'attente d'un montant hors taxes dû par l'intermédiaire, taxes comprises, au taux de l'emprunt, sur un délai en jours. */
export const coutDeLAttente = (f: FicheMercatique, duHorsTaxes: number, delai: number) =>
  auCentime((duHorsTaxes * (1 + f.gestion.semestre.tauxDeTva) * f.gestion.semestre.emprunt.tauxAnnuel * delai) / JOURS_PAR_AN);

/** Les deux canaux au premier trimestre : le direct (les particuliers) et CampusTech, et ce que coûte l'intermédiaire. */
export function canauxDeDistribution(f: FicheMercatique) {
  const s = f.gestion.semestre;
  const prix = prixDeNova(f);
  const lire = (code: string) => {
    const k = s.clienteles.find((x) => x.code === code)!;
    const ventes = somme([0, 1, 2].map((i) => k.quantites[i]!));
    return { ventes, chiffreDAffaires: auCentime(ventes * prix), prix };
  };
  const direct = lire("particuliers");
  const intermediaire = { ...lire("campustech"), commission: f.canal.commission };
  const du = auCentime(intermediaire.chiffreDAffaires - intermediaire.commission);
  const coutDuDelai = coutDeLAttente(f, du, f.canal.delaiConvenu);
  const coutParUnite = auCentime((intermediaire.commission + coutDuDelai) / intermediaire.ventes);
  return {
    nomIndirect: f.canal.nom,
    direct,
    intermediaire,
    du,
    delai: f.canal.delaiConvenu,
    retard: f.canal.retard,
    tauxDeLEmprunt: auDixieme(s.emprunt.tauxAnnuel * 100),
    tva: s.tauxDeTva,
    coutDuDelai,
    coutDuRetard: auCentime(coutDeLAttente(f, du, f.canal.delaiConvenu + f.canal.retard) - coutDuDelai),
    coutParUnite,
    partDesVentes: auDixieme((intermediaire.ventes / (direct.ventes + intermediaire.ventes)) * 100),
    partDuCoutDansLePrix: auDixieme((coutParUnite / prix) * 100),
    coutAcceptable: auCentime(f.canal.coutAcceptableDuDelai * intermediaire.chiffreDAffaires),
  };
}

/** Le délai le plus long, en jours, dont l'attente coûte au plus ce que NOVA accepte (1 % du chiffre d'affaires du canal). */
export function delaiAcceptable(f: FicheMercatique) {
  const k = canauxDeDistribution(f);
  let d = 0;
  while (coutDeLAttente(f, k.du, d + 1) <= k.coutAcceptable + 1e-9) d++;
  return d;
}

/**
 * Une enceinte vendue par le distributeur avec une remise (en % entier du prix) : le prix qu'il paie,
 * ce que coûte l'attente de ce prix au délai convenu, et la marge qui reste à NOVA.
 */
export function venteAuDistributeur(f: FicheMercatique, remise: number) {
  const prixNet = prixRemise(f, remise);
  const attente = coutDeLAttente(f, prixNet, f.canal.delaiConvenu);
  return { remise, prixNet, attente, marge: auCentime(prixNet - coutVariable(f) - attente) };
}

/** La remise la plus forte, en % entier, qui laisse à NOVA au moins la marge qu'elle veut garder sur une enceinte du distributeur. */
export function remiseDuDistributeur(f: FicheMercatique) {
  let r = 0;
  while (venteAuDistributeur(f, r + 1).marge >= f.canal.margeAGarder - 1e-9) r++;
  return r;
}
