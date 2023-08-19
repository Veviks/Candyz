const Candy = require("../Backend/models/Candy");

async function addCandy(req,res){
    const name = req.body.name;
    if(!name){
        return res.redirect("/adminMenu/Candys");    
    }
    const flavor = req.body.flavor;
    const quantity = req.body.quantity;
    const price = req.body.price;
    const photoURL = req.body.photoURL;
    const countOrdered = 0;

    let tmpCandy = await Candy.findOne({ name });
    if (tmpCandy){
        return res.redirect("/adminMenu/Candys");    
    }

    tmpCandy = new Candy({
        name,
        flavor,
        quantity: quantity || 0,
        price: price || 0,
        photoURL,
        countOrdered,
      });
      
    await tmpCandy.save();
    res.redirect("/adminMenu/Candys");
}

async function updateCandy(req,res){
    const option = req.body.updOption.toLowerCase();
    const optionToString = option.toString();
    const filter = {"name": req.body.CandyName};

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
    await Candy.findOneAndUpdate(filter, update, {new: true}, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
        }
        res.redirect("/adminMenu/Candys");
    });
}

async function deleteCandy(req,res){
    const CandyName = req.body.CandyName.trim(); // Remove leading/trailing spaces
    console.log(CandyName);

    try {
        const deletedCandy = await Candy.findOneAndDelete({ "name": CandyName });

        if (deletedCandy) {
            console.log("Ice cream deleted:", deletedCandy);
        } else {
            console.log("Ice cream not found:", CandyName);
        }

        res.redirect("/adminMenu/Candys");
    } catch (error) {
        console.error("Error deleting ice cream:", error);
        res.status(500).send("Error deleting ice cream");
    }
}


//----------------------Show Data---------------------
async function showCandyzList(req,res){
    const all = await Candy.find({});
    res.json(all);
}
async function showMostWantedCandyz(req,res){
    const all = await Candy.find({}).sort({countOrdered:-1});
    res.json(all);
}
async function showMaxPriceCandyz(req,res){
    const all = await Candy.find({}).sort({price:-1});
    res.json(all);
}
async function showMinPriceCandyz(req,res){
    const all = await Candy.find({}).sort({price:1});
    res.json(all);
}
module.exports = {addCandy,updateCandy,deleteCandy,showCandyzList,showMostWantedCandyz,showMaxPriceCandyz,showMinPriceCandyz};