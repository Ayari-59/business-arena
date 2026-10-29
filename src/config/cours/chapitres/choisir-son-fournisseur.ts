import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { coutsDeLaQualite } from "../monde/capacite";
import { DELAI_MAXIMAL_CONVENU, JOURS_DE_L_ANNEE_BANCAIRE, JOURS_DU_TRIMESTRE, NOVA_DELAIS, type CodeDOffre, type FicheDesDelaisDeNova } from "../monde/delais-et-tva";
import { choisirUneOffre, comparerAvecLHabituelle, encoursAuDelai, escompteDuFournisseur, offreDe } from "../monde/delais";
import { CAPACITES_DU_COURS } from "../monde/nova-capacite";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : CHOISIR SON FOURNISSEUR, PRIX, QUALITÉ ET DÉLAI DE PAIEMENT (BTS GPME, palier 2).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : NOVA en N + 1
 * a une fiche figée (monde/delais-et-tva.ts, `NOVA_DELAIS`) et ses offres de composants se comparent
 * par le modèle du cours (monde/delais.ts, partie 4 : `anneeAvecUneOffre`, `comparerAvecLHabituelle`,
 * `choisirUneOffre`, `escompteDuFournisseur`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : trois offres de composants pour l'année N + 1 (26 000 enceintes, un jeu par enceinte).
 * Électro-Composants Lyon, le fournisseur habituel, à 22 € HT, compté à 30 jours ; AsiaComponents,
 * 10 % moins cher, payé comptant, qui oblige à garder 45 jours de stock et fait courir un risque de
 * rupture ; EuroParts Premium, 5 % plus cher, payé à 60 jours, de meilleure qualité. Le piège
 * central : le moins cher donne le meilleur résultat et creuse la trésorerie, le plus cher fait
 * l'inverse. Un fournisseur change le résultat par son prix, ses ruptures et sa qualité ; la
 * trésorerie, en plus, par son délai et par le stock qu'il oblige à porter.
 *
 * Le défaut relevé par l'audit est corrigé : le repère disait « achats du trimestre (TTC) » pour un
 * calcul hors taxes. Chaque montant dit maintenant s'il est HT ou TTC ; la dette du bilan est TTC, la
 * comparaison des offres se fait hors taxes (la TVA des achats se déduit).
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026) :
 *   · guidé : intro, le-cout-des-composants, les-ruptures, dettes-et-stock (la formule est dans la
 *     question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-tresorerie
 *     puis le-delai-au-curseur (le délai qui ferait rattraper à AsiaComponents l'offre habituelle en
 *     trésorerie) avant dettes-et-stock et l-ecart-de-tresorerie ; predire-l-escompte puis
 *     l-escompte-au-curseur (les jours d'avance que l'escompte d'Électro-Composants paie) avant
 *     l-escompte-en-taux-annuel ;
 *   · autonome : l-ecart-de-tresorerie, le-meilleur-resultat, ce-qui-change-quoi (ni formule ni
 *     chiffres donnés ; la correction montre le chemin) ;
 *   · expert : l-escompte-en-taux-annuel (taux annuel, gain net, dette qui fond), a-rebours (le délai
 *     du curseur retrouvé par le calcul), le-besoin-a-financer (le résultat croisé avec la
 *     trésorerie), europarts-et-la-qualite (une variante chiffrée, la qualité comptée), le
 *     laboratoire des offres (le fournisseur au choix, son délai, le stock gardé), puis
 *     resultat-ou-tresorerie (un jugement) et la synthèse.
 */

/**
 * LE RISQUE DE RUPTURE SOUS LE STOCK DE LIVRAISON (hypothèse du cours, pour le laboratoire) : le stock
 * de l'offre est le plus petit qui couvre l'attente d'une livraison (45 jours de consommation chez
 * AsiaComponents, dont les conteneurs arrivent 42 jours après la commande). En garder moins, c'est
 * attendre chaque conteneur ligne arrêtée : le cours compte alors une rupture à chaque trimestre.
 * Les fournisseurs qui livrent au fil du mois (Électro-Composants, EuroParts) n'obligent à aucun stock.
 */
export const RISQUE_SOUS_LE_STOCK_DE_LIVRAISON = 1;

/** Les bornes du délai de paiement dans les curseurs et le laboratoire : de comptant au délai maximal convenu. */
export const DELAI_DU_CURSEUR = { min: 0, max: DELAI_MAXIMAL_CONVENU.joursDeLaFacture } as const;

/** Les bornes des jours de stock dans le laboratoire, et leur pas. */
export const STOCK_DU_LABORATOIRE = { min: 0, max: 90, pas: 5 } as const;

/** Les fournisseurs de composants se comparent sur la fiche de NOVA en N + 1. */
export const ENTREPRISES_DES_FOURNISSEURS: readonly string[] = [NOVA_DELAIS.code];

/** @deprecated Les entreprises où le chapitre se joue : NOVA seule. Voir ENTREPRISES_DES_FOURNISSEURS. */
export const ENTREPRISES_A_UN_CATALOGUE = ENTREPRISES_DES_FOURNISSEURS;

const eur = (x: number) => montantEcrit(auCentime(x)).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
/** « de NOVA », « d'AsiaComponents », « d'Électro-Composants Lyon » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « que NOVA », « qu'AsiaComponents ». */
const queDe = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);
/** Le délai d'une offre dans une phrase : « comptant », ou « à 60 jours ». */
const aDelai = (jours: number) => (jours === 0 ? "comptant" : `à ${jours} jours`);

const FICHES: Readonly<Record<string, FicheDesDelaisDeNova>> = { [NOVA_DELAIS.code]: NOVA_DELAIS };

/** La fiche des délais de NOVA. */
export function ficheDe(c: Pick<Cas, "code">): FicheDesDelaisDeNova {
  const f = FICHES[c.code];
  if (!f) throw new Error(`Pas de fiche des fournisseurs pour ${c.code}`);
  return f;
}

/** Les leviers du laboratoire : l'offre (son rang dans la fiche), le délai négocié, les jours de stock gardés. */
export interface PositionDuLaboratoire {
  offre: number;
  delai: number;
  stock: number;
}

/**
 * Une offre gardée toute l'année avec un délai et un stock choisis, face à l'offre habituelle telle
 * qu'elle est (le modèle du cours). Sous le stock de livraison de l'offre, une rupture par trimestre.
 */
export function offreNegociee(f: FicheDesDelaisDeNova, p: PositionDuLaboratoire) {
  const o = f.offres[p.offre]!;
  const risqueDeRupture = p.stock < o.joursDeStock ? RISQUE_SOUS_LE_STOCK_DE_LIVRAISON : o.risqueDeRupture;
  const x = comparerAvecLHabituelle(f, o.code, { delaiDePaiement: p.delai, joursDeStock: p.stock, risqueDeRupture });
  return { o, risqueDeRupture, x };
}

/** Tout ce que le chapitre et son cas lisent : les trois offres face à l'habituelle, les curseurs, les variantes. */
export function choixDuFournisseur(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const habituelle = offreDe(f, f.offreHabituelle);
  const offres = f.offres.map((o) => ({ o, x: comparerAvecLHabituelle(f, o.code) }));
  const de = (code: CodeDOffre) => offres.find((y) => y.o.code === code)!;
  const asia = de("asiacomponents");
  const euro = de("europarts");
  const ref = de(habituelle.code).x.habituelle;
  const consommation = ref.consommation;
  const t4 = (code: CodeDOffre) => de(code).x.offre.trimestres.at(-1)!;
  const t3 = (code: CodeDOffre) => de(code).x.offre.trimestres.at(-2)!;
  const choix = choisirUneOffre(f);

  // Le premier curseur : le délai qui ferait rattraper à AsiaComponents l'offre habituelle en trésorerie.
  const achatsT4Asia = t4(asia.o.code).achatsHT;
  const aRattraper = auCentime(-asia.x.ecartDeTresorerie);
  const delaiExact = (aRattraper * JOURS_DU_TRIMESTRE) / achatsT4Asia;
  const delaiQuiRattrape = Math.ceil(delaiExact - 1e-9);
  const aCeDelai = comparerAvecLHabituelle(f, asia.o.code, { delaiDePaiement: delaiQuiRattrape });

  // Le second curseur : les jours d'avance que paie l'escompte du fournisseur habituel.
  const escompte = escompteDuFournisseur(f, habituelle.code)!;
  const avanceHT = auCentime(ref.achatsHT - escompte.escompteGagne);
  const coutDUnJourDAvance = (avanceHT * escompte.tauxDuDecouvert) / JOURS_DE_L_ANNEE_BANCAIRE;
  const joursQuePaieLEscompte = Math.floor(escompte.escompteGagne / coutDUnJourDAvance + 1e-9);

  // La variante de la qualité : la fiche de capacité de NOVA, le demi-point de défaut d'EuroParts.
  const capacite = CAPACITES_DU_COURS[f.code]!;
  const qualite = comparerAvecLHabituelle(f, euro.o.code, { qualite: capacite });
  const sans = coutsDeLaQualite(capacite);
  const avec = coutsDeLaQualite(capacite, { baisseDuTaux: euro.o.baisseDuTauxDeDefaut });
  const defautsEvites = Math.round(sans.defauts - avec.defauts);
  const coutsEvites = auCentime(sans.total - avec.total);
  const ventesGardees = Math.round(sans.ventesPerdues - avec.ventesPerdues);
  const margeGardee = auCentime(sans.margePerdue - avec.margePerdue);

  return {
    f,
    habituelle,
    asia,
    euro,
    offres,
    ref,
    consommation,
    t3,
    t4,
    choix,
    meilleureEnResultat: de(choix.meilleureEnResultat),
    achatsT4Asia,
    aRattraper,
    parJourDeDelai: auCentime(achatsT4Asia / JOURS_DU_TRIMESTRE),
    delaiExact: auCentime(delaiExact),
    delaiQuiRattrape,
    aCeDelai,
    escompte,
    avanceHT,
    coutDUnJourDAvance: auCentime(coutDUnJourDAvance),
    joursQuePaieLEscompte,
    qualite,
    defautsEvites,
    coutsEvites,
    ventesGardees,
    margeGardee,
    margeDeLaFicheDeQualite: ventesGardees > 0 ? auCentime(margeGardee / ventesGardees) : 0,
  };
}

export type ChoixDuFournisseur = ReturnType<typeof choixDuFournisseur>;

const nomDe = (o: { nom: string }) => o.nom;

/** Les trois offres de la fiche, côte à côte : le document de départ. */
export function tableauDesOffres(c: Pick<Cas, "code">): TableauDeDonnees {
  const k = choixDuFournisseur(c);
  const o = k.f.offres;
  return {
    titre: `Les offres de composants ${dE(k.f.entreprise)} pour N + 1`,
    colonnes: o.map(nomDe),
    lignes: [
      { libelle: "Prix d'un jeu de composants (HT)", valeurs: o.map((x) => eur(x.prixHT)) },
      { libelle: "Conditions de paiement", valeurs: o.map((x) => x.conditions) },
      { libelle: "Délai de paiement compté (jours)", valeurs: o.map((x) => qte(x.delaiDePaiement)) },
      { libelle: "Délai de livraison (jours)", valeurs: o.map((x) => qte(x.delaiDeLivraison)) },
      { libelle: "Stock gardé à la clôture (jours de consommation)", valeurs: o.map((x) => qte(x.joursDeStock)) },
      { libelle: "Risque de rupture par trimestre", valeurs: o.map((x) => pct(x.risqueDeRupture)) },
      { libelle: "Enceintes perdues par rupture", valeurs: o.map((x) => qte(x.ventesPerduesParRupture)) },
      { libelle: "Taux de défaut", valeurs: o.map((x) => (x.baisseDuTauxDeDefaut > 0 ? `−${qte(x.baisseDuTauxDeDefaut * 100)} point` : "inchangé")) },
    ],
  };
}

export const CHOISIR_SON_FOURNISSEUR: Chapitre = {
  code: "choisir-son-fournisseur",
  parcours: "gpme",
  palier: 2,
  blocs: ["BTS GPME Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME"],
  titre: "Choisir son fournisseur : prix, qualité et délai de paiement",
  accroche:
    "Le moins cher n'est pas toujours le meilleur fournisseur, et le meilleur résultat ne fait pas toujours la meilleure trésorerie. Trois offres de composants pour l'année de NOVA, comparées en résultat puis en trésorerie, un délai qui rattrape une offre, un escompte à juger en taux annuel.",
  objectifs: [
    "Comparer des offres de fournisseurs sur le prix, le délai, le stock, le risque et la qualité",
    "Calculer la dette fournisseurs et le stock qu'une offre laisse au bilan, hors taxes et toutes taxes comprises",
    "Expliquer l'écart de trésorerie par l'écart de résultat, de stock et de dettes",
    "Juger un escompte de fournisseur par son taux annuel, face au découvert",
    "Retrouver le délai qui fait rattraper une offre, et trancher entre résultat et trésorerie",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_FOURNISSEURS,
    pourquoi:
      "ce chapitre se joue chez NOVA, dans la simulation du cours : trois fournisseurs de composants y font chacun une offre pour toute l'année N + 1, avec son prix, son délai, son stock et son risque.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois offres de composants",
      notions: ["variable_costs", "payment_terms"],
      tableau: tableauDesOffres,
      texte: (c) => {
        const k = choixDuFournisseur(c);
        const f = k.f;
        const [ec, asia, eu] = f.offres;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, sur l'année N + 1. Le plan prévoit de vendre ${f.ventes.map(qte).join(", ")} enceintes, trimestre par trimestre : ${qte(k.consommation)} sur l'année. Chaque enceinte demande un jeu de composants ; ${f.entreprise} la vend ${eur(f.prixHT)} HT, et ses autres coûts variables sont de ${eur(f.autresCoutsVariablesHT)} par enceinte.`,
          `Le fournisseur habituel, ${ec!.nom}, a ses conditions : ${ec!.conditions}. À chaque clôture, la facture du dernier mois reste donc due en entier. La simulation le compte donc à ${ec!.delaiDePaiement} jours, un mois d'achats sur les ${JOURS_DU_TRIMESTRE} jours du trimestre. ${asia!.nom}, un importateur, se paie comptant ; ses conteneurs arrivent ${asia!.delaiDeLivraison} jours après la commande, et ${f.entreprise} doit garder ${asia!.joursDeStock} jours de consommation en stock. ${eu!.nom} se paie ${aDelai(eu!.delaiDePaiement)}, le délai maximal que la loi permet entre professionnels.`,
          `La simulation suppose : des offres comparées hors taxes (la TVA des achats se déduit, elle ne change que d'un mois le moment où l'argent sort) ; une offre gardée toute l'année ; des ruptures comptées en moyenne (${f.ventes.length} trimestres × ${pct(asia!.risqueDeRupture)} × ${qte(asia!.ventesPerduesParRupture)} enceintes) ; un stock qui part de zéro au 1er janvier ; un résultat avant impôt ; le découvert à ${pct(f.banque.tauxDuDecouvert)} l'an.`,
        ];
      },
      repere: () =>
        "Un fournisseur se choisit sur son prix, sa qualité et la sûreté de ses livraisons (le résultat), et sur son délai de paiement et le stock qu'il oblige à garder (la trésorerie).",
    },
    {
      id: "le-cout-des-composants",
      objectifs: [0],
      type: "montants",
      titre: "Le coût des composants de l'année",
      notions: ["variable_costs"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        return `Sur l'année, ${k.f.entreprise} consomme ${qte(k.consommation)} jeux de composants. Calculez le coût des composants de l'année, hors taxes, avec ${k.asia.o.nom} (${qte(k.consommation)} × ${eur(k.asia.o.prixHT)}) et avec ${k.euro.o.nom} (${qte(k.consommation)} × ${eur(k.euro.o.prixHT)}), puis l'économie ${dE(k.asia.o.nom)} face à l'offre habituelle (${qte(k.consommation)} × ${eur(k.habituelle.prixHT)} = ${eur(k.ref.coutDesComposantsHT)}).`;
      },
      champs: (c) => {
        const k = choixDuFournisseur(c);
        return [
          { libelle: `Coût des composants avec ${k.asia.o.nom} (HT)`, attendu: k.asia.x.offre.coutDesComposantsHT, calcul: `${qte(k.consommation)} × ${eur(k.asia.o.prixHT)} = ${eur(k.asia.x.offre.coutDesComposantsHT)}` },
          { libelle: `Coût des composants avec ${k.euro.o.nom} (HT)`, attendu: k.euro.x.offre.coutDesComposantsHT, calcul: `${qte(k.consommation)} × ${eur(k.euro.o.prixHT)} = ${eur(k.euro.x.offre.coutDesComposantsHT)}` },
          {
            libelle: `Économie ${dE(k.asia.o.nom)} (HT)`,
            attendu: k.asia.x.economie,
            calcul: `${eur(k.ref.coutDesComposantsHT)} − ${eur(k.asia.x.offre.coutDesComposantsHT)} = ${eur(k.asia.x.economie)}`,
          },
        ];
      },
      explication: (c) => {
        const k = choixDuFournisseur(c);
        return [
          `Sur le prix seul, ${k.asia.o.nom} fait gagner ${eur(k.asia.x.economie)} dans l'année, et ${k.euro.o.nom} coûte ${eur(-k.euro.x.economie)} de plus. Mais ${k.asia.o.nom} fait courir un risque de rupture que les deux autres n'ont pas : le prix ne dit pas tout du résultat.`,
        ];
      },
    },
    {
      id: "les-ruptures",
      objectifs: [0],
      type: "montants",
      titre: "Ce que coûtent les ruptures",
      notions: ["contribution_margin", "capacity"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        const a = k.asia;
        return `Chaque trimestre, ${a.o.nom} fait courir un risque de ${pct(a.o.risqueDeRupture)} qu'un conteneur arrive en retard : la ligne s'arrête, et ${qte(a.o.ventesPerduesParRupture)} enceintes ne se montent pas. Calculez la marge sur coût variable d'une enceinte avec ses composants (${eur(k.f.prixHT)} − ${eur(a.o.prixHT)} − ${eur(k.f.autresCoutsVariablesHT)}), les enceintes perdues en moyenne sur l'année (${k.f.ventes.length} × ${pct(a.o.risqueDeRupture)} × ${qte(a.o.ventesPerduesParRupture)}), la marge qu'elles font perdre, puis l'écart de résultat ${dE(a.o.nom)} (l'économie moins cette marge perdue). Négatif pour un écart défavorable à ${k.f.entreprise}.`;
      },
      champs: (c) => {
        const k = choixDuFournisseur(c);
        const a = k.asia;
        return [
          { libelle: `Marge d'une enceinte avec ${a.o.nom}`, attendu: a.x.offre.margeUnitaire, calcul: `${eur(k.f.prixHT)} − ${eur(a.o.prixHT)} − ${eur(k.f.autresCoutsVariablesHT)} = ${eur(a.x.offre.margeUnitaire)}` },
          {
            libelle: "Enceintes perdues en moyenne sur l'année",
            attendu: Math.round(a.x.offre.ventesPerdues),
            calcul: `${k.f.ventes.length} × ${pct(a.o.risqueDeRupture)} × ${qte(a.o.ventesPerduesParRupture)} = ${qte(Math.round(a.x.offre.ventesPerdues))}`,
          },
          { libelle: "Marge perdue par les ruptures", attendu: a.x.offre.margePerdue, calcul: `${qte(Math.round(a.x.offre.ventesPerdues))} × ${eur(a.x.offre.margeUnitaire)} = ${eur(a.x.offre.margePerdue)}` },
          { libelle: `Écart de résultat ${dE(a.o.nom)}`, attendu: a.x.ecartDeResultat, calcul: `${eur(a.x.economie)} − ${eur(a.x.offre.margePerdue)} = ${eur(a.x.ecartDeResultat)}` },
        ];
      },
      explication: (c) => {
        const k = choixDuFournisseur(c);
        const a = k.asia;
        return [
          `Une rupture ne fait pas perdre le prix de l'enceinte, mais sa marge : ${eur(a.x.offre.margeUnitaire)}, ce qu'elle aurait rapporté au-delà de ses coûts variables. Même ses ruptures payées, ${a.o.nom} fait gagner ${eur(a.x.ecartDeResultat)} de résultat sur l'année ; ${k.euro.o.nom}, sans rupture, en fait perdre ${eur(-k.euro.x.ecartDeResultat)}.`,
        ];
      },
    },
    {
      id: "predire-la-tresorerie",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la trésorerie",
      notions: ["net_treasury", "payment_terms"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        return `Avant de calculer, pariez. ${k.asia.o.nom} fait gagner ${eur(k.asia.x.ecartDeResultat)} de résultat sur l'année. Au 31 décembre, face à l'offre habituelle, la trésorerie ${dE(k.f.entreprise)} avec ${k.asia.o.nom} sera…`;
      },
      options: (c) => {
        const k = choixDuFournisseur(c);
        const e = k.asia.x.ecartDeTresorerie;
        const voir = `Faites varier le délai ${dE(k.asia.o.nom)} à l'étape suivante : le curseur montre ce que devient la trésorerie, et pourquoi.`;
        return [
          { texte: "Plus haute, d'au moins le résultat gagné : il finit en caisse", juste: e >= k.asia.x.ecartDeResultat, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus basse : payé comptant, avec du stock à payer d'avance", juste: e < 0, retour: `Bon pari. ${voir}` },
          { texte: "Plus haute, mais de moins que le résultat gagné", juste: e >= 0 && e < k.asia.x.ecartDeResultat, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-delai-au-curseur",
      objectifs: [4],
      type: "curseur",
      titre: "Le délai qui rattrape une offre",
      notions: ["payment_terms", "net_treasury", "bfr"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        return `${k.asia.o.nom} se paie comptant. Supposez ${queDe(k.f.entreprise)} lui négocie un délai, de ${DELAI_DU_CURSEUR.min} à ${DELAI_DU_CURSEUR.max} jours (le maximum que la loi permet). Une droite donne le crédit qu'il ferait au 31 décembre (ses achats du dernier trimestre, ${eur(k.achatsT4Asia)} HT, × délai ÷ ${JOURS_DU_TRIMESTRE}) ; l'autre, la trésorerie qu'il fait perdre comptant, face à l'offre habituelle. Placez le curseur sur le plus petit délai où ce crédit la rattrape, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Délai de paiement ${dE(choixDuFournisseur(c).asia.o.nom)}`, unite: "jours" }),
      cible: (c) => ({ attendu: choixDuFournisseur(c).delaiQuiRattrape, min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max }),
      zones: ["L'offre rattrape l'habituelle en trésorerie", "L'offre creuse la trésorerie"],
      rates: () => ({
        dessous: "À ce délai, le crédit du fournisseur ne rattrape pas encore la trésorerie perdue.",
        dessus: "Plus court, le crédit rattrape encore la trésorerie perdue : cherchez le plus petit délai.",
      }),
      montrer: "Montrer le délai",
      lecture: (c, j) => {
        const k = choixDuFournisseur(c);
        const x = comparerAvecLHabituelle(k.f, k.asia.o.code, { delaiDePaiement: j });
        return [
          { libelle: "Écart de résultat", montant: x.ecartDeResultat },
          { libelle: `Stock ${dE(k.asia.o.nom)} au 31 décembre (HT)`, montant: x.offre.stockHT },
          { libelle: `Dettes envers ${k.asia.o.nom} au 31 décembre (HT)`, montant: x.offre.dettesHT },
          { libelle: "Dettes envers l'offre habituelle au 31 décembre (HT)", montant: x.habituelle.dettesHT },
          { libelle: "Écart de trésorerie au 31 décembre", montant: x.ecartDeTresorerie, fort: true },
        ];
      },
      droites: (c) => {
        const k = choixDuFournisseur(c);
        return {
          produit: (j) => (k.achatsT4Asia * j) / JOURS_DU_TRIMESTRE,
          cout: () => k.aRattraper,
          libelles: [`Crédit ${dE(k.asia.o.nom)} au 31 décembre (HT)`, "Trésorerie perdue comptant, face à l'offre habituelle"],
        };
      },
      explication: (c) => {
        const k = choixDuFournisseur(c);
        const a = k.asia;
        return [
          `Comptant, ${a.o.nom} creuse la trésorerie du 31 décembre de ${eur(k.aRattraper)} : il fait gagner ${eur(a.x.ecartDeResultat)} de résultat, mais ${k.f.entreprise} paie d'avance ${eur(a.x.offre.stockHT)} de stock et perd les ${eur(a.x.habituelle.dettesHT)} de crédit que lui fait l'offre habituelle. Le résultat entre bien en caisse ; le stock et le crédit perdu en sortent davantage.`,
          `Chaque jour de délai rend ${eur(k.parJourDeDelai)} de crédit (${eur(k.achatsT4Asia)} ÷ ${JOURS_DU_TRIMESTRE}). À ${k.delaiQuiRattrape} jours, l'offre rattrape l'habituelle en trésorerie, et garde son avance en résultat : un délai que la loi permet, la négociation vaut d'être tentée. L'étape suivante formalise ce que le curseur montre : la dette et le stock de chaque offre.`,
        ];
      },
    },
    {
      id: "dettes-et-stock",
      objectifs: [1],
      type: "montants",
      titre: "La dette fournisseurs et le stock au bilan",
      notions: ["payment_terms", "bfr", "stock"],
      tableau: (c) => {
        const k = choixDuFournisseur(c);
        return {
          titre: `Le dernier trimestre de N + 1, avec chaque offre`,
          colonnes: k.f.offres.map(nomDe),
          lignes: [
            { libelle: "Composants consommés (jeux)", valeurs: k.f.offres.map((o) => qte(k.t4(o.code).consommation)) },
            { libelle: "Achats du trimestre (HT)", valeurs: k.f.offres.map((o) => eur(k.t4(o.code).achatsHT)) },
            { libelle: "Délai de paiement (jours)", valeurs: k.f.offres.map((o) => qte(o.delaiDePaiement)) },
            { libelle: "Stock à la clôture (jours de consommation)", valeurs: k.f.offres.map((o) => qte(o.joursDeStock)) },
          ],
        };
      },
      question: (c) => {
        const k = choixDuFournisseur(c);
        const t = k.t4(k.asia.o.code);
        return `Un trimestre compte ${JOURS_DU_TRIMESTRE} jours. Calculez les dettes fournisseurs au 31 décembre, hors taxes, envers l'offre habituelle et envers ${k.euro.o.nom} (achats du trimestre HT × délai ÷ ${JOURS_DU_TRIMESTRE}), le stock ${dE(k.asia.o.nom)} (${qte(t.consommation)} jeux × ${k.asia.o.joursDeStock} ÷ ${JOURS_DU_TRIMESTRE}, à ${eur(k.asia.o.prixHT)}), puis la dette envers l'offre habituelle telle que le bilan la porte, toutes taxes comprises (TVA de ${pct(k.f.tauxDeTva)}).`;
      },
      champs: (c) => {
        const k = choixDuFournisseur(c);
        const h = k.t4(k.habituelle.code);
        const e = k.t4(k.euro.o.code);
        const a = k.t4(k.asia.o.code);
        return [
          { libelle: "Dettes envers l'offre habituelle (HT)", attendu: h.dettesHT, calcul: `${eur(h.achatsHT)} × ${k.habituelle.delaiDePaiement} ÷ ${JOURS_DU_TRIMESTRE} = ${eur(h.dettesHT)}` },
          { libelle: `Dettes envers ${k.euro.o.nom} (HT)`, attendu: e.dettesHT, calcul: `${eur(e.achatsHT)} × ${k.euro.o.delaiDePaiement} ÷ ${JOURS_DU_TRIMESTRE} = ${eur(e.dettesHT)}` },
          {
            libelle: `Stock ${dE(k.asia.o.nom)} au 31 décembre (HT)`,
            attendu: a.stockHT,
            calcul: `${qte(a.consommation)} × ${k.asia.o.joursDeStock} ÷ ${JOURS_DU_TRIMESTRE} = ${qte(a.stockEnJeux)} jeux × ${eur(k.asia.o.prixHT)} = ${eur(a.stockHT)}`,
          },
          {
            libelle: "Dettes envers l'offre habituelle au bilan (TTC)",
            attendu: h.dettesTTC,
            calcul: `${eur(h.achatsHT)} × ${qte(1 + k.f.tauxDeTva)} × ${k.habituelle.delaiDePaiement} ÷ ${JOURS_DU_TRIMESTRE} = ${eur(h.dettesTTC)}`,
          },
        ];
      },
      explication: (c) => {
        const k = choixDuFournisseur(c);
        const h = k.t4(k.habituelle.code);
        return [
          `La dette fournisseurs, c'est l'argent que le fournisseur laisse à ${k.f.entreprise} en attendant d'être payé : un crédit sans intérêt. Au bilan, elle est toutes taxes comprises, ${eur(h.dettesTTC)} : c'est ce que ${k.f.entreprise} paiera, la facture du 10 décembre. Pour comparer les offres, on la prend hors taxes, ${eur(h.dettesHT)} : la TVA de ces achats, ${k.f.entreprise} la récupère sur sa déclaration.`,
          `Le stock joue à l'envers : ${eur(k.t4(k.asia.o.code).stockHT)} de composants achetés et pas encore consommés, de l'argent déjà sorti. Dettes et stock font le besoin en fonds de roulement que le fournisseur impose.`,
        ];
      },
    },
    {
      id: "l-ecart-de-tresorerie",
      objectifs: [2],
      type: "montants",
      titre: "L'écart de trésorerie au 31 décembre",
      notions: ["net_treasury", "bfr"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        return `Sans formule cette fois. Calculez l'écart de trésorerie au 31 décembre, hors taxes, ${dE(k.asia.o.nom)} puis ${dE(k.euro.o.nom)}, chacun face à l'offre habituelle. Négatif pour un écart défavorable à ${k.f.entreprise}.`;
      },
      champs: (c) => {
        const k = choixDuFournisseur(c);
        const ligne = (y: (typeof k.offres)[number]) =>
          `${eur(y.x.ecartDeResultat)} de résultat − ${eur(y.x.offre.stockHT)} de stock + ${eur(y.x.offre.dettesHT)} − ${eur(y.x.habituelle.dettesHT)} de dettes = ${eur(y.x.ecartDeTresorerie)}`;
        return [
          { libelle: `Écart de trésorerie ${dE(k.asia.o.nom)}`, attendu: k.asia.x.ecartDeTresorerie, calcul: ligne(k.asia) },
          { libelle: `Écart de trésorerie ${dE(k.euro.o.nom)}`, attendu: k.euro.x.ecartDeTresorerie, calcul: ligne(k.euro) },
        ];
      },
      explication: (c) => {
        const k = choixDuFournisseur(c);
        return [
          `Le moins cher creuse la trésorerie de ${eur(-k.asia.x.ecartDeTresorerie)}, le plus cher l'améliore de ${eur(k.euro.x.ecartDeTresorerie)}. La trésorerie suit le résultat, moins ce qui attend en stock, plus ce qu'on doit encore : ${k.euro.o.nom} fait crédit de ${k.euro.o.delaiDePaiement} jours, et ce crédit pèse plus que son surcoût.`,
          "Un fournisseur change le résultat par son prix ; la trésorerie, par son prix, son délai et le stock qu'il oblige à garder. Les deux se regardent ensemble.",
        ];
      },
    },
    {
      id: "le-meilleur-resultat",
      objectifs: [0],
      type: "choix",
      titre: "Le meilleur résultat",
      notions: ["variable_costs", "income_statement"],
      question: (c) => `Sur l'année N + 1, quelle offre donne à ${choixDuFournisseur(c).f.entreprise} le meilleur résultat ?`,
      options: (c) => {
        const k = choixDuFournisseur(c);
        const m = k.meilleureEnResultat;
        const motif = (code: CodeDOffre) => (code === k.habituelle.code ? "le fournisseur habituel" : code === k.asia.o.code ? "le prix le plus bas" : "la meilleure qualité");
        return k.offres.map((y) => ({
          texte: `${y.o.nom}, ${motif(y.o.code)}`,
          juste: y === m,
          retour:
            y === m
              ? `Oui : ${eur(y.x.ecartDeResultat)} de résultat de plus que l'offre habituelle, ruptures payées. Mais elle creuse la trésorerie du 31 décembre de ${eur(-y.x.ecartDeTresorerie)} : le meilleur résultat n'est pas la meilleure trésorerie.`
              : `Non : ${y.o.nom} fait ${y.x.ecartDeResultat === 0 ? "le résultat de référence" : `${eur(y.x.ecartDeResultat)} de résultat face à l'offre habituelle`}, quand ${m.o.nom} fait ${eur(m.x.ecartDeResultat)}.`,
        }));
      },
    },
    {
      id: "ce-qui-change-quoi",
      objectifs: [2],
      type: "tri",
      titre: "Ce qui change le résultat, ce qui change la trésorerie",
      notions: ["income_statement", "net_treasury", "bfr"],
      question: () => "Rangez chaque montant selon ce qu'il change : le résultat de l'année (et donc la trésorerie avec lui), ou la trésorerie seulement.",
      categories: [
        { code: "resultat", libelle: "Le résultat de l'année" },
        { code: "tresorerie", libelle: "La trésorerie seulement" },
      ],
      elements: (c) => {
        const k = choixDuFournisseur(c);
        const a = k.asia;
        return [
          { libelle: `Économie ${dE(a.o.nom)} sur les composants`, montant: a.x.economie, categorie: "resultat", pourquoi: "Un prix plus bas baisse une charge : le résultat monte." },
          { libelle: `Marge perdue par les ruptures ${dE(a.o.nom)}`, montant: -a.x.offre.margePerdue, categorie: "resultat", pourquoi: "Des enceintes qui ne se vendent pas : leur marge manque au résultat." },
          { libelle: `Stock ${dE(a.o.nom)} au 31 décembre`, montant: a.x.offre.stockHT, categorie: "tresorerie", pourquoi: "Un stock n'est pas une charge tant qu'il n'est pas consommé : de l'argent sorti, pas une perte." },
          { libelle: "Dette envers l'offre habituelle au 31 décembre (HT)", montant: a.x.habituelle.dettesHT, categorie: "tresorerie", pourquoi: "Un délai de paiement repousse la sortie d'argent sans changer le prix des achats." },
          { libelle: `Gain de qualité ${dE(k.euro.o.nom)}`, montant: k.qualite.offre.gainDeQualite, categorie: "resultat", pourquoi: "Moins de défauts à reprendre, des ventes gardées : des charges en moins, de la marge en plus." },
          { libelle: `Dette envers ${k.euro.o.nom} au 31 décembre (HT)`, montant: k.euro.x.offre.dettesHT, categorie: "tresorerie", pourquoi: "Le crédit du fournisseur laisse l'argent en caisse ; il faudra le payer." },
          { libelle: `Escompte ${dE(k.habituelle.nom)} gagné sur l'année`, montant: k.escompte.escompteGagne, categorie: "resultat", pourquoi: "Un escompte obtenu est un produit financier : le résultat monte." },
        ];
      },
      explication: () => [
        "Le prix, les ruptures, la qualité et l'escompte changent le résultat, et la trésorerie avec lui. Le délai et le stock ne changent que la trésorerie : ils déplacent le moment où l'argent sort, pas le montant des charges.",
      ],
    },
    {
      id: "predire-l-escompte",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur l'escompte du fournisseur",
      notions: ["payment_terms"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        const e = k.escompte;
        return `Avant de calculer, pariez. ${k.habituelle.nom} offre ${pct(e.offre.escompte!.taux)} d'escompte si ${k.f.entreprise} paie à ${e.offre.escompte!.jours} jours au lieu de ${e.offre.delaiDePaiement}. Pour payer ${e.joursDAvance} jours plus tôt, ${k.f.entreprise} passerait par son découvert, à ${pct(e.tauxDuDecouvert)} l'an. Prendre l'escompte…`;
      },
      options: (c) => {
        const k = choixDuFournisseur(c);
        const e = k.escompte;
        const voir = "Faites varier les jours d'avance à l'étape suivante : le curseur montre jusqu'où l'escompte paie le découvert.";
        return [
          { texte: `Rapporte : ${pct(e.offre.escompte!.taux)} pour ${e.joursDAvance} jours, c'est bien plus que ${pct(e.tauxDuDecouvert)} l'an`, juste: e.prendre, retour: `Bon pari. ${voir}` },
          { texte: `Coûte : ${pct(e.offre.escompte!.taux)} ne paie pas un découvert à ${pct(e.tauxDuDecouvert)}`, juste: !e.prendre, retour: `Pari à vérifier. ${voir}` },
          { texte: "Ne change rien : ce qu'on gagne d'un côté se perd de l'autre", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-escompte-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "Jusqu'où l'escompte paie le découvert",
      notions: ["payment_terms"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        const e = k.escompte;
        return `Faites varier les jours dont ${k.f.entreprise} avancerait ses paiements, de ${DELAI_DU_CURSEUR.min} à ${DELAI_DU_CURSEUR.max}. Une droite donne l'escompte gagné sur l'année (${pct(e.offre.escompte!.taux)} de ${eur(k.ref.achatsHT)} d'achats HT) ; l'autre, ce que coûte le découvert pour payer plus tôt (les achats, escompte déduit, × ${pct(e.tauxDuDecouvert)} × jours ÷ ${JOURS_DE_L_ANNEE_BANCAIRE}). Placez le curseur sur le plus grand nombre de jours d'avance où l'escompte paie encore le découvert, puis validez.`;
      },
      grandeur: () => ({ libelle: "Jours d'avance du paiement", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: choixDuFournisseur(c).joursQuePaieLEscompte, min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max }),
      zones: ["L'escompte paie le découvert", "Le découvert coûte plus que l'escompte"],
      rates: () => ({
        dessous: "L'escompte paie encore le découvert un peu plus loin : cherchez le plus grand nombre de jours.",
        dessus: "À cette avance, le découvert coûte déjà plus que l'escompte.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, j) => {
        const k = choixDuFournisseur(c);
        const decouvert = auCentime((k.avanceHT * k.escompte.tauxDuDecouvert * j) / JOURS_DE_L_ANNEE_BANCAIRE);
        return [
          { libelle: "Escompte gagné sur l'année", montant: k.escompte.escompteGagne },
          { libelle: "Coût du découvert pour payer plus tôt", montant: decouvert },
          { libelle: "Gain net de l'escompte", montant: auCentime(k.escompte.escompteGagne - decouvert), fort: true },
        ];
      },
      droites: (c) => {
        const k = choixDuFournisseur(c);
        return {
          produit: () => k.escompte.escompteGagne,
          cout: (j) => (k.avanceHT * k.escompte.tauxDuDecouvert * j) / JOURS_DE_L_ANNEE_BANCAIRE,
          libelles: ["Escompte gagné sur l'année", "Coût du découvert pour payer plus tôt"],
        };
      },
      explication: (c) => {
        const k = choixDuFournisseur(c);
        const e = k.escompte;
        return [
          `L'escompte de ${eur(e.escompteGagne)} paie le découvert jusqu'à ${k.joursQuePaieLEscompte} jours d'avance, à ${eur(k.coutDUnJourDAvance)} le jour. ${k.habituelle.nom} n'en demande que ${e.joursDAvance} : prendre l'escompte gagne ${eur(e.gainNet)} sur l'année.`,
          `Un pourcentage d'escompte ne se compare pas à un taux annuel : ${pct(e.offre.escompte!.taux)} pour ${e.joursDAvance} jours, c'est l'équivalent d'un placement à un taux bien plus fort que le découvert. L'étape suivante le calcule.`,
        ];
      },
    },
    {
      id: "l-escompte-en-taux-annuel",
      objectifs: [3],
      type: "montants",
      titre: "L'escompte en taux annuel",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        return `Calculez le taux annuel de l'escompte ${dE(k.habituelle.nom)} (ce que ${k.f.entreprise} gagne, rapporté à ce qu'elle paie plus tôt et au nombre de jours d'avance), en pourcentage, au centième ; le gain net de l'année si elle le prend ; puis de combien fond sa dette fournisseurs du 31 décembre, hors taxes, une fois payée à ${k.escompte.offre.escompte!.jours} jours.`;
      },
      champs: (c) => {
        const k = choixDuFournisseur(c);
        const e = k.escompte;
        const t = e.offre.escompte!.taux;
        const h = k.t4(k.habituelle.code);
        return [
          {
            libelle: "Taux annuel de l'escompte (%)",
            attendu: auCentime(e.tauxAnnuel * 100),
            calcul: `${pct(t)} ÷ ${pct(1 - t)} × ${JOURS_DE_L_ANNEE_BANCAIRE} ÷ ${e.joursDAvance} = ${pct(auCentime(e.tauxAnnuel * 100) / 100)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Gain net de l'escompte sur l'année",
            attendu: e.gainNet,
            calcul: `${eur(e.escompteGagne)} − ${eur(k.avanceHT)} × ${pct(e.tauxDuDecouvert)} × ${e.joursDAvance} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(e.escompteGagne)} − ${eur(e.coutDeLAvance)} = ${eur(e.gainNet)}`,
          },
          {
            libelle: "Dette du 31 décembre qui disparaît (HT)",
            attendu: e.detteQuiFondHT,
            calcul: `${eur(h.achatsHT)} × (${e.offre.delaiDePaiement} − ${e.offre.escompte!.jours}) ÷ ${JOURS_DU_TRIMESTRE} = ${eur(h.dettesHT)} − ${eur(encoursAuDelai(h.achatsHT, e.offre.escompte!.jours))} = ${eur(e.detteQuiFondHT)}`,
          },
        ];
      },
      explication: (c) => {
        const k = choixDuFournisseur(c);
        const e = k.escompte;
        return [
          `Refuser l'escompte, c'est emprunter à ${k.habituelle.nom} à ${pct(auCentime(e.tauxAnnuel * 100) / 100)} l'an, quand le découvert coûte ${pct(e.tauxDuDecouvert)} : mieux vaut payer tôt, même à découvert. Le résultat gagne ${eur(e.gainNet)}.`,
          `La trésorerie du 31 décembre, elle, perd ${eur(e.detteQuiFondHT)} de crédit fournisseur : la même tension que chez ${k.asia.o.nom}, en plus petit. Ce qui améliore le résultat peut creuser la trésorerie ; c'est à la trésorerie de dire si on peut se le permettre.`,
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "Le délai du curseur, par le calcul",
      notions: ["payment_terms", "bfr"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        return `Retrouvez par le calcul le délai que le curseur a donné. Calculez les achats ${dE(k.asia.o.nom)} au dernier trimestre (hors taxes : la consommation, plus le stock qui grossit), le délai exact qui annule son écart de trésorerie au 31 décembre (au centième de jour), puis l'écart de trésorerie au délai entier qu'il faut négocier. Négatif pour un écart défavorable à ${k.f.entreprise}.`;
      },
      champs: (c) => {
        const k = choixDuFournisseur(c);
        const t = k.t4(k.asia.o.code);
        const avant = k.t3(k.asia.o.code);
        return [
          {
            libelle: `Achats ${dE(k.asia.o.nom)} au dernier trimestre (HT)`,
            attendu: k.achatsT4Asia,
            calcul: `(${qte(t.consommation)} + ${qte(t.stockEnJeux)} − ${qte(avant.stockEnJeux)}) × ${eur(k.asia.o.prixHT)} = ${qte(t.consommation + t.stockEnJeux - avant.stockEnJeux)} × ${eur(k.asia.o.prixHT)} = ${eur(k.achatsT4Asia)}`,
          },
          {
            libelle: "Délai qui annule l'écart de trésorerie (jours)",
            attendu: k.delaiExact,
            calcul: `${eur(k.aRattraper)} × ${JOURS_DU_TRIMESTRE} ÷ ${eur(k.achatsT4Asia)} = ${qte(k.delaiExact)} jours`,
            tolerance: 0.01,
          },
          {
            libelle: `Écart de trésorerie à ${k.delaiQuiRattrape} jours`,
            attendu: k.aCeDelai.ecartDeTresorerie,
            calcul: `${eur(-k.aRattraper)} + ${eur(k.achatsT4Asia)} × ${k.delaiQuiRattrape} ÷ ${JOURS_DU_TRIMESTRE} = ${eur(-k.aRattraper)} + ${eur(k.aCeDelai.offre.dettesHT)} = ${eur(k.aCeDelai.ecartDeTresorerie)}`,
          },
        ];
      },
      explication: (c) => {
        const k = choixDuFournisseur(c);
        return [
          `La dette se calcule sur les achats du dernier trimestre, pas sur la consommation : ${k.f.entreprise} y achète aussi le stock qui grossit (de ${qte(k.t3(k.asia.o.code).stockEnJeux)} à ${qte(k.t4(k.asia.o.code).stockEnJeux)} jeux). Un délai ne se négocie pas au centième : ${qte(k.delaiExact)} jours se demandent ${k.delaiQuiRattrape}, dans les ${DELAI_MAXIMAL_CONVENU.joursDeLaFacture} jours que la loi permet.`,
        ];
      },
    },
    {
      id: "le-besoin-a-financer",
      objectifs: [4],
      type: "montants",
      titre: "Le résultat, une fois la trésorerie financée",
      notions: ["bfr", "net_treasury", "income_statement"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        return `${k.asia.o.nom}, payé comptant, gagne en résultat et perd en trésorerie. Ce qu'il fait perdre se finance, au découvert à ${pct(k.f.banque.tauxDuDecouvert)} l'an. Calculez le besoin de financement qu'il crée en plus (le stock à porter et le crédit perdu), ce que ce besoin coûte sur un an, puis l'écart de résultat ${dE(k.asia.o.nom)} une fois ce coût payé. Négatif pour un écart défavorable à ${k.f.entreprise}.`;
      },
      champs: (c) => {
        const k = choixDuFournisseur(c);
        const x = k.asia.x;
        return [
          { libelle: "Besoin de financement en plus", attendu: x.besoinEnPlus, calcul: `${eur(x.ecartDeStock)} de stock + ${eur(x.habituelle.dettesHT - x.offre.dettesHT)} de crédit perdu = ${eur(x.besoinEnPlus)}` },
          { libelle: "Coût du besoin sur un an", attendu: x.coutDuBesoin, calcul: `${eur(x.besoinEnPlus)} × ${pct(k.f.banque.tauxDuDecouvert)} = ${eur(x.coutDuBesoin)}` },
          { libelle: "Écart de résultat après financement", attendu: x.resultatApresFinancement, calcul: `${eur(x.ecartDeResultat)} − ${eur(x.coutDuBesoin)} = ${eur(x.resultatApresFinancement)}` },
        ];
      },
      explication: (c) => {
        const k = choixDuFournisseur(c);
        const x = k.asia.x;
        return [
          `Même en payant le découvert de son besoin, ${k.asia.o.nom} reste devant de ${eur(x.resultatApresFinancement)}. ${k.euro.o.nom}, à l'inverse, achète sa trésorerie trop cher : ses ${eur(k.euro.x.ecartDeTresorerie)} de trésorerie en plus économisent ${eur(-k.euro.x.coutDuBesoin)} de découvert, pour ${eur(-k.euro.x.ecartDeResultat)} de résultat perdu.`,
          `Le besoin de ${eur(x.besoinEnPlus)}, lui, ne disparaît pas : il dure tant que ${k.f.entreprise} garde ce fournisseur. Le calcul suppose qu'elle peut le financer ; c'est la question à poser avant de signer.`,
        ];
      },
    },
    {
      id: "europarts-et-la-qualite",
      objectifs: [0],
      type: "montants",
      titre: "Variante : la qualité comptée",
      notions: ["income_statement", "net_treasury"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        return `Variante. ${k.euro.o.nom} garantit des composants certifiés : le taux de défaut baisse de ${qte(k.euro.o.baisseDuTauxDeDefaut * 100)} point. Sur l'année, la fiche de qualité ${dE(k.f.entreprise)} en tire ${qte(k.defautsEvites)} défauts de moins (${eur(k.coutsEvites)} de coûts de non-qualité évités) et ${qte(k.ventesGardees)} ventes gardées, à ${eur(k.margeDeLaFicheDeQualite)} de marge chacune. Calculez le gain de qualité, l'écart de résultat ${dE(k.euro.o.nom)} qui en tient compte, puis son écart de trésorerie au 31 décembre. Négatif pour un écart défavorable à ${k.f.entreprise}.`;
      },
      champs: (c) => {
        const k = choixDuFournisseur(c);
        const q = k.qualite;
        return [
          { libelle: `Gain de qualité ${dE(k.euro.o.nom)}`, attendu: q.offre.gainDeQualite, calcul: `${eur(k.coutsEvites)} + ${qte(k.ventesGardees)} × ${eur(k.margeDeLaFicheDeQualite)} = ${eur(q.offre.gainDeQualite)}` },
          { libelle: "Écart de résultat, qualité comptée", attendu: q.ecartDeResultat, calcul: `${eur(k.euro.x.economie)} + ${eur(q.offre.gainDeQualite)} = ${eur(q.ecartDeResultat)}` },
          {
            libelle: "Écart de trésorerie, qualité comptée",
            attendu: q.ecartDeTresorerie,
            calcul: `${eur(q.ecartDeResultat)} + ${eur(q.offre.dettesHT)} − ${eur(q.habituelle.dettesHT)} = ${eur(q.ecartDeTresorerie)}`,
          },
        ];
      },
      explication: (c) => {
        const k = choixDuFournisseur(c);
        const q = k.qualite;
        return [
          `La qualité vaut ${eur(q.offre.gainDeQualite)} par an : elle ne paie pas le surcoût de ${eur(-k.euro.x.economie)}. ${k.euro.o.nom} reste en perte de ${eur(-q.ecartDeResultat)} de résultat, même s'il améliore la trésorerie de ${eur(q.ecartDeTresorerie)}. Refaire le calcul avec un critère de plus ne change pas le verdict ; il le rend plus solide.`,
        ];
      },
    },
    {
      id: "le-laboratoire-des-offres",
      objectifs: [0, 2],
      type: "simulation",
      titre: "Le laboratoire des offres",
      notions: ["payment_terms", "net_treasury", "stock"],
      question: (c) => {
        const k = choixDuFournisseur(c);
        return `Choisissez un fournisseur, négociez son délai de paiement et décidez du stock que ${k.f.entreprise} garde : le tableau compare l'année à l'offre habituelle telle qu'elle est, ${k.habituelle.nom} ${aDelai(k.habituelle.delaiDePaiement)} sans stock. Sous le stock qui couvre la livraison d'une offre, la ligne attend chaque conteneur : une rupture à chaque trimestre. Relevez le défi.`;
      },
      leviers: (c) => {
        const k = choixDuFournisseur(c);
        const i = k.f.offres.indexOf(k.asia.o);
        return [
          { code: "offre", libelle: "Le fournisseur", unite: "", min: 0, max: k.f.offres.length - 1, pas: 1, depart: i, choix: k.f.offres.map((o, n) => ({ valeur: n, libelle: o.nom })) },
          { code: "delai", libelle: "Délai de paiement négocié", unite: "jours", min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max, pas: 1, depart: k.asia.o.delaiDePaiement },
          { code: "stock", libelle: "Stock gardé à la clôture", unite: "jours de consommation", min: STOCK_DU_LABORATOIRE.min, max: STOCK_DU_LABORATOIRE.max, pas: STOCK_DU_LABORATOIRE.pas, depart: k.asia.o.joursDeStock },
        ];
      },
      lecture: (c, p) => {
        const k = choixDuFournisseur(c);
        const lire = (q: Readonly<Record<string, number>>) => offreNegociee(k.f, { offre: q.offre!, delai: q.delai!, stock: q.stock! }).x;
        const x = lire(p);
        const d = lire({ offre: k.f.offres.indexOf(k.asia.o), delai: k.asia.o.delaiDePaiement, stock: k.asia.o.joursDeStock });
        return [
          { libelle: "Prix d'un jeu de composants (HT)", montant: x.offre.prixHT, reference: d.offre.prixHT },
          { libelle: "Économie sur les composants", montant: x.economie, reference: d.economie, effet: true },
          { libelle: "Marge perdue par les ruptures", montant: -x.offre.margePerdue, reference: -d.offre.margePerdue, effet: true },
          { libelle: "Écart de résultat", montant: x.ecartDeResultat, reference: d.ecartDeResultat, effet: true },
          { libelle: "Stock au 31 décembre (HT)", montant: x.offre.stockHT, reference: d.offre.stockHT },
          { libelle: "Dettes fournisseurs au 31 décembre (HT)", montant: x.offre.dettesHT, reference: d.offre.dettesHT },
          { libelle: "Écart de trésorerie au 31 décembre", montant: x.ecartDeTresorerie, reference: d.ecartDeTresorerie, effet: true, fort: true },
          { libelle: "Écart de résultat après financement", montant: x.resultatApresFinancement, reference: d.resultatApresFinancement, effet: true },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      // Le stock fait un saut : sous le stock de livraison, une rupture par trimestre emporte le résultat.
      graphique: (c) => {
        const k = choixDuFournisseur(c);
        const lire = (q: Readonly<Record<string, number>>) => offreNegociee(k.f, { offre: q.offre!, delai: q.delai!, stock: q.stock! }).x;
        return {
          levier: "stock",
          courbes: [
            { libelle: "Écart de résultat", valeur: (p) => lire(p).ecartDeResultat + 0 },
            { libelle: "Écart de trésorerie au 31 décembre", valeur: (p) => lire(p).ecartDeTresorerie + 0 },
          ],
        };
      },
      defi: (c) => {
        const k = choixDuFournisseur(c);
        const lire = (q: Readonly<Record<string, number>>) => offreNegociee(k.f, { offre: q.offre!, delai: q.delai!, stock: q.stock! });
        return {
          consigne: "Trouvez une offre et des conditions qui fassent mieux que l'offre habituelle à la fois en résultat et en trésorerie au 31 décembre.",
          atteint: (p) => {
            const { x } = lire(p);
            return x.ecartDeResultat > 0 && x.ecartDeTresorerie >= 0;
          },
          indice: (p) => {
            const { o, x, risqueDeRupture } = lire(p);
            if (x.ecartDeResultat <= 0)
              return risqueDeRupture === RISQUE_SOUS_LE_STOCK_DE_LIVRAISON && risqueDeRupture !== o.risqueDeRupture
                ? `Sous ${o.joursDeStock} jours de stock, ${o.nom} ne couvre plus sa livraison : une rupture par trimestre emporte le résultat (${eur(x.ecartDeResultat)}).`
                : `Avec ${o.nom}, l'écart de résultat vaut ${eur(x.ecartDeResultat)} : un délai ne change pas le prix des achats. Il faut l'offre la moins chère.`;
            return `Le résultat y est (${eur(x.ecartDeResultat)}), pas la trésorerie (${eur(x.ecartDeTresorerie)}) : négociez un délai plus long, ou gardez moins de stock sans descendre sous celui qui couvre la livraison.`;
          },
          solution: { offre: k.f.offres.indexOf(k.asia.o), delai: k.delaiQuiRattrape, stock: k.asia.o.joursDeStock },
        };
      },
      explication: (c, p) => {
        const k = choixDuFournisseur(c);
        const { o, x } = lire(k, p);
        return [
          `${o.nom}, payé ${aDelai(p.delai!)} avec ${qte(p.stock!)} jours de stock, fait mieux que l'offre habituelle sur les deux tableaux : ${eur(x.ecartDeResultat)} de résultat et ${eur(x.ecartDeTresorerie)} de trésorerie au 31 décembre.`,
          `Trois leviers, trois effets. Le fournisseur fixe le prix, donc le résultat. Le délai ne change que la trésorerie. Le stock aussi, tant qu'il couvre la livraison ; en dessous, il économise de la trésorerie et fait perdre bien plus de résultat : le graphique montre ce saut. C'est pourquoi on négocie le délai, et pas le stock.`,
        ];
      },
    },
    {
      id: "resultat-ou-tresorerie",
      objectifs: [4],
      type: "choix",
      titre: "Votre recommandation",
      notions: ["income_statement", "net_treasury", "bfr"],
      question: (c) => `La dirigeante ${dE(choixDuFournisseur(c).f.entreprise)} choisit le fournisseur de toute l'année N + 1, aux conditions des offres telles qu'elles sont. Quelle recommandation lui faites-vous ?`,
      options: (c) => {
        const k = choixDuFournisseur(c);
        const a = k.asia.x;
        const juste = k.choix.meilleureApresFinancement === k.asia.o.code && a.resultatApresFinancement > 0;
        return [
          {
            texte: `${k.asia.o.nom}, si ${k.f.entreprise} peut porter ${eur(a.besoinEnPlus)} de besoin en plus`,
            juste,
            retour: juste
              ? `Oui : même ce besoin financé au découvert, ${k.asia.o.nom} reste devant de ${eur(a.resultatApresFinancement)}. La condition est la trésorerie : ${eur(-a.ecartDeTresorerie)} de moins au 31 décembre, tant que dure le contrat. Et un délai de ${k.delaiQuiRattrape} jours, s'il l'accorde, lèverait la condition.`
              : `Non : une fois son besoin financé, ${k.asia.o.nom} fait ${eur(a.resultatApresFinancement)} face à l'offre habituelle.`,
          },
          {
            texte: `${k.asia.o.nom} sans condition : ${eur(a.ecartDeResultat)} de résultat en plus`,
            juste: false,
            retour: `Non : c'est oublier la trésorerie. ${k.asia.o.nom} creuse celle du 31 décembre de ${eur(-a.ecartDeTresorerie)}, et ce besoin se finance, ou ne se finance pas.`,
          },
          {
            texte: `${k.euro.o.nom} : la seule offre qui améliore la trésorerie`,
            juste: false,
            retour: `Non : ses ${eur(k.euro.x.ecartDeTresorerie)} de trésorerie en plus coûtent ${eur(-k.euro.x.ecartDeResultat)} de résultat, quand les financer coûterait bien moins. Même la qualité comptée, il perd ${eur(-k.qualite.ecartDeResultat)}.`,
          },
          {
            texte: "L'offre habituelle : elle ne creuse ni le résultat ni la trésorerie",
            juste: false,
            retour: `Non : c'est renoncer à ${eur(a.resultatApresFinancement)} de résultat, découvert payé, si la trésorerie peut porter le besoin.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payment_terms", "net_treasury", "bfr"],
      tableau: (c) => {
        const k = choixDuFournisseur(c);
        return {
          titre: "Les trois offres sur l'année N + 1, face à l'offre habituelle",
          colonnes: k.offres.map((y) => y.o.nom),
          lignes: [
            { libelle: "Coût des composants de l'année (HT)", valeurs: k.offres.map((y) => eur(y.x.offre.coutDesComposantsHT)) },
            { libelle: "Écart de résultat", valeurs: k.offres.map((y) => eur(y.x.ecartDeResultat)) },
            { libelle: "Stock au 31 décembre (HT)", valeurs: k.offres.map((y) => eur(y.x.offre.stockHT)) },
            { libelle: "Dettes fournisseurs au 31 décembre (HT)", valeurs: k.offres.map((y) => eur(y.x.offre.dettesHT)) },
            { libelle: "Dettes fournisseurs au bilan (TTC)", valeurs: k.offres.map((y) => eur(y.x.offre.dettesTTC)) },
            { libelle: "Écart de trésorerie au 31 décembre", valeurs: k.offres.map((y) => eur(y.x.ecartDeTresorerie)) },
            { libelle: "Écart de résultat après financement", valeurs: k.offres.map((y) => eur(y.x.resultatApresFinancement)) },
          ],
        };
      },
      texte: (c) => {
        const k = choixDuFournisseur(c);
        return [
          `Chez ${k.f.entreprise}, ${k.asia.o.nom} donne le meilleur résultat (${eur(k.asia.x.ecartDeResultat)} de plus) et creuse la trésorerie du 31 décembre de ${eur(-k.asia.x.ecartDeTresorerie)} ; ${k.euro.o.nom} fait l'inverse. Un délai de ${k.delaiQuiRattrape} jours suffirait à ${k.asia.o.nom} pour rattraper l'offre habituelle en trésorerie, et l'escompte ${dE(k.habituelle.nom)}, ${pct(auCentime(k.escompte.tauxAnnuel * 100) / 100)} l'an, vaut d'être pris.`,
          "Choisir un fournisseur, c'est arbitrer : le prix, les ruptures et la qualité font le résultat ; le délai et le stock font, en plus, la trésorerie. L'écart de trésorerie s'explique par l'écart de résultat, moins l'écart de stock, plus l'écart de dettes. Un escompte se juge en taux annuel, face au coût du découvert.",
          "Au niveau de l'examen, vous savez calculer la dette fournisseurs et le stock qu'une offre laisse au bilan, hors taxes et toutes taxes comprises, expliquer un écart de trésorerie, retrouver à rebours le délai qui fait rattraper une offre, ramener un escompte à son taux annuel, et trancher entre résultat et trésorerie en finançant le besoin.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Dettes fournisseurs au bilan (TTC) = achats du trimestre (TTC) × délai ÷ 90. Pour comparer des offres, hors taxes : écart de trésorerie = écart de résultat − écart de stock + écart de dettes. Taux annuel d'un escompte = t ÷ (1 − t) × 360 ÷ jours d'avance.",
    },
  ],
};

/** La lecture du laboratoire à une position, pour l'explication. */
function lire(k: ChoixDuFournisseur, p: Readonly<Record<string, number>>) {
  return offreNegociee(k.f, { offre: p.offre!, delai: p.delai!, stock: p.stock! });
}
