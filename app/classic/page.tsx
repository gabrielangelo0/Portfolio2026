import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FINISH, MILESTONES } from "@/lib/career";
import { profile, projects, stack } from "@/lib/data";
import { Effects, Typewriter } from "./Effects";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description:
    "SaaS platforms, mobile apps and automation. The same portfolio as the 3D version, in plain text.",
};

/** Frases que o hero escreve e apaga, uma de cada frente de trabalho. */
const TYPED = [
  "SaaS platforms.",
  "mobile apps.",
  "automation that runs itself.",
  "integrations that cannot fail.",
];

/**
 * O portfólio em página, sem carro e sem WebGL. Existe porque nem toda visita
 * quer dirigir: um recrutador com pressa, um celular fraco ou alguém que só quer
 * ler. O conteúdo é lido das mesmas fontes do mundo 3D — `projects`, `stack` e
 * os marcos da pista — para as duas versões nunca discordarem.
 */
export default function ClassicPage() {
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
              I build <Typewriter phrases={TYPED} />
            </h1>
          </div>

          <p className="reader__lead">
            {profile.name} — {profile.role.toLowerCase()}. I work end to end: database and
            API design, the interface people actually use, and the integrations in between.
            Right now I build products at <strong>PontoGO, PeopleNity, Homefly</strong> and{" "}
            <strong>MeuProcesso</strong>, and teach full stack development at{" "}
            <strong>Digital College</strong>.
          </p>

          <div className="reader__actions">
            <a className="reader__button" href={`mailto:${profile.email}`}>
              Email me
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

        <a className="scroll-hint" href="#about" aria-label="Skip to the content">
          <span />
        </a>

        <section id="about" className="reader__section">
          <h2 className="reader__heading" data-reveal>
            Who am I?
          </h2>
          {about ? (
            <article className="glass reader__panel" data-reveal>
              <p className="reader__lead">{about.description}</p>
              <ul className="reader__points">
                <li>Go and PostgreSQL back ends behind Next.js front ends, in production.</li>
                <li>Mobile with React Native and Expo, offline-first when it has to be.</li>
                <li>Automation and integrations that take manual steps out of the day.</li>
              </ul>
            </article>
          ) : null}
        </section>

        {/* A faixa acima é decorativa e fica escondida de leitor de tela; a lista
            de verdade, agrupada, vive aqui. */}
        <section className="reader__section">
          <h2 className="reader__heading" data-reveal>
            Tools I work with
          </h2>
          <div className="glass reader__panel" data-reveal>
            <div className="reader__stack">
              {stack.map((group) => (
                <div key={group.group} className="reader__stack-group">
                  <h3>{group.group}</h3>
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
            The road so far
          </h2>
          <div className="glass reader__panel" data-reveal>
            <ol className="timeline">
              {MILESTONES.map((milestone) => (
                <li key={milestone.year} className="timeline__item">
                  <span className="timeline__year">{milestone.year}</span>
                  <div>
                    <h3 className="timeline__title">{milestone.title}</h3>
                    <p className="timeline__detail">{milestone.detail}</p>
                  </div>
                </li>
              ))}
              <li className="timeline__item is-now">
                <span className="timeline__year">{FINISH.year}</span>
                <div>
                  <h3 className="timeline__title">{FINISH.title}</h3>
                  <p className="timeline__detail">{FINISH.detail}</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="reader__section">
          <h2 className="reader__heading" data-reveal>
            What I do
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
                <p className="card__badge">{project.subtitle}</p>
                <h3 className="card__title">{project.title}</h3>
                <p className="card__description">{project.description}</p>
                <ul className="card__stack">
                  {project.stack.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
                {project.url ? (
                  <a className="card__link" href={project.url} target="_blank" rel="noreferrer">
                    View more →
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {contact ? (
          <section className="reader__section">
            <h2 className="reader__heading" data-reveal>
              Let&apos;s talk
            </h2>
            <div className="glass reader__panel is-centered" data-reveal>
              <p className="reader__lead">{contact.description}</p>
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

        <section className="reader__section">
          <h2 className="reader__heading" data-reveal>
            Or take the long way
          </h2>
          <div className="glass reader__panel is-centered" data-reveal>
            <p className="reader__lead">
              The same story is a valley you can drive through: a dirt track past six dated
              gates, a finish line at the top of the ridge, and six things hidden in the
              hills.
            </p>
            <div className="reader__actions is-centered">
              <Link className="reader__button" href="/">
                Drive the 3D version
              </Link>
            </div>
          </div>
        </section>

        <footer className="reader__footer" data-reveal>
          Built with Next.js, React Three Fiber and Rapier. No cookies — just a car.
        </footer>
      </div>
    </main>
  );
}
