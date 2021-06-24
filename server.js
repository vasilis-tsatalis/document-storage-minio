const microtime = require('microtime');
const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const flash = require("express-flash");
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const docxConverter = require('docx-pdf');
const reader = require('any-text');
const axios = require('axios');
const fetch = require('node-fetch');

require('dotenv/config');
const User = require("./models/User");
const Document = require("./models/Document");
const authenticateUser = require("./middlewares/authenticateUser");
const minioClient = require('./minioClient');
const transporter = require('./transporter');
const helpers = require('./helpers');
const queue = require('./queue');
const routing = require('./routing');
const publish = require('./publish');
const messages = require('./messages');

const app = express();

// mongdb cloud connection is here 
mongoose
  .connect(process.env.MONGO_DB, {
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

// send email
function send_email(email, body){
  transporter.sendMail({
    from: 'onlineconvert@email.com',
    to: email,
    subject: 'Cloud File Link',
    html: body
});
}

// calc document size
function getFilesizeInBytes(filename) {
  const stats = fs.statSync(filename);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

// middlewares
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.urlencoded({ extened: true }));
app.set("view engine", "ejs");
app.use(flash());

// cookie session
app.use(
  cookieSession({
    keys: [process.env.COOKIE_KEY],
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
  .get("/home", authenticateUser, async (req, res) => {

    const email = req.session.user.email;
    const position = email.lastIndexOf("@");
    const username = email.substring(0, position)

    const documents = [];
   
    await Document.find().where({ email: email })
    .then(data => {
      let doc_count = 0;
      let word_count = 0;
      data.forEach(element => {
        doc_count += 1;
        const words = element.content;
        for(var word in words) {
          word_count += words[word];
        };
      });
      res.render("home", { username, doc_count, word_count });
    })
    .catch(err => {
      //console.error(err);
      return res.render("home", { message: err });
    }); 
    
    //res.render("home", { username });
  })
  .get("/documents", authenticateUser, async (req, res) => {

    const documents = [];
    const email = req.session.user.email;
   
    await Document.find().where({ email: email })
    .then(data => {
      data.forEach(element => {

        //console.log(element.content);
        let counter = 0;
        const words = element.content;
        for(var word in words) {
          counter += words[word];
        };
        //console.log(counter);

        documents.push({ original_name: element.original_name, name: element.name, doc_size: element.doc_size, words: counter, conv_time: element.conv_time });
      });
      //console.log(documents);
      return res.render("documents", { documents });
    })    
    .catch(err => {
      //console.error(err);
      return res.render("documents", { message: err });
    }); 
  })
  .get("/messaging", authenticateUser, async (req, res) => {
    
    const documents = [];
    const email = req.session.user.email;
    const user = await User.findOne({ email });

    await Document.find().where({ email: email })
    .then(data => {
      data.forEach(element => {
        documents.push({ name: element.name, url: element.url, created_at: element.created_at, expired_at: element.expired_at });
      });
      //console.log(documents);
      return res.render("messaging", { documents });
    })    
    .catch(err => {
      //console.error(err);
      return res.render("messaging", { message: err });
    }); 
  })
  .get("/upload", authenticateUser, (req, res) => {
    res.render("upload");
  });

// route for handling post requirests
app
.post("/login", async (req, res) => {
  const { email, password } = req.body;
  email.toLowerCase();

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

  routing.create_routing(doesUserExits._id, doesUserExits.username);

  // else he\s logged in
  req.session.user = {
    email,
  };
  res.redirect("/home");
  })
  .post("/register", async (req, res) => {
    const { email, password, password2 } = req.body;
    email.toLowerCase();

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

    const position = email.lastIndexOf("@");
    const username = email.substring(0, position)

    queue.create_output(username);

    // lets hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    const latestUser = new User({ email, username, password: hashedPassword });

    latestUser
      .save()
      .then(() => {
        const body = `User with email address <b>${email}</b> has been registered at <i>Document Convert and Storage Platform</i>.`;  
        send_email(email, body);
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
       
        const pdf_name = Date.now() + '.pdf'

        const email = req.session.user.email
        const user = await User.findOne({ email });
        //console.log(user)
        // extract text from docx uploaded file
        const text = await reader.getText(req.file.path);
        
        const pdf_content = await axios.post(`http://${process.env.OPENWHISK}/api/v1/web/guest/default/wordcount`, {
          content: text
        })
        .then(res => {
          //console.log(res.data);
          const content = res.data.payload;
          //console.log(content);
          return content;
        })
        .catch((err) => {
          console.log(err);
        });
        
        //console.log(pdf_content);

        const str_time = microtime.now();
        docxConverter(req.file.path, req.file.destination + '/' + pdf_name,function(err,result){
            if(err){
                fs.unlinkSync(req.file.path);
                return res.render("upload", { message: err });
            } else {
                const end_time = microtime.now();
                const conv_time = end_time - str_time;

                fs.unlinkSync(req.file.path);
                minioClient.bucketExists(user.username, function(err, exists) {
                    if (err) return console.log(err);
                    if (!exists) {
                        minioClient.makeBucket(user.username, 'us-east-1', function(err) {
                            if (err) return console.log('Error creating bucket.', err) 
                        })
                    }
                    const stream = fs.createReadStream('./' + req.file.destination + '/' + pdf_name);
                    const the_file = stream.on("data", function(data) {
                    const chunk = data.toString();
                    return chunk;
                    });
                    minioClient.putObject(user.username, pdf_name, the_file, function(error, etag) {
                        if(error) return console.log(error);

                        const fullname = req.file.destination + '/' + pdf_name;
                        const doc_size = getFilesizeInBytes(fullname);
                        fs.unlinkSync(fullname);

                        minioClient.presignedUrl('GET', user.username, pdf_name, 7*24*60*60, function(err, presignedUrl) {
                            if (err) return console.log(err)
                            //console.log(presignedUrl)
                            const today = new Date();
                            const new_date = new Date();
                            new_date.setDate(today.getDate() + 7);
                            const convertDocument = new Document({ email, original_name: req.file.originalname, name: pdf_name, url: presignedUrl, doc_size: doc_size, conv_time: conv_time, content: pdf_content, created_at: today, expired_at: new_date });
                            convertDocument
                            .save()
                            .then(() => {
                              res.render("upload", { message: "Success, document uploaded!"});
                            })
                            .catch((err) => {
                              return res.render("upload", { message: err });
                            });
                            publish.publish_message(user._id, pdf_name, presignedUrl)
                          //const body = `<a href="${presignedUrl}">Download File</a>`;  
                          //send_email(email, body);
                        })
                    });
                });
            }
        });
    });
});

//logout
app.get("/logout", authenticateUser, (req, res) => {
  req.session.user = null;
  res.redirect("/login");
});

// server config
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started listening on port: ${PORT}`);
});