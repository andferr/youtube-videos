import mongoose from "mongoose"

const Schema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: true,
        unique: true,
        index: true
    },
    response: {
        type: String,
        required: true
    },
    cooldown: {
        type: Number,
        required: true,
        default: 5
    },
    roles: {
        type: Array,
        required: true,
        default: []
    }
})

export default mongoose.model.commands || mongoose.model("commands", Schema)