import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_FOURNISSEURS } from "../../chapitres/fournisseurs-et-banque";
import { FIN_DE_FEVRIER, rapprochementDeFevrier } from "../../monde/fournisseurs-et-banque-de-la-boutique";
import { MAILLE_ET_CO } from "../../monde/maille-et-co";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FOURNISSEURS ET BANQUE : ÉCHÉANCIER, POINTAGE ET RAPPROCHEMENT » : LE CHÈQUE
 * QUI N'EST PAS PASSÉ (comptabilité générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : MAILLE & CO, sa banque et ses conditions
 * (monde/fournisseurs-et-banque-de-la-boutique.ts), un mois plus tard.
 *
 * HYPOTHÈSES DU CAS (FIN_DE_FEVRIER, dans le monde du cours, d'où le mois de mars repart) : au
 * 28 février, le compte 512 porte 21 400 € ; le chèque de l'entretien de février (le prix de la fiche, 920 € HT), émis le 26, n'est pas présenté ; la régie a
 * prélevé la publicité du mois (le montant de la fiche, 1 500 € HT) le 25, sans avis ; la banque a pris la
 * tenue de compte. Le compte n'a jamais été débiteur en valeur : pas d'intérêts.
 */
export { FIN_DE_FEVRIER };

const f = MAILLE_ET_CO;
const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");

/** Les chiffres du cas : le rapprochement du 28 février, calculé dans le monde du cours. */
export function chequeQuiNEstPasPasse(_c: Pick<Cas, "code">) {
  return rapprochementDeFevrier(f);
}

export const LE_CHEQUE_QUI_N_EST_PAS_PASSE: Situation = {
  code: "le-cheque-qui-n-est-pas-passe",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["fournisseurs-et-banque"],
  commanditaire: "La gérance",
  titre: "Le chèque qui n'est pas passé",
  accroche: "Fin février, le compte et le relevé ne disent pas la même chose, et la gérance veut annuler un chèque que la banque n'a pas vu. Rapprochez, puis répondez.",
  objectifs: [
    "Établir un état de rapprochement et trouver le solde juste",
    "Enregistrer un prélèvement et des frais connus par le seul relevé",
    "Expliquer pourquoi un chèque non présenté ne s'annule pas",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_FOURNISSEURS,
    pourquoi: "ce cas reprend le chapitre « Fournisseurs et banque », qui se joue chez MAILLE & CO dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la gérance",
      tableau: (c) => {
        const n = chequeQuiNEstPasPasse(c);
        return {
          titre: "Au 28 février : ce qui n'est que d'un côté",
          colonnes: ["Compte 512", "Relevé"],
          lignes: [
            { libelle: "Solde du 28 février", valeurs: [eur(n.compte), eur(n.releve)] },
            { libelle: `Chèque de l'entretien du ${FIN_DE_FEVRIER.jourDuCheque} février`, valeurs: [eur(-n.cheque), ""] },
            { libelle: `Prélèvement de la publicité, le ${FIN_DE_FEVRIER.jourDeLaPublicite} février`, valeurs: ["", eur(-n.publicite.ttc)] },
            { libelle: "Tenue de compte et TVA", valeurs: ["", eur(-n.fraisTtc)] },
          ],
        };
      },
      texte: (c) => {
        const n = chequeQuiNEstPasPasse(c);
        return [
          `« Le compte dit ${eur(n.compte)}, la banque ${eur(n.releve)}. Le chèque de l'entretien n'apparaît pas au relevé : annulons-le au compte, et les deux tomberont d'accord. Qu'en dites-vous ? »`,
          `Pas de cours cette fois : vous avez le chapitre. La publicité coûte ${eur(n.publicite.ht)} hors taxes par mois, la tenue de compte ${eur(n.frais.ht)}, avec une TVA de 20 %.`,
        ];
      },
      repere: () => "À rendre : les deux soldes rectifiés, les écritures, et votre réponse sur le chèque.",
    },
    {
      id: "le-rapprochement",
      type: "montants",
      titre: "Les soldes rectifiés",
      notions: ["net_treasury"],
      question: () => "Calculez le solde rectifié du compte 512, puis celui du relevé. Ils doivent être égaux.",
      champs: (c) => {
        const n = chequeQuiNEstPasPasse(c);
        return [
          { libelle: "Compte 512 rectifié", attendu: n.compteRectifie, calcul: `${eur(n.compte)} − ${eur(n.publicite.ttc)} − ${eur(n.fraisTtc)} = ${eur(n.compteRectifie)}` },
          { libelle: "Relevé rectifié", attendu: n.releveRectifie, calcul: `${eur(n.releve)} − ${eur(n.cheque)} = ${eur(n.releveRectifie)}` },
        ];
      },
      explication: (c) => {
        const n = chequeQuiNEstPasPasse(c);
        return [`Les deux soldes tombent sur ${eur(n.compteRectifie)}. Le compte se corrige de ce que la banque a fait seule ; le relevé, du chèque qu'elle ne connaît pas encore.`];
      },
    },
    {
      id: "la-publicite",
      type: "ecriture",
      titre: "Le prélèvement de la publicité",
      notions: ["vat_payable"],
      evenement: (c) => {
        const n = chequeQuiNEstPasPasse(c);
        return `La régie a prélevé la publicité de février le ${FIN_DE_FEVRIER.jourDeLaPublicite} : ${eur(n.publicite.ht)} hors taxes et ${eur(n.publicite.tva)} de TVA. Passez-le.`;
      },
      ecriture: (c) => {
        const n = chequeQuiNEstPasPasse(c);
        return {
          date: `${FIN_DE_FEVRIER.jourDeLaPublicite} février N`,
          libelle: "Prélèvement de la publicité de février",
          lignes: [
            { role: "la publicité du mois", compte: "623", sens: "debit", montant: n.publicite.ht, indice: "le hors taxes" },
            { role: "la TVA déductible", compte: "44566", sens: "debit", montant: n.publicite.tva, indice: "la TVA" },
            { role: "la banque, prélevée", compte: "512", sens: "credit", montant: n.publicite.ttc, indice: "le montant prélevé" },
          ],
        };
      },
      indices: () => ["La publicité est un service extérieur, avec de la TVA déductible.", "La banque a payé : elle se crédite du montant prélevé."],
      explication: () => ["Sans avis, la charge n'avait pas été passée : le rapprochement l'a trouvée. Demander à la régie une facture par mois évite de l'apprendre par le relevé."],
    },
    {
      id: "les-frais",
      type: "ecriture",
      titre: "La tenue de compte",
      notions: ["vat_payable"],
      evenement: (c) => {
        const n = chequeQuiNEstPasPasse(c);
        return `La banque a pris ${eur(n.frais.ht)} de tenue de compte et ${eur(n.frais.tva)} de TVA le 28 février. Passez-les.`;
      },
      ecriture: (c) => {
        const n = chequeQuiNEstPasPasse(c);
        return {
          date: "28 février N",
          libelle: "Tenue de compte de février",
          lignes: [
            { role: "le service bancaire", compte: "627", sens: "debit", montant: n.frais.ht, indice: "les frais hors taxes" },
            { role: "la TVA déductible sur les frais", compte: "44566", sens: "debit", montant: n.frais.tva, indice: "la TVA des frais" },
            { role: "la banque, débitée", compte: "512", sens: "credit", montant: n.fraisTtc, indice: "le total prélevé" },
          ],
        };
      },
      indices: () => ["Des services bancaires, avec de la TVA.", "La banque se crédite du total."],
      explication: (c) => {
        const n = chequeQuiNEstPasPasse(c);
        return [`Le compte 512 porte désormais ${eur(n.compteRectifie)} : le solde rectifié.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérance",
      notions: ["net_treasury"],
      question: () => "Que répondez-vous à la gérance sur le chèque de l'entretien ?",
      options: (c) => {
        const n = chequeQuiNEstPasPasse(c);
        return [
          {
            texte: "Le garder au compte : il passera à sa présentation",
            juste: true,
            retour: `Oui. Le chèque est émis, la dette envers l'entreprise d'entretien est payée : le compte est juste. La banque le débitera quand le bénéficiaire le remettra. On le suit d'un rapprochement à l'autre, et on relance le bénéficiaire s'il tarde. Le vrai solde disponible est ${eur(n.compteRectifie)}, pas ${eur(n.releve)}.`,
          },
          {
            texte: "L'annuler au compte : la banque ne l'a pas, il n'existe pas encore pour elle",
            juste: false,
            retour: `Non : l'annuler ferait croire la dette impayée et la banque plus riche de ${eur(n.cheque)}. Le jour où il serait présenté, le compte tomberait faux.`,
          },
          {
            texte: "Faire opposition au chèque pour le remplacer par un virement",
            juste: false,
            retour: "Non : l'opposition n'est permise que pour un chèque perdu ou volé, ou en cas de procédure collective du bénéficiaire. Un chèque simplement pas encore présenté n'en est pas un.",
          },
        ];
      },
    },
  ],
};
