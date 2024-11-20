require('dotenv').config();
const { createServer } = require("http");
const express = require('express');
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const randomstring = require("randomstring");
const moment = require("moment");

const User = require("./models/User");
const Attendance = require("./models/Attendance");

const app = express();

const auth = require("./routes/auth");

const server = createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// now routes have access to socketio by req.io
app.use((req, res, next) => {
    req.io = io;
    return next();
});

app.use("/auth", auth);


const mongodbUrl = process.env.MONGODB_URI;

try {
    mongoose.connect(mongodbUrl);
    const db = mongoose.connection;
    db.on('error', (err) => console.log(err));
    db.once('open', () => console.log('Successfully connected to Database'));
} catch (err) {
    console.log(err);
}

let publicKey = {
    BAS101: randomstring.generate(),
    BAS103: randomstring.generate(),
    BAS105: randomstring.generate(),
    BEE101: randomstring.generate(),
    BME101: randomstring.generate()
};

let timer = 0;

io.on('connection', socket => {

    let room = "";
    let interval, batch, subject;

    // initial request
    socket.on('start-session', async ({_batch, _subject}) => {
  
        batch = _batch;
        subject = _subject;
        room = `${batch}-${subject}`;


        // check if there is already a record of attendance for batch-subject in the db
        const entry = await Attendance.findOne({
            date: moment().format("YYYY-MM-DD"),
            batch: batch,
            subject: subject
        });

        if(!entry) {
            const teacher = await User.findOne({
                isHost: true,
                subjects: subject,
                batches: batch // should contain batch
            });
            let newEntry = new Attendance({
                subject,
                batch,
                date: moment().format("YYYY-MM-DD"),
                teacher: teacher.college_id
            });
            try {
                await newEntry.save();
            } catch (err) {
                console.log(err.message);
            }
        }

        // connect to socketio
        socket.join(room);
        
        // send data
        io.to(room).emit('token', {
            token: `${publicKey[subject]}+${batch}+${subject}`
        });
    });

    
    // send tokens every x seconds
    interval = setInterval(() => {

       if((timer - parseInt(process.env.INTERVAL)) == 0) {

            io.to(room).emit('token', {
                token: `${publicKey[subject]}+${batch}+${subject}`
            }); 
        
       } 

    }, 1000)

    // user disconnects (closes the tab)
    socket.on('disconnect', () => {
        clearInterval(interval);
    });
});


// updating tokens
setInterval(() => {

    if((timer - parseInt(process.env.INTERVAL)) === 0) {
        timer = 0;
        // resetting the timer
        const len = Object.keys(publicKey).length;
        // updating tokens
        for(let i=0; i<=len-1; i++) {
            publicKey[Object.keys(publicKey)[i]] = randomstring.generate();
        }
    } else {
        timer++ ;
    }

}, 1000);



app.get('/', async(req, res) => {
    res.status(200).json({message: 'Got the message'});
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))