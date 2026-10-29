import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { moyensDeDepart } from "../../chapitres/le-projet-d-entreprise";
import { ENTREPRISES_DE_LA_DIRECTION, MOIS_DE_CHARGES_A_COUVRIR, posteDePlusAuDepart } from "../../monde/direction-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PROJET D'ENTREPRISE » : UN ÉQUIPEMENT DE PLUS AU DÉPART
 * (Seconde, option management et gestion, palier 1).
 *
 * Les associés de NOVA voudraient démarrer avec un cinquième poste sur leur ligne de montage, au prix
 * des quatre premiers. Ils demandent s'il faut l'emprunter ou le payer avec la trésorerie de départ.
 * L'élève refait les calculs du chapitre : ce que deviennent la trésorerie et les jours de charges
 * fixes qu'elle paie si l'on paie comptant ; ce que deviennent le total des ressources et la part des
 * associés si l'on emprunte, et ce que coûte la première échéance. Puis il rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre lit le projet tel qu'il est ; le cas y ajoute un
 * besoin, et fait choisir la ressource qui le paie. Le prix du poste est celui du catalogue du cours
 * (nova-capacite.ts), l'emprunt suit les conditions de celui de NOVA (monde/direction-de-nova.ts).
 * La règle de la réponse reprend l'hypothèse du chapitre : garder trois mois de charges fixes.
 *
 * CE QUI A CHANGÉ. Le cas lisait le catalogue d'équipements et les règles d'endettement de l'arène ;
 * il se joue chez NOVA : payé comptant, le poste laisse 140 000 € de trésorerie, 138 jours de charges.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

export type Verdict = "comptant" | "emprunter";

/** Le poste demandé, payé comptant ou emprunté. */
export function equipementDePlus(_c?: Cas) {
  const k = posteDePlusAuDepart();
  const m = moyensDeDepart();
  const joursACouvrir = MOIS_DE_CHARGES_A_COUVRIR * m.joursParMois;
  const verdict: Verdict = k.comptant.jours >= joursACouvrir ? "comptant" : "emprunter";
  return { ...k, m, joursACouvrir, partApres: auDixieme(k.emprunte.partDesAssocies * 100), verdict };
}

export const UN_EQUIPEMENT_DE_PLUS_AU_DEPART: Situation = {
  code: "un-equipement-de-plus-au-depart",
  parcours: "seconde-mg",
  palier: 1,
  blocs: [],
  reprend: ["le-projet-d-entreprise"],
  commanditaire: "Les associés",
  titre: "Un équipement de plus au départ",
  accroche: "Les associés voudraient démarrer avec un poste de plus sur leur ligne. Faut-il le payer avec la trésorerie de départ, ou l'emprunter ?",
  objectifs: [
    "Recalculer la trésorerie de départ avec un besoin de plus",
    "Mesurer les jours de charges fixes qu'elle paie encore",
    "Recalculer les ressources et la part des associés avec un emprunt de plus",
    "Répondre aux associés, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_DIRECTION,
    pourquoi: "le cas reprend la création de NOVA, celle du chapitre, et le poste de sa ligne de montage.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande des associés",
      texte: () => {
        const k = equipementDePlus();
        return [
          `« Nous pourrions démarrer avec un cinquième poste sur la ligne, ${eur(k.machine.prix)} hors taxes, ${eur(k.capital)} toutes taxes comprises, pour ne pas manquer de capacité plus tard. Faut-il le payer avec notre trésorerie, ou demander ${eur(k.capital)} de plus à la banque, aux conditions de notre prêt ? Nous voulons garder de quoi payer ${MOIS_DE_CHARGES_A_COUVRIR} mois de charges fixes. » Les associés`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre, avec un besoin de plus.",
        ];
      },
      tableau: () => {
        const k = equipementDePlus();
        return {
          titre: "Le projet de NOVA, sans le poste de plus",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Trésorerie de départ (compte à terme et compte courant)", valeurs: [eur(k.sans.tresorerie)] },
            { libelle: "Total des ressources", valeurs: [eur(k.sans.ressources)] },
            { libelle: "Apport des associés", valeurs: [eur(k.sans.apport)] },
            { libelle: "Charges fixes d'une journée", valeurs: [eur(k.m.chargesParJourAuCentime)] },
            { libelle: "Durée de l'emprunt, en trimestres", valeurs: [qte(k.sans.trimestresDuPret)] },
            { libelle: "Taux de l'emprunt, par an", valeurs: [pct(k.sans.tauxDuPret * 100)] },
          ],
        };
      },
      repere: () => "À rendre : la trésorerie et les jours de charges si l'on paie comptant, les ressources et la part des associés si l'on emprunte, la première échéance, et votre réponse.",
    },
    {
      id: "comptant",
      type: "montants",
      titre: "Le payer comptant",
      notions: ["net_treasury", "fixed_costs"],
      question: () => "Si NOVA paie le poste comptant, calculez la trésorerie de départ qui reste, puis les jours de charges fixes qu'elle paie (au jour inférieur).",
      champs: () => {
        const k = equipementDePlus();
        return [
          { libelle: "Trésorerie après l'achat", attendu: k.comptant.tresorerie, calcul: `${eur(k.sans.tresorerie)} − ${eur(k.capital)} = ${eur(k.comptant.tresorerie)}`, tolerance: 1 },
          { libelle: "Jours de charges fixes", attendu: k.comptant.jours, calcul: `${eur(k.comptant.tresorerie)} ÷ ${eur(k.m.chargesParJourAuCentime)} = ${qte(k.comptant.jours)} jours`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = equipementDePlus();
        return [`Payé comptant, le poste laisse ${eur(k.comptant.tresorerie)}, ${qte(k.comptant.jours)} jours de charges fixes ; les associés en voulaient au moins ${qte(k.joursACouvrir)}.`];
      },
    },
    {
      id: "emprunter",
      type: "montants",
      titre: "L'emprunter",
      notions: ["balance_sheet", "loan_schedule"],
      question: () => "Si NOVA emprunte le prix du poste, calculez le total des ressources, la part des associés (au dixième), puis la première échéance trimestrielle : le capital remboursé chaque trimestre et les intérêts du trimestre.",
      champs: () => {
        const k = equipementDePlus();
        return [
          { libelle: "Total des ressources", attendu: k.emprunte.ressources, calcul: `${eur(k.sans.ressources)} + ${eur(k.capital)} = ${eur(k.emprunte.ressources)}`, tolerance: 1 },
          { libelle: "Part des associés (%)", attendu: k.partApres, calcul: `${eur(k.sans.apport)} ÷ ${eur(k.emprunte.ressources)} × 100 = ${pct(k.partApres)}`, tolerance: 0.1 },
          { libelle: "Première échéance", attendu: k.premiereEcheance, calcul: `${eur(k.capital)} ÷ ${qte(k.sans.trimestresDuPret)} + ${eur(k.capital)} × ${pct(k.sans.tauxDuPret * 100)} ÷ ${k.sans.echeancesParAn} = ${eur(k.capitalParEcheance)} + ${eur(k.interets)} = ${eur(k.premiereEcheance)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = equipementDePlus();
        return [`Emprunté, le poste garde la trésorerie intacte, mais la banque porte une plus grande part du projet : les associés n'en apportent plus que ${pct(k.partApres)}, et NOVA paie ${eur(k.interets)} d'intérêts au premier trimestre.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse aux associés",
      question: () => "Que répondez-vous aux associés ?",
      options: () => {
        const k = equipementDePlus();
        return [
          {
            texte: `Le payer comptant : il reste ${qte(k.comptant.jours)} jours de charges`,
            juste: k.verdict === "comptant",
            retour:
              k.verdict === "comptant"
                ? `Oui : ${qte(k.comptant.jours)} jours, plus que les ${qte(k.joursACouvrir)} voulus. Payer comptant évite les intérêts ; mais la réserve placée devra être entamée plus tôt, car le compte courant ne garderait que ${eur(k.comptant.compteCourant)}.`
                : `Non : il ne resterait que ${qte(k.comptant.jours)} jours de charges, moins que les ${qte(k.joursACouvrir)} voulus.`,
          },
          {
            texte: "L'emprunter : une entreprise qui démarre ne doit jamais toucher à sa trésorerie",
            juste: k.verdict === "emprunter",
            retour:
              k.verdict === "emprunter"
                ? `Oui : payé comptant, il ne resterait que ${qte(k.comptant.jours)} jours de charges.`
                : `Non : la trésorerie sert justement à payer ce dont le projet a besoin. Ici, elle garde ${qte(k.comptant.jours)} jours de charges après l'achat : l'emprunt coûterait des intérêts sans nécessité.`,
          },
          {
            texte: "Ni l'un ni l'autre : un équipement se paie avec les premières ventes",
            juste: false,
            retour: "Non : un équipement s'achète avant de produire, donc avant de vendre. Il se paie avec les ressources du projet : l'apport, l'emprunt, ou la trésorerie qu'ils ont financée.",
          },
        ];
      },
    },
  ],
};
