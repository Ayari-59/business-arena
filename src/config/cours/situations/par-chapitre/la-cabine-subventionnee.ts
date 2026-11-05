import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../monde/amortissement";
import { CABINE, cabine } from "../../monde/acquisition-et-financement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ACQUÉRIR ET FINANCER UNE IMMOBILISATION » (comptabilité générale,
 * palier 4 ; BTS CG P2 2.3.2).
 *
 * Fin décembre N + 1, la région accorde à NOVA une aide à l'équipement des ateliers de contrôle :
 * TAUX_D_AIDE_A_LA_CABINE (hypothèse du cours) du coût de production de la cabine d'écoute, versée en
 * janvier N + 2. Le président demande ce que l'aide rapporte au résultat de N + 1 et de N + 2.
 * L'élève refait seul le chemin du chapitre : la subvention se reprend au rythme de l'amortissement de
 * la cabine, ici selon ses heures d'essai, et suit le plan modifié (monde/acquisition-et-financement.ts).
 */

/** L'AIDE DE LA RÉGION À LA CABINE (hypothèse du cours) : 40 % de son coût de production. */
export const TAUX_D_AIDE_A_LA_CABINE = 0.4;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");

/** L'aide, et ses quotes-parts de N + 1 et de N + 2, au rythme de la dotation de la cabine. */
export function cabineSubventionnee() {
  const k = cabine();
  const aide = auCentime(k.cout * TAUX_D_AIDE_A_LA_CABINE);
  const quotePartN1 = auCentime((aide * k.dotationEnUnites) / k.cout);
  const quotePartN2 = auCentime((aide * k.dotationDeNPlus2) / k.cout);
  return { ...k, aide, quotePartN1, quotePartN2, resteFinN1: auCentime(aide - quotePartN1), chargeNetteN1: auCentime(k.dotationEnUnites - quotePartN1) };
}

export const LA_CABINE_SUBVENTIONNEE: Situation = {
  code: "la-cabine-subventionnee",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["acquerir-et-financer-une-immobilisation"],
  commanditaire: "Le président",
  titre: "La cabine subventionnée",
  accroche: "La région prend en charge une part de la cabine d'écoute : ce que l'aide rapporte chaque année, au rythme des heures d'essai.",
  objectifs: ["Enregistrer une subvention d'investissement", "Calculer sa reprise au rythme d'un amortissement en unités d'œuvre", "Répondre au président, chiffre à l'appui"],
  libre: false,
  entreprises: { codes: ["nova"], pourquoi: "ce cas reprend la cabine d'écoute que NOVA a construite, celle du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      tableau: () => {
        const k = cabineSubventionnee();
        return {
          titre: "La cabine d'écoute et son aide",
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Coût de production", valeurs: [eur(k.cout)] },
            { libelle: "Aide de la région", valeurs: [pct(TAUX_D_AIDE_A_LA_CABINE)] },
            { libelle: "Heures d'essai prévues à la mise en service", valeurs: [`${qte(CABINE.heuresPrevues)} h`] },
            { libelle: "Heures d'essai de N + 1", valeurs: [`${qte(CABINE.heuresDeNPlus1)} h`] },
            { libelle: "Dotation de N + 2, plan modifié", valeurs: [eur(k.dotationDeNPlus2)] },
          ],
        };
      },
      texte: () => [
        `« La région nous accorde ${pct(TAUX_D_AIDE_A_LA_CABINE)} du coût de la cabine d'écoute, notifiés le 28 décembre N + 1 et versés en janvier. Combien cela rapporte-t-il à notre résultat cette année, et l'an prochain ? » Le président`,
        "Pas de cours cette fois : la subvention et l'amortissement selon les unités d'œuvre, vous les connaissez.",
      ],
      repere: () => "À rendre : l'aide, l'écriture de son octroi, ses quotes-parts de N + 1 et de N + 2, et votre réponse.",
    },
    {
      id: "l-octroi",
      type: "ecriture",
      titre: "L'aide, au journal",
      notions: ["depreciation"],
      evenement: () => `Le 28 décembre N + 1, la région notifie son aide : ${eur(cabineSubventionnee().aide)}, versés en janvier N + 2. Passez l'écriture.`,
      ecriture: () => {
        const k = cabineSubventionnee();
        return {
          date: "28 décembre N + 1",
          libelle: "Subvention d'équipement de la cabine accordée",
          lignes: [
            { role: "la créance sur la région", compte: "441", sens: "debit", montant: k.aide, indice: "l'aide notifiée" },
            { role: "la subvention d'équipement", compte: "131", sens: "credit", montant: k.aide, indice: "l'aide notifiée" },
          ],
        };
      },
      indices: () => ["Une aide accordée, pas encore versée : une créance, et une ressource durable au passif."],
      explication: () => ["L'aide finance la cabine sur toute sa vie : elle attend au passif et passera au résultat au rythme où la cabine s'amortit."],
      vue: "grand-livre",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Les quotes-parts",
      notions: ["depreciation"],
      question: () => "Calculez la quote-part de l'aide virée au résultat de N + 1, ce qu'il en reste au bilan au 31 décembre, la charge nette de la cabine en N + 1, puis la quote-part de N + 2.",
      champs: () => {
        const k = cabineSubventionnee();
        return [
          { libelle: "Quote-part de N + 1", attendu: k.quotePartN1, calcul: `${eur(k.aide)} × ${eur(k.dotationEnUnites)} ÷ ${eur(k.cout)} = ${eur(k.quotePartN1)}` },
          { libelle: "Aide restant au bilan", attendu: k.resteFinN1, calcul: `${eur(k.aide)} − ${eur(k.quotePartN1)} = ${eur(k.resteFinN1)}` },
          { libelle: "Charge nette de la cabine en N + 1", attendu: k.chargeNetteN1, calcul: `${eur(k.dotationEnUnites)} − ${eur(k.quotePartN1)} = ${eur(k.chargeNetteN1)}` },
          { libelle: "Quote-part de N + 2", attendu: k.quotePartN2, calcul: `${eur(k.aide)} × ${eur(k.dotationDeNPlus2)} ÷ ${eur(k.cout)} = ${eur(k.quotePartN2)}` },
        ];
      },
      explication: () => {
        const k = cabineSubventionnee();
        return [
          `L'aide suit la dotation : ${pct(TAUX_D_AIDE_A_LA_CABINE)} de chaque dotation revient au résultat. ${eur(k.quotePartN1)} en N + 1, ${eur(k.quotePartN2)} en N + 2, au rythme des heures d'essai et du plan modifié.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = cabineSubventionnee();
        return [
          {
            texte: `${eur(k.quotePartN1)} en N + 1, ${eur(k.quotePartN2)} en N + 2`,
            juste: true,
            retour: `Oui : l'aide de ${eur(k.aide)} passe au résultat au rythme de l'amortissement de la cabine ; le reste attend au passif, ${eur(k.resteFinN1)} au 31 décembre N + 1.`,
          },
          {
            texte: `${eur(k.aide)} en N + 1, l'année où la région l'accorde, puis plus rien en N + 2`,
            juste: false,
            retour: "Non : une subvention d'investissement finance l'équipement sur toute sa vie ; la passer en entier au résultat de N + 1 gonflerait ce seul exercice.",
          },
          {
            texte: `${eur(auCentime(k.aide / CABINE.dureeLineaireAns / 4))} en N + 1, un cinquième de l'aide au prorata du trimestre, comme un linéaire`,
            juste: false,
            retour: "Non : la cabine s'amortit selon ses heures d'essai, pas selon le temps ; l'aide suit la même cadence que la dotation.",
          },
        ];
      },
    },
  ],
};
