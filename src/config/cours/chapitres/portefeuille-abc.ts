import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { CABINETS_DU_COURS, type CompteClient, type FicheDuCabinet } from "../monde/atlas-conseil";
import { abcParLeChiffreDAffairesEtParLaMarge, anneeDuCabinet, classementABC, clienteleDe, coutJournalierDUnConsultant, valeurVieDesComptes, type Classe } from "../monde/relation-client";
import { PART_DES_COMPTES_D_UN_PORTEFEUILLE_CONCENTRE, PART_D_UN_COMPTE_QUI_FAIT_COURIR_UN_RISQUE } from "../negociation";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE PORTEFEUILLE CLIENTS, LA MÉTHODE ABC (BTS NDRC, palier 4 ; Bac pro MCV, BUT TC et GACO).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le cabinet
 * ATLAS CONSEIL a une fiche figée (monde/atlas-conseil.ts) avec son vrai portefeuille, 32 comptes
 * d'entreprises et de collectivités, et le classement se calcule par le modèle de la relation client
 * (monde/relation-client.ts, partie 6). Une évolution du moteur ne change rien ici. Le chapitre ne lit
 * du cas que son code.
 *
 * L'objet : classer les 32 comptes de l'année N par le chiffre d'affaires, du plus gros au plus petit,
 * cumuler les parts et couper à 80 % et 95 % ; mesurer la concentration (25 % des comptes font 77,2 %
 * des ventes, près des 20/80 sans y être, et aucun compte ne pèse le quart à lui seul) ; puis classer
 * par la marge d'un compte (chiffre d'affaires − frais − journées au coût d'un consultant). La classe A
 * change : le Centre hospitalier de Valbrune, 3e par le chiffre d'affaires, gagné à 560 € la journée et
 * servi sur des sites lointains, n'est que 11e par la marge et sort de A ; la Banque Ferrand et
 * Associés, 9e, y entre. Enfin, ce que le classement d'une année ne dit pas : la durée du compte.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, parts, classer, classement, la-marge-d-un-compte (la formule est au repère ou dans
 *     la question, qui nomme les chiffres et les seuils) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-poids puis
 *     le-poids-du-premier (un curseur sur les journées du premier compte, son chiffre d'affaires face au
 *     quart des ventes) avant la-concentration ; predire-la-classe-a puis le-laboratoire-du-portefeuille
 *     (le classement par le chiffre d'affaires ou par la marge, un levier à choix, et les courbes des
 *     parts cumulées) avant la-classe-a-par-la-marge ;
 *   · autonome : la-concentration, concentration, qui-sort-qui-entre, traiter (ni formule ni chiffres à
 *     prendre ; la correction montre le chemin) ;
 *   · expert : la-classe-a-par-la-marge (le classement par la marge, ses parts et ce qu'il change),
 *     le-prix-de-valbrune (un curseur : le prix qui rendrait au compte la marge de celui qui l'a
 *     remplacé), valbrune-renegocie (une variante chiffrée : un autre prix et d'autres frais, le
 *     compte reclassé), la-valeur-vie-des-comptes (une critique de la méthode : la durée qu'un
 *     classement d'une année ne voit pas) ; puis la synthèse.
 */

/** Le chapitre se joue chez le cabinet du cours, le seul du monde du cours qui a un portefeuille de comptes. */
export const ENTREPRISES_DU_PORTEFEUILLE: readonly string[] = ["conseil"];

/** Les codes du critère dans le laboratoire : un levier à choix. */
export const CRITERES_DU_LABORATOIRE = { chiffreDAffaires: 1, marge: 2 } as const;

/** Le compte dont le classement par la marge fait voir la faiblesse, et celui qui prend sa place en A. */
export const COMPTE_QUI_SORT = "valbrune";
export const COMPTE_QUI_ENTRE = "ferrand";

/**
 * LA VARIANTE DU CONTRAT DE VALBRUNE, hypothèse du cours : au renouvellement de l'appel d'offres, le
 * cabinet propose 600 € la journée et regroupe les sessions sur deux sites, ce qui ramène les frais de
 * mission à 200 € par journée. Les journées ne changent pas ; les autres comptes non plus.
 */
export const VARIANTE_DE_VALBRUNE = { prix: 600, fraisParJournee: 200 } as const;

/** Les bornes du curseur des journées du premier compte, et celles du prix de Valbrune. */
export const JOURNEES_DU_PREMIER_AU_CURSEUR = { min: 200, max: 800 } as const;
export const PRIX_DE_VALBRUNE_AU_CURSEUR = { min: 500, max: 800 } as const;

/** Les comptes dont la critique de la méthode compare la valeur vie : de gros comptes, et ceux qui changent de classe. */
export const COMPTES_DE_LA_VALEUR_VIE = ["arveon", "ducastel", "valbrune", "granvaux", "ferrand", "helianthe"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Un pourcentage, la part étant donnée en fraction (0,7725 → « 77,2 % »). */
const pct = (part: number, chiffres = 1) => `${(Math.round(part * 100 * 10 ** chiffres) / 10 ** chiffres + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres })} %`;
/** Une part en pourcentage, au dixième, comme nombre (0,7725 → 77,2). */
const auDixieme = (part: number) => Math.round(part * 1000) / 10 + 0;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** « d'Arvéon », « de Kerval » : l'élision devant une voyelle ou un h muet. */
const dE = (nom: string) => (/^[aeiouyéèêhAEIOUYÉÈH]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

/** La fiche du cabinet du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDuCabinet => CABINETS_DU_COURS[c.code]!;

/** La fiche où un compte a un autre prix et d'autres frais par journée, ses journées inchangées. */
export function ficheAvecUnCompte(f: FicheDuCabinet, code: string, prix: number, fraisParJournee: number): FicheDuCabinet {
  const cj = coutJournalierDUnConsultant(f);
  const comptes = f.comptes.map((k): CompteClient => {
    if (k.code !== code) return k;
    const chiffreDAffaires = auCentime(k.journees * prix);
    const frais = auCentime(k.journees * fraisParJournee);
    return { ...k, chiffreDAffaires, frais, marge: auCentime(chiffreDAffaires - frais - k.journees * cj) };
  });
  return { ...f, comptes };
}

/** Le portefeuille classé, les deux classements, et tout ce que le chapitre et son cas demandent. */
export function portefeuilleABC(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const annee = anneeDuCabinet(f);
  const { parCa, parMarge, sortentDeA, entrentEnA } = abcParLeChiffreDAffairesEtParLaMarge(f);
  const cj = coutJournalierDUnConsultant(f);
  const premier = parCa.comptes[0]!;
  const prixDuPremier = premier.chiffreDAffaires / premier.journees;
  const autres = parCa.total - premier.chiffreDAffaires;
  const quart = PART_D_UN_COMPTE_QUI_FAIT_COURIR_UN_RISQUE / 100;
  // Le premier pèse le quart quand prix × j ≥ quart × (autres + prix × j) : j ≥ quart × autres ÷ (prix × (1 − quart)).
  const journeesPourLeQuart = Math.ceil((quart * autres) / (prixDuPremier * (1 - quart)) - 1e-9);
  const compte = (code: string) => parCa.comptes.find((k) => k.code === code)!;
  const sort = compte(COMPTE_QUI_SORT);
  const entre = compte(COMPTE_QUI_ENTRE);
  const rangParMarge = (code: string) => parMarge.comptes.find((k) => k.code === code)!.rang;
  // Le prix qui donnerait au compte qui sort la marge de celui qui entre (à l'euro supérieur).
  const coutDuCompteQuiSort = sort.frais + sort.journees * cj;
  const prixPourEgaler = Math.ceil((entre.marge + coutDuCompteQuiSort) / sort.journees - 1e-9);
  // La variante : le compte renégocié, et son rang par la marge dans le portefeuille reclassé.
  const v = VARIANTE_DE_VALBRUNE;
  const fv = ficheAvecUnCompte(f, COMPTE_QUI_SORT, v.prix, v.fraisParJournee);
  const kv = classementABC(fv, "marge");
  const sortV = kv.comptes.find((k) => k.code === COMPTE_QUI_SORT)!;
  const de = (k: typeof parCa, x: Classe) => k.classes[x];
  const margeDe = (xs: readonly { marge: number }[]) => somme(xs.map((k) => k.marge));
  const valeursVie = valeurVieDesComptes(f);
  return {
    f,
    entreprise: f.entreprise,
    comptes: parCa.comptes.length,
    total: parCa.total,
    margeTotale: parMarge.total,
    journees: annee.journees,
    coutJournalier: cj,
    seuils: f.seuilsABC,
    parCa,
    parMarge,
    premier,
    prixDuPremier,
    journeesPourLeQuart,
    troisPremiers: somme(parCa.comptes.slice(0, 3).map((k) => k.chiffreDAffaires)) / parCa.total,
    A: parCa.A,
    B: parCa.B,
    C: parCa.C,
    concentre: parCa.A.partDesComptes * 100 <= PART_DES_COMPTES_D_UN_PORTEFEUILLE_CONCENTRE,
    risque: premier.part * 100 >= PART_D_UN_COMPTE_QUI_FAIT_COURIR_UN_RISQUE,
    premierCompteC: de(parCa, "C")[0]!,
    premierCompteB: de(parCa, "B")[0]!,
    margeDesAParCa: margeDe(de(parCa, "A")),
    margeDesCParCa: margeDe(de(parCa, "C")),
    caDesCParCa: somme(de(parCa, "C").map((k) => k.chiffreDAffaires)),
    margeDesAParMarge: parMarge.A.valeur,
    cumulDuDernierAParMarge: parMarge.classes.A.at(-1)!.cumul,
    cumulDuPremierBParMarge: parMarge.classes.B[0]!.cumul,
    premierBParMarge: parMarge.classes.B[0]!,
    sortentDeA,
    entrentEnA,
    sort,
    entre,
    rangDuCompteQuiSortParMarge: rangParMarge(COMPTE_QUI_SORT),
    rangDuCompteQuiEntreParMarge: rangParMarge(COMPTE_QUI_ENTRE),
    fraisParJourneeDuCompteQuiSort: sort.frais / sort.journees,
    fraisParJourneeMoyens: annee.frais / annee.journees,
    coutDesConsultantsDuCompteQuiSort: auCentime(sort.journees * cj),
    tauxDeMargeDuCompteQuiSort: sort.marge / sort.chiffreDAffaires,
    tauxDeMargeDuPortefeuille: parMarge.total / parCa.total,
    coutDuCompteQuiSort,
    prixPourEgaler,
    prixDuCompteQuiSort: sort.chiffreDAffaires / sort.journees,
    variante: {
      prix: v.prix,
      fraisParJournee: v.fraisParJournee,
      chiffreDAffaires: sortV.chiffreDAffaires,
      frais: sortV.frais,
      marge: sortV.marge,
      tauxDeMarge: sortV.marge / sortV.chiffreDAffaires,
      rang: sortV.rang,
      classe: sortV.classe,
    },
    conquete: parCa.comptes.filter((k) => k.commercial === "conquete"),
    neufs: parCa.comptes.filter((k) => k.anciennete === 0),
    valeursVie: COMPTES_DE_LA_VALEUR_VIE.map((code) => ({ ...valeursVie.find((x) => x.code === code)!, nom: compte(code).nom })),
  };
}

export type PortefeuilleABC = ReturnType<typeof portefeuilleABC>;

/** Les comptes retenus du laboratoire : les n premiers, dans l'ordre du critère choisi. */
export function laboratoireDuPortefeuille(c: Pick<Cas, "code">, critere: number, comptes: number) {
  const p = portefeuilleABC(c);
  const k = critere === CRITERES_DU_LABORATOIRE.marge ? p.parMarge : p.parCa;
  const n = Math.max(1, Math.min(k.comptes.length, Math.round(comptes)));
  const retenus = k.comptes.slice(0, n);
  const ca = somme(retenus.map((x) => x.chiffreDAffaires));
  const marge = somme(retenus.map((x) => x.marge));
  return { k, n, dernier: retenus.at(-1)!, suivant: k.comptes[n], ca, marge, partDuCa: ca / p.total, partDeLaMarge: marge / p.margeTotale, cumul: retenus.at(-1)!.cumul };
}

/** Le portefeuille par chiffre d'affaires décroissant : le document de départ du chapitre. */
export function tableauDuPortefeuille(c: Pick<Cas, "code">): TableauDeDonnees {
  const p = portefeuilleABC(c);
  return {
    titre: `Les ${qte(p.comptes)} comptes ${dE(p.entreprise)} en N, par chiffre d'affaires décroissant`,
    colonnes: ["Clientèle", "Journées", "Chiffre d'affaires"],
    lignes: p.parCa.comptes.map((k) => ({ libelle: `${qte(k.rang)}. ${k.nom}`, valeurs: [clienteleDe(p.f, k.clientele).nom, qte(k.journees), eur(k.chiffreDAffaires)] })),
  };
}

export const PORTEFEUILLE_ABC: Chapitre = {
  code: "portefeuille-abc",
  parcours: "ndrc",
  palier: 4,
  blocs: [
    "BTS NDRC Bloc 1 · Relation client et négociation-vente",
    "Bac pro MCV Bloc 4B · Prospecter et valoriser l'offre commerciale",
    "BUT TC · Manager la relation client",
    "BUT GACO · Assurer le développement des affaires, de la prospection à la fidélisation",
  ],
  titre: "Le portefeuille clients : la méthode ABC",
  accroche:
    "Tous les comptes ne pèsent pas le même poids. Classer un vrai portefeuille, mesurer sa concentration, le reclasser par la marge et voir la classe A changer, puis décider du temps que chaque compte mérite.",
  objectifs: [
    "Classer un portefeuille par chiffre d'affaires décroissant, cumuler les parts et former les classes A, B et C",
    "Mesurer la concentration d'un portefeuille et le poids d'un compte",
    "Calculer la marge d'un compte et reclasser le portefeuille par la marge",
    "Expliquer pourquoi un gros compte peut sortir de la classe A, et ce qu'il faudrait pour qu'il y revienne",
    "Critiquer la méthode, et adapter le traitement de chaque classe",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_PORTEFEUILLE,
    pourquoi:
      "ce chapitre classe un vrai portefeuille de comptes clients, et c'est ATLAS CONSEIL, le cabinet de la simulation du cours, qui en a un : 32 entreprises et collectivités, chacune avec ses journées, son chiffre d'affaires et sa marge.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un portefeuille à classer",
      notions: ["customer_portfolio"],
      tableau: tableauDuPortefeuille,
      texte: (c) => {
        const p = portefeuilleABC(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${p.entreprise}, un cabinet de conseil et de formation qui vend des journées d'intervention. Son portefeuille de l'année N compte ${qte(p.comptes)} comptes : des grands comptes, des PME et des ETI, des collectivités. Ensemble, ils ont acheté ${qte(p.journees)} journées pour ${eur(p.total)} de chiffre d'affaires.`,
          "Le tableau les range déjà du plus gros au plus petit : c'est la première étape de la méthode ABC. Reste à mesurer ce que pèse chacun, ce que pèsent les premiers ensemble, et à couper le portefeuille en classes A, B et C.",
          `Ce que la simulation suppose. Le classement porte sur une seule année, N, tout est hors taxes, et les seuils sont ceux des manuels : la classe A réunit les comptes qui font ensemble les premiers ${pct(p.seuils.a, 0)} du critère, la classe B ceux qui mènent à ${pct(p.seuils.b, 0)}, la classe C le reste. Plus loin, la marge d'un compte retire de son chiffre d'affaires ses frais et le temps des consultants qui le servent, à ${eur(p.coutJournalier)} la journée.`,
        ];
      },
      repere: () => "Part d'un compte = son chiffre d'affaires ÷ le total. Part cumulée = la somme des parts, du premier compte jusqu'à lui.",
    },
    {
      id: "parts",
      type: "montants",
      titre: "Ce que pèsent les premiers",
      notions: ["customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        const trois = p.parCa.comptes.slice(0, 3);
        return `Le portefeuille fait ${eur(p.total)}. Calculez la part du premier compte (${p.premier.nom}, ${eur(p.premier.chiffreDAffaires)}), puis la part cumulée des trois premiers (${trois.map((k) => eur(k.chiffreDAffaires)).join(", ")}), en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const p = portefeuilleABC(c);
        const trois = p.parCa.comptes.slice(0, 3);
        return [
          { libelle: "Part du premier compte (%)", attendu: auDixieme(p.premier.part), tolerance: 0.1, calcul: `${eur(p.premier.chiffreDAffaires)} ÷ ${eur(p.total)} × 100 = ${pct(p.premier.part)}` },
          {
            libelle: "Part cumulée des trois premiers (%)",
            attendu: auDixieme(p.troisPremiers),
            tolerance: 0.1,
            calcul: `(${trois.map((k) => eur(k.chiffreDAffaires)).join(" + ")}) ÷ ${eur(p.total)} × 100 = ${pct(p.troisPremiers)}`,
          },
        ];
      },
      explication: (c) => {
        const p = portefeuilleABC(c);
        return [`Les trois premiers comptes sur ${qte(p.comptes)} font ${pct(p.troisPremiers)} du chiffre d'affaires. C'est la question de la méthode : combien de comptes faut-il pour faire l'essentiel des ventes ?`];
      },
    },
    {
      id: "classer",
      type: "tri",
      titre: "Les trois classes",
      notions: ["customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `Rangez chaque compte dans sa classe : A pour les comptes qui font ensemble les premiers ${pct(p.seuils.a, 0)} du chiffre d'affaires, B pour ceux qui mènent la part cumulée jusqu'à ${pct(p.seuils.b, 0)}, C pour le reste. Cumulez les parts dans l'ordre du tableau : le compte qui fait passer un seuil appartient à la classe suivante.`;
      },
      categories: [
        { code: "A", libelle: "Classe A" },
        { code: "B", libelle: "Classe B" },
        { code: "C", libelle: "Classe C" },
      ],
      elements: (c) =>
        portefeuilleABC(c).parCa.comptes.map((k) => ({
          libelle: k.nom,
          montant: k.chiffreDAffaires,
          categorie: k.classe,
          pourquoi: `Part cumulée jusqu'à ce compte : ${pct(k.cumul)}.`,
        })),
      explication: (c) => {
        const p = portefeuilleABC(c);
        return [
          `${qte(p.A.comptes)} comptes en A, ${qte(p.B.comptes)} en B, ${qte(p.C.comptes)} en C. Le ${qte(p.premierCompteB.rang)}e compte, la ${p.premierCompteB.nom}, fait passer la part cumulée de ${pct(p.parCa.classes.A.at(-1)!.cumul)} à ${pct(p.premierCompteB.cumul)} : c'est le premier compte B.`,
        ];
      },
    },
    {
      id: "classement",
      type: "lecture",
      titre: "Le portefeuille classé",
      notions: ["customer_portfolio"],
      texte: (c) => {
        const p = portefeuilleABC(c);
        return [
          `La classe A réunit ${qte(p.A.comptes)} comptes sur ${qte(p.comptes)}, et ${pct(p.A.part)} du chiffre d'affaires. La classe B, ${qte(p.B.comptes)} comptes, en fait ${pct(p.B.part)} ; la classe C, ${qte(p.C.comptes)} comptes, la moitié du portefeuille, n'en fait que ${pct(p.C.part)}.`,
        ];
      },
      tableau: (c) => {
        const p = portefeuilleABC(c);
        return {
          titre: "Le classement ABC par le chiffre d'affaires",
          colonnes: ["Chiffre d'affaires", "Part", "Part cumulée", "Classe"],
          lignes: p.parCa.comptes.map((k) => ({ libelle: k.nom, valeurs: [eur(k.chiffreDAffaires), pct(k.part), pct(k.cumul), k.classe] })),
        };
      },
    },
    {
      id: "predire-le-poids",
      type: "choix",
      titre: "Pariez sur le poids du premier compte",
      notions: ["customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `Avant de calculer, pariez. ${p.premier.nom}, le premier compte, pèse ${pct(p.premier.part)} des ventes avec ${qte(p.premier.journees)} journées. Un compte qui pèse le quart des ventes fait courir un risque au cabinet s'il part. Pour en arriver là, ses journées devraient…`;
      },
      options: (c) => {
        const p = portefeuilleABC(c);
        const facteur = p.journeesPourLeQuart / p.premier.journees;
        const voir = "Faites grandir le compte à l'étape suivante : le curseur montre quand il atteint le quart des ventes.";
        return [
          { texte: "Plus que doubler", juste: facteur > 2, retour: `${facteur > 2 ? "Bon pari" : "Pari à vérifier"}. ${voir}` },
          { texte: "Doubler tout juste", juste: facteur === 2, retour: `Pari à vérifier. ${voir}` },
          { texte: "Augmenter d'un quart", juste: facteur <= 1.25, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-poids-du-premier",
      type: "curseur",
      titre: "Le quart des ventes",
      notions: ["customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `Faites varier les journées ${dE(p.premier.nom)}, à son prix moyen de ${eur(p.prixDuPremier)}, les autres comptes inchangés. Une droite donne son chiffre d'affaires, l'autre le quart des ventes du cabinet, qui grandissent avec lui. Placez le curseur sur le moins de journées où il pèse le quart des ventes, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Journées ${dE(portefeuilleABC(c).premier.nom)}`, unite: "journées" }),
      cible: (c) => ({ attendu: portefeuilleABC(c).journeesPourLeQuart, min: JOURNEES_DU_PREMIER_AU_CURSEUR.min, max: JOURNEES_DU_PREMIER_AU_CURSEUR.max }),
      lecture: (c, j) => {
        const p = portefeuilleABC(c);
        const ca = auCentime(j * p.prixDuPremier);
        const total = auCentime(p.total - p.premier.chiffreDAffaires + ca);
        const quart = auCentime((total * PART_D_UN_COMPTE_QUI_FAIT_COURIR_UN_RISQUE) / 100);
        return [
          { libelle: `Chiffre d'affaires ${dE(p.premier.nom)}`, montant: ca },
          { libelle: "Chiffre d'affaires du portefeuille", montant: total },
          { libelle: "Le quart des ventes", montant: quart },
          { libelle: "Au-delà du quart des ventes", montant: auCentime(ca - quart), fort: true },
        ];
      },
      droites: (c) => {
        const p = portefeuilleABC(c);
        const q = PART_D_UN_COMPTE_QUI_FAIT_COURIR_UN_RISQUE / 100;
        return {
          produit: (j) => j * p.prixDuPremier,
          cout: (j) => q * (p.total - p.premier.chiffreDAffaires + j * p.prixDuPremier),
          libelles: [`Chiffre d'affaires ${dE(p.premier.nom)}`, "Le quart des ventes du cabinet"],
        };
      },
      zones: ["Un compte qui fait courir un risque", "Un compte parmi d'autres"],
      rates: () => ({
        dessous: "À cette position, le compte pèse encore moins du quart des ventes.",
        dessus: "Avec moins de journées, le compte pèse déjà le quart des ventes : cherchez le moins de journées.",
      }),
      montrer: "Montrer le quart des ventes",
      explication: (c) => {
        const p = portefeuilleABC(c);
        const ca = p.journeesPourLeQuart * p.prixDuPremier;
        return [
          `Il faudrait ${qte(p.journeesPourLeQuart)} journées, ${qte(Math.round((p.journeesPourLeQuart / p.premier.journees) * 10) / 10)} fois plus qu'aujourd'hui : ${eur(ca)} sur ${eur(p.total - p.premier.chiffreDAffaires + ca)}. Quand un compte grandit, le total grandit avec lui ; doubler ses journées ne double pas sa part.`,
          `Aujourd'hui, aucun compte ne fait courir un risque à lui seul : le premier pèse ${pct(p.premier.part)}. La concentration se mesure aussi par classe : c'est l'étape suivante.`,
        ];
      },
    },
    {
      id: "la-concentration",
      type: "montants",
      titre: "La concentration du portefeuille",
      notions: ["customer_portfolio"],
      question: () =>
        "Sans formule cette fois. Mesurez la concentration du portefeuille : la part des comptes qui sont en classe A, la part du chiffre d'affaires qu'ils font, puis les mêmes parts pour la classe C, en pourcentage, au dixième.",
      champs: (c) => {
        const p = portefeuilleABC(c);
        return [
          { libelle: "Part des comptes en classe A (%)", attendu: auDixieme(p.A.partDesComptes), tolerance: 0.1, calcul: `${qte(p.A.comptes)} ÷ ${qte(p.comptes)} × 100 = ${pct(p.A.partDesComptes)}` },
          { libelle: "Part du chiffre d'affaires en classe A (%)", attendu: auDixieme(p.A.part), tolerance: 0.1, calcul: `${eur(p.A.valeur)} ÷ ${eur(p.total)} × 100 = ${pct(p.A.part)}` },
          { libelle: "Part des comptes en classe C (%)", attendu: auDixieme(p.C.partDesComptes), tolerance: 0.1, calcul: `${qte(p.C.comptes)} ÷ ${qte(p.comptes)} × 100 = ${pct(p.C.partDesComptes)}` },
          { libelle: "Part du chiffre d'affaires en classe C (%)", attendu: auDixieme(p.C.part), tolerance: 0.1, calcul: `${eur(p.C.valeur)} ÷ ${eur(p.total)} × 100 = ${pct(p.C.part)}` },
        ];
      },
      explication: (c) => {
        const p = portefeuilleABC(c);
        return [
          `${pct(p.A.partDesComptes)} des comptes font ${pct(p.A.part)} des ventes ; ${pct(p.C.partDesComptes)} n'en font que ${pct(p.C.part)}. On dit souvent que 20 % des clients font 80 % du chiffre d'affaires : c'est un ordre de grandeur souvent observé, pas une loi. Ici, on en est proche, sans y être.`,
        ];
      },
    },
    {
      id: "concentration",
      type: "choix",
      titre: "Un portefeuille concentré ?",
      notions: ["customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `Chez ${p.entreprise}, ${pct(p.A.partDesComptes)} des comptes font ${pct(p.A.part)} des ventes, et le premier compte en pèse ${pct(p.premier.part)}. Que dire du portefeuille ?`;
      },
      options: (c) => {
        const p = portefeuilleABC(c);
        return [
          {
            texte: "Concentré, sans compte qui pèse trop à lui seul",
            juste: p.concentre && !p.risque,
            retour: `Oui : ${pct(p.A.partDesComptes)} des comptes font ${pct(p.A.part)} du chiffre d'affaires, près des 20/80 ; perdre un compte A serait un coup dur. Mais aucun ne pèse le quart des ventes : le premier en fait ${pct(p.premier.part)}, et il lui faudrait ${qte(p.journeesPourLeQuart)} journées pour y arriver.`,
          },
          {
            texte: "Peu concentré : les ventes se répartissent sur beaucoup de comptes",
            juste: !p.concentre,
            retour: `Non : ${pct(p.A.partDesComptes)} des comptes suffisent à faire ${pct(p.A.part)} des ventes, quand la moitié du portefeuille, la classe C, n'en fait que ${pct(p.C.part)}.`,
          },
          {
            texte: "Dangereux : le premier compte pèse trop lourd à lui seul",
            juste: p.concentre && p.risque,
            retour: `Non : le premier compte pèse ${pct(p.premier.part)} des ventes, loin du quart. Le risque est celui de la classe A entière, pas d'un compte.`,
          },
          {
            texte: "Conforme à la loi des 20/80, qui se vérifie toujours",
            juste: false,
            retour: `Non : les 20/80 sont un ordre de grandeur, pas une loi ; ici, ${pct(p.A.partDesComptes)} des comptes font ${pct(p.A.part)}. Chaque portefeuille se mesure, et la méthode ABC sert justement à cette mesure.`,
          },
        ];
      },
    },
    {
      id: "la-marge-d-un-compte",
      type: "montants",
      titre: "La marge d'un compte",
      notions: ["contribution_margin", "margin_rates"],
      question: (c) => {
        const p = portefeuilleABC(c);
        const s = p.sort;
        return `La marge d'un compte retire de son chiffre d'affaires ses frais et le temps des consultants qui le servent, à ${eur(p.coutJournalier)} la journée. Le ${s.nom} a acheté ${qte(s.journees)} journées pour ${eur(s.chiffreDAffaires)}, avec ${eur(s.frais)} de frais : ses sites sont loin du cabinet. Calculez le coût de ses journées de consultant, sa marge, puis son taux de marge (marge ÷ chiffre d'affaires), au dixième.`;
      },
      champs: (c) => {
        const p = portefeuilleABC(c);
        const s = p.sort;
        return [
          { libelle: "Coût des journées de consultant", attendu: p.coutDesConsultantsDuCompteQuiSort, calcul: `${qte(s.journees)} × ${eur(p.coutJournalier)} = ${eur(p.coutDesConsultantsDuCompteQuiSort)}` },
          { libelle: "Marge du compte", attendu: s.marge, calcul: `${eur(s.chiffreDAffaires)} − ${eur(s.frais)} − ${eur(p.coutDesConsultantsDuCompteQuiSort)} = ${eur(s.marge)}` },
          { libelle: "Taux de marge du compte (%)", attendu: auDixieme(p.tauxDeMargeDuCompteQuiSort), tolerance: 0.1, calcul: `${eur(s.marge)} ÷ ${eur(s.chiffreDAffaires)} × 100 = ${pct(p.tauxDeMargeDuCompteQuiSort)}` },
        ];
      },
      explication: (c) => {
        const p = portefeuilleABC(c);
        const s = p.sort;
        return [
          `Le ${s.nom}, ${qte(s.rang)}e compte par le chiffre d'affaires, ne laisse que ${eur(s.marge)}, ${pct(p.tauxDeMargeDuCompteQuiSort)} de ses ventes, quand le portefeuille en laisse ${pct(p.tauxDeMargeDuPortefeuille)}. Il a été gagné sur appel d'offres à ${eur(p.prixDuCompteQuiSort)} la journée, et ses frais montent à ${eur(p.fraisParJourneeDuCompteQuiSort)} par journée, contre ${eur(p.fraisParJourneeMoyens)} en moyenne au cabinet.`,
        ];
      },
    },
    {
      id: "predire-la-classe-a",
      type: "choix",
      titre: "Pariez sur la classe A par la marge",
      notions: ["customer_portfolio", "contribution_margin"],
      question: () => "Avant de reclasser, pariez. Classé par la marge de chaque compte au lieu de son chiffre d'affaires, le portefeuille aura une classe A…",
      options: (c) => {
        const p = portefeuilleABC(c);
        const changes = p.sortentDeA.length;
        const voir = "Reclassez le portefeuille au laboratoire, à l'étape suivante : le levier passe d'un critère à l'autre.";
        return [
          { texte: "Identique : les gros comptes sont aussi les plus rentables", juste: changes === 0, retour: `Pari à vérifier. ${voir}` },
          { texte: "Presque la même : un compte ou deux changent de classe", juste: changes >= 1 && changes <= 2, retour: `Bon pari. ${voir}` },
          { texte: "Toute différente : la marge ne suit pas les ventes", juste: changes > 2, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-portefeuille",
      type: "simulation",
      titre: "Le laboratoire du portefeuille",
      notions: ["customer_portfolio", "contribution_margin"],
      question: () =>
        "Choisissez le critère du classement, par le chiffre d'affaires ou par la marge, et faites varier le nombre de comptes retenus, du premier au dernier. Le tableau suit ce que pèsent les comptes retenus, en ventes et en marge ; le graphique trace les deux parts cumulées et le seuil de la classe A. Relevez le défi.",
      leviers: () => [
        {
          code: "critere",
          libelle: "Classement",
          unite: "",
          min: CRITERES_DU_LABORATOIRE.chiffreDAffaires,
          max: CRITERES_DU_LABORATOIRE.marge,
          pas: 1,
          depart: CRITERES_DU_LABORATOIRE.chiffreDAffaires,
          choix: [
            { valeur: CRITERES_DU_LABORATOIRE.chiffreDAffaires, libelle: "Par le chiffre d'affaires" },
            { valeur: CRITERES_DU_LABORATOIRE.marge, libelle: "Par la marge" },
          ],
        },
        { code: "comptes", libelle: "Comptes retenus", unite: "comptes", min: 1, max: 32, pas: 1, depart: 3 },
      ],
      lecture: (c, p) => {
        const x = laboratoireDuPortefeuille(c, p.critere!, p.comptes!);
        const d = laboratoireDuPortefeuille(c, CRITERES_DU_LABORATOIRE.chiffreDAffaires, 3);
        const parMarge = p.critere === CRITERES_DU_LABORATOIRE.marge;
        return [
          { libelle: `Dernier compte retenu : ${x.dernier.nom}`, montant: parMarge ? x.dernier.marge : x.dernier.chiffreDAffaires },
          { libelle: "Chiffre d'affaires des comptes retenus", montant: x.ca, reference: d.ca },
          { libelle: "Part cumulée du chiffre d'affaires", montant: auDixieme(x.partDuCa), unite: "%", reference: auDixieme(d.partDuCa) },
          { libelle: "Marge des comptes retenus", montant: x.marge, reference: d.marge },
          { libelle: "Part cumulée de la marge", montant: auDixieme(x.partDeLaMarge), unite: "%", reference: auDixieme(d.partDeLaMarge), fort: true },
        ];
      },
      graphique: (c) => ({
        levier: "comptes",
        unite: "%",
        courbes: [
          { libelle: "Part cumulée du chiffre d'affaires", valeur: (p) => auDixieme(laboratoireDuPortefeuille(c, p.critere!, p.comptes!).partDuCa) },
          { libelle: "Part cumulée de la marge", valeur: (p) => auDixieme(laboratoireDuPortefeuille(c, p.critere!, p.comptes!).partDeLaMarge) },
          { libelle: "Seuil de la classe A", valeur: () => auDixieme(ficheDe(c).seuilsABC.a) },
        ],
      }),
      defi: (c) => {
        const p = portefeuilleABC(c);
        const nA = p.parMarge.A.comptes;
        return {
          consigne: `Retrouvez la classe A par la marge : classez par la marge, et retenez le plus de comptes dont la part cumulée de la marge reste sous ${pct(p.seuils.a, 0)}.`,
          atteint: (x) => x.critere === CRITERES_DU_LABORATOIRE.marge && x.comptes === nA,
          indice: (x) => {
            if (x.critere !== CRITERES_DU_LABORATOIRE.marge) return "Le portefeuille est classé par le chiffre d'affaires : passez au classement par la marge.";
            const l = laboratoireDuPortefeuille(c, x.critere, x.comptes!);
            return l.cumul > p.seuils.a
              ? `La part cumulée de la marge atteint ${pct(l.cumul)}, au-delà de ${pct(p.seuils.a, 0)} : retirez des comptes.`
              : `La part cumulée de la marge n'est qu'à ${pct(l.cumul)} : le compte suivant la garde-t-il sous ${pct(p.seuils.a, 0)} ? Ajoutez-en.`;
          },
          solution: { critere: CRITERES_DU_LABORATOIRE.marge, comptes: nA },
        };
      },
      explication: (c) => {
        const p = portefeuilleABC(c);
        return [
          `Par la marge, la classe A compte ${qte(p.parMarge.A.comptes)} comptes, pour ${pct(p.parMarge.A.part)} de la marge. Mais ce ne sont pas tout à fait les mêmes : ${p.sortentDeA.map((k) => `le ${k.nom}`).join(", ")} en sort, ${p.entrentEnA.map((k) => `la ${k.nom}`).join(", ")} y entre.`,
          `Repassez par le chiffre d'affaires et regardez la courbe de la marge : au ${qte(p.sort.rang)}e compte, elle marque un palier. Ce compte fait ${pct(p.sort.part)} des ventes et seulement ${pct(p.sort.marge / p.margeTotale)} de la marge.`,
        ];
      },
    },
    {
      id: "la-classe-a-par-la-marge",
      type: "montants",
      titre: "La classe A par la marge",
      notions: ["customer_portfolio", "contribution_margin"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `Classez le portefeuille par la marge, qui fait ${eur(p.margeTotale)} en tout. Calculez la part cumulée de la marge des ${qte(p.parMarge.A.comptes)} premiers comptes, puis avec le suivant, en pourcentage au dixième ; puis la marge de la classe A par la marge, et celle que laissent les comptes A du classement par le chiffre d'affaires.`;
      },
      champs: (c) => {
        const p = portefeuilleABC(c);
        const a = p.parMarge.classes.A;
        const b = p.premierBParMarge;
        return [
          {
            libelle: `Part cumulée de la marge des ${qte(a.length)} premiers comptes (%)`,
            attendu: auDixieme(p.cumulDuDernierAParMarge),
            tolerance: 0.1,
            calcul: `${eur(p.margeDesAParMarge)} ÷ ${eur(p.margeTotale)} × 100 = ${pct(p.cumulDuDernierAParMarge)}`,
          },
          {
            libelle: `Part cumulée avec le ${qte(b.rang)}e compte (%)`,
            attendu: auDixieme(p.cumulDuPremierBParMarge),
            tolerance: 0.1,
            calcul: `(${eur(p.margeDesAParMarge)} + ${eur(b.marge)}) ÷ ${eur(p.margeTotale)} × 100 = ${pct(p.cumulDuPremierBParMarge)}`,
          },
          { libelle: "Marge de la classe A par la marge", attendu: p.margeDesAParMarge, calcul: `${a.map((k) => eur(k.marge)).join(" + ")} = ${eur(p.margeDesAParMarge)}` },
          {
            libelle: "Marge des comptes A par le chiffre d'affaires",
            attendu: p.margeDesAParCa,
            calcul: `${p.parCa.classes.A.map((k) => eur(k.marge)).join(" + ")} = ${eur(p.margeDesAParCa)}`,
          },
        ];
      },
      explication: (c) => {
        const p = portefeuilleABC(c);
        return [
          `Par la marge, la classe A s'arrête au ${qte(p.parMarge.A.comptes)}e compte : le ${qte(p.premierBParMarge.rang)}e, ${p.premierBParMarge.nom}, fait passer la part cumulée au-delà de ${pct(p.seuils.a, 0)}. Elle laisse ${eur(p.margeDesAParMarge)}, ${eur(p.margeDesAParMarge - p.margeDesAParCa)} de plus que les comptes A du chiffre d'affaires : à nombre de comptes égal, ce sont eux qui rapportent le plus.`,
        ];
      },
    },
    {
      id: "qui-sort-qui-entre",
      type: "choix",
      titre: "Le compte qui sort de la classe A",
      notions: ["customer_portfolio", "contribution_margin"],
      question: (c) => `Classé par la marge, le portefeuille ${dE(portefeuilleABC(c).entreprise)} change de classe A. Quel compte en sort, et lequel y entre ?`,
      options: (c) => {
        const p = portefeuilleABC(c);
        const sort = p.sort;
        const entre = p.entre;
        const g = p.parCa.comptes.find((k) => k.code === "granvaux")!;
        const h = p.parCa.comptes.find((k) => k.code === "helianthe")!;
        const dernierA = p.parCa.classes.A.at(-1)!;
        return [
          {
            texte: `${sort.nom} sort, ${entre.nom} entre`,
            juste: true,
            retour: `Oui : ${qte(sort.rang)}e par le chiffre d'affaires, le ${sort.nom} n'est que ${qte(p.rangDuCompteQuiSortParMarge)}e par la marge (${eur(sort.marge)}) ; la ${entre.nom}, ${qte(entre.rang)}e par le chiffre d'affaires, est ${qte(p.rangDuCompteQuiEntreParMarge)}e par la marge (${eur(entre.marge)}), payée au prix catalogue et servie tout près.`,
          },
          {
            texte: `${g.nom} sort, ${h.nom} entre`,
            juste: false,
            retour: `Non : la ${g.nom} reste en A par la marge (${eur(g.marge)}), juste devant ${h.nom} (${eur(h.marge)}), qui reste en B.`,
          },
          {
            texte: `${dernierA.nom} sort, ${entre.nom} entre`,
            juste: false,
            retour: `Non : ${dernierA.nom}, dernier compte A par le chiffre d'affaires, laisse ${eur(dernierA.marge)} et reste en A par la marge. Le compte qui sort est le ${sort.nom}, ${qte(sort.rang)}e par le chiffre d'affaires.`,
          },
          {
            texte: "Aucun : les mêmes comptes, dans un autre ordre",
            juste: false,
            retour: `Non : l'ordre change, et la classe aussi. Le ${sort.nom}, ${eur(sort.marge)} de marge, tombe au ${qte(p.rangDuCompteQuiSortParMarge)}e rang.`,
          },
        ];
      },
    },
    {
      id: "le-prix-de-valbrune",
      type: "curseur",
      titre: "Le prix qui ferait revenir le compte",
      notions: ["contribution_margin", "price_floor"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `Le contrat du ${p.sort.nom} se renégocie. Faites varier le prix de sa journée, frais et journées inchangés. Une droite donne sa marge, l'autre celle de la ${p.entre.nom} (${eur(p.entre.marge)}), le compte qui a pris sa place en A. Placez le curseur sur le plus petit prix où il en laisse autant, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix de la journée", unite: "€" }),
      cible: (c) => ({ attendu: portefeuilleABC(c).prixPourEgaler, min: PRIX_DE_VALBRUNE_AU_CURSEUR.min, max: PRIX_DE_VALBRUNE_AU_CURSEUR.max }),
      lecture: (c, prix) => {
        const p = portefeuilleABC(c);
        const ca = auCentime(prix * p.sort.journees);
        return [
          { libelle: "Chiffre d'affaires du compte", montant: ca },
          { libelle: "Frais et temps des consultants", montant: p.coutDuCompteQuiSort },
          { libelle: "Marge du compte", montant: auCentime(ca - p.coutDuCompteQuiSort) },
          { libelle: "Différence avec le compte qui l'a remplacé", montant: auCentime(ca - p.coutDuCompteQuiSort - p.entre.marge), fort: true },
        ];
      },
      droites: (c) => {
        const p = portefeuilleABC(c);
        return {
          produit: (prix) => prix * p.sort.journees - p.coutDuCompteQuiSort,
          cout: () => p.entre.marge,
          libelles: [`Marge du ${p.sort.nom}`, `Marge de la ${p.entre.nom}`],
        };
      },
      zones: ["Autant que le compte qui l'a remplacé", "Moins que lui"],
      rates: () => ({
        dessous: "À ce prix, le compte laisse encore moins que celui qui l'a remplacé.",
        dessus: "À un prix plus bas, le compte laisse déjà autant : cherchez le plus petit prix.",
      }),
      montrer: "Montrer le prix",
      explication: (c) => {
        const p = portefeuilleABC(c);
        const g = p.parCa.comptes.find((k) => k.code === "granvaux")!;
        return [
          `Il faudrait ${eur(p.prixPourEgaler)} la journée, ${eur(p.prixPourEgaler - p.prixDuCompteQuiSort)} de plus qu'aujourd'hui : chaque euro de prix sur ${qte(p.sort.journees)} journées rend ${eur(p.sort.journees)} de marge. C'est le prix que paie déjà ${g.nom.replace(/^Métropole/, "la Métropole")}, l'autre grande collectivité du portefeuille.`,
          `Le prix n'est pas le seul levier : ses frais montent à ${eur(p.fraisParJourneeDuCompteQuiSort)} par journée, contre ${eur(p.fraisParJourneeMoyens)} en moyenne. La variante suivante joue sur le prix et sur les frais.`,
        ];
      },
    },
    {
      id: "valbrune-renegocie",
      type: "montants",
      titre: "Variante : le contrat renégocié",
      notions: ["contribution_margin", "customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        const v = p.variante;
        return `Variante : au renouvellement, le cabinet propose ${eur(v.prix)} la journée au ${p.sort.nom}, et regroupe les sessions sur deux sites, ce qui ramène ses frais à ${eur(v.fraisParJournee)} par journée. Les ${qte(p.sort.journees)} journées ne changent pas. Calculez le nouveau chiffre d'affaires du compte, ses frais, sa marge, puis son taux de marge, au dixième.`;
      },
      champs: (c) => {
        const p = portefeuilleABC(c);
        const v = p.variante;
        const j = p.sort.journees;
        return [
          { libelle: "Chiffre d'affaires renégocié", attendu: v.chiffreDAffaires, calcul: `${qte(j)} × ${eur(v.prix)} = ${eur(v.chiffreDAffaires)}` },
          { libelle: "Frais renégociés", attendu: v.frais, calcul: `${qte(j)} × ${eur(v.fraisParJournee)} = ${eur(v.frais)}` },
          { libelle: "Marge renégociée", attendu: v.marge, calcul: `${eur(v.chiffreDAffaires)} − ${eur(v.frais)} − ${qte(j)} × ${eur(p.coutJournalier)} = ${eur(v.marge)}` },
          { libelle: "Taux de marge renégocié (%)", attendu: auDixieme(v.tauxDeMarge), tolerance: 0.1, calcul: `${eur(v.marge)} ÷ ${eur(v.chiffreDAffaires)} × 100 = ${pct(v.tauxDeMarge)}` },
        ];
      },
      explication: (c) => {
        const p = portefeuilleABC(c);
        const v = p.variante;
        return [
          `${eur(v.prix - p.prixDuCompteQuiSort)} de plus et ${eur(p.fraisParJourneeDuCompteQuiSort - v.fraisParJournee)} de frais en moins par journée font passer la marge de ${eur(p.sort.marge)} à ${eur(v.marge)}. Reclassé par la marge, le compte serait ${qte(v.rang)}e, en classe ${v.classe}. Un compte A par le chiffre d'affaires qui ne l'est pas par la marge n'est pas un compte à abandonner : c'est un contrat à renégocier.`,
        ];
      },
    },
    {
      id: "la-valeur-vie-des-comptes",
      type: "choix",
      titre: "Ce que le classement d'une année ne voit pas",
      notions: ["customer_portfolio", "customer_lifetime_value", "churn_rate"],
      tableau: (c) => {
        const p = portefeuilleABC(c);
        return {
          titre: "Marge de l'année et valeur vie de quelques comptes",
          colonnes: ["Marge de N", "Risque de perte l'an prochain", "Valeur vie (marge ÷ risque)"],
          lignes: p.valeursVie.map((k) => ({ libelle: k.nom, valeurs: [eur(k.marge), pct(k.attrition, 0), eur(k.valeurVie)] })),
        };
      },
      question: () =>
        "Chaque commercial estime le risque de perdre chacun de ses comptes l'an prochain. Si ce risque reste le même chaque année, un compte rapporte en moyenne sa marge ÷ son risque sur sa vie. Que dit ce tableau que le classement ABC ne dit pas ?",
      options: (c) => {
        const p = portefeuilleABC(c);
        const v = (code: string) => p.valeursVie.find((k) => k.code === code)!;
        const sort = v(COMPTE_QUI_SORT);
        const entre = v(COMPTE_QUI_ENTRE);
        const neuf = v("helianthe");
        return [
          {
            texte: "La durée du compte : un petit compte fidèle peut valoir bien plus qu'un gros",
            juste: true,
            retour: `Oui : le classement d'une année ne voit pas combien de temps le compte restera. La ${entre.nom} vaut ${eur(entre.valeurVie)} sur sa vie, plus de ${qte(Math.floor(entre.valeurVie / sort.valeurVie))} fois le ${sort.nom} (${eur(sort.valeurVie)}), qui fait pourtant ${qte(Math.round((p.sort.chiffreDAffaires / p.entre.chiffreDAffaires) * 10) / 10)} fois ses ventes. Un portefeuille se pilote aussi à la fidélité.`,
          },
          {
            texte: "Rien de plus : la marge de l'année résume la valeur du compte",
            juste: false,
            retour: `Non : à marge égale, un compte que l'on garde longtemps vaut bien plus qu'un compte perdu l'an prochain. La ${entre.nom} et ${neuf.nom} laissent des marges proches (${eur(entre.marge)} et ${eur(neuf.marge)}), et des valeurs vie de ${eur(entre.valeurVie)} et ${eur(neuf.valeurVie)}.`,
          },
          {
            texte: "Que les plus gros comptes sont aussi les plus sûrs",
            juste: false,
            retour: `Non : le ${sort.nom}, ${qte(p.sort.rang)}e par le chiffre d'affaires, a un risque de ${pct(sort.attrition, 0)} : celui des plus petits comptes. La taille ne protège pas de la perte.`,
          },
          {
            texte: "Que les comptes neufs valent moins que les anciens",
            juste: false,
            retour: `Non : ${neuf.nom}, gagné dans l'année, vaut ${eur(neuf.valeurVie)} sur sa vie, plus que le ${sort.nom}, client depuis ${qte(p.sort.anciennete)} ans (${eur(sort.valeurVie)}).`,
          },
        ];
      },
    },
    {
      id: "traiter",
      type: "choix",
      titre: "Que faire de chaque classe",
      notions: ["customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `Les ${qte(p.C.comptes)} comptes de la classe C font ${pct(p.C.part)} du chiffre d'affaires, et les ${qte(p.conquete.length)} comptes gagnés par la conquête sont tous en classe ${[...new Set(p.conquete.map((k) => k.classe))].join(" ou ")}. Que fait l'équipe commerciale ${dE(p.entreprise)} ?`;
      },
      options: (c) => {
        const p = portefeuilleABC(c);
        return [
          {
            texte: "Elle suit les A de près, fait grandir les B, sert les C à moindre coût",
            juste: true,
            retour: `Oui : un compte A justifie des visites et un interlocuteur attitré ; les B, dont les ${qte(p.conquete.length)} comptes neufs de la conquête, sont ceux qui peuvent grandir ; un compte C ne justifie pas ce temps, mais il rapporte : on le sert à distance, avec une offre standard, et on repère ceux qui pourraient monter.`,
          },
          {
            texte: "Elle abandonne les C, pour se concentrer sur les comptes A",
            juste: false,
            retour: `Non : les comptes C laissent ${eur(p.margeDesCParCa)} de marge, et certains seront les B de demain. Les abandonner, c'est renoncer à cette marge pour un temps qu'on peut gagner autrement, en les servant à distance.`,
          },
          {
            texte: "Elle consacre autant de temps à chaque compte, par équité",
            juste: false,
            retour: "Non : le temps d'un commercial est rare. Le même temps passé sur un compte A, qui pèse bien plus, rapporte bien davantage. La méthode ABC sert à répartir ce temps.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_portfolio", "contribution_margin", "customer_lifetime_value"],
      texte: (c) => {
        const p = portefeuilleABC(c);
        return [
          `Chez ${p.entreprise}, ${qte(p.A.comptes)} comptes sur ${qte(p.comptes)} font ${pct(p.A.part)} des ventes : un portefeuille concentré, près des 20/80, où aucun compte ne pèse le quart à lui seul. La moitié du portefeuille, la classe C, ne fait que ${pct(p.C.part)} des ventes.`,
          `Le classement par le chiffre d'affaires ne suffit pas. Par la marge, la classe A change : le ${p.sort.nom}, ${qte(p.sort.rang)}e par les ventes, n'est que ${qte(p.rangDuCompteQuiSortParMarge)}e par la marge, et la ${p.entre.nom} prend sa place. Un gros compte qui rapporte peu n'est pas à abandonner : c'est un contrat à renégocier, sur le prix et sur les frais. Et un classement est la photographie d'une année : il ne voit ni la durée d'un compte, ni ce qu'il deviendra.`,
          "Au niveau de l'examen, vous savez classer un portefeuille par la méthode ABC, mesurer sa concentration et le poids d'un compte, calculer la marge d'un compte et reclasser le portefeuille par la marge, expliquer ce qui change, et critiquer la méthode.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: (c) => {
        const p = portefeuilleABC(c);
        return `Méthode ABC : trier les comptes par le critère décroissant (chiffre d'affaires, ou marge), cumuler les parts, couper à ${pct(p.seuils.a, 0)} (A) et ${pct(p.seuils.b, 0)} (B), le reste en C. Marge d'un compte = chiffre d'affaires − frais − journées × coût journalier d'un consultant.`;
      },
    },
  ],
};
