import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { budgetDuTrimestre } from "../../budget";
import type { Cas } from "../../cas";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE BUDGET DE TRÉSORERIE » : UN TRIMESTRE DE CROISSANCE
 * (contrôle de gestion, palier 4).
 *
 * Le dirigeant prévoit des ventes en plus au deuxième trimestre, aux mêmes délais de
 * paiement ; les achats et les coûts variables suivent. Il demande ce qu'il aura en
 * banque au 30 juin. L'élève refait seul le chemin du chapitre avec ces ventes : ce que
 * les clients paieront, ce que le fournisseur recevra, les autres sorties, la trésorerie
 * de fin, puis la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le budget ne reconduit plus le premier trimestre, il
 * le fait grandir, et les créances et les dettes de fin grandissent avec lui. Les autres
 * sorties (structure, publicité, qualité, entretien, intérêts, emprunt, TVA, acompte
 * d'impôt) restent celles du budget du chapitre (`budgetDuTrimestre`).
 */

/**
 * La hausse des ventes prévue : 10 %, un nouveau client professionnel qui pèse un dixième
 * de l'activité, payé aux mêmes délais que les autres.
 */
export const HAUSSE_DES_VENTES = 0.1;

/** Les flux du budget qui suivent les ventes : ceux que l'on paie unité par unité. */
const VARIABLES = new Set(["autres coûts variables", "commissions des partenaires"]);

const euro = Math.round;
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const ttc = (c: Cas) => (budgetDuTrimestre(c.code).tauxTva > 0 ? " TTC" : "");
const entreParentheses = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const enBanque = (t: number) => (t >= 0 ? `${eur(t)} en banque` : `un découvert de ${eur(-t)}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function trimestreDeCroissance(c: Cas) {
  const b = budgetDuTrimestre(c.code);
  const p = b.prevu;
  const t1 = b.t1;
  const variablesDuBudget = p.reconduits.filter((l) => VARIABLES.has(l.libelle));
  const coutsVariables = variablesDuBudget.reduce((t, l) => t + l.montant, 0);
  const fixes =
    p.reconduits.filter((l) => !VARIABLES.has(l.libelle)).reduce((t, l) => t + l.montant, 0) + p.interets + p.emprunt + p.tva + p.impot;
  const g = 1 + HAUSSE_DES_VENTES;
  // Aux mêmes délais, les créances et les dettes de fin grandissent comme les ventes et les achats.
  const ventesTtc = euro(p.ventesTtc * g);
  const creancesFin = euro(t1.creancesFin * g);
  const encaissements = t1.creancesFin + ventesTtc - creancesFin;
  const achatsTtc = euro(p.achatsTtc * g);
  const dettesFin = euro(t1.dettesFournisseursFin * g);
  const paiements = t1.dettesFournisseursFin + achatsTtc - dettesFin;
  const variables = euro(coutsVariables * g);
  const decaissements = paiements + variables + fixes;
  const tresorerieFin = t1.tresorerieFin + encaissements - decaissements;
  const ecart = tresorerieFin - p.tresorerieFin;
  return {
    budget: b,
    libellesVariables: variablesDuBudget.map((l) => l.libelle).join(" et "),
    coutsVariables,
    fixes,
    ventesTtc,
    creancesFin,
    encaissements,
    achatsTtc,
    dettesFin,
    paiements,
    variables,
    decaissements,
    tresorerieFin,
    ecart,
    // Les erreurs classiques : oublier que les créances et les dettes de fin grandissent ; oublier aussi les coûts.
    sansLesDelais: p.tresorerieFin + (ventesTtc - p.ventesTtc) - (achatsTtc - p.achatsTtc) - (variables - coutsVariables),
    sansLesCouts: p.tresorerieFin + (ventesTtc - p.ventesTtc),
  };
}

export const UN_TRIMESTRE_DE_CROISSANCE: Situation = {
  code: "un-trimestre-de-croissance",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["budget-de-tresorerie"],
  commanditaire: "Le dirigeant",
  titre: "Un trimestre de croissance",
  accroche:
    "Un nouveau client fera grandir les ventes du deuxième trimestre. Le dirigeant veut savoir ce qu'il aura en banque au 30 juin : plus de ventes, est-ce autant d'argent en plus ?",
  objectifs: [
    "Prévoir les encaissements quand les ventes et les créances clients grandissent",
    "Prévoir les paiements au fournisseur et les autres décaissements",
    "Calculer la trésorerie de fin de trimestre et l'écart avec un budget à ventes égales",
    "Rédiger une réponse chiffrée au dirigeant",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => [
        `« Un nouveau client professionnel nous apportera ${pct(HAUSSE_DES_VENTES)} de ventes en plus au deuxième trimestre, payées aux mêmes délais que les autres. Les achats et les coûts variables suivront, le reste ne bouge pas. Combien ${c.entreprise} aura-t-elle en banque au 30 juin, et combien de plus que dans le budget à ventes égales ? »`,
        "Pas de cours cette fois : vous avez les chiffres du premier trimestre et du budget, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const r = trimestreDeCroissance(c);
        const b = r.budget;
        return {
          titre: `Le premier trimestre et le budget · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Trésorerie au 31 mars", valeurs: [eur(b.t1.tresorerieFin)] },
            { libelle: `Ventes du premier trimestre${ttc(c)}`, valeurs: [eur(b.prevu.ventesTtc)] },
            { libelle: "Créances clients au 31 mars", valeurs: [eur(b.t1.creancesFin)] },
            { libelle: `Achats du premier trimestre${ttc(c)}`, valeurs: [eur(b.prevu.achatsTtc)] },
            { libelle: "Dettes fournisseurs au 31 mars", valeurs: [eur(b.t1.dettesFournisseursFin)] },
            { libelle: `Coûts variables payés au premier trimestre (${r.libellesVariables})`, valeurs: [eur(r.coutsVariables)] },
            {
              libelle: "Autres sorties du deuxième trimestre, qui ne bougent pas (structure, publicité, qualité, entretien, intérêts, emprunt, TVA, impôt)",
              valeurs: [eur(r.fixes)],
            },
            { libelle: "Trésorerie prévue au 30 juin dans le budget à ventes égales", valeurs: [eur(b.prevu.tresorerieFin)] },
            { libelle: "Hausse des ventes prévue", valeurs: [pct(HAUSSE_DES_VENTES)] },
          ],
        };
      },
      repere: () =>
        "À rendre : les encaissements, les décaissements, la trésorerie au 30 juin et son écart avec le budget à ventes égales, et votre réponse.",
    },
    {
      id: "encaissements",
      type: "montants",
      titre: "Ce que les clients paieront",
      notions: ["cash_budget", "bfr"],
      question: (c) =>
        `Calculez les ventes${ttc(c)} du deuxième trimestre, ce que les clients devront encore au 30 juin (aux mêmes délais, les créances grandissent comme les ventes), puis ce qu'ils paieront pendant le trimestre. Arrondissez à l'euro.`,
      champs: (c) => {
        const r = trimestreDeCroissance(c);
        const b = r.budget;
        return [
          { libelle: `Ventes du deuxième trimestre${ttc(c)}`, attendu: r.ventesTtc, tolerance: 1, calcul: `${eur(b.prevu.ventesTtc)} × (1 + ${pct(HAUSSE_DES_VENTES)}) = ${eur(r.ventesTtc)}` },
          { libelle: "Créances clients au 30 juin", attendu: r.creancesFin, tolerance: 1, calcul: `${eur(b.t1.creancesFin)} × (1 + ${pct(HAUSSE_DES_VENTES)}) = ${eur(r.creancesFin)}` },
          {
            libelle: "Encaissements clients du trimestre",
            attendu: r.encaissements,
            tolerance: 2,
            calcul: `${eur(b.t1.creancesFin)} + ${eur(r.ventesTtc)} − ${eur(r.creancesFin)} = ${eur(r.encaissements)}`,
          },
        ];
      },
      explication: (c) => {
        const r = trimestreDeCroissance(c);
        const b = r.budget;
        return [
          b.t1.creancesFin > 0
            ? `Les ventes montent de ${eur(r.ventesTtc - b.prevu.ventesTtc)}, mais les encaissements de ${eur(r.encaissements - b.prevu.encaissements)} seulement : une part des ventes en plus attend encore au 30 juin dans les créances clients.`
            : `Les clients de ${c.entreprise} paient comptant : les ventes en plus rentrent en entier dans le trimestre, ${eur(r.encaissements - b.prevu.encaissements)} de plus.`,
        ];
      },
    },
    {
      id: "decaissements",
      type: "montants",
      titre: "Ce qui sortira",
      notions: ["cash_budget", "bfr"],
      question: (c) =>
        `Les achats${ttc(c)} et les coûts variables montent comme les ventes ; au même délai, la dette fournisseur de fin aussi. Calculez la dette fournisseur au 30 juin, les paiements au fournisseur, les coûts variables, puis le total des décaissements du trimestre. Arrondissez à l'euro.`,
      champs: (c) => {
        const r = trimestreDeCroissance(c);
        const b = r.budget;
        return [
          { libelle: "Dettes fournisseurs au 30 juin", attendu: r.dettesFin, tolerance: 1, calcul: `${eur(b.t1.dettesFournisseursFin)} × (1 + ${pct(HAUSSE_DES_VENTES)}) = ${eur(r.dettesFin)}` },
          {
            libelle: "Paiements au fournisseur du trimestre",
            attendu: r.paiements,
            tolerance: 2,
            calcul: `${eur(b.t1.dettesFournisseursFin)} + ${eur(b.prevu.achatsTtc)} × (1 + ${pct(HAUSSE_DES_VENTES)}) − ${eur(r.dettesFin)} = ${eur(b.t1.dettesFournisseursFin)} + ${eur(r.achatsTtc)} − ${eur(r.dettesFin)} = ${eur(r.paiements)}`,
          },
          { libelle: "Coûts variables du trimestre", attendu: r.variables, tolerance: 1, calcul: `${eur(r.coutsVariables)} × (1 + ${pct(HAUSSE_DES_VENTES)}) = ${eur(r.variables)}` },
          {
            libelle: "Décaissements du trimestre",
            attendu: r.decaissements,
            tolerance: 3,
            calcul: `${eur(r.paiements)} + ${eur(r.variables)} + ${eur(r.fixes)} = ${eur(r.decaissements)}`,
          },
        ];
      },
      explication: (c) => {
        const r = trimestreDeCroissance(c);
        const b = r.budget;
        return [
          `Les décaissements montent de ${eur(r.decaissements - b.prevu.decaissements)} : les achats et les coûts variables des ventes en plus, moins ce que le délai du fournisseur laisse à payer en juillet.`,
        ];
      },
    },
    {
      id: "tresorerie",
      type: "montants",
      titre: "La trésorerie au 30 juin",
      notions: ["cash_budget"],
      question: () =>
        "Calculez la trésorerie prévue au 30 juin (négative pour un découvert), puis son écart avec celle du budget à ventes égales (négatif si elle est plus basse).",
      champs: (c) => {
        const r = trimestreDeCroissance(c);
        const b = r.budget;
        return [
          {
            libelle: "Trésorerie prévue au 30 juin",
            attendu: r.tresorerieFin,
            tolerance: 4,
            calcul: `${eur(b.t1.tresorerieFin)} + ${eur(r.encaissements)} − ${eur(r.decaissements)} = ${eur(r.tresorerieFin)}`,
          },
          {
            libelle: "Écart avec le budget à ventes égales",
            attendu: r.ecart,
            tolerance: 4,
            calcul: `${eur(r.tresorerieFin)} − ${entreParentheses(b.prevu.tresorerieFin)} = ${eur(r.ecart)}`,
          },
        ];
      },
      explication: (c) => {
        const r = trimestreDeCroissance(c);
        const freins = r.sansLesDelais > r.tresorerieFin;
        return [
          `Au 30 juin, ${c.entreprise} aurait ${enBanque(r.tresorerieFin)}.`,
          freins
            ? `Les ventes en plus ne deviennent pas toutes de l'argent dans le trimestre : les créances de fin grandissent plus que la dette fournisseur, et retiennent ${eur(r.sansLesDelais - r.tresorerieFin)} jusqu'en juillet.`
            : `Le délai du fournisseur joue ici pour l'entreprise : la dette fournisseur de fin grandit plus que les créances, et laisse ${eur(r.tresorerieFin - r.sansLesDelais)} de plus en banque au 30 juin, qu'il faudra payer en juillet.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      question: () => "Quelle phrase envoyez-vous au dirigeant ?",
      options: (c) => {
        const r = trimestreDeCroissance(c);
        const b = r.budget;
        const sens = (x: number) => (x >= 0 ? `${eur(x)} de mieux` : `${eur(-x)} de moins`);
        return [
          {
            texte: `Au 30 juin, nous aurions ${enBanque(r.tresorerieFin)}, ${sens(r.ecart)} qu'à ventes égales`,
            juste: true,
            retour: `Oui : ${eur(b.t1.tresorerieFin)} + ${eur(r.encaissements)} − ${eur(r.decaissements)} = ${eur(r.tresorerieFin)}. Les créances et la dette fournisseur de fin grandissent avec l'activité : elles décalent une part des ventes et des achats en plus au trimestre suivant.`,
          },
          {
            texte: `Au 30 juin, nous aurions ${enBanque(r.sansLesDelais)} : les ventes en plus, moins leurs achats et leurs coûts`,
            juste: false,
            retour: `Non : ce calcul oublie les délais. Aux mêmes délais, les créances de fin passent à ${eur(r.creancesFin)} et la dette fournisseur à ${eur(r.dettesFin)} : une part de ce qui se vend et s'achète en plus ne se paie qu'en juillet.`,
          },
          {
            texte: `Au 30 juin, nous aurions ${enBanque(r.sansLesCouts)}, avec les ${pct(HAUSSE_DES_VENTES)} de ventes en plus`,
            juste: false,
            retour: `Non : ce calcul ajoute les ventes en plus au budget comme si elles ne coûtaient rien et se payaient toutes dans le trimestre. Il faut aussi payer leurs achats et leurs coûts variables, et attendre une part des encaissements.`,
          },
        ];
      },
    },
  ],
};
