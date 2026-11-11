import { arrondi2 as auCentime, deuxChemins, eur, nombreAuCentieme, pct } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "../../chapitres/equipe-et-planning";
import { COURBE_SANS_INTEGRATION, DEPART_DE_LA_VENDEUSE, HEURES_D_UN_TEMPS_COMPLET, PASSAGES_PERDUS_PAR_HEURE, retenirLaVendeuse, tableauDeBordDesVendeurs } from "../../monde/equipe-de-la-boutique";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE CLIMAT DE L'ÉQUIPE » : RETENIR LA VENDEUSE (BTS MCO, palier 4).
 *
 * Après le conflit des samedis, la vendeuse à temps partiel de MAILLE & CO demande un samedi libre sur
 * quatre, ou elle démissionne. La responsable trouve la demande coûteuse. L'élève chiffre ce que
 * coûterait son départ (un recrutement, deux semaines sans personne, la courbe d'apprentissage de sa
 * remplaçante), puis ce que coûte sa demande sur un an (ses heures du samedi tenues par le vendeur en
 * heures supplémentaires), et répond : accepter, en roulement pour toute l'équipe, coûte moins que la
 * perdre, et règle la cause du conflit.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : ses chiffres sont ceux de
 * `retenirLaVendeuse` (monde/equipe-de-la-boutique.ts).
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les passages manqués sont une grandeur au centième, sur les
 * passages d'une semaine au centième ; le coût d'un samedi part du salaire horaire au centime
 * (monde/equipe-de-la-boutique.ts) ; les montants, à un centime près (à 10 ou 50 centimes, ou un euro
 * près, avant).
 */

const qte = nombreAuCentieme;
/** « de Malik », « d'Inès » : l'élision devant un prénom à voyelle. */
const dePrenom = (p: string) => (/^[AEIOUYÉÈÊ]/.test(p) ? `d'${p}` : `de ${p}`);
const h = (x: number) => `${qte(x)} h`;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function departDeLaVendeuse(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const r = retenirLaVendeuse(f);
  const v = tableauDeBordDesVendeurs(f).de(DEPART_DE_LA_VENDEUSE.code);
  const remplacant = tableauDeBordDesVendeurs(f).de(DEPART_DE_LA_VENDEUSE.remplacant);
  return { f, r, v, remplacant, accepter: r.parAn < r.depart };
}

function tableauDeLaVendeuse(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = departDeLaVendeuse(c);
  const v = x.v;
  return {
    titre: `${x.f.entreprise} · ${v.prenom}, ${v.poste.toLowerCase()}, en janvier`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Heures de vente par semaine", valeurs: [h(v.heuresDeVente)] },
      { libelle: "Passages en caisse du mois", valeurs: [qte(v.passages)] },
      { libelle: "Objectif atteint", valeurs: [pct(auCentime(v.realisation * 100))] },
      { libelle: "Marge d'un passage en caisse", valeurs: [eur(x.r.margeDUnPassage)] },
    ],
  };
}

export const RETENIR_LA_VENDEUSE: Situation = {
  code: "retenir-la-vendeuse",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["le-climat-de-l-equipe"],
  commanditaire: "La responsable de la boutique",
  titre: "Retenir la vendeuse",
  accroche:
    "Après le conflit des samedis, une vendeuse demande un samedi libre sur quatre, ou elle part. Sa demande coûte des heures supplémentaires. Son départ coûterait un recrutement, des semaines vides et une remplaçante à former.",
  objectifs: [
    "Chiffrer le coût d'un départ : recrutement, poste vacant, courbe d'apprentissage",
    "Chiffrer le coût d'un aménagement du planning sur un an",
    "Répondre en pesant les deux coûts et le climat de l'équipe",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi: "ce cas reprend le chapitre « Le climat de l'équipe », qui se joue à la boutique du cours, MAILLE & CO, et à ses vendeurs.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable",
      tableau: tableauDeLaVendeuse,
      texte: (c) => {
        const x = departDeLaVendeuse(c);
        return [
          `« ${x.v.prenom} veut un samedi libre sur quatre, sinon elle démissionne. Ses ${h(DEPART_DE_LA_VENDEUSE.heuresDuSamedi)} de ce samedi passeraient sur un lundi, où nous avons des heures en trop ; ${x.remplacant.prenom}, le vendeur, tiendrait le samedi en heures supplémentaires, majorées de ${pct(DEPART_DE_LA_VENDEUSE.majoration * 100)}. »`,
          `« Cela me paraît cher. Si elle part, je recrute : comptez le recrutement, ${qte(DEPART_DE_LA_VENDEUSE.semainesDeVacance)} semaines sans personne sur son poste, puis une remplaçante qui fera ${COURBE_SANS_INTEGRATION.map((k) => pct(k * 100)).join(", ")} de ses passages les premières semaines. Que me conseillez-vous ? »`,
          "Pas de cours cette fois : les calculs sont ceux des chapitres, à vous d'en trouver l'ordre.",
        ];
      },
      repere: () => "À rendre : le coût de son départ, le coût de sa demande sur un an, et votre réponse.",
    },
    {
      id: "le-cout-du-depart",
      type: "montants",
      titre: "Ce que coûterait son départ",
      notions: ["staff_turnover", "payroll"],
      question: (c) => {
        const x = departDeLaVendeuse(c);
        return `Le recrutement coûte ${eur(x.r.recrutement)} (chapitre « Recruter, intégrer, former »). Une heure de vente non remplacée fait perdre ${qte(PASSAGES_PERDUS_PAR_HEURE)} passage en caisse. Calculez la marge perdue pendant les semaines sans personne, les passages que la remplaçante ne fera pas pendant son apprentissage (au rythme ${dePrenom(x.v.prenom)}, ${qte(Math.round(x.r.passagesParSemaine * 100) / 100)} passages par semaine), leur marge, puis le coût du départ.`;
      },
      champs: (c) => {
        const x = departDeLaVendeuse(c);
        const r = x.r;
        return [
          { libelle: "Marge perdue, poste vacant", attendu: r.vacance, calcul: `${h(x.v.heuresDeVente)} × ${qte(DEPART_DE_LA_VENDEUSE.semainesDeVacance)} semaines = ${h(r.heuresVacantes)} ; ${h(r.heuresVacantes)} × ${eur(r.margeDUnPassage)} = ${eur(r.vacance)}` },
          { libelle: "Passages manqués à l'apprentissage", nature: "grandeur", attendu: r.manques, calcul: `${qte(r.passagesParSemaine)} × (${COURBE_SANS_INTEGRATION.map((k) => qte(auCentime(1 - k))).join(" + ")}) = ${qte(r.manques)}` },
          { libelle: "Marge perdue à l'apprentissage", attendu: r.apprentissage, calcul: `${qte(r.manques)} × ${eur(r.margeDUnPassage)} = ${eur(r.apprentissage)}` },
          { libelle: "Coût du départ", attendu: r.depart, calcul: `${eur(r.recrutement)} + ${eur(r.vacance)} + ${eur(r.apprentissage)} = ${eur(r.depart)}` },
        ];
      },
      explication: (c) => {
        const x = departDeLaVendeuse(c);
        return [`Perdre ${x.v.prenom} coûterait ${eur(x.r.depart)}, et le plus gros n'est pas le recrutement : ce sont les ventes des semaines vides et celles qu'une nouvelle vendeuse ne sait pas encore faire.`];
      },
    },
    {
      id: "le-cout-de-la-demande",
      type: "montants",
      titre: "Ce que coûte sa demande",
      notions: ["payroll"],
      question: (c) => {
        const x = departDeLaVendeuse(c);
        return `${x.remplacant.prenom} touche ${eur(x.f.equipe.find((s) => s.code === DEPART_DE_LA_VENDEUSE.remplacant)!.brutMensuel)} bruts pour ${h(HEURES_D_UN_TEMPS_COMPLET)} par mois. Calculez son salaire horaire brut (au centime), le coût chargé des ${h(DEPART_DE_LA_VENDEUSE.heuresDuSamedi)} supplémentaires d'un samedi par mois, majorées de ${pct(DEPART_DE_LA_VENDEUSE.majoration * 100)}, puis leur coût sur un an.`;
      },
      champs: (c) => {
        const x = departDeLaVendeuse(c);
        const r = x.r;
        const brut = x.f.equipe.find((s) => s.code === DEPART_DE_LA_VENDEUSE.remplacant)!.brutMensuel;
        const samediSansArrondi = DEPART_DE_LA_VENDEUSE.heuresDuSamedi * (brut / HEURES_D_UN_TEMPS_COMPLET) * (1 + DEPART_DE_LA_VENDEUSE.majoration) * (1 + x.f.tauxPatronal);
        return [
          { libelle: "Salaire horaire brut", attendu: auCentime(r.horaire), calcul: `${eur(brut)} ÷ ${qte(HEURES_D_UN_TEMPS_COMPLET)} = ${eur(auCentime(r.horaire))}` },
          // L'autre chemin : le salaire horaire gardé avec tous ses chiffres, l'arrondi à la fin.
          { libelle: "Coût d'un samedi par mois", ...deuxChemins(r.parMois, samediSansArrondi), calcul: `${h(DEPART_DE_LA_VENDEUSE.heuresDuSamedi)} × ${eur(auCentime(r.horaire))} × ${qte(1 + DEPART_DE_LA_VENDEUSE.majoration)} × ${qte(1 + x.f.tauxPatronal)} = ${eur(r.parMois)}` },
          { libelle: "Coût sur un an", ...deuxChemins(r.parAn, samediSansArrondi * 12), calcul: `${eur(r.parMois)} × 12 = ${eur(r.parAn)}` },
        ];
      },
      explication: (c) => {
        const x = departDeLaVendeuse(c);
        return [`Sa demande coûte ${eur(x.r.parAn)} par an, moins que son départ, ${eur(x.r.depart)}. Ses heures ne sont pas perdues : elles passent sur un lundi, où l'équipe en avait trop.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable",
      notions: ["staff_turnover", "pay_and_motivation"],
      question: () => "Quelle réponse donnez-vous à la responsable ?",
      options: (c) => {
        const x = departDeLaVendeuse(c);
        return [
          {
            texte: "Accepter, et passer les samedis en roulement pour tous",
            juste: x.accepter,
            retour: x.accepter
              ? `Oui : ${eur(x.r.parAn)} par an contre ${eur(x.r.depart)} pour la perdre. Un roulement écrit, annoncé à l'avance, traite toute l'équipe de la même façon et retire au conflit des samedis sa cause.`
              : "Non : sa demande coûte plus que son départ.",
          },
          {
            texte: "Accepter pour elle seule, sans le dire aux autres",
            juste: false,
            retour: "Non : un avantage caché se découvre, et rallume le conflit des samedis. La règle doit être la même pour tous.",
          },
          {
            texte: "Refuser : un samedi libre coûte des heures supplémentaires chaque mois",
            juste: !x.accepter,
            retour: x.accepter
              ? `Non : c'est voir le coût de la demande sans celui du départ. Le départ coûterait ${eur(x.r.depart)}, plus que ${eur(x.r.parAn)} d'heures supplémentaires sur un an.`
              : "Oui : son départ coûterait moins.",
          },
          {
            texte: "Lui proposer une prime pour qu'elle garde ses samedis",
            juste: false,
            retour: "Non : sa demande porte sur son temps, pas sur son salaire. Une prime ne règle ni sa fatigue ni le conflit, et coûte sans retenir.",
          },
        ];
      },
    },
  ],
};
