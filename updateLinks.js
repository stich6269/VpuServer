//Dependencies
var pageGrabber = require('./services/get_schedule/crawler');
var mongoose = require('mongoose');
var util = require("util");
var _ = require('underscore');
var async = require("async");
var models = require('./models/models');


//Setup and local variables
var dbLink = process.env.MONGODB_URI || "mongodb://localhost/vpuSchedule",
    debug = true;

//Auto run function
(function () {
    debug && console.log('Parser start...');

    //Open DB connections
    mongoose.connect(dbLink);

    // If the connection throws an error
    mongoose.connection.on('error',function (err) {
        debug && console.log('Mongoose error: ' + err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
        debug && console.log('Mongoose disconnected...');
    });

    //When connected to db
    mongoose.connection.once('connected', function () {
        debug && console.log('DB connected...');
        pageGrabber.getScheduleLinks();
    });

    //Get new lists
    pageGrabber.once('got-links', function (result) {
        debug && console.log('Links parsed...');
        dropCollections(['teachers', 'groups'], function () {
            debug && console.log('teachers and groups dropped...');
            saveCollection(result, closeDb);
        });
    });


    //Save collections to db
    function saveCollection(collection, cb){
        async.eachSeries(collection, function (item, callback) {
            item.save(callback);
        }, function () {
            debug && console.log('Saved ' + collection.length + ' items...');
            _.isFunction(cb) && cb();
        });
    }

    //Drop all collections from db
    function dropCollections(collections, cb) {
        async.eachSeries(collections, function (item, callback) {
            mongoose.connection.collections[item].drop(callback);
        }, cb);
    }

    //Close db connections
    function closeDb() {
        mongoose.connection.close(function () {
            process.exit(0);
        });
    }
})();