const Shop = require('../Backend/models/Shops');
async function addShops(req,res){
    const address = req.body.address;
    if(!address){
        return res.redirect("/adminMenu/Shops");
    }
    const latitude = req.body.lat;
    const longitude = req.body.lng;
    const photoURL = req.body.photoURL;
    
    let tmpShop = await Shop.findOne({address});
    if (tmpShop){
        console.log("Candys shop already in data")
        res.redirect("/adminMenu/Shops");
    }else{
        tmpShop = new Shop({
            address,
            latitude: latitude || 0,
            longitude: longitude || 0,
            photoURL
        });
        await tmpShop.save();
        res.redirect("/adminMenu/Shops");
    }
}

async function updateShops(req,res){
    const address = req.body.address;
    const url = req.body.url;
    await Shop.findOneAndUpdate({"address":address},{$set:{"photoURL": url}},{new:true},(err,doc)=>{
        res.redirect("/adminMenu/Shops");
    });
}

async function deleteShops(req,res){
    const address = req.body.address.trim();
    console.log(address);
    await Shop.findOneAndDelete({"address": address});
    res.redirect("/adminMenu/Shops");
}

async function showShops(req,res){
    const doc = await Shop.find({});
    res.json(doc);
}

//-------------show Data-----------------


module.exports = {addShops,updateShops,deleteShops,showShops};