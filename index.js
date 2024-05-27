const express = require('express')
const app = express()
const port = 3000
const UserModel = require("./models/user")
const PostModel = require("./models/post")
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

app.set("view engine", "ejs")
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/', (req, res) => {

    res.render('index');
})
app.get('/login', (req, res) => {
    res.render('login')
})
app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await UserModel.findOne({ email: req.user.email }).populate("post")
    // user.populate("post");
    res.render('profile',{user});
})
app.get('/like/:id', isLoggedIn, async (req, res) => {
    // res.send("like page");
    let post = await PostModel.findOne({ _id: req.params.id }).populate("user")
    // console.log("redirect profile page");
    if (post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
        
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userid), 1)
        
    }
    await post.save();

    res.redirect("/profile");
})
app.get('/edit/:id', isLoggedIn, async (req, res) => {
    // res.send("like page");
    let post = await PostModel.findOne({ _id: req.params.id }).populate("user")
    

    res.render("edit" ,{post});
})
app.post('/update/:id', isLoggedIn, async (req, res) => {
    // res.send("like page");
    let post = await PostModel.findOneAndUpdate({ _id: req.params.id }, {content: req.body.content})
    res.redirect("/profile");
})
app.post('/post', isLoggedIn, async (req, res) => {
    let user = await UserModel.findOne({ email: req.user.email })
    let post = await PostModel.create({
        user:user._id,
        content:req.body.content
    })
    user.post.push(post._id);
    await user.save();
    res.redirect("/profile");

})
app.get('/logout', (req, res) => {
    res.cookie("token", "")
    res.redirect('/login')
})
app.post('/register', async (req, res) => {
    let { name, username, pasword, age, email } = req.body;
    let user = await UserModel.findOne({ email });
    if (user) return res.status(500).send("user already exist");
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(pasword, salt, async (err, hash) => {
            let user = await UserModel.create({
                name,
                email,
                age,
                username,
                pasword: hash

            })
            let token = jwt.sign({ email: email, userid: user._id }, "shh")
            res.cookie("token", token)
            res.send("registered")
        })
    })

    // usermodel.create
})
app.post('/login', async (req, res) => {
    let { pasword, email } = req.body;
    let user = await UserModel.findOne({ email });
    if (!user) return res.status(500).send("something went wrong");

    bcrypt.compare(pasword, user.pasword, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "shh")
            res.cookie("token", token)
            res.status(200).redirect("/profile")
        }
        else res.redirect("/login")
    })

    // usermodel.create
})

function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") res.redirect("/login")
    else {
        let data = jwt.verify(req.cookies.token, "shh")
        // console.log(data);
        req.user = data;
        next()
    }


}
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})