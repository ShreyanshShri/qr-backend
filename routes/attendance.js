const express = require('express');
const router = express.Router();
const randomstring = require("randomstring");
const moment = require("moment");

const {getKey} = require("../publicKeys");

const User = require('../models/User');
const Attendance = require('../models/Attendance');

router.post('/get', async(req, res) => {

    const {token} = req.body;

    try {
        const user = await User.findOne({ token: token });
        if(user == null || user == undefined) {
            return res.status(400).json({ message: "User not Found" })
        }
        if(user.isHost == false) {
            return res._construct(400).json({ message: "You are not authorised to this data." })
        }
        const student_list = await User.find({ isHost: false });
        const attendance_data = await Attendance.find({
            subject: user.subjects[0],
            batch: user.batches
        });

        res.status(200).json({
            user,
            attendance_data,
            student_list
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({message: "Internal Server error"});
    }
    
    
});

router.post("/save-attendance", async(req, res) => {
    const {user_token, attendance_data} = req.body;
    try {
        const user = await User.findOne({token: user_token});
        if(user == null || user == undefined) {
            return res.status(400).json({ message: "User not Found" });
        }
        if(user.college_id != attendance_data.teacher) {
            return res.status(400).json({ message: "You are not authorised to update the data" });
        }
        const attendance = await Attendance.findOne({
            date: moment().format("YYYY-MM-DD"),
            subject: attendance_data.subject,
            batch: attendance_data.batch
        });
        attendance.students = attendance_data.students;
        await attendance.save();
        res.status(200).json({message: "Attendance Updated Successfully."});
    } catch (err) {
        console.log(err.message);
        res.status(500).json({message: "Internal Server error"});
    }
});

router.post("/transfer-attendance", async(req, res) => {
    const {user_token, attendance_data, subject, teacher} = req.body;
    try {
        const user = await User.findOne({token: user_token});
        if(user == null || user == undefined) {
            return res.status(400).json({ message: "User not Found" });
        }
        if(user.college_id != attendance_data.teacher) {
            return res.status(400).json({ message: "You are not authorised to update the data" });
        }
        const attendance = await Attendance.findOne({
            date: moment().format("YYYY-MM-DD"),
            subject: attendance_data.subject,
            batch: attendance_data.batch
        });
        attendance.subject = subject;
        attendance.teacher = teacher;
        await attendance.save();
        res.status(200).json({message: "Attendance Forwarded Successfully."});
    } catch (err) {
        console.log(err.message);
        res.status(500).json({message: "Internal Server error"});
    }
});

router.post("/punch-in", async (req, res) => {
    const {user_token, attendance_token} = req.body;
    const [attendance_id, batch, subject] = attendance_token.split("+");

    if(attendance_id !== getKey(subject)) {
        return res.status(400).json({ message: "Invalid attendance token" });
    }

    try {
        const student = await User.findOne({ token: user_token });
        if(student == null || student == undefined) {
            return res.status(400).json({ message: "User not Found" })
        }
        if(student.batches[0] != batch) {
           return res.status(400).json({ message: "You are not part of the batch." });
       }

        const attendance = await Attendance.findOne({
            subject,
            batch,
            date: moment().format("YYYY-MM-DD")
        });

        if(!attendance) return res.status(400).json({message: "No attendance record found for today"});

        attendance.students.push(student.college_id);
        await attendance.save();
        res.status(200).json({ message: "Attendance punched" });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Internal server error occured."})
    }

});

router.post("/get-student-attendance", async (req, res) => {
    const {user_token} = req.body;
    try {
        const student = await User.findOne({ token: user_token });
        if(student == null || student == undefined) {
            return res.status(400).json({ message: "User not Found" })
        }
        const attendances = await Attendance.find({
            batch: student.batches[0]
        });
        return res.status(200).json({ attendances, student });
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: "Server side error occured." });
    }
})

module.exports = router;
