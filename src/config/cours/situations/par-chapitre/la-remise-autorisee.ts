import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { NEGOCIATIONS, negociation } from "../../chapitres/negocier-le-prix";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « NÉGOCIER LE PRIX » : LA REMISE AUTORISÉE
 * (BTS NDRC, palier 2).
 *
 * La directrice commerciale veut fixer, une fois pour toutes, la remise que ses
 * commerciaux peuvent accorder sans lui en référer. Sa règle : aucune affaire ne doit
 * laisser moins d'un bénéfice minimal sur son coût complet. L'élève refait seul le
 * chemin du chapitre : le coût complet d'une unité, le prix plancher que la règle en
 * tire, la remise qu'il laisse sous le prix catalogue, puis la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le plancher n'est plus le coût complet du chapitre,
 * mais le coût complet majoré du bénéfice que la direction exige. Les autres chiffres
 * sont ceux du mois du cas, lus par `negociation`.
 */

/**
 * Le bénéfice minimal exigé sur chaque affaire : 10 % de son coût complet. C'est une
 * règle de maison courante chez les prestataires des entreprises : elle garde de quoi
 * absorber un aléa (une journée de plus, une palette abîmée, une reprise de chantier)
 * sans que l'affaire bascule en perte.
 */
export const BENEFICE_MINIMAL_SUR_COUT_COMPLET = 0.1;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function remiseAutorisee(c: Cas) {
  const n = negociation(c);
  const beneficeMinimal = auCentime(n.coutComplet * BENEFICE_MINIMAL_SUR_COUT_COMPLET);
  const plancher = auCentime(n.coutComplet + beneficeMinimal);
  const remiseParUnite = auCentime(n.prix - plancher);
  return {
    ...n,
    beneficeMinimal,
    plancher,
    remiseParUnite,
    remise: auDixieme((remiseParUnite / n.prix) * 100),
    remiseSurLaCommande: auCentime(remiseParUnite * n.quantite),
    regle: BENEFICE_MINIMAL_SUR_COUT_COMPLET * 100,
    // Les erreurs classiques : oublier les charges fixes (majorer le seul coût variable),
    // et retirer la règle en points de prix à la remise maximale du chapitre.
    remiseSansLesFixes: auDixieme(((n.prix - n.coutVariable * (1 + BENEFICE_MINIMAL_SUR_COUT_COMPLET)) / n.prix) * 100),
    remiseEnPoints: auDixieme(n.remiseMaximale - BENEFICE_MINIMAL_SUR_COUT_COMPLET * 100),
  };
}

export const LA_REMISE_AUTORISEE: Situation = {
  code: "la-remise-autorisee",
  parcours: "ndrc",
  palier: 2,
  blocs: [],
  reprend: ["negocier-le-prix"],
  commanditaire: "La directrice commerciale",
  titre: "La remise que le commercial peut accorder",
  accroche:
    "La directrice commerciale veut un bénéfice minimal sur chaque affaire. Quelle remise ses commerciaux peuvent-ils accorder sans lui en parler ?",
  objectifs: [
    "Calculer le coût complet d'une unité",
    "Calculer un prix plancher qui garde un bénéfice minimal",
    "En déduire la remise maximale autorisée, en euros et en pourcentage",
    "Rédiger une consigne chiffrée pour l'équipe commerciale",
  ],
  libre: false,
  entreprises: {
    codes: NEGOCIATIONS,
    pourquoi: "ce cas suit une négociation avec un client professionnel, là où le prix se discute affaire par affaire.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la directrice commerciale",
      texte: (c) => {
        const r = remiseAutorisee(c);
        return [
          `« Nos commerciaux me demandent sans arrêt jusqu'où ils peuvent descendre. Je pose une règle : aucune affaire ne doit laisser moins de ${pct(r.regle)} de son coût complet en bénéfice. Dites-moi quelle remise ils peuvent accorder seuls sur le prix catalogue, et ce que cela donne sur la commande que nous propose ${r.client}. »`,
          "Pas de cours cette fois : vous avez les chiffres du mois, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = remiseAutorisee(c);
        return {
          titre: `Les chiffres du mois · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Prix catalogue d'une unité, hors taxes", valeurs: [eur(r.prix)] },
            { libelle: "Coût d'achat par unité", valeurs: [eur(r.matiere)] },
            { libelle: `Autres coûts par unité (${r.autresCoutsVariables})`, valeurs: [eur(r.autres)] },
            { libelle: "Charges fixes du mois", valeurs: [eur(r.chargesFixes)] },
            { libelle: "Unités vendues dans le mois", valeurs: [qte(r.quantiteDuMois)] },
            { libelle: `Commande proposée par le client (${c.unites})`, valeurs: [qte(r.quantite)] },
            { libelle: "Bénéfice minimal exigé, en part du coût complet", valeurs: [pct(r.regle)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le coût complet d'une unité, le prix plancher de la règle, la remise autorisée en euros et en pourcentage, et votre réponse.",
    },
    {
      id: "cout-complet",
      type: "montants",
      titre: "Le coût complet d'une unité",
      notions: ["variable_costs", "full_unit_cost"],
      question: () =>
        "Calculez le coût variable d'une unité, la part des charges fixes du mois qu'elle porte (au centime), puis son coût complet.",
      champs: (c) => {
        const r = remiseAutorisee(c);
        return [
          { libelle: "Coût variable d'une unité", attendu: r.coutVariable, calcul: `${eur(r.matiere)} + ${eur(r.autres)} = ${eur(r.coutVariable)}` },
          { libelle: "Part des charges fixes par unité", attendu: r.partDesFixes, calcul: `${eur(r.chargesFixes)} ÷ ${qte(r.quantiteDuMois)} = ${eur(r.partDesFixes)}` },
          { libelle: "Coût complet d'une unité", attendu: r.coutComplet, calcul: `${eur(r.coutVariable)} + ${eur(r.partDesFixes)} = ${eur(r.coutComplet)}` },
        ];
      },
      explication: (c) => {
        const r = remiseAutorisee(c);
        return [
          `Vendue ${eur(r.coutComplet)}, une unité paie tout juste ce qu'elle coûte à ${c.entreprise}, charges fixes comprises : pas un euro de bénéfice. La règle de la directrice place le plancher au-dessus.`,
        ];
      },
    },
    {
      id: "plancher",
      type: "montants",
      titre: "Le prix plancher de la règle",
      notions: ["price_floor", "full_unit_cost"],
      question: (c) => {
        const r = remiseAutorisee(c);
        return `La règle exige un bénéfice d'au moins ${pct(r.regle)} du coût complet. Calculez ce bénéfice minimal par unité, puis le prix plancher sous lequel un commercial ne peut pas descendre seul.`;
      },
      champs: (c) => {
        const r = remiseAutorisee(c);
        return [
          { libelle: "Bénéfice minimal par unité", attendu: r.beneficeMinimal, calcul: `${eur(r.coutComplet)} × ${pct(r.regle)} = ${eur(r.beneficeMinimal)}` },
          { libelle: "Prix plancher", attendu: r.plancher, calcul: `${eur(r.coutComplet)} + ${eur(r.beneficeMinimal)} = ${eur(r.plancher)}` },
        ];
      },
      explication: (c) => {
        const r = remiseAutorisee(c);
        return [
          `Le bénéfice se calcule sur le coût complet, pas sur le prix : à ${eur(r.plancher)}, chaque unité paie son coût variable, sa part des charges fixes, et laisse ${eur(r.beneficeMinimal)} à ${c.entreprise}.`,
        ];
      },
    },
    {
      id: "remise",
      type: "montants",
      titre: "La remise autorisée",
      notions: ["price_floor"],
      question: (c) => {
        const r = remiseAutorisee(c);
        return `Entre le prix catalogue et ce plancher, quelle remise par unité reste-t-il ? Exprimez-la en pourcentage du prix catalogue, au dixième, puis calculez ce qu'elle représente au plus sur la commande de ${qte(r.quantite)} ${c.unites}.`;
      },
      champs: (c) => {
        const r = remiseAutorisee(c);
        return [
          { libelle: "Remise autorisée par unité", attendu: r.remiseParUnite, calcul: `${eur(r.prix)} − ${eur(r.plancher)} = ${eur(r.remiseParUnite)}` },
          { libelle: "Remise autorisée (%)", attendu: r.remise, tolerance: 0.1, calcul: `${eur(r.remiseParUnite)} ÷ ${eur(r.prix)} × 100 = ${pct(r.remise)}` },
          { libelle: "Remise au plus sur la commande", attendu: r.remiseSurLaCommande, calcul: `${eur(r.remiseParUnite)} × ${qte(r.quantite)} = ${eur(r.remiseSurLaCommande)}` },
        ];
      },
      explication: (c) => {
        const r = remiseAutorisee(c);
        return [
          `Sans la règle, la marge de manœuvre allait jusqu'au coût complet : ${pct(r.remiseMaximale)} du prix. La règle en garde une part pour le bénéfice : ${r.client} peut obtenir jusqu'à ${pct(r.remise)}, soit ${eur(r.remiseSurLaCommande)} sur sa commande. Au-delà, la décision remonte à la directrice.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice commerciale",
      question: () => "Quelle consigne proposez-vous à la directrice commerciale ?",
      options: (c) => {
        const r = remiseAutorisee(c);
        return [
          {
            texte: `Jusqu'à ${pct(r.remise)}, soit un prix plancher de ${eur(r.plancher)}`,
            juste: true,
            retour: `Oui : ${eur(r.coutComplet)} de coût complet, plus ${pct(r.regle)} de bénéfice, donnent un plancher de ${eur(r.plancher)}, soit ${eur(r.remiseParUnite)} sous le prix catalogue de ${eur(r.prix)}.`,
          },
          {
            texte: `Jusqu'à ${pct(r.remiseMaximale)} : tant que le prix couvre le coût complet`,
            juste: false,
            retour: `Non : c'est la remise maximale, celle qui ne laisse aucun bénéfice. À ${eur(r.coutComplet)}, l'affaire paie ses coûts et rien de plus, quand la règle en exige ${eur(r.beneficeMinimal)} par unité.`,
          },
          {
            texte: `Jusqu'à ${pct(r.remiseEnPoints)} : la remise maximale moins ${qte(r.regle)} points`,
            juste: false,
            retour: `Non : les ${pct(r.regle)} de la règle se prennent sur le coût complet, pas en points du prix catalogue. Le bénéfice minimal vaut ${eur(r.beneficeMinimal)}, soit ${pct(auDixieme((r.beneficeMinimal / r.prix) * 100))} du prix.`,
          },
          {
            texte: `Jusqu'à ${pct(r.remiseSansLesFixes)} : le coût variable majoré de ${pct(r.regle)}`,
            juste: false,
            retour: `Non : ce plancher oublie les charges fixes. Chaque unité en porte ${eur(r.partDesFixes)} ; vendue à ce prix à tous les clients, ${c.entreprise} ne paierait plus son loyer ni son équipe.`,
          },
        ];
      },
    },
  ],
};
