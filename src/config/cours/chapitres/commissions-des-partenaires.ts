import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { CABINETS_DU_COURS, type FicheDuCabinet } from "../monde/atlas-conseil";
import {
  canalDe,
  commissionPlafond,
  compteMoyen,
  coutDAcquisition,
  coutJournalierDUnConsultant,
  partEnDirectNecessaire,
  partenaireDe,
  portefeuilleDeLAnnee,
  valeurVieAvecUnPartenaire,
} from "../monde/relation-client";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES COMMISSIONS DES CANAUX PARTENAIRES (BTS NDRC, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le cabinet
 * ATLAS CONSEIL a une fiche figée (monde/atlas-conseil.ts) et un modèle simple
 * (monde/relation-client.ts, partie 5 : les partenaires et la commission). Une évolution du moteur ne
 * change rien ici. Décision du propriétaire (octobre 2026) : le contenu du cours fait l'objet de la
 * simulation, inspirée des entreprises de l'arène sans en être le reflet exact.
 *
 * L'objet : gagner un compte d'entreprise. Le cabinet peut le conquérir lui-même (le coût
 * d'acquisition de N, payé une fois), le recevoir d'un apporteur d'affaires (10 % du chiffre
 * d'affaires de la première année, une fois) ou d'une plateforme de mise en relation (20 % de chaque
 * mission, chaque année, sauf pour les comptes qui reviennent signer en direct). Les trois se
 * comparent À VALEUR VIE ÉGALE : la valeur vie du compte moins ce que le canal coûte sur toute la vie
 * du compte. Le piège central : sur la première année seule, la plateforme coûte moins que la
 * conquête ; sur la vie, elle coûte plus, car sa commission revient.
 *
 * Ce qui a changé en passant sur le monde du cours : la place de marché de PIXEL & CO et ses
 * commandes deviennent la plateforme et l'apporteur d'un cabinet, et ses comptes. Le délai de
 * reversement (l'étape `delai`) a disparu : la fiche n'a ni délai ni taux de financement. Il est
 * remplacé par une étape tirée de la fiche, l'apporteur d'affaires (`l-apporteur`), payé une fois.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, la-commission, sur-la-vie (la formule est au repère ou dans la question, qui
 *     nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-plafond
 *     puis le-plafond-au-curseur (la commission la plus haute où la plateforme vaut la conquête, à
 *     valeur vie égale) avant sur-la-vie et le-plafond ; predire-les-retours puis
 *     les-retours-au-curseur (la plus petite part de comptes revenus en direct qui rend la plateforme
 *     rentable) avant les-retours-en-direct ; predire-l-actualisation puis
 *     le-laboratoire-des-partenaires (commission, retours en direct, années lues et valeur vie simple
 *     ou actualisée, avec un graphique des commissions cumulées) avant la-valeur-actualisee ;
 *   · autonome : le-plafond, les-retours-en-direct, le-client (ni formule ni chiffres à prendre ; le
 *     calcul de la correction montre le chemin) ;
 *   · expert : le-laboratoire-des-partenaires et la-valeur-actualisee (la valeur vie actualisée, qui
 *     déplace le plafond), l-apporteur (une variante chiffrée : une commission payée une fois, où le
 *     calcul de la première année devient le bon), tout-par-l-apporteur (une critique de la méthode :
 *     le canal le moins cher n'est pas celui qui suffit) ; puis la synthèse.
 */

/** Le chapitre se joue chez ATLAS CONSEIL seule : un cabinet qui gagne des comptes d'entreprise, un à un. */
export const ENTREPRISES_DES_PARTENAIRES: readonly string[] = ["conseil"];

/** Les bornes du curseur de la commission plafond, en pourcentage du chiffre d'affaires du compte. */
export const COMMISSION_DU_CURSEUR = { min: 0, max: 40 } as const;

/**
 * LE LABORATOIRE DES PARTENAIRES : la commission de la plateforme (de 0 à 30 %), la part de ses
 * comptes qui reviennent en direct après la première année (de 0 à 100 %), les années de vie du compte
 * lues (de 1 à 12) et la valeur vie, simple ou actualisée au taux du cabinet.
 */
export const LEVIERS_DU_LABORATOIRE = {
  commission: { min: 0, max: 30, pas: 1 },
  part: { min: 0, max: 100, pas: 1 },
  horizon: { min: 1, max: 12, pas: 1 },
} as const;

/** Le levier à choix du laboratoire : la valeur vie simple (taux 0) ou actualisée (le taux du cabinet, en %). */
export const VALEUR_VIE_SIMPLE = 0;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Un pourcentage déjà multiplié par 100 : 12,4 → « 12,4 % ». */
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
/** « d'ATLAS CONSEIL », « de NOVA » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La fiche du cabinet du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDuCabinet => CABINETS_DU_COURS[c.code]!;

/**
 * LES COMMISSIONS ATTENDUES SUR LES h PREMIÈRES ANNÉES DU COMPTE (fonction propre au chapitre, proposée
 * pour monde/relation-client.ts). Le compte paie `premiere` la première année, puis `suivante` chaque
 * année où il est encore client (probabilité (1 − attrition)^(t − 1)), et chaque euro de l'année t vaut
 * 1 ÷ (1 + taux)^t aujourd'hui. Avec ρ = (1 − attrition) ÷ (1 + taux) :
 *   premiere ÷ (1 + taux) + suivante ÷ (1 + taux) × ρ × (1 − ρ^(h − 1)) ÷ (1 − ρ).
 * La formule vaut pour un h non entier (le graphique trace une courbe continue) ; quand h grandit, elle
 * tend vers les commissions sur toute la vie, celles du modèle (`valeurVieAvecUnPartenaire`).
 */
export function commissionsSurLesPremieresAnnees(premiere: number, suivante: number, attrition: number, taux: number, h: number) {
  const rho = (1 - attrition) / (1 + taux);
  const suite = h === Infinity ? rho / (1 - rho) : (rho * (1 - Math.pow(rho, Math.max(0, h - 1)))) / (1 - rho);
  return premiere / (1 + taux) + (suivante / (1 + taux)) * suite;
}

/** Tout ce que le chapitre et son cas demandent, sur la fiche. */
export function partenairesDuCabinet(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const m = compteMoyen(f);
  const n = portefeuilleDeLAnnee(f);
  const acq = coutDAcquisition(f);
  const taux = f.tauxDActualisation;
  const plateforme = partenaireDe(f, "plateforme");
  const apporteur = partenaireDe(f, "apporteur");
  const v = valeurVieAvecUnPartenaire(f, "plateforme");
  const va = valeurVieAvecUnPartenaire(f, "plateforme", { taux });
  const ap = valeurVieAvecUnPartenaire(f, "apporteur");
  const apa = valeurVieAvecUnPartenaire(f, "apporteur", { taux });
  const plafond = commissionPlafond(f, "plateforme");
  const plafondActualise = commissionPlafond(f, "plateforme", { taux });
  const plafondSansRetour = commissionPlafond(f, "plateforme", { partQuiRevientEnDirect: 0 });
  const plafondDeLApporteur = commissionPlafond(f, "apporteur");
  const retours = partEnDirectNecessaire(f, "plateforme");
  const retoursActualises = partEnDirectNecessaire(f, "plateforme", { taux });
  // Les années de présence attendues après la première : (1 − attrition) ÷ attrition.
  const anneesSuivantes = (1 - n.attrition) / n.attrition;
  // Ce que la conquête laisse à payer, chaque année suivante, une fois la première commission payée.
  const commissionAnnuellePayable = auCentime((acq.cac - v.commissionPremiereAnnee) / anneesSuivantes);
  // Le piège : à la commission plafond « de la première année », ce que coûte la vie du compte.
  const tauxDuPiege = Math.floor(plafond.plafondALaPremiereAnnee * 100 + 1e-9);
  const premiereAuPiege = auCentime((m.chiffreDAffaires * tauxDuPiege) / 100);
  const vieAuPiege = auCentime(premiereAuPiege * plafond.facteur);
  return {
    f,
    m,
    n,
    acq,
    taux,
    plateforme,
    apporteur,
    coutJournalier: coutJournalierDUnConsultant(f),
    anneesSuivantes,
    dureeDeVie: 1 / n.attrition,
    v,
    va,
    ap,
    apa,
    partDeLaMarge: auDixieme((v.commissionPremiereAnnee / m.marge) * 100),
    margeDeLaPremiereAnnee: auCentime(m.marge - v.commissionPremiereAnnee),
    facteur: plafond.facteur,
    facteurActualise: plafondActualise.facteur,
    plafond: plafond.plafond * 100,
    plafondEntier: plafond.plafondEntier,
    plafondALaPremiereAnnee: plafond.plafondALaPremiereAnnee * 100,
    tauxDuPiege,
    premiereAuPiege,
    vieAuPiege,
    plafondActualise: plafondActualise.plafond * 100,
    plafondActualiseEntier: plafondActualise.plafondEntier,
    plafondSansRetour: plafondSansRetour.plafond * 100,
    facteurSansRetour: plafondSansRetour.facteur,
    plafondDeLApporteur: plafondDeLApporteur.plafond * 100,
    commissionAnnuellePayable,
    retours: retours.part === null ? null : retours.part * 100,
    retoursEntiers: retours.partEntiere,
    retoursActualises: retoursActualises.part === null ? null : retoursActualises.part * 100,
    retoursActualisesEntiers: retoursActualises.partEntiere,
  };
}

export type PartenairesDuCabinet = ReturnType<typeof partenairesDuCabinet>;

/**
 * Le laboratoire : la plateforme à une commission et une part de retours en direct quelconques (en %),
 * lue sur `horizon` années, à la valeur vie simple (`methode` 0) ou actualisée (`methode` = le taux du
 * cabinet, en %). La conquête en propre coûte le coût d'acquisition, payé aujourd'hui : il ne
 * s'actualise pas.
 */
export function laboratoireDesPartenaires(x: PartenairesDuCabinet, p: Readonly<Record<string, number>>) {
  const t = p.commission! / 100;
  const d = p.part! / 100;
  const r = p.methode! / 100;
  const a = x.n.attrition;
  const premiere = auCentime(x.m.chiffreDAffaires * t);
  const suivante = auCentime(premiere * (1 - d));
  const surLHorizon = auCentime(commissionsSurLesPremieresAnnees(premiere, suivante, a, r, p.horizon!));
  const surLaVie = auCentime(commissionsSurLesPremieresAnnees(premiere, suivante, a, r, Infinity));
  const valeurVie = auCentime(x.m.marge / (a + r));
  const avecLaPlateforme = auCentime(valeurVie - surLaVie);
  const enPropre = auCentime(valeurVie - x.acq.cac);
  return { premiere, suivante, surLHorizon, surLaVie, valeurVie, avecLaPlateforme, enPropre, ecart: auCentime(avecLaPlateforme - enPropre) };
}

/** Les trois façons de gagner un compte moyen : le document de départ. */
function tableauDesTroisFacons(x: PartenairesDuCabinet): TableauDeDonnees {
  return {
    titre: `Gagner un compte moyen ${dE(x.f.entreprise)}`,
    colonnes: ["Conquête en propre", x.plateforme.nom, x.apporteur.nom],
    lignes: [
      { libelle: "Ce que coûte le canal", valeurs: [`${eur(x.acq.cac)}, une fois`, `${pct(x.plateforme.commission * 100)} de chaque mission`, `${pct(x.apporteur.commission * 100)} de la première année`] },
      {
        libelle: "Après la première année",
        valeurs: ["rien", `${pct(x.plateforme.partQuiRevientEnDirect * 100)} des comptes reviennent signer en direct`, "rien : le compte signe en direct"],
      },
      { libelle: "Chiffre d'affaires du compte, par an", valeurs: [eur(x.m.chiffreDAffaires), eur(x.m.chiffreDAffaires), eur(x.m.chiffreDAffaires)] },
      { libelle: "Marge du compte, par an", valeurs: [eur(x.m.marge), eur(x.m.marge), eur(x.m.marge)] },
    ],
  };
}

/** Les canaux de conquête de N, de l'entonnoir au coût d'acquisition. */
function tableauDesCanaux(x: PartenairesDuCabinet): TableauDeDonnees {
  return {
    titre: `Les canaux de conquête ${dE(x.f.entreprise)}, ${x.f.anneeDeReference}`,
    colonnes: ["Contacts", "Comptes gagnés", "Coût", "Coût d'acquisition"],
    lignes: x.f.canaux.map((k) => ({ libelle: k.nom, valeurs: [qte(k.contacts), qte(k.contrats), eur(k.cout), eur(auCentime(k.cout / k.contrats))] })),
  };
}

export const COMMISSIONS_DES_PARTENAIRES: Chapitre = {
  code: "commissions-des-partenaires",
  parcours: "ndrc",
  palier: 3,
  blocs: [
    "BTS NDRC Bloc 3 · Relation client et animation de réseaux",
  ],
  titre: "Les commissions des canaux partenaires",
  accroche:
    "Une plateforme amène des comptes sans prospection, et prélève sa part chaque année. Ce qu'elle coûte vraiment sur la vie d'un compte, comparée à la conquête en propre et à un apporteur d'affaires, et jusqu'où sa commission peut monter.",
  objectifs: [
    "Calculer la commission d'un partenaire et la part de la marge qu'elle prend",
    "Comparer un canal partenaire à la conquête en propre, à valeur vie égale",
    "Trouver la commission plafond d'un partenaire, et éviter le piège de la première année",
    "Chiffrer la part de comptes revenus en direct qui rend un partenaire rentable",
    "Refaire la comparaison à la valeur vie actualisée, et pour une commission payée une fois",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_PARTENAIRES,
    pourquoi:
      "ce chapitre se joue au cabinet ATLAS CONSEIL, qui gagne ses comptes d'entreprise un à un, par sa propre prospection ou par des partenaires payés à la commission : c'est là qu'une commission se pèse sur toute la vie d'un compte.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois façons de gagner un compte",
      notions: ["distribution_commission", "customer_acquisition_cost", "customer_lifetime_value"],
      tableau: (c) => tableauDesTroisFacons(partenairesDuCabinet(c)),
      texte: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, au cabinet ${x.f.entreprise}, qui vend des journées de conseil et de formation à des entreprises. Sur ${x.f.anneeDeReference}, son compte moyen a acheté ${eur(x.m.chiffreDAffaires)} de journées et laissé ${eur(x.m.marge)} de marge sur coûts directs : son chiffre d'affaires, moins ses frais de mission et ses supports, moins ses journées au coût d'un consultant (${eur(x.coutJournalier)}).`,
          `La simulation suppose que l'attrition de ${x.f.anneeDeReference}, ${pct(x.n.attrition * 100)} des comptes perdus chaque année, vaut pour toute la vie du compte : il reste en moyenne ${qte(x.dureeDeVie)} ans, et sa valeur vie simple est de ${eur(x.v.valeurVie)}. Le gagner soi-même a coûté ${eur(x.acq.cac)} en moyenne (${eur(x.acq.cout)} de prospection, de salons, de campagne et d'apporteur pour ${qte(x.acq.comptes)} comptes gagnés), payés une fois.`,
          `Les partenaires du cabinet proposent aussi leurs comptes. La ${x.plateforme.nom.toLowerCase()} prend ${pct(x.plateforme.commission * 100)} de chaque mission passée par elle ; la simulation suppose qu'après la première année, ${pct(x.plateforme.partQuiRevientEnDirect * 100)} de ses comptes reviennent signer en direct, et que les autres restent chez elle. L'${x.apporteur.nom.toLowerCase()} prend ${pct(x.apporteur.commission * 100)} du chiffre d'affaires de la première année, une seule fois.`,
        ];
      },
      repere: () =>
        "Commission = taux × chiffre d'affaires du compte. Valeur vie simple = marge annuelle ÷ attrition. Valeur vie nette = valeur vie du compte − ce que le canal coûte sur toute la vie du compte : les canaux se comparent à valeur vie égale.",
    },
    {
      id: "la-commission",
      objectifs: [0],
      type: "montants",
      titre: "Ce que prélève la plateforme",
      notions: ["distribution_commission", "contribution_margin"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `Calculez la commission de la plateforme sur la première année d'un compte moyen (${pct(x.plateforme.commission * 100)} de ${eur(x.m.chiffreDAffaires)}), la part de la marge du compte (${eur(x.m.marge)}) qu'elle prend, au dixième, puis la marge qui reste au cabinet la première année.`;
      },
      champs: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          { libelle: "Commission de la première année", attendu: x.v.commissionPremiereAnnee, calcul: `${eur(x.m.chiffreDAffaires)} × ${pct(x.plateforme.commission * 100)} = ${eur(x.v.commissionPremiereAnnee)}` },
          { libelle: "Part de la marge du compte prélevée (%)", attendu: x.partDeLaMarge, tolerance: 0.1, calcul: `${eur(x.v.commissionPremiereAnnee)} ÷ ${eur(x.m.marge)} × 100 = ${pct(x.partDeLaMarge)}` },
          { libelle: "Marge laissée au cabinet la première année", attendu: x.margeDeLaPremiereAnnee, calcul: `${eur(x.m.marge)} − ${eur(x.v.commissionPremiereAnnee)} = ${eur(x.margeDeLaPremiereAnnee)}` },
        ];
      },
      explication: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          `La commission se calcule sur le chiffre d'affaires, mais elle se paie sur la marge : ${pct(x.plateforme.commission * 100)} des ventes, c'est ${pct(x.partDeLaMarge)} de ce que le compte laisse. Le client, lui, ne la voit pas : elle tombe dans les charges du cabinet.`,
          `Sur cette seule première année, ${eur(x.v.commissionPremiereAnnee)} coûtent moins que les ${eur(x.acq.cac)} de la conquête en propre. Reste à savoir ce que vaut la comparaison sur toute la vie du compte.`,
        ];
      },
    },
    {
      id: "predire-le-plafond",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la commission plafond",
      notions: ["distribution_commission", "customer_lifetime_value"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `Avant de calculer, pariez. La première année, la plateforme prend ${eur(x.v.commissionPremiereAnnee)} sur un compte moyen ; le gagner soi-même coûte ${eur(x.acq.cac)}. Sur toute la vie du compte, jusqu'à quelle commission la plateforme vaut-elle la conquête en propre ?`;
      },
      options: (c) => {
        const x = partenairesDuCabinet(c);
        const actuel = x.plateforme.commission * 100;
        const voir = "Faites varier la commission à l'étape suivante : le curseur compare les deux valeurs vie nettes.";
        const pari = (juste: boolean) => (juste ? `Bon pari. ${voir}` : `Pari à vérifier. ${voir}`);
        return [
          { texte: `Au-delà de ${pct(actuel)} : la première commission coûte bien moins que la conquête`, juste: x.plafond > actuel, retour: pari(x.plafond > actuel) },
          { texte: `Sous ${pct(actuel)} : la commission revient chaque année sur les comptes restés chez elle`, juste: x.plafond < actuel, retour: pari(x.plafond < actuel) },
          { texte: `À ${pct(actuel)} pile : c'est le taux que le marché a fixé`, juste: x.plafond === actuel, retour: pari(x.plafond === actuel) },
        ];
      },
    },
    {
      id: "le-plafond-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "La commission plafond au curseur",
      notions: ["distribution_commission", "customer_lifetime_value", "customer_acquisition_cost"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `Faites varier la commission de la plateforme, de ${pct(COMMISSION_DU_CURSEUR.min)} à ${pct(COMMISSION_DU_CURSEUR.max)}. Une droite donne la valeur vie nette d'un compte de la plateforme (sa valeur vie, ${eur(x.v.valeurVie)}, moins ses commissions sur toute sa vie), l'autre celle d'un compte gagné en propre (${eur(x.v.valeurVie)} − ${eur(x.acq.cac)}). Placez le curseur sur la plus haute commission, au pourcentage entier, où la plateforme vaut encore la conquête, puis validez.`;
      },
      grandeur: () => ({ libelle: "Commission de la plateforme", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => {
        const x = partenairesDuCabinet(c);
        return { attendu: x.plafondEntier, min: COMMISSION_DU_CURSEUR.min, max: COMMISSION_DU_CURSEUR.max };
      },
      zones: ["La plateforme vaut la conquête", "La conquête en propre vaut plus"],
      rates: () => ({
        dessous: "Plus haut, la plateforme vaut encore la conquête : cherchez la commission la plus haute.",
        dessus: "À cette commission, un compte de la plateforme vaut moins, sur sa vie, qu'un compte gagné en propre.",
      }),
      montrer: "Montrer la commission plafond",
      lecture: (c, t) => {
        const x = partenairesDuCabinet(c);
        const premiere = auCentime((x.m.chiffreDAffaires * t) / 100);
        const vie = auCentime(premiere * x.facteur);
        return [
          { libelle: "Commission de la première année", montant: premiere },
          { libelle: "Commissions sur toute la vie du compte", montant: vie },
          { libelle: "Valeur vie nette avec la plateforme", montant: auCentime(x.v.valeurVie - vie) },
          { libelle: "Valeur vie nette en propre", montant: x.v.enPropre },
          { libelle: "Écart en faveur de la plateforme", montant: auCentime(x.v.valeurVie - vie - x.v.enPropre), fort: true },
        ];
      },
      droites: (c) => {
        const x = partenairesDuCabinet(c);
        return {
          produit: (t) => x.v.valeurVie - ((x.m.chiffreDAffaires * t) / 100) * x.facteur,
          cout: () => x.v.enPropre,
          libelles: ["Valeur vie nette d'un compte de la plateforme", "Valeur vie nette d'un compte gagné en propre"],
        };
      },
      explication: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          `Jusqu'à ${pct(x.plafondEntier)}, un compte de la plateforme vaut encore, sur sa vie, un compte gagné en propre ; elle en demande ${pct(x.plateforme.commission * 100)}. Chaque point de commission coûte bien plus qu'un point de la première année : il revient chaque année sur les comptes restés chez elle.`,
          `Le piège : sur la seule première année, on irait jusqu'à ${pct(x.tauxDuPiege)}. À ${pct(x.tauxDuPiege)}, la première commission (${eur(x.premiereAuPiege)}) coûte encore moins que la conquête, mais la vie du compte en coûte ${eur(x.vieAuPiege)}. C'est ce que les deux étapes suivantes font calculer.`,
        ];
      },
    },
    {
      id: "sur-la-vie",
      objectifs: [1],
      type: "montants",
      titre: "Ce que la plateforme coûte sur la vie du compte",
      notions: ["distribution_commission", "customer_lifetime_value", "churn_rate"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `La plateforme prend ${eur(x.v.commissionPremiereAnnee)} la première année. Ensuite, ${pct(x.plateforme.partQuiRevientEnDirect * 100)} de ses comptes signent en direct : la commission d'une année suivante, en moyenne sur les comptes, vaut ${eur(x.v.commissionPremiereAnnee)} × (1 − ${pct(x.plateforme.partQuiRevientEnDirect * 100)}). Un compte reste encore, après sa première année, (1 − ${pct(x.n.attrition * 100)}) ÷ ${pct(x.n.attrition * 100)} années en moyenne. Calculez la commission d'une année suivante, ces années suivantes, les commissions sur toute la vie du compte, puis la valeur vie nette d'un compte de la plateforme (valeur vie ${eur(x.v.valeurVie)} moins ces commissions).`;
      },
      champs: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          {
            libelle: "Commission d'une année suivante",
            attendu: x.v.commissionDesAnneesSuivantes,
            calcul: `${eur(x.v.commissionPremiereAnnee)} × (1 − ${pct(x.plateforme.partQuiRevientEnDirect * 100)}) = ${eur(x.v.commissionDesAnneesSuivantes)}`,
          },
          { libelle: "Années suivantes attendues", attendu: x.anneesSuivantes, calcul: `(1 − ${pct(x.n.attrition * 100)}) ÷ ${pct(x.n.attrition * 100)} = ${qte(x.anneesSuivantes)}` },
          {
            libelle: "Commissions sur toute la vie du compte",
            attendu: x.v.commissionsSurLaVie,
            calcul: `${eur(x.v.commissionPremiereAnnee)} + ${eur(x.v.commissionDesAnneesSuivantes)} × ${qte(x.anneesSuivantes)} = ${eur(x.v.commissionsSurLaVie)}`,
          },
          { libelle: "Valeur vie nette avec la plateforme", attendu: x.v.avecLePartenaire, calcul: `${eur(x.v.valeurVie)} − ${eur(x.v.commissionsSurLaVie)} = ${eur(x.v.avecLePartenaire)}` },
        ];
      },
      explication: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          `Sur sa vie, un compte de la plateforme coûte ${eur(x.v.commissionsSurLaVie)} de commissions, et il laisse ${eur(x.v.avecLePartenaire)}. Gagné en propre, il laisse ${eur(x.v.enPropre)} (${eur(x.v.valeurVie)} − ${eur(x.acq.cac)}) : la conquête vaut ${eur(-x.v.ecart)} de plus par compte.`,
          "Les canaux se comparent à valeur vie égale : le même compte, la même marge, la même durée de vie ; seul change ce que le canal coûte, une fois ou chaque année.",
        ];
      },
    },
    {
      id: "le-plafond",
      objectifs: [2],
      type: "montants",
      titre: "La commission plafond, et le piège de la première année",
      notions: ["distribution_commission", "customer_acquisition_cost"],
      question: () =>
        "Sans formule cette fois. Calculez ce que coûte, sur la vie du compte, un euro de commission payé chaque année où la plateforme le prend (la première année, puis les années suivantes, en moyenne sur les comptes), puis la commission plafond, au dixième. Calculez enfin la commission plafond qu'on trouverait en comparant la conquête à la seule première année.",
      champs: (c) => {
        const x = partenairesDuCabinet(c);
        const suite = 1 - x.plateforme.partQuiRevientEnDirect;
        return [
          {
            libelle: "Ce que coûte 1 € de commission annuelle, sur la vie",
            attendu: auCentime(x.facteur),
            calcul: `1 + (1 − ${pct(x.plateforme.partQuiRevientEnDirect * 100)}) × ${qte(x.anneesSuivantes)} = 1 + ${qte(suite)} × ${qte(x.anneesSuivantes)} = ${qte(auCentime(x.facteur))} €`,
          },
          {
            libelle: "Commission plafond (%)",
            attendu: auDixieme(x.plafond),
            tolerance: 0.1,
            calcul: `${eur(x.acq.cac)} ÷ (${eur(x.m.chiffreDAffaires)} × ${qte(auCentime(x.facteur))}) × 100 = ${pct(auDixieme(x.plafond))}`,
          },
          {
            libelle: "Commission plafond sur la première année seule (%)",
            attendu: auDixieme(x.plafondALaPremiereAnnee),
            tolerance: 0.1,
            calcul: `${eur(x.acq.cac)} ÷ ${eur(x.m.chiffreDAffaires)} × 100 = ${pct(auDixieme(x.plafondALaPremiereAnnee))}`,
          },
        ];
      },
      explication: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          `Le curseur l'a montré : la commission plafond est de ${pct(auDixieme(x.plafond))}, ${pct(x.plafondEntier)} au point entier. Chaque euro de commission annuelle en coûte ${qte(auCentime(x.facteur))} sur la vie du compte : la conquête, payée une fois, ne peut en payer que ${eur(x.acq.cac)} ÷ ${qte(auCentime(x.facteur))}.`,
          `Comparer à la première année seule donne ${pct(auDixieme(x.plafondALaPremiereAnnee))} : ${qte(auCentime(x.facteur))} fois trop, exactement ce que coûte 1 € de commission annuelle sur la vie. C'est oublier que la plateforme garde une partie des comptes, et que ceux-là repaient chaque année.`,
        ];
      },
    },
    {
      id: "predire-les-retours",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur les retours en direct",
      notions: ["distribution_commission", "customer_lifetime_value"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `À ${pct(x.plateforme.commission * 100)}, la plateforme coûte ${eur(x.v.commissionsSurLaVie)} sur la vie d'un compte, plus que les ${eur(x.acq.cac)} de la conquête. Pariez : quelle part de ses comptes devrait revenir signer en direct après la première année pour qu'elle vaille la conquête, à sa commission d'aujourd'hui ?`;
      },
      options: (c) => {
        const x = partenairesDuCabinet(c);
        const voir = "Faites varier les retours en direct à l'étape suivante : le curseur compare ses commissions au coût de la conquête.";
        const pari = (juste: boolean) => (juste ? `Bon pari. ${voir}` : `Pari à vérifier. ${voir}`);
        const moitie = x.retours !== null && x.retours < 50;
        const plus = x.retours !== null && x.retours >= 50;
        return [
          { texte: `Moins de la moitié : la première année n'a coûté que ${eur(x.v.commissionPremiereAnnee)}`, juste: moitie, retour: pari(moitie) },
          { texte: "Plus de la moitié : chaque compte resté chez elle repaie sa commission", juste: plus, retour: pari(plus) },
          { texte: "Aucune part ne suffit : même seule, la première commission coûte plus", juste: x.retours === null, retour: pari(x.retours === null) },
        ];
      },
    },
    {
      id: "les-retours-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "Les retours en direct au curseur",
      notions: ["distribution_commission", "customer_acquisition_cost"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `La commission reste à ${pct(x.plateforme.commission * 100)}. Faites varier la part des comptes de la plateforme qui reviennent signer en direct après la première année, de 0 à 100 %. Une droite donne le coût de la conquête en propre (${eur(x.acq.cac)}), l'autre les commissions de la plateforme sur toute la vie du compte. Placez le curseur sur la plus petite part, au pourcentage entier, où la plateforme ne coûte pas plus que la conquête, puis validez.`;
      },
      grandeur: () => ({ libelle: "Comptes revenus en direct après la première année", unite: "%" }),
      cible: (c) => {
        const x = partenairesDuCabinet(c);
        return { attendu: x.retoursEntiers ?? 100, min: 0, max: 100 };
      },
      zones: ["La plateforme coûte moins que la conquête", "La conquête coûte moins que la plateforme"],
      rates: () => ({
        dessous: "À cette part, la plateforme coûte encore plus que la conquête : trop de comptes restent chez elle.",
        dessus: "Plus bas, la plateforme coûte encore moins que la conquête : cherchez la plus petite part.",
      }),
      montrer: "Montrer la part nécessaire",
      lecture: (c, d) => {
        const x = partenairesDuCabinet(c);
        const suivante = auCentime(x.v.commissionPremiereAnnee * (1 - d / 100));
        const vie = auCentime(x.v.commissionPremiereAnnee + suivante * x.anneesSuivantes);
        return [
          { libelle: "Commission d'une année suivante", montant: suivante },
          { libelle: "Commissions sur toute la vie du compte", montant: vie },
          { libelle: "Coût de la conquête en propre", montant: x.acq.cac },
          { libelle: "Écart en faveur de la plateforme", montant: auCentime(x.acq.cac - vie), fort: true },
        ];
      },
      droites: (c) => {
        const x = partenairesDuCabinet(c);
        return {
          produit: () => x.acq.cac,
          cout: (d) => x.v.commissionPremiereAnnee + x.v.commissionPremiereAnnee * (1 - d / 100) * x.anneesSuivantes,
          libelles: ["Coût de la conquête en propre", "Commissions de la plateforme sur la vie du compte"],
        };
      },
      explication: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          `Il faudrait que ${pct(x.retoursEntiers ?? 100)} des comptes reviennent en direct, et non ${pct(x.plateforme.partQuiRevientEnDirect * 100)}. Les commissions sur la vie descendent alors sous ${eur(x.acq.cac)} : la première coûte ${eur(x.v.commissionPremiereAnnee)}, il ne reste presque rien à payer les années suivantes.`,
          "Une plateforme qui rend ses comptes vaut mieux qu'une plateforme moins chère qui les garde : c'est ce que l'étape suivante fait chiffrer.",
        ];
      },
    },
    {
      id: "les-retours-en-direct",
      objectifs: [3],
      type: "montants",
      titre: "La part de retours qui rend la plateforme rentable",
      notions: ["distribution_commission", "customer_acquisition_cost"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `Sans formule. À ${pct(x.plateforme.commission * 100)} de commission, calculez ce que la conquête laisse à payer à la plateforme chaque année suivante, une fois la première commission payée, puis la part des comptes qui doivent revenir en direct, au dixième. Calculez enfin la commission plafond si aucun compte ne revenait en direct, au dixième.`;
      },
      champs: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          {
            libelle: "Commission annuelle que la conquête peut encore payer",
            attendu: x.commissionAnnuellePayable,
            calcul: `(${eur(x.acq.cac)} − ${eur(x.v.commissionPremiereAnnee)}) ÷ ${qte(x.anneesSuivantes)} années suivantes = ${eur(x.commissionAnnuellePayable)}`,
          },
          {
            libelle: "Part des comptes revenus en direct nécessaire (%)",
            attendu: auDixieme(x.retours ?? 100),
            tolerance: 0.1,
            calcul: `(1 − ${eur(x.commissionAnnuellePayable)} ÷ ${eur(x.v.commissionPremiereAnnee)}) × 100 = ${pct(auDixieme(x.retours ?? 100))}`,
          },
          {
            libelle: "Commission plafond sans aucun retour en direct (%)",
            attendu: auDixieme(x.plafondSansRetour),
            tolerance: 0.1,
            calcul: `${eur(x.acq.cac)} ÷ (${eur(x.m.chiffreDAffaires)} × (1 + ${qte(x.anneesSuivantes)})) × 100 = ${pct(auDixieme(x.plafondSansRetour))}`,
          },
        ];
      },
      explication: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          `Pour valoir la conquête à ${pct(x.plateforme.commission * 100)}, la plateforme ne devrait prendre que ${eur(x.commissionAnnuellePayable)} par an après la première année, en moyenne sur ses comptes : il faudrait que ${pct(auDixieme(x.retours ?? 100))} d'entre eux reviennent en direct. Si elle n'en rendait aucun, sa commission ne devrait pas dépasser ${pct(auDixieme(x.plafondSansRetour))}.`,
          "La commission plafond dépend autant des retours en direct que du taux : négocier avec une plateforme, c'est négocier les deux.",
        ];
      },
    },
    {
      id: "le-client",
      objectifs: [1],
      type: "choix",
      titre: "Ce que le partenaire garde",
      notions: ["distribution_commission", "customer_lifetime_value"],
      question: () => "Un compte est gagné par la plateforme, un autre par la prospection du cabinet, la même année. L'année suivante, s'ils achètent encore, qu'est-ce qui les distingue ?",
      options: (c) => {
        const x = partenairesDuCabinet(c);
        const restent = pct((1 - x.plateforme.partQuiRevientEnDirect) * 100);
        return [
          {
            texte: "Le compte de la plateforme repaie sa commission, s'il n'est pas revenu en direct",
            juste: true,
            retour: `Oui : ${restent} des comptes de la plateforme restent chez elle, et chacun repaie ${eur(x.v.commissionPremiereAnnee)} par an, ${eur(x.v.commissionDesAnneesSuivantes)} en moyenne sur les comptes. Le compte gagné en propre laisse sa marge entière, ${eur(x.m.marge)} : sa conquête ne se paie qu'une fois.`,
          },
          {
            texte: "Rien : une fois gagné, un compte vaut la même chose quel que soit le canal",
            juste: false,
            retour: "Non : la plateforme prélève sur chaque mission des comptes restés chez elle, pas seulement sur la première année. Le compte gagné en propre, lui, ne coûte plus rien.",
          },
          {
            texte: `Le compte de la prospection coûtera à nouveau ses ${eur(x.acq.cac)} de conquête`,
            juste: false,
            retour: `Non : le coût d'acquisition se paie pour gagner un compte, une fois. S'il revient de lui-même, il laisse sa marge, ${eur(x.m.marge)}.`,
          },
        ];
      },
    },
    {
      id: "predire-l-actualisation",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur l'actualisation",
      notions: ["discounting", "customer_lifetime_value"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `Le cabinet actualise à ${pct(x.taux * 100)} par an : un euro de marge dans un an vaut 1 ÷ ${qte(1 + x.taux)} aujourd'hui. Si l'on actualise la valeur vie du compte et les commissions de la plateforme, sa commission plafond…`;
      },
      options: (c) => {
        const x = partenairesDuCabinet(c);
        const voir = "Le laboratoire de l'étape suivante a les deux valeurs vie, simple et actualisée : basculez de l'une à l'autre.";
        const pari = (juste: boolean) => (juste ? `Bon pari. ${voir}` : `Pari à vérifier. ${voir}`);
        const monte = x.plafondActualise > x.plafond;
        const baisse = x.plafondActualise < x.plafond;
        return [
          { texte: "Monte : les commissions se paient plus tard, la conquête aujourd'hui", juste: monte, retour: pari(monte) },
          { texte: `Baisse : la valeur vie du compte fond, de ${eur(x.v.valeurVie)} à ${eur(x.va.valeurVie)}`, juste: baisse, retour: pari(baisse) },
          { texte: "Ne bouge pas : on actualise les deux côtés de la même façon", juste: !monte && !baisse, retour: pari(!monte && !baisse) },
        ];
      },
    },
    {
      id: "le-laboratoire-des-partenaires",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire des partenaires",
      notions: ["distribution_commission", "customer_lifetime_value", "discounting"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `Faites vivre un compte moyen de la plateforme. Changez sa commission, la part de ses comptes qui reviennent en direct, les années de vie du compte que vous lisez, et la valeur vie, simple ou actualisée à ${pct(x.taux * 100)}. Le tableau compare la plateforme à la conquête en propre ; le graphique trace ses commissions cumulées, année après année, face au coût de la conquête. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = partenairesDuCabinet(c);
        const L = LEVIERS_DU_LABORATOIRE;
        const actualisee = Math.round(x.taux * 100);
        return [
          { code: "commission", libelle: "Commission de la plateforme", unite: "%", ...L.commission, depart: Math.round(x.plateforme.commission * 100) },
          { code: "part", libelle: "Comptes revenus en direct après la première année", unite: "%", ...L.part, depart: Math.round(x.plateforme.partQuiRevientEnDirect * 100) },
          { code: "horizon", libelle: "Années de vie du compte lues", unite: "ans", ...L.horizon, depart: L.horizon.min },
          {
            code: "methode",
            libelle: "Valeur vie",
            unite: "",
            min: VALEUR_VIE_SIMPLE,
            max: actualisee,
            pas: actualisee,
            depart: VALEUR_VIE_SIMPLE,
            choix: [
              { valeur: VALEUR_VIE_SIMPLE, libelle: "simple" },
              { valeur: actualisee, libelle: `actualisée à ${pct(actualisee)}` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = partenairesDuCabinet(c);
        const l = laboratoireDesPartenaires(x, p);
        const d = laboratoireDesPartenaires(x, { commission: Math.round(x.plateforme.commission * 100), part: Math.round(x.plateforme.partQuiRevientEnDirect * 100), horizon: LEVIERS_DU_LABORATOIRE.horizon.min, methode: VALEUR_VIE_SIMPLE });
        return [
          { libelle: "Commission de la première année", montant: l.premiere, reference: d.premiere },
          { libelle: "Commissions sur les années lues", montant: l.surLHorizon, reference: d.surLHorizon },
          { libelle: "Commissions sur toute la vie du compte", montant: l.surLaVie, reference: d.surLaVie },
          { libelle: "Valeur vie du compte", montant: l.valeurVie, reference: d.valeurVie },
          { libelle: "Valeur vie nette avec la plateforme", montant: l.avecLaPlateforme, reference: d.avecLaPlateforme },
          { libelle: "Valeur vie nette en propre", montant: l.enPropre, reference: d.enPropre },
          { libelle: "Écart en faveur de la plateforme", montant: l.ecart, reference: d.ecart, effet: true, fort: true },
        ];
      },
      // Les commissions cumulées ne sont pas une droite : chaque année, moins de comptes restent, et
      // chaque euro vaut moins. Elles montent vite, puis de moins en moins, vers les commissions sur la vie.
      graphique: (c) => {
        const x = partenairesDuCabinet(c);
        return {
          levier: "horizon",
          courbes: [
            { libelle: "Commissions cumulées de la plateforme", valeur: (p) => laboratoireDesPartenaires(x, p).surLHorizon },
            { libelle: "Coût de la conquête en propre", valeur: () => x.acq.cac },
          ],
        };
      },
      defi: (c) => {
        const x = partenairesDuCabinet(c);
        const actualisee = Math.round(x.taux * 100);
        const part = Math.round(x.plateforme.partQuiRevientEnDirect * 100);
        const tient = (p: Readonly<Record<string, number>>) => laboratoireDesPartenaires(x, p).ecart >= 0;
        return {
          consigne: `À la valeur vie actualisée, avec ${pct(part)} de retours en direct, trouvez la plus haute commission, au point entier, où la plateforme vaut encore la conquête en propre.`,
          atteint: (p) => p.methode === actualisee && p.part === part && tient(p) && !tient({ ...p, commission: p.commission! + 1 }),
          indice: (p) => {
            if (p.methode !== actualisee) return `Le défi se joue à la valeur vie actualisée : choisissez « actualisée à ${pct(actualisee)} ».`;
            if (p.part !== part) return `Remettez les retours en direct à ${pct(part)}, ceux de la fiche : seule la commission doit changer.`;
            const l = laboratoireDesPartenaires(x, p);
            return l.ecart < 0
              ? `À ${pct(p.commission!)}, la plateforme laisse ${eur(-l.ecart)} de moins que la conquête : baissez la commission.`
              : `À ${pct(p.commission!)}, la plateforme vaut encore la conquête : montez la commission jusqu'au dernier point qui tient.`;
          },
          solution: { commission: x.plafondActualiseEntier, part, horizon: LEVIERS_DU_LABORATOIRE.horizon.max, methode: actualisee },
        };
      },
      explication: (c) => {
        const x = partenairesDuCabinet(c);
        const actuel = Math.round(x.plateforme.commission * 100);
        const part = Math.round(x.plateforme.partQuiRevientEnDirect * 100);
        const a = (h: number) => laboratoireDesPartenaires(x, { commission: actuel, part, horizon: h, methode: VALEUR_VIE_SIMPLE }).surLHorizon;
        const depasse = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find((h) => a(h) > x.acq.cac);
        return [
          `À la valeur vie actualisée, la commission plafond monte à ${pct(x.plafondActualiseEntier)}, contre ${pct(x.plafondEntier)} à la valeur vie simple : les commissions se paient au fil des années, et chaque année lointaine pèse moins ; la conquête, elle, se paie aujourd'hui, en entier. Actualiser favorise le canal qui se paie plus tard.`,
          depasse === undefined
            ? `Remettez la commission à ${pct(actuel)} et la valeur vie simple, puis faites glisser les années lues : les commissions cumulées montent vite, puis de moins en moins.`
            : `Remettez la commission à ${pct(actuel)} et la valeur vie simple, puis faites glisser les années lues : les commissions cumulées passent les ${eur(x.acq.cac)} de la conquête dès la ${depasse}e année. Le piège de la première année se voit sur le graphique : la courbe part sous la droite, et la croise.`,
        ];
      },
    },
    {
      id: "la-valeur-actualisee",
      objectifs: [4],
      type: "montants",
      titre: "La comparaison à la valeur vie actualisée",
      notions: ["discounting", "customer_lifetime_value", "distribution_commission"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `Refaites la comparaison à la valeur vie actualisée, au taux du cabinet (${pct(x.taux * 100)}), la commission restant à ${pct(x.plateforme.commission * 100)}. Calculez la valeur vie actualisée du compte moyen, les commissions de la plateforme sur la vie, actualisées, la valeur vie nette actualisée avec la plateforme et en propre (la conquête se paie aujourd'hui), puis la commission plafond actualisée, au dixième.`;
      },
      champs: (c) => {
        const x = partenairesDuCabinet(c);
        const a = x.n.attrition;
        const r = x.taux;
        const suite = auCentime(x.va.commissionDesAnneesSuivantes * (1 - a) / ((1 + r) * (a + r)));
        const premiere = auCentime(x.va.commissionPremiereAnnee / (1 + r));
        return [
          { libelle: "Valeur vie actualisée du compte", attendu: x.va.valeurVie, calcul: `${eur(x.m.marge)} ÷ (${pct(a * 100)} + ${pct(r * 100)}) = ${eur(x.va.valeurVie)}` },
          {
            libelle: "Commissions sur la vie, actualisées",
            attendu: x.va.commissionsSurLaVie,
            tolerance: 1,
            calcul: `${eur(x.va.commissionPremiereAnnee)} ÷ ${qte(1 + r)} + ${eur(x.va.commissionDesAnneesSuivantes)} × ${pct((1 - a) * 100)} ÷ (${qte(1 + r)} × ${pct((a + r) * 100)}) = ${eur(premiere)} + ${eur(suite)} = ${eur(x.va.commissionsSurLaVie)}`,
          },
          { libelle: "Valeur vie nette actualisée avec la plateforme", attendu: x.va.avecLePartenaire, tolerance: 1, calcul: `${eur(x.va.valeurVie)} − ${eur(x.va.commissionsSurLaVie)} = ${eur(x.va.avecLePartenaire)}` },
          { libelle: "Valeur vie nette actualisée en propre", attendu: x.va.enPropre, calcul: `${eur(x.va.valeurVie)} − ${eur(x.acq.cac)} = ${eur(x.va.enPropre)}` },
          {
            libelle: "Commission plafond actualisée (%)",
            attendu: auDixieme(x.plafondActualise),
            tolerance: 0.1,
            calcul: `${eur(x.acq.cac)} ÷ (${eur(x.m.chiffreDAffaires)} × ${qte(auCentime(x.facteurActualise))}) × 100 = ${pct(auDixieme(x.plafondActualise))}, où ${qte(auCentime(x.facteurActualise))} = 1 ÷ ${qte(1 + r)} + ${qte(1 - x.plateforme.partQuiRevientEnDirect)} × ${pct((1 - a) * 100)} ÷ (${qte(1 + r)} × ${pct((a + r) * 100)})`,
          },
        ];
      },
      explication: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          `Actualisée, la conquête vaut encore ${eur(auCentime(x.va.enPropre - x.va.avecLePartenaire))} de plus par compte que la plateforme à ${pct(x.plateforme.commission * 100)}, contre ${eur(-x.v.ecart)} à la valeur vie simple : l'écart fond, car les commissions se paient plus tard que la conquête. La commission plafond passe de ${pct(auDixieme(x.plafond))} à ${pct(auDixieme(x.plafondActualise))}, et la part de retours en direct nécessaire de ${pct(auDixieme(x.retours ?? 100))} à ${pct(auDixieme(x.retoursActualises ?? 100))}.`,
          "Le verdict ne change pas : à sa commission d'aujourd'hui, la plateforme coûte plus que la conquête. Mais la méthode compte : une valeur vie simple surestime ce que coûte un canal payé au fil des années.",
        ];
      },
    },
    {
      id: "l-apporteur",
      objectifs: [4],
      type: "montants",
      titre: "Variante : l'apporteur d'affaires, payé une fois",
      notions: ["distribution_commission", "customer_acquisition_cost"],
      question: (c) => {
        const x = partenairesDuCabinet(c);
        return `Variante : l'apporteur d'affaires prend ${pct(x.apporteur.commission * 100)} du chiffre d'affaires de la première année, une seule fois. Sur un compte moyen, à la valeur vie simple, calculez sa commission, la valeur vie nette d'un compte apporté, ce qu'elle laisse de plus qu'un compte gagné en propre, puis la commission plafond de l'apporteur, au dixième.`;
      },
      champs: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          { libelle: "Commission de l'apporteur", attendu: x.ap.commissionPremiereAnnee, calcul: `${eur(x.m.chiffreDAffaires)} × ${pct(x.apporteur.commission * 100)} = ${eur(x.ap.commissionPremiereAnnee)}` },
          { libelle: "Valeur vie nette avec l'apporteur", attendu: x.ap.avecLePartenaire, calcul: `${eur(x.ap.valeurVie)} − ${eur(x.ap.commissionsSurLaVie)} = ${eur(x.ap.avecLePartenaire)}` },
          { libelle: "Ce que l'apporteur laisse de plus que la conquête", attendu: x.ap.ecart, calcul: `${eur(x.ap.avecLePartenaire)} − ${eur(x.ap.enPropre)} = ${eur(x.ap.ecart)}` },
          {
            libelle: "Commission plafond de l'apporteur (%)",
            attendu: auDixieme(x.plafondDeLApporteur),
            tolerance: 0.1,
            calcul: `${eur(x.acq.cac)} ÷ ${eur(x.m.chiffreDAffaires)} × 100 = ${pct(auDixieme(x.plafondDeLApporteur))} : une commission payée une fois se compare à la première année`,
          },
        ];
      },
      explication: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          `L'apporteur coûte ${eur(x.ap.commissionPremiereAnnee)} sur un compte moyen, moins que la conquête : un compte apporté laisse ${eur(x.ap.ecart)} de plus qu'un compte gagné en propre. Actualisée, sa commission ne pèse que ${eur(x.apa.commissionsSurLaVie)}.`,
          `Ici, le calcul sur la première année est le bon : la commission ne revient pas. Le plafond de l'apporteur, ${pct(auDixieme(x.plafondDeLApporteur))}, est celui que l'on trouvait à tort pour la plateforme. La méthode suit la forme du contrat : une fois, ou chaque année.`,
        ];
      },
    },
    {
      id: "tout-par-l-apporteur",
      objectifs: [1],
      type: "choix",
      titre: "Le canal le moins cher suffit-il ?",
      notions: ["customer_acquisition_cost", "distribution_commission"],
      tableau: (c) => tableauDesCanaux(partenairesDuCabinet(c)),
      question: () =>
        "La directrice du cabinet propose : « L'apporteur est notre canal le moins cher. Coupons la prospection et passons toute la conquête par lui. » Qu'en dites-vous ?",
      options: (c) => {
        const x = partenairesDuCabinet(c);
        const k = canalDe(x.f, "apporteurs");
        const cacApporteur = auCentime(k.cout / k.contrats);
        return [
          {
            texte: `Non : il n'a présenté que ${qte(k.contacts)} entreprises dans l'année ; il complète la conquête`,
            juste: true,
            retour: `Oui : l'apporteur coûte ${eur(cacApporteur)} par compte gagné, mais il n'a fait que ${qte(k.contacts)} présentations et ${qte(k.contrats)} compte dans l'année, sur les ${qte(x.acq.comptes)} que le cabinet a gagnés. Couper la prospection, c'est perdre ses comptes sans que l'apporteur en amène plus : un canal se juge sur ce qu'il coûte et sur ce qu'il peut amener.`,
          },
          {
            texte: `Oui : ${eur(cacApporteur)} par compte gagné, contre ${eur(x.acq.cac)} en moyenne`,
            juste: false,
            retour: `Non : le coût par compte est le bon critère pour comparer, pas pour dimensionner. L'apporteur n'a amené que ${qte(k.contrats)} compte ; son réseau ne grandit pas parce que le cabinet coupe sa prospection.`,
          },
          {
            texte: "Non : sa commission revient chaque année, comme celle de la plateforme",
            juste: false,
            retour: `Non : l'apporteur est payé une fois, ${pct(x.apporteur.commission * 100)} de la première année. Le compte apporté signe ensuite en direct.`,
          },
          {
            texte: "Non : à la valeur vie actualisée, l'apporteur coûte plus que la conquête",
            juste: false,
            retour: `Non : actualisée, sa commission ne vaut que ${eur(x.apa.commissionsSurLaVie)}, bien moins que les ${eur(x.acq.cac)} de la conquête. L'actualisation allège encore un canal payé plus tard.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["distribution_commission", "customer_acquisition_cost", "customer_lifetime_value"],
      texte: (c) => {
        const x = partenairesDuCabinet(c);
        return [
          `Chez ${x.f.entreprise}, un compte moyen vaut ${eur(x.v.valeurVie)} de marge sur sa vie. Gagné en propre, il coûte ${eur(x.acq.cac)} une fois et laisse ${eur(x.v.enPropre)}. Par la plateforme, à ${pct(x.plateforme.commission * 100)}, il ne coûte que ${eur(x.v.commissionPremiereAnnee)} la première année, mais ${eur(x.v.commissionsSurLaVie)} sur sa vie, et laisse ${eur(x.v.avecLePartenaire)}. Sa commission plafond est de ${pct(auDixieme(x.plafond))}, pas de ${pct(auDixieme(x.plafondALaPremiereAnnee))} : le piège est de comparer la conquête à la seule première année.`,
          `Les retours en direct font le prix du partenaire : à ${pct(x.plateforme.commission * 100)}, il faudrait que ${pct(x.retoursEntiers ?? 100)} des comptes reviennent en direct ; sans aucun retour, le plafond tomberait à ${pct(auDixieme(x.plafondSansRetour))}. À la valeur vie actualisée, le plafond monte à ${pct(auDixieme(x.plafondActualise))}, car la plateforme se paie plus tard. L'apporteur, payé une fois (${eur(x.ap.commissionPremiereAnnee)}), est le canal le moins cher, mais il ne remplace pas la conquête.`,
          "Au niveau de l'examen, vous savez comparer un canal partenaire à la conquête en propre à valeur vie égale, simple ou actualisée, trouver sa commission plafond et la part de retours en direct qui le rend rentable, adapter le calcul à une commission payée une fois, et dire ce qu'un canal bon marché ne fait pas.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Commissions sur la vie = commission de la première année + commission d'une année suivante × (1 − attrition) ÷ attrition. Commission plafond = coût d'acquisition ÷ (chiffre d'affaires annuel × ce que coûte 1 € de commission annuelle sur la vie). Un canal se juge sur la valeur vie qu'il laisse, pas sur sa première facture.",
    },
  ],
};
