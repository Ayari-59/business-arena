"use client";

import { useEffect, useState } from "react";
import { echeanceDuTour, dateLisible, type Echeance } from "@/config/echeance";

/**
 * L'HEURE À LAQUELLE LE TOUR FERME.
 *
 * Le planning existait, le verrou tombait au bon moment, mais l'élève ne
 * voyait RIEN tant que c'était jouable : il découvrait la date limite en étant
 * refusé, après vingt minutes de saisie. Le brouillon local sauvait le travail,
 * pas le tour.
 *
 * La date absolue est rendue par le serveur (elle ne bouge pas) ; le temps
 * restant n'apparaît qu'APRÈS le montage, parce qu'un « dans 12 minutes »
 * calculé au rendu serveur serait déjà faux à l'affichage et ferait diverger
 * l'hydratation. Il se rafraîchit ensuite toutes les trente secondes : à la
 * minute près, personne ne prend une décision différente, et une seconde qui
 * défile ferait du bruit dans un lecteur d'écran.
 *
 * `aria-live` seulement dans les dix dernières minutes, et sur un texte qui ne
 * change qu'une fois par minute : c'est là que l'annonce sert.
 */
export function EcheanceDuTour({
  closesAt,
  compact = false,
}: {
  /** L'échéance en ISO, telle que la vue l'expose. */
  closesAt: string;
  /** Version pastille, pour l'en-tête ; sinon un bandeau sous le formulaire. */
  compact?: boolean;
}) {
  const quand = new Date(closesAt);
  const [etat, setEtat] = useState<Echeance | null>(null);

  useEffect(() => {
    const rafraichir = () => setEtat(echeanceDuTour(quand, new Date()));
    rafraichir();
    const minuteur = setInterval(rafraichir, 30_000);
    return () => clearInterval(minuteur);
  }, [closesAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (Number.isNaN(quand.getTime())) return null;
  // Tour déjà fermé : le verrou de planning le dit avec ses mots, inutile de
  // le redire ici.
  if (etat?.depassee) return null;

  const absolu = etat?.absolu ?? dateLisible(quand);
  const restant = etat?.restant ?? null;
  const urgence = etat?.urgence ?? false;

  const teinte = urgence
    ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
    : "border-white/10 text-slate-400";

  if (compact) {
    return (
      <p className={`rounded-full border px-3 py-1 text-xs ${teinte}`} title={`Ce tour ferme ${absolu}`}>
        <span aria-hidden>⏳</span> {restant ? `Ferme ${restant}` : `Ferme ${absolu}`}
      </p>
    );
  }

  return (
    <p
      role={urgence ? "status" : undefined}
      aria-live={urgence ? "polite" : undefined}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm leading-relaxed ${teinte}`}
    >
      <span aria-hidden className="mt-0.5">⏳</span>
      <span>
        Ce tour ferme <strong className="font-semibold">{absolu}</strong>
        {restant ? <>, {restant}</> : null}. Validez avant : après, la saisie n&apos;est plus
        acceptée.
      </span>
    </p>
  );
}
