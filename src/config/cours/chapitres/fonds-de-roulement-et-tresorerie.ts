import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, bilanDuLycee, exerciceDe, type BilanDuLycee } from "../monde/comptes-du-lycee";
import { DELAI_CONVENU_DE_CAMPUSTECH } from "../monde/nova-gestion";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : FONDS DE ROULEMENT, BESOIN EN FONDS DE ROULEMENT ET TRÉSORERIE (Bac STMG, gestion
 * et finance, palier 1).
 *
 * Le bilan lu comme une histoire d'argent : les ressources durables (capitaux propres, provision et
 * emprunt) paient d'abord l'équipement ; ce qui reste, le fonds de roulement, finance le cycle de
 * tous les jours, qui immobilise de l'argent chez les clients et dans les stocks (le besoin en fonds
 * de roulement). La différence est la trésorerie. Le chapitre calcule les trois, vérifie qu'ils se
 * tiennent, puis fait l'expérience : un curseur sur un équipement payé comptant (jusqu'où le fonds
 * de roulement couvre-t-il le besoin ?) et un laboratoire des délais (CampusTech, qui paie en retard,
 * et le fournisseur de composants : le défi, gagner 20 000 € de trésorerie sans rien vendre de plus).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le bilan du 31 décembre du premier exercice de NOVA,
 * rangé en postes du lycée (monde/comptes-du-lycee.ts, `bilanDuLycee`), en valeurs nettes ; les
 * délais du laboratoire rejouent la clôture (monde/cloture.ts). La trésorerie est exactement celle
 * du chapitre « Bilan fonctionnel et BFR ».
 */

/** Les bornes du curseur de l'équipement payé comptant, en euros. */
export const EQUIPEMENT_DU_CURSEUR = { min: 0, max: 300_000 } as const;

/** Les leviers du laboratoire : le jour où CampusTech paie, et le délai du fournisseur, en jours. */
export const LEVIERS_DES_DELAIS = {
  campustech: { min: 30, max: 120, pas: 10 },
  fournisseur: { min: 0, max: 60, pas: 1 },
} as const;

/** Le défi du laboratoire : au moins 20 000 € de trésorerie de plus au 31 décembre. */
export const GAIN_DU_DEFI = 20_000;

/** La solution que montre la correction : CampusTech qui paie à l'échéance convenue, le fournisseur au délai de la fiche. */
export const SOLUTION_DES_DELAIS = { campustech: DELAI_CONVENU_DE_CAMPUSTECH, fournisseur: exerciceDe("nova").fournisseur.delai } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Un montant retranché, sans « − − » : « − 12 000 € » ou « + 582,38 € ». */
const moins = (x: number) => (x < 0 ? `+ ${eur(-x)}` : `− ${eur(x)}`);

/** Le fonds de roulement, le besoin en fonds de roulement et la trésorerie du 31 décembre. */
export function fondsDeRoulement(c: Pick<Cas, "code">) {
  return bilanDuLycee(exerciceDe(c.code));
}

/** L'équipement le plus cher que le fonds de roulement peut payer comptant sans que la trésorerie passe sous zéro. */
export const equipementPossible = (k: BilanDuLycee) => Math.floor(k.fondsDeRoulement - k.besoin + 1e-9);

/** Une facture mensuelle de CampusTech, toutes taxes comprises : ce qu'un mois de retard laisse chez le client. */
export const factureDeCampusTech = (k: BilanDuLycee) => auCentime(k.f.campustech.enceintesParFacture * k.f.prixDeLEnceinte * (1 + k.f.tauxDeTva));

/** Une position du laboratoire : les deux délais. */
export const delaisDuLaboratoire = (k: BilanDuLycee, p: Readonly<Record<string, number>>) => bilanDuLycee(k.f, { delaiCampusTech: p.campustech!, delaiFournisseur: p.fournisseur! });

export const FONDS_DE_ROULEMENT: Chapitre = {
  code: "fonds-de-roulement-et-tresorerie",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 4 · Temps et risque",
    "STMG Thème 2 · Analyser la situation de l'entreprise",
    "STMG Thème 3 · Accompagner la prise de décision",
    "Bac pro AGORA Bloc 2 · Organiser et suivre l'activité de production (de biens ou de services)",
  ],
  titre: "Fonds de roulement, besoin en fonds de roulement et trésorerie",
  accroche:
    "Les ressources durables paient l'équipement ; ce qui reste finance le quotidien, qui immobilise de l'argent chez les clients et dans les stocks. La différence, c'est la trésorerie.",
  objectifs: [
    "Calculer le fonds de roulement",
    "Calculer le besoin en fonds de roulement",
    "Calculer la trésorerie et vérifier l'équilibre fonds de roulement, besoin, trésorerie",
    "Expliquer ce qui fait monter ou baisser la trésorerie, dont les délais de paiement",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le fonds de roulement se lit ici sur le bilan du premier exercice de NOVA dans la simulation du cours, celui du chapitre « Le bilan » ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le bilan, une histoire d'argent",
      notions: ["frng", "bfr", "net_treasury"],
      texte: (c) => {
        const k = fondsDeRoulement(c);
        return [
          `Le bilan ${dE(k.entreprise)} se lit aussi comme une histoire d'argent. Les ressources durables, celles qui restent dans l'entreprise des années (ce que les associés ont laissé, les amortissements et dépréciations mis de côté, la provision pour un litige, l'emprunt), paient d'abord ce qui dure : la ligne de montage, à son prix d'achat. Ce qui reste, c'est le fonds de roulement.`,
          "Ces grandeurs sont celles du bilan fonctionnel que l'on étudie après le bac : l'équipement s'y compte à sa valeur d'origine, et son usure, comme la dépréciation d'une créance, avec les ressources ; les créances sur les clients s'y comptent avant dépréciation.",
          "Le quotidien, lui, immobilise de l'argent : les clients qui n'ont pas encore payé, les composants en stock, la TVA que l'État doit rendre. Les fournisseurs, l'État et le personnel, qui n'ont pas encore été payés, en financent une partie. Ce qui reste à financer, c'est le besoin en fonds de roulement. Et ce que le fonds de roulement laisse une fois ce besoin financé, c'est la trésorerie, positive ou négative.",
        ];
      },
      tableau: (c) => {
        const k = fondsDeRoulement(c);
        return {
          titre: `Le bilan ${dE(k.entreprise)} au 31 décembre`,
          colonnes: ["Montant"],
          lignes: [
            ...k.postes.filter((x) => x.montant !== 0 || x.code === "decouvert").map((x) => ({ libelle: x.libelle, valeurs: [eur(x.montant)] })),
            { libelle: "Équipement à sa valeur d'origine", valeurs: [eur(k.equipementBrut)] },
            { libelle: "Amortissements et dépréciations (usure de la ligne, créance de Sonora)", valeurs: [eur(k.amortissementsEtDepreciations)] },
            { libelle: "Créances sur les clients avant dépréciation", valeurs: [eur(k.clientsBruts)] },
          ],
        };
      },
      repere: () => "Fonds de roulement − besoin en fonds de roulement = trésorerie.",
    },
    {
      id: "frng",
      objectifs: [0],
      type: "montants",
      titre: "Le fonds de roulement",
      notions: ["frng"],
      question: () => "Calculez les ressources durables (capitaux propres + amortissements et dépréciations + provision + emprunt), puis le fonds de roulement : ce qui reste une fois l'équipement payé, à sa valeur d'origine.",
      champs: (c) => {
        const k = fondsDeRoulement(c);
        return [
          { libelle: "Ressources durables", attendu: k.ressourcesDurables, calcul: `${eur(k.capitauxPropres)} + ${eur(k.amortissementsEtDepreciations)} + ${eur(k.poste("provision"))} + ${eur(k.poste("emprunt"))} = ${eur(k.ressourcesDurables)}`, tolerance: 1 },
          { libelle: "Fonds de roulement", attendu: k.fondsDeRoulement, calcul: `${eur(k.ressourcesDurables)} − ${eur(k.equipementBrut)} = ${eur(k.fondsDeRoulement)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = fondsDeRoulement(c);
        return [
          k.fondsDeRoulement >= 0
            ? `Une fois sa ligne payée, ${k.entreprise} garde ${eur(k.fondsDeRoulement)} de ressources durables pour financer son quotidien : l'apport des associés, l'emprunt et le bénéfice de l'année laissé dans l'entreprise dépassent de loin ce que coûte la ligne.`
            : `Les ressources durables ne paient même pas tout l'équipement : il manque ${eur(-k.fondsDeRoulement)}, que le quotidien doit financer. C'est une situation fragile.`,
        ];
      },
    },
    {
      id: "bfr",
      objectifs: [1],
      type: "montants",
      titre: "Le besoin en fonds de roulement",
      notions: ["bfr"],
      question: () =>
        "Calculez ce que le cycle immobilise (stock, créances sur les clients avant dépréciation, autres créances), ce que financent les dettes du cycle (fournisseurs, État et personnel, autres dettes de l'année), puis le besoin en fonds de roulement.",
      champs: (c) => {
        const k = fondsDeRoulement(c);
        return [
          { libelle: "Ce que le cycle immobilise", attendu: k.besoinsDuCycle, calcul: `${eur(k.poste("stocks"))} + ${eur(k.clientsBruts)} + ${eur(k.poste("autresCreances"))} = ${eur(k.besoinsDuCycle)}`, tolerance: 1 },
          { libelle: "Dettes du cycle", attendu: k.dettesDuCycle, calcul: `${eur(k.poste("fournisseurs"))} + ${eur(k.poste("etat"))} + ${eur(k.poste("autresDettes"))} = ${eur(k.dettesDuCycle)}`, tolerance: 1 },
          { libelle: "Besoin en fonds de roulement", attendu: k.besoin, calcul: `${eur(k.besoinsDuCycle)} − ${eur(k.dettesDuCycle)} = ${eur(k.besoin)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = fondsDeRoulement(c);
        return [
          k.besoin >= 0
            ? `Le quotidien ${dE(k.entreprise)} immobilise ${eur(k.besoin)} : de l'argent qui attend chez les clients et dans le stock, une fois déduit ce que les fournisseurs, l'État et le personnel avancent.`
            : `Le besoin est négatif, ${eur(k.besoin)} : les fournisseurs, l'État et le personnel financent un peu plus que ce qui attend chez les clients et dans le stock. Les particuliers paient ${k.entreprise} à la commande ; c'est CampusTech, qui paie en retard, et le stock qui créent l'essentiel du besoin.`,
        ];
      },
    },
    {
      id: "tresorerie",
      objectifs: [2],
      type: "montants",
      titre: "La trésorerie",
      notions: ["net_treasury"],
      question: () =>
        "Calculez la trésorerie par le bilan (banque et compte à terme, moins le découvert), puis vérifiez-la par la différence entre le fonds de roulement et le besoin en fonds de roulement.",
      champs: (c) => {
        const k = fondsDeRoulement(c);
        return [
          { libelle: "Trésorerie (disponible − découvert)", attendu: k.tresorerie, calcul: `${eur(k.disponible)} − ${eur(k.decouvert)} = ${eur(k.tresorerie)}`, tolerance: 1 },
          { libelle: "Fonds de roulement − besoin", attendu: auCentime(k.fondsDeRoulement - k.besoin), calcul: `${eur(k.fondsDeRoulement)} ${moins(k.besoin)} = ${eur(auCentime(k.fondsDeRoulement - k.besoin))}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = fondsDeRoulement(c);
        return [
          `Les deux calculs donnent ${eur(k.tresorerie)} : la trésorerie est ce que le fonds de roulement laisse une fois le besoin du quotidien financé. ${k.tresorerie >= 0 ? "Le fonds de roulement couvre le besoin, et il reste de l'argent en banque et placé." : "Le fonds de roulement ne couvre pas le besoin : la banque avance la différence, par le découvert."}`,
        ];
      },
    },
    {
      id: "clients",
      objectifs: [3],
      type: "choix",
      titre: "Si les clients payaient plus vite",
      notions: ["bfr", "net_treasury", "payment_terms"],
      question: (c) => {
        const k = fondsDeRoulement(c);
        return `Au 31 décembre, les clients ${dE(k.entreprise)} lui doivent ${eur(k.poste("clients"))}. S'ils payaient plus vite, que deviendrait sa trésorerie, toutes choses égales par ailleurs ?`;
      },
      options: (c) => {
        const k = fondsDeRoulement(c);
        return [
          {
            texte: "Elle monterait : le besoin en fonds de roulement baisserait",
            juste: true,
            retour: `Oui : chaque euro encaissé plus tôt sort des créances et entre en banque. Le besoin en fonds de roulement baisse d'autant, et la trésorerie monte, sans que le fonds de roulement ait bougé. Ici, les créances pèsent ${eur(k.poste("clients"))} sur les ${eur(k.besoinsDuCycle)} que le cycle immobilise : le laboratoire va le mesurer.`,
          },
          {
            texte: "Elle ne bougerait pas : le résultat ne change pas",
            juste: false,
            retour: "Non : le résultat ne change pas, c'est vrai, mais l'argent arrive plus tôt. La trésorerie ne dépend pas que du résultat : elle dépend aussi du moment où l'on encaisse et où l'on paie.",
          },
          {
            texte: "Elle baisserait : le fonds de roulement baisserait",
            juste: false,
            retour: "Non : le fonds de roulement dépend des capitaux propres, de l'emprunt et de l'équipement ; les délais des clients n'y touchent pas. Ils jouent sur le besoin en fonds de roulement.",
          },
        ];
      },
    },
    {
      id: "un-equipement-paye-comptant",
      objectifs: [0, 3],
      type: "curseur",
      titre: "Un équipement payé comptant",
      notions: ["frng", "net_treasury"],
      question: (c) => {
        const k = fondsDeRoulement(c);
        return `${k.entreprise} envisage un nouvel équipement, payé comptant avec son propre argent. Faites varier son prix : une droite donne le fonds de roulement, qui baisse d'autant, l'autre le besoin en fonds de roulement, qui ne bouge pas. Placez le curseur sur le prix le plus haut que ${k.entreprise} peut payer sans que sa trésorerie passe sous zéro, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix de l'équipement", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: equipementPossible(fondsDeRoulement(c)), min: EQUIPEMENT_DU_CURSEUR.min, max: EQUIPEMENT_DU_CURSEUR.max }),
      zones: ["Le fonds de roulement couvre le besoin", "La trésorerie est négative"],
      rates: () => ({
        dessous: "À ce prix, il reste encore de la trésorerie : l'équipement pourrait coûter plus.",
        dessus: "À ce prix, le fonds de roulement ne couvre plus le besoin : la trésorerie est négative.",
      }),
      montrer: "Montrer le prix",
      lecture: (c, q) => {
        const k = fondsDeRoulement(c);
        const x = bilanDuLycee(k.f, { equipement: q });
        return [
          { libelle: "Fonds de roulement", montant: x.fondsDeRoulement },
          { libelle: "Besoin en fonds de roulement", montant: x.besoin },
          { libelle: "Trésorerie", montant: x.tresorerie, fort: true },
        ];
      },
      droites: (c) => {
        const k = fondsDeRoulement(c);
        return { produit: (q) => k.fondsDeRoulement - q, cout: () => k.besoin, libelles: ["Fonds de roulement", "Besoin en fonds de roulement"] };
      },
      explication: (c) => {
        const k = fondsDeRoulement(c);
        return [
          `Jusqu'à ${eur(equipementPossible(k))}, le fonds de roulement couvre encore le besoin : c'est la trésorerie d'aujourd'hui, ${eur(k.tresorerie)}. Au-delà, il faudrait un découvert.`,
          "Payer un équipement avec son propre argent consomme le fonds de roulement euro pour euro. C'est pourquoi un équipement qui dure se finance d'ordinaire par des ressources qui durent : un emprunt, un apport, des bénéfices gardés.",
        ];
      },
    },
    {
      id: "le-laboratoire-des-delais",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des délais",
      notions: ["bfr", "net_treasury", "payment_terms"],
      question: (c) => {
        const k = fondsDeRoulement(c);
        const f = k.f;
        return `CampusTech, le client professionnel ${dE(k.entreprise)}, est facturée le ${f.campustech.jourDeFacturation} de chaque mois ; elle devrait payer ${DELAI_CONVENU_DE_CAMPUSTECH} jours après sa facture, mais paie en retard, ${f.campustech.delai} jours après. Le fournisseur de composants est payé ${f.fournisseur.delai} jours après sa facture. Faites varier les deux délais : le bilan du 31 décembre se refait, le résultat ne bouge pas. Relevez le défi.`;
      },
      leviers: (c) => {
        const k = fondsDeRoulement(c);
        return [
          { code: "campustech", libelle: "Jour où CampusTech paie, après sa facture (au-delà de l'échéance convenue, en retard)", unite: "jours", ...LEVIERS_DES_DELAIS.campustech, depart: k.f.campustech.delai },
          { code: "fournisseur", libelle: "Délai du fournisseur de composants", unite: "jours", ...LEVIERS_DES_DELAIS.fournisseur, depart: k.f.fournisseur.delai },
        ];
      },
      lecture: (c, p) => {
        const k = fondsDeRoulement(c);
        const x = delaisDuLaboratoire(k, p);
        return [
          { libelle: "Créances sur les clients", montant: x.poste("clients"), reference: k.poste("clients") },
          { libelle: "Dettes envers les fournisseurs", montant: x.poste("fournisseurs"), reference: k.poste("fournisseurs") },
          { libelle: "Fonds de roulement", montant: x.fondsDeRoulement, reference: k.fondsDeRoulement },
          { libelle: "Besoin en fonds de roulement", montant: x.besoin, reference: k.besoin },
          { libelle: "Trésorerie", montant: x.tresorerie, reference: k.tresorerie, fort: true },
          { libelle: "Trésorerie gagnée", montant: auCentime(x.tresorerie - k.tresorerie), effet: true },
        ];
      },
      graphique: (c) => {
        const k = fondsDeRoulement(c);
        return {
          levier: "campustech",
          courbes: [
            { libelle: "Besoin en fonds de roulement", valeur: (p) => delaisDuLaboratoire(k, p).besoin },
            { libelle: "Trésorerie", valeur: (p) => delaisDuLaboratoire(k, p).tresorerie },
          ],
        };
      },
      defi: (c) => {
        const k = fondsDeRoulement(c);
        return {
          consigne: `Gagnez au moins ${eur(GAIN_DU_DEFI)} de trésorerie au 31 décembre, sans vendre une enceinte de plus.`,
          atteint: (p) => delaisDuLaboratoire(k, p).tresorerie - k.tresorerie >= GAIN_DU_DEFI,
          indice: (p) => {
            const x = delaisDuLaboratoire(k, p);
            return `La trésorerie a bougé de ${eur(auCentime(x.tresorerie - k.tresorerie))}. Le fonds de roulement ne bouge pas : cherchez ce qui fait baisser le besoin, de l'argent qui arrive plus tôt ou qui part plus tard.`;
          },
          solution: SOLUTION_DES_DELAIS,
        };
      },
      explication: (c, p) => {
        const k = fondsDeRoulement(c);
        const x = delaisDuLaboratoire(k, p);
        return [
          `Défi relevé : la trésorerie passe de ${eur(k.tresorerie)} à ${eur(x.tresorerie)}, ${eur(auCentime(x.tresorerie - k.tresorerie))} de plus, et le fonds de roulement n'a pas bougé (${eur(x.fondsDeRoulement)}). Tout est passé par le besoin, de ${eur(k.besoin)} à ${eur(x.besoin)}.`,
          `Si CampusTech payait à l'échéance convenue, ${DELAI_CONVENU_DE_CAMPUSTECH} jours, au lieu de ${k.f.campustech.delai} jours avec son retard, une facture de moins attendrait au 31 décembre. Un client en retard ne coûte rien au résultat, mais il immobilise la trésorerie : c'est pourquoi l'entreprise le relance. Payer le fournisseur plus tard fait le même effet, dans la limite de ${DELAI_CONVENU_DE_CAMPUSTECH} jours que fixe la loi.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["frng", "bfr", "net_treasury"],
      texte: (c) => {
        const k = fondsDeRoulement(c);
        return [
          `Au 31 décembre, ${k.entreprise} a un fonds de roulement de ${eur(k.fondsDeRoulement)}, un besoin en fonds de roulement de ${eur(k.besoin)}, et donc une trésorerie de ${eur(k.tresorerie)}.`,
          `Pour améliorer sa trésorerie, une entreprise a deux leviers : augmenter son fonds de roulement (un apport des associés, un emprunt, des bénéfices laissés dans l'entreprise), ou réduire son besoin (des clients qui paient à l'heure, moins de stock, des fournisseurs payés plus tard). Ici, une seule facture de CampusTech payée en retard immobilise ${eur(factureDeCampusTech(k))}. Dans l'arène, les chiffres de votre entreprise seront différents : la méthode sera la même.`,
        ];
      },
      repere: () => "Fonds de roulement = ressources durables − équipement. Besoin en fonds de roulement = stocks + créances − dettes du cycle. Trésorerie = fonds de roulement − besoin.",
    },
  ],
};
