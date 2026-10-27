import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { CompanyRoundResult } from "../../../engine/types";
import { MOTIFS } from "../../gazette/banque";
import { scenarioByCode } from "../../scenarios/registry";
import { accordPluriel } from "../accords";
import { anneeJouee, type Cas } from "../cas";
import { rejouerAvec, surLAnnee } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";
import { MARCHES } from "./marche-et-part-de-marche";

/**
 * CHAPITRE : LE DIAGNOSTIC STRATÉGIQUE, FORCES, FAIBLESSES, OPPORTUNITÉS, MENACES
 * (Stratégie et management, palier 1 : seconde option management et gestion, première STMG).
 *
 * Avant de décider, la direction fait le point : ce que l'entreprise réussit ou rate par ses
 * propres choix (le diagnostic interne : forces et faiblesses), et ce que son marché, ses
 * concurrents et son environnement lui apportent ou lui imposent (le diagnostic externe :
 * opportunités et menaces). L'élève range les constats de l'année, puis en tire une conclusion.
 *
 * Les constats se calculent sur l'année de l'arène (`anneeJouee`), l'entreprise jouée par la
 * gestion équilibrée face aux deux concurrents du scénario :
 *   · internes : le résultat de l'exercice, la trésorerie nette de fin d'année, la part de la
 *     demande servie (les ventes manquées faute d'avoir produit assez), la qualité perçue et le
 *     taux de marge face au concurrent le moins cher, la part de marché face au premier
 *     concurrent ;
 *   · externes : l'évolution de la demande du marché, du premier au dernier trimestre ; le prix
 *     du concurrent le moins cher ; la défaillance d'un concurrent, quand le moteur en déclare
 *     une ; l'événement de l'année que le scénario déclenche, et ce qu'il a fait au résultat ou
 *     à la demande, mesuré en rejouant l'année sans lui (gestion-de-la-pme.ts).
 *
 * Le sens de chaque constat suit une règle écrite ici, jamais une liste propre à une entreprise :
 * un bénéfice est une force, une perte une faiblesse, et ainsi de suite.
 *
 * VOLT FITNESS N'EN EST PAS : son marché se compte d'abord en abonnés gardés, et la demande du
 * marché que le moteur donne n'y est que celle des nouveaux adhérents. Le chapitre garde les
 * entreprises du chapitre sur la part de marché (`MARCHES`).
 */

/**
 * La part de la demande qu'une entreprise doit servir pour qu'on y lise une force : 95 %.
 * HYPOTHÈSE DU COURS : laisser repartir un client sur vingt, faute d'avoir produit assez, reste
 * un accident ; au-delà, c'est une faiblesse de l'organisation.
 */
export const TAUX_DE_SERVICE_ATTENDU = 0.95;

export const ENTREPRISES_DU_DIAGNOSTIC = MARCHES;

export type Categorie = "force" | "faiblesse" | "opportunite" | "menace";

export const CATEGORIES_DU_DIAGNOSTIC: readonly { code: Categorie; libelle: string }[] = [
  { code: "force", libelle: "Force" },
  { code: "faiblesse", libelle: "Faiblesse" },
  { code: "opportunite", libelle: "Opportunité" },
  { code: "menace", libelle: "Menace" },
];

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const indice = (q: number) => q.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auDixieme = (x: number) => Math.round(x * 10) / 10;
/** « de » devant un nom propre : « d'Auris », « du Comptoir », « de NOVA ». */
export const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;
/** « que » devant un nom propre : « qu'ATLAS CONSEIL », « que NOVA ». */
const quE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);
/** Le rang d'un trimestre, en chiffres : « 1er », « 4e ». */
const rang = (k: number) => (k === 1 ? "1er" : `${k}e`);

const ventesDu = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0);
const manqueesDu = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0);
const demandeAdresseeDu = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.demandForCompany, 0);
const potentielDu = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.potential, 0);

export interface EnseigneDuDiagnostic {
  id: string;
  nom: string;
  ventes: number;
  chiffreDAffaires: number;
  prix: number;
  marge: number;
  tauxDeMarge: number;
  qualite: number;
  resultat: number;
  part: number;
  /** Le trimestre (1 à 4) où le moteur la déclare en défaillance, s'il y en a un. */
  defaillance: { trimestre: number; chiffreDAffaires: number } | null;
}

export interface Constat {
  code: string;
  libelle: string;
  montant: number;
  categorie: Categorie;
  pourquoi: string;
}

/** Ce qu'un événement de l'année a fait, mesuré en rejouant l'année sans lui. */
export interface EvenementDeLAnnee {
  code: string;
  trimestre: number;
  motif: string;
  nature: "cout" | "demande";
  /** Le multiplicateur du scénario : 1,22 pour un coût qui monte de 22 %. */
  multiplicateur: number;
  /** Ce que l'année a perdu de résultat (coût) ou gagné de demande adressée, en unités (demande). */
  resultatPerdu: number;
  demandeEnPlus: number;
}

export type Verdict = "saisir" | "corriger" | "se-proteger";

/** La clé du rejeu sans un événement, préfixée par le code du chapitre. */
export const cleSansEvenement = (code: string) => `le-diagnostic-strategique-sans-${code}`;

function evenementsDeLAnnee(c: Cas): EvenementDeLAnnee[] {
  const s = scenarioByCode(c.code).scenario;
  const { partie } = anneeJouee(c.code);
  const avec = partie.rounds.map((t) => t.results["joueur"]!);
  const scriptes = new Set((s.scriptedEvents ?? []).map((e) => e.eventCode));
  return partie.rounds.flatMap((t, k) =>
    t.newEvents
      .filter((e) => (e.scope === "market" || e.companyId === "joueur") && scriptes.has(e.code))
      .map((e) => {
        const def = s.events.find((x) => x.code === e.code)!;
        const cout = def.modifiers.find((m) => m.target === "material_cost" && m.op === "mul");
        const demande = def.modifiers.find((m) => (m.target === "demand" || m.target.startsWith("demand:")) && m.op === "mul");
        const sans = rejouerAvec(c.code, cleSansEvenement(e.code), () => undefined, (sc) => ({
          ...sc,
          scriptedEvents: (sc.scriptedEvents ?? []).filter((x) => x.eventCode !== e.code),
        }));
        const net = (a: readonly CompanyRoundResult[]) => surLAnnee(a, (r) => r.incomeStatement.netIncome);
        return {
          code: e.code,
          trimestre: k + 1,
          motif: MOTIFS[e.code]?.motif ?? e.code,
          nature: cout ? ("cout" as const) : ("demande" as const),
          multiplicateur: (cout ?? demande)?.value ?? 1,
          resultatPerdu: Math.round(net(sans) - net(avec)),
          demandeEnPlus: Math.round(surLAnnee(avec, demandeAdresseeDu) - surLAnnee(sans, demandeAdresseeDu)),
        };
      }),
  );
}

const caches = new Map<string, ReturnType<typeof calculer>>();

/** Le diagnostic de l'année, calculé une fois par entreprise. */
export function diagnostic(c: Cas) {
  const deja = caches.get(c.code);
  if (deja) return deja;
  const d = calculer(c);
  caches.set(c.code, d);
  return d;
}

function calculer(c: Cas) {
  const def = scenarioByCode(c.code);
  const { partie } = anneeJouee(c.code);
  const n = partie.rounds.length;
  const derniere = partie.rounds[n - 1]!;
  const joueur = partie.rounds.map((t) => t.results["joueur"]!);
  const potentiels = joueur.map((r) => Math.round(potentielDu(r)));
  const marcheDeLAnnee = potentiels.reduce((t, x) => t + x, 0);

  const enseignes: EnseigneDuDiagnostic[] = Object.keys(partie.rounds[0]!.results).map((id) => {
    const rs = partie.rounds.map((t) => t.results[id]!);
    // Les ventes se comptent à l'unité trimestre par trimestre, comme le suivi des objectifs les lit.
    const ventes = surLAnnee(rs, (r) => Math.round(ventesDu(r)));
    const chiffreDAffaires = Math.round(surLAnnee(rs, (r) => r.incomeStatement.revenue));
    const marge = Math.round(surLAnnee(rs, (r) => r.incomeStatement.grossMargin));
    const k = rs.findIndex((r) => r.defaillant);
    return {
      id,
      nom: id === "joueur" ? c.entreprise : (def.bots.find((b) => b.id === id)?.name ?? id),
      ventes,
      chiffreDAffaires,
      // Le prix moyen tel que le moteur l'a pratiqué : sur les ventes exactes, pas arrondies.
      prix: auCentime(surLAnnee(rs, (r) => r.incomeStatement.revenue) / surLAnnee(rs, ventesDu)),
      marge,
      tauxDeMarge: auDixieme((marge / chiffreDAffaires) * 100),
      qualite: Math.round(derniere.companies.find((x) => x.id === id)!.perceivedQuality * 100) / 100,
      resultat: Math.round(surLAnnee(rs, (r) => r.incomeStatement.netIncome)),
      part: auDixieme((ventes / marcheDeLAnnee) * 100),
      defaillance: k < 0 ? null : { trimestre: k + 1, chiffreDAffaires: Math.round(rs[k]!.incomeStatement.revenue) },
    };
  });
  const e = enseignes.find((x) => x.id === "joueur")!;
  const concurrents = enseignes.filter((x) => x.id !== "joueur");
  const moinsCher = [...concurrents].sort((a, b) => a.prix - b.prix)[0]!;
  const premierConcurrent = [...concurrents].sort((a, b) => b.ventes - a.ventes)[0]!;
  const tresorerie = Math.round(derniere.results["joueur"]!.functionalBalance.netTreasury);
  const manquees = surLAnnee(joueur, (r) => Math.round(manqueesDu(r)));
  const demande = e.ventes + manquees;
  const servie = auDixieme((e.ventes / demande) * 100);
  const caManque = Math.round(manquees * e.prix);
  const budgetQualite = Math.round(surLAnnee(joueur, (r) => r.incomeStatement.qualityCost));
  const debut = potentiels[0]!;
  const fin = potentiels[n - 1]!;
  const evolutionDuMarche = auDixieme((fin / debut - 1) * 100);
  const ventesPossiblesEnPlus = Math.round((fin - debut) * e.prix);
  const partRelative = Math.round((e.part / premierConcurrent.part) * 100) / 100;
  const ecartDePrix = auDixieme(((e.prix - moinsCher.prix) / e.prix) * 100);
  const evenements = evenementsDeLAnnee(c);
  const u = c.unites;

  const constats: Constat[] = [
    {
      code: "resultat",
      libelle: `Résultat de l'exercice ${dE(c.entreprise)}`,
      montant: e.resultat,
      categorie: e.resultat > 0 ? "force" : "faiblesse",
      pourquoi:
        e.resultat > 0
          ? "Un bénéfice : l'activité de l'année paie toutes ses charges. Il tient aux choix de l'entreprise, prix, production, dépenses : c'est une force, interne."
          : "Une perte : l'activité de l'année ne paie pas toutes ses charges. Elle tient aux choix de l'entreprise, prix, production, dépenses : c'est une faiblesse, interne.",
    },
    {
      code: "tresorerie",
      libelle: "Trésorerie nette à la fin de l'année",
      montant: tresorerie,
      categorie: tresorerie > 0 ? "force" : "faiblesse",
      pourquoi:
        tresorerie > 0
          ? "De l'argent d'avance : l'entreprise peut payer ce qu'elle doit et financer un projet. C'est une force, interne."
          : "La trésorerie est négative : l'entreprise vit à découvert, et chaque dépense nouvelle demande un financement. C'est une faiblesse, interne.",
    },
    {
      code: "demande-servie",
      libelle: `Chiffre d'affaires manqué : ${qte(manquees)} ${u} ${accordPluriel(c, "demandé")} et non ${accordPluriel(c, "servi")}, ${pct(servie)} de la demande servie`,
      montant: caManque,
      categorie: servie >= TAUX_DE_SERVICE_ATTENDU * 100 ? "force" : "faiblesse",
      pourquoi:
        servie >= TAUX_DE_SERVICE_ATTENDU * 100
          ? `Presque tous les clients venus acheter ont été servis : au moins ${pct(TAUX_DE_SERVICE_ATTENDU * 100)} de la demande. C'est une force de l'organisation, interne.`
          : `Des clients voulaient acheter, au prix ${dE(c.entreprise)}, et sont repartis sans rien, faute d'une production suffisante. C'est l'entreprise qui prévoit ce qu'elle produit : une faiblesse, interne.`,
    },
    {
      code: "qualite",
      libelle: `Budget qualité de l'année, pour une qualité perçue de ${indice(e.qualite)} en fin d'année, contre ${indice(moinsCher.qualite)} chez ${moinsCher.nom}`,
      montant: budgetQualite,
      categorie: e.qualite > moinsCher.qualite ? "force" : "faiblesse",
      pourquoi:
        e.qualite > moinsCher.qualite
          ? `Les clients jugent l'offre ${dE(c.entreprise)} meilleure que celle de son concurrent le moins cher. La qualité vient de ce que l'entreprise y consacre : c'est une force, interne.`
          : `Les clients jugent l'offre ${dE(c.entreprise)} moins bonne que celle de son concurrent le moins cher. La qualité vient de ce que l'entreprise y consacre : c'est une faiblesse, interne.`,
    },
    {
      code: "marge",
      libelle: `Marge sur coût variable de l'année, ${pct(e.tauxDeMarge)} du chiffre d'affaires, contre ${pct(moinsCher.tauxDeMarge)} chez ${moinsCher.nom}`,
      montant: e.marge,
      categorie: e.tauxDeMarge > moinsCher.tauxDeMarge ? "force" : "faiblesse",
      pourquoi:
        e.tauxDeMarge > moinsCher.tauxDeMarge
          ? `Sur chaque euro vendu, ${c.entreprise} garde plus que son concurrent le moins cher pour payer ses charges fixes. Son prix et ses coûts, c'est elle qui les fixe : une force, interne.`
          : `Sur chaque euro vendu, ${c.entreprise} garde moins que son concurrent le moins cher pour payer ses charges fixes. Son prix et ses coûts, c'est elle qui les fixe : une faiblesse, interne.`,
    },
    {
      code: "part-de-marche",
      libelle: `Chiffre d'affaires de l'année, pour une part de marché de ${pct(e.part)}, contre ${pct(premierConcurrent.part)} chez ${premierConcurrent.nom}`,
      montant: e.chiffreDAffaires,
      categorie: partRelative >= 1 ? "force" : "faiblesse",
      pourquoi:
        partRelative >= 1
          ? `La part de marché mesure la place que l'entreprise a prise par ses ventes. Avec une part relative de ${qte(partRelative)}, ${c.entreprise} est en tête : une force, interne.`
          : `La part de marché mesure la place que l'entreprise a prise par ses ventes. Avec une part relative de ${qte(partRelative)}, ${c.entreprise} est derrière ${premierConcurrent.nom} : une faiblesse, interne.`,
    },
    {
      code: "demande-du-marche",
      libelle: `Ventes possibles sur le marché ${fin >= debut ? "en plus" : "en moins"} au dernier trimestre, au prix ${dE(c.entreprise)} : la demande passe de ${qte(debut)} à ${qte(fin)} ${u}`,
      montant: Math.abs(ventesPossiblesEnPlus),
      categorie: fin > debut ? "opportunite" : "menace",
      pourquoi:
        fin > debut
          ? `Le marché demande davantage (+${pct(evolutionDuMarche)} du premier au dernier trimestre) : il y a des clients à gagner. L'entreprise ne décide pas de la demande du marché : c'est une opportunité, externe.`
          : `Le marché demande moins (${pct(evolutionDuMarche)} du premier au dernier trimestre) : il y a moins de clients à se partager. L'entreprise ne décide pas de la demande du marché : c'est une menace, externe.`,
    },
    ...(moinsCher.prix < e.prix
      ? [
          {
            code: "concurrent-moins-cher",
            libelle: `Prix moyen ${dE(moinsCher.nom)}, ${pct(ecartDePrix)} sous celui ${dE(c.entreprise)}`,
            montant: moinsCher.prix,
            categorie: "menace" as const,
            pourquoi: `${moinsCher.nom} attire les clients sensibles au prix, et ${c.entreprise} ne décide pas de son prix : c'est une menace, externe.`,
          },
        ]
      : []),
    ...concurrents.flatMap((x) =>
      x.defaillance
        ? [
            {
              code: `defaillance-${x.id}`,
              libelle: `Chiffre d'affaires ${dE(x.nom)} au ${rang(x.defaillance.trimestre)} trimestre, où l'enseigne fait défaut`,
              montant: x.defaillance.chiffreDAffaires,
              categorie: "opportunite" as const,
              pourquoi: `${x.nom} ne peut plus payer ses dettes : ses clients vont chercher une autre enseigne. Ce qui arrive à un concurrent vient de l'extérieur : une opportunité.`,
            },
          ]
        : [],
    ),
    ...evenements.map((ev): Constat => {
      const quand = `au ${rang(ev.trimestre)} trimestre`;
      if (ev.nature === "cout") {
        return {
          code: `evenement-${ev.code}`,
          libelle: `Résultat perdu : ${ev.motif}, ${quand}`,
          montant: ev.resultatPerdu,
          categorie: "menace",
          pourquoi: `Le coût d'achat de chaque unité produite monte de ${pct(auDixieme((ev.multiplicateur - 1) * 100))}, et l'entreprise n'y peut rien : c'est son environnement qui change. Une menace, externe. L'arène, rejouée sans cette hausse, mesure ce qu'elle a coûté au résultat.`,
        };
      }
      const hausse = ev.multiplicateur > 1;
      return {
        code: `evenement-${ev.code}`,
        libelle: `Demande ${hausse ? "en plus" : "en moins"} au prix ${dE(c.entreprise)} : ${ev.motif}, ${quand}`,
        montant: Math.abs(Math.round(ev.demandeEnPlus * e.prix)),
        categorie: hausse ? "opportunite" : "menace",
        pourquoi: `La demande du marché ${hausse ? "monte" : "baisse"} de ${pct(auDixieme(Math.abs(ev.multiplicateur - 1) * 100))}, sans que l'entreprise y soit pour rien : ${hausse ? "une opportunité" : "une menace"}, externe.`,
      };
    }),
  ];

  const compte = (k: Categorie) => constats.filter((x) => x.categorie === k).length;
  const comptesSains = e.resultat > 0 && tresorerie > 0;
  const verdict: Verdict = compte("opportunite") === 0 ? "se-proteger" : comptesSains ? "saisir" : "corriger";
  return {
    trimestres: n,
    enseignes,
    entreprise: e,
    concurrents,
    moinsCher,
    premierConcurrent,
    tresorerie,
    manquees,
    demande,
    servie,
    caManque,
    budgetQualite,
    marche: { debut, fin, annee: marcheDeLAnnee },
    evolutionDuMarche,
    partRelative,
    ecartDePrix,
    evenements,
    constats,
    compte: { force: compte("force"), faiblesse: compte("faiblesse"), opportunite: compte("opportunite"), menace: compte("menace") },
    comptesSains,
    verdict,
  };
}

const LIBELLES_DU_VERDICT: Record<Verdict, string> = {
  saisir: "S'appuyer sur ses forces pour saisir les opportunités du marché",
  corriger: "Corriger d'abord ses faiblesses, avant de courir après les opportunités",
  "se-proteger": "Se protéger des menaces : le marché n'offre aucune opportunité",
};

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
    "Avant de décider, la direction fait le point : ce que l'entreprise réussit ou rate par ses propres choix, et ce que son marché et ses concurrents lui apportent ou lui imposent. Les constats de l'année, rangés un par un.",
  objectifs: [
    "Distinguer le diagnostic interne et le diagnostic externe",
    "Calculer les chiffres d'un diagnostic : part de marché, évolution de la demande, demande servie",
    "Ranger des constats chiffrés en forces, faiblesses, opportunités et menaces",
    "Tirer une conclusion du diagnostic",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_DIAGNOSTIC,
    pourquoi:
      "ce chapitre lit la demande du marché et la part de marché en ventes, et chez VOLT FITNESS le marché se compte d'abord en abonnés gardés.",
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
          `L'année ${dE(c.entreprise)} dans l'arène est finie. Avant de décider de la suite, sa direction fait le point : c'est le diagnostic stratégique. Elle a deux concurrents, ${d.concurrents.map((x) => x.nom).join(" et ")}.`,
          "Le diagnostic interne regarde l'entreprise elle-même, ce qui dépend de ses choix : ce qu'elle réussit (ses forces) et ce qu'elle rate (ses faiblesses). Le diagnostic externe regarde son environnement, ce qu'elle ne décide pas : le marché, les concurrents, les événements, qui lui offrent des chances (les opportunités) ou la mettent en danger (les menaces).",
        ];
      },
      tableau: (c) => {
        const d = diagnostic(c);
        return {
          titre: "L'année des trois enseignes",
          colonnes: d.enseignes.map((x) => x.nom),
          lignes: [
            { libelle: "Chiffre d'affaires de l'année", valeurs: d.enseignes.map((x) => eur(x.chiffreDAffaires)) },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: d.enseignes.map((x) => qte(x.ventes)) },
            { libelle: "Prix moyen", valeurs: d.enseignes.map((x) => eur(x.prix)) },
            { libelle: "Qualité perçue en fin d'année (1 = la référence du marché)", valeurs: d.enseignes.map((x) => indice(x.qualite)) },
            { libelle: "Taux de marge sur coût variable", valeurs: d.enseignes.map((x) => pct(x.tauxDeMarge)) },
            { libelle: "Résultat de l'exercice", valeurs: d.enseignes.map((x) => eur(x.resultat)) },
          ],
        };
      },
      repere: () =>
        "Interne : les forces et les faiblesses, ce que l'entreprise maîtrise. Externe : les opportunités et les menaces, ce qui lui vient de son environnement.",
    },
    {
      id: "interne-ou-externe",
      type: "choix",
      titre: "Interne ou externe ?",
      notions: ["demand_market_share"],
      si: (c) => diagnostic(c).moinsCher.prix < diagnostic(c).entreprise.prix,
      question: (c) => {
        const d = diagnostic(c);
        return `${d.moinsCher.nom} vend en moyenne ${pct(d.ecartDePrix)} moins cher ${quE(c.entreprise)} (${eur(d.moinsCher.prix)} contre ${eur(d.entreprise.prix)}). Pour ${c.entreprise}, qu'est-ce que ce constat ?`;
      },
      options: (c) => {
        const d = diagnostic(c);
        return [
          {
            texte: "Une menace : ce prix vient d'un concurrent, l'entreprise ne le décide pas",
            juste: true,
            retour: `Oui. Le prix ${dE(d.moinsCher.nom)} est décidé par ${d.moinsCher.nom}, pas par ${c.entreprise} : c'est un fait de son environnement, donc externe. Il peut lui prendre des clients sensibles au prix : une menace.`,
          },
          {
            texte: "Une faiblesse : l'entreprise vend plus cher que son concurrent",
            juste: false,
            retour: `Non : une faiblesse vient de l'entreprise elle-même. Le prix ${dE(d.moinsCher.nom)}, ${c.entreprise} ne le décide pas : c'est un constat externe, une menace. Vendre plus cher n'est pas un défaut en soi, quand la qualité suit.`,
          },
          {
            texte: "Une force : chaque vente lui rapporte davantage qu'à ce concurrent",
            juste: false,
            retour: `Non : le constat porte sur le prix du concurrent, ${quE(c.entreprise)} ne décide pas. C'est un fait externe, et il peut lui prendre des clients : une menace.`,
          },
        ];
      },
    },
    {
      id: "chiffres",
      type: "montants",
      titre: "Les chiffres du diagnostic",
      notions: ["demand_market_share", "stock"],
      tableau: (c) => {
        const d = diagnostic(c);
        return {
          titre: `Les ventes ${dE(c.entreprise)} et la demande du marché`,
          colonnes: [`En ${c.unites}`],
          lignes: [
            { libelle: `Ventes ${dE(c.entreprise)} sur l'année`, valeurs: [qte(d.entreprise.ventes)] },
            { libelle: "Ventes manquées sur l'année, faute d'avoir produit assez", valeurs: [qte(d.manquees)] },
            { libelle: "Demande du marché sur l'année", valeurs: [qte(d.marche.annee)] },
            { libelle: "Demande du marché au 1er trimestre", valeurs: [qte(d.marche.debut)] },
            { libelle: `Demande du marché au ${rang(d.trimestres)} trimestre`, valeurs: [qte(d.marche.fin)] },
          ],
        };
      },
      question: (c) =>
        `Calculez, en pourcentage au dixième : la part de marché ${dE(c.entreprise)} sur l'année (ses ventes sur la demande du marché), l'évolution de la demande du marché du premier au dernier trimestre, et la part de la demande servie (les ventes, sur les ventes et les ventes manquées).`,
      champs: (c) => {
        const d = diagnostic(c);
        return [
          {
            libelle: "Part de marché de l'année (%)",
            attendu: d.entreprise.part,
            calcul: `${qte(d.entreprise.ventes)} ÷ ${qte(d.marche.annee)} × 100 = ${pct(d.entreprise.part)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Évolution de la demande du marché (%)",
            attendu: d.evolutionDuMarche,
            calcul: `(${qte(d.marche.fin)} ÷ ${qte(d.marche.debut)} − 1) × 100 = ${pct(d.evolutionDuMarche)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Part de la demande servie (%)",
            attendu: d.servie,
            calcul: `${qte(d.entreprise.ventes)} ÷ (${qte(d.entreprise.ventes)} + ${qte(d.manquees)}) × 100 = ${pct(d.servie)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const d = diagnostic(c);
        return [
          `${c.entreprise} tient ${pct(d.entreprise.part)} du marché de l'année. La demande du marché ${d.evolutionDuMarche >= 0 ? "monte" : "baisse"} de ${pct(Math.abs(d.evolutionDuMarche))} du premier au dernier trimestre : c'est un fait du marché, externe.`,
          `L'entreprise n'a servi que ${pct(d.servie)} des clients venus acheter : ${qte(d.manquees)} ${c.unites} ${accordPluriel(c, "demandé")} ne l'ont pas été, faute d'une production suffisante. Ce chiffre-là dépend d'elle : il est interne.`,
        ];
      },
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Ranger les constats",
      notions: ["income_statement", "net_treasury", "contribution_margin", "demand_market_share"],
      question: (c) =>
        `Voici les constats de l'année ${dE(c.entreprise)}. Rangez chacun : une force ou une faiblesse vient de l'entreprise elle-même, de ses choix ; une opportunité ou une menace vient de son marché, de ses concurrents ou des événements qu'elle subit.`,
      categories: CATEGORIES_DU_DIAGNOSTIC,
      elements: (c) => diagnostic(c).constats.map(({ libelle, montant, categorie, pourquoi }) => ({ libelle, montant, categorie, pourquoi })),
      explication: (c) => {
        const d = diagnostic(c);
        const k = d.compte;
        return [
          `Le diagnostic ${dE(c.entreprise)} compte ${k.force} ${k.force > 1 ? "forces" : "force"}, ${k.faiblesse} ${k.faiblesse > 1 ? "faiblesses" : "faiblesse"}, ${k.opportunite} ${k.opportunite > 1 ? "opportunités" : "opportunité"} et ${k.menace} ${k.menace > 1 ? "menaces" : "menace"}.`,
          "La question qui range un constat : l'entreprise le décide-t-elle ? Si oui, il est interne, force ou faiblesse. Sinon, il est externe, opportunité ou menace. Puis : ce constat l'aide-t-il, ou la gêne-t-il ?",
        ];
      },
    },
    {
      id: "conclusion",
      type: "choix",
      titre: "Que conclure ?",
      notions: ["net_treasury", "income_statement"],
      question: (c) => {
        const d = diagnostic(c);
        return `${c.entreprise} finit l'année avec un résultat de ${eur(d.entreprise.resultat)} et une trésorerie nette de ${eur(d.tresorerie)}, et son diagnostic compte ${d.compte.opportunite} ${d.compte.opportunite > 1 ? "opportunités" : "opportunité"}. Que conclut la direction ?`;
      },
      options: (c) => {
        const d = diagnostic(c);
        const comptes = `résultat de ${eur(d.entreprise.resultat)}, trésorerie de ${eur(d.tresorerie)}`;
        const retours: Record<Verdict, string> = {
          saisir:
            d.verdict === "saisir"
              ? `Oui : les comptes sont sains (${comptes}) et le marché offre des opportunités. L'entreprise peut s'appuyer sur ses forces pour les saisir, sans oublier ses faiblesses.`
              : d.verdict === "corriger"
                ? `Non : les opportunités sont là, mais les comptes ne sont pas sains (${comptes}). Courir après la demande sans corriger ce qui fait perdre de l'argent creuserait les difficultés.`
                : "Non : le diagnostic ne montre aucune opportunité à saisir.",
          corriger:
            d.verdict === "corriger"
              ? `Oui : le marché offre des opportunités, mais les comptes ne sont pas sains (${comptes}). L'entreprise corrige d'abord ce qui la fait perdre de l'argent, puis elle pourra saisir la demande.`
              : d.verdict === "saisir"
                ? `Non : les comptes sont sains (${comptes}). L'entreprise a les moyens de saisir les opportunités, en s'appuyant sur ses forces.`
                : "Non : le diagnostic ne montre aucune opportunité ; la priorité est de se protéger des menaces.",
          "se-proteger":
            d.verdict === "se-proteger"
              ? `Oui : le diagnostic ne montre aucune opportunité, et ${d.compte.menace} ${d.compte.menace > 1 ? "menaces" : "menace"}. La direction protège d'abord l'entreprise : ses coûts, sa trésorerie, ses clients fidèles.`
              : `Non : le diagnostic montre ${d.compte.opportunite} ${d.compte.opportunite > 1 ? "opportunités" : "opportunité"}, à saisir ${d.verdict === "saisir" ? "tout de suite" : "une fois les comptes redressés"}.`,
        };
        return (["saisir", "corriger", "se-proteger"] as const).map((v) => ({ texte: LIBELLES_DU_VERDICT[v], juste: v === d.verdict, retour: retours[v] }));
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const d = diagnostic(c);
        return [
          `Chez ${c.entreprise}, le diagnostic de l'année conduit à ${LIBELLES_DU_VERDICT[d.verdict].charAt(0).toLowerCase()}${LIBELLES_DU_VERDICT[d.verdict].slice(1)}.`,
          "Un diagnostic ne vaut que par ses chiffres : chaque constat se mesure, et se range selon que l'entreprise le décide ou non. Il prépare la suite : se fixer des objectifs, puis choisir comment les atteindre.",
        ];
      },
      repere: () => "Forces et faiblesses : le diagnostic interne. Opportunités et menaces : le diagnostic externe. On croise les deux pour décider.",
    },
  ],
};
