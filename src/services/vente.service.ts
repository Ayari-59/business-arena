import { setOrgLicence, type ConditionsDeVente, type RemiseDeLicence } from "@/services/licence.service";
import { lireLEtatDuCatalogue } from "@/services/catalogue.service";
import { requirePlatformAdmin } from "@/services/admin.service";
import {
  carteDeTarif,
  erreurDeRemise,
  estUnMotifDeGratuite,
  estUnMotifDeRemise,
  MOTIFS_DE_REMISE,
  montantDeLaRemise,
  ouvreLesEpisodes,
  ouvreLExamen,
  parametresAreneDe,
  type NatureDeLicence,
  type TypeDeRemise,
} from "@/config/catalogue";
import { parametrageDepuisLOffre, variablesDuCatalogue } from "@/config/tarifs";

/**
 * ATTRIBUER UNE LICENCE DEPUIS UNE OFFRE DU CATALOGUE (/admin, formulaire de licence).
 *
 * Demande du propriétaire : choisir une offre pré-remplit le périmètre, les limites et le
 * prix ; on ajuste (l'entreprise, le niveau, le nombre d'enseignants), on applique une
 * remise, et le montant facturé se calcule et s'enregistre À CÔTÉ du prix catalogue. La
 * licence garde une COPIE des conditions de l'offre au moment de la vente : changer le
 * catalogue ensuite ne change pas une licence déjà vendue.
 *
 * Trois natures : VENDUE (prix catalogue, remise commerciale, montant), OFFERTE (0 €, un
 * motif obligatoire, une date de fin, comme toute licence) et ESSAI (0 €, datée, permise
 * seulement si l'essai d'établissement est activé dans /admin/offres, dans sa durée
 * maximale). Le montant est calculé ici, jamais saisi : il ne peut pas contredire la remise.
 */

export interface SaisieDeLicence {
  offre: string;
  /** Ajouter les épisodes manager, vendus à part, à une offre qui ne les inclut pas. */
  episodes: boolean;
  entreprise: string | null;
  niveau: number | null;
  maxEnseignants: number | null;
  label: string;
  startsAt: Date;
  endsAt: Date;
  reference: string | null;
  nature: NatureDeLicence;
  /** Le prix catalogue en centimes : celui de l'offre, ou celui du devis pour une offre sur devis. */
  prixCatalogueCents: number | null;
  remise: { type: TypeDeRemise; valeur: number; motif: string } | null;
  motifGratuite: string | null;
}

const JOUR = 24 * 60 * 60 * 1000;

/** Le calcul du montant facturé : le prix catalogue, moins la remise. */
export function montantFacture(
  nature: NatureDeLicence,
  prixCatalogueCents: number | null,
  remise: SaisieDeLicence["remise"],
): { amountCents: number | null; remise: RemiseDeLicence | null } {
  if (nature !== "vendue") return { amountCents: 0, remise: null };
  if (prixCatalogueCents === null) return { amountCents: null, remise: null };
  if (!remise) return { amountCents: prixCatalogueCents, remise: null };
  const montantCents = montantDeLaRemise(prixCatalogueCents, { type: remise.type, valeur: remise.valeur });
  return {
    amountCents: prixCatalogueCents - montantCents,
    remise: { type: remise.type, valeur: remise.valeur, motif: remise.motif, montantCents },
  };
}

export async function attribuerUneLicence(
  adminId: string,
  organizationId: string,
  s: SaisieDeLicence,
): Promise<{ licenceId: string }> {
  await requirePlatformAdmin(adminId);
  const { catalogue, decouverte, essai } = await lireLEtatDuCatalogue();
  const offre = catalogue.offres.find((o) => o.code === s.offre);
  if (!offre) throw new Error("Choisissez une offre du catalogue.");
  const regle = parametresAreneDe(offre);
  const avecEpisodes = ouvreLesEpisodes(offre) || s.episodes;
  if (!regle && !avecEpisodes) throw new Error(`L'offre ${offre.nom} n'ouvre ni l'arène ni les épisodes : elle ne s'attribue pas.`);
  const parametrage = regle
    ? parametrageDepuisLOffre(offre.nom, regle, {
        entreprise: s.entreprise,
        niveau: s.niveau,
        maxEnseignants: s.maxEnseignants,
      })
    : null;

  if (s.nature === "offerte" && !estUnMotifDeGratuite(s.motifGratuite)) {
    throw new Error("Une licence offerte porte son motif : pilote, partenaire, presse ou geste commercial.");
  }
  if (s.nature === "essai") {
    if (!essai.autorise) {
      throw new Error("L'essai d'établissement est désactivé : activez-le dans /admin/offres, rubrique Gratuités.");
    }
    const jours = Math.ceil((s.endsAt.getTime() - s.startsAt.getTime()) / JOUR);
    if (jours > essai.dureeMaxJours) {
      throw new Error(`Un essai dure ${essai.dureeMaxJours} jours au plus : celui-ci en compte ${jours}.`);
    }
  }
  let remise = s.remise;
  if (s.nature === "vendue" && remise) {
    const e = erreurDeRemise({ type: remise.type, valeur: remise.valeur });
    if (e) throw new Error(e);
    if (!estUnMotifDeRemise(remise.motif)) {
      throw new Error(`Une remise commerciale porte son motif : ${Object.values(MOTIFS_DE_REMISE).join(", ").toLowerCase()}.`);
    }
  } else {
    remise = null;
  }
  const prixCatalogueCents = offre.tarif === "prix" ? offre.prixCents : s.prixCatalogueCents;
  if (prixCatalogueCents !== null && (!Number.isInteger(prixCatalogueCents) || prixCatalogueCents < 0)) {
    throw new Error("Le prix catalogue est un montant positif.");
  }
  if (s.nature === "vendue" && remise && prixCatalogueCents === null) {
    throw new Error("Pour une offre sur devis, indiquez le prix du devis avant d'appliquer une remise.");
  }
  const { amountCents, remise: remiseEnregistree } = montantFacture(s.nature, prixCatalogueCents, remise);

  // La copie des conditions au moment de la vente : la carte telle qu'elle se lit ce jour.
  const carte = carteDeTarif(offre, catalogue, variablesDuCatalogue(decouverte));
  const conditions: ConditionsDeVente = {
    code: offre.code,
    nom: offre.nom,
    tarif: offre.tarif,
    prixCents: offre.prixCents,
    modules: structuredClone(offre.modules),
    inclus: carte.inclus,
    precisions: carte.precisions,
  };

  return setOrgLicence({
    adminId,
    organizationId,
    label: s.label,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    maxTeachers: parametrage?.maxEnseignants ?? null,
    arene: parametrage?.offre ?? null,
    entreprises: parametrage?.entreprises ?? null,
    niveaux: parametrage?.niveaux ?? null,
    maxPartiesEnCours: parametrage?.maxPartiesEnCours ?? null,
    episodes: avecEpisodes,
    // L'examen individuel suit la composition de l'offre vendue (/admin/offres).
    examen: regle !== null && ouvreLExamen(offre),
    reference: s.reference,
    amountCents,
    offreCode: offre.code,
    conditions,
    prixCatalogueCents: s.nature === "vendue" ? prixCatalogueCents : (offre.prixCents ?? s.prixCatalogueCents),
    remise: remiseEnregistree,
    nature: s.nature,
    motifGratuite: s.nature === "offerte" ? s.motifGratuite : null,
  });
}
