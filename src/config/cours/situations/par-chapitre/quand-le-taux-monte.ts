import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { soldesDeGestion } from "../../chapitres/soldes-intermediaires";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « SOLDES INTERMÉDIAIRES DE GESTION ET CAF » : QUAND LE TAUX
 * MONTE (comptabilité générale, palier 4).
 *
 * La banque annonce que le taux de l'emprunt sera relevé à la renégociation. La directrice
 * financière demande quels soldes l'auraient senti si la hausse avait joué toute l'année,
 * et de combien : l'excédent brut d'exploitation, le résultat, la capacité
 * d'autofinancement. L'élève refait seul la cascade du chapitre sur l'année de l'arène,
 * puis la redescend avec des intérêts plus lourds, l'impôt recalculé.
 *
 * Le cas est neuf par sa question : le chapitre lit chaque solde une fois ; le cas fait
 * bouger une seule charge et demande où elle se loge dans la cascade. Les montants sont
 * ceux du chapitre (`soldesDeGestion`) ; l'impôt suit la règle de « La clôture » : le taux
 * de l'arène sur un résultat positif, arrondi à l'euro, rien sur une perte.
 */

/**
 * La hausse du taux de l'emprunt : 2 points, l'ordre de grandeur de la remontée des taux
 * des crédits aux entreprises en 2022 et 2023, ce qu'une renégociation fait payer à un
 * emprunt souscrit quand les taux étaient bas.
 */
export const HAUSSE_DU_TAUX = 0.02;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const points = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} points`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function tauxQuiMonte(c: Cas) {
  const s = soldesDeGestion(c);
  const taux = c.pret.tauxAnnuel;
  const nouveauTaux = taux + HAUSSE_DU_TAUX;
  // Les intérêts de l'année sont proportionnels au taux : même capital dû, taux plus haut.
  const interets = auCentime((s.interets * nouveauTaux) / taux);
  const rcai = auCentime(s.resultatExploitation - interets);
  const impot = rcai > 0 ? Math.round(rcai * s.tauxIS) : 0;
  const resultatNet = auCentime(rcai - impot);
  return {
    ...s,
    taux,
    nouveauTaux,
    apres: { interets, rcai, impot, resultatNet, caf: auCentime(resultatNet + s.dotation) },
    surcout: auCentime(interets - s.interets),
    depart: s.marchandises ? s.margeCommerciale : s.production,
  };
}

const ligne = (libelle: string, x: number) => ({ libelle, valeurs: [eur(x)] });

/** Le compte de résultat de l'année et les conditions de l'emprunt : ce que l'élève a sous les yeux. */
function documents(c: Cas): TableauDeDonnees {
  const t = tauxQuiMonte(c);
  const lignes = [ligne(t.marchandises ? "Ventes de marchandises" : "Ventes (production vendue)", t.ventes)];
  if (t.stock && t.variation !== 0) {
    lignes.push(ligne(t.marchandises ? "Variation du stock de marchandises (final − initial)" : "Production stockée (en-cours final − initial)", t.variation));
  }
  lignes.push(ligne(t.marchandises ? "Achats de marchandises" : "Achats", t.achats), ligne("Autres coûts variables et qualité", t.autres));
  if (t.commissions > 0) lignes.push(ligne("Commissions", t.commissions));
  lignes.push(
    ligne("Publicité", t.publicite),
    ligne("Entretien", t.entretien),
    ligne("Loyer et frais de structure", t.loyerEtFrais),
    ligne("Personnel", t.personnel),
    ligne("Dotation aux amortissements", t.dotation),
    ligne("Intérêts", t.interets),
    ligne("Impôt sur les sociétés", t.impot),
    { libelle: "Taux de l'emprunt aujourd'hui", valeurs: [pct(t.taux * 100)] },
    { libelle: "Hausse annoncée du taux", valeurs: [points(HAUSSE_DU_TAUX)] },
    { libelle: "Taux de l'impôt sur les sociétés (sur un résultat positif, arrondi à l'euro)", valeurs: [pct(t.tauxIS * 100)] },
  );
  return { titre: `L'année ${dE(c.entreprise)} dans l'arène`, colonnes: ["Montant"], lignes };
}

export const QUAND_LE_TAUX_MONTE: Situation = {
  code: "quand-le-taux-monte",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["soldes-intermediaires-de-gestion"],
  commanditaire: "La directrice financière",
  titre: "Quand le taux de l'emprunt monte",
  accroche:
    "La banque relèvera le taux de l'emprunt à la renégociation. La directrice financière demande quels soldes l'auraient senti cette année, et de combien.",
  objectifs: [
    "Calculer la valeur ajoutée, l'excédent brut d'exploitation, le résultat d'exploitation et le résultat courant avant impôt",
    "Recalculer les intérêts, l'impôt et le résultat net avec un taux plus élevé",
    "Recalculer la capacité d'autofinancement",
    "Dire quels soldes une charge financière touche, et lesquels elle ne touche pas",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la directrice financière",
      tableau: documents,
      texte: (c) => {
        const t = tauxQuiMonte(c);
        return [
          `« À la renégociation, la banque relèvera de ${points(HAUSSE_DU_TAUX)} le taux de notre emprunt, de ${pct(t.taux * 100)} à ${pct(t.nouveauTaux * 100)}. Si ce taux avait joué toute l'année, quels soldes de gestion ${dE(c.entreprise)} l'auraient senti, et de combien ? Je veux le résultat net et la capacité d'autofinancement qu'il nous serait resté. »`,
          "Pas de cours cette fois : vous avez le compte de résultat de l'année, et la cascade des soldes est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      repere: () =>
        "À rendre : la valeur ajoutée, l'excédent brut d'exploitation, le résultat d'exploitation et le résultat courant avant impôt de l'année, puis les intérêts, le résultat et la capacité d'autofinancement au nouveau taux, les soldes qui bougent, et votre réponse.",
    },
    {
      id: "les-soldes-de-l-annee",
      type: "montants",
      titre: "Les soldes de l'année",
      notions: ["income_statement", "ebitda_margin"],
      tableau: documents,
      question: (c) => {
        const t = tauxQuiMonte(c);
        return `Descendez la cascade de l'année réelle, à partir ${t.marchandises ? "de la marge commerciale" : "de la production de l'exercice"} : la valeur ajoutée, l'excédent brut d'exploitation, le résultat d'exploitation, puis le résultat courant avant impôt.`;
      },
      champs: (c) => {
        const t = tauxQuiMonte(c);
        return [
          { libelle: "Valeur ajoutée", attendu: t.valeurAjoutee, calcul: `${eur(t.depart)} de ${t.marchandises ? "marge commerciale" : "production"} − ${eur(t.consommations)} de consommations = ${eur(t.valeurAjoutee)}` },
          { libelle: "Excédent brut d'exploitation", attendu: t.ebe, calcul: `${eur(t.valeurAjoutee)} − ${eur(t.personnel)} de personnel = ${eur(t.ebe)}` },
          { libelle: "Résultat d'exploitation", attendu: t.resultatExploitation, calcul: `${eur(t.ebe)} − ${eur(t.dotation)} de dotation = ${eur(t.resultatExploitation)}` },
          { libelle: "Résultat courant avant impôt", attendu: t.rcai, calcul: `${eur(t.resultatExploitation)} − ${eur(t.interets)} d'intérêts = ${eur(t.rcai)}` },
        ];
      },
      explication: (c) => {
        const t = tauxQuiMonte(c);
        return [
          `Les intérêts, ${eur(t.interets)}, n'apparaissent qu'au passage du résultat d'exploitation au résultat courant avant impôt : c'est le premier étage où joue le financement.`,
        ];
      },
    },
    {
      id: "au-nouveau-taux",
      type: "montants",
      titre: "L'année au nouveau taux",
      notions: ["income_statement", "net_treasury"],
      question: (c) => {
        const t = tauxQuiMonte(c);
        return `Le capital dû ne change pas : les intérêts de l'année sont proportionnels au taux. Calculez les intérêts au taux de ${pct(t.nouveauTaux * 100)}, puis le résultat courant avant impôt, l'impôt sur les sociétés, le résultat net et la capacité d'autofinancement qui en découlent.`;
      },
      champs: (c) => {
        const t = tauxQuiMonte(c);
        const a = t.apres;
        return [
          { libelle: "Intérêts au nouveau taux", attendu: a.interets, calcul: `${eur(t.interets)} × ${pct(t.nouveauTaux * 100)} ÷ ${pct(t.taux * 100)} = ${eur(a.interets)}`, tolerance: 1 },
          { libelle: "Résultat courant avant impôt", attendu: a.rcai, calcul: `${eur(t.resultatExploitation)} − ${eur(a.interets)} = ${eur(a.rcai)}`, tolerance: 1 },
          {
            libelle: "Impôt sur les sociétés",
            attendu: a.impot,
            calcul: a.rcai > 0 ? `${eur(a.rcai)} × ${pct(t.tauxIS * 100)}, arrondi à l'euro = ${eur(a.impot)}` : "pas d'impôt sur une perte : 0 €",
            tolerance: 1,
          },
          { libelle: "Résultat net", attendu: a.resultatNet, calcul: `${eur(a.rcai)} − ${eur(a.impot)} = ${eur(a.resultatNet)}`, tolerance: 1 },
          { libelle: "Capacité d'autofinancement", attendu: a.caf, calcul: `${eur(a.resultatNet)} + ${eur(t.dotation)} de dotation = ${eur(a.caf)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const t = tauxQuiMonte(c);
        const a = t.apres;
        const baisse = auCentime(t.resultatNet - a.resultatNet);
        return [
          `La hausse coûte ${eur(t.surcout)} d'intérêts en plus. ${
            baisse < t.surcout
              ? `Le résultat net ne baisse que de ${eur(baisse)} : moins de bénéfice, c'est aussi moins d'impôt, et l'État prend sa part de la hausse.`
              : `Le résultat net baisse d'autant, ${eur(baisse)} : sans bénéfice, il n'y a pas d'impôt à alléger.`
          }`,
          `La capacité d'autofinancement passe de ${eur(t.cafAdditive)} à ${eur(a.caf)} : les intérêts se paient, ils sortent de la banque.`,
        ];
      },
    },
    {
      id: "ce-qui-bouge",
      type: "tri",
      titre: "Les soldes qui bougent",
      notions: ["income_statement", "ebitda_margin"],
      question: () => "Rangez chaque solde : la hausse du taux le fait bouger, ou il reste le même.",
      categories: [
        { code: "bouge", libelle: "Bouge" },
        { code: "reste", libelle: "Reste le même" },
      ],
      elements: (c) => {
        const t = tauxQuiMonte(c);
        const a = t.apres;
        return [
          t.marchandises
            ? { libelle: "Marge commerciale", montant: t.margeCommerciale, categorie: "reste", pourquoi: "Les ventes et le coût des marchandises vendues ne dépendent pas de l'emprunt." }
            : { libelle: "Production de l'exercice", montant: t.production, categorie: "reste", pourquoi: "Ce que l'entreprise a produit ne dépend pas de l'emprunt." },
          { libelle: "Valeur ajoutée", montant: t.valeurAjoutee, categorie: "reste", pourquoi: "Les intérêts ne sont pas une consommation venue d'une autre entreprise : ils ne touchent pas la richesse créée." },
          { libelle: "Excédent brut d'exploitation", montant: t.ebe, categorie: "reste", pourquoi: "L'EBE se calcule avant les charges financières : c'est ce qui le rend indépendant du financement." },
          { libelle: "Résultat d'exploitation", montant: t.resultatExploitation, categorie: "reste", pourquoi: "Encore un étage de l'activité : la dotation, pas les intérêts." },
          { libelle: "Résultat courant avant impôt", montant: a.rcai, categorie: "bouge", pourquoi: `C'est l'étage des intérêts : ${eur(t.surcout)} de plus.` },
          { libelle: "Résultat net", montant: a.resultatNet, categorie: "bouge", pourquoi: "Il suit le résultat courant, l'impôt recalculé." },
          { libelle: "Capacité d'autofinancement", montant: a.caf, categorie: "bouge", pourquoi: "Les intérêts se paient : la capacité d'autofinancement les retire, comme le résultat net." },
        ];
      },
      explication: () => [
        "Une charge financière ne touche que le bas de la cascade. C'est pourquoi l'analyste compare deux entreprises du même métier par leur EBE : il ne dépend pas de la dette que chacune a choisie.",
      ],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice financière",
      question: () => "Quelle phrase envoyez-vous à la directrice financière ?",
      options: (c) => {
        const t = tauxQuiMonte(c);
        const a = t.apres;
        return [
          {
            texte: `L'EBE ne bouge pas ; le résultat net passerait de ${eur(t.resultatNet)} à ${eur(a.resultatNet)}`,
            juste: true,
            retour: `Oui : ${eur(t.surcout)} d'intérêts en plus pèsent sur le résultat courant, puis sur le résultat net, l'impôt recalculé. L'EBE reste à ${eur(t.ebe)}, et la capacité d'autofinancement passe à ${eur(a.caf)}.`,
          },
          {
            texte: `Tous nos soldes baisseraient de ${eur(t.surcout)}, de la valeur ajoutée au résultat net`,
            juste: false,
            retour: `Non : les intérêts ne sont pas une consommation, ni une charge de l'activité. La valeur ajoutée, l'EBE et le résultat d'exploitation restent les mêmes ; seul le bas de la cascade bouge.`,
          },
          {
            texte: `L'EBE baisserait de ${eur(t.surcout)} : les intérêts sont une charge de l'activité`,
            juste: false,
            retour: `Non : l'EBE se calcule avant les charges financières. Il reste à ${eur(t.ebe)} ; c'est le résultat courant avant impôt qui perd ${eur(t.surcout)}.`,
          },
          {
            texte: "La capacité d'autofinancement ne bougerait pas : des intérêts ne font sortir aucun argent",
            juste: false,
            retour: `Non : c'est la dotation qui ne fait sortir aucun argent. Les intérêts se paient à la banque : la capacité d'autofinancement passe de ${eur(t.cafAdditive)} à ${eur(a.caf)}.`,
          },
        ];
      },
    },
  ],
};
