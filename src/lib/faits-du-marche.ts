import { formatEuro, formatPercent, MOINS } from "@/lib/format";
import type { GameView } from "@/services/game-view.service";

/**
 * LES FAITS DU MARCHÉ VIENNENT TOUS DE LA PARTIE — RIEN N'EST INVENTÉ.
 *
 * La bande de marché (components/bande-de-marche.tsx) montre quatre à six faits
 * du tour en cours. Chacun est LU dans la vue de partie, jamais écrit en prose,
 * et son écart au tour passé n'existe QUE là où la vue expose vraiment la valeur
 * du tour passé. Là où elle ne l'expose pas, le fait est posé sans écart — on ne
 * fabrique pas un chiffre pour faire joli (charte : « le vert et le rouge pour le
 * seul signe d'un écart », donc pas d'écart sans donnée).
 *
 * CE QUI PORTE UN ÉCART RÉEL (periods[] garde le tour par tour) :
 *   · prix usuel du marché      — competitiveBenchmark.marketAvgPrice
 *   · votre part de marché      — competitiveBenchmark (ligne joueur).marketShare
 *   · indice de compétitivité   — competitiveBenchmark.competitivenessIndex
 * CE QUI EST POSÉ SANS ÉCART (la vue n'expose pas la valeur du tour passé) :
 *   · coût variable             — costFacts en mono-produit ; en gamme, la
 *                                 FOURCHETTE des références (gamme[]) — un seul
 *                                 chiffre mentirait (le tour passé n'est pas stocké)
 *   · conditions du crédit      — financeOffer / bankFile (idem)
 *   · saison / demande          — seasonNotes (coef du tour ; l'écart affiché est
 *                                 la déviation à une saison normale, pas un écart
 *                                 au tour passé, et c'est dit comme tel)
 *   · événement en cours        — courriersEnCours (fait, non chiffré)
 *   · rang                      — ranking (gated classement.revele ; le rang du
 *                                 tour passé n'est pas stocké)
 *
 * L'écart signé est la part VIVANTE du fait : la bande le fait arriver avec
 * `ChiffreQuiArrive` au passage au tour suivant. La valeur, elle, est toujours
 * écrite entière dès le rendu serveur.
 */

/** L'unité d'un écart, qui dit à la bande comment l'écrire au compteur. */
export type UniteDEcart = "euro" | "points" | "indice";

export interface FaitDuMarche {
  /** Clé stable (mémoire du compteur, clé React). */
  cle: string;
  /** Le libellé du fait, tel qu'il se lit. */
  libelle: string;
  /** La valeur du tour, écrite entière (toujours dans le DOM). */
  valeur: string;
  /**
   * L'écart au tour passé, part vivante du fait. `null` quand la vue n'expose
   * pas de valeur antérieure : on ne pose alors que la valeur.
   */
  ecart: {
    /** La valeur signée du moment (ce vers quoi le compteur monte). */
    valeur: number;
    /** D'où il part : la valeur du tour passé (le compteur monte de là). */
    depuis: number;
    /** Comment l'écrire. */
    unite: UniteDEcart;
    /**
     * Ce que dit le SENS de l'écart. « favorable-a-la-hausse » : monter est une
     * bonne nouvelle pour l'entreprise (sa part de marché), l'écart prend le
     * vert ou le rouge. « neutre » : le sens ne dit pas, à lui seul, si c'est bon
     * ou mauvais — un prix du marché qui baisse, un indice de compétitivité-prix
     * qui baisse (l'entreprise devient MOINS chère que le marché) — l'écart
     * s'écrit en bleu donnée, avec sa flèche et son signe, sans jugement.
     */
    lecture: "favorable-a-la-hausse" | "neutre";
  } | null;
  /** Une précision courte, posée sous la valeur (« vs saison normale »…). */
  note?: string;
}

function joueur(benchmark: NonNullable<GameView["competitiveBenchmark"]>) {
  return benchmark.competitors.find((c) => c.isPlayer) ?? null;
}

/**
 * Les faits du tour, dans l'ordre où la bande les montre : les porteurs d'écart
 * d'abord (c'est eux qui « font la vie »), puis les faits posés. La bande en
 * garde au plus six.
 */
export function faitsDuMarche(view: GameView): FaitDuMarche[] {
  const faits: FaitDuMarche[] = [];

  // Le dernier tour clos et celui d'avant : l'écart se lit entre les deux.
  const benchNow = view.competitiveBenchmark;
  const benchPrev = view.periods.at(-2)?.competitiveBenchmark ?? null;

  // ── Prix usuel du marché ──
  if (benchNow && benchNow.marketAvgPrice > 0) {
    const depuis = benchPrev && benchPrev.marketAvgPrice > 0 ? benchPrev.marketAvgPrice : null;
    faits.push({
      cle: "prix-marche",
      libelle: "Prix usuel du marché",
      valeur: formatEuro(benchNow.marketAvgPrice),
      ecart:
        depuis !== null
          ? {
              valeur: benchNow.marketAvgPrice - depuis,
              depuis: 0,
              unite: "euro",
              lecture: "neutre",
            }
          : null,
      note: "prix moyen pratiqué",
    });
  }

  // ── Votre part de marché ──
  if (benchNow) {
    const moi = joueur(benchNow);
    if (moi) {
      const moiPrev = benchPrev ? joueur(benchPrev) : null;
      const depuis = moiPrev ? moiPrev.marketShare : null;
      faits.push({
        cle: "part-marche",
        libelle: "Votre part de marché",
        valeur: formatPercent(moi.marketShare),
        // L'écart est en POINTS de pourcentage (0,02 → +2,0 pts).
        ecart:
          depuis !== null
            ? {
                valeur: moi.marketShare - depuis,
                depuis: 0,
                unite: "points",
                lecture: "favorable-a-la-hausse",
              }
            : null,
      });
    }
  }

  // ── Indice de compétitivité-prix ──
  if (benchNow && benchNow.competitivenessIndex > 0) {
    const depuis =
      benchPrev && benchPrev.competitivenessIndex > 0 ? benchPrev.competitivenessIndex : null;
    const now100 = benchNow.competitivenessIndex * 100;
    faits.push({
      cle: "indice-prix",
      libelle: "Indice de compétitivité-prix",
      valeur: now100.toFixed(0),
      ecart:
        depuis !== null
          ? { valeur: now100 - depuis * 100, depuis: 0, unite: "indice", lecture: "neutre" }
          : null,
      note: "100 = aligné sur le marché",
    });
  }

  // ── Saison / demande (déviation à une saison normale, pas écart au tour passé) ──
  const saison = view.seasonNotes.find((n) => n.name.toLowerCase().includes("march"))
    ? view.seasonNotes.find((n) => n.name.toLowerCase().includes("march"))!
    : view.seasonNotes[0];
  if (saison && Math.abs(saison.coef - 1) > 0.001) {
    const pts = Math.round((saison.coef - 1) * 100);
    faits.push({
      cle: "saison",
      libelle: "Demande de saison",
      valeur: `${pts > 0 ? "+" : pts < 0 ? MOINS : ""}${Math.abs(pts)} %`,
      ecart: null,
      note: "vs saison normale",
    });
  }

  // ── Coût variable unitaire ──
  // EN GAMME, UNE FOURCHETTE : chaque référence a son coût, et `costFacts` ne
  // porte que celui de la première. Un seul chiffre mentirait (le contexte de
  // décision le dit déjà) ; on écrit l'étendue de la gamme, du moins cher au plus
  // cher. En mono-produit, le chiffre unique.
  const coutsGamme = (view.gamme ?? [])
    .map((r) => r.materialCostPerUnit + r.otherVariableCostPerUnit)
    .filter((c) => c > 0);
  if (coutsGamme.length > 1) {
    const min = Math.min(...coutsGamme);
    const max = Math.max(...coutsGamme);
    faits.push({
      cle: "cout-variable",
      libelle: "Coût variable par référence",
      valeur: min === max ? formatEuro(min) : `${formatEuro(min)} – ${formatEuro(max)}`,
      ecart: null,
      note: `${coutsGamme.length} références`,
    });
  } else {
    const coutVariable =
      view.costFacts.materialCostPerUnit + view.costFacts.otherVariableCostPerUnit;
    if (coutVariable > 0) {
      faits.push({
        cle: "cout-variable",
        libelle: "Coût variable unitaire",
        valeur: formatEuro(coutVariable),
        ecart: null,
        note: "matières + autres charges",
      });
    }
  }

  // ── Conditions du crédit ──
  const tauxEmprunt = view.financeOffer?.loanAnnualRate ?? null;
  const tauxDecouvert = view.bankFile?.overdraftAnnualRate ?? null;
  const taux = tauxEmprunt ?? tauxDecouvert;
  if (taux !== null) {
    faits.push({
      cle: "credit",
      libelle: tauxEmprunt !== null ? "Taux d'emprunt" : "Taux de découvert",
      valeur: formatPercent(taux),
      ecart: null,
      note: "par an",
    });
  }

  // ── Événement en cours ──
  const enCours = view.courriersEnCours.filter((c) => c.isMyTeam || c.teamId === null);
  if (enCours.length > 0) {
    const prochaineFin = Math.min(...enCours.map((c) => c.roundsLeft));
    faits.push({
      cle: "evenement",
      libelle: enCours.length > 1 ? "Événements en cours" : "Événement en cours",
      valeur: String(enCours.length),
      ecart: null,
      note: prochaineFin <= 1 ? "se referme ce tour" : `${prochaineFin} tours restants`,
    });
  }

  // ── Rang ──
  if (view.classement.revele) {
    const moi = view.ranking.find((r) => r.isPlayer);
    if (moi) {
      faits.push({
        cle: "rang",
        libelle: "Votre rang",
        valeur: `${moi.rank}ᵉ / ${view.ranking.length}`,
        ecart: null,
        note: "résultat cumulé",
      });
    }
  }

  return faits;
}
