import dotenv from "dotenv"
dotenv.config()

import { Client } from "tmi.js"
import dbConnect from "./dbConnect.js"
import Commands from "./models/commands.js"
import parser from "./utils/parser.js"
import filterMessage from "./utils/filterMessage.js"

const client = new Client({
    identity: {
        username: process.env.BOTNAME,
        password: process.env.BOTPASS
    },
    channels: process.env.CHANNELS.split(",").map(chan => chan.trim()).filter(v => v.length > 0),
    connection: {
        reconnect: true
    }
})

client.connect()

client.on("connected", (addr, port) => {
    console.log(`Conectado com sucesso a ${addr}:${port}`)
})

client.on("join", (channel, username, self) => {
    if (self) console.log(`Entrando no canal ${channel}`)
})

client.on("chat", async (channel, tags, message, self) => {
    if (self) return

    filterMessage(tags, message).then(badWords => {
        if (badWords.length >= 1) return client.timeout(channel, tags.username, 5, "Bocã sujã!")
    })

    console.log(`${channel}/${tags['display-name']}: ${message}`)

    const is_streamer = tags.badges && tags.badges.hasOwnProperty("broadcaster")
    const is_mod = tags.badges && tags.badges.hasOwnProperty("moderator")
    const is_sub = tags.badges && tags.badges.hasOwnProperty("subscriber")
    const is_vip = tags.badges && tags.badges.hasOwnProperty("vip")
    const args = message.split(" ")
    const command = args.shift()

    if (command.startsWith("!")) {
        switch (command) {
            case "!comando":
                if (is_streamer || is_mod) {
                    const trigger = args.shift()
                    let commandName = args.shift()
                    commandName = commandName.startsWith("!") ? commandName : `!${commandName}`
                    const commandResp = args.join(" ")
                    let commandRole = args.shift() // preciso verificar se dentro do valor existe uma string
                    commandRole = typeof commandRole === "string" ? commandRole.toLowerCase() : null // verifico se commandRole é uma string

                    switch (commandRole) {
                        case "streamer":
                        case "broadcaster":
                            commandRole = "broadcaster"
                            break;
                        case "mod":
                        case "moderator":
                            commandRole = "moderator"
                            break;
                        case "vip":
                            commandRole = "vip"
                            break;
                        case "sub":
                        case "subscriber":
                            commandRole = "subscriber"
                            break;
                        default:
                            commandRole = null
                    }

                    switch (trigger) {
                        case "add":
                            await dbConnect()
                            const add = new Commands({
                                name: commandName,
                                response: commandResp
                            })
                            add.save((err) => {
                                console.log(err)
                                if (err) return client.say(channel, "Um erro ocorreu!")
                                return client.say(channel, `${commandName} foi adicionado com sucesso!`)
                            })
                            break;

                        case "edit":
                            await dbConnect()
                            const edit = await Commands.findOne({ name: commandName })
                            if (!edit) return client.say(channel, "Comando não encontrado!")
                            edit.response = commandResp
                            edit.save((err) => {
                                if (err) return client.say(channel, "Um erro ocorreu!")
                                return client.say(channel, `${commandName} foi atualizado com sucesso!`)
                            })
                            break;

                        case "del":
                            await dbConnect()
                            const del = await Commands.deleteOne({ name: commandName })
                            if (!del.n) return client.say(channel, "Comando não encontrado!")
                            if (!del.ok) return client.say(channel, "Um erro ocorreu!")
                            client.say(channel, `${commandName} foi removido com sucesso!`)
                            break;

                        case "+r":
                            await dbConnect()
                            const addrole = await Commands.findOne({ name: commandName })
                            if (!addrole) return client.say(channel, "Comando não encontrado!")
                            if (commandRole) {
                                addrole.roles.push(commandRole)
                                addrole.save((err) => {
                                    if (err) return client.say(channel, "Um erro ocorreu!")
                                    return client.say(channel, `${commandName} foi atualizado com sucesso!`)
                                })
                            }
                            break;

                        case "-r":
                            await dbConnect()
                            const delrole = await Commands.findOne({ name: commandName })
                            if (!delrole) return client.say(channel, "Comando não encontrado!")
                            if (commandRole) {
                                delrole.roles = delrole.roles.filter(role => role !== commandRole)
                                delrole.save((err) => {
                                    if (err) return client.say(channel, "Um erro ocorreu!")
                                    return client.say(channel, `${commandName} foi atualizado com sucesso!`)
                                })
                            }
                            break;

                        default:
                            break;
                    }
                }
                break;

            default:
                parser(message, tags).then(botResponse => {
                    if (typeof botResponse === "string") client.say(channel, botResponse)
                })
        }
    }
})