import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { chargesFixesDuMois } from "../monde/boutique";
import { BANQUE_DE_LA_BOUTIQUE, IMMOBILISATIONS, MOIS_DE_CHARGES_A_GARDER, PROVISION_POUR_LITIGE, bilanDeLaBoutique, delaiDu, tresorerieAGarder } from "../monde/comptes-de-la-boutique";
import { BOUTIQUES_DU_COURS, type CodeDeFournisseur, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE BILAN ET LE BFR DE LA BOUTIQUE (BTS MCO, bloc 3, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts : le stock du
 * 1er janvier N, les délais des façonniers et des comités, l'équipe) et ses comptes
 * (monde/comptes-de-la-boutique.ts : le bilan au 31 décembre N − 1, le résultat de l'exercice, le droit
 * au bail et le rayonnage, la provision pour litige, l'emprunt de l'ouverture).
 *
 * L'objet : lire le bilan comptable de fin d'année (l'amortissement du rayonnage, la provision), le
 * condenser en bilan fonctionnel, calculer le fonds de roulement, le BFR et la trésorerie nette, et
 * quelques ratios. La boutique est payée comptant et paie ses façonniers à 45 jours : son BFR est
 * négatif, le crédit fournisseur finance le stock et les comités. Puis la question des associés :
 * combien se verser sur le résultat, et que devient la trésorerie si la boutique passe à un fournisseur
 * payé comptant ? Un découvert ne finance pas un besoin qui dure.
 *
 * Le piège central : la trésorerie n'est pas un bénéfice qui dort ; c'est ce qui reste du fonds de
 * roulement une fois le BFR financé, et le BFR bouge avec chaque délai.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, l-amortissement, ranger-le-bilan, le-fonds-de-roulement (la formule au repère) ;
 *   · l'expérience avant la formule : predire-le-comptant puis le-delai-qui-finance (un curseur sur le
 *     délai fournisseur, le BFR qui s'annule) avant le-bfr-au-comptant ; le laboratoire du dividende (le
 *     dividende et le fournisseur ; le graphique de la trésorerie nette selon le dividende) ;
 *   · autonome : les-ratios, le-bfr-au-comptant, apres-le-dividende ;
 *   · expert : la-provision-justifiee (une critique du classement), le-decouvert (le banquier) ; puis
 *     la décision et la synthèse.
 */

export const ENTREPRISES_DU_BILAN: readonly string[] = ["boutique"];

export const POURQUOI_LA_BOUTIQUE_BILAN =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît le stock, les clients, les fournisseurs et le résultat : son bilan se joue chez elle, quelle que soit votre entreprise.";

/** Les bornes du curseur du délai fournisseur, en jours. */
export const DELAI_DU_CURSEUR = { min: 0, max: 60 } as const;

/** Le laboratoire : le dividende (€) et le fournisseur des achats de fin d'année, par son délai. */
export const DIVIDENDE_DU_LABORATOIRE = { min: 0, max: 320_000, pas: 10_000 } as const;
export const FOURNISSEURS_DU_LABORATOIRE: readonly CodeDeFournisseur[] = ["fins-de-serie", "atelier-local", "faconnier"];
/** Le défi : verser 320 000 € (le distribuable, arrondi à la dizaine de milliers en dessous) en gardant la trésorerie voulue. */
export const DIVIDENDE_DU_DEFI = 320_000;
export const DEPART_DU_LABORATOIRE = { dividende: 320_000, delai: 0 } as const;
export const SOLUTION_DU_LABORATOIRE = { dividende: 320_000, delai: 45 } as const;

/** LE DIVIDENDE DEMANDÉ (hypothèse du cours) : les associés veulent se verser 320 000 € sur le résultat de N − 1. */
export const DIVIDENDE_DEMANDE = 320_000;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

export const ficheDuBilan = (c: Pick<Cas, "code">): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

/** Tout ce que le chapitre et son cas demandent. */
export function bilanDuChapitre(c: Pick<Cas, "code">) {
  const f = ficheDuBilan(c);
  const b = bilanDeLaBoutique(f);
  const comptant = bilanDeLaBoutique(f, { delaiFournisseur: delaiDu(f, "fins-de-serie") });
  const apres = bilanDeLaBoutique(f, { dividende: DIVIDENDE_DEMANDE });
  const apresAuComptant = bilanDeLaBoutique(f, { dividende: DIVIDENDE_DEMANDE, delaiFournisseur: delaiDu(f, "fins-de-serie") });
  // Le classement que le cours du propriétaire retient : une provision justifiée, d'exploitation, en passif circulant.
  const frngSansLaProvision = auCentime(b.frng - PROVISION_POUR_LITIGE);
  const bfrAvecLaProvision = auCentime(b.bfr - PROVISION_POUR_LITIGE);
  return { f, b, comptant, apres, apresAuComptant, aGarder: tresorerieAGarder(f), chargesDuMois: chargesFixesDuMois(f).total, frngSansLaProvision, bfrAvecLaProvision, delaiDuFaconnier: delaiDu(f, "faconnier"), baisseDesFinsDeSerie: auDixieme((1 - f.fournisseurs.find((k) => k.code === "fins-de-serie")!.multiplicateur) * 100) };
}

export type BilanDuChapitre = ReturnType<typeof bilanDuChapitre>;

/** Le bilan comptable au 31 décembre N − 1 : le document de départ. */
export function tableauDuBilan(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = bilanDuChapitre(c);
  const b = x.b;
  return {
    titre: `${x.f.entreprise} · le bilan au 31 décembre N − 1, avant affectation du résultat`,
    colonnes: ["Brut", "Amortissements", "Net"],
    lignes: [
      { libelle: "Droit au bail", valeurs: [eur(b.droitAuBail), "", eur(b.droitAuBail)] },
      { libelle: "Rayonnage", valeurs: [eur(b.rayonnageBrut), eur(b.amortissementsCumules), eur(b.rayonnageNet)] },
      { libelle: "Stock de marchandises", valeurs: [eur(b.stock), "", eur(b.stock)] },
      { libelle: "Créances des comités", valeurs: [eur(b.creances), "", eur(b.creances)] },
      { libelle: "Disponibilités", valeurs: [eur(b.disponibilites), "", eur(b.disponibilites)] },
      { libelle: "Total de l'actif", valeurs: ["", "", eur(b.totalDeLActif)] },
      { libelle: "Capital", valeurs: ["", "", eur(b.capital)] },
      { libelle: "Réserves", valeurs: ["", "", eur(b.reserves)] },
      { libelle: "Résultat de l'exercice", valeurs: ["", "", eur(b.resultat)] },
      { libelle: "Provision pour litige", valeurs: ["", "", eur(b.provision)] },
      { libelle: "Emprunt", valeurs: ["", "", eur(b.emprunt)] },
      { libelle: "Dettes fournisseurs", valeurs: ["", "", eur(b.dettesFournisseurs)] },
      { libelle: "Dettes fiscales et sociales", valeurs: ["", "", eur(b.dettesFiscalesEtSociales)] },
      { libelle: "Total du passif", valeurs: ["", "", eur(b.totalDuPassif)] },
    ],
  };
}

/** Le bilan fonctionnel condensé, pour la synthèse. */
function tableauDuBilanFonctionnel(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = bilanDuChapitre(c);
  const l = (libelle: string, a: number, d: number) => ({ libelle, valeurs: [eur(a), eur(d)] });
  return {
    titre: `${x.f.entreprise} · le bilan fonctionnel, avant et après le dividende de ${eur(DIVIDENDE_DEMANDE)}`,
    colonnes: ["Avant", "Après"],
    lignes: [
      l("Emplois stables", x.b.emploisStables, x.apres.emploisStables),
      l("Ressources stables", x.b.ressourcesStables, x.apres.ressourcesStables),
      l("Fonds de roulement", x.b.frng, x.apres.frng),
      l("Besoin en fonds de roulement", x.b.bfr, x.apres.bfr),
      l("Trésorerie nette", x.b.tresorerieNette, x.apres.tresorerieNette),
    ],
  };
}

const CATEGORIES_DU_BILAN = [
  { code: "emplois-stables", libelle: "Emplois stables" },
  { code: "ressources-stables", libelle: "Ressources stables" },
  { code: "actif-circulant", libelle: "Actif circulant d'exploitation" },
  { code: "passif-circulant", libelle: "Passif circulant d'exploitation" },
  { code: "tresorerie", libelle: "Trésorerie" },
] as const;

const nomDu = (f: FicheDeLaBoutique, code: CodeDeFournisseur) => f.fournisseurs.find((x) => x.code === code)!.nom;

export const LE_BILAN_ET_LE_BFR_DE_LA_BOUTIQUE: Chapitre = {
  code: "le-bilan-et-le-bfr-de-la-boutique",
  parcours: "mco",
  palier: 4,
  blocs: ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"],
  titre: "Le bilan et le BFR de la boutique",
  accroche:
    "Au 31 décembre, la boutique a beaucoup de trésorerie. Est-ce un bénéfice qui dort, ou ce qui reste une fois le stock et les comités financés ? Le bilan, le fonds de roulement, le BFR, et la question des associés : combien se verser ?",
  objectifs: [
    "Lire un bilan comptable : amortissements, provisions, capitaux propres et dettes",
    "Condenser le bilan en bilan fonctionnel et calculer le fonds de roulement, le BFR et la trésorerie nette",
    "Mesurer l'effet d'un délai de paiement sur le BFR et la trésorerie",
    "Calculer et lire les ratios du bilan",
    "Juger l'équilibre financier avant de distribuer ou d'emprunter",
  ],
  libre: false,
  prerequis: ["stock-du-point-de-vente", "le-compte-de-resultat-de-la-boutique"],
  ensuite: ["renover-la-boutique", "bilan-fonctionnel-et-bfr"],
  entreprises: { codes: ENTREPRISES_DU_BILAN, pourquoi: POURQUOI_LA_BOUTIQUE_BILAN },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le bilan du 31 décembre",
      notions: ["balance_sheet"],
      tableau: tableauDuBilan,
      texte: (c) => {
        const x = bilanDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. Le compte de résultat a dit ce que l'année a gagné, ${eur(x.b.resultat)} ; le bilan dit ce que la boutique possède et doit au 31 décembre N − 1, avant que les associés ne décident de ce résultat.`,
          `Son stock est celui du 1er janvier N, ${eur(x.b.stock)}. Les comités doivent leurs commandes de Noël, réglées à ${qte(x.f.clienteles.find((k) => k.code === "comites")!.delaiDeReglement)} jours ; le façonnier attend ses achats de réassort, payés à ${qte(x.delaiDuFaconnier)} jours ; la paie de décembre et la TVA de décembre restent à reverser.`,
          `Ce que la simulation suppose. Le droit au bail et le rayonnage datent de l'ouverture, le 1er janvier N − 3, financés par le capital et un emprunt remboursé chaque 31 décembre. La provision couvre le litige d'un comité, ${eur(PROVISION_POUR_LITIGE)}. L'impôt de l'année est payé.`,
        ];
      },
      repere: () => "Actif = ce que la boutique possède ; passif = ce qui le finance (capitaux propres et dettes). Valeur nette = valeur brute − amortissements.",
    },
    {
      id: "l-amortissement",
      objectifs: [0],
      type: "montants",
      titre: "Le rayonnage et la provision",
      notions: ["depreciation", "balance_sheet"],
      tableau: tableauDuBilan,
      question: (c) => {
        const x = bilanDuChapitre(c);
        return `Le rayonnage a coûté ${eur(IMMOBILISATIONS.rayonnage.valeur)}, amorti en linéaire sur ${qte(IMMOBILISATIONS.rayonnage.duree)} ans depuis le 1er janvier N − 3. Calculez la dotation de l'année, les amortissements cumulés au 31 décembre N − 1, la valeur nette du rayonnage, puis les capitaux propres (capital, réserves et résultat). La provision, elle, vaut ${eur(x.b.provision)}.`;
      },
      champs: (c) => {
        const b = bilanDuChapitre(c).b;
        const r = IMMOBILISATIONS.rayonnage;
        return [
          { libelle: "Dotation de l'année", attendu: b.cr.amortissements, calcul: `${eur(r.valeur)} ÷ ${qte(r.duree)} ans = ${eur(b.cr.amortissements)}` },
          { libelle: "Amortissements cumulés", attendu: b.amortissementsCumules, calcul: `${eur(b.cr.amortissements)} × ${qte(IMMOBILISATIONS.anneeDAcquisition)} ans (N − 3, N − 2, N − 1) = ${eur(b.amortissementsCumules)}` },
          { libelle: "Valeur nette du rayonnage", attendu: b.rayonnageNet, calcul: `${eur(r.valeur)} − ${eur(b.amortissementsCumules)} = ${eur(b.rayonnageNet)}` },
          { libelle: "Capitaux propres", attendu: b.capitauxPropres, calcul: `${eur(b.capital)} + ${eur(b.reserves)} + ${eur(b.resultat)} = ${eur(b.capitauxPropres)}` },
        ];
      },
      explication: (c) => {
        const b = bilanDuChapitre(c).b;
        return [
          `Le rayonnage ne vaut plus que ${eur(b.rayonnageNet)} : il sera amorti à la fin de N, et c'est la question de la rénovation. Le droit au bail ne s'use pas : il ne s'amortit pas. La provision de ${eur(b.provision)} a été dotée en N − 1 : la perte est probable, elle se constate avant d'être payée, et elle a baissé le résultat d'autant.`,
        ];
      },
    },
    {
      id: "ranger-le-bilan",
      objectifs: [1],
      type: "tri",
      titre: "Du bilan comptable au bilan fonctionnel",
      notions: ["balance_sheet", "frng", "bfr"],
      question: () =>
        "Rangez chaque poste dans le bilan fonctionnel condensé. Les immobilisations y sont à leur valeur brute ; les amortissements et la provision rejoignent les capitaux propres et l'emprunt dans les ressources stables ; le cycle d'exploitation fait l'actif et le passif circulants ; les disponibilités sont la trésorerie.",
      categories: CATEGORIES_DU_BILAN,
      elements: (c) => {
        const b = bilanDuChapitre(c).b;
        return [
          { libelle: "Droit au bail", montant: b.droitAuBail, categorie: "emplois-stables", pourquoi: "Une immobilisation : un emploi durable." },
          { libelle: "Rayonnage, valeur brute", montant: b.rayonnageBrut, categorie: "emplois-stables", pourquoi: "Une immobilisation, à sa valeur d'achat." },
          { libelle: "Amortissements du rayonnage", montant: b.amortissementsCumules, categorie: "ressources-stables", pourquoi: "L'usure mise de côté sur les résultats : une ressource gardée par la boutique." },
          { libelle: "Capitaux propres", montant: b.capitauxPropres, categorie: "ressources-stables", pourquoi: "Ce que les associés ont apporté et laissé." },
          { libelle: "Provision pour litige", montant: b.provision, categorie: "ressources-stables", pourquoi: "Rangée avec les ressources stables dans le bilan condensé." },
          { libelle: "Emprunt", montant: b.emprunt, categorie: "ressources-stables", pourquoi: "Une dette à long terme." },
          { libelle: "Stock de marchandises", montant: b.stock, categorie: "actif-circulant", pourquoi: "Le stock du cycle d'exploitation." },
          { libelle: "Créances des comités", montant: b.creances, categorie: "actif-circulant", pourquoi: "Le crédit accordé aux clients." },
          { libelle: "Dettes fournisseurs", montant: b.dettesFournisseurs, categorie: "passif-circulant", pourquoi: "Le crédit reçu des fournisseurs." },
          { libelle: "Dettes fiscales et sociales", montant: b.dettesFiscalesEtSociales, categorie: "passif-circulant", pourquoi: "La paie et la TVA du mois, à reverser : des dettes d'exploitation." },
          { libelle: "Disponibilités", montant: b.disponibilites, categorie: "tresorerie", pourquoi: "L'argent en banque et en caisse : la trésorerie active." },
        ];
      },
      explication: () => [
        "Le bilan fonctionnel range par cycle : l'investissement (les emplois stables), le financement (les ressources stables), l'exploitation (le circulant) et la trésorerie. Il se lit en trois questions : le fonds de roulement, le besoin en fonds de roulement, la trésorerie nette.",
      ],
    },
    {
      id: "le-fonds-de-roulement",
      objectifs: [1],
      type: "montants",
      titre: "Fonds de roulement, BFR, trésorerie",
      notions: ["frng", "bfr", "net_treasury"],
      question: () =>
        "Calculez les ressources stables, le fonds de roulement net global (ressources stables − emplois stables), le besoin en fonds de roulement (actif circulant − passif circulant), puis la trésorerie nette (fonds de roulement − BFR). Le BFR est négatif s'il est une ressource.",
      champs: (c) => {
        const b = bilanDuChapitre(c).b;
        return [
          { libelle: "Ressources stables", attendu: b.ressourcesStables, calcul: `${eur(b.capitauxPropres)} + ${eur(b.amortissementsCumules)} + ${eur(b.provision)} + ${eur(b.emprunt)} = ${eur(b.ressourcesStables)}` },
          { libelle: "Fonds de roulement net global", attendu: b.frng, calcul: `${eur(b.ressourcesStables)} − ${eur(b.emploisStables)} = ${eur(b.frng)}` },
          { libelle: "Besoin en fonds de roulement", attendu: b.bfr, calcul: `(${eur(b.stock)} + ${eur(b.creances)}) − (${eur(b.dettesFournisseurs)} + ${eur(b.dettesFiscalesEtSociales)}) = ${eur(b.bfr)}` },
          { libelle: "Trésorerie nette", attendu: b.tresorerieNette, calcul: `${eur(b.frng)} − (${eur(b.bfr)}) = ${eur(b.tresorerieNette)}, les disponibilités` },
        ];
      },
      explication: (c) => {
        const b = bilanDuChapitre(c).b;
        return [
          `Le fonds de roulement, ${eur(b.frng)}, est ce que les ressources stables laissent une fois les immobilisations financées. Le BFR est négatif, ${eur(b.bfr)} : les fournisseurs et l'État attendent plus que ce que le stock et les comités immobilisent. La trésorerie, ${eur(b.tresorerieNette)}, est le fonds de roulement plus ce BFR qui finance au lieu de coûter.`,
        ];
      },
    },
    {
      id: "predire-le-comptant",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le paiement comptant",
      notions: ["bfr", "payment_terms"],
      question: (c) => {
        const x = bilanDuChapitre(c);
        return `Avant de calculer, pariez. Les fins de série d'un tricoteur portugais sont ${pct(x.baisseDesFinsDeSerie, 0)} moins chères, mais se paient comptant, à l'enlèvement. Si la boutique y achetait son réassort de fin d'année, à achats égaux, son BFR…`;
      },
      options: (c) => {
        const x = bilanDuChapitre(c);
        const voir = "Faites varier le délai fournisseur à l'étape suivante : le curseur montre quand le BFR cesse d'être une ressource.";
        return [
          { texte: "Deviendrait un besoin", juste: x.comptant.bfr > 0, retour: `Bon pari. ${voir}` },
          { texte: "Resterait une ressource, un peu plus petite", juste: x.comptant.bfr < 0, retour: `Pari à vérifier. ${voir}` },
          { texte: "Ne changerait pas : le délai ne touche que la trésorerie", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-delai-qui-finance",
      objectifs: [2],
      type: "curseur",
      titre: "Le délai qui finance le stock",
      notions: ["bfr", "payment_terms"],
      question: (c) => {
        const x = bilanDuChapitre(c);
        const b = x.b;
        return `Faites varier le délai de paiement des achats de fin d'année, de ${qte(DELAI_DU_CURSEUR.min)} à ${qte(DELAI_DU_CURSEUR.max)} jours (à ${eur(auCentime(b.achatsParJour))} d'achats par jour). Une droite donne les dettes fournisseurs, l'autre ce que le stock et les comités immobilisent moins les dettes fiscales et sociales, ${eur(auCentime(b.actifCirculant - b.dettesFiscalesEtSociales))}. Placez le curseur sur le plus court délai où le BFR n'est plus un besoin, puis validez.`;
      },
      grandeur: () => ({ libelle: "Délai de paiement des achats", unite: "jours" }),
      cible: (c) => ({ attendu: bilanDuChapitre(c).b.delaiQuiAnnuleLeBfr, min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max }),
      zones: ["Le BFR est une ressource", "Le BFR est un besoin"],
      rates: () => ({
        dessous: "À ce délai, les fournisseurs ne financent pas encore tout le stock et les comités : montez.",
        dessus: "Le BFR est déjà une ressource avec un délai plus court : cherchez le plus court.",
      }),
      montrer: "Montrer le délai qui annule le BFR",
      lecture: (c, jours) => {
        const x = bilanDuChapitre(c);
        const l = bilanDeLaBoutique(x.f, { delaiFournisseur: jours });
        return [
          { libelle: "Dettes fournisseurs", montant: l.dettesFournisseurs },
          { libelle: "Besoin en fonds de roulement", montant: l.bfr },
          { libelle: "Trésorerie nette", montant: l.tresorerieNette, fort: true },
        ];
      },
      droites: (c) => {
        const b = bilanDuChapitre(c).b;
        return { produit: (jours) => b.achatsParJour * jours, cout: () => b.actifCirculant - b.dettesFiscalesEtSociales, libelles: ["Dettes fournisseurs", "Stock et comités, moins les dettes fiscales"] };
      },
      explication: (c) => {
        const x = bilanDuChapitre(c);
        return [
          `À partir de ${qte(x.b.delaiQuiAnnuleLeBfr)} jours de crédit fournisseur, le BFR n'est plus un besoin : le façonnier, à ${qte(x.delaiDuFaconnier)} jours, finance tout le stock et les comités, et un peu plus. Chaque jour de délai en moins coûte ${eur(auCentime(x.b.achatsParJour))} de trésorerie.`,
          "C'est le cycle d'exploitation d'un commerce : la boutique achète, stocke peu de temps, vend surtout comptant, et paie plus tard. L'étape suivante chiffre le paiement comptant.",
        ];
      },
    },
    {
      id: "le-bfr-au-comptant",
      objectifs: [2],
      type: "montants",
      titre: "Le réassort payé comptant",
      notions: ["bfr", "net_treasury"],
      question: (c) => {
        const x = bilanDuChapitre(c);
        return `Sans formule cette fois. La boutique paie son réassort de fin d'année comptant, chez ${nomDu(x.f, "fins-de-serie").toLowerCase()}, à achats égaux. Calculez ses dettes fournisseurs, son BFR, puis sa trésorerie nette au 31 décembre.`;
      },
      champs: (c) => {
        const x = bilanDuChapitre(c);
        const k = x.comptant;
        return [
          { libelle: "Dettes fournisseurs", attendu: k.dettesFournisseurs, calcul: `${eur(auCentime(k.achatsParJour))} × ${qte(k.delaiFournisseur)} jour = ${eur(k.dettesFournisseurs)}` },
          { libelle: "Besoin en fonds de roulement", attendu: k.bfr, calcul: `${eur(k.actifCirculant)} − ${eur(k.passifCirculant)} = ${eur(k.bfr)}` },
          { libelle: "Trésorerie nette", attendu: k.tresorerieNette, calcul: `${eur(k.frng)} − ${eur(k.bfr)} = ${eur(k.tresorerieNette)}` },
        ];
      },
      explication: (c) => {
        const x = bilanDuChapitre(c);
        return [
          `Payer comptant fait passer le BFR de ${eur(x.b.bfr)} à ${eur(x.comptant.bfr)} : la trésorerie perd ${eur(auCentime(x.b.tresorerieNette - x.comptant.tresorerieNette))}, sans que le fonds de roulement bouge. Les ${pct(x.baisseDesFinsDeSerie, 0)} de prix en moins doivent payer cette trésorerie immobilisée.`,
        ];
      },
    },
    {
      id: "les-ratios",
      objectifs: [3],
      type: "montants",
      titre: "Les ratios du bilan",
      notions: ["balance_sheet", "stock_rotation"],
      question: () =>
        "Calculez, au 31 décembre N − 1, l'autonomie financière (capitaux propres ÷ total du passif, en %) et la couverture des emplois stables (ressources stables ÷ emplois stables). Puis la liquidité générale (actif circulant et disponibilités ÷ dettes à court terme) et la durée de stockage (stock moyen ÷ coût d'achat des marchandises vendues × 360 jours). Les trois derniers au centième.",
      champs: (c) => {
        const b = bilanDuChapitre(c).b;
        return [
          { libelle: "Autonomie financière (%)", attendu: auDixieme(b.autonomieFinanciere * 100), tolerance: 0.1, calcul: `${eur(b.capitauxPropres)} ÷ ${eur(b.totalDuPassif)} × 100 = ${pct(b.autonomieFinanciere * 100)}` },
          { libelle: "Couverture des emplois stables", attendu: auCentieme(b.couvertureDesEmploisStables), calcul: `${eur(b.ressourcesStables)} ÷ ${eur(b.emploisStables)} = ${qte(auCentieme(b.couvertureDesEmploisStables))}` },
          { libelle: "Liquidité générale", attendu: auCentieme(b.liquiditeGenerale), calcul: `(${eur(b.actifCirculant)} + ${eur(b.tresorerieActive)}) ÷ ${eur(b.passifCirculant)} = ${qte(auCentieme(b.liquiditeGenerale))}` },
          {
            libelle: "Durée de stockage (jours)",
            attendu: auCentieme(b.dureeDeStockage),
            tolerance: 0.05,
            calcul: `(${eur(b.cr.stockInitial)} + ${eur(b.cr.stockFinal)}) ÷ 2 = ${eur(b.stockMoyen)} ; ${eur(b.stockMoyen)} ÷ ${eur(b.cr.coutDAchatDesVendues)} × 360 = ${qte(auCentieme(b.dureeDeStockage))} jours`,
          },
        ];
      },
      explication: (c) => {
        const x = bilanDuChapitre(c);
        const b = x.b;
        return [
          `Les capitaux propres financent ${pct(b.autonomieFinanciere * 100)} du bilan (on attend au moins un tiers) ; les ressources stables couvrent ${qte(auDixieme(b.couvertureDesEmploisStables))} fois les immobilisations (au moins une fois) ; l'actif à court terme paie ${qte(auDixieme(b.liquiditeGenerale))} fois les dettes à court terme. Un article reste ${qte(auDixieme(b.dureeDeStockage))} jours en stock en moyenne sur l'année, quand le façonnier attend ${qte(x.delaiDuFaconnier)} jours.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-dividende",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du dividende",
      notions: ["frng", "bfr", "net_treasury"],
      question: (c) => {
        const x = bilanDuChapitre(c);
        return `Les associés veulent se verser ${eur(DIVIDENDE_DEMANDE)} sur le résultat, et le gérant pense passer aux fins de série, payées comptant. Faites varier le dividende et le fournisseur des achats de fin d'année. Le tableau suit le fonds de roulement, le BFR et la trésorerie nette ; le graphique trace la trésorerie selon le dividende, face aux ${qte(MOIS_DE_CHARGES_A_GARDER)} mois de charges fixes à garder (${eur(x.aGarder)}). Puis relevez le défi.`;
      },
      leviers: (c) => {
        const f = ficheDuBilan(c);
        return [
          { code: "dividende", libelle: "Dividende versé", unite: "€", min: DIVIDENDE_DU_LABORATOIRE.min, max: DIVIDENDE_DU_LABORATOIRE.max, pas: DIVIDENDE_DU_LABORATOIRE.pas, depart: DEPART_DU_LABORATOIRE.dividende },
          {
            code: "delai",
            libelle: "Fournisseur des achats de fin d'année",
            unite: "",
            min: 0,
            max: delaiDu(f, "faconnier"),
            pas: 15,
            depart: DEPART_DU_LABORATOIRE.delai,
            choix: FOURNISSEURS_DU_LABORATOIRE.map((code) => ({ valeur: delaiDu(f, code), libelle: `${nomDu(f, code)}, à ${delaiDu(f, code)} jours` })),
          },
        ];
      },
      lecture: (c, p) => {
        const x = bilanDuChapitre(c);
        const l = bilanDeLaBoutique(x.f, { dividende: p.dividende!, delaiFournisseur: p.delai! });
        const d = bilanDeLaBoutique(x.f, { dividende: DEPART_DU_LABORATOIRE.dividende, delaiFournisseur: DEPART_DU_LABORATOIRE.delai });
        return [
          { libelle: "Capitaux propres", montant: l.capitauxPropres, reference: d.capitauxPropres },
          { libelle: "Fonds de roulement", montant: l.frng, reference: d.frng },
          { libelle: "Besoin en fonds de roulement", montant: l.bfr, reference: d.bfr },
          { libelle: "Trésorerie nette", montant: l.tresorerieNette, reference: d.tresorerieNette, fort: true },
          { libelle: "Trésorerie nette, moins celle à garder", montant: auCentime(l.tresorerieNette - x.aGarder), reference: auCentime(d.tresorerieNette - x.aGarder), effet: true },
          { libelle: "Autonomie financière", montant: auDixieme(l.autonomieFinanciere * 100), reference: auDixieme(d.autonomieFinanciere * 100), unite: "%" },
        ];
      },
      graphique: (c) => {
        const x = bilanDuChapitre(c);
        return {
          levier: "dividende",
          courbes: [
            { libelle: "Trésorerie nette", valeur: (p) => bilanDeLaBoutique(x.f, { dividende: p.dividende!, delaiFournisseur: p.delai! }).tresorerieNette },
            { libelle: "Trésorerie à garder", valeur: () => x.aGarder },
          ],
        };
      },
      defi: (c) => {
        const x = bilanDuChapitre(c);
        const tn = (p: Readonly<Record<string, number>>) => bilanDeLaBoutique(x.f, { dividende: p.dividende!, delaiFournisseur: p.delai! }).tresorerieNette;
        return {
          consigne: `Versez les ${eur(DIVIDENDE_DU_DEFI)} demandés en gardant au moins ${qte(MOIS_DE_CHARGES_A_GARDER)} mois de charges fixes de trésorerie nette (${eur(x.aGarder)}).`,
          atteint: (p) => p.dividende! >= DIVIDENDE_DU_DEFI && tn(p) >= x.aGarder,
          indice: (p) => {
            if (p.dividende! < DIVIDENDE_DU_DEFI) return `Les associés demandent ${eur(DIVIDENDE_DU_DEFI)} : montez le dividende, et cherchez ce qui garde la trésorerie.`;
            return `Avec ce fournisseur, la trésorerie tombe à ${eur(tn(p))}, sous les ${eur(x.aGarder)} à garder : un délai fournisseur plus long garde la trésorerie que le comptant immobilise.`;
          },
          solution: SOLUTION_DU_LABORATOIRE,
        };
      },
      montrer: "Montrer un dividende qui garde la trésorerie",
      explication: (c, p) => {
        const x = bilanDuChapitre(c);
        const l = bilanDeLaBoutique(x.f, { dividende: p.dividende!, delaiFournisseur: p.delai! });
        return [
          `Après ${eur(l.dividende)} de dividende, à ${qte(p.delai!)} jours de crédit fournisseur, le fonds de roulement tombe à ${eur(l.frng)} et la trésorerie nette à ${eur(l.tresorerieNette)}. Le dividende baisse le fonds de roulement ; le délai fournisseur fait le BFR : la trésorerie est la différence des deux.`,
          `Payé comptant, le réassort immobilise ${eur(auCentime(x.b.tresorerieNette - x.comptant.tresorerieNette))} de plus : avec tout le dividende, la trésorerie passerait sous ce qu'il faut garder.`,
        ];
      },
    },
    {
      id: "apres-le-dividende",
      objectifs: [1, 4],
      type: "montants",
      titre: "Le bilan après le dividende",
      notions: ["frng", "net_treasury", "balance_sheet"],
      question: () =>
        `Sans formule cette fois. Les associés se versent ${eur(DIVIDENDE_DEMANDE)} et la boutique garde le façonnier. Calculez les capitaux propres, le fonds de roulement, la trésorerie nette, puis l'autonomie financière (en %, au dixième).`,
      champs: (c) => {
        const x = bilanDuChapitre(c);
        const a = x.apres;
        return [
          { libelle: "Capitaux propres", attendu: a.capitauxPropres, calcul: `${eur(x.b.capitauxPropres)} − ${eur(DIVIDENDE_DEMANDE)} = ${eur(a.capitauxPropres)}` },
          { libelle: "Fonds de roulement net global", attendu: a.frng, calcul: `${eur(x.b.frng)} − ${eur(DIVIDENDE_DEMANDE)} = ${eur(a.frng)}` },
          { libelle: "Trésorerie nette", attendu: a.tresorerieNette, calcul: `${eur(a.frng)} − (${eur(a.bfr)}) = ${eur(a.tresorerieNette)}` },
          { libelle: "Autonomie financière (%)", attendu: auDixieme(a.autonomieFinanciere * 100), tolerance: 0.1, calcul: `${eur(a.capitauxPropres)} ÷ ${eur(a.totalDuPassif)} × 100 = ${pct(a.autonomieFinanciere * 100)}` },
        ];
      },
      explication: (c) => {
        const x = bilanDuChapitre(c);
        return [
          `Le dividende sort de la trésorerie et des capitaux propres du même montant : la boutique garde ${eur(x.apres.tresorerieNette)}, plus que les ${eur(x.aGarder)} voulus, et reste financée à ${pct(x.apres.autonomieFinanciere * 100)} par ses associés. Le bénéfice distribuable (le résultat et les réserves libres, ${eur(x.b.distribuable)}) borne ce que l'assemblée peut voter.`,
        ];
      },
    },
    {
      id: "la-provision-justifiee",
      objectifs: [1],
      type: "choix",
      titre: "Où ranger la provision ?",
      notions: ["frng", "bfr"],
      question: () => {
        return `Le litige du comité sera tranché dans quelques mois. Un collègue range donc la provision de ${eur(PROVISION_POUR_LITIGE)} dans le passif circulant d'exploitation, et non dans les ressources stables. Que devient la lecture du bilan ?`;
      },
      options: (c) => {
        const x = bilanDuChapitre(c);
        return [
          {
            texte: `Le fonds de roulement et le BFR baissent du même montant : la trésorerie ne change pas`,
            juste: true,
            retour: `Oui. Une provision justifiée, liée à l'exploitation et proche de son dénouement, peut se ranger avec les dettes d'exploitation : le fonds de roulement passe à ${eur(x.frngSansLaProvision)}, le BFR à ${eur(x.bfrAvecLaProvision)}. La trésorerie, elle, est la même : ce qui est en banque ne dépend pas du rangement.`,
          },
          { texte: "Le fonds de roulement baisse et la trésorerie aussi", juste: false, retour: "Non : la trésorerie se lit dans les disponibilités ; un reclassement au passif ne la change pas. Le BFR baisse d'autant que le fonds de roulement." },
          { texte: "Rien ne change : une provision n'est pas une dette", juste: false, retour: "Elle n'est pas encore une dette, mais elle en prépare une. Son rangement change le fonds de roulement et le BFR, pas la trésorerie." },
        ];
      },
    },
    {
      id: "le-decouvert",
      objectifs: [4],
      type: "choix",
      titre: "Et si le banquier prêtait la différence ?",
      notions: ["bfr", "net_treasury", "receivables_financing"],
      question: (c) => {
        const x = bilanDuChapitre(c);
        return `Le gérant veut le dividende de ${eur(DIVIDENDE_DEMANDE)} ET le réassort au comptant. La trésorerie tomberait à ${eur(x.apresAuComptant.tresorerieNette)}, sous les ${eur(x.aGarder)} à garder ; il compte demander un découvert autorisé pour la différence. Que lui dira le banquier ?`;
      },
      options: (c) => {
        const x = bilanDuChapitre(c);
        return [
          {
            texte: "Qu'un découvert finance un creux passager, pas un BFR qui dure toute l'année",
            juste: true,
            retour: `Oui. Le BFR de ${eur(x.comptant.bfr)} reviendrait à chaque réassort : c'est un besoin permanent, que le fonds de roulement doit couvrir. Le banquier accorde un découvert pour une pointe de saison, et le paie cher (${pct(BANQUE_DE_LA_BOUTIQUE.decouvert.taux * 100)} l'an) ; pour un besoin durable, il demande des ressources stables : moins de dividende, ou un emprunt.`,
          },
          { texte: "Qu'il l'accorde sans réserve : la boutique est rentable", juste: false, retour: "La rentabilité rassure, mais elle ne remplace pas l'équilibre : financer un besoin permanent par du court terme, c'est dépendre chaque mois du renouvellement du découvert." },
          { texte: "Que le BFR se finance par un emprunt à cinq ans, quoi qu'il arrive", juste: false, retour: "Un emprunt est une ressource stable possible, mais ici la boutique a de quoi : il suffit de verser un peu moins, ou de garder le crédit fournisseur." },
        ];
      },
    },
    {
      id: "decider",
      objectifs: [4],
      type: "choix",
      titre: "Que proposer aux associés ?",
      notions: ["frng", "bfr", "net_treasury"],
      question: () => "Le gérant doit faire une proposition à l'assemblée des associés. Laquelle retenez-vous ?",
      options: (c) => {
        const x = bilanDuChapitre(c);
        return [
          {
            texte: `Verser ${eur(DIVIDENDE_DEMANDE)} et garder le façonnier à ${qte(x.delaiDuFaconnier)} jours`,
            juste: true,
            retour: `Oui. La trésorerie reste à ${eur(x.apres.tresorerieNette)}, au-dessus des ${eur(x.aGarder)} à garder, et le crédit du façonnier continue de financer le stock et les comités. Les fins de série ne se justifieraient que si leur prix plus bas payait la trésorerie qu'elles immobilisent.`,
          },
          { texte: "Verser le dividende et passer aux fins de série", juste: false, retour: `Non : la trésorerie tomberait à ${eur(x.apresAuComptant.tresorerieNette)}, sous ce qu'il faut garder, et le BFR deviendrait un besoin permanent.` },
          { texte: "Ne rien verser : garder la trésorerie pour la rénovation", juste: false, retour: `La rénovation coûte une petite part de ${eur(x.b.tresorerieNette)} : garder tout le résultat laisserait dormir l'argent des associés sans projet qui l'emploie.` },
          { texte: "Verser le dividende, passer aux fins de série et prendre un découvert", juste: false, retour: `Non : le BFR au comptant, ${eur(x.comptant.bfr)}, revient à chaque réassort ; un découvert le financerait toute l'année, au taux le plus cher. Un besoin qui dure se couvre par le fonds de roulement.` },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["balance_sheet", "frng", "bfr", "net_treasury"],
      tableau: tableauDuBilanFonctionnel,
      texte: (c) => {
        const x = bilanDuChapitre(c);
        return [
          "Le bilan dit ce que la boutique possède et ce qui le finance. L'amortissement constate l'usure d'une immobilisation, la provision une perte probable. Le bilan fonctionnel les range par cycle : le fonds de roulement est ce que les ressources stables laissent après les immobilisations ; le BFR, ce que le cycle d'exploitation immobilise ; la trésorerie nette, leur différence.",
          `Payée comptant et payant ses façonniers à ${qte(x.delaiDuFaconnier)} jours, la boutique a un BFR négatif, ${eur(x.b.bfr)} : ses fournisseurs la financent. Chaque jour de délai en moins coûte ${eur(auCentime(x.b.achatsParJour))} de trésorerie. Un dividende baisse le fonds de roulement ; un découvert finance une pointe, pas un besoin permanent.`,
          "Au niveau de l'examen, vous savez lire un bilan et en tirer le bilan fonctionnel condensé, le fonds de roulement, le BFR et la trésorerie nette. Vous savez mesurer l'effet d'un délai, calculer les ratios du bilan et juger l'équilibre avant de distribuer ou d'emprunter.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "FRNG = ressources stables − emplois stables. BFR = (stock + créances) − (dettes fournisseurs + dettes fiscales et sociales). Trésorerie nette = FRNG − BFR = disponibilités − découverts.",
    },
  ],
};

