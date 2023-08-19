const path = require('path');

//----------------cart page-----------------------//

function getCart(req, res) {
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
            res.cookie("myCookie",req.session.selected);
        }
    }
    res.sendFile(path.join(__dirname, '..', 'View', 'cart.html'));
}

function cancelOrders(req,res){
    req.session.reload(function(err){
        if (err) throw err;
        else{
            req.session.selected = "nothing yet";
        }   
            
            req.session.save();
    });
    
    res.clearCookie("myCookie");
    res.redirect("/userMenu");
}
module.exports = {getCart,cancelOrders};