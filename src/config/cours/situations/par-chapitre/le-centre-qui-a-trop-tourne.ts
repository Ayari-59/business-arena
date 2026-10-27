import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_CONTROLE_BUDGETAIRE, HEURES_DU_CURSEUR, centreDeMontage, tableauDuCentre } from "../../chapitres/les-ecarts-sur-charges-indirectes";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES ÉCARTS SUR CHARGES INDIRECTES » : LE CENTRE QUI A TROP TOURNÉ
 * (contrôle de gestion, palier 4).
 *
 * Le centre de montage de l'usine a coûté 11 000 € de plus que le coût préétabli de la production
 * réelle. Son responsable l'explique par le surcroît d'heures : le centre a tourné au-delà de son
 * activité normale. Le directeur de l'usine veut savoir, avant de valider cette explication, ce que
 * le volume explique vraiment. L'élève décompose l'écart (budget, activité, rendement), puis croise
 * l'activité et le rendement : sans une seule heure perdue, que resterait-il du dépassement ? La
 * réponse demande un jugement : le volume a joué pour le centre, pas contre lui. Un curseur sur les
 * heures-machine, à dépense égale, montre avant le calcul qu'aucun volume n'absorbait le dépassement.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `centreDeMontage`. L'explication du responsable est une hypothèse de
 * l'histoire : le modèle ne connaît pas les causes, seulement les écarts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const auCentime = (x: number) => Math.round(x * 100) / 100;

export type Verdict = "le-volume-n-explique-pas" | "le-volume-explique";

/** Les chiffres du cas, et ce qu'ils disent de l'explication du responsable. */
export function centreQuiATropTourne(c: Pick<Cas, "code">) {
  const x = centreDeMontage(c);
  // L'explication tient si, sans heure perdue, il ne restait presque rien du dépassement.
  const verdict: Verdict = x.depassementSansLesPerdues > 0 && x.activite <= 0 ? "le-volume-n-explique-pas" : "le-volume-explique";
  return {
    x,
    verdict,
    /** L'erreur du responsable : les heures en plus au coût standard complet, part fixe comprise. */
    heuresEnPlusAuStandard: auCentime(x.auDelaDeLaNormale * x.cHm),
    /** L'erreur de signe : les heures en plus additionnées en rendement et en activité, sans leur signe. */
    sansLesSignes: auCentime(x.rendement + Math.abs(x.activite)),
  };
}

export const LE_CENTRE_QUI_A_TROP_TOURNE: Situation = {
  code: "le-centre-qui-a-trop-tourne",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["les-ecarts-sur-charges-indirectes"],
  commanditaire: "Le directeur de l'usine",
  titre: "Le centre qui a trop tourné",
  accroche:
    "Le centre de montage a dépassé son coût préétabli, et son responsable met le dépassement sur le compte des heures en plus. Avant de valider l'explication, le directeur veut savoir ce que le volume explique vraiment.",
  objectifs: [
    "Calculer l'activité préétablie de la production réelle et les heures perdues",
    "Décomposer l'écart d'un centre en écart sur budget, sur activité et sur rendement",
    "Croiser l'écart sur activité et l'écart sur rendement pour isoler ce que le volume explique",
    "Répondre au directeur, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_CONTROLE_BUDGETAIRE,
    pourquoi: "ce cas reprend le chapitre « Les écarts sur charges indirectes », qui se calcule sur la production de l'usine du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "L'explication du responsable",
      tableau: tableauDuCentre,
      texte: (c) => {
        const { x } = centreQuiATropTourne(c);
        return [
          `« Le centre de montage a coûté ${eur(x.coutReel)} pour une production qui en valait ${eur(x.preetabliDeLaProduction)} au coût préétabli : ${eur(x.global)} de dépassement. Son responsable m'explique que c'est le volume : le centre a tourné ${qte(x.heuresReelles)} heures-machine au lieu des ${qte(x.k.activiteNormale)} de l'activité normale. Avant de valider son explication, je veux savoir ce que le volume explique vraiment dans ce dépassement. »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre. L'explication du responsable est une hypothèse : les écarts disent où chercher, pas la cause.",
        ];
      },
      repere: () =>
        "À rendre : les heures que la production demandait, les trois écarts du centre, ce qui resterait du dépassement sans heure perdue, et votre réponse. Un écart, c'est le réel moins le prévu ; sur une charge, positif est défavorable.",
    },
    {
      id: "les-heures",
      type: "montants",
      titre: "Les heures que la production demandait",
      notions: ["standard_costing", "efficiency_variance"],
      question: () => "Combien d'heures-machine la production réelle demandait-elle au standard, et combien d'heures le centre a-t-il tournées en trop ?",
      champs: (c) => {
        const { x } = centreQuiATropTourne(c);
        return [
          {
            libelle: "Activité préétablie de la production réelle",
            attendu: x.heuresPreetablies,
            calcul: `${x.parModele.map((m) => `${qte(m.quantite)} × ${qte(m.parUnite)}`).join(" + ")} = ${qte(x.heuresPreetablies)}`,
          },
          { libelle: "Heures-machine perdues", attendu: x.perdues, calcul: `${qte(x.heuresReelles)} − ${qte(x.heuresPreetablies)} = ${qte(x.perdues)}` },
        ];
      },
      explication: (c) => {
        const { x } = centreQuiATropTourne(c);
        return [
          `Des ${qte(x.auDelaDeLaNormale)} heures-machine au-delà de l'activité normale, la production n'en demandait que ${qte(x.utiles)} : les ${qte(x.perdues)} autres sont des heures que la production n'a pas justifiées.`,
        ];
      },
    },
    {
      id: "les-trois-ecarts",
      type: "montants",
      titre: "Les trois écarts du centre",
      notions: ["cost_variance", "fixed_costs", "efficiency_variance"],
      question: () => "Décomposez le dépassement en écart sur budget, écart sur activité et écart sur rendement. Négatif pour un écart favorable.",
      champs: (c) => {
        const { x } = centreQuiATropTourne(c);
        return [
          {
            libelle: "Écart sur budget",
            attendu: x.budget,
            calcul: `${eur(x.coutReel)} − (${eur(x.k.chargesFixes)} + ${eur(x.k.coutVariableParHeure)} × ${qte(x.heuresReelles)}) = ${eur(x.coutReel)} − ${eur(x.budgetFlexible)} = ${eur(x.budget)}`,
          },
          { libelle: "Écart sur activité", attendu: x.activite, calcul: `${eur(x.budgetFlexible)} − ${qte(x.heuresReelles)} × ${eur(x.cHm)} = ${eur(x.activite)}` },
          { libelle: "Écart sur rendement", attendu: x.rendement, calcul: `(${qte(x.heuresReelles)} − ${qte(x.heuresPreetablies)}) × ${eur(x.cHm)} = ${eur(x.rendement)}` },
        ];
      },
      explication: (c) => {
        const { x } = centreQuiATropTourne(c);
        return [
          `${eur(x.budget)} + ${entre(x.activite)} + ${eur(x.rendement)} = ${eur(x.global)} : c'est bien le dépassement. L'écart sur activité, celui du volume, est ${x.activite < 0 ? "favorable" : "défavorable"}.`,
        ];
      },
    },
    {
      id: "le-volume-au-curseur",
      type: "curseur",
      titre: "Le volume, au curseur",
      notions: ["cost_variance", "efficiency_variance"],
      question: (c) => {
        const { x } = centreQuiATropTourne(c);
        return `Gardez la dépense du centre au-delà de son budget flexible (${eur(x.budget)}) et faites varier ses heures-machine. Combien d'heures, au plus, le centre pouvait-il tourner sans dépasser le coût préétabli de la production réelle (${eur(x.preetabliDeLaProduction)}) ? Placez le curseur sur le plus grand nombre, puis validez.`;
      },
      grandeur: () => ({ libelle: "Heures-machine du centre", unite: "heures-machine" }),
      sens: "plus-grande",
      cible: (c) => {
        const { x } = centreQuiATropTourne(c);
        return { attendu: x.heuresSansDepasserAvecLeBudget, min: HEURES_DU_CURSEUR.min, max: HEURES_DU_CURSEUR.max };
      },
      zones: ["Dans le coût préétabli", "Au-delà du coût préétabli"],
      rates: () => ({
        dessous: "Le centre peut encore tourner plus sans dépasser : cherchez le plus grand nombre d'heures.",
        dessus: "À cette position, le centre dépasse déjà le coût préétabli de la production réelle.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, h) => {
        const { x } = centreQuiATropTourne(c);
        const cout = auCentime(x.k.chargesFixes + x.k.coutVariableParHeure * h + x.budget);
        return [
          { libelle: "Coût du centre, à la même dépense", montant: cout },
          { libelle: "Coût préétabli de la production réelle", montant: x.preetabliDeLaProduction },
          { libelle: "Dépassement", montant: auCentime(cout - x.preetabliDeLaProduction), fort: true },
        ];
      },
      droites: (c) => {
        const { x } = centreQuiATropTourne(c);
        return {
          produit: () => x.preetabliDeLaProduction,
          cout: (h) => x.k.chargesFixes + x.k.coutVariableParHeure * h + x.budget,
          libelles: ["Coût préétabli de la production réelle", "Coût du centre, à la même dépense"],
        };
      },
      explication: (c) => {
        const { x } = centreQuiATropTourne(c);
        return [
          `Avec sa dépense au-delà du budget flexible, le centre n'aurait tenu son coût préétabli qu'en tournant ${qte(x.heuresSansDepasserAvecLeBudget)} heures-machine au plus : moins que les ${qte(x.heuresPreetablies)} que la production demandait. Aucun volume ne pouvait absorber cette dépense.`,
        ];
      },
    },
    {
      id: "sans-les-heures-perdues",
      type: "montants",
      titre: "Le dépassement sans heure perdue",
      notions: ["cost_variance", "fixed_costs", "efficiency_variance"],
      question: () =>
        "Supposez que le centre n'ait tourné que les heures que la production demandait, avec la même dépense au-delà de son budget flexible. Calculez l'écart sur activité à ce niveau, le coût du centre, puis le dépassement qui resterait face au coût préétabli de la production réelle. Négatif pour un écart favorable.",
      champs: (c) => {
        const { x } = centreQuiATropTourne(c);
        return [
          {
            libelle: "Écart sur activité aux seules heures de la production",
            attendu: x.activiteSansLesPerdues,
            calcul: `(${qte(x.k.activiteNormale)} − ${qte(x.heuresPreetablies)}) × ${eur(x.partFixe)} = ${eur(x.activiteSansLesPerdues)}`,
          },
          {
            libelle: "Coût du centre à ces heures",
            attendu: x.coutSansLesPerdues,
            calcul: `${eur(x.k.chargesFixes)} + ${eur(x.k.coutVariableParHeure)} × ${qte(x.heuresPreetablies)} + ${eur(x.budget)} d'écart sur budget = ${eur(x.coutSansLesPerdues)}`,
          },
          {
            libelle: "Dépassement restant",
            attendu: x.depassementSansLesPerdues,
            calcul: `${eur(x.coutSansLesPerdues)} − ${eur(x.preetabliDeLaProduction)} = ${eur(x.depassementSansLesPerdues)}, soit ${eur(x.budget)} + ${entre(x.activiteSansLesPerdues)}`,
          },
        ];
      },
      explication: (c) => {
        const { x } = centreQuiATropTourne(c);
        return [
          `Sans une seule heure perdue, il resterait ${eur(x.depassementSansLesPerdues)} de dépassement sur ${eur(x.global)}. Les heures perdues ne coûtent en net que leur coût variable, ${eur(x.coutNetDesPerdues)} : leur part fixe, comptée dans l'écart sur rendement, revient en écart sur activité favorable.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur",
      notions: ["cost_variance", "fixed_costs"],
      question: () => "Le volume explique-t-il le dépassement du centre ? Quelle réponse rendez-vous au directeur ?",
      options: (c) => {
        const k = centreQuiATropTourne(c);
        const x = k.x;
        const chiffres = `Écart sur budget ${eur(x.budget)}, sur activité ${eur(x.activite)}, sur rendement ${eur(x.rendement)}.`;
        return [
          {
            texte: `Non : sans aucune heure perdue, il resterait ${eur(x.depassementSansLesPerdues)} de dépassement, une dépense du centre`,
            juste: k.verdict === "le-volume-n-explique-pas",
            retour:
              k.verdict === "le-volume-n-explique-pas"
                ? `Oui. ${chiffres} Le volume a joué pour le centre : ses charges fixes se sont réparties sur plus d'heures. Le dépassement vient d'abord de l'écart sur budget, ${eur(x.budget)}, dont le responsable du centre doit répondre ; puis des ${qte(x.perdues)} heures perdues, qui ne coûtent en net que ${eur(x.coutNetDesPerdues)} et relèvent de l'atelier.`
                : `Non. ${chiffres}`,
          },
          {
            texte: `Oui : ${qte(x.auDelaDeLaNormale)} heures-machine de plus au coût standard de ${eur(x.cHm)} font ${eur(k.heuresEnPlusAuStandard)}, l'essentiel du dépassement`,
            juste: false,
            retour: `Non : c'est valoriser des heures en plus à leur coût complet, comme si les charges fixes suivaient les heures. Le budget flexible donne déjà aux heures réelles leur coût variable ; et le coût préétabli de la production réelle accepte les ${qte(x.utiles)} heures que la production demandait. ${chiffres}`,
          },
          {
            texte: `En partie : le volume explique ${eur(Math.abs(x.activite))} du dépassement, le reste vient de l'écart sur budget`,
            juste: false,
            retour: `Non : c'est lire l'écart à l'envers. L'écart sur activité est de ${eur(x.activite)}, ${x.activite < 0 ? "favorable" : "défavorable"} : sur une charge, négatif veut dire que le volume a réduit le dépassement, pas qu'il l'a causé.`,
          },
          {
            texte: `Oui : les heures en plus pèsent ${eur(x.rendement)} de rendement et ${eur(Math.abs(x.activite))} d'activité, soit ${eur(k.sansLesSignes)}`,
            juste: false,
            retour: `Non : c'est additionner des écarts sans leur signe. ${eur(x.rendement)} + ${entre(x.activite)} = ${eur(auCentime(x.rendement + x.activite))} : une partie de ce que l'écart sur rendement compte revient en écart sur activité favorable.`,
          },
        ];
      },
    },
  ],
};
