
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require('path');
const http = require('http');
const socketio = require('socket.io')
const formatMessage = require('./View/js/utils/messages');
const mongoclient = require('mongodb');
const mongoose = require("mongoose");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const config = require("config");
const session = require('express-session')
const MongoDBStore = require("connect-mongodb-session")(session);
const app = express();
const connectDB = require("./config/db");
const mongoURI = config.get("mongoURI");
const User = require("./Backend/models/User");
const IceCream = require("./Backend/models/IceCream");
const Reservation = require("./Backend/models/Reservation");
const isAuth = require("./Backend/middleware/is-auth");
const isAdmin = require("./Backend/middleware/is-admin");
const isGuest = require('./Backend/middleware/is-guest');
const Gelateria = require('./Backend/models/Gelateria');
const disconnect  = require('process');
const PORT = 8081;
const server = http.createServer(app);
const io = socketio(server)
let isFlag = true;
//connect to database
connectDB();

app.use(express.static("View"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//store the session in "mySessions" table 
//----------------------------------------//
const store = new MongoDBStore({
    uri: mongoURI,
    collection: "mySessions",
});

app.use(
    session({
      secret: "secret",
      resave: false,
      saveUninitialized: false,
      store: store,
    })
  );

//routes
//------------------------For Chat--------------------//
const MyName = 'Candyz';
let userName = 'USER';
const usersArr = [];
let ind =0;
app.get("/chat", isGuest, function(req,res){
    res.sendFile(__dirname + "/View/chat.html");
});

app.get("/chatInner", isGuest, function(req,res){
    userName = req.query.username;
    usersArr.push(userName);
    res.sendFile(__dirname + "/View/chatInner.html");
    // console.log(userName);
});
//---------------------------------Socket--------------------------------//
io.on('connection', socket =>{
    socket.emit('message', formatMessage(MyName,'Welcome'));
    //Broadcast when a user connects
    socket.broadcast.emit('message', formatMessage(MyName,'A user has joined the chat'));
    //Broadcast when a user disconncets
    socket.on('disconnect', ()=>{
        io.emit('message', formatMessage(MyName,'A user has left the chat'))
    });
    //Listen for chat message
    socket.on('chatMessage', (msg)=>{
        ind = ind % usersArr.length;
        io.emit('message', formatMessage(usersArr[ind],msg));
        ind++;
    })
});
    //  When a user opens the chat page, a socket connection is established between the client and server.
    // The server listens for various socket events (like 'connection', 'chatMessage') emitted by the client.
    // When a user sends a chat message, the client emits the message to the server using socket.emit('chatMessage', ...) along with the message content.
    // The server receives the message and then emits it to all connected clients using io.emit('message', ...) so that everyone sees the message.
    // The clients, including the sender, listen for the 'message' event and display the received messages in their chat interfaces.
    // instantly displayed to all users without the need for constant page refreshing



//-----------------Guests Routes----------------------//
const indexController = require('./Controllers/indexCtrl.js');
app.get('/', isGuest, indexController.getIndexPage);

//----------sign up---------------------//
const signUpContoller = require('./Controllers/signUpCtrl.js');
app.get("/signup",isGuest,signUpContoller.getSignUpPage);
app.post('/signup', signUpContoller.setNewUsser);
//----------sign in---------------------//
const signInController = require('./Controllers/signInPage.js');
app.get("/signin",isGuest,signInController.getSignInPage);
app.post("/signin",signInController.checkUser);


//----------------------User's Routes---------------------//




///////////////////////////////////////////////////////////////////////////////////////
//-----------------------------admin's routes-----------------------//

const adminRoutes = require('./Controllers/adminRoutesCtrl.js');
//------------------------users list-------------------------------//
app.get("/adminMenu",isAdmin,adminRoutes.getAdminMenu);
//------------------------ice cream admin's options----------------//
app.get("/adminMenu/iceCreams",isAdmin,adminRoutes.getAdminCandyzMenu);
//--------------------------search ice cream results--------------//
app.get("/searchResults",adminRoutes.getAdminSearchResults);


const adminCandyzController = require('./Controllers/adminCandyzCtrl.js');
//---------------------add ice cream-------------------------------//
app.post('/addIceCream', adminCandyzController.addCandy);
//---------------------------update ice cream---------------------//
app.post("/updateIceCream",adminCandyzController.updateCandy);
//---------------------------delete ice cream---------------------//
app.post("/deleteIceCream",adminCandyzController.deleteCandy);


//--------------------------Gelateria admin's Menu----------------//
app.get("/adminMenu/gelaterias",isAdmin,adminRoutes.getAdminShopsMenu);
const adminShopsController = require('./Controllers/adminShopsCtrl.js')
//--------------------------add gelateria--------------------------//
app.post("/addGelateria",adminShopsController.addShop);
//-----------------------------update photo url gelateria--------------//
app.post("/updateGelateria",adminShopsController.updateShop);
//--------------------------delete gelateria by address---------------------//
app.post("/deleteGelateria",adminShopsController.deleteShop);
//---------------------------all gelaterias from mongodb-------------------------//
app.get("/showGelaterias",adminShopsController.showShops);
//------------------------all users from mongodb---------------------------------//
app.get("/showData",async(req,res)=>{
    const all = await User.find({});
    res.json(all);
})
//-----------------------all ice creams from mongodb-------------//
app.get("/adminMenu/showIceCreamsList",adminCandyzController.showCandyzList);
//-----------------------all ice creams sorted by countOrdered------------//
app.get("/adminMenu/showMostWantedIceCream",adminCandyzController.showMostWantedCandyz);
//-----------------------all ice creams sorted by price------------/
app.get("/adminMenu/showMaxPriceIceCream",adminCandyzController.showMaxPriceCandyz);
app.get("/adminMenu/showMinPriceIceCream",adminCandyzController.showMinPriceCandyz);
//------------------------------all reservations--------------------//
app.get("/adminMenu/showReservations",async(req,res)=>{
    const all = await Reservation.find({});
    res.json(all);
})
//-----------------------------log-out------------------------------//
app.get("/logout", (req,res)=>{
    req.session.destroy((err)=>{
        if (err) throw err;
        res.redirect("/");
    });
});
//----------------------------------Blocked Pages------------------//
app.get("/loginReminder",function(req,res){
    res.sendFile(__dirname+ "/View/loginReminder.html");
});
app.get("/guestReminder",isAuth,function(req,res){
    res.sendFile(__dirname+ "/View/guestReminder.html");
});
app.get("/adminReminder",function(req,res){
    res.sendFile(__dirname   + "/View/adminReminder.html");
});
app.get("/wrongQuantity",function(req,res){
    res.sendFile(__dirname + "/View/wrongQuantity.html");
});
//-----------------------------profile json--------------------------//
app.get("/profileInfo",profileController.profileInfo);
//------------------------------change password----------------------//
app.get("/changePassword",isAuth,profileController.getChangePwPage);
app.post("/changePassword",profileController.changePw);
//------------------------flavors ordered----------------------------//

//-----------------------------stats admin's menu----------------//
app.get("/adminMenu/Stats",adminRoutes.getAdminStats);

//Grouping by to statsAdmin.html charts
app.get("/flavorsPie1",async(req,res)=>{
    let toSend = [];
    const total = await IceCream.aggregate([
        {$group:{_id: "all" , count:{$sum:"$countOrdered"}}}
    ])
    toSend.push(total)
    const doc = await IceCream.aggregate([
        {$group:{_id:"$flavor", count:{$sum: "$countOrdered" }}}
    ])
    toSend.push(doc);
    res.json(toSend);
})
//---------------------------Reservations Per Date------------------//
//Grouping by to statsAdmin.html charts
app.get("/resPerDate",async(req,res)=>{
    const doc = await Reservation.aggregate([
        {$group:{_id: "$date",count: {$sum:1}}},
    ]);
    res.json(doc);
})
//----------------------------Google Maps-----------------------------//
app.get("/googleMaps",(req,res)=>{
    res.sendFile(__dirname + "/View/googleMaps.html");
})
app.get("/googleMapsUser",(req,res)=>{
    res.sendFile(__dirname + "/View/googleMapsUser.html");
})
//---------------------------all gelaterias--------------------------//

app.get("/showGel",adminShopsController.showShops);

///////////////////////////////////////////////////////////////////////
server.listen(PORT,console.log(`port is running on port ${PORT}...`));
///////////////////////////////////////////////////////////////////////
// API_KEY = AIzaSyDP9dYPVf2u0doyObPdfPOYK-ecHUni8-8

