const express = require("express");
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const flash = require("express-flash");

const User = require("./models/User");
const Document = require("./models/Document");
const authenticateUser = require("./middlewares/authenticateUser");

const app = express();

// mongdb cloud connection is here
mongoose
  .connect("mongodb+srv://moviesuser:7173a8PZk7m68Oyy@devdatabase01.iqvmj.mongodb.net/devdb?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Connected to mongodb cloud atlas!");
  })
  .catch((err) => {
    console.log(err);
  });

// middlewares
app.use(express.urlencoded({ extened: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(flash());

// cookie session
app.use(
  cookieSession({
    keys: ["3d804d40850d74aa14a62044dca7cc0b2c00d16a409ac36fc19ab664daf6e685"],
  })
);

// route for serving frontend files
app
  .get("/", (req, res) => {
    res.render("login");
  })
  .get("/login", (req, res) => {
    res.render("login");
  })
  .get("/register", (req, res) => {
    res.render("register");
  })
  .get("/home", authenticateUser, (req, res) => {
    res.render("home", { user: req.session.user });
  })
  .get("/upload", authenticateUser, (req, res) => {
    res.render("upload");
  });

// route for handling post requirests
app
  .post("/login", async (req, res) => {
    const { email, password } = req.body;

    // check for missing filds
    if (!email || !password) {
      res.send("Please enter all the fields");
      return;
    }

    const doesUserExits = await User.findOne({ email });

    if (!doesUserExits) {
      res.send("invalid username or password");
      return;
    }

    const doesPasswordMatch = await bcrypt.compare(
      password,
      doesUserExits.password
    );

    if (!doesPasswordMatch) {
      res.send("invalid useranme or password");
      return;
    }

    // else he\s logged in
    req.session.user = {
      email,
    };

    res.redirect("/home");
  })
  .post("/register", async (req, res) => {
    const { email, password, password2 } = req.body;

    // check for missing filds
    if (!email || !password || !password2) {
      res.send("Please enter all the fields");
      return;
    }

    if (password !== password2) {
        res.send("Mismatch in passwords");
        return;
      }

    const doesUserExitsAlreay = await User.findOne({ email });

    if (doesUserExitsAlreay) {
      res.send("A user with that email already exits please try another one!");
      return;
    }

    // lets hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    const latestUser = new User({ email, password: hashedPassword });

    latestUser
      .save()
      .then(() => {
        res.redirect("/home");
      })
      .catch((err) => console.log(err));
  });

//upload files
app.post("/upload", authenticateUser, (req, res) => {
    



    res.redirect("/home");
});

//logout
app.get("/logout", authenticateUser, (req, res) => {
  req.session.user = null;
  res.redirect("/login");
});

// server config
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server started listening on port: ${PORT}`);
});