import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { NOM_DU_RESPONSABLE, syntheseDesEcarts, tableauDesVentes, tableauDuCoutPreetabli, tableauDuTrimestre } from "../../chapitres/analyse-des-ecarts";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'ANALYSE DES ÉCARTS : DU RÉSULTAT PRÉVU AU RÉSULTAT RÉEL » : LE
 * RÉSULTAT QUI MANQUE (contrôle de gestion, palier 4).
 *
 * La directrice générale de NOVA présente les comptes du trimestre au conseil : il manque 47 100 €
 * au résultat. Le directeur commercial accuse l'usine (« le chiffre d'affaires tient son budget à
 * 400 € près, l'usine a dépassé le sien de 42 700 € ») ; la directrice de l'usine accuse les
 * ventes (« nous avons fabriqué plus de Salon, qui coûtent plus cher : le dépassement vient des
 * ventes »). Ces accusations sont l'histoire du cas, des hypothèses que l'élève vérifie : le modèle
 * ne connaît que les écarts.
 *
 * Le cas est neuf par sa question, pas par ses chiffres : il relit les écarts du chapitre
 * (`syntheseDesEcarts`, sur la fiche de l'usine) sous l'angle du conseil. L'élève croise le coût
 * réel avec le budget standard et le préétabli de la production réelle (ce qui revient à ce qui a
 * été vendu, ce qui revient à l'usine), mesure l'effet des ventes, retrouve à rebours la ligne du
 * rendement que le compte rendu de l'usine n'a pas chiffrée, juge la lecture du commercial (elle
 * retombe sur l'écart, mais impute mal), puis rend sa réponse : ce qui revient à chacun.
 *
 * Une expérience, avant le calcul des ventes qu'elle éclaire : le curseur `le-mix` fait varier le
 * nombre de Salon parmi les enceintes vendues (`mixDesVentes`), et l'élève constate qu'une Salon de
 * plus améliore la marge : le reproche de l'usine ne tient pas.
 *
 * Le jugement tient à ceci : les trois partages proposés retombent tous sur 47 100 €. Seul celui
 * qui juge l'usine au préétabli de la production réelle et le volume à la marge préétablie compte
 * chaque écart une fois, chez celui qui le décide.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** Un montant ajouté, entre parenthèses s'il est négatif. */
const entreParentheses = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Les lignes du compte rendu de l'usine, tel qu'il arrive : la ligne du rendement n'est pas chiffrée. */
const LIGNE_NON_CHIFFREE = "Centre de montage : écart sur rendement";

/** Les chiffres du cas, calculés une fois sur la fiche. */
export function resultatQuiManque(c: Pick<Cas, "code">) {
  const s = syntheseDesEcarts(c);
  const e = s.e;
  const manque = auCentime(-e.ecartDeResultat);
  /** Les écarts de l'usine déjà chiffrés dans son compte rendu (réel − prévu, sur une charge). */
  const chiffres = s.lignes.filter((l) => !l.poste.startsWith("Ventes") && l.responsable !== "distribution" && l.poste !== LIGNE_NON_CHIFFREE);
  const sommeDesChiffres = auCentime(chiffres.reduce((t, l) => t + s.brut(l), 0));
  /** L'écart sur rendement, à rebours : l'écart global sur coûts moins les écarts déjà chiffrés. */
  const rendement = auCentime(e.ecartGlobalSurCouts - sommeDesChiffres);
  const heuresPerdues = auCentime(rendement / s.cHm);
  return {
    s,
    e,
    manque,
    chiffres,
    sommeDesChiffres,
    rendement,
    heuresPerdues,
    heuresReelles: auCentime(e.preetabliDuReel.heuresMachine + heuresPerdues),
    mix: mixDesVentes(c),
    /** La lecture du commercial : le chiffre d'affaires face au budget, l'usine face au budget standard. */
    commercial: {
      ventes: e.ventes.ecartDeChiffreDAffaires,
      usine: auCentime(-s.depassementDuBudget),
    },
    /** La lecture de l'usine : le coût de ce qui a été vendu en plus passe aux ventes, qui gardent aussi leur écart sur volume. */
    usine: {
      ventes: auCentime(s.ventes - s.partDuVolume),
      usine: auCentime(s.production + s.partDuVolume),
    },
  };
}

/**
 * L'EXPÉRIENCE DU MIX (le curseur du cas) : les enceintes vendues au trimestre restent en nombre
 * (la Nomade et la Salon ensemble), seul le nombre de Salon parmi elles varie. La marge préétablie
 * des ventes est alors affine dans ce nombre : chaque Salon à la place d'une Nomade apporte la
 * différence de leurs marges préétablies. On cherche le plus petit nombre de Salon qui aurait fait
 * une marge préétablie au moins égale à celle du budget : un écart sur volume nul.
 */
export function mixDesVentes(c: Pick<Cas, "code">) {
  const s = syntheseDesEcarts(c);
  const v = s.e.ventes;
  const total = v.qTotaleReelle;
  const margeAuMix = (salon: number) => auCentime((total - salon) * s.cNomade.marge + salon * s.cSalon.marge);
  const ecartDeMarge = auCentime(s.cSalon.marge - s.cNomade.marge);
  const salonsQuiSuffisent = Math.ceil((v.margePrevue - total * s.cNomade.marge) / ecartDeMarge - 1e-9);
  /** L'écart sur composition, pour un nombre de Salon : chaque modèle face à sa part prévue des ventes réelles. */
  const composition = (salon: number) =>
    auCentime((total - salon - v.auMixPrevu.nomade) * s.cNomade.marge + (salon - v.auMixPrevu.salon) * s.cSalon.marge);
  return {
    total,
    margeAuMix,
    ecartDeMarge,
    salonsQuiSuffisent,
    composition,
    bornes: { min: Math.floor(v.auMixPrevu.salon / 1_000) * 1_000, max: Math.ceil(salonsQuiSuffisent / 1_000) * 1_000 + 1_000 },
  };
}

/** Le compte rendu d'écarts de l'usine, sans la ligne du rendement. */
function compteRenduDeLUsine(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = resultatQuiManque(c);
  const s = x.s;
  return {
    titre: "Le compte rendu d'écarts de l'usine (réel − prévu, sur des charges)",
    colonnes: ["Montant"],
    lignes: [
      ...s.lignes
        .filter((l) => !l.poste.startsWith("Ventes") && l.responsable !== "distribution")
        .map((l) => ({ libelle: l.poste, valeurs: [l.poste === LIGNE_NON_CHIFFREE ? "pas encore chiffré" : eur(s.brut(l))] })),
      { libelle: "Coût standard d'une heure-machine", valeurs: [eur(s.cHm)] },
      { libelle: `Heures-machine d'une ${s.nomade.nom}`, valeurs: [qte(s.nomade.heuresMachineParUnite)] },
      { libelle: `Heures-machine d'une ${s.salon.nom}`, valeurs: [qte(s.salon.heuresMachineParUnite)] },
    ],
  };
}

export const LE_RESULTAT_QUI_MANQUE: Situation = {
  code: "le-resultat-qui-manque",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["analyse-des-ecarts"],
  commanditaire: "La directrice générale",
  titre: "Le résultat qui manque",
  accroche:
    "Il manque un gros morceau du résultat du trimestre. Les commerciaux accusent l'usine, l'usine accuse les commerciaux. La directrice générale doit dire au conseil ce qui revient à chacun.",
  objectifs: [
    "Juger l'usine au coût préétabli de la production réelle, et non au budget de départ",
    "Mesurer l'effet des ventes sur le résultat, le volume à la marge préétablie",
    "Retrouver à rebours un écart que le compte rendu n'a pas chiffré",
    "Montrer qu'un partage qui retombe sur l'écart peut rester faux, et rendre le bon",
  ],
  libre: false,
  entreprises: {
    codes: ["nova"],
    pourquoi:
      "ce cas reprend le chapitre « L'analyse des écarts », qui rassemble le contrôle budgétaire de l'usine de NOVA, ses coûts préétablis et son centre de montage.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Les comptes du trimestre au conseil",
      tableau: tableauDuTrimestre,
      texte: (c) => {
        const x = resultatQuiManque(c);
        const s = x.s;
        return [
          `« Jeudi, je présente les comptes du trimestre au conseil de ${s.f.entreprise}. Le résultat devait être de ${eur(x.e.resultatPrevu)} ; il est de ${eur(x.e.resultatReel)}. Il manque ${eur(x.manque)}, et chacun accuse l'autre. »`,
          `« Le directeur commercial m'écrit : "Le chiffre d'affaires tient son budget à ${eur(-x.commercial.ventes)} près. C'est l'usine qui a dépassé le sien de ${eur(-x.commercial.usine)}." La directrice de l'usine répond : "Nous avons fabriqué ce que les commerciaux ont vendu, et ils ont vendu plus de ${s.salon.nom}, qui coûtent bien plus cher à fabriquer. Le dépassement vient des ventes." »`,
          "« L'usine m'a envoyé son compte rendu d'écarts, mais l'atelier n'a pas encore chiffré la ligne du rendement. Dites-moi ce qui revient à chacun, chiffres à l'appui : c'est ce que je dirai au conseil. »",
          "Pas de cours cette fois : les calculs sont ceux du chapitre. Un écart est le réel moins le prévu ; sur une charge, positif, il est défavorable.",
        ];
      },
      repere: () =>
        "À rendre : ce que l'usine doit vraiment au résultat, l'effet des ventes, la ligne du rendement retrouvée, et votre réponse au conseil.",
    },
    {
      id: "le-cout-du-reel",
      type: "montants",
      titre: "Ce dont l'usine répond",
      notions: ["standard_costing", "cost_variance"],
      tableau: tableauDuCoutPreetabli,
      question: (c) => {
        const x = resultatQuiManque(c);
        return `Le coût réel de production dépasse le budget standard de ${eur(x.s.depassementDuBudget)}. Séparez ce dépassement : le coût préétabli de ce que l'usine a vraiment fabriqué, la part du dépassement qui vient de ce qui a été vendu, puis l'écart dont l'usine répond (positif s'il est défavorable).`;
      },
      champs: (c) => {
        const x = resultatQuiManque(c);
        const s = x.s;
        const r = s.f.realise;
        return [
          {
            libelle: "Coût préétabli de la production réelle",
            attendu: x.e.preetabliDuReel.total,
            calcul: `${qte(r.ventes.nomade.quantite)} × ${eur(s.cNomade.total)} + ${qte(r.ventes.salon.quantite)} × ${eur(s.cSalon.total)} = ${eur(x.e.preetabliDuReel.total)}`,
          },
          {
            libelle: "Part du dépassement venue de ce qui a été vendu",
            attendu: s.partDuVolume,
            calcul: `${eur(x.e.preetabliDuReel.total)} − ${eur(x.e.budgetStandard.total)} = ${eur(s.partDuVolume)}`,
          },
          {
            libelle: "Écart global sur coûts, dont l'usine répond",
            attendu: x.e.ecartGlobalSurCouts,
            calcul: `${eur(x.e.reelTotal)} − ${eur(x.e.preetabliDuReel.total)} = ${eur(x.e.ecartGlobalSurCouts)}, soit ${eur(s.depassementDuBudget)} − ${eur(s.partDuVolume)}`,
          },
        ];
      },
      explication: (c) => {
        const x = resultatQuiManque(c);
        return [
          `La directrice de l'usine a raison pour ${eur(x.s.partDuVolume)} : c'est le coût préétabli de ce qui a été vendu à la place du budget. Mais à production réelle, l'usine a coûté ${eur(x.e.ecartGlobalSurCouts)} de plus que son préétabli : cela, les ventes n'y sont pour rien.`,
        ];
      },
    },
    {
      id: "le-mix",
      type: "curseur",
      titre: "Trop de Salon ?",
      notions: ["volume_price_variance", "contribution_margin"],
      question: (c) => {
        const x = resultatQuiManque(c);
        const s = x.s;
        return `La directrice de l'usine reproche aux commerciaux d'avoir vendu trop de ${s.salon.nom}. Faites tourner les ventes : les ${qte(x.mix.total)} enceintes vendues restent en nombre, déplacez seulement le nombre de ${s.salon.nom} parmi elles. Placez le curseur sur le plus petit nombre de ${s.salon.nom} qui aurait fait une marge préétablie au moins égale à celle du budget.`;
      },
      grandeur: (c) => ({ libelle: `Enceintes ${syntheseDesEcarts(c).salon.nom} vendues`, unite: "enceintes" }),
      cible: (c) => {
        const m = mixDesVentes(c);
        return { attendu: m.salonsQuiSuffisent, ...m.bornes };
      },
      lecture: (c, salon) => {
        const s = syntheseDesEcarts(c);
        const m = mixDesVentes(c);
        const composition = m.composition(salon);
        return [
          { libelle: "Écart sur quantité globale", montant: s.e.ventes.quantiteGlobale },
          { libelle: "Écart sur composition", montant: composition },
          { libelle: "Écart sur volume", montant: auCentime(s.e.ventes.quantiteGlobale + composition), fort: true },
        ];
      },
      droites: (c) => {
        const s = syntheseDesEcarts(c);
        const m = mixDesVentes(c);
        return { produit: (salon) => m.margeAuMix(salon), cout: () => s.e.ventes.margePrevue, libelles: ["Marge préétablie des ventes", "Marge préétablie du budget"] };
      },
      zones: ["Volume favorable", "Volume défavorable"],
      rates: () => ({
        dessous: "Avec si peu de Salon, la marge préétablie des ventes reste sous celle du budget : vendez-en plus.",
        dessus: "Un cran plus bas, la marge du budget est déjà atteinte : cherchez le plus petit nombre qui suffit.",
      }),
      montrer: "Montrer le nombre qui suffit",
      explication: (c) => {
        const x = resultatQuiManque(c);
        const s = x.s;
        const v = x.e.ventes;
        const enPlus = auCentime(s.f.realise.ventes.salon.quantite - v.auMixPrevu.salon);
        return [
          `Chaque ${s.salon.nom} vendue à la place d'une ${s.nomade.nom} apporte ${eur(x.mix.ecartDeMarge)} de marge préétablie. À la composition du budget, ${qte(v.auMixPrevu.salon)} ${s.salon.nom}, l'écart sur volume serait de ${eur(v.quantiteGlobale)} ; les ${qte(enPlus)} ${s.salon.nom} vendues en plus l'ont ramené à ${eur(v.volume)}, et il en aurait fallu ${qte(x.mix.salonsQuiSuffisent)} pour l'annuler.`,
          `Les ${s.salon.nom} coûtent plus cher à fabriquer, mais ce coût est déjà dans leur coût préétabli : au résultat, elles n'ont rien coûté, elles ont sauvé ${eur(v.composition)} de marge. Le reproche de l'usine ne tient pas.`,
        ];
      },
    },
    {
      id: "les-ventes",
      type: "montants",
      titre: "Ce que les ventes font au résultat",
      notions: ["volume_price_variance", "contribution_margin"],
      tableau: tableauDesVentes,
      question: () =>
        "Mesurez ce que les ventes ont fait au résultat : l'écart sur prix de vente, l'écart sur volume, puis leur somme. Négatif pour un écart défavorable.",
      champs: (c) => {
        const x = resultatQuiManque(c);
        const s = x.s;
        const r = s.f.realise;
        const v = x.e.ventes;
        return [
          {
            libelle: "Écart sur prix de vente",
            attendu: v.prix,
            calcul: `(${eur(r.ventes.nomade.prix)} − ${eur(s.nomade.prixPrevu)}) × ${qte(r.ventes.nomade.quantite)} + (${eur(r.ventes.salon.prix)} − ${eur(s.salon.prixPrevu)}) × ${qte(r.ventes.salon.quantite)} = ${eur(v.prix)}`,
          },
          {
            libelle: "Écart sur volume, à la marge préétablie",
            attendu: v.volume,
            calcul: `(${qte(r.ventes.nomade.quantite)} − ${qte(s.nomade.quantitePrevue)}) × ${eur(s.cNomade.marge)} + (${qte(r.ventes.salon.quantite)} − ${qte(s.salon.quantitePrevue)}) × ${eur(s.cSalon.marge)} = ${eur(v.volume)}`,
          },
          {
            libelle: "Effet des ventes sur le résultat",
            attendu: s.ventes,
            calcul: `${eur(v.prix)} + ${entreParentheses(v.volume)} = ${eur(s.ventes)}`,
          },
        ];
      },
      explication: (c) => {
        const x = resultatQuiManque(c);
        const v = x.e.ventes;
        return [
          `Le chiffre d'affaires cache deux écarts qui se compensent : ${eur(v.prix)} sur les prix, la ${x.s.nomade.nom} cédée sous son prix, et ${eur(v.quantiteSurChiffreDAffaires)} sur les quantités au prix de vente. Au résultat, le volume ne vaut que sa marge préétablie, ${eur(v.volume)} : les ventes coûtent ${eur(-x.s.ventes)}, et non ${eur(-x.commercial.ventes)}.`,
        ];
      },
    },
    {
      id: "la-ligne-du-rendement",
      type: "montants",
      titre: "La ligne que l'usine n'a pas chiffrée",
      notions: ["efficiency_variance", "cost_variance"],
      tableau: compteRenduDeLUsine,
      question: () =>
        "Retrouvez à rebours la ligne du rendement : l'écart sur rendement du centre de montage (positif s'il est défavorable), les heures-machine qu'il représente, puis les heures-machine réellement passées au centre.",
      champs: (c) => {
        const x = resultatQuiManque(c);
        const s = x.s;
        const r = s.f.realise;
        return [
          {
            libelle: "Écart sur rendement",
            attendu: x.rendement,
            calcul: `l'écart global sur coûts moins les écarts déjà chiffrés : ${eur(x.e.ecartGlobalSurCouts)} − ${eur(x.sommeDesChiffres)} = ${eur(x.rendement)}`,
          },
          {
            libelle: "Heures-machine perdues",
            attendu: x.heuresPerdues,
            calcul: `${eur(x.rendement)} ÷ ${eur(s.cHm)} = ${qte(x.heuresPerdues)}`,
          },
          {
            libelle: "Heures-machine réelles du centre",
            attendu: x.heuresReelles,
            calcul: `${qte(r.ventes.nomade.quantite)} × ${qte(s.nomade.heuresMachineParUnite)} + ${qte(r.ventes.salon.quantite)} × ${qte(s.salon.heuresMachineParUnite)} = ${qte(x.e.preetabliDuReel.heuresMachine)} préétablies, plus ${qte(x.heuresPerdues)} : ${qte(x.heuresReelles)}`,
          },
        ];
      },
      explication: (c) => {
        const x = resultatQuiManque(c);
        const s = x.s;
        return [
          `L'atelier a passé ${qte(x.heuresPerdues)} heures-machine de trop. Elles expliquent aussi une part du boni de suractivité que le compte rendu affiche (${eur(-x.e.centre.activite)}) : ${qte(x.heuresPerdues)} × ${eur(s.partFixe)} = ${eur(s.boniDesHeuresPerdues)}. Ce boni n'est pas une économie à porter à son crédit.`,
        ];
      },
    },
    {
      id: "la-preuve",
      type: "choix",
      titre: "Un total qui retombe",
      notions: ["volume_price_variance", "cost_variance"],
      question: (c) => {
        const x = resultatQuiManque(c);
        return `Le directeur commercial fait remarquer que sa lecture retombe, elle aussi, sur l'écart : ${eur(x.commercial.ventes)} pour les ventes, ${eur(x.commercial.usine)} pour l'usine, ${eur(x.s.distribution)} pour la distribution, soit ${eur(x.e.ecartDeResultat)}. Sa lecture est-elle juste pour autant ?`;
      },
      options: (c) => {
        const x = resultatQuiManque(c);
        const s = x.s;
        return [
          {
            texte: "Non : un total qui retombe prouve le calcul, pas le partage",
            juste: true,
            retour: `C'est cela. Les mêmes ${eur(s.partDuVolume)} passent d'un camp à l'autre : le chiffre d'affaires valorise le volume au prix de vente, le budget standard laisse son coût à l'usine. Les deux erreurs se compensent dans le total. Au préétabli de la production réelle et à la marge préétablie, le volume revient à qui le décide, le commercial.`,
          },
          {
            texte: "Oui : deux lectures qui donnent le même total sont deux façons justes de partager l'écart",
            juste: false,
            retour: `Le total ne dit rien du partage : ${eur(s.partDuVolume)} de coût préétabli des ventes changent de camp selon la lecture. Or l'usine ne décide pas de ce qui est vendu.`,
          },
          {
            texte: `Non : sa lecture ne retombe pas, elle oublie l'écart sur prix de vente de ${eur(x.e.ventes.prix)}`,
            juste: false,
            retour: `Elle retombe bien : l'écart sur prix de vente est déjà dans l'écart sur chiffre d'affaires, ${eur(x.commercial.ventes)}. L'ajouter encore, ce serait le compter deux fois.`,
          },
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au conseil",
      notions: ["cost_variance", "volume_price_variance"],
      question: (c) => {
        const x = resultatQuiManque(c);
        return `Sur les ${eur(x.manque)} qui manquent, que répondez-vous au conseil ?`;
      },
      // La bonne réponse n'est pas la plus longue : les deux autres partages retombent aussi sur l'écart.
      options: (c) => {
        const x = resultatQuiManque(c);
        const s = x.s;
        const ordre = s.ordre.filter((r) => r !== "commercial" && r !== "distribution" && s.parResponsable[r] < 0);
        const usine = ordre.map((r) => `${minuscule(NOM_DU_RESPONSABLE[r])} ${eur(s.parResponsable[r])}`).join(", ");
        const detail = `Les ventes : ${eur(x.e.ventes.prix)} sur les prix, ${eur(x.e.ventes.volume)} sur le volume. L'usine se partage entre ${usine}, et la direction ${eur(s.parResponsable.direction)} de boni d'activité, dont ${eur(s.boniDesHeuresPerdues)} viennent d'heures perdues.`;
        return [
          {
            texte: `L'usine en porte ${eur(-s.production)}, les ventes ${eur(-s.ventes)}, la distribution ${eur(-s.distribution)}`,
            juste: true,
            retour: `Oui. ${detail} Les deux camps ont chacun une part : l'usine pèse plus au total, mais le commercial porte à lui seul le plus gros écart, ${eur(-s.parResponsable.commercial)}.`,
          },
          {
            texte: `Les commerciaux ont raison : le chiffre d'affaires tient, l'usine a dépassé son budget de ${eur(-x.commercial.usine)}`,
            juste: false,
            retour: `C'est juger l'usine au budget de départ et le volume au prix de vente : ${eur(s.partDuVolume)} de coût préétabli des ventes passent à l'usine. ${detail}`,
          },
          {
            texte: `Les ventes en portent ${eur(-x.usine.ventes)} avec le surcoût des ${s.salon.nom}, l'usine ${eur(-x.usine.usine)}, la distribution ${eur(-s.distribution)}`,
            juste: false,
            retour: `C'est compter deux fois le volume : les ${eur(s.partDuVolume)} du surcoût des ${s.salon.nom} sont déjà dans l'écart sur volume, valorisé à la marge préétablie. ${detail}`,
          },
        ];
      },
    },
  ],
};
