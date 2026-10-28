/**
 * LES SITUATIONS DES SECTEURS, CÔTÉ SERVEUR (audit, P1-2).
 *
 * Le registre des scénarios (`registry.ts`) les lit d'ici, par l'import
 * `#situations-des-secteurs` de `package.json`. Ce nom se résout :
 * - partout ailleurs que dans le navigateur (serveur, tests, scripts), vers ce
 *   fichier, qui porte les situations complètes, corrigés compris ;
 * - dans le navigateur (condition `browser`), vers
 *   `situations-des-secteurs.navigateur.ts`, qui n'en porte aucune.
 *
 * Pourquoi : des chapitres du cours, joués dans le navigateur, lisent le registre
 * pour les chiffres d'une entreprise. Avec lui partaient, dans un fichier
 * JavaScript public, les bonnes réponses et les explications des 209 questions
 * des situations notées. Aucun code client ne lit les situations : elles se
 * jouent par les actions serveur de l'arène.
 */
export { NOVA_SITUATIONS } from "./nova/situations";
export { NOVA_GAMME_SITUATIONS } from "./nova-gamme/situations";
export { BOUTIQUE_SITUATIONS } from "./boutique/situations";
export { BOUTIQUE_MONO_SITUATIONS } from "./boutique-mono/situations";
export { HOTEL_SITUATIONS } from "./hotel/situations";
export { HOTEL_GAMME_SITUATIONS } from "./hotel-gamme/situations";
export { BISTROT_SITUATIONS } from "./bistrot/situations";
export { BISTROT_GAMME_SITUATIONS } from "./bistrot-gamme/situations";
export { CONSEIL_SITUATIONS } from "./conseil/situations";
export { CONSEIL_GAMME_SITUATIONS } from "./conseil-gamme/situations";
export { ECOMMERCE_SITUATIONS } from "./ecommerce/situations";
export { ECOMMERCE_GAMME_SITUATIONS } from "./ecommerce-gamme/situations";
export { FITNESS_SITUATIONS } from "./fitness/situations";
export { BATIMENT_SITUATIONS } from "./batiment/situations";
export { TRANSPORT_SITUATIONS } from "./transport/situations";
