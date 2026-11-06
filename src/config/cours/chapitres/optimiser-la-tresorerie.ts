import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, exerciceDe } from "../monde/comptes-du-lycee";
import {
  DECOUVERT_AUTORISE,
  SOLUTIONS_DU_MANQUE,
  TAUX_DE_L_ESCOMPTE,
  TAUX_DU_COMPTE_COURANT,
  TAUX_DU_COMPTE_REMUNERE,
  TAUX_DU_DECOUVERT,
  couvrirLeManque,
  prixSansDecouvert,
  tresorerieAOptimiser,
  type SolutionDuManque,
} from "../monde/tresorerie-a-optimiser";
import type { Chapitre } from "../types";
import { factureDeCampusTech, fondsDeRoulement } from "./fonds-de-roulement-et-tresorerie";

/**
 * CHAPITRE : OPTIMISER LA TRÉSORERIE (Bac STMG, gestion et finance, palier 1 ; programme 3.2).
 *
 * Optimiser la trésorerie, c'est ne garder ni trop d'argent qui dort, ni trop peu, au risque d'un
 * découvert qui coûte. Le chapitre part de la trésorerie du 31 décembre de NOVA, celle du chapitre
 * « Fonds de roulement, besoin en fonds de roulement et trésorerie », sans refaire son calcul :
 *   · l'excédent : ce qui reste une fois mis de côté ce qu'il faut payer bientôt, et où le placer
 *     (rendement, risque, disponibilité) ;
 *   · le manque : le compte à terme est bloqué jusqu'au 6 janvier ; payer comptant le 31 décembre
 *     plus qu'il n'y a en banque met la banque à découvert quelques jours, alors que la trésorerie
 *     reste positive. Prédire, puis un curseur (le prix le plus haut sans découvert), puis le coût
 *     des concours bancaires (découvert, escompte), d'une avance des associés en compte courant et
 *     d'un placement cassé ;
 *   · le besoin en fonds de roulement, quand le manque dure : la solution n'est plus un concours,
 *     c'est d'agir sur les délais (le chapitre précédent) ;
 *   · le laboratoire : le prix de l'équipement et la solution ; le défi, payer au moins 150 000 €
 *     le 31 décembre pour moins de 100 € de frais.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le bilan du 31 décembre du premier exercice de NOVA
 * (monde/comptes-du-lycee.ts), lu par monde/tresorerie-a-optimiser.ts, où sont posés et justifiés
 * les taux des concours et des placements (des hypothèses du cours).
 */

/** Les bornes du curseur du prix de l'équipement payé comptant le 31 décembre, en euros. */
export const PRIX_DU_CURSEUR = { min: 0, max: 250_000 } as const;

/** L'équipement que chiffre l'étape des concours bancaires, et le prix plancher du défi. */
export const PRIX_DU_DEFI = 150_000;

/** Le défi du laboratoire : couvrir le manque pour moins de 100 € de frais. */
export const COUT_MAXIMAL_DU_DEFI = 100;

/** Les leviers du laboratoire : le prix de l'équipement payé le 31 décembre, et la solution. */
export const LEVIERS_DU_MANQUE = { prix: { min: 0, max: 250_000, pas: 10_000 } } as const;

/** La solution que montre la correction : 150 000 €, le manque couvert par le découvert. */
export const SOLUTION_DU_MANQUE = { prix: PRIX_DU_DEFI, solution: SOLUTIONS_DU_MANQUE.indexOf("decouvert") } as const;

const LIBELLES: Record<SolutionDuManque, string> = {
  decouvert: "découvert",
  escompte: "escompte de la facture de CampusTech",
  "compte-courant": "avance des associés en compte courant",
  casser: "casser le compte à terme",
};

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
/** La phrase de la banque de NOVA, quand le découvert dépasse ce qu'elle autorise. */
const auDelaDeLAutorisation = `Au-delà de l'autorisation de découvert, ${eur(DECOUVERT_AUTORISE)}, la banque finance au même taux par un crédit de trésorerie.`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La trésorerie de l'entreprise du cas, lue pour l'optimiser. */
export function optimiser(c: Pick<Cas, "code">) {
  return tresorerieAOptimiser(exerciceDe(c.code));
}

/** Une position du laboratoire : le prix, et la solution (0 découvert, 1 escompte, 2 compte courant, 3 casser). */
export const manqueDuLaboratoire = (c: Pick<Cas, "code">, p: Readonly<Record<string, number>>) => couvrirLeManque(optimiser(c), p.prix!, SOLUTIONS_DU_MANQUE[p.solution!]!);

export const OPTIMISER_LA_TRESORERIE: Chapitre = {
  code: "optimiser-la-tresorerie",
  parcours: "stmg-gf",
  palier: 1,
  blocs: ["STMG Thème 3 · Accompagner la prise de décision"],
  titre: "Optimiser la trésorerie : placer l'excédent, couvrir le manque",
  accroche:
    "De l'argent qui dort ne rapporte rien ; un découvert coûte. Où placer ce qui reste, et comment couvrir un manque au moindre coût : découvert, escompte, compte courant des associés.",
  objectifs: [
    "Mesurer l'excédent de trésorerie à placer",
    "Choisir un placement selon son rendement, son risque et sa disponibilité",
    "Calculer le coût d'un découvert, d'un escompte et d'une avance en compte courant",
    "Choisir comment couvrir un manque de trésorerie, ou agir sur le besoin en fonds de roulement",
  ],
  libre: false,
  prerequis: ["fonds-de-roulement-et-tresorerie"],
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "la trésorerie s'optimise ici sur le bilan du premier exercice de NOVA dans la simulation du cours, celui du chapitre « Fonds de roulement » ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ni trop, ni trop peu",
      notions: ["net_treasury"],
      texte: (c) => {
        const k = optimiser(c);
        return [
          `Au 31 décembre, la trésorerie ${dE(k.entreprise)} est de ${eur(k.tresorerie)} : ${eur(k.banque)} en banque et ${eur(k.placement)} sur un compte à terme, intérêts compris. Vous l'avez calculée au chapitre « Fonds de roulement » ; ici, on se demande ce qu'il faut en faire.`,
          "Optimiser la trésorerie, c'est éviter deux erreurs. Garder trop d'argent sur le compte courant : il ne rapporte rien. En placer trop, ou dépenser trop d'un coup : la banque passe à découvert, et le découvert coûte des intérêts, les agios.",
          `Le compte à terme rapporte ${pct(k.tauxDuPlacement)} par an, mais il est bloqué jusqu'à son échéance, le 6 janvier. Un placement se juge toujours sur trois points : ce qu'il rapporte (le rendement), ce qu'il peut faire perdre (le risque), et la vitesse à laquelle on récupère l'argent (la disponibilité).`,
        ];
      },
      tableau: (c) => {
        const k = optimiser(c);
        return {
          titre: `La trésorerie ${dE(k.entreprise)} au 31 décembre`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Banque", valeurs: [eur(k.banque)] },
            { libelle: "Compte à terme, intérêts compris (bloqué jusqu'au 6 janvier)", valeurs: [eur(k.placement)] },
            { libelle: "Trésorerie", valeurs: [eur(k.tresorerie)] },
            { libelle: "Dettes envers les fournisseurs", valeurs: [eur(k.b.poste("fournisseurs"))] },
            { libelle: "Dettes envers l'État et le personnel", valeurs: [eur(k.b.poste("etat"))] },
          ],
        };
      },
      repere: () => "Optimiser la trésorerie : placer ce qui dort, couvrir au moindre coût ce qui manque.",
    },
    {
      id: "l-excedent",
      objectifs: [0],
      type: "montants",
      titre: "L'argent qui peut être placé",
      notions: ["net_treasury"],
      question: (c) => {
        const k = optimiser(c);
        return `Toute la trésorerie ne se place pas : ${k.entreprise} doit bientôt payer ses fournisseurs, l'État et son personnel. Calculez ce qu'elle doit payer dans les semaines qui viennent, puis l'excédent qui peut être placé (la trésorerie moins ces dettes), et ce qu'il rapporterait en un an au taux du compte à terme, ${pct(k.tauxDuPlacement)}.`;
      },
      champs: (c) => {
        const k = optimiser(c);
        return [
          { libelle: "À payer bientôt", attendu: k.aPayerDansLeMois, calcul: `${eur(k.b.poste("fournisseurs"))} + ${eur(k.b.poste("etat"))} = ${eur(k.aPayerDansLeMois)}` },
          { libelle: "Excédent à placer", attendu: k.excedent, calcul: `${eur(k.tresorerie)} − ${eur(k.aPayerDansLeMois)} = ${eur(k.excedent)}` },
          { libelle: "Intérêts sur un an", attendu: k.interetsSurLExcedent, calcul: `${eur(k.excedent)} × ${pct(k.tauxDuPlacement)} = ${eur(k.interetsSurLExcedent)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = optimiser(c);
        return [
          `${k.entreprise} peut placer ${eur(k.excedent)} sans craindre de manquer d'argent pour ses dettes du moment. Laissés sur le compte courant, ils ne rapporteraient rien ; placés un an, ils rapporteraient ${eur(k.interetsSurLExcedent)}.`,
          `Le compte à terme arrive à échéance le 6 janvier : ${k.entreprise} va récupérer ${eur(k.placement)}, et devra décider où les replacer.`,
        ];
      },
    },
    {
      id: "quel-placement",
      objectifs: [1],
      type: "choix",
      titre: "Rendement, risque, disponibilité",
      notions: ["net_treasury"],
      question: (c) => {
        const k = optimiser(c);
        return `Sur cet excédent, ${eur(k.besoinDeLAnnee)} serviront dans l'année à payer la deuxième ligne de montage (le chapitre « Financer l'entreprise »). Où placer ces ${eur(k.besoinDeLAnnee)} ?`;
      },
      options: (c) => {
        const k = optimiser(c);
        return [
          {
            texte: "Sur un compte rémunéré, disponible à tout moment",
            juste: true,
            retour: `Oui : il ne rapporte que ${pct(TAUX_DU_COMPTE_REMUNERE)} par an, mais l'argent reste disponible le jour où il faudra payer la ligne, et il ne peut rien perdre. Pour de l'argent qui va servir, la disponibilité passe avant le rendement.`,
          },
          {
            texte: "Sur un compte à terme de deux ans",
            juste: false,
            retour: `Non : l'argent serait bloqué au-delà du jour où il faudra payer la ligne. Le rendement serait meilleur, mais ${k.entreprise} devrait casser le placement, et perdre ses intérêts, ou se mettre à découvert.`,
          },
          {
            texte: "En actions, qui rapportent davantage en moyenne sur le long terme",
            juste: false,
            retour: "Non : une action peut rapporter plus, mais son cours peut aussi baisser au moment où il faudra la vendre pour payer la ligne. Une entreprise ne place en actions que de l'argent dont elle n'aura pas besoin avant longtemps.",
          },
        ];
      },
    },
    {
      id: "partager-l-excedent",
      objectifs: [0, 1],
      type: "montants",
      titre: "Partager l'excédent",
      notions: ["net_treasury"],
      question: (c) => {
        const k = optimiser(c);
        return `${k.entreprise} place ${eur(k.besoinDeLAnnee)} sur le compte rémunéré, à ${pct(TAUX_DU_COMPTE_REMUNERE)}, et le reste de l'excédent sur un nouveau compte à terme d'un an, à ${pct(k.tauxDuPlacement)}. Calculez ce qui va sur le compte à terme, les intérêts de chaque placement sur un an, puis leur total.`;
      },
      champs: (c) => {
        const k = optimiser(c);
        return [
          { libelle: "Sur le compte à terme", attendu: k.aBloquer, calcul: `${eur(k.excedent)} − ${eur(k.besoinDeLAnnee)} = ${eur(k.aBloquer)}` },
          { libelle: "Intérêts du compte à terme", attendu: k.interetsBloques, calcul: `${eur(k.aBloquer)} × ${pct(k.tauxDuPlacement)} = ${eur(k.interetsBloques)}`, tolerance: 1 },
          { libelle: "Intérêts du compte rémunéré", attendu: k.interetsDisponibles, calcul: `${eur(k.besoinDeLAnnee)} × ${pct(TAUX_DU_COMPTE_REMUNERE)} = ${eur(k.interetsDisponibles)}`, tolerance: 1 },
          { libelle: "Intérêts en tout", attendu: k.interetsDuPartage, calcul: `${eur(k.interetsBloques)} + ${eur(k.interetsDisponibles)} = ${eur(k.interetsDuPartage)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = optimiser(c);
        return [
          `Le partage rapporte ${eur(k.interetsDuPartage)}, ${eur(auCentime(k.interetsSurLExcedent - k.interetsDuPartage))} de moins que tout l'excédent bloqué un an. C'est le prix de la disponibilité : l'argent de la ligne sera là quand il le faudra, sans découvert ni placement cassé.`,
        ];
      },
    },
    {
      id: "predire-le-paiement",
      objectifs: [3],
      type: "choix",
      titre: "Un gros paiement le 31 décembre",
      notions: ["net_treasury"],
      question: (c) => {
        const k = optimiser(c);
        return `Revenons au 31 décembre. Le fournisseur d'un équipement de ${eur(PRIX_DU_DEFI)} demande à être payé à la livraison, ce jour-là. La trésorerie ${dE(k.entreprise)} est de ${eur(k.tresorerie)}. Que se passe-t-il si elle paie ?`;
      },
      options: (c) => {
        const k = optimiser(c);
        const x = couvrirLeManque(k, PRIX_DU_DEFI, "decouvert");
        return [
          {
            texte: "La banque passe à découvert jusqu'au 6 janvier",
            juste: true,
            retour: `Oui : il n'y a que ${eur(k.banque)} en banque ; le compte à terme est bloqué jusqu'au 6 janvier. La banque passe à ${eur(x.banqueApres)} pendant ${x.jours} jours, alors que la trésorerie reste positive. Être riche ne suffit pas : il faut que l'argent soit disponible le jour où l'on paie.`,
          },
          {
            texte: "Rien : la trésorerie reste positive, la banque paiera sans difficulté",
            juste: false,
            retour: `Non : la trésorerie reste positive, c'est vrai, mais ${eur(k.placement)} sont bloqués sur le compte à terme. Le jour du paiement, seuls les ${eur(k.banque)} de la banque sont disponibles.`,
          },
          {
            texte: "Le fonds de roulement devient négatif, et la trésorerie avec lui",
            juste: false,
            retour: "Non : un équipement payé comptant fait bien baisser le fonds de roulement, mais il en reste. Le problème est ailleurs : l'argent n'est pas disponible ce jour-là.",
          },
        ];
      },
    },
    {
      id: "payer-sans-decouvert",
      objectifs: [3],
      type: "curseur",
      titre: "Payer sans découvert",
      notions: ["net_treasury"],
      question: (c) => {
        const k = optimiser(c);
        return `Faites varier le prix de l'équipement payé le 31 décembre : une droite donne l'argent disponible en banque, ${eur(k.banque)}, l'autre le prix. Placez le curseur sur le prix le plus haut que ${k.entreprise} peut payer sans découvert, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix de l'équipement", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: prixSansDecouvert(optimiser(c)), min: PRIX_DU_CURSEUR.min, max: PRIX_DU_CURSEUR.max }),
      zones: ["La banque paie", "La banque passe à découvert"],
      rates: () => ({
        dessous: "À ce prix, il reste de l'argent en banque : l'équipement pourrait coûter plus.",
        dessus: "À ce prix, la banque passe à découvert : cherchez plus bas.",
      }),
      montrer: "Montrer le prix",
      lecture: (c, prix) => {
        const k = optimiser(c);
        const x = couvrirLeManque(k, prix, "decouvert");
        return [
          { libelle: "Argent en banque", montant: k.banque },
          { libelle: "Prix de l'équipement", montant: prix },
          { libelle: "Banque après le paiement", montant: x.banqueApres, fort: true },
          { libelle: "Trésorerie après le paiement", montant: auCentime(k.tresorerie - prix) },
        ];
      },
      droites: (c) => {
        const k = optimiser(c);
        return { produit: () => k.banque, cout: (prix) => prix, libelles: ["Argent en banque", "Prix de l'équipement"] };
      },
      explication: (c) => {
        const k = optimiser(c);
        return [
          `Jusqu'à ${eur(prixSansDecouvert(k))}, la banque paie seule. Au-delà, il manque de l'argent pendant ${k.joursDeBlocage} jours, jusqu'à ce que le compte à terme rende ${eur(k.placement)}.`,
          "Ce manque est passager : il faut le couvrir quelques jours, au moindre coût. L'étape suivante compare les solutions.",
        ];
      },
    },
    {
      id: "couvrir-le-manque",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûte chaque solution",
      notions: ["net_treasury", "receivables_financing"],
      question: (c) => {
        const k = optimiser(c);
        const x = couvrirLeManque(k, PRIX_DU_DEFI, "decouvert");
        return [
          `L'équipement coûte ${eur(PRIX_DU_DEFI)}. Calculez le manque en banque, puis ce que coûterait de le couvrir pendant les ${x.jours} jours où le compte à terme est bloqué : par un découvert à ${pct(TAUX_DU_DECOUVERT)} par an, par une avance des associés en compte courant à ${pct(TAUX_DU_COMPTE_COURANT)}.`,
          ...(x.manque > DECOUVERT_AUTORISE ? [auDelaDeLAutorisation] : []),
          "La banque compte une année de 360 jours : coût = montant × taux × jours ÷ 360.",
        ].join(" ");
      },
      champs: (c) => {
        const k = optimiser(c);
        const d = couvrirLeManque(k, PRIX_DU_DEFI, "decouvert");
        const cc = couvrirLeManque(k, PRIX_DU_DEFI, "compte-courant");
        return [
          { libelle: "Manque en banque", attendu: d.manque, calcul: `${eur(PRIX_DU_DEFI)} − ${eur(k.banque)} = ${eur(d.manque)}` },
          { libelle: "Agios du découvert", attendu: d.cout, calcul: `${eur(d.manque)} × ${pct(TAUX_DU_DECOUVERT)} × ${d.jours} ÷ 360 = ${eur(d.cout)}`, tolerance: 0.05 },
          { libelle: "Intérêts du compte courant", attendu: cc.cout, calcul: `${eur(cc.manque)} × ${pct(TAUX_DU_COMPTE_COURANT)} × ${cc.jours} ÷ 360 = ${eur(cc.cout)}`, tolerance: 0.05 },
        ];
      },
      explication: (c) => {
        const k = optimiser(c);
        const d = couvrirLeManque(k, PRIX_DU_DEFI, "decouvert");
        const e = couvrirLeManque(k, PRIX_DU_DEFI, "escompte");
        const cc = couvrirLeManque(k, PRIX_DU_DEFI, "compte-courant");
        const ca = couvrirLeManque(k, PRIX_DU_DEFI, "casser");
        return [
          `Pour ${d.jours} jours, le découvert coûte ${eur(d.cout)} et l'avance des associés ${eur(cc.cout)}, s'ils ont l'argent et l'acceptent. Casser le compte à terme coûterait bien plus : il ne rapporterait plus rien, ${eur(ca.interetsPerdus)} d'intérêts perdus.`,
          `L'escompte, lui, fait avancer par la banque la facture de décembre de CampusTech, ${eur(k.facture.ttc)}, contre des agios à ${pct(TAUX_DE_L_ESCOMPTE)} comptés jusqu'à son échéance, ${k.facture.jours} jours plus tard : ${eur(e.coutDeLEscompte)}, plus le découvert sur le reste. Son taux est plus bas, mais il se paie trop longtemps pour un manque de quelques jours.`,
        ];
      },
    },
    {
      id: "agir-sur-le-besoin",
      objectifs: [3],
      type: "choix",
      titre: "Quand le manque dure",
      notions: ["bfr", "net_treasury", "payment_terms"],
      question: (c) => {
        const k = optimiser(c);
        return `Imaginez maintenant une entreprise dont la banque est à découvert presque toute l'année, parce que ses clients paient tard. Chez ${k.entreprise}, une seule facture de CampusTech payée en retard immobilise ${eur(factureDeCampusTech(fondsDeRoulement(c)))}. Quelle est la meilleure réponse à un manque qui dure ?`;
      },
      options: () => [
        {
          texte: "Faire baisser le besoin en fonds de roulement",
          juste: true,
          retour:
            "Oui : un manque qui dure vient du cycle de tous les jours. Relancer les clients en retard, garder moins de stock, négocier un délai plus long avec les fournisseurs : le besoin baisse, et la trésorerie remonte sans rien coûter, comme le laboratoire des délais l'a montré. S'il manque encore, c'est le fonds de roulement qu'il faut renforcer : un apport, un emprunt.",
        },
        {
          texte: "Rester à découvert toute l'année : c'est le plus simple à obtenir",
          juste: false,
          retour: `Non : à ${pct(TAUX_DU_DECOUVERT)} par an, un découvert permanent coûte cher, et la banque peut le réduire ou le refuser du jour au lendemain. Il est fait pour des manques de quelques jours.`,
        },
        {
          texte: "Escompter chaque facture de CampusTech, tous les mois, sans exception",
          juste: false,
          retour: "Non : l'escompte avance l'argent d'une facture, mais il coûte des agios sur chacune et ne règle pas la cause : des clients qui paient tard. Il dépanne ; il ne remplace pas une relance.",
        },
      ],
    },
    {
      id: "le-laboratoire-de-la-tresorerie",
      objectifs: [2, 3],
      type: "simulation",
      titre: "Le laboratoire de la trésorerie",
      notions: ["net_treasury", "receivables_financing"],
      question: (c) => {
        const k = optimiser(c);
        return `Faites varier le prix de l'équipement payé le 31 décembre et choisissez la solution qui couvre le manque jusqu'au 6 janvier. Le tableau donne le manque, ce que chaque source couvre et ce que tout cela coûte. Les associés peuvent avancer tout le manque ; casser le compte à terme rend ses ${eur(k.capitalPlace)}, sans intérêts. Relevez le défi.`;
      },
      leviers: (c) => {
        const f = optimiser(c).f;
        return [
          { code: "prix", libelle: "Prix de l'équipement payé le 31 décembre", unite: "€", ...LEVIERS_DU_MANQUE.prix, depart: f.equipement.ht },
          {
            code: "solution",
            libelle: "Solution pour couvrir le manque",
            unite: "",
            min: 0,
            max: SOLUTIONS_DU_MANQUE.length - 1,
            pas: 1,
            depart: SOLUTIONS_DU_MANQUE.indexOf("casser"),
            choix: SOLUTIONS_DU_MANQUE.map((s, i) => ({ valeur: i, libelle: LIBELLES[s] })),
          },
        ];
      },
      lecture: (c, p) => {
        const x = manqueDuLaboratoire(c, p);
        return [
          { libelle: "Banque après le paiement", montant: x.banqueApres },
          { libelle: "Manque à couvrir", montant: x.manque },
          { libelle: "Avancé par l'escompte", montant: x.escompte },
          { libelle: "Avancé par les associés", montant: x.compteCourant },
          { libelle: "Rendu par le compte à terme cassé", montant: x.casse },
          { libelle: "Reste en découvert", montant: x.decouvert },
          { libelle: "Coût de la solution", montant: x.cout, fort: true },
        ];
      },
      defi: (c) => {
        const reussi = (p: Readonly<Record<string, number>>) => {
          const x = manqueDuLaboratoire(c, p);
          return x.prix >= PRIX_DU_DEFI && x.cout <= COUT_MAXIMAL_DU_DEFI;
        };
        return {
          consigne: `Payez un équipement d'au moins ${eur(PRIX_DU_DEFI)} le 31 décembre, pour moins de ${eur(COUT_MAXIMAL_DU_DEFI)} de frais.`,
          atteint: reussi,
          indice: (p) => {
            const x = manqueDuLaboratoire(c, p);
            if (x.prix < PRIX_DU_DEFI) return `L'équipement coûte ${eur(x.prix)} : le défi en demande au moins ${eur(PRIX_DU_DEFI)}.`;
            if (x.solution === "casser") return `Casser le compte à terme fait perdre ses ${eur(x.interetsPerdus)} d'intérêts pour un manque de ${x.jours} jours : cherchez moins cher.`;
            if (x.solution === "escompte") return `L'escompte coûte ${eur(x.coutDeLEscompte)} : ses agios courent jusqu'à l'échéance de la facture, bien après le 6 janvier.`;
            return `La solution coûte ${eur(x.cout)} : le manque est trop gros pour cette solution, ou il en existe une moins chère.`;
          },
          solution: SOLUTION_DU_MANQUE,
        };
      },
      explication: (c, p) => {
        const x = manqueDuLaboratoire(c, p);
        const k = optimiser(c);
        const autres = SOLUTIONS_DU_MANQUE.map((s) => `${LIBELLES[s]} : ${eur(couvrirLeManque(k, x.prix, s).cout)}`).join(" ; ");
        return [
          `Défi relevé : ${eur(x.prix)} payés, ${eur(x.manque)} de manque couverts pendant ${x.jours} jours par ${LIBELLES[x.solution]}, pour ${eur(x.cout)}.`,
          `À ce prix, les quatre solutions coûtent : ${autres}. Pour quelques jours, le découvert ou l'avance des associés suffisent ; l'escompte convient à un manque qui dure jusqu'à l'échéance de la facture ; casser un placement est presque toujours la plus chère.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["net_treasury", "bfr"],
      texte: (c) => {
        const k = optimiser(c);
        return [
          `${k.entreprise} a ${eur(k.excedent)} d'excédent une fois ses dettes du moment mises de côté : placés, ils rapportent ; mais l'argent qui servira dans l'année doit rester disponible. Le 31 décembre, elle peut payer ${eur(prixSansDecouvert(k))} comptant sans découvert, pas davantage, tant que le compte à terme est bloqué.`,
          "Pour un manque passager, une entreprise compare les concours bancaires (le découvert, l'escompte d'une créance) et l'avance de ses associés en compte courant, au coût et à la durée. Pour un manque qui dure, elle agit sur le besoin en fonds de roulement, ou renforce son fonds de roulement. Dans l'arène, les chiffres de votre entreprise seront différents : la méthode sera la même.",
        ];
      },
      repere: () => "Coût d'un concours = montant × taux × jours ÷ 360. Un placement se choisit selon son rendement, son risque et sa disponibilité.",
    },
  ],
};
