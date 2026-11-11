import { arrondi2, quotient2, taux2 } from "../../../pedagogy/cours/deux-decimales";
import { assortiment, equipeDuMois, referenceDe, stockDisponible } from "./boutique";
import type { CodeDeRayon, CodeDeReference, FicheDeLaBoutique } from "./maille-et-co";

/**
 * LE MONDE DU COURS : RÉIMPLANTER MAILLE & CO AVANT LES SOLDES (BTS MCO, bloc 2 pour le marchandisage,
 * bloc 4 pour l'ordonnancement ; chapitre « Réimplanter avant les soldes »).
 *
 * 1. LE MARCHANDISAGE. Le linéaire développé de chaque référence (hypothèse du cours) face à son chiffre
 *    d'affaires et à sa marge sur coût variable de janvier (monde/boutique.ts, `assortiment`) : la part
 *    du linéaire, la part du chiffre d'affaires et celle de la marge, l'indice de sensibilité (part du
 *    chiffre d'affaires ÷ part du linéaire), l'indice de rentabilité (part de la marge ÷ part du
 *    linéaire), la marge par mètre. Puis la réimplantation : des mètres pris au bonnet, donnés à une
 *    autre référence. La demande répond au linéaire par une droite (l'élasticité au linéaire), à
 *    l'unité inférieure comme la demande au prix ; les ventes restent la plus petite de la demande et
 *    du stock disponible du mois (la capacité de la référence) : un mètre de plus ne vend rien de plus
 *    à une référence en rupture.
 * 2. L'E-MARCHANDISAGE. L'ordre d'affichage sur la page de la vitrine en ligne : par la marge qu'une
 *    visite rapporte (taux de conversion × marge d'un article).
 * 3. L'ORDONNANCEMENT. Les tâches de la réimplantation, leurs durées, leurs antériorités et les
 *    personnes qu'elles demandent ; les dates au plus tôt et au plus tard, les marges totale et libre,
 *    le chemin critique (méthode PERT) ; puis le planning de Gantt quand l'équipe est limitée : chaque
 *    tâche prête démarre dès qu'il y a assez de monde, la moins libre d'abord (la plus petite date de
 *    début au plus tard).
 */

const auCentime = arrondi2;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const plancher = (x: number) => Math.floor(x + 1e-9);

// ─────────────────────────────────────────────────────────────────────────────
// 1. LE MARCHANDISAGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE LINÉAIRE DÉVELOPPÉ DE JANVIER (hypothèse du cours), en mètres : 15 m au rayon maille (6 m de col
 * rond, 5 m de cardigans, 4 m de mérinos), 9 m au rayon accessoires (4 m d'écharpes, 5 m de bonnets),
 * 24 m en tout. Le bonnet a hérité de la place d'une ancienne référence.
 */
export const LINEAIRE: Readonly<Record<CodeDeReference, number>> = { "col-rond": 6, cardigan: 5, merinos: 4, echarpe: 4, bonnet: 5 };

/**
 * L'ÉLASTICITÉ DES VENTES AU LINÉAIRE (hypothèse du cours) : 10 % de linéaire en plus font demander 3 %
 * d'articles en plus ; la réponse est une droite, comme celle de la demande au prix.
 */
export const ELASTICITE_AU_LINEAIRE = 0.3;

/** Ce que le bonnet garde au moins (hypothèse du cours) : 2 m, pour que la référence reste visible. */
export const LINEAIRE_MINIMAL = 2;

/** La référence d'où l'on prend des mètres. */
export const REFERENCE_QUI_CEDE: CodeDeReference = "bonnet";

/** Le marchandisage du mois, référence par référence et rayon par rayon. */
export function marchandisage(f: FicheDeLaBoutique) {
  const a = assortiment(f);
  const lineaireTotal = somme(Object.values(LINEAIRE));
  const references = a.references.map((r) => {
    const lineaire = LINEAIRE[r.code];
    const partDuLineaire = lineaire / lineaireTotal;
    // Les parts de la copie, à deux décimales, et les indices tirés d'elles, au centième.
    const partDuLineaireEnPourcent = taux2(lineaire, lineaireTotal);
    const partDuChiffreEnPourcent = arrondi2(r.partDuChiffreDAffaires * 100);
    const partDeLaMargeEnPourcent = arrondi2(r.partDeLaMarge * 100);
    return {
      code: r.code,
      nom: r.nom,
      rayon: referenceDe(f, r.code).rayon,
      lineaire,
      chiffreDAffaires: r.chiffreDAffaires,
      marge: r.marge,
      margeUnitaire: r.margeUnitaire,
      partDuLineaire,
      partDuChiffreDAffaires: r.partDuChiffreDAffaires,
      partDeLaMarge: r.partDeLaMarge,
      partDuLineaireEnPourcent,
      partDuChiffreEnPourcent,
      partDeLaMargeEnPourcent,
      indiceDeSensibilite: quotient2(partDuChiffreEnPourcent, partDuLineaireEnPourcent),
      indiceDeRentabilite: quotient2(partDeLaMargeEnPourcent, partDuLineaireEnPourcent),
      margeParMetre: auCentime(r.marge / lineaire),
      chiffreParMetre: auCentime(r.chiffreDAffaires / lineaire),
    };
  });
  const rayons = (["maille", "accessoires"] as CodeDeRayon[]).map((code) => {
    const rs = references.filter((r) => r.rayon === code);
    return { code, lineaire: somme(rs.map((r) => r.lineaire)), marge: auCentime(somme(rs.map((r) => r.marge))) };
  });
  return { references, rayons, lineaireTotal, marge: a.marge, chiffreDAffaires: a.chiffreDAffaires, margeParMetre: auCentime(a.marge / lineaireTotal) };
}

/** La demande d'une référence pour un linéaire donné, à l'unité inférieure, et ses ventes (bornées par le stock disponible). */
export function ventesAuLineaire(f: FicheDeLaBoutique, code: CodeDeReference, lineaire: number) {
  const r = referenceDe(f, code);
  const l0 = LINEAIRE[code];
  const demande = plancher(r.demandeDuMois * (1 + (ELASTICITE_AU_LINEAIRE * (lineaire - l0)) / l0));
  const stock = stockDisponible(r);
  const ventes = Math.min(demande, stock);
  return { demande, stock, ventes, enRupture: demande > stock };
}

/** Prendre `metres` au bonnet pour les donner à `receveuse` : ce que chacune vend, gagne ou perd, et l'effet sur la marge du mois. */
export function reimplanter(f: FicheDeLaBoutique, receveuse: CodeDeReference, metres: number) {
  const m = marchandisage(f);
  const ligne = (code: CodeDeReference) => m.references.find((r) => r.code === code)!;
  const cede = ligne(REFERENCE_QUI_CEDE);
  const recoit = ligne(receveuse);
  const avantCede = referenceDe(f, REFERENCE_QUI_CEDE).ventesDuMois;
  const avantRecoit = referenceDe(f, receveuse).ventesDuMois;
  const apresCede = ventesAuLineaire(f, REFERENCE_QUI_CEDE, cede.lineaire - metres);
  const apresRecoit = receveuse === REFERENCE_QUI_CEDE ? apresCede : ventesAuLineaire(f, receveuse, recoit.lineaire + metres);
  const margePerdue = auCentime((avantCede - apresCede.ventes) * cede.margeUnitaire);
  const margeGagnee = receveuse === REFERENCE_QUI_CEDE ? 0 : auCentime((apresRecoit.ventes - avantRecoit) * recoit.margeUnitaire);
  const effet = auCentime(margeGagnee - margePerdue);
  return {
    receveuse: recoit,
    cede,
    metres,
    ventesPerdues: avantCede - apresCede.ventes,
    ventesGagnees: receveuse === REFERENCE_QUI_CEDE ? 0 : apresRecoit.ventes - avantRecoit,
    apresCede,
    apresRecoit,
    margePerdue,
    margeGagnee,
    effet,
    margeDuMois: auCentime(m.marge + effet),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. L'E-MARCHANDISAGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE TAUX DE CONVERSION EN LIGNE (hypothèse du cours) : sur la vitrine en ligne de la boutique, la part
 * des visites de la fiche d'un article qui finissent par une réservation retirée et payée en boutique.
 */
export const CONVERSION_EN_LIGNE: Readonly<Record<CodeDeReference, number>> = { "col-rond": 0.03, cardigan: 0.022, merinos: 0.012, echarpe: 0.04, bonnet: 0.05 };

/** L'ordre d'affichage : la marge qu'une visite de la fiche rapporte, de la plus forte à la plus faible. */
export function ordreEnLigne(f: FicheDeLaBoutique) {
  const lignes = marchandisage(f).references.map((r) => ({ code: r.code, nom: r.nom, conversion: CONVERSION_EN_LIGNE[r.code], margeUnitaire: r.margeUnitaire, margeParVisite: auCentime(CONVERSION_EN_LIGNE[r.code] * r.margeUnitaire) }));
  return [...lignes].sort((a, b) => b.margeParVisite - a.margeParVisite);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. L'ORDONNANCEMENT DE LA RÉIMPLANTATION
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeTache = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

export interface TacheDeLaReimplantation {
  code: CodeDeTache;
  libelle: string;
  /** En minutes. */
  duree: number;
  /** Les tâches qui doivent être finies avant qu'elle commence. */
  apres: readonly CodeDeTache[];
  /** Les personnes qu'elle occupe en même temps. */
  personnes: number;
}

/**
 * LES TÂCHES DE LA RÉIMPLANTATION (hypothèse du cours), le lundi qui précède les soldes, avant
 * l'ouverture : on vide les rayons, on déplace le rayonnage des accessoires (les mètres rendus par le
 * bonnet), on nettoie, on remonte, on remet en rayon ; en parallèle, on prépare les étiquettes des
 * prix soldés, la vitrine et la signalétique.
 */
export const TACHES: readonly TacheDeLaReimplantation[] = [
  { code: "A", libelle: "Vider les rayons, ranger le stock en réserve", duree: 30, apres: [], personnes: 2 },
  { code: "B", libelle: "Démonter et déplacer le rayonnage des accessoires", duree: 45, apres: ["A"], personnes: 2 },
  { code: "C", libelle: "Nettoyer le sol et les étagères", duree: 15, apres: ["A"], personnes: 1 },
  { code: "D", libelle: "Remonter le rayonnage selon le nouveau plan", duree: 30, apres: ["B", "C"], personnes: 2 },
  { code: "E", libelle: "Préparer les étiquettes des prix soldés", duree: 60, apres: [], personnes: 1 },
  { code: "F", libelle: "Remettre les articles en rayon", duree: 45, apres: ["D"], personnes: 3 },
  { code: "G", libelle: "Poser la signalétique des soldes", duree: 15, apres: ["D", "E"], personnes: 1 },
  { code: "H", libelle: "Refaire la vitrine", duree: 30, apres: ["E"], personnes: 1 },
  { code: "I", libelle: "Contrôler les prix, la caisse et la sécurité", duree: 15, apres: ["F", "G", "H"], personnes: 1 },
];

/** L'heure où l'équipe commence (7 h) et celle où la boutique ouvre (l'ouverture de la fiche, 10 h). */
export const HEURE_DE_DEBUT = 7;
export const heureDOuverture = (f: FicheDeLaBoutique) => f.ouverture.debut;

/** L'équipe du lundi matin (hypothèse du cours) : la responsable, l'adjointe et le vendeur ; puis la vendeuse à temps partiel en renfort. */
export const EQUIPE_DU_MATIN = ["responsable", "adjointe", "vendeur"] as const;
export const RENFORT = "vendeuse-partiel";

const parCode = (taches: readonly TacheDeLaReimplantation[]) => new Map(taches.map((t) => [t.code, t]));

/** Les dates au plus tôt, au plus tard, les marges et le chemin critique (méthode PERT), en minutes depuis le début. */
export function reseauPert(taches: readonly TacheDeLaReimplantation[] = TACHES) {
  const t = parCode(taches);
  const tot = new Map<CodeDeTache, number>();
  const debutAuPlusTot = (c: CodeDeTache): number => {
    if (!tot.has(c)) tot.set(c, Math.max(0, ...t.get(c)!.apres.map((p) => debutAuPlusTot(p) + t.get(p)!.duree)));
    return tot.get(c)!;
  };
  for (const x of taches) debutAuPlusTot(x.code);
  const fin = Math.max(...taches.map((x) => tot.get(x.code)! + x.duree));
  const successeurs = (c: CodeDeTache) => taches.filter((x) => x.apres.includes(c));
  const tard = new Map<CodeDeTache, number>();
  const debutAuPlusTard = (c: CodeDeTache): number => {
    if (!tard.has(c)) {
      const s = successeurs(c);
      const finAuPlusTard = s.length ? Math.min(...s.map((x) => debutAuPlusTard(x.code))) : fin;
      tard.set(c, finAuPlusTard - t.get(c)!.duree);
    }
    return tard.get(c)!;
  };
  const lignes = taches.map((x) => {
    const tot0 = tot.get(x.code)!;
    const tard0 = debutAuPlusTard(x.code);
    const s = successeurs(x.code);
    const margeLibre = (s.length ? Math.min(...s.map((y) => tot.get(y.code)!)) : fin) - (tot0 + x.duree);
    return { ...x, debutAuPlusTot: tot0, finAuPlusTot: tot0 + x.duree, debutAuPlusTard: tard0, finAuPlusTard: tard0 + x.duree, margeTotale: tard0 - tot0, margeLibre };
  });
  return { lignes, fin, critique: lignes.filter((l) => l.margeTotale === 0).map((l) => l.code) };
}

/**
 * LE RAYONNAGE QUI RÉSISTE (hypothèse du cas « Le rayonnage qui résiste ») : une fixation grippée fait
 * durer le déplacement du rayonnage des accessoires (tâche B) 30 minutes de plus.
 */
export const RETARD_DU_RAYONNAGE = 30;

/** Le réseau quand une tâche dure autrement (le curseur de la vitrine). */
export const reseauAvecLaDuree = (code: CodeDeTache, duree: number) => reseauPert(TACHES.map((x) => (x.code === code ? { ...x, duree } : x)));

/**
 * LE PLANNING DE GANTT À ÉQUIPE LIMITÉE : de quart d'heure en quart d'heure (toutes les durées en sont
 * des multiples), chaque tâche dont les antériorités sont finies démarre s'il reste assez de monde, la
 * plus petite date de début au plus tard d'abord.
 */
export function planningDeGantt(personnes: number, taches: readonly TacheDeLaReimplantation[] = TACHES) {
  const pert = reseauPert(taches);
  const ordre = [...pert.lignes].sort((a, b) => a.debutAuPlusTard - b.debutAuPlusTard || a.code.localeCompare(b.code));
  const debut = new Map<CodeDeTache, number>();
  const finDe = (c: CodeDeTache) => debut.get(c)! + taches.find((x) => x.code === c)!.duree;
  for (let instant = 0; debut.size < taches.length; instant += 15) {
    if (instant > 24 * 60) throw new Error("Le planning ne se termine pas");
    const occupes = somme(taches.filter((x) => debut.has(x.code) && debut.get(x.code)! <= instant && finDe(x.code) > instant).map((x) => x.personnes));
    let libres = personnes - occupes;
    for (const x of ordre) {
      if (debut.has(x.code) || x.personnes > libres) continue;
      if (!x.apres.every((p) => debut.has(p) && finDe(p) <= instant)) continue;
      debut.set(x.code, instant);
      libres -= x.personnes;
    }
  }
  const lignes = taches.map((x) => ({ ...x, debut: debut.get(x.code)!, fin: finDe(x.code) }));
  return { personnes, lignes, fin: Math.max(...lignes.map((l) => l.fin)) };
}

/** Une heure de la matinée, depuis le début en minutes : « 9 h 45 ». */
export function heureDe(minutes: number, debut: number = HEURE_DE_DEBUT) {
  const total = debut * 60 + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/**
 * LE RENFORT DU LUNDI (hypothèse du cours) : la vendeuse à temps partiel avance ses heures du lundi.
 * Elle vient de 7 h à 9 h 45 au lieu de 15 h à 17 h 45 : sur ces créneaux de l'après-midi, le planning
 * de la fiche met 3 vendeurs quand l'affluence du lundi n'en demande que 2. Aucune heure de plus,
 * aucun créneau sous le besoin.
 */
export const CRENEAUX_RENDUS_PAR_LE_RENFORT = [15, 16, 17] as const;

export function renfortDuLundi(f: FicheDeLaBoutique) {
  const e = equipeDuMois(f);
  const salarie = e.salaries.find((x) => x.code === RENFORT)!;
  const creneaux = CRENEAUX_RENDUS_PAR_LE_RENFORT.map((h) => {
    const i = h - f.ouverture.debut;
    const entrees = f.affluence.lundi[i]!;
    const besoin = Math.max(f.reglesDuPlanning.presenceMinimale, Math.ceil(entrees / f.reglesDuPlanning.entreesParVendeur - 1e-9));
    const presence = f.planning.lundi[i]!;
    return { heure: h, entrees, besoin, presence, apres: presence - 1 };
  });
  return { salarie, creneaux, toujoursCouvert: creneaux.every((c) => c.apres >= c.besoin) };
}
