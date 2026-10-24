import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre } from "../types";
import { JOURS_PAR_AN } from "../remises";

/**
 * CHAPITRE : LES COMMISSIONS DES CANAUX PARTENAIRES (BTS NDRC, palier 3).
 *
 * Trois façons de vendre la même commande : au client fidèle, qui revient seul ; au nouveau
 * client, que la campagne a payé pour amener ; au client d'une place de marché, qui prélève sa
 * commission et reverse à trente jours. Le chapitre calcule ce que laisse une commande dans
 * chaque canal, compare la commission au coût d'acquisition, cherche la commission plafond,
 * chiffre le délai de reversement, et pèse ce que le canal garde pour lui : le client.
 *
 * PIXEL & CO est l'entreprise de l'arène qui vend par une place de marché : le chapitre s'y joue.
 * Les chiffres sont ceux du premier trimestre de l'arène, canal par canal ; la commission et le
 * délai de reversement sont ceux du scénario, le taux de financement celui de l'emprunt de
 * l'entreprise. Aucune hypothèse n'est ajoutée.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les entreprises de l'arène qui vendent par un canal commissionné, et le code de ce canal. */
export function canalCommissionne(code: string) {
  return scenarioByCode(code).scenario.market.segments.find((s) => (s.commissionRate ?? 0) > 0) ?? null;
}

/** Les trois canaux du premier trimestre, et ce que laisse une commande dans chacun. */
export function canaux(c: Cas) {
  const partenaire = canalCommissionne(c.code)!;
  const r = anneeJouee(c.code).partie.rounds[0]!.results["joueur"]!;
  const coutVariable = c.gestion.coutVariableUnitaire;
  const budget = Math.round(r.incomeStatement.marketingCost);
  const lire = (code: string) => {
    const s = r.market.bySegment[code]!;
    return { commandes: Math.round(s.sold), chiffreDAffaires: Math.round(s.revenue), commission: Math.round(s.commission ?? 0) };
  };
  const fideles = lire("fideles");
  const nouveaux = lire("acquisition");
  const place = lire(partenaire.code);
  const prix = auCentime(r.market.bySegment[partenaire.code]!.revenue / r.market.bySegment[partenaire.code]!.sold);
  const taux = partenaire.commissionRate!;
  const commissionParCommande = auCentime(prix * taux);
  const margeParCommande = auCentime(prix - coutVariable);
  const cac = auCentime(budget / nouveaux.commandes);
  const margeApresCommission = auCentime(margeParCommande - commissionParCommande);
  const margeApresAcquisition = auCentime(margeParCommande - cac);
  const margeDuCanal = (k: { commandes: number; chiffreDAffaires: number }, cout: number) => Math.round(k.chiffreDAffaires - k.commandes * coutVariable - cout);
  const lignes = [
    { nom: "Clients fidèles", ...fideles, cout: 0, marge: margeDuCanal(fideles, 0) },
    { nom: "Nouveaux clients (campagne)", ...nouveaux, cout: budget, marge: margeDuCanal(nouveaux, budget) },
    { nom: "Place de marché", ...place, cout: place.commission, marge: margeDuCanal(place, place.commission) },
  ];
  const totalCommandes = lignes.reduce((t, l) => t + l.commandes, 0);
  const totalMarge = lignes.reduce((t, l) => t + l.marge, 0);
  // Le reversement à `delai` jours : la place de marché encaisse le client toutes taxes comprises et reverse
  // plus tard. Sur une vente de marchandises, la TVA est due dès la livraison : l'entreprise l'avance aussi.
  const delai = partenaire.paymentDelayDays;
  const tauxTva = c.venteCredit.tauxTva;
  const attenteTtc = auCentime((place.chiffreDAffaires - place.commission) * (1 + tauxTva));
  const coutDuDelai = auCentime((attenteTtc * c.pret.tauxAnnuel * delai) / JOURS_PAR_AN);
  return {
    nomDuPartenaire: partenaire.name.replace(/\s*\(.*\)\s*$/, ""),
    taux: auDixieme(taux * 100),
    prix,
    coutVariable,
    budget,
    commissionParCommande,
    margeParCommande,
    partPrelevee: auDixieme((commissionParCommande / margeParCommande) * 100),
    margeApresCommission,
    cac,
    tauxEquivalent: auDixieme((cac / prix) * 100),
    margeApresAcquisition,
    plafond: Math.floor(((margeParCommande - margeApresAcquisition) / prix) * 100 + 1e-9),
    lignes,
    place: lignes[2]!,
    partDesCommandes: auDixieme((place.commandes / totalCommandes) * 100),
    partDeLaMarge: auDixieme((lignes[2]!.marge / totalMarge) * 100),
    delai,
    tauxTva,
    attenteTtc,
    tauxDeLEmprunt: auDixieme(c.pret.tauxAnnuel * 100),
    coutDuDelai,
    coutDuDelaiParCommande: auCentime(coutDuDelai / place.commandes),
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
    "Une place de marché amène des commandes sans campagne, et prélève sa part. Ce qu'elle coûte vraiment, comparée au client qu'on va chercher soi-même, et ce qu'elle garde pour elle.",
  objectifs: [
    "Calculer la commission et la marge après commission d'une commande",
    "Comparer la commission d'un partenaire au coût d'acquisition d'un client",
    "Lire la contribution de chaque canal à la marge",
    "Trouver la commission plafond d'un canal",
    "Chiffrer le coût d'un délai de reversement",
  ],
  libre: false,
  entreprises: {
    codes: ["ecommerce"],
    pourquoi: "ce chapitre suit un canal partenaire commissionné, et PIXEL & CO est l'entreprise de l'arène qui vend par une place de marché.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois canaux pour une même commande",
      notions: ["distribution_commission"],
      texte: (c) => {
        const k = canaux(c);
        return [
          `${c.entreprise} vend la même commande, ${eur(k.prix)}, par trois canaux. Le client fidèle revient seul. Le nouveau client vient de la campagne, payée ${eur(k.budget)} au premier trimestre. Le client de la place de marché passe par un partenaire qui prélève ${pct(k.taux)} du prix et reverse à ${qte(k.delai)} jours.`,
          `Chaque commande coûte ${eur(k.coutVariable)} à acheter, préparer et livrer, quel que soit le canal. Ce qui change, c'est ce que le canal coûte pour l'amener.`,
        ];
      },
      repere: () => "Commission = taux × prix de vente. Marge après commission = prix − coût variable − commission.",
    },
    {
      id: "commission",
      type: "montants",
      titre: "Ce que prélève le partenaire",
      notions: ["distribution_commission", "contribution_margin"],
      question: (c) => {
        const k = canaux(c);
        return `Calculez la commission prélevée sur une commande de ${eur(k.prix)} (${pct(k.taux)}), la marge d'une commande vendue en direct (${eur(k.prix)} − ${eur(k.coutVariable)}), la marge après commission, puis la part de la marge que prend le partenaire, au dixième.`;
      },
      champs: (c) => {
        const k = canaux(c);
        return [
          { libelle: "Commission par commande", attendu: k.commissionParCommande, calcul: `${eur(k.prix)} × ${pct(k.taux)} = ${eur(k.commissionParCommande)}` },
          { libelle: "Marge d'une commande en direct", attendu: k.margeParCommande, calcul: `${eur(k.prix)} − ${eur(k.coutVariable)} = ${eur(k.margeParCommande)}` },
          { libelle: "Marge après commission", attendu: k.margeApresCommission, calcul: `${eur(k.margeParCommande)} − ${eur(k.commissionParCommande)} = ${eur(k.margeApresCommission)}` },
          { libelle: "Part de la marge prélevée (%)", attendu: k.partPrelevee, calcul: `${eur(k.commissionParCommande)} ÷ ${eur(k.margeParCommande)} × 100 = ${pct(k.partPrelevee)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = canaux(c);
        return [
          `La commission se calcule sur le prix, mais elle se paie sur la marge : ${pct(k.taux)} du prix, c'est ${pct(k.partPrelevee)} de ce que la commande laisse. Le client, lui, ne la voit jamais : elle n'apparaît qu'au compte de résultat, sur la ligne des commissions des canaux partenaires.`,
        ];
      },
    },
    {
      id: "comparer",
      type: "montants",
      titre: "La commission face au coût d'acquisition",
      notions: ["distribution_commission", "customer_acquisition_cost"],
      question: (c) => {
        const k = canaux(c);
        const nouveaux = k.lignes[1]!;
        return `Au premier trimestre, la campagne a coûté ${eur(k.budget)} pour ${qte(nouveaux.commandes)} commandes de nouveaux clients. Calculez le coût d'acquisition d'une commande, ce qu'il représente en pourcentage du prix (au dixième), puis la marge qui reste sur la commande d'un nouveau client.`;
      },
      champs: (c) => {
        const k = canaux(c);
        const nouveaux = k.lignes[1]!;
        return [
          { libelle: "Coût d'acquisition par commande", attendu: k.cac, calcul: `${eur(k.budget)} ÷ ${qte(nouveaux.commandes)} = ${eur(k.cac)}` },
          { libelle: "En pourcentage du prix (%)", attendu: k.tauxEquivalent, calcul: `${eur(k.cac)} ÷ ${eur(k.prix)} × 100 = ${pct(k.tauxEquivalent)}`, tolerance: 0.1 },
          { libelle: "Marge après acquisition", attendu: k.margeApresAcquisition, calcul: `${eur(k.margeParCommande)} − ${eur(k.cac)} = ${eur(k.margeApresAcquisition)}` },
        ];
      },
      explication: (c) => {
        const k = canaux(c);
        return [
          `Aller chercher soi-même un nouveau client revient à payer ${pct(k.tauxEquivalent)} du prix de sa commande, contre ${pct(k.taux)} de commission à la place de marché. Les deux sont des coûts de distribution : l'un se paie d'avance en publicité, l'autre seulement quand la vente a lieu.`,
        ];
      },
    },
    {
      id: "quel-canal",
      type: "choix",
      titre: "Le canal qui laisse le plus",
      notions: ["distribution_commission", "customer_acquisition_cost"],
      question: (c) => {
        const k = canaux(c);
        return `Pour une commande d'un client qui n'est pas encore fidèle, quel canal laisse le plus à ${c.entreprise} : la campagne (${eur(k.margeApresAcquisition)} par commande) ou la place de marché (${eur(k.margeApresCommission)}) ?`;
      },
      options: (c) => {
        const k = canaux(c);
        const place = k.margeApresCommission > k.margeApresAcquisition;
        return [
          {
            texte: "La place de marché",
            juste: place,
            retour: place
              ? `Oui, sur la commande : ${eur(k.margeApresCommission)} contre ${eur(k.margeApresAcquisition)}. La commission de ${pct(k.taux)} coûte moins que les ${pct(k.tauxEquivalent)} du prix que coûte un client amené par la campagne.`
              : `Non : ${eur(k.margeApresCommission)} contre ${eur(k.margeApresAcquisition)} par la campagne.`,
          },
          {
            texte: "La campagne",
            juste: !place,
            retour: place
              ? `Non, pas sur cette commande : la campagne laisse ${eur(k.margeApresAcquisition)}, la place de marché ${eur(k.margeApresCommission)}. Mais le client gagné par la campagne est à ${c.entreprise}, et ses commandes suivantes ne coûteront plus rien : c'est ce que le chapitre pèse plus loin.`
              : `Oui : ${eur(k.margeApresAcquisition)} contre ${eur(k.margeApresCommission)} par la place de marché.`,
          },
          {
            texte: "Les deux se valent : chaque canal a son coût",
            juste: false,
            retour: `Non : les deux coûts se comparent par commande, et ils ne sont pas égaux : ${eur(k.cac)} de campagne contre ${eur(k.commissionParCommande)} de commission.`,
          },
        ];
      },
    },
    {
      id: "contribution",
      type: "lecture",
      titre: "Ce que chaque canal apporte",
      notions: ["distribution_commission"],
      texte: (c) => {
        const k = canaux(c);
        return [
          `Au premier trimestre, la place de marché fait ${pct(k.partDesCommandes)} des commandes de ${c.entreprise}, mais ${pct(k.partDeLaMarge)} de la marge laissée par les trois canaux, une fois payé ce que chacun coûte. Un canal commissionné pèse toujours moins dans la marge que dans les ventes.`,
          "Les clients fidèles, eux, ne coûtent rien à amener : chaque commande laisse la marge entière. C'est le canal que les deux autres doivent nourrir.",
        ];
      },
      tableau: (c) => {
        const k = canaux(c);
        return {
          titre: "Les trois canaux, premier trimestre",
          colonnes: k.lignes.map((l) => l.nom),
          lignes: [
            { libelle: "Commandes", valeurs: k.lignes.map((l) => qte(l.commandes)) },
            { libelle: "Chiffre d'affaires", valeurs: k.lignes.map((l) => eur(l.chiffreDAffaires)) },
            { libelle: "Coût du canal (campagne ou commission)", valeurs: k.lignes.map((l) => eur(l.cout)) },
            { libelle: "Marge après coût du canal", valeurs: k.lignes.map((l) => eur(l.marge)) },
          ],
        };
      },
    },
    {
      id: "plafond",
      type: "curseur",
      titre: "La commission plafond",
      notions: ["distribution_commission"],
      question: (c) => {
        const k = canaux(c);
        return `La place de marché veut relever sa commission. Faites varier le taux, et placez le curseur sur le plus élevé, au pourcentage entier, auquel une commande de la place de marché laisse encore autant qu'une commande de la campagne (${eur(k.margeApresAcquisition)}).`;
      },
      grandeur: () => ({ libelle: "Taux de commission", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => {
        const k = canaux(c);
        return { attendu: k.plafond, max: Math.min(60, k.plafond + 15) };
      },
      lecture: (c, t) => {
        const k = canaux(c);
        const commission = auCentime((k.prix * t) / 100);
        return [
          { libelle: "Commission par commande", montant: commission },
          { libelle: "Marge après commission", montant: auCentime(k.margeParCommande - commission) },
          { libelle: "Marge après acquisition (campagne)", montant: k.margeApresAcquisition },
          { libelle: "Écart en faveur de la place de marché", montant: auCentime(k.margeParCommande - commission - k.margeApresAcquisition), fort: true },
        ];
      },
      droites: (c) => {
        const k = canaux(c);
        return {
          produit: (t) => k.margeParCommande - (k.prix * t) / 100,
          cout: () => k.margeApresAcquisition,
          libelles: ["Marge par commande, place de marché", "Marge par commande, campagne"],
        };
      },
      zones: ["La place de marché laisse plus", "La campagne laisse plus"],
      rates: () => ({
        dessous: "Plus haut, la place de marché laisse encore autant que la campagne : cherchez le taux le plus élevé.",
        dessus: "À ce taux, une commande de la place de marché laisse moins qu'une commande de la campagne.",
      }),
      montrer: "Montrer la commission plafond",
      explication: (c) => {
        const k = canaux(c);
        return [
          `Jusqu'à ${qte(k.plafond)} %, la place de marché reste le canal le moins cher pour une commande de client nouveau ; elle prélève aujourd'hui ${pct(k.taux)}. C'est la marge de négociation de ${c.entreprise} face à son partenaire : au-delà, mieux vaut payer la campagne.`,
        ];
      },
    },
    {
      id: "delai",
      type: "montants",
      titre: "Le délai de reversement",
      notions: ["payment_terms"],
      question: (c) => {
        const k = canaux(c);
        return `La place de marché encaisse les clients et reverse à ${c.entreprise} à ${qte(k.delai)} jours, commission déduite. Sur une vente de marchandises, la TVA est due dès la livraison : l'entreprise attend donc le montant toutes taxes comprises. Calculez ce qu'elle attend sur le trimestre (chiffre d'affaires moins commission, plus ${pct(k.tauxTva * 100)} de TVA), le coût de cette attente au taux de son emprunt (${pct(k.tauxDeLEmprunt)}, année de 360 jours), puis ce coût par commande.`;
      },
      champs: (c) => {
        const k = canaux(c);
        return [
          { libelle: "Montant attendu TTC", attendu: k.attenteTtc, calcul: `(${eur(k.place.chiffreDAffaires)} − ${eur(k.place.commission)}) × ${qte(1 + k.tauxTva)} = ${eur(k.attenteTtc)}` },
          { libelle: "Coût du délai de reversement", attendu: k.coutDuDelai, calcul: `${eur(k.attenteTtc)} × ${pct(k.tauxDeLEmprunt)} × ${qte(k.delai)} ÷ 360 = ${eur(k.coutDuDelai)}`, tolerance: 1 },
          { libelle: "Coût du délai par commande", attendu: k.coutDuDelaiParCommande, calcul: `${eur(k.coutDuDelai)} ÷ ${qte(k.place.commandes)} = ${eur(k.coutDuDelaiParCommande)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const k = canaux(c);
        return [
          `Le délai coûte ${eur(k.coutDuDelaiParCommande)} par commande, qui s'ajoutent aux ${eur(k.commissionParCommande)} de commission. Le client direct, lui, paie à la commande : ${c.entreprise} encaisse avant même d'avoir expédié.`,
        ];
      },
    },
    {
      id: "le-client",
      type: "choix",
      titre: "Ce que le partenaire garde",
      notions: ["distribution_commission", "customer_lifetime_value"],
      question: (c) => `Un client achète une première fois chez ${c.entreprise} par la place de marché, un autre par la campagne. Lorsqu'ils reviennent acheter, qu'est-ce qui les distingue ?`,
      options: (c) => {
        const k = canaux(c);
        return [
          {
            texte: "Le client de la place de marché repaiera la commission à chaque commande",
            juste: true,
            retour: `Oui : il reste le client de la place de marché, qui connaît son adresse et le fait revenir chez elle. Chaque commande repaie ${eur(k.commissionParCommande)}. Le client gagné par la campagne, s'il revient directement, laisse la marge entière de ${eur(k.margeParCommande)} : sa conquête ne se paie qu'une fois.`,
          },
          {
            texte: "Rien : une fois gagné, un client vaut la même chose quel que soit le canal",
            juste: false,
            retour: `Non : le canal partenaire prélève sur chaque commande, pas seulement sur la première. Le client direct, lui, ne coûte plus rien une fois gagné.`,
          },
          {
            texte: "Le client de la campagne coûtera à nouveau son coût d'acquisition",
            juste: false,
            retour: `Non : le coût d'acquisition se paie pour amener un client, une fois. S'il revient de lui-même, il entre dans les clients fidèles, et ses commandes laissent ${eur(k.margeParCommande)}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["distribution_commission", "customer_acquisition_cost"],
      texte: (c) => {
        const k = canaux(c);
        return [
          `Chez ${c.entreprise}, la place de marché prélève ${eur(k.commissionParCommande)} par commande, soit ${pct(k.partPrelevee)} de la marge, et reverse à ${qte(k.delai)} jours. Pour une première commande, elle coûte moins que la campagne (${eur(k.cac)}), jusqu'à une commission de ${qte(k.plafond)} %.`,
          "Mais elle garde le client : chaque commande suivante repaie la commission. Le canal partenaire sert à toucher des clients qu'on n'atteindrait pas seul ; le client qu'on garde, mieux vaut qu'il revienne en direct.",
          "Dans l'arène, les clientèles ne passent pas de l'une à l'autre : un client de la place de marché ou de la campagne n'y devient jamais un client fidèle. La dernière question raisonne donc comme une vraie entreprise, au-delà de ce que l'arène joue.",
        ];
      },
      repere: () => "Commission plafond = (marge en direct − marge après acquisition) ÷ prix. Un canal se juge sur la marge qu'il laisse, pas sur les commandes qu'il amène.",
    },
  ],
};
