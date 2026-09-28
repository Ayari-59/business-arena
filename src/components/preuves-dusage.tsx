import type { PreuvesDusage } from "@/config/preuves-dusage";

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
 */
export function PreuvesDusageBande({ preuves }: { preuves: PreuvesDusage | null }) {
  if (!preuves) return null;
  const nombre = (n: number) => n.toLocaleString("fr-FR");
  const compteurs = [
    { valeur: nombre(preuves.parties), quoi: "parties jouées", aide: "menées au moins jusqu'à leur premier résultat" },
    { valeur: nombre(preuves.tours), quoi: "tours résolus", aide: "chacun calculé par le moteur, décisions comprises" },
    { valeur: nombre(preuves.decisions), quoi: "décisions validées", aide: "prises par une équipe et envoyées au marché" },
    { valeur: nombre(preuves.classes), quoi: "classes créées", aide: "par un enseignant, dans son espace" },
  ];

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

        <dl className="mt-7 grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {compteurs.map((c) => (
            <div key={c.quoi}>
              <dt className="sr-only">{c.quoi}</dt>
              <dd className="m-0">
                <p className="font-display text-3xl tabular-nums text-amber-400">{c.valeur}</p>
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
