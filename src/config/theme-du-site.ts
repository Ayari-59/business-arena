import { BANDES, PAGES_A_BANDES, bandeParId, bandesDeLaPage } from "./bandes";
import {
  PALETTE_PAR_DEFAUT,
  estCodePalette,
  type CodePalette,
} from "./palettes";
import { THEME_PAR_DEFAUT, estCodeTheme, type CodeTheme } from "./themes";

/**
 * CE QUE L'ADMINISTRATEUR RÈGLE DU THÈME, ET CE QUI LUI EST REFUSÉ.
 *
 * CE QUI SE STOCKE, C'EST L'ÉCART. Le réglage ne garde pas « cette bande est à
 * contre-jour » pour chacune des vingt-neuf, il garde celles qui DIFFÈRENT de
 * l'état d'origine. Une carte complète figerait l'état du jour : la bande
 * ajoutée demain à contre-jour par défaut resterait claire chez qui aurait
 * enregistré avant, sans que personne ne l'ait décidé.
 *
 * CE QUI SE REFUSE. Le site se donne déjà des règles sur le contre-jour, et
 * elles ne doivent pas dépendre de qui règle :
 *
 *   · un bloc à contre-jour attire l'œil parce qu'il est unique sur l'écran ;
 *     deux bandes visibles ensemble s'annulent. Deux au plus par page, et
 *     jamais côte à côte ;
 *   · une page sans aucune coupure déroule d'un seul tenant du haut au pied :
 *     il en reste au moins une ;
 *   · en tête de page, la bande à contre-jour doit porter le titre, sans quoi
 *     on ouvre la page sur une coupure qui ne dit rien.
 *
 * Ces règles se vérifient à l'ENREGISTREMENT, sur l'ordre des bandes. La
 * distance réelle en pixels dépend du texte et de la largeur ; elle se mesure
 * dans un navigateur, sur l'état par défaut (tests/e2e/contre-jour.e2e.ts).
 * Un réglage qui respecte l'ordre peut donc, rarement, rapprocher deux bandes
 * courtes : le refus protège l'essentiel, il ne remplace pas la mesure.
 */

export interface ThemeDuSite {
  /** Les bandes dont le contre-jour DIFFÈRE de l'état d'origine : id → oui ou non. */
  contrastes: Record<string, boolean>;
  /**
   * Le thème d'ouverture, quand il DIFFÈRE de celui d'usine. Absent : c'est
   * THEME_PAR_DEFAUT, et le jour où l'usine change, ce site la suit.
   */
  parDefaut?: CodeTheme;
  /** La palette d'accent, quand elle DIFFÈRE de celle d'origine. Même logique que `parDefaut`. */
  palette?: CodePalette;
}

export const THEME_DU_SITE_PAR_DEFAUT: ThemeDuSite = { contrastes: {} };

/** Le plafond de bandes à contre-jour sur une même page. */
export const BANDES_MAX_PAR_PAGE = 2;

/**
 * Un thème lu de la base, rendu sûr.
 *
 * La colonne est du JSON libre : elle peut porter un identifiant de bande
 * supprimé depuis, ou une valeur qui n'est pas un booléen. On ne garde que ce
 * qui désigne une bande qui existe ET dit autre chose que l'état d'origine —
 * un écart nul n'en est pas un.
 */
export function normaliserTheme(brut: unknown): ThemeDuSite {
  const contrastes: Record<string, boolean> = {};
  const source = brut as
    | { contrastes?: unknown; parDefaut?: unknown; palette?: unknown }
    | null
    | undefined;
  const lus = source?.contrastes;
  if (lus && typeof lus === "object") {
    for (const [id, valeur] of Object.entries(lus as Record<string, unknown>)) {
      const bande = bandeParId(id);
      if (
        bande &&
        typeof valeur === "boolean" &&
        valeur !== bande.contrasteParDefaut
      ) {
        contrastes[id] = valeur;
      }
    }
  }
  const theme: ThemeDuSite = { contrastes };
  const parDefaut = source?.parDefaut;
  if (estCodeTheme(parDefaut) && parDefaut !== THEME_PAR_DEFAUT)
    theme.parDefaut = parDefaut;
  const palette = source?.palette;
  if (estCodePalette(palette) && palette !== PALETTE_PAR_DEFAUT)
    theme.palette = palette;
  return theme;
}

/** La palette d'accent que sert le site : celle réglée, sinon celle d'origine. */
export function paletteDuSite(theme: ThemeDuSite | undefined): CodePalette {
  return theme?.palette ?? PALETTE_PAR_DEFAUT;
}

/**
 * Le thème que voit un visiteur qui n'a encore rien choisi. Celui qui a déjà
 * choisi, lui, garde son choix : il est sur son appareil, et rien ici n'y touche.
 */
export function themeParDefaut(theme: ThemeDuSite | undefined): CodeTheme {
  return theme?.parDefaut ?? THEME_PAR_DEFAUT;
}

/** Vrai si la bande est à contre-jour pour ce thème. Une bande inconnue ne l'est jamais. */
export function contrasteDeLaBande(
  theme: ThemeDuSite | undefined,
  id: string,
): boolean {
  const bande = bandeParId(id);
  if (!bande) return false;
  return theme?.contrastes?.[id] ?? bande.contrasteParDefaut;
}

/** L'état de chaque bande, tel que ce thème le donne : la carte COMPLÈTE. */
export function etatDesContrastes(
  theme: ThemeDuSite | undefined,
): Record<string, boolean> {
  return Object.fromEntries(
    BANDES.map((b) => [b.id, contrasteDeLaBande(theme, b.id)]),
  );
}

/**
 * Passe d'un état complet (ce que le formulaire envoie) à l'écart qui se
 * stocke : on ne garde que ce qui diffère de l'état d'origine.
 */
export function themeDepuisEtat(
  etat: Record<string, boolean>,
  parDefaut: CodeTheme = THEME_PAR_DEFAUT,
  palette: CodePalette = PALETTE_PAR_DEFAUT,
): ThemeDuSite {
  const contrastes: Record<string, boolean> = {};
  for (const bande of BANDES) {
    const voulu = etat[bande.id];
    if (typeof voulu === "boolean" && voulu !== bande.contrasteParDefaut) {
      contrastes[bande.id] = voulu;
    }
  }
  const theme: ThemeDuSite = { contrastes };
  if (parDefaut !== THEME_PAR_DEFAUT) theme.parDefaut = parDefaut;
  if (palette !== PALETTE_PAR_DEFAUT) theme.palette = palette;
  return theme;
}

/** Les raisons pour lesquelles une palette est refusée. Vide : elle tient. */
export function validerPalette(code: unknown): string[] {
  return estCodePalette(code)
    ? []
    : ["Choisissez la palette parmi celles proposées."];
}

/** Les raisons pour lesquelles un thème d'ouverture est refusé. Vide : il tient. */
export function validerThemeParDefaut(code: unknown): string[] {
  return estCodeTheme(code)
    ? []
    : ["Choisissez le thème d'ouverture parmi ceux du site."];
}

/**
 * Les raisons pour lesquelles un état de contrastes est refusé. Vide : il tient.
 *
 * Chaque message dit ce qui ne va pas ET où, dans les mots que l'admin lit —
 * pas un identifiant. Un refus qui n'explique pas se contourne ou s'abandonne.
 */
export function validerContrastes(etat: Record<string, boolean>): string[] {
  const fautes: string[] = [];

  for (const id of Object.keys(etat)) {
    if (!bandeParId(id)) fautes.push(`La bande « ${id} » n'existe pas.`);
  }

  for (const { page, nom, partielle } of PAGES_A_BANDES) {
    const bandes = bandesDeLaPage(page);
    const actives = bandes.filter((b) => etat[b.id] ?? b.contrasteParDefaut);

    if (actives.length === 0) {
      fautes.push(
        `${nom} : aucune bande à contre-jour. Une page sans coupure déroule d'un seul tenant du haut au pied ; gardez-en au moins une.`,
      );
    }
    if (actives.length > BANDES_MAX_PAR_PAGE) {
      fautes.push(
        `${nom} : ${actives.length} bandes à contre-jour, ${BANDES_MAX_PAR_PAGE} au plus. Au-delà, le contraste cesse d'en être un : les bandes s'annulent.`,
      );
    }
    // Une page listée en partie ne dit rien de ce qui précède ou suit ses bandes :
    // ni le voisinage ni la tête de page n'ont d'objet.
    if (partielle) continue;
    for (let i = 1; i < bandes.length; i += 1) {
      const a = bandes[i - 1]!;
      const b = bandes[i]!;
      if (
        (etat[a.id] ?? a.contrasteParDefaut) &&
        (etat[b.id] ?? b.contrasteParDefaut)
      ) {
        fautes.push(
          `${nom} : « ${a.nom} » et « ${b.nom} » se suivent. Mettez une bande claire entre deux bandes à contre-jour.`,
        );
      }
    }
    const premiere = bandes[0];
    if (
      premiere &&
      (etat[premiere.id] ?? premiere.contrasteParDefaut) &&
      !premiere.porteLeH1
    ) {
      fautes.push(
        `${nom} : « ${premiere.nom} » ouvre la page sans porter le titre. Un contre-jour en tête doit contenir le titre de la page.`,
      );
    }
  }
  return fautes;
}
