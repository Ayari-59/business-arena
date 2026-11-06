import {
  BESOIN_EXTERNE,
  engagementBancaire,
  engagementBpifrance,
  engagementDuCompteCourant,
  engagementParticipatif,
  engagementsEnCours,
  montage,
  montageTenable,
  type MontageDuFinancement,
} from "./acteurs-du-financement";
import { COMPTE_COURANT } from "./financement-du-lycee";

/**
 * LE MONDE DU BUREAU « LE DOSSIER DE FINANCEMENT » (la suite du chapitre « Les acteurs et les modes de
 * financement » et de son cas, « La banque demande une garantie »).
 *
 * Les offres sont celles du chapitre (acteurs-du-financement.ts) : la banque à 5 %, Bpifrance avec son
 * différé, la plateforme de prêt participatif, le compte courant des fondateurs, la business angel, le
 * fonds et l'émission obligataire hors de portée. Les engagements et le montage se calculent par les
 * fonctions du chapitre ; rien n'est recopié.
 *
 * CE QUI EST NEUF EST UNE HYPOTHÈSE DU BUREAU, nommée ci-dessous : les fondateurs ne peuvent plus bloquer
 * que 30 000 € en compte courant, et non les 40 000 € du plafond. Le montage du chapitre (40 000 € en
 * compte courant, 40 000 € à la banque) ne se monte plus : il faut en chercher un autre. La garde
 * tests/cours/bureau-le-dossier-de-financement.test.ts refait chaque chiffre à la main.
 */

/** LE COMPTE COURANT POSSIBLE (hypothèse du bureau) : les fondateurs ne bloquent que 30 000 € sur 5 ans. */
export const COMPTE_COURANT_POSSIBLE = 30_000;

/** Le plus gros prêt que Bpifrance ferait aux côtés de la banque, dans le dossier (le plafond du laboratoire du chapitre). */
export const BPIFRANCE_AU_PLUS = BESOIN_EXTERNE / 2;

/** Les montages que le président peut présenter aux associés, du plus simple au plus composé. */
export const MONTAGES_DU_DOSSIER = {
  /** Le compte courant possible, et la banque pour le reste. */
  compteCourantEtBanque: { capital: 0, compteCourant: COMPTE_COURANT_POSSIBLE, bpifrance: 0 },
  /** Le compte courant possible, Bpifrance pour 10 000 €, la banque pour le reste : le seul qui tient sans ouvrir le capital. */
  avecBpifrance: { capital: 0, compteCourant: COMPTE_COURANT_POSSIBLE, bpifrance: 10_000 },
  /** Le compte courant possible, Bpifrance pour 20 000 €, la banque pour le reste. */
  avecPlusDeBpifrance: { capital: 0, compteCourant: COMPTE_COURANT_POSSIBLE, bpifrance: 20_000 },
  /** La business angel, et la banque pour le reste. */
  avecLaBusinessAngel: { capital: 60_000, compteCourant: 0, bpifrance: 0 },
} as const satisfies Record<string, MontageDuFinancement>;

/** Le dossier : ce que chaque offre engagerait, les engagements déjà pris, et les montages. */
export function dossierDeFinancement() {
  const m = Object.fromEntries(Object.entries(MONTAGES_DU_DOSSIER).map(([k, v]) => [k, montage(v)])) as Record<keyof typeof MONTAGES_DU_DOSSIER, ReturnType<typeof montage>>;
  return {
    besoin: BESOIN_EXTERNE,
    offres: {
      banque: engagementBancaire(BESOIN_EXTERNE),
      bpifrance: engagementBpifrance(BPIFRANCE_AU_PLUS),
      plateforme: engagementParticipatif(BESOIN_EXTERNE),
      compteCourant: engagementDuCompteCourant(COMPTE_COURANT_POSSIBLE),
    },
    enCours: engagementsEnCours(),
    montages: m,
    tenables: Object.fromEntries(Object.entries(m).map(([k, v]) => [k, montageTenable(v)])) as Record<keyof typeof MONTAGES_DU_DOSSIER, boolean>,
    /** Le montage du chapitre, que le plafond des fondateurs empêche. */
    duChapitre: montage({ capital: 0, compteCourant: COMPTE_COURANT.plafond!, bpifrance: 0 }),
  };
}
