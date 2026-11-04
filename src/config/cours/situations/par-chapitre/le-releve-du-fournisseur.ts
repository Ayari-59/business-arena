import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { controleDesComptes } from "../../chapitres/controler-les-comptes";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE } from "../../monde/comptes-du-lycee";
import { compteDuFournisseur, dateEcrite, deMois, lettrage, type MouvementDeTiers } from "../../monde/systeme-d-information-comptable";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CONTRÔLER LES COMPTES » : LE RELEVÉ DU FOURNISSEUR (Bac STMG, gestion
 * et finance, palier 1).
 *
 * Début janvier, Électro-Composants envoie à NOVA son relevé de compte arrêté au 30 novembre : NOVA
 * lui devrait sa facture de novembre. Le compte du fournisseur, chez NOVA, dit une autre somme au
 * 31 décembre. L'élève lettre le compte, chiffre l'écart, le rapproche du relevé (le règlement et
 * la facture passés depuis le 30 novembre) et répond au fournisseur.
 *
 * Le cas est neuf par sa question : le chapitre lettre un compte de client et rapproche la banque ;
 * le cas lettre un compte de fournisseur et rapproche deux états arrêtés à des dates différentes.
 * Les factures et les règlements sont ceux de la fiche (monde/systeme-d-information-comptable.ts).
 */

/** Le relevé du fournisseur est arrêté au 30 novembre ; l'extrait du compte part de la facture d'octobre. */
export const RELEVE_ARRETE = { jour: 30, mois: 11 } as const;
export const PREMIERE_FACTURE_DU_CAS = 10;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

const libelleDeLigne = (l: MouvementDeTiers) =>
  l.nature === "facture" ? `Facture du ${dateEcrite(l.date)}` : `Règlement du ${dateEcrite(l.date)} (facture ${deMois(l.facture)})`;

/** Le compte du fournisseur chez NOVA, son relevé au 30 novembre, et ce qui les sépare. */
export function releveDuFournisseur(c: Pick<Cas, "code">) {
  const k = controleDesComptes(c);
  const lignes = compteDuFournisseur(k.f).filter((l) => l.facture >= PREMIERE_FACTURE_DU_CAS);
  const l = lettrage(lignes);
  const avantLeReleve = (x: MouvementDeTiers) => x.date.mois < RELEVE_ARRETE.mois || (x.date.mois === RELEVE_ARRETE.mois && x.date.jour <= RELEVE_ARRETE.jour);
  const releve = lettrage(lignes.filter(avantLeReleve)).resteDu;
  const depuis = lignes.filter((x) => !avantLeReleve(x));
  const reglementDepuis = depuis.find((x) => x.nature === "reglement")!;
  const factureDepuis = depuis.find((x) => x.nature === "facture")!;
  return {
    entreprise: k.entreprise,
    fournisseur: k.fournisseur,
    lignes,
    lettrage: l,
    /** Ce que NOVA doit au 31 décembre, selon son compte. */
    du: l.resteDu,
    /** Ce que le relevé du fournisseur réclame, au 30 novembre. */
    releve,
    ecart: auCentime(releve - l.resteDu),
    reglementDepuis,
    factureDepuis,
    rapproche: auCentime(releve - reglementDepuis.montant + factureDepuis.montant),
  };
}

function tableauDuCompte(r: ReturnType<typeof releveDuFournisseur>): TableauDeDonnees {
  return {
    titre: `Le compte 401 ${r.fournisseur} chez ${r.entreprise}, depuis la facture d'octobre`,
    colonnes: ["Débit", "Crédit"],
    lignes: [
      ...r.lignes.map((l) => ({ libelle: libelleDeLigne(l), valeurs: l.nature === "facture" ? ["", eur(l.montant)] : [eur(l.montant), ""] })),
      { libelle: `Relevé ${r.fournisseur.startsWith("É") ? "d'" : "de "}${r.fournisseur} au ${dateEcrite(RELEVE_ARRETE)} : reste dû`, valeurs: ["", eur(r.releve)] },
    ],
  };
}

export const LE_RELEVE_DU_FOURNISSEUR: Situation = {
  code: "le-releve-du-fournisseur",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["controler-les-comptes"],
  commanditaire: "Le fournisseur de composants",
  titre: "Le relevé du fournisseur",
  accroche:
    "Le fournisseur de composants envoie son relevé : il réclame une facture. Le compte du fournisseur, chez NOVA, dit une autre somme. Qui a raison ?",
  objectifs: [
    "Lettrer le compte d'un fournisseur",
    "Calculer ce que l'entreprise doit, et l'écart avec le relevé du fournisseur",
    "Rapprocher deux états arrêtés à des dates différentes",
    "Rédiger une réponse au fournisseur",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend les factures de composants de NOVA et ses règlements, dans la simulation du cours, comme le chapitre ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Le relevé du fournisseur",
      tableau: (c) => tableauDuCompte(releveDuFournisseur(c)),
      texte: (c) => {
        const r = releveDuFournisseur(c);
        return [
          `« Notre relevé arrêté au ${dateEcrite(RELEVE_ARRETE)} indique que vous nous devez ${eur(r.releve)}. Merci de régulariser. » Ainsi écrit le service comptable ${r.fournisseur.startsWith("É") ? "d'" : "de "}${r.fournisseur}, début janvier.`,
          `Au 31 décembre, le compte du fournisseur chez ${r.entreprise} dit une autre somme. Pas de cours cette fois : lettrez, chiffrez l'écart, rapprochez, et répondez.`,
        ];
      },
      repere: () => "À rendre : le compte lettré, ce que NOVA doit au 31 décembre, l'écart avec le relevé et ce qui l'explique, et votre réponse.",
    },
    {
      id: "lettrer",
      type: "tri",
      titre: "Lettrer le compte du fournisseur",
      notions: ["payment_terms"],
      question: () => "Rangez chaque ligne du compte : lettrée (une facture et le règlement qui la paie) ou non lettrée.",
      categories: [
        { code: "lettree", libelle: "Lettrée" },
        { code: "non-lettree", libelle: "Non lettrée" },
      ],
      elements: (c) => {
        const r = releveDuFournisseur(c);
        return r.lignes.map((l) => ({
          libelle: libelleDeLigne(l),
          montant: l.montant,
          categorie: r.lettrage.lettree(l) ? "lettree" : "non-lettree",
          pourquoi: r.lettrage.lettree(l) ? `La facture ${deMois(l.facture)} et son règlement se répondent.` : `Aucun règlement pour la facture ${deMois(l.facture)} : elle reste due.`,
        }));
      },
      relance: "Pour chaque facture, au crédit d'un compte de fournisseur, cherchez au débit le règlement du même montant.",
      explication: (c) => {
        const r = releveDuFournisseur(c);
        return [`Une seule facture reste sans lettre : celle du ${dateEcrite(r.factureDepuis.date)}.`];
      },
    },
    {
      id: "l-ecart",
      type: "montants",
      titre: "Ce que NOVA doit, et l'écart",
      notions: ["payment_terms"],
      question: () => "Calculez ce que NOVA doit au fournisseur au 31 décembre, selon son compte, puis l'écart avec la somme du relevé.",
      champs: (c) => {
        const r = releveDuFournisseur(c);
        return [
          { libelle: "Dû selon le compte de NOVA", attendu: r.du, calcul: `${r.lettrage.nonLettrees.map((x) => eur(x.montant)).join(" + ")} = ${eur(r.du)}` },
          { libelle: "Écart avec le relevé", attendu: r.ecart, calcul: `${eur(r.releve)} − ${eur(r.du)} = ${eur(r.ecart)}` },
        ];
      },
      explication: (c) => {
        const r = releveDuFournisseur(c);
        return [`Le relevé réclame ${eur(r.ecart)} de plus que ce que dit le compte : il faut expliquer cet écart avant de répondre.`];
      },
    },
    {
      id: "rapprocher",
      type: "montants",
      titre: "Rapprocher les deux états",
      notions: ["payment_terms"],
      question: () =>
        "Le relevé s'arrête au 30 novembre ; le compte de NOVA va jusqu'au 31 décembre. Partez du relevé : retranchez ce que NOVA a payé depuis, ajoutez ce qui a été facturé depuis.",
      champs: (c) => {
        const r = releveDuFournisseur(c);
        return [
          { libelle: "Relevé, mis à jour au 31 décembre", attendu: r.rapproche, calcul: `${eur(r.releve)} − ${eur(r.reglementDepuis.montant)} + ${eur(r.factureDepuis.montant)} = ${eur(r.rapproche)}` },
        ];
      },
      explication: (c) => {
        const r = releveDuFournisseur(c);
        return [
          `Mis à jour, le relevé dit ${eur(r.rapproche)}, comme le compte de NOVA. Personne ne s'est trompé : les deux états ne sont pas arrêtés le même jour.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au fournisseur",
      question: () => "Quelle réponse envoyez-vous au fournisseur ?",
      options: (c) => {
        const r = releveDuFournisseur(c);
        return [
          {
            texte: `Payée par virement du ${dateEcrite(r.reglementDepuis.date)}, la facture ${deMois(r.reglementDepuis.facture)} est réglée`,
            juste: true,
            retour: `Oui : le règlement de ${eur(r.reglementDepuis.montant)} est passé après l'arrêté du relevé. ${r.entreprise} ne doit que la facture du ${dateEcrite(r.factureDepuis.date)}, ${eur(r.du)}, à son échéance.`,
          },
          {
            texte: `Nous vous virons ${eur(r.releve)} sans attendre, pour solder ce que vous nous réclamez`,
            juste: false,
            retour: `Non : ce serait payer deux fois la facture ${deMois(r.reglementDepuis.facture)}, déjà réglée le ${dateEcrite(r.reglementDepuis.date)}.`,
          },
          {
            texte: `Nous ne vous devons rien : notre compte est entièrement lettré au 31 décembre`,
            juste: false,
            retour: `Non : la facture du ${dateEcrite(r.factureDepuis.date)} n'est pas lettrée. ${r.entreprise} doit ${eur(r.du)}.`,
          },
          {
            texte: `Nous vous devons ${eur(auCentime(r.releve + r.du))} : votre relevé, et la facture de décembre en plus`,
            juste: false,
            retour: `Non : la facture ${deMois(r.reglementDepuis.facture)}, réclamée par le relevé, est déjà payée. Il ne reste que ${eur(r.du)}.`,
          },
        ];
      },
    },
  ],
};
