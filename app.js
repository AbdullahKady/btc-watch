//Loading env. variables
require('dotenv').config();

//////////////////////////////////////////////////////////////////// SERVER SETUP
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.set('port', process.env.port || 3000);
app.listen(app.get('port'), () => { console.log("Server started. Listening on port " + app.get('port')); });
app.use(express.static(__dirname + '/public')); //Serving assets
app.use(morgan('dev'));

///////////////////////////////////////////////////////////////////// MAILING
const fs = require('fs');
const template = fs.readFileSync('./templates/mailTemplate.html', { encoding: 'utf-8' });
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const options = {
    auth: {
        api_key: process.env.SENDGRID_API
    }
}
const transporter = nodemailer.createTransport(sgTransport(options));
const request = require('request');


///////////////////////////////////////////////////////////////////// Database 
let users;
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect(process.env.DB_HOST, function (err, db) {
    if (err) throw err;
    var dbo = db.db("btc-watch");
    users = dbo.collection('users');
    console.log("Connected to DB successfully");

    //////////////////////////////////////////////////////////////////////////////////////////
    const URL = 'http://preev.com/pulse/units:btc+usd/sources:bitstamp+kraken';
    const FREQUENCY = 30000;

    function Request() {
        request(URL, function (err, res, html) {
            if (err) {
                console.log(error);
            }


            var body = JSON.parse(res.body);
            var price = Number(body.btc.usd.bitstamp.last) * 0.5 + Number(body.btc.usd.kraken.last) * 0.5;
            console.log("Fetched: " + price);
            ////////////////////////////////////////////////////// FIND MATCHING PRICE FROM DB            
            users.find(
                {
                    $or: [{ min: { $gt: price } }
                        , { max: { $lt: price } }]
                }
                , { _id: 0 })
                .toArray(function (err, result) { //////////////////////////////////////////////////// EACH FETCH FROM DB
                    if (err) throw err;
                    let counter = 0;
                    if (result.length == 0)
                        setTimeout(Request, 30000);

                    result.forEach(element => {
                        if (element.max && Number(price) > Number(element.max)) {
                            var mailOptions = {
                                from: 'btc@watch.com',
                                to: element.email
                            }
                            mailOptions.subject = 'Bitcoin price just passed your maximum!';
                            mailOptions.html = template.replace("[MAX_MIN]", 'passed the maximum').replace("[TARGET_PRICE]", element.max).replace("[CURRENT_PRICE]", price);
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log(`Email sent (MAX) to ${element.email}: ` + price);
                                    users.deleteOne({ email: element.email }, (res) => {
                                        counter++;
                                        console.log('Deleted document successfully: ' + element.email);
                                        if (counter == result.length) {
                                            console.log('done');
                                            setTimeout(Request, 30000);
                                        }
                                    })
                                }
                            });
                        } else if (element.min && Number(price) < Number(element.min)) {
                            var mailOptions = {
                                from: 'btc@watch.com',
                                to: element.email
                            }
                            mailOptions.subject = 'Bitcoin price just dropped below minimum!';
                            mailOptions.html = template.replace("[MAX_MIN]", 'dropped below the').replace("[TARGET_PRICE]", element.min).replace("[CURRENT_PRICE]", price);
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log(`Email sent (MIN) to ${element.email}: ` + price);
                                    users.deleteOne({ email: element.email }, (res) => {
                                        counter++;
                                        console.log('Deleted document successfully: ' + element.email);
                                        if (counter == result.length) {
                                            console.log('done');
                                            setTimeout(Request, 30000);
                                        }
                                    })
                                }
                            });
                        }
                    });
                    // setTimeout(Request, 15000);
                });
        });

    }
    Request();

});


////////////////////////////////////////////////////////////// ROUTERS
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/templates/index.html');
})
app.post('/', function (req, res) {
    if (!validateReq(req.body))
        return false;
    let obj = {
        email: req.body.email,
        min: Number(req.body.min),
        max: Number(req.body.max)
    };
    users.replaceOne(
        { email: req.body.email },
        obj,
        { upsert: true }
    );
    console.log("User added/updated!");
})
////////////////////////////////////////////////////////////// VALIDATIONS
function validateReq(body) {
    if (!body.email || (!body.min && !body.max)) {
        console.log("Bad request");
        return false;
    }
    var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!regex.test(String(body.email).toLowerCase())) {
        console.log("Request denied: Invalid email format");
        return false;
    }
    if (body.min && body.max) {
        if (Number(body.max) < Number(body.min)) {
            console.log("Request denied: Maximum must be bigger than or equal to the minimum");
            return false;
        }
    }
    return true;
}