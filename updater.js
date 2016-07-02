//Dependencies
var pageGrabber = require('./services/get_schedule/crawler');
var mongoose = require('mongoose');
var _ = require('underscore');
var async = require("async");
var models = require('./models/models');
var ping = require('ping');
var dbLink = process.env.MONGODB_URI || "mongodb://localhost/vpuSchedule";



async.waterfall([
    checkSourceSite,
    startParseLink,
    connectToDb,
    dropOldLinks,
    saveNewLinks
], function (err) {
    if (err) console.log('Updater Stopped: ' + err);
    if(!err) console.log('NewLinksSaved: OK');
    mongoose.connection.close(function () {
        process.exit(0);
    });
});


function checkSourceSite(callback){
    console.log('checkSourceSite ...');
    var host = 'www.model.poltava.ua';
    ping.sys.probe(host, function(isAlive){
        callback(null, isAlive)
    });
}
function startParseLink(hostIsAlive, callback) {
    console.log('SourceSite:', hostIsAlive);
    console.log('startParseLink ...');
    if(hostIsAlive){
        pageGrabber.getScheduleLinks(callback);
    }else{
        callback('Update Error: host site is not alive.', false)
    }
    
}
function connectToDb(links, callback) {
    console.log('LinksParsed: ', links.length);
    console.log('connectToDb: ....');
    mongoose.connect(dbLink);
    mongoose.connection.once('connected',function (err) {
        if(err) return callback(err);
        callback(null, links);
    });
}
function dropOldLinks(links, callback) {
    console.log('DbConnected: OK');
    console.log('dropOldLinks ...');
    if(!links.length) return callback('UpdateError: new link collection is empty.');
    
    var collections = ['teachers', 'groups'];
    async.eachSeries(collections, function (item, callback) {
        mongoose.connection.collections[item].drop(callback);
    }, function (err) {
        if(err) return callback(err);
        callback(null, links)
    });

}
function saveNewLinks(links, callback) {
    console.log('LinksDropped: OK');
    console.log('saveNewLinks ...');
    async.eachSeries(links, function (item, callback) {
        item.save(callback);
    }, callback);
}


mongoose.connection.on('err', function (err) {
    console.log('Err: ', err);
});
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose disconnected...');
});