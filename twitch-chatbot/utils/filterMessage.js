import fs from "fs/promises"

export default async function filterMessage(tags, message) {
    const is_streamer = tags.badges && tags.badges.hasOwnProperty("broadcaster")
    const is_mod = tags.badges && tags.badges.hasOwnProperty("moderator")
    const is_sub = tags.badges && tags.badges.hasOwnProperty("subscriber")
    const is_vip = tags.badges && tags.badges.hasOwnProperty("vip")
    const badWords = JSON.parse(await fs.readFile("badwords.json", "utf-8"))

    if ((!is_mod || !is_streamer || !is_sub || !is_vip) && badWords.data) {
        const response = message.split(" ").filter((word) => {
            if (badWords.data.includes(word.toLowerCase())) return word
        })
        return response
    }

    return []
}