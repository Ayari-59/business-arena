"use client";

import type { InputHTMLAttributes } from "react";
import { sansMolette } from "@/components/sans-molette";

/**
 * UN CHAMP NUMÉRIQUE QUE LA MOLETTE NE CHANGE PAS (components/sans-molette.ts), pour les
 * pages serveur de l'examen : une page serveur ne pose pas de gestionnaire d'événement,
 * ce composant client le pose pour elle.
 */
export function ChampNombre(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onWheel">) {
  return (
    <input
      type="number"
      onWheel={sansMolette}
      {...props}
    />
  );
}
