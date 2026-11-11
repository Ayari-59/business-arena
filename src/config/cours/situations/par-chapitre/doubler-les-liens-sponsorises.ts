import { arrondi2 as auCentime, eur, nombreAuCentieme } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_SITE, siteDuCabinet } from "../../chapitres/le-site-qui-vend";
import { liensSponsorises } from "../../monde/site-d-atlas";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE SITE QUI VEND » : DOUBLER LES LIENS SPONSORISÉS ? (BTS NDRC, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les chiffres sont ceux de la boutique en ligne d'ATLAS CONSEIL
 * (monde/site-d-atlas.ts), lus par `siteDuCabinet`, le modèle du chapitre (la courbe figée des liens
 * sponsorisés, la conversion de leurs visiteurs, la marge d'une commande).
 *
 * L'agence qui gère les annonces propose de doubler le budget des liens : leur ROAS resterait au-dessus
 * de 4, « bien au-dessus de votre seuil ». L'élève refait seul le chemin du chapitre : le ROAS moyen aux
 * deux budgets, puis le ROAS et le gain des seuls euros ajoutés, palier par palier ; au curseur, la marge
 * d'une commande qui ferait payer le dernier palier (à rebours) ; et la phrase qu'il rend.
 *
 * LE JUGEMENT : le doublement rapporte encore, mais moins qu'un budget de 5 400 € ; son dernier palier
 * fait perdre de l'argent, et ne paierait que si une commande laissait 500 € de marge, presque tout son
 * panier de 525 €.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les commandes attendues (une espérance) et les ROAS sont des
 * grandeurs, au centième, à un centième près (à cinq centièmes, avant, pour les commandes).
 */

/** Le budget que propose l'agence, en multiple du budget du premier trimestre : le double. */
export const BUDGET_PROPOSE = 2;

/** Les bornes du curseur de la marge d'une commande, en euros. */
export const MARGE_DU_CURSEUR = { min: 300, max: 700 } as const;

const qte = nombreAuCentieme;

/** Les liens au budget du trimestre, au budget proposé et au meilleur budget, et ce qui les sépare. */
export function doublementDesLiens(c: Pick<Cas, "code">) {
  const x = siteDuCabinet(c);
  const budget = x.budgetDuTrimestre;
  const aujourdhui = liensSponsorises(budget);
  const double = liensSponsorises(budget * BUDGET_PROPOSE);
  const meilleur = x.meilleur;
  const ajout = {
    budget: double.budget - budget,
    commandes: double.commandes - aujourdhui.commandes,
    chiffreDAffaires: auCentime(double.chiffreDAffaires - aujourdhui.chiffreDAffaires),
    gain: auCentime(double.gain - aujourdhui.gain),
  };
  return {
    x,
    aujourdhui,
    double,
    meilleur,
    ajout: { ...ajout, roas: ajout.chiffreDAffaires / ajout.budget },
    dernier: x.dernier,
    /** Ce que le doublement rapporte de moins que le meilleur budget. */
    manqueAGagner: auCentime(meilleur.gain - double.gain),
    verdict: meilleur.budget < double.budget ? ("le-meilleur-budget" as const) : ("doubler" as const),
  };
}

export const DOUBLER_LES_LIENS_SPONSORISES: Situation = {
  code: "doubler-les-liens-sponsorises",
  parcours: "ndrc",
  palier: 3,
  blocs: [],
  reprend: ["le-site-qui-vend"],
  commanditaire: "Le directeur du cabinet",
  titre: "Doubler les liens sponsorisés ?",
  accroche:
    "L'agence qui gère les annonces du site propose de doubler leur budget : le retour sur dépenses resterait au-dessus de 4. Ce que rapporteraient vraiment les euros ajoutés, et le budget à retenir.",
  objectifs: [
    "Calculer le ROAS moyen des liens sponsorisés à deux budgets",
    "Calculer le ROAS et le gain des seuls euros ajoutés, palier par palier",
    "Retrouver à rebours la marge d'une commande qui ferait payer le dernier palier",
    "Rédiger une réponse chiffrée au directeur",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SITE,
    pourquoi: "ce cas suit les liens sponsorisés d'un cabinet de formation : il se joue chez ATLAS CONSEIL, le cabinet du chapitre, sur le premier trimestre de son site.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de l'agence",
      texte: (c) => {
        const r = doublementDesLiens(c);
        return [
          `Le directeur vous transmet le courriel de l'agence : « Vos liens sponsorisés ramènent ${eur(auCentime(r.aujourdhui.roas))} de ventes par euro. En doublant le budget, à ${eur(r.double.budget)} par trimestre, votre ROAS resterait de ${qte(auCentime(r.double.roas))}, bien au-dessus de votre seuil de ${qte(auCentime(r.x.m.roasSeuil))}. Nous vous conseillons de doubler sans attendre. »`,
          "« Avant de signer, dites-moi ce que rapporteraient les euros en plus, et quel budget retenir. » Pas de cours cette fois : vous avez la courbe des liens, la conversion de leurs visiteurs et la marge d'une commande. À vous d'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = doublementDesLiens(c);
        const x = r.x;
        return {
          titre: `Les liens sponsorisés · ${x.f.entreprise}`,
          colonnes: x.paliers.slice(1).map((p) => eur(p.budget)),
          lignes: [
            { libelle: "Clics achetés", valeurs: x.paliers.slice(1).map((p) => qte(p.clics)) },
            { libelle: "Conversion des visiteurs", valeurs: x.paliers.slice(1).map(() => `${qte(x.payant.conversion * 100)} %`) },
            { libelle: "Panier moyen", valeurs: x.paliers.slice(1).map(() => eur(x.m.panier)) },
            { libelle: "Marge d'une commande", valeurs: x.paliers.slice(1).map(() => eur(x.m.marge)) },
          ],
        };
      },
      repere: () =>
        "À rendre : le ROAS aux deux budgets, le ROAS et le gain des euros ajoutés, le gain du dernier palier, la marge d'une commande qui le ferait payer, et votre réponse.",
    },
    {
      id: "les-deux-budgets",
      type: "montants",
      titre: "Le ROAS aux deux budgets",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: (c) => {
        const r = doublementDesLiens(c);
        return `Calculez les commandes attendues et le ROAS des liens au budget du trimestre (${eur(r.aujourdhui.budget)}), puis au double (${eur(r.double.budget)}), au centième.`;
      },
      champs: (c) => {
        const r = doublementDesLiens(c);
        const conv = `${qte(r.x.payant.conversion * 100)} %`;
        return [
          { libelle: `Commandes attendues à ${eur(r.aujourdhui.budget)}`, nature: "grandeur", attendu: auCentime(r.aujourdhui.commandes), calcul: `${qte(r.aujourdhui.clics)} × ${conv} = ${qte(auCentime(r.aujourdhui.commandes))}` },
          { libelle: `ROAS à ${eur(r.aujourdhui.budget)}`, nature: "grandeur", attendu: auCentime(r.aujourdhui.roas), calcul: `${qte(auCentime(r.aujourdhui.commandes))} × ${eur(r.x.m.panier)} ÷ ${eur(r.aujourdhui.budget)} = ${qte(auCentime(r.aujourdhui.roas))}` },
          { libelle: `Commandes attendues à ${eur(r.double.budget)}`, nature: "grandeur", attendu: auCentime(r.double.commandes), calcul: `${qte(r.double.clics)} × ${conv} = ${qte(auCentime(r.double.commandes))}` },
          { libelle: `ROAS à ${eur(r.double.budget)}`, nature: "grandeur", attendu: auCentime(r.double.roas), calcul: `${qte(auCentime(r.double.commandes))} × ${eur(r.x.m.panier)} ÷ ${eur(r.double.budget)} = ${qte(auCentime(r.double.roas))}` },
        ];
      },
      explication: (c) => {
        const r = doublementDesLiens(c);
        return [
          `L'agence a raison sur un point : au double, le ROAS moyen reste de ${qte(auCentime(r.double.roas))}. Mais il mélange les premiers clics, bon marché, et les derniers. Le budget double, les clics ne montent que de ${qte(r.aujourdhui.clics)} à ${qte(r.double.clics)}.`,
        ];
      },
    },
    {
      id: "les-euros-ajoutes",
      type: "montants",
      titre: "Ce que rapportent les euros ajoutés",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => {
        const r = doublementDesLiens(c);
        return `Calculez le ROAS des seuls euros ajoutés (ventes en plus ÷ budget en plus), au centième. Puis le gain du doublement (commandes en plus × marge − budget en plus), et le gain du dernier palier seul, de ${eur(r.dernier.de)} à ${eur(r.dernier.a)} (négatif s'il fait perdre).`;
      },
      champs: (c) => {
        const r = doublementDesLiens(c);
        const m = r.x.m.marge;
        return [
          { libelle: "ROAS des euros ajoutés", nature: "grandeur", attendu: auCentime(r.ajout.roas), calcul: `${eur(r.ajout.chiffreDAffaires)} ÷ ${eur(r.ajout.budget)} = ${qte(auCentime(r.ajout.roas))}` },
          { libelle: "Gain du doublement", attendu: r.ajout.gain, calcul: `${qte(auCentime(r.ajout.commandes))} × ${eur(m)} − ${eur(r.ajout.budget)} = ${eur(r.ajout.gain)}` },
          { libelle: "Gain du dernier palier", attendu: r.dernier.gain, calcul: `${qte(auCentime(r.dernier.commandes))} × ${eur(m)} − ${eur(r.dernier.budget)} = ${eur(r.dernier.gain)}` },
        ];
      },
      explication: (c) => {
        const r = doublementDesLiens(c);
        return [
          `Les euros ajoutés ne ramènent que ${eur(auCentime(r.ajout.roas))} de ventes chacun, bien loin des ${qte(auCentime(r.double.roas))} de la moyenne. Le doublement rapporte encore ${eur(r.ajout.gain)} ; mais son dernier palier fait perdre ${eur(-r.dernier.gain)}. S'arrêter à ${eur(r.meilleur.budget)} rapporterait ${eur(r.manqueAGagner)} de plus que doubler.`,
        ];
      },
    },
    {
      id: "la-marge-qui-paierait",
      type: "curseur",
      titre: "La marge qui ferait payer le dernier palier",
      notions: ["contribution_margin", "customer_acquisition_cost"],
      question: (c) => {
        const r = doublementDesLiens(c);
        return `Le dernier palier coûte ${eur(r.dernier.budget)} et amène ${qte(auCentime(r.dernier.commandes))} commandes. Faites varier la marge d'une commande, de ${qte(MARGE_DU_CURSEUR.min)} à ${qte(MARGE_DU_CURSEUR.max)} €. Placez le curseur sur la plus petite marge où ce palier paie, puis validez.`;
      },
      grandeur: () => ({ libelle: "Marge d'une commande", unite: "euros" }),
      cible: (c) => ({ attendu: doublementDesLiens(c).x.margeQuiPaieLeDernier, min: MARGE_DU_CURSEUR.min, max: MARGE_DU_CURSEUR.max }),
      zones: ["Le dernier palier paie", "Le dernier palier fait perdre"],
      rates: () => ({
        dessous: "À cette marge, les commandes du dernier palier laissent moins que son budget.",
        dessus: "Une marge plus faible suffirait déjà : cherchez la plus petite.",
      }),
      montrer: "Montrer la marge",
      lecture: (c, k) => {
        const r = doublementDesLiens(c);
        const marge = auCentime(r.dernier.commandes * k);
        return [
          { libelle: "Marge des commandes du dernier palier", montant: marge },
          { libelle: "Budget du dernier palier", montant: r.dernier.budget },
          { libelle: "Gain du dernier palier", montant: auCentime(marge - r.dernier.budget), fort: true },
        ];
      },
      droites: (c) => {
        const r = doublementDesLiens(c);
        return {
          produit: (k) => r.dernier.commandes * k,
          cout: () => r.dernier.budget,
          libelles: ["Marge des commandes du dernier palier", "Budget du dernier palier"],
        };
      },
      explication: (c) => {
        const r = doublementDesLiens(c);
        return [
          `Le dernier palier ne paierait que si une commande laissait ${eur(r.x.margeQuiPaieLeDernier)} de marge. Elle en laisse ${eur(r.x.m.marge)}, pour un panier de ${eur(r.x.m.panier)} : il faudrait vendre presque sans coût, ou des commandes plus grosses.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur",
      question: () => "Quelle phrase envoyez-vous au directeur ?",
      options: (c) => {
        const r = doublementDesLiens(c);
        return [
          {
            texte: `Monter à ${eur(r.meilleur.budget)} : le dernier palier perd`,
            juste: true,
            retour: `Oui : jusqu'à ${eur(r.meilleur.budget)}, chaque palier rapporte plus qu'il ne coûte ; le dernier fait perdre ${eur(-r.dernier.gain)}. À ${eur(r.meilleur.budget)}, les liens gagnent ${eur(r.meilleur.gain)}, ${eur(r.manqueAGagner)} de plus qu'au double.`,
          },
          {
            texte: `Doubler : le ROAS reste de ${qte(auCentime(r.double.roas))}, au-dessus du seuil`,
            juste: false,
            retour: `Non : c'est le ROAS moyen. Les derniers euros ne ramènent que ${eur(auCentime(r.dernier.commandes * r.x.m.panier / r.dernier.budget))} de ventes chacun, sous le seuil de ${qte(auCentime(r.x.m.roasSeuil))}.`,
          },
          {
            texte: `Rester à ${eur(r.aujourdhui.budget)} : le ROAS baisse dès qu'on ajoute`,
            juste: false,
            retour: `Non : le ROAS baisse, mais les euros ajoutés jusqu'à ${eur(r.meilleur.budget)} rapportent encore plus qu'ils ne coûtent. On ne cherche pas le meilleur ROAS, on cherche le plus grand gain.`,
          },
          {
            texte: `Doubler : le doublement rapporte ${eur(r.ajout.gain)} de plus`,
            juste: false,
            retour: `Non : il rapporte, mais son dernier palier fait perdre ${eur(-r.dernier.gain)}. S'arrêter avant gagne ${eur(r.manqueAGagner)} de plus.`,
          },
        ];
      },
    },
  ],
};
