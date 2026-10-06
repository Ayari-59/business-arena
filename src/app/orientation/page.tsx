import type { Metadata } from "next";
import { publicDeLAtelier } from "@/config/formations";
import Link from "next/link";
import { OrientationForm } from "@/components/orientation-form";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { ATELIERS } from "@/config/ateliers";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { OBJECTIFS } from "@/config/orientation";
import { familyOf, scenarioByCode } from "@/config/scenarios/registry";
import { nomEntreprise } from "@/config/scenarios/presentation";
import { PiedDePage } from "@/components/pied-de-page";

/**
 * La page ne lit rien par utilisateur (pas de searchParams, pas de session) :
 * comme la landing (#99), on la met en cache et on la régénère au plus toutes
 * les 5 min (ISR). L'envoi de la demande passe par une action serveur, qui
 * lit l'adresse de contact au moment de l'envoi.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/orientation" },
  title: "Choisir sa simulation",
  description:
    "Quatre questions pour trouver l'entreprise, le niveau et la durée qui conviennent à votre classe.",
};

/** Combien de diplômes une entrée nomme avant de dire « et N autres ». */
const DIPLOMES_MONTRES = 3;

/**
 * PAR OBJECTIF PÉDAGOGIQUE : CE QUE LE FORMULAIRE NE MONTRE PAS.
 *
 * Le formulaire pose quatre questions et rend UNE recommandation, avec ses
 * raisons. C'est ce qu'il faut à qui sait déjà ce qu'il veut travailler. Mais
 * un enseignant qui découvre le produit se demande l'inverse : « je veux
 * faire travailler la trésorerie et le BFR — qu'est-ce que ça donne ici ? »,
 * et la réponse n'existait nulle part. Il fallait deviner l'objectif pour
 * obtenir un résultat, sans jamais voir l'étendue des objectifs possibles.
 *
 * RIEN N'EST CALCULÉ ICI. Les neuf objectifs, le secteur que chacun sert, le
 * niveau qu'il exige et la raison de ce choix vivent déjà dans
 * `config/orientation.ts` — c'est le même registre que le formulaire
 * interroge. Cette table ne fait que le DÉPLIER : elle montre les règles au
 * lieu de les appliquer, et les deux ne peuvent pas diverger.
 *
 * LES ATELIERS SE DÉDUISENT, ils ne s'attribuent pas. Un atelier sert un
 * objectif s'il se joue sur l'entreprise que cet objectif sert — la famille,
 * pas la variante, parce que le niveau décide seul de la variante jouée. Là
 * où aucun atelier n'existe, on le dit : c'est une information utile, elle
 * signifie que la séance est à écrire.
 */
function parObjectif() {
  const tete = (code: string) => familyOf(code)?.head ?? code;
  return OBJECTIFS.filter((o) => o.secteur !== null).map((o) => {
    const scenario = scenarioByCode(o.secteur!);
    const niveau = DIFFICULTY_PRESETS.find((p) => p.level === o.niveauMinimum);
    const ateliers = ATELIERS.filter(
      (a) => tete(a.reglages.scenarioCode) === tete(o.secteur!),
    );
    // Deux ateliers d'un même diplôme ne font qu'une entrée : le lecteur
    // cherche un public, pas un catalogue.
    const parPublic = new Map<string, string>();
    for (const a of ateliers) {
      const vise = publicDeLAtelier(a);
      if (!parPublic.has(vise)) parPublic.set(vise, a.code);
    }
    return {
      code: o.code,
      libelle: o.libelle,
      raison: o.raison,
      entreprise: nomEntreprise(scenario),
      niveauNom: niveau?.name ?? "",
      niveauRang: o.niveauMinimum,
      diplomes: [...parPublic.entries()].map(([diplome, atelier]) => ({
        diplome,
        atelier,
      })),
    };
  });
}

export default function OrientationPage() {
  return (
    <>
      <main id="main" className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-xs uppercase tracking-annonce text-amber-400">
          Business Arena · orientation
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-50">
          Quelle simulation pour votre classe
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
          {/* SCENARIOS compte les DÉFINITIONS, variantes « gamme » comprises : quinze.
              Le visiteur, lui, choisit parmi les TUILES — une par famille, neuf — et
              c'est ce nombre que disent l'accueil, les entreprises, les fonctionnalités
              et l'espace enseignant. Cette page annonçait donc quinze entreprises pour
              en proposer neuf. */}
          {/* L'accroche annonçait « répondez à quatre questions » juste au-dessus
              du titre qui le dit maintenant. Elle garde ce qu'elle seule peut
              dire : pourquoi le choix est difficile, et ce que vaut la réponse. */}
          {SCENARIO_CHOICES.length} entreprises, {DIFFICULTY_PRESETS.length}{" "}
          niveaux de difficulté, une durée réglable et {ATELIERS.length}{" "}
          ateliers prêts à animer. Beaucoup de combinaisons, et le mauvais
          réglage ne se voit qu&apos;en séance trois. Deux chemins mènent au
          bon.
        </p>

        {/*
          LE FORMULAIRE N'AVAIT PAS DE TITRE.

          C'est l'outil principal de la page, et il était un bloc anonyme : la
          page faisait un H1, puis un seul H2 — « OU partez de ce que vous
          voulez faire travailler » — qui répondait à quelque chose qui n'avait
          jamais été nommé. Le défaut est né en ajoutant la table des
          objectifs sous un chemin qui, lui, n'a pas de nom.

          Les deux chemins portent donc chacun le sien, et le « ou » retrouve
          son antécédent.
        */}
        <section aria-labelledby="quatre-questions" className="mt-8 sm:mt-12">
          <h2
            id="quatre-questions"
            className="text-2xl font-bold text-slate-50"
          >
            Répondez à quatre questions
          </h2>
          {/* Sur téléphone, le parcours en étapes pose ces questions une à une : les
              énumérer d'abord repousserait la première sous la ligne de flottaison. */}
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400 max-sm:hidden">
            Le diplôme, le moment de l&apos;année, ce que vous voulez faire
            travailler, et le temps dont vous disposez. La recommandation
            s&apos;écrit à mesure.
          </p>
          <div className="mt-4 sm:mt-8">
            <OrientationForm />
          </div>
        </section>

        {/*
          LA TABLE DES OBJECTIFS, SOUS LE FORMULAIRE ET NON AU-DESSUS.

          Le chemin guidé reste le premier : quatre questions et un réglage
          complet. Celui-ci est le chemin de celui qui veut d'abord VOIR — ce
          qu'on peut faire travailler, avec quelle entreprise, à partir de quel
          niveau, et pour quels publics une séance existe déjà.
        */}
        <section
          aria-labelledby="objectifs"
          className="mt-16 border-t border-white/10 pt-10"
        >
          <h2 id="objectifs" className="text-2xl font-bold text-slate-50">
            Ou partez de ce que vous voulez faire travailler
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
            Chaque objectif a son métier : celui qui rend la notion visible sans
            qu&apos;il faille la chercher. Le niveau indiqué est le minimum à
            partir duquel les leviers nécessaires sont ouverts.
          </p>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {parObjectif().map((o) => (
              <div key={o.code} className="border-t border-white/10 pt-4">
                <h3 className="text-base font-semibold text-slate-100">
                  {o.libelle}
                </h3>
                <p className="mt-1.5 text-sm text-slate-300">
                  <Link
                    href="/entreprises"
                    className="font-semibold text-amber-400 underline-offset-4 transition-colors hover:text-amber-300 hover:underline"
                  >
                    {o.entreprise}
                  </Link>
                  <span className="text-slate-400">
                    {" "}
                    · à partir du niveau {o.niveauNom}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {o.raison}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {o.diplomes.length === 0 ? (
                    // Le dire plutôt que le taire : cela signifie que la séance
                    // reste à écrire, et c'est ce qu'un enseignant a besoin de
                    // savoir avant de choisir.
                    <>Aucun atelier publié sur ce métier pour l&apos;instant.</>
                  ) : (
                    <>
                      Atelier prêt à animer pour{" "}
                      {o.diplomes.slice(0, DIPLOMES_MONTRES).map((d, i) => (
                        <span key={d.atelier}>
                          {i > 0 ? ", " : ""}
                          <Link
                            href={`/animations/${d.atelier}`}
                            className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-amber-200 hover:decoration-amber-400/60"
                          >
                            {d.diplome}
                          </Link>
                        </span>
                      ))}
                      {o.diplomes.length > DIPLOMES_MONTRES
                        ? ` et ${o.diplomes.length - DIPLOMES_MONTRES} autres`
                        : ""}
                      .
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-sm leading-relaxed text-slate-400">
          Vous préférez en parler de vive voix ?{" "}
          <Link
            href="/rendez-vous"
            className="text-slate-400 underline-offset-4 hover:underline"
          >
            Prenez un rendez-vous téléphonique
          </Link>
          . Rien n&apos;est figé. Secteur, niveau, durée et périodicité se
          changent à la création. Une partie qui ne convient pas se relance en
          trente secondes. Voir{" "}
          <Link
            href="/entreprises"
            className="text-slate-400 underline-offset-4 hover:underline"
          >
            les fiches des entreprises
          </Link>{" "}
          ou{" "}
          <Link
            href="/animations"
            className="text-slate-400 underline-offset-4 hover:underline"
          >
            les ateliers publiés
          </Link>
          .
        </p>
      </main>
      <PiedDePage />
    </>
  );
}
