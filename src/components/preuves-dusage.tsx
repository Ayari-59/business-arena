import {
  auMoinsUnCompteur,
  type PreuvesDusage,
  type PreuvesPubliees,
} from "@/config/preuves-dusage";

/**
 * CE QUE LE PRODUIT A DÉJÀ SERVI, COMPTÉ DANS LE PRODUIT.
 *
 * Une page publique prouve son usage de deux façons. Écrire « adopté par des
 * centaines d'enseignants » sous un témoignage signé d'un prénom : invérifiable,
 * donc sans valeur — le même défaut que le cockpit aux chiffres inventés retiré
 * de l'accueil. Ou compter ce qui s'est passé et le dire tel quel.
 *
 * QUATRE TOTAUX, AUCUN NOM. Aucun établissement n'est nommé, aucun enseignant,
 * aucun élève : il n'y a pas de donnée personnelle dans un total. Le relevé est
 * daté, parce qu'un compteur sans date ne se vérifie pas non plus.
 *
 * Le composant ne rend RIEN quand le relevé manque ou n'atteint pas le
 * plancher : c'est le service qui en décide, et la page n'a pas à connaître la
 * règle.
 *
 * CE QUI SE PUBLIE EST UN RÉGLAGE, PAS UNE PROPRIÉTÉ DE LA BASE. Un compteur
 * exact peut desservir la page qui le porte — « classes créées : 0 » en est
 * l'exemple — et le remède n'est pas de le maquiller mais de ne pas le
 * publier. Le choix vit dans la configuration de plateforme ; ici on se
 * contente de ne rendre que ce qui est demandé, et rien du tout s'il ne reste
 * personne à montrer.
 */
export function PreuvesDusageBande({
  preuves,
  publiees,
}: {
  preuves: PreuvesDusage | null;
  publiees: PreuvesPubliees;
}) {
  if (!preuves || !auMoinsUnCompteur(publiees)) return null;
  const nombre = (n: number) => n.toLocaleString("fr-FR");
  const compteurs = [
    { montre: publiees.parties, valeur: nombre(preuves.parties), quoi: "parties jouées", aide: "menées au moins jusqu'à leur premier résultat" },
    { montre: publiees.tours, valeur: nombre(preuves.tours), quoi: "tours résolus", aide: "chacun calculé par le moteur, décisions comprises" },
    // « validées » disait un statut de la base, et ce statut ne survit pas à la
    // résolution du tour. Ce qui est compté, et donc ce qui est dit : les
    // décisions qu'une équipe a prises et envoyées au marché.
    { montre: publiees.decisions, valeur: nombre(preuves.decisions), quoi: "décisions prises", aide: "par une équipe, puis envoyées au marché" },
    { montre: publiees.classes, valeur: nombre(preuves.classes), quoi: "classes créées", aide: "par un enseignant, dans son espace" },
  ].filter((c) => c.montre);

  return (
    <section aria-labelledby="usage" className="border-y border-white/5 bg-slate-900/50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h2 id="usage" className="text-center text-2xl font-bold text-slate-50">
          Ce qui s&apos;est joué jusqu&apos;ici
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-400">
          Ces totaux sont comptés dans la base du site, pas rédigés : ils montent tout seuls
          quand une classe joue. Aucun établissement, aucun enseignant et aucun élève n&apos;y
          est nommé.
        </p>

        {/* La grille suit le nombre de compteurs retenus : trois colonnes pour
            trois compteurs, sans case vide au bout de la rangée. */}
        <dl
          className={`mt-7 grid gap-6 text-center ${
            compteurs.length >= 4
              ? "grid-cols-2 sm:grid-cols-4"
              : compteurs.length === 3
                ? "grid-cols-1 sm:grid-cols-3"
                : compteurs.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-1"
          }`}
        >
          {compteurs.map((c) => (
            <div key={c.quoi}>
              <dt className="sr-only">{c.quoi}</dt>
              <dd className="m-0">
                <p className="font-display text-3xl tabular-nums text-slate-50">{c.valeur}</p>
                <p className="mt-1 text-sm font-medium text-slate-200">{c.quoi}</p>
                <p className="mt-0.5 text-sm leading-snug text-slate-400">{c.aide}</p>
              </dd>
            </div>
          ))}
        </dl>

        {/* La date du relevé : un compteur sans date ne se vérifie pas. */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Relevé le{" "}
          <time dateTime={preuves.releveLe.toISOString().slice(0, 10)}>
            {preuves.releveLe.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          .
        </p>
      </div>
    </section>
  );
}
