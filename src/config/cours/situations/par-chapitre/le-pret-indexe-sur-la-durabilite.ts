import { eur, nombreAuCentieme, pct as enPoints } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_DIAGNOSTIC, diagnosticDuChapitre } from "../../chapitres/le-diagnostic-financier-et-extra-financier";
import { auCentime } from "../../monde/amortissement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE DIAGNOSTIC FINANCIER ET EXTRA-FINANCIER » : LE PRÊT INDEXÉ SUR LA
 * DURABILITÉ (comptabilité générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le bilan et les indicateurs ESG de N + 2
 * (monde/diagnostic-de-nova.ts).
 *
 * HYPOTHÈSES DU CAS (nommées ci-dessous) : pour N + 3, NOVA veut agrandir son atelier et son stockage,
 * 300 000 € financés par un emprunt sur 10 ans, remboursé en parts égales chaque année. La banque prête
 * à trois conditions de structure, calculées après le prêt sur le bilan de N + 2 (l'argent reçu sera
 * dépensé : l'actif circulant ne change pas, un dixième du prêt devient exigible à moins d'un an), et
 * son prêt est indexé sur deux indicateurs ESG : la marge baisse de 0,20 point si les deux sont
 * tenus.
 */

/** LE PRÊT DEMANDÉ (hypothèse du cas) : 300 000 € sur 10 ans, à 4,5 % hors bonus. */
export const PRET_DE_L_EXTENSION = { montant: 300_000, dureeAns: 10, taux: 0.045 } as const;

/** LES CONDITIONS DE STRUCTURE DE LA BANQUE (hypothèse du cas), après le prêt. */
export const CONDITIONS_DE_LA_BANQUE = { endettementMaximal: 1, capaciteMaximale: 3, liquiditeMinimale: 1.2 } as const;

/** L'INDEXATION SUR LA DURABILITÉ (hypothèse du cas) : 0,20 point de moins si les deux indicateurs sont tenus. */
export const INDEXATION = { kwhParEnceinteMaximal: 1.6, partValoriseeMinimale: 0.9, bonus: 0.002 } as const;

const qte = (n: number) => nombreAuCentieme(n);
/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);

/** Les chiffres du cas. */
export function pretIndexe(c?: Pick<Cas, "code">) {
  const x = diagnosticDuChapitre(c);
  const k = x.n2;
  const b = x.r2.bilan;
  const p = PRET_DE_L_EXTENSION;
  const dettesApres = auCentime(k.dettesFinancieres + p.montant);
  const dettesAMoinsDUnAnApres = auCentime(b.dettesAMoinsDUnAn + p.montant / p.dureeAns);
  const endettement = Math.round((dettesApres / k.capitauxPropres) * 100) / 100;
  const capacite = Math.round((dettesApres / k.caf) * 100) / 100;
  const liquidite = Math.round((b.actifCirculant / dettesAMoinsDUnAnApres) * 100) / 100;
  const kwh = x.e2.kwhParEnceinte;
  const part = x.e2.partValorisee;
  const bonusObtenu = kwh <= INDEXATION.kwhParEnceinteMaximal && part >= INDEXATION.partValoriseeMinimale;
  return {
    x,
    k,
    b,
    dettesApres,
    dettesAMoinsDUnAnApres,
    endettement,
    capacite,
    liquidite,
    kwh,
    part,
    bonusObtenu,
    economieDeLaPremiereAnnee: auCentime(p.montant * INDEXATION.bonus),
    conditionsTenues: endettement <= CONDITIONS_DE_LA_BANQUE.endettementMaximal && capacite <= CONDITIONS_DE_LA_BANQUE.capaciteMaximale && liquidite >= CONDITIONS_DE_LA_BANQUE.liquiditeMinimale,
  };
}

export const LE_PRET_INDEXE_SUR_LA_DURABILITE: Situation = {
  code: "le-pret-indexe-sur-la-durabilite",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-diagnostic-financier-et-extra-financier"],
  commanditaire: "La chargée d'affaires de la banque",
  titre: "Le prêt indexé sur la durabilité",
  accroche: "NOVA demande 300 000 € pour agrandir son atelier. La banque a trois conditions de structure, et une marge qui baisse si deux indicateurs ESG sont tenus. Les comptes de N + 2 suffisent-ils ?",
  objectifs: [
    "Calculer des ratios de faillite et de structure après un emprunt",
    "Vérifier des indicateurs ESG face aux seuils d'un contrat",
    "Rendre un avis motivé à la banque",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_DIAGNOSTIC,
    pourquoi: "ce cas reprend le chapitre « Le diagnostic financier et extra-financier », qui se joue sur les trois exercices de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la banque",
      texte: () => {
        const p = PRET_DE_L_EXTENSION;
        return [
          `« NOVA nous demande ${eur(p.montant)} sur ${qte(p.dureeAns)} ans pour agrandir son atelier. Nous prêtons si, sur le bilan de N + 2 et l'emprunt compris, l'endettement ne dépasse pas ${qte(CONDITIONS_DE_LA_BANQUE.endettementMaximal)}, la capacité de remboursement ${qte(CONDITIONS_DE_LA_BANQUE.capaciteMaximale)} années de CAF, et si la liquidité générale reste d'au moins ${qte(CONDITIONS_DE_LA_BANQUE.liquiditeMinimale)}. Notre prêt est indexé sur la durabilité : la marge baisse de ${qte(INDEXATION.bonus * 100)} point si l'électricité par enceinte reste sous ${qte(INDEXATION.kwhParEnceinteMaximal)} kWh et si ${pct(INDEXATION.partValoriseeMinimale)} des emballages au moins sont valorisés. Pouvez-vous me dire où en est NOVA ? »`,
          "Pas de cours cette fois : vous avez les comptes de N + 2, et la méthode du chapitre. L'argent prêté sera dépensé dans l'atelier : il ne change pas l'actif circulant, et un dixième du prêt sera dû dans l'année.",
        ];
      },
      tableau: () => {
        const n = pretIndexe();
        return {
          titre: "NOVA au 31 décembre N + 2",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Capitaux propres", valeurs: [eur(n.k.capitauxPropres)] },
            { libelle: "Dettes financières, avant le prêt", valeurs: [eur(n.k.dettesFinancieres)] },
            { libelle: "Capacité d'autofinancement de N + 2", valeurs: [eur(n.k.caf)] },
            { libelle: "Actif circulant", valeurs: [eur(n.b.actifCirculant)] },
            { libelle: "Dettes à moins d'un an, avant le prêt", valeurs: [eur(n.b.dettesAMoinsDUnAn)] },
            { libelle: "Électricité consommée (kWh)", valeurs: [qte(n.x.e2.kwh)] },
            { libelle: "Enceintes montées", valeurs: [qte(n.k.enceintes)] },
            { libelle: "Part des emballages valorisés", valeurs: [pct(n.part)] },
          ],
        };
      },
      repere: () => "À rendre : les trois conditions de structure, les deux indicateurs du bonus, et votre avis.",
    },
    {
      id: "la-structure",
      type: "montants",
      titre: "La structure après le prêt",
      notions: ["frng", "balance_sheet"],
      question: () => "Calculez les dettes financières après le prêt, l'endettement (en fois, au centième), la capacité de remboursement (en années, au centième), puis la liquidité générale après le prêt (au centième).",
      champs: () => {
        const n = pretIndexe();
        return [
          { libelle: "Dettes financières après le prêt", attendu: n.dettesApres, calcul: `${eur(n.k.dettesFinancieres)} + ${eur(PRET_DE_L_EXTENSION.montant)} = ${eur(n.dettesApres)}` },
          { libelle: "Endettement après le prêt", nature: "grandeur", attendu: n.endettement, calcul: `${eur(n.dettesApres)} ÷ ${eur(n.k.capitauxPropres)} = ${qte(n.endettement)}`, tolerance: 0.01 },
          { libelle: "Capacité de remboursement après le prêt", nature: "grandeur", attendu: n.capacite, calcul: `${eur(n.dettesApres)} ÷ ${eur(n.k.caf)} = ${qte(n.capacite)}`, tolerance: 0.01 },
          {
            libelle: "Liquidité générale après le prêt",
            nature: "grandeur",
            attendu: n.liquidite,
            calcul: `${eur(n.b.actifCirculant)} ÷ (${eur(n.b.dettesAMoinsDUnAn)} + ${eur(PRET_DE_L_EXTENSION.montant / PRET_DE_L_EXTENSION.dureeAns)}) = ${qte(n.liquidite)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: () => {
        const n = pretIndexe();
        return [`Les trois conditions sont ${n.conditionsTenues ? "tenues" : "loin d'être toutes tenues"} : ${qte(n.endettement)} d'endettement, ${qte(n.capacite)} années de CAF, ${qte(n.liquidite)} de liquidité. NOVA partait de très peu de dette : elle a de la marge pour emprunter.`];
      },
    },
    {
      id: "les-indicateurs",
      type: "montants",
      titre: "Les indicateurs du bonus",
      notions: ["csr_index"],
      question: () => "Calculez l'électricité par enceinte de N + 2 (au centième), donnez la part des emballages valorisés (en pour cent), puis ce que le bonus ferait économiser d'intérêts la première année, sur tout le capital.",
      champs: () => {
        const n = pretIndexe();
        return [
          { libelle: "Électricité par enceinte (kWh)", nature: "grandeur", attendu: n.kwh, calcul: `${qte(n.x.e2.kwh)} kWh ÷ ${qte(n.k.enceintes)} enceintes = ${qte(n.kwh)} kWh`, tolerance: 0.01 },
          { libelle: "Part des emballages valorisés (%)", attendu: auCentime(n.part * 100), calcul: `lue dans les données : ${pct(n.part)}`, tolerance: 0.01 },
          { libelle: "Économie d'intérêts de la première année", attendu: n.economieDeLaPremiereAnnee, calcul: `${eur(PRET_DE_L_EXTENSION.montant)} × ${pct(INDEXATION.bonus)} = ${eur(n.economieDeLaPremiereAnnee)}` },
        ];
      },
      explication: () => {
        const n = pretIndexe();
        return [
          `${qte(n.kwh)} kWh par enceinte pour un seuil de ${qte(INDEXATION.kwhParEnceinteMaximal)}, ${pct(n.part)} d'emballages valorisés pour ${pct(INDEXATION.partValoriseeMinimale)} : ${n.bonusObtenu ? "les deux indicateurs sont tenus" : "un indicateur manque"}. Le bonus est modeste, ${eur(n.economieDeLaPremiereAnnee)} la première année ; il dit surtout que la banque suivra ces indicateurs chaque année, comme des ratios.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre avis à la banque",
      notions: ["balance_sheet", "csr_index"],
      question: () => "Quel avis rendez-vous à la chargée d'affaires ?",
      options: () => {
        const n = pretIndexe();
        return [
          {
            texte: "Prêter : la structure le permet, et les deux indicateurs du bonus sont tenus",
            juste: n.conditionsTenues && n.bonusObtenu,
            retour: `Oui. Après le prêt, ${qte(n.endettement)} d'endettement, ${qte(n.capacite)} années de CAF et ${qte(n.liquidite)} de liquidité : la structure tient. ${qte(n.kwh)} kWh par enceinte et ${pct(n.part)} d'emballages valorisés ouvrent le bonus. À surveiller : la CAF de N + 2 est une bonne année ; si le besoin d'exploitation continue de grandir plus vite que les ventes, la trésorerie suivra moins bien.`,
          },
          {
            texte: `Refuser : ${eur(PRET_DE_L_EXTENSION.montant)}, c'est plus de ${qte(Math.floor(PRET_DE_L_EXTENSION.montant / n.k.dettesFinancieres))} fois la dette actuelle de NOVA, c'est beaucoup trop`,
            juste: false,
            retour: "Comparer la dette à elle-même ne dit rien : ce qui compte, c'est la dette face aux capitaux propres et à la CAF, et les deux ratios restent sous les seuils de la banque.",
          },
          {
            texte: "Prêter sans bonus : les indicateurs ESG ne se vérifient pas dans les comptes",
            juste: false,
            retour: "Ils ne sont pas dans les comptes, mais ils se mesurent : l'électricité sur les factures, les emballages chez le recycleur. Le contrat les définit, et NOVA les tient.",
          },
        ];
      },
    },
  ],
};
