import type { CompanyRoundResult } from "../../../../engine/types";
import { type Cas } from "../../cas";
import { anneeJouee } from "../../annee-de-l-arene";
import { auDixieme, demandeDuTrimestre, eur, jusquALaDefaillance, pct, prixEtCout, qte, retranche, transportees } from "../../chapitres/le-taux-de-remplissage";
import { LIVRER_A_TEMPS, TRIMESTRE_DU_SERVICE, avecLaPanne, disponibiliteDeLaPanne, seuilDeSurchauffe } from "../../chapitres/livrer-a-temps";
import { rejouerAvec } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LIVRER À TEMPS : LES DÉLAIS ET LE SERVICE » : COMBIEN CHARGER PENDANT
 * LA PANNE (2de pro GATL, le transport et la logistique, palier 1).
 *
 * Le chapitre a montré qu'une panne retire de la place à la flotte, et qu'une flotte chargée
 * au-dessus de son seuil de surchauffe livre moins bien : les clients demandent moins ensuite. Ici,
 * le chef d'exploitation a prévu de charger plus que la gestion de l'année, pour servir une partie
 * des clients refusés (`PART_PREVUE_PAR_LE_CHEF`) ; la panne est annoncée avant le trimestre, et ce
 * chargement passerait au-dessus du seuil de la flotte en panne. Il hésite. Garder
 * le chargement prévu ? Le baisser pour rester au seuil, et refuser des clients de plus ? Ou remplir
 * toutes les places qui restent ? L'élève calcule la capacité pendant la panne, le chargement qui
 * tient au seuil, ce qu'il coûte tout de suite en marge, et lit dans l'arène ce que chaque choix
 * laisse sur l'année.
 *
 * Tout vient de l'arène : la panne (`transport_panne_flotte`, posée au trimestre du chapitre), le
 * seuil de surchauffe du moteur (`seuilDeSurchauffe`), le chargement prévu (les « Palettes à
 * charger » prévues par le chef, une part de la flotte au complet), le prix et le coût variable
 * d'une palette. L'année est rejouée trois fois avec la panne, une par chargement. Chaque année
 * s'additionne jusqu'à une éventuelle défaillance, et la meilleure désigne la réponse : elle se
 * calcule, elle ne s'écrit pas.
 *
 * Les trimestres suivants sont joués par la gestion du cours, qui prévoit chaque trimestre son
 * chargement d'après la demande du trimestre d'avant, ventes manquées comprises (arene-du-cours.ts) ;
 * une demande en plus ne compte que si la flotte l'aurait chargée. L'explication le dit quand
 * l'année rejouée le montre, et seulement alors.
 */

/**
 * Le chargement que le chef d'exploitation a prévu pour le trimestre de la panne, avant de
 * l'apprendre : 70 % de la flotte au complet. C'est plus que la gestion de l'année du cours, qui
 * refuse des clients ce trimestre-là ; pendant la panne, ce chargement passe au-dessus du seuil de
 * surchauffe sans dépasser la capacité qui reste (la garde le vérifie). L'hypothèse est celle du
 * cas : dans l'année du chapitre, le chargement du trimestre tient sous le seuil, et la question
 * ne s'y pose pas.
 */
export const PART_PREVUE_PAR_LE_CHEF = 0.7;

export type ChoixPendantLaPanne = "garder" | "baisser" | "remplir";

const T = TRIMESTRE_DU_SERVICE;

const resultat = (a: readonly CompanyRoundResult[], depuis = 0) =>
  Math.round(jusquALaDefaillance(a).slice(depuis).reduce((t, r) => t + r.incomeStatement.operatingIncome, 0));
const demandeEnsuite = (a: readonly CompanyRoundResult[]) => Math.round(jusquALaDefaillance(a).slice(T).reduce((t, r) => t + demandeDuTrimestre(r), 0));
const chargeesEnsuite = (a: readonly CompanyRoundResult[]) => Math.round(jusquALaDefaillance(a).slice(T).reduce((t, r) => t + r.production.produced, 0));
/** Chaque trimestre après la panne, des clients restent refusés : une demande en plus n'y serait pas chargée. */
const refuseEnsuite = (a: readonly CompanyRoundResult[]) =>
  jusquALaDefaillance(a)
    .slice(T)
    .every((r) => demandeDuTrimestre(r) - Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0) >= 1);

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** La flotte pendant la panne, les trois chargements, et l'année rejouée pour chacun. */
export function chargementPendantLaPanne(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Cas) {
  const { partie } = anneeJouee(c.code);
  const r = partie.rounds[T - 1]!.results["joueur"]!;
  const disponibilite = disponibiliteDeLaPanne(c.code);
  const seuil = seuilDeSurchauffe(c.code);
  const capacite = Math.round(r.production.machineCapacity);
  const capaciteExacte = r.production.machineCapacity * disponibilite;
  const capacitePendantLaPanne = Math.round(capaciteExacte);
  const prevu = Math.round(PART_PREVUE_PAR_LE_CHEF * r.production.machineCapacity);
  // Le chargement le plus haut qui reste au seuil : le moteur ne fait baisser la qualité qu'au-dessus.
  const auSeuil = Math.floor(seuil * capaciteExacte + 1e-6);
  const { marge } = prixEtCout(r);

  const plans: Record<ChoixPendantLaPanne, number> = { garder: prevu, baisser: auSeuil, remplir: capaciteExacte };
  const jouer = (choix: ChoixPendantLaPanne) =>
    rejouerAvec(
      c.code,
      `combien-charger-pendant-la-panne:${choix}`,
      (tour, d) => (tour === T ? { ...d, productionPlan: plans[choix] } : undefined),
      avecLaPanne(T),
    );
  const lire = (choix: ChoixPendantLaPanne) => {
    const a = jouer(choix);
    const x = a[T - 1]!;
    return {
      plan: Math.round(x.production.produced),
      part: auDixieme(x.production.utilizationRate * 100),
      livrees: Math.round(transportees(x)),
      resultatT: Math.round(x.incomeStatement.operatingIncome),
      demandeEnsuite: demandeEnsuite(a),
      chargeesEnsuite: chargeesEnsuite(a),
      refuseEnsuite: refuseEnsuite(a),
      resultatEnsuite: resultat(a, T),
      resultatAnnee: resultat(a),
    };
  };
  const annees = { garder: lire("garder"), baisser: lire("baisser"), remplir: lire("remplir") };
  // La meilleure année désigne la réponse ; à égalité, le chargement prévu.
  const ordre: ChoixPendantLaPanne[] = ["garder", "baisser", "remplir"];
  const meilleur = ordre.reduce((m, k) => (annees[k].resultatAnnee > annees[m].resultatAnnee ? k : m), "garder" as ChoixPendantLaPanne);

  const prevuArrondi = Math.round(prevu);
  const refuseesEnPlus = Math.max(0, prevuArrondi - auSeuil);
  return {
    capacite,
    baisseDeDisponibilite: Math.round((1 - disponibilite) * 100),
    capacitePendantLaPanne,
    seuil: Math.round(seuil * 100),
    prevu: prevuArrondi,
    /** Le chargement de la gestion dans l'année du cours, sans la panne. */
    chargementDeLAnnee: Math.round(r.production.planned),
    demande: Math.round(demandeDuTrimestre(r)),
    partPrevue: auDixieme((prevu / capaciteExacte) * 100),
    auSeuil,
    placesRestantes: Math.max(0, capacitePendantLaPanne - prevuArrondi),
    refuseesEnPlus,
    marge,
    margePerdue: Math.round(refuseesEnPlus * marge),
    annees,
    ponctualiteGardee: annees.baisser.resultatEnsuite - annees.garder.resultatEnsuite,
    ecartDeLAnnee: annees.baisser.resultatAnnee - annees.garder.resultatAnnee,
    meilleur,
  };
}

const LIBELLES: Record<ChoixPendantLaPanne, string> = {
  garder: "Le chargement prévu",
  baisser: "Au seuil",
  remplir: "Toutes les places",
};

export const COMBIEN_CHARGER_PENDANT_LA_PANNE: Situation = {
  code: "combien-charger-pendant-la-panne",
  parcours: "logistique",
  palier: 1,
  blocs: [],
  reprend: [LIVRER_A_TEMPS.code],
  commanditaire: "Le chef d'exploitation",
  titre: "Combien charger pendant la panne ?",
  accroche:
    "Le garage annonce une panne pour le trimestre. Garder le chargement prévu, le baisser pour protéger la ponctualité, ou remplir toutes les places qui restent : chiffrer ce que coûte chaque choix, et répondre au chef d'exploitation.",
  objectifs: [
    "Calculer la capacité d'une flotte pendant une panne",
    "Calculer le chargement qui reste sous le seuil de surchauffe",
    "Chiffrer la marge perdue en refusant des clients de plus",
    "Comparer les années rejouées, et répondre au chef d'exploitation",
  ],
  libre: false,
  entreprises: LIVRER_A_TEMPS.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du chef d'exploitation",
      texte: (c) => {
        const k = chargementPendantLaPanne(c);
        return [
          `« Le garage vient d'appeler : au trimestre ${T}, la flotte perdra ${k.baisseDeDisponibilite} % de sa disponibilité. J'avais prévu de charger ${qte(k.prevu)} ${c.unites}. Au-dessus de ${k.seuil} % de la capacité, nos livraisons se dégradent et les clients s'en souviennent. Faut-il baisser le chargement pour rester à ${k.seuil} %, quitte à refuser des clients ? Ou au contraire remplir toutes les places qui restent ? »`,
          `Pas de cours cette fois : vous avez les chiffres du trimestre. L'arène a rejoué l'année trois fois avec la panne, une fois par chargement.`,
        ];
      },
      tableau: (c) => {
        const k = chargementPendantLaPanne(c);
        return {
          titre: `Le trimestre ${T} de ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Capacité de la flotte sans panne (${c.unites})`, valeurs: [qte(k.capacite)] },
            { libelle: "Disponibilité perdue pendant la panne", valeurs: [pct(k.baisseDeDisponibilite)] },
            { libelle: `Demande des clients (${c.unites})`, valeurs: [qte(k.demande)] },
            { libelle: `Chargement prévu (${c.unites})`, valeurs: [qte(k.prevu)] },
            { libelle: `Marge d'une ${c.unite}`, valeurs: [eur(k.marge)] },
          ],
        };
      },
      repere: () => "À rendre : la capacité pendant la panne, ce que coûte de charger moins, et votre réponse.",
    },
    {
      id: "flotte",
      type: "montants",
      titre: "La flotte pendant la panne",
      notions: ["capacity"],
      question: (c) => {
        const k = chargementPendantLaPanne(c);
        return `Calculez la capacité de la flotte pendant la panne, puis le chargement le plus haut qui reste à ${k.seuil} % de cette capacité, en ${c.unites}.`;
      },
      champs: (c) => {
        const k = chargementPendantLaPanne(c);
        return [
          {
            libelle: `Capacité pendant la panne (${c.unites})`,
            attendu: k.capacitePendantLaPanne,
            calcul: `${qte(k.capacite)} × (100 % − ${k.baisseDeDisponibilite} %) = ${qte(k.capacitePendantLaPanne)}`,
            tolerance: 1,
          },
          {
            libelle: `Chargement à ${k.seuil} % de la capacité (${c.unites})`,
            attendu: k.auSeuil,
            calcul: `${qte(k.capacitePendantLaPanne)} × ${k.seuil} % = ${qte(k.auSeuil)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = chargementPendantLaPanne(c);
        return [
          `Le chargement prévu, ${qte(k.prevu)} ${c.unites}, occupe ${pct(k.partPrevue)} de la capacité pendant la panne : ${k.partPrevue > k.seuil ? "au-dessus" : "en dessous"} de ${k.seuil} %. Il reste ${qte(k.placesRestantes)} places libres.`,
        ];
      },
    },
    {
      id: "charger-moins",
      type: "montants",
      titre: "Ce que coûte de charger moins",
      notions: ["contribution_margin"],
      question: (c) => {
        const k = chargementPendantLaPanne(c);
        return `Baisser le chargement de ${qte(k.prevu)} à ${qte(k.auSeuil)} ${c.unites}, c'est refuser des clients de plus. Combien de ${c.unites} de plus seraient refusées, et quelle marge perdrait-on au trimestre ${T} ?`;
      },
      champs: (c) => {
        const k = chargementPendantLaPanne(c);
        return [
          { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} refusées en plus`, attendu: k.refuseesEnPlus, calcul: `${qte(k.prevu)} − ${qte(k.auSeuil)} = ${qte(k.refuseesEnPlus)}`, tolerance: 1 },
          { libelle: `Marge perdue au trimestre ${T}`, attendu: k.margePerdue, calcul: `${qte(k.refuseesEnPlus)} × ${eur(k.marge)} = ${eur(k.margePerdue)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = chargementPendantLaPanne(c);
        return [`Garder la ponctualité coûte ${eur(k.margePerdue)} de marge tout de suite. Reste à savoir ce qu'elle rapporte ensuite : c'est l'arène qui le dit.`];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "Les trois années rejouées",
      notions: ["capacity", "demand_market_share"],
      tableau: (c) => {
        const k = chargementPendantLaPanne(c);
        const ordre: ChoixPendantLaPanne[] = ["baisser", "garder", "remplir"];
        return {
          titre: `L'année de ${c.entreprise}, avec la panne au trimestre ${T}`,
          colonnes: ordre.map((x) => LIBELLES[x]),
          lignes: [
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} chargées au trimestre ${T}`, valeurs: ordre.map((x) => qte(k.annees[x].plan)) },
            { libelle: "Part de la capacité chargée", valeurs: ordre.map((x) => pct(k.annees[x].part)) },
            { libelle: `Résultat d'exploitation du trimestre ${T}`, valeurs: ordre.map((x) => eur(k.annees[x].resultatT)) },
            { libelle: "Demande des clients sur les trimestres suivants", valeurs: ordre.map((x) => qte(k.annees[x].demandeEnsuite)) },
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} chargées les trimestres suivants`, valeurs: ordre.map((x) => qte(k.annees[x].chargeesEnsuite)) },
            { libelle: "Résultat d'exploitation des trimestres suivants", valeurs: ordre.map((x) => eur(k.annees[x].resultatEnsuite)) },
            { libelle: "Résultat d'exploitation de l'année", valeurs: ordre.map((x) => eur(k.annees[x].resultatAnnee)) },
          ],
        };
      },
      question: () =>
        "D'après le tableau, calculez l'écart de résultat des trimestres suivants entre le chargement au seuil et le chargement prévu, puis l'écart de résultat de toute l'année entre les deux.",
      champs: (c) => {
        const k = chargementPendantLaPanne(c);
        const a = k.annees;
        return [
          {
            libelle: "Écart des trimestres suivants, au seuil",
            attendu: k.ponctualiteGardee,
            calcul: `${eur(a.baisser.resultatEnsuite)} − ${retranche(a.garder.resultatEnsuite)} = ${eur(k.ponctualiteGardee)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de résultat de l'année, au seuil",
            attendu: k.ecartDeLAnnee,
            calcul: `${eur(a.baisser.resultatAnnee)} − ${retranche(a.garder.resultatAnnee)} = ${eur(k.ecartDeLAnnee)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = chargementPendantLaPanne(c);
        const a = k.annees;
        if (k.ponctualiteGardee >= 0)
          return [
            k.ecartDeLAnnee < 0
              ? `Au seuil, la ponctualité gardée rapporte ${eur(k.ponctualiteGardee)} ensuite, mais les clients refusés au trimestre ${T} coûtent plus : l'année perd ${eur(-k.ecartDeLAnnee)}.`
              : `Au seuil, la ponctualité gardée rapporte ${eur(k.ponctualiteGardee)} ensuite, plus que les clients refusés au trimestre ${T} : l'année gagne ${eur(k.ecartDeLAnnee)}.`,
          ];
        const demandeEnPlus = a.baisser.demandeEnsuite - a.garder.demandeEnsuite;
        const chargeesEnMoins = a.garder.chargeesEnsuite - a.baisser.chargeesEnsuite;
        const chargeesEnPlus = -chargeesEnMoins;
        return [
          demandeEnPlus > 0
            ? `Au seuil, la qualité de service tient : les clients demandent ${qte(demandeEnPlus)} ${c.unites} de plus les trimestres suivants.${a.baisser.refuseEnsuite ? ` Mais ${c.entreprise} y refuse déjà des clients : cette demande en plus ne se charge pas.` : ""}`
            : "",
          chargeesEnMoins > 0
            ? `Les trimestres suivants, la gestion en charge ${qte(chargeesEnMoins)} de moins qu'avec le chargement prévu.`
            : chargeesEnPlus > 0
              ? `Les trimestres suivants, la gestion en charge ${qte(chargeesEnPlus)} de plus qu'avec le chargement prévu.`
              : "",
          k.ecartDeLAnnee < 0
            ? `Au seuil, les trimestres suivants perdent ${eur(-k.ponctualiteGardee)}, et l'année ${eur(-k.ecartDeLAnnee)}.`
            : `Au seuil, les trimestres suivants perdent ${eur(-k.ponctualiteGardee)}, mais l'année gagne ${eur(k.ecartDeLAnnee)}.`,
        ].filter((x) => x !== "");
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au chef d'exploitation",
      notions: ["capacity"],
      question: () => "Quelle réponse envoyez-vous au chef d'exploitation ?",
      options: (c) => {
        const k = chargementPendantLaPanne(c);
        const a = k.annees;
        const lu = `Sur l'année, l'arène compte ${eur(a.garder.resultatAnnee)} de résultat d'exploitation avec le chargement prévu, ${eur(a.baisser.resultatAnnee)} au seuil, ${eur(a.remplir.resultatAnnee)} en remplissant toutes les places.`;
        const pourquoi: Record<ChoixPendantLaPanne, string> = {
          garder: "Le chargement prévu fait le meilleur compte : la ponctualité perdue coûte moins que des clients refusés, et remplir les dernières places la dégrade un peu plus.",
          baisser: "Le chargement au seuil fait le meilleur compte : la ponctualité gardée rapporte plus, ensuite, que les clients refusés tout de suite.",
          remplir:
            a.remplir.resultatEnsuite >= a.garder.resultatEnsuite && a.remplir.refuseEnsuite
              ? `Remplir toutes les places fait le meilleur compte : chaque ${c.unite} de plus rapporte sa marge tout de suite, et les trimestres suivants n'y perdent rien, ${eur(a.remplir.resultatEnsuite)} contre ${eur(a.garder.resultatEnsuite)} : la flotte y refuse déjà des clients, et la demande perdue avec la ponctualité ne se serait pas chargée.`
              : `Remplir toutes les places fait le meilleur compte : chaque ${c.unite} de plus rapporte sa marge tout de suite, et la ponctualité perdue coûte moins ensuite. Protéger la ponctualité a un prix : ici, des clients refusés qui valent plus qu'elle.`,
        };
        return [
          {
            texte: `Garder les ${qte(k.prevu)} ${c.unites} déjà prévues`,
            juste: k.meilleur === "garder",
            retour: k.meilleur === "garder" ? `Oui. ${lu} ${pourquoi.garder}` : `Non. ${lu} ${pourquoi[k.meilleur]}`,
          },
          {
            texte: `Baisser le chargement à ${qte(k.auSeuil)} ${c.unites}`,
            juste: k.meilleur === "baisser",
            retour: k.meilleur === "baisser" ? `Oui. ${lu} ${pourquoi.baisser}` : `Non. ${lu} ${pourquoi[k.meilleur]}`,
          },
          {
            texte: `Remplir les ${qte(k.capacitePendantLaPanne)} places de la flotte`,
            juste: k.meilleur === "remplir",
            retour: k.meilleur === "remplir" ? `Oui. ${lu} ${pourquoi.remplir}` : `Non. ${lu} ${pourquoi[k.meilleur]}`,
          },
        ];
      },
    },
  ],
};
