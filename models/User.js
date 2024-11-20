const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    college_id: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    ip: {
        type:String,
        required:true
    },
    token: {
        type: String,
        required: true
    },
    isHost: {
        type: Boolean,
        default: false
    },
    batches: {
        type: Array
    },
    subjects: {
        type: Array
    },
});

module.exports =mongoose.model("User", userSchema);