import { arrondi2 as auCentime, deuxChemins, eur, nombreAuCentieme, pct as enPoints } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  COURBE_DES_LIENS,
  FRAIS_DE_PAIEMENT,
  HAUSSE_VISEE,
  PERIODE_DU_SITE,
  RETRACTATION,
  ceQuIlFautPour,
  hebergementsDuTrimestre,
  liensSponsorises,
  meilleurBudgetDesLiens,
  paliersDesLiens,
  retractationsDuTrimestre,
  sourceDuSite,
  traficDuSite,
} from "../monde/site-d-atlas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VALEUR, ficheDe } from "./valeur-d-un-client";

/**
 * CHAPITRE : LE SITE QUI VEND, TRAFIC, RÉFÉRENCEMENT ET CONVERSION (BTS NDRC, bloc 2, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : ATLAS CONSEIL
 * ouvre en N + 1 une boutique en ligne qui vend des places dans ses sessions inter-entreprises, achetées
 * par des entreprises et par des particuliers. Son premier trimestre (les sources de trafic, leurs
 * dépenses et leurs commandes, la place, les frais de paiement, la courbe des liens sponsorisés,
 * l'hébergement, la rétractation) est figé dans monde/site-d-atlas.ts, partie 1, qui ne change aucun
 * chiffre de l'année N du cabinet.
 *
 * L'objet : CA = visites × taux de conversion × panier moyen, la relation qui dit d'où vient le
 * chiffre d'affaires d'un site et ce qu'il faut pour le faire monter ; le coût d'une commande, source
 * par source, et la marge qu'elle laisse une fois payés les frais du paiement en ligne ; le retour sur
 * dépenses publicitaires (ROAS) face à son seuil, qui n'est pas 1 ; puis le budget des liens
 * sponsorisés, dont la courbe figée est concave : il se fixe là où le clic en plus ne rapporte plus ce
 * qu'il coûte. En expert, l'hébergement et la communication unifiée (ce qui fait tenir le site et la
 * relation à distance), et le droit de rétractation des particuliers, chiffrés.
 *
 * Le piège central : le ROAS moyen. À 7 200 €, les liens ramènent encore plus de 4 € de ventes par
 * euro, bien au-dessus du seuil ; mais le dernier palier achète ses clics 7,50 € l'un, plus qu'un clic
 * ne rapporte, et fait perdre de l'argent. Et un ROAS au-dessus de 1, celui des réseaux sociaux, peut
 * perdre de l'argent lui aussi.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, la-conversion, les-sources, la-meilleure-source (la formule est au repère ou dans
 *     la question) ;
 *   · l'expérience avant la formule : predire-les-visites puis les-visites-au-curseur avant
 *     ce-qu-il-faut ; predire-le-budget puis le-laboratoire-des-liens (budget et conversion des
 *     visiteurs, avec le graphique de la marge créée, du budget et du gain) avant le-clic-en-plus ;
 *   · autonome et expert : ce-qu-il-faut, le-paiement-en-ligne, le-roas, la-source-qui-perd,
 *     le-clic-en-plus, ce-qui-fait-tenir-le-site (référencement, hébergement, communication unifiée),
 *     l-hebergement, qui-peut-se-retracter, la-retractation, le-prochain-euro ; puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les ROAS et les heures de panne sont des grandeurs, au
 * centième ; les visites et les commandes rétractées sont des quantités, entières, déclarées comme
 * telles ; les taux, à deux décimales.
 */

/** Le site se lit chez le cabinet du cours, ATLAS CONSEIL. */
export const ENTREPRISES_DU_SITE: readonly string[] = ENTREPRISES_DE_LA_VALEUR;

export const POURQUOI_LE_SITE =
  "ce chapitre suit la boutique en ligne d'un cabinet de formation : il se joue chez ATLAS CONSEIL, dont la simulation du cours fige le premier trimestre du site, le même d'un chapitre à l'autre.";

/**
 * LA VARIANTE DU LABORATOIRE, hypothèse du cours : une page d'arrivée qui convertirait 2 % de ses
 * visiteurs au lieu de 1,5 % (des avis affichés, un paiement en moins d'étapes).
 */
export const CONVERSION_VARIANTE = 0.02;

/** Les bornes du curseur des visites, en centaines de visites du trimestre. */
export const VISITES_DU_CURSEUR = { min: 100, max: 200 } as const;

/** Les leviers du laboratoire : le budget des liens (euros) et la conversion de leurs visiteurs (%). */
export const LEVIERS_DES_LIENS = {
  budget: { min: 0, max: 7_200, pas: 600 },
  conversion: { min: 0.5, max: 2.5, pas: 0.5 },
} as const;

const qte = nombreAuCentieme;
const pct = (t: number) => enPoints(t * 100);
const enPct = (x: number) => auCentime(x * 100);
/** « d'ATLAS CONSEIL », « de NOVA » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le site du cabinet : tout ce que le chapitre et son cas demandent. */
export function siteDuCabinet(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = traficDuSite();
  const m = t.m;
  const source = (code: Parameters<typeof sourceDuSite>[0]) => t.sources.find((s) => s.code === code)!;
  const naturel = source("naturel");
  const payant = source("payant");
  const reseaux = source("reseaux");
  const lettre = source("lettre");
  const direct = source("direct");
  const chiffreVise = auCentime(t.chiffreDAffaires * (1 + HAUSSE_VISEE));
  const vise = ceQuIlFautPour(chiffreVise);
  const paliers = paliersDesLiens();
  const supplements = paliers.slice(1).map((p) => p.supplement!);
  const dernier = supplements.at(-1)!;
  const avantDernier = supplements.at(-2)!;
  const meilleur = meilleurBudgetDesLiens();
  const valeurDUnClic = auCentime(payant.conversion * m.marge);
  const auDernier = liensSponsorises(COURBE_DES_LIENS.at(-1)!.budget);
  /** La plus petite marge d'une commande qui ferait payer le dernier palier : son budget ÷ ses commandes en plus. */
  const margeQuiPaieLeDernier = Math.ceil(dernier.budget / dernier.commandes - 1e-9);
  return {
    f,
    t,
    m,
    naturel,
    payant,
    reseaux,
    lettre,
    direct,
    chiffreVise,
    vise,
    paliers,
    supplements,
    dernier,
    avantDernier,
    meilleur,
    valeurDUnClic,
    auDernier,
    margeQuiPaieLeDernier,
    budgetDuTrimestre: payant.cout,
    retractation: retractationsDuTrimestre(),
    hebergement: hebergementsDuTrimestre(),
  };
}

export type SiteDuCabinet = ReturnType<typeof siteDuCabinet>;

/** Les liens sponsorisés pour un budget et une conversion (en %) quelconques : ce que le laboratoire montre. */
export function laboratoireDesLiens(_x: SiteDuCabinet, budget: number, conversionEnPct: number) {
  const pas = LEVIERS_DES_LIENS.budget.pas;
  const conversion = conversionEnPct / 100;
  const gainDe = (b: number) => liensSponsorises(b, conversion).gain;
  const l = liensSponsorises(budget, conversion);
  const meilleurGain = Math.max(...Array.from({ length: LEVIERS_DES_LIENS.budget.max / pas + 1 }, (_, i) => gainDe(i * pas)));
  return {
    clics: auCentime(l.clics),
    commandes: auCentime(l.commandes),
    chiffreDAffaires: l.chiffreDAffaires,
    coutParClic: l.coutParClic,
    roas: auCentime(l.roas),
    margeCreee: l.margeCreee,
    gain: l.gain,
    pasSuivant: auCentime(gainDe(budget + pas) - gainDe(budget)),
    pasPrecedent: budget >= pas ? auCentime(gainDe(budget) - gainDe(budget - pas)) : 0,
    meilleurGain: auCentime(meilleurGain),
  };
}

/** Les sources du trimestre : le document de départ. */
function tableauDesSources(x: SiteDuCabinet): TableauDeDonnees {
  return {
    titre: `Les sources de trafic de la boutique en ligne, ${PERIODE_DU_SITE}`,
    colonnes: ["Visites", "Dépenses", "Commandes"],
    lignes: [
      ...x.t.sources.map((s) => ({ libelle: s.nom, valeurs: [qte(s.visites), eur(s.cout), qte(s.commandes)] })),
      { libelle: "Le site entier", valeurs: [qte(x.t.visites), eur(x.t.cout), qte(x.t.commandes)] },
    ],
  };
}

/** La courbe des liens sponsorisés : le document des paliers. */
function tableauDeLaCourbe(x: SiteDuCabinet): TableauDeDonnees {
  return {
    titre: "Les liens sponsorisés, selon leur budget du trimestre",
    colonnes: x.paliers.slice(1).map((p) => eur(p.budget)),
    lignes: [{ libelle: "Clics achetés", valeurs: x.paliers.slice(1).map((p) => qte(p.clics)) }],
  };
}

export const LE_SITE_QUI_VEND: Chapitre = {
  code: "le-site-qui-vend",
  parcours: "ndrc",
  palier: 3,
  blocs: ["BTS NDRC Bloc 2 · Relation client à distance et digitalisation"],
  titre: "Le site qui vend : trafic, référencement et conversion",
  accroche:
    "Un site vend autant qu'il a de visites, qu'il en convertit et que pèse le panier. Ce que coûte une commande selon la source, ce que vaut le retour d'une dépense publicitaire, et où mettre le prochain euro du budget digital.",
  objectifs: [
    "Calculer le taux de conversion et le panier moyen, et retrouver le chiffre d'affaires par visites × conversion × panier, à l'endroit et à rebours",
    "Calculer le coût d'une commande, source par source, et la marge qu'elle laisse après les frais du paiement en ligne",
    "Juger une source payante sur son retour sur dépenses publicitaires, face à son seuil",
    "Fixer le budget des liens sponsorisés sur ce que rapporte le clic en plus",
    "Chiffrer ce que changent l'hébergement du site et le droit de rétractation des particuliers",
  ],
  libre: false,
  prerequis: ["cout-d-acquisition"],
  ensuite: ["contenus-communaute-et-e-reputation"],
  entreprises: { codes: ENTREPRISES_DU_SITE, pourquoi: POURQUOI_LE_SITE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une boutique en ligne pour les sessions",
      notions: ["conversion_rate", "average_basket"],
      tableau: (c) => tableauDesSources(siteDuCabinet(c)),
      texte: (c) => {
        const x = siteDuCabinet(c);
        const [particuliers, entreprises] = x.m.acheteurs;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}. Le cabinet vendait ses journées en intra, dans l'entreprise cliente. En N + 1, il ouvre une boutique en ligne : des places dans ses sessions inter-entreprises, une journée de formation en salle, à ${eur(x.m.prixHt)} hors taxes la place. Le tableau donne ${PERIODE_DU_SITE}.`,
          `Les visiteurs arrivent par ${qte(x.t.sources.length)} sources : un moteur de recherche sans annonce (le référencement naturel), une annonce payée au clic (les liens sponsorisés), les réseaux sociaux, la lettre d'information envoyée aux clients ou l'adresse tapée (l'accès direct). Les dépenses sont celles de chaque source ; le temps de l'équipe est à part.`,
          `Les acheteurs sont pour moitié des particuliers qui se forment à leurs frais (${qte(particuliers!.commandes)} commandes d'une place) et pour moitié des entreprises (${qte(entreprises!.commandes)} commandes de ${qte(entreprises!.placesParCommande)} places). Le site a aussi reçu ${qte(x.t.contacts)} demandes de formation sur mesure, que les commerciaux rappellent.`,
        ];
      },
      repere: () => "Taux de conversion = commandes ÷ visites. Panier moyen = chiffre d'affaires ÷ commandes. Chiffre d'affaires = visites × taux de conversion × panier moyen.",
    },
    {
      id: "la-conversion",
      objectifs: [0],
      type: "montants",
      titre: "Le taux de conversion et le panier",
      notions: ["conversion_rate", "average_basket", "revenue"],
      question: (c) => {
        const x = siteDuCabinet(c);
        return `Le site a fait ${qte(x.t.visites)} visites, ${qte(x.t.commandes)} commandes et reçu ${qte(x.t.contacts)} demandes de contact ; ${qte(x.m.places)} places ont été vendues à ${eur(x.m.prixHt)}. Calculez le taux de conversion en commande et en contact (en %), le panier moyen hors taxes, puis le chiffre d'affaires du trimestre par visites × conversion × panier.`;
      },
      champs: (c) => {
        const x = siteDuCabinet(c);
        const ventes = auCentime(x.m.places * x.m.prixHt);
        return [
          { libelle: "Taux de conversion en commande (%)", attendu: enPct(x.t.conversion), calcul: `${qte(x.t.commandes)} ÷ ${qte(x.t.visites)} = ${pct(x.t.conversion)}` },
          { libelle: "Taux de conversion en contact (%)", attendu: enPct(x.t.conversionEnContact), calcul: `${qte(x.t.contacts)} ÷ ${qte(x.t.visites)} = ${pct(x.t.conversionEnContact)}` },
          { libelle: "Panier moyen hors taxes", attendu: x.m.panier, calcul: `${qte(x.m.places)} × ${eur(x.m.prixHt)} ÷ ${qte(x.t.commandes)} = ${eur(ventes)} ÷ ${qte(x.t.commandes)} = ${eur(x.m.panier)}` },
          { libelle: "Chiffre d'affaires du trimestre", attendu: x.t.chiffreDAffaires, calcul: `${qte(x.t.visites)} × ${pct(x.t.conversion)} × ${eur(x.m.panier)} = ${eur(x.t.chiffreDAffaires)}` },
        ];
      },
      explication: (c) => {
        const x = siteDuCabinet(c);
        return [
          `Une visite sur ${qte(1 / x.t.conversion)} se termine par une commande, de ${qte(x.m.placesParCommande)} place en moyenne. Le produit des trois retombe sur les ventes : ${eur(x.t.chiffreDAffaires)}, ${qte(x.m.places)} places à ${eur(x.m.prixHt)}.`,
          "La relation dit où agir : faire venir plus de visiteurs, en convaincre plus, ou leur vendre plus à chaque commande. Chaque levier multiplie les deux autres.",
        ];
      },
    },
    {
      id: "les-sources",
      objectifs: [1],
      type: "montants",
      titre: "Ce que coûte une commande, source par source",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      tableau: (c) => tableauDesSources(siteDuCabinet(c)),
      question: () => "Calculez ce que coûte une commande (dépenses ÷ commandes) pour chaque source qui dépense, puis pour le site entier, au centime.",
      champs: (c) => {
        const x = siteDuCabinet(c);
        return [
          ...[x.naturel, x.payant, x.reseaux, x.lettre].map((s) => ({ libelle: `Coût d'une commande, ${s.nom.toLowerCase()}`, attendu: s.coutParCommande, calcul: `${eur(s.cout)} ÷ ${qte(s.commandes)} = ${eur(s.coutParCommande)}` })),
          { libelle: "Coût d'une commande, site entier", attendu: x.t.coutParCommande, calcul: `${eur(x.t.cout)} ÷ ${qte(x.t.commandes)} = ${eur(x.t.coutParCommande)}` },
        ];
      },
      explication: (c) => {
        const x = siteDuCabinet(c);
        return [
          `Une commande coûte ${eur(x.lettre.coutParCommande)} par la lettre d'information, ${eur(x.reseaux.coutParCommande)} par les réseaux sociaux. La visite d'un réseau social n'est pourtant pas chère, ${eur(x.reseaux.coutParVisite)} ; mais on y flâne, et ${pct(x.reseaux.conversion)} seulement des visiteurs achètent.`,
          `Le coût d'une visite ne dit rien seul : il se divise par la conversion. Coût d'une commande = coût d'une visite ÷ taux de conversion.`,
        ];
      },
    },
    {
      id: "la-meilleure-source",
      objectifs: [1],
      type: "choix",
      titre: "Arrêter la lettre d'information ?",
      notions: ["conversion_rate", "customer_acquisition_cost"],
      question: (c) => {
        const x = siteDuCabinet(c);
        return `Le directeur ${dE(x.f.entreprise)} trouve que la lettre d'information amène peu de monde (${qte(x.lettre.visites)} visites) : il veut l'arrêter et mettre ses ${eur(x.lettre.cout)} dans les réseaux sociaux, qui amènent le double de visites. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = siteDuCabinet(c);
        return [
          {
            texte: "La garder : c'est la source qui convertit le mieux",
            juste: true,
            retour: `Oui : ${pct(x.lettre.conversion)} de ses visiteurs achètent, des clients qui connaissent déjà le cabinet, et une commande y coûte ${eur(x.lettre.coutParCommande)}. Aux réseaux sociaux, il en faut ${eur(x.reseaux.coutParCommande)}.`,
          },
          {
            texte: "L'arrêter : les réseaux sociaux amènent plus de visites par euro",
            juste: false,
            retour: `Non : une visite y coûte ${eur(x.reseaux.coutParVisite)}, mais ${pct(x.reseaux.conversion)} seulement achètent. On ne vend pas des visites, on vend des places.`,
          },
          {
            texte: `L'arrêter : ses visites ne font que ${pct(x.lettre.visites / x.t.visites)} du trafic du site`,
            juste: false,
            retour: `Non : ses ${qte(x.lettre.visites)} visites font ${qte(x.lettre.commandes)} commandes, ${pct(x.lettre.commandes / x.t.commandes)} des ventes du site. Une petite source peut peser lourd.`,
          },
        ];
      },
    },
    {
      id: "predire-les-visites",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur les visites",
      notions: ["conversion_rate", "revenue"],
      question: (c) => {
        const x = siteDuCabinet(c);
        return `Avant de calculer, pariez. Le directeur veut ${pct(HAUSSE_VISEE)} de chiffre d'affaires en plus au trimestre suivant, ${eur(x.chiffreVise)}. Si la conversion et le panier ne bougent pas, il faut…`;
      },
      options: (c) => {
        const x = siteDuCabinet(c);
        const voir = "Faites varier les visites à l'étape suivante : le curseur montre combien il en faut.";
        return [
          { texte: `${pct(HAUSSE_VISEE)} de visites en plus`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${pct(HAUSSE_VISEE * 2)} de visites en plus`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `${pct(x.t.conversion)} de visites en plus, comme la conversion`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-visites-au-curseur",
      objectifs: [0],
      type: "curseur",
      titre: "Les visites qu'il faut",
      notions: ["conversion_rate", "revenue"],
      question: (c) => {
        const x = siteDuCabinet(c);
        return `Faites varier les visites du trimestre, de ${qte(VISITES_DU_CURSEUR.min)} à ${qte(VISITES_DU_CURSEUR.max)} centaines, la conversion (${pct(x.t.conversion)}) et le panier (${eur(x.m.panier)}) restant ceux du premier trimestre. Placez le curseur sur le plus petit nombre de visites qui atteint ${eur(x.chiffreVise)}, puis validez.`;
      },
      grandeur: () => ({ libelle: "Visites du trimestre", unite: "centaines de visites" }),
      cible: (c) => ({ attendu: Math.ceil(siteDuCabinet(c).vise.visites / 100 - 1e-9), min: VISITES_DU_CURSEUR.min, max: VISITES_DU_CURSEUR.max }),
      zones: ["L'objectif est atteint", "L'objectif n'est pas atteint"],
      rates: () => ({
        dessous: "À cette position, le chiffre d'affaires reste sous l'objectif.",
        dessus: "Moins de visites suffiraient : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les visites",
      lecture: (c, q) => {
        const x = siteDuCabinet(c);
        const ca = auCentime(q * 100 * x.t.conversion * x.m.panier);
        return [
          { libelle: "Chiffre d'affaires attendu", montant: ca },
          { libelle: "Objectif du directeur", montant: x.chiffreVise },
          { libelle: "Chiffre d'affaires moins objectif", montant: auCentime(ca - x.chiffreVise), fort: true },
        ];
      },
      droites: (c) => {
        const x = siteDuCabinet(c);
        return {
          produit: (q) => q * 100 * x.t.conversion * x.m.panier,
          cout: () => x.chiffreVise,
          libelles: ["Chiffre d'affaires attendu", "Objectif du directeur"],
        };
      },
      explication: (c) => {
        const x = siteDuCabinet(c);
        return [
          `Il faut ${qte(x.vise.visites)} visites, ${pct(HAUSSE_VISEE)} de plus : le chiffre d'affaires est proportionnel aux visites, tant que les nouveaux visiteurs convertissent comme les autres. C'est une hypothèse forte : des visiteurs achetés plus loin, sur des mots plus vagues, convertissent souvent moins.`,
          "L'étape suivante refait le chemin par le calcul, pour chacun des trois leviers.",
        ];
      },
    },
    {
      id: "ce-qu-il-faut",
      objectifs: [0],
      type: "montants",
      titre: "À rebours : ce qu'il faut pour l'objectif",
      notions: ["conversion_rate", "average_basket", "revenue"],
      question: (c) => {
        const x = siteDuCabinet(c);
        return `Sans formule cette fois. Pour atteindre ${eur(x.chiffreVise)}, calculez ce qu'il faudrait si un seul levier bougeait, les deux autres restant ceux du premier trimestre : les visites, puis le taux de conversion (en %), puis le panier moyen.`;
      },
      champs: (c) => {
        const x = siteDuCabinet(c);
        return [
          { libelle: "Visites qu'il faut", nature: "quantite", attendu: x.vise.visites, calcul: `${eur(x.chiffreVise)} ÷ (${pct(x.t.conversion)} × ${eur(x.m.panier)}) = ${qte(x.vise.visites)} visites` },
          { libelle: "Taux de conversion qu'il faut (%)", attendu: enPct(x.vise.conversion), calcul: `${eur(x.chiffreVise)} ÷ (${qte(x.t.visites)} × ${eur(x.m.panier)}) = ${pct(x.vise.conversion)}` },
          { libelle: "Panier moyen qu'il faut", attendu: x.vise.panier, calcul: `${eur(x.chiffreVise)} ÷ (${qte(x.t.visites)} × ${pct(x.t.conversion)}) = ${eur(x.vise.panier)}` },
        ];
      },
      explication: (c) => {
        const x = siteDuCabinet(c);
        return [
          `Les trois chemins demandent chacun ${pct(HAUSSE_VISEE)} de plus : ${qte(x.vise.visites)} visites, ou ${pct(x.vise.conversion)} de conversion, ou ${eur(x.vise.panier)} de panier (${qte(x.vise.panier / x.m.prixHt)} place${x.vise.panier / x.m.prixHt >= 2 ? "s" : ""} par commande). Ils ne coûtent pas la même chose : des visites s'achètent, une conversion se travaille sur le site (les avis, la page de paiement), un panier se gagne par une offre à plusieurs places.`,
        ];
      },
    },
    {
      id: "le-paiement-en-ligne",
      objectifs: [1],
      type: "montants",
      titre: "Les frais du paiement en ligne et la marge d'une commande",
      notions: ["contribution_margin", "average_basket"],
      question: (c) => {
        const x = siteDuCabinet(c);
        const [p, e] = x.m.acheteurs;
        return `Le prestataire de paiement prend ${pct(FRAIS_DE_PAIEMENT.taux)} du montant payé toutes taxes comprises, plus ${eur(FRAIS_DE_PAIEMENT.parCommande)} par commande. Un particulier paie ${eur(p!.ttc)}, une entreprise ${eur(e!.ttc)}. Calculez les frais d'une commande de chacun, les frais du trimestre, puis la marge d'une commande moyenne : ${qte(x.m.placesParCommande)} place × (${eur(x.m.prixHt)} − ${eur(x.m.coutVariable)} de supports et de repas), moins ses frais.`;
      },
      champs: (c) => {
        const x = siteDuCabinet(c);
        const [p, e] = x.m.acheteurs;
        return [
          { libelle: "Frais d'une commande de particulier", attendu: p!.frais, calcul: `${eur(p!.ttc)} × ${pct(FRAIS_DE_PAIEMENT.taux)} + ${eur(FRAIS_DE_PAIEMENT.parCommande)} = ${eur(p!.frais)}` },
          { libelle: "Frais d'une commande d'entreprise", attendu: e!.frais, calcul: `${eur(e!.ttc)} × ${pct(FRAIS_DE_PAIEMENT.taux)} + ${eur(FRAIS_DE_PAIEMENT.parCommande)} = ${eur(e!.frais)}` },
          { libelle: "Frais de paiement du trimestre", attendu: x.m.fraisDuTrimestre, calcul: `${qte(p!.commandes)} × ${eur(p!.frais)} + ${qte(e!.commandes)} × ${eur(e!.frais)} = ${eur(x.m.fraisDuTrimestre)}` },
          {
            libelle: "Marge d'une commande moyenne",
            attendu: x.m.marge,
            calcul: `${qte(x.m.placesParCommande)} × ${eur(x.m.margeDUnePlace)} − ${eur(x.m.fraisDuTrimestre)} ÷ ${qte(x.m.commandes)} = ${eur(x.m.margeAvantFrais)} − ${eur(x.m.frais)} = ${eur(x.m.marge)}`,
          },
        ];
      },
      explication: (c) => {
        const x = siteDuCabinet(c);
        return [
          `Les frais pèsent ${pct(x.m.fraisDuTrimestre / x.t.chiffreDAffaires)} des ventes hors taxes : ils se prennent sur le prix payé, TVA comprise, et une part fixe pèse plus sur une petite commande. Une commande moyenne laisse ${eur(x.m.marge)}, ${pct(x.m.tauxDeMarge)} de son panier : c'est ce chiffre, et non le panier, qui dira ce qu'une dépense publicitaire peut coûter.`,
        ];
      },
    },
    {
      id: "le-roas",
      objectifs: [2],
      type: "montants",
      titre: "Le retour sur dépenses publicitaires",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => {
        const x = siteDuCabinet(c);
        return `Le ROAS d'une source payante est son chiffre d'affaires ÷ ses dépenses. Calculez celui des liens sponsorisés et celui des réseaux sociaux, au centième. Puis le ROAS seuil, panier ÷ marge d'une commande (${eur(x.m.panier)} ÷ ${eur(x.m.marge)}), sous lequel une dépense perd de l'argent. Enfin ce que les réseaux sociaux laissent, commandes × marge − dépenses (négatif s'ils font perdre).`;
      },
      champs: (c) => {
        const x = siteDuCabinet(c);
        return [
          { libelle: "ROAS des liens sponsorisés", nature: "grandeur", attendu: auCentime(x.payant.roas!), calcul: `${eur(x.payant.chiffreDAffaires)} ÷ ${eur(x.payant.cout)} = ${qte(auCentime(x.payant.roas!))}` },
          { libelle: "ROAS des réseaux sociaux", nature: "grandeur", attendu: auCentime(x.reseaux.roas!), calcul: `${eur(x.reseaux.chiffreDAffaires)} ÷ ${eur(x.reseaux.cout)} = ${qte(auCentime(x.reseaux.roas!))}` },
          { libelle: "ROAS seuil", nature: "grandeur", attendu: auCentime(x.m.roasSeuil), calcul: `${eur(x.m.panier)} ÷ ${eur(x.m.marge)} = ${qte(auCentime(x.m.roasSeuil))}` },
          { libelle: "Ce que laissent les réseaux sociaux", attendu: x.reseaux.margeNette, calcul: `${qte(x.reseaux.commandes)} × ${eur(x.m.marge)} − ${eur(x.reseaux.cout)} = ${eur(x.reseaux.margeNette)}` },
        ];
      },
      explication: (c) => {
        const x = siteDuCabinet(c);
        return [
          `Chaque euro de liens sponsorisés ramène ${eur(auCentime(x.payant.roas!))} de ventes ; chaque euro de réseaux sociaux, ${eur(auCentime(x.reseaux.roas!))}. Les deux dépassent 1, mais il faut ${qte(auCentime(x.m.roasSeuil))} pour que la marge des ventes paie la dépense : les réseaux sociaux sont en dessous, et font perdre ${eur(-x.reseaux.margeNette)}.`,
        ];
      },
    },
    {
      id: "la-source-qui-perd",
      objectifs: [2],
      type: "choix",
      titre: "La source qui perd de l'argent",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: () => "L'agence qui gère les publications sponsorisées écrit : « Votre ROAS est supérieur à 1 sur toutes les sources payantes : chaque euro dépensé vous revient. » Que lui répondez-vous ?",
      options: (c) => {
        const x = siteDuCabinet(c);
        return [
          {
            texte: `Non : il faut ${qte(auCentime(x.m.roasSeuil))}, les réseaux sociaux perdent`,
            juste: true,
            retour: `Oui : un euro de ventes ne laisse que ${pct(x.m.tauxDeMarge)} de marge. Pour payer un euro de dépense, il faut ${eur(auCentime(x.m.roasSeuil))} de ventes ; les réseaux sociaux n'en ramènent que ${eur(auCentime(x.reseaux.roas!))}.`,
          },
          {
            texte: "Oui : un ROAS au-dessus de 1 veut dire que la dépense est payée",
            juste: false,
            retour: `Non : le ROAS compte le chiffre d'affaires, pas la marge. Il faudrait comparer la dépense à ce que laissent les ventes, une fois payés les supports, les repas et les frais de paiement.`,
          },
          {
            texte: "Non : il faut un ROAS de 2 au moins, comme le dit l'usage",
            juste: false,
            retour: `Non : le seuil n'est pas un usage, il se calcule. Ici, panier ÷ marge = ${qte(auCentime(x.m.roasSeuil))}. Un produit à faible marge demanderait bien plus que 2.`,
          },
        ];
      },
    },
    {
      id: "predire-le-budget",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le budget des liens",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      tableau: (c) => tableauDeLaCourbe(siteDuCabinet(c)),
      question: (c) => {
        const x = siteDuCabinet(c);
        return `Avant de calculer, pariez. À ${eur(x.auDernier.budget)}, le double du premier trimestre, les liens ramèneraient encore ${eur(auCentime(x.auDernier.roas))} de ventes par euro, loin au-dessus du seuil de ${qte(auCentime(x.m.roasSeuil))}. Faut-il aller jusque-là ?`;
      },
      options: () => {
        const voir = "Le laboratoire suivant trace la marge créée, le budget et le gain : cherchez où le gain cesse de monter.";
        return [
          { texte: "Pas forcément : tout dépend du clic en plus", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Oui : tant que le ROAS reste au-dessus du seuil", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non : il faut rester au budget du premier trimestre", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-liens",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des liens sponsorisés",
      notions: ["customer_acquisition_cost", "conversion_rate", "contribution_margin"],
      question: () =>
        "Faites varier le budget des liens sponsorisés et la conversion de leurs visiteurs (celle de la page où ils arrivent). Le tableau suit les clics achetés, les commandes attendues, le ROAS, la marge créée, ce que rapporteraient les euros suivants, et le gain des liens (marge créée − budget).",
      leviers: (c) => {
        const x = siteDuCabinet(c);
        const l = LEVIERS_DES_LIENS;
        return [
          { code: "budget", libelle: "Budget des liens du trimestre", unite: "€", min: l.budget.min, max: l.budget.max, pas: l.budget.pas, depart: x.budgetDuTrimestre },
          { code: "conversion", libelle: "Conversion des visiteurs des liens", unite: "%", min: l.conversion.min, max: l.conversion.max, pas: l.conversion.pas, depart: enPct(x.payant.conversion) },
        ];
      },
      lecture: (c, p) => {
        const x = siteDuCabinet(c);
        const l = laboratoireDesLiens(x, p.budget!, p.conversion!);
        const d = laboratoireDesLiens(x, x.budgetDuTrimestre, enPct(x.payant.conversion));
        const pas = qte(LEVIERS_DES_LIENS.budget.pas);
        return [
          { libelle: "Clics achetés", montant: l.clics, reference: d.clics, unite: "clics" },
          { libelle: "Commandes attendues", montant: l.commandes, reference: d.commandes, unite: "commandes" },
          { libelle: "Coût moyen d'un clic", montant: l.coutParClic, reference: d.coutParClic },
          { libelle: "ROAS", montant: l.roas, reference: d.roas, unite: "€ de ventes par euro" },
          { libelle: "Marge créée par les commandes", montant: l.margeCreee, reference: d.margeCreee },
          { libelle: `Ce qu'ont rapporté les ${pas} derniers euros`, montant: l.pasPrecedent, reference: d.pasPrecedent, effet: true },
          { libelle: `Ce que rapporteraient ${pas} € de plus`, montant: l.pasSuivant, reference: d.pasSuivant, effet: true },
          { libelle: "Gain des liens sponsorisés", montant: l.gain, reference: d.gain, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = siteDuCabinet(c);
        const lab = (p: Readonly<Record<string, number>>) => laboratoireDesLiens(x, p.budget!, p.conversion!);
        return {
          levier: "budget",
          courbes: [
            { libelle: "Marge créée par les commandes", valeur: (p) => lab(p).margeCreee },
            { libelle: "Budget des liens", valeur: (p) => p.budget! },
            { libelle: "Gain des liens sponsorisés", valeur: (p) => lab(p).gain },
          ],
        };
      },
      defi: (c) => {
        const x = siteDuCabinet(c);
        const pas = qte(LEVIERS_DES_LIENS.budget.pas);
        return {
          consigne: "Trouvez le budget où le dernier euro ne rapporte plus : celui qui donne aux liens le plus grand gain, à la conversion choisie.",
          atteint: (p) => {
            const l = laboratoireDesLiens(x, p.budget!, p.conversion!);
            return l.gain >= l.meilleurGain - 0.005;
          },
          indice: (p) => {
            const l = laboratoireDesLiens(x, p.budget!, p.conversion!);
            return l.pasSuivant > 0
              ? `${pas} € de plus rapporteraient encore ${eur(l.pasSuivant)} une fois payés : montez le budget.`
              : `Les ${pas} derniers euros ont fait perdre ${eur(-l.pasPrecedent)} : baissez le budget.`;
          },
          solution: { budget: x.meilleur.budget, conversion: enPct(x.payant.conversion) },
        };
      },
      explication: (c, p) => {
        const x = siteDuCabinet(c);
        const l = laboratoireDesLiens(x, p.budget!, p.conversion!);
        const meilleurPour = (conversion: number) => meilleurBudgetDesLiens(conversion / 100).budget;
        return [
          `À ${eur(p.budget!)}, les liens gagnent ${eur(l.gain)} : les derniers euros ont encore rapporté plus qu'ils n'ont coûté, les suivants rapporteraient moins. Le ROAS, ${qte(l.roas)}, ne dit rien de cela : c'est le clic en plus qui décide.`,
          `À ${pct(x.payant.conversion)} de conversion, le meilleur budget est ${eur(meilleurPour(enPct(x.payant.conversion)))} ; à ${pct(CONVERSION_VARIANTE)}, il passe à ${eur(meilleurPour(CONVERSION_VARIANTE * 100))}, et à ${pct(LEVIERS_DES_LIENS.conversion.min / 100)} il tombe à ${eur(meilleurPour(LEVIERS_DES_LIENS.conversion.min))}. Une page qui convertit mieux rend payant un clic qui ne l'était pas.`,
        ];
      },
    },
    {
      id: "le-clic-en-plus",
      objectifs: [3],
      type: "montants",
      titre: "Le coût du clic en plus",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      tableau: (c) => tableauDeLaCourbe(siteDuCabinet(c)),
      question: (c) => {
        const x = siteDuCabinet(c);
        const [a, b] = [x.avantDernier, x.dernier];
        return `Passer de ${eur(a.de)} à ${eur(a.a)}, puis de ${eur(b.de)} à ${eur(b.a)}, coûte chaque fois ${eur(b.budget)}. Calculez ce que coûte le clic en plus de chacun de ces paliers, ce que rapporte un clic (${pct(x.payant.conversion)} × ${eur(x.m.marge)}), puis le gain du dernier palier, commandes en plus × marge − budget en plus (négatif s'il fait perdre).`;
      },
      champs: (c) => {
        const x = siteDuCabinet(c);
        const [a, b] = [x.avantDernier, x.dernier];
        return [
          { libelle: `Coût du clic en plus, de ${eur(a.de)} à ${eur(a.a)}`, attendu: a.coutDuClicEnPlus, calcul: `${eur(a.budget)} ÷ ${qte(a.clics)} = ${eur(a.coutDuClicEnPlus)}` },
          { libelle: `Coût du clic en plus, de ${eur(b.de)} à ${eur(b.a)}`, attendu: b.coutDuClicEnPlus, calcul: `${eur(b.budget)} ÷ ${qte(b.clics)} = ${eur(b.coutDuClicEnPlus)}` },
          { libelle: "Ce que rapporte un clic", attendu: x.valeurDUnClic, calcul: `${pct(x.payant.conversion)} × ${eur(x.m.marge)} = ${eur(x.valeurDUnClic)}` },
          { libelle: "Gain du dernier palier", attendu: b.gain, calcul: `${qte(b.clics)} × ${pct(x.payant.conversion)} × ${eur(x.m.marge)} − ${eur(b.budget)} = ${qte(auCentime(b.commandes))} × ${eur(x.m.marge)} − ${eur(b.budget)} = ${eur(b.gain)}` },
        ];
      },
      explication: (c) => {
        const x = siteDuCabinet(c);
        return [
          `Le clic en plus coûte ${x.supplements.map((s) => eur(s.coutDuClicEnPlus)).join(", puis ")} d'un palier à l'autre, quand le clic moyen ne monte que jusqu'à ${eur(x.auDernier.coutParClic)}. Un clic rapporte ${eur(x.valeurDUnClic)} : le dernier palier le paie ${eur(x.dernier.coutDuClicEnPlus)}, et fait perdre ${eur(-x.dernier.gain)}.`,
          `Le meilleur budget est donc ${eur(x.meilleur.budget)}. Le dernier palier ne paierait que si une commande laissait ${eur(x.margeQuiPaieLeDernier)} de marge, presque tout son panier de ${eur(x.m.panier)}.`,
        ];
      },
    },
    {
      id: "ce-qui-fait-tenir-le-site",
      objectifs: [4],
      type: "tri",
      titre: "Référencement, hébergement, communication unifiée",
      notions: ["conversion_rate", "brand_capital"],
      question: () =>
        "Le tableau de bord du site range les incidents et les chantiers du trimestre. Rangez chacun : il relève du référencement (être trouvé, gratuitement ou en payant), de l'hébergement (que le site réponde, vite et en sécurité) ou de la communication unifiée (téléphone, tchat, visioconférence et messagerie réunis sur un même outil).",
      categories: [
        { code: "referencement", libelle: "Référencement" },
        { code: "hebergement", libelle: "Hébergement" },
        { code: "communication", libelle: "Communication unifiée" },
      ],
      elements: () => [
        { libelle: "La page « Formation au management » sort des dix premiers résultats du moteur de recherche", montant: 0, categorie: "referencement", pourquoi: "C'est le référencement naturel : le titre, le contenu et les liens qui pointent vers la page la font remonter." },
        { libelle: "Le prix du clic sur « formation management d'équipe » monte aux enchères", montant: 0, categorie: "referencement", pourquoi: "C'est le référencement payant : l'annonce s'achète aux enchères sur des mots que d'autres veulent aussi." },
        { libelle: "Le site ne répond plus pendant 2 heures un lundi matin", montant: 0, categorie: "hebergement", pourquoi: "C'est la disponibilité du serveur, que l'hébergeur garantit en pourcentage du temps." },
        { libelle: "Le certificat de sécurité expire : le navigateur affiche une alerte sur la page de paiement", montant: 0, categorie: "hebergement", pourquoi: "Le certificat chiffre les échanges ; sans lui, les visiteurs fuient la page de paiement, et le moteur de recherche déclasse le site." },
        { libelle: "Un client appelle : la conseillère voit sa commande à l'écran et lui envoie le lien de paiement dans le tchat", montant: 0, categorie: "communication", pourquoi: "Le téléphone, le tchat et le dossier client sont réunis : c'est la fonction même de la communication unifiée." },
        { libelle: "La visioconférence d'une session à distance coupe ; la conseillère bascule les participants sur le téléphone", montant: 0, categorie: "communication", pourquoi: "C'est la gestion d'un incident de communication unifiée : un autre canal du même outil prend le relais." },
      ],
      explication: () => [
        "Le référencement fait venir les visiteurs ; l'hébergement les garde sur un site qui répond, vite et en sécurité ; la communication unifiée leur répond quand ils ont une question. Un site qui vend tient aux trois : une seule faiblesse et la conversion baisse, quelle que soit la source.",
      ],
      relance: "Demandez-vous ce qui est en jeu : être trouvé, que le site réponde, ou parler au client ?",
    },
    {
      id: "l-hebergement",
      objectifs: [4],
      type: "montants",
      titre: "L'hébergement et ses heures de panne",
      notions: ["contribution_margin", "conversion_rate"],
      question: (c) => {
        const x = siteDuCabinet(c);
        const [mu, de] = x.hebergement.offres;
        return `Le site est sur un serveur mutualisé, ${eur(mu!.prixParMois)} par mois, disponible ${pct(mu!.disponibilite)} du temps ; le prestataire propose un serveur dédié, ${eur(de!.prixParMois)} par mois, disponible ${pct(de!.disponibilite)}. Le trimestre compte ${qte(x.hebergement.heures)} heures. Calculez les heures de panne de chaque offre, la marge que le site fait en une heure (${qte(x.t.commandes)} commandes × ${eur(x.m.marge)} ÷ ${qte(x.hebergement.heures)}), puis le coût de chaque offre sur le trimestre, prix et marge perdue compris.`;
      },
      champs: (c) => {
        const x = siteDuCabinet(c);
        const h = x.hebergement;
        const [mu, de] = h.offres;
        return [
          { libelle: "Heures de panne, serveur mutualisé", nature: "grandeur", attendu: mu!.indisponibilite, calcul: `${qte(h.heures)} × (1 − ${pct(mu!.disponibilite)}) = ${qte(mu!.indisponibilite)} heures` },
          { libelle: "Heures de panne, serveur dédié", nature: "grandeur", attendu: de!.indisponibilite, calcul: `${qte(h.heures)} × (1 − ${pct(de!.disponibilite)}) = ${qte(de!.indisponibilite)} heure` },
          { libelle: "Marge du site en une heure", attendu: h.margeParHeure, calcul: `${qte(x.t.commandes)} × ${eur(x.m.marge)} ÷ ${qte(h.heures)} = ${eur(h.margeParHeure)}` },
          // L'autre chemin : la marge d'une heure gardée avec tous ses chiffres, l'arrondi à la fin.
          { libelle: "Coût du trimestre, serveur mutualisé", ...deuxChemins(mu!.total, 3 * mu!.prixParMois + (mu!.indisponibilite * x.t.commandes * x.m.marge) / h.heures), calcul: `3 × ${eur(mu!.prixParMois)} + ${qte(mu!.indisponibilite)} × ${eur(h.margeParHeure)} = ${eur(mu!.prix)} + ${eur(mu!.margePerdue)} = ${eur(mu!.total)}` },
          { libelle: "Coût du trimestre, serveur dédié", ...deuxChemins(de!.total, 3 * de!.prixParMois + (de!.indisponibilite * x.t.commandes * x.m.marge) / h.heures), calcul: `3 × ${eur(de!.prixParMois)} + ${qte(de!.indisponibilite)} × ${eur(h.margeParHeure)} = ${eur(de!.prix)} + ${eur(de!.margePerdue)} = ${eur(de!.total)}` },
        ];
      },
      explication: (c) => {
        const x = siteDuCabinet(c);
        const h = x.hebergement;
        return [
          `Une disponibilité de ${pct(h.offres[0]!.disponibilite)} paraît parfaite ; elle laisse pourtant ${qte(h.offres[0]!.indisponibilite)} heures de panne par trimestre. Le serveur dédié coûte plus cher, mais perd moins de commandes : sur le trimestre, il revient ${eur(h.ecart)} moins cher.`,
          "L'écart est faible : ce qui décide, ce sont les pannes qui tombent aux heures de pointe, le jour où une campagne amène du monde, et la sécurité des paiements, qu'un serveur partagé protège moins bien.",
        ];
      },
    },
    {
      id: "qui-peut-se-retracter",
      objectifs: [4],
      type: "tri",
      titre: "Qui peut se rétracter ?",
      notions: ["conversion_rate"],
      question: () =>
        `Un particulier qui achète en ligne peut se rétracter dans les ${qte(RETRACTATION.delaiEnJours)} jours, sans motif ; un professionnel qui achète pour son entreprise ne le peut pas. Rangez chaque commande du trimestre.`,
      categories: [
        { code: "oui", libelle: "Rétractation possible" },
        { code: "non", libelle: "Pas de rétractation" },
      ],
      elements: () => [
        { libelle: "Une demandeuse d'emploi achète une place pour se former à ses frais", montant: 0, categorie: "oui", pourquoi: "C'est une consommatrice qui achète à distance : le Code de la consommation lui ouvre le délai de rétractation." },
        { libelle: "Un salarié achète une place à son nom, avec sa carte personnelle", montant: 0, categorie: "oui", pourquoi: "Il achète pour lui, hors de son activité professionnelle : il est consommateur, même si la formation sert son métier." },
        { libelle: "Une PME achète 3 places pour ses commerciaux", montant: 0, categorie: "non", pourquoi: "Elle achète pour son activité : le droit de rétractation de la vente à distance ne la couvre pas." },
        { libelle: "Le service des ressources humaines d'un hôpital commande 2 places en ligne", montant: 0, categorie: "non", pourquoi: "C'est un acheteur professionnel : ce sont les conditions générales de vente du cabinet qui disent s'il peut annuler." },
      ],
      explication: () => [
        "Le site doit informer le particulier de son droit avant la commande, dans les conditions générales de vente, et lui donner un formulaire de rétractation. Faute d'information, le délai s'allonge de 12 mois. Pour une formation qu'une personne paie elle-même, le Code du travail interdit en plus de lui demander un paiement avant la fin du délai : le site doit le prévoir.",
      ],
      relance: "Demandez-vous pour qui la place est achetée : pour soi, ou pour une entreprise ?",
    },
    {
      id: "la-retractation",
      objectifs: [4],
      type: "montants",
      titre: "Ce que coûtent les rétractations",
      notions: ["conversion_rate", "revenue"],
      question: (c) => {
        const x = siteDuCabinet(c);
        const p = x.m.acheteurs[0]!;
        return `Au premier trimestre, ${pct(RETRACTATION.partDesParticuliers)} des ${qte(p.commandes)} commandes de particuliers ont été rétractées. Calculez les commandes rétractées, le chiffre d'affaires perdu, la marge perdue (la place rendue ne coûte ni supports ni repas, mais ses frais de paiement restent payés), puis la conversion nette du site, en %.`;
      },
      champs: (c) => {
        const x = siteDuCabinet(c);
        const r = x.retractation;
        const p = x.m.acheteurs[0]!;
        return [
          { libelle: "Commandes rétractées", nature: "quantite", attendu: r.commandes, calcul: `${qte(p.commandes)} × ${pct(r.part)} = ${qte(r.commandes)}` },
          { libelle: "Chiffre d'affaires perdu", attendu: r.chiffreDAffairesPerdu, calcul: `${qte(r.commandes)} × ${eur(p.ht)} = ${eur(r.chiffreDAffairesPerdu)}` },
          { libelle: "Marge perdue", attendu: r.margePerdue, calcul: `${qte(r.commandes)} × (${eur(x.m.prixHt)} − ${eur(x.m.coutVariable)}) = ${eur(r.margePerdue)}` },
          { libelle: "Conversion nette (%)", attendu: enPct(r.conversionNette), calcul: `(${qte(x.t.commandes)} − ${qte(r.commandes)}) ÷ ${qte(x.t.visites)} = ${pct(r.conversionNette)}` },
        ];
      },
      explication: (c) => {
        const x = siteDuCabinet(c);
        const r = x.retractation;
        return [
          `Les rétractations ôtent ${eur(r.chiffreDAffairesPerdu)} de ventes et ${eur(r.margePerdue)} de marge : la conversion qui compte est la conversion nette, ${pct(r.conversionNette)}, pas ${pct(x.t.conversion)}. Un tableau de bord du site suit les deux.`,
          "Le droit n'empêche pas de vendre aux particuliers ; il change le calcul. Une session qui demande un minimum d'inscrits doit compter les places rendues avant d'être confirmée.",
        ];
      },
    },
    {
      id: "le-prochain-euro",
      objectifs: [3],
      type: "choix",
      titre: "Où mettre le prochain euro",
      notions: ["customer_acquisition_cost", "conversion_rate", "contribution_margin"],
      question: (c) => {
        const x = siteDuCabinet(c);
        return `Le directeur peut ajouter jusqu'à ${eur(x.auDernier.budget - x.budgetDuTrimestre)} au budget digital du trimestre suivant. Que lui proposez-vous ?`;
      },
      options: (c) => {
        const x = siteDuCabinet(c);
        return [
          {
            texte: `Monter les liens à ${eur(x.meilleur.budget)}, pas au-delà`,
            juste: true,
            retour: `Oui : jusqu'à ${eur(x.meilleur.budget)}, le clic en plus coûte ${eur(x.avantDernier.coutDuClicEnPlus)} et rapporte ${eur(x.valeurDUnClic)} ; au-delà, il coûte ${eur(x.dernier.coutDuClicEnPlus)}. Le reste du budget irait mieux à la conversion de la page, qui rend chaque clic plus rentable.`,
          },
          {
            texte: `Doubler les liens : leur ROAS resterait de ${qte(auCentime(x.auDernier.roas))}`,
            juste: false,
            retour: `Non : c'est une moyenne. Les derniers clics coûtent ${eur(x.dernier.coutDuClicEnPlus)} pour ${eur(x.valeurDUnClic)} de marge : le dernier palier fait perdre ${eur(-x.dernier.gain)}.`,
          },
          {
            texte: "Les réseaux sociaux sponsorisés : leur visite est moins chère",
            juste: false,
            retour: `Non : la visite y coûte ${eur(x.reseaux.coutParVisite)}, mais la commande ${eur(x.reseaux.coutParCommande)}, et leur ROAS, ${qte(auCentime(x.reseaux.roas!))}, est sous le seuil.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["conversion_rate", "average_basket", "customer_acquisition_cost", "contribution_margin"],
      tableau: (c) => {
        const x = siteDuCabinet(c);
        return {
          titre: "Les liens sponsorisés, palier par palier",
          colonnes: x.paliers.slice(1).map((p) => eur(p.budget)),
          lignes: [
            { libelle: "Clics achetés", valeurs: x.paliers.slice(1).map((p) => qte(p.clics)) },
            { libelle: "ROAS", valeurs: x.paliers.slice(1).map((p) => qte(auCentime(p.roas))) },
            { libelle: "Coût du clic en plus", valeurs: x.supplements.map((s) => eur(s.coutDuClicEnPlus)) },
            { libelle: "Gain des liens", valeurs: x.paliers.slice(1).map((p) => eur(p.gain)) },
          ],
        };
      },
      texte: (c) => {
        const x = siteDuCabinet(c);
        return [
          `Le chiffre d'affaires d'un site est le produit de ses visites, de son taux de conversion et de son panier : ${qte(x.t.visites)} × ${pct(x.t.conversion)} × ${eur(x.m.panier)} = ${eur(x.t.chiffreDAffaires)} chez ${x.f.entreprise}. Une source se juge sur ce que coûte une commande, pas une visite, et une dépense publicitaire sur son ROAS face au seuil, panier ÷ marge, qui n'est pas 1.`,
          `Le budget des liens sponsorisés se fixe là où le clic en plus cesse de rapporter ce qu'il coûte, ${eur(x.meilleur.budget)}, et non sur le ROAS moyen. L'hébergement, la communication unifiée et la rétractation des particuliers se chiffrent eux aussi : en heures de panne, en commandes perdues, en conversion nette.`,
          "Au niveau de l'examen, vous savez calculer un taux de conversion, un panier moyen, un coût par commande et un ROAS, retrouver à rebours ce qu'il faut pour un objectif, et fixer un budget sur le coût marginal d'un clic.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Chiffre d'affaires = visites × taux de conversion × panier moyen. ROAS = chiffre d'affaires ÷ dépenses ; ROAS seuil = panier ÷ marge d'une commande. Un palier de liens paie tant que le clic en plus coûte moins que ce que rapporte un clic.",
    },
  ],
};
