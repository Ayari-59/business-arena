import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { fondsDeRoulement } from "../../chapitres/fonds-de-roulement-et-tresorerie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FONDS DE ROULEMENT, BESOIN EN FONDS DE ROULEMENT ET
 * TRÉSORERIE » : LE FOURNISSEUR RACCOURCIT SES DÉLAIS (Bac STMG, gestion et finance,
 * palier 1).
 *
 * Le fournisseur annonce qu'il raccourcit le délai de paiement qu'il accorde. Le gérant veut
 * savoir ce que cela ferait à la trésorerie, si cela avait déjà été le cas au 31 décembre.
 * L'élève refait seul le chemin du chapitre (le fonds de roulement, le besoin en fonds de
 * roulement, la trésorerie), puis le refait avec des dettes fournisseurs plus petites.
 *
 * Le cas est neuf par sa question : le chapitre se demande, sans chiffrer, ce que des
 * clients plus rapides changeraient ; le cas chiffre l'autre bout du cycle, des
 * fournisseurs plus pressés. Le bilan est celui du chapitre (`fondsDeRoulement`).
 */

/**
 * La part des dettes fournisseurs qui disparaît : la moitié. Le fournisseur passe d'un
 * paiement à soixante jours à un paiement à trente jours, ce que font beaucoup de
 * fournisseurs avec un client qu'ils jugent fragile, ou au renouvellement d'un contrat.
 * Les achats ne changent pas : à délai deux fois plus court, la dette du 31 décembre est
 * deux fois plus petite.
 */
export const BAISSE_DU_CREDIT_FOURNISSEUR = 0.5;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function fournisseurPresse(c: Cas) {
  const k = fondsDeRoulement(c);
  const enMoins = auCentime(k.f.fournisseurs * BAISSE_DU_CREDIT_FOURNISSEUR);
  const fournisseurs = auCentime(k.f.fournisseurs - enMoins);
  const bfr = auCentime(k.bfr + enMoins);
  return {
    ...k,
    enMoins,
    fournisseurs,
    bfrApres: bfr,
    tnApres: auCentime(k.frng - bfr),
    // L'erreur classique : croire que le fonds de roulement porte la dette fournisseurs.
    frFaux: auCentime(k.frng - enMoins),
  };
}

export const LE_FOURNISSEUR_RACCOURCIT_SES_DELAIS: Situation = {
  code: "le-fournisseur-raccourcit-ses-delais",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["fonds-de-roulement-et-tresorerie"],
  commanditaire: "Le gérant",
  titre: "Le fournisseur raccourcit ses délais",
  accroche:
    "Le principal fournisseur veut être payé plus vite. Le gérant demande ce que cela ferait au besoin en fonds de roulement, et à la trésorerie.",
  objectifs: [
    "Calculer le fonds de roulement, le besoin en fonds de roulement et la trésorerie",
    "Mesurer l'effet d'un délai fournisseur plus court sur le besoin en fonds de roulement",
    "Calculer la trésorerie qui en résulte",
    "Rédiger une réponse chiffrée au gérant",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => [
        `« Notre fournisseur réduit de ${pct(BAISSE_DU_CREDIT_FOURNISSEUR * 100)} le délai de paiement qu'il nous accorde : au 31 décembre, nous lui aurions donc dû ${pct(BAISSE_DU_CREDIT_FOURNISSEUR * 100)} de moins. Nos achats ne changent pas. Je veux savoir ce que cela aurait fait au besoin en fonds de roulement ${dE(c.entreprise)}, et surtout à notre trésorerie. »`,
        "Pas de cours cette fois : vous avez le bilan, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const k = fournisseurPresse(c);
        const f = k.f;
        return {
          titre: `Le bilan ${dE(c.entreprise)} au 31 décembre`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Capitaux propres", valeurs: [eur(f.capitauxPropres)] },
            { libelle: "Emprunts", valeurs: [eur(f.emprunts)] },
            { libelle: "Équipement (valeur nette)", valeurs: [eur(f.immobilisationsNettes)] },
            { libelle: "Stocks", valeurs: [eur(f.stocks)] },
            { libelle: "Créances sur les clients", valeurs: [eur(f.creances)] },
            ...(f.tva !== 0 ? [{ libelle: f.tva > 0 ? "TVA due à l'État" : "TVA à récupérer", valeurs: [eur(Math.abs(f.tva))] }] : []),
            { libelle: "Dettes envers les fournisseurs", valeurs: [eur(f.fournisseurs)] },
            { libelle: "Banque et placements", valeurs: [eur(k.disponible)] },
            { libelle: "Découvert bancaire", valeurs: [eur(f.decouvert)] },
            { libelle: "Baisse des dettes fournisseurs", valeurs: [pct(BAISSE_DU_CREDIT_FOURNISSEUR * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le fonds de roulement, le besoin en fonds de roulement et la trésorerie du 31 décembre, les mêmes avec le nouveau délai, et votre réponse.",
    },
    {
      id: "au-31-decembre",
      type: "montants",
      titre: "Le bilan d'aujourd'hui",
      notions: ["frng", "bfr", "net_treasury"],
      question: () =>
        "Commencez par le bilan tel qu'il est : le fonds de roulement (capitaux propres et emprunts, moins l'équipement), le besoin en fonds de roulement (stocks, créances et TVA à récupérer, moins les fournisseurs et la TVA due), puis la trésorerie (fonds de roulement moins besoin).",
      champs: (c) => {
        const k = fournisseurPresse(c);
        return [
          { libelle: "Fonds de roulement", attendu: k.frng, calcul: `${eur(k.ressources)} − ${eur(k.f.immobilisationsNettes)} = ${eur(k.frng)}`, tolerance: 1 },
          { libelle: "Besoin en fonds de roulement", attendu: k.bfr, calcul: `${eur(k.besoins)} − ${eur(k.dettesDuCycle)} = ${eur(k.bfr)}`, tolerance: 1 },
          { libelle: "Trésorerie", attendu: k.tn, calcul: `${eur(k.frng)} ${k.bfr < 0 ? `+ ${eur(-k.bfr)}` : `− ${eur(k.bfr)}`} = ${eur(k.tn)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = fournisseurPresse(c);
        return [
          `Aujourd'hui, le fournisseur finance ${eur(k.f.fournisseurs)} du cycle ${dE(c.entreprise)} : des achats déjà reçus, pas encore payés. C'est autant que le fonds de roulement n'a pas à financer.`,
        ];
      },
    },
    {
      id: "avec-le-nouveau-delai",
      type: "montants",
      titre: "Avec le nouveau délai",
      notions: ["bfr", "net_treasury", "payment_terms"],
      question: () =>
        "Refaites le calcul avec le nouveau délai : la dette envers les fournisseurs au 31 décembre, le besoin en fonds de roulement, puis la trésorerie. Le fonds de roulement, lui, a-t-il une raison de bouger ?",
      champs: (c) => {
        const k = fournisseurPresse(c);
        return [
          { libelle: "Dettes envers les fournisseurs", attendu: k.fournisseurs, calcul: `${eur(k.f.fournisseurs)} × (1 − ${pct(BAISSE_DU_CREDIT_FOURNISSEUR * 100)}) = ${eur(k.fournisseurs)}` },
          { libelle: "Besoin en fonds de roulement", attendu: k.bfrApres, calcul: `${eur(k.bfr)} + ${eur(k.enMoins)} = ${eur(k.bfrApres)}`, tolerance: 1 },
          { libelle: "Trésorerie", attendu: k.tnApres, calcul: `${eur(k.frng)} ${k.bfrApres < 0 ? `+ ${eur(-k.bfrApres)}` : `− ${eur(k.bfrApres)}`} = ${eur(k.tnApres)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = fournisseurPresse(c);
        return [
          `Le fonds de roulement ne bouge pas : il dépend des capitaux propres, des emprunts et de l'équipement. Le besoin grossit de ${eur(k.enMoins)}, ce que le fournisseur ne finance plus, et la trésorerie baisse d'autant.`,
          k.tnApres >= 0
            ? `${c.entreprise} garderait ${eur(k.tnApres)} de trésorerie : elle peut encaisser le nouveau délai.`
            : k.tn >= 0
              ? `${c.entreprise} passerait à découvert : ${eur(-k.tnApres)} avancés par la banque. Le nouveau délai lui coûterait des agios.`
              : `${c.entreprise} était déjà à découvert : son découvert passerait de ${eur(-k.tn)} à ${eur(-k.tnApres)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const k = fournisseurPresse(c);
        return [
          {
            texte: `La trésorerie baisserait de ${eur(k.enMoins)}, à ${eur(k.tnApres)}`,
            juste: true,
            retour: `Oui : ${eur(k.enMoins)} de dettes fournisseurs en moins, c'est ${eur(k.enMoins)} de besoin en fonds de roulement en plus. Le fonds de roulement ne bouge pas, et la trésorerie passe de ${eur(k.tn)} à ${eur(k.tnApres)}.`,
          },
          {
            texte: `La trésorerie monterait de ${eur(k.enMoins)} : nous devrions moins à nos fournisseurs`,
            juste: false,
            retour: `Non : devoir moins au fournisseur, c'est l'avoir payé plus tôt, avec l'argent de la banque. Le besoin en fonds de roulement grossit de ${eur(k.enMoins)}, et la trésorerie baisse d'autant.`,
          },
          {
            texte: `Rien ne bougerait : notre fonds de roulement reste de ${eur(k.frng)}, et la trésorerie avec`,
            juste: false,
            retour: `Non : le fonds de roulement reste le même, c'est vrai, mais la trésorerie est le fonds de roulement moins le besoin, et le besoin grossit de ${eur(k.enMoins)}.`,
          },
          {
            texte: `Notre fonds de roulement baisserait de ${eur(k.enMoins)}, à ${eur(k.frFaux)}`,
            juste: false,
            retour: `Non : les dettes fournisseurs sont des dettes du cycle, pas des ressources durables. Elles jouent sur le besoin en fonds de roulement ; le fonds de roulement reste de ${eur(k.frng)}.`,
          },
        ];
      },
    },
  ],
};
