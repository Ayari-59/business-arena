import Link from "next/link";
import { LIGNE_DE_PRIX } from "@/config/tarifs";

/**
 * LA LIGNE DE PRIX DES BANDES FINALES (audit C-07) : les trois offres de l'arène et leur
 * prix, lus dans config/tarifs.ts, et le lien vers la grille. Écrite une fois pour
 * /enseignants, /ecoles et /fonctionnalites.
 */
export function LigneDePrix() {
  return (
    <>
      {LIGNE_DE_PRIX}{" "}
      <Link
        href="/tarifs"
        className="font-semibold text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        Voir les tarifs
      </Link>
    </>
  );
}
