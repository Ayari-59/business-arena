import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { fondsDeRoulement } from "../../chapitres/fonds-de-roulement-et-tresorerie";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE } from "../../monde/comptes-du-lycee";
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
 * fournisseurs plus pressés. Le bilan est celui du chapitre (`fondsDeRoulement`), au 31 décembre
 * du premier exercice de NOVA dans le monde du cours.
 */

/**
 * La part des dettes fournisseurs qui disparaît : la moitié. Les fournisseurs de composants
 * divisent par deux le délai qu'ils accordent, ce que font beaucoup de fournisseurs avec un
 * client qu'ils jugent fragile, ou au renouvellement d'un contrat. HYPOTHÈSE DU COURS : les
 * achats ne changent pas, et la dette du 31 décembre est proportionnelle au délai ; à délai
 * deux fois plus court, elle est deux fois plus petite.
 */
export const BAISSE_DU_CREDIT_FOURNISSEUR = 0.5;

/** Un montant, le signe moins typographique : « −582,38 € ». */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function fournisseurPresse(c: Pick<Cas, "code">) {
  const k = fondsDeRoulement(c);
  const avant = k.poste("fournisseurs");
  const enMoins = auCentime(avant * BAISSE_DU_CREDIT_FOURNISSEUR);
  const bfr = auCentime(k.besoin + enMoins);
  return {
    ...k,
    fournisseursAvant: avant,
    enMoins,
    fournisseurs: auCentime(avant - enMoins),
    bfrApres: bfr,
    tnApres: auCentime(k.fondsDeRoulement - bfr),
    // L'erreur classique : croire que le fonds de roulement porte la dette fournisseurs.
    frFaux: auCentime(k.fondsDeRoulement - enMoins),
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
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend le bilan du premier exercice de NOVA dans la simulation du cours, celui du chapitre ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => [
        `« Nos fournisseurs de composants réduisent de ${pct(BAISSE_DU_CREDIT_FOURNISSEUR * 100)} le délai de paiement qu'ils nous accordent : au 31 décembre, nous leur aurions donc dû ${pct(BAISSE_DU_CREDIT_FOURNISSEUR * 100)} de moins. Nos achats ne changent pas. Je veux savoir ce que cela aurait fait au besoin en fonds de roulement ${dE(fondsDeRoulement(c).entreprise)}, et surtout à notre trésorerie. »`,
        "Pas de cours cette fois : vous avez le bilan, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const k = fournisseurPresse(c);
        return {
          titre: `Le bilan ${dE(k.entreprise)} au 31 décembre`,
          colonnes: ["Montant"],
          lignes: [
            ...k.postes.filter((x) => x.montant !== 0 || x.code === "decouvert").map((x) => ({ libelle: x.libelle, valeurs: [eur(x.montant)] })),
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
        "Commencez par le bilan tel qu'il est : le fonds de roulement (capitaux propres, provision et emprunt, moins l'équipement), le besoin en fonds de roulement (stock, créances et autres créances, moins les dettes du cycle), puis la trésorerie (fonds de roulement moins besoin).",
      champs: (c) => {
        const k = fournisseurPresse(c);
        return [
          { libelle: "Fonds de roulement", attendu: k.fondsDeRoulement, calcul: `${eur(k.ressourcesDurables)} − ${eur(k.poste("equipement"))} = ${eur(k.fondsDeRoulement)}`, tolerance: 1 },
          { libelle: "Besoin en fonds de roulement", attendu: k.besoin, calcul: `${eur(k.besoinsDuCycle)} − ${eur(k.dettesDuCycle)} = ${eur(k.besoin)}`, tolerance: 1 },
          { libelle: "Trésorerie", attendu: k.tresorerie, calcul: `${eur(k.fondsDeRoulement)} ${k.besoin < 0 ? `+ ${eur(-k.besoin)}` : `− ${eur(k.besoin)}`} = ${eur(k.tresorerie)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = fournisseurPresse(c);
        return [
          `Aujourd'hui, les fournisseurs financent ${eur(k.fournisseursAvant)} du cycle ${dE(k.entreprise)} : des achats déjà reçus, pas encore payés. C'est autant que le fonds de roulement n'a pas à financer.`,
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
          { libelle: "Dettes envers les fournisseurs", attendu: k.fournisseurs, calcul: `${eur(k.fournisseursAvant)} × (1 − ${pct(BAISSE_DU_CREDIT_FOURNISSEUR * 100)}) = ${eur(k.fournisseurs)}` },
          { libelle: "Besoin en fonds de roulement", attendu: k.bfrApres, calcul: `${eur(k.besoin)} + ${eur(k.enMoins)} = ${eur(k.bfrApres)}`, tolerance: 1 },
          { libelle: "Trésorerie", attendu: k.tnApres, calcul: `${eur(k.fondsDeRoulement)} ${k.bfrApres < 0 ? `+ ${eur(-k.bfrApres)}` : `− ${eur(k.bfrApres)}`} = ${eur(k.tnApres)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = fournisseurPresse(c);
        return [
          `Le fonds de roulement ne bouge pas : il dépend des capitaux propres, de la provision, de l'emprunt et de l'équipement. Le besoin grossit de ${eur(k.enMoins)}, ce que le fournisseur ne finance plus, et la trésorerie baisse d'autant.`,
          k.tnApres >= 0
            ? `${k.entreprise} garderait ${eur(k.tnApres)} de trésorerie : elle peut encaisser le nouveau délai.`
            : k.tresorerie >= 0
              ? `${k.entreprise} passerait à découvert : ${eur(-k.tnApres)} avancés par la banque. Le nouveau délai lui coûterait des agios.`
              : `${k.entreprise} était déjà à découvert : son découvert passerait de ${eur(-k.tresorerie)} à ${eur(-k.tnApres)}.`,
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
            retour: `Oui : ${eur(k.enMoins)} de dettes fournisseurs en moins, c'est ${eur(k.enMoins)} de besoin en fonds de roulement en plus. Le fonds de roulement ne bouge pas, et la trésorerie passe de ${eur(k.tresorerie)} à ${eur(k.tnApres)}.`,
          },
          {
            texte: `La trésorerie monterait de ${eur(k.enMoins)} : nous devrions moins à nos fournisseurs`,
            juste: false,
            retour: `Non : devoir moins aux fournisseurs, c'est les avoir payés plus tôt, avec l'argent de la banque. Le besoin en fonds de roulement grossit de ${eur(k.enMoins)}, et la trésorerie baisse d'autant.`,
          },
          {
            texte: `Rien ne bougerait : notre fonds de roulement reste de ${eur(k.fondsDeRoulement)}, et la trésorerie avec`,
            juste: false,
            retour: `Non : le fonds de roulement reste le même, c'est vrai, mais la trésorerie est le fonds de roulement moins le besoin, et le besoin grossit de ${eur(k.enMoins)}.`,
          },
          {
            texte: `Notre fonds de roulement baisserait de ${eur(k.enMoins)}, à ${eur(k.frFaux)}`,
            juste: false,
            retour: `Non : les dettes fournisseurs sont des dettes du cycle, pas des ressources durables. Elles jouent sur le besoin en fonds de roulement ; le fonds de roulement reste de ${eur(k.fondsDeRoulement)}.`,
          },
        ];
      },
    },
  ],
};
