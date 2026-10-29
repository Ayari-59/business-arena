import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { chiffreDAffairesParLesIndicateurs, indicateursDuMois, referenceDe } from "../monde/boutique";
import { JOURS_DE_L_ANNEE_BANCAIRE, JOURS_DE_L_ANNEE_CIVILE } from "../monde/delais-et-tva";
import type { FicheDeLaBoutique } from "../monde/maille-et-co";
import { CSE_DES_LABORATOIRES_VERNAL, TAUX_DES_PENALITES, suivreUnMauvaisPayeur } from "../monde/mauvais-payeurs";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "./taux-de-marque";

/**
 * CHAPITRE : LES INDICATEURS DU POINT DE VENTE (BTS MCO, palier 2 : la porte d'entrée du parcours du
 * point de vente).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique
 * MAILLE & CO a une fiche figée (monde/maille-et-co.ts), le mois de janvier de l'année N compté à la
 * porte, à la caisse et clientèle par clientèle, et ses indicateurs se calculent par le modèle du
 * cours (monde/boutique.ts, `indicateursDuMois`). Une évolution du moteur ne change rien ici. Le
 * chapitre se joue chez MAILLE & CO seule (il se jouait aussi chez PIXEL & CO et LA TABLE D'AUGUSTIN,
 * avec un indicateur par métier) : un seul point de vente, le même d'un chapitre à l'autre.
 *
 * Ce que le manager lit chaque soir : le trafic (les entrées), les passages en caisse, le taux de
 * transformation (passages ÷ entrées : la définition du BTS MCO, et non plus les ventes rapportées à
 * la demande comme le faisait l'arène), l'indice de vente, le panier moyen, le prix moyen d'un
 * article, le chiffre d'affaires au m², puis le taux de service (ventes ÷ demande), qu'il ne faut pas
 * confondre avec la transformation. Puis les leviers d'un objectif de chiffre d'affaires : le
 * chiffre d'affaires est le produit de quatre indicateurs, et leurs hausses se multiplient.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais jusqu'au niveau de
 * l'épreuve) :
 *   · guidé : intro, le-mois, le-panier (la formule est dans la question, qui nomme les chiffres) ;
 *   · autonome : la-transformation, le-taux-de-service, pourquoi-manquees, quel-levier (ni formule ni
 *     chiffres donnés ; le calcul de la correction montre le chemin) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-les-passages
 *     puis les-passages-au-curseur (le chiffre d'affaires des passages face à l'objectif) avant
 *     deux-leviers ; predire-les-leviers puis le-laboratoire-des-indicateurs (les quatre leviers à la
 *     fois : gagner l'objectif sans un client de plus) avant la-decomposition ;
 *   · expert : deux-taux (le taux de service n'est pas le taux de transformation), la-decomposition
 *     (un calcul à rebours : l'indice de vente qu'exige l'objectif quand le prix moyen monte),
 *     le-panier-avec-les-comites et quel-panier-viser (une moyenne que gonfleraient quelques grosses
 *     commandes passées hors caisse : dire de quel panier on parle), le-comite-qui-paie-tard (le CSE des Laboratoires
 *     Vernal, monde/mauvais-payeurs.ts : l'indemnité de 40 € pèse plus que les pénalités) ; puis la
 *     synthèse.
 *
 * LES HYPOTHÈSES DE LA SIMULATION, DITES À L'ÉLÈVE : le compteur à la porte donne les entrées, un
 * ticket de caisse fait un passage ; une commande d'un comité d'entreprise, facturée et réglée à
 * terme, ne passe pas en caisse : ni passage, ni panier (un seul panier moyen dans tout le cours, celui
 * du bac pro : chiffre d'affaires encaissé en caisse ÷ passages en caisse, voir indicateursDuMois) ;
 * la surface de vente est celle de la fiche ; l'objectif de hausse et la variante du prix moyen sont
 * des hypothèses du cours.
 */

/** L'OBJECTIF DE LA DIRECTION, hypothèse du cours : 10 % de chiffre d'affaires en caisse de plus qu'en janvier. */
export const HAUSSE_VISEE = 0.1;

/**
 * LA VARIANTE DU PRIX MOYEN, hypothèse du cours : la nouvelle collection fait monter le prix moyen d'un
 * article de 4 %. Elle sert au calcul à rebours de l'indice de vente qu'exige alors l'objectif.
 */
export const HAUSSE_DU_PRIX_MOYEN = 0.04;

/** Les bornes du curseur des passages en caisse. */
export const PASSAGES_DU_CURSEUR = { min: 900, max: 1_200 } as const;

/** Les leviers du laboratoire : chacun en variation sur janvier, en pourcentage, de −20 % à +20 %. */
export const VARIATIONS_DU_LABORATOIRE = { min: -20, max: 20, pas: 1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);

/** Les variations du laboratoire (en %) appliquées aux quatre leviers de janvier. */
export function laboratoireDesIndicateurs(f: FicheDeLaBoutique, p: Readonly<Record<string, number>>) {
  const m = indicateursDuMois(f);
  const facteur = (code: string) => 1 + (p[code] ?? 0) / 100;
  const x = chiffreDAffairesParLesIndicateurs(f, {
    trafic: m.entrees * facteur("entrees"),
    tauxDeTransformation: m.tauxDeTransformation * facteur("transformation"),
    indiceDeVente: m.indiceDeVente * facteur("indice"),
    prixMoyenDeLArticle: m.prixMoyenDeLArticle * facteur("prix"),
  });
  return { ...x, gain: auCentime(x.chiffreDAffairesEnCaisse - m.chiffreDAffairesEnCaisse) };
}

/** Tout ce que le chapitre et son cas demandent sur le mois de janvier. */
export function indicateursDuPointDeVente(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const m = indicateursDuMois(f);
  const [fideles, passants, comites] = m.clienteles;
  const caVise = auCentime(m.chiffreDAffairesEnCaisse * (1 + HAUSSE_VISEE));
  const passagesVises = plafond(caVise / m.panierMoyen);
  const entreesVisees = plafond(passagesVises / m.tauxDeTransformation);
  // La variante : un prix moyen plus haut de 4 %, à entrées et transformation inchangées.
  const hausseDeLIndice = (1 + HAUSSE_VISEE) / (1 + HAUSSE_DU_PRIX_MOYEN) - 1;
  const indiceVise = m.indiceDeVente * (1 + hausseDeLIndice);
  const prixMoyenVariante = m.prixMoyenDeLArticle * (1 + HAUSSE_DU_PRIX_MOYEN);
  const articlesVises = plafond(caVise / prixMoyenVariante);
  // Le panier qu'on obtiendrait en comptant à tort les commandes des comités comme des passages.
  const avecComites = { chiffreDAffaires: m.chiffreDAffaires, tickets: m.tickets + comites!.tickets };
  const cardigan = m.references.find((r) => r.code === "cardigan")!;
  return {
    f,
    m,
    fideles: fideles!,
    passants: passants!,
    comites: comites!,
    panier: auCentime(m.panierMoyen),
    indice: auCentime(m.indiceDeVente),
    prixMoyen: auCentime(m.prixMoyenDeLArticle),
    transformation: auDixieme(m.tauxDeTransformation * 100),
    transformationDesFideles: auDixieme(fideles!.tauxDeTransformation * 100),
    transformationDesPassants: auDixieme(passants!.tauxDeTransformation * 100),
    caAuM2: auCentime(m.chiffreDAffairesAuM2),
    tauxDeService: auDixieme(m.tauxDeService * 100),
    cardigan,
    stockDuCardigan: referenceDe(f, "cardigan"),
    caVise,
    passagesVises,
    panierVise: auCentime(caVise / m.tickets),
    entreesVisees,
    hausseDesPassages: auDixieme((passagesVises / m.tickets - 1) * 100),
    hausseDeLIndice: auDixieme(hausseDeLIndice * 100),
    indiceVise: auCentime(indiceVise),
    articlesVises,
    avecComites: { ...avecComites, panier: auCentime(avecComites.chiffreDAffaires / avecComites.tickets) },
    panierDesComites: auCentime(comites!.panierMoyen),
    /** Deux hausses de 5 % sur deux leviers : leur effet sur le chiffre d'affaires. */
    deuxFoisCinq: auDixieme((1.05 * 1.05 - 1) * 100),
  };
}

export type IndicateursDuPointDeVente = ReturnType<typeof indicateursDuPointDeVente>;

/** Le mois de janvier, clientèle par clientèle : le document de départ. */
export function tableauDuMois(c: Pick<Cas, "code">): TableauDeDonnees {
  const k = indicateursDuPointDeVente(c);
  const ligne = (libelle: string, x: { entrees: number; tickets: number; articles: number; chiffreDAffaires: number }, enCaisse = true) => ({
    libelle,
    valeurs: [qte(x.entrees), enCaisse ? qte(x.tickets) : `aucun (${qte(x.tickets)} commandes)`, qte(x.articles), eur(x.chiffreDAffaires)],
  });
  return {
    titre: `${k.f.entreprise} en ${k.f.moisDeReference}, clientèle par clientèle`,
    colonnes: ["Entrées", "Passages en caisse", "Articles achetés", "Chiffre d'affaires HT"],
    lignes: [...k.m.clienteles.map((x) => ligne(x.nom, x, x.delaiDeReglement === 0)), ligne("Toute la boutique", k.m)],
  };
}

/** Le mois de janvier, référence par référence : la demande et les ventes. */
function tableauDesReferences(k: IndicateursDuPointDeVente): TableauDeDonnees {
  return {
    titre: `${k.f.entreprise} en ${k.f.moisDeReference}, référence par référence`,
    colonnes: ["Articles demandés", "Articles vendus", "Prix de vente HT"],
    lignes: k.m.references.map((r) => ({ libelle: r.nom, valeurs: [qte(r.demande), qte(r.ventes), eur(referenceDe(k.f, r.code).prixHt)] })),
  };
}

/** Les indicateurs du mois : la synthèse. */
function tableauDesIndicateurs(k: IndicateursDuPointDeVente): TableauDeDonnees {
  return {
    titre: `Les indicateurs de ${k.f.entreprise} en ${k.f.moisDeReference}`,
    colonnes: ["Calcul", "Valeur"],
    lignes: [
      { libelle: "Taux de transformation", valeurs: ["passages ÷ entrées", pct(k.transformation)] },
      { libelle: "Indice de vente", valeurs: ["articles en caisse ÷ passages", deux(k.indice)] },
      { libelle: "Panier moyen", valeurs: ["chiffre d'affaires en caisse ÷ passages", eur(k.panier)] },
      { libelle: "Prix moyen d'un article", valeurs: ["chiffre d'affaires en caisse ÷ articles en caisse", eur(k.prixMoyen)] },
      { libelle: "Chiffre d'affaires au m²", valeurs: ["chiffre d'affaires ÷ surface de vente", eur(k.caAuM2)] },
      { libelle: "Taux de service", valeurs: ["articles vendus ÷ articles demandés", pct(k.tauxDeService)] },
    ],
  };
}

export const INDICATEURS_DU_POINT_DE_VENTE: Chapitre = {
  code: "indicateurs-du-point-de-vente",
  parcours: "mco",
  palier: 2,
  blocs: [
    "BTS MCO Bloc 3 · Assurer la gestion opérationnelle",
    "BUT TC · Piloter un espace de vente",
    "BUT GACO · Assurer le développement des affaires, de la prospection à la fidélisation",
  ],
  titre: "Les indicateurs du point de vente",
  accroche:
    "Ce que le manager lit chaque soir : les entrées, les passages en caisse, la transformation, l'indice de vente, le panier moyen et le taux de service. Puis le chiffre d'affaires décomposé en ses leviers, qui se multiplient.",
  objectifs: [
    "Calculer le chiffre d'affaires, le chiffre d'affaires au m², le panier moyen, l'indice de vente et le prix moyen d'un article",
    "Calculer le taux de transformation, passages ÷ entrées, et le distinguer du taux de service",
    "Chiffrer ce que coûtent des ventes manquées",
    "Décomposer le chiffre d'affaires en entrées × transformation × indice de vente × prix moyen, et chiffrer un objectif levier par levier",
    "Dire de quel panier on parle quand quelques grosses commandes passent hors caisse",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi:
      "ce chapitre suit les indicateurs d'un magasin qui compte ses entrées et ses passages en caisse, la boutique du cours, MAILLE & CO : un seul point de vente, le même d'un chapitre du parcours à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le soir, à la fermeture",
      notions: ["average_basket", "conversion_rate"],
      tableau: tableauDuMois,
      texte: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${k.f.entreprise}, sur le mois de ${k.f.moisDeReference} de l'année N. Le soir, le manager ne lit pas le compte de résultat : il lit quelques chiffres, toujours les mêmes. Combien de personnes sont entrées, combien sont passées en caisse, combien d'articles chacune a pris, pour quel montant.`,
          `La simulation compte les entrées au compteur de la porte, et un ticket de caisse pour un passage. Les comités d'entreprise passent commande en boutique : la commande est facturée et réglée plus tard, elle ne passe pas en caisse. Elle compte dans le chiffre d'affaires du mois, pas dans les passages. La surface de vente est de ${qte(k.f.surfaceDeVente)} m². Tous les montants sont hors taxes.`,
        ];
      },
      repere: () => "Un indicateur se lit toujours comparé : au mois dernier, à l'objectif, ou au magasin voisin. Et toujours en disant de quoi il est le rapport.",
    },
    {
      id: "le-mois",
      objectifs: [0],
      type: "montants",
      titre: "Le mois en quatre chiffres",
      notions: ["revenue", "sales_per_sqm"],
      tableau: tableauDuMois,
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `Additionnez les ${qte(k.m.clienteles.length)} clientèles : le chiffre d'affaires du mois et les articles vendus. Les passages en caisse, eux, ne viennent que des clientèles qui paient en caisse. Puis le chiffre d'affaires au m² : le chiffre d'affaires divisé par les ${qte(k.f.surfaceDeVente)} m² de surface de vente.`;
      },
      champs: (c) => {
        const k = indicateursDuPointDeVente(c);
        const cl = k.m.clienteles;
        const enCaisse = cl.filter((x) => x.delaiDeReglement === 0);
        return [
          { libelle: "Chiffre d'affaires du mois", attendu: k.m.chiffreDAffaires, calcul: `${cl.map((x) => eur(x.chiffreDAffaires)).join(" + ")} = ${eur(k.m.chiffreDAffaires)}` },
          { libelle: "Passages en caisse", attendu: k.m.tickets, calcul: `${enCaisse.map((x) => qte(x.tickets)).join(" + ")} = ${qte(k.m.tickets)}, sans les commandes des comités` },
          { libelle: "Articles vendus", attendu: k.m.articles, calcul: `${cl.map((x) => qte(x.articles)).join(" + ")} = ${qte(k.m.articles)}` },
          { libelle: "Chiffre d'affaires au m²", attendu: k.caAuM2, calcul: `${eur(k.m.chiffreDAffaires)} ÷ ${qte(k.f.surfaceDeVente)} = ${eur(k.caAuM2)}` },
        ];
      },
      explication: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          `${k.f.entreprise} a fait ${eur(k.m.chiffreDAffaires)} avec ${qte(k.m.tickets)} passages en caisse et ${qte(k.m.articles)} articles, soit ${eur(k.caAuM2)} par m² de surface de vente. Le chiffre d'affaires au m² compare des magasins de tailles différentes, ou deux rayons de la même boutique.`,
        ];
      },
    },
    {
      id: "le-panier",
      objectifs: [0],
      type: "montants",
      titre: "Le panier, l'indice de vente, le prix moyen",
      notions: ["average_basket"],
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `Le panier moyen est le chiffre d'affaires encaissé en caisse divisé par les passages en caisse ; l'indice de vente, les articles passés en caisse divisés par les passages ; le prix moyen d'un article, le chiffre d'affaires en caisse divisé par ces articles. Les clientes fidèles et les passants paient en caisse. Calculez les trois pour ${k.f.entreprise}, au centime ou au centième.`;
      },
      champs: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          { libelle: "Panier moyen", attendu: k.panier, calcul: `${eur(k.m.chiffreDAffairesEnCaisse)} ÷ ${qte(k.m.tickets)} = ${eur(k.panier)}` },
          { libelle: "Indice de vente", attendu: k.indice, calcul: `${qte(k.m.articlesEnCaisse)} ÷ ${qte(k.m.tickets)} = ${deux(k.indice)} articles par passage`, tolerance: 0.01 },
          { libelle: "Prix moyen d'un article", attendu: k.prixMoyen, calcul: `${eur(k.m.chiffreDAffairesEnCaisse)} ÷ ${qte(k.m.articlesEnCaisse)} = ${eur(k.prixMoyen)}` },
        ];
      },
      explication: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          `Chaque passage en caisse rapporte en moyenne ${eur(k.panier)} : ${deux(k.indice)} articles à ${eur(k.prixMoyen)}. Le panier est le produit des deux : ${deux(k.indice)} × ${eur(k.prixMoyen)} ≈ ${eur(k.panier)}. Pour le faire monter, on vend plus d'articles à chaque client, ou des articles plus chers.`,
        ];
      },
    },
    {
      id: "la-transformation",
      objectifs: [1],
      type: "montants",
      titre: "Le taux de transformation",
      notions: ["conversion_rate"],
      tableau: tableauDuMois,
      question: () =>
        "Sans formule cette fois. Sur cent personnes qui entrent, combien passent en caisse ? Calculez le taux de transformation de la boutique, puis celui des passants et celui des clientes fidèles, au dixième.",
      champs: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          { libelle: "Taux de transformation de la boutique (%)", attendu: k.transformation, calcul: `${qte(k.m.tickets)} ÷ ${qte(k.m.entrees)} × 100 = ${pct(k.transformation)}`, tolerance: 0.1 },
          {
            libelle: "Taux de transformation des passants (%)",
            attendu: k.transformationDesPassants,
            calcul: `${qte(k.passants.tickets)} ÷ ${qte(k.passants.entrees)} × 100 = ${pct(k.transformationDesPassants)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Taux de transformation des clientes fidèles (%)",
            attendu: k.transformationDesFideles,
            calcul: `${qte(k.fideles.tickets)} ÷ ${qte(k.fideles.entrees)} × 100 = ${pct(k.transformationDesFideles)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          `Sur ${qte(k.m.entrees)} entrées, ${qte(k.m.tickets)} ont fini en caisse : ${pct(k.transformation)}. Les clientes fidèles achètent bien plus souvent (${pct(k.transformationDesFideles)}) que les passants (${pct(k.transformationDesPassants)}). Mais les passants font l'essentiel du trafic : c'est sur eux que l'accueil et la vitrine font gagner des points de transformation.`,
        ];
      },
    },
    {
      id: "le-taux-de-service",
      objectifs: [1, 2],
      type: "montants",
      titre: "Les ventes manquées et le taux de service",
      notions: ["stock", "conversion_rate"],
      tableau: (c) => tableauDesReferences(indicateursDuPointDeVente(c)),
      question: () =>
        "Des clients ont demandé des articles que le rayon n'avait plus. Calculez les articles demandés dans le mois, le taux de service (la part de la demande servie), au dixième, les ventes manquées, et le chiffre d'affaires qu'elles auraient rapporté.",
      champs: (c) => {
        const k = indicateursDuPointDeVente(c);
        const refs = k.m.references;
        const manquees = refs.filter((r) => r.ventesManquees > 0);
        return [
          { libelle: "Articles demandés", attendu: k.m.demande, calcul: `${refs.map((r) => qte(r.demande)).join(" + ")} = ${qte(k.m.demande)}` },
          { libelle: "Taux de service (%)", attendu: k.tauxDeService, calcul: `${qte(k.m.articles)} ÷ ${qte(k.m.demande)} × 100 = ${pct(k.tauxDeService)}`, tolerance: 0.1 },
          { libelle: "Ventes manquées", attendu: k.m.ventesManquees, calcul: `${qte(k.m.demande)} − ${qte(k.m.articles)} = ${qte(k.m.ventesManquees)}` },
          {
            libelle: "Chiffre d'affaires manqué",
            attendu: k.m.chiffreDAffairesManque,
            calcul: `${manquees.map((r) => `${qte(r.ventesManquees)} × ${eur(referenceDe(k.f, r.code).prixHt)}`).join(" + ")} = ${eur(k.m.chiffreDAffairesManque)}`,
          },
        ];
      },
      explication: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          `La boutique a servi ${pct(k.tauxDeService)} de ce que ses clients demandaient. Les ${qte(k.m.ventesManquees)} articles manqués (${k.m.references.filter((r) => r.ventesManquees > 0).map((r) => `${qte(r.ventesManquees)} ${r.nom.toLowerCase()}s`).join(", ")}) font ${eur(k.m.chiffreDAffairesManque)} de chiffre d'affaires laissés au concurrent, au prix de l'article manqué, et non au prix moyen de la boutique.`,
        ];
      },
    },
    {
      id: "deux-taux",
      objectifs: [1],
      type: "choix",
      titre: "Deux taux à ne pas confondre",
      notions: ["conversion_rate", "stock"],
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `Un ancien tableau de bord affiche, pour ${k.f.moisDeReference}, un « taux de transformation » de ${pct(k.tauxDeService)}. Vous avez trouvé ${pct(k.transformation)}. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          {
            texte: `${pct(k.tauxDeService)} est le taux de service ; la transformation vaut ${pct(k.transformation)}`,
            juste: true,
            retour: `Oui. ${pct(k.tauxDeService)}, ce sont les articles vendus rapportés aux articles demandés : il mesure le rayon. La transformation rapporte les passages en caisse aux entrées : elle mesure la vente. Un magasin peut servir presque toute sa demande et ne transformer qu'une petite part de ses visiteurs.`,
          },
          {
            texte: "Les deux sont des taux de transformation, l'un en articles, l'autre en clients",
            juste: false,
            retour: "Non : seul le rapport passages ÷ entrées est un taux de transformation. Rapporter les ventes à la demande dit si le stock a suivi, pas si les visiteurs ont acheté.",
          },
          {
            texte: `${pct(k.tauxDeService)} est le bon chiffre : il compte les articles demandés qui ont été vendus`,
            juste: false,
            retour: `Non : c'est justement le taux de service. Un visiteur qui repart sans rien demander n'entre pas dans la demande ; il entre dans les ${qte(k.m.entrees)} entrées, et c'est lui que la transformation compte.`,
          },
        ];
      },
    },
    {
      id: "pourquoi-manquees",
      objectifs: [2],
      type: "choix",
      titre: "Le rayon vide",
      notions: ["stock", "conversion_rate"],
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `Des clients sont venus pour ${qte(k.m.ventesManquees)} ${k.cardigan.nom.toLowerCase()}s que la boutique n'avait plus. Quel geste agit d'abord sur ces ventes manquées ?`;
      },
      options: (c) => {
        const k = indicateursDuPointDeVente(c);
        const r = k.stockDuCardigan;
        return [
          {
            texte: `Commander plus de ${r.nom.toLowerCase()}s : le rayon en a eu moins que la demande`,
            juste: true,
            retour: `Oui. Le rayon a offert ${qte(k.cardigan.ventes)} ${r.nom.toLowerCase()}s pour ${qte(k.cardigan.demande)} demandés, et il en tient ${qte(r.capaciteDuRayon)}. Une vente manquée est une vente que le client voulait faire : il suffisait d'avoir l'article.`,
          },
          {
            texte: "Attirer plus de clients par la publicité",
            juste: false,
            retour: "Plus de clients, sans plus d'articles, ce sont plus de clients qui repartent les mains vides : les ventes manquées augmentent.",
          },
          {
            texte: `Baisser le prix du ${r.nom.toLowerCase()}`,
            juste: false,
            retour: "Un prix plus bas attire encore plus de demande, sur un rayon qui ne peut déjà pas la servir. Il faut d'abord de quoi vendre.",
          },
        ];
      },
    },
    {
      id: "predire-les-passages",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur les passages",
      notions: ["average_basket", "revenue"],
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `Avant de calculer, pariez. La direction veut ${pct(HAUSSE_VISEE * 100)} de chiffre d'affaires en caisse de plus qu'en ${k.f.moisDeReference}. Au même panier moyen, il faudra…`;
      },
      options: (c) => {
        const k = indicateursDuPointDeVente(c);
        const voir = "Faites varier les passages en caisse à l'étape suivante : le curseur montre combien il en faut.";
        const hausse = HAUSSE_VISEE * 100;
        return [
          { texte: `Environ ${pct(hausse)} de passages en caisse en plus`, juste: Math.abs(k.hausseDesPassages - hausse) < 0.5, retour: `Bon pari. ${voir}` },
          { texte: `Nettement plus de ${pct(hausse)} : les nouveaux clients achètent moins`, juste: k.hausseDesPassages >= hausse + 0.5, retour: `Pari à vérifier. ${voir}` },
          { texte: `Nettement moins de ${pct(hausse)} : le panier grandit avec les clients`, juste: k.hausseDesPassages <= hausse - 0.5, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-passages-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "Faites passer les clients en caisse",
      notions: ["average_basket", "revenue", "conversion_rate"],
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `Au panier moyen de ${k.f.moisDeReference}, ${eur(k.panier)}, faites varier les passages en caisse du mois. Une droite donne le chiffre d'affaires qu'ils font, l'autre l'objectif de la direction, ${eur(k.caVise)}. Placez le curseur sur le plus petit nombre de passages qui l'atteint, puis validez.`;
      },
      grandeur: () => ({ libelle: "Passages en caisse du mois", unite: "passages" }),
      cible: (c) => ({ attendu: indicateursDuPointDeVente(c).passagesVises, min: PASSAGES_DU_CURSEUR.min, max: PASSAGES_DU_CURSEUR.max }),
      zones: ["Objectif atteint", "Objectif manqué"],
      rates: () => ({
        dessous: "À ce nombre de passages, le chiffre d'affaires reste sous l'objectif.",
        dessus: "Moins de passages suffisent déjà : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les passages",
      lecture: (c, n) => {
        const k = indicateursDuPointDeVente(c);
        const ca = auCentime(n * k.m.panierMoyen);
        return [
          { libelle: "Chiffre d'affaires de ces passages", montant: ca, fort: true },
          { libelle: "Objectif de la direction", montant: k.caVise },
          { libelle: "Écart à l'objectif", montant: auCentime(ca - k.caVise) },
          { libelle: "Chiffre d'affaires gagné sur janvier", montant: auCentime(ca - k.m.chiffreDAffairesEnCaisse) },
        ];
      },
      droites: (c) => {
        const k = indicateursDuPointDeVente(c);
        return { produit: (n) => n * k.m.panierMoyen, cout: () => k.caVise, libelles: ["Chiffre d'affaires des passages", "Objectif de chiffre d'affaires"] };
      },
      explication: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          `Il faut ${qte(k.passagesVises)} passages au lieu de ${qte(k.m.tickets)}, soit ${pct(k.hausseDesPassages)} de plus : au même panier, le chiffre d'affaires suit les passages dans la même proportion. Et à la même transformation, il faudrait ${qte(k.entreesVisees)} entrées au lieu de ${qte(k.m.entrees)} : attirer ces visiteurs se paie en publicité ou en emplacement.`,
        ];
      },
    },
    {
      id: "deux-leviers",
      objectifs: [3],
      type: "montants",
      titre: "Deux leviers pour un objectif",
      notions: ["average_basket", "revenue", "conversion_rate"],
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `Le chiffre d'affaires en caisse est le produit des passages en caisse et du panier moyen. Calculez l'objectif (${pct(HAUSSE_VISEE * 100)} de plus qu'en ${k.f.moisDeReference}), les passages nécessaires au même panier (à l'unité supérieure), le panier nécessaire avec les mêmes passages, puis les entrées nécessaires à la même transformation (à l'unité supérieure).`;
      },
      champs: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          { libelle: "Chiffre d'affaires visé en caisse", attendu: k.caVise, calcul: `${eur(k.m.chiffreDAffairesEnCaisse)} × ${(1 + HAUSSE_VISEE).toLocaleString("fr-FR")} = ${eur(k.caVise)}` },
          { libelle: "Passages nécessaires, au même panier", attendu: k.passagesVises, calcul: `${eur(k.caVise)} ÷ ${eur(k.panier)} = ${qte(k.passagesVises)}`, tolerance: 1 },
          { libelle: "Panier nécessaire, aux mêmes passages", attendu: k.panierVise, calcul: `${eur(k.caVise)} ÷ ${qte(k.m.tickets)} = ${eur(k.panierVise)}`, tolerance: 0.01 },
          { libelle: "Entrées nécessaires, à la même transformation", attendu: k.entreesVisees, calcul: `${qte(k.passagesVises)} × ${qte(k.m.entrees)} ÷ ${qte(k.m.tickets)} = ${qte(k.entreesVisees)}, les passages divisés par la transformation de janvier`, tolerance: 6 },
        ];
      },
      explication: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          `Pour ${eur(k.caVise)}, il faut ou bien ${eur(k.panierVise)} par passage au lieu de ${eur(k.panier)}, ou bien ${qte(k.passagesVises)} passages au lieu de ${qte(k.m.tickets)}, donc ${qte(k.entreesVisees)} entrées si la transformation ne bouge pas. Le chiffre d'affaires, c'est toujours des clients multipliés par un panier.`,
        ];
      },
    },
    {
      id: "quel-levier",
      objectifs: [3],
      type: "choix",
      titre: "Le levier le moins cher",
      notions: ["average_basket", "customer_acquisition_cost"],
      question: (c) => `Pour ${indicateursDuPointDeVente(c).f.entreprise}, lequel des deux leviers coûte en général le moins ?`,
      options: () => [
        {
          texte: "Remplir le panier : le client est déjà là",
          juste: true,
          retour: "Oui. Vendre un peu plus à chaque passage (un conseil, un article complémentaire, une montée en gamme) ne demande pas d'attirer quelqu'un de nouveau. Attirer un visiteur, au contraire, se paie en publicité, en promotions ou en emplacement.",
        },
        {
          texte: "Attirer plus de clients : le panier ne se commande pas",
          juste: false,
          retour: "Le panier se travaille : la vente additionnelle, le merchandising, les offres groupées. Et chaque nouveau client a un coût d'acquisition.",
        },
        {
          texte: "Les deux coûtent pareil : seul le résultat compte",
          juste: false,
          retour: "Ils n'ont pas le même coût. Le client présent coûte peu à servir davantage ; le client à venir coûte d'abord ce qu'il faut pour le faire venir.",
        },
      ],
    },
    {
      id: "predire-les-leviers",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur deux leviers",
      notions: ["average_basket", "revenue"],
      question: () =>
        "Pariez encore. Sans un passage en caisse de plus, l'équipe fait monter l'indice de vente de 5 % (un article complémentaire de temps en temps) et le prix moyen d'un article de 5 % (une montée en gamme). Le chiffre d'affaires gagne…",
      options: (c) => {
        const k = indicateursDuPointDeVente(c);
        const voir = "Faites jouer les leviers dans le laboratoire, à l'étape suivante.";
        return [
          { texte: "Exactement 10 %, la somme des deux hausses", juste: k.deuxFoisCinq === 10, retour: `Pari à vérifier. ${voir}` },
          { texte: "Un peu plus de 10 % : les hausses se multiplient", juste: k.deuxFoisCinq > 10, retour: `Bon pari. ${voir}` },
          { texte: "5 % : seul le panier compte, et il n'a qu'une hausse", juste: k.deuxFoisCinq <= 5, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-indicateurs",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des indicateurs",
      notions: ["average_basket", "conversion_rate", "revenue"],
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `Le chiffre d'affaires de la boutique est le produit de quatre indicateurs : entrées × taux de transformation × indice de vente × prix moyen d'un article. Faites varier chacun, en pourcentage sur ${k.f.moisDeReference} : le tableau suit les indicateurs et le chiffre d'affaires. Relevez le défi.`;
      },
      leviers: () =>
        [
          { code: "entrees", libelle: "Entrées" },
          { code: "transformation", libelle: "Taux de transformation" },
          { code: "indice", libelle: "Indice de vente" },
          { code: "prix", libelle: "Prix moyen d'un article" },
        ].map((l) => ({ ...l, libelle: `${l.libelle} : variation`, unite: "%", min: VARIATIONS_DU_LABORATOIRE.min, max: VARIATIONS_DU_LABORATOIRE.max, pas: VARIATIONS_DU_LABORATOIRE.pas, depart: 0 })),
      lecture: (c, p) => {
        const k = indicateursDuPointDeVente(c);
        const x = laboratoireDesIndicateurs(k.f, p);
        const d = laboratoireDesIndicateurs(k.f, {});
        return [
          { libelle: "Entrées", montant: auDixieme(x.trafic), reference: auDixieme(d.trafic), unite: "entrées" },
          { libelle: "Taux de transformation", montant: auDixieme(x.tauxDeTransformation * 100), reference: auDixieme(d.tauxDeTransformation * 100), unite: "%" },
          { libelle: "Passages en caisse", montant: auDixieme(x.tickets), reference: auDixieme(d.tickets), unite: "passages" },
          { libelle: "Indice de vente", montant: auCentime(x.indiceDeVente), reference: auCentime(d.indiceDeVente), unite: "articles par passage" },
          { libelle: "Prix moyen d'un article", montant: auCentime(x.prixMoyenDeLArticle), reference: auCentime(d.prixMoyenDeLArticle) },
          { libelle: "Panier moyen", montant: auCentime(x.panierMoyen), reference: auCentime(d.panierMoyen) },
          { libelle: "Chiffre d'affaires en caisse", montant: x.chiffreDAffairesEnCaisse, reference: d.chiffreDAffairesEnCaisse },
          { libelle: "Chiffre d'affaires gagné sur janvier", montant: x.gain, reference: 0, effet: true, fort: true },
        ];
      },
      defi: (c) => {
        const k = indicateursDuPointDeVente(c);
        const atteint = (p: Readonly<Record<string, number>>) => {
          const x = laboratoireDesIndicateurs(k.f, p);
          return x.chiffreDAffairesEnCaisse >= k.caVise && x.tickets <= k.m.tickets + 1e-9;
        };
        return {
          consigne: `Atteignez ${eur(k.caVise)} de chiffre d'affaires en caisse sans un passage en caisse de plus qu'en ${k.f.moisDeReference}.`,
          atteint,
          indice: (p) => {
            const x = laboratoireDesIndicateurs(k.f, p);
            if (x.tickets > k.m.tickets + 1e-9) return `Vous avez ${qte(auDixieme(x.tickets))} passages en caisse, plus que les ${qte(k.m.tickets)} de ${k.f.moisDeReference} : le défi demande de faire sans un client de plus. Jouez sur le panier.`;
            return `Il manque ${eur(auCentime(k.caVise - x.chiffreDAffairesEnCaisse))} : sans un passage de plus, seuls l'indice de vente et le prix moyen font monter le panier.`;
          },
          solution: { entrees: 0, transformation: 0, indice: HAUSSE_VISEE * 100, prix: 0 },
        };
      },
      explication: (c, p) => {
        const k = indicateursDuPointDeVente(c);
        const x = laboratoireDesIndicateurs(k.f, p);
        return [
          `Avec ${qte(auDixieme(x.tickets))} passages en caisse, la boutique encaisse ${eur(x.chiffreDAffairesEnCaisse)} : un indice de vente de ${deux(x.indiceDeVente)} et un prix moyen de ${eur(auCentime(x.prixMoyenDeLArticle))} font un panier de ${eur(auCentime(x.panierMoyen))}. Sans un client de plus, l'objectif se gagne par le panier.`,
          `Les leviers se multiplient : 5 % sur l'indice de vente et 5 % sur le prix moyen font ${pct(k.deuxFoisCinq)} de chiffre d'affaires, pas 10 %. Et des entrées en plus ne servent à rien si la transformation baisse d'autant : 10 % de visiteurs en plus, transformés 10 % moins, font moins de passages qu'avant.`,
        ];
      },
    },
    {
      id: "la-decomposition",
      objectifs: [3],
      type: "montants",
      titre: "L'indice de vente qu'exige l'objectif",
      notions: ["average_basket", "revenue"],
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `La nouvelle collection fait monter le prix moyen d'un article de ${pct(HAUSSE_DU_PRIX_MOYEN * 100)} ; les entrées et la transformation ne bougent pas. Remontez à rebours : de combien l'indice de vente doit-il monter pour tenir l'objectif de ${eur(k.caVise)}, au dixième de pour cent ? Quel indice de vente viser, au centième ? Combien d'articles vendre dans le mois, à l'unité supérieure ?`;
      },
      champs: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          {
            libelle: "Hausse de l'indice de vente (%)",
            attendu: k.hausseDeLIndice,
            calcul: `(${(1 + HAUSSE_VISEE).toLocaleString("fr-FR")} ÷ ${(1 + HAUSSE_DU_PRIX_MOYEN).toLocaleString("fr-FR")} − 1) × 100 = ${pct(k.hausseDeLIndice)}`,
            tolerance: 0.1,
          },
          { libelle: "Indice de vente visé", attendu: k.indiceVise, calcul: `${deux(k.indice)} × (1 + ${pct(k.hausseDeLIndice)}) = ${deux(k.indiceVise)}`, tolerance: 0.01 },
          {
            libelle: "Articles à vendre dans le mois",
            attendu: k.articlesVises,
            calcul: `${eur(k.caVise)} ÷ (${eur(k.prixMoyen)} × ${(1 + HAUSSE_DU_PRIX_MOYEN).toLocaleString("fr-FR")}) = ${qte(k.articlesVises)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          `Les hausses se multiplient, elles ne s'ajoutent pas : (1 + ${pct(HAUSSE_DU_PRIX_MOYEN * 100)}) × (1 + ${pct(k.hausseDeLIndice)}) = 1 + ${pct(HAUSSE_VISEE * 100)}. Soustraire les pourcentages (${pct((HAUSSE_VISEE - HAUSSE_DU_PRIX_MOYEN) * 100)}) donnerait un indice un peu trop haut. Il faut ${deux(k.indiceVise)} articles par passage au lieu de ${deux(k.indice)}, soit ${qte(k.articlesVises)} articles en caisse au lieu de ${qte(k.m.articlesEnCaisse)}.`,
        ];
      },
    },
    {
      id: "le-panier-avec-les-comites",
      objectifs: [4],
      type: "montants",
      titre: "Le panier, si l'on comptait les comités",
      notions: ["average_basket", "segmentation"],
      tableau: tableauDuMois,
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `Les ${qte(k.comites.tickets)} commandes des comités d'entreprise ne passent pas en caisse. Un stagiaire les compte pourtant comme des passages. Calculez le panier d'une commande de comité, puis le chiffre d'affaires, les « passages » et le panier moyen qu'il obtient.`;
      },
      champs: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          { libelle: "Panier d'une commande de comité", attendu: k.panierDesComites, calcul: `${eur(k.comites.chiffreDAffaires)} ÷ ${qte(k.comites.tickets)} = ${eur(k.panierDesComites)}` },
          { libelle: "Chiffre d'affaires, comités compris", attendu: k.avecComites.chiffreDAffaires, calcul: `${eur(k.m.chiffreDAffairesEnCaisse)} + ${eur(k.comites.chiffreDAffaires)} = ${eur(k.avecComites.chiffreDAffaires)}` },
          { libelle: "« Passages », comités compris", attendu: k.avecComites.tickets, calcul: `${qte(k.m.tickets)} + ${qte(k.comites.tickets)} = ${qte(k.avecComites.tickets)}` },
          { libelle: "Panier moyen du stagiaire", attendu: k.avecComites.panier, calcul: `${eur(k.avecComites.chiffreDAffaires)} ÷ ${qte(k.avecComites.tickets)} = ${eur(k.avecComites.panier)}` },
        ];
      },
      explication: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          `${qte(k.comites.tickets)} commandes à ${eur(k.panierDesComites)} chacune porteraient le panier de ${eur(k.panier)} à ${eur(k.avecComites.panier)}. Une moyenne se laisse tirer par quelques valeurs très fortes : c'est pourquoi le panier moyen se calcule sur la caisse seule, chiffre d'affaires encaissé ÷ passages en caisse.`,
        ];
      },
    },
    {
      id: "quel-panier-viser",
      objectifs: [4],
      type: "choix",
      titre: "De quel panier parle-t-on ?",
      notions: ["average_basket", "segmentation"],
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        return `La responsable veut fixer aux vendeurs un objectif de panier moyen pour ${k.f.moisDeReference} prochain, à ${pct(HAUSSE_VISEE * 100)} au-dessus de celui d'aujourd'hui. Sur quel panier le calculer ?`;
      },
      options: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          {
            texte: `${eur(k.panier)}, celui de la caisse`,
            juste: true,
            retour: `Oui. Les vendeurs agissent sur les clients qui passent en caisse ; les ${qte(k.comites.tickets)} commandes des comités, à ${eur(k.panierDesComites)}, se négocient ailleurs et varient d'un mois à l'autre. Un objectif sur ${eur(k.avecComites.panier)} récompenserait ou punirait les vendeurs pour des commandes qu'ils ne font pas.`,
          },
          {
            texte: `${eur(k.avecComites.panier)}, celui qui compte aussi les commandes des comités`,
            juste: false,
            retour: `Non : ce panier mêle ${qte(k.comites.tickets)} commandes à ${eur(k.panierDesComites)} et ${qte(k.m.tickets)} passages en caisse. Un comité de moins le mois prochain ferait rater l'objectif sans que les vendeurs y soient pour rien.`,
          },
          {
            texte: `${eur(k.prixMoyen)}, le prix moyen d'un article`,
            juste: false,
            retour: `Non : c'est le prix moyen d'un article, pas le panier. Le panier est ce que rapporte un passage, ${deux(k.indice)} articles en moyenne.`,
          },
        ];
      },
    },
    {
      id: "le-comite-qui-paie-tard",
      objectifs: [4],
      type: "montants",
      titre: "Le comité qui paie tard",
      notions: ["average_basket", "payment_terms"],
      question: (c) => {
        const k = indicateursDuPointDeVente(c);
        const v = suivreUnMauvaisPayeur(CSE_DES_LABORATOIRES_VERNAL);
        return `Hypothèse du cours : ${v.client} passe ${v.objet}, une commande moyenne de comité, ${eur(v.ht)} HT, soit ${eur(v.ttc)} TTC, payable à ${qte(v.delaiConvenu)} jours. Le trésorier du comité ne signe les virements qu'à la réunion du mois : il paie ${qte(v.retard)} jours en retard. ${k.f.entreprise} vend des biens, elle a déjà déclaré la TVA à la livraison et finance la commande toutes taxes comprises. Calculez ce que le retard lui coûte au découvert, à ${pct(v.tauxDeFinancement * 100)} l'an, les pénalités de retard à ${pct(TAUX_DES_PENALITES * 100)} l'an, puis tout ce qu'elle peut réclamer, indemnité forfaitaire comprise.`;
      },
      champs: () => {
        const v = suivreUnMauvaisPayeur(CSE_DES_LABORATOIRES_VERNAL);
        return [
          { libelle: "Coût du retard", attendu: v.coutDuRetard, calcul: `${eur(v.finance)} × ${pct(v.tauxDeFinancement * 100)} × ${qte(v.retard)} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(v.coutDuRetard)}` },
          { libelle: "Pénalités de retard", attendu: v.penalites, calcul: `${eur(v.ttc)} × ${pct(TAUX_DES_PENALITES * 100)} × ${qte(v.retard)} ÷ ${JOURS_DE_L_ANNEE_CIVILE} = ${eur(v.penalites)}` },
          { libelle: "Réclamable, indemnité comprise", attendu: v.reclamable, calcul: `${eur(v.penalites)} + ${eur(v.indemnite)} = ${eur(v.reclamable)}` },
        ];
      },
      explication: () => {
        const v = suivreUnMauvaisPayeur(CSE_DES_LABORATOIRES_VERNAL);
        const lIndemnitePese = v.indemnite > v.penalites;
        return [
          `Sur une petite facture, les pénalités pèsent peu : ${eur(v.penalites)} pour ${qte(v.retard)} jours. L'indemnité forfaitaire de ${eur(v.indemnite)}, due par facture quelle que soit la durée du retard, ${lIndemnitePese ? "pèse plus qu'elles" : "pèse moins qu'elles"} : ${eur(v.reclamable)} réclamables, quand le retard coûte ${eur(v.coutDuRetard)}.`,
          `Un comité d'entreprise achète pour ses salariés, mais il paie comme un professionnel : le délai convenu et les pénalités s'appliquent. Un gros panier se négocie avec ses conditions de paiement, et un retard se relance, comme pour tout client professionnel.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["average_basket", "conversion_rate", "revenue", "sales_per_sqm"],
      tableau: (c) => tableauDesIndicateurs(indicateursDuPointDeVente(c)),
      texte: (c) => {
        const k = indicateursDuPointDeVente(c);
        return [
          `Le chiffre d'affaires en caisse de ${k.f.entreprise} se décompose en quatre indicateurs qui se multiplient : ${qte(k.m.entrees)} entrées × ${pct(k.transformation)} de transformation × ${deux(k.indice)} articles par passage × ${eur(k.prixMoyen)} = ${eur(k.m.chiffreDAffairesEnCaisse)}. Les commandes des comités (${eur(k.m.commandes.chiffreDAffaires)}) s'y ajoutent pour faire ${eur(k.m.chiffreDAffaires)}. Le panier moyen (${eur(k.panier)}) est le produit des deux derniers. Un objectif se chiffre levier par levier, et deux hausses se multiplient.`,
          `Deux pièges. Le taux de transformation rapporte les passages aux entrées (${pct(k.transformation)}) ; le taux de service rapporte les ventes à la demande (${pct(k.tauxDeService)}) : l'un mesure la vente, l'autre le rayon. Et une moyenne se laisse tirer : compter les commandes des comités comme des passages porterait le panier à ${eur(k.avecComites.panier)}. Dites toujours de quel panier vous parlez.`,
          "Au niveau de l'examen, vous savez calculer et interpréter les indicateurs d'un point de vente, décomposer le chiffre d'affaires en ses leviers, chiffrer un objectif à rebours, et choisir l'indicateur qui juge l'équipe sur ce qu'elle fait.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Chiffre d'affaires en caisse = entrées × taux de transformation × indice de vente × prix moyen d'un article. Taux de transformation = passages en caisse ÷ entrées. Indice de vente = articles ÷ passages. Panier moyen = chiffre d'affaires en caisse ÷ passages en caisse = indice de vente × prix moyen. Taux de service = articles vendus ÷ articles demandés.",
    },
  ],
};
