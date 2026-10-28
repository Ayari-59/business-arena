import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_PROMOTION, ficheDe } from "../../chapitres/promotion-qui-paie";
import { coutVariable, promotion, referenceDe } from "../../monde/boutique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA PROMOTION QUI PAIE » : JUSQU'OÙ REMISER ? (BTS MCO, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts), son pull col
 * rond et le mois de février du chapitre (monde/boutique.ts, `promotion`, pour le mois sans remise).
 *
 * La responsable sait combien de ventes sa promotion apportera. Elle demande la remise la plus forte
 * qu'elle peut accorder sans perdre de marge sur le mois, et l'étiquette à afficher. L'élève refait le
 * raisonnement du chapitre à l'envers : la marge à garder, le volume attendu, la marge d'un pull qu'il
 * faut au minimum, le prix plancher (au curseur, puis au calcul), la remise maximale ; puis il passe à
 * l'étiquette toutes taxes comprises, ronde, ce qui demande un jugement : arrondir du côté qui garde la
 * marge.
 *
 * Le cas est neuf par sa question : le chapitre part d'une remise pour trouver le volume qui la paie ;
 * ici, le volume est donné et l'on cherche la remise. Les pièges : régler la remise sur la hausse des
 * ventes, ou sur le chiffre d'affaires, au lieu de la marge ; arrondir le plancher vers le bas.
 *
 * Le calcul à rebours : marge à garder → prix plancher hors taxes → remise maximale → étiquette TTC.
 * Le plancher s'arrondit au centime supérieur (à 51,54 €, il manquerait 2,40 €), et la remise se donne
 * au centième (6,3 % la ferait déjà passer sous le plancher).
 */

/**
 * La hausse des ventes attendue de la promotion, hypothèse du cours : 15 %. C'est l'estimation prudente
 * de la responsable, d'après les promotions passées (vitrine, affichage, message aux clientes fidèles).
 */
export const HAUSSE_ATTENDUE = 0.15;

/** Les bornes du curseur du prix payé hors taxes, en centimes : de 48 € à l'étiquette. */
export const PRIX_DU_CURSEUR_DU_CAS = { min: 4_800, max: 5_500 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const auCentimeSuperieur = (x: number) => Math.ceil(x * 100 - 1e-9) / 100;

/** Les chiffres de la réponse, calculés une fois sur la fiche. */
export function jusquOuRemiser(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const p = promotion(f);
  const r = referenceDe(f, p.reference);
  const cv = coutVariable(r);
  const sans = p.sans;
  const volume = Math.round(sans.ventes * (1 + HAUSSE_ATTENDUE));
  const margeAGarder = auCentimeSuperieur(sans.marge / volume);
  const prixPlancher = auCentime(cv + margeAGarder);
  const remiseMax = auCentime((1 - prixPlancher / r.prixHt) * 100);
  const tva = r.tauxTva;
  const plancherTtc = auCentime(prixPlancher * (1 + tva));
  // L'étiquette ronde : à l'euro supérieur (elle garde la marge), ou à l'euro inférieur (l'erreur).
  const etiquette = (ttc: number) => {
    const ht = auCentime(ttc / (1 + tva));
    const marge = auCentime(volume * (ht - cv));
    return { ttc, ht, marge, gain: auCentime(marge - sans.marge), remise: auDixieme((1 - ttc / r.prixTtc) * 100) };
  };
  const ronde = etiquette(Math.ceil(plancherTtc - 1e-9));
  const tropBasse = etiquette(Math.floor(plancherTtc + 1e-9));
  return {
    f,
    r,
    cv,
    sans,
    stockEnRayon: p.stockEnRayon,
    volume,
    margeAGarder,
    prixPlancher,
    remiseMax,
    /** Le prix plancher sans l'arrondi du côté de la marge : au centime le plus proche. */
    prixAuPlusProche: auCentime(cv + auCentime(sans.marge / volume)),
    plancherTtc,
    ronde,
    tropBasse,
    // Les erreurs classiques : la remise qui égale la hausse des ventes, celle qui garde le chiffre d'affaires.
    remiseDeLaHausse: auDixieme(HAUSSE_ATTENDUE * 100),
    remiseDuChiffre: auDixieme((1 - 1 / (1 + HAUSSE_ATTENDUE)) * 100),
  };
}

export const JUSQU_OU_REMISER: Situation = {
  code: "jusqu-ou-remiser",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["promotion-qui-paie"],
  commanditaire: "La responsable de la boutique",
  titre: "Jusqu'où aller dans la remise ?",
  accroche:
    "La responsable sait combien de ventes sa promotion lui apportera. Elle veut connaître la plus forte remise qu'elle peut accorder sans perdre de marge, et l'étiquette à afficher.",
  objectifs: [
    "Calculer la marge d'un mois sans remise et le volume attendu",
    "Retrouver à rebours la marge d'un article à garder, le prix plancher et la remise maximale",
    "Passer du prix plancher hors taxes à une étiquette ronde, du côté qui garde la marge",
    "Répondre en distinguant la marge, le chiffre d'affaires et le volume",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_PROMOTION,
    pourquoi: "ce cas reprend la promotion du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable",
      texte: (c) => {
        const x = jusquOuRemiser(c);
        return [
          `« Pour ${x.f.promotion.mois}, je prépare une promotion bien annoncée sur le col rond. D'expérience, elle nous apportera ${pct(HAUSSE_ATTENDUE * 100)} de ventes en plus. Je veux savoir quelle remise ${x.f.entreprise} peut accorder au plus sans gagner moins qu'un mois sans remise, et quelle étiquette ronde afficher. »`,
          "Pas de cours cette fois : vous avez les chiffres d'un mois sans remise, et la méthode est celle du chapitre, prise dans l'autre sens. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const x = jusquOuRemiser(c);
        return {
          titre: `Le col rond sans remise · ${x.f.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Prix de l'étiquette, toutes taxes comprises", valeurs: [eur(x.r.prixTtc)] },
            { libelle: "Prix de l'étiquette, hors taxes", valeurs: [eur(x.r.prixHt)] },
            { libelle: "Coût variable d'un pull (achat et autres coûts variables)", valeurs: [eur(x.cv)] },
            { libelle: `Pulls vendus en ${x.f.promotion.mois} sans remise`, valeurs: [qte(x.sans.ventes)] },
            { libelle: "Pulls prévus en rayon", valeurs: [qte(x.stockEnRayon)] },
            { libelle: "Hausse des ventes attendue de la promotion", valeurs: [pct(HAUSSE_ATTENDUE * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la marge d'un mois sans remise, le volume attendu, la marge d'un pull à garder, le prix plancher, la remise maximale, l'étiquette ronde, et votre réponse.",
    },
    {
      id: "la-marge-a-garder",
      type: "montants",
      titre: "La marge à garder",
      notions: ["contribution_margin", "markdown"],
      question: () =>
        `Calculez la marge d'un pull au prix de l'étiquette, la marge d'un mois sans remise, puis le volume attendu avec ${pct(HAUSSE_ATTENDUE * 100)} de ventes en plus (à l'unité).`,
      champs: (c) => {
        const x = jusquOuRemiser(c);
        return [
          { libelle: "Marge d'un pull au prix de l'étiquette", attendu: x.sans.margeUnitaire, calcul: `${eur(x.r.prixHt)} − ${eur(x.cv)} = ${eur(x.sans.margeUnitaire)}` },
          { libelle: "Marge d'un mois sans remise", attendu: x.sans.marge, calcul: `${qte(x.sans.ventes)} × ${eur(x.sans.margeUnitaire)} = ${eur(x.sans.marge)}` },
          { libelle: "Volume attendu en promotion", attendu: x.volume, calcul: `${qte(x.sans.ventes)} × ${qte(1 + HAUSSE_ATTENDUE)} = ${qte(x.volume)}` },
        ];
      },
      explication: (c) => {
        const x = jusquOuRemiser(c);
        return [
          `La promotion ne doit pas laisser moins de ${eur(x.sans.marge)} à ${x.f.entreprise}, et cette marge se partagera entre ${qte(x.volume)} pulls au lieu de ${qte(x.sans.ventes)}. Les ${qte(x.stockEnRayon)} pulls prévus en rayon suffisent pour les servir.`,
        ];
      },
    },
    {
      id: "le-prix-plancher",
      type: "curseur",
      titre: "Le prix plancher, au curseur",
      notions: ["markdown", "price_floor"],
      question: (c) => {
        const x = jusquOuRemiser(c);
        return `Faites varier le prix payé hors taxes, en centimes, de ${eur(PRIX_DU_CURSEUR_DU_CAS.min / 100)} à l'étiquette. Une droite donne la marge des ${qte(x.volume)} pulls attendus à ce prix, l'autre la marge d'un mois sans remise. Placez le curseur sur le plus petit prix qui garde cette marge, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix payé hors taxes, en centimes", unite: "centimes" }),
      cible: (c) => {
        const x = jusquOuRemiser(c);
        return { attendu: Math.round(x.prixPlancher * 100), min: PRIX_DU_CURSEUR_DU_CAS.min, max: PRIX_DU_CURSEUR_DU_CAS.max };
      },
      zones: ["La marge est gardée", "La promotion coûte"],
      rates: () => ({
        dessous: "À ce prix, les pulls attendus ne rendent pas la marge d'un mois sans remise.",
        dessus: "Un prix plus bas garde encore la marge : cherchez le plus petit.",
      }),
      montrer: "Montrer le prix plancher",
      lecture: (c, centimes) => {
        const x = jusquOuRemiser(c);
        const unitaire = auCentime(centimes / 100 - x.cv);
        const marge = auCentime(x.volume * unitaire);
        return [
          { libelle: "Marge d'un pull à ce prix", montant: unitaire },
          { libelle: "Marge des pulls attendus", montant: marge },
          { libelle: "Marge d'un mois sans remise", montant: x.sans.marge },
          { libelle: "Gain de la promotion", montant: auCentime(marge - x.sans.marge), fort: true },
        ];
      },
      droites: (c) => {
        const x = jusquOuRemiser(c);
        return {
          produit: (centimes) => x.volume * (centimes / 100 - x.cv),
          cout: () => x.sans.marge,
          libelles: ["Marge des pulls attendus", "Marge d'un mois sans remise"],
        };
      },
      explication: (c) => {
        const x = jusquOuRemiser(c);
        return [
          `Les droites se croisent entre ${eur(x.prixAuPlusProche)} et ${eur(x.prixPlancher)} : à ${eur(x.prixAuPlusProche)}, il manque ${eur(auCentime(x.sans.marge - x.volume * (x.prixAuPlusProche - x.cv)))}. Le prix plancher est donc ${eur(x.prixPlancher)}, au centime supérieur.`,
        ];
      },
    },
    {
      id: "la-remise-maximale",
      type: "montants",
      titre: "La remise maximale",
      notions: ["markdown", "price_floor"],
      question: () =>
        "Quelle marge d'un pull faut-il garder au minimum pour retrouver la marge du mois avec le volume attendu (au centime supérieur) ? À quel prix hors taxes cela correspond-il, et quelle remise maximale sur l'étiquette, en pourcentage, au centième ?",
      champs: (c) => {
        const x = jusquOuRemiser(c);
        return [
          { libelle: "Marge d'un pull à garder", attendu: x.margeAGarder, tolerance: 0.01, calcul: `${eur(x.sans.marge)} ÷ ${qte(x.volume)} = ${(Math.floor((x.sans.marge / x.volume) * 1000 + 1e-9) / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 3 })}…, soit ${eur(x.margeAGarder)} au centime supérieur` },
          { libelle: "Prix plancher, hors taxes", attendu: x.prixPlancher, tolerance: 0.01, calcul: `${eur(x.cv)} + ${eur(x.margeAGarder)} = ${eur(x.prixPlancher)}` },
          { libelle: "Remise maximale (%)", attendu: x.remiseMax, tolerance: 0.01, calcul: `(1 − ${eur(x.prixPlancher)} ÷ ${eur(x.r.prixHt)}) × 100 = ${pct(x.remiseMax, 2)}` },
        ];
      },
      explication: (c) => {
        const x = jusquOuRemiser(c);
        return [
          `Sous ${eur(x.prixPlancher)}, soit plus de ${pct(x.remiseMax, 2)} de remise, la promotion coûterait de la marge, même avec ${pct(HAUSSE_ATTENDUE * 100)} de ventes en plus. Le coût variable, ${eur(x.cv)}, ne baisse pas avec le prix : toute la remise se prend sur la marge. Arrondie au dixième, ${pct(auDixieme(x.remiseMax))}, la remise passerait déjà sous le plancher.`,
        ];
      },
    },
    {
      id: "l-etiquette",
      type: "montants",
      titre: "L'étiquette à afficher",
      notions: ["markdown", "price_floor"],
      question: (c) => {
        const x = jusquOuRemiser(c);
        return `La boutique affiche des étiquettes rondes, à l'euro, toutes taxes comprises (TVA de ${pct(x.r.tauxTva * 100)}). Calculez le prix plancher toutes taxes comprises, la remise affichée avec l'étiquette ronde qui garde la marge (en pourcentage, au dixième), puis la marge du mois à cette étiquette, avec le volume attendu.`;
      },
      champs: (c) => {
        const x = jusquOuRemiser(c);
        const e = x.ronde;
        return [
          { libelle: "Prix plancher, toutes taxes comprises", attendu: x.plancherTtc, tolerance: 0.01, calcul: `${eur(x.prixPlancher)} × ${qte(1 + x.r.tauxTva)} = ${eur(x.plancherTtc)}` },
          { libelle: "Remise affichée à l'étiquette ronde (%)", attendu: e.remise, tolerance: 0.1, calcul: `l'euro au-dessus du plancher, ${eur(e.ttc)} : (1 − ${eur(e.ttc)} ÷ ${eur(x.r.prixTtc)}) × 100 = ${pct(e.remise)}` },
          { libelle: "Marge du mois à l'étiquette ronde", attendu: e.marge, tolerance: 2.5, calcul: `${eur(e.ttc)} ÷ ${qte(1 + x.r.tauxTva)} = ${eur(e.ht)} hors taxes ; ${qte(x.volume)} × (${eur(e.ht)} − ${eur(x.cv)}) = ${eur(e.marge)}` },
        ];
      },
      explication: (c) => {
        const x = jusquOuRemiser(c);
        return [
          `À ${eur(x.ronde.ttc)}, la promotion garde la marge, avec ${eur(x.ronde.gain)} de plus. L'étiquette ronde s'arrondit vers le haut, du côté de la marge, jamais vers le bas : à ${eur(x.tropBasse.ttc)}, la marge du mois tomberait à ${eur(x.tropBasse.marge)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable",
      question: () => "Quelle phrase envoyez-vous à la responsable ?",
      options: (c) => {
        const x = jusquOuRemiser(c);
        return [
          {
            texte: `Une étiquette à ${eur(x.ronde.ttc)} TTC, soit ${pct(x.ronde.remise)} de remise au plus`,
            juste: true,
            retour: `Oui : à ${eur(x.ronde.ttc)} TTC, soit ${eur(x.ronde.ht)} hors taxes, les ${qte(x.volume)} pulls attendus laissent ${eur(x.ronde.marge)}, un peu plus que les ${eur(x.sans.marge)} d'un mois sans remise. Le plancher est ${eur(x.plancherTtc)} TTC : une étiquette ronde se prend au-dessus. Et les ${qte(x.stockEnRayon)} pulls en rayon suffisent.`,
          },
          {
            texte: `Une étiquette à ${eur(x.tropBasse.ttc)} TTC : le prix plancher, arrondi à l'euro`,
            juste: false,
            retour: `Non : arrondir le plancher vers le bas fait passer sous la marge. À ${eur(x.tropBasse.ttc)} TTC (${eur(x.tropBasse.ht)} hors taxes), ${qte(x.volume)} pulls laissent ${eur(x.tropBasse.marge)}, soit ${eur(-x.tropBasse.gain)} de moins qu'un mois sans remise.`,
          },
          {
            texte: `Jusqu'à ${pct(x.remiseDeLaHausse)} de remise, autant que la hausse des ventes attendue`,
            juste: false,
            retour: `Non : ${pct(x.remiseDeLaHausse)} de remise ôtent ${eur(auCentime(x.r.prixHt * HAUSSE_ATTENDUE))} à chaque pull, ${pct(auDixieme(((x.r.prixHt * HAUSSE_ATTENDUE) / x.sans.margeUnitaire) * 100))} des ${eur(x.sans.margeUnitaire)} de marge : la marge baisserait bien plus que les ventes ne montent. La remise maximale est de ${pct(x.remiseMax, 2)}.`,
          },
          {
            texte: `Jusqu'à ${pct(x.remiseDuChiffre)} de remise, celle qui garde notre chiffre d'affaires`,
            juste: false,
            retour: `Non : à ${pct(x.remiseDuChiffre)}, le chiffre d'affaires ne bouge pas, mais les ${qte(x.volume - x.sans.ventes)} pulls de plus coûtent chacun ${eur(x.cv)} de coût variable. C'est la marge qu'il faut garder : ${pct(x.remiseMax, 2)} au plus.`,
          },
        ];
      },
    },
  ],
};
