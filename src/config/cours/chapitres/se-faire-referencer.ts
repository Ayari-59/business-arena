import { arrondi2 as auCentieme, eur, nombreAuCentieme, pct, qte as entier } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  ANIMATION,
  CADRE_DE_LA_NEGOCIATION,
  LINEAIRE_DE_NOVA,
  LINEAIRE_DU_RAYON,
  MAGASINS_DE_CAMPUSTECH,
  MARGE_DU_RAYON_PAR_MOIS,
  MISE_EN_AVANT,
  MOIS_DE_L_ANNEE,
  PRIX_DE_LA_RENTREE,
  PRIX_PUBLIC_TTC,
  REMISE_SUR_FACTURE,
  ficheDuReferencement,
  offreACampusTech,
  referencementDeNova,
} from "../monde/referencement-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : SE FAIRE RÉFÉRENCER CHEZ UN DISTRIBUTEUR : PRIX, MARGES ET LINÉAIRE (BTS NDRC, bloc 3,
 * palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA (décision du propriétaire, novembre 2026 : le
 * fabricant, fournisseur de la chaîne CampusTech), sur monde/referencement-de-nova.ts, qui lit le prix,
 * le coût variable et les 320 enceintes par mois de CampusTech de toutes les fiches de NOVA.
 *
 * L'objet : NOVA prépare la négociation annuelle avec la centrale de CampusTech. Ce que gagne le
 * distributeur (prix public, marge, taux de marque, coefficient), ce que rapporte le linéaire de la
 * marque face au rayon (l'indice de rentabilité), puis ce qu'il faut céder pour garder sa place : une
 * remise sur facture ou une coopération commerciale (une marge arrière) qui fait vendre. Le piège
 * central : la remise seule coûte cher à NOVA ; une mise en avant payée, qui fait vendre plus, garde
 * le référencement pour bien moins. Puis le seuil de revente à perte, qui borne la promotion du
 * distributeur, une animation sur le lieu de vente, et le cadre légal de la convention annuelle.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, le-prix-public, qui-decide, la-rentabilite-du-lineaire ;
 *   · l'expérience avant la formule : predire-la-remise puis la-remise-au-curseur, avant
 *     la-marge-arriere ; predire-la-mise-en-avant puis le-laboratoire-du-referencement ;
 *   · autonome et expert : la-marge-arriere, le-seuil-de-revente-a-perte, la-promotion-de-la-rentree,
 *     l-animation, la-convention ; puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : le taux de marque, la part de la marge et la promotion la plus
 * forte se donnent à deux décimales, à un centième près (au dixième, avant) ; le coefficient
 * multiplicateur et l'indice de rentabilité du linéaire sont des grandeurs, au centième, l'indice tiré
 * de la part de la marge arrondie ; les enceintes sont des quantités, entières, déclarées comme
 * telles.
 */

export const ENTREPRISES_DU_REFERENCEMENT: readonly string[] = ["nova"];

export const CODE_DU_REFERENCEMENT = "se-faire-referencer";
export const TITRE_DU_REFERENCEMENT = "Se faire référencer chez un distributeur : prix, marges et linéaire";

/** Le levier à choix du laboratoire : sans la mise en avant (0) ou avec (1). */
export const SANS_MISE_EN_AVANT = 0;
export const AVEC_MISE_EN_AVANT = 1;

const qte = nombreAuCentieme;
/** L'indice de rentabilité du linéaire de la copie : la part de la marge à deux décimales, divisée par la part du linéaire. */
const indiceDeLaCopie = (x: { partDeLaMarge: number; partDuLineaire: number }) => auCentieme(auCentieme(x.partDeLaMarge * 100) / auCentieme(x.partDuLineaire * 100));

/** Tout ce que le chapitre et son cas lisent. */
export function referencement(c: Pick<Cas, "code">) {
  const f = ficheDuReferencement(c);
  return { f, ...referencementDeNova(f) };
}

export type Referencement = ReturnType<typeof referencement>;

/** Le laboratoire : une remise sur facture et la mise en avant, oui ou non. */
export const laboratoireDuReferencement = (x: Referencement, p: Readonly<Record<string, number>>) =>
  offreACampusTech(x.f, p.remise!, p.miseEnAvant === AVEC_MISE_EN_AVANT);

/** La NOVA One chez CampusTech : le document de départ. */
function tableauDeDepart(x: Referencement): TableauDeDonnees {
  const a = x.aujourdHui;
  return {
    titre: "La NOVA One chez CampusTech, par mois",
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Prix payé à NOVA, hors taxes", valeurs: [eur(a.prixDAchat)] },
      { libelle: "Prix public, toutes taxes comprises", valeurs: [eur(PRIX_PUBLIC_TTC)] },
      { libelle: "Magasins de la chaîne", valeurs: [qte(MAGASINS_DE_CAMPUSTECH)] },
      { libelle: "Enceintes vendues par magasin", valeurs: [qte(a.parMagasin)] },
      { libelle: "Linéaire de NOVA par magasin", valeurs: [`${qte(LINEAIRE_DE_NOVA)} m`] },
      { libelle: "Linéaire du rayon audio", valeurs: [`${qte(LINEAIRE_DU_RAYON)} m`] },
      { libelle: "Marge du rayon audio par magasin", valeurs: [eur(MARGE_DU_RAYON_PAR_MOIS)] },
    ],
  };
}

export const SE_FAIRE_REFERENCER: Chapitre = {
  code: "se-faire-referencer",
  parcours: "ndrc",
  palier: 3,
  blocs: ["BTS NDRC Bloc 3 · Relation client et animation de réseaux"],
  titre: TITRE_DU_REFERENCEMENT,
  accroche:
    "L'acheteur d'une chaîne juge une marque à ce que rapporte son mètre de rayon. Ce que gagne le distributeur, ce qu'il faut céder pour garder sa place, et pourquoi une mise en avant payée coûte moins qu'une remise.",
  objectifs: [
    "Calculer le prix public hors taxes, la marge, le taux de marque et le coefficient du distributeur",
    "Mesurer la rentabilité du linéaire d'une marque et son indice face au rayon",
    "Chiffrer la remise ou la coopération commerciale qui garde le référencement",
    "Calculer le seuil de revente à perte et dire si une promotion le respecte",
    "Juger une animation sur le lieu de vente et le cadre de la négociation annuelle",
  ],
  libre: false,
  prerequis: ["negocier-le-prix", "taux-de-marque-et-coefficient"],
  ensuite: ["commissions-des-partenaires"],
  entreprises: {
    codes: ENTREPRISES_DU_REFERENCEMENT,
    pourquoi:
      "ce chapitre se joue chez NOVA, le fabricant, face à la centrale de CampusTech, la chaîne qui revend ses enceintes : c'est là que se négocient un référencement, un linéaire et ses marges.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une marque face à la centrale",
      notions: ["markup_coefficient", "assortment"],
      tableau: (c) => tableauDeDepart(referencement(c)),
      texte: (c) => {
        const x = referencement(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}. Elle vend sa NOVA One de deux façons : en ligne, directement aux particuliers ; et par CampusTech, une chaîne de ${qte(MAGASINS_DE_CAMPUSTECH)} magasins sur les campus.`,
          `CampusTech est du commerce intégré : les magasins appartiennent à la chaîne. Sa centrale de référencement achète pour tous. Son acheteur décide des marques, du linéaire de chacune et des conditions de l'année.`,
          `Dans le magasin, le chef de rayon implante et suit les ventes. Chez ${x.f.entreprise}, c'est le dirigeant qui négocie, comme un chef de secteur : il visite les magasins, vérifie que l'accord est appliqué et propose des animations.`,
          `Chaque mois, ${x.f.entreprise} vend ${qte(x.aujourdHui.parMagasin * MAGASINS_DE_CAMPUSTECH)} enceintes à CampusTech, à ${eur(x.aujourdHui.prixDAchat)} hors taxes. L'acheteur prépare la convention de l'an prochain. Il dit : « Votre mètre de rayon rapporte moins que les autres. »`,
        ];
      },
      repere: () =>
        "Prix public hors taxes = prix TTC ÷ (1 + TVA). Marge du distributeur = prix public hors taxes − prix d'achat. Coefficient multiplicateur = prix public TTC ÷ prix d'achat hors taxes.",
    },
    {
      id: "le-prix-public",
      objectifs: [0],
      type: "montants",
      titre: "Ce que gagne le distributeur",
      notions: ["markup_coefficient", "margin_rates"],
      question: (c) => {
        const x = referencement(c);
        return `CampusTech affiche la NOVA One à ${eur(PRIX_PUBLIC_TTC)} TTC (TVA ${pct(x.f.semestre.tauxDeTva * 100)}) et la paie ${eur(x.aujourdHui.prixDAchat)} hors taxes. Calculez le prix public hors taxes, la marge de CampusTech sur une enceinte, son taux de marque à deux décimales, puis le coefficient multiplicateur au centième.`;
      },
      champs: (c) => {
        const x = referencement(c);
        const a = x.aujourdHui;
        return [
          { libelle: "Prix public hors taxes", attendu: a.prixPublicHt, calcul: `${eur(PRIX_PUBLIC_TTC)} ÷ ${qte(1 + x.f.semestre.tauxDeTva)} = ${eur(a.prixPublicHt)}` },
          { libelle: "Marge du distributeur par enceinte", attendu: a.margeAvant, calcul: `${eur(a.prixPublicHt)} − ${eur(a.prixDAchat)} = ${eur(a.margeAvant)}` },
          { libelle: "Taux de marque (%)", attendu: auCentieme(x.tauxDeMarque * 100), calcul: `${eur(a.margeAvant)} ÷ ${eur(a.prixPublicHt)} × 100 = ${pct(auCentieme(x.tauxDeMarque * 100))}` },
          { libelle: "Coefficient multiplicateur", nature: "grandeur", attendu: auCentieme(x.coefficient), calcul: `${eur(PRIX_PUBLIC_TTC)} ÷ ${eur(a.prixDAchat)} = ${qte(auCentieme(x.coefficient))}` },
        ];
      },
      explication: (c) => {
        const x = referencement(c);
        return [
          `Sur une NOVA One, CampusTech garde ${eur(x.aujourdHui.margeAvant)}, ${pct(auCentieme(x.tauxDeMarque * 100))} de son prix hors taxes. Le coefficient, ${qte(auCentieme(x.coefficient))}, passe du prix d'achat hors taxes au prix affiché : c'est l'outil de l'acheteur pour fixer ses étiquettes.`,
          `Ce prix public, c'est CampusTech qui le fixe. Un fournisseur peut conseiller un prix, il ne peut pas imposer de prix de revente minimal. ${x.f.entreprise} ne négocie donc pas l'étiquette : elle négocie ce qu'elle facture, et ce qu'elle paie au distributeur.`,
        ];
      },
    },
    {
      id: "qui-decide",
      objectifs: [1],
      type: "choix",
      titre: "Qui décide du référencement",
      notions: ["assortment"],
      question: () =>
        "Le chef de rayon d'un magasin vous dit que la NOVA One se vend bien chez lui, et qu'il voudrait plus de place. Que faites-vous ?",
      options: () => [
        { texte: "Vous le faites valoir à la centrale", juste: true, retour: "Oui. Dans une chaîne intégrée, la centrale référence pour tous les magasins : le linéaire se négocie avec son acheteur. Les ventes d'un magasin sont un argument, que le chef de secteur fait remonter." },
        { texte: "Vous signez avec lui une place de plus dans son magasin", juste: false, retour: "Non. Le chef de rayon applique le plan de la centrale ; il ne signe pas de conditions. Un accord local ne vaudrait rien face à la convention annuelle." },
        { texte: "Vous baissez votre prix en ligne pour pousser ses ventes", juste: false, retour: "Non. Baisser le prix en ligne prendrait des ventes au distributeur, et l'acheteur le reprocherait à la marque. Le linéaire se gagne à la centrale." },
      ],
    },
    {
      id: "la-rentabilite-du-lineaire",
      objectifs: [1],
      type: "montants",
      titre: "Ce que rapporte le mètre de NOVA",
      notions: ["sales_per_sqm", "assortment"],
      question: (c) => {
        const x = referencement(c);
        return `Dans un magasin, la NOVA One vend ${qte(x.aujourdHui.parMagasin)} enceintes par mois sur ${qte(LINEAIRE_DE_NOVA)} m ; le rayon audio fait ${qte(LINEAIRE_DU_RAYON)} m et ${eur(MARGE_DU_RAYON_PAR_MOIS)} de marge. Calculez la marge de CampusTech sur la NOVA One par magasin, sa marge par mètre, la part du linéaire de NOVA (%), sa part de la marge du rayon (%, à deux décimales), puis l'indice de rentabilité du linéaire au centième.`;
      },
      champs: (c) => {
        const x = referencement(c);
        const a = x.aujourdHui;
        return [
          { libelle: "Marge par magasin et par mois", attendu: a.margeParMagasin, calcul: `${qte(a.parMagasin)} × ${eur(a.margeAvant)} = ${eur(a.margeParMagasin)}` },
          { libelle: "Marge par mètre de linéaire", attendu: a.margeParMetre, calcul: `${eur(a.margeParMagasin)} ÷ ${qte(LINEAIRE_DE_NOVA)} = ${eur(a.margeParMetre)}` },
          { libelle: "Part du linéaire (%)", attendu: x.partDuLineaire * 100, calcul: `${qte(LINEAIRE_DE_NOVA)} ÷ ${qte(LINEAIRE_DU_RAYON)} × 100 = ${pct(x.partDuLineaire * 100)}` },
          { libelle: "Part de la marge du rayon (%)", attendu: auCentieme(x.partDeLaMarge * 100), calcul: `${eur(a.margeParMagasin)} ÷ ${eur(MARGE_DU_RAYON_PAR_MOIS)} × 100 = ${pct(auCentieme(x.partDeLaMarge * 100))}` },
          { libelle: "Indice de rentabilité du linéaire", nature: "grandeur", attendu: indiceDeLaCopie(x), calcul: `${pct(auCentieme(x.partDeLaMarge * 100))} ÷ ${pct(x.partDuLineaire * 100)} = ${qte(indiceDeLaCopie(x))}` },
        ];
      },
      explication: (c) => {
        const x = referencement(c);
        return [
          `${x.f.entreprise} occupe ${pct(x.partDuLineaire * 100)} du rayon et n'en fait que ${pct(auCentieme(x.partDeLaMarge * 100))} de la marge : son indice, ${qte(indiceDeLaCopie(x))}, est sous 1. Son mètre rapporte ${eur(x.aujourdHui.margeParMetre)}, quand le rayon en fait ${eur(x.margeExigee)}.`,
          "Un indice sous 1 dit que la marque est trop exposée pour ce qu'elle rapporte. L'acheteur peut réduire sa place, ou la sortir du rayon : c'est le déréférencement.",
        ];
      },
    },
    {
      id: "predire-la-remise",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la remise",
      notions: ["markup_coefficient", "price_floor"],
      question: (c) => {
        const x = referencement(c);
        return `Pour garder ses ${qte(LINEAIRE_DE_NOVA)} m, la NOVA One doit rapporter ${eur(x.margeExigee)} par mètre, contre ${eur(x.aujourdHui.margeParMetre)}. Sans rien d'autre qu'une remise sur facture, combien faut-il céder par enceinte ?`;
      },
      options: (c) => {
        const x = referencement(c);
        const voir = "Faites varier la remise à l'étape suivante : le curseur compare la marge au mètre à celle du rayon.";
        const pari = (juste: boolean) => (juste ? `Bon pari. ${voir}` : `Pari à vérifier. ${voir}`);
        const r = x.remiseNecessaire;
        return [
          { texte: "Moins de 2 € : il ne manque qu'un peu de marge", juste: r < 2, retour: pari(r < 2) },
          { texte: "De 2 à 5 €", juste: r >= 2 && r <= 5, retour: pari(r >= 2 && r <= 5) },
          { texte: "Plus de 5 € : le mètre de NOVA est loin de celui du rayon", juste: r > 5, retour: pari(r > 5) },
        ];
      },
    },
    {
      id: "la-remise-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "La remise au curseur",
      notions: ["markup_coefficient", "sales_per_sqm"],
      question: (c) => {
        const x = referencement(c);
        return `Faites varier la remise sur facture, de ${eur(REMISE_SUR_FACTURE.min)} à ${eur(REMISE_SUR_FACTURE.max)} par enceinte. Une droite donne la marge de CampusTech par mètre de NOVA, l'autre celle qu'exige l'acheteur (${eur(x.margeExigee)}). Placez le curseur sur la plus petite remise, à l'euro entier, qui garde la place de NOVA, puis validez.`;
      },
      grandeur: () => ({ libelle: "Remise sur facture par enceinte", unite: "€" }),
      cible: (c) => {
        const x = referencement(c);
        return { attendu: x.remiseNecessaire, min: REMISE_SUR_FACTURE.min, max: REMISE_SUR_FACTURE.max };
      },
      zones: ["NOVA garde sa place", "Le mètre de NOVA rapporte trop peu"],
      rates: () => ({
        dessous: "À cette remise, le mètre de NOVA rapporte encore moins que le rayon : l'acheteur réduit sa place.",
        dessus: "Moins de remise suffit : cherchez la plus petite qui garde la place.",
      }),
      montrer: "Montrer la remise nécessaire",
      lecture: (c, r) => {
        const x = referencement(c);
        const o = offreACampusTech(x.f, r, false);
        return [
          { libelle: "Prix net facturé par NOVA", montant: o.prixNet },
          { libelle: "Marge du distributeur par enceinte", montant: o.margeAvant },
          { libelle: "Marge par mètre de NOVA", montant: o.margeParMetre },
          { libelle: "Marge exigée par mètre", montant: x.margeExigee },
          { libelle: "Marge de NOVA sur l'année", montant: o.margeDeNova, fort: true },
        ];
      },
      droites: (c) => {
        const x = referencement(c);
        const a = x.aujourdHui;
        return {
          produit: (r) => (a.parMagasin * (a.margeAvant + r)) / LINEAIRE_DE_NOVA,
          cout: () => x.margeExigee,
          libelles: ["Marge de CampusTech par mètre de NOVA", "Marge exigée par l'acheteur"],
        };
      },
      explication: (c) => {
        const x = referencement(c);
        return [
          `Il faut ${eur(x.remiseNecessaire)} de remise par enceinte : la marge de CampusTech passe à ${eur(x.sansMiseEnAvant.margeAvant)}, et le mètre à ${eur(x.sansMiseEnAvant.margeParMetre)}. Chaque euro de remise vaut ${eur(x.aujourdHui.parMagasin / LINEAIRE_DE_NOVA)} au mètre, car ${qte(x.aujourdHui.parMagasin)} enceintes tiennent sur ${qte(LINEAIRE_DE_NOVA)} m.`,
          `Pour ${x.f.entreprise}, la note est lourde : ${eur(x.remiseNecessaire)} sur chacune des ${qte(x.aujourdHui.ventesDeLAnnee)} enceintes de l'année, sa marge chez CampusTech tombe de ${eur(x.aujourdHui.margeDeNova)} à ${eur(x.sansMiseEnAvant.margeDeNova)}.`,
        ];
      },
    },
    {
      id: "la-marge-arriere",
      objectifs: [2],
      type: "montants",
      titre: "La même chose en marge arrière",
      notions: ["markup_coefficient", "contribution_margin"],
      question: () =>
        "Sans formule. Au lieu de la remise, l'acheteur accepterait une coopération commerciale payée à l'année, une marge arrière qui s'ajoute à sa marge sur facture. Calculez la marge qui manque à un magasin chaque mois, la coopération annuelle qui la comble pour toute la chaîne, ce qu'elle coûte par enceinte de l'année, puis la marge de NOVA chez CampusTech après l'avoir payée.",
      champs: (c) => {
        const x = referencement(c);
        const a = x.aujourdHui;
        const parEnceinte = auCentieme(x.cooperationEquivalente / a.ventesDeLAnnee);
        return [
          { libelle: "Marge qui manque par magasin et par mois", attendu: x.manqueParMagasin, calcul: `${eur(x.margeExigee)} × ${qte(LINEAIRE_DE_NOVA)} − ${eur(a.margeParMagasin)} = ${eur(x.manqueParMagasin)}` },
          { libelle: "Coopération annuelle équivalente", attendu: x.cooperationEquivalente, calcul: `${eur(x.manqueParMagasin)} × ${qte(MAGASINS_DE_CAMPUSTECH)} magasins × ${qte(MOIS_DE_L_ANNEE)} mois = ${eur(x.cooperationEquivalente)}` },
          { libelle: "Coût par enceinte de l'année", attendu: parEnceinte, calcul: `${eur(x.cooperationEquivalente)} ÷ ${qte(a.ventesDeLAnnee)} = ${eur(parEnceinte)}` },
          { libelle: "Marge de NOVA après la coopération", attendu: auCentieme(a.margeDeNova - x.cooperationEquivalente), calcul: `${eur(a.margeDeNova)} − ${eur(x.cooperationEquivalente)} = ${eur(auCentieme(a.margeDeNova - x.cooperationEquivalente))}` },
        ];
      },
      explication: (c) => {
        const x = referencement(c);
        return [
          `Payée en marge arrière, la place coûte exactement la remise : ${eur(auCentieme(x.cooperationEquivalente / x.aujourdHui.ventesDeLAnnee))} par enceinte, ${eur(x.cooperationEquivalente)} par an. L'argent change de nom, pas de montant.`,
          "Et la loi ne laisse pas payer un service qui n'existe pas : une coopération commerciale rémunère un service rendu, écrit dans la convention. Elle n'a d'intérêt que si ce service fait vendre.",
        ];
      },
    },
    {
      id: "predire-la-mise-en-avant",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la mise en avant",
      notions: ["markup_coefficient", "sales_per_sqm"],
      question: () => {
        return `La centrale propose une tête de gondole deux semaines par trimestre et une page du catalogue de la rentrée, pour ${eur(MISE_EN_AVANT.prixParAn)} par an. Elle ferait vendre ${pct(MISE_EN_AVANT.ventesEnPlus * 100)} de NOVA One en plus. Avec elle, la remise qui garde la place de NOVA…`;
      },
      options: (c) => {
        const x = referencement(c);
        const voir = "Le laboratoire de l'étape suivante combine la remise et la mise en avant.";
        const pari = (juste: boolean) => (juste ? `Bon pari. ${voir}` : `Pari à vérifier. ${voir}`);
        const baisse = x.meilleure.avecMiseEnAvant && x.meilleure.remise < x.remiseNecessaire;
        return [
          { texte: "Baisse : les ventes en plus font la marge", juste: baisse, retour: pari(baisse) },
          { texte: `Reste à ${eur(x.remiseNecessaire)} : le prix de la place ne change pas`, juste: !baisse && x.meilleure.remise === x.remiseNecessaire, retour: pari(!baisse && x.meilleure.remise === x.remiseNecessaire) },
          { texte: `Monte : il faut payer les ${eur(MISE_EN_AVANT.prixParAn)} en plus`, juste: !baisse && x.meilleure.remise > x.remiseNecessaire, retour: pari(!baisse && x.meilleure.remise > x.remiseNecessaire) },
        ];
      },
    },
    {
      id: "le-laboratoire-du-referencement",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire du référencement",
      notions: ["markup_coefficient", "sales_per_sqm", "contribution_margin"],
      question: () =>
        "Préparez l'offre de NOVA à la centrale. Changez la remise sur facture, et prenez ou non la mise en avant. Le tableau donne la marge de CampusTech par mètre de NOVA, ce qu'exige l'acheteur, et la marge de NOVA sur l'année ; le graphique trace la marge au mètre selon la remise. Relevez le défi.",
      leviers: (c) => {
        const x = referencement(c);
        return [
          { code: "remise", libelle: "Remise sur facture par enceinte", unite: "€", ...REMISE_SUR_FACTURE, depart: x.remiseNecessaire },
          {
            code: "miseEnAvant",
            libelle: "Mise en avant",
            unite: "",
            min: SANS_MISE_EN_AVANT,
            max: AVEC_MISE_EN_AVANT,
            pas: 1,
            depart: SANS_MISE_EN_AVANT,
            choix: [
              { valeur: SANS_MISE_EN_AVANT, libelle: "sans" },
              { valeur: AVEC_MISE_EN_AVANT, libelle: `avec, ${eur(MISE_EN_AVANT.prixParAn)} par an` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = referencement(c);
        const o = laboratoireDuReferencement(x, p);
        const d = x.sansMiseEnAvant;
        return [
          { libelle: "Enceintes vendues par magasin et par mois", montant: o.parMagasin, unite: "enceintes", reference: d.parMagasin },
          { libelle: "Marge sur facture par enceinte", montant: o.margeAvant, reference: d.margeAvant },
          { libelle: "Marge arrière par magasin et par mois", montant: o.margeArriereParMagasin, reference: d.margeArriereParMagasin },
          { libelle: "Marge de CampusTech par mètre de NOVA", montant: o.margeParMetre, reference: d.margeParMetre },
          { libelle: "Marge exigée par mètre", montant: x.margeExigee },
          { libelle: "Marge de NOVA sur l'année", montant: o.margeDeNova, reference: d.margeDeNova, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = referencement(c);
        return {
          levier: "remise",
          courbes: [
            { libelle: "Marge de CampusTech par mètre de NOVA", valeur: (p) => laboratoireDuReferencement(x, p).margeParMetre },
            { libelle: "Marge exigée par mètre", valeur: () => x.margeExigee },
          ],
        };
      },
      defi: (c) => {
        const x = referencement(c);
        const m = x.meilleure;
        return {
          consigne: "Trouvez l'offre qui garde la place de NOVA dans le rayon en lui laissant le plus de marge sur l'année.",
          atteint: (p) => p.remise === m.remise && p.miseEnAvant === (m.avecMiseEnAvant ? AVEC_MISE_EN_AVANT : SANS_MISE_EN_AVANT),
          indice: (p) => {
            const o = laboratoireDuReferencement(x, p);
            if (!o.tient) return `À cette offre, le mètre de NOVA rapporte ${eur(o.margeParMetre)} à CampusTech, moins que les ${eur(x.margeExigee)} exigés : il faut plus de remise, ou des ventes en plus.`;
            if (p.miseEnAvant !== AVEC_MISE_EN_AVANT) return `La place est gardée, mais chaque euro de remise se paie sur ${qte(o.ventesDeLAnnee)} enceintes. Essayez la mise en avant.`;
            return `La place est gardée et NOVA garde ${eur(o.margeDeNova)}. Une remise plus petite tiendrait-elle encore ?`;
          },
          solution: { remise: m.remise, miseEnAvant: m.avecMiseEnAvant ? AVEC_MISE_EN_AVANT : SANS_MISE_EN_AVANT },
        };
      },
      explication: (c) => {
        const x = referencement(c);
        const m = x.meilleure;
        return [
          `Avec la mise en avant, ${eur(m.remise)} de remise suffit : ${qte(m.parMagasin)} enceintes par magasin et la marge arrière portent le mètre à ${eur(m.margeParMetre)}. ${x.f.entreprise} garde ${eur(m.margeDeNova)} sur l'année, contre ${eur(x.sansMiseEnAvant.margeDeNova)} avec la remise seule.`,
          `La mise en avant coûte ${eur(MISE_EN_AVANT.prixParAn)}, mais elle fait vendre : le distributeur gagne par le volume ce que la remise lui aurait donné par enceinte. Une coopération se juge sur les ventes qu'elle amène, pas sur son prix.`,
        ];
      },
    },
    {
      id: "le-seuil-de-revente-a-perte",
      objectifs: [3],
      type: "montants",
      titre: "Le seuil de revente à perte",
      notions: ["price_floor", "markup_coefficient"],
      question: (c) => {
        const x = referencement(c);
        const m = x.meilleure;
        return `Sans formule. L'offre retenue : ${eur(m.remise)} de remise sur facture et la mise en avant à ${eur(MISE_EN_AVANT.prixParAn)}, pour ${qte(m.ventesDeLAnnee)} enceintes dans l'année. ${x.f.entreprise} livre franco. Calculez le prix net facturé, la coopération ramenée à une enceinte, le seuil de revente à perte hors taxes, puis taxes comprises, et la plus forte promotion que CampusTech peut annoncer sur ${eur(PRIX_PUBLIC_TTC)} (%, à deux décimales).`;
      },
      champs: (c) => {
        const x = referencement(c);
        const m = x.meilleure;
        return [
          { libelle: "Prix net facturé", attendu: m.prixNet, calcul: `${eur(m.prixDAchat)} − ${eur(m.remise)} = ${eur(m.prixNet)}` },
          { libelle: "Coopération par enceinte", attendu: m.cooperationParEnceinte, calcul: `${eur(MISE_EN_AVANT.prixParAn)} ÷ ${qte(m.ventesDeLAnnee)} = ${eur(m.cooperationParEnceinte)}` },
          { libelle: "Seuil de revente à perte hors taxes", attendu: m.seuilHt, calcul: `${eur(m.prixNet)} + 0 € de transport − ${eur(m.cooperationParEnceinte)} = ${eur(m.seuilHt)}` },
          { libelle: "Seuil de revente à perte TTC", attendu: m.seuilTtc, calcul: `${eur(m.seuilHt)} × ${qte(1 + x.f.semestre.tauxDeTva)} = ${eur(m.seuilTtc)}` },
          { libelle: "Promotion la plus forte (%)", attendu: auCentieme(x.promotionMaximale * 100), calcul: `(${eur(PRIX_PUBLIC_TTC)} − ${eur(m.seuilTtc)}) ÷ ${eur(PRIX_PUBLIC_TTC)} × 100 = ${pct(auCentieme(x.promotionMaximale * 100))}` },
        ];
      },
      explication: (c) => {
        const x = referencement(c);
        return [
          `Le seuil se lit sur le prix d'achat effectif, le « triple net » : le prix net de la facture, plus le transport payé par le distributeur, moins tous les autres avantages du fournisseur. La coopération baisse donc le seuil de ${eur(x.meilleure.cooperationParEnceinte)}.`,
          `CampusTech ne peut pas revendre la NOVA One sous ${eur(x.meilleure.seuilTtc)}, hors soldes et cas prévus par la loi. Une société qui le fait encourt jusqu'au quintuple de ${eur(CADRE_DE_LA_NEGOCIATION.amendeDeLaReventeAPerte)} d'amende.`,
        ];
      },
    },
    {
      id: "la-promotion-de-la-rentree",
      objectifs: [3],
      type: "choix",
      titre: "Le prix de la rentrée",
      notions: ["price_floor"],
      question: () => `Pour la rentrée, l'acheteur veut afficher la NOVA One à ${eur(PRIX_DE_LA_RENTREE)} TTC, hors période de soldes, et demande à NOVA d'accepter. Que répondez-vous ?`,
      options: (c) => {
        const x = referencement(c);
        return [
          { texte: `Non : ce serait revendre sous ${eur(x.meilleure.seuilTtc)}`, juste: x.rentreeAPerte, retour: `Oui. ${eur(PRIX_DE_LA_RENTREE)} est sous le seuil de revente à perte. La promotion peut descendre jusqu'à ${eur(x.meilleure.seuilTtc)}, soit ${pct(auCentieme(x.promotionMaximale * 100))} de moins que le prix public.` },
          { texte: "Oui : CampusTech fixe librement son prix de vente", juste: !x.rentreeAPerte, retour: `Le distributeur fixe son prix, mais pas sous le seuil de revente à perte, ${eur(x.meilleure.seuilTtc)} ici. La liberté du prix a cette limite.` },
          { texte: "Oui, si NOVA rembourse la différence au distributeur", juste: false, retour: "Non. Un remboursement serait un avantage de plus : il baisserait le prix d'achat effectif, et il devrait figurer dans la convention. Il ne rend pas légale une revente sous le seuil d'aujourd'hui." },
        ];
      },
    },
    {
      id: "l-animation",
      objectifs: [4],
      type: "montants",
      titre: "L'animation sur le lieu de vente",
      notions: ["contribution_margin", "breakeven"],
      question: (c) => {
        const x = referencement(c);
        return `Pour lancer la mise en avant, ${x.f.entreprise} paie une animatrice un samedi dans chacun des ${qte(ANIMATION.journees)} magasins, ${eur(ANIMATION.coutParJournee)} la journée. Elle fait écouter l'enceinte ; une journée vend ${qte(ANIMATION.ventesEnPlusParJournee)} NOVA One de plus, à ${eur(x.meilleure.margeUnitaireDeNova)} de marge pour NOVA. Calculez le coût de l'animation, les ventes en plus, la marge en plus, le gain, puis les ventes qu'il faut par journée pour la payer.`;
      },
      champs: (c) => {
        const x = referencement(c);
        const a = x.animation;
        return [
          { libelle: "Coût de l'animation", attendu: a.cout, calcul: `${qte(ANIMATION.journees)} journées × ${eur(ANIMATION.coutParJournee)} = ${eur(a.cout)}` },
          { libelle: "Enceintes vendues en plus", nature: "quantite", attendu: a.ventes, calcul: `${qte(ANIMATION.journees)} × ${qte(ANIMATION.ventesEnPlusParJournee)} = ${qte(a.ventes)}` },
          { libelle: "Marge en plus pour NOVA", attendu: a.marge, calcul: `${qte(a.ventes)} × ${eur(x.meilleure.margeUnitaireDeNova)} = ${eur(a.marge)}` },
          { libelle: "Gain de l'animation", attendu: a.gain, calcul: `${eur(a.marge)} − ${eur(a.cout)} = ${eur(a.gain)}` },
          { libelle: "Ventes nécessaires par journée", nature: "quantite", attendu: a.seuilParJournee, calcul: `${eur(ANIMATION.coutParJournee)} ÷ ${eur(x.meilleure.margeUnitaireDeNova)} = ${Number.isInteger(a.seuilParJourneeCalcule) ? `${qte(a.seuilParJournee)} enceintes` : `${qte(a.seuilParJourneeCalcule)}, soit ${entier(a.seuilParJournee)} enceintes à l'unité au-dessus : une de moins ne paierait pas la journée`}` },
        ];
      },
      explication: (c) => {
        const x = referencement(c);
        return [
          `L'animation laisse ${eur(x.animation.gain)} : elle se paie dès ${qte(x.animation.seuilParJournee)} enceintes par journée, et en vend ${qte(ANIMATION.ventesEnPlusParJournee)}. La marge à prendre est celle de NOVA, prix net de la remise, pas le prix public.`,
          "Elle sert aussi le distributeur : ses ventes en plus montent sa marge au mètre. C'est un argument pour la prochaine négociation, à condition de mesurer les ventes du samedi, magasin par magasin.",
        ];
      },
    },
    {
      id: "la-convention",
      objectifs: [4],
      type: "choix",
      titre: "Ce que la convention doit dire",
      notions: ["payment_terms"],
      question: () => "L'accord est trouvé. Comment se conclut-il ?",
      options: () => [
        {
          texte: `Par écrit, avant le ${CADRE_DE_LA_NEGOCIATION.dateLimiteDeLaConvention}, services de coopération détaillés`,
          juste: true,
          retour: `Oui. La convention annuelle écrit le prix, les remises et chaque service de coopération, avec sa rémunération ; elle se signe au plus tard le ${CADRE_DE_LA_NEGOCIATION.dateLimiteDeLaConvention}. Les paiements restent à ${qte(CADRE_DE_LA_NEGOCIATION.delaiDePaiement)} jours au plus. Une contrepartie sans service réel, ou un déséquilibre significatif, est sanctionnée.`,
        },
        { texte: "Par une poignée de main : l'acheteur et NOVA se connaissent", juste: false, retour: "Non. La convention écrite est obligatoire entre un fournisseur et un distributeur. Sans elle, aucun service de coopération n'a de base, et l'amende est lourde." },
        { texte: `Par des conditions qui imposent le prix public de ${eur(PRIX_PUBLIC_TTC)} à la chaîne`, juste: false, retour: "Non. Imposer un prix de revente minimal est interdit. NOVA négocie ses conditions de vente, le distributeur fixe son prix, au-dessus du seuil de revente à perte." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["markup_coefficient", "sales_per_sqm", "price_floor"],
      texte: (c) => {
        const x = referencement(c);
        return [
          `Chez CampusTech, la NOVA One laisse ${eur(x.aujourdHui.margeAvant)} au distributeur, ${pct(auCentieme(x.tauxDeMarque * 100))} de marque, au coefficient ${qte(auCentieme(x.coefficient))}. Son mètre rapporte ${eur(x.aujourdHui.margeParMetre)} quand le rayon en fait ${eur(x.margeExigee)} : un indice de ${qte(indiceDeLaCopie(x))}, sous 1.`,
          `Garder la place par la remise seule coûte ${eur(x.remiseNecessaire)} par enceinte, ${eur(x.cooperationEquivalente)} par an ; en marge arrière sans service, autant. La mise en avant payée ${eur(MISE_EN_AVANT.prixParAn)} fait vendre : avec ${eur(x.meilleure.remise)} de remise, NOVA garde ${eur(x.meilleure.margeDeNova)}.`,
          `Toutes ces concessions baissent le seuil de revente à perte, ${eur(x.meilleure.seuilTtc)} : il borne la promotion du distributeur. Une animation se juge sur la marge du fournisseur. La convention écrite fixe le tout pour l'année.`,
          "Au niveau de l'examen, vous savez calculer la marge et le coefficient du distributeur, la rentabilité du linéaire, le prix d'une place en remise ou en coopération, le seuil de revente à perte, et juger une animation.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Indice de rentabilité du linéaire = part de la marge du rayon ÷ part du linéaire. Seuil de revente à perte = prix net facturé + transport payé par le distributeur − autres avantages du fournisseur par unité, taxes comprises.",
    },
  ],
};
