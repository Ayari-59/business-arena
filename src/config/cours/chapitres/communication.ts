import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accord } from "../accords";
import { campagnesRejouees } from "../campagne";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : CE QUE RAPPORTE LA COMMUNICATION (Bac STMG, mercatique, palier 1).
 *
 * La publicité coûte tout de suite ; elle rapporte si elle fait vendre assez pour se payer.
 * L'arène rejoue le premier trimestre à cinq budgets (`campagne.ts`) : le chapitre lit ce que la
 * campagne fait vendre, calcule ce que coûte chaque vente gagnée et ce que la campagne rapporte
 * une fois payée, cherche le meilleur budget, et explique pourquoi chaque euro de plus rapporte
 * de moins en moins.
 *
 * Il se joue là où les ventes répondent au budget : dans les entreprises que leur production
 * limite déjà, ou dont la publicité se décide produit par produit, le budget rejoué ne fait pas
 * vendre davantage (`COMMUNICATIONS`). Aucune hypothèse n'est ajoutée.
 */

/** Les entreprises dont les ventes répondent au budget de communication rejoué par l'arène. */
export const COMMUNICATIONS = ["nova", "hotel", "bistrot", "ecommerce", "fitness"] as const;

const qte = (n: number) => n.toLocaleString("fr-FR");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les cinq budgets rejoués, et ce que la campagne du trimestre rapporte. */
export function communication(c: Cas) {
  const v = campagnesRejouees(c.code);
  const sans = v[0]!;
  const jouee = v.find((x) => x.facteur === 1)!;
  const ventesEnPlus = jouee.commandes - sans.commandes;
  const margeEnPlus = jouee.marge - sans.marge;
  const meilleur = v.reduce((a, b) => (b.resultat > a.resultat ? b : a));
  const derniers = v.slice(-2);
  const plafond = derniers[1]!.commandes === derniers[0]!.commandes;
  return {
    budgets: v,
    sans,
    jouee,
    ventesEnPlus,
    coutParVente: auCentime(jouee.budget / ventesEnPlus),
    margeEnPlus,
    gain: margeEnPlus - jouee.budget,
    meilleur,
    plafond,
    ventesDuPlafond: derniers[1]!.commandes,
  };
}

export const COMMUNICATION: Chapitre = {
  code: "ce-que-rapporte-la-communication",
  parcours: "stmg",
  palier: 1,
  blocs: [
    "STMG Thème 3 · La communication de l'offre",
    "BUT TC · Communiquer l'offre commerciale",
  ],
  titre: "Ce que rapporte la communication",
  accroche:
    "La publicité coûte tout de suite, et ne rapporte que si elle fait vendre assez. Combien coûte chaque vente gagnée, et jusqu'où vaut-il la peine de dépenser ?",
  objectifs: [
    "Mesurer les ventes qu'apporte une campagne",
    "Calculer le coût d'une vente gagnée par la communication",
    "Calculer ce que rapporte une campagne une fois payée",
    "Choisir un budget de communication",
    "Expliquer pourquoi chaque euro de plus rapporte de moins en moins",
  ],
  libre: false,
  entreprises: {
    codes: COMMUNICATIONS,
    pourquoi: "ce chapitre mesure ce que la publicité fait vendre, et ailleurs l'arène limite déjà les ventes par la production ou décide la publicité produit par produit.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Cinq budgets pour un même trimestre",
      notions: ["customer_acquisition_cost"],
      texte: (c) => {
        const k = communication(c);
        return [
          `Au premier trimestre, ${c.entreprise} dépense ${eur(k.jouee.budget)} en communication. L'arène a rejoué ce trimestre à cinq budgets, de zéro au double, sans rien changer d'autre : ni le prix, ni la qualité, ni les concurrents.`,
          "Le tableau dit ce que chaque budget fait vendre, la marge que laissent ces ventes, et le résultat une fois la publicité payée.",
        ];
      },
      tableau: (c) => {
        const k = communication(c);
        return {
          titre: "Le premier trimestre, rejoué à cinq budgets",
          colonnes: k.budgets.map((b) => eur(b.budget)),
          lignes: [
            { libelle: `Ventes (${c.unites})`, valeurs: k.budgets.map((b) => qte(b.commandes)) },
            { libelle: "Marge sur les ventes", valeurs: k.budgets.map((b) => eur(b.marge)) },
            { libelle: "Résultat", valeurs: k.budgets.map((b) => eur(b.resultat)) },
          ],
        };
      },
      repere: () => "Coût d'une vente gagnée = budget de communication ÷ ventes en plus. Une campagne rapporte si la marge en plus dépasse son budget.",
    },
    {
      id: "rentabilite",
      type: "montants",
      titre: "Ce que rapporte la campagne",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => {
        const k = communication(c);
        return `Comparez le trimestre sans communication et le trimestre joué (${eur(k.jouee.budget)}). Calculez les ventes en plus, le coût de chaque vente gagnée, puis ce que la campagne rapporte une fois payée (marge en plus moins budget).`;
      },
      champs: (c) => {
        const k = communication(c);
        return [
          { libelle: "Ventes en plus", attendu: k.ventesEnPlus, calcul: `${qte(k.jouee.commandes)} − ${qte(k.sans.commandes)} = ${qte(k.ventesEnPlus)}` },
          { libelle: "Coût d'une vente gagnée", attendu: k.coutParVente, calcul: `${eur(k.jouee.budget)} ÷ ${qte(k.ventesEnPlus)} = ${eur(k.coutParVente)}` },
          { libelle: "Gain de la campagne", attendu: k.gain, calcul: `(${eur(k.jouee.marge)} − ${eur(k.sans.marge)}) − ${eur(k.jouee.budget)} = ${eur(k.gain)}` },
        ];
      },
      explication: (c) => {
        const k = communication(c);
        return [
          k.gain > 0
            ? `La campagne fait vendre ${qte(k.ventesEnPlus)} ${c.unites} de plus, à ${eur(k.coutParVente)} ${accord(c, "chacun")} en publicité ; leur marge paie la campagne et laisse ${eur(k.gain)} de plus. Ici, la communication rapporte.`
            : `La campagne fait vendre ${qte(k.ventesEnPlus)} ${c.unites} de plus, à ${eur(k.coutParVente)} ${accord(c, "chacun")} en publicité ; leur marge ne paie pas la campagne : ${eur(-k.gain)} de perte.`,
        ];
      },
    },
    {
      id: "meilleur-budget",
      type: "choix",
      titre: "Le meilleur budget",
      notions: ["customer_acquisition_cost"],
      question: (c) => `Parmi les cinq budgets rejoués, lequel donne à ${c.entreprise} le meilleur résultat ?`,
      options: (c) => {
        const k = communication(c);
        return k.budgets.map((b) => ({
          texte: eur(b.budget),
          juste: b.facteur === k.meilleur.facteur,
          retour:
            b.facteur === k.meilleur.facteur
              ? `Oui : ${eur(b.resultat)} de résultat, le meilleur des cinq. ${b.facteur > 1 ? "Dépenser plus que le budget joué aurait rapporté davantage." : b.facteur < 1 ? "Dépenser moins aurait rapporté davantage : le budget joué était trop élevé." : "Le budget joué était le bon."}`
              : `Non : ${eur(b.resultat)} de résultat, contre ${eur(k.meilleur.resultat)} à ${eur(k.meilleur.budget)}.`,
        }));
      },
    },
    {
      id: "rendements",
      type: "choix",
      titre: "Pourquoi chaque euro rapporte moins",
      notions: ["customer_acquisition_cost", "capacity"],
      question: (c) => `D'un budget à l'autre, les ventes ${dE(c.entreprise)} montent de moins en moins. Pourquoi ?`,
      options: (c) => {
        const k = communication(c);
        return [
          {
            texte: "L'entreprise ne peut plus servir davantage de clients",
            juste: k.plafond,
            retour: k.plafond
              ? `Oui : aux deux plus gros budgets, les ventes restent à ${qte(k.ventesDuPlafond)}. ${c.entreprise} a atteint ce qu'elle peut servir : la publicité attire encore des clients, mais ils repartent sans être servis. Communiquer ne sert à rien si l'offre ne suit pas.`
              : `Non : les ventes montent encore au plus gros budget ; ${c.entreprise} peut servir davantage.`,
          },
          {
            texte: "Les clients les plus faciles à convaincre l'ont déjà été",
            juste: !k.plafond,
            retour: !k.plafond
              ? "Oui : la première publicité touche les clients prêts à acheter ; chaque euro de plus va chercher des clients plus difficiles, et en convainc moins. C'est ce qu'on appelle des rendements décroissants."
              : "Pas seulement : ici, l'entreprise ne peut plus servir davantage de clients, quel que soit le budget.",
          },
          {
            texte: "La publicité finit par faire fuir les clients",
            juste: false,
            retour: `Non : les ventes ne baissent jamais quand le budget monte ; elles montent de moins en moins${k.plafond ? ", puis s'arrêtent" : ""}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_acquisition_cost"],
      texte: (c) => {
        const k = communication(c);
        return [
          `Chez ${c.entreprise}, la campagne du trimestre fait vendre ${qte(k.ventesEnPlus)} ${c.unites} de plus, à ${eur(k.coutParVente)} ${accord(c, "chacun")}, et le meilleur des cinq budgets est ${eur(k.meilleur.budget)}.`,
          "Une campagne se juge sur ce qu'elle fait vendre en plus, pas sur ce qu'elle coûte seule ni sur les ventes totales. Et chaque euro de plus rapporte moins que le précédent : le bon budget est celui au-delà duquel un euro de publicité ne se paie plus.",
          "L'arène ne compte ni les personnes touchées ni les clics : la portée et le coût pour mille contacts, que suit une vraie campagne, n'y existent pas.",
        ];
      },
      repere: () => "Une communication est rentable si la marge des ventes qu'elle apporte dépasse son coût.",
    },
  ],
};
