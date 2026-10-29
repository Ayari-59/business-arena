import type {
  AleaDeNova,
  AnneeDeNova,
  CodeDAlea,
  CodeDAnnee,
  CodeDeDemarche,
  CodeDeFormule,
  CodeDeMachine,
  FicheDeLaCapacite,
  FormuleDAssurance,
  MachineDuCatalogue,
  Trimestre,
} from "./nova-capacite";

/**
 * LE MODÈLE DE LA CAPACITÉ DU COURS : NOVA, l'année N réalisée et l'année N + 1 prévue, trimestre par
 * trimestre (le parcours BTS GPME et le chapitre « croître en investissant »).
 *
 * Tout se calcule sur la fiche (monde/nova-capacite.ts), en fonctions pures : la même fiche et les
 * mêmes leviers donnent toujours les mêmes chiffres. Chaque fonction qu'un curseur ou un laboratoire
 * lira prend ses leviers en paramètres, avec la fiche (et le plan de N + 1) pour valeur de départ.
 *
 *   1. LA PRODUCTION ET LE GOULOT : chaque trimestre, production = min(capacité de l'outil ×
 *      disponibilité, capacité de l'équipe, demande) ; ce qui la borne est le goulot ; la demande
 *      qui dépasse est refusée, et sa marge perdue.
 *   2. LA DISPONIBILITÉ SELON L'ENTRETIEN : la disponibilité d'un trimestre est celle du précédent,
 *      moins l'usure, plus ce que l'entretien du précédent a réparé (au plus 100 %) ; le seuil où
 *      elle cesse de baisser ; les défauts qu'un entretien trop bas ajoute ; l'année jouée à d'autres
 *      budgets, face au plan.
 *   3. LA VACANCE D'UN POSTE : le salaire en part du marché et le seuil de démission ; le départ, le
 *      préavis, le recrutement et l'intégration, mois par mois ; la production que le poste vide
 *      fait perdre quand l'équipe devient le goulot ; le coût du départ face à l'augmentation qui
 *      l'aurait évité.
 *   4. LES SINISTRES ET L'ASSURANCE : le coût d'un aléa (ses dommages, et la marge des enceintes
 *      qu'il fait perdre, en moyenne sur les trimestres), l'espérance des sinistres (probabilité ×
 *      coût) ; une formule : sa prime, ce qu'elle rembourse en moyenne (la prime pure), son
 *      chargement, le reste à charge (franchises et aléas non couverts), le coût moyen de l'année et
 *      le pire reste à charge ; la capacité d'absorption (trésorerie, capitaux propres) ; la formule
 *      à retenir, et la prime au-delà de laquelle elle ne l'est plus.
 *   5. LES COÛTS DE LA QUALITÉ : le taux de défaut selon le budget de prévention (la courbe, à
 *      quatre points, interpolée) ; prévention, détection, défaillance interne et externe ; les
 *      ventes que la qualité perçue fait perdre ; la courbe des coûts en U, son minimum, et le
 *      budget qui donne le meilleur résultat ; une démarche qualité, son gain et son délai de
 *      récupération.
 *   6. LA MACHINE EN PLUS : la capacité et l'équipe de plus, les ventes gagnées, l'amortissement,
 *      les intérêts de l'emprunt, l'embauche liée, le résultat gagné et les ventes qui le rendent
 *      nul ; les flux nets de trésorerie, la VAN et le délai de récupération ; la hausse de la
 *      demande qui annule la VAN.
 *
 * CONVENTIONS : les montants sont au centime ; les taux, les parts et la disponibilité ne sont pas
 * arrondis (c'est l'affichage qui arrondit). Une capacité se compte à l'enceinte inférieure (on ne
 * monte pas une fraction d'enceinte) ; une demande haussée s'arrondit à l'enceinte. Les défauts
 * sont des défauts attendus : ils ne s'arrondissent pas. Un écart négatif est une perte.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
/** À l'entier inférieur, sans qu'un calcul en virgule flottante ne fasse descendre un entier exact. */
const plancher = (x: number) => Math.floor(x + 1e-9);
/** À l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);
/** Une disponibilité ou un taux, débarrassé du bruit des virgules flottantes. */
const net = (x: number) => Math.round(x * 1e9) / 1e9 + 0;

const TRIMESTRES: readonly Trimestre[] = [1, 2, 3, 4];

// ═════════════════════════════════════════════════════════════════════════════
// 0. LES DONNÉES DE BASE
// ═════════════════════════════════════════════════════════════════════════════

/** La marge sur coût variable d'une enceinte : prix − composants − autres coûts variables (21 €). */
export const margeUnitaire = (f: FicheDeLaCapacite) => auCentime(f.enceinte.prix - f.enceinte.coutVariable.composants - f.enceinte.coutVariable.autres);

/** Les enceintes qu'un opérateur monte en un mois : ses heures ÷ les heures d'une enceinte (150 ÷ 0,25 = 600). */
export const enceintesParOperateurEtParMois = (f: FicheDeLaCapacite, heuresParEnceinte: number = f.operateurs.heuresParEnceinte) =>
  plancher(f.operateurs.heuresParMois / heuresParEnceinte);

/** La capacité d'une équipe sur un trimestre : opérateurs × enceintes d'un opérateur par mois × 3. */
export const capaciteDeLEquipe = (f: FicheDeLaCapacite, operateurs: number = f.plan.operateurs) => operateurs * enceintesParOperateurEtParMois(f) * 3;

/** Le coût d'un opérateur pour NOVA, par mois : son salaire brut et les cotisations patronales (2 662,50 €). */
export const coutEmployeurMensuel = (f: FicheDeLaCapacite, salaireBrut: number = f.operateurs.salaireBrutMensuel) =>
  auCentime(salaireBrut * (1 + f.operateurs.tauxDesCotisationsPatronales));

/** L'année demandée : N, réalisée, ou N + 1, prévue. */
export const anneeDe = (f: FicheDeLaCapacite, code: CodeDAnnee): AnneeDeNova => (code === "N" ? f.anneeN : f.anneeNPlus1);

export const aleaDe = (f: FicheDeLaCapacite, code: CodeDAlea): AleaDeNova => {
  const a = f.aleas.find((x) => x.code === code);
  if (!a) throw new Error(`Pas d'aléa ${code}`);
  return a;
};

export const formuleDe = (f: FicheDeLaCapacite, code: CodeDeFormule): FormuleDAssurance => {
  const x = f.formules.find((y) => y.code === code);
  if (!x) throw new Error(`Pas de formule ${code}`);
  return x;
};

export const machineDe = (f: FicheDeLaCapacite, code: CodeDeMachine): MachineDuCatalogue => {
  const m = f.machines.find((x) => x.code === code);
  if (!m) throw new Error(`Pas de machine ${code}`);
  return m;
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. LA PRODUCTION ET LE GOULOT
// ═════════════════════════════════════════════════════════════════════════════

export type Goulot = "demande" | "outil" | "equipe";

/**
 * Un trimestre : production = min(demande, capacité de l'outil, capacité de l'équipe). Le goulot est
 * ce qui la borne : la demande si l'outil et l'équipe la servent toute ; sinon le plus petit des
 * deux (l'outil, à égalité). Les enceintes refusées sont la demande qui n'est pas servie.
 */
export function trimestreDeProduction(demande: number, capaciteOutil: number, capaciteEquipe: number) {
  const production = Math.min(demande, capaciteOutil, capaciteEquipe);
  const goulot: Goulot = demande <= Math.min(capaciteOutil, capaciteEquipe) ? "demande" : capaciteOutil <= capaciteEquipe ? "outil" : "equipe";
  return { demande, capaciteOutil, capaciteEquipe, production, refusees: demande - production, goulot };
}

/** Les leviers d'une année de production. Chacun a sa valeur de départ dans la fiche (le plan, pour N + 1). */
export interface LeviersDeLAnnee {
  annee: CodeDAnnee;
  /** La demande de chaque trimestre (par défaut, celle de l'année). */
  demande: readonly number[];
  /** Une hausse de toute la demande (0,1 : 10 % de plus), arrondie à l'enceinte. */
  hausseDeLaDemande: number;
  /** Les budgets d'entretien de chaque trimestre (N + 1 seulement ; par défaut, ceux du plan). */
  entretien: readonly number[];
  /** La disponibilité de la ligne à chaque trimestre ; par défaut, celle que donne l'entretien (100 % en N, sous garantie). */
  disponibilites: readonly number[];
  /** Les enceintes de plus que l'outil peut monter par trimestre (une machine en plus). */
  capaciteEnPlus: number;
  /** La capacité de l'équipe de chaque trimestre (par défaut, les opérateurs du plan). */
  equipe: readonly number[];
  /** Les enceintes de plus que l'équipe peut monter par trimestre (une embauche). */
  equipeEnPlus: number;
  /** La part de la capacité de l'outil qu'un aléa fait perdre à chaque trimestre (0 : aucun). */
  perteDeCapacite: readonly number[];
}

/**
 * Une année, trimestre par trimestre : la capacité de l'outil = (capacité de la ligne + capacité en
 * plus) × disponibilité × (1 − perte d'un aléa), à l'enceinte inférieure ; la capacité de l'équipe ;
 * la production, le goulot, les refusées ; le chiffre d'affaires et la marge sur coût variable des
 * enceintes vendues ; la marge perdue sur les refusées.
 */
export function anneeDeProduction(f: FicheDeLaCapacite, leviers: Partial<LeviersDeLAnnee> = {}) {
  const code = leviers.annee ?? "N+1";
  const annee = anneeDe(f, code);
  const hausse = leviers.hausseDeLaDemande ?? 0;
  const demande = (leviers.demande ?? annee.demande).map((d) => Math.round(d * (1 + hausse)));
  const disponibilites =
    leviers.disponibilites ?? (code === "N" ? TRIMESTRES.map(() => annee.disponibiliteDeDepart) : disponibilitesDeLAnnee(f, { budgets: leviers.entretien }).trimestres);
  const equipe = leviers.equipe ?? TRIMESTRES.map(() => capaciteDeLEquipe(f));
  const m = margeUnitaire(f);
  const trimestres = TRIMESTRES.map((t, i) => {
    const perte = leviers.perteDeCapacite?.[i] ?? 0;
    const capaciteOutil = plancher((f.ligne.capaciteParTrimestre + (leviers.capaciteEnPlus ?? 0)) * disponibilites[i]! * (1 - perte));
    const capaciteEquipe = equipe[i]! + (leviers.equipeEnPlus ?? 0);
    const p = trimestreDeProduction(demande[i]!, capaciteOutil, capaciteEquipe);
    return {
      trimestre: t,
      disponibilite: disponibilites[i]!,
      ...p,
      occupationDeLOutil: p.production / capaciteOutil,
      chiffreDAffaires: auCentime(p.production * f.enceinte.prix),
      marge: auCentime(p.production * m),
      margeRefusee: auCentime(p.refusees * m),
    };
  });
  const total = (cle: "demande" | "production" | "refusees") => somme(trimestres.map((x) => x[cle]));
  return {
    annee: code,
    trimestres,
    demande: total("demande"),
    production: total("production"),
    refusees: total("refusees"),
    tauxDeService: total("production") / total("demande"),
    chiffreDAffaires: auCentime(somme(trimestres.map((x) => x.chiffreDAffaires))),
    marge: auCentime(somme(trimestres.map((x) => x.marge))),
    margeRefusee: auCentime(somme(trimestres.map((x) => x.margeRefusee))),
    goulots: trimestres.map((x) => x.goulot),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. LA DISPONIBILITÉ SELON L'ENTRETIEN
// ═════════════════════════════════════════════════════════════════════════════

/** Ce qu'un budget d'un trimestre fait à la disponibilité du suivant : réparation × min(budget, référence) ÷ référence − usure. */
export function variationDeDisponibilite(f: FicheDeLaCapacite, budget: number) {
  const e = f.entretien;
  return net((e.reparationAuBudgetDeReference * Math.min(Math.max(budget, 0), e.budgetDeReference)) / e.budgetDeReference - e.usureParTrimestre);
}

/** Le budget où la disponibilité cesse de baisser : référence × usure ÷ réparation (3 000 €). */
export const seuilDEntretien = (f: FicheDeLaCapacite) =>
  auCentime((f.entretien.budgetDeReference * f.entretien.usureParTrimestre) / f.entretien.reparationAuBudgetDeReference);

/** Le budget qui répare un point de disponibilité : référence ÷ (réparation × 100) (600 €). */
export const budgetDUnPoint = (f: FicheDeLaCapacite) => auCentime(f.entretien.budgetDeReference / (f.entretien.reparationAuBudgetDeReference * 100));

/**
 * La disponibilité de la ligne à chaque trimestre de N + 1, et au premier trimestre de l'année
 * suivante (`apres`). Au trimestre 1, celle de départ ; ensuite, celle du trimestre d'avant plus la
 * variation que son budget a faite, entre la disponibilité minimale et 100 %.
 */
export function disponibilitesDeLAnnee(f: FicheDeLaCapacite, leviers: Partial<{ budgets: readonly number[]; depart: number }> = {}) {
  const budgets = leviers.budgets ?? f.plan.entretien;
  const suite = [leviers.depart ?? f.anneeNPlus1.disponibiliteDeDepart];
  for (let i = 0; i < 4; i++) suite.push(net(Math.min(1, Math.max(f.entretien.disponibiliteMinimale, suite[i]! + variationDeDisponibilite(f, budgets[i] ?? 0)))));
  return { budgets, trimestres: suite.slice(0, 4), apres: suite[4]! };
}

/** Les points de taux de défaut qu'un budget d'entretien ajoute au trimestre même : défauts sans entretien × (1 − min(budget, référence) ÷ référence). */
export function defautsEnPlusDeLEntretien(f: FicheDeLaCapacite, budget: number) {
  const e = f.entretien;
  return net(e.defautsEnPlusSansEntretien * (1 - Math.min(Math.max(budget, 0), e.budgetDeReference) / e.budgetDeReference));
}

/** Le coût moyen d'un défaut, selon la part que le contrôle trouve : détectés × 20 € + livrés × 100 € (36 €). */
export function coutMoyenDUnDefaut(f: FicheDeLaCapacite, tauxDeDetection: number = f.qualite.controleFinal.tauxDeDetection) {
  return auCentime(tauxDeDetection * f.qualite.coutDUnDefautDetecte + (1 - tauxDeDetection) * f.qualite.coutDUnDefautLivre);
}

/**
 * L'année N + 1 jouée à d'autres budgets d'entretien, face au plan (le budget de référence chaque
 * trimestre). L'économie est l'entretien en moins ; la marge perdue, celle des enceintes que l'outil
 * moins disponible ne monte plus ; les défauts en plus sont ceux du trimestre même (production ×
 * points en plus), au coût moyen d'un défaut, et font perdre des ventes par la qualité perçue
 * (livrés × ventes perdues par défaut livré). L'écart de résultat = économie − marge perdue − coût
 * des défauts en plus − marge des ventes perdues par la qualité.
 */
export function entretienDeLAnnee(f: FicheDeLaCapacite, budgets: readonly number[], leviers: Partial<Omit<LeviersDeLAnnee, "entretien" | "disponibilites" | "annee">> = {}) {
  const plan = anneeDeProduction(f, { ...leviers, annee: "N+1" });
  const joue = anneeDeProduction(f, { ...leviers, annee: "N+1", entretien: budgets });
  const dispo = disponibilitesDeLAnnee(f, { budgets });
  const m = margeUnitaire(f);
  const detection = f.qualite.controleFinal.tauxDeDetection;
  const trimestres = TRIMESTRES.map((t, i) => {
    const points = defautsEnPlusDeLEntretien(f, budgets[i] ?? 0);
    const defauts = joue.trimestres[i]!.production * points;
    return {
      trimestre: t,
      budget: budgets[i] ?? 0,
      disponibilite: dispo.trimestres[i]!,
      capaciteOutil: joue.trimestres[i]!.capaciteOutil,
      ventes: joue.trimestres[i]!.production,
      ventesPerdues: plan.trimestres[i]!.production - joue.trimestres[i]!.production,
      pointsDeDefautEnPlus: points,
      defautsEnPlus: defauts,
    };
  });
  const entretienDuPlan = somme(f.plan.entretien);
  const entretien = somme(budgets);
  const economie = auCentime(entretienDuPlan - entretien);
  const ventesPerdues = plan.production - joue.production;
  const margePerdue = auCentime(ventesPerdues * m);
  const defautsEnPlus = somme(trimestres.map((x) => x.defautsEnPlus));
  const coutDesDefautsEnPlus = auCentime(defautsEnPlus * coutMoyenDUnDefaut(f));
  const ventesPerduesParLaQualite = defautsEnPlus * (1 - detection) * f.qualite.ventesPerduesParDefautLivre;
  const margePerdueParLaQualite = auCentime(ventesPerduesParLaQualite * m);
  return {
    budgets,
    trimestres,
    disponibiliteApres: dispo.apres,
    entretienDuPlan,
    entretien,
    economie,
    ventesDuPlan: plan.production,
    ventes: joue.production,
    ventesPerdues,
    margePerdue,
    defautsEnPlus,
    coutDesDefautsEnPlus,
    ventesPerduesParLaQualite,
    margePerdueParLaQualite,
    /** Sans les défauts : l'économie face à la seule marge que l'outil moins disponible fait perdre. */
    ecartParLaDisponibilite: auCentime(economie - margePerdue),
    ecartDeResultat: auCentime(economie - margePerdue - coutDesDefautsEnPlus - margePerdueParLaQualite),
  };
}

/** L'entretien d'un trimestre sauté (budget nul), les autres au budget de référence. */
export const sansEntretienAuTrimestre = (f: FicheDeLaCapacite, trimestre: Trimestre = 1) =>
  entretienDeLAnnee(
    f,
    f.plan.entretien.map((b, i) => (i === trimestre - 1 ? 0 : b)),
  );

/** L'entretien au seuil (à l'euro supérieur) chaque trimestre, toute l'année. */
export const entretienAuSeuil = (f: FicheDeLaCapacite) => entretienDeLAnnee(f, TRIMESTRES.map(() => plafond(seuilDEntretien(f))));

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA VACANCE D'UN POSTE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Le salaire d'un opérateur en part du marché, et le seuil de démission : sous le seuil, il part. Le
 * salaire au seuil (au plus proche euro supérieur) et ce que coûterait d'y porter tous les opérateurs
 * pour un an (le brut en plus et ses cotisations patronales, douze mois).
 */
export function partDuMarche(f: FicheDeLaCapacite, leviers: Partial<{ salaire: number; marche: number; seuil: number; operateurs: number }> = {}) {
  const salaire = leviers.salaire ?? f.operateurs.salaireBrutMensuel;
  const marche = leviers.marche ?? f.personnel.salaireDuMarche.nPlus1;
  const seuil = leviers.seuil ?? f.personnel.seuilDeDemission;
  const operateurs = leviers.operateurs ?? f.plan.operateurs;
  const part = salaire / marche;
  const salaireAuSeuil = plafond(marche * seuil);
  const augmentation = Math.max(0, salaireAuSeuil - salaire);
  return {
    salaire,
    marche,
    seuil,
    part,
    sousLeSeuil: part < seuil,
    salaireAuSeuil,
    augmentationParMois: augmentation,
    coutDeLAugmentationParAn: auCentime(augmentation * (1 + f.operateurs.tauxDesCotisationsPatronales) * 12 * operateurs),
  };
}

/** Le départ d'un opérateur : son dernier mois de travail, et le mois où NOVA lance le recrutement (null : elle ne remplace pas). */
export interface LeviersDuDepart {
  dernierMois: number;
  debutDuRecrutement: number | null;
}

/** Le départ de la fiche : annoncé le 1er mars, préavis d'un mois ; par défaut, le recrutement commence au départ. */
export function departDeLaFiche(f: FicheDeLaCapacite): LeviersDuDepart {
  const dernierMois = f.personnel.moisDeLAnnonce + f.personnel.preavisEnMois - 1;
  return { dernierMois, debutDuRecrutement: dernierMois + 1 };
}

/**
 * L'équipe mois par mois de N + 1. Les opérateurs du plan travaillent jusqu'au dernier mois de celui
 * qui part ; le remplaçant arrive au premier jour du mois (début du recrutement + délai) et monte,
 * le mois de son intégration, une part de ce que monte un opérateur formé. Chaque mois a sa
 * capacité (présents × 600) et ses salaires payés ; chaque trimestre, la somme de ses trois mois.
 */
export function equipeMoisParMois(f: FicheDeLaCapacite, depart: LeviersDuDepart | null = departDeLaFiche(f)) {
  const parMois = enceintesParOperateurEtParMois(f);
  const n = f.plan.operateurs;
  const arrivee = depart && depart.debutDuRecrutement !== null ? depart.debutDuRecrutement + f.personnel.delaiDeRecrutementEnMois : null;
  const mois = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const anciens = depart && m > depart.dernierMois ? n - 1 : n;
    const productiviteDuNouveau =
      arrivee === null || m < arrivee ? 0 : m < arrivee + f.personnel.integration.mois ? f.personnel.integration.productivite : 1;
    const nouveau = arrivee !== null && m >= arrivee ? 1 : 0;
    return { mois: m, anciens, nouveau, productiviteDuNouveau, capacite: plancher((anciens + productiviteDuNouveau) * parMois), salariesPayes: anciens + nouveau };
  });
  const trimestres = TRIMESTRES.map((t) => somme(mois.slice((t - 1) * 3, t * 3).map((x) => x.capacite)));
  return { arrivee, mois, trimestres, moisPayes: somme(mois.map((x) => x.salariesPayes)) };
}

/**
 * Le départ d'un opérateur en N + 1, et son remplacement. La production de l'année est rejouée avec
 * l'équipe du départ ; les ventes perdues sont celles du plan moins celles-là ; les salaires non
 * versés, les mois de salaire que le poste vide n'a pas coûté (négatif si les deux se croisent). Le
 * coût du départ = marge perdue + recrutement − salaires non versés. Il se compare à ce que coûterait,
 * pour un an, de porter les salaires au seuil de démission.
 */
export function departDUnSalarie(f: FicheDeLaCapacite, leviers: Partial<LeviersDuDepart> = {}, annee: Partial<Omit<LeviersDeLAnnee, "equipe" | "annee">> = {}) {
  const depart = { ...departDeLaFiche(f), ...leviers };
  const equipe = equipeMoisParMois(f, depart);
  const plan = anneeDeProduction(f, { ...annee, annee: "N+1" });
  const joue = anneeDeProduction(f, { ...annee, annee: "N+1", equipe: equipe.trimestres });
  const m = margeUnitaire(f);
  const ventesPerdues = plan.production - joue.production;
  const margePerdue = auCentime(ventesPerdues * m);
  const salairesNonVerses = auCentime((12 * f.plan.operateurs - equipe.moisPayes) * coutEmployeurMensuel(f));
  const recrutement = depart.debutDuRecrutement === null ? 0 : f.personnel.coutDUnRecrutement;
  const augmentation = partDuMarche(f);
  const coutDuDepart = auCentime(margePerdue + recrutement - salairesNonVerses);
  return {
    depart,
    arrivee: equipe.arrivee,
    moisVacants: equipe.arrivee === null ? 12 - depart.dernierMois : Math.max(0, equipe.arrivee - depart.dernierMois - 1),
    equipe,
    trimestres: TRIMESTRES.map((t, i) => ({
      trimestre: t,
      equipeDuPlan: plan.trimestres[i]!.capaciteEquipe,
      equipe: joue.trimestres[i]!.capaciteEquipe,
      capaciteOutil: joue.trimestres[i]!.capaciteOutil,
      demande: joue.trimestres[i]!.demande,
      ventesDuPlan: plan.trimestres[i]!.production,
      ventes: joue.trimestres[i]!.production,
      goulot: joue.trimestres[i]!.goulot,
      ventesPerdues: plan.trimestres[i]!.production - joue.trimestres[i]!.production,
    })),
    ventesPerdues,
    margePerdue,
    recrutement,
    salairesNonVerses,
    coutDuDepart,
    coutDeLAugmentationParAn: augmentation.coutDeLAugmentationParAn,
    /** Le départ coûte plus que l'augmentation qui l'aurait évité. */
    leDepartCoutePlus: coutDuDepart > augmentation.coutDeLAugmentationParAn,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LES SINISTRES ET L'ASSURANCE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Le coût d'un aléa : ses dommages, plus la marge des enceintes qu'il fait perdre. Quand il touche
 * l'outil, la simulation du cours le pose à chaque trimestre du plan de N + 1 (la capacité de l'outil
 * du trimestre réduite de sa perte), et en garde la moyenne : il ne coûte des ventes que là où la
 * capacité restante ne sert plus la demande.
 */
export function coutDUnAlea(f: FicheDeLaCapacite, code: CodeDAlea, leviers: Partial<Omit<LeviersDeLAnnee, "perteDeCapacite" | "annee">> = {}) {
  const a = aleaDe(f, code);
  const plan = anneeDeProduction(f, { ...leviers, annee: "N+1" });
  const parTrimestre = TRIMESTRES.map((t, i) => {
    if (a.perteDeCapacite === 0) return { trimestre: t, enceintesPerdues: a.ventesPerdues };
    const touche = anneeDeProduction(f, { ...leviers, annee: "N+1", perteDeCapacite: TRIMESTRES.map((_, j) => (j === i ? a.perteDeCapacite : 0)) });
    return { trimestre: t, enceintesPerdues: plan.production - touche.production };
  });
  const enceintesPerdues = somme(parTrimestre.map((x) => x.enceintesPerdues)) / 4;
  const margePerdue = auCentime(enceintesPerdues * margeUnitaire(f));
  const cout = auCentime(a.dommages + margePerdue);
  return { ...a, parTrimestre, enceintesPerdues, margePerdue, cout, esperance: auCentime(a.probabilite * cout) };
}

/** Les aléas de l'année, leur coût et leur espérance (probabilité × coût) ; l'espérance totale ; le plus lourd. */
export function aleasDeLAnnee(f: FicheDeLaCapacite) {
  const aleas = f.aleas.map((a) => coutDUnAlea(f, a.code));
  const lePire = aleas.reduce((m, x) => (x.cout > m.cout ? x : m));
  return { aleas, esperance: auCentime(somme(aleas.map((x) => x.esperance))), lePire };
}

/** Les leviers d'une formule : sa prime d'un trimestre, sa franchise, les aléas qu'elle couvre. */
export interface LeviersDeLaFormule {
  primeParTrimestre: number;
  franchise: number;
  couverts: readonly CodeDAlea[];
}

/**
 * Une formule d'assurance sur l'année. La prime de l'année = 4 primes. Sur un sinistre couvert,
 * l'assureur paie le coût au-delà de la franchise, et NOVA garde la franchise (le coût entier s'il
 * est plus petit) ; un sinistre non couvert reste à NOVA. La prime pure est ce que la formule
 * rembourse en moyenne (Σ probabilité × remboursement) ; le chargement, la prime moins la prime
 * pure ; le reste à charge espéré, l'espérance des sinistres moins la prime pure. Le coût moyen de
 * l'année = prime + reste à charge espéré = espérance des sinistres + chargement. Le pire reste à
 * charge est le plus lourd sinistre que NOVA garderait, franchise comprise.
 */
export function formuleDAssurance(f: FicheDeLaCapacite, code: CodeDeFormule | null, leviers: Partial<LeviersDeLaFormule> = {}) {
  const base = code === null ? { code: null, nom: "Sans assurance", primeParTrimestre: 0, franchise: 0, couverts: [] as readonly CodeDAlea[] } : formuleDe(f, code);
  const primeParTrimestre = leviers.primeParTrimestre ?? base.primeParTrimestre;
  const franchise = leviers.franchise ?? base.franchise;
  const couverts = leviers.couverts ?? base.couverts;
  const { aleas, esperance } = aleasDeLAnnee(f);
  const lignes = aleas.map((a) => {
    const couvert = couverts.includes(a.code);
    const resteACharge = couvert ? Math.min(a.cout, franchise) : a.cout;
    const rembourse = auCentime(a.cout - resteACharge);
    return { code: a.code, nom: a.nom, probabilite: a.probabilite, cout: a.cout, couvert, rembourse, resteACharge, rembourseEspere: auCentime(a.probabilite * rembourse), resteEspere: auCentime(a.probabilite * resteACharge) };
  });
  const prime = auCentime(primeParTrimestre * 4);
  const primePure = auCentime(somme(lignes.map((x) => x.rembourseEspere)));
  const lePire = lignes.reduce((m, x) => (x.resteACharge > m.resteACharge ? x : m));
  return {
    code: base.code,
    nom: base.nom,
    primeParTrimestre,
    franchise,
    couverts,
    lignes,
    prime,
    esperance,
    primePure,
    chargement: auCentime(prime - primePure),
    resteEspere: auCentime(esperance - primePure),
    coutMoyen: auCentime(prime + esperance - primePure),
    pireResteACharge: lePire.resteACharge,
    aleaDuPire: lePire.code,
  };
}

/** Les leviers de la capacité d'absorption : la trésorerie, la réserve et s'il faut la compter, le matelas, les capitaux propres, le capital. */
export interface LeviersDeLAbsorption {
  compteCourant: number;
  reserve: number;
  compterLaReserve: boolean;
  matelas: number;
  capitauxPropres: number;
  capitalSocial: number;
  partDuCapitalAGarder: number;
}

/**
 * Ce que NOVA peut encaisser d'un seul coup : par la trésorerie, le disponible (compte courant, et la
 * réserve si on la compte) moins le matelas ; par les capitaux propres, ce qui les sépare de la
 * moitié du capital social. La capacité d'absorption est la plus petite des deux.
 */
export function capaciteDAbsorption(f: FicheDeLaCapacite, leviers: Partial<LeviersDeLAbsorption> = {}) {
  const a = { ...f.absorption, compterLaReserve: false, ...leviers };
  const tresorerie = auCentime(a.compteCourant + (a.compterLaReserve ? a.reserve : 0));
  const parLaTresorerie = auCentime(tresorerie - a.matelas);
  const plancherDesCapitaux = auCentime(a.capitalSocial * a.partDuCapitalAGarder);
  const parLesCapitaux = auCentime(a.capitauxPropres - plancherDesCapitaux);
  return { ...a, tresorerie, parLaTresorerie, plancherDesCapitaux, parLesCapitaux, capacite: Math.min(parLaTresorerie, parLesCapitaux) };
}

/** Un sinistre face à la capacité d'absorption : ce qui resterait en trésorerie et en capitaux propres, et s'il s'encaisse. */
export function encaisser(f: FicheDeLaCapacite, montant: number, leviers: Partial<LeviersDeLAbsorption> = {}) {
  const c = capaciteDAbsorption(f, leviers);
  const tresorerieApres = auCentime(c.tresorerie - montant);
  const capitauxApres = auCentime(c.capitauxPropres - montant);
  return {
    montant,
    tresorerieApres,
    capitauxApres,
    parLaTresorerie: tresorerieApres >= c.matelas,
    parLesCapitaux: capitauxApres >= c.plancherDesCapitaux,
    seEncaisse: montant <= c.capacite,
  };
}

/** Une formule de l'assureur, ou garder tous les risques. */
export type ChoixDAssurance = CodeDeFormule | "sans-assurance";

/**
 * Le choix d'une assurance : sans assurance, puis chaque formule, avec son coût moyen et son pire
 * reste à charge. On écarte celles dont le pire reste à charge ne s'encaisse pas ; parmi les autres,
 * on retient la moins chère en moyenne (null si aucune ne s'encaisse). C'est la règle du cours : s'assurer contre ce qu'on ne
 * pourrait pas encaisser, garder ce qu'on peut encaisser, au moindre coût moyen.
 */
export function choisirUneAssurance(f: FicheDeLaCapacite, leviers: Partial<LeviersDeLAbsorption & { primes: Partial<Record<CodeDeFormule, number>> }> = {}) {
  const capacite = capaciteDAbsorption(f, leviers).capacite;
  const options = [null, ...f.formules.map((x) => x.code)].map((code) => {
    const o = formuleDAssurance(f, code, code !== null && leviers.primes?.[code] !== undefined ? { primeParTrimestre: leviers.primes[code] } : {});
    const choix: ChoixDAssurance = code ?? "sans-assurance";
    return { ...o, choix, seEncaisse: o.pireResteACharge <= capacite };
  });
  const possibles = options.filter((o) => o.seEncaisse);
  const retenue = possibles.length ? possibles.reduce((m, o) => (o.coutMoyen < m.coutMoyen ? o : m)) : null;
  const laMoinsChere = options.reduce((m, o) => (o.coutMoyen < m.coutMoyen ? o : m));
  return { capacite, options, retenue: retenue?.choix ?? null, laMoinsChere: laMoinsChere.choix };
}

/**
 * La prime de l'année au-delà de laquelle une formule cesse d'être la retenue : celle où son coût
 * moyen égale celui de la meilleure des autres options qui s'encaissent (null s'il n'y en a pas).
 */
export function primePlafond(f: FicheDeLaCapacite, code: CodeDeFormule, leviers: Partial<LeviersDeLAbsorption> = {}) {
  const c = choisirUneAssurance(f, leviers);
  const elle = c.options.find((o) => o.code === code)!;
  const autres = c.options.filter((o) => o.code !== code && o.seEncaisse);
  if (!autres.length) return { code, rivale: null, primeDeLAnnee: null, primeParTrimestre: null };
  const rivale = autres.reduce((m, o) => (o.coutMoyen < m.coutMoyen ? o : m));
  const primeDeLAnnee = auCentime(rivale.coutMoyen - elle.resteEspere);
  return { code, rivale: rivale.code, coutMoyenDeLaRivale: rivale.coutMoyen, primeDeLAnnee, primeParTrimestre: auCentime(primeDeLAnnee / 4) };
}

/** La probabilité d'un aléa où ce que la formule en rembourse en moyenne égale toute sa prime : prime ÷ (coût − franchise). */
export function probabiliteDEquilibre(f: FicheDeLaCapacite, code: CodeDeFormule, alea: CodeDAlea, leviers: Partial<LeviersDeLaFormule> = {}) {
  const o = formuleDAssurance(f, code, leviers);
  const l = o.lignes.find((x) => x.code === alea)!;
  return { prime: o.prime, rembourse: l.rembourse, probabilite: l.rembourse > 0 ? o.prime / l.rembourse : null };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LES COÛTS DE LA QUALITÉ
// ═════════════════════════════════════════════════════════════════════════════

/** Le taux de défaut d'un budget de prévention de l'année : interpolé entre deux points de la courbe, plat au-delà du dernier. */
export function tauxDeDefaut(f: FicheDeLaCapacite, budget: number) {
  const c = f.qualite.courbe;
  if (budget <= c[0]!.budget) return c[0]!.tauxDeDefaut;
  for (let i = 1; i < c.length; i++) {
    const a = c[i - 1]!;
    const b = c[i]!;
    if (budget <= b.budget) return net(a.tauxDeDefaut + ((budget - a.budget) / (b.budget - a.budget)) * (b.tauxDeDefaut - a.tauxDeDefaut));
  }
  return c.at(-1)!.tauxDeDefaut;
}

/** Les leviers de la qualité d'une année. */
export interface LeviersDeLaQualite {
  prevention: number;
  /** Les enceintes produites et vendues (par défaut, celles du plan de N + 1). */
  volume: number;
  tauxDeDetection: number;
  coutDuControle: number;
  coutDUnDefautDetecte: number;
  coutDUnDefautLivre: number;
  ventesPerduesParDefautLivre: number;
  /** Des points de taux de défaut retirés (une démarche) ou ajoutés (un entretien trop bas, en négatif). */
  baisseDuTaux: number;
}

/**
 * Les coûts de la qualité d'une année. Défauts = volume × taux de défaut (celui du budget de
 * prévention, moins la baisse). Le contrôle en trouve une part (détectés) : la défaillance interne
 * = détectés × 20 € ; les autres partent chez le client (livrés) : la défaillance externe = livrés
 * × 100 €. Le coût total de la qualité = prévention + détection + interne + externe. Les ventes
 * perdues par la qualité perçue = livrés × 3, et leur marge, que le coût total ne compte pas. Le
 * résultat de la qualité = marge des ventes (volume − ventes perdues) − coût total.
 */
export function coutsDeLaQualite(f: FicheDeLaCapacite, leviers: Partial<LeviersDeLaQualite> = {}) {
  const q = f.qualite;
  const prevention = leviers.prevention ?? q.budgetActuel;
  const volume = leviers.volume ?? anneeDeProduction(f).production;
  const tauxDeDetection = leviers.tauxDeDetection ?? q.controleFinal.tauxDeDetection;
  const detection = leviers.coutDuControle ?? q.controleFinal.cout;
  const taux = net(Math.max(0, tauxDeDefaut(f, prevention) - (leviers.baisseDuTaux ?? 0)));
  const defauts = net(volume * taux);
  const detectes = net(defauts * tauxDeDetection);
  const livres = net(defauts - detectes);
  const interne = auCentime(detectes * (leviers.coutDUnDefautDetecte ?? q.coutDUnDefautDetecte));
  const externe = auCentime(livres * (leviers.coutDUnDefautLivre ?? q.coutDUnDefautLivre));
  const total = auCentime(prevention + detection + interne + externe);
  const ventesPerdues = net(livres * (leviers.ventesPerduesParDefautLivre ?? q.ventesPerduesParDefautLivre));
  const m = margeUnitaire(f);
  const margePerdue = auCentime(ventesPerdues * m);
  return {
    prevention,
    volume,
    tauxDeDefaut: taux,
    defauts,
    tauxDeDetection,
    detectes,
    livres,
    detection,
    interne,
    externe,
    nonQualite: auCentime(interne + externe),
    total,
    ventesPerdues,
    margePerdue,
    totalAvecLesVentesPerdues: auCentime(total + margePerdue),
    resultat: auCentime((volume - ventesPerdues) * m - total),
  };
}

/**
 * La courbe des coûts de la qualité, aux budgets donnés (par défaut, les quatre points de la fiche) :
 * le budget au coût total le plus bas, et celui au meilleur résultat, ventes perdues comprises.
 */
export function courbeDeLaQualite(f: FicheDeLaCapacite, budgets: readonly number[] = f.qualite.courbe.map((p) => p.budget), leviers: Partial<Omit<LeviersDeLaQualite, "prevention">> = {}) {
  const points = budgets.map((b) => coutsDeLaQualite(f, { ...leviers, prevention: b }));
  const leMoinsCher = points.reduce((m, p) => (p.total < m.total ? p : m));
  const leMeilleur = points.reduce((m, p) => (p.resultat > m.resultat ? p : m));
  return { points, leMoinsCher: leMoinsCher.prevention, leMeilleur: leMeilleur.prevention };
}

/**
 * Une démarche qualité, sur une année au budget de prévention actuel : les coûts de la qualité sans
 * elle et avec elle. Le gain d'une année sur les coûts = coût total sans − coût total avec ; sur les
 * ventes, la marge des ventes que la qualité perçue ne fait plus perdre. Son délai de récupération =
 * son coût ÷ le gain d'une année (sur les coûts seuls, puis ventes comprises). HYPOTHÈSE DU COURS :
 * la démarche garde ses effets, et chaque année gagne autant que la première.
 */
export function demarcheQualite(f: FicheDeLaCapacite, code: CodeDeDemarche, leviers: Partial<LeviersDeLaQualite & { horizon: number }> = {}) {
  const d = f.demarches.find((x) => x.code === code);
  if (!d) throw new Error(`Pas de démarche ${code}`);
  const sans = coutsDeLaQualite(f, leviers);
  const avec = coutsDeLaQualite(f, {
    ...leviers,
    baisseDuTaux: (leviers.baisseDuTaux ?? 0) + d.baisseDuTauxDeDefaut,
    ...(d.tauxDeDetection === null ? {} : { tauxDeDetection: d.tauxDeDetection }),
  });
  const gainDesCouts = auCentime(sans.total - avec.total);
  const gainDesVentes = auCentime(sans.margePerdue - avec.margePerdue);
  const gain = auCentime(gainDesCouts + gainDesVentes);
  const horizon = leviers.horizon ?? 3;
  return {
    ...d,
    sans,
    avec,
    defautsEvites: net(sans.defauts - avec.defauts),
    livresEvites: net(sans.livres - avec.livres),
    gainDesCouts,
    gainDesVentes,
    gain,
    delaiSurLesCouts: gainDesCouts > 0 ? d.cout / gainDesCouts : null,
    delai: gain > 0 ? d.cout / gain : null,
    horizon,
    gainNetSurLesCouts: auCentime(gainDesCouts * horizon - d.cout),
    gainNet: auCentime(gain * horizon - d.cout),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. LA MACHINE EN PLUS
// ═════════════════════════════════════════════════════════════════════════════

/** Un emprunt remboursé par parts égales de capital chaque année : le capital dû, les intérêts, l'annuité. */
export function planDEmprunt(capital: number, taux: number, duree: number) {
  const remboursement = auCentime(capital / duree);
  return Array.from({ length: duree }, (_, i) => {
    const du = auCentime(capital - i * remboursement);
    const interets = auCentime(du * taux);
    return { annee: i + 1, du, interets, remboursement, annuite: auCentime(interets + remboursement) };
  });
}

/** Le facteur d'actualisation d'un flux constant sur n années : (1 − (1 + i)^−n) ÷ i. */
export const facteurDActualisation = (taux: number, duree: number) => (1 - Math.pow(1 + taux, -duree)) / taux;

/** Les leviers d'une machine en plus. */
export interface LeviersDeLaMachine {
  /** La hausse de la demande de N + 1, gardée toute la durée de la machine. */
  hausseDeLaDemande: number;
  /** Les opérateurs embauchés avec elle (par défaut, ceux qu'elle demande). */
  embauches: number;
  prix: number;
  tauxDActualisation: number;
  tauxDImpot: number;
  tauxDeLEmprunt: number;
  salaireBrutMensuel: number;
}

/**
 * Une machine achetée le 1er janvier N + 1, en service dès le trimestre 1, avec ses embauches.
 *   - Les ventes gagnées : l'année N + 1 (à la hausse de demande choisie) jouée avec l'outil et
 *     l'équipe agrandis, moins la même année sans la machine ; la marge gagnée, à 21 € l'enceinte.
 *   - Les charges de la première année : l'amortissement (prix ÷ durée), les intérêts de l'emprunt
 *     (prix × taux), les salaires des embauchés, l'entretien. Le résultat gagné = marge gagnée −
 *     charges ; les ventes qu'il faut gagner pour qu'il soit nul = charges ÷ 21 €, à l'enceinte
 *     supérieure.
 *   - Les flux nets de trésorerie de chaque année : (marge gagnée − salaires − entretien −
 *     amortissement) × (1 − impôt) + amortissement. Les intérêts n'y sont pas : le taux
 *     d'actualisation rémunère déjà l'argent engagé. L'investissement du départ : le prix et les
 *     recrutements. VAN = − investissement + flux × facteur d'actualisation ; délai de récupération
 *     = investissement ÷ flux (null si le flux est négatif ou nul).
 */
export function machineEnPlus(f: FicheDeLaCapacite, code: CodeDeMachine, leviers: Partial<LeviersDeLaMachine> = {}) {
  const machine = machineDe(f, code);
  const inv = f.investissement;
  const hausse = leviers.hausseDeLaDemande ?? 0;
  const embauches = leviers.embauches ?? machine.embauches;
  const prix = leviers.prix ?? machine.prix;
  const taux = leviers.tauxDActualisation ?? inv.tauxDActualisation;
  const impot = leviers.tauxDImpot ?? inv.tauxDImpot;
  const tauxDeLEmprunt = leviers.tauxDeLEmprunt ?? inv.tauxDeLEmprunt;
  const duree = machine.dureeEnAnnees;
  const equipeEnPlus = embauches * enceintesParOperateurEtParMois(f, machine.heuresParEnceinte) * 3;
  const sans = anneeDeProduction(f, { hausseDeLaDemande: hausse });
  const avec = anneeDeProduction(f, { hausseDeLaDemande: hausse, capaciteEnPlus: machine.capaciteEnPlus, equipeEnPlus });
  const m = margeUnitaire(f);
  const ventesGagnees = avec.production - sans.production;
  const margeGagnee = auCentime(ventesGagnees * m);
  const amortissement = auCentime(prix / duree);
  const emprunt = planDEmprunt(prix, tauxDeLEmprunt, duree);
  const interets = emprunt[0]!.interets;
  const salaires = auCentime(embauches * coutEmployeurMensuel(f, leviers.salaireBrutMensuel) * 12);
  const entretien = machine.entretienParAn;
  const charges = auCentime(amortissement + interets + salaires + entretien);
  const resultatAvantImpot = auCentime(margeGagnee - salaires - entretien - amortissement);
  const fluxAnnuel = auCentime(resultatAvantImpot * (1 - impot) + amortissement);
  const recrutements = embauches * f.personnel.coutDUnRecrutement;
  const investissement = auCentime(prix + recrutements);
  const facteur = facteurDActualisation(taux, duree);
  return {
    machine,
    hausseDeLaDemande: hausse,
    embauches,
    capaciteOutil: f.ligne.capaciteParTrimestre + machine.capaciteEnPlus,
    capaciteEquipe: capaciteDeLEquipe(f) + equipeEnPlus,
    equipeEnPlus,
    sans,
    avec,
    trimestres: TRIMESTRES.map((t, i) => ({
      trimestre: t,
      demande: avec.trimestres[i]!.demande,
      ventesSans: sans.trimestres[i]!.production,
      ventesAvec: avec.trimestres[i]!.production,
      goulotSans: sans.trimestres[i]!.goulot,
      goulotAvec: avec.trimestres[i]!.goulot,
      ventesGagnees: avec.trimestres[i]!.production - sans.trimestres[i]!.production,
    })),
    ventesGagnees,
    margeGagnee,
    amortissement,
    emprunt,
    interets,
    salaires,
    entretien,
    charges,
    resultatGagne: auCentime(margeGagnee - charges),
    ventesNecessaires: plafond(charges / m),
    resultatAvantImpot,
    impot: auCentime(resultatAvantImpot * impot),
    fluxAnnuel,
    flux: Array.from({ length: duree }, () => fluxAnnuel),
    recrutements,
    investissement,
    tauxDActualisation: taux,
    facteurDActualisation: facteur,
    van: auCentime(-investissement + fluxAnnuel * facteur),
    delaiDeRecuperation: fluxAnnuel > 0 ? investissement / fluxAnnuel : null,
  };
}

/**
 * La plus petite hausse de la demande de N + 1 (au dixième de point de pourcentage) qui rend la VAN
 * de la machine positive ou nulle, entre 0 et 100 % ; null si aucune ne le fait.
 */
export function hausseQuiAnnuleLaVan(f: FicheDeLaCapacite, code: CodeDeMachine, leviers: Partial<Omit<LeviersDeLaMachine, "hausseDeLaDemande">> = {}) {
  for (let pm = 0; pm <= 1000; pm++) {
    const h = pm / 1000;
    if (machineEnPlus(f, code, { ...leviers, hausseDeLaDemande: h }).van >= 0) return h;
  }
  return null;
}

/** Les deux machines face à face, à une même hausse de la demande : la meilleure VAN, si elle est positive. */
export function comparerLesMachines(f: FicheDeLaCapacite, leviers: Partial<LeviersDeLaMachine> = {}) {
  const machines = f.machines.map((x) => machineEnPlus(f, x.code, leviers));
  const meilleure = machines.reduce((m, x) => (x.van > m.van ? x : m));
  return { machines, meilleure: meilleure.van > 0 ? meilleure.machine.code : null };
}
