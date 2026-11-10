import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_CLIENT_NUMERIQUE, SITE_DE_MAILLE, discussionEnLigne, margeDUnPanier } from "../../monde/client-numerique-de-maille";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE CLIENT À L'ÈRE NUMÉRIQUE » : UN CONSEILLER EN LIGNE ? (Bac STMG,
 * enseignement commun de terminale, palier 1).
 *
 * Le chapitre relançait les paniers abandonnés ; le cas lève un frein (la peur de se tromper de taille)
 * par un outil de la relation digitalisée, la discussion en ligne. Hypothèses :
 * monde/client-numerique-de-maille.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const UN_CONSEILLER_EN_LIGNE: Situation = {
  code: "un-conseiller-en-ligne",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["le-client-a-l-ere-numerique"],
  commanditaire: "La gérante",
  titre: "Un conseiller en ligne ?",
  accroche: "Beaucoup de clientes abandonnent leur panier par peur de se tromper de taille. Une discussion en ligne avec une vendeuse vaut-elle son coût ?",
  objectifs: ["Chiffrer un outil de la relation client digitalisée", "Relier un outil à un frein d'achat", "Répondre à la gérante, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_CLIENT_NUMERIQUE, pourquoi: "le cas reprend le site de MAILLE & CO et ses clientes." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la gérante",
      texte: () => {
        const d = discussionEnLigne();
        return [
          `« Sur ${qte(SITE_DE_MAILLE.visites)} visites, nous n'avons que ${qte(d.avant)} commandes par mois. Les clientes nous écrivent qu'elles ont peur de se tromper de taille. Un service de discussion en ligne, tenu par une vendeuse, coûterait ${eur(d.coutParMois)} par mois ; le prestataire nous promet ${qte(d.commandesApres)} commandes. Une commande nous laisse ${eur(margeDUnPanier())} de marge. Faut-il le prendre ? » La gérante`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : les commandes en plus, leur marge, le gain du mois et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que vaut la discussion en ligne",
      question: () => "Calculez les commandes en plus chaque mois, la marge qu'elles laissent, puis le gain du mois une fois le service payé.",
      champs: () => {
        const d = discussionEnLigne();
        return [
          { libelle: "Commandes en plus", attendu: d.enPlus, calcul: `${qte(d.commandesApres)} − ${qte(d.avant)} = ${qte(d.enPlus)}`, tolerance: 0 },
          { libelle: "Marge des commandes en plus", attendu: d.marge, calcul: `${qte(d.enPlus)} × ${eur(margeDUnPanier())} = ${eur(d.marge)}` },
          { libelle: "Gain du mois", attendu: d.gain, calcul: `${eur(d.marge)} − ${eur(d.coutParMois)} = ${eur(d.gain)}` },
        ];
      },
      explication: () => {
        const d = discussionEnLigne();
        return [`Le service laisse ${eur(d.gain)} par mois, et le taux de transformation passerait à ${pct(d.transformationApresPct)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Que répondez-vous à la gérante ?",
      options: () => {
        const d = discussionEnLigne();
        return [
          {
            texte: `L'essayer : il lève un frein et laisse ${eur(d.gain)} par mois`,
            juste: true,
            retour: "Oui : le conseil en ligne répond à la peur de se tromper de taille, un frein que les clientes ont dit. Il faut vérifier après quelques mois que les commandes promises arrivent bien.",
          },
          {
            texte: "Le refuser : le numérique doit remplacer les vendeuses, pas les occuper",
            juste: false,
            retour: "Non : ici, le numérique prolonge le conseil de la vendeuse en ligne. La relation digitalisée n'exclut pas l'humain.",
          },
          {
            texte: "Baisser plutôt les prix de 20 %, pour vendre plus en ligne",
            juste: false,
            retour: "Non : le frein n'est pas le prix, c'est la taille. Une baisse de prix coûterait de la marge sans lever la crainte des clientes.",
          },
        ];
      },
    },
  ],
};
