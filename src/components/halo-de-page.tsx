/**
 * L'ANNEAU ORANGE QUI DÉBORDE DU COIN D'UN HAUT DE PAGE.
 *
 * Six pages publiques dessinaient à la main un disque de laiton flou derrière
 * leur en-tête. Six copies d'une décoration, ce sont six décorations qui
 * dérivent, et six endroits où corriger le jour où l'on s'aperçoit d'un
 * défaut. Le composant est resté quand l'habillage a changé : le disque est
 * devenu l'anneau de la maquette « L'arène », un cercle de piste en filigrane
 * qui sort du coin haut droit (voir `.halo-de-page` dans globals.css, qui
 * porte son épaisseur et sa teinte).
 *
 * Purement décoratif, donc retiré de l'arbre d'accessibilité, et sans prise
 * aux clics. Il se peint SOUS le contenu : posé par-dessus, il voilerait les
 * titres qu'il accompagne. Son parent le rogne (overflow), sans quoi il
 * élargirait la page sur un téléphone.
 */
export function HaloDePage() {
  return (
    <div
      aria-hidden
      className="halo-de-page pointer-events-none absolute -right-20 -top-24 aspect-square w-[18rem] rounded-full sm:-right-28 sm:-top-36 sm:w-[30rem] lg:w-[34rem]"
    />
  );
}
