//Dependencies
var models = require('./models/models');
var mongoose = require('mongoose');
var http = require('http');
var url = require('url');
var _ = require('underscore');

//Setup and local variables
var dbLink = process.env.MONGODB_URI || "mongodb://localhost/vpuSchedule",
    header = 'application/json; charset=utf-8';

if(mongoose.connection.readyState == 1){
    startServer();
}else{
    mongoose.connect(dbLink);
    mongoose.connection.once('open', startServer);
}

function startServer() {
    http.createServer(function(req, res){
        var parsedUrl = url.parse(req.url, true),
            link = parsedUrl.pathname,
            data = parsedUrl.query;

        data.method = req.method;
        res.setHeader('Content-Type', header);
        
        switch (link){
            case '/get_list':
                models.Group.find({}, {_id:1, student:1, searchName:1, name: 1}, function (err, groups) {
                    if(err) return sendError('DB error: Group table error');
                    models.Teacher.find({}, {_id:1, teacher:1, searchName:1, name: 1}, function (err, teachers) {
                        res.statusCode = 200;
                        setTimeout(function () {
                            res.end(JSON.stringify(teachers.concat(groups)));
                        }, 2000)

                    });
                });
                break;
            case '/get_schedule':
                models.Teacher.findById(data.id, function (err, result) {
                    if(err) return sendError('DB error: User find Error ');
                    var key = result ? 'teacherId' : 'groupId',
                        query = {};

                    query[key] = data.id;
                    models.Lesson.find(query, function (err, result) {
                        res.statusCode = 200;
                        setTimeout(function(){
                            res.end(JSON.stringify(result));
                        },1500)
                    });
                });
                break;
            default:
                res.statusCode = 404;
                res.end('Service not defined.');
        }


        function sendError (text) {
            res.statusCode = 500;
            res.end(text || 'Server Error')
        }

    }).listen(process.env.PORT || 3000);
}






