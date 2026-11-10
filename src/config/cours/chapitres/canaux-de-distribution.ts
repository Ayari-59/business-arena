import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { DELAI_MAXIMAL_CONVENU } from "../monde/delais-et-tva";
import {
  canauxDeDistribution as lireLesCanaux,
  coutDeLAttente,
  coutVariable,
  delaiAcceptable,
  remiseDuDistributeur,
  venteAuDistributeur,
} from "../monde/economie-et-marketing";
import { ENTREPRISES_DU_MARCHE_DE_NOVA, POURQUOI_LE_MARCHE_DE_NOVA, mercatiqueDe } from "../monde/mercatique-de-nova";
import { COMPARATEUR, DISTRIBUTION_DES_ENSEIGNES, intermediaireDeNova } from "../monde/strategies-de-distribution";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LES CANAUX DE DISTRIBUTION (Bac STMG, mercatique, palier 1).
 *
 * Vendre directement au client, ou passer par un intermédiaire qui revend : le canal direct garde
 * toute la marge, le canal indirect touche des clients qu'on n'atteindrait pas seul, mais se paie, en
 * délai de paiement et en remise. Le chapitre compare les deux canaux de NOVA au premier trimestre,
 * chiffre ce que coûte l'intermédiaire par enceinte, et pèse ce qu'il apporte. Puis l'expérience : un
 * curseur (le délai le plus long dont l'attente reste acceptable) et un laboratoire (la remise la plus
 * forte qu'un distributeur peut obtenir).
 *
 * LE COMPLÉMENT DE TERMINALE (lot D du chantier STMG, question 2.1 : « Peut-on se passer d'intermédiaires ? »).
 * Avant la synthèse, cinq étapes couvrent le reste de la question : la distribution intensive, sélective
 * ou exclusive des trois enseignes du marché, les unités commerciales physiques et virtuelles, la désintermédiation (NOVA vend en direct) et la
 * réintermédiation (un comparateur s'intercale), et l'ECR, le réassort partagé avec CampusTech
 * (monde/strategies-de-distribution.ts).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/economie-et-marketing.ts) : les ventes du semestre de
 * nova-gestion.ts (les particuliers en ligne, qui paient à la commande ; CampusTech, une chaîne de
 * magasins sur les campus, 320 enceintes par mois au prix de 59 €), le délai convenu avec CampusTech
 * (60 jours, le plafond légal entre professionnels, code de commerce, article L. 441-10) et son retard
 * de 20 jours, le taux de l'emprunt (5 %) et la TVA (20 %). HYPOTHÈSES DU CHAPITRE : l'attente est
 * acceptable jusqu'à 1 % du chiffre d'affaires du canal ; NOVA veut garder 10 € de marge sur une
 * enceinte vendue par un distributeur.
 *
 * LE RETARD. Un délai au-delà de 60 jours ne se convient pas : c'est un retard. CampusTech paie 20
 * jours après l'échéance ; le chapitre chiffre le canal à ses conditions, et dit ce que le retard y
 * ajoute (le chapitre « Le client qui paie tard » le traite).
 *
 * CE QUI A CHANGÉ. Le chapitre lisait l'arène chez PIXEL & CO et NOVA ; il se joue chez NOVA seule, sur
 * le premier trimestre du monde du cours : 3 818 enceintes en direct, 960 par CampusTech.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const DISTRIBUTIONS: readonly string[] = ENTREPRISES_DU_MARCHE_DE_NOVA;

/** Les bornes du curseur (le délai, en jours) et du laboratoire (la remise, en %). */
const DELAI_DU_CURSEUR = { min: 0, max: 90 } as const;
const REMISE_DU_LABORATOIRE = { min: 0, max: 30, pas: 1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

const f = (c: Cas) => mercatiqueDe(c);

/** Les deux canaux au premier trimestre, et ce que coûte l'intermédiaire par enceinte. */
export const canauxDeDistribution = (c: Cas) => lireLesCanaux(f(c));

export const CANAUX_DE_DISTRIBUTION: Chapitre = {
  code: "canaux-de-distribution",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 2 · La distribution de l'offre"],
  titre: "Les canaux de distribution",
  accroche:
    "Vendre soi-même ou passer par un intermédiaire ? Le canal direct garde toute la marge, l'intermédiaire apporte des clients et se paie. Ce qu'il coûte, et ce qu'il rapporte.",
  objectifs: [
    "Distinguer canal direct et canal indirect",
    "Calculer la part d'un canal dans les ventes",
    "Chiffrer ce que coûte un intermédiaire par unité vendue",
    "Peser les avantages et les coûts d'un canal",
    "Choisir une distribution intensive, sélective ou exclusive",
    "Dire ce que sont la désintermédiation, la réintermédiation et l'ECR",
  ],
  libre: false,
  entreprises: { codes: DISTRIBUTIONS, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux chemins vers le client",
      notions: ["distribution_commission"],
      texte: (c) => {
        const k = canauxDeDistribution(c);
        return [
          `${c.entreprise} vend de deux façons. En ligne, à des particuliers qui paient à la commande : c'est un canal direct. Et par ${k.nomIndirect}, une chaîne de magasins sur les campus, qui lui achète des ${c.unites} pour les revendre et la paie à ${qte(k.delai)} jours : c'est un canal indirect court, avec un seul intermédiaire.`,
          "Le tableau compare les deux canaux au premier trimestre, de janvier à mars.",
        ];
      },
      tableau: (c) => {
        const k = canauxDeDistribution(c);
        return {
          titre: "Les deux canaux, premier trimestre",
          colonnes: ["Canal direct", `Canal indirect (${k.nomIndirect})`],
          lignes: [
            { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.direct.ventes), qte(k.intermediaire.ventes)] },
            { libelle: "Chiffre d'affaires", valeurs: [eur(k.direct.chiffreDAffaires), eur(k.intermediaire.chiffreDAffaires)] },
            { libelle: "Prix", valeurs: [eur(k.direct.prix), eur(k.intermediaire.prix)] },
            { libelle: "Commission prélevée", valeurs: [eur(0), eur(k.intermediaire.commission)] },
            { libelle: "Délai de paiement convenu", valeurs: ["à la commande", `${qte(k.delai)} jours`] },
          ],
        };
      },
      repere: () => "Canal direct : aucun intermédiaire. Canal court : un intermédiaire. Canal long : plusieurs intermédiaires (grossiste puis détaillant).",
    },
    {
      id: "part",
      objectifs: [0, 1],
      type: "montants",
      titre: "Le poids du canal indirect",
      notions: ["distribution_commission"],
      question: (c) => {
        const k = canauxDeDistribution(c);
        return `Au premier trimestre, ${c.entreprise} vend ${qte(k.direct.ventes)} ${c.unites} en direct et ${qte(k.intermediaire.ventes)} par ${k.nomIndirect}. Calculez la part du canal indirect dans les ventes, en pourcentage au dixième, puis ce que l'intermédiaire lui doit, hors taxes (chiffre d'affaires moins commission).`;
      },
      champs: (c) => {
        const k = canauxDeDistribution(c);
        const total = k.direct.ventes + k.intermediaire.ventes;
        return [
          { libelle: "Part du canal indirect (%)", attendu: k.partDesVentes, calcul: `${qte(k.intermediaire.ventes)} ÷ ${qte(total)} × 100 = ${pct(k.partDesVentes)}`, tolerance: 0.1 },
          { libelle: "Montant dû par l'intermédiaire", attendu: k.du, calcul: `${eur(k.intermediaire.chiffreDAffaires)} − ${eur(k.intermediaire.commission)} = ${eur(k.du)}` },
        ];
      },
      explication: (c) => {
        const k = canauxDeDistribution(c);
        return [`Ce trimestre, ${pct(k.partDesVentes)} des ventes passent par l'intermédiaire. ${k.intermediaire.commission > 0 ? `Il garde ${eur(k.intermediaire.commission)} de commission.` : "Il ne prend pas de commission ; son coût est ailleurs : il paie tard."}`];
      },
    },
    {
      id: "cout",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûte l'intermédiaire",
      notions: ["distribution_commission", "payment_terms"],
      question: (c) => {
        const k = canauxDeDistribution(c);
        return `${k.nomIndirect} paie à ${qte(k.delai)} jours. ${c.entreprise} attend le montant dû, taxes comprises (${pct(k.tva * 100)} de TVA, due dès la livraison), et finance cette attente au taux de son emprunt, ${pct(k.tauxDeLEmprunt)} par an. Calculez le coût du délai sur le trimestre (année de 360 jours), puis ce que coûte l'intermédiaire par ${c.unite} vendue, commission et délai compris.`;
      },
      champs: (c) => {
        const k = canauxDeDistribution(c);
        return [
          { libelle: "Coût du délai de paiement", attendu: k.coutDuDelai, calcul: `${eur(k.du)} × ${qte(1 + k.tva)} × ${pct(k.tauxDeLEmprunt)} × ${qte(k.delai)} ÷ 360 = ${eur(k.coutDuDelai)}`, tolerance: 1 },
          { libelle: "Coût de l'intermédiaire par unité", attendu: k.coutParUnite, calcul: `(${eur(k.intermediaire.commission)} + ${eur(k.coutDuDelai)}) ÷ ${qte(k.intermediaire.ventes)} = ${eur(k.coutParUnite)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const k = canauxDeDistribution(c);
        return [
          `Chaque ${c.unite} vendue par l'intermédiaire coûte ${eur(k.coutParUnite)} de plus qu'en direct, soit ${pct(k.partDuCoutDansLePrix)} de son prix : sans commission, tout le coût est dans l'attente du paiement.`,
          `Et ${k.nomIndirect} paie en retard, ${qte(k.retard)} jours après l'échéance : ce retard coûte ${eur(k.coutDuRetard)} de plus sur le trimestre. Un retard ne se négocie pas, il se relance.`,
        ];
      },
    },
    {
      id: "avantage",
      objectifs: [3],
      type: "choix",
      titre: "Pourquoi passer par un intermédiaire",
      notions: ["distribution_commission", "segmentation"],
      question: (c) => `Puisque le canal indirect coûte plus cher par ${c.unite}, pourquoi ${c.entreprise} l'utilise-t-elle ?`,
      options: (c) => {
        const k = canauxDeDistribution(c);
        return [
          {
            texte: "Il lui apporte des clients qu'elle n'atteindrait pas seule",
            juste: true,
            retour: `Oui : les ${qte(k.intermediaire.ventes)} ${c.unites} vendues par ${k.nomIndirect} viennent d'étudiants qui achètent en magasin sur leur campus, pas en ligne. Sans lui, ces ventes n'existeraient pas : son coût se compare à une vente perdue, pas à une vente directe.`,
          },
          { texte: "Il vend plus cher que le canal direct", juste: false, retour: `Non : il paie ${eur(k.intermediaire.prix)}, comme les clients directs (${eur(k.direct.prix)}). L'intérêt de l'intermédiaire n'est pas le prix.` },
          { texte: "Il paie plus vite que les clients directs", juste: false, retour: `Non : les clients directs paient à la commande, l'intermédiaire à ${qte(k.delai)} jours, et en retard. C'est l'un de ses coûts.` },
        ];
      },
    },
    {
      id: "le-delai-acceptable",
      objectifs: [2],
      type: "curseur",
      titre: "Le délai le plus long qu'on peut accepter",
      notions: ["payment_terms", "distribution_commission"],
      question: (c) => {
        const k = canauxDeDistribution(c);
        return `${c.entreprise} accepte que l'attente du paiement lui coûte au plus 1 % du chiffre d'affaires hors taxes du canal, soit ${eur(k.coutAcceptable)} sur le trimestre. Faites varier le délai de paiement, en jours : une droite donne ce que coûte l'attente, l'autre ce que ${c.entreprise} accepte. Placez le curseur sur le délai le plus long qu'elle peut accepter, puis validez.`;
      },
      grandeur: () => ({ libelle: "Délai de paiement", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: delaiAcceptable(f(c)), ...DELAI_DU_CURSEUR }),
      zones: ["L'attente reste acceptable", "L'attente coûte trop"],
      rates: () => ({
        dessous: "Ce délai reste acceptable, mais un délai plus long le serait encore : cherchez le plus long.",
        dessus: "À ce délai, l'attente coûte plus que ce que l'entreprise accepte.",
      }),
      montrer: "Montrer le délai",
      lecture: (c, q) => {
        const k = canauxDeDistribution(c);
        return [
          { libelle: "Coût de l'attente sur le trimestre", montant: coutDeLAttente(f(c), k.du, q), fort: true },
          { libelle: "Ce que l'entreprise accepte", montant: k.coutAcceptable },
        ];
      },
      droites: (c) => {
        const k = canauxDeDistribution(c);
        return { produit: () => k.coutAcceptable, cout: (q) => coutDeLAttente(f(c), k.du, q), libelles: ["Ce que l'entreprise accepte", "Coût de l'attente"] };
      },
      explication: (c) => {
        const k = canauxDeDistribution(c);
        const d = delaiAcceptable(f(c));
        return [
          `À ${qte(d)} jours, l'attente coûte ${eur(coutDeLAttente(f(c), k.du, d))} : juste ce que ${c.entreprise} accepte. C'est aussi le délai le plus long que la loi permet de convenir entre professionnels, ${qte(DELAI_MAXIMAL_CONVENU.joursDeLaFacture)} jours.`,
          `Avec le retard de ${k.nomIndirect}, l'attente coûte ${eur(k.coutDuDelai + k.coutDuRetard)} : plus que ce qui était accepté. Le retard d'un client se paie, même quand il finit par régler.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-remise",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la remise",
      notions: ["distribution_commission", "contribution_margin"],
      question: (c) => {
        const k = canauxDeDistribution(c);
        return `Un vrai distributeur achète moins cher qu'il ne revend : c'est sa marge. Une autre chaîne propose à ${c.entreprise} de vendre ses ${c.unites}, contre une remise sur le prix de ${eur(k.intermediaire.prix)}, payée à ${qte(k.delai)} jours. Faites varier la remise : le tableau donne le prix que paie le distributeur, ce que coûte l'attente, et la marge qui reste sur une ${c.unite} (le prix moins ${eur(coutVariable(f(c)))} de coût variable et l'attente). Relevez le défi.`;
      },
      leviers: () => [{ code: "remise", libelle: "Remise accordée au distributeur", unite: "%", ...REMISE_DU_LABORATOIRE, depart: REMISE_DU_LABORATOIRE.min }],
      lecture: (c, p) => {
        const v = venteAuDistributeur(f(c), p.remise!);
        const d = venteAuDistributeur(f(c), 0);
        return [
          { libelle: "Prix payé par le distributeur", montant: v.prixNet, reference: d.prixNet },
          { libelle: "Coût de l'attente, par unité", montant: v.attente, reference: d.attente },
          { libelle: "Marge qui reste par unité", montant: v.marge, reference: d.marge, fort: true },
        ];
      },
      graphique: (c) => ({
        levier: "remise",
        courbes: [
          { libelle: "Marge qui reste par unité", valeur: (p) => venteAuDistributeur(f(c), p.remise!).marge },
          { libelle: "Marge à garder", valeur: () => f(c).canal.margeAGarder },
        ],
      }),
      defi: (c) => {
        const juste = remiseDuDistributeur(f(c));
        const garder = f(c).canal.margeAGarder;
        return {
          consigne: `Trouvez la remise la plus forte, en pourcentage entier, qui laisse à ${c.entreprise} au moins ${eur(garder)} de marge par ${c.unite}.`,
          atteint: (p) => p.remise === juste,
          indice: (p) => {
            const v = venteAuDistributeur(f(c), p.remise!);
            return v.marge >= garder
              ? `À ${p.remise} %, il reste ${eur(v.marge)} : une remise plus forte le permettrait-elle encore ?`
              : `À ${p.remise} %, il ne reste que ${eur(v.marge)} : la remise est trop forte.`;
          },
          solution: { remise: juste },
        };
      },
      explication: (c, p) => {
        const v = venteAuDistributeur(f(c), p.remise!);
        const apres = venteAuDistributeur(f(c), p.remise! + 1);
        return [
          `Défi relevé : à ${p.remise} % de remise, le distributeur paie ${eur(v.prixNet)}, et il reste ${eur(v.marge)} à ${c.entreprise}. À ${p.remise! + 1} %, il ne resterait que ${eur(apres.marge)}.`,
          "Le canal indirect se paie en marge cédée : il vaut la peine tant que les ventes qu'il apporte laissent assez, et qu'on ne les aurait pas faites seul.",
        ];
      },
    },
    {
      id: "intensive-selective-exclusive",
      objectifs: [4],
      type: "tri",
      titre: "Partout, chez quelques-uns, ou chez un seul",
      notions: ["distribution_commission", "segmentation"],
      question: () => "Une entreprise choisit aussi combien d'intermédiaires vendent son produit. Rangez chaque enseigne du marché sous sa stratégie de distribution.",
      categories: [
        { code: "intensive", libelle: "Intensive : partout" },
        { code: "selective", libelle: "Sélective : quelques intermédiaires choisis" },
        { code: "exclusive", libelle: "Exclusive : un seul par zone" },
      ],
      elements: () => DISTRIBUTION_DES_ENSEIGNES.map((x) => ({ libelle: x.libelle, montant: 0, categorie: x.strategie, pourquoi: x.pourquoi })),
      relance: "L'enseigne cherche-t-elle à être partout, chez des revendeurs choisis, ou chez un seul ?",
      explication: () => ["Plus la distribution est large, plus le produit est vu, et moins l'enseigne contrôle sa présentation et son prix. Le haut de gamme choisit peu de revendeurs ; le produit courant veut être partout."],
    },
    {
      id: "les-unites-commerciales",
      objectifs: [5],
      type: "choix",
      titre: "Des magasins et un site",
      notions: ["distribution_commission"],
      question: (c) => `${intermediaireDeNova()} vend dans ses magasins sur les campus ; ${c.entreprise} vend sur son site. Qu'est-ce qui distingue ces deux unités commerciales ?`,
      options: () => [
        { texte: "L'une est physique, l'autre virtuelle", juste: true, retour: "Oui : un magasin est une unité commerciale physique, où le client vient ; un site ou une application est une unité commerciale virtuelle, ouverte partout et à toute heure. Une enseigne combine souvent les deux." },
        { texte: "Seul le magasin est une unité commerciale", juste: false, retour: "Non : un site qui vend est aussi une unité commerciale, virtuelle. Il a sa vitrine, son stock et ses clients." },
        { texte: "Le site vend toujours moins cher que le magasin", juste: false, retour: "Non : le prix ne fait pas la différence. Ce qui les distingue, c'est le lieu de la vente." },
      ],
    },
    {
      id: "la-desintermediation",
      objectifs: [5],
      type: "choix",
      titre: "Se passer d'intermédiaires",
      notions: ["distribution_commission"],
      question: (c) => `${c.entreprise} vend la plupart de ses ${c.unites} sur son propre site, sans grossiste ni magasin. Comment appelle-t-on ce mouvement ?`,
      options: () => [
        { texte: "La désintermédiation", juste: true, retour: "Oui : le numérique permet au fabricant de vendre directement au client, sans les intermédiaires d'autrefois. Il garde leur marge, mais fait leur travail : la vitrine, l'expédition, le service après-vente." },
        { texte: "La réintermédiation", juste: false, retour: "Non : la réintermédiation, c'est le retour d'un intermédiaire, souvent en ligne, entre le fabricant et le client." },
        { texte: "La distribution intensive", juste: false, retour: "Non : la distribution intensive cherche au contraire le plus d'intermédiaires possible." },
      ],
    },
    {
      id: "la-reintermediation",
      objectifs: [5],
      type: "choix",
      titre: "Un intermédiaire revient",
      notions: ["distribution_commission"],
      question: (c) => `De plus en plus de clients arrivent sur le site de ${c.entreprise} par ${COMPARATEUR.nom}, payé à chaque visite qu'il envoie. Peut-on vraiment se passer d'intermédiaires ?`,
      options: () => [
        { texte: "Rarement : d'autres reviennent", juste: true, retour: "Oui : c'est la réintermédiation. Le comparateur, la place de marché, l'application de livraison s'intercalent à nouveau entre le fabricant et le client, et se font payer." },
        { texte: "Oui : en ligne, le client vient toujours seul", juste: false, retour: "Non : le client en ligne passe souvent par un moteur de recherche, un comparateur ou une plateforme, qui se font payer pour l'envoyer." },
        { texte: "Non : il faut revenir aux grossistes", juste: false, retour: "Non : le grossiste ne revient pas ; ce sont des intermédiaires nouveaux, souvent numériques, qui prennent sa place." },
      ],
    },
    {
      id: "l-ecr",
      objectifs: [5],
      type: "choix",
      titre: "Travailler avec son distributeur",
      notions: ["distribution_commission", "stock"],
      question: (c) => `${intermediaireDeNova()} transmet chaque soir à ${c.entreprise} ses ventes magasin par magasin, et ${c.entreprise} réassortit chaque magasin sans attendre de commande. C'est une démarche d'ECR (Efficient Consumer Response). Que vise-t-elle ?`,
      options: () => [
        { texte: "Mieux servir, avec moins de stock", juste: true, retour: "Oui : le fabricant et le distributeur partagent l'information pour répondre ensemble à la demande du consommateur : moins de ruptures en rayon, moins de stock dormant, des coûts plus bas pour les deux." },
        { texte: "Faire payer le distributeur plus tôt", juste: false, retour: "Non : l'ECR ne change pas le délai de paiement. Il porte sur le réassort et l'offre en rayon." },
        { texte: "Remplacer le distributeur par le site", juste: false, retour: "Non : l'ECR suppose au contraire de travailler avec le distributeur, pas de s'en passer." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["distribution_commission"],
      texte: (c) => {
        const k = canauxDeDistribution(c);
        return [
          `Au premier trimestre, ${k.nomIndirect} apporte ${pct(k.partDesVentes)} des ventes ${dE(c.entreprise)}, et coûte ${eur(k.coutParUnite)} par ${c.unite} de plus que la vente directe, à ses conditions ; son retard y ajoute.`,
          "Choisir ses canaux, c'est arbitrer entre la marge, gardée entière en direct, et la portée, que donne un intermédiaire. La plupart des entreprises combinent les deux : on parle de distribution multicanal. Et l'on choisit combien d'intermédiaires : partout, quelques-uns, ou un seul. Dans l'arène, relevez à chaque tour les ventes de chaque clientèle, intermédiaire compris.",
        ];
      },
      repere: () => "Un canal indirect se juge sur les clients qu'il apporte, comparés à ce qu'il coûte par unité : commission, délai de paiement, et marge cédée.",
    },
  ],
};
