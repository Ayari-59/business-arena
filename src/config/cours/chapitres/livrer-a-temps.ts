import type { CompanyRoundResult, EngineScenarioConfig } from "../../../engine/types";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import { rejouerAvec } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";
import {
  ENTREPRISES_DU_TRANSPORT,
  auDixieme,
  demandeDuTrimestre,
  eur,
  jusquALaDefaillance,
  nomCourt,
  pct,
  prixEtCout,
  qte,
  transportees,
} from "./le-taux-de-remplissage";

/**
 * CHAPITRE : LIVRER À TEMPS, LES DÉLAIS ET LE SERVICE (2de pro GATL, le transport et la
 * logistique, palier 1).
 *
 * L'ARÈNE NE COMPTE AUCUN DÉLAI DE LIVRAISON. Ni retard en jours, ni heure de livraison : les seuls
 * délais en jours du moteur sont ceux des paiements. Le chapitre le dit, et prend ce que l'arène
 * calcule vraiment du service d'un transporteur :
 *
 *  · les clients servis ou refusés : chaque clientèle adresse une demande à l'entreprise
 *    (`demandForCompany`), qui n'en livre que ce qu'elle a chargé ; le reste est perdu (`lost`).
 *    Le taux de service est la part livrée ;
 *  · la qualité de service : dans le scénario du transport, la « qualité » est la ponctualité, le
 *    suivi, l'état du matériel et la marchandise intacte (scenarios/transport). Le moteur la fait
 *    baisser quand la flotte roule au-dessus de son seuil de surchauffe, 95 % de sa capacité
 *    (`computeProducedQuality`), et les clients la retiennent plusieurs trimestres
 *    (`qualityInertia`) ; elle pèse sur leur demande (`qualityEffect`), chez les industriels plus
 *    qu'ailleurs ;
 *  · la disponibilité de la flotte : une panne (la carte `transport_panne_flotte`) retire une part
 *    de la capacité du trimestre.
 *
 * Le lien entre le service et la fidélité est celui du moteur : la fidélité d'une clientèle joue
 * sur la part de sa demande gagnée au trimestre d'avant (`loyaltyEffect`, `lastMarketShare`), pas
 * sur ce qui lui a été livré. Un client refusé revient donc avec la même demande ; ce qu'il coûte,
 * c'est la vente perdue. L'arène le montre en rejouant l'année (`rejouerAvec`) : toute la demande
 * servie au premier trimestre, puis toute la flotte chargée, puis la panne.
 *
 * Il ne double pas « Entretenir l'outil » (BTS GPME), qui suit la disponibilité que l'entretien
 * protège : ici, la panne est un aléa, et ce qu'elle coûte passe par la qualité de service.
 */

/** Le trimestre que le chapitre rejoue : le premier, pour que l'arène en montre toute la suite. */
export const TRIMESTRE_DU_SERVICE = 1;

/** La panne de la flotte, telle que le scénario du transport la décrit (une carte de l'enseignant). */
export const CARTE_DE_LA_PANNE = "transport_panne_flotte";

/**
 * Le seuil de surchauffe du moteur quand le scénario n'en fixe pas : `computeProducedQuality`
 * (src/engine/production) fait baisser la qualité produite au-delà de 95 % de la capacité.
 */
export const SEUIL_DE_SURCHAUFFE_PAR_DEFAUT = 0.95;

export const seuilDeSurchauffe = (code: string) => scenarioByCode(code).scenario.production.overheatThreshold ?? SEUIL_DE_SURCHAUFFE_PAR_DEFAUT;

/** Ce que la panne laisse de la disponibilité : le produit de ses effets sur la disponibilité. */
export function disponibiliteDeLaPanne(code: string): number {
  const carte = scenarioByCode(code).scenario.events.find((e) => e.code === CARTE_DE_LA_PANNE);
  if (!carte) throw new Error(`Pas de panne de la flotte dans le scénario ${code}`);
  return carte.modifiers.filter((m) => m.target === "availability" && m.op === "mul").reduce((t, m) => t * m.value, 1);
}

/** Le scénario du cours, avec la panne posée sur l'entreprise au trimestre donné. */
export const avecLaPanne = (trimestre: number) => (s: EngineScenarioConfig): EngineScenarioConfig => ({
  ...s,
  scriptedEvents: [...s.scriptedEvents, { round: trimestre, eventCode: CARTE_DE_LA_PANNE }],
});

/** Une somme sur l'année, arrêtée à la défaillance. */
const surLAnnee = (annee: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => jusquALaDefaillance(annee).reduce((t, r) => t + f(r), 0);

export type Ecart = "plus" | "moins" | "meme";
/** Une demande qui bouge de moins d'une palette n'a pas bougé. */
const ecartDe = (avant: number, apres: number): Ecart => (apres - avant >= 1 ? "plus" : avant - apres >= 1 ? "moins" : "meme");

export type CoutDeLaPanne = "rien" | "plus-tard" | "tout-de-suite";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Le service de l'année, le client refusé, la flotte trop chargée et la panne, rejoués par l'arène. */
export function service(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Cas) {
  const def = scenarioByCode(c.code);
  const s = def.scenario;
  const { partie } = anneeJouee(c.code);
  const reference = partie.rounds.map((t) => t.results["joueur"]!);
  const annee = jusquALaDefaillance(reference);
  const trimestres = annee.map((r, k) => {
    const demandees = Math.round(demandeDuTrimestre(r));
    const livrees = Math.round(Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0));
    return { numero: k + 1, demandees, livrees, refusees: Math.max(0, demandees - livrees), taux: auDixieme((livrees / demandees) * 100) };
  });
  const demandees = trimestres.reduce((t, x) => t + x.demandees, 0);
  const livrees = trimestres.reduce((t, x) => t + x.livrees, 0);
  const refusees = demandees - livrees;
  const tauxDeService = auDixieme((livrees / demandees) * 100);
  const pire = trimestres.reduce((m, x) => (x.taux < m.taux ? x : m), trimestres[0]!);

  const T = TRIMESTRE_DU_SERVICE;
  const r = reference[T - 1]!;
  const premier = trimestres[T - 1]!;
  const { prix, coutVariable, marge } = prixEtCout(r);
  const margePerdue = Math.round(premier.refusees * marge);
  const capacite = Math.round(r.production.machineCapacity);
  const charge = Math.round(r.production.produced);
  const seuil = seuilDeSurchauffe(c.code);
  const demandeSuivante = (a: readonly CompanyRoundResult[]) => Math.round(demandeDuTrimestre(a[T]!));

  // Toute la demande servie au premier trimestre.
  const servie = rejouerAvec(c.code, `livrer-a-temps:toute-la-demande-au-trimestre-${T}`, (tour, d) =>
    tour === T ? { ...d, productionPlan: demandeDuTrimestre(r) } : undefined,
  );
  const tousServis = {
    plan: Math.round(demandeDuTrimestre(r)),
    part: auDixieme(servie[T - 1]!.production.utilizationRate * 100),
    livrees: Math.round(transportees(servie[T - 1]!)),
    resultat: Math.round(servie[T - 1]!.incomeStatement.operatingIncome),
    demandeSuivante: demandeSuivante(servie),
  };
  const ecartDuClientRefuse = ecartDe(demandeSuivante(reference), tousServis.demandeSuivante);

  // Toute la flotte chargée au premier trimestre, pour ne refuser personne.
  const pleine = rejouerAvec(c.code, `livrer-a-temps:toute-la-flotte-au-trimestre-${T}`, (tour, d) =>
    tour === T ? { ...d, productionPlan: r.production.machineCapacity } : undefined,
  );
  const p1 = pleine[T - 1]!;
  const flottePleine = {
    plan: Math.round(p1.production.produced),
    part: auDixieme(p1.production.utilizationRate * 100),
    livrees: Math.round(transportees(p1)),
    sansClient: Math.round(p1.production.produced - transportees(p1)),
    gaspillage: Math.round((p1.production.produced - transportees(p1)) * coutVariable),
    demandeSuivante: demandeSuivante(pleine),
  };
  const ecartDeLaFlottePleine = ecartDe(demandeSuivante(reference), flottePleine.demandeSuivante);

  // La panne au premier trimestre, tout le reste identique.
  const disponibilite = disponibiliteDeLaPanne(c.code);
  const enPanne = rejouerAvec(c.code, `livrer-a-temps:panne-au-trimestre-${T}`, () => undefined, avecLaPanne(T));
  const pT = enPanne[T - 1]!;
  const capacitePendantLaPanne = Math.round(capacite * disponibilite);
  const partPendantLaPanne = auDixieme((charge / capacitePendantLaPanne) * 100);
  const suite = (a: readonly CompanyRoundResult[]) => Math.round(jusquALaDefaillance(a).slice(T).reduce((t, x) => t + demandeDuTrimestre(x), 0));
  const panne = {
    capaciteLue: Math.round(pT.production.machineCapacity),
    livreesT: Math.round(transportees(pT)),
    demandeEnsuiteAvant: suite(reference),
    demandeEnsuiteApres: suite(enPanne),
    livreesAvant: Math.round(surLAnnee(reference, transportees)),
    livreesApres: Math.round(surLAnnee(enPanne, transportees)),
    resultatAvant: Math.round(surLAnnee(reference, (x) => x.incomeStatement.operatingIncome)),
    resultatApres: Math.round(surLAnnee(enPanne, (x) => x.incomeStatement.operatingIncome)),
  };
  const livreesT = Math.round(transportees(r));
  const coutDeLaPanne: CoutDeLaPanne =
    panne.livreesT < livreesT ? "tout-de-suite" : panne.resultatApres < panne.resultatAvant ? "plus-tard" : "rien";

  // Les clientèles, et celle qui regarde le plus la qualité de service.
  const clienteles = s.market.segments.map((g) => nomCourt(g.name));
  const plusExigeante = s.market.segments.reduce((m, g) => (g.qualitySensitivity > m.qualitySensitivity ? g : m), s.market.segments[0]!);

  return {
    vocabulaire: def.vocabulary,
    clienteles,
    plusExigeante: nomCourt(plusExigeante.name),
    trimestres,
    demandees,
    livrees,
    refusees,
    tauxDeService,
    pire,
    T,
    premier,
    prix,
    coutVariable,
    marge,
    margePerdue,
    capacite,
    charge,
    part: auDixieme((charge / capacite) * 100),
    seuil: Math.round(seuil * 100),
    resultatT: Math.round(r.incomeStatement.operatingIncome),
    demandeSuivante: demandeSuivante(reference),
    tousServis,
    gainDesTousServis: tousServis.resultat - Math.round(r.incomeStatement.operatingIncome),
    ecartDuClientRefuse,
    flottePleine,
    ecartDeLaFlottePleine,
    baisseDeDisponibilite: Math.round((1 - disponibilite) * 100),
    capacitePendantLaPanne,
    partPendantLaPanne,
    nePartPas: Math.max(0, charge - capacitePendantLaPanne),
    panne,
    livreesT,
    coutDeLaPanne,
  };
}

export const LIVRER_A_TEMPS: Chapitre = {
  code: "livrer-a-temps",
  parcours: "logistique",
  palier: 1,
  blocs: [
    "2de pro GATL · 2 · Organiser et planifier l'activité",
    "2de pro GATL · 5 · Assurer le respect de la réglementation, des normes et traiter les dysfonctionnements",
  ],
  titre: "Livrer à temps : les délais et le service",
  accroche:
    "Ce que l'arène compte du service d'un transporteur : les clients servis ou refusés, la qualité de service qui baisse quand la flotte roule trop chargée, et la panne qui immobilise des véhicules. Chaque fois, l'arène rejoue l'année.",
  objectifs: [
    "Calculer un taux de service et des palettes refusées",
    "Chiffrer la marge perdue avec un client refusé",
    "Dire ce qu'une flotte trop chargée fait à la qualité de service",
    "Calculer la capacité d'une flotte pendant une panne",
    "Dire ce que coûte une panne, tout de suite ou plus tard",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TRANSPORT,
    pourquoi: "ce chapitre suit les livraisons d'un transporteur, ses clients servis ou refusés et les pannes de sa flotte : seule ROUTE & CIE en a une.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que l'arène compte du service",
      notions: ["capacity", "demand_market_share"],
      texte: (c) => {
        const k = service(c);
        const noms = k.clienteles.map((x) => x.charAt(0).toLowerCase() + x.slice(1));
        return [
          `Pour un transporteur, livrer à temps, c'est le métier. L'arène ne compte pourtant aucun retard en jours ni en heures : elle ne simule pas de délai de livraison. Elle compte trois choses, et chacune se chiffre.`,
          `Les clients servis ou refusés. Chaque trimestre, ${k.clienteles.length} clientèles demandent des ${c.unites} (${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}). ${c.entreprise} ne livre que ce qu'elle a chargé : le reste est refusé.`,
          `La qualité de service. Pour un transporteur, l'arène y met la ponctualité, le suivi, l'état du matériel et la marchandise intacte. Elle baisse quand la flotte roule à plus de ${k.seuil} % de sa capacité : des véhicules trop chargés, des tournées trop serrées. Les clients s'en souviennent plusieurs trimestres, et c'est la clientèle « ${k.plusExigeante} » qui y regarde le plus.`,
          "La disponibilité de la flotte. Un véhicule à l'atelier ne roule pas : une panne retire une part de la capacité du trimestre.",
        ];
      },
      repere: () => "Taux de service = palettes livrées ÷ palettes demandées × 100.",
    },
    {
      id: "taux-de-service",
      type: "montants",
      titre: "La part des clients servis",
      notions: ["demand_market_share"],
      tableau: (c) => {
        const k = service(c);
        return {
          titre: `L'année de ${c.entreprise} : les ${c.unites} demandées et livrées`,
          colonnes: ["Demandées", "Livrées"],
          lignes: [
            ...k.trimestres.map((x) => ({ libelle: `Trimestre ${x.numero}`, valeurs: [qte(x.demandees), qte(x.livrees)] })),
            { libelle: "L'année", valeurs: [qte(k.demandees), qte(k.livrees)] },
          ],
        };
      },
      question: () => "Calculez les palettes refusées sur l'année, puis le taux de service de l'année (palettes livrées ÷ palettes demandées × 100, au dixième).",
      champs: (c) => {
        const k = service(c);
        return [
          { libelle: "Palettes refusées sur l'année", attendu: k.refusees, calcul: `${qte(k.demandees)} − ${qte(k.livrees)} = ${qte(k.refusees)}`, tolerance: 1 },
          { libelle: "Taux de service de l'année (%)", attendu: k.tauxDeService, calcul: `${qte(k.livrees)} ÷ ${qte(k.demandees)} × 100 = ${pct(k.tauxDeService)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = service(c);
        return [
          `Sur l'année, ${c.entreprise} a livré ${pct(k.tauxDeService)} des ${c.unites} demandées : ${qte(k.refusees)} ont été refusées. Le trimestre le plus mal servi est le trimestre ${k.pire.numero}, avec ${pct(k.pire.taux)}.`,
        ];
      },
    },
    {
      id: "client-refuse",
      type: "montants",
      titre: "Ce que coûte un client refusé",
      notions: ["contribution_margin"],
      question: (c) => {
        const k = service(c);
        return `Au trimestre ${k.T}, ${qte(k.premier.refusees)} ${c.unites} ont été refusées. Une ${c.unite} se vendait ${eur(k.prix)} en moyenne et coûtait ${eur(k.coutVariable)} de gazole, de péages et d'entretien. Calculez la marge d'une ${c.unite}, puis la marge perdue avec les ${c.unites} refusées.`;
      },
      champs: (c) => {
        const k = service(c);
        return [
          { libelle: `Marge par ${c.unite} au trimestre ${k.T}`, attendu: k.marge, calcul: `${eur(k.prix)} − ${eur(k.coutVariable)} = ${eur(k.marge)}` },
          { libelle: `Marge perdue au trimestre ${k.T}`, attendu: k.margePerdue, calcul: `${qte(k.premier.refusees)} × ${eur(k.marge)} = ${eur(k.margePerdue)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = service(c);
        return [
          `Chaque ${c.unite} refusée est une marge perdue : ${eur(k.margePerdue)} au trimestre ${k.T}. Les charges fixes, elles, étaient payées de toute façon : servir ces clients n'aurait coûté que le gazole, les péages et l'entretien de leurs ${c.unites}.`,
        ];
      },
    },
    {
      id: "revient",
      type: "choix",
      titre: "Le client refusé revient-il ?",
      notions: ["demand_market_share"],
      tableau: (c) => {
        const k = service(c);
        return {
          titre: `Le trimestre ${k.T} rejoué, tous les clients servis`,
          colonnes: ["Comme dans l'année", "Tous les clients servis"],
          lignes: [
            { libelle: `« ${k.vocabulaire.productionPlanLabel} » au trimestre ${k.T}`, valeurs: [qte(k.charge), qte(k.tousServis.plan)] },
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} livrées au trimestre ${k.T}`, valeurs: [qte(k.livreesT), qte(k.tousServis.livrees)] },
            { libelle: `Résultat d'exploitation du trimestre ${k.T}`, valeurs: [eur(k.resultatT), eur(k.tousServis.resultat)] },
            { libelle: `Demande des clients au trimestre ${k.T + 1}`, valeurs: [qte(k.demandeSuivante), qte(k.tousServis.demandeSuivante)] },
          ],
        };
      },
      question: (c) => {
        const k = service(c);
        return `L'arène a rejoué l'année en chargeant au trimestre ${k.T} toute la demande des clients, ${qte(k.tousServis.plan)} ${c.unites}. Que devient la demande des clients au trimestre ${k.T + 1} ?`;
      },
      options: (c) => {
        const k = service(c);
        const lu = `${qte(k.demandeSuivante)} ${c.unites} demandées au trimestre ${k.T + 1} comme dans l'année, ${qte(k.tousServis.demandeSuivante)} quand tous les clients ont été servis.`;
        const pourquoi = `Dans l'arène, la demande d'un trimestre dépend du prix, de la publicité, de la qualité de service et de la part de marché du trimestre d'avant ; elle ne dépend pas de ce qui a été livré. Un client refusé coûte la vente perdue : ${eur(k.gainDesTousServis)} de résultat au trimestre ${k.T}. Dans la réalité, un client souvent refusé finit par changer de transporteur : l'arène ne le simule pas.`;
        return [
          {
            texte: "La même : le client refusé revient avec la même demande",
            juste: k.ecartDuClientRefuse === "meme",
            retour: k.ecartDuClientRefuse === "meme" ? `Oui : ${lu} ${pourquoi}` : `Non : ${lu}`,
          },
          {
            texte: "Plus forte : les clients bien servis demandent davantage",
            juste: k.ecartDuClientRefuse === "plus",
            retour: k.ecartDuClientRefuse === "plus" ? `Oui : ${lu}` : `Non : ${lu} ${pourquoi}`,
          },
          {
            texte: "Plus faible : servir tout le monde a usé la flotte",
            juste: k.ecartDuClientRefuse === "moins",
            retour:
              k.ecartDuClientRefuse === "moins"
                ? `Oui : ${lu}`
                : `Non : ${lu} Chargée à ${pct(k.tousServis.part)} de sa capacité, la flotte ${k.tousServis.part > k.seuil ? `a dépassé ${k.seuil} %, mais la demande n'a pas baissé` : `est restée sous ${k.seuil} % : la qualité de service n'a pas baissé`}.`,
          },
        ];
      },
    },
    {
      id: "flotte-pleine",
      type: "choix",
      titre: "Charger toute la flotte ?",
      notions: ["capacity"],
      tableau: (c) => {
        const k = service(c);
        return {
          titre: `Le trimestre ${k.T} rejoué, toute la flotte chargée`,
          colonnes: ["Comme dans l'année", "Toute la flotte"],
          lignes: [
            { libelle: `« ${k.vocabulaire.productionPlanLabel} » au trimestre ${k.T}`, valeurs: [qte(k.charge), qte(k.flottePleine.plan)] },
            { libelle: "Part de la capacité chargée", valeurs: [pct(k.part), pct(k.flottePleine.part)] },
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} livrées au trimestre ${k.T}`, valeurs: [qte(k.livreesT), qte(k.flottePleine.livrees)] },
            { libelle: `Demande des clients au trimestre ${k.T + 1}`, valeurs: [qte(k.demandeSuivante), qte(k.flottePleine.demandeSuivante)] },
          ],
        };
      },
      question: (c) => {
        const k = service(c);
        return `Pour ne refuser personne, le chef d'exploitation veut charger toute la flotte au trimestre ${k.T} : ${qte(k.flottePleine.plan)} ${c.unites}, pour ${qte(k.premier.demandees)} demandées. Que montre l'arène au trimestre ${k.T + 1} ?`;
      },
      options: (c) => {
        const k = service(c);
        const f = k.flottePleine;
        const lu = `${qte(k.demandeSuivante)} ${c.unites} demandées au trimestre ${k.T + 1} comme dans l'année, ${qte(f.demandeSuivante)} avec toute la flotte chargée.`;
        const pourquoi = `Chargée à ${pct(f.part)} de sa capacité, au-dessus de ${k.seuil} %, la flotte a moins bien livré : la qualité de service a baissé, et les clients l'ont retenu.`;
        const gaspi =
          f.sansClient > 0
            ? ` Et ${qte(f.sansClient)} ${c.unites} chargées n'avaient pas de client : leur gazole, leurs péages et leur entretien sont payés pour rien, ${eur(f.gaspillage)}.`
            : "";
        return [
          {
            texte: "La demande baisse : la flotte trop chargée a moins bien livré",
            juste: k.ecartDeLaFlottePleine === "moins",
            retour: k.ecartDeLaFlottePleine === "moins" ? `Oui : ${lu} ${pourquoi}${gaspi}` : `Non : ${lu}`,
          },
          {
            texte: "La demande monte : tous les clients ont été servis",
            juste: k.ecartDeLaFlottePleine === "plus",
            retour: k.ecartDeLaFlottePleine === "plus" ? `Oui : ${lu}` : `Non : ${lu} Servir tous les clients ne fait pas monter la demande suivante.${gaspi}`,
          },
          {
            texte: "Rien ne change : seules les livraisons du trimestre comptent",
            juste: k.ecartDeLaFlottePleine === "meme",
            retour: k.ecartDeLaFlottePleine === "meme" ? `Oui : ${lu}${gaspi}` : `Non : ${lu} ${pourquoi}`,
          },
        ];
      },
    },
    {
      id: "panne",
      type: "montants",
      titre: "Une panne de la flotte",
      notions: ["capacity"],
      question: (c) => {
        const k = service(c);
        return `Au trimestre ${k.T}, une panne immobilise des véhicules : le garage annonce que la flotte perd ${k.baisseDeDisponibilite} % de sa disponibilité pour le trimestre. ${c.entreprise} avait prévu ${qte(k.charge)} « ${k.vocabulaire.productionPlanLabel} ». Calculez la capacité de la flotte pendant la panne, puis la part de cette capacité que le chargement prévu occupe (au dixième).`;
      },
      champs: (c) => {
        const k = service(c);
        return [
          {
            libelle: `Capacité de la flotte pendant la panne (${c.unites})`,
            attendu: k.capacitePendantLaPanne,
            calcul: `${qte(k.capacite)} × (100 % − ${k.baisseDeDisponibilite} %) = ${qte(k.capacitePendantLaPanne)}`,
            tolerance: 1,
          },
          {
            libelle: "Part de la capacité chargée pendant la panne (%)",
            attendu: k.partPendantLaPanne,
            calcul: `${qte(k.charge)} ÷ ${qte(k.capacitePendantLaPanne)} × 100 = ${pct(k.partPendantLaPanne)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = service(c);
        return [
          k.nePartPas > 0
            ? `${qte(k.nePartPas)} ${c.unites} prévues ne tiennent plus dans les véhicules qui restent : elles ne partiront pas.`
            : `Toutes les ${c.unites} prévues tiennent dans les véhicules qui restent.`,
          k.partPendantLaPanne > k.seuil
            ? `Mais la flotte roule à ${pct(k.partPendantLaPanne)} de sa capacité, au-dessus de ${k.seuil} % : la qualité de service va baisser.`
            : `Et la flotte reste sous ${k.seuil} % de sa capacité : la qualité de service ne baisse pas.`,
        ];
      },
    },
    {
      id: "cout-de-la-panne",
      type: "choix",
      titre: "Ce que coûte la panne",
      notions: ["capacity", "demand_market_share"],
      tableau: (c) => {
        const k = service(c);
        const p = k.panne;
        return {
          titre: `L'année de ${c.entreprise}, avec et sans la panne`,
          colonnes: ["Sans panne", `Panne au trimestre ${k.T}`],
          lignes: [
            { libelle: `Capacité de la flotte au trimestre ${k.T}`, valeurs: [qte(k.capacite), qte(p.capaciteLue)] },
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} livrées au trimestre ${k.T}`, valeurs: [qte(k.livreesT), qte(p.livreesT)] },
            { libelle: "Demande des clients sur les trimestres suivants", valeurs: [qte(p.demandeEnsuiteAvant), qte(p.demandeEnsuiteApres)] },
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} livrées sur l'année`, valeurs: [qte(p.livreesAvant), qte(p.livreesApres)] },
            { libelle: "Résultat d'exploitation de l'année", valeurs: [eur(p.resultatAvant), eur(p.resultatApres)] },
          ],
        };
      },
      question: (c) => {
        const k = service(c);
        return `L'arène a rejoué l'année avec la panne au trimestre ${k.T}, tout le reste identique. Qu'a-t-elle coûté à ${c.entreprise} ?`;
      },
      options: (c) => {
        const k = service(c);
        const p = k.panne;
        const annee = `Sur l'année, ${qte(p.livreesAvant - p.livreesApres)} ${c.unites} de moins ont été livrées, et le résultat d'exploitation passe de ${eur(p.resultatAvant)} à ${eur(p.resultatApres)}.`;
        const tard = `Au trimestre ${k.T}, ${qte(p.livreesT)} ${c.unites} livrées, comme sans la panne. Mais la flotte a roulé à ${pct(k.partPendantLaPanne)} de sa capacité : la qualité de service a baissé, et les clients ont demandé ${qte(p.demandeEnsuiteAvant - p.demandeEnsuiteApres)} ${c.unites} de moins les trimestres suivants. ${annee}`;
        return [
          {
            texte: "Rien : toutes les palettes prévues sont parties",
            juste: k.coutDeLaPanne === "rien",
            retour: k.coutDeLaPanne === "rien" ? `Oui. ${annee}` : `Non. ${k.coutDeLaPanne === "plus-tard" ? tard : annee}`,
          },
          {
            texte: "Des clients plus tard : la qualité de service a baissé",
            juste: k.coutDeLaPanne === "plus-tard",
            retour: k.coutDeLaPanne === "plus-tard" ? `Oui. ${tard} Une panne coûte même quand toutes les ${c.unites} partent.` : `Non. ${annee}`,
          },
          {
            texte: "Des palettes tout de suite : la flotte ne pouvait pas tout charger",
            juste: k.coutDeLaPanne === "tout-de-suite",
            retour:
              k.coutDeLaPanne === "tout-de-suite"
                ? `Oui : ${qte(k.livreesT - p.livreesT)} ${c.unites} prévues n'ont pas pu partir au trimestre ${k.T}. ${annee}`
                : `Non : les ${qte(k.charge)} ${c.unites} prévues tenaient dans les ${qte(k.capacitePendantLaPanne)} places qui restaient. ${k.coutDeLaPanne === "plus-tard" ? tard : annee}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "demand_market_share"],
      texte: (c) => {
        const k = service(c);
        return [
          `Sur l'année, ${c.entreprise} a livré ${pct(k.tauxDeService)} des ${c.unites} demandées. Chaque ${c.unite} refusée est une marge perdue : ${eur(k.margePerdue)} au trimestre ${k.T}. Dans l'arène, le client refusé revient, mais la vente du trimestre ne se rattrape pas.`,
          `La qualité de service, c'est la ponctualité : elle baisse quand la flotte roule à plus de ${k.seuil} % de sa capacité, et les clients demandent moins ensuite. Une panne la fait baisser même quand toutes les ${c.unites} partent, parce qu'elle laisse moins de place pour les mêmes livraisons.`,
          "Livrer à temps, c'est charger ce que les clients demandent, ni plus ni moins, et savoir ce que coûte une flotte qui roule sans marge.",
        ];
      },
      repere: (c) => `Taux de service = palettes livrées ÷ palettes demandées × 100. Au-delà de ${service(c).seuil} % de la capacité de la flotte, la qualité de service baisse.`,
    },
  ],
};
