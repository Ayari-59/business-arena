import { arrondi2 as auCentime, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  BANQUE_DE_LA_BOUTIQUE,
  CONDITIONS_DE_VENTE,
  DELAIS_LEGAUX,
  INDEMNITE_FORFAITAIRE,
  JOURS_DE_LA_BANQUE,
  MODES_DE_REGLEMENT,
  RETARD_DU_COMITE,
  TAUX_DE_LA_BCE,
  coutDuFinancement,
  dateEcrite,
  delaiDesComites,
  echeancesDeLaFacture,
  escompteOuCredit,
  factureDuComite,
  penalitesDeRetard,
  plusDeJours,
} from "../monde/comptes-de-la-boutique";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : FACTURER ET SE FAIRE PAYER (BTS MCO, bloc 3, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique
 * MAILLE & CO (monde/maille-et-co.ts : la gamme, ses prix, les comités d'entreprise réglés à 45 jours)
 * et ses comptes (monde/comptes-de-la-boutique.ts : la commande de février d'un comité, les nouvelles
 * conditions de vente, les délais légaux, les pénalités, les conditions de la banque).
 *
 * L'objet : la boutique encaisse presque tout en caisse, sauf les commandes des comités, facturées et
 * réglées à 45 jours. Le chapitre établit leur facture (remise, net commercial, escompte, net
 * financier, TVA), en vérifie les mentions et l'échéance face aux plafonds légaux, chiffre un retard
 * (pénalités et indemnité de 40 €), compare les modes de règlement, puis la question du gérant :
 * accorder le crédit et le financer (découvert, escompte d'une LCR, affacturage), ou offrir un escompte
 * pour être payé comptant.
 *
 * Le piège central : l'escompte paraît petit (2 %) ; rapporté aux 45 jours qu'il fait gagner, c'est
 * un crédit à plus de 16 % l'an, deux fois le découvert. Et la créance à financer est toutes taxes
 * comprises : la TVA est due à l'État dès la facture.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui de l'épreuve) :
 *   · guidé : intro, la-facture, les-mentions, l-echeance (la formule au repère, les chiffres nommés) ;
 *   · l'expérience avant la formule : predire-l-escompte puis le-delai-au-curseur (le plus long crédit
 *     qu'un découvert finance pour moins que l'escompte) avant l-escompte-chiffre ; le laboratoire de
 *     l'escompte (taux d'escompte et délai accordé, le graphique des deux coûts) ;
 *   · autonome : les-penalites, l-escompte-chiffre, financer-la-creance ;
 *   · expert : le-taux-de-l-escompte (le taux annuel), ce-que-le-calcul-oublie (une critique), le
 *     mode-de-reglement ; puis la décision et la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : le taux annuel de l'escompte se donne à deux décimales, à un
 * centième près (au dixième, avant).
 */

/** Le chapitre se joue dans la boutique du cours : MAILLE & CO, seule. */
export const ENTREPRISES_DE_LA_FACTURATION: readonly string[] = ["boutique"];

export const POURQUOI_LA_BOUTIQUE_FACTURE =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît les comités d'entreprise, leurs commandes et leur délai de règlement : la facture se joue chez elle, quelle que soit votre entreprise.";

/** Les bornes du curseur du délai accordé, en jours. */
export const DELAI_DU_CURSEUR = { min: 0, max: 120 } as const;

/** Le laboratoire : les délais au choix (le délai de la fiche, et deux autres), le départ et une solution. */
export const DELAIS_DU_LABORATOIRE = [30, 45, 60] as const;
export const DEPART_DU_LABORATOIRE = { escompte: 2, delai: 45 } as const;
export const SOLUTION_DU_LABORATOIRE = { escompte: 1, delai: 45 } as const;
/** Le défi : un escompte d'au moins 1 % qui ne coûte pas plus que le découvert. */
export const ESCOMPTE_MINIMAL_DU_DEFI = 1;

const qte = nombreAuCentieme;

export const ficheDeLaFacture = (c: Pick<Cas, "code">): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

/** Ce que coûte, en euros, un escompte au taux t (en %) sur la facture du comité. */
const coutDUnEscompte = (f: FicheDeLaBoutique, t: number) => factureDuComite(f, { escompte: t / 100 }).escompte;

/** Tout ce que le chapitre et son cas demandent. */
export function facturationDuComite(c: Pick<Cas, "code">) {
  const f = ficheDeLaFacture(c);
  const facture = factureDuComite(f);
  const sansRemise = factureDuComite(f, { remise: 0 });
  const delai = delaiDesComites(f);
  const echeances = echeancesDeLaFacture(f);
  const retard = penalitesDeRetard(facture.ttc, RETARD_DU_COMITE);
  const e = escompteOuCredit(f);
  const financements = (["decouvert", "escompte", "affacturage"] as const).map((m) => coutDuFinancement(facture.ttc, delai, m));
  const moinsCher = [...financements].sort((a, b) => a.cout - b.cout)[0]!;
  // L'erreur classique : financer la créance hors taxes.
  const decouvertHt = coutDuFinancement(facture.netCommercial, delai, "decouvert");
  return {
    f,
    facture,
    sansRemise,
    delai,
    echeances,
    retard,
    e,
    comptant: e.comptant,
    financements,
    decouvert: financements[0]!,
    lcr: financements[1]!,
    affacturage: financements[2]!,
    moinsCher,
    decouvertHt,
    tauxAnnuel: auCentime(e.tauxAnnuelDeLEscompte * 100),
    // L'escompte qui coûte autant que le découvert au délai de la fiche, en %.
    escompteQuiEgale: (e.financement.cout / facture.netCommercial) * 100,
  };
}

export type FacturationDuComite = ReturnType<typeof facturationDuComite>;

const NOMS_DES_FINANCEMENTS = { decouvert: "Découvert autorisé", escompte: "Escompte d'une LCR", affacturage: "Affacturage" } as const;

/** La commande du comité, ligne par ligne : le document de départ. */
export function tableauDeLaCommande(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = facturationDuComite(c);
  return {
    titre: `La commande du comité, facturée le ${dateEcrite(x.echeances.emission)}`,
    colonnes: ["Articles", "Prix hors taxes", "Montant brut"],
    lignes: x.facture.lignes.map((l) => ({ libelle: l.nom, valeurs: [qte(l.quantite), eur(l.prixHt), eur(l.montant)] })),
  };
}

/** Les conditions de la banque de la boutique. */
export function tableauDeLaBanque(): TableauDeDonnees {
  const b = BANQUE_DE_LA_BOUTIQUE;
  return {
    titre: "Ce que propose la banque de la boutique",
    colonnes: ["Taux annuel", "Commission"],
    lignes: [
      { libelle: NOMS_DES_FINANCEMENTS.decouvert, valeurs: [pct(b.decouvert.taux * 100), "aucune"] },
      { libelle: NOMS_DES_FINANCEMENTS.escompte, valeurs: [pct(b.escompte.taux * 100), `${eur(b.escompte.commissionParEffet)} par effet`] },
      { libelle: NOMS_DES_FINANCEMENTS.affacturage, valeurs: [pct(b.affacturage.taux * 100), `${pct(b.affacturage.commission * 100)} du montant toutes taxes comprises`] },
    ],
  };
}

/** Les modes de règlement d'un comité. */
function tableauDesReglements(): TableauDeDonnees {
  return {
    titre: "Les modes de règlement d'un comité d'entreprise",
    colonnes: ["Coût pour la boutique", "Encaissé", "Risque"],
    lignes: MODES_DE_REGLEMENT.map((m) => ({ libelle: m.libelle, valeurs: [m.cout, m.quand, m.risque] })),
  };
}

export const FACTURER_ET_SE_FAIRE_PAYER: Chapitre = {
  code: "facturer-et-se-faire-payer",
  parcours: "mco",
  palier: 3,
  blocs: ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"],
  titre: "Facturer et se faire payer",
  accroche:
    "Les comités d'entreprise ne paient pas en caisse : ils reçoivent une facture et règlent à 45 jours. Établir la facture, la dater sous le plafond légal, chiffrer un retard, puis la question du gérant : financer ce crédit, ou offrir un escompte pour être payé tout de suite ?",
  objectifs: [
    "Établir une facture avec remise et escompte, et en vérifier les mentions obligatoires",
    "Dater une échéance face aux délais légaux, et chiffrer les pénalités d'un retard",
    "Calculer le coût d'un escompte et son taux annuel, et le comparer au coût d'un crédit",
    "Comparer le découvert, l'escompte d'une LCR et l'affacturage pour financer une créance",
    "Choisir les conditions de règlement d'un client professionnel, et le dire au gérant",
  ],
  libre: false,
  prerequis: ["taux-de-marque-et-coefficient", "budget-du-point-de-vente"],
  ensuite: ["remises-et-reglements", "le-client-qui-paie-tard", "financer-et-placer-la-tresorerie"],
  entreprises: { codes: ENTREPRISES_DE_LA_FACTURATION, pourquoi: POURQUOI_LA_BOUTIQUE_FACTURE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une commande qui ne passe pas en caisse",
      notions: ["payment_terms", "receivables_financing"],
      tableau: tableauDeLaCommande,
      texte: (c) => {
        const x = facturationDuComite(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. Les clientes et les passants paient en caisse ; les comités d'entreprise, eux, passent commande et reçoivent une facture, réglée à ${qte(x.delai)} jours. Le ${dateEcrite(x.echeances.emission)}, un comité commande ${qte(x.facture.articles)} articles.`,
          `Le gérant vient d'écrire de nouvelles conditions de vente : une remise de ${pct(CONDITIONS_DE_VENTE.remise * 100)} à partir de ${qte(CONDITIONS_DE_VENTE.seuilDeLaRemise)} articles, et le règlement à ${qte(x.delai)} jours ; ou bien, si le comité paie comptant à la commande, un escompte de ${pct(CONDITIONS_DE_VENTE.escompte * 100)}.`,
          "Ce que la simulation suppose. Les prix sont ceux de la gamme ; la banque de la boutique compte ses intérêts sur une année de 360 jours ; le comité est un acheteur professionnel, et les règles des factures entre professionnels s'appliquent.",
        ];
      },
      repere: () => "Brut − remise = net commercial ; net commercial − escompte = net financier ; TVA = net financier × 20 % ; net à payer = net financier + TVA.",
    },
    {
      id: "la-facture",
      objectifs: [0],
      type: "montants",
      titre: "La facture à 45 jours",
      notions: ["payment_terms", "vat_payable"],
      tableau: tableauDeLaCommande,
      question: (c) => {
        const x = facturationDuComite(c);
        return `Le comité choisit le règlement à ${qte(x.delai)} jours : pas d'escompte. Calculez le montant brut, la remise de ${pct(x.facture.tauxDeRemise * 100)}, le net commercial, la TVA à 20 %, puis le net à payer toutes taxes comprises.`;
      },
      champs: (c) => {
        const x = facturationDuComite(c).facture;
        return [
          { libelle: "Montant brut", attendu: x.brut, calcul: x.lignes.map((l) => `${qte(l.quantite)} × ${eur(l.prixHt)}`).join(" + ") + ` = ${eur(x.brut)}` },
          { libelle: "Remise", attendu: x.remise, calcul: `${eur(x.brut)} × ${pct(x.tauxDeRemise * 100)} = ${eur(x.remise)}` },
          { libelle: "Net commercial", attendu: x.netCommercial, calcul: `${eur(x.brut)} − ${eur(x.remise)} = ${eur(x.netCommercial)}` },
          { libelle: "TVA", attendu: x.tva, calcul: `${eur(x.netFinancier)} × 20 % = ${eur(x.tva)}` },
          { libelle: "Net à payer", attendu: x.ttc, calcul: `${eur(x.netFinancier)} + ${eur(x.tva)} = ${eur(x.ttc)}` },
        ];
      },
      explication: (c) => {
        const x = facturationDuComite(c);
        return [
          `Le comité doit ${eur(x.facture.ttc)}. La remise est une réduction commerciale, accordée sur la quantité : elle se calcule sur le brut et baisse la base de la TVA. Sans remise, la facture aurait été de ${eur(x.sansRemise.ttc)}.`,
        ];
      },
    },
    {
      id: "les-mentions",
      objectifs: [0],
      type: "choix",
      titre: "Ce que la facture doit dire",
      notions: ["payment_terms"],
      question: (c) => {
        const x = facturationDuComite(c);
        return `Le brouillon de la facture porte un numéro unique, la date, les noms et adresses des deux parties, le numéro SIREN de la boutique. Il détaille chaque article avec sa quantité et son prix hors taxes, la remise, le taux et le montant de la TVA, le net à payer et l'échéance du ${dateEcrite(x.echeances.convenue)}. Que manque-t-il pour qu'elle soit conforme ?`;
      },
      options: () => [
        {
          texte: `Les pénalités de retard et l'indemnité de ${eur(INDEMNITE_FORFAITAIRE)}`,
          juste: true,
          retour: `Oui. Entre professionnels, la facture doit annoncer ce qu'un retard coûtera : le taux des pénalités et l'indemnité forfaitaire de ${eur(INDEMNITE_FORFAITAIRE)} pour frais de recouvrement, et les conditions d'escompte (ici, l'escompte pour paiement comptant). Une mention manquante expose la boutique à une amende administrative.`,
        },
        { texte: "La signature du gérant", juste: false, retour: "Non : une facture n'a pas à être signée. Ce qui la rend conforme, ce sont ses mentions, pas une signature." },
        { texte: "Le coût d'achat de chaque article", juste: false, retour: "Surtout pas : le coût d'achat est une donnée interne. La facture dit le prix de vente, la remise et la TVA." },
        { texte: "Le mode de règlement que le comité doit employer", juste: false, retour: "Non : la facture dit quand payer et ce que coûte un retard ; le moyen de paiement reste au choix des deux parties, dans les limites de la loi." },
      ],
    },
    {
      id: "l-echeance",
      objectifs: [1],
      type: "choix",
      titre: "L'échéance et le plafond légal",
      notions: ["payment_terms"],
      question: (c) => {
        const x = facturationDuComite(c);
        return `Facturé le ${dateEcrite(x.echeances.emission)} à ${qte(x.delai)} jours, le comité doit payer le ${dateEcrite(x.echeances.convenue)}. Il demande à payer « à ${qte(DELAIS_LEGAUX.dateDeFacture)} jours fin de mois », soit fin avril. La boutique peut-elle l'accepter ?`;
      },
      options: (c) => {
        const x = facturationDuComite(c);
        const e = x.echeances;
        return [
          {
            texte: `Non : la loi plafonne à ${qte(DELAIS_LEGAUX.dateDeFacture)} jours date de facture, le ${dateEcrite(e.plafondDateDeFacture)}`,
            juste: true,
            retour: `Oui. Entre professionnels, le délai ne dépasse pas ${qte(DELAIS_LEGAUX.dateDeFacture)} jours après la facture (le ${dateEcrite(e.plafondDateDeFacture)}), ou ${qte(DELAIS_LEGAUX.finDeMois)} jours fin de mois s'il est écrit au contrat (le ${dateEcrite(e.plafondFinDeMois)}). Fin avril dépasse les deux.`,
          },
          { texte: "Oui : le délai se négocie librement entre deux professionnels", juste: false, retour: `Non : il se négocie, mais sous un plafond. Le code de commerce l'arrête à ${qte(DELAIS_LEGAUX.dateDeFacture)} jours date de facture, ou ${qte(DELAIS_LEGAUX.finDeMois)} jours fin de mois.` },
          { texte: "Oui, si le comité paie des pénalités", juste: false, retour: "Non : les pénalités sanctionnent un retard sur l'échéance ; elles n'autorisent pas une échéance au-delà du plafond." },
        ];
      },
    },
    {
      id: "les-penalites",
      objectifs: [1],
      type: "montants",
      titre: "Le comité paie en retard",
      notions: ["payment_terms"],
      question: () => {
        return `Le comité paie finalement ${qte(RETARD_DU_COMITE)} jours après l'échéance. Les pénalités se calculent au taux de la BCE (${pct(TAUX_DE_LA_BCE * 100)}) majoré de 10 points, sur le net à payer et sur une année de 365 jours. Calculez le taux des pénalités (en %), leur montant, puis ce que la boutique peut réclamer en tout avec l'indemnité forfaitaire.`;
      },
      champs: (c) => {
        const x = facturationDuComite(c);
        const r = x.retard;
        return [
          { libelle: "Taux des pénalités (%)", attendu: auCentime(r.taux * 100), calcul: `${pct(TAUX_DE_LA_BCE * 100)} + 10 points = ${pct(r.taux * 100)}` },
          { libelle: "Pénalités de retard", attendu: r.penalites, calcul: `${eur(x.facture.ttc)} × ${pct(r.taux * 100)} × ${qte(r.joursDeRetard)} ÷ 365 = ${eur(r.penalites)}` },
          { libelle: "Total réclamé au comité", attendu: r.total, calcul: `${eur(r.penalites)} + ${eur(r.indemnite)} = ${eur(r.total)}` },
        ];
      },
      explication: (c) => {
        const r = facturationDuComite(c).retard;
        return [
          `Le retard coûte au comité ${eur(r.total)}, dont ${eur(r.indemnite)} d'indemnité forfaitaire, due dès le premier jour. Les pénalités courent sans relance ; dans les faits, la boutique ne les réclame pas toujours à un bon client, mais elle doit pouvoir le faire.`,
        ];
      },
    },
    {
      id: "predire-l-escompte",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur l'escompte",
      notions: ["payment_terms", "receivables_financing"],
      question: (c) => {
        const x = facturationDuComite(c);
        return `Avant de calculer, pariez. Offrir ${pct(CONDITIONS_DE_VENTE.escompte * 100)} d'escompte pour être payé à la commande, plutôt qu'à ${qte(x.delai)} jours, coûte ${eur(x.comptant.escompte)} à la boutique. Financer ces ${qte(x.delai)} jours au découvert, à ${pct(BANQUE_DE_LA_BOUTIQUE.decouvert.taux * 100)} l'an, coûterait…`;
      },
      options: (c) => {
        const x = facturationDuComite(c);
        const voir = "Faites varier le délai à l'étape suivante : le curseur montre jusqu'où le découvert reste moins cher.";
        return [
          { texte: "Moins que l'escompte", juste: x.decouvert.cout < x.comptant.escompte, retour: `Bon pari. ${voir}` },
          { texte: "Autant que l'escompte", juste: x.decouvert.cout === x.comptant.escompte, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus que l'escompte : un taux annuel s'applique", juste: x.decouvert.cout > x.comptant.escompte, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-delai-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Jusqu'où le crédit reste moins cher",
      notions: ["receivables_financing", "payment_terms"],
      question: (c) => {
        const x = facturationDuComite(c);
        return `Faites varier le délai accordé au comité, de ${qte(DELAI_DU_CURSEUR.min)} à ${qte(DELAI_DU_CURSEUR.max)} jours. Une droite donne le coût de l'escompte (${eur(x.comptant.escompte)}, quel que soit le délai), l'autre celui du découvert qui finance la créance de ${eur(x.facture.ttc)}. Placez le curseur sur le plus long délai où le découvert ne coûte pas plus que l'escompte, puis validez. C'est une comparaison de coûts : le plafond légal reste de 60 jours.`;
      },
      grandeur: () => ({ libelle: "Délai accordé au comité", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: facturationDuComite(c).e.delaiQuiEgaleLEscompte, min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max }),
      zones: ["Le crédit coûte moins que l'escompte", "L'escompte coûte moins que le crédit"],
      rates: () => ({
        dessous: "À ce délai, le découvert coûte encore moins que l'escompte : vous pouvez aller plus loin.",
        dessus: "À ce délai, le découvert coûte déjà plus que l'escompte : cherchez plus bas.",
      }),
      montrer: "Montrer le délai qui égale l'escompte",
      lecture: (c, jours) => {
        const x = facturationDuComite(c);
        const d = coutDuFinancement(x.facture.ttc, jours, "decouvert");
        return [
          { libelle: "Coût de l'escompte", montant: x.comptant.escompte },
          { libelle: "Coût du découvert sur le délai", montant: d.cout },
          { libelle: "Ce que le crédit fait gagner sur l'escompte", montant: auCentime(x.comptant.escompte - d.cout), fort: true },
        ];
      },
      droites: (c) => {
        const x = facturationDuComite(c);
        return {
          produit: () => x.comptant.escompte,
          cout: (jours) => (x.facture.ttc * BANQUE_DE_LA_BOUTIQUE.decouvert.taux * jours) / JOURS_DE_LA_BANQUE,
          libelles: ["Coût de l'escompte", "Coût du découvert"],
        };
      },
      explication: (c) => {
        const x = facturationDuComite(c);
        return [
          `Jusqu'à ${qte(x.e.delaiQuiEgaleLEscompte)} jours de crédit, le découvert coûte moins que l'escompte : l'escompte de ${pct(CONDITIONS_DE_VENTE.escompte * 100)} vaut un crédit de ${qte(x.e.delaiQuiEgaleLEscompte)} jours, bien plus que les ${qte(x.delai)} jours qu'il fait gagner, et plus que le plafond légal.`,
          "Un escompte se juge donc comme un taux d'intérêt : ce qu'il coûte, rapporté aux jours qu'il fait gagner. L'étape suivante le chiffre.",
        ];
      },
    },
    {
      id: "l-escompte-chiffre",
      objectifs: [0, 2],
      type: "montants",
      titre: "La facture payée comptant",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const x = facturationDuComite(c);
        return `Sans formule cette fois. Le comité paie comptant et prend l'escompte de ${pct(CONDITIONS_DE_VENTE.escompte * 100)}. Calculez l'escompte, le net financier, la TVA et le net à payer, puis le coût du découvert qui aurait financé la facture à ${qte(x.delai)} jours.`;
      },
      champs: (c) => {
        const x = facturationDuComite(c);
        const k = x.comptant;
        return [
          { libelle: "Escompte", attendu: k.escompte, calcul: `${eur(k.netCommercial)} × ${pct(k.tauxDEscompte * 100)} = ${eur(k.escompte)}` },
          { libelle: "Net financier", attendu: k.netFinancier, calcul: `${eur(k.netCommercial)} − ${eur(k.escompte)} = ${eur(k.netFinancier)}` },
          { libelle: "TVA sur le net financier", attendu: k.tva, calcul: `${eur(k.netFinancier)} × 20 % = ${eur(k.tva)}` },
          { libelle: "Net à payer comptant", attendu: k.ttc, calcul: `${eur(k.netFinancier)} + ${eur(k.tva)} = ${eur(k.ttc)}` },
          {
            libelle: "Coût du découvert à 45 jours",
            attendu: x.decouvert.cout,
            calcul: `${eur(x.facture.ttc)} × ${pct(BANQUE_DE_LA_BOUTIQUE.decouvert.taux * 100)} × ${qte(x.delai)} ÷ ${qte(JOURS_DE_LA_BANQUE)} = ${eur(x.decouvert.cout)}`,
          },
        ];
      },
      explication: (c) => {
        const x = facturationDuComite(c);
        return [
          `L'escompte coûte ${eur(x.comptant.escompte)} hors taxes ; la TVA baisse aussi de ${eur(auCentime(x.facture.tva - x.comptant.tva))}, mais la boutique la reverse en moins à l'État : ce n'est pas un coût. Financer le crédit au découvert coûterait ${eur(x.decouvert.cout)}, ${eur(x.e.gainDuCredit)} de moins.`,
          "La créance financée est toutes taxes comprises : la boutique déclare et reverse la TVA de la facture avant de l'encaisser.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-escompte",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de l'escompte",
      notions: ["payment_terms", "receivables_financing"],
      question: () =>
        "Faites varier le taux de l'escompte offert pour un paiement comptant, et le délai accordé à défaut. Le tableau suit le coût de l'escompte, celui du découvert qui financerait le crédit et le taux annuel de l'escompte ; le graphique trace les deux coûts selon le taux. Puis relevez le défi.",
      leviers: () => [
        { code: "escompte", libelle: "Escompte offert", unite: "%", min: 0, max: 3, pas: 0.25, depart: DEPART_DU_LABORATOIRE.escompte },
        {
          code: "delai",
          libelle: "Délai accordé sans escompte",
          unite: "jours",
          min: DELAIS_DU_LABORATOIRE[0],
          max: DELAIS_DU_LABORATOIRE[DELAIS_DU_LABORATOIRE.length - 1]!,
          pas: 15,
          depart: DEPART_DU_LABORATOIRE.delai,
          choix: DELAIS_DU_LABORATOIRE.map((d) => ({ valeur: d, libelle: `${d} jours` })),
        },
      ],
      lecture: (c, p) => {
        const x = facturationDuComite(c);
        const lire = (t: number, d: number) => {
          const e = escompteOuCredit(x.f, { escompte: t / 100, jours: d });
          return { escompte: e.coutDeLEscompte, decouvert: e.financement.cout, taux: auCentime(e.tauxAnnuelDeLEscompte * 100), ecart: auCentime(e.financement.cout - e.coutDeLEscompte) };
        };
        const l = lire(p.escompte!, p.delai!);
        const d = lire(DEPART_DU_LABORATOIRE.escompte, DEPART_DU_LABORATOIRE.delai);
        return [
          { libelle: "Coût de l'escompte", montant: l.escompte, reference: d.escompte },
          { libelle: "Coût du découvert sur le délai", montant: l.decouvert, reference: d.decouvert },
          { libelle: "Taux annuel de l'escompte", montant: l.taux, reference: d.taux, unite: "%" },
          { libelle: "Ce que l'escompte fait gagner sur le crédit", montant: l.ecart, reference: d.ecart, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = facturationDuComite(c);
        return {
          levier: "escompte",
          courbes: [
            { libelle: "Coût de l'escompte", valeur: (p) => coutDUnEscompte(x.f, p.escompte!) },
            { libelle: "Coût du découvert", valeur: (p) => coutDuFinancement(x.facture.ttc, p.delai!, "decouvert").cout },
          ],
        };
      },
      defi: (c) => {
        const x = facturationDuComite(c);
        const reussi = (t: number, d: number) => t >= ESCOMPTE_MINIMAL_DU_DEFI && coutDUnEscompte(x.f, t) <= coutDuFinancement(x.facture.ttc, d, "decouvert").cout;
        return {
          consigne: `Offrez un escompte d'au moins ${pct(ESCOMPTE_MINIMAL_DU_DEFI)} qui ne coûte pas plus que le découvert du crédit qu'il remplace.`,
          atteint: (p) => reussi(p.escompte!, p.delai!),
          indice: (p) => {
            const esc = coutDUnEscompte(x.f, p.escompte!);
            const dec = coutDuFinancement(x.facture.ttc, p.delai!, "decouvert").cout;
            if (p.escompte! < ESCOMPTE_MINIMAL_DU_DEFI) return `Un escompte de ${pct(p.escompte!)} n'attirerait aucun comité : le défi en veut au moins ${pct(ESCOMPTE_MINIMAL_DU_DEFI)}.`;
            return `À ${pct(p.escompte!)}, l'escompte coûte ${eur(esc)}, le découvert de ${qte(p.delai!)} jours ${eur(dec)} : l'escompte est trop généreux pour ce délai. Remisez moins, ou comparez à un crédit plus long.`;
          },
          solution: SOLUTION_DU_LABORATOIRE,
        };
      },
      montrer: "Montrer un escompte qui ne coûte pas plus",
      explication: (c, p) => {
        const x = facturationDuComite(c);
        const e = escompteOuCredit(x.f, { escompte: p.escompte! / 100, jours: p.delai! });
        return [
          `Un escompte de ${pct(p.escompte!)} contre ${qte(p.delai!)} jours de crédit coûte ${eur(e.coutDeLEscompte)}, pour ${eur(e.financement.cout)} de découvert : c'est un crédit à ${pct(auCentime(e.tauxAnnuelDeLEscompte * 100))} l'an. Plus le délai remplacé est long, plus l'escompte peut être fort ; à ${qte(x.delai)} jours, l'escompte qui égale le découvert est de ${pct(auCentime(x.escompteQuiEgale))}.`,
        ];
      },
    },
    {
      id: "le-taux-de-l-escompte",
      objectifs: [2],
      type: "montants",
      titre: "L'escompte, en taux annuel",
      notions: ["payment_terms", "receivables_financing"],
      question: (c) => {
        const x = facturationDuComite(c);
        return `Exprimez l'escompte de ${pct(CONDITIONS_DE_VENTE.escompte * 100)} en taux annuel : son coût divisé par le net financier, multiplié par ${qte(JOURS_DE_LA_BANQUE)} et divisé par les ${qte(x.delai)} jours gagnés. Donnez-le en pourcentage, à deux décimales.`;
      },
      champs: (c) => {
        const x = facturationDuComite(c);
        return [
          {
            libelle: "Taux annuel de l'escompte (%)",
            attendu: x.tauxAnnuel,
            calcul: `${eur(x.comptant.escompte)} ÷ ${eur(x.comptant.netFinancier)} × ${qte(JOURS_DE_LA_BANQUE)} ÷ ${qte(x.delai)} × 100 = ${pct(x.tauxAnnuel)}`,
          },
        ];
      },
      explication: (c) => {
        const x = facturationDuComite(c);
        return [
          `L'escompte revient à emprunter à ${pct(x.tauxAnnuel)} l'an, quand le découvert coûte ${pct(BANQUE_DE_LA_BOUTIQUE.decouvert.taux * 100)}. C'est pourquoi tant d'entreprises le refusent : il n'intéresse que celle qui ne trouve pas de banque.`,
        ];
      },
    },
    {
      id: "financer-la-creance",
      objectifs: [3],
      type: "montants",
      titre: "Trois façons de financer la créance",
      notions: ["receivables_financing"],
      tableau: tableauDeLaBanque,
      question: (c) => {
        const x = facturationDuComite(c);
        return `La boutique accorde les ${qte(x.delai)} jours et finance la facture de ${eur(x.facture.ttc)}. Calculez le coût de chaque financement sur ${qte(x.delai)} jours, intérêts et commission compris.`;
      },
      champs: (c) => {
        const x = facturationDuComite(c);
        return x.financements.map((m) => ({
          libelle: `Coût · ${NOMS_DES_FINANCEMENTS[m.mode]}`,
          attendu: m.cout,
          calcul: `${eur(x.facture.ttc)} × ${pct(m.taux * 100)} × ${qte(m.jours)} ÷ ${qte(JOURS_DE_LA_BANQUE)} = ${eur(m.interets)}${m.commission > 0 ? ` ; + ${eur(m.commission)} de commission = ${eur(m.cout)}` : ""}`,
        }));
      },
      explication: (c) => {
        const x = facturationDuComite(c);
        return [
          `Le moins cher est ${NOMS_DES_FINANCEMENTS[x.moinsCher.mode].toLowerCase()}, ${eur(x.moinsCher.cout)}. L'escompte de la LCR a le plus petit taux, mais sa commission fixe pèse sur une petite facture. L'affacturage coûte le plus, ${eur(x.affacturage.cout)} : il achète aussi la garantie contre l'impayé et le recouvrement.`,
        ];
      },
    },
    {
      id: "ce-que-le-calcul-oublie",
      objectifs: [3],
      type: "choix",
      titre: "Ce que la comparaison ne voit pas",
      notions: ["receivables_financing", "payment_terms"],
      question: (c) => {
        const x = facturationDuComite(c);
        return `Un collègue conclut : « L'affacturage coûte ${eur(x.affacturage.cout)}, le découvert ${eur(x.decouvert.cout)} : l'affacturage ne sert jamais. » Qu'en dites-vous ?`;
      },
      options: () => [
        {
          texte: "Il oublie la garantie de l'impayé et le recouvrement",
          juste: true,
          retour: "Oui. Le découvert finance la créance, rien de plus : si le comité ne paie pas, la perte reste à la boutique. L'affacturage se compare donc à un financement plus une assurance et un service de relance ; il se justifie quand les clients sont nombreux ou fragiles.",
        },
        { texte: "Il a raison : seul le coût compte", juste: false, retour: "Non : deux financements qui ne rendent pas le même service ne se comparent pas sur leur seul coût." },
        { texte: "Il se trompe : l'affacturage finance la créance hors taxes", juste: false, retour: "Non : le factor avance la créance telle qu'elle est due, toutes taxes comprises, comme la banque." },
      ],
    },
    {
      id: "le-mode-de-reglement",
      objectifs: [4],
      type: "choix",
      titre: "Le mode de règlement du comité",
      notions: ["payment_terms"],
      tableau: tableauDesReglements,
      question: (c) => {
        const x = facturationDuComite(c);
        return `Le comité réglera ses ${eur(x.facture.ttc)} à ${qte(x.delai)} jours. Quel mode de règlement le gérant doit-il lui demander ?`;
      },
      options: () => [
        {
          texte: "Une LCR, que la boutique peut escompter",
          juste: true,
          retour: "Oui. Avec la LCR, c'est la boutique qui déclenche le paiement le jour de l'échéance, sans attendre le bon vouloir du comité, et elle peut la remettre à l'escompte si sa trésorerie manque. Le virement, moins cher, laisse l'initiative au comité.",
        },
        { texte: "Des espèces, sans frais bancaires ni délai", juste: false, retour: `Non : entre professionnels, un paiement en espèces est plafonné à 1 000 €, et la facture en fait près de trois fois plus.` },
        { texte: "Un chèque, qui ne coûte rien à encaisser", juste: false, retour: "Il ne coûte rien, mais il arrive quand le comité l'envoie, ne s'encaisse qu'après sa remise en banque, et peut revenir impayé." },
        { texte: "La carte bancaire, garantie et immédiate", juste: false, retour: "Elle est garantie, mais elle se paie à la commande : elle supprime le crédit au lieu de l'organiser, et coûte un pourcentage du montant." },
      ],
    },
    {
      id: "decider",
      objectifs: [4],
      type: "choix",
      titre: "Que répondre au gérant ?",
      notions: ["payment_terms", "receivables_financing"],
      question: (c) => `Le gérant hésite : garder le règlement à ${qte(facturationDuComite(c).delai)} jours, ou pousser les comités à payer comptant avec l'escompte de ${pct(CONDITIONS_DE_VENTE.escompte * 100)} ?`,
      options: (c) => {
        const x = facturationDuComite(c);
        return [
          {
            texte: `Garder les ${qte(x.delai)} jours et financer au découvert`,
            juste: true,
            retour: `Oui : ${eur(x.decouvert.cout)} contre ${eur(x.comptant.escompte)}. L'escompte de ${pct(CONDITIONS_DE_VENTE.escompte * 100)} coûte un crédit à ${pct(x.tauxAnnuel)} l'an ; le découvert finance les mêmes jours pour ${eur(x.decouvert.cout)}. Il faudrait un escompte d'au plus ${pct(auCentime(x.escompteQuiEgale))} pour qu'il ne coûte pas plus. Avec une LCR, la boutique garde la main sur l'échéance.`,
          },
          { texte: `Pousser l'escompte : ${pct(CONDITIONS_DE_VENTE.escompte * 100)} est moins cher que ${pct(BANQUE_DE_LA_BOUTIQUE.decouvert.taux * 100)}`, juste: false, retour: `Non : c'est comparer un taux sur ${qte(x.delai)} jours à un taux sur un an. Rapporté à l'année, l'escompte coûte ${pct(x.tauxAnnuel)}.` },
          { texte: "Passer à l'affacturage pour toutes les factures des comités", juste: false, retour: `Non : il coûte ${eur(x.affacturage.cout)} par facture comme celle-ci, pour une garantie dont la boutique a peu besoin avec quelques comités fidèles.` },
          { texte: `Allonger le crédit à ${qte(DELAIS_LEGAUX.dateDeFacture)} jours pour fidéliser les comités`, juste: false, retour: "Ce n'est pas la question posée, et chaque jour de plus coûte du découvert : la boutique financerait davantage la trésorerie de ses clients." },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payment_terms", "receivables_financing"],
      tableau: (c) => {
        const x = facturationDuComite(c);
        return {
          titre: `La facture du comité, et ce que coûtent ses ${qte(x.delai)} jours`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Net à payer à 45 jours", valeurs: [eur(x.facture.ttc)] },
            { libelle: "Net à payer comptant, escompte déduit", valeurs: [eur(x.comptant.ttc)] },
            { libelle: "Coût de l'escompte", valeurs: [eur(x.comptant.escompte)] },
            ...x.financements.map((m) => ({ libelle: `Coût · ${NOMS_DES_FINANCEMENTS[m.mode]}`, valeurs: [eur(m.cout)] })),
            { libelle: "Pénalités et indemnité d'un retard de 30 jours", valeurs: [eur(x.retard.total)] },
          ],
        };
      },
      texte: (c) => {
        const x = facturationDuComite(c);
        return [
          `Une facture va du brut au net à payer : la remise donne le net commercial, l'escompte le net financier, et la TVA se calcule sur ce net. Entre professionnels, elle annonce l'échéance, le taux des pénalités et l'indemnité de ${eur(INDEMNITE_FORFAITAIRE)} ; l'échéance ne dépasse pas ${qte(DELAIS_LEGAUX.dateDeFacture)} jours date de facture, ou ${qte(DELAIS_LEGAUX.finDeMois)} jours fin de mois.`,
          `Accorder un délai, c'est financer la trésorerie du client, toutes taxes comprises. L'escompte de ${pct(CONDITIONS_DE_VENTE.escompte * 100)} contre ${qte(x.delai)} jours est un crédit à ${pct(x.tauxAnnuel)} l'an : le découvert (${eur(x.decouvert.cout)}) ou l'escompte d'une LCR (${eur(x.lcr.cout)}) coûtent moins ; l'affacturage coûte plus, mais garantit l'impayé.`,
          "Au niveau de l'examen, vous savez établir une facture, en vérifier les mentions et l'échéance, chiffrer un retard, traduire un escompte en taux annuel, comparer les financements d'une créance et choisir un mode de règlement.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Pénalités = net à payer × taux × jours de retard ÷ 365, plus 40 €. Coût d'un crédit = montant toutes taxes comprises × taux × jours ÷ 360. Taux annuel de l'escompte = escompte ÷ net financier × 360 ÷ jours gagnés.",
    },
  ],
};

/** La date de l'échéance après un retard, pour le cas. */
export const echeanceApresRetard = (x: FacturationDuComite, jours: number) => dateEcrite(plusDeJours(x.echeances.convenue, jours));
