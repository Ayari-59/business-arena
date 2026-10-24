import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { anneeJouee, type Cas } from "../cas";
import { dateDuCours as date } from "../dates";
import { nomDuClient } from "../provisions";
import type { Chapitre, TableauDeDonnees } from "../types";
import { premierTrimestre } from "./les-flux";

/**
 * CHAPITRE : CHARGES ET PRODUITS, ENCAISSEMENTS ET DÉCAISSEMENTS (comptabilité générale, palier 1).
 *
 * La suite des flux : deux questions à poser à chaque opération. Enrichit-elle ou
 * appauvrit-elle l'entreprise (un produit, une charge, ou ni l'un ni l'autre) ? Fait-elle
 * entrer ou sortir de l'argent ce mois-ci ? Le mois du chapitre pilote, rangé deux fois ;
 * puis le premier trimestre de l'arène, son résultat à côté de la variation de sa banque,
 * et ce qui les sépare : la dotation qui ne se paie pas, le remboursement qui n'est pas une
 * charge, les délais des clients et des fournisseurs.
 *
 * Aucune hypothèse : le mois du cas, le compte de résultat et le tableau de trésorerie du
 * premier trimestre joué.
 */

/** Le compte de résultat du premier trimestre de l'arène, en lignes qu'un lycéen lit. */
export function resultatDuTrimestre(c: Cas) {
  const r = anneeJouee(c.code).partie.rounds[0]!.results["joueur"]!;
  const is = r.incomeStatement;
  const commissions = is.commissionCost ?? 0;
  const charges = [
    { libelle: "Coût des ventes (achats et coûts variables)", montant: is.revenue - is.grossMargin - commissions },
    { libelle: "Commissions", montant: commissions },
    { libelle: "Loyer, frais de structure et salaires", montant: is.fixedCosts },
    { libelle: "Publicité", montant: is.marketingCost },
    { libelle: "Qualité", montant: is.qualityCost },
    { libelle: "Entretien", montant: is.maintenanceCost },
    { libelle: "Dotation aux amortissements", montant: is.depreciation },
    { libelle: "Intérêts de l'emprunt", montant: is.interest },
    { libelle: "Impôt sur les sociétés", montant: is.tax },
  ];
  const connues = charges.reduce((t, l) => t + l.montant, 0);
  // Ce que le trimestre porterait d'autre (engagement RSE, recherche) : une ligne de plus, s'il y en a.
  const autres = is.revenue - connues - is.netIncome;
  if (Math.abs(autres) >= 0.005) charges.push({ libelle: "Autres charges", montant: autres });
  const lignes = charges.filter((l) => Math.abs(l.montant) >= 0.005).map((l) => ({ libelle: l.libelle, montant: auCentime(l.montant) }));
  const remboursement = -(r.cashFlow.items.find((i) => i.label === "remboursement_emprunt")?.amount ?? 0);
  return {
    produits: auCentime(is.revenue),
    charges: lignes,
    totalCharges: auCentime(lignes.reduce((t, l) => t + l.montant, 0)),
    resultat: auCentime(is.netIncome),
    dotation: auCentime(is.depreciation),
    remboursement: auCentime(remboursement),
  };
}

function tableauDuResultat(c: Cas): TableauDeDonnees {
  const t = resultatDuTrimestre(c);
  return {
    titre: `Le compte de résultat du premier trimestre de ${c.entreprise} dans l'arène`,
    colonnes: ["Produit", "Charge"],
    lignes: [{ libelle: "Ventes", valeurs: [eur(t.produits), ""] }, ...t.charges.map((l) => ({ libelle: l.libelle, valeurs: ["", eur(l.montant)] }))],
  };
}

export const CHARGES_ET_ENCAISSEMENTS: Chapitre = {
  code: "charges-produits-encaissements",
  parcours: "comptabilite-generale",
  palier: 1,
  titre: "Charges et produits, encaissements et décaissements",
  accroche:
    "Une opération peut enrichir l'entreprise sans lui rapporter un euro ce mois-ci, ou lui coûter de l'argent sans l'appauvrir. Deux questions à poser à chaque fois, et la différence entre le résultat et la trésorerie.",
  objectifs: [
    "Reconnaître une charge, un produit, et ce qui n'est ni l'un ni l'autre",
    "Reconnaître un encaissement et un décaissement, et dire quand ils arrivent",
    "Calculer le résultat d'un trimestre",
    "Expliquer pourquoi le résultat n'est pas la variation de la trésorerie",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux questions",
      notions: ["income_statement"],
      texte: (c) => [
        `Chaque opération de ${c.entreprise} se regarde de deux façons.`,
        "D'abord : enrichit-elle ou appauvrit-elle l'entreprise ? Une vente l'enrichit : c'est un produit. Le loyer, les salaires, les achats consommés l'appauvrissent : ce sont des charges. Le résultat, c'est les produits moins les charges.",
        "Ensuite : fait-elle entrer ou sortir de l'argent, et quand ? Un encaissement, c'est de l'argent qui entre ; un décaissement, de l'argent qui sort. La trésorerie, c'est l'argent disponible.",
        "Les deux questions n'ont pas toujours la même réponse. C'est tout l'objet de ce chapitre.",
      ],
      repere: () =>
        "Charge et produit : ce qui appauvrit ou enrichit l'entreprise, le jour où cela se passe. Décaissement et encaissement : ce qui sort ou entre en banque, le jour où l'argent bouge.",
    },
    {
      id: "charge-ou-produit",
      type: "tri",
      titre: "Charge, produit, ou ni l'un ni l'autre ?",
      notions: ["income_statement"],
      question: (c) => `Voici le premier mois de ${c.entreprise}, hors taxes. Chaque opération est-elle une charge, un produit, ou ni l'un ni l'autre ?`,
      categories: [
        { code: "charge", libelle: "Charge" },
        { code: "produit", libelle: "Produit" },
        { code: "ni", libelle: "Ni l'un ni l'autre" },
      ],
      elements: (c) => [
        { libelle: "Apport des associés", montant: c.capital, categorie: "ni", pourquoi: "L'apport ne rapporte rien : il finance l'entreprise, et revient aux associés." },
        { libelle: "Emprunt reçu", montant: c.emprunt, categorie: "ni", pourquoi: "L'argent prêté se rendra : l'entreprise n'en est pas plus riche." },
        {
          libelle: `Équipement : ${c.immobilisation.designation}`,
          montant: c.immobilisation.ht,
          categorie: "ni",
          pourquoi: "Il servira plusieurs années : ce n'est pas une charge du mois. Son usure, l'amortissement, en sera une, petit à petit.",
        },
        { libelle: `Achat chez ${c.achat.fournisseur}`, montant: c.achat.ht, categorie: "charge", pourquoi: "Ce qui est acheté pour produire ou vendre se consomme : c'est une charge." },
        { libelle: "Loyer du mois", montant: c.loyer.montant, categorie: "charge", pourquoi: "Un mois d'occupation du local, consommé." },
        { libelle: "Salaires et cotisations patronales", montant: c.personnel.cout, categorie: "charge", pourquoi: "Le travail du mois : brut et cotisations patronales." },
        { libelle: `Vente à ${nomDuClient(c.venteCredit.client)}`, montant: c.venteCredit.ht, categorie: "produit", pourquoi: "Une vente enrichit l'entreprise, même si le client paie plus tard." },
        { libelle: "Ventes au comptant", montant: c.venteComptant.ht, categorie: "produit", pourquoi: "Des ventes : un produit." },
      ],
      explication: () => [
        "Ni l'apport, ni l'emprunt, ni l'équipement ne touchent au résultat : les deux premiers financent l'entreprise, le troisième lui appartient. Ils changent le bilan, pas le compte de résultat.",
      ],
    },
    {
      id: "entree-ou-sortie",
      type: "tri",
      titre: "De l'argent, ce mois-ci ?",
      notions: ["payment_terms"],
      question: (c) => `Les mêmes opérations, taxes comprises cette fois : font-elles entrer de l'argent à la banque de ${c.entreprise} en janvier, en sortir, ou rien du tout ce mois-ci ?`,
      categories: [
        { code: "encaissement", libelle: "Encaissement" },
        { code: "decaissement", libelle: "Décaissement" },
        { code: "rien", libelle: "Rien ce mois-ci" },
      ],
      elements: (c) => [
        { libelle: "Apport versé", montant: c.capital, categorie: "encaissement", pourquoi: "Les associés versent l'argent sur le compte de l'entreprise." },
        { libelle: "Prêt versé par la banque", montant: c.emprunt, categorie: "encaissement", pourquoi: "La banque verse les fonds : de l'argent entre, sans être un produit." },
        { libelle: "Équipement payé", montant: c.immobilisation.ttc, categorie: "decaissement", pourquoi: "Payé à l'achat : l'argent sort, sans être une charge." },
        {
          libelle: `Facture de ${c.achat.fournisseur}`,
          montant: c.achat.ttc,
          categorie: "rien",
          pourquoi: `Payée le ${date(c.achat.echeance)} : la charge est en janvier, le décaissement plus tard.`,
        },
        { libelle: "Loyer payé", montant: c.loyer.montant, categorie: "decaissement", pourquoi: "Payé dans le mois : charge et décaissement tombent ensemble." },
        { libelle: "Salaires nets versés", montant: c.personnel.net, categorie: "decaissement", pourquoi: "Les salariés sont payés à la fin du mois." },
        {
          libelle: "Cotisations sociales",
          montant: c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales,
          categorie: "rien",
          pourquoi: `Versées à l'URSSAF le ${date(c.personnel.dateUrssaf)} : le mois suivant.`,
        },
        {
          libelle: `Facture à ${nomDuClient(c.venteCredit.client)}`,
          montant: c.venteCredit.ttc,
          categorie: "rien",
          pourquoi: `Payée le ${date(c.venteCredit.echeance)} : le produit est en janvier, l'encaissement plus tard.`,
        },
        { libelle: "Ventes au comptant encaissées", montant: c.venteComptant.ttc, categorie: "encaissement", pourquoi: "Payées sur-le-champ." },
      ],
      explication: (c) => [
        `En janvier, ${c.entreprise} a des charges qu'elle n'a pas encore payées, et un produit qu'elle n'a pas encore encaissé. Elle a aussi encaissé de l'argent qui n'est pas un produit (l'apport, le prêt) et payé un équipement qui n'est pas une charge.`,
      ],
    },
    {
      id: "le-trimestre",
      type: "montants",
      titre: "Le résultat du trimestre",
      notions: ["income_statement"],
      tableau: tableauDuResultat,
      question: (c) =>
        `Voici le compte de résultat du premier trimestre de ${c.entreprise} dans l'arène. Calculez le total des charges, puis le résultat.`,
      champs: (c) => {
        const t = resultatDuTrimestre(c);
        return [
          { libelle: "Total des charges", attendu: t.totalCharges, calcul: `la somme de la colonne Charge : ${eur(t.totalCharges)}` },
          { libelle: "Résultat du trimestre", attendu: t.resultat, calcul: `${eur(t.produits)} − ${eur(t.totalCharges)} = ${eur(t.resultat)}` },
        ];
      },
      explication: (c) => {
        const t = resultatDuTrimestre(c);
        return [
          t.resultat >= 0
            ? `${c.entreprise} s'est enrichie de ${eur(t.resultat)} sur le trimestre : c'est son bénéfice.`
            : `${c.entreprise} s'est appauvrie de ${eur(-t.resultat)} sur le trimestre : c'est une perte.`,
        ];
      },
    },
    {
      id: "resultat-et-banque",
      type: "montants",
      titre: "Le résultat et la banque",
      notions: ["income_statement", "net_treasury"],
      question: (c) => {
        const t = resultatDuTrimestre(c);
        const f = premierTrimestre(c);
        return `Sur le même trimestre, la banque de ${c.entreprise} est passée de ${eur(f.debut)} à ${eur(f.fin)}. Quelle est la variation de la banque ? De combien s'écarte-t-elle du résultat, ${eur(t.resultat)} ?`;
      },
      champs: (c) => {
        const t = resultatDuTrimestre(c);
        const f = premierTrimestre(c);
        const ecart = auCentime(f.variation - t.resultat);
        return [
          { libelle: "Variation de la banque", attendu: f.variation, calcul: `${eur(f.fin)} − ${eur(f.debut)} = ${eur(f.variation)}` },
          { libelle: "Écart avec le résultat", attendu: ecart, calcul: `${eur(f.variation)} − ${eur(t.resultat)} = ${eur(ecart)}` },
        ];
      },
      explication: (c) => {
        const t = resultatDuTrimestre(c);
        return [
          `Le résultat et la banque ne racontent pas la même histoire. La dotation aux amortissements, ${eur(t.dotation)}, est une charge qui ne sort pas de la banque. Le remboursement de l'emprunt, ${eur(t.remboursement)}, sort de la banque sans être une charge. Et les clients et les fournisseurs ne paient pas le jour de la vente ou de l'achat.`,
        ];
      },
    },
    {
      id: "la-dotation",
      type: "choix",
      titre: "Une charge qui ne se paie pas",
      notions: ["depreciation"],
      question: (c) =>
        `Le compte de résultat du trimestre porte ${eur(resultatDuTrimestre(c).dotation)} de dotation aux amortissements. Quand ${c.entreprise} paie-t-elle cette somme ?`,
      options: () => [
        {
          texte: "Jamais au cours du trimestre : l'équipement a été payé le jour de son achat, la dotation mesure seulement son usure.",
          juste: true,
          retour:
            "C'est cela. L'équipement est payé une fois, à l'achat : un décaissement sans charge. Puis, chaque trimestre, son usure devient une charge, sans décaissement. Au bout de sa durée de vie, les deux se rejoignent.",
        },
        {
          texte: "À la fin du trimestre, à la banque.",
          juste: false,
          retour: "Aucune banque ne reçoit la dotation : c'est une charge calculée, l'usure de l'équipement, qui ne fait sortir aucun argent.",
        },
        {
          texte: "Au fournisseur de l'équipement, en plusieurs fois.",
          juste: false,
          retour: "Le fournisseur a été payé à l'achat. La dotation ne paie personne : elle répartit le coût de l'équipement sur les années où il sert.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement"],
      texte: (c) => [
        `Vous savez poser les deux questions à chaque opération de ${c.entreprise} : charge ou produit, encaissement ou décaissement, et quand.`,
        "Une entreprise peut gagner de l'argent et manquer de trésorerie, si ses clients paient tard ; elle peut perdre de l'argent et en avoir encore, si elle vient d'emprunter. Le compte de résultat et la trésorerie se lisent ensemble.",
      ],
      repere: () =>
        "Résultat = produits − charges. Variation de la trésorerie = encaissements − décaissements. Les deux diffèrent par les délais de paiement, les investissements, les emprunts et les amortissements.",
    },
  ],
};
