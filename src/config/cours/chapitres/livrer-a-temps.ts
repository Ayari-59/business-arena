import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { margeUnitaire } from "../monde/capacite";
import {
  COUT_DE_STOCKAGE_PAR_TRIMESTRE,
  ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA,
  POURQUOI_LA_PRODUCTION_DE_NOVA,
  anneeAvecDeLAvance,
  ficheDeNova,
  serviceDeLAnnee,
} from "../monde/production-et-logistique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LIVRER À TEMPS, LES DÉLAIS ET LE SERVICE (2de pro GATL, le transport et la logistique,
 * palier 1).
 *
 * Un client qui commande une enceinte NOVA l'attend dans le trimestre ; s'il ne l'a pas, il achète
 * ailleurs. En N + 1, la demande dépasse ce que la ligne peut monter au printemps et à Noël
 * (monde/production-et-logistique.ts, qui relit nova-capacite.ts) : 1 200 enceintes ne seront pas
 * livrées à temps. L'élève calcule le taux de service (95,6 %), dit quels trimestres manquent, chiffre
 * la marge perdue, puis cherche comment livrer tout le monde : de la capacité en plus, ou des
 * enceintes montées d'avance quand la ligne a du jeu.
 *
 * L'EXPÉRIENCE. Un curseur : la capacité qu'il faudrait en plus au 4e trimestre pour tout livrer (800
 * enceintes). Un laboratoire : les enceintes à monter d'avance au 1er et au 3e trimestre pour tout
 * livrer au meilleur gain, stockage payé (400 et 800). Le coût de stockage est l'hypothèse du chapitre.
 *
 * CE QUI A CHANGÉ. Il se jouait chez ROUTE & CIE, sur une flotte de l'arène qui ne compte aucun
 * délai ; il se joue chez NOVA, où une commande non montée dans son trimestre est une vente perdue.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DU_SERVICE: readonly string[] = ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA;

/** Le trimestre du curseur : le 4e de N + 1, Noël, celui qui manque le plus. */
export const TRIMESTRE_DU_CURSEUR = 4;

/** Les bornes du curseur (la capacité en plus) et des leviers du laboratoire (l'avance, par 200 enceintes). */
const CAPACITE_DU_CURSEUR = { min: 0, max: 2_000 } as const;
const AVANCE_AU_PREMIER = { min: 0, max: 1_200, pas: 200 } as const;
const AVANCE_AU_TROISIEME = { min: 0, max: 800, pas: 200 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 10) / 10).toLocaleString("fr-FR")} %`;
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);

const f = (c: Pick<Cas, "code">) => ficheDeNova(c);

/** Le service de l'année N + 1. */
export const service = (c: Pick<Cas, "code">) => serviceDeLAnnee(f(c));

/** L'année avec une avance au 1er et au 3e trimestre. */
const avec = (c: Pick<Cas, "code">, a1: number, a3: number) => anneeAvecDeLAvance(f(c), [a1, 0, a3, 0]);

/** Le laboratoire : l'avance qui laisse le meilleur gain. */
export function avanceDuLaboratoire(c: Pick<Cas, "code">) {
  let meilleur = { a1: 0, a3: 0, gain: avec(c, 0, 0).gain };
  for (let a1 = AVANCE_AU_PREMIER.min; a1 <= AVANCE_AU_PREMIER.max; a1 += AVANCE_AU_PREMIER.pas)
    for (let a3 = AVANCE_AU_TROISIEME.min; a3 <= AVANCE_AU_TROISIEME.max; a3 += AVANCE_AU_TROISIEME.pas) {
      const g = avec(c, a1, a3).gain;
      if (g > meilleur.gain) meilleur = { a1, a3, gain: g };
    }
  return meilleur;
}

function tableauDuService(c: Cas): TableauDeDonnees {
  const t = service(c).a.trimestres;
  return {
    titre: `L'année N + 1 de ${c.entreprise}, prévue`,
    colonnes: t.map((x) => `${rang(x.trimestre)} trimestre`),
    lignes: [
      { libelle: `Demande des clients (${c.unites})`, valeurs: t.map((x) => qte(x.demande)) },
      { libelle: `Capacité de la ligne (${c.unites})`, valeurs: t.map((x) => qte(x.capacite)) },
      { libelle: `Livrées à temps (${c.unites})`, valeurs: t.map((x) => qte(x.production)) },
    ],
  };
}

export const LIVRER_A_TEMPS: Chapitre = {
  code: "livrer-a-temps",
  parcours: "logistique",
  palier: 1,
  blocs: ["2de pro GATL · 2 · Organiser et planifier l'activité", "2de pro GATL · 5 · Assurer le respect de la réglementation, des normes et traiter les dysfonctionnements"],
  titre: "Livrer à temps : les délais et le service",
  accroche: "Un client qui n'est pas livré à temps achète ailleurs. Le taux de service, les commandes perdues, et deux façons de livrer tout le monde : plus de capacité, ou un stock monté d'avance.",
  objectifs: [
    "Calculer un taux de service",
    "Dire quand et pourquoi des commandes ne sont pas livrées à temps",
    "Chiffrer ce que coûte une commande perdue",
    "Préparer un pic en montant d'avance",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_SERVICE, pourquoi: POURQUOI_LA_PRODUCTION_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Livrer dans le trimestre",
      notions: ["capacity", "demand_market_share"],
      tableau: tableauDuService,
      texte: (c) => [
        `Les clients de ${c.entreprise} attendent leur ${c.unite} dans le trimestre où ils la commandent. Une commande que la ligne ne peut pas monter à temps est perdue : le client achète chez un concurrent.`,
        "Le taux de service dit quelle part des commandes est livrée à temps : livrées à temps ÷ demandées.",
        "Le tableau donne l'année N + 1, prévue trimestre par trimestre.",
      ],
      repere: () => "Taux de service = commandes livrées à temps ÷ commandes reçues × 100.",
    },
    {
      id: "le-taux-de-service",
      objectifs: [0],
      type: "montants",
      titre: "Le taux de service",
      notions: ["capacity"],
      tableau: tableauDuService,
      question: (c) => `Calculez les ${c.unites} demandées sur l'année, celles livrées à temps, celles qui ne le sont pas, puis le taux de service (au dixième).`,
      champs: (c) => {
        const s = service(c);
        const t = s.a.trimestres;
        return [
          { libelle: "Demandées sur l'année", attendu: s.a.demande, calcul: `${t.map((x) => qte(x.demande)).join(" + ")} = ${qte(s.a.demande)}`, tolerance: 0 },
          { libelle: "Livrées à temps", attendu: s.a.production, calcul: `${t.map((x) => qte(x.production)).join(" + ")} = ${qte(s.a.production)}`, tolerance: 0 },
          { libelle: "Non livrées à temps", attendu: s.refusees, calcul: `${qte(s.a.demande)} − ${qte(s.a.production)} = ${qte(s.refusees)}`, tolerance: 0 },
          { libelle: "Taux de service (%)", attendu: Math.round(s.tauxDeService * 10) / 10, calcul: `${qte(s.a.production)} ÷ ${qte(s.a.demande)} × 100 = ${pct(s.tauxDeService)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const s = service(c);
        return [`${pct(s.tauxDeService)} des commandes seront livrées à temps : ${qte(s.refusees)} ${c.unites} manqueront, toutes aux trimestres où la ligne est pleine.`];
      },
    },
    {
      id: "quand",
      objectifs: [1],
      type: "choix",
      titre: "Quand les commandes manquent",
      notions: ["capacity", "seasonality"],
      tableau: tableauDuService,
      question: () => "Pourquoi des commandes ne seront-elles pas livrées à temps ?",
      options: () => [
        { texte: "La ligne est pleine au printemps et à Noël", juste: true, retour: "Oui : au 2e et au 4e trimestre, la demande dépasse ce que la ligne peut monter. Aux deux autres, elle a du jeu." },
        { texte: "Le fournisseur livre les composants trop tard", juste: false, retour: "Non : rien ne dit que les composants manquent ; c'est la capacité de la ligne qui borne ce qui se monte." },
        { texte: "L'équipe est trop petite toute l'année, en toute saison", juste: false, retour: "Non : aux 1er et 3e trimestres, toutes les commandes sont livrées. Le manque suit la saison." },
      ],
    },
    {
      id: "ce-que-coute-une-commande-perdue",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûtent les commandes perdues",
      notions: ["contribution_margin"],
      question: (c) => `Chaque ${c.unite} vendue laisse ${eur(margeUnitaire(f(c)))} de marge sur coût variable. Calculez la marge perdue avec les commandes non livrées à temps.`,
      champs: (c) => {
        const s = service(c);
        return [{ libelle: "Marge perdue sur l'année", attendu: s.margePerdue, calcul: `${qte(s.refusees)} × ${eur(margeUnitaire(f(c)))} = ${eur(s.margePerdue)}` }];
      },
      explication: (c) => {
        const s = service(c);
        return [`${eur(s.margePerdue)} de marge perdue, sans compter les clients qui, déçus, ne reviendront pas l'année suivante.`];
      },
    },
    {
      id: "la-capacite-qui-manque",
      objectifs: [1, 2],
      type: "curseur",
      titre: "La capacité qui manque à Noël",
      notions: ["capacity"],
      question: (c) => {
        const t = service(c).a.trimestres[TRIMESTRE_DU_CURSEUR - 1]!;
        return `Au ${rang(TRIMESTRE_DU_CURSEUR)} trimestre, les clients demanderont ${qte(t.demande)} ${c.unites}, et la ligne en monte ${qte(t.capacite)}. Faites varier la capacité en plus : une droite donne ce que la ligne monterait, l'autre la demande. Placez le curseur sur la plus petite capacité en plus qui livre tout à temps, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Capacité en plus au trimestre", unite: c.unites }),
      cible: (c) => {
        const t = service(c).a.trimestres[TRIMESTRE_DU_CURSEUR - 1]!;
        return { attendu: t.demande - t.capacite, ...CAPACITE_DU_CURSEUR };
      },
      zones: ["Tout est livré à temps", "Des commandes sont perdues"],
      rates: () => ({
        dessous: "Avec si peu de capacité en plus, des commandes restent perdues.",
        dessus: "Tout est livré, mais moins de capacité suffirait : cherchez la plus petite.",
      }),
      montrer: "Montrer la capacité",
      lecture: (c, q) => {
        const t = service(c).a.trimestres[TRIMESTRE_DU_CURSEUR - 1]!;
        return [
          { libelle: "Ce que la ligne monterait", montant: t.capacite + q, fort: true },
          { libelle: "Demande du trimestre", montant: t.demande },
          { libelle: "Commandes perdues", montant: Math.max(0, t.demande - t.capacite - q) },
        ];
      },
      droites: (c) => {
        const t = service(c).a.trimestres[TRIMESTRE_DU_CURSEUR - 1]!;
        return { produit: (q) => t.capacite + q, cout: () => t.demande, libelles: ["Ce que la ligne monterait", "Demande du trimestre"] };
      },
      explication: (c) => {
        const t = service(c).a.trimestres[TRIMESTRE_DU_CURSEUR - 1]!;
        return [`Il manquerait ${qte(t.demande - t.capacite)} ${c.unites} de capacité à Noël. Un poste de plus les donnerait, mais il se paie toute l'année ; la ligne a pourtant du jeu au trimestre d'avant.`];
      },
    },
    {
      id: "le-laboratoire-de-l-avance",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de l'avance",
      notions: ["capacity", "stock"],
      question: (c) =>
        `Quand la ligne a du jeu, elle peut monter d'avance des ${c.unites} qui attendront en stock le trimestre suivant. Chaque ${c.unite} gardée un trimestre coûte ${eur(COUT_DE_STOCKAGE_PAR_TRIMESTRE)} de stockage. Faites varier l'avance montée au 1er et au 3e trimestre. Relevez le défi.`,
      leviers: (c) => [
        { code: "premier", libelle: "Avance montée au 1er trimestre", unite: c.unites, ...AVANCE_AU_PREMIER, depart: 0 },
        { code: "troisieme", libelle: "Avance montée au 3e trimestre", unite: c.unites, ...AVANCE_AU_TROISIEME, depart: 0 },
      ],
      lecture: (c, p) => {
        const x = avec(c, p.premier!, p.troisieme!);
        const d = avec(c, 0, 0);
        return [
          { libelle: "Commandes perdues", montant: x.refusees, unite: c.unites, reference: d.refusees },
          { libelle: "Taux de service", montant: Math.round(x.tauxDeService * 10) / 10, unite: "%", reference: Math.round(d.tauxDeService * 10) / 10 },
          { libelle: "Marge gagnée", montant: x.margeGagnee, reference: d.margeGagnee },
          { libelle: "Coût du stockage", montant: x.stockage, reference: d.stockage },
          { libelle: "Gain de l'avance", montant: x.gain, reference: d.gain, fort: true },
        ];
      },
      defi: (c) => {
        const juste = avanceDuLaboratoire(c);
        return {
          consigne: "Trouvez l'avance qui laisse le meilleur gain, stockage payé.",
          atteint: (p) => p.premier === juste.a1 && p.troisieme === juste.a3,
          indice: (p) => {
            const x = avec(c, p.premier!, p.troisieme!);
            return x.refusees > 0
              ? `Il reste ${qte(x.refusees)} commandes perdues : l'avance couvre-t-elle le trimestre qui suit ?`
              : `Tout est livré, mais le stockage coûte ${eur(x.stockage)} : une partie de l'avance attend-elle plus longtemps qu'il ne faut ?`;
          },
          solution: { premier: juste.a1, troisieme: juste.a3 },
        };
      },
      explication: (c, p) => {
        const x = avec(c, p.premier!, p.troisieme!);
        return [
          `Défi relevé : ${qte(p.premier!)} ${c.unites} d'avance au 1er trimestre, ${qte(p.troisieme!)} au 3e. Toutes les commandes sont livrées à temps, et le gain atteint ${eur(x.gain)} : la marge retrouvée, moins ${eur(x.stockage)} de stockage.`,
          "Monter d'avance juste ce qui manquera ensuite : plus, et le stock attend pour rien ; moins, et des commandes restent perdues.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity"],
      texte: (c) => {
        const s = service(c);
        return [
          `Sans rien changer, ${c.entreprise} livrera à temps ${pct(s.tauxDeService)} des commandes de N + 1, et perdra ${qte(s.refusees)} ${c.unites}, ${eur(s.margePerdue)} de marge.`,
          "Livrer à temps, c'est prévoir les pics : ajouter de la capacité quand le manque dure, ou monter d'avance quand la ligne a du jeu juste avant. Un stock d'avance coûte, mais bien moins que les clients perdus.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : comparez, à chaque tour, la demande de vos clients et ce que vous avez pu leur livrer.",
        ];
      },
      repere: () => "Taux de service = livrées à temps ÷ demandées × 100. Une commande perdue coûte sa marge.",
    },
  ],
};
