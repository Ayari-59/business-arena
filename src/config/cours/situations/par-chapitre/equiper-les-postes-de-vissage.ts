import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_SANTE, equiperLesPostes } from "../../monde/sante-et-securite-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « SANTÉ ET SÉCURITÉ AU TRAVAIL » : ÉQUIPER LES POSTES DE VISSAGE ? (Bac STMG,
 * ressources humaines et communication de terminale, palier 1).
 *
 * Le chapitre trouvait les jours d'arrêt qui paient une visseuse ; le cas chiffre l'équipement des deux
 * postes face à la tendinite de l'année, et rappelle l'obligation de sécurité. Hypothèses :
 * monde/sante-et-securite-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const EQUIPER_LES_POSTES_DE_VISSAGE: Situation = {
  code: "equiper-les-postes-de-vissage",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["sante-et-securite-au-travail"],
  commanditaire: "Le président",
  titre: "Équiper les postes de vissage ?",
  accroche: "Une tendinite a arrêté un opérateur pendant plus de deux semaines. Équiper les postes de vissage coûte cher : l'équipement se paie-t-il, et faut-il attendre qu'il se paie ?",
  objectifs: ["Chiffrer une action de prévention", "La comparer aux arrêts qu'elle évite", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_SANTE, pourquoi: "le cas reprend la ligne de NOVA et ses arrêts de l'année." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const k = equiperLesPostes();
        return [
          `« La tendinite du poste de vissage nous a coûté ${qte(k.jours)} jours d'arrêt, à ${eur(k.coutDUnJour)} le jour. Une visseuse ergonomique coûte ${eur(k.prix)}, et nous avons ${qte(k.postes)} postes. Le médecin du travail dit qu'équipés, ils éviteraient ces arrêts. Est-ce que cela vaut la dépense ? » Le président`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de l'équipement, ce qu'il évite, l'écart, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que coûte l'équipement, ce qu'il évite",
      question: () => "Calculez le coût des visseuses, ce que valent les jours d'arrêt évités, puis ce qu'il reste à NOVA.",
      champs: () => {
        const k = equiperLesPostes();
        return [
          { libelle: "Coût des visseuses", attendu: k.cout, calcul: `${qte(k.postes)} × ${eur(k.prix)} = ${eur(k.cout)}` },
          { libelle: "Arrêts évités", attendu: k.evites, calcul: `${qte(k.jours)} × ${eur(k.coutDUnJour)} = ${eur(k.evites)}` },
          { libelle: "Ce qu'il reste", attendu: k.gain, calcul: `${eur(k.evites)} − ${eur(k.cout)} = ${eur(k.gain)}` },
        ];
      },
      explication: () => [`Dès la première année, l'équipement laisse ${eur(equiperLesPostes().gain)} à NOVA.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = equiperLesPostes();
        return [
          {
            texte: "Équiper les deux postes, sans attendre",
            juste: true,
            retour: `Oui : l'équipement laisse ${eur(k.gain)} dès la première année. Et même s'il ne se payait pas, la loi demande de combattre le risque à la source : c'est l'obligation de sécurité de l'employeur, à inscrire dans le document unique.`,
          },
          {
            texte: "Attendre une deuxième tendinite, pour être sûr que le risque existe vraiment",
            juste: false,
            retour: "Non : le risque est connu et évalué. Attendre une nouvelle atteinte engagerait la responsabilité de NOVA.",
          },
          {
            texte: "Donner des bracelets de maintien du poignet aux opérateurs : c'est moins cher",
            juste: false,
            retour: "Non : une protection individuelle ne vient qu'après la suppression du risque à la source et la protection collective.",
          },
        ];
      },
    },
  ],
};
