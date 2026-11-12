import { VENDEUR } from "@/config/editeur";
import { MENTION_TVA } from "@/config/tarifs";

/**
 * LA FICHE FOURNISSEUR (décision du propriétaire, 11 novembre 2026 ; audit de l'offre du même jour,
 * P2-1 : un service des achats ou une agence comptable crée le fournisseur avant le bon de commande,
 * et rien ne lui en donnait les éléments). Tout se lit dans `VENDEUR` (config/editeur.ts), jamais
 * recopié : le SIRET, l'adresse de facturation, l'identification sur Chorus Pro, qui est le SIRET, et
 * le RIB, envoyé sur demande. Sur la page du devis et dans les CGV.
 */
export function FicheFournisseur({ titre = "Fiche fournisseur", className = "" }: { titre?: string; className?: string }) {
  const adresse = `${VENDEUR.adresse.rue}, ${VENDEUR.adresse.codePostal} ${VENDEUR.adresse.ville}`;
  const lignes: [string, string][] = [
    ["Fournisseur", `${VENDEUR.nom}, nom commercial de ${VENDEUR.exploitant}, ${VENDEUR.statut}`],
    ["SIRET", VENDEUR.siret],
    ["Adresse de facturation", adresse],
    ["Chorus Pro", `identifié par son SIRET, ${VENDEUR.siret}`],
    ["TVA", MENTION_TVA],
    ["RIB", `sur demande, à ${VENDEUR.contact}`],
  ];
  return (
    <section id="fiche-fournisseur" aria-labelledby="fiche-fournisseur-titre" data-fiche-fournisseur="" className={className}>
      <h2 id="fiche-fournisseur-titre" className="text-lg font-bold text-slate-50">
        {titre}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">
        Pour votre service des achats ou votre agence comptable : de quoi créer le fournisseur avant le bon de commande.
      </p>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
        {lignes.map(([cle, valeur]) => (
          <div key={cle} className="contents">
            <dt className="text-slate-400">{cle}</dt>
            <dd className="min-w-0 break-words text-slate-200">{valeur}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
