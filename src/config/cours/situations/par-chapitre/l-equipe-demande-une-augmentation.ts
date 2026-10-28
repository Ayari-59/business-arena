import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { anneeAuxSalaires, remuneration } from "../../chapitres/remuneration-et-motivation";
import { ECART_D_INDICE, rejouerLAnnee, vendues } from "../../ressources-humaines";
import type { Situation } from "../types";

/** « que » devant un nom, élidé devant une voyelle : qu'ATLAS CONSEIL. */
const que = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈÊ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);

/**
 * CAS PRATIQUE DU CHAPITRE « RÉMUNÉRATION ET MOTIVATION » : L'ÉQUIPE DEMANDE UNE AUGMENTATION
 * (Bac STMG, ressources humaines, palier 1).
 *
 * Les représentants du personnel demandent des salaires 10 % plus hauts toute l'année : une
 * équipe mieux payée, disent-ils, travaille mieux. La gérante veut savoir ce que la hausse
 * coûterait et ce qu'elle rapporterait. L'élève refait les calculs du chapitre dans l'autre sens :
 * le surcoût de masse salariale au lieu de l'économie, le gain de productivité au lieu de la
 * perte, puis ce que l'année rejouée en laisse au résultat.
 *
 * Le cas est neuf par sa question : le chapitre baisse les salaires, le cas les monte du même écart
 * (ECART_D_INDICE, « en plus ou en moins »). L'année aux salaires habituels est celle du chapitre
 * (`remuneration`) ; l'année aux salaires montés est la même année rejouée (`rejouerLAnnee`).
 * Le moteur ne fait démissionner personne au-dessus du seuil de démission : au salaire habituel,
 * l'équipe ne perd déjà aucun salarié, et la hausse n'en retient pas de plus.
 */

/** L'indice de salaire que demandent les représentants du personnel : l'écart du chapitre, en plus. */
export const INDICE_DEMANDE = 1 + ECART_D_INDICE;

/** L'écart demandé, en pourcentage, tel que la page l'écrit. */
const ecart = Math.round(ECART_D_INDICE * 100);

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const somme = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
/** Un montant qu'on retranche : entre parenthèses quand il est négatif. */
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));

export type Verdict = "rien-de-plus" | "pas-assez" | "se-paie";

/** La hausse demandée, rejouée toute l'année : son coût, la motivation, les ventes, le résultat. */
export function hausseDemandee(c: Cas) {
  const m = remuneration(c);
  const base = rejouerLAnnee(c.code, "base", () => undefined);
  // Les salaires montés, les embauches de l'année jouée gardées : seule la rémunération change.
  const hausse = anneeAuxSalaires(c.code, "salaires-montes", INDICE_DEMANDE);
  const surcoutDuTrimestre = Math.round(m.effectif * m.salaireTrimestriel * ECART_D_INDICE);
  const surcoutDeLAnnee = Math.round(somme(hausse.map((r) => r.hr!.headcount * m.salaireTrimestriel * ECART_D_INDICE)));
  const capaciteApres = Math.round(hausse[0]!.production.laborCapacity);
  const gainDeProductivite = Math.round((capaciteApres / m.capaciteAvant - 1) * 1000) / 10;
  const departsAvant = somme(base.map((r) => r.hr?.departed ?? 0));
  const departsApres = somme(hausse.map((r) => r.hr!.departed));
  const venduesApres = Math.round(somme(hausse.map(vendues)));
  const resultatApres = Math.round(somme(hausse.map((r) => r.incomeStatement.operatingIncome)));
  const venduesEnPlus = venduesApres - m.venduesAvant;
  const ecartDeResultat = resultatApres - m.resultatAvant;
  const verdict: Verdict = ecartDeResultat > 0 ? "se-paie" : venduesEnPlus > 0 ? "pas-assez" : "rien-de-plus";
  return {
    m,
    trimestres: hausse.length,
    surcoutDuTrimestre,
    surcoutDeLAnnee,
    /** L'effectif n'a bougé d'aucun trimestre : ni départ, ni embauche. */
    effectifFixe: hausse.every((r) => r.hr!.headcount === m.effectif),
    capaciteApres,
    gainDeProductivite,
    departsAvant,
    departsApres,
    venduesApres,
    venduesEnPlus,
    resultatApres,
    ecartDeResultat,
    verdict,
  };
}

export const L_EQUIPE_DEMANDE_UNE_AUGMENTATION: Situation = {
  code: "l-equipe-demande-une-augmentation",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["remuneration-et-motivation"],
  commanditaire: "La gérante",
  titre: "L'équipe demande une augmentation",
  accroche: `Les représentants du personnel demandent des salaires ${ecart} % plus hauts : une équipe mieux payée travaille mieux. Ce que la hausse coûte, ce qu'elle fait gagner en capacité, et ce qu'il en reste au résultat.`,
  objectifs: [
    "Calculer le surcoût d'une hausse de salaire, au trimestre et sur l'année",
    "Mesurer l'effet de la motivation sur la capacité de l'équipe",
    "Lire ce que la hausse change aux ventes et au résultat de l'année",
    "Répondre à la gérante, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      texte: (c) => [
        `« Les représentants du personnel demandent ${ecart} % de plus pour tous les salariés, toute l'année. Ils disent qu'une équipe mieux payée travaille mieux, et ${que(c.entreprise)} s'y retrouvera. Avant de leur répondre, je veux savoir ce que la hausse coûterait, ce qu'elle ferait gagner à l'équipe, et ce qu'il en resterait à notre résultat. »`,
        "Pas de cours cette fois : vous avez les chiffres de l'équipe, et les calculs sont ceux du chapitre, dans l'autre sens. L'arène a rejoué l'année avec les salaires demandés.",
      ],
      tableau: (c) => {
        const h = hausseDemandee(c);
        return {
          titre: `L'équipe ${dE(c.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Effectif", valeurs: [`${qte(h.m.effectif)} salariés`] },
            { libelle: "Coût d'un salarié par trimestre", valeurs: [eur(h.m.salaireTrimestriel)] },
            { libelle: "Hausse demandée, toute l'année", valeurs: [pct(ecart)] },
            { libelle: `Capacité de l'équipe au premier trimestre, aux salaires habituels (${c.unites})`, valeurs: [qte(h.m.capaciteAvant)] },
            { libelle: `Capacité de l'équipe au premier trimestre, aux salaires demandés (${c.unites})`, valeurs: [qte(h.capaciteApres)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le surcoût de la hausse au trimestre et sur l'année, le gain de productivité, ce que l'année rejouée en laisse aux ventes et au résultat, et votre réponse.",
    },
    {
      id: "cout",
      type: "montants",
      titre: "Le coût de la hausse, et la motivation",
      notions: ["payroll", "pay_and_motivation"],
      question: (c) => {
        const h = hausseDemandee(c);
        return `Calculez le surcoût de masse salariale du premier trimestre (${qte(h.m.effectif)} salariés × ${eur(h.m.salaireTrimestriel)} × ${ecart} %), puis celui de l'année, sur ${h.trimestres} trimestres. Calculez enfin le gain de productivité de l'équipe au premier trimestre, en pourcentage au dixième.`;
      },
      champs: (c) => {
        const h = hausseDemandee(c);
        return [
          { libelle: "Surcoût du premier trimestre", attendu: h.surcoutDuTrimestre, tolerance: 1, calcul: `${qte(h.m.effectif)} × ${eur(h.m.salaireTrimestriel)} × ${ecart} % = ${eur(h.surcoutDuTrimestre)}` },
          { libelle: "Surcoût de l'année", attendu: h.surcoutDeLAnnee, tolerance: 1, calcul:
              h.effectifFixe
                ? `${eur(h.surcoutDuTrimestre)} × ${h.trimestres} = ${eur(h.surcoutDeLAnnee)} (personne ne part : l'effectif ne bouge pas)`
                : `la somme, trimestre par trimestre, de l'effectif × ${eur(h.m.salaireTrimestriel)} × ${ecart} % = ${eur(h.surcoutDeLAnnee)}` },
          { libelle: "Gain de productivité (%)", attendu: h.gainDeProductivite, tolerance: 0.1, calcul: `(${qte(h.capaciteApres)} − ${qte(h.m.capaciteAvant)}) ÷ ${qte(h.m.capaciteAvant)} × 100 = ${pct(h.gainDeProductivite)}` },
        ];
      },
      explication: (c) => {
        const h = hausseDemandee(c);
        return [
          `Les représentants ont raison sur un point : mieux payée, l'équipe ${dE(c.entreprise)} gagne ${pct(h.gainDeProductivite)} de capacité dès le premier trimestre. Mais la hausse coûte ${eur(h.surcoutDeLAnnee)} sur l'année, et ce gain ne rapporte que s'il trouve des clients.`,
        ];
      },
    },
    {
      id: "annee",
      type: "montants",
      titre: "L'arène rejoue l'année",
      notions: ["pay_and_motivation", "capacity"],
      tableau: (c) => {
        const h = hausseDemandee(c);
        return {
          titre: "L'année jouée, salaires habituels et salaires demandés",
          colonnes: ["Habituels", "Demandés"],
          lignes: [
            { libelle: "Démissions dans l'année", valeurs: [String(h.departsAvant), String(h.departsApres)] },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(h.m.venduesAvant), qte(h.venduesApres)] },
            { libelle: "Résultat de l'activité sur l'année", valeurs: [eur(h.m.resultatAvant), eur(h.resultatApres)] },
          ],
        };
      },
      question: (c) => `Calculez les ventes en plus sur l'année avec les salaires demandés (en ${c.unites}), et l'écart de résultat de l'activité.`,
      champs: (c) => {
        const h = hausseDemandee(c);
        return [
          { libelle: `Ventes en plus (${c.unites})`, attendu: h.venduesEnPlus, tolerance: 1, calcul: `${qte(h.venduesApres)} − ${qte(h.m.venduesAvant)} = ${qte(h.venduesEnPlus)}` },
          { libelle: "Écart de résultat", attendu: h.ecartDeResultat, tolerance: 1, calcul: `${eur(h.resultatApres)} − ${retranche(h.m.resultatAvant)} = ${eur(h.ecartDeResultat)}` },
        ];
      },
      explication: (c) => {
        const h = hausseDemandee(c);
        return [
          h.venduesEnPlus > 0
            ? `La capacité gagnée a fait vendre ${qte(h.venduesEnPlus)} ${c.unites} de plus : certains trimestres, le travail manquait vraiment.`
            : `La capacité gagnée n'a pas fait vendre une unité de plus : l'équipe avait déjà de la marge, ce n'est pas le travail qui limitait les ventes.${h.departsAvant === 0 ? " Et aux salaires habituels, personne ne démissionnait : la hausse ne retient aucun salarié de plus." : ""}`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const h = hausseDemandee(c);
        return [
          {
            texte: "La hausse ne se paie pas : l'équipe ne manquait pas de capacité",
            juste: h.verdict === "rien-de-plus",
            retour:
              h.verdict === "rien-de-plus"
                ? `Oui : l'équipe gagne ${pct(h.gainDeProductivite)} de capacité, mais l'arène ne vend rien de plus, et le résultat baisse de ${eur(-h.ecartDeResultat)}${Math.abs(h.ecartDeResultat + h.surcoutDeLAnnee) <= 1 ? ", tout le surcoût de l'année" : ""}. Une hausse de salaire peut se décider pour d'autres raisons ; elle ne se finance pas ici par les ventes.`
                : `Non : la capacité gagnée a fait vendre ${qte(h.venduesEnPlus)} ${c.unites} de plus.`,
          },
          {
            texte: "Elle fait vendre davantage, mais pas assez pour couvrir son coût",
            juste: h.verdict === "pas-assez",
            retour:
              h.verdict === "pas-assez"
                ? `Oui : ${qte(h.venduesEnPlus)} ${c.unites} de plus, mais le résultat baisse de ${eur(-h.ecartDeResultat)}. La marge de ces ventes ne couvre pas les ${eur(h.surcoutDeLAnnee)} de salaires en plus.`
                : h.verdict === "se-paie"
                  ? "Non : les ventes en plus couvrent son coût, et le résultat monte."
                  : "Non : elle ne fait rien vendre de plus.",
          },
          {
            texte: "Elle se paie : l'équipe, plus motivée, vend de quoi la couvrir",
            juste: h.verdict === "se-paie",
            retour:
              h.verdict === "se-paie"
                ? `Oui : le résultat monte de ${eur(h.ecartDeResultat)}. L'équipe limitait les ventes, et la motivation les a débloquées.`
                : `Non : le résultat baisse de ${eur(-h.ecartDeResultat)}. ${h.venduesEnPlus > 0 ? `Les ${qte(h.venduesEnPlus)} ${c.unites} vendues en plus ne couvrent pas les ${eur(h.surcoutDeLAnnee)} de salaires en plus.` : "Aucune vente de plus ne vient couvrir son coût."}`,
          },
          {
            texte: `Elle se paie en retenant des salariés qui seraient partis dans l'année`,
            juste: false,
            retour:
              h.departsAvant === 0
                ? `Non : aux salaires habituels, aucun salarié ${dE(c.entreprise)} ne démissionne dans l'année rejouée. Dans l'arène, un salarié ne démissionne que sous le seuil de démission : la hausse ne retient personne.`
                : `Non : la hausse ne change les départs que de ${qte(h.departsAvant - h.departsApres)}, et le résultat ${h.ecartDeResultat > 0 ? "monte" : "baisse"} de ${eur(Math.abs(h.ecartDeResultat))}.`,
          },
        ];
      },
    },
  ],
};
