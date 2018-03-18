# BTC Watcher

##### Website is live, check it out: [BTCWatcher](https://btcwatcher.herokuapp.com)

A service that watches the BTC/USD price, and sends an email notification once a certain threshold specificed by the user is met.

## Getting Started


If you want to host the service locally (local version allows you to specify the refresh rate), head to the [CLI branch](https://github.com/AbdullahKady/btc-watcher/tree/cli)

## Technologies: 

* Node JS: As the main language of the server, along with basic server modules
* SendGrid: Mailing service used to notify users (sent using nodemailer module)
* mLab (MongoDB): The database hosting service

