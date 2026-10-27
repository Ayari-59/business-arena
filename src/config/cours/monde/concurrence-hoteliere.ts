import { anneeDeLHotel, type AnneeDeLHotel } from "./hotel";
import type { FicheDeLHotel } from "./l-escale";

/**
 * LE MONDE DU COURS : L'HÔTEL FACE À SES CONCURRENTS.
 *
 * Les trois indicateurs que l'hôtelier lit ensemble, pour L'ESCALE et pour les hôtels de la ville
 * que sa fiche pose comme comparaison :
 *
 *   · le taux d'occupation = chambres vendues ÷ chambres disponibles × 100, au dixième ;
 *   · le prix moyen par chambre louée = chiffre d'affaires ÷ chambres vendues, au centime ;
 *   · le revenu par chambre disponible (RevPAR) = chiffre d'affaires ÷ chambres disponibles, au centime.
 *
 * Une chambre disponible, c'est une chambre une nuit : un trimestre en offre chambres × jours.
 * L'année de L'ESCALE vient du modèle de l'hôtel (hotel.ts), à son prix ou à un autre.
 *
 * Les hypothèses du cours sur les concurrents, posées ici :
 *   · ils comptent les mêmes jours par trimestre que L'ESCALE ;
 *   · ils ne vendent que des nuitées, au prix que la fiche leur donne : leur chiffre d'affaires est
 *     leurs nuitées vendues × ce prix, au centime, et leur prix moyen est ce prix ;
 *   · ils ne réagissent pas : quand L'ESCALE change son prix, leur année ne bouge pas, et la
 *     demande adressée à L'ESCALE ne répond qu'à son propre prix (l'élasticité de sa fiche). Leurs
 *     clientèles ne sont pas celles de L'ESCALE : un prix qui remplit un concurrent ne remplit pas
 *     forcément L'ESCALE.
 *
 * Rien ici ne lit l'arène : le test refait chaque chiffre à la main sur la fiche.
 */

/** Ce que l'hôtelier lit d'un trimestre ou d'une année : ses chambres, son chiffre d'affaires et ses trois indicateurs. */
export interface IndicateursDHotel {
  disponibles: number;
  vendues: number;
  chiffreDAffaires: number;
  occupation: number;
  prixMoyen: number;
  revpar: number;
}

/** Un hôtel de la ville, trimestre par trimestre puis sur l'année. */
export interface AnneeDUnHotel {
  nom: string;
  /** Le prix de la nuitée à chaque trimestre. */
  prix: readonly number[];
  trimestres: IndicateursDHotel[];
  annee: IndicateursDHotel;
}

const auCentime = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les trois indicateurs, à partir des chambres disponibles, des chambres vendues et du chiffre d'affaires. */
export function indicateurs(disponibles: number, vendues: number, chiffreDAffaires: number): IndicateursDHotel {
  return {
    disponibles,
    vendues,
    chiffreDAffaires,
    occupation: auDixieme((vendues / disponibles) * 100),
    prixMoyen: vendues > 0 ? auCentime(chiffreDAffaires / vendues) : 0,
    revpar: auCentime(chiffreDAffaires / disponibles),
  };
}

/** L'année d'un hôtel, à partir de ses quatre trimestres. */
function surLAnnee(nom: string, prix: readonly number[], trimestres: IndicateursDHotel[]): AnneeDUnHotel {
  const somme = (g: (t: IndicateursDHotel) => number) => trimestres.reduce((s, t) => s + g(t), 0);
  return { nom, prix, trimestres, annee: indicateurs(somme((t) => t.disponibles), somme((t) => t.vendues), auCentime(somme((t) => t.chiffreDAffaires))) };
}

/** L'hôtel du cours, une année du modèle de l'hôtel lue en indicateurs. */
export function lHotelEnIndicateurs(f: FicheDeLHotel, a: AnneeDeLHotel): AnneeDUnHotel {
  return surLAnnee(
    f.entreprise,
    a.trimestres.map((t) => t.prix),
    a.trimestres.map((t) => indicateurs(t.offertes, t.vendues, t.chiffreDAffaires)),
  );
}

/** L'année de l'hôtel du cours, au même prix les quatre trimestres. */
export function anneeAuPrixUnique(f: FicheDeLHotel, prix: number): AnneeDeLHotel {
  return anneeDeLHotel(f, [1, 2, 3, 4].map(() => prix));
}

/** L'année de l'hôtel du cours à son prix de l'année : celle du chapitre « le prix selon la saison » au prix unique. */
export const anneeAuTarif = (f: FicheDeLHotel): AnneeDeLHotel => anneeAuPrixUnique(f, f.prixDeLAnnee);

/** Les concurrents de la fiche, tels qu'elle les pose : chambres vendues × prix, sur leurs chambres × les jours du trimestre. */
export function concurrentsDe(f: FicheDeLHotel): AnneeDUnHotel[] {
  return f.concurrents.map((x) => {
    const disponibles = x.chambres * f.joursParTrimestre;
    return surLAnnee(
      x.nom,
      x.prix,
      x.vendues.map((v, k) => indicateurs(disponibles, v, auCentime(v * x.prix[k]!))),
    );
  });
}
