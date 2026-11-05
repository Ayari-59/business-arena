import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { compteMoyen } from "../monde/relation-client";
import {
  COUT_D_UN_TELEACTEUR,
  COUT_VISE_D_UN_RENDEZ_VOUS,
  CRENEAUX_DE_CHAQUE_TELEACTEUR,
  CRENEAUX_DE_LA_LIGNE,
  CRENEAUX_D_UN_TELEACTEUR,
  DMT_AVEC_L_ESPACE_EN_LIGNE,
  JOURS_DU_MOIS,
  MINUTES_D_UN_CRENEAU,
  OCCUPATION_CIBLE,
  PRIME_DU_MOIS,
  RAPPEL_PROGRAMME,
  RENDEZ_VOUS_QU_HUGO_PEUT_TENIR,
  RENDEZ_VOUS_VISES,
  TELEACTEURS,
  coutDuPlateau,
  heuresDuMoisDUnCreneau,
  ligneClients,
  prospectionDuMois,
  tableauDeBordDesTeleacteurs,
  tauxDeRendezVousDeN,
} from "../monde/plateau-d-atlas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { POURQUOI_LE_CABINET, ficheDe } from "./valeur-d-un-client";

/**
 * CHAPITRE : LE PLATEAU DE TÉLÉACTEURS, CHARGE, EFFECTIF ET PERFORMANCE (BTS NDRC, palier 4 ; bloc 2,
 * la relation client à distance, et bloc 1, la performance collective).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : ATLAS CONSEIL
 * ouvre en N + 1 un plateau de 4 téléacteurs, dont la fiche et le modèle sont dans
 * monde/plateau-d-atlas.ts. La fiche reprend de l'année N du cabinet (monde/atlas-conseil.ts) le taux de
 * rendez-vous de la prospection (5 % des contacts) et la marge d'un compte (21 000 €). Une évolution du
 * moteur ne change rien ici.
 *
 * L'objet : la ligne clients d'abord (120 appels par jour en quatre créneaux, 6 minutes de traitement,
 * 2 téléacteurs à chaque créneau) : la charge, le taux de décroché (90 %), le taux d'occupation (80 % au
 * pic, 40 % au creux), l'effectif nécessaire créneau par créneau (2, 3, 2, 1) et le planning qui
 * décroche tout avec les mêmes 8 créneaux. Puis la prospection, sur les 4 créneaux qui restent :
 * 10 appels par heure, 15 % de contacts argumentés, 12 rendez-vous, 320 € l'un. Le tableau de bord
 * des 4 téléacteurs, et la prime qui récompense le bon résultat (les rendez-vous honorés, pas les
 * rendez-vous pris). Enfin la décision : un téléacteur de plus, ou le rappel programmé.
 *
 * Le piège central : la moyenne de la journée. À 67,5 % d'occupation, le plateau paraît avoir de la
 * marge ; au créneau de 11 h, il perd pourtant un appel sur quatre. Et un téléacteur de plus fait plus
 * de rendez-vous qu'Hugo ne peut en tenir, au même coût chacun.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, la-charge-du-creneau, l-occupation (la formule est au repère ou dans la question) ;
 *   · l'expérience avant la formule : predire-le-planning puis le-laboratoire-du-planning (les
 *     téléacteurs de chaque créneau) avant l-effectif-necessaire ; predire-les-appels puis
 *     les-appels-au-curseur (les appels par heure qui mettent le rendez-vous à 300 €) avant
 *     face-a-n ;
 *   · autonome : l-effectif-necessaire, la-prospection, le-tableau-des-teleacteurs, la-prime ;
 *   · expert : le-laboratoire-du-plateau (téléacteurs, appels par heure, rappel programmé, avec le
 *     graphique du coût d'un rendez-vous), un-teleacteur-de-plus (la décision), l-espace-en-ligne (une
 *     variante chiffrée), la-cible-d-occupation (le droit et la santé au travail) ; puis la synthèse.
 */

/** Le chapitre se joue chez le cabinet du cours, ATLAS CONSEIL, qui ouvre le plateau en N + 1. */
export const ENTREPRISES_DU_PLATEAU: readonly string[] = ["conseil"];

/** Le créneau du pic et celui du creux, ceux que le chapitre fait calculer. */
export const CRENEAU_DU_PIC = 1;
export const CRENEAU_DU_CREUX = 3;

/** Les bornes du curseur des appels émis par heure. */
export const APPELS_DU_CURSEUR = { min: 6, max: 16 } as const;

/** Les leviers des deux laboratoires. */
export const LEVIERS_DU_PLANNING = { min: 0, max: 4, pas: 1 } as const;
export const LEVIERS_DU_PLATEAU = {
  teleacteurs: { min: 4, max: 6, pas: 1 },
  appelsParHeure: { min: 8, max: 12, pas: 1 },
} as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Une part (0,725) écrite en pourcentage, au dixième (72,5 %). */
const pct = (x: number, d = 1) => `${(Math.round(x * 100 * 10 ** d) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** Une part en pourcentage, au dixième : ce que l'élève tape (0,725 → 72,5). */
const enPct = (x: number) => Math.round(x * 1000) / 10 + 0;
/** « d'Inès », « de Léa » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêhAEIOUYÉÈH]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Tout ce que le chapitre et son cas demandent, sur la fiche du plateau. */
export function plateauDuCabinet(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const ligne = ligneClients();
  const effectif = ligne.effectifNecessaire;
  const replanifiee = ligneClients({ presents: effectif });
  const cout = coutDuPlateau();
  const prospection = prospectionDuMois();
  const avecLeRappel = prospectionDuMois({ rappelProgramme: true });
  const unDePlus = prospectionDuMois({ teleacteurs: 5 });
  const tdb = tableauDeBordDesTeleacteurs();
  const pic = ligne.creneaux[CRENEAU_DU_PIC]!;
  const creux = ligne.creneaux[CRENEAU_DU_CREUX]!;
  const m = compteMoyen(f);
  const canal = f.canaux.find((k) => k.code === "prospection")!;
  // Ce que vaut un rendez-vous tenu : la part de rendez-vous qui devient un compte (celle de N) × la marge d'un compte la première année.
  const contratsParRendezVous = canal.contrats / canal.rendezVous;
  const valeurDUnRendezVousHonore = auCentime(contratsParRendezVous * m.marge);
  // Le coût d'un rendez-vous de la prospection de N, le temps d'Hugo compris.
  const coutDUnRendezVousDeN = auCentime(canal.cout / canal.rendezVous);
  // Le curseur : les appels par heure qui mettent le rendez-vous au coût visé.
  const rendezVousParAppelParHeure = prospection.heures * prospection.joignabilite * tauxDeRendezVousDeN();
  const appelsPourLeCoutVise = Math.ceil(prospection.cout / (COUT_VISE_D_UN_RENDEZ_VOUS * rendezVousParAppelParHeure) - 1e-9);
  // La variante de l'espace en ligne.
  const espace = ligneClients({ dmt: DMT_AVEC_L_ESPACE_EN_LIGNE });
  const prospectionAvecLEspace = prospectionDuMois({ creneauxDeLigne: espace.creneauxNecessaires });
  const coutLigneParMois = auCentime(replanifiee.creneauxTenus * heuresDuMoisDUnCreneau() * cout.coutHoraire);
  return {
    f,
    ligne,
    effectif,
    replanifiee,
    cout,
    prospection,
    avecLeRappel,
    unDePlus,
    tdb,
    pic,
    creux,
    m,
    canal,
    contratsParRendezVous,
    valeurDUnRendezVousHonore,
    coutDUnRendezVousDeN,
    coutDUnRendezVousHonore: auCentime(prospection.cout / tdb.rendezVousHonores),
    rendezVousParAppelParHeure,
    appelsPourLeCoutVise,
    espace,
    prospectionAvecLEspace,
    creneauxLiberes: ligne.creneauxNecessaires - espace.creneauxNecessaires,
    rendezVousEnPlusAvecLEspace: auCentime(prospectionAvecLEspace.rendezVous - prospection.rendezVous),
    coutLigneParMois,
    coutDUnAppelDecroche: auCentime(coutLigneParMois / (replanifiee.decroches * JOURS_DU_MOIS)),
    hugo: f.commerciaux.find((k) => k.code === "conquete")!.prenom,
  };
}

export type PlateauDuCabinet = ReturnType<typeof plateauDuCabinet>;

/** Le planning du laboratoire : les téléacteurs de chaque créneau, et ce qu'ils décrochent. */
export function laboratoireDuPlanning(p: Readonly<Record<string, number>>) {
  const presents = CRENEAUX_DE_LA_LIGNE.map((_, i) => p[`c${i}`]!);
  const l = ligneClients({ presents });
  return {
    l,
    creneauxDeLigne: l.creneauxTenus,
    creneauxDeProspection: Math.max(0, CRENEAUX_D_UN_TELEACTEUR * TELEACTEURS.length - l.creneauxTenus),
    tauxDeDecroche: enPct(l.tauxDeDecroche),
    occupationMaximale: enPct(Math.max(...l.creneaux.map((k) => k.occupation))),
    occupationMinimale: enPct(Math.min(...l.creneaux.map((k) => k.occupation))),
  };
}

/** Le plateau du laboratoire : les téléacteurs, les appels par heure, le rappel programmé (0 ou 1). */
export function laboratoireDuPlateau(p: Readonly<Record<string, number>>) {
  return prospectionDuMois({ teleacteurs: p.teleacteurs!, appelsParHeure: p.appelsParHeure!, rappelProgramme: p.rappel === 1 });
}

/** Le défi du laboratoire du plateau est-il relevé à cette position ? */
const defiDuPlateau = (p: Readonly<Record<string, number>>) => {
  const x = laboratoireDuPlateau(p);
  return x.rendezVous >= RENDEZ_VOUS_VISES - 1e-9 && x.rendezVous <= RENDEZ_VOUS_QU_HUGO_PEUT_TENIR + 1e-9 && x.coutParRendezVous !== null && x.coutParRendezVous <= COUT_VISE_D_UN_RENDEZ_VOUS;
};

/** La journée type de la ligne : le document de départ. */
export function tableauDeLaLigne(x: PlateauDuCabinet): TableauDeDonnees {
  return {
    titre: `La ligne clients ${dE(x.f.entreprise)}, journée type`,
    colonnes: x.ligne.creneaux.map((k) => k.libelle),
    lignes: [
      { libelle: "Appels reçus", valeurs: x.ligne.creneaux.map((k) => qte(k.recus)) },
      { libelle: "Téléacteurs sur la ligne", valeurs: x.ligne.creneaux.map((k) => qte(k.presents)) },
    ],
  };
}

/** Le mois des 4 téléacteurs : le tableau de bord individuel. */
function tableauDesTeleacteurs(x: PlateauDuCabinet): TableauDeDonnees {
  const t = x.tdb.teleacteurs;
  return {
    titre: "Le mois de chaque téléacteur",
    colonnes: t.map((k) => k.prenom),
    lignes: [
      { libelle: "Appels décrochés", valeurs: t.map((k) => qte(k.appelsDecroches)) },
      { libelle: "Minutes de traitement", valeurs: t.map((k) => qte(k.minutesDeTraitement)) },
      { libelle: "Appels émis", valeurs: t.map((k) => qte(k.appelsEmis)) },
      { libelle: "Contacts argumentés", valeurs: t.map((k) => qte(k.contactsArgumentes)) },
      { libelle: "Rendez-vous pris", valeurs: t.map((k) => qte(k.rendezVousPris)) },
      { libelle: "Rendez-vous honorés", valeurs: t.map((k) => qte(k.rendezVousHonores)) },
      { libelle: "Note de qualité, sur 20", valeurs: t.map((k) => qte(k.noteDeQualite)) },
    ],
  };
}

export const LE_PLATEAU_DE_TELEACTEURS: Chapitre = {
  code: "le-plateau-de-teleacteurs",
  parcours: "ndrc",
  palier: 4,
  blocs: ["BTS NDRC Bloc 2 · Relation client à distance et digitalisation", "BTS NDRC Bloc 1 · Relation client et négociation-vente"],
  titre: "Le plateau de téléacteurs : charge, effectif et performance",
  accroche:
    "Une ligne clients qui sonne dans le vide à 11 h et dort à 16 h, une prospection qui prend des rendez-vous qu'on ne tient pas. Ce que coûte un appel et un rendez-vous, combien de téléacteurs à chaque créneau, et la prime qui paie le bon résultat.",
  objectifs: [
    "Calculer la charge d'un créneau, le taux de décroché et le taux d'occupation d'une ligne",
    "Dimensionner l'effectif d'un plateau créneau par créneau, et en tirer un planning",
    "Mesurer une campagne d'appels : appels par heure, joignabilité, coût d'un rendez-vous",
    "Lire le tableau de bord individuel des téléacteurs, et fonder une prime sur le bon résultat",
    "Choisir entre un téléacteur de plus et le rappel programmé, sur le coût d'un rendez-vous",
  ],
  libre: false,
  prerequis: ["cout-d-acquisition", "tableau-de-bord-commercial"],
  entreprises: { codes: ENTREPRISES_DU_PLATEAU, pourquoi: POURQUOI_LE_CABINET },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un plateau pour la ligne et pour la prospection",
      notions: ["capacity", "productivity"],
      tableau: (c) => tableauDeLaLigne(plateauDuCabinet(c)),
      texte: (c) => {
        const x = plateauDuCabinet(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}. En N + 1, le cabinet ouvre un plateau de ${qte(x.tdb.teleacteurs.length)} téléacteurs. Ils tiennent la ligne clients (les participants et les services formation appellent pour une inscription, une convocation, un changement de date) et la prospection téléphonique, qu'${x.hugo} faisait seul en N : ${qte(x.canal.contacts)} contacts pour ${qte(x.canal.rendezVous)} rendez-vous. ${x.hugo}, libéré du téléphone, ne fait plus que les rendez-vous.`,
          `Le plateau ouvre de 9 h à 13 h et de 14 h à 18 h, en ${qte(x.ligne.creneaux.length)} créneaux de ${qte(MINUTES_D_UN_CRENEAU)} minutes. Un téléacteur tient ${qte(CRENEAUX_D_UN_TELEACTEUR)} créneaux par jour, ${qte(CRENEAUX_D_UN_TELEACTEUR * 2)} heures au téléphone : le reste de sa journée de 7 heures va aux pauses et au suivi des dossiers. Il coûte ${eur(x.cout.parMois)} par mois, poste et logiciel de gestion des appels compris.`,
          `La simulation suppose qu'un appel de la ligne demande ${qte(x.ligne.dmt)} minutes en moyenne, conversation et saisie comprises : c'est la durée moyenne de traitement (DMT). Elle suppose aussi qu'un téléacteur ne traite jamais plus de ${pct(OCCUPATION_CIBLE, 0)} de son créneau : au-delà, les appels attendent et les clients raccrochent. Un appel qui ne trouve personne est perdu. Le mois compte ${qte(JOURS_DU_MOIS)} jours ouvrés.`,
        ];
      },
      repere: () =>
        "Charge d'un créneau = appels reçus × DMT. Taux de décroché = appels décrochés ÷ appels reçus. Taux d'occupation = temps de traitement ÷ temps de présence sur la ligne. Effectif nécessaire = charge ÷ (durée du créneau × occupation cible), à l'unité supérieure.",
    },
    {
      id: "la-charge-du-creneau",
      objectifs: [0],
      type: "montants",
      titre: "La charge du créneau de 11 heures",
      notions: ["capacity"],
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `De ${x.pic.libelle}, la ligne reçoit ${qte(x.pic.recus)} appels, traités en ${qte(x.ligne.dmt)} minutes chacun, et ${qte(x.pic.presents)} téléacteurs sont en ligne. Calculez la charge du créneau en minutes, les appels qu'un téléacteur peut traiter dans le créneau à ${pct(OCCUPATION_CIBLE, 0)} d'occupation, les appels décrochés dans ce créneau, puis le taux de décroché de la journée (${qte(x.ligne.decroches)} appels décrochés sur ${qte(x.ligne.recus)}), en pourcentage.`;
      },
      champs: (c) => {
        const x = plateauDuCabinet(c);
        const l = x.ligne;
        return [
          { libelle: `Charge du créneau de ${x.pic.libelle} (minutes)`, attendu: x.pic.charge, calcul: `${qte(x.pic.recus)} × ${qte(l.dmt)} = ${qte(x.pic.charge)} minutes` },
          { libelle: "Appels qu'un téléacteur traite dans un créneau", attendu: l.parTeleacteur, calcul: `${qte(MINUTES_D_UN_CRENEAU)} × ${pct(OCCUPATION_CIBLE, 0)} ÷ ${qte(l.dmt)} = ${qte(l.minutesUtiles)} ÷ ${qte(l.dmt)} = ${qte(l.parTeleacteur)} appels` },
          { libelle: `Appels décrochés de ${x.pic.libelle}`, attendu: x.pic.decroches, calcul: `${qte(x.pic.presents)} × ${qte(l.parTeleacteur)} = ${qte(x.pic.capacite)}, pour ${qte(x.pic.recus)} appels reçus` },
          { libelle: "Taux de décroché de la journée (%)", attendu: enPct(l.tauxDeDecroche), calcul: `${qte(l.decroches)} ÷ ${qte(l.recus)} = ${pct(l.tauxDeDecroche)}`, tolerance: 0.05 },
        ];
      },
      explication: (c) => {
        const x = plateauDuCabinet(c);
        return [
          `La journée décroche ${pct(x.ligne.tauxDeDecroche)} des appels, un chiffre qui rassure. Mais les ${qte(x.ligne.perdus)} appels perdus le sont tous de ${x.pic.libelle} : à ce créneau, ${qte(x.pic.presents)} téléacteurs ne peuvent traiter que ${qte(x.pic.capacite)} appels, et ${pct(1 - x.pic.tauxDeDecroche)} des clients tombent dans le vide. Un taux de la journée cache le créneau qui décroche mal.`,
        ];
      },
    },
    {
      id: "l-occupation",
      objectifs: [0],
      type: "montants",
      titre: "Le taux d'occupation",
      notions: ["capacity", "productivity"],
      tableau: (c) => tableauDeLaLigne(plateauDuCabinet(c)),
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `Le taux d'occupation rapporte le temps passé à traiter des appels au temps de présence sur la ligne. Calculez-le, en pourcentage, de ${x.pic.libelle}, puis de ${x.creux.libelle} (${qte(x.creux.decroches)} appels décrochés), puis sur la journée (${qte(x.ligne.decroches)} appels décrochés pour ${qte(x.ligne.creneauxTenus)} créneaux tenus sur la ligne).`;
      },
      champs: (c) => {
        const x = plateauDuCabinet(c);
        const l = x.ligne;
        const ligne = (k: typeof x.pic) => ({
          libelle: `Taux d'occupation de ${k.libelle} (%)`,
          attendu: enPct(k.occupation),
          calcul: `${qte(k.decroches)} × ${qte(l.dmt)} ÷ (${qte(k.presents)} × ${qte(MINUTES_D_UN_CRENEAU)}) = ${qte(k.decroches * l.dmt)} ÷ ${qte(k.presents * MINUTES_D_UN_CRENEAU)} = ${pct(k.occupation)}`,
          tolerance: 0.05,
        });
        return [
          ligne(x.pic),
          ligne(x.creux),
          {
            libelle: "Taux d'occupation de la journée (%)",
            attendu: enPct(l.occupation),
            calcul: `${qte(l.decroches)} × ${qte(l.dmt)} ÷ (${qte(l.creneauxTenus)} × ${qte(MINUTES_D_UN_CRENEAU)}) = ${qte(l.decroches * l.dmt)} ÷ ${qte(l.creneauxTenus * MINUTES_D_UN_CRENEAU)} = ${pct(l.occupation)}`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const x = plateauDuCabinet(c);
        return [
          `De ${x.pic.libelle}, les téléacteurs sont à ${pct(x.pic.occupation)}, la limite, et perdent des appels ; de ${x.creux.libelle}, ils attendent le téléphone ${pct(1 - x.creux.occupation)} du temps. Sur la journée, ${pct(x.ligne.occupation)} : la moyenne d'un créneau saturé et d'un créneau qui dort.`,
          "Le même effectif à chaque créneau, face à des appels qui ne viennent pas à la même heure : voilà le défaut. La question n'est pas d'abord combien de téléacteurs, mais à quelle heure.",
        ];
      },
    },
    {
      id: "predire-le-planning",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le planning",
      notions: ["capacity"],
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `Avant de calculer, pariez. Le plateau met ${qte(x.ligne.creneauxTenus)} créneaux de téléacteur sur la ligne chaque jour, et en perd ${qte(x.ligne.perdus)} appels. Avec ces mêmes ${qte(x.ligne.creneauxTenus)} créneaux, sans dépasser ${pct(OCCUPATION_CIBLE, 0)} d'occupation, peut-on décrocher tous les appels ?`;
      },
      options: () => {
        const voir = "Le laboratoire suivant vous laisse placer les téléacteurs créneau par créneau : essayez.";
        return [
          { texte: "Oui, en changeant d'heure un téléacteur", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Non, il faut un téléacteur de plus sur la ligne", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non, il faut une DMT plus courte", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-planning",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire du planning",
      notions: ["capacity", "productivity"],
      question: () =>
        "Placez les téléacteurs de la ligne, créneau par créneau. Le tableau suit les appels décrochés, le taux de décroché de la journée, l'occupation la plus haute et la plus basse, et les créneaux qui restent à la prospection. Relevez le défi.",
      leviers: (c) => {
        const x = plateauDuCabinet(c);
        return x.ligne.creneaux.map((k, i) => ({ code: `c${i}`, libelle: `Téléacteurs de ${k.libelle}`, unite: "téléacteurs", ...LEVIERS_DU_PLANNING, depart: k.presents }));
      },
      lecture: (c, p) => {
        const x = plateauDuCabinet(c);
        const l = laboratoireDuPlanning(p);
        const d = laboratoireDuPlanning(Object.fromEntries(x.ligne.creneaux.map((k, i) => [`c${i}`, k.presents])));
        return [
          ...l.l.creneaux.map((k, i) => ({ libelle: `Appels décrochés de ${k.libelle}, sur ${qte(k.recus)}`, montant: k.decroches, reference: d.l.creneaux[i]!.decroches, unite: "appels" })),
          { libelle: "Taux de décroché de la journée", montant: l.tauxDeDecroche, reference: d.tauxDeDecroche, unite: "%", fort: true },
          { libelle: "Occupation du créneau le plus chargé", montant: l.occupationMaximale, reference: d.occupationMaximale, unite: "%" },
          { libelle: "Occupation du créneau le plus calme", montant: l.occupationMinimale, reference: d.occupationMinimale, unite: "%" },
          { libelle: "Créneaux de ligne par jour", montant: l.creneauxDeLigne, reference: d.creneauxDeLigne, unite: "créneaux" },
          { libelle: "Créneaux laissés à la prospection", montant: l.creneauxDeProspection, reference: d.creneauxDeProspection, unite: "créneaux" },
        ];
      },
      defi: (c) => {
        const x = plateauDuCabinet(c);
        const n = x.ligne.creneauxTenus;
        return {
          consigne: `Décrochez tous les appels de la journée avec ${qte(n)} créneaux de ligne au plus, pour garder ${qte(CRENEAUX_D_UN_TELEACTEUR * TELEACTEURS.length - n)} créneaux à la prospection.`,
          atteint: (p) => {
            const l = laboratoireDuPlanning(p);
            return l.l.perdus === 0 && l.creneauxDeLigne <= n;
          },
          indice: (p) => {
            const l = laboratoireDuPlanning(p);
            if (l.creneauxDeLigne > n) return `Vous tenez ${qte(l.creneauxDeLigne)} créneaux de ligne : c'est autant de moins pour la prospection. Retirez un téléacteur là où il attend le téléphone.`;
            const k = l.l.creneaux.find((y) => y.perdus > 0)!;
            return `De ${k.libelle}, ${qte(k.perdus)} appels sont perdus : chaque téléacteur n'en traite que ${qte(x.ligne.parTeleacteur)}. Où un téléacteur est-il de trop ?`;
          },
          solution: Object.fromEntries(x.effectif.map((n2, i) => [`c${i}`, n2])),
        };
      },
      explication: (c) => {
        const x = plateauDuCabinet(c);
        const r = x.replanifiee;
        return [
          `Avec ${x.effectif.map(qte).join(", ")} téléacteurs aux ${qte(r.creneaux.length)} créneaux, la ligne décroche tous ses appels sur les mêmes ${qte(r.creneauxTenus)} créneaux : l'occupation de la journée monte à ${pct(r.occupation)}, sans dépasser ${pct(OCCUPATION_CIBLE, 0)} à aucun créneau. Rien n'a été embauché : le téléacteur du creux est passé au pic.`,
          "Un planning se construit sur la courbe des appels, créneau par créneau, pas sur leur moyenne. L'étape suivante le refait par le calcul.",
        ];
      },
    },
    {
      id: "l-effectif-necessaire",
      objectifs: [1],
      type: "montants",
      titre: "L'effectif nécessaire, créneau par créneau",
      notions: ["capacity"],
      tableau: (c) => tableauDeLaLigne(plateauDuCabinet(c)),
      question: () =>
        "Sans formule cette fois. Calculez l'effectif exact qu'il faut de 11 h à 13 h (au centième), puis l'effectif nécessaire à chaque créneau, en téléacteurs entiers, et les créneaux de ligne qu'il faut chaque jour.",
      champs: (c) => {
        const x = plateauDuCabinet(c);
        const l = x.ligne;
        const u = l.minutesUtiles;
        return [
          { libelle: `Effectif exact de ${x.pic.libelle}`, attendu: auCentime(x.pic.effectifExact), calcul: `${qte(x.pic.charge)} ÷ (${qte(MINUTES_D_UN_CRENEAU)} × ${pct(OCCUPATION_CIBLE, 0)}) = ${qte(x.pic.charge)} ÷ ${qte(u)} = ${qte(auCentime(x.pic.effectifExact))}`, tolerance: 0.01 },
          ...l.creneaux.map((k) => ({
            libelle: `Effectif nécessaire de ${k.libelle}`,
            attendu: k.effectifNecessaire,
            calcul: `${qte(k.recus)} × ${qte(l.dmt)} ÷ ${qte(u)} = ${qte(auCentime(k.effectifExact))}, soit ${qte(k.effectifNecessaire)}`,
          })),
          { libelle: "Créneaux de ligne par jour", attendu: l.creneauxNecessaires, calcul: `${x.effectif.map(qte).join(" + ")} = ${qte(l.creneauxNecessaires)}` },
        ];
      },
      explication: (c) => {
        const x = plateauDuCabinet(c);
        return [
          `De ${x.pic.libelle}, ${qte(auCentime(x.pic.effectifExact))} téléacteurs suffiraient en théorie ; il en faut ${qte(x.pic.effectifNecessaire)}, car on ne met pas trois quarts de téléacteur au téléphone. L'arrondi se fait toujours vers le haut : en dessous, des appels sont perdus.`,
          `Les ${qte(x.ligne.creneauxNecessaires)} créneaux de ligne laissent ${qte(CRENEAUX_D_UN_TELEACTEUR * x.tdb.teleacteurs.length - x.ligne.creneauxNecessaires)} créneaux par jour à la prospection : ${qte(x.prospection.heures)} heures dans le mois. La ligne coûte alors ${eur(x.coutDUnAppelDecroche)} par appel décroché (${eur(x.coutLigneParMois)} pour ${qte(x.replanifiee.decroches * JOURS_DU_MOIS)} appels).`,
        ];
      },
    },
    {
      id: "la-prospection",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûte un rendez-vous",
      notions: ["conversion_rate", "productivity", "customer_acquisition_cost"],
      tableau: (c) => tableauDesTeleacteurs(plateauDuCabinet(c)),
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `Dans le mois, les ${qte(x.tdb.teleacteurs.length)} téléacteurs ont prospecté ${qte(x.prospection.heures)} heures en tout. Calculez les appels émis par heure, la joignabilité (contacts argumentés ÷ appels émis, en pourcentage), le coût d'une heure de téléacteur (${eur(x.cout.parMois)} pour ${qte(x.cout.heures)} heures au téléphone), puis le coût d'un rendez-vous pris et celui d'un rendez-vous honoré.`;
      },
      champs: (c) => {
        const x = plateauDuCabinet(c);
        const t = x.tdb;
        const p = x.prospection;
        return [
          { libelle: "Appels émis par heure", attendu: p.appelsParHeure, calcul: `${qte(t.appelsEmis)} ÷ ${qte(p.heures)} = ${qte(p.appelsParHeure)}` },
          { libelle: "Joignabilité (%)", attendu: enPct(p.joignabilite), calcul: `${qte(t.contactsArgumentes)} ÷ ${qte(t.appelsEmis)} = ${pct(p.joignabilite)}`, tolerance: 0.05 },
          { libelle: "Coût d'une heure de téléacteur", attendu: x.cout.coutHoraire, calcul: `${eur(x.cout.parMois)} ÷ ${qte(x.cout.heures)} = ${eur(x.cout.coutHoraire)}` },
          { libelle: "Coût d'un rendez-vous pris", attendu: p.coutParRendezVous!, calcul: `${qte(p.heures)} × ${eur(x.cout.coutHoraire)} ÷ ${qte(t.rendezVousPris)} = ${eur(p.cout)} ÷ ${qte(t.rendezVousPris)} = ${eur(p.coutParRendezVous!)}` },
          { libelle: "Coût d'un rendez-vous honoré", attendu: x.coutDUnRendezVousHonore, calcul: `${eur(p.cout)} ÷ ${qte(t.rendezVousHonores)} = ${eur(x.coutDUnRendezVousHonore)}` },
        ];
      },
      explication: (c) => {
        const x = plateauDuCabinet(c);
        const p = x.prospection;
        return [
          `L'entonnoir du téléphone : ${qte(p.appels)} appels émis, ${qte(p.contacts)} contacts argumentés (${pct(p.joignabilite)}), ${qte(x.tdb.rendezVousPris)} rendez-vous pris (${pct(tauxDeRendezVousDeN())} des contacts, le taux de la prospection de N), dont ${qte(x.tdb.rendezVousHonores)} honorés. La plupart des appels n'atteignent pas le décideur : la joignabilité pèse plus que le talent au téléphone.`,
          `Un rendez-vous pris coûte ${eur(p.coutParRendezVous!)}, un rendez-vous honoré ${eur(x.coutDUnRendezVousHonore)} : seul le second mène à un contrat. Un rendez-vous qui ne tient pas a coûté le même temps de téléphone, et une demi-journée ${dE(x.hugo)}.`,
        ];
      },
    },
    {
      id: "predire-les-appels",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur les appels par heure",
      notions: ["productivity", "conversion_rate"],
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `Avant de calculer, pariez. La direction veut un rendez-vous à ${eur(COUT_VISE_D_UN_RENDEZ_VOUS)} au plus, au lieu de ${eur(x.prospection.coutParRendezVous!)}, sans changer les heures ni la joignabilité. Combien d'appels par heure faut-il émettre, au lieu de ${qte(x.prospection.appelsParHeure)} ?`;
      },
      options: (c) => {
        const x = plateauDuCabinet(c);
        const voir = "Le curseur de l'étape suivante fait varier les appels par heure : il montre où le rendez-vous passe sous le coût visé.";
        return [
          { texte: `${qte(x.appelsPourLeCoutVise)} appels par heure`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${qte(x.appelsPourLeCoutVise + 2)} appels par heure`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `${qte(x.prospection.appelsParHeure)} appels par heure, il suffit de mieux conclure`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-appels-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Les appels qui font le coût visé",
      notions: ["productivity", "customer_acquisition_cost"],
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `La prospection coûte ${eur(x.prospection.cout)} par mois, quoi qu'elle obtienne. Faites varier les appels émis par heure, de ${qte(APPELS_DU_CURSEUR.min)} à ${qte(APPELS_DU_CURSEUR.max)}, la joignabilité et le taux de rendez-vous restant ceux du mois. Une droite donne ce que ses rendez-vous justifient de dépenser, à ${eur(COUT_VISE_D_UN_RENDEZ_VOUS)} l'un ; l'autre, ce qu'elle coûte. Placez le curseur sur le plus petit nombre d'appels par heure où le rendez-vous coûte au plus ${eur(COUT_VISE_D_UN_RENDEZ_VOUS)}, puis validez.`;
      },
      grandeur: () => ({ libelle: "Appels émis par heure", unite: "appels" }),
      cible: (c) => ({ attendu: plateauDuCabinet(c).appelsPourLeCoutVise, min: APPELS_DU_CURSEUR.min, max: APPELS_DU_CURSEUR.max }),
      zones: ["Au coût visé ou dessous", "Au-dessus du coût visé"],
      rates: () => ({
        dessous: "À ce rythme, un rendez-vous coûte encore plus que le coût visé.",
        dessus: "Moins d'appels par heure suffiraient : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les appels",
      lecture: (c, q) => {
        const x = plateauDuCabinet(c);
        const rdv = q * x.rendezVousParAppelParHeure;
        const justifie = rdv * COUT_VISE_D_UN_RENDEZ_VOUS;
        return [
          { libelle: "Budget que justifient ses rendez-vous", montant: auCentime(justifie) },
          { libelle: "Coût de la prospection du mois", montant: x.prospection.cout },
          { libelle: "Coût d'un rendez-vous pris", montant: auCentime(x.prospection.cout / rdv) },
          { libelle: "Budget justifié moins coût de la prospection", montant: auCentime(justifie - x.prospection.cout), fort: true },
        ];
      },
      droites: (c) => {
        const x = plateauDuCabinet(c);
        return {
          produit: (q) => q * x.rendezVousParAppelParHeure * COUT_VISE_D_UN_RENDEZ_VOUS,
          cout: () => x.prospection.cout,
          libelles: [`Ce que justifient ses rendez-vous, à ${eur(COUT_VISE_D_UN_RENDEZ_VOUS)} l'un`, "Coût de la prospection"],
        };
      },
      explication: (c) => {
        const x = plateauDuCabinet(c);
        const q = x.appelsPourLeCoutVise;
        const rdv = auCentime(q * x.rendezVousParAppelParHeure);
        return [
          `Il faut ${qte(q)} appels par heure : ${qte(rdv)} rendez-vous attendus dans le mois, à ${eur(auCentime(x.prospection.cout / rdv))} l'un. Le coût de la prospection ne bouge pas : chaque appel de plus le divise sur plus de rendez-vous.`,
          `Mais ${qte(q)} appels par heure, c'est moins de temps pour chercher le bon interlocuteur et préparer l'appel suivant. Le rythme est un levier, pas le seul : la joignabilité en est un autre, que le laboratoire du plateau fera jouer.`,
        ];
      },
    },
    {
      id: "face-a-n",
      objectifs: [2],
      type: "choix",
      titre: "Le plateau face à la prospection de N",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `En N, la prospection ${dE(x.hugo)} a coûté ${eur(x.canal.cout)} pour ${qte(x.canal.rendezVous)} rendez-vous : ${eur(x.coutDUnRendezVousDeN)} l'un. Le plateau en obtient ${qte(x.tdb.rendezVousHonores)} honorés par mois, à ${eur(x.coutDUnRendezVousHonore)}. Que conclure ?`;
      },
      options: (c) => {
        const x = plateauDuCabinet(c);
        return [
          {
            texte: "Le téléphone revient moins cher aux téléacteurs",
            juste: true,
            retour: `Oui : une heure de téléacteur coûte ${eur(x.cout.coutHoraire)}, et le temps ${dE(x.hugo)}, payé pour vendre, va aux rendez-vous. En N, son coût entier tombait sur ${qte(x.canal.rendezVous)} rendez-vous ; le plateau en obtient ${qte(x.tdb.rendezVousHonores * 12)} honorés par an. Reste à vérifier qu'${x.hugo} peut les tenir.`,
          },
          {
            texte: "Rien : les deux chiffres ne se comparent pas",
            juste: false,
            retour: `Non : ils se comparent, à condition de compter la même chose. Le coût de N comptait le commercial à plein temps ; celui du plateau, les seules heures de téléphone. Même en ajoutant les visites ${dE(x.hugo)}, le plateau reste bien moins cher par rendez-vous.`,
          },
          {
            texte: "Il faut tout donner au plateau, même les rendez-vous",
            juste: false,
            retour: "Non : un téléacteur prend le rendez-vous, il ne mène pas l'entretien de vente d'une mission de conseil. Le plateau remplit l'agenda du commercial, il ne le remplace pas.",
          },
        ];
      },
    },
    {
      id: "le-tableau-des-teleacteurs",
      objectifs: [3],
      type: "montants",
      titre: "Le tableau de bord des téléacteurs",
      notions: ["dashboard", "productivity"],
      tableau: (c) => tableauDesTeleacteurs(plateauDuCabinet(c)),
      question: (c) => {
        const x = plateauDuCabinet(c);
        const [lea, , , bruno] = x.tdb.teleacteurs;
        return `Chaque téléacteur a tenu ${qte(x.tdb.heuresDeLigne)} heures de ligne et ${qte(x.tdb.heuresDeProspection)} heures de prospection dans le mois. Calculez la DMT ${dE(lea!.prenom)}, le taux d'occupation ${dE(bruno!.prenom)} sur la ligne (en pourcentage), puis le taux d'honoration ${dE(lea!.prenom)} (rendez-vous honorés ÷ rendez-vous pris) et celui du plateau, en pourcentage.`;
      },
      champs: (c) => {
        const x = plateauDuCabinet(c);
        const t = x.tdb;
        const [lea, , , bruno] = t.teleacteurs;
        return [
          { libelle: `DMT ${dE(lea!.prenom)} (minutes)`, attendu: auCentime(lea!.dmt), calcul: `${qte(lea!.minutesDeTraitement)} ÷ ${qte(lea!.appelsDecroches)} = ${qte(auCentime(lea!.dmt))} minutes` },
          { libelle: `Taux d'occupation ${dE(bruno!.prenom)} (%)`, attendu: enPct(bruno!.occupation), calcul: `${qte(bruno!.minutesDeTraitement)} ÷ (${qte(t.heuresDeLigne)} × 60) = ${pct(bruno!.occupation)}`, tolerance: 0.05 },
          { libelle: `Taux d'honoration ${dE(lea!.prenom)} (%)`, attendu: enPct(lea!.tauxDHonoration), calcul: `${qte(lea!.rendezVousHonores)} ÷ ${qte(lea!.rendezVousPris)} = ${pct(lea!.tauxDHonoration)}`, tolerance: 0.05 },
          { libelle: "Taux d'honoration du plateau (%)", attendu: enPct(t.tauxDHonoration), calcul: `${qte(t.rendezVousHonores)} ÷ ${qte(t.rendezVousPris)} = ${pct(t.tauxDHonoration)}`, tolerance: 0.05 },
        ];
      },
      explication: (c) => {
        const x = plateauDuCabinet(c);
        const [lea, samir, ines] = x.tdb.teleacteurs;
        return [
          `${lea!.prenom} traite le plus vite (${qte(lea!.dmt)} minutes) et prend le plus de rendez-vous (${qte(lea!.rendezVousPris)}), mais la moitié ne tient pas, et sa note de qualité est la plus basse (${qte(lea!.noteDeQualite)} sur 20). ${ines!.prenom} prend son temps (${qte(ines!.dmt)} minutes), et tous ses rendez-vous tiennent, comme ceux de ${samir!.prenom}.`,
          "Un tableau de bord de plateau croise trois familles d'indicateurs : la productivité (appels, DMT, occupation), la qualité (la double écoute, l'honoration) et le résultat (les rendez-vous). Lu sur une seule, il récompense la vitesse.",
        ];
      },
    },
    {
      id: "la-prime",
      objectifs: [3],
      type: "choix",
      titre: "La prime qui paie le bon résultat",
      notions: ["pay_and_motivation", "dashboard"],
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `Le superviseur propose une prime de ${eur(PRIME_DU_MOIS.montant)} par mois, cotisations comprises, au téléacteur qui prend ${qte(PRIME_DU_MOIS.rendezVous)} rendez-vous. ${x.hugo} propose de la verser sur ${qte(PRIME_DU_MOIS.rendezVous)} rendez-vous honorés, avec ${qte(PRIME_DU_MOIS.noteMinimale)} sur 20 de note de qualité au moins. Quelle règle retenez-vous ?`;
      },
      options: (c) => {
        const x = plateauDuCabinet(c);
        const t = x.tdb;
        const surPris = t.teleacteurs.filter((k) => k.primeSurLesPris).map((k) => k.prenom);
        const surHonores = t.teleacteurs.filter((k) => k.primeSurLesHonores).map((k) => k.prenom);
        const lea = t.teleacteurs[0]!;
        return [
          {
            texte: "Les honorés, avec la note de qualité",
            juste: true,
            retour: `Oui : ${qte(t.primesSurLesHonores)} primes ce mois-ci (${surHonores.join(" et ")}), ${eur(t.coutDesPrimesSurLesHonores)}. Un rendez-vous honoré vaut ${eur(x.valeurDUnRendezVousHonore)} de marge la première année (${pct(x.contratsParRendezVous, 0)} des rendez-vous tenus deviennent un compte à ${eur(x.m.marge)}) ; un rendez-vous pris qui ne tient pas ne vaut rien. La prime paie le résultat qui compte, et la note garde la qualité de l'accueil.`,
          },
          {
            texte: "Les rendez-vous pris : c'est simple à compter",
            juste: false,
            retour: `Non : ${qte(t.primesSurLesPris)} primes (${surPris.join(", ")}), ${eur(t.coutDesPrimesSurLesPris)}, dont une à ${lea.prenom}, dont la moitié des rendez-vous ne tient pas. Primer les rendez-vous pris pousse à forcer la conclusion : on paie ce qu'on mesure, pas ce qu'on veut.`,
          },
          {
            texte: "Aucune prime : le salaire paie déjà le travail",
            juste: false,
            retour: `Non : une prime bien construite oriente l'effort vers ce que le cabinet veut. À ${eur(PRIME_DU_MOIS.montant)} pour au moins ${qte(PRIME_DU_MOIS.rendezVous)} rendez-vous honorés, qui valent chacun ${eur(x.valeurDUnRendezVousHonore)} de marge, elle se paie largement.`,
          },
        ];
      },
    },
    {
      id: "le-laboratoire-du-plateau",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du plateau",
      notions: ["capacity", "productivity", "customer_acquisition_cost"],
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `La ligne garde ses ${qte(x.ligne.creneauxNecessaires)} créneaux par jour ; le reste du plateau prospecte. Faites varier les téléacteurs du plateau et les appels émis par heure, et choisissez de prendre ou non le rappel programmé (${eur(RAPPEL_PROGRAMME.coutMensuel)} par mois : les contacts argumentés passent à ${pct(RAPPEL_PROGRAMME.joignabilite, 0)} des appels). Le tableau suit les rendez-vous du mois et leur coût. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = plateauDuCabinet(c);
        const L = LEVIERS_DU_PLATEAU;
        return [
          { code: "teleacteurs", libelle: "Téléacteurs du plateau", unite: "téléacteurs", ...L.teleacteurs, depart: x.tdb.teleacteurs.length },
          { code: "appelsParHeure", libelle: "Appels émis par heure", unite: "appels", ...L.appelsParHeure, depart: x.prospection.appelsParHeure },
          {
            code: "rappel",
            libelle: "Rappel programmé",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: 0,
            choix: [
              { valeur: 0, libelle: "sans" },
              { valeur: 1, libelle: `avec, ${eur(RAPPEL_PROGRAMME.coutMensuel)} par mois` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = plateauDuCabinet(c);
        const l = laboratoireDuPlateau(p);
        const d = x.prospection;
        return [
          { libelle: "Heures de prospection du mois", montant: l.heures, reference: d.heures, unite: "heures" },
          { libelle: "Contacts argumentés", montant: auCentime(l.contacts), reference: d.contacts, unite: "contacts" },
          { libelle: "Rendez-vous pris", montant: auCentime(l.rendezVous), reference: d.rendezVous, unite: "rendez-vous", fort: true },
          { libelle: `Rendez-vous au-delà des ${qte(RENDEZ_VOUS_QU_HUGO_PEUT_TENIR)} que tient ${x.hugo}`, montant: auCentime(l.auDelaDeHugo), reference: d.auDelaDeHugo, unite: "rendez-vous" },
          { libelle: "Coût de la prospection du mois", montant: l.cout, reference: d.cout },
          { libelle: "Coût d'un rendez-vous pris", montant: l.coutParRendezVous ?? 0, reference: d.coutParRendezVous!, fort: true },
        ];
      },
      graphique: () => ({
        levier: "appelsParHeure",
        courbes: [
          { libelle: "Coût d'un rendez-vous pris", valeur: (p) => laboratoireDuPlateau(p).coutParRendezVous ?? 0 },
          { libelle: "Coût visé", valeur: () => COUT_VISE_D_UN_RENDEZ_VOUS },
        ],
      }),
      defi: (c) => {
        const x = plateauDuCabinet(c);
        return {
          consigne: `Obtenez au moins ${qte(RENDEZ_VOUS_VISES)} rendez-vous par mois, sans dépasser les ${qte(RENDEZ_VOUS_QU_HUGO_PEUT_TENIR)} qu'${x.hugo} peut tenir, à ${eur(COUT_VISE_D_UN_RENDEZ_VOUS)} au plus le rendez-vous.`,
          atteint: defiDuPlateau,
          indice: (p) => {
            const l = laboratoireDuPlateau(p);
            if (l.rendezVous > RENDEZ_VOUS_QU_HUGO_PEUT_TENIR + 1e-9) return `${qte(auCentime(l.rendezVous))} rendez-vous : ${x.hugo} ne peut en tenir que ${qte(RENDEZ_VOUS_QU_HUGO_PEUT_TENIR)}. Des rendez-vous qui attendent des semaines refroidissent les prospects.`;
            if (l.rendezVous < RENDEZ_VOUS_VISES - 1e-9) return `${qte(auCentime(l.rendezVous))} rendez-vous : il en faut ${qte(RENDEZ_VOUS_VISES)}. Plus d'heures, plus d'appels par heure, ou plus de décideurs joints ?`;
            return `${qte(auCentime(l.rendezVous))} rendez-vous, mais à ${eur(l.coutParRendezVous ?? 0)} l'un : c'est plus que ${eur(COUT_VISE_D_UN_RENDEZ_VOUS)}. Un téléacteur de plus coûte autant par rendez-vous que les autres.`;
          },
          solution: { teleacteurs: x.tdb.teleacteurs.length, appelsParHeure: x.prospection.appelsParHeure, rappel: 1 },
        };
      },
      explication: (c) => {
        const x = plateauDuCabinet(c);
        const r = x.avecLeRappel;
        const u = x.unDePlus;
        return [
          `Avec le rappel programmé, les ${qte(x.tdb.teleacteurs.length)} téléacteurs obtiennent ${qte(r.rendezVous)} rendez-vous à ${eur(r.coutParRendezVous!)} l'un : le même temps de téléphone joint plus de décideurs, pour ${eur(RAPPEL_PROGRAMME.coutMensuel)} par mois.`,
          `Un téléacteur de plus donnerait ${qte(u.rendezVous)} rendez-vous, mais à ${eur(u.coutParRendezVous!)} chacun, le coût de ceux d'aujourd'hui, et ${qte(u.auDelaDeHugo)} de plus qu'${x.hugo} ne peut en tenir. Le graphique le montre : le coût d'un rendez-vous ne dépend que du rythme et de la joignabilité, pas du nombre de téléacteurs.`,
        ];
      },
    },
    {
      id: "un-teleacteur-de-plus",
      objectifs: [4],
      type: "choix",
      titre: "Un téléacteur de plus, ou le rappel programmé",
      notions: ["capacity", "customer_acquisition_cost"],
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `Le plateau prend ${qte(x.prospection.rendezVous)} rendez-vous par mois ; l'objectif est d'en prendre ${qte(RENDEZ_VOUS_VISES)}. Le superviseur demande un téléacteur de plus (${eur(x.cout.parMois)} par mois). Que proposez-vous au directeur ?`;
      },
      options: (c) => {
        const x = plateauDuCabinet(c);
        const r = x.avecLeRappel;
        const u = x.unDePlus;
        return [
          {
            texte: `Le rappel programmé : ${qte(r.rendezVous)} rendez-vous à ${eur(r.coutParRendezVous!)}`,
            juste: true,
            retour: `Oui : pour ${eur(RAPPEL_PROGRAMME.coutMensuel)} par mois, l'objectif est tenu, et le rendez-vous coûte moins qu'aujourd'hui (${eur(x.prospection.coutParRendezVous!)}). Les ${qte(r.rendezVous)} rendez-vous tiennent dans l'agenda ${dE(x.hugo)}.`,
          },
          {
            texte: `Le téléacteur de plus : ${qte(u.rendezVous)} rendez-vous valent mieux que ${qte(r.rendezVous)}`,
            juste: false,
            retour: `Non : ${x.hugo} ne peut en tenir que ${qte(RENDEZ_VOUS_QU_HUGO_PEUT_TENIR)} ; les ${qte(u.auDelaDeHugo)} autres attendraient des semaines. Et chacun coûte ${eur(u.coutParRendezVous!)} : le téléacteur de plus ne baisse pas le coût d'un rendez-vous.`,
          },
          {
            texte: "Les deux : on n'a jamais trop de rendez-vous",
            juste: false,
            retour: `Non : ${qte(prospectionDuMois({ teleacteurs: 5, rappelProgramme: true }).rendezVous)} rendez-vous par mois pour un commercial qui en tient ${qte(RENDEZ_VOUS_QU_HUGO_PEUT_TENIR)}. Un rendez-vous pris qu'on ne tient pas a coûté du téléphone et déçu un prospect.`,
          },
        ];
      },
    },
    {
      id: "l-espace-en-ligne",
      objectifs: [1],
      type: "montants",
      titre: "Variante : l'espace participant en ligne",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const x = plateauDuCabinet(c);
        return `Variante : un espace participant en ligne prend les convocations et les supports, et les appels qui restent ne durent plus que ${qte(DMT_AVEC_L_ESPACE_EN_LIGNE)} minutes au lieu de ${qte(x.ligne.dmt)}. Les appels reçus ne changent pas. Calculez l'effectif nécessaire de ${x.pic.libelle}, les créneaux de ligne qu'il faut chaque jour, puis les rendez-vous de plus que la prospection prendrait dans le mois avec les créneaux libérés.`;
      },
      champs: (c) => {
        const x = plateauDuCabinet(c);
        const e = x.espace;
        const k = e.creneaux[CRENEAU_DU_PIC]!;
        const heures = x.creneauxLiberes * heuresDuMoisDUnCreneau();
        return [
          { libelle: `Effectif nécessaire de ${k.libelle}, à ${qte(DMT_AVEC_L_ESPACE_EN_LIGNE)} minutes`, attendu: k.effectifNecessaire, calcul: `${qte(k.recus)} × ${qte(DMT_AVEC_L_ESPACE_EN_LIGNE)} ÷ ${qte(e.minutesUtiles)} = ${qte(auCentime(k.effectifExact))}, soit ${qte(k.effectifNecessaire)}` },
          { libelle: "Créneaux de ligne par jour, à 4 minutes", attendu: e.creneauxNecessaires, calcul: `${e.effectifNecessaire.map(qte).join(" + ")} = ${qte(e.creneauxNecessaires)}` },
          {
            libelle: "Rendez-vous de plus dans le mois",
            attendu: x.rendezVousEnPlusAvecLEspace,
            calcul: `${qte(x.creneauxLiberes)} créneau × ${qte(heuresDuMoisDUnCreneau())} heures = ${qte(heures)} heures ; ${qte(heures)} × ${qte(x.prospection.appelsParHeure)} × ${pct(x.prospection.joignabilite)} × ${pct(tauxDeRendezVousDeN())} = ${qte(x.rendezVousEnPlusAvecLEspace)}`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const x = plateauDuCabinet(c);
        const e = x.espace;
        return [
          `À ${qte(DMT_AVEC_L_ESPACE_EN_LIGNE)} minutes, la ligne n'a plus besoin que de ${qte(e.creneauxNecessaires)} créneaux par jour : ${e.effectifNecessaire.map(qte).join(", ")}. Le gain ne se voit qu'au pic, où ${qte(x.pic.effectifNecessaire)} téléacteurs deviennent ${qte(e.creneaux[CRENEAU_DU_PIC]!.effectifNecessaire)} ; ailleurs, l'arrondi à l'unité supérieure le mange.`,
          `Le créneau libéré prospecte : ${qte(x.rendezVousEnPlusAvecLEspace)} rendez-vous de plus par mois, ${qte(x.prospectionAvecLEspace.rendezVous)} en tout. Réduire la DMT d'une ligne, c'est dégager du temps pour un autre métier du plateau.`,
        ];
      },
    },
    {
      id: "la-cible-d-occupation",
      objectifs: [1],
      type: "choix",
      titre: "Pousser l'occupation ?",
      notions: ["capacity", "staff_turnover"],
      question: () => {
        return `Pour gagner des créneaux de prospection, le directeur propose de dimensionner la ligne à 95 % d'occupation au lieu de ${pct(OCCUPATION_CIBLE, 0)}, et de supprimer la pause : « ${qte(CRENEAUX_D_UN_TELEACTEUR * 2)} heures de téléphone, c'est peu ». Que lui répondez-vous ?`;
      },
      options: () => [
        {
          texte: "Non : l'attente monte, et la pause est due",
          juste: true,
          retour:
            "Oui : à 95 %, le moindre groupe d'appels fait attendre, les clients raccrochent, et le taux de décroché baisse ; les téléacteurs s'usent (le stress de la relation à distance, l'absentéisme, les départs). Et le code du travail impose une pause de 20 minutes au moins dès 6 heures de travail : elle n'est pas négociable.",
        },
        {
          texte: "Oui : 95 % d'un créneau, c'est encore 6 minutes de répit",
          juste: false,
          retour: "Non : les appels n'arrivent pas en file régulière. À 95 %, il suffit de trois appels en même temps pour qu'un client attende, et raccroche. La cible d'occupation garde une marge pour les pics à l'intérieur du créneau.",
        },
        {
          texte: "Oui, si la prime compense l'effort",
          juste: false,
          retour: "Non : une prime ne supprime ni l'attente des clients, ni la fatigue, ni la pause que le code du travail impose dès 6 heures de travail. Elle paie un résultat, pas une organisation qui use l'équipe.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "productivity", "dashboard"],
      tableau: (c) => {
        const x = plateauDuCabinet(c);
        const r = x.replanifiee;
        return {
          titre: "La ligne, avant et après le nouveau planning",
          colonnes: r.creneaux.map((k) => k.libelle),
          lignes: [
            { libelle: "Appels reçus", valeurs: r.creneaux.map((k) => qte(k.recus)) },
            { libelle: "Téléacteurs avant", valeurs: x.ligne.creneaux.map((k) => qte(k.presents)) },
            { libelle: "Décrochés avant", valeurs: x.ligne.creneaux.map((k) => qte(k.decroches)) },
            { libelle: "Téléacteurs après", valeurs: r.creneaux.map((k) => qte(k.presents)) },
            { libelle: "Décrochés après", valeurs: r.creneaux.map((k) => qte(k.decroches)) },
          ],
        };
      },
      texte: (c) => {
        const x = plateauDuCabinet(c);
        return [
          `Une ligne se dimensionne créneau par créneau : la charge (appels × DMT) divisée par le temps utile d'un téléacteur (${qte(MINUTES_D_UN_CRENEAU)} minutes à ${pct(OCCUPATION_CIBLE, 0)}), arrondie vers le haut. Chez ${x.f.entreprise}, le même effectif à chaque heure perdait ${qte(x.ligne.perdus)} appels par jour au pic et laissait le creux à ${pct(x.creux.occupation)} ; le planning ${x.effectif.map(qte).join(", ")} décroche tout, sur les mêmes ${qte(x.ligne.creneauxNecessaires)} créneaux.`,
          `La prospection se lit comme un entonnoir : appels par heure, joignabilité, taux de rendez-vous, puis honoration. Un rendez-vous pris y coûte ${eur(x.prospection.coutParRendezVous!)}, un honoré ${eur(x.coutDUnRendezVousHonore)}. Le rappel programmé fait monter la joignabilité et baisse le coût d'un rendez-vous à ${eur(x.avecLeRappel.coutParRendezVous!)} ; un téléacteur de plus ajoute des rendez-vous au même coût, et plus qu'${x.hugo} n'en peut tenir. La prime se fonde sur le résultat qui compte, le rendez-vous honoré, et sur la qualité.`,
          "Au niveau de l'examen, vous savez calculer la charge, le taux de décroché et le taux d'occupation d'une ligne, et dimensionner un effectif créneau par créneau. Vous savez aussi mesurer le coût d'un rendez-vous, lire le tableau de bord des téléacteurs, choisir une prime, et trancher entre un poste de plus et un outil.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Effectif nécessaire = appels × DMT ÷ (durée du créneau × occupation cible), à l'unité supérieure. Coût d'un rendez-vous = heures × coût horaire ÷ rendez-vous. Rendez-vous = heures × appels par heure × joignabilité × taux de rendez-vous.",
    },
  ],
};

/** Les créneaux de prospection de chaque téléacteur, par jour : pour les textes du cas pratique. */
export const CRENEAUX_DE_PROSPECTION_D_UN_TELEACTEUR = CRENEAUX_DE_CHAQUE_TELEACTEUR.prospection;

/** Le coût d'un téléacteur par mois, détaillé : pour les textes du cas pratique. */
export const COUT_DETAILLE_D_UN_TELEACTEUR = COUT_D_UN_TELEACTEUR;
