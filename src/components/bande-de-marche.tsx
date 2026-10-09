"use client";

import { ChiffreQuiArrive } from "@/components/chiffre-qui-arrive";
import { formatEuro, MOINS } from "@/lib/format";
import type { FaitDuMarche, UniteDEcart } from "@/lib/faits-du-marche";

/**
 * LA BANDE DE MARCHÉ — LE MARCHÉ BOUGE, ET ON LE VOIT.
 *
 * Sous l'ardoise, à chaque étape : quatre à six faits du tour en cours, denses
 * et tabulaires, en bleu donnée et en encre, sur le cockpit marine. ELLE NE
 * DÉFILE PAS en boucle : ce qui lui donne la vie, c'est l'écart de chaque fait
 * au tour passé, que `ChiffreQuiArrive` fait arriver au passage au tour suivant
 * (grammaire du lot 5B, pas une seconde). Chaque fait vient de la partie
 * (lib/faits-du-marche.ts) : rien n'est inventé, et un fait sans valeur du tour
 * passé est posé sans écart plutôt qu'avec un chiffre fabriqué.
 *
 * ELLE NE PARAÎT PAS SUR TÉLÉPHONE (`sm+` seulement). La décision y est un
 * PARCOURS en cartes, une à la fois : une bande en tête rognerait la hauteur
 * utile (règle du lot 3A, ≥ 520 px) et s'intercalerait entre l'ardoise et la
 * première carte du briefing — là où les gardes mobiles attendent un tiroir du
 * briefing, pas un bloc de marché. Le brief l'autorise (« replie-la sur
 * téléphone si besoin ») ; le marché y reste lisible dans le panneau « Le
 * marché » du contexte de décision (prix usuels, marché total, votre part). Sur
 * grand écran, où l'arène défile, la bande est à plat sous l'ardoise ; si elle
 * déborde en largeur, le défilement est MANUEL (overflow-x), jamais automatique.
 *
 * LES COULEURS SUIVENT LA CHARTE : le libellé et la valeur sont de
 * l'information (encre / blanc cassé, inversés par `.ardoise`) ; seul le SIGNE
 * de l'écart prend le vert ou le rouge, et l'accent de la donnée reste le bleu
 * `--donnee`. Aucune couleur n'est écrite ici qui ne soit un jeton de la maison.
 */

/** La mise en forme de l'écart, par unité : une fonction reste côté client. */
function formatEcart(unite: UniteDEcart): (n: number) => string {
  switch (unite) {
    case "euro":
      return (n) => `${n > 0 ? "+" : n < 0 ? MOINS : ""}${formatEuro(Math.abs(n))}`;
    case "points": {
      // L'écart de part de marché est une fraction : 0,02 → « +2,0 pts ».
      return (n) => {
        const pts = n * 100;
        const signe = pts > 0 ? "+" : pts < 0 ? MOINS : "";
        return `${signe}${Math.abs(pts).toFixed(1).replace(".", ",")} pts`;
      };
    }
    case "indice":
      return (n) => `${n > 0 ? "+" : n < 0 ? MOINS : ""}${Math.abs(n).toFixed(0)}`;
  }
}

function Fait({ fait }: { fait: FaitDuMarche }) {
  const e = fait.ecart;
  const signe = e ? (e.valeur > 0 ? "hausse" : e.valeur < 0 ? "baisse" : "plat") : null;
  // LE VERT ET LE ROUGE DISENT UN RÉSULTAT, PAS UNE DIRECTION (charte). Ils ne
  // vont qu'à l'écart dont le sens est une bonne ou une mauvaise nouvelle (la
  // part de marché) ; un prix du marché ou un indice de compétitivité-prix qui
  // baisse n'est ni l'un ni l'autre : son écart reste en bleu donnée, et la
  // flèche et le signe disent le sens.
  const jugeable = e?.lecture === "favorable-a-la-hausse";
  const couleurEcart = !jugeable
    ? ""
    : signe === "hausse"
      ? "text-emerald-400"
      : signe === "baisse"
        ? "text-red-400"
        : "text-slate-400";
  const fleche = signe === "hausse" ? "↑" : signe === "baisse" ? "↓" : "→";

  return (
    <div className="min-w-[8.5rem] shrink-0 px-3 py-2 sm:px-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{fait.libelle}</p>
      <p className="mt-0.5 flex items-baseline gap-2">
        <span className="text-lg font-semibold tabular-nums" style={{ color: "var(--donnee)" }}>
          {fait.valeur}
        </span>
        {e && signe !== "plat" ? (
          <span
            className={`whitespace-nowrap text-xs font-medium tabular-nums ${couleurEcart}`}
            style={jugeable ? undefined : { color: "var(--donnee)" }}
          >
            <span aria-hidden>{fleche} </span>
            <ChiffreQuiArrive
              valeur={e.valeur}
              depuis={e.depuis}
              memoire={`marche:${fait.cle}`}
              format={formatEcart(e.unite)}
            />
          </span>
        ) : null}
      </p>
      {fait.note ? <p className="mt-0.5 text-xs text-slate-400">{fait.note}</p> : null}
    </div>
  );
}

function Rangee({ faits }: { faits: FaitDuMarche[] }) {
  return (
    <div
      className="flex gap-x-1 gap-y-2 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/30 py-1 [scrollbar-width:thin] max-sm:snap-x sm:flex-wrap sm:overflow-visible"
      role="list"
      aria-label="Faits du marché ce tour, avec leur écart au tour passé"
    >
      {faits.map((f) => (
        <div role="listitem" key={f.cle} className="max-sm:snap-start">
          <Fait fait={f} />
        </div>
      ))}
    </div>
  );
}

export function BandeDeMarche({ faits }: { faits: FaitDuMarche[] }) {
  // Quatre à six faits : on en garde au plus six (les porteurs d'écart d'abord,
  // l'ordre est fixé par lib/faits-du-marche.ts). Rien à montrer : rien.
  const montres = faits.slice(0, 6);
  if (montres.length === 0) return null;

  return (
    // Grand écran seulement : sur téléphone, le parcours en cartes ne laisse pas
    // de place à une bande en tête sans rogner la hauteur utile (voir l'en-tête).
    <section aria-label="Le marché ce tour" className="-mt-2 hidden sm:block">
      <Rangee faits={montres} />
    </section>
  );
}
