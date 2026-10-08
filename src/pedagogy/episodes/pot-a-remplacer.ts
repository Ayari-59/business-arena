/**
 * ÉPISODE 101 — LE POT EN PLASTIQUE QU'IL FAUT REMPLACER, tel que l'interface
 * et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Azilis montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent d'elle.
 */
import {
  ALIGNEMENT,
  ANNONCE,
  BUDGET_PROJET,
  CADENCE_PS,
  CELTIS,
  D,
  DEDIT,
  CONFORMAGE,
  ECO,
  JOURS_SANS_PERTE,
  NEUTRE,
  PART_CELTIS,
  PERTE_PAR_JOUR,
  PRIX,
  REBUT_PS,
  SERVICE_ATTENDU,
  SERVICE_PS,
  SURCOUT_CARTON,
  VOLUME_AN,
  celtisAccepte,
  evenements,
  hasard,
  type Matiere,
  type Semaine,
  type Trimestre,
  tableauDeBord,
  simuler,
} from "@/engine/episodes/pot-a-remplacer";
import {
  ANNAIG,
  DIAGNOSTICS,
  CYRIELLE,
  ERWANN,
  ETAPES,
  HERVELINE,
  ISMERIE,
  IWAN,
  NAIM,
  REFERENCES,
  REFLEXES,
  REPONSES,
  PRZEMYSLAW,
  YSEE,
  centimes,
} from "@/config/episodes/pot-a-remplacer";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Le repère du surcoût annuel restant, une fois la part des enseignes déduite. */
export const REPERE_ANNUEL = 75000;

const NOM_MATIERE: Record<Matiere, string> = {
  ps: "polystyrène",
  pp: "PP monomatériau",
  carton: "carton à film",
};
const LIGNE = ["ligne 1", "ligne 2"] as const;
/** Une perte de cadence : « −7,2 % ». */
const perte = (v: number) => `−${taux(v)}`;
const points = (v: number) => `${nombre(v * 100)} pt`;

/** Ce que les décisions révèlent, dans l'ordre où une responsable emballages les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux offres d'emballage et le barème de l'éco-organisme",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    qualifier:
      "Votre diagnostic de la semaine 1 était juste : un emballage se juge à la ligne, sur sa cadence, ses rebuts, sa DLC et son coût sur une année, et cela se mesure sur une ligne et une référence avant de toucher à toute la gamme.",
    cout: "En semaine 1, vous avez vu que le carton coûte bien plus cher au pot que le PP : c'est vrai, et c'est une bonne partie de la réponse. Mais le prix du pot ne dit ni la cadence perdue, ni les rebuts, ni les pots mal scellés d'une bascule faite sans essai.",
    image:
      "En semaine 1, vous avez retenu l'image de la marque. Celtis demandait du recyclable, pas du carton, et l'étude du marketing ne mesurait aucun achat ; ce qui coûtait, c'était un emballage qu'aucune ligne n'avait encore produit.",
    echeance:
      "En semaine 1, vous avez pensé que rien ne pressait. L'échéance de Celtis ne bouge pas, et le polystyrène ne sera pas recyclable à temps : attendre ne supprime pas la bascule, cela la fait faire dans l'urgence.",
  };
  const justes = ["qualifier", "cout"];
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
    score: d === "qualifier" ? 1 : d === "cout" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais basculé toute la gamme pour une annonce, ni attendu l'échéance sans rien engager : vous avez mesuré avant de choisir, et choisi avant d'annoncer."
        : `Sous la pression du salon ou de l'échéance, vous avez ${n} fois sur ${ETAPES.length} décisions basculé toute la gamme pour l'annonce, ou attendu sans rien engager. Un emballage basculé sans essai se paie en pots mal scellés, en cadence perdue et en ruptures ; une échéance attendue se paie en bascule faite dans l'urgence.${
            t.incidents.length > 0
              ? ` ${t.incidents.length > 1 ? "Les deux lignes ont eu" : `La ${LIGNE[t.incidents[0]!]} a eu`} des pots mal scellés à la bascule.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.surcoutCarton,
    "de surcoût annuel du pot carton, éco-contribution comprise",
    "k€",
    { juste: 10, proche: 40 },
    (e) => `${nombre(e)} k€`,
  );

  const essai = p.chemin[D.plan] === 2;
  const pp = p.chemin[D.matiere] === 0;
  const etapes = p.chemin[D.bascule] === 3;
  const dossier = p.chemin[D.celtis] === 1 || p.chemin[D.celtis] === 2;
  const bons = [essai, pp, etapes, dossier].filter(Boolean).length;
  const methode: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      essai
        ? "Vous avez qualifié les deux matières sur une ligne et une référence avant de choisir."
        : "Vous avez choisi sans essai, sur les fiches des fournisseurs."
    } ${
      pp
        ? "Vous avez retenu le PP, que les chiffres désignaient."
        : t.matiere === "carton"
          ? "Vous avez retenu le carton, qui coûte bien plus sur une année."
          : "Vous avez gardé le polystyrène : l'échéance choisira à votre place."
    } ${
      etapes
        ? "Vous avez basculé ligne par ligne, la seconde avec les réglages de la première."
        : "Vous n'avez pas basculé ligne par ligne."
    } ${
      !dossier
        ? "Vous n'avez pas négocié le surcoût avec Celtis sur des chiffres."
        : t.partCeltis > 0
          ? `Vous avez obtenu de Celtis qu'elle prenne ${taux(t.partCeltis, 0)} du surcoût dans son tarif.`
          : "Vous avez présenté à Celtis de quoi prendre sa part du surcoût ; cette fois, elle a refusé."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, methode];
}

export function axe([information, diagnostic, reflexe, calibrage, methode]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Mesurer sur la ligne avant de choisir",
      texte:
        "Rejouez l'épisode en lisant d'abord les deux offres et le barème de l'éco-organisme, puis les résultats de l'essai : le prix du pot n'est qu'une partie du coût, et les fiches des fournisseurs sont écrites sur leurs lignes pilotes.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Qualifier avant d'annoncer",
      texte:
        "Une annonce de salon ne fait pas tourner une ligne. Un emballage se qualifie sur une ligne et une référence, se chiffre sur une année, se négocie avec un dossier, puis se déploie ligne par ligne. Attendre l'échéance ne vaut pas mieux : la bascule se fera, dans l'urgence.",
    };
  }
  if (methode!.score === 0) {
    return {
      titre: "Déployer par étapes, et négocier sur des chiffres mesurés",
      texte:
        "La première ligne apprend à la seconde ses réglages ; deux lignes qui basculent ensemble partagent une maintenance qui ne peut pas être partout. Et une enseigne prend sa part d'un surcoût qu'on lui montre, avant le 1er mars.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher le coût complet d'un emballage",
      texte:
        "Le coût d'un emballage, c'est le prix du pot, l'éco-contribution, les rebuts et la cadence qu'il fait perdre à la ligne, la DLC qu'il tient ou non. Seule la ligne dit les trois derniers.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du surcoût du carton",
      texte: `${centimes(PRIX.carton)} le pot carton contre ${centimes(PRIX.ps)} en polystyrène, mais ${centimes(ECO.carton)} d'éco-contribution contre ${centimes(ECO.ps)} : sur ${nombre(VOLUME_AN / 1e6, 0)} millions de pots, le carton coûte ${kE(SURCOUT_CARTON)} de plus par an, avant même les rebuts et la cadence.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_EMBALLAGE: Episode<Trimestre> = {
  code: "pot-a-remplacer",
  numero: 101,
  domaine: "Conduire un changement d'emballage",
  titre: "Le pot en plastique qu'il faut remplacer",
  resume:
    "Celtis exige des pots recyclables, le président veut annoncer le carton au salon. Qualifier sur une ligne, mesurer, négocier, puis déployer par étapes.",
  persona:
    "Vous êtes Azilis Cozic, responsable emballages et développement de la Laiterie de Kerbrélan, entreprise familiale de Loudéac (Côtes-d'Armor). Les yaourts Kerbrélan, 24 références et 40 millions de pots par an, sortent des lignes 1 et 2 de l'usine de Loudéac, des thermoformeuses qui forment, remplissent et scellent des pots en polystyrène. Celtis, l'enseigne qui pèse le plus, exige des pots recyclables d'ici dix-huit mois ; le président veut annoncer le carton au salon professionnel de mars. Le trimestre va de janvier à mars.",
  mandat: [
    { fort: "18 mois", texte: "pour que tous les pots vendus chez Celtis soient recyclables" },
    {
      fort: taux(SERVICE_ATTENDU),
      texte: "de taux de service attendu par les enseignes, bascule comprise",
    },
    { fort: kE(BUDGET_PROJET), texte: "de budget de projet pour le trimestre" },
    { fort: "aucun lot", texte: "douteux ne part : un pot mal scellé se bloque" },
  ],
  jugement:
    "La direction générale juge le trimestre sur le coût du changement d'emballage estimé en semaine 13 : les coûts du trimestre (essai, équipements, dédits, rebuts, samedis, ruptures, lots détruits), ce qui reste à faire au deuxième trimestre, et la première année de l'emballage retenu comparée au polystyrène, éco-contribution comprise, moins la part du surcoût que les enseignes prennent dans leur tarif.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos lignes de yaourts",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les créneaux d'essai réservés chez Maëlpack et Kervidal sont facturés sans servir.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...IWAN,
        alerte: true,
        texte: `Pendant ce temps, les créneaux d'essai réservés chez nos fournisseurs sont passés sans servir : ${euros(perdu)} facturés.`,
      };
    },
  },
  prevision: {
    libelle:
      "le surcoût annuel du pot carton sur la gamme des yaourts Kerbrélan, éco-contribution comprise, en k€",
    unite: "k€",
    placeholder: "100",
    min: 0,
    max: 1000,
    step: 1,
    reel: (t) => t.surcoutCarton,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "coutCumule",
      nom: "Coûts du trimestre",
      format: kE,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `essai, équipements, rebuts, samedis, ruptures ; budget : ${kE(BUDGET_PROJET)}`
          : `budget du projet : ${kE(BUDGET_PROJET)} pour le trimestre`,
      jauge: (l) => {
        const c = l.coutCumule;
        if (c === null || c === undefined) return null;
        return { part: Math.min(1, Math.max(0, c / BUDGET_PROJET)), enRetard: c > BUDGET_PROJET };
      },
    },
    {
      cle: "service",
      nom: "Taux de service",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: 1,
      aide: () => `attendu par les enseignes : ${taux(SERVICE_ATTENDU)}`,
    },
    {
      cle: "rebut",
      nom: "Rebut des lignes 1 et 2",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: -1,
      aide: () => `en polystyrène : ${taux(REBUT_PS)}`,
    },
    {
      cle: "cadence",
      nom: "Cadence des lignes 1 et 2",
      format: (v) => `${nombre(v, 0)} pots/h`,
      sensBon: 1,
      aide: () => `en polystyrène : ${nombre(CADENCE_PS, 0)} pots à l'heure`,
    },
    {
      cle: "recyclable",
      nom: "Gamme en pot recyclable",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: () => "Celtis : toute la gamme d'ici dix-huit mois",
    },
  ],
  contexte(l, decisions) {
    const m = decisions[D.matiere];
    return {
      plan: decisions[D.plan] ?? NEUTRE[D.plan],
      essai: l.essai === 1,
      matiere: m === 0 ? "pp" : m === 1 ? "carton" : "ps",
      cadencePP: perte(l.cadencePP ?? 0),
      rebutPP: taux(l.rebutPP ?? 0),
      cadenceCarton: perte(l.cadenceCarton ?? 0),
      rebutCarton: taux(l.rebutCarton ?? 0),
      annuelPP: kE(l.annuelPP ?? 0),
      annuelCarton: kE(l.annuelCarton ?? 0),
      dlc: l.dlcCarton ?? -1,
      arriveeL1: l.arriveeL1 ?? 99,
      arriveeL2: l.arriveeL2 ?? 99,
      service: taux(l.service ?? SERVICE_PS),
      couts: kE(l.coutCumule ?? 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    return [
      ["Coûts de la période", kE(cout)],
      [`Taux de service, sem. ${a}`, taux(t.semaines[a]!.service)],
      [`Rebut, sem. ${a}`, taux(t.semaines[a]!.rebut)],
    ];
  },
  courbe: {
    titre: "Taux de service des yaourts, semaine par semaine",
    cle: "service",
    cible: SERVICE_ATTENDU,
    libelleCible: `attendu par les enseignes : ${taux(SERVICE_ATTENDU)}`,
    graduations: [0.5, 0.6, 0.7, 0.8, 0.9, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `service ${taux(s.service!)} · rebut ${taux(s.rebut!)}`,
      `${nombre(s.cadence!, 0)} pots/h · ${taux(s.recyclable!, 0)} en pot recyclable`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.celtis && (choix === 0 || choix === 2)) {
      // Celtis répond selon le hasard du trimestre ; le dossier fixe le montant, pas la réponse.
      const oui = celtisAccepte(choix, graine);
      const texte =
        choix === 0
          ? oui
            ? REPONSES.toutAccepte
            : REPONSES.toutRefuse
          : oui
            ? REPONSES.dossierAccepte
            : REPONSES.dossierRefuse;
      return [{ ...CYRIELLE, texte }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const { t, dans, imprevus } = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    const plan = chemin[D.plan];
    if (plan === 2 && dans(4)) {
      lies.push({
        ...ANNAIG,
        heure: "sem. 4",
        texte:
          "L'essai est fini sur la ligne 2. Les tests de conservation des deux matières sont lancés : verdict en semaine 8.",
      });
    }
    if (dans(5)) {
      if (plan === 0 && t.matiere !== "carton") {
        lies.push({
          ...ISMERIE,
          heure: "sem. 5",
          texte: `Nous prenons acte de l'annulation. Le dédit prévu au contrat s'applique : ${euros(2 * CONFORMAGE.carton * DEDIT.part + DEDIT.potsCarton)}.`,
        });
      }
      if (plan === 1 && t.matiere !== "pp") {
        lies.push({
          ...PRZEMYSLAW,
          heure: "sem. 5",
          texte: `Nous prenons acte de l'annulation des kits. Le dédit prévu au contrat s'applique : ${euros(2 * CONFORMAGE.pp * DEDIT.part)}.`,
        });
      }
    }
    if (plan === 2 && dans(8)) {
      lies.push({
        ...ANNAIG,
        heure: "sem. 8",
        texte: t.dlcTenue
          ? "Tests de conservation à trente jours : le PP et le carton tiennent tous les deux la DLC."
          : "Tests de conservation à trente jours : le PP tient la DLC ; le carton non, les aromatisés tournent vers le 24e jour.",
      });
    }
    const negociation = chemin[D.celtis];
    if (dans(9) && t.matiere !== "ps" && negociation !== 3) {
      lies.push({
        ...NAIM,
        heure: "sem. 9",
        texte:
          t.partCeltis > 0
            ? `Négociation close : Celtis prend ${taux(t.partCeltis, 0)} du surcoût des pots dans son tarif, soit ${kE(t.partCeltis * PART_CELTIS * t.annuel)} par an.`
            : "Négociation close : Celtis ne prend rien du surcoût des pots cette année.",
      });
    }
    if (dans(9) && t.matiere === "ps") {
      lies.push({
        ...NAIM,
        heure: "sem. 9",
        alerte: true,
        texte: `Négociation close. Sans plan de passage au recyclable, Celtis retire nos yaourts de ses deux opérations de printemps : ${euros(CELTIS.sansPlan)} de marge perdue.`,
      });
    }
    for (let l = 0; l < 2; l += 1) {
      const w = t.bascules.semaine[l]!;
      if (w > 13 || !dans(w)) continue;
      lies.push({
        ...ERWANN,
        heure: `sem. ${w}`,
        texte: `La ${LIGNE[l]} est passée en ${NOM_MATIERE[t.matiere]} lundi. ${
          t.bascules.qualif[l] === "qualifiee"
            ? "Les réglages de l'essai ont tenu dès le premier jour."
            : t.bascules.qualif[l] === "partielle"
              ? "On cherche encore une partie des réglages."
              : "On découvre les réglages en production : la cadence n'y est pas."
        }`,
      });
      if (t.incidents.includes(l)) {
        lies.push({
          ...ANNAIG,
          heure: `sem. ${w}`,
          alerte: true,
          texte: `Des pots mal scellés sur la ${LIGNE[l]} : le contrôle d'étanchéité a trouvé des fuites sur deux jours de production. Les lots sont bloqués et seront détruits ; la ligne s'est arrêtée une journée pour trouver la cause.`,
        });
      }
      if (chemin[D.bascule] === 1) {
        lies.push({
          ...YSEE,
          heure: `sem. ${w}`,
          texte:
            "Une partie du stock d'avance est refusée par les plateformes : il lui restait moins des deux tiers de sa DLC. Les pots sont déclassés.",
        });
      }
    }
    for (let w = Math.max(1, de); w <= Math.min(13, a); w += 1) {
      const s = t.semaines[w]!;
      if (s.rupture > 20000) {
        lies.push({
          ...YSEE,
          heure: `sem. ${w}`,
          alerte: true,
          texte: `${nombre(Math.round(s.rupture / 1000) * 1000, 0)} pots non livrés cette semaine${s.samedis > 0 ? ", samedis travaillés compris" : ""} : taux de service à ${taux(s.service)}. Les enseignes appliqueront leurs pénalités logistiques.`,
        });
      }
    }
    if (dans(12) && t.matiere !== "ps" && t.partCeltis > 0) {
      lies.push({
        ...NAIM,
        heure: "sem. 12",
        texte: t.alignement
          ? `Opaline et Proxival suivent Celtis : ${taux(t.partCeltis, 0)} du surcoût dans leur tarif, au titre de la clause de revoyure.`
          : "Opaline et Proxival ne bougent pas : elles attendront de voir les nouveaux pots en rayon.",
      });
    }
    if (dans(12) && chemin[D.salon] === 0 && t.matiere !== "carton") {
      lies.push({
        ...HERVELINE,
        heure: "sem. 12",
        alerte: true,
        texte: `Il faut rectifier l'annonce du salon : la gamme ne passera pas au carton. Supports, communiqué, et un appel d'excuses à Celtis, qui l'avait relayée : ${euros(ALIGNEMENT.retropedalage)}.`,
      });
    }
    if (dans(9) && negociation === 0 && !celtisAccepte(0, graine)) {
      lies.push({
        ...IWAN,
        heure: "sem. 9",
        texte: `La participation au prospectus de Celtis est signée : ${euros(CELTIS.contrepartie)}.`,
      });
    }
    // Dans l'ordre des semaines : les suites de décisions arrivent quand elles arrivent.
    const semaineDe = (m: Message) => Number(m.heure?.replace("sem. ", "") ?? 0);
    lies.sort((x, y) => semaineDe(x) - semaineDe(y));
    return {
      lies,
      imprevus: imprevus.map(({ imprevu, semaine }) => ({
        de: imprevu.de,
        role: imprevu.role,
        heure: `sem. ${semaine}`,
        texte: imprevu.texte,
      })),
    };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      `${kE(t.cout)} de coût estimé du changement, trimestre et première année${
        t.urgence ? ", bascule dans l'urgence comprise" : ""
      }`,
    formatObjectif: kE,
    noteDesBarres:
      "Opposé du coût du changement d'emballage estimé en semaine 13 (trimestre, deuxième trimestre à venir, première année de l'emballage retenu, part des enseignes déduite), sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Coûts du trimestre",
          valeur: kE(t.trimestre),
          aide: `budget du projet : ${kE(BUDGET_PROJET)}`,
          tenu: t.trimestre <= BUDGET_PROJET,
        },
        {
          nom: "Taux de service",
          valeur: taux(t.serviceMoyen),
          aide: `en moyenne ; attendu : ${taux(SERVICE_ATTENDU)}`,
          tenu: t.serviceMoyen >= SERVICE_ATTENDU,
        },
        {
          nom: "Emballage retenu",
          valeur: NOM_MATIERE[t.matiere],
          aide:
            t.matiere === "ps"
              ? "non recyclable : l'échéance de Celtis choisira"
              : "recyclable au sens du barème",
          tenu: t.matiere !== "ps",
        },
        {
          nom: "Surcoût annuel restant",
          valeur: kE(t.annuelNet),
          aide: `première année, part des enseignes déduite ; repère : ${kE(REPERE_ANNUEL)}`,
          tenu: t.annuelNet <= REPERE_ANNUEL,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const ligne = (m: "pp" | "carton") =>
        `cadence ${perte(h[m].cadence)}, rebut ${taux(h[m].rebut)}`;
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Les lignes",
          texte: `ont fait en PP ${ligne("pp")}, et en carton ${ligne("carton")}, contre ${perte(ANNONCE.pp.cadence)} et ${taux(ANNONCE.pp.rebut)} pour le PP, ${perte(ANNONCE.carton.cadence)} et ${taux(ANNONCE.carton.rebut)} pour le carton sur les fiches des fournisseurs. Le carton ${
            t.dlcTenue ? "a tenu" : "n'a pas tenu"
          } les trente jours de DLC.`,
        },
        ...(t.matiere !== "ps"
          ? [
              {
                titre: "Celtis",
                texte:
                  t.partCeltis > 0
                    ? `a pris ${taux(t.partCeltis, 0)} du surcoût dans son tarif${
                        t.alignement ? ", et Opaline et Proxival l'ont suivie" : ""
                      }.`
                    : "n'a rien pris du surcoût des pots.",
              },
            ]
          : []),
        {
          titre: "Les bascules",
          texte:
            t.matiere === "ps"
              ? "n'ont pas eu lieu : elles se feront dans l'urgence, avant l'échéance."
              : `${
                  t.incidents.length === 0
                    ? "Aucun lot mal scellé"
                    : `${t.incidents.length > 1 ? "Des lots mal scellés sur les deux lignes" : `Des lots mal scellés sur la ${LIGNE[t.incidents[0]!]}`}`
                }${
                  t.bascules.glisse && t.bascules.semaine.some((w) => w > 13)
                    ? ", et la bascule du deuxième trimestre a glissé de trois semaines"
                    : ""
                }. Bobines de PS : ${
                  t.bobines.trop > 0
                    ? `${t.bobines.trop} semaines de ligne en trop`
                    : t.bobines.manque > 0
                      ? `${t.bobines.manque} semaines de ligne manquantes`
                      : "commandées au plus juste"
                }.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
