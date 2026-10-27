import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../../scenarios/registry";
import { type Cas } from "../../cas";
import { anneeDuCours as anneeJouee } from "../../monde/annee-du-cours";
import { moyensDeDepart } from "../../chapitres/le-projet-d-entreprise";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PROJET D'ENTREPRISE » : UN ÉQUIPEMENT DE PLUS AU DÉPART
 * (Seconde, option management et gestion, palier 1).
 *
 * Les associés voudraient démarrer avec un équipement de plus, du même type que le premier de
 * leur parc, au prix du catalogue de l'arène. Ils demandent s'il faut l'emprunter ou le payer avec
 * la trésorerie de départ. L'élève refait les calculs du chapitre : ce que deviennent la
 * trésorerie et les jours de charges fixes qu'elle paie si l'on paie comptant ; ce que deviennent
 * le total des ressources et la part des associés si l'on emprunte, et ce que coûte chaque
 * trimestre le remboursement. Puis il rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre lit le projet tel qu'il est ; le cas y ajoute un
 * besoin, et fait choisir la ressource qui le paie. Le prix de l'équipement est celui du catalogue
 * du scénario (`equipment.types`), la durée d'un nouvel emprunt celle du scénario
 * (`loanDurationRounds`), et ce que la banque prête encore la règle du moteur : jusqu'à
 * `maxDebtToEquity` fois les capitaux propres, moins la dette déjà due.
 */

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "comptant" | "emprunter" | "impossible";

/** L'équipement demandé, payé comptant ou emprunté. */
export function equipementDePlus(c: Cas) {
  const m = moyensDeDepart(c);
  const s = scenarioByCode(c.code).scenario;
  const { depart } = anneeJouee(c.code);
  const type = s.equipment!.types.find((t) => t.code === depart.fleet![0]!.typeCode)!;
  const prix = type.costPerUnit;
  const tresorerieApres = auCentime(m.tresorerie - prix);
  const joursApres = tresorerieApres > 0 ? Math.floor(tresorerieApres / m.chargesParJour + 1e-9) : 0;
  const endettementMaximal = s.finance.maxDebtToEquity!;
  const plafond = Math.max(0, endettementMaximal * depart.finance.equity - depart.finance.financialDebt);
  const totalAvecLEmprunt = auCentime(m.totalDesRessources + prix);
  const dureeDuPret = s.finance.loanDurationRounds!;
  const verdict: Verdict = prix > m.tresorerie ? "impossible" : joursApres >= m.joursParTrimestre ? "comptant" : "emprunter";
  return {
    m,
    nom: type.name,
    prix,
    tresorerieApres,
    joursApres,
    endettementMaximal,
    plafond,
    totalAvecLEmprunt,
    partDesAssociesApres: auDixieme((m.apports / totalAvecLEmprunt) * 100),
    dureeDuPret,
    remboursement: auCentime(prix / dureeDuPret),
    verdict,
  };
}

export const UN_EQUIPEMENT_DE_PLUS_AU_DEPART: Situation = {
  code: "un-equipement-de-plus-au-depart",
  parcours: "seconde-mg",
  palier: 1,
  blocs: [],
  reprend: ["le-projet-d-entreprise"],
  commanditaire: "Les associés",
  titre: "Un équipement de plus au départ",
  accroche:
    "Les associés voudraient démarrer avec un équipement de plus. Faut-il l'emprunter, ou le payer avec la trésorerie de départ ? Ce que chaque solution change au projet.",
  objectifs: [
    "Ajouter un besoin au projet et choisir la ressource qui le paie",
    "Mesurer ce qu'un achat comptant retire à la trésorerie de départ",
    "Mesurer ce qu'un emprunt change à la part des associés",
    "Répondre aux associés, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande des associés",
      texte: (c) => {
        const k = equipementDePlus(c);
        return [
          `« Nous voudrions démarrer avec un équipement de plus, du type ${k.nom.toLowerCase()}, à ${eur(k.prix)}. Faut-il l'emprunter à la banque, ou le payer avec la trésorerie de départ ? Dites-nous ce que chaque solution change, et laquelle prendre. »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. Un trimestre compte ${qte(k.m.joursParTrimestre)} jours.`,
        ];
      },
      tableau: (c) => {
        const k = equipementDePlus(c);
        return {
          titre: `Le projet ${dE(c.entreprise)}, et l'équipement demandé`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Total des ressources au départ", valeurs: [eur(k.m.totalDesRessources)] },
            { libelle: "Apports des associés", valeurs: [eur(k.m.apports)] },
            { libelle: "Trésorerie de départ", valeurs: [eur(k.m.tresorerie)] },
            { libelle: "Charges fixes d'une journée", valeurs: [eur(k.m.chargesParJour)] },
            { libelle: `Prix de l'équipement « ${k.nom} »`, valeurs: [eur(k.prix)] },
            { libelle: "Ce que la banque prête encore, au plus", valeurs: [eur(k.plafond)] },
            { libelle: "Durée d'un nouvel emprunt", valeurs: [`${qte(k.dureeDuPret)} trimestres`] },
          ],
        };
      },
      repere: () => "À rendre : ce que chaque solution change à la trésorerie et aux ressources, et votre réponse aux associés.",
    },
    {
      id: "comptant",
      type: "montants",
      titre: "Le payer comptant",
      notions: ["net_treasury", "fixed_costs"],
      question: () =>
        "Si l'équipement est payé avec la trésorerie de départ, calculez ce qu'il reste sur le compte, puis le nombre de jours de charges fixes que ce reste peut encore payer (arrondi au jour inférieur ; zéro s'il ne reste rien).",
      champs: (c) => {
        const k = equipementDePlus(c);
        return [
          { libelle: "Trésorerie après l'achat", attendu: k.tresorerieApres, calcul: `${eur(k.m.tresorerie)} − ${eur(k.prix)} = ${eur(k.tresorerieApres)}`, tolerance: 1 },
          {
            libelle: "Jours de charges fixes encore payés",
            attendu: k.joursApres,
            calcul: k.tresorerieApres > 0 ? `${eur(k.tresorerieApres)} ÷ ${eur(k.m.chargesParJour)} = ${qte(k.joursApres)} jours` : "il ne reste rien sur le compte : 0 jour",
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = equipementDePlus(c);
        return [
          k.tresorerieApres < 0
            ? `La trésorerie de départ ne suffit pas : il manquerait ${eur(-k.tresorerieApres)} pour payer l'équipement.`
            : `Payé comptant, l'équipement fait passer la trésorerie de ${qte(k.m.joursCouverts)} à ${qte(k.joursApres)} jours de charges fixes. Le total du projet ne change pas : un besoin (la trésorerie) devient un autre besoin (l'équipement).`,
        ];
      },
    },
    {
      id: "emprunter",
      type: "montants",
      titre: "L'emprunter",
      notions: ["balance_sheet", "loan_schedule"],
      question: () =>
        "Si l'équipement est payé par un nouvel emprunt, calculez le total des ressources du projet, la part apportée par les associés ensuite (en pourcentage au dixième), puis ce que l'entreprise rembourse chaque trimestre pour ce nouvel emprunt, sans les intérêts.",
      champs: (c) => {
        const k = equipementDePlus(c);
        return [
          { libelle: "Total des ressources avec l'emprunt", attendu: k.totalAvecLEmprunt, calcul: `${eur(k.m.totalDesRessources)} + ${eur(k.prix)} = ${eur(k.totalAvecLEmprunt)}`, tolerance: 1 },
          { libelle: "Part apportée par les associés ensuite (%)", attendu: k.partDesAssociesApres, calcul: `${eur(k.m.apports)} ÷ ${eur(k.totalAvecLEmprunt)} × 100 = ${pct(k.partDesAssociesApres)}`, tolerance: 0.1 },
          { libelle: "Remboursement par trimestre", attendu: k.remboursement, calcul: `${eur(k.prix)} ÷ ${qte(k.dureeDuPret)} = ${eur(k.remboursement)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const k = equipementDePlus(c);
        return [
          `Emprunté, l'équipement ajoute un besoin et une ressource du même montant : le projet reste équilibré, à ${eur(k.totalAvecLEmprunt)}. La trésorerie de départ reste entière, mais la part des associés passe de ${pct(k.m.partDesAssocies)} à ${pct(k.partDesAssociesApres)}, et il faudra rembourser ${eur(k.remboursement)} chaque trimestre, plus les intérêts.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse aux associés",
      notions: ["net_treasury"],
      question: () => "Quelle phrase envoyez-vous aux associés ?",
      options: (c) => {
        const k = equipementDePlus(c);
        const chiffres =
          k.tresorerieApres < 0
            ? `il manquerait ${eur(-k.tresorerieApres)} sur le compte`
            : `la trésorerie ne paierait plus que ${qte(k.joursApres)} jours de charges fixes, pour un trimestre de ${qte(k.m.joursParTrimestre)} jours`;
        return [
          {
            texte: "L'emprunter : payé comptant, la trésorerie ne tiendrait plus un trimestre",
            juste: k.verdict === "emprunter",
            retour:
              k.verdict === "emprunter"
                ? `Oui : payé comptant, ${chiffres}. Un équipement sert plusieurs années : il se paie mieux avec une ressource durable, l'emprunt, et la trésorerie reste pour les dépenses de tous les jours.`
                : k.verdict === "impossible"
                  ? `Non : on ne peut même pas le payer comptant, ${chiffres}.`
                  : `Non : payé comptant, la trésorerie paierait encore ${qte(k.joursApres)} jours, plus qu'un trimestre.`,
          },
          {
            texte: "L'emprunter : la trésorerie de départ ne couvre même pas son prix",
            juste: k.verdict === "impossible",
            retour:
              k.verdict === "impossible"
                ? `Oui : ${chiffres}. La banque prête encore jusqu'à ${eur(k.plafond)} : l'emprunt de ${eur(k.prix)} passe, à ${eur(k.remboursement)} par trimestre.`
                : `Non : la trésorerie de départ, ${eur(k.m.tresorerie)}, couvre le prix de ${eur(k.prix)}.`,
          },
          {
            texte: "Le payer comptant : la trésorerie paierait encore plus d'un trimestre",
            juste: k.verdict === "comptant",
            retour:
              k.verdict === "comptant"
                ? `Oui : il resterait ${eur(k.tresorerieApres)}, soit ${qte(k.joursApres)} jours de charges fixes, plus qu'un trimestre. L'entreprise évite ainsi les intérêts d'un nouvel emprunt.`
                : `Non : ${chiffres}.`,
          },
          {
            texte: "Demander aux associés de tout apporter, car la banque refusera de prêter davantage",
            juste: false,
            retour: `Non : la banque de l'arène prête jusqu'à ${qte(k.endettementMaximal)} fois les capitaux propres, dette déjà due comprise ; elle accepte encore ${eur(k.plafond)}, bien plus que les ${eur(k.prix)} de l'équipement.`,
          },
        ];
      },
    },
  ],
};
