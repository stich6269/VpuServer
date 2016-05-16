//Dependencies
var Entities =  require('html-entities').AllHtmlEntities;
var entities = new Entities();
var _ = require('underscore');
var deferred = require('deferred');
var moment = require('moment');
var models = require('../../models/models');

//Parser constructor
function  Parser() {
    this.linkPref = 'http://www.model.poltava.ua';
    this.groupNameMaxLen = 6;
    this.teacherNamePart = 3;

    this.ringSchedle = {
        0: {start: '8-00', end: '8-40'},
        1: {start: '8-55', end: '9-35'},
        2: {start: '9-50', end: '10-30'},
        3: {start: '10-50', end: '11-30'},
        4: {start: '11-45', end: '12-25'},
        5: {start: '12-35', end: '13-15'},
        6: {start: '14-00', end: '14-40'},
        7: {start: '15-00', end: '15-40'}
    }
}

//Create group collection
Parser.prototype.parseLinks = function($){
    var results = [],
        self = this,
        link = '',
        course = null,
        currentStr;

    if($){
        $('.sub').each(function(i, item){
            currentStr = entities.decode($(item).html());
            link = self.linkPref + $(item).attr('href');
            
            if(self.isGroup(currentStr)){
                course = parseInt(currentStr.split('-')[1].slice(0,1));
                results.push(new models.Group({
                    name: currentStr,
                    link: link,
                    course: course
                }));
            }

            if(self.isTeacher(currentStr)){
                results.push(new models.Teacher({
                    name: currentStr,
                    link: link
                }));
            }
        });
    }
    
    return results
};

Parser.prototype.isGroup = function (linkText) {
    return linkText.length < this.groupNameMaxLen && linkText.indexOf('-') != -1
};

Parser.prototype.isTeacher = function (linkText) {
    return linkText.split('.').length == this.teacherNamePart
};



//Create lessons collections
Parser.prototype.parseLessons = function($, groupName){
    var dayArr = [],
        resultArr = [],
        self = this,
        content = $('.contentpaneopen'),
        table = content.find('table'),
        tr = table.find('tr'),
        currentRows;

    $(tr).each(function(rowCounter, item){
        currentRows =  $(item).children();

        if(rowCounter == 0){
            currentRows.each(function(collCounter, col){
                if(collCounter){
                    var date = entities.decode($(col).html());
                    dayArr.push(self.formatDate(date));
                }
            });
        }

        if(rowCounter > 1){
            for (var i = 1; i <  currentRows.length; i = i+2) {
                var lessonsStr = entities.decode($(currentRows[i]).html()),
                    lessonsAttrs = self.parseLessonsAttr(lessonsStr),
                    lesson = {
                        auditory: entities.decode($(currentRows[i+1]).html()),
                        number: rowCounter - 2,
                        time: self.ringSchedle[rowCounter - 2],
                        groupName: groupName,
                        date: dayArr[Math.floor(i/2)],
                        dayId: Math.floor(i/2)
                    };

                _.extend(lesson, lessonsAttrs);
                resultArr.push(new models.Lesson(lesson));
            }
        }
    });

    return resultArr
};

//Create date 
Parser.prototype.formatDate = function (dateStr) {
   var dateArr = dateStr.split(',')[1].trim().split('.'),
       month = dateArr.splice(1,1),
       week = ['вс','пн','вт','ср','чт','пт','сб'],
       date;

    dateArr.unshift(month);
    date = +new Date(dateArr.join('-'));

    return {
        local: date,
        dayStr: week[moment(date).weekday()],
        dayIndex: moment(date).weekday()
    }
};

//Get lessons attributes
Parser.prototype.parseLessonsAttr = function(lessonsStr){
    var begin = lessonsStr.indexOf('('),
        subStr = lessonsStr.substr(begin),
        end = subStr.indexOf(')'),
        type = subStr.substr(1, end-1),
        teacher = lessonsStr.substr(lessonsStr.lastIndexOf('<br>')+4),
        subject = lessonsStr.substr(0, lessonsStr.indexOf('<br>'));

    return{
        type: type,
        teacherName: teacher,
        subject: subject
    }

};

//Exports
module.exports = new Parser();