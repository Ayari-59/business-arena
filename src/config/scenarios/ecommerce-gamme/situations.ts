import { ECOMMERCE_SITUATIONS } from "../ecommerce/situations";
import { patchSituationText, type SituationTextPatch } from "../situation-patch";
import type { SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de PIXEL & CO · GAMME.
 *
 * Même dramaturgie que le pure player d'origine (le premier euro de
 * publicité, fidélisation, retours, pic des fêtes, commission, scénarios, et
 * les situations détectées), posée sur quatre rayons qui se partagent le
 * même entrepôt et le même budget d'acquisition. Ce que la gamme ajoute : un
 * coût d'acquisition et une commission PAR RAYON, le mix des commandes, et
 * une collection qui se bâtit avant de se vendre. Les situations sont
 * HÉRITÉES du pure player : même structure, sous d'autres codes ; le texte de
 * celles que le mix change est réécrit, les autres sont reprises telles quelles.
 */

const CODE = (code: string) => code.replace(/^ecom(merce)?_/, "ecomg_");

const PATCHES: Record<string, SituationTextPatch> = {
  ecom_t1_acquisition: {
    title: "Le premier euro de publicité, rayon par rayon",
    narrative:
      "Vous reprenez PIXEL & CO : un entrepôt loué, 2 080 références en stock réparties entre trois rayons, décoration, petit mobilier et luminaires, un site qui fonctionne et zéro notoriété. Dans un tiroir, un projet de collection de créateurs, sans sourcing ni shooting : il faudra le financer avant de la vendre. Sans budget de publicité, le compteur de visiteurs reste à trois chiffres par jour, quel que soit le rayon.",
    problem:
      "Un client acquis par la publicité vous coûte de l'argent avant d'en rapporter. À partir de quand la dépense est-elle justifiée, et est-ce le même seuil pour un coussin et pour un fauteuil ?",
    diagnosticLabels: [
      "Quand la marge dégagée par la commande dépasse ce que la publicité a coûté pour l'obtenir, rayon par rayon",
      "Le budget d'acquisition n'est pas un confort : sans lui, il n'y a pas de commandes du tout, sur aucun rayon",
      "Dès que le chiffre d'affaires augmente, la publicité est rentable",
      "Il ne faut jamais payer pour du trafic : le référencement naturel suffit",
    ],
    hintTexts: [
      "Décomposez ce que devient un billet encaissé, rayon par rayon : 46 € en décoration, 125 € en mobilier, 78 € en luminaires. Où va-t-il, poste par poste ?",
      "Trois postes le mangent : la marchandise, la logistique (un fauteuil s'expédie plus cher qu'un coussin), et la publicité qui a amené le client.",
      "Les deux premiers figurent dans le coût variable classique. Le troisième est propre au commerce en ligne, et se paie pour chaque rayon.",
      "Marge par commande : décoration 46 − 27 = 19 €, mobilier 125 − 77 = 48 €, luminaires 78 − 42 = 36 €. Coût d'acquisition = budget publicité du rayon ÷ ses nouvelles commandes.",
      "Tant que le coût d'acquisition d'un rayon reste sous sa marge, chaque nouveau client contribue ; au-delà, vendre davantage appauvrit. Le même euro de publicité vaut plus en mobilier qu'en décoration, et la capsule ne vend rien tant qu'elle n'est pas bâtie.",
    ],
    modelExplain:
      "Le seuil de rentabilité pose la question du métier dans les bons termes, rayon par rayon : combien de commandes faut-il, une fois la publicité payée, et à quel mix ?",
  },
  ecom_t4_pic: {
    title: "Black Friday et fêtes, sur quatre rayons",
    narrative:
      "Le quatrième trimestre pèse plus d'une fois et demie un trimestre ordinaire, et les luminaires s'y vendent presque le double. Vos concurrents ont réservé leurs espaces publicitaires depuis septembre, et votre entrepôt prépare 7 000 commandes par trimestre, un coussin comme un fauteuil, pas une de plus.",
    problem:
      "Comment préparer un pic qui exige à la fois du stock par rayon, de la capacité d'expédition et du budget d'acquisition, et quel rayon servir en premier si la place manque ?",
    diagnosticLabels: [
      "Trois contraintes simultanées : la marchandise de chaque rayon, la capacité de préparation commune et le budget publicitaire",
      "Tout se décaisse AVANT d'encaisser : stock acheté rayon par rayon, publicité payée, commandes livrées ensuite",
      "Il suffit d'augmenter le budget publicitaire : la demande fera le reste",
      "Il suffit d'avoir du stock : à Noël, tout se vend",
    ],
    hintTexts: [
      "Regardez la saisonnalité de chaque rayon : quel coefficient s'applique au quatrième trimestre en décoration, en mobilier, en luminaires ?",
      "Le pic vaut 1,6 fois un trimestre ordinaire en décoration, 1,45 en mobilier, 1,7 en luminaires. Comparez la somme à ce que votre entrepôt sait traiter.",
      "Trois plafonds à vérifier ensemble : le stock disponible de chaque rayon, la capacité de préparation, commune à tous, et le budget d'acquisition qui déclenche les commandes.",
      "La contrainte la plus serrée décide de tout : si l'entrepôt sature, chaque commande de mobilier prise laisse 48 € et chaque commande de décoration 19 €. Le mix du pic est une décision.",
      "Et n'oubliez pas le calendrier des flux : le stock et la publicité se paient ce tour-ci, une partie des ventes s'encaisse au suivant, sur chaque place de marché.",
    ],
    modelExplain:
      "L'analyse de capacité met en évidence la contrainte la plus serrée, commune aux quatre rayons : acheter du stock au-delà de ce que l'entrepôt sait expédier immobilise de la trésorerie pour rien, et le mix servi dans la place restante fait la marge.",
  },
  ecom_t5_commission: {
    title: "Ce que les places de marché prélèvent, rayon par rayon",
    narrative:
      "Les places de marché vous apportent un quart de vos commandes, mais pas au même prix : 12 % sur la décoration et les luminaires, 15 % sur le mobilier. Leur responsable annonce que la commission montera l'an prochain, et propose d'en reparler si vous vous engagez sur un volume.",
    problem:
      "Ces canaux valent-ils encore ce qu'ils coûtent, rayon par rayon, et qu'avez-vous à mettre dans la balance ?",
    diagnosticLabels: [
      "La commission est une charge prélevée sur chaque vente : elle réduit la marge sans que le prix affiché bouge, et elle pèse plus lourd là où le taux est plus haut",
      "Un canal qui pèse un quart des commandes et dont vous ne fixez pas les règles est un risque autant qu'un débouché",
      "Une commission plus haute se compense en montant le prix du même pourcentage",
      "Tant que le canal apporte du volume, le taux de sa commission importe peu",
    ],
    hintTexts: [
      "Reprenez une commande passée par ce canal, rayon par rayon, et suivez le billet : qui prend quoi, et dans quel ordre ?",
      "Trois prélèvements, pas deux : la marchandise, la logistique, et le tiers qui a apporté le client.",
      "La commission porte sur le PRIX et non sur la marge. À 12 %, elle prend 5,52 € sur une commande de décoration à 46 € ; à 15 %, 18,75 € sur un fauteuil à 125 €.",
      "Comparez alors les deux marges de chaque rayon, en direct et par le canal : 19 € contre 13,48 € en décoration, 48 € contre 29,25 € en mobilier. Pesez chacune par son volume plutôt que par son nombre de commandes.",
      "Monter le prix pour absorber la commission coûte du volume, et pas le même partout : la clientèle qui compare part la première, celle qui revient reste. Ce que vous apportez au partenaire, rayon par rayon, est un meilleur argument que ce que vous lui demandez.",
    ],
    modelExplain:
      "L'analyse des coûts pertinents ne retient que ce qui CHANGE avec le canal : la commission de chaque rayon, et rien d'autre. Les charges de structure sont les mêmes que la commande vienne du site ou de la place de marché.",
  },
  ecom_detect_idle_cash: {
    title: "L'après-fêtes, et la capsule qui attend",
    narrative:
      "Le pic des fêtes a rempli le compte : plus d'un trimestre et demi de charges de structure, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an, et facture le découvert 14 %. Le trimestre qui s'ouvre est le plus creux de l'année, les retours de décembre ne sont pas tous remboursés, et le projet de collection de créateurs attend toujours ses 20 000 €.",
    problem:
      "Cet argent qui dort, faut-il le placer, le mettre dans la capsule, ou le garder, et jusqu'à quel montant ?",
    diagnosticLabels: [
      "Une trésorerie qui dort ne coûte rien, mais ne rapporte rien non plus : c'est un manque à gagner, que le placement ou un projet peut combler",
      "Le montant bloqué ou investi ne pourra régler aucune facture du trimestre : il faut d'abord chiffrer ce qui va sortir, rayon par rayon",
      "Puisque le placement rapporte, autant y mettre la totalité du solde",
      "Placer améliore le résultat d'exploitation de l'entreprise",
    ],
    hintTexts: [
      "Comparez votre solde aux charges de structure d'un trimestre : de combien de trimestres d'avance disposez-vous vraiment ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro ; une commande de la capsule laisse 40 € de marge, mais seulement une fois la collection bâtie.",
      "Attention : le placement est bloqué jusqu'au tour suivant, et la R&D de la capsule est une charge du tour. Ni l'un ni l'autre ne réglera ce qui tombera d'ici là.",
      "Projetez le trimestre creux, rayon par rayon : publicité pour maintenir le trafic, règlement des fournisseurs du pic, et remboursement des retours de décembre.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte sept fois ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ],
    modelExplain:
      "Le budget de trésorerie place chaque flux à sa date réelle, rayon par rayon, remboursements de retours et développement de la capsule compris. Seul lui distingue ce que la caisse détient de ce qu'elle doit encore rendre.",
  },
};

export const ECOMMERCE_GAMME_SITUATIONS: SituationDef[] = ECOMMERCE_SITUATIONS.map((s) => {
  const patch = PATCHES[s.code];
  const renamed: SituationDef = { ...s, code: CODE(s.code) };
  return patch ? patchSituationText(renamed, patch) : renamed;
});
