import { auCentime, JOURS_DE_L_ANNEE } from "./amortissement";
import { anneeDeProduction, coutsDeLaQualite, machineDe, margeUnitaire, partDuMarche } from "./capacite";
import { bilanDuLycee, compteDuLycee, exerciceDe } from "./comptes-du-lycee";
import { demandeAuPrix } from "./economie-et-marketing";
import { APPORT_EN_CAPITAL, CONTRAT_DE_PRET, EQUIPEMENT, PLACEMENT, SONORA } from "./exercice-de-nova";
import { SOUNDBOX } from "./marche-a-trois";
import { MERCATIQUE_DE_NOVA } from "./mercatique-de-nova";
import { NOVA_CAPACITE, type FicheDeLaCapacite } from "./nova-capacite";
import { CHARGES_FIXES_DU_MOIS } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LA DIRECTION DE NOVA (le lot M6 : « le diagnostic stratégique », « décider
 * ensemble », « le projet d'entreprise », et leurs cas).
 *
 * NOVA fabrique des enceintes (voir l-escale.ts pour le principe du monde du cours). Ce fichier
 * relit les fiches qui existent, sans en recopier un chiffre :
 *   · exercice-de-nova.ts : la création (l'apport de 150 000 €, l'emprunt de 80 000 €, la ligne de
 *     montage à 60 000 € hors taxes, le compte à terme du 6 janvier), Sonora et son redressement ;
 *   · nova-gestion.ts : les charges fixes d'un mois (le loyer, le personnel, l'usure de la ligne) ;
 *   · comptes-du-lycee.ts : le résultat et la trésorerie du premier exercice ;
 *   · nova-capacite.ts et capacite.ts : la demande de N + 1, la ligne, l'équipe, l'entretien, la
 *     qualité, le salaire du marché et le seuil de démission ;
 *   · mercatique-de-nova.ts et marche-a-trois.ts : la demande qui répond au prix, SoundBox et son prix.
 */

/** La fiche de capacité de NOVA. */
export const FICHE_DE_DIRECTION: FicheDeLaCapacite = NOVA_CAPACITE;

/** Les entreprises des trois chapitres : NOVA seule. */
export const ENTREPRISES_DE_LA_DIRECTION: readonly string[] = [FICHE_DE_DIRECTION.code];

const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const auDessus = (x: number) => Math.ceil(x - 1e-9);
const auDessous = (x: number) => Math.floor(x + 1e-9);

// ═════════════════════════════════════════════════════════════════════════════
// 1. LE PROJET D'ENTREPRISE : LES BESOINS ET LES RESSOURCES DU 6 JANVIER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LES CHARGES À COUVRIR (hypothèse du chapitre « Le projet d'entreprise ») : avant que les ventes ne
 * rentrent, une entreprise qui démarre garde de quoi payer trois mois de ses charges fixes. Les
 * charges fixes qui se paient sont le loyer et le personnel (l'usure de la ligne ne fait sortir
 * aucun argent). Un mois compte 30 jours, l'année 360 (la convention du cours).
 */
export const MOIS_DE_CHARGES_A_COUVRIR = 3;

/** Les montants placés que le laboratoire essaie, de 1 000 en 1 000 €. */
export const PLACEMENTS_ESSAYES = { min: 100_000, max: 158_000, pas: 1_000 } as const;

/** Le cas « Un équipement de plus au départ » : un cinquième poste de la ligne, au prix du catalogue. */
export const POSTE_DE_PLUS_AU_DEPART = "poste-manuel" as const;

export type Cote = "besoin" | "ressource";

/**
 * Le projet de NOVA au soir du 6 janvier : la ligne payée, le compte à terme ouvert. Les besoins : la
 * ligne (hors taxes), la TVA payée sur la ligne (une créance sur l'État, qu'il rendra), l'argent
 * placé et celui du compte courant. Les ressources : l'apport des associés et l'emprunt. Un poste
 * de plus (cas) se paie comptant (la trésorerie baisse) ou s'emprunte (les ressources montent).
 */
export function projetDeNova(v: Partial<{ placement: number; apport: number; emprunt: number; equipementEnPlus: number; empruntEnPlus: number }> = {}) {
  const apport = v.apport ?? APPORT_EN_CAPITAL.montant;
  const emprunt = v.emprunt ?? CONTRAT_DE_PRET.capital;
  const enPlus = v.equipementEnPlus ?? 0;
  const tauxDeTva = EQUIPEMENT.tva / EQUIPEMENT.ht;
  const equipement = auCentime(EQUIPEMENT.ht + enPlus);
  const tva = auCentime(equipement * tauxDeTva);
  const empruntEnPlus = v.empruntEnPlus ?? 0;
  const ressources = auCentime(apport + emprunt + empruntEnPlus);
  const tresorerie = auCentime(ressources - equipement - tva);
  const placement = Math.min(v.placement ?? PLACEMENT.montant, Math.max(0, tresorerie));
  const compteCourant = auCentime(tresorerie - placement);
  const chargesDuMois = CHARGES_FIXES_DU_MOIS.loyer + CHARGES_FIXES_DU_MOIS.personnel;
  const joursParMois = JOURS_DE_L_ANNEE / 12;
  const chargesParJour = chargesDuMois / joursParMois;
  return {
    apport,
    emprunt: auCentime(emprunt + empruntEnPlus),
    equipement,
    tva,
    tauxDeTva,
    ttc: auCentime(equipement + tva),
    placement,
    compteCourant,
    tresorerie,
    besoins: auCentime(equipement + tva + tresorerie),
    ressources,
    partDesAssocies: apport / ressources,
    chargesDuMois,
    loyer: CHARGES_FIXES_DU_MOIS.loyer,
    personnel: CHARGES_FIXES_DU_MOIS.personnel,
    usure: CHARGES_FIXES_DU_MOIS.amortissement,
    joursParMois,
    chargesParJour,
    /** Les jours de charges fixes que la trésorerie paie sans aucune vente, et ceux du seul compte courant. */
    jours: auDessous(tresorerie / chargesParJour),
    joursDuCompteCourant: auDessous(compteCourant / chargesParJour),
    aCouvrir: MOIS_DE_CHARGES_A_COUVRIR * chargesDuMois,
    /** Le plus petit apport, à l'euro, qui garde trois mois de charges fixes en trésorerie. */
    apportMinimal: auDessus(MOIS_DE_CHARGES_A_COUVRIR * chargesDuMois - (emprunt + empruntEnPlus) + equipement + tva),
    /** Le plus gros placement, de 1 000 en 1 000 €, qui laisse un mois de charges fixes au compte courant. */
    placementMaximal: Math.floor((tresorerie - chargesDuMois) / PLACEMENTS_ESSAYES.pas + 1e-9) * PLACEMENTS_ESSAYES.pas,
    dateDuPlacement: PLACEMENT.date,
    trimestresDuPret: CONTRAT_DE_PRET.dureeAns * CONTRAT_DE_PRET.echeancesParAn,
    tauxDuPret: CONTRAT_DE_PRET.tauxAnnuel,
    echeancesParAn: CONTRAT_DE_PRET.echeancesParAn,
  };
}

/** Le poste de plus du cas : son prix hors taxes, et la première échéance d'un emprunt aux conditions de celui de NOVA. */
export function posteDePlusAuDepart() {
  const m = machineDe(FICHE_DE_DIRECTION, POSTE_DE_PLUS_AU_DEPART);
  const sans = projetDeNova();
  const comptant = projetDeNova({ equipementEnPlus: m.prix });
  const emprunte = projetDeNova({ equipementEnPlus: m.prix, empruntEnPlus: auCentime(m.prix * (1 + sans.tauxDeTva)) });
  const capital = auCentime(m.prix * (1 + sans.tauxDeTva));
  const capitalParEcheance = auCentime(capital / sans.trimestresDuPret);
  const interets = auCentime((capital * sans.tauxDuPret) / sans.echeancesParAn);
  return { machine: m, sans, comptant, emprunte, capital, capitalParEcheance, interets, premiereEcheance: auCentime(capitalParEcheance + interets) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. DÉCIDER ENSEMBLE : TROIS ÉCRANS POUR L'ANNÉE N + 1
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LES TROIS FAÇONS DE DÉCIDER (hypothèses du chapitre « Décider ensemble ») : sur l'année N + 1 de
 * NOVA, le commercial seul baisse le prix de 10 % (de 59 € à 53,10 €) ; le financier seul divise par
 * deux l'entretien de la ligne et la prévention de la qualité ; l'équipe garde le plan (59 €,
 * 4 500 € d'entretien par trimestre, 16 000 € de prévention dans l'année).
 *
 * LA DEMANDE QUI RÉPOND AU PRIX (hypothèse du cours) : chaque trimestre de N + 1 répond au prix comme
 * le premier trimestre de N, sur la droite de nova-gestion.ts : la demande prévue est multipliée par
 * la demande de la droite au prix choisi, divisée par celle de 59 €, à l'enceinte la plus proche.
 *
 * LE RÉSULTAT DES CHOIX : la marge sur coût variable des enceintes vendues, moins l'entretien de
 * l'année, moins les coûts de la qualité (prévention, contrôle, retouches et retours), moins la
 * marge des ventes que les défauts font perdre. Le loyer, le personnel et l'usure ne bougent pas.
 */
export const BAISSE_DE_PRIX_DU_COMMERCIAL = 0.1;
export const COUPE_DU_FINANCIER = 0.5;

/** Les prix que le laboratoire essaie : celui du commercial, celui du plan, et celui qui sert Noël. */
export type Facon = "commercial" | "financier" | "equipe";
export const FACONS: readonly Facon[] = ["commercial", "financier", "equipe"];

export interface LeviersDeLaDecision {
  prix: number;
  /** La part des budgets d'entretien et de prévention du plan (1 : le plan, 0,5 : la moitié). */
  budgets: number;
}

const PRIX_DU_PLAN = FICHE_DE_DIRECTION.enceinte.prix;

/** La demande de N + 1 au prix p, trimestre par trimestre. */
export const demandeDeNPlus1AuPrix = (p: number) => {
  const k = demandeAuPrix(MERCATIQUE_DE_NOVA, p) / demandeAuPrix(MERCATIQUE_DE_NOVA, PRIX_DU_PLAN);
  return FICHE_DE_DIRECTION.anneeNPlus1.demande.map((d) => Math.round(d * k));
};

/** L'année N + 1 décidée avec un prix et une part des budgets. */
export function anneeDecidee(l: Partial<LeviersDeLaDecision> = {}) {
  const f = FICHE_DE_DIRECTION;
  const prix = l.prix ?? PRIX_DU_PLAN;
  const part = l.budgets ?? 1;
  const entretien = f.plan.entretien.map((b) => auCentime(b * part));
  const prevention = auCentime(f.plan.prevention * part);
  const demande = demandeDeNPlus1AuPrix(prix);
  const a = anneeDeProduction(f, { annee: "N+1", demande, entretien });
  const margeUnitaireAuPrix = auCentime(prix - f.enceinte.coutVariable.composants - f.enceinte.coutVariable.autres);
  const q = coutsDeLaQualite(f, { prevention, volume: a.production });
  const marge = auCentime(a.production * margeUnitaireAuPrix);
  const margeDesDefauts = auCentime(q.ventesPerdues * margeUnitaireAuPrix);
  const coutDeLEntretien = auCentime(somme(entretien));
  return {
    prix,
    part,
    entretien: coutDeLEntretien,
    prevention,
    demande: a.demande,
    production: a.production,
    refusees: a.refusees,
    disponibiliteFinale: a.trimestres.at(-1)!.disponibilite,
    margeUnitaire: margeUnitaireAuPrix,
    marge,
    qualite: q.total,
    defautsLivres: q.livres,
    margeDesDefauts,
    resultat: auCentime(marge - coutDeLEntretien - q.total - margeDesDefauts),
    trimestres: a.trimestres,
  };
}

/** Les leviers de chaque façon de décider. */
export const LEVIERS_DES_FACONS: Readonly<Record<Facon, LeviersDeLaDecision>> = {
  commercial: { prix: auCentime(PRIX_DU_PLAN * (1 - BAISSE_DE_PRIX_DU_COMMERCIAL)), budgets: 1 },
  financier: { prix: PRIX_DU_PLAN, budgets: COUPE_DU_FINANCIER },
  equipe: { prix: PRIX_DU_PLAN, budgets: 1 },
};

/** Le plus bas prix, à l'euro, qui sert toute la demande du trimestre le plus chargé de N + 1 sans que la ligne refuse un client. */
export function prixQuiSertLePlusFort() {
  const f = FICHE_DE_DIRECTION;
  const fort = Math.max(...f.anneeNPlus1.demande);
  const i = f.anneeNPlus1.demande.indexOf(fort);
  let p = 1;
  while (demandeDeNPlus1AuPrix(p)[i]! > f.ligne.capaciteParTrimestre) p += 1;
  return { prix: p, trimestre: i + 1, demandeAuPlan: fort, capacite: f.ligne.capaciteParTrimestre };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LE DIAGNOSTIC STRATÉGIQUE : LES CONSTATS DE NOVA
// ═════════════════════════════════════════════════════════════════════════════

export type Categorie = "force" | "faiblesse" | "opportunite" | "menace";

export interface Constat {
  code: string;
  libelle: string;
  montant: number;
  unite: "€" | "%" | "enceintes";
  categorie: Categorie;
  pourquoi: string;
}

/** Les salaires que le laboratoire du diagnostic essaie, de 25 en 25 € bruts par mois. */
export const SALAIRES_DU_DIAGNOSTIC = { min: 1_875, max: 2_000, pas: 25 } as const;

/**
 * Les faits du diagnostic, tous lus sur les fiches : le résultat et la trésorerie de N, ce que la
 * ligne refusera en N + 1, le salaire face au marché de N + 1, la demande qui grandit, le marché
 * qui paie mieux les opérateurs, le prix de SoundBox, le redressement de Sonora. Chaque constat se
 * range par une règle écrite ici : un bénéfice est une force, une perte une faiblesse ; une demande
 * refusée est une faiblesse de l'outil ; un salaire sous le seuil de démission, une faiblesse ; ce
 * que fait le marché (la demande, les salaires, un concurrent, un client) est externe.
 */
export function faitsDuDiagnostic(salaire: number = FICHE_DE_DIRECTION.operateurs.salaireBrutMensuel) {
  const f = FICHE_DE_DIRECTION;
  const ex = exerciceDe(f.code);
  const k = compteDuLycee(ex);
  const b = bilanDuLycee(ex);
  const n1 = anneeDeProduction(f, { annee: "N+1" });
  const demandeN = somme(f.anneeN.demande);
  const marche = partDuMarche(f, { salaire });
  const marcheN = f.personnel.salaireDuMarche.n;
  const marcheN1 = f.personnel.salaireDuMarche.nPlus1;
  return {
    resultat: k.resultatNet,
    tresorerie: b.tresorerie,
    refusees: n1.refusees,
    refuseesN: anneeDeProduction(f, { annee: "N" }).refusees,
    demandeN,
    demandeN1: n1.demande,
    hausseDeLaDemande: n1.demande / demandeN - 1,
    margeRefusee: n1.margeRefusee,
    salaire,
    marcheN,
    marcheN1,
    part: marche.part,
    seuil: marche.seuil,
    salaireAuSeuil: marche.salaireAuSeuil,
    sousLeSeuil: marche.sousLeSeuil,
    /** Le plus haut salaire du marché, à l'euro, sous lequel la paie de NOVA reste au-dessus du seuil de démission. */
    marcheMaximal: auDessous(salaire / marche.seuil),
    prixDeNova: f.enceinte.prix,
    concurrent: SOUNDBOX.nom,
    prixDuConcurrent: SOUNDBOX.offre.prix,
    client: SONORA.nom,
    perteProbable: SONORA.redressement.tauxDePerteProbable,
    marge: margeUnitaire(f),
  };
}

/** Les constats du diagnostic de NOVA, rangés par la règle. */
export function constatsDuDiagnostic(salaire?: number): Constat[] {
  const x = faitsDuDiagnostic(salaire);
  return [
    {
      code: "resultat",
      libelle: "Résultat net du premier exercice",
      montant: x.resultat,
      unite: "€",
      categorie: x.resultat >= 0 ? "force" : "faiblesse",
      pourquoi: x.resultat >= 0 ? "un bénéfice dès la première année vient des choix de l'entreprise : une force." : "une perte vient des choix de l'entreprise : une faiblesse.",
    },
    {
      code: "tresorerie",
      libelle: "Trésorerie au 31 décembre (banque et compte à terme)",
      montant: x.tresorerie,
      unite: "€",
      categorie: x.tresorerie >= 0 ? "force" : "faiblesse",
      pourquoi: x.tresorerie >= 0 ? "de l'argent disponible laisse les moyens de décider : une force." : "un découvert prive l'entreprise de moyens : une faiblesse.",
    },
    {
      code: "refusees",
      libelle: "Enceintes demandées que la ligne ne pourra pas monter en N + 1",
      montant: x.refusees,
      unite: "enceintes",
      categorie: x.refusees > 0 ? "faiblesse" : "force",
      pourquoi: x.refusees > 0 ? "la ligne de montage, un moyen de l'entreprise, ne suffira pas à servir les clients : une faiblesse." : "la ligne sert toute la demande prévue : une force.",
    },
    {
      code: "salaire",
      libelle: "Salaire des opérateurs face au marché de N + 1",
      montant: Math.round(x.part * 1000) / 10,
      unite: "%",
      categorie: x.sousLeSeuil ? "faiblesse" : "force",
      pourquoi: x.sousLeSeuil
        ? "le salaire est un choix de l'entreprise ; sous le seuil de démission, il fait partir les opérateurs : une faiblesse."
        : "le salaire est un choix de l'entreprise, assez haut pour garder l'équipe : une force.",
    },
    {
      code: "demande",
      libelle: "Hausse de la demande prévue, de N à N + 1",
      montant: Math.round(x.hausseDeLaDemande * 1000) / 10,
      unite: "%",
      categorie: x.hausseDeLaDemande > 0 ? "opportunite" : "menace",
      pourquoi: "la demande vient des clients, hors de l'entreprise ; qu'elle grandisse est une opportunité.",
    },
    {
      code: "marche-du-travail",
      libelle: "Salaire du marché des opérateurs en N + 1",
      montant: x.marcheN1,
      unite: "€",
      categorie: x.marcheN1 > x.marcheN ? "menace" : "opportunite",
      pourquoi: "les salaires que paient les autres employeurs ne dépendent pas de NOVA ; qu'ils montent est une menace pour son équipe.",
    },
    {
      code: "concurrent",
      libelle: `Prix de ${x.concurrent}, le concurrent le moins cher`,
      montant: x.prixDuConcurrent,
      unite: "€",
      categorie: x.prixDuConcurrent < x.prixDeNova ? "menace" : "opportunite",
      pourquoi: "un concurrent qui vend moins cher peut prendre des clients : une menace venue du marché.",
    },
    {
      code: "client",
      libelle: `Perte probable sur la créance de ${x.client}, en redressement judiciaire`,
      montant: Math.round(x.perteProbable * 1000) / 10,
      unite: "%",
      categorie: "menace",
      pourquoi: "la défaillance d'un client vient de l'environnement de l'entreprise : une menace.",
    },
  ];
}

export type Verdict = "saisir" | "corriger" | "se-proteger";

/**
 * La conclusion : une opportunité que l'entreprise ne peut pas saisir faute de moyens se traite
 * d'abord en corrigeant la faiblesse qui l'en empêche (ici, la ligne refuse des clients d'une demande
 * qui grandit) ; sans faiblesse qui bloque, on saisit l'opportunité ; sans opportunité, on se protège.
 */
export function verdictDuDiagnostic(): Verdict {
  const x = faitsDuDiagnostic();
  return x.hausseDeLaDemande > 0 && x.refusees > 0 ? "corriger" : x.hausseDeLaDemande > 0 ? "saisir" : "se-proteger";
}

/** Le plus petit salaire, de 25 en 25 €, qui garde les opérateurs au-dessus du seuil de démission en N + 1. */
export function salaireQuiFaitUneForce() {
  const { min, max, pas } = SALAIRES_DU_DIAGNOSTIC;
  for (let s = min; s <= max; s += pas) if (!faitsDuDiagnostic(s).sousLeSeuil) return s;
  return max;
}

/** Le trimestre de N + 1 qui refuse le plus de clients, et ce qui le borne (cas « Des clients repartis »). */
export function trimestreLePlusRefuse() {
  const f = FICHE_DE_DIRECTION;
  const a = anneeDeProduction(f, { annee: "N+1" });
  const t = [...a.trimestres].sort((x, y) => y.refusees - x.refusees || x.trimestre - y.trimestre)[0]!;
  const m = margeUnitaire(f);
  const machine = machineDe(f, "poste-manuel");
  return {
    ...t,
    margeUnitaire: m,
    margePerdue: auCentime(t.refusees * m),
    /** Ce que l'équipe pourrait monter de plus si l'outil suivait. */
    jeuDeLEquipe: Math.max(0, t.capaciteEquipe - t.capaciteOutil),
    machine,
    refuseesDeLAnnee: a.refusees,
  };
}
