import { arrondi2 as auCentime, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  ACCEPTATION_AU_RETRAIT,
  JOURS_DE_RETRACTATION,
  JOURS_POUR_REMBOURSER,
  MARGE_VISEE_PAR_SAMEDI,
  MOIS_DE_PROLONGATION_SANS_INFORMATION,
  gainDeLaFormation,
  retractation,
  samediDesVendeurs,
  type CodeDeTechnique,
} from "../monde/clientele-de-la-boutique";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "./taux-de-marque";

/**
 * CHAPITRE : LA VENTE CONSEIL (BTS MCO, bloc 1, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : un samedi de janvier de MAILLE & CO, ses 240 entrées (la
 * fiche, monde/maille-et-co.ts) et trois vendeurs de l'équipe, client par client
 * (monde/clientele-de-la-boutique.ts, `samediDesVendeurs`, `gainDeLaFormation`, `retractation`).
 *
 * L'objet : vendre, c'est conduire un entretien, et cela se mesure. L'élève range les phrases d'un vendeur
 * dans les étapes de la vente ; calcule, vendeur par vendeur, la transformation, l'indice de vente et le
 * panier ; puis le taux de vente additionnelle (l'écharpe avec le cardigan) et de montée en gamme (le
 * mérinos plutôt que le col rond), et la marge que chaque technique apporte. Il chiffre un parcours
 * omnicanal (vu en ligne, acheté en boutique ; le retrait d'une commande), distingue la vente en boutique
 * de la vente à distance (le droit de rétractation de 14 jours) et choisit la technique à former d'abord.
 *
 * Le piège central : la vente additionnelle se voit plus (une écharpe de plus sur le ticket), la montée en
 * gamme rapporte plus (47,50 € de marge de plus, contre 19 €). Et un achat en boutique n'ouvre aucun droit
 * de rétractation.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, les-etapes, la-transformation (la formule dans la question) ;
 *   · autonome : indice-et-panier, la-vente-additionnelle, la-montee-en-gamme, le-parcours-omnicanal ;
 *   · l'expérience avant la formule : predire-la-technique, puis le-laboratoire-de-la-formation (la
 *     technique et le taux visé, la marge gagnée par samedi ; le graphique selon le taux) ;
 *   · expert : la-marge-par-client, vendre-a-distance (un tri), la-retractation ; puis quelle-technique
 *     et la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les taux se donnent à deux décimales (au dixième, avant) ;
 * l'indice de vente est une grandeur au centième ; les articles en plus et les jours du mois sont des
 * quantités, entières, déclarées comme telles.
 */

const qte = nombreAuCentieme;

export const POURQUOI_LA_VENTE =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît un samedi de janvier vendeur par vendeur : la vente conseil s'y mesure, quelle que soit votre entreprise.";

/** Les techniques, dans l'ordre du levier à choix du laboratoire. */
export const TECHNIQUES: readonly { code: CodeDeTechnique; valeur: number; libelle: string }[] = [
  { code: "additionnelle", valeur: 1, libelle: "Vente additionnelle" },
  { code: "gamme", valeur: 2, libelle: "Montée en gamme" },
];
export const techniqueDe = (valeur: number): CodeDeTechnique => TECHNIQUES.find((t) => t.valeur === valeur)!.code;
export const DEPART_DU_LABORATOIRE = { technique: 1, taux: 50 };
export const TAUX_DU_LABORATOIRE = { min: 0, max: 80, pas: 5 } as const;
/** La solution du laboratoire : la montée en gamme, à 30 %, sous le taux du meilleur vendeur. */
export const SOLUTION_DU_LABORATOIRE = { technique: "gamme" as CodeDeTechnique, taux: 30 };

/** Le samedi du chapitre : tout ce que le chapitre et son cas demandent. */
export function venteDuChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = samediDesVendeurs(f);
  const nom = (code: string) => s.vendeur(code as "vendeur").poste.split(",")[0]!;
  return { f, s, nom, r: retractation(f) };
}

/** Le samedi des trois vendeurs : le document de départ. */
export function tableauDuSamedi(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = venteDuChapitre(c);
  return {
    titre: `Un samedi de ${x.f.moisDeReference} chez ${x.f.entreprise} (${qte(x.s.entrees)} entrées)`,
    colonnes: ["Clients accueillis", "Passages en caisse", "Articles", "Chiffre hors taxes"],
    lignes: x.s.vendeurs.map((v) => ({ libelle: x.nom(v.code), valeurs: [qte(v.prisEnCharge), qte(v.tickets), qte(v.articles), eur(v.chiffre)] })),
  };
}

/** Ce que chaque vendeur a vendu, cardigans et pulls. */
export function tableauDesTechniques(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = venteDuChapitre(c);
  return {
    titre: "Les cardigans et les pulls du samedi",
    colonnes: ["Cardigans", "Écharpes ajoutées au cardigan", "Pulls", "Dont mérinos"],
    lignes: x.s.vendeurs.map((v) => ({ libelle: x.nom(v.code), valeurs: [qte(v.cardigans), qte(v.echarpesAvecLeCardigan), qte(v.pulls), qte(v.merinos)] })),
  };
}

function tableauDeLaSynthese(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = venteDuChapitre(c);
  return {
    titre: "Les trois vendeurs, indicateur par indicateur",
    colonnes: ["Transformation", "Panier", "Vente additionnelle", "Montée en gamme", "Marge par client"],
    lignes: x.s.vendeurs.map((v) => ({
      libelle: x.nom(v.code),
      valeurs: [pct(auCentime(v.transformation * 100)), eur(auCentime(v.panier)), pct(auCentime(v.venteAdditionnelle * 100)), pct(auCentime(v.monteeEnGamme * 100)), eur(auCentime(v.margeParClient))],
    })),
  };
}

export const LA_VENTE_CONSEIL: Chapitre = {
  code: "la-vente-conseil",
  parcours: "mco",
  palier: 3,
  blocs: ["BTS MCO Bloc 1 · Développer la relation client et assurer la vente conseil"],
  titre: "La vente conseil",
  accroche:
    "Un samedi, trois vendeurs, 200 clients accueillis. Les étapes de la vente, la transformation et le panier de chacun, la vente additionnelle et la montée en gamme, le client qui a vu l'article en ligne, et ce que change une vente à distance.",
  objectifs: [
    "Reconnaître les étapes de la vente conseil et les techniques qui les servent",
    "Calculer, vendeur par vendeur, le taux de transformation, l'indice de vente et le panier moyen",
    "Calculer les taux de vente additionnelle et de montée en gamme, et la marge que chaque technique apporte",
    "Chiffrer un parcours omnicanal : le client venu après le site, le retrait d'une commande",
    "Distinguer une vente en boutique d'une vente à distance : contrat, rétractation et remboursement",
  ],
  libre: false,
  prerequis: ["indicateurs-du-point-de-vente", "interroger-les-clients"],
  ensuite: ["fideliser-la-clientele"],
  entreprises: { codes: ENTREPRISES_DU_POINT_DE_VENTE, pourquoi: POURQUOI_LA_VENTE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un samedi, trois vendeurs",
      notions: ["conversion_rate", "average_basket"],
      tableau: tableauDuSamedi,
      texte: (c) => {
        const x = venteDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}, un samedi de ${x.f.moisDeReference}. ${qte(x.s.entrees)} personnes sont entrées ; trois vendeurs en ont accueilli ${qte(x.s.prisEnCharge)}, et ${qte(x.s.sansContact)} sont ressorties sans contact.`,
          "La relation commerciale ne se limite pas au passage en caisse : le contact en boutique, le site, le courriel et le retrait d'une commande sont autant de rencontres avec le même client. La gestion de la relation client (GRC) les relie dans une fiche : ses achats, sa taille, ses préférences.",
          "La vente conseil suit des étapes : accueillir, découvrir le besoin par des questions et l'écoute, argumenter (une caractéristique, l'avantage pour le client, une preuve), répondre aux objections, conclure, puis prendre congé. Le regard, la voix et la posture y comptent autant que les mots.",
          "Ce que la simulation suppose. Chaque client accueilli l'est par un seul vendeur ; une écharpe ajoutée à un cardigan l'a été sur la proposition du vendeur.",
        ];
      },
      repere: () => "Transformation d'un vendeur = passages conclus ÷ clients accueillis. Indice de vente = articles ÷ passages. Panier = chiffre d'affaires ÷ passages.",
    },
    {
      id: "les-etapes",
      objectifs: [0],
      type: "tri",
      titre: "Les étapes de la vente",
      notions: ["conversion_rate"],
      question: () => "Voici des phrases entendues le samedi. Rangez chacune dans l'étape de la vente qu'elle sert.",
      categories: [
        { code: "accueil", libelle: "Accueil" },
        { code: "decouverte", libelle: "Découverte du besoin" },
        { code: "argumentation", libelle: "Argumentation" },
        { code: "objection", libelle: "Réponse à une objection" },
        { code: "conclusion", libelle: "Conclusion" },
      ],
      elements: () => [
        { libelle: "« Bonjour, je vous laisse regarder, je reste à côté si besoin. »", montant: 0, categorie: "accueil", pourquoi: "Le premier contact : un sourire, une phrase ouverte, sans pression." },
        { libelle: "« C'est pour vous ? Vous le porterez plutôt au bureau ? »", montant: 0, categorie: "decouverte", pourquoi: "Des questions ouvertes, puis précises : le vendeur cherche le besoin avant de proposer." },
        { libelle: "« Le mérinos ne gratte pas : touchez. Il se lave en machine à 30 degrés. »", montant: 0, categorie: "argumentation", pourquoi: "Une caractéristique, l'avantage pour la cliente, et une preuve qu'elle vérifie elle-même." },
        { libelle: "« C'est cher, je trouve. »… « Il vous durera plusieurs hivers. »", montant: 0, categorie: "objection", pourquoi: "Le vendeur reconnaît l'objection et la retourne en avantage : le prix ramené à la durée." },
        { libelle: "« Je vous le prépare en taille M, avec l'écharpe assortie ? »", montant: 0, categorie: "conclusion", pourquoi: "Le vendeur propose de conclure, et y joint une vente additionnelle." },
      ],
      explication: () => [
        "La découverte du besoin fait la vente : un vendeur qui argumente avant de savoir ce que veut le client parle dans le vide. La vente additionnelle et la montée en gamme se jouent à la conclusion, quand le client a dit oui à l'essentiel.",
      ],
      relance: "Demandez-vous ce que le vendeur cherche à obtenir avec cette phrase : un contact, une information, une conviction, un accord ?",
    },
    {
      id: "la-transformation",
      objectifs: [1],
      type: "montants",
      titre: "La transformation de chaque vendeur",
      notions: ["conversion_rate"],
      tableau: tableauDuSamedi,
      question: () => "Calculez le taux de transformation de chaque vendeur : ses passages en caisse ÷ les clients qu'il a accueillis, en pourcentage, à deux décimales.",
      champs: (c) => {
        const x = venteDuChapitre(c);
        return x.s.vendeurs.map((v) => ({
          libelle: `Transformation · ${x.nom(v.code)} (%)`,
          attendu: auCentime(v.transformation * 100),
          calcul: `${qte(v.tickets)} ÷ ${qte(v.prisEnCharge)} × 100 = ${pct(auCentime(v.transformation * 100))}`,
        }));
      },
      explication: (c) => {
        const x = venteDuChapitre(c);
        const e = x.s.vendeur("etudiante");
        return [`Le vendeur et la vendeuse concluent ${pct(auCentime(x.s.vendeur("vendeur").transformation * 100))} de leurs entretiens, l'étudiante ${pct(auCentime(e.transformation * 100))}. La transformation d'un vendeur se compte sur les clients qu'il a accueillis, pas sur les entrées de la boutique.`];
      },
    },
    {
      id: "indice-et-panier",
      objectifs: [1],
      type: "montants",
      titre: "L'indice de vente et le panier",
      notions: ["average_basket"],
      tableau: tableauDuSamedi,
      question: () => "Sans formule cette fois. Calculez l'indice de vente (au centième) et le panier moyen hors taxes (au centime) de chaque vendeur.",
      champs: (c) => {
        const x = venteDuChapitre(c);
        return x.s.vendeurs.flatMap((v) => [
          { libelle: `Indice de vente · ${x.nom(v.code)}`, nature: "grandeur", attendu: auCentime(v.indice), calcul: `${qte(v.articles)} ÷ ${qte(v.tickets)} = ${qte(auCentime(v.indice))}` },
          { libelle: `Panier moyen · ${x.nom(v.code)}`, attendu: auCentime(v.panier), calcul: `${eur(v.chiffre)} ÷ ${qte(v.tickets)} = ${eur(auCentime(v.panier))}` },
        ]);
      },
      explication: (c) => {
        const x = venteDuChapitre(c);
        const v = x.s.vendeur("vendeur");
        const d = x.s.vendeur("vendeuse-partiel");
        return [
          `La vendeuse met le plus d'articles par passage (${qte(auCentime(d.indice))}), le vendeur fait le plus gros panier (${eur(auCentime(v.panier))}) avec moins d'articles : il vend plus cher, elle vend plus. Deux talents différents, que les deux techniques suivantes mesurent.`,
        ];
      },
    },
    {
      id: "predire-la-technique",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la technique",
      notions: ["average_basket", "contribution_margin"],
      question: (c) => {
        const x = venteDuChapitre(c);
        return `Avant de calculer, pariez. Une écharpe ajoutée à un cardigan laisse ${eur(x.s.margeDUneEcharpe)} de marge ; un mérinos vendu à la place d'un col rond en laisse ${eur(x.s.margeDeLaMontee)} de plus. Former l'équipe à laquelle des deux rapporterait le plus par samedi ?`;
      },
      options: () => {
        const voir = "Le laboratoire qui suit fait monter le taux de chaque technique chez les vendeurs qui en sont loin : il chiffre la marge gagnée.";
        return [
          { texte: "La montée en gamme", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "La vente additionnelle", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Les deux autant", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-vente-additionnelle",
      objectifs: [2],
      type: "montants",
      titre: "La vente additionnelle",
      notions: ["average_basket", "contribution_margin"],
      tableau: tableauDesTechniques,
      question: () => "Calculez le taux de vente additionnelle de chaque vendeur : les écharpes ajoutées ÷ les cardigans vendus, en pourcentage, à deux décimales. Puis la marge que ces écharpes ont apportée au samedi.",
      champs: (c) => {
        const x = venteDuChapitre(c);
        const ajoutees = x.s.vendeurs.reduce((t, v) => t + v.echarpesAvecLeCardigan, 0);
        return [
          ...x.s.vendeurs.map((v) => ({
            libelle: `Vente additionnelle · ${x.nom(v.code)} (%)`,
            attendu: auCentime(v.venteAdditionnelle * 100),
            calcul: `${qte(v.echarpesAvecLeCardigan)} ÷ ${qte(v.cardigans)} × 100 = ${pct(auCentime(v.venteAdditionnelle * 100))}`,
          })),
          { libelle: "Marge des écharpes ajoutées", attendu: auCentime(ajoutees * x.s.margeDUneEcharpe), calcul: `${qte(ajoutees)} × ${eur(x.s.margeDUneEcharpe)} = ${eur(auCentime(ajoutees * x.s.margeDUneEcharpe))}` },
        ];
      },
      explication: (c) => {
        const x = venteDuChapitre(c);
        return [`La vendeuse fait accepter l'écharpe à ${pct(auCentime(x.s.vendeur("vendeuse-partiel").venteAdditionnelle * 100))} de ses clients au cardigan ; le vendeur à ${pct(auCentime(x.s.vendeur("vendeur").venteAdditionnelle * 100))}, l'étudiante à ${pct(auCentime(x.s.vendeur("etudiante").venteAdditionnelle * 100))}. La technique se transmet : la vendeuse peut la montrer.`];
      },
    },
    {
      id: "la-montee-en-gamme",
      objectifs: [2],
      type: "montants",
      titre: "La montée en gamme",
      notions: ["average_basket", "contribution_margin"],
      tableau: tableauDesTechniques,
      question: () => "Calculez le taux de montée en gamme de chaque vendeur : les mérinos ÷ les pulls vendus, en pourcentage, à deux décimales. Puis la marge de plus que ces mérinos ont apportée, face à autant de cols ronds.",
      champs: (c) => {
        const x = venteDuChapitre(c);
        const merinos = x.s.vendeurs.reduce((t, v) => t + v.merinos, 0);
        return [
          ...x.s.vendeurs.map((v) => ({
            libelle: `Montée en gamme · ${x.nom(v.code)} (%)`,
            attendu: auCentime(v.monteeEnGamme * 100),
            calcul: `${qte(v.merinos)} ÷ ${qte(v.pulls)} × 100 = ${pct(auCentime(v.monteeEnGamme * 100))}`,
          })),
          { libelle: "Marge de plus des mérinos", attendu: auCentime(merinos * x.s.margeDeLaMontee), calcul: `${qte(merinos)} × ${eur(x.s.margeDeLaMontee)} = ${eur(auCentime(merinos * x.s.margeDeLaMontee))}` },
        ];
      },
      explication: (c) => {
        const x = venteDuChapitre(c);
        return [
          `Le vendeur oriente ${pct(auCentime(x.s.vendeur("vendeur").monteeEnGamme * 100))} de ses clients vers le mérinos ; l'étudiante, aucun. Chaque montée laisse ${eur(x.s.margeDeLaMontee)} de plus, ${qte(auCentime(x.s.margeDeLaMontee / x.s.margeDUneEcharpe))} fois une écharpe ajoutée : c'est la technique la plus payante, et la plus inégale dans l'équipe.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-formation",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de la formation",
      notions: ["average_basket", "contribution_margin"],
      question: () =>
        "Choisissez la technique à former et le taux visé : chaque vendeur en dessous l'atteint après la formation. Le tableau suit les ventes en plus et la marge gagnée par samedi ; le graphique trace cette marge selon le taux. Puis relevez le défi.",
      leviers: () => [
        { code: "technique", libelle: "Technique formée", unite: "", min: 1, max: 2, pas: 1, depart: DEPART_DU_LABORATOIRE.technique, choix: TECHNIQUES.map((t) => ({ valeur: t.valeur, libelle: t.libelle })) },
        { code: "taux", libelle: "Taux visé", unite: "%", min: TAUX_DU_LABORATOIRE.min, max: TAUX_DU_LABORATOIRE.max, pas: TAUX_DU_LABORATOIRE.pas, depart: DEPART_DU_LABORATOIRE.taux },
      ],
      lecture: (c, p) => {
        const f = ficheDe(c);
        const g = gainDeLaFormation(f, techniqueDe(p.technique!), p.taux! / 100);
        const d = gainDeLaFormation(f, techniqueDe(DEPART_DU_LABORATOIRE.technique), DEPART_DU_LABORATOIRE.taux / 100);
        return [
          { libelle: "Ventes en plus par samedi", montant: auCentime(g.ventesEnPlus), reference: auCentime(d.ventesEnPlus), unite: "articles" },
          { libelle: "Marge d'une vente en plus", montant: g.unitaire, reference: d.unitaire },
          { libelle: "Marge gagnée par samedi", montant: g.marge, reference: d.marge, effet: true, fort: true },
          { libelle: "Taux du meilleur vendeur", montant: auCentime(g.meilleur * 100), reference: auCentime(d.meilleur * 100), unite: "%" },
        ];
      },
      graphique: (c) => {
        const f = ficheDe(c);
        return {
          levier: "taux",
          courbes: [
            { libelle: "Marge gagnée par samedi", valeur: (p) => gainDeLaFormation(f, techniqueDe(p.technique!), p.taux! / 100).marge },
            { libelle: "Marge visée", valeur: () => MARGE_VISEE_PAR_SAMEDI },
          ],
        };
      },
      defi: (c) => {
        const f = ficheDe(c);
        const ok = (p: Readonly<Record<string, number>>) => {
          const g = gainDeLaFormation(f, techniqueDe(p.technique!), p.taux! / 100);
          return g.marge >= MARGE_VISEE_PAR_SAMEDI && p.taux! / 100 <= g.meilleur + 1e-9;
        };
        return {
          consigne: `Gagnez au moins ${eur(MARGE_VISEE_PAR_SAMEDI)} de marge par samedi, sans viser plus que le meilleur vendeur ne réussit déjà.`,
          atteint: ok,
          indice: (p) => {
            const g = gainDeLaFormation(f, techniqueDe(p.technique!), p.taux! / 100);
            if (p.taux! / 100 > g.meilleur + 1e-9) return `Personne dans l'équipe ne réussit ${pct(p.taux!)} : le meilleur est à ${pct(auCentime(g.meilleur * 100))}. Un taux que personne ne tient ne se forme pas en un mois.`;
            return `À ${pct(p.taux!)}, la formation rapporte ${eur(g.marge)} par samedi : il manque ${eur(auCentime(MARGE_VISEE_PAR_SAMEDI - g.marge))}. Montez le taux, ou essayez l'autre technique.`;
          },
          solution: { technique: TECHNIQUES.find((t) => t.code === SOLUTION_DU_LABORATOIRE.technique)!.valeur, taux: SOLUTION_DU_LABORATOIRE.taux },
        };
      },
      montrer: "Montrer une formation qui rapporte",
      explication: (c, p) => {
        const f = ficheDe(c);
        const g = gainDeLaFormation(f, techniqueDe(p.technique!), p.taux! / 100);
        const a = gainDeLaFormation(f, "additionnelle", 2 / 3);
        return [
          `Former à la montée en gamme jusqu'à ${pct(p.taux!)} rapporte ${eur(g.marge)} par samedi : ${qte(auCentime(g.ventesEnPlus))} mérinos de plus, à ${eur(g.unitaire)} chacun. Porter tout le monde au taux de la vendeuse en vente additionnelle n'en rapporterait que ${eur(a.marge)}.`,
          "Une technique se choisit sur la marge qu'elle apporte par client, pas sur ce qu'elle ajoute au ticket.",
        ];
      },
    },
    {
      id: "la-marge-par-client",
      objectifs: [1],
      type: "montants",
      titre: "La marge par client accueilli",
      notions: ["conversion_rate", "average_basket", "contribution_margin"],
      tableau: tableauDuSamedi,
      question: () => "Un indicateur réunit la transformation et le panier : la marge par client accueilli. Calculez-la pour chaque vendeur (sa marge sur coût variable du samedi ÷ ses clients accueillis, au centime).",
      champs: (c) => {
        const x = venteDuChapitre(c);
        return x.s.vendeurs.map((v) => ({
          libelle: `Marge par client · ${x.nom(v.code)}`,
          attendu: auCentime(v.margeParClient),
          calcul: `${eur(v.marge)} ÷ ${qte(v.prisEnCharge)} = ${eur(auCentime(v.margeParClient))}`,
        }));
      },
      explication: (c) => {
        const x = venteDuChapitre(c);
        const v = x.s.vendeur("vendeur");
        const e = x.s.vendeur("etudiante");
        return [`Un client accueilli par le vendeur laisse ${eur(auCentime(v.margeParClient))}, par l'étudiante ${eur(auCentime(e.margeParClient))}. L'écart vient de la transformation et du panier à la fois : c'est l'indicateur qui dit où former d'abord.`];
      },
    },
    {
      id: "le-parcours-omnicanal",
      objectifs: [3],
      type: "montants",
      titre: "Le client venu du site",
      notions: ["conversion_rate", "contribution_margin"],
      question: (c) => {
        const x = venteDuChapitre(c);
        return `Le samedi, ${qte(x.s.vusEnLigne)} des ${qte(x.s.tickets)} clients passés en caisse avaient vu l'article sur le site (le ROPO : chercher en ligne, acheter en boutique). En janvier, ${qte(x.s.retraits)} passages étaient des retraits de commandes. Calculez la part du ROPO le samedi (à deux décimales), les articles en plus si ${pct(ACCEPTATION_AU_RETRAIT * 100)} des clients venus retirer acceptent une proposition, et leur marge à ${eur(x.s.margeDUnArticleEnCaisse)} l'article.`;
      },
      champs: (c) => {
        const x = venteDuChapitre(c);
        return [
          { libelle: "Clients venus après le site (%)", attendu: auCentime(x.s.partDuRopo * 100), calcul: `${qte(x.s.vusEnLigne)} ÷ ${qte(x.s.tickets)} × 100 = ${pct(auCentime(x.s.partDuRopo * 100))}` },
          { libelle: "Articles en plus au retrait", nature: "quantite", attendu: x.s.articlesAuRetrait, calcul: `${qte(x.s.retraits)} × ${pct(ACCEPTATION_AU_RETRAIT * 100)} = ${qte(x.s.articlesAuRetrait)}` },
          { libelle: "Marge des articles en plus", attendu: x.s.margeAuRetrait, calcul: `${qte(x.s.articlesAuRetrait)} × ${eur(x.s.margeDUnArticleEnCaisse)} = ${eur(x.s.margeAuRetrait)}` },
        ];
      },
      explication: (c) => {
        const x = venteDuChapitre(c);
        return [
          `${pct(auCentime(x.s.partDuRopo * 100))} des clients arrivent en sachant ce qu'ils veulent : le vendeur part de ce qu'il a vu, la fiche produit du site en main ou sur la tablette. Le retrait d'une commande est une vente à part entière : proposé à chaque retrait, un article en plus ferait ${eur(x.s.margeAuRetrait)} de marge par mois. L'omnicanal, c'est un seul client par plusieurs canaux.`,
        ];
      },
    },
    {
      id: "vendre-a-distance",
      objectifs: [4],
      type: "tri",
      titre: "En boutique ou à distance",
      notions: ["conversion_rate"],
      question: () =>
        `Le contrat de vente se forme quand le client et le vendeur s'accordent sur la chose et le prix. Conclu à distance ou hors établissement, il ouvre au client un droit de rétractation de ${qte(JOURS_DE_RETRACTATION)} jours ; conclu en boutique, non. Rangez chaque achat.`,
      categories: [
        { code: "retractation", libelle: "Droit de rétractation" },
        { code: "aucun", libelle: "Pas de droit de rétractation" },
      ],
      elements: () => [
        { libelle: "Un cardigan essayé et payé en boutique", montant: 0, categorie: "aucun", pourquoi: "Le contrat est conclu en boutique : la boutique peut accepter un retour, par geste commercial, mais rien ne l'y oblige." },
        { libelle: "Un mérinos commandé et payé sur le site, retiré en boutique", montant: 0, categorie: "retractation", pourquoi: "Le contrat est conclu à distance, au paiement en ligne : le retrait en boutique n'y change rien." },
        // À VÉRIFIER : une réservation sans paiement, payée en caisse, se lit comme une vente conclue en boutique.
        { libelle: "Une écharpe réservée sur le site, payée en caisse au retrait", montant: 0, categorie: "aucun", pourquoi: "La réservation n'engage pas ; le contrat se conclut en caisse, en boutique." },
        { libelle: "Un bonnet commandé par téléphone et livré", montant: 0, categorie: "retractation", pourquoi: "Une vente à distance : le délai court à compter de la réception." },
        { libelle: "Une écharpe brodée aux initiales, commandée sur le site", montant: 0, categorie: "aucun", pourquoi: "Un bien personnalisé est exclu du droit de rétractation." },
        { libelle: "Un pull vendu lors d'une vente privée au domicile d'une cliente", montant: 0, categorie: "retractation", pourquoi: "Une vente hors établissement : le client a le même droit qu'à distance." },
      ],
      explication: () => [
        `Ce qui compte, c'est où et comment le contrat se conclut, pas où l'article se retire. Le droit de rétractation protège le client qui n'a pas vu le produit ou qu'on est venu solliciter ; il ne s'applique pas à l'achat en boutique.`,
      ],
      relance: "Demandez-vous où le client s'est engagé à payer : devant l'article, en boutique, ou à distance ?",
    },
    {
      id: "la-retractation",
      objectifs: [4],
      type: "montants",
      titre: "Une cliente qui se rétracte",
      notions: ["conversion_rate"],
      question: (c) => {
        const x = venteDuChapitre(c);
        return `Une cliente a commandé et payé un ${x.r.nom.toLowerCase()} sur le site ; elle l'a retiré le ${qte(x.r.retrait)} ${x.r.mois}. Le ${qte(x.r.decision)} ${x.r.mois}, elle se rétracte et rapporte l'article intact. Calculez le dernier jour où elle pouvait se rétracter, la somme à rembourser, et la date limite du remboursement (${qte(JOURS_POUR_REMBOURSER)} jours après sa décision).`;
      },
      champs: (c) => {
        const x = venteDuChapitre(c);
        return [
          { libelle: `Dernier jour pour se rétracter (${x.r.mois})`, nature: "quantite", attendu: x.r.dernierJour, calcul: `${qte(x.r.retrait)} + ${qte(JOURS_DE_RETRACTATION)} = le ${qte(x.r.dernierJour)} ${x.r.mois}` },
          { libelle: "Somme à rembourser", attendu: x.r.rembourse, calcul: `Le prix payé, toutes taxes comprises : ${eur(x.r.rembourse)}` },
          { libelle: `Remboursement au plus tard (${x.r.mois})`, nature: "quantite", attendu: x.r.remboursementAuPlusTard, calcul: `${qte(x.r.decision)} + ${qte(JOURS_POUR_REMBOURSER)} = le ${qte(x.r.remboursementAuPlusTard)} ${x.r.mois}` },
        ];
      },
      explication: (c) => {
        const x = venteDuChapitre(c);
        return [
          `La cliente était dans les temps : elle avait jusqu'au ${qte(x.r.dernierJour)} ${x.r.mois}. La boutique rembourse ${eur(x.r.rembourse)}, frais de livraison compris s'il y en avait, au plus tard le ${qte(x.r.remboursementAuPlusTard)}. Le site doit l'informer de ce droit avant la commande : sinon, le délai s'allonge de ${qte(MOIS_DE_PROLONGATION_SANS_INFORMATION)} mois.`,
        ];
      },
    },
    {
      id: "quelle-technique",
      objectifs: [2],
      type: "choix",
      titre: "Quelle technique former d'abord ?",
      notions: ["average_basket", "contribution_margin"],
      question: () => "La responsable peut offrir une formation d'une demi-journée avant le prochain samedi. Que lui conseillez-vous ?",
      options: (c) => {
        const x = venteDuChapitre(c);
        const g = gainDeLaFormation(x.f, SOLUTION_DU_LABORATOIRE.technique, SOLUTION_DU_LABORATOIRE.taux / 100);
        const a = gainDeLaFormation(x.f, "additionnelle", 2 / 3);
        return [
          {
            texte: "La montée en gamme, animée par le vendeur",
            juste: true,
            retour: `Oui : chaque montée laisse ${eur(x.s.margeDeLaMontee)} de plus, et la vendeuse et l'étudiante en sont loin. Porter tout le monde à ${pct(SOLUTION_DU_LABORATOIRE.taux)} rapporterait ${eur(g.marge)} par samedi, plus que la vente additionnelle même au taux de la vendeuse (${eur(a.marge)}).`,
          },
          {
            texte: "La vente additionnelle : une écharpe de plus se voit tout de suite sur le ticket",
            juste: false,
            retour: `Elle se voit, mais elle rapporte moins : ${eur(x.s.margeDUneEcharpe)} par écharpe, et ${eur(a.marge)} par samedi au mieux. La marge, pas le nombre d'articles, choisit la formation.`,
          },
          {
            texte: "Aucune : il vaut mieux faire accueillir les clients sans contact",
            juste: false,
            retour: `Accueillir les ${qte(x.s.sansContact)} clients ressortis sans contact compte aussi, mais c'est une affaire de planning, pas de technique. La formation, elle, fait mieux vendre ceux qu'on accueille déjà.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["conversion_rate", "average_basket", "contribution_margin"],
      tableau: tableauDeLaSynthese,
      texte: (c) => {
        const x = venteDuChapitre(c);
        return [
          "La vente conseil suit ses étapes : accueil, découverte du besoin, argumentation, réponse aux objections, conclusion. Elle se mesure vendeur par vendeur : transformation, indice de vente, panier, et la marge par client accueilli qui les réunit.",
          `La vente additionnelle ajoute un article, la montée en gamme le remplace par un plus cher. Ici, une écharpe ajoutée laisse ${eur(x.s.margeDUneEcharpe)}, un mérinos à la place d'un col rond ${eur(x.s.margeDeLaMontee)} de plus : on forme d'abord à la technique qui rapporte le plus par client.`,
          `Le client est omnicanal : ${pct(auCentime(x.s.partDuRopo * 100))} des clients ont vu l'article en ligne, et chaque retrait est une vente à faire. Le contrat conclu à distance ou hors établissement ouvre ${qte(JOURS_DE_RETRACTATION)} jours de rétractation, et le remboursement sous ${qte(JOURS_POUR_REMBOURSER)} jours ; l'achat en boutique, non.`,
          "Au niveau de l'examen, vous savez conduire et analyser une vente, calculer les indicateurs d'un vendeur et ce que rapporte chaque technique, et dire ce que la loi permet au client selon le canal.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "Vente additionnelle = articles ajoutés ÷ ventes de l'article principal. Montée en gamme = articles haut de gamme ÷ articles de la famille. Marge par client = marge ÷ clients accueillis.",
    },
  ],
};
