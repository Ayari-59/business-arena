import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { CAS_DES_80_POINTS, ENTREPRISES_DU_PROGRAMME, REGLE, bonDes80Points } from "../../monde/programme-de-fidelite-de-maille";
import { leProgramme } from "../../chapitres/automatiser-un-traitement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « AUTOMATISER UN TRAITEMENT » : UN BON DÈS 80 POINTS ? (Bac STMG, systèmes
 * d'information de gestion de terminale, palier 1).
 *
 * Le chapitre lisait, déroulait et testait le programme des bons ; le cas change la règle de gestion :
 * ce que coûte un bon dès 80 points, et ce qu'il faut modifier dans le programme. Hypothèses :
 * monde/programme-de-fidelite-de-maille.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const UN_BON_DES_80_POINTS: Situation = {
  code: "un-bon-des-80-points",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["automatiser-un-traitement"],
  commanditaire: "La gérante",
  titre: "Un bon dès 80 points ?",
  accroche: "La gérante voudrait offrir un bon plus tôt, dès 80 points. Que coûterait la règle nouvelle, et que faut-il changer dans le programme pour l'appliquer sans erreur ?",
  objectifs: ["Appliquer 2 règles de gestion à un jeu d'essai", "Chiffrer l'écart entre les 2 règles", "Adapter le programme au besoin nouveau"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_PROGRAMME, pourquoi: "le cas reprend le programme des bons de fidélité de MAILLE & CO." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la gérante",
      tableau: leProgramme,
      texte: () => {
        const p = CAS_DES_80_POINTS.pointsDesClientes.map(qte).join(", ");
        return [
          `« Je voudrais donner un bon de ${eur(REGLE.valeurDuBon)} tous les ${qte(CAS_DES_80_POINTS.pointsParBon)} points, au lieu de ${qte(REGLE.pointsParBon)}. Essayez sur 3 clientes sans carte « Privilège », qui ont ${p} points ce mois-ci. Et dites-moi ce qu'il faut changer au programme. » La gérante`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : les bons avec chaque règle, l'écart, et la modification du programme.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Les bons, avec chaque règle",
      question: () => "Calculez la valeur totale des bons des 3 clientes avec la règle actuelle, puis avec la règle des 80 points, et l'écart.",
      champs: () => {
        const k = bonDes80Points();
        const detail = (seuil: number) => k.pointsDesClientes.map((p) => `ent(${qte(p)} ÷ ${qte(seuil)})`).join(" + ");
        return [
          { libelle: "Bons avec la règle actuelle", attendu: k.a100, calcul: `(${detail(REGLE.pointsParBon)}) × ${eur(REGLE.valeurDuBon)} = ${eur(k.a100)}` },
          { libelle: "Bons avec la règle des 80 points", attendu: k.a80, calcul: `(${detail(CAS_DES_80_POINTS.pointsParBon)}) × ${eur(REGLE.valeurDuBon)} = ${eur(k.a80)}` },
          { libelle: "Écart", attendu: k.ecart, calcul: `${eur(k.a80)} − ${eur(k.a100)} = ${eur(k.ecart)}` },
        ];
      },
      explication: () => [`Sur ces 3 clientes, la règle nouvelle double les bons : ${eur(bonDes80Points().ecart)} de plus.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Que faut-il changer au programme ?",
      options: () => [
        { texte: "La seule ligne 2, puis refaire le jeu d'essai", juste: true, retour: `Oui : POINTS_PAR_BON est une constante, écrite une fois ; la passer à ${qte(CAS_DES_80_POINTS.pointsParBon)} change la règle partout. On refait le jeu d'essai avec les résultats attendus de la règle nouvelle, cas limites compris.` },
        { texte: `Chaque ligne où le nombre ${qte(REGLE.pointsParBon)} est écrit, sans rien tester ensuite`, juste: false, retour: "Non : le nombre n'est écrit qu'une fois, dans la constante. Et toute modification se teste." },
        { texte: "Tout réécrire, puisque la règle a changé", juste: false, retour: "Non : le programme est fait pour qu'une règle de gestion se modifie à un seul endroit." },
      ],
    },
  ],
};
