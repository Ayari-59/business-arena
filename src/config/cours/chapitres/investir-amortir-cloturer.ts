import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_INVESTISSEMENT, LIGNE, PRIX_DU_REVENDEUR, acquisition, cessionDuPoste, creanceDeSonora, planDeLaLigne, prixSansMoinsValue, travail } from "../monde/investir-et-cloturer";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : INVESTIR, AMORTIR, CLÔTURER, UNE IMAGE FIDÈLE DES COMPTES (Bac STMG, gestion et finance de
 * terminale, thème 1, questions 1.3 : « Investir, quelle traduction comptable ? » et 1.4 : « Quelles sont
 * les conditions pour communiquer une information comptable fidèle ? »).
 *
 * La version lycée (décision du propriétaire, novembre 2026) de ce que les chapitres de BTS enseignaient
 * (« Immobilisations et amortissements », « La clôture », « Dépréciations et provisions ») : le processus
 * d'investissement, la différence entre un actif et une charge, le coût d'acquisition, le plan
 * d'amortissement linéaire selon une approche économique, l'exercice et l'inventaire, les principes
 * comptables (prudence, indépendance des exercices, continuité de l'exploitation, permanence des
 * méthodes), le stock final, la dépréciation d'une créance, la cession d'une immobilisation amortissable
 * (son prix plancher au curseur) et l'annexe. Sans écriture au journal : la traduction se lit dans le
 * bilan et le compte de résultat.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/investir-et-cloturer.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const INVESTIR_AMORTIR_CLOTURER: Chapitre = {
  code: "investir-amortir-cloturer",
  parcours: "stmg-gf",
  palier: 1,
  blocs: ["STMG Thème 1 · Appliquer les règles comptables"],
  titre: "Investir, amortir, clôturer : une image fidèle des comptes",
  accroche:
    "Une ligne de montage achetée en janvier ne se compte pas comme une facture d'électricité. Ce qu'elle coûte chaque année, ce qu'elle vaut au bilan, ce qu'on gagne ou perd à la revendre, et les règles qui font des comptes une image fidèle.",
  objectifs: [
    "Distinguer un investissement d'une charge et calculer un coût d'acquisition",
    "Construire un plan d'amortissement linéaire",
    "Appliquer les principes comptables de la clôture",
    "Évaluer à la clôture un stock et une créance douteuse",
    "Calculer le résultat de cession d'une immobilisation",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_INVESTISSEMENT,
    pourquoi: "ce chapitre suit la ligne de montage de NOVA et sa clôture du 31 décembre N.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Investir, ce n'est pas dépenser",
      texte: (c) => [
        `Le 6 janvier N, ${c.entreprise} achète et met en service sa ligne de montage : ${qte(LIGNE.quantite)} postes à ${eur(LIGNE.prixUnitaireHt)} hors taxes. Le processus d'investissement suit des étapes : la commande, la réception, la facture, le règlement, puis l'utilisation pendant des années.`,
        "Un investissement est un actif : une ressource que l'entreprise contrôle et qui lui servira longtemps. Il va au bilan, pas dans les charges de l'année. Une charge, elle, est consommée dans l'année.",
      ],
      repere: () => "Actif immobilisé : un bien durable, au bilan. Charge : une consommation de l'exercice, au compte de résultat.",
    },
    {
      id: "actif-ou-charge",
      objectifs: [0],
      type: "tri",
      titre: "Actif ou charge",
      question: () => "Rangez chaque dépense de NOVA.",
      categories: [
        { code: "actif", libelle: "Un actif (une immobilisation)" },
        { code: "charge", libelle: "Une charge de l'exercice" },
      ],
      elements: () => [
        { libelle: "Les postes de la ligne de montage", montant: LIGNE.ht, categorie: "actif", pourquoi: "Un équipement qui servira plusieurs années." },
        { libelle: "Le logiciel de gestion acheté, utilisé pendant des années", montant: 0, categorie: "actif", pourquoi: "Une immobilisation, même sans matière : elle dure." },
        { libelle: "Les composants montés dans les enceintes du mois", montant: 0, categorie: "charge", pourquoi: "Consommés dans l'année." },
        { libelle: "Le loyer du local", montant: 0, categorie: "charge", pourquoi: "Il paie l'usage du mois : une charge." },
        { libelle: "La révision annuelle de la ligne par le fabricant", montant: 0, categorie: "charge", pourquoi: "L'entretien garde la ligne en état sans prolonger sa durée : une charge." },
      ],
      relance: "La dépense achète-t-elle un bien qui servira plusieurs années, ou quelque chose consommé dans l'année ?",
      explication: () => ["Ranger un actif en charge ferait baisser à tort le résultat de l'année, et disparaître du bilan un bien que l'entreprise possède."],
    },
    {
      id: "le-cout-d-acquisition",
      objectifs: [0],
      type: "montants",
      titre: "Le coût d'acquisition",
      question: () => {
        const a = acquisition();
        return `La facture compte ${qte(a.postes)} postes à ${eur(a.prixUnitaire)} hors taxes, transport et installation compris, plus ${qte(a.tauxPct)} % de TVA. NOVA récupère la TVA. Calculez le coût d'acquisition de la ligne (ce qui va au bilan), la TVA récupérable, et le montant réglé au fournisseur.`;
      },
      champs: () => {
        const a = acquisition();
        return [
          { libelle: "Coût d'acquisition de la ligne", attendu: a.cout, calcul: `${qte(a.postes)} × ${eur(a.prixUnitaire)} = ${eur(a.cout)}, hors taxes` },
          { libelle: "TVA récupérable", attendu: a.tva, calcul: `${eur(a.cout)} × ${qte(a.tauxPct)} % = ${eur(a.tva)}` },
          { libelle: "Montant réglé", attendu: a.regle, calcul: `${eur(a.cout)} + ${eur(a.tva)} = ${eur(a.regle)}` },
        ];
      },
      explication: () => {
        const a = acquisition();
        return [`La ligne entre au bilan pour ${eur(a.cout)} : le prix d'achat hors taxes et les frais pour la mettre en état de marche. La TVA, que l'État rendra, n'en fait pas partie.`];
      },
    },
    {
      id: "l-amortissement",
      type: "lecture",
      titre: "L'amortissement : répartir l'usure",
      texte: () => {
        const p = planDeLaLigne();
        return [
          `La ligne s'use. L'amortissement constate cette perte de valeur et répartit le coût de la ligne sur sa durée d'utilisation, ${qte(p.duree)} ans : c'est une approche économique. Chaque année, une dotation aux amortissements est une charge, qui ne fait sortir aucun argent.`,
          `En linéaire, l'annuité est la même chaque année pleine : le coût ÷ la durée. La première année se compte au prorata des jours d'utilisation, sur une année de 360 jours : la ligne a servi ${qte(p.joursDeN)} jours en N.`,
        ];
      },
      repere: () => "Annuité linéaire = coût d'acquisition ÷ durée. Valeur nette comptable = coût − amortissements cumulés.",
    },
    {
      id: "le-plan",
      objectifs: [1],
      type: "montants",
      titre: "Le plan d'amortissement",
      question: () => "Calculez l'annuité d'une année pleine, la dotation de N (au prorata, au centime), la valeur nette comptable au 31 décembre N, puis celle au 31 décembre N + 1.",
      champs: () => {
        const p = planDeLaLigne();
        return [
          { libelle: "Annuité d'une année pleine", attendu: p.annuite, calcul: `${eur(p.valeurBrute)} ÷ ${qte(p.duree)} = ${eur(p.annuite)}` },
          { libelle: "Dotation de N", attendu: p.n.dotation, calcul: `${eur(p.annuite)} × ${qte(p.joursDeN)} ÷ 360 = ${eur(p.n.dotation)}` },
          { libelle: "Valeur nette au 31 décembre N", attendu: p.n.valeurNette, calcul: `${eur(p.valeurBrute)} − ${eur(p.n.cumul)} = ${eur(p.n.valeurNette)}` },
          { libelle: "Valeur nette au 31 décembre N + 1", attendu: p.n1.valeurNette, calcul: `${eur(p.valeurBrute)} − (${eur(p.n.cumul)} + ${eur(p.n1.dotation)}) = ${eur(p.n1.valeurNette)}` },
        ];
      },
      explication: () => {
        const p = planDeLaLigne();
        return [`Le plan court sur ${qte(p.exercices)} exercices : la première année n'est pas pleine, la dernière reprend les jours qui manquaient. Au bilan, la ligne vaut ${eur(p.n.valeurNette)} fin N : son coût, moins ce qui en est usé.`];
      },
    },
    {
      id: "la-cloture",
      type: "lecture",
      titre: "L'exercice, l'inventaire, les principes",
      texte: () => [
        "Les comptes se tiennent par exercice, d'ordinaire un an. À sa clôture, le 31 décembre N, NOVA fait l'inventaire : elle compte ce qu'elle possède et ce qu'elle doit, et l'évalue. Elle passe les opérations d'ajustement qui font du bilan et du compte de résultat une image fidèle.",
        "Ces évaluations suivent des principes comptables. La prudence : constater les pertes probables, pas les gains espérés. L'indépendance des exercices : chaque année porte ses propres charges et produits. Puis la continuité de l'exploitation (l'entreprise est évaluée comme si elle continuait), la permanence des méthodes (les mêmes règles d'une année à l'autre).",
      ],
      repere: () => "Prudence · indépendance des exercices · continuité de l'exploitation · permanence des méthodes.",
    },
    {
      id: "les-principes",
      objectifs: [2],
      type: "tri",
      titre: "Quel principe ?",
      question: () => "Rangez chaque travail de la clôture de NOVA selon le principe qu'il applique d'abord.",
      categories: [
        { code: "prudence", libelle: "Prudence" },
        { code: "independance", libelle: "Indépendance des exercices" },
        { code: "continuite", libelle: "Continuité de l'exploitation" },
        { code: "permanence", libelle: "Permanence des méthodes" },
      ],
      elements: () => [
        { libelle: "Déprécier la créance de Sonora, en redressement judiciaire", montant: creanceDeSonora().depreciation, categorie: "prudence", pourquoi: "Une perte probable se constate sans attendre qu'elle soit sûre." },
        { libelle: "Retirer des charges de N la part de l'assurance qui couvre N + 1", montant: travail("chargeConstateeDAvance").montant, categorie: "independance", pourquoi: "Chaque exercice ne porte que ses propres charges." },
        { libelle: "Évaluer la ligne à sa valeur nette, comme si NOVA continuait de produire", montant: planDeLaLigne().n.valeurNette, categorie: "continuite", pourquoi: "On ne l'évalue pas à ce qu'elle se revendrait demain : l'entreprise continue." },
        { libelle: "Amortir la ligne en linéaire, comme l'année précédente et la suivante", montant: 0, categorie: "permanence", pourquoi: "Garder la même méthode rend les comptes comparables d'une année à l'autre." },
      ],
      relance: "Le travail constate-t-il une perte probable, rattache-t-il une charge à la bonne année, suppose-t-il que l'entreprise continue, ou garde-t-il la même règle ?",
      explication: () => ["Ces principes ne sont pas des détails techniques : ils protègent ceux qui lisent les comptes, associés, banquiers, salariés, État. L'annexe explique les méthodes retenues."],
    },
    {
      id: "le-stock-final",
      objectifs: [3],
      type: "choix",
      titre: "Le stock de composants",
      question: () => `Au 31 décembre N, il reste des composants en magasin, comptés et évalués à ${eur(travail("stock").montant)}. Que fait l'inventaire de ce stock ?`,
      options: () => [
        {
          texte: "Il va au bilan, et réduit les achats consommés de l'année",
          juste: true,
          retour: `Oui : les composants achetés mais pas encore montés ne sont pas une charge de N. Ils vont à l'actif du bilan pour ${eur(travail("stock").montant)}, et le résultat de N monte d'autant.`,
        },
        {
          texte: "Rien : ces composants ont été payés, ce sont donc des charges de N",
          juste: false,
          retour: "Non : ce qui n'est pas consommé dans l'année ne se compte pas en charge de l'année. C'est l'indépendance des exercices.",
        },
        {
          texte: "On les jette dans les charges de N + 1, sans les compter",
          juste: false,
          retour: "Non : l'inventaire compte et évalue le stock à la clôture ; sans lui, le bilan ne serait pas fidèle.",
        },
      ],
    },
    {
      id: "la-creance-douteuse",
      objectifs: [3],
      type: "montants",
      titre: "Déprécier la créance de Sonora",
      question: () => {
        const s = creanceDeSonora();
        return `Sonora doit ${eur(s.ttc)} toutes taxes comprises, et le mandataire laisse craindre une perte de ${pct(s.taux * 100)}. La dépréciation se calcule sur le hors taxes (la TVA perdue se récupère auprès de l'État). Calculez le hors taxes de la créance, puis la dépréciation.`;
      },
      champs: () => {
        const s = creanceDeSonora();
        return [
          { libelle: "Créance hors taxes", attendu: s.ht, calcul: `${eur(s.ttc)} ÷ (1 + ${qte(acquisition().tauxPct)} %) = ${eur(s.ht)}` },
          { libelle: "Dépréciation", attendu: s.depreciation, calcul: `${eur(s.ht)} × ${pct(s.taux * 100)} = ${eur(s.depreciation)}` },
        ];
      },
      explication: () => {
        const s = creanceDeSonora();
        return [`La dépréciation de ${eur(s.depreciation)} est une charge de N : le résultat baisse, et la créance ne vaut plus au bilan que ce que NOVA espère encaisser. C'est la prudence.`];
      },
    },
    {
      id: "la-cession",
      type: "lecture",
      titre: "Céder une immobilisation",
      texte: () => {
        const k = cessionDuPoste(0);
        return [
          `À la fin de N + 2, NOVA remplace un poste par un poste automatisé, et vend l'ancien. Il a coûté ${eur(LIGNE.prixUnitaireHt)} ; amorti comme la ligne, il a été amorti de ${eur(k.cumul)} à la date de la vente : sa valeur nette comptable est de ${eur(k.valeurNette)}.`,
          "Le résultat de cession est le prix de cession moins la valeur nette comptable : une plus-value s'il est positif, une moins-value sinon. Le poste sort du bilan.",
        ];
      },
      repere: () => "Résultat de cession = prix de cession − valeur nette comptable.",
    },
    {
      id: "le-prix-plancher",
      objectifs: [4],
      type: "curseur",
      titre: "Vendre sans moins-value",
      question: () => `Faites varier le prix de vente du poste : une droite donne le prix, l'autre sa valeur nette comptable (${eur(cessionDuPoste(0).valeurNette)}). Placez le curseur sur le plus petit prix, à l'euro, qui ne laisse pas de moins-value.`,
      cible: () => ({ attendu: prixSansMoinsValue(), min: 4_000, max: 12_000 }),
      grandeur: () => ({ libelle: "Prix de vente du poste", unite: "€" }),
      rates: () => ({ dessous: "À ce prix, la vente laisse une moins-value.", dessus: "Pas de moins-value, mais un prix plus bas en laisserait-il encore aucune ?" }),
      zones: ["Plus-value", "Moins-value"],
      montrer: "Montrer le prix",
      lecture: (_c, p) => {
        const k = cessionDuPoste(p);
        return [
          { libelle: "Prix de cession", montant: k.prix },
          { libelle: "Valeur nette comptable", montant: k.valeurNette },
          { libelle: "Résultat de cession", montant: k.resultat, fort: true },
        ];
      },
      droites: () => {
        const v = cessionDuPoste(0).valeurNette;
        return { produit: (p) => p, cout: () => v, libelles: ["Prix de cession", "Valeur nette comptable"] };
      },
      explication: () => [`À ${eur(prixSansMoinsValue())}, la vente laisse ${eur(cessionDuPoste(prixSansMoinsValue()).resultat)} de plus-value ; un euro de moins, et c'est une moins-value. Le prix se négocie avec l'acheteur ; la comptabilité dit seulement ce qu'il change au résultat.`],
    },
    {
      id: "le-resultat-de-cession",
      objectifs: [4],
      type: "montants",
      titre: "Le prix du revendeur",
      question: () => `Un revendeur de matériel d'occasion propose ${eur(PRIX_DU_REVENDEUR)} hors taxes pour le poste. Calculez sa valeur nette comptable, puis le résultat de cession.`,
      champs: () => {
        const k = cessionDuPoste(PRIX_DU_REVENDEUR);
        return [
          { libelle: "Valeur nette comptable", attendu: k.valeurNette, calcul: `${eur(LIGNE.prixUnitaireHt)} − ${eur(k.cumul)} = ${eur(k.valeurNette)}` },
          { libelle: "Résultat de cession", attendu: k.resultat, calcul: `${eur(k.prix)} − ${eur(k.valeurNette)} = ${eur(k.resultat)}` },
        ];
      },
      explication: () => {
        const k = cessionDuPoste(PRIX_DU_REVENDEUR);
        return [`Une moins-value de ${eur(-k.resultat)} : le poste se vend moins que ce qu'il vaut encore dans les comptes. Elle diminue le résultat de N + 2.`];
      },
    },
    {
      id: "l-annexe",
      objectifs: [2],
      type: "choix",
      titre: "Ce que dit l'annexe",
      question: () => "Avec le bilan et le compte de résultat, NOVA publie une annexe. Qu'y trouve le lecteur des comptes ?",
      options: () => [
        {
          texte: "Les méthodes retenues et le détail de certains postes",
          juste: true,
          retour: `Oui : l'annexe dit par exemple que la ligne s'amortit en linéaire sur ${qte(planDeLaLigne().duree)} ans, comment la créance de Sonora a été dépréciée, et ce qui a changé depuis l'exercice précédent. Sans elle, les chiffres se liraient mal.`,
        },
        {
          texte: "Les prévisions de ventes de l'année suivante",
          juste: false,
          retour: "Non : l'annexe explique les comptes de l'exercice clôturé ; les prévisions relèvent du plan d'affaires.",
        },
        {
          texte: "Rien d'utile : c'est une formalité que personne ne lit",
          juste: false,
          retour: "Non : elle fait partie des documents de synthèse, et précise la composition des postes et les méthodes.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const p = planDeLaLigne();
        return [
          `La ligne de ${c.entreprise} est un actif de ${eur(p.valeurBrute)}, amorti de ${eur(p.n.dotation)} la première année. À la clôture, l'inventaire ajoute le stock, déprécie la créance de Sonora, rattache chaque charge à son année : les comptes deviennent une image fidèle. Vendu, un poste laisse une plus-value ou une moins-value, selon son prix face à sa valeur nette comptable.`,
          "Dans l'arène, le bilan de chaque tour montre vos équipements à leur valeur nette : l'amortissement y passe en charge, sans sortie d'argent.",
        ];
      },
      repere: () => "Coût d'acquisition HT · annuité = coût ÷ durée, prorata la première année · VNC = coût − cumul · principes de la clôture · résultat de cession = prix − VNC.",
    },
  ],
};
