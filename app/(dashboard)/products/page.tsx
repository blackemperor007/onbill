import { auth } from "@clerk/nextjs/server"
import { Suspense } from "react"
export default async function ProductPage() {
    const session = await auth()

    return (
        <Suspense 
        >
        </Suspense>
    )
}