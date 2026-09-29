/**
 * LE DISQUE DE LAITON QUI FLOTTE DERRIÈRE UN EN-TÊTE DE PAGE.
 *
 * Six pages publiques le dessinaient à la main, à l'identique. Six copies
 * d'une décoration, ce sont six décorations qui dérivent — l'une change de
 * hauteur, l'autre d'opacité — et surtout six endroits où corriger le jour où
 * l'on s'aperçoit d'un défaut. Ce jour est arrivé : le laiton du thème clair
 * est un brun foncé, donc la lueur y était une tache (voir `--halo-de-page`
 * dans globals.css, qui porte la mesure).
 *
 * Purement décoratif, donc retiré de l'arbre d'accessibilité, et sans prise
 * aux clics : il couvre le haut de la page, y compris les boutons.
 */
export function HaloDePage() {
  return (
    <div
      aria-hidden
      className="halo-de-page pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
    />
  );
}
