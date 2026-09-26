import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "@/components/join-form";
import { IdentiteDeLAppareil } from "@/components/identite-de-lappareil";
import { getGuestDisplayName } from "@/lib/guest";
import { normaliserCodeDePartie, normaliserRangDEquipe } from "@/lib/code-de-partie";
import { equipeDuCarton } from "@/services/game.service";

/** Page d'entrée par code : un titre pour l'onglet, rien pour les moteurs. */
export const metadata: Metadata = {
  title: "Rejoindre une partie",
  robots: { index: false, follow: false },
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; equipe?: string }>;
}) {
  // Le prénom déjà porté par cet appareil, s'il en porte un : c'est ICI, avant
  // la saisie, que l'avertissement sert encore à quelque chose.
  const occupant = await getGuestDisplayName();
  // LE CODE PEUT VENIR DE L'ADRESSE. C'est ce que fait le QR de la partie : il
  // encode cette page avec le code dedans. Filtré avant d'être affiché, car
  // l'adresse s'écrit à la main aussi bien qu'elle se scanne.
  const { code, equipe } = await searchParams;
  const codeInitial = normaliserCodeDePartie(code);
  // LE CARTON D'UNE TABLE porte en plus une équipe. On va chercher son nom
  // pour le montrer : l'élève doit voir où il s'assoit AVANT de valider, sinon
  // le QR décide à sa place sans jamais le dire. Un rang qui ne désigne rien
  // ne dit rien non plus — l'écran redevient celui du code seul, et
  // l'affectation automatique reprend la main.
  const rang = codeInitial ? normaliserRangDEquipe(equipe) : null;
  const nomDEquipe = rang !== null ? await equipeDuCarton(codeInitial!, rang) : null;
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena</p>
        <h1 className="mt-2 text-3xl font-bold">Rejoindre une partie</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          {nomDEquipe
            ? "Le code est déjà rempli : entrez votre prénom pour rejoindre votre équipe."
            : codeInitial
              ? "Le code est déjà rempli : entrez votre prénom, vous serez affecté automatiquement à une équipe."
              : "Entrez le code donné par votre enseignant : vous serez affecté automatiquement à une équipe."}
        </p>
      </div>
      {occupant ? <IdentiteDeLAppareil pseudo={occupant} variante="entree" /> : null}
      {nomDEquipe ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-200">
          Vous rejoignez l&apos;équipe{" "}
          <span className="font-semibold text-amber-100">{nomDEquipe}</span>
        </p>
      ) : null}
      <JoinForm
        codeInitial={codeInitial}
        equipeInitiale={nomDEquipe ? rang : null}
      />
      <Link href="/guide" className="text-xs text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline">
        Première fois ? Consultez le guide de prise en main
      </Link>
    </main>
  );
}
