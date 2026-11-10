import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { PRIX_DU_JEU } from "../monde/approvisionnement-de-nova";
import {
  PART_LA_PLUS_SURE,
  PRIX_DU_JEU_LE_PLUS_HAUT,
  RISQUES_CHIFFRES,
  SECOND_FOURNISSEUR,
  anneeDesRisques,
  diversifier,
  resultatAuPrixDuJeu,
  troisRisques,
} from "../monde/risques-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES RISQUES DE LA PERFORMANCE (Bac STMG, sciences de gestion et numérique de première,
 * thème 4, question 2 : « L'amélioration de la performance est-elle sans risque ? »).
 *
 * NOVA a fait une bonne année. Le chapitre cherche ce qui pourrait la défaire : des risques externes
 * (l'évolution de la demande, le cycle de vie du produit, l'obsolescence et la rupture technologique, la
 * dépendance à un fournisseur unique, l'empreinte environnementale) et des risques internes (une panne, un
 * départ, une erreur). Il en chiffre trois sur le résultat de l'année, cherche le plus haut prix des
 * composants que le résultat supporte (le curseur), puis la part d'achats à confier à un second
 * fournisseur qui protège le mieux (le laboratoire) : la protection a un prix.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : l'année N, le prix du jeu et la marge d'une
 * enceinte viennent des fiches ; les trois risques et le second fournisseur sont des hypothèses du cours,
 * nommées dans monde/risques-de-nova.ts.
 */

export const ENTREPRISES_DES_RISQUES = ["nova"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${Math.round(t * 100)} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

function lAnnee(c: Cas): TableauDeDonnees {
  const a = anneeDesRisques();
  return {
    titre: `L'année N ${dE(c.entreprise)}`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Enceintes vendues", valeurs: [qte(a.quantite)] },
      { libelle: "Ventes", valeurs: [eur(a.ventes)] },
      { libelle: "Charges de l'activité", valeurs: [eur(a.activite)] },
      { libelle: "Résultat d'activité", valeurs: [eur(a.resultat)] },
      { libelle: "Marge d'une enceinte vendue", valeurs: [eur(a.margeUnitaire)] },
      { libelle: "Prix d'un jeu de composants", valeurs: [eur(PRIX_DU_JEU)] },
    ],
  };
}

export const LES_RISQUES_DE_LA_PERFORMANCE: Chapitre = {
  code: "les-risques-de-la-performance",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 4 · Temps et risque"],
  titre: "Les risques de la performance",
  accroche:
    "Une bonne année ne garantit pas la suivante : la demande peut baisser, le produit vieillir, le fournisseur unique s'arrêter. Repérer les risques, chiffrer ce qu'ils coûteraient, et ce que coûte de s'en protéger.",
  objectifs: [
    "Distinguer les risques externes et internes d'une organisation",
    "Relier le cycle de vie, l'obsolescence et la rupture technologique au risque sur la demande",
    "Chiffrer l'incidence d'un risque sur le résultat",
    "Réduire un risque, et dire ce que la protection coûte",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_RISQUES,
    pourquoi: "ce chapitre rejoue l'année N de NOVA, dont le cours tient les ventes, les charges et le fournisseur de composants.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une bonne année, et après ?",
      tableau: lAnnee,
      texte: (c) => [
        `${c.entreprise} a fini l'année N avec un résultat d'activité de ${eur(anneeDesRisques().resultat)}. Pour faire mieux l'an prochain, le président veut vendre plus, avec la même ligne et le même fournisseur, Électro-Composants Lyon, qui lui livre tous ses composants.`,
        "Améliorer la performance, c'est aussi s'exposer : plus on dépend d'un produit, d'un client ou d'un fournisseur, plus ce qui lui arrive pèse sur l'entreprise. Un risque est un événement possible, qui ferait baisser la performance s'il arrivait.",
      ],
      repere: () => "Un risque = un événement possible × ce qu'il coûterait. On le repère, on le chiffre, on choisit de le réduire ou de l'accepter.",
    },
    {
      id: "internes-ou-externes",
      objectifs: [0],
      type: "tri",
      titre: "Risques internes, risques externes",
      question: () => "Rangez chaque risque : naît-il dans l'entreprise (interne), ou dans son environnement (externe) ?",
      categories: [
        { code: "interne", libelle: "Interne" },
        { code: "externe", libelle: "Externe" },
      ],
      elements: () => [
        { libelle: "Une panne de la ligne de montage", montant: 0, categorie: "interne", pourquoi: "Elle naît dans l'atelier : un risque interne." },
        { libelle: "Le départ du seul technicien qui sait régler la ligne", montant: 0, categorie: "interne", pourquoi: "Une compétence qui dépend d'une personne : un risque interne." },
        { libelle: "Une erreur de saisie qui envoie une mauvaise commande", montant: 0, categorie: "interne", pourquoi: "Une défaillance d'un processus : un risque interne." },
        { libelle: "Une hausse du prix des composants", montant: 0, categorie: "externe", pourquoi: "Elle vient du fournisseur et du marché : un risque externe." },
        { libelle: "Une nouvelle norme sans fil, que les enceintes ne lisent pas", montant: 0, categorie: "externe", pourquoi: "Une rupture technologique, venue du marché : un risque externe." },
        { libelle: "Un concurrent qui lance une enceinte moins chère", montant: 0, categorie: "externe", pourquoi: "Il vient de la concurrence : un risque externe." },
        { libelle: "Une flambée du prix de l'électricité qui fait tourner la ligne", montant: 0, categorie: "externe", pourquoi: "La dépendance énergétique : le prix se fixe hors de l'entreprise." },
        { libelle: "Le président qui lance 3 enceintes nouvelles la même année", montant: 0, categorie: "interne", pourquoi: "Un risque né d'une décision : il tient au goût du dirigeant pour le risque." },
      ],
      relance: "Demandez-vous : l'entreprise peut-elle l'empêcher en changeant son organisation, ou vient-il d'ailleurs ?",
      explication: () => [
        "Un risque interne se réduit par l'organisation : l'entretien, la formation d'un second technicien, un contrôle. Un risque externe ne s'empêche pas : on s'y prépare, on le partage, on en dépend moins.",
      ],
    },
    {
      id: "le-cycle-de-vie",
      objectifs: [1],
      type: "choix",
      titre: "Le cycle de vie du produit",
      question: () => "La NOVA One se vend depuis trois ans ; ses ventes ne montent plus et les concurrents l'imitent. Où en est-elle de son cycle de vie, et quel est le risque ?",
      options: () => [
        { texte: "En maturité : bientôt le déclin, sans produit nouveau", juste: true, retour: "Oui : un produit naît (lancement), grandit (croissance), se stabilise (maturité), puis décline. En maturité, la demande ne monte plus et les prix baissent sous la concurrence. Sans produit nouveau en lancement, l'entreprise déclinera avec lui : c'est pourquoi NOVA prépare sa gamme." },
        { texte: "En lancement : les ventes vont décoller, il faut produire plus", juste: false, retour: "Non : le lancement est le début, quand le produit se fait connaître. Après trois ans, des ventes qui plafonnent et des imitateurs disent la maturité." },
        { texte: "En croissance : les concurrents prouvent que le marché grandit", juste: false, retour: "Non : en croissance, les ventes montent vite. Ici, elles plafonnent : la maturité." },
      ],
    },
    {
      id: "la-rupture-technologique",
      objectifs: [1],
      type: "choix",
      titre: "Obsolescence et rupture technologique",
      question: () => "Une nouvelle norme sans fil s'impose sur les téléphones ; les enceintes qui ne la lisent pas paraissent dépassées, même neuves. Comment nomme-t-on ce risque ?",
      options: () => [
        { texte: "Une obsolescence due à une rupture technologique", juste: true, retour: "Oui : le produit marche toujours, mais une innovation le rend dépassé. La demande peut chuter d'un coup, bien plus vite que dans un déclin ordinaire. La veille technologique sert à la voir venir." },
        { texte: "Une panne : les enceintes ne fonctionnent plus du tout", juste: false, retour: "Non : elles fonctionnent. C'est leur valeur aux yeux des clients qui baisse, parce qu'une technique nouvelle les a dépassées." },
        { texte: "Une baisse saisonnière, qui passera avec Noël", juste: false, retour: "Non : une saison revient chaque année ; une rupture technologique ne revient pas en arrière." },
      ],
    },
    {
      id: "trois-risques",
      objectifs: [2],
      type: "montants",
      titre: "Chiffrer trois risques",
      tableau: lAnnee,
      question: () => {
        const r = RISQUES_CHIFFRES;
        return `Rejouez l'année N, une chose changée à la fois. Calculez ce que chaque risque retirerait au résultat d'activité : une hausse de ${pct(r.hausseDuJeu)} du jeu de composants, une baisse de ${pct(r.baisseDeLaDemande)} des enceintes vendues, ${qte(r.moisDeRupture)} mois sans composants (les ventes sont régulières sur l'année).`;
      },
      champs: () => {
        const a = anneeDesRisques();
        const k = troisRisques();
        const r = RISQUES_CHIFFRES;
        return [
          { libelle: "Hausse du jeu de composants", attendu: k.hausse, calcul: `${eur(PRIX_DU_JEU)} × ${pct(r.hausseDuJeu)} × ${qte(a.quantite)} = ${eur(k.hausse)}` },
          { libelle: "Baisse de la demande", attendu: k.baisse, calcul: `${qte(a.quantite)} × ${pct(r.baisseDeLaDemande)} × ${eur(a.margeUnitaire)} = ${eur(k.baisse)}` },
          { libelle: "Un mois sans composants", attendu: k.rupture, calcul: `${qte(a.quantite)} ÷ 12 × ${eur(a.margeUnitaire)} = ${eur(k.rupture)}` },
        ];
      },
      explication: () => {
        const k = troisRisques();
        return [
          `Chacun de ces risques retirerait entre ${eur(Math.min(k.hausse, k.baisse, k.rupture))} et ${eur(Math.max(k.hausse, k.baisse, k.rupture))} à un résultat de ${eur(k.resultat)}. Une performance qui tient à un seul produit, un seul fournisseur, un seul marché est fragile : c'est ce qu'on appelle la dépendance.`,
        ];
      },
    },
    {
      id: "le-prix-que-supporte-le-resultat",
      objectifs: [2],
      type: "curseur",
      titre: "Jusqu'où le prix des composants peut-il monter ?",
      sens: "plus-grande",
      question: (c) => {
        const a = anneeDesRisques();
        return `Faites varier le prix d'un jeu de composants : une droite donne les ventes de l'année (${eur(a.ventes)}), l'autre les charges de l'activité, qui montent de ${qte(a.quantite)} € pour chaque euro de plus sur le jeu. Placez le curseur sur le plus haut prix du jeu, à l'euro, qui laisse ${c.entreprise} sans perte, à ventes égales.`;
      },
      grandeur: () => ({ libelle: "Prix d'un jeu de composants", unite: "€" }),
      cible: () => ({ attendu: PRIX_DU_JEU_LE_PLUS_HAUT, min: 20, max: 30 }),
      zones: ["Le résultat reste positif", "L'activité perd de l'argent"],
      rates: () => ({ dessous: "Le résultat supporterait un prix plus haut : cherchez plus haut.", dessus: "À ce prix, l'activité perd de l'argent." }),
      montrer: "Montrer le prix",
      lecture: (_c, p) => {
        const k = resultatAuPrixDuJeu(p);
        return [
          { libelle: "Ventes de l'année", montant: anneeDesRisques().ventes },
          { libelle: "Charges de l'activité", montant: k.charges },
          { libelle: "Résultat d'activité", montant: k.resultat, fort: true },
        ];
      },
      droites: () => ({ produit: () => anneeDesRisques().ventes, cout: (p) => resultatAuPrixDuJeu(p).charges, libelles: ["Ventes de l'année", "Charges de l'activité"] }),
      explication: () => {
        const au = resultatAuPrixDuJeu(PRIX_DU_JEU_LE_PLUS_HAUT);
        const plus = resultatAuPrixDuJeu(PRIX_DU_JEU_LE_PLUS_HAUT + 1);
        return [
          `À ${eur(PRIX_DU_JEU_LE_PLUS_HAUT)} le jeu, le résultat tombe à ${eur(au.resultat)} ; à ${eur(PRIX_DU_JEU_LE_PLUS_HAUT + 1)}, il serait de ${eur(plus.resultat)}. Une hausse de ${eur(PRIX_DU_JEU_LE_PLUS_HAUT + 1 - PRIX_DU_JEU)} sur un composant suffit à effacer l'année : c'est la mesure de la dépendance au fournisseur.`,
        ];
      },
    },
    {
      id: "diversifier",
      objectifs: [3],
      type: "simulation",
      titre: "Un second fournisseur",
      notions: ["make_or_buy"],
      question: () =>
        `Un second fournisseur vend le même jeu ${eur(SECOND_FOURNISSEUR.surcoutParJeu)} de plus. Il livre la part des jeux qu'on lui confie. Si l'un des deux fournisseurs s'arrête ${qte(RISQUES_CHIFFRES.moisDeRupture)} mois, NOVA perd ce qu'il livrait. Choisissez la part confiée au second : le pire des cas est l'arrêt qui coûte le plus.`,
      leviers: () => [{ code: "part", libelle: "Part des jeux confiée au second fournisseur", unite: "%", min: 0, max: 100, pas: 25, depart: 0 }],
      lecture: (_c, p) => {
        const k = diversifier(p.part! / 100);
        const ref = diversifier(0);
        return [
          { libelle: "Surcoût des jeux du second fournisseur", montant: k.surcout, reference: ref.surcout },
          { libelle: "Résultat sans rupture", montant: k.sansRupture, reference: ref.sansRupture },
          { libelle: "Résultat dans le pire des cas", montant: k.pireDesCas, reference: ref.pireDesCas, fort: true },
        ];
      },
      graphique: () => ({
        levier: "part",
        courbes: [
          { libelle: "Résultat sans rupture", valeur: (p) => diversifier(p.part! / 100).sansRupture },
          { libelle: "Résultat dans le pire des cas", valeur: (p) => diversifier(p.part! / 100).pireDesCas },
        ],
      }),
      defi: () => ({
        consigne: "Trouvez la part qui donne le meilleur résultat dans le pire des cas.",
        atteint: (p) => p.part === Math.round(PART_LA_PLUS_SURE * 100),
        indice: (p) => {
          const k = diversifier(p.part! / 100);
          const plus = p.part! < Math.round(PART_LA_PLUS_SURE * 100);
          return plus
            ? `Dans le pire des cas, le résultat est de ${eur(k.pireDesCas)} : l'arrêt du fournisseur principal coûte encore trop.`
            : `Dans le pire des cas, le résultat est de ${eur(k.pireDesCas)} : le surcoût, et l'arrêt du second fournisseur, coûtent trop.`;
        },
        solution: { part: Math.round(PART_LA_PLUS_SURE * 100) },
      }),
      explication: (_c, p) => {
        const k = diversifier(p.part! / 100);
        const sans = diversifier(0);
        return [
          `Défi relevé : en confiant ${qte(p.part!)} % des jeux au second fournisseur, NOVA paie ${eur(k.surcout)} de plus chaque année, mais le pire des cas tombe à ${eur(k.pireDesCas)} au lieu de ${eur(sans.pireDesCas)}.`,
          `Sans rupture, le résultat est plus bas (${eur(k.sansRupture)} au lieu de ${eur(sans.sansRupture)}) : la protection a un prix, comme une assurance. Tout confier au second fournisseur ne protège pas mieux : la dépendance change seulement de nom.`,
        ];
      },
    },
    {
      id: "l-empreinte",
      objectifs: [1],
      type: "choix",
      titre: "L'empreinte environnementale, un risque",
      question: () => "Les clients et la loi demandent des produits réparables : un indice de réparabilité s'affiche sur les appareils, et une enceinte collée, qu'on ne peut pas ouvrir, est mal notée. Pourquoi est-ce un risque pour la performance de NOVA ?",
      options: () => [
        { texte: "La demande et l'image peuvent baisser, et la règle s'impose", juste: true, retour: "Oui : l'empreinte environnementale d'un produit devient un critère d'achat et une obligation. Ignorée, elle fait perdre des clients ; anticipée, elle peut devenir un avantage, une enceinte qui se répare." },
        { texte: "Ce n'est pas un risque : seule la performance financière compte pour les clients", juste: false, retour: "Non : les clients regardent aussi ce que le produit fait à l'environnement, et la loi leur en donne la mesure." },
        { texte: "Le risque ne vaut que pour les grandes entreprises qui polluent beaucoup", juste: false, retour: "Non : l'indice s'affiche sur le produit, quelle que soit la taille de qui le fabrique." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const k = troisRisques();
        return [
          `La performance ${dE(c.entreprise)} est exposée : une baisse de la demande lui coûterait ${eur(k.baisse)}, une hausse des composants ${eur(k.hausse)}, un mois de rupture ${eur(k.rupture)}. Le produit vieillit (le cycle de vie), une technique peut le dépasser (la rupture technologique), l'environnement devient une exigence.`,
          `Se protéger a un prix : un second fournisseur coûte chaque année, mais réduit ce que coûterait le pire. Repérer, chiffrer, réduire ou accepter : c'est la gestion des risques. Dans l'arène, la feuille de décision propose une assurance ; elle se juge de la même façon.`,
        ];
      },
      repere: () => "Plus la performance dépend d'un seul produit, client ou fournisseur, plus elle est fragile. La protection coûte toujours ; elle vaut ce qu'elle évite dans le pire des cas.",
    },
  ],
};
