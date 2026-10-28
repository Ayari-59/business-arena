import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { coutDeLAvance } from "../monde/facture";
import {
  DELAI_MAXIMAL_CONVENU,
  JOURS_DE_L_ANNEE_BANCAIRE,
  JOURS_DE_L_ANNEE_CIVILE,
  JOURS_DU_TRIMESTRE,
  MAJORATION_DU_TAUX_BCE,
  MULTIPLE_DU_TAUX_LEGAL,
  NOVA_DELAIS,
  TAUX_D_INTERET_LEGAL,
  TAUX_DE_REFINANCEMENT_BCE,
  type FicheDesDelaisDeNova,
} from "../monde/delais-et-tva";
import {
  coutDeLAffacturage,
  coutDeLEscompte,
  coutDuDecouvert,
  creancesDuTrimestre,
  factureDeCampusTech,
  joursDeDecouvertQuiValentLEscompte,
  mobiliserUneFacture,
  retardDeCampusTech,
  tauxDesPenalites,
} from "../monde/delais";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE CLIENT QUI PAIE TARD, DÉLAI, RETARD, ESCOMPTE ET AFFACTURAGE (BTS GPME, palier 2).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : NOVA en N + 1
 * a une fiche figée (monde/delais-et-tva.ts, `NOVA_DELAIS`) et son client CampusTech se calcule par le
 * modèle du cours (monde/delais.ts, parties 5 et 6 : `creancesDuTrimestre`, `retardDeCampusTech`,
 * `mobiliserUneFacture`, `joursDeDecouvertQuiValentLEscompte`). Une évolution du moteur ne change rien.
 *
 * L'objet : CampusTech, une chaîne de magasins, facturée le 20 de chaque mois. DÉCISION DU
 * PROPRIÉTAIRE : son délai CONVENU est de 60 jours, le maximum que la loi permet entre professionnels,
 * et dans le monde du cours elle PAIE À L'ÉCHÉANCE. Le chapitre pose une HYPOTHÈSE (la fiche,
 * `RETARD_SUPPOSE_DE_CAMPUSTECH`) : SI elle payait 20 jours en retard, à 80 jours (`delaiSiRetard`) ;
 * ce serait un retard, qui ouvrirait droit à des pénalités de retard et à l'indemnité forfaitaire de
 * 40 € par facture. Tout ce qui chiffre le retard (les créances en retard, le délai moyen qu'il
 * donnerait, son coût, ce qui se réclame, la facture mobilisée, le laboratoire) se lit dans cette
 * hypothèse ; l'étape a-l-echeance revient au réel. NOVA vend des biens : la TVA est due à la livraison,
 * NOVA finance chaque facture toutes taxes comprises. Le chapitre chiffre les créances (facture par
 * facture, pas au prorata des jours), le délai moyen et ce qu'il cache, le coût du crédit et du
 * retard, ce que la loi permet de réclamer, puis les trois façons de financer l'attente : le
 * découvert, l'escompte (sauf bonne fin : la banque reprend la facture impayée à l'échéance) et
 * l'affacturage (commission et financement, avec la garantie de l'impayé).
 *
 * Ce qui a disparu : le rejeu de l'arène (l'année jouée avec l'escompte ou l'affacturage au dernier
 * trimestre), la cession d'office, l'affacturage forfaitaire de 2,5 % et l'escompte plafonné à 60 %
 * des créances du moteur, et les créances calculées « ventes × 80 ÷ 90 » hors taxes (défaut 4 de
 * l'audit : une créance est TTC).
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026) :
 *   · guidé : intro, les-creances, le-delai-moyen, le-cout-du-credit (la formule est dans la question,
 *     qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-retard
 *     puis le-retard-au-curseur (jusqu'où, au plancher légal, ce que NOVA peut réclamer couvre le coût
 *     du retard) avant le-cout-du-retard ; predire-l-escompte puis l-escompte-ou-le-decouvert (un
 *     escompte de 60 jours coûte autant que 40 jours de découvert) avant une-facture-mobilisee ;
 *   · autonome : le-cout-du-retard, que-faire-du-retard, ce-que-cache-le-delai-moyen,
 *     une-facture-mobilisee (ni formule ni chiffres donnés ; la correction montre le chemin) ;
 *   · expert : le-prix-de-la-garantie (une critique de l'outil), a-l-echeance (une variante chiffrée),
 *     a-rebours (retrouver le retard et les pénalités à partir d'un relevé de banque), le
 *     laboratoire de la facture (le retard, le compte, la base des pénalités et l'outil au choix),
 *     puis la synthèse.
 */

/**
 * LE CALCUL À REBOURS, hypothèse du cours : au trimestre suivant, le relevé de la banque montre
 * qu'une facture de CampusTech escomptée a coûté 396,48 € à NOVA en tout (l'escompte jusqu'à
 * l'échéance convenue, puis le retard sur son découvert, la banque ayant repris la facture impayée).
 */
export const COUT_RELEVE_A_REBOURS = 396.48;

/** Les bornes du retard dans le premier curseur, en jours : un jour de retard au moins. */
export const RETARD_DU_CURSEUR = { min: 1, max: 120 } as const;

/** Les bornes des jours de découvert dans le second curseur : d'un compte jamais débiteur à tout le trimestre. */
export const DECOUVERT_DU_CURSEUR = { min: 0, max: JOURS_DU_TRIMESTRE } as const;

/** Les bornes du délai réel dans le laboratoire, et son pas : de CampusTech en avance à 60 jours de retard. */
export const DELAI_DU_LABORATOIRE = { min: 30, max: 120, pas: 5 } as const;

/** Le client qui paie tard se calcule sur la fiche de NOVA en N + 1. */
export const ENTREPRISES_DU_CLIENT_QUI_PAIE_TARD: readonly string[] = [NOVA_DELAIS.code];

const eur = (x: number) => montantEcrit(auCentime(x)).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const jours = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} jours`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
/** Le coût d'un jour de découvert sur une facture, au millième : 5,664 € (un arrondi au centime fausserait la division). */
const parJourExact = (k: { fct: { ttc: number }; taux: number }) => `${((k.fct.ttc * k.taux) / JOURS_DE_L_ANNEE_BANCAIRE).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} €`;

const FICHES: Readonly<Record<string, FicheDesDelaisDeNova>> = { [NOVA_DELAIS.code]: NOVA_DELAIS };

/** La fiche des délais de NOVA. */
export function ficheDe(c: Pick<Cas, "code">): FicheDesDelaisDeNova {
  const f = FICHES[c.code];
  if (!f) throw new Error(`Pas de fiche du client qui paie tard pour ${c.code}`);
  return f;
}

/** Les outils du laboratoire : attendre sur le compte, escompter, affacturer. */
export const OUTILS = ["attendre", "escompte", "affacturage"] as const;
export type Outil = (typeof OUTILS)[number];

/** Les bases des pénalités du laboratoire : le taux de la loi (BCE + 10 points), ou le plancher (3 fois le taux légal). */
export const BASES_DES_PENALITES = ["bce", "taux-legal"] as const;

/**
 * UNE FACTURE DE CAMPUSTECH FINANCÉE JUSQU'À SON PAIEMENT RÉEL (le laboratoire ; proposée au modèle
 * comme une généralisation de `mobiliserUneFacture`, qui compte toujours l'attente au découvert).
 * Le compte de NOVA pendant l'attente vaut un taux : le découvert s'il est débiteur, le placement
 * s'il est créditeur (l'argent qui n'est pas là ne rapporte pas).
 *   - Attendre : TTC × taux du compte × délai réel ÷ 360.
 *   - L'escompte, sauf bonne fin : TTC × taux de l'escompte × délai convenu ÷ 360, puis, si CampusTech
 *     paie en retard, la banque reprend la facture et NOVA attend les jours de retard sur son compte.
 *     Payée avant l'échéance, la facture escomptée a déjà payé ses intérêts jusqu'à l'échéance.
 *   - L'affacturage : la commission, plus le financement jusqu'au paiement réel ; le factor encaisse
 *     lui-même et garantit l'impayé.
 *   - Ce que NOVA peut réclamer : les pénalités de retard (TTC × taux × jours ÷ 365) et l'indemnité.
 */
export function financerUneFacture(f: FicheDesDelaisDeNova, p: { delaiReel: number; tauxDuCompte: number; base: (typeof BASES_DES_PENALITES)[number] }) {
  const fct = factureDeCampusTech(f);
  const b = f.banque;
  const convenu = f.campustech.delaiConvenu;
  const retard = Math.max(0, p.delaiReel - convenu);
  const couts: Record<Outil, number> = {
    attendre: coutDuDecouvert(fct.ttc, p.tauxDuCompte, p.delaiReel),
    escompte: auCentime(coutDeLEscompte(fct.ttc, b.escompte.taux, convenu) + coutDuDecouvert(fct.ttc, p.tauxDuCompte, retard)),
    affacturage: coutDeLAffacturage(fct.ttc, b.affacturage.commission, b.affacturage.tauxDeFinancement, p.delaiReel),
  };
  const leMoinsCher = OUTILS.reduce((m, k) => (couts[k] < couts[m] ? k : m));
  const penalites = auCentime((fct.ttc * tauxDesPenalites(p.base) * retard) / JOURS_DE_L_ANNEE_CIVILE);
  return { fct, convenu, retard, couts, leMoinsCher, penalites, reclamable: retard > 0 ? auCentime(penalites + f.penalites.indemnite) : 0 };
}

/** Tout ce que le chapitre et son cas lisent : la facture, les créances, le retard, les trois financements, les variantes. */
export function clientQuiPaieTard(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const ct = f.campustech;
  const b = f.banque;
  const fct = factureDeCampusTech(f);
  // L'hypothèse du chapitre : CampusTech paierait 20 jours en retard. Le réel : elle paie à l'échéance.
  const siRetard = creancesDuTrimestre(f, 4, { delai: ct.delaiSiRetard });
  const aLEcheance = creancesDuTrimestre(f, 4, { delai: ct.delaiConvenu });
  const r = retardDeCampusTech(f);
  const m = mobiliserUneFacture(f);
  const taux = b.tauxDuDecouvert;

  // Le crédit convenu, et la part qui finance la TVA déjà due.
  const creditDeLaTva = coutDeLAvance(fct.tva, taux, ct.delaiConvenu);

  // Le premier curseur : au plancher légal, jusqu'où l'indemnité comble l'écart entre le découvert et les pénalités.
  const tauxDuPlancher = tauxDesPenalites("taux-legal");
  const parJourDuPlancher = (fct.ttc * tauxDuPlancher) / JOURS_DE_L_ANNEE_CIVILE;
  const parJourDeLaLoi = (fct.ttc * r.tauxDesPenalites) / JOURS_DE_L_ANNEE_CIVILE;
  const parJourDuDecouvert = (fct.ttc * taux) / JOURS_DE_L_ANNEE_BANCAIRE;
  const joursQueCouvreLePlancher =
    parJourDuPlancher >= parJourDuDecouvert ? RETARD_DU_CURSEUR.max : Math.floor(f.penalites.indemnite / (parJourDuDecouvert - parJourDuPlancher) + 1e-9);
  const plancher = retardDeCampusTech(f, { base: "taux-legal" });

  // Le second curseur : les jours de découvert qui coûtent autant que l'escompte jusqu'à l'échéance.
  const joursQuiValentLEscompte = joursDeDecouvertQuiValentLEscompte(ct.delaiConvenu, b.escompte.taux, taux);

  // Le calcul à rebours : le retard, le jour du paiement, ce que NOVA peut réclamer.
  const retardARebours = Math.round((COUT_RELEVE_A_REBOURS - m.escompte) / ((fct.ttc * taux) / JOURS_DE_L_ANNEE_BANCAIRE));
  const paiementARebours = ct.delaiConvenu + retardARebours;
  const aRebours = retardDeCampusTech(f, { delaiReel: paiementARebours });

  return {
    f,
    ct,
    b,
    fct,
    siRetard,
    aLEcheance,
    r,
    m,
    taux,
    partDeCampusTech: auCentime((siRetard.campustechHT / siRetard.caHT) * 100),
    delaiMoyen: auDixieme(siRetard.delaiMoyen),
    delaiMoyenALEcheance: auDixieme(aLEcheance.delaiMoyen),
    creditDeLaTva,
    creditHorsTaxes: auCentime(r.coutDuCreditConvenuParFacture - creditDeLaTva),
    tauxDuPlancher,
    parJourDuPlancher: auCentime(parJourDuPlancher),
    parJourDeLaLoi: auCentime(parJourDeLaLoi),
    parJourDuDecouvert: auCentime(parJourDuDecouvert),
    joursQueCouvreLePlancher,
    plancher,
    joursQuiValentLEscompte: Math.round(joursQuiValentLEscompte),
    retardARebours,
    paiementARebours,
    aRebours,
  };
}

export type ClientQuiPaieTard = ReturnType<typeof clientQuiPaieTard>;

/** Ce que le plancher légal, puis le taux de la loi, permettent de réclamer pour une facture en retard de j jours. */
const reclamable = (k: ClientQuiPaieTard, j: number, t: number) => auCentime((k.fct.ttc * t * j) / JOURS_DE_L_ANNEE_CIVILE + (j > 0 ? k.f.penalites.indemnite : 0));

/** La position du laboratoire lue dans la fiche : le délai réel, le compte (en %), la base (1 ou 2), l'outil (0, 1, 2). */
function laboratoire(k: ClientQuiPaieTard, p: Readonly<Record<string, number>>) {
  const x = financerUneFacture(k.f, { delaiReel: p.delai!, tauxDuCompte: p.compte! / 100, base: BASES_DES_PENALITES[p.base! - 1]! });
  const outil = OUTILS[p.outil!]!;
  return { ...x, outil, choisi: x.couts[outil] };
}

const NOMS_DES_OUTILS: Readonly<Record<Outil, string>> = { attendre: "attendre sur le compte", escompte: "l'escompte", affacturage: "l'affacturage" };

export const LE_CLIENT_QUI_PAIE_TARD: Chapitre = {
  code: "le-client-qui-paie-tard",
  parcours: "gpme",
  palier: 2,
  blocs: ["BTS GPME Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME"],
  titre: "Le client qui paie tard : délai, escompte et affacturage",
  accroche:
    "Et si un client professionnel payait 20 jours après l'échéance convenue ? Ce serait un retard, et la loi le sanctionne. Les créances facture par facture, le coût du crédit et du retard, ce que l'entreprise peut réclamer, puis le découvert, l'escompte et l'affacturage : ce qu'ils coûtent, et quand chacun vaut mieux.",
  objectifs: [
    "Compter les créances clients facture par facture, toutes taxes comprises, et lire un délai moyen",
    "Distinguer le délai convenu, plafonné par la loi, et le retard",
    "Chiffrer le coût d'un retard, les pénalités de retard et l'indemnité forfaitaire",
    "Comparer le découvert, l'escompte et l'affacturage pour financer une facture",
    "Dire quand l'escompte vaut mieux que le découvert, et ce que paie l'affacturage",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_CLIENT_QUI_PAIE_TARD,
    pourquoi:
      "ce chapitre se joue chez NOVA, dans la simulation du cours : son client CampusTech y paie à l'échéance, le chapitre suppose qu'il paie en retard, et sa banque y propose le découvert, l'escompte et l'affacturage.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Et si le client payait en retard ?",
      notions: ["payment_terms", "balance_sheet"],
      tableau: (c) => {
        const k = clientQuiPaieTard(c);
        return {
          titre: `Ce que ${k.f.entreprise} vend à ${k.ct.nom}`,
          colonnes: [k.ct.nom],
          lignes: [
            { libelle: "Enceintes par facture", valeurs: [qte(k.ct.enceintesParFacture)] },
            { libelle: "Prix d'une enceinte (HT)", valeurs: [eur(k.f.prixHT)] },
            { libelle: "Jour de facturation", valeurs: [`le ${k.ct.jourDeFacturation} de chaque mois`] },
            { libelle: "Délai de paiement convenu", valeurs: [`${jours(k.ct.delaiConvenu)} après la facture`] },
            { libelle: "Paiement réel", valeurs: [`à l'échéance, ${jours(k.ct.delaiReel)} après la facture`] },
            { libelle: "Hypothèse du chapitre : un paiement en retard", valeurs: [`${jours(k.ct.delaiSiRetard)} après la facture, ${jours(k.r.joursDeRetard)} de retard`] },
            { libelle: "Enceintes vendues au dernier trimestre, tous clients", valeurs: [qte(k.siRetard.enceintes)] },
          ],
        };
      },
      texte: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${k.f.entreprise}, sur l'année N + 1. Les particuliers paient en ligne, par carte, à la commande. ${k.ct.nom}, une chaîne de magasins, achète ${qte(k.ct.enceintesParFacture)} enceintes chaque mois, facturées le ${k.ct.jourDeFacturation}, à ${eur(k.f.prixHT)} HT l'enceinte.`,
          `Le délai convenu est de ${jours(k.ct.delaiConvenu)} après la facture, le maximum que la loi permet entre professionnels (code de commerce, article L. 441-10), et ${k.ct.nom} paie à l'échéance. Ce chapitre pose une hypothèse : si ${k.ct.nom} payait ${jours(k.r.joursDeRetard)} en retard, à ${jours(k.ct.delaiSiRetard)} ? Ce ne serait pas un autre délai, ce serait un retard. La loi le sanctionne de plein droit : des pénalités de retard, au taux de refinancement de la BCE majoré de ${qte(MAJORATION_DU_TAUX_BCE * 100)} points quand les conditions de vente n'en fixent pas d'autre, et une indemnité forfaitaire de ${eur(k.f.penalites.indemnite)} par facture pour les frais de recouvrement.`,
          `${k.f.entreprise} vend des biens : la TVA d'une facture est due à la livraison, que le client ait payé ou non. En attendant d'être payée, ${k.f.entreprise} finance donc chaque facture toutes taxes comprises.`,
          `La simulation suppose des mois de 30 jours et des trimestres de ${JOURS_DU_TRIMESTRE} ; des intérêts (découvert, escompte, affacturage) comptés sur ${JOURS_DE_L_ANNEE_BANCAIRE} jours, des pénalités sur ${JOURS_DE_L_ANNEE_CIVILE} jours et sur le montant TTC ; un découvert à ${pct(k.taux)} l'an ; un taux de la BCE de ${pct(TAUX_DE_REFINANCEMENT_BCE.taux)}, valeur de référence du cours (celle du ${TAUX_DE_REFINANCEMENT_BCE.dateDeReference} : il change chaque semestre).`,
        ];
      },
      repere: (c) => {
        const k = clientQuiPaieTard(c);
        return `Délai convenu entre professionnels : ${DELAI_MAXIMAL_CONVENU.joursDeLaFacture} jours de la facture au plus. Hypothèse du chapitre : ${k.ct.nom} paierait ${jours(k.r.joursDeRetard)} après l'échéance. Payée après l'échéance, une facture est en retard : pénalités de retard et ${eur(k.f.penalites.indemnite)} d'indemnité par facture, de plein droit.`;
      },
    },
    {
      id: "les-creances",
      type: "montants",
      titre: "Les créances, facture par facture",
      notions: ["payment_terms", "balance_sheet"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Calculez le montant d'une facture de ${k.ct.nom}, toutes taxes comprises (${qte(k.ct.enceintesParFacture)} × ${eur(k.f.prixHT)} HT, plus ${pct(k.f.tauxDeTva)} de TVA). Puis, dans l'hypothèse du chapitre, ${k.ct.nom} payant ${jours(k.ct.delaiSiRetard)} après la facture, comptez ses factures encore dues au 31 décembre : celles des 20 octobre, novembre et décembre le seraient-elles déjà ? Enfin, les créances clients du bilan dans cette hypothèse, toutes taxes comprises.`;
      },
      champs: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          {
            libelle: `Montant d'une facture de ${k.ct.nom} (TTC)`,
            attendu: k.fct.ttc,
            calcul: `${qte(k.ct.enceintesParFacture)} × ${eur(k.f.prixHT)} = ${eur(k.fct.ht)} HT, plus ${eur(k.fct.tva)} de TVA = ${eur(k.fct.ttc)}`,
          },
          {
            libelle: "Factures encore dues au 31 décembre, en retard",
            attendu: k.siRetard.factures,
            calcul: `payées ${jours(k.ct.delaiSiRetard)} après leur 20 du mois, les factures d'octobre, de novembre et de décembre le seraient en janvier, février et mars : ${qte(k.siRetard.factures)}`,
          },
          { libelle: "Créances clients au 31 décembre, en retard (TTC)", attendu: k.siRetard.creancesTTC, calcul: `${qte(k.siRetard.factures)} × ${eur(k.fct.ttc)} = ${eur(k.siRetard.creancesTTC)}` },
        ];
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `Les particuliers ont tout payé : en retard, les créances du bilan seraient les ${qte(k.siRetard.factures)} dernières factures de ${k.ct.nom}, ${eur(k.siRetard.creancesTTC)} toutes taxes comprises, ce que le client paierait. Elles se comptent facture par facture : ${k.ct.nom} est facturée une fois par mois, pas au fil des jours.`,
          `À l'échéance convenue, comme ${k.ct.nom} paie dans la simulation, la facture d'octobre est déjà payée : il n'en reste que ${qte(k.aLEcheance.factures)}. Le retard supposé laisserait une facture de plus au bilan, ${eur(k.r.creanceEnPlusTTC)}.`,
        ];
      },
    },
    {
      id: "le-delai-moyen",
      type: "montants",
      titre: "Le délai moyen de paiement",
      notions: ["payment_terms", "bfr"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Le délai moyen de paiement des clients rapporte les créances au chiffre d'affaires du trimestre, toutes taxes comprises : créances (TTC) ÷ chiffre d'affaires du trimestre (TTC) × ${JOURS_DU_TRIMESTRE}. Au dernier trimestre, ${k.f.entreprise} a vendu ${qte(k.siRetard.enceintes)} enceintes à ${eur(k.f.prixHT)} HT. Calculez le chiffre d'affaires du trimestre (TTC), le délai moyen de paiement des clients si ${k.ct.nom} payait en retard (les créances de l'étape précédente), au dixième de jour, puis la part de ${k.ct.nom} dans le chiffre d'affaires hors taxes du trimestre (%).`;
      },
      champs: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          { libelle: "Chiffre d'affaires du dernier trimestre (TTC)", attendu: k.siRetard.caTTC, calcul: `${qte(k.siRetard.enceintes)} × ${eur(k.f.prixHT)} = ${eur(k.siRetard.caHT)} HT × ${qte(1 + k.f.tauxDeTva)} = ${eur(k.siRetard.caTTC)}` },
          {
            libelle: "Délai moyen de paiement des clients, en retard (jours)",
            attendu: k.delaiMoyen,
            calcul: `${eur(k.siRetard.creancesTTC)} ÷ ${eur(k.siRetard.caTTC)} × ${JOURS_DU_TRIMESTRE} = ${jours(k.delaiMoyen)}`,
            tolerance: 0.1,
          },
          {
            libelle: `Part de ${k.ct.nom} dans le chiffre d'affaires (%)`,
            attendu: k.partDeCampusTech,
            calcul: `${qte(k.siRetard.campustechHT / k.fct.ht)} × ${eur(k.fct.ht)} = ${eur(k.siRetard.campustechHT)} ÷ ${eur(k.siRetard.caHT)} = ${qte(k.partDeCampusTech)} %`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `Si ${k.ct.nom} payait en retard, les clients de ${k.f.entreprise} paieraient en moyenne à ${jours(k.delaiMoyen)}. Ce chiffre mêlerait des particuliers qui paient comptant et un client professionnel qui pèse ${qte(k.partDeCampusTech)} % des ventes et paierait à ${jours(k.ct.delaiSiRetard)} : une moyenne se lit avec ce qu'elle mélange.`,
        ];
      },
    },
    {
      id: "le-cout-du-credit",
      type: "montants",
      titre: "Ce que coûte le crédit convenu",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Même payée à l'échéance, une facture de ${k.ct.nom} attend ${jours(k.ct.delaiConvenu)}. ${k.f.entreprise} la finance sur son découvert, à ${pct(k.taux)} l'an, toutes taxes comprises : la TVA de la facture, elle l'a déjà déclarée à la livraison. Calculez le coût du crédit convenu d'une facture (TTC × ${pct(k.taux)} × ${k.ct.delaiConvenu} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE}), la part de ce coût qui finance la TVA, puis le coût du crédit convenu sur l'année (${k.r.facturesParAn} factures).`;
      },
      champs: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          {
            libelle: "Coût du crédit convenu d'une facture",
            attendu: k.r.coutDuCreditConvenuParFacture,
            calcul: `${eur(k.fct.ttc)} × ${pct(k.taux)} × ${k.ct.delaiConvenu} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(k.r.coutDuCreditConvenuParFacture)}`,
          },
          { libelle: "Part qui finance la TVA", attendu: k.creditDeLaTva, calcul: `${eur(k.fct.tva)} × ${pct(k.taux)} × ${k.ct.delaiConvenu} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(k.creditDeLaTva)}` },
          { libelle: "Coût du crédit convenu sur l'année", attendu: k.r.coutDuCreditConvenuParAn, calcul: `${k.r.facturesParAn} × ${eur(k.r.coutDuCreditConvenuParFacture)} = ${eur(k.r.coutDuCreditConvenuParAn)}` },
        ];
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `Un délai accordé n'est pas gratuit : ${eur(k.r.coutDuCreditConvenuParAn)} par an pour ${k.ct.nom}, dont ${eur(k.creditDeLaTva)} par facture pour la seule TVA. Une entreprise de services, dont la TVA n'est due qu'à l'encaissement, ne financerait que le hors taxes : ${eur(k.creditHorsTaxes)} par facture.`,
        ];
      },
    },
    {
      id: "predire-le-retard",
      type: "choix",
      titre: "Pariez sur ce que la loi permet de réclamer",
      notions: ["payment_terms"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Les conditions de vente de ${k.f.entreprise} fixent les pénalités au taux de la loi, ${pct(k.r.tauxDesPenalites)} l'an. Elles pourraient le fixer plus bas, jusqu'au plancher de ${MULTIPLE_DU_TAUX_LEGAL} fois le taux d'intérêt légal (${pct(TAUX_D_INTERET_LEGAL.professionnels)}), soit ${pct(k.tauxDuPlancher)}, sous les ${pct(k.taux)} du découvert. Avant de calculer, pariez : à ce plancher, ce que ${k.f.entreprise} peut réclamer pour un retard (pénalités et indemnité de ${eur(k.f.penalites.indemnite)}) couvre-t-il ce que le retard lui coûte au découvert ?`;
      },
      options: (c) => {
        const k = clientQuiPaieTard(c);
        const voir = "Faites varier le retard à l'étape suivante : le curseur montre jusqu'où ce que la loi garantit couvre le découvert.";
        const toujours = k.joursQueCouvreLePlancher >= RETARD_DU_CURSEUR.max;
        const jamais = k.joursQueCouvreLePlancher < RETARD_DU_CURSEUR.min;
        return [
          { texte: "Jamais : le taux des pénalités est sous celui du découvert", juste: jamais, retour: `Pari à vérifier. ${voir}` },
          { texte: "Toujours : l'indemnité s'ajoute aux pénalités", juste: toujours, retour: `Pari à vérifier. ${voir}` },
          { texte: "Jusqu'à un certain retard : l'indemnité comble l'écart des taux, puis s'épuise", juste: !toujours && !jamais, retour: `Bon pari. ${voir}` },
        ];
      },
    },
    {
      id: "le-retard-au-curseur",
      type: "curseur",
      titre: "Le retard, au curseur",
      notions: ["payment_terms"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Faites varier les jours de retard ${dE(k.ct.nom)}, de ${RETARD_DU_CURSEUR.min} à ${RETARD_DU_CURSEUR.max}, les pénalités au plancher légal (${pct(k.tauxDuPlancher)}). Une droite donne ce que ${k.f.entreprise} peut réclamer pour une facture (les pénalités, plus ${eur(k.f.penalites.indemnite)} d'indemnité) ; l'autre, ce que le retard lui coûte au découvert. Placez le curseur sur le plus long retard que ce qu'elle peut réclamer couvre encore, puis validez.`;
      },
      grandeur: () => ({ libelle: "Jours de retard", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: clientQuiPaieTard(c).joursQueCouvreLePlancher, min: RETARD_DU_CURSEUR.min, max: RETARD_DU_CURSEUR.max }),
      zones: ["Ce que la loi garantit couvre le retard", "Le retard coûte plus que ce qu'on peut réclamer"],
      rates: () => ({
        dessous: "Ce que la loi garantit couvre encore un retard plus long : cherchez le plus grand nombre de jours.",
        dessus: "À ce retard, le découvert coûte déjà plus que ce qu'on peut réclamer.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, j) => {
        const k = clientQuiPaieTard(c);
        const cout = coutDuDecouvert(k.fct.ttc, k.taux, j);
        const auPlancher = reclamable(k, j, k.tauxDuPlancher);
        return [
          { libelle: "Coût du retard au découvert", montant: cout },
          { libelle: "Réclamable au plancher légal", montant: auPlancher },
          { libelle: "Réclamable au taux de la loi", montant: reclamable(k, j, k.r.tauxDesPenalites) },
          { libelle: "Ce que le plancher laisse à l'entreprise", montant: auCentime(auPlancher - cout), fort: true },
        ];
      },
      droites: (c) => {
        const k = clientQuiPaieTard(c);
        return {
          produit: (j) => (k.fct.ttc * k.tauxDuPlancher * j) / JOURS_DE_L_ANNEE_CIVILE + k.f.penalites.indemnite,
          cout: (j) => (k.fct.ttc * k.taux * j) / JOURS_DE_L_ANNEE_BANCAIRE,
          libelles: ["Réclamable au plancher légal", "Coût du retard au découvert"],
        };
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `Au plancher, les pénalités ne paient pas le découvert : ${eur(k.parJourDuPlancher)} par jour de retard, contre ${eur(k.parJourDuDecouvert)}. L'indemnité de ${eur(k.f.penalites.indemnite)} comble l'écart jusqu'à ${jours(k.joursQueCouvreLePlancher)} de retard ; au-delà, le retard coûte plus que ce que la loi garantit.`,
          `Au taux des conditions de ${k.f.entreprise}, ${pct(k.r.tauxDesPenalites)}, les pénalités seules rapportent ${eur(k.parJourDeLaLoi)} par jour : elles couvrent le retard dès le premier jour. L'étape suivante chiffre l'hypothèse du chapitre, ${jours(k.r.joursDeRetard)} de retard.`,
        ];
      },
    },
    {
      id: "le-cout-du-retard",
      type: "montants",
      titre: "Le coût du retard et ce qui se réclame",
      notions: ["payment_terms"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Sans formule cette fois. Dans l'hypothèse du chapitre, une facture ${dE(k.ct.nom)} est payée avec ${jours(k.r.joursDeRetard)} de retard : calculez ce que le retard coûterait à ${k.f.entreprise} sur son découvert, puis les pénalités de retard au taux de ses conditions de vente. Sur l'année, chiffrez le coût du retard et tout ce que ${k.f.entreprise} pourrait réclamer, indemnités comprises.`;
      },
      champs: (c) => {
        const k = clientQuiPaieTard(c);
        const r = k.r;
        return [
          {
            libelle: "Coût du retard d'une facture",
            attendu: r.coutDuRetardParFacture,
            calcul: `${eur(k.fct.ttc)} × ${pct(k.taux)} × ${r.joursDeRetard} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(r.coutDuRetardParFacture)}`,
          },
          {
            libelle: "Pénalités de retard d'une facture",
            attendu: r.penalitesParFacture,
            calcul: `${eur(k.fct.ttc)} × ${pct(r.tauxDesPenalites)} × ${r.joursDeRetard} ÷ ${JOURS_DE_L_ANNEE_CIVILE} = ${eur(r.penalitesParFacture)}`,
          },
          { libelle: "Coût du retard sur l'année", attendu: r.coutDuRetardParAn, calcul: `${r.facturesParAn} × ${eur(r.coutDuRetardParFacture)} = ${eur(r.coutDuRetardParAn)}` },
          {
            libelle: "Réclamable sur l'année",
            attendu: r.reclamableParAn,
            calcul: `${r.facturesParAn} × (${eur(r.penalitesParFacture)} + ${eur(r.indemniteParFacture)}) = ${eur(r.penalitesParAn)} + ${eur(r.indemnitesParAn)} = ${eur(r.reclamableParAn)}`,
          },
        ];
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        const r = k.r;
        return [
          `Le retard supposé ${dE(k.ct.nom)} coûterait ${eur(r.coutDuRetardParAn)} par an à ${k.f.entreprise} ; la loi lui permettrait d'en réclamer ${eur(r.reclamableParAn)}. Les pénalités se comptent sur ${JOURS_DE_L_ANNEE_CIVILE} jours, comme tout taux du code de commerce, et sur le montant toutes taxes comprises ; l'indemnité de ${eur(r.indemniteParFacture)} est due par facture, quelle que soit la durée du retard.`,
        ];
      },
    },
    {
      id: "que-faire-du-retard",
      type: "choix",
      titre: "Que faire du retard",
      notions: ["payment_terms"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `${k.ct.nom} est un bon client : ${qte(k.partDeCampusTech)} % du chiffre d'affaires du trimestre. Supposez qu'elle se mette à payer chaque facture ${jours(k.r.joursDeRetard)} après l'échéance. Que ferait ${k.f.entreprise} ?`;
      },
      options: (c) => {
        const k = clientQuiPaieTard(c);
        const r = k.r;
        return [
          {
            texte: "Lui rappeler les pénalités et l'indemnité dues, pour obtenir le paiement à l'échéance",
            juste: r.enRetard,
            retour: `Oui : la loi les lui donne de plein droit, ${eur(r.reclamableParAn)} par an, quand le retard lui coûte ${eur(r.coutDuRetardParAn)}. Les réclamer ou s'en servir pour négocier le paiement à l'échéance est une décision commerciale ; ne rien dire, c'est financer le client.`,
          },
          {
            texte: `Convenir désormais d'un paiement à ${jours(r.delaiReel)}, pour régulariser`,
            juste: false,
            retour: `Non : entre professionnels, la loi plafonne le délai convenu à ${jours(DELAI_MAXIMAL_CONVENU.joursDeLaFacture)} ; ${jours(r.delaiReel)} ne se conviennent pas. Et ce serait effacer des pénalités que ${k.f.entreprise} peut réclamer.`,
          },
          {
            texte: `Ne rien dire : le retard ne coûte que ${eur(r.coutDuRetardParFacture)} par facture`,
            juste: false,
            retour: `Non : ${eur(r.coutDuRetardParAn)} par an, et une facture de plus au bilan, ${eur(r.creanceEnPlusTTC)} de trésorerie qui attend.`,
          },
        ];
      },
    },
    {
      id: "ce-que-cache-le-delai-moyen",
      type: "choix",
      titre: "Ce que cache le délai moyen",
      notions: ["payment_terms", "bfr"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Si ${k.ct.nom} payait ${jours(k.r.joursDeRetard)} en retard, le délai moyen de paiement des clients de ${k.f.entreprise} serait de ${jours(k.delaiMoyen)}. Le directeur financier en conclurait que les clients paient bien. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          {
            texte: `La moyenne cache le retard : les particuliers paient comptant, ${k.ct.nom} paierait en retard`,
            juste: true,
            retour: `Oui : ${k.ct.nom} ne pèse que ${qte(k.partDeCampusTech)} % des ventes, mais paierait à ${jours(k.ct.delaiSiRetard)}. À l'échéance, comme elle paie dans la simulation, le délai moyen est de ${jours(k.delaiMoyenALEcheance)} : un délai moyen se lit client par client, et un retard se mesure à l'échéance convenue.`,
          },
          {
            texte: `Il a raison : ${jours(k.delaiMoyen)}, c'est bien sous les ${jours(DELAI_MAXIMAL_CONVENU.joursDeLaFacture)} de la loi`,
            juste: false,
            retour: `Non : la loi plafonne le délai de chaque facture, pas une moyenne. ${k.ct.nom} paierait à ${jours(k.ct.delaiSiRetard)}, en retard sur ${jours(k.ct.delaiConvenu)} convenus.`,
          },
          {
            texte: "La moyenne est fausse : il faudrait la calculer hors taxes",
            juste: false,
            retour: "Non : créances et chiffre d'affaires sont pris toutes taxes comprises tous les deux, la moyenne est juste. Elle est seulement trompeuse.",
          },
        ];
      },
    },
    {
      id: "predire-l-escompte",
      type: "choix",
      titre: "Pariez sur l'escompte",
      notions: ["receivables_financing"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Pour ne pas attendre, ${k.f.entreprise} peut escompter une facture : la banque l'avance jusqu'à son échéance convenue, ${jours(k.ct.delaiConvenu)}, à ${pct(k.b.escompte.taux)} l'an. Son découvert coûte ${pct(k.taux)}. Avant de calculer, pariez : un escompte coûte-t-il toujours moins que le découvert ?`;
      },
      options: (c) => {
        const k = clientQuiPaieTard(c);
        const voir = "Faites varier les jours de découvert à l'étape suivante : le curseur montre où l'escompte devient le moins cher.";
        const toujours = k.joursQuiValentLEscompte <= DECOUVERT_DU_CURSEUR.min;
        return [
          { texte: "Oui : son taux est plus bas", juste: toujours, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non : il se paie sur tous ses jours, le découvert seulement les jours où le compte est débiteur", juste: !toujours, retour: `Bon pari. ${voir}` },
          { texte: "Non : la banque ajoute une commission à l'escompte", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-escompte-ou-le-decouvert",
      type: "curseur",
      titre: "L'escompte ou le découvert",
      notions: ["receivables_financing"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Faites varier les jours où le compte de ${k.f.entreprise} serait débiteur pendant qu'une facture attend, de ${DECOUVERT_DU_CURSEUR.min} à ${DECOUVERT_DU_CURSEUR.max}. Une droite donne le coût de l'escompte de la facture (${eur(k.fct.ttc)} × ${pct(k.b.escompte.taux)} × ${k.ct.delaiConvenu} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE}), l'autre celui du découvert de ces jours. Placez le curseur sur le plus grand nombre de jours où le découvert coûte encore moins que l'escompte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Jours où le compte est débiteur", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: clientQuiPaieTard(c).joursQuiValentLEscompte, min: DECOUVERT_DU_CURSEUR.min, max: DECOUVERT_DU_CURSEUR.max }),
      zones: ["Le découvert coûte moins", "L'escompte coûte moins"],
      rates: () => ({
        dessous: "Le découvert coûte encore moins un peu plus loin : cherchez le plus grand nombre de jours.",
        dessus: "À ce nombre de jours, le découvert coûte déjà plus que l'escompte.",
      }),
      montrer: "Montrer l'égalité",
      lecture: (c, j) => {
        const k = clientQuiPaieTard(c);
        const decouvert = coutDuDecouvert(k.fct.ttc, k.taux, j);
        return [
          { libelle: "Coût de l'escompte jusqu'à l'échéance", montant: k.m.escompte },
          { libelle: "Coût du découvert de ces jours", montant: decouvert },
          { libelle: "Ce que l'escompte coûte de plus", montant: auCentime(k.m.escompte - decouvert), fort: true },
        ];
      },
      droites: (c) => {
        const k = clientQuiPaieTard(c);
        return {
          produit: () => k.m.escompte,
          cout: (j) => coutDuDecouvert(k.fct.ttc, k.taux, j),
          libelles: ["Coût de l'escompte jusqu'à l'échéance", "Coût du découvert de ces jours"],
        };
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `Un escompte de ${jours(k.ct.delaiConvenu)} à ${pct(k.b.escompte.taux)} coûte autant que ${jours(k.joursQuiValentLEscompte)} de découvert à ${pct(k.taux)} (${k.ct.delaiConvenu} × ${pct(k.b.escompte.taux)} ÷ ${pct(k.taux)}). Si le compte n'est débiteur que quelques jours pendant l'attente, le découvert coûte moins : l'escompte paie tous ses jours, le découvert seulement ceux où l'on en a besoin.`,
          `Un taux plus bas ne suffit pas : il faut le multiplier par les jours qu'il dure. Pour une facture qui attendrait ${jours(k.ct.delaiSiRetard)}, retard compris, sur un compte débiteur, l'escompte gagne ; l'étape suivante le chiffre.`,
        ];
      },
    },
    {
      id: "une-facture-mobilisee",
      type: "montants",
      titre: "Trois façons de financer une facture",
      notions: ["receivables_financing"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Sans formule cette fois. Dans l'hypothèse du chapitre, ${k.ct.nom} paierait une facture à ${jours(k.ct.delaiSiRetard)}, ${jours(k.m.retard)} après l'échéance, et le compte de ${k.f.entreprise} est débiteur toute l'attente. Chiffrez l'escompte jusqu'à l'échéance convenue ; l'escompte complet, la banque reprenant la facture impayée à l'échéance (sauf bonne fin) ; le découvert seul jusqu'au paiement ; puis l'affacturage (${pct(k.b.affacturage.commission)} de commission, et ${pct(k.b.affacturage.tauxDeFinancement)} l'an de financement jusqu'au paiement réel).`;
      },
      champs: (c) => {
        const k = clientQuiPaieTard(c);
        const m = k.m;
        return [
          { libelle: "Escompte jusqu'à l'échéance", attendu: m.escompte, calcul: `${eur(k.fct.ttc)} × ${pct(k.b.escompte.taux)} × ${m.convenu} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(m.escompte)}` },
          {
            libelle: "Escompte, puis le retard au découvert",
            attendu: m.escompteEtRetard,
            calcul: `${eur(m.escompte)} + ${eur(k.fct.ttc)} × ${pct(k.taux)} × ${m.retard} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(m.escompte)} + ${eur(m.retardAuDecouvert)} = ${eur(m.escompteEtRetard)}`,
          },
          { libelle: "Découvert seul jusqu'au paiement", attendu: m.decouvert, calcul: `${eur(k.fct.ttc)} × ${pct(k.taux)} × ${m.reel} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(m.decouvert)}` },
          {
            libelle: "Affacturage jusqu'au paiement",
            attendu: m.affacturage,
            calcul: `${eur(k.fct.ttc)} × ${pct(k.b.affacturage.commission)} + ${eur(k.fct.ttc)} × ${pct(k.b.affacturage.tauxDeFinancement)} × ${m.reel} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(m.commission)} + ${eur(m.financement)} = ${eur(m.affacturage)}`,
          },
        ];
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        const m = k.m;
        return [
          `L'escompte est le moins cher, ${eur(m.escompteEtRetard)}, même en finançant soi-même le retard : la banque ne prend pas le risque du client, elle reprend la facture impayée à l'échéance. Le découvert seul coûte ${eur(m.decouvert)}, l'affacturage ${eur(m.affacturage)}.`,
          "Aucun des trois ne crée d'argent : ils changent le moment où il rentre, contre un coût. On les compare à ce que coûterait l'attente, pas à zéro.",
        ];
      },
    },
    {
      id: "le-prix-de-la-garantie",
      type: "choix",
      titre: "Ce que paie l'affacturage",
      notions: ["receivables_financing"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `L'affacturage coûte ${eur(k.m.primeDeLAffacturage)} de plus que l'escompte pour une facture de ${k.ct.nom}. Pourquoi une PME le choisirait-elle quand même ?`;
      },
      options: (c) => {
        const k = clientQuiPaieTard(c);
        const m = k.m;
        return [
          {
            texte: "Le factor achète la créance : il encaisse le client et garantit l'impayé",
            juste: true,
            retour: `Oui : les ${eur(m.primeDeLAffacturage)} paient le recouvrement et la garantie. Avec l'escompte, sauf bonne fin, ${k.f.entreprise} garde le risque : si ${k.ct.nom} ne payait jamais, la banque lui reprendrait les ${eur(k.fct.ttc)}.`,
          },
          {
            texte: "Il évite de financer le retard : le factor attend à la place de l'entreprise",
            juste: false,
            retour: `Non : le factor fait payer son attente, ${pct(k.b.affacturage.tauxDeFinancement)} l'an jusqu'au paiement réel (${eur(m.financement)}). Le retard se paie aussi avec l'affacturage.`,
          },
          {
            texte: "Il coûte moins sur l'année : la commission ne se paie qu'une fois",
            juste: false,
            retour: `Non : la commission, ${pct(k.b.affacturage.commission)} du montant, se paie sur chaque facture cédée, ${eur(m.commission)} ici.`,
          },
        ];
      },
    },
    {
      id: "a-l-echeance",
      type: "montants",
      titre: "Retour au réel : le client paie à l'échéance",
      notions: ["payment_terms", "bfr"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Dans la simulation, ${k.ct.nom} tient son délai convenu et paie à ${jours(k.ct.delaiReel)}. Refaites les créances clients du 31 décembre (TTC), le délai moyen de paiement des clients, au dixième de jour, puis ce que le retard supposé laisserait en plus au bilan, toutes taxes comprises.`;
      },
      champs: (c) => {
        const k = clientQuiPaieTard(c);
        const e = k.aLEcheance;
        return [
          {
            libelle: "Créances clients au 31 décembre, à l'échéance (TTC)",
            attendu: e.creancesTTC,
            calcul: `payées ${jours(k.ct.delaiConvenu)} après leur 20 du mois, les factures de novembre et de décembre restent dues : ${qte(e.factures)} × ${eur(k.fct.ttc)} = ${eur(e.creancesTTC)}`,
          },
          {
            libelle: "Délai moyen de paiement à l'échéance (jours)",
            attendu: k.delaiMoyenALEcheance,
            calcul: `${eur(e.creancesTTC)} ÷ ${eur(e.caTTC)} × ${JOURS_DU_TRIMESTRE} = ${jours(k.delaiMoyenALEcheance)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Ce que le retard laisserait en plus au bilan (TTC)",
            attendu: k.r.creanceEnPlusTTC,
            calcul: `${eur(k.siRetard.creancesTTC)} − ${eur(e.creancesTTC)} = ${eur(k.r.creanceEnPlusTTC)}`,
          },
        ];
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `Un retard de ${jours(k.r.joursDeRetard)} laisserait une facture entière de plus au bilan, ${eur(k.r.creanceEnPlusTTC)} : la créance ne grandit pas au prorata des jours, elle grandit par factures. Sur un trimestre de ${JOURS_DU_TRIMESTRE} jours, ${jours(k.r.joursDeRetard)} de retard feraient passer la facture d'octobre après le 31 décembre.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Retrouver le retard à rebours",
      notions: ["receivables_financing", "payment_terms"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Autre hypothèse : au trimestre suivant, ${k.ct.nom} paie une facture escomptée en retard, et le relevé de la banque montre que cette facture (${eur(k.fct.ttc)}) a coûté ${eur(COUT_RELEVE_A_REBOURS)} à ${k.f.entreprise} en tout : l'escompte jusqu'à l'échéance, puis le retard sur son découvert. Retrouvez les jours de retard, le jour du paiement après la facture, puis ce que ${k.f.entreprise} peut réclamer pour cette facture.`;
      },
      champs: (c) => {
        const k = clientQuiPaieTard(c);
        const x = k.aRebours;
        return [
          {
            libelle: "Jours de retard",
            attendu: k.retardARebours,
            calcul: `(${eur(COUT_RELEVE_A_REBOURS)} − ${eur(k.m.escompte)}) ÷ (${eur(k.fct.ttc)} × ${pct(k.taux)} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE}) = ${eur(auCentime(COUT_RELEVE_A_REBOURS - k.m.escompte))} ÷ ${parJourExact(k)} = ${qte(k.retardARebours)}`,
          },
          { libelle: "Jour du paiement, après la facture", attendu: k.paiementARebours, calcul: `${k.ct.delaiConvenu} + ${k.retardARebours} = ${k.paiementARebours}` },
          {
            libelle: "Réclamable pour cette facture",
            attendu: auCentime(x.penalitesParFacture + x.indemniteParFacture),
            calcul: `${eur(k.fct.ttc)} × ${pct(x.tauxDesPenalites)} × ${k.retardARebours} ÷ ${JOURS_DE_L_ANNEE_CIVILE} + ${eur(x.indemniteParFacture)} = ${eur(x.penalitesParFacture)} + ${eur(x.indemniteParFacture)} = ${eur(auCentime(x.penalitesParFacture + x.indemniteParFacture))}`,
          },
        ];
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `Ce que l'escompte coûte au-delà de ses ${eur(k.m.escompte)} vient du retard, à ${parJourExact(k)} par jour de découvert : ${qte(k.retardARebours)} jours, une facture payée ${k.paiementARebours} jours après son émission. Remonter un coût jusqu'à sa cause oblige à savoir ce que chaque part rémunère : l'escompte, les jours jusqu'à l'échéance ; le découvert, ceux d'après.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-facture",
      type: "simulation",
      titre: "Le laboratoire de la facture",
      notions: ["receivables_financing", "payment_terms"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Une facture de ${k.ct.nom}, ${eur(k.fct.ttc)} TTC, échue à ${jours(k.ct.delaiConvenu)}. Le laboratoire part de l'hypothèse du chapitre, un paiement à ${jours(k.ct.delaiSiRetard)}. Faites varier le jour où elle est payée, l'état du compte de ${k.f.entreprise} pendant l'attente et la base des pénalités, et choisissez comment la financer : le tableau suit le coût de chaque façon, en effet sur le résultat. Relevez le défi.`;
      },
      leviers: (c) => {
        const k = clientQuiPaieTard(c);
        const placement = Math.round(k.b.tauxDuPlacement * 100);
        const decouvert = Math.round(k.taux * 100);
        return [
          { code: "delai", libelle: "Jour du paiement, après la facture", unite: "jours", min: DELAI_DU_LABORATOIRE.min, max: DELAI_DU_LABORATOIRE.max, pas: DELAI_DU_LABORATOIRE.pas, depart: k.ct.delaiSiRetard },
          {
            code: "compte",
            libelle: "Le compte pendant l'attente",
            unite: "% l'an",
            min: placement,
            max: decouvert,
            pas: decouvert - placement,
            depart: decouvert,
            choix: [
              { valeur: placement, libelle: `Créditeur : l'argent placé rapporte ${pct(k.b.tauxDuPlacement)}` },
              { valeur: decouvert, libelle: `Débiteur : le découvert coûte ${pct(k.taux)}` },
            ],
          },
          {
            code: "base",
            libelle: "Les pénalités de retard",
            unite: "",
            min: 1,
            max: 2,
            pas: 1,
            depart: 1,
            choix: [
              { valeur: 1, libelle: `Au taux de la loi, ${pct(tauxDesPenalites("bce"))}` },
              { valeur: 2, libelle: `Au plancher légal, ${pct(tauxDesPenalites("taux-legal"))}` },
            ],
          },
          {
            code: "outil",
            libelle: "Comment financer la facture",
            unite: "",
            min: 0,
            max: OUTILS.length - 1,
            pas: 1,
            depart: 0,
            choix: OUTILS.map((o, i) => ({ valeur: i, libelle: NOMS_DES_OUTILS[o].replace(/^./, (x) => x.toUpperCase()) })),
          },
        ];
      },
      lecture: (c, p) => {
        const k = clientQuiPaieTard(c);
        const x = laboratoire(k, p);
        const d = laboratoire(k, { delai: k.ct.delaiSiRetard, compte: Math.round(k.taux * 100), base: 1, outil: 0 });
        return [
          { libelle: "Jours de retard", montant: x.retard, reference: d.retard, unite: "jours" },
          { libelle: "Coût en attendant sur le compte", montant: -x.couts.attendre, reference: -d.couts.attendre, effet: true },
          { libelle: "Coût par l'escompte", montant: -x.couts.escompte, reference: -d.couts.escompte, effet: true },
          { libelle: "Coût par l'affacturage", montant: -x.couts.affacturage, reference: -d.couts.affacturage, effet: true },
          { libelle: "Coût de la façon choisie", montant: -x.choisi, reference: -d.choisi, effet: true, fort: true },
          { libelle: "Pénalités et indemnité réclamables", montant: x.reclamable, reference: d.reclamable },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      // L'escompte a payé ses intérêts jusqu'à l'échéance : sa courbe est plate avant, puis monte au taux du compte.
      graphique: (c) => {
        const k = clientQuiPaieTard(c);
        return {
          levier: "delai",
          courbes: [
            { libelle: "Coût en attendant sur le compte", valeur: (p) => laboratoire(k, p).couts.attendre },
            { libelle: "Coût par l'escompte", valeur: (p) => laboratoire(k, p).couts.escompte },
            { libelle: "Coût par l'affacturage", valeur: (p) => laboratoire(k, p).couts.affacturage },
          ],
        };
      },
      defi: (c) => {
        const k = clientQuiPaieTard(c);
        return {
          consigne: "Choisissez la façon la moins chère de financer la facture, à la position où vous êtes.",
          atteint: (p) => {
            const x = laboratoire(k, p);
            return x.choisi <= x.couts[x.leMoinsCher];
          },
          indice: (p) => {
            const x = laboratoire(k, p);
            return `Ici, ${NOMS_DES_OUTILS[x.outil]} coûte ${eur(x.choisi)} ; ${NOMS_DES_OUTILS[x.leMoinsCher]} ne coûte que ${eur(x.couts[x.leMoinsCher])}.`;
          },
          solution: { delai: k.ct.delaiSiRetard, compte: Math.round(k.taux * 100), base: 1, outil: OUTILS.indexOf("escompte") },
        };
      },
      explication: (c, p) => {
        const k = clientQuiPaieTard(c);
        const x = laboratoire(k, p);
        const crediteur = laboratoire(k, { ...p, compte: Math.round(k.b.tauxDuPlacement * 100) });
        return [
          `Pour une facture payée ${jours(p.delai!)} après son émission, la façon la moins chère est ${NOMS_DES_OUTILS[x.leMoinsCher]} : ${eur(x.couts[x.leMoinsCher])}, contre ${OUTILS.filter((o) => o !== x.leMoinsCher)
            .map((o) => `${eur(x.couts[o])} pour ${NOMS_DES_OUTILS[o]}`)
            .join(" et ")}.`,
          `Passez le compte au créditeur : attendre ne coûte plus que le placement perdu (${eur(crediteur.couts.attendre)}), et ${NOMS_DES_OUTILS[crediteur.leMoinsCher]} devient le moins cher. On ne mobilise une créance que si l'on a besoin de l'argent. L'affacturage, lui, coûte toujours plus : sa différence paie le recouvrement et la garantie de l'impayé. Et les pénalités ne changent pas le coût : elles disent ce que le client doit, s'il paie.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payment_terms", "receivables_financing"],
      tableau: (c) => {
        const k = clientQuiPaieTard(c);
        return {
          titre: `Une facture de ${k.ct.nom}, ${eur(k.fct.ttc)} TTC, dans l'hypothèse d'un paiement à ${jours(k.ct.delaiSiRetard)}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Coût du crédit convenu (${jours(k.ct.delaiConvenu)}, au découvert)`, valeurs: [eur(k.r.coutDuCreditConvenuParFacture)] },
            { libelle: `Coût du retard (${jours(k.r.joursDeRetard)}, au découvert)`, valeurs: [eur(k.r.coutDuRetardParFacture)] },
            { libelle: "Pénalités et indemnité réclamables", valeurs: [eur(auCentime(k.r.penalitesParFacture + k.r.indemniteParFacture))] },
            { libelle: "Financée par l'escompte, retard compris", valeurs: [eur(k.m.escompteEtRetard)] },
            { libelle: "Financée par le découvert seul", valeurs: [eur(k.m.decouvert)] },
            { libelle: "Financée par l'affacturage", valeurs: [eur(k.m.affacturage)] },
          ],
        };
      },
      texte: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `Chez ${k.f.entreprise}, ${k.ct.nom} paie à l'échéance et doit ${eur(k.aLEcheance.creancesTTC)} au 31 décembre, ${qte(k.aLEcheance.factures)} factures. Si elle payait ${jours(k.r.joursDeRetard)} en retard, elle en devrait ${eur(k.siRetard.creancesTTC)}, ${qte(k.siRetard.factures)} factures ; ce retard coûterait ${eur(k.r.coutDuRetardParAn)} par an, et la loi permettrait d'en réclamer ${eur(k.r.reclamableParAn)}. Pour financer l'attente, l'escompte (${eur(k.m.escompteEtRetard)} par facture) battrait le découvert (${eur(k.m.decouvert)}) et l'affacturage (${eur(k.m.affacturage)}), tant que le compte est débiteur.`,
          `Un délai convenu ne dépasse pas ${jours(DELAI_MAXIMAL_CONVENU.joursDeLaFacture)} entre professionnels ; au-delà de l'échéance, c'est un retard, que sanctionnent des pénalités et une indemnité forfaitaire. Une entreprise qui vend des biens finance ses créances toutes taxes comprises. L'escompte se paie sur tous ses jours, le découvert sur ceux où il sert : ${jours(k.joursQuiValentLEscompte)} de découvert valent un escompte de ${jours(k.ct.delaiConvenu)}. L'affacturage coûte plus, parce qu'il achète aussi le risque.`,
          "Au niveau de l'examen, vous savez compter des créances facture par facture, lire un délai moyen et ce qu'il cache, distinguer délai convenu et retard, chiffrer les pénalités et l'indemnité, comparer l'escompte, le découvert et l'affacturage, et remonter d'un coût à sa cause.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût d'une attente = montant TTC × taux × jours ÷ 360. Pénalités de retard = montant TTC × (taux BCE + 10 points) × jours de retard ÷ 365, plus 40 € par facture. Jours de découvert qui valent un escompte = jours d'escompte × taux de l'escompte ÷ taux du découvert.",
    },
  ],
};

/** « de CampusTech », « d'AsiaComponents » : l'élision devant une voyelle. */
function dE(nom: string) {
  return /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;
}
