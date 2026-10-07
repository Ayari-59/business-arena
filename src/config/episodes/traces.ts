/**
 * LES TRACES : ce qu'une partie mesure directement, par une règle écrite.
 *
 * Chaque épisode juge déjà, dans son bilan, le diagnostic de la semaine 1, sa
 * réévaluation, les options réflexes et la prévision chiffrée. On relève ici,
 * pour tous, de quoi appliquer les mêmes règles partout :
 *
 *   · le bon diagnostic, et celui qui s'en approche (une vraie cause, mais pas
 *     la principale) ;
 *   · les options réflexes, [décision, option], reprises des épisodes eux-mêmes ;
 *   · les seuils de la prévision : juste, et proche, dans l'unité de l'épisode.
 *
 * Un test vérifie que ces valeurs donnent les mêmes constats que le bilan de
 * chaque épisode : les traces et le bilan ne peuvent pas se contredire.
 */
import * as trimestreQuiDerape from "./trimestre-qui-derape";
import * as equipeQuiSEpuise from "./equipe-qui-s-epuise";
import * as depotQuiDeborde from "./depot-qui-deborde";
import * as budgetQuiNeTientPas from "./budget-qui-ne-tient-pas";
import * as projetQuiGlisse from "./projet-qui-glisse";
import * as fournisseurQuiAugmente from "./fournisseur-qui-augmente";
import * as posteQuiResteVide from "./poste-qui-reste-vide";
import * as reclamationQuiEnfle from "./reclamation-qui-enfle";
import * as quaiDangereux from "./quai-dangereux";
import * as reorganisationQuiCoince from "./reorganisation-qui-coince";
import * as tresorerieQuiFond from "./tresorerie-qui-fond";
import * as agenceQuiDemarre from "./agence-qui-demarre";
import * as panneQuiParalyse from "./panne-qui-paralyse";
import * as collaborateurQuiDecroche from "./collaborateur-qui-decroche";
import * as indicateurQuiMent from "./indicateur-qui-ment";
import * as appelDOffres from "./appel-d-offres";
import * as prixQuiNePassePlus from "./prix-qui-ne-passe-plus";
import * as agendaQuiDeborde from "./agenda-qui-deborde";
import * as preavisDeGreve from "./preavis-de-greve";
import * as clientQuiSEnVa from "./client-qui-s-en-va";
import * as tourneesQuiDebordent from "./tournees-qui-debordent";
import * as siteQuiNeVendPas from "./site-qui-ne-vend-pas";
import * as talentQuiVeutPartir from "./talent-qui-veut-partir";
import * as competencesQuiManquent from "./competences-qui-manquent";
import * as factureQuiFlambe from "./facture-qui-flambe";
import * as controleQuiSAnnonce from "./controle-qui-s-annonce";
import * as fusionDesAgences from "./fusion-des-agences";
import * as nouveauService from "./nouveau-service";
import * as equipeDispersee from "./equipe-dispersee";
import * as centPremiersJours from "./cent-premiers-jours";
import * as commandeAPrixCasse from "./commande-a-prix-casse";
import * as produitDeficitaire from "./produit-deficitaire";
import * as faireOuFaireFaire from "./faire-ou-faire-faire";
import * as seuilQuiBouge from "./seuil-qui-bouge";
import * as ecartsDuBudget from "./ecarts-du-budget";
import * as atelierSature from "./atelier-sature";
import * as investissementAChoisir from "./investissement-a-choisir";
import * as croissanceAFinancer from "./croissance-a-financer";
import * as louerOuAcheter from "./louer-ou-acheter";
import * as clientARisque from "./client-a-risque";
import * as discounterQuiArrive from "./discounter-qui-arrive";
import * as concurrentARacheter from "./concurrent-a-racheter";
import * as marcheQuiSOuvre from "./marche-qui-s-ouvre";
import * as fabricantEnDirect from "./fabricant-en-direct";
import * as projetAArreter from "./projet-a-arreter";
import * as reseauARedessiner from "./reseau-a-redessiner";
import * as pariDuReemploi from "./pari-du-reemploi";
import * as grandCompteExclusif from "./grand-compte-exclusif";
import * as chambresBradees from "./chambres-bradees";
import * as seminaireQuiEvince from "./seminaire-qui-evince";
import * as surreservation from "./surreservation";
import * as noteQuiChute from "./note-qui-chute";
import * as ratioMatiere from "./ratio-matiere";
import * as intersaison from "./intersaison";
import * as chambresPasPretes from "./chambres-pas-pretes";
import * as brigadeABout from "./brigade-a-bout";
import * as renovationSansFermer from "./renovation-sans-fermer";
import * as saisonniersDeJuillet from "./saisonniers-de-juillet";
import * as postesIntrouvables from "./postes-introuvables";
import * as apprentisQuiDecrochent from "./apprentis-qui-decrochent";
import * as cuisineCentrale from "./cuisine-centrale";
import * as spaAFinancer from "./spa-a-financer";
import * as enseigneALaPorte from "./enseigne-a-la-porte";

export interface TracesDeLEpisode {
  diagnostic: { juste: string; proche: string };
  reflexes: readonly (readonly [number, number])[];
  prevision: { juste: number; proche: number };
}

export const TRACES: Readonly<Record<string, TracesDeLEpisode>> = {
  "trimestre-qui-derape": {
    diagnostic: { juste: "karim", proche: "livraison" },
    reflexes: [...trimestreQuiDerape.REMISES_REFLEXES],
    prevision: { juste: 1, proche: 2.5 },
  },
  "equipe-qui-s-epuise": {
    diagnostic: { juste: "relances", proche: "effectif" },
    reflexes: [...equipeQuiSEpuise.PRESSIONS],
    prevision: { juste: 0.3, proche: 0.8 },
  },
  "depot-qui-deborde": {
    diagnostic: { juste: "repartition", proche: "inventaire" },
    reflexes: [...depotQuiDeborde.REFLEXES],
    prevision: { juste: 1.5, proche: 4 },
  },
  "budget-qui-ne-tient-pas": {
    diagnostic: { juste: "engagements", proche: "energie" },
    reflexes: [...budgetQuiNeTientPas.COUPES_AVEUGLES],
    prevision: { juste: 4, proche: 10 },
  },
  "projet-qui-glisse": {
    diagnostic: { juste: "perimetre", proche: "recette" },
    reflexes: [...projetQuiGlisse.REFLEXES],
    prevision: { juste: 10, proche: 25 },
  },
  "fournisseur-qui-augmente": {
    diagnostic: { juste: "levier", proche: "couts" },
    reflexes: [...fournisseurQuiAugmente.REFLEXES],
    prevision: { juste: 1, proche: 2.5 },
  },
  "poste-qui-reste-vide": {
    diagnostic: { juste: "annonce", proche: "marche" },
    reflexes: [...posteQuiResteVide.REFLEXES],
    prevision: { juste: 3, proche: 8 },
  },
  "reclamation-qui-enfle": {
    diagnostic: { juste: "lot", proche: "usage" },
    reflexes: [...reclamationQuiEnfle.REFLEXES],
    prevision: { juste: 1, proche: 2.5 },
  },
  "quai-dangereux": {
    diagnostic: { juste: "signaux", proche: "habilitation" },
    reflexes: [...quaiDangereux.REFLEXES],
    prevision: { juste: 2, proche: 4 },
  },
  "reorganisation-qui-coince": {
    diagnostic: { juste: "objections", proche: "rythme" },
    reflexes: [...reorganisationQuiCoince.INJONCTIONS, ...reorganisationQuiCoince.RECULS],
    prevision: { juste: 3, proche: 8 },
  },
  "tresorerie-qui-fond": {
    diagnostic: { juste: "bfr", proche: "clients" },
    reflexes: [...tresorerieQuiFond.REFLEXES],
    prevision: { juste: 40, proche: 120 },
  },
  "agence-qui-demarre": {
    diagnostic: { juste: "service", proche: "notoriete" },
    reflexes: [...agenceQuiDemarre.PRIX, ...agenceQuiDemarre.ATTENTES],
    prevision: { juste: 2, proche: 5 },
  },
  "panne-qui-paralyse": {
    diagnostic: { juste: "duree", proche: "redemarrage" },
    reflexes: [...panneQuiParalyse.REFLEXES],
    prevision: { juste: 5, proche: 12 },
  },
  "collaborateur-qui-decroche": {
    diagnostic: { juste: "outil", proche: "confiance" },
    reflexes: [...collaborateurQuiDecroche.REFLEXES],
    prevision: { juste: 0.5, proche: 1.2 },
  },
  "indicateur-qui-ment": {
    diagnostic: { juste: "goodhart", proche: "formation" },
    reflexes: [...indicateurQuiMent.REFLEXES],
    prevision: { juste: 2, proche: 5 },
  },
  "appel-d-offres": {
    diagnostic: { juste: "grille", proche: "charge" },
    reflexes: [...appelDOffres.REFLEXES],
    prevision: { juste: 8, proche: 20 },
  },
  "prix-qui-ne-passe-plus": {
    diagnostic: { juste: "bloc", proche: "couts" },
    reflexes: [...prixQuiNePassePlus.REFLEXES],
    prevision: { juste: 1, proche: 2.5 },
  },
  "agenda-qui-deborde": {
    diagnostic: { juste: "goulot", proche: "reunions" },
    reflexes: [...agendaQuiDeborde.REFLEXES],
    prevision: { juste: 8, proche: 20 },
  },
  "preavis-de-greve": {
    diagnostic: { juste: "interets", proche: "confiance" },
    reflexes: [...preavisDeGreve.FERMETES, ...preavisDeGreve.CONCESSIONS],
    prevision: { juste: 4, proche: 10 },
  },
  "client-qui-s-en-va": {
    diagnostic: { juste: "irritant", proche: "facturation" },
    reflexes: [...clientQuiSEnVa.REFLEXES],
    prevision: { juste: 4, proche: 12 },
  },
  "tournees-qui-debordent": {
    diagnostic: { juste: "creneaux", proche: "soustraitance" },
    reflexes: [...tourneesQuiDebordent.REFLEXES],
    prevision: { juste: 1.5, proche: 4 },
  },
  "site-qui-ne-vend-pas": {
    diagnostic: { juste: "entonnoir", proche: "agences" },
    reflexes: [...siteQuiNeVendPas.REFLEXES],
    prevision: { juste: 8, proche: 20 },
  },
  "talent-qui-veut-partir": {
    diagnostic: { juste: "besoins", proche: "charge" },
    reflexes: [...talentQuiVeutPartir.REFLEXES],
    prevision: { juste: 3, proche: 7 },
  },
  "competences-qui-manquent": {
    diagnostic: { juste: "transmission", proche: "remplacement" },
    reflexes: [...competencesQuiManquent.REFLEXES],
    prevision: { juste: 8, proche: 20 },
  },
  "facture-qui-flambe": {
    diagnostic: { juste: "horsHoraires", proche: "prix" },
    reflexes: [...factureQuiFlambe.REFLEXES],
    prevision: { juste: 10, proche: 25 },
  },
  "controle-qui-s-annonce": {
    diagnostic: { juste: "circuit", proche: "arriere" },
    reflexes: [...controleQuiSAnnonce.REFLEXES],
    prevision: { juste: 2, proche: 5 },
  },
  "fusion-des-agences": {
    diagnostic: { juste: "personnes", proche: "doublons" },
    reflexes: [...fusionDesAgences.REFLEXES],
    prevision: { juste: 1.5, proche: 4 },
  },
  "nouveau-service": {
    diagnostic: { juste: "inconnue", proche: "concurrent" },
    reflexes: [...nouveauService.PROMESSES, ...nouveauService.ATTENTES],
    prevision: { juste: 2, proche: 4 },
  },
  "equipe-dispersee": {
    diagnostic: { juste: "isolement", proche: "competences" },
    reflexes: [...equipeDispersee.REFLEXES],
    prevision: { juste: 2, proche: 5 },
  },
  "cent-premiers-jours": {
    diagnostic: { juste: "irritants", proche: "comptoir" },
    reflexes: [...centPremiersJours.IMPOSITIONS, ...centPremiersJours.MENAGEMENTS],
    prevision: { juste: 4, proche: 10 },
  },
  "commande-a-prix-casse": {
    diagnostic: { juste: "marginal", proche: "saison" },
    reflexes: [...commandeAPrixCasse.REFLEXES],
    prevision: { juste: 0.5, proche: 3 },
  },
  "produit-deficitaire": {
    diagnostic: { juste: "repartition", proche: "liees" },
    reflexes: [...produitDeficitaire.REFLEXES],
    prevision: { juste: 2, proche: 8 },
  },
  "faire-ou-faire-faire": {
    diagnostic: { juste: "evitables", proche: "lointaines" },
    reflexes: [...faireOuFaireFaire.REFLEXES],
    prevision: { juste: 2, proche: 7 },
  },
  "seuil-qui-bouge": {
    diagnostic: { juste: "structure", proche: "volume" },
    reflexes: [...seuilQuiBouge.REFLEXES],
    prevision: { juste: 5, proche: 15 },
  },
  "ecarts-du-budget": {
    diagnostic: { juste: "presse", proche: "moules" },
    reflexes: [...ecartsDuBudget.REFLEXES],
    prevision: { juste: 0.05, proche: 0.5 },
  },
  "atelier-sature": {
    diagnostic: { juste: "facteurRare", proche: "capacite" },
    reflexes: [...atelierSature.REFLEXES],
    prevision: { juste: 10, proche: 40 },
  },
  "investissement-a-choisir": {
    diagnostic: { juste: "van", proche: "enveloppe" },
    reflexes: [...investissementAChoisir.REFLEXES],
    prevision: { juste: 5, proche: 15 },
  },
  "croissance-a-financer": {
    diagnostic: { juste: "structurel", proche: "decalage" },
    reflexes: [...croissanceAFinancer.REFLEXES],
    prevision: { juste: 20, proche: 75 },
  },
  "louer-ou-acheter": {
    diagnostic: { juste: "utilisation", proche: "pannes" },
    reflexes: [...louerOuAcheter.REFLEXES],
    prevision: { juste: 1, proche: 3.5 },
  },
  "client-a-risque": {
    diagnostic: { juste: "perteAttendue", proche: "fragilite" },
    reflexes: [...clientARisque.REFLEXES],
    prevision: { juste: 2, proche: 8 },
  },
  "discounter-qui-arrive": {
    diagnostic: { juste: "exposition", proche: "service" },
    reflexes: [...discounterQuiArrive.REFLEXES],
    prevision: { juste: 10, proche: 40 },
  },
  "concurrent-a-racheter": {
    diagnostic: { juste: "prix", proche: "synergies" },
    reflexes: [...concurrentARacheter.REFLEXES],
    prevision: { juste: 100, proche: 400 },
  },
  "marche-qui-s-ouvre": {
    diagnostic: { juste: "option", proche: "artisans" },
    reflexes: [...marcheQuiSOuvre.REFLEXES],
    prevision: { juste: 4, proche: 12 },
  },
  "fabricant-en-direct": {
    diagnostic: { juste: "exposition", proche: "services" },
    reflexes: [...fabricantEnDirect.REFLEXES],
    prevision: { juste: 15, proche: 60 },
  },
  "projet-a-arreter": {
    diagnostic: { juste: "avenir", proche: "sites" },
    reflexes: [...projetAArreter.REFLEXES],
    prevision: { juste: 5, proche: 15 },
  },
  "reseau-a-redessiner": {
    diagnostic: { juste: "reseau", proche: "incertitude" },
    reflexes: [...reseauARedessiner.REFLEXES],
    prevision: { juste: 8, proche: 25 },
  },
  "pari-du-reemploi": {
    diagnostic: { juste: "gisements", proche: "premier" },
    reflexes: [...pariDuReemploi.REFLEXES],
    prevision: { juste: 300, proche: 1000 },
  },
  "grand-compte-exclusif": {
    diagnostic: { juste: "dependance", proche: "marge" },
    reflexes: [...grandCompteExclusif.REFLEXES],
    prevision: { juste: 5, proche: 15 },
  },
  "chambres-bradees": {
    diagnostic: { juste: "segments", proche: "semaine" },
    reflexes: [...chambresBradees.REFLEXES],
    prevision: { juste: 1, proche: 3 },
  },
  "seminaire-qui-evince": {
    diagnostic: { juste: "deplacement", proche: "attrition" },
    reflexes: [...seminaireQuiEvince.REFLEXES],
    prevision: { juste: 1.5, proche: 4 },
  },
  surreservation: {
    diagnostic: { juste: "arbitrage", proche: "defections" },
    reflexes: [...surreservation.REFLEXES],
    prevision: { juste: 0.5, proche: 1.5 },
  },
  "note-qui-chute": {
    diagnostic: { juste: "climatisation", proche: "petitDejeuner" },
    reflexes: [...noteQuiChute.REFLEXES],
    prevision: { juste: 300, proche: 1000 },
  },
  "ratio-matiere": {
    diagnostic: { juste: "carte", proche: "grammages" },
    reflexes: [...ratioMatiere.REFLEXES],
    prevision: { juste: 0.3, proche: 1 },
  },
  intersaison: {
    diagnostic: { juste: "cycle", proche: "travaux" },
    reflexes: [...intersaison.REFLEXES],
    prevision: { juste: 10, proche: 30 },
  },
  "chambres-pas-pretes": {
    diagnostic: { juste: "flux", proche: "ordre" },
    reflexes: [...chambresPasPretes.REFLEXES],
    prevision: { juste: 0.5, proche: 1.5 },
  },
  "brigade-a-bout": {
    diagnostic: { juste: "pics", proche: "effectif" },
    reflexes: [...brigadeABout.REFLEXES],
    prevision: { juste: 1, proche: 3 },
  },
  "renovation-sans-fermer": {
    diagnostic: { juste: "nuisances", proche: "delai" },
    reflexes: [...renovationSansFermer.REFLEXES],
    prevision: { juste: 0.5, proche: 2 },
  },
  "saisonniers-de-juillet": {
    diagnostic: { juste: "integration", proche: "departs" },
    reflexes: [...saisonniersDeJuillet.REFLEXES],
    prevision: { juste: 20, proche: 80 },
  },
  "postes-introuvables": {
    diagnostic: { juste: "logement", proche: "coupures" },
    reflexes: [...postesIntrouvables.REFLEXES],
    prevision: { juste: 2, proche: 6 },
  },
  "apprentis-qui-decrochent": {
    diagnostic: { juste: "tutorat", proche: "calendrier" },
    reflexes: [...apprentisQuiDecrochent.REFLEXES],
    prevision: { juste: 0.3, proche: 0.8 },
  },
  "cuisine-centrale": {
    diagnostic: { juste: "identite", proche: "logistique" },
    reflexes: [...cuisineCentrale.REFLEXES],
    prevision: { juste: 5, proche: 20 },
  },
  "spa-a-financer": {
    diagnostic: { juste: "differentiel", proche: "prix" },
    reflexes: [...spaAFinancer.REFLEXES],
    prevision: { juste: 0.5, proche: 1.5 },
  },
  "enseigne-a-la-porte": {
    diagnostic: { juste: "portefeuille", proche: "commissions" },
    reflexes: [...enseigneALaPorte.REFLEXES],
    prevision: { juste: 8, proche: 20 },
  },
};
