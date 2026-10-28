/**
 * LE REGISTRE DES FICHES ENSEIGNANT : une fiche par épisode joué en classe,
 * dans l'ordre des épisodes. Les épisodes de contrôle de gestion et de
 * finance (31 à 40) ont été les premiers à en avoir une : la notion du cours
 * y est le piège de la décision, et le calcul de la semaine 1 se corrige
 * comme un exercice. Ceux de stratégie (41 à 48) suivent, pour des étudiants
 * de licence et de master et des formations de dirigeants.
 *
 * TOUS LES ÉPISODES ONT LEUR FICHE (octobre 2026). Le site promet « le guide de débrief des
 * 113 épisodes » : les 90 fiches qui manquaient ont été écrites au même format, chacune à partir
 * de son épisode, et la garde les vérifie toutes.
 *
 * LES DÉMONSTRATIONS ONT AUSSI LEUR FICHE. Décision du propriétaire (octobre
 * 2026) : « fiche séance sur la démo ». Les cinq épisodes de démonstration de
 * la Découverte (`EPISODES_DE_DEMO`, config/episodes/demos.ts), un par métier,
 * sont ceux qu'un enseignant peut jouer en classe sans licence : chacun a sa
 * fiche, au même format que les autres, rangée à son numéro (5, 58, 68, 82 et
 * 102).
 */
import type { FicheEnseignant } from "./types";
import { FICHE as TRIMESTRE_QUI_DERAPE } from "./trimestre-qui-derape";
import { FICHE as AGENCE_QUI_DEMARRE } from "./agence-qui-demarre";
import { FICHE as APPEL_D_OFFRES } from "./appel-d-offres";
import { FICHE as PRIX_QUI_NE_PASSE_PLUS } from "./prix-qui-ne-passe-plus";
import { FICHE as CLIENT_QUI_S_EN_VA } from "./client-qui-s-en-va";
import { FICHE as SITE_QUI_NE_VEND_PAS } from "./site-qui-ne-vend-pas";
import { FICHE as BUDGET_QUI_NE_TIENT_PAS } from "./budget-qui-ne-tient-pas";
import { FICHE as FOURNISSEUR_QUI_AUGMENTE } from "./fournisseur-qui-augmente";
import { FICHE as TRESORERIE_QUI_FOND } from "./tresorerie-qui-fond";
import { FICHE as INDICATEUR_QUI_MENT } from "./indicateur-qui-ment";
import { FICHE as FACTURE_QUI_FLAMBE } from "./facture-qui-flambe";
import { FICHE as CONTROLE_QUI_S_ANNONCE } from "./controle-qui-s-annonce";
import { FICHE as DEPOT_QUI_DEBORDE } from "./depot-qui-deborde";
import { FICHE as RECLAMATION_QUI_ENFLE } from "./reclamation-qui-enfle";
import { FICHE as QUAI_DANGEREUX } from "./quai-dangereux";
import { FICHE as PANNE_QUI_PARALYSE } from "./panne-qui-paralyse";
import { FICHE as TOURNEES_QUI_DEBORDENT } from "./tournees-qui-debordent";
import { FICHE as EQUIPE_QUI_S_EPUISE } from "./equipe-qui-s-epuise";
import { FICHE as COLLABORATEUR_QUI_DECROCHE } from "./collaborateur-qui-decroche";
import { FICHE as AGENDA_QUI_DEBORDE } from "./agenda-qui-deborde";
import { FICHE as EQUIPE_DISPERSEE } from "./equipe-dispersee";
import { FICHE as CENT_PREMIERS_JOURS } from "./cent-premiers-jours";
import { FICHE as POSTE_QUI_RESTE_VIDE } from "./poste-qui-reste-vide";
import { FICHE as TALENT_QUI_VEUT_PARTIR } from "./talent-qui-veut-partir";
import { FICHE as COMPETENCES_QUI_MANQUENT } from "./competences-qui-manquent";
import { FICHE as PREAVIS_DE_GREVE } from "./preavis-de-greve";
import { FICHE as PROJET_QUI_GLISSE } from "./projet-qui-glisse";
import { FICHE as REORGANISATION_QUI_COINCE } from "./reorganisation-qui-coince";
import { FICHE as FUSION_DES_AGENCES } from "./fusion-des-agences";
import { FICHE as NOUVEAU_SERVICE } from "./nouveau-service";
import { FICHE as COMMANDE_A_PRIX_CASSE } from "./commande-a-prix-casse";
import { FICHE as PRODUIT_DEFICITAIRE } from "./produit-deficitaire";
import { FICHE as FAIRE_OU_FAIRE_FAIRE } from "./faire-ou-faire-faire";
import { FICHE as SEUIL_QUI_BOUGE } from "./seuil-qui-bouge";
import { FICHE as ECARTS_DU_BUDGET } from "./ecarts-du-budget";
import { FICHE as ATELIER_SATURE } from "./atelier-sature";
import { FICHE as INVESTISSEMENT_A_CHOISIR } from "./investissement-a-choisir";
import { FICHE as CROISSANCE_A_FINANCER } from "./croissance-a-financer";
import { FICHE as LOUER_OU_ACHETER } from "./louer-ou-acheter";
import { FICHE as CLIENT_A_RISQUE } from "./client-a-risque";
import { FICHE as DISCOUNTER_QUI_ARRIVE } from "./discounter-qui-arrive";
import { FICHE as CONCURRENT_A_RACHETER } from "./concurrent-a-racheter";
import { FICHE as MARCHE_QUI_S_OUVRE } from "./marche-qui-s-ouvre";
import { FICHE as FABRICANT_EN_DIRECT } from "./fabricant-en-direct";
import { FICHE as PROJET_A_ARRETER } from "./projet-a-arreter";
import { FICHE as RESEAU_A_REDESSINER } from "./reseau-a-redessiner";
import { FICHE as PARI_DU_REEMPLOI } from "./pari-du-reemploi";
import { FICHE as GRAND_COMPTE_EXCLUSIF } from "./grand-compte-exclusif";
import { FICHE as LIBRE_SERVICE_QUI_PERD } from "./libre-service-qui-perd";
import { FICHE as BUREAU_QUI_S_ECHAUFFE } from "./bureau-qui-s-echauffe";
import { FICHE as CHAMBRES_BRADEES } from "./chambres-bradees";
import { FICHE as SEMINAIRE_QUI_EVINCE } from "./seminaire-qui-evince";
import { FICHE as SURRESERVATION } from "./surreservation";
import { FICHE as NOTE_QUI_CHUTE } from "./note-qui-chute";
import { FICHE as RATIO_MATIERE } from "./ratio-matiere";
import { FICHE as INTERSAISON } from "./intersaison";
import { FICHE as CHAMBRES_PAS_PRETES } from "./chambres-pas-pretes";
import { FICHE as BRIGADE_A_BOUT } from "./brigade-a-bout";
import { FICHE as RENOVATION_SANS_FERMER } from "./renovation-sans-fermer";
import { FICHE as SAISONNIERS_DE_JUILLET } from "./saisonniers-de-juillet";
import { FICHE as POSTES_INTROUVABLES } from "./postes-introuvables";
import { FICHE as APPRENTIS_QUI_DECROCHENT } from "./apprentis-qui-decrochent";
import { FICHE as DIPLOME_QUI_COMPTE } from "./diplome-qui-compte";
import { FICHE as CUISINE_CENTRALE } from "./cuisine-centrale";
import { FICHE as SPA_A_FINANCER } from "./spa-a-financer";
import { FICHE as ENSEIGNE_A_LA_PORTE } from "./enseigne-a-la-porte";
import { FICHE as APPELS_D_OFFRES_EN_RAFALE } from "./appels-d-offres-en-rafale";
import { FICHE as CLIENT_QUI_EN_DEMANDE_PLUS } from "./client-qui-en-demande-plus";
import { FICHE as LIVRABLE_REFUSE } from "./livrable-refuse";
import { FICHE as JOURS_NON_FACTURES } from "./jours-non-factures";
import { FICHE as FORFAIT_TROP_BAS } from "./forfait-trop-bas";
import { FICHE as FACTURES_QUI_DORMENT } from "./factures-qui-dorment";
import { FICHE as STAFFING_DU_LUNDI } from "./staffing-du-lundi";
import { FICHE as CONSULTANT_STAR } from "./consultant-star";
import { FICHE as PROMOTION_REFUSEE } from "./promotion-refusee";
import { FICHE as DEPARTS_A_DEUX_ANS } from "./departs-a-deux-ans";
import { FICHE as FREELANCES_OU_EMBAUCHES } from "./freelances-ou-embauches";
import { FICHE as PRACTICE_A_REORIENTER } from "./practice-a-reorienter";
import { FICHE as ASSISTANT_IA } from "./assistant-ia";
import { FICHE as ASSOCIE_QUI_PART } from "./associe-qui-part";
import { FICHE as GENERALISTE_OU_SPECIALISTE } from "./generaliste-ou-specialiste";
import { FICHE as LITS_VIDES } from "./lits-vides";
import { FICHE as SORTIES_QUI_BLOQUENT } from "./sorties-qui-bloquent";
import { FICHE as FAMILLE_QUI_ECRIT } from "./famille-qui-ecrit";
import { FICHE as REPIT_A_CREER } from "./repit-a-creer";
import { FICHE as INTERIM_QUI_FLAMBE } from "./interim-qui-flambe";
import { FICHE as SECTION_EN_DEFICIT } from "./section-en-deficit";
import { FICHE as HEURE_A_DOMICILE } from "./heure-a-domicile";
import { FICHE as CHUTES_LA_NUIT } from "./chutes-la-nuit";
import { FICHE as DOSSIER_DE_SOINS } from "./dossier-de-soins";
import { FICHE as POSTES_DE_DOUZE_HEURES } from "./postes-de-douze-heures";
import { FICHE as ABSENTEISME_QUI_S_INSTALLE } from "./absenteisme-qui-s-installe";
import { FICHE as FORMER_SES_SOIGNANTS } from "./former-ses-soignants";
import { FICHE as EQUIPES_JOUR_ET_NUIT } from "./equipes-jour-et-nuit";
import { FICHE as RECONSTRUIRE_OU_REGROUPER } from "./reconstruire-ou-regrouper";
import { FICHE as ASSOCIATION_A_REPRENDRE } from "./association-a-reprendre";
import { FICHE as VIRAGE_DOMICILIAIRE } from "./virage-domiciliaire";
import { FICHE as CHANGEMENTS_DE_FORMAT } from "./changements-de-format";
import { FICHE as DLC_QUI_TOMBE } from "./dlc-qui-tombe";
import { FICHE as LOT_A_RAPPELER } from "./lot-a-rappeler";
import { FICHE as NEGOCIATIONS_ANNUELLES } from "./negociations-annuelles";
import { FICHE as PROMOTION_QUI_COUTE } from "./promotion-qui-coute";
import { FICHE as APPEL_D_OFFRES_MDD } from "./appel-d-offres-mdd";
import { FICHE as EDI_QUI_S_IMPOSE } from "./edi-qui-s-impose";
import { FICHE as PRODUCTEURS_QUI_ARRETENT } from "./producteurs-qui-arretent";
import { FICHE as POT_A_REMPLACER } from "./pot-a-remplacer";
import { FICHE as ENERGIE_DE_L_USINE } from "./energie-de-l-usine";
import { FICHE as POLYVALENCE_DES_OPERATEURS } from "./polyvalence-des-operateurs";
import { FICHE as MAINTENANCE_QUI_COURT } from "./maintenance-qui-court";
import { FICHE as PIC_DES_FETES } from "./pic-des-fetes";
import { FICHE as EXPORT_A_OUVRIR } from "./export-a-ouvrir";
import { FICHE as GAMME_VEGETALE } from "./gamme-vegetale";
import { FICHE as OFFRE_DE_RACHAT } from "./offre-de-rachat";

export type { FicheEnseignant } from "./types";

export const FICHES: readonly FicheEnseignant[] = [
  TRIMESTRE_QUI_DERAPE,
  AGENCE_QUI_DEMARRE,
  APPEL_D_OFFRES,
  PRIX_QUI_NE_PASSE_PLUS,
  CLIENT_QUI_S_EN_VA,
  SITE_QUI_NE_VEND_PAS,
  BUDGET_QUI_NE_TIENT_PAS,
  FOURNISSEUR_QUI_AUGMENTE,
  TRESORERIE_QUI_FOND,
  INDICATEUR_QUI_MENT,
  FACTURE_QUI_FLAMBE,
  CONTROLE_QUI_S_ANNONCE,
  DEPOT_QUI_DEBORDE,
  RECLAMATION_QUI_ENFLE,
  QUAI_DANGEREUX,
  PANNE_QUI_PARALYSE,
  TOURNEES_QUI_DEBORDENT,
  EQUIPE_QUI_S_EPUISE,
  COLLABORATEUR_QUI_DECROCHE,
  AGENDA_QUI_DEBORDE,
  EQUIPE_DISPERSEE,
  CENT_PREMIERS_JOURS,
  POSTE_QUI_RESTE_VIDE,
  TALENT_QUI_VEUT_PARTIR,
  COMPETENCES_QUI_MANQUENT,
  PREAVIS_DE_GREVE,
  PROJET_QUI_GLISSE,
  REORGANISATION_QUI_COINCE,
  FUSION_DES_AGENCES,
  NOUVEAU_SERVICE,
  COMMANDE_A_PRIX_CASSE,
  PRODUIT_DEFICITAIRE,
  FAIRE_OU_FAIRE_FAIRE,
  SEUIL_QUI_BOUGE,
  ECARTS_DU_BUDGET,
  ATELIER_SATURE,
  INVESTISSEMENT_A_CHOISIR,
  CROISSANCE_A_FINANCER,
  LOUER_OU_ACHETER,
  CLIENT_A_RISQUE,
  DISCOUNTER_QUI_ARRIVE,
  CONCURRENT_A_RACHETER,
  MARCHE_QUI_S_OUVRE,
  FABRICANT_EN_DIRECT,
  PROJET_A_ARRETER,
  RESEAU_A_REDESSINER,
  PARI_DU_REEMPLOI,
  GRAND_COMPTE_EXCLUSIF,
  LIBRE_SERVICE_QUI_PERD,
  BUREAU_QUI_S_ECHAUFFE,
  CHAMBRES_BRADEES,
  SEMINAIRE_QUI_EVINCE,
  SURRESERVATION,
  NOTE_QUI_CHUTE,
  RATIO_MATIERE,
  INTERSAISON,
  CHAMBRES_PAS_PRETES,
  BRIGADE_A_BOUT,
  RENOVATION_SANS_FERMER,
  SAISONNIERS_DE_JUILLET,
  POSTES_INTROUVABLES,
  APPRENTIS_QUI_DECROCHENT,
  DIPLOME_QUI_COMPTE,
  CUISINE_CENTRALE,
  SPA_A_FINANCER,
  ENSEIGNE_A_LA_PORTE,
  APPELS_D_OFFRES_EN_RAFALE,
  CLIENT_QUI_EN_DEMANDE_PLUS,
  LIVRABLE_REFUSE,
  JOURS_NON_FACTURES,
  FORFAIT_TROP_BAS,
  FACTURES_QUI_DORMENT,
  STAFFING_DU_LUNDI,
  CONSULTANT_STAR,
  PROMOTION_REFUSEE,
  DEPARTS_A_DEUX_ANS,
  FREELANCES_OU_EMBAUCHES,
  PRACTICE_A_REORIENTER,
  ASSISTANT_IA,
  ASSOCIE_QUI_PART,
  GENERALISTE_OU_SPECIALISTE,
  LITS_VIDES,
  SORTIES_QUI_BLOQUENT,
  FAMILLE_QUI_ECRIT,
  REPIT_A_CREER,
  INTERIM_QUI_FLAMBE,
  SECTION_EN_DEFICIT,
  HEURE_A_DOMICILE,
  CHUTES_LA_NUIT,
  DOSSIER_DE_SOINS,
  POSTES_DE_DOUZE_HEURES,
  ABSENTEISME_QUI_S_INSTALLE,
  FORMER_SES_SOIGNANTS,
  EQUIPES_JOUR_ET_NUIT,
  RECONSTRUIRE_OU_REGROUPER,
  ASSOCIATION_A_REPRENDRE,
  VIRAGE_DOMICILIAIRE,
  CHANGEMENTS_DE_FORMAT,
  DLC_QUI_TOMBE,
  LOT_A_RAPPELER,
  NEGOCIATIONS_ANNUELLES,
  PROMOTION_QUI_COUTE,
  APPEL_D_OFFRES_MDD,
  EDI_QUI_S_IMPOSE,
  PRODUCTEURS_QUI_ARRETENT,
  POT_A_REMPLACER,
  ENERGIE_DE_L_USINE,
  POLYVALENCE_DES_OPERATEURS,
  MAINTENANCE_QUI_COURT,
  PIC_DES_FETES,
  EXPORT_A_OUVRIR,
  GAMME_VEGETALE,
  OFFRE_DE_RACHAT,
];

export const ficheParCode = (code: string): FicheEnseignant | undefined =>
  FICHES.find((f) => f.code === code);

/** Le hasard que toute la classe joue : le même que celui du débrief des entreprises. */
export { hasardDuDebrief as hasardDeLaClasse, lienDuDebrief as lienDeLaClasse } from "../debrief";
