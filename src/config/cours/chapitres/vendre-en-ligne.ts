import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_MARCHE_DE_NOVA, POURQUOI_LE_MARCHE_DE_NOVA } from "../monde/mercatique-de-nova";
import {
  CANNIBALISATION_DU_LABORATOIRE,
  FACONS_DE_VENDRE_EN_LIGNE,
  PLACE_DE_MARCHE,
  cannibalisationSupportable,
  trimestreSurLaPlace,
  venteSurLaPlace,
  ventesEnLigne,
} from "../monde/vente-en-ligne-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : VENDRE EN LIGNE, E-COMMERCE, M-COMMERCE, PLACE DE MARCHÉ (Bac STMG, mercatique de terminale,
 * thème 2, question 2.3 : « Le numérique, une autre manière de penser la distribution ? »).
 *
 * NOVA vend déjà en ligne, sur son site, à des particuliers qui paient à la commande. Le chapitre mesure
 * la part du téléphone (le m-commerce), chiffre ce que coûte une place de marché par enceinte vendue, puis
 * l'expérience : une partie des ventes de la plateforme serait prise au site. Le laboratoire cherche la
 * part de ventes prises au site la plus forte qui laisse la place de marché rentable. Le chapitre finit
 * sur la digitalisation des magasins (le magasin connecté de CampusTech) et sur la question du programme.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/vente-en-ligne-de-nova.ts) : les ventes du premier
 * trimestre aux particuliers et la marge de la NOVA One ; la part du mobile et l'offre de la place de
 * marché sont des hypothèses nommées dans la fiche.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

function leSite(): TableauDeDonnees {
  const v = ventesEnLigne();
  return {
    titre: "Les ventes en ligne de NOVA, premier trimestre",
    colonnes: ["Premier trimestre"],
    lignes: [
      { libelle: "Enceintes vendues sur le site", valeurs: [qte(v.ventes)] },
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(v.chiffreDAffaires)] },
      { libelle: "Commandes passées depuis un téléphone", valeurs: [pct(v.partDuMobile * 100)] },
    ],
  };
}

export const VENDRE_EN_LIGNE: Chapitre = {
  code: "vendre-en-ligne",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 2 · La distribution de l'offre"],
  titre: "Vendre en ligne : e-commerce, m-commerce, place de marché",
  accroche:
    "Son site, le téléphone de ses clients, une grande plateforme, la borne d'un magasin : le numérique ouvre des canaux. Ce que chacun coûte, et ce qu'il rapporte vraiment quand il prend des ventes à un autre.",
  objectifs: [
    "Distinguer le e-commerce, le m-commerce et la place de marché",
    "Chiffrer ce que coûte une place de marché par unité vendue",
    "Mesurer ce que rapporte un canal, ventes prises aux autres comprises",
    "Dire ce que le numérique change dans un magasin",
  ],
  libre: false,
  prerequis: ["canaux-de-distribution"],
  entreprises: { codes: ENTREPRISES_DU_MARCHE_DE_NOVA, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une enceinte vendue en ligne",
      notions: ["distribution_commission"],
      tableau: leSite,
      texte: (c) => [
        `${c.entreprise} vend la NOVA One sur son propre site, à des particuliers qui paient par carte à la commande ; l'enceinte part par transporteur. C'est du commerce électronique, le e-commerce : une vente à distance, sans magasin.`,
        "Le numérique ne se limite pas au site : il passe par le téléphone des clients, par de grandes plateformes, et jusque dans les magasins.",
      ],
      repere: () => "Unité commerciale physique : un magasin. Unité commerciale virtuelle : un site ou une application. Une même enseigne peut avoir les deux.",
    },
    {
      id: "site-ou-place",
      objectifs: [0],
      type: "choix",
      titre: "Son site, ou une place de marché",
      notions: ["distribution_commission"],
      question: () => "Quelle différence y a-t-il entre le site de NOVA et une place de marché ?",
      options: () => [
        { texte: "La place réunit d'autres vendeurs", juste: true, retour: "Oui : sur son site, NOVA vend seule et garde tout le prix. Une place de marché est une plateforme où des milliers de vendeurs proposent leurs produits ; elle apporte les visiteurs et prend une commission sur chaque vente." },
        { texte: "Le site vend en ligne, la place vend en magasin", juste: false, retour: "Non : les deux vendent en ligne. Ce qui change, c'est qui tient la vitrine et combien elle coûte." },
        { texte: "Aucune : les deux sont des sites de NOVA", juste: false, retour: "Non : la place de marché appartient à une autre entreprise, qui fixe ses conditions à tous ses vendeurs." },
      ],
    },
    {
      id: "le-m-commerce",
      objectifs: [0],
      type: "montants",
      titre: "Le téléphone, premier canal en ligne",
      notions: ["distribution_commission"],
      tableau: leSite,
      question: () => "Calculez le nombre de commandes passées depuis un téléphone au premier trimestre, arrondi à l'enceinte, puis le chiffre d'affaires de ces commandes.",
      champs: () => {
        const v = ventesEnLigne();
        return [
          { libelle: "Commandes depuis un téléphone", attendu: v.mobile, tolerance: 1, calcul: `${qte(v.ventes)} × ${pct(v.partDuMobile * 100)} = ${qte(v.mobile)}` },
          { libelle: "Chiffre d'affaires du m-commerce", attendu: v.chiffreDuMobile, tolerance: 60, calcul: `${qte(v.mobile)} × ${eur(v.prix)} = ${eur(v.chiffreDuMobile)}` },
        ];
      },
      explication: () => {
        const v = ventesEnLigne();
        return [`${qte(v.mobile)} enceintes sur ${qte(v.ventes)} ont été commandées depuis un téléphone : c'est le m-commerce. Un site qui s'affiche mal sur un petit écran perd la majorité de ses clients.`];
      },
    },
    {
      id: "la-commission",
      objectifs: [1],
      type: "montants",
      titre: "Ce que prend la place de marché",
      notions: ["distribution_commission", "contribution_margin"],
      question: () => {
        const v = venteSurLaPlace();
        return `Une grande plateforme propose de vendre la NOVA One. Elle prend ${pct(PLACE_DE_MARCHE.commission * 100)} du prix hors taxes de ${eur(v.prix)} sur chaque vente, plus ${eur(PLACE_DE_MARCHE.abonnement)} d'abonnement par trimestre. Une enceinte coûte ${eur(v.coutVariable)}. Calculez la commission sur une enceinte, puis la marge qui reste à NOVA.`;
      },
      champs: () => {
        const v = venteSurLaPlace();
        return [
          { libelle: "Commission par enceinte", attendu: v.commission, calcul: `${eur(v.prix)} × ${pct(PLACE_DE_MARCHE.commission * 100)} = ${eur(v.commission)}` },
          { libelle: "Marge qui reste par enceinte", attendu: v.marge, calcul: `${eur(v.prix)} − ${eur(v.commission)} − ${eur(v.coutVariable)} = ${eur(v.marge)}` },
        ];
      },
      explication: () => {
        const v = venteSurLaPlace();
        return [`Sur son site, NOVA garde ${eur(v.margeSurLeSite)} par enceinte ; sur la place de marché, ${eur(v.marge)}. La plateforme se paie cher : elle vaut la peine si elle apporte des clients que le site n'aurait pas eus.`];
      },
    },
    {
      id: "pourquoi-la-place",
      objectifs: [1],
      type: "choix",
      titre: "Pourquoi payer une plateforme",
      notions: ["distribution_commission", "customer_acquisition_cost"],
      question: (c) => `Pourquoi ${c.entreprise} accepterait-elle de garder moins sur chaque enceinte ?`,
      options: () => [
        { texte: "La plateforme attire bien plus de visiteurs", juste: true, retour: "Oui : des millions d'acheteurs passent chaque jour sur une grande place de marché, et lui font confiance pour payer et être livrés. NOVA y achète une audience qu'elle n'a pas." },
        { texte: "La plateforme fixe un prix plus élevé que NOVA", juste: false, retour: "Non : NOVA garde la main sur son prix. Et sur une plateforme, les clients comparent tout de suite les vendeurs." },
        { texte: "La plateforme ne prend rien sur les petites ventes", juste: false, retour: `Non : la commission porte sur chaque vente, ${pct(PLACE_DE_MARCHE.commission * 100)} du prix.` },
      ],
    },
    {
      id: "le-laboratoire-des-ventes-prises",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire des ventes prises au site",
      notions: ["cannibalization", "distribution_commission"],
      question: () => {
        const v = venteSurLaPlace();
        return `NOVA attend ${qte(PLACE_DE_MARCHE.ventesAttendues)} ventes par trimestre sur la place de marché. Mais certaines viendraient de clients qui auraient acheté sur le site, où l'enceinte laisse ${eur(v.margeSurLeSite)} au lieu de ${eur(v.marge)} : c'est la cannibalisation. Faites varier la part des ventes prises au site : le tableau donne la marge des ventes nouvelles, ce que coûtent les ventes prises, et ce qui reste, abonnement payé. Relevez le défi.`;
      },
      leviers: () => [{ code: "prises", libelle: "Part des ventes prises au site", unite: "%", ...CANNIBALISATION_DU_LABORATOIRE, depart: CANNIBALISATION_DU_LABORATOIRE.min }],
      lecture: (_c, p) => {
        const t = trimestreSurLaPlace(p.prises! / 100);
        const d = trimestreSurLaPlace(0);
        return [
          { libelle: "Ventes nouvelles", montant: t.nouvelles, unite: "enceintes", reference: d.nouvelles },
          { libelle: "Marge des ventes nouvelles", montant: t.margeDesNouvelles, reference: d.margeDesNouvelles },
          { libelle: "Marge perdue sur les ventes prises au site", montant: t.perteSurLesPrises, reference: d.perteSurLesPrises },
          { libelle: "Abonnement du trimestre", montant: t.abonnement },
          { libelle: "Ce que la place de marché rapporte", montant: t.gain, reference: d.gain, fort: true },
        ];
      },
      graphique: () => ({
        levier: "prises",
        courbes: [{ libelle: "Ce que la place de marché rapporte", valeur: (p) => trimestreSurLaPlace(p.prises! / 100).gain }],
      }),
      defi: () => {
        const juste = cannibalisationSupportable();
        return {
          consigne: "Trouvez la part de ventes prises au site la plus forte, en pourcentage entier, à laquelle la place de marché rapporte encore quelque chose, abonnement payé.",
          atteint: (p) => p.prises === juste,
          indice: (p) => {
            const t = trimestreSurLaPlace(p.prises! / 100);
            return t.gain >= 0
              ? `À ${pct(p.prises!)}, la place de marché rapporte encore ${eur(t.gain)} : une part plus forte le permettrait-elle ?`
              : `À ${pct(p.prises!)}, la place de marché fait perdre ${eur(-t.gain)} : trop de ventes sont prises au site.`;
          },
          solution: { prises: juste },
        };
      },
      montrer: "Montrer la part",
      explication: (_c, p) => {
        const t = trimestreSurLaPlace(p.prises! / 100);
        const apres = trimestreSurLaPlace((p.prises! + 1) / 100);
        return [
          `Défi relevé : si ${pct(p.prises!)} des ventes de la plateforme sont prises au site, elle rapporte encore ${eur(t.gain)} sur le trimestre. À ${pct(p.prises! + 1)}, elle ferait perdre ${eur(-apres.gain)}.`,
          "Un canal ne se juge pas sur ses ventes, mais sur celles qu'il ajoute : une vente prise à un autre canal plus rentable coûte de la marge.",
        ];
      },
    },
    {
      id: "les-facons-de-vendre",
      objectifs: [0, 3],
      type: "tri",
      titre: "Quatre façons de vendre avec le numérique",
      notions: ["distribution_commission"],
      question: () => "Rangez chaque façon de vendre sous la forme de distribution numérique qu'elle illustre.",
      categories: [
        { code: "e-commerce", libelle: "E-commerce, sur le site du vendeur" },
        { code: "m-commerce", libelle: "M-commerce, sur un téléphone" },
        { code: "place-de-marche", libelle: "Place de marché" },
        { code: "magasin-connecte", libelle: "Magasin connecté" },
      ],
      elements: () => FACONS_DE_VENDRE_EN_LIGNE.map((x) => ({ libelle: x.libelle, montant: 0, categorie: x.code, pourquoi: x.pourquoi })),
      relance: "Où la vente se passe-t-elle : sur le site du vendeur, sur un téléphone, chez une plateforme, ou dans un magasin ?",
      explication: () => ["Le numérique ne remplace pas le magasin : il s'y ajoute et y entre. La borne et le paiement par téléphone digitalisent l'unité commerciale physique."],
    },
    {
      id: "le-magasin-connecte",
      objectifs: [3],
      type: "choix",
      titre: "Le numérique dans le magasin",
      notions: ["distribution_commission"],
      question: () => "CampusTech installe une borne pour commander sur place une couleur de NOVA One absente du rayon, livrée au magasin. Qu'y gagne le magasin ?",
      options: () => [
        { texte: "Une vente qu'il aurait perdue", juste: true, retour: "Oui : le rayon n'a pas toutes les couleurs, mais la borne les rend toutes disponibles. Le client repart avec une commande au lieu de partir sans rien." },
        { texte: "Des clients qui n'ont plus besoin d'entrer", juste: false, retour: "Non : la borne est dans le magasin. Elle sert ceux qui y entrent." },
        { texte: "Un prix plus bas sur chaque enceinte", juste: false, retour: "Non : la borne ne change pas le prix. Elle élargit ce que le magasin peut vendre." },
      ],
    },
    {
      id: "une-autre-maniere",
      objectifs: [2, 3],
      type: "choix",
      titre: "Une autre manière de penser la distribution ?",
      notions: ["cannibalization"],
      question: (c) => `La question du programme : le numérique est-il une autre manière de penser la distribution ? Que répondez-vous pour ${c.entreprise} ?`,
      options: () => [
        { texte: "Oui : les canaux se jugent ensemble", juste: true, retour: `Oui : le numérique multiplie les canaux (site, téléphone, plateforme, borne), et chacun peut prendre des ventes aux autres. NOVA ne se demande plus seulement « combien ce canal vend-il ? », mais « combien ajoute-t-il ? ».` },
        { texte: "Non : c'est un magasin de plus, sur un écran", juste: false, retour: "Non : un canal numérique a ses propres coûts (commission, abonnement), ses propres clients, et il change aussi les magasins. Il ne se pense pas comme une boutique de plus." },
        { texte: "Oui : bientôt, on n'achètera plus qu'en ligne", juste: false, retour: "Non : beaucoup d'achats continuent de se faire en magasin, souvent préparés en ligne. Le numérique s'ajoute aux magasins plus qu'il ne les remplace." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["distribution_commission", "cannibalization"],
      texte: (c) => {
        const v = venteSurLaPlace();
        return [
          `${c.entreprise} vend en ligne sur son site, surtout depuis des téléphones. Une place de marché lui apporterait une audience, contre ${eur(v.commission)} de commission par enceinte et un abonnement : elle ne paie que tant qu'elle ne prend pas trop de ventes au site.`,
          "Dans l'arène, relevez à chaque tour les ventes de chaque clientèle : si vous ouvriez un canal de plus, lesquelles viendraient d'ailleurs ?",
        ];
      },
      repere: () => "Ce que rapporte un canal = marge des ventes qu'il ajoute − marge perdue sur les ventes qu'il prend aux autres − ce qu'il coûte.",
    },
  ],
};
