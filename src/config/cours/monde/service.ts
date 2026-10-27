import { anneeDeLHotel } from "./hotel";
import { HOTELS_DU_COURS, type FicheDeLHotel } from "./l-escale";
import { BISTROTS_DU_COURS, type FicheDuBistrot } from "./la-table-d-augustin";

/**
 * LE MODÈLE DU SERVICE DU COURS : ce que sert l'équipe d'un restaurant ou d'un hôtel, trimestre
 * par trimestre, au prix de l'année.
 *
 * Au bistrot, la demande de chaque clientèle est celle de la fiche, au ticket moyen de l'année ;
 * la salle et la cuisine servent au plus leurs couverts par jour × les jours du trimestre. Le
 * bistrot sert la plus petite des deux : au-delà, les clients repartent sans être servis ; en deçà,
 * des places restent vides. À l'hôtel, c'est le modèle de l'hôtel (hotel.ts), au prix de l'année
 * les quatre trimestres : il vend la plus petite de la demande et des nuitées offertes.
 *
 * L'équipe est celle de la fiche : le même effectif toute l'année, payé pareil chaque trimestre,
 * quelle que soit l'activité. Elle sert ce que la salle ou les chambres permettent : sa propre
 * capacité n'est jamais le plafond (le cours n'en pose pas d'autre).
 *
 * Rien ici ne lit l'arène : le cours calcule tout, et le test le refait à la main.
 */

/** Un trimestre de l'établissement, vu par l'équipe qui le sert. */
export interface TrimestreServi {
  /** Le rang du trimestre dans l'année, à partir de 1. */
  numero: number;
  /** Ce que les clients ont demandé, au prix de l'année. */
  demande: number;
  /** Ce que l'établissement peut servir : couverts servables ou nuitées offertes. */
  capacite: number;
  /** Ce qu'il a servi : la plus petite de la demande et de la capacité. */
  servis: number;
  /** Les clients repartis sans être servis, faute de place. */
  refuses: number;
}

/** L'année de service d'un établissement du cours. */
export interface ServiceDeLAnnee {
  code: string;
  entreprise: string;
  /** L'unité de ce que l'équipe sert, au singulier et au pluriel. */
  unite: string;
  unites: string;
  joursParTrimestre: number;
  /** Le prix de l'année : le ticket moyen d'un couvert, ou la nuitée. */
  prixDeLAnnee: number;
  /** Ce que sert l'établissement par jour au plus : des couverts, ou des chambres. */
  parJour: number;
  equipe: { effectif: number; coutParSalarieParTrimestre: number };
  /** Toutes les charges fixes du trimestre, la paie de l'équipe comprise. */
  chargesFixesParTrimestre: number;
  trimestres: TrimestreServi[];
}

/** Les couverts que le bistrot peut servir en un trimestre : ses couverts par jour, chaque jour. */
export const couvertsServables = (f: FicheDuBistrot) => f.couvertsParJour * f.joursParTrimestre;

/** Les quatre trimestres du bistrot, au ticket moyen de l'année. */
export function anneeDuBistrot(f: FicheDuBistrot): TrimestreServi[] {
  const capacite = couvertsServables(f);
  return [1, 2, 3, 4].map((numero) => {
    const demande = f.clienteles.reduce((t, g) => t + g.demande[numero - 1]!, 0);
    const servis = Math.min(demande, capacite);
    return { numero, demande, capacite, servis, refuses: demande - servis };
  });
}

/** Les quatre trimestres de l'hôtel, au prix de l'année : le modèle de l'hôtel, tel quel. */
export function anneeDeLHotelAuPrixDeLAnnee(f: FicheDeLHotel): TrimestreServi[] {
  return anneeDeLHotel(f, [1, 2, 3, 4].map(() => f.prixDeLAnnee)).trimestres.map((t) => ({
    numero: t.numero,
    demande: t.demande,
    capacite: t.offertes,
    servis: t.vendues,
    refuses: t.refusees,
  }));
}

/** L'année de service de l'établissement du cours dont le code est donné (le bistrot ou l'hôtel). */
export function serviceDuCours(code: string): ServiceDeLAnnee {
  const b = BISTROTS_DU_COURS[code];
  if (b) {
    return {
      code,
      entreprise: b.entreprise,
      unite: "couvert",
      unites: "couverts",
      joursParTrimestre: b.joursParTrimestre,
      prixDeLAnnee: b.prixDeLAnnee,
      parJour: b.couvertsParJour,
      equipe: b.equipe,
      chargesFixesParTrimestre: b.chargesFixesParTrimestre,
      trimestres: anneeDuBistrot(b),
    };
  }
  const h = HOTELS_DU_COURS[code];
  if (h) {
    return {
      code,
      entreprise: h.entreprise,
      unite: "nuitée",
      unites: "nuitées",
      joursParTrimestre: h.joursParTrimestre,
      prixDeLAnnee: h.prixDeLAnnee,
      parJour: h.chambres,
      equipe: h.equipe,
      chargesFixesParTrimestre: h.chargesFixesParTrimestre,
      trimestres: anneeDeLHotelAuPrixDeLAnnee(h),
    };
  }
  throw new Error(`Pas d'établissement du service dans le monde du cours pour « ${code} ».`);
}
