import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { JOURS_DU_MOIS } from "../point-de-vente";
import type { Chapitre } from "../types";
import { clientDe, nomDuPanier } from "./indicateurs-du-point-de-vente";
import { COMMERCES } from "./taux-de-marque";

/**
 * CHAPITRE : LE SEUIL DE RENTABILITÉ DU POINT DE VENTE (BTS MCO, palier 3).
 *
 * Le seuil vu du magasin : en chiffre d'affaires, en date (le jour du mois où le point de
 * vente commence à gagner de l'argent), et en clients, avec le panier moyen du chapitre sur
 * les indicateurs. La marge et l'indice de sécurité disent la marge d'erreur. Le curseur
 * cherche le panier plancher : le plus petit panier qui, avec les mêmes clients, paie
 * encore les charges fixes.
 *
 * Le chapitre « Seuil de rentabilité » du contrôle de gestion raisonne en quantités ; celui-ci
 * raisonne comme le manager, en chiffre d'affaires, en jours et en clients. Les chiffres sont
 * ceux du mois du cas (`cas.gestion`) ; la seule convention, le mois commercial de trente
 * jours pour dater le point mort, est dans `point-de-vente.ts`.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Le seuil du mois, en chiffre d'affaires, en jours et en clients. */
export function seuilDuPointDeVente(c: Cas) {
  const g = c.gestion;
  const ca = g.chiffreDAffaires;
  const coutsVariables = auCentime(g.coutVariableUnitaire * g.quantite);
  const mcv = auCentime(ca - coutsVariables);
  const tauxMcv = auDixieme((mcv / ca) * 100);
  const seuil = Math.round(g.chargesFixes / (tauxMcv / 100));
  const client = clientDe(c);
  const clients = Math.round(g.quantite / client.unitesParClient);
  const panier = auCentime(ca / clients);
  const coutVariableParClient = auCentime(g.coutVariableUnitaire * client.unitesParClient);
  const panierPlancher = Math.ceil(g.chargesFixes / clients + coutVariableParClient - 1e-9);
  return {
    ca,
    quantite: g.quantite,
    coutVariableUnitaire: g.coutVariableUnitaire,
    coutsVariables,
    mcv,
    tauxMcv,
    chargesFixes: g.chargesFixes,
    seuil,
    margeDeSecurite: Math.round(ca - seuil),
    indice: auDixieme(((ca - seuil) / ca) * 100),
    pointMort: Math.ceil((seuil / ca) * JOURS_DU_MOIS - 1e-9),
    nomDuPanier: nomDuPanier(c),
    client,
    clients,
    panier,
    clientsAuSeuil: Math.ceil(seuil / panier - 1e-9),
    coutVariableParClient,
    panierPlancher,
  };
}

export const SEUIL_DU_POINT_DE_VENTE: Chapitre = {
  code: "seuil-du-point-de-vente",
  parcours: "mco",
  palier: 3,
  blocs: [
    "BTS MCO Bloc 3 · Assurer la gestion opérationnelle",
    "BUT TC · Piloter un espace de vente",
  ],
  titre: "Le seuil de rentabilité du point de vente",
  accroche:
    "À partir de quel chiffre d'affaires, de quel jour du mois, de combien de clients le point de vente gagne-t-il de l'argent ? Et jusqu'où peut descendre le panier ?",
  objectifs: [
    "Calculer la marge sur coût variable et son taux",
    "Calculer le seuil de rentabilité en chiffre d'affaires",
    "Calculer la marge de sécurité et l'indice de sécurité",
    "Dater le point mort dans le mois",
    "Traduire le seuil en nombre de clients, et trouver le panier plancher",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce chapitre suit le seuil d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le jour où l'on commence à gagner",
      notions: ["breakeven", "dead_point"],
      texte: (c) => {
        const s = seuilDuPointDeVente(c);
        return [
          `En un mois de l'arène, ${c.entreprise} fait ${eur(s.ca)} de chiffre d'affaires hors taxes, pour ${qte(s.quantite)} ${c.unites}. Chaque ${c.unite} coûte ${eur(s.coutVariableUnitaire)} de coûts variables, et le mois porte ${eur(s.chargesFixes)} de charges fixes : le loyer, l'équipe, l'usure de l'équipement.`,
          "Les premiers jours du mois, la marge rembourse les charges fixes ; le point de vente ne gagne de l'argent qu'une fois qu'elles sont couvertes. Le manager veut savoir quand.",
        ];
      },
      repere: () => "Seuil de rentabilité = charges fixes ÷ taux de marge sur coût variable. Point mort = seuil ÷ chiffre d'affaires × 30 jours.",
    },
    {
      id: "marge",
      type: "montants",
      titre: "La marge sur coût variable",
      notions: ["contribution_margin"],
      question: (c) => {
        const s = seuilDuPointDeVente(c);
        return `Calculez les coûts variables du mois (${qte(s.quantite)} ${c.unites} à ${eur(s.coutVariableUnitaire)}), la marge sur coût variable, puis son taux en pourcentage du chiffre d'affaires, au dixième.`;
      },
      champs: (c) => {
        const s = seuilDuPointDeVente(c);
        return [
          { libelle: "Coûts variables du mois", attendu: s.coutsVariables, calcul: `${qte(s.quantite)} × ${eur(s.coutVariableUnitaire)} = ${eur(s.coutsVariables)}` },
          { libelle: "Marge sur coût variable", attendu: s.mcv, calcul: `${eur(s.ca)} − ${eur(s.coutsVariables)} = ${eur(s.mcv)}` },
          { libelle: "Taux de marge sur coût variable (%)", attendu: s.tauxMcv, calcul: `${eur(s.mcv)} ÷ ${eur(s.ca)} × 100 = ${pct(s.tauxMcv)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const s = seuilDuPointDeVente(c);
        return [`Sur 100 € de ventes, ${pct(s.tauxMcv)} restent pour payer les charges fixes, une fois réglé ce qu'il a fallu acheter et dépenser pour vendre.`];
      },
    },
    {
      id: "seuil",
      type: "montants",
      titre: "Le seuil en chiffre d'affaires",
      notions: ["breakeven", "safety_margin"],
      question: (c) => {
        const s = seuilDuPointDeVente(c);
        return `Avec un taux de marge sur coût variable de ${pct(s.tauxMcv)} et ${eur(s.chargesFixes)} de charges fixes, calculez le seuil de rentabilité du mois (à l'euro), la marge de sécurité, puis l'indice de sécurité en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const s = seuilDuPointDeVente(c);
        return [
          { libelle: "Seuil de rentabilité", attendu: s.seuil, calcul: `${eur(s.chargesFixes)} ÷ ${pct(s.tauxMcv)} = ${eur(s.seuil)}`, tolerance: 2 },
          { libelle: "Marge de sécurité", attendu: s.margeDeSecurite, calcul: `${eur(s.ca)} − ${eur(s.seuil)} = ${eur(s.margeDeSecurite)}`, tolerance: 2 },
          { libelle: "Indice de sécurité (%)", attendu: s.indice, calcul: `${eur(s.margeDeSecurite)} ÷ ${eur(s.ca)} × 100 = ${pct(s.indice)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const s = seuilDuPointDeVente(c);
        return [
          `Au-delà de ${eur(s.seuil)} de ventes, ${c.entreprise} gagne de l'argent. Le chiffre d'affaires peut baisser de ${pct(s.indice)} avant qu'elle n'en perde : c'est sa marge d'erreur.`,
        ];
      },
    },
    {
      id: "point-mort",
      type: "montants",
      titre: "Le point mort",
      notions: ["dead_point"],
      question: (c) => {
        const s = seuilDuPointDeVente(c);
        return `Les ventes se répartissent régulièrement sur un mois de 30 jours. Quel jour du mois ${c.entreprise} atteint-elle son seuil de ${eur(s.seuil)} ? Arrondissez au jour supérieur.`;
      },
      champs: (c) => {
        const s = seuilDuPointDeVente(c);
        return [{ libelle: "Point mort (jour du mois)", attendu: s.pointMort, calcul: `${eur(s.seuil)} ÷ ${eur(s.ca)} × 30 = ${qte(s.pointMort)} (arrondi au-dessus)` }];
      },
      explication: (c) => {
        const s = seuilDuPointDeVente(c);
        return [
          `Du 1er au ${qte(s.pointMort)} du mois, ${c.entreprise} travaille pour payer ses charges fixes ; à partir du ${qte(s.pointMort)}, chaque vente lui laisse un bénéfice. Un mois de travaux, une fermeture, une semaine de pluie : le point mort recule, et le bénéfice fond.`,
        ];
      },
    },
    {
      id: "en-clients",
      type: "montants",
      titre: "Le seuil en clients",
      notions: ["breakeven", "average_basket"],
      question: (c) => {
        const s = seuilDuPointDeVente(c);
        return `Le manager pense en clients. Avec un ${s.nomDuPanier.toLowerCase()} de ${eur(s.panier)} (${qte(s.clients)} ${s.client.pluriel} ce mois-ci), combien de ${s.client.pluriel} faut-il au minimum pour atteindre le seuil ? Arrondissez au-dessus.`;
      },
      champs: (c) => {
        const s = seuilDuPointDeVente(c);
        return [{ libelle: `${s.client.pluriel.charAt(0).toUpperCase()}${s.client.pluriel.slice(1)} au seuil`, attendu: s.clientsAuSeuil, calcul: `${eur(s.seuil)} ÷ ${eur(s.panier)} = ${qte(s.clientsAuSeuil)}`, tolerance: 1 }];
      },
      explication: (c) => {
        const s = seuilDuPointDeVente(c);
        return [`Il faut ${qte(s.clientsAuSeuil)} ${s.client.pluriel} pour couvrir le mois ; ${c.entreprise} en a eu ${qte(s.clients)}. C'est un objectif que toute l'équipe comprend.`];
      },
    },
    {
      id: "panier-plancher",
      type: "curseur",
      titre: "Le panier plancher",
      notions: ["breakeven", "average_basket"],
      question: (c) => {
        const s = seuilDuPointDeVente(c);
        return `Les ${s.client.pluriel} restent ${qte(s.clients)} par mois. Faites varier le ${s.nomDuPanier.toLowerCase()}, et placez le curseur sur le plus petit, à l'euro, qui ne fait pas perdre d'argent à ${c.entreprise}.`;
      },
      grandeur: (c) => ({ libelle: nomDuPanier(c), unite: "€" }),
      cible: (c) => {
        const s = seuilDuPointDeVente(c);
        return { attendu: s.panierPlancher, min: Math.floor(s.coutVariableParClient), max: Math.ceil(Math.max(s.panierPlancher, s.panier) * 1.3) };
      },
      lecture: (c, panier) => {
        const s = seuilDuPointDeVente(c);
        const ca = auCentime(s.clients * panier);
        const marge = auCentime(s.clients * (panier - s.coutVariableParClient));
        return [
          { libelle: "Chiffre d'affaires du mois", montant: ca },
          { libelle: "Marge sur coût variable", montant: marge },
          { libelle: "Charges fixes", montant: s.chargesFixes },
          { libelle: "Résultat du mois", montant: auCentime(marge - s.chargesFixes), fort: true },
        ];
      },
      droites: (c) => {
        const s = seuilDuPointDeVente(c);
        return { produit: (p) => s.clients * (p - s.coutVariableParClient), cout: () => s.chargesFixes, libelles: ["Marge sur coût variable", "Charges fixes"] };
      },
      rates: () => ({
        dessous: "À ce panier, la marge du mois ne paie pas les charges fixes.",
        dessus: "Plus bas, la marge paie encore les charges fixes : cherchez le plus petit panier.",
      }),
      montrer: "Montrer le panier plancher",
      explication: (c) => {
        const s = seuilDuPointDeVente(c);
        return [
          `Avec les mêmes ${s.client.pluriel}, le ${s.nomDuPanier.toLowerCase()} peut descendre jusqu'à ${eur(s.panierPlancher)} au lieu de ${eur(s.panier)} avant que ${c.entreprise} ne perde de l'argent. Une promotion qui ferait baisser le panier sous ce plancher sans amener de clients en plus coûterait de l'argent.`,
        ];
      },
    },
  ],
};
