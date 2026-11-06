import { auCentime, joursCompris, type DateDuCours } from "./amortissement";
import { DECOUVERT_DE_NOVA } from "./banque-de-nova";
import { budgetDeTresorerie, investissementDeLaFiche, moisDeDecalage, tableauDeBord, type LeviersDuSemestre } from "./couts-et-budgets";
import { APPORT_EN_CAPITAL, CONTRAT_DE_PRET, EQUIPEMENT, PAIE_DU_MOIS, PLACEMENT, TAUX_DE_LA_PAIE } from "./exercice-de-nova";
import type { FicheDeGestion } from "./nova-gestion";
import { bulletinDePaie } from "./paie";

/**
 * LE MONDE DU COURS : ÉQUILIBRER LA TRÉSORERIE DE NOVA ET BÂTIR SES ÉTATS PRÉVISIONNELS.
 *
 * Le chapitre « Équilibrer la trésorerie et bâtir les états prévisionnels » le lit. Il part du budget
 * de trésorerie du semestre (monde/couts-et-budgets.ts, celui du chapitre « Le budget de
 * trésorerie »), banc de mesure acheté en avril (nova-gestion.ts, INVESTISSEMENT_ENVISAGE), qui met
 * NOVA à découvert fin avril. Il en fait trois choses :
 *
 *   1. LE RÉÉQUILIBRAGE : ce que coûte chaque financement à court terme pour couvrir le besoin
 *      (le découvert, le crédit de trésorerie, l'escompte d'un effet sur CampusTech), en gardant ou
 *      non le matelas que le dirigeant veut en banque (le seuil d'alerte du tableau de bord) ;
 *   2. LES ÉTATS PRÉVISIONNELS du semestre, issus des budgets : le compte de résultat prévisionnel
 *      et le bilan prévisionnel au 30 juin, à partir du bilan d'ouverture de l'exercice
 *      (exercice-de-nova.ts : l'apport, le prêt, la ligne et sa TVA, le placement) ;
 *   3. LE SUIVI DU PLAN DE TRÉSORERIE : le banc remis à plus tard (exercice-de-nova.ts : il n'est
 *      pas acheté en N), le plan retenu est le budget sans le banc ; le compte courant réel
 *      s'en écarte de trois façons que l'exercice décrit (le prélèvement à la source, la TVA de la
 *      ligne, les dates des échéances de l'emprunt).
 *
 * CONVENTIONS : les intérêts se comptent sur 360 jours, en mois de 30 jours (JOURS_DE_LA_BANQUE) ;
 * un besoin se constate en fin de mois, sur la trésorerie du budget, et se finance pour le mois
 * suivant ; les agios ne portent pas de TVA ; les montants sont au centime.
 */

/** L'année de la banque : 360 jours, des mois de 30 jours. */
export const JOURS_DE_LA_BANQUE = 360;
export const JOURS_DU_MOIS_BANCAIRE = 30;

/**
 * LES CONDITIONS DE LA BANQUE DE NOVA (hypothèse du cours, des taux de PME de 2026) :
 *   · LE DÉCOUVERT AUTORISÉ : jusqu'à 5 000 €, au taux de 12 % l'an sur le solde débiteur (banque-de-nova.ts,
 *     DECOUVERT_DE_NOVA, le même dans tout le cours) ; les agios d'un mois se prélèvent le mois suivant.
 *     Au-delà de l'autorisation, la banque rejette les paiements.
 *   · LE CRÉDIT DE TRÉSORERIE (un crédit « spot » d'un mois) : par tranches de 1 000 €, à 6 % l'an,
 *     versé le 1er du mois et remboursé le 1er du mois suivant avec ses intérêts ; 50 € de frais de
 *     dossier à chaque mise en place (des services bancaires, prélevés le jour du versement).
 *   · L'ESCOMPTE : NOVA fait accepter par CampusTech une lettre de change relevé à la date où elle
 *     paie de toute façon (le 10, 80 jours après sa facture), et la remet à l'escompte le 10 du mois
 *     du besoin ; la banque retient l'agio (nominal × 9 % × jours jusqu'à l'échéance ÷ 360) et 20 € de
 *     commission par effet. CampusTech paie la banque à l'échéance : NOVA n'encaisse plus rien ce
 *     mois-là.
 */
export const CONDITIONS_DE_LA_BANQUE = {
  decouvert: DECOUVERT_DE_NOVA,
  credit: { tauxAnnuel: 0.06, tranche: 1_000, frais: 50 },
  escompte: { tauxAnnuel: 0.09, commission: 20, jourDeRemise: 10 },
} as const;

export type ConditionsDeLaBanque = typeof CONDITIONS_DE_LA_BANQUE;

/** Le matelas que le dirigeant veut garder en banque chaque fin de mois : le seuil d'alerte du tableau de bord. */
export const matelasDe = (f: FicheDeGestion) => f.seuilsDAlerte.tresorerie;

/** Ce que coûtent des intérêts : capital × taux × jours ÷ 360, au centime. */
export const interets = (capital: number, tauxAnnuel: number, jours: number) => auCentime((capital * tauxAnnuel * jours) / JOURS_DE_LA_BANQUE);

export type Financement = "decouvert" | "credit" | "escompte";

/** Un mois du budget rééquilibré. */
export interface MoisReequilibre {
  nom: string;
  /** La trésorerie de fin de mois, financements des mois passés compris, avant celui du mois. */
  avant: number;
  /** Ce que le financement du mois apporte, net de ses frais (le crédit, ou le net des effets escomptés). */
  apport: number;
  /** Ce qui se paie ce mois-ci au titre des financements passés : le crédit remboursé, ses intérêts, les agios. */
  paye: number;
  /** Les charges de financement nées ce mois-ci : intérêts du crédit (payés le mois suivant), agios, frais, commissions. */
  charges: { interets: number; frais: number };
  apres: number;
}

/**
 * LE BUDGET RÉÉQUILIBRÉ. Il part des flux nets du budget de trésorerie (encaissements − décaissements
 * de chaque mois) et y ajoute, mois par mois, le financement choisi :
 *   · DÉCOUVERT : rien n'est emprunté ; le solde débiteur de fin de mois coûte ses agios, sur un
 *     mois, payés le mois suivant ;
 *   · CRÉDIT : si la trésorerie passe sous le matelas, NOVA emprunte les tranches qui l'y ramènent,
 *     frais compris, et les rembourse le mois suivant avec leurs intérêts (un nouveau crédit, s'il le
 *     faut, couvre le remboursement) ;
 *   · ESCOMPTE : si la trésorerie passe sous le matelas, NOVA escompte, de la plus proche à la plus
 *     lointaine, les factures de CampusTech déjà émises et pas encore payées, jusqu'à repasser au
 *     matelas ; le mois de leur échéance, l'encaissement de CampusTech manque.
 */
export function budgetReequilibre(f: FicheDeGestion, financement: Financement, leviers: Partial<LeviersDuSemestre> = {}, matelas = matelasDe(f), conditions: ConditionsDeLaBanque = CONDITIONS_DE_LA_BANQUE) {
  const b = budgetDeTresorerie(f, leviers);
  const s = f.semestre;
  const n = s.mois.length;
  const ct = s.clienteles.find((c) => c.code === "campustech")!;
  const decalage = moisDeDecalage(ct.jourDeFacturation, b.leviers.delais.campustech, s.joursDuMoisCommercial);
  const prixTtc = b.leviers.prix * (1 + s.tauxDeTva);
  // Les effets possibles : une facture de CampusTech par mois, payée `decalage` mois plus tard.
  const effets = ct.quantites.map((q, j) => ({ mois: j, echeance: j + decalage, nominal: auCentime(Math.round(q * (1 + b.leviers.hausseDesVentes)) * prixTtc), escompte: false }));
  const aPayer = Array.from({ length: n + 1 }, () => 0);
  const manque = Array.from({ length: n + 1 }, () => 0);
  const escomptes: { mois: number; facture: number; echeance: number; nominal: number; jours: number; agio: number; commission: number; net: number }[] = [];
  const credits: { mois: number; montant: number; interets: number; frais: number }[] = [];
  let tresorerie = s.tresorerieDeDepart;
  const mois: MoisReequilibre[] = b.mois.map((m, k) => {
    const flux = auCentime(m.encaissements.total - m.decaissements.total);
    const paye = auCentime(aPayer[k]! + manque[k]!);
    const avant = auCentime(tresorerie + flux - paye);
    let apport = 0;
    let interetsDuMois = 0;
    let frais = 0;
    if (financement === "decouvert") {
      interetsDuMois = avant < 0 ? interets(-avant, conditions.decouvert.tauxAnnuel, JOURS_DU_MOIS_BANCAIRE) : 0;
      aPayer[k + 1] = auCentime(aPayer[k + 1]! + interetsDuMois);
    } else if (financement === "credit" && avant < matelas) {
      const t = conditions.credit.tranche;
      const montant = Math.ceil((matelas - avant + conditions.credit.frais) / t - 1e-9) * t;
      frais = conditions.credit.frais;
      interetsDuMois = interets(montant, conditions.credit.tauxAnnuel, JOURS_DU_MOIS_BANCAIRE);
      apport = auCentime(montant - frais);
      aPayer[k + 1] = auCentime(aPayer[k + 1]! + montant + interetsDuMois);
      credits.push({ mois: k, montant, interets: interetsDuMois, frais });
    } else if (financement === "escompte") {
      for (const e of effets) {
        if (avant + apport >= matelas) break;
        if (e.escompte || e.mois >= k || e.echeance <= k) continue;
        const jours = (e.echeance - k) * JOURS_DU_MOIS_BANCAIRE;
        const agio = interets(e.nominal, conditions.escompte.tauxAnnuel, jours);
        const net = auCentime(e.nominal - agio - conditions.escompte.commission);
        e.escompte = true;
        apport = auCentime(apport + net);
        interetsDuMois = auCentime(interetsDuMois + agio);
        frais = auCentime(frais + conditions.escompte.commission);
        if (e.echeance < n) manque[e.echeance] = auCentime(manque[e.echeance]! + e.nominal);
        escomptes.push({ mois: k, facture: e.mois, echeance: e.echeance, nominal: e.nominal, jours, agio, commission: conditions.escompte.commission, net });
      }
    }
    tresorerie = auCentime(avant + apport);
    return { nom: m.nom, avant, apport, paye, charges: { interets: interetsDuMois, frais }, apres: tresorerie };
  });
  const plusBas = mois.reduce((x, y) => (y.apres < x.apres ? y : x));
  const interetsTotaux = auCentime(mois.reduce((t, m) => t + m.charges.interets, 0));
  const fraisTotaux = auCentime(mois.reduce((t, m) => t + m.charges.frais, 0));
  // Ce qui reste dû à la banque au 30 juin : un crédit de juin, ou les agios de juin ; les effets escomptés non échus.
  const dette = auCentime(aPayer[n]!);
  const effetsNonEchus = auCentime(escomptes.filter((e) => e.echeance >= n).reduce((t, e) => t + e.nominal, 0));
  return {
    financement,
    matelas,
    budget: b,
    mois,
    credits,
    escomptes,
    interets: interetsTotaux,
    frais: fraisTotaux,
    cout: auCentime(interetsTotaux + fraisTotaux),
    plusBas: { nom: plusBas.nom, tresorerie: plusBas.apres },
    tresorerieFin: tresorerie,
    detteBancaireDeFin: dette,
    effetsEscomptesNonEchus: effetsNonEchus,
    /** Le découvert ne dépasse-t-il jamais l'autorisation ? */
    dansLAutorisation: mois.every((m) => m.apres >= -conditions.decouvert.autorise),
  };
}

/** Le budget du chapitre : le semestre, banc de mesure acheté en avril. */
export const leviersDuBanc = (f: FicheDeGestion): Partial<LeviersDuSemestre> => ({ investissement: investissementDeLaFiche(f) });

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN D'OUVERTURE ET LES ÉTATS PRÉVISIONNELS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE BILAN D'OUVERTURE DU SEMESTRE : celui de la création (exercice-de-nova.ts), le 6 janvier, une
 * fois la ligne payée et le placement fait. À l'actif, la ligne de montage, la TVA de la ligne à
 * récupérer, le placement et le compte courant de 25 000 € dont part le budget ; au passif, l'apport
 * et le prêt. Il s'équilibre (la garde le vérifie). Le budget de trésorerie du cours ignore la TVA
 * de la ligne : le bilan prévisionnel qui en sort la laisse donc à l'actif, à sa valeur d'ouverture,
 * ce qu'un contrôle de vraisemblance doit relever (exercice-de-nova.ts : elle est récupérée en
 * février et en mars).
 */
export function bilanDOuverture(f: FicheDeGestion) {
  return {
    actif: { ligne: EQUIPEMENT.ht, tvaDeLaLigne: EQUIPEMENT.tva, placement: PLACEMENT.montant, banque: f.semestre.tresorerieDeDepart },
    passif: { capital: APPORT_EN_CAPITAL.montant, emprunt: CONTRAT_DE_PRET.capital },
  };
}

/** Le 30 juin de l'exercice : la date des états prévisionnels du semestre. */
export const FIN_DU_SEMESTRE: DateDuCours = { jour: 30, mois: 6 };

/**
 * Les intérêts du placement courus au 30 juin : 133 000 € à 3 % l'an, du 6 janvier au 30 juin, jours
 * compris, en mois de 30 jours (175 jours). Versés à l'échéance, en janvier N+1 : un produit du
 * semestre qui n'est pas un encaissement.
 */
export function interetsCourusDuPlacement() {
  const jours = joursCompris(PLACEMENT.date, FIN_DU_SEMESTRE);
  return { jours, montant: interets(PLACEMENT.montant, PLACEMENT.tauxAnnuel, jours) };
}

/**
 * LE COMPTE DE RÉSULTAT PRÉVISIONNEL DU SEMESTRE, issu des budgets, avant impôt sur les sociétés (qui
 * se calcule sur l'exercice entier). Les charges d'exploitation sont celles du tableau de bord
 * (monde/couts-et-budgets.ts) : les composants et les autres coûts variables des enceintes vendues
 * (NOVA n'a pas de stock), le loyer, le personnel, l'usure de la ligne et celle du banc dès son mois ;
 * les frais du financement vont aux services bancaires, ses intérêts et agios aux charges
 * financières, avec les intérêts de l'emprunt ; les intérêts courus du placement sont un produit
 * financier.
 */
export function compteDeResultatPrevisionnel(f: FicheDeGestion, r: ReturnType<typeof budgetReequilibre>) {
  const l = r.budget.leviers;
  const t = tableauDeBord(f, l);
  const m = f.moisDeReference;
  const q = t.semestre.quantite;
  const nMois = f.semestre.mois.length;
  const ventes = t.semestre.chiffreDAffaires;
  const achats = auCentime(q * m.coutVariable.composants);
  const servicesBancaires = r.frais;
  const externes = auCentime(q * m.coutVariable.autres + nMois * m.chargesFixes.loyer + servicesBancaires);
  const personnel = auCentime(nMois * m.chargesFixes.personnel);
  const inv = l.investissement;
  const usureDuBanc = inv ? auCentime((nMois - inv.mois) * (inv.montantHt / f.semestre.investissement.dureeDAmortissementMois)) : 0;
  const dotations = auCentime(nMois * m.chargesFixes.amortissement + usureDuBanc);
  const resultatDExploitation = auCentime(ventes - achats - externes - personnel - dotations);
  const interetsDeLEmprunt = auCentime(r.budget.mois.reduce((s, x) => s + x.emprunt.interets, 0));
  const chargesFinancieres = auCentime(interetsDeLEmprunt + r.interets);
  const produitsFinanciers = interetsCourusDuPlacement().montant;
  const resultat = auCentime(resultatDExploitation + produitsFinanciers - chargesFinancieres);
  return {
    ventes,
    achats,
    externes,
    servicesBancaires,
    personnel,
    dotations,
    usureDuBanc,
    resultatDExploitation,
    /** Le résultat d'exploitation du tableau de bord, frais du financement exclus : les deux se rejoignent. */
    resultatDuTableauDeBord: t.semestre.resultat,
    produitsFinanciers,
    interetsDeLEmprunt,
    chargesFinancieres,
    resultat,
  };
}

/**
 * LE BILAN PRÉVISIONNEL AU 30 JUIN, issu des budgets : le bilan d'ouverture, plus ce que le semestre y
 * change. À l'actif, les immobilisations nettes (l'usure de gestion), les créances clients du budget
 * (effets escomptés non échus déduits : ils sont sortis de l'actif), les autres créances (la TVA de
 * la ligne, un crédit de TVA, les intérêts courus), le placement, la trésorerie positive ; au passif,
 * le capital, le résultat du semestre, l'emprunt restant dû, les concours bancaires (un découvert, un
 * crédit ou des agios encore dus), les dettes fournisseurs et les dettes fiscales et sociales.
 */
export function bilanPrevisionnel(f: FicheDeGestion, r: ReturnType<typeof budgetReequilibre>) {
  const o = bilanDOuverture(f);
  const cr = compteDeResultatPrevisionnel(f, r);
  const b = r.budget;
  const inv = b.leviers.investissement;
  const brutes = auCentime(o.actif.ligne + (inv ? inv.montantHt : 0));
  const amortissements = cr.dotations;
  const immobilisations = auCentime(brutes - amortissements);
  const creancesClients = auCentime(b.fin.creancesClients - r.effetsEscomptesNonEchus);
  const autresCreances = auCentime(o.actif.tvaDeLaLigne + b.fin.creditDeTva + cr.produitsFinanciers);
  const disponibilites = Math.max(0, r.tresorerieFin);
  const totalActif = auCentime(immobilisations + creancesClients + autresCreances + o.actif.placement + disponibilites);
  const concoursBancaires = auCentime(Math.max(0, -r.tresorerieFin) + r.detteBancaireDeFin);
  const dettesFournisseurs = b.fin.dettesFournisseurs;
  const dettesFiscalesEtSociales = auCentime(b.fin.tvaDue + b.fin.cotisationsDues);
  const totalPassif = auCentime(o.passif.capital + cr.resultat + b.fin.capitalRestantDu + concoursBancaires + dettesFournisseurs + dettesFiscalesEtSociales);
  return {
    actif: { brutes, amortissements, immobilisations, creancesClients, autresCreances, placement: o.actif.placement, disponibilites, total: totalActif },
    passif: { capital: o.passif.capital, resultat: cr.resultat, emprunt: b.fin.capitalRestantDu, concoursBancaires, dettesFournisseurs, dettesFiscalesEtSociales, total: totalPassif },
    /** Le besoin en fonds de roulement d'exploitation : créances clients − dettes fournisseurs − dettes fiscales et sociales (NOVA n'a pas de stock). */
    bfr: auCentime(creancesClients + b.fin.creditDeTva - dettesFournisseurs - dettesFiscalesEtSociales),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE SUIVI DU PLAN DE TRÉSORERIE : LE PRÉVU ET LE RÉALISÉ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE RÉALISÉ DU COMPTE COURANT, mois par mois, face au plan retenu (le budget sans le banc). Les
 * ventes, les achats, le loyer et la paie se sont passés comme prévu ; le compte courant s'en écarte
 * de trois façons, que l'exercice décrit (exercice-de-nova.ts, la trésorerie de départ) :
 *   · LE PRÉLÈVEMENT À LA SOURCE : le budget verse le net avant impôt le 28 ; la banque ne verse que
 *     le net à payer, et l'impôt retenu part le 15 du mois suivant avec les cotisations : chaque fin
 *     de mois, le compte porte un mois de prélèvement de plus que le budget ;
 *   · LA TVA DE LA LIGNE, 12 000 €, que le budget ignore : déduite sur la déclaration de janvier,
 *     elle en fait un crédit, imputé sur celle de février ; la TVA payée en février et en mars baisse
 *     d'autant ;
 *   · LES ÉCHÉANCES DE L'EMPRUNT : le budget les range le dernier jour du trimestre ; le contrat les
 *     place le 3 du mois suivant (3 avril, 3 juillet).
 */
export function realiseDuPlan(f: FicheDeGestion) {
  const prevu = budgetDeTresorerie(f);
  const s = f.semestre;
  const tva = s.tauxDeTva;
  const pas = bulletinDePaie(PAIE_DU_MOIS.brut, TAUX_DE_LA_PAIE).prelevementALaSource;
  // Les déclarations réelles : celles du budget, la TVA de la ligne déduite en janvier.
  let credit = 0;
  let aPayer = 0;
  const tvaPayee = prevu.mois.map((m, k) => {
    const payee = aPayer;
    const net = auCentime(m.tva.solde - (k === 0 ? auCentime(EQUIPEMENT.ht * tva) : 0) - credit);
    aPayer = Math.max(0, net);
    credit = Math.max(0, -net);
    return payee;
  });
  // L'échéance du budget, payée le mois suivant par le contrat (le 3 du mois qui suit le trimestre).
  const decalageDesEcheances = CONTRAT_DE_PRET.premiereEcheance.mois - 1 - s.emprunt.moisDesEcheances[0]!;
  let ecartCumule = 0;
  const mois = prevu.mois.map((m, k) => {
    const ecartTva = auCentime(m.decaissements.tva - tvaPayee[k]!);
    const echeanceReelle = k - decalageDesEcheances >= 0 ? prevu.mois[k - decalageDesEcheances]!.decaissements.emprunt : 0;
    const ecartEcheance = auCentime(m.decaissements.emprunt - echeanceReelle);
    // Le prélèvement du mois reste en banque ; celui du mois d'avant part avec les cotisations.
    const ecartPas = k === 0 ? pas : 0;
    ecartCumule = auCentime(ecartCumule + ecartTva + ecartEcheance + ecartPas);
    return {
      nom: m.nom,
      prevu: m.tresorerieFin,
      realise: auCentime(m.tresorerieFin + ecartCumule),
      ecart: ecartCumule,
      /** Ce que chaque cause a fait dans le mois. */
      causes: { prelevement: ecartPas, tvaDeLaLigne: ecartTva, echeance: ecartEcheance },
      tvaPayeeReelle: tvaPayee[k]!,
    };
  });
  return { prevu, mois, prelevementALaSource: pas, tvaDeLaLigne: auCentime(EQUIPEMENT.ht * tva), decalageDesEcheances };
}
