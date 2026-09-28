/**
 * OÙ EN EST LA CLASSE, PENDANT QUE VOUS ATTENDEZ.
 *
 * Une fois ses décisions validées, l'équipe lisait une ligne grise : « en
 * attente de la clôture ». Pendant ce temps, cinq autres équipes remplissaient
 * le même formulaire, et l'enseignant attendait la dernière. Le temps mort
 * était collectif sans que personne ne le voie, et c'est justement ce qui en
 * fait un temps mort : on ne patiente pas de la même façon quand on voit la
 * classe arriver.
 *
 * Une pastille par équipe, pleine quand elle a rendu. Le compte est écrit à
 * côté, parce qu'une rangée de points se compte mal au-delà de cinq, et parce
 * qu'un lecteur d'écran ne lit pas des pastilles.
 *
 * ON NE DIT PAS QUI. Ni le nom des équipes en retard, ni celui des premières :
 * ce serait une comparaison permanente entre équipes, exactement ce que le
 * dépôt refuse ailleurs en laissant l'enseignant maître du classement. Un
 * nombre suffit à faire attendre ensemble.
 */
export function QuiARendu({ validees, total }: { validees: number; total: number }) {
  if (total < 2) return null;
  const toutes = validees >= total;
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${
        toutes ? "text-emerald-200" : "text-slate-300"
      }`}
    >
      <span aria-hidden className="flex shrink-0 items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < validees ? "bg-emerald-400" : "border border-white/25"
            }`}
          />
        ))}
      </span>
      {toutes ? (
        <>Toutes les équipes ont rendu : la clôture peut venir.</>
      ) : (
        <>
          {validees} équipe{validees > 1 ? "s" : ""} sur {total} {validees > 1 ? "ont" : "a"} rendu
          {validees === 0 ? " pour l'instant" : ""}.
        </>
      )}
    </p>
  );
}
