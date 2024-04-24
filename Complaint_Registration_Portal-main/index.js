const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const morgan = require('morgan')
const path = require('path')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const formidable = require('formidable')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const nm = require('nodemailer')
var cors = require('cors');

const app = express()

app.use(bodyParser.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(cors('*'));

const registerPath = path.join(__dirname, './public/register.html');
const loginPath = path.join(__dirname, './public/login.html');
const homePath = path.join(__dirname, './public/home.html');
const otpPath = path.join(__dirname, './public/otp.html');
const complaintPath = path.join(__dirname, './public/complaint.html');
const statusPath = path.join(__dirname, './public/status.html');

//global variable for name and phone number
var userName
var phoneNumber
var Email
var ID

mongoose.connect('mongodb://127.0.0.1:27017/employee', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

var db = mongoose.connection

db.on('error', () => {
    console.log('Error in connecting to database')
})

db.once('open', () => {
    console.log("Connected to database")
})

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    id: {type: String, required: true, unique: true},
    email: {type: String, required: true},
    phno: {type: String, required: true, unique: true},
    password: {type: String, required: true}
})

const complaintSchema = new mongoose.Schema({
    complaintID: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    email: {type: String, required: true},
    type: {type: String, required: true},
    description: {type: String, required: true},
    latitude: {type: Number, required: true},
    longitude: {type: Number, required: true},
    location: {type: String, required: true},
    date: {type: Date, required: true}
})

const User = mongoose.model('User', userSchema)
const Complaint = mongoose.model('Complaint', complaintSchema)

function generateUniqueID() {
    return uuidv4()
}

app.get('/register', (req, res) => {
    res.set({
        "Allow-access-Allow-Origin": '*'
    })
    return res.sendFile(registerPath)
})

app.get("/login", (req, res) => {
    return res.sendFile(loginPath)
})

app.get("/home", (req, res) => {
    return res.sendFile(homePath)
})

app.get("/complaint", (req, res) => {
    return res.sendFile(complaintPath)
})

app.get("/status", (req, res) => {
    return res.sendFile(statusPath)
})

/*const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your_email',
    },
})*/

app.get("/getOtp", (req, res) => {
    res.sendFile(otpPath)
    /*const otp = generateOTP()

    var recipient_email = req.body.recipient_email
    const mailOptions = {
        to: recipient_email,
        subject: 'OTP Verification',
        text: `Your OTP is ${otp}`,
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if(error) {
            console.log('Error sending OTP: ', error)
            return res.status(500).send('failed to send otp')
        }
        console.log('OTP sent', info.response)
        return res.send(getOTP)
    })*/
})

/*function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000)
    return otp.toString()
}*/

app.post("/register", async (req, res) => {
    var name = req.body.name
    var id = req.body.id
    var email = req.body.email
    var phno = req.body.phno
    var password = req.body.password

    if(!name || !id || !email || !phno || !password){
        return res.status(400).send('All fields are required')
    }

    try{
        const hashedPassword = await bcrypt.hash(password, 10)

        const existingUser = await User.findOne({phno: phno})
        const existingUser2 = await User.findOne({id: id})
        const existingUser3 = await User.findOne({email: email})
        if(existingUser || existingUser2 || existingUser3){
            return res.status(400).send('User already exists. <a href=\'./login.html\'>Click Here!</a>');
        }

        var data = {
            "name": name,
            "id": id,
            "email": email,
            "phno": phno,
            "password": hashedPassword
        }
    
        db.collection('users').insertOne(data, (err,collection) => {
            if(err){
                throw err
            }
            console.log('Registration Successful')
    })
    return res.sendFile(loginPath)
    }catch(error){
        console.log('Error during registration', error)
        return res.status(500).send('Internal Server Error')
    }
})

app.post("/login", async (request, response) => {
    try{
        const username = request.body.email 
        const password = request.body.password

        const userid = await db.collection("users").findOne({email: username}, async (err, res) => {
            if(res == null){
                response.send('You don\' have an account. Create an account. <a href=\'./register.html\'>Click Here!</a>')
            }
            else{
            //userName = db.collection("users").
            const passwordMatch = await bcrypt.compare(password, res.password)

            if(passwordMatch) {
                console.log('login Successfull')
                
                userName = userid.name
                phoneNumber = userid.phno
                Email = userid.email
                ID = userid.id

                return response.redirect(`/home?name=${userName}&phno=${phoneNumber}&email=${Email}&id=${ID}`);
            }
            else{
                console.log("Password doesn't match.")
                response.send("incorrect password")
            }
            }
        })

    }catch(error){
        console.log("Error while logging in")
    }
})

app.post("/complaint",  async (req, res) => {
    

  
try{
   // console.log(req.body);
  

    
        
    const form = new formidable.IncomingForm()
    
    form.parse(req, (err, fields, files) => {
        if(err) {
            console.log('Error parsing from data', err)
            return res.status(500).send('Internal Server Error')
        }
       // console.log(files);
       console.log("fields from formidable");
        console.log(fields.name+"==="+fields.phno);
        var complaintDetails = {
            "complaintID": generateUniqueID(),
            "name": fields.name,
            "phno": fields.phno,
            "email": fields.email,
            "type": fields.type,
            "description": fields.description,
            "latitude": fields.latitude,
            "longitude": fields.longitude,
            "location": fields.location,
            "date": fields.date
        }
        console.log(complaintDetails)
        
        db.collection('complaints').insertOne(complaintDetails, (err, collection) => {
            if(err){
                throw err
            }
        let oldPath = files.file.filepath
        let fileExtension  = path.extname(files.file.originalFilename)
        let newName = `${complaintDetails.complaintID}${fileExtension}`
        let newPath = path.join(__dirname, 'uploads', newName)
            //+ '/' + files.file.originalFilename;
        console.log(newPath)
        let rawData = fs.readFileSync(oldPath)
        //console.log(rawData)

        fs.writeFile(newPath, rawData, function (err) {
            if(err) {
                console.log('Error moving uploaded file', err)
                return res.status(500).send('Internal Server Error')
            }
            console.log('Successfully uploaded')
        })
        return res.send(`Thank You for registering the complaint. Your complaint has been successfully registered.<br>We will solve the problem as soon as possible.<br>You can check your complaint status with the complaint ID: ${complaintDetails.complaintID}`)
    })
        console.log('Complaint registered Successfully')

        
    })
}catch(error){
    console.log('Error during registrating your complaint', error)
    return res.status(500).send('Internal Server Error')
}

    
    
    
    
})

let savedOTPS = {

};
var transporter = nm.createTransport(
    {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: 'yourmail.com',
            pass: 'your app password'
        }
    }
);

app.post('/sendotp', (req, res) => {
    let email = req.body.email;
    let digits = '0123456789';
    let limit = 4;
    let otp = ''
    for (i = 0; i < limit; i++) {
        otp += digits[Math.floor(Math.random() * 10)];

    }
    var options = {
        from: 'yourmail@gmail.com',
        to: `${email}`,
        subject: "Testing node emails",
        html: `<p>Enter the otp: ${otp} to verify your email address</p>`

    };
    transporter.sendMail(
        options, function (error, info) {
            if (error) {
                console.log(error);
                res.status(500).send("couldn't send")
            }
            else {
                savedOTPS[email] = otp;
                setTimeout(
                    () => {
                        delete savedOTPS.email
                    }, 60000
                )
                res.send("sent otp")
            }

        }
    )
})

app.post('/verify', (req, res) => {
    let otprecived = req.body.otp;
    let email = req.body.email;
    if (savedOTPS[email] == otprecived) {
        res.send("Verfied");
    }
    else {
        res.status(500).send("Invalid OTP")
    }
})

app.listen(3000)