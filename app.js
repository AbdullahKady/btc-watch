require('dotenv').config();

//Email template HTML
const fs = require('fs');
const template = fs.readFileSync('./templates/mailTemplate.html', { encoding: 'utf-8' });

const request = require('request'); //HTTP requests
const prompt = require('prompt'); //Terminal User input

//Mailing service
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

//SendGrid API
const options = {
    auth: {
        api_key: process.env.SENDGRID_API
    }
}

const transporter = nodemailer.createTransport(sgTransport(options));


console.log('Hi, please enter the following info, leaving min/max empty will work on one value only');
console.log(`For the mode, enter "k" to fetch the price according to Kraken, else it will be fetched according to Bitstamp's rate`);

prompt.start();

prompt.get(['MIN', 'MAX', 'mode', 'email'], function (err, result) {
    if (result.mode === 'k')
        url = 'http://preev.com/pulse/units:btc+usd/sources:kraken';
    else
        url = 'http://preev.com/pulse/units:btc+usd/sources:bitstamp';

    const MIN = result.MIN;
    const MAX = result.MAX;
    const MODE = result.mode === 'k' ? 'Kraken' : 'Bitstamp';
    const URL = url;
    const REC_EMAIL = result.email;

    if (MIN === "" && MAX === "") {
        console.log("Minimum and maximum cannot be empty at the same time");
        process.exit();
    }

    if (MAX && MIN)
        if (Number(MIN) > Number(MAX)) {
            console.log("Minimum cannot be greater than the maximum (DUH!)");
            process.exit();
        }

    var mailOptions = {
        from: 'btc@update.com',
        to: REC_EMAIL
    };


    function Request() {
        request(URL, function (err, res, html) {
            if (err) {
                console.log(error);
            }
            if (!err) {
                var body = JSON.parse(res.body);
                var price;
                if (MODE === 'Bitstamp')
                    price = (body.btc.usd.bitstamp.last);
                else
                    price = (body.btc.usd.kraken.last);
                if (MAX && Number(price) > Number(MAX)) {
                    mailOptions.subject = 'Bitcoin price just passed your maximum!';
                    mailOptions.html = template.replace("[MODE]", MODE).replace("[MAX_MIN]", 'passed the maximum').replace("[TARGET_PRICE]", MAX).replace("[CURRENT_PRICE]", price);
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent (MAX): ' + price);
                            console.log('Exiting application now');
                            process.exit();
                        }
                    });
                } else if (MIN && Number(price) < Number(MIN)) {
                    mailOptions.subject = 'Bitcoin price just dropped below minimum!';
                    mailOptions.html = template.replace("[MODE]", MODE).replace("[MAX_MIN]", 'dropped below the').replace("[TARGET_PRICE]", MIN).replace("[CURRENT_PRICE]", price);
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent (MIN): ' + price);
                            console.log('Exiting application now');
                            process.exit();

                        }
                    });
                } else {
                    console.log("The fetched price didn't meet any limits : " + price);
                }
                setTimeout(Request, 3000);
            }
        });

    }
    Request();
});