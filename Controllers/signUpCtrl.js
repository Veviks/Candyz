const path = require('path');
const bcrypt = require("bcryptjs");
const User = require("../Backend/models/User");

//----------------signUp page-----------------------//
function getSignUpPage(req, res) {
    res.sendFile(path.join(__dirname, '..', 'View', 'signUp.html'));
}

async function setNewUsser(req,res){
    const fullname = req.body.fullname;
    const email = req.body.email;
    const password = req.body.password;
    console.log(email)
    
    let user = await User.findOne({ email });
    if (user){
        console.log("already exsit -> sign in")
        return res.status(400).json({ error: "User already exists" });
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

}

module.exports = {getSignUpPage,setNewUsser};