require('dotenv').config()
const express = require("express")
const app = express(); 
const ejs = require("ejs")
const path =require("path")
const expressLayouts = require("express-ejs-layouts")
const PORT = process.env.PORT || 4000;
const mongoose = require("mongoose")
const session = require("express-session");
const flash = require("express-flash");
const MongoDbStore = require("connect-mongo");
const passport = require("passport")
const { urlencoded } = require('express');
const Emitter = require('events')



// Database connection 

const url ='mongodb://localhost/pizza';
const connection = mongoose.connection;
mongoose.connect(url).then(()=>{
    console.log("connection created......")
}).catch((err)=>{
    console.log(err)
});


// session store 
const sessionStorage = MongoDbStore.create({
    mongoUrl:url,
    dbName:'pizza',
    collectionName:'sessions',
    autoRemove:'native'
})


// Event Emmiter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)
// Session Config 
app.use(session({
    secret:process.env.COOKIE_SECRET,
    saveUninitialized:true,
    store :sessionStorage,
    cookie:{ maxAge: 1000*60*60*24},//24 hours 
    proxy: true,
    resave: false,
    client : connection.getClient(),
    }))
    
// Passport config 
 const passportInit = require('./app/config/passport')
 passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())


app.use(flash())

// assets 

app.use(express.static('public'))
app.use(express.urlencoded({extended:false}))
app.use(express.json())

// global middleware 
app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})


// set template engne 

app.use(expressLayouts)
app.set('views',path.join(__dirname,'/resources/views'))
app.set('view engine','ejs')

require('./routes/web')(app)


        
    


const server = app.listen(PORT, ()=>{
    console.log(`listening to the port ${PORT}`)

})


// socket 

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      socket.on('join', (orderId) => {
        socket.join(orderId)
      })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})