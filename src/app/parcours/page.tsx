import Link from "next/link";
import type { Metadata } from "next";
import { PARCOURS } from "@/config/parcours";
import { ATELIERS, dureeTotaleHeures } from "@/config/ateliers";
import {
  AU_DELA_DES_SEANCES,
  couvertureDeLaFormation,
} from "@/config/couverture";
import { FORMATIONS } from "@/config/formations";
import { bouton } from "@/components/bouton";
import { BandeFinale } from "@/components/bande-finale";
import { PiedDePage } from "@/components/pied-de-page";
import { TiroirsDesDiplomes } from "@/components/tiroirs-de-diplomes";
import { contrasteDeLaBande } from "@/config/theme-du-site";
import { getPlatformConfig } from "@/services/admin.service";

export const metadata: Metadata = {
  alternates: { canonical: "/parcours" },
  title: "Parcours par diplôme",
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

/** Les formations servies, dans l'ordre du registre, avec leur parcours s'il existe. */
const FILIERES = (() => {
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
    const parcours = PARCOURS.find((p) =>
      ateliers.some((a) => p.ateliers.includes(a.code)),
    );
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
  }).filter((f) => f.ateliers.length > 0);
})();

const ADEQUATION: Record<string, { label: string; className: string }> = {
  coeur: {
    label: "cœur du jeu",
    className: "border-emerald-400/40 text-emerald-300",
  },
  couvert: { label: "couvert", className: "border-sky-400/40 text-sky-300" },
  partiel: {
    label: "partiel",
    className: "border-slate-400/40 text-slate-400",
  },
};

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
        <header className="mx-auto max-w-4xl px-6 pb-4 pt-10">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
            Parcours par diplôme
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
            Votre référentiel, vécu dans l&apos;arène
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            Business Arena a été construit par un enseignant. Pour chaque
            diplôme : les blocs de son référentiel, ce qui s&apos;y joue, et ce
            qui n&apos;est qu&apos;effleuré. Les blocs portent les mots de leur
            référentiel.
          </p>
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
        </header>

        <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
          {FILIERES.map((f) => (
            <details
              key={f.id}
              id={f.id}
              data-diplome={f.sigle}
              className="group scroll-mt-24 rounded-2xl border border-dashed border-white/15 bg-slate-900 open:border-solid open:border-white/10"
            >
              {/*
                LES TROIS SIGNAUX DU TIROIR MAISON, repris tels quels : le
                chevron ambre qui pivote, le trait pointillé qui devient plein,
                et le compte de ce qui attend derrière. Le composant Tiroir
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
                <span className="text-xs uppercase tracking-[0.2em] text-amber-400">
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
                  {f.blocs} blocs de référentiel · {f.volume}
                  {f.parcours ? " · réglages conseillés" : ""}
                </span>
              </summary>
              <div className="border-t border-white/10 px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
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
                        className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${ADEQUATION[b.adequation]!.className}`}
                      >
                        {ADEQUATION[b.adequation]!.label}
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
                      </p>
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

        {/* La bande sort de la colonne de lecture : une fin de page tient toute
            la largeur, sinon elle reste une carte de plus dans la pile. */}
        <BandeFinale
          id="parcours.finale"
          contraste={c("parcours.finale")}
          titre="Votre diplôme n'est pas dans cette liste ?"
          texte="Les mêmes mécaniques servent d'autres référentiels : écrivez-nous, et nous regardons ensemble ce que votre programme demande."
        >
          <Link href="/teacher/login" className={bouton({ taille: "l" })}>
            Créer ma première partie
          </Link>
          <Link
            href="/guide"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:text-amber-300"
          >
            Guide de prise en main
          </Link>
        </BandeFinale>
      </main>
      <PiedDePage />
    </>
  );
}
