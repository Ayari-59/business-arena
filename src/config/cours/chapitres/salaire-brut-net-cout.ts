import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { HAUSSE_DU_NET } from "../ressources-humaines";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : DU SALAIRE BRUT AU COÛT POUR L'ENTREPRISE (Bac STMG, ressources humaines,
 * palier 1).
 *
 * Trois montants pour un même salaire : le brut, que le contrat fixe ; le net, que le salarié
 * reçoit, une fois retenues ses cotisations ; le coût, que l'entreprise paie, cotisations
 * patronales comprises. Le chapitre les calcule pour un salarié de l'entreprise, puis mesure ce
 * que coûte vraiment une augmentation du net.
 *
 * La paie est celle du cas (`cas.personnel`, la paie de janvier de l'équipe, tirée du coût que
 * l'arène donne au personnel) ; les taux de cotisations sont ceux du cours (`TAUX_SALARIAL`,
 * `TAUX_PATRONAL`, documentés dans cas.ts : des ordres de grandeur d'un salarié non cadre, avant
 * allègements) ; la hausse demandée est posée dans ressources-humaines.ts (HAUSSE_DU_NET).
 * Le chapitre « La paie » du parcours de comptabilité détaille chaque ligne du bulletin et le
 * prélèvement à la source ; celui-ci s'arrête au net avant impôt, et le dit.
 */

const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;


/** La paie d'un salarié en janvier, et ce que coûte une hausse de son net. */
export function salaire(c: Cas) {
  const p = c.personnel;
  const brut = auCentime(p.brut / p.effectif);
  const salariales = auCentime(brut * p.tauxSalarial);
  const net = auCentime(brut - salariales);
  const patronales = auCentime(brut * p.tauxPatronal);
  const cout = auCentime(brut + patronales);
  // Pour que le net monte de 100 €, le brut doit monter de 100 ÷ (1 − taux salarial), et le coût
  // de ce brut × (1 + taux patronal).
  const hausseDuBrut = auCentime(HAUSSE_DU_NET / (1 - p.tauxSalarial));
  const hausseDuCout = auCentime(hausseDuBrut * (1 + p.tauxPatronal));
  return {
    effectif: p.effectif,
    brutDeLEquipe: p.brut,
    tauxSalarial: p.tauxSalarial,
    tauxPatronal: p.tauxPatronal,
    brut,
    salariales,
    net,
    patronales,
    cout,
    coutPour100DeNet: auCentime((cout / net) * 100),
    hausseDuNet: HAUSSE_DU_NET,
    hausseDuBrut,
    hausseDuCout,
  };
}

export const SALAIRE_BRUT_NET_COUT: Chapitre = {
  code: "salaire-brut-net-cout",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
    "Bac pro AGORA Bloc 3 · Administrer le personnel",
    "BTS SAM Bloc 3 · Collaboration à la gestion des ressources humaines",
    "BUT GACO · Participer au pilotage RH de l'organisation",
  ],
  titre: "Du salaire brut au coût pour l'entreprise",
  accroche:
    "Un même salaire, trois montants : le brut du contrat, le net que reçoit le salarié, le coût que paie l'entreprise. Et ce que coûte vraiment une augmentation de 100 € net.",
  objectifs: [
    "Distinguer salaire brut, salaire net et coût employeur",
    "Calculer les cotisations salariales et le salaire net",
    "Calculer les cotisations patronales et le coût pour l'entreprise",
    "Mesurer ce que coûte une augmentation du salaire net",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois montants pour un salaire",
      notions: ["payroll"],
      texte: (c) => {
        const s = salaire(c);
        return [
          `En janvier, ${c.entreprise} verse ${eur(s.brutDeLEquipe)} de salaires bruts à ses ${s.effectif} salariés. Le brut est le salaire du contrat ; ce n'est ni ce que le salarié reçoit, ni ce que l'entreprise paie.`,
          `Sur le brut, des cotisations salariales sont retenues (${pct(s.tauxSalarial)} du brut, ici) : elles financent la sécurité sociale, le chômage et la retraite du salarié. Ce qui reste est le salaire net. L'entreprise, elle, paie en plus des cotisations patronales (${pct(s.tauxPatronal)} du brut) : le brut et ces cotisations font le coût du salarié.`,
          "Ces taux sont des ordres de grandeur pour un salarié non cadre du secteur privé ; le salaire net s'entend ici avant l'impôt sur le revenu, que l'entreprise prélève à la source pour l'État.",
        ];
      },
      repere: () => "Net = brut − cotisations salariales. Coût pour l'entreprise = brut + cotisations patronales.",
    },
    {
      id: "net",
      type: "montants",
      titre: "Ce que reçoit le salarié",
      notions: ["payroll"],
      question: (c) => {
        const s = salaire(c);
        return `Tous les salariés ${dE(c.entreprise)} ont le même salaire. Calculez le salaire brut d'un salarié en janvier (${eur(s.brutDeLEquipe)} pour ${s.effectif} salariés), ses cotisations salariales (${pct(s.tauxSalarial)} du brut), puis son salaire net.`;
      },
      champs: (c) => {
        const s = salaire(c);
        return [
          { libelle: "Salaire brut d'un salarié", attendu: s.brut, calcul: `${eur(s.brutDeLEquipe)} ÷ ${s.effectif} = ${eur(s.brut)}`, tolerance: 1 },
          { libelle: "Cotisations salariales", attendu: s.salariales, calcul: `${eur(s.brut)} × ${pct(s.tauxSalarial)} = ${eur(s.salariales)}`, tolerance: 1 },
          { libelle: "Salaire net", attendu: s.net, calcul: `${eur(s.brut)} − ${eur(s.salariales)} = ${eur(s.net)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const s = salaire(c);
        return [`Sur un brut de ${eur(s.brut)}, le salarié reçoit ${eur(s.net)}. Les ${eur(s.salariales)} retenus ne sont pas perdus pour lui : ils financent sa protection sociale et sa future retraite.`];
      },
    },
    {
      id: "cout",
      type: "montants",
      titre: "Ce que paie l'entreprise",
      notions: ["payroll"],
      question: (c) => {
        const s = salaire(c);
        return `Calculez les cotisations patronales sur ce salaire (${pct(s.tauxPatronal)} du brut), le coût du salarié pour l'entreprise, puis ce que l'entreprise paie pour 100 € de salaire net (coût ÷ net × 100, au centime).`;
      },
      champs: (c) => {
        const s = salaire(c);
        return [
          { libelle: "Cotisations patronales", attendu: s.patronales, calcul: `${eur(s.brut)} × ${pct(s.tauxPatronal)} = ${eur(s.patronales)}`, tolerance: 1 },
          { libelle: "Coût pour l'entreprise", attendu: s.cout, calcul: `${eur(s.brut)} + ${eur(s.patronales)} = ${eur(s.cout)}`, tolerance: 1 },
          { libelle: "Coût pour 100 € de net", attendu: s.coutPour100DeNet, calcul: `${eur(s.cout)} ÷ ${eur(s.net)} × 100 = ${eur(s.coutPour100DeNet)}`, tolerance: 0.5 },
        ];
      },
      explication: (c) => {
        const s = salaire(c);
        return [
          `Pour que son salarié reçoive ${eur(s.net)}, ${c.entreprise} paie ${eur(s.cout)} : pour 100 € de net, elle en débourse ${eur(s.coutPour100DeNet)}. L'écart, ce sont les cotisations sociales : c'est pourquoi le coût du travail dépasse de loin le salaire que reçoit le salarié.`,
        ];
      },
    },
    {
      id: "augmentation",
      type: "choix",
      titre: "Une augmentation de 100 € net",
      notions: ["payroll", "pay_and_motivation"],
      question: (c) =>
        `Un salarié ${dE(c.entreprise)} demande une augmentation de ${eur(HAUSSE_DU_NET)} net par mois. Combien coûterait-elle de plus à l'entreprise, chaque mois ?`,
      options: (c) => {
        const s = salaire(c);
        return [
          {
            texte: `Environ ${eur(Math.round(s.hausseDuCout))}`,
            juste: true,
            retour: `Oui : pour ${eur(s.hausseDuNet)} de net en plus, le brut doit monter de ${eur(s.hausseDuNet)} ÷ (1 − ${pct(s.tauxSalarial)}) = ${eur(s.hausseDuBrut)}, et l'entreprise paie en plus ses cotisations sur ce brut : ${eur(s.hausseDuBrut)} × (1 + ${pct(s.tauxPatronal)}) = ${eur(s.hausseDuCout)}.`,
          },
          {
            texte: `${eur(s.hausseDuNet)}`,
            juste: false,
            retour: `Non : ${eur(s.hausseDuNet)} est ce que le salarié recevrait de plus. Pour les lui verser, il faut monter son brut davantage, et payer les cotisations patronales en plus : ${eur(s.hausseDuCout)} en tout.`,
          },
          {
            texte: `Environ ${eur(Math.round(s.hausseDuNet * (1 + s.tauxPatronal)))}`,
            juste: false,
            retour: `Non : c'est oublier les cotisations salariales. Le brut doit d'abord monter de ${eur(s.hausseDuBrut)} pour que le net monte de ${eur(s.hausseDuNet)} ; les cotisations patronales s'ajoutent à ce brut-là : ${eur(s.hausseDuCout)} en tout.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payroll"],
      texte: (c) => {
        const s = salaire(c);
        return [
          `Chez ${c.entreprise}, un salarié payé ${eur(s.brut)} brut reçoit ${eur(s.net)} net et coûte ${eur(s.cout)} à l'entreprise. Une augmentation de ${eur(s.hausseDuNet)} net coûte ${eur(s.hausseDuCout)} à l'entreprise.`,
          "Négocier un salaire, c'est donc parler de trois montants à la fois : le salarié pense au net, le contrat écrit le brut, et l'entreprise décide sur le coût.",
        ];
      },
      repere: () => "Hausse du coût = hausse du net ÷ (1 − taux salarial) × (1 + taux patronal).",
    },
  ],
};
