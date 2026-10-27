import type { SegmentConfig } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE CLIENT QUI PAIE TARD, DÉLAI, ESCOMPTE ET AFFACTURAGE (BTS GPME, palier 2).
 *
 * Dans l'arène, chaque clientèle a son délai de paiement (`paymentDelayDays` du segment) : une
 * vente à crédit reste en créance jusqu'à la clôture du trimestre pour la part du trimestre que
 * dure le délai (ventes TTC × délai ÷ durée du trimestre). Le chapitre recompose les créances
 * clients du bilan de fin d'année clientèle par clientèle, en tire le délai moyen, puis chiffre
 * les deux outils qui transforment ces créances en trésorerie (`treasury.discount` et
 * `treasury.factoring` des décisions, ouverts au niveau 3) :
 *
 *   · l'escompte : la banque avance des créances, plafonnées à une part du poste clients
 *     (`treasury.discountMaxShare`), contre des intérêts au taux annuel
 *     (`treasury.discountAnnualRate`) pour la durée du trimestre ;
 *   · l'affacturage : un factor achète les créances, sans plafond, contre une commission sur le
 *     montant cédé (`treasury.factoringFeeRate`).
 *
 * L'arène rejoue l'année avec la même somme mobilisée au dernier trimestre, par l'un puis par
 * l'autre (gestion-de-la-pme.ts). Au-delà du plafond de découvert, la banque cède d'elle-même
 * des créances à un taux plus fort (l'affacturage forcé, src/engine/finance/statements.ts) :
 * le chapitre le montre là où l'année du cours le rencontre. L'année du cours, jouée comme une
 * partie d'aujourd'hui (arene-du-cours.ts), ne le rencontre dans aucune entreprise : la cession
 * d'office reste calculée, et ses phrases ne se lisent que si une année la fait revenir (la garde
 * vérifie qu'aucune ne la rencontre).
 */

/**
 * Le trimestre où l'entreprise mobilise ses créances : le dernier de l'année. Ce qu'elle reçoit
 * se lit au bilan de clôture, et rien ne vient après pour le défaire dans l'année : le client
 * paie alors la banque ou le factor, plus l'entreprise.
 */
export const TRIMESTRE_DE_LA_MOBILISATION = 4;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const jours = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} jours`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les clientèles de l'entreprise : celles de chaque référence en gamme, sinon celles du marché. */
export function clientelesDe(code: string): SegmentConfig[] {
  const s = scenarioByCode(code).scenario;
  return s.products ? s.products.flatMap((p) => p.market.segments) : s.market.segments;
}

/** Les créances de l'année du cours, et ce que l'escompte et l'affacturage en font au dernier trimestre. */
export function clientQuiPaieTard(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const outils = s.treasury!;
  const tva = s.finance.vatRate ?? 0;
  const duree = s.roundDays;
  const ref = anneeDeReference(c.code);
  const fin = ref[TRIMESTRE_DE_LA_MOBILISATION - 1]!;
  const aCredit = clientelesDe(c.code).filter((g) => g.paymentDelayDays > 0);
  const clienteles = aCredit.map((g) => {
    const caDuTrimestre = auCentime(fin.market.bySegment[g.code]?.revenue ?? 0);
    return {
      code: g.code,
      nom: g.name,
      delai: g.paymentDelayDays,
      caDeLAnnee: Math.round(surLAnnee(ref, (r) => r.market.bySegment[g.code]?.revenue ?? 0)),
      caDuTrimestre,
      creance: auCentime(caDuTrimestre * (1 + tva) * Math.min(1, g.paymentDelayDays / duree)),
    };
  });
  const caDeLAnnee = Math.round(surLAnnee(ref, (r) => r.incomeStatement.revenue));
  // Le chiffre d'affaires comptant se calcule sur les montants exacts, puis s'arrondit : deux arrondis
  // retranchés l'un de l'autre feraient naître un euro comptant là où toutes les clientèles paient à crédit.
  const caComptant =
    Math.round(surLAnnee(ref, (r) => r.incomeStatement.revenue) - clienteles.reduce((t, x) => t + surLAnnee(ref, (r) => r.market.bySegment[x.code]?.revenue ?? 0), 0)) || 0;
  const caDuTrimestre = auCentime(fin.incomeStatement.revenue);
  const caDuTrimestreTtc = auCentime(caDuTrimestre * (1 + tva));
  const creancesNees = auCentime(clienteles.reduce((t, x) => t + x.creance, 0));
  const delaiMoyen = Math.round((creancesNees / caDuTrimestreTtc) * duree * 10) / 10;
  const cedeesDOffice = auCentime(fin.treasury?.forcedFactored ?? 0);

  // La même somme, mobilisée au dernier trimestre par l'escompte, puis par l'affacturage.
  const mobilise = Math.floor(outils.discountMaxShare * creancesNees);
  const coutEscompte = auCentime(mobilise * outils.discountAnnualRate * (duree / 360));
  const coutAffacturage = auCentime(mobilise * outils.factoringFeeRate);
  const mobiliser = (cle: "discount" | "factoring") =>
    rejouerAvec(c.code, `${cle}-t${TRIMESTRE_DE_LA_MOBILISATION}`, (t, d) =>
      t === TRIMESTRE_DE_LA_MOBILISATION ? { ...d, treasury: { ...d.treasury, [cle]: mobilise } } : undefined,
    );
  const lire = (annee: typeof ref) => {
    const r = annee[TRIMESTRE_DE_LA_MOBILISATION - 1]!;
    return {
      creances: Math.round(r.balanceSheet.receivables),
      cedeesDOffice: Math.round(r.treasury?.forcedFactored ?? 0),
      chargesFinancieres: Math.round(r.incomeStatement.interest),
      resultat: Math.round(surLAnnee(annee, (x) => x.incomeStatement.netIncome)),
      tresorerie: Math.round(r.functionalBalance.netTreasury),
    };
  };
  const sans = lire(ref);
  const escompte = lire(mobiliser("discount"));
  const affacturage = lire(mobiliser("factoring"));
  return {
    tva,
    duree,
    outils,
    tauxDeDecouvert: s.finance.overdraftAnnualRate,
    clienteles,
    caDeLAnnee,
    caComptant,
    caDuTrimestre,
    caDuTrimestreTtc,
    creancesNees,
    delaiMoyen,
    cedeesDOffice,
    mobilise,
    coutEscompte,
    coutAffacturage,
    sans,
    escompte,
    affacturage,
    gainEscompte: escompte.tresorerie - sans.tresorerie,
    gainAffacturage: affacturage.tresorerie - sans.tresorerie,
    resultatPerduEscompte: sans.resultat - escompte.resultat,
    resultatPerduAffacturage: sans.resultat - affacturage.resultat,
  };
}

export const LE_CLIENT_QUI_PAIE_TARD: Chapitre = {
  code: "le-client-qui-paie-tard",
  parcours: "gpme",
  palier: 2,
  blocs: ["BTS GPME Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME"],
  titre: "Le client qui paie tard : délai, escompte et affacturage",
  accroche:
    "Une vente à crédit est faite, mais pas encore payée : elle attend au bilan. Les créances clientèle par clientèle, le délai moyen, puis l'escompte et l'affacturage : ce qu'ils font rentrer en trésorerie, et ce qu'ils coûtent.",
  objectifs: [
    "Calculer les créances clients que crée un délai de paiement",
    "Calculer le délai moyen de paiement des clients",
    "Chiffrer le coût d'un escompte et d'un affacturage",
    "Distinguer ce que la mobilisation des créances fait à la trésorerie et au résultat",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des clients qui paient plus tard",
      notions: ["payment_terms", "balance_sheet"],
      texte: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          k.caComptant > 0
            ? `Toutes les clientèles ${dE(c.entreprise)} ne paient pas à la vente. Celles du tableau paient plus tard, à leur délai ; les autres paient comptant (${eur(k.caComptant)} de chiffre d'affaires sur l'année).`
            : `Aucune clientèle ${dE(c.entreprise)} ne paie à la vente : chacune paie plus tard, à son délai.`,
          `Tant qu'un client n'a pas payé, la vente est faite mais l'argent n'est pas là : c'est une créance, à l'actif du bilan. Dans l'arène, une vente du trimestre payée à ${jours(k.clienteles[0]!.delai)}, sur un trimestre de ${jours(k.duree)}, est encore due pour ${pct(Math.round(Math.min(1, k.clienteles[0]!.delai / k.duree) * 1000) / 10)} de son montant à la clôture.`,
        ];
      },
      tableau: (c) => {
        const k = clientQuiPaieTard(c);
        return {
          titre: `Les clientèles ${dE(c.entreprise)} qui paient à crédit`,
          colonnes: ["Délai de paiement", "Chiffre d'affaires de l'année"],
          lignes: k.clienteles.map((x) => ({ libelle: x.nom, valeurs: [jours(x.delai), eur(x.caDeLAnnee)] })),
        };
      },
      repere: (c) => {
        const k = clientQuiPaieTard(c);
        return k.tva > 0
          ? `Créance d'une clientèle à la clôture = ventes du trimestre TTC × délai ÷ ${k.duree}.`
          : `Créance d'une clientèle à la clôture = ventes du trimestre × délai ÷ ${k.duree}.`;
      },
    },
    {
      id: "creances",
      type: "montants",
      titre: "Les créances et le délai moyen",
      notions: ["payment_terms", "bfr"],
      tableau: (c) => {
        const k = clientQuiPaieTard(c);
        return {
          titre: "Le dernier trimestre de l'année",
          colonnes: ["Délai", "Ventes du trimestre (hors taxes)"],
          lignes: [
            ...k.clienteles.map((x) => ({ libelle: x.nom, valeurs: [jours(x.delai), eur(x.caDuTrimestre)] })),
            { libelle: "Chiffre d'affaires du trimestre, toutes clientèles", valeurs: ["", eur(k.caDuTrimestre)] },
          ],
        };
      },
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Calculez la créance de chaque clientèle à la clôture (ventes du trimestre${k.tva > 0 ? `, TVA comprise (${pct(k.tva * 100)}),` : ""} × délai ÷ ${k.duree}), puis le délai moyen de paiement des clients : créances ÷ chiffre d'affaires du trimestre${k.tva > 0 ? " TTC" : ""} × ${k.duree}, au dixième de jour.`;
      },
      champs: (c) => {
        const k = clientQuiPaieTard(c);
        const facteur = k.tva > 0 ? ` × ${(1 + k.tva).toLocaleString("fr-FR")}` : "";
        return [
          ...k.clienteles.map((x) => ({
            libelle: `Créance : ${x.nom}`,
            attendu: x.creance,
            calcul: `${eur(x.caDuTrimestre)}${facteur} × ${x.delai} ÷ ${k.duree} = ${eur(x.creance)}`,
            tolerance: 1,
          })),
          {
            libelle: "Délai moyen de paiement des clients (jours)",
            attendu: k.delaiMoyen,
            calcul: `${eur(k.creancesNees)} ÷ ${eur(k.caDuTrimestreTtc)} × ${k.duree} = ${jours(k.delaiMoyen)}`,
            tolerance: 0.2,
          },
        ];
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `À la clôture, les clients doivent ${eur(k.creancesNees)} à ${c.entreprise} : en moyenne, ils paient à ${jours(k.delaiMoyen)}. C'est de l'argent gagné que l'entreprise n'a pas encore, et qu'elle finance en attendant.`,
          k.cedeesDOffice > 0
            ? `Au bilan, pourtant, les créances ne sont que de ${eur(k.sans.creances)} : la trésorerie dépassant le découvert permis, la banque en a cédé d'office ${eur(k.cedeesDOffice)} à un factor, au taux de ${pct(k.outils.forcedFactoringFeeRate * 100)} du montant. C'est ce qu'il faut éviter en mobilisant soi-même ses créances, plus tôt et moins cher.`
            : `Ce sont les créances clients du bilan de fin d'année : ${eur(k.sans.creances)}.`,
        ];
      },
    },
    {
      id: "outils",
      type: "montants",
      titre: "L'escompte et l'affacturage",
      notions: ["receivables_financing"],
      tableau: (c) => {
        const k = clientQuiPaieTard(c);
        return {
          titre: `Deux façons de mobiliser les créances ${dE(c.entreprise)}`,
          colonnes: ["Escompte", "Affacturage"],
          lignes: [
            { libelle: "Ce que l'organisme avance", valeurs: [`au plus ${pct(k.outils.discountMaxShare * 100)} des créances`, "toutes les créances"] },
            { libelle: "Ce qu'il en coûte", valeurs: [`${pct(k.outils.discountAnnualRate * 100)} par an, pour un trimestre`, `${pct(k.outils.factoringFeeRate * 100)} du montant cédé`] },
          ],
        };
      },
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `${c.entreprise} veut faire rentrer tout de suite le plus de créances que l'escompte permet. Calculez ce montant (le plafond × les créances, arrondi à l'euro inférieur), puis ce que coûterait sa mobilisation par l'escompte (montant × taux annuel × ${k.duree} ÷ 360) et par l'affacturage (montant × commission).`;
      },
      champs: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          { libelle: "Montant escomptable au plus", attendu: k.mobilise, calcul: `${eur(k.creancesNees)} × ${pct(k.outils.discountMaxShare * 100)} = ${eur(k.mobilise)}`, tolerance: 1 },
          {
            libelle: "Coût de l'escompte",
            attendu: k.coutEscompte,
            calcul: `${eur(k.mobilise)} × ${pct(k.outils.discountAnnualRate * 100)} × ${k.duree} ÷ 360 = ${eur(k.coutEscompte)}`,
            tolerance: 0.5,
          },
          { libelle: "Coût de l'affacturage", attendu: k.coutAffacturage, calcul: `${eur(k.mobilise)} × ${pct(k.outils.factoringFeeRate * 100)} = ${eur(k.coutAffacturage)}`, tolerance: 0.5 },
        ];
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `L'escompte se paie au temps : un taux annuel, pour le trimestre que dure l'avance. L'affacturage se paie au montant : une commission, quelle que soit la durée. Pour ${eur(k.mobilise)}, l'escompte coûte ${eur(k.coutEscompte)} et l'affacturage ${eur(k.coutAffacturage)}.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue le dernier trimestre",
      notions: ["receivables_financing", "net_treasury"],
      tableau: (c) => {
        const k = clientQuiPaieTard(c);
        const avecCessions = k.sans.cedeesDOffice + k.escompte.cedeesDOffice + k.affacturage.cedeesDOffice > 0;
        return {
          titre: `L'année jouée, avec ${eur(k.mobilise)} mobilisés au dernier trimestre`,
          colonnes: ["Sans rien mobiliser", "Par l'escompte", "Par l'affacturage"],
          lignes: [
            { libelle: "Créances clients au bilan de fin d'année", valeurs: [k.sans, k.escompte, k.affacturage].map((x) => eur(x.creances)) },
            ...(avecCessions ? [{ libelle: "Créances cédées d'office par la banque", valeurs: [k.sans, k.escompte, k.affacturage].map((x) => eur(x.cedeesDOffice)) }] : []),
            { libelle: "Charges financières du trimestre", valeurs: [k.sans, k.escompte, k.affacturage].map((x) => eur(x.chargesFinancieres)) },
            { libelle: "Résultat de l'exercice", valeurs: [k.sans, k.escompte, k.affacturage].map((x) => eur(x.resultat)) },
            { libelle: "Trésorerie nette de fin d'année", valeurs: [k.sans, k.escompte, k.affacturage].map((x) => eur(x.tresorerie)) },
          ],
        };
      },
      question: () =>
        "Par rapport à l'année sans rien mobiliser, calculez la trésorerie gagnée et le résultat perdu, avec l'escompte puis avec l'affacturage.",
      champs: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          { libelle: "Trésorerie gagnée, escompte", attendu: k.gainEscompte, calcul: `${eur(k.escompte.tresorerie)} − ${retranche(k.sans.tresorerie)} = ${eur(k.gainEscompte)}`, tolerance: 1 },
          { libelle: "Résultat perdu, escompte", attendu: k.resultatPerduEscompte, calcul: `${eur(k.sans.resultat)} − ${retranche(k.escompte.resultat)} = ${eur(k.resultatPerduEscompte)}`, tolerance: 1 },
          { libelle: "Trésorerie gagnée, affacturage", attendu: k.gainAffacturage, calcul: `${eur(k.affacturage.tresorerie)} − ${retranche(k.sans.tresorerie)} = ${eur(k.gainAffacturage)}`, tolerance: 1 },
          {
            libelle: "Résultat perdu, affacturage",
            attendu: k.resultatPerduAffacturage,
            calcul: `${eur(k.sans.resultat)} − ${retranche(k.affacturage.resultat)} = ${eur(k.resultatPerduAffacturage)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = clientQuiPaieTard(c);
        const baisse = k.sans.creances - k.escompte.creances;
        const evitee = k.sans.cedeesDOffice - k.escompte.cedeesDOffice;
        const perte =
          evitee > 0
            ? "le coût de l'escompte, moins celui de la cession d'office qu'il évite"
            : k.resultatPerduEscompte < k.coutEscompte - 0.5
              ? "le coût, allégé de l'impôt qu'il fait économiser"
              : "le coût, en entier";
        return [
          `La trésorerie gagne ce que les créances perdent (${eur(baisse)} avec l'escompte), moins ce que le résultat perd : ${perte}.`,
          evitee > 0
            ? `Sans rien mobiliser, la banque avait déjà cédé d'office ${eur(evitee)} de créances, à ${pct(k.outils.forcedFactoringFeeRate * 100)} du montant (${eur(auCentime(evitee * k.outils.forcedFactoringFeeRate))}) : l'escompte l'évite. C'est pourquoi la trésorerie gagne moins que la somme escomptée, et le résultat perd moins que le coût de l'escompte.`
            : "L'argent n'est pas gagné : il arrive plus tôt. Le client paiera la banque ou le factor, et non plus l'entreprise ; le seul effet durable est le coût.",
        ];
      },
    },
    {
      id: "lequel",
      type: "choix",
      titre: "Escompte ou affacturage ?",
      notions: ["receivables_financing"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Pour faire rentrer ${eur(k.mobilise)} de créances au dernier trimestre, que choisit ${c.entreprise} ?`;
      },
      options: (c) => {
        const k = clientQuiPaieTard(c);
        const comparaison = `l'escompte coûte ${eur(k.coutEscompte)}, l'affacturage ${eur(k.coutAffacturage)}`;
        return [
          {
            texte: "L'escompte : il coûte moins cher, dans la limite de son plafond",
            juste: k.coutEscompte < k.coutAffacturage,
            retour:
              k.coutEscompte < k.coutAffacturage
                ? `Oui : ${comparaison}. Au-delà du plafond de ${pct(k.outils.discountMaxShare * 100)} des créances, il faudrait l'affacturage.`
                : `Non : ${comparaison}.`,
          },
          {
            texte: "L'affacturage : il coûte moins cher, et sans plafond",
            juste: k.coutAffacturage < k.coutEscompte,
            retour: k.coutAffacturage < k.coutEscompte ? `Oui : ${comparaison}.` : `Non : ${comparaison}. L'affacturage n'a pas de plafond, c'est son avantage, pas son prix.`,
          },
          {
            texte: "Peu importe : les deux font rentrer autant et coûtent autant",
            juste: k.coutAffacturage === k.coutEscompte,
            retour: k.coutAffacturage === k.coutEscompte ? `Oui : ${comparaison}.` : `Non : ils font rentrer autant, mais ${comparaison}.`,
          },
        ];
      },
    },
    {
      id: "gagner",
      type: "choix",
      titre: "Mobiliser ses créances, est-ce gagner de l'argent ?",
      notions: ["receivables_financing", "net_treasury"],
      question: (c) => {
        const k = clientQuiPaieTard(c);
        return `Avec l'escompte, la trésorerie de fin d'année ${dE(c.entreprise)} monte de ${eur(k.gainEscompte)}. Est-ce un gain ?`;
      },
      options: (c) => {
        const k = clientQuiPaieTard(c);
        const decouvert =
          k.tauxDeDecouvert > k.outils.discountAnnualRate
            ? ` Il vaut la peine quand il évite un découvert, à ${pct(k.tauxDeDecouvert * 100)} par an au moins, ou une cession d'office, à ${pct(k.outils.forcedFactoringFeeRate * 100)} du montant.`
            : "";
        return [
          {
            texte: "Non : l'argent arrive plus tôt, et le résultat baisse du coût",
            juste: k.resultatPerduEscompte > 0,
            retour:
              k.resultatPerduEscompte > 0
                ? `Oui : le résultat de l'exercice baisse de ${eur(k.resultatPerduEscompte)}. L'escompte avance l'encaissement, il ne le crée pas.${decouvert}`
                : `Non : ici, le résultat ne baisse pas, il monte de ${eur(-k.resultatPerduEscompte)}.`,
          },
          {
            texte: "Oui : la trésorerie monte, c'est autant de gagné pour l'entreprise",
            juste: false,
            retour: `Non : la trésorerie monte parce que les créances baissent (${eur(k.sans.creances)} à ${eur(k.escompte.creances)}). Le client paiera la banque, et non plus l'entreprise.`,
          },
          {
            texte: "Oui, ici : il évite une cession d'office plus chère, et le résultat monte",
            juste: k.resultatPerduEscompte <= 0,
            retour:
              k.resultatPerduEscompte <= 0
                ? `Oui : sans escompte, la banque cédait d'office des créances plus cher ; le résultat monte de ${eur(-k.resultatPerduEscompte)}.`
                : k.sans.cedeesDOffice > 0
                  ? `Non : l'escompte évite bien une cession d'office, mais le résultat baisse encore de ${eur(k.resultatPerduEscompte)}.`
                  : "Non : la banque n'a rien cédé d'office cette année, il n'y avait rien à éviter.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payment_terms", "receivables_financing"],
      texte: (c) => {
        const k = clientQuiPaieTard(c);
        return [
          `Chez ${c.entreprise}, les clients paient en moyenne à ${jours(k.delaiMoyen)}, et doivent ${eur(k.creancesNees)} à la clôture. Escompter ${eur(k.mobilise)} coûte ${eur(k.coutEscompte)}, les faire affacturer ${eur(k.coutAffacturage)}.`,
          "Un délai client se finance : par la trésorerie de l'entreprise, ou par une banque qui avance les créances contre un coût. L'escompte et l'affacturage n'améliorent pas le résultat : ils changent le moment où l'argent rentre. On les utilise pour éviter un découvert ou une cession forcée plus chère, pas pour gagner de l'argent.",
        ];
      },
      repere: (c) => {
        const k = clientQuiPaieTard(c);
        return `Délai moyen clients = créances ÷ chiffre d'affaires du trimestre${k.tva > 0 ? " TTC" : ""} × ${k.duree}. Coût de l'escompte = montant × taux annuel × durée ÷ 360 ; coût de l'affacturage = montant × commission.`;
      },
    },
  ],
};
