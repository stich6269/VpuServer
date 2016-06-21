//Dependencies
var Crawler = require("crawler");
var http = require('http');
var util = require("util");
var _ = require('underscore');
var EventEmitter = require("events").EventEmitter;
var parser = require('./html_parser');
var fs = require('fs');


//Parse groups constructor with EE
util.inherits(PageGrabber, EventEmitter);
function PageGrabber() {
    this.startPageLink = 'http://webcache.googleusercontent.com/search?q=cache:http://www.model.poltava.ua/&gws_rd=cr&ei=L-spV8y-NYSb6ATrs47oBw';
    EventEmitter.call(this);
}

PageGrabber.prototype.getScheduleLinks = function () {
    var self =  this,
        getStartPage = new Crawler({
            maxConnections : 1,
            callback : function (error, result, $) {
                if(!error){
                    self.emit("got-links", parser.parseLinks($));
                }else{
                    console.log(error)
                }
            }
        });
    
    getStartPage.queue(self.startPageLink);
};

PageGrabber.prototype.getLessons = function (collection) {
    var linkArr = _.pluck(collection, 'link'),
        lessonsArr = [],
        self = this,
        counter = 0;

    
    var getGroups = new Crawler({
        maxConnections : 1,
        callback : function (error, result, $) {
            var groupName = collection[counter].name,
                groupsLessons = parser.parseLessons($, groupName);

            console.log(groupName + ' size: ' + Buffer.byteLength(JSON.stringify(groupsLessons), 'utf8'));
            lessonsArr = lessonsArr.concat(groupsLessons);
            counter++;
        },
        onDrain: function() {
            console.log('done: ', lessonsArr.length);
            console.log('size: ',  Buffer.byteLength(JSON.stringify(lessonsArr), 'utf8'));
            self.emit("got-lessons", lessonsArr);
        }
    });


    console.log('Start get schedule...');
    getGroups.queue(linkArr);
};



//Exports
module.exports = new PageGrabber();


