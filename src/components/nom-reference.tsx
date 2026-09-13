/**
 * Le nom d'une référence de gamme, adapté à la largeur de l'écran.
 *
 * Certaines références portent un nom que le métier exige entier (« Transformation
 * et Stratégie ») et qui ne tient pas sur un bouton de téléphone. La référence
 * déclare alors un `shortName` : c'est lui qui s'affiche sous 640 px, le nom
 * complet reprenant sa place dès que la largeur le permet.
 *
 * Les deux variantes sont dans le DOM, mais une seule est rendue à la fois
 * (`display: none` sur l'autre) : un lecteur d'écran n'en annonce qu'une.
 * Sans `shortName`, un seul nœud de texte — rien ne change pour les 14 autres
 * scénarios.
 */
export function NomReference({
  reference,
}: {
  reference: { name: string; shortName?: string | null };
}) {
  const court = reference.shortName;
  if (!court || court === reference.name) return <>{reference.name}</>;
  return (
    <>
      <span className="sm:hidden">{court}</span>
      <span className="hidden sm:inline">{reference.name}</span>
    </>
  );
}
