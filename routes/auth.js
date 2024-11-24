const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");

const User = require('../models/User');

router.post('/register', async(req, res) => {

    const {username, college_id, password, isHost, batches, subjects} = req.body;
    
    const encryptedPass = await bcrypt.hash(password, 10);

    const userExists = await User.findOne({ college_id: college_id });
    if(userExists) {
        console.log(userExists)
        return res.status(400).json({message: 'User Already exists'});
    }

    const token = randomstring.generate();

    const user = new User({
        username,
        college_id,
        password: encryptedPass,
        ip: req.headers['cf-connecting-ip'] ||  
            req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress || '',
        token,
        isHost,
        batches,
        subjects,
    });

    try {
        await user.save();
        console.log(user);
        res.status(200).json({message: 'Succesfully Registered... Login to continue'});
    } catch (err) {
        console.log(err.message);
        return res.json({message: 'Server side error'});
    }
});


router.post('/login', async(req, res) => {

    const {college_id, password} = req.body;

    const user = await User.findOne({ college_id: college_id });
    
    if(!user) {
        return res.status(400).json({message: 'User doesnt exist'});
    }

    if(await bcrypt.compare(password, user.password) == false) {
        return res.status(400).json({message: "Invalid Password"});
    }

    const token = randomstring.generate();

    user.id = 
    req.headers['cf-connecting-ip'] ||  
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress || '';
    user.token  = token;

    try {
        await user.save();
        res.status(200).json({token: token});
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({message: 'Server side error'});
    }
});

router.get("user-info", async (req, res) => {
    const {user_token} = req.body;
    try {
        const user = await User.findOne({ token: user_token });
        res.status(200).json({batches: user.batches, subjects: user.subjects});
    } catch (err) {
        console.log(err.message);        
        return res.status(500).json({message: 'Server side error'});
    }
})

module.exports = router