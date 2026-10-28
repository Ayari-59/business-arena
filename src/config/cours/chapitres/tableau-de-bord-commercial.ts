import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { CABINETS_DU_COURS, type CodeDIndicateurCommercial, type CodeDeCommercial, type FicheDuCabinet, type Trimestre } from "../monde/atlas-conseil";
import {
  commercialDe,
  comptesDuCommercial,
  seuilDeRentabiliteDUnCommercial,
  tableauDeBordCommercial,
  trimestresDeLAnnee,
  voyantAllume,
} from "../monde/relation-client";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE TABLEAU DE BORD COMMERCIAL (BTS NDRC, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le cabinet
 * ATLAS CONSEIL a une fiche figée (monde/atlas-conseil.ts) et un modèle simple
 * (monde/relation-client.ts, partie 7 : le tableau de bord commercial). Une évolution du moteur ne
 * change rien ici. Décision du propriétaire (octobre 2026) : le contenu du cours fait l'objet de la
 * simulation, inspirée des entreprises de l'arène sans en être le reflet exact.
 *
 * L'objet : le tableau de bord de 3 commerciaux sur l'année N, trimestre par trimestre, face au même
 * trimestre de N − 1 et à leurs objectifs. Ses indicateurs : rendez-vous, devis, contrats, TAUX DE
 * TRANSFORMATION DES DEVIS (contrats ÷ devis), PANIER MOYEN (chiffre d'affaires ÷ contrats),
 * réalisation de l'objectif, évolution sur N − 1, et le SEUIL DE RENTABILITÉ D'UN COMMERCIAL (son coût
 * ÷ (taux de marge de ses comptes − taux de commission)). Chacun a son voyant, qui s'allume sous un
 * seuil d'alerte de la fiche. Trois leçons : comparer au même trimestre de N − 1, pas au trimestre
 * d'avant ; un objectif de chiffre d'affaires tenu peut cacher une transformation qui décroche ; un
 * voyant alerte, il ne juge pas seul (le N − 1 d'un nouveau commercial est celui d'un autre).
 *
 * Ce qui a changé en passant sur le monde du cours : la demande adressée, la part de marché et les
 * ventes de l'arène disparaissent (la simulation du cours n'a pas de part de marché) ; les rendez-vous,
 * les devis, les contrats, les objectifs, les voyants et le seuil d'un commercial sont neufs. Le
 * diagnostic du trimestre qui décroche (une demande qui baisse ou une demande qu'on ne sert pas) et le
 * tri des indicateurs sont gardés, sur les chiffres du cabinet.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, le-cabinet, les-indicateurs-de-marc, le-seuil-d-hugo (la formule est au repère
 *     ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-seuil
 *     puis le-seuil-au-curseur (le chiffre d'affaires d'Hugo qui paie son coût) avant le-seuil-d-hugo ;
 *     predire-la-transformation puis le-laboratoire-d-hugo (devis, taux de transformation, panier et
 *     rémunération, fixe seul ou avec commission) avant la-transformation-d-hugo ; predire-nadia puis
 *     les-devis-de-nadia (les devis qu'il lui fallait au taux de N − 1) avant les-voyants-de-nadia ;
 *   · autonome : le-trimestre-qui-decroche, les-seuils-de-marc-et-de-nadia, la-transformation-d-hugo,
 *     les-voyants-de-nadia, ranger (ni formule ni chiffres à prendre ; le calcul de la correction montre
 *     le chemin) ;
 *   · expert : les-trimestres-d-hugo (croiser le seuil et les trimestres), la-commission-pour-tous (une
 *     variante chiffrée : 10 % de commission relèvent chaque seuil), juger-hugo (une critique de la
 *     méthode : ce qu'un voyant ne dit pas) ; puis la synthèse.
 */

/** Le chapitre se joue chez ATLAS CONSEIL seule : un cabinet dont les commerciaux vendent affaire par affaire. */
export const ENTREPRISES_DU_TABLEAU_COMMERCIAL: readonly string[] = ["conseil"];

/** Le commercial de la conquête, celui du seuil et du laboratoire ; celle des entreprises, celle de la transformation. */
export const COMMERCIAL_DE_LA_CONQUETE: CodeDeCommercial = "conquete";
export const COMMERCIALE_DES_ENTREPRISES: CodeDeCommercial = "entreprises";
export const COMMERCIAL_DES_GRANDS_COMPTES: CodeDeCommercial = "grands-comptes";

/**
 * LA COMMISSION DE LA VARIANTE ET DU LABORATOIRE (hypothèse du cours) : 10 % du chiffre d'affaires
 * signé, un ordre de grandeur courant pour un commercial de conseil. Le cabinet n'en paie pas en N.
 */
export const COMMISSION_DE_LA_VARIANTE = 0.1;

/** Les bornes du curseur du seuil, en milliers d'euros de chiffre d'affaires du trimestre. */
export const MILLIERS_DU_CURSEUR = { min: 0, max: 60 } as const;

/** Les bornes du curseur des devis de Nadia au dernier trimestre. */
export const DEVIS_DU_CURSEUR = { min: 20, max: 60 } as const;

/** Les leviers du laboratoire d'Hugo au premier trimestre : devis, taux de transformation (%), panier (€). */
export const LEVIERS_DU_LABORATOIRE = {
  devis: { min: 4, max: 20, pas: 1 },
  taux: { min: 10, max: 50, pas: 1 },
  panier: { min: 4_000, max: 14_000, pas: 500 },
} as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Un pourcentage déjà multiplié par 100 : 22,2 → « 22,2 % ». */
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
/** Un rapport en pourcentage, au dixième : 0,2222 → 22,2. */
const enPct = (x: number) => auDixieme(x * 100);
/** Arrondi à l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);

/** Le nom de chaque voyant, pour les textes. */
const NOMS_DES_VOYANTS: Readonly<Record<CodeDIndicateurCommercial, string>> = {
  realisationDeLObjectif: "l'objectif",
  tauxDeTransformation: "la transformation",
  evolutionSurNMoins1: "l'évolution sur N − 1",
  seuilDeRentabilite: "le seuil",
};

/** La fiche du cabinet du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDuCabinet => CABINETS_DU_COURS[c.code]!;

/** Tout ce que le chapitre et son cas demandent, sur la fiche. */
export function tableauDuCabinet(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = tableauDeBordCommercial(f);
  const journees = trimestresDeLAnnee(f);
  const de = (code: CodeDeCommercial) => {
    const k = commercialDe(f, code);
    const comptes = comptesDuCommercial(f, code);
    const s = seuilDeRentabiliteDUnCommercial(f, code);
    const sv = seuilDeRentabiliteDUnCommercial(f, code, { tauxDeCommission: COMMISSION_DE_LA_VARIANTE });
    const annee = t.commerciaux.find((x) => x.code === code)!;
    return { k, comptes, s, sv, annee, trimestres: annee.trimestres };
  };
  const marc = de(COMMERCIAL_DES_GRANDS_COMPTES);
  const nadia = de(COMMERCIALE_DES_ENTREPRISES);
  const hugo = de(COMMERCIAL_DE_LA_CONQUETE);
  // Le trimestre qui décroche : la plus forte baisse de chiffre d'affaires d'un trimestre au suivant.
  const baisses = t.cabinet.slice(1).map((q, i) => ({ q, avant: t.cabinet[i]!, baisse: auCentime(t.cabinet[i]!.chiffreDAffaires - q.chiffreDAffaires) }));
  const chute = baisses.reduce((a, b) => (b.baisse > a.baisse ? b : a));
  const serviceDe = (q: Trimestre) => journees[q - 1]!;
  // Hugo au premier trimestre : les contrats et les devis qu'il lui fallait, à son panier et à son taux, pour son seuil.
  const h1 = hugo.trimestres[0]!;
  const contratsPourLeSeuil = plafond(hugo.s.seuil / h1.panier);
  const devisPourLeSeuil = plafond(contratsPourLeSeuil / h1.tauxDeTransformation);
  // Nadia au dernier trimestre : les devis qu'il lui fallait au taux du même trimestre de N − 1, pour son objectif.
  const n4 = nadia.trimestres[3]!;
  const devisAuTauxDeNMoins1 = plafond(n4.objectif / (n4.nMoins1.tauxDeTransformation * n4.panier));
  const demandees = journees.reduce((s, q) => s + q.demandees, 0);
  const vendues = journees.reduce((s, q) => s + q.vendues, 0);
  return {
    f,
    t,
    journees,
    marc,
    nadia,
    hugo,
    chute,
    serviceDe,
    demandees,
    vendues,
    serviceDeLAnnee: vendues / demandees,
    contratsPourLeSeuil,
    devisPourLeSeuil,
    devisAuTauxDeNMoins1,
    devisEnTrop: n4.devis - devisAuTauxDeNMoins1,
    commissionDHugoSurLAnnee: auCentime(hugo.annee.chiffreDAffaires * COMMISSION_DE_LA_VARIANTE),
    resultatDHugoAvecLaCommission: auCentime(hugo.annee.chiffreDAffaires * (hugo.s.tauxDeMarge - COMMISSION_DE_LA_VARIANTE) - hugo.annee.cout),
  };
}

export type TableauDuCabinet = ReturnType<typeof tableauDuCabinet>;

/**
 * Le laboratoire : Hugo au premier trimestre, à des devis, un taux de transformation (en %) et un panier
 * quelconques, payé au fixe seul (`remuneration` 0) ou avec une commission (`remuneration` en % du
 * chiffre d'affaires). Les contrats valent devis × taux (des contrats attendus) ; ses affaires laissent
 * le taux de marge de ses comptes ; la commission relève son seuil : coût ÷ (taux de marge − commission).
 * Les voyants sont ceux de la fiche, face à son objectif et au premier trimestre de N − 1.
 */
export function laboratoireDHugo(x: TableauDuCabinet, p: Readonly<Record<string, number>>) {
  const h = x.hugo;
  const q = h.k.n[0]!;
  const avant = h.k.nMoins1[0]!;
  const r = p.remuneration! / 100;
  const contrats = (p.devis! * p.taux!) / 100;
  const chiffreDAffaires = auCentime(contrats * p.panier!);
  const marge = auCentime(chiffreDAffaires * h.s.tauxDeMarge);
  const commission = auCentime(chiffreDAffaires * r);
  const seuil = auCentime(h.s.cout / (h.s.tauxDeMarge - r));
  const valeurs = {
    realisationDeLObjectif: chiffreDAffaires / q.objectif,
    tauxDeTransformation: p.taux! / 100,
    evolutionSurNMoins1: chiffreDAffaires / avant.chiffreDAffaires - 1,
    seuilDeRentabilite: chiffreDAffaires / seuil,
  };
  const s = x.f.seuilsDAlerte;
  const voyants = (Object.keys(s) as (keyof typeof valeurs)[]).filter((k) => voyantAllume(s[k], valeurs[k]));
  return {
    contrats: auCentime(contrats),
    chiffreDAffaires,
    marge,
    commission,
    seuil,
    resultat: auCentime(marge - commission - h.s.cout),
    realisation: enPct(valeurs.realisationDeLObjectif),
    voyants,
    sousLeSeuil: voyants.includes("seuilDeRentabilite"),
  };
}

/** L'année du cabinet, trimestre par trimestre, face à N − 1 : le document de départ. */
function tableauDeLAnnee(x: TableauDuCabinet): TableauDeDonnees {
  return {
    titre: `Le tableau de bord ${/^[AEIOUYÉ]/.test(x.f.entreprise) ? "d'" : "de "}${x.f.entreprise}, ${x.f.anneeDeReference}`,
    colonnes: x.t.cabinet.map((q) => `T${q.trimestre}`),
    lignes: [
      { libelle: "Chiffre d'affaires", valeurs: x.t.cabinet.map((q) => eur(q.chiffreDAffaires)) },
      { libelle: "Chiffre d'affaires du même trimestre de N − 1", valeurs: x.t.cabinet.map((q) => eur(q.chiffreDAffairesN1)) },
      { libelle: "Journées demandées", valeurs: x.journees.map((q) => qte(q.demandees)) },
      { libelle: "Journées vendues", valeurs: x.journees.map((q) => qte(q.vendues)) },
      { libelle: "Capacité des consultants, en journées", valeurs: x.journees.map((q) => qte(q.capacite)) },
    ],
  };
}

/** Le premier trimestre des 3 commerciaux. */
function tableauDuPremierTrimestre(x: TableauDuCabinet): TableauDeDonnees {
  const ks = [x.marc, x.nadia, x.hugo];
  return {
    titre: "Le premier trimestre de chaque commercial",
    colonnes: ks.map((k) => k.k.prenom),
    lignes: [
      { libelle: "Rendez-vous", valeurs: ks.map((k) => qte(k.k.n[0]!.rendezVous)) },
      { libelle: "Devis remis", valeurs: ks.map((k) => qte(k.k.n[0]!.devis)) },
      { libelle: "Contrats signés", valeurs: ks.map((k) => qte(k.k.n[0]!.contrats)) },
      { libelle: "Chiffre d'affaires", valeurs: ks.map((k) => eur(k.k.n[0]!.chiffreDAffaires)) },
      { libelle: "Objectif du trimestre", valeurs: ks.map((k) => eur(k.k.n[0]!.objectif)) },
      { libelle: "Chiffre d'affaires du premier trimestre de N − 1", valeurs: ks.map((k) => eur(k.k.nMoins1[0]!.chiffreDAffaires)) },
    ],
  };
}

/** Les comptes et le coût de chaque commercial. */
function tableauDesCommerciaux(x: TableauDuCabinet): TableauDeDonnees {
  const ks = [x.marc, x.nadia, x.hugo];
  return {
    titre: "Les comptes et le coût de chaque commercial",
    colonnes: ks.map((k) => k.k.prenom),
    lignes: [
      { libelle: "Comptes suivis", valeurs: ks.map((k) => qte(k.comptes.comptes.length)) },
      { libelle: "Chiffre d'affaires de leurs comptes, sur l'année", valeurs: ks.map((k) => eur(k.comptes.chiffreDAffaires)) },
      { libelle: "Marge sur coûts directs de leurs comptes", valeurs: ks.map((k) => eur(k.comptes.marge)) },
      { libelle: "Salaire chargé, par trimestre", valeurs: ks.map((k) => eur(k.k.salaireCharge)) },
      { libelle: "Frais, par trimestre", valeurs: ks.map((k) => eur(k.k.frais)) },
    ],
  };
}

/** Les trimestres d'un commercial, face à N − 1 et à l'objectif. */
function tableauDesTrimestres(k: TableauDuCabinet["hugo"]): TableauDeDonnees {
  return {
    titre: `Les trimestres ${/^[AEIOUYÉH]/.test(k.k.prenom) ? "d'" : "de "}${k.k.prenom}`,
    colonnes: k.trimestres.map((q) => `T${q.trimestre}`),
    lignes: [
      { libelle: "Rendez-vous", valeurs: k.trimestres.map((q) => qte(q.rendezVous)) },
      { libelle: "Devis remis", valeurs: k.trimestres.map((q) => qte(q.devis)) },
      { libelle: "Contrats signés", valeurs: k.trimestres.map((q) => qte(q.contrats)) },
      { libelle: "Chiffre d'affaires", valeurs: k.trimestres.map((q) => eur(q.chiffreDAffaires)) },
      { libelle: "Objectif", valeurs: k.trimestres.map((q) => eur(q.objectif)) },
      { libelle: "Devis remis en N − 1", valeurs: k.trimestres.map((q) => qte(q.nMoins1.devis)) },
      { libelle: "Contrats signés en N − 1", valeurs: k.trimestres.map((q) => qte(q.nMoins1.contrats)) },
      { libelle: "Chiffre d'affaires de N − 1", valeurs: k.trimestres.map((q) => eur(q.nMoins1.chiffreDAffaires)) },
    ],
  };
}

export const TABLEAU_DE_BORD_COMMERCIAL: Chapitre = {
  code: "tableau-de-bord-commercial",
  parcours: "ndrc",
  palier: 4,
  blocs: [
    "BTS NDRC Bloc 1 · Relation client et négociation-vente",
  ],
  titre: "Le tableau de bord commercial",
  accroche:
    "3 commerciaux, 4 trimestres, face à N − 1 et à leurs objectifs. Lire leurs rendez-vous, leurs devis et leurs contrats, trouver le seuil de rentabilité d'un commercial, voir le voyant que l'objectif tenu cachait, et savoir ce qu'un voyant ne dit pas.",
  objectifs: [
    "Lire un tableau de bord commercial face au même trimestre de N − 1 et aux objectifs",
    "Calculer un taux de transformation des devis, un panier moyen et la réalisation d'un objectif",
    "Calculer le seuil de rentabilité d'un commercial, avec ou sans commission",
    "Repérer, derrière un objectif tenu, la transformation qui décroche",
    "Juger un commercial sur l'année, et dire ce qu'un voyant ne dit pas",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TABLEAU_COMMERCIAL,
    pourquoi:
      "ce chapitre suit les commerciaux du cabinet ATLAS CONSEIL, qui vendent ses journées affaire par affaire : leurs rendez-vous, leurs devis et leurs contrats, trimestre par trimestre, face à N − 1 et à leurs objectifs.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une année du cabinet, face à N − 1",
      notions: ["dashboard"],
      tableau: (c) => tableauDeLAnnee(tableauDuCabinet(c)),
      texte: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.journees[0]!;
        return [
          `Ce chapitre se joue dans la simulation du cours, au cabinet ${x.f.entreprise}, sur ${x.f.anneeDeReference}, trimestre par trimestre. Ses ${qte(x.f.consultants.nombre)} consultants peuvent faire ${qte(q.capacite)} journées par trimestre ; ses commerciaux les vendent : ${x.marc.k.prenom} les grands comptes et le secteur public, ${x.nadia.k.prenom} les entreprises, ${x.hugo.k.prenom} la conquête de nouveaux comptes. ${x.hugo.k.prenom} est arrivé en janvier, à la place d'un commercial expérimenté.`,
          "La simulation suppose qu'une mission signée dans un trimestre y est réalisée et facturée. La marge d'un compte est sa marge sur coûts directs : son chiffre d'affaires, moins ses frais de mission et ses supports, moins ses journées au coût d'un consultant. Un commercial coûte son salaire chargé et ses frais ; le cabinet ne lui paie pas de commission.",
          `Le tableau de bord allume un voyant sous ${pct(x.f.seuilsDAlerte.realisationDeLObjectif.seuil * 100)} de l'objectif, sous ${pct(x.f.seuilsDAlerte.tauxDeTransformation.seuil * 100)} de devis transformés en contrats, sur un recul de plus de ${pct(-x.f.seuilsDAlerte.evolutionSurNMoins1.seuil * 100)} face au même trimestre de N − 1, et sous le seuil de rentabilité du commercial : ce sont les seuils d'alerte de la simulation.`,
        ];
      },
      repere: () =>
        "Évolution sur N − 1 = chiffre d'affaires du trimestre ÷ celui du même trimestre de N − 1 − 1. Taux de transformation des devis = contrats ÷ devis. Panier moyen = chiffre d'affaires ÷ contrats. Réalisation de l'objectif = chiffre d'affaires ÷ objectif. Taux de service = journées vendues ÷ journées demandées.",
    },
    {
      id: "le-cabinet",
      type: "montants",
      titre: "L'année du cabinet",
      notions: ["dashboard", "capacity"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        const q4 = x.journees[3]!;
        return `Additionnez les 4 trimestres : le chiffre d'affaires du cabinet en N, puis en N − 1. Calculez l'évolution de l'année sur N − 1, au dixième, puis le taux de service du dernier trimestre (${qte(q4.vendues)} journées vendues pour ${qte(q4.demandees)} demandées), au dixième.`;
      },
      champs: (c) => {
        const x = tableauDuCabinet(c);
        const q4 = x.journees[3]!;
        return [
          { libelle: "Chiffre d'affaires du cabinet en N", attendu: x.t.chiffreDAffaires, calcul: `${x.t.cabinet.map((q) => eur(q.chiffreDAffaires)).join(" + ")} = ${eur(x.t.chiffreDAffaires)}` },
          { libelle: "Chiffre d'affaires du cabinet en N − 1", attendu: x.t.chiffreDAffairesN1, calcul: `${x.t.cabinet.map((q) => eur(q.chiffreDAffairesN1)).join(" + ")} = ${eur(x.t.chiffreDAffairesN1)}` },
          {
            libelle: "Évolution de l'année sur N − 1 (%)",
            attendu: enPct(x.t.evolutionSurNMoins1),
            tolerance: 0.1,
            calcul: `(${eur(x.t.chiffreDAffaires)} ÷ ${eur(x.t.chiffreDAffairesN1)} − 1) × 100 = ${pct(enPct(x.t.evolutionSurNMoins1))}`,
          },
          { libelle: "Taux de service du dernier trimestre (%)", attendu: enPct(q4.tauxDeService), tolerance: 0.1, calcul: `${qte(q4.vendues)} ÷ ${qte(q4.demandees)} × 100 = ${pct(enPct(q4.tauxDeService))}` },
        ];
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        const q4 = x.journees[3]!;
        return [
          `Sur l'année, le cabinet progresse de ${pct(enPct(x.t.evolutionSurNMoins1))} : une moyenne. Trimestre par trimestre, il recule aux T1 et T2 (${x.t.cabinet.slice(0, 2).map((q) => pct(enPct(q.evolutionSurNMoins1))).join(" et ")}) et progresse ensuite (${x.t.cabinet.slice(2).map((q) => pct(enPct(q.evolutionSurNMoins1))).join(" et ")}).`,
          `Au dernier trimestre, le carnet est plein : ${qte(q4.refusees)} journées demandées ont été refusées, faute de consultant. Le taux de service, ${pct(enPct(q4.tauxDeService))}, dit ce que le cabinet n'a pas pu servir ; le chiffre d'affaires, lui, ne le montre pas.`,
        ];
      },
    },
    {
      id: "le-trimestre-qui-decroche",
      type: "choix",
      titre: "Le trimestre qui décroche",
      notions: ["dashboard", "seasonality"],
      tableau: (c) => {
        const x = tableauDuCabinet(c);
        const { q, avant } = x.chute;
        const sa = x.serviceDe(avant.trimestre as Trimestre);
        const sq = x.serviceDe(q.trimestre as Trimestre);
        return {
          titre: `Du T${avant.trimestre} au T${q.trimestre}`,
          colonnes: [`T${avant.trimestre}`, `T${q.trimestre}`],
          lignes: [
            { libelle: "Chiffre d'affaires", valeurs: [eur(avant.chiffreDAffaires), eur(q.chiffreDAffaires)] },
            { libelle: "Chiffre d'affaires du même trimestre de N − 1", valeurs: [eur(avant.chiffreDAffairesN1), eur(q.chiffreDAffairesN1)] },
            { libelle: "Journées demandées", valeurs: [qte(sa.demandees), qte(sq.demandees)] },
            { libelle: "Journées vendues", valeurs: [qte(sa.vendues), qte(sq.vendues)] },
            { libelle: "Prix moyen d'une journée", valeurs: [eur(auCentime(avant.chiffreDAffaires / sa.vendues)), eur(auCentime(q.chiffreDAffaires / sq.vendues))] },
          ],
        };
      },
      question: (c) => {
        const x = tableauDuCabinet(c);
        return `Le chiffre d'affaires du cabinet baisse de ${eur(x.chute.baisse)} du T${x.chute.avant.trimestre} au T${x.chute.q.trimestre}. Que dit le tableau de bord ?`;
      },
      options: (c) => {
        const x = tableauDuCabinet(c);
        const { q, avant } = x.chute;
        const sq = x.serviceDe(q.trimestre as Trimestre);
        const saison = q.evolutionSurNMoins1 >= 0 && sq.tauxDeService >= 1;
        const nonServie = sq.tauxDeService < 1;
        const recul = auDixieme((q.chiffreDAffaires / avant.chiffreDAffaires - 1) * 100);
        return [
          {
            texte: `C'est la saison : face au T${q.trimestre} de N − 1, il progresse de ${pct(enPct(q.evolutionSurNMoins1))}`,
            juste: saison,
            retour: saison
              ? `Oui : le T${q.trimestre} est creux chaque année. Face au même trimestre de N − 1 (${eur(q.chiffreDAffairesN1)}), il progresse de ${pct(enPct(q.evolutionSurNMoins1))}, et toute la demande a été servie (${qte(sq.vendues)} journées sur ${qte(sq.demandees)}). Comparer au trimestre d'avant, c'est lire la saison, pas le travail des commerciaux.`
              : `Non : face au même trimestre de N − 1, il évolue de ${pct(enPct(q.evolutionSurNMoins1))}.`,
          },
          {
            texte: "La demande était là, mais le cabinet ne l'a pas servie",
            juste: nonServie && !saison,
            retour: nonServie
              ? `Oui : ${qte(sq.refusees)} journées demandées n'ont pas été vendues.`
              : `Non : au T${q.trimestre}, le cabinet a vendu toutes les journées demandées (${qte(sq.vendues)}). Les jours libres ne manquaient pas.`,
          },
          {
            texte: `Les commerciaux ont décroché : le chiffre d'affaires chute de ${pct(-recul)}`,
            juste: !saison && !nonServie,
            retour: `Non : la chute est réelle face au T${avant.trimestre}, mais le T${avant.trimestre} n'est pas la bonne référence. Face au même trimestre de N − 1, le chiffre d'affaires progresse ; la saison explique la baisse.`,
          },
        ];
      },
    },
    {
      id: "les-indicateurs-de-marc",
      type: "montants",
      titre: "Les indicateurs d'un commercial",
      notions: ["dashboard", "conversion_rate", "average_basket"],
      tableau: (c) => tableauDuPremierTrimestre(tableauDuCabinet(c)),
      question: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.marc.trimestres[0]!;
        return `Au premier trimestre, ${x.marc.k.prenom} a remis ${qte(q.devis)} devis et signé ${qte(q.contrats)} contrats, pour ${eur(q.chiffreDAffaires)} de chiffre d'affaires ; son objectif était de ${eur(q.objectif)}, et il avait signé ${eur(q.nMoins1.chiffreDAffaires)} au même trimestre de N − 1. Calculez son taux de transformation des devis (contrats ÷ devis), son panier moyen (chiffre d'affaires ÷ contrats), la réalisation de son objectif (chiffre d'affaires ÷ objectif) et son évolution sur N − 1, en pourcentage au dixième.`;
      },
      champs: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.marc.trimestres[0]!;
        return [
          { libelle: "Taux de transformation des devis (%)", attendu: enPct(q.tauxDeTransformation), tolerance: 0.1, calcul: `${qte(q.contrats)} ÷ ${qte(q.devis)} × 100 = ${pct(enPct(q.tauxDeTransformation))}` },
          { libelle: "Panier moyen", attendu: auCentime(q.panier), calcul: `${eur(q.chiffreDAffaires)} ÷ ${qte(q.contrats)} = ${eur(auCentime(q.panier))}` },
          { libelle: "Réalisation de l'objectif (%)", attendu: enPct(q.realisationDeLObjectif), tolerance: 0.1, calcul: `${eur(q.chiffreDAffaires)} ÷ ${eur(q.objectif)} × 100 = ${pct(enPct(q.realisationDeLObjectif))}` },
          {
            libelle: "Évolution sur N − 1 (%)",
            attendu: enPct(q.evolutionSurNMoins1),
            tolerance: 0.1,
            calcul: `(${eur(q.chiffreDAffaires)} ÷ ${eur(q.nMoins1.chiffreDAffaires)} − 1) × 100 = ${pct(enPct(q.evolutionSurNMoins1))}`,
          },
        ];
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.marc.trimestres[0]!;
        return [
          `${x.marc.k.prenom} transforme ${pct(enPct(q.tauxDeTransformation))} de ses devis, à ${eur(auCentime(q.panier))} le contrat : ses affaires sont grosses et peu nombreuses. ${q.voyants.length === 0 ? "Il tient son objectif et progresse sur N − 1 : aucun voyant ne s'allume." : `${qte(q.voyants.length)} voyants s'allument pourtant.`}`,
          "Le chiffre d'affaires d'un commercial est le produit de 3 indicateurs : ses devis, son taux de transformation et son panier. Le tableau de bord les suit séparément, pour savoir lequel a bougé.",
        ];
      },
    },
    {
      id: "predire-le-seuil",
      type: "choix",
      titre: "Pariez sur le seuil d'un commercial",
      notions: ["breakeven", "dashboard"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        return `Avant de calculer, pariez. ${h.k.prenom} coûte ${eur(h.s.cout)} par trimestre, salaire chargé et frais. Ses comptes laissent ${pct(enPct(h.s.tauxDeMarge))} de leur chiffre d'affaires en marge. Quel chiffre d'affaires doit-il signer dans le trimestre pour payer son coût ?`;
      },
      options: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        const objectif = h.trimestres[0]!.objectif;
        const voir = "Faites signer Hugo à l'étape suivante : le curseur montre où la marge de ses affaires rattrape son coût.";
        const pari = (juste: boolean) => (juste ? `Bon pari. ${voir}` : `Pari à vérifier. ${voir}`);
        const sonCout = Math.abs(h.s.seuil - h.s.cout) < 0.01;
        const sonObjectif = !sonCout && Math.abs(h.s.seuil - objectif) < 0.01;
        return [
          { texte: `Son coût, ${eur(h.s.cout)} : chaque euro signé rembourse un euro de salaire`, juste: sonCout, retour: pari(sonCout) },
          { texte: "Plus que son coût : seule la marge de ses affaires le paie", juste: !sonCout && !sonObjectif, retour: pari(!sonCout && !sonObjectif) },
          { texte: `Son objectif du trimestre, ${eur(objectif)} : il a été fixé pour cela`, juste: sonObjectif, retour: pari(sonObjectif) },
        ];
      },
    },
    {
      id: "le-seuil-au-curseur",
      type: "curseur",
      titre: "Le seuil d'Hugo au curseur",
      notions: ["breakeven", "dashboard"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        return `Faites signer ${h.k.prenom}, de ${qte(MILLIERS_DU_CURSEUR.min)} à ${eur(MILLIERS_DU_CURSEUR.max * 1000)} dans le trimestre : le curseur compte en milliers d'euros. Une droite donne la marge de ses affaires (${pct(enPct(h.s.tauxDeMarge))} du chiffre d'affaires), l'autre son coût du trimestre. Placez le curseur sur le plus petit chiffre d'affaires où la marge paie son coût, puis validez.`;
      },
      grandeur: () => ({ libelle: "Chiffre d'affaires du trimestre", unite: "milliers d'euros" }),
      cible: (c) => {
        const x = tableauDuCabinet(c);
        return { attendu: plafond(x.hugo.s.cout / x.hugo.s.tauxDeMarge / 1000), min: MILLIERS_DU_CURSEUR.min, max: MILLIERS_DU_CURSEUR.max };
      },
      zones: ["Il paie son coût", "Il coûte plus qu'il ne rapporte"],
      rates: () => ({
        dessous: "À ce chiffre d'affaires, la marge de ses affaires ne paie pas encore son coût.",
        dessus: "Plus bas, la marge paie encore son coût : cherchez le plus petit chiffre d'affaires.",
      }),
      montrer: "Montrer le seuil",
      lecture: (c, k) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        const ca = k * 1000;
        const marge = auCentime(ca * h.s.tauxDeMarge);
        return [
          { libelle: "Chiffre d'affaires du trimestre", montant: ca },
          { libelle: "Marge de ses affaires", montant: marge },
          { libelle: "Coût du commercial", montant: h.s.cout },
          { libelle: "Résultat du commercial", montant: auCentime(marge - h.s.cout), fort: true },
        ];
      },
      droites: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        return { produit: (k) => k * 1000 * h.s.tauxDeMarge, cout: () => h.s.cout, libelles: ["Marge de ses affaires", "Coût du commercial"] };
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        const [t1, t2, t3] = h.trimestres;
        return [
          `Les droites se croisent à ${eur(h.s.seuil)} : ${qte(h.s.seuil / h.s.cout)} fois son coût, parce que ses affaires ne laissent que ${pct(enPct(h.s.tauxDeMarge))} en marge. Au T1, ${h.k.prenom} a signé ${eur(t1!.chiffreDAffaires)} (un résultat de ${eur(t1!.resultat)}) ; au T2, ${eur(t2!.chiffreDAffaires)} (${eur(t2!.resultat)}) ; au T3, ${eur(t3!.chiffreDAffaires)} (${eur(t3!.resultat)}).`,
          "Le seuil d'un commercial se calcule comme celui d'une entreprise : son coût, fixe, divisé par le taux de marge de ce qu'il vend. C'est la formule que l'étape suivante fait calculer.",
        ];
      },
    },
    {
      id: "le-seuil-d-hugo",
      type: "montants",
      titre: "Le seuil de rentabilité d'un commercial",
      notions: ["breakeven", "margin_rates"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        return `Les ${qte(h.comptes.comptes.length)} comptes d'${h.k.prenom} ont fait ${eur(h.comptes.chiffreDAffaires)} de chiffre d'affaires et ${eur(h.comptes.marge)} de marge sur coûts directs dans l'année. Il coûte ${eur(h.k.salaireCharge)} de salaire chargé et ${eur(h.k.frais)} de frais par trimestre. Calculez le taux de marge de ses comptes, son coût du trimestre, son seuil de rentabilité du trimestre (coût ÷ taux de marge), puis celui de l'année.`;
      },
      champs: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        return [
          { libelle: "Taux de marge de ses comptes (%)", attendu: enPct(h.s.tauxDeMarge), tolerance: 0.1, calcul: `${eur(h.comptes.marge)} ÷ ${eur(h.comptes.chiffreDAffaires)} × 100 = ${pct(enPct(h.s.tauxDeMarge))}` },
          { libelle: "Coût du commercial, par trimestre", attendu: h.s.cout, calcul: `${eur(h.k.salaireCharge)} + ${eur(h.k.frais)} = ${eur(h.s.cout)}` },
          { libelle: "Seuil de rentabilité du trimestre", attendu: h.s.seuil, calcul: `${eur(h.s.cout)} ÷ ${pct(enPct(h.s.tauxDeMarge))} = ${eur(h.s.seuil)}` },
          { libelle: "Seuil de rentabilité de l'année", attendu: h.s.seuilDeLAnnee, calcul: `${eur(h.s.seuil)} × 4 = ${eur(h.s.seuilDeLAnnee)}` },
        ];
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        return [
          `${h.k.prenom} paie son coût à partir de ${eur(h.s.seuil)} signés dans le trimestre, ${eur(h.s.seuilDeLAnnee)} sur l'année. Son objectif du T1, ${eur(h.trimestres[0]!.objectif)}, était sous son seuil : tenir un objectif ne dit pas qu'un commercial paie son coût.`,
        ];
      },
    },
    {
      id: "les-seuils-de-marc-et-de-nadia",
      type: "montants",
      titre: "Les seuils des deux autres commerciaux",
      notions: ["breakeven", "margin_rates"],
      tableau: (c) => tableauDesCommerciaux(tableauDuCabinet(c)),
      question: (c) => {
        const x = tableauDuCabinet(c);
        return `Sans formule cette fois. Calculez le taux de marge des comptes de ${x.marc.k.prenom} et de ${x.nadia.k.prenom}, au dixième, et leur seuil de rentabilité par trimestre.`;
      },
      champs: (c) => {
        const x = tableauDuCabinet(c);
        const lignes = (k: TableauDuCabinet["marc"]) => [
          {
            libelle: `Taux de marge des comptes de ${k.k.prenom} (%)`,
            attendu: enPct(k.s.tauxDeMarge),
            tolerance: 0.1,
            calcul: `${eur(k.comptes.marge)} ÷ ${eur(k.comptes.chiffreDAffaires)} × 100 = ${pct(enPct(k.s.tauxDeMarge))}`,
          },
          {
            libelle: `Seuil de rentabilité de ${k.k.prenom}, par trimestre`,
            attendu: k.s.seuil,
            tolerance: 1,
            calcul: `(${eur(k.k.salaireCharge)} + ${eur(k.k.frais)}) ÷ (${eur(k.comptes.marge)} ÷ ${eur(k.comptes.chiffreDAffaires)}) = ${eur(k.s.seuil)}`,
          },
        ];
        return [...lignes(x.marc), ...lignes(x.nadia)];
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        const bas = (k: TableauDuCabinet["marc"]) => Math.min(...k.trimestres.map((q) => q.chiffreDAffaires));
        return [
          `${x.marc.k.prenom} vend le plus, mais ses comptes laissent le moins (${pct(enPct(x.marc.s.tauxDeMarge))}) : son seuil, ${eur(x.marc.s.seuil)}, est le plus haut. ${x.nadia.k.prenom}, dont les comptes laissent ${pct(enPct(x.nadia.s.tauxDeMarge))}, paie son coût dès ${eur(x.nadia.s.seuil)}.`,
          `Tous deux passent leur seuil à chaque trimestre, même au plus bas (${eur(bas(x.marc))} et ${eur(bas(x.nadia))}). Le seuil d'un commercial ne dépend pas que de son coût : il dépend de la marge de ce qu'il vend.`,
        ];
      },
    },
    {
      id: "predire-la-transformation",
      type: "choix",
      titre: "Pariez sur la transformation",
      notions: ["conversion_rate", "average_basket"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.hugo.trimestres[0]!;
        return `Au T1, ${x.hugo.k.prenom} a remis ${qte(q.devis)} devis et en a transformé ${pct(enPct(q.tauxDeTransformation))}, à ${eur(q.panier)} le contrat. S'il en avait transformé ${pct(enPct(q.tauxDeTransformation) + 5)}, ses devis et son panier restant les mêmes, son chiffre d'affaires aurait augmenté de…`;
      },
      options: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.hugo.trimestres[0]!;
        const t = enPct(q.tauxDeTransformation);
        const hausse = auDixieme(((t + 5) / t - 1) * 100);
        const voir = "Faites-le dans le laboratoire de l'étape suivante : le chiffre d'affaires y est le produit des devis, du taux et du panier.";
        return [
          { texte: `${pct(hausse)} : 5 points sur ${pct(t)}, c'est ${pct(hausse)} de plus`, juste: hausse !== 5, retour: `Bon pari. ${voir}` },
          { texte: "5 % : le taux a gagné 5 points", juste: hausse === 5, retour: `Pari à vérifier. ${voir}` },
          { texte: "Rien : sans devis de plus, pas de contrat de plus", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-d-hugo",
      type: "simulation",
      titre: "Le laboratoire d'Hugo",
      notions: ["conversion_rate", "average_basket", "breakeven"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        return `Rejouez le premier trimestre d'${x.hugo.k.prenom}. Faites varier ses devis, son taux de transformation et son panier, et choisissez sa rémunération : le fixe seul, ou le fixe et ${pct(COMMISSION_DE_LA_VARIANTE * 100)} de commission sur ce qu'il signe. Le tableau suit son chiffre d'affaires, son résultat, son seuil et ses voyants. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.hugo.trimestres[0]!;
        const L = LEVIERS_DU_LABORATOIRE;
        const commission = Math.round(COMMISSION_DE_LA_VARIANTE * 100);
        return [
          { code: "devis", libelle: "Devis remis", unite: "devis", ...L.devis, depart: q.devis },
          { code: "taux", libelle: "Taux de transformation des devis", unite: "%", ...L.taux, depart: Math.round(q.tauxDeTransformation * 100) },
          { code: "panier", libelle: "Panier moyen", unite: "€", ...L.panier, depart: q.panier },
          {
            code: "remuneration",
            libelle: "Rémunération",
            unite: "",
            min: 0,
            max: commission,
            pas: commission,
            depart: 0,
            choix: [
              { valeur: 0, libelle: "fixe seul" },
              { valeur: commission, libelle: `fixe et ${pct(commission)} de commission` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = tableauDuCabinet(c);
        const q = x.hugo.trimestres[0]!;
        const l = laboratoireDHugo(x, p);
        const d = laboratoireDHugo(x, { devis: q.devis, taux: Math.round(q.tauxDeTransformation * 100), panier: q.panier, remuneration: 0 });
        return [
          { libelle: "Contrats signés", montant: l.contrats, reference: d.contrats, unite: "contrats" },
          { libelle: "Chiffre d'affaires du trimestre", montant: l.chiffreDAffaires, reference: d.chiffreDAffaires },
          { libelle: "Marge de ses affaires", montant: l.marge, reference: d.marge },
          { libelle: "Commission versée", montant: l.commission, reference: d.commission },
          { libelle: "Seuil de rentabilité du commercial", montant: l.seuil, reference: d.seuil },
          { libelle: "Réalisation de l'objectif", montant: l.realisation, reference: d.realisation, unite: "%" },
          { libelle: "Voyants allumés", montant: l.voyants.length, reference: d.voyants.length, unite: "voyants" },
          { libelle: "Résultat du commercial", montant: l.resultat, reference: d.resultat, effet: true, fort: true },
        ];
      },
      defi: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.hugo.trimestres[0]!;
        const commission = Math.round(COMMISSION_DE_LA_VARIANTE * 100);
        return {
          consigne: `${x.hugo.k.prenom} passe à ${pct(commission)} de commission. Sans remettre plus de devis qu'au T1 (${qte(q.devis)}), éteignez le voyant du seuil.`,
          atteint: (p) => p.remuneration === commission && p.devis! <= q.devis && !laboratoireDHugo(x, p).sousLeSeuil,
          indice: (p) => {
            if (p.remuneration !== commission) return `Le défi se joue avec la commission : choisissez « fixe et ${pct(commission)} de commission ». Son seuil monte alors.`;
            if (p.devis! > q.devis) return `${x.hugo.k.prenom} n'a pas le temps de remettre plus de ${qte(q.devis)} devis dans le trimestre : jouez sur son taux de transformation et son panier.`;
            const l = laboratoireDHugo(x, p);
            return `À ces réglages, ${x.hugo.k.prenom} signe ${eur(l.chiffreDAffaires)} pour un seuil de ${eur(l.seuil)} : il lui manque ${eur(auCentime(l.seuil - l.chiffreDAffaires))}. Le chiffre d'affaires est le produit des devis, du taux et du panier.`;
          },
          solution: { devis: q.devis, taux: 30, panier: 10_000, remuneration: commission },
        };
      },
      explication: (c, p) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        const q = h.trimestres[0]!;
        const parDevis = auCentime(h.sv.seuil / q.devis);
        return [
          `Avec ${pct(COMMISSION_DE_LA_VARIANTE * 100)} de commission, la marge qui paie ${h.k.prenom} n'est plus que ${pct(enPct(h.s.tauxDeMarge - COMMISSION_DE_LA_VARIANTE))} de ce qu'il signe : son seuil passe de ${eur(h.s.seuil)} à ${eur(h.sv.seuil)}. Sans devis de plus, chaque devis doit rapporter ${eur(parDevis)} de chiffre d'affaires : le taux de transformation fois le panier, ${pct(30)} à ${eur(10_000)}, ou ${pct(25)} à ${eur(auCentime(parDevis / 0.25))}.`,
          `Le chiffre d'affaires est un produit : passer de ${pct(enPct(q.tauxDeTransformation))} à ${pct(enPct(q.tauxDeTransformation) + 5)} de transformation le fait monter de ${pct(auDixieme((5 / enPct(q.tauxDeTransformation)) * 100))}, pas de 5 %. Une commission paie l'effort, mais elle relève la barre que l'effort doit passer.`,
          ...(laboratoireDHugo(x, p).voyants.includes("evolutionSurNMoins1")
            ? [`Un voyant reste allumé, celui de l'évolution : le premier trimestre de N − 1, ${eur(h.k.nMoins1[0]!.chiffreDAffaires)}, est celui de son prédécesseur. Aucun réglage du trimestre ne l'éteint sans dépasser ce chiffre : c'est le voyant qui compare ${h.k.prenom} à un autre.`]
            : []),
        ];
      },
    },
    {
      id: "la-transformation-d-hugo",
      type: "montants",
      titre: "Ce qu'il manquait à Hugo au premier trimestre",
      notions: ["conversion_rate", "average_basket", "breakeven"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        return `Sans formule, sur le premier trimestre d'${x.hugo.k.prenom}, payé au fixe seul : son taux de transformation des devis, son panier moyen, les contrats qu'il lui fallait à ce panier pour atteindre son seuil, puis les devis qu'il lui fallait à ce taux.`;
      },
      champs: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        const q = h.trimestres[0]!;
        return [
          { libelle: "Taux de transformation des devis (%)", attendu: enPct(q.tauxDeTransformation), tolerance: 0.1, calcul: `${qte(q.contrats)} ÷ ${qte(q.devis)} × 100 = ${pct(enPct(q.tauxDeTransformation))}` },
          { libelle: "Panier moyen", attendu: auCentime(q.panier), calcul: `${eur(q.chiffreDAffaires)} ÷ ${qte(q.contrats)} = ${eur(auCentime(q.panier))}` },
          { libelle: "Contrats nécessaires pour le seuil", attendu: x.contratsPourLeSeuil, calcul: `${eur(h.s.seuil)} ÷ ${eur(auCentime(q.panier))} = ${qte(auCentime(h.s.seuil / q.panier))}, soit ${qte(x.contratsPourLeSeuil)} contrats` },
          {
            libelle: "Devis nécessaires pour ces contrats",
            attendu: x.devisPourLeSeuil,
            calcul: `${qte(x.contratsPourLeSeuil)} ÷ ${pct(enPct(q.tauxDeTransformation))} = ${qte(auCentime(x.contratsPourLeSeuil / q.tauxDeTransformation))}, soit ${qte(x.devisPourLeSeuil)} devis`,
          },
        ];
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        const q = h.trimestres[0]!;
        return [
          `${h.k.prenom} a remis ${qte(q.devis)} devis ; il lui en fallait ${qte(x.devisPourLeSeuil)} à son taux. Ou bien un taux de ${pct(auDixieme((x.contratsPourLeSeuil / q.devis) * 100))}, ou un panier de ${eur(auCentime(h.s.seuil / q.contrats))}. Le seuil se traduit en activité : c'est ce que le tableau de bord d'un commercial suit, devis par devis.`,
        ];
      },
    },
    {
      id: "predire-nadia",
      type: "choix",
      titre: "Pariez sur le tableau de Nadia",
      notions: ["dashboard", "conversion_rate"],
      tableau: (c) => {
        const x = tableauDuCabinet(c);
        return tableauDesTrimestres(x.nadia);
      },
      question: (c) => {
        const x = tableauDuCabinet(c);
        const n = x.nadia;
        const r = n.trimestres.map((q) => enPct(q.realisationDeLObjectif));
        const e = n.trimestres.map((q) => enPct(q.evolutionSurNMoins1));
        return `${n.k.prenom} tient son objectif à chaque trimestre de N, de ${pct(Math.min(...r))} à ${pct(Math.max(...r))}, et son chiffre d'affaires progresse de ${pct(Math.min(...e))} à ${pct(Math.max(...e))} sur N − 1. Pariez : son tableau de bord est-il au vert ?`;
      },
      options: (c) => {
        const x = tableauDuCabinet(c);
        const vs = x.nadia.trimestres.flatMap((q) => q.voyants);
        const recul = vs.includes("evolutionSurNMoins1");
        const transformation = vs.length > 0 && !recul;
        const voir = "Le curseur de l'étape suivante montre ce que sa transformation lui a coûté.";
        const pari = (juste: boolean) => (juste ? `Bon pari. ${voir}` : `Pari à vérifier. ${voir}`);
        return [
          { texte: "Non : elle transforme de moins en moins de devis", juste: transformation, retour: pari(transformation) },
          { texte: "Oui : un objectif tenu et en hausse, tout va bien", juste: vs.length === 0, retour: pari(vs.length === 0) },
          { texte: "Non : son chiffre d'affaires recule sur N − 1", juste: recul, retour: pari(recul) },
        ];
      },
    },
    {
      id: "les-devis-de-nadia",
      type: "curseur",
      titre: "Les devis que Nadia a dû remettre",
      notions: ["conversion_rate", "dashboard"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.nadia.trimestres[3]!;
        return `Au T4, ${x.nadia.k.prenom} a signé ${qte(q.contrats)} contrats sur ${qte(q.devis)} devis, à ${eur(q.panier)} le contrat, pour un objectif de ${eur(q.objectif)}. Au T4 de N − 1, elle transformait ${pct(enPct(q.nMoins1.tauxDeTransformation))} de ses devis. Faites varier ses devis : à ce taux de N − 1 et à son panier, combien lui en fallait-il pour tenir son objectif ? Placez le curseur sur le plus petit nombre de devis, puis validez.`;
      },
      grandeur: () => ({ libelle: "Devis remis au T4", unite: "devis" }),
      cible: (c) => ({ attendu: tableauDuCabinet(c).devisAuTauxDeNMoins1, min: DEVIS_DU_CURSEUR.min, max: DEVIS_DU_CURSEUR.max }),
      zones: ["L'objectif est tenu", "L'objectif manque"],
      rates: () => ({
        dessous: "À ce nombre de devis, le taux de N − 1 ne suffit pas encore à tenir l'objectif.",
        dessus: "Moins de devis tiendraient encore l'objectif : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les devis nécessaires",
      lecture: (c, d) => {
        const x = tableauDuCabinet(c);
        const q = x.nadia.trimestres[3]!;
        const ca = auCentime(d * q.nMoins1.tauxDeTransformation * q.panier);
        return [
          { libelle: "Chiffre d'affaires au taux de N − 1", montant: ca },
          { libelle: "Objectif du trimestre", montant: q.objectif },
          { libelle: "Écart à l'objectif", montant: auCentime(ca - q.objectif), fort: true },
        ];
      },
      droites: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.nadia.trimestres[3]!;
        return { produit: (d) => d * q.nMoins1.tauxDeTransformation * q.panier, cout: () => q.objectif, libelles: ["Chiffre d'affaires au taux de N − 1", "Objectif du trimestre"] };
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.nadia.trimestres[3]!;
        return [
          `Au taux de N − 1, ${qte(x.devisAuTauxDeNMoins1)} devis suffisaient ; ${x.nadia.k.prenom} en a remis ${qte(q.devis)}, ${qte(x.devisEnTrop)} de plus, pour tenir son objectif à ${pct(enPct(q.realisationDeLObjectif))}. Son chiffre d'affaires tient parce qu'elle travaille plus : ses rendez-vous sont passés de ${qte(q.nMoins1.rendezVous)} à ${qte(q.rendezVous)}.`,
          "Le taux de transformation est un indicateur avancé : il s'allume avant que le chiffre d'affaires ne décroche, tant que l'activité compense.",
        ];
      },
    },
    {
      id: "les-voyants-de-nadia",
      type: "montants",
      titre: "Le voyant que l'objectif cachait",
      notions: ["conversion_rate", "dashboard"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        return `Sans formule. Calculez le taux de transformation des devis de ${x.nadia.k.prenom} au T3 et au T4 de N, puis au T4 de N − 1, au dixième, et les devis qu'elle a remis en trop au T4, face au taux de N − 1.`;
      },
      champs: (c) => {
        const x = tableauDuCabinet(c);
        const [, , q3, q4] = x.nadia.trimestres;
        return [
          { libelle: "Taux de transformation au T3 (%)", attendu: enPct(q3!.tauxDeTransformation), tolerance: 0.1, calcul: `${qte(q3!.contrats)} ÷ ${qte(q3!.devis)} × 100 = ${pct(enPct(q3!.tauxDeTransformation))}` },
          { libelle: "Taux de transformation au T4 (%)", attendu: enPct(q4!.tauxDeTransformation), tolerance: 0.1, calcul: `${qte(q4!.contrats)} ÷ ${qte(q4!.devis)} × 100 = ${pct(enPct(q4!.tauxDeTransformation))}` },
          {
            libelle: "Taux de transformation au T4 de N − 1 (%)",
            attendu: enPct(q4!.nMoins1.tauxDeTransformation),
            tolerance: 0.1,
            calcul: `${qte(q4!.nMoins1.contrats)} ÷ ${qte(q4!.nMoins1.devis)} × 100 = ${pct(enPct(q4!.nMoins1.tauxDeTransformation))}`,
          },
          {
            libelle: "Devis remis en trop au T4",
            attendu: x.devisEnTrop,
            calcul: `${eur(q4!.objectif)} ÷ (${pct(enPct(q4!.nMoins1.tauxDeTransformation))} × ${eur(q4!.panier)}) = ${qte(auCentime(q4!.objectif / (q4!.nMoins1.tauxDeTransformation * q4!.panier)))}, soit ${qte(x.devisAuTauxDeNMoins1)} devis ; ${qte(q4!.devis)} − ${qte(x.devisAuTauxDeNMoins1)} = ${qte(x.devisEnTrop)}`,
          },
        ];
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        const seuil = pct(x.f.seuilsDAlerte.tauxDeTransformation.seuil * 100);
        const allumes = x.nadia.trimestres.filter((q) => q.voyants.includes("tauxDeTransformation")).map((q) => `T${q.trimestre}`);
        return [
          `Sous ${seuil} de devis transformés, le voyant s'allume : chez ${x.nadia.k.prenom}, aux ${allumes.join(" et ")}. Le voyant de l'objectif, lui, reste éteint toute l'année.`,
          "Un objectif de chiffre d'affaires seul aurait caché la baisse. Les devis de plus ont un coût, le temps de la commerciale, et une limite : l'année où ils ne suivront plus, le chiffre d'affaires décrochera.",
        ];
      },
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Ranger les indicateurs",
      notions: ["dashboard"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        return `Voici les indicateurs de ${x.nadia.k.prenom} au T4. Un tableau de bord commercial range ses indicateurs par ce qu'ils mesurent : l'activité du commercial, son efficacité, ou ce que ses ventes rapportent. Classez chacun.`;
      },
      categories: [
        { code: "activite", libelle: "L'activité" },
        { code: "efficacite", libelle: "L'efficacité" },
        { code: "resultat", libelle: "Ce que les ventes rapportent" },
      ],
      elements: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.nadia.trimestres[3]!;
        return [
          { libelle: "Rendez-vous", montant: q.rendezVous, categorie: "activite", pourquoi: "Ils mesurent le travail du commercial sur le terrain, avant toute vente." },
          { libelle: "Devis remis", montant: q.devis, categorie: "activite", pourquoi: "Ils mesurent les propositions faites, signées ou non." },
          { libelle: "Taux de transformation des devis (%)", montant: enPct(q.tauxDeTransformation), categorie: "efficacite", pourquoi: "Il mesure la part des propositions qui deviennent des contrats." },
          { libelle: "Panier moyen", montant: auCentime(q.panier), categorie: "efficacite", pourquoi: "Il mesure ce que rapporte chaque contrat signé." },
          { libelle: "Réalisation de l'objectif (%)", montant: enPct(q.realisationDeLObjectif), categorie: "resultat", pourquoi: "Elle mesure le chiffre d'affaires face à ce que la direction attendait." },
          { libelle: "Résultat du commercial", montant: q.resultat, categorie: "resultat", pourquoi: "Il mesure ce que ses affaires laissent une fois payé son coût." },
        ];
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        return [
          `Les trois familles se lisent dans l'ordre : l'activité nourrit l'efficacité, qui fait le résultat. Chez ${x.nadia.k.prenom}, le résultat tient, l'efficacité baisse, l'activité monte : c'est l'activité qui paie la baisse d'efficacité, et elle a une limite.`,
        ];
      },
    },
    {
      id: "les-trimestres-d-hugo",
      type: "montants",
      titre: "Hugo, trimestre après trimestre",
      notions: ["breakeven", "dashboard"],
      tableau: (c) => {
        const x = tableauDuCabinet(c);
        return tableauDesTrimestres(x.hugo);
      },
      question: (c) => {
        const x = tableauDuCabinet(c);
        return `Croisez le seuil et les trimestres. Calculez le résultat d'${x.hugo.k.prenom} (la marge de ses affaires moins son coût) à chacun des 4 trimestres de N, puis sur l'année. Une perte se donne en négatif.`;
      },
      champs: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        return [
          ...h.trimestres.map((q) => ({
            libelle: `Résultat du commercial au T${q.trimestre}`,
            attendu: q.resultat,
            calcul: `${eur(q.chiffreDAffaires)} × ${pct(enPct(h.s.tauxDeMarge))} − ${eur(h.s.cout)} = ${eur(q.resultat)}`,
          })),
          {
            libelle: "Résultat du commercial sur l'année",
            attendu: h.annee.resultat,
            calcul: `${eur(h.annee.chiffreDAffaires)} × ${pct(enPct(h.s.tauxDeMarge))} − ${eur(h.annee.cout)} = ${eur(h.annee.resultat)}`,
          },
        ];
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        const sous = h.trimestres.filter((q) => q.sousLeSeuil).map((q) => `T${q.trimestre}`);
        return [
          `${h.k.prenom} est sous son seuil aux ${sous.join(" et ")}, au-dessus ensuite : sur l'année, il rapporte ${eur(h.annee.resultat)} de plus qu'il ne coûte (${eur(h.annee.chiffreDAffaires)} signés pour un seuil de ${eur(h.s.seuilDeLAnnee)}). Ses contrats grossissent et se multiplient d'un trimestre à l'autre : un compte neuf se gagne en plusieurs rendez-vous.`,
        ];
      },
    },
    {
      id: "la-commission-pour-tous",
      type: "montants",
      titre: "Variante : une commission pour tous",
      notions: ["breakeven", "margin_rates"],
      question: () =>
        `Variante : le cabinet paie à chaque commercial ${pct(COMMISSION_DE_LA_VARIANTE * 100)} du chiffre d'affaires qu'il signe, en plus de son fixe. Calculez le nouveau seuil d'Hugo par trimestre, la commission qu'il aurait touchée sur l'année, son seuil de l'année, puis le nouveau seuil de Marc par trimestre.`,
      champs: (c) => {
        const x = tableauDuCabinet(c);
        const { hugo: h, marc: m } = x;
        const r = pct(COMMISSION_DE_LA_VARIANTE * 100);
        return [
          { libelle: "Seuil d'Hugo par trimestre, avec la commission", attendu: h.sv.seuil, calcul: `${eur(h.s.cout)} ÷ (${pct(enPct(h.s.tauxDeMarge))} − ${r}) = ${eur(h.sv.seuil)}` },
          { libelle: "Commission d'Hugo sur l'année", attendu: x.commissionDHugoSurLAnnee, calcul: `${eur(h.annee.chiffreDAffaires)} × ${r} = ${eur(x.commissionDHugoSurLAnnee)}` },
          { libelle: "Seuil d'Hugo sur l'année, avec la commission", attendu: h.sv.seuilDeLAnnee, calcul: `${eur(h.sv.seuil)} × 4 = ${eur(h.sv.seuilDeLAnnee)}` },
          { libelle: "Seuil de Marc par trimestre, avec la commission", attendu: m.sv.seuil, calcul: `${eur(m.s.cout)} ÷ (${pct(enPct(m.s.tauxDeMarge))} − ${r}) = ${eur(m.sv.seuil)}` },
        ];
      },
      explication: (c) => {
        const x = tableauDuCabinet(c);
        const { hugo: h, marc: m } = x;
        return [
          `${h.k.prenom} a signé ${eur(h.annee.chiffreDAffaires)} dans l'année : avec la commission, c'est ${h.annee.chiffreDAffaires >= h.sv.seuilDeLAnnee ? "tout juste" : "moins que"} son seuil de l'année, ${eur(h.sv.seuilDeLAnnee)}. Sa marge (${eur(h.annee.marge)}) paierait sa commission (${eur(x.commissionDHugoSurLAnnee)}) et son coût (${eur(h.annee.cout)}), et il ne rapporterait plus rien : un résultat de ${eur(x.resultatDHugoAvecLaCommission)}.`,
          `La commission pèse plus sur les comptes qui laissent peu : le seuil de ${m.k.prenom} monte de ${pct(enPct(m.sv.seuil / m.s.seuil - 1))}, celui d'${h.k.prenom} de ${pct(enPct(h.sv.seuil / h.s.seuil - 1))}. Une commission sur le chiffre d'affaires pousse à vendre, pas à vendre ce qui laisse de la marge.`,
        ];
      },
    },
    {
      id: "juger-hugo",
      type: "choix",
      titre: "Ce qu'un voyant ne dit pas",
      notions: ["dashboard", "breakeven"],
      question: (c) => {
        const x = tableauDuCabinet(c);
        const q = x.hugo.trimestres[0]!;
        const noms = q.voyants.map((v) => NOMS_DES_VOYANTS[v]);
        const liste = noms.length > 1 ? `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}` : (noms[0] ?? "aucun");
        return `Au T1, ${qte(q.voyants.length)} voyants d'${x.hugo.k.prenom} étaient allumés : ${liste}. Le directeur voulait se séparer de lui en avril. Que lui répondez-vous, l'année faite ?`;
      },
      options: (c) => {
        const x = tableauDuCabinet(c);
        const h = x.hugo;
        const q = h.trimestres[0]!;
        const paie = h.annee.chiffreDAffaires >= h.s.seuilDeLAnnee;
        return [
          {
            texte: `Non : sur l'année, il signe ${eur(h.annee.chiffreDAffaires)} pour un seuil de ${eur(h.s.seuilDeLAnnee)}`,
            juste: paie,
            retour: `Oui : il est sous son seuil aux T1 et T2 (${eur(h.trimestres[0]!.resultat)} puis ${eur(h.trimestres[1]!.resultat)}), au-dessus ensuite, et il rapporte ${eur(h.annee.resultat)} sur l'année. Deux voyants trompaient pour un nouveau : l'évolution sur N − 1 le comparait à son prédécesseur, et un compte neuf se gagne en plusieurs trimestres. Un tableau de bord alerte ; il ne juge pas seul.`,
          },
          {
            texte: `Oui : ${qte(q.voyants.length)} voyants allumés, il ne paie pas son coût`,
            juste: !paie,
            retour: `Non : au T1, il perdait ${eur(-q.resultat)}, mais un trimestre ne fait pas un commercial de conquête. Sur l'année, il rapporte ${eur(h.annee.resultat)}.`,
          },
          {
            texte: `Oui : son chiffre d'affaires recule de ${pct(-enPct(q.evolutionSurNMoins1))} sur N − 1`,
            juste: false,
            retour: "Non : N − 1, c'est le chiffre d'un commercial expérimenté, parti en décembre. Le voyant de l'évolution compare Hugo à un autre : pour un nouveau, il ne dit rien de son travail.",
          },
          {
            texte: "Non : son objectif était trop haut, il fallait le baisser",
            juste: false,
            retour: `Non : baisser l'objectif éteindrait un voyant sans rien changer à son résultat : au T1, il perdait ${eur(-q.resultat)}. C'est le seuil, pas l'objectif, qui dit s'il paie son coût ; et son objectif du T1 était déjà sous son seuil.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard", "conversion_rate", "breakeven"],
      texte: (c) => {
        const x = tableauDuCabinet(c);
        const { hugo: h, nadia: n, marc: m } = x;
        return [
          `Le tableau de bord ${/^[AEIOUYÉ]/.test(x.f.entreprise) ? "d'" : "de "}${x.f.entreprise} compare chaque trimestre au même trimestre de N − 1, pour lire le travail et non la saison : le T${x.chute.q.trimestre} décroche de ${eur(x.chute.baisse)} sur le T${x.chute.avant.trimestre}, mais progresse de ${pct(enPct(x.chute.q.evolutionSurNMoins1))} sur N − 1. Il suit, pour chaque commercial, ses devis, son taux de transformation et son panier, dont le produit fait le chiffre d'affaires.`,
          `Le seuil de rentabilité d'un commercial est son coût divisé par le taux de marge de ce qu'il vend : ${eur(h.s.seuil)} par trimestre pour ${h.k.prenom}, ${eur(m.s.seuil)} pour ${m.k.prenom}, et ${eur(h.sv.seuil)} pour ${h.k.prenom} avec ${pct(COMMISSION_DE_LA_VARIANTE * 100)} de commission. Chez ${n.k.prenom}, l'objectif tenu cachait une transformation qui décroche : ${qte(x.devisEnTrop)} devis de trop au T4. Chez ${h.k.prenom}, ${qte(h.trimestres[0]!.voyants.length)} voyants au T1, et un résultat de ${eur(h.annee.resultat)} sur l'année : un voyant alerte, il ne juge pas seul.`,
          "Au niveau de l'examen, vous savez lire un tableau de bord commercial face à N − 1 et aux objectifs, calculer un taux de transformation, un panier et le seuil de rentabilité d'un commercial, avec ou sans commission, croiser les indicateurs pour trouver celui qui décroche, et dire ce qu'un voyant ne dit pas.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Chiffre d'affaires = devis × taux de transformation × panier moyen. Seuil de rentabilité d'un commercial = son coût ÷ (taux de marge de ses affaires − taux de commission). Un tableau de bord compare au même trimestre de N − 1, et croise l'activité, l'efficacité et le résultat.",
    },
  ],
};
