import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  ENTREPRISES_DE_LA_DIRECTION,
  SALAIRES_DU_DIAGNOSTIC,
  constatsDuDiagnostic,
  faitsDuDiagnostic,
  salaireQuiFaitUneForce,
  verdictDuDiagnostic,
  type Categorie,
  type Verdict,
} from "../monde/direction-de-nova";
import { LIBELLES_DES_FACTEURS, faceAuxConcurrents, facteursClesDuMarche, type TypeDeVeille } from "../monde/veille-et-facteurs-cles";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE DIAGNOSTIC STRATÉGIQUE, FORCES, FAIBLESSES, OPPORTUNITÉS, MENACES
 * (Stratégie et management, palier 1 : seconde option management et gestion, première STMG).
 *
 * Avant de décider de l'année N + 1, la direction de NOVA fait le point : ce que l'entreprise réussit
 * ou rate par ses propres choix (le diagnostic interne : forces et faiblesses), et ce que son marché,
 * ses concurrents et son environnement lui apportent ou lui imposent (le diagnostic externe :
 * opportunités et menaces). L'élève calcule les chiffres, range les constats, en tire une conclusion,
 * puis voit un constat changer de case : le salaire des opérateurs, une force tant que le marché ne
 * monte pas trop (le curseur), qui redevient une force si NOVA augmente (le laboratoire).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : le résultat et la trésorerie du premier
 * exercice (comptes-du-lycee.ts), la demande et la ligne de N + 1, le salaire du marché et le seuil
 * de démission (nova-capacite.ts), le prix de SoundBox (marche-a-trois.ts) et le redressement de
 * Sonora (exercice-de-nova.ts), lus par monde/direction-de-nova.ts. Le sens de chaque constat suit
 * une règle écrite là-bas, jamais une liste à la main.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait l'année de l'arène dans huit entreprises (le résultat, la part
 * de marché, l'événement de l'année rejoué sans lui) ; il lit NOVA : 79 225,96 € de bénéfice,
 * 1 200 enceintes que la ligne refusera, une demande qui monte de 15,2 %, un salaire à 93,8 % du marché.
 */

export const ENTREPRISES_DU_DIAGNOSTIC = ENTREPRISES_DE_LA_DIRECTION;
export type { Categorie, Verdict };

export const CATEGORIES_DU_DIAGNOSTIC: readonly { code: Categorie; libelle: string }[] = [
  { code: "force", libelle: "Force" },
  { code: "faiblesse", libelle: "Faiblesse" },
  { code: "opportunite", libelle: "Opportunité" },
  { code: "menace", libelle: "Menace" },
];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
/** « de » devant un nom propre : « d'Auris », « de NOVA ». */
export const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres du diagnostic, au dixième (le cas des clients repartis les reprend). */
export function diagnostic(_c?: Cas, salaire?: number) {
  const x = faitsDuDiagnostic(salaire);
  return {
    ...x,
    constats: constatsDuDiagnostic(salaire),
    hausseDeLaDemandePct: auDixieme(x.hausseDeLaDemande * 100),
    tauxDeServicePct: auDixieme(((x.demandeN1 - x.refusees) / x.demandeN1) * 100),
    partPct: auDixieme(x.part * 100),
    seuilPct: Math.round(x.seuil * 100),
    verdict: verdictDuDiagnostic(),
  };
}

const LIBELLES_DU_VERDICT: Record<Verdict, string> = {
  saisir: "S'appuyer sur ses forces pour saisir l'opportunité",
  corriger: "Corriger d'abord la faiblesse qui empêche de la saisir",
  "se-proteger": "Se protéger des menaces : le marché n'offre aucune opportunité",
};

export const TYPES_DE_VEILLE: readonly { code: TypeDeVeille; libelle: string }[] = [
  { code: "concurrentielle", libelle: "Veille concurrentielle" },
  { code: "technologique", libelle: "Veille technologique" },
  { code: "commerciale", libelle: "Veille commerciale" },
  { code: "reglementaire", libelle: "Veille réglementaire" },
];

const ecrit = (montant: number, unite: "€" | "%" | "enceintes") => (unite === "€" ? eur(montant) : unite === "%" ? pct(montant) : `${qte(montant)} enceintes`);

export const LE_DIAGNOSTIC_STRATEGIQUE: Chapitre = {
  code: "le-diagnostic-strategique",
  parcours: "strategie",
  palier: 1,
  blocs: [
    "STMG Thème 2 · Le management stratégique, du diagnostic à la fixation des objectifs",
    "DCG UE7 · Management des organisations",
  ],
  titre: "Le diagnostic stratégique : forces, faiblesses, opportunités, menaces",
  accroche:
    "Avant de décider, la direction fait le point : ce que l'entreprise réussit ou rate par ses propres choix, et ce que son marché et ses concurrents lui apportent ou lui imposent. Les constats, rangés un par un.",
  objectifs: [
    "Distinguer le diagnostic interne et le diagnostic externe",
    "Calculer les chiffres d'un diagnostic : évolution de la demande, demande servie, salaire face au marché",
    "Ranger des constats chiffrés en forces, faiblesses, opportunités et menaces",
    "Tirer une conclusion du diagnostic",
    "Définir la stratégie et suivre sa démarche, de la veille au plan d'actions",
    "Conduire une veille stratégique",
    "Identifier les facteurs clés de succès et les compétences distinctives",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_DIAGNOSTIC,
    pourquoi: "ce chapitre fait le diagnostic de NOVA, dont le cours tient les comptes, l'atelier, l'équipe, le marché et les clients.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Faire le point avant de décider",
      notions: ["demand_market_share", "income_statement"],
      texte: (c) => {
        const d = diagnostic(c);
        return [
          `Le premier exercice ${dE(c.entreprise)} est clos. Avant de décider de l'année N + 1, sa direction fait le point : c'est le diagnostic stratégique. Elle vend ses enceintes ${eur(d.prixDeNova)} face à deux concurrents, dont ${d.concurrent}.`,
          "Le diagnostic interne regarde l'entreprise elle-même, ce qui dépend de ses choix : ce qu'elle réussit (ses forces) et ce qu'elle rate (ses faiblesses). Le diagnostic externe regarde son environnement, ce qu'elle ne décide pas : le marché, les concurrents, les clients, les autres employeurs, qui lui offrent des chances (les opportunités) ou la mettent en danger (les menaces).",
        ];
      },
      repere: () => "Interne : forces et faiblesses, ce qui dépend de l'entreprise. Externe : opportunités et menaces, ce qui vient de son environnement.",
    },
    {
      id: "la-strategie",
      type: "lecture",
      titre: "Qu'est-ce que la stratégie ?",
      texte: (c) => [
        `La stratégie est l'ensemble des décisions qui engagent le devenir d'une organisation : ce qu'elle vend, à qui, avec quels moyens, face à quels concurrents. Elle a une histoire : ${c.entreprise} est née d'un choix, fabriquer des enceintes au prix du milieu du marché, et chaque année la remet en question.`,
        "Elle suit une démarche. L'organisation observe son environnement (la veille), fait son diagnostic, interne et externe, en tire des objectifs, choisit ses options, les traduit en un plan d'actions coordonnées, puis évalue et ajuste. Longtemps planifiée pour des années, la stratégie s'ajuste aujourd'hui sans cesse, dans un environnement incertain.",
      ],
      repere: () => "Démarche stratégique : veille, diagnostic, objectifs, choix stratégiques, plan d'actions, évaluation et ajustement.",
    },
    {
      id: "la-demarche",
      objectifs: [4],
      type: "choix",
      titre: "Dans quel ordre ?",
      question: (c) => `La direction ${dE(c.entreprise)} vient de finir son diagnostic. Quelle est l'étape suivante de la démarche stratégique ?`,
      options: () => [
        {
          texte: "En tirer des objectifs, avant de choisir comment les atteindre",
          juste: true,
          retour: "Oui : le diagnostic dit où en est l'entreprise ; les objectifs disent où elle veut aller ; les choix stratégiques et le plan d'actions disent comment. L'évaluation, à la fin, relance la démarche.",
        },
        {
          texte: "Lancer tout de suite le plan d'actions, puisque le diagnostic montre ce qui ne va pas",
          juste: false,
          retour: "Non : agir sans objectif, c'est ne pas savoir si l'on réussit. Les objectifs viennent d'abord, puis les choix et le plan d'actions.",
        },
        {
          texte: "Arrêter la veille : une fois le diagnostic fait, l'environnement est connu",
          juste: false,
          retour: "Non : l'environnement change sans cesse. La veille continue, et c'est elle qui fera ajuster la stratégie.",
        },
      ],
    },
    {
      id: "la-veille",
      objectifs: [5],
      type: "tri",
      titre: "La veille stratégique",
      question: (c) => `Pour son diagnostic, ${c.entreprise} surveille son environnement. Rangez chaque information selon la veille qui l'a trouvée.`,
      categories: TYPES_DE_VEILLE,
      elements: () => [
        { libelle: "SoundBox prépare une enceinte encore moins chère", montant: 0, categorie: "concurrentielle", pourquoi: "Ce que font les concurrents : la veille concurrentielle." },
        { libelle: "Une batterie nouvelle double l'autonomie des enceintes nomades", montant: 0, categorie: "technologique", pourquoi: "Une technique qui change le produit : la veille technologique." },
        { libelle: "Les étudiants achètent de plus en plus leurs enceintes en ligne", montant: 0, categorie: "commerciale", pourquoi: "Ce que font les clients : la veille commerciale." },
        { libelle: "Une règle européenne impose un même chargeur pour les petits appareils", montant: 0, categorie: "reglementaire", pourquoi: "Une règle qui s'imposera à NOVA : la veille réglementaire." },
      ],
      relance: "L'information parle-t-elle des concurrents, d'une technique, des clients, ou d'une règle ?",
      explication: () => ["La veille stratégique observe en continu l'environnement pour en comprendre les fluctuations : elle nourrit le diagnostic externe, ses opportunités et ses menaces, et fait ajuster la stratégie à temps."],
    },
    {
      id: "interne-ou-externe",
      objectifs: [0],
      type: "choix",
      titre: "Interne ou externe ?",
      notions: ["demand_market_share"],
      question: (c) => {
        const d = diagnostic(c);
        return `Les autres employeurs paieront un opérateur de montage ${eur(d.marcheN1)} bruts par mois en N + 1, contre ${eur(d.marcheN)} en N. Pour ${c.entreprise}, ce constat relève :`;
      },
      options: () => [
        {
          texte: "Du diagnostic externe : une menace",
          juste: true,
          retour: "Oui : NOVA ne décide pas des salaires des autres employeurs. Qu'ils montent menace son équipe : ses opérateurs peuvent trouver mieux ailleurs.",
        },
        {
          texte: "Du diagnostic interne : une faiblesse de l'entreprise",
          juste: false,
          retour: "Non : ce que paient les autres employeurs ne dépend pas de NOVA. Le salaire qu'elle paie, lui, est interne : c'est la comparaison des deux qui dira si c'est une faiblesse.",
        },
        {
          texte: "Ni de l'un ni de l'autre : un salaire est une question de gestion du personnel, pas de stratégie",
          juste: false,
          retour: "Non : garder son équipe est une question de stratégie, et les salaires du marché font partie de l'environnement de l'entreprise.",
        },
      ],
    },
    {
      id: "chiffres",
      objectifs: [1],
      type: "montants",
      titre: "Les chiffres du diagnostic",
      notions: ["demand_market_share", "capacity"],
      tableau: (c) => {
        const d = diagnostic(c);
        return {
          titre: `Ce que la direction ${dE(c.entreprise)} a sous les yeux`,
          colonnes: ["N", "N + 1"],
          lignes: [
            { libelle: "Enceintes demandées", valeurs: [qte(d.demandeN), qte(d.demandeN1)] },
            { libelle: "Enceintes que la ligne ne pourra pas monter", valeurs: [qte(d.refuseesN), qte(d.refusees)] },
            { libelle: "Salaire brut d'un opérateur", valeurs: [eur(d.salaire), eur(d.salaire)] },
            { libelle: "Salaire du marché", valeurs: [eur(d.marcheN), eur(d.marcheN1)] },
          ],
        };
      },
      question: () =>
        "Calculez l'évolution de la demande de N à N + 1, la part de la demande de N + 1 que la ligne servira, et la part du salaire du marché que NOVA paiera en N + 1, chacune en pourcentage au dixième.",
      champs: (c) => {
        const d = diagnostic(c);
        return [
          { libelle: "Évolution de la demande (%)", attendu: d.hausseDeLaDemandePct, calcul: `(${qte(d.demandeN1)} − ${qte(d.demandeN)}) ÷ ${qte(d.demandeN)} × 100 = ${pct(d.hausseDeLaDemandePct)}`, tolerance: 0.1 },
          { libelle: "Demande servie en N + 1 (%)", attendu: d.tauxDeServicePct, calcul: `(${qte(d.demandeN1)} − ${qte(d.refusees)}) ÷ ${qte(d.demandeN1)} × 100 = ${pct(d.tauxDeServicePct)}`, tolerance: 0.1 },
          { libelle: "Part du marché payée en N + 1 (%)", attendu: d.partPct, calcul: `${eur(d.salaire)} ÷ ${eur(d.marcheN1)} × 100 = ${pct(d.partPct)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const d = diagnostic(c);
        return [
          `La demande monte de ${pct(d.hausseDeLaDemandePct)}, mais la ligne n'en servira que ${pct(d.tauxDeServicePct)} : ${qte(d.refusees)} enceintes demandées repartiront, ${eur(d.margeRefusee)} de marge perdue. Et à ${pct(d.partPct)} du marché, sous le seuil de démission de ${pct(d.seuilPct)}, un opérateur risque de partir.`,
        ];
      },
    },
    {
      id: "ranger",
      objectifs: [2],
      type: "tri",
      titre: "Ranger les constats",
      notions: ["income_statement", "net_treasury", "capacity", "demand_market_share"],
      question: (c) => `Rangez chaque constat ${dE(c.entreprise)} : une force, une faiblesse, une opportunité ou une menace.`,
      categories: CATEGORIES_DU_DIAGNOSTIC,
      elements: (c) => diagnostic(c).constats.map((x) => ({ libelle: `${x.libelle} : ${ecrit(x.montant, x.unite)}`, montant: x.montant, categorie: x.categorie, pourquoi: x.pourquoi })),
      explication: (c) => {
        const d = diagnostic(c);
        const n = (k: Categorie, mot: string) => {
          const k2 = d.constats.filter((x) => x.categorie === k).length;
          return `${k2} ${mot}${k2 > 1 ? "s" : ""}`;
        };
        return [
          `${c.entreprise} a ${n("force", "force")}, ${n("faiblesse", "faiblesse")}, ${n("opportunite", "opportunité")} et ${n("menace", "menace")}. Un constat se range selon qui le décide : l'entreprise (interne) ou son environnement (externe) ; puis selon qu'il l'aide ou la gêne.`,
        ];
      },
    },
    {
      id: "facteurs-cles-de-succes",
      objectifs: [6],
      type: "choix",
      titre: "Les facteurs clés de succès",
      tableau: () => {
        const f = facteursClesDuMarche();
        return {
          titre: "Les clientèles du marché des enceintes, au premier trimestre",
          colonnes: ["Enceintes achetées", "Clients perdus par euro de hausse", "Sensibilité à la qualité"],
          lignes: f.lignes.map((x) => ({ libelle: x.nom, valeurs: [qte(x.taille), qte(x.perdueParEuro), x.qualite] })),
        };
      },
      question: () => "Un facteur clé de succès est ce qu'il faut maîtriser pour réussir sur un marché, ce qui fait acheter ses clients. Sur ce marché, quel est celui de la plus grande clientèle ?",
      options: () => {
        const f = facteursClesDuMarche();
        const p = f.plusGrande;
        return (["prix", "qualite", "notoriete"] as const).map((k) => ({
          texte: LIBELLES_DES_FACTEURS[k],
          juste: k === p.facteur,
          retour:
            k === p.facteur
              ? `Oui : les ${p.nom.toLowerCase()} sont la plus grande clientèle, ${qte(p.taille)} enceintes achetées au trimestre, et ce sont eux qui partent le plus vite quand le prix monte. Pour réussir auprès d'eux, il faut savoir vendre bon marché.`
              : `Non : c'est ce qui compte pour une autre clientèle. Les ${p.nom.toLowerCase()}, la plus grande, comparent d'abord les prix.`,
        }));
      },
    },
    {
      id: "face-aux-concurrents",
      objectifs: [6],
      type: "montants",
      titre: "NOVA face à ses concurrents",
      tableau: () => {
        const k = faceAuxConcurrents();
        return {
          titre: "Une enceinte de chaque enseigne",
          colonnes: [k.nova.nom, k.soundbox.nom, k.auris.nom],
          lignes: [
            { libelle: "Prix", valeurs: [eur(k.nova.prix), eur(k.soundbox.prix), eur(k.auris.prix)] },
            { libelle: "Coût variable", valeurs: [eur(k.nova.coutVariable), eur(k.soundbox.coutVariable), eur(k.auris.coutVariable)] },
            { libelle: "Qualité de conception", valeurs: [qte(k.nova.qualite), qte(k.soundbox.qualite), qte(k.auris.qualite)] },
          ],
        };
      },
      question: () => "Calculez la marge d'une enceinte chez NOVA et chez SoundBox (prix moins coût variable), puis l'écart de coût variable entre NOVA et SoundBox.",
      champs: () => {
        const k = faceAuxConcurrents();
        return [
          { libelle: "Marge d'une enceinte NOVA", attendu: k.nova.marge, calcul: `${eur(k.nova.prix)} − ${eur(k.nova.coutVariable)} = ${eur(k.nova.marge)}`, tolerance: 0 },
          { libelle: "Marge d'une enceinte SoundBox", attendu: k.soundbox.marge, calcul: `${eur(k.soundbox.prix)} − ${eur(k.soundbox.coutVariable)} = ${eur(k.soundbox.marge)}`, tolerance: 0 },
          { libelle: "Écart de coût variable", attendu: k.ecartDeCout, calcul: `${eur(k.nova.coutVariable)} − ${eur(k.soundbox.coutVariable)} = ${eur(k.ecartDeCout)}`, tolerance: 0 },
        ];
      },
      explication: () => {
        const k = faceAuxConcurrents();
        return [
          `SoundBox vend ${eur(k.nova.prix - k.soundbox.prix)} moins cher que NOVA et gagne pourtant plus par enceinte : elle produit ${eur(k.ecartDeCout)} moins cher. Sur le prix, le facteur clé du plus grand segment, c'est elle qui a la compétence.`,
        ];
      },
    },
    {
      id: "competence-distinctive",
      objectifs: [6],
      type: "choix",
      titre: "Une compétence distinctive ?",
      question: (c) => `Une compétence distinctive est ce qu'une organisation maîtrise mieux que ses concurrents, et qui est difficile à copier. ${c.entreprise} en a-t-elle une sur ce marché ?`,
      options: () => {
        const k = faceAuxConcurrents();
        return [
          {
            texte: "Pas encore : elle n'est la meilleure ni en coût ni en qualité",
            juste: true,
            retour: `Oui : SoundBox produit moins cher (${eur(k.soundbox.coutVariable)} contre ${eur(k.nova.coutVariable)}), Auris conçoit mieux (une qualité de ${qte(k.auris.qualite)} contre ${qte(k.nova.qualite)}). Pour réussir, NOVA doit construire une compétence distinctive qui réponde à un facteur clé de succès : c'est l'articulation des deux diagnostics.`,
          },
          {
            texte: "Oui, le prix : elle vend moins cher que ses deux concurrents",
            juste: false,
            retour: `Non : SoundBox vend ${eur(k.soundbox.prix)}, moins cher qu'elle, et produit moins cher.`,
          },
          {
            texte: "Oui, la qualité : elle a la meilleure qualité de conception des trois",
            juste: false,
            retour: `Non : Auris la dépasse nettement, à ${qte(k.auris.qualite)}.`,
          },
        ];
      },
    },
    {
      id: "conclusion",
      objectifs: [3],
      type: "choix",
      titre: "Que conclure ?",
      notions: ["capacity", "demand_market_share"],
      question: (c) => {
        const d = diagnostic(c);
        return `La demande monte de ${pct(d.hausseDeLaDemandePct)}, et la ligne refusera ${qte(d.refusees)} enceintes. Que conclut la direction ${dE(c.entreprise)} ?`;
      },
      options: (c) => {
        const d = diagnostic(c);
        const retours: Record<Verdict, string> = {
          corriger:
            d.verdict === "corriger"
              ? `Oui : l'opportunité est là, mais la ligne ne peut pas la saisir ; ${qte(d.refusees)} enceintes demandées repartiraient. La direction corrige d'abord la faiblesse (la capacité de la ligne, et une équipe à garder), sans quoi la demande en plus profitera aux concurrents.`
              : "Non : aucune faiblesse n'empêche de saisir l'opportunité.",
          saisir:
            d.verdict === "saisir"
              ? "Oui : l'entreprise a les moyens de servir la demande qui monte."
              : `Non : pour saisir la demande en plus, il faudrait pouvoir la servir. Avec ${qte(d.refusees)} enceintes refusées, la faiblesse de la ligne vient avant.`,
          "se-proteger":
            d.verdict === "se-proteger"
              ? "Oui : le marché n'offre rien, il faut se protéger."
              : `Non : la demande monte de ${pct(d.hausseDeLaDemandePct)} ; c'est une opportunité, pas seulement des menaces.`,
        };
        return (["corriger", "saisir", "se-proteger"] as const).map((v) => ({ texte: LIBELLES_DU_VERDICT[v], juste: v === d.verdict, retour: retours[v] }));
      },
    },
    {
      id: "le-marche-qui-monte",
      objectifs: [1, 2],
      type: "curseur",
      titre: "Quand le salaire cesse d'être une force",
      notions: ["pay_and_motivation"],
      sens: "plus-grande",
      question: (c) => {
        const d = diagnostic(c);
        return `${c.entreprise} paie ses opérateurs ${eur(d.salaire)} bruts. Jusqu'où le salaire du marché peut-il monter sans que ce salaire passe sous le seuil de démission (${pct(d.seuilPct)} du marché) ? Faites varier le salaire du marché : une droite donne le salaire de ${c.entreprise}, l'autre le seuil. Placez le curseur sur le plus haut salaire du marché, à l'euro, où la paie reste une force.`;
      },
      grandeur: () => ({ libelle: "Salaire du marché, par mois", unite: "€" }),
      cible: () => ({ attendu: diagnostic().marcheMaximal, min: 1_850, max: 2_100 }),
      zones: ["La paie garde l'équipe : une force", "La paie fait partir : une faiblesse"],
      rates: () => ({ dessous: "À ce salaire du marché, la paie reste une force, et un peu plus haut aussi : cherchez le plus haut.", dessus: "À ce salaire du marché, la paie de NOVA passe sous le seuil de démission." }),
      montrer: "Montrer le salaire",
      lecture: (_c, m) => {
        const d = diagnostic();
        return [
          { libelle: "Salaire d'un opérateur", montant: d.salaire },
          { libelle: "Seuil de démission", montant: Math.round(m * d.seuil * 100) / 100, fort: true },
        ];
      },
      droites: () => {
        const d = diagnostic();
        return { produit: () => d.salaire, cout: (m) => m * d.seuil, libelles: ["Salaire de NOVA", "Seuil de démission"] };
      },
      explication: (c) => {
        const d = diagnostic(c);
        return [
          `Tant que le marché paie au plus ${eur(d.marcheMaximal)}, les ${eur(d.salaire)} ${dE(c.entreprise)} restent au-dessus du seuil : c'était le cas en N, à ${eur(d.marcheN)}. À ${eur(d.marcheN1)} en N + 1, le même salaire devient une faiblesse.`,
          "Un constat interne se lit face à l'environnement : l'entreprise n'a rien changé, c'est le marché qui a bougé.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-diagnostic",
      objectifs: [3],
      type: "simulation",
      titre: "Corriger une faiblesse",
      notions: ["pay_and_motivation"],
      question: (c) =>
        `La direction ${dE(c.entreprise)} peut corriger l'une de ses faiblesses dès janvier : le salaire des opérateurs. Faites varier le salaire de N + 1 et regardez où se range le constat.`,
      leviers: () => [{ code: "salaire", libelle: "Salaire brut d'un opérateur en N + 1", unite: "€", ...SALAIRES_DU_DIAGNOSTIC, depart: SALAIRES_DU_DIAGNOSTIC.min }],
      lecture: (_c, p) => {
        const d = diagnostic(undefined, p.salaire!);
        const s = d.constats.find((x) => x.code === "salaire")!;
        return [
          { libelle: "Part du marché payée", montant: d.partPct, unite: "%", fort: true },
          { libelle: "Seuil de démission", montant: d.seuilPct, unite: "%" },
          { libelle: s.categorie === "force" ? "Opérateur qui risque de partir : aucun, le salaire est une force" : "Opérateur qui risque de partir : le salaire est une faiblesse", montant: d.sousLeSeuil ? 1 : 0, unite: "opérateur" },
        ];
      },
      defi: () => {
        const juste = salaireQuiFaitUneForce();
        return {
          consigne: `Trouvez le plus petit salaire, de ${SALAIRES_DU_DIAGNOSTIC.pas} en ${SALAIRES_DU_DIAGNOSTIC.pas} €, qui fait du salaire une force en N + 1.`,
          atteint: (p) => p.salaire === juste,
          indice: (p) => {
            const d = diagnostic(undefined, p.salaire!);
            return d.sousLeSeuil ? `À ${eur(p.salaire!)}, NOVA paie ${pct(d.partPct)} du marché : c'est encore une faiblesse.` : `À ${eur(p.salaire!)}, c'est une force : un salaire plus bas suffirait-il ?`;
          },
          solution: { salaire: juste },
        };
      },
      explication: (c, p) => {
        const d = diagnostic(c, p.salaire!);
        return [
          `Défi relevé : à ${eur(p.salaire!)}, ${c.entreprise} paie ${pct(d.partPct)} du marché, au-dessus du seuil : la faiblesse devient une force. Le salaire du marché, lui, reste une menace : la direction ne le décide pas.`,
          "Une faiblesse se corrige par une décision de l'entreprise ; une menace ne disparaît pas, on s'en protège.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share"],
      texte: (c) => {
        const d = diagnostic(c);
        return [
          `${c.entreprise} ${d.resultat >= 0 ? "est rentable dès sa première année" : "perd de l'argent sa première année"}, et sa demande monte de ${pct(d.hausseDeLaDemandePct)} ; mais sa ligne refusera ${qte(d.refusees)} enceintes et son salaire passe sous le seuil du marché. ${LIBELLES_DU_VERDICT[d.verdict]} : c'est la conclusion de son diagnostic.`,
          "Le diagnostic ne décide pas à la place de la direction : il range ce qu'elle sait, pour qu'elle voie où porter l'effort. Dans l'arène, chaque partie s'ouvre sur ce même tri.",
        ];
      },
      repere: () => "Veille, puis diagnostic. Interne : forces, faiblesses, ressources et compétences distinctives. Externe : opportunités, menaces et facteurs clés de succès. La stratégie réussit quand une compétence distinctive répond à un facteur clé.",
    },
  ],
};
