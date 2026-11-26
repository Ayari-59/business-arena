import { referentielDeCitation } from "@/config/ateliers/referentiels";
import { FORMATIONS, formationParCode } from "@/config/formations";
import { chapitresDuParcoursDansLOrdre, coursDuDiplome, ordreDApprentissage, type CoursDuDiplome } from "@/config/cours/par-diplome";
import { formationDuParcours, titreDuParcours } from "@/config/cours/parcours-a-choisir";
import { PARCOURS } from "@/config/cours/parcours";
import { CHAPITRES } from "@/config/cours/registre";
import { themeDuChapitre } from "@/config/cours/themes";
import type { Chapitre } from "@/config/cours/types";
import { MOT_DE_L_ACCES, type AccesDuSuivant, type NavigationDuChapitre, type PasDuFil, type SuiteDuParcours } from "./mots-de-la-navigation";

export { MOT_DE_L_ACCES, type AccesDuSuivant, type NavigationDuChapitre, type PasDuFil, type SuiteDuParcours };

/**
 * L'ÉLÈVE SAIT OÙ IL EN EST ET OÙ ALLER ENSUITE (chantier validé par le propriétaire après l'audit du
 * cours du 25 novembre 2026, usage 1.2 à 1.5).
 *
 *  · L'ÉTAT D'UN CHAPITRE se lit sur la progression déjà enregistrée (`cours_progressions`, celle que
 *    la page du chapitre relit au serveur) : aucune donnée nouvelle. Pas de ligne : à faire ; l'étape
 *    atteinte au bout du chapitre : fait ; sinon en cours, à l'étape qui attend l'élève.
 *  · LE PARCOURS DE RÉFÉRENCE d'un chapitre : celui de la classe de l'élève quand il en est, sinon le
 *    cours du diplôme d'où il vient (`?diplome=`), sinon celui de son propre diplôme, sinon le premier
 *    diplôme dont la page le présente, sinon son parcours du registre (les chapitres de seconde, du CAP,
 *    de la logistique). Chaque chapitre en a un : il a un suivant, ou il est le dernier, et la fin le
 *    dit. Le fil d'Ariane et le bouton « Retour » mènent à la même liste.
 *
 * Tout est pur ici ; l'accès du chapitre suivant (licence, libération) se lit au serveur, par la page.
 */

/** L'état d'un chapitre pour l'élève. `etape` est l'étape qui l'attend, de 1 à `etapes`. */
export type EtatDuChapitre = { etat: "fait" } | { etat: "en-cours"; etape: number; etapes: number } | { etat: "a-faire" };

/** Ce qui suffit d'une progression enregistrée : l'étape atteinte (0 au début, le nombre d'étapes à la fin). */
export interface ProgressionResumee {
  etape: number;
}

export function etatDuChapitre(progression: ProgressionResumee | null | undefined, nombreDEtapes: number): EtatDuChapitre {
  if (!progression) return { etat: "a-faire" };
  if (progression.etape >= nombreDEtapes) return { etat: "fait" };
  return { etat: "en-cours", etape: Math.max(0, progression.etape) + 1, etapes: nombreDEtapes };
}

/** L'état en clair, à côté du titre : « fait », « en cours, étape 4 sur 9 », « à faire ». */
export function etatEnClair(e: EtatDuChapitre): string {
  if (e.etat === "fait") return "fait";
  if (e.etat === "en-cours") return `en cours, étape ${e.etape} sur ${e.etapes}`;
  return "à faire";
}

/** Le geste que propose le bouton : « Reprendre, étape 4 sur 9 », « Commencer », « Revoir ». */
export function gesteDuChapitre(e: EtatDuChapitre): string {
  if (e.etat === "fait") return "Revoir";
  if (e.etat === "en-cours") return `Reprendre, étape ${e.etape} sur ${e.etapes}`;
  return "Commencer";
}

/** Une ligne de la liste de l'élève : un chapitre, son état, et quand sa progression a bougé la dernière fois. */
export interface ChapitreEtSonEtat {
  code: string;
  etat: EtatDuChapitre;
  /** La dernière remontée de sa progression ; absente pour un chapitre à faire. */
  majLe?: Date | null;
}

/**
 * LE CHAPITRE DU BOUTON DE « MA CLASSE ». Le chapitre en cours le plus récemment touché ; à défaut, celui
 * que la classe propose de commencer (`propose` : le dernier libéré, ou le premier ouvert du parcours)
 * s'il n'est pas déjà fait, sinon le premier à faire de la liste ; tout est fait : le plus récent, à revoir.
 * Null pour une liste vide.
 */
export function chapitreDuBouton(lignes: readonly ChapitreEtSonEtat[], propose: string | null): ChapitreEtSonEtat | null {
  if (lignes.length === 0) return null;
  const date = (l: ChapitreEtSonEtat) => l.majLe?.getTime() ?? 0;
  const plusRecent = (xs: ChapitreEtSonEtat[]) => xs.reduce((a, b) => (date(b) > date(a) ? b : a));
  const enCours = lignes.filter((l) => l.etat.etat === "en-cours");
  if (enCours.length > 0) return plusRecent(enCours);
  const proposee = lignes.find((l) => l.code === propose);
  if (proposee && proposee.etat.etat !== "fait") return proposee;
  const aFaire = lignes.find((l) => l.etat.etat === "a-faire");
  if (aFaire) return aFaire;
  return plusRecent([...lignes]);
}

/** L'état d'un bloc de la liste d'un diplôme : tous ses chapitres faits, aucun touché, ou entre les deux. */
export type EtatDuBloc = { etat: "fait" } | { etat: "a-faire" } | { etat: "en-cours"; faits: number; sur: number };

export function etatDuBloc(etats: readonly EtatDuChapitre[]): EtatDuBloc | null {
  if (etats.length === 0) return null;
  const faits = etats.filter((e) => e.etat === "fait").length;
  if (faits === etats.length) return { etat: "fait" };
  if (faits === 0 && etats.every((e) => e.etat === "a-faire")) return { etat: "a-faire" };
  return { etat: "en-cours", faits, sur: etats.length };
}

export function etatDuBlocEnClair(e: EtatDuBloc): string {
  if (e.etat === "fait") return "fait";
  if (e.etat === "a-faire") return "à faire";
  return `en cours, ${e.faits} fait${e.faits > 1 ? "s" : ""} sur ${e.sur}`;
}

/**
 * LE BLOC OUVERT D'UNE LISTE PLIÉE : celui du chapitre en cours le plus récent, sinon le premier qui a un
 * chapitre pas encore fait, sinon le premier qui a des chapitres. Sans progression (un visiteur), le
 * premier bloc qui a des chapitres. -1 : aucun bloc n'a de chapitre.
 */
export function blocOuvert(blocs: readonly (readonly ChapitreEtSonEtat[])[]): number {
  const date = (l: ChapitreEtSonEtat) => l.majLe?.getTime() ?? 0;
  let recent: { bloc: number; quand: number } | null = null;
  blocs.forEach((lignes, k) => {
    for (const l of lignes) if (l.etat.etat === "en-cours" && (!recent || date(l) > recent.quand)) recent = { bloc: k, quand: date(l) };
  });
  if (recent) return (recent as { bloc: number }).bloc;
  const pasFait = blocs.findIndex((lignes) => lignes.some((l) => l.etat.etat !== "fait"));
  if (pasFait >= 0) return pasFait;
  return blocs.findIndex((lignes) => lignes.length > 0);
}

/* ------------------------------------------------------------------------------------------------ */
/* Le parcours de référence d'un chapitre                                                            */
/* ------------------------------------------------------------------------------------------------ */

export interface ParcoursDeReference {
  /** D'où vient l'ordre : la classe de l'élève, un diplôme, ou le parcours du registre. */
  genre: "classe" | "diplome" | "parcours";
  /** Le diplôme, pour le genre « diplome » : que les liens vers le suivant portent (`&diplome=`). */
  diplome: string | null;
  /** Le nom du parcours, dans la phrase de fin : « BTS CG », « Bac STMG · Mercatique »… */
  titre: string;
  /** Les chapitres du parcours, dans l'ordre d'apprentissage. */
  chapitres: readonly Chapitre[];
  /** Le fil d'Ariane, sans le chapitre lui-même. */
  fil: readonly PasDuFil[];
  /** Le bouton « Retour » : la classe, ou la liste d'où l'élève vient, à la place du chapitre. */
  retour: { href: string; libelle: string };
}

/** Le contexte d'un chapitre : la classe de l'élève (son parcours), et le diplôme de l'adresse. */
export interface ContexteDeNavigation {
  classe?: { parcours: string | null } | null;
  diplome?: string | null;
}

const COURS: PasDuFil = { libelle: "Cours", href: "/cours" };
export const LIEN_DE_MA_CLASSE = "/cours#ma-classe";
/** L'ancre d'un chapitre et d'un bloc, dans la liste d'un diplôme (src/app/cours/page.tsx). */
export const ancreDuChapitre = (code: string) => `chapitre-${code}`;
export const ancreDuBloc = (rang: number) => `bloc-${rang + 1}`;

/** Le cours d'un diplôme, dans l'ordre, et le bloc de chaque chapitre : calculés une fois par diplôme. */
const DIPLOMES = new Map<string, { cours: CoursDuDiplome; ordre: Chapitre[]; bloc: Map<string, number> } | null>();
function diplomeEnOrdre(code: string) {
  if (!DIPLOMES.has(code)) {
    const cours = coursDuDiplome(code);
    if (!cours) DIPLOMES.set(code, null);
    else {
      const lignes = cours.blocs.flatMap((b, k) => b.chapitres.map((l) => ({ l, k })));
      DIPLOMES.set(code, {
        cours,
        ordre: [...lignes].sort((a, b) => a.l.rang - b.l.rang).map((x) => x.l.chapitre),
        bloc: new Map(lignes.map((x) => [x.l.chapitre.code, x.k])),
      });
    }
  }
  return DIPLOMES.get(code)!;
}

const PARCOURS_EN_ORDRE = new Map<string, Chapitre[]>();
function parcoursEnOrdre(code: string): Chapitre[] {
  if (!PARCOURS_EN_ORDRE.has(code)) PARCOURS_EN_ORDRE.set(code, chapitresDuParcoursDansLOrdre(code));
  return PARCOURS_EN_ORDRE.get(code)!;
}

/** Le diplôme d'où le chapitre se lit : l'adresse, son parcours, le premier référentiel qu'il cite, puis tous. */
function diplomeDuChapitre(chapitre: Chapitre, demande: string | null | undefined): string | null {
  const candidats = [
    demande,
    formationDuParcours(chapitre.parcours),
    ...chapitre.blocs.map((b) => referentielDeCitation(b)?.code),
    ...FORMATIONS.map((f) => f.code),
  ];
  for (const f of candidats) if (f && diplomeEnOrdre(f)?.bloc.has(chapitre.code)) return f;
  return null;
}

export function parcoursDeReference(chapitre: Chapitre, contexte: ContexteDeNavigation = {}): ParcoursDeReference {
  // La classe de l'élève, quand le chapitre est de son parcours.
  const parcoursDeLaClasse = contexte.classe?.parcours;
  if (parcoursDeLaClasse) {
    const chapitres = parcoursEnOrdre(parcoursDeLaClasse);
    if (chapitres.some((c) => c.code === chapitre.code)) {
      return {
        genre: "classe",
        diplome: null,
        titre: titreDuParcours(parcoursDeLaClasse) ?? "de votre classe",
        chapitres,
        fil: [{ libelle: "Ma classe", href: LIEN_DE_MA_CLASSE }],
        retour: { href: LIEN_DE_MA_CLASSE, libelle: "Retour à ma classe" },
      };
    }
  }
  // Un diplôme dont la page présente le chapitre.
  const diplome = diplomeDuChapitre(chapitre, contexte.diplome);
  if (diplome) {
    const d = diplomeEnOrdre(diplome)!;
    const sigle = formationParCode(diplome)?.sigle ?? diplome;
    const rang = d.bloc.get(chapitre.code)!;
    const bloc = d.cours.blocs[rang]!;
    const liste = `/cours?diplome=${diplome}`;
    return {
      genre: "diplome",
      diplome,
      titre: sigle,
      chapitres: d.ordre,
      fil: [COURS, { libelle: sigle, href: `${liste}#programme` }, { libelle: bloc.bloc ?? "Autres chapitres du parcours", href: `${liste}#${ancreDuBloc(rang)}` }],
      retour: { href: `${liste}#${ancreDuChapitre(chapitre.code)}`, libelle: "Retour à la liste des chapitres" },
    };
  }
  // Son parcours du registre : le catalogue par thème le range.
  const parcours = PARCOURS.find((p) => p.code === chapitre.parcours);
  const chapitres = ordreDApprentissage(CHAPITRES.filter((c) => c.parcours === chapitre.parcours));
  const theme = themeDuChapitre(chapitre.code);
  const liste = theme ? `/cours#theme-${theme.code}` : "/cours";
  return {
    genre: "parcours",
    diplome: null,
    titre: parcours?.titre ?? chapitre.parcours,
    chapitres,
    fil: theme ? [COURS, { libelle: theme.titre, href: liste }] : [COURS],
    retour: { href: liste, libelle: "Retour à la liste des chapitres" },
  };
}

/** Le chapitre qui suit dans le parcours ; null : c'est le dernier (ou le chapitre n'en est pas). */
export function chapitreSuivant(reference: Pick<ParcoursDeReference, "chapitres">, code: string): Chapitre | null {
  const i = reference.chapitres.findIndex((c) => c.code === code);
  return i >= 0 ? (reference.chapitres[i + 1] ?? null) : null;
}

/* ------------------------------------------------------------------------------------------------ */
/* L'accès du chapitre suivant (ses mots : ./mots-de-la-navigation.ts)                               */
/* ------------------------------------------------------------------------------------------------ */

export function accesDuSuivant(lu: {
  ouvert: boolean;
  /** L'élève d'une classe (sans session d'enseignant) ; null sinon. */
  eleve: { ouvertSansLiberation: boolean; dansLeParcours: boolean } | null;
}): AccesDuSuivant {
  if (lu.ouvert) return "ouvert";
  if (!lu.eleve) return "reserve";
  if (lu.eleve.ouvertSansLiberation) return "a-liberer";
  return lu.eleve.dansLeParcours ? "ferme-a-la-classe" : "hors-programme";
}

/** La phrase de la fin d'un parcours. */
export function finDuParcours(reference: Pick<ParcoursDeReference, "genre" | "titre">): string {
  return reference.genre === "classe"
    ? "C'est le dernier chapitre du parcours de votre classe : le parcours est fini."
    : `C'est le dernier chapitre du parcours ${reference.titre} : le parcours est fini.`;
}

/* ------------------------------------------------------------------------------------------------ */
/* Ce que la page du chapitre donne au guide                                                         */
/* ------------------------------------------------------------------------------------------------ */

/**
 * LA NAVIGATION D'UN CHAPITRE, l'accès du suivant déjà lu. `lien` fait l'adresse du chapitre suivant
 * (l'entreprise où il se joue) ; le diplôme d'un parcours de diplôme s'y ajoute.
 */
export function navigationDuChapitre(
  reference: ParcoursDeReference,
  code: string,
  suivant: { chapitre: Chapitre; acces: AccesDuSuivant } | null,
  lien: (c: Chapitre) => string,
): NavigationDuChapitre {
  const garde = reference.diplome ? `&diplome=${reference.diplome}` : "";
  const suite: SuiteDuParcours | null = !reference.chapitres.some((c) => c.code === code)
    ? null
    : suivant
      ? { genre: "suivant", code: suivant.chapitre.code, titre: suivant.chapitre.titre, href: `${lien(suivant.chapitre)}${garde}`, acces: suivant.acces }
      : { genre: "fin", phrase: finDuParcours(reference) };
  return { fil: reference.fil, retour: reference.retour, suite };
}
