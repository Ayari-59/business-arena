import type { AnalyseDuManque } from "@/engine/estimation/manque";
import { formatDecimal, formatUnits } from "@/lib/format";

/**
 * LES PHRASES DE L'ALERTE DE MANQUE, à partir de l'analyse du moteur
 * (`engine/estimation/manque.ts`). Les mêmes sur ordinateur (le cadran) et sur
 * téléphone (le tiroir de la ligne estimée). Fonctions pures.
 */

// ---------------------------------------------------------------------------

export interface PhrasesDuManque {
  /** « Vous ne pourrez livrer que … » */
  constat: string;
  /** Ce qui limite, la cause la plus contraignante d'abord ; en gamme, ce qui manque par référence. */
  causes: string[];
  /** Quoi faire, une phrase. */
  conseil: string | null;
}

const liste = (mots: string[]) =>
  mots.length <= 1 ? (mots[0] ?? "") : `${mots.slice(0, -1).join(", ")} et ${mots.at(-1)!}`;

const SEUIL = 0.5;

const pourcent = (x: number) => `${formatDecimal(x * 100, 2)} %`;

/**
 * Les phrases de l'alerte, en français simple, dans le vocabulaire du métier
 * (« enceintes », « couverts »). Fonction pure.
 */
export function phrasesDuManque(
  a: AnalyseDuManque,
  v: { unit: string; units: string },
): PhrasesDuManque {
  const u = (n: number) => `${formatUnits(n)} ${Math.round(n) > 1 ? v.units : v.unit}`;
  const constat = `Vous ne pourrez livrer que ${u(a.livrables)} : ${formatUnits(a.manquantes)} de vos ventes estimées manqueraient.`;
  const causes: string[] = [];
  const capacite = (raison: string) =>
    `Ce tour, votre atelier peut produire environ ${u(a.capaciteDuTour ?? 0)}, pas ${formatUnits(a.demandeALAtelier)} : ${raison}.`;

  for (const l of a.limites) {
    const nomsTouches = l.references.map((r) => r.nom);
    switch (l.cause) {
      case "main-d-oeuvre":
        causes.push(
          capacite(
            a.effectif > 1
              ? `vos ${formatUnits(a.effectif)} salariés n'ont pas assez d'heures`
              : "votre salarié n'a pas assez d'heures",
          ),
        );
        break;
      case "machines":
        causes.push(
          capacite(
            a.disponibilite < 0.995
              ? `vos machines ne sont disponibles qu'à ${pourcent(a.disponibilite)}`
              : "vos machines tournent déjà à plein",
          ),
        );
        break;
      case "approvisionnement":
        if (!a.gamme) {
          causes.push(capacite("une rupture d'approvisionnement arrête une partie de la production"));
          break;
        }
        for (const f of a.approvisionnement.filter((x) => nomsTouches.includes(x.nom))) {
          causes.push(
            f.rupture
              ? `Le fournisseur de ${f.nom} est en rupture : il ampute son plan de production.`
              : `Le fournisseur de ${f.nom} vous rationne : il ne livre que ${pourcent(f.rationnement)} des composants.`,
          );
        }
        break;
      case "plan":
        for (const r of a.references.filter((x) => l.references.some((y) => y.code === x.code))) {
          causes.push(
            `Votre plan de ${a.gamme ? r.nom : "production"}, stock compris, ne couvre que ${u(r.couverture)} sur les ${formatUnits(r.estimees)} de vos ventes estimées.`,
          );
        }
        break;
      case "non-lancee":
        causes.push(
          nomsTouches.length > 1
            ? `Vos références ${liste(nomsTouches)} ne sont pas encore lancées : elles ne se produisent pas ce tour.`
            : `Votre référence ${nomsTouches[0]} n'est pas encore lancée : elle ne se produit pas ce tour.`,
        );
        break;
      case "rebuts":
        causes.push(`Les rebuts retirent environ ${u(l.unites)} de votre production.`);
        break;
    }
  }
  if (a.gamme) {
    causes.push(
      `Il manquerait ${liste(a.references.map((r) => `${formatUnits(r.manquantes)} ${r.nom}`))}.`,
    );
  }
  return { constat, causes, conseil: conseilDuManque(a, u) };
}

function conseilDuManque(a: AnalyseDuManque, u: (n: number) => string): string | null {
  const premiere = a.limites[0];
  if (!premiere) return null;
  const ceTour = a.gamme
    ? "Pour livrer plus, baissez un plan de production"
    : "Ce tour, ramenez vos ventes estimées à ce que l'atelier peut produire";
  switch (premiere.cause) {
    case "main-d-oeuvre":
      return a.gamme && a.plusLongueAProduire
        ? `Pour livrer plus, baissez un plan de production, d'abord celui de ${a.plusLongueAProduire}, la référence la plus longue à produire ; une embauche ne compterait qu'au tour suivant.`
        : `${ceTour} ; une embauche ne compterait qu'au tour suivant.`;
    case "machines":
      return a.disponibilite < 0.995
        ? `${ceTour} ; un meilleur entretien relèvera la disponibilité au tour suivant.`
        : `${ceTour} ; une machine achetée n'arriverait qu'au tour suivant.`;
    case "plan": {
      const monter =
        premiere.references.length > 1
          ? "Pour livrer plus, montez ces plans de production"
          : "Pour livrer plus, montez ce plan de production";
      // Monter le plan au-delà de ce que l'atelier peut produire ne livrerait rien de plus.
      return a.demandeALAtelier + premiere.unites > a.capaciteAtelier + SEUIL
        ? `${monter}, dans la limite de votre atelier : environ ${u(a.capaciteAtelier)} ce tour.`
        : `${monter}.`;
    }
    case "non-lancee":
      return premiere.references.length > 1
        ? "Ramenez leurs ventes estimées à zéro : elles ne se vendront qu'une fois leur R&D couverte."
        : "Ramenez ses ventes estimées à zéro : elle ne se vendra qu'une fois sa R&D couverte.";
    case "approvisionnement":
      return a.gamme
        ? "Pour livrer plus, choisissez un autre fournisseur ou baissez les ventes estimées de cette référence."
        : "Pour livrer plus, choisissez un autre fournisseur ou ramenez vos ventes estimées à cette capacité.";
    case "rebuts":
      return "Un budget qualité plus élevé réduirait les rebuts.";
  }
}

/** L'alerte entière, en un seul texte (la barre du téléphone le transporte tel quel). */
export function alerteDuManque(a: AnalyseDuManque, v: { unit: string; units: string }): string {
  const p = phrasesDuManque(a, v);
  return [p.constat, ...p.causes, ...(p.conseil ? [p.conseil] : [])].join(" ");
}
