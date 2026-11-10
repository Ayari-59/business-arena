import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_RESSOURCES, remplacement } from "../../monde/ressources-et-gpec-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES RESSOURCES POUR PRODUIRE » : UN REMPLACEMENT DE 4 MOIS (Bac STMG,
 * enseignement commun de terminale, palier 1).
 *
 * Le chapitre rangeait les formes de relation de travail ; le cas en chiffre deux pour le même besoin :
 * un CDD de remplacement ou un intérimaire. Hypothèses : monde/ressources-et-gpec-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const UN_REMPLACEMENT_DE_4_MOIS: Situation = {
  code: "un-remplacement-de-4-mois",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["les-ressources-pour-produire"],
  commanditaire: "Le président",
  titre: "Un remplacement de 4 mois : CDD ou intérim ?",
  accroche: "Un opérateur part en congé pour 4 mois. Faut-il recruter un remplaçant en CDD, ou appeler une agence d'intérim ?",
  objectifs: ["Chiffrer deux formes de relation de travail", "Comparer leur coût et leur souplesse", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_RESSOURCES, pourquoi: "le cas reprend l'équipe de montage de NOVA et son coût." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const r = remplacement();
        return [
          `« Un opérateur part en congé pour ${qte(r.mois)} mois. Un CDD de remplacement nous coûterait ${eur(r.mensuel)} par mois, cotisations comprises, plus ${eur(r.recrutement)} pour le recruter. L'agence d'intérim facture ${qte(r.coefficient)} fois le salaire brut de ${eur(r.brut)}, chaque mois, et nous envoie quelqu'un en 2 jours. Que choisir ? » Le président`,
          "Pas de cours cette fois : les calculs et les formes de contrat sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de chaque solution, l'écart, et votre réponse.",
    },
    {
      id: "les-couts",
      type: "montants",
      titre: "Ce que coûte chaque solution",
      question: () => "Calculez le coût du CDD sur la durée du congé (recrutement compris), celui de l'intérim, puis l'écart (intérim moins CDD).",
      champs: () => {
        const r = remplacement();
        return [
          { libelle: "Coût du CDD", attendu: r.cdd, calcul: `${qte(r.mois)} × ${eur(r.mensuel)} + ${eur(r.recrutement)} = ${eur(r.cdd)}` },
          { libelle: "Coût de l'intérim", attendu: r.interim, calcul: `${qte(r.mois)} × ${qte(r.coefficient)} × ${eur(r.brut)} = ${eur(r.interim)}` },
          { libelle: "Écart", attendu: r.ecart, calcul: `${eur(r.interim)} − ${eur(r.cdd)} = ${eur(r.ecart)}` },
        ];
      },
      explication: () => {
        const r = remplacement();
        return [`L'intérim coûte ${eur(r.ecart)} de plus. Il paie la rapidité et la souplesse : l'agence recrute, remplace si la personne ne convient pas, et le contrat s'arrête au retour du salarié.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président, sachant que le congé est connu 2 mois à l'avance ?",
      options: () => {
        const r = remplacement();
        return [
          {
            texte: `Le CDD : prévu à temps, il coûte ${eur(r.ecart)} de moins`,
            juste: true,
            retour: `Oui : le congé est connu assez tôt pour recruter. Le CDD de remplacement coûte ${eur(r.cdd)} contre ${eur(r.interim)}. L'intérim se justifierait pour une absence imprévue.`,
          },
          {
            texte: "L'intérim, parce qu'une agence est toujours moins chère qu'un recrutement",
            juste: false,
            retour: `Non : l'agence facture ${qte(r.coefficient)} fois le brut ; sur ${qte(r.mois)} mois, cela dépasse le coût du CDD et de son recrutement.`,
          },
          {
            texte: "Un CDI, pour garder la personne après le retour du salarié",
            juste: false,
            retour: "Non : le besoin est limité au congé. Un CDI laisserait un opérateur de trop au retour du salarié.",
          },
        ];
      },
    },
  ],
};
