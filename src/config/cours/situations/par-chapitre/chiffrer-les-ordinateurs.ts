import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_DONNEES_STRATEGIQUES, chiffrement } from "../../monde/donnees-strategiques-de-maille";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DONNÉES ET ALGORITHMES » : CHIFFRER LES ORDINATEURS ? (Bac STMG, enseignement
 * commun de terminale, palier 1).
 *
 * Le chapitre chiffrait la sauvegarde des données stratégiques ; le cas chiffre la protection des
 * ordinateurs portables, après une alerte. Hypothèses : monde/donnees-strategiques-de-maille.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const CHIFFRER_LES_ORDINATEURS: Situation = {
  code: "chiffrer-les-ordinateurs",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["donnees-et-algorithmes"],
  commanditaire: "La gérante",
  titre: "Chiffrer les ordinateurs ?",
  accroche: "Une vendeuse a oublié son ordinateur portable dans un train, avec le fichier des clientes. Il a été retrouvé. Faut-il chiffrer les ordinateurs ?",
  objectifs: ["Chiffrer une mesure de sécurité des données", "La rapporter aux personnes qu'elle protège", "Répondre à la gérante, en pensant à la responsabilité de la boutique"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_DONNEES_STRATEGIQUES, pourquoi: "le cas reprend le fichier des clientes de MAILLE & CO." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la gérante",
      texte: () => {
        const k = chiffrement();
        return [
          `« L'ordinateur oublié a été retrouvé, mais il contenait le fichier de nos ${qte(k.inscrites)} clientes. Nous avons ${qte(k.postes)} portables ; les chiffrer coûterait ${eur(k.parPosteEtParMois)} par poste et par mois. Est-ce bien utile, puisque rien n'a été volé ? » La gérante`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de l'année, le coût par cliente protégée, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que coûte le chiffrement",
      question: () => "Calculez le coût du chiffrement sur un an, puis ce coût rapporté à chaque cliente du fichier (au centime).",
      champs: () => {
        const k = chiffrement();
        return [
          { libelle: "Coût de l'année", attendu: k.parAn, calcul: `${qte(k.postes)} × ${eur(k.parPosteEtParMois)} × 12 = ${eur(k.parAn)}` },
          { libelle: "Coût par cliente protégée", attendu: k.parCliente, calcul: `${eur(k.parAn)} ÷ ${qte(k.inscrites)} = ${eur(k.parCliente)}` },
        ];
      },
      explication: () => {
        const k = chiffrement();
        return [`${eur(k.parAn)} par an, ${eur(k.parCliente)} par cliente : le prix de la tranquillité, pour les clientes et pour la boutique.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Que répondez-vous à la gérante ?",
      options: () => {
        const k = chiffrement();
        return [
          {
            texte: `Chiffrer : ${eur(k.parAn)} par an pour une obligation de sécurité`,
            juste: true,
            retour: "Oui : la boutique, responsable du traitement, doit assurer la sécurité des données de ses clientes. Un ordinateur chiffré perdu n'est pas une violation de données grave : son contenu reste illisible.",
          },
          {
            texte: "Ne rien faire : l'ordinateur a été retrouvé, il n'y a donc aucun risque",
            juste: false,
            retour: "Non : la prochaine fois, il pourrait ne pas l'être. La sécurité se prévoit avant l'incident.",
          },
          {
            texte: "Effacer le fichier des clientes pour ne plus rien risquer",
            juste: false,
            retour: "Non : le fichier est utile, et les clientes ont accepté qu'il existe. Il faut le protéger, pas le supprimer.",
          },
        ];
      },
    },
  ],
};
