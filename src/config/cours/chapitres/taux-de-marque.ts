import { arrondi2 as auCentime, deuxChemins, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import { coutQuiGardeLeTauxDeMarque, fournisseurDe, margeDeLArticle, margeDuMois, margesDeLaGamme, prixHtDuTtc, prixQuiGardeLeTauxDeMarque, referenceDe } from "../monde/boutique";
import { BOUTIQUES_DU_COURS, type CodeDeFournisseur, type FicheDeLaBoutique } from "../monde/maille-et-co";
import { ENQUETE_DU_PRIX, acceptabilite, elasticiteLue } from "../monde/offre-et-prix";
import type { Chapitre, TableauDeDonnees } from "../types";
import { etapesAvant, etapesDepuis, partieDuChapitre } from "./decoupage";

/**
 * CHAPITRE : TAUX DE MARQUE, TAUX DE MARGE, COEFFICIENT (BTS MCO, palier 2 : la porte d'entrée du
 * parcours du point de vente).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique
 * MAILLE & CO a une fiche figée (monde/maille-et-co.ts), le mois de janvier de l'année N, et ses
 * marges se calculent par le modèle du cours (monde/boutique.ts). Une évolution du moteur ne change
 * rien ici. Le chapitre se joue chez MAILLE & CO seule : un seul point de vente, le même d'un
 * chapitre du parcours à l'autre (il se jouait aussi chez PIXEL & CO et LA TABLE D'AUGUSTIN).
 *
 * L'objet : le pull col rond, la référence qui vend le plus. Ce que la boutique achète, ce qu'elle
 * revend, ce qui reste entre les deux (la marge commerciale), et les trois façons de le dire (le
 * taux de marque, le taux de marge, le coefficient, hors taxes et toutes taxes comprises). Puis ce
 * que devient la marge quand le fournisseur change, et le prix face à l'étiquette du concurrent.
 *
 * LA MARGE COMMERCIALE, PAS LA MARGE SUR COÛT VARIABLE. Le chapitre compare le prix de vente au
 * seul prix d'achat, comme le fait le commerce ; les emballages et les frais de carte, qui font
 * la marge sur coût variable, viennent au chapitre du seuil.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais jusqu'au niveau de
 * l'épreuve) :
 *   · guidé : intro, marge-commerciale, les-deux-taux, qui-a-raison, coefficient (la formule est au
 *     repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-l-etiquette
 *     puis l-etiquette-de-l-atelier (un curseur sur l'étiquette toutes taxes comprises, la marge face
 *     à celle que demande le taux de marque) avant le-prix-du-plus-cher ; predire-le-prix-d-achat puis
 *     le-prix-d-achat-au-curseur (le prix d'achat qui garde la marge du mois au prix du concurrent)
 *     avant garder-la-marque-ou-la-marge ;
 *   · autonome : la-marge-de-la-gamme, le-taux-de-la-boutique, d-un-taux-a-l-autre, moins-cher,
 *     le-vrai-prix, le-prix-aligne (ni formule ni chiffres donnés ; le calcul de la correction
 *     montre le chemin) ;
 *   · expert : le-coefficient-du-concurrent (un calcul à rebours, de l'étiquette et du coefficient
 *     toutes taxes comprises au prix d'achat et au taux de marque), garder-la-marque-ou-la-marge (le
 *     prix d'achat qui garde le taux de marque face à celui qui garde la marge du mois, quand les
 *     clients répondent au prix), le-laboratoire-des-prix (le prix et le fournisseur, un levier à
 *     choix, et la marge du mois en courbe) et la-critique-du-taux (le taux de marque n'est qu'un
 *     repère) ; puis la synthèse.
 *
 * LES HYPOTHÈSES DE LA SIMULATION, DITES À L'ÉLÈVE : le prix hors taxes est l'étiquette ÷ 1,2 ; le
 * prix d'achat est celui du façonnier de référence ; la demande du mois répond au prix par une
 * droite (élasticité de la fiche : −1,5) ; le coefficient du concurrent est une hypothèse du cours.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les taux de marque, de marge et d'acceptation, les baisses et
 * les variations se donnent à deux décimales (au dixième, avant) ; le prix qui garde le taux de marque
 * se calcule sur le taux arrondi, comme sur la copie : 30,50 € ÷ (1 − 54,55 %) = 67,11 €, sans le
 * double corrigé « au taux exact » d'avant ; les coefficients multiplicateurs et l'élasticité sont des
 * grandeurs au centième, l'élasticité sur les deux variations arrondies ; les pulls demandés, une
 * quantité, arrondie à l'unité au-dessous comme dans la simulation.
 */

/** Le chapitre se joue chez MAILLE & CO, la boutique du monde du cours, et ses cas aussi. */
export const ENTREPRISES_DU_POINT_DE_VENTE: readonly string[] = ["boutique"];

/**
 * Les entreprises de l'arène qui achètent ce qu'elles vendent, ou ce qu'elles cuisinent. Le chapitre
 * ne s'en sert plus (il se joue chez MAILLE & CO seule) ; d'autres chapitres et cas encore joués dans
 * l'arène l'importent, d'où l'export gardé tel quel.
 */
export const COMMERCES = ["boutique", "ecommerce", "bistrot"] as const;

/** La référence du chapitre : le pull col rond, celle qui vend le plus, et que le concurrent affiche. */
export const REFERENCE_DU_CHAPITRE = "col-rond" as const;

/**
 * LE COEFFICIENT DU CONCURRENT, hypothèse du cours : l'enseigne de la rue applique à ses achats un
 * coefficient multiplicateur toutes taxes comprises de 2,4 (un vendeur passé chez elle l'a dit). Il
 * sert au calcul à rebours : de son étiquette, retrouver ce qu'elle paie le pull et sa marque.
 */
export const COEFFICIENT_TTC_DU_CONCURRENT = 2.4;

/** Les bornes du curseur de l'étiquette, en euros toutes taxes comprises. */
export const ETIQUETTES_DU_CURSEUR = { min: 66, max: 90 } as const;

/** Les bornes du curseur du prix d'achat, en centimes hors taxes. */
export const PRIX_D_ACHAT_DU_CURSEUR = { min: 2_000, max: 2_600 } as const;

/** Le prix de vente hors taxes du laboratoire : ses bornes et son pas, en euros. */
export const PRIX_DU_LABORATOIRE = { min: 45, max: 75, pas: 0.1 } as const;

/**
 * LE DÉFI DU LABORATOIRE, hypothèse du cours : avec l'atelier local, plus cher, retrouver au moins
 * 15 000 € de marge du mois sur le pull col rond. Ni le prix de janvier ni le prix qui garde le
 * taux de marque n'y parviennent : la marge culmine entre les deux.
 */
export const MARGE_VISEE_DU_LABORATOIRE = 15_000;

/** Les fournisseurs du laboratoire, codés par une valeur pour le levier à choix. */
export const FOURNISSEURS_DU_LABORATOIRE: readonly { valeur: number; code: CodeDeFournisseur; libelle: string }[] = [
  { valeur: 1, code: "faconnier", libelle: "Façonnier de référence" },
  { valeur: 2, code: "fins-de-serie", libelle: "Fins de série" },
  { valeur: 3, code: "atelier-local", libelle: "Atelier local" },
];

/**
 * LE LABORATOIRE DE L'ÉTIQUETTE (première partie), hypothèse du cours : le façonnier de référence
 * annonce une hausse de 10 % de son prix d'achat. L'élève déplace le prix d'achat et l'étiquette, et
 * lit le taux de marque, le taux de marge, la marge et le coefficient d'un pull, sans la demande du
 * mois (elle vient à la suite, avec le concurrent). Le défi : la plus petite étiquette ronde qui garde
 * le taux de marque de janvier une fois la hausse passée.
 */
export const HAUSSE_DU_FACONNIER = 0.1;

/** Les leviers du laboratoire de l'étiquette : le prix d'achat HT et l'étiquette TTC, en euros. */
export const LEVIERS_DE_L_ETIQUETTE = { achat: { min: 20, max: 32, pas: 0.5 }, etiquette: { min: 54, max: 96, pas: 1 } } as const;

const qte = nombreAuCentieme;
const coef = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Un prix « au plus » : tronqué au centime, pour ne jamais dépasser la limite. */
const auCentimeInferieur = (x: number) => Math.floor(x * 100 + 1e-6) / 100;

/** La fiche de la boutique du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** La marge du mois du pull col rond à un prix de vente HT et chez un fournisseur du laboratoire. */
export function margeAuPrix(f: FicheDeLaBoutique, prixHt: number, valeurDuFournisseur: number) {
  const fo = FOURNISSEURS_DU_LABORATOIRE.find((x) => x.valeur === valeurDuFournisseur) ?? FOURNISSEURS_DU_LABORATOIRE[0]!;
  const r = referenceDe(f, REFERENCE_DU_CHAPITRE);
  const coutDAchat = auCentime(r.coutDAchat * fournisseurDe(f, fo.code).multiplicateur);
  return { fournisseur: fo, ...margeDuMois(f, { reference: REFERENCE_DU_CHAPITRE, prixHt: auCentime(prixHt), coutDAchat }) };
}

/** Un pull au laboratoire de l'étiquette : l'étiquette TTC ramenée hors taxes, face au prix d'achat choisi. */
export function pullALEtiquette(f: FicheDeLaBoutique, achat: number, etiquette: number) {
  const r = referenceDe(f, REFERENCE_DU_CHAPITRE);
  return margeDeLArticle({ prixHt: prixHtDuTtc(etiquette, r.tauxTva), coutDAchat: auCentime(achat), tauxTva: r.tauxTva });
}

/** Tout ce que le chapitre et son cas demandent sur le pull col rond et la gamme. */
export function margesDuRayon(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const r = referenceDe(f, REFERENCE_DU_CHAPITRE);
  const a = margeDeLArticle(r);
  const faconnier = fournisseurDe(f, "faconnier");
  const finsDeSerie = fournisseurDe(f, "fins-de-serie");
  const atelier = fournisseurDe(f, "atelier-local");
  const margeDuMoisDeJanvier = auCentime(a.margeCommerciale * r.ventesDuMois);
  const tauxDeMarqueExact = a.tauxDeMarque;
  // Le taux de marque de la copie, à deux décimales : c'est lui que l'élève reprend (54,55 %, pas 54,545… %).
  const tMarque = auCentime(a.tauxDeMarque * 100);

  // La gamme : la marge du mois, et l'erreur de la moyenne des taux.
  const g = margesDeLaGamme(f);
  const moyenneDesTaux = g.references.reduce((t, x) => t + x.tauxDeMarque, 0) / g.references.length;
  const echarpe = margeDeLArticle(referenceDe(f, "echarpe"));
  // L'écharpe : le taux de marge et le coefficient se retrouvent depuis le taux de marque arrondi.
  const tMarqueEcharpe = auCentime(echarpe.tauxDeMarque * 100);

  // L'atelier local, plus cher : l'étiquette qui garde le taux de marque.
  const achatAtelier = auCentime(r.coutDAchat * atelier.multiplicateur);
  const prixAtelier = prixQuiGardeLeTauxDeMarque(achatAtelier, tMarque / 100);
  const ttcAtelier = auCentime(prixAtelier * (1 + r.tauxTva));
  // Sur le taux de marque exact (30 ÷ 55), là où se croisent les droites du curseur : l'étiquette est
  // proportionnelle au prix d'achat. Sur le taux arrondi, un centime de plus (audit du 11 novembre 2026, P1-2).
  const prixAtelierExact = auCentime(achatAtelier / (1 - tauxDeMarqueExact));
  const ttcAtelierExact = auCentime((achatAtelier * (1 + r.tauxTva)) / (1 - tauxDeMarqueExact));
  // La plus petite étiquette ronde (en euros TTC) qui garde le taux de marque.
  const etiquetteRondeAtelier = Math.ceil((achatAtelier * (1 + r.tauxTva)) / (1 - tauxDeMarqueExact) - 1e-9);

  // Les fins de série, moins chères, au même prix de vente.
  const achatFins = auCentime(r.coutDAchat * finsDeSerie.multiplicateur);
  const margeFins = margeDeLArticle({ prixHt: r.prixHt, coutDAchat: achatFins, tauxTva: r.tauxTva });

  // Le concurrent : son étiquette, et le calcul à rebours par son coefficient TTC.
  const ttcConcurrent = f.concurrent.prixTtc;
  const htConcurrent = auCentime(ttcConcurrent / (1 + r.tauxTva));
  const achatConcurrent = auCentime(ttcConcurrent / COEFFICIENT_TTC_DU_CONCURRENT);
  const coefHtConcurrent = auCentime(COEFFICIENT_TTC_DU_CONCURRENT / (1 + r.tauxTva));
  const tMarqueConcurrent = auCentime((1 - 1 / coefHtConcurrent) * 100);

  // S'aligner : la demande répond au prix ; le prix d'achat qui garde la marque, et celui qui garde la marge.
  const aligne = margeDuMois(f, { reference: REFERENCE_DU_CHAPITRE, prixHt: htConcurrent });
  const achatQuiGardeLaMarque = coutQuiGardeLeTauxDeMarque(htConcurrent, tMarque / 100);
  const achatQuiGardeLaMarge = auCentimeInferieur(htConcurrent - margeDuMoisDeJanvier / aligne.ventes);
  const ventesQuiGardentLaMarge = Math.ceil(margeDuMoisDeJanvier / aligne.margeCommerciale - 1e-9);

  // Le laboratoire : la position du prix qui donne la plus forte marge du mois, chez chaque fournisseur.
  const grille = Array.from({ length: Math.round((PRIX_DU_LABORATOIRE.max - PRIX_DU_LABORATOIRE.min) / PRIX_DU_LABORATOIRE.pas) + 1 }, (_, i) =>
    auCentime(PRIX_DU_LABORATOIRE.min + i * PRIX_DU_LABORATOIRE.pas),
  );
  const meilleurPrix = (valeur: number) =>
    grille.reduce(
      (m, p) => {
        const x = margeAuPrix(f, p, valeur).margeDuMois;
        return x > m.marge ? { prix: p, marge: x } : m;
      },
      { prix: grille[0]!, marge: -Infinity },
    );
  // Le laboratoire de l'étiquette : le prix d'achat après la hausse du façonnier, et la plus petite
  // étiquette ronde du curseur qui garde le taux de marque de janvier (le hors taxes au centime, comme
  // le lit l'élève).
  const achatEnHausse = auCentime(r.coutDAchat * (1 + HAUSSE_DU_FACONNIER));
  const e = LEVIERS_DE_L_ETIQUETTE.etiquette;
  const etiquettes = Array.from({ length: Math.round((e.max - e.min) / e.pas) + 1 }, (_, i) => e.min + i * e.pas);
  const etiquetteApresHausse = etiquettes.find((p) => pullALEtiquette(f, achatEnHausse, p).tauxDeMarque >= tauxDeMarqueExact - 1e-12) ?? e.max;
  const etiquetteQuiGardeLaMarge = auCentime(r.prixTtc + (achatEnHausse - r.coutDAchat) * (1 + r.tauxTva));
  const auPrixQuiGarde = margeAuPrix(f, prixAtelier, 3);
  const auPrixDeJanvier = margeAuPrix(f, r.prixHt, 3);

  return {
    f,
    r,
    a,
    faconnier,
    finsDeSerie,
    atelier,
    margeDuMoisDeJanvier,
    tauxDeMarqueExact,
    tMarque,
    tMarge: auCentime(a.tauxDeMarge * 100),
    coefHt: auCentime(a.coefficientHt),
    coefTtc: auCentime(a.coefficientTtc),
    gamme: {
      chiffreDAffaires: g.chiffreDAffaires,
      achatsVendus: g.achatsVendus,
      margeCommerciale: g.margeCommerciale,
      tMarque: auCentime(g.tauxDeMarque * 100),
      tMarge: auCentime(g.tauxDeMarge * 100),
      moyenneDesTaux: auCentime(moyenneDesTaux * 100),
      references: g.references,
    },
    echarpe: {
      nom: referenceDe(f, "echarpe").nom,
      tMarque: tMarqueEcharpe,
      tMarge: auCentime((tMarqueEcharpe / (100 - tMarqueEcharpe)) * 100),
      coefHt: auCentime(100 / (100 - tMarqueEcharpe)),
    },
    achatAtelier,
    prixAtelier,
    ttcAtelier,
    prixAtelierExact,
    ttcAtelierExact,
    coefTtcAtelier: auCentime(ttcAtelier / achatAtelier),
    hausseDeLEtiquette: auCentime((ttcAtelierExact / r.prixTtc - 1) * 100),
    etiquetteRondeAtelier,
    achatFins,
    tMarqueFins: auCentime(margeFins.tauxDeMarque * 100),
    margeDuMoisFins: auCentime(margeFins.margeCommerciale * r.ventesDuMois),
    ttcConcurrent,
    htConcurrent,
    achatConcurrent,
    coefHtConcurrent,
    tMarqueConcurrent,
    aligne: {
      demande: aligne.demande,
      demandeCalculee: auCentime(r.demandeDuMois * (1 + f.elasticiteAuPrix * ((htConcurrent - r.prixHt) / r.prixHt))),
      ventes: aligne.ventes,
      tMarque: auCentime(aligne.tauxDeMarque * 100),
      margeUnitaire: aligne.margeCommerciale,
      margeDuMois: aligne.margeDuMois,
      perte: auCentime(margeDuMoisDeJanvier - aligne.margeDuMois),
    },
    achatQuiGardeLaMarque,
    achatQuiGardeLaMarge,
    ventesQuiGardentLaMarge,
    baisseQuiGardeLaMarque: auCentime(((r.coutDAchat - achatQuiGardeLaMarque) / r.coutDAchat) * 100),
    baisseQuiGardeLaMarge: auCentime(((r.coutDAchat - achatQuiGardeLaMarge) / r.coutDAchat) * 100),
    achatEnHausse,
    etiquetteApresHausse,
    etiquetteQuiGardeLaMarge,
    meilleurFaconnier: meilleurPrix(1),
    meilleurAtelier: meilleurPrix(3),
    auPrixQuiGarde,
    auPrixDeJanvier,
  };
}

export type MargesDuRayon = ReturnType<typeof margesDuRayon>;

/** La gamme de janvier : le document de départ. */
export function tableauDeLaGamme(c: Pick<Cas, "code">): TableauDeDonnees {
  const f = ficheDe(c);
  return {
    titre: `La gamme de ${f.entreprise} en ${f.moisDeReference}`,
    colonnes: ["Étiquette TTC", "Prix de vente HT", "Prix d'achat HT", "Articles vendus"],
    lignes: f.gamme.map((r) => ({ libelle: r.nom, valeurs: [eur(r.prixTtc), eur(r.prixHt), eur(r.coutDAchat), qte(r.ventesDuMois)] })),
  };
}

/** Le pull col rond selon le fournisseur : la synthèse. */
function tableauDesFournisseurs(m: MargesDuRayon): TableauDeDonnees {
  return {
    titre: `Le ${m.r.nom.toLowerCase()} selon le fournisseur`,
    colonnes: ["Prix d'achat HT", `Taux de marque à ${eur(m.r.prixHt)} HT`, "Prix HT qui garde le taux de marque"],
    lignes: [
      { libelle: m.faconnier.nom, valeurs: [eur(m.r.coutDAchat), pct(m.tMarque), eur(m.r.prixHt)] },
      { libelle: m.finsDeSerie.nom, valeurs: [eur(m.achatFins), pct(m.tMarqueFins), eur(prixQuiGardeLeTauxDeMarque(m.achatFins, m.tMarque / 100))] },
      { libelle: m.atelier.nom, valeurs: [eur(m.achatAtelier), pct(auCentime(((m.r.prixHt - m.achatAtelier) / m.r.prixHt) * 100)), eur(m.prixAtelier)] },
    ],
  };
}

/** Le chapitre tel qu'il était écrit, en un seul tenant : ses deux parties en sont tirées (plus bas). */
const TAUX_DE_MARQUE_ENTIER: Chapitre = {
  code: "taux-de-marque-et-coefficient",
  parcours: "mco",
  palier: 2,
  blocs: [
    "BTS MCO Bloc 2 · Animer et dynamiser l'offre commerciale",
    "BTS MCO Bloc 3 · Assurer la gestion opérationnelle",
    "Bac pro MCV Bloc 1 · Conseiller et vendre",
    "Bac pro MCV Bloc 4A · Animer et gérer l'espace commercial",
  ],
  titre: "Taux de marque, taux de marge, coefficient",
  accroche:
    "Ce que la boutique achète, ce qu'elle revend, ce qui reste entre les deux, et les trois façons de le dire. Puis l'étiquette qui garde la marque quand le fournisseur change, et le prix d'achat qui garde la marge face au concurrent.",
  objectifs: [
    "Calculer la marge commerciale d'un article, celle du mois et celle de la gamme",
    "Calculer le taux de marque et le taux de marge, et passer de l'un à l'autre",
    "Calculer le coefficient multiplicateur, hors taxes et toutes taxes comprises, et remonter d'une étiquette au prix d'achat",
    "Fixer le prix de vente qui garde le taux de marque quand le fournisseur change",
    "Distinguer le prix d'achat qui garde le taux de marque et celui qui garde la marge du mois face à un concurrent",
    "Expliquer ce qui borne le prix : l'élasticité de la demande, le prix d'acceptabilité et le cadre légal des prix",
  ],
  // Libre : le chapitre libre du BTS MCO
  // (liste validée par le propriétaire, 11 novembre 2026 ; config/cours/chapitres-libres.ts).
  libre: true,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi:
      "ce chapitre se joue dans la boutique du cours, MAILLE & CO, qui achète ses pulls à des façonniers pour les revendre : un seul point de vente, le même d'un chapitre du parcours à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Acheter, revendre",
      notions: ["margin_rates"],
      tableau: tableauDeLaGamme,
      texte: (c) => {
        const m = margesDuRayon(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${m.f.entreprise}, sur le mois de ${m.f.moisDeReference} de l'année N. La boutique vend ${qte(m.f.gamme.length)} références de maille, qu'elle fait tricoter par un façonnier et revend au détail. Le tableau donne, pour chacune, l'étiquette que voit le client, le prix de vente hors taxes, le prix d'achat hors taxes chez le « ${m.faconnier.nom} » et les articles vendus en ${m.f.moisDeReference}.`,
          `La simulation suppose une TVA de ${pct(m.r.tauxTva * 100)} sur tout ce que la boutique vend et achète : le prix hors taxes est l'étiquette divisée par ${coef(1 + m.r.tauxTva)}. Plus loin, quand le prix change, elle suppose aussi que les clients y répondent : un prix plus bas de 1 % fait demander ${pct(-m.f.elasticiteAuPrix)} d'articles de plus, en ligne droite.`,
          `Entre le prix de vente et le prix d'achat, il reste la marge commerciale. C'est elle que le commerçant surveille, référence par référence : elle doit payer le loyer, l'équipe, et laisser un bénéfice. Le chapitre suit surtout le ${m.r.nom.toLowerCase()}, la référence qui vend le plus.`,
        ];
      },
      repere: () => "Marge commerciale = prix de vente HT − prix d'achat HT. Elle se calcule toujours hors taxes : la TVA n'appartient pas au commerçant.",
    },
    {
      id: "marge-commerciale",
      objectifs: [0],
      type: "montants",
      titre: "La marge commerciale",
      notions: ["margin_rates"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `${m.f.entreprise} achète le ${m.r.nom.toLowerCase()} ${eur(m.r.coutDAchat)} HT et le vend ${eur(m.r.prixHt)} HT. En ${m.f.moisDeReference}, elle en a vendu ${qte(m.r.ventesDuMois)}. Calculez la marge commerciale d'un pull (prix de vente HT − prix d'achat HT), puis celle du mois.`;
      },
      champs: (c) => {
        const m = margesDuRayon(c);
        return [
          { libelle: "Marge commerciale d'un pull", attendu: m.a.margeCommerciale, calcul: `${eur(m.r.prixHt)} − ${eur(m.r.coutDAchat)} = ${eur(m.a.margeCommerciale)}` },
          { libelle: "Marge commerciale du mois", attendu: m.margeDuMoisDeJanvier, calcul: `${eur(m.a.margeCommerciale)} × ${qte(m.r.ventesDuMois)} = ${eur(m.margeDuMoisDeJanvier)}` },
        ];
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          `Chaque pull vendu laisse ${eur(m.a.margeCommerciale)} à ${m.f.entreprise} ; le mois, ${eur(m.margeDuMoisDeJanvier)}. Ce montant reviendra tout le chapitre : c'est la marge du mois que la boutique veut garder quand le prix ou le fournisseur changent.`,
        ];
      },
    },
    {
      id: "les-deux-taux",
      objectifs: [1],
      type: "montants",
      titre: "Taux de marque, taux de marge",
      notions: ["margin_rates"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `La marge de ${eur(m.a.margeCommerciale)} se rapporte au prix de vente HT (${eur(m.r.prixHt)} : c'est le taux de marque) ou au prix d'achat HT (${eur(m.r.coutDAchat)} : c'est le taux de marge). Calculez les deux, en pourcentage, à deux décimales.`;
      },
      champs: (c) => {
        const m = margesDuRayon(c);
        return [
          { libelle: "Taux de marque (%)", attendu: m.tMarque, calcul: `${eur(m.a.margeCommerciale)} ÷ ${eur(m.r.prixHt)} × 100 = ${pct(m.tMarque)}` },
          { libelle: "Taux de marge (%)", attendu: m.tMarge, calcul: `${eur(m.a.margeCommerciale)} ÷ ${eur(m.r.coutDAchat)} × 100 = ${pct(m.tMarge)}` },
        ];
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          `La même marge fait ${pct(m.tMarque)} du prix de vente et ${pct(m.tMarge)} du prix d'achat. Le taux de marque est toujours le plus petit des deux : il se rapporte au plus grand des deux prix, et il ne dépasse jamais 100 %.`,
        ];
      },
    },
    {
      id: "qui-a-raison",
      objectifs: [1],
      type: "choix",
      titre: "Deux chiffres pour une marge",
      notions: ["margin_rates"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Au briefing, la responsable annonce : « sur le ${m.r.nom.toLowerCase()}, on marge à ${pct(m.tMarque)} ». Un vendeur la reprend : « non, à ${pct(m.tMarge)} ». Qui a raison ?`;
      },
      options: (c) => {
        const m = margesDuRayon(c);
        return [
          {
            texte: "Les deux : ce sont deux taux différents.",
            juste: true,
            retour: `Exactement. ${pct(m.tMarque)} se rapporte au prix de vente, ${pct(m.tMarge)} au prix d'achat. Dans un magasin, dites toujours de quel taux vous parlez : la distribution raisonne en taux de marque.`,
          },
          {
            texte: "La responsable : le taux de marge ne peut pas dépasser 100 %.",
            juste: false,
            retour: `Le taux de marge dépasse 100 % dès que la marge est plus grande que le prix d'achat. Ici, la marge (${eur(m.a.margeCommerciale)}) se compare à ${eur(m.r.coutDAchat)}.`,
          },
          {
            texte: "Le vendeur : la marge se calcule toujours sur le prix d'achat.",
            juste: false,
            retour: `Elle se calcule sur l'un ou sur l'autre. Rapportée au prix de vente, c'est le taux de marque : ${pct(m.tMarque)}.`,
          },
        ];
      },
    },
    {
      id: "la-marge-de-la-gamme",
      objectifs: [0],
      type: "montants",
      titre: "La marge de la gamme",
      notions: ["margin_rates"],
      tableau: tableauDeLaGamme,
      question: (c) => {
        const m = margesDuRayon(c);
        return `Sans formule cette fois. À partir du tableau de la gamme, calculez le chiffre d'affaires hors taxes de ${m.f.moisDeReference}, ce qu'ont coûté à l'achat les articles vendus, la marge commerciale du mois, puis le taux de marque de la boutique, à deux décimales.`;
      },
      champs: (c) => {
        const m = margesDuRayon(c);
        const refs = m.gamme.references;
        return [
          { libelle: "Chiffre d'affaires HT du mois", attendu: m.gamme.chiffreDAffaires, calcul: `${refs.map((x) => `${qte(x.ventes)} × ${eur(x.prixHt)}`).join(" + ")} = ${eur(m.gamme.chiffreDAffaires)}` },
          { libelle: "Coût d'achat des articles vendus", attendu: m.gamme.achatsVendus, calcul: `${refs.map((x) => `${qte(x.ventes)} × ${eur(x.coutDAchat)}`).join(" + ")} = ${eur(m.gamme.achatsVendus)}` },
          { libelle: "Marge commerciale de la gamme", attendu: m.gamme.margeCommerciale, calcul: `${eur(m.gamme.chiffreDAffaires)} − ${eur(m.gamme.achatsVendus)} = ${eur(m.gamme.margeCommerciale)}` },
          { libelle: "Taux de marque de la boutique (%)", attendu: m.gamme.tMarque, calcul: `${eur(m.gamme.margeCommerciale)} ÷ ${eur(m.gamme.chiffreDAffaires)} × 100 = ${pct(m.gamme.tMarque)}` },
        ];
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          `En ${m.f.moisDeReference}, la gamme a laissé ${eur(m.gamme.margeCommerciale)} de marge commerciale sur ${eur(m.gamme.chiffreDAffaires)} de ventes : un taux de marque de ${pct(m.gamme.tMarque)}. C'est le taux que le tableau de bord de la boutique affiche.`,
        ];
      },
    },
    {
      id: "le-taux-de-la-boutique",
      objectifs: [1],
      type: "choix",
      titre: "Le taux de marque moyen",
      notions: ["margin_rates"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Un stagiaire a calculé le taux de marque de chacune des ${qte(m.gamme.references.length)} références, puis leur moyenne : ${pct(m.gamme.moyenneDesTaux)}. Vous trouvez ${pct(m.gamme.tMarque)}. Quel taux la boutique doit-elle afficher ?`;
      },
      options: (c) => {
        const m = margesDuRayon(c);
        return [
          {
            texte: `${pct(m.gamme.tMarque)} : la marge de la gamme sur ses ventes`,
            juste: true,
            retour: `Oui. Chaque référence pèse selon ce qu'elle vend : le ${m.r.nom.toLowerCase()} fait beaucoup de ventes à ${pct(m.tMarque)}, les petits accessoires marquent plus mais vendent peu. La moyenne des taux donne à chaque référence le même poids, et surestime la marque de la boutique.`,
          },
          {
            texte: `${pct(m.gamme.moyenneDesTaux)} : la moyenne des ${qte(m.gamme.references.length)} taux de marque`,
            juste: false,
            retour: `Non : c'est une moyenne non pondérée. Un bonnet compte autant qu'un ${m.r.nom.toLowerCase()}, alors qu'il pèse bien moins dans les ventes. Le taux de la boutique, c'est sa marge totale sur son chiffre d'affaires total.`,
          },
          {
            texte: `${pct(m.gamme.tMarge)} : la marge de la gamme sur ses achats`,
            juste: false,
            retour: `Non : c'est le taux de marge de la gamme, rapporté au coût d'achat des articles vendus (${eur(m.gamme.achatsVendus)}). Le taux de marque se rapporte aux ventes.`,
          },
        ];
      },
    },
    {
      id: "d-un-taux-a-l-autre",
      objectifs: [1],
      type: "montants",
      titre: "D'un taux à l'autre",
      notions: ["margin_rates", "markup_coefficient"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Le tableau de bord n'affiche que le taux de marque de l'${m.echarpe.nom.toLowerCase()} : ${pct(m.echarpe.tMarque)}. Sans repartir des prix, retrouvez son taux de marge, puis son coefficient multiplicateur hors taxes (par combien multiplier le prix d'achat pour trouver le prix de vente).`;
      },
      champs: (c) => {
        const m = margesDuRayon(c);
        const t = m.echarpe.tMarque;
        return [
          { libelle: "Taux de marge (%)", attendu: m.echarpe.tMarge, calcul: `${pct(t)} ÷ (100 − ${pct(t)}) × 100 = ${pct(m.echarpe.tMarge)}` },
          { libelle: "Coefficient multiplicateur HT", nature: "grandeur", attendu: m.echarpe.coefHt, calcul: `100 ÷ (100 − ${pct(t)}) = ${qte(m.echarpe.coefHt)}` },
        ];
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          `Sur 100 € de ventes, ${pct(m.echarpe.tMarque)} sont de la marge et le reste a payé l'achat : c'est sur ce reste que se calcule le taux de marge, et c'est lui que le coefficient multiplie. Les trois chiffres disent la même chose : taux de marque = 1 − 1 ÷ coefficient HT.`,
        ];
      },
    },
    {
      id: "coefficient",
      objectifs: [2],
      type: "montants",
      titre: "Le coefficient multiplicateur",
      notions: ["markup_coefficient", "vat_payable"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Le coefficient multiplicateur HT est le prix de vente HT divisé par le prix d'achat HT ; le coefficient TTC, l'étiquette TTC divisée par le même prix d'achat HT. Pour le ${m.r.nom.toLowerCase()} (${eur(m.r.coutDAchat)} d'achat, ${eur(m.r.prixHt)} HT), calculez le coefficient HT, l'étiquette TTC (TVA de ${pct(m.r.tauxTva * 100)}), puis le coefficient TTC, au centième.`;
      },
      champs: (c) => {
        const m = margesDuRayon(c);
        return [
          { libelle: "Coefficient HT", nature: "grandeur", attendu: m.coefHt, calcul: `${eur(m.r.prixHt)} ÷ ${eur(m.r.coutDAchat)} = ${qte(m.coefHt)}` },
          { libelle: "Étiquette TTC", attendu: m.r.prixTtc, calcul: `${eur(m.r.prixHt)} × ${coef(1 + m.r.tauxTva)} = ${eur(m.r.prixTtc)}` },
          { libelle: "Coefficient TTC", nature: "grandeur", attendu: m.coefTtc, calcul: `${eur(m.r.prixTtc)} ÷ ${eur(m.r.coutDAchat)} = ${qte(m.coefTtc)} (soit ${coef(m.coefHt)} × ${coef(1 + m.r.tauxTva)})` },
        ];
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          `Multiplier le prix d'achat (${eur(m.r.coutDAchat)} HT) par ${coef(m.coefTtc)} donne directement l'étiquette : ${eur(m.r.prixTtc)} TTC. Le coefficient TTC mélange la marge et la TVA : il vaut le coefficient HT × ${coef(1 + m.r.tauxTva)}, et la part de TVA n'est pas à ${m.f.entreprise}, qui la reverse à l'État.`,
        ];
      },
    },
    {
      id: "predire-l-etiquette",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur l'étiquette",
      notions: ["markup_coefficient", "margin_rates"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Avant de calculer, pariez. L'« ${m.atelier.nom} » vend le même pull ${pct(Math.round((m.atelier.multiplicateur - 1) * 100))} plus cher que le façonnier : ${eur(m.achatAtelier)} HT. Pour garder le taux de marque d'aujourd'hui, ${pct(m.tMarque)}, l'étiquette TTC devra monter…`;
      },
      options: (c) => {
        const m = margesDuRayon(c);
        const hausse = Math.round((m.atelier.multiplicateur - 1) * 100);
        const voir = "Déplacez l'étiquette à l'étape suivante : le curseur montre où la marge rejoint celle que demande le taux de marque.";
        return [
          { texte: `De ${pct(hausse)}, comme le prix d'achat`, juste: Math.abs(m.hausseDeLEtiquette - hausse) < 0.05, retour: `Bon pari. ${voir}` },
          { texte: `De plus de ${pct(hausse)} : la TVA s'ajoute à la hausse`, juste: m.hausseDeLEtiquette > hausse + 0.05, retour: `Pari à vérifier. ${voir}` },
          { texte: `De moins de ${pct(hausse)} : seul l'achat a augmenté`, juste: m.hausseDeLEtiquette < hausse - 0.05, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-etiquette-de-l-atelier",
      objectifs: [3],
      type: "curseur",
      titre: "Déplacez l'étiquette",
      notions: ["markup_coefficient", "margin_rates", "vat_payable"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Le pull de l'atelier local coûte ${eur(m.achatAtelier)} HT. Déplacez son étiquette, en euros ronds TTC, de ${eur(ETIQUETTES_DU_CURSEUR.min)} à ${eur(ETIQUETTES_DU_CURSEUR.max)}. Une droite donne la marge commerciale de l'étiquette (son prix hors taxes moins l'achat), l'autre la marge que demande le taux de marque d'aujourd'hui. Placez le curseur sur la plus petite étiquette qui garde ce taux, puis validez.`;
      },
      grandeur: () => ({ libelle: "Étiquette du pull, toutes taxes comprises", unite: "€" }),
      cible: (c) => ({ attendu: margesDuRayon(c).etiquetteRondeAtelier, min: ETIQUETTES_DU_CURSEUR.min, max: ETIQUETTES_DU_CURSEUR.max }),
      zones: ["Le taux de marque est gardé", "Le taux de marque baisse"],
      rates: () => ({
        dessous: "À cette étiquette, la marge ne fait pas le taux de marque d'aujourd'hui : il faut monter.",
        dessus: "Plus bas, le taux de marque est encore gardé : cherchez la plus petite étiquette.",
      }),
      montrer: "Montrer l'étiquette",
      lecture: (c, p) => {
        const m = margesDuRayon(c);
        const ht = p / (1 + m.r.tauxTva);
        return [
          { libelle: "Prix de vente hors taxes", montant: auCentime(ht) },
          { libelle: "Prix d'achat chez l'atelier local", montant: m.achatAtelier },
          { libelle: "Marge commerciale d'un pull", montant: auCentime(ht - m.achatAtelier), fort: true },
          { libelle: "Marge que demande le taux de marque d'aujourd'hui", montant: auCentime(ht * m.tauxDeMarqueExact) },
        ];
      },
      droites: (c) => {
        const m = margesDuRayon(c);
        return {
          produit: (p) => p / (1 + m.r.tauxTva) - m.achatAtelier,
          cout: (p) => (p / (1 + m.r.tauxTva)) * m.tauxDeMarqueExact,
          libelles: ["Marge commerciale de l'étiquette", "Marge que demande le taux de marque"],
        };
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        // Le taux de l'étape suivante est arrondi à deux décimales : son étiquette peut y gagner un centime.
        const ecart = auCentime(m.ttcAtelier - m.ttcAtelierExact);
        return [
          `Les deux droites se croisent à ${eur(m.ttcAtelierExact)} TTC, soit ${eur(m.prixAtelierExact)} HT : l'étiquette ronde qui garde le taux de marque est donc ${eur(m.etiquetteRondeAtelier)}. De ${eur(m.r.prixTtc)} à ${eur(m.ttcAtelierExact)}, l'étiquette monte de ${pct(m.hausseDeLEtiquette)}, exactement comme le prix d'achat : à taux de marque constant, le prix de vente est proportionnel au prix d'achat.`,
          `Le coefficient ne change pas : ${eur(m.achatAtelier)} × ${coef(m.coefTtc)} = ${eur(m.ttcAtelierExact)}. C'est la formule que l'étape suivante fait calculer${
            ecart === 0
              ? "."
              : `, sur le taux de marque arrondi à ${pct(m.tMarque)} : elle trouve ${eur(m.ttcAtelier)}, ${Math.abs(ecart) === 0.01 ? "un centime" : eur(Math.abs(ecart))} de ${ecart > 0 ? "plus" : "moins"}. L'écart vient de l'arrondi du taux, pas de la règle.`
          }`,
        ];
      },
    },
    {
      id: "le-prix-du-plus-cher",
      objectifs: [3],
      type: "montants",
      titre: "Garder le taux de marque",
      notions: ["margin_rates", "markup_coefficient"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Le prix de vente qui garde un taux de marque, c'est le prix d'achat ÷ (1 − taux de marque). Avec l'atelier local, ${pct(Math.round((m.atelier.multiplicateur - 1) * 100))} plus cher que les ${eur(m.r.coutDAchat)} du façonnier, calculez le prix d'achat, le prix de vente HT qui garde ${pct(m.tMarque)} de marque, puis l'étiquette TTC et le coefficient TTC.`;
      },
      champs: (c) => {
        const m = margesDuRayon(c);
        return [
          { libelle: "Prix d'achat chez l'atelier local", attendu: m.achatAtelier, calcul: `${eur(m.r.coutDAchat)} × ${coef(m.atelier.multiplicateur)} = ${eur(m.achatAtelier)}` },
          {
            libelle: "Prix de vente HT qui garde le taux de marque",
            attendu: m.prixAtelier,
            calcul: `${eur(m.achatAtelier)} ÷ (1 − ${pct(m.tMarque)}) = ${eur(m.prixAtelier)}, sur le taux à deux décimales`,
          },
          {
            libelle: "Étiquette TTC",
            attendu: m.ttcAtelier,
            calcul: `${eur(m.prixAtelier)} × ${coef(1 + m.r.tauxTva)} = ${eur(m.ttcAtelier)}`,
          },
          { libelle: "Coefficient TTC de l'atelier local", nature: "grandeur", attendu: m.coefTtcAtelier, calcul: `${eur(m.ttcAtelier)} ÷ ${eur(m.achatAtelier)} = ${qte(m.coefTtcAtelier)}` },
        ];
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          `Pour garder ${pct(m.tMarque)} de marque, le prix de vente passe de ${eur(m.r.prixHt)} à ${eur(m.prixAtelier)} HT, ${eur(m.ttcAtelier)} sur l'étiquette, et le coefficient TTC reste ${coef(m.coefTtcAtelier)}. Garder le taux de marque, c'est garder le coefficient. Reste à savoir si le client suivra : un fournisseur plus cher doit apporter quelque chose que le client paie.`,
        ];
      },
    },
    {
      id: "moins-cher",
      objectifs: [3],
      type: "montants",
      titre: "Un fournisseur moins cher",
      notions: ["margin_rates"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Les « ${m.finsDeSerie.nom} » vendent le même pull ${pct(Math.round((1 - m.finsDeSerie.multiplicateur) * 100))} moins cher que le façonnier. ${m.f.entreprise} garde son étiquette et ses ${qte(m.r.ventesDuMois)} ventes du mois. Calculez le prix d'achat, le taux de marque, à deux décimales, et la marge commerciale du mois.`;
      },
      champs: (c) => {
        const m = margesDuRayon(c);
        return [
          { libelle: "Prix d'achat des fins de série", attendu: m.achatFins, calcul: `${eur(m.r.coutDAchat)} × ${coef(m.finsDeSerie.multiplicateur)} = ${eur(m.achatFins)}` },
          { libelle: "Taux de marque (%)", attendu: m.tMarqueFins, calcul: `(${eur(m.r.prixHt)} − ${eur(m.achatFins)}) ÷ ${eur(m.r.prixHt)} × 100 = ${pct(m.tMarqueFins)}` },
          { libelle: "Marge commerciale du mois", attendu: m.margeDuMoisFins, calcul: `(${eur(m.r.prixHt)} − ${eur(m.achatFins)}) × ${qte(m.r.ventesDuMois)} = ${eur(m.margeDuMoisFins)}` },
        ];
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          `Le taux de marque passe de ${pct(m.tMarque)} à ${pct(m.tMarqueFins)}, et la marge du mois de ${eur(m.margeDuMoisDeJanvier)} à ${eur(m.margeDuMoisFins)}, sans toucher à l'étiquette. C'est le premier levier du commerçant : acheter mieux.`,
        ];
      },
    },
    {
      id: "le-vrai-prix",
      objectifs: [3],
      type: "choix",
      titre: "Ce que coûte le moins cher",
      notions: ["payment_terms", "margin_rates", "stock"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Les « ${m.finsDeSerie.nom} » se paient comptant, par lots de ${qte(m.finsDeSerie.minimumDeCommande)} articles, sans réassort ; le « ${m.faconnier.nom} » se paie à ${qte(m.faconnier.delaiDePaiement)} jours et réassortit. Le taux de marque monte avec le moins cher : qu'est-ce qui doit pourtant faire hésiter ?`;
      },
      options: (c) => {
        const m = margesDuRayon(c);
        return [
          {
            texte: "Payer plus tôt et ne pas pouvoir réassortir",
            juste: true,
            retour: `Oui. Avec les fins de série, ${m.f.entreprise} paie ${qte(m.faconnier.delaiDePaiement - m.finsDeSerie.delaiDePaiement)} jours plus tôt : elle finance ses achats avant que les clients ne les paient. Et sans réassort, une rupture en pleine saison ne se rattrape pas. Un meilleur taux de marque peut se payer en découvert et en ventes manquées.`,
          },
          {
            texte: "Rien : un taux de marque plus haut est toujours meilleur",
            juste: false,
            retour: "Le taux de marque ne dit rien du moment où l'on paie, ni de la disponibilité de l'article. Un commerçant compare aussi les délais, le réassort et la qualité.",
          },
          {
            texte: "La TVA, plus élevée chez un fournisseur moins cher",
            juste: false,
            retour: "Le taux de TVA dépend de ce qui est vendu, pas du fournisseur. Et la TVA payée sur les achats se récupère.",
          },
        ];
      },
    },
    {
      id: "le-coefficient-du-concurrent",
      objectifs: [2],
      type: "montants",
      titre: "Le coefficient du concurrent, à rebours",
      notions: ["markup_coefficient", "vat_payable", "margin_rates"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `${m.f.concurrent.nom.charAt(0).toUpperCase()}${m.f.concurrent.nom.slice(1)} affiche un pull comparable à ${eur(m.ttcConcurrent)} TTC. Un vendeur passé chez elle rapporte qu'elle applique un coefficient de ${coef(COEFFICIENT_TTC_DU_CONCURRENT)} toutes taxes comprises. Remontez de son étiquette : son prix d'achat HT, son coefficient HT, puis son taux de marque, à deux décimales.`;
      },
      champs: (c) => {
        const m = margesDuRayon(c);
        return [
          { libelle: "Prix d'achat du concurrent, hors taxes", attendu: m.achatConcurrent, calcul: `${eur(m.ttcConcurrent)} ÷ ${coef(COEFFICIENT_TTC_DU_CONCURRENT)} = ${eur(m.achatConcurrent)}` },
          { libelle: "Coefficient HT du concurrent", nature: "grandeur", attendu: m.coefHtConcurrent, calcul: `${coef(COEFFICIENT_TTC_DU_CONCURRENT)} ÷ ${coef(1 + m.r.tauxTva)} = ${qte(m.coefHtConcurrent)}` },
          { libelle: "Taux de marque du concurrent (%)", attendu: m.tMarqueConcurrent, calcul: `(1 − 1 ÷ ${coef(m.coefHtConcurrent)}) × 100 = ${pct(m.tMarqueConcurrent)}` },
        ];
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          m.achatConcurrent === m.r.coutDAchat
            ? `Le concurrent achète son pull ${eur(m.achatConcurrent)}, comme ${m.f.entreprise} chez le façonnier : il n'achète pas mieux, il accepte de marquer moins, ${pct(m.tMarqueConcurrent)} au lieu de ${pct(m.tMarque)}. Pour remonter d'un coefficient TTC, on retire d'abord la TVA : le coefficient HT est le coefficient TTC ÷ ${coef(1 + m.r.tauxTva)}.`
            : `Le concurrent achète son pull ${eur(m.achatConcurrent)}, contre ${eur(m.r.coutDAchat)} pour ${m.f.entreprise}, et marque ${pct(m.tMarqueConcurrent)}. Pour remonter d'un coefficient TTC, on retire d'abord la TVA : le coefficient HT est le coefficient TTC ÷ ${coef(1 + m.r.tauxTva)}.`,
        ];
      },
    },
    {
      id: "le-prix-aligne",
      objectifs: [4],
      type: "montants",
      titre: "S'aligner sur le concurrent",
      notions: ["margin_rates", "price_elasticity", "vat_payable"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Et si ${m.f.entreprise} s'alignait sur l'étiquette du concurrent, sans changer de fournisseur ? La simulation fait répondre les clients au prix : demande = ${qte(m.r.demandeDuMois)} × (1 − ${qte(-m.f.elasticiteAuPrix)} × écart de prix ÷ prix d'aujourd'hui), à l'article près en dessous. Calculez le prix aligné hors taxes, les pulls demandés, le taux de marque, à deux décimales, et la marge commerciale du mois.`;
      },
      champs: (c) => {
        const m = margesDuRayon(c);
        return [
          { libelle: "Prix aligné, hors taxes", attendu: m.htConcurrent, calcul: `${eur(m.ttcConcurrent)} ÷ ${coef(1 + m.r.tauxTva)} = ${eur(m.htConcurrent)}` },
          {
            libelle: "Pulls demandés au prix aligné",
            nature: "quantite",
            attendu: m.aligne.demande,
            calcul: `${qte(m.r.demandeDuMois)} × (1 − ${qte(-m.f.elasticiteAuPrix)} × (${eur(m.htConcurrent)} − ${eur(m.r.prixHt)}) ÷ ${eur(m.r.prixHt)}) = ${qte(m.aligne.demandeCalculee)}, soit ${qte(m.aligne.demande)} pulls à l'unité au-dessous : la simulation ne compte que des clientes entières`,
          },
          { libelle: "Taux de marque au prix aligné (%)", attendu: m.aligne.tMarque, calcul: `(${eur(m.htConcurrent)} − ${eur(m.r.coutDAchat)}) ÷ ${eur(m.htConcurrent)} × 100 = ${pct(m.aligne.tMarque)}` },
          { libelle: "Marge commerciale du mois, alignée", attendu: m.aligne.margeDuMois, calcul: `(${eur(m.htConcurrent)} − ${eur(m.r.coutDAchat)}) × ${qte(m.aligne.ventes)} = ${eur(m.aligne.margeDuMois)}` },
        ];
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          `Aligné, le pull se vend ${qte(m.aligne.ventes)} fois au lieu de ${qte(m.r.ventesDuMois)}, mais chacun ne laisse plus que ${eur(m.aligne.margeUnitaire)} : la marge du mois tombe de ${eur(m.margeDuMoisDeJanvier)} à ${eur(m.aligne.margeDuMois)}, ${eur(m.aligne.perte)} de moins. Les ventes en plus ne rattrapent pas la marge perdue sur chaque pull. Il faudrait acheter moins cher : mais de combien ?`,
        ];
      },
    },
    {
      id: "predire-le-prix-d-achat",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur le prix d'achat",
      notions: ["margin_rates", "price_elasticity"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Pariez encore. Pour s'aligner à ${eur(m.htConcurrent)} HT sans perdre de marge du mois (${eur(m.margeDuMoisDeJanvier)}), le prix d'achat du façonnier devra baisser…`;
      },
      options: (c) => {
        const m = margesDuRayon(c);
        const voir = "Faites varier le prix d'achat à l'étape suivante : le curseur montre la limite.";
        return [
          { texte: "Moins que pour garder le taux de marque : le prix bas fait vendre plus", juste: m.achatQuiGardeLaMarge > m.achatQuiGardeLaMarque, retour: `Bon pari. ${voir}` },
          { texte: "Autant que pour garder le taux de marque : la marge suit le taux", juste: m.achatQuiGardeLaMarge === m.achatQuiGardeLaMarque, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus que pour garder le taux de marque : la TVA pèse sur le prix aligné", juste: m.achatQuiGardeLaMarge < m.achatQuiGardeLaMarque, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-prix-d-achat-au-curseur",
      objectifs: [4],
      type: "curseur",
      titre: "Le prix d'achat qui garde la marge",
      notions: ["margin_rates", "price_elasticity"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Au prix aligné, ${eur(m.htConcurrent)} HT, la boutique vend ${qte(m.aligne.ventes)} pulls. Faites varier le prix d'achat négocié, en centimes, de ${qte(PRIX_D_ACHAT_DU_CURSEUR.min)} à ${qte(PRIX_D_ACHAT_DU_CURSEUR.max)}. Jusqu'où peut-il monter sans que la marge du mois tombe sous celle de ${m.f.moisDeReference}, ${eur(m.margeDuMoisDeJanvier)} ? Placez le curseur sur le plus haut prix d'achat, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix d'achat d'un pull, hors taxes", unite: "centimes" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: Math.round(margesDuRayon(c).achatQuiGardeLaMarge * 100), min: PRIX_D_ACHAT_DU_CURSEUR.min, max: PRIX_D_ACHAT_DU_CURSEUR.max }),
      zones: ["La marge du mois est gardée", "La marge du mois baisse"],
      rates: () => ({
        dessous: "La marge est encore gardée à un prix d'achat plus haut : cherchez le plus haut.",
        dessus: "À ce prix d'achat, la marge du mois tombe sous celle de janvier.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, a) => {
        const m = margesDuRayon(c);
        const unitaire = auCentime(m.htConcurrent - a / 100);
        return [
          { libelle: "Prix d'achat négocié", montant: a / 100 },
          { libelle: "Marge commerciale d'un pull", montant: unitaire },
          { libelle: "Marge commerciale du mois, alignée", montant: auCentime(unitaire * m.aligne.ventes), fort: true },
          { libelle: "Marge commerciale de janvier", montant: m.margeDuMoisDeJanvier },
        ];
      },
      droites: (c) => {
        const m = margesDuRayon(c);
        return {
          produit: (a) => m.aligne.ventes * (m.htConcurrent - a / 100),
          cout: () => m.margeDuMoisDeJanvier,
          libelles: ["Marge du mois au prix aligné", "Marge du mois de janvier"],
        };
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          `La limite est à ${eur(m.achatQuiGardeLaMarge)} : au-dessus, ${qte(m.aligne.ventes)} pulls ne refont plus ${eur(m.margeDuMoisDeJanvier)}. Pour garder le taux de marque, il aurait fallu descendre à ${eur(m.achatQuiGardeLaMarque)}.`,
          "Les deux objectifs ne coïncident pas dès que les clients répondent au prix : à prix plus bas, la boutique vend plus, et chaque pull peut marquer un peu moins. L'étape suivante chiffre l'écart.",
        ];
      },
    },
    {
      id: "garder-la-marque-ou-la-marge",
      objectifs: [4],
      type: "montants",
      titre: "Garder la marque ou garder la marge",
      notions: ["margin_rates", "price_elasticity"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Au prix aligné de ${eur(m.htConcurrent)} HT, calculez le prix d'achat le plus haut qui garde le taux de marque d'aujourd'hui (${pct(m.tMarque)}), puis celui qui garde la marge du mois de ${m.f.moisDeReference} (${eur(m.margeDuMoisDeJanvier)}) avec les ventes alignées, au centime inférieur, et la baisse à obtenir du façonnier dans chaque cas, en pourcentage, à deux décimales.`;
      },
      champs: (c) => {
        const m = margesDuRayon(c);
        return [
          { libelle: "Prix d'achat qui garde le taux de marque", attendu: m.achatQuiGardeLaMarque, calcul: `${eur(m.htConcurrent)} × (1 − ${pct(m.tMarque)}) = ${eur(m.achatQuiGardeLaMarque)}` },
          {
            libelle: "Prix d'achat qui garde la marge du mois",
            attendu: m.achatQuiGardeLaMarge,
            calcul: `${eur(m.htConcurrent)} − ${eur(m.margeDuMoisDeJanvier)} ÷ ${qte(m.aligne.ventes)} = ${eur(m.achatQuiGardeLaMarge)}, au centime inférieur`,
          },
          // L'autre chemin : les prix d'achat gardés avec tous leurs chiffres, l'arrondi à la fin.
          {
            libelle: "Baisse qui garde le taux de marque (%)",
            ...deuxChemins(m.baisseQuiGardeLaMarque, ((m.r.coutDAchat - m.htConcurrent * (1 - m.tMarque / 100)) / m.r.coutDAchat) * 100),
            calcul: `(${eur(m.r.coutDAchat)} − ${eur(m.achatQuiGardeLaMarque)}) ÷ ${eur(m.r.coutDAchat)} × 100 = ${pct(m.baisseQuiGardeLaMarque)}`,
          },
          {
            libelle: "Baisse qui garde la marge du mois (%)",
            ...deuxChemins(m.baisseQuiGardeLaMarge, ((m.r.coutDAchat - (m.htConcurrent - m.margeDuMoisDeJanvier / m.aligne.ventes)) / m.r.coutDAchat) * 100),
            calcul: `(${eur(m.r.coutDAchat)} − ${eur(m.achatQuiGardeLaMarge)}) ÷ ${eur(m.r.coutDAchat)} × 100 = ${pct(m.baisseQuiGardeLaMarge)}`,
          },
        ];
      },
      explication: (c) => {
        const m = margesDuRayon(c);
        return [
          `Garder le taux de marque demande ${pct(m.baisseQuiGardeLaMarque)} de baisse, la même que celle du prix de vente : à taux constant, achat et vente bougent ensemble. Garder la marge du mois n'en demande que ${pct(m.baisseQuiGardeLaMarge)}, parce que la boutique vend ${qte(m.aligne.ventes - m.r.ventesDuMois)} pulls de plus.`,
          `En négociation, la limite utile est celle de la marge, ${eur(m.achatQuiGardeLaMarge)} : c'est elle qui paie le loyer et l'équipe. Mais elle repose sur la réponse des clients au prix, une hypothèse : si les ventes montaient moins, il faudrait acheter plus bas.`,
        ];
      },
    },
    {
      id: "le-laboratoire-des-prix",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire des prix",
      notions: ["margin_rates", "price_elasticity", "markup_coefficient"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `Choisissez le fournisseur du ${m.r.nom.toLowerCase()} et faites varier son prix de vente hors taxes : les clients répondent au prix, le tableau suit la demande, le taux de marque et la marge du mois, et la courbe montre la marge du mois selon le prix. Relevez le défi, puis comparez avec le prix qui garde le taux de marque, ${eur(m.prixAtelier)}.`;
      },
      leviers: (c) => {
        const m = margesDuRayon(c);
        return [
          { code: "prix", libelle: "Prix de vente hors taxes", unite: "€", min: PRIX_DU_LABORATOIRE.min, max: PRIX_DU_LABORATOIRE.max, pas: PRIX_DU_LABORATOIRE.pas, depart: m.r.prixHt },
          {
            code: "fournisseur",
            libelle: "Fournisseur",
            unite: "",
            min: FOURNISSEURS_DU_LABORATOIRE[0]!.valeur,
            max: FOURNISSEURS_DU_LABORATOIRE.at(-1)!.valeur,
            pas: 1,
            depart: FOURNISSEURS_DU_LABORATOIRE[0]!.valeur,
            choix: FOURNISSEURS_DU_LABORATOIRE.map((x) => ({ valeur: x.valeur, libelle: x.libelle })),
          },
        ];
      },
      lecture: (c, p) => {
        const m = margesDuRayon(c);
        const x = margeAuPrix(m.f, p.prix!, p.fournisseur!);
        const d = margeAuPrix(m.f, m.r.prixHt, FOURNISSEURS_DU_LABORATOIRE[0]!.valeur);
        return [
          { libelle: "Prix d'achat d'un pull", montant: x.coutDAchat, reference: d.coutDAchat },
          { libelle: "Pulls demandés dans le mois", montant: x.demande, reference: d.demande, unite: "articles" },
          { libelle: "Taux de marque", montant: auCentime(x.tauxDeMarque * 100), reference: auCentime(d.tauxDeMarque * 100), unite: "%" },
          { libelle: "Marge commerciale d'un pull", montant: x.margeCommerciale, reference: d.margeCommerciale },
          { libelle: "Marge commerciale du mois", montant: x.margeDuMois, reference: d.margeDuMois },
          { libelle: "Marge du mois gagnée sur janvier", montant: auCentime(x.margeDuMois - m.margeDuMoisDeJanvier), reference: 0, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const m = margesDuRayon(c);
        return {
          levier: "prix",
          courbes: [
            { libelle: "Marge du mois au prix choisi", valeur: (p) => margeAuPrix(m.f, p.prix!, p.fournisseur!).margeDuMois },
            { libelle: "Marge du mois de janvier", valeur: () => m.margeDuMoisDeJanvier },
          ],
        };
      },
      defi: (c) => {
        const m = margesDuRayon(c);
        const atelier = FOURNISSEURS_DU_LABORATOIRE.find((x) => x.code === "atelier-local")!.valeur;
        return {
          consigne: `Avec l'atelier local, faites au moins ${eur(MARGE_VISEE_DU_LABORATOIRE)} de marge du mois.`,
          atteint: (p) => p.fournisseur === atelier && margeAuPrix(m.f, p.prix!, p.fournisseur).margeDuMois >= MARGE_VISEE_DU_LABORATOIRE,
          indice: (p) => {
            if (p.fournisseur !== atelier) return "Choisissez d'abord l'atelier local : le défi porte sur le fournisseur le plus cher.";
            const x = margeAuPrix(m.f, p.prix!, p.fournisseur);
            return p.prix! > m.meilleurAtelier.prix
              ? `À ${eur(p.prix!)}, chaque pull marque bien, mais seuls ${qte(x.demande)} se vendent : ${eur(x.margeDuMois)}. Les clients perdus coûtent plus que la marge gagnée : baissez le prix.`
              : `À ${eur(p.prix!)}, ${qte(x.demande)} pulls se vendent, mais chacun ne laisse que ${eur(x.margeCommerciale)} : ${eur(x.margeDuMois)}. Montez le prix.`;
          },
          solution: { prix: m.meilleurAtelier.prix, fournisseur: atelier },
        };
      },
      explication: (c, p) => {
        const m = margesDuRayon(c);
        const x = margeAuPrix(m.f, p.prix!, p.fournisseur!);
        return [
          `À ${eur(p.prix!)}, l'atelier local laisse ${eur(x.margeDuMois)} de marge du mois, avec un taux de marque de ${pct(auCentime(x.tauxDeMarque * 100))}. Au prix de janvier, ${eur(m.r.prixHt)}, il n'en laissait que ${eur(m.auPrixDeJanvier.margeDuMois)} ; au prix qui garde le taux de marque, ${eur(m.prixAtelier)}, ${eur(m.auPrixQuiGarde.margeDuMois)}, car seuls ${qte(m.auPrixQuiGarde.demande)} pulls se vendent. La marge du mois culmine entre les deux, vers ${eur(m.meilleurAtelier.prix)}.`,
          `La courbe n'est pas une droite : à prix plus haut, chaque pull marque plus, mais il s'en vend moins. Avec le façonnier, elle culmine vers ${eur(m.meilleurFaconnier.prix)}, à ${eur(m.meilleurFaconnier.marge)}. Le taux de marque est un repère du rayon ; ce que la boutique encaisse, c'est la marge du mois.`,
        ];
      },
    },
    {
      id: "l-elasticite-lue",
      objectifs: [5],
      type: "montants",
      titre: "L'élasticité, lue sur deux prix",
      notions: ["price_elasticity"],
      question: (c) => {
        const e = elasticiteLue(ficheDe(c));
        return `Au prix de l'étiquette (${eur(e.r.prixHt)} hors taxes), les clientes demandent ${qte(e.r.demandeDuMois)} pulls col rond ; au prix du concurrent (${eur(e.prixHtDuConcurrent)}), la simulation en fait demander ${qte(e.demandeAuPrix)}. Calculez la variation du prix et celle de la demande, en pourcentage à deux décimales (négative si elle baisse), puis le coefficient d'élasticité de la demande au prix, au centième (négatif s'il est de signe contraire).`;
      },
      champs: (c) => {
        const e = elasticiteLue(ficheDe(c));
        const vp = auCentime(e.variationDuPrix * 100);
        const vd = auCentime(e.variationDeLaDemande * 100);
        return [
          { libelle: "Variation du prix (%)", attendu: vp, calcul: `(${eur(e.prixHtDuConcurrent)} − ${eur(e.r.prixHt)}) ÷ ${eur(e.r.prixHt)} × 100 = ${pct(vp)}` },
          { libelle: "Variation de la demande (%)", attendu: vd, calcul: `(${qte(e.demandeAuPrix)} − ${qte(e.r.demandeDuMois)}) ÷ ${qte(e.r.demandeDuMois)} × 100 = ${pct(vd)}` },
          { libelle: "Coefficient d'élasticité", nature: "grandeur", attendu: auCentime(vd / vp), calcul: `${pct(vd)} ÷ ${pct(vp)} = ${qte(auCentime(vd / vp))}` },
        ];
      },
      explication: (c) => {
        const e = elasticiteLue(ficheDe(c));
        return [
          `Une baisse de prix de 1 % fait demander environ ${qte(Math.round(-e.elasticite * 10) / 10)} % de pulls en plus : la demande est élastique (le coefficient dépasse 1 en valeur absolue). La simulation suppose ${qte(ficheDe(c).elasticiteAuPrix)} ; l'arrondi des pulls à l'unité donne ${qte(auCentime(e.elasticite))}. Plus la demande est élastique, plus un écart de prix avec le concurrent pèse sur les ventes.`,
        ];
      },
    },
    {
      id: "le-prix-d-acceptabilite",
      objectifs: [5],
      type: "montants",
      titre: "Le prix d'acceptabilité",
      notions: ["psych_price", "price_elasticity"],
      tableau: () => ({
        titre: "L'enquête à la porte : le pull col rond à cinq étiquettes",
        colonnes: ["Trop cher", "Trop bon marché"],
        lignes: ENQUETE_DU_PRIX.map((l) => ({ libelle: `${eur(l.prixTtc)} toutes taxes comprises`, valeurs: [pct(l.tropCher * 100), pct(l.tropBonMarche * 100)] })),
      }),
      question: () =>
        "La boutique a demandé à des clientes, pour cinq étiquettes, si elles trouveraient le pull trop cher (elles n'achètent pas) ou trop bon marché (elles doutent de la qualité). Calculez le taux d'acceptation à l'étiquette actuelle et au prix du concurrent : la part qui ne le trouve ni trop cher, ni trop bon marché, en pourcentage.",
      champs: (c) => {
        const f = ficheDe(c);
        const a = acceptabilite();
        const de = (p: number) => a.lignes.find((l) => l.prixTtc === p)!;
        return [f.gamme[0]!.prixTtc, f.concurrent.prixTtc].map((p) => {
          const l = de(p);
          const t = auCentime(l.acceptation * 100);
          return { libelle: `Taux d'acceptation à ${eur(p)} (%)`, attendu: t, calcul: `100 % − ${pct(l.tropCher * 100)} − ${pct(l.tropBonMarche * 100)} = ${pct(t)}` };
        });
      },
      explication: () => {
        const a = acceptabilite();
        return [
          `Le prix d'acceptabilité, celui qui satisfait le plus de clientes, est ${eur(a.meilleur.prixTtc)} (${pct(Math.round(a.meilleur.acceptation * 1000) / 10)}). Plus bas, des clientes doutent de la qualité ; plus haut, elles trouvent le pull trop cher. L'enquête ne dit pas le prix qui rapporte le plus : elle borne la zone où le chercher, que la marge du mois départage.`,
        ];
      },
    },
    {
      id: "le-cadre-legal-du-prix",
      objectifs: [5],
      type: "choix",
      titre: "Ce que la loi dit du prix",
      notions: ["price_floor", "markup_coefficient"],
      question: (c) => {
        const f = ficheDe(c);
        return `Pour s'aligner sur le concurrent à ${eur(f.concurrent.prixTtc)}, le vendeur propose d'afficher en vitrine « ${eur(f.concurrent.prixTtc / 1.2)} » sans préciser que c'est hors taxes, et le façonnier rappelle qu'il « conseille » de ne pas descendre sous ${eur(f.gamme[0]!.prixTtc)}. Qu'en dites-vous ?`;
      },
      options: () => [
        {
          texte: "Toutes taxes comprises ; le prix conseillé ne lie pas la boutique",
          juste: true,
          retour:
            "Oui. Les prix sont libres, fixés par le commerçant ; ils s'affichent toutes taxes comprises, en euros, lisiblement, devant le client. Un fournisseur peut conseiller un prix, jamais l'imposer. Deux limites demeurent : la revente à perte, sous le prix d'achat effectif, est interdite hors des cas prévus (le chapitre « Choisir et négocier avec le fournisseur ») ; et une réduction s'annonce sur le prix le plus bas des 30 derniers jours.",
        },
        {
          texte: "Afficher hors taxes est permis : c'est le prix que la boutique encaisse",
          juste: false,
          retour: "Non : face au consommateur, le prix s'affiche toutes taxes comprises. Le hors taxes sert aux comptes et aux ventes entre professionnels.",
        },
        {
          texte: "Le façonnier peut exiger un prix minimum de revente",
          juste: false,
          retour: "Non : le prix de revente imposé est interdit. Le façonnier conseille ; la boutique décide.",
        },
      ],
    },
    {
      id: "la-critique-du-taux",
      objectifs: [3],
      type: "choix",
      titre: "Le taux de marque, un objectif ?",
      notions: ["margin_rates", "price_elasticity"],
      question: (c) => {
        const m = margesDuRayon(c);
        return `La responsable veut passer à l'atelier local et appliquer au pull le taux de marque du rayon, ${pct(m.tMarque)} : ${eur(m.prixAtelier)} HT. Que lui dites-vous ?`;
      },
      options: (c) => {
        const m = margesDuRayon(c);
        return [
          {
            texte: "Le taux est gardé, pas la marge du mois",
            juste: true,
            retour: `Oui : ${eur(m.auPrixQuiGarde.margeDuMois)} de marge au lieu de ${eur(m.meilleurAtelier.marge)} vers ${eur(m.meilleurAtelier.prix)}. À ${eur(m.prixAtelier)}, la demande tombe à ${qte(m.auPrixQuiGarde.demande)} pulls : chaque pull marque ${pct(m.tMarque)}, mais le mois rapporte moins qu'à un prix plus bas. Quand les clients répondent au prix, on cherche le prix qui donne la plus forte marge du mois ; le taux de marque n'en est qu'une conséquence.`,
          },
          {
            texte: "Elle a raison : garder le taux de marque garde la marge du mois",
            juste: false,
            retour: `Non : le taux se garde par pull, pas sur le mois. À ${eur(m.prixAtelier)}, il ne se vend plus que ${qte(m.auPrixQuiGarde.demande)} pulls au lieu de ${qte(m.r.ventesDuMois)}.`,
          },
          {
            texte: `Il faut ${eur(m.ttcAtelier)} HT : le coefficient TTC s'applique au hors taxes`,
            juste: false,
            retour: `Non : le coefficient TTC, ${coef(m.coefTtcAtelier)}, donne l'étiquette toutes taxes comprises, ${eur(m.ttcAtelier)}. Appliqué au prix hors taxes, il compterait la TVA comme de la marge.`,
          },
          {
            texte: `Elle doit garder ${eur(m.r.prixHt)} : le client ne voit pas le fournisseur`,
            juste: false,
            retour: `Non : à ${eur(m.r.prixHt)}, le pull de l'atelier ne laisse que ${eur(m.auPrixDeJanvier.margeDuMois)} de marge du mois, et ${pct(auCentime(m.auPrixDeJanvier.tauxDeMarque * 100))} de marque. Un prix entre les deux fait mieux que l'un et l'autre.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["margin_rates", "markup_coefficient", "vat_payable"],
      tableau: (c) => tableauDesFournisseurs(margesDuRayon(c)),
      texte: (c) => {
        const m = margesDuRayon(c);
        return [
          `La marge commerciale (${eur(m.a.margeCommerciale)} sur le ${m.r.nom.toLowerCase()}) se dit de trois façons : le taux de marque (${pct(m.tMarque)}, sur le prix de vente), le taux de marge (${pct(m.tMarge)}, sur le prix d'achat) et le coefficient (${coef(m.coefHt)} hors taxes, ${coef(m.coefTtc)} toutes taxes comprises). Tout se calcule hors taxes ; le coefficient TTC ajoute la TVA, qui n'est pas à la boutique. Le taux de marque de la boutique se pondère par les ventes : ${pct(m.gamme.tMarque)}, et non la moyenne des taux.`,
          `À taux de marque constant, le prix de vente suit le prix d'achat dans la même proportion. Mais quand les clients répondent au prix, garder le taux de marque et garder la marge du mois sont deux objectifs différents : face au concurrent, il faut acheter ${eur(m.achatQuiGardeLaMarque)} pour l'un, ${eur(m.achatQuiGardeLaMarge)} pour l'autre.`,
          "Au niveau de l'examen, vous savez passer d'un taux à l'autre et au coefficient, remonter d'une étiquette et d'un coefficient au prix d'achat, fixer le prix qui garde le taux de marque, et dire pourquoi la marge du mois, et non le taux, décide d'un prix.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Taux de marque = marge ÷ prix de vente HT. Taux de marge = marge ÷ prix d'achat HT. Coefficient HT = prix de vente HT ÷ prix d'achat HT = 1 ÷ (1 − taux de marque). Coefficient TTC = coefficient HT × (1 + TVA). Prix qui garde le taux de marque = prix d'achat ÷ (1 − taux de marque).",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LES DEUX PARTIES (audit pédagogique : aucun chapitre de plus de 20 étapes)
// ─────────────────────────────────────────────────────────────────────────────

export const CODE_DE_LA_SUITE = "s-aligner-sur-le-concurrent";
export const TITRE_DE_LA_SUITE = "S'aligner sur le concurrent : garder la marque ou la marge";

/** PREMIÈRE PARTIE : les étapes du chapitre d'origine jusqu'à `le-coefficient-du-concurrent` exclue, son propre laboratoire (l'étiquette après la hausse du façonnier, le pull seul), puis sa propre synthèse. */
export const TAUX_DE_MARQUE: Chapitre = partieDuChapitre(TAUX_DE_MARQUE_ENTIER, [
  ...etapesAvant(TAUX_DE_MARQUE_ENTIER, "le-coefficient-du-concurrent"),
  {
    id: "le-laboratoire-de-l-etiquette",
    objectifs: [1, 2, 3],
    type: "simulation",
    titre: "Le laboratoire de l'étiquette",
    notions: ["margin_rates", "markup_coefficient", "vat_payable"],
    question: (c) => {
      const m = margesDuRayon(c);
      return `Le « ${m.faconnier.nom} » annonce une hausse de ${pct(HAUSSE_DU_FACONNIER * 100)} sur le ${m.r.nom.toLowerCase()}. Déplacez le prix d'achat hors taxes et l'étiquette toutes taxes comprises. Le tableau suit le prix hors taxes, la marge d'un pull, ses deux taux et le coefficient, face à ${m.f.moisDeReference}. La courbe montre le taux de marque selon l'étiquette, au prix d'achat choisi. Relevez le défi, puis comparez avec l'étiquette qui répercute la hausse en euros.`;
    },
    leviers: (c) => {
      const m = margesDuRayon(c);
      const { achat, etiquette } = LEVIERS_DE_L_ETIQUETTE;
      return [
        { code: "achat", libelle: "Prix d'achat hors taxes", unite: "€", min: achat.min, max: achat.max, pas: achat.pas, depart: m.r.coutDAchat },
        { code: "etiquette", libelle: "Étiquette toutes taxes comprises", unite: "€", min: etiquette.min, max: etiquette.max, pas: etiquette.pas, depart: m.r.prixTtc },
      ];
    },
    lecture: (c, p) => {
      const m = margesDuRayon(c);
      const x = pullALEtiquette(m.f, p.achat!, p.etiquette!);
      const d = pullALEtiquette(m.f, m.r.coutDAchat, m.r.prixTtc);
      return [
        { libelle: "Prix de vente hors taxes", montant: x.prixHt, reference: d.prixHt },
        { libelle: "Marge commerciale d'un pull", montant: x.margeCommerciale, reference: d.margeCommerciale, fort: true },
        { libelle: "Taux de marque", montant: auCentime(x.tauxDeMarque * 100), reference: auCentime(d.tauxDeMarque * 100), unite: "%" },
        { libelle: "Taux de marge", montant: auCentime(x.tauxDeMarge * 100), reference: auCentime(d.tauxDeMarge * 100), unite: "%" },
        { libelle: "Coefficient multiplicateur TTC", montant: auCentime(x.coefficientTtc), reference: auCentime(d.coefficientTtc), unite: "fois" },
        { libelle: `Écart au taux de marque de ${m.f.moisDeReference}`, montant: auCentime(auCentime(x.tauxDeMarque * 100) - m.tMarque), reference: 0, unite: "points", effet: true },
      ];
    },
    graphique: (c) => {
      const m = margesDuRayon(c);
      return {
        levier: "etiquette",
        unite: "%",
        courbes: [
          { libelle: "Taux de marque à cette étiquette", valeur: (p) => auCentime(pullALEtiquette(m.f, p.achat!, p.etiquette!).tauxDeMarque * 100) },
          { libelle: `Taux de marque de ${m.f.moisDeReference}`, valeur: () => m.tMarque },
        ],
      };
    },
    defi: (c) => {
      const m = margesDuRayon(c);
      const garde = (p: Readonly<Record<string, number>>) => pullALEtiquette(m.f, p.achat!, p.etiquette!).tauxDeMarque >= m.tauxDeMarqueExact - 1e-12;
      const aLaHausse = (p: Readonly<Record<string, number>>) => Math.abs(p.achat! - m.achatEnHausse) < 0.005;
      return {
        consigne: `Le prix d'achat passé à ${eur(m.achatEnHausse)} HT, trouvez la plus petite étiquette ronde qui garde au moins le taux de marque de ${m.f.moisDeReference}, ${pct(m.tMarque)}.`,
        atteint: (p) => aLaHausse(p) && garde(p) && p.etiquette === m.etiquetteApresHausse,
        indice: (p) => {
          if (!aLaHausse(p)) return `Placez d'abord le prix d'achat sur celui qu'annonce le façonnier : ${eur(m.r.coutDAchat)} plus ${pct(HAUSSE_DU_FACONNIER * 100)}, soit ${eur(m.achatEnHausse)} HT.`;
          const x = pullALEtiquette(m.f, p.achat!, p.etiquette!);
          if (!garde(p)) {
            const enEuros =
              x.margeCommerciale >= m.a.margeCommerciale
                ? `la marge d'un pull vaut ${eur(x.margeCommerciale)}, autant ou plus qu'en ${m.f.moisDeReference}, mais le taux de marque n'est que de ${pct(auCentime(x.tauxDeMarque * 100))} : garder la marge en euros ne garde pas le taux.`
                : `la marge d'un pull tombe à ${eur(x.margeCommerciale)}, et le taux de marque à ${pct(auCentime(x.tauxDeMarque * 100))}.`;
            return `À ${eur(p.etiquette!)}, ${enEuros} Montez l'étiquette.`;
          }
          return `À ${eur(p.etiquette!)}, le taux de marque est gardé (${pct(auCentime(x.tauxDeMarque * 100))}), mais une étiquette plus basse le garde encore : cherchez la plus petite.`;
        },
        solution: { achat: m.achatEnHausse, etiquette: m.etiquetteApresHausse },
      };
    },
    explication: (c, p) => {
      const m = margesDuRayon(c);
      const x = pullALEtiquette(m.f, p.achat!, p.etiquette!);
      const enEuros = pullALEtiquette(m.f, m.achatEnHausse, m.etiquetteQuiGardeLaMarge);
      const hausse = auCentime(m.achatEnHausse - m.r.coutDAchat);
      return [
        `À ${eur(p.etiquette!)}, soit ${eur(x.prixHt)} HT, le pull marque ${pct(auCentime(x.tauxDeMarque * 100))} et laisse ${eur(x.margeCommerciale)}, au lieu de ${eur(m.a.margeCommerciale)} : la marge monte de ${eur(auCentime(x.margeCommerciale - m.a.margeCommerciale))} pour une hausse du prix d'achat de ${eur(hausse)}. Garder le taux, c'est garder le coefficient, ${coef(m.coefTtc)} toutes taxes comprises (${coef(auCentime(x.coefficientTtc))} à l'arrondi de l'étiquette près) : le client paie la hausse multipliée par le coefficient.`,
        `Répercuter la hausse en euros, ${eur(hausse)} HT soit ${eur(auCentime(hausse * (1 + m.r.tauxTva)))} TTC, donne ${eur(m.etiquetteQuiGardeLaMarge)} : la marge reste ${eur(enEuros.margeCommerciale)}, mais le taux de marque tombe à ${pct(auCentime(enEuros.tauxDeMarque * 100))} et le taux de marge à ${pct(auCentime(enEuros.tauxDeMarge * 100))}. Quand le prix d'achat change, la marge en euros et le taux ne se gardent pas ensemble : le commerçant choisit ce qu'il garde.`,
      ];
    },
  },
  {
    id: "synthese",
    type: "lecture",
    titre: "Ce qu'il faut retenir",
    notions: ["margin_rates", "markup_coefficient"],
    tableau: tableauDeLaGamme,
    texte: (c) => {
      const m = margesDuRayon(c);
      return [
        `La marge commerciale (${eur(m.a.margeCommerciale)} sur le ${m.r.nom.toLowerCase()}) se dit de trois façons : le taux de marque (${pct(m.tMarque)}, sur le prix de vente), le taux de marge (${pct(m.tMarge)}, sur le prix d'achat) et le coefficient (${coef(m.coefHt)} hors taxes, ${coef(m.coefTtc)} toutes taxes comprises). Le taux de marque de la boutique se pondère par les ventes : ${pct(m.gamme.tMarque)}.`,
        `À taux de marque constant, le prix de vente suit le prix d'achat dans la même proportion. La suite, « ${TITRE_DE_LA_SUITE} », met la boutique face au concurrent : garder le taux de marque et garder la marge du mois ne demandent pas le même prix d'achat.`,
        "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
      ];
    },
    repere: () => "Taux de marque = marge ÷ prix de vente HT. Taux de marge = marge ÷ prix d'achat HT. Coefficient = prix de vente ÷ prix d'achat HT ; le coefficient TTC ajoute la TVA.",
  },
]);

/** SUITE : sa propre introduction, puis les étapes du chapitre d'origine depuis `le-coefficient-du-concurrent`, synthèse comprise. */
export const S_ALIGNER_SUR_LE_CONCURRENT: Chapitre = partieDuChapitre(
  TAUX_DE_MARQUE_ENTIER,
  [
    {
      id: "intro",
      type: "lecture",
      titre: "Le concurrent affiche moins cher",
      notions: ["margin_rates", "markup_coefficient"],
      tableau: tableauDeLaGamme,
      texte: (c) => {
        const m = margesDuRayon(c);
        return [
          `Ce chapitre suit « Taux de marque, taux de marge, coefficient » : la boutique vend le ${m.r.nom.toLowerCase()} avec un taux de marque de ${pct(m.tMarque)} et un coefficient de ${coef(m.coefHt)} hors taxes.`,
          "Un concurrent de la rue affiche moins cher. Vous retrouverez son coefficient à rebours, chiffrerez le prix aligné, puis le prix d'achat à négocier : celui qui garde le taux de marque n'est pas celui qui garde la marge du mois.",
        ];
      },
      repere: () => "Quand les clients répondent au prix, c'est la marge du mois qui décide, pas le taux.",
    },
    ...etapesDepuis(TAUX_DE_MARQUE_ENTIER, "le-coefficient-du-concurrent"),
  ],
  {
    code: CODE_DE_LA_SUITE,
    titre: TITRE_DE_LA_SUITE,
    accroche: "Le concurrent affiche moins cher : le coefficient retrouvé à rebours, le prix aligné, puis le prix d'achat qui garde le taux de marque et celui qui garde la marge du mois.",
    prerequis: ["taux-de-marque-et-coefficient"],
    ouverture: undefined,
    // La suite reste réservée : seul le chapitre de la liste est libre (config/cours/chapitres-libres.ts).
    libre: false,
  },
);
