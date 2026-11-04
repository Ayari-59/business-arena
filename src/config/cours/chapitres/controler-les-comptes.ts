import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { auCentime, rangDuJour } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, exerciceDe } from "../monde/comptes-du-lycee";
import {
  CARTES_DU_31_DECEMBRE,
  OUBLIS_DE_DECEMBRE,
  compteDeCampusTech,
  dateDuRang,
  dateEcrite,
  lettrage,
  deMois,
  nomDuMois,
  rapprochementChoisi,
  rapprochementDeDecembre,
  type MouvementDeTiers,
} from "../monde/systeme-d-information-comptable";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : CONTRÔLER LES COMPTES, LE LETTRAGE ET LE RAPPROCHEMENT BANCAIRE (Bac STMG, gestion et
 * finance, palier 1 ; programme de terminale, thème 1, question 1.2 : les contrôles).
 *
 * Fin décembre, le comptable de NOVA contrôle deux comptes avant la balance. Il lettre le compte de
 * CampusTech : la facture de septembre semble impayée. Avant de relancer le client, il pointe le
 * compte bancaire de NOVA et le relevé de la banque, opération par opération, et dresse l'état de
 * rapprochement : la banque a reçu le virement de CampusTech et prélevé le loyer, deux opérations
 * qu'il n'avait pas saisies ; la banque, elle, n'a pas encore les paiements par carte du 31 décembre.
 * Il passe les deux écritures, le compte de CampusTech se lettre à nouveau. Puis l'expérience : un
 * curseur (le plus gros virement possible le 31 décembre, sans découvert : le relevé, pas le compte)
 * et un laboratoire du rapprochement (corriger chaque côté de ce qui lui manque, et seulement de cela).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le premier exercice de NOVA. Les factures, les règlements
 * et la banque sont ceux de la fiche ; les deux oublis et les cartes du 31 décembre sont des
 * hypothèses nommées de monde/systeme-d-information-comptable.ts. Une fois rapproché, le compte
 * bancaire est celui de la balance avant inventaire, au centime : une seule NOVA.
 */

/** L'extrait du compte de CampusTech que l'élève lettre : les factures à partir de ce mois, et leurs règlements. */
export const PREMIERE_FACTURE_DE_L_EXTRAIT = 7;

/** Les bornes du curseur du virement du 31 décembre, en euros. */
export const VIREMENT_DU_CURSEUR = { min: 0, max: 130_000 } as const;

/** Les leviers du laboratoire, dans l'ordre : chacun vaut 0 (non) ou 1 (oui). */
export const LEVIERS_DU_RAPPROCHEMENT = ["loyer", "campustech", "cartes", "facture"] as const;

/** La solution : les deux oublis saisis, les cartes ajoutées au relevé, la facture laissée de côté. */
export const SOLUTION_DU_RAPPROCHEMENT = { loyer: 1, campustech: 1, cartes: 1, facture: 0 } as const;

/** Le délai de paiement convenu avec CampusTech, en jours : au-delà, la facture est échue. */
export const DELAI_CONVENU = 60;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const signe = (x: number) => (x < 0 ? eur(x) : `+ ${eur(x)}`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

const libelleDeLigne = (l: MouvementDeTiers) =>
  l.nature === "facture" ? `Facture du ${dateEcrite(l.date)}` : `Règlement du ${dateEcrite(l.date)} (facture ${deMois(l.facture)})`;

/** Les comptes, le rapprochement, et ce que le comptable voit avant de le faire. */
export function controleDesComptes(c: Pick<Cas, "code">) {
  const f = exerciceDe(c.code);
  const r = rapprochementDeDecembre(f);
  const compte = compteDeCampusTech(f);
  // Le compte tel que le comptable le tient avant le rapprochement : sans le virement du 10 décembre.
  const oublie = (l: MouvementDeTiers) => l.nature === "reglement" && l.facture === r.factureReglee;
  const avant = compte.filter((l) => !oublie(l));
  const extrait = avant.filter((l) => l.facture >= PREMIERE_FACTURE_DE_L_EXTRAIT);
  const factureOubliee = compte.find((l) => l.nature === "facture" && l.facture === r.factureReglee)!;
  return {
    f,
    entreprise: f.entreprise,
    client: f.campustech.nom,
    fournisseur: f.fournisseur.nom,
    r,
    extrait,
    lettrageAvant: lettrage(extrait),
    lettrageApres: lettrage(compte),
    moisDeLaFactureReglee: nomDuMois(r.factureReglee),
    /** « de septembre » : le mois de la facture, après « de ». */
    deLaFactureReglee: deMois(r.factureReglee),
    /** L'échéance convenue de la facture que le virement oublié paie. */
    echeanceDeLaFacture: dateDuRang(rangDuJour(factureOubliee.date) + DELAI_CONVENU),
    /** Le plus gros virement possible le 31 décembre sans découvert : ce que porte le relevé. */
    virementPossible: Math.floor(r.releve + 1e-9),
  };
}

export type ControleDesComptes = ReturnType<typeof controleDesComptes>;

/** Une position du laboratoire : les deux soldes corrigés, et l'écart qui reste. */
export const rapprochementDuLaboratoire = (k: ControleDesComptes, p: Readonly<Record<string, number>>) =>
  rapprochementChoisi(k.r, { loyer: p.loyer!, campustech: p.campustech!, cartes: p.cartes!, facture: p.facture! });

/** Les opérations de décembre que l'élève pointe : où chacune se trouve. */
export function operationsDeDecembre(k: ControleDesComptes) {
  const r = k.r;
  return [
    { code: "fournisseur", libelle: `Virement à ${k.fournisseur}, 1er décembre`, montant: -r.fournisseur, cote: "deux" },
    { code: "loyer", libelle: `Prélèvement du loyer, ${dateEcrite(OUBLIS_DE_DECEMBRE.loyer)}`, montant: -r.loyer, cote: "releve" },
    { code: "campustech", libelle: `Virement de ${k.client}, ${dateEcrite(OUBLIS_DE_DECEMBRE.campustech)}`, montant: r.virement, cote: "releve" },
    { code: "organismes", libelle: "Cotisations sociales et impôt à la source, 15 décembre", montant: -r.organismes, cote: "deux" },
    { code: "cartes", libelle: "Paiements par carte du 31 décembre", montant: r.cartes, cote: "compte" },
  ] as const;
}

const POURQUOI_DU_POINTAGE: Readonly<Record<string, string>> = {
  fournisseur: "Ordonné par NOVA et exécuté par la banque le même jour : il est des deux côtés, il se pointe.",
  loyer: "La banque a prélevé le loyer ; l'avis n'est arrivé qu'avec le relevé, et le comptable ne l'a pas encore saisi.",
  campustech: "La banque a reçu l'argent du client ; le comptable ne l'a pas vu passer.",
  organismes: "Payées le 15, enregistrées le 15 des deux côtés : elles se pointent.",
  cartes: "NOVA a enregistré ses ventes du jour ; la banque ne les créditera que le 2 janvier.",
};

/** Le compte 512 de NOVA et le relevé, en décembre, côte à côte. */
function tableauDuPointage(k: ControleDesComptes): TableauDeDonnees {
  const r = k.r;
  return {
    titre: `Décembre : le compte 512 ${dE(k.entreprise)} et le relevé de la banque`,
    colonnes: ["Compte 512", "Relevé"],
    lignes: [
      ...operationsDeDecembre(k).map((o) => ({ libelle: o.libelle, valeurs: [o.cote === "releve" ? "" : signe(o.montant), o.cote === "compte" ? "" : signe(o.montant)] })),
      { libelle: "Solde au 31 décembre", valeurs: [eur(r.compteAvant), eur(r.releve)] },
    ],
  };
}

/** L'extrait du compte de CampusTech, avant le rapprochement. */
function tableauDuCompteClient(k: ControleDesComptes): TableauDeDonnees {
  return {
    titre: `Le compte 411 ${k.client} : les factures depuis ${nomDuMois(PREMIERE_FACTURE_DE_L_EXTRAIT)} et leurs règlements`,
    colonnes: ["Débit", "Crédit"],
    lignes: k.extrait.map((l) => ({ libelle: libelleDeLigne(l), valeurs: l.nature === "facture" ? [eur(l.montant), ""] : ["", eur(l.montant)] })),
  };
}

/** L'état de rapprochement au 31 décembre. */
function etatDeRapprochement(k: ControleDesComptes): TableauACompleter {
  const r = k.r;
  return {
    titre: "L'état de rapprochement au 31 décembre",
    colonnes: ["Compte 512", "Relevé"],
    lignes: [
      { libelle: "Solde au 31 décembre", cellules: [{ valeur: r.compteAvant }, { valeur: r.releve }] },
      {
        libelle: `Virement de ${k.client}, absent du compte de NOVA`,
        cellules: [{ valeur: r.virement, saisir: true, calcul: `+ ${eur(r.virement)}, l'argent reçu`, indice: "un encaissement fait monter le compte" }, { valeur: null }],
      },
      {
        libelle: "Prélèvement du loyer, absent du compte de NOVA",
        cellules: [{ valeur: -r.loyer, saisir: true, calcul: `− ${eur(r.loyer)}, l'argent sorti`, indice: "un prélèvement fait baisser le compte : le montant est négatif" }, { valeur: null }],
      },
      {
        libelle: "Cartes du 31 décembre, absentes du relevé",
        cellules: [{ valeur: null }, { valeur: r.cartes, saisir: true, calcul: `+ ${eur(r.cartes)}, que la banque créditera`, indice: "des encaissements que la banque n'a pas encore portés" }],
      },
      {
        libelle: "Solde rapproché",
        fort: true,
        totalDe: { plus: [0, 1, 2, 3] },
        cellules: [
          { valeur: r.compteRapproche, saisir: true, calcul: `${eur(r.compteAvant)} + ${eur(r.virement)} − ${eur(r.loyer)} = ${eur(r.compteRapproche)}`, indice: "le solde du compte et ses corrections" },
          { valeur: r.releveRapproche, saisir: true, calcul: `${eur(r.releve)} + ${eur(r.cartes)} = ${eur(r.releveRapproche)}`, indice: "le solde du relevé et sa correction" },
        ],
      },
    ],
  };
}

const CHOIX_DES_LEVIERS: Readonly<Record<(typeof LEVIERS_DU_RAPPROCHEMENT)[number], { libelle: string; non: string; oui: string }>> = {
  loyer: { libelle: "Prélèvement du loyer du 5 décembre", non: "pas saisi", oui: "saisi au compte de NOVA" },
  campustech: { libelle: "Virement de CampusTech du 10 décembre", non: "pas saisi", oui: "saisi au compte de NOVA" },
  cartes: { libelle: "Paiements par carte du 31 décembre", non: "laissés de côté", oui: "ajoutés au relevé" },
  facture: { libelle: "Facture d'Électro-Composants du 10 décembre", non: "laissée de côté", oui: "retirée du compte de NOVA" },
};

export const CONTROLER_LES_COMPTES: Chapitre = {
  code: "controler-les-comptes",
  parcours: "stmg-gf",
  palier: 1,
  blocs: ["STMG Thème 1 · Appliquer les règles comptables"],
  titre: "Contrôler les comptes : le lettrage et le rapprochement bancaire",
  accroche:
    "Le compte d'un client dit qu'une facture est impayée ; le relevé de la banque dit autre chose. Lettrer, pointer, rapprocher : les contrôles qui rendent les comptes fiables, et la trésorerie vraiment disponible.",
  objectifs: [
    "Lettrer le compte d'un client",
    "Pointer le compte bancaire et le relevé de la banque",
    "Établir un état de rapprochement bancaire",
    "Enregistrer les opérations que le rapprochement révèle",
    "Dire quelle trésorerie est vraiment disponible",
  ],
  libre: false,
  prerequis: ["le-systeme-d-information-comptable"],
  ensuite: ["lire-le-bilan", "fonds-de-roulement-et-tresorerie"],
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "les contrôles se font ici sur les comptes de NOVA au 31 décembre de son premier exercice dans la simulation du cours ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux contrôles avant la balance",
      notions: ["payment_terms", "net_treasury"],
      texte: (c) => {
        const k = controleDesComptes(c);
        return [
          `Fin décembre, le comptable ${dE(k.entreprise)} vérifie ses comptes avant d'établir la balance. Une écriture oubliée, et le bilan serait faux.`,
          `Deux contrôles. Le lettrage : dans le compte d'un client, relier chaque règlement à la facture qu'il paie ; ce qui reste sans lettre est encore dû. Le rapprochement bancaire : comparer le compte 512 ${dE(k.entreprise)} au relevé de la banque, et expliquer chaque écart.`,
        ];
      },
      repere: () => "Lettrer : une facture et son règlement reçoivent la même lettre. Rapprocher : expliquer l'écart entre le compte 512 et le relevé.",
    },
    {
      id: "lettrer",
      objectifs: [0],
      type: "tri",
      titre: "Lettrer le compte de CampusTech",
      notions: ["payment_terms"],
      tableau: (c) => tableauDuCompteClient(controleDesComptes(c)),
      question: (c) => {
        const k = controleDesComptes(c);
        return `Voici le compte ${dE(k.client)} tel que le comptable le tient le 31 décembre : les factures depuis ${nomDuMois(PREMIERE_FACTURE_DE_L_EXTRAIT)}, et les règlements reçus pour elles. Rangez chaque ligne : lettrée (la facture et son règlement se répondent) ou non lettrée.`;
      },
      categories: [
        { code: "lettree", libelle: "Lettrée" },
        { code: "non-lettree", libelle: "Non lettrée" },
      ],
      elements: (c) => {
        const k = controleDesComptes(c);
        return k.extrait.map((l) => {
          const lettree = k.lettrageAvant.lettree(l);
          return {
            libelle: libelleDeLigne(l),
            montant: l.montant,
            categorie: lettree ? "lettree" : "non-lettree",
            pourquoi: lettree
              ? l.nature === "facture"
                ? `Un règlement de ${eur(l.montant)} la paie : même lettre pour les deux.`
                : `Il paie la facture ${deMois(l.facture)}, du même montant : même lettre.`
              : `Aucun règlement pour la facture ${deMois(l.facture)} : elle reste due.`,
          };
        });
      },
      relance: "Pour chaque facture, cherchez au crédit un règlement qui la paie : même mois de facture, même montant.",
      explication: (c) => {
        const k = controleDesComptes(c);
        const reglees = [...new Set(k.extrait.filter((l) => l.nature === "reglement").map((l) => l.facture))].map(deMois);
        const n = k.lettrageAvant.nonLettrees.length;
        return [`Les factures ${reglees.join(" et ")} sont réglées : leurs lignes portent la même lettre. ${qte(n)} factures restent sans lettre, ${k.deLaFactureReglee} à décembre.`];
      },
    },
    {
      id: "ce-que-doit-le-client",
      objectifs: [0],
      type: "montants",
      titre: "Ce que le client doit, selon le compte",
      notions: ["payment_terms"],
      question: (c) => `Calculez ce que ${controleDesComptes(c).client} doit, selon son compte : la somme des lignes non lettrées.`,
      champs: (c) => {
        const k = controleDesComptes(c);
        const l = k.lettrageAvant.nonLettrees;
        return [{ libelle: "Reste dû selon le compte", attendu: k.lettrageAvant.resteDu, calcul: `${l.map((x) => eur(x.montant)).join(" + ")} = ${eur(k.lettrageAvant.resteDu)}` }];
      },
      explication: (c) => {
        const k = controleDesComptes(c);
        return [
          `Selon le compte, ${k.client} doit ${eur(k.lettrageAvant.resteDu)}. La facture ${k.deLaFactureReglee}, échue depuis le ${dateEcrite(k.echeanceDeLaFacture)}, paraît impayée, plus longtemps que le retard habituel du client.`,
        ];
      },
    },
    {
      id: "avant-de-relancer",
      objectifs: [0, 1],
      type: "choix",
      titre: "Avant de relancer le client",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const k = controleDesComptes(c);
        return `La facture ${k.deLaFactureReglee} de ${k.client} n'est pas lettrée. Que fait le comptable d'abord ?`;
      },
      options: (c) => {
        const k = controleDesComptes(c);
        return [
          {
            texte: "Il vérifie le relevé de la banque",
            juste: true,
            retour: `Oui : le client a peut-être payé sans que le virement soit saisi. Relancer un client qui a payé abîme la relation avec ${k.client}.`,
          },
          {
            texte: "Il envoie aussitôt une relance au client",
            juste: false,
            retour: "Pas d'abord : si le client a payé, la relance est une erreur. Un compte non lettré dit ce que la comptabilité a vu, pas forcément ce que le client a fait.",
          },
          {
            texte: "Il déprécie la créance, qui ne sera sans doute jamais payée",
            juste: false,
            retour: `Non : rien ne dit que ${k.client} ne paiera pas ; c'est un client régulier, solvable. Il faut d'abord vérifier.`,
          },
        ];
      },
    },
    {
      id: "pointer",
      objectifs: [1],
      type: "tri",
      titre: "Pointer le compte et le relevé",
      notions: ["net_treasury"],
      tableau: (c) => tableauDuPointage(controleDesComptes(c)),
      question: (c) =>
        `Pointer, c'est cocher chaque opération que l'on retrouve des deux côtés. Ce qui entre au compte 512 ${dE(controleDesComptes(c).entreprise)} est au crédit du relevé, et inversement : c'est le compte de NOVA vu par la banque. Rangez chaque opération de décembre.`,
      categories: [
        { code: "deux", libelle: "Des deux côtés" },
        { code: "releve", libelle: "Sur le relevé seulement" },
        { code: "compte", libelle: "Au compte de NOVA seulement" },
      ],
      elements: (c) =>
        operationsDeDecembre(controleDesComptes(c)).map((o) => ({ libelle: o.libelle, montant: Math.abs(o.montant), categorie: o.cote, pourquoi: POURQUOI_DU_POINTAGE[o.code]! })),
      relance: "Regardez les deux colonnes du tableau : une opération qui n'a qu'un montant n'est que d'un côté.",
      explication: (c) => {
        const k = controleDesComptes(c);
        return [
          `Trois opérations ne sont que d'un côté. Le virement ${dE(k.client)} était bien arrivé le ${dateEcrite(OUBLIS_DE_DECEMBRE.campustech)} : la facture ${k.deLaFactureReglee} est payée.`,
        ];
      },
    },
    {
      id: "l-etat-de-rapprochement",
      objectifs: [2],
      type: "a-completer",
      titre: "L'état de rapprochement",
      notions: ["net_treasury"],
      question: () =>
        "Chaque côté se corrige de ce qui lui manque : le compte de NOVA, des opérations que seule la banque a passées ; le relevé, de celles que la banque n'a pas encore. Remplissez l'état de rapprochement : les deux soldes rapprochés doivent être égaux.",
      grille: (c) => etatDeRapprochement(controleDesComptes(c)),
      explication: (c) => {
        const r = controleDesComptes(c).r;
        return [
          `Les deux soldes rapprochés valent ${eur(r.compteRapproche)} : l'écart de départ, ${eur(r.compteAvant - r.releve)}, est entièrement expliqué.`,
          "Les corrections du côté du relevé ne demandent rien au comptable : la banque les passera d'elle-même. Celles du côté du compte de NOVA sont des écritures à passer.",
        ];
      },
    },
    {
      id: "le-virement-du-client",
      objectifs: [3],
      type: "ecriture",
      titre: "Le virement du client, au journal",
      notions: ["payment_terms"],
      evenement: (c) => {
        const k = controleDesComptes(c);
        return `Le relevé le montre : le ${dateEcrite(OUBLIS_DE_DECEMBRE.campustech)}, ${k.client} a viré ${eur(k.r.virement)} pour sa facture ${k.deLaFactureReglee}. Passez l'écriture.`;
      },
      ecriture: (c) => {
        const k = controleDesComptes(c);
        return {
          date: dateEcrite(OUBLIS_DE_DECEMBRE.campustech),
          libelle: `Règlement ${k.client}, facture ${k.deLaFactureReglee}`,
          lignes: [
            { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: k.r.virement, indice: "le montant du virement" },
            { role: "la créance qui s'éteint", compte: "411", sens: "credit", montant: k.r.virement, indice: "la facture que le virement paie" },
          ],
        };
      },
      indices: () => ["La banque reçoit de l'argent : elle est au débit.", "Le client ne doit plus cette facture : sa créance diminue, au crédit."],
      explication: (c) => {
        const k = controleDesComptes(c);
        return [`Le compte 512 monte ${dE(eur(k.r.virement))}, la créance baisse d'autant. Le règlement peut maintenant se lettrer avec la facture ${k.deLaFactureReglee}.`];
      },
      vue: "grand-livre",
    },
    {
      id: "le-prelevement-du-loyer",
      objectifs: [3],
      type: "ecriture",
      titre: "Le prélèvement du loyer, au journal",
      notions: ["income_statement"],
      evenement: (c) => {
        const k = controleDesComptes(c);
        return `Le relevé le montre aussi : le ${dateEcrite(OUBLIS_DE_DECEMBRE.loyer)}, la banque a prélevé le loyer de décembre, ${eur(k.r.loyer)}. Passez l'écriture.`;
      },
      ecriture: (c) => {
        const k = controleDesComptes(c);
        return {
          date: dateEcrite(OUBLIS_DE_DECEMBRE.loyer),
          libelle: "Prélèvement du loyer de décembre",
          lignes: [
            { role: "le loyer, une charge", compte: "6132", acceptes: ["613"], sens: "debit", montant: k.r.loyer, indice: "le montant prélevé" },
            { role: "l'argent sorti de la banque", compte: "512", sens: "credit", montant: k.r.loyer, indice: "le montant prélevé" },
          ],
        };
      },
      indices: () => ["Le loyer est une charge de l'année.", "L'argent sort de la banque : le compte 512 est au crédit."],
      explication: (c) => {
        const k = controleDesComptes(c);
        return [
          `Le compte 512 porte maintenant ${eur(k.r.compteRapproche)}, le solde rapproché. Sans ce contrôle, le loyer de décembre manquait aux charges : le résultat de l'année aurait été trop haut ${dE(eur(k.r.loyer))}.`,
        ];
      },
      vue: "grand-livre",
    },
    {
      id: "le-compte-du-client-lettre",
      objectifs: [0, 3],
      type: "montants",
      titre: "Le compte du client, lettré à nouveau",
      notions: ["payment_terms", "balance_sheet"],
      question: (c) => {
        const k = controleDesComptes(c);
        return `Le règlement est saisi, et lettré avec la facture ${k.deLaFactureReglee}. Que doit maintenant ${k.client} au 31 décembre ?`;
      },
      champs: (c) => {
        const k = controleDesComptes(c);
        const l = k.lettrageApres.nonLettrees;
        return [{ libelle: `Reste dû par ${k.client}`, attendu: k.lettrageApres.resteDu, calcul: `${l.map((x) => eur(x.montant)).join(" + ")} = ${eur(k.lettrageApres.resteDu)}` }];
      },
      explication: (c) => {
        const k = controleDesComptes(c);
        return [
          `${k.client} doit ${eur(k.lettrageApres.resteDu)} : les factures d'octobre, de novembre et de décembre. Pas de relance à envoyer pour septembre ; la facture d'octobre, elle, sera payée en janvier, avec le retard habituel du client.`,
        ];
      },
    },
    {
      id: "le-plus-gros-virement",
      objectifs: [4],
      type: "curseur",
      titre: "Ce qui est vraiment sur le compte",
      notions: ["net_treasury"],
      question: (c) => {
        const k = controleDesComptes(c);
        return `Le 31 décembre, ${k.entreprise} veut faire un virement. Son compte 512, rapproché, porte ${eur(k.r.compteRapproche)}. Placez le curseur sur le plus gros virement possible ce jour-là sans passer à découvert, puis validez.`;
      },
      grandeur: () => ({ libelle: "Virement du 31 décembre", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: controleDesComptes(c).virementPossible, min: VIREMENT_DU_CURSEUR.min, max: VIREMENT_DU_CURSEUR.max }),
      zones: ["Pas de découvert", "Découvert"],
      rates: () => ({
        dessous: "Ce virement passe, mais un plus gros passerait encore.",
        dessus: "Ce virement mettrait le compte à découvert ce jour-là : cherchez plus bas.",
      }),
      montrer: "Montrer le virement",
      lecture: (c, v) => {
        const r = controleDesComptes(c).r;
        return [
          { libelle: "Ce que porte le relevé de la banque", montant: r.releve },
          { libelle: "Virement", montant: v },
          { libelle: "Ce qui reste sur le compte ce jour-là", montant: auCentime(r.releve - v), fort: true },
        ];
      },
      droites: (c) => {
        const r = controleDesComptes(c).r;
        return { produit: () => r.releve, cout: (v) => v, libelles: ["Ce que porte le relevé", "Le virement"] };
      },
      explication: (c) => {
        const k = controleDesComptes(c);
        return [
          `Au plus ${eur(k.virementPossible)}, ce que porte le relevé, et non ${eur(k.r.compteRapproche)}. Les paiements par carte du jour, ${eur(k.r.cartes)}, n'arriveront que le ${dateEcrite(CARTES_DU_31_DECEMBRE.credit)}.`,
          "Le compte rapproché dit la trésorerie de l'entreprise à la clôture ; le relevé dit ce que la banque laisse dépenser aujourd'hui.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-rapprochement",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire du rapprochement",
      notions: ["net_treasury"],
      question: () =>
        "Reprenez les soldes d'avant le rapprochement. Pour chaque opération, décidez où elle corrige : le compte de NOVA, le relevé, ou nulle part. Le tableau donne les deux soldes corrigés et l'écart qui reste. Relevez le défi.",
      leviers: () =>
        LEVIERS_DU_RAPPROCHEMENT.map((code) => {
          const l = CHOIX_DES_LEVIERS[code];
          return {
            code,
            libelle: l.libelle,
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: 0,
            choix: [
              { valeur: 0, libelle: l.non },
              { valeur: 1, libelle: l.oui },
            ],
          };
        }),
      lecture: (c, p) => {
        const k = controleDesComptes(c);
        const x = rapprochementDuLaboratoire(k, p);
        return [
          { libelle: "Compte 512 de NOVA, corrigé", montant: x.compte, reference: k.r.compteAvant },
          { libelle: "Relevé de la banque, corrigé", montant: x.releve, reference: k.r.releve },
          { libelle: "Écart qui reste", montant: x.ecart, fort: true },
        ];
      },
      defi: (c) => {
        const k = controleDesComptes(c);
        return {
          consigne: "Ramenez l'écart à zéro, en ne corrigeant que ce qui doit l'être.",
          atteint: (p) => rapprochementDuLaboratoire(k, p).ecart === 0,
          indice: (p) => {
            const x = rapprochementDuLaboratoire(k, p);
            if (p.facture) return "Une facture reçue n'est pas un mouvement de la banque : la retirer du compte, c'est la croire payée.";
            if (!p.campustech || !p.loyer) return `Il reste ${eur(x.ecart)} d'écart : le relevé porte des opérations que le compte de NOVA n'a pas encore.`;
            return `Il reste ${eur(x.ecart)} d'écart : NOVA a enregistré une opération que la banque n'a pas encore.`;
          },
          solution: SOLUTION_DU_RAPPROCHEMENT,
        };
      },
      explication: (c) => {
        const k = controleDesComptes(c);
        return [
          `Écart nul : les deux côtés disent ${eur(k.r.compteRapproche)}. Chaque correction vient d'un décalage : l'un a vu une opération, l'autre pas encore.`,
          "La facture d'Électro-Composants, elle, n'a rien à faire ici : c'est une dette, payée le 1er janvier. Le rapprochement ne corrige que des mouvements de la banque.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payment_terms", "net_treasury"],
      texte: (c) => {
        const k = controleDesComptes(c);
        return [
          `Le lettrage a montré une facture apparemment impayée ; le rapprochement a montré qu'elle était payée, et qu'un loyer manquait. Deux écritures plus tard, le compte 512 ${dE(k.entreprise)} porte ${eur(k.r.compteRapproche)}, le chiffre que la balance et le bilan reprendront.`,
          "Ces contrôles se font chaque mois, pas seulement à la clôture : plus tôt un oubli se voit, moins il coûte. Dans l'arène, la trésorerie de votre entreprise se lit de la même façon : ce que disent les comptes, et ce qui est vraiment disponible.",
        ];
      },
      repere: () => "Lettrer : relier chaque règlement à sa facture. Rapprocher : corriger chaque côté de ce qui lui manque ; seules les corrections du compte de l'entreprise s'écrivent au journal.",
    },
  ],
};
