import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import {
  BAISSE_DE_LA_SUBVENTION,
  BUREAU_DU_CLUB,
  ENTREPRISES_DE_LA_STRATEGIE_DU_CLUB,
  HAUSSES_ESSAYEES,
  LE_CLUB,
  budgetDuClub,
  hausseQuiEquilibre,
  ressourcesEnNature,
  saisonSuivante,
  type OrigineDeLaRessource,
  type RessourceAPerenniser,
} from "../monde/strategie-du-club";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA STRATÉGIE D'UNE ASSOCIATION (Bac STMG, management de première, question 3.3, palier 1).
 *
 * Le Handball Club du Haut-Verdasse ne cherche pas le profit : peut-il se passer de stratégie ? Non.
 * L'élève lit son objet social et ses domaines, chiffre son budget et la part de la subvention, range ses
 * ressources (privées ou publiques), valorise ce qui ne passe pas par la caisse (le gymnase prêté, le
 * temps des bénévoles), distingue les ressources humaines et financières à pérenniser, cherche au
 * laboratoire la hausse de cotisation qui compense une subvention réduite et la juge face à l'objet
 * social, puis pèse le développement du club et l'exigence de transparence.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA, l'entreprise du cas, face à l'association du
 * cours : monde/strategie-du-club.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const ORIGINES: readonly { code: OrigineDeLaRessource; libelle: string }[] = [
  { code: "privee", libelle: "Ressource privée" },
  { code: "publique", libelle: "Ressource publique" },
];

export const RESSOURCES_A_PERENNISER: readonly { code: RessourceAPerenniser; libelle: string }[] = [
  { code: "humaines", libelle: "Pérenniser les ressources humaines" },
  { code: "financieres", libelle: "Pérenniser les ressources financières" },
];

const tete = BUREAU_DU_CLUB[0]!;
const tresorier = BUREAU_DU_CLUB[1]!;

export const LA_STRATEGIE_D_UNE_ASSOCIATION: Chapitre = {
  code: "la-strategie-d-une-association",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 3 · Les choix stratégiques des organisations"],
  titre: "La stratégie d'une association",
  accroche:
    "Un club de handball ne fait pas de bénéfice à partager, mais il doit garder ses bénévoles, financer sa saison et rendre des comptes. Son budget, ce qui ne passe pas par la caisse, une subvention qui baisse, et la stratégie qu'une association ne peut pas éviter.",
  objectifs: [
    "Reconnaître l'objet social et le but non lucratif d'une association",
    "Lire le budget d'une association et la part de chacune de ses ressources",
    "Valoriser les ressources qui ne passent pas par la caisse",
    "Choisir comment pérenniser ses ressources humaines et financières",
    "Peser le développement d'une association et son exigence de transparence",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_STRATEGIE_DU_CLUB,
    pourquoi: "ce chapitre oppose à NOVA, l'entreprise du cas, l'association du cours, dont il tient le budget, les adhérents et les bénévoles.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un club, une association",
      texte: (c) => {
        const b = budgetDuClub();
        return [
          `Le ${LE_CLUB.nom} est une association déclarée : ${qte(b.adherents)} adhérents mettent en commun leur activité dans un but autre que le partage de bénéfices. ${LE_CLUB.presentation} Son objet social, inscrit dans ses statuts : faire pratiquer le handball sur le territoire, à tous les âges.`,
          `L'assemblée générale des adhérents approuve les comptes et vote le budget ; elle élit un conseil d'administration de ${qte(LE_CLUB.conseilDAdministration)} membres, qui choisit son bureau. ${tete.nom} préside le club, ${tresorier.nom} en tient les comptes. ${qte(LE_CLUB.benevoles)} bénévoles et ${qte(LE_CLUB.salaries.length)} salariés le font vivre. Sans but lucratif, il n'échappe pas pour autant aux choix : là où ${c.entreprise} cherche un bénéfice, le club cherche à durer et à servir son objet.`,
        ];
      },
      repere: () => "Association : but non lucratif, objet social fixé par les statuts, assemblée générale des adhérents. Ses domaines d'activités servent son objet.",
    },
    {
      id: "un-excedent",
      objectifs: [0],
      type: "choix",
      titre: "Une association peut-elle gagner de l'argent ?",
      question: () => {
        const b = budgetDuClub();
        return `La saison laisse ${eur(b.excedent)} d'excédent. Une association a-t-elle le droit de faire un excédent ?`;
      },
      options: () => [
        {
          texte: "Oui, s'il sert son objet ; elle ne le partage pas entre ses membres",
          juste: true,
          retour: `Oui : le but non lucratif interdit de partager les excédents, pas d'en faire. Le club ${LE_CLUB.affectationDeLExcedent.replace(/^mis/, "met l'excédent")} : il sert son objet.`,
        },
        {
          texte: "Non : une association doit finir chaque saison à zéro exactement",
          juste: false,
          retour: "Non : rien ne l'y oblige. Un excédent mis en réserve aide même à passer une saison difficile.",
        },
        {
          texte: "Oui, et les adhérents se le partagent à l'assemblée générale, comme un dividende",
          juste: false,
          retour: "Non : c'est justement ce qui distingue une association d'une société comme NOVA. Ses membres ne se partagent rien.",
        },
      ],
    },
    {
      id: "le-budget",
      objectifs: [1],
      type: "montants",
      titre: "Le budget de la saison",
      tableau: () => ({
        titre: "Le budget en argent de la saison",
        colonnes: ["Montant"],
        lignes: [...LE_CLUB.budget.recettes.map((l) => ({ libelle: `Recette : ${l.libelle}`, valeurs: [eur(l.montant)] })), ...LE_CLUB.budget.depenses.map((l) => ({ libelle: `Dépense : ${l.libelle}`, valeurs: [eur(l.montant)] }))],
      }),
      question: () => "Calculez les recettes de la saison, ses dépenses, son excédent, puis la part de la subvention dans les recettes, en pourcentage au dixième.",
      champs: () => {
        const b = budgetDuClub();
        return [
          { libelle: "Recettes de la saison", attendu: b.recettes, calcul: `${LE_CLUB.budget.recettes.map((l) => eur(l.montant)).join(" + ")} = ${eur(b.recettes)}`, tolerance: 0 },
          { libelle: "Dépenses de la saison", attendu: b.depenses, calcul: `${LE_CLUB.budget.depenses.map((l) => eur(l.montant)).join(" + ")} = ${eur(b.depenses)}`, tolerance: 0 },
          { libelle: "Excédent", attendu: b.excedent, calcul: `${eur(b.recettes)} − ${eur(b.depenses)} = ${eur(b.excedent)}`, tolerance: 0 },
          { libelle: "Part de la subvention (%)", attendu: b.partDeLaSubvention, calcul: `${eur(b.subvention)} ÷ ${eur(b.recettes)} × 100 = ${pct(b.partDeLaSubvention)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const b = budgetDuClub();
        return [
          `Le club finit la saison avec ${eur(b.excedent)} d'excédent, pour ${eur(b.recettes)} de recettes : une marge étroite. La subvention en fait ${pct(b.partDeLaSubvention)} : plus d'un quart de son argent dépend d'une décision des élus.`,
        ];
      },
    },
    {
      id: "privee-ou-publique",
      objectifs: [1],
      type: "tri",
      titre: "D'où vient l'argent ?",
      question: () => "Rangez chaque ressource du club : privée ou publique ?",
      categories: ORIGINES,
      elements: () => [
        { libelle: "Les cotisations des adhérents", montant: 0, categorie: "privee", pourquoi: "Payées par les familles : une ressource privée." },
        { libelle: "Les partenaires et sponsors locaux", montant: 0, categorie: "privee", pourquoi: "Des entreprises du territoire : privée." },
        { libelle: "La buvette et le tournoi de printemps", montant: 0, categorie: "privee", pourquoi: "Des ventes aux spectateurs : privée." },
        { libelle: "La subvention de la communauté de communes", montant: 0, categorie: "publique", pourquoi: "De l'argent de l'impôt, voté par des élus : publique." },
        { libelle: "Le gymnase prêté gratuitement", montant: 0, categorie: "publique", pourquoi: "Un équipement public mis à disposition : une ressource publique, en nature." },
      ],
      relance: "La ressource vient-elle des adhérents, du public ou d'entreprises, ou d'une collectivité, donc de l'impôt ?",
      explication: () => ["Le club mêle ressources privées et publiques, marchandes (la buvette, les sponsors) et non marchandes. Ses frontières avec l'économie marchande sont poreuses, et chaque ressource a son risque : une subvention se revote chaque année."],
    },
    {
      id: "ce-qui-ne-passe-pas-par-la-caisse",
      objectifs: [2],
      type: "montants",
      titre: "Ce qui ne passe pas par la caisse",
      question: () => {
        const r = ressourcesEnNature();
        return `Les ${qte(r.benevoles)} bénévoles donnent ${qte(r.heures)} heures dans la saison ; on les valorise au SMIC horaire brut, ${eur(r.smic)}. Le gymnase prêté vaut ${eur(r.gymnase)}. Calculez la valeur du bénévolat, les ressources de la saison en argent et en nature, puis la part du bénévolat dans ce total, en pourcentage au dixième.`;
      },
      champs: () => {
        const r = ressourcesEnNature();
        return [
          { libelle: "Valeur du bénévolat", attendu: r.benevolat, calcul: `${qte(r.heures)} × ${eur(r.smic)} = ${eur(r.benevolat)}`, tolerance: 1 },
          { libelle: "Ressources en argent et en nature", attendu: r.total, calcul: `${eur(r.argent)} + ${eur(r.gymnase)} + ${eur(r.benevolat)} = ${eur(r.total)}`, tolerance: 1 },
          { libelle: "Part du bénévolat (%)", attendu: r.partDuBenevolat, calcul: `${eur(r.benevolat)} ÷ ${eur(r.total)} × 100 = ${pct(r.partDuBenevolat)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const r = ressourcesEnNature();
        return [
          `Le bénévolat vaut ${eur(r.benevolat)} : ${pct(r.partDuBenevolat)} de ce qui fait vivre le club, plus que tout son argent ne le dit. S'il fallait payer ces heures, le club ne tiendrait pas. Sa première ressource à pérenniser, ce sont ses bénévoles.`,
        ];
      },
    },
    {
      id: "perenniser",
      objectifs: [3],
      type: "tri",
      titre: "Pérenniser ses ressources",
      question: () => "Rangez chaque action du bureau : sert-elle d'abord à pérenniser les ressources humaines du club, ou ses ressources financières ?",
      categories: RESSOURCES_A_PERENNISER,
      elements: () => [
        { libelle: "Former des parents à l'arbitrage et à l'encadrement", montant: 0, categorie: "humaines", pourquoi: "De nouveaux bénévoles formés : les ressources humaines." },
        { libelle: "Remercier les bénévoles à l'assemblée générale et leur offrir le maillot du club", montant: 0, categorie: "humaines", pourquoi: "Reconnaître le bénévolat le fait durer : humaines." },
        { libelle: "Confier chaque tâche à deux personnes, pour qu'aucune ne s'épuise", montant: 0, categorie: "humaines", pourquoi: "Répartir la charge garde les bénévoles : humaines." },
        { libelle: "Signer avec la communauté une convention sur trois saisons", montant: 0, categorie: "financieres", pourquoi: "Une subvention prévisible : les ressources financières." },
        { libelle: "Chercher un deuxième sponsor, pour ne pas dépendre d'un seul", montant: 0, categorie: "financieres", pourquoi: "Diversifier ses financeurs : financières." },
      ],
      relance: "L'action aide-t-elle à garder et à renouveler les personnes qui font vivre le club, ou l'argent qui le finance ?",
      explication: () => ["La stratégie d'une association vise souvent d'abord sa pérennité : garder des bénévoles, ne pas dépendre d'un seul financeur. C'est la contrainte qui l'empêche de se passer de stratégie."],
    },
    {
      id: "le-laboratoire-de-la-subvention",
      objectifs: [3],
      type: "simulation",
      titre: "La subvention baisse",
      question: () => {
        const b = budgetDuClub();
        return `La communauté de communes annonce une subvention réduite de ${eur(BAISSE_DE_LA_SUBVENTION)} pour la saison suivante ; les dépenses du club ne changent pas. Le bureau envisage de monter la cotisation de chacun des ${qte(b.adherents)} adhérents. Faites varier la hausse, en euros par adhérent.`;
      },
      leviers: () => [{ code: "hausse", libelle: "Hausse de la cotisation, par adhérent", unite: "€", ...HAUSSES_ESSAYEES, depart: HAUSSES_ESSAYEES.min }],
      lecture: (_c, p) => {
        const s = saisonSuivante(p.hausse!);
        return [
          { libelle: "Recettes de la saison suivante", montant: s.recettes },
          { libelle: "Dépenses de la saison suivante", montant: s.depenses },
          { libelle: "Solde de la saison", montant: s.solde, effet: true, fort: true },
        ];
      },
      graphique: () => ({ levier: "hausse", courbes: [{ libelle: "Solde de la saison", valeur: (p) => saisonSuivante(p.hausse!).solde }] }),
      defi: () => {
        const juste = hausseQuiEquilibre();
        return {
          consigne: "Trouvez la plus petite hausse, à l'euro, qui garde le budget de la saison suivante en équilibre.",
          atteint: (p) => p.hausse === juste,
          indice: (p) => {
            const s = saisonSuivante(p.hausse!);
            return s.solde < 0 ? `À ${eur(p.hausse!)} de hausse, la saison finit à ${eur(s.solde)}.` : `À ${eur(p.hausse!)} de hausse, le budget tient : une hausse plus petite suffirait-elle ?`;
          },
          solution: { hausse: juste },
        };
      },
      explication: (_c, p) => {
        const s = saisonSuivante(p.hausse!);
        return [
          `Défi relevé : ${eur(p.hausse!)} de plus par adhérent ramènent la saison à ${eur(s.solde)} de solde. Le calcul est simple ; la décision ne l'est pas, car une cotisation plus chère peut éloigner des familles, contre l'objet même du club.`,
        ];
      },
    },
    {
      id: "qui-decide-de-la-cotisation",
      objectifs: [3],
      type: "choix",
      titre: "Monter la cotisation ?",
      question: () => "La hausse équilibre le budget, mais des familles modestes risquent de partir. Que doit faire le bureau ?",
      options: () => [
        {
          texte: "Proposer une hausse modulée à l'assemblée, chercher d'autres ressources",
          juste: true,
          retour: "Oui : c'est l'assemblée générale qui vote les cotisations. Le bureau peut proposer une hausse plus faible pour les jeunes, un tarif réduit pour les familles modestes, et chercher un sponsor ou un tournoi de plus : la stratégie sert l'objet social.",
        },
        {
          texte: "Monter la cotisation de tous sans en parler, puisque le calcul est juste",
          juste: false,
          retour: "Non : la cotisation se vote en assemblée générale. Et un calcul juste peut aller contre l'objet du club s'il éloigne les jeunes.",
        },
        {
          texte: "Ne rien faire : la communauté finira par rendre la subvention",
          juste: false,
          retour: "Non : rien ne l'y oblige. Sans décision, le club finirait la saison en déficit et puiserait dans sa réserve.",
        },
      ],
    },
    {
      id: "se-developper",
      objectifs: [4],
      type: "choix",
      titre: "Se développer",
      question: () => "Le club envisage d'ouvrir une section de sport santé pour les adultes, et un stage d'été payant ouvert aux enfants non adhérents. Que dit ce projet de sa stratégie ?",
      options: () => [
        {
          texte: "Il ouvre de nouveaux domaines au service de son objet, avec des recettes en plus",
          juste: true,
          retour: "Oui : une association se développe aussi, par de nouveaux domaines d'activités. Le stage payant rapproche le club de l'économie marchande ; il reste fidèle à son but non lucratif tant que ses recettes servent l'objet social.",
        },
        {
          texte: "Il est interdit : une association ne peut rien vendre",
          juste: false,
          retour: "Non : le club vend déjà à la buvette. Une association peut vendre, tant que ses excédents servent son objet et ne se partagent pas.",
        },
        {
          texte: "Il en fait une entreprise : dès qu'elle vend un service, l'association doit devenir une société",
          juste: false,
          retour: "Non : vendre ne change pas sa forme. Elle reste une association tant que son but n'est pas le partage de bénéfices.",
        },
      ],
    },
    {
      id: "la-transparence",
      objectifs: [4],
      type: "choix",
      titre: "Rendre des comptes",
      question: () => "Pour acheter un minibus, le club lance une collecte de dons en ligne, ouverte à tous. Qu'est-ce que cela change à ses obligations ?",
      options: () => [
        {
          texte: "Il doit dire publiquement à quoi les dons ont servi",
          juste: true,
          retour: "Oui : une organisation qui fait appel à la générosité du public rend compte de l'emploi des dons, dans un compte d'emploi des ressources collectées. Comme pour la subvention, dont elle rend compte à la communauté, la transparence entretient la confiance de ceux qui la financent.",
        },
        {
          texte: "Rien : une association ne rend des comptes qu'à ses adhérents, à l'assemblée générale",
          juste: false,
          retour: "Non : dès qu'elle reçoit de l'argent public ou fait appel aux dons du public, elle en rend compte à ceux qui la financent.",
        },
        {
          texte: "Il doit reverser à l'État une part des dons collectés",
          juste: false,
          retour: "Non : les dons vont à l'objet de l'association. Ce qu'elle doit, c'est la transparence sur leur emploi.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const b = budgetDuClub();
        const r = ressourcesEnNature();
        return [
          `Le club finit sa saison avec ${eur(b.excedent)} d'excédent, dépend pour ${pct(b.partDeLaSubvention)} de sa subvention, et doit à ses bénévoles ${pct(r.partDuBenevolat)} de ce qui le fait vivre. Une subvention réduite de ${eur(BAISSE_DE_LA_SUBVENTION)} demanderait ${eur(hausseQuiEquilibre())} de plus par adhérent : c'est pourquoi une association ne peut pas se passer de stratégie.`,
          `Sa stratégie est bornée par son objet social, vise la pérennité de ses ressources humaines et financières, la développe par de nouveaux domaines, et l'oblige à la transparence. ${c.entreprise} rend des comptes à ses associés ; le club, à ses adhérents et à ceux qui le financent. L'arène ne joue que des entreprises : la stratégie sans profit s'apprend ici.`,
        ];
      },
      repere: () => "Association : objet social, but non lucratif, pérennisation des ressources humaines et financières, développement, transparence.",
    },
  ],
};
