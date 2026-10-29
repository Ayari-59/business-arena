import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { coutsDeLaGamme, planSousFacteurRare, resultatSansLaReference } from "../monde/couts-et-budgets";
import { GESTION_DU_COURS, type CodeDeReference, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, LigneDeSimulation, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : COÛT PAR PRODUIT (contrôle de gestion, palier 3 ; BTS CG, DCG UE11, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la gamme de
 * NOVA (Go, One, Studio) a une fiche figée (monde/nova-gestion.ts, `GAMME_DE_NOVA`) et se calcule par
 * le modèle du cours (monde/couts-et-budgets.ts, `coutsDeLaGamme`, `planSousFacteurRare`). Une
 * évolution du moteur ne change rien ici. Décision assumée : le chapitre ne se joue plus que chez
 * NOVA, la seule entreprise du monde du cours qui ait une gamme chiffrée.
 *
 * L'objet : le coût complet de trois références qui partagent un local, une équipe et deux lignes de
 * montage. L'élève calcule le coût direct de chacune (son coût variable et sa publicité, des charges
 * spécifiques), répartit les charges communes aux heures-machine, en tire le coût complet et le
 * résultat de chacune. Puis il découvre que ce résultat est une convention : une autre clé (le
 * chiffre d'affaires) le change, sans changer celui de la gamme. Ce qui ne dépend d'aucune clé, c'est
 * la marge sur coûts spécifiques : elle seule dit ce que l'abandon d'une référence ferait perdre.
 * En expert, la même gamme sous contrainte : quand les heures-machine manquent, on classe les
 * références par marge par heure-machine, le facteur rare.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, couts-directs, heures, couts-complets (la formule est au repère ou dans la
 *     question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-cle puis
 *     la-part-aux-heures (un curseur sur la part des charges communes réparties aux heures, le reste
 *     au chiffre d'affaires) avant au-chiffre-d-affaires ; predire-les-heures puis
 *     le-laboratoire-de-la-cle (la clé, le prix de NOVA One et ses heures : rendre les trois
 *     références bénéficiaires, et voir que les heures seules n'y arrivent pas) avant abandon et
 *     marge-specifique ;
 *   · autonome : resultats, au-chiffre-d-affaires, marge-specifique (ni formule ni chiffres à
 *     prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : les-deux-prix-de-one (un calcul à rebours, le prix qui annule le résultat en coût
 *     complet et celui sous lequel la marge sur coûts spécifiques devient négative, puis une variante
 *     chiffrée à un prix plus bas), quelle-reference-sacrifier, la-marge-par-heure et
 *     le-plan-du-mois-de-pointe (le facteur rare : le programme qui maximise la marge, face au
 *     programme classé par marge par enceinte), le-classement-en-cout-complet (une critique de la
 *     méthode) ; puis la synthèse.
 *
 * Ce qui a disparu avec l'arène : le niveau où la gamme s'ouvre, le budget qualité (nul partout,
 * une ligne inutile) et le coût de l'heure arrondi dans la correction (les charges communes
 * s'imputent au prorata exact, pour retomber juste sur leur total ; l'élève qui arrondit est admis).
 */

/** Les deux clés du laboratoire, codées comme la part des charges communes réparties aux heures. */
export const CLE_AUX_HEURES = 1;
export const CLE_AU_CHIFFRE_D_AFFAIRES = 0;

/** Les bornes du curseur de la clé : la part des charges communes réparties aux heures, en %. */
export const PART_DU_CURSEUR = { min: 0, max: 100 } as const;

/** Le prix de NOVA One dans le laboratoire, en euros, et son pas : dix centimes. */
export const PRIX_DE_ONE_DU_LABORATOIRE = { min: 54, max: 64, pas: 0.1 } as const;

/** Les heures-machine d'une NOVA One dans le laboratoire, et leur pas : un centième d'heure. */
export const HEURES_DE_ONE_DU_LABORATOIRE = { min: 0.2, max: 0.4, pas: 0.01 } as const;

/**
 * LA VARIANTE CHIFFRÉE, hypothèse du cours : un concurrent force NOVA à vendre la One 45 €, bien
 * sous son coût complet. Les quantités ne bougent pas (comme dans tout le chapitre).
 */
export const PRIX_DE_ONE_EN_VARIANTE = 45;

/** La référence dont le chapitre discute l'abandon : celle qui perd en coût complet, aux heures. */
export const REFERENCE_DISCUTEE: CodeDeReference = "one";

/** Le chapitre se calcule sur la gamme de la fiche de gestion : celle de NOVA. */
export const ENTREPRISES_DE_LA_GAMME: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (x: number) => `${qte(x)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** Un résultat dit en mots : « un bénéfice de 154,55 € », « une perte de 642,62 € ». */
const resultatDit = (x: number) => (x >= 0 ? `un bénéfice de ${eur(x)}` : `une perte de ${eur(-x)}`);
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

/** Les leviers du laboratoire, en position : la clé, le prix et les heures de la référence discutée. */
export interface PositionDeLaCle {
  cle: number;
  prix: number;
  heures: number;
}

/** La gamme pour une position du laboratoire (`cle` : la part des charges communes aux heures, de 0 à 1). */
export function gammeA(f: FicheDeGestion, p: PositionDeLaCle) {
  return coutsDeLaGamme(f, { partAuxHeures: p.cle, prix: { [REFERENCE_DISCUTEE]: p.prix }, heuresMachineParUnite: { [REFERENCE_DISCUTEE]: p.heures } });
}

/** Tout ce que le chapitre et son cas demandent, calculé une fois sur la fiche. */
export function coutsParProduit(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const g = f.gamme;
  const h = coutsDeLaGamme(f);
  const v = coutsDeLaGamme(f, { partAuxHeures: 0 });
  const refs = h.parReference;
  const x = refs.find((l) => l.code === REFERENCE_DISCUTEE)!;
  const xv = v.parReference.find((l) => l.code === REFERENCE_DISCUTEE)!;
  // Les tolérances : l'élève impute avec un coût d'unité d'œuvre arrondi au centime, un demi-centime par unité au plus.
  const toleranceAuxHeures = (heures: number) => auCentime(heures * 0.005 + 0.01);
  const toleranceAuChiffre = (chiffre: number) => auCentime((chiffre / 100) * 0.005 + 0.01);
  // Le curseur de la clé : la part aux heures qui laisse la référence discutée encore bénéficiaire.
  const pente = auCentime(x.imputees - xv.imputees);
  const partLimite = Math.floor(((x.margeSpecifique - xv.imputees) / pente) * 100 + 1e-9);
  // Le calcul à rebours : le prix qui annule le résultat en coût complet (aux heures), et celui qui annule la marge sur coûts spécifiques.
  const prixQuiAnnuleLeResultat = auCentime(x.coutComplet / x.quantite);
  const prixQuiAnnuleLaMarge = auCentime(x.direct / x.quantite);
  const enVariante = coutsDeLaGamme(f, { prix: { [REFERENCE_DISCUTEE]: PRIX_DE_ONE_EN_VARIANTE } });
  const sansX = resultatSansLaReference(h, REFERENCE_DISCUTEE);
  // Le facteur rare : le programme qui classe par marge par heure-machine, et celui qui classe par marge par enceinte.
  const plan = planSousFacteurRare(f);
  const naif = planSousFacteurRare(f, { classement: "marge-par-unite" });
  // La référence qui laisse le moins de marge après la discutée : celle que les charges quittées font basculer.
  const fragile = [...refs].filter((l) => l.code !== x.code).sort((a, b) => a.margeSpecifique - b.margeSpecifique)[0]!;
  return {
    f,
    g,
    h,
    v,
    refs,
    x,
    xv,
    fragile,
    communes: h.communes,
    heures: h.heures,
    coutDeLHeure: auCentime(h.coutDeLHeure),
    coutDesCent: auCentime(h.coutPourCentEurosDeChiffreDAffaires),
    toleranceAuxHeures,
    toleranceAuChiffre,
    pente,
    partLimite,
    prixQuiAnnuleLeResultat,
    prixQuiAnnuleLaMarge,
    resultatEnVariante: enVariante.resultat,
    gainAGarderEnVariante: auCentime(enVariante.resultat - sansX),
    sansX,
    plan,
    naif,
    perteDuMauvaisClassement: auCentime(plan.marge - naif.marge),
  };
}

export type CoutsParProduit = ReturnType<typeof coutsParProduit>;

/** La gamme du mois : le document de départ, pour le chapitre et son cas. */
export function tableauDeLaGamme(c: Pick<Cas, "code">): TableauDeDonnees {
  const k = coutsParProduit(c);
  const ligne = (libelle: string, val: (l: CoutsParProduit["refs"][number]) => string, total = "") => ({ libelle, valeurs: [...k.refs.map(val), total] });
  return {
    titre: `La gamme du mois · ${k.f.entreprise}`,
    colonnes: [...k.refs.map((l) => l.nom), "Toute la gamme"],
    lignes: [
      ligne("Enceintes vendues", (l) => qte(l.quantite)),
      ligne("Prix de vente, hors taxes", (l) => eur(l.prix)),
      ligne("Chiffre d'affaires", (l) => eur(l.chiffreDAffaires), eur(k.h.chiffreDAffaires)),
      ligne("Coût variable d'une enceinte", (l) => eur(l.coutVariableUnitaire)),
      ligne("Publicité de la référence", (l) => eur(l.publicite), eur(k.h.publicite)),
      ligne("Heures-machine d'une enceinte", (l) => `${qte(l.heuresMachineParUnite)} h`),
      { libelle: "Charges communes (loyer, personnel, entretien, usure)", valeurs: [...k.refs.map(() => ""), eur(k.communes)] },
    ],
  };
}

/** Les trois références et leur résultat selon les deux clés, la marge sur coûts spécifiques : la synthèse. */
function tableauDesDeuxCles(k: CoutsParProduit): TableauDeDonnees {
  const ligne = (libelle: string, val: (i: number) => number, total: number) => ({ libelle, valeurs: [...k.refs.map((_, i) => eur(val(i))), eur(total)] });
  return {
    titre: `Ce que chaque référence ${dE(k.f.entreprise)} coûte et rapporte, selon la clé`,
    colonnes: [...k.refs.map((l) => l.nom), "Toute la gamme"],
    lignes: [
      ligne("Marge sur coûts spécifiques", (i) => k.refs[i]!.margeSpecifique, auCentime(k.h.chiffreDAffaires - k.h.directs)),
      ligne("Charges communes aux heures-machine", (i) => k.refs[i]!.imputees, k.communes),
      ligne("Résultat aux heures-machine", (i) => k.refs[i]!.resultat, k.h.resultat),
      ligne("Charges communes au chiffre d'affaires", (i) => k.v.parReference[i]!.imputees, k.communes),
      ligne("Résultat au chiffre d'affaires", (i) => k.v.parReference[i]!.resultat, k.v.resultat),
    ],
  };
}

/** La lecture du laboratoire : les résultats des trois références et de la gamme, pour une position. */
function lectureDuLaboratoire(k: CoutsParProduit, p: PositionDeLaCle): LigneDeSimulation[] {
  const a = gammeA(k.f, p);
  const d = k.h;
  const ref = (g: typeof a, code: string) => g.parReference.find((l) => l.code === code)!;
  return [
    { libelle: `Charges communes portées par ${k.x.nom}`, montant: ref(a, k.x.code).imputees, reference: ref(d, k.x.code).imputees },
    { libelle: `Marge sur coûts spécifiques de ${k.x.nom}`, montant: ref(a, k.x.code).margeSpecifique, reference: ref(d, k.x.code).margeSpecifique },
    ...k.refs.map((l) => ({ libelle: `Résultat de ${l.nom}`, montant: ref(a, l.code).resultat, reference: ref(d, l.code).resultat, effet: true })),
    { libelle: "Résultat de la gamme", montant: a.resultat, reference: d.resultat, effet: true, fort: true },
  ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
}

const position = (p: Readonly<Record<string, number>>): PositionDeLaCle => ({ cle: p.cle!, prix: p.prix!, heures: p.heures! });

export const COUT_PAR_PRODUIT: Chapitre = {
  code: "cout-par-produit",
  parcours: "controle-de-gestion",
  palier: 3,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Coût par produit",
  accroche:
    "Trois références qui partagent un local, une équipe et deux lignes : ce que coûte chacune, pourquoi son résultat dépend de la clé choisie, et ce qui décide vraiment de garder ou d'arrêter un produit.",
  objectifs: [
    "Calculer le coût direct, le coût complet et le résultat de chaque produit",
    "Répartir les charges communes selon deux clés, et montrer ce qu'une clé change et ce qu'elle ne change pas",
    "Juger l'abandon d'un produit par sa marge sur coûts spécifiques",
    "Retrouver à rebours le prix qui annule le résultat d'un produit, et celui qui annule sa marge",
    "Établir le programme de production sous un facteur rare, par la marge par heure-machine",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_GAMME,
    pourquoi: "le coût par produit se calcule sur la gamme Go, One et Studio de NOVA, la seule entreprise du cours dont la simulation chiffre plusieurs références, leurs heures-machine et leurs charges communes.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une gamme, plusieurs coûts",
      notions: ["full_unit_cost", "fixed_costs"],
      tableau: tableauDeLaGamme,
      texte: (c) => {
        const k = coutsParProduit(c);
        const cm = k.g.communes;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${k.f.entreprise}, sur un mois. ${k.f.entreprise} vend ${k.g.libelle}, dans le même local, avec la même équipe, sur deux lignes de montage. Le dirigeant veut savoir ce que chaque référence lui rapporte.`,
          `Certaines charges se rattachent à une seule référence : son coût variable et sa publicité. Ce sont ses charges spécifiques ; la publicité est fixe, mais elle ne sert qu'elle. Les autres servent toute la gamme : le loyer (${eur(cm.loyer)}), le personnel (${eur(cm.personnel)}), le contrat d'entretien (${eur(cm.entretien)}) et l'usure des deux lignes (${eur(cm.usure)}), soit ${eur(k.communes)} de charges communes à répartir.`,
          "Ce que la simulation suppose : les enceintes du mois sont vendues, sans stock ; l'unité d'œuvre des charges communes est l'heure-machine ; et quand une expérience change un prix, les quantités vendues ne bougent pas.",
        ];
      },
      repere: () =>
        "Coût direct = coût variable + charges spécifiques. Coût complet = coût direct + part des charges communes. Résultat = chiffre d'affaires − coût complet.",
    },
    {
      id: "couts-directs",
      objectifs: [0],
      type: "montants",
      titre: "Le coût direct de chaque référence",
      notions: ["full_unit_cost", "variable_costs"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Pour chaque référence, le coût direct du mois réunit son coût variable (enceintes vendues × coût variable d'une enceinte) et sa publicité. ${k.refs.map((l) => `${l.nom} : ${qte(l.quantite)} × ${eur(l.coutVariableUnitaire)}, publicité ${eur(l.publicite)}`).join(" ; ")}.`;
      },
      champs: (c) =>
        coutsParProduit(c).refs.map((l) => ({
          libelle: `Coût direct : ${l.nom}`,
          attendu: l.direct,
          calcul: `${qte(l.quantite)} × ${eur(l.coutVariableUnitaire)} + ${eur(l.publicite)} = ${eur(l.direct)}`,
        })),
      explication: (c) => {
        const k = coutsParProduit(c);
        return [
          `Les coûts directs font ${eur(k.h.directs)} pour la gamme. La publicité ne varie pas avec les ventes du mois : c'est une charge fixe, mais propre à une référence. Elle partirait avec elle : c'est ce qui fera la marge sur coûts spécifiques.`,
        ];
      },
    },
    {
      id: "heures",
      objectifs: [0],
      type: "montants",
      titre: "L'unité d'œuvre : l'heure-machine",
      notions: ["full_unit_cost"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `On répartit les ${eur(k.communes)} de charges communes au prorata des heures-machine de chaque référence. ${k.refs.map((l) => `${l.nom} : ${qte(l.heuresMachineParUnite)} h par enceinte`).join(" ; ")}. Calculez les heures-machine de chaque référence, puis le coût d'une heure-machine, au centime.`;
      },
      champs: (c) => {
        const k = coutsParProduit(c);
        return [
          ...k.refs.map((l) => ({ libelle: `Heures-machine : ${l.nom}`, attendu: auCentime(l.heures), calcul: `${qte(l.quantite)} × ${qte(l.heuresMachineParUnite)} h = ${qte(auCentime(l.heures))} h` })),
          {
            libelle: "Coût d'une heure-machine",
            attendu: k.coutDeLHeure,
            calcul: `${eur(k.communes)} ÷ ${qte(auCentime(k.heures))} h ≈ ${eur(k.coutDeLHeure)}`,
          },
        ];
      },
      explication: (c) => {
        const k = coutsParProduit(c);
        return [
          `Chaque heure-machine porte ${eur(k.coutDeLHeure)} de charges communes. Une référence qui demande beaucoup d'heures en reçoit beaucoup, même si elle se vend peu cher.`,
        ];
      },
    },
    {
      id: "couts-complets",
      objectifs: [0],
      type: "montants",
      titre: "Le coût complet de chaque référence",
      notions: ["full_unit_cost"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Ajoutez au coût direct de chaque référence ses heures-machine × ${eur(k.coutDeLHeure)}. Quel est son coût complet ?`;
      },
      champs: (c) => {
        const k = coutsParProduit(c);
        return k.refs.map((l) => ({
          libelle: `Coût complet : ${l.nom}`,
          attendu: l.coutComplet,
          calcul: `${eur(l.direct)} + ${qte(auCentime(l.heures))} h × ${eur(k.coutDeLHeure)} ≈ ${eur(l.coutComplet)}`,
          tolerance: k.toleranceAuxHeures(l.heures),
        }));
      },
      explication: (c) => {
        const k = coutsParProduit(c);
        const ecart = auCentime(k.x.imputees - k.x.heures * k.coutDeLHeure);
        return [
          `La correction impute les charges communes au prorata exact des heures, pour qu'elles retombent juste sur ${eur(k.communes)} : ${k.refs.map((l) => eur(l.imputees)).join(" + ")}. Avec le coût de l'heure arrondi au centime, ${k.x.nom} reçoit ${eur(Math.abs(ecart))} de ${ecart > 0 ? "moins" : "plus"} : la correction l'admet.`,
        ];
      },
    },
    {
      id: "resultats",
      objectifs: [0],
      type: "montants",
      titre: "Le résultat de chaque référence",
      notions: ["full_unit_cost"],
      question: () => "Sans formule cette fois : le résultat de chaque référence en coût complet (négatif pour une perte), puis celui de la gamme.",
      champs: (c) => {
        const k = coutsParProduit(c);
        return [
          ...k.refs.map((l) => ({
            libelle: `Résultat : ${l.nom}`,
            attendu: l.resultat,
            calcul: `${eur(l.chiffreDAffaires)} − ${eur(l.coutComplet)} = ${eur(l.resultat)}`,
            tolerance: k.toleranceAuxHeures(l.heures),
          })),
          {
            libelle: "Résultat de la gamme",
            attendu: k.h.resultat,
            calcul: `${k.refs.map((l) => entre(l.resultat)).join(" + ")} = ${eur(k.h.resultat)}, soit ${eur(k.h.chiffreDAffaires)} − ${eur(k.h.directs)} − ${eur(k.communes)}`,
            tolerance: k.toleranceAuxHeures(k.heures),
          },
        ];
      },
      explication: (c) => {
        const k = coutsParProduit(c);
        return [
          `${k.x.nom} fait ${resultatDit(k.x.resultat)} en coût complet, quand la gamme gagne ${eur(k.h.resultat)}. La tentation est grande de l'arrêter, ou d'accuser la clé qui la charge. Deux questions, que les étapes suivantes séparent.`,
        ];
      },
    },
    {
      id: "predire-la-cle",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur une autre clé",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Le responsable de ${k.x.nom} trouve qu'elle porte trop de charges communes : elle demande ${pct(Math.round((k.x.heures / k.heures) * 100))} des heures-machine pour ${pct(Math.round((k.x.chiffreDAffaires / k.h.chiffreDAffaires) * 100))} du chiffre d'affaires. Il veut les répartir au chiffre d'affaires. Avant de calculer, pariez : le résultat de la gamme…`;
      },
      options: (c) => {
        const k = coutsParProduit(c);
        const studio = [...k.refs].sort((a, b) => b.prix - a.prix)[0]!;
        const voir = "Faites glisser la clé à l'étape suivante : le curseur montre ce qui bouge, et ce qui ne bouge pas.";
        return [
          { texte: "Ne bougera pas : les charges communes restent les mêmes", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Montera, puisque la référence en perte portera moins de charges", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Baissera, puisque ${studio.nom} portera plus de charges`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-part-aux-heures",
      objectifs: [1],
      type: "curseur",
      titre: "Faites glisser la clé",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Un compromis est possible : une part des charges communes aux heures-machine, le reste au chiffre d'affaires. Faites glisser cette part de ${pct(PART_DU_CURSEUR.min)} à ${pct(PART_DU_CURSEUR.max)}. Une droite donne ce que ${k.x.nom} laisse pour les charges communes, sa marge sur coûts spécifiques ; l'autre, les charges communes qu'elle porte. Placez le curseur sur la plus grande part aux heures qui la laisse bénéficiaire, puis validez.`;
      },
      grandeur: () => ({ libelle: "Part des charges communes réparties aux heures-machine", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: coutsParProduit(c).partLimite, min: PART_DU_CURSEUR.min, max: PART_DU_CURSEUR.max }),
      zones: ["Référence bénéficiaire", "Référence en perte"],
      rates: () => ({
        dessous: "La référence reste bénéficiaire avec plus de charges aux heures : cherchez la plus grande part.",
        dessus: "À cette part, la référence porte plus de charges communes qu'elle ne laisse de marge : elle perd.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, s) => {
        const k = coutsParProduit(c);
        const a = coutsDeLaGamme(k.f, { partAuxHeures: s / 100 });
        const ref = (code: string) => a.parReference.find((l) => l.code === code)!;
        return [
          { libelle: `Charges communes portées par ${k.x.nom}`, montant: ref(k.x.code).imputees },
          ...k.refs.map((l) => ({ libelle: `Résultat de ${l.nom}`, montant: ref(l.code).resultat, fort: l.code === k.x.code })),
          { libelle: "Résultat de la gamme", montant: a.resultat },
        ];
      },
      droites: (c) => {
        const k = coutsParProduit(c);
        return {
          produit: () => k.x.margeSpecifique,
          cout: (s) => k.xv.imputees + (s / 100) * k.pente,
          libelles: [`Marge sur coûts spécifiques de ${k.x.nom}`, `Charges communes portées par ${k.x.nom}`],
        };
      },
      explication: (c) => {
        const k = coutsParProduit(c);
        return [
          `À ${pct(k.partLimite)} des charges aux heures, ${k.x.nom} est encore bénéficiaire ; un point de plus, elle perd. Tout au chiffre d'affaires, elle gagne ${eur(k.xv.resultat)} ; tout aux heures, elle perd ${eur(-k.x.resultat)}. Chaque point de clé lui ajoute ${eur(auCentime(k.pente / 100))} de charges.`,
          `Pendant ce temps, le résultat de la gamme n'a pas bougé d'un centime : ${eur(k.h.resultat)} à toutes les positions. La clé déplace les charges communes d'une référence à l'autre ; elle ne les fait ni grossir ni disparaître. Et la marge sur coûts spécifiques de ${k.x.nom}, ${eur(k.x.margeSpecifique)}, est restée la même : elle ne dépend d'aucune clé.`,
        ];
      },
    },
    {
      id: "au-chiffre-d-affaires",
      objectifs: [1],
      type: "montants",
      titre: "Les charges communes au chiffre d'affaires",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Formalisez le bout du curseur, la clé au chiffre d'affaires, dont l'unité d'œuvre est 100 € de chiffre d'affaires. Calculez le coût de cette unité d'œuvre au centime, les charges communes portées par ${k.x.nom}, son résultat, puis celui de la gamme.`;
      },
      champs: (c) => {
        const k = coutsParProduit(c);
        return [
          { libelle: "Coût de 100 € de chiffre d'affaires", attendu: k.coutDesCent, calcul: `${eur(k.communes)} ÷ (${eur(k.h.chiffreDAffaires)} ÷ 100) ≈ ${eur(k.coutDesCent)}` },
          {
            libelle: `Charges communes : ${k.x.nom}, au chiffre d'affaires`,
            attendu: k.xv.imputees,
            calcul: `${eur(k.x.chiffreDAffaires)} ÷ 100 × ${eur(k.coutDesCent)} ≈ ${eur(k.xv.imputees)}`,
            tolerance: k.toleranceAuChiffre(k.x.chiffreDAffaires),
          },
          {
            libelle: `Résultat : ${k.x.nom}, au chiffre d'affaires`,
            attendu: k.xv.resultat,
            calcul: `${eur(k.x.chiffreDAffaires)} − ${eur(k.x.direct)} − ${eur(k.xv.imputees)} = ${eur(k.xv.resultat)}`,
            tolerance: k.toleranceAuChiffre(k.x.chiffreDAffaires),
          },
          {
            libelle: "Résultat de la gamme, au chiffre d'affaires",
            attendu: k.v.resultat,
            calcul: `${eur(k.h.chiffreDAffaires)} − ${eur(k.h.directs)} − ${eur(k.communes)} = ${eur(k.v.resultat)}`,
            tolerance: k.toleranceAuChiffre(k.h.chiffreDAffaires),
          },
        ];
      },
      explication: (c) => {
        const k = coutsParProduit(c);
        return [
          `Au chiffre d'affaires, ${k.x.nom} ne porte plus que ${eur(k.xv.imputees)} de charges communes, au lieu de ${eur(k.x.imputees)} : ${eur(k.pente)} de moins, que les autres références portent à sa place. Le résultat de la gamme reste ${eur(k.v.resultat)} : c'est le chiffre d'affaires, moins tous les coûts directs, moins toutes les charges communes, et aucun des trois ne dépend de la clé.`,
        ];
      },
    },
    {
      id: "predire-les-heures",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur les heures",
      notions: ["full_unit_cost"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Le bureau des méthodes propose une autre solution : garder la clé des heures, mais revoir le montage de ${k.x.nom} pour qu'elle demande moins d'heures-machine. Pariez : avec assez peu d'heures pour que ${k.x.nom} devienne bénéficiaire, les trois références le seront-elles ?`;
      },
      options: () => {
        const voir = "Le laboratoire de l'étape suivante vous laisse essayer : les heures, le prix, la clé.";
        return [
          { texte: "Non : les charges qu'elle ne porte plus iront aux autres références", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Oui : les autres références ne changent pas", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Oui, et la gamme gagnera ce que la référence ne porte plus", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-cle",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire de la clé",
      notions: ["full_unit_cost", "fixed_costs", "contribution_margin"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Trois leviers : la clé des charges communes, le prix de ${k.x.nom} et ses heures-machine par enceinte. Les quantités vendues ne bougent pas. Le tableau suit le résultat de chaque référence et celui de la gamme ; le graphique, les résultats selon les heures de ${k.x.nom}. Relevez le défi, puis regardez ce qui a vraiment changé.`;
      },
      leviers: (c) => {
        const k = coutsParProduit(c);
        return [
          {
            code: "cle",
            libelle: "Clé des charges communes",
            unite: "",
            min: CLE_AU_CHIFFRE_D_AFFAIRES,
            max: CLE_AUX_HEURES,
            pas: 1,
            depart: CLE_AUX_HEURES,
            choix: [
              { valeur: CLE_AUX_HEURES, libelle: "Aux heures-machine" },
              { valeur: CLE_AU_CHIFFRE_D_AFFAIRES, libelle: "Au chiffre d'affaires" },
            ],
          },
          { code: "prix", libelle: `Prix de ${k.x.nom}`, unite: "€", ...PRIX_DE_ONE_DU_LABORATOIRE, depart: k.x.prix },
          { code: "heures", libelle: `Heures-machine d'une ${k.x.nom}`, unite: "h", ...HEURES_DE_ONE_DU_LABORATOIRE, depart: k.x.heuresMachineParUnite },
        ];
      },
      lecture: (c, p) => lectureDuLaboratoire(coutsParProduit(c), position(p)),
      // Les résultats ne sont pas des droites selon les heures : la part d'une référence est h ÷ (h + heures des autres).
      graphique: (c) => {
        const k = coutsParProduit(c);
        const res = (p: Readonly<Record<string, number>>, code: string) => gammeA(k.f, position(p)).parReference.find((l) => l.code === code)!.resultat + 0;
        return {
          levier: "heures",
          courbes: [
            { libelle: `Résultat de ${k.fragile.nom}`, valeur: (p) => res(p, k.fragile.code) },
            { libelle: `Résultat de ${k.x.nom}`, valeur: (p) => res(p, k.x.code) },
            { libelle: "Résultat de la gamme", valeur: (p) => gammeA(k.f, position(p)).resultat + 0 },
          ],
        };
      },
      defi: (c) => {
        const k = coutsParProduit(c);
        const perdent = (p: Readonly<Record<string, number>>) => gammeA(k.f, position(p)).parReference.filter((l) => l.resultat <= 0);
        return {
          consigne: "Rendez les trois références bénéficiaires en coût complet.",
          atteint: (p) => perdent(p).length === 0,
          indice: (p) => {
            const ko = perdent(p);
            const qui = ko.map((l) => `${l.nom} (${eur(l.resultat)})`).join(" et ");
            const verbe = ko.length === 1 ? "perd" : "perdent";
            return ko.some((l) => l.code === k.x.code)
              ? `${qui} ${verbe} encore. ${k.x.nom} porte trop de charges communes pour sa marge : jouez sur ce qu'elle porte, ou sur ce qu'elle rapporte.`
              : `${k.x.nom} est bénéficiaire, mais ${qui} ${verbe} : les charges qu'elle ne porte plus sont passées ailleurs. Essayez un autre levier que les heures.`;
          },
          solution: { cle: CLE_AU_CHIFFRE_D_AFFAIRES, prix: k.x.prix, heures: k.x.heuresMachineParUnite },
        };
      },
      explication: (c, p) => {
        const k = coutsParProduit(c);
        const a = gammeA(k.f, position(p));
        const gain = auCentime(a.resultat - k.h.resultat);
        const ms = a.parReference.find((l) => l.code === k.x.code)!.margeSpecifique;
        return [
          `Les trois références sont bénéficiaires : ${a.parReference.map((l) => `${l.nom} ${eur(l.resultat)}`).join(", ")}. ${gain === 0 ? `Le résultat de la gamme, lui, n'a pas bougé : ${eur(a.resultat)}. Rien n'a changé dans l'usine, sinon la façon de partager les charges communes.` : `Le résultat de la gamme passe de ${eur(k.h.resultat)} à ${eur(a.resultat)} : ce gain vient du prix, une vente réelle, pas de la clé.`}`,
          `Aux heures, avec le seul levier des heures de ${k.x.nom}, vous n'y arriviez pas : quand ${k.x.nom} redevient bénéficiaire, les charges qu'elle quitte font basculer ${k.fragile.nom}. Le résultat d'un produit en coût complet est une convention de répartition. Ce qui ne dépend d'aucune convention, c'est sa marge sur coûts spécifiques, ${eur(ms)} ici : c'est elle qui juge l'abandon.`,
        ];
      },
    },
    {
      id: "abandon",
      objectifs: [2],
      type: "choix",
      titre: "Faut-il abandonner la référence en perte ?",
      notions: ["full_unit_cost", "contribution_margin", "fixed_costs"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Retour à la clé des heures. ${k.f.entreprise} arrête ${k.x.nom}, qui fait ${resultatDit(k.x.resultat)} en coût complet. Son coût variable et sa publicité disparaissent avec elle ; le loyer, le personnel, l'entretien et l'usure des lignes restent. Que devient le résultat de la gamme ?`;
      },
      options: (c) => {
        const k = coutsParProduit(c);
        return [
          {
            texte: `Il baisse de ${eur(k.x.margeSpecifique)} : ce qu'elle laisse une fois payées ses seules charges propres`,
            juste: true,
            retour: `C'est cela. ${k.x.nom} paie ses charges propres et laisse ${eur(k.x.margeSpecifique)} pour les charges communes. Sans elle, ces charges retombent sur les autres, et le résultat de la gamme passe de ${eur(k.h.resultat)} à ${eur(k.sansX)}.`,
          },
          {
            texte: `Il monte de ${eur(Math.abs(k.x.resultat))} : sa perte en coût complet disparaît`,
            juste: false,
            retour: `Ce serait vrai si ses ${eur(k.x.imputees)} de charges communes partaient avec elle. Elles restent : le local et l'équipe sont toujours là, et les autres références les portent.`,
          },
          {
            texte: `Il baisse de ${eur(k.x.margeSurCoutVariable)} : sa marge sur coût variable`,
            juste: false,
            retour: `Presque : c'est oublier que sa publicité, ${eur(k.x.publicite)}, part aussi avec elle. Ce que l'abandon fait perdre, c'est la marge une fois payées toutes ses charges propres, ${eur(k.x.margeSpecifique)}.`,
          },
        ];
      },
    },
    {
      id: "marge-specifique",
      objectifs: [2],
      type: "montants",
      titre: "La marge sur coûts spécifiques",
      notions: ["contribution_margin", "fixed_costs"],
      question: () =>
        "Sans formule : calculez ce que chaque référence laisse pour payer les charges communes, une fois payées ses seules charges propres. Puis le résultat de la gamme si l'entreprise arrête la référence en perte.",
      champs: (c) => {
        const k = coutsParProduit(c);
        return [
          ...k.refs.map((l) => ({ libelle: `Marge sur coûts spécifiques : ${l.nom}`, attendu: l.margeSpecifique, calcul: `${eur(l.chiffreDAffaires)} − ${eur(l.direct)} = ${eur(l.margeSpecifique)}` })),
          {
            libelle: `Résultat de la gamme sans ${k.x.nom}`,
            attendu: k.sansX,
            calcul: `${k.refs
              .filter((l) => l.code !== k.x.code)
              .map((l) => eur(l.margeSpecifique))
              .join(" + ")} − ${eur(k.communes)} = ${eur(k.sansX)}, soit ${eur(k.h.resultat)} − ${eur(k.x.margeSpecifique)}`,
          },
        ];
      },
      explication: (c) => {
        const k = coutsParProduit(c);
        return [
          `Tant que sa marge sur coûts spécifiques est positive, une référence aide à payer les charges communes, même quand son coût complet dit qu'elle perd. ${k.x.nom} se garde, ou se retravaille : son prix, sa publicité, ses heures. Sans elle, la gamme perdrait ${eur(-k.sansX)} par mois.`,
        ];
      },
    },
    {
      id: "les-deux-prix-de-one",
      objectifs: [3],
      type: "montants",
      titre: "Les deux prix de la référence, à rebours",
      notions: ["full_unit_cost", "contribution_margin", "price_floor"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Aux heures-machine, retrouvez à rebours le prix de ${k.x.nom}, au centime, qui annulerait son résultat en coût complet, puis celui sous lequel sa marge sur coûts spécifiques deviendrait négative. Enfin, une variante : un concurrent force ${k.x.nom} à ${eur(PRIX_DE_ONE_EN_VARIANTE)}, les quantités restant les mêmes. Quel serait le résultat de la gamme, si l'entreprise la garde ?`;
      },
      champs: (c) => {
        const k = coutsParProduit(c);
        return [
          {
            libelle: `Prix qui annule le résultat de ${k.x.nom}`,
            attendu: k.prixQuiAnnuleLeResultat,
            calcul: `(${eur(k.x.direct)} + ${eur(k.x.imputees)}) ÷ ${qte(k.x.quantite)} = ${eur(k.x.coutComplet)} ÷ ${qte(k.x.quantite)} ≈ ${eur(k.prixQuiAnnuleLeResultat)}`,
          },
          { libelle: `Prix qui annule la marge sur coûts spécifiques de ${k.x.nom}`, attendu: k.prixQuiAnnuleLaMarge, calcul: `${eur(k.x.direct)} ÷ ${qte(k.x.quantite)} ≈ ${eur(k.prixQuiAnnuleLaMarge)}` },
          {
            libelle: `Résultat de la gamme, ${k.x.nom} à ${eur(PRIX_DE_ONE_EN_VARIANTE)}`,
            attendu: k.resultatEnVariante,
            calcul: `${eur(k.h.resultat)} − ${qte(k.x.quantite)} × (${eur(k.x.prix)} − ${eur(PRIX_DE_ONE_EN_VARIANTE)}) = ${eur(k.resultatEnVariante)}`,
          },
        ];
      },
      explication: (c) => {
        const k = coutsParProduit(c);
        return [
          `Entre ${eur(k.prixQuiAnnuleLaMarge)} et ${eur(k.prixQuiAnnuleLeResultat)}, ${k.x.nom} perd en coût complet, et pourtant son abandon coûterait : elle couvre ses charges propres et paie une part des charges communes. Le premier prix est un plancher de court terme (ne rien perdre en la gardant), le second un plancher de long terme (tout payer).`,
          `À ${eur(PRIX_DE_ONE_EN_VARIANTE)}, la gamme ferait ${resultatDit(k.resultatEnVariante)} ; sans ${k.x.nom}, ${resultatDit(k.sansX)}. La garder rapporterait encore ${eur(k.gainAGarderEnVariante)} : il faut refaire le raisonnement, pas appliquer la recette « elle perd, on l'arrête ».`,
        ];
      },
    },
    {
      id: "quelle-reference-sacrifier",
      objectifs: [4],
      type: "choix",
      titre: "Pariez : quelle référence sacrifier",
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const k = coutsParProduit(c);
        return {
          titre: `Le mois de pointe ${dE(k.f.entreprise)}, aux prix du mois`,
          colonnes: k.refs.map((l) => l.nom),
          lignes: [
            { libelle: "Enceintes demandées", valeurs: k.refs.map((l) => qte(l.demandeDuMoisDePointe)) },
            { libelle: "Marge sur coût variable d'une enceinte", valeurs: k.refs.map((l) => eur(l.prix - l.coutVariableUnitaire)) },
            { libelle: "Heures-machine d'une enceinte", valeurs: k.refs.map((l) => `${qte(l.heuresMachineParUnite)} h`) },
          ],
        };
      },
      question: (c) => {
        const k = coutsParProduit(c);
        return `En décembre, les clients demanderaient de quoi occuper ${qte(auCentime(k.plan.heuresDemandees))} heures-machine, pour ${qte(k.plan.capacite)} que les deux lignes donnent dans le mois. Les charges communes ne bougent pas. Il faut renoncer à une partie des ventes : pariez, laquelle sacrifier d'abord ?`;
      },
      options: (c) => {
        const k = coutsParProduit(c);
        const derniere = k.plan.plan.at(-1)!;
        const parUnite = [...k.plan.plan].sort((a, b) => a.margeUnitaire - b.margeUnitaire)[0]!;
        const gourmande = [...k.plan.plan].sort((a, b) => b.heuresMachineParUnite - a.heuresMachineParUnite)[0]!;
        const voir = "Les deux étapes suivantes le chiffrent.";
        return [
          { texte: `${derniere.nom} : elle rapporte le moins par heure-machine`, juste: true, retour: `Bon pari. Quand les heures manquent, c'est l'heure qu'il faut faire rapporter. ${voir}` },
          { texte: `${parUnite.nom} : elle rapporte le moins par enceinte`, juste: false, retour: `Pari à revoir : une enceinte ${parUnite.nom} rapporte peu, mais elle prend peu d'heures. ${voir}` },
          { texte: `${gourmande.nom} : elle demande le plus d'heures par enceinte`, juste: false, retour: `Pari à revoir : ${gourmande.nom} prend beaucoup d'heures, mais chacune lui rapporte beaucoup. ${voir}` },
          { texte: `${k.x.nom} : elle perd en coût complet`, juste: false, retour: `Bonne référence, mauvaise raison : son coût complet dépend de la clé, le laboratoire l'a montré. Avec une autre clé, la même raison désignerait une autre référence. ${voir}` },
        ];
      },
    },
    {
      id: "la-marge-par-heure",
      objectifs: [4],
      type: "montants",
      titre: "La marge par heure-machine",
      notions: ["capacity", "contribution_margin"],
      question: () => "Calculez, pour chaque référence, ce qu'elle rapporte par heure-machine, au centime.",
      champs: (c) =>
        coutsParProduit(c).refs.map((l) => {
          const m = auCentime((l.prix - l.coutVariableUnitaire) / l.heuresMachineParUnite);
          return { libelle: `Marge par heure-machine : ${l.nom}`, attendu: m, calcul: `(${eur(l.prix)} − ${eur(l.coutVariableUnitaire)}) ÷ ${qte(l.heuresMachineParUnite)} h ≈ ${eur(m)}` };
        }),
      explication: (c) => {
        const k = coutsParProduit(c);
        const parEnceinte = [...k.plan.plan].sort((a, b) => b.margeUnitaire - a.margeUnitaire);
        return [
          `Le classement change : par enceinte, ${parEnceinte.map((l) => `${l.nom} ${eur(l.margeUnitaire)}`).join(", ")} ; par heure-machine, ${k.plan.plan.map((l) => `${l.nom} ${eur(auCentime(l.margeParHeure))}`).join(", ")}. Sous contrainte, on sert d'abord la référence qui rapporte le plus par unité du facteur rare.`,
        ];
      },
    },
    {
      id: "le-plan-du-mois-de-pointe",
      objectifs: [4],
      type: "montants",
      titre: "Le programme du mois de pointe",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const k = coutsParProduit(c);
        return `Établissez le programme du mois de pointe : les références dans l'ordre de leur marge par heure-machine, chacune à sa demande tant que les ${qte(k.plan.capacite)} heures le permettent, la dernière avec ce qui reste (à l'enceinte entière). Donnez les heures-machine demandées, les ${k.plan.plan.at(-1)!.nom} produites, la marge sur coût variable du mois, puis celle d'un programme qui classerait les références par marge par enceinte.`;
      },
      champs: (c) => {
        const k = coutsParProduit(c);
        const d = k.plan.plan.at(-1)!;
        const autres = k.plan.plan.slice(0, -1);
        const dn = k.naif.plan.at(-1)!;
        return [
          {
            libelle: "Heures-machine demandées",
            attendu: auCentime(k.plan.heuresDemandees),
            calcul: `${k.refs.map((l) => `${qte(l.demandeDuMoisDePointe)} × ${qte(l.heuresMachineParUnite)}`).join(" + ")} = ${qte(auCentime(k.plan.heuresDemandees))} h`,
          },
          {
            libelle: `${d.nom} produites`,
            attendu: d.quantite,
            calcul: `(${qte(k.plan.capacite)} − ${autres.map((l) => qte(auCentime(l.heures))).join(" − ")}) ÷ ${qte(d.heuresMachineParUnite)}, à l'enceinte inférieure = ${qte(d.quantite)}`,
          },
          { libelle: "Marge du mois de pointe, au meilleur programme", attendu: k.plan.marge, calcul: `${k.plan.plan.map((l) => `${qte(l.quantite)} × ${eur(l.margeUnitaire)}`).join(" + ")} = ${eur(k.plan.marge)}` },
          {
            libelle: "Marge d'un programme classé par marge par enceinte",
            attendu: k.naif.marge,
            calcul: `${k.naif.plan.map((l) => `${qte(l.quantite)} × ${eur(l.margeUnitaire)}`).join(" + ")} = ${eur(k.naif.marge)}, ${dn.nom} n'ayant plus que ${qte(auCentime(k.naif.capacite - k.naif.plan.slice(0, -1).reduce((t, l) => t + l.heures, 0)))} h`,
          },
        ];
      },
      explication: (c) => {
        const k = coutsParProduit(c);
        const d = k.plan.plan.at(-1)!;
        return [
          `Le bon critère rapporte ${eur(k.perteDuMauvaisClassement)} de plus dans le mois, à charges communes égales : ${qte(d.nonServie)} ${d.nom} restent sans réponse, celles qui rapportent le moins par heure. Le coût complet n'a servi à rien ici : sous contrainte, on compare des marges par unité du facteur rare.`,
        ];
      },
    },
    {
      id: "le-classement-en-cout-complet",
      objectifs: [2],
      type: "choix",
      titre: "Ce que vaut le coût complet",
      notions: ["full_unit_cost", "contribution_margin"],
      question: () =>
        "Le dirigeant veut classer chaque mois ses références par leur résultat en coût complet, et pousser les plus rentables. Qu'en dites-vous ?",
      options: (c) => {
        const k = coutsParProduit(c);
        return [
          {
            texte: "Ce classement dépend de la clé : pour décider, il faut des marges",
            juste: true,
            retour: `Oui. Le coût complet sert à fixer un prix de long terme et à vérifier que tout est payé ; il ne dit pas ce qu'une décision change. Pour garder ou arrêter, la marge sur coûts spécifiques ; quand les heures manquent, la marge par heure-machine. Ici, il aurait fait arrêter ${k.x.nom}, qui laisse ${eur(k.x.margeSpecifique)} par mois.`,
          },
          {
            texte: "Il faut d'abord trouver la clé juste, puis classer les références",
            juste: false,
            retour: "Non : aucune clé n'est juste. Les charges communes servent toute la gamme ; les partager reste une convention, et la meilleure clé ne transforme pas un résultat réparti en effet d'une décision.",
          },
          {
            texte: "C'est la bonne méthode : le coût complet compte toutes les charges",
            juste: false,
            retour: "Non : compter toutes les charges dans chaque produit, c'est faire comme si les charges communes partaient avec lui. Elles restent : le local et l'équipe ne suivent pas une référence.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["full_unit_cost", "contribution_margin", "capacity"],
      tableau: (c) => tableauDesDeuxCles(coutsParProduit(c)),
      texte: (c) => {
        const k = coutsParProduit(c);
        return [
          `Le coût complet d'une référence réunit son coût direct et une part des charges communes. Chez ${k.f.entreprise}, la gamme gagne ${eur(k.h.resultat)} par mois quelle que soit la clé ; ${k.x.nom} perd ${eur(-k.x.resultat)} aux heures et gagne ${eur(k.xv.resultat)} au chiffre d'affaires. Son résultat est une convention ; sa marge sur coûts spécifiques, ${eur(k.x.margeSpecifique)}, n'en est pas une, et c'est elle que l'abandon ferait perdre.`,
          `Sous contrainte, on ne classe ni par résultat ni par marge par enceinte, mais par marge par heure-machine : ${eur(k.perteDuMauvaisClassement)} de plus au mois de pointe.`,
          "Au niveau de l'examen, vous savez répartir des charges communes selon une unité d'œuvre et en changer, montrer ce qu'une clé change et ce qu'elle laisse, juger un abandon par la marge sur coûts spécifiques, retrouver à rebours un prix plancher, et établir un programme de production sous un facteur rare.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût complet = coût direct + charges communes au prorata de l'unité d'œuvre. Abandonner un produit : sa marge sur coûts spécifiques (chiffre d'affaires − coûts propres), jamais son résultat en coût complet. Sous un facteur rare : servir d'abord la plus forte marge par unité de ce facteur.",
    },
  ],
};
