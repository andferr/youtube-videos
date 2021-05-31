import mongoose from "mongoose"

const Schema = new mongoose.Schema({
    commandName: {
        type: String,
        lowercase: true,
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        required: true,
        default: new Date()
    }
})

export default mongoose.model.commandHistory || mongoose.model("commandHistory", Schema)