require('dotenv').config();
const { createServer } = require("http");
const express = require('express');
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const moment = require("moment");
const cors = require("cors");

const {getKey, resetKeys} = require("./publicKeys");

const User = require("./models/User");
const Attendance = require("./models/Attendance");

const app = express();

const auth = require("./routes/auth");
const attendance = require("./routes/attendance");

const server = createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

let timer = 0;

// updating tokens
setInterval(() => {

    if((timer - parseInt(process.env.INTERVAL)) === 0) {
        timer = 0;
        resetKeys();
    } else {
        timer++ ;
    }

}, 1000);



const mongodbUrl = process.env.MONGODB_URI;

try {
    mongoose.connect(mongodbUrl);
    const db = mongoose.connection;
    db.on('error', (err) => console.log(err));
    db.once('open', () => console.log('Successfully connected to Database'));
} catch (err) {
    console.log(err);
}


io.on('connection', socket => {
    
    let room = "";
    let interval = null, batch, subject;
    
    // initial request
    socket.on('start-session', async ({_batch, _subject}) => {
        
        interval && clearInterval(interval);

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
            try {
                const teacher = await User.findOne({
                    isHost: true,
                    subjects: subject,
                    batches: batch
                });
                let newEntry = new Attendance({
                    subject,
                    batch,
                    date: moment().format("YYYY-MM-DD"),
                    teacher: teacher.college_id
                });
                await newEntry.save();
            } catch (err) {
                console.log(err.message);
            }
        }
        
        // connect to socketio
        socket.join(room);
        
        // send data
        io.to(room).emit('token', {
            token: `${getKey(subject)}+${batch}+${subject}`,
            timer: process.env.INTERVAL - timer
        });

        // send tokens every x seconds
        interval = setInterval(() => {
            
                if(timer === 0) {
        
                    io.to(room).emit('token', {
                        token: `${getKey(subject)}+${batch}+${subject}`,
                    }); 
                
                }
            
        }, 1000);

        socket.on("leave", () => {
            socket.leave(room);
        })

    });
    
    
    
    // user disconnects (closes the tab)
    socket.on('disconnect', () => {
        clearInterval(interval);
    });
});

app.use("/auth", auth);
app.use("/attendance", attendance);



app.get('/', async(req, res) => {
    res.status(200).json({message: 'Got the message'});
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))