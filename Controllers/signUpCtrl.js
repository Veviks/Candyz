const path = require('path');
const bcrypt = require("bcryptjs");
const User = require("../Backend/models/User");
//----------------signUp page-----------------------//
function getSignUpPage(req, res) {
    res.sendFile(path.join(__dirname, '..', 'View', 'signUp.html'));
}

async function setNewUsser(req,res){
    const errorsArr = [];
    const fullname = req.body.fullname;
    const email = req.body.email;
    const password = req.body.password;
    console.log("email is: " + email);
    console.log("name is: " + fullname);
    console.log("PW is: " + password);
    
    let user = await User.findOne({ email });
    if (user) {
        console.log("already exists -> sign in");
        const errorResponse = { text: "User already exists" };
        return res.redirect(`/signup?error=${encodeURIComponent(JSON.stringify(errorResponse))}`);
    }
    if (/^[a-zA-Z\s]*[a-zA-Z][a-zA-Z\s]*$/.test(fullname) && fullname.includes(" ") && email.includes("@") && email.includes(".") && password.length >= 6 && password.length <= 12 ){
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
        console.log("user was sucssefully created");
        const date = new Date(); // Set the desired expiration date
        date.setDate(date.getDate() + 30); // For example, set the cookie to expire in 30 days
        res.cookie("myCookie", "", { expires: new Date(date) }); 
        res.redirect("/signin");
    }else{
        if (!fullname.includes(" ")) {
            errorsArr.push("Last name required");
            console.log("Last name required");
        }
        if (!/^[a-zA-Z\s]*[a-zA-Z][a-zA-Z\s]*$/.test(fullname)) {
            errorsArr.push("Last name required");
            console.log("Alphabet letter required");
        }
        if (!email.includes("@") || !email.includes(".")) {
            errorsArr.push("Invalid Email");
            console.log("Invalid Email");
        }
        if (password.value.length === 0 || password.length < 6 || password.length > 12) {
            errorsArr.push("Password invalid");
            console.log("Password invalid");
        }
        console.log("User was not created");
		setTimeout(() => {
            return res.redirect("/signup");
        }, 2000);
        //res.render("signup", { errorsArr });
    }
    
}



module.exports = {getSignUpPage,setNewUsser};