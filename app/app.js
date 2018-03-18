//Loading env. variables
require('dotenv').config();
///////////////////////////////////////////////////////////////////// Requests& Mailing
const fs = require('fs');
const request = require('request');
const template = fs.readFileSync('./templates/mailTemplate.html', { encoding: 'utf-8' });
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const options = {
    auth: {
        api_key: process.env.SENDGRID_API
    }
}
const transporter = nodemailer.createTransport(sgTransport(options));
///////////////////////////////////////////////////////////////////// APPLICATION STARTS HERE

let users;
let MongoClient = require('mongodb').MongoClient;
let init = () => {
    MongoClient.connect(process.env.DB_HOST, function (err, db) {
        if (err) {
            console.log("DB CONNECTION ERROR : ");
            console.log(err);
            init(); //Retry DB connection in case of errors
            return;
        }
        var dbo = db.db("btc-watch");
        users = dbo.collection('users');
        console.log("Connected to DB successfully");
        const URL = 'http://preev.com/pulse/units:btc+usd/sources:bitstamp+kraken';
        const FREQUENCY = 30000;

        function fetchPrice() {
            request(URL, function (err, res, html) {
                if (err) {
                    console.log(err);
                    setTimeout(fetchPrice, FREQUENCY);
                    return;
                }


                var body = JSON.parse(res.body);
                var price = Number((Number(body.btc.usd.bitstamp.last) * 0.5 + Number(body.btc.usd.kraken.last) * 0.5).toFixed(2));
                console.log("Fetched: " + price);
                users.find( //Find matching prices from the database
                    {
                        $or: [{ min: { $gt: price } }
                            , { max: { $lt: price } }]
                    }
                    , { _id: 0 })
                    .toArray(function (err, result) {
                        if (err) throw err;
                        let counter = 0;
                        if (result.length == 0)
                            setTimeout(fetchPrice, FREQUENCY);

                        result.forEach(element => { //Iterate through every matching price
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
                                                setTimeout(fetchPrice, FREQUENCY);
                                            }
                                        })
                                    }
                                });
                            } else if (element.min && Number(price) < Number(element.min)) {
                                var mailOptions = {
                                    from: 'btc@watcher.com',
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
                                                setTimeout(fetchPrice, FREQUENCY);
                                            }
                                        })
                                    }
                                });
                            }
                        });
                    });
            });
        }
        fetchPrice();

    })
}
init();
