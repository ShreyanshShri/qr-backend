const express = require('express');
const router = express.Router();
const randomstring = require("randomstring");

const User = require('../models/User');
const Attendance = require('../models/Attendance');

router.post('/new', async(req, res) => {

    const {username, college_id, password, isHost, batches, subjects} = req.body;
    
    
});

module.exports = router