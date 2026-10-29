import type { Vue } from "@/config/cours/types";

/*
 * LES AIDES DU GUIDE D'UN CHAPITRE (audit UX du 29 octobre 2026) : des fonctions pures que
 * components/cours/chapitre-guide.tsx appelle, testées sans navigateur.
 */

/**
 * OÙ REPRENDRE DES MONTANTS FAUX (audit UX du 29 octobre 2026, P2-2).
 *
 * Le message était le même pour toutes les étapes de montants : « Reprenez-les à partir du
 * journal ». Or la paie (« La paie de janvier ») part du brut et des taux de l'énoncé, pas du
 * journal, comme bien d'autres calculs. Le chapitre ne dit pas d'où partent ses montants
 * (config/cours/types.ts, `EtapeMontants`, hors de ce correctif) : le message renvoie à ce
 * que l'étape montre vraiment, l'énoncé, et les comptes quand elle les affiche (`vue`).
 */
export function phraseDeReprise(faux: number, vue: Vue | undefined): string {
  const constat = faux === 1 ? "Un montant ne convient pas encore." : "Des montants ne conviennent pas encore.";
  const ou = vue ? "Reprenez-les à partir de l'énoncé et des comptes affichés." : "Reprenez-les à partir des données de l'énoncé.";
  return `${constat} ${ou}`;
}

/**
 * LE GRAND PAS D'UN CURSEUR AU CLAVIER (audit UX, P2-3). La flèche avance d'une unité : sur
 * une plage de 120 000 €, un euro par touche. Page haut / Page bas (et Maj + flèche) avancent
 * d'une puissance de dix proche du centième de la plage : 1 000 € pour 120 000 €, 1 pour 200.
 */
export function grandPasDuCurseur(min: number, max: number): number {
  const centieme = (max - min) / 100;
  return centieme < 1 ? 1 : 10 ** Math.floor(Math.log10(centieme));
}

/**
 * UN MONTANT QUI NE SE COUPE PAS (audit UX, P2-4) : « 150 000 » puis « € » seul à la ligne
 * sur téléphone. L'espace avant l'unité devient insécable, le signe moins typographique.
 */
export const montantInsecable = (ecrit: string): string => ecrit.replace(/^-/, "−").replace(/ (\S+)$/, " $1");

/**
 * LE BILAN HONNÊTE DE FIN DE CHAPITRE (audit UX, P1-10). « Ce que vous savez faire » suivait
 * « 1 étape réussie du premier coup sur 27 » : l'élève qui avait tout vu en correction était
 * félicité comme s'il maîtrisait. Les étapes notées qui n'ont pas été réussies du premier coup
 * sont « à revoir », dans l'ordre du chapitre, avec leur rang pour y revenir.
 */
export function etapesARevoir(
  etapes: readonly { id: string; titre: string; type: string }[],
  suivi: Readonly<Record<string, { essais: number; reussi: boolean; aide: boolean } | undefined>>,
): { id: string; titre: string; index: number }[] {
  return etapes.flatMap((e, index) => {
    if (e.type === "lecture") return [];
    const s = suivi[e.id];
    const premierCoup = !!s && s.reussi && s.essais === 1 && !s.aide;
    return premierCoup ? [] : [{ id: e.id, titre: e.titre, index }];
  });
}
