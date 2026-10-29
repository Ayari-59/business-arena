import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { masseSalariale } from "../../chapitres/effectif-et-masse-salariale";
import { salaire } from "../../chapitres/salaire-brut-net-cout";
import { ENTREPRISES_DES_RESSOURCES_HUMAINES } from "../../monde/ressources-humaines-de-nova";
import type { Situation } from "../types";

/** « que » devant un nom, élidé devant une voyelle : qu'ATLAS CONSEIL. */
const que = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈÊ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);

/**
 * CAS PRATIQUE DU CHAPITRE « DU SALAIRE BRUT AU COÛT POUR L'ENTREPRISE » : LA PRIME DE FIN
 * D'ANNÉE (Bac STMG, ressources humaines, palier 1).
 *
 * La direction veut remercier l'équipe : elle consacre une part de ses ventes à une prime
 * de fin d'année, et cette enveloppe est tout ce qu'elle veut dépenser, cotisations
 * comprises. Elle demande ce que chaque salarié touchera vraiment. L'élève refait le chemin
 * du chapitre dans l'autre sens : du coût pour l'entreprise au brut, puis du brut au net,
 * avec les mêmes taux de cotisations.
 *
 * Le cas est neuf par sa question : le chapitre part du brut pour trouver le net et le
 * coût, le cas part du coût que l'entreprise accepte de payer pour trouver le brut et le
 * net. Les taux et l'effectif sont ceux du chapitre (`salaire`) ; les ventes de l'année,
 * celles du premier exercice de NOVA (`masseSalariale`, comptes-du-lycee.ts), dans le monde du cours.
 *
 * CE QUI A CHANGÉ. Le cas lisait les ventes de l'année de l'arène, dans chaque entreprise ; il se joue
 * chez NOVA : 13 902,76 € d'enveloppe, 3 475,69 € par opérateur, 1 909,18 € nets.
 */

/**
 * L'enveloppe de la prime : 1 % des ventes de l'année, cotisations patronales comprises.
 * Une part modeste, qu'une entreprise peut consacrer à remercier son équipe sans se mettre
 * en difficulté, et qui donne une prime de quelques centaines à quelques milliers
 * d'euros par salarié selon l'entreprise.
 */
export const PART_DES_VENTES_EN_PRIME = 0.01;

const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function primeDeFinDAnnee(c: Cas) {
  const s = salaire(c);
  const ventes = masseSalariale(c).ventes;
  const enveloppe = auCentime(ventes * PART_DES_VENTES_EN_PRIME);
  const parSalarie = auCentime(enveloppe / s.effectif);
  // Le coût est le brut augmenté des cotisations patronales : le brut s'en déduit par division.
  const brut = auCentime(parSalarie / (1 + s.tauxPatronal));
  const patronales = auCentime(parSalarie - brut);
  const salariales = auCentime(brut * s.tauxSalarial);
  const net = auCentime(brut - salariales);
  return {
    s,
    ventes,
    enveloppe,
    parSalarie,
    brut,
    patronales,
    salariales,
    net,
    netPour100: auCentime((net / parSalarie) * 100),
    // Les erreurs classiques : verser le coût en net, oublier les cotisations patronales,
    // ou les calculer sur le coût au lieu du brut.
    sansAucuneCotisation: parSalarie,
    sansLesPatronales: auCentime(parSalarie * (1 - s.tauxSalarial)),
    patronalesSurLeCout: auCentime(parSalarie * (1 - s.tauxPatronal) * (1 - s.tauxSalarial)),
  };
}

export const LA_PRIME_DE_FIN_D_ANNEE: Situation = {
  code: "la-prime-de-fin-d-annee",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["salaire-brut-net-cout"],
  commanditaire: "La direction",
  titre: "La prime de fin d'année",
  accroche:
    "La direction consacre 1 % de ses ventes à une prime de fin d'année, cotisations comprises. Ce que chaque salarié touchera vraiment, en partant de ce que l'entreprise paie.",
  objectifs: [
    "Calculer une enveloppe et sa part par salarié",
    "Retrouver le salaire brut à partir du coût pour l'entreprise",
    "Calculer les cotisations salariales et le net",
    "Répondre à la direction, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_RESSOURCES_HUMAINES,
    pourquoi: "le cas reprend la paie de NOVA, celle du chapitre, et les ventes de son premier exercice.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => [
        `« Pour remercier l'équipe de son année, je veux consacrer ${pct(PART_DES_VENTES_EN_PRIME)} de nos ventes à une prime de fin d'année, la même pour chacun. C'est tout ce ${que(c.entreprise)} dépensera, cotisations comprises. Avant de l'annoncer, dites-moi ce que chaque salarié touchera vraiment sur son compte. »`,
        "Pas de cours cette fois : vous avez les chiffres, et les taux sont ceux du chapitre. Le chemin, lui, se fait dans l'autre sens : vous partez du coût.",
      ],
      tableau: (c) => {
        const r = primeDeFinDAnnee(c);
        return {
          titre: `Les ventes et la paie · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Ventes de l'année", valeurs: [eur(r.ventes)] },
            { libelle: "Part des ventes consacrée à la prime, cotisations comprises", valeurs: [pct(PART_DES_VENTES_EN_PRIME)] },
            { libelle: "Effectif", valeurs: [`${qte(r.s.effectif)} salariés`] },
            { libelle: "Taux des cotisations patronales (sur le brut)", valeurs: [pct(r.s.tauxPatronal)] },
            { libelle: "Taux des cotisations salariales (sur le brut)", valeurs: [pct(r.s.tauxSalarial)] },
          ],
        };
      },
      repere: () =>
        "À rendre : l'enveloppe et sa part par salarié, le brut de la prime et ses cotisations patronales, ses cotisations salariales et le net, et votre réponse.",
    },
    {
      id: "enveloppe",
      type: "montants",
      titre: "L'enveloppe de la prime",
      notions: ["payroll", "pay_and_motivation"],
      question: () =>
        "Calculez l'enveloppe de la prime, puis ce qu'elle représente pour un salarié, au centime : c'est ce que la prime de chacun coûtera à l'entreprise.",
      champs: (c) => {
        const r = primeDeFinDAnnee(c);
        return [
          { libelle: "Enveloppe de la prime", attendu: r.enveloppe, tolerance: 0.01, calcul: `${eur(r.ventes)} × ${pct(PART_DES_VENTES_EN_PRIME)} = ${eur(r.enveloppe)}` },
          { libelle: "Coût de la prime d'un salarié", attendu: r.parSalarie, tolerance: 0.01, calcul: `${eur(r.enveloppe)} ÷ ${qte(r.s.effectif)} = ${eur(r.parSalarie)}` },
        ];
      },
      explication: (c) => {
        const r = primeDeFinDAnnee(c);
        return [
          `${c.entreprise} accepte de dépenser ${eur(r.parSalarie)} pour la prime de chaque salarié. Ce n'est pas ce qu'il recevra : ce montant doit payer le brut et les cotisations patronales qui s'y ajoutent.`,
        ];
      },
    },
    {
      id: "brut",
      type: "montants",
      titre: "Du coût au brut",
      notions: ["payroll"],
      question: (c) => {
        const r = primeDeFinDAnnee(c);
        return `Le coût est le brut plus ${pct(r.s.tauxPatronal)} de cotisations patronales, soit le brut × (1 + ${pct(r.s.tauxPatronal)}). Retrouvez le brut de la prime d'un salarié, puis les cotisations patronales.`;
      },
      champs: (c) => {
        const r = primeDeFinDAnnee(c);
        return [
          { libelle: "Brut de la prime", attendu: r.brut, tolerance: 0.02, calcul: `${eur(r.parSalarie)} ÷ (1 + ${pct(r.s.tauxPatronal)}) = ${eur(r.brut)}` },
          { libelle: "Cotisations patronales", attendu: r.patronales, tolerance: 0.02, calcul: `${eur(r.parSalarie)} − ${eur(r.brut)} = ${eur(r.patronales)}, soit ${eur(r.brut)} × ${pct(r.s.tauxPatronal)}` },
        ];
      },
      explication: (c) => {
        const r = primeDeFinDAnnee(c);
        return [
          `Pour que la prime coûte ${eur(r.parSalarie)}, son brut ne peut être que de ${eur(r.brut)} : les ${eur(r.patronales)} de cotisations patronales se calculent sur le brut et s'y ajoutent.`,
        ];
      },
    },
    {
      id: "net",
      type: "montants",
      titre: "Ce que reçoit le salarié",
      notions: ["payroll", "pay_and_motivation"],
      question: (c) => {
        const r = primeDeFinDAnnee(c);
        return `Sur ce brut, calculez les cotisations salariales (${pct(r.s.tauxSalarial)} du brut), la prime nette que reçoit le salarié, puis ce qu'il reçoit pour 100 € dépensés par l'entreprise (net ÷ coût × 100, au centime).`;
      },
      champs: (c) => {
        const r = primeDeFinDAnnee(c);
        return [
          { libelle: "Cotisations salariales", attendu: r.salariales, tolerance: 0.02, calcul: `${eur(r.brut)} × ${pct(r.s.tauxSalarial)} = ${eur(r.salariales)}` },
          { libelle: "Prime nette", attendu: r.net, tolerance: 0.03, calcul: `${eur(r.brut)} − ${eur(r.salariales)} = ${eur(r.net)}` },
          { libelle: "Net pour 100 € de coût", attendu: r.netPour100, tolerance: 0.05, calcul: `${eur(r.net)} ÷ ${eur(r.parSalarie)} × 100 = ${eur(r.netPour100)}` },
        ];
      },
      explication: (c) => {
        const r = primeDeFinDAnnee(c);
        return [
          `Chaque salarié ${dE(c.entreprise)} recevra ${eur(r.net)} net, pour ${eur(r.parSalarie)} dépensés par l'entreprise : sur 100 € de prime payés, ${eur(r.netPour100)} arrivent sur son compte. Le reste finance sa protection sociale et sa retraite.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = primeDeFinDAnnee(c);
        const phrase = (x: number) => `Chaque salarié recevra ${eur(x)} net de prime`;
        // Les quatre montants dans l'ordre croissant, comme on les lirait sur une copie.
        const options = [
          {
            x: r.net,
            texte: phrase(r.net),
            juste: true,
            retour: `Oui : ${eur(r.parSalarie)} de coût ÷ (1 + ${pct(r.s.tauxPatronal)}) donnent ${eur(r.brut)} de brut, et ${eur(r.brut)} moins ${pct(r.s.tauxSalarial)} de cotisations salariales laissent ${eur(r.net)} net.`,
          },
          {
            x: r.sansAucuneCotisation,
            texte: phrase(r.sansAucuneCotisation),
            juste: false,
            retour: `Non : ${eur(r.parSalarie)} est ce que la prime coûte à l'entreprise. Il faut en retirer les cotisations patronales, puis les cotisations salariales : il reste ${eur(r.net)}.`,
          },
          {
            x: r.sansLesPatronales,
            texte: phrase(r.sansLesPatronales),
            juste: false,
            retour: `Non : c'est traiter le coût comme un brut, en oubliant les cotisations patronales. Le brut n'est que de ${eur(r.brut)}, et le net de ${eur(r.net)}.`,
          },
          {
            x: r.patronalesSurLeCout,
            texte: phrase(r.patronalesSurLeCout),
            juste: false,
            retour: `Non : c'est retirer ${pct(r.s.tauxPatronal)} du coût, alors que les cotisations patronales se calculent sur le brut. Le brut se retrouve en divisant le coût par (1 + ${pct(r.s.tauxPatronal)}) : ${eur(r.brut)}, et le net est de ${eur(r.net)}.`,
          },
        ];
        return options.sort((a, b) => a.x - b.x).map(({ x: _x, ...o }) => o);
      },
    },
  ],
};
