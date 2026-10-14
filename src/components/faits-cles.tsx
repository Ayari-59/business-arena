import type { GameView } from "@/services/game-view.service";

/**
 * Les trois ou quatre faits qui cadrent le tour, sur une ligne : combien de
 * références, ce que l'atelier peut sortir, et ce qui limite.
 *
 * Ils sont LUS dans la partie jouée, jamais écrits en prose. La périodicité
 * redimensionne les capacités et l'enseignant peut les changer à la création :
 * un chiffre écrit dans un texte deviendrait faux sans prévenir.
 */
export function FaitsCles({
  capacityFacts,
  vocabulary,
  gamme,
}: {
  capacityFacts: GameView["capacityFacts"];
  vocabulary: GameView["vocabulary"];
  gamme: GameView["gamme"];
}) {
  const nombre = (n: number) => Math.round(n).toLocaleString("fr-FR");

  // La capacité manque tant que l'état de l'entreprise n'existe pas encore. On
  // dit alors ce qu'on sait (la gamme) plutôt que d'inventer un plafond.
  const faitsCapacite = capacityFacts
    ? [
        // Le plafond réel est le plus bas des deux : produire au-delà ne se peut
        // pas, quel que soit l'autre.
        `${nombre(Math.min(capacityFacts.machineCapacity, capacityFacts.laborCapacity))} ${vocabulary.units} au plus`,
        capacityFacts.bottleneck === "machine"
          ? "la machine limite"
          : capacityFacts.bottleneck === "labor"
            ? "la main-d'œuvre limite"
            : "machine et main-d'œuvre à l'équilibre",
      ]
    : [];

  const faits = [...(gamme ? [`${gamme.length} références`] : []), ...faitsCapacite];

  // Rien de sûr à dire : mieux vaut pas de ligne qu'une ligne vide.
  if (faits.length === 0) return null;

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
      {faits.map((f, i) => (
        <span key={f} className="flex items-center gap-2">
          {i > 0 ? (
            <span aria-hidden className="text-slate-400">
              ·
            </span>
          ) : null}
          {f}
        </span>
      ))}
    </p>
  );
}
