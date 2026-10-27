import { CAS_DES_ENTREPRISES } from "./monde/cas-des-entreprises";
import type { CompteDuMetier } from "./metiers";

/**
 * LE CAS D'UNE ENTREPRISE : LES MONTANTS DU COURS, DANS LE MONDE DU COURS.
 *
 * Aucun chiffre du cours ne s'écrit à la main. Les apports et l'emprunt, l'équipement acheté à la
 * création, le loyer et le personnel, les ventes du mois et leurs façons de payer, le stock d'un
 * trimestre et l'année en grandes masses ont été relevés une fois sur l'arène (une gestion
 * équilibrée face aux concurrents du scénario, graine fixe), puis figés dans le monde du cours
 * (monde/cas-des-entreprises.ts) : le cas ne lit plus le moteur, et une évolution de l'arène ne
 * change plus les montants du cours (décision du propriétaire).
 *
 * Les ventes se partagent comme dans la simulation : les clients qui paient sur-le-champ et les
 * clients professionnels qui paient à échéance. Le fournisseur est payé à son délai. Le cas est
 * donc déterministe : même entreprise, mêmes montants, pour tous les élèves et pour la correction.
 *
 * L'année que l'arène joue encore pour les chapitres qui ne sont pas passés sur le monde du cours
 * est dans annee-de-l-arene.ts.
 */

export interface Facture {
  quantite: number;
  prixUnitaire: number;
  ht: number;
  tauxTva: number;
  tva: number;
  ttc: number;
}

export interface Cas {
  code: string;
  entreprise: string;
  unite: string;
  unites: string;
  capital: number;
  emprunt: number;
  /**
   * L'équipement acheté à la création. Sa revente se fait, dans l'arène, à une fraction de
   * sa valeur nette comptable : `ratioDeRevente`, celle du catalogue d'équipements.
   */
  immobilisation: Facture & CompteDuMetier & { designation: string; date: number; ratioDeRevente: number };
  achat: Facture &
    CompteDuMetier & { designation: string; fournisseur: string; date: number; delai: number; echeance: number };
  venteComptant: Facture & CompteDuMetier & { qui: string; date: number };
  venteCredit: Facture & CompteDuMetier & { client: string; date: number; delai: number; echeance: number };
  loyer: { montant: number; date: number };
  /**
   * La paie de janvier : le brut, ce que le salarié en reçoit (le net), ce que
   * l'entreprise ajoute (les cotisations patronales), et la date où les
   * cotisations se paient à l'URSSAF.
   */
  personnel: {
    effectif: number;
    brut: number;
    tauxSalarial: number;
    cotisationsSalariales: number;
    net: number;
    tauxPatronal: number;
    cotisationsPatronales: number;
    cout: number;
    date: number;
    dateUrssaf: number;
  };
  dates: { capital: number; emprunt: number };
  /**
   * Le stock de marchandises sur un trimestre de l'arène, pour une entreprise qui en garde
   * un au début et à la fin (absent sinon : un service ne se stocke pas, et une entreprise
   * qui produit à la demande n'en a pas).
   */
  stock: StockDuTrimestre | null;
  /** L'année de l'arène, quatre trimestres, en grandes masses : la matière de la clôture. */
  annee: AnneeDeLArene;
  /**
   * Le contrat de l'emprunt, celui que l'entreprise rembourse dans l'arène : le taux
   * annuel du scénario, et l'échéancier du moteur (une échéance par trimestre, le même
   * capital remboursé à chacune : l'amortissement constant).
   */
  pret: { tauxAnnuel: number; nombreEcheances: number; capitalParEcheance: number };
  /**
   * Le même mois vu par le contrôle de gestion : les ventes du mois, leur prix moyen, les
   * coûts variables par unité, les charges fixes du mois (dont l'usure de l'équipement).
   */
  /**
   * Le marché du mois, clientèle par clientèle : la demande que l'arène a adressée à
   * l'entreprise, ce qu'elle a vendu, ce qu'elle a manqué faute de stock ou de capacité, et
   * ce que chaque clientèle a rapporté (le premier trimestre, ramené à un mois, à l'unité).
   * Avec la capacité offerte du mois : ce qu'elle pouvait servir.
   */
  marche: {
    clienteles: { code: string; nom: string; demande: number; vendu: number; manque: number; chiffreDAffaires: number }[];
    capacite: number;
    /** Le budget marketing du mois : ce que l'entreprise a payé pour attirer ses clients. */
    marketing: number;
  };
  gestion: {
    quantite: number;
    chiffreDAffaires: number;
    prixMoyen: number;
    matiereParUnite: number;
    autresParUnite: number;
    autresCoutsVariables: string;
    coutVariableUnitaire: number;
    amortissement: number;
    dureeAmortissementMois: number;
    chargesFixes: number;
  };
}

export interface StockDuTrimestre {
  /** Le trimestre de l'année (1 à 4) : le premier qui commence et finit avec du stock. */
  trimestre: number;
  /** Les jours du cours (1 = 1er janvier) où il commence et finit. */
  debut: number;
  fin: number;
  initial: { quantite: number; valeur: number };
  achats: Facture;
  vendues: number;
  /** Le coût unitaire moyen pondéré du trimestre (stock initial et entrées). */
  cump: number;
  final: { quantite: number; valeur: number };
  /** Le coût d'achat des marchandises vendues : stock initial, plus achats, moins stock final. */
  coutDAchatDesVendues: number;
  ventes: Facture;
}

/**
 * L'ANNÉE DE L'ARÈNE EN GRANDES MASSES : les quatre trimestres additionnés, rangés comme
 * une balance avant inventaire. Le coût variable des unités produites ou achetées se partage
 * entre les achats et les autres coûts variables au prorata de leurs coûts unitaires ; le
 * personnel est celui de l'effectif de départ, le reste des charges fixes est le loyer et
 * les frais de structure. La dotation et la variation du stock sont les travaux d'inventaire.
 */
export interface AnneeDeLArene {
  ventes: number;
  achats: number;
  autresCoutsVariables: number;
  commissions: number;
  publicite: number;
  qualite: number;
  entretien: number;
  personnel: number;
  loyerEtFrais: number;
  interets: number;
  dotation: number;
  /** Le stock du 1er janvier et du 31 décembre, valorisé par l'arène ; absent pour un service. */
  stock: { nature: "marchandises" | "en-cours"; initial: number; final: number } | null;
  tauxIS: number;
  /** Ce que l'arène affiche pour l'année : des acomptes chaque trimestre, l'impôt de l'année au bout. */
  arene: { resultatAvantImpot: number; impot: number; resultatNet: number };
}

/**
 * LES TAUX DE COTISATIONS DE LA PAIE : des ordres de grandeur d'un salarié non cadre du
 * secteur privé, avant les allègements de charges. La part salariale se retient sur le
 * brut ; la part patronale s'y ajoute, à la charge de l'entreprise.
 */
export const TAUX_SALARIAL = 0.22;
export const TAUX_PATRONAL = 0.42;

/** Le cas d'une entreprise du cours, tel que le monde du cours l'a figé. */
export function casDeLEntreprise(code: string): Cas {
  const cas = CAS_DES_ENTREPRISES[code];
  if (!cas) throw new Error(`Pas de cas de cours pour l'entreprise ${code}`);
  return cas;
}
