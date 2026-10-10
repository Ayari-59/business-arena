/**
 * ÉPISODE 26 — LE CONTRÔLE QUI S'ANNONCE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Émilie montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent d'elle.
 *
 * Deux contournements du contrat `Episode`, comme dans le budget, le projet et le quai :
 * `lire` renvoie des clés que le tableau de bord n'affiche pas (le taux relevé
 * par le contrôleur, les remises qu'il a relevées) pour nourrir les messages
 * et les sources ; et ce qui suit une décision selon un choix antérieur ou le
 * hasard (la mise en service du circuit, la découverte des accords antidatés,
 * la sanction, le contrôle de suite) passe par `evenements().lies`.
 */
import {
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_TAUX,
  PERTE_PAR_JOUR,
  contestationEntendue,
  evenements,
  fournisseurSuspend,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/controle-qui-s-annonce";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/controle-qui-s-annonce";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jours = (v: number) => `${nombre(v, 0)} j`;
const points = (v: number) => `${nombre(v * 100)} pt`;
/** Un écart au budget de conformité : positif, la filiale est restée en dessous. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget de conformité` : `${kE(-v)} au-delà du budget de conformité`;
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/** Ce que les décisions révèlent, dans l'ordre où une responsable de la conformité les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient où les factures attendaient",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    circuit:
      "Votre diagnostic de la semaine 1 était juste : les factures attendaient un bon pour accord en agence et une signature unique ; la comptabilité, elle, payait en quatre jours.",
    arriere:
      "En semaine 1, vous avez vu l'arriéré : un vrai stock de factures échues, mais un symptôme. Le circuit de validation le remplissait aussitôt qu'on le vidait.",
    tresorerie:
      "En semaine 1, vous avez retenu la trésorerie ; la filiale avait 1,6 million d'euros disponibles et une ligne de crédit inutilisée.",
    comptabilite:
      "En semaine 1, vous avez retenu la lenteur de la comptabilité ; elle payait en quatre jours ce qu'on lui transmettait validé.",
  };
  const justes = ["circuit", "arriere"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En semaine 3, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En semaine 3, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En semaine 3, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "circuit" ? 1 : d === "arriere" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes de l'avant-contrôle : ni tout bloquer, ni « nettoyer » à la va-vite, ni minimiser."
        : `Sous la menace du contrôle, vous avez choisi ${n} fois sur ${ETAPES.length} décisions de bloquer, de « nettoyer » à la va-vite ou de minimiser. Le contrôleur mesure ce qui s'est passé et ce qu'on lui montre, pas l'apparence des dossiers.`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.retard * 100,
    "de factures payées en retard en semaine 3",
    "%",
    { juste: 2, proche: 5 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  let conformite: Constat;
  if (t.nettoyage) {
    conformite = {
      score: 0,
      texte: `Vous avez laissé antidater des accords de remise. Ce n'est pas une habileté : c'est un faux. ${
        t.nettoyageDecouvert
          ? "Le contrôleur l'a découvert en semaine 9 : amende doublée sur les remises, avocat pénaliste, et une sanction alourdie sur tout le reste du dossier."
          : "Le contrôleur ne l'a pas découvert cette fois ; rejoué sous trente tirages, il l'est près d'une fois sur deux, et même caché, il a coûté plus cher qu'une régularisation honnête."
      }`,
    };
  } else {
    const montre = p.chemin[D.remises] === 0 && p.chemin[D.controle] === 0;
    const causes =
      (p.chemin[D.circuit] === 0 || p.chemin[D.circuit] === 1) && p.chemin[D.suite] === 0;
    const total = (montre ? 1 : 0) + (causes ? 1 : 0);
    conformite = {
      score: total === 2 ? 1 : total === 1 ? 0.6 : 0,
      texte: `${
        montre
          ? "Vous avez montré au contrôleur ce que vous saviez, remises régularisées et corrections à l'appui : ce qu'on signale pèse bien moins que ce qu'il trouve."
          : "Le contrôleur a dû chercher lui-même une partie des écarts : ce qu'il trouve seul pèse plus lourd que ce qu'on lui montre."
      } ${
        causes
          ? "Et vous avez corrigé le circuit de validation, puis formé les équipes pour que la correction tienne."
          : "Les causes — le circuit de validation, les habitudes en agence — n'ont pas été traitées jusqu'au bout."
      }`,
    };
  }

  return [information, diagnostic, reflexe, calibrage, conformite];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  conformite,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Savoir avant le contrôleur",
      texte:
        "Rejouez l'épisode en suivant d'abord le parcours des factures en retard : elles attendaient 38 jours en agence et une signature unique, quand la comptabilité payait en quatre jours. Ce que vous savez, vous pouvez le montrer.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Corriger plutôt que bloquer ou maquiller",
      texte:
        "Geler les paiements met tout en retard ; payer l'arriéré en urgence le vide pour trois semaines ; minimiser laisse le contrôleur trouver seul. Et antidater un dossier n'est jamais une option : c'est la pire. Cherchez la cause et corrigez-la.",
    };
  }
  if (conformite!.score === 0) {
    return {
      titre: "Montrer les écarts, corriger les causes",
      texte:
        "Un écart documenté avec son plan de correction coûte bien moins qu'un écart découvert ; un dossier maquillé coûte tout. Présentez ce que vous savez, puis faites tenir la correction : circuit, délégations, formation.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où les factures attendent",
      texte:
        "Un retard de paiement n'est presque jamais un problème de caisse ni de comptables : suivez une facture du courrier au virement, et regardez où elle dort.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Notez vos prévisions chiffrées et comparez-les au réalisé : c'est le moyen le plus rapide d'affiner votre jugement.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Un échantillon clément ou un prestataire à l'heure peuvent flatter un trimestre : si le résultat tient, votre méthode tient.",
  };
}

const CONTROLEUR = { de: "Pascal Ménard", role: "Inspecteur, DGCCRF" } as const;
const PRESTATAIRE = { de: "Cyril Boissonnet", role: "Chef de projet chez le prestataire" } as const;

export const EPISODE_CONFORMITE: Episode<Trimestre> = {
  code: "controle-qui-s-annonce",
  numero: 12,
  domaine: "Conformité et contrôle interne",
  titre: "Le contrôle qui s'annonce",
  resume:
    "Un contrôle de l'administration annoncé dans sept semaines, et des dossiers qui ne sont pas en ordre. Savoir avant le contrôleur, corriger les causes, montrer plutôt que maquiller.",
  persona:
    "Vous êtes Émilie Masson, responsable du contrôle de gestion et de la conformité d'Arvel Négoce Rhône, filiale d'Arvel Distribution à Vénissieux : quatre agences, 210 salariés, environ 500 factures fournisseurs par semaine. Votre équipe : Maëlle Kerbrat, contrôleuse de gestion ; et, pour tout ce qui touche à la conformité, la comptabilité fournisseurs de Bérénice Hoarau.",
  mandat: [
    { fort: "5 %", texte: "de factures payées en retard, au plus" },
    { fort: "60 jours", texte: "de délai de paiement : le plafond légal" },
    { fort: "Aucune", texte: "remise sans écrit ni mention sur la facture" },
    { fort: kE(BUDGET), texte: "de budget de conformité pour le trimestre" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget de conformité de la filiale : pénalités et intérêts de retard, amendes, mise en conformité et temps des équipes compris.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre filiale",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les factures qui attendent continuent de coûter des intérêts et des indemnités de retard.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Bérénice Hoarau",
        role: "Responsable de la comptabilité fournisseurs",
        alerte: true,
        texte: `Pendant ce temps, rien n'a bougé dans les agences : intérêts et indemnités de retard, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "la part des factures payées en retard en semaine 3, en %",
    unite: "%",
    placeholder: "18",
    min: 0,
    max: 100,
    step: 1,
    reel: (t) => t.semaines[3]!.retard * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "retard",
      nom: "Factures payées en retard",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: -1,
      aide: () => `objectif : ${taux(OBJECTIF_TAUX, 0)} au plus`,
    },
    {
      cle: "delai",
      nom: "Délai moyen de paiement",
      format: jours,
      sensBon: -1,
      aide: () => "plafond légal : 60 jours",
    },
    {
      cle: "echues",
      nom: "Factures échues non payées",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) => (semaine ? `fin de semaine ${semaine}` : "ce matin"),
    },
    {
      cle: "remises",
      nom: "Remises sans justificatif",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) => (semaine ? "dans les dossiers" : "repérées par le sondage"),
    },
    {
      cle: "couts",
      nom: "Coûts de conformité engagés",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.couts ?? 0) / BUDGET),
              enRetard: (l.couts ?? 0) > l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    return {
      retard: taux(l.retard ?? 0, 0),
      delai: jours(l.delai ?? 0),
      echues: nombre(l.echues ?? 0, 0),
      remises: nombre(l.remises ?? 0, 0),
      controle: taux(l.controle ?? 0),
      relevees: nombre(l.relevees ?? 0, 0),
      auditCible: decisions[D.audit] === 0,
      auditFait: decisions[D.audit] === 1 || decisions[D.audit] === 2,
      circuitCorrige: decisions[D.circuit] === 0 || decisions[D.circuit] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    return [
      [`En retard, sem. ${a}`, taux(t.semaines[a]!.retard, 0)],
      [`Factures échues, sem. ${a}`, nombre(t.semaines[a]!.echues, 0)],
      ["Coût de la période", kE(cout)],
    ];
  },
  courbe: {
    titre: "Factures payées en retard, semaine par semaine",
    cle: "retard",
    cible: OBJECTIF_TAUX,
    libelleCible: `objectif : ${taux(OBJECTIF_TAUX, 0)} au plus`,
    graduations: [0.05, 0.2, 0.4, 0.6],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${taux(s.retard!)} en retard · ${nombre(s.echues!, 0)} factures échues`,
      `délai moyen ${jours(s.delai!)} · ${pluriel(s.remises!, "remise")} sans justificatif`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.audit && choix === 2) {
      // Seul le choix de geler compte : le fournisseur répond selon le hasard du trimestre.
      const suspend = fournisseurSuspend([2, ...NEUTRE.slice(1)], graine);
      return [
        {
          de: "Hamid Zeroual",
          role: "Responsable crédit, Plâtres du Forez",
          alerte: suspend,
          texte: suspend ? REPONSES.fournisseurSuspend : REPONSES.fournisseurPatiente,
        },
      ];
    }
    if (etape === D.rapport && choix === 1) {
      return [
        {
          ...CONTROLEUR,
          texte: contestationEntendue(graine)
            ? REPONSES.contestationEntendue
            : REPONSES.contestationRejetee,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    if (arrive.fournisseur) {
      lies.push({
        de: "Moussa Konaté",
        role: "Chef d'agence, Saint-Priest",
        heure: "sem. 3",
        alerte: true,
        texte:
          "Plus une plaque de plâtre livrée depuis lundi. J'ai renvoyé trois artisans chez un concurrent cette semaine.",
      });
    }
    if (arrive.miseEnService) {
      lies.push({
        ...PRESTATAIRE,
        heure: "sem. 6",
        alerte: t.refonteGlisse,
        texte: t.refonteGlisse
          ? "Le paramétrage des délégations a pris du retard : la mise en service est reportée en semaine 9. D'ici là, l'ancien circuit continue."
          : "Mise en service faite. Les factures arrivent par voie électronique, les chefs d'agence sont relancés au septième jour.",
      });
    }
    if (t.refonte && t.refonteGlisse && dans(9)) {
      lies.push({
        ...PRESTATAIRE,
        heure: "sem. 9",
        texte: "Le nouveau circuit est en service, avec trois semaines de retard. Désolé.",
      });
    }
    if (arrive.decouverte) {
      lies.push({
        ...CONTROLEUR,
        heure: "sem. 9",
        alerte: true,
        texte:
          "Deux artisans interrogés déclarent avoir signé en semaine 6 des accords datés de l'an dernier. Il s'agit de faux. J'étends mes vérifications à l'ensemble de vos pratiques commerciales et je transmets ces éléments au procureur de la République.",
      });
    }
    if (arrive.sanction) {
      lies.push({
        de: "Administration",
        role: "Décision de sanction",
        heure: "sem. 12",
        alerte: true,
        texte: `Amende administrative de ${euros(t.amendeDelais)} pour retards de paiement${
          t.amendeRemises
            ? `, et de ${euros(t.amendeRemises)} pour manquements aux règles de facturation`
            : ""
        }. Injonction de mise en conformité, dont le respect pourra être vérifié.`,
      });
    }
    if (arrive.suite) {
      lies.push({
        ...CONTROLEUR,
        heure: "sem. 13",
        alerte: t.suiteManquee,
        texte: t.suiteManquee
          ? `Vérification de l'injonction : les factures des deux dernières semaines montrent encore des retards ou des remises sans écrit. Nouvelle amende : ${euros(t.amendeSuite)}.`
          : "Vérification de l'injonction : les factures des deux dernières semaines sont payées dans les délais et les remises documentées. Dossier clos.",
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
    titre: (t) => ecartAuBudget(t.objectif),
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de conformité de la filiale, pénalités, intérêts, amendes, mise en conformité et temps des équipes compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Délais de paiement",
          valeur: taux(t.retardFinal),
          aide: `payées en retard en semaine 13 ; objectif ${taux(OBJECTIF_TAUX, 0)}`,
          tenu: t.retardFinal <= OBJECTIF_TAUX,
        },
        {
          nom: "Amende pour retards",
          valeur: kE(t.amendeDelais),
          aide: `taux relevé par le contrôleur : ${taux(t.tauxControle)}`,
          tenu: t.amendeDelais <= 20000,
        },
        {
          nom: "Facturation",
          valeur: t.nettoyage
            ? "accords antidatés"
            : t.remisesRelevees
              ? pluriel(t.remisesRelevees, "remise") +
                " relevée" +
                (t.remisesRelevees > 1 ? "s" : "")
              : "rien relevé",
          aide: t.nettoyage
            ? t.nettoyageDecouvert
              ? "découverts par le contrôleur"
              : "non découverts cette fois"
            : `amende : ${kE(t.amendeRemises)}`,
          tenu: !t.nettoyage && t.remisesRelevees <= 5,
        },
        {
          nom: "Injonction",
          valeur: !t.controleDeSuite ? "pas vérifiée" : t.suiteManquee ? "manquement" : "respectée",
          aide: t.controleDeSuite ? "contrôle de suite en semaine 13" : "pas de contrôle de suite",
          tenu: !t.suiteManquee,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.gel
          ? [
              {
                titre: "Le fournisseur de plaques",
                texte: t.fournisseurSuspend
                  ? "a suspendu ses livraisons pendant le gel des paiements."
                  : "a patienté pendant le gel des paiements.",
              },
            ]
          : []),
        ...(t.refonte
          ? [
              {
                titre: "Le prestataire",
                texte: t.refonteGlisse
                  ? "a mis le nouveau circuit en service avec trois semaines de retard, en semaine 9."
                  : "a tenu sa date : le nouveau circuit était en service en semaine 6.",
              },
            ]
          : []),
        ...(t.nettoyage
          ? [
              {
                titre: "Les accords antidatés",
                texte: t.nettoyageDecouvert
                  ? "ont été découverts par le contrôleur en semaine 9."
                  : "n'ont pas été découverts cette fois. Le risque, lui, était bien là : près d'une fois sur deux.",
              },
            ]
          : []),
        {
          titre: "Le contrôle",
          texte: [
            `l'échantillon a relevé ${taux(t.tauxControle)} de factures en retard, mois précédant le trimestre compris`,
            t.contestationEntendue ? "la contestation a été en partie entendue" : null,
            t.controleDeSuite
              ? t.suiteManquee
                ? "le contrôle de suite a relevé un manquement"
                : "le contrôle de suite n'a rien relevé"
              : "il n'y a pas eu de contrôle de suite",
          ]
            .filter(Boolean)
            .join(", ")
            .replace(/^./, (c) => c.toUpperCase())
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
