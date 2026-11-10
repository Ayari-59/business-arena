import { qte } from "../../../pedagogy/cours/deux-decimales";
import {
  ENTREPRISES_DU_RESEAU,
  LIGNE,
  PERSONNES_DU_BUREAU,
  POSTE,
  RAPPORT,
  URL_D_INSCRIPTION,
  VISIO,
  adressesDePostes,
  debitDesVisios,
  debitPourLesVisios,
  secondesPourLeRapport,
  visiosQueLaLigneTient,
} from "../monde/reseau-d-atlas";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : RÉSEAUX ET INFORMATIQUE EN NUAGE, PROTOCOLES, ADRESSES ET ARCHITECTURE (Bac STMG,
 * enseignement spécifique de systèmes d'information de gestion de terminale, thème 4, question 4.2 :
 * « Comment les technologies réseaux répondent-elles aux besoins de collaboration ? »).
 *
 * La normalisation des échanges : les protocoles et les services, le codage des données (le bit,
 * l'octet, le débit), les supports de transmission ; le temps d'un envoi et la capacité d'une ligne,
 * éprouvée au laboratoire ; l'adressage et la configuration d'un hôte ; l'accès à une ressource (l'URL,
 * le DNS, le modèle client-serveur) ; l'architecture et sa sécurisation (le réseau privé virtuel) ; la
 * centralisation et la décentralisation ; la chaîne de blocs ; l'informatique en nuage, ses services et
 * ses critères de choix.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez ATLAS CONSEIL, dont les consultants travaillent chez les
 * clients et à distance : monde/reseau-d-atlas.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la taille du rapport et le temps d'envoi sont des grandeurs
 * au centième (au dixième près, avant) ; les adresses sont des quantités.
 */

const mbits = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} Mbit/s`;

const configurationDuPoste = (): TableauDeDonnees => ({
  titre: "La configuration réseau d'un poste du bureau",
  colonnes: ["Valeur"],
  lignes: [
    { libelle: "Adresse IP", valeurs: [POSTE.adresse] },
    { libelle: "Masque de sous-réseau", valeurs: [POSTE.masque] },
    { libelle: "Passerelle par défaut", valeurs: [POSTE.passerelle] },
    { libelle: "Serveur DNS", valeurs: [POSTE.passerelle] },
  ],
});

export const RESEAUX_ET_INFORMATIQUE_EN_NUAGE: Chapitre = {
  code: "reseaux-et-informatique-en-nuage",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 4 · Système d'information et échange"],
  titre: "Réseaux et informatique en nuage : protocoles, adresses et architecture",
  accroche:
    "Les consultants d'ATLAS CONSEIL travaillent au bureau, chez les clients et chez eux. Ce qui relie leurs postes : des protocoles, des adresses, une ligne et son débit, un réseau à protéger, et des services dans le nuage à bien choisir.",
  objectifs: [
    "Identifier les protocoles mis en jeu dans l'accès à une ressource distante",
    "Calculer un temps d'envoi et la capacité d'une ligne",
    "Lire la configuration d'un hôte du réseau",
    "Choisir une architecture sûre : centralisation, décentralisation, accès à distance",
    "Situer ce que change une chaîne de blocs",
    "Choisir une solution d'informatique en nuage",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_RESEAU, pourquoi: "ce chapitre relie les postes des consultants d'ATLAS CONSEIL." },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Travailler ensemble, à distance",
      texte: (c) => [
        `${c.entreprise} compte ${qte(PERSONNES_DU_BUREAU)} personnes, consultants et commerciaux. Le matin, certaines sont au bureau, d'autres chez un client, d'autres chez elles. Toutes ouvrent les mêmes dossiers, se parlent en visioconférence, envoient leurs rapports.`,
        "Un réseau relie des machines pour qu'elles échangent. Pour se comprendre, elles suivent des règles communes, les protocoles : c'est la normalisation des échanges.",
      ],
      repere: () => "Un réseau relie des machines · des protocoles communs · des supports · des adresses.",
    },
    {
      id: "codage-et-supports",
      type: "lecture",
      titre: "Coder, transmettre",
      texte: () => [
        "Toute donnée circule codée en bits, des 0 et des 1 ; 8 bits font un octet. La taille d'un fichier se compte en octets (un mégaoctet, Mo) ; le débit d'une ligne, en bits par seconde (un mégabit par seconde, Mbit/s). Pour passer de l'un à l'autre, on multiplie les octets par 8.",
        "Les données voyagent sur des supports : le câble de cuivre, la fibre optique (de la lumière), les ondes radio (le Wi-Fi, la 4G et la 5G). Le protocole TCP/IP découpe les données en paquets, les adresse et vérifie qu'ils arrivent tous.",
      ],
      repere: () => "Bit, octet (8 bits) · débit en Mbit/s · cuivre, fibre, radio · TCP/IP : des paquets adressés.",
    },
    {
      id: "les-protocoles",
      objectifs: [0],
      type: "tri",
      titre: "À chaque protocole son rôle",
      question: () => "Rangez chaque tâche selon le protocole qui l'assure.",
      categories: [
        { code: "https", libelle: "HTTPS" },
        { code: "dns", libelle: "DNS" },
        { code: "smtp", libelle: "SMTP" },
        { code: "dhcp", libelle: "DHCP" },
      ],
      elements: () => [
        { libelle: "Afficher la page d'un site, de façon chiffrée", montant: 0, categorie: "https", pourquoi: "Le protocole du Web, sécurisé : HTTPS." },
        { libelle: "Trouver l'adresse IP qui correspond à un nom de domaine", montant: 0, categorie: "dns", pourquoi: "L'annuaire d'Internet : le DNS." },
        { libelle: "Envoyer un courriel au serveur de messagerie", montant: 0, categorie: "smtp", pourquoi: "L'envoi des courriels : SMTP." },
        { libelle: "Donner une adresse IP au portable qui se branche au bureau", montant: 0, categorie: "dhcp", pourquoi: "L'attribution automatique des adresses : DHCP." },
      ],
      relance: "La tâche affiche-t-elle une page, traduit-elle un nom, envoie-t-elle un courriel, ou donne-t-elle une adresse ?",
      explication: () => ["Chaque service du réseau a son protocole. Un geste aussi simple qu'ouvrir un site en met plusieurs en jeu, l'un après l'autre."],
    },
    {
      id: "ouvrir-le-site",
      objectifs: [0],
      type: "choix",
      titre: "Accéder à une ressource distante",
      question: () => `Un consultant tape ${URL_D_INSCRIPTION}. Que fait son navigateur avant de demander la page au serveur ?`,
      options: () => [
        { texte: "Il demande au DNS l'adresse IP du nom", juste: true, retour: "Oui : le navigateur, le client, demande d'abord au DNS l'adresse de formations.atlas.example ; puis il envoie sa requête HTTPS au serveur, qui renvoie la page. L'URL dit le protocole (https), le nom de domaine, et le chemin (/inscription)." },
        { texte: "Il télécharge tout le site sur le poste, pour ne plus dépendre du réseau ensuite", juste: false, retour: "Non : le client demande une ressource précise, le serveur ne renvoie que celle-ci." },
        { texte: "Rien : le nom du site suffit au réseau", juste: false, retour: "Non : les machines se trouvent par leur adresse IP, pas par leur nom." },
      ],
    },
    {
      id: "le-temps-d-envoi",
      objectifs: [1],
      type: "montants",
      titre: "Le temps d'un envoi",
      question: () => `La ligne du bureau envoie ${mbits(LIGNE.envoiMbits)}. Un rapport de fin de mission pèse ${qte(RAPPORT.mo)} Mo. Convertissez sa taille en mégabits, puis calculez le temps de son envoi, en secondes, si la ligne lui est toute réservée.`,
      champs: () => [
        { libelle: "Taille du rapport (Mbit)", nature: "grandeur", attendu: RAPPORT.mo * 8, calcul: `${qte(RAPPORT.mo)} × 8 = ${qte(RAPPORT.mo * 8)}` },
        { libelle: "Temps d'envoi (secondes)", nature: "grandeur", attendu: secondesPourLeRapport(), calcul: `${qte(RAPPORT.mo * 8)} ÷ ${qte(LIGNE.envoiMbits)} = ${qte(secondesPourLeRapport())}` },
      ],
      explication: () => [`${qte(secondesPourLeRapport() / 60)} minutes pour un seul rapport, et la ligne est prise pendant ce temps. Le débit se partage entre tout ce qui circule en même temps.`],
    },
    {
      id: "le-laboratoire-des-visios",
      objectifs: [1],
      type: "simulation",
      titre: "Combien de visioconférences en même temps ?",
      question: () =>
        `Le cabinet garde ${qte(LIGNE.partReservee * 100)} % de la ligne pour le reste : les courriels, les fichiers, les mises à jour. Une visioconférence envoie ${mbits(VISIO.envoiMbits)}. Faites varier le nombre de visioconférences lancées en même temps depuis le bureau.`,
      leviers: () => [{ code: "visios", libelle: "Visioconférences en même temps", unite: "visioconférences", min: 0, max: PERSONNES_DU_BUREAU, pas: 1, depart: 0 }],
      lecture: (_c, p) => {
        const n = p.visios ?? 0;
        return [
          { libelle: "Débit envoyé par les visioconférences", montant: debitDesVisios(n), unite: "Mbit/s", fort: true },
          { libelle: "Débit qui leur est laissé", montant: debitPourLesVisios(), unite: "Mbit/s" },
        ];
      },
      defi: () => {
        const tient = (n: number) => debitDesVisios(n) <= debitPourLesVisios() + 1e-9;
        return {
          consigne: "Trouvez le plus grand nombre de visioconférences que la ligne tient sans déborder.",
          atteint: (p) => tient(p.visios ?? 0) && !tient((p.visios ?? 0) + 1),
          indice: (p) => (tient(p.visios ?? 0) ? "La ligne tient encore : une visioconférence de plus passerait-elle ?" : "La ligne déborde : les images se figent. Revenez en arrière."),
          solution: { visios: visiosQueLaLigneTient() },
        };
      },
      graphique: () => ({
        levier: "visios",
        unite: "Mbit/s",
        courbes: [
          { libelle: "Débit des visioconférences", valeur: (p) => debitDesVisios(p.visios ?? 0) },
          { libelle: "Débit laissé", valeur: () => debitPourLesVisios() },
        ],
      }),
      montrer: "Montrer le nombre",
      explication: () => [`La ligne tient ${qte(visiosQueLaLigneTient())} visioconférences, pour ${qte(PERSONNES_DU_BUREAU)} personnes. Au-delà, les images se figent pour tout le monde : la ligne ne répond plus au besoin de collaboration du cabinet.`],
    },
    {
      id: "l-adressage",
      type: "lecture",
      titre: "Une adresse pour chaque hôte",
      tableau: configurationDuPoste,
      texte: () => [
        "Chaque machine du réseau, chaque hôte, a une adresse IP. Le masque dit quelle partie de l'adresse désigne le réseau, et quelle partie le poste : avec 255.255.255.0, les 3 premiers nombres sont ceux du réseau, le dernier celui du poste.",
        "La passerelle est la porte de sortie vers les autres réseaux, ici la box ; le serveur DNS traduit les noms en adresses. Les postes d'un même réseau se parlent directement, par un commutateur qui les relie en étoile.",
      ],
      repere: () => "Adresse IP · masque · passerelle · serveur DNS · commutateur, routeur, réseau en étoile.",
    },
    {
      id: "la-configuration",
      objectifs: [2],
      type: "tri",
      titre: "Lire la configuration",
      tableau: configurationDuPoste,
      question: () => "Rangez chaque rôle selon l'élément de la configuration qui le tient.",
      categories: [
        { code: "adresse", libelle: "Adresse IP" },
        { code: "masque", libelle: "Masque" },
        { code: "passerelle", libelle: "Passerelle" },
        { code: "dns", libelle: "Serveur DNS" },
      ],
      elements: () => [
        { libelle: "Identifier ce poste parmi tous ceux du bureau", montant: 0, categorie: "adresse", pourquoi: "L'adresse IP est propre au poste." },
        { libelle: "Dire quelle partie de l'adresse est celle du réseau", montant: 0, categorie: "masque", pourquoi: "Le masque sépare le réseau et le poste." },
        { libelle: "Faire sortir les paquets vers Internet", montant: 0, categorie: "passerelle", pourquoi: "La passerelle, ici la box, mène aux autres réseaux." },
        { libelle: "Traduire un nom de domaine en adresse", montant: 0, categorie: "dns", pourquoi: "Le serveur DNS, que la box tient aussi ici." },
      ],
      relance: "L'élément identifie-t-il le poste, découpe-t-il l'adresse, ouvre-t-il vers l'extérieur, ou traduit-il des noms ?",
      explication: () => ["Une seule erreur dans ces 4 lignes, et le poste ne voit plus rien : c'est le premier endroit où regarder quand le réseau ne répond pas."],
    },
    {
      id: "le-meme-reseau",
      objectifs: [2],
      type: "choix",
      titre: "Le même réseau ?",
      tableau: configurationDuPoste,
      question: () => `Avec le masque ${POSTE.masque}, quelle adresse est dans le même réseau que le poste ${POSTE.adresse} ?`,
      options: () => {
        const [a, b, c] = POSTE.adresse.split(".");
        return [
          { texte: `${a}.${b}.${c}.42`, juste: true, retour: `Oui : les 3 premiers nombres sont les mêmes, ${a}.${b}.${c}. Les 2 postes se parlent directement, sans passer par la passerelle.` },
          { texte: `${a}.${b}.${Number(c) + 1}.23`, juste: false, retour: "Non : le troisième nombre diffère, c'est un autre réseau. Il faut passer par un routeur." },
          { texte: `${a}.${Number(b) + 1}.${c}.23`, juste: false, retour: "Non : le deuxième nombre diffère, c'est un autre réseau." },
        ];
      },
    },
    {
      id: "les-adresses-disponibles",
      objectifs: [2],
      type: "montants",
      titre: "Combien de postes ?",
      question: () => `Le dernier nombre de l'adresse, celui du poste, est codé sur ${qte(POSTE.bitsDHote)} bits. Combien d'adresses donne-t-il, et combien peuvent aller à des postes, sachant que la première désigne le réseau et la dernière sert à la diffusion ?`,
      champs: () => [
        { libelle: "Adresses du réseau", nature: "quantite", attendu: 2 ** POSTE.bitsDHote, calcul: `2 puissance ${qte(POSTE.bitsDHote)} = ${qte(2 ** POSTE.bitsDHote)}` },
        { libelle: "Adresses de postes", nature: "quantite", attendu: adressesDePostes(), calcul: `${qte(2 ** POSTE.bitsDHote)} − 2 = ${qte(adressesDePostes())}` },
      ],
      explication: () => [`Le réseau du bureau peut accueillir ${qte(adressesDePostes())} hôtes : de quoi brancher tous les postes, les imprimantes et les téléphones du cabinet.`],
    },
    {
      id: "acceder-a-distance",
      objectifs: [3],
      type: "choix",
      titre: "Accéder au bureau depuis un client",
      question: () => "Chez un client, sur le réseau sans fil de son hôtel, une consultante doit ouvrir les dossiers du serveur du cabinet. Quelle solution est sûre ?",
      options: () => [
        { texte: "Un réseau privé virtuel (VPN) vers le cabinet", juste: true, retour: "Oui : le VPN chiffre tout ce qui passe entre son poste et le cabinet, comme si elle y était. Le pare-feu du bureau ne laisse entrer que ces connexions-là." },
        { texte: "Ouvrir le serveur à tout Internet, sans mot de passe, pour que chacun y accède", juste: false, retour: "Non : n'importe qui pourrait lire les dossiers des clients." },
        { texte: "Copier les dossiers sur une clé, au cas où", juste: false, retour: "Non : une clé se perd, et la copie ne sera plus à jour." },
      ],
    },
    {
      id: "centraliser-ou-non",
      objectifs: [3],
      type: "tri",
      titre: "Centraliser ou décentraliser",
      question: () => "Rangez chaque effet selon l'architecture qui l'apporte.",
      categories: [
        { code: "centralisation", libelle: "Plutôt la centralisation" },
        { code: "decentralisation", libelle: "Plutôt la décentralisation" },
      ],
      elements: () => [
        { libelle: "Une seule version de chaque dossier, sur le serveur du cabinet", montant: 0, categorie: "centralisation", pourquoi: "L'unicité et l'intégrité de l'information." },
        { libelle: "Un seul serveur à sauvegarder et à protéger", montant: 0, categorie: "centralisation", pourquoi: "La mutualisation des ressources, et des économies d'échelle." },
        { libelle: "Si le serveur tombe, plus personne ne travaille", montant: 0, categorie: "centralisation", pourquoi: "La limite de la centralisation : la disponibilité." },
        { libelle: "Chaque consultant garde ses dossiers sur son poste, même sans réseau", montant: 0, categorie: "decentralisation", pourquoi: "La proximité de l'information utile." },
        { libelle: "Il faut synchroniser les copies pour qu'elles restent identiques", montant: 0, categorie: "decentralisation", pourquoi: "Le prix de la décentralisation : la synchronisation." },
      ],
      relance: "L'effet vient-il de tout garder au même endroit, ou de répartir les données entre les postes ?",
      explication: () => ["Le choix dépend de l'organisation : un cabinet dont les consultants sont souvent en route a besoin des deux, un serveur central et des copies synchronisées."],
    },
    {
      id: "la-chaine-de-blocs",
      objectifs: [4],
      type: "choix",
      titre: "La chaîne de blocs",
      question: () => "Une chaîne de blocs est un registre partagé entre de nombreux participants : chaque bloc d'opérations est lié au précédent, et chacun garde une copie. Qu'est-ce que cela change ?",
      options: () => [
        { texte: "Personne ne peut modifier seul le registre", juste: true, retour: "Oui : un système distribué, sans organe central. Une opération inscrite ne se change pas sans l'accord des autres. Cela pose la question du contrôle, de la loi applicable, et du rôle des intermédiaires qui disparaissent." },
        { texte: "Un seul serveur, celui du cabinet, garde toutes les opérations et décide de tout", juste: false, retour: "Non : c'est l'architecture centralisée, l'inverse de la chaîne de blocs." },
        { texte: "Les données deviennent secrètes pour tous", juste: false, retour: "Non : dans beaucoup de chaînes de blocs, chaque participant peut lire le registre." },
      ],
    },
    {
      id: "les-services-du-nuage",
      objectifs: [5],
      type: "tri",
      titre: "Les services du nuage",
      question: () => "L'informatique en nuage loue à distance des ressources informatiques. Rangez chaque offre.",
      categories: [
        { code: "saas", libelle: "Un logiciel en ligne (SaaS)" },
        { code: "paas", libelle: "Une plateforme (PaaS)" },
        { code: "iaas", libelle: "Une infrastructure (IaaS)" },
      ],
      elements: () => [
        { libelle: "Une messagerie et une suite bureautique, prêtes à l'emploi", montant: 0, categorie: "saas", pourquoi: "Le logiciel est fourni et tenu à jour : du SaaS." },
        { libelle: "Un espace pour développer et faire tourner l'application d'inscription", montant: 0, categorie: "paas", pourquoi: "Le cabinet écrit l'application, le fournisseur gère tout le reste : du PaaS." },
        { libelle: "Des serveurs virtuels loués, que le cabinet installe lui-même", montant: 0, categorie: "iaas", pourquoi: "Seule la machine est fournie : de l'IaaS." },
      ],
      relance: "Le fournisseur donne-t-il un logiciel tout fait, un lieu pour faire tourner le sien, ou seulement des machines ?",
      explication: () => ["Plus le service est complet, moins le cabinet a à gérer, mais plus il dépend du fournisseur."],
    },
    {
      id: "choisir-le-nuage",
      objectifs: [5],
      type: "choix",
      titre: "Choisir un fournisseur",
      question: (c) => `${c.entreprise} hésite entre 2 offres de stockage en ligne pour les dossiers de ses clients. Que doit-elle vérifier avant tout ?`,
      options: () => [
        { texte: "Où sont gardées les données, et comment les récupérer", juste: true, retour: "Oui : le lieu de stockage dit quelle loi s'applique aux données des clients ; la portabilité dit si l'on peut partir avec elles. S'y ajoutent les services, la sécurité et la solidité du fournisseur." },
        { texte: "Seulement le prix par mois, puisque tous les nuages se valent au fond", juste: false, retour: "Non : un fournisseur qui disparaît, ou qui garde les données hors de portée, coûte bien plus cher." },
        { texte: "La couleur de son logiciel", juste: false, retour: "Non : ce n'est pas un critère de choix." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `Les postes du cabinet ${c.entreprise} se parlent par des protocoles normalisés : TCP/IP, DNS, HTTPS, SMTP, DHCP. Une donnée circule en bits, à un débit : la ligne du bureau tient ${qte(visiosQueLaLigneTient())} visioconférences. Chaque hôte a son adresse, son masque, sa passerelle. Le VPN protège l'accès à distance ; le nuage se choisit sur ses services, la loi, la portabilité et la solidité du fournisseur.`,
        "Dans l'arène, vos décisions partent de votre navigateur vers un serveur : quels protocoles les portent ?",
      ],
      repere: () => "Protocoles · bit, octet, débit · supports · adresse IP, masque, passerelle, DNS · client-serveur, URL · VPN, pare-feu · centralisation, décentralisation · chaîne de blocs · SaaS, PaaS, IaaS.",
    },
  ],
};
