import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { DISTRIBUTIONS, canauxDeDistribution } from "../../chapitres/canaux-de-distribution";
import { DELAI_MAXIMAL_CONVENU } from "../../monde/delais-et-tva";
import { JOURS_PAR_AN } from "../../remises";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES CANAUX DE DISTRIBUTION » : L'INTERMÉDIAIRE VEUT PAYER
 * PLUS TARD (Bac STMG, mercatique, palier 1).
 *
 * À la renégociation, l'intermédiaire demande un délai de paiement plus long. Le
 * responsable commercial veut savoir ce que ces jours coûteraient à l'entreprise, et ce
 * qu'il resterait d'une vente passée par l'intermédiaire. L'élève refait seul les calculs du
 * chapitre : le montant dû par l'intermédiaire, le coût du délai d'aujourd'hui et celui du
 * délai demandé, le coût de l'intermédiaire par unité, puis la marge qui reste.
 *
 * Le cas est neuf par sa question : le chapitre chiffre le canal tel qu'il est, le cas
 * chiffre une condition que l'intermédiaire veut changer. Et il fait vérifier la loi : entre
 * professionnels, le délai convenu ne peut pas dépasser 60 jours après la facture (code de commerce,
 * article L. 441-10). Chez PIXEL & CO, la place de marché passe de 30 à 60 jours : c'est permis, et la
 * réponse pèse le coût. Chez NOVA, CampusTech paie déjà à 60 jours : 90 jours ne se signent pas, quoi
 * que dise le calcul, et la réponse le rappelle. Le trimestre, la commission, le
 * délai et le taux de financement sont ceux du chapitre (`canauxDeDistribution`) ; le coût
 * variable d'une unité, celui du mois du cas (`cas.ts`).
 */

/**
 * Les jours de délai que l'intermédiaire demande en plus : 30, un mois de plus, ce qu'une
 * place de marché ou une chaîne de magasins réclame couramment à la renégociation de son
 * contrat.
 */
export const JOURS_DEMANDES_EN_PLUS = 30;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const ordinal = (n: number) => (n === 1 ? "premier" : `${n}e`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function intermediairePaiePlusTard(c: Cas) {
  const k = canauxDeDistribution(c);
  const du = k.intermediaire.chiffreDAffaires - k.intermediaire.commission;
  const ttc = auCentime(du * (1 + k.tva));
  const delaiDemande = k.delai + JOURS_DEMANDES_EN_PLUS;
  const plafond = DELAI_MAXIMAL_CONVENU.joursDeLaFacture;
  // Même calcul que le chapitre : l'attente se finance, taxes comprises, au taux de l'emprunt.
  const coutDuDelaiDemande = auCentime((du * (1 + k.tva) * c.pret.tauxAnnuel * delaiDemande) / JOURS_PAR_AN);
  const coutParUniteApres = auCentime((k.intermediaire.commission + coutDuDelaiDemande) / k.intermediaire.ventes);
  const coutVariable = c.gestion.coutVariableUnitaire;
  const margeUnitaire = auCentime(k.intermediaire.prix - coutVariable);
  return {
    k,
    du,
    ttc,
    delaiDemande,
    plafond,
    /** Le délai demandé reste-t-il dans ce que la loi permet de convenir entre professionnels ? */
    permis: delaiDemande <= plafond,
    coutDuDelaiDemande,
    surcout: auCentime(coutDuDelaiDemande - k.coutDuDelai),
    coutParUniteApres,
    coutVariable,
    margeUnitaire,
    margeQuiReste: auCentime(margeUnitaire - coutParUniteApres),
    // L'erreur classique : appliquer le taux annuel sans le ramener aux jours d'attente.
    surcoutSurUnAn: auCentime(du * (1 + k.tva) * c.pret.tauxAnnuel),
  };
}

export const L_INTERMEDIAIRE_VEUT_PAYER_PLUS_TARD: Situation = {
  code: "l-intermediaire-veut-payer-plus-tard",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["canaux-de-distribution"],
  commanditaire: "Le responsable commercial",
  titre: "L'intermédiaire veut payer plus tard",
  accroche:
    "À la renégociation, l'intermédiaire demande un mois de délai en plus. Ce que ces jours coûteraient, ce qui resterait d'une vente passée par lui, et si la loi le permet.",
  objectifs: [
    "Calculer le montant qu'un intermédiaire doit à l'entreprise",
    "Chiffrer le coût d'un délai de paiement, et d'un délai plus long",
    "Calculer le coût d'un intermédiaire par unité vendue",
    "Mesurer la marge qui reste sur une vente passée par un intermédiaire",
    "Vérifier qu'un délai de paiement respecte le plafond légal entre professionnels",
    "Rédiger une réponse chiffrée au responsable commercial",
  ],
  libre: false,
  entreprises: {
    codes: DISTRIBUTIONS,
    pourquoi: "ce cas chiffre un canal indirect, et seules PIXEL & CO et NOVA vendent par un intermédiaire dans l'arène.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable commercial",
      texte: (c) => {
        const r = intermediairePaiePlusTard(c);
        return [
          `« Notre intermédiaire renégocie son contrat : il veut nous payer à ${qte(r.delaiDemande)} jours au lieu de ${qte(r.k.delai)}. Avant de répondre, je veux savoir si la loi le permet, ce que ces ${qte(JOURS_DEMANDES_EN_PLUS)} jours coûteraient à ${c.entreprise} sur un trimestre comme celui de son record de ventes, et ce qu'il nous resterait d'une vente passée par lui. »`,
          `Pas de cours cette fois : vous avez les chiffres du canal, et les calculs sont ceux du chapitre. L'année se compte sur 360 jours. Un repère de droit : entre professionnels, le délai de paiement convenu ne peut pas dépasser ${qte(r.plafond)} jours après la facture (code de commerce, article L. 441-10).`,
        ];
      },
      tableau: (c) => {
        const r = intermediairePaiePlusTard(c);
        return {
          titre: `Le canal indirect au ${ordinal(r.k.trimestre)} trimestre · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Ventes par « ${r.k.nomIndirect} » (${c.unites})`, valeurs: [qte(r.k.intermediaire.ventes)] },
            { libelle: "Chiffre d'affaires hors taxes du canal", valeurs: [eur(r.k.intermediaire.chiffreDAffaires)] },
            { libelle: "Commission prélevée", valeurs: [eur(r.k.intermediaire.commission)] },
            { libelle: "TVA sur le montant dû", valeurs: [pct(r.k.tva * 100)] },
            { libelle: "Taux de l'emprunt qui finance l'attente (par an)", valeurs: [pct(r.k.tauxDeLEmprunt)] },
            { libelle: "Délai de paiement aujourd'hui", valeurs: [`${qte(r.k.delai)} jours`] },
            { libelle: "Délai demandé", valeurs: [`${qte(r.delaiDemande)} jours`] },
            { libelle: `Prix moyen d'${accord(c, "un")} ${c.unite} ${accord(c, "vendu")} par le canal`, valeurs: [eur(r.k.intermediaire.prix)] },
            { libelle: `Coût variable d'${accord(c, "un")} ${c.unite}`, valeurs: [eur(r.coutVariable)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le montant dû et le coût du délai d'aujourd'hui, le coût du délai demandé, le coût de l'intermédiaire par unité, la marge qui reste, et votre réponse.",
    },
    {
      id: "delai-actuel",
      type: "montants",
      titre: "Ce que coûte l'attente aujourd'hui",
      notions: ["distribution_commission", "payment_terms"],
      question: () =>
        "Calculez ce que l'intermédiaire doit à l'entreprise sur le trimestre (chiffre d'affaires moins commission), puis le coût du délai d'aujourd'hui : le montant dû taxes comprises, financé au taux de l'emprunt pendant le délai.",
      champs: (c) => {
        const r = intermediairePaiePlusTard(c);
        return [
          { libelle: "Montant dû hors taxes", attendu: r.du, calcul: `${eur(r.k.intermediaire.chiffreDAffaires)} − ${eur(r.k.intermediaire.commission)} = ${eur(r.du)}` },
          { libelle: "Coût du délai d'aujourd'hui", attendu: r.k.coutDuDelai, tolerance: 1, calcul: `${eur(r.du)} × ${qte(1 + r.k.tva)} × ${pct(r.k.tauxDeLEmprunt)} × ${qte(r.k.delai)} ÷ 360 = ${eur(r.k.coutDuDelai)}` },
        ];
      },
      explication: (c) => {
        const r = intermediairePaiePlusTard(c);
        return [
          `Pendant ${qte(r.k.delai)} jours, ${c.entreprise} attend ${eur(r.ttc)} taxes comprises : la TVA est due dès la vente, et c'est l'emprunt qui fait la trésorerie en attendant. Cette attente lui coûte ${eur(r.k.coutDuDelai)} sur le trimestre.`,
        ];
      },
    },
    {
      id: "delai-demande",
      type: "montants",
      titre: "Avec le délai demandé",
      notions: ["distribution_commission", "payment_terms"],
      question: () =>
        "Calculez le coût du délai demandé sur le même trimestre, ce qu'il coûte de plus qu'aujourd'hui, puis le coût de l'intermédiaire par unité vendue, commission et délai compris.",
      champs: (c) => {
        const r = intermediairePaiePlusTard(c);
        return [
          { libelle: "Coût du délai demandé", attendu: r.coutDuDelaiDemande, tolerance: 1, calcul: `${eur(r.du)} × ${qte(1 + r.k.tva)} × ${pct(r.k.tauxDeLEmprunt)} × ${qte(r.delaiDemande)} ÷ 360 = ${eur(r.coutDuDelaiDemande)}` },
          { libelle: "Coût en plus sur le trimestre", attendu: r.surcout, tolerance: 1, calcul: `${eur(r.coutDuDelaiDemande)} − ${eur(r.k.coutDuDelai)} = ${eur(r.surcout)}` },
          { libelle: "Coût de l'intermédiaire par unité", attendu: r.coutParUniteApres, tolerance: 0.02, calcul: `(${eur(r.k.intermediaire.commission)} + ${eur(r.coutDuDelaiDemande)}) ÷ ${qte(r.k.intermediaire.ventes)} = ${eur(r.coutParUniteApres)}` },
        ];
      },
      explication: (c) => {
        const r = intermediairePaiePlusTard(c);
        return [
          `${qte(JOURS_DEMANDES_EN_PLUS)} jours de plus coûteraient ${eur(r.surcout)} sur le trimestre. Par ${c.unite}, l'intermédiaire coûterait ${eur(r.coutParUniteApres)} au lieu de ${eur(r.k.coutParUnite)}${r.k.intermediaire.commission > 0 ? " : la commission reste l'essentiel de son coût" : " : sans commission, tout son coût est dans l'attente"}.`,
        ];
      },
    },
    {
      id: "marge-qui-reste",
      type: "montants",
      titre: "Ce qui reste d'une vente",
      notions: ["distribution_commission", "contribution_margin"],
      question: (c) =>
        `Calculez la marge d'${accord(c, "un")} ${c.unite} ${accord(c, "vendu")} par l'intermédiaire (prix moyen du canal moins coût variable), puis ce qu'il en resterait une fois payé le coût de l'intermédiaire avec le délai demandé.`,
      champs: (c) => {
        const r = intermediairePaiePlusTard(c);
        return [
          { libelle: `Marge d'${accord(c, "un")} ${c.unite}`, attendu: r.margeUnitaire, calcul: `${eur(r.k.intermediaire.prix)} − ${eur(r.coutVariable)} = ${eur(r.margeUnitaire)}` },
          { libelle: "Marge qui reste après l'intermédiaire", attendu: r.margeQuiReste, tolerance: 0.02, calcul: `${eur(r.margeUnitaire)} − ${eur(r.coutParUniteApres)} = ${eur(r.margeQuiReste)}` },
        ];
      },
      explication: (c) => {
        const r = intermediairePaiePlusTard(c);
        return [
          `Même avec le délai demandé, chaque ${c.unite} ${accord(c, "vendu")} par « ${r.k.nomIndirect} » laisse ${eur(r.margeQuiReste)} pour payer les charges fixes. Ces ventes viennent de clients que ${c.entreprise} n'atteindrait pas seule : le délai rogne la marge, il ne l'efface pas.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable commercial",
      question: () => "Quelle phrase envoyez-vous au responsable commercial ?",
      options: (c) => {
        const r = intermediairePaiePlusTard(c);
        const parLaLoi = {
          texte: `Refusons : la loi plafonne le délai convenu à ${qte(r.plafond)} jours`,
          juste: !r.permis,
          retour: r.permis
            ? `Non : ${qte(r.delaiDemande)} jours restent dans le plafond de ${qte(r.plafond)} jours après la facture (code de commerce, article L. 441-10). La loi le permet ; reste à peser le coût : ${eur(r.surcout)} de plus sur le trimestre, et ${eur(r.margeQuiReste)} de marge par vente.`
            : `Oui : entre professionnels, le délai convenu ne peut pas dépasser ${qte(r.plafond)} jours après la facture (code de commerce, article L. 441-10). ${qte(r.delaiDemande)} jours ne se signent pas, même si chaque vente garderait ${eur(r.margeQuiReste)} de marge et que les ${qte(JOURS_DEMANDES_EN_PLUS)} jours ne coûteraient que ${eur(r.surcout)} de plus sur le trimestre.`,
        };
        return [
          {
            texte: `Acceptable : chaque vente garderait ${eur(r.margeQuiReste)} de marge`,
            juste: r.permis,
            retour: r.permis
              ? `Oui : ${qte(r.delaiDemande)} jours restent dans le plafond légal de ${qte(r.plafond)} jours. Les ${qte(JOURS_DEMANDES_EN_PLUS)} jours coûtent ${eur(r.surcout)} de plus sur le trimestre, et l'intermédiaire passe à ${eur(r.coutParUniteApres)} par ${c.unite}. Sur ${eur(r.margeUnitaire)} de marge, il en reste ${eur(r.margeQuiReste)} : le canal reste rentable.`
              : `Non : le canal resterait rentable, mais la loi plafonne le délai convenu entre professionnels à ${qte(r.plafond)} jours après la facture (code de commerce, article L. 441-10). Un contrat à ${qte(r.delaiDemande)} jours n'est pas permis, quelle que soit la marge.`,
          },
          parLaLoi,
          {
            texte: `Refusons : ${qte(JOURS_DEMANDES_EN_PLUS)} jours de plus coûteraient ${eur(r.surcoutSurUnAn)} par trimestre`,
            juste: false,
            retour: `Non : ce montant applique le taux de l'emprunt pour une année entière. Le taux est annuel : il faut le ramener aux ${qte(JOURS_DEMANDES_EN_PLUS)} jours d'attente en plus, × ${qte(JOURS_DEMANDES_EN_PLUS)} ÷ 360. Le coût en plus est de ${eur(r.surcout)}.`,
          },
          {
            texte: "Sans importance : un délai ne coûte rien si le client finit par payer",
            juste: false,
            retour: `Non : pendant l'attente, ${c.entreprise} finance ${eur(r.ttc)} avec son emprunt. ${qte(JOURS_DEMANDES_EN_PLUS)} jours de plus coûtent ${eur(r.surcout)} sur le trimestre.`,
          },
        ];
      },
    },
  ],
};
