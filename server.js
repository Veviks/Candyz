
const express = require("express");
const cookieParser = require("cookie-parser");
const http = require('http');
const socketio = require('socket.io')
const formatMessage = require('./View/js/utils/messages');
const config = require("config");
const session = require('express-session');
const MongoDBStore = require("connect-mongodb-session")(session);
const app = express();
const connectDB = require("./config/db");
const mongoURI = config.get("mongoURI");
const User = require("./Backend/models/User");
const Candy = require("./Backend/models/Candy");
const Reservation = require("./Backend/models/Reservation");
const isAuth = require("./Backend/middleware/is-auth");
const isAdmin = require("./Backend/middleware/is-admin");
const isGuest = require('./Backend/middleware/is-guest');
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

//store the session in "Candyz" DataBase 
//----------------------------------------//
const store = new MongoDBStore({
    uri: mongoURI,
    collection: "MySessions",
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


//-------------------reservation--------------------------//
const reservationController = require('./Controllers/reservationCtrl.js');
app.get("/userMenu",isAuth,reservationController.getUserMenuPage);
//-----------search Candy----------------//
app.get("/reservationSelect",isAuth,reservationController.getSelectionPage);
//----------search results and start order---//
app.post("/resSelect",reservationController.getSearchResPage);

app.get('/getProductQuantity', reservationController.fetchData);


//---------------------selection result in user's cart------------------//
const cartController = require('./Controllers/cartCtrl.js');
app.get("/cart",isAuth, cartController.getCart);

//--------cancel current order and back to search options---//
app.get("/cancelOrder",isAuth,cartController.cancelOrders);

//------place your order details--------------------------//
// app.post("/orderDetails",isAuth,cartController.orderDetails);


app.get("/orderDetails",cartController.displayOrderDetails);




//---finish the order, add reservation and update Candy and user----//
app.post("/finishOrder",async(req,res)=>{
    let count =0;
    let sum = 0;
    const selectedArr = req.cookies.myCookie.split(",");
    const email = req.session.email;
    let name = '';
    let quantity = '';
    let tmpContent = '';
    tmpContent = req.session.selected;
    console.log("tmpContent is: " + tmpContent);
    for (let i =0; i<selectedArr.length; i++){
        const str = selectedArr[i].split("_");
        name = str[0];
        quantity = str[1];
        const filter = {"name": name};
        const tmpCandy = await Candy.findOne(filter);
        if (tmpCandy != null){
            const newQuantity = tmpCandy.quantity - quantity;
            if (newQuantity > 0){
                await Candy.findOneAndUpdate(filter,{$set:{"quantity":newQuantity}},{new:true},(err,doc)=>{
                    req.session.reload(function(err){
                        if (err) throw err;
                        else{
                            req.session.selected = "nothing yet";
                            req.session.save();
                        }
                    });
                });
                count++;
            }
        }else{
            break;
        }
    }
    console.log(count)
    if (count === selectedArr.length){
        const reservationsArr = [];
        const date = new Date().toISOString().slice(0, 10);
        ind = 0;
        while(ind < selectedArr.length){
            const orderNumber = Math.random();
            const name = selectedArr[ind].split("_")[0].trim();
            const quantity = selectedArr[ind].split("_")[1].trim();
            const tmpCandy = await Candy.findOne({"name":name});
            console.log("Printing the candy" + tmpCandy)
            const pricPerCandy = tmpCandy.price;
            const tmpPrice = pricPerCandy * quantity;
            const content = tmpContent;
            console.log("content is: " + content)
            let reservation = await Reservation.findOne({ orderNumber });
            if (reservation){
                console.log("inside reservation statement")
                return res.redirect("/userMenu");    
            }
            reservation = new Reservation({
                orderNumber,
                email,
                date,
                price: tmpPrice,
                content
            });
            reservationsArr.push(reservation)
            ind++;
        }
        const ice = await Candy.findOne({"name":name});
        let count = ice.countOrdered;
        const newCount = count +1;
        await Candy.findOneAndUpdate({"name":name},{$set:{"countOrdered": newCount }},{new:true},(err,doc)=>{
            
        });
        await User.findOne({"email":req.session.email},function(err,doc){
            
            if (doc.listOfOrders == null){
                doc.listOfOrders = new Map();
                if (doc.listOfOrders.has(name)){
                    const str = doc.listOfOrders.get(name);
                    const num = parseInt(str);
                    const newNum = num+1;
                    doc.listOfOrders.set(name,newNum);
                    doc.save(function(err){
                        if (err) throw err;
                    });
                }else {
                    doc.listOfOrders.set(name,1);
                    doc.save(function(err){
                        if (err) throw err;
                    })
                }
            }
            else{
                
                if (doc.listOfOrders.has(name)){
                    const str = doc.listOfOrders.get(name);
                    const num = parseInt(str);
                    const newNum = num+1;
                    doc.listOfOrders.set(name,newNum);
                    doc.save(function(err){
                        if (err) throw err;
                    });
                }else {
                    // console.log("9 error")
                    // doc.listOfOrders.set(name,1);
                    // doc.save(function(err){
                    //     if (err) throw err;
                    // })
                }
            }
        });
        reservationsArr.forEach(async (reservationData) => {
            const reservation = new Reservation(reservationData); // Create a new Reservation instance
            console.log('res is: ' + reservation);
            await reservation.save(); // Save the reservation to the database
        });
        res.clearCookie("myCookie");
        res.redirect("/userMenu");
    }else{
        req.session.reload(function(err){
            if (err) throw err;
            else{
                req.session.selected = "nothing yet";
                req.session.save();
            }
        });
        
    }

});
//-----------------------users profile-----------------------------------//
const profileController = require('./Controllers/profileCtrl.js');
app.get("/profile",isAuth,profileController.getProfile);

//--------------------Most Recommended Candy For User from mongodb------//
app.get("/recommendedCandy",profileController.recommendedProducts);

//--------------------Reseting cookies--------------------------------//

app.post('/resetCookie', cartController.resetCookies);

app.use((req, res, next) => {
    const nameToDelete = req.body.name; // Update this based on your needs

    // Update req.session.selected
    if (req.session.selected) {
        const items = req.session.selected.split(',');
        const updatedItems = items.filter(item => !item.startsWith(nameToDelete));
        req.session.selected = updatedItems.join(',');
    }

    // Update req.cookies.myCookie
    if (req.cookies.myCookie) {
        const items = req.cookies.myCookie.split(',');
        const updatedItems = items.filter(item => !item.startsWith(nameToDelete));
        res.cookie('myCookie', updatedItems.join(','), { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    }

    next();
});
//--------------------selected Candy json--------------------------------//
app.get("/selectedCandys",async (req,res)=>{
    let arr;
    const cartArr = [];
    let candyName = '';
      
    if(req.cookies.myCookie != undefined){arr = req.cookies.myCookie.split(",");}
    else if(req.session.selected == 'nothing yet'){isFlag = false;}
    else{arr = req.session.selected.split(",");}
    console.log("selectedCandysCookie " + req.cookies.myCookie);
    console.log("arr is: "+arr)

    if (!isFlag) {
        arr = 'nothing yet';
        console.log("Session reset detected");
        isFlag = true;
    }
    for(let i=0; i < arr.length; i++){
        if(arr =='nothing yet'){
            break;
        }
        candyName = arr[i].split('_')[0];
        quantity = arr[i].split('_')[1];
        const candy = await Candy.findOne({"name":candyName});
        if(candy){
            const cartData = {
                name: candyName,
                quantity: quantity,
                photoURL: candy.photoURL
            };
            cartArr.push(cartData);
        }
    }
    console.log(cartArr);
    res.send(cartArr);
})

///////////////////////////////////////////////////////////////////////////////////////
//-----------------------------admin's routes-----------------------//

const adminRoutes = require('./Controllers/adminRoutesCtrl.js');
//------------------------users list-------------------------------//
app.get("/adminMenu",isAdmin,adminRoutes.getAdminMenu);
//------------------------candy admin's options----------------//
app.get("/adminMenu/Candys",isAdmin,adminRoutes.getAdminCandyzMenu);
//--------------------------search candy results--------------//
app.get("/searchResults",adminRoutes.getAdminSearchResults);


const adminCandyzController = require('./Controllers/adminCandyzCtrl.js');
//---------------------add candy-------------------------------//
app.post('/addCandy', adminCandyzController.addCandy);
//---------------------------update candy---------------------//
app.post("/updateCandy",adminCandyzController.updateCandy);
//---------------------------delete candy---------------------//
app.post("/deleteCandy",adminCandyzController.deleteCandy);


//--------------------------Shops admin's Menu----------------//
app.get("/adminMenu/Shops",isAdmin,adminRoutes.getAdminShopsMenu);
const adminShopsController = require('./Controllers/adminShopsCtrl.js')
//--------------------------add Shops--------------------------//
app.post("/addShops",adminShopsController.addShops);
//-----------------------------update photo url Shops--------------//
app.post("/updateShops",adminShopsController.updateShops);
//--------------------------delete Shops by address---------------------//
app.post("/deleteShops",adminShopsController.deleteShops);
//---------------------------all Shops from mongodb-------------------------//
app.get("/showShops",adminShopsController.showShops);
//------------------------all users from mongodb---------------------------------//
app.get("/showData",async(req,res)=>{
    const all = await User.find({});
    res.json(all);
})
//-----------------------all candys from mongodb-------------//
app.get("/adminMenu/showCandysList",adminCandyzController.showCandyzList);
//-----------------------all candys sorted by countOrdered------------//
app.get("/adminMenu/showMostWantedCandy",adminCandyzController.showMostWantedCandyz);
//-----------------------all candys sorted by price------------/
app.get("/adminMenu/showMaxPriceCandy",adminCandyzController.showMaxPriceCandyz);
app.get("/adminMenu/showMinPriceCandy",adminCandyzController.showMinPriceCandyz);
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
    const total = await Candy.aggregate([
        {$group:{_id: "all" , count:{$sum:"$countOrdered"}}}
    ])
    toSend.push(total)
    const doc = await Candy.aggregate([
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
//---------------------------all Candyz--------------------------//



///////////////////////////////////////////////////////////////////////
server.listen(PORT,console.log(`port is running on port ${PORT}...`));
///////////////////////////////////////////////////////////////////////
// API_KEY = AIzaSyDP9dYPVf2u0doyObPdfPOYK-ecHUni8-8

