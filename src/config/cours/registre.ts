import { CREATION_PREMIER_BILAN } from "./chapitres/creation-premier-bilan";
import { LA_PAIE } from "./chapitres/la-paie";
import { L_EMPRUNT } from "./chapitres/l-emprunt";
import { IMMOBILISATIONS } from "./chapitres/immobilisations";
import { LES_STOCKS } from "./chapitres/les-stocks";
import { LA_CLOTURE } from "./chapitres/la-cloture";
import { REMISES_ET_REGLEMENTS } from "./chapitres/remises-et-reglements";
import { SEUIL_DE_RENTABILITE } from "./chapitres/seuil-de-rentabilite";
import { COUT_COMPLET } from "./chapitres/cout-complet";
import { COUT_PAR_PRODUIT } from "./chapitres/cout-par-produit";
import { BUDGET_DE_TRESORERIE } from "./chapitres/budget-de-tresorerie";
import { ANALYSE_DES_ECARTS } from "./chapitres/analyse-des-ecarts";
import { TABLEAU_DE_BORD } from "./chapitres/tableau-de-bord";
import { DECIDER } from "./chapitres/decider";
import { DEPRECIATIONS_ET_PROVISIONS } from "./chapitres/depreciations-et-provisions";
import { REGULARISATIONS } from "./chapitres/regularisations";
import type { Chapitre } from "./types";

/**
 * LE COURS PAR LA SIMULATION : DEUX PARCOURS, QUATRE PALIERS.
 *
 * Un palier n'est pas un niveau du jeu (les niveaux 1 à 7 de l'arène) : c'est une
 * marche du programme, du lycée au DCG. Un chapitre appartient à un parcours et à
 * un palier ; il se joue dans n'importe laquelle des entreprises du cours.
 *
 * ACCÈS (décision du propriétaire) : le premier chapitre est libre, il sert de
 * démonstration ; la suite du cours est réservée aux établissements sous licence.
 */

export type CodeParcours = Chapitre["parcours"];

export const PARCOURS: readonly { code: CodeParcours; titre: string; resume: string }[] = [
  {
    code: "comptabilite-generale",
    titre: "Comptabilité générale",
    resume: "Du journal au bilan : chaque opération de l'entreprise, passée par l'élève, et les états qu'elle construit.",
  },
  {
    code: "controle-de-gestion",
    titre: "Comptabilité de gestion et contrôle de gestion",
    resume: "Des coûts aux décisions : marges, seuil de rentabilité, coûts complets, budgets et écarts, sur le même cas simulé.",
  },
];

export const PALIERS: readonly { palier: Chapitre["palier"]; titre: string; public: string }[] = [
  { palier: 1, titre: "Découvrir", public: "Lycée, bac STMG" },
  { palier: 2, titre: "Les bases", public: "BTS, BUT 1re année" },
  { palier: 3, titre: "Les opérations courantes", public: "BTS, BUT" },
  { palier: 4, titre: "Analyser et décider", public: "BTS 2e année, BUT, DCG" },
];

/** Ce que chaque palier couvre, parcours par parcours : la carte du cours. */
export const PROGRAMME: Record<CodeParcours, Record<Chapitre["palier"], readonly string[]>> = {
  "comptabilite-generale": {
    1: ["Les flux de l'entreprise", "Charges et produits, encaissements et décaissements"],
    2: ["La partie double et le journal", "La TVA", "Le premier bilan"],
    3: ["Remises et règlements", "La paie", "L'emprunt et ses intérêts", "Immobilisations et amortissements", "Les stocks", "La clôture"],
    4: ["Dépréciations et provisions", "Régularisations de fin d'exercice", "Soldes intermédiaires de gestion et CAF", "Bilan fonctionnel et BFR"],
  },
  "controle-de-gestion": {
    1: ["Prix, coût et marge"],
    2: ["Charges variables et charges fixes", "Marge sur coût variable", "Seuil de rentabilité"],
    3: ["Coût complet et centres d'analyse", "Coût par produit"],
    4: ["Budgets", "Analyse des écarts", "Tableau de bord", "Décider : prix, fabriquer ou acheter"],
  },
};

export const CHAPITRES: readonly Chapitre[] = [CREATION_PREMIER_BILAN, LA_PAIE, L_EMPRUNT, IMMOBILISATIONS, LES_STOCKS, LA_CLOTURE, REMISES_ET_REGLEMENTS, DEPRECIATIONS_ET_PROVISIONS, REGULARISATIONS, SEUIL_DE_RENTABILITE, COUT_COMPLET, COUT_PAR_PRODUIT, BUDGET_DE_TRESORERIE, ANALYSE_DES_ECARTS, TABLEAU_DE_BORD, DECIDER];

export const chapitreParCode = (code: string) => CHAPITRES.find((c) => c.code === code);
