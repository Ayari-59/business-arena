import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { chiffresDeGestion } from "../../chapitres/seuil-de-rentabilite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE SEUIL DE RENTABILITÉ » : LE LOYER QUI AUGMENTE
 * (contrôle de gestion, palier 2).
 *
 * Le bailleur annonce une hausse des charges fixes. Le dirigeant demande, avant de
 * signer, à partir de combien de ventes l'entreprise couvrira ses charges, et ce qui
 * lui restera de marge de sécurité. L'élève a les chiffres du mois et refait seul le
 * chemin du chapitre : la marge sur coût variable, le seuil en quantité et en valeur,
 * la marge de sécurité, puis la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : les charges fixes ne sont plus celles du
 * chapitre. Les autres chiffres sont ceux du mois du cas (`cas.ts`).
 */

/**
 * La hausse des charges fixes annoncée : 12 %, l'ordre de grandeur d'un loyer
 * renégocié à l'échéance d'un bail commercial, assurance et entretien compris.
 */
export const HAUSSE_DES_CHARGES_FIXES = 0.12;

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function loyerQuiAugmente(c: Cas) {
  const g = chiffresDeGestion(c);
  const nouvellesCharges = auCentime(g.chargesFixes * (1 + HAUSSE_DES_CHARGES_FIXES));
  // Même règle que le chapitre : le seuil en quantité s'arrondit à l'unité
  // supérieure, celui en valeur se calcule sur le taux de marge.
  const seuilQuantite = Math.ceil(nouvellesCharges / g.margeUnitaire - 1e-9);
  const seuilValeur = auCentime(nouvellesCharges / g.taux);
  const margeDeSecurite = auCentime(g.chiffreDAffaires - seuilValeur);
  return {
    ...g,
    nouvellesCharges,
    seuilQuantite,
    seuilValeur,
    margeDeSecurite,
    indice: auCentime((margeDeSecurite / g.chiffreDAffaires) * 100),
    unitesEnPlus: seuilQuantite - g.seuilQuantite,
    couvert: g.quantite >= seuilQuantite,
    // L'erreur classique : diviser les charges par le prix, en oubliant les coûts variables.
    seuilSurLePrix: Math.ceil(nouvellesCharges / g.prixMoyen - 1e-9),
  };
}

export const LE_LOYER_QUI_AUGMENTE: Situation = {
  code: "le-loyer-qui-augmente",
  parcours: "controle-de-gestion",
  palier: 2,
  blocs: [],
  reprend: ["seuil-de-rentabilite"],
  commanditaire: "Le dirigeant",
  titre: "Le loyer qui augmente",
  accroche:
    "Le bailleur annonce une hausse des charges fixes. Avant de signer, le dirigeant veut savoir combien il faudra vendre pour ne pas perdre d'argent.",
  objectifs: [
    "Calculer la marge sur coût variable d'une unité et son taux",
    "Calculer le seuil de rentabilité en quantité et en valeur avec de nouvelles charges fixes",
    "Mesurer la marge de sécurité qui reste",
    "Rédiger une réponse chiffrée au dirigeant",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => [
        `« Le bailleur nous annonce une hausse de ${pct(HAUSSE_DES_CHARGES_FIXES)} de nos charges fixes au renouvellement. Avant de signer, je veux savoir combien ${c.entreprise} devra vendre chaque mois pour couvrir ses charges, et ce qui nous restera de marge de sécurité avec les ventes d'aujourd'hui. »`,
        "Pas de cours cette fois : vous avez les chiffres du mois, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const r = loyerQuiAugmente(c);
        return {
          titre: `Les chiffres du mois · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Prix de vente moyen, hors taxes (${c.unite})`, valeurs: [eur(r.prixMoyen)] },
            { libelle: "Coût variable par unité", valeurs: [eur(r.coutVariableUnitaire)] },
            { libelle: "Unités vendues dans le mois", valeurs: [qte(r.quantite)] },
            { libelle: "Chiffre d'affaires du mois", valeurs: [eur(r.chiffreDAffaires)] },
            { libelle: "Charges fixes du mois, aujourd'hui", valeurs: [eur(r.chargesFixes)] },
            { libelle: "Hausse annoncée des charges fixes", valeurs: [pct(HAUSSE_DES_CHARGES_FIXES)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la marge sur coût variable, le nouveau seuil en quantité et en valeur, la marge de sécurité, et votre réponse.",
    },
    {
      id: "marge",
      type: "montants",
      titre: "La marge sur coût variable",
      notions: ["breakeven"],
      question: () =>
        "Ce qui reste d'une vente pour payer les charges fixes : la marge sur coût variable d'une unité, puis son taux en pourcentage, au centième.",
      champs: (c) => {
        const r = loyerQuiAugmente(c);
        return [
          { libelle: "Marge sur coût variable d'une unité", attendu: r.margeUnitaire, calcul: `${eur(r.prixMoyen)} − ${eur(r.coutVariableUnitaire)} = ${eur(r.margeUnitaire)}` },
          { libelle: "Taux de marge sur coût variable (%)", attendu: auCentime(r.taux * 100), tolerance: 0.01, calcul: `${eur(r.margeUnitaire)} ÷ ${eur(r.prixMoyen)} × 100 = ${auCentime(r.taux * 100).toLocaleString("fr-FR")} %` },
        ];
      },
      explication: (c) => {
        const r = loyerQuiAugmente(c);
        return [
          `La hausse ne touche pas la marge d'une unité : ${eur(r.margeUnitaire)} restent de chaque vente, comme avant. Elle change seulement ce qu'il faut couvrir.`,
        ];
      },
    },
    {
      id: "seuil",
      type: "montants",
      titre: "Le nouveau seuil",
      notions: ["breakeven"],
      question: () =>
        "Avec la hausse, quelles seront les charges fixes du mois ? À partir de combien d'unités vendues seront-elles couvertes (à l'unité supérieure), et pour quel chiffre d'affaires ?",
      champs: (c) => {
        const r = loyerQuiAugmente(c);
        return [
          { libelle: "Charges fixes après la hausse", attendu: r.nouvellesCharges, calcul: `${eur(r.chargesFixes)} × (1 + ${pct(HAUSSE_DES_CHARGES_FIXES)}) = ${eur(r.nouvellesCharges)}` },
          { libelle: "Seuil de rentabilité (unités)", attendu: r.seuilQuantite, calcul: `${eur(r.nouvellesCharges)} ÷ ${eur(r.margeUnitaire)}, arrondi à l'unité supérieure = ${qte(r.seuilQuantite)}` },
          { libelle: "Seuil de rentabilité (chiffre d'affaires)", attendu: r.seuilValeur, tolerance: Math.max(1, r.seuilValeur * 0.005), calcul: `${eur(r.nouvellesCharges)} ÷ ${pct(r.taux)} ≈ ${eur(r.seuilValeur)}` },
        ];
      },
      explication: (c) => {
        const r = loyerQuiAugmente(c);
        return [
          `Le seuil passe de ${qte(r.seuilQuantite - r.unitesEnPlus)} à ${qte(r.seuilQuantite)} ${c.unites} : ${qte(r.unitesEnPlus)} de plus à vendre chaque mois, rien que pour payer la hausse.`,
        ];
      },
    },
    {
      id: "securite",
      type: "montants",
      titre: "La marge de sécurité",
      notions: ["breakeven"],
      question: () =>
        "Avec le chiffre d'affaires d'aujourd'hui, quelle marge de sécurité restera-t-il, en euros, et en pourcentage du chiffre d'affaires, au centième ? Un résultat négatif dit que le seuil n'est pas atteint.",
      champs: (c) => {
        const r = loyerQuiAugmente(c);
        return [
          { libelle: "Marge de sécurité", attendu: r.margeDeSecurite, tolerance: Math.max(1, Math.abs(r.seuilValeur) * 0.005), calcul: `${eur(r.chiffreDAffaires)} − ${eur(r.seuilValeur)} = ${eur(r.margeDeSecurite)}` },
          { libelle: "Indice de sécurité (%)", attendu: r.indice, tolerance: 0.1, calcul: `${eur(r.margeDeSecurite)} ÷ ${eur(r.chiffreDAffaires)} × 100 = ${r.indice.toLocaleString("fr-FR")} %` },
        ];
      },
      explication: (c) => {
        const r = loyerQuiAugmente(c);
        return [
          r.couvert
            ? `${c.entreprise} resterait au-dessus de son seuil : ses ventes pourraient baisser de ${r.indice.toLocaleString("fr-FR")} % avant qu'elle ne perde de l'argent.`
            : `${c.entreprise} serait sous son seuil : avec les ventes d'aujourd'hui, la hausse la met en perte.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      question: () => "Quelle phrase envoyez-vous au dirigeant ?",
      options: (c) => {
        const r = loyerQuiAugmente(c);
        const juste = r.couvert
          ? `Nous couvrirons la hausse : le seuil passe à ${qte(r.seuilQuantite)} ${c.unites}, sous nos ventes`
          : `La hausse nous met sous le seuil : il faudrait ${qte(r.seuilQuantite)} ${c.unites} par mois`;
        return [
          {
            texte: juste,
            juste: true,
            retour: `Oui : ${eur(r.nouvellesCharges)} de charges fixes à couvrir avec ${eur(r.margeUnitaire)} de marge par unité donnent ${qte(r.seuilQuantite)} ${c.unites}, quand ${c.entreprise} en compte ${qte(r.quantite)} aujourd'hui.`,
          },
          {
            texte: `Il en faudra ${qte(r.seuilSurLePrix)} par mois : les nouvelles charges divisées par le prix`,
            juste: false,
            retour: `Non : le prix ne reste pas en entier pour payer les charges fixes. Chaque vente coûte d'abord ${eur(r.coutVariableUnitaire)} ; c'est la marge, ${eur(r.margeUnitaire)}, qui les paie.`,
          },
          {
            texte: "Rien ne change pour notre seuil tant que le prix et les coûts variables restent les mêmes",
            juste: false,
            retour: "Non : la marge d'une unité ne bouge pas, mais elle doit couvrir des charges fixes plus lourdes. Le seuil monte.",
          },
        ];
      },
    },
  ],
};
