import type { CompanyRoundResult, RoundDecisions } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import { rejouerAvec } from "../gestion-de-la-pme";
import { METIERS } from "../metiers";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE PRIX AFFICHÉ, HORS TAXES, TOUTES TAXES ET LA PROMOTION (CAP Équipier
 * polyvalent du commerce, palier 1).
 *
 * Le geste de l'équipier devant le rayon : lire le prix hors taxes que l'arène pratique, poser
 * sur l'étiquette le prix toutes taxes que paie le client, puis l'étiquette d'une promotion
 * (l'ancien prix, la remise, le nouveau prix). Et ce que la promotion a fait vendre : l'arène
 * rejoue le trimestre avec le prix de l'article baissé d'autant.
 *
 * Il ne double ni « Le prix psychologique » (les repères du client, les seuils), ni « La
 * promotion qui paie » (la marge et le volume nécessaire, en BTS MCO), ni « Taux de marque »
 * (la marge commerciale) : ici, pas de marge ni de coût, seulement l'étiquette, au niveau CAP.
 *
 * LA BOUTIQUE SEULE. C'est la seule entreprise du cours dont l'unité est un article posé en
 * rayon, avec son prix : le commerce en ligne vend des commandes (un panier moyen, pas une
 * étiquette), le restaurant des couverts.
 *
 * D'où viennent les chiffres. Les prix hors taxes sont ceux que la gestion équilibrée pratique
 * dans l'année du cours (`anneeJouee`, détail par article). L'arène joue hors taxes : la TVA est
 * celle que le cours applique au métier (`METIERS`, 20 % sur les vêtements). La promotion est
 * jouée par le moteur (`rejouerAvec`, clé « le-prix-affiche:… ») : même année, même graine,
 * seul le prix de l'article change, au trimestre de la promotion. La remise, le trimestre et
 * l'arrondi de l'étiquette sont des hypothèses du cours, nommées ci-dessous.
 */

/** Les entreprises du chapitre : celles qui ont des articles en rayon, avec une étiquette. */
export const ENTREPRISES_DU_MAGASIN = ["boutique"] as const;

/** L'article mis en promotion : le pull le plus vendu de la boutique (hypothèse du cours). */
export const ARTICLE_EN_PROMOTION = "pull-col-rond";

/** L'article dont l'élève vérifie l'étiquette (hypothèse du cours). */
export const ARTICLE_A_ETIQUETER = "echarpe";

/** La remise de la promotion : 20 % (hypothèse du cours, une remise courante en magasin). */
export const REMISE_DE_LA_PROMOTION = 0.2;

/**
 * Le trimestre de la promotion : le printemps, la fin de la saison des pulls (hypothèse du
 * cours). Les trimestres se comptent comme le moteur les compte, à partir de 1.
 */
export const TRIMESTRE_DE_LA_PROMOTION = 2;

/**
 * L'ARRONDI DE L'ÉTIQUETTE (hypothèse du cours) : un prix affiché se termine par un multiple de
 * 10 centimes. On arrondit toujours vers le bas : le client ne paie jamais plus que le prix
 * calculé, et une remise annoncée de 20 % vaut au moins 20 %.
 */
export const ARRONDI_DE_L_ETIQUETTE = 0.1;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
/** « de » devant un nom : élidé devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** Le prix affiché : au centime, puis aux 10 centimes du dessous. */
export function arrondiDeLEtiquette(x: number): number {
  const centimes = Math.round(x * 100);
  const pas = Math.round(ARRONDI_DE_L_ETIQUETTE * 100);
  return Math.floor(centimes / pas + 1e-9) * pas / 100;
}

export interface Etiquette {
  code: string;
  nom: string;
  ht: number;
  tva: number;
  /** Le prix toutes taxes, au centime. */
  ttc: number;
  /** Le prix posé sur l'étiquette, arrondi. */
  affiche: number;
}

/** Les ventes d'un article à un trimestre ; zéro si l'entreprise a fait défaillance avant. */
export function ventesDeLArticle(annee: readonly CompanyRoundResult[], trimestre: number, article: string) {
  // Une entreprise défaillante ne vend plus les trimestres suivants : on tranche d'abord.
  if (annee.slice(0, trimestre - 1).some((r) => r.defaillant)) return { vendus: 0, chiffreDAffaires: 0, manques: 0 };
  const p = annee[trimestre - 1]!.products?.[article];
  if (!p) throw new Error(`Pas d'article ${article} au trimestre ${trimestre}`);
  return { vendus: Math.round(p.sold), chiffreDAffaires: Math.round(p.revenue), manques: Math.round(p.lost) };
}

/** Les étiquettes du rayon : le prix hors taxes de l'arène, la TVA du métier, le prix affiché. */
export function etiquettesDuRayon(c: Cas, trimestre = 1): Etiquette[] {
  const s = scenarioByCode(c.code).scenario;
  const r = anneeJouee(c.code).partie.rounds[trimestre - 1]!.results["joueur"]!;
  const taux = METIERS[c.code]!.vente.tauxTva;
  return (s.products ?? []).map((p) => {
    const ht = auCentime(r.products![p.code]!.price);
    const tva = auCentime(ht * taux);
    const ttc = auCentime(ht + tva);
    return { code: p.code, nom: p.name, ht, tva, ttc, affiche: arrondiDeLEtiquette(ttc) };
  });
}

/** Le trimestre de la promotion rejoué : seul le prix de l'article change. */
export function anneeAvecLaPromotion(code: string, article: string, trimestre: number, prixHt: number, cle: string) {
  return rejouerAvec(code, `le-prix-affiche:${cle}`, (t, d): RoundDecisions | undefined => {
    if (t !== trimestre) return undefined;
    if (!d.products?.[article]) throw new Error(`Pas de décision pour l'article ${article}`);
    return { ...d, products: { ...d.products, [article]: { ...d.products[article]!, price: prixHt } } };
  });
}

export type BilanDeLaPromotion = "plus-et-plus" | "plus-mais-moins" | "rien-de-plus";

/** Une promotion : l'étiquette, puis ce que l'arène a vendu avec et sans elle. */
export function promotionDuRayon(c: Cas, remise: number, trimestre: number, cle: string) {
  const taux = METIERS[c.code]!.vente.tauxTva;
  const article = etiquettesDuRayon(c, trimestre).find((e) => e.code === ARTICLE_EN_PROMOTION)!;
  const montantDeLaRemise = auCentime(article.affiche * remise);
  const calcule = auCentime(article.affiche - montantDeLaRemise);
  const nouveauPrix = arrondiDeLEtiquette(calcule);
  // L'arène joue hors taxes : le prix de la promotion, sans la TVA que le cours y ajoute.
  const prixHtPromo = nouveauPrix / (1 + taux);
  const sans = ventesDeLArticle(rejouerAvec(c.code, "reference", () => undefined), trimestre, ARTICLE_EN_PROMOTION);
  const avec = ventesDeLArticle(anneeAvecLaPromotion(c.code, ARTICLE_EN_PROMOTION, trimestre, prixHtPromo, cle), trimestre, ARTICLE_EN_PROMOTION);
  const ventesEnPlus = avec.vendus - sans.vendus;
  const chiffreEnPlus = avec.chiffreDAffaires - sans.chiffreDAffaires;
  const bilan: BilanDeLaPromotion = ventesEnPlus <= 0 ? "rien-de-plus" : chiffreEnPlus > 0 ? "plus-et-plus" : "plus-mais-moins";
  return {
    taux,
    remise,
    trimestre,
    article,
    montantDeLaRemise,
    calcule,
    nouveauPrix,
    arrondi: auCentime(calcule - nouveauPrix) > 0,
    prixHtPromo: auCentime(prixHtPromo),
    sans,
    avec,
    ventesEnPlus,
    chiffreEnPlus,
    bilan,
  };
}

/** Ce que la promotion a fait, en une phrase : « 611 articles vendus en plus, et un chiffre d'affaires qui monte de 11 710 € ». */
export function faitsDeLaPromotion(p: { ventesEnPlus: number; chiffreEnPlus: number }): string {
  const ventes =
    p.ventesEnPlus > 0
      ? `${qte(p.ventesEnPlus)} article${p.ventesEnPlus > 1 ? "s" : ""} vendu${p.ventesEnPlus > 1 ? "s" : ""} en plus`
      : p.ventesEnPlus === 0
        ? "aucun article vendu en plus"
        : `${qte(-p.ventesEnPlus)} article${p.ventesEnPlus < -1 ? "s" : ""} vendu${p.ventesEnPlus < -1 ? "s" : ""} en moins`;
  const chiffre =
    p.chiffreEnPlus > 0
      ? `un chiffre d'affaires qui monte de ${eur(p.chiffreEnPlus)}`
      : p.chiffreEnPlus < 0
        ? `un chiffre d'affaires qui baisse de ${eur(-p.chiffreEnPlus)}`
        : "le même chiffre d'affaires";
  return `${ventes}, et ${chiffre}`;
}

/** La promotion du chapitre : 20 % sur le pull le plus vendu, au printemps. */
export const promotionDuChapitre = (c: Cas) => promotionDuRayon(c, REMISE_DE_LA_PROMOTION, TRIMESTRE_DE_LA_PROMOTION, "promotion-de-printemps");

export function tableauDesEtiquettes(c: Cas): TableauDeDonnees {
  return {
    titre: `Les prix hors taxes des articles ${dE(c.entreprise)}`,
    colonnes: ["Prix hors taxes"],
    lignes: etiquettesDuRayon(c).map((e) => ({ libelle: e.nom, valeurs: [eur(e.ht)] })),
  };
}

export function tableauDeLaPromotion(c: Cas): TableauDeDonnees {
  const p = promotionDuChapitre(c);
  return {
    titre: `L'article « ${p.article.nom} » au trimestre ${p.trimestre}, rejoué par l'arène`,
    colonnes: ["Sans la promotion", "Avec la promotion"],
    lignes: [
      { libelle: "Prix affiché", valeurs: [eur(p.article.affiche), eur(p.nouveauPrix)] },
      { libelle: "Articles vendus", valeurs: [qte(p.sans.vendus), qte(p.avec.vendus)] },
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(p.sans.chiffreDAffaires), eur(p.avec.chiffreDAffaires)] },
      { libelle: "Ventes manquées (rayon vide)", valeurs: [qte(p.sans.manques), qte(p.avec.manques)] },
    ],
  };
}

const ARTICLE = (c: Cas) => etiquettesDuRayon(c).find((e) => e.code === ARTICLE_EN_PROMOTION)!;
const ECHARPE = (c: Cas) => etiquettesDuRayon(c).find((e) => e.code === ARTICLE_A_ETIQUETER)!;

export const LE_PRIX_AFFICHE: Chapitre = {
  code: "le-prix-affiche",
  parcours: "cap-epc",
  palier: 1,
  blocs: ["CAP EPC · Bloc 2 · Mettre en valeur et approvisionner"],
  titre: "Le prix affiché : hors taxes, toutes taxes et la promotion",
  accroche:
    "Le magasin achète et vend hors taxes. Le client, lui, lit sur l'étiquette le prix toutes taxes. Poser le bon prix, puis l'étiquette d'une promotion, et voir ce qu'elle fait vendre.",
  objectifs: [
    "Passer du prix hors taxes au prix toutes taxes",
    "Vérifier une étiquette",
    "Calculer une remise et le nouveau prix affiché",
    "Dire ce qu'une promotion a fait vendre",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_MAGASIN,
    pourquoi: "ce chapitre pose les étiquettes d'un magasin, où chaque article a son prix en rayon.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le prix du magasin, le prix du client",
      notions: ["vat_payable"],
      tableau: tableauDesEtiquettes,
      texte: (c) => {
        const taux = METIERS[c.code]!.vente.tauxTva;
        return [
          `${c.entreprise} est une boutique de pulls. Dans l'arène, elle fixe ses prix hors taxes (HT) : c'est ce que le magasin garde.`,
          `Le client paie en plus une taxe, la TVA. Sur les vêtements, elle est de ${pct(taux)} du prix hors taxes. L'État la reçoit, pas le magasin.`,
          "L'étiquette montre toujours le prix toutes taxes comprises (TTC) : le prix que le client paie en caisse.",
        ];
      },
      repere: (c) => `TVA = prix HT × ${pct(METIERS[c.code]!.vente.tauxTva)}. Prix TTC = prix HT + TVA.`,
    },
    {
      id: "prix-ttc",
      type: "montants",
      titre: "Le prix toutes taxes",
      notions: ["vat_payable"],
      question: (c) => {
        const a = ARTICLE(c);
        return `L'article « ${a.nom} » se vend ${eur(a.ht)} hors taxes. Calculez la TVA (${pct(METIERS[c.code]!.vente.tauxTva)} du prix HT), puis le prix TTC.`;
      },
      champs: (c) => {
        const a = ARTICLE(c);
        const taux = METIERS[c.code]!.vente.tauxTva;
        return [
          { libelle: `TVA sur l'article « ${a.nom} »`, attendu: a.tva, calcul: `${eur(a.ht)} × ${pct(taux)} = ${eur(a.tva)}` },
          { libelle: `Prix TTC de l'article « ${a.nom} »`, attendu: a.ttc, calcul: `${eur(a.ht)} + ${eur(a.tva)} = ${eur(a.ttc)}` },
        ];
      },
      explication: (c) => {
        const a = ARTICLE(c);
        return [
          a.affiche === a.ttc
            ? `L'étiquette affiche ${eur(a.affiche)}. Le prix tombe juste : pas besoin d'arrondir.`
            : `Le prix calculé est ${eur(a.ttc)}. L'étiquette affiche ${eur(a.affiche)} : on arrondit aux 10 centimes du dessous.`,
        ];
      },
    },
    {
      id: "la-bonne-etiquette",
      type: "choix",
      titre: "La bonne étiquette",
      notions: ["vat_payable"],
      tableau: tableauDesEtiquettes,
      question: (c) => `Vous posez les étiquettes du rayon. Quel prix doit afficher l'article « ${ECHARPE(c).nom} » ?`,
      options: (c) => {
        const e = ECHARPE(c);
        const taux = METIERS[c.code]!.vente.tauxTva;
        const sansTva = auCentime(e.ht - e.tva);
        const plusLeTaux = auCentime(e.ht + taux * 100);
        return [
          {
            texte: eur(e.affiche),
            juste: true,
            retour: `Oui : ${eur(e.ht)} + ${eur(e.tva)} de TVA = ${eur(e.ttc)}. C'est le prix que le client paie.`,
          },
          {
            texte: eur(e.ht),
            juste: false,
            retour: `Non : ${eur(e.ht)}, c'est le prix hors taxes. Il manque la TVA, ${eur(e.tva)}.`,
          },
          {
            texte: eur(sansTva),
            juste: false,
            retour: `Non : la TVA a été retirée au lieu d'être ajoutée. ${eur(e.ht)} + ${eur(e.tva)} = ${eur(e.ttc)}.`,
          },
          {
            texte: eur(plusLeTaux),
            juste: false,
            retour: `Non : on a ajouté ${eur(taux * 100)}. La TVA est ${pct(taux)} du prix, soit ${eur(e.tva)}.`,
          },
        ];
      },
    },
    {
      id: "la-remise",
      type: "montants",
      titre: "La remise de la promotion",
      notions: ["markdown"],
      question: (c) => {
        const p = promotionDuChapitre(c);
        return `Au trimestre ${p.trimestre}, la boutique fait une promotion : ${pct(p.remise)} sur l'article « ${p.article.nom} », affiché ${eur(p.article.affiche)}. Calculez le montant de la remise, puis le nouveau prix affiché (arrondi aux 10 centimes du dessous s'il le faut).`;
      },
      champs: (c) => {
        const p = promotionDuChapitre(c);
        return [
          { libelle: "Montant de la remise", attendu: p.montantDeLaRemise, calcul: `${eur(p.article.affiche)} × ${pct(p.remise)} = ${eur(p.montantDeLaRemise)}` },
          {
            libelle: "Nouveau prix affiché",
            attendu: p.nouveauPrix,
            calcul: p.arrondi
              ? `${eur(p.article.affiche)} − ${eur(p.montantDeLaRemise)} = ${eur(p.calcule)}, arrondi à ${eur(p.nouveauPrix)}`
              : `${eur(p.article.affiche)} − ${eur(p.montantDeLaRemise)} = ${eur(p.nouveauPrix)}`,
          },
        ];
      },
      explication: (c) => {
        const p = promotionDuChapitre(c);
        return [
          `Le client paie ${eur(p.nouveauPrix)} au lieu de ${eur(p.article.affiche)}. ${p.arrondi ? "Le prix a été arrondi vers le bas : la remise reste au moins celle annoncée." : "Le prix tombe juste : pas d'arrondi."}`,
          `Sans la TVA, le magasin vend l'article ${eur(p.prixHtPromo)} au lieu de ${eur(p.article.ht)} : c'est ce prix que l'arène joue.`,
        ];
      },
    },
    {
      id: "l-etiquette-promo",
      type: "choix",
      titre: "L'étiquette de la promotion",
      notions: ["markdown"],
      question: (c) => {
        const p = promotionDuChapitre(c);
        return `Vous changez l'étiquette de l'article « ${p.article.nom} » pour la promotion. Que doit-elle montrer ?`;
      },
      options: (c) => {
        const p = promotionDuChapitre(c);
        return [
          {
            texte: "L'ancien prix barré, la remise et le nouveau prix",
            juste: true,
            retour: `Oui : ${eur(p.article.affiche)} barré, ${pct(p.remise)} et ${eur(p.nouveauPrix)}. Le client voit ce qu'il gagne. La loi demande que le prix barré soit le prix de référence : le plus bas pratiqué dans les 30 jours d'avant la promotion.`,
          },
          {
            texte: "Le nouveau prix, seul",
            juste: false,
            retour: `Non : sans l'ancien prix, le client ne voit pas la promotion. Il faut ${eur(p.article.affiche)} barré à côté de ${eur(p.nouveauPrix)}.`,
          },
          {
            texte: "Le nouveau prix hors taxes",
            juste: false,
            retour: `Non : le client paie toutes taxes. L'étiquette affiche ${eur(p.nouveauPrix)}, pas ${eur(p.prixHtPromo)}.`,
          },
        ];
      },
    },
    {
      id: "ce-que-la-promotion-vend",
      type: "montants",
      titre: "Ce que la promotion a fait vendre",
      notions: ["markdown", "revenue", "stock"],
      tableau: tableauDeLaPromotion,
      question: () =>
        "L'arène a rejoué le trimestre avec la promotion. Seul ce prix a changé. D'après le tableau, calculez les articles vendus en plus, puis le chiffre d'affaires hors taxes en plus (négatif s'il baisse).",
      champs: (c) => {
        const p = promotionDuChapitre(c);
        return [
          { libelle: "Articles vendus en plus", attendu: p.ventesEnPlus, calcul: `${qte(p.avec.vendus)} − ${qte(p.sans.vendus)} = ${qte(p.ventesEnPlus)}` },
          {
            libelle: "Chiffre d'affaires en plus",
            attendu: p.chiffreEnPlus,
            calcul: `${eur(p.avec.chiffreDAffaires)} − ${eur(p.sans.chiffreDAffaires)} = ${eur(p.chiffreEnPlus)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = promotionDuChapitre(c);
        return [
          p.ventesEnPlus > 0
            ? `La promotion a fait vendre ${qte(p.ventesEnPlus)} articles de plus.`
            : "La promotion n'a fait vendre aucun article de plus.",
          p.avec.manques > p.sans.manques
            ? `Mais ${qte(p.avec.manques)} articles n'ont pas pu être vendus : le rayon était vide. Une promotion se prépare avec la réserve.`
            : "Le rayon a suivi : aucune vente de plus n'a été manquée.",
        ];
      },
    },
    {
      id: "bilan",
      type: "choix",
      titre: "Le bilan de la promotion",
      notions: ["markdown", "revenue"],
      question: (c) => {
        const p = promotionDuChapitre(c);
        return `Avec la promotion, la boutique vend ${qte(p.avec.vendus)} articles « ${p.article.nom} » au lieu de ${qte(p.sans.vendus)}, pour ${eur(p.avec.chiffreDAffaires)} au lieu de ${eur(p.sans.chiffreDAffaires)}. Que dire de la promotion ?`;
      },
      options: (c) => {
        const p = promotionDuChapitre(c);
        const faits = `${faitsDeLaPromotion(p)}.`;
        return [
          {
            texte: "Elle fait vendre plus, et le chiffre d'affaires monte",
            juste: p.bilan === "plus-et-plus",
            retour: p.bilan === "plus-et-plus" ? `Oui : ${faits} Le prix baisse, mais les ventes montent plus vite.` : `Non : ${faits}`,
          },
          {
            texte: "Elle fait vendre plus, mais le chiffre d'affaires baisse",
            juste: p.bilan === "plus-mais-moins",
            retour: p.bilan === "plus-mais-moins" ? `Oui : ${faits} Les ventes en plus ne paient pas la baisse du prix.` : `Non : ${faits}`,
          },
          {
            texte: "Elle ne fait vendre aucun article de plus",
            juste: p.bilan === "rien-de-plus",
            retour: p.bilan === "rien-de-plus" ? `Oui : ${faits} Le rayon ne pouvait pas vendre plus.` : `Non : ${faits}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["vat_payable", "markdown"],
      texte: (c) => {
        const p = promotionDuChapitre(c);
        return [
          `L'article « ${p.article.nom} » se vend ${eur(p.article.ht)} hors taxes. Avec la TVA, l'étiquette affiche ${eur(p.article.affiche)}. En promotion, ${eur(p.nouveauPrix)}.`,
          "Avant de poser une étiquette, l'équipier vérifie le prix TTC. Pour une promotion, il montre l'ancien prix barré et vérifie que la réserve peut remplir le rayon.",
        ];
      },
      repere: () => "Prix TTC = prix HT + TVA. Remise = prix affiché × taux de remise. Nouveau prix = prix affiché − remise.",
    },
  ],
};
