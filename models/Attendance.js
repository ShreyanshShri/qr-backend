const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    batch: {
        type: String,
        required: true
    },
    students: {
        type: Array
    },
    teacher: {
        type: String
    }
});

module.exports =mongoose.model("Attendance", attendanceSchema);