import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_FACTURATION, ficheDeLaFacture } from "../../chapitres/facturer-et-se-faire-payer";
import {
  BANQUE_DE_LA_BOUTIQUE,
  INDEMNITE_FORFAITAIRE,
  JOURS_DE_LA_BANQUE,
  coutDuFinancement,
  dateEcrite,
  delaiDesComites,
  joursEntre,
  penalitesDeRetard,
  plusDeJours,
  type DateDuCalendrier,
} from "../../monde/comptes-de-la-boutique";
import type { CodeDeReference } from "../../monde/maille-et-co";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FACTURER ET SE FAIRE PAYER » : LE COMITÉ QUI PAIE EN RETARD (BTS MCO,
 * palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : la gamme et les comités de MAILLE & CO (monde/maille-et-co.ts),
 * les règles de la facture et les conditions de la banque (monde/comptes-de-la-boutique.ts).
 *
 * Une commande de janvier d'un comité, 45 articles facturés au prix de la gamme (sous le seuil de la
 * remise), n'est pas payée à l'échéance : le règlement arrive 25 jours plus tard. Le gérant veut savoir
 * ce qu'il peut réclamer, ce que le retard lui a coûté en découvert, et ce qu'il doit changer. L'élève
 * refait seul la facture et les pénalités, chiffre le découvert du retard, cherche au curseur le retard
 * que l'indemnité de 40 € couvre à elle seule, puis répond.
 *
 * Les pièges : calculer les pénalités sur le hors taxes ; compter le découvert sur le seul retard
 * alors que la boutique finance tout le crédit ; croire que l'indemnité suffit toujours.
 */

/** LA COMMANDE DE JANVIER (hypothèse du cours, l'une des huit de la fiche) : 45 articles, facturés le 12 janvier. */
export const COMMANDE_DE_JANVIER = {
  lignes: [
    { reference: "col-rond", quantite: 10 },
    { reference: "merinos", quantite: 20 },
    { reference: "echarpe", quantite: 10 },
    { reference: "bonnet", quantite: 5 },
  ] as readonly { reference: CodeDeReference; quantite: number }[],
  facturee: { jour: 12, mois: 1 } as DateDuCalendrier,
  payee: { jour: 23, mois: 3 } as DateDuCalendrier,
} as const;

/** Les bornes du curseur du retard, en jours. */
export const RETARD_DU_CURSEUR = { min: 0, max: 90 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres de la réponse. */
export function comiteEnRetard(c: Pick<Cas, "code">) {
  const f = ficheDeLaFacture(c);
  const lignes = COMMANDE_DE_JANVIER.lignes.map((l) => {
    const r = f.gamme.find((g) => g.code === l.reference)!;
    return { nom: r.nom, quantite: l.quantite, prixHt: r.prixHt, montant: auCentime(l.quantite * r.prixHt) };
  });
  const articles = lignes.reduce((t, l) => t + l.quantite, 0);
  const ht = auCentime(lignes.reduce((t, l) => t + l.montant, 0));
  const tva = auCentime(ht * f.gamme[0]!.tauxTva);
  const ttc = auCentime(ht + tva);
  const delai = delaiDesComites(f);
  const echeance = plusDeJours(COMMANDE_DE_JANVIER.facturee, delai);
  const retard = joursEntre(echeance, COMMANDE_DE_JANVIER.payee);
  const credit = joursEntre(COMMANDE_DE_JANVIER.facturee, COMMANDE_DE_JANVIER.payee);
  const penalites = penalitesDeRetard(ttc, retard);
  const decouvertDuRetard = coutDuFinancement(ttc, retard, "decouvert");
  const decouvertDuCredit = coutDuFinancement(ttc, credit, "decouvert");
  const decouvertParJour = (ttc * BANQUE_DE_LA_BOUTIQUE.decouvert.taux) / JOURS_DE_LA_BANQUE;
  return {
    f,
    lignes,
    articles,
    ht,
    tva,
    ttc,
    delai,
    echeance,
    retard,
    credit,
    penalites,
    decouvertDuRetard,
    decouvertDuCredit,
    decouvertParJour,
    /** Le plus long retard dont le découvert ne coûte pas plus que l'indemnité forfaitaire seule. */
    retardQueCouvreLIndemnite: Math.floor(INDEMNITE_FORFAITAIRE / decouvertParJour + 1e-9),
  };
}

const tableauDeLaCommande = (c: Pick<Cas, "code">) => {
  const x = comiteEnRetard(c);
  return {
    titre: `La commande du comité, facturée le ${dateEcrite(COMMANDE_DE_JANVIER.facturee)}`,
    colonnes: ["Articles", "Prix hors taxes"],
    lignes: x.lignes.map((l) => ({ libelle: l.nom, valeurs: [qte(l.quantite), eur(l.prixHt)] })),
  };
};

export const LE_COMITE_QUI_PAIE_EN_RETARD: Situation = {
  code: "le-comite-qui-paie-en-retard",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["facturer-et-se-faire-payer"],
  commanditaire: "Le gérant",
  titre: "Le comité qui paie en retard",
  accroche: "Un comité d'entreprise a réglé sa facture de janvier bien après l'échéance. Le gérant veut savoir ce qu'il peut réclamer, ce que le retard lui a coûté, et ce qu'il doit changer.",
  objectifs: [
    "Recalculer une facture et dater son échéance",
    "Calculer les pénalités de retard et l'indemnité forfaitaire",
    "Chiffrer le découvert qu'un retard fait payer, et le retard que l'indemnité couvre",
    "Répondre au gérant sur ce qu'il faut réclamer et changer",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_FACTURATION,
    pourquoi: "ce cas reprend les factures du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      tableau: tableauDeLaCommande,
      texte: (c) => {
        const x = comiteEnRetard(c);
        return [
          `« Ce comité a commandé ${qte(x.articles)} articles, facturés le ${dateEcrite(COMMANDE_DE_JANVIER.facturee)} au prix de la gamme, à ${qte(x.delai)} jours. Il devait payer le ${dateEcrite(x.echeance)} ; son virement est arrivé le ${dateEcrite(COMMANDE_DE_JANVIER.payee)}. Pendant tout ce temps, j'ai été à découvert. Que puis-je lui réclamer, que m'a coûté ce retard, et que dois-je changer ? »`,
          `Pas de cours cette fois : la méthode est celle du chapitre. Le découvert coûte ${pct(BANQUE_DE_LA_BOUTIQUE.decouvert.taux * 100)} l'an sur ${qte(JOURS_DE_LA_BANQUE)} jours ; les pénalités sont au taux de la BCE majoré de 10 points, sur 365 jours.`,
        ];
      },
      repere: () => "À rendre : la facture, les jours de retard, les pénalités et l'indemnité, le découvert du retard et de tout le crédit, le retard que l'indemnité couvre seule, et votre réponse.",
    },
    {
      id: "la-facture",
      type: "montants",
      titre: "La facture de janvier",
      notions: ["payment_terms", "vat_payable"],
      tableau: tableauDeLaCommande,
      question: (c) => `La commande compte ${qte(comiteEnRetard(c).articles)} articles : sous le seuil de la remise. Calculez le net commercial, la TVA à 20 %, puis le net à payer.`,
      champs: (c) => {
        const x = comiteEnRetard(c);
        return [
          { libelle: "Net commercial", attendu: x.ht, calcul: `${x.lignes.map((l) => `${qte(l.quantite)} × ${eur(l.prixHt)}`).join(" + ")} = ${eur(x.ht)}` },
          { libelle: "TVA", attendu: x.tva, calcul: `${eur(x.ht)} × 20 % = ${eur(x.tva)}` },
          { libelle: "Net à payer", attendu: x.ttc, calcul: `${eur(x.ht)} + ${eur(x.tva)} = ${eur(x.ttc)}` },
        ];
      },
      explication: (c) => {
        const x = comiteEnRetard(c);
        return [`Le comité devait ${eur(x.ttc)} le ${dateEcrite(x.echeance)}, ${qte(x.delai)} jours après la facture : il a payé avec ${qte(x.retard)} jours de retard.`];
      },
    },
    {
      id: "le-retard",
      type: "montants",
      titre: "Ce que la boutique peut réclamer",
      notions: ["payment_terms"],
      question: (c) => {
        const x = comiteEnRetard(c);
        return `Le taux des pénalités est de ${pct(auCentime(x.penalites.taux * 100))}. Calculez les pénalités des ${qte(x.retard)} jours de retard, puis le total que la boutique peut réclamer avec l'indemnité forfaitaire.`;
      },
      champs: (c) => {
        const x = comiteEnRetard(c);
        const p = x.penalites;
        return [
          { libelle: "Pénalités de retard", attendu: p.penalites, calcul: `${eur(x.ttc)} × ${pct(auCentime(p.taux * 100))} × ${qte(x.retard)} ÷ 365 = ${eur(p.penalites)}` },
          { libelle: "Total réclamé au comité", attendu: p.total, calcul: `${eur(p.penalites)} + ${eur(p.indemnite)} = ${eur(p.total)}` },
        ];
      },
      explication: (c) => {
        const x = comiteEnRetard(c);
        return [`Les pénalités se calculent sur le net à payer, toutes taxes comprises, et l'indemnité de ${eur(INDEMNITE_FORFAITAIRE)} est due dès le premier jour de retard : ${eur(x.penalites.total)} en tout.`];
      },
    },
    {
      id: "financer-le-retard",
      type: "montants",
      titre: "Ce que le retard a coûté",
      notions: ["receivables_financing"],
      question: (c) => {
        const x = comiteEnRetard(c);
        return `La boutique a financé la facture au découvert. Calculez le coût du découvert sur les ${qte(x.retard)} jours de retard, puis sur tout le crédit, du ${dateEcrite(COMMANDE_DE_JANVIER.facturee)} au ${dateEcrite(COMMANDE_DE_JANVIER.payee)} (${qte(x.credit)} jours).`;
      },
      champs: (c) => {
        const x = comiteEnRetard(c);
        const taux = pct(BANQUE_DE_LA_BOUTIQUE.decouvert.taux * 100);
        return [
          { libelle: "Coût du découvert sur le retard", attendu: x.decouvertDuRetard.cout, calcul: `${eur(x.ttc)} × ${taux} × ${qte(x.retard)} ÷ ${qte(JOURS_DE_LA_BANQUE)} = ${eur(x.decouvertDuRetard.cout)}` },
          { libelle: "Coût du découvert sur tout le crédit", attendu: x.decouvertDuCredit.cout, calcul: `${eur(x.ttc)} × ${taux} × ${qte(x.credit)} ÷ ${qte(JOURS_DE_LA_BANQUE)} = ${eur(x.decouvertDuCredit.cout)}` },
        ];
      },
      explication: (c) => {
        const x = comiteEnRetard(c);
        return [
          `Le retard a coûté ${eur(x.decouvertDuRetard.cout)} de découvert, que les pénalités (${eur(x.penalites.total)}) couvrent largement. Mais tout le crédit en a coûté ${eur(x.decouvertDuCredit.cout)} : les ${qte(x.delai)} jours accordés, eux, ne se facturent pas.`,
        ];
      },
    },
    {
      id: "le-retard-qui-se-paie",
      type: "curseur",
      titre: "Le retard que l'indemnité couvre seule",
      notions: ["payment_terms", "receivables_financing"],
      question: (c) => {
        const x = comiteEnRetard(c);
        return `Beaucoup de commerçants ne réclament que l'indemnité de ${eur(INDEMNITE_FORFAITAIRE)}, pour ménager un bon client. Faites varier le retard, de ${qte(RETARD_DU_CURSEUR.min)} à ${qte(RETARD_DU_CURSEUR.max)} jours : une droite donne l'indemnité, l'autre le découvert du retard sur ${eur(x.ttc)}. Placez le curseur sur le plus long retard que l'indemnité couvre, puis validez.`;
      },
      grandeur: () => ({ libelle: "Jours de retard", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: comiteEnRetard(c).retardQueCouvreLIndemnite, min: RETARD_DU_CURSEUR.min, max: RETARD_DU_CURSEUR.max }),
      zones: ["L'indemnité couvre le découvert", "Le découvert dépasse l'indemnité"],
      rates: () => ({
        dessous: "À ce retard, l'indemnité couvre encore le découvert : vous pouvez aller plus loin.",
        dessus: "À ce retard, le découvert dépasse déjà l'indemnité : cherchez plus bas.",
      }),
      montrer: "Montrer le retard que l'indemnité couvre",
      lecture: (c, jours) => {
        const x = comiteEnRetard(c);
        const d = coutDuFinancement(x.ttc, jours, "decouvert").cout;
        return [
          { libelle: "Indemnité forfaitaire", montant: INDEMNITE_FORFAITAIRE },
          { libelle: "Découvert du retard", montant: d },
          { libelle: "Ce que l'indemnité laisse après le découvert", montant: auCentime(INDEMNITE_FORFAITAIRE - d), fort: true },
        ];
      },
      droites: (c) => {
        const x = comiteEnRetard(c);
        return { produit: () => INDEMNITE_FORFAITAIRE, cout: (jours) => jours * x.decouvertParJour, libelles: ["Indemnité forfaitaire", "Découvert du retard"] };
      },
      explication: (c) => {
        const x = comiteEnRetard(c);
        return [`L'indemnité seule couvre ${qte(x.retardQueCouvreLIndemnite)} jours de retard sur cette facture ; au-delà, un retard coûte à la boutique, et d'autant plus que la facture est grosse. Les pénalités, au taux de ${pct(auCentime(x.penalites.taux * 100))}, couvrent le découvert quel que soit le retard.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle réponse envoyez-vous au gérant ?",
      options: (c) => {
        const x = comiteEnRetard(c);
        return [
          {
            texte: `Réclamer ${eur(x.penalites.total)} et passer ce comité à la LCR`,
            juste: true,
            retour: `Oui : ${eur(x.penalites.penalites)} de pénalités et ${eur(INDEMNITE_FORFAITAIRE)} d'indemnité, que la facture doit annoncer. Le retard a coûté ${eur(x.decouvertDuRetard.cout)} de découvert. Avec une LCR, la boutique présente elle-même le paiement le jour de l'échéance.`,
          },
          { texte: `Réclamer ${eur(INDEMNITE_FORFAITAIRE)} : elle couvre tout retard`, juste: false, retour: `Non : seule, elle ne couvre que ${qte(x.retardQueCouvreLIndemnite)} jours de découvert sur cette facture. Les pénalités sont dues en plus.` },
          {
            texte: `Ne rien réclamer : le retard n'a coûté que ${eur(x.decouvertDuRetard.cout)}`,
            juste: false,
            retour: `Le coût est petit, mais le droit est là, et un retard toléré se répète : tout le crédit a coûté ${eur(x.decouvertDuCredit.cout)} de découvert.`,
          },
          { texte: "Réclamer les pénalités sur le hors taxes", juste: false, retour: `Non : les pénalités portent sur la somme due, ${eur(x.ttc)} toutes taxes comprises, et non sur ${eur(x.ht)}.` },
        ];
      },
    },
  ],
};
