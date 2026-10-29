import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { LIVRER_A_TEMPS } from "../../chapitres/livrer-a-temps";
import { margeUnitaire } from "../../monde/capacite";
import { ficheDeNova, panneDuPremierTrimestre } from "../../monde/production-et-logistique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LIVRER À TEMPS : LES DÉLAIS ET LE SERVICE » : COMBIEN PROMETTRE PENDANT
 * LA PANNE (2de pro GATL, le transport et la logistique, palier 1).
 *
 * Début janvier N + 1, la ligne de NOVA tombe en panne : elle perd un cinquième de sa capacité du
 * 1er trimestre (la panne de la ligne de nova-capacite.ts). Le chef d'atelier veut promettre toutes
 * les commandes du trimestre, quitte à livrer les dernières au trimestre suivant. L'élève calcule la
 * capacité qui reste, les commandes qui ne tiennent pas, ce qu'elles coûtent, la place libre au
 * trimestre suivant, et répond : le 2e trimestre est déjà plein, ces commandes sont perdues, il faut
 * prévenir les clients. Les chiffres sont ceux du chapitre (monde/production-et-logistique.ts).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export type ChoixPendantLaPanne = "prevenir" | "reporter" | "tout-promettre";

/** Le cas : la panne, la capacité qui reste, les commandes perdues, et le choix qui tient. */
export function chargementPendantLaPanne(c: Pick<Cas, "code">) {
  const k = panneDuPremierTrimestre(ficheDeNova(c));
  const choix: ChoixPendantLaPanne = k.refusees === 0 ? "tout-promettre" : k.libreAuSuivant >= k.refusees ? "reporter" : "prevenir";
  return { ...k, choix };
}

export const COMBIEN_CHARGER_PENDANT_LA_PANNE: Situation = {
  code: "combien-charger-pendant-la-panne",
  parcours: "logistique",
  palier: 1,
  blocs: [],
  reprend: [LIVRER_A_TEMPS.code],
  commanditaire: "Le chef d'atelier",
  titre: "Combien promettre pendant la panne ?",
  accroche: "La ligne perd une partie de sa capacité pour tout le trimestre. Promettre toutes les commandes, les reporter, ou prévenir les clients ?",
  objectifs: ["Calculer la capacité qui reste pendant une panne", "Chiffrer les commandes qui ne tiennent pas, et ce qu'elles coûtent", "Dire si un report est possible, et répondre au chef d'atelier"],
  libre: false,
  entreprises: LIVRER_A_TEMPS.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du chef d'atelier",
      texte: (c) => {
        const k = chargementPendantLaPanne(c);
        return [
          `« La ligne est en panne : le réparateur dit qu'elle montera ${qte(k.panne.perteDeCapacite * 100)} % de moins tout le trimestre. Les clients ont commandé ${qte(k.demande)} ${c.unites}. Je veux tout leur promettre : ce qui ne sera pas monté ce trimestre le sera au suivant. D'accord ? »`,
          "Pas de cours cette fois : la ligne et la demande sont celles du chapitre.",
        ];
      },
      tableau: (c) => {
        const k = chargementPendantLaPanne(c);
        const a = ficheDeNova(c).anneeNPlus1.demande;
        return {
          titre: `${c.entreprise}, les deux premiers trimestres de N + 1`,
          colonnes: ["1er trimestre", "2e trimestre"],
          lignes: [
            { libelle: `Capacité de la ligne sans panne (${c.unites})`, valeurs: [qte(k.capacite), qte(k.capacite)] },
            { libelle: "Capacité perdue par la panne", valeurs: [`${qte(k.panne.perteDeCapacite * 100)} %`, "aucune"] },
            { libelle: `Commandes des clients (${c.unites})`, valeurs: [qte(a[0]!), qte(a[1]!)] },
            { libelle: "Réparation", valeurs: [eur(k.panne.dommages), "aucune"] },
          ],
        };
      },
      repere: () => "À rendre : ce que la ligne peut monter pendant la panne, ce qui manque, la place au trimestre suivant, et votre réponse.",
    },
    {
      id: "la-ligne-en-panne",
      type: "montants",
      titre: "La ligne pendant la panne",
      notions: ["capacity"],
      question: (c) => `Calculez la capacité qui reste au 1er trimestre, les ${c.unites} commandées qui ne tiennent pas, puis ce que la panne coûte (leur marge et la réparation).`,
      champs: (c) => {
        const k = chargementPendantLaPanne(c);
        const m = margeUnitaire(ficheDeNova(c));
        return [
          { libelle: "Capacité pendant la panne", attendu: k.reste, calcul: `${qte(k.capacite)} × (100 % − ${qte(k.panne.perteDeCapacite * 100)} %) = ${qte(k.reste)}`, tolerance: 0 },
          { libelle: "Commandes qui ne tiennent pas", attendu: k.refusees, calcul: `${qte(k.demande)} − ${qte(k.reste)} = ${qte(k.refusees)}`, tolerance: 0 },
          { libelle: "Coût de la panne", attendu: k.cout, calcul: `${qte(k.refusees)} × ${eur(m)} + ${eur(k.panne.dommages)} = ${eur(k.cout)}` },
        ];
      },
      explication: (c) => {
        const k = chargementPendantLaPanne(c);
        return [`La ligne en panne ne monte que ${qte(k.reste)} ${c.unites} : ${qte(k.refusees)} commandes ne tiennent pas dans le trimestre.`];
      },
    },
    {
      id: "le-trimestre-suivant",
      type: "montants",
      titre: "La place au trimestre suivant",
      notions: ["capacity"],
      question: (c) => `Calculez la capacité libre au 2e trimestre (capacité moins commandes du trimestre ; négative si les commandes la dépassent), en ${c.unites}.`,
      champs: (c) => {
        const k = chargementPendantLaPanne(c);
        const a = ficheDeNova(c).anneeNPlus1.demande;
        return [{ libelle: "Capacité libre au 2e trimestre", attendu: k.libreAuSuivant, calcul: `${qte(k.capacite)} − ${qte(a[1]!)} = ${qte(k.libreAuSuivant)}`, tolerance: 0 }];
      },
      explication: (c) => {
        const k = chargementPendantLaPanne(c);
        return [k.libreAuSuivant < 0 ? `Le 2e trimestre est déjà trop plein : il lui manque ${qte(-k.libreAuSuivant)} ${c.unites} pour ses propres commandes. Rien ne peut y être reporté.` : `Le 2e trimestre a ${qte(k.libreAuSuivant)} ${c.unites} de place.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au chef d'atelier",
      question: () => "Que répondez-vous au chef d'atelier ?",
      options: (c) => {
        const k = chargementPendantLaPanne(c);
        return [
          {
            texte: `Prévenir : ${qte(k.refusees)} commandes ne seront pas livrées`,
            juste: k.choix === "prevenir",
            retour: k.choix === "prevenir" ? `Oui : la ligne en panne monte ${qte(k.reste)} ${c.unites}, et le 2e trimestre est déjà plein. Mieux vaut le dire aux clients que leur promettre un retard qu'on ne tiendra pas.` : "Non.",
          },
          { texte: "Tout promettre, et livrer le reste au 2e trimestre", juste: k.choix === "reporter", retour: k.choix === "reporter" ? "Oui." : `Non : au 2e trimestre, la ligne ne suffit déjà pas à ses propres commandes (${qte(k.libreAuSuivant)} ${c.unites} de place).` },
          { texte: "Tout promettre : la panne ne change rien aux livraisons", juste: k.choix === "tout-promettre", retour: k.choix === "tout-promettre" ? "Oui." : `Non : il manque ${qte(k.refusees)} ${c.unites} de capacité ce trimestre.` },
        ];
      },
    },
  ],
};
