import './dotenv.js'
import './twitch.js'
import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const app = express()
const port = 3000
const srv = createServer(app)
const io = new Server(srv, {})

app.use(express.static(join(dirname(fileURLToPath(import.meta.url)), 'public')))

app.get("/", (req, res) => {
    res.send("Olá, internet!")
})

app.get("/tts-message", async (req, res) => {
    const text = req.query.text
    if (text.length) {
        const languageCode = req.query.voice ?? 'pt-BR'
        const response = await axios.post(process.env.TTS_GOOGLE_API, {
            voice: { languageCode },
            input: { text },
            audioConfig: {
                pitch: 0,
                speakingRate: 0,
                audioEncoding: 'OGG_OPUS'
            }
        })
        if (response.status === 200 && response.data && response.data.audioContent) {
            const audioContent = response.data.audioContent
            try {
                const buff = new Buffer.from(audioContent, 'base64')
            } catch (err) {
                console.error(err)
                const buff = {}
            }
            return res.set('Content-Type', 'audio/ogg').set('Content-Lenght', buff.length).send(buff)
        }
    }
})

const sockets = io.of(/^\/\w+$/)

srv.listen(port, () => console.log(`Rodando em http://localhost:${port}`))

export default sockets