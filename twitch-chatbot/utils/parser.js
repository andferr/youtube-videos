import dbConnect from "../dbConnect.js"
import Commands from "../models/commands.js"
import asyncForEach from "./foreach.js"
import validator from "validator"
import axios from "axios"

/**
Message parser
@param {String} userMessage Mensagem do usuário
@param {Array} tags Informações do usuário, providas pelo tmi.js
@returns {Promise<String|void>} Mensagem formatada
*/
export default async function parser(userMessage, tags) {
    await dbConnect()

    const args = userMessage.split(" ")
    const name = args.shift()
    const cmd = await Commands.findOne({ name })

    if (!cmd) return
    if (!cmd.roles.length || cmd.roles.some(role => tags.badges.hasOwnProperty(role))) {
        if (cmd.response && typeof cmd.response === "string") {
            let message = cmd.response
            message = message.replace(/\{sender\.displayname\}/gi, tags["display-name"]) // displayname
            message = message.replace(/\{sender\.username\}/gi, tags.username) // username
            message = message.replace(/\{target\}/gi, (args[0] ? args[0].replace(/\@/g, "") : "").toLowerCase()) // target
            const urlFetch = [...message.matchAll(/\{fetch (?<url>.*?)\}/gi)]
            if (urlFetch && urlFetch.length) {
                await asyncForEach(urlFetch, async function (str) {
                    if (str.groups && str.groups.url) {
                        const url = str.groups.url
                        const str_input = str[0]
                        if (validator.isURL(url)) {
                            let response = null
                            try {
                                response = await axios.get(url)
                                if (response.status >= 200 && response.status < 300 && response.data) {
                                    if (typeof response.data === "string" && response.data.length > 0) {
                                        message = message.replace(str_input, response.data)
                                    }
                                } else {
                                    message = message.replace(str_input, "Erro ao acessar a página da API")
                                }
                            } catch (err) {
                                message = "Um erro ocorreu"
                            }
                        }
                    }
                })
            }
            return message
        }
    }
}