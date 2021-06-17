const express = require("express");
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const flash = require("express-flash");
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const docxConverter = require('docx-pdf');

const User = require("./models/User");
const Document = require("./models/Document");
const authenticateUser = require("./middlewares/authenticateUser");
const minioClient = require('./minioClient');
const transporter = require('./transporter');
const helpers = require('./helpers');

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


//define storage location of the documents local
const storage = multer.diskStorage({destination: function(req, file, cb) {
    cb(null, 'uploaded');
    },
    // By default, multer removes file extensions add it back
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
    }
});


// middlewares
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));
app.use(express.json());
app.use(express.urlencoded({ extened: true }));
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
        return res.render("register", { message: "Please enter all the fields" });
    }

    if (password !== password2) {
        return res.render("register", { message: "Mismatch in passwords" });
      }

    const doesUserExitsAlreay = await User.findOne({ email });

    if (doesUserExitsAlreay) {
        return res.render("register", { message: "A user with that email already exits please try another one!" });
    }

    // lets hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    const latestUser = new User({ email, password: hashedPassword });

    latestUser
      .save()
      .then(() => {
        res.render("login", { message: "User created successfully!"});
      })
      .catch((err) => {
        return res.render("register", { message: err });
      });
  });

//upload files
app.post("/upload", authenticateUser, async (req, res) => {
    let upload = multer({ storage: storage, fileFilter: helpers.docFilter }).single('doc_conv');
    upload(req, res, async function(err) {
        // req.file contains information of uploaded file
        // req.body contains information of text fields, if there were any
  
        if (req.fileValidationError) {
            //return res.send(req.fileValidationError);
            return res.render("upload", { message: req.fileValidationError });
        }
        else if (!req.file) {
            //return res.send('Please select a document to upload');
            return res.render("upload", { message: 'Please select a document to upload' });
        }
        else if (err instanceof multer.MulterError) {
            //return res.send(err);
            return res.render("upload", { message: err });
        }
        else if (err) {
            //return res.send(err);
            return res.render("upload", { message: err });
        }
  
        //console.log(req.file.originalname);
        //console.log(req.file.filename);
        //console.log(req.body.email)
        const email = req.body.email
        const position = email.lastIndexOf("@");
        const username = email.substring(0, position)
        //console.log(req.body.doc_conv)
        //console.log(req.file.size) //bytes
        //console.log(req.file)

        const pdf_name = Date.now() + '.pdf'

        docxConverter(req.file.path, req.file.destination + '/' + pdf_name,function(err,result){
            if(err){
                fs.unlinkSync(req.file.path);
                return res.render("upload", { message: err });
            } 
            else {
                fs.unlinkSync(req.file.path);
                minioClient.bucketExists(username, function(err, exists) {
                    if (err) return console.log(err);
                    if (!exists) {
                        minioClient.makeBucket(username, 'us-east-1', function(err) {
                            if (err) return console.log('Error creating bucket.', err) 
                        })
                    }
                    const stream = fs.createReadStream('./' + req.file.destination + '/' + pdf_name);
                    const the_file = stream.on("data", function(data) {
                    const chunk = data.toString();
                    return chunk;
                    });
                    minioClient.putObject(username, pdf_name, the_file, function(error, etag) {
                        if(error) return console.log(error);
                        fs.unlinkSync(req.file.destination + '/' + pdf_name);

                        minioClient.presignedUrl('GET', username, pdf_name, 7*24*60*60, function(err, presignedUrl) {
                            if (err) return console.log(err)
                            console.log(presignedUrl)
                            res.render("upload", { message: "Success, document uploaded!"});

                        // send email
                        transporter.sendMail({
                            from: 'onlineconvert@email.com',
                            to: req.body.email,
                            subject: 'Cloud File Link',
                            html: `<a href="${presignedUrl}">Download File</a>`
                        });

                        })
                    });
                });
            }
        });
        //const buffer = fs.readFileSync(req.file.path);
        //console.log(req.file.path);
        //const fileContent = buffer.toString();
        //console.log(fileContent);

 /*       fs.readFile(req.file.path, 'utf-8' , (err, data) => {
            if (err) {
                console.error(err)
              return
            }
            fs.unlinkSync(req.file.path);
            console.log(data)
          }) */


    });

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