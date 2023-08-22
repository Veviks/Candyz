const path = require('path');
const bcrypt = require("bcryptjs");
const User = require("../Backend/models/User");
//----------------signIn page-----------------------//
function getSignInPage(req, res) {
    res.sendFile(path.join(__dirname, '..', 'View', 'signIn.html'));
}

async function checkUser(req,res){
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if (!user){
        console.log("No such user");
        const errorResponse = { text: "User is not exists" };
        return res.redirect(`/signin?error=${encodeURIComponent(JSON.stringify(errorResponse))}`);
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
}

module.exports = {getSignInPage,checkUser};