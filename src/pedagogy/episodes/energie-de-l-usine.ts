/**
 * ÉPISODE 102 — LA FACTURE D'ÉNERGIE DE L'USINE, tel que l'interface et le
 * bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Djibril montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent
 * de lui.
 */
import {
  BUDGET,
  BUDGET_AN,
  CANICULES,
  CONTRAT,
  D,
  ELEC,
  ELEC_AN,
  FUITES_AN,
  FUITES_KW,
  GAZ_AN,
  HEURES_AN,
  INVESTISSEMENTS,
  JOURS_SANS_PERTE,
  MARGE_INDEXE,
  NEUTRE,
  OBJECTIF_SERVICE,
  PERTE_PANNE,
  PERTE_PAR_JOUR,
  PRIX_ELEC,
  PROFIL,
  SPOT,
  A_TERME,
  aideReduite,
  evenements,
  hasard,
  semaineDereferencement,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/energie-de-l-usine";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/energie-de-l-usine";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const mwh = (v: number) => `${nombre(v, 0)} MWh`;
const parMwh = (v: number) => `${nombre(v, 0)} €/MWh`;
/** L'objectif de consommation du comité : 5 % d'électricité en moins par semaine. */
export const OBJECTIF_ELEC = Math.round(ELEC * 0.95);
/** Les économies durables attendues : 10 % de l'énergie de l'année. */
export const OBJECTIF_ECONOMIES = 0.1 * (ELEC_AN + GAZ_AN);
/** Un écart aux budgets : positif, l'usine coûte moins que prévu. */
const ecartAuxBudgets = (v: number) =>
  v >= 0
    ? `${kE(v)} sous les budgets du trimestre et de l'an prochain`
    : `${kE(-v)} au-delà des budgets du trimestre et de l'an prochain`;

const KLERVI = { de: "Klervi Nédélec", role: "Responsable maintenance" } as const;
const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
const LAVINIA = { de: "Lavinia Petrescu", role: "Chargée d'affaires, Thermaval" } as const;
const NEDJMA = {
  de: "Nedjma Benhalima",
  role: "Responsable des approvisionnements frais, Celtis",
} as const;
const EFFLAM = { de: "Efflam Jézéquel", role: "Directeur industriel" } as const;

/** Ce que les décisions révèlent, dans l'ordre où un responsable énergie les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les relevés par usage et la décomposition de la facture",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    usages:
      "Votre diagnostic de la semaine 1 était juste : personne ne savait où partait l'énergie. Le froid et l'eau chaude des nettoyages dominaient, et l'air comprimé fuyait de 30 %, jour et nuit.",
    prix: "En semaine 1, vous avez retenu le prix : une vraie cause de la hausse, mais pas celle sur laquelle l'usine avait prise d'abord. Un contrat se dimensionne sur une consommation qu'on connaît, et personne ne la connaissait usage par usage.",
    heures:
      "En semaine 1, vous avez retenu les heures de production ; le contrat était indexé sur la moyenne mensuelle du marché, et seul l'acheminement distinguait les heures, de 12 €/MWh.",
    vetuste:
      "En semaine 1, vous avez retenu la vétusté des équipements ; les relevés montraient surtout des fuites, des réglages et une chaleur perdue, que l'on traite sans tout remplacer.",
  };
  const justes = ["usages", "prix"];
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
    score: d === "usages" ? 1 : d === "prix" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const incidents = [
    t.sanction === "rappel"
      ? "un lot a dû être rappelé"
      : t.sanction === "lots"
        ? "des lots ont été bloqués à l'autocontrôle"
        : null,
    t.dereference ? "Celtis a déréférencé une référence après les ruptures" : null,
    t.auDela > 0
      ? `le contrat de trois ans coûtera ${kE(t.auDela)} de plus que le marché à terme les deux années suivantes`
      : null,
  ].filter(Boolean);
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à la facture en arrêtant une ligne, en touchant à la chaîne du froid ou en figeant trois ans de prix : vous avez traité la consommation d'abord, puis le contrat."
        : `Sous la pression de la facture, vous avez ${n} fois sur ${ETAPES.length} décisions arrêté une ligne aux heures chères, relevé la consigne des chambres froides ou signé trois ans de prix fixe sur tout le volume. Une ligne arrêtée déplace l'énergie sans la réduire et fait des ruptures ; la chaîne du froid ne s'arbitre pas ; un prix fixe sur le volume d'avant fige un prix haut et facture les économies.${
            incidents.length ? ` Ce trimestre, ${incidents.join(" ; ")}.` : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    FUITES_AN,
    "d'électricité perdue chaque année dans les fuites d'air comprimé",
    "MWh",
    { juste: 50, proche: 150 },
    (e) => `${nombre(e, 0)} MWh`,
  );

  // La méthode : mesurer, réparer, investir sur ce qui est mesuré, tenir les gains ; jamais le froid.
  const froidTenu = p.chemin[D.canicule] !== 0;
  const mesure = p.chemin[D.mesure] === 1 || p.chemin[D.mesure] === 2;
  const repare = p.chemin[D.reglages] === 0;
  const recupere = p.chemin[D.chaleur] === 0;
  const tenu = p.chemin[D.suivi] === 0;
  const bons = [mesure, repare, recupere, tenu].filter(Boolean).length;
  const methode: Constat = {
    score: !froidTenu ? 0 : bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      froidTenu
        ? "Vous n'avez pas touché à la consigne des chambres froides."
        : "Vous avez relevé la consigne des chambres froides pour économiser : la sécurité des aliments n'est pas une variable de la facture."
    } ${
      mesure
        ? p.chemin[D.mesure] === 1
          ? "Vous avez mesuré usage par usage dès la première semaine."
          : "Vous avez fait mesurer l'usine, mais le rapport est arrivé après les réglages."
        : "L'usine n'a jamais été mesurée usage par usage."
    } ${
      repare
        ? "Les fuites et les réglages ont été traités en premier."
        : "Les fuites et les réglages, les gains les moins chers, sont restés en l'état."
    } ${
      recupere
        ? "La chaleur des groupes froids préchauffe l'eau des NEP."
        : p.chemin[D.chaleur] === 1
          ? "La pompe à chaleur remplace du gaz bon marché par de l'électricité chère : elle ne paie guère."
          : "La chaleur des groupes froids part toujours dans l'air."
    } ${
      tenu
        ? "Le suivi mensuel garde les gains."
        : "Sans suivi, une partie des fuites et des réglages reviendra dans l'année."
    } Économies durables : ${mwh(t.economiesMwh)} par an.`,
  };

  return [information, diagnostic, reflexe, calibrage, methode];
}

export function axe([information, diagnostic, reflexe, calibrage, methode]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Mesurer avant d'agir",
      texte: `Rejouez l'épisode en relevant d'abord les sous-compteurs et l'usine un dimanche : le froid et l'eau chaude des NEP dominaient, et l'air comprimé fuyait de ${FUITES_KW} kW, jour et nuit. La facture et le contrat disaient que l'heure ne changeait presque rien au prix.`,
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Traiter la consommation avant le prix et l'horaire",
      texte:
        "Arrêter une ligne aux heures chères déplace l'énergie sans la réduire, et fait des ruptures ; relever la consigne du froid met en jeu la sécurité des aliments ; un prix fixe de trois ans sur le volume d'avant fige un prix haut et facture les économies à venir. Réparez, réglez, investissez sur ce qui est mesuré, puis couvrez le volume qui reste.",
    };
  }
  if (methode!.score === 0) {
    return {
      titre: "Mesurer, réparer, puis couvrir",
      texte:
        "Les fuites et les réglages coûtent peu et agissent en deux semaines ; la récupération de chaleur se calcule ; le suivi garde les gains. Et la consigne des chambres froides reste celle du plan de maîtrise sanitaire, quoi qu'il arrive.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où part l'énergie",
      texte:
        "Le prix a fait monter la facture, mais c'est la consommation qu'une usine maîtrise d'abord : usage par usage, on trouve des fuites, des réglages et de la chaleur perdue, et on sait ensuite quel volume couvrir.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul des fuites",
      texte: `${FUITES_KW} kW appelés le dimanche, lignes arrêtées, sur ${nombre(HEURES_AN, 0)} heures : ${mwh(FUITES_AN)} par an, 30 % de l'électricité des compresseurs, environ ${kE(FUITES_AN * PRIX_ELEC)} à ${parMwh(PRIX_ELEC)}. C'est le chiffre qui dit ce que vaut une tournée des fuites.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_ENERGIE_USINE: Episode<Trimestre> = {
  code: "energie-de-l-usine",
  numero: 102,
  domaine: "Réduire la consommation d'énergie d'une usine",
  titre: "La facture d'énergie de l'usine",
  resume:
    "Une laiterie dont la facture d'énergie a presque doublé, un prix fixe de trois ans à signer, une ligne à arrêter aux heures chères. Mesurer et réparer d'abord, couvrir ensuite.",
  persona:
    "Vous êtes Djibril Ouedraogo, responsable énergie et travaux neufs de la Laiterie de Kerbrélan, entreprise familiale de 520 salariés : yaourts, fromage blanc, desserts lactés et crème fraîche, sous la marque Kerbrélan et sous marque de distributeur. Votre priorité : l'usine de Loudéac, ses six lignes de conditionnement, ses chambres froides, l'eau chaude des nettoyages en place, ses pasteurisateurs et son air comprimé. Le trimestre va de juillet à septembre : l'été, les groupes froids à plein régime, et peut-être une canicule.",
  mandat: [
    { fort: kE(BUDGET), texte: "de budget énergie pour le trimestre, mesures comprises" },
    { fort: kE(BUDGET_AN), texte: "de budget énergie pour l'an prochain" },
    { fort: taux(OBJECTIF_SERVICE, 1), texte: "de taux de service, attendu par les enseignes" },
    {
      fort: "4 °C",
      texte: "dans les chambres froides : la consigne du plan de maîtrise sanitaire",
    },
  ],
  jugement:
    "Le comité de direction juge le trimestre sur l'énergie de quinze mois : l'écart au budget du trimestre (la facture, les mesures, les ruptures, les incidents), plus l'écart au budget de l'an prochain tel qu'on peut l'estimer en fin de trimestre (les économies que l'usine garde, le contrat engagé au prix du marché à terme, les annuités des investissements), moins ce qu'un contrat de trois ans coûtera de plus que le marché à terme les deux années suivantes.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre usine",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, l'usine tourne une semaine de plus avec ses fuites et ses réglages d'avant.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Iwan Szymanski",
        role: "Directeur administratif et financier",
        alerte: true,
        texte: `Pendant ce temps, l'usine a tourné comme avant : ${euros(perdu)} d'énergie qu'on aurait pu ne pas payer.`,
      };
    },
  },
  prevision: {
    libelle: "l'électricité perdue chaque année dans les fuites d'air comprimé, en MWh",
    unite: "MWh",
    placeholder: "500",
    min: 0,
    max: 5000,
    step: 1,
    reel: () => FUITES_AN,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "couts",
      nom: "Coût de l'énergie",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `facture, mesures et ruptures ; à date : ${kE(l.budgetADate ?? 0)} prévus`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.couts ?? 0) / BUDGET),
              enRetard: (l.couts ?? 0) > l.budgetADate,
            }
          : null,
    },
    {
      cle: "elec",
      nom: "Électricité de la semaine",
      format: mwh,
      sensBon: -1,
      aide: () => `objectif du comité : ${mwh(OBJECTIF_ELEC)} au plus`,
    },
    {
      cle: "prixMarche",
      nom: "Prix de l'électricité",
      format: parMwh,
      sensBon: -1,
      aide: () => "au contrat indexé, tout compris",
    },
    {
      cle: "fuitesKw",
      nom: "Fuites d'air comprimé",
      format: (v) => `${nombre(v, 0)} kW`,
      sensBon: -1,
      aide: (_, l) =>
        l.fuitesKw == null ? "inconnues sans relevés par usage" : "puissance perdue, jour et nuit",
    },
    {
      cle: "service",
      nom: "Taux de service",
      format: (v) => taux(v, 1),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => `attendu par les enseignes : ${taux(OBJECTIF_SERVICE, 1)}`,
    },
  ],
  contexte(l, decisions) {
    const terme = l.aTerme ?? SPOT * A_TERME;
    return {
      couts: kE(l.couts ?? 0),
      budgetADate: kE(l.budgetADate ?? 0),
      elec: mwh(l.elec ?? ELEC),
      prix: parMwh(l.prixMarche ?? 0),
      fuites: l.fuitesKw == null ? "inconnues, faute de relevés" : `${nombre(l.fuitesKw, 0)} kW`,
      service: taux(l.service ?? 0, 1),
      aTerme: `${nombre(terme, 1)} €/MWh`,
      aTermeIndexe: `${nombre(terme * PROFIL + MARGE_INDEXE, 1)} €/MWh`,
      volumeMesure: mwh(l.volumeMesure ?? ELEC_AN),
      campagne: decisions[D.mesure] === 1,
      mesure: decisions[D.mesure] === 1 || decisions[D.mesure] === 2,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    return [
      ["Coût de la période", kE(cout)],
      [`Électricité, sem. ${a}`, mwh(t.semaines[a]!.elec)],
      [`Taux de service, sem. ${a}`, taux(t.semaines[a]!.service, 1)],
    ];
  },
  courbe: {
    titre: "Électricité consommée, semaine par semaine",
    cle: "elec",
    cible: OBJECTIF_ELEC,
    libelleCible: `objectif du comité : ${mwh(OBJECTIF_ELEC)} par semaine`,
    graduations: [350, 400, 450, 500, 550],
    format: (v) => `${nombre(v, 0)}`,
    details: (s) => [
      `électricité ${mwh(s.elec!)} · froid ${mwh(s.froid!)}`,
      `${parMwh(s.prixPaye!)} payés · service ${taux(s.service!, 1)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.chaleur && (choix === 0 || choix === 1)) {
      // Le dossier d'aide est accepté en entier ou réduit, selon le hasard du trimestre.
      const i = choix === 0 ? INVESTISSEMENTS.recuperation : INVESTISSEMENTS.pompe;
      return [
        {
          ...LAVINIA,
          texte: aideReduite(graine)
            ? REPONSES.aideReduite(i.aideReduite, i.aide)
            : REPONSES.aideAccordee(i.aide),
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = arrive.t;
    const h = hasard(graine);
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    if (arrive.canicule) {
      const c = CANICULES[h.canicule];
      lies.push({
        ...EFFLAM,
        heure: `sem. ${h.debutCanicule}`,
        alerte: true,
        texte:
          h.canicule === "forte"
            ? `La canicule est là, et elle est forte : 36 °C à Loudéac, pour ${c.semaines} semaines selon les prévisions. Les groupes froids tournent sans arrêt, et le prix de gros de l'électricité s'envole.`
            : `Vague de chaleur : 32 °C à Loudéac, pour ${c.semaines} semaines selon les prévisions. Les groupes froids tournent plus, et le prix de gros de l'électricité monte.`,
      });
    }
    if (arrive.panne) {
      lies.push({
        ...KLERVI,
        heure: `sem. ${h.debutCanicule + 1}`,
        alerte: true,
        texte:
          chemin[D.canicule] === 2
            ? "Le groupe froid n° 2 a décroché en pleine chaleur : haute pression en sécurité. Le groupe de secours a pris le relais en trois heures ; aucune chambre n'a dépassé sa consigne."
            : `Le groupe froid n° 2 a décroché en pleine chaleur : haute pression en sécurité, deux jours de réparation. La chambre 3 a dépassé sa consigne : les produits finis qu'elle contenait sont déclassés, et des commandes partent incomplètes. Environ ${kE(PERTE_PANNE)}.`,
      });
    }
    if (arrive.lots) {
      lies.push({
        ...ANNAIG,
        heure: "sem. 7",
        alerte: true,
        texte:
          "Deux lots de fromage blanc sont non conformes à l'autocontrôle de fin de vie, après trois semaines à 6 °C. Ils sont bloqués et déclassés, et la consigne revient à 4 °C aujourd'hui.",
      });
    }
    if (arrive.rappel) {
      lies.push({
        ...ANNAIG,
        heure: "sem. 8",
        alerte: true,
        texte:
          "Un lot de crèmes desserts déjà livré dépasse un critère microbiologique à l'analyse de fin de vie. Nous engageons un retrait-rappel avec la DDPP, et Celtis suspend la référence le temps de l'enquête. La consigne revient à 4 °C aujourd'hui.",
      });
    }
    if (arrive.dereference) {
      lies.push({
        ...NEDJMA,
        heure: `sem. ${semaineDereferencement(chemin)}`,
        alerte: true,
        texte:
          "Votre taux de service sur les desserts est passé sous 98 % plusieurs semaines de suite. Nous déréférençons le riz au lait 4 × 125 g dans nos supermarchés, et nous appliquons les pénalités logistiques prévues.",
      });
    }
    if ((chemin[D.chaleur] === 0 && dans(12)) || (chemin[D.chaleur] === 1 && dans(13))) {
      lies.push({
        ...LAVINIA,
        heure: `sem. ${chemin[D.chaleur] === 0 ? 12 : 13}`,
        texte:
          "L'installation est en service : l'eau des nettoyages arrive préchauffée par la chaleur des condenseurs.",
      });
    }
    if (chemin[D.contrat] !== undefined && dans(13) && t.auDela > 0) {
      lies.push({
        de: "Iwan Szymanski",
        role: "Directeur administratif et financier",
        heure: "sem. 13",
        texte: `Le marché à terme a fini septembre à ${parMwh(t.aTerme13)} de base. Notre contrat de trois ans est à ${CONTRAT.triennal} € : je vois bien l'écart.`,
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
    titre: (t) => ecartAuxBudgets(t.objectif),
    formatObjectif: kE,
    noteDesBarres:
      "Écart aux budgets énergie du trimestre et de l'an prochain, estimé en fin de trimestre : facture, mesures, ruptures et incidents, économies que l'usine garde, contrat engagé et investissements, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Coût du trimestre",
          valeur: kE(t.couts),
          aide: `budget ${kE(BUDGET)}, mesures, ruptures et incidents compris`,
          tenu: t.couts <= BUDGET,
        },
        {
          nom: "Économies durables",
          valeur: mwh(t.economiesMwh),
          aide: `par an, ${kE(t.economies)} au prix à terme ; objectif ${mwh(OBJECTIF_ECONOMIES)}`,
          tenu: t.economiesMwh >= OBJECTIF_ECONOMIES,
        },
        {
          nom: "Taux de service",
          valeur: taux(t.serviceMoyen, 1),
          aide: `en moyenne ; attendu ${taux(OBJECTIF_SERVICE, 1)}${t.dereference ? " ; une référence déréférencée" : ""}`,
          tenu: t.serviceMoyen >= OBJECTIF_SERVICE && !t.dereference,
        },
        {
          nom: "Chaîne du froid",
          valeur:
            t.sanction === "rappel"
              ? "un rappel"
              : t.sanction === "lots"
                ? "lots bloqués"
                : t.casse
                  ? "produits déclassés"
                  : "tenue",
          aide:
            t.sanction || t.casse
              ? "consigne relevée ou groupe froid en panne"
              : "aucun lot bloqué ni déclassé",
          tenu: !t.sanction && !t.casse,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const c = CANICULES[h.canicule];
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre[0]!.toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "L'été",
          texte:
            h.canicule === "aucune"
              ? "n'a pas connu de canicule : c'est le cas un peu plus d'une fois sur trois."
              : `a connu ${c.nom} de ${c.semaines} semaines à partir de la semaine ${h.debutCanicule} : une fois sur quatre elle est forte, quatre fois sur dix modérée.${
                  t.panne ? " Un groupe froid a décroché pendant la chaleur." : ""
                }`,
        },
        {
          titre: "Le marché",
          texte: `à terme a fini le trimestre à ${parMwh(t.aTerme13)} de base, pour ${nombre(SPOT * A_TERME, 1)} €/MWh au départ.`,
        },
        ...(t.aideReduite
          ? [
              {
                titre: "Les certificats d'économies d'énergie",
                texte: "ont été réduits : c'est le cas une fois sur trois environ.",
              },
            ]
          : []),
        ...(t.sanction || t.dereference
          ? [
              {
                titre: "Les contrôles et les enseignes",
                texte: [
                  t.sanction === "rappel"
                    ? "un lot livré a été rappelé"
                    : t.sanction === "lots"
                      ? "deux lots ont été bloqués à l'autocontrôle"
                      : null,
                  t.dereference ? "Celtis a déréférencé une référence" : null,
                ]
                  .filter(Boolean)
                  .join(", ")
                  .concat("."),
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
