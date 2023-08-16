const Gelateria = require('../Backend/models/Gelateria');
async function addShop(req,res){
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
}

async function updateShop(req,res){
    const address = req.body.address;
    const url = req.body.url;
    await Gelateria.findOneAndUpdate({"address":address},{$set:{"photoURL": url}},{new:true},(err,doc)=>{
        res.redirect("/adminMenu/gelaterias");
    });
}

async function deleteShop(req,res){
    const address = req.body.address;
    await Gelateria.findOneAndDelete({"address": address});
}

async function showShops(req,res){
    const doc = await Gelateria.find({});
    res.json(doc);
}

//-------------show Data-----------------


module.exports = {addShop,updateShop,deleteShop,showShops};