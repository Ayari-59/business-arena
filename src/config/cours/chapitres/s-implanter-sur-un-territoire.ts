import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { COMMUNAUTE, ENTREPRISES_DE_L_IMPLANTATION, LOYERS_ESSAYES, SITE_DU_HAUT_VERDASSE, demenager, loyerMaximal } from "../monde/implantation-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : S'IMPLANTER SUR UN TERRITOIRE, ÉCOSYSTÈME, CLUSTER ET INNOVATION (Bac STMG, management,
 * sciences de gestion et numérique de terminale, enseignement commun, thème 3, question 3.4 : « Quelles
 * relations entre les organisations et leur écosystème ? »).
 *
 * La stratégie d'implantation et les ressources qu'un territoire apporte (humaines, financières et
 * fiscales, infrastructures de transport et numériques, services publics, pépinières, supports
 * techniques, formation, chambres consulaires), l'implantation, la délocalisation et la relocalisation,
 * le déménagement de NOVA au Haut-Verdasse chiffré au laboratoire, les effets réciproques de
 * l'organisation sur son territoire, l'écosystème d'affaires, la grappe d'entreprises (cluster) et le pôle
 * de compétitivité, l'écosystème d'innovation, le rôle des pouvoirs publics locaux et les inégalités
 * d'accès au numérique.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA, face à la communauté de communes :
 * monde/implantation-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const S_IMPLANTER_SUR_UN_TERRITOIRE: Chapitre = {
  code: "s-implanter-sur-un-territoire",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 3 · Les organisations et la société"],
  titre: "S'implanter sur un territoire : écosystème, cluster et innovation",
  accroche:
    "Une zone d'activités raccordée à la fibre, une pépinière, un lycée professionnel, des entreprises voisines du même métier : ce qu'un territoire apporte à une entreprise, ce qu'elle lui rend, et le déménagement de NOVA chiffré.",
  objectifs: [
    "Repérer les ressources qu'un territoire apporte à une organisation",
    "Distinguer implantation, délocalisation et relocalisation",
    "Chiffrer un choix d'implantation",
    "Reconnaître un écosystème d'affaires, un cluster, un écosystème d'innovation",
    "Situer le rôle des pouvoirs publics locaux et du numérique",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_IMPLANTATION,
    pourquoi: "ce chapitre suit le projet de NOVA de s'installer sur le territoire de la communauté de communes.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une organisation sur un territoire",
      texte: (c) => [
        `Le local de ${c.entreprise} coûte cher, et la ligne y manque de place. La ${COMMUNAUTE.nom} lui propose un bâtiment dans sa nouvelle zone d'activités, raccordée à la fibre, à côté de sa pépinière d'entreprises et d'un lycée professionnel.`,
        "Toute organisation est implantée sur un territoire, qui lui fournit des ressources ; en retour, elle agit sur lui : des emplois, des impôts, du trafic, une image. Les grandes usines ont longtemps façonné des villes entières, leurs écoles et leurs quartiers.",
      ],
      repere: () => "Implantation : le choix du lieu, selon les ressources du territoire et les effets sur lui.",
    },
    {
      id: "les-ressources-du-territoire",
      objectifs: [0],
      type: "tri",
      titre: "Ce que le territoire apporte",
      question: () => "Rangez chaque atout du Haut-Verdasse selon la ressource qu'il apporte à NOVA.",
      categories: [
        { code: "humaines", libelle: "Ressources humaines et formation" },
        { code: "financieres", libelle: "Ressources financières et fiscales" },
        { code: "infrastructures", libelle: "Infrastructures" },
        { code: "accompagnement", libelle: "Accompagnement des entreprises" },
      ],
      elements: () => [
        { libelle: "Le lycée professionnel, qui forme des électroniciens", montant: 0, categorie: "humaines", pourquoi: "Des compétences à recruter, et des stagiaires." },
        { libelle: `L'aide à l'implantation de ${eur(SITE_DU_HAUT_VERDASSE.aide)} votée par la communauté`, montant: 0, categorie: "financieres", pourquoi: "Une ressource financière publique." },
        { libelle: "La fibre optique et l'accès rapide à l'autoroute", montant: 0, categorie: "infrastructures", pourquoi: "Des infrastructures numériques et de transport." },
        { libelle: "La pépinière d'entreprises et la chambre de commerce, qui conseillent les jeunes entreprises", montant: 0, categorie: "accompagnement", pourquoi: "Un accompagnement : pépinière et organisme consulaire." },
      ],
      relance: "L'atout apporte-t-il des personnes et des compétences, de l'argent, des réseaux de transport et de communication, ou du conseil ?",
      explication: () => ["Un territoire offre aussi ses services publics, des centres techniques et des laboratoires de recherche. Les organisations comparent ces ressources quand elles choisissent où s'implanter."],
    },
    {
      id: "implanter-delocaliser-relocaliser",
      objectifs: [1],
      type: "tri",
      titre: "Implanter, délocaliser, relocaliser",
      question: () => "Rangez chaque décision.",
      categories: [
        { code: "implantation", libelle: "Implantation" },
        { code: "delocalisation", libelle: "Délocalisation" },
        { code: "relocalisation", libelle: "Relocalisation" },
      ],
      elements: () => [
        { libelle: "NOVA ouvre un atelier dans la zone d'activités du Haut-Verdasse", montant: 0, categorie: "implantation", pourquoi: "Un nouveau lieu de production : une implantation." },
        { libelle: "Un concurrent ferme son usine en France pour faire monter ses enceintes à l'étranger, où le travail coûte moins", montant: 0, categorie: "delocalisation", pourquoi: "La production part à l'étranger : une délocalisation." },
        { libelle: "Un fabricant de câbles ramène en France une production qu'il avait envoyée à l'étranger, pour livrer plus vite", montant: 0, categorie: "relocalisation", pourquoi: "La production revient : une relocalisation." },
      ],
      relance: "L'entreprise s'installe-t-elle quelque part, part-elle à l'étranger, ou revient-elle ?",
      explication: () => ["Ces choix ont des effets forts sur l'emploi : une délocalisation supprime des emplois ici, une relocalisation en recrée. Leur prise en compte fait partie de la responsabilité des organisations."],
    },
    {
      id: "le-laboratoire-de-l-implantation",
      objectifs: [2],
      type: "simulation",
      titre: "À quel loyer déménager ?",
      question: (c) => {
        const s = SITE_DU_HAUT_VERDASSE;
        return `${c.entreprise} paie ${eur(demenager(0).actuel)} de loyer par mois. Au Haut-Verdasse, ses livraisons coûteraient ${eur(s.transportEnPlusParMois)} de plus par mois ; le déménagement coûte ${eur(s.demenagement)}, et la communauté verse ${eur(s.aide)} d'aide. NOVA juge le choix sur ${qte(s.ans)} ans. Faites varier le loyer du bâtiment, que le président négocie.`;
      },
      leviers: () => [{ code: "loyer", libelle: "Loyer mensuel du bâtiment", unite: "€", ...LOYERS_ESSAYES, depart: LOYERS_ESSAYES.max }],
      lecture: (_c, p) => {
        const d = demenager(p.loyer!);
        return [
          { libelle: "Économie de chaque mois, transport compris", montant: d.parMois, effet: true },
          { libelle: `Économie sur ${qte(SITE_DU_HAUT_VERDASSE.ans)} ans`, montant: d.surLaDuree },
          { libelle: "Aide de la communauté moins le déménagement", montant: SITE_DU_HAUT_VERDASSE.aide - SITE_DU_HAUT_VERDASSE.demenagement },
          { libelle: "Ce que rapporte le déménagement", montant: d.gain, effet: true, fort: true },
        ];
      },
      defi: () => {
        const juste = loyerMaximal();
        return {
          consigne: `Trouvez le plus haut loyer, de ${eur(LOYERS_ESSAYES.pas)} en ${eur(LOYERS_ESSAYES.pas)}, pour lequel le déménagement rapporte encore sur ${qte(SITE_DU_HAUT_VERDASSE.ans)} ans.`,
          atteint: (p) => p.loyer === juste,
          indice: (p) => {
            const d = demenager(p.loyer!);
            return d.gain < 0 ? `À ${eur(p.loyer!)}, le déménagement fait perdre ${eur(-d.gain)} sur la durée.` : `À ${eur(p.loyer!)}, il rapporte ${eur(d.gain)} : un loyer plus haut rapporterait-il encore ?`;
          },
          solution: { loyer: juste },
        };
      },
      explication: (_c, p) => {
        const d = demenager(p.loyer!);
        return [
          `Défi relevé : jusqu'à ${eur(p.loyer!)} de loyer, le déménagement rapporte ${eur(d.gain)} sur ${qte(SITE_DU_HAUT_VERDASSE.ans)} ans. C'est le plafond de la négociation ; le reste se juge sur d'autres critères : la place pour une deuxième ligne, le recrutement, la fibre.`,
        ];
      },
    },
    {
      id: "les-effets-sur-le-territoire",
      objectifs: [0],
      type: "choix",
      titre: "Ce que NOVA rend au territoire",
      question: () => "Pourquoi la communauté de communes aide-t-elle NOVA à s'installer ?",
      options: () => [
        {
          texte: "Pour les emplois, les impôts et l'activité qu'elle amène",
          juste: true,
          retour: "Oui : l'entreprise recrute sur place, paie des impôts locaux, fait travailler d'autres entreprises. L'aide est un investissement du territoire dans son attractivité.",
        },
        {
          texte: "Parce qu'une communauté de communes doit financer toutes les entreprises qui le demandent",
          juste: false,
          retour: "Non : elle choisit les projets qui servent l'intérêt général du territoire, dans les règles qui encadrent les aides publiques.",
        },
        {
          texte: "Pour en devenir propriétaire, puisqu'elle a payé une partie du déménagement",
          juste: false,
          retour: "Non : une aide n'est pas une prise de capital. NOVA reste une société privée.",
        },
      ],
    },
    {
      id: "les-ecosystemes",
      type: "lecture",
      titre: "Écosystème d'affaires, cluster, innovation",
      texte: () => [
        "Les organisations n'agissent pas seules. Un écosystème d'affaires réunit autour d'une entreprise ses fournisseurs, ses clients, ses partenaires, qui dépendent les uns des autres. Une grappe d'entreprises (un cluster) rassemble sur un territoire des entreprises du même métier, qui coopèrent tout en se faisant concurrence ; un pôle de compétitivité y ajoute la recherche et la formation.",
        "Un écosystème d'innovation lie entreprises, laboratoires, écoles et financeurs pour faire naître des produits nouveaux. Avec le numérique, ces réseaux débordent le territoire : on coopère aussi à distance.",
      ],
      repere: () => "Écosystème d'affaires · cluster (grappe d'entreprises) · pôle de compétitivité · écosystème d'innovation.",
    },
    {
      id: "reconnaitre-les-ecosystemes",
      objectifs: [3],
      type: "tri",
      titre: "Reconnaître le réseau",
      question: () => "Rangez chaque réseau dont NOVA pourrait faire partie.",
      categories: [
        { code: "affaires", libelle: "Écosystème d'affaires" },
        { code: "cluster", libelle: "Cluster" },
        { code: "innovation", libelle: "Écosystème d'innovation" },
      ],
      elements: () => [
        { libelle: "NOVA, son fournisseur de composants, CampusTech et le transporteur qui livre", montant: 0, categorie: "affaires", pourquoi: "Des partenaires liés par les échanges : l'écosystème d'affaires de NOVA." },
        { libelle: "Douze fabricants audio de la région qui achètent ensemble leurs composants et partagent un salon", montant: 0, categorie: "cluster", pourquoi: "Des entreprises du même métier, sur un territoire, qui coopèrent : un cluster." },
        { libelle: "NOVA, un laboratoire d'acoustique de l'université et une start-up de la pépinière, qui inventent un haut-parleur", montant: 0, categorie: "innovation", pourquoi: "Entreprises et recherche ensemble pour innover : un écosystème d'innovation." },
      ],
      relance: "Le réseau relie-t-il des partenaires d'affaires, des entreprises du même métier d'une même région, ou des acteurs qui inventent ensemble ?",
      explication: () => ["Ces réseaux structurent les territoires et renforcent leur attractivité : une entreprise vient là où elle trouve des partenaires."],
    },
    {
      id: "les-pouvoirs-publics-locaux",
      objectifs: [4],
      type: "choix",
      titre: "Le rôle des pouvoirs publics locaux",
      question: () => "Un village voisin n'a pas encore la fibre ; aucune entreprise ne s'y installe. Que montre cette situation ?",
      options: () => [
        {
          texte: "L'accès au numérique pèse sur la localisation des entreprises",
          juste: true,
          retour: "Oui : les inégalités d'accès au numérique ont des effets sur l'emploi et l'attractivité. Les pouvoirs publics locaux agissent : raccordement, zones d'activités, pépinières, plans d'accompagnement.",
        },
        {
          texte: "Rien : avec le télétravail, le lieu d'une entreprise n'a plus aucune importance",
          juste: false,
          retour: "Non : sans réseau, même le travail à distance est impossible. Le territoire compte toujours.",
        },
        {
          texte: "C'est aux entreprises seules de tirer la fibre jusqu'au village",
          juste: false,
          retour: "Non : les réseaux sont surtout une affaire d'investissement public et d'opérateurs. Les collectivités jouent un rôle déterminant.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const l = loyerMaximal();
        return [
          `${c.entreprise} choisit son implantation selon les ressources du territoire (des compétences, une aide, la fibre, un accompagnement) et le coût du site : au Haut-Verdasse, le déménagement rapporte jusqu'à ${eur(l)} de loyer. En retour, elle apporte des emplois et des impôts, et peut rejoindre un cluster ou un écosystème d'innovation.`,
          "Dans l'arène, votre entreprise fait face à ses concurrents et à son marché : ce chapitre rappelle que derrière, il y a un territoire.",
        ];
      },
      repere: () => "Implantation, délocalisation, relocalisation · ressources du territoire · effets réciproques · écosystème d'affaires, cluster, pôle de compétitivité, écosystème d'innovation · pouvoirs publics locaux et numérique.",
    },
  ],
};
