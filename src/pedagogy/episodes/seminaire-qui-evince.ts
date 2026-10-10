/**
 * ÉPISODE 50 — LE SÉMINAIRE QUI CHASSE LES CLIENTS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Anton montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de
 * lui.
 *
 * Le tableau de bord est celui d'un hôtel : la contribution cumulée face au
 * budget, le taux d'occupation, le prix moyen et le RevPAR de la semaine, et
 * les chambres de groupe restées vides sans être payées. Il ne montre pas le
 * déplacement : c'est au joueur de le calculer, comme au bureau.
 */
import {
  CHAMBRES,
  CONVENTION,
  D,
  DEMANDES,
  DEPLACEMENT_SEMINAIRE,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PRIX_MOYEN,
  REVELATION,
  SCENARIOS,
  STATUTS_CONVENTION,
  STATUTS_SEMINAIRE,
  STATUTS_SERIE,
  contributionConvention,
  deplacementPrevu,
  evenements,
  hasard,
  plancher,
  privatisationPrevue,
  reponseSeminaire,
  simuler,
  statutConvention,
  statutSeminaire,
  statutSigne,
  tableauDeBord,
  valeurDeLaSerie,
  valeurIndividuelle,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/seminaire-qui-evince";
import {
  ALIENOR,
  COSIMA,
  DIAGNOSTICS,
  ETAPES,
  LUCILE,
  OSKAR,
  REFERENCES,
  REFLEXES,
  REPONSES,
  TSIORY,
  ZUZANA,
} from "@/config/episodes/seminaire-qui-evince";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** La contribution que le siège attend de L'Escale Évian, de mai à juillet. */
export const BUDGET = 1_140_000;
/** Le RevPAR de juin inscrit au budget. */
export const REVPAR_JUIN = 200;
/** Les chambres de groupe vides et non payées qu'un trimestre bien tenu ne dépasse pas, en nuitées. */
export const PLAFOND_VIDES = 30;

/** La valeur des individuels que le séminaire évincerait en juin, en k€ : ce que la semaine 1 demande. */
export const DEPLACEMENT_EN_KE = DEPLACEMENT_SEMINAIRE / 1000;

/** Un montant signé : « +5 k€ », « −7 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const nuitees = (v: number) => `${nombre(v, 0)} nuitée${Math.round(v) >= 2 ? "s" : ""}`;

/** Les dates d'un groupe, en toutes lettres : « du 16 au 18 juin ». */
const DATES_JUIN = "du 16 au 18 juin";
const DATES_MAI = "du 26 au 28 mai";

/** Le prix de déplacement de chaque demande de juillet, tel que la source le donne. */
export function textePlanchers(avecSerie: boolean): string {
  const noms = [
    "le club de cyclotourisme",
    "le comité de direction genevois",
    "la chorale",
    "les golfeurs",
    "l'entreprise lyonnaise",
  ];
  return DEMANDES.map(
    (g, k) => `${noms[k]}, ${Math.round(plancher(k, avecSerie))} € (il propose ${g.prix} €)`,
  ).join(" ; ");
}

/** Ce que les décisions révèlent, dans l'ordre où un vendeur de groupes les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de chiffrer les clients que le séminaire chassait",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    deplacement:
      "Votre diagnostic de la semaine 1 était juste : un groupe se jugeait sur sa contribution totale moins celle des clients individuels qu'il évinçait, et se protégeait par ses clauses.",
    attrition:
      "En semaine 1, vous avez vu l'attrition : une vraie partie du problème, mais pas la principale. Même plein, le séminaire de juin chassait presque autant de marge qu'il en apportait.",
    remplissage:
      "En semaine 1, vous avez vu un hôtel plein ; mais en juin, les 55 chambres d'Orvandel ne remplissaient que des chambres que des clients individuels auraient payées plus cher.",
    prix: "En semaine 1, vous avez jugé le séminaire sur son prix chambre ; un groupe sous le prix moyen peut valoir beaucoup par ses salles et sa restauration, ou sur des dates creuses.",
  };
  const justes = ["deplacement", "attrition"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En semaine 2, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En semaine 2, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En semaine 2, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "deplacement" ? 1 : d === "attrition" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais jugé un groupe sur ce qu'il remplissait ni sur son seul prix chambre, et vous n'avez jamais laissé dormir des chambres qu'un client annonçait vides."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : signer pour remplir, refuser sur le seul prix chambre, signer le contrat de l'agence pour ne fâcher personne, tenir un bloc que le client annonçait vide.${
            t.netGroupes < 0
              ? ` Vos groupes ont coûté ${kE(-t.netGroupes)} de plus que les clients individuels qu'ils ont chassés.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    DEPLACEMENT_EN_KE,
    "de marge des clients individuels que le séminaire évinçait en juin",
    "k€",
    { juste: 1.5, proche: 4 },
    (e) => `${nombre(e, 1)} k€`,
  );

  // Le constat du métier : le déplacement compté, et les clauses qui protègent.
  const compte =
    (p.chemin[D.seminaire] === 1 ? 1 : 0) +
    (p.chemin[D.convention] === 1 ? 1 : 0) +
    (p.chemin[D.grille] === 1 ? 1 : 0);
  const protege = (p.chemin[D.contrat] === 1 ? 1 : 0) + (p.chemin[D.signal] === 1 ? 1 : 0);
  const score = compte === 3 && protege === 2 ? 1 : compte >= 2 && protege >= 1 ? 0.6 : 0;
  const metier: Constat = {
    score,
    texte: `${
      compte === 3
        ? "Vous avez jugé chaque groupe sur sa contribution totale, déplacement déduit : les dates creuses pour Orvandel, les salles et le gala de Mélizane, un prix par date en juillet."
        : compte === 0
          ? "Vous n'avez jamais mis en face d'un groupe les clients individuels qu'il chassait, ni ce que ses salles et sa restauration rapportaient."
          : "Vous avez compté le déplacement pour une partie des groupes seulement."
    } ${
      protege === 2
        ? "Vos clauses et la reprise rapide des chambres libérées ont limité les chambres vides"
        : protege === 1
          ? "Vos contrats n'ont protégé qu'une partie de l'attrition"
          : "Sans clauses ni reprise des chambres annoncées libres, l'attrition est restée à la charge de l'hôtel"
    } : ${nuitees(t.vides)} de groupe vides et non payées sur le trimestre. Les groupes, déplacement déduit : ${kES(t.netGroupes)}.`,
  };

  return [information, diagnostic, reflexe, calibrage, metier];
}

export function axe([information, diagnostic, reflexe, calibrage, metier]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Compter les clients que le groupe chasse",
      texte:
        "Rejouez l'épisode en lisant d'abord la prévision d'occupation et ce que rapporte une nuitée : 55 chambres en juin évinçaient plus de 140 nuitées individuelles, à 232 € et avec leurs dîners.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Juger un groupe sur sa contribution nette",
      texte:
        "Un groupe ne vaut ni ce qu'il remplit, ni son prix chambre : il vaut ses chambres, ses salles et sa restauration, moins les clients individuels qu'il chasse. Faites le calcul nuit par nuit avant de signer, et protégez-vous de ce qu'il ne prendra pas.",
    };
  }
  if (metier!.score === 0) {
    return {
      titre: "Se protéger de ce que le groupe ne prendra pas",
      texte:
        "Un groupe réserve plus qu'il n'occupe, et la chambre est périssable : une date limite de libération la remet en vente à temps, une clause d'attrition fait payer ce qui est rendu trop tard, un acompte couvre l'annulation. Et une chambre annoncée libre se revend tout de suite.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Voir le déplacement derrière le remplissage",
      texte:
        "Un hôtel plein n'est pas un hôtel qui gagne : quand la demande individuelle est forte, un groupe à prix négocié prend la place de clients qui payaient plus. Les mêmes chambres valent bien plus sur des dates creuses.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du déplacement",
      texte:
        "Posez-le nuit par nuit : les chambres individuelles prévues au-delà de ce que le groupe laisse libre, fois le prix moyen moins la commission des plateformes et le coût variable, plus la marge des dîners.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const parSemaine = (t: Trimestre, de: number, a: number) =>
  t.semaines.slice(de, a + 1) as Semaine[];

export const EPISODE_SEMINAIRE: Episode<Trimestre> = {
  code: "seminaire-qui-evince",
  numero: 50,
  domaine: "Groupes et séminaires",
  titre: "Le séminaire qui chasse les clients",
  resume:
    "Un séminaire de 55 chambres en juin, quand l'hôtel se remplit déjà de clients individuels. Juger un groupe sur sa contribution nette, et se protéger de ce qu'il ne prendra pas.",
  persona:
    "Vous êtes Anton Leclercq, responsable des ventes groupes et séminaires d'Escale Événements, basé à L'Escale Évian : un quatre-étoiles de 66 chambres sur le lac Léman, trois salles de séminaire et une Table d'Augustin. Vous négociez avec les entreprises et les agences, sous l'œil d'Aliénor Duchosal, la directrice de l'hôtel. Le trimestre court de mai à juillet, avant le cœur de l'été.",
  mandat: [
    {
      fort: `${CHAMBRES} chambres`,
      texte: "un quatre-étoiles sur le lac, trois salles, une Table d'Augustin",
    },
    { fort: kE(BUDGET), texte: "de contribution attendue de mai à juillet" },
    {
      fort: euros(PRIX_MOYEN[1]),
      texte: `de prix moyen prévu en juin, ${euros(PRIX_MOYEN[2])} en juillet`,
    },
    { fort: "17 %", texte: "de commission sur les nuitées vendues par Bookalia et Voyagio" },
  ],
  jugement:
    "La directrice et le siège jugent le trimestre sur la contribution de L'Escale Évian : la marge sur coûts variables de l'hébergement, de la restauration et des salles, de mai à juillet, groupes et clients individuels confondus.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "L'Escale Évian",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les petites demandes de groupes de mai attendent leur réponse et partent chez les concurrents.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...ALIENOR,
        alerte: true,
        texte: `Pendant ce temps, deux petits groupes de mai sont restés sans réponse et ont signé au Palais Ombrelle : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle:
      "la valeur des clients individuels que le séminaire évincerait sur ses trois nuits de juin : leur marge sur coûts variables, chambres et dîners, commissions déduites, en milliers d'euros",
    unite: "k€",
    placeholder: "20",
    min: 0,
    max: 200,
    step: 0.1,
    reel: () => DEPLACEMENT_EN_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({
    ...tableauDeBord(decisions, graine, j, semaine, BUDGET),
  }),
  indicateurs: [
    {
      cle: "cumul",
      nom: "Contribution cumulée",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)}`
          : `${kE(BUDGET)} attendus de mai à juillet`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.cumul ?? 0) / BUDGET),
              enRetard: (l.cumul ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "to",
      nom: "Taux d'occupation",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: (semaine) => (semaine ? `semaine ${semaine}, groupes compris` : "la semaine dernière"),
    },
    {
      cle: "pm",
      nom: "Prix moyen",
      format: euros,
      sensBon: 1,
      aide: () => "des chambres occupées, groupes compris",
    },
    {
      cle: "revpar",
      nom: "RevPAR",
      format: euros,
      sensBon: 1,
      aide: () => "recette hébergement par chambre disponible : TO × PM",
    },
    {
      cle: "vides",
      nom: "Chambres de groupe vides",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "nuitées bloquées, ni occupées, ni revendues, ni payées, depuis le 4 mai",
    },
  ],
  contexte(l, decisions): Contexte {
    const avecSerie = (l.serie ?? 0) === STATUTS_SERIE.indexOf("signee");
    const code = l.seminaire ?? -1;
    const seminaire = code >= 0 ? STATUTS_SEMINAIRE[code]! : "";
    const libres = l.liberees ?? 0;
    const scenario = l.scenario ?? -1;
    return {
      seminaire,
      datesSeminaire:
        seminaire === "mai"
          ? DATES_MAI
          : seminaire === "" || seminaire === "decline"
            ? ""
            : DATES_JUIN,
      convention: STATUTS_CONVENTION[l.convention ?? 0] ?? "",
      serie: STATUTS_SERIE[l.serie ?? 0] ?? "",
      serieSignee: avecSerie,
      conditions: l.conditions ?? decisions[D.contrat] ?? 0,
      liberees: `${nombre(libres, 0)} chambre${Math.round(libres) >= 2 ? "s" : ""}`,
      peuDeLiberees: libres < 3,
      ete: scenario >= 0 ? REPONSES.ete[scenario]! : "",
      cumul: kE(l.cumul ?? 0),
      to: taux(l.to ?? 0, 0),
      deplacementConvention: kE(deplacementPrevu(CONVENTION.nuits, CONVENTION.chambres)),
      chambresConvention: kE(contributionConvention("complete").chambres),
      privatisation: kE(privatisationPrevue(CHAMBRES - CONVENTION.chambres)),
      serieMou: kE(valeurDeLaSerie(2)),
      serieConforme: kE(-valeurDeLaSerie(1)),
      serieFort: kE(-valeurDeLaSerie(0)),
      valeurJuillet: euros(valeurIndividuelle(PRIX_MOYEN[2])),
      planchers: textePlanchers(avecSerie),
    };
  },
  recap(t, de, a) {
    const semaines = parSemaine(t, de, a);
    const n = semaines.length;
    return [
      [`Taux d'occupation, sem. ${de}–${a}`, taux(semaines.reduce((s, w) => s + w.to, 0) / n, 0)],
      [`RevPAR, sem. ${de}–${a}`, euros(semaines.reduce((s, w) => s + w.revpar, 0) / n)],
      ["Contribution de la période", kE(semaines.reduce((s, w) => s + w.contribution, 0))],
    ];
  },
  courbe: {
    titre: "Contribution de la semaine",
    cle: "contribution",
    cible: BUDGET / 13,
    libelleCible: `cadence moyenne du budget : ${kE(BUDGET / 13)} par semaine`,
    graduations: [40000, 70000, 100000, 130000],
    format: kE,
    details: (s) => [
      `contribution ${kE(s.contribution!)} · TO ${taux(s.to!, 0)}`,
      `prix moyen ${euros(s.pm!)} · RevPAR ${euros(s.revpar!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.seminaire && (choix === 1 || choix === 2)) {
      // Orvandel répond à la contre-proposition selon le hasard du trimestre.
      const r = reponseSeminaire(choix, graine);
      const texte =
        choix === 1
          ? r === "mai"
            ? REPONSES.seminaireMai
            : r === "juinPrixPlein"
              ? REPONSES.seminaireJuin
              : REPONSES.seminaireAilleurs
          : r === "partenaire"
            ? REPONSES.partenaire
            : REPONSES.partenaireRefus;
      return [{ ...COSIMA, texte }];
    }
    if (etape === D.convention && choix === 2) {
      const accepte = statutConvention([0, 0, 2], graine) === "reduite";
      return [{ ...TSIORY, texte: accepte ? REPONSES.reduitAccepte : REPONSES.reduitRefuse }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    if (arrive.refusGarantie) {
      lies.push({ ...COSIMA, heure: "sem. 2", alerte: true, texte: REPONSES.garantieRefus });
    }
    if (arrive.annulation) {
      lies.push({ ...COSIMA, heure: "sem. 3", alerte: true, texte: REPONSES.annulation });
    }
    // Le séminaire se tient : ce qu'il a vraiment occupé.
    const signe = statutSigne(chemin, graine);
    const tenu = statutSeminaire(chemin, graine);
    const semaineDuSeminaire = signe === "mai" ? 4 : 7;
    if (
      (tenu === "juin" || tenu === "mai" || tenu === "juinPrixPlein" || tenu === "partenaire") &&
      dans(semaineDuSeminaire)
    ) {
      const bloc = tenu === "partenaire" ? 30 : 55;
      const occupees = Math.min(bloc, 55 * h.occupationSeminaire);
      lies.push({
        ...COSIMA,
        heure: `sem. ${semaineDuSeminaire}`,
        texte: `Le séminaire d'Orvandel s'est tenu ${tenu === "mai" ? DATES_MAI : DATES_JUIN} : ${nombre(occupees, 0)} chambres occupées sur les ${bloc} bloquées. Merci pour l'accueil.`,
      });
    }
    // La convention : un refus de garantie, ou ce que l'hôtel a fait des chambres libérées.
    const d3 = chemin[D.convention];
    if (d3 !== 0 && chemin[D.contrat] === 2 && t.convention === "ailleurs" && dans(4)) {
      if (!(d3 === 2 && h.uReduit >= CONVENTION.accepteReduit)) {
        lies.push({ ...TSIORY, heure: "sem. 4", alerte: true, texte: REPONSES.conventionGarantie });
      }
    }
    if (
      (t.convention === "complete" || t.convention === "reduite" || t.convention === "sansGala") &&
      dans(10)
    ) {
      const d5 = chemin[D.signal];
      lies.push({
        de: "Léonie Combaz",
        role: "Cheffe de réception",
        heure: "sem. 10",
        texte:
          d5 === 1
            ? `La convention Mélizane s'est tenue. Les ${nombre(t.liberees, 0)} chambres reprises à J-17 sont presque toutes reparties chez des clients individuels.`
            : d5 === 2
              ? `La convention Mélizane s'est tenue. Les ${nombre(t.liberees, 0)} chambres absentes de la liste nominative sont reparties en partie : à dix jours, il restait moins de clients à servir.`
              : chemin[D.contrat] === 0
                ? `La convention Mélizane s'est tenue. Mélizane a rendu ses ${nombre(t.liberees, 0)} chambres libres à J-7, sans frais : nous n'en avons revendu qu'une poignée.`
                : `La convention Mélizane s'est tenue. Les ${nombre(t.liberees, 0)} chambres libres sont restées vides ; Mélizane paiera ce que prévoit le contrat.`,
      });
    }
    // La série : l'analyse, puis la réponse de Tavenne, ou son refus de la garantie totale.
    if (arrive.tavennePart) {
      lies.push({ ...OSKAR, heure: "sem. 6", alerte: true, texte: REPONSES.tavennePart });
    } else if (arrive.analyse) {
      lies.push({
        ...LUCILE,
        heure: "sem. 6",
        texte: t.analyse ? REPONSES.analyseBaisse : REPONSES.analyseReport,
      });
      if (t.serie !== "refusGarantie") {
        lies.push({
          ...OSKAR,
          heure: "sem. 6",
          texte: t.analyse ? REPONSES.tavenneSigne : REPONSES.tavenneRefuse,
        });
      }
    }
    if (t.serie === "refusGarantie" && dans(6)) {
      lies.push({ ...OSKAR, heure: "sem. 6", alerte: true, texte: REPONSES.serieGarantie });
    }
    // Les groupes de fin juillet.
    if (arrive.demandes && chemin[D.grille] !== 2) {
      const signes = t.demandes.filter((x) => x !== null).length;
      const plusChers = t.demandes.filter((x, k) => x !== null && x > DEMANDES[k]!.prix).length;
      lies.push({
        ...ZUZANA,
        heure: "sem. 10",
        texte:
          chemin[D.grille] === 0
            ? "Les cinq groupes de fin juillet ont signé à 150 € la chambre. Le comité de direction genevois, qui proposait 190 €, n'a pas protesté."
            : `Sur les cinq demandes de fin juillet, ${signes} ont signé${
                plusChers ? `, dont ${plusChers} au prix de déplacement` : ""
              } ; les autres sont parties ailleurs.`,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.revelation) {
      imprevus.push({ ...LUCILE, heure: `sem. ${REVELATION}`, texte: REPONSES.ete[t.scenario]! });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= BUDGET
        ? `${kE(t.objectif)} de contribution, ${kE(t.objectif - BUDGET)} au-dessus du budget`
        : `${kE(t.objectif)} de contribution, ${kE(BUDGET - t.objectif)} sous le budget`,
    formatObjectif: kE,
    noteDesBarres:
      "Contribution de L'Escale Évian de mai à juillet : la marge sur coûts variables de l'hébergement, de la restauration et des salles, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Contribution",
          valeur: kE(t.objectif),
          aide: `de mai à juillet ; budget ${kE(BUDGET)}`,
          tenu: t.objectif >= BUDGET,
        },
        {
          nom: "Groupes, déplacement déduit",
          valeur: kES(t.netGroupes),
          aide: `leur marge, moins celle des ${nuitees(t.evinces)} individuelles évincées`,
          tenu: t.netGroupes >= 0,
        },
        {
          nom: "RevPAR de juin",
          valeur: euros(t.revparJuin),
          aide: `TO de juin ${taux(t.toJuin, 0)} ; budget ${euros(REVPAR_JUIN)}`,
          tenu: t.revparJuin >= REVPAR_JUIN,
        },
        {
          nom: "Chambres de groupe vides",
          valeur: nombre(t.vides, 0),
          aide: `nuitées ni occupées, ni revendues, ni payées ; plafond ${PLAFOND_VIDES}`,
          tenu: t.vides <= PLAFOND_VIDES,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const signe = statutSigne(t.chemin, graine);
      const seminaire =
        t.seminaire === "decline"
          ? "Vous avez décliné : Orvandel a tenu son séminaire au Palais Ombrelle."
          : t.seminaire === "ailleurs"
            ? "Orvandel a refusé votre contre-proposition et signé au Palais Ombrelle."
            : t.seminaire === "refusGarantie"
              ? "Orvandel a refusé la garantie totale et signé au Palais Ombrelle."
              : t.seminaire === "annule"
                ? "Orvandel a reporté son séminaire à l'automne, en semaine 3 ; l'acompte est resté acquis."
                : `Le séminaire s'est tenu ${signe === "mai" ? DATES_MAI : DATES_JUIN}${
                    t.seminaire === "juinPrixPlein"
                      ? ", à 228 € la chambre"
                      : t.seminaire === "partenaire"
                        ? ", avec 30 chambres chez vous"
                        : ""
                  } : ${taux(h.occupationSeminaire, 0)} des participants attendus sont venus.`;
      const serie =
        t.serie === "signee"
          ? "Tavenne a occupé 24 chambres chaque nuit du 9 au 29 juillet."
          : t.serie === "partie"
            ? "Tavenne n'a pas attendu l'analyse : il a signé à Thonon."
            : t.serie === "analyseContre"
              ? "L'analyse du pick-up a conclu que la demande tiendrait : vous avez laissé la série à Thonon."
              : t.serie === "refusGarantie"
                ? "Tavenne a refusé la garantie totale et signé à Thonon."
                : "Vous avez refusé la série : Tavenne a signé à Thonon.";
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "L'été",
          texte: `${SCENARIOS[t.scenario]!.nom} : ${REPONSES.ete[t.scenario]!.split(" : ").slice(1).join(" : ")}`,
        },
        { titre: "Orvandel", texte: seminaire },
        {
          titre: "Mélizane",
          texte:
            t.convention === "refusee"
              ? "Vous avez refusé la convention : elle s'est tenue à Montreux."
              : t.convention === "ailleurs"
                ? "Mélizane a emmené sa convention à Montreux."
                : `La réorganisation de son réseau a libéré ${nombre(t.liberees, 0)} chambres sur ${
                    t.convention === "reduite" ? CONVENTION.reduit : CONVENTION.chambres
                  }.`,
        },
        { titre: "Tavenne", texte: serie },
      ];
    },
  },
  comportements,
  axe,
};
