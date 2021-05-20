import dbConnect from "../dbConnect.js"
import Commands from "../models/commands.js"
import asyncForEach from "./foreach.js"
import validator from "validator"
import axios from "axios"

export default async function parser(args, tags) {
    await dbConnect()

    const name = args.shift()
    const cmd = await Commands.findOne({ name })

    if (!cmd) return
    if (!cmd.roles.length || cmd.roles.some(role => tags.badges.hasOwnProperty(role))) {
        if (cmd.response && typeof cmd.response === "string") {
            let message = cmd.response
            message = message.replace(/\{sender\.displayname\}/gi, tags["display-name"]) // displayname
            message = message.replace(/\{sender\.username\}/gi, tags.username) // username
            const urlFetch = message.match(/\{fetch (.*?)\}/gi)
            console.log(urlFetch)
            if (urlFetch) {
                await asyncForEach(urlFetch, async function (get) {
                    const url = get.replace("{fetch ", "").replace("}", "")
                    console.log(url)
                    if (validator.isURL(url)) {
                        let response = null
                        try {
                            response = await axios.get(url)
                            if (response.status >= 200 && response.status < 300 && response.data) {
                                if (typeof response.data === "string" && response.data.length > 0) {
                                    message = message.replace(get, response.data)
                                }
                            } else {
                                message = message.replace(get, "Erro ao acessar a página da API")
                            }
                        } catch (err) {
                            message = "Um erro ocorreu"
                        }
                    }
                })
            }
            return message
        }
    }
}