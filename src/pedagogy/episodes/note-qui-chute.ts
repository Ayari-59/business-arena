/**
 * ÉPISODE 54 — LA NOTE QUI CHUTE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de L'Escale Chambéry-Gare montre
 * à Hadrien, ce que la courbe trace, ce sur quoi le bilan le juge, et ce que
 * ses décisions révèlent de lui.
 */
import {
  BUDGET,
  CANICULE,
  CAPACITE,
  COTE_RUE,
  D,
  JOURS_SANS_PERTE,
  MANQUE_PAR_DIXIEME,
  NEUTRE,
  NOTE_REFERENCE,
  NUITEES_PAR_DIXIEME,
  NUITEES_PREVUES,
  PERTE_PAR_JOUR,
  PRIX_GRILLE,
  PRIX_PAR_DIXIEME,
  SEMAINES,
  SEUIL_FILTRE,
  evenements,
  frigoristeRapide,
  hasard,
  prixTenable,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/note-qui-chute";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/note-qui-chute";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Une note sur dix, toujours avec sa décimale : « 8,0 ». */
const note = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const surDix = (v: number) => `${note(v)} / 10`;
const revpar = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €`;

/** Ce que la direction attend de l'été, après la chute de la note. */
export const OBJECTIF_NOTE = 8.5;
export const OBJECTIF_REVPAR = 72;
export const OBJECTIF_NET = 455000;

/** Ce que les décisions révèlent, dans l'ordre où un responsable qualité les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les avis classés par thème et ce que vaut un dixième de note",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    climatisation:
      "Votre diagnostic de la semaine 1 était juste : les climatiseurs côté gare ne tenaient pas la chaleur, et la fenêtre ouverte sur le chantier faisait le reste. Près d'un avis négatif sur deux citait la chaleur.",
    petitDejeuner:
      "En semaine 1, vous avez retenu le petit-déjeuner : une vraie cause, qui pèse de plus en plus quand l'été amène les clients de loisirs, mais la seconde. La chaleur des chambres côté gare venait en tête des avis négatifs, de loin.",
    accueil:
      "En semaine 1, vous avez retenu l'accueil, sur la foi des avis les plus durs : ce sont les plus lus, pas les plus nombreux. L'accueil n'était cité que dans un avis négatif sur dix.",
    travaux:
      "En semaine 1, vous avez retenu le chantier de voirie : le bruit est réel, mais quatre avis sur cinq qui en parlent parlent aussi de fenêtre ouverte. Fenêtre fermée et chambre fraîche, le chantier ne gênait presque plus.",
  };
  const justes = ["climatisation", "petitDejeuner"];
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
    score: d === "climatisation" ? 1 : d === "petitDejeuner" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais soigné l'image à la place de l'hôtel : ni geste sur les avis, ni relance de tous les clients, ni avis récompensés, ni baisse de prix générale."
        : `Face à la note, vous avez choisi ${n} fois sur ${ETAPES.length} décisions de soigner l'image plutôt que l'hôtel : gestes sur les avis, relances, remises, baisse générale des prix. Un avis publié ne change presque jamais, et une relance faite avant d'avoir réparé fait écrire les mécontents.${
            t.gestes > 10000
              ? ` Les gestes ont coûté ${kE(t.gestes)} sur l'été.`
              : t.detecte
                ? " Les avis récompensés ont été retirés, et l'hôtel déclassé."
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    MANQUE_PAR_DIXIEME,
    "de manque à gagner pour un dixième de point de note sur l'été",
    "€",
    { juste: 300, proche: 1000 },
    (e) => euros(e),
  );

  // La note mesurée dans le prix, et réparée dans les règles.
  const prixJuste = p.chemin[D.prix] === 2;
  const regles = p.chemin[D.avis] !== 0;
  const capTenu = p.chemin[D.fin] === 1 || p.chemin[D.fin] === 3;
  const bons = [prixJuste, regles, capTenu].filter(Boolean).length;
  const prixEtCap: Constat = {
    score: bons === 3 ? 1 : bons === 2 ? 0.6 : 0,
    texte: `${
      prixJuste
        ? "Vous avez fait suivre au prix ce que la note permettait de tenir, ni plus ni moins."
        : p.chemin[D.prix] === 1
          ? "Vous avez tenu la grille d'été quand la note ne la permettait plus : les clients sont allés chez des voisins mieux notés."
          : "Vous avez baissé les prix une fois pour toutes : quand la note est remontée, le prix n'a pas suivi."
    } ${
      regles
        ? "Vous n'avez pas acheté d'avis."
        : "Vous avez offert une remise contre des avis, ce que les plateformes interdisent."
    } ${
      capTenu
        ? "En août, vous avez tenu le cap pendant que la note rattrapait les avis récents."
        : "En août, vous avez réagi au retard de la note par une relance ou une promotion : la note rattrapait déjà les avis récents."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, prixEtCap];
}

export function axe([information, diagnostic, reflexe, calibrage, prix]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire les avis par thème avant d'agir",
      texte:
        "Rejouez l'épisode en classant d'abord les avis négatifs par thème : la chaleur des chambres côté gare venait en tête de loin, et les avis les plus durs, sur l'accueil, n'en pesaient qu'un sur dix.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Réparer l'hôtel, pas l'image",
      texte:
        "Un geste ne change pas un avis publié, et une relance avant réparation fait écrire les mécontents. La note est une moyenne de nuits passées chez vous : elle ne remonte que si les nuits suivantes sont meilleures.",
    };
  }
  if (prix!.score === 0) {
    return {
      titre: "Lire la note dans le prix",
      texte:
        "Un dixième de note vaut environ 1 € de prix moyen et une vingtaine de nuitées. Le bon prix suit la note : plus haut, les clients vont chez le voisin ; plus bas, on donne de l'argent sans gagner de clients.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher la cause dans la masse des avis",
      texte:
        "Les avis les plus vifs ne sont pas les plus nombreux. Comptez les thèmes, regardez d'où viennent les mauvaises nuits, et réparez d'abord ce qui en fait le plus.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du dixième de point",
      texte: `${euros(PRIX_PAR_DIXIEME)} de prix sur ${nombre(NUITEES_PREVUES, 0)} nuitées, plus ${NUITEES_PAR_DIXIEME} nuitées perdues au classement à ${euros(PRIX_GRILLE)} : ${euros(MANQUE_PAR_DIXIEME)} par dixième sur l'été. Le prix et la visibilité comptent tous les deux.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_NOTE_EN_LIGNE: Episode<Trimestre> = {
  code: "note-qui-chute",
  numero: 52,
  domaine: "Qualité et expérience client",
  titre: "La note qui chute",
  resume:
    "Un hôtel de gare dont la note en ligne a perdu six dixièmes en trois mois, à l'entrée de l'été. Trouver la cause dans les avis, et mesurer la note dans le prix qu'on peut tenir.",
  persona:
    "Vous êtes Hadrien Morlot, responsable qualité et expérience client du Groupe Escale, au siège d'Annecy. La direction vous envoie à L'Escale Chambéry-Gare, 3 étoiles de 72 chambres face à la gare, dont la note sur Bookalia et Voyagio est passée de 8,7 à 8,1 en trois mois. Vous travaillez avec Ana Sousa, sa directrice, ses équipes de réception, d'étages et de petit-déjeuner, et Lucile Fabbri, la revenue manager du groupe. De juin à août : la chaleur, un chantier de voirie devant la façade, et des clients de loisirs qui remplacent peu à peu les clients d'affaires.",
  mandat: [
    { fort: note(OBJECTIF_NOTE), texte: "de note en ligne à fin août, au moins" },
    { fort: `${OBJECTIF_REVPAR} €`, texte: "de RevPAR sur l'été, au moins" },
    { fort: kE(OBJECTIF_NET), texte: "de chiffre d'affaires hébergement net, au moins" },
    { fort: "aucune entorse", texte: "aux règles de Bookalia et Voyagio" },
  ],
  jugement:
    "La direction générale juge l'été sur le chiffre d'affaires hébergement de juin à août, net des coûts engagés : gestes commerciaux, réparations, renforts, prestataires et locations.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre hôtel",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les clients des chambres côté gare continuent de mal dormir : la réception les reloge ou les dédommage.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Ilias Benchekroun",
        role: "Chef de réception",
        alerte: true,
        texte: `Pendant ce temps, nous avons relogé ou dédommagé les clients qui ne dormaient pas côté gare : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le manque à gagner d'un dixième de point de note sur l'été, en euros",
    unite: "€",
    placeholder: "0",
    min: 0,
    max: 100000,
    step: 10,
    reel: (t) => t.manqueParDixieme,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "note",
      nom: "Note en ligne",
      format: surDix,
      formatEcart: (v) => `${nombre(v, 2)} pt`,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `avis de la semaine : ${note(l.noteSemaine ?? 0)} en moyenne`
          : `Bookalia et Voyagio ; il y a trois mois : ${note(NOTE_REFERENCE)}`,
      // La jauge va de 7 à la note d'avant ; en retard sous le filtre « 8 et plus ».
      jauge: (l) =>
        l.note == null
          ? null
          : {
              part: Math.min(1, Math.max(0, (l.note - 7) / (NOTE_REFERENCE - 7))),
              enRetard: l.note < SEUIL_FILTRE,
            },
    },
    {
      cle: "prixMoyen",
      nom: "Prix moyen",
      format: euros,
      sensBon: 1,
      aide: (_, l) => `prix que la note permet de tenir : ${euros(prixTenable(l.note ?? 0))}`,
    },
    {
      cle: "occupation",
      nom: "Taux d'occupation",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: (semaine) => (semaine ? `semaine ${semaine}` : "en mai"),
    },
    {
      cle: "revpar",
      nom: "RevPAR",
      format: revpar,
      sensBon: 1,
      aide: () => `occupation × prix moyen ; objectif ${OBJECTIF_REVPAR} €`,
    },
    {
      cle: "caNet",
      nom: "CA hébergement net",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `budget de l'été : ${kE(BUDGET)}, à la note d'avant`,
    },
  ],
  contexte(l, decisions) {
    const n = l.note ?? 0;
    return {
      note: note(n),
      noteSemaine: note(l.noteSemaine ?? 0),
      noteRecente: note(l.noteRecente ?? 0),
      recenteAuDessus: (l.noteRecente ?? 0) - n > 0.1,
      prixMoyen: euros(l.prixMoyen ?? 0),
      tenable: euros(prixTenable(n)),
      occupation: taux(l.occupation ?? 0, 0),
      revpar: revpar(l.revpar ?? 0),
      caNet: kE(l.caNet ?? 0),
      climReparee: decisions[D.cause] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const net = semaines.reduce((x, w) => x + w.net, 0);
    const ca = semaines.reduce((x, w) => x + w.ca, 0);
    const nuitees = semaines.reduce((x, w) => x + w.nuitees, 0);
    return [
      [`Note, sem. ${a}`, surDix(t.semaines[a]!.note)],
      ["Prix moyen de la période", euros(nuitees > 0 ? ca / nuitees : 0)],
      ["CA net de la période", kE(net)],
    ];
  },
  courbe: {
    titre: "Note en ligne, semaine par semaine",
    cle: "note",
    cible: NOTE_REFERENCE,
    libelleCible: `note d'avant : ${note(NOTE_REFERENCE)}`,
    graduations: [7, 7.5, 8, 8.5, 9, 9.5],
    format: note,
    details: (s) => [
      `note ${note(s.note!)} · avis de la semaine ${note(s.noteSemaine!)} (${nombre(s.avis!, 0)} avis)`,
      `occupation ${taux(s.occupation!, 0)} · prix moyen ${euros(s.prixMoyen!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.cause && choix === 1) {
      // Le frigoriste répond selon le hasard du trimestre, quel que soit le reste.
      return [
        {
          de: "Givrelle Climatisation",
          role: "Frigoriste",
          texte: frigoristeRapide(graine) ? REPONSES.frigoristeRapide : REPONSES.frigoristeLent,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.climFinie !== null) {
      lies.push({
        de: "Nuno Pessoa",
        role: "Technicien de maintenance",
        heure: `sem. ${arrive.climFinie}`,
        texte: REPONSES.climFinie,
      });
    }
    if (arrive.sousFiltre !== null) {
      lies.push({
        de: "Lucile Fabbri",
        role: "Revenue manager, siège",
        heure: `sem. ${arrive.sousFiltre}`,
        alerte: true,
        texte: REPONSES.sousFiltre,
      });
    }
    if (arrive.climLache) {
      lies.push({
        de: "Rosalba Mendoza",
        role: "Gouvernante générale",
        heure: `sem. ${CANICULE[0]}`,
        alerte: true,
        texte: REPONSES.climLache,
      });
    }
    if (arrive.detection !== null) {
      lies.push({
        de: "Bookalia",
        role: "Qualité des partenaires",
        heure: `sem. ${arrive.detection}`,
        alerte: true,
        texte: REPONSES.detection,
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
    titre: (t) => `${kE(t.objectif)} de chiffre d'affaires hébergement net`,
    formatObjectif: kE,
    noteDesBarres:
      "Chiffre d'affaires hébergement de juin à août, net des gestes commerciaux, réparations, renforts, prestataires et locations, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const revparEte = t.ca / (CAPACITE * SEMAINES);
      return [
        {
          nom: "Note en ligne",
          valeur: surDix(t.noteFinale),
          aide: `fin août ; objectif ${note(OBJECTIF_NOTE)}`,
          tenu: t.noteFinale >= OBJECTIF_NOTE,
        },
        {
          nom: "RevPAR",
          valeur: revpar(revparEte),
          aide: `sur l'été, à ${euros(t.prixMoyen)} de prix moyen ; objectif ${OBJECTIF_REVPAR} €`,
          tenu: revparEte >= OBJECTIF_REVPAR,
        },
        {
          nom: "CA hébergement net",
          valeur: kE(t.objectif),
          aide: `objectif ${kE(OBJECTIF_NET)} ; dont ${kE(t.couts)} de coûts engagés`,
          tenu: t.objectif >= OBJECTIF_NET,
        },
        {
          nom: "Fiche sur les plateformes",
          valeur: t.detecte
            ? `déclassée en semaine ${t.semaineDetection}`
            : t.semainesSousFiltre > 0
              ? `${t.semainesSousFiltre} sem. sous ${note(SEUIL_FILTRE)}`
              : "dans le filtre « 8 et plus »",
          aide: t.detecte
            ? "avis récompensés détectés et retirés"
            : "le filtre que beaucoup de voyageurs cochent",
          tenu: !t.detecte && t.semainesSousFiltre === 0,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const hotel = [
        t.climReparee
          ? `le frigoriste a fini en semaine ${t.frigoristeRapide ? 2 : 3}`
          : `les climatiseurs des ${COTE_RUE} chambres côté gare n'ont pas été remis en état`,
        t.climReparee
          ? t.climLache
            ? "une partie des appareils réparés a décroché pendant la canicule"
            : "les appareils réparés ont tenu la canicule"
          : null,
        t.delogements >= 1
          ? `${nombre(t.delogements, 0)} clients délogés pendant la canicule`
          : null,
      ].filter(Boolean);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La canicule",
          texte: t.caniculeForte
            ? "a été forte : plusieurs jours au-delà de 35 °C, fin juillet."
            : "a été modérée : de fortes chaleurs, sans excès, fin juillet.",
        },
        ...(t.detecte
          ? [
              {
                titre: "Les plateformes",
                texte: `ont détecté les avis récompensés en semaine ${t.semaineDetection} : avis retirés, hôtel déclassé.`,
              },
            ]
          : []),
        { titre: "L'hôtel", texte: `${hotel.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()) },
      ];
    },
  },
  comportements,
  axe,
};
