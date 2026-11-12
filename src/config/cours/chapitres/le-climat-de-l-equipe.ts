import { arrondi2 as auCentime, deuxChemins, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  HEURES_COMPLEMENTAIRES_POSSIBLES,
  HEURES_REMPLACEES,
  MAJORATION_DES_HEURES_COMPLEMENTAIRES,
  MOUVEMENTS_DE_N_MOINS_1,
  PANNE_DE_CAISSE,
  PASSAGES_PERDUS_PAR_HEURE,
  REGLES_DU_PLANNING,
  SAMEDIS_DISPUTES,
  SOIRS_DE_FERMETURE_SEUL,
  TEMPS_PARTIEL,
  VENDEUR_QUI_DECROCHE,
  BRUT_HORAIRE_DU_RENFORT,
  coutDesAbsences,
  indicateursSociaux,
  panneDeCaisse,
  tableauDeBordDesVendeurs,
} from "../monde/equipe-de-la-boutique";
import { CRENEAUX, ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "./equipe-et-planning";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE CLIMAT DE L'ÉQUIPE (BTS MCO, bloc 4, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts) et le
 * module de son équipe (monde/equipe-de-la-boutique.ts : les absences et les retards de janvier, la
 * rotation de N − 1, le coût d'une heure complémentaire, la panne de caisse d'un samedi). Une
 * évolution du moteur ne change rien ici.
 *
 * L'objet : les indicateurs sociaux de l'équipe et ce que coûte l'absentéisme ; les signes de stress
 * d'un vendeur qui décroche (celui du chapitre « Rémunérer et stimuler les vendeurs »), le conflit qui
 * l'oppose à une collègue, l'entretien et la réunion qui le traitent ; enfin une crise, la caisse en
 * panne un samedi, son plan opérationnel et son plan de communication.
 *
 * Le piège central : une absence coûte même remplacée, et plus encore quand elle ne l'est pas ; un
 * vendeur qui décroche se traite d'abord par l'écoute, pas par la sanction ni par la prime.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, les-indicateurs-sociaux (la formule est dans la question et au repère) ;
 *   · l'expérience avant la formule : predire-le-remplacement puis le-laboratoire-des-absences (les
 *     heures d'absence et les heures remplacées, le coût du mois) ;
 *   · autonome : le-cout-des-absences, la-panne-de-caisse ;
 *   · expert : signes-et-facteurs (un tri), le-conflit, l-entretien, la-reunion, le-client-agressif,
 *     le-plan-de-communication, la-premiere-mesure ; puis la synthèse.
 *
 * Le droit cité (Code du travail, 2026) : l'obligation de sécurité de l'employeur, qui évalue les
 * risques, psychosociaux compris, dans le document unique (art. L4121-1 et suivants) ; l'interdiction
 * du harcèlement moral (art. L1152-1) ; le droit d'alerte et de retrait du salarié face à un danger
 * grave et imminent ; le délai de prévenance de 7 jours avant de changer les horaires d'un temps
 * partiel ; les heures complémentaires au plus au dixième du contrat, majorées de 10 %.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les taux se donnent à deux décimales (au dixième, avant) ; les
 * ventes de la panne partent de la caisse d'une semaine au centime, et la marge sauvée du taux de
 * marge arrondi (monde/equipe-de-la-boutique.ts), au centime, à un centime près (à 50 centimes ou un
 * euro près, avant).
 */

const qte = nombreAuCentieme;
const h = (x: number) => `${qte(x)} h`;

const POURQUOI =
  "ce chapitre se joue à la boutique du cours, MAILLE & CO : ses vendeurs, leurs heures et leurs ventes sont ceux des autres chapitres du parcours.";

/** Les positions du laboratoire des absences. */
export const LEVIERS_DES_ABSENCES = { absences: { min: 0, max: 40, pas: 1 }, remplacees: { min: 0, max: HEURES_COMPLEMENTAIRES_POSSIBLES, pas: 1 } } as const;

/** Tout ce que le chapitre et son cas lisent, calculé une fois du cas. */
export function climatDeLEquipe(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = indicateursSociaux(f);
  const m = s.de(VENDEUR_QUI_DECROCHE);
  const k = coutDesAbsences(f);
  const auMieux = coutDesAbsences(f, s.absences, HEURES_COMPLEMENTAIRES_POSSIBLES);
  const p = panneDeCaisse(f);
  const v = tableauDeBordDesVendeurs(f).de(VENDEUR_QUI_DECROCHE);
  return { f, s, m, k, auMieux, p, v, sansRemplacement: coutDesAbsences(f, s.absences, 0) };
}

export type ClimatDeLEquipe = ReturnType<typeof climatDeLEquipe>;

/** Les indicateurs sociaux de janvier, salarié par salarié : le document de départ. */
export function tableauDesAbsences(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = climatDeLEquipe(c);
  return {
    titre: `${x.f.entreprise} · les heures, les absences et les retards de janvier`,
    colonnes: ["Heures payées", "Heures d'absence", "Retards"],
    lignes: x.s.salaries.map((s) => ({ libelle: `${s.prenom}, ${s.poste.toLowerCase()}`, valeurs: [h(s.heures), h(s.absences), qte(s.retards)] })),
  };
}

export const LE_CLIMAT_DE_L_EQUIPE: Chapitre = {
  code: "le-climat-de-l-equipe",
  parcours: "mco",
  palier: 4,
  blocs: ["BTS MCO Bloc 4 · Manager l'équipe commerciale"],
  titre: "Le climat de l'équipe",
  accroche:
    "Les absences, les retards et les départs se comptent, et coûtent. Derrière les chiffres, un vendeur qui décroche et un conflit qui couve : les signes à lire, l'entretien à mener. Puis une crise un samedi, et son plan.",
  objectifs: [
    "Calculer les indicateurs sociaux de l'équipe : absentéisme et rotation",
    "Chiffrer le coût de l'absentéisme et choisir comment remplacer",
    "Repérer les signes et les facteurs de risques psychosociaux, et diagnostiquer un conflit",
    "Conduire un entretien et une réunion, et diffuser l'information",
    "Bâtir un plan de crise et en chiffrer l'enjeu",
  ],
  libre: false,
  prerequis: ["remunerer-et-stimuler-les-vendeurs"],
  ensuite: ["tableau-de-bord-du-manager"],
  entreprises: { codes: ENTREPRISES_DU_POINT_DE_VENTE, pourquoi: POURQUOI },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que disent les absences",
      notions: ["staff_turnover", "payroll"],
      tableau: tableauDesAbsences,
      texte: (c) => {
        const x = climatDeLEquipe(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. En janvier, ${x.m.prenom}, qui décroche au tableau de bord des vendeurs, a aussi été absent et en retard plus que les autres.`,
          "Les indicateurs sociaux mesurent la santé d'une équipe : le taux d'absentéisme, la rotation du personnel, les heures supplémentaires, les accidents du travail. Ils sont souvent le premier signe d'un malaise que personne ne dit.",
          "Le manager les calcule, les chiffre, puis cherche ce qu'ils cachent : une charge de travail, un conflit, un manque de reconnaissance.",
        ];
      },
      repere: () => "Taux d'absentéisme = heures d'absence ÷ heures payées prévues. Taux de rotation = (départs + arrivées) ÷ 2 ÷ effectif moyen.",
    },
    {
      id: "les-indicateurs-sociaux",
      objectifs: [0],
      type: "montants",
      titre: "Absentéisme et rotation",
      notions: ["staff_turnover"],
      question: (c) => {
        const x = climatDeLEquipe(c);
        const r = MOUVEMENTS_DE_N_MOINS_1;
        return `Calculez le taux d'absentéisme de l'équipe en janvier (${h(x.s.absences)} d'absence pour ${h(x.s.heures)} payées), puis celui de ${x.m.prenom} (${h(x.m.absences)} sur ${h(x.m.heures)}). Calculez enfin le taux de rotation de N − 1 : ${qte(r.departs)} départs et ${qte(r.arrivees)} arrivées pour ${qte(r.effectifMoyen)} salariés en moyenne. Tout à deux décimales.`;
      },
      champs: (c) => {
        const x = climatDeLEquipe(c);
        const r = MOUVEMENTS_DE_N_MOINS_1;
        return [
          { libelle: "Absentéisme de l'équipe (%)", attendu: auCentime(x.s.absenteisme * 100), calcul: `${h(x.s.absences)} ÷ ${h(x.s.heures)} × 100 = ${pct(auCentime(x.s.absenteisme * 100))}` },
          { libelle: `Absentéisme de ${x.m.prenom} (%)`, attendu: auCentime(x.m.taux * 100), calcul: `${h(x.m.absences)} ÷ ${h(x.m.heures)} × 100 = ${pct(auCentime(x.m.taux * 100))}` },
          { libelle: "Taux de rotation (%)", attendu: auCentime(x.s.rotation * 100), calcul: `(${qte(r.departs)} + ${qte(r.arrivees)}) ÷ 2 ÷ ${qte(r.effectifMoyen)} × 100 = ${pct(auCentime(x.s.rotation * 100))}` },
        ];
      },
      explication: (c) => {
        const x = climatDeLEquipe(c);
        return [
          `L'équipe s'absente ${pct(auCentime(x.s.absenteisme * 100))} de ses heures ; ${x.m.prenom}, ${pct(auCentime(x.m.taux * 100))}. Un taux d'équipe moyen peut cacher un salarié en difficulté. Et ${qte(MOUVEMENTS_DE_N_MOINS_1.departs)} départs par an veulent dire un recrutement, et une intégration, tous les ${qte(12 / MOUVEMENTS_DE_N_MOINS_1.departs)} mois.`,
        ];
      },
    },
    {
      id: "le-cout-des-absences",
      objectifs: [1],
      type: "montants",
      titre: "Ce que coûtent les absences",
      notions: ["payroll", "contribution_margin"],
      question: (c) => {
        const x = climatDeLEquipe(c);
        return `Sans formule cette fois. Sur les ${h(x.s.absences)} d'absence, ${h(HEURES_REMPLACEES)} ont été remplacées par des heures complémentaires des temps partiels (${eur(BRUT_HORAIRE_DU_RENFORT)} bruts majorés de ${pct(MAJORATION_DES_HEURES_COMPLEMENTAIRES * 100)}, plus ${pct(x.f.tauxPatronal * 100)} de cotisations). Chaque heure non remplacée fait perdre ${qte(PASSAGES_PERDUS_PAR_HEURE)} passage en caisse, à ${eur(x.k.margeDUnPassage)} de marge. Calculez le coût d'une heure complémentaire, le coût du remplacement, la marge perdue, le coût du mois, puis d'une année de mois comme janvier.`;
      },
      champs: (c) => {
        const x = climatDeLEquipe(c);
        const k = x.k;
        return [
          { libelle: "Coût d'une heure complémentaire", attendu: k.heureComplementaire, calcul: `${eur(BRUT_HORAIRE_DU_RENFORT)} × ${qte(1 + MAJORATION_DES_HEURES_COMPLEMENTAIRES)} × ${qte(1 + x.f.tauxPatronal)} = ${eur(k.heureComplementaire)}` },
          { libelle: "Coût du remplacement", ...deuxChemins(k.remplacement, k.sansArrondi.remplacement), calcul: `${h(k.remplacees)} × ${eur(k.heureComplementaire)} = ${eur(k.remplacement)}` },
          { libelle: "Marge perdue", attendu: k.margePerdue, calcul: `${h(k.nonRemplacees)} non remplacées × ${eur(k.margeDUnPassage)} = ${eur(k.margePerdue)}` },
          { libelle: "Coût du mois", ...deuxChemins(k.total, k.sansArrondi.total), calcul: `${eur(k.remplacement)} + ${eur(k.margePerdue)} = ${eur(k.total)}` },
          { libelle: "Coût de l'année", ...deuxChemins(k.parAn, k.sansArrondi.parAn), calcul: `${eur(k.total)} × 12 = ${eur(k.parAn)}` },
        ];
      },
      explication: (c) => {
        const x = climatDeLEquipe(c);
        return [
          `L'absentéisme de janvier coûte ${eur(x.k.total)}, dont ${eur(x.k.margePerdue)} de ventes qui ne se font pas. Sur une année, ${eur(x.k.parAn)} : plus de ${qte(Math.floor(x.k.parAn / (TEMPS_PARTIEL.brutMensuel * (1 + x.f.tauxPatronal))))} mois du coût d'un temps partiel.`,
        ];
      },
    },
    {
      id: "predire-le-remplacement",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le remplacement",
      notions: ["payroll"],
      question: (c) => {
        const x = climatDeLEquipe(c);
        return `Avant le laboratoire, pariez. Une heure remplacée coûte ${eur(x.k.heureComplementaire)} ; une heure non remplacée fait perdre ${eur(x.k.margeDUnPassage)} de marge. Pour que l'absence coûte le moins, la boutique doit…`;
      },
      options: () => {
        const voir = "Le laboratoire suivant fait varier les absences et les heures remplacées.";
        return [
          { texte: "Remplacer le plus d'heures possible", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Ne rien remplacer : les heures complémentaires sont majorées", juste: false, retour: `Pari à vérifier : la majoration est petite face à la vente perdue. ${voir}` },
          { texte: "Remplacer la moitié, pour partager le coût", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-absences",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire des absences",
      notions: ["payroll", "staff_turnover"],
      question: () =>
        `Faites varier les heures d'absence du mois et les heures remplacées par des heures complémentaires. La loi plafonne celles-ci au dixième des contrats des temps partiels : au plus ${h(HEURES_COMPLEMENTAIRES_POSSIBLES)} sur le mois. Le tableau suit le coût du remplacement, la marge perdue et le coût total.`,
      leviers: (c) => {
        const x = climatDeLEquipe(c);
        return [
          { code: "absences", libelle: "Heures d'absence du mois", unite: "h", ...LEVIERS_DES_ABSENCES.absences, depart: x.s.absences },
          { code: "remplacees", libelle: "Heures remplacées", unite: "h", ...LEVIERS_DES_ABSENCES.remplacees, depart: HEURES_REMPLACEES },
        ];
      },
      lecture: (c, p) => {
        const x = climatDeLEquipe(c);
        const k = coutDesAbsences(x.f, p.absences!, p.remplacees!);
        return [
          { libelle: "Taux d'absentéisme", montant: auCentime((p.absences! / x.s.heures) * 100), reference: auCentime(x.s.absenteisme * 100), unite: "%" },
          { libelle: "Heures non remplacées", montant: k.nonRemplacees, reference: x.k.nonRemplacees, unite: "h" },
          { libelle: "Coût du remplacement", montant: -k.remplacement + 0, reference: -x.k.remplacement + 0, effet: true },
          { libelle: "Marge perdue", montant: -k.margePerdue + 0, reference: -x.k.margePerdue + 0, effet: true },
          { libelle: "Coût du mois", montant: k.total, reference: x.k.total, fort: true },
        ];
      },
      graphique: (c) => {
        const x = climatDeLEquipe(c);
        return {
          levier: "absences",
          courbes: [
            { libelle: "Coût du mois", valeur: (p) => coutDesAbsences(x.f, p.absences!, p.remplacees!).total },
            { libelle: "Marge perdue", valeur: (p) => coutDesAbsences(x.f, p.absences!, p.remplacees!).margePerdue },
          ],
        };
      },
      defi: (c) => {
        const x = climatDeLEquipe(c);
        return {
          consigne: `Avec les ${h(x.s.absences)} d'absence de janvier, trouvez le remplacement qui coûte le moins.`,
          atteint: (p) => p.absences === x.s.absences && coutDesAbsences(x.f, p.absences!, p.remplacees!).total === x.auMieux.total,
          indice: (p) => {
            if (p.absences !== x.s.absences) return `Le défi se joue sur les absences de janvier : remettez-les à ${h(x.s.absences)}.`;
            const k = coutDesAbsences(x.f, p.absences!, p.remplacees!);
            return `Le mois coûte ${eur(k.total)}. Une heure remplacée coûte ${eur(k.heureComplementaire)}, une heure perdue ${eur(k.margeDUnPassage)} : que vaut-il mieux ?`;
          },
          solution: { absences: x.s.absences, remplacees: HEURES_COMPLEMENTAIRES_POSSIBLES },
        };
      },
      explication: (c) => {
        const x = climatDeLEquipe(c);
        return [
          `Remplacer les ${h(HEURES_COMPLEMENTAIRES_POSSIBLES)} permises ramène le mois à ${eur(x.auMieux.total)} ; ne rien remplacer coûterait ${eur(x.sansRemplacement.total)}. Mais au-delà du plafond, chaque heure d'absence coûte toute sa marge : le vrai levier est l'absentéisme lui-même.`,
          "La courbe monte d'abord doucement avec les absences, au coût des heures remplacées, puis plus vite : une fois les heures complémentaires épuisées, chaque heure d'absence coûte une vente.",
        ];
      },
    },
    {
      id: "signes-et-facteurs",
      objectifs: [2],
      type: "tri",
      titre: "Les signes et les facteurs",
      notions: ["staff_turnover"],
      question: (c) => {
        const x = climatDeLEquipe(c);
        return `Voici ce que le manager relève autour de ${x.m.prenom}. Rangez chaque élément : un signe de stress (ce qui se voit chez lui), ou un facteur de risque (ce qui, dans le travail, peut le causer).`;
      },
      categories: [
        { code: "signe", libelle: "Un signe de stress" },
        { code: "facteur", libelle: "Un facteur de risque" },
      ],
      elements: (c) => {
        const x = climatDeLEquipe(c);
        return [
          { libelle: "Retards en janvier", montant: x.m.retards, categorie: "signe", pourquoi: "Des retards répétés chez un vendeur ponctuel jusque-là se voient : c'est un signe." },
          { libelle: "Heures d'arrêt maladie en janvier", montant: x.m.absences, categorie: "signe", pourquoi: "Les absences courtes et répétées sont l'un des premiers signes d'un stress au travail." },
          { libelle: "Taux de transformation tombé, en %", montant: auCentime(x.v.transformation * 100), categorie: "signe", pourquoi: "Une performance qui baisse est un signe, pas une cause : il faut chercher ce qui la fait baisser." },
          { libelle: "Soirs par semaine où il ferme seul la boutique", montant: SOIRS_DE_FERMETURE_SEUL, categorie: "facteur", pourquoi: "Fermer seul, la caisse en main, isole et inquiète : c'est une condition de travail, un facteur." },
          { libelle: "Objectif du mois fixé sans échange, en euros", montant: x.v.objectif, categorie: "facteur", pourquoi: "Un objectif imposé sans moyens ni dialogue est un facteur de stress reconnu." },
          { libelle: "Samedis sur quatre disputés avec une collègue", montant: SAMEDIS_DISPUTES, categorie: "facteur", pourquoi: "Un conflit sur l'organisation du travail est un facteur : il use, même sans éclat." },
        ];
      },
      relance: "Un signe se voit chez la personne ; un facteur est dans le travail, son organisation, ses relations.",
      explication: (c) => {
        const x = climatDeLEquipe(c);
        return [
          `Les signes disent que ${x.m.prenom} va mal ; les facteurs disent pourquoi, et ce sont eux que le manager peut changer. Traiter les signes seuls (sanctionner les retards) laisserait les causes en place.`,
          "Les risques psychosociaux se préviennent : l'employeur les évalue dans le document unique d'évaluation des risques, et agit sur l'organisation, la charge et les relations de travail.",
        ];
      },
    },
    {
      id: "le-conflit",
      objectifs: [2],
      type: "choix",
      titre: "Le conflit des samedis",
      notions: ["staff_turnover"],
      question: (c) => {
        const x = climatDeLEquipe(c);
        return `La vendeuse à temps partiel reproche à ${x.m.prenom} de lui prendre les clients du samedi après-midi ; lui dit qu'on lui laisse les créneaux calmes. Le ton monte devant les clients. De quel conflit s'agit-il, et comment le traiter ?`;
      },
      options: () => [
        {
          texte: "Un conflit d'intérêt : une médiation, puis une règle commune",
          juste: true,
          retour: "Oui : ils se disputent une ressource, les créneaux et les clients. Le manager les écoute chacun, puis ensemble, sur les faits ; une règle écrite (des samedis en roulement, un client à tour de rôle à l'entrée) supprime la cause.",
        },
        {
          texte: "Un conflit de personnes : les séparer sur le planning, sans en parler",
          juste: false,
          retour: "Non : éviter le conflit ne le règle pas, et les séparer priverait les samedis de l'un ou de l'autre. La cause, le partage des clients, resterait.",
        },
        {
          texte: "Un caprice : trancher pour la vendeuse, plus ancienne",
          juste: false,
          retour: "Non : trancher sans écouter crée un perdant, qui partira ou décrochera un peu plus. L'ancienneté ne dit rien du fond.",
        },
      ],
    },
    {
      id: "l-entretien",
      objectifs: [3],
      type: "choix",
      titre: "L'entretien avec le vendeur",
      notions: ["pay_and_motivation"],
      question: (c) => {
        const x = climatDeLEquipe(c);
        return `La responsable reçoit ${x.m.prenom}. Comment conduit-elle l'entretien ?`;
      },
      options: () => [
        {
          texte: "Elle prépare les faits, écoute, reformule et convient d'un plan",
          juste: true,
          retour: "Oui : un entretien se prépare (les faits, datés), se tient au calme, laisse parler (questions ouvertes, écoute active, reformulation), et se conclut par des actions et une date de suivi.",
        },
        {
          texte: "Elle lui lit ses chiffres devant l'équipe, pour le motiver",
          juste: false,
          retour: "Non : exposer un salarié devant ses collègues l'humilie. Un entretien se tient en tête à tête.",
        },
        {
          texte: "Elle lui annonce une sanction, puis lui demande ce qui ne va pas",
          juste: false,
          retour: "Non : commencer par la sanction ferme la discussion. Il ne dira plus rien de ce qui le fait décrocher.",
        },
      ],
    },
    {
      id: "la-reunion",
      objectifs: [3],
      type: "choix",
      titre: "La réunion et l'information",
      notions: ["pay_and_motivation"],
      question: () => "Les samedis passent en roulement le mois prochain. Comment la responsable informe-t-elle l'équipe ?",
      options: () => [
        {
          texte: `Une réunion, puis le planning affiché ${qte(REGLES_DU_PLANNING.delaiDePrevenance)} jours ouvrés avant`,
          juste: true,
          retour: `Oui : une réunion courte, avec un ordre du jour, explique la règle et écoute les objections ; un compte rendu et le planning affiché la fixent. Changer les horaires d'un temps partiel demande ${qte(REGLES_DU_PLANNING.delaiDePrevenance)} jours ouvrés de délai de prévenance.`,
        },
        {
          texte: "Un message à chacun sur son téléphone, la veille au soir du premier samedi",
          juste: false,
          retour: `Non : la veille, c'est trop tard. Les temps partiels ont droit à ${qte(REGLES_DU_PLANNING.delaiDePrevenance)} jours ouvrés de prévenance, et une règle qui change le travail de tous s'explique de vive voix.`,
        },
        {
          texte: "Rien : chacun découvrira le planning en arrivant",
          juste: false,
          retour: "Non : une décision qu'on découvre se conteste. L'information se diffuse à temps, par le bon canal, et se vérifie.",
        },
      ],
    },
    {
      id: "le-droit-et-les-risques",
      type: "lecture",
      titre: "Les risques psychosociaux et le droit",
      notions: ["staff_turnover"],
      texte: () => [
        "L'employeur doit protéger la santé physique et mentale de ses salariés : c'est son obligation de sécurité. Il évalue les risques, psychosociaux compris, dans le document unique, et agit pour les prévenir.",
        "Le harcèlement moral est interdit, qu'il vienne d'un manager ou d'un collègue. Un salarié face à un danger grave et imminent peut alerter l'employeur et se retirer de la situation.",
        "Face à un comportement critique (un client agressif, un collègue qui menace), la règle est la même : protéger les personnes d'abord, ne pas répondre à l'agressivité, appeler à l'aide, puis écrire les faits.",
      ],
      repere: () => "Signes de stress : absences, retards, erreurs, irritabilité, baisse de performance. Facteurs : charge, isolement, objectifs sans moyens, conflits, manque de reconnaissance.",
    },
    {
      id: "le-client-agressif",
      objectifs: [2],
      type: "choix",
      titre: "Un client agressif",
      notions: ["staff_turnover"],
      question: (c) => {
        const x = climatDeLEquipe(c);
        return `Un samedi, un client refuse le remboursement d'un pull porté et se met à crier contre ${x.m.prenom}, seul en caisse. Que doit faire l'équipe ?`;
      },
      options: () => [
        {
          texte: "Le rejoindre, parler calmement, isoler le client",
          juste: true,
          retour: "Oui : on ne laisse pas un salarié seul face à l'agressivité. Un second vendeur rejoint la caisse, parle calmement, propose un endroit à l'écart ; si la menace monte, on appelle la police. L'incident s'écrit, et le manager en parle avec le vendeur.",
        },
        {
          texte: "Laisser le vendeur gérer : c'est à lui de calmer ses clients",
          juste: false,
          retour: "Non : l'employeur doit protéger ses salariés. Laisser un vendeur seul face à un client agressif l'expose, et nourrit son stress.",
        },
        {
          texte: "Rembourser le pull tout de suite, pour qu'il se taise",
          juste: false,
          retour: "Non : céder à l'agressivité apprend qu'elle paie, et désavoue le vendeur qui appliquait la règle.",
        },
      ],
    },
    {
      id: "la-panne-de-caisse",
      objectifs: [4],
      type: "montants",
      titre: "La caisse en panne un samedi",
      notions: ["revenue", "contribution_margin"],
      question: (c) => {
        const x = climatDeLEquipe(c);
        const debut = CRENEAUX[PANNE_DE_CAISSE.creneaux[0]!];
        return `Un samedi, la caisse et le terminal de paiement tombent en panne pendant ${qte(PANNE_DE_CAISSE.creneaux.length)} heures, à partir de ${debut}. Ces créneaux reçoivent ${qte(x.p.entreesDeLaPanne)} des ${qte(x.p.entreesDeLaSemaine)} entrées de la semaine type ; la semaine encaisse ${eur(x.p.caisseParSemaine)}. Calculez les ventes de ces heures, ce que la boutique perd sans plan de secours (${pct(PANNE_DE_CAISSE.pertesSansPlan * 100)} des ventes) et avec (${pct(PANNE_DE_CAISSE.pertesAvecPlan * 100)}), puis la marge que le plan sauve (au taux de marge de janvier).`;
      },
      champs: (c) => {
        const x = climatDeLEquipe(c);
        const p = x.p;
        return [
          { libelle: "Ventes des heures de la panne", attendu: p.ventes, calcul: `${eur(p.caisseParSemaine)} × ${qte(p.entreesDeLaPanne)} ÷ ${qte(p.entreesDeLaSemaine)} = ${eur(p.ventes)}` },
          { libelle: "Ventes perdues sans plan", attendu: p.perduSans, calcul: `${eur(p.ventes)} × ${pct(PANNE_DE_CAISSE.pertesSansPlan * 100)} = ${eur(p.perduSans)}` },
          { libelle: "Ventes perdues avec le plan", attendu: p.perduAvec, calcul: `${eur(p.ventes)} × ${pct(PANNE_DE_CAISSE.pertesAvecPlan * 100)} = ${eur(p.perduAvec)}` },
          { libelle: "Marge sauvée par le plan", attendu: p.margeSauvee, calcul: `(${eur(p.perduSans)} − ${eur(p.perduAvec)}) × ${pct(auCentime(p.tauxDeMarge * 100))} = ${eur(p.margeSauvee)}` },
        ];
      },
      explication: (c) => {
        const x = climatDeLEquipe(c);
        return [
          `Une seule panne d'un samedi après-midi coûte ${eur(auCentime(x.p.perduSans * x.p.tauxDeMarge))} de marge sans plan. Le terminal de secours coûte ${eur(x.p.secoursParAn)} par an : une panne suffit à le payer.`,
          "Le plan opérationnel se prépare avant la crise : qui fait quoi, avec quel matériel, dans quel ordre. Le jour venu, on l'applique, on ne l'invente pas.",
        ];
      },
    },
    {
      id: "le-plan-de-communication",
      objectifs: [4],
      type: "choix",
      titre: "Le plan de communication de crise",
      notions: ["revenue"],
      question: () => "Pendant la panne, des clients font la queue et s'impatientent. Que prévoit le plan de communication ?",
      options: () => [
        {
          texte: "Un vendeur à la porte et un message clair, répété",
          juste: true,
          retour: "Oui : on dit vite ce qui se passe et ce qu'on propose (paiement par le terminal de secours, ticket écrit à la main), toujours le même message, par une seule voix. Après la crise, un mot aux clientes fidèles et un bilan avec l'équipe.",
        },
        {
          texte: "Ne rien dire, pour ne pas inquiéter les clients",
          juste: false,
          retour: "Non : le silence laisse chacun imaginer le pire, et la file se vide. En crise, on informe tôt.",
        },
        {
          texte: "Fermer la boutique sans explication jusqu'à la réparation",
          juste: false,
          retour: "Non : c'est perdre toutes les ventes de l'après-midi, et des clients qui trouvent porte close sans savoir pourquoi.",
        },
      ],
    },
    {
      id: "la-premiere-mesure",
      objectifs: [2, 3],
      type: "choix",
      titre: "Quelle mesure en premier ?",
      notions: ["staff_turnover", "pay_and_motivation"],
      question: (c) => {
        const x = climatDeLEquipe(c);
        return `${x.m.prenom} décroche, s'absente, arrive en retard, et se dispute les samedis avec une collègue. Par quoi le manager commence-t-il ?`;
      },
      options: (c) => {
        const x = climatDeLEquipe(c);
        return [
          { texte: "Un entretien avec lui, puis la règle des samedis", juste: true, retour: `Oui : l'entretien cherche les causes, la règle commune règle le conflit, et le roulement de la fermeture le sort de l'isolement. Ses ${h(x.m.absences)} d'absence valent ${eur(auCentime(x.m.absences * x.k.margeDUnPassage))} de marge par mois quand elles ne sont pas remplacées.` },
          { texte: "Un avertissement pour ses retards et ses absences", juste: false, retour: "Non : sanctionner les signes sans chercher les causes aggrave le stress, et un arrêt maladie n'est pas une faute." },
          { texte: "Une prime pour le remotiver, sans changer le reste", juste: false, retour: "Non : une prime ne règle ni l'isolement ni le conflit. Elle coûterait sans traiter la cause." },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["staff_turnover", "payroll"],
      tableau: (c) => {
        const x = climatDeLEquipe(c);
        return {
          titre: `${x.f.entreprise} · le climat de l'équipe en janvier`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Absentéisme de l'équipe", valeurs: [pct(auCentime(x.s.absenteisme * 100))] },
            { libelle: `Absentéisme de ${x.m.prenom}`, valeurs: [pct(auCentime(x.m.taux * 100))] },
            { libelle: "Rotation de N − 1", valeurs: [pct(auCentime(x.s.rotation * 100))] },
            { libelle: "Coût des absences du mois", valeurs: [eur(x.k.total)] },
            { libelle: "Coût au mieux remplacé", valeurs: [eur(x.auMieux.total)] },
            { libelle: "Marge sauvée par le plan de secours", valeurs: [eur(x.p.margeSauvee)] },
          ],
        };
      },
      texte: (c) => {
        const x = climatDeLEquipe(c);
        return [
          `Les indicateurs sociaux se calculent comme les autres : ${pct(auCentime(x.s.absenteisme * 100))} d'absentéisme à ${x.f.entreprise}, mais ${pct(auCentime(x.m.taux * 100))} pour ${x.m.prenom}. Une absence coûte, remplacée ou non : ${eur(x.k.total)} en janvier.`,
          "Derrière les chiffres, le manager lit des signes de stress et cherche leurs facteurs dans le travail. Un conflit d'intérêt se règle par la médiation et une règle commune, un entretien par la préparation et l'écoute.",
          "Une crise se prépare avant d'arriver : un plan opérationnel, qui fait quoi, et un plan de communication, quoi dire, à qui, par qui.",
          "Les limites de la méthode : le lien entre une heure absente et une vente perdue est une hypothèse, et un indicateur social signale un problème sans le nommer ; seul l'échange le nomme.",
          "Au niveau de l'examen, vous savez calculer et chiffrer les indicateurs sociaux, repérer les risques psychosociaux, diagnostiquer un conflit, conduire un entretien et une réunion, et bâtir un plan de crise.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût d'une absence = heures remplacées × coût d'une heure complémentaire + heures non remplacées × marge perdue par heure. Un conflit : écouter chacun, puis ensemble, sur les faits, et fixer une règle.",
    },
  ],
};
