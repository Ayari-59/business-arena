/**
 * ÉPISODE 105 — LE PIC DES FÊTES, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord des lignes desserts de Maëwenn
 * montre, ce que la courbe trace, ce sur quoi le bilan la juge, et ce que ses
 * décisions révèlent d'elle.
 */
import {
  COMMANDE,
  COMMANDE_TARDIVE,
  D,
  HEURES_BASE,
  JOURS_SANS_PERTE,
  NEUTRE,
  O,
  PERTE_PAR_JOUR,
  RECRUTEMENT,
  avisFavorable,
  evenements,
  hasard,
  interimairesPourvus,
  partTenue,
  simuler,
  tableauDeBord,
  volontaires,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/pic-des-fetes";
import {
  DIAGNOSTICS,
  ETAPES,
  PERSONNES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  renfortDeNoel,
} from "@/config/episodes/pic-des-fetes";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const heures = (v: number) => `${nombre(v, 0)} h`;
const pots = (v: number) => `${nombre(v, 0)} pots`;
/** Le repère des pénalités et ventes perdues du trimestre, pour la tuile du bilan. */
export const REPERE_RUPTURES = 40000;
/** Le taux de service exigé par les enseignes. */
export const SERVICE_EXIGE = 0.985;

const { PATERNE, KRISTELL, THECLE, NAIM, TAHAR, ANNAIG, RADIA } = PERSONNES;

/** Ce que les décisions révèlent, dans l'ordre où une DRH d'usine les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les prévisions de ventes et la fiche des lignes qui permettaient de compter les heures",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    heures:
      "Votre diagnostic de la semaine 1 était juste : il manquait 130 heures de ligne par semaine au pic, et la DLC interdisait de les produire d'avance. Il fallait trouver de la capacité humaine, et tôt.",
    interim:
      "En semaine 1, vous avez vu les départs d'intérimaires : une vraie cause, mais une suite plus qu'une origine. Ils partaient parce qu'on les appelait au dernier moment, sans formation ni tuteur ; et même fidèles, ils ne faisaient pas à eux seuls les 130 heures qui manquaient.",
    stock:
      "En semaine 1, vous avez retenu le stock ; mais un dessert frais doit quitter l'usine au plus huit jours après sa fabrication. Ce qu'on produit en octobre, les centrales le refusent en décembre.",
    trs: "En semaine 1, vous avez retenu le TRS des lignes ; même porté à 75 %, il laissait près de 85 heures de ligne à trouver chaque semaine au pic.",
  };
  const justes = ["heures", "interim"];
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
    score: d === "heures" ? 1 : d === "interim" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu au pic par le réflexe de l'usine : ni intérim au dernier moment, ni stock au-delà de ce que la DLC permet, ni heures imposées à tous."
        : `Sous la pression du pic, vous avez choisi ${n} fois sur ${ETAPES.length} décisions le réflexe de l'usine : appeler l'intérim au dernier moment, produire d'avance au-delà de huit jours, ou imposer des heures à tous.${
            t.casse > 0 ? ` ${kE(t.casse)} de desserts ont été refusés pour fraîcheur.` : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.besoinPic,
    "d'heures de ligne supplémentaires par semaine au pic",
    "heures",
    { juste: 5, proche: 20 },
    (e) => `${nombre(e, 0)} heure${e >= 2 ? "s" : ""}`,
  );

  // La capacité humaine : intérimaires tôt, temps de travail aménagé, week-end au volontariat, tutorat.
  const tot = p.chemin[D.interim] === O.interim.tot;
  const temps = p.chemin[D.temps] === O.temps.modulation;
  const weekend =
    p.chemin[D.weekend] === O.weekend.suppleance || p.chemin[D.weekend] === O.weekend.samedi;
  const tutorat = p.chemin[D.postes] === O.postes.tutorat;
  const leviers = [tot, temps, weekend, tutorat].filter(Boolean).length;
  const capacite: Constat = {
    score: leviers === 4 ? 1 : leviers >= 2 ? 0.6 : 0,
    texte: `${
      tot
        ? "Vous avez recruté les intérimaires en octobre et les avez formés avant le pic."
        : p.chemin[D.interim] === O.interim.sansFormation
          ? "Vous avez commandé les intérimaires tôt, mais les avez fait arriver le premier jour du pic, sans formation."
          : "Les intérimaires ont été appelés fin novembre, quand toutes les usines du bassin recrutaient."
    } ${
      temps
        ? "Vous avez utilisé l'accord de 2021 et décalé des congés au volontariat."
        : p.chemin[D.temps] === O.temps.refus
          ? "Vous avez refusé les congés de Noël : des heures gagnées, des arrêts et des volontaires perdus."
          : "Le temps de travail des permanents n'a pas été aménagé pour décembre."
    } ${
      weekend
        ? "Le week-end s'est ouvert au volontariat."
        : p.chemin[D.weekend] === O.weekend.imposer
          ? "Les samedis ont été imposés par note de service, sans le CSE."
          : "Les lignes sont restées fermées le week-end."
    } ${
      tutorat
        ? "Les intérimaires ont eu des postes simples et un tuteur."
        : "Les intérimaires n'ont eu ni tuteur ni postes adaptés."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, capacite];
}

export function axe([information, diagnostic, reflexe, calibrage, capacite]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Compter les heures avant de chercher des bras",
      texte:
        "Rejouez l'épisode en lisant d'abord les prévisions de ventes et la fiche des lignes : 1 260 000 pots par semaine à Noël, 4 500 pots par heure de ligne une fois le TRS compté, 150 heures déjà assurées. Il en manque 130 par semaine, et c'est de ce chiffre que tout se déduit.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Préparer la capacité tôt plutôt que l'imposer tard",
      texte:
        "Appeler l'agence fin novembre, stocker en octobre, imposer des heures à tous : chacun de ces gestes paraît prudent sous la pression, et chacun coûte. Les intérimaires tardifs sont rares, lents et partent ; le stock d'octobre est refusé pour fraîcheur ; les heures imposées reviennent en arrêts et en accidents.",
    };
  }
  if (capacite!.score === 0) {
    return {
      titre: "Combiner les leviers de la capacité humaine",
      texte:
        "Aucun levier ne fait seul les 130 heures : il faut des intérimaires recrutés tôt et encadrés, le temps de travail des permanents aménagé sur l'année, des congés décalés au volontariat et un week-end ouvert avec des volontaires.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Partir de ce que la DLC interdit",
      texte:
        "Un dessert frais doit quitter l'usine au plus huit jours après sa fabrication : le pic ne se stocke pas, il se produit la semaine même. Le problème est donc un nombre d'heures à trouver chez les personnes, semaine par semaine.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul des heures",
      texte:
        "1 260 000 pots divisés par 7 200 × 62,5 % = 4 500 pots par heure donnent 280 heures de ligne ; les équipes en 2×8 en assurent 150. Il en manque 130 par semaine, soit 780 heures de travail à six personnes par ligne.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** Ce que dit Trévélo Intérim de la commande, selon le moment où on l'a passée. */
function pointAgence(decisions: readonly number[], recrues: number, departs: number): string {
  const d1 = decisions[D.interim] ?? NEUTRE[D.interim];
  if (d1 === O.interim.tot) {
    return `J'ai ${recrues} personnes sur les ${COMMANDE} demandées pour le 9 novembre, toutes avec une expérience en agroalimentaire.${
      departs ? ` ${departs} sont parties depuis.` : ""
    }`;
  }
  if (d1 === O.interim.sansFormation) {
    return `Pour le 23 novembre, j'ai ${recrues} personnes sur les ${COMMANDE} demandées.${
      departs ? ` ${departs} sont déjà parties.` : ""
    }`;
  }
  return `Vous m'avez appelée cette semaine : j'ai ${recrues} personnes sur les ${COMMANDE_TARDIVE} demandées, elles commencent lundi. Les autres usines du bassin ont réservé leurs intérimaires en octobre.`;
}

const RH = THECLE;

export const EPISODE_PIC_FETES: Episode<Trimestre> = {
  code: "pic-des-fetes",
  numero: 105,
  domaine: "Dimensionner les équipes pour un pic saisonnier",
  titre: "Le pic des fêtes",
  resume:
    "Une laiterie dont les ventes de desserts doublent en décembre, sans pouvoir produire d'avance. Un pic de produits frais se prépare en heures de travail, pas en stock.",
  persona:
    "Vous êtes Maëwenn Postec, directrice des ressources humaines de la Laiterie de Kerbrélan, entreprise familiale de 520 salariés à Loudéac et Pontivy. Votre sujet : les lignes 5 et 6 de Loudéac, qui font les crèmes desserts et les riz au lait, et leurs 28 permanents en 2×8. Votre trimestre : octobre, novembre et décembre.",
  mandat: [
    { fort: "98,5 %", texte: "de taux de service exigé par les enseignes pendant les fêtes" },
    { fort: "1 260 000 pots", texte: "par semaine à livrer les deux semaines de Noël" },
    { fort: heures(HEURES_BASE), texte: "de ligne par semaine avec les équipes en place" },
    { fort: "Aucun", texte: "accident du travail" },
  ],
  jugement:
    "La direction générale juge le trimestre sur la marge des desserts livrés pendant le pic, moins les pénalités et les ventes perdues, la casse, les heures majorées, l'intérim, les accidents et les rebuts.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos lignes desserts",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les intérimaires les plus expérimentés du bassin signent ailleurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...KRISTELL,
        alerte: true,
        texte: `Pendant ce temps, deux de mes candidats les plus expérimentés ont signé chez un autre industriel du bassin. Les remplacer vous coûtera ${euros(perdu)} de plus.`,
      };
    },
  },
  prevision: {
    libelle:
      "les heures de ligne supplémentaires nécessaires par semaine au pic de décembre, au-delà de ce que font les équipes en place",
    unite: "h",
    placeholder: "0",
    min: 0,
    max: 1000,
    step: 1,
    reel: (t) => t.besoinPic,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "service",
      nom: "Taux de service",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `semaine ${semaine} ; exigé : 98,5 %` : "la semaine dernière ; exigé : 98,5 %",
    },
    {
      cle: "capacite",
      nom: "Heures de ligne disponibles",
      format: heures,
      sensBon: 1,
      aide: (semaine, l) =>
        `besoin ${semaine ? `de la semaine ${semaine}` : "d'une semaine d'octobre"} : ${heures(l.besoin ?? 0)}`,
      jauge: (l) =>
        l.besoin
          ? {
              part: Math.min(1, (l.capacite ?? 0) / l.besoin),
              enRetard: (l.capacite ?? 0) < l.besoin,
            }
          : null,
    },
    {
      cle: "interimaires",
      nom: "Intérimaires sur les lignes",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine, l) =>
        l.departs
          ? `${nombre(l.departs, 0)} partis depuis leur arrivée`
          : semaine && l.interimaires
            ? "aucun départ depuis leur arrivée"
            : "l'an dernier, 9 arrivés le 30 novembre",
    },
    {
      cle: "absenteisme",
      nom: "Absentéisme des permanents",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => "branche : 5,4 %",
    },
    {
      cle: "couts",
      nom: "Coûts du renfort",
      format: kE,
      sensBon: -1,
      aide: () => "intérim, heures majorées, casse, accidents, rebuts : cumulés",
    },
  ],
  contexte(l, decisions) {
    const recrues = l.recrues ?? 0;
    const departs = l.departs ?? 0;
    const d1 = decisions[D.interim] ?? NEUTRE[D.interim];
    const tardif = d1 === O.interim.finNovembre || d1 === O.interim.octobre;
    const libres = Math.max(0, l.libresSemaine7 ?? 0);
    const accidents = l.accidents ?? 0;
    return {
      service: taux(l.service ?? 0),
      capacite: heures(l.capacite ?? 0),
      besoin: heures(l.besoin ?? 0),
      absenteisme: taux(l.absenteisme ?? 0),
      interimaires: nombre(l.interimaires ?? 0, 0),
      libres: libres < 0.5 ? "aucune heure" : `${nombre(libres, 0)} heures`,
      volontaires: nombre(volontaires(decisions), 0),
      congesRefuses: decisions[D.temps] === O.temps.refus,
      agence:
        d1 === O.interim.tot
          ? `J'ai ${recrues} personnes confirmées sur les ${COMMANDE} demandées pour le 9 novembre. La formation est calée avec Erwann Tromeur.`
          : d1 === O.interim.sansFormation
            ? `Pour le 23 novembre, j'ai ${recrues} personnes confirmées sur les ${COMMANDE} demandées. Je continue de chercher.`
            : "Vous me rappelez fin novembre, c'est noté. Je vous préviens : deux usines du bassin ont déjà réservé leurs intérimaires pour décembre.",
      presence: tardif
        ? `Trévélo Intérim, rappelée cette semaine, envoie ${recrues} intérimaires sur les ${COMMANDE_TARDIVE} demandés : ils commencent lundi.`
        : `Intérimaires sur les lignes : ${nombre(l.interimaires ?? 0, 0)}${
            departs ? `, après ${departs} départ${departs > 1 ? "s" : ""}` : ""
          }.`,
      pointAgence: pointAgence(decisions, recrues, departs),
      accidents:
        accidents === 0
          ? "Aucun accident avec arrêt depuis octobre, et je voudrais que ça dure."
          : `Nous en sommes déjà à ${accidents} accident${accidents > 1 ? "s" : ""} avec arrêt depuis octobre.`,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const manquants = semaines.reduce((x, w) => x + w.manquants, 0);
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    return [
      [`Taux de service, sem. ${a}`, taux(t.semaines[a]!.service)],
      ["Pots manquants sur la période", nombre(manquants, 0)],
      ["Contribution de la période", kE(contribution)],
    ];
  },
  courbe: {
    titre: "Taux de service, semaine par semaine",
    cle: "service",
    cible: SERVICE_EXIGE,
    libelleCible: "exigé par les enseignes : 98,5 %",
    graduations: [0.2, 0.4, 0.6, 0.8, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `service ${taux(s.service!)} · ${heures(s.capacite!)} de ligne pour ${heures(s.besoin!)}`,
      `${nombre(s.interimaires!, 0)} intérimaires · absentéisme ${taux(s.absenteisme!)} · ${pots(s.manquants!)} manquants`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.weekend && choix === O.weekend.suppleance) {
      // Seule la demande compte : le CSE rend son avis selon le hasard du trimestre.
      return [
        {
          ...PATERNE,
          texte: avisFavorable(graine) ? REPONSES.avisFavorable : REPONSES.avisDefavorable,
        },
      ];
    }
    if (etape === D.noel && choix === O.noel.agence) {
      // Ce que l'agence trouve à dix jours de Noël ne dépend que du hasard du trimestre.
      return renfortDeNoel(interimairesPourvus("noel", hasard(graine).uPourvuNoel));
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.arrivee) {
      const { semaine, recrues } = arrive.arrivee;
      lies.push({
        ...KRISTELL,
        heure: `sem. ${semaine}`,
        alerte: semaine !== RECRUTEMENT.tot.arrivee,
        texte:
          semaine === RECRUTEMENT.tot.arrivee
            ? `${recrues} intérimaires sur ${COMMANDE} sont arrivés ce lundi. Deux semaines de formation avant la ligne : hygiène, bonnes pratiques, sécurité, puis aux côtés d'un conducteur.`
            : semaine === RECRUTEMENT.sansFormation.arrivee
              ? `${recrues} intérimaires sur ${COMMANDE} sont arrivés ce lundi, le premier jour du pic. Ils vont directement sur les lignes.`
              : `${recrues} intérimaires sur ${COMMANDE_TARDIVE} sont arrivés ce lundi. Je n'ai trouvé personne d'autre : tout le bassin recrute.`,
      });
    }
    if (arrive.refusOctobre) {
      lies.push({
        ...NAIM,
        heure: `sem. 8`,
        alerte: true,
        texte:
          "Celtis et Opaline refusent les pots fabriqués entre le 31 octobre et le 14 novembre : moins des deux tiers de DLC à réception. 297 000 pots partent chez le soldeur.",
      });
    }
    if (arrive.refusKerfroid) {
      const refuses = t.potsRefuses - (chemin[D.interim] === O.interim.octobre ? 297000 : 0);
      lies.push({
        ...NAIM,
        heure: "sem. 9",
        alerte: true,
        texte: `Les palettes stockées chez Kerfroid pour les semaines 9 et 10 sont refusées à réception : trop vieilles pour les centrales. ${pots(refuses)} déclassés chez le soldeur.`,
      });
    }
    if (
      de <= 9 &&
      a >= 9 &&
      partTenue(chemin) < 1 &&
      (t.suppleance || chemin[D.weekend] === O.weekend.samedi)
    ) {
      lies.push({
        ...RADIA,
        heure: "sem. 9",
        texte: `Seulement ${volontaires(chemin)} volontaires pour les week-ends au lieu de douze : on ne tiendra pas toutes les heures prévues.`,
      });
    }
    if (chemin[D.temps] === O.temps.refus && de <= 12 && a >= 12) {
      lies.push({
        ...RH,
        heure: "sem. 12",
        alerte: true,
        texte: `Semaine de Noël : ${taux(t.semaines[12]!.absenteisme, 0)} des permanents des lignes desserts sont absents, surtout parmi ceux dont les congés ont été refusés.`,
      });
    }
    for (const w of arrive.departs) {
      lies.push({
        ...RH,
        heure: `sem. ${w}`,
        texte:
          "Un intérimaire n'est pas revenu lundi. Trévélo Intérim n'a personne pour le remplacer.",
      });
    }
    for (const x of arrive.accidents) {
      lies.push({
        ...TAHAR,
        heure: `sem. ${x.semaine}`,
        alerte: true,
        texte: x.interimaire
          ? "Accident du travail sur la ligne 6 : un intérimaire s'est blessé à la main au poste de découpe de la thermoformeuse. Arrêt de travail ; la ligne est restée arrêtée le temps des premières constatations."
          : "Accident du travail : un conducteur, en fin de poste après une longue semaine, s'est blessé en intervenant sur l'empileur. Arrêt de travail jusqu'à la fin de l'année.",
      });
    }
    for (const w of arrive.rebuts) {
      lies.push({
        ...ANNAIG,
        heure: `sem. ${w}`,
        alerte: true,
        texte:
          "Lot bloqué : 36 000 pots au scellage défectueux, repérés au contrôle d'étanchéité. Le lot est détruit et refait.",
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `${kE(t.objectif)} de marge du pic, ruptures et renforts déduits`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge des desserts livrés pendant le pic, moins les pénalités et ventes perdues, la casse, les heures majorées, l'intérim, les accidents et les rebuts, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const restes = t.arrives - t.partis;
      const nbAccidents = t.semainesAccidents.length;
      return [
        {
          nom: "Taux de service du pic",
          valeur: taux(t.servicePic),
          aide: "du 23 novembre au 3 janvier ; exigé 98,5 %",
          tenu: t.servicePic >= SERVICE_EXIGE,
        },
        {
          nom: "Pénalités et ventes perdues",
          valeur: kE(t.ruptures),
          aide: `sur le trimestre ; repère ${kE(REPERE_RUPTURES)}`,
          tenu: t.ruptures <= REPERE_RUPTURES,
        },
        {
          nom: "Intérimaires restés",
          valeur: t.arrives ? `${restes} sur ${t.arrives}` : "aucun",
          aide: "jusqu'à la fin du pic ; l'an dernier, 4 sur 9",
          tenu: t.arrives > 0 && t.partis <= t.arrives / 4,
        },
        {
          nom: "Accidents du travail",
          valeur: nombre(nbAccidents, 0),
          aide: t.semainesRebuts.length
            ? `et ${t.semainesRebuts.length} lot${t.semainesRebuts.length > 1 ? "s" : ""} rebuté${t.semainesRebuts.length > 1 ? "s" : ""}`
            : "aucun lot rebuté",
          tenu: nbAccidents === 0,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const interim = t.semainesAccidents.filter((x) => x.interimaire).length;
      const permanents = t.semainesAccidents.length - interim;
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le CSE",
          texte: t.avisFavorable
            ? "aurait rendu un avis favorable à une équipe de suppléance proposée avec lui."
            : "aurait rendu un avis défavorable à une équipe de suppléance, même proposée avec lui.",
        },
        {
          titre: "Trévélo Intérim",
          texte: `aurait envoyé ${interimairesPourvus("tot", h.uPourvu)} intérimaires sur ${COMMANDE} commandés en octobre, ${interimairesPourvus("finNovembre", h.uPourvu)} sur ${COMMANDE_TARDIVE} appelés fin novembre.`,
        },
        {
          titre: "L'équipe",
          texte: [
            t.arrives
              ? t.partis
                ? `${t.partis} intérimaire${t.partis > 1 ? "s" : ""} sur ${t.arrives} ${t.partis > 1 ? "sont partis" : "est parti"} avant la fin`
                : `les ${t.arrives} intérimaires sont restés jusqu'au bout`
              : "aucun intérimaire n'est venu",
            interim ? `${interim} accident${interim > 1 ? "s" : ""} d'intérimaire` : null,
            permanents
              ? `${permanents} accident${permanents > 1 ? "s" : ""} de permanent fatigué`
              : null,
            t.semainesAccidents.length ? null : "aucun accident du travail",
          ]
            .filter(Boolean)
            .join(" ; ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
