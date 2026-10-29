import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../monde/amortissement";
import { COURS_A_TERME, COURS_DU_DOLLAR, HARBOR_AUDIO, operationsEnDevises } from "../../monde/comptabilite-approfondie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES OPÉRATIONS EN DEVISES » (DCG · Comptabilité approfondie, palier 4).
 *
 * Le 15 novembre N + 1, la banque propose à NOVA de lui acheter à terme les dollars de Harbor Audio,
 * au cours de `COURS_A_TERME`. Le directeur financier veut savoir ce que cette couverture coûte
 * aujourd'hui, ce qu'elle change à la clôture, et s'il faut la prendre. L'élève refait les calculs
 * du chapitre (`operationsEnDevises`) sur la créance seule, couverte ou non.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const cours = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function creanceCouverte() {
  const d = operationsEnDevises();
  const fige = auCentime(d.dollars * COURS_A_TERME);
  return {
    ...d,
    fige,
    coutDeLaCouverture: auCentime(d.creanceALaFacture - fige),
    // Couverte, la créance n'a plus de risque : aucune provision à la clôture.
    provisionCouverte: 0,
    // Sans couverture, au paiement, le cours du jour : ce que la couverture aura fait manquer.
    manqueAuPaiement: auCentime(d.encaisse - fige),
  };
}

export const COUVRIR_LA_CREANCE_EN_DOLLARS: Situation = {
  code: "couvrir-la-creance-en-dollars",
  parcours: "dcg-comptabilite-approfondie",
  palier: 4,
  blocs: [],
  reprend: ["les-operations-en-devises"],
  commanditaire: "Le directeur financier",
  titre: "Couvrir la créance en dollars",
  accroche: "La banque propose de figer aujourd'hui le cours des dollars attendus : ce que la couverture coûte, ce qu'elle change à la clôture, ce qu'elle aurait fait manquer.",
  objectifs: ["Calculer la créance couverte", "Comparer la couverture et le risque", "Répondre au directeur, chiffre à l'appui"],
  libre: false,
  entreprises: { codes: ["nova"], pourquoi: "ce cas reprend la créance de NOVA sur Harbor Audio, celle du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du directeur",
      texte: () => {
        const k = creanceCouverte();
        return [
          `« La banque nous propose d'acheter dès aujourd'hui les ${k.dollars.toLocaleString("fr-FR")} $ de ${HARBOR_AUDIO.nom}, livrables le ${HARBOR_AUDIO.echeance}, à ${cours(COURS_A_TERME)}. Le cours du jour est de ${cours(COURS_DU_DOLLAR.facture)}. Combien cela nous coûte-t-il, et qu'est-ce que cela change au 31 décembre ? » Le directeur financier`,
          "Pas de cours cette fois : la conversion et la provision, vous les connaissez.",
        ];
      },
      repere: () => "À rendre : ce que la couverture fige, ce qu'elle coûte, la provision à la clôture, et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "La couverture, chiffrée",
      notions: ["currency_risk"],
      question: () => "Calculez ce que NOVA encaissera si elle se couvre, ce que la couverture coûte par rapport au cours du jour de la vente, et la provision pour perte de change qu'elle devra au 31 décembre, sur la créance couverte.",
      champs: () => {
        const k = creanceCouverte();
        return [
          { libelle: "Encaissement couvert", attendu: k.fige, calcul: `${k.dollars.toLocaleString("fr-FR")} $ × ${cours(COURS_A_TERME)} = ${eur(k.fige)}` },
          { libelle: "Coût de la couverture", attendu: k.coutDeLaCouverture, calcul: `${eur(k.creanceALaFacture)} − ${eur(k.fige)} = ${eur(k.coutDeLaCouverture)}` },
          { libelle: "Provision à la clôture", attendu: k.provisionCouverte, calcul: "la créance couverte ne court plus de risque de change : aucune provision" },
        ];
      },
      explication: () => {
        const k = creanceCouverte();
        return [`Couverte, la créance rapportera ${eur(k.fige)}, quoi que fasse le dollar : ${eur(k.coutDeLaCouverture)} de moins que la vente, mais plus de perte latente à provisionner.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur",
      question: () => "Que répondez-vous au directeur financier ?",
      options: () => {
        const k = creanceCouverte();
        return [
          {
            texte: `Se couvrir fige ${eur(k.fige)}, sans provision`,
            juste: true,
            retour: `Oui : ${eur(k.coutDeLaCouverture)} sont le prix de la certitude. Sans couverture, NOVA aurait encaissé ${eur(k.encaisse)} en février, ${eur(k.manqueAuPaiement)} de plus ; mais elle ne le savait pas le 15 novembre, et le dollar aurait pu baisser encore.`,
          },
          {
            texte: "Se couvrir ne sert à rien : la provision de la clôture protège déjà NOVA d'une perte de change",
            juste: false,
            retour: "Non : une provision constate une perte, elle n'en protège pas. Seule la couverture fixe ce que NOVA encaissera.",
          },
          {
            texte: "Se couvrir, et provisionner quand même la perte latente de la créance au 31 décembre",
            juste: false,
            retour: "Non : la provision ne couvre que le risque non couvert. La créance couverte n'en a plus.",
          },
        ];
      },
    },
  ],
};
