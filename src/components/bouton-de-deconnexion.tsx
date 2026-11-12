"use client";

import { logoutAction } from "@/app/teacher/actions";
import { FormulaireDeDeconnexion } from "@/components/formulaire-de-deconnexion";
import { SubmitButton } from "@/components/submit-button";
import { LIBELLE_DECONNEXION } from "@/config/navigation";

/**
 * « DÉCONNEXION », LE MÊME BOUTON PARTOUT OÙ L'ON EST CONNECTÉ (le propriétaire, novembre 2026 :
 * « Il me faut un bouton déconnexion quand je suis connecté »).
 *
 * La barre du site disait « Connexion » à qui l'était déjà, et la déconnexion ne se trouvait qu'au
 * bout de la rangée de l'accueil de l'espace enseignant et dans « Mon compte ». Ce bouton prend la
 * place de « Connexion » dans la barre et en tête du menu déplié, une fois connecté, et ferme la
 * rangée de chaque page de l'espace enseignant. Il fait ce que faisait « Se déconnecter » : le
 * formulaire de déconnexion vide ce que le navigateur garde hors ligne, l'action ferme la session
 * de cet appareil et mène à la page de connexion.
 *
 * Un bouton, pas un lien : un lien se suit, se précharge ou se met en favori, et une déconnexion ne
 * part que d'un geste. Pendant l'envoi, il se désactive (`SubmitButton`) : un second clic ne part
 * pas. La forme vient de l'endroit qui le pose : celle de la porte « Connexion » dans la barre, celle
 * d'un geste de compte dans la rangée de l'espace.
 */
export function BoutonDeDeconnexion({ className }: { className: string }) {
  return (
    <FormulaireDeDeconnexion action={logoutAction}>
      <SubmitButton className={className}>{LIBELLE_DECONNEXION}</SubmitButton>
    </FormulaireDeDeconnexion>
  );
}
