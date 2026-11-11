import { arrondi2 as auCentieme, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  AMENDE_DE_LA_REVENTE_A_PERTE,
  COOPERATION_PROPOSEE,
  CRITERES,
  DATE_LIMITE_DE_LA_CONVENTION,
  DELAI_DE_PAIEMENT_MAXIMAL_EN_JOURS,
  DELAI_PROPOSE_PAR_L_ATELIER,
  NOTES,
  POIDS_DU_PRIX_ET_DE_LA_QUALITE,
  REMISE_DE_LA_FIN_DE_SERIE,
  TAUX_DE_RETOUR,
  cooperationCommerciale,
  grilleDesFournisseurs,
  notePonderee,
  poidsDuPrixQuiFaitPasser,
  poidsDuPrixQuiMetEnTete,
  seuilDeReventeAPerte,
} from "../monde/fournisseurs-de-la-boutique";
import { BOUTIQUES_DU_COURS, type CodeDeFournisseur, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : CHOISIR ET NÉGOCIER AVEC LE FOURNISSEUR (BTS MCO, bloc 2, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : les trois façonniers de la boutique MAILLE & CO
 * (monde/maille-et-co.ts), et ce qui les départage et les engage (monde/fournisseurs-de-la-boutique.ts).
 *
 * L'objet : sélectionner un fournisseur par une grille multicritère pondérée, en testant la
 * sensibilité du classement aux poids ; chiffrer une coopération commerciale (une mise en avant que
 * le façonnier paie, face à celle qu'elle déplace) ; puis le cadre légal des négociations, la
 * convention écrite, le plafond des délais de paiement, et le seuil de revente à perte qui borne la
 * remise d'une fin de série. Le piège central : le moins cher n'est pas le meilleur fournisseur, et le
 * classement dépend des poids : le façonnier de référence passe devant l'atelier local dès que le prix
 * pèse 24 points sur 100, les fins de série ne passent en tête qu'à 48.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, les-etapes, la-grille (la question nomme la méthode) ;
 *   · l'expérience avant la formule : predire-les-poids puis le-poids-du-prix (un curseur sur le poids
 *     du prix) avant le-laboratoire-des-poids ;
 *   · autonome : la-cooperation, le-seuil-de-revente-a-perte ;
 *   · expert : le-laboratoire-des-poids (les trois notes en courbes selon le poids du prix),
 *     la-convention, le-delai-propose, la-fin-de-serie, retenir ; puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les notes pondérées sont des grandeurs, au centième ; la remise
 * la plus forte se donne à deux décimales, à un centième près (au dixième, avant).
 */

export const ENTREPRISES_DU_FOURNISSEUR: readonly string[] = ["boutique"];

export const POURQUOI_LA_BOUTIQUE =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît les trois façonniers : le choix du fournisseur se joue chez elle, quelle que soit votre entreprise.";

export const CODE_DU_FOURNISSEUR = "choisir-et-negocier-le-fournisseur";
export const TITRE_DU_FOURNISSEUR = "Choisir et négocier avec le fournisseur";

/** Le départ du laboratoire : le poids que l'acheteuse donne au prix. */
export const DEPART_DU_LABORATOIRE = { prix: CRITERES[0]!.poids - 10 } as const;

/** Les poids que propose la dirigeante (hypothèse du cours) : 20 points pour le prix, 30 pour la qualité. */
export const POIDS_DE_LA_DIRIGEANTE = 20;

const qte = nombreAuCentieme;
const note = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

/** Tout ce que le chapitre et son cas demandent. */
export function fournisseursDeLaBoutique(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const g = grilleDesFournisseurs(f);
  const nom = (code: CodeDeFournisseur) => f.fournisseurs.find((x) => x.code === code)!.nom;
  return {
    f,
    g,
    nom,
    noteDe: (code: CodeDeFournisseur, poidsDuPrix?: number) => auCentieme(notePonderee(code, poidsDuPrix)),
    poidsQuiDepartage: poidsDuPrixQuiFaitPasser("faconnier", "atelier-local")!,
    poidsDesFinsDeSerie: poidsDuPrixQuiMetEnTete(f, "fins-de-serie")!,
    /** Le plus grand poids du prix où le référent mène encore seul (au-delà, ex aequo puis derrière les fins de série). */
    dernierPoidsDuReferent: Math.max(...Array.from({ length: POIDS_DU_PRIX_ET_DE_LA_QUALITE + 1 }, (_, p) => p).filter((p) => notePonderee("faconnier", p) > Math.max(notePonderee("atelier-local", p), notePonderee("fins-de-serie", p)) + 1e-9)),
    coop: cooperationCommerciale(f),
    srp: seuilDeReventeAPerte(f),
  };
}

/** « −18 % », « référent », « +22 % » : le prix d'un façonnier face au référent. */
const ecartDePrix = (m: number) => (m === 1 ? "référent" : `${m > 1 ? "+" : ""}${pct(Math.round((m - 1) * 1000) / 10)}`);

const libelleDuDelai = (j: number) => (j === 0 ? "comptant" : `${qte(j)} jours`);

/** Les trois façonniers, sur la fiche. */
export function tableauDesFaconniers(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = fournisseursDeLaBoutique(c);
  return {
    titre: "Les trois façonniers de la boutique",
    colonnes: ["Prix face au référent", "Paiement", "Livraison", "Minimum", "Réassort", "Retours clients"],
    lignes: x.f.fournisseurs.map((s) => ({
      libelle: s.nom,
      valeurs: [ecartDePrix(s.multiplicateur), libelleDuDelai(s.delaiDePaiement), `${qte(s.delaiDeLivraison)} jours`, `${qte(s.minimumDeCommande)} articles`, s.reassort ? "oui" : "non", pct(TAUX_DE_RETOUR[s.code] * 100)],
    })),
  };
}

/** La grille : les poids et les notes de 0 à 5. */
export function tableauDeLaGrille(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = fournisseursDeLaBoutique(c);
  return {
    titre: "La grille de l'acheteuse : poids sur 100, notes de 0 à 5",
    colonnes: ["Poids", ...x.f.fournisseurs.map((s) => s.nom)],
    lignes: CRITERES.map((k) => ({ libelle: k.libelle, valeurs: [qte(k.poids), ...x.f.fournisseurs.map((s) => qte(NOTES[s.code][k.code]))] })),
  };
}

export const CHOISIR_ET_NEGOCIER_LE_FOURNISSEUR: Chapitre = {
  code: "choisir-et-negocier-le-fournisseur",
  parcours: "mco",
  palier: 3,
  blocs: ["BTS MCO Bloc 2 · Animer et dynamiser l'offre commerciale", "BTS MCO Bloc 3 · Assurer la gestion opérationnelle"],
  titre: TITRE_DU_FOURNISSEUR,
  accroche:
    "Le façonnier le moins cher n'est pas le meilleur, et le classement dépend des poids qu'on donne aux critères. Puis ce que vaut une mise en avant payée par le fournisseur, et le prix sous lequel la loi interdit de revendre.",
  objectifs: [
    "Classer des fournisseurs sur une grille multicritère pondérée, en suivant les étapes de la sélection",
    "Tester la sensibilité d'un classement au poids d'un critère",
    "Chiffrer une action de coopération commerciale face à ce qu'elle déplace",
    "Calculer le seuil de revente à perte et la remise la plus forte qu'il permet",
    "Appliquer le cadre juridique des négociations commerciales à une décision d'achat",
  ],
  libre: false,
  prerequis: ["taux-de-marque-et-coefficient", "stock-du-point-de-vente"],
  ensuite: ["communiquer-et-animer-en-local"],
  entreprises: { codes: ENTREPRISES_DU_FOURNISSEUR, pourquoi: POURQUOI_LA_BOUTIQUE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois façonniers, six critères",
      notions: ["margin_rates", "payment_terms"],
      tableau: tableauDesFaconniers,
      texte: (c) => {
        const x = fournisseursDeLaBoutique(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. Elle peut faire tricoter sa collection par trois façonniers. Le tableau donne leur prix d'achat rapporté à celui du référent, leurs délais, leur minimum de commande et s'ils réassortent en saison ; puis la part des articles que les clients ont rapportés pour un défaut l'an passé.`,
          `Aucun ne gagne sur tout : les fins de série sont les moins chères et livrent en ${qte(x.f.fournisseurs.find((k) => k.code === "fins-de-serie")!.delaiDeLivraison)} jours, mais se paient comptant et ne réassortent pas. L'atelier local est le plus cher, mais le plus sûr en qualité ; le référent est entre les deux.`,
          `Ce que la simulation suppose. L'acheteuse note chaque façonnier de 0 à 5 sur chaque critère, avec un barème tiré de la fiche, et pondère les critères sur 100. Le prix et la qualité se partagent ${qte(POIDS_DU_PRIX_ET_DE_LA_QUALITE)} points.`,
        ];
      },
      repere: () => "Note pondérée = somme des (poids × note) ÷ 100. Le meilleur fournisseur est celui qui a la plus forte note pondérée, pas le moins cher.",
    },
    {
      id: "les-etapes",
      objectifs: [0],
      type: "choix",
      titre: "Les étapes de la sélection",
      notions: ["payment_terms"],
      question: () => "Dans quel ordre l'acheteuse sélectionne-t-elle un fournisseur ?",
      options: () => [
        {
          texte: "Cahier des charges, recherche, grille, négociation, référencement, suivi",
          juste: true,
          retour:
            "Oui. On écrit d'abord ce qu'on attend (le cahier des charges : quantités, qualité, délais), puis on cherche les fournisseurs possibles et on les compare sur une grille. On négocie avec les mieux classés, on référence le retenu, puis on suit ses livraisons et ses retours : la note de qualité de demain vient de ce suivi.",
        },
        {
          texte: "Négociation, puis grille et classement, puis cahier des charges, puis référencement",
          juste: false,
          retour: "On ne négocie pas avant de savoir ce qu'on veut et qui le fournit le mieux : le cahier des charges vient d'abord, la négociation après le classement.",
        },
        {
          texte: "Classement par le prix seul, puis référencement et suivi des livraisons",
          juste: false,
          retour: "Le prix seul oublie les délais, le minimum, le réassort et la qualité : un fournisseur moins cher qui fait rater la saison coûte plus qu'il ne rapporte.",
        },
      ],
    },
    {
      id: "la-grille",
      objectifs: [0],
      type: "montants",
      titre: "La grille pondérée",
      notions: ["margin_rates", "payment_terms"],
      tableau: tableauDeLaGrille,
      question: () =>
        "Calculez la note pondérée de chaque façonnier, sur 5, au centième : la somme, critère par critère, du poids multiplié par la note, divisée par 100.",
      champs: (c) => {
        const x = fournisseursDeLaBoutique(c);
        return x.f.fournisseurs.map((s) => ({
          libelle: `Note pondérée · ${s.nom}`,
          nature: "grandeur" as const,
          attendu: x.noteDe(s.code),
          calcul: `(${CRITERES.map((k) => `${qte(k.poids)} × ${qte(NOTES[s.code][k.code])}`).join(" + ")}) ÷ 100 = ${note(x.noteDe(s.code))}`,
        }));
      },
      explication: (c) => {
        const x = fournisseursDeLaBoutique(c);
        const [a, b, d] = x.g.classement;
        return [
          `${a!.nom} mène avec ${note(a!.note)}, devant ${b!.nom.toLowerCase()} (${note(b!.note)}) et ${d!.nom.toLowerCase()} (${note(d!.note)}). Le moins cher finit dernier : il perd sur le paiement comptant, le minimum de 300 articles, l'absence de réassort et les retours.`,
        ];
      },
    },
    {
      id: "predire-les-poids",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur les poids",
      notions: ["margin_rates"],
      question: (c) => {
        const x = fournisseursDeLaBoutique(c);
        return `Avant de calculer, pariez. La dirigeante trouve que l'acheteuse donne trop de poids au prix (${qte(CRITERES[0]!.poids)} points sur 100) et pas assez à la qualité. Si le prix pesait un peu moins, ${x.nom("faconnier").toLowerCase()} resterait-il en tête ?`;
      },
      options: (c) => {
        const x = fournisseursDeLaBoutique(c);
        const voir = "Faites varier le poids du prix dans le laboratoire : le graphique montre où le classement bascule.";
        const bascule = x.poidsQuiDepartage;
        return [
          { texte: "Non : quelques points de moins, et l'atelier passe devant", juste: bascule > CRITERES[0]!.poids - 10, retour: `Bon pari. ${voir}` },
          { texte: "Oui : il reste en tête quel que soit le poids du prix", juste: bascule === 0, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non : ce sont les fins de série, les moins chères, qui passent devant", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-poids",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire des poids",
      notions: ["margin_rates"],
      question: () =>
        "Faites varier le poids du prix, de 0 à 50 points ; la qualité prend le reste des 50 points, les autres critères gardent leurs poids. Le tableau suit la note de chaque façonnier ; le graphique trace les trois notes. Puis relevez le défi.",
      leviers: () => [{ code: "prix", libelle: "Poids du prix", unite: "points", min: 0, max: POIDS_DU_PRIX_ET_DE_LA_QUALITE, pas: 1, depart: DEPART_DU_LABORATOIRE.prix }],
      lecture: (c, p) => {
        const x = fournisseursDeLaBoutique(c);
        const d = DEPART_DU_LABORATOIRE.prix;
        const avance = (q: number) => auCentieme(notePonderee("faconnier", q) - Math.max(notePonderee("atelier-local", q), notePonderee("fins-de-serie", q)));
        return [
          { libelle: "Poids de la qualité", montant: POIDS_DU_PRIX_ET_DE_LA_QUALITE - p.prix!, reference: POIDS_DU_PRIX_ET_DE_LA_QUALITE - d, unite: "points" },
          ...x.f.fournisseurs.map((s) => ({ libelle: `Note · ${s.nom}`, montant: x.noteDe(s.code, p.prix!), reference: x.noteDe(s.code, d), unite: "sur 5" })),
          { libelle: "Avance du référent sur le suivant", montant: avance(p.prix!), reference: avance(d), unite: "sur 5", effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = fournisseursDeLaBoutique(c);
        return { levier: "prix", unite: "sur 5", courbes: x.f.fournisseurs.map((s) => ({ libelle: s.nom, valeur: (p) => notePonderee(s.code, p.prix!) })) };
      },
      defi: (c) => {
        const x = fournisseursDeLaBoutique(c);
        const mene = (p: number) => notePonderee("faconnier", p) > Math.max(notePonderee("atelier-local", p), notePonderee("fins-de-serie", p)) + 1e-9;
        return {
          consigne: "Trouvez le plus petit poids du prix où le façonnier de référence mène seul la grille.",
          atteint: (p) => mene(p.prix!) && (p.prix! === 0 || !mene(p.prix! - 1)),
          indice: (p) =>
            mene(p.prix!)
              ? `À ${qte(p.prix!)} points, le référent mène ; il menait aussi un point plus bas : cherchez le plus petit poids.`
              : `À ${qte(p.prix!)} points, ${grilleDesFournisseurs(x.f, p.prix!).premier.nom.toLowerCase()} mène : ${p.prix! >= x.poidsDesFinsDeSerie ? "donnez moins de poids au prix" : "donnez plus de poids au prix"}.`,
          solution: { prix: x.poidsQuiDepartage },
        };
      },
      montrer: "Montrer la bascule",
      explication: (c) => {
        const x = fournisseursDeLaBoutique(c);
        return [
          `Le classement bascule à ${qte(x.poidsQuiDepartage)} points : en dessous, l'atelier local mène ; de ${qte(x.poidsQuiDepartage)} à ${qte(x.dernierPoidsDuReferent)} points, le référent ; à partir de ${qte(x.poidsDesFinsDeSerie)}, les fins de série, pour une acheteuse qui ne regarde presque que le prix. Chaque point donné au prix et retiré à la qualité fait gagner au référent 3 centièmes de point sur l'atelier (2 de plus au prix, 1 de moins à la qualité).`,
          `Un classement n'est solide que s'il résiste à un changement raisonnable des poids. À ${qte(CRITERES[0]!.poids)} points pour le prix, le référent mène de peu : ${qte(CRITERES[0]!.poids - x.poidsQuiDepartage + 1)} points de moins, et l'atelier passe devant. Les poids sont un choix de politique commerciale : une boutique qui vend la qualité et le conseil ne note pas ses fournisseurs comme un soldeur.`,
        ];
      },
    },
    {
      id: "les-poids-de-la-dirigeante",
      objectifs: [1],
      type: "montants",
      titre: "Avec les poids de la dirigeante",
      notions: ["margin_rates"],
      tableau: tableauDeLaGrille,
      question: () =>
        `Sans formule cette fois. La dirigeante propose ${qte(POIDS_DE_LA_DIRIGEANTE)} points pour le prix et ${qte(POIDS_DU_PRIX_ET_DE_LA_QUALITE - POIDS_DE_LA_DIRIGEANTE)} pour la qualité, les autres poids inchangés. Calculez la note pondérée de chaque façonnier, sur 5, au centième.`,
      champs: (c) => {
        const x = fournisseursDeLaBoutique(c);
        const p = POIDS_DE_LA_DIRIGEANTE;
        return x.f.fournisseurs.map((s) => ({
          libelle: `Note pondérée · ${s.nom}`,
          nature: "grandeur" as const,
          attendu: x.noteDe(s.code, p),
          calcul: `(${qte(p)} × ${qte(NOTES[s.code].prix)} + ${CRITERES.filter((k) => k.code !== "prix" && k.code !== "qualite").map((k) => `${qte(k.poids)} × ${qte(NOTES[s.code][k.code])}`).join(" + ")} + ${qte(POIDS_DU_PRIX_ET_DE_LA_QUALITE - p)} × ${qte(NOTES[s.code].qualite)}) ÷ 100 = ${note(x.noteDe(s.code, p))}`,
        }));
      },
      explication: (c) => {
        const x = fournisseursDeLaBoutique(c);
        const g = grilleDesFournisseurs(x.f, POIDS_DE_LA_DIRIGEANTE);
        return [
          `Avec ces poids, ${g.premier.nom.toLowerCase()} mène (${note(g.premier.note)}). Le même tableau de notes donne un autre gagnant : la grille ne décide pas à la place de la boutique, elle rend visible ce que la boutique a choisi de valoriser.`,
        ];
      },
    },
    {
      id: "predire-la-cooperation",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la mise en avant",
      notions: ["contribution_margin", "assortment"],
      question: (c) => {
        const k = fournisseursDeLaBoutique(c).coop;
        return `Avant de calculer, pariez. Le façonnier de référence paierait la boutique pour mettre son ${k.mise.nom.toLowerCase()} en vitrine et en tête de rayon pendant un mois : ${qte(COOPERATION_PROPOSEE.ventesEnPlus)} pulls de plus. La vitrine montre aujourd'hui le mérinos, qui y gagne ${qte(COOPERATION_PROPOSEE.ventesPerdues)} ventes par mois. Sans rémunération, la mise en avant…`;
      },
      options: (c) => {
        const k = fournisseursDeLaBoutique(c).coop;
        const voir = "Faites varier la rémunération à l'étape suivante : le curseur montre celle qui rend la mise en avant neutre.";
        return [
          { texte: "Ferait perdre de la marge : le mérinos marge plus", juste: k.remunerationPlancher > 0, retour: `Bon pari. ${voir}` },
          { texte: "Ferait gagner de la marge : elle vend plus de pulls", juste: k.remunerationPlancher === 0 && k.margeGagnee > k.margePerdue, retour: `Pari à vérifier. ${voir}` },
          { texte: "Ne changerait rien : une vitrine est une vitrine", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-remuneration-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Ce que la vitrine doit coûter au façonnier",
      notions: ["contribution_margin", "assortment"],
      question: () =>
        "Faites varier la rémunération que paie le façonnier, de 0 à 2 000 €. Une droite donne ce que la mise en avant rapporte à la boutique (la rémunération et la marge du col rond en plus), l'autre ce qu'elle lui coûte (la marge du mérinos perdue). Placez le curseur sur la plus petite rémunération où la mise en avant ne coûte rien, puis validez.",
      grandeur: () => ({ libelle: "Rémunération de la mise en avant", unite: "€" }),
      cible: (c) => ({ attendu: Math.ceil(fournisseursDeLaBoutique(c).coop.remunerationPlancher - 1e-9), min: 0, max: 2_000 }),
      zones: ["La mise en avant ne coûte rien", "La mise en avant coûte de la marge"],
      rates: () => ({
        dessous: "À cette rémunération, la marge du mérinos perdue pèse plus que ce que la boutique reçoit.",
        dessus: "La mise en avant ne coûte déjà rien plus bas : cherchez la plus petite rémunération.",
      }),
      montrer: "Montrer la rémunération plancher",
      lecture: (c, r) => {
        const k = cooperationCommerciale(fournisseursDeLaBoutique(c).f, r);
        return [
          { libelle: "Rémunération reçue", montant: k.remuneration },
          { libelle: "Marge gagnée sur le col rond", montant: k.margeGagnee },
          { libelle: "Marge perdue sur le mérinos", montant: k.margePerdue },
          { libelle: "Effet net pour la boutique", montant: k.effetNet, fort: true },
        ];
      },
      droites: (c) => {
        const k = fournisseursDeLaBoutique(c).coop;
        return { produit: (r) => r + k.margeGagnee, cout: () => k.margePerdue, libelles: ["Ce que rapporte la mise en avant", "Ce qu'elle coûte"] };
      },
      explication: (c) => {
        const k = fournisseursDeLaBoutique(c).coop;
        return [
          `Sous ${eur(k.remunerationPlancher)}, la mise en avant coûte de la marge : ${qte(COOPERATION_PROPOSEE.ventesEnPlus)} pulls col rond à ${eur(k.mise.margeUnitaire)} (${eur(k.margeGagnee)}) ne remplacent pas ${qte(COOPERATION_PROPOSEE.ventesPerdues)} mérinos à ${eur(k.deplacee.margeUnitaire)} (${eur(k.margePerdue)}). La vitrine est une place rare : son prix plancher est la marge qu'elle cesse de faire ailleurs.`,
        ];
      },
    },
    {
      id: "la-cooperation",
      objectifs: [2],
      type: "montants",
      titre: "Une mise en avant payée par le façonnier",
      notions: ["contribution_margin", "assortment"],
      question: (c) => {
        const x = fournisseursDeLaBoutique(c);
        const k = x.coop;
        return `Sans formule cette fois. Le façonnier propose ${eur(k.remuneration)} hors taxes pour la mise en avant de son ${k.mise.nom.toLowerCase()}. Calculez la marge gagnée sur le col rond, la marge perdue sur le mérinos, puis l'effet net pour la boutique.`;
      },
      champs: (c) => {
        const k = fournisseursDeLaBoutique(c).coop;
        return [
          { libelle: "Marge gagnée sur le col rond", attendu: k.margeGagnee, calcul: `${qte(COOPERATION_PROPOSEE.ventesEnPlus)} × ${eur(k.mise.margeUnitaire)} de marge sur coût variable = ${eur(k.margeGagnee)}` },
          { libelle: "Marge perdue sur le mérinos", attendu: k.margePerdue, calcul: `${qte(COOPERATION_PROPOSEE.ventesPerdues)} × ${eur(k.deplacee.margeUnitaire)} = ${eur(k.margePerdue)}` },
          { libelle: "Effet net de la coopération", attendu: k.effetNet, calcul: `${eur(k.remuneration)} + ${eur(k.margeGagnee)} − ${eur(k.margePerdue)} = ${eur(k.effetNet)}` },
        ];
      },
      explication: (c) => {
        const k = fournisseursDeLaBoutique(c).coop;
        return [
          `À ${eur(k.remuneration)}, la mise en avant laisse ${eur(k.effetNet)} de plus à la boutique : ${eur(k.remuneration - k.remunerationPlancher)} au-dessus de la rémunération plancher. C'est la contrepartie à défendre dans la négociation : un service de coopération se paie au prix de ce qu'il coûte au distributeur, pas au prix que le fournisseur propose.`,
        ];
      },
    },
    {
      id: "la-convention",
      objectifs: [4],
      type: "choix",
      titre: "Ce que la convention doit dire",
      notions: ["payment_terms"],
      question: (c) => {
        const k = fournisseursDeLaBoutique(c).coop;
        return `La boutique accepte la mise en avant à ${eur(k.remuneration)}. Le façonnier propose de la régler « à l'amiable, sans écrit ». Que dit le droit des négociations commerciales ?`;
      },
      options: () => [
        {
          texte: `Dans la convention écrite, avant le ${DATE_LIMITE_DE_LA_CONVENTION}`,
          juste: true,
          retour: `Oui. Le prix, les réductions et chaque service de coopération commerciale (son objet, sa date, sa rémunération) s'écrivent dans une convention conclue au plus tard le ${DATE_LIMITE_DE_LA_CONVENTION}. Les conditions générales de vente du façonnier sont le socle de la négociation ; un service fictif ou sans proportion avec sa rémunération est interdit.`,
        },
        {
          texte: "Un accord oral suffit entre commerçants",
          juste: false,
          retour: "Non : entre un fournisseur et un distributeur, le code de commerce impose une convention écrite qui récapitule ce qui a été négocié.",
        },
        {
          texte: "Seule la facture compte : le service se déduit du prix",
          juste: false,
          retour: "Non : un service de coopération est rendu par la boutique et facturé par elle au façonnier ; il se décrit dans la convention, il ne se cache pas dans le prix.",
        },
      ],
    },
    {
      id: "le-delai-propose",
      objectifs: [4],
      type: "choix",
      titre: "Un délai de paiement trop beau",
      notions: ["payment_terms"],
      question: (c) => {
        const x = fournisseursDeLaBoutique(c);
        const a = x.f.fournisseurs.find((s) => s.code === "atelier-local")!;
        return `L'atelier local, payé à ${qte(a.delaiDePaiement)} jours, propose ${qte(DELAI_PROPOSE_PAR_L_ATELIER)} jours si la boutique le retient. La trésorerie y gagnerait. Est-ce légal ?`;
      },
      options: () => [
        {
          texte: `Non : ${qte(DELAI_DE_PAIEMENT_MAXIMAL_EN_JOURS)} jours au plus entre professionnels`,
          juste: true,
          retour: `Oui. Le code de commerce plafonne le délai de paiement à ${qte(DELAI_DE_PAIEMENT_MAXIMAL_EN_JOURS)} jours après la date de la facture, ou 45 jours fin de mois si le contrat le prévoit. Un délai plus long expose les deux parties à une amende administrative. Le façonnier de référence, à 45 jours, est dans la loi.`,
        },
        {
          texte: "Oui : c'est le fournisseur qui le propose",
          juste: false,
          retour: `Non : le plafond s'impose aux deux parties, même d'accord. Au-delà de ${qte(DELAI_DE_PAIEMENT_MAXIMAL_EN_JOURS)} jours, l'acheteur comme le vendeur sont en faute.`,
        },
        {
          texte: "Oui, à condition de payer des pénalités de retard",
          juste: false,
          retour: "Non : les pénalités sanctionnent un paiement en retard sur l'échéance ; elles ne rendent pas légale une échéance trop lointaine.",
        },
      ],
    },
    {
      id: "le-seuil-de-revente-a-perte",
      objectifs: [3],
      type: "montants",
      titre: "Le prix sous lequel on ne revend pas",
      notions: ["price_floor", "margin_rates"],
      question: (c) => {
        const s = fournisseursDeLaBoutique(c).srp;
        return `La boutique veut écouler une fin de série de pulls col rond hors des soldes. Le façonnier les facture ${eur(s.prixNet)} hors taxes, net de remise ; la boutique paie ${eur(s.transport)} de transport par pull ; le façonnier accorde une ristourne de fin d'année de ${pct(2)} du prix net, et sa coopération commerciale représente ${eur(s.cooperation)} par pull. Calculez le seuil de revente à perte hors taxes (le prix d'achat effectif), puis toutes taxes comprises, et la remise la plus forte sur l'étiquette de ${eur(s.r.prixTtc)}, en pourcentage à deux décimales.`;
      },
      champs: (c) => {
        const s = fournisseursDeLaBoutique(c).srp;
        return [
          { libelle: "Seuil de revente à perte hors taxes", attendu: s.seuilHt, calcul: `${eur(s.prixNet)} + ${eur(s.transport)} − ${eur(s.ristourne)} de ristourne − ${eur(s.cooperation)} de coopération = ${eur(s.seuilHt)}` },
          { libelle: "Seuil de revente à perte toutes taxes comprises", attendu: s.seuilTtc, calcul: `${eur(s.seuilHt)} × 1,2 = ${eur(s.seuilTtc)}` },
          { libelle: "Remise la plus forte sur l'étiquette (%)", attendu: auCentieme(s.remiseMaximale * 100), calcul: `(${eur(s.r.prixTtc)} − ${eur(s.seuilTtc)}) ÷ ${eur(s.r.prixTtc)} × 100 = ${pct(auCentieme(s.remiseMaximale * 100))}` },
        ];
      },
      explication: (c) => {
        const s = fournisseursDeLaBoutique(c).srp;
        return [
          `Revendre un pull col rond sous ${eur(s.seuilTtc)} toutes taxes comprises serait une revente à perte. Le seuil part du prix net de la facture, ajoute le transport et la TVA, et retranche les autres avantages du façonnier (la ristourne, la coopération) : c'est le « triple net ». Plus la négociation obtient d'avantages hors facture, plus le seuil descend.`,
        ];
      },
    },
    {
      id: "la-fin-de-serie",
      objectifs: [3, 4],
      type: "choix",
      titre: "La fin de série à moins 60 %",
      notions: ["price_floor"],
      question: (c) => {
        const s = fournisseursDeLaBoutique(c).srp;
        return `Le vendeur propose d'afficher « −${pct(REMISE_DE_LA_FIN_DE_SERIE * 100)} » sur la fin de série, en mars, hors soldes : le pull passerait à ${eur(s.prixDeLaFinDeSerie)}. Que répondez-vous ?`;
      },
      options: (c) => {
        const s = fournisseursDeLaBoutique(c).srp;
        return [
          {
            texte: `Non : ${eur(s.prixDeLaFinDeSerie)} est sous le seuil de ${eur(s.seuilTtc)}`,
            juste: s.finDeSerieAPerte,
            retour: `Oui. Hors des cas que la loi prévoit (les soldes, une liquidation, des produits saisonniers en fin de saison, des produits démodés), la revente à perte est interdite et punie d'une amende qui peut atteindre ${eur(AMENDE_DE_LA_REVENTE_A_PERTE)}. La remise s'arrête à ${pct(auCentieme(s.remiseMaximale * 100))}, ou attend les soldes, où elle redevient possible.`,
          },
          {
            texte: "Oui : la boutique fixe librement ses prix",
            juste: false,
            retour: `Les prix sont libres, mais pas sous le prix d'achat effectif : hors soldes et cas prévus par la loi, ${eur(s.prixDeLaFinDeSerie)} est une revente à perte.`,
          },
          {
            texte: "Oui, si le pull est vendu au-dessus de son prix de facture hors taxes",
            juste: false,
            retour: `Non : le seuil se compare taxes comprises (${eur(s.seuilTtc)}), et ${eur(s.prixDeLaFinDeSerie)} toutes taxes comprises fait ${eur(Math.round((s.prixDeLaFinDeSerie / 1.2) * 100) / 100)} hors taxes, sous les ${eur(s.prixNet)} de la facture.`,
          },
        ];
      },
    },
    {
      id: "retenir",
      objectifs: [0, 2],
      type: "choix",
      titre: "Quel façonnier retenir, et que lui demander ?",
      notions: ["margin_rates", "payment_terms"],
      tableau: tableauDeLaGrille,
      question: () => "La dirigeante vous demande votre recommandation.",
      options: (c) => {
        const x = fournisseursDeLaBoutique(c);
        return [
          {
            texte: `Le référent, et la vitrine payée ${eur(x.coop.remunerationPlancher)} au moins`,
            juste: true,
            retour: `Oui. Avec les poids de l'acheteuse, le référent mène (${note(x.noteDe("faconnier"))} contre ${note(x.noteDe("atelier-local"))}), payé à 45 jours dans la loi ; mais il ne mène que tant que le prix pèse au moins ${qte(x.poidsQuiDepartage)} points. La coopération proposée laisse ${eur(x.coop.effetNet)} ; sous ${eur(x.coop.remunerationPlancher)}, elle coûterait de la marge.`,
          },
          {
            texte: "Les fins de série : c'est le prix d'achat le plus bas",
            juste: false,
            retour: `Le prix le plus bas, mais la note la plus faible (${note(x.noteDe("fins-de-serie"))}) : payées comptant, sans réassort, avec ${pct(TAUX_DE_RETOUR["fins-de-serie"] * 100)} de retours. Elles ne mèneraient qu'avec ${qte(x.poidsDesFinsDeSerie)} points sur ${qte(POIDS_DU_PRIX_ET_DE_LA_QUALITE)} au prix.`,
          },
          {
            texte: `L'atelier local, à ${qte(DELAI_PROPOSE_PAR_L_ATELIER)} jours de paiement`,
            juste: false,
            retour: `Le délai proposé est illégal (plus de ${qte(DELAI_DE_PAIEMENT_MAXIMAL_EN_JOURS)} jours), et l'atelier ne mène que si le prix pèse moins de ${qte(x.poidsQuiDepartage)} points.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["margin_rates", "price_floor", "payment_terms"],
      tableau: tableauDeLaGrille,
      texte: (c) => {
        const x = fournisseursDeLaBoutique(c);
        return [
          `On sélectionne un fournisseur par étapes : le besoin, la recherche, la grille, la négociation, le référencement, le suivi. On le choisit sur une grille pondérée : ici, ${note(x.noteDe("faconnier"))} pour le référent, ${note(x.noteDe("atelier-local"))} pour l'atelier local, ${note(x.noteDe("fins-de-serie"))} pour les fins de série. Le classement se teste : il bascule à ${qte(x.poidsQuiDepartage)} points pour le prix.`,
          `Une coopération commerciale se chiffre contre ce qu'elle déplace : ${eur(x.coop.remuneration)} payés pour ${eur(x.coop.margeGagnee)} de marge gagnée et ${eur(x.coop.margePerdue)} perdue, ${eur(x.coop.effetNet)} de gain. Elle s'écrit dans la convention annuelle, signée au plus tard le ${DATE_LIMITE_DE_LA_CONVENTION} ; les délais de paiement ne dépassent pas ${qte(DELAI_DE_PAIEMENT_MAXIMAL_EN_JOURS)} jours. Hors soldes, on ne revend pas sous le seuil de revente à perte, ${eur(x.srp.seuilTtc)} pour le col rond.`,
          "Au niveau de l'examen, vous savez classer des fournisseurs sur une grille pondérée et tester ce classement, chiffrer une coopération commerciale, calculer le seuil de revente à perte et la remise qu'il permet, et appliquer le cadre des négociations commerciales.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Note pondérée = somme des (poids × note) ÷ 100. Seuil de revente à perte = (prix net de la facture + transport − autres avantages du fournisseur) × (1 + TVA).",
    },
  ],
};
