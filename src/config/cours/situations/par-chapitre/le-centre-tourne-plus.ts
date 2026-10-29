import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_ECARTS, budgetsDeLUsine } from "../../chapitres/le-cout-preetabli-et-les-budgets";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE BUDGET FLEXIBLE ET LE CHOIX DU STANDARD » (contrôle de gestion,
 * palier 4).
 *
 * Au trimestre suivant, le centre de montage tourne `ACTIVITE_DU_CAS` heures-machine, au-dessus de
 * son activité normale. Le chef du centre se félicite d'un écart favorable. L'élève refait le calcul
 * du chapitre (`budgetsDeLUsine` : charges fixes, coût variable par heure, coût standard de
 * l'heure-machine) : le budget flexible, le coût préétabli de l'activité, leur différence, l'écart
 * sur activité.
 */

/** L'ACTIVITÉ DU CENTRE AU TRIMESTRE SUIVANT (hypothèse du cas) : 5 600 heures-machine. */
export const ACTIVITE_DU_CAS = 5_600;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

export function leCentreTournePlus() {
  const b = budgetsDeLUsine({ code: "nova" });
  const c = b.f.centre;
  const budgetFlexible = auCentime(c.chargesFixes + c.coutVariableParHeure * ACTIVITE_DU_CAS);
  const preetabli = auCentime(b.cHm * ACTIVITE_DU_CAS);
  const ecartSurActivite = auCentime(budgetFlexible - preetabli);
  return { b, c, budgetFlexible, preetabli, ecartSurActivite, favorable: ecartSurActivite < 0 };
}

export const LE_CENTRE_TOURNE_PLUS: Situation = {
  code: "le-centre-tourne-plus",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["le-budget-flexible"],
  commanditaire: "Le contrôleur de gestion",
  titre: "Le centre tourne plus",
  accroche: "Le centre de montage dépasse son activité normale : son budget flexible, son coût préétabli, et ce que vaut l'écart dont se félicite son chef.",
  objectifs: ["Construire le budget flexible d'un centre à une autre activité", "Calculer le coût préétabli de cette activité et l'écart sur activité", "Dire ce qu'un écart sur activité favorable mesure"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_ECARTS, pourquoi: "ce cas reprend le centre de montage de l'usine de NOVA, celui du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du contrôleur de gestion",
      texte: () => {
        const k = leCentreTournePlus();
        return [
          `« Ce trimestre, le centre de ${k.c.nom.toLowerCase()} a tourné ${qte(ACTIVITE_DU_CAS)} heures-machine, pour une activité normale de ${qte(k.c.activiteNormale)}. Son chef parle d'un écart favorable. Que vaut-il ? » Le contrôleur de gestion`,
          `Pas de cours cette fois : les charges fixes du centre sont de ${eur(k.c.chargesFixes)}, son coût variable de ${eur(k.c.coutVariableParHeure)} par heure, et l'heure-machine coûte ${eur(k.b.cHm)} au standard.`,
        ];
      },
      repere: () => "À rendre : le budget flexible, le coût préétabli de l'activité, l'écart sur activité (négatif s'il est favorable), et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Le centre à son activité réelle",
      notions: ["standard_costing", "fixed_costs"],
      question: () => "Calculez le budget flexible du centre à cette activité, son coût préétabli, puis l'écart sur activité, budget flexible moins coût préétabli (négatif s'il est favorable).",
      champs: () => {
        const k = leCentreTournePlus();
        return [
          { libelle: "Budget flexible du centre", attendu: k.budgetFlexible, calcul: `${eur(k.c.chargesFixes)} + ${eur(k.c.coutVariableParHeure)} × ${qte(ACTIVITE_DU_CAS)} = ${eur(k.budgetFlexible)}` },
          { libelle: "Coût préétabli de l'activité", attendu: k.preetabli, calcul: `${eur(k.b.cHm)} × ${qte(ACTIVITE_DU_CAS)} = ${eur(k.preetabli)}` },
          { libelle: "Écart sur activité", attendu: k.ecartSurActivite, calcul: `${eur(k.budgetFlexible)} − ${eur(k.preetabli)} = ${eur(k.ecartSurActivite)}` },
        ];
      },
      explication: () => {
        const k = leCentreTournePlus();
        return [`Le coût préétabli impute ${eur(k.b.fixesParHeure)} de charges fixes à chaque heure ; le budget flexible garde les ${eur(k.c.chargesFixes)}. Au-dessus de l'activité normale, l'écart est favorable : ${eur(k.ecartSurActivite)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au contrôleur",
      question: () => "Que répondez-vous au contrôleur de gestion ?",
      options: () => {
        const k = leCentreTournePlus();
        return [
          {
            texte: "Favorable, mais les fixes n'ont pas baissé : ils sont mieux absorbés",
            juste: k.favorable,
            retour: `Oui : ${eur(-k.ecartSurActivite)} d'écart favorable, parce que les charges fixes se répartissent sur plus d'heures. Le centre n'a rien dépensé de moins ; il a mieux employé sa capacité.`,
          },
          {
            texte: "Favorable : le centre a dépensé moins que prévu, son chef mérite une prime sur cet écart",
            juste: false,
            retour: "Non : l'écart sur activité ne mesure pas une économie de dépense, et l'activité dépend surtout des ventes, que le chef du centre ne décide pas.",
          },
          {
            texte: "Défavorable : plus d'heures, c'est plus de charges variables, donc un écart à surveiller",
            juste: false,
            retour: "Non : les charges variables suivent l'activité dans les deux budgets. L'écart sur activité ne porte que sur les fixes, mieux absorbés au-dessus de l'activité normale.",
          },
        ];
      },
    },
  ],
};
