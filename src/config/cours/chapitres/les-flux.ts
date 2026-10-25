import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accordPluriel } from "../accords";
import { anneeJouee, type Cas } from "../cas";
import { nomDuClient } from "../provisions";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES FLUX DE L'ENTREPRISE (comptabilité générale, palier 1).
 *
 * Avant le journal : l'entreprise au centre de ses partenaires (associés, banque,
 * fournisseurs, clients, salariés, État et organismes sociaux), et ce qui circule entre
 * eux. Le mois du chapitre pilote, opération par opération, rangé par partenaire ; puis
 * les deux sens de chaque opération, le flux réel et le flux financier ; enfin le premier
 * trimestre de l'arène, tel que la banque le voit : ce qui entre, ce qui sort.
 *
 * Tous les montants viennent de l'arène : le mois du cas (`cas.ts`) et le tableau de
 * trésorerie du premier trimestre joué.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");

/** Ce que les lignes du tableau de trésorerie de l'arène veulent dire, pour un lycéen. */
export const FLUX_DE_L_ARENE: Record<string, string> = {
  encaissements_clients: "Encaissements des clients",
  paiements_fournisseurs: "Paiements aux fournisseurs",
  couts_variables_decaisses: "Autres coûts variables payés",
  commissions_partenaires: "Commissions des partenaires",
  couts_fixes: "Loyer, frais de structure et salaires",
  marketing: "Publicité",
  qualite: "Qualité",
  maintenance: "Entretien",
  interets: "Intérêts de l'emprunt",
  impot: "Impôt sur les sociétés",
  remboursement_emprunt: "Remboursement de l'emprunt",
  tva_decaissee: "TVA reversée à l'État",
};

/** Le premier trimestre de l'arène, vu de la banque. */
export function premierTrimestre(c: Cas) {
  const cf = anneeJouee(c.code).partie.rounds[0]!.results["joueur"]!.cashFlow;
  const lignes = cf.items.filter((i) => Math.round(i.amount) !== 0).map((i) => ({ label: i.label, montant: auCentime(i.amount) }));
  const entrees = auCentime(lignes.filter((l) => l.montant > 0).reduce((t, l) => t + l.montant, 0));
  const sorties = auCentime(-lignes.filter((l) => l.montant < 0).reduce((t, l) => t + l.montant, 0));
  return { debut: auCentime(cf.opening), fin: auCentime(cf.closing), lignes, entrees, sorties, variation: auCentime(entrees - sorties) };
}

function tableauDuTrimestre(c: Cas): TableauDeDonnees {
  const t = premierTrimestre(c);
  return {
    titre: `Le premier trimestre de ${c.entreprise} dans l'arène, vu de la banque`,
    colonnes: ["Entrée", "Sortie"],
    lignes: t.lignes.map((l) => ({
      libelle: FLUX_DE_L_ARENE[l.label] ?? l.label,
      valeurs: l.montant > 0 ? [eur(l.montant), ""] : ["", eur(-l.montant)],
    })),
  };
}

export const LES_FLUX: Chapitre = {
  code: "les-flux-de-l-entreprise",
  parcours: "comptabilite-generale",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
    "STMG Thème 4 · Temps et risque",
    "Bac pro AGORA Bloc 2 · Organiser et suivre l'activité de production (de biens ou de services)",
  ],
  titre: "Les flux de l'entreprise",
  accroche:
    "Une entreprise ne vit pas seule : elle reçoit de ses associés et de sa banque, achète à ses fournisseurs, vend à ses clients, paie ses salariés et l'État. Ce qui circule entre eux, ce sont les flux.",
  objectifs: [
    "Nommer les partenaires de l'entreprise",
    "Ranger chaque opération selon le partenaire qu'elle concerne",
    "Distinguer le flux réel et le flux financier d'une même opération",
    "Lire les entrées et les sorties d'argent d'un trimestre",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "L'entreprise et ses partenaires",
      notions: ["revenue"],
      texte: (c) => [
        `${c.entreprise} est au centre d'un réseau. Ses associés lui apportent de l'argent, sa banque lui en prête. Ses fournisseurs lui vendent ce qu'il lui faut, ses clients lui achètent ce qu'elle produit. Ses salariés lui donnent leur travail. L'État et les organismes sociaux prélèvent des impôts et des cotisations.`,
        "Entre l'entreprise et chacun d'eux, quelque chose circule : des biens, des services, du travail, de l'argent. Ce sont les flux. Les comprendre, c'est comprendre tout ce que la comptabilité va enregistrer.",
      ],
      repere: () =>
        "Un flux réel : des biens, des services, du travail. Un flux financier : de l'argent. Les deux vont en sens contraire.",
    },
    {
      id: "partenaires",
      type: "tri",
      titre: "Qui est concerné ?",
      notions: ["revenue"],
      question: (c) => `Voici le premier mois de ${c.entreprise}. Pour chaque opération, quel partenaire est concerné ?`,
      categories: [
        { code: "associes", libelle: "Associés" },
        { code: "banque", libelle: "Banque" },
        { code: "fournisseurs", libelle: "Fournisseurs" },
        { code: "clients", libelle: "Clients" },
        { code: "salaries", libelle: "Salariés" },
        { code: "etat", libelle: "État et organismes sociaux" },
      ],
      elements: (c) => [
        { libelle: "Apport en capital", montant: c.capital, categorie: "associes", pourquoi: "Les associés apportent l'argent qui lance l'entreprise." },
        { libelle: "Emprunt reçu", montant: c.emprunt, categorie: "banque", pourquoi: "La banque prête ; l'entreprise remboursera, avec des intérêts." },
        {
          libelle: `Achat : ${c.immobilisation.designation}`,
          montant: c.immobilisation.ttc,
          categorie: "fournisseurs",
          pourquoi: "L'équipement s'achète à un fournisseur, comme le reste.",
        },
        {
          libelle: `Achat chez ${c.achat.fournisseur}`,
          montant: c.achat.ttc,
          categorie: "fournisseurs",
          pourquoi: `${c.achat.fournisseur} fournit ce qu'il faut pour produire ou vendre.`,
        },
        {
          libelle: "Loyer du local",
          montant: c.loyer.montant,
          categorie: "fournisseurs",
          pourquoi: "Le propriétaire du local vend un service : l'usage du local. C'est un fournisseur.",
        },
        {
          libelle: `Vente à ${nomDuClient(c.venteCredit.client)}`,
          montant: c.venteCredit.ttc,
          categorie: "clients",
          pourquoi: "Un client professionnel, qui paiera plus tard.",
        },
        { libelle: "Ventes au comptant du mois", montant: c.venteComptant.ttc, categorie: "clients", pourquoi: "Des clients qui paient sur-le-champ." },
        { libelle: "Salaires nets versés", montant: c.personnel.net, categorie: "salaries", pourquoi: "Le salaire paie le travail des salariés." },
        {
          libelle: "Cotisations sociales",
          montant: c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales,
          categorie: "etat",
          pourquoi: "Les cotisations vont à l'URSSAF, un organisme social, et financent la protection sociale.",
        },
      ],
      explication: () => [
        "Chaque opération a un partenaire en face. C'est ce partenaire que la comptabilité suivra dans ses comptes : ce qu'on doit à un fournisseur, ce qu'un client nous doit, ce qu'on doit à l'URSSAF.",
      ],
    },
    {
      id: "deux-sens",
      type: "choix",
      titre: "Une vente, deux flux",
      notions: ["payment_terms"],
      question: (c) =>
        `${c.entreprise} vend ${qte(c.venteCredit.quantite)} ${c.unites} à ${nomDuClient(c.venteCredit.client)}, qui paiera à ${qte(c.venteCredit.delai)} jours. Quels flux cette vente crée-t-elle ?`,
      options: (c) => [
        {
          texte: `Un flux réel vers le client, les ${c.unites}, et un flux financier en sens inverse, le paiement, ${qte(c.venteCredit.delai)} jours plus tard.`,
          juste: true,
          retour:
            "C'est cela. Toute opération avec un partenaire a ses deux sens : ce qui part, ce qui revient. Ici, les deux ne tombent pas le même jour : entre la livraison et le paiement, le client doit de l'argent à l'entreprise.",
        },
        {
          texte: "Un seul flux, financier : l'argent que le client paie.",
          juste: false,
          retour: `L'argent ne vient pas de nulle part : il paie les ${c.unites} ${accordPluriel(c, "livré")}. Le flux réel part le premier, le flux financier suit.`,
        },
        {
          texte: "Deux flux le même jour, puisque la vente est faite.",
          juste: false,
          retour: `Le client paie à ${qte(c.venteCredit.delai)} jours : le flux financier arrive après. C'est ce décalage qui fait naître une créance.`,
        },
      ],
    },
    {
      id: "emprunt",
      type: "choix",
      titre: "Et l'emprunt ?",
      notions: ["loan_schedule"],
      question: (c) => `La banque prête ${eur(c.emprunt)} à ${c.entreprise}. Quel flux réel y a-t-il en face ?`,
      options: () => [
        {
          texte: "Aucun : un emprunt est un flux financier dans les deux sens, l'argent prêté puis l'argent remboursé, avec les intérêts.",
          juste: true,
          retour:
            "C'est cela. La banque ne livre ni bien ni service : elle prête de l'argent, et en reçoit plus tard, un peu plus. Les flux financiers ne paient pas toujours un flux réel.",
        },
        {
          texte: "Le service de la banque, que l'entreprise paie avec l'emprunt.",
          juste: false,
          retour: "Le service de la banque se paie par les intérêts, pas par l'emprunt. L'emprunt lui-même est de l'argent qui se rendra.",
        },
        {
          texte: "L'équipement acheté avec l'argent prêté.",
          juste: false,
          retour: "L'équipement vient du fournisseur, dans une autre opération. L'emprunt, lui, ne concerne que la banque.",
        },
      ],
    },
    {
      id: "le-trimestre",
      type: "montants",
      titre: "Le trimestre vu de la banque",
      notions: ["cash_budget"],
      tableau: tableauDuTrimestre,
      question: (c) => {
        const t = premierTrimestre(c);
        return `Voici les flux financiers du premier trimestre de ${c.entreprise} dans l'arène : tout ce qui est entré à la banque et tout ce qui en est sorti. Au 1er janvier, la banque portait ${eur(t.debut)}. Faites les totaux, puis la variation de la banque.`;
      },
      champs: (c) => {
        const t = premierTrimestre(c);
        return [
          { libelle: "Total des entrées", attendu: t.entrees, calcul: `la somme de la colonne Entrée : ${eur(t.entrees)}` },
          { libelle: "Total des sorties", attendu: t.sorties, calcul: `la somme de la colonne Sortie : ${eur(t.sorties)}` },
          { libelle: "Variation de la banque", attendu: t.variation, calcul: `${eur(t.entrees)} − ${eur(t.sorties)} = ${eur(t.variation)}` },
        ];
      },
      explication: (c) => {
        const t = premierTrimestre(c);
        return [
          `La banque passe de ${eur(t.debut)} à ${eur(t.fin)} : c'est ce que l'arène affiche à la fin du trimestre.`,
          "Chaque ligne a un partenaire : les clients pour les encaissements, les fournisseurs pour la plupart des sorties, la banque pour les intérêts et le remboursement, l'État pour l'impôt.",
        ];
      },
    },
    {
      id: "ventes-et-encaissements",
      type: "choix",
      titre: "Encaisser, est-ce vendre ?",
      notions: ["payment_terms", "revenue"],
      question: (c) =>
        `Les encaissements des clients du trimestre, ${eur(premierTrimestre(c).entrees)}, sont-ils les ventes du trimestre ?`,
      options: (c) => [
        {
          texte: `Pas exactement : les clients professionnels paient à ${qte(c.venteCredit.delai)} jours, une partie des ventes de fin de trimestre sera encaissée au trimestre suivant.`,
          juste: true,
          retour:
            "C'est cela. Vendre, c'est livrer ; encaisser, c'est recevoir l'argent. Les deux ne tombent pas toujours dans la même période. Le chapitre suivant les sépare : charges et produits d'un côté, encaissements et décaissements de l'autre.",
        },
        {
          texte: "Oui : l'argent reçu est toujours égal à ce qu'on a vendu.",
          juste: false,
          retour: "Pas quand les clients paient plus tard : les ventes de la fin du trimestre arrivent à la banque le trimestre suivant.",
        },
        {
          texte: "Non : les encaissements comprennent aussi l'emprunt.",
          juste: false,
          retour: "L'emprunt n'est pas dans les encaissements des clients : il vient de la banque. La différence tient aux délais de paiement.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["revenue"],
      texte: (c) => [
        `Vous savez nommer les partenaires de ${c.entreprise}, ranger chaque opération selon le partenaire qu'elle concerne, et voir ses deux sens : ce qui part, ce qui revient.`,
        "Jouez une partie dans l'arène : chaque décision que vous prenez crée des flux, et le tableau de trésorerie de fin de tour les montre tous.",
      ],
      repere: () => "Associés, banque, fournisseurs, clients, salariés, État : six partenaires, et pour chaque opération, un flux réel et un flux financier.",
    },
  ],
};
