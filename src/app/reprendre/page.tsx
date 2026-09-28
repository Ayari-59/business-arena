import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireDeReprise } from "@/components/formulaire-de-reprise";
import { IdentiteDeLAppareil } from "@/components/identite-de-lappareil";
import { getGuestDisplayName } from "@/lib/guest";
import { codeDeReprisePlausible, normaliserCodeDeReprise } from "@/config/reprise";

export const metadata: Metadata = {
  title: "Reprendre ma place",
  robots: { index: false, follow: false },
};

/**
 * RETROUVER SA PLACE, DEPUIS N'IMPORTE QUEL APPAREIL.
 *
 * L'élève est reconnu par son cookie invité, donc par son navigateur. Il
 * change de poste, vide ses cookies, passe au téléphone : sans cette page, il
 * rejoignait par le code de la partie et l'application, ne le reconnaissant
 * pas, le rangeait dans une équipe quelconque — avec un deuxième joueur à son
 * nom et son travail resté dans l'autre.
 *
 * Son QR personnel mène ici, code déjà rempli : un scan, un bouton, et il est
 * de retour dans son arène.
 *
 * RIEN N'EST MONTRÉ AVANT LA VÉRIFICATION. Annoncer « vous reprenez la place
 * de Léa » sur un simple paramètre d'adresse dirait, sans rien compter, quels
 * codes existent. C'est l'arène qui annonce ensuite sous quel nom on joue,
 * avec son « ce n'est pas moi » à côté.
 */
export default async function ReprendrePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const propre = code ? normaliserCodeDeReprise(code) : "";
  const codeInitial = codeDeReprisePlausible(propre) ? propre : null;
  const occupant = await getGuestDisplayName();

  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena</p>
        <h1 className="mt-2 text-3xl font-bold">Reprendre ma place</h1>
        <p className="mt-2 max-w-md text-base text-slate-400">
          {codeInitial
            ? "Votre code est déjà rempli : validez, et vous retrouvez votre équipe avec tout ce que vous y avez fait."
            : "Entrez le code personnel noté au début de la partie. Il vous rend votre équipe et tout ce que vous y avez fait, depuis n'importe quel appareil."}
        </p>
      </div>
      {/* Cet appareil porte déjà un prénom : le dire AVANT, parce qu'une
          reprise l'écrase. Le poste de salle informatique passe d'une classe à
          l'autre, et le précédent n'a pas toujours libéré. */}
      {occupant ? <IdentiteDeLAppareil pseudo={occupant} variante="entree" /> : null}
      <FormulaireDeReprise codeInitial={codeInitial} />
      <p className="max-w-sm text-center text-sm leading-relaxed text-slate-400">
        Code perdu ? Votre enseignant peut vous le relire : il a la liste des codes de la
        partie.
      </p>
      <Link
        href="/join"
        className="text-xs text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline"
      >
        Vous n&apos;avez jamais joué cette partie ? Entrez par son code →
      </Link>
    </main>
  );
}
