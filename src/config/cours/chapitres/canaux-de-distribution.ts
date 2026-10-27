import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { accord, accordPluriel } from "../accords";
import { type Cas } from "../cas";
import { anneeDuCours as anneeJouee } from "../monde/annee-du-cours";
import { JOURS_PAR_AN } from "../remises";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LES CANAUX DE DISTRIBUTION (Bac STMG, mercatique, palier 1).
 *
 * Vendre directement au client, ou passer par un intermédiaire qui revend ou met en relation :
 * le canal direct garde toute la marge, le canal indirect touche des clients qu'on n'atteindrait
 * pas seul, mais se paie, en commission ou en délai de paiement. Le chapitre compare les deux
 * canaux de l'entreprise, chiffre ce que coûte l'intermédiaire par unité, et pèse ce qu'il apporte.
 *
 * Deux entreprises de l'arène vendent par un intermédiaire : PIXEL & CO, par une place de marché
 * qui prélève une commission et reverse à trente jours ; NOVA, par une chaîne de magasins qui
 * paie à quatre-vingts jours et n'achète qu'à partir de la rentrée. Chacune est lue au trimestre
 * où son canal indirect vend le plus. La commission et le délai sont ceux du scénario, le taux
 * de financement celui de l'emprunt de l'entreprise. Aucune hypothèse n'est ajoutée.
 */

/** Les entreprises qui vendent par un intermédiaire, et la clientèle qui passe par lui. */
export const CANAUX_INDIRECTS = { ecommerce: "marketplace", nova: "campustech" } as const;
export const DISTRIBUTIONS = Object.keys(CANAUX_INDIRECTS) as (keyof typeof CANAUX_INDIRECTS)[];

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const ordinal = (n: number) => (n === 1 ? "premier" : `${n}e`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les deux canaux, au trimestre où l'intermédiaire vend le plus, et ce qu'il coûte par unité. */
export function canauxDeDistribution(c: Cas) {
  const indirect = CANAUX_INDIRECTS[c.code as keyof typeof CANAUX_INDIRECTS];
  const segments = scenarioByCode(c.code).scenario.market.segments;
  const seg = segments.find((s) => s.code === indirect)!;
  const tours = anneeJouee(c.code).partie.rounds.map((t) => t.results["joueur"]!);
  const i = tours.reduce((best, r, k) => ((r.market.bySegment[indirect]?.sold ?? 0) > (tours[best]!.market.bySegment[indirect]?.sold ?? 0) ? k : best), 0);
  const r = tours[i]!;
  const lire = (codes: string[]) => {
    const vs = codes.map((k) => r.market.bySegment[k]!);
    const ventes = Math.round(vs.reduce((t, v) => t + v.sold, 0));
    const ca = Math.round(vs.reduce((t, v) => t + v.revenue, 0));
    const commission = Math.round(vs.reduce((t, v) => t + (v.commission ?? 0), 0));
    return { ventes, chiffreDAffaires: ca, commission, prix: auCentime(ca / ventes) };
  };
  const direct = lire(segments.filter((s) => s.code !== indirect && (r.market.bySegment[s.code]?.sold ?? 0) >= 0.5).map((s) => s.code));
  const intermediaire = lire([indirect]);
  const delai = seg.paymentDelayDays;
  const taux = c.pret.tauxAnnuel;
  const tva = c.venteCredit.tauxTva;
  // Le délai se finance sur ce que l'intermédiaire doit, taxes comprises : une vente de marchandises doit sa TVA dès la livraison.
  const coutDuDelai = auCentime(((intermediaire.chiffreDAffaires - intermediaire.commission) * (1 + tva) * taux * delai) / JOURS_PAR_AN);
  const coutParUnite = auCentime((intermediaire.commission + coutDuDelai) / intermediaire.ventes);
  return {
    trimestre: i + 1,
    nomIndirect: seg.name.replace(/\s*\(.*\)\s*$/, ""),
    direct,
    intermediaire,
    tauxDeCommission: auDixieme((seg.commissionRate ?? 0) * 100),
    delai,
    tauxDeLEmprunt: auDixieme(taux * 100),
    tva,
    coutDuDelai,
    coutParUnite,
    partDesVentes: auDixieme((intermediaire.ventes / (direct.ventes + intermediaire.ventes)) * 100),
    partDuCoutDansLePrix: auDixieme((coutParUnite / intermediaire.prix) * 100),
  };
}

export const CANAUX_DE_DISTRIBUTION: Chapitre = {
  code: "canaux-de-distribution",
  parcours: "stmg",
  palier: 1,
  blocs: [
    "STMG Thème 2 · La distribution de l'offre",
  ],
  titre: "Les canaux de distribution",
  accroche:
    "Vendre soi-même ou passer par un intermédiaire ? Le canal direct garde toute la marge, l'intermédiaire apporte des clients et se paie. Ce qu'il coûte, et ce qu'il rapporte.",
  objectifs: [
    "Distinguer canal direct et canal indirect",
    "Calculer la part d'un canal dans les ventes",
    "Chiffrer ce que coûte un intermédiaire par unité vendue",
    "Peser les avantages et les coûts d'un canal",
  ],
  libre: false,
  entreprises: {
    codes: DISTRIBUTIONS,
    pourquoi: "ce chapitre compare un canal direct et un canal indirect, et seules PIXEL & CO et NOVA vendent par un intermédiaire dans l'arène.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux chemins vers le client",
      notions: ["distribution_commission"],
      texte: (c) => {
        const k = canauxDeDistribution(c);
        return [
          `${c.entreprise} vend de deux façons. En direct, à des clients qui lui achètent sans intermédiaire : c'est un canal direct. Et par « ${k.nomIndirect} », un intermédiaire qui ${k.tauxDeCommission > 0 ? `prélève ${pct(k.tauxDeCommission)} de commission et reverse à ${qte(k.delai)} jours` : `revend ses produits et paie ${c.entreprise} à ${qte(k.delai)} jours`} : c'est un canal indirect court, avec un seul intermédiaire.`,
          `Le tableau compare les deux canaux au ${ordinal(k.trimestre)} trimestre de l'arène, celui où l'intermédiaire vend le plus.`,
        ];
      },
      tableau: (c) => {
        const k = canauxDeDistribution(c);
        return {
          titre: `Les deux canaux, ${ordinal(k.trimestre)} trimestre`,
          colonnes: ["Canal direct", `Canal indirect (${k.nomIndirect})`],
          lignes: [
            { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.direct.ventes), qte(k.intermediaire.ventes)] },
            { libelle: "Chiffre d'affaires", valeurs: [eur(k.direct.chiffreDAffaires), eur(k.intermediaire.chiffreDAffaires)] },
            { libelle: "Prix moyen", valeurs: [eur(k.direct.prix), eur(k.intermediaire.prix)] },
            { libelle: "Commission prélevée", valeurs: [eur(0), eur(k.intermediaire.commission)] },
            { libelle: "Délai de paiement", valeurs: ["à la commande", `${qte(k.delai)} jours`] },
          ],
        };
      },
      repere: () => "Canal direct : aucun intermédiaire. Canal court : un intermédiaire. Canal long : plusieurs intermédiaires (grossiste puis détaillant).",
    },
    {
      id: "part",
      type: "montants",
      titre: "Le poids du canal indirect",
      notions: ["distribution_commission"],
      question: (c) => {
        const k = canauxDeDistribution(c);
        return `Au ${ordinal(k.trimestre)} trimestre, ${c.entreprise} vend ${qte(k.direct.ventes)} ${c.unites} en direct et ${qte(k.intermediaire.ventes)} par « ${k.nomIndirect} ». Calculez la part du canal indirect dans les ventes, en pourcentage au dixième, puis ce que l'intermédiaire lui doit réellement (chiffre d'affaires moins commission).`;
      },
      champs: (c) => {
        const k = canauxDeDistribution(c);
        const total = k.direct.ventes + k.intermediaire.ventes;
        return [
          { libelle: "Part du canal indirect (%)", attendu: k.partDesVentes, calcul: `${qte(k.intermediaire.ventes)} ÷ ${qte(total)} × 100 = ${pct(k.partDesVentes)}`, tolerance: 0.1 },
          {
            libelle: "Montant dû par l'intermédiaire",
            attendu: k.intermediaire.chiffreDAffaires - k.intermediaire.commission,
            calcul: `${eur(k.intermediaire.chiffreDAffaires)} − ${eur(k.intermediaire.commission)} = ${eur(k.intermediaire.chiffreDAffaires - k.intermediaire.commission)}`,
          },
        ];
      },
      explication: (c) => {
        const k = canauxDeDistribution(c);
        return [
          `Ce trimestre, ${pct(k.partDesVentes)} des ventes passent par l'intermédiaire. ${k.intermediaire.commission > 0 ? `Il garde ${eur(k.intermediaire.commission)} de commission : c'est le prix de sa mise en relation.` : "Il ne prend pas de commission ; son coût est ailleurs : il paie tard."}`,
        ];
      },
    },
    {
      id: "cout",
      type: "montants",
      titre: "Ce que coûte l'intermédiaire",
      notions: ["distribution_commission", "payment_terms"],
      question: (c) => {
        const k = canauxDeDistribution(c);
        return `L'intermédiaire paie à ${qte(k.delai)} jours. ${c.entreprise} attend le montant dû, taxes comprises (${pct(k.tva * 100)} de TVA, due dès la livraison), et finance cette attente au taux de son emprunt, ${pct(k.tauxDeLEmprunt)} par an. Calculez le coût du délai sur le trimestre (année de 360 jours), puis ce que coûte l'intermédiaire par unité vendue, commission et délai compris.`;
      },
      champs: (c) => {
        const k = canauxDeDistribution(c);
        const reverse = k.intermediaire.chiffreDAffaires - k.intermediaire.commission;
        return [
          {
            libelle: "Coût du délai de paiement",
            attendu: k.coutDuDelai,
            calcul: `${eur(reverse)} × ${qte(1 + k.tva)} × ${pct(k.tauxDeLEmprunt)} × ${qte(k.delai)} ÷ 360 = ${eur(k.coutDuDelai)}`,
            tolerance: 1,
          },
          {
            libelle: "Coût de l'intermédiaire par unité",
            attendu: k.coutParUnite,
            calcul: `(${eur(k.intermediaire.commission)} + ${eur(k.coutDuDelai)}) ÷ ${qte(k.intermediaire.ventes)} = ${eur(k.coutParUnite)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const k = canauxDeDistribution(c);
        return [
          `Chaque ${c.unite} ${accord(c, "vendu")} par l'intermédiaire coûte ${eur(k.coutParUnite)} de plus qu'en direct, soit ${pct(k.partDuCoutDansLePrix)} de son prix. ${k.intermediaire.commission > 0 ? "L'essentiel est la commission ; le délai s'y ajoute." : "Sans commission, tout le coût est dans l'attente du paiement."}`,
        ];
      },
    },
    {
      id: "avantage",
      type: "choix",
      titre: "Pourquoi passer par un intermédiaire",
      notions: ["distribution_commission", "segmentation"],
      question: (c) => `Puisque le canal indirect coûte plus cher par unité, pourquoi ${c.entreprise} l'utilise-t-elle ?`,
      options: (c) => {
        const k = canauxDeDistribution(c);
        return [
          {
            texte: "Il lui apporte des clients qu'elle n'atteindrait pas seule",
            juste: true,
            retour: `Oui : les ${qte(k.intermediaire.ventes)} ${c.unites} ${accordPluriel(c, "vendu")} par « ${k.nomIndirect} » viennent de clients qui achètent chez l'intermédiaire, pas chez ${c.entreprise}. Sans lui, ces ventes n'existeraient pas : son coût se compare à une vente perdue, pas à une vente directe.`,
          },
          {
            texte: "Il vend plus cher que le canal direct",
            juste: false,
            retour: `Non : le prix moyen y est de ${eur(k.intermediaire.prix)}, contre ${eur(k.direct.prix)} en direct. L'intérêt de l'intermédiaire n'est pas le prix.`,
          },
          {
            texte: "Il paie plus vite que les clients directs",
            juste: false,
            retour: `Non : les clients directs paient à la commande, l'intermédiaire à ${qte(k.delai)} jours. C'est l'un de ses coûts.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["distribution_commission"],
      texte: (c) => {
        const k = canauxDeDistribution(c);
        return [
          `Au ${ordinal(k.trimestre)} trimestre, le canal « ${k.nomIndirect} » apporte ${pct(k.partDesVentes)} des ventes ${dE(c.entreprise)}, et coûte ${eur(k.coutParUnite)} par unité de plus que la vente directe.`,
          "Choisir ses canaux, c'est arbitrer entre la marge, gardée entière en direct, et la portée, que donne un intermédiaire. La plupart des entreprises combinent les deux : on parle de distribution multicanal.",
          "Dans l'arène, l'intermédiaire paie le même prix que les clients directs. Un vrai distributeur achète moins cher qu'il ne revend, pour garder sa marge : le canal indirect y coûte donc davantage.",
        ];
      },
      repere: () => "Un canal indirect se juge sur les clients qu'il apporte, comparés à ce qu'il coûte par unité : commission, délai de paiement, et marge cédée.",
    },
  ],
};
