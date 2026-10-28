import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_SEUIL, seuilDuMois } from "../../chapitres/seuil-de-rentabilite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE SEUIL DE RENTABILITÉ » : LE LOYER QUI AUGMENTE
 * (contrôle de gestion, palier 2).
 *
 * Au renouvellement du bail, le bailleur annonce une hausse du loyer : le loyer seul, pas toutes les
 * charges fixes (l'ancienne version du cas appliquait la hausse aux 31 183 € de charges fixes, comme
 * si le bail couvrait aussi la paie et l'usure de la ligne). Le dirigeant pose sa règle : les ventes
 * de janvier, son mois de référence, doivent toujours couvrir les charges fixes. L'élève refait seul
 * le chemin du chapitre (le nouveau seuil, la marge de sécurité qui reste), cherche au curseur le
 * loyer le plus haut que janvier peut porter, puis remonte à rebours la hausse et le prix qui
 * tiendraient. La réponse demande un jugement : signer, refuser ou négocier, et jusqu'où.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `seuilDuMois`, sur la fiche de NOVA.
 */

/** La hausse du loyer annoncée par le bailleur au renouvellement du bail (hypothèse du cours). */
export const HAUSSE_DU_LOYER = 0.12;

/** Les bornes du curseur du loyer, en euros par mois. */
export const LOYER_DU_CURSEUR = { min: 18_000, max: 24_000 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number, d = 2) => `${qte(t * 100, d)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);

export type Verdict = "negocier" | "signer";

/** Les chiffres de la réponse, calculés une fois sur la fiche. */
export function loyerQuiAugmente(c: Pick<Cas, "code">) {
  const x = seuilDuMois(c);
  const { s, ch, m } = x;
  const nouveauLoyer = auCentime(ch.loyer * (1 + HAUSSE_DU_LOYER));
  const hausse = auCentime(nouveauLoyer - ch.loyer);
  const nouvellesCharges = auCentime(s.chargesFixes + hausse);
  const seuilQuantite = plafond(nouvellesCharges / s.margeUnitaire);
  const seuilValeur = auCentime((nouvellesCharges * s.prix) / s.margeUnitaire);
  const resultat = auCentime(s.marge - nouvellesCharges);
  const margeDeSecurite = auCentime(s.chiffreDAffaires - seuilValeur);
  // Le loyer le plus haut que janvier porte : la marge, moins les autres charges fixes.
  const autresFixes = auCentime(s.chargesFixes - ch.loyer);
  const loyerMaximal = Math.floor(s.marge - autresFixes + 1e-9);
  const verdict: Verdict = nouveauLoyer > loyerMaximal ? "negocier" : "signer";
  return {
    x,
    nouveauLoyer,
    hausse,
    nouvellesCharges,
    seuilQuantite,
    seuilValeur,
    resultat,
    margeDeSecurite,
    indice: auCentime((margeDeSecurite / s.chiffreDAffaires) * 100),
    autresFixes,
    loyerMaximal,
    hausseMaximale: (loyerMaximal - ch.loyer) / ch.loyer,
    /** Le prix qui, aux ventes de janvier, paierait la hausse : au centime supérieur. */
    prixQuiTient: Math.ceil((s.coutVariableUnitaire + nouvellesCharges / m.quantite) * 100 - 1e-6) / 100,
    ventesEnPlus: plafond(hausse / s.margeUnitaire),
    verdict,
    /** L'erreur de l'ancienne version : la hausse appliquée à toutes les charges fixes. */
    seuilSurToutesLesCharges: plafond((s.chargesFixes * (1 + HAUSSE_DU_LOYER)) / s.margeUnitaire),
    /** L'erreur classique : diviser les charges par le prix, en oubliant les coûts variables. */
    seuilSurLePrix: plafond(nouvellesCharges / s.prix),
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
    "Au renouvellement du bail, le bailleur annonce une hausse du loyer. Avant de signer, le dirigeant veut savoir si les ventes de son mois de référence couvriront encore ses charges, et jusqu'où il peut accepter.",
  objectifs: [
    "Calculer le seuil de rentabilité en quantité et en valeur avec de nouvelles charges fixes",
    "Mesurer le résultat et la marge de sécurité qui restent",
    "Retrouver à rebours le loyer, la hausse et le prix qui tiendraient",
    "Rendre au dirigeant une réponse chiffrée qui tranche",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SEUIL,
    pourquoi: "ce cas reprend le chapitre « Le seuil de rentabilité », qui se calcule sur le mois de janvier de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => {
        const { x } = loyerQuiAugmente(c);
        return [
          `« Le bailleur nous annonce une hausse de ${pct(HAUSSE_DU_LOYER, 0)} du loyer au renouvellement du bail ; le reste de nos charges fixes ne bouge pas. Ma règle est simple : les ventes de janvier, notre mois de référence, doivent toujours couvrir nos charges. Avant de signer, je veux savoir combien ${x.f.entreprise} devra vendre chaque mois, ce qui nous restera de marge de sécurité, et jusqu'où je peux accepter une hausse. »`,
          "Pas de cours cette fois : vous avez les chiffres du mois, et la méthode est celle du chapitre. À vous d'en trouver l'ordre.",
        ];
      },
      tableau: (c) => {
        const { x } = loyerQuiAugmente(c);
        const { f, m, s, ch } = x;
        return {
          titre: `Les chiffres de janvier · ${f.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Prix de vente d'une ${f.unite}, hors taxes`, valeurs: [eur(m.prix)] },
            { libelle: `Coût variable d'une ${f.unite}`, valeurs: [eur(s.coutVariableUnitaire)] },
            { libelle: `${f.unites.charAt(0).toUpperCase()}${f.unites.slice(1)} vendues en janvier`, valeurs: [qte(m.quantite)] },
            { libelle: "Loyer du mois, aujourd'hui", valeurs: [eur(ch.loyer)] },
            { libelle: "Personnel du mois", valeurs: [eur(ch.personnel)] },
            { libelle: "Usure de la ligne de montage, du mois", valeurs: [eur(ch.amortissement)] },
            { libelle: "Hausse annoncée du loyer", valeurs: [pct(HAUSSE_DU_LOYER, 0)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le nouveau seuil en quantité et en valeur, le résultat et la marge de sécurité qui restent, le loyer le plus haut que janvier peut porter, et votre réponse.",
    },
    {
      id: "seuil",
      type: "montants",
      titre: "Le nouveau seuil",
      notions: ["breakeven", "fixed_costs"],
      question: () =>
        "Avec le nouveau loyer, quelles seront les charges fixes du mois ? À partir de combien d'unités vendues seront-elles couvertes, et pour quel chiffre d'affaires ?",
      champs: (c) => {
        const r = loyerQuiAugmente(c);
        const { s, ch, f } = r.x;
        return [
          {
            libelle: "Charges fixes avec le nouveau loyer",
            attendu: r.nouvellesCharges,
            calcul: `${eur(ch.loyer)} × (1 + ${pct(HAUSSE_DU_LOYER, 0)}) = ${eur(r.nouveauLoyer)} de loyer, plus ${eur(ch.personnel)} + ${eur(ch.amortissement)} = ${eur(r.nouvellesCharges)}`,
          },
          {
            libelle: `Seuil de rentabilité (${f.unites})`,
            attendu: r.seuilQuantite,
            tolerance: 1,
            calcul: `${eur(r.nouvellesCharges)} ÷ (${eur(s.prix)} − ${eur(s.coutVariableUnitaire)}) = ${qte(r.nouvellesCharges / s.margeUnitaire)}, arrondi à l'unité supérieure : ${qte(r.seuilQuantite)}`,
          },
          {
            libelle: "Seuil de rentabilité (chiffre d'affaires)",
            attendu: r.seuilValeur,
            tolerance: auCentime(r.seuilValeur * 0.005),
            calcul: `${eur(r.nouvellesCharges)} × ${eur(s.prix)} ÷ ${eur(s.margeUnitaire)} = ${eur(r.seuilValeur)}`,
          },
        ];
      },
      explication: (c) => {
        const r = loyerQuiAugmente(c);
        const { f, m } = r.x;
        return [
          `Le seuil passe de ${qte(r.x.seuilQuantite)} à ${qte(r.seuilQuantite)} ${f.unites} : ${qte(r.ventesEnPlus)} de plus à vendre chaque mois, rien que pour payer les ${eur(r.hausse)} de hausse. ${r.seuilQuantite > m.quantite ? `C'est plus que les ${qte(m.quantite)} vendues en janvier.` : `C'est encore sous les ${qte(m.quantite)} vendues en janvier.`}`,
        ];
      },
    },
    {
      id: "securite",
      type: "montants",
      titre: "Ce qui reste de sécurité",
      notions: ["safety_margin"],
      question: () =>
        "Aux ventes de janvier, quel serait le résultat du mois avec le nouveau loyer ? Quelle marge de sécurité resterait-il, en euros, puis en pourcentage du chiffre d'affaires, au centième ? Un résultat négatif dit que le seuil n'est pas atteint.",
      champs: (c) => {
        const r = loyerQuiAugmente(c);
        const { s } = r.x;
        return [
          { libelle: "Résultat de janvier avec le nouveau loyer", attendu: r.resultat, calcul: `${eur(s.marge)} − ${eur(r.nouvellesCharges)} = ${eur(r.resultat)}` },
          { libelle: "Marge de sécurité", attendu: r.margeDeSecurite, tolerance: auCentime(r.seuilValeur * 0.005), calcul: `${eur(s.chiffreDAffaires)} − ${eur(r.seuilValeur)} = ${eur(r.margeDeSecurite)}` },
          { libelle: "Indice de sécurité (%)", attendu: r.indice, tolerance: 0.1, calcul: `${eur(r.margeDeSecurite)} ÷ ${eur(s.chiffreDAffaires)} = ${qte(r.indice)} %` },
        ];
      },
      explication: (c) => {
        const r = loyerQuiAugmente(c);
        return [
          r.resultat < 0
            ? `Janvier passerait en perte, de ${eur(-r.resultat)} seulement : la hausse coûte ${eur(r.hausse)} par mois, et le mois n'avait que ${eur(r.x.s.resultat)} de bénéfice pour l'absorber. La règle du dirigeant n'est plus tenue.`
            : `Janvier resterait en bénéfice, de ${eur(r.resultat)} : la règle du dirigeant est tenue.`,
        ];
      },
    },
    {
      id: "le-loyer-au-curseur",
      type: "curseur",
      titre: "Le loyer, au curseur",
      notions: ["fixed_costs", "breakeven"],
      question: (c) => {
        const r = loyerQuiAugmente(c);
        return `Faites varier le loyer du mois de ${eur(LOYER_DU_CURSEUR.min)} à ${eur(LOYER_DU_CURSEUR.max)}, le personnel et l'usure restant les mêmes. Une droite donne la marge sur coût variable de janvier (${eur(r.x.s.marge)}), l'autre toutes les charges fixes. Placez le curseur sur le loyer le plus haut que janvier peut porter sans perte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Loyer du mois", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: loyerQuiAugmente(c).loyerMaximal, min: LOYER_DU_CURSEUR.min, max: LOYER_DU_CURSEUR.max }),
      zones: ["Janvier couvre ses charges", "Janvier en perte"],
      rates: () => ({
        dessous: "Janvier peut encore porter un loyer plus haut : cherchez le plus grand.",
        dessus: "À ce loyer, la marge de janvier ne couvre plus les charges fixes.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, loyer) => {
        const r = loyerQuiAugmente(c);
        const fixes = auCentime(loyer + r.autresFixes);
        return [
          { libelle: "Marge sur coût variable de janvier", montant: r.x.s.marge },
          { libelle: "Charges fixes, ce loyer compris", montant: fixes },
          { libelle: "Résultat de janvier", montant: auCentime(r.x.s.marge - fixes), fort: true },
        ];
      },
      droites: (c) => {
        const r = loyerQuiAugmente(c);
        return { produit: () => r.x.s.marge, cout: (loyer) => loyer + r.autresFixes, libelles: ["Marge sur coût variable de janvier", "Charges fixes, ce loyer compris"] };
      },
      explication: (c) => {
        const r = loyerQuiAugmente(c);
        return [
          `Janvier porte un loyer de ${eur(r.loyerMaximal)} au plus : ${eur(r.x.s.marge)} de marge moins ${eur(r.autresFixes)} de personnel et d'usure. Le bailleur en demande ${eur(r.nouveauLoyer)}, ${eur(auCentime(r.nouveauLoyer - r.loyerMaximal))} de trop.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Ce qui tiendrait, à rebours",
      notions: ["breakeven", "contribution_margin"],
      question: () =>
        "Remontez à ce que la règle du dirigeant permet : la hausse de loyer la plus forte que janvier peut porter, en pourcentage, au dixième ; puis, si la hausse annoncée était signée, le prix de vente le plus bas qui paierait les charges aux ventes de janvier, au centime supérieur, et les ventes en plus qu'il faudrait chaque mois au prix d'aujourd'hui.",
      champs: (c) => {
        const r = loyerQuiAugmente(c);
        const { s, ch, m } = r.x;
        return [
          {
            libelle: "Hausse maximale du loyer (%)",
            attendu: auCentime(Math.round(r.hausseMaximale * 1000) / 10),
            tolerance: 0.1,
            calcul: `(${eur(r.loyerMaximal)} − ${eur(ch.loyer)}) ÷ ${eur(ch.loyer)} = ${pct(r.hausseMaximale)}, soit le résultat de janvier, ${eur(s.resultat)}, rapporté au loyer`,
          },
          {
            libelle: "Prix de vente qui paierait la hausse",
            attendu: r.prixQuiTient,
            calcul: `${eur(s.coutVariableUnitaire)} + ${eur(r.nouvellesCharges)} ÷ ${qte(m.quantite)} = ${eur(s.coutVariableUnitaire)} + ${qte(r.nouvellesCharges / m.quantite, 4)} €, au centime supérieur ${eur(r.prixQuiTient)}`,
          },
          {
            libelle: "Ventes en plus chaque mois, au prix d'aujourd'hui",
            attendu: r.ventesEnPlus,
            tolerance: 1,
            calcul: `${eur(r.hausse)} de hausse ÷ ${eur(s.margeUnitaire)} de marge = ${qte(r.hausse / s.margeUnitaire)}, arrondi à ${qte(r.ventesEnPlus)}`,
          },
        ];
      },
      explication: (c) => {
        const r = loyerQuiAugmente(c);
        const { f, m } = r.x;
        return [
          `La règle du dirigeant tient jusqu'à ${pct(r.hausseMaximale, 1)} de hausse, et le bailleur en demande ${pct(HAUSSE_DU_LOYER, 0)}. L'écart paraît mince : ${eur(auCentime(r.prixQuiTient - m.prix))} de plus sur le prix d'une ${f.unite}, ou ${qte(r.ventesEnPlus)} ${f.unites} de plus par mois. Mais la marge de sécurité, elle, aurait disparu.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["breakeven", "safety_margin"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: (c) => {
        const r = loyerQuiAugmente(c);
        const { f, s } = r.x;
        return [
          {
            texte: `Négocier : au-delà de ${eur(r.loyerMaximal)} de loyer, janvier passe sous le seuil`,
            juste: r.verdict === "negocier",
            retour: `Oui. Avec ${eur(r.nouveauLoyer)} de loyer, le seuil monte à ${qte(r.seuilQuantite)} ${f.unites} pour ${qte(r.x.m.quantite)} vendues en janvier, et le mois perd ${eur(-r.resultat)}. Votre règle tient jusqu'à ${eur(r.loyerMaximal)}, soit ${pct(r.hausseMaximale, 1)} de hausse : c'est le plafond à négocier.`,
          },
          {
            texte: `Signer : la hausse ne nous coûte que ${eur(Math.abs(r.resultat))} par mois`,
            juste: false,
            retour: `Non : ${eur(Math.abs(r.resultat))}, c'est le résultat de janvier après la hausse. La hausse coûte ${eur(r.hausse)} par mois ; elle efface les ${eur(s.resultat)} de bénéfice, et un peu plus.`,
          },
          {
            texte: `Refuser : il faudrait ${qte(r.seuilSurToutesLesCharges)} ${f.unites} par mois, hors de portée`,
            juste: false,
            retour: `Non : c'est appliquer la hausse à toutes les charges fixes, alors qu'elle ne touche que le loyer. Le seuil monte à ${qte(r.seuilQuantite)} ${f.unites}, pas à ${qte(r.seuilSurToutesLesCharges)}.`,
          },
          {
            texte: `Signer : ${qte(r.seuilSurLePrix)} ${f.unites} suffisent à couvrir nos charges, bien sous nos ventes`,
            juste: false,
            retour: `Non : le prix ne reste pas en entier pour payer les charges fixes. Chaque vente coûte d'abord ${eur(s.coutVariableUnitaire)} ; c'est la marge, ${eur(s.margeUnitaire)}, qui les paie.`,
          },
        ];
      },
    },
  ],
};
