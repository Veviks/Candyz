
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require('path');
const http = require('http');
const socketio = require('socket.io')
const formatMessage = require('./public/js/utils/messages');
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
const User = require("./models/User");
const IceCream = require("./models/IceCream");
const Reservation = require("./models/Reservation");
const isAuth = require("./middleware/is-auth");
const isAdmin = require("./middleware/is-admin");
const isGuest = require('./middleware/is-guest');
const Gelateria = require('./models/Gelateria');
const disconnect  = require('process');
const PORT = 8081;
const server = http.createServer(app);
const io = socketio(server)
let isFlag = true;
//connect to database
connectDB();

app.use(express.static("public"));
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
const usersMap = new Map();
let ind =0;
app.get("/chat", isGuest, function(req,res){
    res.sendFile(__dirname + "/public/chat.html");
});

app.get("/chatInner", isGuest, function(req,res){
    userName = req.query.username;
    usersArr.push(userName);
    res.sendFile(__dirname + "/public/chatInner.html");
    // console.log(userName);
});
//---------------------------------Chat--------------------------------//
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


//---------------------------------------//
//guest's routes
//---------------------------------------//
app.get("/", isGuest, function(req,res){
    res.sendFile(__dirname + "/public/index.html");
});
//----------sign up---------------------//
app.get("/signup",isGuest,function(req,res){
    res.sendFile(__dirname + "/public/signup.html");
});
app.post('/signup', async (req,res) =>{
    const fullname = req.body.fullname;
    const email = req.body.email;
    const password = req.body.password;
    console.log(email)
    

    let user = await User.findOne({ email });
    if (user){
        console.log("already exsit -> sign in")
        return res.redirect("/signin");    
    }
    if (fullname.includes(" ") && email.includes("@") && email.includes(".") && password.length >= 6){
        const hasdPsw = await bcrypt.hash(password, 12);
        user = new User({
            fullname,
            email,
            password: hasdPsw,
            admin:false,
            listOfOrders: null
        });
        if(email == "lovton13@gmail.com"){
            user.admin = true;
        }
        await user.save();
        const date = new Date(); // Set the desired expiration date
        date.setDate(date.getDate() + 30); // For example, set the cookie to expire in 30 days
        res.cookie("myCookie", "", { expires: new Date(date) }); 
        res.redirect("/signin");
    }else{
		res.redirect("/signup");
    }
}); 
//----------sign in---------------------//

app.get("/signin",isGuest,function(req,res){
    res.sendFile(__dirname + "/public/signIn.html");
});
app.post("/signin",async (req,res)=>{
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if (!user){
        console.log("No such user");
        return res.redirect("/signin");
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if (!isMatch){
        console.log("Wrong password...");
        return res.redirect("/signin");
    }
    req.session.selected = "nothing yet";
    req.session.isAuth = true;
    req.session.fullname = user.fullname;
    req.session.email = user.email;
    req.session.password = user.password;
    if (user.admin){
        req.session.isAdmin = true;
        res.redirect("/adminMenu");
    }else{
        
        res.redirect("/userMenu");
    }
});
//user's routes
//-------------------reservation--------------------------//
app.get("/userMenu",isAuth,(req,res)=>{
    res.sendFile(__dirname + "/public/userMenu.html");
});
//-----------search ice cream----------------//
app.get("/reservationSelect",isAuth,function(req,res){
    res.sendFile(__dirname + "/public/reservationSelect.html");
});
//----------search results and start order---//
app.post("/resSelect",async(req,res)=>{
    const name = req.body.inname;
    req.session.reload(function(err){

        if (err) throw err;
        else{
            if (req.session.selected === "nothing yet"){
                req.session.selected = name;
                req.session.myData = "false";
            }else{

                const str = req.session.selected + "," + name;
                req.session.selected = str;
                req.session.myData = "true";
            }
            
            req.session.save();
        }
    });
    
    res.redirect("/cart?data=${encodeURIComponent(additionalData)}");
});
//---------------------selection result in user's cart------------------//
app.get("/cart",isAuth, (req,res)=>{
    let flag = req.session.myData;
        if(req.cookies.myCookie == undefined){
            console.log("undefimed world")
            res.cookie("myCookie",req.session.selected);
        }
        else{
            console.log(" not undefimed world")
            console.log(flag);
            if(flag == 'false'){
                res.cookie("myCookie",req.cookies.myCookie + ',' + req.session.selected);
            }
            else{
                res.cookie("myCookie",req.session.selected );
            }
        }
    res.sendFile(__dirname + "/public/cart.html");
});
//--------cancel current order and back to search options---//
app.get("/cancelOrder",isAuth,(req,res)=>{
    req.session.reload(function(err){
        if (err) throw err;
        else{
            req.session.selected = "nothing yet";
        }   
            
            req.session.save();
    });
    
    res.clearCookie("myCookie");
    res.redirect("/userMenu");
});

// app.post("/sendData", (req, res) => {
//     const receivedData = req.body;
//     console.log("data is", JSON.stringify(receivedData));
    
// });

//---finish the order, add reservation and update ice cream and user----//
app.post("/finishOrder",async(req,res)=>{
    let count =0;
    let sum = 0;
    const selectedArr = req.cookies.myCookie.split(",");
    const email = req.session.email;
    let name = '';
    let quantity = '';
    let tmpContent = '';
    
    for (let i =0; i<selectedArr.length; i++){
        tmpContent = req.session.selected;
        const str = selectedArr[i].split("_");
        name = str[0];
        quantity = str[1];
        const filter = {"name": name};
        const iceCream = await IceCream.findOne(filter);
        if (iceCream != null){
            const newQuantity = iceCream.quantity - quantity;
            if (newQuantity > 0){
                await IceCream.findOneAndUpdate(filter,{$set:{"quantity":newQuantity}},{new:true},(err,doc)=>{
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
            const iceCream = await IceCream.findOne({"name":name});
            console.log("Printing the ice cream" + iceCream)
            const pricPerIceCream = iceCream.price;
            const tmpPrice = pricPerIceCream * quantity;
            const content = tmpContent
            console.log(content)
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
        const ice = await IceCream.findOne({"name":name});
        let count = ice.countOrdered;
        const newCount = count +1;
        await IceCream.findOneAndUpdate({"name":name},{$set:{"countOrdered": newCount }},{new:true},(err,doc)=>{
            
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
                    console.log("9 error")
                    doc.listOfOrders.set(name,1);
                    doc.save(function(err){
                        if (err) throw err;
                    })
                }
            }
        });
        reservationsArr.forEach(async (reservationData) => {
            const reservation = new Reservation(reservationData); // Create a new Reservation instance
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
        res.redirect("/wrongQuantity");
    }

});
//-----------------------users profile-----------------------------------//
app.get("/profile",isAuth,(req,res)=>{
    res.sendFile(__dirname + "/public/profile.html");
})
//--------------------Most Recommended Ice Cream For User from mongodb------//
app.get("/recommendedIceCream",async(req,res)=>{
    let max = 0;
    let recName = "";
    const user = await User.findOne({"email":req.session.email});
    if (user.listOfOrders == null){
        res.json({"text":"We Don't Know Anything yet"});
    }else{
        const arr = user.listOfOrders;
        let keys = Array.from(arr.keys());
        if (keys.length != 0){
            for (let i =0; i < keys.length; i++){
                const iceCreamName = keys[i];
                const str = user.listOfOrders.get(iceCreamName);
                const num = parseInt(str);
                if (num > max){
                    max = num;
                    recName = iceCreamName;
                }
            }
            const iceCream = await IceCream.findOne({"name":recName});
            if (iceCream){
                res.json({
                    "recName" : recName,
                    "flavor" : iceCream.flavor,
                })
            }
        }   
    }
})

//--------------------Reseting cookies--------------------------------//
app.post('/resetCookie', (req, res) => {
    isFlag = false;
});

//--------------------selected ice cream json--------------------------------//
app.get("/selectedIceCreams",async (req,res)=>{
    let arr;
    const cartArr = [];
    let candyName = '';
      
    if(req.cookies.myCookie != undefined){arr = req.cookies.myCookie.split(",");}
    else{arr = req.session.selected.split(",");}
    console.log("selectedIceCreamsCookie " + req.cookies.myCookie);
    console.log("arr is: "+arr)

    if (!isFlag) {
        res.clearCookie('myCookie');
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
        const candy = await IceCream.findOne({"name":candyName});
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
//admin's routes
//------------------------users list-------------------------------//
app.get("/adminMenu",isAdmin,function(req,res){
    res.sendFile(__dirname + "/public/adminMenu.html");
})
//------------------------ice cream admin's options----------------//
app.get("/adminMenu/iceCreams",isAdmin,function(req,res){
    res.sendFile(__dirname + "/public/adminIceCreamsMenu.html");
});
//---------------------add ice cream-------------------------------//
app.post('/addIceCream', async (req,res) =>{
    const name = req.body.name;
    const flavor = req.body.flavor;
    const quantity = req.body.quantity;
    const price = req.body.price;
    const photoURL = req.body.photoURL;
    const countOrdered = 0;

    let iceCream = await IceCream.findOne({ name });
    if (iceCream){
        alert("Ice Cream already exists...");
        return res.redirect("/addIceCream");    
    }

    iceCream = new IceCream({
        name,
        flavor,
        quantity,
        price,
        photoURL,
        countOrdered,
    });
    await iceCream.save();
    res.redirect("/adminMenu");
});
//--------------------------search ice cream results--------------//
app.get("/searchResults",function(req,res){
    res.sendFile(__dirname + "/public/searchResults.html");
});
//---------------------------update ice cream---------------------//
app.post("/updateIceCream",async(req,res)=>{
    const option = req.body.updOption.toLowerCase();
    const optionToString = option.toString();
    const filter = {"name": req.body.iceCreamName};

    let quantity = "";
    let price = "";
    let photoURL = "";
    let update = null;
    if (option === "quantity"){
        quantity = option;
        console.log(quantity)
        update = {$set:{quantity: req.body.values}};
    }
    if (option === "price"){
        price = option;
        update = {$set:{price: req.body.values}};
    }
    if (option === "url"){
        photoURL = option;
        update = {$set:{photoURL: req.body.values}};
    }
    await IceCream.findOneAndUpdate(filter, update, {new: true}, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
        }
        res.redirect("/adminMenu/iceCreams");
    });
});
//---------------------------delete ice cream---------------------//
app.post("/deleteIceCream",async(req,res)=>{
    const iceCreamName = req.body.iceCreamName.trim(); // Remove leading/trailing spaces
    console.log(iceCreamName);

    try {
        const deletedIceCream = await IceCream.findOneAndDelete({ "name": iceCreamName });

        if (deletedIceCream) {
            console.log("Ice cream deleted:", deletedIceCream);
        } else {
            console.log("Ice cream not found:", iceCreamName);
        }

        res.redirect("/adminMenu/iceCreams");
    } catch (error) {
        console.error("Error deleting ice cream:", error);
        res.status(500).send("Error deleting ice cream");
    }
});

//-----------------------------stats admin's menu----------------//
app.get("/adminMenu/Stats",function(req,res){
    res.sendFile(__dirname + "/public/statsAdmin.html");
});
//--------------------------Gelateria admin's Menu----------------//
app.get("/adminMenu/gelaterias",isAdmin,(req,res)=>{
    res.sendFile(__dirname + "/public/admiGelateriasMenu.html");
})
//--------------------------add gelateria--------------------------//
app.post("/addGelateria",async(req,res)=>{
    const address = req.body.address;
    const latitude = req.body.lat;
    const longitude = req.body.lng;
    const photoURL = req.body.photoURL;
    
    let gelateria = await Gelateria.findOne({address});
    if (gelateria){
        console.log("Candys shop already in data")
        res.redirect("/adminMenu/gelaterias");
    }else{
        gelateria = new Gelateria({
            address,
            latitude,
            longitude,
            photoURL
        });
        await gelateria.save();
        res.redirect("/adminMenu/gelaterias");
    }
})
//-----------------------------update photo url gelateria--------------//
app.post("/updateGelateria",async(req,res)=>{
    const address = req.body.address;
    const url = req.body.url;
    await Gelateria.findOneAndUpdate({"address":address},{$set:{"photoURL": url}},{new:true},(err,doc)=>{
        res.redirect("/adminMenu/gelaterias");
    });
})
//--------------------------delete gelateria by address---------------------//
app.post("/deleteGelateria",async(req,res)=>{
    const address = req.body.address;
    await Gelateria.findOneAndDelete({"address": address});
});
//---------------------------all gelaterias from mongodb-------------------------//
app.get("/showGelaterias",async(req,res)=>{
    const doc = await Gelateria.find({});
    res.json(doc);
})
//------------------------all users from mongodb---------------------------------//
app.get("/showData",async(req,res)=>{
    const all = await User.find({});
    res.json(all);
})
//-----------------------all ice creams from mongodb-------------//
app.get("/adminMenu/showIceCreamsList",async(req,res)=>{
    const all = await IceCream.find({});
    res.json(all);
})
//-----------------------all ice creams sorted by countOrdered------------//
app.get("/adminMenu/showMostWantedIceCream",async(req,res)=>{
    const all = await IceCream.find({}).sort({countOrdered:-1});
    res.json(all);
});
//-----------------------all ice creams sorted by price------------//
app.get("/adminMenu/showMaxPriceIceCream",async(req,res)=>{
    const all = await IceCream.find({}).sort({price:-1});
    res.json(all);
});
app.get("/adminMenu/showMinPriceIceCream",async(req,res)=>{
    const all = await IceCream.find({}).sort({price:1});
    res.json(all);
});
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
    res.sendFile(__dirname+ "/public/loginReminder.html");
});
app.get("/guestReminder",isAuth,function(req,res){
    res.sendFile(__dirname+ "/public/guestReminder.html");
});
app.get("/adminReminder",function(req,res){
    res.sendFile(__dirname   + "/public/adminReminder.html");
});
app.get("/wrongQuantity",function(req,res){
    res.sendFile(__dirname + "/public/wrongQuantity.html");
});
//-----------------------------profile json--------------------------//
app.get("/profileInfo",async(req,res)=>{
    const name = req.session.fullname;
    const email = req.session.email;
    const listOfOrders = await Reservation.find({"email":email});
    const newListOfOrders = [];
    
     for(let i =0; i < listOfOrders.length; i++){
        let order = listOfOrders[i];
        if(order.content == 'nothing yet'){continue;}
        if(order.content.includes(',')){
            const items = order.content.split(','); // Split items by comma
            let ind = 0;
            // Loop through each item and create a new order for it
            items.forEach(item => {
              let itemsArr =  item.split('_'); // Split name and quantity
              let  itemName = itemsArr[0].trim();
              let  quantity = itemsArr[1].trim();
            //   const  tmpPrice = calcPrice(itemName, quantity)
              const newOrder = {
                _id: order._id,
                orderNumber: order.orderNumber,
                email: order.email,
                date: order.date,
                price: order.price,
                content: item, // Set content for the specific item
                __v: order.__v
              };
              newListOfOrders.push(newOrder); // Push new order to the list
              i+= items.length-1;
            });
        }
        else{
            newListOfOrders.push(order);
        }
    }
    res.json({
                "name":name,
                "email":email,
                "listOfOrders":newListOfOrders
            })
});
//------------------------------change password----------------------//
app.get("/changePassword",isAuth,(req,res)=>{
    res.sendFile(__dirname + "/public/changePassword.html");
})
app.post("/changePassword",async(req,res)=>{
    const password = req.body.pass;
    const rePassword = req.body.repass;
    const hasdPsw = await bcrypt.hash(password, 12);
    if (password === rePassword && password.length >= 6){
        await User.findOneAndUpdate({"email":req.session.email},{$set:{"password":hasdPsw}},{new:true},(err,doc)=>{
            res.redirect("/userMenu");
        });
    }else{
        res.redirect("/changePassword");
    }

});
//------------------------flavors ordered----------------------------//
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
    res.sendFile(__dirname + "/public/googleMaps.html");
})
app.get("/googleMapsUser",(req,res)=>{
    res.sendFile(__dirname + "/public/googleMapsUser.html");
})
//---------------------------all gelaterias--------------------------//

/*
This code block handles the API request from the client to retrieve information about gelato shops (Gelaterias). 
It queries the database for all the Gelateria documents using the
Mongoose model Gelateria and responds with a JSON array containing the gelato shop information.
*/
app.get("/showGel",async(req,res)=>{
    const doc = await Gelateria.find({});
    res.json(doc);

})
///////////////////////////////////////////////////////////////////////
server.listen(PORT,console.log(`port is running on port ${PORT}...`));
///////////////////////////////////////////////////////////////////////
// API_KEY = AIzaSyDP9dYPVf2u0doyObPdfPOYK-ecHUni8-8

async function calcPrice(name, quantity) {
    try {
        const iceCream =await IceCream.findOne({"name": name});
        const pricPerIceCream = iceCream.price;
        const tmpPrice = pricPerIceCream * parseInt(quantity, 10);
        return tmpPrice;
    } catch (error) {
        throw error;
    }
}
