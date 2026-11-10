import { eur, nombreAuCentieme } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DU_NUMERIQUE, facturesElectroniques } from "../../monde/numerique-de-la-ligne";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE NUMÉRIQUE DANS LA PRODUCTION » : DES FACTURES SANS PAPIER ? (Bac STMG,
 * enseignement commun de terminale, palier 1).
 *
 * Le chapitre chiffrait des capteurs sur la ligne ; le cas chiffre la dématérialisation des factures de
 * fournisseurs. Hypothèses : monde/numerique-de-la-ligne.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les heures gagnées sont une grandeur, au centième ; les
 * montants au centime.
 */

const qte = nombreAuCentieme;

export const DES_FACTURES_SANS_PAPIER: Situation = {
  code: "des-factures-sans-papier",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["le-numerique-dans-la-production"],
  commanditaire: "L'assistante de gestion",
  titre: "Des factures sans papier ?",
  accroche: "L'assistante passe des heures à saisir les factures papier des fournisseurs. Une plateforme de factures électroniques vaut-elle son abonnement ?",
  objectifs: ["Chiffrer le temps qu'une dématérialisation fait gagner", "Comparer ce temps gagné à son coût", "Répondre à l'assistante, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_NUMERIQUE, pourquoi: "le cas reprend les factures des fournisseurs de NOVA." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'assistante",
      texte: () => {
        const k = facturesElectroniques();
        return [
          `« Nous recevons ${qte(k.parAn)} factures de fournisseurs par an. J'en saisis une en ${qte(k.minutesPapier)} minutes ; reçue en fichier, elle s'intégrerait au PGI et je n'aurais qu'à la vérifier, en ${qte(k.minutesElectronique)} minute. Mon heure coûte ${eur(k.coutHoraire)} à NOVA, et la plateforme coûte ${eur(k.plateforme)} par an. Faut-il la prendre ? » L'assistante de gestion`,
          "Pas de cours cette fois : la démarche est celle du chapitre.",
        ];
      },
      repere: () => "À rendre : les heures gagnées, ce qu'elles valent, le gain de l'année et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Le temps gagné",
      question: () => "Calculez les heures gagnées dans l'année, ce qu'elles valent, puis le gain de l'année une fois la plateforme payée.",
      champs: () => {
        const k = facturesElectroniques();
        return [
          { libelle: "Heures gagnées dans l'année", nature: "grandeur", attendu: k.heuresGagnees, calcul: `${qte(k.parAn)} × (${qte(k.minutesPapier)} − ${qte(k.minutesElectronique)}) ÷ 60 = ${qte(k.heuresGagnees)}` },
          { libelle: "Ce qu'elles valent", attendu: k.economie, calcul: `${qte(k.heuresGagnees)} × ${eur(k.coutHoraire)} = ${eur(k.economie)}` },
          { libelle: "Gain de l'année", attendu: k.gain, calcul: `${eur(k.economie)} − ${eur(k.plateforme)} = ${eur(k.gain)}` },
        ];
      },
      explication: () => {
        const k = facturesElectroniques();
        return [`La plateforme libère ${qte(k.heuresGagnees)} heures, ${eur(k.economie)} de travail : une fois payée, elle laisse ${eur(k.gain)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'assistante",
      question: () => "Que répondez-vous à l'assistante ?",
      options: () => {
        const k = facturesElectroniques();
        return [
          {
            texte: `La prendre : ${qte(k.heuresGagnees)} heures libérées pour d'autres tâches`,
            juste: true,
            retour: `Oui : le temps gagné vaut ${eur(k.gain)} de plus que l'abonnement. L'assistante peut le consacrer au suivi des clients ou des relances, et la saisie à la main ne fera plus d'erreurs de frappe.`,
          },
          {
            texte: "La refuser : un abonnement payé chaque année coûte toujours plus qu'il ne rapporte",
            juste: false,
            retour: "Non : le calcul montre l'inverse. Le temps gagné vaut plus que l'abonnement.",
          },
          {
            texte: "La refuser : une facture reçue en fichier n'a aucune valeur comptable",
            juste: false,
            retour: "Non : une facture électronique est une pièce comptable comme une autre, et elle devient la règle entre entreprises.",
          },
        ];
      },
    },
  ],
};
