import { BISTROT_SITUATIONS } from "../bistrot/situations";
import { patchSituationText, type SituationTextPatch } from "../situation-patch";
import type { SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de LA TABLE D'AUGUSTIN · GAMME.
 *
 * Même dramaturgie que le bistrot d'origine (reprise, fournisseur, hausse
 * des matières, banquets, terrasse, valeur, et les situations détectées),
 * posée sur quatre offres qui se partagent la même cuisine et la même
 * brigade. Ce que la gamme ajoute : le MIX des couverts servis, un ratio
 * matières par offre, et une activité qui se bâtit avant de se vendre. Les
 * situations sont HÉRITÉES du bistrot : même structure, sous d'autres codes ;
 * le texte de celles que le mix change est réécrit, les autres sont reprises
 * telles quelles.
 */

const CODE = (code: string) => code.replace(/^bistrot_/, "bistrotg_");

const PATCHES: Record<string, SituationTextPatch> = {
  bistrot_t1_reprise: {
    title: "Le premier service, quatre cartes",
    narrative:
      "Vous reprenez LA TABLE D'AUGUSTIN : 70 couverts, une brigade de dix, et quatre façons de vendre la même cuisine : la formule du midi, la carte du soir, les banquets et repas d'entreprise, et un projet d'activité traiteur qui dort dans un tiroir, faute de véhicule et d'agrément. Le comptable de la reprise vous a laissé une phrase : « surveille ton ratio matières, offre par offre, le reste suivra ».",
    problem:
      "Que signifie ce ratio, pourquoi est-il l'indicateur roi de votre métier, et pourquoi n'a-t-il pas la même valeur le midi et le soir ?",
    diagnosticLabels: [
      "C'est la part du coût des denrées dans le prix de vente : il mesure ce qu'il reste après avoir acheté à manger, et il diffère d'une offre à l'autre",
      "Une dérive de deux points suffit à effacer le résultat, tant les marges du secteur sont minces, et la formule du midi est la plus exposée",
      "C'est le taux de marge nette du restaurant",
      "C'est un indicateur secondaire : seul le nombre de couverts compte, quelle que soit l'offre",
    ],
    hintTexts: [
      "Séparez ce que vous payez pour CHAQUE assiette servie de ce que vous payez chaque mois quoi qu'il arrive. Une assiette du midi et une assiette du soir ne coûtent pas la même chose.",
      "Les denrées suivent les couverts ; la brigade, le loyer et l'énergie de base tombent même une salle vide, et ils sont communs aux quatre offres.",
      "Le ratio matières rapporte le coût des denrées au prix de vente : 7,50 € sur 27 € le midi (28 %), 12 € sur 38 € le soir (32 %), 10 € sur 33 € en banquet (30 %).",
      "Marge par couvert : midi 27 − 9,50 = 17,50 €, soir 38 − 15 = 23 €, banquets 33 − 12,50 = 20,50 €. Charges de structure décaissées = 90 000 € par trimestre.",
      "Seuil = 90 000 ÷ marge MOYENNE d'un couvert au mix prévu, soit environ 4 400 couverts au mix habituel : 70 par jour sur 64 jours d'ouverture. Plus de soir dans le mix, moins de couverts à servir pour équilibrer ; et le traiteur ne vend rien tant qu'il n'est pas bâti.",
    ],
    modelExplain:
      "Le seuil de rentabilité traduit le ratio matières en une question opérationnelle : combien de couverts par jour faut-il servir pour ne plus perdre d'argent ? Avec quatre offres, il se calcule à mix constant, et le mix devient une décision.",
  },
  bistrot_t3_matieres: {
    title: "Le beurre a pris 24 %, sur quatre cartes",
    narrative:
      "Votre grossiste annonce une hausse brutale sur la moitié de vos cartes : beurre, viande, énergie. Nous sommes en août, la salle est à moitié vide, les bureaux du quartier sont fermés et les banquets attendent décembre. Seuls les buffets traiteur, si vous en avez, continuent de partir.",
    problem:
      "Votre ratio matières dérape au pire moment, offre par offre. Que faites-vous de vos cartes et de vos prix ?",
    diagnosticLabels: [
      "Retravailler chaque carte : mettre en avant les plats dont la marge résiste, retirer ceux qui ne passent plus",
      "Ajuster le prix offre par offre selon son élasticité : la formule du midi et la carte du soir ne réagissent pas pareil",
      "Tout absorber sans rien changer : la hausse finira bien par retomber",
      "Fermer le temps que les prix redescendent",
    ],
    hintTexts: [
      "La hausse frappe une charge variable : quelle grandeur du compte de résultat bouge en premier, et sur quelle offre le plus ?",
      "Vingt-quatre pour cent sur les denrées : 1,80 € de plus par couvert du midi, 2,90 € le soir, 2,40 € en banquet. La marge se comprime partout, mais pas de la même façon.",
      "Deux issues : répercuter sur le ticket, ou reconstruire la carte pour retrouver de la marge à prix constant ; et une troisième en gamme, déplacer le mix vers l'offre dont la marge résiste le mieux.",
      "Le mois d'août amplifie tout : les déjeuners d'affaires tombent à 0,6 et les banquets à 0,5. Seule l'activité traiteur, si elle est bâtie, garde ses clients.",
      "Répercutez offre par offre : élasticité −1,5 le midi contre −1,2 le soir et −0,9 chez les gourmets. Une hausse uniforme est toujours sous-optimale quand les élasticités diffèrent.",
    ],
    modelExplain:
      "L'élasticité-prix dit ce que coûte en fréquentation chaque euro répercuté, offre par offre : c'est le seul outil qui arbitre entre ticket moyen, volume et mix.",
  },
  bistrot_t4_banquets: {
    title: "La saison des banquets, et le reste de la carte",
    narrative:
      "Décembre arrive : les repas d'entreprise et les banquets de fin d'année concentrent l'essentiel de leur budget annuel sur ce trimestre, règlent à 30 jours et privatisent la salle des soirs entiers. Chaque soir donné aux banquets est un soir retiré à la carte, et la cuisine ne sert qu'une fois : 9 000 couverts, toutes offres confondues.",
    problem:
      "Combien de couverts préparer par offre pour absorber le pic, que sacrifiez-vous, et que risquez-vous en préparant trop ?",
    diagnosticLabels: [
      "Sur-préparer coûte deux fois : les denrées partent à la poubelle et la marge avec, sur chaque offre",
      "Deux contraintes limitent le service, communes aux quatre offres : la salle et la cuisine d'un côté, les heures de brigade de l'autre",
      "Ce qui n'est pas servi se conserve et se vend au tour suivant",
      "Seule la salle limite le nombre de couverts : la brigade suivra",
    ],
    hintTexts: [
      "Regardez la saisonnalité du segment banquets : quel coefficient s'applique au quatrième trimestre, et que font les autres offres pendant ce temps ?",
      "Les banquets grimpent à 1,85 fois leur niveau ordinaire ; la carte du soir monte aussi, la formule du midi à peine.",
      "Vos deux plafonds sont proches : 9 000 couverts en salle et cuisine, 4 550 heures de brigade (9 100 couverts à une demi-heure chacun), mais un banquet demande 0,45 h et un couvert du soir 0,6 h : le mix décide de la contrainte active.",
      "Préparer plus que ce que vous servirez coûte les denrées perdues, sans aucune contrepartie : rien ne se stocke, sur aucune offre.",
      "Estimez la demande du tour offre par offre, comparez la somme aux deux plafonds, et n'oubliez pas que les banquets règlent à 30 jours et le traiteur à 45 ou 60 : le résultat arrive avant l'encaissement.",
    ],
    modelExplain:
      "L'analyse de capacité met en évidence la double contrainte du métier, salle et brigade, partagée par les quatre offres, puis dimensionne la préparation de chacune sans gâchis.",
  },
  bistrot_detect_idle_cash: {
    title: "La caisse fait le plein, et le traiteur attend",
    narrative:
      "Les clients paient au comptant et la caisse le montre : vous détenez plus d'un trimestre et demi de charges de structure, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an, et facture votre découvert 14 %. Vos fournisseurs seront réglés à vingt et un jours comme d'habitude, et le projet traiteur, lui, attend toujours ses 18 000 €.",
    problem:
      "Cet argent qui dort, faut-il le placer, le mettre dans le traiteur, ou le garder, et jusqu'à quel montant ?",
    diagnosticLabels: [
      "Une trésorerie qui dort ne coûte rien, mais ne rapporte rien non plus : c'est un manque à gagner, que le placement ou un projet peut combler",
      "Le montant bloqué ou investi ne pourra régler aucune facture du trimestre : il faut d'abord chiffrer ce qui va sortir, offre par offre",
      "Puisque le placement rapporte, autant y mettre la totalité du solde",
      "Placer améliore le résultat d'exploitation de l'entreprise",
    ],
    hintTexts: [
      "Comparez votre solde aux charges de structure d'un trimestre : de combien de trimestres d'avance disposez-vous ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro ; un buffet traiteur laisse 15 € de marge, mais seulement une fois l'activité bâtie.",
      "Attention : le placement est bloqué jusqu'au tour suivant, et la R&D du traiteur est une charge du tour. Ni l'un ni l'autre ne réglera ce qui tombera d'ici là.",
      "Projetez les décaissements du trimestre, offre par offre : denrées du midi, du soir et des banquets, salaires de la brigade, loyer. Une partie de ce que vous voyez en caisse appartient déjà à vos fournisseurs.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte sept fois ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ],
    modelExplain:
      "Le budget de trésorerie sépare ce que la caisse détient de ce qu'elle doit déjà, offre par offre, et chiffre ce que coûte de bâtir le traiteur. Dans un métier encaissé au comptant, c'est le seul document qui empêche de confondre avance et excédent.",
  },
};

export const BISTROT_GAMME_SITUATIONS: SituationDef[] = BISTROT_SITUATIONS.map((s) => {
  const patch = PATCHES[s.code];
  const renamed: SituationDef = { ...s, code: CODE(s.code) };
  return patch ? patchSituationText(renamed, patch) : renamed;
});
