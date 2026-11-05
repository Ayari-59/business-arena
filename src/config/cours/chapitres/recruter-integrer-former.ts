import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  AFFLUENCE_DE_DECEMBRE,
  AVENANTS_POSSIBLES,
  BRUT_HORAIRE_DU_RENFORT,
  COEFFICIENT_DE_L_INTERIM,
  COURBE_AVEC_INTEGRATION,
  COURBE_SANS_INTEGRATION,
  FORMATION,
  FORMES,
  HEURES_DE_TUTORAT,
  HEURES_D_UN_CDD,
  HEURES_PAR_AVENANT,
  INDEMNITE_DE_CONGES_PAYES,
  INDEMNITE_DE_FIN_DE_CONTRAT,
  LEVIERS_DU_RENFORT,
  PASSAGES_PAR_HEURE_EN_DECEMBRE,
  RECRUTEMENT,
  SEMAINES_DE_RENFORT,
  besoinDeDecembre,
  coutDUnCdd,
  coutDuRecrutement,
  formationALaVenteAdditionnelle,
  integration,
  meilleurRenfort,
  renfortDeDecembre,
} from "../monde/equipe-de-la-boutique";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe, tableauDeLEquipe } from "./equipe-et-planning";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : RECRUTER, INTÉGRER, FORMER (BTS MCO, bloc 4, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts, son équipe
 * et son planning) et le module de son équipe (monde/equipe-de-la-boutique.ts : le renfort de
 * décembre, le coût d'un CDD, d'un avenant, de l'intérim, d'un recrutement, la courbe d'apprentissage,
 * la formation). Une évolution du moteur ne change rien ici.
 *
 * L'objet : en décembre, l'affluence monte à 1,8 fois celle de janvier, et le planning manque d'heures.
 * Le chapitre part de ce besoin (equipe-et-planning), choisit le contrat (un avenant aux temps
 * partiels, un CDD pour accroissement temporaire d'activité, l'intérim), chiffre le recrutement, puis
 * l'intégration du nouveau vendeur (sa courbe d'apprentissage) et une formation à la vente
 * additionnelle. Le droit du recrutement s'y lit par ce qu'il change à la décision : le motif du CDD
 * et ses indemnités, la non-discrimination à l'entretien, la période d'essai, la déclaration préalable.
 *
 * Le piège central : le contrat le moins cher à l'heure n'est pas le moins cher à la fin, il faut
 * compter le recrutement ; et un nouveau vendeur ne vend pas comme l'équipe la première semaine.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, le-besoin-de-decembre, le-cout-d-un-cdd (la formule est dans la question) ;
 *   · l'expérience avant la formule : predire-le-renfort puis le-laboratoire-du-renfort (avenants, CDD,
 *     intérim ; le coût selon les heures d'intérim) avant quel-renfort-retenir ;
 *   · autonome : le-cout-du-recrutement, la-courbe-d-apprentissage, la-formation ;
 *   · expert : quel-motif, l-entretien, la-periode-d-essai, l-integration, le-plan-de-formation,
 *     quel-renfort-retenir ; puis la synthèse.
 *
 * Le droit cité (Code du travail, 2026) : le CDD pour accroissement temporaire d'activité, son
 * indemnité de fin de contrat de 10 % et l'indemnité compensatrice de congés payés de 10 % ; la
 * non-discrimination à l'embauche (art. L1132-1) ; la période d'essai d'un CDD de six mois au plus,
 * un jour par semaine dans la limite de deux semaines ; la déclaration préalable à l'embauche (DPAE)
 * avant la prise de poste ; la formation d'adaptation au poste, sur le temps de travail.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const h = (x: number) => `${qte(x)} h`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

const POURQUOI =
  "ce chapitre se joue à la boutique du cours, MAILLE & CO : son équipe, son planning et son affluence sont ceux des autres chapitres du parcours.";

/** Tout ce que le chapitre lit, calculé une fois du cas. */
export function recruterIntegrerFormer(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const b = besoinDeDecembre(f);
  const cdd = coutDUnCdd(f);
  const rec = coutDuRecrutement(f);
  const meilleur = meilleurRenfort(f);
  const i = integration(f);
  const fo = formationALaVenteAdditionnelle(f);
  const avenant = auCentime(BRUT_HORAIRE_DU_RENFORT * (1 + f.tauxPatronal));
  const interim = auCentime(BRUT_HORAIRE_DU_RENFORT * COEFFICIENT_DE_L_INTERIM);
  return {
    f,
    b,
    cdd,
    cddParHeure: auCentime(cdd.parHeure),
    cddAvecRecrutementParHeure: auCentime((cdd.cout + rec.total) / cdd.heures),
    rec,
    meilleur,
    toutEnInterim: renfortDeDecembre(f, { avenants: 0, cdd: 0, interim: b.aCouvrir }),
    deuxCdd: renfortDeDecembre(f, { avenants: LEVIERS_DU_RENFORT.avenants.max, cdd: 2, interim: 0 }),
    i,
    fo,
    avenant,
    interim,
  };
}

export type RecruterIntegrerFormer = ReturnType<typeof recruterIntegrerFormer>;

export const RECRUTER_INTEGRER_FORMER: Chapitre = {
  code: "recruter-integrer-former",
  parcours: "mco",
  palier: 4,
  blocs: ["BTS MCO Bloc 4 · Manager l'équipe commerciale"],
  titre: "Recruter, intégrer, former",
  accroche:
    "En décembre, la boutique manque de bras. Un avenant, un CDD ou l'intérim : ce que coûte chaque heure, recrutement compris. Puis ce qu'un nouveau vendeur ne vend pas la première semaine, et ce qu'une formation rapporte.",
  objectifs: [
    "Diagnostiquer un besoin de recrutement à partir du planning et de l'affluence",
    "Comparer le coût d'un avenant, d'un CDD et de l'intérim, recrutement compris",
    "Chiffrer le coût de l'intégration d'un nouveau vendeur et ce qu'elle rapporte",
    "Calculer le coût et le retour d'une formation",
    "Appliquer les règles du recrutement : motif du contrat, non-discrimination, période d'essai, déclaration",
  ],
  libre: false,
  prerequis: ["equipe-et-planning"],
  ensuite: ["remunerer-et-stimuler-les-vendeurs"],
  entreprises: { codes: ENTREPRISES_DU_POINT_DE_VENTE, pourquoi: POURQUOI },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le renfort de décembre",
      notions: ["payroll", "capacity"],
      tableau: tableauDeLEquipe,
      texte: (c) => {
        const x = recruterIntegrerFormer(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. En décembre, les clients viennent chercher un cadeau : l'affluence monte à ${qte(AFFLUENCE_DE_DECEMBRE)} fois celle de janvier, créneau par créneau.`,
          "Recruter suit des étapes : diagnostiquer le besoin, définir le poste et le profil, choisir le contrat, chercher les candidats. On les cherche en interne, par une annonce, à France Travail, par une agence d'intérim ou le réseau de l'équipe. Puis on trie, on conduit les entretiens et un jeu de rôle de vente, et on intègre.",
          "Le manager se pose trois questions : combien d'heures manquent, quel contrat les couvre au moindre coût, et combien de temps le nouveau vendeur mettra à vendre comme l'équipe.",
        ];
      },
      repere: () => "Le besoin d'un créneau = le plus grand de la présence minimale et des entrées ÷ entrées par vendeur, arrondi au-dessus (chapitre « L'équipe et son planning »).",
    },
    {
      id: "le-besoin-de-decembre",
      objectifs: [0],
      type: "montants",
      titre: "Les heures qui manquent",
      notions: ["capacity"],
      question: (c) => {
        const x = recruterIntegrerFormer(c);
        return `À ${qte(AFFLUENCE_DE_DECEMBRE)} fois l'affluence de janvier, l'affluence demande ${h(x.b.besoin - x.f.reglesDuPlanning.tachesHorsVente)} de vente par semaine, plus ${h(x.f.reglesDuPlanning.tachesHorsVente)} de tâches hors vente. Calculez le besoin de la semaine, les heures que les contrats donnent, puis les heures à couvrir chaque semaine de décembre.`;
      },
      champs: (c) => {
        const x = recruterIntegrerFormer(c);
        return [
          { libelle: "Besoin de la semaine", attendu: x.b.besoin, calcul: `${h(x.b.besoin - x.f.reglesDuPlanning.tachesHorsVente)} + ${h(x.f.reglesDuPlanning.tachesHorsVente)} = ${h(x.b.besoin)}` },
          { libelle: "Heures des contrats", attendu: x.b.contrats, calcul: `Les ${qte(x.f.equipe.length)} contrats : ${x.f.equipe.map((s) => qte(s.heuresParSemaine)).join(" + ")} = ${h(x.b.contrats)}` },
          { libelle: "Heures à couvrir par semaine", attendu: x.b.aCouvrir, calcul: `${h(x.b.besoin)} − ${h(x.b.contrats)} = ${h(x.b.aCouvrir)}, aucun créneau n'ayant d'heures en trop à déplacer` },
        ];
      },
      explication: (c) => {
        const x = recruterIntegrerFormer(c);
        return [
          `Il manque ${h(x.b.aCouvrir)} par semaine pendant ${qte(SEMAINES_DE_RENFORT)} semaines. En janvier, déplacer les heures suffisait ; en décembre, chaque créneau est déjà plein : il faut des heures en plus.`,
          "Le besoin est temporaire. Il ne justifie pas un CDI : le contrat doit finir avec la saison.",
        ];
      },
    },
    {
      id: "quel-motif",
      objectifs: [4],
      type: "choix",
      titre: "Quel contrat pour décembre ?",
      notions: ["payroll"],
      question: () => "Pour un vendeur de plus pendant les quatre semaines de décembre, quel contrat la boutique peut-elle signer ?",
      options: () => [
        {
          texte: "Un CDD pour accroissement temporaire d'activité",
          juste: true,
          retour: `Oui : le pic de Noël est un surcroît d'activité qui finit avec la saison. Le CDD ouvre, à sa fin, une indemnité de fin de contrat de ${pct(INDEMNITE_DE_FIN_DE_CONTRAT * 100)} des salaires et une indemnité de congés payés de ${pct(INDEMNITE_DE_CONGES_PAYES * 100)}. Le motif s'écrit dans le contrat.`,
        },
        {
          texte: "Un CDI, rompu pendant la période d'essai en janvier",
          juste: false,
          retour: "Non : la période d'essai sert à juger le salarié, pas à finir une saison. La rompre pour ce motif serait abusif.",
        },
        {
          texte: "Un CDD sans motif, puisqu'il dure moins d'un mois",
          juste: false,
          retour: "Non : un CDD a toujours un motif écrit, quelle que soit sa durée. Sans motif, il est requalifié en CDI.",
        },
      ],
    },
    {
      id: "le-profil-de-poste",
      objectifs: [0, 4],
      type: "choix",
      titre: "Le profil de poste et l'annonce",
      notions: ["training"],
      question: () =>
        "La fiche de poste décrit les missions (accueillir, conseiller, encaisser, réassortir le rayon) ; le profil dit qui peut les tenir. Quelle annonce la responsable publie-t-elle pour le CDD de décembre ?",
      options: () => [
        {
          texte: "Vendeur, l'accueil, libre le samedi",
          juste: true,
          retour: "Oui : le profil suit le poste. Les savoir-faire (conseiller, encaisser), les savoir-être (l'accueil) et la disponibilité qu'exige le planning. La grille d'entretien reprendra les mêmes critères, pour chaque candidat.",
        },
        {
          texte: "Vendeuse de moins de 30 ans, dynamique et souriante",
          juste: false,
          retour: "Non : l'âge et le sexe sont des critères discriminatoires, interdits dans une annonce comme dans le choix. Le profil décrit des compétences, pas une personne.",
        },
        {
          texte: "Titulaire d'un BTS MCO avec 5 ans d'expérience",
          juste: false,
          retour: "Non : c'est le profil d'un adjoint, pas d'un renfort de quatre semaines. Un profil trop exigeant écarte de bons candidats et se paie plus cher.",
        },
      ],
    },
    {
      id: "le-cout-d-un-cdd",
      objectifs: [1],
      type: "montants",
      titre: "Le coût d'un CDD de décembre",
      notions: ["payroll"],
      question: (c) => {
        const x = recruterIntegrerFormer(c);
        return `Un CDD de ${h(HEURES_D_UN_CDD)} par semaine pendant ${qte(SEMAINES_DE_RENFORT)} semaines, à ${eur(BRUT_HORAIRE_DU_RENFORT)} bruts de l'heure. Calculez les salaires bruts, l'indemnité de fin de contrat (${pct(INDEMNITE_DE_FIN_DE_CONTRAT * 100)} des salaires), l'indemnité de congés payés (${pct(INDEMNITE_DE_CONGES_PAYES * 100)} des salaires et de l'indemnité de fin de contrat), puis le coût chargé (${pct(x.f.tauxPatronal * 100)} de cotisations patronales) et le coût d'une heure travaillée.`;
      },
      champs: (c) => {
        const x = recruterIntegrerFormer(c);
        const k = x.cdd;
        return [
          { libelle: "Salaires bruts", attendu: k.salaires, calcul: `${h(k.heures)} × ${eur(BRUT_HORAIRE_DU_RENFORT)} = ${eur(k.salaires)}` },
          { libelle: "Indemnité de fin de contrat", attendu: k.finDeContrat, calcul: `${eur(k.salaires)} × ${pct(INDEMNITE_DE_FIN_DE_CONTRAT * 100)} = ${eur(k.finDeContrat)}` },
          { libelle: "Indemnité de congés payés", attendu: k.congesPayes, calcul: `(${eur(k.salaires)} + ${eur(k.finDeContrat)}) × ${pct(INDEMNITE_DE_CONGES_PAYES * 100)} = ${eur(k.congesPayes)}` },
          { libelle: "Coût chargé du CDD", attendu: k.cout, calcul: `${eur(k.brut)} × ${qte(1 + x.f.tauxPatronal)} = ${eur(k.cout)}` },
          { libelle: "Coût d'une heure travaillée", attendu: x.cddParHeure, tolerance: 0.02, calcul: `${eur(k.cout)} ÷ ${h(k.heures)} = ${eur(x.cddParHeure)}` },
        ];
      },
      explication: (c) => {
        const x = recruterIntegrerFormer(c);
        return [
          `Une heure de CDD coûte ${eur(x.cddParHeure)}, contre ${eur(x.avenant)} pour une heure d'avenant d'un temps partiel de l'équipe : les deux indemnités de fin de contrat pèsent ${pct(auDixieme((x.cdd.brut / x.cdd.salaires - 1) * 100))} du salaire. L'intérim facture ${eur(x.interim)} l'heure, indemnités comprises.`,
        ];
      },
    },
    {
      id: "le-cout-du-recrutement",
      objectifs: [1],
      type: "montants",
      titre: "Ce que coûte un recrutement",
      notions: ["payroll"],
      question: (c) => {
        const x = recruterIntegrerFormer(c);
        return `Sans formule cette fois. Le recrutement demande une annonce à ${eur(RECRUTEMENT.annonce)}, ${h(RECRUTEMENT.heuresDeTri)} de la responsable pour trier les candidatures (${eur(auCentime(x.rec.tauxResponsable))} de l'heure, chargée), et ${qte(RECRUTEMENT.entretiens)} entretiens de 45 minutes menés par la responsable et l'adjointe (${eur(auCentime(x.rec.tauxAdjointe))} de l'heure). Combien coûtent le tri, les entretiens, puis le recrutement ? Que coûte alors une heure du CDD, recrutement compris ?`;
      },
      champs: (c) => {
        const x = recruterIntegrerFormer(c);
        const r = x.rec;
        return [
          { libelle: "Tri des candidatures", attendu: r.tri, tolerance: 0.05, calcul: `${h(RECRUTEMENT.heuresDeTri)} × ${eur(auCentime(r.tauxResponsable))} = ${eur(r.tri)}` },
          { libelle: "Entretiens", attendu: r.entretiens, tolerance: 0.1, calcul: `${qte(RECRUTEMENT.entretiens)} × ${qte(RECRUTEMENT.dureeDUnEntretien)} h × (${eur(auCentime(r.tauxResponsable))} + ${eur(auCentime(r.tauxAdjointe))}) = ${eur(r.entretiens)}` },
          { libelle: "Coût du recrutement", attendu: r.total, tolerance: 0.1, calcul: `${eur(r.annonce)} + ${eur(r.tri)} + ${eur(r.entretiens)} = ${eur(r.total)}` },
          { libelle: "Heure du CDD, recrutement compris", attendu: x.cddAvecRecrutementParHeure, tolerance: 0.02, calcul: `(${eur(x.cdd.cout)} + ${eur(r.total)}) ÷ ${h(x.cdd.heures)} = ${eur(x.cddAvecRecrutementParHeure)}` },
        ];
      },
      explication: (c) => {
        const x = recruterIntegrerFormer(c);
        return [
          `Le recrutement ajoute ${eur(x.rec.total)} au CDD, une charge fixe : sur ${h(x.cdd.heures)}, l'heure passe à ${eur(x.cddAvecRecrutementParHeure)}, toujours moins que les ${eur(x.interim)} de l'intérim. Sur un renfort de quelques heures, ce serait l'inverse.`,
        ];
      },
    },
    {
      id: "predire-le-renfort",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le renfort",
      notions: ["payroll", "fixed_costs"],
      question: (c) => {
        const x = recruterIntegrerFormer(c);
        return `Avant le laboratoire, pariez. Il faut ${h(x.b.aCouvrir)} par semaine. Les avenants en donnent au plus ${h(HEURES_PAR_AVENANT * AVENANTS_POSSIBLES)}. Pour le reste, le moins cher sera…`;
      },
      options: () => {
        const voir = "Le laboratoire suivant essaie chaque mélange : les heures couvertes et le coût de décembre.";
        return [
          { texte: "Un CDD, puis l'intérim pour l'appoint", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Tout en intérim : aucun recrutement à payer", juste: false, retour: `Pari à vérifier : l'heure d'intérim coûte plus cher. ${voir}` },
          { texte: "Deux CDD, pour ne pas payer l'agence", juste: false, retour: `Pari à vérifier : un second CDD paie un recrutement pour peu d'heures. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-renfort",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire du renfort",
      notions: ["payroll", "fixed_costs", "capacity"],
      question: (c) => {
        const x = recruterIntegrerFormer(c);
        return `Couvrez les ${h(x.b.aCouvrir)} qui manquent chaque semaine de décembre. Les avenants donnent ${h(HEURES_PAR_AVENANT)} de plus à un temps partiel (${eur(x.avenant)} l'heure chargée), un CDD ${h(HEURES_D_UN_CDD)} (${eur(x.cddParHeure)} l'heure, plus le recrutement), l'intérim l'appoint (${eur(x.interim)} l'heure). Le tableau suit les heures et le coût des ${qte(SEMAINES_DE_RENFORT)} semaines.`;
      },
      leviers: () => [
        { code: "avenants", libelle: "Heures d'avenant par semaine", unite: "h", ...LEVIERS_DU_RENFORT.avenants, depart: 0 },
        { code: "cdd", libelle: `CDD de ${HEURES_D_UN_CDD} heures`, unite: "CDD", ...LEVIERS_DU_RENFORT.cdd, depart: 0 },
        { code: "interim", libelle: "Heures d'intérim par semaine", unite: "h", ...LEVIERS_DU_RENFORT.interim, depart: 0 },
      ],
      lecture: (c, p) => {
        const x = recruterIntegrerFormer(c);
        const r = renfortDeDecembre(x.f, { avenants: p.avenants!, cdd: p.cdd!, interim: p.interim! });
        return [
          { libelle: "Heures à couvrir par semaine", montant: r.aCouvrir, unite: "h" },
          { libelle: "Heures du renfort par semaine", montant: r.heures, reference: 0, unite: "h" },
          { libelle: "Heures encore en manque", montant: r.manquantes, reference: r.aCouvrir, unite: "h", fort: true },
          { libelle: "Heures payées en trop", montant: r.enTrop, reference: 0, unite: "h" },
          { libelle: "Coût des avenants", montant: -r.coutDesAvenants + 0, reference: 0, effet: true },
          { libelle: "Coût des CDD, recrutement compris", montant: -r.coutDesCdd + 0, reference: 0, effet: true },
          { libelle: "Coût de l'intérim", montant: -r.coutDeLInterim + 0, reference: 0, effet: true },
          { libelle: "Coût du renfort de décembre", montant: r.total, reference: 0, fort: true },
        ];
      },
      graphique: (c) => {
        const x = recruterIntegrerFormer(c);
        const lire = (p: Readonly<Record<string, number>>) => renfortDeDecembre(x.f, { avenants: p.avenants!, cdd: p.cdd!, interim: p.interim! });
        return {
          levier: "interim",
          courbes: [{ libelle: "Coût du renfort de décembre", valeur: (p) => lire(p).total }],
        };
      },
      defi: (c) => {
        const x = recruterIntegrerFormer(c);
        const m = x.meilleur;
        const lire = (p: Readonly<Record<string, number>>) => renfortDeDecembre(x.f, { avenants: p.avenants!, cdd: p.cdd!, interim: p.interim! });
        return {
          consigne: "Couvrez toutes les heures de décembre au plus bas coût.",
          atteint: (p) => lire(p).manquantes === 0 && lire(p).total <= m.r.total,
          indice: (p) => {
            const r = lire(p);
            if (r.manquantes > 0) return `Il manque encore ${h(r.manquantes)} par semaine : ajoutez des heures.`;
            if (r.enTrop > 0) return `Vous payez ${h(r.enTrop)} de trop par semaine : retirez de l'intérim.`;
            if (p.avenants! < LEVIERS_DU_RENFORT.avenants.max) return "Toutes les heures sont couvertes. L'avenant est l'heure la moins chère : en prenez-vous assez ?";
            return `Toutes les heures sont couvertes pour ${eur(r.total)}. Comparez un CDD de plus ou de moins : son recrutement est une charge fixe.`;
          },
          solution: { avenants: m.avenants, cdd: m.cdd, interim: m.interim },
        };
      },
      explication: (c) => {
        const x = recruterIntegrerFormer(c);
        const m = x.meilleur;
        return [
          `Le renfort le moins cher prend toutes les heures d'avenant (${h(m.avenants)}), ${qte(m.cdd)} CDD et ${h(m.interim)} d'intérim : ${eur(m.r.total)} pour décembre. Tout en intérim coûterait ${eur(x.toutEnInterim.total)} ; deux CDD, ${eur(x.deuxCdd.total)}, parce que le second paierait un recrutement pour des heures en trop.`,
          "L'intérim coûte le plus à l'heure, mais rien à recruter : il sert l'appoint. Le CDD se paie dès qu'il a assez d'heures pour amortir son recrutement.",
        ];
      },
    },
    {
      id: "l-entretien",
      objectifs: [4],
      type: "choix",
      titre: "Les questions de l'entretien",
      notions: ["training"],
      question: () => "Pendant un entretien, quelle question l'adjointe peut-elle poser à une candidate ?",
      options: () => [
        {
          texte: "Que proposeriez-vous à un client qui hésite ?",
          juste: true,
          retour: "Oui : la question porte sur les compétences du poste. Toute question à l'entretien doit avoir un lien direct avec l'emploi proposé.",
        },
        {
          texte: "Avez-vous des enfants à faire garder le samedi ?",
          juste: false,
          retour: "Non : la situation de famille est un motif de discrimination interdit. La disponibilité du samedi se demande telle quelle, à toutes les candidates et à tous les candidats.",
        },
        {
          texte: "Êtes-vous enceinte, ou comptez-vous l'être bientôt ?",
          juste: false,
          retour: "Non : la grossesse ne se demande pas, et la candidate n'a pas à répondre. Écarter une candidate pour ce motif est une discrimination, sanctionnée pénalement.",
        },
      ],
    },
    {
      id: "la-periode-d-essai",
      objectifs: [4],
      type: "montants",
      titre: "La période d'essai et la déclaration",
      notions: ["payroll"],
      question: () =>
        `La période d'essai d'un CDD de 6 mois au plus est d'un jour par semaine de contrat, dans la limite de deux semaines. Quelle est la période d'essai la plus longue du CDD de ${qte(SEMAINES_DE_RENFORT)} semaines, en jours ? La déclaration préalable à l'embauche se fait au plus tôt 8 jours avant la prise de poste : combien de jours avant elle, au plus tôt ?`,
      champs: () => [
        { libelle: "Période d'essai la plus longue, en jours", attendu: SEMAINES_DE_RENFORT, calcul: `${qte(SEMAINES_DE_RENFORT)} semaines × 1 jour = ${qte(SEMAINES_DE_RENFORT)} jours, sous la limite de deux semaines` },
        { libelle: "Déclaration, au plus tôt, en jours avant", attendu: 8, calcul: "La déclaration préalable se fait dans les 8 jours qui précèdent l'embauche, et toujours avant la prise de poste" },
      ],
      explication: () => [
        "Le contrat de travail écrit, remis au salarié dans les 2 jours ouvrables, dit son motif, sa durée, son poste, son salaire et sa période d'essai. Sans déclaration préalable à l'URSSAF, l'embauche est du travail dissimulé.",
      ],
    },
    {
      id: "la-courbe-d-apprentissage",
      objectifs: [2],
      type: "montants",
      titre: "La courbe d'apprentissage",
      notions: ["productivity", "training"],
      question: (c) => {
        const x = recruterIntegrerFormer(c);
        const s = COURBE_SANS_INTEGRATION.map((r) => pct(r * 100)).join(", ");
        const a = COURBE_AVEC_INTEGRATION.map((r) => pct(r * 100)).join(", ");
        return `Sans formule cette fois. En décembre, un vendeur formé fait ${qte(PASSAGES_PAR_HEURE_EN_DECEMBRE)} passages en caisse par heure de vente, ${qte(x.i.sans.parSemaine)} sur ${h(HEURES_D_UN_CDD)}. Le nouveau en fait, semaine après semaine, ${s} sans intégration ; ${a} avec un tutorat de ${h(HEURES_DE_TUTORAT)} par l'adjointe. Un passage de décembre laisse ${eur(x.i.sans.margeDUnPassage)} de marge. Combien de passages manque-t-il sans intégration, et avec ? Quelle marge l'intégration regagne-t-elle, et que rapporte-t-elle, tutorat payé ?`;
      },
      champs: (c) => {
        const x = recruterIntegrerFormer(c);
        const i = x.i;
        return [
          { libelle: "Passages manqués sans intégration", attendu: i.sans.manques, calcul: `${i.sans.semaines.map((s) => qte(s.manques)).join(" + ")} = ${qte(i.sans.manques)}` },
          { libelle: "Passages manqués avec intégration", attendu: i.avec.manques, calcul: `${i.avec.semaines.map((s) => qte(s.manques)).join(" + ")} = ${qte(i.avec.manques)}` },
          { libelle: "Marge regagnée", attendu: i.margeRegagnee, tolerance: 0.5, calcul: `(${qte(i.sans.manques)} − ${qte(i.avec.manques)}) × ${eur(i.sans.margeDUnPassage)} = ${eur(i.margeRegagnee)}` },
          { libelle: "Gain de l'intégration, tutorat payé", attendu: i.gain, tolerance: 0.5, calcul: `${eur(i.margeRegagnee)} − ${h(HEURES_DE_TUTORAT)} × ${eur(auCentime(x.rec.tauxAdjointe))} = ${eur(i.gain)}` },
        ];
      },
      explication: (c) => {
        const x = recruterIntegrerFormer(c);
        return [
          `Sans intégration, le nouveau vendeur laisse passer ${qte(x.i.sans.manques)} clients en un mois, ${eur(x.i.sans.margePerdue)} de marge. ${h(HEURES_DE_TUTORAT)} de tutorat, ${eur(x.i.tutorat)}, en regagnent ${eur(x.i.margeRegagnee)}. Sur un CDD d'un mois, la première semaine pèse lourd : c'est elle que l'intégration raccourcit.`,
        ];
      },
    },
    {
      id: "l-integration",
      objectifs: [2],
      type: "choix",
      titre: "Le premier jour",
      notions: ["training"],
      question: () => "Le CDD commence un lundi de décembre. Que prévoit la responsable pour son premier jour ?",
      options: () => [
        {
          texte: "Un accueil, la visite, le livret, puis la vente avec l'adjointe",
          juste: true,
          retour: "Oui : un parcours d'intégration présente l'équipe, les références, la caisse et les règles de la boutique, et donne un tuteur. Le nouveau vend plus tôt, et reste.",
        },
        {
          texte: "Seul en boutique le samedi, pour apprendre au contact des clients",
          juste: false,
          retour: "Non : sans repères, il vendra moins, et le samedi est le jour où chaque client manqué coûte le plus.",
        },
        {
          texte: "Une semaine en réserve, à ranger le stock",
          juste: false,
          retour: "Non : c'est payer un vendeur sans qu'il vende pendant une semaine sur quatre. L'intégration se fait en vendant, accompagné.",
        },
      ],
    },
    {
      id: "la-formation",
      objectifs: [3],
      type: "montants",
      titre: "Ce que rapporte une formation",
      notions: ["training", "average_basket"],
      question: (c) => {
        const x = recruterIntegrerFormer(c);
        return `Sans formule cette fois. Une journée de formation à la vente additionnelle (${h(FORMATION.heures)}) pour les ${qte(FORMES.length)} vendeurs coûte ${eur(FORMATION.fraisParPersonne)} par personne à l'organisme ; l'opérateur de compétences en rembourse ${pct(FORMATION.priseEnCharge * 100)}, et les heures de formation sont payées, ${eur(x.fo.heures)} chargées. Elle fait gagner ${qte(FORMATION.indiceEnPlus)} article par passage sur les ${qte(x.fo.passages)} passages qu'ils font par mois. Calculez le coût net de la formation, la marge gagnée par mois (${eur(auCentime(x.fo.margeDUnArticle))} par article), puis les mois qu'elle met à se payer (au dixième).`;
      },
      champs: (c) => {
        const x = recruterIntegrerFormer(c);
        const fo = x.fo;
        return [
          { libelle: "Coût net de la formation", attendu: fo.cout, tolerance: 0.1, calcul: `${eur(fo.frais)} − ${eur(fo.priseEnCharge)} + ${eur(fo.heures)} = ${eur(fo.cout)}` },
          { libelle: "Marge gagnée par mois", attendu: fo.gainParMois, tolerance: 0.5, calcul: `${qte(fo.passages)} × ${qte(FORMATION.indiceEnPlus)} = ${qte(fo.articlesEnPlus)} articles × ${eur(auCentime(fo.margeDUnArticle))} = ${eur(fo.gainParMois)}` },
          { libelle: "Mois pour se payer", attendu: auDixieme(fo.mois), tolerance: 0.1, calcul: `${eur(fo.cout)} ÷ ${eur(fo.gainParMois)} = ${qte(auDixieme(fo.mois))} mois` },
        ];
      },
      explication: (c) => {
        const x = recruterIntegrerFormer(c);
        return [
          `La formation se paie en ${qte(auDixieme(x.fo.mois))} mois, puis rapporte ${eur(x.fo.gainParMois)} chaque mois tant que l'équipe garde le réflexe. Son suivi compte autant qu'elle : l'indice de vente de chacun, mois après mois, dit si elle a porté.`,
        ];
      },
    },
    {
      id: "le-plan-de-formation",
      objectifs: [3, 4],
      type: "choix",
      titre: "La formation et le droit",
      notions: ["training"],
      question: () => "La responsable veut placer la formation un dimanche, non payé, pour ne pas fermer la boutique. Que lui répondez-vous ?",
      options: () => [
        {
          texte: "Non : une formation d'adaptation au poste est du temps de travail payé",
          juste: true,
          retour: "Oui. L'employeur doit adapter ses salariés à leur poste : cette formation, inscrite au plan de développement des compétences, se suit sur le temps de travail et se paie comme lui. Le repos dominical, lui, ne se supprime pas pour l'occasion.",
        },
        {
          texte: "Oui, si chaque vendeur la finance sur son compte personnel de formation",
          juste: false,
          retour: "Non : le compte personnel de formation appartient au salarié, qui choisit de s'en servir. L'employeur ne peut pas l'imposer pour une formation qu'il demande.",
        },
        {
          texte: "Oui : une formation n'est pas du travail",
          juste: false,
          retour: "Non : une formation que l'employeur organise pour le poste est du temps de travail effectif.",
        },
      ],
    },
    {
      id: "quel-renfort-retenir",
      objectifs: [1],
      type: "choix",
      titre: "Quel renfort retenir ?",
      notions: ["payroll", "fixed_costs"],
      question: (c) => {
        const x = recruterIntegrerFormer(c);
        return `Il faut ${h(x.b.aCouvrir)} de plus par semaine en décembre. Quel renfort proposez-vous à la direction ?`;
      },
      options: (c) => {
        const x = recruterIntegrerFormer(c);
        const m = x.meilleur;
        return [
          { texte: `Les avenants, ${qte(m.cdd)} CDD intégré, l'intérim pour ${h(m.interim)}`, juste: true, retour: `Oui : ${eur(m.r.total)}, le moins cher. Le parcours d'intégration du CDD rapporte en plus ${eur(x.i.gain)} de marge.` },
          { texte: "Tout en intérim, sans recrutement ni intégration", juste: false, retour: `Non : ${eur(x.toutEnInterim.total)}. L'intérim évite le recrutement, mais chaque heure coûte ${eur(x.interim)}.` },
          { texte: "Un CDI de plus, embauché pour décembre", juste: false, retour: "Non : le besoin finit avec décembre. Un CDI resterait payé en janvier, quand le planning a déjà des heures en trop." },
          { texte: "Deux CDD, sans avenant ni intérim", juste: false, retour: `Non : deux CDD donnent ${h(2 * HEURES_D_UN_CDD)}, moins que les ${h(x.b.aCouvrir)} qui manquent. Avec les avenants, ils coûteraient ${eur(x.deuxCdd.total)}.` },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payroll", "training", "productivity"],
      tableau: (c) => {
        const x = recruterIntegrerFormer(c);
        return {
          titre: `${x.f.entreprise} · le renfort de décembre`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Heures à couvrir par semaine", valeurs: [h(x.b.aCouvrir)] },
            { libelle: "Heure d'avenant, chargée", valeurs: [eur(x.avenant)] },
            { libelle: "Heure de CDD, recrutement compris", valeurs: [eur(x.cddAvecRecrutementParHeure)] },
            { libelle: "Heure d'intérim", valeurs: [eur(x.interim)] },
            { libelle: "Renfort le moins cher", valeurs: [eur(x.meilleur.r.total)] },
            { libelle: "Gain de l'intégration", valeurs: [eur(x.i.gain)] },
            { libelle: "Retour de la formation", valeurs: [`${qte(auDixieme(x.fo.mois))} mois`] },
          ],
        };
      },
      texte: (c) => {
        const x = recruterIntegrerFormer(c);
        return [
          `Le recrutement part du besoin, lu créneau par créneau : ${h(x.b.aCouvrir)} par semaine en décembre. Le contrat suit la durée du besoin : un avenant ou un CDD pour une saison, pas un CDI.`,
          "Le coût d'une heure compte tout : les indemnités de fin de contrat, les cotisations, et le recrutement, une charge fixe que seules assez d'heures amortissent. L'intérim sert l'appoint.",
          "Un nouveau vendeur ne vend pas comme l'équipe la première semaine. L'intégration raccourcit sa courbe d'apprentissage, et la formation se juge à ce qu'elle fait gagner, mois après mois.",
          "Les limites de la méthode : la courbe d'apprentissage et le gain d'une formation sont des hypothèses à vérifier sur le tableau de bord ; un bon recrutement se juge aussi au savoir-être, que le calcul ne lit pas.",
          "Au niveau de l'examen, vous savez diagnostiquer un besoin, choisir et chiffrer un contrat, respecter le droit du recrutement, chiffrer l'intégration et une formation.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût d'un CDD = (salaires + indemnité de fin de contrat + indemnité de congés payés) × (1 + taux patronal), plus le recrutement. Marge perdue à l'intégration = passages manqués × marge d'un passage.",
    },
  ],
};
