import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { rentabilite } from "../../chapitres/rentabilite";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE } from "../../monde/comptes-du-lycee";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA RENTABILITÉ » : CE QU'EXIGE LE FONDS
 * (Bac STMG, gestion et finance, palier 1).
 *
 * Un fonds d'investissement régional étudie l'entrée au capital de l'entreprise. Il pose
 * sa condition : que les capitaux des associés rapportent au moins un certain taux par an.
 * Il demande où en est l'entreprise, et quel résultat net il lui faudrait. L'élève refait
 * seul les calculs du chapitre (les deux rentabilités, les capitaux investis), puis
 * retourne la formule de la rentabilité financière pour trouver le résultat exigé.
 *
 * Le cas est neuf par sa question : le chapitre mesure la rentabilité de l'année, le cas
 * part d'une rentabilité visée et cherche le résultat qui l'atteint. Les chiffres sont ceux
 * du chapitre (`rentabilite`) : le premier exercice de NOVA, dans le monde du cours.
 */

/**
 * La rentabilité des capitaux propres que le fonds exige : 10 % par an, l'ordre de
 * grandeur de ce qu'attendent les investisseurs qui entrent au capital d'une petite
 * entreprise. C'est nettement plus que le taux d'un prêt bancaire, pour le risque qu'ils
 * prennent : ils ne sont payés qu'après les prêteurs, et seulement s'il y a un bénéfice.
 */
export const RENTABILITE_EXIGEE = 0.1;

/** Un montant, le signe moins typographique : « −582,38 € ». */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function exigenceDuFonds(c: Pick<Cas, "code">) {
  const r = rentabilite(c);
  const ventes = r.k.ventes;
  const requis = auCentime(r.capitauxPropres * RENTABILITE_EXIGEE);
  return {
    ...r,
    ventes,
    requis,
    ecart: auCentime(requis - r.resultatNet),
    atteint: r.resultatNet >= requis,
    // Les erreurs classiques : rapporter l'exigence aux ventes, ou aux capitaux investis.
    surLesVentes: auCentime(ventes * RENTABILITE_EXIGEE),
    surLesInvestis: auCentime(r.capitauxInvestis * RENTABILITE_EXIGEE),
  };
}

export const CE_QU_EXIGE_LE_FONDS: Situation = {
  code: "ce-qu-exige-le-fonds",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["rentabilite"],
  commanditaire: "Le fonds d'investissement",
  titre: "Ce qu'exige le fonds d'investissement",
  accroche:
    "Un fonds d'investissement veut que les capitaux des associés rapportent un taux minimal. Il demande où en est l'entreprise, et quel résultat il lui faudrait.",
  objectifs: [
    "Calculer la rentabilité financière",
    "Calculer les capitaux investis et la rentabilité économique",
    "Calculer le résultat net qui atteint une rentabilité visée",
    "Rédiger une réponse chiffrée au fonds",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend le premier exercice de NOVA dans la simulation du cours, celui du chapitre ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Le courriel du fonds",
      texte: (c) => [
        `« Nous étudions une entrée au capital ${dE(rentabilite(c).entreprise)}. Notre condition : que les capitaux propres rapportent au moins ${pct(RENTABILITE_EXIGEE * 100)} par an. Dites-nous où vous en êtes cette année, ce que rapporte votre activité, et quel résultat net il vous faudrait pour atteindre notre seuil. » La chargée d'investissement du fonds`,
        "Pas de cours cette fois : vous avez les chiffres de l'année, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const r = exigenceDuFonds(c);
        return {
          titre: `Les chiffres de l'année · ${r.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Ventes de l'année", valeurs: [eur(r.ventes)] },
            { libelle: "Résultat net (après intérêts et impôt)", valeurs: [eur(r.resultatNet)] },
            { libelle: "Résultat de l'activité (avant intérêts et impôt)", valeurs: [eur(r.resultatExploitation)] },
            { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(r.capitauxPropres)] },
            { libelle: "Équipement (valeur nette)", valeurs: [eur(r.immobilisations)] },
            { libelle: "Besoin en fonds de roulement (stocks et créances, moins dettes d'exploitation)", valeurs: [eur(r.bfr)] },
            { libelle: "Rentabilité des capitaux propres exigée par le fonds", valeurs: [pct(RENTABILITE_EXIGEE * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la rentabilité financière, les capitaux investis et la rentabilité économique de l'année, le résultat net qu'exige le fonds et l'écart avec celui de l'année, et votre réponse.",
    },
    {
      id: "cette-annee",
      type: "montants",
      titre: "Les rentabilités de l'année",
      notions: ["profitability_vs_return"],
      question: () =>
        "Commencez par l'année : la rentabilité financière (résultat net ÷ capitaux propres × 100), les capitaux investis (équipement + besoin en fonds de roulement), puis la rentabilité économique (résultat de l'activité ÷ capitaux investis × 100). Les pourcentages au dixième.",
      champs: (c) => {
        const r = exigenceDuFonds(c);
        return [
          { libelle: "Rentabilité financière (%)", attendu: r.financiere, calcul: `${eur(r.resultatNet)} ÷ ${eur(r.capitauxPropres)} × 100 = ${pct(r.financiere)}`, tolerance: 0.1 },
          { libelle: "Capitaux investis", attendu: r.capitauxInvestis, calcul: `${eur(r.immobilisations)} ${r.bfr < 0 ? `− ${eur(-r.bfr)}` : `+ ${eur(r.bfr)}`} = ${eur(r.capitauxInvestis)}`, tolerance: 1 },
          { libelle: "Rentabilité économique (%)", attendu: r.economique, calcul: `${eur(r.resultatExploitation)} ÷ ${eur(r.capitauxInvestis)} × 100 = ${pct(r.economique)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = exigenceDuFonds(c);
        return [
          `C'est la rentabilité financière que le fonds regarde : elle dit ce que rapportent les capitaux des associés, ceux dont il prendrait une part. ${r.entreprise} est à ${pct(r.financiere)}, pour ${pct(RENTABILITE_EXIGEE * 100)} exigés.`,
          "La rentabilité économique juge l'activité, quel que soit son financement : elle se rapporte aux capitaux investis, pas aux seuls capitaux propres.",
        ];
      },
    },
    {
      id: "le-seuil-du-fonds",
      type: "montants",
      titre: "Le résultat exigé",
      notions: ["profitability_vs_return"],
      question: () =>
        "Avec les capitaux propres de l'année, quel résultat net donnerait exactement la rentabilité exigée ? Quel écart avec le résultat net de l'année (négatif si le seuil est déjà dépassé) ?",
      champs: (c) => {
        const r = exigenceDuFonds(c);
        return [
          { libelle: "Résultat net exigé", attendu: r.requis, calcul: `${eur(r.capitauxPropres)} × ${pct(RENTABILITE_EXIGEE * 100)} = ${eur(r.requis)}` },
          { libelle: "Écart avec le résultat de l'année", attendu: r.ecart, calcul: r.resultatNet < 0 ? `${eur(r.requis)} + ${eur(-r.resultatNet)} de perte = ${eur(r.ecart)}` : `${eur(r.requis)} − ${eur(r.resultatNet)} = ${eur(r.ecart)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = exigenceDuFonds(c);
        return [
          r.atteint
            ? `${r.entreprise} dépasse le seuil du fonds de ${eur(-r.ecart)} : son résultat net de l'année rapporte déjà ${pct(r.financiere)} aux associés.`
            : r.resultatNet >= 0
              ? `Il manque ${eur(r.ecart)} de résultat net à ${r.entreprise} pour atteindre le seuil : son bénéfice devrait passer de ${eur(r.resultatNet)} à ${eur(r.requis)}.`
              : `${r.entreprise} est en perte : il lui faudrait gagner ${eur(r.ecart)} de plus pour atteindre le seuil, d'abord pour effacer sa perte, puis pour dégager ${eur(r.requis)} de bénéfice.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au fonds",
      question: () => "Quelle phrase envoyez-vous au fonds d'investissement ?",
      options: (c) => {
        const r = exigenceDuFonds(c);
        return [
          {
            texte: r.atteint
              ? `Votre seuil demande ${eur(r.requis)} de résultat net : nous le dépassons`
              : `Votre seuil demande ${eur(r.requis)} de résultat net : il nous en manque ${eur(r.ecart)}`,
            juste: true,
            retour: `Oui : ${pct(RENTABILITE_EXIGEE * 100)} de ${eur(r.capitauxPropres)} de capitaux propres font ${eur(r.requis)}. Avec ${eur(r.resultatNet)} cette année, la rentabilité financière ${dE(r.entreprise)} est de ${pct(r.financiere)}.`,
          },
          {
            texte: `Votre seuil demande ${eur(r.surLesVentes)} de résultat net, soit ${pct(RENTABILITE_EXIGEE * 100)} de nos ventes de l'année`,
            juste: false,
            retour: `Non : ce serait un taux de résultat, ce que l'on gagne sur les ventes. La rentabilité financière rapporte le résultat aux capitaux propres : ${pct(RENTABILITE_EXIGEE * 100)} de ${eur(r.capitauxPropres)}, soit ${eur(r.requis)}.`,
          },
          {
            texte: `Votre seuil demande ${eur(r.surLesInvestis)} de résultat net, soit ${pct(RENTABILITE_EXIGEE * 100)} de nos capitaux investis`,
            juste: false,
            retour: `Non : les capitaux investis servent à la rentabilité économique, celle de l'activité. Le fonds parle des capitaux des associés : ${pct(RENTABILITE_EXIGEE * 100)} de ${eur(r.capitauxPropres)}, soit ${eur(r.requis)}.`,
          },
          {
            texte: "On ne peut pas vous répondre : une rentabilité dépend du taux de notre emprunt",
            juste: false,
            retour: `Si, on peut : la rentabilité financière se calcule avec le résultat net, déjà après les intérêts, et les capitaux propres. Le seuil du fonds demande ${eur(r.requis)} de résultat net.`,
          },
        ];
      },
    },
  ],
};
