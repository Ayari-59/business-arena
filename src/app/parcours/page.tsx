import Link from "next/link";
import type { Metadata } from "next";
import { PARCOURS } from "@/config/parcours";
import { PARCOURS_DE_FORMATION, chapitresDuParcoursDeFormation } from "@/config/cours/parcours-de-formation";
import { ATELIERS, dureeTotaleHeures } from "@/config/ateliers";
import {
  AU_DELA_DES_SEANCES,
  couvertureDeLaFormation,
  coursDeLaFormation,
  referentielDeLaFormation,
} from "@/config/couverture";
import { FORMATIONS } from "@/config/formations";
import { scenariosServant } from "@/config/scenarios/formations-servies";
import { SUR_MESURE } from "@/config/sur-mesure";
import { LIBELLE_DU_DEVIS } from "@/config/tarifs";
import { bouton } from "@/components/bouton";
import { BandeFinale } from "@/components/bande-finale";
import { PiedDePage } from "@/components/pied-de-page";
import { EnTeteDePage } from "@/components/en-tete-de-page";
import { TiroirsDesDiplomes } from "@/components/tiroirs-de-diplomes";
import { PASTILLE_D_ADEQUATION } from "@/components/adequation";
import { contrasteDeLaBande } from "@/config/theme-du-site";
import { getPlatformConfig } from "@/services/admin.service";

export const metadata: Metadata = {
  alternates: { canonical: "/parcours" },
  title: "Référentiels par diplôme",
  description:
    "La correspondance entre votre référentiel et ce que vos étudiants vivent dans l'arène, bloc par bloc, pour chaque diplôme servi.",
};

/**
 * UNE SECTION PAR DIPLÔME, ET PLUS PAR PARCOURS ÉCRIT À LA MAIN.
 *
 * La page s'appelait « Parcours par diplôme » et en citait quatre. Les neuf
 * autres filières n'apparaissaient qu'au pied de page, après cinq mille
 * pixels, sous un titre qui les rangeait parmi les absents. Un enseignant de
 * BTS GPME arrivait donc sur la page faite pour lui répondre, n'y trouvait pas
 * son diplôme, et repartait.
 *
 * CE QUI A CHANGÉ, C'EST LA SOURCE. La correspondance bloc par bloc n'avait
 * pas à être écrite : chaque séance d'atelier nomme déjà les blocs du
 * référentiel qu'elle mobilise, avec les mots du référentiel. Groupés par
 * bloc, ils donnent la couverture de chaque diplôme sans que personne ne la
 * recopie (src/config/couverture.ts). Le tableau écrit à la main en oubliait
 * d'ailleurs deux, P2 et P7 du BTS CG, ce qu'aucune relecture n'avait vu.
 *
 * Les quatre parcours gardent ce que la donnée ne sait pas dire : des réglages
 * de partie conseillés, un propos, une limite assumée.
 */

/** Une ancre lisible : accents dépliés, le reste en tirets. */
function ancre(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Les formations, dans l'ordre du registre, avec leur parcours s'il existe. */
const TOUTES_LES_FILIERES = (() => {
  // UN BLOC DE RÉFÉRENTIEL APPARTIENT À UNE FORMATION. La page portait douze
  // sections dont trois n'en étaient pas : une découverte ouverte à toutes les
  // filières, un approfondissement, un tournoi inter-filières. Elles
  // affichaient pourtant des « blocs de référentiel » — « Étape 1 · Lire une
  // situation et fixer un prix », « Volet 3 · Piloter la trésorerie » — qui
  // sont nos propres découpages et ne figurent dans aucun arrêté.
  //
  // LE REGROUPEMENT SE FAIT SUR LES RATTACHEMENTS, PLUS SUR UN NOM. L'atelier
  // portait un champ `diplome` au singulier, donc il ne pouvait paraître que
  // sous une formation : un nom n'a qu'une valeur. Il déclare maintenant
  // celles qu'il sert, et le tournoi inter-filières paraît sous les quatre.
  return FORMATIONS.map((formation) => {
    // UN ATELIER ENTRE PAR SON RATTACHEMENT, PLUS PAR SON RÉFÉRENTIEL PROPRE.
    // Le filtre exigeait aussi qu'il ait une entrée au registre des
    // référentiels, ce qui écartait le tournoi inter-filières : il n'en a pas,
    // puisqu'il préfixe ses blocs du diplôme dont ils viennent. Il servait
    // pourtant quatre formations, et c'est à elles qu'il appartient. Ses blocs
    // se résolvent vers l'entrée officielle de chacune (blocOfficiel), donc ils
    // rejoignent ceux des autres ateliers au lieu de faire doublon.
    const ateliers = ATELIERS.filter((a) =>
      a.formations.includes(formation.code),
    );
    const parcours = PARCOURS.find((p) => p.formation === formation.code);
    return {
      // L'ancre d'un parcours ne bouge pas : elle est déjà liée ailleurs.
      // Pour les autres, elle se tire du SIGLE et non du nom entier : « BTS
      // Management en hôtellerie-restauration » donnait une ancre où chaque
      // lettre accentuée laissait un trou (« h-tellerie »), parce qu'une
      // minuscule accentuée ne tombe pas dans [a-z]. Les accents se déplient
      // avant, et le sigle donne une adresse qu'on peut lire à voix haute.
      id: parcours?.code ?? ancre(formation.sigle),
      // L'ancre peut être celle d'un parcours ; le code de la formation est ce
      // qui interroge le registre, et les deux ne coïncident pas toujours.
      code: formation.code,
      diplome: formation.nom,
      sigle: formation.sigle,
      parcours,
      ateliers,
      // CE QUE LE TIROIR FERMÉ DOIT ENCORE DIRE. Un repli qui ne laisse qu'un
      // titre transforme la page en sommaire : on ne sait plus ce qu'il y a
      // derrière, donc on n'ouvre pas. Compté depuis la donnée, jamais écrit.
      blocs: couvertureDeLaFormation(formation.code).length,
      // SUR COMBIEN. « 5 blocs de référentiel » sous le DCG laissait croire
      // que le diplôme en comptait cinq ; il a treize unités, et la page du
      // diplôme les montre toutes. Sans texte lu, il n'y a pas de total.
      entrees: referentielDeLaFormation(formation.code)?.entrees.length ?? null,
      // Les chapitres du cours qui servent ce diplôme, comptés eux aussi.
      chapitres: coursDeLaFormation(formation.code).reduce(
        (n, g) => n + g.chapitres.length,
        0,
      ),
      // LES ENTREPRISES QUI SERVENT CE DIPLÔME, lues dans le registre des
      // entreprises (config/scenarios/formations-servies) : celles que ses
      // déroulés font jouer, et celles qui lui conviennent sans déroulé.
      entreprises: scenariosServant(formation.code).map((s) => s.playerTeamName),
      // LE VOLUME NE S'ADDITIONNE PAS QUAND IL Y A PLUSIEURS CHEMINS. Le BTS
      // MCO en a deux, de cinq et six séances : annoncer « 11 séances, 36
      // heures » promettrait un parcours que personne ne jouera. Un seul
      // chemin donne son volume ; plusieurs se comptent, et le volume se lit
      // dans la section.
      volume:
        ateliers.length === 1
          ? `${ateliers[0]!.seances.length} séances, ${Math.round(dureeTotaleHeures(ateliers[0]!))} heures`
          : `${ateliers.length} chemins proposés`,
    };
  });
})();

/** Les formations servies par au moins un atelier. */
const FILIERES = TOUTES_LES_FILIERES.filter((f) => f.ateliers.length > 0);

/**
 * LES DIPLÔMES QUE LE COURS SERT SANS ATELIER. Un bac pro, une seconde ou le
 * DSCG ont leur texte au registre et une page de couverture, mais aucun
 * déroulé de séances : leur tiroir n'aurait ni réglages ni mise en œuvre. Ils
 * se listent à part, avec ce que leur page montre.
 */
const DIPLOMES_SANS_ATELIER = TOUTES_LES_FILIERES.filter(
  (f) => f.ateliers.length === 0 && f.entrees !== null,
);

/**
 * PLUS D'EMOJI SUR CETTE PAGE. Quatre diplômes en portaient un — 🎓 🛍️ 🤝 🧮 —
 * et la limite assumée une balance. Le système les dessine à sa façon : ils
 * changent d'un appareil à l'autre, en couleurs étrangères à la maison, et se
 * brouillent au vidéoprojecteur, qui est justement l'écran de cette page. Le
 * nom du diplôme se suffit ; il est d'ailleurs le seul repère qu'un enseignant
 * cherche ici.
 */
export default async function ParcoursPage() {
  // Quelles bandes sont à contre-jour : le réglage de l'admin, ou l'état d'origine.
  const { theme } = await getPlatformConfig();
  const c = (id: string) => contrasteDeLaBande(theme, id);
  return (
    <>
      <main id="main" className="min-h-screen bg-slate-950 text-slate-100">
        {/*
          PAS DE DEUXIÈME BARRE DE NAVIGATION. Cette page portait la sienne, avec
          son logo et ses liens, sous l'en-tête du site : sur un téléphone, les
          deux logos se superposaient, « Parcours » se collait au second, et le
          bouton « Jouer » sortait de l'écran (débord mesuré de 79 px à 390, 149 à
          320). Les liens qu'elle portait sont tous dans le plan du site, que
          l'en-tête ouvre déjà.
        */}
        <EnTeteDePage
          surtitre="Référentiels par diplôme"
          titre={<>Votre référentiel, vécu dans l&apos;arène</>}
          chapeau={
            <>
              Business Arena a été construit par un enseignant. Pour chaque diplôme : les blocs de
              son référentiel, ce qui s&apos;y joue, et ce qui n&apos;est qu&apos;effleuré. Les
              blocs portent les mots de leur référentiel.
            </>
          }
        >
          {/* « Tout déplier » tient compagnie à l'index : c'est le même
              geste — choisir où regarder — et le seul moyen de retrouver un
              mot par Ctrl+F, que les tiroirs fermés soustraient au
              navigateur. */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <nav
              aria-label="Les diplômes couverts"
              className="flex flex-wrap gap-2"
            >
              {FILIERES.map((f) => (
                <a
                  key={f.id}
                  href={`#${f.id}`}
                  className="rounded-full border border-white/10 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
                >
                  {f.sigle}
                </a>
              ))}
            </nav>
            <TiroirsDesDiplomes />
          </div>
        </EnTeteDePage>

        <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
          {FILIERES.map((f) => (
            <details
              key={f.id}
              id={f.id}
              data-diplome={f.sigle}
              className="group carte scroll-mt-24 transition-colors hover:border-white/25"
            >
              {/*
                LES SIGNAUX DU TIROIR MAISON : le chevron ambre qui pivote et le
                compte de ce qui attend derrière. Le trait pointillé du tiroir
                fermé est tombé ici : sur le site, le pointillé dit une zone vide
                ou en attente, et une carte de diplôme fermée n'est pas vide.
                Le bord est plein, ouvert comme fermé (audit P2-16). Le composant Tiroir
                lui-même est taillé pour l'arène — titre en petites capitales,
                marges serrées — et écraserait le nom du diplôme, qui est le
                seul repère cherché ici ; ce sont donc ses signaux qu'on
                reprend, pas son gabarit, pour ne pas ouvrir un deuxième
                dialecte du repli.

                Le titre reste un vrai h2 DANS le résumé : le modèle de contenu
                de summary admet un titre, et l'y laisser garde le plan de la
                page — douze diplômes, douze entrées — au lieu de le réduire à
                une page sans structure dès que tout est replié.
              */}
              <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-start gap-x-4 p-6 [&::-webkit-details-marker]:hidden sm:p-8">
                <span className="text-xs uppercase tracking-surtitre text-amber-400">
                  {f.sigle}
                </span>
                <span
                  aria-hidden
                  className="row-span-3 self-center text-base text-amber-400/80 transition-transform group-open:rotate-90"
                >
                  ▸
                </span>
                <h2 className="mt-2 text-2xl font-bold leading-tight text-slate-50">
                  {f.diplome}
                </h2>
                <span className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.blocs} blocs de référentiel
                  {f.entrees ? ` sur ${f.entrees}` : ""} · {f.volume}
                  {f.chapitres > 0
                    ? ` · ${f.chapitres} chapitre${f.chapitres > 1 ? "s" : ""} de cours`
                    : ""}
                  {f.parcours ? " · réglages conseillés" : ""}
                </span>
              </summary>
              <div className="border-t border-white/10 px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
                {/*
                  LA PAGE DU DIPLÔME, EN TÊTE DU TIROIR. Le tiroir résume ; la
                  page donne le tableau entier, entrée par entrée du texte, y
                  compris ce que rien ne travaille, et le cours qui le sert.
                */}
                <p className="mb-5">
                  <Link
                    href={`/parcours/${f.code}`}
                    className="text-sm font-semibold text-amber-300 underline-offset-4 hover:underline"
                  >
                    Le tableau de couverture complet, entrée par entrée
                  </Link>
                </p>
                {f.parcours ? (
                  <>
                    <p className="max-w-2xl text-base leading-relaxed text-slate-400">
                      {f.parcours.pitch}
                    </p>
                    <div className="mt-5 rounded-xl border border-amber-400/20 bg-slate-950 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                        Réglages conseillés à la création
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Niveau {f.parcours.recommended.level} ·{" "}
                        {f.parcours.recommended.levelName} ·{" "}
                        {f.parcours.recommended.periodicityLabel} · TVA{" "}
                        {f.parcours.recommended.vat
                          ? "activée (20 %)"
                          : "désactivée"}
                      </p>
                      <p className="mt-1 text-base leading-relaxed text-slate-400">
                        {f.parcours.recommended.notes}
                      </p>
                    </div>
                  </>
                ) : null}

                {f.entreprises.length > 0 ? (
                  <p
                    data-entreprises-du-diplome=""
                    className="mt-5 text-sm leading-relaxed text-slate-400"
                  >
                    <span className="font-medium text-slate-300">
                      Les entreprises qui servent ce diplôme :
                    </span>{" "}
                    {f.entreprises.join(", ")}. Une même entreprise sert
                    plusieurs formations, chacune à son niveau.
                  </p>
                ) : null}

                {/*
                  LE RÉFÉRENTIEL SE PRÉSENTE UNE FOIS, PAS UNE FOIS PAR DÉROULÉ.
                  La page affichait une liste par déroulé : pour le BTS MCO, qui
                  en a deux, le même « Bloc 3 · Assurer la gestion
                  opérationnelle » apparaissait deux fois, et le lecteur
                  recousait lui-même ce que son diplôme exige. Elle parlait de
                  ce que nous proposons, quand il vient voir ce qu'il doit
                  couvrir. Le bloc vient donc d'abord, et ce qui le met en jeu
                  ensuite, comme une preuve et non comme un sujet.
                */}
                <ul className="mt-6">
                  {couvertureDeLaFormation(f.code).map((b) => (
                    <li
                      key={b.referentiel}
                      className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1.5 border-t border-white/5 py-4"
                    >
                      <p className="text-sm font-medium text-slate-200">
                        {b.referentiel}
                      </p>
                      <span
                        className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${PASTILLE_D_ADEQUATION[b.adequation].className}`}
                      >
                        {PASTILLE_D_ADEQUATION[b.adequation].label}
                      </span>
                      {b.commentaire ? (
                        <p className="col-span-2 text-sm leading-relaxed text-slate-300">
                          {b.commentaire}
                        </p>
                      ) : null}
                      <p className="col-span-2 text-sm text-slate-400">
                        {/*
                          LES SÉANCES NE S'ADDITIONNENT PAS d'un déroulé à
                          l'autre : deux déroulés d'un même diplôme sont des
                          chemins alternatifs, pas un parcours de onze séances.
                          Chaque dénominateur reste donc le sien, et le titre du
                          déroulé n'apparaît que lorsqu'il y en a plusieurs à
                          distinguer.
                        */}
                        {/*
                            LE CHEMIN SE NOMME DÈS QUE LE DIPLÔME EN A
                            PLUSIEURS, et non dès que le bloc en occupe
                            plusieurs. « 1 séance sur 5 » sous un diplôme qui
                            propose deux chemins ne disait pas lequel, et
                            l'enseignant qui a choisi l'autre croyait le bloc
                            couvert chez lui.
                          */}
                        {b.presences
                          .map(
                            (p) =>
                              `${f.ateliers.length > 1 ? `${p.titre} : ` : ""}${p.seances.length} séance${p.seances.length > 1 ? "s" : ""} sur ${p.seancesEnTout}`,
                          )
                          .join(" · ")}
                        {/* SANS CETTE PHRASE, LA LIGNE SE CONTREDIT. « 1 séance sur 6 »
                            sous une pastille « cœur du jeu » se lit comme une faute de
                            frappe, et c'en serait une si le comptage disait toute la
                            vérité : le moteur rejoue la TVA à chaque tour, que la
                            séance la nomme ou non. L'écart entre le compte et la
                            pastille est réel, donc il se dit là où il se voit. */}
                        {b.declaree
                          ? ", et rejoué à chaque tour par le moteur au-delà des séances qui le nomment"
                          : ""}
                        {b.presences.length === 0
                          ? "Aucune séance d'atelier : le cours le travaille seul"
                          : ""}
                      </p>
                      {b.chapitres.length > 0 ? (
                        <p
                          data-chapitres-du-bloc=""
                          className="col-span-2 text-sm leading-relaxed text-slate-400"
                        >
                          Dans le cours :{" "}
                          {b.chapitres.map((ch, i) => (
                            <span key={ch.code}>
                              {i > 0 ? ", " : ""}
                              <Link
                                href={`/cours/${ch.code}`}
                                className="text-slate-300 underline-offset-4 transition-colors hover:text-amber-300 hover:underline"
                              >
                                {ch.titre}
                              </Link>
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {f.ateliers
                  .flatMap((a) => AU_DELA_DES_SEANCES[a.code] ?? [])
                  .map((note) => (
                    <p
                      key={note.referentiel}
                      className="mt-4 rounded-lg border border-white/5 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-slate-400"
                    >
                      <span className="font-medium text-slate-300">
                        {note.referentiel}
                      </span>
                      , hors séance : {note.quoi}
                    </p>
                  ))}

                {f.parcours?.limite ? (
                  <p className="mt-6 rounded-lg border border-white/5 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-slate-400">
                    Limite assumée : {f.parcours.limite}
                  </p>
                ) : null}

                {/*
                  LA MISE EN ŒUVRE EN PIED DE SECTION, ET PAS EN TÊTE. Elle
                  ouvrait chaque diplôme — titre du déroulé, nombre de séances,
                  volume horaire — si bien que la page répondait « voici notre
                  produit » à quelqu'un venu demander « mon programme est-il
                  couvert ». La réponse d'abord, le moyen ensuite.
                */}
                <div className="mt-6 border-t border-white/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Mise en œuvre
                  </p>
                  {f.ateliers.map((a) => (
                    <p
                      key={a.code}
                      className="mt-2 text-sm leading-relaxed text-slate-400"
                    >
                      <Link
                        href={`/animations/${a.code}`}
                        className="font-medium text-slate-200 underline-offset-4 transition-colors hover:text-amber-300 hover:underline"
                      >
                        {a.titre}
                      </Link>{" "}
                      · {a.annee} · {a.seances.length} séances,{" "}
                      {Math.round(dureeTotaleHeures(a))} heures ·{" "}
                      {a.referentielLabel} {a.referentielAccord}.
                    </p>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>

        {/* LES PARCOURS DE FORMATION DU COURS (le BUT) : un chapitre n'a qu'un parcours, celui de sa
            discipline ; une formation regroupe ceux qui citent ses compétences, sans les dupliquer,
            et une classe peut la choisir pour parcours (config/cours/parcours-de-formation.ts). */}
        <section
          aria-labelledby="parcours-de-formation"
          className="mx-auto max-w-4xl space-y-4 px-6 pb-8"
          data-parcours-de-formation=""
        >
          <h2
            id="parcours-de-formation"
            className="text-2xl font-bold leading-tight text-slate-50"
          >
            Les parcours de formation du cours
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-slate-400">
            Les chapitres du cours s&apos;écrivent par discipline. Pour le BUT,
            un parcours de formation regroupe ceux qui travaillent ses
            compétences, d&apos;où qu&apos;ils viennent : une classe qui le
            choisit les ouvre tous, avec leurs cas pratiques.
          </p>
          <ul className="grid gap-2">
            {PARCOURS_DE_FORMATION.map((p) => (
              <li key={p.code} data-parcours-de-formation={p.code} title={p.resume}>
                <Link
                  href={`/cours?diplome=${p.formation}#programme`}
                  className="font-medium text-slate-200 underline-offset-4 transition-colors hover:text-amber-300 hover:underline"
                >
                  {p.titre}
                </Link>{" "}
                <span className="text-sm text-slate-400">
                  · {chapitresDuParcoursDeFormation(p.code).length} chapitres
                </span>
              </li>
            ))}
          </ul>
        </section>

        {DIPLOMES_SANS_ATELIER.length > 0 ? (
          <section
            aria-labelledby="sans-atelier"
            className="mx-auto max-w-4xl space-y-4 px-6 pb-8"
          >
            <h2
              id="sans-atelier"
              className="text-2xl font-bold leading-tight text-slate-50"
            >
              Les diplômes servis par le cours
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-slate-400">
              Pas encore d&apos;atelier écrit pour ces diplômes : leur
              référentiel est lu, et le chiffre dit combien de ses entrées le
              cours travaille. Un atelier se construit sur mesure : la bande
              en bas de page dit ce que nous demandons et ce que nous livrons.
            </p>
            {/* DES PASTILLES, PAS DES CARTES : la page repliée doit rester un
                index (la garde e2e en mesure la hauteur sur un téléphone). Le
                détail, entrées travaillées et chapitres, est sur la page du
                diplôme et dans l'infobulle. */}
            <ul className="flex flex-wrap gap-2">
              {DIPLOMES_SANS_ATELIER.map((f) => (
                <li key={f.code} data-diplome-sans-atelier={f.sigle}>
                  <Link
                    href={`/parcours/${f.code}`}
                    title={`${f.diplome} : ${f.blocs} sur ${f.entrees} entrées travaillées${f.chapitres > 0 ? `, ${f.chapitres} chapitre${f.chapitres > 1 ? "s" : ""} de cours` : ""}`}
                    className="inline-block rounded-full border border-white/10 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
                  >
                    {f.sigle}
                    <span className="text-slate-400">
                      {" "}
                      · {f.blocs}/{f.entrees}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* La bande sort de la colonne de lecture : une fin de page tient toute
            la largeur, sinon elle reste une carte de plus dans la pile. */}
        {/* LA BANDE FINALE DIT LES SITUATIONS SUR MESURE, avec les mots de
            config/sur-mesure.ts : la même promesse que l'encart des ateliers et
            l'option de la grille des offres. Le bouton fait ce que le texte
            demande, le rendez-vous du menu, et le devis vient en second
            (audit P2-16, puis audit des ateliers d'octobre). */}
        <BandeFinale
          id="parcours.finale"
          contraste={c("parcours.finale")}
          titre={SUR_MESURE.titre}
          texte={SUR_MESURE.promesse}
        >
          <Link href={SUR_MESURE.appel.rendezVous.href} className={bouton({ taille: "l" })}>
            {SUR_MESURE.appel.rendezVous.libelle}
          </Link>
          <Link
            href={SUR_MESURE.appel.devis.href}
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:text-amber-300"
          >
            {LIBELLE_DU_DEVIS}
          </Link>
        </BandeFinale>
      </main>
      <PiedDePage />
    </>
  );
}
