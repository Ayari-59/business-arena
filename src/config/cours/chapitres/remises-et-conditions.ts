import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime as auCentimeDeLArene } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { CABINETS_DU_COURS, type CompteClient } from "../monde/atlas-conseil";
import { DELAIS_DU_COURS, DELAI_MAXIMAL_CONVENU, JOURS_DE_L_ANNEE_BANCAIRE, type FicheDeLAffaire } from "../monde/delais-et-tva";
import { affaireAuxConditions } from "../monde/delais";
import { coutDeLAvance, tauxAnnuelDeLEscompte } from "../monde/facture";
import { JOURS_D_ESCOMPTE, JOURS_PAR_AN, TAUX_DE_REMISE, TAUX_D_ESCOMPTE } from "../remises";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : REMISES ET CONDITIONS, LA RENTABILITÉ D'UNE AFFAIRE (BTS NDRC, palier 2 ; BUT TC).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : l'affaire que
 * Kerval Distribution passe à ATLAS CONSEIL a une fiche figée (monde/delais-et-tva.ts,
 * `ATLAS_CONDITIONS`) et se calcule par le modèle des délais (monde/delais.ts, partie 7,
 * `affaireAuxConditions`). Une évolution du moteur ne change rien ici. Le chapitre ne lit du cas que
 * son code.
 *
 * L'objet : 40 journées à 800 € HT, 150 € HT de coût variable, 5 % de remise, 2 % d'escompte à
 * 10 jours, sinon 60 jours, le tout financé sur un découvert à 9 %. La facture (brut 32 000 €, net
 * commercial 30 400 €, net financier 29 792 €, net à payer 35 750,40 € TTC) ; la marge (26 000 € au
 * catalogue, 24 400 € après remise : 5 % du prix cèdent 6,15 % de la marge) ; la contrepartie (43
 * journées au prix remisé, 3 de plus) ; le crédit accordé (456 € sur 30 400 € HT : une prestation de
 * services ne doit sa TVA qu'à l'encaissement, le cabinet n'en avance rien) ; l'escompte face au
 * découvert (14,69 % l'an pour 9 %) ; le plus fort escompte que le découvert justifie (1,23 %).
 *
 * LA MÉTHODE DE L'ESCOMPTE, UNE SEULE DANS TOUT LE CHAPITRE ET SON CAS : LE TAUX ANNUEL. Payé à
 * 10 jours, le client avance le net financier pendant les jours d'avance (délai − 10) ; l'escompte se
 * compare au découvert que ces jours évitent (net financier × taux × jours d'avance ÷ 360), soit,
 * ramené à l'année, t ÷ (1 − t) × 360 ÷ jours d'avance face au taux du découvert. Le délai où
 * l'escompte vaut le découvert est donc 10 + t ÷ (1 − t) × 360 ÷ taux, 91,63 jours ici (le curseur
 * attend 92). L'autre raccourci, comparer l'escompte au crédit du délai entier sur le net commercial
 * (`delaiOuLEscompteVautLeCredit` du modèle, 80 jours), n'est jamais employé : il oublie les 10 jours
 * de crédit qui restent et la base du net financier. Le chapitre ne calcule pas non plus le résultat
 * d'une affaire où le client prend l'escompte, dont le point d'égalité serait un troisième nombre.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, facture, marge, le-credit (la formule est au repère ou dans la question, qui
 *     nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) :
 *     predire-la-contrepartie puis la-contrepartie-au-curseur (un curseur sur les journées commandées
 *     au prix remisé, leur marge face à celle du catalogue) avant contrepartie ; predire-l-escompte
 *     puis l-escompte-au-curseur (un curseur sur le délai de paiement, le découvert que l'escompte
 *     évite face à ce qu'il coûte) avant le-taux-annuel ;
 *   · autonome : contrepartie, qui-avance-la-tva, quel-raisonnement (ni formule ni chiffres à
 *     prendre ; la correction montre le chemin) ;
 *   · expert : escompte-maximal (à rebours, du taux du découvert au plus fort escompte),
 *     l-option-pour-les-debits (une variante chiffrée : la TVA avancée), le-laboratoire-des-conditions
 *     (remise, escompte, délai et journées à la fois, avec le graphique du taux annuel de l'escompte
 *     selon le délai : accorder 10 % sans rien perdre) ; puis la synthèse.
 */

/** Le chapitre se joue chez le cabinet du cours, qui vend des prestations de services à des clients professionnels. */
export const ENTREPRISES_DES_CONDITIONS: readonly string[] = ["conseil"];

/**
 * LA REMISE QUE KERVAL DEMANDE AU LABORATOIRE, hypothèse du cours : 10 %, le double de celle que le
 * commercial a accordée. Le défi : la lui accorder sans que l'affaire rapporte moins qu'aujourd'hui.
 */
export const REMISE_DEMANDEE_AU_LABORATOIRE = 0.1;

/**
 * L'ESCOMPTE DE LA SOLUTION DU LABORATOIRE, hypothèse du cours : 1 %, un point rond sous le plus fort
 * escompte que le découvert justifie à 60 jours (1,23 %).
 */
export const ESCOMPTE_DE_LA_SOLUTION = 0.01;

/** Les bornes du curseur de la contrepartie, en journées commandées au prix remisé. */
export const JOURNEES_DU_CURSEUR = { min: 30, max: 60 } as const;

/** Les bornes du curseur de l'escompte, en jours de délai : d'un délai court au retard d'un client qui paie bien après 60 jours. */
export const DELAI_DU_CURSEUR = { min: 30, max: 120 } as const;

/** Les leviers du laboratoire : la remise et l'escompte (en %), le délai de paiement (en jours), les journées de l'affaire. */
export const LEVIERS_DU_LABORATOIRE = {
  remise: { min: 0, max: 20, pas: 1 },
  escompte: { min: 0, max: 3, pas: 0.25 },
  delai: { min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max, pas: 5 },
  journees: { min: JOURNEES_DU_CURSEUR.min, max: JOURNEES_DU_CURSEUR.max, pas: 1 },
} as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Un pourcentage, la part étant donnée en fraction (0,146939 → « 14,69 % »). */
const pct = (part: number) => `${qte(Math.round(part * 10_000) / 100)} %`;
/** Une part en pourcentage, au centième : ce que l'élève tape (0,146939 → 14,69). */
const enPourcent = (part: number) => Math.round(part * 10_000) / 100 + 0;
/** « d'ATLAS CONSEIL », « de NOVA » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêhAEIOUYÉÈH]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les affaires du monde du cours, par code d'entreprise. */
const AFFAIRES_DU_COURS: Readonly<Record<string, FicheDeLAffaire>> = { [DELAIS_DU_COURS.conseil.code]: DELAIS_DU_COURS.conseil };

/** La fiche de l'affaire du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLAffaire => AFFAIRES_DU_COURS[c.code]!;

/** Le compte du client dans le portefeuille du cabinet (atlas-conseil.ts) : ce qu'il a acheté en N. */
const compteDuClient = (c: Pick<Cas, "code">): CompteClient => CABINETS_DU_COURS[c.code]!.comptes.find((k) => k.code === ficheDe(c).compte)!;

/**
 * LE DÉLAI OÙ L'ESCOMPTE VAUT LE DÉCOUVERT, PAR LE TAUX ANNUEL (la méthode du chapitre). L'escompte t,
 * payé à `joursDEscompte`, coûte t ÷ (1 − t) du net financier ; le découvert évité en coûte
 * taux × (délai − joursDEscompte) ÷ 360. Ils sont égaux à délai = joursDEscompte + t ÷ (1 − t) × 360 ÷ taux.
 * Le modèle n'a que l'autre raccourci (`delaiOuLEscompteVautLeCredit`, t × 360 ÷ taux) : celle-ci est
 * proposée pour monde/delais.ts.
 */
export function delaiOuLEscompteVautLeDecouvert(tauxDEscompte: number, joursDEscompte: number, tauxDuDecouvert: number) {
  return joursDEscompte + ((tauxDEscompte / (1 - tauxDEscompte)) * JOURS_DE_L_ANNEE_BANCAIRE) / tauxDuDecouvert;
}

/** L'affaire de Kerval : tout ce que le chapitre et son cas demandent, calculé une fois sur la fiche. */
export function conditionsDeKerval(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const x = affaireAuxConditions(f);
  // L'option pour les débits : la TVA est due à la facture, comme pour une livraison de biens.
  const debits = affaireAuxConditions(f, { nature: "biens" });
  const t = f.escompte.taux;
  const jE = f.escompte.jours;
  const r = f.tauxDeFinancement;
  const joursDAvance = f.delai - jE;
  const decouvertEvite = coutDeLAvance(x.facture.netFinancier, r, joursDAvance);
  const delaiDEgalite = delaiOuLEscompteVautLeDecouvert(t, jE, r);
  const delaiDuCurseur = Math.ceil(delaiDEgalite - 1e-9);
  const tvaSansEscompte = auCentime(x.netAPayerSansEscompte - x.facture.netCommercial);
  return {
    f,
    entreprise: f.entreprise,
    client: f.client,
    journeesEnN: compteDuClient(c).journees,
    journees: f.journees,
    prix: f.prixHT,
    coutVariable: f.coutVariableHT,
    remise: f.remise,
    tauxDEscompte: t,
    joursDEscompte: jE,
    delai: f.delai,
    taux: r,
    tauxDeTva: f.tauxDeTva,
    brut: x.facture.brut,
    montantDeLaRemise: x.facture.reductions[0]!.montant,
    netCommercial: x.facture.netCommercial,
    escompte: x.facture.escompte,
    netFinancier: x.facture.netFinancier,
    tva: x.facture.tva,
    netAPayer: x.facture.netAPayer,
    netAPayerSansEscompte: x.netAPayerSansEscompte,
    tvaSansEscompte,
    coutsVariables: x.coutsVariables,
    margeCatalogue: x.margeCatalogue,
    marge: x.marge,
    margeCedee: x.margeCedee,
    partDeLaMargeCedee: x.partDeLaMargeCedee,
    coutDuCredit: x.coutDuCredit,
    resultat: x.resultat,
    // L'escompte, par le taux annuel.
    joursDAvance,
    tauxAnnuelDeLEscompte: x.tauxAnnuelDeLEscompte!,
    decouvertEvite,
    surcoutDeLEscompte: auCentime(x.facture.escompte - decouvertEvite),
    delaiDEgalite,
    delaiDuCurseur,
    retardDuCurseur: delaiDuCurseur - DELAI_MAXIMAL_CONVENU.joursDeLaFacture,
    // À rebours : le découvert de ces jours, rapporté au net financier, et l'escompte qui le vaut.
    decouvertSurLAvance: (r * joursDAvance) / JOURS_DE_L_ANNEE_BANCAIRE,
    escompteMaximal: x.escompteMaximal!,
    escompteMaximalEnEuros: auCentime(x.facture.netCommercial * x.escompteMaximal!),
    // La contrepartie de la remise.
    prixRemise: x.prixRemise,
    margeParJourneeRemisee: x.margeParJourneeRemisee,
    journeesPourLaMemeMarge: x.journeesPourLaMemeMarge!,
    journeesEnPlus: x.journeesEnPlus!,
    /** L'erreur du pari : les journées en plus au prorata de la remise (5 % de 40). */
    journeesAuProrata: f.journees * f.remise,
    // La variante : l'option pour les débits, le cabinet finance le TTC.
    debits: { base: debits.baseDuCredit, coutDuCredit: debits.coutDuCredit, surcout: auCentime(debits.coutDuCredit - x.coutDuCredit), resultat: debits.resultat },
  };
}

export type ConditionsDeKerval = ReturnType<typeof conditionsDeKerval>;

/**
 * L'affaire pour une position des leviers du laboratoire : la remise et l'escompte en pourcentage, le
 * délai en jours, les journées. Le résultat est celui d'une affaire payée à l'échéance ; l'escompte se
 * juge à part, par son taux annuel, face au découvert que ses jours d'avance évitent.
 */
export function laboratoireDesConditions(c: Pick<Cas, "code">, p: Readonly<Record<string, number>>) {
  const f = ficheDe(c);
  const x = affaireAuxConditions(f, { remise: p.remise! / 100, tauxDEscompte: p.escompte! / 100, delai: p.delai!, journees: p.journees! });
  const decouvertEvite = coutDeLAvance(x.facture.netFinancier, f.tauxDeFinancement, p.delai! - f.escompte.jours);
  const tauxAnnuel = x.tauxAnnuelDeLEscompte ?? 0;
  return {
    netCommercial: x.facture.netCommercial,
    marge: x.marge,
    margeCedee: x.margeCedee,
    coutDuCredit: x.coutDuCredit,
    resultat: x.resultat,
    escompte: x.facture.escompte,
    decouvertEvite,
    /** Ce que l'escompte, s'il est pris, rapporte de plus que le découvert qu'il évite (négatif : il coûte plus). */
    effetDeLEscompte: auCentime(decouvertEvite - x.facture.escompte),
    tauxAnnuel,
    escompteTropCher: p.escompte! > 0 && tauxAnnuel > f.tauxDeFinancement,
    escompteMaximal: x.escompteMaximal ?? 0,
    prixRemise: x.prixRemise,
  };
}

/** Les conditions de l'affaire : le document de départ. */
export function tableauDeLAffaire(c: Pick<Cas, "code">): TableauDeDonnees {
  const k = conditionsDeKerval(c);
  return {
    titre: `L'affaire ${k.client} · ${k.entreprise}`,
    colonnes: ["Condition"],
    lignes: [
      { libelle: "Journées commandées", valeurs: [qte(k.journees)] },
      { libelle: "Prix catalogue d'une journée (HT)", valeurs: [eur(k.prix)] },
      { libelle: "Coût variable d'une journée (HT)", valeurs: [eur(k.coutVariable)] },
      { libelle: "Remise sur la commande", valeurs: [pct(k.remise)] },
      { libelle: `Escompte pour un paiement sous ${qte(k.joursDEscompte)} jours`, valeurs: [pct(k.tauxDEscompte)] },
      { libelle: "Délai de paiement, sans escompte", valeurs: [`${qte(k.delai)} jours`] },
      { libelle: "Taux du découvert du cabinet, l'an", valeurs: [pct(k.taux)] },
      { libelle: "TVA, due à l'encaissement", valeurs: [pct(k.tauxDeTva)] },
    ],
  };
}

/** Ce que chaque condition prend à l'affaire : le tableau de la synthèse. */
function tableauDesConditions(k: ConditionsDeKerval): TableauDeDonnees {
  return {
    titre: `Ce que chaque condition prend à l'affaire ${k.client}`,
    colonnes: ["Montant (HT)"],
    lignes: [
      { libelle: "Marge au prix catalogue", valeurs: [eur(k.margeCatalogue)] },
      { libelle: `Remise de ${pct(k.remise)}`, valeurs: [eur(-k.margeCedee)] },
      { libelle: `Crédit de ${qte(k.delai)} jours`, valeurs: [eur(-k.coutDuCredit)] },
      { libelle: `Résultat de l'affaire, payée à ${qte(k.delai)} jours`, valeurs: [eur(k.resultat)] },
      { libelle: `Escompte de ${pct(k.tauxDEscompte)}, s'il est pris`, valeurs: [eur(-k.escompte)] },
      { libelle: "Découvert que cet escompte évite", valeurs: [eur(k.decouvertEvite)] },
    ],
  };
}

const HT_ET_TTC =
  "Une convention pour tout le chapitre : chaque montant dit s'il est hors taxes (HT) ou toutes taxes comprises (TTC). Ce que le client doit payer est TTC ; une marge, un coût, un résultat sont HT.";

export const REMISES_ET_CONDITIONS: Chapitre = {
  code: "remises-et-conditions",
  parcours: "ndrc",
  palier: 2,
  blocs: ["BTS NDRC Bloc 1 · Relation client et négociation-vente", "BUT TC · Vendre une offre commerciale"],
  titre: "Remises et conditions : la rentabilité d'une affaire",
  accroche:
    "Une remise, un escompte, un délai de paiement : chaque concession prend sa part de la marge. L'affaire de Kerval Distribution, chiffrée de la facture au résultat, l'escompte ramené à son taux annuel, et ce qu'il faut obtenir en échange.",
  objectifs: [
    "Établir une facture : remise, net commercial, escompte, net financier, TVA, net à payer",
    "Calculer la marge d'une affaire, la part qu'une remise en cède, et la contrepartie qui la paie",
    "Chiffrer le coût d'un délai de paiement sur la bonne base, hors taxes ou toutes taxes comprises",
    "Ramener un escompte à son taux annuel et le comparer au coût du découvert",
    "Remonter au plus fort escompte qu'un financement justifie",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_CONDITIONS,
    pourquoi:
      "ce chapitre se joue chez ATLAS CONSEIL, le cabinet de la simulation du cours : une affaire avec un client professionnel qui paie à échéance, et des prestations de services, dont la TVA n'est due qu'à l'encaissement.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une affaire, et ses conditions",
      notions: ["payment_terms"],
      tableau: tableauDeLAffaire,
      texte: (c) => {
        const k = conditionsDeKerval(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${k.entreprise}, un cabinet de conseil et de formation. ${k.client}, un compte PME du cabinet (${qte(k.journeesEnN)} journées achetées en N, au prix catalogue), commande pour N + 1 un programme de ${qte(k.journees)} journées de formation de ses chefs d'équipe, à ${eur(k.prix)} HT la journée.`,
          `Pour signer, le commercial a accordé ${pct(k.remise)} de remise, et ${pct(k.tauxDEscompte)} d'escompte si ${k.client} paie sous ${qte(k.joursDEscompte)} jours ; sinon, le client paie à ${qte(k.delai)} jours, le délai maximal convenu entre professionnels. Chaque condition prend sa part : la remise tout de suite, l'escompte si le client paie vite, le délai s'il paie tard.`,
          `La simulation suppose qu'une journée vendue coûte ${eur(k.coutVariable)} HT de frais de mission et de supports, et rien d'autre ; que le cabinet finance toute attente sur son découvert, à ${pct(k.taux)} l'an, les intérêts comptés sur ${qte(JOURS_DE_L_ANNEE_BANCAIRE)} jours ; et qu'il vend des prestations de services, dont la TVA, à ${pct(k.tauxDeTva)}, n'est due qu'à l'encaissement (il n'a pas opté pour les débits).`,
          HT_ET_TTC,
        ];
      },
      repere: () => "Net commercial (HT) = brut − remise. Net financier (HT) = net commercial − escompte. TVA = net financier × taux de TVA. Net à payer (TTC) = net financier + TVA.",
    },
    {
      id: "facture",
      type: "montants",
      titre: "La facture de l'affaire",
      notions: ["payment_terms"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Établissez la facture si ${k.client} paie sous ${qte(k.joursDEscompte)} jours : le montant brut (${qte(k.journees)} × ${eur(k.prix)} HT), la remise de ${pct(k.remise)}, le net commercial, l'escompte de ${pct(k.tauxDEscompte)} sur le net commercial, le net financier, la TVA à ${pct(k.tauxDeTva)} et le net à payer.`;
      },
      champs: (c) => {
        const k = conditionsDeKerval(c);
        return [
          { libelle: "Montant brut (HT)", attendu: k.brut, calcul: `${qte(k.journees)} × ${eur(k.prix)} = ${eur(k.brut)}` },
          { libelle: "Remise", attendu: k.montantDeLaRemise, calcul: `${eur(k.brut)} × ${pct(k.remise)} = ${eur(k.montantDeLaRemise)}` },
          { libelle: "Net commercial (HT)", attendu: k.netCommercial, calcul: `${eur(k.brut)} − ${eur(k.montantDeLaRemise)} = ${eur(k.netCommercial)}` },
          { libelle: "Escompte", attendu: k.escompte, calcul: `${eur(k.netCommercial)} × ${pct(k.tauxDEscompte)} = ${eur(k.escompte)}` },
          { libelle: "Net financier (HT)", attendu: k.netFinancier, calcul: `${eur(k.netCommercial)} − ${eur(k.escompte)} = ${eur(k.netFinancier)}` },
          { libelle: "TVA", attendu: k.tva, calcul: `${eur(k.netFinancier)} × ${pct(k.tauxDeTva)} = ${eur(k.tva)}` },
          { libelle: "Net à payer (TTC)", attendu: k.netAPayer, calcul: `${eur(k.netFinancier)} + ${eur(k.tva)} = ${eur(k.netAPayer)}` },
        ];
      },
      explication: (c) => {
        const k = conditionsDeKerval(c);
        return [
          `La remise se calcule sur le brut, l'escompte sur le net commercial : les réductions s'enchaînent, elles ne s'additionnent pas. Si le client paie sous ${qte(k.joursDEscompte)} jours, le cabinet encaisse ${eur(k.netFinancier)} HT au lieu des ${eur(k.brut)} du prix catalogue.`,
          `Sans escompte, la TVA porte sur le net commercial : ${k.client} devra ${eur(k.netAPayerSansEscompte)} TTC à ${qte(k.delai)} jours, dont ${eur(k.tvaSansEscompte)} de TVA.`,
        ];
      },
    },
    {
      id: "marge",
      type: "montants",
      titre: "Ce que la remise coûte",
      notions: ["contribution_margin"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Chaque journée vendue coûte ${eur(k.coutVariable)} HT de coûts variables. Calculez la marge sur coût variable de l'affaire au prix catalogue (${qte(k.journees)} × (${eur(k.prix)} − ${eur(k.coutVariable)})), puis après la remise (le net commercial moins les coûts variables), et la part de la marge que la remise cède, au centième.`;
      },
      champs: (c) => {
        const k = conditionsDeKerval(c);
        return [
          { libelle: "Marge au prix catalogue (HT)", attendu: k.margeCatalogue, calcul: `${qte(k.journees)} × (${eur(k.prix)} − ${eur(k.coutVariable)}) = ${eur(k.margeCatalogue)}` },
          { libelle: "Marge après remise (HT)", attendu: k.marge, calcul: `${eur(k.netCommercial)} − ${qte(k.journees)} × ${eur(k.coutVariable)} = ${eur(k.marge)}` },
          { libelle: "Part de la marge cédée (%)", attendu: enPourcent(k.partDeLaMargeCedee), tolerance: 0.01, calcul: `${eur(k.margeCedee)} ÷ ${eur(k.margeCatalogue)} × 100 = ${pct(k.partDeLaMargeCedee)}` },
        ];
      },
      explication: (c) => {
        const k = conditionsDeKerval(c);
        return [
          `Une remise de ${pct(k.remise)} du prix cède ${pct(k.partDeLaMargeCedee)} de la marge : elle se prend sur le prix entier, mais elle sort tout entière de la marge, puisque les coûts, eux, ne baissent pas. Plus la marge est mince, plus la même remise en emporte une grande part.`,
        ];
      },
    },
    {
      id: "predire-la-contrepartie",
      type: "choix",
      titre: "Pariez sur la contrepartie",
      notions: ["contribution_margin"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Avant de calculer, pariez. La remise coûte ${eur(k.margeCedee)} de marge. Pour la payer, le commercial demande à ${k.client} des journées en plus, au prix remisé. Combien en faut-il pour retrouver la marge du prix catalogue, ${eur(k.margeCatalogue)} ?`;
      },
      options: (c) => {
        const k = conditionsDeKerval(c);
        const voir = "Faites varier la commande à l'étape suivante : le curseur montre combien de journées paient la remise, et pourquoi.";
        return [
          { texte: `Exactement ${qte(k.journeesAuProrata)} : ${pct(k.remise)} des ${qte(k.journees)} journées`, juste: k.journeesEnPlus > 0 && k.journeesEnPlus <= k.journeesAuProrata, retour: `Pari à vérifier. ${voir}` },
          { texte: `Plus de ${qte(k.journeesAuProrata)} : chaque journée remisée laisse moins de marge`, juste: k.journeesEnPlus > k.journeesAuProrata, retour: `Bon pari. ${voir}` },
          { texte: "Aucune : la remise se rattrape sur la commande suivante", juste: k.journeesEnPlus <= 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-contrepartie-au-curseur",
      type: "curseur",
      titre: "Les journées qui paient la remise",
      notions: ["contribution_margin", "price_floor"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Faites varier la commande de ${k.client}, de ${qte(JOURNEES_DU_CURSEUR.min)} à ${qte(JOURNEES_DU_CURSEUR.max)} journées, au prix remisé de ${eur(k.prixRemise)} HT. Une droite donne la marge de l'affaire après remise, l'autre la marge du prix catalogue sur ${qte(k.journees)} journées. Placez le curseur sur la plus petite commande où la marge remisée la retrouve, puis validez.`;
      },
      grandeur: () => ({ libelle: "Journées commandées au prix remisé", unite: "journées" }),
      cible: (c) => {
        const k = conditionsDeKerval(c);
        return { attendu: k.journeesPourLaMemeMarge, min: JOURNEES_DU_CURSEUR.min, max: JOURNEES_DU_CURSEUR.max };
      },
      zones: ["La remise est payée", "La remise n'est pas payée"],
      rates: () => ({
        dessous: "À cette commande, la marge après remise reste sous celle du prix catalogue : la remise n'est pas encore payée.",
        dessus: "Avec moins de journées, la marge du catalogue est encore retrouvée : cherchez la plus petite commande.",
      }),
      montrer: "Montrer la commande",
      lecture: (c, q) => {
        const k = conditionsDeKerval(c);
        const marge = auCentime(q * k.margeParJourneeRemisee);
        return [
          { libelle: "Chiffre d'affaires au prix remisé (HT)", montant: auCentime(q * k.prixRemise) },
          { libelle: "Coûts variables (HT)", montant: auCentime(q * k.coutVariable) },
          { libelle: "Marge après remise (HT)", montant: marge },
          { libelle: "Marge du prix catalogue à retrouver (HT)", montant: k.margeCatalogue },
          { libelle: "Marge en plus ou en moins", montant: auCentime(marge - k.margeCatalogue), fort: true },
        ];
      },
      droites: (c) => {
        const k = conditionsDeKerval(c);
        return {
          produit: (q) => q * k.margeParJourneeRemisee,
          cout: () => k.margeCatalogue,
          libelles: ["Marge après remise de la commande", "Marge du prix catalogue sur la commande d'aujourd'hui"],
        };
      },
      explication: (c) => {
        const k = conditionsDeKerval(c);
        const avant = k.journeesPourLaMemeMarge - 1;
        return [
          `À ${qte(avant)} journées, la marge remisée (${eur(auCentime(avant * k.margeParJourneeRemisee))}) reste sous ${eur(k.margeCatalogue)} ; à ${qte(k.journeesPourLaMemeMarge)}, elle la dépasse (${eur(auCentime(k.journeesPourLaMemeMarge * k.margeParJourneeRemisee))}). Une remise de ${pct(k.remise)} se paie par ${qte(k.journeesEnPlus)} journées de plus, et non ${qte(k.journeesAuProrata)} : chaque journée remisée ne laisse que ${eur(k.margeParJourneeRemisee)} de marge au lieu de ${eur(auCentime(k.prix - k.coutVariable))}.`,
          "C'est la marge qu'il faut retrouver, pas le chiffre d'affaires : la marge remisée monte moins vite avec chaque journée, et l'écart se rattrape en volume. L'étape suivante en fait le calcul.",
        ];
      },
    },
    {
      id: "contrepartie",
      type: "montants",
      titre: "La contrepartie de la remise",
      notions: ["contribution_margin", "price_floor"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Sans formule cette fois. Combien de journées faut-il vendre à ${k.client}, au prix remisé, pour que l'affaire retrouve la marge du prix catalogue ? Donnez le prix remisé d'une journée, la marge qu'elle laisse, la commande qui paie la remise (à la journée supérieure) et les journées à obtenir en plus.`;
      },
      champs: (c) => {
        const k = conditionsDeKerval(c);
        return [
          { libelle: "Prix remisé d'une journée (HT)", attendu: k.prixRemise, calcul: `${eur(k.prix)} × (1 − ${pct(k.remise)}) = ${eur(k.prixRemise)}` },
          { libelle: "Marge d'une journée remisée (HT)", attendu: k.margeParJourneeRemisee, calcul: `${eur(k.prixRemise)} − ${eur(k.coutVariable)} = ${eur(k.margeParJourneeRemisee)}` },
          {
            libelle: "Commande qui paie la remise",
            attendu: k.journeesPourLaMemeMarge,
            calcul: `${eur(k.margeCatalogue)} ÷ ${eur(k.margeParJourneeRemisee)} = ${qte(auCentime(k.margeCatalogue / k.margeParJourneeRemisee))}, soit ${qte(k.journeesPourLaMemeMarge)} journées à la journée supérieure`,
          },
          { libelle: "Journées à obtenir en plus", attendu: k.journeesEnPlus, calcul: `${qte(k.journeesPourLaMemeMarge)} − ${qte(k.journees)} = ${qte(k.journeesEnPlus)}` },
        ];
      },
      explication: (c) => {
        const k = conditionsDeKerval(c);
        return [
          `${qte(k.journeesEnPlus)} journées de plus sur ${qte(k.journees)}, c'est ${pct(k.journeesEnPlus / k.journees)} de commande en plus pour ${pct(k.remise)} de remise. C'est le principe de toute concession en négociation : elle s'échange contre une contrepartie (un volume, un engagement, un paiement plus rapide), elle ne se donne pas.`,
        ];
      },
    },
    {
      id: "le-credit",
      type: "montants",
      titre: "Ce que coûte le délai de paiement",
      notions: ["payment_terms"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `${k.client} paie à ${qte(k.delai)} jours. En attendant, le cabinet finance le net commercial, ${eur(k.netCommercial)} HT, sur son découvert à ${pct(k.taux)} l'an. Calculez le coût du crédit accordé (net commercial × taux × délai ÷ 360), puis le résultat de l'affaire : la marge après remise moins ce coût.`;
      },
      champs: (c) => {
        const k = conditionsDeKerval(c);
        return [
          { libelle: "Coût du crédit accordé", attendu: k.coutDuCredit, calcul: `${eur(k.netCommercial)} × ${pct(k.taux)} × ${qte(k.delai)} ÷ 360 = ${eur(k.coutDuCredit)}` },
          { libelle: "Résultat de l'affaire (HT)", attendu: k.resultat, calcul: `${eur(k.marge)} − ${eur(k.coutDuCredit)} = ${eur(k.resultat)}` },
        ];
      },
      explication: (c) => {
        const k = conditionsDeKerval(c);
        return [
          `Pendant ${qte(k.delai)} jours, le cabinet prête ${eur(k.netCommercial)} à son client, et ce prêt lui coûte ${eur(k.coutDuCredit)}, qu'aucune facture ne montre. L'affaire rapporte ${eur(k.resultat)}, et non les ${eur(k.margeCatalogue)} du prix catalogue.`,
        ];
      },
    },
    {
      id: "qui-avance-la-tva",
      type: "choix",
      titre: "Hors taxes ou toutes taxes comprises",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `${k.client} devra ${eur(k.netAPayerSansEscompte)} TTC à ${qte(k.delai)} jours. Pourtant, le crédit accordé s'est calculé sur ${eur(k.netCommercial)} HT. Pourquoi ?`;
      },
      options: (c) => {
        const k = conditionsDeKerval(c);
        return [
          {
            texte: "La TVA d'un service n'est due qu'à l'encaissement : le cabinet ne l'avance pas",
            juste: true,
            retour: `Oui. ${k.entreprise} vend des prestations de services : la TVA de la facture, ${eur(k.tvaSansEscompte)}, ne devient due à l'État que lorsque ${k.client} paie. D'ici là, le cabinet ne la verse pas, et n'a donc à financer que le hors taxes.`,
          },
          {
            texte: "La TVA ne se finance jamais : c'est l'argent de l'État",
            juste: false,
            retour: `Non : un vendeur de biens doit la TVA à la livraison, payé ou non, et la finance jusqu'au paiement de son client. Ici, c'est la nature de l'opération, un service, qui épargne au cabinet ces ${eur(k.tvaSansEscompte)}.`,
          },
          {
            texte: "Le client paie la TVA comptant, et le hors taxes à l'échéance",
            juste: false,
            retour: `Non : ${k.client} paie sa facture en une fois, ${eur(k.netAPayerSansEscompte)} TTC à ${qte(k.delai)} jours. Ce qui compte est la date où la TVA devient due à l'État, et pour un service, c'est l'encaissement.`,
          },
          {
            texte: "Le cabinet a opté pour les débits",
            juste: false,
            retour: `Non, et ce serait l'inverse : avec l'option pour les débits, la TVA serait due dès la facture, et le cabinet la financerait jusqu'au paiement. Il financerait alors ${eur(k.debits.base)} TTC.`,
          },
        ];
      },
    },
    {
      id: "predire-l-escompte",
      type: "choix",
      titre: "Pariez sur l'escompte",
      notions: ["payment_terms"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Avant de calculer, pariez. Avec l'escompte, ${k.client} paie à ${qte(k.joursDEscompte)} jours au lieu de ${qte(k.delai)}. Le cabinet se finance à ${pct(k.taux)} l'an. Pour lui, céder ${pct(k.tauxDEscompte)} pour être payé ${qte(k.joursDAvance)} jours plus tôt, c'est…`;
      },
      options: (c) => {
        const k = conditionsDeKerval(c);
        const cher = k.tauxAnnuelDeLEscompte > k.taux;
        const voir = "Faites varier le délai à l'étape suivante : le curseur montre ce que l'escompte coûte face au découvert qu'il évite.";
        return [
          { texte: `Moins cher que le découvert : ${pct(k.tauxDEscompte)}, c'est bien moins que ${pct(k.taux)}`, juste: !cher, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus cher que le découvert, une fois ramené à l'année", juste: cher, retour: `Bon pari. ${voir}` },
        ];
      },
    },
    {
      id: "l-escompte-au-curseur",
      type: "curseur",
      titre: "L'escompte face au découvert",
      notions: ["payment_terms"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Faites varier le délai de paiement de ${k.client} sans escompte, de ${qte(DELAI_DU_CURSEUR.min)} à ${qte(DELAI_DU_CURSEUR.max)} jours. Une droite donne le découvert que le paiement à ${qte(k.joursDEscompte)} jours évite au cabinet : le net financier, ${eur(k.netFinancier)} HT, encaissé plus tôt de (délai − ${qte(k.joursDEscompte)}) jours, à ${pct(k.taux)} l'an. L'autre donne l'escompte qu'il cède, ${eur(k.escompte)}. Placez le curseur sur le plus petit délai où le découvert évité couvre l'escompte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Délai de paiement sans escompte", unite: "jours" }),
      cible: (c) => {
        const k = conditionsDeKerval(c);
        return { attendu: k.delaiDuCurseur, min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max };
      },
      zones: ["L'escompte coûte moins que le découvert évité", "L'escompte coûte plus que le découvert évité"],
      rates: () => ({
        dessous: "À ce délai, l'escompte coûte encore plus que le découvert qu'il évite.",
        dessus: "Plus court, le découvert évité couvre encore l'escompte : cherchez le plus petit délai.",
      }),
      montrer: "Montrer le délai",
      lecture: (c, j) => {
        const k = conditionsDeKerval(c);
        const evite = coutDeLAvance(k.netFinancier, k.taux, j - k.joursDEscompte);
        return [
          { libelle: "Escompte cédé", montant: k.escompte },
          { libelle: `Découvert évité par le paiement à ${qte(k.joursDEscompte)} jours`, montant: evite },
          { libelle: "Découvert évité moins escompte", montant: auCentime(evite - k.escompte), fort: true },
        ];
      },
      droites: (c) => {
        const k = conditionsDeKerval(c);
        return {
          produit: (j) => (k.netFinancier * k.taux * (j - k.joursDEscompte)) / JOURS_DE_L_ANNEE_BANCAIRE,
          cout: () => k.escompte,
          libelles: ["Découvert évité par le paiement anticipé", "Escompte cédé au client"],
        };
      },
      explication: (c) => {
        const k = conditionsDeKerval(c);
        return [
          `À ${qte(k.delai)} jours, le délai convenu, l'escompte coûte ${eur(k.escompte)} pour ${eur(k.decouvertEvite)} de découvert évité. Les deux droites ne se croisent qu'à ${qte(auCentime(k.delaiDEgalite))} jours : il faut un délai de ${qte(k.delaiDuCurseur)} jours pour que le découvert évité couvre l'escompte. Le découvert se compte sur le net financier et sur les seuls jours d'avance : en payant à ${qte(k.joursDEscompte)} jours, ${k.client} laisse encore ${qte(k.joursDEscompte)} jours de crédit.`,
          `Or un délai convenu entre professionnels ne dépasse pas ${qte(DELAI_MAXIMAL_CONVENU.joursDeLaFacture)} jours : dans la loi, cet escompte coûte toujours plus au cabinet que son découvert. Il ne deviendrait utile que face à un client en retard d'au moins ${qte(k.retardDuCurseur)} jours, et un retard se sanctionne par des pénalités, il ne s'achète pas. Ramener ce calcul à l'année donne le taux annuel de l'escompte : c'est l'étape suivante.`,
        ];
      },
    },
    {
      id: "le-taux-annuel",
      type: "montants",
      titre: "Le taux annuel de l'escompte",
      notions: ["payment_terms"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Le taux annuel d'un escompte = taux ÷ (1 − taux) × 360 ÷ jours d'avance. Calculez les jours d'avance que ${k.client} donne en payant à ${qte(k.joursDEscompte)} jours au lieu de ${qte(k.delai)}, le taux annuel de l'escompte (en %, au centième), puis le découvert que ces jours évitent (net financier × ${pct(k.taux)} × jours d'avance ÷ 360).`;
      },
      champs: (c) => {
        const k = conditionsDeKerval(c);
        return [
          { libelle: "Jours d'avance", attendu: k.joursDAvance, calcul: `${qte(k.delai)} − ${qte(k.joursDEscompte)} = ${qte(k.joursDAvance)}` },
          {
            libelle: "Taux annuel de l'escompte (%)",
            attendu: enPourcent(k.tauxAnnuelDeLEscompte),
            tolerance: 0.01,
            calcul: `${pct(k.tauxDEscompte)} ÷ ${pct(1 - k.tauxDEscompte)} × 360 ÷ ${qte(k.joursDAvance)} = ${pct(k.tauxAnnuelDeLEscompte)}`,
          },
          { libelle: "Découvert évité", attendu: k.decouvertEvite, calcul: `${eur(k.netFinancier)} × ${pct(k.taux)} × ${qte(k.joursDAvance)} ÷ 360 = ${eur(k.decouvertEvite)}` },
        ];
      },
      explication: (c) => {
        const k = conditionsDeKerval(c);
        return [
          `Céder ${pct(k.tauxDEscompte)} pour ${qte(k.joursDAvance)} jours d'avance revient à emprunter à ${pct(k.tauxAnnuelDeLEscompte)} l'an, quand le découvert coûte ${pct(k.taux)}. C'est la comparaison du curseur, ramenée à l'année : ${eur(k.escompte)} d'escompte pour ${eur(k.decouvertEvite)} de découvert évité, dans le même rapport que ${pct(k.tauxAnnuelDeLEscompte)} pour ${pct(k.taux)}.`,
          `Le taux ÷ (1 − taux) vient de la base : l'escompte se rapporte à ce que le client avance, le net financier (${eur(k.escompte)} ÷ ${eur(k.netFinancier)}), et non au net commercial.`,
        ];
      },
    },
    {
      id: "quel-raisonnement",
      type: "choix",
      titre: "Garder l'escompte ou le retirer",
      notions: ["payment_terms"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Le directeur ${dE(k.entreprise)} se demande s'il garde l'escompte de ${pct(k.tauxDEscompte)} dans ses conditions de vente. Quel raisonnement lui présentez-vous ?`;
      },
      options: (c) => {
        const k = conditionsDeKerval(c);
        const cher = k.tauxAnnuelDeLEscompte > k.taux;
        return [
          {
            texte: cher ? `Le retirer : ramené à l'année, il coûte ${pct(k.tauxAnnuelDeLEscompte)}, plus que le découvert` : `Le garder : ramené à l'année, il coûte ${pct(k.tauxAnnuelDeLEscompte)}, moins que le découvert`,
            juste: true,
            retour: cher
              ? `Oui : ${pct(k.tauxAnnuelDeLEscompte)} l'an contre ${pct(k.taux)}. L'escompte ne se justifierait que si le découvert manquait (le plafond atteint) ou coûtait plus cher, ou face à un client qui risque de ne pas payer.`
              : `Oui : ${pct(k.tauxAnnuelDeLEscompte)} l'an contre ${pct(k.taux)}. Le cabinet se finance moins cher en offrant l'escompte qu'en attendant sur son découvert.`,
          },
          {
            texte: `Le garder : ${pct(k.tauxDEscompte)}, c'est bien moins que les ${pct(k.taux)} du découvert`,
            juste: false,
            retour: `Non : ${pct(k.tauxDEscompte)} se paient pour ${qte(k.joursDAvance)} jours seulement, ${pct(k.taux)} pour une année entière. On ne compare deux taux que sur la même durée : ramené à l'année, l'escompte coûte ${pct(k.tauxAnnuelDeLEscompte)}.`,
          },
          {
            texte: `Le retirer : ${eur(k.escompte)} d'escompte, c'est plus que le crédit de ${qte(k.delai)} jours (${eur(k.coutDuCredit)})`,
            juste: false,
            retour: `Non, le calcul compare mal : en payant à ${qte(k.joursDEscompte)} jours, ${k.client} laisse encore ${qte(k.joursDEscompte)} jours de crédit, et l'escompte n'évite que ${qte(k.joursDAvance)} jours de découvert sur le net financier, ${eur(k.decouvertEvite)}. Ce raccourci se trompe dès que le délai s'allonge : c'est au taux annuel qu'on juge un escompte.`,
          },
          {
            texte: `Le garder : il fait rentrer l'argent ${qte(k.joursDAvance)} jours plus tôt`,
            juste: false,
            retour: `Plus tôt, oui, mais à ${pct(k.tauxAnnuelDeLEscompte)} l'an : le découvert finance ces ${qte(k.joursDAvance)} jours pour ${eur(k.decouvertEvite)}, quand l'escompte en coûte ${eur(k.escompte)}. Encaisser vite ne vaut que si l'argent coûte plus cher ailleurs.`,
          },
        ];
      },
    },
    {
      id: "escompte-maximal",
      type: "montants",
      titre: "Le plus fort escompte que le découvert justifie",
      notions: ["payment_terms"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Le directeur garderait un escompte, mais pas plus cher que son découvert. Pour ${qte(k.joursDAvance)} jours d'avance, quel est le plus fort escompte qu'il peut offrir ? Partez du coût du découvert sur ces jours, rapporté au net financier ; remontez au taux d'escompte (en %, au centième) ; puis donnez son montant sur la facture de ${k.client}.`;
      },
      champs: (c) => {
        const k = conditionsDeKerval(c);
        const precis = `${(Math.round(k.escompteMaximal * 1e6) / 1e4).toLocaleString("fr-FR", { maximumFractionDigits: 4 })} %`;
        return [
          {
            libelle: `Coût du découvert sur ${qte(k.joursDAvance)} jours (%)`,
            attendu: enPourcent(k.decouvertSurLAvance),
            tolerance: 0.01,
            calcul: `${pct(k.taux)} × ${qte(k.joursDAvance)} ÷ 360 = ${pct(k.decouvertSurLAvance)}`,
          },
          {
            libelle: "Escompte le plus fort (%)",
            attendu: enPourcent(k.escompteMaximal),
            tolerance: 0.01,
            calcul: `L'escompte vaut le découvert quand taux ÷ (1 − taux) = ${pct(k.decouvertSurLAvance)}, soit taux = ${pct(k.decouvertSurLAvance)} ÷ (1 + ${pct(k.decouvertSurLAvance)}) = ${precis}`,
          },
          {
            libelle: "Escompte le plus fort sur la facture",
            attendu: k.escompteMaximalEnEuros,
            tolerance: 2,
            calcul: `${eur(k.netCommercial)} × ${precis} = ${eur(k.escompteMaximalEnEuros)}`,
          },
        ];
      },
      explication: (c) => {
        const k = conditionsDeKerval(c);
        const pas = LEVIERS_DU_LABORATOIRE.escompte.pas / 100;
        const sous = Math.floor(k.escompteMaximal / pas + 1e-9) * pas;
        const dessus = sous + pas;
        return [
          `À ${pct(k.escompteMaximal)}, l'escompte vaut exactement le découvert qu'il évite sur le net financier : son taux annuel est de ${pct(k.taux)}. Le ${pct(k.tauxDEscompte)} du commercial en est loin ; il faudrait un découvert à ${pct(k.tauxAnnuelDeLEscompte)} pour le justifier.`,
          `La marge est étroite : à ${pct(sous)}, l'escompte coûte ${pct(tauxAnnuelDeLEscompte(sous, k.joursDAvance))} l'an ; à ${pct(dessus)}, déjà ${pct(tauxAnnuelDeLEscompte(dessus, k.joursDAvance))}. Un escompte se fixe à partir du coût du financement et des jours d'avance qu'il achète, pas par habitude.`,
        ];
      },
    },
    {
      id: "l-option-pour-les-debits",
      type: "montants",
      titre: "Variante : l'option pour les débits",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Variante : supposez qu'${k.entreprise} ait opté pour les débits. La TVA de la facture serait due dès la facture, que ${k.client} ait payé ou non ; le cours la compte versée tout de suite, donc financée pendant tout le délai. Sans escompte, à ${qte(k.delai)} jours, calculez la TVA que le cabinet avancerait, le coût du crédit sur ce qu'il financerait alors, et ce que l'option coûterait de plus sur cette affaire.`;
      },
      champs: (c) => {
        const k = conditionsDeKerval(c);
        return [
          { libelle: "TVA avancée pour le client", attendu: k.tvaSansEscompte, calcul: `${eur(k.netCommercial)} × ${pct(k.tauxDeTva)} = ${eur(k.tvaSansEscompte)}` },
          { libelle: "Coût du crédit, TVA avancée comprise", attendu: k.debits.coutDuCredit, calcul: `${eur(k.debits.base)} TTC × ${pct(k.taux)} × ${qte(k.delai)} ÷ 360 = ${eur(k.debits.coutDuCredit)}` },
          {
            libelle: "Ce que l'option coûte de plus",
            attendu: k.debits.surcout,
            calcul: `${eur(k.debits.coutDuCredit)} − ${eur(k.coutDuCredit)} = ${eur(k.debits.surcout)}, soit ${eur(k.tvaSansEscompte)} × ${pct(k.taux)} × ${qte(k.delai)} ÷ 360`,
          },
        ];
      },
      explication: (c) => {
        const k = conditionsDeKerval(c);
        return [
          `Avec l'option, le cabinet financerait ${eur(k.debits.base)} TTC au lieu de ${eur(k.netCommercial)} HT : le même délai coûterait ${eur(k.debits.surcout)} de plus, et l'affaire ne rapporterait que ${eur(k.debits.resultat)}. C'est la situation d'un vendeur de biens, dont la TVA est due à la livraison.`,
          `La base du crédit client dépend de ce que l'entreprise vend : hors taxes pour un service au régime des encaissements, toutes taxes comprises pour un bien ou avec l'option pour les débits. Se tromper de base, c'est se tromper de ${pct(k.tauxDeTva)} sur le coût du délai.`,
        ];
      },
    },
    {
      id: "le-laboratoire-des-conditions",
      type: "simulation",
      titre: "Le laboratoire des conditions",
      notions: ["payment_terms", "contribution_margin"],
      question: (c) => {
        const k = conditionsDeKerval(c);
        return `Le départ est l'affaire du chapitre. Faites varier la remise, l'escompte, le délai de paiement et les journées commandées : le tableau suit la marge, le crédit et le résultat de l'affaire payée à l'échéance, puis l'escompte, jugé à part par son taux annuel. Le graphique suit ce taux selon le délai, face aux ${pct(k.taux)} du découvert. Relevez le défi, puis cherchez-en un autre chemin.`;
      },
      leviers: (c) => {
        const k = conditionsDeKerval(c);
        const l = LEVIERS_DU_LABORATOIRE;
        return [
          { code: "remise", libelle: "Remise sur la commande", unite: "%", ...l.remise, depart: enPourcent(k.remise) },
          { code: "escompte", libelle: `Escompte pour un paiement sous ${qte(k.joursDEscompte)} jours`, unite: "%", ...l.escompte, depart: enPourcent(k.tauxDEscompte) },
          { code: "delai", libelle: "Délai de paiement sans escompte", unite: "jours", ...l.delai, depart: k.delai },
          { code: "journees", libelle: "Journées commandées", unite: "journées", ...l.journees, depart: k.journees },
        ];
      },
      lecture: (c, p) => {
        const k = conditionsDeKerval(c);
        const x = laboratoireDesConditions(c, p);
        const d = laboratoireDesConditions(c, { remise: enPourcent(k.remise), escompte: enPourcent(k.tauxDEscompte), delai: k.delai, journees: k.journees });
        return [
          { libelle: "Net commercial (HT)", montant: x.netCommercial, reference: d.netCommercial },
          { libelle: "Marge après remise (HT)", montant: x.marge, reference: d.marge },
          { libelle: "Marge cédée par la remise", montant: -x.margeCedee, reference: -d.margeCedee, effet: true },
          { libelle: "Coût du crédit accordé", montant: -x.coutDuCredit, reference: -d.coutDuCredit, effet: true },
          { libelle: "Résultat de l'affaire, payée à l'échéance", montant: x.resultat, reference: d.resultat, fort: true },
          { libelle: "Taux annuel de l'escompte", montant: enPourcent(x.tauxAnnuel), unite: "%", reference: enPourcent(d.tauxAnnuel) },
          { libelle: "Escompte cédé, s'il est pris", montant: x.escompte, reference: d.escompte },
          { libelle: "Découvert que l'escompte évite", montant: x.decouvertEvite, reference: d.decouvertEvite },
          { libelle: "Effet de l'escompte, s'il est pris", montant: x.effetDeLEscompte, reference: d.effetDeLEscompte, effet: true },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      // Le taux annuel de l'escompte selon le délai : t ÷ (1 − t) × 360 ÷ (délai − 10), une hyperbole qui
      // descend à mesure que le délai s'allonge, face au taux du découvert, une droite plate.
      graphique: (c) => {
        const k = conditionsDeKerval(c);
        return {
          levier: "delai",
          unite: "%",
          courbes: [
            { libelle: "Taux annuel de l'escompte", valeur: (p) => laboratoireDesConditions(c, p).tauxAnnuel * 100 + 0 },
            { libelle: "Taux du découvert", valeur: () => k.taux * 100 },
          ],
        };
      },
      defi: (c) => {
        const k = conditionsDeKerval(c);
        const demandee = enPourcent(REMISE_DEMANDEE_AU_LABORATOIRE);
        const limite = DELAI_MAXIMAL_CONVENU.joursDeLaFacture;
        // Une solution : la remise demandée, payée par le volume (la plus petite commande qui garde le
        // résultat au délai convenu), et un escompte rond sous le plus fort que le découvert justifie.
        const { min, max } = LEVIERS_DU_LABORATOIRE.journees;
        let journees = max;
        for (let j = max; j >= min; j--) {
          if (laboratoireDesConditions(c, { remise: demandee, escompte: 0, delai: k.delai, journees: j }).resultat >= k.resultat) journees = j;
        }
        const solution = { remise: demandee, escompte: enPourcent(ESCOMPTE_DE_LA_SOLUTION), delai: k.delai, journees };
        return {
          consigne: `${k.client} demande ${qte(demandee)} % de remise. Accordez-la sans que l'affaire rapporte moins qu'aujourd'hui (${eur(k.resultat)}), sans dépasser ${qte(limite)} jours de délai, et avec un escompte qui ne coûte pas plus que le découvert, ou sans escompte.`,
          atteint: (p) => {
            const x = laboratoireDesConditions(c, p);
            return p.remise! >= demandee && p.delai! <= limite && x.resultat >= k.resultat && !x.escompteTropCher;
          },
          indice: (p) => {
            const x = laboratoireDesConditions(c, p);
            if (p.remise! < demandee) return `La remise est de ${qte(p.remise!)} % : ${k.client} en demande ${qte(demandee)}.`;
            if (p.delai! > limite) return `Un délai de ${qte(p.delai!)} jours dépasse le délai maximal convenu entre professionnels, ${qte(limite)} jours.`;
            if (x.resultat < k.resultat)
              return `L'affaire rapporte ${eur(x.resultat)} : il manque ${eur(auCentime(k.resultat - x.resultat))}. Chaque journée en plus laisse ${eur(auCentime(x.prixRemise - k.coutVariable))} de marge, moins son crédit ; un délai plus court coûte moins de crédit.`;
            return `L'escompte coûte ${pct(x.tauxAnnuel)} l'an, plus que les ${pct(k.taux)} du découvert : à ce délai, il ne doit pas dépasser ${pct(x.escompteMaximal)}. Baissez-le, ou retirez-le.`;
          },
          solution,
        };
      },
      explication: (c, p) => {
        const k = conditionsDeKerval(c);
        const x = laboratoireDesConditions(c, p);
        return [
          `Défi relevé : ${qte(p.remise!)} % de remise sur ${qte(p.journees!)} journées, payées à ${qte(p.delai!)} jours, laissent ${eur(x.resultat)}, pas moins que les ${eur(k.resultat)} d'aujourd'hui. ${p.escompte! > 0 ? `L'escompte de ${qte(p.escompte!)} % coûte ${pct(x.tauxAnnuel)} l'an : il ne coûte pas plus que le découvert.` : "Sans escompte, il ne reste rien à juger de ce côté."}`,
          "Chaque concession se paie par une contrepartie : la remise par le volume, le délai par son crédit. Le graphique montre la troisième leçon : le taux annuel d'un même escompte grimpe quand le délai raccourcit, parce qu'il achète moins de jours d'avance. Raccourcir le délai coûte moins de crédit, mais oblige à baisser l'escompte.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payment_terms", "contribution_margin"],
      tableau: (c) => tableauDesConditions(conditionsDeKerval(c)),
      texte: (c) => {
        const k = conditionsDeKerval(c);
        return [
          `Sur l'affaire ${k.client}, la remise de ${pct(k.remise)} cède ${eur(k.margeCedee)} de marge (${pct(k.partDeLaMargeCedee)} de la marge pour ${pct(k.remise)} du prix), et le délai de ${qte(k.delai)} jours coûte ${eur(k.coutDuCredit)} de crédit : l'affaire rapporte ${eur(k.resultat)}, et non les ${eur(k.margeCatalogue)} du prix catalogue. L'escompte de ${pct(k.tauxDEscompte)}, s'il est pris, coûterait ${eur(k.escompte)} pour ${eur(k.decouvertEvite)} de découvert évité : ${pct(k.tauxAnnuelDeLEscompte)} l'an, plus que les ${pct(k.taux)} du découvert.`,
          `Trois règles. Une remise sort tout entière de la marge, et se paie par une contrepartie : ${qte(k.journeesEnPlus)} journées de plus ici. Un délai se finance, hors taxes pour un service dont la TVA n'est due qu'à l'encaissement, toutes taxes comprises pour un bien ou avec l'option pour les débits. Un escompte se juge à son taux annuel, sur les seuls jours d'avance qu'il achète, face au coût du financement.`,
          "Au niveau de l'examen, vous savez établir une facture de la remise au net à payer, chiffrer la marge qu'une remise cède et la contrepartie qui la paie, calculer le coût d'un crédit client sur la bonne base, ramener un escompte à son taux annuel, et remonter au plus fort escompte qu'un financement justifie.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût du crédit client = montant financé × taux × délai ÷ 360 (HT pour un service au régime des encaissements, TTC pour un bien). Taux annuel de l'escompte = taux ÷ (1 − taux) × 360 ÷ jours d'avance. Escompte le plus fort = r × j ÷ 360 ÷ (1 + r × j ÷ 360).",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// L'EXPORT DE L'ARÈNE, GARDÉ POUR CELUI QUI LE LIT ENCORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @deprecated L'affaire telle que le chapitre la calculait sur l'année de l'arène : la vente à crédit du
 * cas (`c.venteCredit`), le taux de son emprunt (`c.pret`), le coût variable de son mois (`c.gestion`, ce
 * que `negociation(c).coutVariable` donnait) et les conditions de remises.ts. Le chapitre et son cas lisent
 * désormais `conditionsDeKerval`, sur la fiche du monde du cours. Gardée telle quelle, sans rien importer
 * de l'arène (le cas n'est qu'un type), pour le cas qui la lit encore et n'est pas passé sur le monde du
 * cours : la-remise-du-grand-compte (palier 3).
 */
export function affaire(c: Cas) {
  const v = c.venteCredit;
  const coutVariable = c.gestion.coutVariableUnitaire;
  const arrondi = auCentimeDeLArene;
  const auDixieme = (x: number) => Math.round(x * 10) / 10;
  const brut = arrondi(v.quantite * v.prixUnitaire);
  const remise = arrondi(brut * TAUX_DE_REMISE);
  const netCommercial = arrondi(brut - remise);
  const escompte = arrondi(netCommercial * TAUX_D_ESCOMPTE);
  const netFinancier = arrondi(netCommercial - escompte);
  const coutsVariables = arrondi(v.quantite * coutVariable);
  const marge = arrondi(netCommercial - coutsVariables);
  const margeSansRemise = arrondi(brut - coutsVariables);
  const coutDuCredit = arrondi((netCommercial * c.pret.tauxAnnuel * v.delai) / JOURS_PAR_AN);
  const prixRemise = arrondi(v.prixUnitaire * (1 - TAUX_DE_REMISE));
  const quantitePourLaMemeMarge = Math.ceil(margeSansRemise / (prixRemise - coutVariable) - 1e-9);
  return {
    client: v.client,
    quantite: v.quantite,
    prix: v.prixUnitaire,
    delai: v.delai,
    brut,
    tauxDeRemise: TAUX_DE_REMISE * 100,
    remise,
    netCommercial,
    tauxDEscompte: TAUX_D_ESCOMPTE * 100,
    joursDEscompte: JOURS_D_ESCOMPTE,
    escompte,
    netFinancier,
    coutVariable,
    coutsVariables,
    marge,
    margeSansRemise,
    margeCedee: arrondi(margeSansRemise - marge),
    partDeLaMargeCedee: auDixieme(((margeSansRemise - marge) / margeSansRemise) * 100),
    tauxDeLEmprunt: auDixieme(c.pret.tauxAnnuel * 100),
    coutDuCredit,
    resultatDeLAffaire: arrondi(marge - coutDuCredit),
    tauxAnnuelDeLEscompte: auDixieme((TAUX_D_ESCOMPTE / (1 - TAUX_D_ESCOMPTE)) * (JOURS_PAR_AN / (v.delai - JOURS_D_ESCOMPTE)) * 100),
    prixRemise,
    quantitePourLaMemeMarge,
    enPlus: quantitePourLaMemeMarge - v.quantite,
  };
}
