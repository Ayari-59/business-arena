import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { canaux } from "../../chapitres/commissions-des-partenaires";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES COMMISSIONS DES CANAUX PARTENAIRES » : LA MISE EN AVANT
 * PAYANTE (BTS NDRC, palier 3).
 *
 * La place de marché propose une offre de mise en avant : une commission plus forte, en
 * échange de plus de commandes. La responsable des ventes en ligne demande s'il faut
 * signer. L'élève refait seul le chemin du chapitre : la commission et la marge après
 * commission d'une commande, la marge que le canal laisse sur le trimestre, la même chose
 * avec l'offre, les commandes qu'il faudrait pour payer la hausse, et la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : la commission n'est plus celle du scénario, et elle
 * s'échange contre un volume. Les chiffres de départ sont ceux du premier trimestre de
 * l'arène, canal par canal, lus par `canaux`.
 */

/**
 * La commission de l'offre de mise en avant : 15 % du prix au lieu de 12 %. Trois points
 * de plus, l'écart courant entre l'offre de base d'une place de marché et son offre
 * « premium », qui place les produits en tête des résultats de recherche.
 */
export const COMMISSION_PROPOSEE = 0.15;

/**
 * Ce que la place de marché promet en échange : un dixième de commandes en plus. C'est
 * sa promesse commerciale, que le cas ne discute pas : il calcule ce qu'elle devrait
 * valoir pour payer la hausse.
 */
export const COMMANDES_EN_PLUS_PROMISES = 0.1;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Le canal aujourd'hui et avec l'offre de mise en avant. */
export function miseEnAvant(c: Cas) {
  const k = canaux(c);
  const commandes = k.place.commandes;
  const margeDuCanal = auCentime(commandes * k.margeApresCommission);
  const commission = auCentime(k.prix * COMMISSION_PROPOSEE);
  const margeAvec = auCentime(k.margeParCommande - commission);
  const commandesPromises = Math.round(commandes * (1 + COMMANDES_EN_PLUS_PROMISES));
  const margeDuCanalAvec = auCentime(commandesPromises * margeAvec);
  // Les commandes qui, à la nouvelle commission, laissent la marge du canal d'aujourd'hui : arrondies au-dessus.
  const commandesNecessaires = Math.ceil(margeDuCanal / margeAvec - 1e-9);
  return {
    k,
    commandes,
    margeDuCanal,
    tauxPropose: COMMISSION_PROPOSEE * 100,
    promesse: COMMANDES_EN_PLUS_PROMISES * 100,
    points: auDixieme(COMMISSION_PROPOSEE * 100 - k.taux),
    commission,
    margeAvec,
    commandesPromises,
    margeDuCanalAvec,
    commandesNecessaires,
    hausseNecessaire: auDixieme((commandesNecessaires / commandes - 1) * 100),
    ecart: auCentime(margeDuCanalAvec - margeDuCanal),
    // Les erreurs classiques : compter les ventes en plus comme un gain, et oublier que la
    // nouvelle commission se paie aussi sur les commandes qu'on avait déjà.
    ventesEnPlus: auCentime((commandesPromises - commandes) * k.prix),
    margeDesCommandesEnPlus: auCentime((commandesPromises - commandes) * margeAvec),
  };
}

export const LA_MISE_EN_AVANT_PAYANTE: Situation = {
  code: "la-mise-en-avant-payante",
  parcours: "ndrc",
  palier: 3,
  blocs: [],
  reprend: ["commissions-des-partenaires"],
  commanditaire: "La responsable des ventes en ligne",
  titre: "La mise en avant payante",
  accroche:
    "La place de marché promet plus de commandes contre une commission plus forte. La responsable des ventes en ligne veut savoir s'il faut signer.",
  objectifs: [
    "Calculer la commission et la marge après commission d'une commande",
    "Calculer la marge qu'un canal partenaire laisse sur le trimestre",
    "Trouver le volume qui paie une hausse de commission",
    "Rédiger une réponse chiffrée à la responsable des ventes en ligne",
  ],
  libre: false,
  entreprises: {
    codes: ["ecommerce"],
    pourquoi: "ce cas suit un canal partenaire commissionné, et PIXEL & CO est l'entreprise de l'arène qui vend par une place de marché.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable des ventes en ligne",
      texte: (c) => {
        const r = miseEnAvant(c);
        return [
          `« La place de marché nous propose son offre de mise en avant : nos produits en tête des recherches, et une commission qui passe de ${pct(r.k.taux)} à ${pct(r.tauxPropose)} du prix. Elle nous promet ${pct(r.promesse)} de commandes en plus. Est-ce que ${c.entreprise} doit signer ? »`,
          "Pas de cours cette fois : vous avez les chiffres du premier trimestre, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = miseEnAvant(c);
        return {
          titre: `La place de marché, premier trimestre · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Prix d'une commande", valeurs: [eur(r.k.prix)] },
            { libelle: "Coût variable d'une commande", valeurs: [eur(r.k.coutVariable)] },
            { libelle: "Commandes passées par la place de marché", valeurs: [qte(r.commandes)] },
            { libelle: "Commission aujourd'hui, en part du prix", valeurs: [pct(r.k.taux)] },
            { libelle: "Commission de l'offre de mise en avant", valeurs: [pct(r.tauxPropose)] },
            { libelle: "Commandes en plus promises", valeurs: [pct(r.promesse)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la marge du canal aujourd'hui et avec l'offre, les commandes qu'il faudrait pour payer la hausse, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "Le canal aujourd'hui",
      notions: ["distribution_commission", "contribution_margin"],
      question: () =>
        "À la commission d'aujourd'hui, calculez la commission prélevée sur une commande, la marge après commission d'une commande, puis la marge que le canal laisse sur le trimestre.",
      champs: (c) => {
        const r = miseEnAvant(c);
        return [
          { libelle: "Commission par commande", attendu: r.k.commissionParCommande, calcul: `${eur(r.k.prix)} × ${pct(r.k.taux)} = ${eur(r.k.commissionParCommande)}` },
          { libelle: "Marge après commission", attendu: r.k.margeApresCommission, calcul: `${eur(r.k.prix)} − ${eur(r.k.coutVariable)} − ${eur(r.k.commissionParCommande)} = ${eur(r.k.margeApresCommission)}` },
          { libelle: "Marge du canal sur le trimestre", attendu: r.margeDuCanal, calcul: `${qte(r.commandes)} × ${eur(r.k.margeApresCommission)} = ${eur(r.margeDuCanal)}` },
        ];
      },
      explication: (c) => {
        const r = miseEnAvant(c);
        return [
          `Aujourd'hui, la place de marché laisse ${eur(r.margeDuCanal)} de marge sur le trimestre, une fois sa commission payée. C'est ce que l'offre doit dépasser.`,
        ];
      },
    },
    {
      id: "avec-l-offre",
      type: "montants",
      titre: "Le canal avec l'offre",
      notions: ["distribution_commission", "contribution_margin"],
      question: (c) => {
        const r = miseEnAvant(c);
        return `À ${pct(r.tauxPropose)} de commission, calculez la commission par commande et la marge après commission. Si la promesse de ${pct(r.promesse)} de commandes en plus est tenue, combien de commandes passeront par le canal (à l'unité), et quelle marge laissera-t-il sur le trimestre ?`;
      },
      champs: (c) => {
        const r = miseEnAvant(c);
        return [
          { libelle: "Commission par commande", attendu: r.commission, calcul: `${eur(r.k.prix)} × ${pct(r.tauxPropose)} = ${eur(r.commission)}` },
          { libelle: "Marge après commission", attendu: r.margeAvec, calcul: `${eur(r.k.margeParCommande)} − ${eur(r.commission)} = ${eur(r.margeAvec)}` },
          { libelle: "Commandes promises", attendu: r.commandesPromises, tolerance: 1, calcul: `${qte(r.commandes)} × (1 + ${pct(r.promesse)}) ≈ ${qte(r.commandesPromises)}` },
          { libelle: "Marge du canal avec l'offre", attendu: r.margeDuCanalAvec, tolerance: Math.max(1, r.margeAvec), calcul: `${qte(r.commandesPromises)} × ${eur(r.margeAvec)} = ${eur(r.margeDuCanalAvec)}` },
        ];
      },
      explication: (c) => {
        const r = miseEnAvant(c);
        return [
          `La hausse de commission se paie sur toutes les commandes du canal, pas seulement sur celles qu'elle amène : chacune laisse ${eur(r.margeAvec)} au lieu de ${eur(r.k.margeApresCommission)}.`,
          r.margeAvec > r.k.margeApresAcquisition
            ? `À ${pct(r.tauxPropose)}, une commande de la place de marché laisse encore plus qu'une commande de la campagne (${eur(r.k.margeApresAcquisition)}) : la question n'est pas de quitter le canal, mais de savoir si la mise en avant vaut ce qu'elle coûte.`
            : `À ${pct(r.tauxPropose)}, une commande de la place de marché laisse moins qu'une commande de la campagne (${eur(r.k.margeApresAcquisition)}).`,
        ];
      },
    },
    {
      id: "volume",
      type: "montants",
      titre: "Les commandes qui paieraient la hausse",
      notions: ["distribution_commission"],
      question: (c) => {
        const r = miseEnAvant(c);
        return `Combien de commandes faudrait-il, à ${eur(r.margeAvec)} de marge chacune, pour retrouver la marge du canal d'aujourd'hui (${eur(r.margeDuCanal)}), à l'unité supérieure ? Quelle hausse des commandes cela représente-t-il, en pourcentage au dixième ?`;
      },
      champs: (c) => {
        const r = miseEnAvant(c);
        return [
          { libelle: "Commandes nécessaires", attendu: r.commandesNecessaires, tolerance: 1, calcul: `${eur(r.margeDuCanal)} ÷ ${eur(r.margeAvec)}, arrondi au-dessus = ${qte(r.commandesNecessaires)}` },
          { libelle: "Hausse nécessaire des commandes (%)", attendu: r.hausseNecessaire, tolerance: 0.2, calcul: `(${qte(r.commandesNecessaires)} ÷ ${qte(r.commandes)} − 1) × 100 = ${pct(r.hausseNecessaire)}` },
        ];
      },
      explication: (c) => {
        const r = miseEnAvant(c);
        return [
          r.hausseNecessaire > r.promesse
            ? `Pour payer ${qte(r.points)} points de commission, il faudrait ${pct(r.hausseNecessaire)} de commandes en plus. La place de marché en promet ${pct(r.promesse)} : même tenue, la promesse ne suffit pas.`
            : `Pour payer ${qte(r.points)} points de commission, il suffirait de ${pct(r.hausseNecessaire)} de commandes en plus. La place de marché en promet ${pct(r.promesse)} : tenue, la promesse paie la hausse.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable des ventes en ligne",
      question: () => "Quelle phrase envoyez-vous à la responsable des ventes en ligne ?",
      options: (c) => {
        const r = miseEnAvant(c);
        const signer = r.ecart > 0;
        return [
          {
            texte: signer
              ? `Signer : il suffit de ${pct(r.hausseNecessaire)} de commandes en plus`
              : `Refuser : il faudrait ${pct(r.hausseNecessaire)} de commandes en plus, pas ${pct(r.promesse)}`,
            juste: true,
            retour: `Oui : avec l'offre, le canal laisserait ${eur(r.margeDuCanalAvec)} au lieu de ${eur(r.margeDuCanal)}, soit ${eur(Math.abs(r.ecart))} ${signer ? "de plus" : "de moins"} sur le trimestre. Il faudrait ${qte(r.commandesNecessaires)} commandes pour payer la hausse ; la promesse en donne ${qte(r.commandesPromises)}.`,
          },
          {
            texte: `Signer : ${qte(r.points)} points de commission contre ${pct(r.promesse)} de commandes en plus`,
            juste: false,
            retour: `Non : les deux pourcentages ne portent pas sur la même chose. Les ${qte(r.points)} points se prennent sur le prix, donc sur une marge de ${eur(r.k.margeParCommande)} : chaque commande laisse ${eur(r.margeAvec)} au lieu de ${eur(r.k.margeApresCommission)}, soit ${pct(auDixieme((1 - r.margeAvec / r.k.margeApresCommission) * 100))} de moins.`,
          },
          {
            texte: `Signer : nous y gagnerons ${eur(r.ventesEnPlus)} par trimestre`,
            juste: false,
            retour: `Non : ${eur(r.ventesEnPlus)}, ce sont les ventes en plus, pas le gain. Il faut en retirer leurs coûts variables et la commission, et payer la hausse sur toutes les autres commandes : la marge du canal ${r.ecart < 0 ? "baisse" : "monte"} de ${eur(Math.abs(r.ecart))}.`,
          },
          {
            texte: `Signer : le canal laissera ${eur(r.margeDesCommandesEnPlus)} de marge en plus`,
            juste: false,
            retour: `Non : ${eur(r.margeDesCommandesEnPlus)}, c'est la marge des seules commandes en plus. C'est oublier que les ${qte(r.commandes)} commandes d'aujourd'hui paieront elles aussi ${pct(r.tauxPropose)}, soit ${eur(auCentime(r.commission - r.k.commissionParCommande))} de plus chacune. Tout compté, la marge du canal ${r.ecart < 0 ? "baisse" : "monte"} de ${eur(Math.abs(r.ecart))}.`,
          },
        ];
      },
    },
  ],
};
