import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { coutVariable, promotion as promotionDuMonde, referenceDe } from "../monde/boutique";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, OptionDeChoix, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA PROMOTION QUI PAIE (BTS MCO, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique
 * MAILLE & CO a une fiche figée (monde/maille-et-co.ts) et la promotion se calcule par le modèle du
 * cours (monde/boutique.ts, `promotion`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : 10 % de remise sur le pull col rond en février. Ce que la remise retire à chaque pull, le
 * volume qu'il faudrait vendre pour garder la marge d'un mois sans remise, puis ce que la simulation
 * vend vraiment : la remise fait demander plus (l'élasticité à la remise), mais le rayon ne sert que
 * ce qu'il tient. La promotion paie si les ventes atteignent le volume nécessaire, ce qui demande deux
 * choses : que la demande suive (`laDemandeSuit`) ET que l'offre suive (`lOffreSuit`).
 *
 * Le piège central : la demande de février (780 pulls) dépasse le volume nécessaire (758), et la
 * promotion perd pourtant 1 200 € : le rayon n'en sert que 700. Une demande qui suit ne suffit pas.
 * Et rayon plein, la meilleure remise n'est pas la plus forte : la marge du mois est une courbe en
 * cloche de la remise, qui culmine vers 7,5 %.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'épreuve) :
 *   · guidé : intro, marge-unitaire, volume-necessaire (la formule est au repère, la question nomme les
 *     chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-volume puis
 *     combien-vendre (un curseur sur les pulls vendus en promotion, la marge en promotion face à la
 *     marge d'un mois sans remise, qui se croisent à 758) avant volume-necessaire ; predire-le-rayon puis
 *     le-laboratoire-de-la-promotion (la remise et le stock en rayon, la marge du mois selon la remise
 *     en graphique) avant la-promotion-jouee ; le-prix-plancher-du-rayon (un curseur sur le prix payé,
 *     700 pulls vendus) avant a-rebours ;
 *   · autonome : la-promotion-jouee, pourquoi (ni formule ni chiffres à prendre donnés ; le calcul de la
 *     correction montre le chemin) ;
 *   · expert : la-meilleure-remise (une variante chiffrée, rayon plein, à trois remises), a-rebours
 *     (retrouver la remise la plus forte que 700 pulls en rayon pouvaient payer), et
 *     ce-que-le-calcul-ne-voit-pas (une critique de la méthode) ; puis avant-de-lancer et la synthèse.
 *
 * L'ÉTAPE `pourquoi` (correction du défaut 1 de l'audit) : trois issues, rendues par le modèle du monde.
 * La promotion paie (les ventes atteignent le volume nécessaire) ; les clients suivent sans atteindre ce
 * volume (`laDemandeSuit` faux) ; ou la demande l'atteint mais l'offre bloque (`laDemandeSuit` vrai,
 * `lOffreSuit` faux). `issueDeLaPromotion` les distingue, `optionsDuPourquoi` en tire la bonne réponse,
 * et la garde les vérifie aux trois positions qui les produisent.
 *
 * L'EXPORT DE COMPATIBILITÉ `promotion(c)` garde, figés, les chiffres que l'arène rejouait pour la mise
 * en situation « Commander pour la promotion » (situations/commander-pour-la-promotion.ts), qui le lit
 * encore dans trois commerces. Le chapitre ne s'en sert plus.
 */

/** Le chapitre se joue dans la boutique du cours : MAILLE & CO, seule. */
export const ENTREPRISES_DE_LA_PROMOTION: readonly string[] = ["boutique"];

/** Pourquoi la boutique seule, dit à l'élève qui arrive d'une autre entreprise. */
export const POURQUOI_LA_BOUTIQUE =
  "la simulation du cours suit un seul point de vente d'un chapitre à l'autre, la boutique MAILLE & CO, dont elle connaît le rayon, la demande et sa réponse à une remise : la promotion se joue chez elle, quelle que soit votre entreprise.";

/** Les bornes du curseur des pulls vendus en promotion : de la demande sans remise au rayon plein. */
export const VOLUME_DU_CURSEUR = { min: 600, max: 900 } as const;

/**
 * Les bornes du curseur du prix payé, en centimes. Sous 51,90 € (plus de 5,6 % de remise), la remise
 * fait demander plus de 700 pulls : la boutique vend ses 700 pulls, et la marge est une droite du prix
 * payé. Au-dessus, la demande passerait sous le rayon et la droite mentirait.
 */
export const PRIX_DU_CURSEUR = { min: 4_800, max: 5_190 } as const;

/** Les leviers du laboratoire : la remise, en %, et les pulls en rayon pour février (jusqu'au rayon plein). */
export const REMISE_DU_LABORATOIRE = { min: 0, max: 30, pas: 0.5 } as const;
export const STOCK_DU_LABORATOIRE = { min: 600, pas: 10 } as const;

/**
 * Le défi du laboratoire, hypothèse du cours : une promotion qui rapporte au moins 540 € de marge de
 * plus qu'un mois sans remise. Avec 700 pulls en rayon, la meilleure remise n'en rapporte que 505,53 € :
 * il faut à la fois une remise modérée (de 6,5 % à 8 %) et plus de pulls en rayon.
 */
export const GAIN_DU_DEFI = 540;

/** Une solution du défi : 7,5 % de remise et 740 pulls en rayon, de quoi servir les 735 demandés. */
export const SOLUTION_DU_LABORATOIRE = { remise: 7.5, stock: 740 } as const;

/** La variante chiffrée : le rayon plein, et trois remises à comparer, en %. */
export const REMISES_DU_RAYON_PLEIN = [10, 15, 7.5] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
/** Un quotient montré avec trois décimales, tronqué : « 22,714… ». */
const troisDecimales = (x: number) => `${(Math.floor(x * 1000 + 1e-9) / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}…`;
/** Au centime supérieur : la marge à garder ne doit pas tomber d'un centime sous la cible. */
const auCentimeSuperieur = (x: number) => Math.ceil(x * 100 - 1e-9) / 100;

/** La fiche de la boutique du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

/** La promotion à une remise (en %) et un stock en rayon donnés, la référence et le mois de la fiche. */
export const promotionA = (f: FicheDeLaBoutique, remise: number, stockEnRayon: number) => promotionDuMonde(f, { remise: remise / 100, stockEnRayon });

export type PromotionDuMonde = ReturnType<typeof promotionDuMonde>;

/** Les trois issues d'une promotion. */
export type IssueDeLaPromotion = "paie" | "demande-insuffisante" | "offre-bloque";

/**
 * L'issue d'une promotion, lue sur le modèle : elle paie si les ventes atteignent le volume nécessaire ;
 * sinon, soit la demande elle-même reste sous ce volume (les clients suivent, pas assez), soit la
 * demande l'atteint et c'est le rayon qui manque (l'offre bloque).
 */
export function issueDeLaPromotion(p: PromotionDuMonde): IssueDeLaPromotion {
  if (p.volumeNecessaire !== null && p.avec.ventes >= p.volumeNecessaire) return "paie";
  return p.laDemandeSuit ? "offre-bloque" : "demande-insuffisante";
}

/** Les options de l'étape `pourquoi`, pour une promotion quelconque : une seule juste, celle de son issue. */
export function optionsDuPourquoi(p: PromotionDuMonde, entreprise: string): OptionDeChoix[] {
  const issue = issueDeLaPromotion(p);
  const vol = p.volumeNecessaire ?? 0;
  const v = p.avec;
  return [
    {
      texte: "Les clients ont répondu à la remise, et la boutique a pu les servir.",
      juste: issue === "paie",
      retour:
        issue === "paie"
          ? `Oui. La remise a fait demander ${qte(v.demande)} pulls, et ${entreprise} en avait ${qte(v.stockEnRayon)} en rayon : ${qte(v.ventes)} ventes pour ${qte(vol)} nécessaires.`
          : issue === "offre-bloque"
            ? `Ils ont répondu (${qte(v.demande)} pulls demandés), mais ${entreprise} n'a pas pu les servir : ${qte(v.ventesManquees)} ventes manquées.`
            : `Ils ont répondu, mais pas en nombre suffisant : ${qte(v.demande)} pulls demandés pour ${qte(vol)} nécessaires.`,
    },
    {
      texte: "Les clients ont suivi, mais pas assez pour payer la remise donnée sur chaque vente.",
      juste: issue === "demande-insuffisante",
      retour:
        issue === "demande-insuffisante"
          ? `Oui. La remise n'a fait demander que ${qte(v.demande)} pulls, et il en fallait ${qte(vol)} pour garder la marge : payée sur chaque vente, elle coûte plus que le volume ne rapporte. Le rayon n'y est pour rien.`
          : issue === "paie"
            ? `Au contraire : ${qte(v.ventes)} ventes, c'est au moins les ${qte(vol)} qu'il fallait pour garder la marge.`
            : `Non : la demande, ${qte(v.demande)} pulls, dépassait les ${qte(vol)} nécessaires. Ce n'est pas l'élan des clients qui a manqué, c'est le rayon.`,
    },
    {
      texte: "La boutique ne pouvait pas vendre plus : son stock en rayon était épuisé.",
      juste: issue === "offre-bloque",
      retour:
        issue === "offre-bloque"
          ? `Oui. La demande a suivi, ${qte(v.demande)} pulls pour ${qte(vol)} nécessaires, mais le rayon n'en servait que ${qte(v.stockEnRayon)} : ${qte(v.ventesManquees)} ventes manquées, et la remise donnée à des clients dont beaucoup seraient venus sans elle.`
          : v.ventesManquees > 0
            ? `Le rayon a bien manqué (${qte(v.ventesManquees)} ventes manquées), mais même servie en entier, la demande (${qte(v.demande)} pulls) restait sous les ${qte(vol)} nécessaires : ce n'est pas lui qui décide.`
            : `Non : ${qte(v.stockEnRayon)} pulls en rayon pour ${qte(v.demande)} demandés, toute la demande a été servie.`,
    },
    {
      texte: "La remise était trop faible pour être vue.",
      juste: false,
      retour: `Non : la demande est passée de ${qte(p.sans.demande)} à ${qte(v.demande)} pulls, la remise a été vue. C'est ce qui se passe ensuite, le volume vendu face au volume nécessaire, qui décide.`,
    },
  ];
}

/** La promotion de février et ses variantes : tout ce que le chapitre demande. */
export function promotionDuPointDeVente(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const p = promotionDuMonde(f);
  const r = referenceDe(f, p.reference);
  const cv = coutVariable(r);
  const remise = auCentime(p.remise * 100);
  const rayonPlein = r.capaciteDuRayon;
  // La remise au-delà de laquelle la demande dépasse le stock prévu : demande × (1 + 3 × remise) = stock.
  const remiseOuLeRayonSature = ((p.stockEnRayon / p.sans.demande - 1) / f.elasticiteALaRemise) * 100;
  // La variante rayon plein, à trois remises.
  const variantes = REMISES_DU_RAYON_PLEIN.map((t) => ({ remise: t, p: promotionA(f, t, rayonPlein) }));
  // La meilleure remise rayon plein, sur le pas du laboratoire.
  const grille = Array.from(
    { length: (REMISE_DU_LABORATOIRE.max - REMISE_DU_LABORATOIRE.min) / REMISE_DU_LABORATOIRE.pas + 1 },
    (_, i) => REMISE_DU_LABORATOIRE.min + i * REMISE_DU_LABORATOIRE.pas,
  );
  const meilleure = grille.map((t) => ({ remise: t, p: promotionA(f, t, rayonPlein) })).reduce((a, b) => (b.p.gain > a.p.gain ? b : a));
  // À rebours : avec le stock prévu tout vendu, la marge d'un pull qu'il faut garder, le prix payé, la remise.
  const margeARebours = auCentimeSuperieur(p.sans.marge / p.stockEnRayon);
  const prixARebours = auCentime(cv + margeARebours);
  const remiseARebours = auCentime((1 - prixARebours / r.prixHt) * 100);
  const aRebours = promotionA(f, remiseARebours, p.stockEnRayon);
  return {
    f,
    p,
    r,
    cv,
    remise,
    prixTtcEnPromotion: auCentime(r.prixTtc * (1 - p.remise)),
    baisseDeLaMarge: auDixieme(p.baisseDeLaMargeUnitaire * 100),
    hausseNecessaire: auDixieme((p.hausseNecessaire ?? 0) * 100),
    volumeNecessaire: p.volumeNecessaire!,
    issue: issueDeLaPromotion(p),
    rayonPlein,
    remiseOuLeRayonSature,
    variantes,
    meilleure,
    margeARebours,
    prixARebours,
    remiseARebours,
    demandeARebours: aRebours.avec.demande,
  };
}

export type PromotionDuChapitre = ReturnType<typeof promotionDuPointDeVente>;

/** La référence en promotion, au mois de février : le document de départ. */
function tableauDeLaReference(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = promotionDuPointDeVente(c);
  return {
    titre: `Le ${x.r.nom.toLowerCase()} de ${x.f.entreprise}, en ${x.f.promotion.mois}`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Prix de l'étiquette, toutes taxes comprises", valeurs: [eur(x.r.prixTtc)] },
      { libelle: "Prix de l'étiquette, hors taxes", valeurs: [eur(x.r.prixHt)] },
      { libelle: "Prix d'achat chez le façonnier, hors taxes", valeurs: [eur(x.r.coutDAchat)] },
      { libelle: `Autres coûts variables (${x.f.autresCoutsVariables})`, valeurs: [eur(x.r.autresCoutsVariables)] },
      { libelle: "Pulls demandés au prix de l'étiquette", valeurs: [qte(x.p.sans.demande)] },
      { libelle: "Pulls prévus en rayon", valeurs: [qte(x.p.stockEnRayon)] },
      { libelle: "Pulls que le rayon et la réserve peuvent tenir", valeurs: [qte(x.rayonPlein)] },
      { libelle: "Remise envisagée", valeurs: [pct(x.remise)] },
    ],
  };
}

/** Le bilan des promotions du chapitre, pour la synthèse. */
function tableauDesPromotions(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = promotionDuPointDeVente(c);
  const ligne = (libelle: string, p: PromotionDuMonde) => ({ libelle, valeurs: [qte(p.avec.demande), qte(p.avec.ventes), qte(p.volumeNecessaire ?? 0), eur(p.gain)] });
  return {
    titre: `Les promotions de février, face à un mois sans remise · ${x.f.entreprise}`,
    colonnes: ["Pulls demandés", "Pulls vendus", "Volume nécessaire", "Gain de la promotion"],
    lignes: [ligne(`${pct(x.remise)} de remise, ${qte(x.p.stockEnRayon)} pulls en rayon`, x.p), ...x.variantes.map((v) => ligne(`${pct(v.remise)} de remise, rayon plein`, v.p))],
  };
}

export const PROMOTION_QUI_PAIE: Chapitre = {
  code: "promotion-qui-paie",
  parcours: "mco",
  palier: 4,
  blocs: [
    "BTS MCO Bloc 2 · Animer et dynamiser l'offre commerciale",
    "Bac pro MCV Bloc 4A · Animer et gérer l'espace commercial",
  ],
  titre: "La promotion qui paie",
  accroche:
    "Une remise attire des clients, mais elle se paie sur chaque vente, même celles qui auraient eu lieu sans elle. Combien faut-il vendre en plus, le rayon peut-il les servir, et quelle remise rapporte vraiment ?",
  objectifs: [
    "Calculer ce qu'une remise retire à la marge d'un article",
    "Calculer le volume nécessaire pour garder la marge d'un mois sans remise",
    "Distinguer une demande qui ne suit pas d'une offre qui bloque",
    "Trouver la remise qui rapporte le plus, et la remise la plus forte qu'un stock permet",
    "Critiquer le calcul : ce qu'il ne voit pas, et ce qu'il faut vérifier avant de lancer",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_PROMOTION, pourquoi: POURQUOI_LA_BOUTIQUE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une remise sur le col rond",
      notions: ["markdown", "contribution_margin"],
      tableau: tableauDeLaReference,
      texte: (c) => {
        const x = promotionDuPointDeVente(c);
        const f = x.f;
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${f.entreprise}. En ${f.moisDeReference}, elle a vendu ${qte(x.p.sans.ventes)} pulls col rond à ${eur(x.r.prixHt)} hors taxes (${eur(x.r.prixTtc)} sur l'étiquette), sans en manquer un seul. Chaque pull lui coûte ${eur(x.cv)} de coûts variables : ${eur(x.r.coutDAchat)} d'achat chez le façonnier et ${eur(x.r.autresCoutsVariables)} d'emballages, d'étiquettes et de frais de carte bancaire.`,
          `La responsable propose une promotion pour ${f.promotion.mois} : ${pct(x.remise)} de remise sur le col rond, soit ${eur(x.p.avec.prixPaye)} hors taxes (${eur(x.prixTtcEnPromotion)} sur l'étiquette). Sans remise, ${f.promotion.mois} demanderait ${qte(x.p.sans.demande)} pulls, comme ${f.moisDeReference}. Le rayon en recevra ${qte(x.p.stockEnRayon)} ; avec la réserve, il en tient ${qte(x.rayonPlein)}.`,
          `Ce que la simulation suppose. Une remise annoncée de 1 % fait demander ${qte(f.elasticiteALaRemise)} % de pulls de plus pendant le mois de la promotion, en ligne droite : c'est l'élasticité à la remise, ${qte(f.elasticiteALaRemise)}, qui remplace l'effet d'une baisse durable du prix sans s'y ajouter. Les ventes sont la plus petite de la demande et du stock en rayon ; ce qui n'est pas servi est une vente manquée. Le loyer et l'équipe ne bougent pas avec la promotion : on compare la marge sur coût variable de ${f.promotion.mois}, avec et sans remise.`,
        ];
      },
      repere: () => "Marge d'un article = prix payé hors taxes − coût variable. La remise se prend sur le prix, jamais sur le coût.",
    },
    {
      id: "marge-unitaire",
      objectifs: [0],
      type: "montants",
      titre: "Ce que la remise retire",
      notions: ["markdown", "contribution_margin"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        return `Calculez le prix payé en promotion (${eur(x.r.prixHt)} moins ${pct(x.remise)}), la marge d'un pull au prix de l'étiquette (${eur(x.r.prixHt)} − ${eur(x.cv)}), puis en promotion, et la baisse de cette marge, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const x = promotionDuPointDeVente(c);
        const s = x.p.sans;
        const a = x.p.avec;
        return [
          { libelle: "Prix payé en promotion, hors taxes", attendu: a.prixPaye, calcul: `${eur(x.r.prixHt)} × (1 − ${pct(x.remise)}) = ${eur(a.prixPaye)}` },
          { libelle: "Marge d'un pull au prix de l'étiquette", attendu: s.margeUnitaire, calcul: `${eur(x.r.prixHt)} − ${eur(x.cv)} = ${eur(s.margeUnitaire)}` },
          { libelle: "Marge d'un pull en promotion", attendu: a.margeUnitaire, calcul: `${eur(a.prixPaye)} − ${eur(x.cv)} = ${eur(a.margeUnitaire)}` },
          {
            libelle: "Baisse de la marge d'un pull (%)",
            attendu: x.baisseDeLaMarge,
            calcul: `(${eur(s.margeUnitaire)} − ${eur(a.margeUnitaire)}) ÷ ${eur(s.margeUnitaire)} × 100 = ${pct(x.baisseDeLaMarge)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const x = promotionDuPointDeVente(c);
        return [
          `${pct(x.remise)} de remise ôtent ${eur(auCentime(x.r.prixHt - x.p.avec.prixPaye))} à chaque pull : ${pct(x.baisseDeLaMarge)} de sa marge. Le coût variable ne baisse pas avec le prix, toute la remise se prend sur la marge ; plus la marge est mince, plus la remise y pèse.`,
        ];
      },
    },
    {
      id: "predire-le-volume",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le volume nécessaire",
      notions: ["markdown", "contribution_margin"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        return `Avant de calculer, pariez. Pour que ${pct(x.remise)} de remise ne coûtent rien à la marge de ${x.f.promotion.mois}, il faudrait vendre…`;
      },
      options: (c) => {
        const x = promotionDuPointDeVente(c);
        const voir = "Faites vendre la promotion à l'étape suivante : le curseur montre où la marge en promotion rattrape celle d'un mois sans remise.";
        const h = x.hausseNecessaire;
        return [
          { texte: "Environ un quart de pulls en plus", juste: h > 20 && h < 30, retour: `Bon pari. ${voir}` },
          { texte: `${pct(x.remise)} de pulls en plus, autant que la remise`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `${pct(x.baisseDeLaMarge)} de pulls en plus, autant que la marge perdue`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "combien-vendre",
      objectifs: [1],
      type: "curseur",
      titre: "Faites vendre la promotion",
      notions: ["markdown", "contribution_margin"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        return `Faites vendre la promotion, de ${qte(VOLUME_DU_CURSEUR.min)} à ${qte(VOLUME_DU_CURSEUR.max)} pulls en ${x.f.promotion.mois}. Une droite donne la marge du mois en promotion (${eur(x.p.avec.margeUnitaire)} par pull), l'autre la marge d'un mois sans remise (${qte(x.p.sans.ventes)} × ${eur(x.p.sans.margeUnitaire)}). Placez le curseur sur le plus petit nombre de pulls où la promotion rend au moins cette marge, puis validez.`;
      },
      grandeur: () => ({ libelle: "Pulls vendus en promotion", unite: "pulls" }),
      cible: (c) => {
        const x = promotionDuPointDeVente(c);
        return { attendu: x.volumeNecessaire, min: VOLUME_DU_CURSEUR.min, max: VOLUME_DU_CURSEUR.max };
      },
      zones: ["La promotion paie", "La promotion coûte"],
      rates: () => ({
        dessous: "À cette position, la marge en promotion reste sous celle d'un mois sans remise : la remise coûte plus que les pulls en plus ne rapportent.",
        dessus: "La promotion paie déjà plus bas : cherchez le plus petit nombre de pulls.",
      }),
      montrer: "Montrer le volume nécessaire",
      lecture: (c, q) => {
        const x = promotionDuPointDeVente(c);
        const marge = auCentime(q * x.p.avec.margeUnitaire);
        return [
          { libelle: "Marge du mois en promotion", montant: marge },
          { libelle: "Marge d'un mois sans remise", montant: x.p.sans.marge },
          { libelle: "Gain de la promotion", montant: auCentime(marge - x.p.sans.marge), fort: true },
        ];
      },
      droites: (c) => {
        const x = promotionDuPointDeVente(c);
        return {
          produit: (q) => q * x.p.avec.margeUnitaire,
          cout: () => x.p.sans.marge,
          libelles: ["Marge du mois en promotion", "Marge d'un mois sans remise"],
        };
      },
      explication: (c) => {
        const x = promotionDuPointDeVente(c);
        return [
          `Les deux droites se croisent à ${qte(x.volumeNecessaire)} pulls : il faut vendre ${pct(x.hausseNecessaire)} de plus que sans remise pour que ${pct(x.remise)} de remise ne coûtent rien. Chaque pull en plus rapporte ${eur(x.p.avec.margeUnitaire)} ; mais chacun des ${qte(x.p.sans.ventes)} pulls qui se seraient vendus sans remise en perd ${eur(auCentime(x.p.sans.margeUnitaire - x.p.avec.margeUnitaire))}.`,
          "C'est la formule que l'étape suivante fait calculer : le volume nécessaire est la marge à garder divisée par la marge d'un pull en promotion.",
        ];
      },
    },
    {
      id: "volume-necessaire",
      objectifs: [1],
      type: "montants",
      titre: "Le volume nécessaire",
      notions: ["markdown", "contribution_margin"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        return `Sans remise, ${x.f.promotion.mois} laisse ${qte(x.p.sans.ventes)} × ${eur(x.p.sans.margeUnitaire)} de marge. Calculez cette marge, le volume qu'il faudrait vendre en promotion pour la garder (à l'unité supérieure), puis la hausse des ventes que cela suppose, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const x = promotionDuPointDeVente(c);
        return [
          { libelle: "Marge d'un mois sans remise", attendu: x.p.sans.marge, calcul: `${qte(x.p.sans.ventes)} × ${eur(x.p.sans.margeUnitaire)} = ${eur(x.p.sans.marge)}` },
          {
            libelle: "Volume nécessaire en promotion",
            attendu: x.volumeNecessaire,
            calcul: `${eur(x.p.sans.marge)} ÷ ${eur(x.p.avec.margeUnitaire)} = ${qte(auCentime(x.p.sans.marge / x.p.avec.margeUnitaire))}, soit ${qte(x.volumeNecessaire)} pulls`,
          },
          {
            libelle: "Hausse des ventes nécessaire (%)",
            attendu: x.hausseNecessaire,
            calcul: `(${qte(x.volumeNecessaire)} ÷ ${qte(x.p.sans.ventes)} − 1) × 100 = ${pct(x.hausseNecessaire)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const x = promotionDuPointDeVente(c);
        return [
          `${pct(x.remise)} de remise demandent ${pct(x.hausseNecessaire)} de ventes en plus : une petite remise demande un gros surcroît de ventes, parce qu'elle se prend sur une marge de ${eur(x.p.sans.margeUnitaire)}, pas sur un prix de ${eur(x.r.prixHt)}.`,
        ];
      },
    },
    {
      id: "predire-le-rayon",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le rayon",
      notions: ["markdown", "stock", "capacity"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        return `Avant de calculer, pariez. À ${pct(x.remise)} de remise, la simulation fait demander ${qte(x.p.avec.demande)} pulls, plus que les ${qte(x.volumeNecessaire)} nécessaires. Le rayon en recevra ${qte(x.p.stockEnRayon)}. La promotion de ${x.f.promotion.mois}…`;
      },
      options: (c) => {
        const x = promotionDuPointDeVente(c);
        const voir = "Lancez la promotion dans le laboratoire, à l'étape suivante : il suit la demande, les ventes et la marge en direct.";
        return [
          { texte: "Coûtera de la marge : le rayon ne sert pas le volume nécessaire", juste: x.issue === "offre-bloque", retour: `Bon pari. ${voir}` },
          { texte: "Paiera : la demande dépasse le volume nécessaire", juste: x.issue === "paie", retour: `Pari à vérifier. ${voir}` },
          { texte: "Coûtera de la marge : la demande reste trop faible", juste: x.issue === "demande-insuffisante", retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-promotion",
      objectifs: [2, 3],
      type: "simulation",
      titre: "Le laboratoire de la promotion",
      notions: ["markdown", "price_elasticity", "stock", "capacity"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        return `Lancez la promotion de ${x.f.promotion.mois} dans la simulation. Faites varier la remise et les pulls en rayon : le tableau suit la demande, les ventes, les ventes manquées et le gain de la promotion face à un mois sans remise ; le graphique trace la marge du mois selon la remise. Lisez d'abord le départ (${pct(x.remise)}, ${qte(x.p.stockEnRayon)} pulls en rayon), puis relevez le défi.`;
      },
      leviers: (c) => {
        const x = promotionDuPointDeVente(c);
        return [
          { code: "remise", libelle: "Remise sur le col rond", unite: "%", min: REMISE_DU_LABORATOIRE.min, max: REMISE_DU_LABORATOIRE.max, pas: REMISE_DU_LABORATOIRE.pas, depart: x.remise },
          { code: "stock", libelle: "Pulls en rayon pour février", unite: "pulls", min: STOCK_DU_LABORATOIRE.min, max: x.rayonPlein, pas: STOCK_DU_LABORATOIRE.pas, depart: x.p.stockEnRayon },
        ];
      },
      lecture: (c, position) => {
        const x = promotionDuPointDeVente(c);
        const l = promotionA(x.f, position.remise!, position.stock!);
        const d = x.p;
        return [
          { libelle: "Pulls demandés", montant: l.avec.demande, reference: d.avec.demande, unite: "pulls" },
          { libelle: "Pulls vendus", montant: l.avec.ventes, reference: d.avec.ventes, unite: "pulls" },
          { libelle: "Ventes manquées", montant: l.avec.ventesManquees, reference: d.avec.ventesManquees, unite: "pulls" },
          { libelle: "Volume nécessaire", montant: l.volumeNecessaire ?? 0, reference: d.volumeNecessaire ?? 0, unite: "pulls" },
          { libelle: "Marge d'un pull en promotion", montant: l.avec.margeUnitaire, reference: d.avec.margeUnitaire },
          { libelle: "Marge du mois en promotion", montant: l.avec.marge, reference: d.avec.marge },
          { libelle: "Gain de la promotion", montant: l.gain, reference: d.gain, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = promotionDuPointDeVente(c);
        return {
          levier: "remise",
          courbes: [
            { libelle: "Marge du mois en promotion", valeur: (p) => promotionA(x.f, p.remise!, p.stock!).avec.marge },
            { libelle: "Marge d'un mois sans remise", valeur: (p) => promotionA(x.f, p.remise!, p.stock!).sans.marge },
          ],
        };
      },
      defi: (c) => {
        const x = promotionDuPointDeVente(c);
        return {
          consigne: `Trouvez une promotion qui rapporte au moins ${eur(GAIN_DU_DEFI)} de marge de plus qu'un mois sans remise.`,
          atteint: (p) => promotionA(x.f, p.remise!, p.stock!).gain >= GAIN_DU_DEFI,
          indice: (p) => {
            const l = promotionA(x.f, p.remise!, p.stock!);
            if (!l.lOffreSuit)
              return `${qte(l.avec.ventesManquees)} pulls demandés ne trouvent pas de place en rayon : la remise se paie sur ${qte(l.avec.ventes)} ventes, dont ${qte(l.sans.ventes)} auraient eu lieu sans elle.`;
            if (!l.laDemandeSuit)
              return `La remise fait demander ${qte(l.avec.demande)} pulls, et il en faudrait ${qte(l.volumeNecessaire ?? 0)} pour garder la marge : elle est trop forte.`;
            return `La promotion rapporte ${eur(l.gain)} : cherchez la remise où ce qu'elle ôte à chaque pull et ce qu'elle fait vendre en plus s'équilibrent le mieux, avec de quoi servir la demande.`;
          },
          solution: { ...SOLUTION_DU_LABORATOIRE },
        };
      },
      montrer: "Montrer une promotion qui paie",
      explication: (c, position) => {
        const x = promotionDuPointDeVente(c);
        const l = promotionA(x.f, position.remise!, position.stock!);
        return [
          `À ${pct(position.remise!)} de remise et ${qte(position.stock!)} pulls en rayon, la promotion rapporte ${eur(l.gain)}. Le graphique le montre : la marge du mois monte avec la remise tant que les pulls en plus rapportent plus que ce que la remise ôte aux autres, puis redescend. Rayon plein, le meilleur gain, ${eur(x.meilleure.p.gain)}, se trouve à ${pct(x.meilleure.remise)} de remise, avec ${qte(x.meilleure.p.avec.demande)} pulls à servir.`,
          `Au départ, la demande suivait (${qte(x.p.avec.demande)} pulls pour ${qte(x.volumeNecessaire)} nécessaires) mais le rayon non : la promotion perdait ${eur(-x.p.gain)}. Avec ${qte(x.p.stockEnRayon)} pulls en rayon, aucune remise n'atteint le défi. Une promotion qui paie demande à la fois une remise modérée et de quoi servir.`,
        ];
      },
    },
    {
      id: "la-promotion-jouee",
      objectifs: [2],
      type: "montants",
      titre: "La promotion prévue, chiffrée",
      notions: ["markdown", "price_elasticity", "stock"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        return `Revenez à la promotion prévue : ${pct(x.remise)} de remise, ${qte(x.p.stockEnRayon)} pulls en rayon. Sans formule cette fois : calculez les pulls demandés en ${x.f.promotion.mois}, les pulls vendus, puis le gain de la promotion face à un mois sans remise (négatif si elle coûte).`;
      },
      champs: (c) => {
        const x = promotionDuPointDeVente(c);
        const a = x.p.avec;
        return [
          { libelle: "Pulls demandés en promotion", attendu: a.demande, calcul: `${qte(x.p.sans.demande)} × (1 + ${qte(x.f.elasticiteALaRemise)} × ${pct(x.remise)}) = ${qte(a.demande)}` },
          { libelle: "Pulls vendus en promotion", attendu: a.ventes, calcul: `la plus petite de ${qte(a.demande)} demandés et ${qte(a.stockEnRayon)} en rayon : ${qte(a.ventes)}` },
          { libelle: "Gain de la promotion", attendu: x.p.gain, calcul: `${qte(a.ventes)} × ${eur(a.margeUnitaire)} − ${eur(x.p.sans.marge)} = ${eur(a.marge)} − ${eur(x.p.sans.marge)} = ${eur(x.p.gain)}` },
        ];
      },
      explication: (c) => {
        const x = promotionDuPointDeVente(c);
        const a = x.p.avec;
        return [
          `La demande a suivi : ${qte(a.demande)} pulls demandés, plus que les ${qte(x.volumeNecessaire)} nécessaires. Mais le rayon n'en servait que ${qte(a.stockEnRayon)} : ${qte(a.ventesManquees)} ventes manquées, et la remise payée sur ${qte(a.ventes)} pulls dont ${qte(x.p.sans.ventes)} se seraient vendus sans elle. La promotion coûte ${eur(-x.p.gain)} de marge.`,
        ];
      },
    },
    {
      id: "pourquoi",
      objectifs: [2],
      type: "choix",
      titre: "Pourquoi elle ne paie pas",
      notions: ["markdown", "stock", "capacity"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        const a = x.p.avec;
        return `En ${x.f.promotion.mois}, la remise fait demander ${qte(a.demande)} pulls ; ${qte(a.ventes)} sont vendus, ${qte(a.ventesManquees)} manqués, et il en fallait ${qte(x.volumeNecessaire)} pour garder la marge. Qu'est-ce qui explique d'abord le résultat ?`;
      },
      options: (c) => {
        const x = promotionDuPointDeVente(c);
        return optionsDuPourquoi(x.p, x.f.entreprise);
      },
    },
    {
      id: "la-meilleure-remise",
      objectifs: [3],
      type: "montants",
      titre: "Variante : le rayon plein",
      notions: ["markdown", "price_elasticity", "contribution_margin"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        const [a, b, d] = x.variantes;
        return `Variante : la responsable remplit le rayon, ${qte(x.rayonPlein)} pulls. Sans formule ni chiffres donnés, calculez le gain de la promotion face à un mois sans remise à ${pct(a!.remise)}, à ${pct(b!.remise)} et à ${pct(d!.remise)} de remise (négatif si elle coûte).`;
      },
      champs: (c) => {
        const x = promotionDuPointDeVente(c);
        return x.variantes.map((v) => {
          const a = v.p.avec;
          const servis = a.ventes === a.demande ? "tous servis" : `${qte(a.ventes)} servis`;
          return {
            libelle: `Gain à ${pct(v.remise)} de remise, rayon plein`,
            attendu: v.p.gain,
            calcul: `${qte(x.p.sans.demande)} × (1 + ${qte(x.f.elasticiteALaRemise)} × ${pct(v.remise)}) = ${qte(a.demande)} pulls demandés, ${servis} ; à ${eur(a.prixPaye)} (au centime), ${qte(a.ventes)} × (${eur(a.prixPaye)} − ${eur(x.cv)}) − ${eur(x.p.sans.marge)} = ${eur(v.p.gain)}`,
          };
        });
      },
      explication: (c) => {
        const x = promotionDuPointDeVente(c);
        const [dix, quinze] = x.variantes;
        return [
          `Rayon plein, la promotion de ${pct(dix!.remise)} paie : ${eur(dix!.p.gain)}. À ${pct(quinze!.remise)}, elle ne paie plus : ${qte(quinze!.p.avec.demande)} pulls demandés, il en fallait ${qte(quinze!.p.volumeNecessaire ?? 0)}. Le meilleur gain, ${eur(x.meilleure.p.gain)}, est à ${pct(x.meilleure.remise)} : au-delà, chaque point de remise ôte plus à la marge des pulls vendus qu'il n'en rapporte par les pulls en plus.`,
          "La marge du mois n'est pas une droite de la remise : c'est une courbe en cloche, celle que le laboratoire a tracée. Doubler la remise ne double pas le gain ; il peut l'effacer.",
        ];
      },
    },
    {
      id: "le-prix-plancher-du-rayon",
      objectifs: [3],
      type: "curseur",
      titre: "Le prix le plus bas avec le rayon prévu",
      notions: ["markdown", "price_floor", "stock"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        return `Retour aux ${qte(x.p.stockEnRayon)} pulls en rayon. Au-delà de ${pct(x.remiseOuLeRayonSature)} de remise, la demande dépasse ${qte(x.p.stockEnRayon)} : la boutique vend tous ses pulls, et seul le prix payé fait la marge. Faites varier ce prix, en centimes : une droite donne la marge des pulls en rayon, l'autre celle d'un mois sans remise. Placez le curseur sur le plus petit prix qui garde la marge, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix payé en promotion, en centimes", unite: "centimes" }),
      cible: (c) => {
        const x = promotionDuPointDeVente(c);
        return { attendu: Math.round(x.prixARebours * 100), min: PRIX_DU_CURSEUR.min, max: PRIX_DU_CURSEUR.max };
      },
      zones: ["La promotion paie", "La promotion coûte"],
      rates: () => ({
        dessous: "À ce prix, les pulls vendus ne rendent pas la marge d'un mois sans remise : la remise est trop forte pour le rayon.",
        dessus: "Un prix plus bas garde encore la marge : cherchez le plus petit.",
      }),
      montrer: "Montrer le prix plancher",
      lecture: (c, centimes) => {
        const x = promotionDuPointDeVente(c);
        const unitaire = auCentime(centimes / 100 - x.cv);
        const marge = auCentime(x.p.stockEnRayon * unitaire);
        return [
          { libelle: "Marge d'un pull à ce prix", montant: unitaire },
          { libelle: "Marge des pulls en rayon, tous vendus", montant: marge },
          { libelle: "Marge d'un mois sans remise", montant: x.p.sans.marge },
          { libelle: "Gain de la promotion", montant: auCentime(marge - x.p.sans.marge), fort: true },
        ];
      },
      droites: (c) => {
        const x = promotionDuPointDeVente(c);
        return {
          produit: (centimes) => x.p.stockEnRayon * (centimes / 100 - x.cv),
          cout: () => x.p.sans.marge,
          libelles: ["Marge des pulls en rayon, tous vendus", "Marge d'un mois sans remise"],
        };
      },
      explication: (c) => {
        const x = promotionDuPointDeVente(c);
        return [
          `Avec ${qte(x.p.stockEnRayon)} pulls à vendre, le prix payé ne pouvait pas descendre sous ${eur(x.prixARebours)} : à ${eur(auCentime(x.prixARebours - 0.01))}, il manque déjà de la marge. La promotion prévue, à ${eur(x.p.avec.prixPaye)}, était perdue avant d'ouvrir, quelle que soit l'affluence.`,
          "L'étape suivante remonte de ce prix à la remise.",
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [3],
      type: "montants",
      titre: "La remise la plus forte, à rebours",
      notions: ["markdown", "price_floor", "contribution_margin"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        return `À rebours. La boutique vendra ses ${qte(x.p.stockEnRayon)} pulls, et la promotion doit rendre la marge d'un mois sans remise. Retrouvez la marge d'un pull à garder au minimum (au centime supérieur), le prix payé le plus bas, hors taxes, puis la remise la plus forte sur l'étiquette, en pourcentage, au centième.`;
      },
      champs: (c) => {
        const x = promotionDuPointDeVente(c);
        return [
          {
            libelle: "Marge d'un pull à garder",
            attendu: x.margeARebours,
            calcul: `${eur(x.p.sans.marge)} ÷ ${qte(x.p.stockEnRayon)} = ${troisDecimales(x.p.sans.marge / x.p.stockEnRayon)}, soit ${eur(x.margeARebours)} au centime supérieur`,
          },
          { libelle: "Prix payé le plus bas, hors taxes", attendu: x.prixARebours, calcul: `${eur(x.cv)} + ${eur(x.margeARebours)} = ${eur(x.prixARebours)}` },
          { libelle: "Remise la plus forte (%)", attendu: x.remiseARebours, calcul: `(1 − ${eur(x.prixARebours)} ÷ ${eur(x.r.prixHt)}) × 100 = ${pct(x.remiseARebours, 2)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = promotionDuPointDeVente(c);
        return [
          `Avec ${qte(x.p.stockEnRayon)} pulls en rayon, la remise ne pouvait pas dépasser ${pct(x.remiseARebours, 2)}. À cette remise, la simulation fait demander ${qte(x.demandeARebours)} pulls : la demande suit, c'est le rayon qui fixe le plafond. La remise prévue, ${pct(x.remise)}, demandait ${qte(x.volumeNecessaire)} pulls servis.`,
          "Arrondir la remise au dixième, ici vers le haut, ferait déjà perdre quelques euros : un plancher se calcule au centime, et s'arrondit du côté qui garde la marge.",
        ];
      },
    },
    {
      id: "ce-que-le-calcul-ne-voit-pas",
      objectifs: [4],
      type: "choix",
      titre: "Ce que le calcul ne voit pas",
      notions: ["markdown", "cannibalization"],
      question: (c) => {
        const x = promotionDuPointDeVente(c);
        const [dix] = x.variantes;
        return `Rayon plein, la promotion de ${pct(dix!.remise)} rapporte ${eur(dix!.p.gain)} au calcul, qui compare ${x.f.promotion.mois} avec et sans remise, sur le seul col rond. Qu'est-ce que ce calcul ne voit pas, et qui peut effacer ce gain ?`;
      },
      options: () => [
        {
          texte: "Les achats avancés : des clientes qui auraient payé le pull au prix plein en mars l'achètent remisé en février",
          juste: true,
          retour:
            "Oui. Le calcul compte comme vente en plus tout ce que la remise fait demander. Si une part n'est qu'un achat avancé, elle se retire des ventes de mars au prix plein : le gain de février se paie le mois suivant. Les clientes fidèles, qui connaissent le calendrier des promotions, sont les premières à attendre.",
        },
        {
          texte: "Le loyer et l'équipe de février, qu'il faudrait retrancher du gain de la promotion",
          juste: false,
          retour:
            "Non : le loyer et l'équipe se paient avec ou sans remise. Ils pèsent autant des deux côtés de la comparaison et ne changent pas le gain ; c'est pourquoi on compare des marges sur coût variable.",
        },
        {
          texte: "La TVA sur la remise, qui s'ajoute au coût de la promotion",
          juste: false,
          retour: "Non : le calcul se fait hors taxes. La TVA collectée baisse avec le prix payé, et la boutique la reverse à l'État : elle n'est ni une charge ni un coût de la promotion.",
        },
        {
          texte: "Le prix d'achat des pulls, qui baisse avec le prix de vente",
          juste: false,
          retour: "Non : le façonnier facture le même prix, remise ou pas. C'est justement pourquoi toute la remise se prend sur la marge.",
        },
      ],
    },
    {
      id: "avant-de-lancer",
      objectifs: [4],
      type: "choix",
      titre: "Avant de lancer une promotion",
      notions: ["markdown", "stock"],
      question: () => "Quelle vérification le manager doit-il faire avant de lancer une promotion ?",
      options: () => [
        {
          texte: "S'assurer que le rayon et la réserve pourront servir le volume nécessaire, et commander en conséquence",
          juste: true,
          retour: "Oui. Une promotion ne paie que si elle vend le volume nécessaire, et ce volume, il faut pouvoir le servir. Sinon la remise ne fait que baisser la marge des ventes qui auraient eu lieu.",
        },
        {
          texte: "Choisir la remise la plus forte possible, pour attirer le plus de monde",
          juste: false,
          retour: "Plus la remise est forte, plus le volume nécessaire grimpe : au-delà d'un certain point, aucune affluence ne la rembourse. La meilleure remise est souvent modérée.",
        },
        {
          texte: "Vérifier que le chiffre d'affaires du mois augmentera",
          juste: false,
          retour: "Le chiffre d'affaires peut monter pendant que la marge baisse : c'est la marge qu'il faut regarder.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["markdown", "contribution_margin", "stock"],
      tableau: tableauDesPromotions,
      texte: (c) => {
        const x = promotionDuPointDeVente(c);
        return [
          `Une remise se prend sur la marge, pas sur le prix : ${pct(x.remise)} de remise ôtent ${pct(x.baisseDeLaMarge)} de la marge d'un pull col rond, et demandent ${pct(x.hausseNecessaire)} de ventes en plus (${qte(x.volumeNecessaire)} pulls au lieu de ${qte(x.p.sans.ventes)}).`,
          `Une promotion paie si les ventes atteignent ce volume : il faut que la demande suive ET que l'offre suive. À ${pct(x.remise)} avec ${qte(x.p.stockEnRayon)} pulls en rayon, la demande suivait et le rayon a bloqué : ${eur(x.p.gain)}. Rayon plein, la même remise rapporte ${eur(x.variantes[0]!.p.gain)}, et la meilleure, à ${pct(x.meilleure.remise)}, ${eur(x.meilleure.p.gain)} : la marge du mois est une courbe en cloche de la remise.`,
          "Au niveau de l'examen, vous savez chiffrer ce qu'une remise retire et le volume qui la paie, dire si c'est la demande ou l'offre qui empêche une promotion de payer, trouver à rebours la remise la plus forte qu'un stock permet, comparer plusieurs remises, et dire ce que le calcul ne voit pas.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Volume nécessaire = marge sans remise ÷ marge d'un article en promotion. Ventes = la plus petite de la demande et du stock en rayon. La promotion paie si les ventes atteignent le volume nécessaire.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// L'EXPORT DE COMPATIBILITÉ : LA PROMOTION QUE L'ARÈNE REJOUAIT, FIGÉE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES CHIFFRES DE L'ARÈNE, FIGÉS (octobre 2026) : le trimestre que l'arène jouait au prix habituel et
 * celui qu'elle rejouait à 10 % de moins, dans les trois commerces. Le prix moyen et le coût variable
 * d'un article, les ventes et les ventes manquées aux deux prix. Le chapitre ne les lit plus ; ils
 * restent pour la mise en situation « Commander pour la promotion », qui ne doit pas changer.
 */
const PROMOTION_FIGEE_DE_L_ARENE: Readonly<Record<string, { prix: number; cvu: number; quantite: number; perdues: number; quantitePromo: number; perduesPromo: number }>> = {
  boutique: { prix: 55.49, cvu: 28.5, quantite: 4_601, perdues: 70, quantitePromo: 5_431, perduesPromo: 735 },
  ecommerce: { prix: 62, cvu: 38, quantite: 3_203, perdues: 0, quantitePromo: 4_560, perduesPromo: 0 },
  bistrot: { prix: 34, cvu: 13, quantite: 6_032, perdues: 397, quantitePromo: 6_032, perduesPromo: 1_711 },
};

/** L'écart de prix que l'arène rejouait : 10 % de moins. */
const REMISE_FIGEE = 0.1;

/**
 * EXPORT DE COMPATIBILITÉ, QUE LE CHAPITRE NE LIT PLUS : la promotion d'un trimestre de l'arène, calculée
 * comme l'ancien chapitre, sur les chiffres figés ci-dessus. Lue par situations/commander-pour-la-promotion.ts.
 */
export function promotion(c: Pick<Cas, "code">) {
  const a = PROMOTION_FIGEE_DE_L_ARENE[c.code];
  if (!a) throw new Error(`Pas de promotion figée pour ${c.code}`);
  const prixPromo = auCentime(a.prix * (1 - REMISE_FIGEE));
  const mcv = auCentime(a.prix - a.cvu);
  const mcvPromo = auCentime(prixPromo - a.cvu);
  const margeNormale = Math.round(a.quantite * mcv);
  const volumeNecessaire = Math.ceil(margeNormale / mcvPromo - 1e-9);
  const margePromo = Math.round(a.quantitePromo * mcvPromo);
  return {
    remise: REMISE_FIGEE * 100,
    cvu: a.cvu,
    prix: a.prix,
    prixPromo,
    mcv,
    mcvPromo,
    baisseDeLaMarge: auDixieme(((mcv - mcvPromo) / mcv) * 100),
    quantite: a.quantite,
    margeNormale,
    volumeNecessaire,
    hausseNecessaire: auDixieme((volumeNecessaire / a.quantite - 1) * 100),
    quantitePromo: a.quantitePromo,
    margePromo,
    gain: margePromo - margeNormale,
    perdues: a.perdues,
    perduesPromo: a.perduesPromo,
    aSuivi: a.quantitePromo > a.quantite * 1.01,
  };
}
