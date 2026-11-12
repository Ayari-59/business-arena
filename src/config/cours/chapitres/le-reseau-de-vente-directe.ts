import { arrondi2 as auCentime, deuxChemins, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  ATTRITION_MENSUELLE,
  COMMISSION_DE_LA_CONSEILLERE,
  COMMISSION_DU_LABORATOIRE,
  DELAI_DE_RETRACTATION,
  FORMATION,
  HEURES_DU_MOIS_A_TEMPS_PLEIN,
  OFFRES_DE_PARRAINAGE,
  PART_DU_PLAFOND_POUR_L_IMMATRICULATION,
  PLAFOND_ANNUEL_DE_LA_SECURITE_SOCIALE,
  REUNIONS_PAR_MOIS,
  TAUX_DE_RETRACTATION,
  ficheDuReseau,
  laboratoireDuReseau,
  reseauDeVenteDirecte,
} from "../monde/reseau-de-vente-directe";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE RÉSEAU DE VENTE DIRECTE : RECRUTER, ANIMER, RÉMUNÉRER (BTS NDRC, bloc 3, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez MAILLE & CO (décision du propriétaire, novembre 2026) :
 * la boutique lance un réseau de conseillères, vendeuses à domicile indépendantes, qui vendent ses
 * pulls en réunion (monde/reseau-de-vente-directe.ts, sur les références, les étiquettes et l'équipe de
 * maille-et-co.ts).
 *
 * L'objet : ce que rapporte une réunion, ce que gagne une conseillère et son statut, ce que vaut une
 * conseillère sur sa vie dans le réseau, puis la décision : la prime de parrainage. Le piège central :
 * la prime se verse sur toutes les filleules, pas sur les seules recrues qu'elle amène en plus ; comptée
 * sur celles-là, elle paraît rentable plus haut qu'elle ne l'est. Puis la rétractation de 14 jours et
 * le code éthique de la vente directe, qui bornent le recrutement.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, le-ca-de-la-reunion, la-marge-de-la-reunion, le-statut ;
 *   · l'expérience avant la formule : predire-le-seuil puis le-seuil-au-curseur, avant
 *     le-seuil-d-activite ; predire-la-prime puis le-laboratoire-du-reseau, avant la-prime-de-parrainage ;
 *   · autonome et expert : former-une-recrue, la-valeur-d-une-conseillere, la-prime-de-parrainage,
 *     les-retractations (une variante chiffrée), le-code-ethique, animer-le-reseau ; puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la part du seuil se donne à deux décimales, à un centième près
 * (au dixième, avant) ; les réunions par mois au seuil et la durée moyenne dans le réseau sont des
 * grandeurs, au centième ; les réunions et les recrues sont des quantités, entières, déclarées comme
 * telles.
 */

export const ENTREPRISES_DU_RESEAU: readonly string[] = ["boutique"];

export const CODE_DU_RESEAU = "le-reseau-de-vente-directe";
export const TITRE_DU_RESEAU = "Le réseau de vente directe : recruter, animer, rémunérer";

/** Le pas du levier de la prime au laboratoire : celui des offres de parrainage. */
const PAS_DE_LA_PRIME = OFFRES_DE_PARRAINAGE[1]!.prime - OFFRES_DE_PARRAINAGE[0]!.prime;

const qte = nombreAuCentieme;

/** Tout ce que le chapitre et son cas lisent. */
export function reseauDeLaBoutique(c: Pick<Cas, "code">) {
  const f = ficheDuReseau(c);
  return { f, ...reseauDeVenteDirecte(f) };
}

export type ReseauDeLaBoutique = ReturnType<typeof reseauDeLaBoutique>;

/** La réunion type : le document de départ. */
export function tableauDeLaReunion(x: ReseauDeLaBoutique): TableauDeDonnees {
  return {
    titre: `Une réunion type chez une hôtesse, ${qte(x.reunion.participantes)} participantes`,
    colonnes: ["Articles", "Étiquette", "Coût d'achat"],
    lignes: x.reunion.lignes.map((l) => ({ libelle: l.nom, valeurs: [qte(l.quantite), eur(l.prixTtc), eur(l.coutDAchat)] })),
  };
}

/** Les offres de parrainage : le document de la décision. */
function tableauDuParrainage(): TableauDeDonnees {
  return {
    titre: "Les recrues de l'année selon la prime de parrainage",
    colonnes: ["Recrues par an"],
    lignes: OFFRES_DE_PARRAINAGE.map((o) => ({ libelle: o.prime === 0 ? "Sans prime" : `Prime de ${eur(o.prime)}`, valeurs: [qte(o.recrues)] })),
  };
}

export const LE_RESEAU_DE_VENTE_DIRECTE: Chapitre = {
  code: "le-reseau-de-vente-directe",
  parcours: "ndrc",
  palier: 4,
  blocs: ["BTS NDRC Bloc 3 · Relation client et animation de réseaux"],
  titre: TITRE_DU_RESEAU,
  accroche:
    "Des conseillères indépendantes vendent les pulls de la boutique en réunion, chez une hôtesse. Ce que rapporte une réunion, ce que vaut une conseillère sur sa vie dans le réseau, et la prime de parrainage qui le fait grandir sans le ruiner.",
  objectifs: [
    "Calculer le chiffre d'affaires, le panier et la marge d'une réunion à domicile",
    "Choisir le statut d'une vendeuse à domicile et situer son seuil d'activité",
    "Chiffrer le coût de formation et la valeur d'une conseillère sur sa vie",
    "Décider d'une prime de parrainage sur ce qu'elle rapporte, pas sur les seules recrues en plus",
    "Appliquer la rétractation et le code éthique de la vente directe",
  ],
  libre: false,
  prerequis: ["valeur-d-un-client", "remunerer-et-stimuler-les-vendeurs"],
  ensuite: ["tableau-de-bord-commercial"],
  entreprises: {
    codes: ENTREPRISES_DU_RESEAU,
    pourquoi:
      "ce chapitre se joue à la boutique MAILLE & CO, qui lance un réseau de vendeuses à domicile pour ses pulls : c'est là qu'une réunion, une conseillère et une prime de parrainage se chiffrent.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La boutique sort de ses murs",
      notions: ["average_basket", "distribution_commission"],
      tableau: (c) => tableauDeLaReunion(reseauDeLaBoutique(c)),
      texte: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. Elle lance un réseau de vente directe : des conseillères indépendantes présentent ses pulls et ses accessoires en réunion, chez une hôtesse qui invite ses amies.`,
          `Elles vendent les mêmes références, aux mêmes étiquettes. La conseillère prend les commandes ; la boutique facture, livre et lui verse ${pct(COMMISSION_DE_LA_CONSEILLERE * 100)} du chiffre d'affaires hors taxes. L'hôtesse reçoit une écharpe en cadeau.`,
          `La simulation suppose qu'une conseillère tient ${qte(REUNIONS_PAR_MOIS)} réunions par mois, et qu'une sur ${qte(1 / ATTRITION_MENSUELLE)} quitte le réseau chaque mois. Les nouvelles viennent des réunions : des invitées qui veulent vendre à leur tour.`,
          "Animer un tel réseau, c'est recruter, former, rémunérer, et garder les conseillères. Tout se chiffre à partir d'une réunion.",
        ];
      },
      repere: () =>
        "Chiffre d'affaires d'une réunion = participantes × taux d'achat × panier moyen. Marge d'une réunion = chiffre d'affaires hors taxes − achats − autres coûts variables − commission − cadeau de l'hôtesse.",
    },
    {
      id: "le-ca-de-la-reunion",
      objectifs: [0],
      type: "montants",
      titre: "Ce que vend une réunion",
      notions: ["average_basket", "conversion_rate"],
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        return `Sur ${qte(x.reunion.participantes)} participantes, ${qte(x.reunion.acheteuses)} achètent les articles du tableau, aux étiquettes de la boutique (TVA ${pct(x.f.gamme[0]!.tauxTva * 100)}). Calculez le chiffre d'affaires TTC de la réunion, son chiffre d'affaires hors taxes, le taux d'achat (%), puis le panier moyen TTC d'une acheteuse.`;
      },
      champs: (c) => {
        const x = reseauDeLaBoutique(c);
        const r = x.reunion;
        return [
          { libelle: "Chiffre d'affaires TTC", attendu: r.chiffreTtc, calcul: r.lignes.map((l) => `${qte(l.quantite)} × ${eur(l.prixTtc)}`).join(" + ") + ` = ${eur(r.chiffreTtc)}` },
          { libelle: "Chiffre d'affaires hors taxes", attendu: r.chiffreHt, calcul: `${eur(r.chiffreTtc)} ÷ ${qte(1 + x.f.gamme[0]!.tauxTva)} = ${eur(r.chiffreHt)}` },
          { libelle: "Taux d'achat (%)", attendu: r.tauxDAchat * 100, calcul: `${qte(r.acheteuses)} ÷ ${qte(r.participantes)} × 100 = ${pct(r.tauxDAchat * 100)}` },
          { libelle: "Panier moyen TTC", attendu: r.panierTtc, calcul: `${eur(r.chiffreTtc)} ÷ ${qte(r.acheteuses)} = ${eur(r.panierTtc)}` },
        ];
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        const r = x.reunion;
        return [
          `Une réunion vend ${eur(r.chiffreTtc)} : ${qte(r.participantes)} participantes × ${pct(r.tauxDAchat * 100)} × ${eur(r.panierTtc)}. Les trois leviers de la conseillère se lisent dans ce produit : inviter plus, convaincre plus, vendre un panier plus garni.`,
          "Le panier d'une réunion est plus garni qu'un passage en caisse : on y essaie, on y conseille longtemps, entre amies. C'est la force de la vente directe.",
        ];
      },
    },
    {
      id: "la-marge-de-la-reunion",
      objectifs: [0],
      type: "montants",
      titre: "Ce que laisse une réunion",
      notions: ["contribution_margin", "distribution_commission"],
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        return `Calculez, pour la réunion type, les achats au façonnier, les autres coûts variables (emballages, étiquettes, frais de carte), la commission de la conseillère (${pct(COMMISSION_DE_LA_CONSEILLERE * 100)} du chiffre d'affaires hors taxes), puis la marge de la boutique, cadeau de l'hôtesse déduit (${eur(x.reunion.cadeau)}).`;
      },
      champs: (c) => {
        const x = reseauDeLaBoutique(c);
        const r = x.reunion;
        return [
          { libelle: "Achats au façonnier", attendu: r.achats, calcul: r.lignes.map((l) => `${qte(l.quantite)} × ${eur(l.coutDAchat)}`).join(" + ") + ` = ${eur(r.achats)}` },
          { libelle: "Autres coûts variables", attendu: r.autres, calcul: r.lignes.map((l) => `${qte(l.quantite)} × ${eur(l.autres)}`).join(" + ") + ` = ${eur(r.autres)}` },
          { libelle: "Commission de la conseillère", attendu: r.commissionDeLaReunion, calcul: `${eur(r.chiffreHt)} × ${pct(COMMISSION_DE_LA_CONSEILLERE * 100)} = ${eur(r.commissionDeLaReunion)}` },
          { libelle: "Marge de la réunion", attendu: r.marge, calcul: `${eur(r.chiffreHt)} − ${eur(r.achats)} − ${eur(r.autres)} − ${eur(r.commissionDeLaReunion)} − ${eur(r.cadeau)} = ${eur(r.marge)}` },
        ];
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        const r = x.reunion;
        return [
          `Sur ${eur(r.chiffreHt)} de ventes, la boutique garde ${eur(r.marge)}. La commission, ${eur(r.commissionDeLaReunion)}, est le premier coût du réseau, après les articles eux-mêmes.`,
          "Le réseau ne paie ni loyer ni vendeuse à l'heure : la conseillère n'est payée que si elle vend. C'est une charge variable, qui ne pèse pas sur une réunion vide.",
        ];
      },
    },
    {
      id: "le-statut",
      objectifs: [1],
      type: "choix",
      titre: "Quel statut pour la conseillère",
      notions: ["pay_and_motivation"],
      question: () =>
        "La conseillère organise ses réunions quand elle veut, chez des hôtesses qu'elle trouve, vend au nom de la boutique et n'est payée qu'à la commission. Quel statut lui convient ?",
      options: () => [
        { texte: "Vendeuse à domicile indépendante, mandataire", juste: true, retour: "Oui. La VDI mandataire vend au nom de l'entreprise, sans lien de subordination ni horaires, et touche une commission. L'acheteuse-revendeuse, elle, achèterait les articles pour les revendre, à ses risques." },
        { texte: "Vendeuse salariée de la boutique, à temps partiel", juste: false, retour: "Non. Une salariée a des horaires, un salaire au moins égal au minimum et un lien de subordination. Rien de cela ici : elle organise son activité seule." },
        { texte: "VRP, représentante salariée qui démarche des professionnels", juste: false, retour: "Non. Le VRP est un salarié qui prospecte une clientèle, souvent professionnelle, pour un ou plusieurs employeurs. La conseillère vend à des particuliers, en réunion." },
        { texte: "Agente commerciale inscrite, payée par un contrat de mandat", juste: false, retour: "Non. L'agent commercial est un professionnel immatriculé, qui négocie des contrats en continu. La VDI en est dispensée tant que son activité reste sous un seuil : c'est l'étape suivante." },
      ],
    },
    {
      id: "predire-le-seuil",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le seuil d'activité",
      notions: ["breakeven"],
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        return `Une VDI reste dispensée d'immatriculation tant que sa rémunération de l'année ne dépasse pas la moitié du plafond de la sécurité sociale, ${eur(x.seuilDImmatriculation)}. À ${eur(x.reunion.commissionDeLaReunion)} par réunion, combien de réunions par an faut-il pour l'atteindre ?`;
      },
      options: (c) => {
        const x = reseauDeLaBoutique(c);
        const voir = "Faites varier les réunions à l'étape suivante : le curseur compare la commission de l'année au seuil.";
        const pari = (juste: boolean) => (juste ? `Bon pari. ${voir}` : `Pari à vérifier. ${voir}`);
        const n = x.reunionsAuSeuil;
        return [
          { texte: "Moins de 50 : une réunion rapporte bien", juste: n < 50, retour: pari(n < 50) },
          { texte: "Entre 50 et 100", juste: n >= 50 && n <= 100, retour: pari(n >= 50 && n <= 100) },
          { texte: "Plus de 100 : bien plus que 2 par mois", juste: n > 100, retour: pari(n > 100) },
        ];
      },
    },
    {
      id: "le-seuil-au-curseur",
      objectifs: [1],
      type: "curseur",
      titre: "Le seuil d'activité au curseur",
      notions: ["breakeven", "distribution_commission"],
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        return `Faites varier les réunions d'une conseillère sur l'année. Une droite donne sa commission de l'année (${eur(x.reunion.commissionDeLaReunion)} par réunion), l'autre le seuil de dispense, ${eur(x.seuilDImmatriculation)}. Placez le curseur sur le plus petit nombre de réunions qui atteint le seuil, puis validez.`;
      },
      grandeur: () => ({ libelle: "Réunions dans l'année", unite: "réunions" }),
      cible: (c) => ({ attendu: reseauDeLaBoutique(c).reunionsAuSeuil, min: 0, max: 240 }),
      zones: ["Le seuil est atteint", "La conseillère reste sous le seuil"],
      rates: () => ({
        dessous: "À ce nombre de réunions, la commission de l'année reste sous le seuil.",
        dessus: "Moins de réunions suffisent : cherchez le plus petit nombre qui l'atteint.",
      }),
      montrer: "Montrer le seuil",
      lecture: (c, n) => {
        const x = reseauDeLaBoutique(c);
        return [
          { libelle: "Commission de l'année", montant: Math.round(n * x.reunion.commissionDeLaReunion * 100) / 100 },
          { libelle: "Seuil de dispense d'immatriculation", montant: x.seuilDImmatriculation, fort: true },
        ];
      },
      droites: (c) => {
        const x = reseauDeLaBoutique(c);
        return {
          produit: (n) => n * x.reunion.commissionDeLaReunion,
          cout: () => x.seuilDImmatriculation,
          libelles: ["Commission de l'année", "Seuil de dispense d'immatriculation"],
        };
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Il faudrait ${qte(x.reunionsAuSeuil)} réunions dans l'année, ${qte(x.reunionsAuSeuilParMois)} par mois, pour atteindre ${eur(x.seuilDImmatriculation)}. À ${qte(REUNIONS_PAR_MOIS)} réunions par mois, la conseillère du cours en est loin.`,
          "Le statut de VDI convient à une activité d'appoint. Une conseillère qui en fait un métier, au-dessus du seuil trois ans de suite, doit s'immatriculer.",
        ];
      },
    },
    {
      id: "le-seuil-d-activite",
      objectifs: [1],
      type: "montants",
      titre: "Ce que gagne une conseillère",
      notions: ["distribution_commission", "pay_and_motivation"],
      question: () => {
        return `Sans formule. Le plafond de la sécurité sociale est de ${eur(PLAFOND_ANNUEL_DE_LA_SECURITE_SOCIALE)}. Calculez le seuil de dispense d'immatriculation, la commission de l'année d'une conseillère à ${qte(REUNIONS_PAR_MOIS)} réunions par mois, sa part du seuil (%, à deux décimales), puis les réunions par mois qui l'atteindraient.`;
      },
      champs: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          { libelle: "Seuil de dispense", attendu: x.seuilDImmatriculation, calcul: `${eur(PLAFOND_ANNUEL_DE_LA_SECURITE_SOCIALE)} × ${pct(PART_DU_PLAFOND_POUR_L_IMMATRICULATION * 100)} = ${eur(x.seuilDImmatriculation)}` },
          { libelle: "Commission de l'année", attendu: x.commissionDeLAnnee, calcul: `${eur(x.reunion.commissionDeLaReunion)} × ${qte(REUNIONS_PAR_MOIS)} × 12 mois = ${eur(x.commissionDeLAnnee)}` },
          { libelle: "Part du seuil (%)", attendu: auCentime(x.partDuSeuil * 100), calcul: `${eur(x.commissionDeLAnnee)} ÷ ${eur(x.seuilDImmatriculation)} × 100 = ${pct(auCentime(x.partDuSeuil * 100))}` },
          { libelle: "Réunions par mois au seuil", nature: "grandeur", attendu: x.reunionsAuSeuilParMois, calcul: `${qte(x.reunionsAuSeuil)} réunions ÷ 12 mois = ${qte(x.reunionsAuSeuilParMois)}` },
        ];
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Une conseillère gagne ${eur(x.commissionDeLAnnee)} dans l'année, ${pct(auCentime(x.partDuSeuil * 100))} du seuil. C'est un complément de revenu : il faut le dire au recrutement, sans promettre un salaire.`,
          "Le seuil d'activité borne le statut, pas l'effort : une conseillère motivée peut tenir plus de réunions, et la boutique doit alors vérifier sa situation.",
        ];
      },
    },
    {
      id: "former-une-recrue",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûte une recrue",
      notions: ["training", "payroll"],
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        const fo = x.formation;
        return `Une recrue reçoit un kit de démarrage : un article de chaque référence, au coût d'achat. Elle suit ${qte(FORMATION.heures)} heures de formation avec l'adjointe (${eur(fo.formatrice.brutMensuel)} bruts pour ${qte(HEURES_DU_MOIS_A_TEMPS_PLEIN)} heures). Ce sont des heures supplémentaires, majorées de ${pct(FORMATION.majoration * 100)}, cotisations patronales de ${pct(x.f.tauxPatronal * 100)}. Calculez le kit, le coût d'une heure de formation, les heures, puis le coût d'une recrue.`;
      },
      champs: (c) => {
        const x = reseauDeLaBoutique(c);
        const fo = x.formation;
        return [
          { libelle: "Kit de démarrage", attendu: fo.kit, calcul: x.f.gamme.map((r) => eur(r.coutDAchat)).join(" + ") + ` = ${eur(fo.kit)}` },
          { libelle: "Coût d'une heure de formation", attendu: fo.coutHoraire, calcul: `${eur(fo.formatrice.brutMensuel)} ÷ ${qte(HEURES_DU_MOIS_A_TEMPS_PLEIN)} × ${qte(1 + FORMATION.majoration)} × ${qte(1 + x.f.tauxPatronal)} = ${eur(fo.coutHoraire)}` },
          { libelle: "Heures de formation", attendu: fo.heures, calcul: `${eur(fo.coutHoraire)} × ${qte(FORMATION.heures)} = ${eur(fo.heures)}` },
          { libelle: "Coût d'une recrue", attendu: fo.cout, calcul: `${eur(fo.kit)} + ${eur(fo.heures)} = ${eur(fo.cout)}` },
        ];
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Chaque recrue coûte ${eur(x.formation.cout)} avant sa première réunion. Une conseillère qui part au bout d'un mois a coûté sa formation pour ${qte(REUNIONS_PAR_MOIS)} réunions seulement.`,
          "La formation porte sur les produits (les mailles, les tailles, l'entretien), la tenue d'une réunion, la prise de commande et les règles de la vente à domicile. Elle se fait aux heures de la recrue, pas à celles de la boutique.",
        ];
      },
    },
    {
      id: "la-valeur-d-une-conseillere",
      objectifs: [2],
      type: "montants",
      titre: "Ce que vaut une conseillère",
      notions: ["churn_rate", "customer_lifetime_value"],
      question: () => {
        return `Une conseillère sur ${qte(1 / ATTRITION_MENSUELLE)} quitte le réseau chaque mois. Comme pour un client, sa durée moyenne dans le réseau vaut 1 ÷ attrition. Calculez cette durée en mois, ses réunions sur cette durée, la marge qu'elles laissent, puis la valeur d'une conseillère, sa formation déduite.`;
      },
      champs: (c) => {
        const x = reseauDeLaBoutique(c);
        const v = x.conseillere;
        return [
          { libelle: "Durée moyenne dans le réseau (mois)", nature: "grandeur", attendu: v.dureeDeVie, calcul: `1 ÷ ${pct(ATTRITION_MENSUELLE * 100)} = ${qte(v.dureeDeVie)} mois` },
          { libelle: "Réunions sur sa durée", nature: "quantite", attendu: v.reunions, calcul: `${qte(v.dureeDeVie)} × ${qte(REUNIONS_PAR_MOIS)} = ${qte(v.reunions)}` },
          { libelle: "Marge de ses réunions", attendu: v.marge, calcul: `${qte(v.reunions)} × ${eur(x.reunion.marge)} = ${eur(v.marge)}` },
          { libelle: "Valeur d'une conseillère", attendu: v.valeur, calcul: `${eur(v.marge)} − ${eur(v.formation)} = ${eur(v.valeur)}` },
        ];
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Une conseillère vaut ${eur(x.conseillere.valeur)} à la boutique sur sa vie dans le réseau. C'est ce qu'on peut dépenser, au plus, pour en recruter une de plus.`,
          "La valeur d'une conseillère se lit comme la valeur vie d'un client : une marge par période, une durée qui dépend de l'attrition. Garder une conseillère un mois de plus vaut autant qu'en recruter une partie d'une nouvelle.",
        ];
      },
    },
    {
      id: "predire-la-prime",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur la prime de parrainage",
      notions: ["customer_acquisition_cost", "pay_and_motivation"],
      tableau: () => tableauDuParrainage(),
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        return `Pour grandir, la boutique veut payer chaque marraine pour chaque filleule, une fois sa première réunion tenue. Une conseillère vaut ${eur(x.conseillere.valeur)}. Quelle prime laisse le plus à la boutique ?`;
      },
      options: (c) => {
        const x = reseauDeLaBoutique(c);
        const voir = "Le laboratoire de l'étape suivante compare les primes.";
        const pari = (juste: boolean) => (juste ? `Bon pari. ${voir}` : `Pari à vérifier. ${voir}`);
        const [, a, b, d] = OFFRES_DE_PARRAINAGE;
        return [a!, b!, d!].map((o) => ({ texte: `${eur(o.prime)} par filleule`, juste: x.prime === o.prime, retour: pari(x.prime === o.prime) }));
      },
    },
    {
      id: "le-laboratoire-du-reseau",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du réseau",
      notions: ["distribution_commission", "customer_lifetime_value", "pay_and_motivation"],
      question: () =>
        "Faites vivre le réseau. Changez la commission des conseillères et la prime de parrainage. Le tableau donne la marge d'une réunion, la valeur d'une conseillère, les recrues de l'année, les primes versées et le gain du parrainage ; le graphique trace ce gain selon la prime. Relevez le défi.",
      leviers: () => {
        const premiere = OFFRES_DE_PARRAINAGE[0]!.prime;
        const derniere = OFFRES_DE_PARRAINAGE.at(-1)!.prime;
        return [
          { code: "commission", libelle: "Commission des conseillères", unite: "%", ...COMMISSION_DU_LABORATOIRE, depart: Math.round(COMMISSION_DE_LA_CONSEILLERE * 100) },
          { code: "prime", libelle: "Prime de parrainage par filleule", unite: "€", min: premiere, max: derniere, pas: PAS_DE_LA_PRIME, depart: premiere },
        ];
      },
      lecture: (c, p) => {
        const x = reseauDeLaBoutique(c);
        const l = laboratoireDuReseau(x.f, p.commission!, p.prime!);
        const d = laboratoireDuReseau(x.f, Math.round(COMMISSION_DE_LA_CONSEILLERE * 100), OFFRES_DE_PARRAINAGE[0]!.prime);
        return [
          { libelle: "Marge d'une réunion", montant: l.margeDUneReunion, reference: d.margeDUneReunion },
          { libelle: "Valeur d'une conseillère", montant: l.valeur, reference: d.valeur },
          { libelle: "Commission de l'année d'une conseillère", montant: l.commissionDeLAnnee, reference: d.commissionDeLAnnee },
          { libelle: "Recrues de l'année", montant: l.recrues, unite: "recrues", reference: d.recrues },
          { libelle: "Primes versées dans l'année", montant: l.primes, reference: d.primes },
          { libelle: "Gain du parrainage sur l'année", montant: l.gain, reference: d.gain, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = reseauDeLaBoutique(c);
        return {
          levier: "prime",
          courbes: [{ libelle: "Gain du parrainage", valeur: (p) => laboratoireDuReseau(x.f, p.commission!, p.prime!).gain }],
        };
      },
      defi: (c) => {
        const x = reseauDeLaBoutique(c);
        const commission = Math.round(COMMISSION_DE_LA_CONSEILLERE * 100);
        return {
          consigne: `À la commission de ${pct(commission)}, trouvez la prime de parrainage qui laisse le plus grand gain à la boutique.`,
          atteint: (p) => p.commission === commission && p.prime === x.prime,
          indice: (p) => {
            if (p.commission !== commission) return `Le défi se joue à ${pct(commission)} de commission : remettez-la, seule la prime doit changer.`;
            const l = laboratoireDuReseau(x.f, p.commission, p.prime!);
            return `À ${eur(p.prime!)}, le parrainage laisse ${eur(l.gain)}. Essayez les autres primes : laquelle laisse le plus ?`;
          },
          solution: { commission, prime: x.prime },
        };
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        const a20 = laboratoireDuReseau(x.f, COMMISSION_DU_LABORATOIRE.min, 0).meilleurePrime;
        return [
          `À ${pct(COMMISSION_DE_LA_CONSEILLERE * 100)}, la prime de ${eur(x.prime)} laisse ${eur(x.parrainageRetenu.gain)} : au-delà, les recrues en plus deviennent rares, et la prime se paie sur toutes. Le gain monte, puis redescend.`,
          `Baissez la commission à ${pct(COMMISSION_DU_LABORATOIRE.min)} : chaque conseillère vaut plus, et la meilleure prime passe à ${eur(a20)}. La prime de parrainage dépend de ce que vaut une recrue, donc de la commission.`,
        ];
      },
    },
    {
      id: "la-prime-de-parrainage",
      objectifs: [3],
      type: "montants",
      titre: "La prime de parrainage, et son piège",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      tableau: () => tableauDuParrainage(),
      question: (c) => {
        const x = reseauDeLaBoutique(c);
        return `Sans formule. À la prime de ${eur(x.prime)}, calculez les recrues en plus de l'année, la valeur qu'elles apportent, les primes versées, puis le gain du parrainage. Calculez enfin le gain qu'on croirait obtenir en ne payant la prime que sur les recrues en plus.`;
      },
      champs: (c) => {
        const x = reseauDeLaBoutique(c);
        const p = x.parrainageRetenu;
        const sans = OFFRES_DE_PARRAINAGE[0]!.recrues;
        return [
          { libelle: "Recrues en plus", nature: "quantite", attendu: p.enPlus, calcul: `${qte(p.recrues)} − ${qte(sans)} = ${qte(p.enPlus)}` },
          { libelle: "Valeur des recrues en plus", attendu: p.valeurDesRecruesEnPlus, calcul: `${qte(p.enPlus)} × ${eur(x.conseillere.valeur)} = ${eur(p.valeurDesRecruesEnPlus)}` },
          { libelle: "Primes versées", attendu: p.primes, calcul: `${qte(p.recrues)} filleules × ${eur(p.prime)} = ${eur(p.primes)}` },
          { libelle: "Gain du parrainage", attendu: p.gain, calcul: `${eur(p.valeurDesRecruesEnPlus)} − ${eur(p.primes)} = ${eur(p.gain)}` },
          { libelle: "Gain sur les seules recrues en plus", attendu: p.gainSurLesSeulesRecruesEnPlus, calcul: `${eur(p.valeurDesRecruesEnPlus)} − ${qte(p.enPlus)} × ${eur(p.prime)} = ${eur(p.gainSurLesSeulesRecruesEnPlus)}` },
        ];
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `La prime se paie sur les ${qte(x.parrainageRetenu.recrues)} filleules, dont ${qte(OFFRES_DE_PARRAINAGE[0]!.recrues)} seraient venues sans elle : c'est un effet d'aubaine. Compté sur les seules recrues en plus, le gain serait de ${eur(x.parrainageRetenu.gainSurLesSeulesRecruesEnPlus)}, et l'on choisirait ${eur(x.piege)}.`,
          "Une prime se juge comme une remise : sur tout ce qu'elle touche, pas sur ce qu'elle ajoute.",
        ];
      },
    },
    {
      id: "les-retractations",
      objectifs: [4],
      type: "montants",
      titre: "Variante : les rétractations",
      notions: ["contribution_margin", "churn_rate"],
      question: () => {
        return `Une vente chez l'hôtesse laisse ${qte(DELAI_DE_RETRACTATION)} jours à l'acheteuse pour se rétracter. Supposez que ${pct(TAUX_DE_RETRACTATION * 100)} du chiffre d'affaires d'une réunion revienne : les articles rentrent en stock, la commission n'est pas due. Calculez le chiffre d'affaires rétracté, les coûts évités, la commission non due, la marge perdue, puis la valeur d'une conseillère nette des rétractations.`;
      },
      champs: (c) => {
        const x = reseauDeLaBoutique(c);
        const r = x.retractation;
        const v = x.reunion;
        return [
          { libelle: "Chiffre d'affaires rétracté", attendu: r.retracte, calcul: `${eur(v.chiffreHt)} × ${pct(TAUX_DE_RETRACTATION * 100)} = ${eur(r.retracte)}` },
          { libelle: "Coûts évités", attendu: r.coutsEvites, calcul: `(${eur(v.achats)} + ${eur(v.autres)}) × ${pct(TAUX_DE_RETRACTATION * 100)} = ${eur(r.coutsEvites)}` },
          { libelle: "Commission non due", attendu: r.commissionNonDue, calcul: `${eur(v.commissionDeLaReunion)} × ${pct(TAUX_DE_RETRACTATION * 100)} = ${eur(r.commissionNonDue)}` },
          { libelle: "Marge perdue par réunion", attendu: r.margePerdue, calcul: `${eur(r.retracte)} − ${eur(r.coutsEvites)} − ${eur(r.commissionNonDue)} = ${eur(r.margePerdue)}` },
          // L'autre chemin : la marge perdue gardée avec tous ses chiffres, l'arrondi à la fin.
          {
            libelle: "Valeur nette d'une conseillère",
            ...deuxChemins(r.conseillere.valeur, r.conseillere.reunions * (v.marge - (v.chiffreHt - v.achats - v.autres - v.commissionDeLaReunion) * TAUX_DE_RETRACTATION) - r.conseillere.formation),
            calcul: `${qte(r.conseillere.reunions)} × (${eur(v.marge)} − ${eur(r.margePerdue)}) − ${eur(r.conseillere.formation)} = ${eur(r.conseillere.valeur)}`,
          },
        ];
      },
      explication: (c) => {
        const x = reseauDeLaBoutique(c);
        const r = x.retractation;
        return [
          `Les rétractations coûtent ${eur(r.margePerdue)} par réunion ; une conseillère vaut alors ${eur(r.conseillere.valeur)}. La meilleure prime reste ${eur(r.prime)} : la décision tient.`,
          "La conseillère doit remettre le formulaire de rétractation et dire le délai. Un bon de commande sans cette information prolonge le délai, et la vente devient fragile.",
        ];
      },
    },
    {
      id: "le-code-ethique",
      objectifs: [4],
      type: "choix",
      titre: "Ce que le code éthique interdit",
      notions: ["pay_and_motivation"],
      question: () => "Une conseillère propose : « Versons la prime à la marraine dès que sa filleule signe, et faisons payer le kit aux recrues. » Qu'en dites-vous ?",
      options: () => [
        { texte: "Non : la prime suit les ventes de la filleule", juste: true, retour: "Oui. Payer le recrutement lui-même, sans vente, et faire payer l'entrée dans le réseau ressemblent à une vente pyramidale, interdite. Le code éthique de la vente directe veut une rémunération assise sur les ventes aux clients, et aucun achat forcé." },
        { texte: "Oui : le réseau grandirait plus vite, à moindre coût", juste: false, retour: "Non. Un réseau qui paie l'adhésion plutôt que la vente vit de ses recrues, pas de ses clients. C'est interdit, et c'est ce qui le ferait s'effondrer." },
        { texte: "Oui pour le kit, si son prix est celui du coût d'achat", juste: false, retour: "Non. Le kit fait partie de la formation ; le faire payer à l'entrée serait un droit d'entrée déguisé. La boutique l'a compté dans le coût d'une recrue." },
      ],
    },
    {
      id: "animer-le-reseau",
      objectifs: [2],
      type: "choix",
      titre: "Animer le réseau",
      notions: ["churn_rate", "training"],
      question: () => {
        return `Une conseillère sur ${qte(1 / ATTRITION_MENSUELLE)} part chaque mois. Quelle animation agit d'abord sur cette attrition ?`;
      },
      options: () => [
        { texte: "La marraine suit ses filleules aux premières réunions", juste: true, retour: "Oui. Les départs viennent surtout des premières réunions ratées. Un accompagnement, une réunion mensuelle du réseau, un tableau de bord partagé (réunions, ventes, recrues) et un challenge sur les ventes allongent la durée de chaque conseillère." },
        { texte: "Une prime de parrainage plus forte, pour remplacer celles qui partent", juste: false, retour: "Non. Recruter plus pour compenser les départs coûte une formation à chaque fois. Allonger la durée d'une conseillère augmente sa valeur sans rien payer de plus." },
        { texte: "Une commission plus haute pour toutes", juste: false, retour: "Non, pas d'abord : chaque point de commission baisse la marge de toutes les réunions, sans traiter la cause des départs, souvent un démarrage difficile." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["average_basket", "customer_lifetime_value", "distribution_commission"],
      texte: (c) => {
        const x = reseauDeLaBoutique(c);
        return [
          `Une réunion chez ${x.f.entreprise} vend ${eur(x.reunion.chiffreTtc)} TTC, un panier de ${eur(x.reunion.panierTtc)}, et laisse ${eur(x.reunion.marge)} après la commission de ${pct(COMMISSION_DE_LA_CONSEILLERE * 100)} et le cadeau de l'hôtesse.`,
          `La conseillère est VDI mandataire : ${eur(x.commissionDeLAnnee)} par an, loin du seuil de dispense de ${eur(x.seuilDImmatriculation)}. Formée pour ${eur(x.formation.cout)}, elle reste ${qte(x.conseillere.dureeDeVie)} mois et vaut ${eur(x.conseillere.valeur)}.`,
          `La prime de parrainage de ${eur(x.prime)} laisse ${eur(x.parrainageRetenu.gain)} : elle se paie sur toutes les filleules. Elle suit les ventes de la filleule, jamais la seule adhésion. La rétractation de ${qte(DELAI_DE_RETRACTATION)} jours et le code éthique bornent le réseau.`,
          "Au niveau de l'examen, vous savez chiffrer une réunion, situer le statut et le seuil d'une VDI, calculer ce que coûte et vaut une conseillère, et décider d'une prime de parrainage sans tomber dans l'effet d'aubaine.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Valeur d'une conseillère = durée moyenne dans le réseau (1 ÷ attrition) × réunions par mois × marge d'une réunion − coût de formation. Gain du parrainage = recrues en plus × valeur d'une conseillère − prime × toutes les filleules.",
    },
  ],
};
