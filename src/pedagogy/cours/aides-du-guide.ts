import type { Vue } from "@/config/cours/types";
import { lireNombre } from "./correcteur";
import { natureDuChamp, type NatureDuNombre, type NombreACalculer } from "./deux-decimales";

/*
 * LES AIDES DU GUIDE D'UN CHAPITRE (audit UX du 29 octobre 2026) : des fonctions pures que
 * components/cours/chapitre-guide.tsx appelle, testées sans navigateur.
 */

/** Un champ de calcul refusé : son libellé, ce qu'il calcule, et si l'écart vient de la précision. */
export interface ChampRefuse {
  libelle: string;
  nature: NatureDuNombre;
  /** Le bon calcul arrêté trop tôt (`manqueDeDecimales`). */
  imprecis: boolean;
}

/**
 * OÙ REPRENDRE DES MONTANTS FAUX (audit UX du 29 octobre 2026, P2-2).
 *
 * Le message était le même pour toutes les étapes de montants : « Reprenez-les à partir du
 * journal ». Or la paie (« La paie de janvier ») part du brut et des taux de l'énoncé, pas du
 * journal, comme bien d'autres calculs. Le chapitre ne dit pas d'où partent ses montants
 * (config/cours/types.ts, `EtapeMontants`, hors de ce correctif) : le message renvoie à ce
 * que l'étape montre vraiment, l'énoncé, et les comptes quand elle les affiche (`vue`).
 *
 * CE QUI EST FAUX, DIT JUSTE (audit UX du 11 novembre 2026, P2-5) : un taux, une durée, une quantité
 * ne sont pas des montants, le message dit alors « valeur » ; et quand l'écart vient de la précision
 * (« 54,5 » pour 54,55 %), il dit « Arrondissez à 2 décimales » plutôt que de faire refaire le calcul.
 */
export function phraseDeReprise(faux: readonly ChampRefuse[], vue: Vue | undefined): string {
  const n = faux.length;
  const montants = faux.every((f) => f.nature === "montant");
  const constat = montants
    ? n === 1
      ? "Un montant ne convient pas encore."
      : "Des montants ne conviennent pas encore."
    : n === 1
      ? "Une valeur ne convient pas encore."
      : "Des valeurs ne conviennent pas encore.";
  const imprecis = faux.filter((f) => f.imprecis);
  if (n > 0 && imprecis.length === n) return `${constat} ${n === 1 ? "Arrondissez à 2 décimales." : "Arrondissez-les à 2 décimales."}`;
  const ou = vue ? "Reprenez-les à partir de l'énoncé et des comptes affichés." : "Reprenez-les à partir des données de l'énoncé.";
  if (imprecis.length === 0) return `${constat} ${ou}`;
  return `${constat} ${ou} Arrondissez à 2 décimales : ${imprecis.map((f) => f.libelle).join(", ")}.`;
}

const multipleDe = (x: number, pas: number) => Math.abs(x / pas - Math.round(x / pas)) < 1e-6;

/**
 * L'ÉCART QUI VIENT DE LA PRÉCISION (audit UX du 11 novembre 2026, P2-5). « 54,5 » pour 54,55 % recevait
 * le message d'un calcul faux, sans dire qu'il manquait une décimale. Un montant, un pourcentage ou une
 * grandeur se calcule à deux décimales (pedagogy/cours/deux-decimales.ts) : écrit avec moins de deux
 * décimales et à moins d'une unité de son dernier chiffre de l'attendu (ou de l'autre chemin), le nombre
 * est le bon calcul arrêté trop tôt : 54,5 ou 54,6 pour 54,55, 55 ou 54 pour 54,55. Un attendu qui
 * s'écrit lui-même avec aussi peu de décimales n'est pas dans ce cas. Une quantité et un coefficient
 * suivent leur propre règle.
 */
export function manqueDeDecimales(
  texte: string,
  champ: Pick<NombreACalculer, "libelle" | "attendu" | "autreChemin" | "nature" | "unite">,
): boolean {
  const nature = natureDuChamp(champ);
  if (nature !== "montant" && nature !== "pourcentage" && nature !== "grandeur") return false;
  const x = lireNombre(texte);
  if (x === null || Number.isNaN(x)) return false;
  const decimales = /[.,](\d+)\D*$/.exec(texte.trim())?.[1]?.length ?? 0;
  if (decimales >= 2) return false;
  const pas = 10 ** -decimales;
  return [champ.attendu, champ.autreChemin].some((a) => a !== undefined && !multipleDe(a, pas) && Math.abs(x - a) < pas);
}

/** Ce qu'un champ refusé dit à l'enseignant (en classe) : ce qui n'allait pas, dans les mots du message. */
export const remarqueDuChampRefuse = (c: ChampRefuse) =>
  `${c.libelle} : ${c.imprecis ? "pas assez de décimales" : c.nature === "montant" ? "montant faux" : "valeur fausse"}`;

/**
 * UN SEUL « NON » (audit UX du 11 novembre 2026, P2-5). Le retour d'une option fausse s'ouvrait sur
 * « Non · », et le texte du chapitre commence souvent lui-même par « Non : » : l'élève lisait
 * « Non · Non : 100 € est ce que… ». Quand le texte dit déjà non, le « Non » en gras est le sien.
 */
export function verdictDuRetour(juste: boolean, retour: string): { verdict: string; suite: string } {
  if (!juste && /^Non\b/u.test(retour)) return { verdict: "Non", suite: retour.slice(3) };
  return { verdict: juste ? "Juste · " : "Non · ", suite: retour };
}

/**
 * « SOLUTION MONTRÉE », PAS « DÉFI RELEVÉ » (audit UX du 11 novembre 2026, P2-5). L'explication d'un
 * laboratoire est écrite pour la réussite : « Défi relevé : 75 € nets de plus demandent… ». Quand l'élève
 * a demandé la solution, la même explication s'ouvre sur « Solution montrée : 75 € nets de plus… ». Les
 * textes du cours ne changent pas : le guide change l'ouverture, à l'affichage. Une explication qui
 * commence autrement (« À 4,25 % sur 5 ans… ») prend la même ouverture, son premier mot en minuscule
 * quand ce n'est ni un sigle ni un nom écrit avec une capitale intérieure (« NOVA », « AsiaComponents »).
 */
export function explicationDeLaSolutionMontree(textes: readonly string[]): string[] {
  if (textes.length === 0) return [];
  const [premier, ...suite] = textes;
  // « Défi relevé : … », ou « Défi relevé. » suivi d'une phrase.
  const reste = premier!.replace(/^Défi relevé\s*[:.]\s*/u, "");
  const mot = reste.split(/[\s'’,]/u)[0] ?? "";
  const ordinaire = /^\p{Lu}[^\p{Lu}]*$/u.test(mot);
  const ouvert = ordinaire ? reste.charAt(0).toLocaleLowerCase("fr-FR") + reste.slice(1) : reste;
  return [`Solution montrée : ${ouvert}`, ...suite];
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

/** Où en est l'élève sur un objectif du chapitre, à la fin. */
export type EtatDeLObjectif = "acquis" | "en-cours" | "a-revoir";

export const LIBELLE_DE_L_ETAT: Record<EtatDeLObjectif, string> = {
  acquis: "Acquis",
  "en-cours": "En cours",
  "a-revoir": "À revoir",
};

/**
 * LA RÈGLE D'ACQUISITION, dite à l'élève à la fin du chapitre : une seule phrase par état, la
 * même que celle que `bilanDesObjectifs` applique.
 */
export const REGLE_D_ACQUISITION: Record<EtatDeLObjectif, string> = {
  acquis: "toutes ses étapes réussies du premier coup.",
  "en-cours": "toutes ses étapes réussies par vous, mais au moins une après une erreur.",
  "a-revoir": "au moins une étape réussie avec la correction, ou pas encore réussie.",
};

/**
 * LE BILAN OBJECTIF PAR OBJECTIF (demande du propriétaire, octobre 2026). Chaque étape notée dit
 * les objectifs qu'elle travaille (`objectifs`, config/cours/types.ts). Un objectif est :
 *   · acquis, si toutes ses étapes notées sont réussies du premier coup, sans la correction ;
 *   · en cours, si elles sont toutes réussies sans la correction, au moins une après une erreur ;
 *   · à revoir, si l'une a été réussie avec la correction, ou ne l'est pas encore.
 * Chaque objectif porte ses étapes à revoir (celles qui ne sont pas du premier coup), dans
 * l'ordre du chapitre, avec leur rang pour y revenir. Un objectif sans étape notée dans cette
 * entreprise (une étape absente du cas) n'a pas d'état : `etat` vaut null.
 *
 * Null quand aucune étape du chapitre ne dit ses objectifs (une situation, écrite sans eux) : la
 * fin garde alors la liste des objectifs et celle des étapes à revoir.
 */
export function bilanDesObjectifs(
  objectifs: readonly string[],
  etapes: readonly { id: string; titre: string; type: string; objectifs?: readonly number[] }[],
  suivi: Readonly<Record<string, { essais: number; reussi: boolean; aide: boolean } | undefined>>,
): { objectif: string; etat: EtatDeLObjectif | null; aRevoir: { id: string; titre: string; index: number }[] }[] | null {
  if (!etapes.some((e) => e.type !== "lecture" && e.objectifs?.length)) return null;
  return objectifs.map((objectif, k) => {
    const siennes = etapes.flatMap((e, index) => (e.type !== "lecture" && e.objectifs?.includes(k) ? [{ e, index }] : []));
    const etats = siennes.map(({ e }) => {
      const s = suivi[e.id];
      if (!s || !s.reussi || s.aide) return "a-revoir" as const;
      return s.essais <= 1 ? ("acquis" as const) : ("en-cours" as const);
    });
    const etat: EtatDeLObjectif | null =
      siennes.length === 0 ? null : etats.includes("a-revoir") ? "a-revoir" : etats.includes("en-cours") ? "en-cours" : "acquis";
    const aRevoir = siennes.filter((_, i) => etats[i] !== "acquis").map(({ e, index }) => ({ id: e.id, titre: e.titre, index }));
    return { objectif, etat, aRevoir };
  });
}
