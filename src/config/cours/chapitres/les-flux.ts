import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accordPluriel } from "../accords";
import { type Cas } from "../cas";
import {
  DELAIS_ESSAYES,
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  delaiQuiGardeLaBanque,
  premierTrimestreALaBanque,
  ventesDeMarsPourLaBanque,
  type BanqueDuTrimestre,
} from "../monde/gestion-et-information";
import { DELAI_CONVENU_DE_CAMPUSTECH, RETARD_DE_CAMPUSTECH } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES FLUX DE L'ENTREPRISE (comptabilité générale, palier 1).
 *
 * Avant le journal : l'entreprise au centre de ses partenaires (associés, banque, fournisseurs,
 * clients, salariés, État et organismes sociaux), et ce qui circule entre eux. Le mois de janvier de
 * NOVA, opération par opération, rangé par partenaire ; puis les deux sens de chaque opération, le
 * flux réel et le flux financier ; enfin le premier trimestre de NOVA tel que la banque le voit. Un
 * curseur (combien d'enceintes vendues en plus en mars ramènent la banque à son niveau du début du
 * trimestre ?) et un laboratoire (le délai de CampusTech, et ce qu'il fait à la banque).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : le mois de janvier est celui du cas figé
 * (cas-des-entreprises.ts, le même que l'exercice de NOVA), le trimestre celui du budget de
 * trésorerie du contrôle de gestion (monde/gestion-et-information.ts, qui relit couts-et-budgets.ts).
 *
 * CE QUI A CHANGÉ. Le chapitre lisait le premier trimestre de l'arène, dans neuf entreprises. Il lit
 * maintenant le budget du cours : le compte courant de NOVA part de 25 000 € et finit mars à
 * 19 302,80 €, 270 314,40 € entrés et 276 011,60 € sortis.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export const POURQUOI_LA_GESTION_DE_BASE =
  "ce chapitre suit NOVA, l'entreprise dont le cours tient le semestre, l'exercice et la banque mois par mois.";

/** « à 80 jours, en retard de 20 jours sur les 60 jours convenus » : un délai au-delà de 60 jours n'est jamais convenu. */
const aSonDelai = (c: Cas) =>
  `à ${qte(c.venteCredit.delai)} jours, en retard de ${qte(RETARD_DE_CAMPUSTECH)} jours sur les ${qte(DELAI_CONVENU_DE_CAMPUSTECH)} jours convenus`;

/** Un délai essayé, en mots : comptant, un délai convenu, ou un retard. */
export const delaiEcrit = (d: number) =>
  d === 0 ? "au comptant" : d <= DELAI_CONVENU_DE_CAMPUSTECH ? `à ${qte(d)} jours` : `à ${qte(d)} jours, avec ${qte(d - DELAI_CONVENU_DE_CAMPUSTECH)} jours de retard`;

const trimestre = () => premierTrimestreALaBanque();

export function tableauDuTrimestre(c: Cas, t: BanqueDuTrimestre = trimestre()): TableauDeDonnees {
  return {
    titre: `Le premier trimestre ${dE(c.entreprise)}, vu de la banque`,
    colonnes: ["Entrée", "Sortie"],
    lignes: t.lignes.map((l) => ({ libelle: l.libelle, valeurs: l.montant > 0 ? [eur(l.montant), ""] : ["", eur(-l.montant)] })),
  };
}

export const LES_FLUX: Chapitre = {
  code: "les-flux-de-l-entreprise",
  parcours: "comptabilite-generale",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
    "STMG Thème 4 · Temps et risque",
    "Bac pro AGORA Bloc 2 · Organiser et suivre l'activité de production (de biens ou de services)",
  ],
  titre: "Les flux de l'entreprise",
  accroche:
    "Une entreprise ne vit pas seule : elle reçoit de ses associés et de sa banque, achète à ses fournisseurs, vend à ses clients, paie ses salariés et l'État. Ce qui circule entre eux, ce sont les flux.",
  objectifs: [
    "Nommer les partenaires de l'entreprise",
    "Ranger chaque opération selon le partenaire qu'elle concerne",
    "Distinguer le flux réel et le flux financier d'une même opération",
    "Lire les entrées et les sorties d'argent d'un trimestre",
    "Voir ce qu'un délai de paiement fait à la banque",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_LA_GESTION_DE_BASE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "L'entreprise et ses partenaires",
      notions: ["revenue"],
      texte: (c) => [
        `${c.entreprise} est au centre d'un réseau. Ses associés lui apportent de l'argent, sa banque lui en prête. Ses fournisseurs lui vendent ce qu'il lui faut, ses clients lui achètent ce qu'elle produit. Ses salariés lui donnent leur travail. L'État et les organismes sociaux prélèvent des impôts et des cotisations.`,
        "Entre l'entreprise et chacun d'eux, quelque chose circule : des biens, des services, du travail, de l'argent. Ce sont les flux. Les comprendre, c'est comprendre tout ce que la comptabilité va enregistrer.",
      ],
      repere: () => "Un flux réel : des biens, des services, du travail. Un flux financier : de l'argent. Les deux vont en sens contraire.",
    },
    {
      id: "partenaires",
      type: "tri",
      titre: "Qui est concerné ?",
      notions: ["revenue"],
      question: (c) => `Voici le mois de janvier ${dE(c.entreprise)}. Pour chaque opération, quel partenaire est concerné ?`,
      categories: [
        { code: "associes", libelle: "Associés" },
        { code: "banque", libelle: "Banque" },
        { code: "fournisseurs", libelle: "Fournisseurs" },
        { code: "clients", libelle: "Clients" },
        { code: "salaries", libelle: "Salariés" },
        { code: "etat", libelle: "État et organismes sociaux" },
      ],
      elements: (c) => [
        { libelle: "Apport en capital", montant: c.capital, categorie: "associes", pourquoi: "Les associés apportent l'argent qui lance l'entreprise." },
        { libelle: "Emprunt reçu", montant: c.emprunt, categorie: "banque", pourquoi: "La banque prête ; l'entreprise remboursera, avec des intérêts." },
        { libelle: `Achat : ${c.immobilisation.designation}`, montant: c.immobilisation.ttc, categorie: "fournisseurs", pourquoi: "L'équipement s'achète à un fournisseur, comme le reste." },
        { libelle: `Achat chez ${c.achat.fournisseur}`, montant: c.achat.ttc, categorie: "fournisseurs", pourquoi: `${c.achat.fournisseur} fournit les composants des ${c.unites}.` },
        { libelle: "Loyer du local", montant: c.loyer.montant, categorie: "fournisseurs", pourquoi: "Le propriétaire du local vend un service : l'usage du local. C'est un fournisseur." },
        { libelle: `Vente à ${c.venteCredit.client}`, montant: c.venteCredit.ttc, categorie: "clients", pourquoi: "Un client professionnel, qui paiera plus tard." },
        { libelle: "Ventes aux particuliers du mois", montant: c.venteComptant.ttc, categorie: "clients", pourquoi: "Des clients qui paient par carte, à la commande." },
        { libelle: "Salaires nets versés", montant: c.personnel.net, categorie: "salaries", pourquoi: "Le salaire paie le travail des salariés." },
        {
          libelle: "Cotisations sociales",
          montant: c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales,
          categorie: "etat",
          pourquoi: "Les cotisations vont à l'URSSAF, un organisme social, et financent la protection sociale.",
        },
      ],
      explication: () => [
        "Chaque opération a un partenaire en face. C'est ce partenaire que la comptabilité suivra dans ses comptes : ce qu'on doit à un fournisseur, ce qu'un client nous doit, ce qu'on doit à l'URSSAF.",
      ],
    },
    {
      id: "deux-sens",
      type: "choix",
      titre: "Une vente, deux flux",
      notions: ["payment_terms"],
      question: (c) => `${c.entreprise} vend ${qte(c.venteCredit.quantite)} ${c.unites} à ${c.venteCredit.client}, qui paie ${aSonDelai(c)}. Quels flux cette vente crée-t-elle ?`,
      options: (c) => [
        {
          texte: `Un flux réel vers le client, les ${c.unites}, et un flux financier en sens inverse, le paiement, ${qte(c.venteCredit.delai)} jours plus tard.`,
          juste: true,
          retour:
            "C'est cela. Toute opération avec un partenaire a ses deux sens : ce qui part, ce qui revient. Ici, les deux ne tombent pas le même jour : entre la livraison et le paiement, le client doit de l'argent à l'entreprise.",
        },
        {
          texte: "Un seul flux, financier : l'argent que le client paie.",
          juste: false,
          retour: `L'argent ne vient pas de nulle part : il paie les ${c.unites} ${accordPluriel(c, "livré")}. Le flux réel part le premier, le flux financier suit.`,
        },
        {
          texte: "Deux flux le même jour, puisque la vente est faite.",
          juste: false,
          retour: `Le client paie ${aSonDelai(c)} : le flux financier arrive après. C'est ce décalage qui fait naître une créance.`,
        },
      ],
    },
    {
      id: "emprunt",
      type: "choix",
      titre: "Et l'emprunt ?",
      notions: ["loan_schedule"],
      question: (c) => `La banque prête ${eur(c.emprunt)} à ${c.entreprise}. Quel flux réel y a-t-il en face ?`,
      options: () => [
        {
          texte: "Aucun : un emprunt est un flux financier dans les deux sens, l'argent prêté puis l'argent remboursé, avec les intérêts.",
          juste: true,
          retour: "C'est cela. La banque ne livre ni bien ni service : elle prête de l'argent, et en reçoit plus tard, un peu plus. Les flux financiers ne paient pas toujours un flux réel.",
        },
        { texte: "Le service de la banque, que l'entreprise paie avec l'emprunt.", juste: false, retour: "Le service de la banque se paie par les intérêts, pas par l'emprunt. L'emprunt lui-même est de l'argent qui se rendra." },
        { texte: "L'équipement acheté avec l'argent prêté.", juste: false, retour: "L'équipement vient du fournisseur, dans une autre opération. L'emprunt, lui, ne concerne que la banque." },
      ],
    },
    {
      id: "le-trimestre",
      type: "montants",
      titre: "Le trimestre vu de la banque",
      notions: ["cash_budget"],
      tableau: (c) => tableauDuTrimestre(c),
      question: (c) => {
        const t = trimestre();
        return `Voici les flux financiers du premier trimestre ${dE(c.entreprise)}, de janvier à mars : tout ce qui est entré sur son compte courant et tout ce qui en est sorti, taxes comprises. Le 6 janvier, la ligne de montage payée et le reste placé, le compte portait ${eur(t.debut)}. Faites les totaux, puis la variation de la banque.`;
      },
      champs: () => {
        const t = trimestre();
        return [
          { libelle: "Total des entrées", attendu: t.entrees, calcul: `la somme de la colonne Entrée : ${eur(t.entrees)}` },
          { libelle: "Total des sorties", attendu: t.sorties, calcul: `la somme de la colonne Sortie : ${eur(t.sorties)}` },
          { libelle: "Variation de la banque", attendu: t.variation, calcul: `${eur(t.entrees)} − ${eur(t.sorties)} = ${eur(t.variation)}` },
        ];
      },
      explication: () => {
        const t = trimestre();
        return [
          `La banque passe de ${eur(t.debut)} à ${eur(t.fin)} : elle a baissé de ${eur(-t.variation)} sur le trimestre.`,
          "Chaque ligne a un partenaire : les clients pour les encaissements, les fournisseurs pour les composants, l'emballage et le loyer, les salariés et l'URSSAF pour la paie, l'État pour la TVA, la banque pour l'échéance de l'emprunt.",
        ];
      },
    },
    {
      id: "ventes-et-encaissements",
      type: "choix",
      titre: "Encaisser, est-ce vendre ?",
      notions: ["payment_terms", "revenue"],
      question: (c) => {
        const t = trimestre();
        return `Sur le trimestre, ${c.entreprise} a facturé ${eur(t.ventesTtc)} de ventes, taxes comprises. Ses clients n'ont versé que ${eur(t.entrees)}. Pourquoi ?`;
      },
      options: (c) => {
        const t = trimestre();
        return [
          {
            texte: `Parce que ${c.venteCredit.client} paie ${aSonDelai(c)} : aucune de ses factures du trimestre n'est payée fin mars.`,
            juste: true,
            retour: `C'est cela. Les particuliers paient à la commande ; ${c.venteCredit.client} doit encore ${eur(t.duParCampusTech)} au 31 mars. Vendre, c'est livrer ; encaisser, c'est recevoir l'argent. Le chapitre suivant les sépare : charges et produits d'un côté, encaissements et décaissements de l'autre.`,
          },
          { texte: "Parce que la TVA ne s'encaisse pas.", juste: false, retour: "Si : le client paie la TVA avec le prix, et l'entreprise la reverse ensuite à l'État. L'écart vient d'un client qui n'a pas encore payé." },
          { texte: "Parce que l'emprunt a été remboursé.", juste: false, retour: "L'échéance de l'emprunt est une sortie, pas une vente qui manque. L'écart vient d'un client qui paie après le trimestre." },
        ];
      },
    },
    {
      id: "des-ventes-en-mars",
      type: "curseur",
      titre: "Des ventes en plus en mars",
      notions: ["cash_budget", "payment_terms"],
      question: (c) =>
        `Et si ${c.entreprise} vendait plus aux particuliers en mars ? Chaque ${c.unite} en plus est payée par carte à la commande ; son emballage, son transport et son énergie se paient dans le mois ; ses composants et sa TVA se paient en avril. Faites varier les ${c.unites} vendues en plus en mars, et placez le curseur sur le plus petit nombre qui ramène la banque, fin mars, à son niveau du début du trimestre.`,
      grandeur: (c) => ({ libelle: `${majuscule(c.unites)} vendues en plus en mars`, unite: c.unites }),
      cible: () => ({ attendu: ventesDeMarsPourLaBanque(), min: 0, max: 300 }),
      zones: ["La banque ne baisse pas sur le trimestre", "La banque baisse sur le trimestre"],
      rates: () => ({
        dessous: "Avec si peu de ventes en plus, ce qui sort de la banque dépasse encore ce qui y entre.",
        dessus: "Ces ventes remettent la banque à flot, mais moins suffirait : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre",
      lecture: (_c, q) => {
        const t = premierTrimestreALaBanque(undefined, { ventesEnPlusEnMars: q });
        return [
          { libelle: "Entrées du trimestre", montant: t.entrees },
          { libelle: "Sorties du trimestre", montant: t.sorties },
          { libelle: "Variation de la banque", montant: t.variation, fort: true },
        ];
      },
      droites: () => ({
        produit: (q) => premierTrimestreALaBanque(undefined, { ventesEnPlusEnMars: q }).entrees,
        cout: (q) => premierTrimestreALaBanque(undefined, { ventesEnPlusEnMars: q }).sorties,
        libelles: ["Entrées du trimestre", "Sorties du trimestre"],
      }),
      explication: (c) => {
        const q = ventesDeMarsPourLaBanque();
        const avec = premierTrimestreALaBanque(undefined, { ventesEnPlusEnMars: q });
        const avant = premierTrimestreALaBanque(undefined, { ventesEnPlusEnMars: q - 1 });
        return [
          `Il faut ${qte(q)} ${c.unites} de plus : chacune fait entrer ${eur(auCentime(avec.variation - avant.variation))} de plus qu'elle ne fait sortir avant la fin de mars, et la variation passe à ${eur(avec.variation)}. Avec ${qte(q - 1)}, elle reste à ${eur(avant.variation)}.`,
          "Une vente payée tout de suite fait entrer l'argent avant que ses achats ne se paient : le délai du fournisseur aide la banque, celui du client lui coûte.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-delai",
      type: "simulation",
      titre: "Le laboratoire du délai",
      notions: ["payment_terms", "cash_budget"],
      question: (c) =>
        `${c.venteCredit.client} est facturé le 20 de chaque mois. Choisissez le jour où il paie, et regardez la banque à la fin du trimestre. Le délai convenu entre professionnels ne dépasse pas ${qte(DELAI_CONVENU_DE_CAMPUSTECH)} jours : au-delà, c'est un retard.`,
      leviers: (c) => [
        {
          code: "delai",
          libelle: `Délai de paiement de ${c.venteCredit.client}`,
          unite: "jours",
          min: DELAIS_ESSAYES[0],
          max: DELAIS_ESSAYES.at(-1)!,
          pas: 1,
          depart: c.venteCredit.delai,
          choix: DELAIS_ESSAYES.map((d) => ({ valeur: d, libelle: majuscule(delaiEcrit(d)) })),
        },
      ],
      lecture: (c, p) => {
        const t = premierTrimestreALaBanque(undefined, { delaiCampusTech: p.delai! });
        const depart = premierTrimestreALaBanque(undefined, { delaiCampusTech: c.venteCredit.delai });
        return [
          { libelle: `Encaissements de ${c.venteCredit.client} sur le trimestre`, montant: auCentime(t.facturesDeCampusTech - t.duParCampusTech), reference: auCentime(depart.facturesDeCampusTech - depart.duParCampusTech) },
          { libelle: `Ce que ${c.venteCredit.client} doit encore au 31 mars`, montant: t.duParCampusTech, reference: depart.duParCampusTech },
          { libelle: "Banque au 31 mars", montant: t.fin, reference: depart.fin },
          { libelle: "Variation de la banque sur le trimestre", montant: t.variation, reference: depart.variation, fort: true },
        ];
      },
      defi: (c) => {
        const juste = delaiQuiGardeLaBanque();
        return {
          consigne: "Trouvez le délai le plus long qui laisse la banque, fin mars, au moins à son niveau du début du trimestre.",
          atteint: (p) => p.delai === juste,
          indice: (p) => {
            const t = premierTrimestreALaBanque(undefined, { delaiCampusTech: p.delai! });
            return t.variation < 0
              ? `${majuscule(delaiEcrit(p.delai!))}, la banque baisse de ${eur(-t.variation)} : ${c.venteCredit.client} paie trop tard.`
              : `${majuscule(delaiEcrit(p.delai!))}, la banque monte de ${eur(t.variation)} : un délai plus long la laisserait-il encore à flot ?`;
          },
          solution: { delai: juste },
        };
      },
      explication: (c, p) => {
        const t = premierTrimestreALaBanque(undefined, { delaiCampusTech: p.delai! });
        const reel = premierTrimestreALaBanque(undefined, { delaiCampusTech: c.venteCredit.delai });
        return [
          `Défi relevé : ${delaiEcrit(p.delai!)}, la facture de janvier est payée en mars, et la banque finit le trimestre à ${eur(t.fin)}. Au délai réel, ${delaiEcrit(c.venteCredit.delai)}, elle finit à ${eur(reel.fin)} : le retard de ${c.venteCredit.client} coûte ${eur(auCentime(t.fin - reel.fin))} à la banque ${dE(c.entreprise)}, sans rien changer à ses ventes.`,
          `Le flux réel est le même quel que soit le délai : ce sont les mêmes ${c.unites}. Seul le flux financier se décale, et c'est la banque qui l'attend.`,
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["revenue"],
      texte: (c) => [
        `Vous savez nommer les partenaires ${dE(c.entreprise)}, ranger chaque opération selon le partenaire qu'elle concerne, et voir ses deux sens : ce qui part, ce qui revient. Vous savez lire un trimestre vu de la banque, et ce qu'un délai de paiement y change.`,
        "Jouez une partie dans l'arène : chaque décision que vous prenez crée des flux, et le tableau de trésorerie de fin de tour les montre tous. Les chiffres de votre entreprise y seront différents : la lecture sera la même.",
      ],
      repere: () => "Associés, banque, fournisseurs, clients, salariés, État : six partenaires, et pour chaque opération, un flux réel et un flux financier.",
    },
  ],
};
