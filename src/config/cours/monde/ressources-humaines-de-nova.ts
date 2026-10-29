import { auCentime } from "./amortissement";
import { anneeDeProduction, departDUnSalarie, enceintesParOperateurEtParMois, machineDe, margeUnitaire, partDuMarche } from "./capacite";
import { compteDuLycee, exerciceDe } from "./comptes-du-lycee";
import { PAIE_DU_MOIS, TAUX_DE_LA_PAIE } from "./exercice-de-nova";
import { NOVA_CAPACITE, type FicheDeLaCapacite } from "./nova-capacite";
import { bulletinDePaie } from "./paie";

/**
 * LE MONDE DU COURS : LES RESSOURCES HUMAINES DE NOVA (le lot M6 : les six chapitres du parcours
 * « Bac STMG · Ressources humaines », du salaire brut au coût, l'effectif et la masse salariale,
 * recruter, rémunération et motivation, former, les indicateurs sociaux, et leurs cas).
 *
 * NOVA fabrique des enceintes (voir l-escale.ts pour le principe du monde du cours : une simulation
 * figée, inspirée de l'arène, calculée par le cours, qui ne lit jamais le moteur). Ce fichier n'a
 * presque rien à lui : il relit les fiches qui existent déjà, sans en recopier un chiffre.
 *   · exercice-de-nova.ts : la paie du mois (4 salariés, 7 500 € bruts à eux quatre) et les taux de
 *     cotisations du cours (22 % de part salariale, 42 % de part patronale), ceux du chapitre « La
 *     paie » du supérieur ; le bulletin se calcule par monde/paie.ts, ligne à ligne ;
 *   · comptes-du-lycee.ts : les ventes et les charges du premier exercice, le personnel compris
 *     (127 800 €, les comptes 641 et 645 de la balance) ;
 *   · nova-capacite.ts et capacite.ts : les quatre opérateurs (1 875 € bruts chacun, 600 enceintes
 *     par mois), la ligne de montage (7 000 enceintes par trimestre), la demande de l'année N + 1,
 *     le salaire du marché, le seuil de démission, le recrutement (2 mois, 3 000 €), l'intégration
 *     d'un nouveau (la moitié de la production son premier mois), le cinquième poste manuel, et le
 *     départ d'un opérateur en N + 1, avec son coût.
 *
 * Les hypothèses propres au lot sont posées ci-dessous, nommées et commentées. La garde
 * tests/cours/une-seule-nova.test.ts vérifie que la paie de NOVA est la même d'une fiche à l'autre.
 *
 * CE QUE LE COURS NE FAIT PAS ICI : il s'arrête au salaire net avant impôt (le prélèvement à la
 * source est au chapitre « La paie ») et ne tient pas compte des allègements de cotisations sur les
 * bas salaires (les taux sont des ordres de grandeur avant allègements, ceux de la paie du cours).
 */

/** La fiche de capacité de NOVA, celle du départ d'un salarié et de la croissance. */
export const FICHE_RH: FicheDeLaCapacite = NOVA_CAPACITE;

/** Les entreprises des chapitres de ressources humaines : NOVA seule. */
export const ENTREPRISES_DES_RESSOURCES_HUMAINES: readonly string[] = [FICHE_RH.code];

export const POURQUOI_LES_RESSOURCES_HUMAINES =
  "ces chapitres suivent l'équipe de NOVA, dont le cours tient la paie, les comptes du premier exercice, l'atelier et l'année qui vient.";

const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const auDessus = (x: number) => Math.ceil(x - 1e-9);
const auDessous = (x: number) => Math.floor(x + 1e-9);
const MOIS_PAR_AN = 12;

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DU LOT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE SMIC (droit du travail) : 12,02 € bruts de l'heure au 1er janvier 2026, soit 1 823,03 € bruts
 * par mois pour 35 heures par semaine (12,02 × 35 × 52 ÷ 12, la mensualisation de 151,67 heures). Un
 * salarié à temps plein ne peut pas être payé moins. À mettre à jour à chaque revalorisation.
 */
export const SMIC_MENSUEL_BRUT = 1_823.03;

/** La hausse du net que demande un opérateur (chapitre « Du salaire brut au coût ») : 100 € par mois. */
export const HAUSSE_DU_NET_DEMANDEE = 100;

/**
 * L'ENVELOPPE D'UNE HAUSSE (hypothèse du laboratoire du salaire) : la gérante accepte qu'une hausse
 * coûte à NOVA au plus 150 € de plus par mois et par salarié, cotisations patronales comprises.
 */
export const ENVELOPPE_DE_LA_HAUSSE = 150;

/** Les hausses du net que le laboratoire essaie, de 25 en 25 € par mois. */
export const HAUSSES_DU_NET_ESSAYEES = { min: 0, max: 200, pas: 25 } as const;

/**
 * LE BUDGET D'UN POSTE (hypothèse du curseur du salaire) : pour un cinquième opérateur, la gérante
 * fixe un coût de 2 800 € par mois au plus, cotisations patronales comprises.
 */
export const COUT_MAXIMAL_D_UN_POSTE = 2_800;

/**
 * LE PLAFOND DES FRAIS DE PERSONNEL (hypothèse du chapitre « L'effectif et la masse salariale ») : la
 * gérante veut que le personnel ne coûte pas plus de 10 % des ventes de l'année.
 */
export const PLAFOND_DES_FRAIS_DE_PERSONNEL = 0.1;

/** Les hausses générales que le laboratoire de la masse salariale essaie, de 1 en 1 point. */
export const HAUSSES_GENERALES_ESSAYEES = { min: 0, max: 10, pas: 1 } as const;

/**
 * LE RECRUTEMENT DU CHAPITRE « RECRUTER » (hypothèse du cours) : NOVA lance le recrutement d'un
 * cinquième opérateur en janvier de N + 1. Avec les deux mois du recrutement, il arrive le 1er mars
 * et monte, son premier mois, la moitié de ce que monte un opérateur formé (nova-capacite.ts).
 */
export const MOIS_DU_RECRUTEMENT = 1;

/**
 * LA FORMATION (hypothèses du chapitre « Former ») : NOVA ajoute un cinquième poste à sa ligne en
 * N + 1 (8 750 enceintes par trimestre) sans embaucher : l'équipe, 7 200 enceintes, devient le goulot.
 * Un stage du fabricant de la ligne fait gagner du temps de montage : chaque minute gagnée sur une
 * enceinte (18 minutes aujourd'hui, 0,3 heure) coûte 750 € par opérateur, payés en janvier. Le stage
 * proposé fait gagner 2 minutes.
 */
export const COUT_D_UNE_MINUTE_GAGNEE_PAR_OPERATEUR = 750;
export const MINUTES_GAGNEES_PAR_LE_STAGE = 2;
/** Les durées de montage que le laboratoire essaie, en minutes par enceinte. */
export const MINUTES_ESSAYEES = [18, 17, 16, 15] as const;

/**
 * LA RÉMUNÉRATION (hypothèse du chapitre « Rémunération et motivation ») : un opérateur compare son
 * salaire de chaque mois à celui que le marché offre. Une prime de fin d'année, versée une fois, ne
 * change pas cette comparaison : elle remercie, elle ne retient pas.
 */
export const PRIMES_ESSAYEES = [0, 500, 1_000] as const;
export const AUGMENTATIONS_ESSAYEES = { min: 0, max: 100, pas: 25 } as const;

/**
 * LES ABSENCES DE N + 1 (hypothèses du chapitre « Les indicateurs sociaux ») : deux arrêts de
 * maladie, 290 heures d'absence sur l'année. La direction s'alerte quand l'absentéisme dépasse 3 %
 * des heures de travail prévues. Un opérateur a 180 heures de travail prévues par mois (nova-capacite.ts).
 */
export const HEURES_D_ABSENCE = 290;
export const SEUIL_D_ALERTE_DE_L_ABSENTEISME = 0.03;

/** Le seuil du laboratoire des indicateurs : la direction accepte au plus 1 000 enceintes perdues par le départ. */
export const VENTES_PERDUES_ACCEPTEES = 1_000;

// ─────────────────────────────────────────────────────────────────────────────
// LA PAIE D'UN OPÉRATEUR : DU BRUT AU NET, DU BRUT AU COÛT
// ─────────────────────────────────────────────────────────────────────────────

export const TAUX_SALARIAL = auCentime((TAUX_DE_LA_PAIE.salarialUrssaf + TAUX_DE_LA_PAIE.salarialRetraite) * 100) / 100;
export const TAUX_PATRONAL = auCentime((TAUX_DE_LA_PAIE.patronalUrssaf + TAUX_DE_LA_PAIE.patronalRetraite) * 100) / 100;

/** Le coût pour NOVA d'un brut donné : brut + cotisations patronales, au centime. */
export const coutDUnBrut = (brut: number) => auCentime(brut + auCentime(brut * TAUX_PATRONAL));

/** Le brut qu'il faut pour une hausse du net, et ce qu'elle coûte : net ÷ (1 − taux salarial), puis × (1 + taux patronal). */
export function hausseDuNet(hausse: number) {
  const brut = auCentime(hausse / (1 - TAUX_SALARIAL));
  return { net: hausse, brut, cout: auCentime(brut * (1 + TAUX_PATRONAL)) };
}

/** La paie d'un opérateur en janvier : le bulletin du cours, du brut au net avant impôt et au coût. */
export function paieDUnOperateur() {
  const effectif = PAIE_DU_MOIS.effectif;
  const brut = auCentime(PAIE_DU_MOIS.brut / effectif);
  const b = bulletinDePaie(brut, TAUX_DE_LA_PAIE);
  const salariales = b.cotisationsSalariales.total;
  const patronales = b.cotisationsPatronales.total;
  const hausse = hausseDuNet(HAUSSE_DU_NET_DEMANDEE);
  return {
    effectif,
    brutDeLEquipe: PAIE_DU_MOIS.brut,
    tauxSalarial: TAUX_SALARIAL,
    tauxPatronal: TAUX_PATRONAL,
    brut,
    salariales,
    net: b.netAvantImpot,
    patronales,
    cout: b.coutEmployeur,
    coutPour100DeNet: auCentime((b.coutEmployeur / b.netAvantImpot) * 100),
    smic: SMIC_MENSUEL_BRUT,
    hausse,
    /** Le plus haut brut, à l'euro, qu'un poste au coût maximal permet de payer. */
    brutMaximalDuPoste: auDessous(COUT_MAXIMAL_D_UN_POSTE / (1 + TAUX_PATRONAL)),
  };
}

/** La plus forte hausse du net, de 25 en 25 €, dont le coût tient dans l'enveloppe. */
export const hausseDansLEnveloppe = () => {
  const { min, max, pas } = HAUSSES_DU_NET_ESSAYEES;
  let juste = min;
  for (let h = min; h <= max; h += pas) if (hausseDuNet(h).cout <= ENVELOPPE_DE_LA_HAUSSE) juste = h;
  return juste;
};

// ─────────────────────────────────────────────────────────────────────────────
// L'EFFECTIF ET LA MASSE SALARIALE
// ─────────────────────────────────────────────────────────────────────────────

/** L'année N : l'effectif, le coût d'un salarié, la masse salariale, ce qu'elle pèse. */
export function masseSalarialeDeN(hausseGenerale = 0) {
  const k = compteDuLycee(exerciceDe(FICHE_RH.code));
  const p = paieDUnOperateur();
  const coutMensuel = p.cout;
  const coutAnnuel = auCentime(coutMensuel * MOIS_PAR_AN);
  const masseDuCompte = k.personnel;
  const masse = auCentime(masseDuCompte * (1 + hausseGenerale));
  const charges = auCentime(k.charges + masse - masseDuCompte);
  return {
    effectif: p.effectif,
    coutMensuel,
    coutAnnuel,
    netAnnuel: auCentime(p.net * MOIS_PAR_AN),
    masseDuCompte,
    masse,
    ventes: k.ventes,
    charges,
    partDansLesCharges: masse / charges,
    tauxDeFraisDePersonnel: masse / k.ventes,
    caParSalarie: k.ventes / p.effectif,
    prix: FICHE_RH.enceinte.prix,
  };
}

/** La plus forte hausse générale, en points, qui garde la masse salariale sous le plafond des ventes de N. */
export const hausseGeneraleAuPlafond = () => {
  const { min, max, pas } = HAUSSES_GENERALES_ESSAYEES;
  let juste = min;
  for (let h = min; h <= max; h += pas) if (masseSalarialeDeN(h / 100).tauxDeFraisDePersonnel <= PLAFOND_DES_FRAIS_DE_PERSONNEL + 1e-12) juste = h;
  return juste;
};

/** Les enceintes à vendre dans l'année pour qu'un effectif donné tienne sous le plafond : masse ÷ (prix × plafond). */
export const enceintesPourLePlafond = (effectif: number) => {
  const m = masseSalarialeDeN();
  return auDessus((effectif * m.coutAnnuel) / (m.prix * PLAFOND_DES_FRAIS_DE_PERSONNEL));
};

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉQUIPE DE N + 1 : UNE RECRUE, UN POSTE, UNE FORMATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * La capacité de l'équipe de N + 1, trimestre par trimestre : les opérateurs du plan, plus une recrue
 * arrivée au premier jour du mois `arrivee` (rien si null), qui monte la moitié son premier mois ;
 * chaque opérateur monte `parMois` enceintes par mois.
 */
export function equipeDeNPlus1(arrivee: number | null, parMois = enceintesParOperateurEtParMois(FICHE_RH)) {
  const f = FICHE_RH;
  const mois = Array.from({ length: MOIS_PAR_AN }, (_, i) => {
    const m = i + 1;
    const recrue = arrivee === null || m < arrivee ? 0 : m < arrivee + f.personnel.integration.mois ? f.personnel.integration.productivite : 1;
    return { mois: m, recrue, capacite: auDessous((f.plan.operateurs + recrue) * parMois), payes: f.plan.operateurs + (arrivee !== null && m >= arrivee ? 1 : 0) };
  });
  const trimestres = [0, 1, 2, 3].map((t) => somme(mois.slice(t * 3, t * 3 + 3).map((x) => x.capacite)));
  return { mois, trimestres, moisDeLaRecrue: arrivee === null ? 0 : MOIS_PAR_AN - arrivee + 1 };
}

/** Les leviers de l'année N + 1 du chapitre « Recruter » : un poste de plus sur la ligne, une recrue, son mois de recrutement. */
export interface LeviersDuRecrutement {
  poste: 0 | 1;
  embauche: 0 | 1;
  moisDuRecrutement: number;
}

/**
 * L'année N + 1 avec ou sans un poste de plus et une recrue : la production (la plus petite de la
 * demande, de l'outil et de l'équipe, trimestre par trimestre), les enceintes gagnées face au plan,
 * leur marge, et ce que coûtent la recrue (le recrutement et ses mois de salaire) et le poste (son
 * usure de l'année et son entretien).
 */
export function recrutementDeNPlus1(l: Partial<LeviersDuRecrutement> = {}) {
  const f = FICHE_RH;
  const poste = l.poste ?? 0;
  const embauche = l.embauche ?? 1;
  const moisDuRecrutement = l.moisDuRecrutement ?? MOIS_DU_RECRUTEMENT;
  const machine = machineDe(f, "poste-manuel");
  const arrivee = embauche ? moisDuRecrutement + f.personnel.delaiDeRecrutementEnMois : null;
  const equipe = equipeDeNPlus1(arrivee);
  const plan = anneeDeProduction(f, { annee: "N+1" });
  const joue = anneeDeProduction(f, { annee: "N+1", equipe: equipe.trimestres, capaciteEnPlus: poste * machine.capaciteEnPlus });
  const m = margeUnitaire(f);
  const coutMensuel = coutDUnBrut(f.operateurs.salaireBrutMensuel);
  const salaires = auCentime(equipe.moisDeLaRecrue * coutMensuel);
  const recrutement = embauche ? f.personnel.coutDUnRecrutement : 0;
  const coutDeLaRecrue = auCentime(recrutement + salaires);
  const coutDuPoste = poste ? auCentime(machine.prix / machine.dureeEnAnnees + machine.entretienParAn) : 0;
  const enceintesEnPlus = joue.production - plan.production;
  const margeEnPlus = auCentime(enceintesEnPlus * m);
  return {
    poste,
    embauche,
    arrivee,
    machine,
    moisDeLaRecrue: equipe.moisDeLaRecrue,
    coutMensuel,
    salaires,
    recrutement,
    coutDeLaRecrue,
    coutDuPoste,
    marge: m,
    enceintesPourSePayer: auDessus(coutDeLaRecrue / m) + 0,
    plan,
    joue,
    equipe: equipe.trimestres,
    enceintesEnPlus,
    margeEnPlus,
    ecartDeResultat: auCentime(margeEnPlus - coutDeLaRecrue - coutDuPoste),
    refusees: joue.refusees,
    goulots: joue.goulots,
  };
}

/** La formation de N + 1 : le cinquième poste installé, l'équipe à `minutes` par enceinte, sans recrue. */
export function formationDeNPlus1(minutes: number) {
  const f = FICHE_RH;
  const machine = machineDe(f, "poste-manuel");
  const minutesDuDepart = Math.round(f.operateurs.heuresParEnceinte * 60);
  const parMois = auDessous((f.operateurs.heuresParMois * 60) / minutes);
  const equipe = equipeDeNPlus1(null, parMois).trimestres;
  const sansFormation = anneeDeProduction(f, { annee: "N+1", capaciteEnPlus: machine.capaciteEnPlus });
  const joue = anneeDeProduction(f, { annee: "N+1", capaciteEnPlus: machine.capaciteEnPlus, equipe });
  const m = margeUnitaire(f);
  const minutesGagnees = minutesDuDepart - minutes;
  const coutParOperateur = minutesGagnees * COUT_D_UNE_MINUTE_GAGNEE_PAR_OPERATEUR;
  const cout = coutParOperateur * f.plan.operateurs;
  const enceintesEnPlus = joue.production - sansFormation.production;
  const margeEnPlus = auCentime(enceintesEnPlus * m);
  return {
    minutes,
    minutesDuDepart,
    minutesGagnees,
    parMois,
    heuresParMois: f.operateurs.heuresParMois,
    parMoisDuDepart: enceintesParOperateurEtParMois(f),
    capaciteDeLOutil: joue.trimestres[0]!.capaciteOutil,
    equipeDuDepart: sansFormation.trimestres[0]!.capaciteEquipe,
    equipe: joue.trimestres[0]!.capaciteEquipe,
    sansFormation,
    joue,
    coutParOperateur,
    cout,
    enceintesEnPlus,
    margeEnPlus,
    gain: auCentime(margeEnPlus - cout),
    refusees: joue.refusees,
    operateurs: f.plan.operateurs,
    marge: m,
  };
}

/** La formation qui rapporte le plus dans l'année, une fois payée, parmi les durées essayées. */
export const formationQuiRapporteLePlus = () =>
  [...MINUTES_ESSAYEES].sort((a, b) => formationDeNPlus1(b).gain - formationDeNPlus1(a).gain)[0]!;

// ─────────────────────────────────────────────────────────────────────────────
// LA RÉMUNÉRATION : LE MARCHÉ, LE SEUIL, LE DÉPART
// ─────────────────────────────────────────────────────────────────────────────

/** Le salaire de N + 1 face au marché, une augmentation de chaque mois et une prime de fin d'année. */
export function remunerationDeNPlus1(augmentation = 0, prime = 0) {
  const f = FICHE_RH;
  const salaire = f.operateurs.salaireBrutMensuel + augmentation;
  const marche = partDuMarche(f, { salaire });
  const enN = partDuMarche(f, { marche: f.personnel.salaireDuMarche.n });
  const depart = departDUnSalarie(f);
  const operateurs = f.plan.operateurs;
  const coutDeLAugmentation = auCentime(augmentation * MOIS_PAR_AN * operateurs * (1 + TAUX_PATRONAL));
  const coutDeLaPrime = auCentime(prime * operateurs * (1 + TAUX_PATRONAL));
  const garde = !marche.sousLeSeuil;
  return {
    salaire,
    augmentation,
    prime,
    marcheN: f.personnel.salaireDuMarche.n,
    marcheNPlus1: f.personnel.salaireDuMarche.nPlus1,
    partEnN: enN.part,
    part: marche.part,
    seuil: marche.seuil,
    salaireAuSeuil: marche.salaireAuSeuil,
    augmentationAuSeuil: partDuMarche(f).augmentationParMois,
    garde,
    operateurs,
    coutDeLAugmentation,
    coutDeLaPrime,
    cout: auCentime(coutDeLAugmentation + coutDeLaPrime),
    coutDuDepart: depart.coutDuDepart,
    depart,
    /** Ce que l'année coûte de plus : la hausse et la prime, et le départ si l'équipe n'est pas gardée. */
    coutDeLAnnee: auCentime(coutDeLAugmentation + coutDeLaPrime + (garde ? 0 : depart.coutDuDepart)),
    /** La plus forte augmentation, à l'euro, dont le coût de l'année reste sous celui du départ. */
    augmentationMaximale: auDessous(depart.coutDuDepart / (MOIS_PAR_AN * operateurs * (1 + TAUX_PATRONAL))),
  };
}

/** La rémunération qui garde l'équipe au moindre coût, parmi les augmentations et les primes essayées. */
export function remunerationAuMoindreCout() {
  const { min, max, pas } = AUGMENTATIONS_ESSAYEES;
  const positions: { augmentation: number; prime: number; cout: number }[] = [];
  for (let a = min; a <= max; a += pas) for (const p of PRIMES_ESSAYEES) positions.push({ augmentation: a, prime: p, cout: remunerationDeNPlus1(a, p).coutDeLAnnee });
  return positions.sort((x, y) => x.cout - y.cout)[0]!;
}

// ─────────────────────────────────────────────────────────────────────────────
// LES INDICATEURS SOCIAUX DE N + 1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Le tableau de bord social de N + 1, l'année du départ d'un opérateur (capacite.ts) : le remplaçant
 * arrive au premier jour du mois `arrivee`. L'effectif moyen compte les salariés payés chaque mois ;
 * le taux de rotation = (départs + arrivées) ÷ 2 ÷ effectif moyen ; l'absentéisme = heures d'absence
 * ÷ heures de travail prévues (180 par salarié payé et par mois) ; le chiffre d'affaires par salarié
 * = chiffre d'affaires ÷ effectif moyen, sur l'année et trimestre par trimestre.
 */
export function indicateursDeNPlus1(arrivee?: number, heuresDAbsence = HEURES_D_ABSENCE) {
  const f = FICHE_RH;
  const debut = arrivee === undefined ? undefined : arrivee - f.personnel.delaiDeRecrutementEnMois;
  const d = departDUnSalarie(f, debut === undefined ? {} : { debutDuRecrutement: debut });
  const mois = d.equipe.mois;
  const effectifMoyen = d.equipe.moisPayes / MOIS_PAR_AN;
  const departs = 1;
  const arrivees = d.arrivee === null ? 0 : 1;
  const heuresPrevues = d.equipe.moisPayes * f.operateurs.heuresParMois;
  const coutMensuel = coutDUnBrut(f.operateurs.salaireBrutMensuel);
  const plan = anneeDeProduction(f, { annee: "N+1" });
  const trimestres = d.trimestres.map((t, i) => {
    const payes = mois.slice(i * 3, i * 3 + 3).map((x) => x.salariesPayes);
    const effectif = somme(payes) / 3;
    const chiffreDAffaires = auCentime(t.ventes * f.enceinte.prix);
    return { trimestre: t.trimestre, effectif, ventes: t.ventes, ventesDuPlan: t.ventesDuPlan, chiffreDAffaires, caParSalarie: chiffreDAffaires / effectif, masse: auCentime(somme(payes) * coutMensuel) };
  });
  const chiffreDAffaires = auCentime(somme(trimestres.map((t) => t.chiffreDAffaires)));
  return {
    arrivee: d.arrivee,
    debutDuRecrutement: d.depart.debutDuRecrutement,
    effectifs: mois.map((x) => x.salariesPayes),
    moisPayes: d.equipe.moisPayes,
    effectifMoyen,
    departs,
    arrivees,
    rotation: (departs + arrivees) / 2 / effectifMoyen,
    heuresPrevues,
    heuresDAbsence,
    absenteisme: heuresDAbsence / heuresPrevues,
    absencesMaximales: auDessous(heuresPrevues * SEUIL_D_ALERTE_DE_L_ABSENTEISME),
    masse: auCentime(d.equipe.moisPayes * coutMensuel),
    masseDuPlan: auCentime(f.plan.operateurs * MOIS_PAR_AN * coutMensuel),
    trimestres,
    chiffreDAffaires,
    caParSalarie: chiffreDAffaires / effectifMoyen,
    caParSalarieDuPlan: (plan.production * f.enceinte.prix) / f.plan.operateurs,
    ventesPerdues: d.ventesPerdues,
    margePerdue: d.margePerdue,
    recrutement: d.recrutement,
    salairesNonVerses: d.salairesNonVerses,
    coutDuDepart: d.coutDuDepart,
  };
}

/** Les mois d'arrivée possibles du remplaçant : le recrutement ne commence pas avant l'annonce du départ (mars). */
export const ARRIVEES_POSSIBLES = { min: FICHE_RH.personnel.moisDeLAnnonce + FICHE_RH.personnel.delaiDeRecrutementEnMois, max: 8, pas: 1 } as const;

/** Le seul mois d'arrivée qui garde les ventes perdues sous le seuil accepté (null s'il y en a plusieurs ou aucun). */
export function arriveeSousLeSeuil() {
  const ok: number[] = [];
  for (let a = ARRIVEES_POSSIBLES.min; a <= ARRIVEES_POSSIBLES.max; a += ARRIVEES_POSSIBLES.pas) if (indicateursDeNPlus1(a).ventesPerdues < VENTES_PERDUES_ACCEPTEES) ok.push(a);
  return ok.length === 1 ? ok[0]! : null;
}
