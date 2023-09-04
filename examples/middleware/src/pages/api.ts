import { APIRoute } from "astro"

export const GET : APIRoute = async ctx => {
    return ctx.reroute("/login")
}