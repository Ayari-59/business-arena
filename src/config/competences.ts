/**
 * SOCLE DE COMPÉTENCES — PROPOSITION, PAS ENCORE UNE VÉRITÉ.
 *
 * CE QUI A ÉTÉ MESURÉ. Les treize ateliers écrivent 251 compétences, pour
 * 247 textes distincts : chacun réécrit les siennes, même quand le geste est
 * le même. « Je choisis les indicateurs qui expliquent mon résultat, et
 * j'écarte ceux qui l'habillent » existe en quatre versions qui diffèrent
 * d'une virgule ; « Je construis un tableau de bord commercial qui tient sur
 * une page et qui se lit » est dupliqué à l'identique entre deux ateliers.
 *
 * CE QUE CELA COÛTE. Chaque séance nomme aussi les blocs du référentiel de SON
 * diplôme (`processus`). Le même acte est donc déclaré en treize dialectes, et
 * servir un quatorzième diplôme oblige à rouvrir les treize ateliers. Rien ne
 * peut être compté, comparé, ni mis en correspondance.
 *
 * CE QUE CE FICHIER PROPOSE. Un geste se dit UNE fois ici ; un atelier le
 * désigne par son code ; une table de correspondance le relie aux blocs du
 * référentiel de chaque diplôme. Ajouter un diplôme devient ajouter une
 * colonne, sans toucher aux ateliers.
 *
 * CE QUE CE FICHIER N'EST PAS. Une vérité arrêtée. Les regroupements sont une
 * lecture des 251 phrases existantes, pas une position pédagogique : deux
 * gestes peuvent devoir fusionner, un autre se scinder, un énoncé se réécrire.
 * RIEN N'EST ENCORE BRANCHÉ — les ateliers gardent leurs phrases et leurs
 * `processus` tant que ce socle n'est pas arbitré.
 *
 * LA TRAÇABILITÉ EST LA RÈGLE. Un geste ne cite pas ses phrases d'origine, il
 * les DÉSIGNE par leurs coordonnées « atelier:séance:rang ». Recopiées, elles
 * divergeraient de l'atelier dès la première correction ; désignées, elles se
 * résolvent et une garde vérifie qu'aucune ne manque, qu'aucune ne sert deux
 * fois, et qu'aucune des 251 n'a été oubliée en route.
 * Le rapport se lit par `npx tsx scripts/socle-des-competences.ts`.
 */

export interface Geste {
  /** Un code stable : c'est lui qu'une séance citera, pas l'énoncé. */
  code: string;
  /** L'énoncé générique, à la première personne comme les originaux. */
  enonce: string;
  /** Les phrases d'atelier que ce geste rassemble : « code:séance:rang ». */
  origines: readonly string[];
  /**
   * CE DONT CELUI QUI A REGROUPÉ N'EST PAS SÛR.
   *
   * Un regroupement se juge mal de l'intérieur : celui qui l'a fait le trouve
   * évident. Plutôt qu'un indice automatique — un essai de ressemblance
   * lexicale signalait quarante gestes sur soixante-treize, dont des
   * regroupements manifestement justes — le doute s'écrit là où il existe.
   * Une poignée de lignes à trancher vaut mieux qu'une alerte partout.
   */
  doute?: string;
}

export interface FamilleDeGestes {
  code: string;
  nom: string;
  /** Ce que la famille recouvre, pour qu'on sache où ranger un geste nouveau. */
  propos: string;
  gestes: readonly Geste[];
}

export const SOCLE: readonly FamilleDeGestes[] = [
  {
    code: "lire",
    nom: "Lire une situation et des comptes",
    propos:
      "Ce qu'on fait avant de décider : comprendre ce qu'on a sous les yeux.",
    gestes: [
      {
        code: "lire-les-comptes",
        enonce:
          "Je lis les documents de synthèse d'une entreprise et j'en tire ce qu'elle possède, ce qu'elle doit, et ce qui lui reste.",
        origines: [
          "debutant:1:2",
          "stmg:1:0",
          "stmg:1:2",
          "cg1:1:0",
          "gpme:1:0",
          "dcg:1:1",
        ],
        doute:
          "dcg:1:1 calcule des soldes intermédiaires : c'est un calcul, pas une lecture. Peut-être un geste à part, « établir les soldes intermédiaires de gestion ».",
      },
      {
        code: "variable-ou-fixe",
        enonce:
          "Je distingue une charge qui suit les ventes d'une charge qui tombe de toute façon, y compris sur des documents qui ne les séparent pas.",
        origines: ["stmg:2:0", "cg1:2:0", "gea:1:0", "dcg:2:0"],
      },
      {
        code: "reperer-la-contrainte",
        enonce:
          "Je repère la ressource qui limite l'activité, et je la distingue d'un simple manque de moyens.",
        origines: ["cg1:1:1", "gpme:1:1"],
      },
      {
        code: "hierarchiser-un-diagnostic",
        enonce:
          "Je formule un diagnostic écrit et hiérarchisé, destiné à quelqu'un qui n'a pas le temps de tout lire, sans recopier les documents.",
        origines: ["cg1:1:2", "ndrc:1:2", "gpme:1:2", "dcg:1:2"],
      },
      {
        code: "charge-ou-decaissement",
        enonce:
          "Je distingue une charge d'un décaissement et un produit d'un encaissement, et j'en tire ce qu'un résultat ne dit pas de la caisse.",
        origines: ["cg1:3:0", "cg1:4:1", "fitness:4:2"],
        doute:
          "fitness:4:2 porte en plus le besoin en fonds de roulement négatif, qui relève de besoin-en-fonds-de-roulement. La phrase fait deux choses.",
      },
      {
        code: "tenir-ensemble",
        enonce:
          "Je construis un diagnostic qui tient ensemble l'activité, la rentabilité et la trésorerie d'une même période.",
        origines: ["gea:4:2", "gea:5:0", "avance:6:0"],
      },
    ],
  },
  {
    code: "calculer",
    nom: "Calculer un coût, une marge, un seuil",
    propos:
      "Le calcul de gestion proprement dit, celui qui donne un chiffre à opposer à une intuition.",
    gestes: [
      {
        code: "marge-unitaire",
        enonce:
          "Je calcule une marge unitaire et un taux de marge à partir d'un prix d'achat et d'un prix de vente.",
        origines: [
          "debutant:1:0",
          "cg1:2:1",
          "mco:1:0",
          "mco2:1:0",
          "mhr:1:0",
          "bistrot:1:0",
          "campus:1:1",
        ],
      },
      {
        code: "cout-de-revient",
        enonce:
          "Je calcule un coût de revient unitaire à partir des charges et des entrées de la période.",
        origines: ["cg1:4:0", "gea:1:1", "avance:1:0"],
      },
      {
        code: "couts-pertinents",
        enonce:
          "Je distingue, dans un coût complet, ce qui est engagé de toute façon de ce que la décision ajoute, et je décide sur le second.",
        origines: ["avance:2:0", "avance:2:1"],
      },
      {
        code: "seuil-de-rentabilite",
        enonce:
          "Je calcule le volume qui couvre les charges de structure d'une période, et la marge de sécurité qui m'en sépare.",
        origines: [
          "stmg:2:1",
          "cg1:2:2",
          "mco:1:1",
          "mco2:1:1",
          "mco2:3:0",
          "fitness:1:1",
          "fitness:3:1",
          "mhr:1:1",
          "bistrot:1:1",
          "gea:1:2",
          "dcg:2:1",
        ],
      },
      {
        code: "effet-d-une-remise",
        enonce:
          "Je mesure ce qu'une remise, un retour ou une baisse de tarif retire à la marge, et le volume qu'il faudrait pour la compenser.",
        origines: [
          "debutant:3:0",
          "debutant:3:1",
          "mco:3:0",
          "ndrc:3:0",
          "gpme:5:0",
          "mhr:2:0",
        ],
        doute:
          "ndrc:3:0 parle d'un retour produit, pas d'une remise : la marge s'érode pour une autre raison. À scinder si la distinction compte pour vous.",
      },
      {
        code: "resultat-ou-rentabilite",
        enonce:
          "Je distingue le résultat d'une période de la rentabilité des capitaux qui l'ont produit.",
        origines: ["campus:5:0"],
      },
    ],
  },
  {
    code: "prix-et-volume",
    nom: "Fixer un prix et un volume",
    propos:
      "La décision commerciale élémentaire, et le risque qu'on prend d'un côté ou de l'autre.",
    gestes: [
      {
        code: "fixer-un-prix",
        enonce:
          "Je fixe un prix de vente et je dis sur quoi je me suis appuyé pour le fixer.",
        origines: ["debutant:1:1", "stmg:1:1", "cg1:2:3", "mhr:3:1"],
      },
      {
        code: "decider-un-volume",
        enonce:
          "Je décide un volume à préparer, à commander ou à produire, en assumant explicitement de quel côté je prends le risque.",
        origines: [
          "debutant:2:0",
          "debutant:4:1",
          "mco:4:2",
          "mco2:1:2",
          "ndrc:4:2",
          "fitness:1:2",
          "campus:3:2",
        ],
      },
      {
        code: "rupture-ou-surstock",
        enonce:
          "Je chiffre ce que coûte une vente que je n'ai pas pu servir et ce que coûte ce que j'ai préparé pour rien.",
        origines: [
          "debutant:2:1",
          "stmg:3:2",
          "mco:4:1",
          "bistrot:1:2",
          "campus:3:1",
        ],
      },
      {
        code: "repercuter-une-hausse",
        enonce:
          "Je répercute une hausse de coût différemment selon la sensibilité au prix de chaque clientèle.",
        origines: [
          "mco2:3:1",
          "mhr:2:1",
          "bistrot:3:0",
          "bistrot:3:1",
          "avance:3:0",
          "avance:3:1",
          "campus:5:1",
        ],
      },
      {
        code: "prix-plancher",
        enonce:
          "Je fixe un prix plancher qui tient compte du risque commercial d'habituer le marché à un tarif bas.",
        origines: ["avance:2:2"],
      },
    ],
  },
  {
    code: "anticiper",
    nom: "Anticiper la demande",
    propos:
      "Se servir du passé joué plutôt que d'attendre la période pour la subir.",
    gestes: [
      {
        code: "anticiper-un-volume",
        enonce:
          "J'anticipe un volume à partir de la saisonnalité de chaque clientèle et des périodes déjà jouées.",
        origines: [
          "debutant:2:2",
          "debutant:4:0",
          "mco:4:0",
          "ndrc:4:0",
          "fitness:3:0",
          "mhr:3:0",
          "gea:4:0",
          "campus:3:0",
        ],
      },
      {
        code: "prix-et-demande",
        enonce:
          "Je relie une variation de prix à la variation de demande qu'elle provoque sur chaque clientèle.",
        origines: ["campus:2:1"],
      },
      {
        code: "un-marche-qui-change",
        enonce:
          "Je repère l'événement qui change la taille du marché, et je dis ce qu'il exige de mon entreprise.",
        origines: ["stmg:3:0"],
      },
    ],
  },
  {
    code: "tresorerie",
    nom: "Piloter la trésorerie",
    propos:
      "Le décalage entre ce qui est gagné et ce qui est encaissé, et ce qu'il faut en faire.",
    gestes: [
      {
        code: "plan-de-tresorerie",
        enonce:
          "Je construis un plan de trésorerie de la période à partir de décisions prévues et de délais de règlement, et j'y repère le point de tension.",
        origines: [
          "cg1:3:1",
          "cg1:3:2",
          "mco2:5:0",
          "fitness:4:1",
          "mhr:4:0",
          "gea:2:1",
          "avance:4:1",
          "campus:4:1",
        ],
        doute:
          "cg1:3:2 présente un besoin de financement et mco2:5:0 suit un encaissement attendu : deux actes plus étroits que construire un plan.",
      },
      {
        code: "resultat-contre-caisse",
        enonce:
          "J'explique l'écart entre le résultat d'une période et le solde de trésorerie, poste par poste.",
        origines: ["cg1:4:2", "mhr:4:1", "gea:2:2"],
      },
      {
        code: "effet-d-un-delai",
        enonce:
          "Je mesure ce qu'un délai de règlement fait à la trésorerie, à résultat inchangé, et je le traduis en euros immobilisés.",
        origines: [
          "mco:2:1",
          "mco2:2:1",
          "mco2:4:1",
          "gpme:2:0",
          "fitness:4:0",
          "mhr:3:2",
          "bistrot:2:2",
          "bistrot:4:2",
        ],
      },
      {
        code: "besoin-en-fonds-de-roulement",
        enonce:
          "Je repère le besoin en fonds de roulement dans un bilan et je le relie aux délais de règlement et au rythme de l'activité.",
        origines: ["gea:2:0", "gea:4:1", "dcg:1:0", "avance:4:0", "campus:4:0"],
      },
      {
        code: "financer-le-court-terme",
        enonce:
          "Je compare ce que coûtent les façons de couvrir un besoin de trésorerie, et je rapporte ce coût à ce qu'il évite.",
        origines: [
          "cg1:4:3",
          "cg1:5:2",
          "cg1:5:3",
          "mco2:4:2",
          "mco2:5:1",
          "gpme:2:1",
          "mhr:4:2",
          "avance:4:2",
          "avance:5:2",
          "campus:4:2",
        ],
      },
      {
        code: "tva",
        enonce:
          "Je calcule une TVA à décaisser et j'explique pourquoi une taxe neutre pour le résultat pèse sur la trésorerie.",
        origines: ["cg1:5:0", "cg1:5:1"],
      },
    ],
  },
  {
    code: "capacite",
    nom: "Arbitrer sous contrainte de capacité",
    propos: "Ce qui se joue quand tout ne peut pas être servi.",
    gestes: [
      {
        code: "la-capacite-qui-bloque",
        enonce:
          "Je repère laquelle de mes capacités bloque, et je borne mes ventes à la plus petite.",
        origines: ["stmg:3:1", "ndrc:4:1", "fitness:5:0", "bistrot:4:0"],
      },
      {
        code: "marge-par-unite-rare",
        enonce:
          "Je classe des offres par la marge qu'elles dégagent rapportée à l'unité de capacité qu'elles consomment.",
        origines: ["bistrot:4:1", "gea:3:0"],
      },
      {
        code: "cout-de-la-saturation",
        enonce:
          "J'évalue le manque à gagner d'une capacité saturée face à une demande qui monte.",
        origines: ["fitness:5:1", "gea:3:1"],
      },
      {
        code: "arbitrer-entre-clienteles",
        enonce:
          "J'arbitre entre des clientèles quand la capacité ne permet pas de toutes les accueillir.",
        origines: ["mco2:4:0"],
      },
    ],
  },
  {
    code: "investir",
    nom: "Investir et recruter",
    propos:
      "Les décisions dont l'effet arrive après la période où on les prend.",
    gestes: [
      {
        code: "juger-un-investissement",
        enonce:
          "J'évalue un investissement sur les flux que la décision change, et non sur son coût seul.",
        origines: [
          "gea:3:2",
          "dcg:3:0",
          "dcg-rse:3:1",
          "avance:5:0",
          "campus:5:2",
        ],
      },
      {
        code: "valeur-d-aujourd-hui",
        enonce:
          "Je ramène des flux étalés sur plusieurs périodes à leur valeur d'aujourd'hui, et je décide sur leur somme.",
        origines: ["avance:5:1"],
      },
      {
        code: "quand-recruter",
        enonce:
          "Je calcule ce qu'un recrutement doit produire pour se payer, et je situe le moment entre la surcharge et l'embauche qui devance le carnet.",
        origines: [
          "gpme:4:0",
          "gpme:4:1",
          "gpme:4:2",
          "bistrot:3:2",
          "avance:3:2",
        ],
      },
      {
        code: "choisir-un-financement",
        enonce:
          "Je compare des modes de financement sur leur coût et sur ce qu'ils font à la structure du bilan.",
        origines: ["dcg:3:1"],
      },
    ],
  },
  {
    code: "clientele",
    nom: "Conquérir et garder une clientèle",
    propos:
      "Ce que vaut un client, ce qu'il coûte à acquérir, et ce qui le fait revenir.",
    gestes: [
      {
        code: "acheter-ou-fideliser",
        enonce:
          "Je distingue un chiffre d'affaires qu'il faut refaire à chaque période d'un chiffre d'affaires qui se reconduit tant que le client reste.",
        origines: ["ndrc:1:0", "fitness:1:0", "avance:1:2"],
      },
      {
        code: "cout-d-acquisition",
        enonce:
          "Je calcule ce que coûte l'acquisition d'un client et je le compare à la marge qu'il dégage.",
        origines: ["ndrc:2:0", "ndrc:2:1"],
      },
      {
        code: "valeur-dans-la-duree",
        enonce:
          "Je mesure ce qu'un client rapporte avant de partir, et le taux auquel ma clientèle se renouvelle.",
        origines: ["ndrc:2:2", "fitness:2:0", "fitness:2:1"],
      },
      {
        code: "recruter-ou-retenir",
        enonce:
          "Je distingue une action qui recrute des clients d'une action qui retient ceux que j'ai, et je chiffre ce que j'attends de chacune.",
        origines: [
          "mco:3:2",
          "mco2:3:2",
          "ndrc:3:2",
          "fitness:2:2",
          "fitness:3:2",
        ],
      },
      {
        code: "qualite-et-frequentation",
        enonce:
          "Je relie le niveau de service ou de qualité d'une période à la fréquentation de la suivante.",
        origines: ["mco2:2:2", "ndrc:3:1", "bistrot:2:1"],
      },
      {
        code: "dependance-a-un-client",
        enonce:
          "J'évalue ce que représente un client dans mon activité avant de décider de le perdre.",
        origines: ["gpme:5:1"],
      },
      {
        code: "situer-son-offre",
        enonce:
          "Je situe mon offre par rapport aux clientèles qui la fréquentent.",
        origines: ["mco:1:2", "mhr:1:2"],
      },
    ],
  },
  {
    code: "negocier",
    nom: "Acheter et négocier",
    propos:
      "L'autre côté de la marge : ce qu'on paie, et ce qu'un intermédiaire prélève.",
    gestes: [
      {
        code: "comparer-des-fournisseurs",
        enonce:
          "Je compare des fournisseurs sur plusieurs critères, pas seulement sur leur prix, et je pondère.",
        origines: [
          "mco:2:0",
          "mco2:2:0",
          "fitness:5:2",
          "bistrot:2:0",
          "dcg-rse:3:0",
        ],
      },
      {
        code: "preparer-une-negociation",
        enonce:
          "Je prépare une négociation en identifiant ce que j'apporte à l'autre, et je construis une réponse qui n'est ni l'acceptation ni le refus sec.",
        origines: ["ndrc:5:2", "gpme:5:2"],
        doute:
          "gpme:5:2 construit une réponse commerciale, ndrc:5:2 prépare l'échange. Préparer et répondre sont deux moments.",
      },
      {
        code: "ce-que-preleve-un-canal",
        enonce:
          "Je calcule la marge qui reste après ce qu'un canal ou un partenaire prélève, et je la compare à celle d'une vente en direct.",
        origines: ["ndrc:1:1", "ndrc:5:0", "ndrc:5:1", "avance:1:1"],
      },
    ],
  },
  {
    code: "risque",
    nom: "Nommer et arbitrer un risque",
    propos: "Le risque comme objet chiffré, pas comme adjectif.",
    gestes: [
      {
        code: "chiffrer-un-risque",
        enonce:
          "J'identifie les risques propres à ma structure et je chiffre leur impact plutôt que de les qualifier de forts ou faibles.",
        origines: ["gpme:3:0", "gpme:3:1"],
        doute:
          "gpme:3:0 identifie les risques, gpme:3:1 chiffre leur impact. Repérer et mesurer ne s'évaluent pas de la même façon.",
      },
      {
        code: "supporter-reduire-transferer",
        enonce:
          "J'arbitre entre supporter un risque, le réduire, et le transférer à un tiers.",
        origines: ["gpme:3:2"],
      },
      {
        code: "reputation-ou-finance",
        enonce:
          "Je distingue un risque de réputation d'un risque financier et j'estime la portée de chacun.",
        origines: ["dcg-rse:5:1"],
      },
      {
        code: "decider-avec-le-risque",
        enonce:
          "Je décide en tenant compte du risque autant que du rendement, et je relie mon exposition à ce qu'une baisse de demande me ferait.",
        origines: ["dcg:2:2", "dcg-rse:5:2", "campus:6:0"],
        doute:
          "campus:6:0 décide selon l'écart au classement visé : c'est un positionnement concurrentiel, pas un arbitrage de risque.",
      },
    ],
  },
  {
    code: "prevoir",
    nom: "Prévoir, puis se confronter au réel",
    propos: "Écrire ses hypothèses avant, et répondre de l'écart après.",
    gestes: [
      {
        code: "budget-et-hypotheses",
        enonce:
          "Je construis un budget de période dont j'écris les hypothèses avant de connaître le réel, et j'annonce l'effet que j'attends d'une décision.",
        origines: ["stmg:2:2", "dcg:3:2", "dcg:4:0", "dcg-rse:4:2"],
        doute:
          "stmg:2:2 annonce l'effet attendu d'une décision, ce qui est bien plus léger que construire un budget : le niveau de première y perdrait sa marche.",
      },
      {
        code: "decomposer-un-ecart",
        enonce:
          "Je décompose un écart global en écart sur prix, sur volume et sur coûts.",
        origines: ["campus:2:0", "dcg:4:1"],
      },
      {
        code: "decision-ou-marche",
        enonce:
          "Je distingue un écart imputable à une décision d'un écart imputable au marché.",
        origines: ["dcg:4:2"],
      },
      {
        code: "mesurer-l-effet-d-une-action",
        enonce:
          "Je mesure l'écart entre ma prévision et le réalisé, j'en cherche la cause, et je corrige la période suivante.",
        origines: ["debutant:3:2", "cg1:3:3", "mco2:5:2"],
      },
    ],
  },
  {
    code: "rendre-compte",
    nom: "Rendre compte",
    propos:
      "Ce qui reste d'une gestion quand la partie est finie : un écrit, un oral, une trace.",
    gestes: [
      {
        code: "tableau-de-bord",
        enonce:
          "Je construis un tableau de bord qui tient sur une page et qui se lit.",
        origines: [
          "mco:5:0",
          "mco2:6:0",
          "ndrc:6:0",
          "fitness:6:0",
          "gpme:6:0",
          "mhr:5:0",
          "bistrot:5:0",
        ],
      },
      {
        code: "choisir-ses-indicateurs",
        enonce:
          "Je choisis les indicateurs qui expliquent mon résultat, et j'écarte ceux qui l'habillent.",
        origines: [
          "stmg:4:0",
          "mco:5:1",
          "mco2:6:1",
          "ndrc:6:1",
          "fitness:6:1",
          "mhr:5:1",
          "bistrot:5:1",
          "gea:5:1",
          "avance:6:1",
        ],
      },
      {
        code: "ecrire-une-note",
        enonce:
          "Je rédige un écrit professionnel qui explique des résultats plutôt qu'il ne les décrit.",
        origines: ["debutant:4:2", "cg1:6:2", "gpme:2:2", "dcg:5:0"],
      },
      {
        code: "presenter-a-l-oral",
        enonce:
          "Je présente oralement une gestion, ses réussites et ses erreurs, devant un jury.",
        origines: [
          "stmg:4:1",
          "cg1:6:3",
          "mco:5:2",
          "mco2:6:2",
          "ndrc:6:2",
          "fitness:6:2",
          "mhr:5:2",
          "bistrot:5:2",
          "gea:5:2",
        ],
      },
      {
        code: "repondre-aux-objections",
        enonce:
          "Je réponds à des questions portant sur mes méthodes autant que sur mes chiffres, sans esquiver les arbitrages perdants.",
        origines: ["gpme:6:2", "dcg:5:2", "dcg-rse:6:2", "avance:6:2"],
      },
      {
        code: "assumer-une-erreur",
        enonce:
          "Je reconnais une décision ou une hypothèse fausse, et j'en tire une conséquence, sans chercher d'excuse extérieure.",
        origines: ["stmg:4:2", "dcg:5:1", "campus:7:2"],
      },
      {
        code: "relier-decisions-et-resultats",
        enonce:
          "Je relie les décisions prises aux résultats obtenus, sans en attribuer le mérite au hasard.",
        origines: ["gpme:6:1"],
      },
      {
        code: "expliquer-a-un-profane",
        enonce:
          "J'explique une décision de gestion à quelqu'un qui n'a pas ma formation.",
        origines: ["campus:1:2"],
      },
    ],
  },
  {
    code: "equipe",
    nom: "Décider en équipe",
    propos:
      "Ce qu'un jeu d'entreprise fait travailler et qu'un dossier ne fait pas.",
    gestes: [
      {
        code: "tenir-un-poste",
        enonce:
          "Je tiens un poste de direction nommé et j'en réponds devant mon équipe.",
        origines: ["campus:1:0", "campus:6:2"],
        doute:
          "campus:6:2 rend compte de ce que son poste a apporté : cela relève de rendre-compte autant que de tenir un poste.",
      },
      {
        code: "defendre-un-choix",
        enonce:
          "Je défends un choix devant des collègues ou un comité qui ont décidé autrement.",
        origines: ["mco:2:2", "mhr:2:2", "campus:2:2"],
      },
      {
        code: "decider-sous-contrainte",
        enonce:
          "Je décide sous contrainte de temps, avec un public qui suit mes chiffres.",
        origines: ["campus:7:0"],
      },
      {
        code: "lire-le-jeu-d-un-autre",
        enonce:
          "J'analyse la gestion d'une autre équipe et j'explique ce que sa décision va produire.",
        origines: ["campus:7:1"],
      },
    ],
  },
  {
    code: "extra-financier",
    nom: "Piloter l'extra-financier",
    propos: "Ce qui ne se lit pas dans le résultat mais finit par y entrer.",
    gestes: [
      {
        code: "lire-un-indice-esg",
        enonce:
          "Je lis un indice extra-financier et j'explique ce que mesure chacun de ses piliers.",
        origines: ["dcg-rse:1:0"],
      },
      {
        code: "empreinte-d-une-decision",
        enonce:
          "Je relie une décision de gestion à son empreinte environnementale, sociale ou de gouvernance.",
        origines: ["dcg-rse:1:1"],
      },
      {
        code: "depense-ou-engagement",
        enonce:
          "Je distingue une dépense qui agit dans la période d'un engagement qui se capitalise, et je décide de le maintenir ou de l'ajuster sur l'horizon qui me reste.",
        origines: ["dcg-rse:1:2", "dcg-rse:2:0", "dcg-rse:2:2"],
      },
      {
        code: "retours-differes",
        enonce:
          "Je suis un indicateur extra-financier, je l'impute aux décisions qui l'ont fait bouger, et je lis ce qu'il rapporte avec retard.",
        origines: [
          "dcg-rse:2:1",
          "dcg-rse:3:2",
          "dcg-rse:4:0",
          "dcg-rse:4:1",
          "dcg-rse:6:1",
        ],
        doute:
          "Cinq phrases pour un seul geste, alors qu'elles suivent trois objets distincts : capital d'image, taux de rebuts, engagement social.",
      },
      {
        code: "parties-prenantes",
        enonce:
          "J'anticipe la réaction des parties prenantes à partir du niveau atteint.",
        origines: ["dcg-rse:5:0"],
      },
    ],
  },
  {
    code: "donnees",
    nom: "Travailler la donnée",
    propos:
      "Le geste outillé : sortir un chiffre, le contrôler, en faire une série.",
    gestes: [
      {
        code: "controler-un-export",
        enonce:
          "J'exporte des données de gestion et je les contrôle avant de les utiliser.",
        origines: ["cg1:6:0"],
      },
      {
        code: "construire-une-serie",
        enonce:
          "Je construis une série sur plusieurs périodes et j'en tire une évolution lisible.",
        origines: ["cg1:6:1", "dcg-rse:6:0"],
      },
      {
        code: "lire-un-classement",
        enonce:
          "Je lis un classement multicritère et je repère la dimension qui me coûte des points.",
        origines: ["campus:6:1"],
      },
      {
        code: "lire-un-indicateur",
        enonce:
          "Je lis un indicateur d'activité et j'en tire ce qui se passe sur le terrain.",
        origines: ["mco:3:1"],
      },
    ],
  },
];

/** Tous les gestes, à plat : c'est la forme dont une séance aura besoin. */
export const GESTES: readonly Geste[] = SOCLE.flatMap((f) => f.gestes);
