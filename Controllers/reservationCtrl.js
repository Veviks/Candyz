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
    if(!productName){
        console.log("product not found");
        return res.redirect("/wrongProduct");
    }
    const quant = order.split('_')[1].trim();
    console.log("quant is: " + quant);
    if(quant > productName.quantity){
        console.log("quant to much");
        return res.redirect("/wrongQuantity");
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


module.exports = {getSelectionPage,getUserMenuPage,getSearchResPage};