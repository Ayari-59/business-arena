import { bouton } from "@/components/bouton";
import { connexionEtablissementProposee } from "@/saml/configuration";

/**
 * « SE CONNECTER AVEC MON ÉTABLISSEMENT » : la connexion par la Fédération
 * Éducation-Recherche de RENATER (SAML 2.0, voir src/saml/).
 *
 * Un bouton SECONDAIRE (un filet, l'encre) : l'écran garde son seul bouton plein, celui
 * du formulaire habituel (charte : un seul bouton plein par écran). C'est un lien vers
 * la route de départ, qui passe par le service de découverte de RENATER : l'étudiant ou
 * l'enseignant choisit son université ou son école, puis s'identifie chez elle.
 *
 * Absent tant que le fournisseur de services n'est pas configuré (clé, certificat,
 * épingle de l'agrégat) : on ne propose pas une porte qui mène à une erreur.
 *
 * `retour` : la page où revenir après la connexion (le code de partie ou l'invitation de
 * cohorte voyagent ainsi).
 */
export function ConnexionEtablissement({ retour, className = "" }: { retour?: string | null; className?: string }) {
  if (!connexionEtablissementProposee()) return null;
  const href = `/api/saml/connexion${retour ? `?retour=${encodeURIComponent(retour)}` : ""}`;
  return (
    <div data-connexion-etablissement="" className={`grid justify-items-start gap-1.5 ${className}`}>
      <a href={href} className={bouton({ variante: "secondaire" })}>
        Se connecter avec mon établissement
      </a>
      <p className="text-xs text-slate-400">
        Universités et écoles de la Fédération Éducation-Recherche (RENATER)
      </p>
    </div>
  );
}
