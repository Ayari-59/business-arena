import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../../scenarios/registry";
import { anneeJouee, type Cas } from "../../cas";
import { ENTREPRISES_OU_LA_TVA_JOUE, POURQUOI_LA_TVA } from "../../chapitres/la-declaration-de-tva";
import { tvaEtTresorerie } from "../../chapitres/la-tva-et-la-tresorerie";
import { rejouerAvec, surLAnnee } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA TVA ET LA TRÉSORERIE » : LA TVA AVANCÉE POUR LE CLIENT
 * (fiscalité, palier 3).
 *
 * Une clientèle qui paie à crédit demande un délai plus long. La gérante veut savoir ce que cela
 * aurait coûté en trésorerie au 31 décembre, accordé dès janvier, et quelle part de cette somme
 * est de la TVA que l'entreprise avance à l'État pour ses clients : dans l'arène, la TVA d'une
 * vente se verse au trimestre qui suit, que le client ait payé ou non. L'élève refait les calculs
 * du chapitre (la TVA contenue dans une créance TTC, ce que la TVA laisse en trésorerie), l'arène
 * rejoue l'année avec le délai allongé (le `paymentDelayDays` de la clientèle dans le scénario,
 * tout le reste identique), puis il rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre lit la TVA dans l'année telle qu'elle est ; le
 * cas chiffre une décision commerciale, et ce qu'elle coûte en TVA avancée.
 */

/** Les jours de délai que la clientèle demande en plus : 30, un mois de plus pour payer. */
export const JOURS_DEMANDES = 30;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

const calculs = new Map<string, ReturnType<typeof calculer>>();

function calculer(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const taux = s.finance.vatRate ?? 0;
  const jours = s.roundDays;
  const ref = anneeJouee(c.code).partie.rounds.map((t) => t.results["joueur"]!);
  const fin = ref.at(-1)!;
  // La clientèle à crédit qui pèse le plus au dernier trimestre, parmi celles dont le délai allongé reste dans le trimestre.
  const candidates = s.market.segments.filter((g) => g.paymentDelayDays > 0 && g.paymentDelayDays + JOURS_DEMANDES <= jours);
  const clientele = candidates.reduce((m, g) => ((fin.market.bySegment[g.code]?.revenue ?? 0) > (fin.market.bySegment[m.code]?.revenue ?? 0) ? g : m));
  const delai = clientele.paymentDelayDays + JOURS_DEMANDES;
  const annee = rejouerAvec(
    c.code,
    `la-tva-et-la-tresorerie-delai-${clientele.code}`,
    () => undefined,
    (sc) => ({ ...sc, market: { ...sc.market, segments: sc.market.segments.map((g) => (g.code === clientele.code ? { ...g, paymentDelayDays: delai } : g)) } }),
  );
  const ventes = Math.round(fin.market.bySegment[clientele.code]?.revenue ?? 0);
  const creanceEnPlus = Math.round((ventes * (1 + taux) * JOURS_DEMANDES) / jours);
  const tvaEnPlus = Math.round((ventes * taux * JOURS_DEMANDES) / jours);
  const tresorerie = Math.round(fin.cashFlow.closing);
  const tresorerieAvecLeDelai = Math.round(annee.at(-1)!.cashFlow.closing);
  const effetAujourdhui = tvaEtTresorerie(c).clotures.at(-1)!.effet;
  return {
    taux,
    jours,
    clientele: { code: clientele.code, nom: clientele.name, court: clientele.name.split(" (")[0]!, delai: clientele.paymentDelayDays },
    delai,
    ventes,
    creanceEnPlus,
    tvaEnPlus,
    tresorerie,
    tresorerieAvecLeDelai,
    perte: tresorerie - tresorerieAvecLeDelai,
    resultatPerdu: Math.round(surLAnnee(ref, (r) => r.incomeStatement.netIncome) - surLAnnee(annee, (r) => r.incomeStatement.netIncome)),
    effetAujourdhui,
    effetAvecLeDelai: effetAujourdhui - tvaEnPlus,
    /** L'année rejouée passe-t-elle à découvert, quand l'année du cours n'y passait pas ? */
    decouvert: annee.some((r) => r.balanceSheet.overdraft > 0) && !ref.some((r) => r.balanceSheet.overdraft > 0),
    annee,
  };
}

/** Le délai allongé d'une clientèle, l'année rejouée, et la TVA que l'entreprise avance pour elle. */
export function tvaAvanceePourLeClient(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const k = calculer(c);
  calculs.set(c.code, k);
  return k;
}

const facteur = (k: ReturnType<typeof tvaAvanceePourLeClient>) => `× ${JOURS_DEMANDES} ÷ ${k.jours}`;

export const LA_TVA_AVANCEE_POUR_LE_CLIENT: Situation = {
  code: "la-tva-avancee-pour-le-client",
  parcours: "fiscalite",
  palier: 3,
  blocs: [],
  reprend: ["la-tva-et-la-tresorerie"],
  commanditaire: "La gérante",
  titre: "La TVA avancée pour le client",
  accroche:
    "Une clientèle veut payer plus tard. Ce que le délai aurait coûté à la trésorerie de fin d'année, et la part de TVA que l'entreprise aurait avancée à l'État à la place de ses clients.",
  objectifs: [
    "Calculer la créance TTC que crée un délai plus long, et la TVA qu'elle contient",
    "Lire l'effet du délai sur la trésorerie dans l'année rejouée",
    "Calculer ce que la TVA laisse encore en trésorerie",
    "Répondre à la gérante, chiffre à l'appui",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_OU_LA_TVA_JOUE, pourquoi: POURQUOI_LA_TVA },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Un délai plus long",
      texte: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return [
          `« La clientèle ${k.clientele.court} nous demande de payer à ${k.delai} jours au lieu de ${k.clientele.delai}. Si nous l'avions accepté dès janvier, combien aurions-nous de moins en trésorerie au 31 décembre ? Et dans cette somme, combien de TVA aurions-nous versée à l'État sans l'avoir encore reçue de ces clients ? »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. L'arène a rejoué l'année avec le délai demandé, tout le reste identique.",
        ];
      },
      tableau: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return {
          titre: `La clientèle « ${k.clientele.nom} »`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Délai de paiement aujourd'hui", valeurs: [`${k.clientele.delai} jours`] },
            { libelle: "Délai demandé", valeurs: [`${k.delai} jours`] },
            { libelle: "Ventes du quatrième trimestre (hors taxes)", valeurs: [eur(k.ventes)] },
            { libelle: "Taux de TVA du scénario", valeurs: [pct(k.taux)] },
          ],
        };
      },
      repere: () => "À rendre : la créance en plus au 31 décembre et la TVA qu'elle contient, la trésorerie perdue, et votre réponse.",
    },
    {
      id: "creance",
      type: "montants",
      titre: "La créance en plus",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return `Avec ${JOURS_DEMANDES} jours de plus, les ventes du quatrième trimestre à cette clientèle restent dues plus longtemps : calculez la créance en plus au 31 décembre (ventes TTC ${facteur(k)}), puis la TVA qu'elle contient.`;
      },
      champs: (c) => {
        const k = tvaAvanceePourLeClient(c);
        const ttc = (1 + k.taux).toLocaleString("fr-FR");
        return [
          { libelle: "Créance en plus au 31 décembre (TTC)", attendu: k.creanceEnPlus, calcul: `${eur(k.ventes)} × ${ttc} ${facteur(k)} = ${eur(k.creanceEnPlus)}`, tolerance: 2 },
          { libelle: "TVA contenue dans cette créance", attendu: k.tvaEnPlus, calcul: `${eur(k.ventes)} × ${pct(k.taux)} ${facteur(k)} = ${eur(k.tvaEnPlus)}`, tolerance: 2 },
        ];
      },
      explication: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return [
          `Ces ${eur(k.tvaEnPlus)} de TVA, l'arène les fait verser à l'État au trimestre qui suit la vente, que le client ait payé ou non : l'entreprise les avance pour ses clients.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année",
      notions: ["net_treasury", "vat_payable"],
      tableau: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return {
          titre: "Au 31 décembre",
          colonnes: ["Aujourd'hui", `À ${k.delai} jours`],
          lignes: [
            { libelle: "Trésorerie", valeurs: [eur(k.tresorerie), eur(k.tresorerieAvecLeDelai)] },
            { libelle: "Ce que la TVA laisse en trésorerie", valeurs: [eur(k.effetAujourdhui), "à calculer"] },
          ],
        };
      },
      question: () =>
        "Calculez la trésorerie perdue au 31 décembre, puis ce que la TVA laisserait encore en trésorerie avec le délai demandé (aujourd'hui, moins la TVA contenue dans la créance en plus).",
      champs: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return [
          { libelle: "Trésorerie perdue au 31 décembre", attendu: k.perte, calcul: `${eur(k.tresorerie)} − ${eur(k.tresorerieAvecLeDelai)} = ${eur(k.perte)}`, tolerance: 1 },
          {
            libelle: "Ce que la TVA laisserait en trésorerie",
            attendu: k.effetAvecLeDelai,
            calcul: `${eur(k.effetAujourdhui)} − ${eur(k.tvaEnPlus)} = ${eur(k.effetAvecLeDelai)}`,
            tolerance: 3,
          },
        ];
      },
      explication: (c) => {
        const k = tvaAvanceePourLeClient(c);
        const reste = k.perte - k.creanceEnPlus;
        return [
          Math.abs(reste) <= 2
            ? `La trésorerie perd ce que la créance gagne : ${eur(k.creanceEnPlus)}, dont ${eur(k.tvaEnPlus)} de TVA.`
            : k.decouvert
              ? `La trésorerie perd la créance en plus, ${eur(k.creanceEnPlus)}, et ${eur(reste)} de plus : avec moins d'argent en caisse, l'entreprise passe à découvert et paie des intérêts, qui baissent le résultat.`
              : `La trésorerie perd la créance en plus, ${eur(k.creanceEnPlus)}, et ${eur(reste)} de plus : l'année rejouée n'a pas exactement le même résultat.`,
          k.effetAvecLeDelai >= 0
            ? `La TVA laisserait encore ${eur(k.effetAvecLeDelai)} en trésorerie au 31 décembre : l'État et le fournisseur font toujours crédit à l'entreprise, mais moins.`
            : `La TVA retirerait alors ${eur(-k.effetAvecLeDelai)} de la trésorerie au 31 décembre : l'entreprise avancerait plus de TVA qu'on ne lui en laisse.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      notions: ["payment_terms", "vat_payable"],
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const k = tvaAvanceePourLeClient(c);
        return [
          {
            texte: `Ce délai coûte ${eur(k.perte)} de trésorerie, dont ${eur(k.tvaEnPlus)} de TVA avancée pour les clients`,
            juste: true,
            retour: `Oui : au 31 décembre, la trésorerie aurait ${eur(k.perte)} de moins. Sur la créance en plus, ${eur(k.tvaEnPlus)} sont de la TVA que l'entreprise a déjà versée à l'État, ou versera au trimestre suivant, sans l'avoir reçue de ses clients.`,
          },
          {
            texte: "Ce délai ne coûte que la TVA avancée : le montant hors taxes, lui, reste dans l'entreprise",
            juste: false,
            retour: `Non : c'est tout le montant TTC que le client paie plus tard, ${eur(k.creanceEnPlus)}. La TVA n'en est qu'une part, ${eur(k.tvaEnPlus)}.`,
          },
          {
            texte: "Ce délai ne coûte rien : l'entreprise ne reverse la TVA à l'État qu'une fois payée par le client",
            juste: false,
            retour: `Non : dans l'arène, la TVA d'une vente se verse au trimestre suivant, que le client ait payé ou non. Et la trésorerie perd ${eur(k.perte)} au 31 décembre.`,
          },
        ];
      },
    },
  ],
};
