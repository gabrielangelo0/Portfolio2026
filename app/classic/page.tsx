import type { Metadata } from "next";
import Link from "next/link";
import { FINISH, MILESTONES } from "@/lib/career";
import { profile, projects, stack } from "@/lib/data";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description:
    "SaaS platforms, mobile apps and automation. The same portfolio as the 3D version, in plain text.",
};

/**
 * O portfólio em página, sem carro e sem WebGL. Existe porque nem toda visita
 * quer dirigir: um recrutador com pressa, um celular fraco ou alguém que só quer
 * ler. O conteúdo é lido das mesmas fontes do mundo 3D — `projects`, `stack` e
 * os marcos da pista — para as duas versões nunca discordarem.
 */
export default function ClassicPage() {
  const contact = projects.find((project) => project.id === "contact");
  const sections = projects.filter((project) => project.id !== "contact");

  return (
    <main className="reader">
      <div className="reader__inner">
        <header className="reader__hero">
          <p className="reader__eyebrow">Portfolio</p>
          <h1 className="reader__name">Hi, I&apos;m Gabriel</h1>
          <p className="reader__lead">
            I build SaaS platforms, mobile apps and automation for teams that ship on tight
            deadlines. I work end to end — database and API design, the interface people
            actually use, and the integrations in between.
          </p>
          <p className="reader__lead">
            Right now I build products at{" "}
            <strong>PontoGO, PeopleNity, Homefly and MeuProcesso</strong>, and I teach full
            stack development to new cohorts at <strong>Digital College</strong>.
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

        <section className="reader__section">
          <h2 className="reader__heading">Tools I work with</h2>
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
        </section>

        <section className="reader__section">
          <h2 className="reader__heading">The road so far</h2>
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
        </section>

        <section className="reader__section">
          <h2 className="reader__heading">What I do</h2>
          <div className="reader__cards">
            {sections.map((project) => (
              <article
                key={project.id}
                className="card"
                style={{ ["--zone" as string]: project.color }}
              >
                <p className="card__subtitle">{project.subtitle}</p>
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
          <section className="reader__section reader__contact">
            <h2 className="reader__heading">{contact.title}</h2>
            <p className="reader__lead">{contact.description}</p>
            <div className="reader__actions">
              <a className="reader__button" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </div>
          </section>
        ) : null}

        <section className="reader__section reader__drive">
          <h2 className="reader__heading">Or take the long way</h2>
          <p className="reader__lead">
            The same story is a valley you can drive through: a dirt track past six dated
            gates, a finish line at the top of the ridge, and six things hidden in the hills.
          </p>
          <Link className="reader__button" href="/">
            Drive the 3D version
          </Link>
        </section>

        <footer className="reader__footer">
          Built with Next.js, React Three Fiber and Rapier. No cookies — just a car.
        </footer>
      </div>
    </main>
  );
}
