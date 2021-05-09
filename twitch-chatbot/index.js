import { Client } from "tmi.js"
import "dotenv/config.js"
import dbConnect from "./dbConnect.js"
import Commands from "./models/commands.js"

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
    console.log(`Bot conectado com sucesso: ${addr}:${port}`)
})

client.on("join", (channel, username, self) => {
    if (self) console.log(`Entrando no canal ${channel}`)
})

client.on("chat", async (channel, tags, message, self) => {
    if (self) return
    console.log(`${channel}/${tags['display-name']}: ${message}`)

    const is_streamer = tags.badges.hasOwnProperty("broadcaster")
    const is_mod = tags.badges.hasOwnProperty("moderator")
    const is_sub = tags.badges.hasOwnProperty("subscriber")
    const is_vip = tags.badges.hasOwnProperty("vip")
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
                    let newRole = args.shift().toLowerCase()

                    switch (newRole) {
                        case "streamer":
                        case "+o":
                        case "broadcaster":
                            newRole = "broadcaster"
                            break;
                        case "mod":
                        case "+v":
                        case "moderator":
                            newRole = "moderator"
                            break;
                        case "vip":
                            newRole = "vip"
                            break;
                        case "sub":
                        case "subscriber":
                            newRole = "subscriber"
                            break;
                        default:
                            newRole = null
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
                            if (newRole) {
                                addrole.roles.push(newRole)
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
                            if (newRole) {
                                delrole.roles = delrole.roles.filter(role => role !== newRole)
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
                await dbConnect()
                const cmd = await Commands.findOne({ name: command })
                if (!cmd) return
                if (!cmd.roles.length || cmd.roles.some(role => tags.badges.hasOwnProperty(role))) {
                    client.say(channel, cmd.response)
                }
                break;
        }
    }
})