/**
 * ÉPISODE 52 — L'INTERSAISON QUI ASSÈCHE LA CAISSE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Bérenger montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent
 * de lui.
 */
import {
  AUTORISATION,
  AVENANT,
  D,
  JOURS_SANS_PERTE,
  LIGNE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PLAN_CORRIGE,
  POINT_BAS_PLAN,
  PRET,
  TOTAL_TRAVAUX,
  TRESORERIE_DEPART,
  alpineAccepte,
  banqueAccepte,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/intersaison";
import {
  ALPINE,
  BANQUE,
  ANNABELLE,
  BLANCHISSERIE,
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  SIEGE,
  VUARAND,
  ZEPHYRIN,
} from "@/config/episodes/intersaison";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n >= 2 ? "s" : ""}`;
/** Les montants d'un plan de trésorerie : le signe dit si l'on est sous zéro. */
const signe = (v: number) => (v > 0 ? `+${kE(v)}` : kE(v));

/** Ce que les décisions révèlent, dans l'ordre où un financier les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de bâtir le plan de trésorerie",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    cycle:
      "Votre diagnostic de la semaine 1 était juste : la trésorerie de 420 k€ du 13 avril était faite d'un BFR de −406 k€, les dettes de l'hiver. La fermeture les faisait tomber quand plus rien n'entrait, et les travaux s'y ajoutaient : un creux saisonnier, prévisible, qui se finance comme tel.",
    travaux:
      "En semaine 1, vous avez vu que les travaux pesaient lourd : juste, mais ils ne font qu'un tiers du creux. L'essentiel, ce sont les dettes de l'hiver qui tombent à la fermeture : le BFR s'inverse, et le creux reviendrait chaque printemps, travaux ou pas.",
    rentabilite:
      "En semaine 1, vous avez douté de la rentabilité de l'hiver ; la saison était record, à 41 % de GOP. Ce n'est pas la marge qui manquait, c'est le calendrier : l'hiver encaisse avant de payer, l'intersaison paie sans encaisser.",
    fixes:
      "En semaine 1, vous avez cru que les charges fixes de l'hôtel fermé étaient le problème : 16 k€ par semaine, moins d'un quart des sorties de l'intersaison. Le creux vient des dettes de l'hiver et des travaux, qui tombent quand plus rien n'entre.",
  };
  const justes = ["cycle", "travaux"];
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
    score: d === "cycle" ? 1 : d === "travaux" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cherché l'argent du creux là où il coûte le plus : ni dans les travaux, ni chez les fournisseurs, ni dans la saison suivante."
        : `Vous avez choisi ${n} fois le geste du réflexe : passer le creux sans le financer, en reportant les travaux, en faisant attendre les fournisseurs, en montant les acomptes ou en vendant l'hiver prochain au rabais.${
            t.incidents.length
              ? ` La banque a rejeté des paiements pendant ${pluriel(t.incidents.length, "semaine")}.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    POINT_BAS_PLAN / 1000,
    "de point bas de la trésorerie nette selon le plan d'avril",
    "k€",
    { juste: 10, proche: 30 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const ligne = p.chemin[D.financement] === 0;
  const travauxFaits =
    (p.chemin[D.travaux] === 0 || p.chemin[D.travaux] === 3) && p.chemin[D.legionelle] !== 2;
  const preserve =
    p.chemin[D.fournisseurs] !== 1 && p.chemin[D.acomptes] !== 1 && p.chemin[D.alpine] !== 0;
  const points = (ligne ? 1 : 0) + (travauxFaits ? 1 : 0) + (preserve ? 1 : 0);
  const cycle: Constat = {
    score: points === 3 ? 1 : points === 2 ? 0.6 : 0,
    texte: `${
      ligne
        ? "Vous avez financé le creux saisonnier par une ligne saisonnière, négociée en avril, plan de trésorerie à l'appui."
        : p.chemin[D.financement] === 2
          ? "Vous avez financé un besoin de quelques semaines par un prêt à cinq ans : de l'argent qui dormira dix mois sur douze."
          : "Le creux saisonnier n'a pas eu de financement négocié à temps."
    } ${
      travauxFaits
        ? "Les travaux d'intersaison ont été faits au printemps, quand ils coûtent le moins."
        : "Des travaux ont été reportés à l'automne : plus chers, et payés en pannes, en notes et en prix."
    } ${
      preserve
        ? "Et vous n'avez fait payer le creux ni à vos fournisseurs, ni à vos clients, ni à l'hiver prochain."
        : "Et une part du creux a été payée par les fournisseurs, les clients ou l'hiver prochain."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, cycle];
}

export function axe([information, diagnostic, reflexe, calibrage, cycle]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Faire le plan avant le creux",
      texte:
        "Rejouez l'épisode en ouvrant d'abord les échéances et les encaissements de l'intersaison : semaine par semaine, ils disent où tombe le point bas, et de combien. C'est avec ce plan qu'on va voir la banque, en avril.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Financer le creux, pas l'emprunter à la saison suivante",
      texte:
        "Reporter les travaux, faire attendre les fournisseurs, monter les acomptes ou brader l'hiver, c'est emprunter quand même, et plus cher qu'à la banque. Un creux prévisible se finance par une ligne saisonnière, négociée avant d'en avoir besoin.",
    };
  }
  if (cycle!.score === 0) {
    return {
      titre: "Un besoin saisonnier, un financement saisonnier",
      texte:
        "Un creux qui revient chaque printemps et disparaît chaque été se finance par un crédit de campagne, à la mesure du point bas du plan : ni par un prêt à cinq ans, ni par un découvert négocié dans l'urgence.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Lire le cycle de la trésorerie",
      texte:
        "À la fin de l'hiver, regardez de quoi est faite la trésorerie : un BFR très négatif, ce sont des dettes qui vont tomber. Le creux de l'intersaison n'est pas un accident, c'est le cycle.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer le plan de trésorerie",
      texte:
        "Le point bas se calcule en cumulant, semaine après semaine, ce qui entre et ce qui sort, à partir de la trésorerie de départ. Refaites le calcul jusqu'à le tenir à 10 k€ près.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_INTERSAISON: Episode<Trimestre> = {
  code: "intersaison",
  numero: 54,
  domaine: "Trésorerie saisonnière",
  titre: "L'intersaison qui assèche la caisse",
  resume:
    "Un hôtel de montagne qui ferme après une saison record, et dont la caisse va se vider avant la réouverture. Faire le plan, financer le creux, et ne pas le faire payer à la saison suivante.",
  persona:
    "Vous êtes Bérenger Maréchal, responsable administratif et financier de L'Escale Megève, l'hôtel 4 étoiles de 38 chambres du Groupe Escale, avec sa Table d'Augustin. L'hôtel ouvre de mi-décembre à mi-avril et en juillet-août, et ferme entre les deux. Votre équipe : Fleurine Rosset, comptable ; vous travaillez avec Annabelle Socquet, la directrice de l'hôtel.",
  mandat: [
    { fort: kE(TRESORERIE_DEPART), texte: "de trésorerie nette au 13 avril, à la fermeture" },
    { fort: kE(AUTORISATION), texte: "de facilité de caisse à la Banque des Aravis" },
    { fort: kE(TOTAL_TRAVAUX), texte: "de travaux d'intersaison au programme" },
    { fort: "2 juillet", texte: "la réouverture pour l'été, à ne pas manquer" },
  ],
  jugement:
    "Le groupe juge le trimestre sur la trésorerie de mi-juillet, corrigée : ce que vous avez emprunté, encaissé d'avance ou reporté n'y compte pas ; ce que vos choix coûtent ou rapportent, frais financiers, pénalités, réservations et travaux perdus, contrat de l'hiver prochain, y compte.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre hôtel",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les entreprises de travaux, qui bloquent leurs équipes pour le 11 mai, facturent l'attente.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...ZEPHYRIN,
        alerte: true,
        texte: `Pendant ce temps, les entreprises ont facturé l'immobilisation de leurs équipes : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "le point bas de la trésorerie nette d'ici mi-juillet selon le plan, en milliers d'euros (négatif s'il passe sous zéro)",
    unite: "k€",
    placeholder: "−100",
    min: -1000,
    max: 500,
    step: 1,
    reel: () => POINT_BAS_PLAN / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "tresorerie",
      nom: "Trésorerie nette",
      format: signe,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "solde du compte − ligne, découvert et avances"
          : "faite d'un BFR de −406 k€ : les dettes de l'hiver",
    },
    {
      cle: "concours",
      nom: "Financements utilisés",
      format: kE,
      sensBon: -1,
      aide: (_, l) => `${kE(l.disponible ?? AUTORISATION)} accordés sans dépassement`,
      jauge: (l) => {
        if (l.concours == null || !l.disponible) return null;
        return {
          part: Math.min(1, l.concours / l.disponible),
          enRetard: l.concours > l.disponible,
        };
      },
    },
    {
      cle: "bfr",
      nom: "Besoin en fonds de roulement",
      format: signe,
      sensBon: -1,
      aide: () => "créances + stocks − dettes − acomptes reçus",
    },
    {
      cle: "acomptes",
      nom: "Acomptes encaissés",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "depuis le 13 avril, pour l'été et l'hiver prochain" : "20 % à la réservation",
    },
    {
      cle: "frais",
      nom: "Frais financiers et pénalités",
      format: kE,
      sensBon: -1,
      aide: () => "agios, commissions, frais, pénalités, cumulés",
    },
  ],
  contexte(l, decisions) {
    return {
      tresorerie: signe(l.tresorerie ?? TRESORERIE_DEPART),
      concours: kE(l.concours ?? 0),
      disponible: kE(l.disponible ?? AUTORISATION),
      bfr: signe(l.bfr ?? 0),
      acomptes: kE(l.acomptes ?? 0),
      pointBasPrevu: signe(l.pointBasPrevu ?? 0),
      semainePointBas: l.semainePointBas ?? 11,
      pointBasAvecVins: signe(l.pointBasAvecVins ?? 0),
      disponiblePrevu: kE(l.disponiblePrevu ?? AUTORISATION),
      manque: l.manque ? kE(l.manque) : "",
      incidents: l.incidents ?? 0,
      ligne: l.ligne === 1 && decisions[D.financement] === 0,
      pret: decisions[D.financement] === 2,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const frais = semaines.reduce((x, w) => x + w.fraisSemaine, 0);
    return [
      [`Trésorerie nette, sem. ${a}`, signe(t.semaines[a]!.tresorerie)],
      [`Financements utilisés, sem. ${a}`, kE(t.semaines[a]!.concours)],
      ["Frais financiers et pénalités", kE(frais)],
    ];
  },
  courbe: {
    titre: "Besoin de financement, semaine par semaine",
    cle: "besoin",
    cible: LIGNE + AUTORISATION,
    libelleCible: `ligne saisonnière et facilité de caisse : ${kE(LIGNE + AUTORISATION)}`,
    graduations: [100000, 200000, 300000, 400000, 500000],
    format: (v) => kE(v),
    details: (s) => [
      `trésorerie nette ${signe(s.tresorerie!)} · financements utilisés ${kE(s.concours!)} sur ${kE(s.disponible!)}`,
      `BFR ${signe(s.bfr!)} · acomptes encaissés ${kE(s.acomptes!)}${
        s.rejetes ? ` · ${kE(s.rejetes)} de paiements rejetés` : ""
      }`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.financement && choix !== 1) {
      // Le comité de la semaine 2 répond selon le hasard du trimestre.
      const accepte = banqueAccepte([choix], graine);
      const texte =
        choix === 0
          ? accepte
            ? REPONSES.ligneAccordee
            : REPONSES.ligneRefusee
          : choix === 2
            ? accepte
              ? REPONSES.pretAccorde
              : REPONSES.pretRefuse
            : accepte
              ? REPONSES.relevementAccorde
              : REPONSES.relevementRefuse;
      return [{ ...BANQUE, texte }];
    }
    if (etape === D.alpine && choix === 1) {
      const chemin = [...NEUTRE.slice(0, D.alpine), 1];
      return [
        {
          ...ALPINE,
          texte: alpineAccepte(chemin, graine) ? REPONSES.alpineAccepte : REPONSES.alpineRefuse,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.pretVerse) {
      lies.push({
        ...BANQUE,
        heure: "sem. 6",
        texte: `Le nantissement est inscrit : les ${kE(PRET)} du prêt à moyen terme sont versés sur votre compte.`,
      });
    }
    if (arrive.relances) {
      lies.push({
        ...BLANCHISSERIE,
        heure: "sem. 8",
        alerte: true,
        texte:
          "Relance : votre facture d'avril est échue. Nous vous rappelons qu'au-delà de trente jours de retard, nos conditions prévoient la suspension du service.",
      });
    }
    for (const w of arrive.incidents) {
      const premier = w === t.incidents[0];
      lies.push({
        ...BANQUE,
        heure: `sem. ${w}`,
        alerte: true,
        texte: premier
          ? `Votre compte dépasse ce que nous pouvons laisser passer : nous avons rejeté ${kE(t.semaines[w]!.rejetes)} de prélèvements et de virements, dont celui de l'URSSAF. L'incident est enregistré.`
          : `Nous avons de nouveau rejeté ${kE(t.semaines[w]!.rejetes)} de paiements faute de provision.`,
      });
    }
    if (arrive.urgence !== null) {
      lies.push({
        ...BANQUE,
        heure: `sem. ${arrive.urgence}`,
        alerte: true,
        texte:
          "Pour éviter d'autres rejets, le comité vous consent un découvert exceptionnel jusqu'à la réouverture : 11 % l'an, et 5 000 € de frais de dossier et de caution du groupe.",
      });
    }
    if (arrive.ristourne) {
      lies.push({
        ...VUARAND,
        heure: "sem. 9",
        texte:
          "Vos factures de l'hiver restent impayées. Je suis au regret de vous dire que la ristourne de fin d'année est réservée à nos clients à jour.",
      });
    }
    if (arrive.ligneRelevee) {
      lies.push({
        ...BANQUE,
        heure: t.ligneAccordee ? "sem. 9" : "sem. 10",
        texte: t.ligneAccordee
          ? "Votre plan à jour est clair : votre ligne saisonnière est portée à 400 k€ jusqu'au 30 septembre."
          : "Plan à jour à l'appui, le comité de juin vous ouvre une ligne saisonnière de 400 k€ jusqu'au 30 septembre, à 5,8 %.",
      });
    }
    if (arrive.avanceSiege) {
      lies.push({
        ...SIEGE,
        heure: "sem. 10",
        texte: "Les 100 k€ d'avance du siège sont à votre disposition sur le compte de l'hôtel.",
      });
    }
    if (arrive.reouverture) {
      lies.push({
        ...ANNABELLE,
        heure: "sem. 12",
        texte: `L'Escale Megève a rouvert jeudi. ${
          hasard(graine).ete >= 1.05
            ? "Le soleil est là, et les clients de passage aussi."
            : hasard(graine).ete <= 0.95
              ? "Démarrage timide : le temps est maussade, les clients de passage se font rares."
              : "Démarrage conforme à ce qu'on attendait."
        }`,
      });
    }
    if (arrive.linge) {
      lies.push({
        ...BLANCHISSERIE,
        heure: "sem. 12",
        alerte: true,
        texte:
          "Vos factures étant impayées depuis plus de trente jours, nous suspendons le service : le linge de la réouverture ne sera livré qu'après règlement.",
      });
    }
    if (arrive.legionelle !== null) {
      lies.push({
        ...ZEPHYRIN,
        heure: "sem. 12",
        alerte: arrive.legionelle,
        texte: arrive.legionelle
          ? "Les analyses de réouverture sont encore positives au deuxième étage : je ferme l'étage une semaine, Yousra déloge les clients sur les autres hôtels de la vallée."
          : "Les analyses de réouverture sont négatives : le choc thermique a suffi, cette fois.",
      });
    }
    if (arrive.froid) {
      lies.push({
        ...ZEPHYRIN,
        heure: "sem. 13",
        alerte: true,
        texte:
          "La chambre froide de la Table d'Augustin a lâché dans la nuit : tout le stock est à jeter, et le restaurant ferme deux jours le temps de la réparer.",
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
    titre: (t) =>
      `${kE(t.objectif)} de trésorerie corrigée à mi-juillet, pour ${kE(PLAN_CORRIGE)} au plan d'avril`,
    formatObjectif: kE,
    noteDesBarres:
      "Trésorerie nette de mi-juillet, corrigée — acomptes d'avance, paiements reportés et emprunts retirés, coûts et gains d'après le trimestre ajoutés —, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const reportes = t.travauxReportes + (t.reseauReporte ? AVENANT : 0);
      return [
        {
          nom: "Point bas",
          valeur: signe(t.pointBas),
          aide: t.incidents.length
            ? `${pluriel(t.incidents.length, "semaine")} de paiements rejetés`
            : `en semaine ${t.semainePointBas}, sans un paiement rejeté`,
          tenu: t.incidents.length === 0,
        },
        {
          nom: "Frais financiers et pénalités",
          valeur: kE(t.fraisFinanciers),
          aide: "agios, commissions, frais, pénalités",
          tenu: t.fraisFinanciers <= 8000,
        },
        {
          nom: "Travaux d'intersaison",
          valeur: reportes ? `${kE(reportes)} reportés` : "tous réalisés",
          aide: reportes ? "à faire à l'automne, plus cher" : "avant la réouverture",
          tenu: reportes === 0,
        },
        {
          nom: "La saison suivante",
          valeur: signe(t.valeur),
          aide: "ce que vos choix coûtent ou rapportent après le trimestre",
          tenu: t.valeur >= 0,
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
        {
          titre: "La Banque des Aravis",
          texte: [
            t.ligneAccordee ? "a accordé la ligne saisonnière" : null,
            t.pretAccorde ? "a accordé le prêt à moyen terme" : null,
            t.relevementAccorde ? "a porté la facilité de caisse à 300 k€" : null,
            t.refusBanque ? "a refusé ce que vous lui demandiez en semaine 2" : null,
            t.incidents.length
              ? `a rejeté des paiements pendant ${pluriel(t.incidents.length, "semaine")}`
              : null,
            t.urgence !== null ? "a consenti un découvert exceptionnel" : null,
          ]
            .filter(Boolean)
            .join(", ")
            .concat(".")
            .replace(/^\.$/, "n'a rien eu à trancher, et n'a rejeté aucun paiement."),
        },
        {
          titre: "L'été",
          texte: `a démarré ${h.ete >= 1.05 ? "mieux que prévu" : h.ete <= 0.95 ? "moins bien que prévu" : "comme prévu"} : ${kE(t.recettesEte)} de recettes en deux semaines.`,
        },
        ...(t.panneFroid || t.legionelle || t.lingeSuspendu || t.ristournePerdue
          ? [
              {
                titre: "Ce que les reports ont coûté",
                texte: [
                  t.panneFroid ? "la chambre froide a lâché" : null,
                  t.legionelle ? "les analyses de légionelle sont restées positives" : null,
                  t.lingeSuspendu ? "la Blanchisserie du Fier a suspendu le linge" : null,
                  t.ristournePerdue ? "Maison Vuarand a supprimé sa ristourne" : null,
                ]
                  .filter(Boolean)
                  .join(", ")
                  .replace(/^./, (c) => c.toUpperCase())
                  .concat("."),
              },
            ]
          : []),
        {
          titre: "Alpine Horizons",
          texte: t.alpineSigne
            ? `a signé : ${signe(t.valeurAlpine)} sur l'hiver prochain, par rapport à la vente directe.`
            : "n'a pas signé de contrat pour l'hiver prochain.",
        },
      ];
    },
  },
  comportements,
  axe,
};
