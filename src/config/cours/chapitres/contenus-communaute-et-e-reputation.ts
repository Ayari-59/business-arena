import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  ABONNES,
  AVIS_PAR_NOTE,
  COMMUNITY_MANAGER,
  CONTACTS_SELON_LE_RYTHME,
  CONVERSION_ET_NOTE,
  LIVRE_BLANC,
  PERIODE_DU_SITE,
  RYTHME_DU_TRIMESTRE,
  TRIMESTRE_DU_SITE,
  WEBINAIRE,
  avisACinqEtoilesPour,
  conversionALaNote,
  marketingEntrant,
  meilleurRythme,
  noteDesAvis,
  publicationsDuTrimestre,
  rythmeDePublication,
  traficDuSite,
  valeurDUnContact,
} from "../monde/site-d-atlas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_SITE } from "./le-site-qui-vend";
import { ficheDe } from "./valeur-d-un-client";

/**
 * CHAPITRE : CONTENUS, COMMUNAUTÉ ET E-RÉPUTATION (BTS NDRC, bloc 2, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique en ligne d'ATLAS CONSEIL, au premier trimestre
 * de N + 1 (monde/site-d-atlas.ts, partie 2). Il reprend la conversion du chapitre « Le site qui vend »
 * (12 000 visites, 1 %, 432,80 € de marge par commande) et l'entonnoir de la campagne digitale de N
 * (1 contact sur 300 devient un compte, qui vaut 84 000 € sur sa vie) : les contenus et la communauté se
 * jugent sur les contacts qu'ils amènent et les commandes qu'ils protègent.
 *
 * L'objet : l'engagement et le taux de clic des publications, type par type, et ce qu'il faut publier ;
 * le marketing entrant (un livre blanc, un webinaire), ses contacts et ce qu'ils valent ; le rythme de
 * publication, dont la courbe figée est concave, face au coût du community manager ; la note moyenne
 * des avis, ce qu'en coûtent quelques avis à une étoile, et ce qu'elle change à la conversion du site ;
 * puis les écrits digitaux, et la réponse à un avis négatif.
 *
 * Le piège central : l'engagement. Les conseils pratiques font le plus réagir, les annonces le moins ;
 * ce sont pourtant les annonces qui mènent au site. Et sur la seule marge de la première année d'un
 * compte, on publierait deux fois moins qu'il ne faut.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, l-engagement, quoi-publier, le-marketing-entrant, ce-que-vaut-un-contact ;
 *   · l'expérience avant la formule : predire-le-rythme puis le-laboratoire-du-rythme (le rythme et la
 *     valeur d'un contact, avec le graphique de la valeur créée, du coût et du gain) avant
 *     la-publication-en-plus ; predire-les-avis puis les-avis-au-curseur avant la-note-et-la-conversion ;
 *   · autonome et expert : la-publication-en-plus, la-note-moyenne, la-note-et-la-conversion,
 *     les-ecrits-digitaux, l-avis-negatif, le-rythme-a-proposer ; puis la synthèse.
 */

/** Les bornes du curseur des avis à cinq étoiles. */
export const AVIS_DU_CURSEUR = { min: 0, max: 40 } as const;

/** Les avis à une étoile du scénario du chapitre : trois participants mécontents d'une session annulée. */
export const AVIS_NEGATIFS_DU_CHAPITRE = 3;

/** Les leviers du laboratoire : le rythme (publications par semaine) et la valeur d'un contact (à choix). */
export const LEVIERS_DU_RYTHME = { rythme: { min: 0, max: CONTACTS_SELON_LE_RYTHME.length - 1, pas: 1 } } as const;
export const VALEUR_D_UN_CONTACT = { premiereAnnee: 0, actualisee: 1, simple: 2 } as const;

export const POURQUOI_LES_CONTENUS =
  "ce chapitre suit les publications et les avis d'un cabinet de formation qui vend en ligne : il se joue chez ATLAS CONSEIL, dont la simulation du cours fige le premier trimestre du site.";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number, d = 2) => `${(Math.round(x * 100 * 10 ** d) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const enPct = (x: number) => auCentime(x * 100);
/** « d'ATLAS CONSEIL », « de NOVA » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const note = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

/** Les contenus, la communauté et les avis du cabinet : tout ce que le chapitre et son cas demandent. */
export function contenusDuCabinet(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = traficDuSite();
  const p = publicationsDuTrimestre();
  const type = (code: string) => p.types.find((x) => x.code === code)!;
  const v = valeurDUnContact(f);
  const e = marketingEntrant(f);
  const valeurs = [v.premiereAnnee, v.actualisee, v.simple];
  const auRythme = rythmeDePublication(RYTHME_DU_TRIMESTRE, v.simple);
  const meilleur = meilleurRythme(v.simple);
  const meilleurActualise = meilleurRythme(v.actualisee);
  const meilleurPremiereAnnee = meilleurRythme(v.premiereAnnee);
  const enPlus = (de: number, valeur: number) => {
    const a = rythmeDePublication(de, valeur);
    const b = rythmeDePublication(de + 1, valeur);
    return { de, a: de + 1, contacts: b.contacts - a.contacts, cout: b.cout - a.cout, gain: auCentime(b.gain - a.gain) };
  };
  const n = noteDesAvis();
  const negatifs = [{ note: 1, avis: AVIS_NEGATIFS_DU_CHAPITRE }];
  const apres = noteDesAvis(negatifs);
  const aCinq = avisACinqEtoilesPour(CONVERSION_ET_NOTE.noteDeReference, negatifs);
  const conversionApres = conversionALaNote(apres.affichee);
  return {
    f,
    t,
    p,
    conseils: type("conseils"),
    annonces: type("annonces"),
    temoignages: type("temoignages"),
    videos: type("videos"),
    v,
    e,
    valeurs,
    auRythme,
    meilleur,
    meilleurActualise,
    meilleurPremiereAnnee,
    /** La publication par semaine en plus, au-delà du meilleur rythme, à la valeur vie actualisée. */
    auDelaDuMeilleur: enPlus(meilleurActualise.rythme, v.actualisee),
    /** La publication par semaine en plus, jusqu'au meilleur rythme, à la valeur vie actualisée. */
    jusquAuMeilleur: enPlus(meilleurActualise.rythme - 1, v.actualisee),
    enPlus,
    n,
    apres,
    aCinq,
    conversionApres,
  };
}

export type ContenusDuCabinet = ReturnType<typeof contenusDuCabinet>;

/** Le rythme de publication pour une position du laboratoire : la valeur d'un contact choisie, et ce qu'un pas de plus ou de moins changerait. */
export function laboratoireDuRythme(x: ContenusDuCabinet, rythme: number, valeur: number) {
  const valeurDUn = x.valeurs[valeur]!;
  const gainDe = (r: number) => rythmeDePublication(r, valeurDUn).gain;
  const l = rythmeDePublication(rythme, valeurDUn);
  const max = LEVIERS_DU_RYTHME.rythme.max;
  return {
    ...l,
    valeurDUn,
    pasSuivant: rythme <= max - 1 ? auCentime(gainDe(rythme + 1) - gainDe(rythme)) : 0,
    pasPrecedent: rythme >= 1 ? auCentime(gainDe(rythme) - gainDe(rythme - 1)) : 0,
    meilleurGain: meilleurRythme(valeurDUn).gain,
  };
}

/** Les publications du trimestre : le document de départ. */
function tableauDesPublications(x: ContenusDuCabinet): TableauDeDonnees {
  return {
    titre: `Les publications de la page ${dE(x.f.entreprise)}, ${PERIODE_DU_SITE}`,
    colonnes: ["Publications", "Impressions", "Interactions", "Clics vers le site"],
    lignes: [
      ...x.p.types.map((t) => ({ libelle: t.nom, valeurs: [qte(t.publications), qte(t.impressions), qte(t.interactions), qte(t.clics)] })),
      { libelle: "Toutes les publications", valeurs: [qte(x.p.total.publications), qte(x.p.total.impressions), qte(x.p.total.interactions), qte(x.p.total.clics)] },
    ],
  };
}

/** Les avis de la fiche du cabinet : le document des notes. */
function tableauDesAvis(): TableauDeDonnees {
  return {
    titre: "Les avis des participants, à la fin du trimestre",
    colonnes: AVIS_PAR_NOTE.map((_, i) => `${i + 1} étoile${i > 0 ? "s" : ""}`),
    lignes: [{ libelle: "Avis", valeurs: AVIS_PAR_NOTE.map((n) => qte(n)) }],
  };
}

export const CONTENUS_COMMUNAUTE_ET_E_REPUTATION: Chapitre = {
  code: "contenus-communaute-et-e-reputation",
  parcours: "ndrc",
  palier: 4,
  blocs: ["BTS NDRC Bloc 2 · Relation client à distance et digitalisation"],
  titre: "Contenus, communauté et e-réputation",
  accroche:
    "Une publication se juge sur ce qu'elle amène, pas sur ce qu'elle fait réagir ; un contact entrant, sur ce qu'il deviendra ; une note, sur les commandes qu'elle protège. Quoi publier, à quel rythme, et comment répondre à un avis négatif.",
  objectifs: [
    "Calculer le taux d'engagement et le taux de clic des publications, type par type, et choisir quoi publier",
    "Calculer les contacts qu'amènent un livre blanc et un webinaire, et ce qu'ils valent",
    "Calculer la note moyenne des avis, ce qu'en coûtent des avis négatifs, et son effet sur la conversion du site",
    "Fixer le rythme de publication sur ce que rapporte la publication en plus, face au coût du community manager",
    "Adapter un écrit digital à son support, et répondre à un avis négatif",
  ],
  libre: false,
  prerequis: ["le-site-qui-vend", "valeur-d-un-client"],
  ensuite: ["tableau-de-bord-commercial"],
  entreprises: { codes: ENTREPRISES_DU_SITE, pourquoi: POURQUOI_LES_CONTENUS },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une page, une communauté, des avis",
      notions: ["brand_capital", "conversion_rate"],
      tableau: (c) => tableauDesPublications(contenusDuCabinet(c)),
      texte: (c) => {
        const x = contenusDuCabinet(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}, ${PERIODE_DU_SITE}, celui de la boutique en ligne du chapitre précédent. Le cabinet publie ${qte(x.p.parSemaine)} fois par semaine sur sa page du réseau professionnel, ${qte(x.p.total.publications)} publications en ${qte(TRIMESTRE_DU_SITE.semaines)} semaines, écrites par une community manager indépendante à ${eur(COMMUNITY_MANAGER.parPublication)} la publication.`,
          `Une impression est un affichage dans un fil d'actualité ; une interaction, une réaction, un commentaire ou un partage. Les ${qte(x.p.total.clics)} clics vers le site sont les visites non payées de la source « réseaux sociaux ». La page compte ${qte(ABONNES.fin)} abonnés à la fin du trimestre, ${pct(x.p.croissanceDesAbonnes, 1)} de plus qu'au début.`,
          `Le cabinet a aussi publié un livre blanc et animé un webinaire, et ses participants laissent des avis sur sa fiche du moteur de recherche. Les contacts qu'amènent les contenus suivent l'entonnoir de la campagne digitale de N : 1 contact sur ${qte(x.v.contactsParCompte)} devient un compte.`,
        ];
      },
      repere: () => "Taux d'engagement = interactions ÷ impressions. Taux de clic = clics ÷ impressions. Un contenu se juge sur ce qu'il amène : des clics, des contacts, des commandes.",
    },
    {
      id: "l-engagement",
      objectifs: [0],
      type: "montants",
      titre: "L'engagement et le taux de clic",
      notions: ["conversion_rate", "brand_capital"],
      tableau: (c) => tableauDesPublications(contenusDuCabinet(c)),
      question: () => "Calculez le taux d'engagement des conseils pratiques et des annonces de sessions, puis le taux de clic de ces deux types, et le taux d'engagement de toutes les publications, en %, au centième.",
      champs: (c) => {
        const x = contenusDuCabinet(c);
        const [k, a] = [x.conseils, x.annonces];
        return [
          { libelle: "Engagement des conseils pratiques (%)", attendu: enPct(k.engagement), calcul: `${qte(k.interactions)} ÷ ${qte(k.impressions)} = ${pct(k.engagement)}`, tolerance: 0.01 },
          { libelle: "Engagement des annonces de sessions (%)", attendu: enPct(a.engagement), calcul: `${qte(a.interactions)} ÷ ${qte(a.impressions)} = ${pct(a.engagement)}`, tolerance: 0.01 },
          { libelle: "Taux de clic des conseils pratiques (%)", attendu: enPct(k.tauxDeClic), calcul: `${qte(k.clics)} ÷ ${qte(k.impressions)} = ${pct(k.tauxDeClic)}`, tolerance: 0.01 },
          { libelle: "Taux de clic des annonces de sessions (%)", attendu: enPct(a.tauxDeClic), calcul: `${qte(a.clics)} ÷ ${qte(a.impressions)} = ${pct(a.tauxDeClic)}`, tolerance: 0.01 },
          { libelle: "Engagement de toutes les publications (%)", attendu: enPct(x.p.total.engagement), calcul: `${qte(x.p.total.interactions)} ÷ ${qte(x.p.total.impressions)} = ${pct(x.p.total.engagement)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = contenusDuCabinet(c);
        return [
          `Les conseils pratiques font réagir ${qte(x.conseils.engagement / x.annonces.engagement)} fois plus que les annonces ; les annonces mènent ${qte(auCentime(x.annonces.tauxDeClic / x.conseils.tauxDeClic))} fois plus au site. L'un nourrit la communauté et la visibilité de la page, l'autre la vente.`,
          `Les témoignages font les deux : ${pct(x.temoignages.engagement, 1)} d'engagement et ${pct(x.temoignages.tauxDeClic)} de clics. Ce sont aussi les plus rares.`,
        ];
      },
    },
    {
      id: "quoi-publier",
      objectifs: [0],
      type: "choix",
      titre: "Ne publier que des annonces ?",
      notions: ["brand_capital", "conversion_rate"],
      question: (c) => {
        const x = contenusDuCabinet(c);
        return `Le directeur a lu le tableau : « Les annonces amènent ${qte(x.annonces.clics)} clics avec ${qte(x.annonces.publications)} publications. Ne publions plus que ça. » Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = contenusDuCabinet(c);
        return [
          {
            texte: "Non : il faut un mélange, plus de témoignages",
            juste: true,
            retour: `Oui : une page qui ne fait qu'annoncer ses sessions lasse ses abonnés, et le réseau montre moins ses publications. Les conseils (${pct(x.conseils.engagement, 0)} d'engagement) entretiennent la communauté ; les témoignages, qui engagent et mènent au site, méritent plus de place.`,
          },
          {
            texte: "Oui : seuls les clics vers le site comptent",
            juste: false,
            retour: `Non : l'engagement fait voir la page à plus de monde, et chaque abonné gagné verra la prochaine annonce. Les clics ne viennent pas seuls.`,
          },
          {
            texte: "Non : il faut publier les contenus qui font le plus réagir",
            juste: false,
            retour: `Non : les conseils font réagir à ${pct(x.conseils.engagement, 0)}, mais leur taux de clic n'est que de ${pct(x.conseils.tauxDeClic)}. Une page ne vit pas que de réactions.`,
          },
        ];
      },
    },
    {
      id: "le-marketing-entrant",
      objectifs: [1],
      type: "montants",
      titre: "Le livre blanc et le webinaire",
      notions: ["conversion_rate", "customer_acquisition_cost"],
      question: (c) => {
        const x = contenusDuCabinet(c);
        return `La page du livre blanc a eu ${qte(LIVRE_BLANC.visitesDeLaPage)} visites et ${qte(LIVRE_BLANC.telechargements)} téléchargements ; le webinaire, ${qte(WEBINAIRE.inscrits)} inscrits et ${qte(WEBINAIRE.presents)} présents. Ensemble, ils ont coûté ${eur(x.e.cout)}. Calculez le taux de téléchargement et le taux de présence (en %), les contacts amenés (téléchargements et présents), le coût d'un contact, puis les comptes attendus, au centième, à 1 compte pour ${qte(x.v.contactsParCompte)} contacts.`;
      },
      champs: (c) => {
        const x = contenusDuCabinet(c);
        return [
          { libelle: "Taux de téléchargement (%)", attendu: enPct(x.e.tauxDeTelechargement), calcul: `${qte(LIVRE_BLANC.telechargements)} ÷ ${qte(LIVRE_BLANC.visitesDeLaPage)} = ${pct(x.e.tauxDeTelechargement)}`, tolerance: 0.01 },
          { libelle: "Taux de présence (%)", attendu: enPct(x.e.tauxDePresence), calcul: `${qte(WEBINAIRE.presents)} ÷ ${qte(WEBINAIRE.inscrits)} = ${pct(x.e.tauxDePresence)}`, tolerance: 0.01 },
          { libelle: "Contacts amenés", attendu: x.e.contacts, calcul: `${qte(LIVRE_BLANC.telechargements)} + ${qte(WEBINAIRE.presents)} = ${qte(x.e.contacts)}` },
          { libelle: "Coût d'un contact", attendu: x.e.coutParContact, calcul: `${eur(x.e.cout)} ÷ ${qte(x.e.contacts)} = ${eur(x.e.coutParContact)}` },
          { libelle: "Comptes attendus", attendu: auCentime(x.e.comptes), calcul: `${qte(x.e.contacts)} ÷ ${qte(x.v.contactsParCompte)} = ${qte(auCentime(x.e.comptes))}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = contenusDuCabinet(c);
        return [
          `Le marketing entrant ne va pas chercher les entreprises : il publie ce qui les fait venir, contre leurs coordonnées et leur consentement. Un contact y coûte ${eur(x.e.coutParContact)}, quand la campagne digitale de N payait ${eur(x.v.coutParContactDeLaCampagne)} le sien. Les ${qte(auCentime(x.e.comptes))} comptes attendus coûtent ${eur(x.e.coutParCompte)} l'un.`,
          "Ces contacts ne sont pas des ventes : ils doivent encore passer les rendez-vous et les devis des commerciaux. Le livre blanc et le webinaire nourrissent aussi le référencement naturel, et les avis, qui ne se voient pas dans ce calcul.",
        ];
      },
    },
    {
      id: "ce-que-vaut-un-contact",
      objectifs: [1],
      type: "montants",
      titre: "Ce que vaut un contact",
      notions: ["customer_lifetime_value", "customer_acquisition_cost"],
      question: (c) => {
        const x = contenusDuCabinet(c);
        return `Un contact devient un compte une fois sur ${qte(x.v.contactsParCompte)}. Calculez ce qu'il vaut à trois mesures : la marge d'un compte la première année (${eur(x.v.premiereAnnee * x.v.contactsParCompte)}), sa valeur vie actualisée (${eur(x.v.actualisee * x.v.contactsParCompte)}) et sa valeur vie simple (${eur(x.v.simple * x.v.contactsParCompte)}). Puis ce que coûte un contact des publications : ${eur(x.auRythme.cout)} de community manager pour ${qte(x.auRythme.contacts)} contacts.`;
      },
      champs: (c) => {
        const x = contenusDuCabinet(c);
        const k = qte(x.v.contactsParCompte);
        return [
          { libelle: "Valeur d'un contact, première année", attendu: x.v.premiereAnnee, calcul: `${eur(x.v.premiereAnnee * x.v.contactsParCompte)} ÷ ${k} = ${eur(x.v.premiereAnnee)}` },
          { libelle: "Valeur d'un contact, actualisée", attendu: x.v.actualisee, calcul: `${eur(x.v.actualisee * x.v.contactsParCompte)} ÷ ${k} = ${eur(x.v.actualisee)}` },
          { libelle: "Valeur d'un contact, simple", attendu: x.v.simple, calcul: `${eur(x.v.simple * x.v.contactsParCompte)} ÷ ${k} = ${eur(x.v.simple)}` },
          { libelle: "Coût d'un contact des publications", attendu: x.auRythme.coutParContact, calcul: `${eur(x.auRythme.cout)} ÷ ${qte(x.auRythme.contacts)} = ${eur(x.auRythme.coutParContact)}` },
        ];
      },
      explication: (c) => {
        const x = contenusDuCabinet(c);
        return [
          `Un contact des publications coûte ${eur(x.auRythme.coutParContact)} et vaut ${eur(x.v.actualisee)} actualisé : la community manager paie, et largement. Sur la seule marge de la première année, ${eur(x.v.premiereAnnee)}, il vaudrait à peine plus qu'il ne coûte. La question n'est donc pas de savoir s'il faut publier, mais combien.`,
        ];
      },
    },
    {
      id: "predire-le-rythme",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le rythme",
      notions: ["customer_lifetime_value", "customer_acquisition_cost"],
      question: (c) => {
        const x = contenusDuCabinet(c);
        return `Avant de calculer, pariez. À ${qte(RYTHME_DU_TRIMESTRE)} publications par semaine, un contact coûte ${eur(x.auRythme.coutParContact)} et en vaut ${eur(x.v.actualisee)}. La community manager propose de passer à ${qte(LEVIERS_DU_RYTHME.rythme.max)} par semaine. Faut-il la suivre ?`;
      },
      options: () => {
        const voir = "Le laboratoire suivant trace la valeur créée, le coût et le gain, rythme par rythme : cherchez où le gain cesse de monter.";
        return [
          { texte: "Pas forcément : tout dépend de la publication en plus", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Oui : chaque contact vaut bien plus qu'il ne coûte", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non : publier plus coûte forcément plus que ça ne rapporte", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-rythme",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du rythme de publication",
      notions: ["customer_lifetime_value", "customer_acquisition_cost", "brand_capital"],
      question: () =>
        "Faites varier le rythme de publication, de zéro à six par semaine, et choisissez ce que vaut un contact : la marge de la première année d'un compte, sa valeur vie actualisée, ou sa valeur vie simple. Le tableau suit les contacts amenés, le coût de la community manager, la valeur créée, et le gain (valeur créée − coût).",
      leviers: (c) => {
        const x = contenusDuCabinet(c);
        return [
          { code: "rythme", libelle: "Publications par semaine", unite: "par semaine", min: LEVIERS_DU_RYTHME.rythme.min, max: LEVIERS_DU_RYTHME.rythme.max, pas: 1, depart: RYTHME_DU_TRIMESTRE },
          {
            code: "valeur",
            libelle: "Valeur d'un contact",
            unite: "",
            min: VALEUR_D_UN_CONTACT.premiereAnnee,
            max: VALEUR_D_UN_CONTACT.simple,
            pas: 1,
            depart: VALEUR_D_UN_CONTACT.actualisee,
            choix: [
              { valeur: VALEUR_D_UN_CONTACT.premiereAnnee, libelle: `Marge de la première année, ${eur(x.v.premiereAnnee)}` },
              { valeur: VALEUR_D_UN_CONTACT.actualisee, libelle: `Valeur vie actualisée, ${eur(x.v.actualisee)}` },
              { valeur: VALEUR_D_UN_CONTACT.simple, libelle: `Valeur vie simple, ${eur(x.v.simple)}` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = contenusDuCabinet(c);
        const l = laboratoireDuRythme(x, p.rythme!, p.valeur!);
        const d = laboratoireDuRythme(x, RYTHME_DU_TRIMESTRE, VALEUR_D_UN_CONTACT.actualisee);
        return [
          { libelle: "Publications du trimestre", montant: l.publications, reference: d.publications, unite: "publications" },
          { libelle: "Contacts amenés", montant: l.contacts, reference: d.contacts, unite: "contacts" },
          { libelle: "Coût de la community manager", montant: l.cout, reference: d.cout },
          { libelle: "Valeur créée par les contacts", montant: l.valeurCreee, reference: d.valeurCreee },
          { libelle: "Ce qu'a rapporté la dernière publication par semaine", montant: l.pasPrecedent, reference: d.pasPrecedent, effet: true },
          { libelle: "Ce que rapporterait une publication par semaine de plus", montant: l.pasSuivant, reference: d.pasSuivant, effet: true },
          { libelle: "Gain des publications", montant: l.gain, reference: d.gain, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = contenusDuCabinet(c);
        const lab = (p: Readonly<Record<string, number>>) => laboratoireDuRythme(x, p.rythme!, p.valeur!);
        return {
          levier: "rythme",
          courbes: [
            { libelle: "Valeur créée par les contacts", valeur: (p) => lab(p).valeurCreee },
            { libelle: "Coût de la community manager", valeur: (p) => lab(p).cout },
            { libelle: "Gain des publications", valeur: (p) => lab(p).gain },
          ],
        };
      },
      defi: (c) => {
        const x = contenusDuCabinet(c);
        return {
          consigne: "Trouvez le rythme où la publication en plus ne rapporte plus : celui qui donne le plus grand gain, à la valeur choisie.",
          atteint: (p) => {
            const l = laboratoireDuRythme(x, p.rythme!, p.valeur!);
            return l.gain >= l.meilleurGain - 0.005;
          },
          indice: (p) => {
            const l = laboratoireDuRythme(x, p.rythme!, p.valeur!);
            return l.pasSuivant > 0
              ? `Une publication par semaine de plus rapporterait encore ${eur(l.pasSuivant)} une fois payée : montez le rythme.`
              : `La dernière publication par semaine a fait perdre ${eur(-l.pasPrecedent)} : baissez le rythme.`;
          },
          solution: { rythme: x.meilleurActualise.rythme, valeur: VALEUR_D_UN_CONTACT.actualisee },
        };
      },
      explication: (c, p) => {
        const x = contenusDuCabinet(c);
        const l = laboratoireDuRythme(x, p.rythme!, p.valeur!);
        return [
          `À ${qte(p.rythme!)} publications par semaine, le gain est de ${eur(l.gain)} : la dernière a encore rapporté plus qu'elle n'a coûté, la suivante rapporterait moins. Le coût d'un contact, ${eur(l.coutParContact)}, ne dit rien de cela : c'est la publication en plus qui décide.`,
          `Le meilleur rythme est de ${qte(x.meilleurActualise.rythme)} par semaine à la valeur actualisée, ${qte(x.meilleur.rythme)} à la valeur simple ; sur la seule marge de la première année, on s'arrêterait à ${qte(x.meilleurPremiereAnnee.rythme)}, et on renoncerait à des contacts qui paient.`,
        ];
      },
    },
    {
      id: "la-publication-en-plus",
      objectifs: [3],
      type: "montants",
      titre: "La publication en plus",
      notions: ["customer_lifetime_value", "customer_acquisition_cost"],
      question: (c) => {
        const x = contenusDuCabinet(c);
        const [a, b] = [x.jusquAuMeilleur, x.auDelaDuMeilleur];
        return `Passer de ${qte(a.de)} à ${qte(a.a)} publications par semaine, puis de ${qte(b.de)} à ${qte(b.a)}, coûte chaque fois ${eur(b.cout)} de plus au trimestre. Calculez les contacts en plus de chaque pas, puis le gain de chacun, à la valeur vie actualisée (contacts en plus × ${eur(x.v.actualisee)} − coût en plus ; négatif s'il fait perdre).`;
      },
      champs: (c) => {
        const x = contenusDuCabinet(c);
        const [a, b] = [x.jusquAuMeilleur, x.auDelaDuMeilleur];
        const r = (k: number) => rythmeDePublication(k, x.v.actualisee).contacts;
        return [
          { libelle: `Contacts en plus, de ${qte(a.de)} à ${qte(a.a)}`, attendu: a.contacts, calcul: `${qte(r(a.a))} − ${qte(r(a.de))} = ${qte(a.contacts)}` },
          { libelle: `Gain du pas, de ${qte(a.de)} à ${qte(a.a)}`, attendu: a.gain, calcul: `${qte(a.contacts)} × ${eur(x.v.actualisee)} − ${eur(a.cout)} = ${eur(a.gain)}` },
          { libelle: `Contacts en plus, de ${qte(b.de)} à ${qte(b.a)}`, attendu: b.contacts, calcul: `${qte(r(b.a))} − ${qte(r(b.de))} = ${qte(b.contacts)}` },
          { libelle: `Gain du pas, de ${qte(b.de)} à ${qte(b.a)}`, attendu: b.gain, calcul: `${qte(b.contacts)} × ${eur(x.v.actualisee)} − ${eur(b.cout)} = ${eur(b.gain)}` },
        ];
      },
      explication: (c) => {
        const x = contenusDuCabinet(c);
        const b = x.auDelaDuMeilleur;
        return [
          `Chaque publication par semaine coûte la même chose, ${eur(b.cout)} au trimestre ; elle amène de moins en moins de contacts (${CONTACTS_SELON_LE_RYTHME.slice(1).map((n, i) => qte(n - CONTACTS_SELON_LE_RYTHME[i]!)).join(", ")}). Au-delà de ${qte(b.de)} par semaine, les abonnés se lassent et le réseau montre moins chaque publication : le pas suivant fait perdre ${eur(-b.gain)}.`,
        ];
      },
    },
    {
      id: "la-note-moyenne",
      objectifs: [2],
      type: "montants",
      titre: "La note moyenne des avis",
      notions: ["brand_capital"],
      tableau: () => tableauDesAvis(),
      question: () => {
        return `Calculez le nombre d'avis, la note moyenne (au centième), la part d'avis à 4 ou 5 étoiles (en %). Puis la note moyenne si ${qte(AVIS_NEGATIFS_DU_CHAPITRE)} participants d'une session annulée la veille ajoutaient chacun un avis à 1 étoile, et la note que le site affiche alors, arrondie au dixième.`;
      },
      champs: (c) => {
        const x = contenusDuCabinet(c);
        const detail = AVIS_PAR_NOTE.map((n, i) => `${qte(n)} × ${qte(i + 1)}`).join(" + ");
        return [
          { libelle: "Nombre d'avis", attendu: x.n.avis, calcul: `${AVIS_PAR_NOTE.map((n) => qte(n)).join(" + ")} = ${qte(x.n.avis)}` },
          { libelle: "Note moyenne", attendu: auCentime(x.n.moyenne), calcul: `(${detail}) ÷ ${qte(x.n.avis)} = ${qte(x.n.points)} ÷ ${qte(x.n.avis)} = ${note(auCentime(x.n.moyenne))}`, tolerance: 0.01 },
          { libelle: "Part d'avis à 4 ou 5 étoiles (%)", attendu: enPct(x.n.partDeBonsAvis), calcul: `(${qte(AVIS_PAR_NOTE[3]!)} + ${qte(AVIS_PAR_NOTE[4]!)}) ÷ ${qte(x.n.avis)} = ${pct(x.n.partDeBonsAvis)}`, tolerance: 0.01 },
          {
            libelle: "Note moyenne après les avis à 1 étoile",
            attendu: auCentime(x.apres.moyenne),
            calcul: `(${qte(x.n.points)} + ${qte(AVIS_NEGATIFS_DU_CHAPITRE)}) ÷ (${qte(x.n.avis)} + ${qte(AVIS_NEGATIFS_DU_CHAPITRE)}) = ${qte(x.apres.points)} ÷ ${qte(x.apres.avis)} = ${note(auCentime(x.apres.moyenne))}`,
            tolerance: 0.01,
          },
          { libelle: "Note affichée après ces avis", attendu: x.apres.affichee, calcul: `${note(auCentime(x.apres.moyenne))} arrondi au dixième = ${note(x.apres.affichee)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = contenusDuCabinet(c);
        return [
          `${pct(x.n.partDeBonsAvis, 0)} des participants sont contents ; la note est de ${note(x.n.moyenne)}. Il suffit de ${qte(AVIS_NEGATIFS_DU_CHAPITRE)} avis à 1 étoile pour l'amener à ${note(x.apres.affichee)} : sur ${qte(x.n.avis)} avis, chaque avis pèse lourd, et un avis à 1 étoile s'éloigne de la moyenne bien plus qu'un avis à 5 ne s'en approche.`,
        ];
      },
    },
    {
      id: "predire-les-avis",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur les avis à 5 étoiles",
      notions: ["brand_capital"],
      question: () => {
        return `Avant de calculer, pariez. Après les ${qte(AVIS_NEGATIFS_DU_CHAPITRE)} avis à 1 étoile, combien d'avis à 5 étoiles faut-il pour que la note revienne à ${note(CONVERSION_ET_NOTE.noteDeReference)} ?`;
      },
      options: (c) => {
        const x = contenusDuCabinet(c);
        const voir = "Faites varier les avis à 5 étoiles à l'étape suivante : le curseur montre combien il en faut.";
        return [
          { texte: `Environ ${qte(Math.round(x.aCinq / 10) * 10)}, bien plus`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${qte(AVIS_NEGATIFS_DU_CHAPITRE)}, autant que les avis à 1 étoile`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `${qte(AVIS_NEGATIFS_DU_CHAPITRE * 2)}, le double des avis négatifs`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-avis-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Les avis à 5 étoiles qu'il faut",
      notions: ["brand_capital"],
      question: (c) => {
        const x = contenusDuCabinet(c);
        return `Après les ${qte(AVIS_NEGATIFS_DU_CHAPITRE)} avis à 1 étoile, la fiche compte ${qte(x.apres.avis)} avis et ${qte(x.apres.points)} points. Faites varier les avis à 5 étoiles qui s'ajoutent, de ${qte(AVIS_DU_CURSEUR.min)} à ${qte(AVIS_DU_CURSEUR.max)}. Placez le curseur sur le plus petit nombre qui ramène la moyenne à ${note(CONVERSION_ET_NOTE.noteDeReference)}, puis validez.`;
      },
      grandeur: () => ({ libelle: "Avis à 5 étoiles en plus", unite: "avis" }),
      cible: (c) => ({ attendu: contenusDuCabinet(c).aCinq, min: AVIS_DU_CURSEUR.min, max: AVIS_DU_CURSEUR.max }),
      zones: ["La note est revenue", "La note reste en dessous"],
      rates: () => ({
        dessous: "À cette position, la moyenne reste sous la note visée.",
        dessus: "Moins d'avis suffiraient : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les avis",
      lecture: (c, k) => {
        const x = contenusDuCabinet(c);
        const vise = CONVERSION_ET_NOTE.noteDeReference;
        return [
          { libelle: "Points de la fiche", montant: x.apres.points + 5 * k, unite: "points" },
          { libelle: "Points qu'il faut pour la note visée", montant: auCentime(vise * (x.apres.avis + k)), unite: "points" },
          { libelle: "Note moyenne", montant: auCentime((x.apres.points + 5 * k) / (x.apres.avis + k)), unite: "sur 5", fort: true },
        ];
      },
      droites: (c) => {
        const x = contenusDuCabinet(c);
        const vise = CONVERSION_ET_NOTE.noteDeReference;
        return {
          produit: (k) => x.apres.points + 5 * k,
          cout: (k) => vise * (x.apres.avis + k),
          libelles: ["Points de la fiche", "Points qu'il faut pour la note visée"],
        };
      },
      explication: (c) => {
        const x = contenusDuCabinet(c);
        return [
          `Il faut ${qte(x.aCinq)} avis à 5 étoiles pour effacer ${qte(AVIS_NEGATIFS_DU_CHAPITRE)} avis à 1 étoile. Chaque avis à 1 étoile retire ${note(CONVERSION_ET_NOTE.noteDeReference - 1)} points sous la note visée ; chaque avis à 5 n'en rend que ${note(5 - CONVERSION_ET_NOTE.noteDeReference)}.`,
          "C'est pourquoi une e-réputation se protège en amont, par la qualité du service et en demandant un avis à chaque participant, plutôt qu'elle ne se répare après coup.",
        ];
      },
    },
    {
      id: "la-note-et-la-conversion",
      objectifs: [2],
      type: "montants",
      titre: "Ce que la note change aux ventes",
      notions: ["conversion_rate", "brand_capital", "contribution_margin"],
      question: (c) => {
        const x = contenusDuCabinet(c);
        return `Le site convertit ${pct(x.t.conversion, 1)} à une note affichée de ${note(CONVERSION_ET_NOTE.noteDeReference)} ; chaque dixième de point perdu ôte ${qte(CONVERSION_ET_NOTE.parDixieme * 100)} point de conversion. À ${note(x.apres.affichee)}, calculez la conversion du site (en %), les commandes d'un trimestre de ${qte(x.t.visites)} visites, puis la marge perdue face au premier trimestre, à ${eur(x.t.m.marge)} la commande (négative si elle fait perdre).`;
      },
      champs: (c) => {
        const x = contenusDuCabinet(c);
        const k = x.conversionApres;
        return [
          { libelle: "Conversion à la note affichée (%)", attendu: enPct(k.conversion), calcul: `${pct(x.t.conversion)} − ${qte(-k.dixiemes)} × ${pct(CONVERSION_ET_NOTE.parDixieme)} = ${pct(k.conversion)}`, tolerance: 0.01 },
          { libelle: "Commandes du trimestre", attendu: auCentime(k.commandes), calcul: `${qte(x.t.visites)} × ${pct(k.conversion)} = ${qte(auCentime(k.commandes))}`, tolerance: 0.05 },
          { libelle: "Marge en plus ou en moins", attendu: k.margeEnPlus, calcul: `(${qte(auCentime(k.commandes))} − ${qte(x.t.commandes)}) × ${eur(x.t.m.marge)} = ${eur(k.margeEnPlus)}` },
        ];
      },
      explication: (c) => {
        const x = contenusDuCabinet(c);
        return [
          `${qte(AVIS_NEGATIFS_DU_CHAPITRE)} avis négatifs coûtent ${eur(-x.conversionApres.margeEnPlus)} de marge par trimestre, tant qu'ils pèsent sur la note : plus que la community manager ne coûte en un trimestre. L'e-réputation se lit dans le taux de conversion, sur toutes les sources à la fois.`,
        ];
      },
    },
    {
      id: "les-ecrits-digitaux",
      objectifs: [4],
      type: "tri",
      titre: "Un écrit pour chaque support",
      notions: ["brand_capital"],
      question: () =>
        "Chaque écrit digital a ses codes : sa cible, sa longueur, son registre, ce qu'il demande au lecteur. Rangez chaque règle d'écriture sous le support où elle s'applique.",
      categories: [
        { code: "publication", libelle: "Publication du réseau" },
        { code: "article", libelle: "Article de blog" },
        { code: "reponse", libelle: "Réponse à un avis" },
      ],
      elements: () => [
        { libelle: "Une accroche en deux lignes avant « voir plus », un visuel, une question pour faire réagir", montant: 0, categorie: "publication", pourquoi: "Le fil défile vite : la publication doit arrêter le regard et appeler une réaction." },
        { libelle: "Un titre qui reprend la requête « formation management d'équipe », des intertitres, des liens vers les sessions", montant: 0, categorie: "article", pourquoi: "L'article est lu par le moteur de recherche autant que par l'humain : il sert le référencement naturel." },
        { libelle: "Remercier, reconnaître le problème, dire ce qui change, proposer d'en parler en privé", montant: 0, categorie: "reponse", pourquoi: "La réponse s'adresse au client mécontent, et surtout à tous ceux qui la liront avant d'acheter." },
        { libelle: "Ne citer ni le nom complet du participant ni le détail de sa commande", montant: 0, categorie: "reponse", pourquoi: "Une réponse publique ne divulgue aucune donnée personnelle : le dossier se traite en privé." },
        { libelle: "Un texte long, qui développe un conseil avec un exemple chiffré", montant: 0, categorie: "article", pourquoi: "Le blog est le support où l'on prend le temps : c'est le contenu qui fait venir des visiteurs pendant des mois." },
        { libelle: "Le témoignage filmé d'un participant, avec son accord écrit pour l'image et le nom", montant: 0, categorie: "publication", pourquoi: "Le droit à l'image impose l'accord de la personne filmée avant toute diffusion." },
      ],
      explication: () => [
        "La charte éditoriale du cabinet fixe ces codes : le ton (le vouvoiement, sans jargon), les sujets, le rythme, les visuels. Un même message s'écrit autrement pour le fil d'un réseau, pour le moteur de recherche ou pour un client mécontent.",
      ],
      relance: "Demandez-vous qui lit l'écrit, et ce qu'il doit faire après l'avoir lu.",
    },
    {
      id: "l-avis-negatif",
      objectifs: [4],
      type: "choix",
      titre: "Répondre à un avis négatif",
      notions: ["brand_capital"],
      question: () =>
        "Un participant écrit, avec 1 étoile : « Session annulée la veille par courriel, sans un appel. J'avais posé ma journée. Je ne recommande pas. » Quelle réponse publiez-vous sous l'avis ?",
      options: () => [
        {
          texte: "Excuses, un appel, et désormais un préavis de 7 jours",
          juste: true,
          retour: "Oui : la réponse remercie, reconnaît le problème sans se justifier, dit ce qui change et propose de régler le cas en privé. Elle parle à ceux qui la liront avant d'acheter, autant qu'au participant.",
        },
        {
          texte: "Les conditions générales prévoient l'annulation faute de participants",
          juste: false,
          retour: "Non : elle a peut-être raison sur le droit, mais elle dit au lecteur que le cabinet ne voit pas le problème. Ce que les futurs clients lisent, c'est le ton.",
        },
        {
          texte: "Ne pas répondre, et demander au moteur de recherche de retirer l'avis",
          juste: false,
          retour: "Non : un avis sincère ne se retire pas parce qu'il déplaît, et le silence se lit comme de l'indifférence. Seul un avis faux ou injurieux peut être signalé.",
        },
        {
          texte: "Offrir une place gratuite à ceux qui publieront un avis à 5 étoiles",
          juste: false,
          retour: "Non : acheter des avis positifs est une pratique commerciale trompeuse. On peut demander un avis à chaque participant, sans contrepartie et sans trier ceux qu'on sollicite.",
        },
      ],
    },
    {
      id: "le-rythme-a-proposer",
      objectifs: [3],
      type: "choix",
      titre: "Le rythme à proposer",
      notions: ["customer_lifetime_value", "customer_acquisition_cost", "brand_capital"],
      question: () => "Le directeur demande à quel rythme publier au trimestre suivant, et quoi publier. Que lui proposez-vous ?",
      options: (c) => {
        const x = contenusDuCabinet(c);
        return [
          {
            texte: `${qte(x.meilleurActualise.rythme)} par semaine, avec plus de témoignages`,
            juste: true,
            retour: `Oui : jusqu'à ${qte(x.meilleurActualise.rythme)} par semaine, la publication en plus rapporte ${eur(x.jusquAuMeilleur.gain)} à la valeur actualisée ; au-delà, elle fait perdre ${eur(-x.auDelaDuMeilleur.gain)}. Les témoignages font à la fois réagir et venir sur le site.`,
          },
          {
            texte: `${qte(LEVIERS_DU_RYTHME.rythme.max)} par semaine : chaque contact vaut plus qu'il ne coûte`,
            juste: false,
            retour: `Non : c'est la moyenne. Les dernières publications n'amènent presque plus de contacts : au-delà de ${qte(x.meilleurActualise.rythme)} par semaine, le pas fait perdre ${eur(-x.auDelaDuMeilleur.gain)}.`,
          },
          {
            texte: `${qte(x.meilleurPremiereAnnee.rythme)} par semaine : c'est le meilleur rythme sur la première année`,
            juste: false,
            retour: `Non : un compte ne laisse pas sa marge une seule année. Sur sa valeur vie, même actualisée, publier ${qte(x.meilleurActualise.rythme)} fois par semaine rapporte ${eur(auCentime(x.meilleurActualise.gain - rythmeDePublication(x.meilleurPremiereAnnee.rythme, x.v.actualisee).gain))} de plus.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["brand_capital", "conversion_rate", "customer_lifetime_value"],
      tableau: (c) => {
        const x = contenusDuCabinet(c);
        const rythmes = CONTACTS_SELON_LE_RYTHME.map((_, r) => rythmeDePublication(r, x.v.actualisee)).slice(1);
        return {
          titre: "Le rythme de publication, à la valeur vie actualisée d'un contact",
          colonnes: rythmes.map((r) => `${qte(r.rythme)} par semaine`),
          lignes: [
            { libelle: "Contacts amenés", valeurs: rythmes.map((r) => qte(r.contacts)) },
            { libelle: "Coût de la community manager", valeurs: rythmes.map((r) => eur(r.cout)) },
            { libelle: "Gain des publications", valeurs: rythmes.map((r) => eur(r.gain)) },
          ],
        };
      },
      texte: (c) => {
        const x = contenusDuCabinet(c);
        return [
          `Une publication se juge sur ce qu'elle amène : l'engagement entretient la communauté, le taux de clic mène au site. Chez ${x.f.entreprise}, les conseils font réagir, les annonces font cliquer, les témoignages font les deux. Le marketing entrant amène des contacts à ${eur(x.e.coutParContact)}, qui valent ce que vaudra le compte qu'ils deviendront.`,
          `Le rythme se fixe là où la publication en plus cesse de rapporter ce qu'elle coûte : ${qte(x.meilleurActualise.rythme)} par semaine, et non sur la seule première année. La note des avis se lit dans la conversion : ${qte(AVIS_NEGATIFS_DU_CHAPITRE)} avis à 1 étoile coûtent ${eur(-x.conversionApres.margeEnPlus)} de marge par trimestre, et ${qte(x.aCinq)} avis à 5 étoiles pour les effacer.`,
          "Au niveau de l'examen, vous savez calculer un taux d'engagement, un taux de clic, un coût par contact et une note moyenne, et chiffrer l'effet d'une note sur la conversion. Vous savez fixer un rythme sur la publication en plus, et écrire pour chaque support, jusqu'à la réponse à un avis négatif.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Taux d'engagement = interactions ÷ impressions ; taux de clic = clics ÷ impressions. Valeur d'un contact = valeur d'un compte ÷ contacts par compte. Note moyenne = points ÷ avis. Une publication de plus paie tant que ses contacts valent plus qu'elle ne coûte.",
    },
  ],
};
