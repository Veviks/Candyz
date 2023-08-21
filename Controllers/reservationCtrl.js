const Candy = require("../Backend/models/Candy");
const path = require('path');
//----------------Search page-----------------------//
function getUserMenuPage(req, res) {
    res.sendFile(path.join(__dirname, '..', 'View', 'userMenu.html'));
}
function getSelectionPage(req, res) {
    res.sendFile(path.join(__dirname, '..', 'View', 'reservationSelect.html'));
}
async function getSearchResPage(req, res) {
    const order = req.body.inname;
    const name = order.split('_')[0].trim();
    
    console.log("name is: " + name);
    const productName = await Candy.findOne({"name": name});
    if(!productName ){
        const errorMessage = "Product not found";
        console.log(errorMessage);
        setTimeout(() => {
            return res.redirect("/reservationSelect?options=All&name=&flavor=&quantity=&price=");
        },2000);
        return;
    }

    const quant = order.split('_')[1].trim();
    console.log("quant is: " + quant);
    if(quant > productName.quantity){
        const errorMessage = "Quant too much";
        console.log(errorMessage);
        setTimeout(() => {
            return res.redirect("/reservationSelect?options=All&name=&flavor=&quantity=&price=");
        },2000);
        return;
    }
    req.session.reload(function(err){
        if (err) throw err;
        else{
            if (req.session.selected === "nothing yet"){
                req.session.selected = order;
                req.session.myData = "false";
            }else{
                const str = req.session.selected + "," + order;
                req.session.selected = str;
                req.session.myData = "true";
            }
            
            req.session.save();
        }
    });
    res.redirect("/cart?data=${encodeURIComponent(additionalData)}");
}

async function fetchData(req,res){
        const tmpName = req.query.tmpName;
        try {
            const productName = await Candy.findOne({ "name": tmpName });
            if (productName) {   
                res.json({ quantity: productName.quantity });
            } else {
                res.json({ error: 'Product not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'An error occurred' });
        }
}




module.exports = {getSelectionPage,getUserMenuPage,getSearchResPage,fetchData};