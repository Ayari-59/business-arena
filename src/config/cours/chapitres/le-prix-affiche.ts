import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import {
  ARTICLE_A_ETIQUETER,
  REMISES_ESSAYEES,
  etiquetteDe,
  etiquettesDuRayon,
  promotionDeFevrier,
  remiseQuiGardeLeChiffre,
  remiseQuiPaieSansRupture,
  type BilanDeLaPromotion,
} from "../monde/vente-et-caisse";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE PRIX AFFICHÉ, HORS TAXES, TOUTES TAXES ET LA PROMOTION (CAP Équipier
 * polyvalent du commerce, palier 1).
 *
 * Le geste de l'équipier devant le rayon : lire le prix hors taxes du magasin, poser sur
 * l'étiquette le prix toutes taxes que paie le client, puis l'étiquette d'une promotion (l'ancien
 * prix, la remise, le nouveau prix), et voir ce que la promotion fait vendre quand le rayon ne
 * suit pas. Puis l'expérience : un curseur sur la remise (jusqu'où remiser sans perdre de chiffre
 * d'affaires ?) et un laboratoire (la remise qui fait vendre plus sans laisser un client sans son
 * pull).
 *
 * Il ne double ni « Le prix psychologique » (les repères du client, les seuils), ni « La
 * promotion qui paie » (la marge et le volume nécessaire, en BTS MCO), ni « Taux de marque »
 * (la marge commerciale) : ici, pas de marge ni de coût, seulement l'étiquette et les ventes.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts), ses
 * étiquettes rondes (66 € TTC font 55 € HT), la TVA de 20 % des vêtements, et la promotion que la
 * fiche envisage (10 % sur le pull col rond en février, 700 pulls en rayon, la demande de janvier ;
 * une remise de 1 % fait demander 3 % de pulls de plus). Les calculs sont dans
 * monde/vente-et-caisse.ts. HYPOTHÈSES DU COURS : l'arrondi de l'étiquette aux 10 centimes du
 * dessous, l'écharpe comme article à étiqueter, et les remises du laboratoire de 5 en 5 %.
 *
 * CE QUI A CHANGÉ. Le chapitre rejouait dans l'arène le premier trimestre avec 20 % de remise sur le
 * pull col rond (52,80 € au lieu de 66 € ; 1 945 pulls au lieu de 1 726, 85 580 € au lieu de
 * 94 947 €, 938 ventes manquées). Il lit maintenant la promotion de février de la fiche : 10 %, une
 * étiquette à 59,40 € ; 100 pulls vendus en plus, 1 650 € de chiffre d'affaires en plus, mais 80
 * clients sans pull.
 */

/** Les entreprises du chapitre : la boutique du cours, où chaque article a son étiquette en rayon. */
export const ENTREPRISES_DU_MAGASIN = ["boutique"] as const;

/** La remise de la promotion du chapitre : celle que la fiche envisage pour février. */
export const REMISE_DE_LA_PROMOTION = BOUTIQUES_DU_COURS.boutique!.promotion.remise;

/** Les remises du laboratoire, de 5 en 5 % (hypothèse du cours : les remises que l'on affiche en magasin). */
export const PAS_DES_REMISES = 5;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
/** « de » devant un nom : élidé devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Ce que la promotion a fait, en une phrase : « 100 articles vendus en plus, et un chiffre d'affaires qui monte de 1 650 € ». */
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

/** Le tableau d'une promotion : le prix, la demande, les ventes, le chiffre d'affaires et les ventes manquées, avec et sans. */
export function tableauDUnePromotion(titre: string, p: ReturnType<typeof promotionDeFevrier>): TableauDeDonnees {
  return {
    titre,
    colonnes: ["Sans la promotion", "Avec la promotion"],
    lignes: [
      { libelle: "Prix affiché", valeurs: [eur(p.article.affiche), eur(p.nouveauPrix)] },
      { libelle: "Articles demandés par les clients", valeurs: [qte(p.sans.demande), qte(p.avec.demande)] },
      { libelle: "Articles vendus", valeurs: [qte(p.sans.vendus), qte(p.avec.vendus)] },
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(p.sans.chiffreDAffaires), eur(p.avec.chiffreDAffaires)] },
      { libelle: "Ventes manquées (rayon vide)", valeurs: [qte(p.sans.manques), qte(p.avec.manques)] },
    ],
  };
}

const promo = (c: Cas) => promotionDeFevrier(ficheDe(c));
const ARTICLE = (c: Cas) => promo(c).article;
const ECHARPE = (c: Cas) => etiquetteDe(ficheDe(c), ARTICLE_A_ETIQUETER);

export function tableauDesEtiquettes(c: Cas): TableauDeDonnees {
  return {
    titre: `Les prix hors taxes des articles ${dE(c.entreprise)}`,
    colonnes: ["Prix hors taxes"],
    lignes: etiquettesDuRayon(ficheDe(c)).map((e) => ({ libelle: e.nom, valeurs: [eur(e.ht)] })),
  };
}

const tableauDeLaPromotion = (c: Cas) => tableauDUnePromotion(`L'article « ${ARTICLE(c).nom} » en ${ficheDe(c).promotion.mois}`, promo(c));

/** Le mois à une remise donnée, en % entier, au stock en rayon de la fiche. */
const aLaRemise = (c: Cas, remise: number) => promotionDeFevrier(ficheDe(c), remise / 100);

/** La remise du laboratoire qui relève le défi, sur les crans du levier. */
export const remiseDuLaboratoire = (f: FicheDeLaBoutique) =>
  Array.from({ length: REMISES_ESSAYEES.max / PAS_DES_REMISES + 1 }, (_, i) => i * PAS_DES_REMISES).filter((r) => remiseQuiPaieSansRupture(f, r / 100));

export const LE_PRIX_AFFICHE: Chapitre = {
  code: "le-prix-affiche",
  parcours: "cap-epc",
  palier: 1,
  blocs: ["CAP EPC · Bloc 2 · Mettre en valeur et approvisionner"],
  titre: "Le prix affiché : hors taxes, toutes taxes et la promotion",
  accroche:
    "Le magasin achète et vend hors taxes. Le client, lui, lit sur l'étiquette le prix toutes taxes. Poser le bon prix, puis l'étiquette d'une promotion, et voir ce qu'elle fait vendre quand le rayon suit, ou ne suit pas.",
  objectifs: [
    "Passer du prix hors taxes au prix toutes taxes",
    "Vérifier une étiquette",
    "Calculer une remise et le nouveau prix affiché",
    "Dire ce qu'une promotion a fait vendre",
    "Choisir une remise que le rayon peut servir",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_MAGASIN,
    pourquoi: "ce chapitre pose les étiquettes de la boutique du cours, MAILLE & CO, où chaque article a son prix en rayon.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le prix du magasin, le prix du client",
      notions: ["vat_payable"],
      tableau: tableauDesEtiquettes,
      texte: (c) => {
        const a = ARTICLE(c);
        return [
          `${c.entreprise} est une boutique de pulls. Elle fixe ses prix hors taxes (HT) : c'est ce que le magasin garde.`,
          `Le client paie en plus une taxe, la TVA. Sur les vêtements, elle est de ${pct(a.taux)} du prix hors taxes. L'État la reçoit, pas le magasin.`,
          "L'étiquette montre toujours le prix toutes taxes comprises (TTC) : le prix que le client paie en caisse.",
        ];
      },
      repere: (c) => `TVA = prix HT × ${pct(ARTICLE(c).taux)}. Prix TTC = prix HT + TVA.`,
    },
    {
      id: "prix-ttc",
      type: "montants",
      titre: "Le prix toutes taxes",
      notions: ["vat_payable"],
      question: (c) => {
        const a = ARTICLE(c);
        return `L'article « ${a.nom} » se vend ${eur(a.ht)} hors taxes. Calculez la TVA (${pct(a.taux)} du prix HT), puis le prix TTC.`;
      },
      champs: (c) => {
        const a = ARTICLE(c);
        return [
          { libelle: `TVA sur l'article « ${a.nom} »`, attendu: a.tva, calcul: `${eur(a.ht)} × ${pct(a.taux)} = ${eur(a.tva)}` },
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
        const sansTva = e.ht - e.tva;
        const plusLeTaux = e.ht + e.taux * 100;
        return [
          { texte: eur(e.affiche), juste: true, retour: `Oui : ${eur(e.ht)} + ${eur(e.tva)} de TVA = ${eur(e.ttc)}. C'est le prix que le client paie.` },
          { texte: eur(e.ht), juste: false, retour: `Non : ${eur(e.ht)}, c'est le prix hors taxes. Il manque la TVA, ${eur(e.tva)}.` },
          { texte: eur(sansTva), juste: false, retour: `Non : la TVA a été retirée au lieu d'être ajoutée. ${eur(e.ht)} + ${eur(e.tva)} = ${eur(e.ttc)}.` },
          { texte: eur(plusLeTaux), juste: false, retour: `Non : on a ajouté ${eur(e.taux * 100)}. La TVA est ${pct(e.taux)} du prix, soit ${eur(e.tva)}.` },
        ];
      },
    },
    {
      id: "la-remise",
      type: "montants",
      titre: "La remise de la promotion",
      notions: ["markdown"],
      question: (c) => {
        const p = promo(c);
        return `En ${ficheDe(c).promotion.mois}, la boutique fait une promotion : ${pct(p.remise)} sur l'article « ${p.article.nom} », affiché ${eur(p.article.affiche)}. Calculez le montant de la remise, puis le nouveau prix affiché (arrondi aux 10 centimes du dessous s'il le faut).`;
      },
      champs: (c) => {
        const p = promo(c);
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
        const p = promo(c);
        return [
          `Le client paie ${eur(p.nouveauPrix)} au lieu de ${eur(p.article.affiche)}. ${p.arrondi ? "Le prix a été arrondi vers le bas : la remise reste au moins celle annoncée." : "Le prix tombe juste : pas d'arrondi."}`,
          `Sans la TVA, le magasin vend l'article ${eur(p.prixHtPromo)} au lieu de ${eur(p.article.ht)} : c'est ce prix qui compte dans son chiffre d'affaires.`,
        ];
      },
    },
    {
      id: "l-etiquette-promo",
      type: "choix",
      titre: "L'étiquette de la promotion",
      notions: ["markdown"],
      question: (c) => `Vous changez l'étiquette de l'article « ${ARTICLE(c).nom} » pour la promotion. Que doit-elle montrer ?`,
      options: (c) => {
        const p = promo(c);
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
      titre: "Ce que la promotion fait vendre",
      notions: ["markdown", "revenue", "stock"],
      tableau: tableauDeLaPromotion,
      question: (c) => {
        const p = promo(c);
        return `Le tableau compare le mois avec et sans la promotion, avec ${qte(p.stockEnRayon)} pulls en rayon et en réserve. Calculez les articles vendus en plus, puis le chiffre d'affaires hors taxes en plus (négatif s'il baisse).`;
      },
      champs: (c) => {
        const p = promo(c);
        return [
          { libelle: "Articles vendus en plus", attendu: p.ventesEnPlus, calcul: `${qte(p.avec.vendus)} − ${qte(p.sans.vendus)} = ${qte(p.ventesEnPlus)}` },
          { libelle: "Chiffre d'affaires en plus", attendu: p.chiffreEnPlus, calcul: `${eur(p.avec.chiffreDAffaires)} − ${eur(p.sans.chiffreDAffaires)} = ${eur(p.chiffreEnPlus)}` },
        ];
      },
      explication: (c) => {
        const p = promo(c);
        return [
          p.ventesEnPlus > 0 ? `La promotion fait vendre ${qte(p.ventesEnPlus)} articles de plus.` : "La promotion ne fait vendre aucun article de plus.",
          p.avec.manques > 0
            ? `Mais ${qte(p.avec.demande)} pulls sont demandés, et le rayon n'en a que ${qte(p.stockEnRayon)} : ${qte(p.avec.manques)} clients repartent sans leur pull. Une promotion se prépare avec la réserve.`
            : "Le rayon suit : aucun client ne repart sans son pull.",
        ];
      },
    },
    {
      id: "bilan",
      type: "choix",
      titre: "Le bilan de la promotion",
      notions: ["markdown", "revenue"],
      question: (c) => {
        const p = promo(c);
        return `Avec la promotion, la boutique vend ${qte(p.avec.vendus)} articles « ${p.article.nom} » au lieu de ${qte(p.sans.vendus)}, pour ${eur(p.avec.chiffreDAffaires)} au lieu de ${eur(p.sans.chiffreDAffaires)}. Que dire de la promotion ?`;
      },
      options: (c) => {
        const p = promo(c);
        const faits = `${faitsDeLaPromotion(p)}.`;
        const option = (b: BilanDeLaPromotion, texte: string, oui: string) => ({ texte, juste: p.bilan === b, retour: p.bilan === b ? `Oui : ${faits} ${oui}` : `Non : ${faits}` });
        return [
          option("plus-et-plus", "Elle fait vendre plus, et le chiffre d'affaires monte", "Le prix baisse, mais les ventes montent plus vite."),
          option("plus-mais-moins", "Elle fait vendre plus, mais le chiffre d'affaires baisse", "Les ventes en plus ne paient pas la baisse du prix."),
          option("rien-de-plus", "Elle ne fait vendre aucun article de plus", "Le rayon ne pouvait pas vendre plus."),
        ];
      },
    },
    {
      id: "jusqu-ou-remiser",
      type: "curseur",
      titre: "Jusqu'où remiser ?",
      notions: ["markdown", "revenue"],
      question: (c) => {
        const p = promo(c);
        return `Faites varier la remise sur l'article « ${p.article.nom} », toujours avec ${qte(p.stockEnRayon)} pulls en rayon. Une courbe donne le chiffre d'affaires du mois avec la remise, l'autre le chiffre d'affaires sans promotion, ${eur(p.sans.chiffreDAffaires)}. Placez le curseur sur la plus forte remise qui garde au moins ce chiffre d'affaires, puis validez.`;
      },
      grandeur: () => ({ libelle: "Remise sur l'étiquette", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: remiseQuiGardeLeChiffre(ficheDe(c)), min: REMISES_ESSAYEES.min, max: REMISES_ESSAYEES.max }),
      zones: ["La promotion garde le chiffre d'affaires", "La promotion fait baisser le chiffre d'affaires"],
      rates: () => ({
        dessous: "À cette remise, le chiffre d'affaires tombe sous celui du mois sans promotion : remisez moins.",
        dessus: "Le chiffre d'affaires tient encore : vous pouvez remiser davantage. Cherchez la plus forte remise.",
      }),
      montrer: "Montrer la remise",
      lecture: (c, q) => {
        const p = aLaRemise(c, q);
        return [
          { libelle: "Pulls demandés", montant: p.avec.demande },
          { libelle: "Pulls vendus", montant: p.avec.vendus },
          { libelle: "Chiffre d'affaires hors taxes, sans promotion", montant: p.sans.chiffreDAffaires },
          { libelle: "Chiffre d'affaires hors taxes, avec la remise", montant: p.avec.chiffreDAffaires, fort: true },
        ];
      },
      droites: (c) => ({
        produit: (q) => aLaRemise(c, q).avec.chiffreDAffaires,
        cout: () => aLaRemise(c, 0).sans.chiffreDAffaires,
        libelles: ["Chiffre d'affaires avec la remise", "Chiffre d'affaires sans promotion"],
      }),
      explication: (c) => {
        const q = remiseQuiGardeLeChiffre(ficheDe(c));
        const p = aLaRemise(c, q);
        return [
          `Jusqu'à ${qte(q)} %, la promotion garde le chiffre d'affaires : à ${qte(q)} %, ${qte(p.avec.vendus)} pulls à ${eur(p.prixHtPromo)} hors taxes font ${eur(p.avec.chiffreDAffaires)}. Au-delà, le rayon est vide : la remise ne fait plus vendre un pull de plus, elle ne fait que baisser le prix.`,
          "Une petite remise attire des clients ; une grosse remise, sans réserve pour la servir, fait seulement perdre de l'argent sur chaque pull vendu.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-remise",
      type: "simulation",
      titre: "Le laboratoire de la remise",
      notions: ["markdown", "stock"],
      question: (c) => {
        const p = promo(c);
        return `La responsable hésite sur la remise de ${ficheDe(c).promotion.mois}. Faites-la varier : la demande, les ventes, les clients sans pull et le chiffre d'affaires se refont, avec les ${qte(p.stockEnRayon)} pulls du rayon. Relevez le défi.`;
      },
      leviers: (c) => [
        { code: "remise", libelle: `Remise sur l'article « ${ARTICLE(c).nom} »`, unite: "%", min: REMISES_ESSAYEES.min, max: REMISES_ESSAYEES.max, pas: PAS_DES_REMISES, depart: Math.round(REMISE_DE_LA_PROMOTION * 100) },
      ],
      lecture: (c, p) => {
        const x = aLaRemise(c, p.remise!);
        return [
          { libelle: "Nouveau prix affiché", montant: x.nouveauPrix, reference: x.article.affiche },
          { libelle: "Pulls demandés", montant: x.avec.demande, unite: "pulls", reference: x.sans.demande },
          { libelle: "Pulls vendus", montant: x.avec.vendus, unite: "pulls", reference: x.sans.vendus },
          { libelle: "Clients repartis sans leur pull", montant: x.avec.manques, unite: "clients", reference: 0 },
          { libelle: "Chiffre d'affaires hors taxes", montant: x.avec.chiffreDAffaires, reference: x.sans.chiffreDAffaires, fort: true },
        ];
      },
      graphique: (c) => ({
        levier: "remise",
        courbes: [
          { libelle: "Pulls demandés", valeur: (p) => aLaRemise(c, p.remise!).avec.demande },
          { libelle: "Pulls vendus", valeur: (p) => aLaRemise(c, p.remise!).avec.vendus },
        ],
        unite: "pulls",
      }),
      defi: (c) => ({
        consigne: "Trouvez la remise qui fait monter le chiffre d'affaires au-dessus du mois sans promotion, sans qu'aucun client reparte sans son pull.",
        atteint: (p) => remiseQuiPaieSansRupture(ficheDe(c), p.remise! / 100),
        indice: (p) => {
          const x = aLaRemise(c, p.remise!);
          if (x.avec.manques > 0) return `${qte(x.avec.manques)} clients repartent sans leur pull : le rayon n'en a que ${qte(x.stockEnRayon)}. Une remise plus petite attire moins de monde.`;
          return `Aucun client ne manque son pull, mais le chiffre d'affaires (${eur(x.avec.chiffreDAffaires)}) ne dépasse pas celui du mois sans promotion. Une petite remise peut faire mieux.`;
        },
        solution: { remise: remiseDuLaboratoire(ficheDe(c))[0] ?? REMISES_ESSAYEES.min },
      }),
      explication: (c, p) => {
        const x = aLaRemise(c, p.remise!);
        return [
          `Défi relevé : à ${qte(p.remise!)} %, ${qte(x.avec.demande)} pulls sont demandés et le rayon en a ${qte(x.stockEnRayon)}. Tous les clients sont servis, et le chiffre d'affaires monte à ${eur(x.avec.chiffreDAffaires)}, contre ${eur(x.sans.chiffreDAffaires)} sans promotion.`,
          "La bonne remise n'est pas la plus forte : c'est celle que le rayon peut servir. Avant de poser l'étiquette d'une promotion, l'équipier regarde la réserve.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["vat_payable", "markdown"],
      texte: (c) => {
        const p = promo(c);
        return [
          `L'article « ${p.article.nom} » se vend ${eur(p.article.ht)} hors taxes. Avec la TVA, l'étiquette affiche ${eur(p.article.affiche)}. En promotion, ${eur(p.nouveauPrix)}.`,
          "Avant de poser une étiquette, l'équipier vérifie le prix TTC. Pour une promotion, il montre l'ancien prix barré et vérifie que la réserve peut remplir le rayon. Dans l'arène, les chiffres de votre entreprise seront différents : le calcul de l'étiquette sera le même.",
        ];
      },
      repere: () => "Prix TTC = prix HT + TVA. Remise = prix affiché × taux de remise. Nouveau prix = prix affiché − remise.",
    },
  ],
};
