import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { PRODUIRE_BIEN, qualite } from "../../chapitres/produire-bien";
import { ficheDeNova, qualiteAuBudget } from "../../monde/production-et-logistique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PRODUIRE BIEN : LA QUALITÉ ET CE QU'ELLE COÛTE » : LA MOITIÉ DU
 * BUDGET QUALITÉ (bac STMG, management, palier 1).
 *
 * Le directeur financier de NOVA veut économiser : il propose de couper de moitié le budget de
 * prévention de l'année N + 1 (16 000 €). L'élève recalcule les défauts, ce qu'ils coûtent de plus,
 * les ventes que les clients déçus font perdre, et répond. Les chiffres sont ceux du chapitre
 * (monde/production-et-logistique.ts) ; seule la part du budget gardée est l'hypothèse du cas. Le
 * verdict se calcule sur l'écart de résultat.
 */

/** La part du budget de prévention que garde le directeur financier (hypothèse du cas). */
export const PART_DU_BUDGET_GARDEE = 0.5;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 1000) / 10).toLocaleString("fr-FR")} %`;
const c2 = (x: number) => Math.round(x * 100) / 100 + 0;

export type ReponseALaMoitie = "passer-a-la-moitie" | "ne-rien-changer";

/** Le cas : l'année au budget actuel et à la moitié, et ce que la coupe change au résultat. */
export function moitieDuBudget(c: Pick<Cas, "code">) {
  const actuel = qualite(c);
  const moitie = qualiteAuBudget(ficheDeNova(c), actuel.prevention * PART_DU_BUDGET_GARDEE);
  const economie = c2(actuel.prevention - moitie.prevention);
  const nonQualiteEnPlus = c2(moitie.nonQualite - actuel.nonQualite);
  const margePerdueEnPlus = c2(moitie.margePerdue - actuel.margePerdue);
  const ecart = c2(moitie.resultat - actuel.resultat);
  const reponse: ReponseALaMoitie = ecart > 0 ? "passer-a-la-moitie" : "ne-rien-changer";
  return { actuel, moitie, economie, nonQualiteEnPlus, margePerdueEnPlus, ecart, reponse };
}

export const LA_MOITIE_DU_BUDGET_QUALITE: Situation = {
  code: "la-moitie-du-budget-qualite",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: [PRODUIRE_BIEN.code],
  commanditaire: "Le directeur financier",
  titre: "La moitié du budget qualité",
  accroche: "Le directeur financier veut couper de moitié la prévention de la qualité. Ce que la coupe économise, ce que les défauts en plus coûtent, et votre réponse.",
  objectifs: ["Calculer les défauts d'une production à un autre budget de prévention", "Comparer une économie et le coût de la non-qualité qu'elle crée", "Répondre au directeur financier avec les chiffres"],
  libre: false,
  entreprises: PRODUIRE_BIEN.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur financier",
      texte: (c) => {
        const k = moitieDuBudget(c);
        return [
          `« La prévention de la qualité nous coûte ${eur(k.actuel.prevention)} par an. Passons à ${eur(k.moitie.prevention)} : c'est ${eur(k.economie)} d'économisés, et le contrôle final rattrapera les défauts. Ai-je raison ? »`,
          "Pas de cours cette fois : les coûts de la qualité sont ceux du chapitre. Le tableau donne le taux de défaut aux deux budgets.",
        ];
      },
      tableau: (c) => {
        const k = moitieDuBudget(c);
        const x = ficheDeNova(c);
        return {
          titre: `La qualité de ${c.entreprise}, l'année N + 1`,
          colonnes: ["Budget actuel", "La moitié"],
          lignes: [
            { libelle: "Budget de prévention de l'année", valeurs: [eur(k.actuel.prevention), eur(k.moitie.prevention)] },
            { libelle: "Taux de défaut", valeurs: [pct(k.actuel.tauxDeDefaut), pct(k.moitie.tauxDeDefaut)] },
            { libelle: `${c.unites[0]!.toUpperCase()}${c.unites.slice(1)} montées`, valeurs: [qte(k.actuel.volume), qte(k.moitie.volume)] },
            { libelle: "Part des défauts que le contrôle trouve", valeurs: [pct(x.qualite.controleFinal.tauxDeDetection), pct(x.qualite.controleFinal.tauxDeDetection)] },
            { libelle: "Retouche d'un défaut trouvé", valeurs: [eur(x.qualite.coutDUnDefautDetecte), eur(x.qualite.coutDUnDefautDetecte)] },
            { libelle: "Retour sous garantie d'un défaut parti", valeurs: [eur(x.qualite.coutDUnDefautLivre), eur(x.qualite.coutDUnDefautLivre)] },
          ],
        };
      },
      repere: () => "À rendre : les défauts à la moitié du budget, ce qu'ils coûtent de plus, et votre réponse.",
    },
    {
      id: "les-defauts",
      type: "montants",
      titre: "Les défauts à la moitié du budget",
      notions: ["variable_costs"],
      question: (c) => `À ${eur(moitieDuBudget(c).moitie.prevention)} de prévention, calculez les défauts de l'année, ceux qui partent chez le client, puis le coût de la non-qualité (retouches et retours).`,
      champs: (c) => {
        const x = ficheDeNova(c);
        const m = moitieDuBudget(c).moitie;
        return [
          { libelle: "Défauts de l'année", attendu: m.defauts, calcul: `${qte(m.volume)} × ${pct(m.tauxDeDefaut)} = ${qte(m.defauts)}`, tolerance: 0 },
          { libelle: "Défauts partis chez le client", attendu: m.livres, calcul: `${qte(m.defauts)} × (100 % − ${pct(m.tauxDeDetection)}) = ${qte(m.livres)}`, tolerance: 0 },
          {
            libelle: "Coût de la non-qualité",
            attendu: m.nonQualite,
            calcul: `${qte(m.detectes)} × ${eur(x.qualite.coutDUnDefautDetecte)} + ${qte(m.livres)} × ${eur(x.qualite.coutDUnDefautLivre)} = ${eur(m.nonQualite)}`,
          },
        ];
      },
      explication: (c) => {
        const k = moitieDuBudget(c);
        return [`Le contrôle trouve toujours la même part des défauts, mais il y en a plus : ${qte(k.moitie.livres - k.actuel.livres)} de plus partent chez un client.`];
      },
    },
    {
      id: "le-bilan",
      type: "montants",
      titre: "Ce que la coupe change au résultat",
      notions: ["variable_costs", "contribution_margin"],
      question: (c) => {
        const k = moitieDuBudget(c);
        return `Au budget actuel, la non-qualité coûte ${eur(k.actuel.nonQualite)} et les clients déçus font perdre ${eur(k.actuel.margePerdue)} de marge ; à la moitié, ils en font perdre ${eur(k.moitie.margePerdue)}. Calculez la non-qualité en plus, la marge perdue en plus, puis l'écart de résultat (économie, moins les deux).`;
      },
      champs: (c) => {
        const k = moitieDuBudget(c);
        return [
          { libelle: "Non-qualité en plus", attendu: k.nonQualiteEnPlus, calcul: `${eur(k.moitie.nonQualite)} − ${eur(k.actuel.nonQualite)} = ${eur(k.nonQualiteEnPlus)}` },
          { libelle: "Marge perdue en plus", attendu: k.margePerdueEnPlus, calcul: `${eur(k.moitie.margePerdue)} − ${eur(k.actuel.margePerdue)} = ${eur(k.margePerdueEnPlus)}` },
          { libelle: "Écart de résultat", attendu: k.ecart, calcul: `${eur(k.economie)} − ${eur(k.nonQualiteEnPlus)} − ${eur(k.margePerdueEnPlus)} = ${eur(k.ecart)}` },
        ];
      },
      explication: (c) => {
        const k = moitieDuBudget(c);
        return [k.ecart < 0 ? `La coupe économise ${eur(k.economie)}, mais les défauts en plus en coûtent davantage : le résultat baisse de ${eur(-k.ecart)}.` : `La coupe fait monter le résultat de ${eur(k.ecart)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      question: () => "Que répondez-vous au directeur financier ?",
      options: (c) => {
        const k = moitieDuBudget(c);
        const faits = `la coupe économise ${eur(k.economie)}, et le résultat ${k.ecart > 0 ? "monte" : "baisse"} de ${eur(Math.abs(k.ecart))}.`;
        return [
          { texte: "Couper : l'économie l'emporte", juste: k.reponse === "passer-a-la-moitie", retour: `${k.reponse === "passer-a-la-moitie" ? "Oui" : "Non"} : ${faits}` },
          {
            texte: "Garder le budget actuel",
            juste: k.reponse === "ne-rien-changer",
            retour: `${k.reponse === "ne-rien-changer" ? "Oui" : "Non"} : ${faits} Les défauts en plus coûtent des retouches, des retours et des clients.`,
          },
          { texte: "Couper : le contrôle final rattrapera tous les défauts", juste: false, retour: `Non : le contrôle ne trouve que ${pct(k.moitie.tauxDeDetection)} des défauts ; ${faits}` },
        ];
      },
    },
  ],
};
