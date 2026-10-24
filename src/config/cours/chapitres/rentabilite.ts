import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";
import { bilanFonctionnel } from "./bilan-fonctionnel";
import { soldesDeGestion } from "./soldes-intermediaires";

/**
 * CHAPITRE : LA RENTABILITÉ (Bac STMG, gestion et finance, palier 1).
 *
 * Un bénéfice ne dit rien seul : 50 000 € sont beaucoup pour 100 000 € engagés, peu pour dix
 * millions. La rentabilité rapporte ce que l'entreprise gagne à l'argent engagé pour le gagner :
 * celui des associés (rentabilité financière), et tout ce que l'activité mobilise (rentabilité
 * économique). Le chapitre les compare ensuite au taux de l'emprunt de l'entreprise : ce que
 * gagne la banque, et ce que coûte un euro emprunté.
 *
 * Résultats de l'année (`soldesDeGestion`), bilan du 31 décembre et besoin en fonds de roulement
 * (`bilanFonctionnel`), taux de l'emprunt du cas : aucune hypothèse n'est ajoutée.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les deux rentabilités de l'année, et le taux de l'emprunt auquel les comparer. */
export function rentabilite(c: Cas) {
  const s = soldesDeGestion(c);
  const b = bilanFonctionnel(c);
  const capitauxPropres = b.fin.capitauxPropres;
  const capitauxInvestis = auCentime(b.fin.immobilisationsNettes + b.apres.bfr);
  return {
    resultatNet: s.resultatNet,
    resultatExploitation: s.resultatExploitation,
    capitauxPropres,
    immobilisations: b.fin.immobilisationsNettes,
    bfr: b.apres.bfr,
    capitauxInvestis,
    financiere: auDixieme((s.resultatNet / capitauxPropres) * 100),
    economique: auDixieme((s.resultatExploitation / capitauxInvestis) * 100),
    tauxDeLEmprunt: auDixieme(c.pret.tauxAnnuel * 100),
  };
}

export const RENTABILITE: Chapitre = {
  code: "rentabilite",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
  ],
  titre: "La rentabilité",
  accroche:
    "Un bénéfice ne dit rien seul : il faut le rapporter à l'argent engagé pour le gagner. Ce que rapporte l'argent des associés, ce que rapporte l'activité, et ce que coûte un euro emprunté.",
  objectifs: [
    "Distinguer bénéfice et rentabilité",
    "Calculer la rentabilité financière",
    "Calculer les capitaux investis et la rentabilité économique",
    "Comparer une rentabilité au taux d'un emprunt",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que rapporte l'argent engagé",
      notions: ["profitability_vs_return"],
      texte: (c) => {
        const r = rentabilite(c);
        return [
          `Sur l'année, ${c.entreprise} ${r.resultatNet >= 0 ? `gagne ${eur(r.resultatNet)}` : `perd ${eur(-r.resultatNet)}`}. Est-ce beaucoup ? Tout dépend de l'argent qu'il a fallu engager : les associés ont laissé ${eur(r.capitauxPropres)} dans l'entreprise, et l'activité mobilise son équipement et l'argent qui attend chez les clients et dans les stocks.`,
          "La rentabilité rapporte ce que l'on gagne à ce que l'on a engagé. Elle permet de comparer des entreprises de toutes tailles, et de dire si l'argent est bien placé.",
        ];
      },
      tableau: (c) => {
        const r = rentabilite(c);
        return {
          titre: "Les chiffres de l'année",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Résultat net (après intérêts et impôt)", valeurs: [eur(r.resultatNet)] },
            { libelle: "Résultat de l'activité (avant intérêts et impôt)", valeurs: [eur(r.resultatExploitation)] },
            { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(r.capitauxPropres)] },
            { libelle: "Équipement (valeur nette)", valeurs: [eur(r.immobilisations)] },
            { libelle: "Besoin en fonds de roulement (stocks et créances, moins dettes d'exploitation)", valeurs: [eur(r.bfr)] },
          ],
        };
      },
      repere: () => "Rentabilité financière = résultat net ÷ capitaux propres. Rentabilité économique = résultat de l'activité ÷ capitaux investis (équipement + besoin en fonds de roulement).",
    },
    {
      id: "calcul",
      type: "montants",
      titre: "Les deux rentabilités",
      notions: ["profitability_vs_return"],
      question: (c) => `Calculez la rentabilité financière ${dE(c.entreprise)} (résultat net ÷ capitaux propres × 100), les capitaux investis (équipement + besoin en fonds de roulement), puis la rentabilité économique (résultat de l'activité ÷ capitaux investis × 100). Les pourcentages au dixième.`,
      champs: (c) => {
        const r = rentabilite(c);
        return [
          { libelle: "Rentabilité financière (%)", attendu: r.financiere, calcul: `${eur(r.resultatNet)} ÷ ${eur(r.capitauxPropres)} × 100 = ${pct(r.financiere)}`, tolerance: 0.1 },
          { libelle: "Capitaux investis", attendu: r.capitauxInvestis, calcul: `${eur(r.immobilisations)} ${r.bfr < 0 ? `− ${eur(-r.bfr)}` : `+ ${eur(r.bfr)}`} = ${eur(r.capitauxInvestis)}`, tolerance: 1 },
          { libelle: "Rentabilité économique (%)", attendu: r.economique, calcul: `${eur(r.resultatExploitation)} ÷ ${eur(r.capitauxInvestis)} × 100 = ${pct(r.economique)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = rentabilite(c);
        return [
          `Pour 100 € laissés par les associés, ${c.entreprise} ${r.financiere >= 0 ? `a gagné ${pct(r.financiere).replace(" %", " €")}` : `a perdu ${pct(-r.financiere).replace(" %", " €")}`} cette année. Pour 100 € mobilisés par l'activité, elle ${r.economique >= 0 ? `en a tiré ${pct(r.economique).replace(" %", " €")}` : `en a perdu ${pct(-r.economique).replace(" %", " €")}`} avant intérêts et impôt.`,
          // Au-delà de 100 %, l'activité rapporte en un an plus que tout ce qu'elle mobilise.
          r.resultatExploitation > r.capitauxInvestis
            ? "En un an, l'activité rapporte plus que tout ce qu'elle mobilise : ses capitaux investis sont faibles, peu d'équipement et un besoin en fonds de roulement réduit."
            : "La première intéresse les associés ; la seconde juge l'activité elle-même, quelle que soit la façon dont elle est financée.",
        ];
      },
    },
    {
      id: "associes",
      type: "choix",
      titre: "Pour les associés",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const r = rentabilite(c);
        return `La banque prête à ${c.entreprise} au taux de ${pct(r.tauxDeLEmprunt)} par an : c'est ce que gagne un prêteur, avec peu de risque. Les associés, eux, ont obtenu ${pct(r.financiere)}. Que leur dire ?`;
      },
      options: (c) => {
        const r = rentabilite(c);
        const mieux = r.financiere > r.tauxDeLEmprunt;
        return [
          {
            texte: "Leur argent rapporte plus que s'ils l'avaient prêté",
            juste: mieux,
            retour: mieux
              ? `Oui : ${pct(r.financiere)} contre ${pct(r.tauxDeLEmprunt)}. Ils prennent plus de risques qu'un prêteur, et cette année ils en sont récompensés.`
              : `Non : ${pct(r.financiere)}, c'est moins que les ${pct(r.tauxDeLEmprunt)} d'un prêteur.`,
          },
          {
            texte: "Leur argent rapporte moins que s'ils l'avaient prêté",
            juste: !mieux,
            retour: !mieux
              ? `Oui : ${pct(r.financiere)} contre ${pct(r.tauxDeLEmprunt)} pour un prêteur, qui prend moins de risques. Une année ne suffit pas à juger, mais si cela dure, les associés chercheront à placer leur argent ailleurs.`
              : `Non : ${pct(r.financiere)}, c'est plus que les ${pct(r.tauxDeLEmprunt)} d'un prêteur.`,
          },
          {
            texte: "On ne peut pas comparer une rentabilité et un taux d'intérêt",
            juste: false,
            retour: "Si : l'une et l'autre disent ce que rapportent 100 € engagés pendant un an. C'est la comparaison que fait tout investisseur.",
          },
        ];
      },
    },
    {
      id: "emprunter",
      type: "choix",
      titre: "Emprunter pour investir",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const r = rentabilite(c);
        return `${c.entreprise} envisage d'emprunter à ${pct(r.tauxDeLEmprunt)} pour développer son activité, qui rapporte aujourd'hui ${pct(r.economique)} des capitaux investis. Si ce rendement se maintient, l'emprunt est-il une bonne idée ?`;
      },
      options: (c) => {
        const r = rentabilite(c);
        const bon = r.economique > r.tauxDeLEmprunt;
        return [
          {
            texte: "Oui : chaque euro investi rapporte plus qu'il ne coûte",
            juste: bon,
            retour: bon
              ? `Oui : l'euro emprunté coûte ${pct(r.tauxDeLEmprunt)} et l'activité en rapporte ${pct(r.economique)}. La différence revient aux associés : c'est l'intérêt de s'endetter quand l'activité est rentable.`
              : `Non : l'activité rapporte ${pct(r.economique)}, moins que les ${pct(r.tauxDeLEmprunt)} de l'emprunt.`,
          },
          {
            texte: "Non : chaque euro emprunté coûterait plus qu'il ne rapporte",
            juste: !bon,
            retour: !bon
              ? `Oui : l'activité rapporte ${pct(r.economique)}, l'emprunt coûte ${pct(r.tauxDeLEmprunt)}. ${r.economique > 0 ? "Chaque euro emprunté réduirait le bénéfice des associés : il faut d'abord rendre l'activité plus rentable." : "Emprunter creuserait les pertes : il faut d'abord rendre l'activité rentable."}`
              : `Non : l'activité rapporte ${pct(r.economique)}, plus que les ${pct(r.tauxDeLEmprunt)} de l'emprunt.`,
          },
          {
            texte: "Toujours : emprunter permet de grandir",
            juste: false,
            retour: "Non : grandir avec de l'argent emprunté ne rapporte que si l'activité rapporte plus que l'emprunt ne coûte. Sinon, l'entreprise grandit en perdant davantage.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["profitability_vs_return"],
      texte: (c) => {
        const r = rentabilite(c);
        return [
          `Chez ${c.entreprise}, la rentabilité financière est de ${pct(r.financiere)} et la rentabilité économique de ${pct(r.economique)}, pour un emprunt à ${pct(r.tauxDeLEmprunt)}.`,
          "Le bénéfice dit combien l'entreprise gagne ; la rentabilité dit si c'est beaucoup pour l'argent engagé. Et comparer la rentabilité de l'activité au coût de l'emprunt dit si s'endetter pour grandir enrichit les associés, ou les appauvrit.",
        ];
      },
      repere: () => "Emprunter pour investir est rentable si la rentabilité économique dépasse le taux de l'emprunt.",
    },
  ],
};
