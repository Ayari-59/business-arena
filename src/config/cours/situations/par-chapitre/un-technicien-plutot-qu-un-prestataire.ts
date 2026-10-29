import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { valeurAjoutee } from "../../chapitres/valeur-ajoutee-et-partage";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE } from "../../monde/comptes-du-lycee";
import { GAMME_DE_NOVA } from "../../monde/nova-gestion";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA VALEUR AJOUTÉE ET SON PARTAGE » : UN TECHNICIEN PLUTÔT
 * QU'UN PRESTATAIRE (Bac STMG, gestion et finance, palier 1).
 *
 * L'entretien de la ligne va être confié à un prestataire. La direction envisage de le faire
 * faire par un technicien qu'elle embaucherait, et demande ce que ce changement ferait à la
 * valeur ajoutée et à la part qui revient aux salariés. L'élève refait seul les calculs du
 * chapitre (les consommations, la valeur ajoutée, la part des salariés), une fois avec le
 * prestataire, une fois avec le technicien, sur une année comme celle qui vient de finir.
 *
 * Le cas est neuf par sa question : le chapitre mesure la valeur ajoutée d'une année, le
 * cas montre qu'elle dépend de ce que l'entreprise fait elle-même ou fait faire. Les
 * montants sont ceux du premier exercice de NOVA dans le monde du cours (`valeurAjoutee`).
 */

/**
 * LE CONTRAT D'ENTRETIEN DE LA LIGNE : celui que la fiche de gestion de NOVA prévoit quand la
 * gamme sera lancée (monde/nova-gestion.ts, 1 562 € par mois), compté sur douze mois. Le premier
 * exercice n'en avait pas : HYPOTHÈSE DU CAS, l'année qui vient se joue comme celle qui vient de
 * finir, le contrat en plus.
 */
export const CONTRAT_D_ENTRETIEN_ANNUEL = 12 * GAMME_DE_NOVA.communes.entretien;

/**
 * Ce que coûterait le technicien, salaire et cotisations compris, en part du contrat
 * d'entretien d'aujourd'hui : 90 %. Le prestataire facture en plus sa marge et ses
 * déplacements ; un salarié de l'entreprise coûte un peu moins pour le même travail.
 */
export const COUT_DU_TECHNICIEN = 0.9;

/** Un montant, le signe moins typographique : « −582,38 € ». */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function technicien(c: Pick<Cas, "code">) {
  const v = valeurAjoutee(c);
  const contrat = CONTRAT_D_ENTRETIEN_ANNUEL;
  const salaire = auCentime(contrat * COUT_DU_TECHNICIEN);
  // Avec le prestataire, le contrat s'ajoute aux consommations de l'année.
  const consommations = auCentime(v.consommations + contrat);
  const va = auCentime(v.va - contrat);
  const personnelApres = auCentime(v.k.personnel + salaire);
  return {
    ...v,
    consommations,
    va,
    contrat,
    salaire,
    economie: auCentime(contrat - salaire),
    consommationsApres: v.consommations,
    vaApres: v.va,
    personnelApres,
    partAvant: auDixieme((v.k.personnel / va) * 100),
    partApres: auDixieme((personnelApres / v.va) * 100),
    tauxApres: auDixieme((v.va / v.k.ventes) * 100),
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
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend le premier exercice de NOVA dans la simulation du cours, celui du chapitre, et le contrat d'entretien de sa fiche ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = technicien(c);
        return [
          `« L'an prochain, l'entretien de la ligne nous coûtera ${eur(r.contrat)} par an, facturés par un prestataire. Nous pourrions embaucher un technicien qui ferait le même travail pour ${pct(COUT_DU_TECHNICIEN * 100)} de ce prix, salaire et cotisations compris. Avant d'en parler aux délégués du personnel, je veux savoir ce que l'un et l'autre feraient à la valeur ajoutée ${dE(r.k.entreprise)} sur une année comme celle qui vient de finir, et à la part qui revient aux salariés. »`,
          "Pas de cours cette fois : vous avez les comptes de l'année et le contrat, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = technicien(c);
        return {
          titre: `Les comptes de l'année · ${r.k.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Production de l'année (les ventes d'enceintes)", valeurs: [eur(r.k.ventes)] },
            ...r.k.lignes.filter((l) => l.consommation).map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] })),
            { libelle: "Personnel (salaires et cotisations)", valeurs: [eur(r.k.personnel)] },
            { libelle: "Contrat d'entretien de la ligne, l'an prochain", valeurs: [eur(r.contrat)] },
            { libelle: "Coût du technicien, en part du contrat d'entretien", valeurs: [pct(COUT_DU_TECHNICIEN * 100)] },
          ],
        };
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
        "Commencez par l'année avec le prestataire, son contrat compris : le total des consommations venues d'autres entreprises, la valeur ajoutée, puis la part des salariés dans la valeur ajoutée (personnel ÷ valeur ajoutée × 100), au dixième.",
      champs: (c) => {
        const r = technicien(c);
        return [
          { libelle: "Consommations", attendu: r.consommations, calcul: `${eur(r.consommationsApres)} + ${eur(r.contrat)} de contrat = ${eur(r.consommations)}`, tolerance: 1 },
          { libelle: "Valeur ajoutée", attendu: r.va, calcul: `${eur(r.k.ventes)} − ${eur(r.consommations)} = ${eur(r.va)}`, tolerance: 2 },
          { libelle: "Part des salariés (%)", attendu: r.partAvant, calcul: `${eur(r.k.personnel)} ÷ ${eur(r.va)} × 100 = ${pct(r.partAvant)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = technicien(c);
        return [
          `Le contrat d'entretien, ${eur(r.contrat)}, est dans les consommations : c'est le prestataire qui a créé cette richesse-là, pas ${r.k.entreprise}. Le personnel n'y est pas : il est payé sur la valeur ajoutée, dont il reçoit ${pct(r.partAvant)}.`,
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
          { libelle: "Valeur ajoutée avec le technicien", attendu: r.vaApres, calcul: `${eur(r.k.ventes)} − ${eur(r.consommationsApres)} = ${eur(r.vaApres)}`, tolerance: 2 },
          {
            libelle: "Part des salariés (%)",
            attendu: r.partApres,
            calcul: `(${eur(r.k.personnel)} + ${eur(r.salaire)}) ÷ ${eur(r.vaApres)} × 100 = ${pct(r.partApres)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const r = technicien(c);
        return [
          `La valeur ajoutée grossit de tout le contrat, ${eur(r.contrat)}, et pas seulement de l'économie : le travail d'entretien est désormais fait par ${r.k.entreprise}, c'est elle qui crée cette richesse. Sur 100 € de ventes, elle en créerait ${pct(r.tauxApres).replace(" %", " €")}.`,
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
