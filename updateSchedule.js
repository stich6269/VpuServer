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
        models.Group.find({}, function (err, result) {
            debug && console.log('Start update schedule...');
            pageGrabber.getLessons(result);
        });
    });
    
    //Get new lists
    pageGrabber.once('got-lessons', function (result) {
        debug && console.log('Start lessons parsing...');
        dropCollections(['lessons'], function () {
            debug && console.log('lessons dropped...');
            setPointers(result, function (lessons) {
                saveCollection(lessons, closeDb);
            })
        });
    });
    

    //Set pointers to group and teachers
    function setPointers(collection, cb) {
        var groupCollection,
            teacherCollections;

        models.Group.find({}, function (err, groups) {
            groupCollection = _.map(groups, function (group) {
                group.name = group.name.toLowerCase();
                return group
            });

            models.Teacher.find({}, function (err, teachers) {
                teacherCollections = _.map(teachers, function (teacher) {
                    teacher.name = teacher.name.split(' ')[0].toLowerCase();
                    return teacher
                });
                
                _.each(collection, function (lesson) {
                    var groupName = lesson.groupName.toLowerCase(),
                        teacherName = lesson.teacherName.split(' ')[0].toLowerCase(),
                        currentTeacher = _.findWhere(teachers, {name: teacherName}),
                        currentGroup =  _.findWhere(groupCollection, {name: groupName});

                    lesson.groupId = currentGroup ? currentGroup._id : '';
                    lesson.teacherId = currentTeacher ? currentTeacher._id : '';
                });

                _.isFunction(cb) && cb(collection);
            });
        });

       
    }

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