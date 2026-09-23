import { AIDE_CODE_DE_REPRISE, formaterCodeDeReprise } from "@/config/reprise";

/**
 * LE CODE PERSONNEL, MONTRÉ LÀ OÙ L'ÉLÈVE EST DÉJÀ RECONNU.
 *
 * Il ne s'affiche pas une seule fois, à l'inscription, pour disparaître : un
 * élève qui ne l'a pas noté ce jour-là le retrouve ici tant qu'il a encore son
 * appareil. C'est AVANT de le perdre qu'on peut encore le lire.
 */
export function CarteDuCodeDeReprise({ code }: { code: string }) {
  return (
    <section
      aria-labelledby="code-de-reprise-titre"
      className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 sm:p-5"
    >
      <h2
        id="code-de-reprise-titre"
        className="text-xs font-semibold uppercase tracking-wide text-amber-300"
      >
        Votre code de reprise
      </h2>
      <p
        id="code-de-reprise"
        className="mt-1.5 font-mono text-2xl tracking-[0.2em] text-amber-200"
      >
        {formaterCodeDeReprise(code)}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{AIDE_CODE_DE_REPRISE}</p>
    </section>
  );
}
