import { arrondi2 as auCentime, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  CHALLENGE_DE_L_ECHARPE,
  MINIMUM_DE_LA_BRANCHE_35_HEURES,
  OBJECTIF_PAR_HEURE_DE_VENTE,
  PRIME_D_EQUIPE_PAR_HEURE,
  TAUX_DE_COMMISSION,
  TAUX_SALARIAL,
  VENDEUR_QUI_DECROCHE,
  bulletinSimplifie,
  challenge,
  fixesFaceAuxMinima,
  remunerationVariable,
  tableauDeBordDesVendeurs,
} from "../monde/equipe-de-la-boutique";
import { SMIC_HORAIRE_BRUT } from "../monde/ressources-humaines-de-nova";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "./equipe-et-planning";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : RÉMUNÉRER ET STIMULER LES VENDEURS (BTS MCO, bloc 4, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts, son équipe)
 * et le module de son équipe (monde/equipe-de-la-boutique.ts : les ventes de janvier vendeur par
 * vendeur, l'objectif de chacun, la commission et la prime d'équipe proposées, le bulletin simplifié,
 * le challenge de l'écharpe). Une évolution du moteur ne change rien ici.
 *
 * L'objet : le tableau de bord vendeur par vendeur (transformation, panier, indice de vente, objectif)
 * et l'analyse d'un vendeur qui décroche ; puis la rémunération (un fixe, une commission au-delà de
 * l'objectif, une prime d'équipe), son coût, le bulletin et les minima ; enfin la stimulation, un
 * challenge de vente qui doit se payer par la marge qu'il apporte.
 *
 * Le piège central : une commission individuelle récompense ceux qui vendent déjà, et ne donne rien à
 * celui qui décroche ; une dotation de challenge est du salaire, qui se paie avec ses cotisations.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, les-indicateurs-du-vendeur, l-objectif (la formule est dans la question) ;
 *   · l'expérience avant la formule : predire-la-commission puis le-laboratoire-de-la-remuneration
 *     (le taux de commission et la prime d'équipe, le coût et ce que touche chacun) ; le-seuil-du-
 *     challenge, un curseur, avant le-challenge ;
 *   · autonome : a-transformation-egale, la-commission-et-la-prime, le-bulletin, le-challenge ;
 *   · expert : le-diagnostic, la-remediation, les-minima, les-regles-du-challenge, prime-individuelle-
 *     ou-collective ; puis la synthèse.
 *
 * Le droit cité : le SMIC horaire et le minimum de la branche, au prorata des heures ; l'égalité de
 * rémunération entre les femmes et les hommes pour un même travail ; la dotation d'un challenge, un
 * élément de salaire soumis à cotisations, versée selon des règles écrites et connues de tous.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les taux se donnent à deux décimales (au dixième, avant) ;
 * l'indice de vente est une grandeur au centième ; les chiffres d'affaires à transformation ou à
 * panier égal, au centime, sur les taux et les paniers arrondis (à l'euro, à deux euros près, avant).
 */

const qte = nombreAuCentieme;
/** « de Malik », « d'Inès » : l'élision devant un prénom à voyelle. */
const dePrenom = (p: string) => (/^[AEIOUYÉÈÊ]/.test(p) ? `d'${p}` : `de ${p}`);
const h = (x: number) => `${qte(x)} h`;

const POURQUOI =
  "ce chapitre se joue à la boutique du cours, MAILLE & CO : ses vendeurs, leurs ventes et leurs salaires sont ceux des autres chapitres du parcours.";

/** Le plancher du variable et l'enveloppe du laboratoire (hypothèses du défi) : chacun au moins 50 € bruts, le tout au plus 1 000 € chargés. */
export const VARIABLE_MINIMUM = 50;
export const ENVELOPPE_DU_VARIABLE = 1_000;
export const LEVIERS_DE_LA_REMUNERATION = { commission: { min: 0, max: 10, pas: 1 }, prime: { min: 0, max: 6, pas: 1 } } as const;
export const ECHARPES_DU_CURSEUR = { min: 0, max: 60 } as const;
/** Une position qui relève le défi du laboratoire : 2 % de commission, 3 € de prime d'équipe par heure. */
export const SOLUTION_DE_LA_REMUNERATION = { commission: 2, prime: 3 } as const;

/** Tout ce que le chapitre et son cas lisent, calculé une fois du cas. */
export function remunererEtStimuler(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = tableauDeBordDesVendeurs(f);
  const m = t.de(VENDEUR_QUI_DECROCHE);
  const e = t.equipe;
  const r = remunerationVariable(f);
  const hugo = bulletinSimplifie(f, "vendeur", r.de("vendeur").variable);
  const ch = challenge(f, CHALLENGE_DE_L_ECHARPE, CHALLENGE_DE_L_ECHARPE.objectif);
  return {
    f,
    t,
    m,
    e,
    r,
    hugo,
    ch,
    // Le vendeur qui décroche, à la transformation de l'équipe, puis au panier de l'équipe.
    // Au centime, sur la transformation à deux décimales et les paniers au centime, comme sur la copie.
    caATransformationEgale: auCentime(((m.entrees * auCentime(e.transformation * 100)) / 100) * auCentime(m.panier)),
    caAPanierEgal: auCentime(m.passages * auCentime(e.panier)),
    minima: fixesFaceAuxMinima(f),
  };
}

export type RemunererEtStimuler = ReturnType<typeof remunererEtStimuler>;

/** La rémunération variable pour une position du laboratoire : le taux de commission en %, la prime d'équipe en € par heure. */
export const variableAuLaboratoire = (x: RemunererEtStimuler, p: Readonly<Record<string, number>>) => remunerationVariable(x.f, p.commission! / 100, p.prime!);

/** Les ventes de janvier, vendeur par vendeur : le document de départ. */
export function tableauDesVendeurs(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = remunererEtStimuler(c);
  return {
    titre: `${x.f.entreprise} · les ventes en caisse de janvier, vendeur par vendeur`,
    colonnes: ["Heures de vente", "Entrées", "Passages", "Articles", "CA HT"],
    lignes: x.t.vendeurs.map((v) => ({ libelle: `${v.prenom}, ${v.poste.toLowerCase()}`, valeurs: [h(v.heuresDeVente), qte(v.entrees), qte(v.passages), qte(v.articles), eur(v.chiffreDAffaires)] })),
  };
}

/** Le tableau de bord des vendeurs, une fois calculé : la synthèse et le cas le montrent. */
export function tableauDeBordCalcule(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = remunererEtStimuler(c);
  return {
    titre: `${x.f.entreprise} · le tableau de bord des vendeurs, janvier`,
    colonnes: ["Transformation", "Panier", "Indice", "Objectif atteint"],
    lignes: [...x.t.vendeurs, { prenom: "L'équipe", ...x.e }].map((v) => ({
      libelle: v.prenom,
      valeurs: [pct(auCentime(v.transformation * 100)), eur(auCentime(v.panier)), qte(auCentime(v.indiceDeVente)), pct(auCentime(v.realisation * 100))],
    })),
  };
}

export const REMUNERER_ET_STIMULER_LES_VENDEURS: Chapitre = {
  code: "remunerer-et-stimuler-les-vendeurs",
  parcours: "mco",
  palier: 4,
  blocs: ["BTS MCO Bloc 4 · Manager l'équipe commerciale"],
  titre: "Rémunérer et stimuler les vendeurs",
  accroche:
    "Le tableau de bord vendeur par vendeur, et celui qui décroche. Puis ce que coûtent une commission et une prime d'équipe, qui elles récompensent, et un challenge de vente qui doit se payer par sa marge.",
  objectifs: [
    "Construire le tableau de bord des vendeurs et mesurer les écarts à l'objectif",
    "Analyser la performance d'un vendeur et proposer une remédiation",
    "Calculer une rémunération variable, commission et prime d'équipe, et son coût",
    "Lire un bulletin de paie simplifié et vérifier les minima légaux",
    "Chiffrer un challenge de vente face aux ventes qu'il doit apporter",
  ],
  libre: false,
  prerequis: ["equipe-et-planning", "indicateurs-du-point-de-vente"],
  ensuite: ["le-climat-de-l-equipe"],
  entreprises: { codes: ENTREPRISES_DU_POINT_DE_VENTE, pourquoi: POURQUOI },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Six vendeurs, un mois",
      notions: ["dashboard", "conversion_rate"],
      tableau: tableauDesVendeurs,
      texte: (c) => {
        const x = remunererEtStimuler(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. La caisse enregistre qui conclut chaque vente : le tableau refait les ${qte(x.e.passages)} passages en caisse de janvier, vendeur par vendeur.`,
          `L'objectif de chacun suit ses heures de vente : ${eur(OBJECTIF_PAR_HEURE_DE_VENTE)} hors taxes par heure, soit ses heures de la semaine × 52 ÷ 12 × ${eur(OBJECTIF_PAR_HEURE_DE_VENTE)}. Aujourd'hui, chacun touche le fixe de son contrat, rien de plus.`,
          "La direction veut récompenser les ventes. Avant de payer qui que ce soit, le manager lit les performances : qui atteint son objectif, qui décroche, et pourquoi.",
        ];
      },
      repere: () => "Taux de transformation = passages ÷ entrées. Panier moyen = chiffre d'affaires ÷ passages. Indice de vente = articles ÷ passages. Réalisation = chiffre d'affaires ÷ objectif.",
    },
    {
      id: "les-indicateurs-du-vendeur",
      objectifs: [0],
      type: "montants",
      titre: "Les indicateurs d'un vendeur",
      notions: ["conversion_rate", "average_basket", "dashboard"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        return `${x.m.prenom}, le vendeur à temps partiel, a accueilli ${qte(x.m.entrees)} entrées et conclu ${qte(x.m.passages)} passages, pour ${qte(x.m.articles)} articles et ${eur(x.m.chiffreDAffaires)}. Calculez son taux de transformation (à deux décimales), son panier moyen (au centime) et son indice de vente (au centième).`;
      },
      champs: (c) => {
        const x = remunererEtStimuler(c);
        const m = x.m;
        return [
          { libelle: "Taux de transformation (%)", attendu: auCentime(m.transformation * 100), calcul: `${qte(m.passages)} ÷ ${qte(m.entrees)} × 100 = ${pct(auCentime(m.transformation * 100))}` },
          { libelle: "Panier moyen", attendu: auCentime(m.panier), calcul: `${eur(m.chiffreDAffaires)} ÷ ${qte(m.passages)} = ${eur(auCentime(m.panier))}` },
          { libelle: "Indice de vente", nature: "grandeur", attendu: auCentime(m.indiceDeVente), calcul: `${qte(m.articles)} ÷ ${qte(m.passages)} = ${qte(auCentime(m.indiceDeVente))}` },
        ];
      },
      explication: (c) => {
        const x = remunererEtStimuler(c);
        return [
          `L'équipe transforme ${pct(auCentime(x.e.transformation * 100))}, pour un panier de ${eur(auCentime(x.e.panier))} et ${qte(auCentime(x.e.indiceDeVente))} article par passage. ${x.m.prenom} est en dessous sur les trois : il conclut moins, et vend moins à chaque client.`,
        ];
      },
    },
    {
      id: "l-objectif",
      objectifs: [0],
      type: "montants",
      titre: "Face à l'objectif",
      notions: ["dashboard"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        return `${x.m.prenom} vend ${h(x.m.heuresDeVente)} par semaine ; l'équipe ${h(x.e.heuresDeVente)}. Calculez l'objectif du mois de ${x.m.prenom} (${h(x.m.heuresDeVente)} × 52 ÷ 12 × ${eur(OBJECTIF_PAR_HEURE_DE_VENTE)}), son taux de réalisation (à deux décimales), puis l'objectif de l'équipe et son taux de réalisation.`;
      },
      champs: (c) => {
        const x = remunererEtStimuler(c);
        return [
          { libelle: `Objectif de ${x.m.prenom}`, attendu: x.m.objectif, calcul: `${h(x.m.heuresDeVente)} × 52 ÷ 12 × ${eur(OBJECTIF_PAR_HEURE_DE_VENTE)} = ${eur(x.m.objectif)}` },
          { libelle: `Réalisation de ${x.m.prenom} (%)`, attendu: auCentime(x.m.realisation * 100), calcul: `${eur(x.m.chiffreDAffaires)} ÷ ${eur(x.m.objectif)} × 100 = ${pct(auCentime(x.m.realisation * 100))}` },
          { libelle: "Objectif de l'équipe", attendu: x.e.objectif, calcul: `${h(x.e.heuresDeVente)} × 52 ÷ 12 × ${eur(OBJECTIF_PAR_HEURE_DE_VENTE)} = ${eur(x.e.objectif)}` },
          { libelle: "Réalisation de l'équipe (%)", attendu: auCentime(x.e.realisation * 100), calcul: `${eur(x.e.chiffreDAffaires)} ÷ ${eur(x.e.objectif)} × 100 = ${pct(auCentime(x.e.realisation * 100))}` },
        ];
      },
      explication: (c) => {
        const x = remunererEtStimuler(c);
        return [
          `L'équipe dépasse son objectif de ${eur(x.e.ecart)}, alors que ${x.m.prenom} manque le sien de ${eur(-x.m.ecart)}. Le total cache l'écart : c'est le tableau de bord vendeur par vendeur qui le montre.`,
        ];
      },
    },
    {
      id: "a-transformation-egale",
      objectifs: [1],
      type: "montants",
      titre: "D'où vient l'écart",
      notions: ["conversion_rate", "average_basket"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        return `Sans formule cette fois. Quel chiffre d'affaires ${x.m.prenom} aurait-il fait s'il transformait comme l'équipe, avec son propre panier (à l'euro) ? Et s'il gardait ses passages mais avec le panier de l'équipe (à l'euro) ?`;
      },
      champs: (c) => {
        const x = remunererEtStimuler(c);
        return [
          { libelle: "À la transformation de l'équipe", attendu: x.caATransformationEgale, calcul: `${qte(x.m.entrees)} entrées × ${pct(auCentime(x.e.transformation * 100))} × ${eur(auCentime(x.m.panier))} = ${eur(x.caATransformationEgale)}` },
          { libelle: "Au panier de l'équipe", attendu: x.caAPanierEgal, calcul: `${qte(x.m.passages)} passages × ${eur(auCentime(x.e.panier))} = ${eur(x.caAPanierEgal)}` },
        ];
      },
      explication: (c) => {
        const x = remunererEtStimuler(c);
        return [
          `À la transformation de l'équipe, ${x.m.prenom} gagnerait ${eur(x.caATransformationEgale - x.m.chiffreDAffaires)} de ventes ; au panier de l'équipe, ${eur(x.caAPanierEgal - x.m.chiffreDAffaires)}. Son premier écart est dans la conclusion de la vente, pas dans le montant du ticket.`,
        ];
      },
    },
    {
      id: "le-diagnostic",
      objectifs: [1],
      type: "choix",
      titre: "Le diagnostic",
      notions: ["conversion_rate", "dashboard"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        return `${x.m.prenom} accueille autant de clients par heure que les autres, mais en conclut moins. Que conclut le manager ?`;
      },
      options: (c) => {
        const x = remunererEtStimuler(c);
        return [
          { texte: "La conclusion de la vente est à travailler d'abord", juste: x.caATransformationEgale > x.caAPanierEgal, retour: "Oui : à transformation égale, l'écart se réduit le plus. Les clients entrent, voient le vendeur, et repartent sans acheter : l'accueil, la découverte du besoin et la conclusion sont à reprendre." },
          { texte: "Le panier est seul en cause : il faut vendre plus cher", juste: false, retour: "Non : le panier compte, mais moins que la transformation. Pousser le mérinos sans conclure ne servirait à rien." },
          { texte: "Il a les mauvais créneaux : il ne peut rien y faire", juste: false, retour: "Non : ses entrées par heure sont celles de l'équipe. Ses clients sont là ; ce sont les ventes qui manquent." },
        ];
      },
    },
    {
      id: "la-remediation",
      objectifs: [1],
      type: "choix",
      titre: "La remédiation",
      notions: ["training", "pay_and_motivation"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        return `Quelle action le manager propose-t-il à ${x.m.prenom} ?`;
      },
      options: (c) => {
        const x = remunererEtStimuler(c);
        const hugo = x.t.de("vendeur");
        return [
          {
            texte: "Un entretien, du binôme et un objectif suivi",
            juste: true,
            retour: `Oui : l'entretien cherche la cause avec lui (une difficulté, un manque de méthode, un souci personnel) ; quelques samedis en binôme avec ${hugo.prenom}, qui transforme ${pct(auCentime(hugo.transformation * 100))}, montrent la méthode ; un objectif chiffré, daté et revu chaque semaine dit si cela marche.`,
          },
          { texte: "Un avertissement écrit, pour insuffisance de résultats", juste: false, retour: "Non : un objectif manqué un mois n'est pas une faute. Sanctionner avant de comprendre ferait perdre un vendeur, et la confiance de l'équipe." },
          { texte: "Rien : l'équipe dépasse son objectif, cela suffit", juste: false, retour: `Non : ${x.m.prenom} manque ${eur(-x.m.ecart)} chaque mois. Le laisser décrocher, c'est perdre ces ventes, et le perdre lui.` },
        ];
      },
    },
    {
      id: "le-systeme-de-remuneration",
      type: "lecture",
      titre: "Les composantes d'une rémunération",
      notions: ["pay_and_motivation", "payroll"],
      texte: (c) => {
        const x = remunererEtStimuler(c);
        return [
          `Chez ${x.f.entreprise} comme ailleurs, une rémunération de vendeur assemble un fixe, le salaire du contrat, et un variable : une commission sur les ventes, une prime individuelle sur un objectif, une prime d'équipe. S'y ajoutent les avantages (une remise du personnel, un avantage en nature) et, dans les entreprises qui en ont, l'intéressement et la participation.`,
          `Le droit encadre le tout. Le fixe ne descend pas sous le SMIC (${eur(SMIC_HORAIRE_BRUT)} bruts de l'heure) ni sous le minimum de la branche. Une femme et un homme qui font le même travail sont payés pareil, et chaque mois, le salarié reçoit un bulletin de paie.`,
          `La direction propose une commission de ${pct(TAUX_DE_COMMISSION * 100)} du chiffre d'affaires au-delà de l'objectif de chacun, et une prime d'équipe de ${eur(PRIME_D_EQUIPE_PAR_HEURE)} par heure de vente hebdomadaire, versée à tous si l'équipe dépasse son objectif. Le variable stimule ; le fixe sécurise.`,
        ];
      },
      repere: () => "Commission = taux × (chiffre d'affaires − objectif), si l'écart est positif. Prime d'équipe = prime par heure × heures de vente de la semaine. Coût du variable = variable brut × (1 + taux patronal).",
    },
    {
      id: "predire-la-commission",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la commission",
      notions: ["pay_and_motivation"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        return `Avant de calculer, pariez. Avec la seule commission de ${pct(TAUX_DE_COMMISSION * 100)} au-delà de l'objectif, ${x.m.prenom} toucherait…`;
      },
      options: (c) => {
        const x = remunererEtStimuler(c);
        const voir = "Le laboratoire montre ce que chacun touche, commission par commission.";
        const rien = x.r.de(VENDEUR_QUI_DECROCHE).commission === 0;
        return [
          { texte: "Rien : il est sous son objectif", juste: rien, retour: `Bon pari. ${voir}` },
          { texte: "Un peu : la commission porte sur tout son chiffre", juste: false, retour: `Pari à vérifier : la commission ne porte que sur ce qui dépasse l'objectif. ${voir}` },
          { texte: "Autant que les autres : la commission est collective", juste: false, retour: `Pari à vérifier : une commission est individuelle. ${voir}` },
        ];
      },
    },
    {
      id: "la-commission-et-la-prime",
      objectifs: [2],
      type: "montants",
      titre: "La commission et la prime",
      notions: ["pay_and_motivation", "payroll"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        const jade = x.t.de("etudiante");
        return `Sans formule cette fois. Calculez la commission de ${jade.prenom}, l'étudiante (${eur(jade.chiffreDAffaires)} pour un objectif de ${eur(jade.objectif)}), la prime d'équipe de ${x.m.prenom} (${h(x.m.heuresDeVente)} de vente par semaine), puis le variable brut de toute l'équipe et son coût chargé.`;
      },
      champs: (c) => {
        const x = remunererEtStimuler(c);
        const jade = x.t.de("etudiante");
        return [
          { libelle: `Commission de ${jade.prenom}`, attendu: x.r.de("etudiante").commission, calcul: `(${eur(jade.chiffreDAffaires)} − ${eur(jade.objectif)}) × ${pct(TAUX_DE_COMMISSION * 100)} = ${eur(x.r.de("etudiante").commission)}` },
          { libelle: `Prime d'équipe de ${x.m.prenom}`, attendu: x.r.de(VENDEUR_QUI_DECROCHE).prime, calcul: `${h(x.m.heuresDeVente)} × ${eur(PRIME_D_EQUIPE_PAR_HEURE)} = ${eur(x.r.de(VENDEUR_QUI_DECROCHE).prime)}` },
          { libelle: "Variable brut de l'équipe", attendu: x.r.brut, calcul: `${eur(x.r.commissions)} de commissions + ${eur(x.r.primes)} de primes = ${eur(x.r.brut)}` },
          { libelle: "Coût chargé du variable", attendu: x.r.cout, calcul: `${eur(x.r.brut)} × ${qte(1 + x.f.tauxPatronal)} = ${eur(x.r.cout)}` },
        ];
      },
      explication: (c) => {
        const x = remunererEtStimuler(c);
        const jade = x.r.de("etudiante");
        return [
          `${jade.prenom}, ${h(x.t.de("etudiante").heuresDeVente)} par semaine, touche ${eur(jade.variable)} ; ${x.m.prenom} ne touche que la prime d'équipe, ${eur(x.r.de(VENDEUR_QUI_DECROCHE).variable)}, sans commission. Le variable coûte ${eur(x.r.cout)} par mois à la boutique, cotisations comprises.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-remuneration",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de la rémunération",
      notions: ["pay_and_motivation", "payroll"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        return `La proposition de la direction est au départ : ${pct(TAUX_DE_COMMISSION * 100)} de commission, ${eur(PRIME_D_EQUIPE_PAR_HEURE)} de prime d'équipe par heure. Faites varier les deux : le tableau suit ce que touche chaque vendeur et ce que coûte le variable. La direction ne veut pas dépasser ${eur(ENVELOPPE_DU_VARIABLE)} chargés par mois pour les ${qte(x.t.vendeurs.length)} vendeurs.`;
      },
      leviers: () => [
        { code: "commission", libelle: "Commission au-delà de l'objectif", unite: "%", ...LEVIERS_DE_LA_REMUNERATION.commission, depart: TAUX_DE_COMMISSION * 100 },
        { code: "prime", libelle: "Prime d'équipe par heure de vente", unite: "€", ...LEVIERS_DE_LA_REMUNERATION.prime, depart: PRIME_D_EQUIPE_PAR_HEURE },
      ],
      lecture: (c, p) => {
        const x = remunererEtStimuler(c);
        const r = variableAuLaboratoire(x, p);
        const d = x.r;
        return [
          ...r.vendeurs.map((v) => ({ libelle: `Variable ${dePrenom(v.prenom)}`, montant: v.variable, reference: d.de(v.code).variable })),
          { libelle: "Variable brut de l'équipe", montant: r.brut, reference: d.brut },
          { libelle: "Coût chargé du variable", montant: r.cout, reference: d.cout, fort: true },
        ];
      },
      graphique: (c) => {
        const x = remunererEtStimuler(c);
        return {
          levier: "commission",
          courbes: [
            { libelle: "Coût chargé du variable", valeur: (p) => variableAuLaboratoire(x, p).cout },
            { libelle: `Variable de ${x.m.prenom}`, valeur: (p) => variableAuLaboratoire(x, p).de(VENDEUR_QUI_DECROCHE).variable },
            { libelle: "Le plus petit variable", valeur: (p) => variableAuLaboratoire(x, p).plusPetit },
          ],
        };
      },
      defi: (c) => {
        const x = remunererEtStimuler(c);
        const lire = (p: Readonly<Record<string, number>>) => variableAuLaboratoire(x, p);
        return {
          consigne: `Que chaque vendeur touche au moins ${eur(VARIABLE_MINIMUM)} bruts, sans dépasser ${eur(ENVELOPPE_DU_VARIABLE)} chargés.`,
          atteint: (p) => lire(p).plusPetit >= VARIABLE_MINIMUM && lire(p).cout <= ENVELOPPE_DU_VARIABLE,
          indice: (p) => {
            const r = lire(p);
            if (r.cout > ENVELOPPE_DU_VARIABLE) return `Le variable coûte ${eur(r.cout)} chargés : baissez la commission, la part qui va à ceux qui dépassent déjà.`;
            const bas = r.vendeurs.reduce((a, b) => (b.variable < a.variable ? b : a));
            return `${bas.prenom} ne touche que ${eur(bas.variable)}. La prime d'équipe va à tous, au prorata des heures ; la commission, à ceux qui dépassent.`;
          },
          solution: { ...SOLUTION_DE_LA_REMUNERATION },
        };
      },
      explication: (c, p) => {
        const x = remunererEtStimuler(c);
        const r = variableAuLaboratoire(x, p);
        return [
          `À ${pct(p.commission!)} de commission et ${eur(p.prime!)} par heure, chacun touche au moins ${eur(r.plusPetit)} pour ${eur(r.cout)} chargés. La proposition de départ dépassait l'enveloppe de ${eur(auCentime(x.r.cout - ENVELOPPE_DU_VARIABLE))} : la commission y coûtait plus que la prime.`,
          `${x.m.prenom}, sous son objectif, ne touche que par la prime d'équipe. La commission récompense ceux qui dépassent déjà ; la prime d'équipe tient le collectif, mais paie aussi celui qui ne contribue pas.`,
        ];
      },
    },
    {
      id: "le-bulletin",
      objectifs: [3],
      type: "montants",
      titre: "Le bulletin du vendeur",
      notions: ["payroll"],
      tableau: (c) => {
        const x = remunererEtStimuler(c);
        const v = x.r.de("vendeur");
        return {
          titre: `${x.f.entreprise} · les éléments du salaire de ${v.prenom}, janvier`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Salaire de base, ${h(x.hugo.heures)}`, valeurs: [eur(x.hugo.fixe)] },
            { libelle: "Commission", valeurs: [eur(v.commission)] },
            { libelle: "Prime d'équipe", valeurs: [eur(v.prime)] },
          ],
        };
      },
      question: (c) => {
        const x = remunererEtStimuler(c);
        return `Sans formule cette fois. Avec la proposition de la direction, établissez le bulletin simplifié de ${x.r.de("vendeur").prenom} : le salaire brut, les cotisations salariales (${pct(TAUX_SALARIAL * 100)} du brut), le net avant impôt, puis le coût employeur (${pct(x.f.tauxPatronal * 100)} de cotisations patronales).`;
      },
      champs: (c) => {
        const x = remunererEtStimuler(c);
        const b = x.hugo;
        return [
          { libelle: "Salaire brut", attendu: b.brut, calcul: `${eur(b.fixe)} + ${eur(b.variable)} = ${eur(b.brut)}` },
          { libelle: "Cotisations salariales", attendu: b.cotisationsSalariales, calcul: `${eur(b.brut)} × ${pct(TAUX_SALARIAL * 100)} = ${eur(b.cotisationsSalariales)}` },
          { libelle: "Net avant impôt", attendu: b.net, calcul: `${eur(b.brut)} − ${eur(b.cotisationsSalariales)} = ${eur(b.net)}` },
          { libelle: "Coût employeur", attendu: b.coutEmployeur, calcul: `${eur(b.brut)} + ${eur(b.cotisationsPatronales)} = ${eur(b.coutEmployeur)}` },
        ];
      },
      explication: (c) => {
        const x = remunererEtStimuler(c);
        const b = x.hugo;
        return [
          `Sur ${eur(b.coutEmployeur)} que la boutique dépense, ${eur(b.net)} arrivent au vendeur avant l'impôt sur le revenu. Un euro de variable brut coûte ${eur(1 + x.f.tauxPatronal)} à l'employeur et rapporte ${eur(1 - TAUX_SALARIAL)} au salarié.`,
          "Le bulletin de paie détaille ces lignes chaque mois, avec la période, les heures, le salaire de base et chaque prime à part ; le chapitre « La paie » le détaille ligne par ligne.",
        ];
      },
    },
    {
      id: "les-minima",
      objectifs: [3],
      type: "choix",
      titre: "Le SMIC et le minimum de la branche",
      notions: ["payroll"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        const ines = x.minima.find((m) => m.code === "vendeuse-partiel")!;
        const s = x.f.equipe.find((k) => k.code === "vendeuse-partiel")!;
        return `La vendeuse à temps partiel touche ${eur(s.brutMensuel)} bruts pour ${h(s.heuresParSemaine)} par semaine, soit ${eur(auCentime(ines.horaire))} de l'heure. Le SMIC est à ${eur(SMIC_HORAIRE_BRUT)} ; la branche fixe ${eur(MINIMUM_DE_LA_BRANCHE_35_HEURES)} pour 35 h. Son salaire est-il conforme ?`;
      },
      options: (c) => {
        const x = remunererEtStimuler(c);
        const ines = x.minima.find((m) => m.code === "vendeuse-partiel")!;
        const conforme = ines.auDessusDuSmic && ines.auDessusDuMinimum;
        return [
          { texte: "Oui, au-dessus des deux minima, au prorata des heures", juste: conforme, retour: `Oui : ${eur(auCentime(ines.horaire))} de l'heure dépasse le SMIC, et le minimum de la branche, au prorata des heures du contrat, fait ${eur(ines.minimum)}.` },
          { texte: "Non : la branche demande le minimum entier, temps partiel ou non", juste: false, retour: "Non : un temps partiel se compare au minimum au prorata de ses heures." },
          { texte: "Non, puisque la prime d'équipe doit compléter le fixe", juste: false, retour: "Non : le fixe est déjà conforme ; une prime ne sert pas à atteindre un minimum qu'elle ne garantit pas chaque mois." },
        ];
      },
    },
    {
      id: "le-seuil-du-challenge",
      objectifs: [4],
      type: "curseur",
      titre: "Ce que le challenge doit vendre",
      notions: ["contribution_margin", "pay_and_motivation"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        const k = CHALLENGE_DE_L_ECHARPE;
        return `En février, la direction lance un challenge : l'écharpe proposée en vente additionnelle. Le meilleur vendeur gagne ${eur(k.dotation)} bruts, et l'équipe ${eur(k.parArticle)} par écharpe vendue en plus. Une dotation est du salaire : elle coûte ${pct(x.f.tauxPatronal * 100)} de cotisations en plus. Chaque écharpe laisse ${eur(x.ch.marge)} de marge. Placez le curseur sur le plus petit nombre d'écharpes en plus qui paie le challenge, puis validez.`;
      },
      grandeur: () => ({ libelle: "Écharpes vendues en plus", unite: "écharpes" }),
      cible: (c) => ({ attendu: remunererEtStimuler(c).ch.seuil, min: ECHARPES_DU_CURSEUR.min, max: ECHARPES_DU_CURSEUR.max }),
      zones: ["Le challenge se paie", "Le challenge coûte plus qu'il ne rapporte"],
      rates: () => ({
        dessous: "À ce nombre, la marge des écharpes en plus ne paie pas encore le challenge.",
        dessus: "Plus bas, le challenge se paie encore : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, n) => {
        const x = remunererEtStimuler(c);
        const k = challenge(x.f, CHALLENGE_DE_L_ECHARPE, n);
        return [
          { libelle: "Marge des écharpes en plus", montant: k.margeEnPlus },
          { libelle: "Coût chargé du challenge", montant: k.cout },
          { libelle: "Ce que le challenge rapporte", montant: k.gain, fort: true },
        ];
      },
      droites: (c) => {
        const x = remunererEtStimuler(c);
        const k = CHALLENGE_DE_L_ECHARPE;
        return {
          produit: (n) => n * x.ch.marge,
          cout: (n) => (k.dotation + k.parArticle * n) * (1 + x.f.tauxPatronal),
          libelles: ["Marge des écharpes en plus", "Coût chargé du challenge"],
        };
      },
      explication: (c) => {
        const x = remunererEtStimuler(c);
        const k = CHALLENGE_DE_L_ECHARPE;
        return [
          `Il faut ${qte(x.ch.seuil)} écharpes en plus : chacune laisse ${eur(x.ch.marge)}, moins ${eur(auCentime(k.parArticle * (1 + x.f.tauxPatronal)))} de prime chargée, et la dotation de ${eur(k.dotation)} coûte ${eur(auCentime(k.dotation * (1 + x.f.tauxPatronal)))}. Au-delà, chaque écharpe rapporte.`,
        ];
      },
    },
    {
      id: "le-challenge",
      objectifs: [4],
      type: "montants",
      titre: "Ce que rapporte le challenge",
      notions: ["contribution_margin", "pay_and_motivation"],
      question: () =>
        `Sans formule cette fois. L'équipe vend ${qte(CHALLENGE_DE_L_ECHARPE.objectif)} écharpes de plus en février. Calculez la marge qu'elles apportent, le coût chargé du challenge, puis ce qu'il rapporte.`,
      champs: (c) => {
        const x = remunererEtStimuler(c);
        const k = CHALLENGE_DE_L_ECHARPE;
        return [
          { libelle: "Marge des écharpes en plus", attendu: x.ch.margeEnPlus, calcul: `${qte(k.objectif)} × ${eur(x.ch.marge)} = ${eur(x.ch.margeEnPlus)}` },
          { libelle: "Coût chargé du challenge", attendu: x.ch.cout, calcul: `(${eur(k.dotation)} + ${qte(k.objectif)} × ${eur(k.parArticle)}) × ${qte(1 + x.f.tauxPatronal)} = ${eur(x.ch.cout)}` },
          { libelle: "Ce que le challenge rapporte", attendu: x.ch.gain, calcul: `${eur(x.ch.margeEnPlus)} − ${eur(x.ch.cout)} = ${eur(x.ch.gain)}` },
        ];
      },
      explication: (c) => {
        const x = remunererEtStimuler(c);
        return [`Le challenge rapporte ${eur(x.ch.gain)}, si les écharpes vendues en plus le sont vraiment grâce à lui. Le manager compare donc février à janvier, écharpe par écharpe, avant de conclure.`];
      },
    },
    {
      id: "les-regles-du-challenge",
      objectifs: [4],
      type: "choix",
      titre: "Les règles du challenge",
      notions: ["pay_and_motivation"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        const jade = x.t.de("etudiante");
        return `${jade.prenom} vend ${h(jade.heuresDeVente)} par semaine, Hugo ${h(x.t.de("vendeur").heuresDeVente)}. Comment écrire les règles du challenge ?`;
      },
      options: () => [
        {
          texte: "Par heure de vente, règles affichées d'avance",
          juste: true,
          retour: "Oui : rapporter les ventes aux heures traite les temps partiels comme les autres, et des règles écrites, connues à l'avance, rendent la dotation incontestable. Elle passe sur le bulletin, avec ses cotisations.",
        },
        { texte: "Le total d'écharpes du mois, en bon d'achat hors bulletin", juste: false, retour: "Non : le total favorise les temps complets, et une dotation versée par l'employeur est du salaire, qui passe sur le bulletin." },
        { texte: "Réservé aux vendeurs en CDI, qui restent dans l'équipe", juste: false, retour: "Non : exclure les contrats courts d'une prime liée au travail est une inégalité de traitement." },
      ],
    },
    {
      id: "prime-individuelle-ou-collective",
      objectifs: [2],
      type: "choix",
      titre: "Commission ou prime d'équipe ?",
      notions: ["pay_and_motivation"],
      question: (c) => {
        const x = remunererEtStimuler(c);
        return `La direction hésite. ${x.m.prenom} décroche, l'équipe dépasse son objectif, et le variable doit tenir dans ${eur(ENVELOPPE_DU_VARIABLE)} chargés. Que recommandez-vous ?`;
      },
      options: (c) => {
        const x = remunererEtStimuler(c);
        const sol = remunerationVariable(x.f, SOLUTION_DE_LA_REMUNERATION.commission / 100, SOLUTION_DE_LA_REMUNERATION.prime);
        return [
          {
            texte: "Surtout la prime d'équipe, peu de commission",
            juste: true,
            retour: `Oui : à ${pct(SOLUTION_DE_LA_REMUNERATION.commission)} et ${eur(SOLUTION_DE_LA_REMUNERATION.prime)} par heure, chacun touche au moins ${eur(sol.plusPetit)} pour ${eur(sol.cout)}. La prime tient le collectif ; la remédiation, pas l'argent, traite le décrochage de ${x.m.prenom}.`,
          },
          {
            texte: `La commission seule, à ${pct(TAUX_DE_COMMISSION * 100)}, pour récompenser les meilleurs`,
            juste: false,
            retour: `Non : ${x.m.prenom} ne toucherait rien, et les vendeurs se disputeraient chaque client à l'entrée. La commission seule divise une petite équipe.`,
          },
          {
            texte: "Une prime au vendeur qui progresse le plus, sans autre règle",
            juste: false,
            retour: "Non : une prime sans règle écrite et mesurable se conteste, et paraît arbitraire à ceux qui ne la touchent pas.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard", "pay_and_motivation", "payroll"],
      tableau: tableauDeBordCalcule,
      texte: (c) => {
        const x = remunererEtStimuler(c);
        return [
          `Le tableau de bord vendeur par vendeur montre ce que le total cache : l'équipe de ${x.f.entreprise} dépasse son objectif, ${x.m.prenom} est à ${pct(auCentime(x.m.realisation * 100))}. Son écart vient d'abord de la transformation : la remédiation passe par l'entretien, l'accompagnement et un objectif suivi.`,
          "Une rémunération assemble un fixe, au-dessus du SMIC et du minimum de la branche, et un variable. La commission récompense l'individu, la prime d'équipe le collectif ; chaque euro de variable coûte aussi ses cotisations.",
          `Un challenge se paie par la marge qu'il apporte : ${qte(x.ch.seuil)} écharpes en plus suffisent à payer celui de février. Ses règles s'écrivent avant, et traitent chacun selon ses heures.`,
          "Animer l'équipe passe aussi par d'autres leviers que l'argent : la reconnaissance, un objectif partagé et affiché, la formation, l'autonomie. Le challenge, la réunion du matin et le tableau de bord affiché en sont les outils.",
          "Les limites de la méthode : un mois ne fait pas une performance, l'entrée attribuée au vendeur dépend de qui l'accueille, et une vente en plus pendant un challenge n'est pas toujours une vente due au challenge.",
          "Au niveau de l'examen, vous savez construire et lire le tableau de bord des vendeurs, calculer une commission, une prime et leur coût, lire un bulletin simplifié et chiffrer une opération de stimulation.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Réalisation = chiffre d'affaires ÷ objectif. Coût employeur = brut × (1 + taux patronal). Seuil d'un challenge = dotation chargée ÷ (marge d'un article − prime chargée par article).",
    },
  ],
};

