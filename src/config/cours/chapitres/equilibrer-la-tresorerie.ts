import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { moisDeDecalage } from "../monde/couts-et-budgets";
import {
  CONDITIONS_DE_LA_BANQUE,
  JOURS_DE_LA_BANQUE,
  JOURS_DU_MOIS_BANCAIRE,
  bilanDOuverture,
  bilanPrevisionnel,
  budgetReequilibre,
  compteDeResultatPrevisionnel,
  interets,
  interetsCourusDuPlacement,
  leviersDuBanc,
  matelasDe,
  realiseDuPlan,
  type Financement,
} from "../monde/equilibre-de-tresorerie";
import { PLACEMENT } from "../monde/exercice-de-nova";
import { DELAI_CONVENU_DE_CAMPUSTECH, GESTION_DU_COURS, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : ÉQUILIBRER LA TRÉSORERIE ET BÂTIR LES ÉTATS PRÉVISIONNELS (contrôle de gestion,
 * palier 4 ; BTS CG P5 5.4.2 et 5.4.3, DCG UE6 et UE11, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le budget de trésorerie du semestre de NOVA, celui du
 * chapitre « Le budget de trésorerie » (monde/couts-et-budgets.ts), banc de mesure acheté en avril ;
 * le rééquilibrage, les états prévisionnels et le suivi du plan se calculent dans
 * monde/equilibre-de-tresorerie.ts, à partir du bilan d'ouverture de l'exercice
 * (monde/exercice-de-nova.ts).
 *
 * L'objet : le banc met NOVA à découvert fin avril. Ce que coûte chaque financement à court terme
 * (le découvert, le crédit de trésorerie, l'escompte d'une lettre de change sur CampusTech) et lequel
 * retenir pour garder le matelas ; pourquoi le banc lui-même relève d'un financement stable ; le
 * compte de résultat et le bilan prévisionnels qui sortent des budgets, et le contrôle de leur
 * vraisemblance ; l'effet des délais sur le BFR et la trésorerie ; enfin le suivi du plan retenu,
 * le prévu face au réalisé, écart par écart.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, le-cout-du-decouvert, le-credit-de-tresorerie, le-compte-de-resultat-previsionnel
 *     (la formule est au repère ou dans la question) ;
 *   · l'expérience avant la formule : predire-le-credit puis le-credit-au-curseur (le crédit, par
 *     tranches, qui ramène avril au matelas) avant le-credit-de-tresorerie ;
 *   · autonome : l-escompte-sans-aide, le-bilan-previsionnel, le-bfr-previsionnel, le-suivi-du-plan ;
 *   · le laboratoire : le-laboratoire-du-financement (les délais, le matelas, le financement), avec
 *     un graphique du coût de chaque financement selon le matelas ;
 *   · expert : le-financement-le-moins-cher, financer-le-banc, la-tva-de-la-ligne,
 *     les-causes-des-ecarts ; puis la synthèse.
 */

/** Le rééquilibrage se calcule sur le semestre de NOVA. */
export const ENTREPRISES_DE_L_EQUILIBRE: readonly string[] = ["nova"];

/** Les bornes du curseur du crédit de trésorerie, en tranches de 1 000 €. */
export const CREDIT_DU_CURSEUR = { min: 0, max: 20 } as const;

/** Les leviers du laboratoire : les délais (en jours), le matelas (en euros), le financement retenu. */
export const LEVIERS_DU_LABORATOIRE = {
  campustech: { min: 40, max: 100, pas: 10 },
  fournisseur: { min: 0, max: 60, pas: 1 },
  matelas: { min: 0, max: 20_000, pas: 1_000 },
} as const;

/** Le levier à choix du financement : le crédit de trésorerie ou l'escompte. */
export const FINANCEMENTS_DU_LABORATOIRE: readonly { valeur: number; financement: Financement; libelle: string }[] = [
  { valeur: 0, financement: "credit", libelle: "Crédit de trésorerie" },
  { valeur: 1, financement: "escompte", libelle: "Escompte des effets" },
];

/** Le mois du suivi : fin mars, la fin du premier trimestre. */
export const MOIS_DU_SUIVI = 2;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const enBanque = (t: number) => (t >= 0 ? `${eur(t)} en banque` : `un découvert de ${eur(-t)}`);

const donnee = (valeur: number, unite?: string): CelluleACompleter => ({ valeur, ...(unite ? { unite } : {}) });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

/** Une position du laboratoire : le budget rééquilibré, son bilan et son résultat. */
export function laboratoireDuFinancement(f: FicheDeGestion, p: Readonly<Record<string, number>>) {
  const financement = FINANCEMENTS_DU_LABORATOIRE.find((x) => x.valeur === p.financement)!.financement;
  const leviers = { ...leviersDuBanc(f), delais: { particuliers: 0, campustech: p.campustech! }, delaiFournisseur: p.fournisseur! };
  const r = budgetReequilibre(f, financement, leviers, p.matelas!);
  const bilan = bilanPrevisionnel(f, r);
  return { r, cout: r.cout, plusBas: r.plusBas, juin: r.tresorerieFin, creancesClients: bilan.actif.creancesClients, bfr: bilan.bfr, resultat: compteDeResultatPrevisionnel(f, r).resultat };
}

/** Ce que coûterait chaque financement, pour un matelas donné, les autres leviers à leur position. */
const coutDu = (f: FicheDeGestion, p: Readonly<Record<string, number>>, valeur: number) => laboratoireDuFinancement(f, { ...p, financement: valeur }).cout;

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois par entreprise (la fiche est figée). */
export function equilibreDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre(c);
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = f.semestre;
  const B = CONDITIONS_DE_LA_BANQUE;
  const matelas = matelasDe(f);
  const leviers = leviersDuBanc(f);
  const decouvert = budgetReequilibre(f, "decouvert", leviers);
  const credit = budgetReequilibre(f, "credit", leviers);
  const escompte = budgetReequilibre(f, "escompte", leviers);
  const k = s.investissement.mois;
  const avril = decouvert.mois[k]!;
  const besoin = auCentime(matelas - avril.avant);
  const cr = compteDeResultatPrevisionnel(f, credit);
  const bilan = bilanPrevisionnel(f, credit);
  const ouverture = bilanDOuverture(f);
  const placement = interetsCourusDuPlacement();
  const ct = s.clienteles.find((x) => x.code === "campustech")!;
  const prixTtc = auCentime(f.moisDeReference.prix * (1 + s.tauxDeTva));
  const factureCampusTech = auCentime(ct.quantites[0]! * prixTtc);

  // Le crédit au curseur : la trésorerie de fin d'avril pour q tranches empruntées.
  const avecCredit = (q: number) => auCentime(avril.avant + q * B.credit.tranche - (q > 0 ? B.credit.frais : 0));
  const tranches = credit.credits[0]!.montant / B.credit.tranche;

  // L'effet sur le BFR : CampusTech payée à l'échéance convenue.
  const p0 = { campustech: ct.delai, fournisseur: s.fournisseur.delai, matelas, financement: 0 };
  const auConvenu = laboratoireDuFinancement(f, { ...p0, campustech: DELAI_CONVENU_DE_CAMPUSTECH });
  const decalageConvenu = moisDeDecalage(ct.jourDeFacturation, DELAI_CONVENU_DE_CAMPUSTECH, s.joursDuMoisCommercial);

  // Le laboratoire : le délai de CampusTech le plus long qui passe le banc sans aucun financement.
  const L = LEVIERS_DU_LABORATOIRE;
  const grille = Array.from({ length: Math.round((L.campustech.max - L.campustech.min) / L.campustech.pas) + 1 }, (_, i) => L.campustech.min + i * L.campustech.pas);
  const sansFinancement = (p: Readonly<Record<string, number>>) => {
    const l = laboratoireDuFinancement(f, p);
    return p.matelas! >= matelas && l.cout === 0 && l.plusBas.tresorerie >= p.matelas!;
  };
  const campusTechMax = Math.max(...grille.filter((d) => sansFinancement({ ...p0, campustech: d })));

  // Le suivi : le plan retenu, sans le banc, et le relevé de la banque.
  const suivi = realiseDuPlan(f);
  return {
    f,
    s,
    B,
    matelas,
    decouvert,
    credit,
    escompte,
    k,
    avril,
    besoin,
    cr,
    bilan,
    ouverture,
    placement,
    ct,
    factureCampusTech,
    avecCredit,
    tranches,
    p0,
    auConvenu,
    decalageConvenu,
    campusTechMax,
    sansFinancement,
    suivi,
    inv: s.investissement,
    invTtc: auCentime(s.investissement.montantHt * (1 + s.tauxDeTva)),
    nom: (i: number) => s.mois[i]!.nom,
  };
}

export type EquilibreDuChapitre = ReturnType<typeof equilibreDuChapitre>;

/** Le budget de trésorerie du semestre, banc acheté en avril : le point de départ du chapitre. */
export function tableauDuBudgetAvecLeBanc(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = equilibreDuChapitre(c);
  const b = x.decouvert.budget.mois;
  return {
    titre: `Le budget de trésorerie ${dE(x.f.entreprise)}, banc acheté en avril`,
    colonnes: x.s.mois.map((m) => majuscule(m.nom)),
    lignes: [
      { libelle: "Trésorerie de début de mois", valeurs: b.map((m) => eur(m.tresorerieDebut)) },
      { libelle: "Total des encaissements", valeurs: b.map((m) => eur(m.encaissements.total)) },
      { libelle: "Total des décaissements, banc compris", valeurs: b.map((m) => eur(m.decaissements.total)) },
      { libelle: "Trésorerie de fin de mois", valeurs: b.map((m) => eur(m.tresorerieFin)) },
    ],
  };
}

/** Les conditions de la banque, telles qu'elles s'écrivent. */
export function tableauDesConditions(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = equilibreDuChapitre(c);
  const B = x.B;
  return {
    titre: "Les conditions de la banque",
    colonnes: ["Conditions"],
    lignes: [
      { libelle: "Découvert autorisé", valeurs: [`jusqu'à ${eur(B.decouvert.autorise)}, à ${pct(B.decouvert.tauxAnnuel)} l'an sur le solde débiteur, agios prélevés le mois suivant`] },
      { libelle: "Crédit de trésorerie", valeurs: [`par tranches de ${eur(B.credit.tranche)}, pour un mois, à ${pct(B.credit.tauxAnnuel)} l'an ; ${eur(B.credit.frais)} de frais à chaque mise en place`] },
      { libelle: "Escompte", valeurs: [`à ${pct(B.escompte.tauxAnnuel)} l'an jusqu'à l'échéance, plus ${eur(B.escompte.commission)} de commission par effet`] },
      { libelle: "Matelas que le dirigeant veut garder", valeurs: [eur(x.matelas)] },
    ],
  };
}

/** Le plan retenu et le relevé de la banque, de janvier au mois du suivi. */
export function tableauDuSuivi(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = equilibreDuChapitre(c);
  const mois = x.suivi.mois.slice(0, MOIS_DU_SUIVI + 1);
  return {
    titre: "Le plan de trésorerie retenu, face au relevé de la banque",
    colonnes: mois.map((m) => majuscule(m.nom)),
    lignes: [
      { libelle: "Trésorerie de fin de mois prévue", valeurs: mois.map((m) => eur(m.prevu)) },
      { libelle: "Solde du compte courant au relevé", valeurs: mois.map((m) => eur(m.realise)) },
    ],
  };
}

/** Le compte de résultat prévisionnel du semestre, à compléter. */
export function grilleDuCompteDeResultat(c: Pick<Cas, "code">): TableauACompleter {
  const x = equilibreDuChapitre(c);
  const r = x.cr;
  const m = x.f.moisDeReference;
  const q = x.decouvert.budget.mois.reduce((t, y) => t + y.quantite, 0);
  const n = x.s.mois.length;
  const credit = x.credit.credits[0]!;
  return {
    titre: "Le compte de résultat prévisionnel du semestre",
    colonnes: ["Semestre"],
    lignes: [
      { libelle: "Ventes de produits", cellules: [aSaisir(r.ventes, `${qte(q)} enceintes × ${eur(m.prix)} = ${eur(r.ventes)}`, { indice: "toutes les enceintes du semestre, au prix hors taxes" })] },
      { libelle: "Achats de composants consommés", cellules: [aSaisir(r.achats, `${qte(q)} × ${eur(m.coutVariable.composants)} = ${eur(r.achats)}`, { indice: "sans stock, les jeux achetés sont consommés" })] },
      {
        libelle: "Autres achats et charges externes",
        cellules: [
          aSaisir(r.externes, `${qte(q)} × ${eur(m.coutVariable.autres)} + ${n} × ${eur(m.chargesFixes.loyer)} de loyer + ${eur(r.servicesBancaires)} de frais de dossier = ${eur(r.externes)}`, { indice: "les autres coûts variables, le loyer et les frais bancaires" }),
        ],
      },
      { libelle: "Charges de personnel", cellules: [aSaisir(r.personnel, `${n} × ${eur(m.chargesFixes.personnel)} = ${eur(r.personnel)}`)] },
      {
        libelle: "Dotations aux amortissements",
        cellules: [aSaisir(r.dotations, `${n} × ${eur(m.chargesFixes.amortissement)} pour la ligne + ${eur(r.usureDuBanc)} pour le banc, dès ${x.nom(x.k)} = ${eur(r.dotations)}`, { indice: "la ligne sur tout le semestre, le banc dès son mois" })],
      },
      { libelle: "Résultat d'exploitation", fort: true, totalDe: { plus: [0], moins: [1, 2, 3, 4] }, cellules: [aSaisir(r.resultatDExploitation, `${eur(r.ventes)} − ${eur(r.achats)} − ${eur(r.externes)} − ${eur(r.personnel)} − ${eur(r.dotations)} = ${eur(r.resultatDExploitation)}`)] },
      {
        libelle: "Produits financiers",
        cellules: [aSaisir(r.produitsFinanciers, `${eur(PLACEMENT.montant)} × ${pct(PLACEMENT.tauxAnnuel)} × ${x.placement.jours} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(r.produitsFinanciers)}, courus, non encaissés`, { indice: "les intérêts du placement, du 6 janvier au 30 juin" })],
      },
      { libelle: "Charges financières", cellules: [aSaisir(r.chargesFinancieres, `${eur(r.interetsDeLEmprunt)} d'intérêts de l'emprunt + ${eur(credit.interets)} d'intérêts du crédit = ${eur(r.chargesFinancieres)}`, { indice: "l'emprunt et le crédit de trésorerie" })] },
      { libelle: "Résultat avant impôt", fort: true, totalDe: { plus: [5, 6], moins: [7] }, cellules: [aSaisir(r.resultat, `${eur(r.resultatDExploitation)} + ${eur(r.produitsFinanciers)} − ${eur(r.chargesFinancieres)} = ${eur(r.resultat)}`)] },
    ],
  };
}

/** Le bilan prévisionnel au 30 juin, à compléter. */
export function grilleDuBilan(c: Pick<Cas, "code">): TableauACompleter {
  const x = equilibreDuChapitre(c);
  const a = x.bilan.actif;
  const p = x.bilan.passif;
  const fin = x.credit.budget.fin;
  return {
    titre: "Le bilan prévisionnel au 30 juin",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Immobilisations, valeur brute : la ligne et le banc", cellules: [donnee(a.brutes)] },
      { libelle: "Amortissements", cellules: [aSaisir(a.amortissements, `les dotations du semestre : ${eur(a.amortissements)}`, { indice: "celles du compte de résultat prévisionnel" })] },
      { libelle: "Immobilisations nettes", totalDe: { plus: [0], moins: [1] }, cellules: [aSaisir(a.immobilisations, `${eur(a.brutes)} − ${eur(a.amortissements)} = ${eur(a.immobilisations)}`)] },
      { libelle: "Créances clients", cellules: [aSaisir(a.creancesClients, `les factures de CampusTech encore dues au 30 juin, TTC : ${eur(a.creancesClients)}`, { indice: "ce que le budget de trésorerie n'a pas encore encaissé" })] },
      {
        libelle: "Autres créances",
        cellules: [aSaisir(a.autresCreances, `${eur(x.ouverture.actif.tvaDeLaLigne)} de TVA de la ligne, à l'ouverture, + ${eur(x.placement.montant)} d'intérêts courus = ${eur(a.autresCreances)}`, { indice: "la TVA de la ligne du bilan d'ouverture et les intérêts du placement" })],
      },
      { libelle: "Placement", cellules: [donnee(a.placement)] },
      { libelle: "Disponibilités", cellules: [aSaisir(a.disponibilites, `la trésorerie du 30 juin, crédit compris : ${eur(a.disponibilites)}`)] },
      { libelle: "Total de l'actif", fort: true, totalDe: { plus: [2, 3, 4, 5, 6] }, cellules: [aSaisir(a.total, `${[a.immobilisations, a.creancesClients, a.autresCreances, a.placement, a.disponibilites].map(eur).join(" + ")} = ${eur(a.total)}`)] },
      { libelle: "Capital", cellules: [donnee(p.capital)] },
      { libelle: "Résultat du semestre", cellules: [aSaisir(p.resultat, `le résultat avant impôt du compte de résultat prévisionnel : ${eur(p.resultat)}`)] },
      { libelle: "Emprunt", cellules: [aSaisir(p.emprunt, `${eur(x.ouverture.passif.emprunt)} − ${eur(x.ouverture.passif.emprunt - p.emprunt)} de capital remboursé = ${eur(p.emprunt)}`, { indice: "le capital restant dû après les échéances du semestre" })] },
      { libelle: "Dettes fournisseurs", cellules: [aSaisir(p.dettesFournisseurs, `les jeux de juin, TTC, payés en juillet : ${eur(p.dettesFournisseurs)}`)] },
      {
        libelle: "Dettes fiscales et sociales",
        cellules: [aSaisir(p.dettesFiscalesEtSociales, `${eur(fin.tvaDue)} de TVA de juin + ${eur(fin.cotisationsDues)} de cotisations de juin = ${eur(p.dettesFiscalesEtSociales)}`, { indice: "ce qui se paie en juillet à l'État et aux caisses" })],
      },
      { libelle: "Total du passif", fort: true, totalDe: { plus: [8, 9, 10, 11, 12] }, cellules: [aSaisir(p.total, `${[p.capital, p.resultat, p.emprunt, p.dettesFournisseurs, p.dettesFiscalesEtSociales].map(eur).join(" + ")} = ${eur(p.total)}`)] },
    ],
  };
}

export const EQUILIBRER_LA_TRESORERIE: Chapitre = {
  code: "equilibrer-la-tresorerie",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["BTS CG P5 · Analyse et prévision de l'activité", "DCG UE6 · Finance d'entreprise", "DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "Équilibrer la trésorerie et bâtir les états prévisionnels",
  accroche:
    "Le banc de mesure met NOVA à découvert fin avril. Chiffrer le découvert, le crédit de trésorerie et l'escompte, choisir, puis bâtir le compte de résultat et le bilan prévisionnels du semestre. Et suivre le plan retenu, le prévu face au réalisé, écart par écart.",
  objectifs: [
    "Calculer le coût d'un découvert, d'un crédit de trésorerie et d'un escompte, et retenir le moins cher pour un besoin donné",
    "Distinguer le financement d'un décalage de trésorerie de celui d'un investissement",
    "Bâtir le compte de résultat et le bilan prévisionnels à partir des budgets, et contrôler leur vraisemblance",
    "Mesurer l'effet d'un délai de paiement sur le BFR et sur la trésorerie",
    "Comparer le plan de trésorerie au réalisé et expliquer chaque écart",
  ],
  libre: false,
  prerequis: ["budget-de-tresorerie", "des-ventes-aux-achats"],
  entreprises: {
    codes: ENTREPRISES_DE_L_EQUILIBRE,
    pourquoi: "le rééquilibrage et les états prévisionnels se bâtissent ici sur le semestre de NOVA dans la simulation du cours, avec son banc, sa banque et son bilan d'ouverture ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un découvert annoncé",
      notions: ["cash_budget", "receivables_financing"],
      tableau: tableauDuBudgetAvecLeBanc,
      texte: (c) => {
        const x = equilibreDuChapitre(c);
        return [
          `Nous sommes en janvier. Le budget de trésorerie ${dE(x.f.entreprise)} l'a montré : acheter en ${x.nom(x.k)} ${x.inv.libelle}, ${eur(x.inv.montantHt)} HT, ferait finir le mois avec ${enBanque(x.avril.avant)}. Le dirigeant veut garder ${eur(x.matelas)} en banque chaque fin de mois.`,
          "Rééquilibrer la trésorerie, c'est trouver de quoi couvrir ce besoin, au moindre coût. Trois familles de solutions s'offrent à lui.",
          "Agir sur l'exploitation : faire payer les clients plus tôt, payer les fournisseurs plus tard, tenir moins de stock. Emprunter à court terme : le découvert, le crédit de trésorerie, l'escompte. Ou financer à long terme : un emprunt, un apport des associés, la réserve placée.",
          "Puis le contrôleur tire des budgets le compte de résultat et le bilan prévisionnels du semestre. Une fois le semestre engagé, il suit le plan : le prévu face au réalisé.",
        ];
      },
      repere: () => `Coût d'un financement = capital × taux annuel × jours ÷ ${JOURS_DE_LA_BANQUE}, plus ses frais. Un mois compte ${JOURS_DU_MOIS_BANCAIRE} jours.`,
    },
    {
      id: "le-cout-du-decouvert",
      objectifs: [0],
      type: "montants",
      titre: "Le coût du découvert",
      notions: ["receivables_financing", "cash_budget"],
      tableau: tableauDesConditions,
      question: (c) => {
        const x = equilibreDuChapitre(c);
        const n = x.nom(x.k);
        return `Fin ${dE(n)}, le compte finit à ${eur(x.avril.avant)}. Laissé à découvert pendant ${JOURS_DU_MOIS_BANCAIRE} jours, il coûte des agios, prélevés en ${x.nom(x.k + 1)}. Calculez ces agios, la trésorerie de fin de ${x.nom(x.k + 1)} (sans eux : ${eur(x.decouvert.budget.mois[x.k + 1]!.tresorerieFin)}), puis le besoin pour finir ${n} au matelas.`;
      },
      champs: (c) => {
        const x = equilibreDuChapitre(c);
        const agios = x.avril.charges.interets;
        const mai = x.decouvert.mois[x.k + 1]!;
        return [
          { libelle: "Agios du découvert", attendu: agios, calcul: `${eur(-x.avril.avant)} × ${pct(x.B.decouvert.tauxAnnuel)} × ${JOURS_DU_MOIS_BANCAIRE} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(agios)}` },
          { libelle: `Trésorerie de fin de ${x.nom(x.k + 1)}, agios payés`, attendu: mai.apres, calcul: `${eur(x.decouvert.budget.mois[x.k + 1]!.tresorerieFin)} − ${eur(agios)} = ${eur(mai.apres)}` },
          { libelle: `Besoin pour finir ${x.nom(x.k)} au matelas`, attendu: x.besoin, calcul: `${eur(x.matelas)} − (${eur(x.avril.avant)}) = ${eur(x.besoin)}` },
        ];
      },
      explication: (c) => {
        const x = equilibreDuChapitre(c);
        return [
          `Le découvert coûte peu, ${eur(x.avril.charges.interets)}, parce qu'il est petit et court. Mais il laisse le compte sous zéro, sans matelas, et la banque ne l'autorise que jusqu'à ${eur(x.B.decouvert.autorise)} : il ne peut pas couvrir les ${eur(x.besoin)} qui ramèneraient ${x.nom(x.k)} au matelas.`,
        ];
      },
    },
    {
      id: "predire-le-credit",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur le crédit",
      notions: ["cash_budget"],
      question: (c) => {
        const x = equilibreDuChapitre(c);
        return `Avant de calculer, pariez. Pour finir ${x.nom(x.k)} au matelas, il manque ${eur(x.besoin)}. La banque prête par tranches de ${eur(x.B.credit.tranche)}, et prend ${eur(x.B.credit.frais)} de frais le jour du versement. Combien faut-il emprunter ?`;
      },
      options: (c) => {
        const x = equilibreDuChapitre(c);
        const voir = `Faites varier le crédit à l'étape suivante : le curseur montre la trésorerie de fin ${dE(x.nom(x.k))}, tranche par tranche.`;
        const juste = x.credit.credits[0]!.montant;
        return [
          { texte: eur(juste), juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${eur(x.besoin)}, le besoin exact`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `${eur(juste - x.B.credit.tranche)}, en arrondissant au plus proche`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-credit-au-curseur",
      objectifs: [0],
      type: "curseur",
      titre: "Le crédit, au curseur",
      notions: ["cash_budget"],
      question: (c) => {
        const x = equilibreDuChapitre(c);
        return `Faites varier le crédit de trésorerie ${dE(x.nom(x.k))}, de ${qte(CREDIT_DU_CURSEUR.min)} à ${qte(CREDIT_DU_CURSEUR.max)} tranches de ${eur(x.B.credit.tranche)}. Une droite donne la trésorerie de fin ${dE(x.nom(x.k))}, frais payés ; l'autre le matelas de ${eur(x.matelas)}. Placez le curseur sur le plus petit crédit qui y ramène, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Crédit de trésorerie, en tranches de ${eur(equilibreDuChapitre(c).B.credit.tranche)}`, unite: "tranches" }),
      cible: (c) => {
        const x = equilibreDuChapitre(c);
        return { attendu: x.tranches, min: CREDIT_DU_CURSEUR.min, max: CREDIT_DU_CURSEUR.max };
      },
      zones: ["Au matelas", "Sous le matelas"],
      rates: () => ({
        dessous: "À cette position, le mois finit encore sous le matelas.",
        dessus: "Avec moins de tranches, le mois tiendrait déjà le matelas : cherchez le plus petit crédit.",
      }),
      montrer: "Montrer le crédit",
      lecture: (c, q) => {
        const x = equilibreDuChapitre(c);
        const montant = q * x.B.credit.tranche;
        return [
          { libelle: `Crédit versé le 1er ${x.nom(x.k)}`, montant },
          { libelle: "Intérêts du mois, payés au remboursement", montant: interets(montant, x.B.credit.tauxAnnuel, JOURS_DU_MOIS_BANCAIRE) },
          { libelle: `Trésorerie de fin ${dE(x.nom(x.k))}, frais payés`, montant: x.avecCredit(q), fort: true },
        ];
      },
      droites: (c) => {
        const x = equilibreDuChapitre(c);
        return { produit: (q) => x.avecCredit(q), cout: () => x.matelas, libelles: [`Trésorerie de fin ${dE(x.nom(x.k))}`, "Le matelas"] };
      },
      explication: (c) => {
        const x = equilibreDuChapitre(c);
        const montant = x.credit.credits[0]!.montant;
        return [
          `Il faut ${qte(x.tranches)} tranches, ${eur(montant)} : le besoin, ${eur(x.besoin)}, plus les ${eur(x.B.credit.frais)} de frais qui sortent le jour même, arrondis à la tranche supérieure. Avril finit à ${eur(x.avecCredit(x.tranches))}.`,
        ];
      },
    },
    {
      id: "le-credit-de-tresorerie",
      objectifs: [0],
      type: "montants",
      titre: "Le crédit de trésorerie",
      notions: ["cash_budget", "loan_schedule"],
      question: (c) => {
        const x = equilibreDuChapitre(c);
        const montant = x.credit.credits[0]!.montant;
        return `${x.f.entreprise} emprunte ${eur(montant)} le 1er ${x.nom(x.k)}, à ${pct(x.B.credit.tauxAnnuel)} l'an, et rembourse le 1er ${x.nom(x.k + 1)} capital et intérêts. Calculez les intérêts, le coût total du crédit, frais compris, puis la trésorerie de fin de ${x.nom(x.k + 1)}, remboursement fait (sans crédit : ${eur(x.decouvert.budget.mois[x.k + 1]!.tresorerieFin)}).`;
      },
      champs: (c) => {
        const x = equilibreDuChapitre(c);
        const k = x.credit.credits[0]!;
        const mai = x.credit.mois[x.k + 1]!;
        return [
          { libelle: "Intérêts du crédit", attendu: k.interets, calcul: `${eur(k.montant)} × ${pct(x.B.credit.tauxAnnuel)} × ${JOURS_DU_MOIS_BANCAIRE} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(k.interets)}` },
          { libelle: "Coût total du crédit", attendu: x.credit.cout, calcul: `${eur(k.interets)} + ${eur(k.frais)} de frais = ${eur(x.credit.cout)}` },
          {
            libelle: `Trésorerie de fin de ${x.nom(x.k + 1)}`,
            attendu: mai.apres,
            calcul: `${eur(x.credit.mois[x.k]!.apres)} + (${eur(x.decouvert.budget.mois[x.k + 1]!.tresorerieFin)} − (${eur(x.avril.avant)})) − ${eur(k.montant)} − ${eur(k.interets)} = ${eur(mai.apres)}`,
          },
        ];
      },
      explication: (c) => {
        const x = equilibreDuChapitre(c);
        return [
          `Le crédit est plus cher que le découvert, ${eur(x.credit.cout)} contre ${eur(x.decouvert.cout)}, alors que son taux est plus bas : il porte sur plus d'argent, et ses frais fixes pèsent sur un petit montant. En échange, ${x.nom(x.k)} garde son matelas, et ${x.nom(x.k + 1)} rembourse sans peine.`,
        ];
      },
    },
    {
      id: "l-escompte-sans-aide",
      objectifs: [0],
      type: "montants",
      titre: "L'escompte, sans aide",
      notions: ["receivables_financing", "payment_terms"],
      tableau: tableauDesConditions,
      question: (c) => {
        const x = equilibreDuChapitre(c);
        const e = x.escompte.escomptes[0]!;
        return `À vous, sans formule cette fois. CampusTech accepte une lettre de change sur sa facture de ${x.nom(e.facture)}, ${eur(e.nominal)} TTC, à la date où elle paie, le ${x.B.escompte.jourDeRemise} ${x.nom(e.echeance)}. ${x.f.entreprise} la remet à l'escompte le ${x.B.escompte.jourDeRemise} ${x.nom(e.mois)}. Calculez l'agio, le net versé par la banque, le coût de l'escompte, puis la trésorerie de fin ${dE(x.nom(x.k))}.`;
      },
      champs: (c) => {
        const x = equilibreDuChapitre(c);
        const e = x.escompte.escomptes[0]!;
        const avril = x.escompte.mois[x.k]!;
        return [
          { libelle: "Agio d'escompte", attendu: e.agio, calcul: `${eur(e.nominal)} × ${pct(x.B.escompte.tauxAnnuel)} × ${e.jours} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(e.agio)}, du ${x.B.escompte.jourDeRemise} ${x.nom(e.mois)} au ${x.B.escompte.jourDeRemise} ${x.nom(e.echeance)}` },
          { libelle: "Net versé par la banque", attendu: e.net, calcul: `${eur(e.nominal)} − ${eur(e.agio)} − ${eur(e.commission)} de commission = ${eur(e.net)}` },
          { libelle: "Coût de l'escompte", attendu: x.escompte.cout, calcul: `${eur(e.agio)} + ${eur(e.commission)} = ${eur(x.escompte.cout)}` },
          { libelle: `Trésorerie de fin ${dE(x.nom(x.k))}`, attendu: avril.apres, calcul: `${eur(avril.avant)} + ${eur(e.net)} = ${eur(avril.apres)}` },
        ];
      },
      explication: (c) => {
        const x = equilibreDuChapitre(c);
        const e = x.escompte.escomptes[0]!;
        return [
          `L'escompte avance une créance, et toute la créance : ${eur(e.nominal)} pour un besoin de ${eur(x.besoin)}. ${x.f.entreprise} paie l'agio sur le tout. En ${x.nom(e.echeance)}, CampusTech paie la banque : ce mois-là, ${x.f.entreprise} n'encaisse plus sa facture.`,
        ];
      },
    },
    {
      id: "le-financement-le-moins-cher",
      objectifs: [0],
      type: "choix",
      titre: "Le financement à retenir",
      notions: ["receivables_financing", "cash_budget"],
      question: (c) => {
        const x = equilibreDuChapitre(c);
        return `Pour finir ${x.nom(x.k)} au matelas de ${eur(x.matelas)}, quel financement le dirigeant retient-il ?`;
      },
      options: (c) => {
        const x = equilibreDuChapitre(c);
        return [
          {
            texte: `Le crédit, ${eur(x.credit.cout)}`,
            juste: true,
            retour: `Oui. Il couvre le besoin au plus juste, à la tranche près, pour ${eur(x.credit.cout)}. L'escompte coûterait ${eur(x.escompte.cout)} : il avance toute une facture, et la paie au taux de l'escompte.`,
          },
          {
            texte: `L'escompte : il apporte ${eur(x.escompte.escomptes[0]!.net)}`,
            juste: false,
            retour: "Apporter plus que le besoin n'est pas un avantage : chaque euro avancé paie son agio. L'escompte sert quand la banque refuse un crédit, ou quand le besoin est proche d'une facture.",
          },
          {
            texte: `Le découvert, ${eur(x.decouvert.cout)} seulement`,
            juste: false,
            retour: `Le découvert est le moins cher, mais il ne garde pas le matelas : ${x.nom(x.k)} finit sous zéro. Pour finir à ${eur(x.matelas)}, il faudrait un découvert de ${eur(x.besoin)}, que la banque n'autorise pas.`,
          },
        ];
      },
    },
    {
      id: "financer-le-banc",
      objectifs: [1],
      type: "choix",
      titre: "Financer le banc lui-même",
      notions: ["loan_schedule", "receivables_financing"],
      question: (c) => {
        const x = equilibreDuChapitre(c);
        return `Le crédit couvre le creux ${dE(x.nom(x.k))}. Mais le banc servira ${qte(x.inv.dureeDAmortissementMois)} mois. Un associé propose de le financer chaque mois par du court terme, le moins cher du moment. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = equilibreDuChapitre(c);
        return [
          {
            texte: "Une ressource stable : un emprunt ou la réserve",
            juste: true,
            retour: `Oui. Un investissement est un emploi stable : il se finance par une ressource stable, un emprunt sur sa durée, un apport, ou la réserve placée (${eur(PLACEMENT.montant)} à ${pct(PLACEMENT.tauxAnnuel)}, moins chère que tout crédit, mais gardée pour la gamme). Le court terme finance les décalages de l'exploitation, pas les machines.`,
          },
          {
            texte: "D'accord : un crédit renouvelé chaque mois pendant toute sa durée",
            juste: false,
            retour: "Renouveler un crédit d'un mois pendant des années, c'est dépendre chaque mois de la banque, et payer des frais à chaque renouvellement. Le jour où elle refuse, il faut rembourser le banc d'un coup.",
          },
          {
            texte: "D'accord : le découvert, le moins cher sur un mois",
            juste: false,
            retour: `Le découvert est fait pour quelques jours, et autorisé jusqu'à ${eur(x.B.decouvert.autorise)}. Un banc de ${eur(x.inv.montantHt)} HT le dépasse de loin.`,
          },
        ];
      },
    },
    {
      id: "le-compte-de-resultat-previsionnel",
      objectifs: [2],
      type: "a-completer",
      titre: "Le compte de résultat prévisionnel",
      notions: ["income_statement", "depreciation"],
      question: (c) => {
        const x = equilibreDuChapitre(c);
        return `Le banc est acheté en ${x.nom(x.k)} et le creux couvert par le crédit. Tirez des budgets le compte de résultat prévisionnel du semestre, avant impôt (l'impôt se calcule sur l'exercice). Le banc s'amortit sur ${qte(x.inv.dureeDAmortissementMois)} mois dès ${x.nom(x.k)} ; les frais du crédit sont des services bancaires, ses intérêts des charges financières.`;
      },
      grille: grilleDuCompteDeResultat,
      explication: (c) => {
        const x = equilibreDuChapitre(c);
        return [
          `Le résultat d'exploitation, ${eur(x.cr.resultatDExploitation)}, est celui du tableau de bord moins les frais du crédit. Le budget de trésorerie n'y entre pas ligne à ligne : le banc n'est pas une charge, seule son usure l'est ; le capital remboursé de l'emprunt non plus.`,
          `Les intérêts du placement, ${eur(x.cr.produitsFinanciers)}, sont un produit du semestre, mais ils ne rentreront qu'à l'échéance : un produit n'est pas un encaissement.`,
        ];
      },
    },
    {
      id: "le-bilan-previsionnel",
      objectifs: [2],
      type: "a-completer",
      titre: "Le bilan prévisionnel",
      notions: ["balance_sheet", "bfr"],
      tableau: (c) => {
        const x = equilibreDuChapitre(c);
        const o = x.ouverture;
        return {
          titre: "Le bilan d'ouverture, après la création",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Ligne de montage", valeurs: [eur(o.actif.ligne)] },
            { libelle: "TVA de la ligne, à récupérer", valeurs: [eur(o.actif.tvaDeLaLigne)] },
            { libelle: "Placement", valeurs: [eur(o.actif.placement)] },
            { libelle: "Banque", valeurs: [eur(o.actif.banque)] },
            { libelle: "Capital", valeurs: [eur(o.passif.capital)] },
            { libelle: "Emprunt", valeurs: [eur(o.passif.emprunt)] },
          ],
        };
      },
      question: () =>
        "À vous, sans formule cette fois. Partez du bilan d'ouverture, et prenez dans les budgets ce qui reste dû au 30 juin, dans un sens et dans l'autre. Le budget de trésorerie ne suit pas la TVA de la ligne : gardez-la à sa valeur d'ouverture.",
      grille: grilleDuBilan,
      explication: (c) => {
        const x = equilibreDuChapitre(c);
        return [
          `Le bilan s'équilibre à ${eur(x.bilan.actif.total)} : chaque flux du budget a sa contrepartie, et le résultat relie les deux états.`,
          `Le BFR d'exploitation vaut ${eur(x.bilan.bfr)} : les créances clients, moins les dettes fournisseurs, fiscales et sociales. Il est négatif : à cette date, fournisseurs, État et caisses financent plus que ce que CampusTech doit.`,
        ];
      },
    },
    {
      id: "la-tva-de-la-ligne",
      objectifs: [2],
      type: "choix",
      titre: "Le contrôle de vraisemblance",
      notions: ["balance_sheet", "vat_payable"],
      question: (c) => {
        const x = equilibreDuChapitre(c);
        return `Le bilan prévisionnel garde au 30 juin ${eur(x.ouverture.actif.tvaDeLaLigne)} de TVA de la ligne à récupérer, comme au 1er janvier. Le contrôleur relit. Qu'en dit-il ?`;
      },
      options: (c) => {
        const x = equilibreDuChapitre(c);
        return [
          {
            texte: "Une anomalie : elle se récupère dès février",
            juste: true,
            retour: `Oui. La TVA de la ligne se déduit sur la déclaration de janvier : elle allège la TVA payée en février et en mars. Le budget l'a oubliée ; au 30 juin, ces ${eur(x.ouverture.actif.tvaDeLaLigne)} seront en banque, plus en créance. Le relevé de la banque le montrera.`,
          },
          {
            texte: "Rien : une créance sur l'État attend son remboursement, qui peut prendre des années",
            juste: false,
            retour: "Non : la TVA déductible ne se rembourse pas à part, elle s'impute sur la TVA collectée de la déclaration. Avec les ventes du semestre, elle passe en quelques mois.",
          },
          {
            texte: "Une erreur qui déséquilibre le bilan",
            juste: false,
            retour: "Non : le bilan s'équilibre. C'est le piège : un bilan équilibré peut être faux. Le contrôle de vraisemblance lit chaque poste, pas seulement les totaux.",
          },
        ];
      },
    },
    {
      id: "le-bfr-previsionnel",
      objectifs: [3],
      type: "montants",
      titre: "Un délai sur le BFR",
      notions: ["bfr", "payment_terms", "net_treasury"],
      question: (c) => {
        const x = equilibreDuChapitre(c);
        return `Sans formule : le BFR d'exploitation du 30 juin se lit sur le bilan prévisionnel. Puis supposez que CampusTech paie à l'échéance convenue, ${DELAI_CONVENU_DE_CAMPUSTECH} jours après sa facture, au lieu de ${x.ct.delai}. Calculez les créances clients du 30 juin à ce délai, le BFR, puis la trésorerie du 30 juin (le crédit d'avril n'est plus utile).`;
      },
      champs: (c) => {
        const x = equilibreDuChapitre(c);
        const b = x.bilan;
        const a = x.auConvenu;
        const creances = a.creancesClients;
        const dettes = auCentime(b.passif.dettesFournisseurs + b.passif.dettesFiscalesEtSociales);
        const dues = Math.round(creances / x.factureCampusTech);
        return [
          { libelle: "BFR d'exploitation au 30 juin", attendu: b.bfr, calcul: `${eur(b.actif.creancesClients)} − ${eur(b.passif.dettesFournisseurs)} − ${eur(b.passif.dettesFiscalesEtSociales)} = ${eur(b.bfr)}` },
          { libelle: `Créances clients à ${DELAI_CONVENU_DE_CAMPUSTECH} jours`, attendu: creances, calcul: `à ${DELAI_CONVENU_DE_CAMPUSTECH} jours, une facture du ${x.ct.jourDeFacturation} se paie ${x.decalageConvenu} mois plus tard : ${dues} factures restent dues, ${dues} × ${eur(x.factureCampusTech)} = ${eur(creances)}` },
          { libelle: `BFR à ${DELAI_CONVENU_DE_CAMPUSTECH} jours`, attendu: a.bfr, calcul: `${eur(creances)} − ${eur(dettes)} = ${eur(a.bfr)}` },
          {
            libelle: `Trésorerie au 30 juin à ${DELAI_CONVENU_DE_CAMPUSTECH} jours`,
            attendu: a.juin,
            calcul: `${eur(x.credit.tresorerieFin)} + ${eur(auCentime(b.actif.creancesClients - creances))} encaissés plus tôt + ${eur(x.credit.cout)} de crédit évité = ${eur(a.juin)}`,
          },
        ];
      },
      explication: (c) => {
        const x = equilibreDuChapitre(c);
        const gain = auCentime(x.bilan.bfr - x.auConvenu.bfr);
        return [
          `Le BFR baisse de ${eur(gain)}, et la trésorerie monte presque d'autant : c'est la même somme, vue des deux côtés du bilan. Faire respecter l'échéance convenue, par une relance ou une lettre de change domiciliée, finance le banc sans banque.`,
          "Les mêmes leviers jouent dans l'autre sens : un stock en plus, un client qui paie plus tard, un fournisseur payé plus tôt font monter le BFR et baisser la trésorerie, à résultat égal.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-financement",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du financement",
      notions: ["bfr", "receivables_financing", "cash_budget"],
      question: () =>
        "Le banc est décidé. Faites varier le délai de CampusTech, celui du fournisseur, le matelas et le financement : le tableau suit le coût du financement, le point bas, le BFR, la trésorerie du 30 juin et le résultat. Relevez le défi, puis comparez les deux financements selon le matelas.",
      leviers: (c) => {
        const x = equilibreDuChapitre(c);
        const L = LEVIERS_DU_LABORATOIRE;
        return [
          { code: "campustech", libelle: "Délai de paiement de CampusTech", unite: "jours", ...L.campustech, depart: x.p0.campustech },
          { code: "fournisseur", libelle: "Délai de paiement du fournisseur", unite: "jours", ...L.fournisseur, depart: x.p0.fournisseur },
          { code: "matelas", libelle: "Matelas à garder chaque fin de mois", unite: "€", ...L.matelas, depart: x.p0.matelas },
          {
            code: "financement",
            libelle: "Financement d'un mois sous le matelas",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: x.p0.financement,
            choix: FINANCEMENTS_DU_LABORATOIRE.map((y) => ({ valeur: y.valeur, libelle: y.libelle })),
          },
        ];
      },
      lecture: (c, p) => {
        const x = equilibreDuChapitre(c);
        const l = laboratoireDuFinancement(x.f, p);
        const d = laboratoireDuFinancement(x.f, x.p0);
        return [
          { libelle: "Coût du financement à court terme", montant: l.cout, reference: d.cout },
          { libelle: "BFR d'exploitation au 30 juin", montant: l.bfr, reference: d.bfr },
          { libelle: "Trésorerie au 30 juin", montant: l.juin, reference: d.juin },
          { libelle: "Résultat avant impôt du semestre", montant: l.resultat, reference: d.resultat },
          { libelle: "Trésorerie la plus basse du semestre", montant: l.plusBas.tresorerie, reference: d.plusBas.tresorerie, fort: true },
        ];
      },
      // Le coût de chaque financement selon le matelas : par marches, une tranche ou un effet de plus.
      graphique: (c) => {
        const x = equilibreDuChapitre(c);
        return {
          levier: "matelas",
          courbes: [
            { libelle: "Coût du crédit de trésorerie", valeur: (p) => coutDu(x.f, p, 0) },
            { libelle: "Coût de l'escompte", valeur: (p) => coutDu(x.f, p, 1) },
          ],
        };
      },
      defi: (c) => {
        const x = equilibreDuChapitre(c);
        return {
          consigne: `Achetez le banc en avril et gardez chaque fin de mois au moins ${eur(x.matelas)} en banque, sans aucun financement à court terme.`,
          atteint: (p) => x.sansFinancement(p),
          indice: (p) => {
            const l = laboratoireDuFinancement(x.f, p);
            if (p.matelas! < x.matelas) return `Le défi demande un matelas d'au moins ${eur(x.matelas)}.`;
            return `Le financement coûte encore ${eur(l.cout)}. Faites rentrer l'argent plus tôt, ou sortir plus tard.`;
          },
          solution: { ...x.p0, campustech: x.campusTechMax },
        };
      },
      explication: (c, p) => {
        const x = equilibreDuChapitre(c);
        const l = laboratoireDuFinancement(x.f, p);
        return [
          `Défi relevé : le point bas est ${l.plusBas.nom}, à ${eur(l.plusBas.tresorerie)}, sans un euro de frais financiers. Le BFR du 30 juin vaut ${eur(l.bfr)}.`,
          `CampusTech payée au plus ${qte(x.campusTechMax)} jours après sa facture fait rentrer une facture de plus avant la fin ${dE(x.nom(x.k))}. Le fournisseur payé un mois plus tard, dans le plafond légal de 60 jours, ferait de même.`,
          "Le graphique compare les deux financements : le crédit monte tranche par tranche, l'escompte effet par effet. Pour un petit besoin, le crédit l'emporte ; l'escompte avance toujours une facture entière.",
        ];
      },
    },
    {
      id: "le-suivi-du-plan",
      objectifs: [4],
      type: "montants",
      titre: "Le prévu face au réalisé",
      notions: ["cash_budget", "vat_payable", "loan_schedule"],
      tableau: tableauDuSuivi,
      question: (c) => {
        const x = equilibreDuChapitre(c);
        const n = x.nom(MOIS_DU_SUIVI);
        return `Le dirigeant a finalement remis le banc à plus tard : le plan retenu est le budget sans le banc. Fin ${dE(n)}, le relevé s'en écarte. Le budget versait le net avant impôt, la banque retient ${eur(x.suivi.prelevementALaSource)} de prélèvement à la source, versés le mois suivant. La TVA de la ligne, ${eur(x.suivi.tvaDeLaLigne)}, s'est déduite en janvier. L'échéance de l'emprunt du trimestre tombe le 3 avril. Calculez l'écart de fin de février, celui de fin ${dE(n)}, puis ce que chaque cause en explique.`;
      },
      champs: (c) => {
        const x = equilibreDuChapitre(c);
        const m = x.suivi.mois;
        const fev = m[1]!;
        const mars = m[MOIS_DU_SUIVI]!;
        const tva = auCentime(m.slice(0, MOIS_DU_SUIVI + 1).reduce((t, y) => t + y.causes.tvaDeLaLigne, 0));
        const echeance = auCentime(m.slice(0, MOIS_DU_SUIVI + 1).reduce((t, y) => t + y.causes.echeance, 0));
        return [
          { libelle: "Écart de fin de février, réalisé − prévu", attendu: fev.ecart, calcul: `${eur(fev.realise)} − ${eur(fev.prevu)} = ${eur(fev.ecart)}` },
          { libelle: `Écart de fin ${dE(mars.nom)}, réalisé − prévu`, attendu: mars.ecart, calcul: `${eur(mars.realise)} − ${eur(mars.prevu)} = ${eur(mars.ecart)}` },
          {
            libelle: `Part de la TVA de la ligne, fin ${dE(mars.nom)}`,
            attendu: tva,
            calcul: `la TVA payée en février et en mars baisse de ${m.slice(1, MOIS_DU_SUIVI + 1).map((y) => eur(y.causes.tvaDeLaLigne)).join(" + ")} = ${eur(tva)}, toute la TVA de la ligne`,
          },
          { libelle: `Part de l'échéance de l'emprunt, fin ${dE(mars.nom)}`, attendu: echeance, calcul: `l'échéance du ${x.s.mois[MOIS_DU_SUIVI]!.jours} ${mars.nom}, payée le 3 avril : ${eur(echeance)}` },
          {
            libelle: `Part du prélèvement à la source, fin ${dE(mars.nom)}`,
            attendu: auCentime(mars.ecart - tva - echeance),
            calcul: `${eur(mars.ecart)} − ${eur(tva)} − ${eur(echeance)} = ${eur(auCentime(mars.ecart - tva - echeance))} : chaque mois, le prélèvement du mois attend le 15 du suivant`,
          },
        ];
      },
      explication: (c) => {
        const x = equilibreDuChapitre(c);
        const a = x.suivi.mois[MOIS_DU_SUIVI + 1]!;
        return [
          `Un écart se lit avec son signe et sa cause. Ici, le réalisé dépasse le prévu, mais rien n'a été vendu en plus : ce sont des dates et un oubli. Fin ${dE(a.nom)}, l'échéance payée, l'écart retombe à ${eur(a.ecart)}.`,
        ];
      },
    },
    {
      id: "les-causes-des-ecarts",
      objectifs: [4],
      type: "choix",
      titre: "Ce qu'il faut corriger",
      notions: ["cash_budget"],
      tableau: tableauDuSuivi,
      question: (c) => {
        const x = equilibreDuChapitre(c);
        return `Fin ${dE(x.nom(MOIS_DU_SUIVI))}, le contrôleur recale le plan des mois suivants. Lequel des trois écarts l'y oblige ?`;
      },
      options: (c) => {
        const x = equilibreDuChapitre(c);
        return [
          {
            texte: "La TVA de la ligne, oubliée",
            juste: true,
            retour: `Oui. C'est une anomalie du budget : ${eur(x.suivi.tvaDeLaLigne)} de plus en banque, acquis pour tout le semestre. Le plan d'avril à juin doit partir du solde réel, pas du solde prévu.`,
          },
          {
            texte: `L'échéance de l'emprunt, ${eur(x.suivi.mois[MOIS_DU_SUIVI]!.causes.echeance)} de trop en mars`,
            juste: false,
            retour: "Non : c'est une question de date. L'échéance se paie le 3 avril : l'écart se résorbe tout seul le mois suivant.",
          },
          {
            texte: "Le prélèvement à la source, qui revient chaque mois",
            juste: false,
            retour: `Non : ${eur(x.suivi.prelevementALaSource)} restent un mois en banque, chaque mois. C'est un décalage constant et minime, qui ne change aucune décision.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["cash_budget", "income_statement", "balance_sheet", "bfr"],
      texte: (c) => {
        const x = equilibreDuChapitre(c);
        return [
          `Vous avez rééquilibré la trésorerie ${dE(x.f.entreprise)} : pour finir ${x.nom(x.k)} au matelas, le crédit de trésorerie coûte ${eur(x.credit.cout)}, l'escompte ${eur(x.escompte.cout)}, et le découvert, ${eur(x.decouvert.cout)}, ne garde pas le matelas. Le banc lui-même relève d'une ressource stable.`,
          `Vous avez tiré des budgets le compte de résultat prévisionnel, ${eur(x.cr.resultat)} avant impôt, et le bilan prévisionnel au 30 juin, ${eur(x.bilan.actif.total)}, et repéré ce que le budget avait oublié.`,
          `Vous avez mesuré qu'un délai client respecté baisse le BFR et paie le banc, puis suivi le plan retenu, écart par écart. Au niveau de l'examen, vous savez proposer un rééquilibrage chiffré, bâtir les états de synthèse prévisionnels et commenter un écart de trésorerie.`,
          "Dans l'arène, les chiffres de votre entreprise seront différents : la démarche, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût d'un financement = capital × taux × jours ÷ 360, plus ses frais. Un emploi stable se finance par une ressource stable. BFR d'exploitation = stocks + créances clients − dettes fournisseurs − dettes fiscales et sociales. Écart = réalisé − prévu, avec sa cause.",
    },
  ],
};
