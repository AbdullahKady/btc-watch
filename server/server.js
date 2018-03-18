require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => { console.log("Server started. Listening on port " + app.get('port')); });
app.use(express.static(__dirname + '/public')); //Serving assets
app.use(morgan('dev'));
////////////////////////////////////////////////////////////// ROUTERS

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
        const users = dbo.collection('users');
        console.log("Connected to DB successfully");

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
            res.send('success');
        })




    });
}
init();


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
    if (body.min && !Number(body.min)) {
        return false;
        console.log('Request denied: Limits must be numbers');
    }
    if (body.max && !Number(body.max)) {
        return false;
        console.log('Request denied: Limits must be numbers');
    }

    if (body.min && body.max) {
        if (Number(body.max) < Number(body.min)) {
            console.log("Request denied: Maximum must be bigger than or equal to the minimum");
            return false;
        }
    }
    return true;
}
