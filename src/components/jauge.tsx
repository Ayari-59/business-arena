/**
 * UNE JAUGE PORTE TOUJOURS SA VALEUR ET SA BORNE — LA COULEUR CONFIRME.
 *
 * Là où une valeur a une borne (une capacité qu'on ne dépasse pas, un découvert
 * qu'on ne crève pas, une part qui ne fait jamais plus de cent pour cent), une
 * barre dit d'un coup d'œil « où on en est du plafond ». Règle de la charte et
 * de `dataviz` tenue ici une fois pour toutes : la jauge ÉCRIT sa valeur et sa
 * borne en chiffres ; la barre et sa couleur ne font que confirmer, elles ne
 * disent jamais rien seules. Le remplissage est en bleu donnée (`--donnee`), ou
 * à la teinte du métier (`--metier`) quand la jauge est celle de l'entreprise ;
 * le rouge n'entre que pour un RÉSULTAT franc (un découvert), jamais pour un
 * niveau à apprécier.
 *
 * Aucune animation : la valeur finale est dans le DOM dès le rendu serveur (la
 * vie de l'arène passe par la bande de marché et `ChiffreQuiArrive`, pas par une
 * barre qui se remplit toute seule). À l'impression la barre reste, à plat.
 */

export type TonDeJauge = "donnee" | "metier" | "alerte";

const REMPLISSAGE: Record<TonDeJauge, string> = {
  donnee: "var(--donnee)",
  metier: "var(--metier, var(--donnee))",
  alerte: "var(--color-red-400)",
};

export function Jauge({
  libelle,
  valeur,
  borne,
  fraction,
  ton = "donnee",
  note,
  repere,
}: {
  /** Ce que la jauge mesure. */
  libelle: string;
  /** La valeur du moment, écrite entière (toujours lisible, sans la barre). */
  valeur: string;
  /** La borne, écrite entière à côté de la valeur : « / 1 200 », « max 50 000 €ꞏ». */
  borne: string;
  /** La part remplie, de 0 à 1 (bornée ici). */
  fraction: number;
  ton?: TonDeJauge;
  /** Une précision courte sous la barre. */
  note?: string;
  /**
   * Un repère sur la piste (le goulot, le plafond consenti…) : sa position de 0
   * à 1 et son libellé accessible. Il marque la borne qui compte sans trancher.
   */
  repere?: { fraction: number; label: string };
}) {
  const pleine = Math.max(0, Math.min(1, fraction));
  const couleur = REMPLISSAGE[ton];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="libelle">{libelle}</span>
        <span className="tabular-nums text-sm text-slate-300">
          <span className="font-semibold text-slate-100">{valeur}</span>
          <span className="text-slate-400"> {borne}</span>
        </span>
      </div>
      <div className="relative mt-1 h-2 rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full"
          style={{ width: `${Math.max(2, pleine * 100)}%`, background: couleur }}
        />
        {repere ? (
          <span
            aria-label={repere.label}
            title={repere.label}
            className="absolute top-[-2px] h-3 w-0.5 rounded-full bg-slate-300"
            style={{ left: `${Math.max(0, Math.min(100, repere.fraction * 100))}%` }}
          />
        ) : null}
      </div>
      {note ? <p className="mt-1 text-xs text-slate-400">{note}</p> : null}
    </div>
  );
}
