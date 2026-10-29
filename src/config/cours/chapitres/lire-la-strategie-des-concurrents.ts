import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { anneeDuMarche, carteDuMarche, enseigneDe, gammeDe, gammePourLaQualite, type StrategieLue } from "../monde/attractivite";
import type { CodeDeGamme, FicheDuMarche } from "../monde/marche-a-trois";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_MARCHE_A_TROIS, ficheDe } from "./couts-ou-differenciation";

/**
 * CHAPITRE : LIRE LA STRATÉGIE DE SES CONCURRENTS (Stratégie et management, palier 2 ; STMG, DCG
 * UE7, BUT TC).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le marché des
 * enceintes, où NOVA affronte SoundBox et Auris, a une fiche figée (monde/marche-a-trois.ts) et un
 * modèle simple (monde/attractivite.ts, `carteDuMarche`). Le chapitre se jouait dans plusieurs
 * marchés de l'arène ; il se joue désormais chez NOVA seule, la même PME que dans le reste du cours.
 *
 * Ce que chaque enseigne fait dans l'année de la simulation dit la stratégie qu'elle suit : son
 * prix, la qualité que les clients lui reconnaissent (celle de son offre, tenue toute l'année : la
 * gamme et le budget qualité), ses budgets de qualité, de communication et de RSE, sa part du marché
 * et ce qu'elle gagne. L'élève place les trois enseignes sur une carte prix / qualité (deux indices,
 * base 100 la moyenne du marché), reconnaît la stratégie de chacune, voit que le prix seul ne déplace
 * une enseigne que sur un axe et que la moyenne bouge avec elle, mesure l'espace libre sur les deux
 * indices, écarte les coins vides qui ne sont pas des places à prendre, et cherche au laboratoire
 * l'offre qui fait lire NOVA en différenciation avec un meilleur résultat.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, carte, strategies (la formule est au repère ou dans la question, la règle de
 *     lecture est donnée), la-qualite-qu-il-faut ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-prix-seul
 *     puis le-prix-au-curseur (le prix qui passe la barre de l'indice 105, sans bouger l'indice de
 *     qualité) avant la-qualite-qu-il-faut ; predire-la-reussite puis le-volume-de-soundbox (les
 *     ventes qu'il faudrait à SoundBox pour gagner autant qu'Auris) avant les-resultats ;
 *     predire-l-offre puis le-laboratoire-de-la-carte (prix, gamme, budget qualité) avant
 *     une-autre-annee ;
 *   · autonome : les-resultats, reussite, l-espace-libre, espace (ni formule ni chiffres à prendre
 *     dans la question ; le calcul de la correction montre le chemin) ;
 *   · expert : les-coins-vides (un diagnostic chiffré : pourquoi deux coins vides de la carte ne sont
 *     pas des places à prendre), le-laboratoire-de-la-carte, une-autre-annee (une variante chiffrée :
 *     la carte refaite l'année où NOVA va dans l'espace libre avec la gamme soignée ; le prix moyen
 *     monte avec elle) ; puis la synthèse.
 */

export const CATEGORIES_DE_STRATEGIE: readonly { code: StrategieLue; libelle: string }[] = [
  { code: "couts", libelle: "Coûts" },
  { code: "differenciation", libelle: "Différenciation" },
  { code: "intermediaire", libelle: "Intermédiaire" },
];

export const NOMS_DES_STRATEGIES_LUES: Record<StrategieLue, string> = {
  couts: "la domination par les coûts",
  differenciation: "la différenciation",
  intermediaire: "une position intermédiaire",
};

/** Les bornes du curseur du prix de NOVA, en euros. */
export const PRIX_DU_CURSEUR = { min: 55, max: 80 } as const;

/** Les bornes du curseur des ventes de SoundBox sur l'année. */
export const VENTES_DU_CURSEUR_DE_SOUNDBOX = { min: 28_000, max: 40_000 } as const;

/** Le laboratoire : le prix de vente (au pas d'un euro) et le budget qualité par trimestre (au pas de 1 000 €). */
export const PRIX_DU_LABORATOIRE = { min: 50, max: 80, pas: 1 } as const;
export const BUDGET_DU_LABORATOIRE = { min: 0, max: 16_000, pas: 1_000 } as const;

/** La gamme du laboratoire est un levier à choix : 0, 1 ou 2 désigne la gamme standard, actuelle ou soignée. */
export const GAMMES_DU_LABORATOIRE: readonly CodeDeGamme[] = ["standard", "actuelle", "soignee"];

/** Le budget qualité doublé, au pari de l'offre : NOVA garde sa gamme et double sa prévention. */
export const BUDGET_QUALITE_DOUBLE = 8_000;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number) => `${qte(Math.round(x * 10_000) / 100)} %`;
const dec = (x: number, n = 2) => x.toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const signe = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
/** « de NOVA », « d'Auris » : l'élision devant une voyelle. */
export const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « que NOVA », « qu'Auris ». */
export const quE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);

/** La carte d'une année où NOVA tient une position du laboratoire : prix, gamme (0, 1 ou 2), budget qualité. */
export function laboratoireDeLaCarte(f: FicheDuMarche, p: Readonly<Record<string, number>>) {
  return carteDuMarche(f, { nova: { prix: p.prix!, gamme: GAMMES_DU_LABORATOIRE[p.gamme!]!, budgetQualite: p.qualite! } });
}

function calculer(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const carte = carteDuMarche(f);
  const a = carte.annee;
  const ecart = f.carte.ecartDUneStrategie;
  const enseignes = a.enseignes.map((e, i) => ({ ...e, ...carte.enseignes[i]!, bilan: e }));
  const [nova, soundbox, auris] = enseignes as [(typeof enseignes)[number], (typeof enseignes)[number], (typeof enseignes)[number]];
  // Le curseur du prix : au prix moyen d'aujourd'hui, le plus petit prix au-dessus de l'indice 100 + écart.
  const prixDuSeuil = ((100 + ecart) / 100) * carte.prixMoyen;
  const prixQuiPasse = Math.ceil(prixDuSeuil - 1e-9);
  // La même hausse, la carte refaite : le prix moyen monte avec NOVA.
  const carteAuPrixQuiPasse = carteDuMarche(f, { nova: { prix: prixQuiPasse } });
  // La qualité : la moyenne bouge avec NOVA ; elle la dépasse dès qu'elle dépasse celle des deux autres.
  const qualiteDesConcurrents = auCentime((soundbox.qualite + auris.qualite) / 2);
  const carteEnSoignee = carteDuMarche(f, { nova: { gamme: "soignee" } });
  const carteEnStandard = carteDuMarche(f, { nova: { gamme: "standard" } });
  // SoundBox : les ventes qu'il lui faudrait pour gagner autant qu'Auris.
  const sb = soundbox.bilan;
  const ventesDeSoundbox = Math.ceil((auris.bilan.resultat + sb.charges) / sb.margeUnitaire - 1e-9);
  // Les deux coins vides : le prix d'Auris avec la gamme d'aujourd'hui ; la gamme soignée au prix d'aujourd'hui.
  const coinCher = anneeDuMarche(f, { nova: { prix: auris.offre.prix } }).nova;
  const coinGenereux = anneeDuMarche(f, { nova: { gamme: "soignee" } }).nova;
  // L'espace libre et sa variante : NOVA à la place, avec la gamme qui l'amène à sa qualité.
  const place = carte.espaceLibre;
  const gammeDeLaPlace = gammePourLaQualite(f, place.qualite) ?? "soignee";
  const carteALaPlace = carteDuMarche(f, { nova: { prix: place.prix, gamme: gammeDeLaPlace } });
  const carteAuPrixSeul = carteDuMarche(f, { nova: { prix: place.prix } });
  const meilleure = carte.meilleure;
  // Le pari de l'offre : trois offres, une seule est lue en différenciation avec un meilleur résultat.
  const reussit = (p: Readonly<Record<string, number>>) => {
    const k = laboratoireDeLaCarte(f, p);
    return k.nova.lecture === "differenciation" && k.annee.nova.resultat > a.nova.resultat;
  };
  const depart = { prix: nova.offre.prix, gamme: GAMMES_DU_LABORATOIRE.indexOf("actuelle"), qualite: nova.offre.budgetQualite };
  const paris = {
    prixSeul: reussit({ ...depart, prix: place.prix }),
    gamme: reussit({ ...depart, prix: place.prix, gamme: GAMMES_DU_LABORATOIRE.indexOf(gammeDeLaPlace) }),
    budget: reussit({ ...depart, qualite: BUDGET_QUALITE_DOUBLE }),
  };
  return {
    f,
    carte,
    annee: a,
    enseignes,
    nova,
    soundbox,
    auris,
    concurrents: [soundbox, auris],
    ecart,
    prixDuSeuil,
    prixQuiPasse,
    carteAuPrixQuiPasse,
    qualiteDesConcurrents,
    carteEnSoignee,
    carteEnStandard,
    ventesDeSoundbox,
    coinCher,
    coinGenereux,
    place,
    gammeDeLaPlace,
    carteALaPlace,
    carteAuPrixSeul,
    meilleure,
    reussit,
    depart,
    paris,
  };
}

const memo = new Map<string, ReturnType<typeof calculer>>();

/** La carte du marché d'aujourd'hui et ce que le chapitre et son cas en tirent. */
export function strategiesDesConcurrents(c: Pick<Cas, "code">) {
  const deja = memo.get(c.code);
  if (deja) return deja;
  const x = calculer(c);
  memo.set(c.code, x);
  return x;
}

export type StrategiesDesConcurrents = ReturnType<typeof strategiesDesConcurrents>;
type Enseigne = StrategiesDesConcurrents["enseignes"][number];

/** Ce que chaque enseigne a fait dans l'année : le document de départ. */
function tableauDeLAnnee(c: Pick<Cas, "code">): TableauDeDonnees {
  const k = strategiesDesConcurrents(c);
  return {
    titre: "L'année de la simulation du cours, enseigne par enseigne",
    colonnes: k.enseignes.map((e) => e.nom),
    lignes: [
      { libelle: `Ventes de l'année (${k.f.unites})`, valeurs: k.enseignes.map((e) => qte(e.ventes)) },
      { libelle: "Chiffre d'affaires de l'année", valeurs: k.enseignes.map((e) => eur(e.bilan.chiffreDAffaires)) },
      { libelle: "Prix de vente", valeurs: k.enseignes.map((e) => eur(e.offre.prix)) },
      { libelle: "Qualité perçue", valeurs: k.enseignes.map((e) => dec(e.qualite)) },
      { libelle: "Budget qualité par trimestre", valeurs: k.enseignes.map((e) => eur(e.offre.budgetQualite)) },
      { libelle: "Communication par trimestre", valeurs: k.enseignes.map((e) => eur(e.offre.budgetCommunication)) },
      { libelle: "Budget RSE par trimestre", valeurs: k.enseignes.map((e) => eur(e.offre.budgetRse)) },
      { libelle: "Part de marché", valeurs: k.enseignes.map((e) => pct(e.part)) },
      { libelle: "Résultat de l'année", valeurs: k.enseignes.map((e) => eur(e.resultat)) },
    ],
  };
}

/** La carte : les deux indices de chaque enseigne. */
function tableauDeLaCarte(c: Pick<Cas, "code">): TableauDeDonnees {
  const k = strategiesDesConcurrents(c);
  return {
    titre: "La carte prix / qualité du marché (base 100 : la moyenne)",
    colonnes: k.enseignes.map((e) => e.nom),
    lignes: [
      { libelle: "Indice de prix", valeurs: k.enseignes.map((e) => qte(e.indicePrix)) },
      { libelle: "Indice de qualité", valeurs: k.enseignes.map((e) => qte(e.indiceQualite)) },
    ],
  };
}

const lecturePourQui = (e: Pick<Enseigne, "indicePrix" | "indiceQualite" | "lecture">) =>
  `prix ${qte(e.indicePrix)}, qualité ${qte(e.indiceQualite)} : ${NOMS_DES_STRATEGIES_LUES[e.lecture]}`;

export const LIRE_LA_STRATEGIE_DES_CONCURRENTS: Chapitre = {
  code: "lire-la-strategie-des-concurrents",
  parcours: "strategie",
  palier: 2,
  blocs: [
    "STMG Thème 3 · Les choix stratégiques des organisations",
    "DCG UE7 · Management des organisations",
    "BUT TC · Participer à la stratégie marketing et commerciale de l'organisation",
  ],
  titre: "Lire la stratégie de ses concurrents",
  accroche:
    "Leurs prix, la qualité que leur reconnaissent les clients, ce qu'ils dépensent et ce qu'ils gagnent : ce que chaque concurrent fait dans l'année dit sa stratégie. Placer chacun sur la carte du marché, mesurer l'espace libre sur ses deux axes, et voir ce qu'il faut pour s'y tenir.",
  objectifs: [
    "Calculer un indice de prix et un indice de qualité",
    "Situer l'entreprise et ses concurrents sur une carte prix / qualité",
    "Reconnaître la stratégie de chaque concurrent : coûts, différenciation ou position intermédiaire",
    "Mesurer l'espace libre du marché sur les deux indices, et écarter les coins vides",
    "Dire quelle stratégie a réussi, et pourquoi la part de marché ne le dit pas",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_MARCHE_A_TROIS,
    pourquoi:
      "ce chapitre lit la carte du marché des enceintes de la simulation du cours, où NOVA, la PME du reste du cours, affronte deux concurrents que la simulation fait jouer, SoundBox et Auris.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que chaque enseigne fait dans l'année",
      notions: ["demand_market_share", "segmentation"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const k = strategiesDesConcurrents(c);
        const f = k.f;
        const at = f.attractivite;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, sur une année type : l'année de la simulation du cours, faite de trimestres égaux, qui n'est ni l'année N ni l'année N + 1 des autres chapitres. ${f.entreprise} y affronte ${k.soundbox.nom} et ${k.auris.nom}. Une stratégie ne s'annonce pas : elle se lit dans ce que chaque enseigne fait.`,
          `Chaque trimestre, les clients achètent ${qte(f.marche.parTrimestre)} ${f.unites} aux trois enseignes, et chacune en prend une part égale à son attractivité rapportée à la somme des trois : (${qte(at.prixDeReference)} ÷ prix) puissance ${at.elasticiteAuPrix} × qualité perçue puissance ${at.elasticiteALaQualite} × (1 + image). Le marché ne grandit pas, et les enseignes ne réagissent pas les unes aux autres : chacune tient son offre toute l'année.`,
          "Le tableau donne, pour chacune, ses ventes et son chiffre d'affaires de l'année, la qualité que ses clients lui reconnaissent (celle de sa gamme et de son budget qualité, tenus toute l'année ; 1 est la qualité de l'enceinte d'aujourd'hui), ce qu'elle dépense chaque trimestre en qualité, en communication et en RSE, sa part du marché et son résultat avant impôt.",
        ];
      },
      repere: () =>
        "Indice de prix = prix de l'enseigne ÷ prix moyen du marché × 100. Indice de qualité = qualité perçue ÷ qualité moyenne × 100. Au-dessus de 100, l'enseigne est plus chère, ou jugée meilleure, que la moyenne.",
    },
    {
      id: "carte",
      type: "montants",
      titre: "Situer l'entreprise sur la carte",
      notions: ["demand_market_share", "price_elasticity"],
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `Le prix moyen du marché est ce que les clients des trois enseignes ont payé en moyenne : leur chiffre d'affaires réuni, divisé par leurs ventes réunies. La qualité moyenne est la moyenne des trois qualités perçues. Calculez-les, au centime et au centième, puis les deux indices ${dE(k.f.entreprise)}, à l'unité (${k.f.entreprise} vend à ${eur(k.nova.offre.prix)}, avec une qualité perçue de ${dec(k.nova.qualite)}).`;
      },
      champs: (c) => {
        const k = strategiesDesConcurrents(c);
        const e = k.nova;
        return [
          { libelle: "Prix moyen du marché", attendu: k.carte.prixMoyen, calcul: `${eur(k.carte.chiffreDAffaires)} ÷ ${qte(k.carte.ventes)} = ${eur(k.carte.prixMoyen)}` },
          { libelle: `Indice de prix ${dE(k.f.entreprise)}`, attendu: e.indicePrix, calcul: `${eur(e.offre.prix)} ÷ ${eur(k.carte.prixMoyen)} × 100 = ${qte(e.indicePrix)}`, tolerance: 1 },
          {
            libelle: "Qualité moyenne du marché",
            attendu: k.carte.qualiteMoyenne,
            calcul: `(${k.enseignes.map((x) => dec(x.qualite)).join(" + ")}) ÷ ${k.enseignes.length} = ${dec(k.carte.qualiteMoyenne)}`,
          },
          { libelle: `Indice de qualité ${dE(k.f.entreprise)}`, attendu: e.indiceQualite, calcul: `${dec(e.qualite)} ÷ ${dec(k.carte.qualiteMoyenne)} × 100 = ${qte(e.indiceQualite)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const e = k.nova;
        const prix = e.indicePrix > 100 ? "plus chère que la moyenne" : e.indicePrix < 100 ? "un peu moins chère que la moyenne" : "au prix moyen";
        const qualite = e.indiceQualite > 100 ? "jugée meilleure que la moyenne" : e.indiceQualite < 100 ? "jugée moins bonne que la moyenne" : "jugée comme la moyenne";
        return [
          `Sur la carte, ${k.f.entreprise} se place à ${qte(e.indicePrix)} en prix et ${qte(e.indiceQualite)} en qualité : ${prix}, et ${qualite}. Le point 100, 100 est le centre de la carte : la moyenne du marché.`,
          `Le prix moyen du marché pèse chaque enseigne par ses ventes : ${k.soundbox.nom}, qui vend le plus, le tire vers son prix. La qualité moyenne, elle, compte chaque enseigne une fois.`,
        ];
      },
    },
    {
      id: "strategies",
      type: "tri",
      titre: "La stratégie de chacun",
      notions: ["segmentation", "demand_market_share"],
      tableau: tableauDeLaCarte,
      question: (c) => {
        const e = strategiesDesConcurrents(c).ecart;
        return `Rangez chaque enseigne, montrée à son prix. Elle suit la domination par les coûts si son indice de prix est sous ${100 - e} et son indice de qualité sous 100 ; la différenciation, si son indice de prix dépasse ${100 + e} et son indice de qualité 100 ; sinon, elle tient une position intermédiaire.`;
      },
      categories: CATEGORIES_DE_STRATEGIE,
      elements: (c) => {
        const k = strategiesDesConcurrents(c);
        return k.enseignes.map((x) => ({
          libelle: x.nom,
          montant: x.offre.prix,
          categorie: x.lecture,
          pourquoi: `${lecturePourQui(x).charAt(0).toUpperCase()}${lecturePourQui(x).slice(1)}. Budget qualité de ${eur(x.offre.budgetQualite)} par trimestre, communication de ${eur(x.offre.budgetCommunication)}, RSE de ${eur(x.offre.budgetRse)}.`,
        }));
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const parStrategie = (s: StrategieLue) => k.enseignes.filter((x) => x.lecture === s).map((x) => x.nom);
        const couts = parStrategie("couts");
        const diff = parStrategie("differenciation");
        const budgets = k.enseignes.map((x) => x.offre.budgetQualite);
        const confirment =
          k.enseignes.every((x) => x.lecture !== "couts" || x.offre.budgetQualite === Math.min(...budgets)) &&
          k.enseignes.every((x) => x.lecture !== "differenciation" || x.offre.budgetQualite === Math.max(...budgets));
        const engagees = k.enseignes.filter((x) => x.offre.budgetRse > 0).map((x) => x.nom);
        const rse = engagees.length === 1 ? [`Et ${engagees[0]} est la seule enseigne engagée en RSE : son image fait partie de ce qu'elle vend.`] : [];
        return [
          `${couts.length > 0 ? `${couts.join(" et ")} ${couts.length > 1 ? "suivent" : "suit"} la domination par les coûts` : "Aucune enseigne ne suit la domination par les coûts"} ; ${diff.length > 0 ? `${diff.join(" et ")} ${diff.length > 1 ? "suivent" : "suit"} la différenciation` : "aucune ne suit la différenciation"}.`,
          confirment
            ? ["Les budgets confirment la carte : la stratégie de coûts met le moins en qualité, la différenciation le plus.", ...rse, "On ne différencie pas une offre sans payer sa qualité."].join(" ")
            : "Les budgets ne suivent pas tout à fait la carte : la qualité perçue vient surtout de la gamme, peu du budget qualité.",
        ];
      },
    },
    {
      id: "predire-le-prix-seul",
      type: "choix",
      titre: "Pariez sur le prix seul",
      notions: ["segmentation", "price_elasticity"],
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `Avant de calculer, pariez. ${k.f.entreprise} monte son prix sans rien changer à son enceinte. La carte finira-t-elle par la lire en différenciation ?`;
      },
      options: (c) => {
        const k = strategiesDesConcurrents(c);
        const voir = "Faites varier le prix à l'étape suivante : le curseur montre ce qui bouge sur la carte, et ce qui ne bouge pas.";
        const jamais = k.nova.indiceQualite <= 100;
        return [
          { texte: `Oui, dès que son indice de prix dépasse ${100 + k.ecart}`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non : son indice de qualité resterait sous 100", juste: jamais, retour: `${jamais ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: `Oui, si elle vend plus cher ${quE(k.auris.nom)}`, juste: !jamais, retour: `${!jamais ? "Bon pari." : "Pari à vérifier."} ${voir}` },
        ];
      },
    },
    {
      id: "le-prix-au-curseur",
      type: "curseur",
      titre: "Le prix qui passe la barre",
      notions: ["segmentation", "price_elasticity"],
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `Faites varier le prix ${dE(k.f.entreprise)} de ${eur(PRIX_DU_CURSEUR.min)} à ${eur(PRIX_DU_CURSEUR.max)}, le prix moyen du marché tenu à celui d'aujourd'hui (${eur(k.carte.prixMoyen)}). Une droite donne le prix ${dE(k.f.entreprise)}, l'autre le prix qui fait l'indice ${100 + k.ecart}. Placez le curseur sur le plus petit prix qui passe au-dessus de l'indice ${100 + k.ecart}, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix de vente", unite: "€" }),
      cible: (c) => {
        const k = strategiesDesConcurrents(c);
        return { attendu: k.prixQuiPasse, min: PRIX_DU_CURSEUR.min, max: PRIX_DU_CURSEUR.max };
      },
      zones: ["Au-dessus de la barre en prix", "Sous la barre en prix"],
      rates: (c) => {
        const k = strategiesDesConcurrents(c);
        return {
          dessous: `À ce prix, l'indice de prix ne dépasse pas encore ${100 + k.ecart}.`,
          dessus: `Plus bas, l'indice de prix dépasse encore ${100 + k.ecart} : cherchez le plus petit prix.`,
        };
      },
      montrer: "Montrer la barre",
      lecture: (c, p) => {
        const k = strategiesDesConcurrents(c);
        return [
          { libelle: "Prix de vente", montant: p },
          { libelle: "Prix moyen du marché, tenu", montant: k.carte.prixMoyen },
          { libelle: `Prix de l'indice ${100 + k.ecart}`, montant: auCentime(k.prixDuSeuil) },
          { libelle: "Au-dessus de la barre de", montant: auCentime(p - k.prixDuSeuil), fort: true },
        ];
      },
      droites: (c) => {
        const k = strategiesDesConcurrents(c);
        return { produit: (p) => p, cout: () => k.prixDuSeuil, libelles: [`Prix ${dE(k.f.entreprise)}`, `Prix de l'indice ${100 + k.ecart}`] };
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const vraie = k.carteAuPrixQuiPasse.nova;
        return [
          `À ${eur(k.prixQuiPasse)}, l'indice de prix ${dE(k.f.entreprise)} passerait à ${qte(Math.round((k.prixQuiPasse / k.carte.prixMoyen) * 100))}, au-dessus de ${100 + k.ecart}. Mais son indice de qualité ne bouge pas : ${qte(k.nova.indiceQualite)}, sous 100. Le prix ne déplace une enseigne que sur un axe de la carte : ${k.f.entreprise} serait une enseigne chère, pas une enseigne différenciée.`,
          `Et le prix moyen n'est pas tenu dans la vraie année : il monte avec ${k.f.entreprise}. Rejouée à ${eur(k.prixQuiPasse)}, l'année donne un prix moyen de ${eur(k.carteAuPrixQuiPasse.prixMoyen)}, et ${k.f.entreprise} à ${qte(vraie.indicePrix)} en prix : un indice se lit toujours face aux autres. Reste la qualité, que l'étape suivante fait calculer.`,
        ];
      },
    },
    {
      id: "la-qualite-qu-il-faut",
      type: "montants",
      titre: "La qualité qu'il faut",
      notions: ["segmentation"],
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        const s = gammeDe(k.f, "soignee");
        return `Pour être lue en différenciation, ${k.f.entreprise} doit aussi dépasser 100 en qualité. Mais la qualité moyenne bouge avec la sienne : ${k.f.entreprise} dépasse la moyenne des trois dès qu'elle dépasse celle des deux autres. Calculez la qualité moyenne ${dE(k.soundbox.nom)} et ${dE(k.auris.nom)}, au centième ; puis, si ${k.f.entreprise} montait ${s.nom} (${dec(s.qualiteDeConception)} de qualité perçue au budget d'aujourd'hui), la qualité moyenne du marché et son indice de qualité.`;
      },
      champs: (c) => {
        const k = strategiesDesConcurrents(c);
        const s = k.carteEnSoignee;
        return [
          {
            libelle: "Qualité moyenne des deux concurrents",
            attendu: k.qualiteDesConcurrents,
            calcul: `(${dec(k.soundbox.qualite)} + ${dec(k.auris.qualite)}) ÷ 2 = ${dec(k.qualiteDesConcurrents)}`,
          },
          {
            libelle: `Qualité moyenne du marché, ${k.f.entreprise} en gamme soignée`,
            attendu: s.qualiteMoyenne,
            calcul: `(${s.enseignes.map((x) => dec(x.qualite)).join(" + ")}) ÷ ${s.enseignes.length} = ${dec(s.sommeDesQualites)} ÷ ${s.enseignes.length} = ${dec(s.qualiteMoyenne)}`,
          },
          {
            libelle: `Indice de qualité ${dE(k.f.entreprise)} en gamme soignée`,
            attendu: s.nova.indiceQualite,
            calcul: `${dec(s.nova.qualite)} ÷ ${dec(s.qualiteMoyenne)} × 100 = ${qte(s.nova.indiceQualite)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const st = k.carteEnStandard.nova;
        return [
          `Il faut à ${k.f.entreprise} une qualité perçue au-dessus de ${dec(k.qualiteDesConcurrents)} : sa gamme d'aujourd'hui (${dec(k.nova.qualite)}) n'y est pas, la gamme soignée la porte à ${qte(k.carteEnSoignee.nova.indiceQualite)}. Avec la gamme standard, elle tomberait à ${qte(st.indiceQualite)}. La qualité se lit sur la carte comme le prix : face aux autres, et la moyenne bouge avec celle qu'on change.`,
          "Une enseigne se déplace sur la carte par son offre entière : le prix sur un axe, la gamme sur l'autre.",
        ];
      },
    },
    {
      id: "predire-la-reussite",
      type: "choix",
      titre: "Pariez sur le meilleur résultat",
      notions: ["demand_market_share", "income_statement"],
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `Pariez : ${k.soundbox.nom} prend ${pct(k.soundbox.part)} du marché, ${k.f.entreprise} ${pct(k.nova.part)}, ${k.auris.nom} ${pct(k.auris.part)}. Laquelle des trois gagne le plus sur l'année ?`;
      },
      options: (c) => {
        const k = strategiesDesConcurrents(c);
        const voir = `Faites varier les ventes ${dE(k.soundbox.nom)} à l'étape suivante : le curseur montre ce que vaut sa part de marché.`;
        return k.enseignes.map((x) => ({
          texte: `${x.nom}, ${NOMS_DES_STRATEGIES_LUES[x.lecture]}`,
          juste: x.code === k.meilleure.code,
          retour: `${x.code === k.meilleure.code ? "Bon pari." : "Pari à vérifier."} ${voir}`,
        }));
      },
    },
    {
      id: "le-volume-de-soundbox",
      type: "curseur",
      titre: "Ce que vaut une part de marché",
      notions: ["demand_market_share", "contribution_margin"],
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        const sb = k.soundbox.bilan;
        return `${k.soundbox.nom} gagne ${eur(sb.margeUnitaire)} sur chaque enceinte et porte ${eur(sb.charges)} de charges fixes et de budgets dans l'année. Faites varier ses ventes de ${qte(VENTES_DU_CURSEUR_DE_SOUNDBOX.min)} à ${qte(VENTES_DU_CURSEUR_DE_SOUNDBOX.max)} : placez le curseur sur le plus petit nombre de ventes où elle gagne autant ${quE(k.auris.nom)} (${eur(k.auris.resultat)}), puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Ventes de l'année ${dE(strategiesDesConcurrents(c).soundbox.nom)}`, unite: ficheDe(c).unites }),
      cible: (c) => {
        const k = strategiesDesConcurrents(c);
        return { attendu: k.ventesDeSoundbox, min: VENTES_DU_CURSEUR_DE_SOUNDBOX.min, max: VENTES_DU_CURSEUR_DE_SOUNDBOX.max };
      },
      zones: [`Autant que le haut de gamme, ou plus`, "Moins que le haut de gamme"],
      rates: () => ({
        dessous: "À cette position, le volume ne paie pas encore autant que le haut de gamme.",
        dessus: "Plus bas, le volume paie encore autant : cherchez le plus petit nombre de ventes.",
      }),
      montrer: "Montrer le rattrapage",
      lecture: (c, q) => {
        const k = strategiesDesConcurrents(c);
        const sb = k.soundbox.bilan;
        const r = auCentime(sb.margeUnitaire * q - sb.charges);
        return [
          { libelle: `Marge sur coût variable ${dE(k.soundbox.nom)}`, montant: auCentime(sb.margeUnitaire * q) },
          { libelle: "Charges fixes et budgets de l'année", montant: sb.charges },
          { libelle: `Résultat ${dE(k.soundbox.nom)}`, montant: r },
          { libelle: `Écart avec ${k.auris.nom}`, montant: auCentime(r - k.auris.resultat), fort: true },
        ];
      },
      droites: (c) => {
        const k = strategiesDesConcurrents(c);
        const sb = k.soundbox.bilan;
        return { produit: (q) => sb.margeUnitaire * q - sb.charges, cout: () => k.auris.resultat, libelles: [`Résultat ${dE(k.soundbox.nom)}`, `Résultat ${dE(k.auris.nom)}`] };
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const sb = k.soundbox;
        return [
          `Il faudrait à ${sb.nom} ${qte(k.ventesDeSoundbox)} ${k.f.unites}, ${qte(k.ventesDeSoundbox - sb.ventes)} de plus qu'elle n'en vend, soit ${pct(k.ventesDeSoundbox / k.annee.marche)} du marché, pour gagner autant ${quE(k.auris.nom)} avec ${pct(k.auris.part)}. Sa grande usine coûte cher (${eur(sb.bilan.chargesFixes)} de charges fixes), et sa marge par enceinte est petite : son volume paie d'abord ses charges.`,
          "La part de marché dit qui vend le plus ; le résultat dit qui gagne le plus. L'étape suivante refait les deux résultats.",
        ];
      },
    },
    {
      id: "les-resultats",
      type: "montants",
      titre: "Les résultats des concurrents",
      notions: ["contribution_margin", "income_statement"],
      tableau: (c) => {
        const k = strategiesDesConcurrents(c);
        const [sb, au] = [k.soundbox.bilan, k.auris.bilan];
        return {
          titre: "Les comptes de l'année des deux concurrents",
          colonnes: [k.soundbox.nom, k.auris.nom],
          lignes: [
            { libelle: `Ventes de l'année (${k.f.unites})`, valeurs: [qte(sb.ventes), qte(au.ventes)] },
            { libelle: "Prix de vente", valeurs: [eur(sb.offre.prix), eur(au.offre.prix)] },
            { libelle: "Composants d'une enceinte", valeurs: [eur(sb.offre.composants), eur(au.offre.composants)] },
            { libelle: "Autres coûts variables d'une enceinte", valeurs: [eur(sb.offre.autres), eur(au.offre.autres)] },
            { libelle: "Charges fixes de l'année", valeurs: [eur(sb.chargesFixes), eur(au.chargesFixes)] },
            { libelle: "Budgets par trimestre (qualité, communication, RSE)", valeurs: [eur(sb.budgets / k.f.marche.trimestres), eur(au.budgets / k.f.marche.trimestres)] },
          ],
        };
      },
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `Sans formule cette fois. Calculez la marge par enceinte et le résultat de l'année ${dE(k.soundbox.nom)} et ${dE(k.auris.nom)}.`;
      },
      champs: (c) => {
        const k = strategiesDesConcurrents(c);
        const t = k.f.marche.trimestres;
        const ligne = (b: Enseigne["bilan"]) => `${qte(b.ventes)} × ${eur(b.margeUnitaire)} − (${eur(b.chargesFixes)} + ${t} × ${eur(b.budgets / t)}) = ${eur(b.resultat)}`;
        const [sb, au] = [k.soundbox.bilan, k.auris.bilan];
        return [
          { libelle: `Marge par enceinte ${dE(k.soundbox.nom)}`, attendu: sb.margeUnitaire, calcul: `${eur(sb.offre.prix)} − ${eur(sb.offre.composants)} − ${eur(sb.offre.autres)} = ${eur(sb.margeUnitaire)}` },
          { libelle: `Résultat ${dE(k.soundbox.nom)}`, attendu: sb.resultat, calcul: ligne(sb), tolerance: 1 },
          { libelle: `Marge par enceinte ${dE(k.auris.nom)}`, attendu: au.margeUnitaire, calcul: `${eur(au.offre.prix)} − ${eur(au.offre.composants)} − ${eur(au.offre.autres)} = ${eur(au.margeUnitaire)}` },
          { libelle: `Résultat ${dE(k.auris.nom)}`, attendu: au.resultat, calcul: ligne(au), tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const [sb, au] = [k.soundbox.bilan, k.auris.bilan];
        return [
          `${k.auris.nom} dépense ${eur(au.budgets)} de budgets dans l'année, bien plus ${quE(k.soundbox.nom)} (${eur(sb.budgets)}), et gagne pourtant ${eur(au.resultat - sb.resultat)} de plus : ${eur(au.margeUnitaire)} par enceinte et un petit atelier (${eur(au.chargesFixes)} de charges fixes), contre ${eur(sb.margeUnitaire)} et une grande usine (${eur(sb.chargesFixes)}).`,
        ];
      },
    },
    {
      id: "reussite",
      type: "choix",
      titre: "Ce que dit l'année",
      notions: ["income_statement", "demand_market_share"],
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `${k.soundbox.nom} prend ${pct(k.soundbox.part)} du marché et gagne ${eur(k.soundbox.resultat)} ; ${k.auris.nom} prend ${pct(k.auris.part)} et gagne ${eur(k.auris.resultat)}. Que retenez-vous de l'année ?`;
      },
      options: (c) => {
        const k = strategiesDesConcurrents(c);
        const b = k.meilleure;
        const partFaitLeResultat = [...k.enseignes].sort((x, y) => y.part - x.part)[0]!.code === b.code;
        return [
          {
            texte: "La part de marché ne fait pas le résultat : la marge et les charges le font",
            juste: !partFaitLeResultat,
            retour: !partFaitLeResultat
              ? `Oui : ${b.nom} a le meilleur résultat (${eur(b.resultat)}) avec la plus petite part du marché. Lire un concurrent, c'est lire sa marge par enceinte et ses charges, pas seulement ses ventes.`
              : `Non : ici, la plus grande part fait aussi le meilleur résultat (${b.nom}, ${eur(b.resultat)}).`,
          },
          {
            texte: "La plus grande part de marché finit toujours par gagner le plus",
            juste: partFaitLeResultat,
            retour: partFaitLeResultat ? `Oui : ${b.nom}, ${eur(b.resultat)}.` : `Non : ${k.soundbox.nom} a la plus grande part et gagne ${eur(k.auris.resultat - k.soundbox.resultat)} de moins ${quE(k.auris.nom)}.`,
          },
          {
            texte: "Le plus cher gagne : il suffit de vendre cher",
            juste: false,
            retour: `Non : ${k.auris.nom} vend cher une qualité que les clients lui reconnaissent (${dec(k.auris.qualite)}). Au même prix, l'enceinte d'aujourd'hui ${dE(k.f.entreprise)} ne ferait que ${qte(k.coinCher.ventes)} ventes et ${eur(k.coinCher.resultat)} de résultat.`,
          },
          {
            texte: `${k.auris.nom} gagne le plus parce qu'elle dépense le moins`,
            juste: false,
            retour: `Non : ${k.auris.nom} a les plus gros budgets du marché, ${eur(k.auris.bilan.budgets)} dans l'année. Elle gagne par sa marge par enceinte (${eur(k.auris.bilan.margeUnitaire)}) et ses petites charges fixes.`,
          },
        ];
      },
    },
    {
      id: "l-espace-libre",
      type: "montants",
      titre: "Mesurer l'espace libre",
      notions: ["segmentation"],
      tableau: tableauDeLaCarte,
      question: () => {
        return `L'espace libre est la plus grande place de la carte qu'aucune enseigne ne tient entre deux voisines. Rangées par indice de prix, deux enseignes voisines sont séparées sur les deux indices : distance = √(écart de prix² + écart de qualité²). Calculez la distance entre chaque paire de voisines, au dixième, puis le prix et la qualité de la place libre, au milieu des deux voisines les plus éloignées (la moyenne de leurs prix et de leurs qualités perçues).`;
      },
      champs: (c) => {
        const k = strategiesDesConcurrents(c);
        const p = k.place;
        return [
          ...k.carte.voisines.map((v) => ({
            libelle: `Distance entre ${v.bas.nom} et ${v.haut.nom}`,
            attendu: auDixieme(v.distance),
            calcul: `√(${qte(v.ecartDePrix)}² + ${qte(v.ecartDeQualite)}²) = ${dec(auDixieme(v.distance), 1)}`,
            tolerance: 0.1,
          })),
          { libelle: "Prix de la place libre", attendu: p.prix, calcul: `(${eur(p.entre.bas.prix)} + ${eur(p.entre.haut.prix)}) ÷ 2 = ${eur(p.prix)}` },
          { libelle: "Qualité de la place libre", attendu: p.qualite, calcul: `(${dec(p.entre.bas.qualite)} + ${dec(p.entre.haut.qualite)}) ÷ 2 = ${dec(p.qualite)}` },
        ];
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const p = k.place;
        return [
          `La place libre est entre ${p.entre.bas.nom} et ${p.entre.haut.nom}, à ${dec(auDixieme(p.entre.distance), 1)} points sur la carte : une enceinte à ${eur(p.prix)}, d'une qualité perçue de ${dec(p.qualite)}, aux indices ${qte(p.indicePrix)} et ${qte(p.indiceQualite)}. Une place libre a deux coordonnées : un prix, et une qualité.`,
          k.carte.plusGrandEcartDePrix === p.entre
            ? `Ici, le plus grand écart de prix seul désigne les mêmes voisines (${qte(p.entre.ecartDePrix)} points). Mais lu sur le seul prix, l'espace libre n'aurait pas de qualité : on croirait l'atteindre en changeant d'étiquette.`
            : `Lu sur le seul prix, l'espace libre serait ailleurs, entre ${k.carte.plusGrandEcartDePrix.bas.nom} et ${k.carte.plusGrandEcartDePrix.haut.nom} : la qualité change la carte.`,
        ];
      },
    },
    {
      id: "espace",
      type: "choix",
      titre: "L'espace libre",
      notions: ["segmentation"],
      question: (c) => `Pour ${ficheDe(c).entreprise}, où se trouve l'espace libre de la carte ?`,
      options: (c) => {
        const k = strategiesDesConcurrents(c);
        const p = k.place;
        const ou = `entre ${p.entre.bas.nom} et ${p.entre.haut.nom}, à ${dec(auDixieme(p.entre.distance), 1)} points`;
        const coin = "Non : un coin vide n'est pas une place libre. Personne ne s'y tient parce que personne n'y gagne : l'étape suivante le chiffre.";
        return [
          ...k.carte.voisines.map((v) => ({
            texte: `Entre ${v.bas.nom} et ${v.haut.nom}`,
            juste: v === p.entre,
            retour:
              v === p.entre
                ? `Oui : ${dec(auDixieme(v.distance), 1)} points sur les deux indices, la plus grande distance entre deux voisines. Une offre placée là, à ${eur(p.prix)} et ${dec(p.qualite)} de qualité, aurait le moins de concurrents directs.`
                : `Non : ${dec(auDixieme(v.distance), 1)} points seulement. L'espace libre est ${ou}.`,
          })),
          { texte: "Le coin des prix hauts, à qualité basse", juste: false, retour: coin },
          { texte: "Le coin du meilleur rapport qualité-prix", juste: false, retour: coin },
        ];
      },
    },
    {
      id: "les-coins-vides",
      type: "montants",
      titre: "Les coins vides de la carte",
      notions: ["segmentation", "capacity", "contribution_margin"],
      tableau: (c) => {
        const k = strategiesDesConcurrents(c);
        const [a, b] = [k.coinCher, k.coinGenereux];
        const capacite = enseigneDe(k.f, "nova").capacite * k.f.marche.trimestres;
        return {
          titre: `Deux années ${dE(k.f.entreprise)} dans les coins vides`,
          colonnes: [`Gamme actuelle à ${eur(a.offre.prix)}`, `Gamme soignée à ${eur(b.offre.prix)}`],
          lignes: [
            { libelle: "Prix de vente", valeurs: [eur(a.offre.prix), eur(b.offre.prix)] },
            { libelle: "Coût variable d'une enceinte", valeurs: [eur(a.coutVariable), eur(b.coutVariable)] },
            { libelle: "Qualité perçue", valeurs: [dec(a.qualite), dec(b.qualite)] },
            { libelle: `Demande de l'année (${k.f.unites})`, valeurs: [qte(a.demande), qte(b.demande)] },
            { libelle: `Capacité de la ligne sur l'année (${k.f.unites})`, valeurs: [qte(capacite), qte(capacite)] },
            { libelle: "Charges fixes et budgets de l'année", valeurs: [eur(a.charges), eur(b.charges)] },
          ],
        };
      },
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `Deux coins de la carte sont vides aussi : le prix haut avec une qualité basse (${k.f.entreprise} au prix ${dE(k.auris.nom)}, avec son enceinte d'aujourd'hui), et la qualité haute à petit prix (la gamme soignée au prix d'aujourd'hui). Les ventes sont la demande, dans la limite de la ligne. Calculez le résultat du premier coin, la demande perdue dans le second, puis son résultat.`;
      },
      champs: (c) => {
        const k = strategiesDesConcurrents(c);
        const [a, b] = [k.coinCher, k.coinGenereux];
        return [
          { libelle: "Résultat au prix haut, gamme actuelle", attendu: a.resultat, calcul: `${qte(a.ventes)} × (${eur(a.offre.prix)} − ${eur(a.coutVariable)}) − ${eur(a.charges)} = ${eur(a.resultat)}`, tolerance: 1 },
          { libelle: "Demande perdue, gamme soignée au prix d'aujourd'hui", attendu: b.refusees, calcul: `${qte(b.demande)} − ${qte(b.ventes)} = ${qte(b.refusees)} ${k.f.unites}`, tolerance: 0 },
          { libelle: "Résultat de la gamme soignée au prix d'aujourd'hui", attendu: b.resultat, calcul: `${qte(b.ventes)} × (${eur(b.offre.prix)} − ${eur(b.coutVariable)}) − ${eur(b.charges)} = ${eur(b.resultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const [a, b] = [k.coinCher, k.coinGenereux];
        return [
          `Au prix haut, personne n'achète une qualité moyenne : ${qte(a.ventes)} ventes, ${pct(a.part)} du marché, et ${eur(a.resultat)}. Ce coin est vide parce qu'il n'y a pas de clients.`,
          b.resultat < k.nova.resultat
            ? `À l'inverse, la gamme soignée au prix d'aujourd'hui ${b.refusees > 0 ? `attire plus de clients que la ligne n'en sert (${qte(b.refusees)} perdus)` : "attire beaucoup de clients"}, et chaque enceinte ne laisse que ${eur(b.margeUnitaire)} : ${eur(b.resultat)}, moins qu'aujourd'hui (${eur(k.nova.resultat)}). Ce coin est vide parce qu'il ne paie pas. Une place libre vaut quelque chose quand des clients l'attendent et qu'une offre y paie ses coûts.`
            : `À l'inverse, la gamme soignée au prix d'aujourd'hui attire beaucoup de clients${b.refusees > 0 ? ` (${qte(b.refusees)} que la ligne ne sert pas)` : ""} : chaque enceinte ne laisse que ${eur(b.margeUnitaire)}, mais le volume fait ${eur(b.resultat)}, plus qu'aujourd'hui (${eur(k.nova.resultat)}). Ce coin paie, mais il ne lit pas ${k.f.entreprise} en différenciation : la qualité y est offerte, pas vendue. Une place libre vaut quelque chose quand des clients l'attendent et qu'une offre y paie ses coûts.`,
        ];
      },
    },
    {
      id: "predire-l-offre",
      type: "choix",
      titre: "Pariez sur l'offre",
      notions: ["segmentation", "price_elasticity"],
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `Pariez : pour que la carte lise ${k.f.entreprise} en différenciation, avec un meilleur résultat qu'aujourd'hui (${eur(k.nova.resultat)}), que doit-elle faire ?`;
      },
      options: (c) => {
        const k = strategiesDesConcurrents(c);
        const voir = "Le laboratoire de l'étape suivante vous le dira : essayez.";
        const p = k.paris;
        return [
          { texte: `Monter son prix à ${eur(k.place.prix)}, le prix de la place`, juste: p.prixSeul, retour: `${p.prixSeul ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Monter sa gamme, et son prix avec elle", juste: p.gamme, retour: `${p.gamme ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: `Doubler son budget qualité, sans changer de gamme`, juste: p.budget, retour: `${p.budget ? "Bon pari." : "Pari à vérifier."} ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-carte",
      type: "simulation",
      titre: "Le laboratoire de la carte",
      notions: ["segmentation", "price_elasticity", "demand_market_share"],
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `Réglez l'offre ${dE(k.f.entreprise)} pour toute l'année : son prix, sa gamme, son budget qualité par trimestre. La carte se refait à chaque essai : le prix moyen et la qualité moyenne bougent avec ${k.f.entreprise}. Le tableau suit ses deux indices, ses ventes et son résultat ; le graphique, son résultat selon le prix. Relevez le défi.`;
      },
      leviers: (c) => {
        const k = strategiesDesConcurrents(c);
        return [
          { code: "prix", libelle: "Prix de vente", unite: "€", ...PRIX_DU_LABORATOIRE, depart: k.depart.prix },
          {
            code: "gamme",
            libelle: "Gamme",
            unite: "",
            min: 0,
            max: GAMMES_DU_LABORATOIRE.length - 1,
            pas: 1,
            depart: k.depart.gamme,
            choix: GAMMES_DU_LABORATOIRE.map((g, i) => {
              const x = gammeDe(k.f, g);
              return { valeur: i, libelle: `${x.nom.charAt(0).toUpperCase()}${x.nom.slice(1)} (${dec(x.qualiteDeConception)})` };
            }),
          },
          { code: "qualite", libelle: "Budget qualité par trimestre", unite: "€", ...BUDGET_DU_LABORATOIRE, depart: k.depart.qualite },
        ];
      },
      lecture: (c, p) => {
        const k = strategiesDesConcurrents(c);
        const l = laboratoireDeLaCarte(k.f, p);
        return [
          { libelle: "Prix moyen du marché", montant: l.prixMoyen, reference: k.carte.prixMoyen },
          { libelle: `Indice de prix ${dE(k.f.entreprise)}`, montant: l.nova.indicePrix, unite: "points", reference: k.nova.indicePrix },
          { libelle: `Indice de qualité ${dE(k.f.entreprise)}`, montant: l.nova.indiceQualite, unite: "points", reference: k.nova.indiceQualite },
          { libelle: `Ventes ${dE(k.f.entreprise)}`, montant: l.annee.nova.ventes, unite: k.f.unites, reference: k.nova.ventes },
          { libelle: `Résultat ${dE(k.f.entreprise)}`, montant: l.annee.nova.resultat, reference: k.nova.resultat },
          { libelle: "Résultat gagné sur aujourd'hui", montant: auCentime(l.annee.nova.resultat - k.nova.resultat), reference: 0, effet: true, fort: true },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      // Le résultat selon le prix n'est pas une droite : la demande suit le prix puissance 4.
      graphique: (c) => {
        const k = strategiesDesConcurrents(c);
        return {
          levier: "prix",
          courbes: [
            { libelle: `Résultat ${dE(k.f.entreprise)}`, valeur: (p) => laboratoireDeLaCarte(k.f, p).annee.nova.resultat + 0 },
            { libelle: "Résultat d'aujourd'hui", valeur: () => k.nova.resultat + 0 },
          ],
        };
      },
      defi: (c) => {
        const k = strategiesDesConcurrents(c);
        return {
          consigne: `Faites lire ${k.f.entreprise} en différenciation, avec un meilleur résultat qu'aujourd'hui.`,
          atteint: (p) => k.reussit(p),
          indice: (p) => {
            const l = laboratoireDeLaCarte(k.f, p);
            const n = l.nova;
            if (n.indiceQualite <= 100) return `Indice de qualité : ${qte(n.indiceQualite)}. Tant qu'il ne dépasse pas 100, aucun prix ne fait lire ${k.f.entreprise} en différenciation : la qualité vient d'abord de la gamme.`;
            if (n.indicePrix <= 100 + k.ecart)
              return `Indice de prix : ${qte(n.indicePrix)}, au prix moyen de ${eur(l.prixMoyen)}. Il doit dépasser ${100 + k.ecart} : la qualité est là, le prix doit la montrer.`;
            return `Lue en différenciation, mais le résultat (${eur(l.annee.nova.resultat)}) reste sous celui d'aujourd'hui (${eur(k.nova.resultat)}) : regardez sur le graphique où le résultat passe au-dessus de la ligne d'aujourd'hui, et ce que chaque budget en plus rapporte vraiment.`;
          },
          solution: { prix: k.place.prix, gamme: GAMMES_DU_LABORATOIRE.indexOf(k.gammeDeLaPlace), qualite: k.depart.qualite },
        };
      },
      explication: (c, p) => {
        const k = strategiesDesConcurrents(c);
        const l = laboratoireDeLaCarte(k.f, p);
        const seul = k.carteAuPrixSeul;
        return [
          `${k.f.entreprise} est lue en différenciation, à ${qte(l.nova.indicePrix)} en prix et ${qte(l.nova.indiceQualite)} en qualité, et gagne ${eur(l.annee.nova.resultat)}, ${signe(auCentime(l.annee.nova.resultat - k.nova.resultat))} sur aujourd'hui. La carte a bougé avec elle : le prix moyen passe à ${eur(l.prixMoyen)}, la qualité moyenne à ${dec(l.qualiteMoyenne)}.`,
          `Au seul prix de la place, ${eur(k.place.prix)}, avec la gamme d'aujourd'hui, ${k.f.entreprise} resterait à ${qte(seul.nova.indicePrix)} et ${qte(seul.nova.indiceQualite)}, ${NOMS_DES_STRATEGIES_LUES[seul.nova.lecture]}, pour ${eur(seul.annee.nova.resultat)} : un prix plus haut que rien ne justifie. On ne prend pas une place sur la carte en changeant d'étiquette.`,
        ];
      },
    },
    {
      id: "une-autre-annee",
      type: "montants",
      titre: "La carte d'une autre année",
      notions: ["segmentation", "demand_market_share"],
      tableau: (c) => {
        const k = strategiesDesConcurrents(c);
        const x = k.carteALaPlace;
        return {
          titre: `L'année où ${k.f.entreprise} va dans l'espace libre, avec la gamme soignée`,
          colonnes: x.enseignes.map((e) => e.nom),
          lignes: [
            { libelle: `Ventes de l'année (${k.f.unites})`, valeurs: x.annee.enseignes.map((e) => qte(e.ventes)) },
            { libelle: "Prix de vente", valeurs: x.enseignes.map((e) => eur(e.prix)) },
            { libelle: "Qualité perçue", valeurs: x.enseignes.map((e) => dec(e.qualite)) },
          ],
        };
      },
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `Une variante : ${k.f.entreprise} va dans l'espace libre, à ${eur(k.place.prix)}, avec la gamme soignée et son budget qualité d'aujourd'hui ; les concurrents ne bougent pas. Refaites la carte de cette année-là : le prix moyen du marché, la qualité moyenne, puis les deux indices ${dE(k.f.entreprise)}.`;
      },
      champs: (c) => {
        const k = strategiesDesConcurrents(c);
        const x = k.carteALaPlace;
        const n = x.nova;
        return [
          { libelle: "Prix moyen du marché de cette année", attendu: x.prixMoyen, calcul: `${eur(x.chiffreDAffaires)} ÷ ${qte(x.ventes)} = ${eur(x.prixMoyen)}` },
          { libelle: "Qualité moyenne de cette année", attendu: x.qualiteMoyenne, calcul: `(${x.enseignes.map((e) => dec(e.qualite)).join(" + ")}) ÷ ${x.enseignes.length} = ${dec(x.qualiteMoyenne)}` },
          { libelle: `Indice de prix ${dE(k.f.entreprise)} cette année`, attendu: n.indicePrix, calcul: `${eur(n.prix)} ÷ ${eur(x.prixMoyen)} × 100 = ${qte(n.indicePrix)}`, tolerance: 1 },
          { libelle: `Indice de qualité ${dE(k.f.entreprise)} cette année`, attendu: n.indiceQualite, calcul: `${dec(n.qualite)} ÷ ${dec(x.qualiteMoyenne)} × 100 = ${qte(n.indiceQualite)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const x = k.carteALaPlace;
        const n = x.nova;
        return [
          `${k.f.entreprise} est lue ${n.lecture === "differenciation" ? "en différenciation" : NOMS_DES_STRATEGIES_LUES[n.lecture]} : ${qte(n.indicePrix)} en prix, ${qte(n.indiceQualite)} en qualité. La place visée était à l'indice ${qte(k.place.indicePrix)} au prix moyen d'aujourd'hui ; ${k.f.entreprise} y arrive à ${qte(n.indicePrix)}, parce qu'en montant, elle a monté le prix moyen (${eur(x.prixMoyen)}, contre ${eur(k.carte.prixMoyen)}).`,
          `Les deux concurrents ont bougé sur la carte sans rien changer : ${x.enseignes
            .slice(1)
            .map((e) => `${e.nom} à ${qte(e.indicePrix)} et ${qte(e.indiceQualite)}`)
            .join(", ")}. Une carte se lit toujours dans une année donnée, et chaque mouvement d'une enseigne déplace les autres.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["segmentation", "demand_market_share"],
      tableau: tableauDeLaCarte,
      texte: (c) => {
        const k = strategiesDesConcurrents(c);
        return [
          `Sur le marché ${dE(k.f.entreprise)}, ${k.soundbox.nom} suit ${NOMS_DES_STRATEGIES_LUES[k.soundbox.lecture]}, ${k.auris.nom} ${NOMS_DES_STRATEGIES_LUES[k.auris.lecture]}, et ${k.f.entreprise} ${NOMS_DES_STRATEGIES_LUES[k.nova.lecture]}. ${k.meilleure.nom} a le meilleur résultat de l'année, avec la plus petite part du marché.`,
          "Lire la stratégie d'un concurrent, c'est le placer sur une carte prix / qualité, puis vérifier dans ses budgets et ses comptes qu'il paie ce qu'il annonce. L'espace libre se mesure sur les deux axes : il a un prix et une qualité, et on ne l'atteint qu'en y amenant les deux. Un coin vide n'est pas une place libre : il l'est souvent parce que personne n'y gagne.",
          "Au niveau de l'examen, vous savez calculer les indices d'une carte et lire la stratégie de chaque enseigne, mesurer l'espace libre sur les deux indices, refaire la carte d'une autre année, et dire pourquoi la part de marché ne fait pas le résultat.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Indice de prix = prix ÷ prix moyen du marché × 100 ; indice de qualité = qualité perçue ÷ qualité moyenne × 100. Prix bas et qualité basse : les coûts. Prix haut et qualité haute : la différenciation. Distance entre deux enseignes = √(écart de prix² + écart de qualité²).",
    },
  ],
};

