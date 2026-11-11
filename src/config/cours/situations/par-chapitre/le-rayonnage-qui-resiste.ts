import { nombreAuCentieme } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_REIMPLANTATION, reimplantationDeLaBoutique, tableauDesTaches } from "../../chapitres/reimplanter-avant-les-soldes";
import { RETARD_DU_RAYONNAGE, TACHES, heureDe, planningDeGantt, reseauAvecLaDuree } from "../../monde/reimplantation";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RÉIMPLANTER AVANT LES SOLDES » : LE RAYONNAGE QUI RÉSISTE (BTS MCO,
 * palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les tâches de la réimplantation de MAILLE & CO
 * (monde/reimplantation.ts). À 7 h 30, une fixation grippée fait durer le déplacement du rayonnage
 * (tâche B) 30 minutes de plus (`RETARD_DU_RAYONNAGE`). L'élève refait le réseau : la nouvelle fin, le
 * retard à l'ouverture, ce que devient la marge de la vitrine ; puis il choisit la réponse. Le piège :
 * renforcer une tâche qui n'est pas critique, ou croire que le retard se rattrape ailleurs.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les minutes du réseau sont des quantités, entières, déclarées
 * comme telles.
 */

const qte = nombreAuCentieme;
const mn = (n: number) => `${qte(n)} min`;
const duree = (code: string) => TACHES.find((t) => t.code === code)!.duree;

/** Les chiffres de la réponse. */
export function rayonnageQuiResiste(c: Pick<Cas, "code">) {
  const x = reimplantationDeLaBoutique(c);
  const b = TACHES.find((t) => t.code === "B")!;
  const duree = b.duree + RETARD_DU_RAYONNAGE;
  const r = reseauAvecLaDuree("B", duree);
  const gantt = planningDeGantt(x.gantt4.personnes, TACHES.map((t) => (t.code === "B" ? { ...t, duree } : t)));
  const ligne = (code: string) => r.lignes.find((l) => l.code === code)!;
  return { ...x, duree, r, gantt, retard: gantt.fin - x.minutesAvantLOuverture, d: ligne("D"), h: ligne("H") };
}

export const LE_RAYONNAGE_QUI_RESISTE: Situation = {
  code: "le-rayonnage-qui-resiste",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["reimplanter-avant-les-soldes"],
  commanditaire: "La manager",
  titre: "Le rayonnage qui résiste",
  accroche: "À 7 h 30, une fixation grippée : le rayonnage des accessoires prendra 30 minutes de plus. La boutique ouvrira-t-elle à l'heure, et que faire ?",
  objectifs: [
    "Recalculer un réseau PERT quand une tâche prend du retard",
    "Mesurer le retard à l'ouverture et la marge qui reste aux autres tâches",
    "Choisir la réponse qui agit sur le chemin critique",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_REIMPLANTATION, pourquoi: "ce cas reprend la réimplantation du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "L'appel de la manager",
      tableau: tableauDesTaches,
      texte: (c) => {
        const x = rayonnageQuiResiste(c);
        return [
          `« Il est 7 h 30, nous sommes ${qte(x.gantt4.personnes)}. Une fixation est grippée : déplacer le rayonnage des accessoires prendra ${mn(x.duree)} au lieu de ${mn(x.duree - RETARD_DU_RAYONNAGE)}. Ouvrons-nous à ${x.ouverture} h ? Sinon, que faisons-nous ? »`,
          "Pas de cours cette fois : vous avez les tâches de la réimplantation, et la méthode est celle du chapitre.",
        ];
      },
      repere: () => "À rendre : le nouveau début au plus tôt du remontage, la nouvelle fin, le retard à l'ouverture, la marge totale de la vitrine, et votre réponse.",
    },
    {
      id: "le-nouveau-reseau",
      objectifs: [0, 1],
      type: "montants",
      titre: "Le réseau, refait",
      notions: ["capacity", "productivity"],
      tableau: tableauDesTaches,
      question: () =>
        "Avec la nouvelle durée du déplacement du rayonnage, calculez, en minutes depuis 7 h, le début au plus tôt du remontage (D), la fin de la réimplantation, le retard à l'ouverture, puis la marge totale de la vitrine (H).",
      champs: (c) => {
        const x = rayonnageQuiResiste(c);
        const i = x.r.lignes.find((l) => l.code === "I")!;
        return [
          { libelle: "Début au plus tôt du remontage (min)", nature: "quantite", attendu: x.d.debutAuPlusTot, calcul: `${mn(duree("A"))} (fin de la tâche A) + ${mn(x.duree)} (B) = ${mn(x.d.debutAuPlusTot)}, plus tard que la fin du nettoyage` },
          { libelle: "Fin de la réimplantation (min)", nature: "quantite", attendu: x.gantt.fin, calcul: `${mn(x.d.debutAuPlusTot)} + ${mn(duree("D"))} (D) + ${mn(duree("F"))} (F) + ${mn(duree("I"))} (I) = ${mn(x.gantt.fin)}, soit ${heureDe(x.gantt.fin)}` },
          { libelle: "Retard à l'ouverture (min)", nature: "quantite", attendu: x.retard, calcul: `${mn(x.gantt.fin)} − ${mn(x.minutesAvantLOuverture)} = ${mn(x.retard)}` },
          { libelle: "Marge totale de la vitrine (min)", nature: "quantite", attendu: x.h.margeTotale, calcul: `${mn(i.debutAuPlusTard)} (début au plus tard du contrôle) − ${mn(duree("H"))} − ${mn(x.h.debutAuPlusTot)} = ${mn(x.h.margeTotale)}` },
        ];
      },
      explication: (c) => {
        const x = rayonnageQuiResiste(c);
        return [`Le déplacement du rayonnage est sur le chemin critique : ses ${mn(RETARD_DU_RAYONNAGE)} de plus repoussent la fin à ${heureDe(x.gantt.fin)}, ${mn(x.retard)} après l'ouverture. La vitrine, elle, gagne de la marge : ${mn(x.h.margeTotale)}.`];
      },
    },
    {
      id: "ou-agir",
      objectifs: [2],
      type: "choix",
      titre: "Où agir ?",
      notions: ["capacity"],
      question: () => "Pour rattraper le retard, sur quoi faut-il agir ?",
      options: (c) => {
        const x = rayonnageQuiResiste(c);
        return [
          { texte: "Sur le chemin critique", juste: x.r.critique.includes("F"), retour: `Oui. Le chemin critique reste ${x.r.critique.join(", ")} ; seul un gain sur l'une de ses tâches rapproche la fin.` },
          { texte: "Sur la vitrine : la faire plus vite", juste: false, retour: `Non : la vitrine a ${mn(x.h.margeTotale)} de marge ; la faire plus vite ne change pas la fin.` },
          { texte: "Sur les étiquettes : les commencer plus tôt", juste: false, retour: "Non : les étiquettes ne sont pas sur le chemin critique ; elles ont déjà de la marge." },
        ];
      },
    },
    {
      id: "reponse",
      objectifs: [2],
      type: "choix",
      titre: "Votre réponse à la manager",
      question: () => "Que répondez-vous à la manager ?",
      options: (c) => {
        const x = rayonnageQuiResiste(c);
        return [
          {
            texte: `Ouvrir à ${x.ouverture} h, les accessoires ${mn(x.retard)} après`,
            juste: true,
            retour: `Oui. Le retard est sur le chemin critique et ne se rattrape pas ailleurs : la vitrine, les étiquettes et la signalétique ont de la marge, pas le rayonnage. On ouvre à l'heure le rayon maille, déjà prêt, et on finit les accessoires dans les ${mn(x.retard)} qui suivent ; la vitrine peut attendre, elle a ${mn(x.h.margeTotale)} de marge.`,
          },
          {
            texte: "Mettre une personne de plus sur la vitrine",
            juste: false,
            retour: `Non : la vitrine a ${mn(x.h.margeTotale)} de marge ; la renforcer ne rapproche pas la fin d'une minute.`,
          },
          {
            texte: "Rien : le retard se rattrapera sur les autres tâches",
            juste: false,
            retour: `Non : les tâches qui suivent le rayonnage sont toutes critiques ; sans rien changer, la boutique ouvre à ${heureDe(x.gantt.fin)}.`,
          },
        ];
      },
    },
  ],
};
