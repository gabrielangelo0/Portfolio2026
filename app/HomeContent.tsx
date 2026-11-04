"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { FINISH, MILESTONES } from "@/lib/career";
import { profile, projects, stack } from "@/lib/data";
import type { Localized } from "@/lib/i18n";
import { Effects, Typewriter } from "./Effects";
import { Products } from "./Products";

/** Frases que o hero escreve e apaga, uma de cada frente de trabalho. */
const TYPED: Record<"en" | "pt", string[]> = {
  en: [
    "SaaS platforms.",
    "mobile apps.",
    "automation that runs itself.",
    "integrations that cannot fail.",
  ],
  pt: [
    "plataformas SaaS.",
    "apps mobile.",
    "automação que roda sozinha.",
    "integrações que não podem falhar.",
  ],
};

const UI: Record<string, Localized> = {
  drivePill: { en: "Drive through my portfolio", pt: "Dirija pelo meu portfólio" },
  iBuild: { en: "I build", pt: "Eu construo" },
  leadIntro: {
    en: "I work end to end: database and API design, the interface people actually use, and the integrations in between. Right now I build products at ",
    pt: "Trabalho de ponta a ponta: desenho de banco de dados e API, a interface que as pessoas realmente usam, e as integrações no meio do caminho. Agora mesmo eu construo produtos no ",
  },
  leadMid: { en: " and ", pt: " e " },
  leadOutro: {
    en: ", and teach full stack development at ",
    pt: ", e ensino desenvolvimento full stack na ",
  },
  emailMe: { en: "Email me", pt: "Enviar e-mail" },
  skipToContent: { en: "Skip to the content", pt: "Pular para o conteúdo" },
  whoAmI: { en: "Who am I?", pt: "Quem sou eu?" },
  point1: {
    en: "Go and PostgreSQL back ends behind Next.js front ends, in production.",
    pt: "Back ends em Go e PostgreSQL atrás de front ends em Next.js, em produção.",
  },
  point2: {
    en: "Mobile with React Native and Expo, offline-first when it has to be.",
    pt: "Mobile com React Native e Expo, offline-first quando precisa ser.",
  },
  point3: {
    en: "Automation and integrations that take manual steps out of the day.",
    pt: "Automação e integrações que tiram passos manuais do dia a dia.",
  },
  thingsBuilt: { en: "Things I've built", pt: "Coisas que eu construí" },
  toolsWork: { en: "Tools I work with", pt: "Ferramentas que eu uso" },
  roadSoFar: { en: "The road so far", pt: "A estrada até aqui" },
  whatIDo: { en: "What I do", pt: "O que eu faço" },
  viewMore: { en: "View more →", pt: "Ver mais →" },
  letsTalk: { en: "Let's talk", pt: "Vamos conversar" },
  footer: {
    en: "Built with Next.js, React Three Fiber and Rapier. No cookies — just a car.",
    pt: "Feito com Next.js, React Three Fiber e Rapier. Sem cookies — só um carro.",
  },
};

/**
 * O corpo da porta de entrada do portfólio, à parte para poder usar o idioma
 * escolhido — `app/page.tsx` fica só com a metadata, que precisa de server
 * component. O conteúdo é lido das mesmas fontes do mundo 3D — `projects`,
 * `stack` e os marcos da pista — para as duas versões nunca discordarem.
 */
export function HomeContent() {
  const { lang, t } = useLanguage();

  const contact = projects.find((project) => project.id === "contact");
  const about = projects.find((project) => project.id === "about");
  const sections = projects.filter(
    (project) => project.id !== "contact" && project.id !== "about",
  );

  // duas voltas na mesma lista: a faixa precisa emendar sem costura visível
  const marquee = stack.flatMap((group) => group.items);

  return (
    <main className="reader">
      {/* manchas de cor: são o fundo e o que o vidro tem para filtrar */}
      <div className="aurora" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <Effects />

      {/* Atalho discreto, fora de qualquer seção: quem quiser dirigir não deve
          precisar rolar a página inteira para descobrir que dá. */}
      <Link className="drive-pill" href="/drive">
        <span className="drive-pill__dot" aria-hidden />
        {t(UI.drivePill)}
      </Link>

      <div className="reader__inner">
        <header className="reader__hero" data-reveal>
          <div className="avatar">
            <Image
              src="/gabriel.jpg"
              alt={profile.name}
              width={440}
              height={440}
              /* o círculo tem 104 px: sem isto o Next serve a variante de 1080 */
              sizes="104px"
              priority
            />
          </div>

          <div className="reader__hero-card glass">
            <h1 className="reader__name">
              {t(UI.iBuild)} <Typewriter phrases={TYPED[lang]} />
            </h1>
          </div>

          <p className="reader__lead">
            {profile.name} — {t(profile.role).toLowerCase()}. {t(UI.leadIntro)}
            <strong>PontoGO, PeopleNity, Homefly</strong>
            {t(UI.leadMid)}
            <strong>MeuProcesso</strong>
            {t(UI.leadOutro)}
            <strong>Digital College</strong>.
          </p>

          <div className="reader__actions">
            <a className="reader__button" href={`mailto:${profile.email}`}>
              {t(UI.emailMe)}
            </a>
            {profile.links.map((link) => (
              <a
                key={link.label}
                className="reader__button is-ghost"
                href={link.url}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        </header>

        {/* Faixa de tecnologias correndo. A lista aparece duas vezes e a
            animação anda exatamente metade da largura, então a emenda cai fora
            da tela e o laço não tem salto. */}
        <div className="marquee" data-reveal aria-hidden>
          <div className="marquee__track">
            {[...marquee, ...marquee].map((item, index) => (
              <span key={`${item}-${index}`} className="marquee__item">
                {item}
              </span>
            ))}
          </div>
        </div>

        <a className="scroll-hint" href="#about" aria-label={t(UI.skipToContent)}>
          <span />
        </a>

        <section id="about" className="reader__section">
          <h2 className="reader__heading" data-reveal>
            {t(UI.whoAmI)}
          </h2>
          {about ? (
            <article className="glass reader__panel" data-reveal>
              <p className="reader__lead">{t(about.description)}</p>
              <ul className="reader__points">
                <li>{t(UI.point1)}</li>
                <li>{t(UI.point2)}</li>
                <li>{t(UI.point3)}</li>
              </ul>
            </article>
          ) : null}
        </section>

        <section className="reader__section">
          <h2 className="reader__heading" data-reveal>
            {t(UI.thingsBuilt)}
          </h2>
          <Products />
        </section>

        {/* A faixa acima é decorativa e fica escondida de leitor de tela; a lista
            de verdade, agrupada, vive aqui. */}
        <section className="reader__section">
          <h2 className="reader__heading" data-reveal>
            {t(UI.toolsWork)}
          </h2>
          <div className="glass reader__panel" data-reveal>
            <div className="reader__stack">
              {stack.map((group) => (
                <div key={group.group.en} className="reader__stack-group">
                  <h3>{t(group.group)}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="reader__section">
          <h2 className="reader__heading" data-reveal>
            {t(UI.roadSoFar)}
          </h2>
          <div className="glass reader__panel" data-reveal>
            <ol className="timeline">
              {MILESTONES.map((milestone) => (
                <li key={milestone.year} className="timeline__item">
                  <span className="timeline__year">{milestone.year}</span>
                  <div>
                    <h3 className="timeline__title">{t(milestone.title)}</h3>
                    <p className="timeline__detail">{t(milestone.detail)}</p>
                  </div>
                </li>
              ))}
              <li className="timeline__item is-now">
                <span className="timeline__year">{t(FINISH.year)}</span>
                <div>
                  <h3 className="timeline__title">{t(FINISH.title)}</h3>
                  <p className="timeline__detail">{t(FINISH.detail)}</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="reader__section">
          <h2 className="reader__heading" data-reveal>
            {t(UI.whatIDo)}
          </h2>
          <div className="reader__cards">
            {sections.map((project, index) => (
              <article
                key={project.id}
                className="card glass"
                data-reveal
                style={{
                  ["--zone" as string]: project.color,
                  ["--delay" as string]: `${index * 0.07}s`,
                }}
              >
                <p className="card__badge">{t(project.subtitle)}</p>
                <h3 className="card__title">{t(project.title)}</h3>
                <p className="card__description">{t(project.description)}</p>
                <ul className="card__stack">
                  {project.stack.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
                {project.url ? (
                  <a className="card__link" href={project.url} target="_blank" rel="noreferrer">
                    {t(UI.viewMore)}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {contact ? (
          <section className="reader__section">
            <h2 className="reader__heading" data-reveal>
              {t(UI.letsTalk)}
            </h2>
            <div className="glass reader__panel is-centered" data-reveal>
              <p className="reader__lead">{t(contact.description)}</p>
              <div className="reader__actions is-centered">
                <a className="reader__button" href={`mailto:${profile.email}`}>
                  {profile.email}
                </a>
                {profile.links.map((link) => (
                  <a
                    key={link.label}
                    className="reader__button is-ghost"
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <footer className="reader__footer" data-reveal>
          {t(UI.footer)}
        </footer>
      </div>
    </main>
  );
}
