import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { budgetDeTresorerie, investissementDeLaFiche, leviersDeBase, moisDeDecalage, tableauDeBord, type LeviersDuSemestre } from "../monde/couts-et-budgets";
import { DELAI_MAXIMAL_CONVENU } from "../monde/delais-et-tva";
import { GESTION_DU_COURS, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE BUDGET DE TRÉSORERIE (contrôle de gestion, palier 4 ; BTS CG, DCG UE11, BUT GEA et
 * GACO).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : NOVA a une
 * fiche de gestion figée (monde/nova-gestion.ts) et le budget se calcule par le modèle du cours
 * (monde/couts-et-budgets.ts, `budgetDeTresorerie`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : le budget de trésorerie mensuel de NOVA, de janvier à juin, toutes taxes comprises, au
 * sens du BTS CG et du DCG. Le budget des encaissements, clientèle par clientèle (les particuliers
 * paient à la commande, CampusTech à 60 jours, le délai convenu, qu'elle tient) ; le budget des
 * décaissements (le fournisseur à
 * 22 jours, les autres coûts variables, le loyer, la paie, les cotisations du mois précédent, la TVA
 * à décaisser du mois précédent, l'échéance de l'emprunt) ; la trésorerie de fin de mois. Puis ce
 * que le budget fait décider : jusqu'où le budget supporterait que CampusTech paie tard (une
 * hypothèse : au-delà de 60 jours, c'est un retard que la loi ne permet pas de convenir), et comment
 * financer en février un banc de mesure de 30 000 € HT sans découvert.
 *
 * Le piège central : un délai ou une TVA ne coûtent rien au résultat, mais ils déplacent l'argent
 * dans le temps. La TVA du banc revient en mars ; le découvert, lui, tombe en février.
 *
 * CAMPUSTECH À 60 JOURS (décision du propriétaire, octobre 2026) : le banc passe d'avril à février
 * (nova-gestion.ts), et le mois guidé avec lui. En février, CampusTech ne paie encore rien (sa facture
 * de janvier rentre en mars) : l'étape des encaissements le fait trouver. Le point bas est février,
 * où se paient d'un coup les dettes de janvier ; mars, le mois autonome, voit rentrer la première
 * facture de CampusTech et tomber l'échéance de l'emprunt.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, le-mois-de-l-echeance, les-encaissements-du-mois, la-tva-a-decaisser,
 *     les-decaissements-du-mois (la formule est au repère ou dans la question, qui nomme les
 *     chiffres) ;
 *   · autonome : mars-sans-aide, le-point-bas (ni formule ni chiffres donnés : l'élève les prend dans
 *     le tableau de l'introduction ; le calcul de la correction montre le chemin) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-delai
 *     puis le-delai-au-curseur (le décalage de paiement de CampusTech, la trésorerie du 30 juin face
 *     au découvert) avant le-delai-a-rebours ; predire-le-banc puis les-ventes-au-curseur (les ventes
 *     de février aux particuliers, banc acheté) avant le-minimum-a-rebours ;
 *   · le laboratoire : le-laboratoire-de-tresorerie (délai de CampusTech, délai du fournisseur,
 *     hausse des ventes, mois de l'achat : financer le banc sans découvert), avec un graphique de la
 *     trésorerie selon le délai de CampusTech, qui va par marches ;
 *   · expert : le-delai-a-rebours (le délai le plus long, à rebours), le-minimum-a-rebours (le
 *     minimum de ventes, à rebours, et ce qu'il fait sortir le mois suivant), la-tva-du-banc (la TVA
 *     à décaisser avec un investissement), la-tva-de-campustech (la TVA due à la livraison, pas à
 *     l'encaissement) ; puis que-faire-du-decouvert et la synthèse.
 */

/** Le mois que le chapitre bâtit pas à pas : février, le mois du banc (celui de la fiche). */
export const moisGuide = (f: FicheDeGestion) => f.semestre.investissement.mois;

/** Le mois que l'élève refait seul : mars, la fin du premier trimestre, où tombe l'échéance de l'emprunt. */
export const MOIS_AUTONOME = 2;

/**
 * Le délai que le pari suppose : 160 jours au lieu des 60 convenus. Une hypothèse d'école, bien
 * au-delà du plafond légal (DELAI_MAXIMAL_CONVENU) : les textes le rappellent.
 */
export const DELAI_DU_PARI = 160;

/** Les bornes du curseur du décalage de CampusTech, en mois entre la facture et le paiement. */
export const DECALAGE_DU_CURSEUR = { min: 0, max: 6 } as const;

/**
 * Les bornes du curseur des ventes de février aux particuliers, en enceintes : 1 130 au budget, et le
 * minimum qui évite le découvert du banc dedans (elles allaient de 1 500 à 1 700 quand le banc tombait
 * en avril).
 */
export const VENTES_DU_CURSEUR = { min: 1_100, max: 1_300 } as const;

/** Les leviers du laboratoire : bornes et pas des délais (en jours) et de la hausse des ventes (en %). */
export const LEVIERS_DU_LABORATOIRE = {
  campustech: { min: 0, max: 180, pas: 10 },
  fournisseur: { min: 0, max: 90, pas: 1 },
  hausse: { min: -10, max: 20, pas: 1 },
} as const;

/** Le budget de trésorerie se calcule sur la fiche de gestion du cours : celle de NOVA. */
export const ENTREPRISES_DU_BUDGET: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** « d'avril », « de février » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const enBanque = (t: number) => (t >= 0 ? `${eur(t)} en banque` : `un découvert de ${eur(-t)}`);

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

/** La fiche où les particuliers achètent `quantite` enceintes le mois guidé (février) : seul ce mois change. */
export function ficheAvecLesVentesDuMoisGuide(f: FicheDeGestion, quantite: number): FicheDeGestion {
  const k = moisGuide(f);
  return {
    ...f,
    semestre: {
      ...f.semestre,
      clienteles: f.semestre.clienteles.map((c) => (c.code === "particuliers" ? { ...c, quantites: c.quantites.map((q, i) => (i === k ? quantite : q)) } : c)),
    },
  };
}

/**
 * Le délai le plus long, en jours, qu'une facture du jour `jour` peut avoir pour se payer `decalage`
 * mois plus tard, en mois commerciaux : le jour j + d doit tomber au plus le dernier jour de ce mois.
 */
export const delaiLePlusLong = (jour: number, decalage: number, joursDuMois: number) => joursDuMois * (decalage + 1) - jour;

/** Le budget avec un décalage de paiement de CampusTech de `m` mois (au délai le plus long qui le donne). */
export function budgetAuDecalage(f: FicheDeGestion, m: number, leviers: Partial<LeviersDuSemestre> = {}) {
  const ct = f.semestre.clienteles.find((x) => x.code === "campustech")!;
  return budgetDeTresorerie(f, { ...leviers, delais: { ...leviersDeBase(f).delais, campustech: delaiLePlusLong(ct.jourDeFacturation, m, f.semestre.joursDuMoisCommercial) } });
}

/** Une position du laboratoire, lue en leviers du modèle. */
function leviersDuLaboratoire(f: FicheDeGestion, p: Readonly<Record<string, number>>): Partial<LeviersDuSemestre> {
  return {
    delais: { ...leviersDeBase(f).delais, campustech: p.campustech! },
    delaiFournisseur: p.fournisseur!,
    hausseDesVentes: p.hausse! / 100,
    investissement: { mois: p.achat!, montantHt: f.semestre.investissement.montantHt },
  };
}

/** Le budget et le résultat d'une position du laboratoire. */
export function laboratoireDeTresorerie(f: FicheDeGestion, p: Readonly<Record<string, number>>) {
  const l = leviersDuLaboratoire(f, p);
  const b = budgetDeTresorerie(f, l);
  const k = moisGuide(f);
  return {
    duMois: b.mois[k]!.tresorerieFin,
    moisSuivant: b.mois[k + 1]!.tresorerieFin,
    juin: b.tresorerieFin,
    plusBas: b.plusBas,
    creancesClients: b.fin.creancesClients,
    dettesFournisseurs: b.fin.dettesFournisseurs,
    resultat: tableauDeBord(f, l).semestre.resultat,
  };
}

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois par entreprise (la fiche est figée). */
export function budgetDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre(c);
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = f.semestre;
  const tva = s.tauxDeTva;
  const m = f.moisDeReference;
  const prixTtc = auCentime(m.prix * (1 + tva));
  const composantsTtc = auCentime(m.coutVariable.composants * (1 + tva));
  const autresTtc = auCentime(m.coutVariable.autres * (1 + tva));
  const tvaParEnceinte = auCentime((m.prix - m.coutVariable.composants - m.coutVariable.autres) * tva);
  const ct = s.clienteles.find((x) => x.code === "campustech")!;
  const part = s.clienteles.find((x) => x.code === "particuliers")!;
  const base = budgetDeTresorerie(f);
  const inv = investissementDeLaFiche(f);
  const avecLeBanc = budgetDeTresorerie(f, { investissement: inv });
  const k = moisGuide(f);
  const duMois = base.mois[k]!;
  const moisDAvant = base.mois[k - 1]!;
  const a = base.mois[MOIS_AUTONOME]!;
  const decalage = moisDeDecalage(ct.jourDeFacturation, ct.delai, s.joursDuMoisCommercial);
  const factureCampusTech = auCentime(ct.quantites[0]! * prixTtc);
  const factureDuMois = auCentime(ct.quantites[moisGuide(f)]! * prixTtc);
  const resultats = tableauDeBord(f).mois.map((x) => x.resultat);

  // Le curseur du décalage : le plus long qui laisse le 30 juin sans découvert.
  const decalages = Array.from({ length: DECALAGE_DU_CURSEUR.max - DECALAGE_DU_CURSEUR.min + 1 }, (_, i) => DECALAGE_DU_CURSEUR.min + i);
  const decalageMax = Math.max(...decalages.filter((d) => budgetAuDecalage(f, d).tresorerieFin >= 0));
  const auMax = budgetAuDecalage(f, decalageMax);
  const delaiMax = delaiLePlusLong(ct.jourDeFacturation, decalageMax, s.joursDuMoisCommercial);
  const auPari = budgetDeTresorerie(f, { delais: { ...leviersDeBase(f).delais, campustech: DELAI_DU_PARI } });

  // Le minimum de ventes du mois guidé, banc acheté : ce qu'une enceinte de plus laisse en banque à la fin du mois.
  const netParEnceinte = auCentime(prixTtc - autresTtc);
  const manque = -avecLeBanc.mois[k]!.tresorerieFin;
  const enPlus = Math.ceil(manque / netParEnceinte - 1e-9);
  const ventesMinimales = part.quantites[k]! + enPlus;
  const sortiesDuMoisSuivant = auCentime(enPlus * (composantsTtc + tvaParEnceinte));

  // Le laboratoire : ce que chaque levier seul doit valoir pour passer le banc.
  const depart = { campustech: ct.delai, fournisseur: s.fournisseur.delai, hausse: 0, achat: inv.mois };
  const L = LEVIERS_DU_LABORATOIRE;
  const grille = (b: { min: number; max: number; pas: number }) => Array.from({ length: Math.round((b.max - b.min) / b.pas) + 1 }, (_, i) => b.min + i * b.pas);
  const passe = (p: Record<string, number>) => budgetDeTresorerie(f, leviersDuLaboratoire(f, p)).plusBas.tresorerie >= 0;
  const campusTechMax = Math.max(...grille(L.campustech).filter((d) => passe({ ...depart, campustech: d })));
  const fournisseurMin = Math.min(...grille(L.fournisseur).filter((d) => passe({ ...depart, fournisseur: d })));
  const hausseMin = Math.min(...grille(L.hausse).filter((h) => passe({ ...depart, hausse: h })));

  // La TVA du banc : la déclaration du mois guidé, payée le mois suivant.
  const tvaDuMoisGuide = avecLeBanc.mois[k]!.tva;
  return {
    f,
    s,
    tva,
    m,
    prixTtc,
    composantsTtc,
    autresTtc,
    tvaParEnceinte,
    ct,
    part,
    base,
    avecLeBanc,
    inv,
    invTtc: auCentime(inv.montantHt * (1 + tva)),
    k,
    duMois,
    moisDAvant,
    a,
    decalage,
    factureCampusTech,
    factureDuMois,
    resultats,
    decalageMax,
    auMax,
    delaiMax,
    auPari,
    netParEnceinte,
    manque,
    enPlus,
    ventesMinimales,
    sortiesDuMoisSuivant,
    depart,
    campusTechMax,
    fournisseurMin,
    hausseMin,
    tvaDuMoisGuide,
    nom: (i: number) => s.mois[i]!.nom,
  };
}

export type BudgetDuChapitre = ReturnType<typeof budgetDuChapitre>;

/** Les données du semestre : ce que l'élève a sous les yeux pour bâtir le budget. */
export function tableauDesDonnees(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = budgetDuChapitre(c);
  const s = x.s;
  const k = (i: number, v: string) => (s.emprunt.moisDesEcheances.includes(i) ? v : "");
  return {
    titre: `Les données du semestre ${dE(x.f.entreprise)}`,
    colonnes: s.mois.map((m) => majuscule(m.nom)),
    lignes: [
      { libelle: "Enceintes vendues aux particuliers, payées à la commande", valeurs: x.part.quantites.map(qte) },
      { libelle: `Enceintes vendues à CampusTech, facturées le ${x.ct.jourDeFacturation}, payées à ${x.ct.delai} jours`, valeurs: x.ct.quantites.map(qte) },
      { libelle: "Loyer, sans TVA", valeurs: s.mois.map(() => eur(x.m.chargesFixes.loyer)) },
      { libelle: "Salaires nets, payés dans le mois", valeurs: s.mois.map(() => eur(s.paie.net)) },
      { libelle: "Cotisations sociales du mois, payées le mois suivant", valeurs: s.mois.map(() => eur(s.paie.cotisations)) },
      { libelle: "Capital de l'emprunt remboursé", valeurs: s.mois.map((_, i) => k(i, eur(s.emprunt.capitalParEcheance))) },
    ],
  };
}

/** Le budget de trésorerie du semestre, mois par mois : le document que le chapitre bâtit. */
export function tableauDuBudget(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = budgetDuChapitre(c);
  const b = x.base.mois;
  const ligne = (libelle: string, v: (m: (typeof b)[number]) => number) => ({ libelle, valeurs: b.map((m) => eur(v(m))) });
  return {
    titre: `Le budget de trésorerie ${dE(x.f.entreprise)}, toutes taxes comprises`,
    colonnes: x.s.mois.map((m) => majuscule(m.nom)),
    lignes: [
      ligne("Trésorerie de début de mois", (m) => m.tresorerieDebut),
      ligne("Encaissements des particuliers", (m) => m.encaissements.particuliers),
      ligne("Encaissements de CampusTech", (m) => m.encaissements.campustech),
      ligne("Total des encaissements", (m) => m.encaissements.total),
      ligne(`Fournisseur, ${x.s.fournisseur.nom}`, (m) => m.decaissements.fournisseur),
      ligne("Autres coûts variables", (m) => m.decaissements.autresCoutsVariables),
      ligne("Loyer", (m) => m.decaissements.loyer),
      ligne("Salaires nets", (m) => m.decaissements.salairesNets),
      ligne("Cotisations sociales", (m) => m.decaissements.cotisations),
      ligne("TVA à décaisser", (m) => m.decaissements.tva),
      ligne("Échéance de l'emprunt", (m) => m.decaissements.emprunt),
      ligne("Total des décaissements", (m) => m.decaissements.total),
      ligne("Trésorerie de fin de mois", (m) => m.tresorerieFin),
    ],
  };
}

export const BUDGET_DE_TRESORERIE: Chapitre = {
  code: "budget-de-tresorerie",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GACO · Participer au pilotage interne de l'organisation",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
    "BTS MHR Bloc 4 · Pilotage de la production de services en hôtellerie restauration",
  ],
  titre: "Le budget de trésorerie",
  accroche:
    "Bâtir mois par mois le budget de trésorerie de NOVA, toutes taxes comprises : ce que chaque clientèle paiera et quand, ce qui sortira, la TVA à décaisser le mois suivant. Puis s'en servir : jusqu'où le budget supporterait qu'un client paie tard, et comment financer un banc de 30 000 € en février sans découvert.",
  objectifs: [
    "Dater un encaissement ou un décaissement à partir d'une date de facture et d'un délai",
    "Bâtir le budget des encaissements, clientèle par clientèle, et celui des décaissements, toutes taxes comprises",
    "Calculer la TVA à décaisser du mois, payée le mois suivant, avec un investissement",
    "Calculer la trésorerie de fin de mois et repérer le point bas du semestre",
    "Retrouver à rebours un délai de paiement ou un minimum de ventes qui évite le découvert",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_BUDGET,
    pourquoi: "le budget de trésorerie se bâtit ici sur le semestre de NOVA dans la simulation du cours, avec ses clientèles, ses délais et sa TVA ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Prévoir l'argent, mois par mois",
      notions: ["cash_budget", "payment_terms"],
      tableau: tableauDesDonnees,
      texte: (c) => {
        const x = budgetDuChapitre(c);
        const s = x.s;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}, de janvier à juin. ${x.f.entreprise} vend une enceinte, ${eur(x.m.prix)} HT, à ses clientèles : les particuliers, en ligne, qui paient à la commande, et CampusTech, un client professionnel, facturé le ${x.ct.jourDeFacturation} de chaque mois et payé à ${x.ct.delai} jours.`,
          `Le dirigeant veut savoir s'il manquera d'argent. Le compte de résultat ne le dit pas : une vente n'est pas un encaissement, un achat n'est pas un paiement. Le budget de trésorerie suit l'argent lui-même, à la date où il entre et où il sort, et toutes taxes comprises, puisque c'est la somme TTC qui passe en banque. La TVA est de ${pct(x.tva)}.`,
          `Une enceinte demande ${eur(x.m.coutVariable.composants)} HT de composants, achetés chez ${s.fournisseur.nom}, facturés le ${s.fournisseur.jourDeFacturation} et payés à ${s.fournisseur.delai} jours, et ${eur(x.m.coutVariable.autres)} HT d'autres coûts variables (${x.m.autresCoutsVariables}), payés dans le mois. La TVA du mois (collectée sur les ventes, moins celle des achats, déductible) se déclare et se paie le mois suivant. L'emprunt de ${eur(s.emprunt.capitalRestantDu)} à ${pct(s.emprunt.tauxAnnuel)} l'an se rembourse le dernier mois de chaque trimestre : le capital du tableau, plus les intérêts du trimestre.`,
          `La simulation suppose que ${x.f.entreprise} n'a pas de stock : elle achète ses composants le mois où elle les consomme. Un délai se compte en mois de ${s.joursDuMoisCommercial} jours. Le budget part de ${eur(s.tresorerieDeDepart)} en banque au 1er janvier, sans créance ni dette, et les ventes ne répondent pas au prix. Une trésorerie négative est un découvert.`,
        ];
      },
      repere: (c) => {
        const x = budgetDuChapitre(c);
        return `Trésorerie de fin de mois = trésorerie de début + encaissements − décaissements. Un montant TTC = montant HT × ${qte(1 + x.tva)}. Une facture du jour j, payée à d jours, se paie le mois où tombe le jour j + d, en mois de ${x.s.joursDuMoisCommercial} jours.`;
      },
    },
    {
      id: "le-mois-de-l-echeance",
      type: "choix",
      titre: "Le mois de l'échéance",
      notions: ["payment_terms", "cash_budget"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        return `CampusTech reçoit sa facture de janvier le ${x.ct.jourDeFacturation} janvier, et la paie à ${x.ct.delai} jours. En comptant des mois de ${x.s.joursDuMoisCommercial} jours, en quel mois ${x.f.entreprise} l'encaisse-t-elle ?`;
      },
      options: (c) => {
        const x = budgetDuChapitre(c);
        const jour = x.ct.jourDeFacturation + x.ct.delai;
        const sansLeJour = Math.ceil(x.ct.delai / x.s.joursDuMoisCommercial - 1e-9) - 1;
        return [
          {
            texte: `En ${x.nom(x.decalage)}`,
            juste: true,
            retour: `Oui : ${x.ct.jourDeFacturation} + ${x.ct.delai} = ${jour}, le ${jour}e jour depuis le début de janvier, qui tombe dans le ${x.decalage + 1}e mois en comptant janvier : ${x.nom(x.decalage)}. La facture de janvier rentre en ${x.nom(x.decalage)}, celle de février le mois suivant, et ainsi de suite.`,
          },
          {
            texte: `En ${x.nom(sansLeJour)}`,
            juste: false,
            retour: `Non : ${x.ct.delai} jours, comptés depuis le 1er janvier, finiraient en ${x.nom(sansLeJour)} ; mais ils partent du ${x.ct.jourDeFacturation}. Le ${jour}e jour tombe en ${x.nom(x.decalage)}.`,
          },
          {
            texte: "En janvier",
            juste: false,
            retour: `Non : c'est le mois de la vente, pas celui du paiement. Le chiffre d'affaires est de janvier ; l'argent, lui, n'arrive qu'en ${x.nom(x.decalage)}.`,
          },
        ];
      },
    },
    {
      id: "les-encaissements-du-mois",
      type: "montants",
      titre: "Le budget des encaissements",
      notions: ["cash_budget", "payment_terms"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return `En ${n}, ${x.f.entreprise} vend ${qte(x.part.quantites[x.k]!)} enceintes aux particuliers, à ${eur(x.m.prix)} HT, payées à la commande, et ${qte(x.ct.quantites[x.k]!)} à CampusTech, payées à ${x.ct.delai} jours. Calculez, TVA de ${pct(x.tva)} comprise, les ventes ${dE(n)} aux particuliers, la facture ${dE(n)} de CampusTech, puis le total des encaissements ${dE(n)}.`;
      },
      champs: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return [
          {
            libelle: `Ventes TTC ${dE(n)} aux particuliers`,
            attendu: x.duMois.encaissements.particuliers,
            calcul: `${qte(x.part.quantites[x.k]!)} × ${eur(x.m.prix)} × ${qte(1 + x.tva)} = ${eur(x.duMois.encaissements.particuliers)}`,
          },
          {
            libelle: `Facture TTC ${dE(n)} de CampusTech`,
            attendu: x.factureDuMois,
            calcul: `${qte(x.ct.quantites[x.k]!)} × ${eur(x.m.prix)} × ${qte(1 + x.tva)} = ${eur(x.factureDuMois)}, encaissée en ${x.nom(x.k + x.decalage)}`,
          },
          {
            libelle: `Encaissements ${dE(n)}`,
            attendu: x.duMois.encaissements.total,
            calcul:
              x.k < x.decalage
                ? `${eur(x.duMois.encaissements.particuliers)} des particuliers ; CampusTech ne paie rien en ${n}, sa facture de janvier rentre en ${x.nom(x.decalage)} : ${eur(x.duMois.encaissements.total)}`
                : `${eur(x.duMois.encaissements.particuliers)} + ${eur(x.duMois.encaissements.campustech)} de la facture ${dE(x.nom(x.k - x.decalage))} de CampusTech = ${eur(x.duMois.encaissements.total)}`,
          },
        ];
      },
      explication: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return [
          `En ${n}, ${x.f.entreprise} encaisse les ventes ${dE(n)} aux particuliers, ${
            x.k < x.decalage
              ? `mais rien de CampusTech : à ${x.ct.delai} jours, sa facture de janvier rentre en ${x.nom(x.decalage)}, celle ${dE(n)} en ${x.nom(x.k + x.decalage)}`
              : `mais la facture ${dE(x.nom(x.k - x.decalage))} de CampusTech`
          }. Les ventes à CampusTech ${dE(x.nom(x.s.mois.length - x.decalage))} à juin ne rentreront qu'après le 30 juin : elles restent en créances clients, ${eur(x.base.fin.creancesClients)} TTC.`,
          `C'est la formule du budget des encaissements : encaissements = créances du début + ventes TTC − créances de fin. Sur le semestre, ${eur(0)} + ${eur(x.base.totaux.ventesTtc)} − ${eur(x.base.fin.creancesClients)} = ${eur(x.base.totaux.encaissements)}.`,
        ];
      },
    },
    {
      id: "la-tva-a-decaisser",
      type: "montants",
      titre: "La TVA à décaisser",
      notions: ["vat_payable", "cash_budget"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        const p = x.nom(x.k - 1);
        return `La TVA ${dE(p)} se déclare et se paie en ${x.nom(x.k)}. En ${p}, ${x.f.entreprise} vend ${qte(x.moisDAvant.quantite)} enceintes à ${eur(x.m.prix)} HT, à toutes ses clientèles ; elle déduit la TVA de ses achats, ${eur(x.m.coutVariable.composants)} de composants et ${eur(x.m.coutVariable.autres)} d'autres coûts variables HT par enceinte. Calculez la TVA collectée ${dE(p)}, la TVA déductible ${dE(p)}, puis la TVA à décaisser en ${x.nom(x.k)} (collectée moins déductible).`;
      },
      champs: (c) => {
        const x = budgetDuChapitre(c);
        const p = x.nom(x.k - 1);
        const t = x.moisDAvant.tva;
        return [
          { libelle: `TVA collectée ${dE(p)}`, attendu: t.collectee, calcul: `${qte(x.moisDAvant.quantite)} × ${eur(x.m.prix)} × ${pct(x.tva)} = ${eur(t.collectee)}` },
          {
            libelle: `TVA déductible ${dE(p)}`,
            attendu: t.deductible,
            calcul: `${qte(x.moisDAvant.quantite)} × (${eur(x.m.coutVariable.composants)} + ${eur(x.m.coutVariable.autres)}) × ${pct(x.tva)} = ${eur(t.deductible)}`,
          },
          { libelle: `TVA à décaisser en ${x.nom(x.k)}`, attendu: t.solde, calcul: `${eur(t.collectee)} − ${eur(t.deductible)} = ${eur(t.solde)}` },
        ];
      },
      explication: (c) => {
        const x = budgetDuChapitre(c);
        const p = x.nom(x.k - 1);
        return [
          `La TVA ne coûte rien à ${x.f.entreprise} : elle la collecte pour l'État et déduit celle qu'elle paie. Mais elle passe en banque, et à contretemps : celle ${dE(p)} sort en ${x.nom(x.k)}, ${eur(x.moisDAvant.tva.solde)}. Le loyer n'y entre pas : le bailleur n'a pas opté pour la TVA, il n'y en a aucune à déduire.`,
        ];
      },
    },
    {
      id: "les-decaissements-du-mois",
      type: "montants",
      titre: "Le budget des décaissements",
      notions: ["cash_budget", "payment_terms"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        const p = x.nom(x.k - 1);
        const d = x.duMois.decaissements;
        return `En ${n}, ${x.f.entreprise} paie les composants ${dE(p)} (${qte(x.moisDAvant.quantite)} enceintes à ${eur(x.m.coutVariable.composants)} HT, payés à ${x.s.fournisseur.delai} jours, TTC), les autres coûts variables ${dE(n)} (${qte(x.duMois.quantite)} enceintes à ${eur(x.m.coutVariable.autres)} HT, TTC), le loyer (${eur(d.loyer)}), les salaires nets (${eur(d.salairesNets)}), les cotisations ${dE(p)} (${eur(d.cotisations)}) et la TVA ${dE(p)} (${eur(d.tva)}). Calculez le paiement au fournisseur, les autres coûts variables TTC, le total des décaissements ${dE(n)}, puis la trésorerie de fin ${dE(n)} (au début du mois : ${eur(x.duMois.tresorerieDebut)}).`;
      },
      champs: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        const d = x.duMois.decaissements;
        return [
          { libelle: `Paiement au fournisseur en ${n}`, attendu: d.fournisseur, calcul: `${qte(x.moisDAvant.quantite)} × ${eur(x.m.coutVariable.composants)} × ${qte(1 + x.tva)} = ${eur(d.fournisseur)}` },
          { libelle: `Autres coûts variables TTC ${dE(n)}`, attendu: d.autresCoutsVariables, calcul: `${qte(x.duMois.quantite)} × ${eur(x.m.coutVariable.autres)} × ${qte(1 + x.tva)} = ${eur(d.autresCoutsVariables)}` },
          {
            libelle: `Décaissements ${dE(n)}`,
            attendu: d.total,
            calcul: `${[d.fournisseur, d.autresCoutsVariables, d.loyer, d.salairesNets, d.cotisations, d.tva].map(eur).join(" + ")} = ${eur(d.total)}`,
          },
          {
            libelle: `Trésorerie de fin ${dE(n)}`,
            attendu: x.duMois.tresorerieFin,
            calcul: `${eur(x.duMois.tresorerieDebut)} + ${eur(x.duMois.encaissements.total)} − ${eur(d.total)} = ${eur(x.duMois.tresorerieFin)}`,
          },
        ];
      },
      explication: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return [
          `${majuscule(n)} finit avec ${enBanque(x.duMois.tresorerieFin)}. Le délai du fournisseur joue dans l'autre sens que celui de CampusTech : il laisse l'argent dans l'entreprise un mois de plus. Ce que ${x.f.entreprise} doit encore au 30 juin, les composants de juin, ${eur(x.base.fin.dettesFournisseurs)}, la TVA de juin, ${eur(x.base.fin.tvaDue)}, et les cotisations de juin, ${eur(x.base.fin.cotisationsDues)}, se paiera en juillet.`,
        ];
      },
    },
    {
      id: "mars-sans-aide",
      type: "montants",
      titre: "Le mois de mars, sans aide",
      notions: ["cash_budget", "loan_schedule", "vat_payable"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(MOIS_AUTONOME);
        return `À vous, sans formule ni chiffres donnés cette fois : prenez dans le tableau des données ce que demande le mois ${dE(n)}. C'est la fin du premier trimestre : l'échéance de l'emprunt tombe, avec les intérêts du trimestre. Calculez les encaissements ${dE(n)}, le paiement au fournisseur, la TVA payée, l'échéance de l'emprunt, puis la trésorerie de fin ${dE(n)} (fin ${dE(x.nom(MOIS_AUTONOME - 1))} : ${eur(x.a.tresorerieDebut)}).`;
      },
      champs: (c) => {
        const x = budgetDuChapitre(c);
        const a = x.a;
        const p = x.base.mois[MOIS_AUTONOME - 1]!;
        const e = x.s.emprunt;
        const d = a.decaissements;
        return [
          {
            libelle: `Encaissements ${dE(a.nom)}`,
            attendu: a.encaissements.total,
            calcul:
              a.encaissements.campustech > 0
                ? `${qte(x.part.quantites[MOIS_AUTONOME]!)} × ${eur(x.prixTtc)} = ${eur(a.encaissements.particuliers)} ; CampusTech paie sa facture ${dE(x.nom(MOIS_AUTONOME - x.decalage))}, ${qte(x.ct.quantites[MOIS_AUTONOME - x.decalage]!)} × ${eur(x.prixTtc)} = ${eur(a.encaissements.campustech)} ; en tout ${eur(a.encaissements.total)}`
                : `${qte(x.part.quantites[MOIS_AUTONOME]!)} × ${eur(x.prixTtc)} = ${eur(a.encaissements.particuliers)} ; CampusTech ne paie encore rien : ${eur(a.encaissements.campustech)}`,
          },
          { libelle: `Paiement au fournisseur en ${a.nom}`, attendu: d.fournisseur, calcul: `les composants ${dE(p.nom)} : ${qte(p.quantite)} × ${eur(x.composantsTtc)} = ${eur(d.fournisseur)}` },
          { libelle: `TVA payée en ${a.nom}`, attendu: d.tva, calcul: `la TVA ${dE(p.nom)} : ${qte(p.quantite)} × (${eur(x.m.prix)} − ${eur(x.m.coutVariable.composants + x.m.coutVariable.autres)}) × ${pct(x.tva)} = ${eur(d.tva)}` },
          {
            libelle: "Échéance de l'emprunt",
            attendu: d.emprunt,
            calcul: `${eur(a.emprunt.capital)} de capital + ${eur(e.capitalRestantDu)} × ${pct(e.tauxAnnuel)} × 3 ÷ 12 d'intérêts = ${eur(d.emprunt)}`,
          },
          {
            libelle: `Trésorerie de fin ${dE(a.nom)}`,
            attendu: a.tresorerieFin,
            calcul: `${eur(a.tresorerieDebut)} + ${eur(a.encaissements.total)} − (${[d.fournisseur, d.autresCoutsVariables, d.loyer, d.salairesNets, d.cotisations, d.tva, d.emprunt].map(eur).join(" + ")}) = ${eur(a.tresorerieFin)}`,
          },
        ];
      },
      explication: (c) => {
        const x = budgetDuChapitre(c);
        return [
          `Le remboursement du capital, ${eur(x.a.emprunt.capital)}, sort de la trésorerie sans être une charge : il ne paraît pas au compte de résultat, mais il manque bien en banque. Les intérêts, ${eur(x.a.emprunt.interets)}, sont une charge financière, et une sortie.`,
        ];
      },
    },
    {
      id: "le-point-bas",
      type: "choix",
      titre: "Le point bas du semestre",
      notions: ["cash_budget", "bfr"],
      tableau: tableauDuBudget,
      question: (c) => {
        const x = budgetDuChapitre(c);
        const bas = x.base.plusBas;
        const i = x.s.mois.findIndex((m) => m.nom === bas.nom);
        const m = x.base.mois[i]!;
        const r = x.resultats[i]!;
        return `Voici le budget de trésorerie du semestre. Son point bas est ${bas.nom}, ${eur(bas.tresorerie)}. Ce mois-là, ${x.f.entreprise} ${r < 0 ? `perd ${eur(-r)}` : `gagne ${eur(r)}`}, mais sa trésorerie baisse de ${eur(auCentime(m.tresorerieDebut - m.tresorerieFin))}. Qu'est-ce qui creuse la trésorerie ${dE(bas.nom)} ?`;
      },
      options: (c) => {
        const x = budgetDuChapitre(c);
        const bas = x.base.plusBas;
        const i = x.s.mois.findIndex((m) => m.nom === bas.nom);
        const m = x.base.mois[i]!;
        const d = m.decaissements;
        const r = x.resultats[i]!;
        const p = x.nom(i - 1);
        const echeance = x.s.emprunt.moisDesEcheances.find((e) => e >= i)!;
        return [
          {
            texte: `Les dettes ${dE(p)} qui se paient, et CampusTech qui ne paie rien`,
            juste: m.encaissements.campustech === 0 && d.fournisseur > 0,
            retour: `Oui. En ${bas.nom}, ${x.f.entreprise} paie ce que ${p} a laissé : les composants (${eur(d.fournisseur)}), la TVA (${eur(d.tva)}) et les cotisations (${eur(d.cotisations)}), alors que CampusTech n'a encore rien payé. Dès ${x.nom(x.decalage)}, la première facture de CampusTech rentre, ${eur(x.factureCampusTech)}, et la trésorerie remonte.`,
          },
          {
            texte: r < 0 ? `La perte ${dE(bas.nom)}, ${eur(-r)}` : `Le résultat ${dE(bas.nom)}, ${eur(r)}`,
            juste: false,
            retour: `Non : ${r < 0 ? `une perte de ${eur(-r)}` : "un mois gagnant"} n'explique pas une baisse de ${eur(auCentime(m.tresorerieDebut - m.tresorerieFin))}. Le point bas ne vient pas du résultat du mois, mais de ce qui se paie et de ce qui ne rentre pas encore.`,
          },
          {
            texte: `La TVA ${dE(bas.nom)}, payée dans le mois`,
            juste: false,
            retour: `Non : la TVA ${dE(bas.nom)} se paie en ${x.nom(i + 1)}. En ${bas.nom}, ${x.f.entreprise} paie celle ${dE(p)}, ${eur(d.tva)}.`,
          },
          {
            texte: "L'échéance de l'emprunt",
            juste: false,
            retour: d.emprunt > 0 ? `Non : elle prend ${eur(d.emprunt)}, bien moins que ce qui sort pour les dettes ${dE(p)}.` : `Non : elle tombe le dernier mois du trimestre, en ${x.nom(echeance)}, pas en ${bas.nom}.`,
          },
        ];
      },
    },
    {
      id: "predire-le-delai",
      type: "choix",
      titre: "Pariez sur le délai de CampusTech",
      notions: ["payment_terms", "receivables_financing"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        return `Avant de calculer, pariez. Supposons que CampusTech paie à ${DELAI_DU_PARI} jours au lieu des ${x.ct.delai} convenus, bien au-delà du plafond légal de ${DELAI_MAXIMAL_CONVENU.joursDeLaFacture} jours. Elle paierait les mêmes factures, simplement plus tard. La trésorerie du 30 juin…`;
      },
      options: (c) => {
        const x = budgetDuChapitre(c);
        const juin = x.auPari.tresorerieFin;
        const voir = "Faites payer CampusTech plus ou moins tard à l'étape suivante : le curseur montre la trésorerie du 30 juin, mois de délai par mois de délai.";
        return [
          {
            texte: "Baisse, mais reste positive",
            juste: juin >= 0 && juin < x.base.tresorerieFin,
            retour: `Bon pari. ${voir} Un tel délai ne se convient pas : la loi plafonne le délai entre professionnels à ${DELAI_MAXIMAL_CONVENU.joursDeLaFacture} jours.`,
          },
          { texte: "Devient négative : un découvert", juste: juin < 0, retour: `Pari à vérifier. ${voir}` },
          { texte: "Ne bouge pas : ce sont les mêmes factures", juste: juin === x.base.tresorerieFin, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-delai-au-curseur",
      type: "curseur",
      titre: "Le délai de CampusTech, au curseur",
      notions: ["payment_terms", "cash_budget"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        return `Faites payer CampusTech de ${qte(DECALAGE_DU_CURSEUR.min)} à ${qte(DECALAGE_DU_CURSEUR.max)} mois après sa facture (aujourd'hui : ${x.decalage} mois). Une droite donne la trésorerie du 30 juin, l'autre le découvert, à ${eur(0)}. Placez le curseur sur le plus long décalage qui laisse le 30 juin sans découvert, puis validez.`;
      },
      grandeur: () => ({ libelle: "Mois entre la facture de CampusTech et son paiement", unite: "mois" }),
      sens: "plus-grande",
      cible: (c) => {
        const x = budgetDuChapitre(c);
        return { attendu: x.decalageMax, min: DECALAGE_DU_CURSEUR.min, max: DECALAGE_DU_CURSEUR.max };
      },
      zones: ["Sans découvert au 30 juin", "À découvert au 30 juin"],
      rates: () => ({
        dessous: "Le budget supporte encore un paiement plus tardif sans découvert au 30 juin : cherchez le plus long décalage.",
        dessus: "À ce décalage, le 30 juin finit déjà à découvert.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, d) => {
        const x = budgetDuChapitre(c);
        const b = budgetAuDecalage(x.f, d);
        return [
          { libelle: "Encaissements de CampusTech sur le semestre", montant: auCentime(b.mois.reduce((t, m) => t + m.encaissements.campustech, 0)) },
          { libelle: "Créances sur CampusTech au 30 juin", montant: b.fin.creancesClients },
          { libelle: "Trésorerie la plus basse du semestre", montant: b.plusBas.tresorerie },
          { libelle: "Trésorerie au 30 juin", montant: b.tresorerieFin, fort: true },
        ];
      },
      droites: (c) => {
        const x = budgetDuChapitre(c);
        return { produit: (d) => budgetAuDecalage(x.f, d).tresorerieFin, cout: () => 0, libelles: ["Trésorerie au 30 juin", "Le découvert"] };
      },
      explication: (c) => {
        const x = budgetDuChapitre(c);
        const apres = budgetAuDecalage(x.f, x.decalageMax + 1).tresorerieFin;
        return [
          `Chaque mois de délai en plus repousse une facture de CampusTech, ${eur(x.factureCampusTech)}, après le 30 juin : la trésorerie de juin perd ${eur(x.factureCampusTech)} par mois de décalage, en ligne droite. À ${x.decalageMax} mois, juin finit avec ${eur(x.auMax.tresorerieFin)} ; à ${x.decalageMax + 1}, avec ${enBanque(apres)}.`,
          "Le chiffre d'affaires et le résultat, eux, n'ont pas bougé d'un euro : un délai de paiement ne change que la date de l'argent. L'étape suivante traduit ce décalage en jours.",
        ];
      },
    },
    {
      id: "le-delai-a-rebours",
      type: "montants",
      titre: "Le délai le plus long, à rebours",
      notions: ["payment_terms", "receivables_financing"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        return `Le curseur l'a montré : le budget supporte que CampusTech paie au plus ${x.decalageMax} mois après sa facture sans découvert au 30 juin. Sans formule : retrouvez le délai le plus long en jours (factures du ${x.ct.jourDeFacturation}, mois de ${x.s.joursDuMoisCommercial} jours), ce que CampusTech devrait encore au 30 juin à ce délai, et la trésorerie du 30 juin.`;
      },
      champs: (c) => {
        const x = budgetDuChapitre(c);
        // Au décalage le plus long, les factures des derniers mois du semestre restent dues.
        const dues = Math.min(x.decalageMax, x.s.mois.length);
        return [
          {
            libelle: "Délai le plus long que le budget supporte, en jours",
            attendu: x.delaiMax,
            calcul: `le jour ${x.ct.jourDeFacturation} + d doit tomber au plus le dernier jour du ${x.decalageMax + 1}e mois, celui de la facture compris : ${x.ct.jourDeFacturation} + d ≤ ${x.decalageMax + 1} × ${x.s.joursDuMoisCommercial}, d ≤ ${x.delaiMax}`,
          },
          {
            libelle: "Créances sur CampusTech au 30 juin",
            attendu: x.auMax.fin.creancesClients,
            calcul: `${dues} factures de ${eur(x.factureCampusTech)} attendent : ${dues} × ${eur(x.factureCampusTech)} = ${eur(x.auMax.fin.creancesClients)}`,
          },
          {
            libelle: "Trésorerie au 30 juin, à ce délai",
            attendu: x.auMax.tresorerieFin,
            calcul: `${eur(x.base.tresorerieFin)} − (${eur(x.auMax.fin.creancesClients)} − ${eur(x.base.fin.creancesClients)}) = ${eur(x.auMax.tresorerieFin)}`,
          },
        ];
      },
      explication: (c) => {
        const x = budgetDuChapitre(c);
        const b = x.auMax.plusBas;
        return [
          `À ${x.delaiMax} jours, CampusTech ne paierait dans le semestre que ${eur(x.auMax.mois.reduce((t, m) => t + m.encaissements.campustech, 0))} : ses ventes TTC du semestre, ${eur(auCentime(x.ct.quantites.reduce((t, q) => t + q, 0) * x.prixTtc))}, moins les créances de fin, ${eur(x.auMax.fin.creancesClients)}. Un jour de plus, et la facture de janvier glisse en juillet.`,
          `Le budget tient, mais de justesse : ${b.nom} tomberait à ${eur(b.tresorerie)}${b.tresorerie < x.f.seuilsDAlerte.tresorerie ? `, sous le matelas de ${eur(x.f.seuilsDAlerte.tresorerie)} que le dirigeant veut garder` : ""}. La loi, elle, ne le supporte pas : entre professionnels, le délai convenu ne peut dépasser ${DELAI_MAXIMAL_CONVENU.joursDeLaFacture} jours. Au-delà, c'est un retard, que ${x.f.entreprise} subit et peut sanctionner de pénalités. Laisser un client payer tard, c'est lui prêter : le budget dit combien, et jusqu'à quand.`,
        ];
      },
    },
    {
      id: "predire-le-banc",
      type: "choix",
      titre: "Pariez sur le banc de mesure",
      notions: ["cash_budget", "vat_payable"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return `Avant de calculer, pariez. Le dirigeant envisage d'acheter en ${n} ${x.s.investissement.libelle}, ${eur(x.inv.montantHt)} HT, payé à la livraison ; sa TVA se récupère sur la déclaration ${dE(n)}, payée en ${x.nom(x.k + 1)}. Sans lui, ${n} finit à ${eur(x.duMois.tresorerieFin)}. Avec lui, la trésorerie de fin ${dE(n)} sera…`;
      },
      options: (c) => {
        const x = budgetDuChapitre(c);
        const fin = x.avecLeBanc.mois[x.k]!.tresorerieFin;
        const voir = "Placez le banc dans le budget à l'étape suivante : le curseur montre la trésorerie de fin du mois, et ce qu'il faudrait vendre pour éviter le découvert.";
        return [
          { texte: `Négative : ${eur(x.invTtc)} TTC sortent d'un coup`, juste: fin < 0, retour: `Bon pari. ${voir}` },
          { texte: `Positive : ${eur(x.duMois.tresorerieFin)} couvrent les ${eur(x.inv.montantHt)} HT`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Positive : la TVA récupérée compense", juste: fin >= 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-ventes-au-curseur",
      type: "curseur",
      titre: "Les ventes qui évitent le découvert",
      notions: ["cash_budget"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return `Le banc est acheté en ${n} : ${eur(x.invTtc)} TTC sortent. Faites varier les enceintes vendues aux particuliers en ${n}, de ${qte(VENTES_DU_CURSEUR.min)} à ${qte(VENTES_DU_CURSEUR.max)} (au budget : ${qte(x.part.quantites[x.k]!)}). Une droite donne la trésorerie de fin ${dE(n)}, l'autre le découvert, à ${eur(0)}. Placez le curseur sur le plus petit nombre d'enceintes qui évite le découvert, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Enceintes vendues aux particuliers en ${budgetDuChapitre(c).nom(budgetDuChapitre(c).k)}`, unite: "enceintes" }),
      cible: (c) => {
        const x = budgetDuChapitre(c);
        return { attendu: x.ventesMinimales, min: VENTES_DU_CURSEUR.min, max: VENTES_DU_CURSEUR.max };
      },
      zones: ["Sans découvert", "À découvert"],
      rates: (c) => {
        const n = budgetDuChapitre(c).nom(budgetDuChapitre(c).k);
        return {
          dessous: `À cette position, ${n} finit encore à découvert.`,
          dessus: `Avec moins d'enceintes, ${n} reste au-dessus de zéro : cherchez la plus petite quantité.`,
        };
      },
      montrer: "Montrer le minimum",
      lecture: (c, q) => {
        const x = budgetDuChapitre(c);
        const m = budgetDeTresorerie(ficheAvecLesVentesDuMoisGuide(x.f, q), { investissement: x.inv }).mois[x.k]!;
        return [
          { libelle: "Encaissements du mois", montant: m.encaissements.total },
          { libelle: "Décaissements du mois, banc compris", montant: m.decaissements.total },
          { libelle: "Trésorerie de fin de mois", montant: m.tresorerieFin, fort: true },
        ];
      },
      droites: (c) => {
        const x = budgetDuChapitre(c);
        return {
          produit: (q) => budgetDeTresorerie(ficheAvecLesVentesDuMoisGuide(x.f, q), { investissement: x.inv }).mois[x.k]!.tresorerieFin,
          cout: () => 0,
          libelles: ["Trésorerie de fin de mois, banc acheté", "Le découvert"],
        };
      },
      explication: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return [
          `Il faudrait vendre au moins ${qte(x.ventesMinimales)} enceintes aux particuliers en ${n}, ${qte(x.enPlus)} de plus qu'au budget. La droite monte de ${eur(x.netParEnceinte)} par enceinte, et non de ${eur(x.prixTtc)} : une enceinte vendue en ${n} fait aussi payer ses autres coûts variables dans le mois.`,
          `Ses composants et sa TVA, eux, ne se paient qu'en ${x.nom(x.k + 1)} : c'est ce que l'étape suivante fait calculer.`,
        ];
      },
    },
    {
      id: "le-minimum-a-rebours",
      type: "montants",
      titre: "Le minimum de ventes, à rebours",
      notions: ["cash_budget", "vat_payable"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return `Banc acheté, ${n} finit à ${eur(-x.manque)}. Sans formule : calculez ce qu'une enceinte de plus vendue aux particuliers en ${n} laisse en banque à la fin du mois, le nombre d'enceintes à vendre en plus pour éviter le découvert, les ventes minimales ${dE(n)} aux particuliers, puis ce que ces enceintes en plus feront sortir en ${x.nom(x.k + 1)}.`;
      },
      champs: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return [
          {
            libelle: `Ce qu'une enceinte de plus laisse en banque fin ${dE(n)}`,
            attendu: x.netParEnceinte,
            calcul: `${eur(x.prixTtc)} encaissés − ${eur(x.autresTtc)} d'autres coûts TTC = ${eur(x.netParEnceinte)} ; composants et TVA attendent ${x.nom(x.k + 1)}`,
          },
          {
            libelle: "Enceintes à vendre en plus",
            attendu: x.enPlus,
            calcul: `${eur(x.manque)} ÷ ${eur(x.netParEnceinte)} = ${qte(auCentime(x.manque / x.netParEnceinte))}, soit ${qte(x.enPlus)} à l'unité supérieure`,
          },
          { libelle: `Ventes minimales ${dE(n)} aux particuliers`, attendu: x.ventesMinimales, calcul: `${qte(x.part.quantites[x.k]!)} + ${qte(x.enPlus)} = ${qte(x.ventesMinimales)}` },
          {
            libelle: `Ce que ces enceintes font sortir en ${x.nom(x.k + 1)}`,
            attendu: x.sortiesDuMoisSuivant,
            calcul: `${qte(x.enPlus)} × (${eur(x.composantsTtc)} de composants TTC + ${eur(x.tvaParEnceinte)} de TVA à décaisser) = ${eur(x.sortiesDuMoisSuivant)}`,
          },
        ];
      },
      explication: (c) => {
        const x = budgetDuChapitre(c);
        const naif = Math.ceil(x.manque / x.prixTtc - 1e-9);
        return [
          `Diviser le découvert par le prix TTC donnerait ${qte(naif)} enceintes : c'est oublier qu'une vente fait aussi sortir de l'argent, et à des dates différentes. Le minimum de ventes se calcule sur ce que la vente laisse en banque à la date qui compte, ici la fin du mois.`,
          `Les ${qte(x.enPlus)} enceintes en plus évitent le découvert du mois, mais pèsent sur le suivant : ${eur(x.sortiesDuMoisSuivant)} de composants et de TVA. Un budget de trésorerie se lit sur plusieurs mois, jamais sur un seul.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-tresorerie",
      type: "simulation",
      titre: "Le laboratoire de la trésorerie",
      notions: ["cash_budget", "payment_terms", "receivables_financing"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        return `Le banc de ${eur(x.inv.montantHt)} HT est décidé. Faites varier le délai de CampusTech (${x.ct.delai} jours convenus ; au-delà, c'est un retard que la loi ne permet pas de convenir), celui du fournisseur, les ventes de chaque mois et le mois de l'achat : le tableau suit la trésorerie et le résultat du semestre. Relevez le défi, puis cherchez les autres façons d'y arriver.`;
      },
      leviers: (c) => {
        const x = budgetDuChapitre(c);
        const L = LEVIERS_DU_LABORATOIRE;
        const k = x.k;
        return [
          { code: "campustech", libelle: "Délai de paiement de CampusTech", unite: "jours", ...L.campustech, depart: x.depart.campustech },
          { code: "fournisseur", libelle: "Délai de paiement du fournisseur", unite: "jours", ...L.fournisseur, depart: x.depart.fournisseur },
          { code: "hausse", libelle: "Hausse des ventes, chaque mois", unite: "%", ...L.hausse, depart: x.depart.hausse },
          {
            code: "achat",
            libelle: "Mois de l'achat du banc",
            unite: "",
            min: k,
            max: k + 1,
            pas: 1,
            depart: x.depart.achat,
            choix: [
              { valeur: k, libelle: `en ${x.nom(k)}` },
              { valeur: k + 1, libelle: `en ${x.nom(k + 1)}` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = budgetDuChapitre(c);
        const l = laboratoireDeTresorerie(x.f, p);
        const d = laboratoireDeTresorerie(x.f, x.depart);
        return [
          { libelle: `Trésorerie de fin ${dE(x.nom(x.k))}`, montant: l.duMois, reference: d.duMois },
          { libelle: `Trésorerie de fin de ${x.nom(x.k + 1)}`, montant: l.moisSuivant, reference: d.moisSuivant },
          { libelle: "Trésorerie au 30 juin", montant: l.juin, reference: d.juin },
          { libelle: "Créances clients au 30 juin", montant: l.creancesClients, reference: d.creancesClients },
          { libelle: "Dettes fournisseurs au 30 juin", montant: l.dettesFournisseurs, reference: d.dettesFournisseurs },
          { libelle: "Résultat du semestre", montant: l.resultat, reference: d.resultat },
          { libelle: "Trésorerie la plus basse du semestre", montant: l.plusBas.tresorerie, reference: d.plusBas.tresorerie, fort: true },
        ];
      },
      // La trésorerie selon le délai de CampusTech ne suit pas une droite : elle descend par marches,
      // d'une facture à chaque mois de décalage, quand le délai franchit la fin d'un mois.
      graphique: (c) => {
        const x = budgetDuChapitre(c);
        return {
          levier: "campustech",
          courbes: [
            { libelle: `Trésorerie de fin ${dE(x.nom(x.k))}`, valeur: (p) => laboratoireDeTresorerie(x.f, p).duMois },
            { libelle: "Trésorerie la plus basse du semestre", valeur: (p) => laboratoireDeTresorerie(x.f, p).plusBas.tresorerie },
          ],
        };
      },
      defi: (c) => {
        const x = budgetDuChapitre(c);
        return {
          consigne: `Achetez le banc de ${eur(x.inv.montantHt)} HT sans qu'aucun mois du semestre ne finisse à découvert.`,
          atteint: (p) => laboratoireDeTresorerie(x.f, p).plusBas.tresorerie >= 0,
          indice: (p) => {
            const b = laboratoireDeTresorerie(x.f, p).plusBas;
            return `${majuscule(b.nom)} finit à ${eur(b.tresorerie)}. Faites rentrer l'argent plus tôt, sortir plus tard, vendez plus, ou déplacez l'achat.`;
          },
          solution: { ...x.depart, campustech: x.campusTechMax },
        };
      },
      explication: (c, p) => {
        const x = budgetDuChapitre(c);
        const l = laboratoireDeTresorerie(x.f, p);
        const d = laboratoireDeTresorerie(x.f, x.depart);
        return [
          `Défi relevé : le point bas du semestre est ${l.plusBas.nom}, à ${eur(l.plusBas.tresorerie)}, et le résultat du semestre vaut ${eur(l.resultat)} (${eur(d.resultat)} au départ).`,
          `Chaque levier, seul, passait le banc : CampusTech payée à ${x.campusTechMax} jours au plus (une facture de plus rentre avant la fin ${dE(x.nom(x.k))}), le fournisseur payé à ${x.fournisseurMin} jours au moins (chaque facture de composants se paie un mois plus tard), ${pct(x.hausseMin / 100)} de ventes en plus chaque mois, ou l'achat en ${x.nom(x.k + 1)}.`,
          "Seule la hausse des ventes change le résultat : les délais et la date de l'achat ne font que déplacer l'argent dans le temps. C'est tout l'objet du budget de trésorerie.",
        ];
      },
    },
    {
      id: "la-tva-du-banc",
      type: "montants",
      titre: "La TVA à décaisser, avec le banc",
      notions: ["vat_payable", "cash_budget"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return `Le banc est acheté en ${n}. Sans formule : calculez la TVA collectée ${dE(n)}, la TVA déductible ${dE(n)}, banc compris, la TVA à décaisser en ${x.nom(x.k + 1)}, puis la trésorerie de fin de ${x.nom(x.k + 1)}.`;
      },
      champs: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        const t = x.tvaDuMoisGuide;
        const suivant = x.avecLeBanc.mois[x.k + 1]!;
        return [
          { libelle: `TVA collectée ${dE(n)}`, attendu: t.collectee, calcul: `${qte(x.duMois.quantite)} × ${eur(x.m.prix)} × ${pct(x.tva)} = ${eur(t.collectee)}` },
          {
            libelle: `TVA déductible ${dE(n)}, banc compris`,
            attendu: t.deductible,
            calcul: `${qte(x.duMois.quantite)} × (${eur(x.m.coutVariable.composants)} + ${eur(x.m.coutVariable.autres)}) × ${pct(x.tva)} + ${eur(x.inv.montantHt)} × ${pct(x.tva)} = ${eur(auCentime(t.deductible - x.inv.montantHt * x.tva))} + ${eur(auCentime(x.inv.montantHt * x.tva))} = ${eur(t.deductible)}`,
          },
          { libelle: `TVA à décaisser en ${x.nom(x.k + 1)}`, attendu: t.solde, calcul: `${eur(t.collectee)} − ${eur(t.deductible)} = ${eur(t.solde)}` },
          {
            libelle: `Trésorerie de fin de ${x.nom(x.k + 1)}, banc acheté`,
            attendu: suivant.tresorerieFin,
            calcul: `${eur(suivant.tresorerieDebut)} + ${eur(suivant.encaissements.total)} − ${eur(suivant.decaissements.total)} = ${eur(suivant.tresorerieFin)}`,
          },
        ];
      },
      explication: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return [
          `La TVA du banc, ${eur(auCentime(x.inv.montantHt * x.tva))}, ${x.f.entreprise} l'avance en ${n} et la retrouve en ${x.nom(x.k + 1)}, en moins sur sa déclaration : la TVA ne coûte rien, mais elle décale. Si la TVA déductible avait dépassé la TVA collectée, la déclaration aurait donné un crédit de TVA, reporté sur la suivante.`,
          `Le découvert ${dE(n)} ne vient donc pas du prix du banc, mais de son calendrier : ${eur(x.invTtc)} sortent en ${n}, ${eur(auCentime(x.inv.montantHt * x.tva))} reviennent en ${x.nom(x.k + 1)}.`,
        ];
      },
    },
    {
      id: "la-tva-de-campustech",
      type: "choix",
      titre: "La TVA d'une vente payée tard",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        const tvaJanvier = auCentime(x.ct.quantites[0]! * x.m.prix * x.tva);
        return `En janvier, ${x.f.entreprise} vend ${qte(x.ct.quantites[0]!)} enceintes à CampusTech : ${eur(tvaJanvier)} de TVA collectée. CampusTech ne paiera qu'en ${x.nom(x.decalage)}. Quand ${x.f.entreprise} reverse-t-elle cette TVA à l'État ?`;
      },
      options: (c) => {
        const x = budgetDuChapitre(c);
        return [
          {
            texte: `En ${x.nom(1)}, avant d'être payée`,
            juste: true,
            retour: `Oui. Pour une vente de biens, la TVA est due à la livraison, pas à l'encaissement : elle entre dans la déclaration de janvier, payée en ${x.nom(1)}. ${x.f.entreprise} avance à l'État la TVA d'une vente que CampusTech ne lui paiera qu'en ${x.nom(x.decalage)} : le délai du client coûte aussi de la TVA à porter.`,
          },
          {
            texte: `En ${x.nom(x.decalage + 1)}, le mois qui suit le paiement`,
            juste: false,
            retour: "Non : la TVA sur les encaissements vaut pour les prestations de services. Une enceinte est un bien : sa TVA est due à la livraison, et se déclare avec les ventes du mois.",
          },
          {
            texte: "Jamais : CampusTech la récupère",
            juste: false,
            retour: `Non : CampusTech déduit la TVA qu'elle paie, mais ${x.f.entreprise} doit reverser celle qu'elle collecte. Les deux ne s'annulent pas chez ${x.f.entreprise}.`,
          },
        ];
      },
    },
    {
      id: "que-faire-du-decouvert",
      type: "choix",
      titre: "À quoi sert ce budget",
      notions: ["cash_budget"],
      question: (c) => {
        const x = budgetDuChapitre(c);
        const n = x.nom(x.k);
        return `Nous sommes en janvier. Le budget annonce, si le banc est acheté en ${n}, un découvert de ${eur(x.manque)} fin ${dE(n)}, puis ${enBanque(x.avecLeBanc.mois[x.k + 1]!.tresorerieFin)} fin de ${x.nom(x.k + 1)}. Que fait le dirigeant, dès maintenant ?`;
      },
      options: (c) => {
        const x = budgetDuChapitre(c);
        return [
          {
            texte: "Il négocie dès janvier ce qui manquera : un découvert autorisé, un délai, ou il décale l'achat",
            juste: true,
            retour:
              "C'est cela. Un besoin de trésorerie annoncé des mois à l'avance se négocie ; découvert le jour même, il se subit, au taux le plus cher, quand la banque accepte. Le budget ne sert pas à constater, mais à décider à temps.",
          },
          {
            texte: `Rien : fin de ${x.nom(x.k + 1)}, la trésorerie redevient positive`,
            juste: false,
            retour: "Un découvert non autorisé, même d'un mois, rejette des paiements et coûte des agios : la banque doit être prévenue avant, pas après.",
          },
          {
            texte: "Il attend le relevé du mois : un budget n'est qu'une prévision",
            juste: false,
            retour: "Au relevé, il sera trop tard pour négocier : le budget sert justement à voir le trou avant d'y tomber.",
          },
          {
            texte: "Il vend moins pour moins acheter",
            juste: false,
            retour: "Les ventes font rentrer l'argent : les réduire creuserait le trou. C'est le décalage qu'il faut financer.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["cash_budget", "vat_payable", "payment_terms"],
      tableau: tableauDuBudget,
      texte: (c) => {
        const x = budgetDuChapitre(c);
        return [
          `Vous avez bâti le budget de trésorerie mensuel de ${x.f.entreprise}, toutes taxes comprises : le budget des encaissements, clientèle par clientèle, celui des décaissements, la TVA à décaisser le mois suivant, et la trésorerie de fin de mois, de ${eur(x.s.tresorerieDeDepart)} au 1er janvier à ${eur(x.base.tresorerieFin)} au 30 juin, avec un point bas en ${x.base.plusBas.nom}.`,
          `Puis vous vous en êtes servi : le budget supporterait que CampusTech paie jusqu'à ${x.delaiMax} jours sans découvert au 30 juin, quand la loi plafonne le délai convenu à ${DELAI_MAXIMAL_CONVENU.joursDeLaFacture} jours ; le banc ${dE(x.nom(x.k))} met ${x.f.entreprise} à découvert de ${eur(x.manque)}, qu'évitent ${qte(x.enPlus)} enceintes vendues en plus, un délai, ou un mois de patience. Un délai et la TVA ne changent pas le résultat : ils changent la date de l'argent.`,
          "Au niveau de l'examen, vous savez dater un flux à partir d'une facture et d'un délai, bâtir le budget des encaissements et celui des décaissements TTC, calculer la TVA à décaisser avec un investissement, retrouver à rebours un délai ou un minimum de ventes, et dire ce que le dirigeant doit négocier avant le découvert.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Encaissements = créances du début + ventes TTC − créances de fin ; paiements au fournisseur = dettes du début + achats TTC − dettes de fin ; TVA à décaisser = TVA collectée − TVA déductible, payée le mois suivant ; trésorerie de fin = début + encaissements − décaissements.",
    },
  ],
};
