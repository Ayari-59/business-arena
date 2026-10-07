/**
 * LES ÉPISODES MANAGER, dans l'ordre où on les propose.
 *
 * Un épisode s'ajoute ici et nulle part ailleurs : la liste, la page de jeu,
 * le tableau de bord, la courbe et le bilan le lisent de ce registre.
 */
import type { Episode } from "@/config/episodes/types";
import { EPISODE_TRIMESTRE } from "./trimestre-qui-derape";
import { EPISODE_EQUIPE } from "./equipe-qui-s-epuise";
import { EPISODE_DEPOT } from "./depot-qui-deborde";
import { EPISODE_BUDGET } from "./budget-qui-ne-tient-pas";
import { EPISODE_PROJET } from "./projet-qui-glisse";
import { EPISODE_ACHATS } from "./fournisseur-qui-augmente";
import { EPISODE_RECRUTEMENT } from "./poste-qui-reste-vide";
import { EPISODE_QUALITE } from "./reclamation-qui-enfle";
import { EPISODE_SECURITE } from "./quai-dangereux";
import { EPISODE_CHANGEMENT } from "./reorganisation-qui-coince";
import { EPISODE_TRESORERIE } from "./tresorerie-qui-fond";
import { EPISODE_LANCEMENT } from "./agence-qui-demarre";
import { EPISODE_CRISE } from "./panne-qui-paralyse";
import { EPISODE_PERFORMANCE } from "./collaborateur-qui-decroche";
import { EPISODE_INDICATEURS } from "./indicateur-qui-ment";
import { EPISODE_APPEL_OFFRES } from "./appel-d-offres";
import { EPISODE_PRIX } from "./prix-qui-ne-passe-plus";
import { EPISODE_AGENDA } from "./agenda-qui-deborde";
import { EPISODE_DIALOGUE_SOCIAL } from "./preavis-de-greve";
import { EPISODE_FIDELISATION } from "./client-qui-s-en-va";
import { EPISODE_TRANSPORT } from "./tournees-qui-debordent";
import { EPISODE_NUMERIQUE } from "./site-qui-ne-vend-pas";
import { EPISODE_TALENTS } from "./talent-qui-veut-partir";
import { EPISODE_COMPETENCES } from "./competences-qui-manquent";
import { EPISODE_ENERGIE } from "./facture-qui-flambe";
import { EPISODE_CONFORMITE } from "./controle-qui-s-annonce";
import { EPISODE_FUSION } from "./fusion-des-agences";
import { EPISODE_INNOVATION } from "./nouveau-service";
import { EPISODE_DISTANCE } from "./equipe-dispersee";
import { EPISODE_PRISE_DE_POSTE } from "./cent-premiers-jours";
import { EPISODE_COMMANDE_SPECIALE } from "./commande-a-prix-casse";
import { EPISODE_PRODUIT_DEFICITAIRE } from "./produit-deficitaire";
import { EPISODE_FAIRE_FAIRE } from "./faire-ou-faire-faire";
import { EPISODE_SEUIL } from "./seuil-qui-bouge";
import { EPISODE_ECARTS } from "./ecarts-du-budget";
import { EPISODE_ATELIER_SATURE } from "./atelier-sature";
import { EPISODE_INVESTISSEMENT } from "./investissement-a-choisir";
import { EPISODE_CROISSANCE } from "./croissance-a-financer";
import { EPISODE_LOUER_ACHETER } from "./louer-ou-acheter";
import { EPISODE_CLIENT_A_RISQUE } from "./client-a-risque";
import { EPISODE_DISCOUNTER } from "./discounter-qui-arrive";
import { EPISODE_RACHAT } from "./concurrent-a-racheter";
import { EPISODE_NOUVEAU_MARCHE } from "./marche-qui-s-ouvre";
import { EPISODE_DESINTERMEDIATION } from "./fabricant-en-direct";
import { EPISODE_ESCALADE } from "./projet-a-arreter";
import { EPISODE_RESEAU } from "./reseau-a-redessiner";
import { EPISODE_REEMPLOI } from "./pari-du-reemploi";
import { EPISODE_EXCLUSIVITE } from "./grand-compte-exclusif";
import { EPISODE_YIELD } from "./chambres-bradees";
import { EPISODE_SEMINAIRE } from "./seminaire-qui-evince";
import { EPISODE_SURRESERVATION } from "./surreservation";
import { EPISODE_NOTE_EN_LIGNE } from "./note-qui-chute";
import { EPISODE_RATIO_MATIERE } from "./ratio-matiere";
import { EPISODE_INTERSAISON } from "./intersaison";
import { EPISODE_HEBERGEMENT } from "./chambres-pas-pretes";
import { EPISODE_BRIGADE } from "./brigade-a-bout";
import { EPISODE_RENOVATION } from "./renovation-sans-fermer";
import { EPISODE_SAISONNIERS } from "./saisonniers-de-juillet";
import { EPISODE_PENURIE } from "./postes-introuvables";
import { EPISODE_APPRENTIS } from "./apprentis-qui-decrochent";
import { EPISODE_CUISINE_CENTRALE } from "./cuisine-centrale";
import { EPISODE_SPA } from "./spa-a-financer";
import { EPISODE_ENSEIGNE } from "./enseigne-a-la-porte";
import { EPISODE_GO_NO_GO } from "./appels-d-offres-en-rafale";
import { EPISODE_PERIMETRE } from "./client-qui-en-demande-plus";
import { EPISODE_LIVRABLE } from "./livrable-refuse";
import { EPISODE_REALISATION } from "./jours-non-factures";
import { EPISODE_COUT_DU_JOUR } from "./forfait-trop-bas";
import { EPISODE_EN_COURS } from "./factures-qui-dorment";
import { EPISODE_STAFFING } from "./staffing-du-lundi";
import { EPISODE_STAR } from "./consultant-star";
import { EPISODE_EVALUATION } from "./promotion-refusee";
import { EPISODE_TURNOVER } from "./departs-a-deux-ans";
import { EPISODE_FREELANCES } from "./freelances-ou-embauches";
import { EPISODE_RECONVERSION } from "./practice-a-reorienter";
import { EPISODE_IA } from "./assistant-ia";
import { EPISODE_SORTIE_ASSOCIE } from "./associe-qui-part";
import { EPISODE_POSITIONNEMENT } from "./generaliste-ou-specialiste";
import { EPISODE_ADMISSIONS } from "./lits-vides";
import { EPISODE_PARCOURS } from "./sorties-qui-bloquent";
import { EPISODE_FAMILLES } from "./famille-qui-ecrit";
import { EPISODE_INTERIM } from "./interim-qui-flambe";
import { EPISODE_SECTIONS } from "./section-en-deficit";
import { EPISODE_HEURE_DOMICILE } from "./heure-a-domicile";
import { EPISODE_CHUTES } from "./chutes-la-nuit";
import { EPISODE_DOSSIER_SOINS } from "./dossier-de-soins";
import { EPISODE_DOUZE_HEURES } from "./postes-de-douze-heures";
import { EPISODE_ABSENTEISME } from "./absenteisme-qui-s-installe";
import { EPISODE_VAE } from "./former-ses-soignants";
import { EPISODE_JOUR_NUIT } from "./equipes-jour-et-nuit";
import { EPISODE_RECONSTRUCTION } from "./reconstruire-ou-regrouper";
import { EPISODE_REPRISE } from "./association-a-reprendre";
import { EPISODE_VIRAGE } from "./virage-domiciliaire";

export const EPISODES: readonly Episode[] = [
  EPISODE_TRIMESTRE,
  EPISODE_LANCEMENT,
  EPISODE_APPEL_OFFRES,
  EPISODE_PRIX,
  EPISODE_FIDELISATION,
  EPISODE_NUMERIQUE,
  EPISODE_BUDGET,
  EPISODE_ACHATS,
  EPISODE_TRESORERIE,
  EPISODE_INDICATEURS,
  EPISODE_ENERGIE,
  EPISODE_CONFORMITE,
  EPISODE_DEPOT,
  EPISODE_QUALITE,
  EPISODE_SECURITE,
  EPISODE_CRISE,
  EPISODE_TRANSPORT,
  EPISODE_EQUIPE,
  EPISODE_PERFORMANCE,
  EPISODE_AGENDA,
  EPISODE_DISTANCE,
  EPISODE_PRISE_DE_POSTE,
  EPISODE_RECRUTEMENT,
  EPISODE_TALENTS,
  EPISODE_COMPETENCES,
  EPISODE_DIALOGUE_SOCIAL,
  EPISODE_PROJET,
  EPISODE_CHANGEMENT,
  EPISODE_FUSION,
  EPISODE_INNOVATION,
  EPISODE_COMMANDE_SPECIALE,
  EPISODE_PRODUIT_DEFICITAIRE,
  EPISODE_FAIRE_FAIRE,
  EPISODE_SEUIL,
  EPISODE_ECARTS,
  EPISODE_ATELIER_SATURE,
  EPISODE_INVESTISSEMENT,
  EPISODE_CROISSANCE,
  EPISODE_LOUER_ACHETER,
  EPISODE_CLIENT_A_RISQUE,
  EPISODE_DISCOUNTER,
  EPISODE_RACHAT,
  EPISODE_NOUVEAU_MARCHE,
  EPISODE_DESINTERMEDIATION,
  EPISODE_ESCALADE,
  EPISODE_RESEAU,
  EPISODE_REEMPLOI,
  EPISODE_EXCLUSIVITE,
  EPISODE_YIELD,
  EPISODE_SEMINAIRE,
  EPISODE_SURRESERVATION,
  EPISODE_NOTE_EN_LIGNE,
  EPISODE_RATIO_MATIERE,
  EPISODE_INTERSAISON,
  EPISODE_HEBERGEMENT,
  EPISODE_BRIGADE,
  EPISODE_RENOVATION,
  EPISODE_SAISONNIERS,
  EPISODE_PENURIE,
  EPISODE_APPRENTIS,
  EPISODE_CUISINE_CENTRALE,
  EPISODE_SPA,
  EPISODE_ENSEIGNE,
  EPISODE_GO_NO_GO,
  EPISODE_PERIMETRE,
  EPISODE_LIVRABLE,
  EPISODE_REALISATION,
  EPISODE_COUT_DU_JOUR,
  EPISODE_EN_COURS,
  EPISODE_STAFFING,
  EPISODE_STAR,
  EPISODE_EVALUATION,
  EPISODE_TURNOVER,
  EPISODE_FREELANCES,
  EPISODE_RECONVERSION,
  EPISODE_IA,
  EPISODE_SORTIE_ASSOCIE,
  EPISODE_POSITIONNEMENT,
  EPISODE_ADMISSIONS,
  EPISODE_PARCOURS,
  EPISODE_FAMILLES,
  EPISODE_INTERIM,
  EPISODE_SECTIONS,
  EPISODE_HEURE_DOMICILE,
  EPISODE_CHUTES,
  EPISODE_DOSSIER_SOINS,
  EPISODE_DOUZE_HEURES,
  EPISODE_ABSENTEISME,
  EPISODE_VAE,
  EPISODE_JOUR_NUIT,
  EPISODE_RECONSTRUCTION,
  EPISODE_REPRISE,
  EPISODE_VIRAGE,
];

export const episodeParCode = (code: string): Episode | undefined =>
  EPISODES.find((e) => e.code === code);
