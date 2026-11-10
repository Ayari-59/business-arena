import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_SALLE } from "../../chapitres/le-plan-de-communication";
import { CAMPAGNE_DE_LA_RENTREE, adhesionsQuiPaient, meilleurSupport, supportsLus } from "../../monde/volt-fitness";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PLAN DE COMMUNICATION » : TOUTE LA CAMPAGNE À LA RADIO ? (Bac STMG,
 * mercatique de terminale, palier 1).
 *
 * Le gérant de la salle veut mettre tout le budget de la rentrée sur la radio locale, « la moins chère ».
 * L'élève refait les calculs du chapitre : le coût pour mille contacts dans la cible de chaque support,
 * puis les contacts dans la cible que le budget entier achète sur chacun (à prix proportionnel au
 * volume acheté, hypothèse du cas). La radio a le coût pour mille le plus bas, mais touche peu la cible.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

/** Les chiffres de la réponse, calculés une fois. */
export function touteLaCampagneALaRadio() {
  const s = supportsLus();
  const radio = s.find((x) => x.code === "radio")!;
  const meilleur = meilleurSupport();
  const budget = CAMPAGNE_DE_LA_RENTREE.budget;
  const pour = (x: typeof radio) => Math.round((budget / x.prix) * x.utiles);
  return { budget, radio, meilleur, utilesRadio: pour(radio), utilesMeilleur: pour(meilleur), adhesions: adhesionsQuiPaient() };
}

export const TOUTE_LA_CAMPAGNE_A_LA_RADIO: Situation = {
  code: "toute-la-campagne-a-la-radio",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["le-plan-de-communication"],
  commanditaire: "Le gérant de la salle",
  titre: "Toute la campagne à la radio ?",
  accroche: "Le gérant veut mettre tout le budget de la rentrée sur la radio locale, le support le moins cher pour mille contacts. Est-ce le moins cher pour toucher la cible ?",
  objectifs: ["Calculer le coût pour mille contacts dans la cible", "Comparer ce que le budget achète sur chaque support", "Répondre au gérant, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_SALLE,
    pourquoi: "le cas reprend la campagne de rentrée de VOLT FITNESS, du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du gérant",
      texte: () => {
        const r = touteLaCampagneALaRadio();
        return [
          `« La radio coûte ${eur(r.radio.coutPourMille)} pour mille contacts, c'est le moins cher. Mettons-y tout le budget de la rentrée, ${eur(r.budget)}. » Le gérant`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. La cible est ${CAMPAGNE_DE_LA_RENTREE.cible}. On admet que chaque support vend ses contacts au même prix, quel que soit le volume acheté.`,
        ];
      },
      tableau: () => ({
        titre: "Les supports de la rentrée",
        colonnes: ["Prix", "Contacts", "Contacts dans la cible"],
        lignes: supportsLus().map((x) => ({ libelle: `${x.media} : ${x.nom}`, valeurs: [eur(x.prix), qte(x.contacts), qte(x.utiles)] })),
      }),
      repere: () => "À rendre : le coût pour mille contacts dans la cible de la radio et du meilleur support, les contacts dans la cible que le budget achète sur chacun, et votre réponse.",
    },
    {
      id: "le-cout-dans-la-cible",
      type: "montants",
      titre: "Le coût pour mille, dans la cible",
      notions: ["customer_acquisition_cost", "segmentation"],
      question: () => `Calculez le coût pour mille contacts dans la cible de la radio, puis celui du support « ${touteLaCampagneALaRadio().meilleur.nom} ».`,
      champs: () => {
        const r = touteLaCampagneALaRadio();
        return [
          { libelle: "Coût pour mille dans la cible, radio", attendu: r.radio.coutPourMilleUtiles, calcul: `${eur(r.radio.prix)} ÷ ${qte(r.radio.utiles)} × 1 000 = ${eur(r.radio.coutPourMilleUtiles)}` },
          { libelle: "Coût pour mille dans la cible, meilleur support", attendu: r.meilleur.coutPourMilleUtiles, calcul: `${eur(r.meilleur.prix)} ÷ ${qte(r.meilleur.utiles)} × 1 000 = ${eur(r.meilleur.coutPourMilleUtiles)}` },
        ];
      },
      explication: () => {
        const r = touteLaCampagneALaRadio();
        return [`Dans la cible, la radio coûte ${eur(r.radio.coutPourMilleUtiles)} les mille contacts, contre ${eur(r.meilleur.coutPourMilleUtiles)} : peu de ses auditeurs ont l'âge visé.`];
      },
    },
    {
      id: "avec-tout-le-budget",
      type: "montants",
      titre: "Avec tout le budget",
      notions: ["customer_acquisition_cost"],
      question: () => "Calculez les contacts dans la cible que le budget entier achèterait sur la radio, puis sur le meilleur support.",
      champs: () => {
        const r = touteLaCampagneALaRadio();
        return [
          { libelle: "Contacts dans la cible, radio", attendu: r.utilesRadio, tolerance: 1, calcul: `${eur(r.budget)} ÷ ${eur(r.radio.prix)} × ${qte(r.radio.utiles)} = ${qte(r.utilesRadio)}` },
          { libelle: "Contacts dans la cible, meilleur support", attendu: r.utilesMeilleur, tolerance: 1, calcul: `${eur(r.budget)} ÷ ${eur(r.meilleur.prix)} × ${qte(r.meilleur.utiles)} = ${qte(r.utilesMeilleur)}` },
        ];
      },
      explication: () => {
        const r = touteLaCampagneALaRadio();
        return [`Pour le même budget, le meilleur support touche ${qte(r.utilesMeilleur)} personnes de la cible, la radio ${qte(r.utilesRadio)}. Il faut ${qte(r.adhesions)} adhésions pour payer la campagne : plus la cible est touchée, plus elles sont à portée.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: () => {
        const r = touteLaCampagneALaRadio();
        return [
          { texte: `Plutôt ${r.meilleur.media.toLowerCase()} : il touche la cible`, juste: true, retour: `Oui : la radio a le coût pour mille le plus bas, mais pas dans la cible. Pour ${eur(r.budget)}, ${r.meilleur.media.toLowerCase()} touche ${qte(r.utilesMeilleur)} personnes de la cible, la radio ${qte(r.utilesRadio)}.` },
          { texte: "D'accord : la radio coûte le moins cher pour mille contacts", juste: false, retour: `Non : seuls ${qte(r.radio.utiles)} de ses ${qte(r.radio.contacts)} contacts sont dans la cible. Mille contacts dans la cible y coûtent ${eur(r.radio.coutPourMilleUtiles)}.` },
          { texte: "Partageons le budget en parts égales entre les supports", juste: false, retour: `Non : partager ne s'appuie sur aucun calcul. Chaque euro mis sur ${r.meilleur.media.toLowerCase()} touche plus de personnes de la cible.` },
        ];
      },
    },
  ],
};
