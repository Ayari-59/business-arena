import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_SEUIL, seuilDeLaBoutique } from "../../chapitres/seuil-du-point-de-vente";
import { seuilDuPointDeVente as seuilDuMois } from "../../monde/boutique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE SEUIL DE RENTABILITÉ DU POINT DE VENTE » : FERMÉ POUR TRAVAUX
 * (BTS MCO, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le mois de janvier de la boutique
 * MAILLE & CO (monde/maille-et-co.ts, monde/boutique.ts, lus par `seuilDeLaBoutique`). Il lisait le
 * mois du cas figé (cas.gestion) chez trois entreprises ; il se joue maintenant chez MAILLE & CO seule.
 *
 * La boutique fermera en début de mois pour des travaux : 5 jours, ou 3 jours si elle paie à
 * l'entreprise un supplément pour travailler le dimanche. L'élève refait seul les calculs du chapitre
 * (taux de marge, seuil, point mort), les applique aux deux mois, et CROISE les deux effets : des jours
 * de vente gagnés, une charge fixe en plus. Le curseur cherche, À REBOURS, le plus gros supplément que
 * les jours gagnés paient. La réponse demande un jugement : le point mort tombe le même jour dans les
 * deux cas, et ne départage rien ; c'est le résultat qui tranche.
 *
 * Les pièges : croire que le seuil ou le résultat baissent comme les jours ouverts ; compter les jours
 * gagnés en chiffre d'affaires au lieu de marge ; choisir sur le point mort.
 */

/** Les jours de fermeture des travaux, en début de mois : une semaine de travaux, du lundi au vendredi. */
export const JOURS_DE_FERMETURE = 5;

/**
 * LES TRAVAUX ACCÉLÉRÉS (hypothèse du cours) : l'entreprise fait le même chantier en 3 jours en
 * travaillant aussi le dimanche, pour un supplément de 2 500 €, une charge du mois qui ne dépend pas des
 * ventes.
 */
export const JOURS_DES_TRAVAUX_ACCELERES = 3;
export const SUPPLEMENT_DES_TRAVAUX_ACCELERES = 2_500;

/** Les bornes du curseur du supplément, en euros. */
export const SUPPLEMENT_DU_CURSEUR = { min: 0, max: 5_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres de la réponse, calculés une fois sur la boutique du cours. */
export function fermePourTravaux(c: Pick<Cas, "code">) {
  const x = seuilDeLaBoutique(c);
  const s = x.s;
  const cinq = seuilDuMois(x.f, { joursDeFermeture: JOURS_DE_FERMETURE });
  const trois = seuilDuMois(x.f, { joursDeFermeture: JOURS_DES_TRAVAUX_ACCELERES, chargesFixes: s.chargesFixes + SUPPLEMENT_DES_TRAVAUX_ACCELERES });
  const joursGagnes = JOURS_DE_FERMETURE - JOURS_DES_TRAVAUX_ACCELERES;
  // Le plus gros supplément que les jours gagnés paient : leur marge, à l'euro.
  const supplementMaximal = Math.max(0, Math.floor(trois.resultat + SUPPLEMENT_DES_TRAVAUX_ACCELERES - cinq.resultat + 1e-9));
  return {
    ...x,
    cinq,
    trois,
    joursGagnes,
    supplementMaximal,
    ecart: auCentime(trois.resultat - cinq.resultat),
    hausseDuSeuil: auCentime(trois.seuil - s.seuil),
    // L'erreur classique : les jours gagnés comptés en chiffre d'affaires, et non en marge.
    gainEnChiffreDAffaires: auCentime(joursGagnes * x.caParJour - SUPPLEMENT_DES_TRAVAUX_ACCELERES),
  };
}

export const FERME_POUR_TRAVAUX: Situation = {
  code: "ferme-pour-travaux",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["seuil-du-point-de-vente"],
  commanditaire: "Le gérant",
  titre: "Fermé pour travaux",
  accroche:
    "La boutique fermera quelques jours en début de mois pour des travaux, ou moins longtemps si elle paie un supplément. Le gérant veut savoir ce qu'il restera du résultat, quand elle recommencera à gagner, et quelle solution choisir.",
  objectifs: [
    "Calculer le taux de marge sur coût variable, le seuil de rentabilité et le point mort",
    "Calculer la marge et le résultat d'un mois amputé de quelques jours de vente",
    "Croiser des jours de vente gagnés et une charge fixe en plus, et dater les points morts",
    "Retrouver le supplément le plus élevé que des jours ouverts paient, et répondre au gérant",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SEUIL,
    pourquoi:
      "ce cas se joue dans la boutique du cours, MAILLE & CO, dont la simulation suit les ventes jour par jour : le même point de vente que son chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const r = fermePourTravaux(c);
        return [
          `« Nous fermerons les ${qte(JOURS_DE_FERMETURE)} premiers jours du mois prochain pour des travaux. L'entreprise propose aussi de faire le chantier en ${qte(JOURS_DES_TRAVAUX_ACCELERES)} jours, en travaillant le dimanche, pour ${eur(SUPPLEMENT_DES_TRAVAUX_ACCELERES)} de plus. Les ventes reprendront ensuite à leur rythme, mais le loyer et l'équipe, eux, ne s'arrêtent pas. Que restera-t-il du résultat, à partir de quel jour ${r.f.entreprise} gagnera-t-elle de l'argent, et que choisir ? »`,
          `Pas de cours cette fois : vous avez les chiffres d'un mois normal, et la méthode est celle du chapitre. Comptez un mois commercial de ${qte(r.jours)} jours, aux ventes régulières, et une composition des ventes qui ne change pas.`,
        ];
      },
      tableau: (c) => {
        const r = fermePourTravaux(c);
        return {
          titre: `Un mois normal · ${r.f.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Chiffre d'affaires du mois, hors taxes", valeurs: [eur(r.s.chiffreDAffaires)] },
            { libelle: "Coûts variables du mois", valeurs: [eur(r.s.coutsVariables)] },
            { libelle: "Charges fixes du mois", valeurs: [eur(r.s.chargesFixes)] },
            { libelle: "Travaux simples : jours fermés en début de mois", valeurs: [qte(JOURS_DE_FERMETURE)] },
            { libelle: "Travaux accélérés : jours fermés en début de mois", valeurs: [qte(JOURS_DES_TRAVAUX_ACCELERES)] },
            { libelle: "Travaux accélérés : supplément", valeurs: [eur(SUPPLEMENT_DES_TRAVAUX_ACCELERES)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le taux de marge sur coût variable, le seuil et le point mort d'un mois normal, le résultat et le point mort de chaque solution, le supplément le plus élevé que les jours gagnés paient, et votre réponse.",
    },
    {
      id: "un-mois-normal",
      type: "montants",
      titre: "Un mois normal",
      notions: ["contribution_margin", "breakeven", "dead_point"],
      question: () =>
        "Pour un mois normal, calculez la marge sur coût variable, son taux (au dixième), le seuil de rentabilité (à l'euro), puis le jour du point mort, arrondi au jour supérieur.",
      champs: (c) => {
        const r = fermePourTravaux(c);
        const s = r.s;
        return [
          { libelle: "Marge sur coût variable du mois", attendu: s.marge, calcul: `${eur(s.chiffreDAffaires)} − ${eur(s.coutsVariables)} = ${eur(s.marge)}` },
          { libelle: "Taux de marge sur coût variable (%)", attendu: r.tauxEnPourcent, tolerance: 0.1, calcul: `${eur(s.marge)} ÷ ${eur(s.chiffreDAffaires)} × 100 = ${pct(r.tauxEnPourcent)}` },
          { libelle: "Seuil de rentabilité", attendu: s.seuil, tolerance: 2, calcul: `${eur(s.chargesFixes)} ÷ ${pct(r.tauxEnPourcent)} = ${eur(s.seuil)}` },
          { libelle: "Point mort (jour du mois)", attendu: s.pointMort!, calcul: `${eur(s.seuil)} ÷ ${eur(s.chiffreDAffaires)} × ${qte(r.jours)} = ${qte(auCentime(r.pointMortExact))}, le ${qte(s.pointMort!)}` },
        ];
      },
      explication: (c) => {
        const r = fermePourTravaux(c);
        return [`Un mois normal, ${r.f.entreprise} couvre ses charges fixes le ${qte(r.s.pointMort!)} du mois ; les ventes des jours suivants font son bénéfice, ${eur(r.s.resultat)}.`];
      },
    },
    {
      id: "le-mois-des-travaux",
      type: "montants",
      titre: "Les travaux simples",
      notions: ["contribution_margin", "fixed_costs", "dead_point"],
      question: (c) => {
        const r = fermePourTravaux(c);
        return `Avec les travaux simples, la boutique ne vend que ${qte(r.jours - JOURS_DE_FERMETURE)} jours sur ${qte(r.jours)}. Calculez son chiffre d'affaires, sa marge sur coût variable (les coûts variables suivent les ventes), son résultat du mois, puis le jour de son point mort.`;
      },
      champs: (c) => {
        const r = fermePourTravaux(c);
        const ouverts = r.jours - JOURS_DE_FERMETURE;
        return [
          { libelle: "Chiffre d'affaires du mois des travaux", attendu: r.cinq.chiffreDAffaires, calcul: `${eur(r.s.chiffreDAffaires)} × ${qte(ouverts)} ÷ ${qte(r.jours)} = ${eur(r.cinq.chiffreDAffaires)}` },
          { libelle: "Marge sur coût variable des travaux simples", attendu: r.cinq.marge, tolerance: 1, calcul: `${eur(r.s.marge)} × ${qte(ouverts)} ÷ ${qte(r.jours)} = ${eur(r.cinq.marge)}` },
          { libelle: "Résultat des travaux simples", attendu: r.cinq.resultat, tolerance: 1, calcul: `${eur(r.cinq.marge)} − ${eur(r.s.chargesFixes)} = ${eur(r.cinq.resultat)}` },
          {
            libelle: "Point mort des travaux simples (jour du mois)",
            attendu: r.cinq.pointMort!,
            calcul: `${qte(JOURS_DE_FERMETURE)} jours fermés + ${qte(r.s.pointMort!)} jours de vente pour atteindre le seuil, qui ne bouge pas = le ${qte(r.cinq.pointMort!)}`,
          },
        ];
      },
      explication: (c) => {
        const r = fermePourTravaux(c);
        return [
          `Les ventes baissent de ${pct(Math.round((JOURS_DE_FERMETURE / r.jours) * 1000) / 10)}, mais le résultat passe de ${eur(r.s.resultat)} à ${eur(r.cinq.resultat)} : les charges fixes, ${eur(r.s.chargesFixes)}, se paient en entier, porte ouverte ou fermée. Le seuil ne bouge pas ; il faut toujours ${qte(r.s.pointMort!)} jours de vente pour l'atteindre, et ils commencent ${qte(JOURS_DE_FERMETURE)} jours plus tard.`,
        ];
      },
    },
    {
      id: "les-travaux-acceleres",
      type: "montants",
      titre: "Les travaux accélérés",
      notions: ["fixed_costs", "breakeven", "dead_point"],
      question: () =>
        `Avec les travaux accélérés, la boutique ne ferme que ${qte(JOURS_DES_TRAVAUX_ACCELERES)} jours, mais le supplément de ${eur(SUPPLEMENT_DES_TRAVAUX_ACCELERES)} s'ajoute aux charges fixes du mois. Calculez son résultat du mois, son seuil de rentabilité, puis le jour de son point mort (les ventes reprennent à leur rythme le ${qte(JOURS_DES_TRAVAUX_ACCELERES + 1)}).`,
      champs: (c) => {
        const r = fermePourTravaux(c);
        const ouverts = r.jours - JOURS_DES_TRAVAUX_ACCELERES;
        const venteAuSeuil = r.trois.pointMort! - JOURS_DES_TRAVAUX_ACCELERES;
        return [
          {
            libelle: "Résultat des travaux accélérés",
            attendu: r.trois.resultat,
            tolerance: 1,
            calcul: `${eur(r.s.marge)} × ${qte(ouverts)} ÷ ${qte(r.jours)} − (${eur(r.s.chargesFixes)} + ${eur(SUPPLEMENT_DES_TRAVAUX_ACCELERES)}) = ${eur(r.trois.marge)} − ${eur(r.trois.chargesFixes)} = ${eur(r.trois.resultat)}`,
          },
          { libelle: "Seuil des travaux accélérés", attendu: r.trois.seuil, tolerance: 3, calcul: `${eur(r.trois.chargesFixes)} ÷ ${pct(r.tauxEnPourcent)} = ${eur(r.trois.seuil)}` },
          {
            libelle: "Point mort des travaux accélérés (jour du mois)",
            attendu: r.trois.pointMort!,
            calcul: `${eur(r.trois.seuil)} ÷ ${eur(r.caParJour)} par jour = ${qte(auCentime(r.trois.seuil / r.caParJour))}, soit ${qte(venteAuSeuil)} jours de vente après ${qte(JOURS_DES_TRAVAUX_ACCELERES)} jours fermés : le ${qte(r.trois.pointMort!)}`,
          },
        ];
      },
      explication: (c) => {
        const r = fermePourTravaux(c);
        return [
          `Les travaux accélérés gagnent ${qte(r.joursGagnes)} jours de vente, mais le supplément fait monter le seuil de ${eur(r.hausseDuSeuil)}. Résultat : ${eur(r.trois.resultat)}, contre ${eur(r.cinq.resultat)} avec les travaux simples ; et le point mort tombe le ${qte(r.trois.pointMort!)} dans les deux cas.`,
        ];
      },
    },
    {
      id: "le-supplement-au-curseur",
      type: "curseur",
      titre: "Le supplément que les jours gagnés paient",
      notions: ["fixed_costs", "contribution_margin"],
      question: (c) => {
        const r = fermePourTravaux(c);
        return `Faites varier le supplément demandé pour les travaux accélérés. Une droite donne le résultat du mois avec ${qte(JOURS_DES_TRAVAUX_ACCELERES)} jours fermés et ce supplément, l'autre le résultat des travaux simples, ${eur(r.cinq.resultat)}. Placez le curseur sur le plus gros supplément, à l'euro, pour lequel les travaux accélérés font au moins aussi bien.`;
      },
      grandeur: () => ({ libelle: "Supplément des travaux accélérés", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: fermePourTravaux(c).supplementMaximal, min: SUPPLEMENT_DU_CURSEUR.min, max: SUPPLEMENT_DU_CURSEUR.max }),
      zones: ["Les travaux accélérés valent mieux", "Les travaux simples valent mieux"],
      rates: () => ({
        dessous: "Les travaux accélérés valent encore mieux à un supplément plus élevé : cherchez le plus gros.",
        dessus: "À ce supplément, les travaux accélérés font moins bien que les travaux simples.",
      }),
      montrer: "Montrer le supplément maximal",
      lecture: (c, x) => {
        const r = fermePourTravaux(c);
        const resultat = auCentime(r.trois.marge - r.s.chargesFixes - x);
        return [
          { libelle: "Marge des jours ouverts, travaux accélérés", montant: r.trois.marge },
          { libelle: "Charges fixes et supplément", montant: auCentime(r.s.chargesFixes + x) },
          { libelle: "Résultat des travaux accélérés", montant: resultat },
          { libelle: "Résultat des travaux simples", montant: r.cinq.resultat },
          { libelle: "Avantage des travaux accélérés", montant: auCentime(resultat - r.cinq.resultat), fort: true },
        ];
      },
      droites: (c) => {
        const r = fermePourTravaux(c);
        return { produit: (x) => r.trois.marge - r.s.chargesFixes - x, cout: () => r.cinq.resultat, libelles: ["Résultat des travaux accélérés", "Résultat des travaux simples"] };
      },
      explication: (c) => {
        const r = fermePourTravaux(c);
        return [
          `Jusqu'à ${eur(r.supplementMaximal)}, les travaux accélérés valent mieux : c'est la marge des ${qte(r.joursGagnes)} jours de vente gagnés, ${qte(r.joursGagnes)} × ${eur(r.margeParJour)}. Pas leur chiffre d'affaires, ${eur(auCentime(r.joursGagnes * r.caParJour))} : les articles vendus ces jours-là ont aussi un coût.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = fermePourTravaux(c);
        return [
          {
            texte: `Les travaux accélérés : ${eur(r.ecart)} de plus, au même point mort`,
            juste: true,
            retour: `Oui : ${eur(r.trois.resultat)} contre ${eur(r.cinq.resultat)}. Les ${qte(r.joursGagnes)} jours gagnés rapportent ${eur(r.supplementMaximal)} de marge, pour ${eur(SUPPLEMENT_DES_TRAVAUX_ACCELERES)} de supplément. Le point mort tombe le ${qte(r.trois.pointMort!)} dans les deux cas : il ne départage pas, le résultat si.`,
          },
          {
            texte: `Les travaux simples : le supplément ferait monter le seuil de ${eur(r.hausseDuSeuil)}`,
            juste: false,
            retour: `Le seuil monte bien, mais ce n'est pas le critère : avec ${qte(r.joursGagnes)} jours de vente en plus, la boutique dépasse ce seuil plus haut et gagne ${eur(r.ecart)} de plus.`,
          },
          {
            texte: `C'est égal : le point mort tombe le ${qte(r.cinq.pointMort!)} dans les deux cas`,
            juste: false,
            retour: `Non : le point mort dit quand la boutique commence à gagner, pas combien elle gagne. Les résultats diffèrent de ${eur(r.ecart)}.`,
          },
          {
            texte: `Les travaux accélérés : ${qte(r.joursGagnes)} jours de ventes en plus, ${eur(r.gainEnChiffreDAffaires)} gagnés`,
            juste: false,
            retour: `Non : c'est compter les jours gagnés en chiffre d'affaires. Ils rapportent leur marge, ${eur(r.supplementMaximal)}, et le gain net n'est que de ${eur(r.ecart)}.`,
          },
        ];
      },
    },
  ],
};
