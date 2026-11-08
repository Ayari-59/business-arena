import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION, FICHE_DE_DIRECTION } from "./direction-de-nova";
import { AUDIO_COMPTOIR, NOVA_DIFFUSION, PART_DE_NOVA } from "./groupe-nova";
import { MOIS_PAR_TRIMESTRE } from "./nova-capacite";
import { CHARGES_FIXES_DU_MOIS, COUT_DU_SOUS_TRAITANT } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LA CHAÎNE DE VALEUR DE NOVA ET SES MODES DE DÉVELOPPEMENT (management de
 * première STMG, question 3.1, lot B).
 *
 * NOVA ne fait pas tout elle-même : elle achète ses composants à Électro-Composants Lyon, monte ses
 * enceintes sur sa ligne, les vend sur son site et par CampusTech, et crée en N + 1 sa filiale de
 * distribution, NOVA DIFFUSION (groupe-nova.ts), qui envisage de prendre AUDIO COMPTOIR. Ce fichier
 * relit ces fiches sans en recopier un chiffre :
 *   · nova-gestion.ts : le sous-traitant qui livre une enceinte finie, les charges fixes d'un mois ;
 *   · nova-capacite.ts : le coût variable d'une enceinte, la ligne et la demande de N + 1.
 *
 * FAIRE OU FAIRE FAIRE (hypothèse du cours, dite à l'élève) : si NOVA confiait tout le montage au
 * sous-traitant, elle n'aurait plus ni opérateurs ni ligne à user ; le loyer resterait, le local
 * servant au stock et aux expéditions. Les charges fixes du montage sont donc la paie et l'usure de la
 * ligne. Le montage intégré coûte le coût variable plus ces charges ; le montage sous-traité, le prix du
 * sous-traitant.
 */

export const ENTREPRISES_DE_LA_CHAINE = ENTREPRISES_DE_LA_DIRECTION;

const f = FICHE_DE_DIRECTION;

/** Le coût variable d'une enceinte montée par NOVA. */
export const COUT_VARIABLE = f.enceinte.coutVariable.composants + f.enceinte.coutVariable.autres;

/** Les charges fixes du montage sur un trimestre : la paie de l'équipe et l'usure de la ligne. */
export const FIXES_DU_MONTAGE = (CHARGES_FIXES_DU_MOIS.personnel + CHARGES_FIXES_DU_MOIS.amortissement) * MOIS_PAR_TRIMESTRE;

/** Monter soi-même ou faire monter, à un volume de trimestre donné. */
export function faireOuFaireFaire(enceintes: number = f.ligne.capaciteParTrimestre) {
  const integre = auCentime(COUT_VARIABLE * enceintes + FIXES_DU_MONTAGE);
  const sousTraite = auCentime(COUT_DU_SOUS_TRAITANT * enceintes);
  return {
    enceintes,
    coutVariable: COUT_VARIABLE,
    fixes: FIXES_DU_MONTAGE,
    sousTraitant: COUT_DU_SOUS_TRAITANT,
    integre,
    sousTraite,
    integreParEnceinte: auCentime(integre / enceintes),
    economie: auCentime(sousTraite - integre),
  };
}

/** Le plus petit volume de trimestre, à l'enceinte, où monter soi-même coûte moins que faire monter. */
export const volumeOuIntegrerPaie = () => Math.ceil(FIXES_DU_MONTAGE / (COUT_DU_SOUS_TRAITANT - COUT_VARIABLE) - 1e-9);

/** Le trimestre de Noël de N + 1 : la demande, la ligne, et ce qu'apporte le sous-traitant. */
export const TRIMESTRE_DE_NOEL = 4;
export const SOUS_TRAITEES_ESSAYEES = { min: 0, max: 1_500, pas: 100 } as const;

export function noelSousTraite(sousTraitees: number) {
  const demande = f.anneeNPlus1.demande[TRIMESTRE_DE_NOEL - 1]!;
  const ligne = f.ligne.capaciteParTrimestre;
  const manque = Math.max(0, demande - ligne);
  const vendues = Math.min(sousTraitees, manque);
  const sansClient = sousTraitees - vendues;
  const margeDuSousTraite = auCentime(f.enceinte.prix - COUT_DU_SOUS_TRAITANT);
  return {
    demande,
    ligne,
    manque,
    sousTraitees,
    vendues,
    sansClient,
    refusees: manque - vendues,
    margeDuSousTraite,
    margeEnPlus: auCentime(vendues * margeDuSousTraite - sansClient * COUT_DU_SOUS_TRAITANT),
  };
}

/** Les plus petites commandes au sous-traitant, de 100 en 100, qui servent tous les clients de Noël. */
export const sousTraiteesQuiServentNoel = () => Math.ceil(noelSousTraite(0).manque / SOUS_TRAITEES_ESSAYEES.pas - 1e-9) * SOUS_TRAITEES_ESSAYEES.pas;

/** La filiale et la boutique du groupe (groupe-nova.ts). */
export const FILIALE = { nom: NOVA_DIFFUSION.nom, partDeNova: PART_DE_NOVA, boutique: AUDIO_COMPTOIR.nom, partDansLaBoutique: AUDIO_COMPTOIR.partDeLaFiliale } as const;

export type Maillon = "integre" | "externalise";
export type ModeDeCroissance = "interne" | "externe" | "partenariat";

/**
 * LE CAS DU CHAPITRE (hypothèse du cours) : un distributeur belge propose d'acheter 1 500 NOVA One par
 * trimestre en N + 1, à 52 € hors taxes l'enceinte, pour les revendre en Belgique.
 */
export const DISTRIBUTEUR_BELGE = { parTrimestre: 1_500, prix: 52 } as const;

/** L'offre belge face à la ligne : ce que la ligne peut monter en plus, trimestre par trimestre, et ce que cela rapporte. */
export function offreDuDistributeurBelge() {
  const ligne = f.ligne.capaciteParTrimestre;
  const trimestres = f.anneeNPlus1.demande.map((d, i) => {
    const libre = Math.max(0, ligne - d);
    return { numero: i + 1, demande: d, libre, servies: Math.min(libre, DISTRIBUTEUR_BELGE.parTrimestre) };
  });
  const servies = trimestres.reduce((t, x) => t + x.servies, 0);
  const margeUnitaire = auCentime(DISTRIBUTEUR_BELGE.prix - COUT_VARIABLE);
  return {
    ...DISTRIBUTEUR_BELGE,
    ligne,
    trimestres,
    demandees: DISTRIBUTEUR_BELGE.parTrimestre * trimestres.length,
    servies,
    margeUnitaire,
    marge: auCentime(servies * margeUnitaire),
    /** Ce que rapporterait une enceinte belge faite monter au sous-traitant. */
    margeSousTraitee: auCentime(DISTRIBUTEUR_BELGE.prix - COUT_DU_SOUS_TRAITANT),
  };
}
