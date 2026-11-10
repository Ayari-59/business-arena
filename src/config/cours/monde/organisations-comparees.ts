import { arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { affectationDeNova } from "./capitaux-propres";
import { compteDuLycee, exerciceDe } from "./comptes-du-lycee";
import { APPORT_EN_CAPITAL } from "./exercice-de-nova";
import { HAUT_VERDASSE, SOUTIEN_AU_HANDBALL, VALEUR_DE_LA_MISE_A_DISPOSITION, totalDe } from "./haut-verdasse";
import { HAUT_VERDASSE_HANDBALL } from "./haut-verdasse-handball";

/**
 * LE MONDE DU COURS : TROIS ORGANISATIONS DU TERRITOIRE, CÔTE À CÔTE (le chapitre « Qui possède, qui
 * dirige, qui contrôle ? », SGN de première T1.2 et management de première 1.2).
 *
 * Rien n'est nouveau : NOVA (l'apport des associés, ses ventes, son bénéfice de N et le dividende que
 * l'assemblée a voté, exercice-de-nova.ts, comptes-du-lycee.ts, capitaux-propres.ts), la Communauté
 * de communes du Haut-Verdasse (haut-verdasse.ts) et le Handball Club du Haut-Verdasse
 * (haut-verdasse-handball.ts). Ce fichier ne fait que les ranger sur les mêmes lignes : ce qui les
 * finance, ce qui leur reste, et ce que devient ce reste.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les parts (dividendes, ventes, usagers, subvention) se
 * donnaient au dixième de point, elles sont à deux décimales.
 */

const auCentime = arrondi2;

/** Les heures de gymnase que le club occupe dans la saison : heures par semaine × semaines. */
export const HEURES_DE_GYMNASE = SOUTIEN_AU_HANDBALL.gymnase.heuresParSemaine * SOUTIEN_AU_HANDBALL.gymnase.semaines;

export function organisationsComparees() {
  const nova = compteDuLycee(exerciceDe("nova"));
  const affectation = affectationDeNova();
  const recettesDeLaCommunaute = totalDe(HAUT_VERDASSE.budget.recettes);
  const usagers = HAUT_VERDASSE.budget.recettes.find((l) => l.code === "usagers")!.montant;
  const autofinancement = HAUT_VERDASSE.budget.depenses.find((l) => l.code === "autofinancement")!.montant;
  const recettesDuClub = totalDe(HAUT_VERDASSE_HANDBALL.budget.recettes);
  const depensesDuClub = totalDe(HAUT_VERDASSE_HANDBALL.budget.depenses);
  const excedentDuClub = auCentime(recettesDuClub - depensesDuClub);
  return {
    nova: {
      capital: APPORT_EN_CAPITAL.montant,
      ventes: nova.ventes,
      produits: nova.produits,
      benefice: nova.resultatNet,
      dividendes: affectation.dividendes,
      /** La part du bénéfice que l'assemblée a distribuée aux associés, en pourcentage, au dixième. */
      partDistribueePct: arrondi2((affectation.dividendes / nova.resultatNet) * 100),
      /** La part des ventes dans ce que NOVA reçoit : ses clients la financent. */
      partDesVentesPct: arrondi2((nova.ventes / nova.produits) * 100),
    },
    communaute: {
      recettes: recettesDeLaCommunaute,
      usagers,
      partDesUsagersPct: arrondi2((usagers / recettesDeLaCommunaute) * 100),
      impotsEtDotations: recettesDeLaCommunaute - usagers,
      /** Ce que les recettes laissent une fois les dépenses courantes payées : il finance les travaux. */
      autofinancement,
    },
    club: {
      recettes: recettesDuClub,
      depenses: depensesDuClub,
      excedent: excedentDuClub,
      subvention: SOUTIEN_AU_HANDBALL.subvention,
      partDeLaSubventionPct: arrondi2((SOUTIEN_AU_HANDBALL.subvention / recettesDuClub) * 100),
      miseADisposition: VALEUR_DE_LA_MISE_A_DISPOSITION,
      heuresDeGymnase: HEURES_DE_GYMNASE,
      /** Le plus haut tarif horaire, à l'euro, auquel le club pourrait louer le gymnase sans passer en déficit. */
      tarifSupportable: Math.floor(excedentDuClub / HEURES_DE_GYMNASE),
    },
  };
}

/** L'excédent du club s'il louait le gymnase au tarif donné, à l'heure. */
export const excedentDuClubAuTarif = (tarif: number) => auCentime(organisationsComparees().club.excedent - tarif * HEURES_DE_GYMNASE);
