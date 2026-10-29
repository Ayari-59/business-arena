import type { Cas } from "../../cas";
import { ORGANISER_L_ACTIVITE } from "../../chapitres/organiser-l-activite";
import { commandeExceptionnelle as commandeDeNova, embaucheDuPremierJanvier, ficheDeNova } from "../../monde/production-et-logistique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ORGANISER L'ACTIVITÉ » : LA COMMANDE EXCEPTIONNELLE (Seconde, option
 * management et gestion, palier 1).
 *
 * Une chaîne d'hôtels demande à NOVA 1 500 enceintes, à livrer au 3e trimestre de N, en plus des
 * clients habituels (5 810 enceintes). La direction demande si l'on peut la livrer en entier, et
 * sinon, si un renfort suffirait. L'élève refait les calculs du chapitre au 3e trimestre : la
 * capacité de l'entreprise, ce qu'il faudrait monter, ce qui reste pour la commande ; puis il répond,
 * en tenant compte de ce qui limite. La commande est l'hypothèse du cas
 * (monde/production-et-logistique.ts, COMMANDE_EXCEPTIONNELLE).
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export type Verdict = "en-entier" | "pas-en-entier";

/** La commande, le trimestre où la livrer, ce qui reste pour elle, et le verdict. */
export function commandeExceptionnelle(c: Pick<Cas, "code">) {
  const k = commandeDeNova(ficheDeNova(c));
  const verdict: Verdict = k.manque === 0 ? "en-entier" : "pas-en-entier";
  return { ...k, aMonter: k.t.demande + k.enceintes, verdict };
}

export const LA_COMMANDE_EXCEPTIONNELLE: Situation = {
  code: "la-commande-exceptionnelle",
  parcours: "seconde-mg",
  palier: 1,
  blocs: [],
  reprend: [ORGANISER_L_ACTIVITE.code],
  commanditaire: "La direction",
  titre: "La commande exceptionnelle",
  accroche: "Un client propose une grosse commande, à livrer dans le trimestre, en plus des clients habituels. Peut-on la livrer en entier, et sinon, un renfort arriverait-il à temps ?",
  objectifs: [
    "Calculer la capacité de l'entreprise",
    "Calculer la production qu'il faut pour servir tous les clients",
    "Dire ce qui reste pour une commande de plus",
    "Répondre à la direction en tenant compte de ce qui limite",
  ],
  libre: false,
  entreprises: ORGANISER_L_ACTIVITE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La commande proposée",
      texte: (c) => {
        const k = commandeExceptionnelle(c);
        return [
          `« Une chaîne d'hôtels nous demande ${qte(k.enceintes)} ${c.unites}, à livrer au ${k.trimestre}e trimestre, en plus de nos clients habituels. Pouvons-nous la livrer en entier ? Sinon, faut-il recruter ? »`,
          "Pas de cours cette fois : les ressources de NOVA sont celles du chapitre.",
        ];
      },
      tableau: (c) => {
        const x = ficheDeNova(c);
        const k = commandeExceptionnelle(c);
        return {
          titre: `${c.entreprise}, le ${k.trimestre}e trimestre de l'année N`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Capacité des postes (${c.unites})`, valeurs: [qte(k.t.capaciteOutil)] },
            { libelle: `Capacité de l'équipe (${c.unites})`, valeurs: [qte(k.t.capaciteEquipe)] },
            { libelle: `Demande des clients habituels (${c.unites})`, valeurs: [qte(k.t.demande)] },
            { libelle: `Commande de la chaîne d'hôtels (${c.unites})`, valeurs: [qte(k.enceintes)] },
            { libelle: "Délai de recrutement d'un opérateur (mois)", valeurs: [qte(x.personnel.delaiDeRecrutementEnMois)] },
          ],
        };
      },
      repere: () => "À rendre : la capacité, ce qu'il faudrait monter, ce qui reste pour la commande, et votre réponse.",
    },
    {
      id: "ce-qui-reste",
      type: "montants",
      titre: "Ce qui reste pour la commande",
      notions: ["capacity"],
      question: (c) => `Calculez la capacité de l'entreprise au trimestre, ce qu'il faudrait monter pour servir les clients habituels et la commande, puis les ${c.unites} de la commande que la ligne peut monter.`,
      champs: (c) => {
        const k = commandeExceptionnelle(c);
        return [
          { libelle: "Capacité de l'entreprise", attendu: k.t.capacite, calcul: `la plus petite de ${qte(k.t.capaciteOutil)} et ${qte(k.t.capaciteEquipe)} : ${qte(k.t.capacite)}`, tolerance: 0 },
          { libelle: "À monter pour servir tout le monde", attendu: k.aMonter, calcul: `${qte(k.t.demande)} + ${qte(k.enceintes)} = ${qte(k.aMonter)}`, tolerance: 0 },
          { libelle: "Commande que la ligne peut monter", attendu: k.livrable, calcul: `${qte(k.t.capacite)} − ${qte(k.t.demande)} = ${qte(k.livrable)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const k = commandeExceptionnelle(c);
        return [
          k.manque > 0
            ? `Il manquerait ${qte(k.manque)} ${c.unites} : la ligne ne peut monter que ${qte(k.livrable)} des ${qte(k.enceintes)} demandées, sans retarder les clients habituels.`
            : "La commande tient dans la capacité du trimestre.",
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Que répondez-vous à la direction ?",
      options: (c) => {
        const k = commandeExceptionnelle(c);
        const e = embaucheDuPremierJanvier(ficheDeNova(c));
        return [
          {
            texte: `En proposer ${qte(k.livrable)}, pas plus`,
            juste: k.verdict === "pas-en-entier",
            retour:
              k.verdict === "pas-en-entier"
                ? `Oui : la ligne peut monter ${qte(k.livrable)} ${c.unites} de la commande. Ce sont les postes qui limitent : un opérateur de plus n'y changerait rien.`
                : "Non : la commande tient en entier.",
          },
          { texte: "La livrer en entier", juste: k.verdict === "en-entier", retour: k.verdict === "en-entier" ? "Oui." : `Non : il manquerait ${qte(k.manque)} ${c.unites}, que la ligne ne peut pas monter dans le trimestre.` },
          {
            texte: "Recruter un opérateur et la livrer en entier",
            juste: false,
            retour: `Non : un opérateur arrive ${qte(e.delai)} mois après l'annonce, et surtout ce sont les postes qui limitent, pas l'équipe.`,
          },
        ];
      },
    },
  ],
};
