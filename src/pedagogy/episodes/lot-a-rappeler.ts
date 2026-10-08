/**
 * ÉPISODE 96 — LE LOT QU'IL FAUT PEUT-ÊTRE RAPPELER, tel que l'interface et le
 * bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Annaïg montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent
 * d'elle.
 */
import {
  ARRET_JOUR,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  P,
  PERTE_PAR_JOUR,
  PROVISION,
  SEMAINES,
  confirme,
  evenements,
  hasard,
  resultatEchantillons,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/lot-a-rappeler";
import {
  DDPP,
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/lot-a-rappeler";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const palettes = (v: number) => `${nombre(v, 0)} palette${Math.round(v) >= 2 ? "s" : ""}`;

const BLEUNVENN = {
  de: "Bleunvenn Coatanéa",
  role: "Laborantine, contrôle qualité de Pontivy",
} as const;
const CHINWE = {
  de: "Chinwe Okonkwo",
  role: "Microbiologiste, laboratoire départemental d'analyses",
} as const;
const KLERVI = { de: "Klervi Nédélec", role: "Responsable maintenance" } as const;
const NAIM = { de: "Naïm Lefeuvre", role: "Directeur des grands comptes et des MDD" } as const;
const MORWENNA = { de: "Morwenna Pellen", role: "Cheffe de marque" } as const;
const TREPHINE = { de: "Tréphine Laouénan", role: "Directrice qualité, Celtis" } as const;
const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;

/** Ce qu'était vraiment le présomptif, dit au bilan. */
const VERITE: Record<Trimestre["scenario"], string> = {
  faux: "un faux positif : des Listeria innocua, venues de la zone humide sous la remplisseuse. Rien de dangereux dans les pots, mais Listeria circulait dans l'atelier.",
  lot: "une contamination ponctuelle au changement de format du mardi : les deux lots du mardi étaient touchés, rien au-delà de l'intervalle.",
  ligne:
    "une souche installée dans le joint d'une vanne de dosage de la remplisseuse : elle survivait aux NEP et touchait aussi les lots des intervalles voisins, et la production qui reprenait.",
};

/** Ce que les décisions révèlent, dans l'ordre où une responsable qualité les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les enregistrements de la ligne et la règle du retrait",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    perimetre:
      "Votre diagnostic de la semaine 1 était juste : une contamination après pasteurisation pouvait toucher tout ce que la ligne avait rempli entre deux nettoyages complets, et ces pots étaient déjà en rayon.",
    lot: "En semaine 1, vous avez vu le lot positif : une vraie cause, mais un périmètre trop étroit. Les enregistrements montraient six lots remplis entre les deux NEP, et un rinçage ne sépare rien.",
    presomptif:
      "En semaine 1, vous avez retenu que le présomptif n'était pas une preuve. C'est vrai une fois sur quatre ; les trois autres, les pots attendaient en rayon pendant qu'on attendait le laboratoire.",
    lait: "En semaine 1, vous avez remonté vers le lait de collecte ; il était pasteurisé, et les enregistrements du pasteurisateur conformes. Une Listeria dans un pot de fromage blanc vient presque toujours de l'atelier, après la pasteurisation.",
  };
  const justes = ["perimetre", "lot"];
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
    score: d === "perimetre" ? 1 : d === "lot" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais attendu la preuve pour protéger le consommateur, ni cédé à la panique : ni attente de la confirmation, ni redémarrage comme avant, ni rappel d'un mois de production."
        : `Sous la pression, vous avez choisi ${n} fois sur ${ETAPES.length} décisions d'attendre la preuve pour protéger les ventes (attendre la confirmation, redémarrer comme avant, s'en tenir au périmètre, nettoyer plus fort sans chercher, acheter la paix par une promotion) ou de tout retirer par peur (un mois de production, trois semaines sans analyses).${
            t.secondRappel ? ` Un second rappel a suivi, en semaine ${t.secondRappel}.` : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.aBloquer,
    "à bloquer et retirer",
    "palettes",
    { juste: 1, proche: 5 },
    (e) => palettes(e),
  );

  // Protéger, informer, délimiter sur des faits, chercher la source.
  const informee = p.chemin[D.alerte] === 2 || p.chemin[D.alerte] === 3;
  const faits = p.chemin[D.alerte] === 2 && p.chemin[D.perimetre] === 0;
  const source = p.chemin[D.source] === 0 || p.chemin[D.source] === 1;
  const plan = p.chemin[D.plan] === 0;
  const tenus = [informee, faits, source, plan].filter(Boolean).length;
  const methode: Constat = {
    score: tenus === 4 ? 1 : tenus >= 2 ? 0.6 : 0,
    texte: `${
      informee
        ? "La DDPP a été informée dès le vendredi soir, comme le règlement l'exige."
        : "La DDPP n'a été informée qu'après la confirmation, par vous ou par le laboratoire."
    } ${
      faits
        ? "Le périmètre a suivi les faits : les lots entre deux NEP, puis les échantillons conservés pour décider d'étendre."
        : "Le périmètre n'a pas suivi les faits : trop étroit, trop large, ou décidé sans les échantillons conservés."
    } ${
      source
        ? "La source a été cherchée dans la remplisseuse, pas seulement nettoyée."
        : "La source n'a pas été cherchée : la zone a été nettoyée, pas démontée."
    } ${
      plan
        ? "Le plan d'échantillonnage environnemental a été revu pour trouver la prochaine fois avant le produit."
        : "Le plan d'échantillonnage environnemental est resté celui qui n'avait rien vu venir."
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
      titre: "Lire les enregistrements avant de délimiter",
      texte:
        "Rejouez l'épisode en tirant d'abord les enregistrements de la ligne et des NEP, et en relisant la règle du retrait : six lots, 37 palettes, entre la NEP du lundi et celle du jeudi. Une journée de lecture disait quoi bloquer ce soir-là.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Protéger d'abord, puis décider sur des faits",
      texte:
        "Attendre la preuve laisse les pots en rayon et la DDPP l'apprendre par le laboratoire ; tout rappeler par peur détruit des produits sains sans protéger davantage. Bloquez et retirez ce qui peut l'être, informez, puis laissez la traçabilité et les analyses dire jusqu'où aller.",
    };
  }
  if (methode!.score === 0) {
    return {
      titre: "Chercher la source, pas seulement le lot",
      texte:
        "Un lot positif dit qu'il y a un problème sur la ligne, pas où. Les échantillons conservés délimitent le rappel ; les prélèvements en zone 1 et le démontage de la remplisseuse trouvent la niche qui, sinon, refera un positif.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Penser en intervalles de nettoyage",
      texte:
        "Une contamination après pasteurisation ne s'arrête pas au lot analysé : elle peut toucher tout ce que la ligne a rempli entre deux nettoyages complets. C'est cet intervalle, lu dans les enregistrements, qui fait le périmètre défendable.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le compte des palettes",
      texte:
        "Entre la NEP complète du lundi 5 h et celle du jeudi 5 h, les rinçages ne comptent pas : 7 + 5 + 7 + 5 + 7 + 6, soit 37 palettes, à quai comme en entrepôt.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions : un faux positif, une contamination ponctuelle, une souche installée. Si le résultat tient dans les trois cas, votre méthode tient.",
  };
}

/** Ce que la campagne de prélèvements trouve : seulement selon le hasard du trimestre. */
function texteCampagne(choix: number, graine: number): string {
  const h = hasard(graine);
  const niche = h.scenario === "ligne" && h.uEnvironnement < P.environnement;
  if (choix === 2) return niche ? REPONSES.campagneNiche : REPONSES.campagneSiphon;
  return `${niche ? REPONSES.campagneNiche : REPONSES.campagneSiphon} ${
    niche ? REPONSES.arretJeudi : REPONSES.liberationContinue
  }`;
}

/** Ce que disent les échantillons conservés : seulement selon le hasard du trimestre. */
function texteEchantillons(graine: number): string {
  const r = resultatEchantillons(graine);
  if (r === "voisins") return REPONSES.echantillonsVoisins;
  if (r === "mardi") return REPONSES.echantillonsMardi;
  return confirme(graine)
    ? REPONSES.echantillonsNegatifs
    : `${REPONSES.echantillonsNegatifs} ${REPONSES.levee}`;
}

export const EPISODE_RAPPEL: Episode<Trimestre> = {
  code: "lot-a-rappeler",
  numero: 96,
  domaine: "Décider sous une alerte sanitaire",
  titre: "Le lot qu'il faut peut-être rappeler",
  resume:
    "Un fromage blanc présomptif positif à Listeria un vendredi à 17 h, des palettes déjà en rayon, un directeur commercial qui veut attendre. Protéger d'abord, puis délimiter le rappel sur des faits.",
  persona:
    "Vous êtes Annaïg Le Dantec, responsable qualité de la Laiterie de Kerbrélan, entreprise familiale de produits frais laitiers installée à Loudéac (Côtes-d'Armor) : 520 salariés, deux usines, des yaourts, des desserts et du fromage blanc pour la marque Kerbrélan et pour les marques de distributeur de Celtis et d'Opaline. L'alerte touche la ligne 3 de l'usine de Pontivy, qui remplit 60 palettes de fromage blanc par semaine. Le trimestre va d'octobre à décembre.",
  mandat: [
    { fort: "aucun pot douteux", texte: "laissé en rayon quand on peut le retirer" },
    { fort: "la DDPP", texte: "informée comme le règlement l'exige" },
    {
      fort: "un seul rappel",
      texte: "au bon périmètre : ni second rappel, ni produits sains détruits",
    },
    { fort: kE(PROVISION), texte: "de provision pour l'alerte, suites comprises" },
  ],
  jugement:
    "La direction juge le trimestre sur le coût de l'alerte : produits retirés et détruits, frais de retrait des enseignes, avis de rappel et remboursements, arrêts et nettoyages de la ligne, analyses, ventes perdues ; plus les suites attendues en fin d'année : l'amende si la DDPP a dressé procès-verbal, le déréférencement et la presse au-delà de décembre, le risque d'une nouvelle alerte et l'audit IFS de janvier.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre alerte",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des pots du périmètre passent en caisse pendant que vous vérifiez.",
    echeance: "de trancher",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...YSEE,
        alerte: true,
        texte: `Pendant ce temps, des pots de fromage blanc de la semaine sont passés en caisse : ${euros(perdu)} de remboursements et de retraits de plus, quoi que vous décidiez.`,
      };
    },
  },
  prevision: {
    libelle: "le nombre de palettes à bloquer et retirer, d'après les enregistrements de la ligne",
    unite: "palettes",
    placeholder: "20",
    min: 0,
    max: 300,
    step: 1,
    reel: (t) => t.aBloquer,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "cout",
      nom: "Coût de l'alerte à date",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `provision à date : ${kE(l.provisionADate ?? 0)} sur ${kE(PROVISION)}`
          : `provision : ${kE(PROVISION)} pour le trimestre`,
      jauge: (l) =>
        l.provisionADate
          ? {
              part: Math.min(1, (l.cout ?? 0) / PROVISION),
              enRetard: (l.cout ?? 0) > l.provisionADate,
            }
          : null,
    },
    {
      cle: "palettes",
      nom: "Palettes retirées ou détruites",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "en entrepôt, en magasin ou à l'usine",
    },
    {
      cle: "rappels",
      nom: "Avis de rappel publiés",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "un avis de plus, c'est la confiance des enseignes qui s'use",
    },
    {
      cle: "arret",
      nom: "Jours d'arrêt de la ligne 3",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `${euros(ARRET_JOUR)} par jour d'arrêt`,
    },
    {
      cle: "service",
      nom: "Taux de service du fromage blanc",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => "attendu par les enseignes : 98,5 %",
    },
  ],
  contexte(l, decisions) {
    const alerte = decisions[D.alerte];
    return {
      cout: kE(l.cout ?? 0),
      palettes: nombre(l.palettes ?? 0, 0),
      rappels: nombre(l.rappels ?? 0, 0),
      arret: nombre(l.arret ?? 0, 0),
      service: taux(l.service ?? 0),
      confirme: (l.confirme ?? 0) > 0,
      attente: alerte === 0,
      campagne: decisions[D.ligne] === 1 || decisions[D.ligne] === 2,
      nicheVue: (l.nicheVue ?? 0) > 0,
      alerteConnue: (alerte !== undefined && alerte !== 0) || (l.confirme ?? 0) > 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const s = t.semaines[a]!;
    return [
      ["Coût de la période", kE(semaines.reduce((x, w) => x + w.cout, 0))],
      [`Palettes retirées ou détruites, sem. ${a}`, nombre(s.palettes, 0)],
      [`Taux de service, sem. ${a}`, taux(s.service)],
    ];
  },
  courbe: {
    titre: "Coût de l'alerte, semaine par semaine",
    cle: "cout",
    cible: PROVISION / SEMAINES,
    libelleCible: `provision : ${kE(PROVISION / SEMAINES)} par semaine, ${kE(PROVISION)} sur le trimestre`,
    graduations: [10000, 25000, 50000, 100000, 200000],
    format: kE,
    details: (s) => [
      `${kE(s.cout!)} dans la semaine · ${kE(s.coutCumule!)} depuis le vendredi de l'alerte`,
      `${palettes(s.palettes!)} retirées ou détruites · ${nombre(s.rappels!, 0)} avis de rappel · service ${taux(s.service!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.ligne && (choix === 1 || choix === 2)) {
      // Ce que trouvent les 40 prélèvements dépend de ce qu'est vraiment le présomptif.
      return [{ ...BLEUNVENN, texte: texteCampagne(choix, graine) }];
    }
    if (etape === D.perimetre && choix === 0) {
      return [{ ...CHINWE, texte: texteEchantillons(graine) }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const lies: Message[] = [];
    const d1 = chemin[D.alerte];
    if (arrive.confirmation && d1 !== undefined) {
      lies.push({
        ...CHINWE,
        heure: "sem. 2",
        alerte: t.confirme,
        texte: t.confirme ? REPONSES.confirme : REPONSES.nonConfirme,
      });
      if (t.confirme && d1 === 0) {
        lies.push({
          ...DDPP,
          heure: "sem. 2",
          alerte: true,
          texte: `Le laboratoire nous a transmis lundi un résultat confirmé, sur un présomptif que vous connaissiez depuis vendredi. Nous imposons le retrait et le rappel des six lots produits entre les deux NEP complètes${
            t.elargi
              ? " et, faute d'analyses environnementales, de toute la production depuis votre dernière analyse négative, il y a trois semaines."
              : "."
          }`,
        });
      }
      if (t.confirme && d1 === 1) {
        lies.push({
          ...DDPP,
          heure: "sem. 2",
          alerte: true,
          texte:
            h.uImpose < P.imposeIntervalle
              ? "Informés lundi seulement, nous imposons le retrait et le rappel des cinq autres lots remplis entre les deux NEP complètes : un rinçage ne borne pas un périmètre."
              : "Informés lundi seulement, nous prenons acte du retrait du seul L3-279-K. Ce périmètre est le vôtre, et votre responsabilité.",
        });
      }
      if (t.confirme && d1 === 2) {
        lies.push({
          ...NAIM,
          heure: "sem. 2",
          texte:
            "L'avis de rappel des six lots est publié sur le site public des rappels ; les affichettes sont en magasin chez Celtis et Opaline. Les lots étaient déjà retirés depuis vendredi soir.",
        });
      }
      if (!t.confirme && d1 !== 0) {
        lies.push({
          ...DDPP,
          heure: "sem. 2",
          texte:
            "Nous prenons acte du résultat non confirmé. Les mesures restent en place jusqu'aux analyses des échantillons conservés des lots concernés.",
        });
      }
    }
    if (arrive.sanction) {
      lies.push({
        ...DDPP,
        heure: "sem. 4",
        alerte: true,
        texte:
          "Procès-verbal pour défaut d'information de l'administration : des produits que l'exploitant avait des raisons de penser dangereux sont restés sur le marché sans qu'elle en soit informée. Le dossier est transmis au parquet.",
      });
    }
    if (t.autocontroleSemaine && de <= t.autocontroleSemaine && a >= t.autocontroleSemaine) {
      lies.push({
        ...BLEUNVENN,
        heure: `sem. ${t.autocontroleSemaine}`,
        alerte: true,
        texte:
          "L'autocontrôle d'un lot de la semaine revient positif à Listeria monocytogenes : la souche est toujours dans la ligne. Nouveau retrait, nouvel avis de rappel, et la DDPP suspend la ligne 3 jusqu'au traitement de la source.",
      });
    }
    if (arrive.source) {
      const choix = chemin[D.source];
      const trouvee = t.scenario === "ligne" && t.nicheEliminee === 5;
      lies.push({
        ...KLERVI,
        heure: "sem. 5",
        texte:
          choix === 0
            ? trouvee
              ? "Le joint d'une vanne de dosage était fendu, et positif : la souche était là, à l'abri des NEP. Joint et vanne changés, siphon refait."
              : t.scenario === "ligne"
                ? "Trente-deux points écouvillonnés : rien de net en zone 1. Le siphon est refait. Si une souche est encore quelque part, nous ne l'avons pas trouvée."
                : "Trente-deux points écouvillonnés : rien en zone 1, pas de souche installée dans la remplisseuse. Le siphon, positif, est refait."
            : choix === 1
              ? "La zone de conditionnement est refaite : joints, vannes, sol et siphons. La ligne repart vendredi."
              : "Désinfection choc faite, NEP renforcées. On ne saura pas ce qu'il y avait dans les joints.",
      });
    }
    if (t.decouverte && de <= t.decouverte && a >= t.decouverte) {
      lies.push({
        ...DDPP,
        heure: `sem. ${t.decouverte}`,
        alerte: true,
        texte: `Nos prélèvements en magasin trouvent Listeria monocytogenes dans du fromage blanc de la ligne 3, hors du périmètre que vous avez rappelé. Second rappel${
          t.troisSemaines
            ? " : nous imposons toute la production depuis votre dernière analyse environnementale négative, et l'arrêt de la ligne une semaine, jusqu'à des résultats négatifs."
            : "."
        }`,
      });
    }
    if (t.cas && de <= 6 && a >= 6) {
      lies.push({
        ...DDPP,
        heure: "sem. 6",
        alerte: true,
        texte:
          "Le centre national de référence rattache à la souche de la ligne 3 un cas de listériose déclaré dans le Morbihan : une personne âgée, hospitalisée. Une enquête est ouverte.",
      });
    }
    if (arrive.presse) {
      lies.push({
        ...MORWENNA,
        heure: `sem. ${t.presse}`,
        alerte: true,
        texte: t.cas
          ? "La presse nationale reprend le cas de listériose et le nom de Kerbrélan. Les ventes de fromage blanc décrochent dans toutes les enseignes."
          : "Un quotidien régional titre sur « le fromage blanc Kerbrélan rappelé ». Les ventes de la marque baissent dès la semaine suivante.",
      });
    }
    if (arrive.recidive) {
      const w = t.recidive;
      const plan = w >= 10 ? chemin[D.plan] : 3;
      lies.push({
        ...BLEUNVENN,
        heure: `sem. ${w}`,
        alerte: !t.recidiveEnvironnement,
        texte: t.recidiveEnvironnement
          ? "Le nouveau plan de prélèvements trouve Listeria monocytogenes en zone 2, sur un capot de la remplisseuse, avant qu'un lot soit touché. Nettoyage ciblé, puis la zone sera refaite."
          : plan === 2
            ? "Un lot en libération positive revient positif : il est détruit à l'usine, rien n'est parti. La zone sera refaite la semaine prochaine."
            : "L'autocontrôle d'un lot de la semaine revient positif à Listeria monocytogenes. Nouveau retrait, nouvel avis de rappel ; la zone sera refaite la semaine prochaine.",
      });
    }
    if (arrive.suspension && t.chanceSuspension > 0) {
      lies.push({
        ...TREPHINE,
        heure: "sem. 7",
        alerte: t.suspendu,
        texte: t.suspendu
          ? "Nous suspendons le fromage blanc à marque Celtis pour six semaines, à compter de la semaine prochaine. Nous le reprendrons sur la foi de vos résultats."
          : "Nous maintenons votre fromage blanc en rayon. Nous suivrons vos résultats environnementaux chaque mois.",
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    const semaine = (m: Message) => Number(m.heure?.replace("sem. ", "") ?? 0);
    lies.sort((x, y) => semaine(x) - semaine(y));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `Coût de l'alerte : ${kE(t.coutTotal)}, dont ${kE(t.suites)} de suites attendues`,
    formatObjectif: kE,
    noteDesBarres:
      "L'opposé du coût de l'alerte, suites attendues comprises, sous le hasard que vous avez joué : plus la barre est longue (moins l'alerte a coûté), mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Coût de l'alerte",
          valeur: kE(t.coutTotal),
          aide: `suites comprises ; provision ${kE(PROVISION)}`,
          tenu: t.coutTotal <= PROVISION,
        },
        {
          nom: "DDPP informée",
          valeur: t.ddppATemps ? "dès vendredi" : "après la confirmation",
          aide: t.sanction ? "procès-verbal dressé" : "le règlement demande « immédiatement »",
          tenu: t.ddppATemps,
        },
        {
          nom: "Second rappel",
          valeur: t.secondRappel ? `semaine ${t.secondRappel}` : "aucun",
          aide: t.secondRappel ? "un lot laissé en rayon, ou une récidive" : "le périmètre a tenu",
          tenu: !t.secondRappel,
        },
        {
          nom: "Fromage blanc Celtis",
          valeur: t.suspendu ? "suspendu" : "maintenu",
          aide: t.suspendu
            ? "six semaines, à partir de la semaine 8"
            : "la marque de l'enseigne reste en rayon",
          tenu: !t.suspendu,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        { titre: "Le présomptif", texte: `était ${VERITE[t.scenario]}` },
        {
          titre: "Les produits",
          texte: `${palettes(t.palettes)} retirées ou détruites, dont ${nombre(t.palettesSaines, 0)} sans contamination ; ${
            t.confirme
              ? `${palettes(t.exposition)} de produit contaminé consommées avant un retrait${t.cas ? ", et un cas de listériose rattaché à la souche" : ""}.`
              : "aucun pot dangereux n'était en rayon."
          }`,
        },
        {
          titre: "La DDPP",
          texte: t.sanction
            ? "a dressé procès-verbal pour information tardive."
            : t.elargi
              ? "a imposé un rappel élargi à trois semaines de production."
              : t.troisSemaines
                ? "a imposé trois semaines de production et l'arrêt de la ligne après le second rappel."
                : "n'a dressé aucun procès-verbal.",
        },
        {
          titre: "Celtis",
          texte: t.chanceSuspension
            ? `${t.suspendu ? "a suspendu" : "a maintenu"} son fromage blanc ; au vu de votre conduite, le risque de suspension était de ${taux(t.chanceSuspension, 0)}.`
            : "n'a rien su de l'alerte.",
        },
      ];
    },
  },
  comportements,
  axe,
};
