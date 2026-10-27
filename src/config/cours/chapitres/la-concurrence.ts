import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { runGame, soldUnits, type GameRunResult } from "../../../engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState, RoundDecisions } from "../../../engine/types";
import { scenarioByCode } from "../../scenarios/registry";
import { GRAINE_DU_COURS, decisionsDuCours, scenarioDuCours } from "../arene-du-cours";
import type { Cas } from "../cas";
import type { Changement } from "../gestion-de-la-pme";
import type { Chapitre, TableauDeDonnees } from "../types";
import { MARCHES } from "./marche-et-part-de-marche";

/**
 * CHAPITRE : LA CONCURRENCE, PLUSIEURS VENDEURS POUR LES MÊMES CLIENTS (Seconde, sciences
 * économiques et sociales, palier 1).
 *
 * Le regard de l'économiste de seconde sur un marché : plusieurs vendeurs offrent le même bien
 * aux mêmes clients, et chaque client compare leurs prix et leur qualité. Le chapitre lit les
 * trois entreprises de l'arène sur l'année du cours (leurs ventes, leurs prix, leur qualité et
 * leurs parts du marché), puis fait monter son prix à l'entreprise de l'élève : l'arène rejoue
 * l'année, et l'élève voit où partent les clients, ce que chaque concurrent y gagne, et si la
 * hausse a payé. Il en tire l'idée centrale : un vendeur qui a des concurrents ne fixe pas son
 * prix comme il veut, et la concurrence tire les prix vers le bas.
 *
 * Il ne double pas « Le marché et la part de marché » (bac STMG, mercatique), qui mesure la part
 * de l'entreprise dans la demande possible au premier trimestre et sa position de leader ; ni
 * « Lire la stratégie de ses concurrents » (stratégie), qui place les enseignes sur une carte
 * prix / qualité. Ici, la part de marché se compte sur les ventes des trois vendeurs, et l'objet
 * est ce que la concurrence fait au prix.
 *
 * D'où viennent les chiffres. L'année du cours, jouée par le moteur : l'entreprise de l'élève
 * tenue par le bon gestionnaire, et ses deux concurrents par leur propre gestion
 * (arene-du-cours.ts). Le rejeu fait jouer à l'entreprise, à chaque trimestre, un prix ABSOLU :
 * celui de sa décision du premier trimestre de l'année du cours, monté de `HAUSSE_DU_PRIX`
 * (chaque article de la gamme à la boutique). Le formulaire reconduirait sinon la hausse d'un
 * trimestre sur l'autre ; un prix posé une fois pour toutes ne se compose pas, et la garde
 * vérifie le prix joué à chaque trimestre. Le reste se décide comme dans l'année du cours, avec
 * les mêmes concurrents et la même façon de gérer : la production de l'entreprise suit ses
 * ventes, celle des concurrents les leurs.
 *
 * Le rejeu garde les résultats des trois entreprises : `rejouerAvec` (gestion-de-la-pme.ts) ne
 * rend que ceux de l'élève, et le chapitre a besoin de ce que gagnent les concurrents. Il joue la
 * même partie, de la même façon (même scénario, même graine, mêmes gestions) ; la garde vérifie
 * que l'entreprise de l'élève y fait exactement ce que `rejouerAvec` lui fait faire.
 *
 * La hausse est la seule hypothèse du cours. VOLT FITNESS n'en est pas : ses ventes comptent
 * d'abord les abonnés gardés, pas des clients qui choisissent leur vendeur ce trimestre-là.
 */

/** La hausse du prix que le chapitre rejoue : 10 %, une hausse que le client remarque (hypothèse du cours). */
export const HAUSSE_DU_PRIX = 0.1;

/** Les entreprises du chapitre : celles dont les ventes comptent des clients qui choisissent leur vendeur. */
export const ENTREPRISES_DE_LA_CONCURRENCE = MARCHES;

/** Les trimestres de l'année du cours. */
const TRIMESTRES = 4;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const ecart = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const qualiteEcrite = (q: number) => q.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
/** « de » devant un nom : élidé devant une voyelle, contracté devant l'article (« du Comptoir »). */
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;
/** « à » devant un nom : contracté devant l'article (« au Comptoir »). */
const aU = (nom: string) => (/^Le /.test(nom) ? `au ${nom.slice(3)}` : /^Les /.test(nom) ? `aux ${nom.slice(4)}` : `à ${nom}`);
const ventesEcrites = (n: number) => (Math.abs(n) === 1 ? `${qte(n)} vente` : `${qte(n)} ventes`);

/** Une partie du marché : les quatre trimestres des trois entreprises, et les décisions que l'élève y a jouées. */
export interface MarcheJoue {
  partie: GameRunResult;
  /** La décision de l'entreprise de l'élève à chaque trimestre, telle que le moteur l'a jouée. */
  jouees: RoundDecisions[];
}

const parties = new Map<string, MarcheJoue>();

/**
 * L'année du cours rejouée avec la décision de l'élève changée par `change`, les trois
 * entreprises gardées. `cle` nomme la variante, préfixée du code du chapitre, pour ne la jouer
 * qu'une fois.
 */
export function marcheRejoue(code: string, cle: string, change: Changement): MarcheJoue {
  const k = `${code}:la-concurrence:${cle}`;
  const deja = parties.get(k);
  if (deja) return deja;
  const def = scenarioByCode(code);
  const joue = scenarioDuCours(def.scenario, TRIMESTRES);
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const jouees: RoundDecisions[] = [];
  const partie = runGame({
    scenario: joue,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: decisionsDuCours(entreprises, joue, (t, d) => {
      const x = change(t, d) ?? d;
      jouees.push(x);
      return x;
    }),
  });
  const r = { partie, jouees };
  parties.set(k, r);
  return r;
}

/** L'année du cours, sans rien changer. */
export const marcheDeReference = (code: string) => marcheRejoue(code, "reference", () => undefined);

/** Le prix de l'année, monté de `hausse` : la décision du premier trimestre, en valeur absolue. */
export function prixMonte(code: string, hausse: number) {
  const d = marcheDeReference(code).jouees[0]!;
  const fois = (p: number) => auCentime(p * (1 + hausse));
  return {
    hausse,
    avant: d.price,
    apres: fois(d.price),
    /** En gamme, le prix de chaque article, avant et après ; null sans gamme. */
    articles: d.products
      ? Object.entries(d.products).map(([article, p]) => ({ article, avant: p.price, apres: fois(p.price) }))
      : null,
  };
}

/** L'année rejouée au prix monté de `hausse`, posé à chaque trimestre. */
export function marcheAuPrixMonte(code: string, hausse: number): MarcheJoue {
  const p = prixMonte(code, hausse);
  const apres = new Map((p.articles ?? []).map((a) => [a.article, a.apres]));
  return marcheRejoue(code, `prix-${p.apres}`, (_t, d) => ({
    ...d,
    price: p.apres,
    ...(d.products
      ? { products: Object.fromEntries(Object.entries(d.products).map(([k, x]) => [k, { ...x, price: apres.get(k) ?? x.price }])) }
      : {}),
  }));
}

/** Les trimestres qu'une entreprise a joués : une entreprise défaillante compte zéro les suivants. */
export function trimestresActifs(rs: readonly CompanyRoundResult[]): CompanyRoundResult[] {
  const fin = rs.findIndex((r) => r.defaillant === true);
  return fin < 0 ? [...rs] : rs.slice(0, fin + 1);
}

export interface Vendeur {
  id: string;
  nom: string;
  ventes: number;
  /** Les ventes que les clients voulaient faire chez lui, servies ou non. */
  demande: number;
  chiffreDAffaires: number;
  prix: number;
  /** La qualité que les clients lui reconnaissent en fin d'année (1 : la qualité de référence). */
  qualite: number;
  benefice: number;
  defaillant: boolean;
}

/** Les trois vendeurs d'une année jouée, l'entreprise de l'élève d'abord. */
export function vendeursDe(c: Cas, m: MarcheJoue): Vendeur[] {
  const def = scenarioByCode(c.code);
  const ids = ["joueur", ...def.bots.slice(0, 2).map((b) => b.id)];
  const derniere = m.partie.rounds.at(-1)!;
  return ids.map((id) => {
    const rs = trimestresActifs(m.partie.rounds.map((t) => t.results[id]!));
    const somme = (f: (r: CompanyRoundResult) => number) => Math.round(rs.reduce((t, r) => t + f(r), 0));
    const ventes = somme(soldUnits);
    const chiffreDAffaires = somme((r) => r.incomeStatement.revenue);
    return {
      id,
      nom: id === "joueur" ? c.entreprise : def.bots.find((b) => b.id === id)!.name,
      ventes,
      demande: somme((r) => Object.values(r.market.bySegment).reduce((s, v) => s + v.demandForCompany, 0)),
      chiffreDAffaires,
      prix: auCentime(chiffreDAffaires / ventes),
      qualite: auCentieme(derniere.companies.find((x) => x.id === id)!.perceivedQuality),
      benefice: somme((r) => r.incomeStatement.netIncome),
      defaillant: rs.some((r) => r.defaillant === true),
    };
  });
}

/** Les parts de marché des trois vendeurs : chacun ses ventes, sur les ventes des trois. */
function partsDe(vendeurs: readonly Vendeur[]) {
  const total = vendeurs.reduce((t, v) => t + v.ventes, 0);
  return { total, parts: vendeurs.map((v) => auDixieme((v.ventes / total) * 100)) };
}

export type OuVontLesClients = "premier" | "second" | "personne";
export type Verdict = "gagne-plus" | "gagne-moins";
export type PlaceDuPlusVendeur = "moins-cher" | "milieu" | "plus-cher";

/** Le marché de l'année, puis l'année rejouée au prix monté : ce que le chapitre lit et calcule. */
export function laConcurrence(c: Cas, hausse = HAUSSE_DU_PRIX) {
  const avant = vendeursDe(c, marcheDeReference(c.code));
  const apres = vendeursDe(c, marcheAuPrixMonte(c.code, hausse));
  const marche = Math.round(
    marcheDeReference(c.code).partie.rounds.reduce(
      (t, tour) => t + Object.values(tour.results["joueur"]!.market.bySegment).reduce((s, v) => s + v.potential, 0),
      0,
    ),
  );
  const { total, parts } = partsDe(avant);
  const { total: totalApres, parts: partsApres } = partsDe(apres);
  const [e, a, b] = avant as [Vendeur, Vendeur, Vendeur];
  const [e2, a2, b2] = apres as [Vendeur, Vendeur, Vendeur];
  // Qui vend le plus, et à quel rang de prix.
  const parPrix = [...avant].sort((x, y) => x.prix - y.prix);
  const plusVendeur = avant.reduce((g, x) => (x.ventes > g.ventes ? x : g));
  const place: PlaceDuPlusVendeur = plusVendeur === parPrix[0] ? "moins-cher" : plusVendeur === parPrix[2] ? "plus-cher" : "milieu";
  // Ce que la hausse a fait : les ventes perdues, et où sont allés les clients.
  const perdues = e.ventes - e2.ventes;
  const gagneesA = a2.ventes - a.ventes;
  const gagneesB = b2.ventes - b.ventes;
  const nullePart = perdues - gagneesA - gagneesB;
  const destinations: [OuVontLesClients, number][] = [
    ["premier", gagneesA],
    ["second", gagneesB],
    ["personne", nullePart],
  ];
  const ouVontLesClients = destinations.reduce((g, x) => (x[1] > g[1] ? x : g))[0];
  const ecartDeBenefice = e2.benefice - e.benefice;
  const verdict: Verdict = ecartDeBenefice > 0 ? "gagne-plus" : "gagne-moins";
  return {
    hausse,
    prix: prixMonte(c.code, hausse),
    marche,
    avant,
    apres,
    entreprise: e,
    concurrents: [a, b] as const,
    ventesDuMarche: total,
    parts,
    ventesDuMarcheApres: totalApres,
    partsApres,
    parPrix,
    plusVendeur,
    place,
    perdues,
    gagneesA,
    gagneesB,
    nullePart,
    ouVontLesClients,
    /** Les clients en plus que chaque concurrent a vus venir, servis ou non. */
    demandeEnPlusA: a2.demande - a.demande,
    demandeEnPlusB: b2.demande - b.demande,
    ecartDeBenefice,
    ecartDeChiffre: e2.chiffreDAffaires - e.chiffreDAffaires,
    points: auDixieme(partsApres[0]! - parts[0]!),
    verdict,
  };
}

/** Le prix monté, en une phrase : « affiche 64,90 € au lieu de 59 € », ou chaque article d'une gamme. */
function prixDuRejeu(k: ReturnType<typeof laConcurrence>) {
  return k.prix.articles
    ? `vend chacun de ses articles ${pct(k.hausse * 100)} plus cher qu'au premier trimestre, et cela toute l'année`
    : `affiche ${eur(k.prix.apres)} au lieu de ${eur(k.prix.avant)}, son prix du premier trimestre, et cela toute l'année`;
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const k = laConcurrence(c);
  return {
    titre: "L'année du cours, vendeur par vendeur",
    colonnes: k.avant.map((v) => v.nom),
    lignes: [
      { libelle: `Ventes de l'année (${c.unites})`, valeurs: k.avant.map((v) => qte(v.ventes)) },
      { libelle: "Chiffre d'affaires de l'année", valeurs: k.avant.map((v) => eur(v.chiffreDAffaires)) },
      { libelle: "Prix moyen", valeurs: k.avant.map((v) => eur(v.prix)) },
      { libelle: "Qualité perçue en fin d'année", valeurs: k.avant.map((v) => qualiteEcrite(v.qualite)) },
    ],
  };
}

function tableauDuRejeu(c: Cas): TableauDeDonnees {
  const k = laConcurrence(c);
  const [a, b] = k.concurrents;
  const [, a2, b2] = k.apres;
  return {
    titre: `L'année rejouée, ${c.entreprise} ${pct(k.hausse * 100)} plus cher`,
    colonnes: ["Année du cours", `Prix monté de ${pct(k.hausse * 100)}`],
    lignes: [
      { libelle: `Prix moyen ${dE(c.entreprise)}`, valeurs: [eur(k.entreprise.prix), eur(k.apres[0]!.prix)] },
      { libelle: `Ventes ${dE(c.entreprise)}`, valeurs: [qte(k.entreprise.ventes), qte(k.apres[0]!.ventes)] },
      { libelle: `Ventes ${dE(a.nom)}`, valeurs: [qte(a.ventes), qte(a2!.ventes)] },
      { libelle: `Ventes ${dE(b.nom)}`, valeurs: [qte(b.ventes), qte(b2!.ventes)] },
    ],
  };
}

function tableauDuBenefice(c: Cas): TableauDeDonnees {
  const k = laConcurrence(c);
  const e2 = k.apres[0]!;
  return {
    titre: `L'année ${dE(c.entreprise)}, à chaque prix`,
    colonnes: ["Année du cours", `Prix monté de ${pct(k.hausse * 100)}`],
    lignes: [
      { libelle: "Prix moyen", valeurs: [eur(k.entreprise.prix), eur(e2.prix)] },
      { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.entreprise.ventes), qte(e2.ventes)] },
      { libelle: "Chiffre d'affaires", valeurs: [eur(k.entreprise.chiffreDAffaires), eur(e2.chiffreDAffaires)] },
      { libelle: "Bénéfice de l'année", valeurs: [eur(k.entreprise.benefice), eur(e2.benefice)] },
    ],
  };
}

/** Où sont allés les clients perdus, en une phrase chiffrée. */
function lesClientsPartis(c: Cas, k: ReturnType<typeof laConcurrence>) {
  const [a, b] = k.concurrents;
  const vu = (nom: string, demande: number, gagnees: number) => {
    if (demande <= 0) return `la demande adressée ${aU(nom)} n'a pas monté`;
    const ventes =
      gagnees >= demande
        ? "et ses ventes d'autant : ces clients ont été servis"
        : gagnees > 0
          ? `mais ses ventes de ${qte(gagnees)} seulement : le reste n'a pas été servi`
          : gagnees === 0
            ? "mais ses ventes n'ont pas bougé : ces clients n'ont pas été servis"
            : `et ses ventes ont baissé de ${qte(-gagnees)} : ces clients n'ont pas été servis`;
    return `la demande adressée ${aU(nom)} a monté de ${qte(demande)} ${c.unites}, ${ventes}`;
  };
  return `${vu(a.nom, k.demandeEnPlusA, k.gagneesA)} ; ${vu(b.nom, k.demandeEnPlusB, k.gagneesB)}`;
}

export const LA_CONCURRENCE: Chapitre = {
  code: "la-concurrence",
  parcours: "seconde-ses",
  palier: 1,
  blocs: ["2de SES · Comment se forment les prix sur un marché ?"],
  titre: "La concurrence : plusieurs vendeurs pour les mêmes clients",
  accroche:
    "Trois entreprises vendent le même bien aux mêmes clients. Qui vend le plus, à quel prix ? Et si l'une monte son prix, où partent ses clients ? L'arène rejoue l'année pour le voir.",
  objectifs: [
    "Calculer la part de marché de chaque vendeur",
    "Relier le prix, la qualité et les ventes de chaque vendeur",
    "Dire où partent les clients quand un vendeur monte son prix",
    "Expliquer pourquoi la concurrence tire les prix vers le bas",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CONCURRENCE,
    pourquoi: "ce chapitre suit des clients qui choisissent leur vendeur, et chez VOLT FITNESS les ventes comptent d'abord les abonnés gardés.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois vendeurs, un même marché",
      notions: ["demand_market_share"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const k = laConcurrence(c);
        const [a, b] = k.concurrents;
        return [
          `Sur le marché ${dE(c.entreprise)}, trois vendeurs offrent le même bien aux mêmes clients : ${c.entreprise}, ${a.nom} et ${b.nom}. C'est un marché concurrentiel : chaque client peut acheter chez l'un ou chez l'autre.`,
          `Dans l'année du cours, les clients de ce marché auraient pu acheter ${qte(k.marche)} ${c.unites}. Les trois vendeurs en ont vendu ${qte(k.ventesDuMarche)} : ce sont les ventes du marché. Pour choisir son vendeur, chaque client compare deux choses : le prix, et la qualité qu'il reconnaît à chacun (1 est la qualité de référence du marché).`,
        ];
      },
      repere: () => "Part de marché d'un vendeur = ses ventes ÷ les ventes de tous les vendeurs du marché × 100.",
    },
    {
      id: "parts",
      type: "montants",
      titre: "La part de marché de chacun",
      notions: ["demand_market_share"],
      question: () =>
        "Calculez les ventes du marché (les ventes des trois vendeurs réunies), puis la part de marché de chaque vendeur, en pourcentage au dixième.",
      champs: (c) => {
        const k = laConcurrence(c);
        const somme = k.avant.map((v) => qte(v.ventes)).join(" + ");
        return [
          { libelle: "Ventes du marché", attendu: k.ventesDuMarche, calcul: `${somme} = ${qte(k.ventesDuMarche)}` },
          ...k.avant.map((v, i) => ({
            libelle: `Part de marché ${dE(v.nom)} (%)`,
            attendu: k.parts[i]!,
            calcul: `${qte(v.ventes)} ÷ ${qte(k.ventesDuMarche)} × 100 = ${pct(k.parts[i]!)}`,
            tolerance: 0.1,
          })),
        ];
      },
      explication: (c) => {
        const k = laConcurrence(c);
        const e = k.entreprise;
        return [
          `${k.plusVendeur.nom} prend la plus grande part du marché, ${pct(k.parts[k.avant.indexOf(k.plusVendeur)]!)}. ${k.plusVendeur === e ? `C'est ${c.entreprise} : elle vend plus que chacun de ses concurrents.` : `${c.entreprise} en prend ${pct(k.parts[0]!)}.`}`,
          "Les trois parts font 100 % : ce qu'un vendeur prend, les autres ne l'ont pas. C'est cela, la concurrence : les vendeurs se disputent les mêmes clients.",
        ];
      },
    },
    {
      id: "prix-et-ventes",
      type: "choix",
      titre: "Le prix, la qualité et les ventes",
      notions: ["demand_market_share", "price_elasticity"],
      tableau: tableauDeLAnnee,
      question: () => "Rangez les trois vendeurs du moins cher au plus cher. Lequel vend le plus ?",
      options: (c) => {
        const k = laConcurrence(c);
        const [bas, milieu, haut] = k.parPrix as [Vendeur, Vendeur, Vendeur];
        const meilleur = k.avant.reduce((g, x) => (x.qualite > g.qualite ? x : g));
        const qualite =
          meilleur === haut
            ? `${haut.nom}, le plus cher, est aussi celui que les clients jugent le meilleur (${qualiteEcrite(haut.qualite)}) : il garde des clients malgré son prix.`
            : `${meilleur.nom} est celui que les clients jugent le meilleur (${qualiteEcrite(meilleur.qualite)}).`;
        const fait = `${bas.nom} vend à ${eur(bas.prix)}, ${milieu.nom} à ${eur(milieu.prix)}, ${haut.nom} à ${eur(haut.prix)} ; ${k.plusVendeur.nom} vend le plus, ${qte(k.plusVendeur.ventes)} ${c.unites}.`;
        const options: { place: PlaceDuPlusVendeur; texte: string; oui: string }[] = [
          {
            place: "moins-cher",
            texte: "Le moins cher des trois",
            oui: `Oui : ${fait} À qualité voisine, le client va d'abord au prix le plus bas. ${qualite}`,
          },
          {
            place: "milieu",
            texte: "Celui dont le prix est entre les deux autres",
            oui: `Oui : ${fait} Le prix ne fait pas tout : la qualité compte aussi dans le choix du client. ${qualite}`,
          },
          {
            place: "plus-cher",
            texte: "Le plus cher des trois",
            oui: `Oui : ${fait} Ses clients paient sa qualité. ${qualite}`,
          },
        ];
        return options.map((o) => ({
          texte: o.texte,
          juste: o.place === k.place,
          retour: o.place === k.place ? o.oui : `Non : ${fait}`,
        }));
      },
    },
    {
      id: "hausse",
      type: "montants",
      titre: "Si l'entreprise monte son prix",
      notions: ["price_elasticity", "demand_market_share"],
      tableau: tableauDuRejeu,
      question: (c) => {
        const k = laConcurrence(c);
        return `L'arène a rejoué l'année : ${c.entreprise} ${prixDuRejeu(k)}. Ses concurrents gardent leur propre façon de gérer. D'après le tableau, calculez les ventes perdues par ${c.entreprise}, celles que gagne chacun de ses concurrents (négatif s'il en perd), puis la nouvelle part de marché ${dE(c.entreprise)}, au dixième.`;
      },
      champs: (c) => {
        const k = laConcurrence(c);
        const [a, b] = k.concurrents;
        const [e2, a2, b2] = k.apres as [Vendeur, Vendeur, Vendeur];
        return [
          { libelle: `Ventes perdues par ${c.entreprise}`, attendu: k.perdues, calcul: `${qte(k.entreprise.ventes)} − ${qte(e2.ventes)} = ${qte(k.perdues)}` },
          { libelle: `Ventes gagnées par ${a.nom}`, attendu: k.gagneesA, calcul: `${qte(a2.ventes)} − ${qte(a.ventes)} = ${qte(k.gagneesA)}` },
          { libelle: `Ventes gagnées par ${b.nom}`, attendu: k.gagneesB, calcul: `${qte(b2.ventes)} − ${qte(b.ventes)} = ${qte(k.gagneesB)}` },
          {
            libelle: `Nouvelle part de marché ${dE(c.entreprise)} (%)`,
            attendu: k.partsApres[0]!,
            calcul: `${qte(e2.ventes)} ÷ (${k.apres.map((v) => qte(v.ventes)).join(" + ")}) × 100 = ${pct(k.partsApres[0]!)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = laConcurrence(c);
        return [
          `${c.entreprise} perd ${ventesEcrites(k.perdues)}, et sa part de marché passe de ${pct(k.parts[0]!)} à ${pct(k.partsApres[0]!)}. Quand un vendeur monte son prix, des clients vont voir ailleurs.`,
        ];
      },
    },
    {
      id: "ou-vont-les-clients",
      type: "choix",
      titre: "Où partent les clients",
      notions: ["demand_market_share", "capacity"],
      tableau: tableauDuRejeu,
      question: (c) => `Au prix monté, ${c.entreprise} fait ${ventesEcrites(laConcurrence(c).perdues)} de moins. Où ces clients sont-ils surtout partis ?`,
      options: (c) => {
        const k = laConcurrence(c);
        const [a, b] = k.concurrents;
        const faits = `${lesClientsPartis(c, k)}.`;
        const partis = k.nullePart > 0 ? ` Au total, ${ventesEcrites(k.nullePart)} ne se sont faites chez aucun des trois vendeurs.` : "";
        return [
          {
            texte: `Chez ${a.nom}`,
            juste: k.ouVontLesClients === "premier",
            retour: k.ouVontLesClients === "premier" ? `Oui : ${faits}${partis}` : `Non : ${faits}${partis}`,
          },
          {
            texte: `Chez ${b.nom}`,
            juste: k.ouVontLesClients === "second",
            retour: k.ouVontLesClients === "second" ? `Oui : ${faits}${partis}` : `Non : ${faits}${partis}`,
          },
          {
            texte: "Nulle part : ils n'achètent chez personne",
            juste: k.ouVontLesClients === "personne",
            retour:
              k.ouVontLesClients === "personne"
                ? `Oui : ${faits}${partis} Un concurrent ne gagne que les clients qu'il peut servir ; les autres repartent sans acheter, ou renoncent devant le prix.`
                : `Non : ${faits}${partis}`,
          },
        ];
      },
    },
    {
      id: "benefice",
      type: "choix",
      titre: "La hausse a-t-elle payé ?",
      notions: ["income_statement", "price_elasticity"],
      tableau: tableauDuBenefice,
      question: (c) => `Avec son prix monté, ${c.entreprise} vend moins, mais plus cher. Qu'en dit son bénéfice de l'année ?`,
      options: (c) => {
        const k = laConcurrence(c);
        const e2 = k.apres[0]!;
        const faits = `le bénéfice passe de ${eur(k.entreprise.benefice)} à ${eur(e2.benefice)} (${ecart(k.ecartDeBenefice)}), avec ${ventesEcrites(k.perdues)} de moins.`;
        return [
          {
            texte: "Il augmente : chaque vente rapporte plus, et cela compense les clients perdus",
            juste: k.verdict === "gagne-plus",
            retour:
              k.verdict === "gagne-plus"
                ? `Oui : ${faits} Ici, les clients restent assez nombreux pour que la hausse paie. Mais la part de marché recule de ${qte(Math.abs(k.points))} points : les concurrents en profitent.`
                : `Non : ${faits}`,
          },
          {
            texte: "Il baisse : les clients perdus coûtent plus que la hausse ne rapporte",
            juste: k.verdict === "gagne-moins",
            retour:
              k.verdict === "gagne-moins"
                ? `Oui : ${faits} Face à des concurrents, un prix plus haut fait fuir trop de clients pour être rentable.`
                : `Non : ${faits}`,
          },
        ];
      },
    },
    {
      id: "la-concurrence-tire-les-prix",
      type: "choix",
      titre: "Ce que la concurrence fait au prix",
      notions: ["price_elasticity", "demand_market_share"],
      question: (c) => `Sur ce marché, qu'est-ce qui empêche ${c.entreprise} de monter son prix autant qu'elle le voudrait ?`,
      options: (c) => {
        const k = laConcurrence(c);
        const [a, b] = k.concurrents;
        return [
          {
            texte: "Ses clients peuvent acheter chez un concurrent",
            juste: true,
            retour: `Oui : à ${pct(k.hausse * 100)} de plus, ${c.entreprise} perd ${ventesEcrites(k.perdues)} et ${qte(Math.abs(k.points))} points de part de marché${k.demandeEnPlusA > 0 || k.demandeEnPlusB > 0 ? " : des clients se tournent vers ses concurrents" : ""}. Plus un client a de vendeurs où aller, moins chacun peut monter son prix : la concurrence tire les prix vers le bas.`,
          },
          {
            texte: "La loi fixe le prix de chaque produit",
            juste: false,
            retour: `Non : sur ce marché, chaque vendeur fixe librement son prix ; les trois vendeurs n'ont d'ailleurs pas le même. Ce qui le retient, ce sont les clients qui peuvent partir chez ${a.nom} ou ${b.nom}.`,
          },
          {
            texte: "Ses clients achètent toujours autant, quel que soit le prix",
            juste: false,
            retour: `Non : au prix monté, ${c.entreprise} fait ${ventesEcrites(k.perdues)} de moins. Si les clients achetaient toujours autant, rien ne l'empêcherait de monter son prix.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share", "price_elasticity"],
      texte: (c) => {
        const k = laConcurrence(c);
        return [
          `Sur le marché ${dE(c.entreprise)}, trois vendeurs se partagent les mêmes clients : ${k.avant.map((v, i) => `${v.nom} ${pct(k.parts[i]!)}`).join(", ")} des ventes de l'année. ${k.plusVendeur.nom} vend le plus ; chaque client compare les prix et la qualité.`,
          `Quand ${c.entreprise} monte son prix de ${pct(k.hausse * 100)}, elle perd ${ventesEcrites(k.perdues)}, et son bénéfice ${k.verdict === "gagne-plus" ? "monte" : "baisse"} de ${eur(Math.abs(k.ecartDeBenefice))}. Un concurrent ne prend que les clients qu'il peut servir ; les autres renoncent ou repartent sans acheter.`,
          `Sur un marché concurrentiel, aucun vendeur ne fixe seul le prix : s'il est plus cher que les autres sans être meilleur, ses clients s'en vont. C'est pourquoi la concurrence tire les prix vers le bas, au profit des acheteurs. Un vendeur seul sur son marché, lui, pourrait monter son prix sans voir ses clients partir chez un autre.`,
        ];
      },
      repere: () =>
        "Part de marché = ventes du vendeur ÷ ventes du marché × 100. Plus il y a de vendeurs capables de servir les clients, moins chacun peut monter son prix.",
    },
  ],
};
