/**
 * ÉPISODE 69 — LE TRAVAIL FAIT QU'ON N'A PAS FACTURÉ, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de la facturation montre, ce que
 * la courbe trace, ce sur quoi le bilan juge Évrard, et ce que ses décisions
 * révèlent de lui.
 */
import {
  AUTORISATION,
  AUTORISATION_REDUITE,
  CA_JOUR,
  CREANCES_0,
  D,
  DSO_AN_DERNIER,
  EN_COURS_0,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  SEMAINE_OLLIVRO,
  SEUIL_CONFIANCE,
  evenements,
  hasard,
  rallongeS1Accordee,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/factures-qui-dorment";
import {
  PAOL,
  ASSITA,
  PRUNE,
  DIAGNOSTICS,
  ETAPES,
  FELICITE,
  GUSTAVE,
  NIKOLAI,
  REFERENCES,
  REFLEXES,
  REPONSES,
  KRISTEN,
} from "@/config/episodes/factures-qui-dorment";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** La trésorerie que le trimestre doit dégager, coûts déduits. */
export const CIBLE = 1_000_000;
/** La production immobilisée, en jours de chiffre d'affaires : au 30 septembre, et la cible. */
export const IMMOBILISATION_0 = (EN_COURS_0 + CREANCES_0) / CA_JOUR;
export const IMMOBILISATION_CIBLE = 115;

const jours = (v: number) => `${nombre(v, 0)} j`;
const signe = (v: number) => (v >= 0 ? kE(v) : `−${kE(-v)}`);

/** Ce que les décisions révèlent, dans l'ordre où un responsable de la facturation les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui chiffraient l'en-cours non facturé et décomposaient la liste des retards",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    avantFacture:
      "Votre diagnostic de la semaine 1 était juste : 2,7 M€ dormaient avant la facture, et près de la moitié de la liste des « retards » n'était pas due en l'état. Il fallait facturer juste et à temps avant de relancer.",
    rejets:
      "En semaine 1, vous avez vu les factures publiques rejetées : une vraie cause, mais pas la plus lourde. L'en-cours non facturé, jalons franchis et régie sans temps validés, pesait deux fois plus.",
    retards:
      "En semaine 1, vous avez retenu des clients qui paient tard ; seule la moitié de la liste des retards était vraiment due. Le reste n'avait pas de facture valide, ou la contestait, et l'en-cours n'était pas encore facturé.",
    financement:
      "En semaine 1, vous avez retenu un manque de financement ; le cabinet ne manquait pas de crédit, il laissait dormir sa production avant la facture.",
  };
  const justes = ["avantFacture", "rejets"];
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
    score: d === "avantFacture" ? 1 : d === "rejets" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const perdues = t.missionsPerdues.length + (t.phase3Perdue ? 1 : 0);
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux deux réflexes du recouvrement sous pression : relancer toute la liste des retards, et demander plus de découvert sans dossier."
        : `Vous avez choisi ${n} fois le réflexe : relancer des clients qui n'avaient pas de facture valide ou qui la contestaient, ou demander plus de découvert sans dossier.${
            perdues > 0
              ? ` ${perdues > 1 ? `${perdues} missions sont parties` : "Une mission est partie"} chez un concurrent : ${kE(t.margePerdue)} de marge perdue.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    EN_COURS_0 / 1000,
    "d'en-cours de production non facturé au 30 septembre",
    "k€",
    { juste: 20, proche: 100 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const c = p.chemin;
  const source = (c[D.portail] === 1 ? 1 : 0) + (c[D.jalons] === 1 ? 1 : 0);
  const facturer: Constat = {
    score: source === 2 ? 1 : source === 1 ? 0.6 : 0,
    texte:
      source === 2
        ? "Vous avez tari la source : le numéro d'engagement exigé avant toute facture publique, et le jalon déclenché au comité de pilotage qui valide le livrable. Les factures sont parties justes, et à temps."
        : source === 1
          ? `Vous avez réglé une des deux sources, pas l'autre : ${
              c[D.portail] === 1
                ? "les factures publiques partent conformes, mais les jalons attendent toujours le bon vouloir des directeurs de mission."
                : "les jalons partent au comité de pilotage, mais Tempora laisse encore partir des factures publiques que le portail rejettera."
            }`
          : `Les deux sources sont restées ouvertes : des jalons que personne ne déclenche, et des factures publiques que le portail rejette. En fin de trimestre, ${kE(t.enCoursFinal)} dormaient encore avant la facture et ${kE(t.rejeteesFinal)} de factures publiques attendaient un dépôt conforme.`,
  };

  return [information, diagnostic, reflexe, calibrage, facturer];
}

export function axe([information, diagnostic, reflexe, calibrage, facturer]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher où dort l'argent",
      texte:
        "Rejouez l'épisode en ouvrant d'abord l'en-cours de Tempora et la balance âgée décomposée : vous verrez ce qui n'est pas encore facturé, et ce que la liste des retards mêle de factures rejetées ou contestées.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Facturer avant de relancer",
      texte:
        "Une relance ne fait payer qu'une facture due, reçue et non contestée. Avant de relancer, faites partir les jalons franchis et la régie, faites accepter les factures publiques, réglez les litiges : c'est là que dort la trésorerie, et une rallonge de découvert ne la réveille pas.",
    };
  }
  if (facturer!.score === 0) {
    return {
      titre: "Tarir la source",
      texte:
        "Rattraper l'en-cours une fois ne suffit pas : déclenchez le jalon au comité de pilotage qui valide le livrable, et exigez le numéro d'engagement avant d'émettre une facture publique. Sinon, le stock se reforme dès le mois suivant.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Regarder avant la facture",
      texte:
        "Le DSO ne voit que les factures émises. L'en-cours non facturé, jalons franchis et régie sans temps validés, pesait plus lourd que les rejets du portail : c'est par lui qu'il fallait commencer.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Chiffrer l'en-cours",
      texte:
        "L'en-cours de production non facturé, c'est la valeur des travaux réalisés des forfaits moins ce qui en est facturé, plus les jours de régie non facturés au TJM. Refaites le calcul de la semaine 1 avec les chiffres de Tempora, et notez votre écart.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_EN_COURS: Episode<Trimestre> = {
  code: "factures-qui-dorment",
  numero: 69,
  domaine: "Facturation et trésorerie d'un cabinet",
  titre: "Le travail fait qu'on n'a pas facturé",
  resume:
    "Un DSO passé de 75 à 96 jours, une banque inquiète, et tout le monde qui veut relancer. Dans un cabinet, la trésorerie dort d'abord avant la facture.",
  persona:
    "Vous êtes Évrard Valdenaire, responsable du crédit clients et de la facturation d'Atlas Conseil, au siège de Nantes. Avec trois chargées de facturation, dont Assita Ouattara, vous émettez les factures d'un cabinet de 240 collaborateurs, suivez les encaissements et préparez avec Gustave Herbelin, le directeur administratif et financier, les rendez-vous avec la Banque de l'Erdre. Le trimestre va d'octobre à décembre.",
  mandat: [
    { fort: kE(CIBLE), texte: "de trésorerie à dégager d'ici fin décembre, coûts déduits" },
    {
      fort: `${IMMOBILISATION_CIBLE} jours`,
      texte: `de production immobilisée au plus, en-cours et créances (${nombre(IMMOBILISATION_0, 0)} au 30 septembre)`,
    },
    {
      fort: kE(AUTORISATION),
      texte: "d'autorisation de découvert, que la banque revoit le 1er décembre",
    },
    {
      fort: "la facturation",
      texte: "et le recouvrement sont à vous ; les missions, aux directeurs de mission",
    },
  ],
  jugement:
    "Votre direction juge le trimestre sur la trésorerie dégagée : ce que les clients ont payé au-delà de ce que le cabinet a produit, moins les frais financiers, l'affacturage, les majorations, les avoirs et la marge des missions perdues.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre facturation",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la facturation de septembre attend votre validation : des encaissements glissent au trimestre suivant.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...ASSITA,
        alerte: true,
        texte: `Pendant ce temps, les factures de fin septembre sont restées bloquées : ${euros(perdu)} d'encaissements glissent en janvier.`,
      };
    },
  },
  prevision: {
    libelle: "l'en-cours de production non facturé au 30 septembre, en milliers d'euros",
    unite: "k€",
    placeholder: "2000",
    min: 0,
    max: 10000,
    step: 10,
    reel: () => EN_COURS_0 / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "tresorerieDegagee",
      nom: "Trésorerie dégagée",
      format: signe,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `encaissé au-delà de la production, coûts déduits ; cible ${kE(CIBLE)}`
          : `cible du trimestre : ${kE(CIBLE)}`,
      jauge: (l) => {
        const degage = l.tresorerieDegagee;
        if (degage == null) return null;
        return { part: Math.max(0, Math.min(1, degage / CIBLE)), enRetard: degage < 0 };
      },
    },
    {
      cle: "dso",
      nom: "DSO",
      format: jours,
      formatEcart: (v) => `${nombre(v, 1)} j`,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? "créances sur chiffre d'affaires : il ne voit pas l'en-cours non facturé"
          : `${DSO_AN_DERNIER} jours il y a un an`,
    },
    {
      cle: "enCours",
      nom: "En-cours non facturé",
      format: kE,
      sensBon: -1,
      aide: (_, l) => `dont ${kE(l.jalons ?? 0)} de jalons franchis, ${kE(l.regie ?? 0)} de régie`,
    },
    {
      cle: "rejetees",
      nom: "Factures publiques rejetées",
      format: kE,
      sensBon: -1,
      aide: () => "en attente d'un dépôt conforme sur le portail",
    },
    {
      cle: "solde",
      nom: "Solde bancaire",
      format: signe,
      sensBon: 1,
      aide: (_, l) => `ligne utilisable : ${kE(l.plafond ?? AUTORISATION)}`,
    },
  ],
  contexte(l, decisions) {
    const pic = l.picPrevu ?? 0;
    return {
      jalons: kE(l.jalons ?? 0),
      regie: kE(l.regie ?? 0),
      rejetees: kE(l.rejetees ?? 0),
      contestees: kE(l.contestees ?? 0),
      echues: kE(l.echues ?? 0),
      endormi: kE(l.endormi ?? 0),
      prive: kE(l.prive ?? 0),
      picPrevu: signe(pic),
      besoin: kE(Math.max(0, -pic - AUTORISATION_REDUITE)),
      relance: decisions[D.priorite] === 0,
      dejaSollicitee: decisions[D.priorite] === 3,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    return [
      ["Trésorerie dégagée sur la période", signe(contribution)],
      [`En-cours non facturé, sem. ${a}`, kE(t.semaines[a]!.enCours)],
      [`Factures publiques rejetées, sem. ${a}`, kE(t.semaines[a]!.rejetees)],
    ];
  },
  courbe: {
    titre: "Ce qui dort sans facture valide : en-cours, factures rejetées, factures contestées",
    cle: "endormi",
    cible: SEUIL_CONFIANCE,
    libelleCible: "au-dessous de 3 M€, la banque juge l'échéancier crédible",
    graduations: [0, 1000000, 2000000, 3000000, 4000000, 5000000, 6000000],
    format: kE,
    details: (s) => [
      `en-cours ${kE(s.enCours!)} · rejetées ${kE(s.rejetees!)} · contestées ${kE(s.contestees!)}`,
      `DSO ${jours(s.dso!)} · trésorerie dégagée ${signe(s.degage!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.priorite && choix === 3) {
      // La banque répond selon le hasard du trimestre.
      return [
        {
          ...KRISTEN,
          texte: rallongeS1Accordee(graine) ? REPONSES.rallongeOui : REPONSES.rallongeNon,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.avenant !== null) {
      lies.push({
        ...PAOL,
        heure: `sem. ${SEMAINE_OLLIVRO}`,
        alerte: !arrive.avenant,
        texte: arrive.avenant ? REPONSES.avenantSigne : REPONSES.avenantRefuse,
      });
    }
    if (arrive.ollivroPaye) {
      lies.push({ ...NIKOLAI, heure: "sem. 9", texte: REPONSES.ollivroPaye });
    }
    if (arrive.banque !== null) {
      lies.push({
        ...KRISTEN,
        heure: "sem. 9",
        alerte: !arrive.banque,
        texte: arrive.banque
          ? chemin[D.banque] === 2
            ? REPONSES.facilite
            : REPONSES.decouvert
          : REPONSES.refus,
      });
    }
    if (arrive.phase3Perdue) {
      lies.push({ ...PAOL, heure: "sem. 10", alerte: true, texte: REPONSES.phase3Perdue });
    }
    if (arrive.factor) {
      lies.push({ ...FELICITE, heure: "sem. 11", texte: REPONSES.factor });
    }
    if (arrive.depassement) {
      lies.push({
        ...PRUNE,
        heure: `sem. ${t.semaineRejet}`,
        alerte: true,
        texte: `La ligne ne suffit pas : la banque a rejeté nos prélèvements. Échéances de l'URSSAF et de la TVA reportées, ${kE(t.depassement)} sur le trimestre, majorées de 5 % : ${kE(t.majorations)}.`,
      });
    }
    for (const w of arrive.missionsPerdues) {
      lies.push({ ...GUSTAVE, heure: `sem. ${w}`, alerte: true, texte: REPONSES.missionPerdue });
    }
    // Dans l'ordre des semaines où ils tombent.
    lies.sort((x, y) => Number(x.heure?.slice(5)) - Number(y.heure?.slice(5)));
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
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de trésorerie dégagée, coûts déduits`
        : `${kE(-t.objectif)} de trésorerie de plus immobilisée, coûts compris`,
    formatObjectif: signe,
    noteDesBarres:
      "Trésorerie dégagée sur le trimestre : ce que les clients ont payé au-delà de la production, moins les frais financiers, l'affacturage, les majorations, les avoirs et la marge des missions perdues, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const fin = t.semaines[13]!;
      const perdues = t.missionsPerdues.length + (t.phase3Perdue ? 1 : 0);
      return [
        {
          nom: "Trésorerie dégagée",
          valeur: signe(t.objectif),
          aide: `cible ${kE(CIBLE)} ; ${kE(t.couts)} de coûts déduits`,
          tenu: t.objectif >= CIBLE,
        },
        {
          nom: "Production immobilisée",
          valeur: jours(fin.immobilisation),
          aide: `en-cours et créances ; ${jours(IMMOBILISATION_0)} au 30 septembre, ${IMMOBILISATION_CIBLE} visés`,
          tenu: fin.immobilisation <= IMMOBILISATION_CIBLE,
        },
        {
          nom: "Le pic de décembre",
          valeur:
            t.depassement > 0 ? `${kE(t.depassement)} d'échéances rejetées` : "passé dans la ligne",
          aide:
            t.banque === true
              ? "avec l'accord du comité de crédit"
              : t.affacturage > 0
                ? `avec l'affacturage : ${kE(t.affacturage)}`
                : t.banque === false
                  ? "le comité de crédit a refusé"
                  : "sans rien demander à la banque",
          tenu: t.depassement === 0,
        },
        {
          nom: "Clients",
          valeur:
            perdues === 0
              ? "aucune mission perdue"
              : `${perdues} mission${perdues > 1 ? "s" : ""} perdue${perdues > 1 ? "s" : ""}`,
          aide:
            t.avenant === true
              ? "Ollivro a signé l'avenant"
              : t.ollivroEncaisse > 0
                ? `Ollivro a payé ${kE(t.ollivroEncaisse)}`
                : "le litige Ollivro reste ouvert",
          tenu: perdues === 0,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.banque !== null
          ? [
              {
                titre: "La Banque de l'Erdre",
                texte: t.banque
                  ? "a accordé la rallonge demandée pour décembre."
                  : `a refusé la rallonge de décembre${t.endormiSemaine8 > SEUIL_CONFIANCE ? " : trop de production dormait encore sans facture valide" : ", malgré un échéancier crédible"}.`,
              },
            ]
          : []),
        ...(t.avenant !== null
          ? [
              {
                titre: "Ollivro",
                texte: t.avenant
                  ? "a signé l'avenant en comité de pilotage."
                  : `a refusé l'avenant${t.phase3Perdue ? ", et confié la phase 3 à Kéroual Consulting" : ", sans retirer la phase 3"}.`,
              },
            ]
          : []),
        {
          titre: "Les clients",
          texte:
            t.froissement === 0
              ? "Aucun n'a été relancé à tort : aucun n'avait de raison de partir."
              : t.missionsPerdues.length
                ? `Relancés à tort, ${t.missionsPerdues.length > 1 ? "deux clients ont" : "un client a"} retiré une mission.`
                : "Certains ont été relancés à tort, mais aucun n'a retiré de mission ce trimestre.",
        },
      ];
    },
  },
  comportements,
  axe,
};
