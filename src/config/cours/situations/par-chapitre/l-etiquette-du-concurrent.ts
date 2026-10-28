import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_POINT_DE_VENTE, margesDuRayon } from "../../chapitres/taux-de-marque";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « TAUX DE MARQUE, TAUX DE MARGE, COEFFICIENT » : L'ÉTIQUETTE DU
 * CONCURRENT (BTS MCO, palier 2).
 *
 * L'enseigne de la rue affiche le même pull col rond moins cher. Le façonnier accepte de baisser son
 * prix si MAILLE & CO s'aligne, mais pas jusqu'où il faudrait. La gérante veut savoir si l'offre
 * suffit. L'élève part de l'étiquette TTC du concurrent, la ramène hors taxes, fait répondre les
 * clients au prix, puis remonte à rebours : combien de pulls faudrait-il vendre au prix proposé pour
 * garder la marge du mois, et à quel prix d'achat les ventes alignées la gardent. Un curseur sur les
 * ventes montre la limite avant le calcul. La réponse demande un jugement : le critère est la marge
 * du mois, ni le taux de marque ni les seules ventes en plus.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde), chez
 * MAILLE & CO seule : ses chiffres sont ceux de `margesDuRayon`. Le prix proposé par le façonnier
 * est une hypothèse de l'histoire, et la simulation suppose que la demande de janvier tient déjà
 * compte de l'étiquette du concurrent : ne pas s'aligner garde les ventes de janvier.
 */

/**
 * LE PRIX PROPOSÉ PAR LE FAÇONNIER, hypothèse du cas : 24 € hors taxes au lieu de 25 €, si la
 * boutique s'aligne sur le concurrent. Une baisse de 4 %, ce qu'un façonnier concède pour un volume
 * en hausse, moins que ce que demanderait le taux de marque.
 */
export const PRIX_PROPOSE_PAR_LE_FACONNIER = 24;

/** Les bornes du curseur des ventes du mois, en pulls. */
export const VENTES_DU_CURSEUR = { min: 600, max: 800 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

export type Verdict = "pas-a-ce-prix" | "s-aligner";

/** Les chiffres de la réponse, calculés une fois du cas. */
export function etiquetteDuConcurrent(c: Pick<Cas, "code">) {
  const m = margesDuRayon(c);
  const achat = PRIX_PROPOSE_PAR_LE_FACONNIER;
  const margeUnitaire = auCentime(m.htConcurrent - achat);
  const margeAlignee = auCentime(margeUnitaire * m.aligne.ventes);
  const ecart = auCentime(margeAlignee - m.margeDuMoisDeJanvier);
  const ventesNecessaires = Math.ceil(m.margeDuMoisDeJanvier / margeUnitaire - 1e-9);
  const verdict: Verdict = margeAlignee < m.margeDuMoisDeJanvier ? "pas-a-ce-prix" : "s-aligner";
  const ventesEnPlus = m.aligne.ventes - m.r.ventesDuMois;
  return {
    m,
    achat,
    margeUnitaire,
    tMarqueAuPrixPropose: auDixieme((margeUnitaire / m.htConcurrent) * 100),
    margeAlignee,
    ecart,
    ventesNecessaires,
    ventesQuiManquent: ventesNecessaires - m.aligne.ventes,
    baisseEnPlus: auCentime(achat - m.achatQuiGardeLaMarge),
    verdict,
    ventesEnPlus,
    /** L'erreur des seules ventes en plus : elles comptent, la marge perdue sur les autres non. */
    margeDesVentesEnPlus: auCentime(ventesEnPlus * margeUnitaire),
  };
}

export const L_ETIQUETTE_DU_CONCURRENT: Situation = {
  code: "l-etiquette-du-concurrent",
  parcours: "mco",
  palier: 2,
  blocs: [],
  reprend: ["taux-de-marque-et-coefficient"],
  commanditaire: "La gérante",
  titre: "L'étiquette du concurrent",
  accroche:
    "Un concurrent affiche le même pull moins cher, et le façonnier propose une baisse si la boutique s'aligne. Avant de décider, la gérante veut savoir si l'offre suffit à garder la marge du mois.",
  objectifs: [
    "Passer d'une étiquette TTC au prix hors taxes, et faire répondre les ventes au prix",
    "Calculer un taux de marque et une marge du mois à un prix imposé",
    "Retrouver à rebours les ventes, puis le prix d'achat, qui gardent la marge du mois",
    "Répondre à la gérante sur le bon critère, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi: "ce cas reprend le chapitre « Taux de marque, taux de marge, coefficient », qui se joue dans la boutique du cours, MAILLE & CO.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      texte: (c) => {
        const x = etiquetteDuConcurrent(c);
        const m = x.m;
        return [
          `« ${m.f.concurrent.nom.charAt(0).toUpperCase()}${m.f.concurrent.nom.slice(1)} affiche le même ${m.r.nom.toLowerCase()} que nous à ${eur(m.ttcConcurrent)} TTC, contre ${eur(m.r.prixTtc)} chez nous. Le façonnier me propose ${eur(x.achat)} HT au lieu de ${eur(m.r.coutDAchat)} si nous nous alignons. Je ne veux pas d'un alignement qui nous fasse perdre de la marge sur le mois : son offre suffit-elle ? Et sinon, que faut-il lui demander ? »`,
          `Pas de cours cette fois : la méthode est celle du chapitre, à vous d'en trouver l'ordre. La simulation du cours fait répondre les clients au prix (${pct(-m.f.elasticiteAuPrix)} de demande en plus pour 1 % de baisse, en ligne droite) ; elle suppose que les ventes de ${m.f.moisDeReference} tiennent déjà compte du concurrent.`,
        ];
      },
      tableau: (c) => {
        const x = etiquetteDuConcurrent(c);
        const m = x.m;
        return {
          titre: `Le ${m.r.nom.toLowerCase()} de ${m.f.entreprise} en ${m.f.moisDeReference}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Notre étiquette, toutes taxes comprises", valeurs: [eur(m.r.prixTtc)] },
            { libelle: "Taux de TVA sur les ventes", valeurs: [pct(m.r.tauxTva * 100)] },
            { libelle: `Prix d'achat hors taxes chez le « ${m.faconnier.nom} »`, valeurs: [eur(m.r.coutDAchat)] },
            { libelle: `Pulls vendus en ${m.f.moisDeReference}`, valeurs: [qte(m.r.ventesDuMois)] },
            { libelle: "Étiquette du concurrent, toutes taxes comprises", valeurs: [eur(m.ttcConcurrent)] },
            { libelle: "Prix d'achat proposé par le façonnier si nous nous alignons", valeurs: [eur(x.achat)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le prix aligné hors taxes et les ventes qu'il attire, la marge du mois au prix proposé par le façonnier, les ventes et le prix d'achat qui garderaient la marge de janvier, et votre réponse.",
    },
    {
      id: "au-prix-du-concurrent",
      type: "montants",
      titre: "Au prix du concurrent",
      notions: ["margin_rates", "vat_payable", "price_elasticity"],
      question: () =>
        "Calculez le prix hors taxes qui correspond à l'étiquette du concurrent, les pulls que la boutique vendrait à ce prix (à l'article près en dessous), et le taux de marque que lui laisserait le prix d'achat proposé, au dixième.",
      champs: (c) => {
        const x = etiquetteDuConcurrent(c);
        const m = x.m;
        return [
          { libelle: "Prix du concurrent, hors taxes", attendu: m.htConcurrent, calcul: `${eur(m.ttcConcurrent)} ÷ ${(1 + m.r.tauxTva).toLocaleString("fr-FR")} = ${eur(m.htConcurrent)}` },
          {
            libelle: "Pulls vendus au prix aligné",
            attendu: m.aligne.ventes,
            calcul: `${qte(m.r.ventesDuMois)} × (1 − ${qte(-m.f.elasticiteAuPrix)} × (${eur(m.htConcurrent)} − ${eur(m.r.prixHt)}) ÷ ${eur(m.r.prixHt)}) = ${qte(m.aligne.ventes)}`,
          },
          { libelle: "Taux de marque au prix proposé (%)", attendu: x.tMarqueAuPrixPropose, calcul: `(${eur(m.htConcurrent)} − ${eur(x.achat)}) ÷ ${eur(m.htConcurrent)} × 100 = ${pct(x.tMarqueAuPrixPropose)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const x = etiquetteDuConcurrent(c);
        const m = x.m;
        return [
          `Le taux de marque se calcule hors taxes : on retire d'abord la TVA de l'étiquette. Aligné, le pull se vendrait ${qte(m.aligne.ventes)} fois au lieu de ${qte(m.r.ventesDuMois)}, et marquerait ${pct(x.tMarqueAuPrixPropose)} au prix proposé, contre ${pct(m.tMarque)} aujourd'hui.`,
        ];
      },
    },
    {
      id: "la-marge-alignee",
      type: "montants",
      titre: "La marge du mois, alignée",
      notions: ["margin_rates"],
      question: () =>
        "Calculez la marge commerciale du mois d'aujourd'hui, celle du mois aligné au prix d'achat proposé, puis ce que l'alignement ferait perdre chaque mois.",
      champs: (c) => {
        const x = etiquetteDuConcurrent(c);
        const m = x.m;
        return [
          { libelle: "Marge du mois d'aujourd'hui", attendu: m.margeDuMoisDeJanvier, calcul: `(${eur(m.r.prixHt)} − ${eur(m.r.coutDAchat)}) × ${qte(m.r.ventesDuMois)} = ${eur(m.margeDuMoisDeJanvier)}` },
          { libelle: "Marge du mois alignée, au prix proposé", attendu: x.margeAlignee, calcul: `(${eur(m.htConcurrent)} − ${eur(x.achat)}) × ${qte(m.aligne.ventes)} = ${eur(x.margeAlignee)}` },
          { libelle: "Marge perdue chaque mois", attendu: auCentime(-x.ecart), calcul: `${eur(m.margeDuMoisDeJanvier)} − ${eur(x.margeAlignee)} = ${eur(-x.ecart)}` },
        ];
      },
      explication: (c) => {
        const x = etiquetteDuConcurrent(c);
        const m = x.m;
        return [
          x.ecart < 0
            ? `Même avec la baisse du façonnier et les ${qte(x.ventesEnPlus)} pulls de plus, l'alignement coûterait ${eur(-x.ecart)} de marge par mois : chaque pull ne laisse plus que ${eur(x.margeUnitaire)} au lieu de ${eur(m.a.margeCommerciale)}.`
            : `Avec la baisse du façonnier et les ${qte(x.ventesEnPlus)} pulls de plus, l'alignement rapporterait ${eur(x.ecart)} de marge par mois.`,
        ];
      },
    },
    {
      id: "les-ventes-au-curseur",
      type: "curseur",
      titre: "Les ventes qui garderaient la marge",
      notions: ["margin_rates", "price_elasticity"],
      question: (c) => {
        const x = etiquetteDuConcurrent(c);
        return `Au prix aligné et au prix d'achat proposé, chaque pull laisse ${eur(x.margeUnitaire)}. Faites varier les ventes du mois : combien de pulls faudrait-il vendre, au moins, pour retrouver la marge de ${x.m.f.moisDeReference}, ${eur(x.m.margeDuMoisDeJanvier)} ? Placez le curseur, puis validez.`;
      },
      grandeur: () => ({ libelle: "Pulls vendus dans le mois", unite: "pulls" }),
      cible: (c) => ({ attendu: etiquetteDuConcurrent(c).ventesNecessaires, min: VENTES_DU_CURSEUR.min, max: VENTES_DU_CURSEUR.max }),
      zones: ["La marge de janvier est gardée", "La marge de janvier est perdue"],
      rates: () => ({
        dessous: "À ces ventes, la marge du mois reste sous celle de janvier.",
        dessus: "Moins de pulls suffisent déjà : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les ventes",
      lecture: (c, q) => {
        const x = etiquetteDuConcurrent(c);
        const marge = auCentime(q * x.margeUnitaire);
        return [
          { libelle: "Marge d'un pull aligné, au prix proposé", montant: x.margeUnitaire },
          { libelle: "Marge du mois à ces ventes", montant: marge, fort: true },
          { libelle: "Marge du mois de janvier", montant: x.m.margeDuMoisDeJanvier },
          { libelle: "Marge gagnée sur janvier", montant: auCentime(marge - x.m.margeDuMoisDeJanvier) },
        ];
      },
      droites: (c) => {
        const x = etiquetteDuConcurrent(c);
        return { produit: (q) => q * x.margeUnitaire, cout: () => x.m.margeDuMoisDeJanvier, libelles: ["Marge du mois alignée", "Marge du mois de janvier"] };
      },
      explication: (c) => {
        const x = etiquetteDuConcurrent(c);
        return [
          `Il faudrait vendre ${qte(x.ventesNecessaires)} pulls ; la réponse des clients au prix n'en donne que ${qte(x.m.aligne.ventes)}. Il en manque ${qte(x.ventesQuiManquent)} : au prix d'achat proposé, le volume ne suffit pas à payer la baisse de prix.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Ce qu'il faut demander au façonnier",
      notions: ["margin_rates", "price_elasticity"],
      question: () =>
        "Remontez à rebours. Avec les ventes que donne le prix aligné, quel prix d'achat, au plus (au centime inférieur), garderait la marge du mois d'aujourd'hui ? De combien faudrait-il baisser en plus de l'offre du façonnier ? Et combien de pulls faudrait-il vendre au prix proposé pour garder cette marge ?",
      champs: (c) => {
        const x = etiquetteDuConcurrent(c);
        const m = x.m;
        return [
          {
            libelle: "Prix d'achat qui garde la marge du mois",
            attendu: m.achatQuiGardeLaMarge,
            calcul: `${eur(m.htConcurrent)} − ${eur(m.margeDuMoisDeJanvier)} ÷ ${qte(m.aligne.ventes)} = ${eur(m.achatQuiGardeLaMarge)}, au centime inférieur`,
            tolerance: 0.01,
          },
          { libelle: "Baisse à obtenir en plus de l'offre", attendu: x.baisseEnPlus, calcul: `${eur(x.achat)} − ${eur(m.achatQuiGardeLaMarge)} = ${eur(x.baisseEnPlus)}`, tolerance: 0.01 },
          { libelle: "Pulls à vendre au prix proposé", attendu: x.ventesNecessaires, calcul: `${eur(m.margeDuMoisDeJanvier)} ÷ ${eur(x.margeUnitaire)} = ${qte(x.ventesNecessaires)}, à l'unité supérieure` },
        ];
      },
      explication: (c) => {
        const x = etiquetteDuConcurrent(c);
        const m = x.m;
        return [
          `L'offre du façonnier, ${eur(x.achat)}, est à ${eur(x.baisseEnPlus)} de ce qu'il faudrait : ${eur(m.achatQuiGardeLaMarge)}. Garder le taux de marque d'aujourd'hui demanderait bien plus, ${eur(m.achatQuiGardeLaMarque)} : mais ce n'est pas le taux que la boutique encaisse, c'est la marge du mois.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const x = etiquetteDuConcurrent(c);
        const m = x.m;
        return [
          {
            texte: `Pas à ${eur(x.achat)} : il faut ${eur(m.achatQuiGardeLaMarge)} au plus, ou garder notre prix`,
            juste: x.verdict === "pas-a-ce-prix",
            retour: `Oui : aligné au prix proposé, le mois laisserait ${eur(x.margeAlignee)} au lieu de ${eur(m.margeDuMoisDeJanvier)}, ${eur(-x.ecart)} de moins. Il faudrait ${qte(x.ventesNecessaires)} pulls vendus, les clients n'en donnent que ${qte(m.aligne.ventes)}. À ${eur(m.achatQuiGardeLaMarge)}, l'alignement ne coûte plus rien ; sinon, notre étiquette garde la marge de janvier.`,
          },
          {
            texte: `Oui : à ${eur(x.achat)}, notre taux de marque reste à ${pct(x.tMarqueAuPrixPropose)}, au-dessus de celui du concurrent`,
            juste: false,
            retour: `Non : le taux de marque ne dit pas ce que rapporte le mois. À ${pct(x.tMarqueAuPrixPropose)} de marque sur ${qte(m.aligne.ventes)} pulls, la marge du mois tombe à ${eur(x.margeAlignee)}, sous les ${eur(m.margeDuMoisDeJanvier)} de janvier.`,
          },
          {
            texte: `Oui : les ${qte(x.ventesEnPlus)} pulls en plus rapporteraient ${eur(x.margeDesVentesEnPlus)} de marge`,
            juste: false,
            retour: `Non : c'est oublier que les ${qte(m.r.ventesDuMois)} pulls déjà vendus perdent chacun ${eur(auCentime(m.a.margeCommerciale - x.margeUnitaire))} de marge. Au total, le mois aligné laisse ${eur(x.margeAlignee)}, ${eur(-x.ecart)} de moins qu'en janvier.`,
          },
          {
            texte: `Pas à ${eur(x.achat)} : il faut ${eur(m.achatQuiGardeLaMarque)} pour garder nos ${pct(m.tMarque)} de marque`,
            juste: false,
            retour: `Non : ${eur(m.achatQuiGardeLaMarque)} garderait le taux de marque, mais c'est demander au façonnier plus qu'il ne faut. Les ventes montent avec le prix aligné : ${eur(m.achatQuiGardeLaMarge)} suffit à garder la marge du mois.`,
          },
        ];
      },
    },
  ],
};
