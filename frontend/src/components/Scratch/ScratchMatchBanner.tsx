import Link from "next/link"

import useSWR from "swr"

import * as api from "../../lib/api"
import DismissableBanner from "../DismissableBanner"

export default function ScratchMatchBanner({ scratch }: { scratch: api.TerseScratch }) {
    const userIsYou = api.useUserIsYou()
    const { data, error } = useSWR<api.TerseScratch[]>(scratch.url + "/family", api.get, {
        refreshInterval: 60,
    })

    const match = data?.find(s => s.score == 0 && s.url != scratch.url)

    if (error)
        throw error

    if (scratch.score == 0 || !match)
        return null

    let message = "This function has been matched"
    if (userIsYou(scratch.owner))
        message += " by you, elsewhere"
    else if (scratch.owner && !api.isAnonUser(scratch.owner))
        message += ` by ${scratch.owner.username}`

    return <DismissableBanner>
        {message}. <Link href={match.html_url}>View match</Link>
    </DismissableBanner>
}
