import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { RESPONSABLE_DE_L_ECART, syntheseDesEcarts } from "../../chapitres/analyse-des-ecarts";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES ÉCARTS ET LEURS RESPONSABLES » (contrôle de gestion, palier 4).
 *
 * Le directeur de l'usine veut primer le chef d'atelier sur l'écart sur temps de la main-d'œuvre,
 * favorable. L'élève reprend le tableau de passage du chapitre (`syntheseDesEcarts`) et les
 * responsables de chaque écart (`RESPONSABLE_DE_L_ECART`) : l'écart sur temps, la somme des écarts
 * que l'atelier maîtrise, et ce que le reste des écarts ajoute. Les écarts sont des effets sur le
 * résultat : négatifs quand ils le font baisser.
 */

/** Le responsable que vise la prime, et l'écart sur lequel le directeur veut la calculer. */
export const RESPONSABLE_PRIME = "atelier";
export const ECART_DE_LA_PRIME = "Main-d'œuvre directe : écart sur temps";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

export function primeDuChefDAtelier() {
  const s = syntheseDesEcarts({ code: "nova" });
  const lignes = s.e.passage.filter((l) => RESPONSABLE_DE_L_ECART[l.poste] === RESPONSABLE_PRIME);
  const temps = s.e.passage.find((l) => l.poste === ECART_DE_LA_PRIME)!.effet;
  const partDeLAtelier = auCentime(lignes.reduce((t, l) => t + l.effet, 0));
  return { s, lignes, temps, partDeLAtelier, autres: auCentime(partDeLAtelier - temps) };
}

export const LA_PRIME_DU_CHEF_D_ATELIER: Situation = {
  code: "la-prime-du-chef-d-atelier",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["les-ecarts-et-leurs-responsables"],
  commanditaire: "Le directeur de l'usine",
  titre: "La prime du chef d'atelier",
  accroche: "Le directeur veut primer le chef d'atelier sur un écart favorable : ce que l'atelier maîtrise vraiment, écart par écart.",
  objectifs: ["Retrouver les écarts qu'un responsable maîtrise", "Faire la somme de sa part, chaque écart avec son signe", "Dire si une prime sur un seul écart est juste"],
  libre: false,
  entreprises: { codes: ["nova"], pourquoi: "ce cas reprend le tableau de passage de l'usine de NOVA, celui du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du directeur",
      texte: () => {
        const k = primeDuChefDAtelier();
        return [
          `« L'écart sur temps de la main-d'œuvre est favorable, ${eur(k.temps)} sur le résultat. Je veux primer le chef d'atelier sur ce chiffre. » Le directeur de l'usine`,
          `Pas de cours cette fois : l'atelier répond de ${k.lignes.length.toLocaleString("fr-FR")} écarts du tableau de passage. Un écart est un effet sur le résultat, négatif quand il le fait baisser.`,
        ];
      },
      repere: () => "À rendre : l'écart sur temps, la part de l'atelier, ce que ses autres écarts ajoutent, et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Ce que l'atelier maîtrise",
      notions: ["cost_variance"],
      question: () => "Calculez l'effet de l'écart sur temps sur le résultat, la part de l'atelier (la somme des écarts qu'il maîtrise), puis ce que ses autres écarts ajoutent. Négatif pour un effet défavorable.",
      champs: () => {
        const k = primeDuChefDAtelier();
        return [
          { libelle: "Écart sur temps", attendu: k.temps, calcul: `${eur(k.temps)}, au tableau de passage` },
          { libelle: "Part de l'atelier", attendu: k.partDeLAtelier, calcul: `${k.lignes.map((l) => eur(l.effet)).join(" + ")} = ${eur(k.partDeLAtelier)}` },
          { libelle: "Ses autres écarts", attendu: k.autres, calcul: `${eur(k.partDeLAtelier)} − ${eur(k.temps)} = ${eur(k.autres)}` },
        ];
      },
      explication: () => {
        const k = primeDuChefDAtelier();
        return [`L'atelier gagne ${eur(k.temps)} sur le temps et perd ${eur(-k.autres)} sur la matière et le rendement du centre : sa part est de ${eur(k.partDeLAtelier)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur",
      question: () => "Que répondez-vous au directeur de l'usine ?",
      options: () => {
        const k = primeDuChefDAtelier();
        return [
          {
            texte: `Pas sur ce seul écart : sa part est de ${eur(k.partDeLAtelier)}`,
            juste: k.partDeLAtelier < 0,
            retour: "Oui : primer un seul écart pousse à le gagner aux dépens des autres. On gagne du temps en gaspillant de la matière, ou en faisant tourner les machines plus longtemps.",
          },
          {
            texte: "Oui : l'écart sur temps est favorable, et c'est l'atelier qui le maîtrise, la prime est donc méritée",
            juste: false,
            retour: `Non : l'atelier maîtrise aussi la quantité de matière et le rendement du centre, et ses écarts y coûtent ${eur(-k.autres)}.`,
          },
          {
            texte: "Non : un chef d'atelier ne se juge pas aux écarts, seul le résultat de l'usine compte pour lui",
            juste: false,
            retour: "Non : le résultat mêle des écarts que l'atelier ne maîtrise pas, comme le prix de vente ou le prix du kilo. On le juge sur ses écarts à lui, tous.",
          },
        ];
      },
    },
  ],
};
