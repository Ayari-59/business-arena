import type { Bureau } from "../bureaux/types";

/**
 * UNE ENQUÊTE (décision du propriétaire, novembre 2026) : un cours par la simulation d'un format
 * nouveau. L'élève reçoit un dossier qui cache des erreurs ; il les trouve, dit pourquoi c'est faux,
 * puis les corrige. C'est une activité à part, avec sa page (/cours/enquete/<code>) : un lien y mène
 * depuis le chapitre qu'elle reprend, rien ne change dans les étapes du chapitre.
 *
 * LE MOTEUR EST CELUI DU BUREAU (config/cours/bureaux/types.ts, pedagogy/cours/bureau-servi.ts) : le
 * dossier se sert comme une pile, sans aucune réponse ; chaque geste remonte à une action serveur
 * (app/cours/enquete/actions.ts), qui contrôle l'accès puis le corrige. L'enquête trie les écritures
 * (une étape de classement : juste ou fausse), rectifie les fausses (une étape de rectification : la
 * raison de l'erreur et l'écriture juste), puis chiffre l'effet des erreurs (une étape d'état).
 *
 * Comme le bureau, elle vit hors du registre des chapitres et des cas (config/cours/enquetes) : elle ne
 * compte ni dans le catalogue, ni dans la couverture, ni parmi les cas dédiés.
 */
export type Enquete = Bureau & { format: "enquete" };
