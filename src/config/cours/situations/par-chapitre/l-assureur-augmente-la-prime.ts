import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { assurance, resultatDeLActivite } from "../../chapitres/s-assurer-contre-les-aleas";
import { rejouerAvec, surLAnnee } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « S'ASSURER CONTRE LES ALÉAS » : L'ASSUREUR AUGMENTE LA PRIME
 * (BTS GPME, gestion des risques, palier 3).
 *
 * L'assureur annonce une hausse de la prime au renouvellement. La gérante demande s'il faut
 * renouveler à ce prix, ou garder le risque. L'élève refait les calculs du chapitre sur la prime
 * augmentée (la prime de l'année, ce que l'arène en fait au résultat), cherche la prime au-delà de
 * laquelle une année de prime coûterait plus que le pire sinistre couvert, et rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre juge une prime donnée, le cas cherche jusqu'où
 * elle peut monter. La formule, l'espérance des sinistres et le pire sinistre sont ceux du
 * chapitre (`assurance`) ; l'année à la prime augmentée est la même année rejouée, la prime de la
 * formule changée dans le scénario (`rejouerAvec`).
 */

/** La hausse annoncée au renouvellement : un cinquième de la prime. Une hypothèse du cours. */
export const HAUSSE_DE_LA_PRIME = 0.2;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "renouveler" | "garder";

/** La prime augmentée, l'année rejouée à ce prix, et la prime au-delà de laquelle le pire coûte moins. */
export function primeAugmentee(c: Cas) {
  const a = assurance(c);
  const nouvellePrime = auCentime(a.formule.prime * (1 + HAUSSE_DE_LA_PRIME));
  const nouvellePrimeDeLAnnee = auCentime(nouvellePrime * a.trimestres);
  const rejouee = rejouerAvec(
    c.code,
    `assurance-${a.formule.code}-prime-augmentee`,
    (_t, d) => ({ ...d, insurance: a.formule.code }),
    (s) => ({
      ...s,
      insurance: s.insurance && {
        ...s.insurance,
        ...(s.insurance.formulas
          ? { formulas: s.insurance.formulas.map((f) => (f.code === a.formule.code ? { ...f, premiumPerRound: nouvellePrime } : f)) }
          : { premiumPerRound: nouvellePrime }),
      },
    }),
  );
  const resultatAugmente = resultatDeLActivite(rejouee);
  const primeMaximale = auCentime(a.pire.cout / a.trimestres);
  const verdict: Verdict = a.pire.cout > nouvellePrimeDeLAnnee ? "renouveler" : "garder";
  return {
    a,
    nouvellePrime,
    nouvellePrimeDeLAnnee,
    hausseDeLAnnee: auCentime(nouvellePrimeDeLAnnee - a.primeDeLAnnee),
    primePayee: surLAnnee(rejouee, (r) => r.insurance?.premium ?? 0),
    resultatAugmente,
    ecartAvecLaHausse: resultatAugmente - a.resultatSans,
    coutDeLaHausse: resultatAugmente - a.resultatAssure,
    primeMaximale,
    verdict,
  };
}

export const L_ASSUREUR_AUGMENTE_LA_PRIME: Situation = {
  code: "l-assureur-augmente-la-prime",
  parcours: "gpme",
  palier: 3,
  blocs: [],
  reprend: ["s-assurer-contre-les-aleas"],
  commanditaire: "La gérante",
  titre: "L'assureur augmente la prime",
  accroche:
    "Au renouvellement, l'assureur augmente la prime. La gérante veut savoir s'il faut renouveler à ce prix : ce que la hausse coûte, jusqu'où la prime peut monter, et la réponse à lui rendre.",
  objectifs: [
    "Calculer une prime augmentée, sur le trimestre et sur l'année",
    "Lire ce qu'une hausse de prime coûte au résultat",
    "Calculer la prime au-delà de laquelle mieux vaut garder le risque",
    "Répondre à la gérante, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      texte: (c) => {
        const p = primeAugmentee(c);
        return [
          `« L'assureur nous écrit : au renouvellement, la prime de la formule « ${p.a.formule.nom} » augmente de ${pct(HAUSSE_DE_LA_PRIME * 100)}. Avant de signer, dites-moi ce que cette hausse coûte à ${c.entreprise} sur l'année, jusqu'où la prime peut monter avant que l'assurance ne vaille plus la peine, et s'il faut renouveler. »`,
          "Pas de cours cette fois : vous avez le contrat, et les chiffres des sinistres que le chapitre a calculés. L'arène a rejoué l'année avec la prime augmentée.",
        ];
      },
      tableau: (c) => {
        const p = primeAugmentee(c);
        return {
          titre: `Le contrat ${dE(c.entreprise)}, au renouvellement`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Prime actuelle d'un trimestre, formule « ${p.a.formule.nom} »`, valeurs: [eur(p.a.formule.prime)] },
            { libelle: "Hausse annoncée", valeurs: [pct(HAUSSE_DE_LA_PRIME * 100)] },
            { libelle: "Trimestres dans l'année", valeurs: [String(p.a.trimestres)] },
            { libelle: "Espérance des sinistres couverts, sur l'année", valeurs: [eur(p.a.esperance)] },
            { libelle: `Sinistre couvert le plus lourd : « ${p.a.pire.nom} »`, valeurs: [eur(p.a.pire.cout)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la prime renouvelée et ce qu'elle coûte de plus, ce que l'arène en fait au résultat, la prime au-delà de laquelle mieux vaut garder le risque, et votre réponse.",
    },
    {
      id: "prime",
      type: "montants",
      titre: "La prime renouvelée",
      notions: ["fixed_costs"],
      question: () =>
        "Calculez la prime d'un trimestre après la hausse, la prime de l'année à ce prix, puis ce que l'année de prime coûte de plus qu'aujourd'hui.",
      champs: (c) => {
        const p = primeAugmentee(c);
        return [
          { libelle: "Prime d'un trimestre après la hausse", attendu: p.nouvellePrime, calcul: `${eur(p.a.formule.prime)} × (1 + ${pct(HAUSSE_DE_LA_PRIME * 100)}) = ${eur(p.nouvellePrime)}`, tolerance: 1 },
          { libelle: "Prime de l'année après la hausse", attendu: p.nouvellePrimeDeLAnnee, calcul: `${eur(p.nouvellePrime)} × ${p.a.trimestres} = ${eur(p.nouvellePrimeDeLAnnee)}`, tolerance: 1 },
          { libelle: "Hausse de la prime sur l'année", attendu: p.hausseDeLAnnee, calcul: `${eur(p.nouvellePrimeDeLAnnee)} − ${eur(p.a.primeDeLAnnee)} = ${eur(p.hausseDeLAnnee)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const p = primeAugmentee(c);
        return [`Renouvelée, la formule coûterait ${eur(p.nouvellePrimeDeLAnnee)} par an, ${eur(p.hausseDeLAnnee)} de plus. L'espérance des sinistres, elle, ne bouge pas : ${eur(p.a.esperance)} par an.`];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année",
      notions: ["fixed_costs", "income_statement"],
      tableau: (c) => {
        const p = primeAugmentee(c);
        return {
          titre: "L'année du cours, selon la prime",
          colonnes: ["Sans assurance", "Prime actuelle", "Prime augmentée"],
          lignes: [
            { libelle: "Prime payée sur l'année", valeurs: [eur(0), eur(p.a.primeDeLAnnee), eur(p.primePayee)] },
            { libelle: "Résultat de l'activité sur l'année", valeurs: [eur(p.a.resultatSans), eur(p.a.resultatAssure), eur(p.resultatAugmente)] },
          ],
        };
      },
      question: () =>
        "L'arène a rejoué l'année avec la prime augmentée, tout le reste identique. Calculez l'écart de résultat de l'activité par rapport à l'année sans assurance, puis ce que la hausse coûte au résultat par rapport à la prime actuelle.",
      champs: (c) => {
        const p = primeAugmentee(c);
        return [
          { libelle: "Écart de résultat, prime augmentée", attendu: p.ecartAvecLaHausse, calcul: `${eur(p.resultatAugmente)} − ${retranche(p.a.resultatSans)} = ${eur(p.ecartAvecLaHausse)}`, tolerance: 1 },
          { libelle: "Ce que la hausse coûte au résultat", attendu: p.coutDeLaHausse, calcul: `${eur(p.resultatAugmente)} − ${retranche(p.a.resultatAssure)} = ${eur(p.coutDeLaHausse)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const p = primeAugmentee(c);
        return [
          -p.coutDeLaHausse === p.hausseDeLAnnee && p.a.trimestresNeutralises === 0
            ? `La hausse retire au résultat exactement ce qu'elle ajoute à la prime, ${eur(p.hausseDeLAnnee)} : la prime est une charge fixe, et aucun aléa couvert n'est tombé dans l'année.`
            : `La hausse retire ${eur(-p.coutDeLaHausse)} au résultat, pour ${eur(p.hausseDeLAnnee)} de prime en plus.`,
        ];
      },
    },
    {
      id: "plafond",
      type: "montants",
      titre: "Jusqu'où la prime peut monter",
      notions: ["fixed_costs"],
      question: (c) => {
        const p = primeAugmentee(c);
        return `Au-delà de quelle prime d'un trimestre une année de prime coûterait-elle plus que le sinistre couvert le plus lourd (${eur(p.a.pire.cout)}) ? Calculez-la, au centime.`;
      },
      champs: (c) => {
        const p = primeAugmentee(c);
        return [{ libelle: "Prime maximale d'un trimestre", attendu: p.primeMaximale, calcul: `${eur(p.a.pire.cout)} ÷ ${p.a.trimestres} = ${eur(p.primeMaximale)}`, tolerance: 1 }];
      },
      explication: (c) => {
        const p = primeAugmentee(c);
        return [
          p.nouvellePrime < p.primeMaximale
            ? `La prime augmentée (${eur(p.nouvellePrime)}) reste sous ce plafond : une année de prime coûte encore moins que le pire sinistre.`
            : p.a.formule.prime < p.primeMaximale
              ? `La prime actuelle (${eur(p.a.formule.prime)}) était sous ce plafond ; la prime augmentée (${eur(p.nouvellePrime)}) le dépasse.`
              : `Même la prime actuelle (${eur(p.a.formule.prime)}) dépassait ce plafond : une année de prime coûtait déjà plus que le pire sinistre.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const p = primeAugmentee(c);
        return [
          {
            texte: "Renouveler : même augmentée, une année de prime coûte moins que le pire sinistre",
            juste: p.verdict === "renouveler",
            retour:
              p.verdict === "renouveler"
                ? `Oui : ${eur(p.nouvellePrimeDeLAnnee)} de prime par an, contre ${eur(p.a.pire.cout)} pour le pire sinistre couvert. La hausse coûte ${eur(p.hausseDeLAnnee)}, mais l'assurance protège encore d'un coup plus lourd qu'elle.`
                : `Non : à ${eur(p.nouvellePrimeDeLAnnee)} par an, une année de prime coûte plus que le pire sinistre couvert (${eur(p.a.pire.cout)}).`,
          },
          {
            texte: "Ne pas renouveler : augmentée, une année de prime dépasse le pire sinistre",
            juste: p.verdict === "garder",
            retour:
              p.verdict === "garder"
                ? `Oui : ${eur(p.nouvellePrimeDeLAnnee)} de prime par an, quand le pire sinistre couvert coûterait ${eur(p.a.pire.cout)}. ${c.entreprise} peut garder ce risque, pour moins cher, et le prévenir.`
                : `Non : le pire sinistre couvert (${eur(p.a.pire.cout)}) coûte encore plus qu'une année de prime augmentée (${eur(p.nouvellePrimeDeLAnnee)}).`,
          },
          {
            texte: "Ne pas renouveler : la prime augmentée dépasse de loin l'espérance des sinistres attendus",
            juste: false,
            retour: `Non : ${p.a.esperance < p.a.primeDeLAnnee ? `c'était déjà vrai avant la hausse (${eur(p.a.esperance)} d'espérance pour ${eur(p.a.primeDeLAnnee)} de prime)` : `l'espérance (${eur(p.a.esperance)}) n'est pas ce qui décide`}. Une assurance ne se juge pas sur la moyenne : on la prend contre un sinistre qu'on ne pourrait pas encaisser.`,
          },
        ];
      },
    },
  ],
};
