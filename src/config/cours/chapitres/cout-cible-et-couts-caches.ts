import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import {
  BANDE_DE_L_INDICE,
  COMPOSANTS_DES_COUTS_CACHES,
  DYSFONCTIONNEMENTS,
  ENQUETE_DE_PRIX,
  FONCTIONS_DE_LA_GO,
  HEURES_DE_RECHERCHE_DU_STOCK,
  LA_GO,
  MARGE_CIBLE_DE_LA_GO,
  MAJORATION_DES_HEURES_SUPPLEMENTAIRES,
  PART_DES_ABSENCES_RATTRAPEES,
  acceptabiliteDesPrix,
  chmcv,
  coutCibleDeLaGo,
  coutsCachesDeNPlus1,
  laboratoireDeLaValeur,
  prixDuCoutPlusMarge,
  valeurDeLaGoLancee,
  valeurDuProjet,
  type CodeDeDysfonctionnement,
} from "../monde/valeur-et-couts-caches";
import { FICHE_RH, HEURES_D_ABSENCE, HEURES_LEGALES_PAR_MOIS } from "../monde/ressources-humaines-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : COÛT CIBLE, ANALYSE DE LA VALEUR ET COÛTS CACHÉS (contrôle de gestion, palier 4 ;
 * DCG UE11 2025, 4.2 : analyser les causes de non-performance, coûts cachés, introduction à l'analyse
 * de la valeur, démarche du coût cible, coûts liés à la qualité et à la non-qualité ; BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/valeur-et-couts-caches.ts) et prolonge « Piloter un
 * centre » sans le contredire : la Go, son prix de 34 €, sa marge de 15 €, son coût cible de 19 €, ses
 * quatre fonctions et leurs coûts sont les mêmes. Il remonte d'où vient le prix (l'enquête
 * d'acceptabilité), mesure la valeur de chaque fonction (poids pour les clients ÷ part du coût), puis
 * passe des coûts d'un produit nouveau aux coûts que NOVA ne voit pas : les coûts cachés de l'année
 * N + 1, ceux de l'absentéisme, du départ d'un opérateur, de la non-qualité et du temps perdu,
 * valorisés par la méthode de l'ISEOR.
 *
 * La matière vient du cours du propriétaire : le chapitre « Le coût cible » (le prix imposé par le
 * marché, la vision marketing, l'enquête de prix et le taux d'acceptabilité, la décomposition par
 * fonction, l'optimisation par l'analyse de la valeur, 80 % des coûts engagés à la conception), et le
 * chapitre sur la qualité (les coûts cachés de l'ISEOR : cinq dysfonctionnements, cinq composants).
 *
 * LES TROIS TEMPS :
 *   · guidé : le-cout-cible-de-la-go, la-chmcv (la formule dans la question, avec les chiffres) ;
 *   · l'expérience avant la formule : predire-le-prix avant le curseur le-prix-du-cout-plus-marge ;
 *     predire-l-equilibre avant le laboratoire de la valeur (le coût du son, de la batterie et du module
 *     sans fil), avec le graphique du coût de la Go face à son coût cible ;
 *   · autonome : les-indices-de-valeur et le-tableau-des-couts-caches sont des tableaux à compléter,
 *     ranger-les-couts-caches un tri ;
 *   · expert : lire-les-couts-caches et ce-que-cache-une-economie, puis la synthèse.
 */

/** Le chapitre se calcule sur NOVA. */
export const ENTREPRISES_DU_COUT_CIBLE: readonly string[] = ["nova"];

/** Les bornes du curseur du prix de la Go, en euros. */
export const PRIX_DU_CURSEUR = { min: 30, max: 45 } as const;

/** Les leviers du laboratoire : le coût du son, de la batterie et du module sans fil, en euros par Go. */
export const LEVIERS_DE_LA_VALEUR = {
  son: { min: 6, max: 9, pas: 0.1 },
  autonomie: { min: 4.5, max: 9, pas: 0.1 },
  connexion: { min: 1, max: 4.5, pas: 0.1 },
} as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number, d = 1) => `${(Math.round(t * 10 ** (d + 2)) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−")} %`;
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;
const par = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const fonction = (code: string) => FONCTIONS_DE_LA_GO.find((x) => x.code === code)!;

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois (la fiche est figée). */
export function valeurDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre();
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre() {
  const cible = coutCibleDeLaGo();
  return {
    cible,
    projet: valeurDuProjet(),
    lancee: valeurDeLaGoLancee(),
    prixCoutPlus: prixDuCoutPlusMarge(),
    prixDuCurseur: Math.ceil(prixDuCoutPlusMarge() - 1e-9),
    enquete: acceptabiliteDesPrix(),
    h: chmcv(),
    caches: coutsCachesDeNPlus1(),
    /** La réduction à obtenir, en part du coût estimé. */
    reduction: cible.ecart / cible.coutEstime,
  };
}

const donnee = (valeur: number, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, ...autres });
const VIDE: CelluleACompleter = { valeur: null };
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Les fonctions de la Go : ce que l'élève a sous les yeux. */
export function tableauDesFonctions(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = valeurDuChapitre(c);
  return {
    titre: `Les fonctions de la ${LA_GO.nom}, premier projet du bureau d'études`,
    colonnes: ["Poids pour les clients", "Coût estimé"],
    lignes: [
      ...FONCTIONS_DE_LA_GO.map((f) => ({ libelle: f.libelle, valeurs: [pct(f.poids, 0), eur(f.coutEstime)] })),
      { libelle: `La ${LA_GO.nom} entière`, valeurs: [pct(1, 0), eur(x.cible.coutEstime)] },
    ],
  };
}

/** L'enquête de prix : à chaque prix, ceux qui la trouvent trop chère, trop peu chère, et ceux qui l'achèteraient. */
export function tableauDeLEnquete(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = valeurDuChapitre(c);
  return {
    titre: `L'enquête de prix de la ${LA_GO.nom} (${qte(ENQUETE_DE_PRIX.repondants)} clients)`,
    colonnes: ["Trop chère à ce prix", "Trop peu chère pour y croire", "Taux d'acceptabilité"],
    lignes: x.enquete.lignes.map((l) => ({ libelle: eur(l.prix), valeurs: [pct(l.tropCher, 0), pct(l.tropBas, 0), pct(l.acceptabilite, 0)] })),
  };
}

/** Les dysfonctionnements de N + 1 : ce que l'élève a sous les yeux pour les coûts cachés. */
export function tableauDesDysfonctionnements(c: Pick<Cas, "code">): TableauDeDonnees {
  const k = valeurDuChapitre(c).caches;
  return {
    titre: "Les dysfonctionnements de N + 1 chez NOVA",
    colonnes: ["Ce qui s'est passé"],
    lignes: [
      { libelle: "Absentéisme", valeurs: [`${qte(HEURES_D_ABSENCE)} heures d'absence ; la moitié rattrapée en heures supplémentaires majorées de ${pct(MAJORATION_DES_HEURES_SUPPLEMENTAIRES, 0)}, l'autre perdue`] },
      { libelle: "Accidents du travail", valeurs: ["Aucun"] },
      { libelle: "Rotation du personnel", valeurs: [`Un opérateur part fin mars : recrutement ${eur(k.depart.recrutement)}, ${qte(k.depart.ventesPerdues)} enceintes perdues, ${eur(k.depart.salairesNonVerses)} de salaires non versés`] },
      { libelle: "Non-qualité", valeurs: [`${qte(k.qualite.defauts)} défauts : ${qte(k.qualite.detectes)} retouchés au contrôle, ${qte(k.qualite.livres)} revenus sous garantie, ${qte(k.qualite.ventesPerdues)} ventes perdues`] },
      { libelle: "Écarts de productivité directe", valeurs: [`${qte(HEURES_DE_RECHERCHE_DU_STOCK)} heures à rechercher des jeux sortis sans bon`] },
    ],
  };
}

/** Une position du laboratoire, lue. */
export const laboratoireDuChapitre = (p: Readonly<Record<string, number>>) => laboratoireDeLaValeur(p.son!, p.autonomie!, p.connexion!);

/** Le défi : la Go au plus à son coût cible, chaque fonction dans la bande de l'indice. */
export function defiDeLaValeurAtteint(p: Readonly<Record<string, number>>) {
  const r = laboratoireDuChapitre(p);
  return r.total <= r.coutCible + 1e-9 && r.equilibre;
}

export const COUT_CIBLE_ET_COUTS_CACHES: Chapitre = {
  code: "cout-cible-et-couts-caches",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "Coût cible, analyse de la valeur et coûts cachés",
  accroche:
    "La Go doit coûter 19 € parce que le marché ne paiera pas plus de 34 €. Où trouver les 4,50 € de trop, fonction par fonction ? Puis NOVA regarde ses propres coûts : absences, départ, défauts. Combien lui coûte ce qu'aucun compte ne montre ?",
  objectifs: [
    "Calculer un coût cible à partir du prix que le marché accepte et de la marge visée, et le comparer au coût estimé",
    "Mener une analyse de la valeur : calculer l'indice de valeur de chaque fonction et dire où réduire le coût",
    "Valoriser les coûts cachés d'un dysfonctionnement selon la méthode de l'ISEOR, à la contribution horaire à la marge",
    "Construire le tableau des coûts cachés et en tirer les priorités d'action",
  ],
  libre: false,
  prerequis: ["piloter-un-centre", "le-cout-de-la-non-qualite"],
  ensuite: ["les-indicateurs-de-durabilite"],
  entreprises: {
    codes: ENTREPRISES_DU_COUT_CIBLE,
    pourquoi: "le coût cible et les coûts cachés se calculent ici sur NOVA dans la simulation du cours, sa Go et son année N + 1 ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un coût fixé par le marché",
      notions: ["price_floor", "variable_costs"],
      tableau: tableauDesFonctions,
      texte: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez NOVA. Dans « Piloter un centre », vous avez fixé le coût cible de la ${LA_GO.nom} : ${eur(x.cible.prix)} de prix, ${eur(x.cible.marge)} de marge, donc ${eur(x.cible.coutCible)} de coût. Le premier projet coûtait ${eur(x.cible.coutEstime)}.`,
          "Ce chapitre remonte d'un cran, puis descend d'un autre. D'où vient le prix que le marché accepte ? Comment savoir quelle fonction coûte trop, au regard de ce que les clients y voient ? Puis NOVA tourne le regard vers elle-même : que lui coûtent les dysfonctionnements que sa comptabilité ne montre pas ?",
        ];
      },
      repere: () =>
        "Coût cible = prix accepté par le marché − marge visée. La méthode part du client : le prix n'est pas le coût plus une marge, c'est le coût qui doit tenir dans le prix moins la marge.",
    },
    {
      id: "le-prix-du-marche",
      objectifs: [0],
      type: "choix",
      titre: "Le prix que le marché accepte",
      notions: ["psych_price", "price_floor"],
      tableau: tableauDeLEnquete,
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `Le service commercial a interrogé ${qte(ENQUETE_DE_PRIX.repondants)} clients. Chacun a dit à quel prix la Go serait trop chère, et à quel prix si peu chère qu'il douterait de sa qualité. À ${eur(x.enquete.lignes[1]!.prix)}, ${pct(x.enquete.lignes[1]!.tropBas, 0)} des clients la trouvent trop peu chère. Quel prix retenir pour lancer la Go ?`;
      },
      options: (c) => {
        const x = valeurDuChapitre(c);
        const e = x.enquete;
        const bas = e.lignes[0]!;
        const haut = e.lignes.at(-2)!;
        return [
          {
            texte: `${eur(e.prix)}, le prix le plus accepté`,
            juste: true,
            retour: `Oui. À ${eur(e.prix)}, ${pct(e.acceptabilite, 0)} des clients pourraient acheter : c'est le prix qui maximise les ventes. Il ne se calcule pas sur le coût, il se lit chez les clients. Le coût de la Go devra s'y plier.`,
          },
          {
            texte: `${eur(bas.prix)} : moins cher, la Go se vendra forcément mieux`,
            juste: false,
            retour: `Non : à ${eur(bas.prix)}, ${pct(bas.tropBas, 0)} des clients douteraient de sa qualité, et seuls ${pct(bas.acceptabilite, 0)} l'achèteraient. Un prix trop bas fait fuir autant qu'un prix trop haut.`,
          },
          {
            texte: `${eur(haut.prix)} : la marge sera plus confortable`,
            juste: false,
            retour: `Non : à ${eur(haut.prix)}, ${pct(haut.tropCher, 0)} des clients la trouvent trop chère. La marge par Go serait plus grande, sur beaucoup moins de Go.`,
          },
        ];
      },
    },
    {
      id: "predire-le-prix",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur le prix du projet",
      notions: ["price_floor"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `Avant de calculer, pariez. Si NOVA fixait son prix comme un ingénieur, coût du premier projet (${eur(x.cible.coutEstime)}) plus la marge de ${eur(MARGE_CIBLE_DE_LA_GO)}, à quel prix vendrait-elle la Go ?`;
      },
      options: (c) => {
        const x = valeurDuChapitre(c);
        const voir = "Faites varier le prix à l'étape suivante, face au coût du projet et à sa marge.";
        return [
          { texte: "Entre 36 et 40 €", juste: x.prixCoutPlus >= 36 && x.prixCoutPlus < 40, retour: `Bon pari. ${voir}` },
          { texte: "Moins de 36 €", juste: x.prixCoutPlus < 36, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus de 40 €, la marge étant forte", juste: x.prixCoutPlus >= 40, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-prix-du-cout-plus-marge",
      objectifs: [0],
      type: "curseur",
      titre: "Le prix du coût plus marge, au curseur",
      notions: ["price_floor", "contribution_margin"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `Faites varier le prix d'une Go, de ${eur(PRIX_DU_CURSEUR.min)} à ${eur(PRIX_DU_CURSEUR.max)}. Une droite donne le prix ; l'autre, ce qu'il faut pour couvrir le premier projet et sa marge : ${eur(x.cible.coutEstime)} + ${eur(MARGE_CIBLE_DE_LA_GO)}. Placez le curseur sur le plus petit prix, à l'euro, qui laisse la marge visée.`;
      },
      grandeur: () => ({ libelle: "Prix de vente d'une Go", unite: "€" }),
      cible: (c) => ({ attendu: valeurDuChapitre(c).prixDuCurseur, min: PRIX_DU_CURSEUR.min, max: PRIX_DU_CURSEUR.max }),
      zones: ["La marge visée est tenue", "La marge visée manque"],
      rates: () => ({
        dessous: "À ce prix, le premier projet ne laisse pas encore la marge visée.",
        dessus: "Moins cher, la marge visée tient encore : cherchez le plus petit prix.",
      }),
      montrer: "Montrer le prix du coût plus marge",
      lecture: (c, p) => {
        const x = valeurDuChapitre(c);
        return [
          { libelle: "Prix d'une Go", montant: p },
          { libelle: "Coût du premier projet", montant: x.cible.coutEstime },
          { libelle: "Marge par Go", montant: auCentime(p - x.cible.coutEstime), fort: true },
        ];
      },
      droites: (c) => {
        const x = valeurDuChapitre(c);
        return { produit: (p) => p, cout: () => x.prixCoutPlus, libelles: ["Prix d'une Go", "Coût du projet et marge visée"] };
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        const a = x.enquete.lignes.find((l) => l.prix >= x.prixDuCurseur) ?? x.enquete.lignes.at(-1)!;
        return [
          `Il faudrait ${eur(x.prixCoutPlus)}, soit ${eur(x.prixDuCurseur)} à l'euro. À ${eur(a.prix)}, l'enquête ne trouve que ${pct(a.acceptabilite, 0)} d'acheteurs, contre ${pct(x.enquete.acceptabilite, 0)} à ${eur(x.enquete.prix)}.`,
          "Le raisonnement de l'ingénieur part du coût ; celui du coût cible part du client. Comme le prix est imposé, c'est le coût qui devient la variable : il doit tenir dans le prix moins la marge.",
        ];
      },
    },
    {
      id: "le-cout-cible-de-la-go",
      objectifs: [0],
      type: "montants",
      titre: "Le coût cible et l'écart à combler",
      notions: ["price_floor", "variable_costs"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `Le prix est de ${eur(x.cible.prix)}, la marge visée de ${eur(x.cible.marge)}. Calculez le coût cible de la Go, l'écart entre le coût estimé du premier projet (${eur(x.cible.coutEstime)}) et ce coût cible, puis la baisse à obtenir, en pour cent du coût estimé, au dixième.`;
      },
      champs: (c) => {
        const k = valeurDuChapitre(c).cible;
        const r = valeurDuChapitre(c).reduction;
        return [
          { libelle: "Coût cible d'une Go", attendu: k.coutCible, calcul: `${eur(k.prix)} − ${eur(k.marge)} = ${eur(k.coutCible)}` },
          { libelle: "Écart au coût estimé", attendu: k.ecart, calcul: `${eur(k.coutEstime)} − ${eur(k.coutCible)} = ${eur(k.ecart)}` },
          { libelle: "Baisse à obtenir (%)", attendu: Math.round(r * 1000) / 10, tolerance: 0.1, calcul: `${eur(k.ecart)} ÷ ${eur(k.coutEstime)} = ${pct(r)}` },
        ];
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `Le premier projet doit perdre ${pct(x.reduction)} de son coût. Le bureau d'études travaille avant le lancement : une fois la batterie, le module sans fil et la coque choisis, l'essentiel du coût de la Go est engagé, même s'il n'est pas encore dépensé.`,
          "Reste à savoir où réduire. Un rabot égal sur toutes les fonctions serait aveugle : il faut comparer ce que coûte chaque fonction à ce qu'elle vaut pour le client.",
        ];
      },
    },
    {
      id: "les-indices-de-valeur",
      objectifs: [1],
      type: "a-completer",
      titre: "L'indice de valeur de chaque fonction",
      notions: ["variable_costs", "full_unit_cost"],
      question: () =>
        "À vous, sans formule : pour chaque fonction du premier projet, calculez sa part dans le coût de la Go, en pour cent au centième, puis son indice de valeur, au centième : le poids pour les clients ÷ la part du coût. Un indice sous 1 dit une fonction qui coûte plus que ce que les clients y voient.",
      grille: (c) => {
        const x = valeurDuChapitre(c);
        const v = x.projet;
        return {
          titre: `L'analyse de la valeur du premier projet · ${LA_GO.nom}`,
          colonnes: ["Poids pour les clients", "Coût estimé", "Part du coût", "Indice de valeur"],
          lignes: [
            ...v.parFonction.map((f) => ({
              libelle: f.libelle,
              cellules: [
                donnee(auCentieme(f.poids * 100), { unite: "%" }),
                donnee(f.cout),
                aSaisir(auCentieme(f.part * 100), `${eur(f.cout)} ÷ ${eur(v.total)} = ${pct(f.part, 2)}`, { unite: "%", horsTotal: true, tolerance: 0.01, indice: "le coût de la fonction ÷ le coût de la Go" }),
                aSaisir(auCentieme(f.indice), `${pct(f.poids, 0)} ÷ ${pct(f.part, 2)} = ${qte(f.indice, 2)}`, { unite: "", horsTotal: true, tolerance: 0.01, indice: "le poids de la fonction ÷ sa part du coût" }),
              ],
            })),
            {
              libelle: `La ${LA_GO.nom} entière`,
              fort: true,
              totalDe: { plus: v.parFonction.map((_, i) => i) },
              cellules: [donnee(100, { unite: "%" }), aSaisir(v.total, `${v.parFonction.map((f) => eur(f.cout)).join(" + ")} = ${eur(v.total)}`), VIDE, VIDE],
            },
          ],
        };
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        const tri = [...x.projet.parFonction].sort((a, b) => a.indice - b.indice);
        const bas = tri[0]!;
        const haut = tri.at(-1)!;
        return [
          `« ${bas.libelle} » a l'indice le plus bas, ${qte(bas.indice, 2)} : elle pèse ${pct(bas.part)} du coût pour ${pct(bas.poids, 0)} de la valeur. « ${haut.libelle} » a le plus haut, ${qte(haut.indice, 2)} : les clients y voient plus que ce qu'elle coûte.`,
          "La valeur d'un produit, c'est la satisfaction qu'il donne rapportée à ce qu'il coûte. L'analyse de la valeur cherche l'économie là où l'indice est bas, sans toucher à ce qui fait la satisfaction du client.",
        ];
      },
    },
    {
      id: "lire-les-indices",
      objectifs: [1],
      type: "choix",
      titre: "Ce que dit un indice bas",
      notions: ["variable_costs"],
      question: (c) => {
        const k = valeurDuChapitre(c).projet.parFonction.find((f) => f.code === "connexion")!;
        return `La fonction « ${k.libelle} » a un indice de ${qte(k.indice, 2)}. Que propose le contrôleur au bureau d'études ?`;
      },
      options: (c) => {
        const k = valeurDuChapitre(c).projet.parFonction.find((f) => f.code === "connexion")!;
        return [
          {
            texte: "Un module plus simple, qui garde la connexion",
            juste: true,
            retour: `Oui. La fonction coûte ${pct(k.part)} de la Go pour ${pct(k.poids, 0)} de la valeur : le client veut que la Go se connecte, pas un module haut de gamme. Un module standard rend le même service, moins cher. C'est ce qu'a fait NOVA : ${eur(fonction("connexion").coutRetenu)} au lieu de ${eur(fonction("connexion").coutEstime)}.`,
          },
          {
            texte: "Supprimer la connexion sans fil, la fonction la moins utile",
            juste: false,
            retour: "Non : une enceinte nomade qui ne se connecte pas au téléphone ne se vend pas. L'analyse de la valeur réduit le coût d'une fonction, elle ne retire pas une fonction que le client attend.",
          },
          {
            texte: "Rien : un indice sous 1 est normal pour une fonction technique",
            juste: false,
            retour: `Non : à ${qte(k.indice, 2)}, la fonction coûte bien plus que ce que les clients y voient. C'est le premier endroit où chercher l'économie.`,
          },
        ];
      },
    },
    {
      id: "predire-l-equilibre",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur l'équilibre",
      notions: ["variable_costs"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `Avant de manipuler, pariez. Si chaque fonction coûtait exactement sa part du coût cible (${eur(x.cible.coutCible)} × son poids), que vaudrait son indice de valeur ?`;
      },
      options: (c) => {
        const x = valeurDuChapitre(c);
        const un = x.lancee.parFonction.every((f) => Math.abs(f.indice - 1) < 1e-9);
        const voir = "Le laboratoire de l'étape suivante affiche l'indice de chaque fonction.";
        return [
          { texte: "1 pour chacune", juste: un, retour: `Bon pari. ${voir}` },
          { texte: "Son poids, de 0,1 à 0,4", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus de 1 pour le son, moins pour les autres", juste: !un, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-valeur",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire de la valeur",
      notions: ["variable_costs", "price_floor"],
      question: () =>
        "Faites varier le coût du son, de la batterie et du module sans fil, la coque restant à son coût retenu : le tableau suit le coût de la Go, sa marge et l'indice de valeur de chaque fonction. Relevez le défi, puis cherchez ce que coûte un son mieux servi.",
      leviers: () => {
        const L = LEVIERS_DE_LA_VALEUR;
        return [
          { code: "son", libelle: "Coût du son", unite: "€", ...L.son, depart: fonction("son").coutEstime },
          { code: "autonomie", libelle: "Coût de la batterie", unite: "€", ...L.autonomie, depart: fonction("autonomie").coutEstime },
          { code: "connexion", libelle: "Coût du module sans fil", unite: "€", ...L.connexion, depart: fonction("connexion").coutEstime },
        ];
      },
      lecture: (_c, p) => {
        const r = laboratoireDuChapitre(p);
        const d = laboratoireDeLaValeur(fonction("son").coutEstime, fonction("autonomie").coutEstime, fonction("connexion").coutEstime);
        const indice = (k: typeof r, code: string) => auCentieme(k.parFonction.find((f) => f.code === code)!.indice);
        return [
          { libelle: "Coût de la Go", montant: r.total, reference: d.total },
          { libelle: "Marge par Go, au prix du marché", montant: r.marge, reference: d.marge, fort: true },
          ...FONCTIONS_DE_LA_GO.map((f) => ({ libelle: `Indice de valeur : ${f.libelle.toLowerCase()}`, montant: indice(r, f.code), unite: "", reference: indice(d, f.code) })),
        ];
      },
      // Le coût de la Go suit la batterie ; le coût cible reste plat : la batterie seule ne suffit pas à le rejoindre.
      graphique: (c) => {
        const x = valeurDuChapitre(c);
        return {
          levier: "autonomie",
          courbes: [
            { libelle: "Coût de la Go", valeur: (p) => laboratoireDuChapitre(p).total },
            { libelle: "Coût cible", valeur: () => x.cible.coutCible },
          ],
        };
      },
      defi: (c) => {
        const x = valeurDuChapitre(c);
        return {
          consigne: `Ramenez la Go à ${eur(x.cible.coutCible)} au plus, avec un indice de valeur entre ${qte(BANDE_DE_L_INDICE.min)} et ${qte(BANDE_DE_L_INDICE.max)} pour chaque fonction.`,
          atteint: (p) => defiDeLaValeurAtteint(p),
          indice: (p) => {
            const r = laboratoireDuChapitre(p);
            if (r.total > r.coutCible + 1e-9) return `La Go coûte ${eur(r.total)}, ${eur(r.ecart)} au-dessus de son coût cible.`;
            const hors = r.parFonction.find((f) => f.indice < BANDE_DE_L_INDICE.min - 1e-9 || f.indice > BANDE_DE_L_INDICE.max + 1e-9)!;
            return hors.indice < 1
              ? `« ${hors.libelle} » coûte trop pour ce que les clients y voient : indice ${qte(hors.indice, 2)}.`
              : `« ${hors.libelle} » est trop peu servie pour ce que les clients y voient : indice ${qte(hors.indice, 2)}.`;
          },
          solution: { son: fonction("son").coutRetenu, autonomie: fonction("autonomie").coutRetenu, connexion: fonction("connexion").coutRetenu },
        };
      },
      explication: (_c, p) => {
        const r = laboratoireDuChapitre(p);
        return [
          `Défi relevé : la Go coûte ${eur(r.total)} et laisse ${eur(r.marge)} de marge. Chaque fonction coûte à peu près ce qu'elle vaut pour les clients.`,
          `Baisser la batterie seule ne suffit pas : il faut aussi le module sans fil. Et le son, que le premier projet sous-servait, a pu recevoir plus : l'analyse de la valeur ne coupe pas partout, elle déplace la dépense vers ce que le client attend.`,
        ];
      },
    },
    {
      id: "les-couts-caches",
      type: "lecture",
      titre: "Ce que les comptes ne montrent pas",
      notions: ["productivity", "staff_turnover"],
      tableau: tableauDesDysfonctionnements,
      texte: (c) => {
        const k = valeurDuChapitre(c).caches;
        return [
          `Le coût cible regarde un produit à venir. NOVA regarde maintenant son année N + 1, celle des chapitres de ressources humaines et de qualité. Les comptes y montrent ${eur(k.masseChargee)} de personnel ; ils ne montrent ni l'heure perdue d'une absence, ni la vente manquée d'un poste vide, ni le client qui ne rachète pas.`,
          "Ce sont des coûts cachés : ils existent, mais ils sont fondus dans d'autres charges ou dans des produits qui n'ont pas eu lieu. L'ISEOR les fait apparaître en partant de cinq dysfonctionnements : l'absentéisme, les accidents du travail, la rotation du personnel, la non-qualité et les écarts de productivité directe.",
          "Chaque dysfonctionnement se régule de cinq façons. Par des surcharges : des sursalaires, des surtemps, des surconsommations. Ou par des non-produits : de la non-production, et de la non-création de potentiel, ce que l'entreprise perd pour l'avenir.",
        ];
      },
      repere: () =>
        "Coûts cachés = surcharges (sursalaires + surtemps + surconsommations) + non-produits (non-production + non-création de potentiel). Une heure perdue se valorise à la contribution horaire à la marge sur coût variable : marge sur coût variable ÷ heures attendues.",
    },
    {
      id: "la-chmcv",
      objectifs: [2],
      type: "montants",
      titre: "Ce que vaut une heure de travail",
      notions: ["productivity", "contribution_margin"],
      question: (c) => {
        const h = valeurDuChapitre(c).h;
        return `En N + 1, NOVA prévoit de vendre ${qte(h.production)} enceintes, avec ${eur(h.margeUnitaire)} de marge sur coût variable chacune. L'équipe doit ${qte(h.heures)} heures (${qte(FICHE_RH.plan.operateurs)} opérateurs × ${qte(HEURES_LEGALES_PAR_MOIS)} heures × 12 mois). Calculez la marge sur coût variable de l'année, la CHMCV au centime, puis ce que coûtent les heures d'absence non rattrapées et les heures de recherche du stock.`;
      },
      champs: (c) => {
        const x = valeurDuChapitre(c);
        const h = x.h;
        const k = x.caches;
        return [
          { libelle: "Marge sur coût variable de N + 1", attendu: h.marge, calcul: `${qte(h.production)} × ${eur(h.margeUnitaire)} = ${eur(h.marge)}` },
          { libelle: "CHMCV", attendu: h.valeur, calcul: `${eur(h.marge)} ÷ ${qte(h.heures)} = ${qte(h.marge / h.heures, 4)} €, au centime ${eur(h.valeur)} de l'heure` },
          { libelle: "Non-production de l'absentéisme", attendu: k.lignes.absenteisme.nonProduction, calcul: `${qte(HEURES_D_ABSENCE)} × ${pct(1 - PART_DES_ABSENCES_RATTRAPEES, 0)} = ${qte(k.perdues)} heures × ${eur(h.valeur)} = ${eur(k.lignes.absenteisme.nonProduction)}` },
          { libelle: "Surtemps de la recherche du stock", attendu: k.lignes.productivite.surtemps, calcul: `${qte(HEURES_DE_RECHERCHE_DU_STOCK)} heures × ${eur(h.valeur)} = ${eur(k.lignes.productivite.surtemps)}` },
        ];
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        const k = x.caches;
        return [
          `Une heure de travail rapporte en moyenne ${eur(x.h.valeur)} de marge : une heure perdue la coûte, alors que son salaire, lui, est payé de toute façon. Les heures rattrapées en heures supplémentaires coûtent ${eur(k.heureSup)} chacune, cotisations comprises : ${eur(k.lignes.absenteisme.sursalaires)} de sursalaires.`,
          "La CHMCV n'est qu'une moyenne : elle suppose que l'heure perdue aurait produit autant qu'une heure ordinaire. C'est la convention de l'ISEOR, et sa limite.",
        ];
      },
    },
    {
      id: "ranger-les-couts-caches",
      objectifs: [2],
      type: "tri",
      titre: "Ranger les coûts cachés",
      notions: ["productivity", "staff_turnover"],
      question: () => "Rangez chaque coût caché de N + 1 dans son composant : un sursalaire, un surtemps, une surconsommation, de la non-production ou de la non-création de potentiel.",
      categories: COMPOSANTS_DES_COUTS_CACHES.map((k) => ({ code: k.code, libelle: k.libelle })),
      elements: (c) => {
        const k = valeurDuChapitre(c).caches;
        const l = k.lignes;
        return [
          { libelle: "Les heures supplémentaires qui rattrapent les absences", montant: l.absenteisme.sursalaires, categorie: "sursalaires", pourquoi: "Un salaire payé en plus pour faire le travail d'un absent : un sursalaire." },
          { libelle: "Les heures d'absence non rattrapées", montant: l.absenteisme.nonProduction, categorie: "nonProduction", pourquoi: "Des enceintes qui n'ont pas été montées : de la non-production, à la CHMCV." },
          { libelle: "Le recrutement du remplaçant", montant: l.rotation.surconsommations, categorie: "surconsommations", pourquoi: "Des achats en plus (l'annonce, les entretiens, les essais) : une surconsommation." },
          { libelle: "Les enceintes perdues pendant que le poste est vide", montant: l.rotation.nonProduction, categorie: "nonProduction", pourquoi: "Des ventes qui n'ont pas eu lieu faute de bras : de la non-production." },
          { libelle: "Les salaires non versés pendant la vacance", montant: l.rotation.sursalaires, categorie: "sursalaires", pourquoi: "Des salaires en moins : un sursalaire négatif, qui allège le coût du départ." },
          { libelle: "Les retouches des défauts trouvés au contrôle", montant: l.nonQualite.surtemps, categorie: "surtemps", pourquoi: "Du temps passé à refaire ce qui aurait dû être bien fait : un surtemps." },
          { libelle: "Les échanges sous garantie", montant: l.nonQualite.surconsommations, categorie: "surconsommations", pourquoi: "Des enceintes et des transports en plus : une surconsommation." },
          { libelle: "Les ventes que les clients déçus font perdre", montant: l.nonQualite.nonCreation, categorie: "nonCreation", pourquoi: "Des clients qui ne reviendront pas : NOVA perd du potentiel pour l'avenir." },
          { libelle: "La recherche des jeux sortis sans bon", montant: l.productivite.surtemps, categorie: "surtemps", pourquoi: "Du temps de travail qui ne monte aucune enceinte : un surtemps." },
        ];
      },
      explication: (c) => {
        const k = valeurDuChapitre(c).caches;
        return [
          `Les surcharges font ${eur(k.surcharges)}, les non-produits ${eur(k.nonProduits)}. Les surcharges se retrouvent dans les charges, mêlées aux autres ; les non-produits ne sont nulle part dans les comptes, puisqu'ils n'ont pas eu lieu.`,
        ];
      },
      relance: "Demandez-vous si le coût est une dépense en plus (un salaire, du temps, un achat) ou une recette qui n'a pas eu lieu (aujourd'hui, ou demain).",
    },
    {
      id: "le-tableau-des-couts-caches",
      objectifs: [3],
      type: "a-completer",
      titre: "Le tableau des coûts cachés",
      notions: ["productivity", "staff_turnover"],
      question: () =>
        "À vous : remplissez le tableau des coûts cachés de N + 1, dysfonctionnement par dysfonctionnement. Les surcharges additionnent sursalaires, surtemps et surconsommations ; les non-produits, la non-production et la non-création de potentiel.",
      grille: (c) => {
        const k = valeurDuChapitre(c).caches;
        const surcharges = (code: CodeDeDysfonctionnement) => auCentime(k.lignes[code].sursalaires + k.lignes[code].surtemps + k.lignes[code].surconsommations);
        const nonProduits = (code: CodeDeDysfonctionnement) => auCentime(k.lignes[code].nonProduction + k.lignes[code].nonCreation);
        const detail = (code: CodeDeDysfonctionnement, cles: readonly ("sursalaires" | "surtemps" | "surconsommations" | "nonProduction" | "nonCreation")[]) =>
          cles.map((x) => k.lignes[code][x]).filter((v) => v !== 0);
        const calcul = (vals: number[], total: number) => (vals.length > 1 ? `${vals.map(par).join(" + ")} = ${eur(total)}` : `${eur(total)}`);
        const ligne = (code: CodeDeDysfonctionnement, libelle: string) => {
          const s = surcharges(code);
          const n = nonProduits(code);
          const t = k.parDysfonctionnement[code];
          if (code === "accidents") return { libelle, cellules: [donnee(0), donnee(0), donnee(0)] };
          return {
            libelle,
            cellules: [
              aSaisir(s, calcul(detail(code, ["sursalaires", "surtemps", "surconsommations"]), s), { indice: "sursalaires + surtemps + surconsommations" }),
              aSaisir(n, calcul(detail(code, ["nonProduction", "nonCreation"]), n), { indice: "non-production + non-création de potentiel" }),
              aSaisir(t, `${par(s)} + ${eur(n)} = ${eur(t)}`),
            ],
          };
        };
        return {
          titre: "Les coûts cachés de N + 1 · NOVA",
          colonnes: ["Surcharges", "Non-produits", "Total"],
          colonneDeTotal: 2,
          lignes: [
            ...DYSFONCTIONNEMENTS.map((d) => ligne(d.code, d.libelle)),
            {
              libelle: "Les coûts cachés de l'année",
              fort: true,
              totalDe: { plus: DYSFONCTIONNEMENTS.map((_, i) => i) },
              cellules: [aSaisir(k.surcharges, `la somme de la colonne : ${eur(k.surcharges)}`), aSaisir(k.nonProduits, `la somme de la colonne : ${eur(k.nonProduits)}`), aSaisir(k.total, `${eur(k.surcharges)} + ${eur(k.nonProduits)} = ${eur(k.total)}`)],
            },
          ],
        };
      },
      explication: (c) => {
        const k = valeurDuChapitre(c).caches;
        return [
          `Les coûts cachés de N + 1 font ${eur(k.total)}, soit ${eur(k.parSalarie)} par opérateur et ${pct(k.partDeLaMasse)} de la masse salariale chargée (${eur(k.masseChargee)}). Aucun compte de NOVA ne porte ce total.`,
          "Plus de la moitié sont des non-produits : de la marge qui n'a pas eu lieu. C'est pourquoi un budget qui ne suit que les charges ne les voit jamais.",
        ];
      },
    },
    {
      id: "lire-les-couts-caches",
      objectifs: [3],
      type: "choix",
      titre: "Par où commencer",
      notions: ["productivity", "staff_turnover"],
      question: (c) => {
        const k = valeurDuChapitre(c).caches;
        return `La présidente veut s'attaquer à un dysfonctionnement en N + 2. Les coûts cachés de N + 1 font ${eur(k.total)}. Lequel lui proposez-vous d'abord ?`;
      },
      options: (c) => {
        const k = valeurDuChapitre(c).caches;
        const d = k.parDysfonctionnement;
        return [
          {
            texte: "La non-qualité, la moitié des coûts cachés",
            juste: d.nonQualite > d.rotation && d.nonQualite > d.absenteisme,
            retour: `Oui. La non-qualité coûte ${eur(d.nonQualite)}, ${pct(d.nonQualite / k.total)} des coûts cachés : retouches, échanges et clients perdus. Une démarche qualité qui prévient les défauts agit sur les trois composants à la fois.`,
          },
          {
            texte: "L'absentéisme : ce sont des heures payées pour rien",
            juste: false,
            retour: `Non : il coûte ${eur(d.absenteisme)}, beaucoup moins que la non-qualité (${eur(d.nonQualite)}) ou la rotation (${eur(d.rotation)}). Il se suit, mais il ne vient pas en premier.`,
          },
          {
            texte: "Aucun : ces coûts ne sont pas dans les comptes, ils ne sont pas réels",
            juste: false,
            retour: `Non : ${eur(k.total)} de marge perdue ou de charges en plus, c'est de l'argent bien réel. Caché ne veut pas dire fictif : cela veut dire que le système d'information ne le montre pas.`,
          },
        ];
      },
    },
    {
      id: "ce-que-cache-une-economie",
      objectifs: [3],
      type: "choix",
      titre: "Ce que cache une économie",
      notions: ["productivity"],
      question: (c) => {
        const k = valeurDuChapitre(c).caches;
        return `Pour tenir son budget, le chef d'atelier propose de supprimer le contrôle final de chaque enceinte, ${eur(k.qualite.detection)} par an. Qu'en dit le contrôleur de gestion ?`;
      },
      options: (c) => {
        const k = valeurDuChapitre(c).caches;
        return [
          {
            texte: "L'économie visible ferait monter des coûts cachés",
            juste: true,
            retour: `Oui. Sans contrôle, les ${qte(k.qualite.detectes)} défauts aujourd'hui retouchés partiraient chez les clients : des échanges sous garantie et des clients perdus, comptés au service commercial. L'atelier aurait tenu son budget, NOVA aurait perdu de l'argent.`,
          },
          {
            texte: "Bonne idée : le budget de l'atelier baisse, le résultat monte",
            juste: false,
            retour: "Non : le résultat ne monte que si rien d'autre ne bouge. Ici, ce que l'atelier économise, le service commercial le paie en garanties et en ventes perdues.",
          },
          {
            texte: "Il faut d'abord comparer le contrôle à la CHMCV de l'atelier",
            juste: false,
            retour: "Non : la CHMCV valorise du temps perdu. La question est de savoir où partent les défauts que le contrôle ne trouverait plus, et ce qu'ils coûtent là-bas.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["price_floor", "variable_costs", "productivity"],
      texte: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `Vous avez lu le prix que le marché accepte pour la Go, ${eur(x.enquete.prix)}, et vu qu'un prix « coût plus marge » (${eur(x.prixCoutPlus)}) l'aurait mise hors marché. Vous en avez tiré le coût cible, ${eur(x.cible.coutCible)}, et l'écart de ${eur(x.cible.ecart)}.`,
          `Vous avez calculé l'indice de valeur de chaque fonction et trouvé où réduire le coût sans toucher à ce que veulent les clients. Puis vous avez fait apparaître ${eur(x.caches.total)} de coûts cachés dans l'année N + 1 de NOVA, rangés en surcharges et non-produits.`,
          "Au niveau de l'examen, vous savez calculer et répartir un coût cible, mener une analyse de la valeur, valoriser des coûts cachés à la CHMCV et dire par quel dysfonctionnement commencer.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût cible = prix du marché − marge visée. Indice de valeur = poids de la fonction pour le client ÷ part de la fonction dans le coût. CHMCV = marge sur coût variable ÷ heures attendues. Coûts cachés = surcharges + non-produits.",
    },
  ],
};
