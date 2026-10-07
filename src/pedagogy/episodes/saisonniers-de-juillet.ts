/**
 * ÉPISODE 56 — LES SAISONNIERS DE JUILLET, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de la réception de Léonie
 * montre, ce que la courbe trace, ce sur quoi le bilan la juge, et ce que ses
 * décisions révèlent d'elle.
 */
import {
  BUDGET,
  CHANCE_FOYER,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  O,
  PERTE_PAR_JOUR,
  SAISONNIERS,
  SEMAINES,
  SEUIL_NOTE,
  VENTE_PERMANENT,
  elifReste,
  evenements,
  foyerAccorde,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/saisonniers-de-juillet";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  SAISONNIERS_NOMS,
  reponseDElif,
} from "@/config/episodes/saisonniers-de-juillet";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant au centime : « 24,30 € ». */
const centimes = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const note = (v: number) => nombre(v, 2);
const heures = (v: number) => `${nombre(v, 0)} h`;
const departs = (n: number) => (n === 0 ? "aucun départ" : `${n} départ${n > 1 ? "s" : ""}`);
/** Le repère des erreurs de la saison, pour la tuile du bilan. */
export const REPERE_ERREURS = 15000;

const RH = { de: "Marwa Selmi", role: "Ressources humaines, siège du groupe" } as const;

/** Ce que les décisions révèlent, dans l'ordre où une cheffe de réception les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le journal des anomalies de l'été dernier et ce que coûtait chaque erreur",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    integration:
      "Votre diagnostic de la semaine 1 était juste : un saisonnier lâché au comptoir coûtait 680 € d'erreurs par semaine et vendait cinq fois moins qu'un permanent ; c'est l'intégration des premiers jours qui faisait l'été.",
    departs:
      "En semaine 1, vous avez vu les départs : une vraie cause, mais une suite plus qu'une origine. Les saisonniers partaient aussi parce qu'on les avait mis au comptoir « sans savoir à qui demander ».",
    effectif:
      "En semaine 1, vous avez retenu le manque de monde ; l'Orméa tournait avec autant de réceptionnistes par chambre. Ce n'était pas le nombre de saisonniers qui coûtait, c'était ce qu'ils savaient en arrivant.",
    profils:
      "En semaine 1, vous avez retenu le niveau des saisonniers ; ceux qui avaient déjà fait un 4 étoiles avaient fait autant d'erreurs que les autres. Ce qu'il fallait apprendre, c'étaient Hostéo et les standards de la maison.",
  };
  const justes = ["integration", "departs"];
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
    score: d === "integration" ? 1 : d === "departs" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais tenu le rush aux dépens de l'intégration : ni saisonnier lâché au comptoir, ni erreurs rattrapées par des permanents en heures supplémentaires."
        : `Sous la pression du rush, vous avez choisi ${n} fois sur ${ETAPES.length} décisions de tenir le comptoir tout de suite plutôt que de former : mettre au comptoir sans formation, garder un planning qui laissait les saisonniers seuls le soir, faire rattraper par les permanents.${
            t.arret ? " Bertilie Mermoud s'est arrêtée trois semaines en août." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.coutSansFormation,
    "de coût des erreurs d'un saisonnier non formé, par semaine",
    "€",
    { juste: 20, proche: 80 },
    (e) => `${nombre(e, 0)} €`,
  );

  // L'accueil : former avant le rush, loger, ne pas laisser le soir aux débutants.
  const forme = p.chemin[D.accueil] === O.accueil.integration;
  const loge =
    p.chemin[D.logement] === O.logement.foyer || p.chemin[D.logement] === O.logement.studios;
  const soirees = p.chemin[D.planning] === O.planning.soirees;
  const bons = [forme, loge, soirees].filter(Boolean).length;
  const accueil: Constat = {
    score: bons === 3 ? 1 : bons === 2 ? 0.6 : 0,
    texte: `${
      forme
        ? "Vous avez formé les saisonniers avant le rush, puis en binôme."
        : p.chemin[D.accueil] === O.accueil.binomeRush
          ? "Vous les avez mis en binôme, mais en plein rush, sans semaine d'accueil : les permanents ont formé en servant."
          : "Vous les avez mis au comptoir sans les former : ils ont appris en se trompant, devant les clients."
    } ${
      loge
        ? "Vous avez cherché à les loger près de l'hôtel."
        : p.chemin[D.logement] === O.logement.chambres
          ? "Vous les avez logés dans des chambres qui se seraient vendues tout l'été."
          : "Vous les avez laissés se loger seuls, à Thonon sans bus après 20 h 40 pour certains."
    } ${
      soirees
        ? "Vous avez changé le planning publié quand l'audit a montré que les erreurs se faisaient le soir."
        : "Les soirées sont restées aux saisonniers, sans permanent à qui demander."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, accueil];
}

export function axe([information, diagnostic, reflexe, calibrage, accueil]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Compter ce que coûte un saisonnier non formé",
      texte:
        "Rejouez l'épisode en lisant d'abord le journal des anomalies de l'été dernier et le chiffrage des erreurs : 680 € par semaine et par saisonnier lâché au comptoir, de quoi payer une semaine d'intégration en moins d'un mois.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Former avant le rush, pas pendant",
      texte:
        "Tenir le comptoir dès le premier jour paraît prudent ; c'est l'option la plus chère de l'été. Les erreurs, les ventes manquées, les départs et la fatigue des permanents qui rattrapent coûtent bien plus qu'une semaine d'intégration et deux semaines de binôme.",
    };
  }
  if (accueil!.score === 0) {
    return {
      titre: "Soigner l'accueil, pas seulement la formation",
      texte:
        "Un saisonnier qui loge à Thonon sans bus après 20 h 40, qui découvre ses horaires la veille et se retrouve seul au comptoir le soir finit par partir, et un départ en juillet se remplace mal. Le logement et le planning font partie de l'intégration.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce que coûte le premier jour",
      texte:
        "Les départs, le manque de monde, le niveau des recrues : chacun se voit. Ce qui les relie, c'est ce que les saisonniers savent en prenant le comptoir. Partez de là.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de la semaine 1",
      texte:
        "Rapportez les erreurs de l'été dernier à un saisonnier et à une semaine (60, 20 et 5 erreurs pour cinq saisonniers sur deux semaines), puis multipliez par ce que coûte chacune : 6 × 45 + 2 × 110 + 0,5 × 380 = 680 €.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const nomDe = (poste: number) => SAISONNIERS_NOMS[poste] ?? SAISONNIERS_NOMS[0];
const raisons = [
  "« Je me fais reprendre par les clients toute la soirée, et personne à qui demander. »",
  "« Le bus, les coupures, les taxis : je n'y arrive plus. »",
  "« Je ne suis pas fait pour ça, je crois. »",
] as const;

export const EPISODE_SAISONNIERS: Episode<Trimestre> = {
  code: "saisonniers-de-juillet",
  numero: 58,
  domaine: "Intégrer une équipe saisonnière",
  titre: "Les saisonniers de juillet",
  resume:
    "Une réception d'hôtel 4 étoiles au bord du Léman, huit saisonniers qui arrivent la semaine où l'hôtel se remplit. Un saisonnier rapporte ce que son intégration lui permet de rapporter.",
  persona:
    "Vous êtes Léonie Combaz, cheffe de réception de L'Escale Évian, hôtel 4 étoiles de 66 chambres au bord du Léman, l'un des huit hôtels du Groupe Escale. Votre équipe : six réceptionnistes permanents, et huit saisonniers qui arrivent le 29 juin, la semaine où l'hôtel passe à plus de 90 % d'occupation. Votre trimestre : juin, juillet et août.",
  mandat: [
    { fort: kE(BUDGET), texte: "de contribution de la réception sur l'été, au moins" },
    { fort: "8,8", texte: "de note sur Bookalia au moins, jusqu'au 30 août" },
    { fort: `${SAISONNIERS} saisonniers`, texte: "au comptoir du 29 juin au 30 août" },
    { fort: euros(VENTE_PERMANENT), texte: "de ventes additionnelles par arrivée" },
  ],
  jugement:
    "Votre direction juge l'été sur la contribution de la réception : la marge des surclassements et des petits-déjeuners vendus à l'accueil, moins le coût des erreurs, les gestes commerciaux, les réservations que la note fait perdre sous 8,8, les heures supplémentaires, les remplacements et ce que coûte l'accueil des saisonniers.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre réception",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les séminaires et les mariages de juin sont accueillis sans vous.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Aliénor Duchosal",
        role: "Directrice de L'Escale Évian",
        alerte: true,
        texte: `Pendant ce temps, deux séminaires de juin ont été accueillis sans vous : factures de groupe à reprendre et un geste commercial, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "le coût des erreurs d'un saisonnier mis au comptoir sans formation, par semaine, en euros",
    unite: "€",
    placeholder: "0",
    min: 0,
    max: 5000,
    step: 10,
    reel: (t) => t.coutSansFormation,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "contribution",
      nom: "Contribution de la réception",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour l'été`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.contribution ?? 0) / BUDGET)),
              enRetard: (l.contribution ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "erreurs",
      nom: "Coût des erreurs",
      format: euros,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `semaine ${semaine} : facturation, plans tarifaires, délogements`
          : "la semaine dernière, six permanents",
    },
    {
      cle: "note",
      nom: "Note sur Bookalia",
      format: note,
      formatEcart: (v) => `${nombre(v, 2)} pt`,
      sensBon: 1,
      aide: () => `sur 10 ; sous ${nombre(SEUIL_NOTE)}, l'hôtel perd des réservations`,
    },
    {
      cle: "enPoste",
      nom: "Saisonniers au comptoir",
      format: (v) => `${nombre(v, 0)} sur ${SAISONNIERS}`,
      sensBon: 1,
      aide: (semaine) => (semaine < 5 ? "arrivée le 29 juin" : `semaine ${semaine}`),
    },
    {
      cle: "heuresSup",
      nom: "Heures supplémentaires des permanents",
      format: heures,
      sensBon: -1,
      aide: () => "par semaine, à 27,50 € l'heure",
    },
  ],
  contexte(l) {
    return {
      contribution: kE(l.contribution ?? 0),
      erreurs: euros(l.erreurs ?? 0),
      note: note(l.note ?? 0),
      enPoste: nombre(l.enPoste ?? 0, 0),
      heuresSup: (l.heuresSup ?? 0) < 0.5 ? "aucune" : `${nombre(l.heuresSup ?? 0, 0)} heures`,
      ventesParArrivee: centimes(l.ventesParArrivee ?? 0),
      ventesSaisonnier: l.ventesSaisonnier == null ? "rien" : centimes(l.ventesSaisonnier),
      // Les saisonniers vendent-ils nettement moins que les permanents ?
      saisonniersEnRetard: (l.ventesSaisonnier ?? 0) < 0.8 * (l.ventesPermanent ?? 0),
      ventesPermanent: centimes(l.ventesPermanent ?? 0),
      departs: departs(l.departs ?? 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    const erreurs = semaines.reduce((x, w) => x + w.erreurs, 0);
    return [
      ["Contribution de la période", kE(contribution)],
      ["Coût des erreurs", kE(erreurs)],
      [`Note Bookalia, sem. ${a}`, note(t.semaines[a]!.note)],
    ];
  },
  courbe: {
    titre: "Contribution de la réception, semaine par semaine",
    cle: "contribution",
    cible: BUDGET / SEMAINES,
    libelleCible: `budget : ${kE(BUDGET / SEMAINES)} par semaine`,
    graduations: [-16000, -12000, -8000, -4000, 0, 4000, 8000],
    format: kE,
    details: (s) => [
      `contribution ${kE(s.contribution!)} · ventes ${kE(s.ventes!)} · erreurs ${kE(s.erreurs!)}`,
      `${nombre(s.enPoste!, 0)} saisonniers au comptoir · note ${note(s.note!)} · ${heures(s.heuresSup!)} sup.`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.logement && choix === O.logement.foyer) {
      // Seule la demande compte : la commission répond selon le hasard du trimestre.
      const accorde = foyerAccorde([...NEUTRE.slice(0, D.logement), choix], graine);
      return [
        {
          de: "Résidence des saisonniers du Chablais",
          role: "Commission d'attribution",
          texte: accorde ? REPONSES.foyerAccorde : REPONSES.foyerRefuse,
        },
      ];
    }
    if (etape === D.depart && (choix === O.depart.entretien || choix === O.depart.prime)) {
      // Ce qui la fait partir, et sa réponse, ne dépendent que du hasard du trimestre.
      const chemin = [...NEUTRE.slice(0, D.depart), choix];
      return reponseDElif(
        choix === O.depart.entretien ? "entretien" : "prime",
        hasard(graine).cause,
        elifReste(chemin, graine),
      );
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    for (const x of arrive.departs) {
      const s = nomDe(x.poste);
      if (x.semaine === 4) {
        lies.push({
          ...RH,
          heure: "sem. 4",
          alerte: true,
          texte: `${s.nom} renonce à venir : sans logement à trois jours de l'arrivée. L'agence d'extras n'a personne avant le 13 juillet.`,
        });
      } else if (x.rentree) {
        lies.push({
          ...RH,
          heure: `sem. ${x.semaine}`,
          alerte: true,
          texte: `${s.nom} est ${s.f ? "repartie" : "reparti"} une semaine avant la fin de son contrat, pour la rentrée. Le poste restera vide jusqu'au 30 août.`,
        });
      } else {
        lies.push({
          de: s.nom,
          role: s.f ? "Saisonnière" : "Saisonnier",
          heure: `sem. ${x.semaine}`,
          alerte: true,
          texte: `Je rends mon badge ce soir. ${raisons[x.poste % raisons.length]} L'agence d'extras ne peut envoyer personne avant deux semaines.`,
        });
      }
    }
    if (arrive.elifPart) {
      const attendu =
        chemin[D.depart] === O.depart.entretien || chemin[D.depart] === O.depart.prime;
      lies.push({
        ...RH,
        heure: "sem. 8",
        texte: attendu
          ? "Elif Demirci a fait son dernier service samedi. Début août, l'agence d'extras n'a personne avant le 17 : le poste restera vide trois semaines."
          : "Elif Demirci a fait son dernier service samedi. Son remplaçant commence lundi.",
      });
    }
    if (arrive.arret) {
      lies.push({
        ...RH,
        heure: "sem. 10",
        alerte: true,
        texte:
          "Bertilie Mermoud est en arrêt de travail pour trois semaines. Le médecin parle d'épuisement. Ses services passent en heures supplémentaires.",
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
    titre: (t) => `${kE(t.objectif)} de contribution de la réception sur l'été`,
    formatObjectif: kE,
    noteDesBarres:
      "Contribution de la réception sur l'été, ventes additionnelles moins les erreurs, les gestes, la note, les heures et les remplacements, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Contribution",
          valeur: kE(t.objectif),
          aide: `budget ${kE(BUDGET)}`,
          tenu: t.objectif >= BUDGET,
        },
        {
          nom: "Note Bookalia",
          valeur: note(t.noteFinale),
          aide: `le 30 août ; seuil ${nombre(SEUIL_NOTE)}`,
          tenu: t.noteFinale >= SEUIL_NOTE,
        },
        {
          nom: "Départs en cours de saison",
          valeur: `${t.abandons} sur ${SAISONNIERS}`,
          aide: t.elifReste
            ? "Elif est restée ; l'été dernier, 3 sur 7"
            : "sans compter Elif ; l'été dernier, 3 sur 7",
          tenu: t.abandons <= 1,
        },
        {
          nom: "Coût des erreurs",
          valeur: kE(t.erreurs),
          aide: `sur l'été ; repère ${kE(REPERE_ERREURS)}`,
          tenu: t.erreurs <= REPERE_ERREURS,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const partis = t.departs.filter((x) => !x.rentree).map((x) => nomDe(x.poste));
      const rentres = t.departs.filter((x) => x.rentree).map((x) => nomDe(x.poste).nom);
      const causes = {
        coupures: "les coupures de ses journées",
        client: "un client qui l'avait humiliée au comptoir sans que personne vienne",
        geneve: "une offre d'un hôtel de Genève",
      } as const;
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La résidence des saisonniers",
          texte:
            h.uFoyer < CHANCE_FOYER
              ? "aurait accordé les huit places, si on les avait demandées."
              : "n'aurait pas accordé les places : toutes étaient attribuées.",
        },
        {
          titre: "Elif",
          texte: `voulait partir pour ${causes[h.cause]} ; elle ${t.elifReste ? "est restée" : "est partie à la fin de la semaine 8"}.`,
        },
        {
          titre: "L'équipe",
          texte: [
            partis.length
              ? `${partis.map((s) => s.nom).join(", ")} ${
                  partis.length > 1 ? "sont partis" : partis[0]!.f ? "est partie" : "est parti"
                } en cours de saison, renoncements compris`
              : "aucun saisonnier n'est parti en cours de saison",
            rentres.length ? `${rentres.join(", ")}, avant la fin, pour la rentrée` : null,
            t.arret
              ? "Bertilie Mermoud s'est arrêtée trois semaines en août"
              : "les permanents ont tenu jusqu'au bout",
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
