import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { assortiment as assortimentDuMonde, retirerUneReference } from "../monde/boutique";
import { BOUTIQUES_DU_COURS, type CodeDeReference, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : L'ASSORTIMENT, MARGE ET VOLUME (BTS MCO, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique
 * MAILLE & CO a une fiche figée (monde/maille-et-co.ts), sa gamme de janvier, et l'assortiment se
 * calcule par le modèle du cours (monde/boutique.ts, `assortiment` et `retirerUneReference`). Une
 * évolution du moteur ne change rien ici.
 *
 * L'objet : les références d'un même point de vente ne rapportent pas pareil. Le chapitre calcule la
 * marge de chaque référence, la classe selon ses ventes et sa marge par article (locomotive, produit
 * de volume, produit de marge, à revoir) sur les moyennes PONDÉRÉES de la gamme (correction du défaut
 * de l'audit : les anciennes moyennes simples ne donnaient aucune locomotive), puis chiffre la question
 * du manager : retirer la référence qui rapporte le moins, quand une part de ses ventes se reporte sur
 * les autres.
 *
 * Le piège central : la marge perdue n'est pas la marge de la référence, ni son chiffre d'affaires ; c'est
 * sa marge moins ce que le report rattrape. Et le report ne compense un retrait que si la référence marge
 * moins par article que les autres : le cardigan et le mérinos ne se compensent jamais, le bonnet dès
 * 46 % de ventes reportées, l'écharpe à 60 %.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'épreuve) :
 *   · guidé : intro, marges, chiffre-et-marge (la formule est au repère, la question nomme les
 *     chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-merinos puis
 *     le-merinos-au-curseur (les ventes du mérinos, sa marge face à celle du col rond) avant
 *     les-deux-moyennes et familles ; predire-le-retrait puis la-part-reportee (un curseur sur la part
 *     des ventes du bonnet qui se reporte, la marge récupérée face à la marge perdue) avant
 *     le-retrait-chiffre ;
 *   · le laboratoire : le-laboratoire-du-retrait (la référence retirée, un levier à choix, et la part
 *     reportée ; le graphique des deux marges selon la part), après le-retrait-chiffre ;
 *   · autonome : les-deux-moyennes, familles, le-retrait-chiffre (ni formule ni chiffres à prendre
 *     donnés ; le calcul de la correction montre le chemin) ;
 *   · expert : la-moyenne-ponderee (une critique de la méthode), retirer-l-echarpe (une variante
 *     chiffrée), a-rebours (retrouver la part reportée à partir de l'effet observé) ; puis retirer (un
 *     jugement) et la synthèse.
 */

/** Le chapitre se joue dans la boutique du cours : MAILLE & CO, seule. */
export const ENTREPRISES_DE_L_ASSORTIMENT: readonly string[] = ["boutique"];

/** Pourquoi la boutique seule, dit à l'élève qui arrive d'une autre entreprise. */
export const POURQUOI_LA_BOUTIQUE =
  "la simulation du cours suit un seul point de vente d'un chapitre à l'autre, la boutique MAILLE & CO, dont elle connaît chaque référence, ses ventes et sa marge : l'assortiment se joue chez elle, quelle que soit votre entreprise.";

export const FAMILLES_D_ASSORTIMENT = [
  { code: "locomotive", libelle: "Locomotive" },
  { code: "volume", libelle: "Produit de volume" },
  { code: "marge", libelle: "Produit de marge" },
  { code: "a-revoir", libelle: "À revoir" },
] as const;

/**
 * LA PART DES VENTES REPORTÉE, hypothèse du cours : d'après les études de la direction, 30 % des ventes
 * d'une référence retirée se reportent sur les autres références de la gamme, à la marge moyenne d'un
 * article de ces autres références. Les autres clients vont l'acheter ailleurs.
 */
export const PART_REPORTEE = 0.3;

/** Les deux références du premier curseur : un produit de marge, face au produit de volume qui marge le plus. */
export const PRODUIT_DE_MARGE_DU_CURSEUR: CodeDeReference = "merinos";
export const PRODUIT_DE_VOLUME_DU_CURSEUR: CodeDeReference = "col-rond";

/** Les bornes du curseur des ventes du mérinos, en pulls. */
export const VENTES_DU_CURSEUR = { min: 50, max: 400 } as const;

/** La variante chiffrée : le retrait de l'écharpe, l'autre produit de volume à petite marge. */
export const VARIANTE_DU_RETRAIT: CodeDeReference = "echarpe";

/**
 * LE CALCUL À REBOURS, hypothèse du cours : un mois après le retrait du bonnet, 40 % de ses ventes se
 * sont reportées. Le contrôleur ne voit que l'effet net sur la marge du mois ; l'élève remonte à la part.
 */
export const PART_OBSERVEE_A_REBOURS = 0.4;

/** Le défi du laboratoire : un retrait qui ne fait pas baisser la marge, avec au plus la moitié des ventes reportées. */
export const PART_MAXIMALE_DU_DEFI = 50;

/** Le départ du laboratoire : l'écharpe, au report de la direction. Une solution : le bonnet, à 46 %. */
export const DEPART_DU_LABORATOIRE: { reference: CodeDeReference; part: number } = { reference: "echarpe", part: 30 };
export const SOLUTION_DU_LABORATOIRE: { reference: CodeDeReference; part: number } = { reference: "bonnet", part: 46 };

/**
 * La marge d'un cardigan qui ferait diverger les deux moyennes, hypothèse du cours pour la critique :
 * à 33 € par article, le cardigan passerait au-dessus de la moyenne pondérée et sous la moyenne simple.
 */
export const MARGE_DU_CARDIGAN_HYPOTHETIQUE = 33;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
/** « du col rond », « de l'écharpe » : l'article devant le nom d'une référence. */
const duNom = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `de l'${nom}` : `du ${nom}`);
const leNom = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `l'${nom}` : `le ${nom}`);
const LeNom = (nom: string) => leNom(nom).replace(/^l/, "L");

/** La fiche de la boutique du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

/** Le nom court d'une référence, en minuscules : « col rond », « écharpe ». */
const nomCourt = (nom: string) => nom.replace(/^Pull /, "").toLowerCase();

/** Le code d'une référence, en nombre, pour le levier à choix du laboratoire (son rang dans la gamme, à partir de 1). */
export const rangDe = (f: FicheDeLaBoutique, code: CodeDeReference) => f.gamme.findIndex((r) => r.code === code) + 1;
export const codeDuRang = (f: FicheDeLaBoutique, rang: number): CodeDeReference => f.gamme[rang - 1]!.code;

/**
 * Le retrait d'une référence, et la part reportée qui le compense : la marge de la référence divisée
 * par ce que ses ventes rapporteraient toutes reportées (ventes × marge d'un article des autres).
 */
export function retrait(f: FicheDeLaBoutique, code: CodeDeReference, part: number) {
  const r = retirerUneReference(f, code, part);
  const partQuiCompense = (r.visee.marge / (r.visee.ventes * r.margeUnitaireDesAutres)) * 100;
  return { ...r, nom: nomCourt(r.visee.nom), partQuiCompense, margeApres: auCentime(assortimentDuMonde(f).marge + r.effetNet) };
}

/** L'assortiment du mois : tout ce que le chapitre et son cas demandent. */
export function assortimentDuPointDeVente(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const a = assortimentDuMonde(f);
  const lignes = a.references.map((r) => ({ ...r, nomCourt: nomCourt(r.nom), partDuCa: auDixieme(r.partDuChiffreDAffaires * 100), partDeLaMarge: auDixieme(r.partDeLaMarge * 100) }));
  const parCa = [...lignes].sort((x, y) => y.chiffreDAffaires - x.chiffreDAffaires);
  const parMarge = [...lignes].sort((x, y) => y.marge - x.marge);
  const ligne = (code: CodeDeReference) => lignes.find((l) => l.code === code)!;
  const premiereEnCa = parCa[0]!;
  const derniere = parMarge[parMarge.length - 1]!;
  const margeDuMois = a.marge;
  // Les deux moyennes : la marge d'un article vendu (pondérée par les ventes) et la moyenne simple des étiquettes.
  const margeMoyenne = auCentime(a.margeUnitaireMoyenne);
  const moyenneSimple = auCentime(somme(lignes.map((l) => l.margeUnitaire)) / lignes.length);
  // La critique : un cardigan à 33 € par article, classé par chacune des deux moyennes.
  const cardigan = ligne("cardigan");
  const margeHypothetique = MARGE_DU_CARDIGAN_HYPOTHETIQUE;
  const moyennePondereeHypothetique = auCentime((margeDuMois - cardigan.ventes * (cardigan.margeUnitaire - margeHypothetique)) / a.ventes);
  const moyenneSimpleHypothetique = auCentime((somme(lignes.map((l) => l.margeUnitaire)) - cardigan.margeUnitaire + margeHypothetique) / lignes.length);
  // Le premier curseur : les ventes du mérinos qui égalent la marge du col rond.
  const deMarge = ligne(PRODUIT_DE_MARGE_DU_CURSEUR);
  const deVolume = ligne(PRODUIT_DE_VOLUME_DU_CURSEUR);
  const ventesQuiEgalent = Math.ceil(deVolume.marge / deMarge.margeUnitaire - 1e-9);
  // Le retrait de la dernière, au report de la direction, et sa variante.
  const leRetrait = retrait(f, derniere.code, PART_REPORTEE);
  const variante = retrait(f, VARIANTE_DU_RETRAIT, PART_REPORTEE);
  // Le plus petit report entier, en %, qui compense le retrait de la dernière : celui du curseur.
  const partEntiereQuiCompense = Math.ceil(leRetrait.partQuiCompense - 1e-9);
  // À rebours : l'effet observé, la marge récupérée, les articles reportés, la part.
  const observe = retrait(f, derniere.code, PART_OBSERVEE_A_REBOURS);
  const recupereeARebours = auCentime(derniere.marge + observe.effetNet);
  const reportesARebours = Math.round(recupereeARebours / leRetrait.margeUnitaireDesAutres);
  const partARebours = auDixieme((reportesARebours / derniere.ventes) * 100);
  return {
    f,
    a,
    lignes,
    ligne,
    margeDuMois,
    chiffreDAffaires: a.chiffreDAffaires,
    ventes: a.ventes,
    ventesMoyennes: auCentime(a.ventesMoyennes),
    margeMoyenne,
    moyenneSimple,
    margeHypothetique,
    moyennePondereeHypothetique,
    moyenneSimpleHypothetique,
    premiereEnCa,
    derniere,
    deMarge,
    deVolume,
    ventesQuiEgalent,
    leRetrait,
    variante,
    partEntiereQuiCompense,
    effetObserve: observe.effetNet,
    recupereeARebours,
    reportesARebours,
    partARebours,
  };
}

export type AssortimentDuChapitre = ReturnType<typeof assortimentDuPointDeVente>;

/** La gamme du mois, référence par référence : le document de départ. */
export function tableauDeLaGamme(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = assortimentDuPointDeVente(c);
  return {
    titre: `La gamme de ${x.f.entreprise}, en ${x.f.moisDeReference}`,
    colonnes: ["Articles vendus", "Prix hors taxes", "Coût variable", "Chiffre d'affaires hors taxes"],
    lignes: x.lignes.map((r) => ({ libelle: r.nom, valeurs: [qte(r.ventes), eur(r.prixHt), eur(r.coutVariable), eur(r.chiffreDAffaires)] })),
  };
}

const libelleDeLaFamille = (code: string) => FAMILLES_D_ASSORTIMENT.find((k) => k.code === code)!.libelle;

/** La matrice de l'assortiment, pour la synthèse. */
function tableauDeLaMatrice(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = assortimentDuPointDeVente(c);
  return {
    titre: `L'assortiment de ${x.f.entreprise}, ses familles et son retrait`,
    colonnes: ["Articles vendus", "Marge d'un article", "Marge du mois", "Famille", "Report qui compense son retrait"],
    lignes: x.lignes.map((r) => {
      const t = retrait(x.f, r.code, PART_REPORTEE).partQuiCompense;
      return { libelle: r.nom, valeurs: [qte(r.ventes), eur(r.margeUnitaire), eur(r.marge), libelleDeLaFamille(r.famille), t > 100 ? "aucun" : pct(auDixieme(t))] };
    }),
  };
}

export const ASSORTIMENT: Chapitre = {
  code: "assortiment",
  parcours: "mco",
  palier: 4,
  blocs: [
    "BTS MCO Bloc 2 · Animer et dynamiser l'offre commerciale",
    "Bac pro MCV Bloc 4A · Animer et gérer l'espace commercial",
  ],
  titre: "L'assortiment : marge et volume",
  accroche:
    "La référence qui fait le plus de chiffre d'affaires n'est pas toujours celle qui rapporte le plus. Marge par référence, familles de l'assortiment, et la question du rayon : laquelle retirer, et que rattrape le report de ses clients ?",
  objectifs: [
    "Calculer la marge sur coût variable de chaque référence",
    "Comparer la part d'une référence dans le chiffre d'affaires et dans la marge",
    "Classer les références selon leurs ventes et leur marge par article, sur des moyennes pondérées",
    "Chiffrer le retrait d'une référence quand une part de ses ventes se reporte, et la part qui le compense",
    "Remonter d'un effet observé à la part reportée, et décider du sort d'une référence",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_ASSORTIMENT, pourquoi: POURQUOI_LA_BOUTIQUE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Plusieurs références, un seul rayon",
      notions: ["assortment", "contribution_margin"],
      tableau: tableauDeLaGamme,
      texte: (c) => {
        const x = assortimentDuPointDeVente(c);
        const f = x.f;
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${f.entreprise}, en ${f.moisDeReference}. Elle vend ${qte(f.gamme.length)} références : ${x.lignes.filter((r) => f.gamme.find((g) => g.code === r.code)!.rayon === "maille").map((r) => leNom(r.nomCourt)).join(", ").replace(/, ([^,]*)$/, " et $1")} au rayon maille, ${x.lignes.filter((r) => f.gamme.find((g) => g.code === r.code)!.rayon === "accessoires").map((r) => leNom(r.nomCourt)).join(" et ")} au rayon accessoires. Le tableau donne le mois, référence par référence : ce qui s'est vendu, à quel prix, et ce que chaque article coûte en coûts variables (son prix d'achat et ses autres coûts variables : ${f.autresCoutsVariables}).`,
          "Le manager ne regarde pas seulement ce que chaque référence vend : il regarde ce qu'elle laisse. Une référence qui fait beaucoup de chiffre avec une petite marge peut rapporter moins qu'une autre, plus discrète.",
          `Ce que la simulation suppose. Le loyer et l'équipe ne bougent pas avec l'assortiment : on raisonne sur la marge sur coût variable. Quand une référence disparaît du rayon, une part de ses clients achète une autre référence de la gamme, à la marge moyenne d'un article des autres références ; les autres vont l'acheter ailleurs. D'après les études de la direction, cette part reportée est de ${pct(PART_REPORTEE * 100)}.`,
        ];
      },
      repere: () => "Marge d'une référence = articles vendus × (prix hors taxes − coût variable d'un article).",
    },
    {
      id: "marges",
      type: "montants",
      titre: "La marge de chaque référence",
      notions: ["contribution_margin", "assortment"],
      tableau: tableauDeLaGamme,
      question: () => "Calculez la marge sur coût variable du mois de chaque référence : ses articles vendus multipliés par son prix hors taxes moins son coût variable.",
      champs: (c) =>
        assortimentDuPointDeVente(c).lignes.map((r) => ({
          libelle: `Marge · ${r.nom}`,
          attendu: r.marge,
          calcul: `${qte(r.ventes)} × (${eur(r.prixHt)} − ${eur(r.coutVariable)}) = ${qte(r.ventes)} × ${eur(r.margeUnitaire)} = ${eur(r.marge)}`,
        })),
      explication: (c) => {
        const x = assortimentDuPointDeVente(c);
        const premiere = [...x.lignes].sort((a, b) => b.marge - a.marge)[0]!;
        return [
          `Ensemble, les références laissent ${eur(x.margeDuMois)} de marge ce mois-ci, pour ${eur(x.chiffreDAffaires)} de chiffre d'affaires. ${LeNom(premiere.nom.toLowerCase())} en apporte le plus, ${eur(premiere.marge)} ; ${leNom(x.derniere.nomCourt)} le moins, ${eur(x.derniere.marge)}.`,
        ];
      },
    },
    {
      id: "chiffre-et-marge",
      type: "montants",
      titre: "Le chiffre d'affaires ne dit pas tout",
      notions: ["assortment"],
      tableau: tableauDeLaGamme,
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        const m = x.deMarge;
        return `Le ${x.premiereEnCa.nomCourt} fait le plus de chiffre d'affaires, le ${m.nomCourt} marge le plus par article. Calculez, pour chacun, sa part du chiffre d'affaires de la gamme (${eur(x.chiffreDAffaires)}) puis sa part de la marge (${eur(x.margeDuMois)}), en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const x = assortimentDuPointDeVente(c);
        return [x.premiereEnCa, x.deMarge].flatMap((r) => [
          { libelle: `Part du chiffre d'affaires · ${r.nom} (%)`, attendu: r.partDuCa, calcul: `${eur(r.chiffreDAffaires)} ÷ ${eur(x.chiffreDAffaires)} × 100 = ${pct(r.partDuCa)}`, tolerance: 0.1 },
          { libelle: `Part de la marge · ${r.nom} (%)`, attendu: r.partDeLaMarge, calcul: `${eur(r.marge)} ÷ ${eur(x.margeDuMois)} × 100 = ${pct(r.partDeLaMarge)}`, tolerance: 0.1 },
        ]);
      },
      explication: (c) => {
        const x = assortimentDuPointDeVente(c);
        const v = x.premiereEnCa;
        const m = x.deMarge;
        return [
          `Le ${v.nomCourt} pèse ${pct(v.partDuCa)} du chiffre d'affaires mais ${pct(v.partDeLaMarge)} de la marge : sa marge par article, ${eur(v.margeUnitaire)}, est sous celle de la gamme. Le ${m.nomCourt} fait l'inverse : ${pct(m.partDuCa)} du chiffre d'affaires, ${pct(m.partDeLaMarge)} de la marge. Un rayon se pilote à la marge, pas au chiffre.`,
        ];
      },
    },
    {
      id: "predire-le-merinos",
      type: "choix",
      titre: "Pariez sur le mérinos",
      notions: ["assortment", "contribution_margin"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        const m = x.deMarge;
        const v = x.deVolume;
        return `Avant de calculer, pariez. Le ${m.nomCourt} laisse ${eur(m.margeUnitaire)} par article, ${qte(auDixieme(m.margeUnitaire / v.margeUnitaire))} fois le ${v.nomCourt} (${eur(v.margeUnitaire)}), mais il n'en vend que ${qte(m.ventes)} contre ${qte(v.ventes)}. Pour laisser autant de marge que le ${v.nomCourt}, le ${m.nomCourt} devrait vendre…`;
      },
      options: (c) => {
        const x = assortimentDuPointDeVente(c);
        const v = x.deVolume;
        const m = x.deMarge;
        const voir = "Faites vendre le mérinos à l'étape suivante : le curseur montre où sa marge rattrape celle du col rond.";
        const rapport = x.ventesQuiEgalent / m.ventes;
        return [
          { texte: `Un peu plus du double de ses ventes`, juste: rapport > 2 && rapport < 3, retour: `Bon pari. ${voir}` },
          { texte: `${qte(v.ventes)} articles, autant que le ${v.nomCourt}`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Rien de plus : il marge déjà plus par article`, juste: m.marge >= v.marge, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-merinos-au-curseur",
      type: "curseur",
      titre: "Faites vendre le mérinos",
      notions: ["assortment", "contribution_margin"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        const m = x.deMarge;
        const v = x.deVolume;
        return `Faites vendre le ${m.nomCourt}, de ${qte(VENTES_DU_CURSEUR.min)} à ${qte(VENTES_DU_CURSEUR.max)} articles dans le mois. Une droite donne sa marge (${eur(m.margeUnitaire)} par article), l'autre la marge du ${v.nomCourt} (${eur(v.marge)}). Placez le curseur sur le plus petit nombre d'articles où le ${m.nomCourt} laisse au moins autant, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Articles vendus du ${assortimentDuPointDeVente(c).deMarge.nomCourt}`, unite: "articles" }),
      cible: (c) => {
        const x = assortimentDuPointDeVente(c);
        return { attendu: x.ventesQuiEgalent, min: VENTES_DU_CURSEUR.min, max: VENTES_DU_CURSEUR.max };
      },
      zones: ["Le mérinos laisse plus", "Le col rond laisse plus"],
      rates: () => ({
        dessous: "À cette position, le mérinos laisse encore moins de marge que le col rond.",
        dessus: "Le mérinos laisse déjà autant plus bas : cherchez le plus petit nombre d'articles.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, q) => {
        const x = assortimentDuPointDeVente(c);
        const m = x.deMarge;
        const marge = auCentime(q * m.margeUnitaire);
        return [
          { libelle: "Marge du mérinos", montant: marge },
          { libelle: "Chiffre d'affaires du mérinos", montant: auCentime(q * m.prixHt) },
          { libelle: "Marge du col rond", montant: x.deVolume.marge },
          { libelle: "Marge du mérinos, moins celle du col rond", montant: auCentime(marge - x.deVolume.marge), fort: true },
        ];
      },
      droites: (c) => {
        const x = assortimentDuPointDeVente(c);
        return {
          produit: (q) => q * x.deMarge.margeUnitaire,
          cout: () => x.deVolume.marge,
          libelles: ["Marge du mérinos", "Marge du col rond"],
        };
      },
      explication: (c) => {
        const x = assortimentDuPointDeVente(c);
        const m = x.deMarge;
        const v = x.deVolume;
        return [
          `Il faudrait vendre ${qte(x.ventesQuiEgalent)} pulls ${m.nomCourt}, ${qte(auDixieme(x.ventesQuiEgalent / m.ventes))} fois ses ventes, pour laisser autant que les ${qte(v.ventes)} pulls ${v.nomCourt}. La marge d'une référence est le produit de deux choses : ce qu'elle vend, et ce qu'elle laisse par article. Une forte marge par article ne suffit pas, un gros volume non plus.`,
          "C'est pourquoi on classe un assortiment sur deux axes, le volume et la marge par article : l'étape suivante en calcule les deux repères.",
        ];
      },
    },
    {
      id: "les-deux-moyennes",
      type: "montants",
      titre: "Les deux repères du classement",
      notions: ["assortment", "contribution_margin"],
      question: () =>
        "Sans formule cette fois. Calculez les repères du classement : les ventes moyennes d'une référence de la gamme, puis la marge moyenne d'un article vendu dans la boutique (au centime).",
      champs: (c) => {
        const x = assortimentDuPointDeVente(c);
        return [
          { libelle: "Ventes moyennes d'une référence", attendu: x.ventesMoyennes, calcul: `${qte(x.ventes)} articles ÷ ${qte(x.lignes.length)} références = ${qte(x.ventesMoyennes)}` },
          { libelle: "Marge moyenne d'un article vendu", attendu: x.margeMoyenne, calcul: `${eur(x.margeDuMois)} ÷ ${qte(x.ventes)} articles = ${eur(x.margeMoyenne)}` },
        ];
      },
      explication: (c) => {
        const x = assortimentDuPointDeVente(c);
        return [
          `Une référence vend beaucoup si elle dépasse ${qte(x.ventesMoyennes)} articles par mois ; elle marge fort si sa marge par article dépasse ${eur(x.margeMoyenne)}, ce que rapporte en moyenne un article qui passe en caisse. Chaque référence y pèse par ses ventes : c'est une moyenne pondérée.`,
        ];
      },
    },
    {
      id: "familles",
      type: "tri",
      titre: "Les familles de l'assortiment",
      notions: ["assortment"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        return `Classez chaque référence. Elle vend beaucoup si elle dépasse ${qte(x.ventesMoyennes)} articles par mois ; elle marge fort si sa marge par article dépasse ${eur(x.margeMoyenne)}. Une locomotive fait les deux ; un produit de volume vend beaucoup avec une petite marge ; un produit de marge vend peu mais marge fort ; le reste est à revoir.`;
      },
      categories: FAMILLES_D_ASSORTIMENT,
      elements: (c) => {
        const x = assortimentDuPointDeVente(c);
        return x.lignes.map((r) => ({
          libelle: r.nom,
          montant: r.marge,
          categorie: r.famille,
          pourquoi: `${qte(r.ventes)} articles (repère ${qte(x.ventesMoyennes)}), ${eur(r.margeUnitaire)} de marge par article (repère ${eur(x.margeMoyenne)}).`,
        }));
      },
      explication: () => [
        "Chaque famille a son rôle : la locomotive fait vivre le rayon, le produit de volume attire, le produit de marge enrichit, la référence à revoir doit justifier sa place.",
      ],
    },
    {
      id: "la-moyenne-ponderee",
      type: "choix",
      titre: "Quelle moyenne pour classer ?",
      notions: ["assortment", "contribution_margin"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        return `Un collègue classe la gamme avec la moyenne simple des ${qte(x.lignes.length)} marges par article, ${eur(x.moyenneSimple)}, au lieu de la marge moyenne d'un article vendu, ${eur(x.margeMoyenne)}. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = assortimentDuPointDeVente(c);
        const m = x.deMarge;
        const v = x.deVolume;
        return [
          {
            texte: "La moyenne simple compte chaque référence pour une, quelles que soient ses ventes : elle mesure les étiquettes, pas ce que rapporte un article vendu",
            juste: true,
            retour: `Oui. Elle donne au ${m.nomCourt}, ${qte(m.ventes)} articles, le même poids qu'au ${v.nomCourt}, ${qte(v.ventes)} : sa forte marge la tire vers le haut. Ici, les deux moyennes classent la gamme pareil ; mais un cardigan à ${eur(x.margeHypothetique)} par article passerait au-dessus de la moyenne pondérée (${eur(x.moyennePondereeHypothetique)}) et sous la moyenne simple (${eur(x.moyenneSimpleHypothetique)}) : locomotive pour l'une, produit de volume pour l'autre.`,
          },
          {
            texte: "La moyenne simple est plus exigeante : elle a raison de classer plus haut la barre de la marge",
            juste: false,
            retour: `Non : une barre plus haute n'est pas plus juste. La marge moyenne d'un article vendu, ${eur(x.margeMoyenne)}, est ce que la boutique encaisse vraiment en moyenne ; la moyenne simple, ${eur(x.moyenneSimple)}, est faussée par une référence qui vend peu.`,
          },
          {
            texte: "La moyenne pondérée se calcule sur le chiffre d'affaires, pas sur la marge",
            juste: false,
            retour: `Non : elle se calcule sur la marge, ${eur(x.margeDuMois)}, divisée par les articles vendus, ${qte(x.ventes)}. Chaque référence y pèse par ses ventes.`,
          },
        ];
      },
    },
    {
      id: "predire-le-retrait",
      type: "choix",
      titre: "Pariez sur le retrait",
      notions: ["assortment", "cannibalization"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        const d = x.derniere;
        return `Avant de calculer, pariez. La direction veut retirer le ${d.nomCourt}, la plus petite marge du rayon (${eur(d.marge)}). D'après ses études, ${pct(PART_REPORTEE * 100)} de ses ventes se reporteraient sur les autres références. Retirer le ${d.nomCourt} ferait…`;
      },
      options: (c) => {
        const x = assortimentDuPointDeVente(c);
        const e = x.leRetrait.effetNet;
        const d = x.derniere;
        const voir = "Faites jouer le report à l'étape suivante : le curseur montre ce que le report rattrape.";
        return [
          { texte: `Perdre moins de ${eur(d.marge)} : le report en rattrape une partie`, juste: e < 0 && e > -d.marge, retour: `Bon pari. ${voir}` },
          { texte: `Perdre ${eur(d.marge)} : toute sa marge`, juste: e === -d.marge, retour: `Pari à vérifier. ${voir}` },
          { texte: "Gagner de la marge : ses clients achètent des articles qui margent plus", juste: e >= 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-part-reportee",
      type: "curseur",
      titre: "Faites jouer le report",
      notions: ["assortment", "cannibalization"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        const d = x.derniere;
        return `Faites varier la part des ventes du ${d.nomCourt} qui se reporte sur les autres références, de 0 à 100 %. Une droite donne la marge que le report rattrape, l'autre la marge que le ${d.nomCourt} laissait (${eur(d.marge)}). Placez le curseur sur la plus petite part où le retrait ne coûte rien, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Part des ventes du ${assortimentDuPointDeVente(c).derniere.nomCourt} reportée`, unite: "%" }),
      cible: (c) => ({ attendu: assortimentDuPointDeVente(c).partEntiereQuiCompense, min: 0, max: 100 }),
      zones: ["Le retrait ne coûte rien", "Le retrait coûte de la marge"],
      rates: () => ({
        dessous: "À cette part, le report rattrape moins que ce que la référence laissait : le retrait coûte de la marge.",
        dessus: "Le retrait ne coûte déjà rien avec moins de report : cherchez la plus petite part.",
      }),
      montrer: "Montrer la part qui compense",
      lecture: (c, part) => {
        const x = assortimentDuPointDeVente(c);
        const r = retrait(x.f, x.derniere.code, part / 100);
        return [
          { libelle: "Marge récupérée par le report", montant: r.margeRecuperee },
          { libelle: "Marge perdue avec la référence", montant: r.visee.marge },
          { libelle: "Effet net sur la marge du mois", montant: r.effetNet, fort: true },
        ];
      },
      droites: (c) => {
        const x = assortimentDuPointDeVente(c);
        const r = x.leRetrait;
        return {
          produit: (part) => (r.visee.ventes * part * r.margeUnitaireDesAutres) / 100,
          cout: () => r.visee.marge,
          libelles: ["Marge récupérée par le report", "Marge perdue avec la référence"],
        };
      },
      explication: (c) => {
        const x = assortimentDuPointDeVente(c);
        const r = x.leRetrait;
        return [
          `Il faut ${pct(x.partEntiereQuiCompense)} de ventes reportées pour que le retrait du ${r.nom} ne coûte rien : chaque client reporté achète un article qui laisse ${eur(auCentime(r.margeUnitaireDesAutres))} en moyenne, plus que les ${eur(r.visee.margeUnitaire)} du ${r.nom}. À ${pct(PART_REPORTEE * 100)}, l'hypothèse de la direction, le report n'en rattrape qu'une partie.`,
        ];
      },
    },
    {
      id: "le-retrait-chiffre",
      type: "montants",
      titre: "Le retrait, chiffré",
      notions: ["assortment", "cannibalization", "contribution_margin"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        return `Sans formule cette fois : avec ${pct(PART_REPORTEE * 100)} de report, calculez la marge moyenne d'un article des autres références (au centime), les articles reportés, la marge qu'ils rapportent, puis l'effet net du retrait du ${x.derniere.nomCourt} sur la marge du mois (négatif s'il en fait perdre).`;
      },
      champs: (c) => {
        const x = assortimentDuPointDeVente(c);
        const r = x.leRetrait;
        return [
          {
            libelle: "Marge moyenne d'un article des autres références",
            attendu: auCentime(r.margeUnitaireDesAutres),
            tolerance: 0.01,
            calcul: `(${eur(x.margeDuMois)} − ${eur(r.visee.marge)}) ÷ (${qte(x.ventes)} − ${qte(r.visee.ventes)}) = ${eur(r.margeDesAutres)} ÷ ${qte(r.ventesDesAutres)} = ${eur(auCentime(r.margeUnitaireDesAutres))}`,
          },
          { libelle: "Articles reportés", attendu: r.unitesReportees, calcul: `${qte(r.visee.ventes)} × ${pct(PART_REPORTEE * 100)} = ${qte(r.unitesReportees)}` },
          { libelle: "Marge récupérée par le report", attendu: r.margeRecuperee, tolerance: 0.5, calcul: `${qte(r.unitesReportees)} × (${eur(r.margeDesAutres)} ÷ ${qte(r.ventesDesAutres)}) = ${eur(r.margeRecuperee)}` },
          { libelle: "Effet net du retrait sur la marge du mois", attendu: r.effetNet, tolerance: 0.5, calcul: `${eur(r.margeRecuperee)} − ${eur(r.visee.marge)} = ${eur(r.effetNet)}` },
        ];
      },
      explication: (c) => {
        const x = assortimentDuPointDeVente(c);
        const r = x.leRetrait;
        return [
          `Le report rattrape ${eur(r.margeRecuperee)} sur les ${eur(r.visee.marge)} que laissait le ${r.nom} : la marge du mois y perd ${eur(-r.effetNet)}, alors que le loyer et l'équipe restent les mêmes. Ce que le retrait met en jeu, ce n'est ni le chiffre d'affaires du ${r.nom} (${eur(r.visee.chiffreDAffaires)}), ni toute sa marge : c'est sa marge moins ce que le report rattrape.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-retrait",
      type: "simulation",
      titre: "Le laboratoire du retrait",
      notions: ["assortment", "cannibalization"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        return `La direction hésite aussi pour ${leNom(nomCourt(x.ligne(DEPART_DU_LABORATOIRE.reference).nom))}, l'autre produit de volume à petite marge. Choisissez la référence à retirer et faites varier la part de ses ventes qui se reporte : le tableau suit la marge perdue, la marge récupérée et l'effet net sur la marge du mois ; le graphique trace les deux marges selon la part reportée. Puis relevez le défi.`;
      },
      leviers: (c) => {
        const x = assortimentDuPointDeVente(c);
        return [
          {
            code: "reference",
            libelle: "Référence retirée",
            unite: "",
            min: 1,
            max: x.f.gamme.length,
            pas: 1,
            depart: rangDe(x.f, DEPART_DU_LABORATOIRE.reference),
            choix: x.f.gamme.map((r) => ({ valeur: rangDe(x.f, r.code), libelle: r.nom })),
          },
          { code: "part", libelle: "Part des ventes reportée", unite: "%", min: 0, max: 100, pas: 1, depart: DEPART_DU_LABORATOIRE.part },
        ];
      },
      lecture: (c, position) => {
        const x = assortimentDuPointDeVente(c);
        const l = retrait(x.f, codeDuRang(x.f, position.reference!), position.part! / 100);
        const d = retrait(x.f, DEPART_DU_LABORATOIRE.reference, DEPART_DU_LABORATOIRE.part / 100);
        return [
          { libelle: "Marge perdue avec la référence", montant: l.visee.marge, reference: d.visee.marge },
          { libelle: "Articles reportés", montant: l.unitesReportees, reference: d.unitesReportees, unite: "articles" },
          { libelle: "Marge d'un article des autres références", montant: auCentime(l.margeUnitaireDesAutres), reference: auCentime(d.margeUnitaireDesAutres) },
          { libelle: "Marge récupérée par le report", montant: l.margeRecuperee, reference: d.margeRecuperee },
          { libelle: "Part reportée qui compense le retrait", montant: auDixieme(l.partQuiCompense), reference: auDixieme(d.partQuiCompense), unite: "%" },
          { libelle: "Effet net sur la marge du mois", montant: l.effetNet, reference: d.effetNet, effet: true, fort: true },
          { libelle: "Marge du mois après le retrait", montant: l.margeApres, reference: d.margeApres },
        ];
      },
      graphique: (c) => {
        const x = assortimentDuPointDeVente(c);
        return {
          levier: "part",
          courbes: [
            { libelle: "Marge récupérée par le report", valeur: (p) => retrait(x.f, codeDuRang(x.f, p.reference!), p.part! / 100).margeRecuperee },
            { libelle: "Marge perdue avec la référence", valeur: (p) => retrait(x.f, codeDuRang(x.f, p.reference!), p.part! / 100).visee.marge },
          ],
        };
      },
      defi: (c) => {
        const x = assortimentDuPointDeVente(c);
        return {
          consigne: `Retirez une référence sans que la marge du mois baisse, avec au plus ${pct(PART_MAXIMALE_DU_DEFI)} de ses ventes reportées.`,
          atteint: (p) => p.part! <= PART_MAXIMALE_DU_DEFI && retrait(x.f, codeDuRang(x.f, p.reference!), p.part! / 100).effetNet >= 0,
          indice: (p) => {
            const l = retrait(x.f, codeDuRang(x.f, p.reference!), p.part! / 100);
            if (l.visee.margeUnitaire >= l.margeUnitaireDesAutres)
              return `${LeNom(l.nom)} laisse ${eur(l.visee.margeUnitaire)} par article, plus que les autres références (${eur(auCentime(l.margeUnitaireDesAutres))}) : chaque client reporté rapporte moins qu'avant, aucun report ne compense son retrait.`;
            if (l.partQuiCompense > PART_MAXIMALE_DU_DEFI)
              return `Il faudrait ${pct(auDixieme(l.partQuiCompense))} de report pour compenser le retrait ${duNom(l.nom)} : plus que le défi ne permet. Cherchez une référence qui marge encore moins par article, face aux autres.`;
            return `Avec ${pct(p.part!)} de report, le retrait ${duNom(l.nom)} coûte ${eur(-l.effetNet)} : montez la part jusqu'à celle qui compense, ${pct(auDixieme(l.partQuiCompense))}.`;
          },
          solution: { reference: rangDe(x.f, SOLUTION_DU_LABORATOIRE.reference), part: SOLUTION_DU_LABORATOIRE.part },
        };
      },
      montrer: "Montrer un retrait qui ne coûte rien",
      explication: (c, position) => {
        const x = assortimentDuPointDeVente(c);
        const l = retrait(x.f, codeDuRang(x.f, position.reference!), position.part! / 100);
        const seuils = x.lignes.map((r) => {
          const t = retrait(x.f, r.code, PART_REPORTEE).partQuiCompense;
          return `${leNom(r.nomCourt)} ${t > 100 ? "jamais" : `à ${pct(auDixieme(t))}`}`;
        });
        return [
          `Retirer ${leNom(l.nom)} avec ${pct(position.part!)} de report laisse la marge du mois à ${eur(l.margeApres)}, soit ${eur(Math.abs(l.effetNet))} ${l.effetNet >= 0 ? "de plus" : "de moins"}. Le report compense ${seuils.join(", ")}.`,
          "Seule une référence qui laisse moins par article que la moyenne des autres peut être retirée sans perte, et seulement si une bonne part de ses clients reste dans la boutique. Une référence qui marge fort par article ne se remplace jamais par le report : ses clients reportés rapportent moins qu'avant.",
        ];
      },
    },
    {
      id: "retirer-l-echarpe",
      type: "montants",
      titre: "Variante : retirer l'écharpe",
      notions: ["assortment", "cannibalization"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        const v = x.variante;
        return `Variante : la direction retire ${leNom(v.nom)} au lieu du ${x.derniere.nomCourt}, toujours avec ${pct(PART_REPORTEE * 100)} de report. Calculez la marge moyenne d'un article des ${qte(x.lignes.length - 1)} autres références (au centime), l'effet net du retrait sur la marge du mois (négatif s'il en fait perdre), puis la part reportée qui le compenserait, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const x = assortimentDuPointDeVente(c);
        const v = x.variante;
        return [
          {
            libelle: "Marge moyenne d'un article des autres références",
            attendu: auCentime(v.margeUnitaireDesAutres),
            tolerance: 0.01,
            calcul: `(${eur(x.margeDuMois)} − ${eur(v.visee.marge)}) ÷ (${qte(x.ventes)} − ${qte(v.visee.ventes)}) = ${eur(v.margeDesAutres)} ÷ ${qte(v.ventesDesAutres)} = ${eur(auCentime(v.margeUnitaireDesAutres))}`,
          },
          {
            libelle: "Effet net du retrait sur la marge du mois",
            attendu: v.effetNet,
            tolerance: 0.5,
            calcul: `${qte(v.visee.ventes)} × ${pct(PART_REPORTEE * 100)} = ${qte(v.unitesReportees)} articles reportés ; ${qte(v.unitesReportees)} × ${eur(auCentime(v.margeUnitaireDesAutres))} − ${eur(v.visee.marge)} = ${eur(v.effetNet)}`,
          },
          {
            libelle: "Part reportée qui compense le retrait (%)",
            attendu: auDixieme(v.partQuiCompense),
            tolerance: 0.1,
            calcul: `${eur(v.visee.marge)} ÷ (${qte(v.visee.ventes)} × ${eur(auCentime(v.margeUnitaireDesAutres))}) × 100 = ${pct(auDixieme(v.partQuiCompense))}`,
          },
        ];
      },
      explication: (c) => {
        const x = assortimentDuPointDeVente(c);
        const v = x.variante;
        const b = x.leRetrait;
        return [
          `Retirer ${leNom(v.nom)} coûterait ${eur(-v.effetNet)} par mois, contre ${eur(-b.effetNet)} pour le ${b.nom}, et il faudrait ${pct(auDixieme(v.partQuiCompense))} de report pour le compenser, contre ${pct(auDixieme(b.partQuiCompense))}. ${LeNom(v.nom)} vend plus et laisse plus par article : la part qui compense un retrait est le rapport entre la marge d'un article de la référence et celle d'un article des autres.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Retrouver le report à rebours",
      notions: ["assortment", "cannibalization"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        return `À rebours. Un mois après le retrait du ${x.derniere.nomCourt}, les autres références vendent comme avant, à leur report près, et la marge du mois a baissé de ${eur(-x.effetObserve)}. Retrouvez la marge que le report a récupérée, les articles reportés, puis la part des ventes du ${x.derniere.nomCourt} qui s'est reportée, en pourcentage.`;
      },
      champs: (c) => {
        const x = assortimentDuPointDeVente(c);
        const r = x.leRetrait;
        return [
          { libelle: "Marge récupérée par le report", attendu: x.recupereeARebours, calcul: `${eur(x.derniere.marge)} − ${eur(-x.effetObserve)} = ${eur(x.recupereeARebours)}` },
          { libelle: "Articles reportés", attendu: x.reportesARebours, calcul: `${eur(x.recupereeARebours)} ÷ (${eur(r.margeDesAutres)} ÷ ${qte(r.ventesDesAutres)}) = ${qte(x.reportesARebours)}` },
          { libelle: "Part des ventes reportée (%)", attendu: x.partARebours, tolerance: 0.5, calcul: `${qte(x.reportesARebours)} ÷ ${qte(x.derniere.ventes)} × 100 = ${pct(x.partARebours)}` },
        ];
      },
      explication: (c) => {
        const x = assortimentDuPointDeVente(c);
        return [
          `${pct(x.partARebours)} des clients du ${x.derniere.nomCourt} sont restés : plus que les ${pct(PART_REPORTEE * 100)} des études, moins que les ${pct(x.partEntiereQuiCompense)} qui auraient rendu le retrait gratuit. Remonter de l'effet observé à la part reportée permet de vérifier l'hypothèse de la direction, et de la corriger pour la prochaine décision.`,
        ];
      },
    },
    {
      id: "retirer",
      type: "choix",
      titre: "Faut-il retirer le bonnet ?",
      notions: ["assortment", "contribution_margin"],
      question: (c) => {
        const x = assortimentDuPointDeVente(c);
        return `La direction reprend sa question, avec l'hypothèse de ses études (${pct(PART_REPORTEE * 100)} de report) : faut-il retirer le ${x.derniere.nomCourt} ?`;
      },
      options: (c) => {
        const x = assortimentDuPointDeVente(c);
        const r = x.leRetrait;
        return [
          {
            texte: `Pas pour la marge : retiré, il coûterait ${eur(-r.effetNet)} par mois, et il faudrait ${pct(x.partEntiereQuiCompense)} de report`,
            juste: true,
            retour: `Oui. Le ${r.nom} laisse ${eur(r.visee.marge)} par mois après ses coûts variables ; le report n'en rattrape que ${eur(r.margeRecuperee)}. Le chiffre ne dit pas tout : la place libérée en rayon, le stock immobilisé et les clients que le ${r.nom} fait entrer se pèsent aussi, avant de décider.`,
          },
          {
            texte: "Oui : une référence à revoir coûte forcément de l'argent",
            juste: false,
            retour: `Non : elle rapporte le moins, mais elle rapporte, ${eur(r.visee.marge)} de marge par mois. Elle ne coûterait de l'argent que si son prix ne couvrait pas son coût variable.`,
          },
          {
            texte: `Non : retiré, il ferait perdre ${eur(r.visee.chiffreDAffaires)} de chiffre d'affaires par mois`,
            juste: false,
            retour: `La conclusion est bonne, la raison non : le chiffre d'affaires paie d'abord les coûts variables. Ce que le retrait met en jeu, c'est la marge, ${eur(r.visee.marge)}, dont le report rattrape ${eur(r.margeRecuperee)} : ${eur(-r.effetNet)} de perte.`,
          },
          {
            texte: "Oui : il vaut toujours mieux garder moins de références",
            juste: false,
            retour: "Un assortiment trop court fait partir des clients qui ne trouvent pas ce qu'ils cherchent. La largeur de l'offre est un choix, pas une économie automatique.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["assortment", "contribution_margin", "cannibalization"],
      tableau: tableauDeLaMatrice,
      texte: (c) => {
        const x = assortimentDuPointDeVente(c);
        const r = x.leRetrait;
        return [
          `La marge d'une référence est le produit de ses ventes et de sa marge par article. On classe un assortiment sur ces deux axes, face à des repères pondérés : ${qte(x.ventesMoyennes)} articles par référence, ${eur(x.margeMoyenne)} de marge par article vendu. ${LeNom(x.premiereEnCa.nom.toLowerCase())} fait le plus de chiffre d'affaires sans marger fort : un produit de volume.`,
          `Retirer une référence coûte sa marge, moins ce que le report rattrape à la marge d'un article des autres. Le ${r.nom}, à ${pct(PART_REPORTEE * 100)} de report, coûterait ${eur(-r.effetNet)} par mois ; il faudrait ${pct(x.partEntiereQuiCompense)}. Part qui compense = marge d'un article de la référence ÷ marge d'un article des autres : au-dessus de 100 %, aucun report ne compense.`,
          "Au niveau de l'examen, vous savez calculer et comparer les marges d'une gamme, classer ses références sur des moyennes pondérées et dire pourquoi, chiffrer un retrait avec report, trouver la part qui le compense, remonter d'un effet observé à la part reportée, et rendre un avis qui pèse aussi ce que le calcul ne voit pas.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Marge d'une référence = ventes × marge d'un article. Effet d'un retrait = articles reportés × marge d'un article des autres − marge de la référence. Part qui compense = marge d'un article de la référence ÷ marge d'un article des autres.",
    },
  ],
};
