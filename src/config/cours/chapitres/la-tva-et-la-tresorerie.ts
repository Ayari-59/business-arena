import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../scenarios/registry";
import { type Cas } from "../cas";
import { anneeJouee } from "../annee-de-l-arene";
import { rejouerAvec } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";
import {
  ENTREPRISES_OU_LA_TVA_JOUE,
  FINS_DES_TRIMESTRES,
  MOIS_DES_TRIMESTRES,
  NOMS_DES_TRIMESTRES,
  POURQUOI_LA_TVA,
  TRIMESTRE_DECLARE,
  declarationDeTva,
} from "./la-declaration-de-tva";

/**
 * CHAPITRE : LA TVA ET LA TRÉSORERIE, QUI FAIT CRÉDIT À QUI (fiscalité, palier 3).
 *
 * Le moteur ne fait pas entrer la TVA au compte de résultat, qui reste hors taxes ; il la fait
 * passer par la caisse (src/engine/finance/statements.ts) : les clients paient TTC à leur délai
 * (créances TTC : ventes TTC × délai ÷ durée du trimestre, clientèle par clientèle), le
 * fournisseur est payé TTC au sien (dettes TTC, au délai de l'offre retenue), et la TVA nette
 * du trimestre se verse à l'État au trimestre suivant (« TVA décaissée »).
 *
 * À la clôture d'un trimestre, la TVA laisse donc en trésorerie ce que l'entreprise doit encore
 * à l'État et au fournisseur, moins ce que ses clients lui doivent encore de TVA. Le chapitre le
 * calcule au 30 juin, le fait vérifier par l'arène, qui rejoue l'année sans TVA (même graine,
 * même gestion, taux nul : `rejouerAvec`), puis lit le troisième trimestre dans le budget de
 * trésorerie : la TVA encaissée, payée et versée, et ce qu'elle a fait à la trésorerie.
 *
 * Il se joue là où le moteur compte la TVA (`ENTREPRISES_OU_LA_TVA_JOUE`).
 */

/** Le trimestre dont le chapitre lit les flux dans le budget de trésorerie : celui qui verse la TVA déclarée. */
export const TRIMESTRE_DES_FLUX = TRIMESTRE_DECLARE + 1;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (mot: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(mot) ? `d'${mot}` : `de ${mot}`);
const nomDuTrimestre = (k: number) => `${NOMS_DES_TRIMESTRES[k - 1]} trimestre`;
const flux = (r: CompanyRoundResult, label: string) => r.cashFlow.items.find((i) => i.label === label)?.amount ?? 0;

export type QuiFaitCredit = "l-etat" | "le-fournisseur" | "l-entreprise";

/** Ce que la TVA retient chez les clients, laisse chez le fournisseur et doit à l'État, à la clôture d'un trimestre. */
function aLaCloture(r: CompanyRoundResult, sans: CompanyRoundResult, taux: number) {
  const part = taux / (1 + taux);
  const b = r.balanceSheet;
  const tvaClients = Math.round(b.receivables * part);
  const tvaFournisseur = Math.round(b.payables * part);
  const tvaEtat = Math.round(b.vatLiability ?? 0);
  return {
    creances: Math.round(b.receivables),
    dettes: Math.round(b.payables),
    tvaClients,
    tvaFournisseur,
    tvaEtat,
    /** Ce que la TVA laisse en trésorerie : ce qui reste dû à l'État et au fournisseur, moins ce que les clients doivent. */
    effet: tvaEtat + tvaFournisseur - tvaClients,
    tresorerie: Math.round(r.cashFlow.closing),
    tresorerieSansTva: Math.round(sans.cashFlow.closing),
    resultat: Math.round(r.incomeStatement.netIncome),
    resultatSansTva: Math.round(sans.incomeStatement.netIncome),
  };
}

const calculs = new Map<string, ReturnType<typeof calculer>>();

function calculer(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const taux = s.finance.vatRate ?? 0;
  const part = taux / (1 + taux);
  const annee = anneeJouee(c.code).partie.rounds.map((t) => t.results["joueur"]!);
  const sansTva = rejouerAvec(c.code, "la-tva-et-la-tresorerie-sans-tva", () => undefined, (sc) => ({ ...sc, finance: { ...sc.finance, vatRate: 0 } }));
  const clotures = annee.map((r, k) => aLaCloture(r, sansTva[k]!, taux));
  const juin = clotures[TRIMESTRE_DECLARE - 1]!;
  const fournisseur = s.suppliers?.find((o) => o.code === annee[0]!.supplier?.code);
  const delaiFournisseur = fournisseur?.paymentDelayDays ?? s.finance.supplierPaymentDelayDays;

  // Le troisième trimestre, dans le budget de trésorerie : la TVA dans ce qui entre et ce qui sort.
  const r3 = annee[TRIMESTRE_DES_FLUX - 1]!;
  const encaissements = Math.round(flux(r3, "encaissements_clients"));
  const paiements = Math.round(-flux(r3, "paiements_fournisseurs"));
  const tvaEncaissee = Math.round(flux(r3, "encaissements_clients") * part);
  const tvaPayee = Math.round(-flux(r3, "paiements_fournisseurs") * part);
  const tvaVersee = Math.round(-flux(r3, "tva_decaissee")) || 0;
  const solde = tvaEncaissee - tvaPayee - tvaVersee;

  const quiFaitCredit: QuiFaitCredit = juin.effet < 0 ? "l-entreprise" : juin.tvaEtat >= juin.tvaClients ? "l-etat" : "le-fournisseur";
  return {
    taux,
    jours: s.roundDays,
    clienteles: s.market.segments.map((g) => ({ code: g.code, nom: g.name, delai: g.paymentDelayDays })),
    fournisseur: { nom: fournisseur?.name ?? c.achat.fournisseur, delai: delaiFournisseur },
    clotures,
    juin,
    quiFaitCredit,
    troisieme: { encaissements, paiements, tvaEncaissee, tvaPayee, tvaVersee, solde, avant: juin.effet, apres: clotures[TRIMESTRE_DES_FLUX - 1]!.effet },
    /** L'écart de trésorerie au 30 juin entre l'année jouée et l'année rejouée sans TVA. */
    ecartAuxDates: clotures.map((x) => x.tresorerie - x.tresorerieSansTva),
    resultatsEgaux: clotures.every((x) => x.resultat === x.resultatSansTva),
  };
}

/** La TVA dans la trésorerie de l'année du cours, trimestre par trimestre. */
export function tvaEtTresorerie(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const k = calculer(c);
  calculs.set(c.code, k);
  return k;
}

const juin = FINS_DES_TRIMESTRES[TRIMESTRE_DECLARE - 1]!;

export const LA_TVA_ET_LA_TRESORERIE: Chapitre = {
  code: "la-tva-et-la-tresorerie",
  parcours: "fiscalite",
  palier: 3,
  blocs: ["BTS CG P3 · Gestion des obligations fiscales", "DCG UE4 · Droit fiscal"],
  titre: "La TVA et la trésorerie : qui fait crédit à qui",
  accroche:
    "La TVA ne coûte rien à l'entreprise, mais elle passe par sa caisse : les clients la paient tard, le fournisseur attend la sienne, l'État la reçoit au trimestre suivant. Ce qu'elle fait à la trésorerie, trimestre après trimestre.",
  objectifs: [
    "Retrouver la TVA contenue dans les créances clients et les dettes fournisseurs",
    "Calculer ce que la TVA laisse ou retire en trésorerie à une date",
    "Distinguer l'effet de la TVA sur le résultat et sur la trésorerie",
    "Lire la TVA dans le budget de trésorerie d'un trimestre",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_OU_LA_TVA_JOUE, pourquoi: POURQUOI_LA_TVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois délais pour une même taxe",
      notions: ["vat_payable", "payment_terms"],
      texte: (c) => {
        const k = tvaEtTresorerie(c);
        return [
          `Pour son ${nomDuTrimestre(TRIMESTRE_DECLARE)}, ${c.entreprise} doit ${eur(declarationDeTva(c).declare.nette)} de TVA à l'État : la TVA collectée sur ses ventes, moins la TVA déductible sur ses achats. Mais à quel moment l'argent de cette TVA est-il entré dans sa caisse, et quand en sort-il ?`,
          `Dans l'arène, les clients paient TTC, chacun à son délai ; le fournisseur est payé TTC au sien ; l'État reçoit la TVA nette du trimestre au trimestre suivant. Trois délais différents pour une même taxe : selon le moment, la TVA est déjà dans la caisse de l'entreprise, ou pas encore.`,
          `Le compte de résultat, lui, reste hors taxes : la TVA (${pct(k.taux)} dans le scénario) n'est ni une charge ni un produit. Elle ne change que le moment où l'argent entre et sort.`,
        ];
      },
      tableau: (c) => {
        const k = tvaEtTresorerie(c);
        return {
          titre: `Les délais de paiement autour ${dE(c.entreprise)}`,
          colonnes: ["Délai de paiement"],
          lignes: [
            ...k.clienteles.map((g) => ({ libelle: `Clients : ${g.nom}`, valeurs: [g.delai === 0 ? "comptant" : `${g.delai} jours`] })),
            { libelle: `Fournisseur : ${k.fournisseur.nom}`, valeurs: [k.fournisseur.delai === 0 ? "comptant" : `${k.fournisseur.delai} jours`] },
            { libelle: "État : la TVA nette du trimestre", valeurs: ["au trimestre suivant"] },
          ],
        };
      },
      repere: (c) => {
        const k = tvaEtTresorerie(c);
        return `Dans un montant TTC, la TVA vaut TTC × taux ÷ (1 + taux) : ici, TTC × ${pct(k.taux)} ÷ ${(1 + k.taux).toLocaleString("fr-FR")}.`;
      },
    },
    {
      id: "au-30-juin",
      type: "montants",
      titre: `Au ${juin}, la TVA qui attend`,
      notions: ["vat_payable", "bfr"],
      tableau: (c) => {
        const k = tvaEtTresorerie(c);
        return {
          titre: `Le bilan de l'arène au ${juin}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Créances clients (TTC)", valeurs: [eur(k.juin.creances)] },
            { libelle: "Dettes fournisseurs (TTC)", valeurs: [eur(k.juin.dettes)] },
            { libelle: "TVA à décaisser", valeurs: [eur(k.juin.tvaEtat)] },
          ],
        };
      },
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Au ${juin}, combien de TVA les clients doivent-ils encore à ${c.entreprise}, et combien en doit-elle encore à son fournisseur (montant TTC × ${pct(k.taux)} ÷ ${(1 + k.taux).toLocaleString("fr-FR")}) ? Calculez ensuite ce que la TVA laisse en trésorerie à cette date : ce que l'entreprise doit encore à l'État et au fournisseur, moins ce que les clients lui doivent.`;
      },
      champs: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juin;
        const facteur = `× ${pct(k.taux)} ÷ ${(1 + k.taux).toLocaleString("fr-FR")}`;
        return [
          { libelle: "TVA due par les clients", attendu: j.tvaClients, calcul: `${eur(j.creances)} ${facteur} = ${eur(j.tvaClients)}`, tolerance: 1 },
          { libelle: "TVA due au fournisseur", attendu: j.tvaFournisseur, calcul: `${eur(j.dettes)} ${facteur} = ${eur(j.tvaFournisseur)}`, tolerance: 1 },
          {
            libelle: "Ce que la TVA laisse en trésorerie",
            attendu: j.effet,
            calcul: `${eur(j.tvaEtat)} + ${eur(j.tvaFournisseur)} − ${eur(j.tvaClients)} = ${eur(j.effet)}`,
            tolerance: 2,
          },
        ];
      },
      explication: (c) => {
        const j = tvaEtTresorerie(c).juin;
        return [
          `Les clients ont encore ${eur(j.tvaClients)} de TVA à payer : l'entreprise ne les a pas en caisse. Mais elle garde ${eur(j.tvaFournisseur)} de TVA qu'elle n'a pas encore payée au fournisseur, et ${eur(j.tvaEtat)} qu'elle ne versera à l'État qu'au trimestre suivant.`,
          j.effet >= 0
            ? `Au total, la TVA laisse ${eur(j.effet)} de plus dans la trésorerie du ${juin} : de l'argent qui n'est pas à l'entreprise, et qui partira.`
            : `Au total, la TVA retire ${eur(-j.effet)} de la trésorerie du ${juin} : l'entreprise avance une TVA que ses clients ne lui ont pas encore payée.`,
        ];
      },
    },
    {
      id: "sans-tva",
      type: "choix",
      titre: "L'arène rejoue l'année sans TVA",
      notions: ["net_treasury", "income_statement"],
      tableau: (c) => {
        const k = tvaEtTresorerie(c);
        return {
          titre: "L'année jouée avec la TVA, puis rejouée sans",
          colonnes: [...FINS_DES_TRIMESTRES],
          lignes: [
            { libelle: "Trésorerie, avec la TVA", valeurs: k.clotures.map((x) => eur(x.tresorerie)) },
            { libelle: "Trésorerie, sans la TVA", valeurs: k.clotures.map((x) => eur(x.tresorerieSansTva)) },
            { libelle: "Résultat net du trimestre, avec la TVA", valeurs: k.clotures.map((x) => eur(x.resultat)) },
            { libelle: "Résultat net du trimestre, sans la TVA", valeurs: k.clotures.map((x) => eur(x.resultatSansTva)) },
          ],
        };
      },
      question: (c) =>
        `L'arène a rejoué l'année ${dE(c.entreprise)} avec un taux de TVA nul, tout le reste identique : mêmes clients, mêmes décisions. Que montre la comparaison au ${juin} ?`,
      options: (c) => {
        const k = tvaEtTresorerie(c);
        const ecart = k.ecartAuxDates[TRIMESTRE_DECLARE - 1]!;
        const plus = ecart >= 0;
        return [
          {
            texte: `Le même résultat, et une trésorerie ${plus ? "plus haute" : "plus basse"} avec la TVA`,
            juste: k.resultatsEgaux,
            retour: `Oui : la TVA ne change pas le résultat, elle n'est pas une charge. Au ${juin}, la trésorerie est ${plus ? "plus haute" : "plus basse"} de ${eur(Math.abs(ecart))} avec la TVA : c'est, à l'euro d'arrondi près, ce que vous avez calculé (${eur(k.juin.effet)}).`,
          },
          {
            texte: "Un résultat plus faible avec la TVA, qui coûte à l'entreprise",
            juste: false,
            retour: "Non : les deux résultats sont égaux, trimestre après trimestre. Le compte de résultat est hors taxes, la TVA n'y entre pas.",
          },
          {
            texte: "Aucune différence : la TVA ne touche ni le résultat ni la trésorerie",
            juste: false,
            retour: `Non : le résultat ne bouge pas, mais la trésorerie, si : ${eur(Math.abs(ecart))} d'écart au ${juin}. La TVA passe par la caisse avant d'aller à l'État.`,
          },
        ];
      },
    },
    {
      id: "qui-fait-credit",
      type: "choix",
      titre: "Qui fait crédit à qui",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const j = tvaEtTresorerie(c).juin;
        return `Au ${juin}, les clients doivent ${eur(j.tvaClients)} de TVA à ${c.entreprise}, elle en doit ${eur(j.tvaFournisseur)} à son fournisseur et ${eur(j.tvaEtat)} à l'État. Qui finance la TVA que les clients n'ont pas encore payée ?`;
      },
      options: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juin;
        const v = k.quiFaitCredit;
        return [
          {
            texte: "L'État, à lui seul : la TVA qui lui est due dépasse celle des clients",
            juste: v === "l-etat",
            retour:
              v === "l-etat"
                ? `Oui : l'entreprise garde ${eur(j.tvaEtat)} dus à l'État jusqu'au trimestre suivant, plus que les ${eur(j.tvaClients)} que ses clients lui doivent. L'État lui fait crédit, sans le savoir.`
                : `Non : les ${eur(j.tvaEtat)} dus à l'État ne couvrent pas les ${eur(j.tvaClients)} que doivent les clients.`,
          },
          {
            texte: "L'État et le fournisseur ensemble, car les clients doivent plus que l'État n'attend",
            juste: v === "le-fournisseur",
            retour:
              v === "le-fournisseur"
                ? `Oui : les clients doivent ${eur(j.tvaClients)}, plus que les ${eur(j.tvaEtat)} dus à l'État. C'est la TVA pas encore payée au fournisseur, ${eur(j.tvaFournisseur)}, qui comble l'écart.`
                : v === "l-etat"
                  ? `Non : l'État suffit, ses ${eur(j.tvaEtat)} dépassent les ${eur(j.tvaClients)} des clients.`
                  : `Non : même avec le fournisseur, il manque ${eur(-j.effet)}.`,
          },
          {
            texte: "L'entreprise elle-même : elle avance plus de TVA qu'on ne lui en laisse",
            juste: v === "l-entreprise",
            retour:
              v === "l-entreprise"
                ? `Oui : les clients doivent ${eur(j.tvaClients)}, plus que l'État et le fournisseur réunis n'attendent. L'entreprise finance l'écart, ${eur(-j.effet)}, sur sa trésorerie.`
                : `Non : l'État et le fournisseur attendent ensemble ${eur(j.tvaEtat + j.tvaFournisseur)}, plus que les ${eur(j.tvaClients)} des clients. L'entreprise n'avance rien.`,
          },
        ];
      },
    },
    {
      id: "troisieme-trimestre",
      type: "montants",
      titre: "La TVA dans le budget de trésorerie",
      notions: ["cash_budget", "vat_payable"],
      tableau: (c) => {
        const t = tvaEtTresorerie(c).troisieme;
        return {
          titre: `Le budget de trésorerie de l'arène, ${nomDuTrimestre(TRIMESTRE_DES_FLUX)} (extrait)`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Encaissements clients", valeurs: [eur(t.encaissements)] },
            { libelle: "Paiements fournisseurs", valeurs: [eur(-t.paiements)] },
            { libelle: "TVA décaissée", valeurs: [eur(-t.tvaVersee)] },
          ],
        };
      },
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Au ${nomDuTrimestre(TRIMESTRE_DES_FLUX)} (${MOIS_DES_TRIMESTRES[TRIMESTRE_DES_FLUX - 1]}), la TVA ne paraît qu'une fois dans le budget de trésorerie, à la ligne « TVA décaissée ». Le reste est caché dans les encaissements et les paiements, qui sont TTC. Calculez la TVA encaissée des clients et la TVA payée au fournisseur (× ${pct(k.taux)} ÷ ${(1 + k.taux).toLocaleString("fr-FR")}), puis le solde de TVA du trimestre (encaissée − payée − versée à l'État ; négatif si la TVA a pesé sur la trésorerie).`;
      },
      champs: (c) => {
        const k = tvaEtTresorerie(c);
        const t = k.troisieme;
        const facteur = `× ${pct(k.taux)} ÷ ${(1 + k.taux).toLocaleString("fr-FR")}`;
        return [
          { libelle: "TVA encaissée des clients", attendu: t.tvaEncaissee, calcul: `${eur(t.encaissements)} ${facteur} = ${eur(t.tvaEncaissee)}`, tolerance: 1 },
          { libelle: "TVA payée au fournisseur", attendu: t.tvaPayee, calcul: `${eur(t.paiements)} ${facteur} = ${eur(t.tvaPayee)}`, tolerance: 1 },
          {
            libelle: "Solde de TVA du trimestre",
            attendu: t.solde,
            calcul: `${eur(t.tvaEncaissee)} − ${eur(t.tvaPayee)} − ${eur(t.tvaVersee)} = ${eur(t.solde)}`,
            tolerance: 3,
          },
        ];
      },
      explication: (c) => {
        const t = tvaEtTresorerie(c).troisieme;
        const fin = FINS_DES_TRIMESTRES[TRIMESTRE_DES_FLUX - 1]!;
        return [
          t.solde < 0
            ? `Ce trimestre, la TVA a pesé sur la trésorerie : l'entreprise a versé à l'État et au fournisseur ${eur(-t.solde)} de TVA de plus qu'elle n'en a reçu de ses clients.`
            : `Ce trimestre, la TVA a soulagé la trésorerie : l'entreprise a reçu de ses clients ${eur(t.solde)} de TVA de plus qu'elle n'en a versé à l'État et au fournisseur.`,
          `C'est ce qui fait passer ce que la TVA laisse en trésorerie de ${eur(t.avant)} au ${juin} à ${eur(t.apres)} au ${fin} : d'un trimestre à l'autre, selon les ventes, les achats et les délais, la TVA soulage la trésorerie ou pèse sur elle.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["vat_payable", "bfr"],
      texte: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juin;
        return [
          `Au ${juin}, la TVA ${j.effet >= 0 ? `laisse ${eur(j.effet)} dans` : `retire ${eur(-j.effet)} de`} la trésorerie ${dE(c.entreprise)} : ${eur(j.tvaEtat)} dus à l'État et ${eur(j.tvaFournisseur)} dus au fournisseur, moins ${eur(j.tvaClients)} que les clients doivent encore. L'arène, rejouée sans TVA, donne le même résultat et l'écart de trésorerie que vous avez calculé.`,
          "La TVA n'est pas une charge, mais elle fait partie du besoin en fonds de roulement : une créance de TVA sur les clients, une dette de TVA envers le fournisseur et envers l'État. Des clients qui paient tard, un fournisseur payé vite, une TVA versée tôt : elle pèse. L'inverse : elle soulage.",
          "Cet argent n'appartient pas à l'entreprise : une trésorerie gonflée par la TVA due à l'État se dégonfle au trimestre suivant. Le budget de trésorerie doit prévoir ce versement.",
        ];
      },
      repere: () =>
        "Ce que la TVA laisse en trésorerie = TVA due à l'État + TVA due au fournisseur − TVA due par les clients. Dans un montant TTC, la TVA = TTC × taux ÷ (1 + taux).",
    },
  ],
};
