/**
 * ÉPISODE 28 — LE NOUVEAU SERVICE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de suivi de Chloé montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  AGENCES,
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  KIT_PLEIN,
  NEUTRE,
  PERTE_PAR_JOUR,
  PILOTES,
  PLAN_LOCATIONS,
  RESEAU,
  SEUIL_OUVERTURE,
  SEUIL_UTILISATION,
  evenements,
  ferlaneAccepte,
  hasard,
  niveauDeDemande,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/nouveau-service";
import {
  ATTENTES,
  DIAGNOSTICS,
  ETAPES,
  PROMESSES,
  REFERENCES,
  REPONSES,
} from "@/config/episodes/nouveau-service";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un écart au budget : positif, le service a fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const agences = (v: number) => pluriel(Math.round(v), "agence");
const locations = (v: number) =>
  `${nombre(Math.round(v), 0)} location${Math.round(v) > 1 ? "s" : ""}`;
/** La marge par location en dessous de laquelle la casse et les retards mangent le service. */
const MARGE_CIBLE = 70;
const RETOUR_CIBLE = 0.5;

/** Ce que les décisions révèlent, dans l'ordre où une cheffe de produit les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce que les artisans louent vraiment et ce qu'un parc doit tourner pour payer",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    inconnue:
      "Votre diagnostic de la semaine 1 était juste : personne ne savait combien les artisans loueraient, et la seule façon de l'apprendre sans risquer 360 k€ de parc était de le mesurer.",
    concurrent:
      "En semaine 1, vous avez vu Ferlane : un vrai concurrent, mais la question d'abord était de savoir combien les artisans loueraient chez Arvel, et à quelles conditions.",
    vitesse:
      "En semaine 1, vous avez craint d'arriver trop tard ; le risque était surtout d'arriver partout avec un parc que personne ne savait remplir.",
    notoriete:
      "En semaine 1, vous avez retenu la notoriété ; le sondage montrait que les artisans aimaient l'idée, pas combien ils loueraient.",
  };
  const justes = ["inconnue", "concurrent"];
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
    score: d === "inconnue" ? 1 : d === "concurrent" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  // Les deux réflexes du métier : tenir la promesse à la direction, ou attendre une étude parfaite.
  const nPromesse = PROMESSES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const nAttente = ATTENTES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const n = nPromesse + nAttente;
  const textePromesse = `Pour tenir la promesse faite à la direction, vous avez choisi le volume ou l'affichage ${nPromesse} fois sur ${ETAPES.length} décisions. Jusqu'à ${kE(t.parcMax)} de parc engagé, pour une demande que personne n'avait mesurée${
    t.provision + t.reventes >= 1000
      ? ` ; ${kE(t.provision + t.reventes)} perdus sur le matériel qui dormait ou qu'il a fallu revendre`
      : ", et une marge rongée par la casse et les baisses de prix"
  }.`;
  const texteAttente = `Vous avez attendu une information plus sûre ${nAttente} fois sur ${ETAPES.length} décisions. Ce que vous cherchiez, le terrain le donnait en quelques semaines ; ${
    t.locations > 0
      ? `le service n'a fait que ${locations(t.locations)} sur le trimestre.`
      : "le service n'a fait aucune location du trimestre."
  }`;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez ni tout lancé pour tenir la promesse, ni attendu une étude parfaite : vous avez testé petit, mesuré, puis décidé sur les chiffres."
        : // Le réflexe qui l'a emporté vient en premier : c'est lui que l'axe de travail vise.
          (nPromesse >= nAttente
            ? [nPromesse ? textePromesse : null, nAttente ? texteAttente : null]
            : [texteAttente, nPromesse ? textePromesse : null]
          )
            .filter(Boolean)
            .join(" "),
  };

  const calibrage = constatCalibrage(
    p,
    t.demandeReelle,
    "par agence et par semaine",
    "locations",
    { juste: 2, proche: 4 },
    (e) => `${nombre(e)} location${e >= 2 ? "s" : ""}`,
  );

  const mesure = p.chemin[D.mesure] === 0;
  const ajuste = p.chemin[D.offre] === 1;
  const points = (mesure ? 1 : 0) + (ajuste ? 1 : 0);
  const domaine: Constat = {
    score: points === 2 ? 1 : points === 1 ? 0.6 : 0,
    texte: `${
      mesure
        ? "Vous avez suivi ce qui dit si un service de location paie : l'utilisation du parc, la marge par location, les clients qui reviennent."
        : p.chemin[D.mesure] === 1
          ? `Vous avez suivi les demandes de devis : ${nombre(t.devis, 0)} sur le trimestre, pour ${locations(t.locations)}. Un chiffre qui monte toujours ne dit pas quand s'arrêter.`
          : "Vous n'avez pas suivi l'utilisation du parc ni la marge par location : vos décisions d'extension se sont prises sur une impression."
    } ${
      ajuste
        ? "Vous avez ajusté l'offre avec les clients du pilote : caution, contrôle au retour, forfait demi-journée."
        : t.locations === 0
          ? "Faute de pilote, rien ne vous a montré ce que le terrain réservait : retours en retard, casse, nettoyage."
          : `Vous n'avez pas traité ce que le terrain montrait — retours en retard, casse, nettoyage : marge moyenne par location, ${euros(t.margeLocation)}${
              t.incident
                ? `, et un échafaudage reloué sans contrôle a cédé en semaine ${t.incident}`
                : ""
            }.`
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, domaine];
}

export function axe([information, diagnostic, reflexe, calibrage, domaine]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  // Le constat des réflexes commence par celui qui l'a emporté : la promesse, ou l'attente.
  const parLaPromesse = reflexe!.texte.startsWith("Pour tenir la promesse");
  if (information!.score < 0.5) {
    return {
      titre: "Mesurer la demande avant d'acheter le parc",
      texte:
        "Rejouez l'épisode en interrogeant d'abord les artisans au comptoir et en regardant ce que loue Ferlane : un sondage dit qu'on aime l'idée, pas combien on louera. Une journée suffisait pour savoir que le plan de la direction était un pari.",
    };
  }
  if (reflexe!.score === 0 && parLaPromesse) {
    return {
      titre: "Tester avant de généraliser",
      texte:
        "Un lancement partout engage tout le parc avant de savoir s'il tournera. Un pilote dans deux agences coûte peu, montre la demande réelle et les problèmes du terrain, et laisse le choix d'étendre, d'ajuster ou d'arrêter.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Apprendre sur le terrain plutôt qu'attendre",
      texte:
        "Une étude parfaite arrive tard et ne voit ni la casse ni les retours en retard. Un petit pilote répond plus vite, et mieux, aux questions qui comptent.",
    };
  }
  if (domaine!.score === 0) {
    return {
      titre: "Suivre les chiffres qui disent si le service paie",
      texte:
        "Les demandes de devis suivent la publicité. Le taux d'utilisation du parc, la marge par location et les clients qui reviennent disent si un service tient debout, et quand l'étendre.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher d'abord ce qu'on ne sait pas",
      texte:
        "Devant un nouveau service, la première question n'est ni le concurrent ni la vitesse : c'est ce que les clients paieront vraiment. Tant qu'elle n'a pas de réponse chiffrée, chaque euro de parc est un pari.",
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
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const DIRECTION = { de: "Rodolphe Laborde", role: "Directeur commercial" } as const;
const FERLANE = { de: "Armand Fauvel", role: "Directeur régional, Ferlane Location" } as const;
const SUIVI = { de: "Tableau de suivi du service", role: "Siège" } as const;

/** Les agences ouvertes ou fermées par une décision, en toutes lettres. */
const liste = (noms: readonly string[]) =>
  noms.length <= 1 ? (noms[0] ?? "") : `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}`;

export const EPISODE_INNOVATION: Episode<Trimestre> = {
  code: "nouveau-service",
  numero: 30,
  domaine: "Innovation et lancement d'offre",
  titre: "Le nouveau service",
  resume:
    "Une location de matériel que la direction veut dans douze agences au trimestre, sans savoir ce que les artisans loueront. Tester avant de généraliser.",
  persona:
    "Vous êtes Chloé Renaud, cheffe de produit au siège d'Arvel Distribution, à Lyon. On vous a confié le lancement d'un service de location de matériel de chantier pour les artisans — échafaudages roulants, bétonnières, perforateurs, petit outillage — dans les douze agences de la région. Vous rendez compte à Idrissa Sangaré, directeur de l'offre.",
  mandat: [
    { fort: `${AGENCES} agences`, texte: "équipées au trimestre, selon la direction" },
    {
      fort: `${PLAN_LOCATIONS} locations`,
      texte: "par agence et par semaine, au plan de la direction",
    },
    {
      fort: taux(SEUIL_UTILISATION, 0),
      texte: "d'utilisation du parc : en dessous, il ne paie pas",
    },
    {
      fort: euros(BUDGET),
      texte: "de perte au plus sur le trimestre : le service doit payer son lancement",
    },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget : la marge des locations et des matériaux qu'elles font vendre, moins ce que coûtent le parc (amortissement, casse, logistique, matériel qui dort) et le lancement. Le budget veut que le service paie son lancement dès ce trimestre.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre service",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les artisans qui demandent du matériel au comptoir partent chez Ferlane, avec leur commande de matériaux.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Nassim Cherif",
        role: "Vendeur comptoir, Vénissieux",
        alerte: true,
        texte: `Pendant ce temps, des artisans qui demandaient une bétonnière sont partis chez Ferlane, et ont acheté leur ciment ailleurs : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle:
      "les locations qu'une agence équipée fera par semaine, au prix prévu, une fois le service connu",
    unite: "loc.",
    placeholder: "12",
    min: 0,
    max: 40,
    step: 1,
    reel: (t) => t.demandeReelle,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "locations",
      nom: "Locations de la semaine",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? l.agences
            ? `dans ${agences(l.agences)} ; ${nombre(l.devis ?? 0, 0)} demandes de devis`
            : "aucune agence ne loue"
          : `le service n'est pas lancé ; plan : ${PLAN_LOCATIONS} par agence`,
    },
    {
      cle: "utilisation",
      nom: "Utilisation du parc",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (_semaine, l) =>
        l.parc
          ? `parc engagé : ${kE(l.parc)} ; seuil : ${taux(SEUIL_UTILISATION, 0)}`
          : `aucun parc ; seuil : ${taux(SEUIL_UTILISATION, 0)}`,
      jauge: (l) =>
        l.utilisation === null
          ? null
          : {
              part: Math.min(1, (l.utilisation ?? 0) / SEUIL_UTILISATION),
              enRetard: (l.utilisation ?? 0) < SEUIL_UTILISATION,
            },
    },
    {
      cle: "margeLocation",
      nom: "Marge par location",
      format: euros,
      sensBon: 1,
      aide: () => "après logistique et casse, matériaux vendus compris",
    },
    {
      cle: "retour",
      nom: "Clients qui reviennent",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => "artisans qui louent de nouveau dans le trimestre",
    },
    {
      cle: "cumul",
      nom: "Contribution du service",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "cumulée depuis le début du trimestre ; budget : au moins 0 en semaine 13"
          : "budget : au moins 0 en fin de trimestre",
    },
  ],
  contexte(l, decisions) {
    const n = l.agences ?? 0;
    return {
      loue: n > 0,
      etude: decisions[D.lancement] === 3,
      agences: agences(n),
      locations: nombre(l.locations ?? 0, 0),
      devis: nombre(l.devis ?? 0, 0),
      refuses: nombre(l.refuses ?? 0, 0),
      utilisation: taux(l.utilisation ?? 0, 0),
      marge: euros(l.margeLocation ?? 0),
      retour: taux(l.retour ?? 0, 0),
      cumul: kE(l.cumul ?? 0),
      parc: kE(l.parc ?? 0),
      locationsParAgence: nombre(n ? (l.locations ?? 0) / n : 0, 1),
      refusesParAgence: nombre(n ? (l.refuses ?? 0) / n : 0, 1),
      demandeParAgence: nombre(n ? ((l.locations ?? 0) + (l.refuses ?? 0)) / n : 0, 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [`Agences qui louent, sem. ${a}`, nombre(t.semaines[a]!.agences, 0)],
      [`Utilisation du parc, sem. ${a}`, taux(t.semaines[a]!.utilisation, 0)],
      ["Contribution de la période", kE(semaines.reduce((x, w) => x + w.contribution, 0))],
    ];
  },
  courbe: {
    titre: "Utilisation du parc, semaine par semaine",
    cle: "utilisation",
    cible: SEUIL_UTILISATION,
    libelleCible: `seuil : ${taux(SEUIL_UTILISATION, 0)} d'utilisation`,
    graduations: [0, 0.25, 0.5, 0.75, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${locations(s.locations!)} dans ${agences(s.agences!)} · ${nombre(s.devis!, 0)} devis`,
      `marge ${euros(s.margeLocation!)} par location · contribution ${kE(s.contribution!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.ferlane && choix === 2) {
      // Seule la proposition compte : Ferlane répond selon le hasard du trimestre.
      return [
        {
          ...FERLANE,
          texte: ferlaneAccepte(graine) ? REPONSES.ferlaneAccepte : REPONSES.ferlaneRefuse,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = arrive.trimestre;
    const lies: Message[] = [];
    if (arrive.etude) {
      lies.push({
        de: "Cabinet d'études",
        role: "Étude de marché",
        heure: "sem. 9",
        texte: `Conclusions de l'étude : une agence équipée ferait de l'ordre de ${nombre(t.estime, 0)} locations par semaine au prix envisagé, davantage dans les secteurs de gros œuvre. Les artisans attendent un forfait demi-journée et pas de caution en chèque.`,
      });
    }
    if (arrive.extension) {
      const w = chemin[D.lancement] === 3 ? 10 : 7;
      const avant = t.semaines[w - 1]!.agences;
      const apres = t.semaines[w]!.agences;
      // Les agences qui louaient avant l'extension, selon la première décision.
      const deja = [RESEAU.map((_, i) => i), [0, 1, 2, 3, 4, 5], [...PILOTES], [] as number[]][
        chemin[D.lancement] ?? 3
      ]!;
      const ouvertes = RESEAU.filter(
        (x, i) => !deja.includes(i) && t.estime * x.facteur >= SEUIL_OUVERTURE,
      ).map((x) => x.nom);
      lies.push({
        ...SUIVI,
        heure: `sem. ${w}`,
        texte:
          apres > avant
            ? `Les seuils sont tenus : le service compte désormais ${agences(apres)}. ${
                ouvertes.length ? `Nouvelles agences : ${liste(ouvertes)}.` : ""
              }`
            : apres < avant
              ? apres === 0
                ? "Les seuils ne sont pas tenus : le service s'arrête, le parc est revendu. La demande n'est pas là ; mieux vaut le savoir maintenant."
                : `Les seuils ne sont tenus que dans ${agences(apres)} : les autres ferment, leur parc est revendu.`
              : `Les seuils ne justifient ni ouverture ni fermeture : le service reste dans ${agences(apres)}.`,
      });
    }
    if (arrive.incident) {
      lies.push({
        de: "Service sécurité",
        role: "Siège",
        heure: `sem. ${t.incident}`,
        alerte: true,
        texte: `À ${t.lieuIncident}, un échafaudage roulant reloué sans contrôle au retour a cédé : un plateau était fissuré. Un compagnon a chuté de deux mètres, trois semaines d'arrêt. Franchise, expertise et immobilisation des échafaudages : ${euros(8000)}. Les artisans en parlent.`,
      });
    }
    if (arrive.partenariat) {
      lies.push({
        ...FERLANE,
        heure: "sem. 10",
        texte:
          "Nos camions ont repris votre matériel ce matin. Vos comptoirs prennent les réservations, nous faisons le reste.",
      });
    }
    if (chemin[D.fin] === 0 && de <= 13 && a >= 13 && t.agencesFinal > 0) {
      lies.push({
        ...DIRECTION,
        heure: "sem. 13",
        texte: `Le comité a retenu un chiffre : ${taux(t.retourFinal, 0)} des artisans reviennent louer, et achètent leurs matériaux avec.`,
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, parc et lancement compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget du service, marge des locations moins coûts du parc et du lancement, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Utilisation du parc",
          valeur: t.agencesFinal ? taux(t.utilisationFinale, 0) : "—",
          aide: `semaines 10 à 13 ; seuil ${taux(SEUIL_UTILISATION, 0)}`,
          tenu: t.agencesFinal > 0 && t.utilisationFinale >= SEUIL_UTILISATION,
        },
        {
          nom: "Marge par location",
          valeur: t.locations ? euros(t.margeLocation) : "—",
          aide: `en moyenne ; cible ${euros(MARGE_CIBLE)}`,
          tenu: t.locations > 0 && t.margeLocation >= MARGE_CIBLE,
        },
        {
          nom: "Clients qui reviennent",
          valeur: t.agencesFinal ? taux(t.retourFinal, 0) : "—",
          aide: `en fin de trimestre ; cible ${taux(RETOUR_CIBLE, 0)}`,
          tenu: t.agencesFinal > 0 && t.retourFinal >= RETOUR_CIBLE,
        },
        {
          nom: "Parc qui dort",
          valeur: kE(t.provision + t.reventes),
          aide: `dépréciation et reventes ; parc maximal ${kE(t.parcMax)}`,
          tenu: t.provision + t.reventes <= KIT_PLEIN * 0.1,
        },
      ];
    },
    hasard(t, graine) {
      const niveau = niveauDeDemande(graine);
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La demande",
          texte: `était ${niveau} ce trimestre : ${nombre(t.demandeReelle, 0)} locations par agence équipée et par semaine au prix prévu, pour ${PLAN_LOCATIONS} au plan de la direction.`,
        },
        ...(t.partenariat || t.partenariatRefuse
          ? [
              {
                titre: "Ferlane",
                texte: t.partenariat
                  ? "a accepté le partenariat : il a repris le parc en semaine 10."
                  : "a refusé le partenariat.",
              },
            ]
          : []),
        {
          titre: "Les échafaudages",
          texte: t.incident
            ? `Un échafaudage reloué sans contrôle a cédé à ${t.lieuIncident} en semaine ${t.incident}.`
            : "Aucun accident ce trimestre.",
        },
      ];
    },
  },
  comportements,
  axe,
};
