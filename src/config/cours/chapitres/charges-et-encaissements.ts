import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { type Cas } from "../cas";
import { dateDuCours as date } from "../dates";
import {
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  PAS_DU_REMBOURSEMENT,
  margeDUneEnceinte,
  premierTrimestreALaBanque,
  premierTrimestreAuResultat,
  remboursementPossible,
  seuilDuPremierTrimestre,
} from "../monde/gestion-et-information";
import type { Chapitre, TableauDeDonnees } from "../types";
import { POURQUOI_LA_GESTION_DE_BASE } from "./les-flux";

/**
 * CHAPITRE : CHARGES ET PRODUITS, ENCAISSEMENTS ET DÉCAISSEMENTS (comptabilité générale, palier 1).
 *
 * La suite des flux : deux questions à poser à chaque opération. Enrichit-elle ou appauvrit-elle
 * l'entreprise (un produit, une charge, ou ni l'un ni l'autre) ? Fait-elle entrer ou sortir de
 * l'argent ce mois-ci ? Le mois de janvier de NOVA, rangé deux fois ; puis son premier trimestre, son
 * résultat à côté de la variation de sa banque, et ce qui les sépare : la dotation qui ne se paie
 * pas, le remboursement qui n'est pas une charge, les délais des clients et des fournisseurs. Un
 * curseur (combien d'enceintes vendre au trimestre pour que le résultat ne soit pas négatif ?) et
 * un laboratoire (un remboursement anticipé de l'emprunt : la banque baisse, le résultat ne bouge
 * pas).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : le mois de janvier du cas figé, et le
 * premier trimestre du contrôle de gestion (monde/gestion-et-information.ts) : 4 778 enceintes,
 * 281 902 € de ventes, 5 789 € de résultat avant impôt, une banque qui baisse de 5 697,20 €. La
 * dotation est celle de la gestion (833 € par mois) ; l'échéance de l'emprunt tombe fin mars, comme
 * dans le budget de trésorerie.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait le compte de résultat et le tableau de trésorerie du premier
 * trimestre de l'arène, dans neuf entreprises. Il lit maintenant le trimestre du cours, chez NOVA.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

const resultat = () => premierTrimestreAuResultat();
const banque = () => premierTrimestreALaBanque();

function tableauDuResultat(c: Cas): TableauDeDonnees {
  const t = resultat();
  return {
    titre: `Le compte de résultat du premier trimestre ${dE(c.entreprise)}`,
    colonnes: ["Produit", "Charge"],
    lignes: [{ libelle: `Ventes de ${qte(t.quantite)} ${c.unites}`, valeurs: [eur(t.produits), ""] }, ...t.charges.map((l) => ({ libelle: l.libelle, valeurs: ["", eur(l.montant)] }))],
  };
}

export const CHARGES_ET_ENCAISSEMENTS: Chapitre = {
  code: "charges-produits-encaissements",
  parcours: "comptabilite-generale",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
    "STMG Thème 4 · Temps et risque",
    "STMG Thème 1 · Appliquer les règles comptables",
    "Bac pro AGORA Bloc 2 · Organiser et suivre l'activité de production (de biens ou de services)",
  ],
  titre: "Charges et produits, encaissements et décaissements",
  accroche:
    "Une opération peut enrichir l'entreprise sans lui rapporter un euro ce mois-ci, ou lui coûter de l'argent sans l'appauvrir. Deux questions à poser à chaque fois, et la différence entre le résultat et la trésorerie.",
  objectifs: [
    "Reconnaître une charge, un produit, et ce qui n'est ni l'un ni l'autre",
    "Reconnaître un encaissement et un décaissement, et dire quand ils arrivent",
    "Calculer le résultat d'un trimestre",
    "Expliquer pourquoi le résultat n'est pas la variation de la trésorerie",
    "Voir qu'un remboursement d'emprunt vide la banque sans toucher au résultat",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_LA_GESTION_DE_BASE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux questions",
      notions: ["income_statement"],
      texte: (c) => [
        `Chaque opération ${dE(c.entreprise)} se regarde de deux façons.`,
        "D'abord : enrichit-elle ou appauvrit-elle l'entreprise ? Une vente l'enrichit : c'est un produit. Le loyer, les salaires, les achats consommés l'appauvrissent : ce sont des charges. Le résultat, c'est les produits moins les charges.",
        "Ensuite : fait-elle entrer ou sortir de l'argent, et quand ? Un encaissement, c'est de l'argent qui entre ; un décaissement, de l'argent qui sort. La trésorerie, c'est l'argent disponible.",
        "Les deux questions n'ont pas toujours la même réponse. C'est tout l'objet de ce chapitre.",
      ],
      repere: () =>
        "Charge et produit : ce qui appauvrit ou enrichit l'entreprise, le jour où cela se passe. Décaissement et encaissement : ce qui sort ou entre en banque, le jour où l'argent bouge.",
    },
    {
      id: "charge-ou-produit",
      objectifs: [0],
      type: "tri",
      titre: "Charge, produit, ou ni l'un ni l'autre ?",
      notions: ["income_statement"],
      question: (c) => `Voici le mois de janvier ${dE(c.entreprise)}, hors taxes. Chaque opération est-elle une charge, un produit, ou ni l'un ni l'autre ?`,
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
        { libelle: `Achat chez ${c.achat.fournisseur}`, montant: c.achat.ht, categorie: "charge", pourquoi: "Ce qui est acheté pour produire se consomme : c'est une charge." },
        { libelle: "Loyer du mois", montant: c.loyer.montant, categorie: "charge", pourquoi: "Un mois d'occupation du local, consommé." },
        { libelle: "Salaires et cotisations patronales", montant: c.personnel.cout, categorie: "charge", pourquoi: "Le travail du mois : brut et cotisations patronales." },
        { libelle: `Vente à ${c.venteCredit.client}`, montant: c.venteCredit.ht, categorie: "produit", pourquoi: "Une vente enrichit l'entreprise, même si le client paie plus tard." },
        { libelle: "Ventes aux particuliers", montant: c.venteComptant.ht, categorie: "produit", pourquoi: "Des ventes : un produit." },
      ],
      explication: () => [
        "Ni l'apport, ni l'emprunt, ni l'équipement ne touchent au résultat : les deux premiers financent l'entreprise, le troisième lui appartient. Ils changent le bilan, pas le compte de résultat.",
      ],
    },
    {
      id: "entree-ou-sortie",
      objectifs: [1],
      type: "tri",
      titre: "De l'argent, ce mois-ci ?",
      notions: ["payment_terms"],
      question: (c) => `Les mêmes opérations, taxes comprises cette fois : font-elles entrer de l'argent à la banque ${dE(c.entreprise)} en janvier, en sortir, ou rien du tout ce mois-ci ?`,
      categories: [
        { code: "encaissement", libelle: "Encaissement" },
        { code: "decaissement", libelle: "Décaissement" },
        { code: "rien", libelle: "Rien ce mois-ci" },
      ],
      elements: (c) => [
        { libelle: "Apport versé", montant: c.capital, categorie: "encaissement", pourquoi: "Les associés versent l'argent sur le compte de l'entreprise." },
        { libelle: "Prêt versé par la banque", montant: c.emprunt, categorie: "encaissement", pourquoi: "La banque verse les fonds : de l'argent entre, sans être un produit." },
        { libelle: "Équipement payé", montant: c.immobilisation.ttc, categorie: "decaissement", pourquoi: "Payé à l'achat : l'argent sort, sans être une charge." },
        { libelle: `Facture ${dE(c.achat.fournisseur)}`, montant: c.achat.ttc, categorie: "rien", pourquoi: `Payée le ${date(c.achat.echeance)} : la charge est en janvier, le décaissement plus tard.` },
        { libelle: "Loyer payé", montant: c.loyer.montant, categorie: "decaissement", pourquoi: "Payé dans le mois : charge et décaissement tombent ensemble." },
        { libelle: "Salaires nets versés", montant: c.personnel.net, categorie: "decaissement", pourquoi: "Les salariés sont payés à la fin du mois." },
        {
          libelle: "Cotisations sociales",
          montant: c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales,
          categorie: "rien",
          pourquoi: `Versées à l'URSSAF le ${date(c.personnel.dateUrssaf)} : le mois suivant.`,
        },
        {
          libelle: `Facture ${dE(c.venteCredit.client)}`,
          montant: c.venteCredit.ttc,
          categorie: "rien",
          pourquoi: `Payée le ${date(c.venteCredit.echeance)}, avec du retard : le produit est en janvier, l'encaissement bien plus tard.`,
        },
        { libelle: "Ventes aux particuliers encaissées", montant: c.venteComptant.ttc, categorie: "encaissement", pourquoi: "Payées par carte, à la commande." },
      ],
      explication: (c) => [
        `En janvier, ${c.entreprise} a des charges qu'elle n'a pas encore payées, et un produit qu'elle n'a pas encore encaissé. Elle a aussi encaissé de l'argent qui n'est pas un produit (l'apport, le prêt) et payé un équipement qui n'est pas une charge.`,
      ],
    },
    {
      id: "le-trimestre",
      objectifs: [2],
      type: "montants",
      titre: "Le résultat du trimestre",
      notions: ["income_statement"],
      tableau: tableauDuResultat,
      question: (c) => `Voici le compte de résultat du premier trimestre ${dE(c.entreprise)}, de janvier à mars, hors taxes. Calculez le total des charges, puis le résultat, avant l'impôt qui se calcule sur l'année.`,
      champs: () => {
        const t = resultat();
        return [
          { libelle: "Total des charges", attendu: t.totalCharges, calcul: `la somme de la colonne Charge : ${eur(t.totalCharges)}` },
          { libelle: "Résultat du trimestre", attendu: t.resultat, calcul: `${eur(t.produits)} − ${eur(t.totalCharges)} = ${eur(t.resultat)}` },
        ];
      },
      explication: (c) => {
        const t = resultat();
        return [
          t.resultat >= 0
            ? `${c.entreprise} s'est enrichie de ${eur(t.resultat)} sur le trimestre : c'est son bénéfice, avant impôt.`
            : `${c.entreprise} s'est appauvrie de ${eur(-t.resultat)} sur le trimestre : c'est une perte.`,
        ];
      },
    },
    {
      id: "resultat-et-banque",
      objectifs: [3],
      type: "montants",
      titre: "Le résultat et la banque",
      notions: ["income_statement", "net_treasury"],
      question: (c) => {
        const b = banque();
        return `Sur le même trimestre, la banque ${dE(c.entreprise)} est passée de ${eur(b.debut)} à ${eur(b.fin)}. Quelle est la variation de la banque ? De combien s'écarte-t-elle du résultat, ${eur(resultat().resultat)} ?`;
      },
      champs: () => {
        const b = banque();
        const ecart = auCentime(b.variation - resultat().resultat);
        return [
          { libelle: "Variation de la banque", attendu: b.variation, calcul: `${eur(b.fin)} − ${eur(b.debut)} = ${eur(b.variation)}` },
          { libelle: "Écart avec le résultat", attendu: ecart, calcul: `${eur(b.variation)} − ${eur(resultat().resultat)} = ${eur(ecart)}` },
        ];
      },
      explication: (c) => {
        const t = resultat();
        const b = banque();
        return [
          `${c.entreprise} gagne de l'argent, et sa banque baisse. La dotation aux amortissements, ${eur(t.dotation)}, est une charge qui ne sort pas de la banque. Le capital remboursé à la banque, ${eur(b.capitalRembourse)}, sort de la banque sans être une charge. ${c.venteCredit.client} n'a encore rien payé de ses ${eur(b.facturesDeCampusTech)} de factures. Et les composants de mars, la TVA et les cotisations de mars se paient en avril.`,
        ];
      },
    },
    {
      id: "la-dotation",
      objectifs: [3],
      type: "choix",
      titre: "Une charge qui ne se paie pas",
      notions: ["depreciation"],
      question: (c) => `Le compte de résultat du trimestre porte ${eur(resultat().dotation)} de dotation aux amortissements. Quand ${c.entreprise} paie-t-elle cette somme ?`,
      options: () => [
        {
          texte: "Jamais au cours du trimestre : l'équipement a été payé le jour de son achat, la dotation mesure seulement son usure.",
          juste: true,
          retour:
            "C'est cela. L'équipement est payé une fois, à l'achat : un décaissement sans charge. Puis, chaque trimestre, son usure devient une charge, sans décaissement. Au bout de sa durée de vie, les deux se rejoignent.",
        },
        { texte: "À la fin du trimestre, à la banque.", juste: false, retour: "Aucune banque ne reçoit la dotation : c'est une charge calculée, l'usure de l'équipement, qui ne fait sortir aucun argent." },
        { texte: "Au fournisseur de l'équipement, en plusieurs fois.", juste: false, retour: "Le fournisseur a été payé à l'achat. La dotation ne paie personne : elle répartit le coût de l'équipement sur les années où il sert." },
      ],
    },
    {
      id: "le-seuil-du-trimestre",
      objectifs: [2],
      type: "curseur",
      titre: "Assez vendre pour ne pas perdre",
      notions: ["income_statement", "fixed_costs"],
      question: (c) => {
        const t = resultat();
        return `Chaque ${c.unite} vendue laisse ${eur(margeDUneEnceinte())} une fois ses composants et ses autres coûts payés. Le loyer, le personnel, l'usure de la ligne et les intérêts, eux, font ${eur(t.chargesFixes)} sur le trimestre, quelles que soient les ventes. Faites varier les ${c.unites} vendues dans le trimestre, et placez le curseur sur le plus petit nombre qui donne un résultat positif ou nul.`;
      },
      grandeur: (c) => ({ libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} vendues dans le trimestre`, unite: c.unites }),
      cible: () => ({ attendu: seuilDuPremierTrimestre(), min: 3_000, max: 6_000 }),
      zones: ["Le trimestre est en bénéfice", "Le trimestre est en perte"],
      montrer: "Montrer le nombre",
      lecture: (_c, q) => {
        const t = resultat();
        const marge = auCentime(q * margeDUneEnceinte());
        return [
          { libelle: "Marge des ventes", montant: marge },
          { libelle: "Charges qui ne bougent pas", montant: t.chargesFixes },
          { libelle: "Résultat du trimestre", montant: auCentime(marge - t.chargesFixes), fort: true },
        ];
      },
      droites: () => ({ produit: (q) => q * margeDUneEnceinte(), cout: () => resultat().chargesFixes, libelles: ["Marge des ventes", "Charges qui ne bougent pas"] }),
      explication: (c) => {
        const t = resultat();
        const q = seuilDuPremierTrimestre();
        return [
          `Il faut ${qte(q)} ${c.unites} : leur marge, ${eur(auCentime(q * margeDUneEnceinte()))}, couvre les ${eur(t.chargesFixes)}. ${c.entreprise} en a vendu ${qte(t.quantite)} : son bénéfice, ${eur(t.resultat)}, est la marge des ${qte(t.quantite - q)} ${c.unites} de plus, à quelques euros près.`,
          "Même au-dessus de ce nombre, la banque peut baisser : vendre enrichit l'entreprise, mais l'argent arrive au rythme des paiements.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-remboursement",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du remboursement",
      notions: ["loan_schedule", "net_treasury"],
      question: (c) => {
        const b = banque();
        return `Fin mars, la banque ${dE(c.entreprise)} porte ${eur(b.fin)}. Le dirigeant voudrait rembourser une part de l'emprunt en avance, le 31 mars, sans pénalité. Mais il veut garder au moins ${eur(b.seuilDAlerte)} en banque, le matelas de son tableau de bord. Faites varier le remboursement, et regardez la banque et le résultat.`;
      },
      leviers: () => [{ code: "rembourse", libelle: "Remboursement anticipé", unite: "€", min: 0, max: 15_000, pas: PAS_DU_REMBOURSEMENT, depart: 0 }],
      lecture: (_c, p) => {
        const b = premierTrimestreALaBanque(undefined, { remboursementAnticipe: p.rembourse! });
        const depart = banque();
        return [
          { libelle: "Banque au 31 mars", montant: b.fin, reference: depart.fin, fort: true },
          { libelle: "Matelas voulu en banque", montant: b.seuilDAlerte },
          { libelle: "Résultat du trimestre", montant: resultat().resultat, reference: resultat().resultat },
        ];
      },
      defi: () => {
        const juste = remboursementPossible();
        return {
          consigne: "Trouvez le plus gros remboursement, au millier d'euros, qui laisse le matelas en banque au 31 mars.",
          atteint: (p) => p.rembourse === juste,
          indice: (p) => {
            const b = premierTrimestreALaBanque(undefined, { remboursementAnticipe: p.rembourse! });
            return b.fin < b.seuilDAlerte
              ? `La banque tomberait à ${eur(b.fin)}, sous le matelas de ${eur(b.seuilDAlerte)} : remboursez moins.`
              : `La banque garde ${eur(b.fin)} : il reste ${eur(auCentime(b.fin - b.seuilDAlerte))} au-dessus du matelas. Pouvez-vous rembourser un peu plus ?`;
          },
          solution: { rembourse: juste },
        };
      },
      explication: (c, p) => {
        const b = premierTrimestreALaBanque(undefined, { remboursementAnticipe: p.rembourse! });
        return [
          `Défi relevé : ${eur(p.rembourse!)} remboursés laissent ${eur(b.fin)} en banque. Le résultat, lui, n'a pas bougé : ${eur(resultat().resultat)}. Rembourser l'emprunt fait sortir de l'argent sans appauvrir ${c.entreprise} : elle doit autant de moins à la banque.`,
          "Seuls les intérêts sont une charge : en remboursant plus tôt, l'entreprise en paiera moins les trimestres suivants.",
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement"],
      texte: (c) => [
        `Vous savez poser les deux questions à chaque opération ${dE(c.entreprise)} : charge ou produit, encaissement ou décaissement, et quand.`,
        "Une entreprise peut gagner de l'argent et voir sa banque baisser, si ses clients paient tard ; elle peut perdre de l'argent et en avoir encore, si elle vient d'emprunter. Dans l'arène, le compte de résultat et le tableau de trésorerie se lisent ensemble : les chiffres de votre entreprise y seront différents, la lecture sera la même.",
      ],
      repere: () =>
        "Résultat = produits − charges. Variation de la trésorerie = encaissements − décaissements. Les deux diffèrent par les délais de paiement, les investissements, les emprunts et les amortissements.",
    },
  ],
};
