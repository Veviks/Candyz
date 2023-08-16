const IceCream = require("../Backend/models/IceCream");

async function addCandy(req,res){
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
}

async function updateCandy(req,res){
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
}

async function deleteCandy(req,res){
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
}


//----------------------Show Data---------------------
async function showCandyzList(req,res){
    const all = await IceCream.find({});
    res.json(all);
}
async function showMostWantedCandyz(req,res){
    const all = await IceCream.find({}).sort({countOrdered:-1});
    res.json(all);
}
async function showMaxPriceCandyz(req,res){
    const all = await IceCream.find({}).sort({price:-1});
    res.json(all);
}
async function showMinPriceCandyz(req,res){
    const all = await IceCream.find({}).sort({price:1});
    res.json(all);
}
module.exports = {addCandy,updateCandy,deleteCandy,showCandyzList,showMostWantedCandyz,showMaxPriceCandyz,showMinPriceCandyz};