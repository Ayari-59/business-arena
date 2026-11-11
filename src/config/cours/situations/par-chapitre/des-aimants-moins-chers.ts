import { arrondi2, eur, nombreAuCentieme } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_QUALITE_PILOTEE, ficheDe, qualiteDuChapitre } from "../../chapitres/piloter-la-qualite";
import { T_DE_LA_TABLE, arrondi, lectureDeLaTable } from "../../monde/loi-normale";
import { POIDS_D_UNE_ENCEINTE, intervalleDeConfiance } from "../../monde/qualite-de-la-ligne";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PILOTER LA QUALITÉ » : DES AIMANTS MOINS CHERS (contrôle de gestion,
 * palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : la ligne de NOVA, l'année N + 1, et le poids
 * de ses enceintes (monde/qualite-de-la-ligne.ts), calculés par la loi normale du cours.
 *
 * HYPOTHÈSES DU CAS : un nouveau fournisseur d'aimants propose ECONOMIE_PAR_ENCEINTE de moins par
 * enceinte. Un essai sur ESSAI_DES_AIMANTS.n enceintes donne leur poids moyen et l'écart-type de
 * l'essai. L'élève refait seul le chemin du chapitre : l'estimation de l'écart-type, l'intervalle de
 * confiance de la moyenne, la part hors tolérance une fois la machine recentrée, et ce qu'elle coûte.
 * La réponse demande un jugement : la moyenne se recentre d'un réglage, la dispersion non ; le surcoût
 * de la non-qualité dépasse l'économie.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la part hors tolérance est un coefficient au dix-millième, à
 * un dix-millième près ; l'écart-type, les bornes et les enceintes hors tolérance (une espérance)
 * sont des grandeurs au centième ; le coût des défauts attend le centime (à 300 € près, avant).
 */

/** L'économie promise par le nouveau fournisseur, par enceinte (hypothèse du cas). */
export const ECONOMIE_PAR_ENCEINTE = 0.5;

/** L'essai : les enceintes pesées, leur poids moyen et l'écart-type de l'essai, en grammes (hypothèse du cas). */
export const ESSAI_DES_AIMANTS = { n: 40, moyenne: 846, ecartTypeObserve: 11.85 } as const;

const qte = nombreAuCentieme;
const pr = (p: number) => (p + 0).toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const tt = (t: number) => (t + 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).replace(/^-/, "−");
const g = (x: number) => `${qte(x)} g`;
const auCentime = arrondi2;
/** Une probabilité lue à la table se donne au dix-millième, comme la table (au deux-millième près, avant). */
const TOLERANCE_D_UNE_PROBABILITE = 0.0001;

/** Les chiffres du cas. */
export function aimantsMoinsChers(c: Pick<Cas, "code">) {
  const x = qualiteDuChapitre(c);
  const f = ficheDe(c);
  const E = ESSAI_DES_AIMANTS;
  const P = POIDS_D_UNE_ENCEINTE;
  const s = arrondi(E.ecartTypeObserve * Math.sqrt(E.n / (E.n - 1)), 2);
  const ic = intervalleDeConfiance(E.moyenne, s, E.n, T_DE_LA_TABLE.centreA95);
  // La machine recentrée sur la cible, avec la dispersion des nouveaux aimants.
  const t = arrondi(P.tolerance / s, 2);
  const hors = arrondi(2 * (1 - lectureDeLaTable(t)), 4);
  const nombre = auCentime(x.volume * hors);
  const enPlus = auCentime(nombre - x.regle.nombre);
  const surcout = auCentime(enPlus * x.coutTout);
  const economie = auCentime(x.volume * ECONOMIE_PAR_ENCEINTE);
  return { x, f, E, P, s, ic, t, hors, nombre, enPlus, surcout, economie };
}

export const DES_AIMANTS_MOINS_CHERS: Situation = {
  code: "des-aimants-moins-chers",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["piloter-la-qualite"],
  commanditaire: "L'acheteur",
  titre: "Des aimants moins chers",
  accroche: `Un nouveau fournisseur propose des aimants moins chers. Un essai sur ${ESSAI_DES_AIMANTS.n} enceintes dit-il qu'ils tiennent le poids, et l'économie paie-t-elle la non-qualité ?`,
  objectifs: [
    "Estimer l'écart-type d'une production et encadrer sa moyenne par un intervalle de confiance",
    "Calculer la part hors tolérance qu'une dispersion plus forte laisse, même machine recentrée",
    "Comparer une économie d'achat au coût de la non-qualité, et rendre un avis",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_QUALITE_PILOTEE,
    pourquoi: "ce cas reprend le chapitre « Piloter la qualité », qui se joue sur la ligne de montage de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'acheteur",
      texte: (c) => {
        const n = aimantsMoinsChers(c);
        return [
          `« Un nouveau fournisseur me propose des aimants ${eur(ECONOMIE_PAR_ENCEINTE)} moins chers par enceinte, soit ${eur(n.economie)} sur l'année. Nous avons monté ${qte(n.E.n)} enceintes avec ses aimants, prises au hasard pendant l'essai. Est-ce que je signe ? »`,
          `Pas de cours cette fois : vous avez l'essai, le cahier des charges et ce que coûte un défaut chez ${n.x.f.entreprise}.`,
        ];
      },
      tableau: (c) => {
        const n = aimantsMoinsChers(c);
        return {
          titre: "L'essai des nouveaux aimants, et la ligne aujourd'hui",
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Enceintes pesées pendant l'essai", valeurs: [qte(n.E.n)] },
            { libelle: "Poids moyen de l'essai", valeurs: [g(n.E.moyenne)] },
            { libelle: "Écart-type des poids de l'essai", valeurs: [g(n.E.ecartTypeObserve)] },
            { libelle: "Poids au cahier des charges", valeurs: [`${g(n.P.cible)}, à ${g(n.P.tolerance)} près`] },
            { libelle: "Poids avec les aimants actuels", valeurs: [`loi normale N(${qte(n.P.cible)} ; ${qte(n.P.ecartType)})`] },
            { libelle: "Enceintes fabriquées dans l'année", valeurs: [qte(n.x.volume)] },
            { libelle: "Ce que coûte un défaut, ventes perdues comprises", valeurs: [eur(n.x.coutTout)] },
          ],
        };
      },
      repere: () => "À rendre : l'estimation de l'écart-type, l'intervalle de confiance du poids moyen, la part hors tolérance avec ces aimants, son coût, et votre réponse.",
    },
    {
      id: "l-estimation",
      type: "montants",
      titre: "Ce que dit l'essai",
      question: () => "Estimez l'écart-type du poids avec les nouveaux aimants, puis encadrez leur poids moyen par un intervalle de confiance à 95 %.",
      champs: (c) => {
        const n = aimantsMoinsChers(c);
        const t = T_DE_LA_TABLE.centreA95;
        return [
          { libelle: "Estimation de l'écart-type, en grammes", nature: "grandeur", attendu: n.s, calcul: `${qte(n.E.ecartTypeObserve)} × √(${qte(n.E.n)} ÷ ${qte(n.E.n - 1)}) = ${g(n.s)}` },
          { libelle: "Borne basse, en grammes", nature: "grandeur", attendu: arrondi(n.ic.bas, 2), calcul: `${qte(n.E.moyenne)} − ${tt(t)} × ${qte(n.s)} ÷ √${qte(n.E.n)} = ${g(arrondi(n.ic.bas, 2))}` },
          { libelle: "Borne haute, en grammes", nature: "grandeur", attendu: arrondi(n.ic.haut, 2), calcul: `${qte(n.E.moyenne)} + ${tt(t)} × ${qte(n.s)} ÷ √${qte(n.E.n)} = ${g(arrondi(n.ic.haut, 2))}` },
        ];
      },
      explication: (c) => {
        const n = aimantsMoinsChers(c);
        return [
          `La cible, ${g(n.P.cible)}, est au-dessus de l'intervalle : les nouveaux aimants sont plus légers. Ce n'est pas grave en soi, un réglage de la buse recentre la moyenne. Mais l'écart-type, ${g(n.s)}, dépasse celui d'aujourd'hui, ${g(n.P.ecartType)} : la dispersion, elle, ne se règle pas.`,
        ];
      },
    },
    {
      id: "la-non-qualite",
      type: "montants",
      titre: "La non-qualité des nouveaux aimants",
      question: (c) => {
        const n = aimantsMoinsChers(c);
        return `La buse est recentrée : le poids suivrait N(${qte(n.P.cible)} ; ${qte(n.s)}). Calculez la part hors tolérance, le nombre d'enceintes hors tolérance dans l'année, puis ce que les défauts en plus coûteraient par an.`;
      },
      champs: (c) => {
        const n = aimantsMoinsChers(c);
        return [
          { libelle: "Part hors tolérance", nature: "coefficient", attendu: n.hors, tolerance: TOLERANCE_D_UNE_PROBABILITE, calcul: `t = ${qte(n.P.tolerance)} ÷ ${qte(n.s)} = ${tt(n.t)} ; 2 × (1 − Π(${tt(n.t)})) = 2 × (1 − ${pr(lectureDeLaTable(n.t))}) = ${pr(n.hors)}` },
          { libelle: "Enceintes hors tolérance dans l'année", nature: "grandeur", attendu: n.nombre, calcul: `${qte(n.x.volume)} × ${pr(n.hors)} = ${qte(n.nombre)}` },
          { libelle: "Coût des défauts en plus, par an", attendu: n.surcout, calcul: `(${qte(n.nombre)} − ${qte(n.x.regle.nombre)}) × ${eur(n.x.coutTout)} = ${eur(n.surcout)}` },
        ];
      },
      explication: (c) => {
        const n = aimantsMoinsChers(c);
        return [`${qte(n.enPlus)} défauts de plus chaque année, ${eur(n.surcout)}, contre ${eur(n.economie)} d'économie sur les achats.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'acheteur",
      question: () => "Quelle réponse rendez-vous à l'acheteur ?",
      options: (c) => {
        const n = aimantsMoinsChers(c);
        const paie = n.economie > n.surcout;
        return [
          {
            texte: "Ne pas signer : la non-qualité coûterait plus que l'économie",
            juste: !paie,
            retour: `Oui. ${eur(n.surcout)} de défauts en plus contre ${eur(n.economie)} d'économie. Le prix d'achat ne dit pas tout du coût : il faudrait que le fournisseur tienne une dispersion d'aimants plus serrée, et le prouver par un nouvel essai.`,
          },
          {
            texte: `Signer : ${eur(n.economie)} d'économie, et un réglage de la buse recentre le poids`,
            juste: paie,
            retour: "Non : le réglage recentre la moyenne, mais il ne resserre pas la dispersion. C'est elle qui fait sortir les enceintes de la tolérance.",
          },
          {
            texte: `Refuser parce que le poids moyen de l'essai, ${g(n.E.moyenne)}, est sous la cible du cahier des charges`,
            juste: false,
            retour: "Non : la bonne réponse, mais pour une mauvaise raison. Une moyenne trop basse se corrige d'un réglage ; c'est la dispersion qui coûte, et c'est elle qu'il faut chiffrer.",
          },
        ];
      },
    },
  ],
};
