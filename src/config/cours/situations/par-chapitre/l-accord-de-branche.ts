import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { equipe } from "../../chapitres/equipe-et-planning";
import { COMMERCES } from "../../chapitres/taux-de-marque";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'ÉQUIPE ET SON PLANNING » : L'ACCORD DE BRANCHE (BTS MCO,
 * palier 4).
 *
 * Un accord de branche revalorise les salaires. La direction veut savoir ce que coûtera
 * l'heure de l'équipe, ce que pèsera le personnel dans le chiffre d'affaires, et combien il
 * faudra vendre en plus pour que la hausse ne coûte rien au résultat. L'élève refait seul
 * les calculs du chapitre (heures payées, coût horaire chargé, part du personnel, chiffre
 * d'affaires qui paie une charge fixe), avec la paie revalorisée.
 *
 * Le cas est neuf par sa question : le chapitre chiffre ce qu'une embauche doit rapporter ;
 * ici, l'équipe ne change pas, c'est son coût qui monte. Le piège : la hausse ne se paie ni
 * avec autant de ventes qu'elle coûte, ni avec le même pourcentage de chiffre d'affaires,
 * mais avec la marge des ventes en plus. L'équipe et le taux de marge sont ceux du chapitre
 * (`equipe`).
 */

/**
 * La revalorisation des salaires : 3 %. C'est l'ordre de grandeur d'une hausse annuelle des
 * minima d'une branche du commerce. Les cotisations se calculant sur le brut, le coût
 * chargé de l'équipe monte du même pourcentage.
 */
export const HAUSSE_DES_SALAIRES = 0.03;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const heures = (h: number) => `${h.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} h`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function accordDeBranche(c: Cas) {
  const e = equipe(c);
  const ca = c.gestion.chiffreDAffaires;
  const coutApres = auCentime(e.cout * (1 + HAUSSE_DES_SALAIRES));
  const hausse = auCentime(coutApres - e.cout);
  const caEnPlus = Math.ceil(hausse / (e.tauxMcv / 100) - 1e-9);
  return {
    ...e,
    ca,
    coutApres,
    hausse,
    coutHoraireApres: auCentime(coutApres / e.heuresPayees),
    partApres: auDixieme((coutApres / ca) * 100),
    caEnPlus,
    partDuChiffre: auDixieme((caEnPlus / ca) * 100),
    // L'erreur classique : relever le chiffre d'affaires du même pourcentage que les salaires.
    caDuMemePourcentage: Math.round(ca * HAUSSE_DES_SALAIRES),
    margeDuMemePourcentage: Math.round(ca * HAUSSE_DES_SALAIRES * (e.tauxMcv / 100)),
  };
}

export const L_ACCORD_DE_BRANCHE: Situation = {
  code: "l-accord-de-branche",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["equipe-et-planning"],
  commanditaire: "La direction",
  titre: "L'accord de branche",
  accroche:
    "Un accord de branche revalorise les salaires. La direction veut savoir ce que coûtera l'heure de l'équipe, et combien il faudra vendre en plus pour la payer.",
  objectifs: [
    "Calculer les heures payées, le coût horaire chargé et la part du personnel",
    "Chiffrer une revalorisation des salaires sur le coût de l'équipe",
    "Calculer le chiffre d'affaires supplémentaire qui paie la hausse",
    "Répondre à la direction en raisonnant sur la marge",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce cas suit l'équipe d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => [
        `« L'accord de branche revalorise les salaires de ${pct(HAUSSE_DES_SALAIRES * 100)} au 1er du mois prochain ; les cotisations suivent. Avant de l'appliquer, je veux savoir ce que coûtera une heure de l'équipe de ${c.entreprise}, ce que pèsera le personnel dans notre chiffre d'affaires, et combien il faudra vendre en plus chaque mois pour que la hausse ne coûte rien au résultat. »`,
        "Pas de cours cette fois : vous avez la paie et les ventes du mois, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const r = accordDeBranche(c);
        return {
          titre: `L'équipe et le mois · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Salariés", valeurs: [qte(r.effectif)] },
            { libelle: "Heures payées par salarié et par mois", valeurs: [heures(r.heuresParSalarie)] },
            { libelle: "Coût du personnel du mois, cotisations patronales comprises", valeurs: [eur(r.cout)] },
            { libelle: "Chiffre d'affaires du mois, hors taxes", valeurs: [eur(r.ca)] },
            { libelle: "Taux de marge sur coût variable", valeurs: [pct(r.tauxMcv)] },
            { libelle: "Revalorisation des salaires", valeurs: [pct(HAUSSE_DES_SALAIRES * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le coût horaire et la part du personnel avant et après la hausse, le coût de la hausse, le chiffre d'affaires qui la paie, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "L'équipe aujourd'hui",
      notions: ["productivity", "payroll"],
      question: () =>
        "Calculez les heures payées du mois (au centième), le coût horaire chargé de l'équipe (au centime), puis la part du personnel dans le chiffre d'affaires, en pourcentage, au dixième.",
      champs: (c) => {
        const r = accordDeBranche(c);
        return [
          { libelle: "Heures payées du mois", attendu: r.heuresPayees, tolerance: 0.05, calcul: `${qte(r.effectif)} × ${heures(r.heuresParSalarie)} = ${heures(r.heuresPayees)}` },
          { libelle: "Coût horaire chargé", attendu: r.coutHoraire, tolerance: 0.02, calcul: `${eur(r.cout)} ÷ ${heures(r.heuresPayees)} = ${eur(r.coutHoraire)}` },
          { libelle: "Part du personnel (%)", attendu: r.partDuPersonnel, tolerance: 0.1, calcul: `${eur(r.cout)} ÷ ${eur(r.ca)} × 100 = ${pct(r.partDuPersonnel)}` },
        ];
      },
      explication: (c) => {
        const r = accordDeBranche(c);
        return [`Aujourd'hui, une heure de l'équipe de ${c.entreprise} coûte ${eur(r.coutHoraire)}, et le personnel pèse ${pct(r.partDuPersonnel)} du chiffre d'affaires.`];
      },
    },
    {
      id: "apres-la-hausse",
      type: "montants",
      titre: "Après la hausse",
      notions: ["payroll", "fixed_costs"],
      question: () =>
        `Avec ${pct(HAUSSE_DES_SALAIRES * 100)} de plus, calculez le coût du personnel du mois, la hausse mensuelle en euros, le nouveau coût horaire chargé (au centime), puis la nouvelle part du personnel au chiffre d'affaires d'aujourd'hui (au dixième).`,
      champs: (c) => {
        const r = accordDeBranche(c);
        return [
          { libelle: "Coût du personnel après la hausse", attendu: r.coutApres, calcul: `${eur(r.cout)} × ${(1 + HAUSSE_DES_SALAIRES).toLocaleString("fr-FR")} = ${eur(r.coutApres)}` },
          { libelle: "Hausse mensuelle", attendu: r.hausse, calcul: `${eur(r.coutApres)} − ${eur(r.cout)} = ${eur(r.hausse)}` },
          { libelle: "Nouveau coût horaire chargé", attendu: r.coutHoraireApres, tolerance: 0.02, calcul: `${eur(r.coutApres)} ÷ ${heures(r.heuresPayees)} = ${eur(r.coutHoraireApres)}` },
          { libelle: "Nouvelle part du personnel (%)", attendu: r.partApres, tolerance: 0.1, calcul: `${eur(r.coutApres)} ÷ ${eur(r.ca)} × 100 = ${pct(r.partApres)}` },
        ];
      },
      explication: (c) => {
        const r = accordDeBranche(c);
        return [
          `L'équipe ne fait pas une heure de plus, mais chaque heure coûte ${eur(r.coutHoraireApres)} au lieu de ${eur(r.coutHoraire)}. Sans ventes en plus, le résultat de ${c.entreprise} perd ${eur(r.hausse)} chaque mois.`,
        ];
      },
    },
    {
      id: "les-ventes-qui-paient",
      type: "montants",
      titre: "Les ventes qui paient la hausse",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => {
        const r = accordDeBranche(c);
        return `Le personnel est une charge fixe : la hausse se paie avec la marge des ventes en plus. Avec un taux de marge sur coût variable de ${pct(r.tauxMcv)}, quel chiffre d'affaires ${c.entreprise} doit-elle réaliser en plus chaque mois (à l'euro, arrondi au-dessus) ? Que représente-t-il du chiffre d'affaires d'aujourd'hui, en pourcentage, au dixième ?`;
      },
      champs: (c) => {
        const r = accordDeBranche(c);
        return [
          { libelle: "Chiffre d'affaires à réaliser en plus", attendu: r.caEnPlus, tolerance: 2, calcul: `${eur(r.hausse)} ÷ ${pct(r.tauxMcv)} = ${eur(r.caEnPlus)}` },
          { libelle: "Part du chiffre d'affaires d'aujourd'hui (%)", attendu: r.partDuChiffre, tolerance: 0.1, calcul: `${eur(r.caEnPlus)} ÷ ${eur(r.ca)} × 100 = ${pct(r.partDuChiffre)}` },
        ];
      },
      explication: (c) => {
        const r = accordDeBranche(c);
        return [
          `Chaque euro de ventes en plus ne laisse que ${pct(r.tauxMcv)} de marge : pour payer ${eur(r.hausse)}, il en faut ${eur(r.caEnPlus)}, soit ${pct(r.partDuChiffre)} de ventes en plus. C'est l'objectif à donner à l'équipe pour que sa revalorisation ne pèse pas sur le résultat.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = accordDeBranche(c);
        return [
          {
            texte: `Il faudra ${eur(r.caEnPlus)} de ventes en plus par mois`,
            juste: true,
            retour: `Oui : la hausse coûte ${eur(r.hausse)} par mois, et chaque vente en plus n'en laisse que ${pct(r.tauxMcv)} en marge : ${eur(r.hausse)} ÷ ${pct(r.tauxMcv)} = ${eur(r.caEnPlus)}. L'heure de l'équipe passe à ${eur(r.coutHoraireApres)}.`,
          },
          {
            texte: `Il faudra ${eur(r.hausse)} de ventes en plus par mois : le montant de la hausse`,
            juste: false,
            retour: `Non : ${eur(r.hausse)} de ventes en plus coûtent d'abord leurs coûts variables, et ne laissent que ${eur(auCentime((r.hausse * r.tauxMcv) / 100))} de marge. C'est la marge qui paie la hausse : il faut ${eur(r.caEnPlus)} de ventes.`,
          },
          {
            texte: `Il faudra ${pct(HAUSSE_DES_SALAIRES * 100)} de ventes en plus, soit ${eur(r.caDuMemePourcentage)} par mois, comme les salaires`,
            juste: false,
            retour: `Non : ${pct(HAUSSE_DES_SALAIRES * 100)} de ventes en plus laisseraient ${eur(r.margeDuMemePourcentage)} de marge, pour une hausse de ${eur(r.hausse)}. Le personnel ne pèse que ${pct(r.partDuPersonnel)} du chiffre d'affaires : pour payer ses ${pct(HAUSSE_DES_SALAIRES * 100)} de hausse, ${eur(r.caEnPlus)} suffisent.`,
          },
        ];
      },
    },
  ],
};
