const path = require('path');
const User = require("../Backend/models/User");
const Candy = require("../Backend/models/Candy");
const Reservation = require("../Backend/models/Reservation");
const bcrypt = require("bcryptjs");
//----------------cart page-----------------------//
function getProfile(req,res){
    res.sendFile(path.join(__dirname, '..', 'View', 'profile.html'));
}

async function recommendedProducts(req,res){
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
                const CandyName = keys[i];
                const str = user.listOfOrders.get(CandyName);
                const num = parseInt(str);
                if (num > max){
                    max = num;
                    recName = CandyName;
                }
            }
            const tmpCandy = await Candy.findOne({"name":recName});
            if (tmpCandy){
                res.json({
                    "recName" : tmpCandy.name,
                    "flavor" : tmpCandy.flavor,
                })
            }
        }   
    }
}

async function profileInfo(req,res){
    const name = req.session.fullname;
    const email = req.session.email;
    const listOfOrders = await Reservation.find({"email":email});
    console.log("list of orders: " + listOfOrders);
    console.log("-----------------------------------------")
    
    const Candys = await Candy.find({}, 'name price'); 
    const CandyPricesMap = new Map();

    Candys.forEach(Candy => {
        CandyPricesMap.set(Candy.name, Candy.price);
    });
    const newListOfOrders = [];
    
     for(let i =0; i < listOfOrders.length; i++){
        let order = listOfOrders[i];
        console.log("list of orders: " + order);
        if(order.content == 'nothing yet'){continue;}
        if(order.content.includes(',')){
            const items = order.content.split(','); // Split items by comma
            
            // Loop through each item and create a new order for it
            items.forEach(item => {
              let itemsArr =  item.split('_'); // Split name and quantity
              let  itemName = itemsArr[0].trim();
              let  quantity = itemsArr[1].trim();

              console.log("item Name at profile is: " + itemName);
          
              const newOrder = {
                _id: order._id,
                orderNumber: order.orderNumber,
                email: order.email,
                date: order.date,
                price: CandyPricesMap.get(itemName)*quantity,
                content: item, // Set content for the specific item
                __v: order.__v
              };
              newListOfOrders.push(newOrder); // Push new order to the list
              
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
    
    
}

function getChangePwPage(req,res){
    res.sendFile(path.join(__dirname, '..', 'View', 'changePassword.html'));
}

async function changePw(req,res){
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
}

module.exports = {getProfile,recommendedProducts,profileInfo,getChangePwPage,changePw};