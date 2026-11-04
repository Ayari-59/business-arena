import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_TABLEAU_DES_FLUX, fluxDuChapitre } from "../../chapitres/le-tableau-des-flux-de-tresorerie";
import { DIVIDENDE_DEMANDE_PAR_ACTION } from "../../monde/affectation-du-resultat";
import { ACTIONS_DE_NOVA } from "../../monde/comptabilite-approfondie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TABLEAU DES FLUX DE TRÉSORERIE » : LE DIVIDENDE DE L'ASSOCIÉ
 * (comptabilité générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le tableau des flux du premier exercice
 * de NOVA (monde/tableaux-de-flux.ts). La demande est celle du chapitre « L'affectation du
 * résultat » (monde/affectation-du-resultat.ts, DIVIDENDE_DEMANDE_PAR_ACTION) : un associé veut un
 * dividende par action, sur les actions de NOVA (monde/comptabilite-approfondie.ts, ACTIONS_DE_NOVA).
 *
 * L'associé argue de la trésorerie du bilan. L'élève refait seul les flux : l'activité,
 * l'investissement, le flux disponible, puis ce qu'il en reste après le remboursement de l'emprunt,
 * et le compare au dividende. La réponse demande un jugement : la trésorerie peut le payer, mais il
 * dépasserait ce que l'activité a libéré ; il serait payé avec l'argent de la création.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const signe = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);

/** Les chiffres du cas : les flux de l'exercice et le dividende demandé. */
export function dividendeDeLAssocie(c: Pick<Cas, "code">) {
  const x = fluxDuChapitre(c);
  const dividende = auCentime(DIVIDENDE_DEMANDE_PAR_ACTION * ACTIONS_DE_NOVA.nombre);
  return { x, dividende, manque: auCentime(dividende - x.fluxApresRemboursement) };
}

export const LE_DIVIDENDE_DE_L_ASSOCIE: Situation = {
  code: "le-dividende-de-l-associe",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-tableau-des-flux-de-tresorerie"],
  commanditaire: "Un associé",
  titre: "Le dividende de l'associé",
  accroche: "Un associé veut son dividende : la trésorerie est pleine, dit-il. Le tableau des flux dit d'où vient cette trésorerie, et ce que l'activité a vraiment libéré.",
  objectifs: [
    "Reprendre le flux de l'activité et le flux d'investissement d'un tableau des flux",
    "Calculer le flux disponible et ce qu'il en reste après le remboursement des emprunts",
    "Comparer un dividende à ce que l'activité a libéré, et rendre une réponse chiffrée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TABLEAU_DES_FLUX,
    pourquoi: "ce cas reprend le chapitre « Le tableau des flux de trésorerie », qui se joue sur le premier exercice de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de l'associé",
      texte: (c) => {
        const n = dividendeDeLAssocie(c);
        const x = n.x;
        return [
          `« ${eur(x.tresorerieDeCloture)} de trésorerie au 31 décembre ! Je demande ${eur(DIVIDENDE_DEMANDE_PAR_ACTION)} par action, ${eur(n.dividende)} pour nos ${qte(ACTIONS_DE_NOVA.nombre)} actions : c'est une goutte d'eau. » Le gérant vous demande de lui répondre avec le tableau des flux de l'année.`,
          "Pas de cours cette fois : vous avez les chiffres de l'exercice, ceux du chapitre.",
        ];
      },
      tableau: (c) => {
        const x = dividendeDeLAssocie(c).x;
        const t = x.t;
        return {
          titre: `${x.entreprise}, les chiffres de l'exercice`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Marge brute d'autofinancement", valeurs: [eur(x.margeBruteDAutofinancement)] },
            { libelle: "Besoin lié à l'activité au 31 décembre, en net", valeurs: [eur(x.besoinNetDeLActivite)] },
            { libelle: "Ligne de montage achetée, hors taxes", valeurs: [eur(t.emplois.acquisitions)] },
            { libelle: "Apport des associés", valeurs: [eur(t.ressources.augmentationDeCapital)] },
            { libelle: "Emprunt reçu", valeurs: [eur(t.ressources.nouveauxEmprunts)] },
            { libelle: "Capital remboursé", valeurs: [eur(t.emplois.remboursements)] },
            { libelle: "Trésorerie nette au 31 décembre", valeurs: [eur(x.tresorerieDeCloture)] },
          ],
        };
      },
      repere: () => "À rendre : le flux de l'activité et celui d'investissement, le flux disponible, ce qu'il en reste après le remboursement, et votre réponse.",
    },
    {
      id: "les-flux",
      type: "montants",
      titre: "Ce que l'activité a libéré",
      notions: ["net_treasury", "bfr"],
      question: () =>
        "Calculez le flux de l'activité (l'ouverture est vide), le flux d'investissement (négatif pour une sortie), le flux disponible, puis ce qu'il en reste une fois le capital de l'emprunt remboursé.",
      champs: (c) => {
        const x = dividendeDeLAssocie(c).x;
        return [
          { libelle: "Flux de l'activité", attendu: x.fluxDeLActivite, calcul: `${eur(x.margeBruteDAutofinancement)} − (${signe(x.besoinNetDeLActivite)}) = ${eur(x.fluxDeLActivite)}` },
          { libelle: "Flux d'investissement", attendu: x.fluxDInvestissement, calcul: `la ligne : ${signe(x.fluxDInvestissement)}` },
          { libelle: "Flux disponible", attendu: x.fluxDisponible, calcul: `${eur(x.fluxDeLActivite)} ${signe(x.fluxDInvestissement)} = ${eur(x.fluxDisponible)}` },
          { libelle: "Après le remboursement", attendu: x.fluxApresRemboursement, calcul: `${eur(x.fluxDisponible)} − ${eur(x.t.emplois.remboursements)} = ${eur(x.fluxApresRemboursement)}` },
        ];
      },
      explication: (c) => {
        const x = dividendeDeLAssocie(c).x;
        return [`L'activité a payé la ligne et le capital de l'année, et laissé ${eur(x.fluxApresRemboursement)}. Le reste de la trésorerie, ${eur(x.fluxDeFinancement)} de financement net, vient de l'apport et de l'emprunt.`];
      },
    },
    {
      id: "la-part-du-dividende",
      type: "montants",
      titre: "Le dividende face aux flux",
      notions: ["net_treasury"],
      question: () => "Calculez le dividende demandé, puis ce qu'il faudrait prendre, au-delà de ce que l'activité a libéré, sur l'argent de la création.",
      champs: (c) => {
        const n = dividendeDeLAssocie(c);
        return [
          { libelle: "Dividende demandé", attendu: n.dividende, calcul: `${eur(DIVIDENDE_DEMANDE_PAR_ACTION)} × ${qte(ACTIONS_DE_NOVA.nombre)} = ${eur(n.dividende)}` },
          { libelle: "Pris sur l'argent de la création", attendu: n.manque, calcul: `${eur(n.dividende)} − ${eur(n.x.fluxApresRemboursement)} = ${eur(n.manque)}` },
        ];
      },
      explication: (c) => {
        const n = dividendeDeLAssocie(c);
        return [`Le dividende dépasse de ${eur(n.manque)} ce que l'activité a libéré : cette part serait payée avec l'apport et l'emprunt, l'argent gardé pour la seconde ligne.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'associé",
      notions: ["net_treasury", "frng"],
      question: (c) => {
        const n = dividendeDeLAssocie(c);
        return `L'associé demande ${eur(n.dividende)}, l'activité a libéré ${eur(n.x.fluxApresRemboursement)} après l'investissement et le remboursement. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const n = dividendeDeLAssocie(c);
        const x = n.x;
        return [
          {
            texte: `Possible, mais ${eur(n.manque)} viendraient de l'apport et de l'emprunt`,
            juste: true,
            retour: `Oui. La trésorerie peut le payer, mais ${eur(n.manque)} n'auraient pas été gagnés par l'activité : ils viendraient de l'argent de la création, réservé à la seconde ligne. Un dividende de ${eur(x.fluxApresRemboursement)} au plus serait financé par l'activité de l'année.`,
          },
          {
            texte: `Accordé sans réserve : ${eur(n.dividende)} ne pèsent rien face à ${eur(x.tresorerieDeCloture)} de trésorerie`,
            juste: false,
            retour: `Non : ${eur(x.fluxDeFinancement)} de cette trésorerie viennent de l'apport et de l'emprunt, et ${eur(x.placement)} sont bloqués sur le compte à terme. La trésorerie du bilan ne dit pas ce que l'activité a gagné.`,
          },
          {
            texte: "Refusé : un premier exercice ne peut légalement verser aucun dividende",
            juste: false,
            retour: "Non : un bénéfice distribuable peut se verser dès le premier exercice, la réserve légale dotée. La question n'est pas de droit mais de financement.",
          },
          {
            texte: `Refusé : le résultat net, ${eur(x.resultatNet)}, ne couvre pas le dividende`,
            juste: false,
            retour: `Non : le résultat le couvre largement. C'est la trésorerie libérée par l'activité, ${eur(x.fluxApresRemboursement)}, qui ne le couvre pas.`,
          },
        ];
      },
    },
  ],
};
