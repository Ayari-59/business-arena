import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import {
  ECART_NEGLIGEABLE,
  LE_CLIENT_QUI_REVIENT,
  PART_DES_PLACES_OUVERTES,
  lesTravaux,
  tableauDesTravaux,
  travauxDuChapitre,
} from "../../chapitres/le-client-qui-revient";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE CLIENT QUI REVIENT ET LE CLIENT QUI PART » : LES TRAVAUX DE
 * L'ÉTÉ (Bac pro Métiers du commerce et de la vente, palier 2).
 *
 * Le chapitre a mesuré ce que coûtent des travaux au printemps : des adhérents refusés, qui ne
 * reviennent pas. La gérante peut les repousser à l'été, en fermant la même part de la salle.
 * L'élève lit l'année rejouée avec les travaux en été, refait les calculs du chapitre (les
 * refusés, les adhérents en moins, la marge perdue, le coût d'un refus), et répond.
 *
 * Le cas est neuf par sa question : le chapitre mesure un trimestre, le cas en compare deux. Les
 * chiffres sont ceux de `lesTravaux` (le chapitre) : l'arène rejoue l'année avec moins
 * d'abonnements proposés au seul trimestre des travaux (clé « le-client-qui-revient:… »), à la
 * même part des places que le chapitre. Le verdict se calcule : il suit la marge perdue.
 */

/** L'été : le troisième trimestre (hypothèse du cas). */
export const TRIMESTRE_DE_L_ETE = 3;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const T = (n: number) => `T${n}`;

export type QuandFaireLesTravaux = "ete" | "printemps" | "pareil";

/** Les travaux de l'été, ceux du printemps (le chapitre), et le trimestre qui coûte le moins. */
export function travauxDeLEte(c: Cas) {
  const ete = lesTravaux(c, TRIMESTRE_DE_L_ETE, PART_DES_PLACES_OUVERTES, "travaux-en-ete");
  const printemps = travauxDuChapitre(c);
  const ecart = ete.margePerdue - printemps.margePerdue;
  const quand: QuandFaireLesTravaux =
    Math.abs(ecart) <= ECART_NEGLIGEABLE * printemps.margePerdue ? "pareil" : ecart < 0 ? "ete" : "printemps";
  return { ete, printemps, ecart, quand };
}

export const LES_TRAVAUX_DE_L_ETE: Situation = {
  code: "les-travaux-de-l-ete",
  parcours: "vente",
  palier: 2,
  blocs: [],
  reprend: [LE_CLIENT_QUI_REVIENT.code],
  commanditaire: "La gérante de la salle",
  titre: "Les travaux de l'été",
  accroche:
    "Les travaux du printemps ont fait perdre des adhérents. La gérante peut les repousser à l'été. Lire l'année rejouée, compter les adhérents refusés et la marge perdue, et lui répondre.",
  objectifs: [
    "Compter les clients refusés faute de place",
    "Calculer la marge perdue sur l'année",
    "Comparer deux moments pour des travaux",
  ],
  libre: false,
  entreprises: LE_CLIENT_QUI_REVIENT.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      texte: (c) => {
        const k = travauxDeLEte(c);
        return [
          `« Au printemps, fermer un plateau nous a coûté ${eur(k.printemps.margePerdue)} de marge sur l'année. Je peux faire les travaux en été, au ${T(k.ete.trimestre)}, en n'accueillant toujours que ${pct(PART_DES_PLACES_OUVERTES)} des adhérents prévus : ${qte(k.ete.places)} au lieu de ${qte(k.ete.placesAvant)}. Est-ce que ça coûte moins cher ? »`,
          `Pas de cours cette fois. L'arène a rejoué l'année de ${c.entreprise} avec les travaux en été, avec les mêmes concurrents et la même façon de gérer.`,
        ];
      },
      repere: () => "À rendre : les adhérents refusés, la marge perdue sur l'année, et le meilleur moment pour les travaux.",
    },
    {
      id: "l-ete-rejoue",
      type: "montants",
      titre: "L'été rejoué",
      notions: ["capacity", "churn_rate"],
      tableau: (c) => tableauDesTravaux(c, travauxDeLEte(c).ete, "en été"),
      question: (c) => {
        const k = travauxDeLEte(c);
        return `D'après le tableau, calculez les adhérents refusés au ${T(k.ete.trimestre)}, les adhérents en moins à la fin de l'année, puis la marge perdue sur l'année.`;
      },
      champs: (c) => {
        const { ete: p } = travauxDeLEte(c);
        const t = p.trimestre - 1;
        const fin = p.reference.length - 1;
        return [
          {
            libelle: `Adhérents refusés au ${T(p.trimestre)}`,
            attendu: p.refuses,
            calcul: `${qte(p.reference[t]!.fin)} − ${qte(p.avec[t]!.fin)} = ${qte(p.refuses)}`,
            tolerance: 0,
          },
          {
            libelle: "Adhérents en moins à la fin de l'année",
            attendu: p.enMoinsALaFin,
            calcul: `${qte(p.reference[fin]!.fin)} − ${qte(p.avec[fin]!.fin)} = ${qte(p.enMoinsALaFin)}`,
            tolerance: 0,
          },
          {
            libelle: "Marge perdue sur l'année",
            attendu: p.margePerdue,
            calcul: `${eur(p.margeDeReference)} − ${eur(p.margeAvec)} = ${eur(p.margePerdue)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = travauxDeLEte(c);
        return [
          `En été, ${qte(k.ete.refuses)} adhérents ne trouvent pas de place, contre ${qte(k.printemps.refuses)} au printemps. ${
            k.ete.refuses < k.printemps.refuses ? "L'été, moins d'adhérents reviennent et peu de nouveaux s'inscrivent : la salle fermée en refuse moins." : "L'été ne vide pas assez la salle pour refuser moins d'adhérents."
          }`,
        ];
      },
    },
    {
      id: "un-refus",
      type: "montants",
      titre: "Ce que coûte un refus en été",
      notions: ["customer_lifetime_value"],
      question: (c) => {
        const { ete: p } = travauxDeLEte(c);
        return `Calculez la marge perdue par adhérent refusé en été (${eur(p.margePerdue)} pour ${qte(p.refuses)} adhérents refusés, au centime).`;
      },
      champs: (c) => {
        const { ete: p } = travauxDeLEte(c);
        return [{ libelle: "Marge perdue par adhérent refusé", attendu: p.parRefuse, calcul: `${eur(p.margePerdue)} ÷ ${qte(p.refuses)} = ${eur(p.parRefuse)}` }];
      },
      explication: (c) => {
        const { ete: p } = travauxDeLEte(c);
        return [
          p.verdict === "plus"
            ? `Un adhérent refusé en été coûte ${eur(p.parRefuse)}, plus qu'un trimestre de marge (${eur(p.margeDUnTrimestre)}) : lui non plus ne revient pas.`
            : `Un adhérent refusé en été coûte ${eur(p.parRefuse)}, pour ${eur(p.margeDUnTrimestre)} de marge sur un trimestre.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      notions: ["capacity"],
      question: (c) => {
        const k = travauxDeLEte(c);
        return `Les travaux coûtent ${eur(k.ete.margePerdue)} de marge sur l'année en été, ${eur(k.printemps.margePerdue)} au printemps. Quand faut-il les faire ?`;
      },
      options: (c) => {
        const k = travauxDeLEte(c);
        const faits = `En été, ${qte(k.ete.refuses)} adhérents refusés et ${eur(k.ete.margePerdue)} de marge perdue ; au printemps, ${qte(k.printemps.refuses)} refusés et ${eur(k.printemps.margePerdue)}.`;
        return [
          {
            texte: "En été, quand la salle est moins pleine",
            juste: k.quand === "ete",
            retour: k.quand === "ete" ? `Oui. ${faits} Fermer des places quand peu de clients les demandent, c'est perdre moins de clients.` : `Non. ${faits}`,
          },
          {
            texte: "Au printemps, quand les nouveaux arrivent",
            juste: k.quand === "printemps",
            retour: k.quand === "printemps" ? `Oui. ${faits}` : `Non. ${faits}${k.printemps.refuses > k.ete.refuses ? " Au printemps, la salle est plus demandée : les mêmes places fermées y refusent plus d'adhérents." : ""}`,
          },
          {
            texte: "C'est pareil : les mêmes places sont fermées",
            juste: k.quand === "pareil",
            retour: k.quand === "pareil" ? `Oui. ${faits}` : `Non. ${faits} Les mêmes places fermées ne refusent pas autant de clients selon la saison.`,
          },
        ];
      },
    },
  ],
};
