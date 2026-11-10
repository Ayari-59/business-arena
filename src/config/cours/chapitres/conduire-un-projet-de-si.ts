import { eur, pct, qte } from "../../../pedagogy/cours/deux-decimales";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import {
  ENTREPRISES_DU_PROJET,
  INTEGRATEUR,
  PARAMETRAGE_REEL,
  TACHES,
  ecartDuBudget,
  finAvecUnRetardDeLaReprise,
  marge,
  planning,
  tachesCritiques,
} from "../monde/projet-pgi-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : CONDUIRE UN PROJET DE SYSTÈME D'INFORMATION, PLANNING, JALONS, COÛT ET RECETTE (Bac STMG,
 * enseignement spécifique de systèmes d'information de gestion de terminale, thème 2, question 2.2 :
 * « En quoi un projet de système d'information est-il une réponse au besoin d'évolution de
 * l'organisation ? »).
 *
 * Les acteurs du projet (maîtrise d'ouvrage, maîtrise d'œuvre, pilotage) ; ses phases et ses jalons ; la
 * planification au plus tôt, à compléter, les tâches critiques et la marge d'une tâche, éprouvée au
 * laboratoire ; le pilotage du coût et son écart ; les contraintes de délai, de coût et de qualité ; la
 * conduite classique et la conduite agile, la synchronisation et la coopération ; la recette.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA, qui met en place le PGI en nuage de « Le processus
 * et le PGI » : monde/projet-pgi-de-nova.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : l'écart en pourcentage du prévu se donne à deux décimales, à un
 * centième près (au dixième, avant).
 */

const jours = (n: number) => `${qte(n)} jour${Math.abs(n) >= 2 ? "s" : ""}`;
const lettreDe = (code: string) => TACHES.find((t) => t.code === code)!.lettre;

const tableDesTaches = (): TableauDeDonnees => ({
  titre: "Les tâches du projet",
  colonnes: ["Tâche", "Durée", "Après"],
  lignes: TACHES.map((t) => ({ libelle: t.lettre, valeurs: [t.libelle, jours(t.duree), t.apres.length ? t.apres.map(lettreDe).join(" et ") : "Rien"] })),
});

function planningACompleter(): TableauACompleter {
  const p = planning();
  return {
    titre: "Le planning au plus tôt, en jours depuis le lancement",
    colonnes: ["Durée", "Début au plus tôt", "Fin au plus tôt"],
    lignes: p.lignes.map((l, i) => ({
      libelle: `${l.lettre} · ${l.libelle}`,
      cellules: [
        { valeur: l.duree, unite: "jours", horsTotal: true },
        i === 0
          ? { valeur: l.debut, unite: "jours", horsTotal: true }
          : { valeur: l.debut, saisir: true, unite: "jours", horsTotal: true, calcul: l.apres.length > 1 ? `La plus tardive des fins des tâches ${l.apres.map(lettreDe).join(" et ")} : ${qte(l.debut)}` : `La fin de la tâche ${lettreDe(l.apres[0]!)} : ${qte(l.debut)}`, indice: "Une tâche commence quand toutes celles qui la précèdent sont finies : la plus tardive de leurs fins." },
        i === 0
          ? { valeur: l.fin, unite: "jours", horsTotal: true }
          : { valeur: l.fin, saisir: true, unite: "jours", horsTotal: true, calcul: `${qte(l.debut)} + ${qte(l.duree)} = ${qte(l.fin)}`, indice: "Le début, plus la durée." },
      ],
    })),
  };
}

export const CONDUIRE_UN_PROJET_DE_SI: Chapitre = {
  code: "conduire-un-projet-de-si",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 2 · Management du système d'information et performance"],
  titre: "Conduire un projet de système d'information : planning, jalons, coût et recette",
  accroche:
    "NOVA met en place son PGI : qui commande, qui réalise, dans quel ordre, en combien de jours, pour quel coût. Les tâches qui ne peuvent pas attendre, celles qui le peuvent, et la recette qui dit si le projet est fini.",
  objectifs: [
    "Distinguer les acteurs d'un projet de système d'information",
    "Planifier un projet : ses phases, ses jalons, ses tâches",
    "Repérer les tâches critiques et la marge d'une tâche",
    "Mesurer l'écart de coût d'un projet et y répondre",
    "Comparer la conduite classique et la conduite agile",
    "Organiser la recette",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_PROJET, pourquoi: "ce chapitre suit le projet de PGI de NOVA." },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un projet pour un besoin",
      tableau: tableDesTaches,
      texte: (c) => [
        `Chez ${c.entreprise}, la commande se ressaisit d'un service à l'autre. Le président a décidé de passer à un PGI en nuage, une base unique. Ce changement ne se fait pas en un jour : c'est un projet, avec un but, un début, une fin, un budget et des acteurs.`,
        `Le projet compte ${qte(TACHES.length)} tâches. Une tâche commence quand toutes celles qu'elle suit sont finies.`,
      ],
      repere: () => "Un projet de système d'information répond à un besoin d'évolution : un but, des tâches, des délais, un coût, des acteurs.",
    },
    {
      id: "les-acteurs",
      objectifs: [0],
      type: "tri",
      titre: "Qui commande, qui réalise ?",
      question: () => "Rangez chaque acteur du projet.",
      categories: [
        { code: "moa", libelle: "Maîtrise d'ouvrage" },
        { code: "moe", libelle: "Maîtrise d'œuvre" },
      ],
      elements: () => [
        { libelle: "Le président, qui décide du projet et le finance", montant: 0, categorie: "moa", pourquoi: "Il exprime le besoin et valide le résultat : la maîtrise d'ouvrage." },
        { libelle: "Les opérateurs, futurs utilisateurs du PGI", montant: 0, categorie: "moa", pourquoi: "Ils disent ce dont ils ont besoin et font la recette : du côté de la maîtrise d'ouvrage." },
        { libelle: "L'intégrateur, qui paramètre le PGI", montant: 0, categorie: "moe", pourquoi: "Il réalise la solution : la maîtrise d'œuvre." },
        { libelle: "L'éditeur, qui fournit le progiciel", montant: 0, categorie: "moe", pourquoi: "Il fournit la technique : la maîtrise d'œuvre aussi." },
      ],
      relance: "L'acteur exprime-t-il le besoin, ou réalise-t-il la solution ?",
      explication: () => ["Le chef de projet coordonne les deux ; un comité de pilotage, où siège le président, prend les grandes décisions aux jalons."],
    },
    {
      id: "phases-et-jalons",
      type: "lecture",
      titre: "Des phases et des jalons",
      texte: () => [
        "Un projet se découpe en phases : l'étude des besoins, la conception et le paramétrage, la réalisation, la recette, le déploiement, puis le bilan. Entre deux phases, un jalon : un point de contrôle où l'on vérifie ce qui est fait avant de continuer.",
        "Le projet est tenu par 3 contraintes, qui se répondent : le délai, le coût et la qualité. Gagner sur l'une coûte souvent sur une autre.",
      ],
      repere: () => "Phases · jalons, des points de décision · le délai, le coût, la qualité.",
    },
    {
      id: "un-jalon",
      objectifs: [1],
      type: "choix",
      titre: "Un jalon",
      question: () => "Lequel de ces moments est un jalon du projet ?",
      options: () => [
        { texte: "La signature du procès-verbal de recette", juste: true, retour: "Oui : un moment daté où le président vérifie et décide de passer au démarrage. Un jalon marque la fin d'une phase." },
        { texte: "Chaque journée de paramétrage de l'intégrateur, du matin au soir", juste: false, retour: "Non : c'est du travail en cours, pas un point de décision." },
        { texte: "Le choix de la couleur des écrans", juste: false, retour: "Non : un détail du paramétrage, pas un point de passage du projet." },
      ],
    },
    {
      id: "le-planning",
      objectifs: [1],
      type: "a-completer",
      titre: "Le planning au plus tôt",
      tableau: tableDesTaches,
      question: () => "Complétez le planning : pour chaque tâche, son début au plus tôt (la plus tardive des fins des tâches qu'elle suit) et sa fin au plus tôt (son début plus sa durée), en jours depuis le lancement. La tâche A est donnée.",
      grille: () => planningACompleter(),
      explication: () => [`Le projet finit au plus tôt à la fin du jour ${qte(planning().fin)}. La recette attend le paramétrage et la reprise des données : c'est le paramétrage, le plus long, qui fixe son début.`],
    },
    {
      id: "le-chemin-critique",
      objectifs: [2],
      type: "choix",
      titre: "Les tâches critiques",
      tableau: tableDesTaches,
      question: () => "Une tâche est critique si le moindre retard sur elle retarde tout le projet. Lesquelles le sont ?",
      options: () => [
        { texte: tachesCritiques().map((t) => t.lettre).join(", ").replace(/, (?=[^,]+$)/, " et "), juste: true, retour: `Oui : elles se suivent sans attente, du début à la fin du projet. La reprise des données a ${jours(marge("reprise"))} de marge, la formation ${jours(marge("formation"))}.` },
        { texte: "Toutes : chaque tâche du projet est critique", juste: false, retour: "Non : la reprise et la formation peuvent glisser un peu sans retarder le démarrage." },
        { texte: "A, B, D, F et G", juste: false, retour: "Non : la reprise des données finit avant le paramétrage. C'est le paramétrage qui fait attendre la recette." },
      ],
    },
    {
      id: "la-marge",
      objectifs: [2],
      type: "simulation",
      titre: "Ce que la reprise peut perdre",
      question: () => "La reprise des données (la tâche D) pourrait prendre du retard : les fiches des clients sont mal tenues. Faites varier son retard et regardez la fin du projet.",
      leviers: () => [{ code: "retard", libelle: "Retard de la reprise des données", unite: "jours", min: 0, max: 12, pas: 1, depart: 0 }],
      lecture: (_c, p) => {
        const r = p.retard ?? 0;
        const base = planning();
        const reprise = base.lignes.find((l) => l.code === "reprise")!;
        const parametrage = base.lignes.find((l) => l.code === "parametrage")!;
        return [
          { libelle: "Fin de la reprise des données", montant: reprise.fin + r, unite: "jours", reference: reprise.fin },
          { libelle: "Fin du paramétrage", montant: parametrage.fin, unite: "jours" },
          { libelle: "Fin du projet", montant: finAvecUnRetardDeLaReprise(r), unite: "jours", reference: base.fin, fort: true },
        ];
      },
      defi: () => {
        const base = planning().fin;
        const tient = (r: number) => finAvecUnRetardDeLaReprise(r) === base;
        return {
          consigne: "Trouvez le plus grand retard de la reprise qui ne retarde pas la fin du projet.",
          atteint: (p) => tient(p.retard ?? 0) && !tient((p.retard ?? 0) + 1),
          indice: (p) => (tient(p.retard ?? 0) ? "Le projet finit encore à l'heure : la reprise peut-elle perdre un jour de plus ?" : "Trop loin : le projet finit plus tard. Revenez en arrière."),
          solution: { retard: marge("reprise") },
        };
      },
      montrer: "Montrer la marge",
      explication: () => [`La reprise peut perdre ${jours(marge("reprise"))} sans rien retarder : c'est sa marge. Au-delà, elle devient critique et chaque jour de plus retarde le démarrage. Une tâche critique, elle, n'a aucune marge.`],
    },
    {
      id: "l-ecart-de-cout",
      objectifs: [3],
      type: "montants",
      titre: "Le coût, prévu et réel",
      question: () => {
        const k = ecartDuBudget();
        return `L'intégrateur facture ${eur(INTEGRATEUR.parJour)} la journée. Il devait passer ${jours(k.joursPrevus)} chez NOVA (le paramétrage, la reprise, la formation). Le paramétrage a pris ${jours(PARAMETRAGE_REEL)} au lieu de ${jours(TACHES.find((t) => t.code === "parametrage")!.duree)}. Calculez le coût prévu, le coût réel, l'écart, et l'écart en pourcentage du prévu, au dixième.`;
      },
      champs: () => {
        const k = ecartDuBudget();
        return [
          { libelle: "Coût prévu", attendu: k.prevu, calcul: `${qte(k.joursPrevus)} × ${eur(INTEGRATEUR.parJour)} = ${eur(k.prevu)}` },
          { libelle: "Coût réel", attendu: k.reel, calcul: `${qte(k.joursReels)} × ${eur(INTEGRATEUR.parJour)} = ${eur(k.reel)}` },
          { libelle: "Écart", attendu: k.ecart, calcul: `${eur(k.reel)} − ${eur(k.prevu)} = ${eur(k.ecart)}` },
          { libelle: "Écart en % du prévu", attendu: k.ecartPct, calcul: `${eur(k.ecart)} ÷ ${eur(k.prevu)} × 100 = ${pct(k.ecartPct)}` },
        ];
      },
      explication: () => {
        const k = ecartDuBudget();
        return [`Le projet coûte ${eur(k.ecart)} de plus que prévu. Et le paramétrage est critique : le démarrage passe du jour ${qte(planning().fin)} au jour ${qte(k.finReelle)}. Piloter un projet, c'est comparer chaque semaine le consommé au prévu.`];
      },
    },
    {
      id: "les-contraintes",
      objectifs: [3],
      type: "choix",
      titre: "Le délai, le coût ou la qualité",
      question: () => "Pour rattraper le retard du paramétrage, l'intégrateur propose de raccourcir la recette de moitié. Qu'en dit le président ?",
      options: () => [
        { texte: "Non : la recette protège la qualité, le délai glissera", juste: true, retour: "Oui : sauter des tests, c'est gagner du délai en prenant le risque de démarrer avec des erreurs. Le président préfère annoncer un démarrage décalé." },
        { texte: "Oui : un projet doit toujours finir à la date prévue, quoi qu'il arrive", juste: false, retour: "Non : le délai n'est qu'une des 3 contraintes. Un PGI qui facture mal coûterait bien plus que quelques jours." },
        { texte: "Oui, et il supprime aussi la formation", juste: false, retour: "Non : des utilisateurs non formés font des erreurs, et la qualité s'effondre." },
      ],
    },
    {
      id: "agile-ou-classique",
      objectifs: [4],
      type: "tri",
      titre: "Deux façons de conduire un projet",
      question: () => "Rangez chaque pratique.",
      categories: [
        { code: "classique", libelle: "Conduite classique, par étapes" },
        { code: "agile", libelle: "Conduite agile" },
      ],
      elements: () => [
        { libelle: "Tout le besoin est écrit et figé au départ", montant: 0, categorie: "classique", pourquoi: "Le cahier des charges complet, puis la réalisation : la conduite classique." },
        { libelle: "Une seule recette, à la fin", montant: 0, categorie: "classique", pourquoi: "On ne teste que ce qui est entièrement fini." },
        { libelle: "Une version utilisable livrée toutes les 2 semaines", montant: 0, categorie: "agile", pourquoi: "Des itérations courtes : la conduite agile." },
        { libelle: "Les utilisateurs revoient les priorités à chaque itération", montant: 0, categorie: "agile", pourquoi: "Le besoin s'ajuste en route, avec eux." },
      ],
      relance: "Le besoin est-il figé au départ, ou ajusté à chaque livraison ?",
      explication: () => ["La conduite agile convient quand le besoin est flou ou change vite ; la conduite classique, quand il est stable et bien connu."],
    },
    {
      id: "cooperer",
      objectifs: [4],
      type: "choix",
      titre: "Se synchroniser",
      question: () => "Le président, les opérateurs et l'intégrateur ne sont jamais au même endroit. Comment synchroniser leur travail ?",
      options: () => [
        { texte: "Un tableau des tâches partagé, et un point court chaque semaine", juste: true, retour: "Oui : chacun voit qui fait quoi et ce qui bloque ; le point hebdomadaire règle les décisions. La coopération passe par des outils et des rendez-vous." },
        { texte: "Chacun avance de son côté et l'on se retrouve à la fin du projet", juste: false, retour: "Non : sans synchronisation, les tâches liées se bloquent sans que personne ne le voie." },
        { texte: "Des courriels envoyés à tout le monde", juste: false, retour: "Non : l'information s'y perd, et rien n'y montre l'état des tâches." },
      ],
    },
    {
      id: "la-recette",
      type: "lecture",
      titre: "La recette",
      texte: () => [
        "La recette vérifie que le PGI fait ce qui a été demandé. Les utilisateurs déroulent des scénarios de test (passer une commande, la facturer, la retrouver) et notent chaque anomalie.",
        "Une anomalie bloquante empêche de travailler : le démarrage attend sa correction. Une anomalie mineure gêne sans empêcher : la recette peut être prononcée avec des réserves, à lever ensuite. Le procès-verbal de recette, signé par la maîtrise d'ouvrage, clôt la phase.",
      ],
      repere: () => "Recette : des scénarios de test, des anomalies bloquantes ou mineures, des réserves, un procès-verbal.",
    },
    {
      id: "les-anomalies",
      objectifs: [5],
      type: "tri",
      titre: "Bloquante ou mineure ?",
      question: () => "Rangez chaque anomalie notée pendant la recette.",
      categories: [
        { code: "bloquante", libelle: "Bloquante" },
        { code: "mineure", libelle: "Mineure" },
      ],
      elements: () => [
        { libelle: "La facture applique un taux de TVA faux", montant: 0, categorie: "bloquante", pourquoi: "Chaque facture serait fausse : on ne démarre pas ainsi." },
        { libelle: "Impossible d'enregistrer la commande d'un nouveau client", montant: 0, categorie: "bloquante", pourquoi: "Le processus s'arrête : bloquante." },
        { libelle: "Un intitulé de menu mal orthographié", montant: 0, categorie: "mineure", pourquoi: "Gênant, sans empêcher de travailler." },
        { libelle: "Le logo de NOVA un peu flou sur les factures", montant: 0, categorie: "mineure", pourquoi: "Une réserve, à lever après le démarrage." },
      ],
      relance: "Peut-on travailler malgré l'anomalie ?",
      explication: () => ["Le tri des anomalies dit si le projet peut démarrer. Toutes se corrigent ; seules les bloquantes font attendre."],
    },
    {
      id: "prononcer-la-recette",
      objectifs: [5],
      type: "choix",
      titre: "Le procès-verbal",
      question: () => "La recette a relevé les 4 anomalies. Que fait le président ?",
      options: () => [
        { texte: "Il attend la correction des 2 anomalies bloquantes", juste: true, retour: "Oui : il ne signe le procès-verbal qu'une fois la TVA et les commandes corrigées et testées de nouveau. Les 2 anomalies mineures seront des réserves." },
        { texte: "Il signe tout de suite : les anomalies se corrigeront bien un jour", juste: false, retour: "Non : démarrer avec des factures fausses coûterait cher, et l'intégrateur n'aurait plus de raison de se presser." },
        { texte: "Il refuse tout le projet et revient aux tableurs", juste: false, retour: "Non : les anomalies se corrigent ; la recette sert justement à les trouver avant le démarrage." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const k = ecartDuBudget();
        return [
          `Le projet de PGI de ${c.entreprise} a ses acteurs, ses phases et ses jalons. Planifié au plus tôt, il finit au jour ${qte(planning().fin)} ; ses tâches critiques n'ont aucune marge, la reprise des données en a ${jours(marge("reprise"))}. Le paramétrage allongé coûte ${eur(k.ecart)} et retarde le démarrage. La recette dit si le projet est fini.`,
          "Dans l'arène, une partie à plusieurs est un petit projet : qui décide de quoi, avant quelle heure, et quelle décision en attend une autre ?",
        ];
      },
      repere: () => "Maîtrise d'ouvrage, maîtrise d'œuvre · phases, jalons · planning au plus tôt · tâches critiques, marge · écart de coût · classique ou agile · recette et procès-verbal.",
    },
  ],
};
