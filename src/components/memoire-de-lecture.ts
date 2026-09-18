/**
 * LA MÉMOIRE D'UN GESTE DE LECTURE.
 *
 * « J'ai ouvert le courrier », « j'ai pris note », « j'ai déplié ce tour » :
 * des états d'affichage, propres à un appareil, qu'on veut retrouver en
 * revenant sur la page sans les faire remonter au serveur.
 *
 * DEUX MÉMOIRES, ET LA PREMIÈRE NE TOMBE JAMAIS. Le stockage local refuse
 * d'écrire en navigation privée, quand les données de site sont bloquées, et
 * dans plusieurs navigateurs embarqués. S'il est la seule source de vérité, un
 * appareil qui le bloque voit ses boutons ne rien faire du tout : le geste
 * n'est écrit nulle part, donc l'écran ne change pas. La mémoire vive du
 * module tient la séance ; le stockage n'ajoute que le souvenir d'une visite à
 * l'autre.
 *
 * Elle se lit comme une source externe (`useSyncExternalStore`) : le serveur
 * rend l'état initial, le client lit l'appareil à l'hydratation, et le geste
 * prévient les abonnés. Pas de setState dans un effet, pas de désaccord
 * serveur/client.
 */
export interface MemoireDeLecture<E extends string> {
  subscribe: (auChangement: () => void) => () => void;
  /** L'état retenu pour cette clé, ou "" si le geste n'a pas été fait. */
  lire: (cle: string) => E | "";
  retenir: (cle: string, etat: E) => void;
}

/** Le stockage de l'appareil, ou rien du tout s'il est indisponible. */
function stockage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function creerMemoireDeLecture<E extends string>(
  etatsConnus: readonly E[],
): MemoireDeLecture<E> {
  const abonnes = new Set<() => void>();
  const vive = new Map<string, E>();
  const connu = (v: string | null): v is E => v !== null && (etatsConnus as readonly string[]).includes(v);

  return {
    subscribe(auChangement: () => void) {
      abonnes.add(auChangement);
      return () => abonnes.delete(auChangement);
    },
    lire(cle: string): E | "" {
      const vif = vive.get(cle);
      if (vif) return vif;
      try {
        const v = stockage()?.getItem(cle) ?? null;
        return connu(v) ? v : "";
      } catch {
        return "";
      }
    },
    retenir(cle: string, etat: E) {
      // La mémoire vive d'abord : c'est elle qui fait changer l'écran, et elle
      // n'échoue pas.
      vive.set(cle, etat);
      try {
        stockage()?.setItem(cle, etat);
      } catch {
        // Stockage refusé : la séance tient quand même, seul le souvenir d'une
        // visite à l'autre est perdu.
      }
      for (const auChangement of abonnes) auChangement();
    },
  };
}
