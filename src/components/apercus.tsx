import { CodeQr } from "@/components/code-qr";
import { SITE_URL } from "@/config/site";

/**
 * CE QUE LE PRODUIT A L'AIR, SUR LES PAGES QUI EN PARLENT.
 *
 * LISIBLES, ET NON MINIATURES. Une première version descendait à 9 px pour
 * ressembler à un écran vu de loin : le garde-fou d'accessibilité l'a refusée,
 * et il avait raison — une illustration dont on ne peut pas lire le contenu
 * n'illustre rien, elle décore. Tout y est au plancher du site, douze pixels,
 * et les aperçus sont un peu plus grands en conséquence.
 *
 * Mesuré page par page : les cinq pages publiques comptaient ZÉRO image. La
 * page « Pour les enseignants » expliquait l'outil en 1 294 mots et quatre
 * mètres de défilement sans jamais le montrer, et le guide en 1 782 mots.
 * L'enseignant qui hésite ne cherche pas une explication de plus : il cherche
 * à voir.
 *
 * DESSINÉS, ET NON PHOTOGRAPHIÉS. Une capture d'écran pèse, vieillit en
 * silence dès qu'un bouton bouge, et se floute sur un grand écran. Ces aperçus
 * sont faits des mêmes couleurs et des mêmes formes que l'application, ne
 * pèsent rien, restent nets à toutes les tailles, et suivent le thème clair
 * comme le sombre puisqu'ils lisent les mêmes variables. La page d'accueil
 * faisait déjà cela pour son cockpit ; ce module en fait une famille.
 *
 * Ils illustrent, ils ne prouvent pas : aucun chiffre n'y est présenté comme
 * une mesure, et les codes affichés ne sont pas de vraies parties.
 */

/** Le cadre commun : une carte sombre, posée, avec son voile de lumière. */
function Cadre({
  legende,
  children,
  className = "",
}: {
  legende: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={`m-0 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/40">
        {children}
      </div>
      <figcaption className="mt-2 text-center text-xs text-slate-400">{legende}</figcaption>
    </figure>
  );
}

/**
 * L'ARÈNE SUR UN TÉLÉPHONE : ce que l'élève voit en ouvrant sa partie.
 *
 * Le tour à jouer, ses chiffres, son bouton. C'est l'écran réel depuis qu'il
 * s'ouvre sur le jeu et non sur l'administration.
 */
export function ApercuArene({ className = "" }: { className?: string }) {
  return (
    <Cadre legende="Ce que voit l'élève, sur son téléphone" className={className}>
      <div className="mx-auto w-full max-w-[330px] p-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-950/60 px-2.5 py-2 text-[0.8rem]">
          <span className="font-semibold text-slate-100">Équipe 3 · NOVA</span>
          <span aria-hidden className="flex gap-0.5">
            <i className="block h-1 w-3 rounded-full bg-amber-400" />
            <i className="block h-1 w-3 rounded-full bg-amber-400" />
            <i className="block h-1 w-3 rounded-full bg-amber-400" />
            <i className="block h-1 w-3 rounded-full bg-amber-400" />
            <i className="block h-1 w-3 rounded-full bg-white/15" />
            <i className="block h-1 w-3 rounded-full bg-white/15" />
          </span>
        </div>

        <div className="mt-2 overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-b from-amber-400/10 to-transparent">
          <p className="flex flex-wrap items-baseline justify-between gap-x-2 px-3 pt-2.5 text-[0.75rem] uppercase tracking-[0.1em] text-amber-300">
            <span>Tour 4 · à jouer</span>
            <span>12 min restantes</span>
          </p>
          <p className="px-3 pb-2 pt-1 font-display text-sm text-slate-100">
            Des clients repartis sans acheter
          </p>
          <div className="grid grid-cols-2 gap-px bg-white/5">
            {[
              ["CA", "300 337 €", "text-slate-100"],
              ["Résultat net", "+32 729 €", "text-emerald-300"],
              ["Trésorerie", "−27 198 €", "text-rose-300"],
              ["IPG", "45", "text-slate-100"],
            ].map(([libelle, valeur, encre]) => (
              <div key={libelle} className="bg-slate-900 px-3 py-1.5">
                <span className="block text-[0.75rem] uppercase tracking-[0.1em] text-slate-400">
                  {libelle}
                </span>
                <span className={`block font-mono text-[0.8rem] tabular-nums ${encre}`}>
                  {valeur}
                </span>
              </div>
            ))}
          </div>
          <p className="m-2.5 rounded-lg bg-amber-400 py-1.5 text-center text-[0.8rem] font-semibold text-slate-950">
            Lire la situation et décider
          </p>
        </div>

        {["↺ Tours passés · 3", "👤 Mon profil et ma clé"].map((ligne) => (
          <p
            key={ligne}
            className="mt-1.5 flex items-center justify-between rounded-lg border border-dashed border-white/10 px-2.5 py-1.5 text-[0.75rem] text-slate-400"
          >
            <span>{ligne}</span>
            <span aria-hidden>▸</span>
          </p>
        ))}
      </div>
    </Cadre>
  );
}

/**
 * L'ÉCRAN DE PROJECTION : ce que la classe lit du fond de la salle.
 *
 * Le QR est un VRAI QR, celui de l'écran d'entrée. Il ne porte pas de code de
 * partie — celui qui est écrit à côté est un exemple, et envoyer un visiteur
 * sur une partie qui n'existe pas serait une petite trahison.
 */
export function ApercuProjection({ className = "" }: { className?: string }) {
  return (
    <Cadre legende="Ce que vous projetez à la classe" className={className}>
      <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 px-4 py-5">
        <p className="text-[0.75rem] uppercase tracking-[0.3em] text-slate-400">
          Rejoindre la partie
        </p>
        <div className="flex items-center gap-4">
          <p className="font-mono text-[clamp(1.5rem,7vw,2.75rem)] font-bold leading-none tracking-[0.1em] text-amber-300">
            K7M2PR
          </p>
          <CodeQr
            valeur={`${SITE_URL}/join`}
            description="QR code de l'écran d'entrée de Business Arena"
            className="h-16 w-16 shrink-0 sm:h-20 sm:w-20"
          />
        </div>
        <p className="text-xs font-semibold text-slate-200 sm:text-sm">
          {SITE_URL.replace(/^https?:\/\//, "")}/join
        </p>
        <p className="text-[0.75rem] text-slate-400">24 élèves connectés · 6 équipes</p>
      </div>
    </Cadre>
  );
}

/**
 * LA VUE DE PILOTAGE : l'état des décisions, équipe par équipe, et le geste.
 *
 * C'est l'écran que l'enseignant garde ouvert pendant la séance, et le seul
 * endroit d'où l'on clôt un tour.
 */
export function ApercuPilotage({ className = "" }: { className?: string }) {
  const equipes = [
    { nom: "Les Fourmis", etat: "validé", tresorerie: "22 445 €", bon: true },
    { nom: "Vega", etat: "en attente", tresorerie: "−27 709 €", bon: false },
    { nom: "Atelier 9", etat: "validé", tresorerie: "8 120 €", bon: true },
  ];
  return (
    <Cadre legende="Ce que vous suivez pendant la séance" className={className}>
      <div className="p-3 sm:p-4">
        <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-400">
          Ce tour · 2/3 équipes ont validé
        </p>
        <table className="mt-2 w-full border-collapse text-left text-[0.8rem]">
          <thead>
            <tr className="text-[0.75rem] uppercase tracking-[0.1em] text-slate-400">
              <th className="pb-1 font-medium">Équipe</th>
              <th className="pb-1 font-medium">Décisions</th>
              <th className="pb-1 text-right font-medium">Trésorerie</th>
            </tr>
          </thead>
          <tbody>
            {equipes.map((e) => (
              <tr key={e.nom} className="border-t border-white/5">
                <td className="py-1.5 text-slate-200">{e.nom}</td>
                <td className="py-1.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[0.75rem] ${
                      e.etat === "validé"
                        ? "border-emerald-400/40 text-emerald-300"
                        : "border-white/15 text-slate-400"
                    }`}
                  >
                    {e.etat}
                  </span>
                </td>
                <td
                  className={`py-1.5 text-right font-mono tabular-nums ${
                    e.bon ? "text-slate-200" : "text-rose-300"
                  }`}
                >
                  {e.tresorerie}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 rounded-lg bg-amber-400 py-1.5 text-center text-[0.8rem] font-semibold text-slate-950">
          Clore le tour et simuler
        </p>
      </div>
    </Cadre>
  );
}
