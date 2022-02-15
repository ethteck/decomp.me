import { GetStaticPaths, GetStaticProps } from "next"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"

import { ArrowRightIcon } from "@primer/octicons-react"

import AsyncButton from "../../components/AsyncButton"
import Button from "../../components/Button"
import ErrorBoundary from "../../components/ErrorBoundary"
import Footer from "../../components/Footer"
import Nav from "../../components/Nav"
import PageTitle from "../../components/PageTitle"
import { ScratchItem } from "../../components/ScratchList"
import * as api from "../../lib/api"

import styles from "./[function].module.scss"

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [],
        fallback: "blocking",
    }
}

export const getStaticProps: GetStaticProps = async context => {
    try {
        const project: api.Project = await api.get(`/projects/${context.params.project}`)

        // Treat slug as a ROM address
        const slug = context.params.function as string
        const romAddress = parseInt(slug, 16)

        // Search for a function with the given ROM address
        const page: api.Page<api.ProjectFunction> = await api.get(`/projects/${context.params.project}/functions?rom_address=${romAddress}`)
        const func = page.results[0]

        const canonicalSlug = func.html_url.split("/").pop()

        if (slug == canonicalSlug) {
            const attempts: api.TerseScratch[] = await api.get(func.url + "/attempts")

            return {
                props: {
                    project,
                    func,
                    attempts,
                },
                revalidate: 60, // cache for a minute
            }
        } else {
            // Redirect to canonical URL
            return {
                props: {},
                redirect: {
                    destination: func.html_url,
                },
            }
        }
    } catch (error) {
        console.log(error)
        return {
            notFound: true,
            revalidate: true,
        }
    }
}

export default function ProjectFunctionPage({ project, func, attempts }: { project: api.Project, func: api.ProjectFunction, attempts: api.TerseScratch[] }) {
    const router = useRouter()
    const start = async () => {
        const scratch = await api.post(func.url + "/attempts", {})
        await router.push(scratch.html_url)
    }

    // Find an attempt by this user
    const userIsYou = api.useUserIsYou()
    const userAttempt = attempts.find(scratch => userIsYou(scratch.owner))

    return <>
        <PageTitle title={func.display_name} />
        <Nav />
        <header className={styles.header}>
            <div className={styles.headerInner}>
                <h1>
                    <Link href={project.html_url}>
                        <a>
                            <Image src={project.icon_url} alt="" width={32} height={32} />
                            {project.slug}
                        </a>
                    </Link>
                    {" / "}
                    <a>
                        {func.display_name}
                    </a>
                </h1>
            </div>
        </header>
        <main className={styles.container}>
            <ErrorBoundary>
                <section className={styles.attempts}>
                    <h2>
                        <span>Attempts</span>
                        <AsyncButton onClick={start} primary={!userAttempt}>
                            New attempt
                            <ArrowRightIcon />
                        </AsyncButton>
                        {userAttempt && <Link href={userAttempt.html_url}>
                            <a>
                                <Button primary>
                                    Continue your attempt
                                    <ArrowRightIcon />
                                </Button>
                            </a>
                        </Link>}
                    </h2>
                    <ul>
                        {attempts.map(scratch => <ScratchItem key={scratch.url} scratch={scratch} />)}
                    </ul>
                </section>
            </ErrorBoundary>
        </main>
        <Footer />
    </>
}
