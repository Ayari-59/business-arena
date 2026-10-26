import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { valeurAjoutee } from "../../chapitres/valeur-ajoutee-et-partage";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA VALEUR AJOUTÉE ET SON PARTAGE » : UN TECHNICIEN PLUTÔT
 * QU'UN PRESTATAIRE (Bac STMG, gestion et finance, palier 1).
 *
 * L'entretien est confié à un prestataire. La direction envisage de le faire faire par un
 * technicien qu'elle embaucherait, et demande ce que ce changement ferait à la valeur
 * ajoutée et à la part qui revient aux salariés. L'élève refait seul les calculs du
 * chapitre (les consommations, la valeur ajoutée, la part des salariés), une fois sur
 * l'année réelle, une fois avec le technicien.
 *
 * Le cas est neuf par sa question : le chapitre mesure la valeur ajoutée d'une année, le
 * cas montre qu'elle dépend de ce que l'entreprise fait elle-même ou fait faire. Les
 * montants sont ceux de l'année de l'arène (`valeurAjoutee`).
 */

/**
 * Ce que coûterait le technicien, salaire et cotisations compris, en part du contrat
 * d'entretien d'aujourd'hui : 90 %. Le prestataire facture en plus sa marge et ses
 * déplacements ; un salarié de l'entreprise coûte un peu moins pour le même travail.
 */
export const COUT_DU_TECHNICIEN = 0.9;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function technicien(c: Cas) {
  const v = valeurAjoutee(c);
  const s = v.k.s;
  const contrat = s.entretien;
  const salaire = auCentime(contrat * COUT_DU_TECHNICIEN);
  const consommationsApres = auCentime(v.consommations - contrat);
  const vaApres = auCentime(v.va + contrat);
  const personnelApres = auCentime(s.personnel + salaire);
  return {
    ...v,
    contrat,
    salaire,
    economie: auCentime(contrat - salaire),
    consommationsApres,
    vaApres,
    personnelApres,
    partAvant: v.parts[0]!.part,
    partApres: auDixieme((personnelApres / vaApres) * 100),
    tauxApres: auDixieme((vaApres / s.ventes) * 100),
  };
}

export const UN_TECHNICIEN_PLUTOT_QU_UN_PRESTATAIRE: Situation = {
  code: "un-technicien-plutot-qu-un-prestataire",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["valeur-ajoutee-et-partage"],
  commanditaire: "La direction",
  titre: "Un technicien plutôt qu'un prestataire",
  accroche:
    "La direction envisage d'embaucher un technicien pour faire l'entretien, aujourd'hui confié à un prestataire. Elle demande ce que ce changement ferait à la valeur ajoutée, et à la part des salariés.",
  objectifs: [
    "Calculer les consommations venues d'autres entreprises et la valeur ajoutée",
    "Calculer la part des salariés dans la valeur ajoutée",
    "Mesurer l'effet sur la valeur ajoutée de faire soi-même plutôt que de faire faire",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = technicien(c);
        return [
          `« L'entretien nous a coûté ${eur(r.contrat)} cette année, facturés par un prestataire. Nous pourrions embaucher un technicien qui ferait le même travail pour ${pct(COUT_DU_TECHNICIEN * 100)} de ce prix, salaire et cotisations compris. Avant d'en parler aux délégués du personnel, je veux savoir ce que ce changement aurait fait à la valeur ajoutée ${dE(c.entreprise)} cette année, et à la part qui revient aux salariés. »`,
          "Pas de cours cette fois : vous avez les comptes de l'année, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = technicien(c);
        const s = r.k.s;
        const lignes = [
          { libelle: r.k.produits === s.ventes ? "Ventes de l'année" : "Production de l'année (ventes et variation du stock de produits)", valeurs: [eur(r.k.produits)] },
          { libelle: s.marchandises ? "Marchandises consommées" : "Achats consommés", valeurs: [eur(r.k.achatsConsommes)] },
          { libelle: "Autres coûts variables et qualité", valeurs: [eur(s.autres)] },
        ];
        if (s.commissions > 0) lignes.push({ libelle: "Commissions", valeurs: [eur(s.commissions)] });
        lignes.push(
          { libelle: "Publicité", valeurs: [eur(s.publicite)] },
          { libelle: "Entretien, facturé par le prestataire", valeurs: [eur(s.entretien)] },
          { libelle: "Loyer et frais de structure", valeurs: [eur(s.loyerEtFrais)] },
          { libelle: "Personnel (salaires et cotisations)", valeurs: [eur(s.personnel)] },
          { libelle: "Coût du technicien, en part du contrat d'entretien", valeurs: [pct(COUT_DU_TECHNICIEN * 100)] },
        );
        return { titre: `Les comptes de l'année · ${c.entreprise}`, colonnes: ["Montant"], lignes };
      },
      repere: () =>
        "À rendre : les consommations, la valeur ajoutée et la part des salariés de l'année, les mêmes chiffres avec le technicien, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "L'année avec le prestataire",
      notions: ["income_statement"],
      question: () =>
        "Commencez par l'année réelle : le total des consommations venues d'autres entreprises, la valeur ajoutée, puis la part des salariés dans la valeur ajoutée (personnel ÷ valeur ajoutée × 100), au dixième.",
      champs: (c) => {
        const r = technicien(c);
        return [
          { libelle: "Consommations", attendu: r.consommations, calcul: `somme des consommations = ${eur(r.consommations)}`, tolerance: 1 },
          { libelle: "Valeur ajoutée", attendu: r.va, calcul: `${eur(r.k.produits)} − ${eur(r.consommations)} = ${eur(r.va)}`, tolerance: 2 },
          { libelle: "Part des salariés (%)", attendu: r.partAvant, calcul: `${eur(r.k.s.personnel)} ÷ ${eur(r.va)} × 100 = ${pct(r.partAvant)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = technicien(c);
        return [
          `Le contrat d'entretien, ${eur(r.contrat)}, est dans les consommations : c'est le prestataire qui a créé cette richesse-là, pas ${c.entreprise}. Le personnel n'y est pas : il est payé sur la valeur ajoutée, dont il reçoit ${pct(r.partAvant)}.`,
        ];
      },
    },
    {
      id: "avec-le-technicien",
      type: "montants",
      titre: "L'année avec le technicien",
      notions: ["income_statement", "make_or_buy"],
      question: () =>
        "Refaites le calcul avec le technicien : plus de contrat d'entretien, mais un salarié de plus. Que deviennent les consommations, la valeur ajoutée, et la part des salariés, au dixième ?",
      champs: (c) => {
        const r = technicien(c);
        return [
          { libelle: "Consommations avec le technicien", attendu: r.consommationsApres, calcul: `${eur(r.consommations)} − ${eur(r.contrat)} = ${eur(r.consommationsApres)}`, tolerance: 1 },
          { libelle: "Valeur ajoutée avec le technicien", attendu: r.vaApres, calcul: `${eur(r.k.produits)} − ${eur(r.consommationsApres)} = ${eur(r.vaApres)}`, tolerance: 2 },
          {
            libelle: "Part des salariés (%)",
            attendu: r.partApres,
            calcul: `(${eur(r.k.s.personnel)} + ${eur(r.salaire)}) ÷ ${eur(r.vaApres)} × 100 = ${pct(r.partApres)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const r = technicien(c);
        return [
          `La valeur ajoutée grossit de tout le contrat, ${eur(r.contrat)}, et pas seulement de l'économie : le travail d'entretien est désormais fait par ${c.entreprise}, c'est elle qui crée cette richesse. Sur 100 € de ventes, elle en créerait ${pct(r.tauxApres).replace(" %", " €")}.`,
          `Le salaire du technicien, ${eur(r.salaire)}, se paie sur cette valeur ajoutée : la part des salariés passe de ${pct(r.partAvant)} à ${pct(r.partApres)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = technicien(c);
        return [
          {
            texte: `La valeur ajoutée augmenterait de ${eur(r.contrat)}, à ${eur(r.vaApres)}`,
            juste: true,
            retour: `Oui : le contrat sort des consommations, et la valeur ajoutée grossit d'autant. Le technicien, ${eur(r.salaire)}, se paie sur elle : la part des salariés passerait de ${pct(r.partAvant)} à ${pct(r.partApres)}.`,
          },
          {
            texte: "La valeur ajoutée ne changerait pas : seul son partage entre les salariés et l'entreprise bougerait",
            juste: false,
            retour: `Non : le partage bouge, mais la valeur ajoutée aussi. Les ${eur(r.contrat)} du contrat étaient une consommation ; le travail fait par un salarié n'en est pas une.`,
          },
          {
            texte: `La valeur ajoutée baisserait de ${eur(r.salaire)} : un salaire de plus est une charge de plus`,
            juste: false,
            retour: `Non : le salaire est une charge, mais pas une consommation venue d'une autre entreprise. Il ne se retire pas de la production : il se paie sur la valeur ajoutée.`,
          },
          {
            texte: `La valeur ajoutée augmenterait de ${eur(r.economie)}, l'économie faite sur le prix du contrat`,
            juste: false,
            retour: `Non : ${eur(r.economie)}, c'est ce que l'entreprise gagne sur le prix. La valeur ajoutée, elle, grossit de tout le contrat retiré des consommations, ${eur(r.contrat)}.`,
          },
        ];
      },
    },
  ],
};
