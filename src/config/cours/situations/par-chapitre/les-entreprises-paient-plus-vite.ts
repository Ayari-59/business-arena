import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_TVA, ficheDe, printempsAuDelai } from "../../chapitres/la-declaration-de-tva";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ENCAISSEMENTS OU DÉBITS : LE RÉGIME QUI DÉCIDE » (fiscalité, palier 3).
 *
 * Les entreprises clientes de MARTEL & FILS acceptent de payer à `DELAI_DU_CAS` jours au lieu du délai
 * de la fiche. Le gérant demande ce que devient le crédit de TVA du printemps. L'élève refait le
 * calcul du chapitre (`printempsAuDelai`, aux encaissements) : ce que les clients paient dans le
 * trimestre, la TVA collectée, la TVA nette.
 */

/** LE DÉLAI DE PAIEMENT DES ENTREPRISES (hypothèse du cas) : 30 jours. */
export const DELAI_DU_CAS = 30;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");

export function entreprisesPaientPlusVite() {
  const f = ficheDe({ code: "batiment" });
  const delaiDeLaFiche = f.clienteles.find((g) => g.code === "entreprises")!.delai;
  const avant = printempsAuDelai(f, delaiDeLaFiche);
  const apres = printempsAuDelai(f, DELAI_DU_CAS);
  return { f, delaiDeLaFiche, avant, apres, creditEnMoins: Math.round((apres.nette - avant.nette) * 100) / 100 };
}

export const LES_ENTREPRISES_PAIENT_PLUS_VITE: Situation = {
  code: "les-entreprises-paient-plus-vite",
  parcours: "fiscalite",
  palier: 3,
  blocs: [],
  reprend: ["encaissements-ou-debits"],
  commanditaire: "Le gérant",
  titre: "Les entreprises paient plus vite",
  accroche: "Les entreprises clientes raccourcissent leur délai de paiement : ce que devient le crédit de TVA du printemps, aux encaissements.",
  objectifs: ["Calculer les encaissements d'un trimestre pour un autre délai de paiement", "Calculer la TVA collectée et la TVA nette aux encaissements", "Relier le crédit de TVA au délai des clients"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_TVA, pourquoi: "ce cas reprend la déclaration du printemps de MARTEL & FILS, celle du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du gérant",
      texte: () => {
        const k = entreprisesPaientPlusVite();
        return [
          `« Nos entreprises clientes paieraient à ${qte(DELAI_DU_CAS)} jours au lieu de ${qte(k.delaiDeLaFiche)}. Au printemps, nous avions un crédit de TVA de ${eur(-k.avant.nette)}. Que deviendrait-il ? » Le gérant`,
          `Pas de cours cette fois : pour des travaux, la TVA collectée naît à l'encaissement. La TVA déductible du printemps ne change pas : ${eur(k.avant.deductible)}.`,
        ];
      },
      repere: () => "À rendre : les encaissements du printemps, la TVA collectée, la TVA nette (négative pour un crédit), et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Le printemps au nouveau délai",
      notions: ["vat_payable", "payment_terms"],
      question: () => "Au nouveau délai des entreprises, calculez les encaissements hors taxes du printemps, la TVA collectée, puis la TVA nette, collectée moins déductible (négative pour un crédit).",
      champs: () => {
        const k = entreprisesPaientPlusVite();
        return [
          { libelle: "Encaissements hors taxes du printemps", attendu: k.apres.encaissements, calcul: `${eur(k.apres.encaissements)}, dont ${eur(k.apres.encaisseDesEntreprises)} des entreprises` },
          { libelle: "TVA collectée", attendu: k.apres.collectee, calcul: `${eur(k.apres.encaissements)} × ${qte(k.f.tauxDeTva * 100)} % = ${eur(k.apres.collectee)}` },
          { libelle: "TVA nette", attendu: k.apres.nette, calcul: `${eur(k.apres.collectee)} − ${eur(k.apres.deductible)} = ${eur(k.apres.nette)}` },
        ];
      },
      explication: () => {
        const k = entreprisesPaientPlusVite();
        return [`Les entreprises paient plus tôt : plus d'encaissements au printemps, donc plus de TVA collectée. La TVA nette passe de ${eur(k.avant.nette)} à ${eur(k.apres.nette)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Que répondez-vous au gérant ?",
      options: () => {
        const k = entreprisesPaientPlusVite();
        return [
          {
            texte: `Il fond de ${eur(k.creditEnMoins)} : la TVA suit l'argent reçu`,
            juste: k.creditEnMoins > 0,
            retour: `Oui : aux encaissements, la TVA collectée suit les paiements des clients. Plus vite ils paient, plus tôt elle se déclare : le crédit tombe à ${eur(-k.apres.nette)}.`,
          },
          {
            texte: "Il ne change pas : la TVA collectée se calcule sur les travaux facturés dans le trimestre",
            juste: false,
            retour: "Non : ce serait le régime des débits, sur option. Pour des travaux, le régime de droit commun est celui des encaissements.",
          },
          {
            texte: "Il grossit : des clients qui paient plus vite font récupérer plus de TVA déductible à l'entreprise",
            juste: false,
            retour: "Non : la TVA déductible dépend des achats de l'entreprise, pas des paiements de ses clients.",
          },
        ];
      },
    },
  ],
};
