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
 *
 * LOT P5 : IL NE SE PEINT PLUS NULLE PART. La vitrine l'a quitté au lot P2,
 * /jouer et les ouvertures marines (`BandeOuverture` : enseignants, écoles,
 * entreprises) au lot P5 : un ornement sans rôle. Il reste posé sur des pages
 * claires, où le papier le masque (`display: none`, voir globals.css) ; le
 * retirer d'elles ne changerait rien à l'écran. Garde : l'e2e `halo`, « aucun
 * en-tête de page publique ne porte l'anneau ».
 */
/*
 * IL SORT DU COIN SANS TRAVERSER LE TITRE (audit P3-03). Sur ordinateur, le
 * titre du héros de l'accueil prend toute la largeur de sa colonne, et
 * l'anneau, posé à 7 rem du bord, passait sur « ENTREPRISE. » et « DÉCIDER. ».
 * Au-delà de `lg`, il est poussé de moitié hors de l'écran et remonté : son
 * arc gauche reste à droite de la première ligne du titre, et la seconde,
 * plus courte, passe sous lui sans le toucher.
 */
export function HaloDePage() {
  return (
    <div
      aria-hidden
      className="halo-de-page pointer-events-none absolute -right-20 -top-24 aspect-square w-[18rem] rounded-full sm:-right-28 sm:-top-36 sm:w-[30rem] lg:-right-[22rem] lg:-top-48 lg:w-[34rem]"
    />
  );
}
