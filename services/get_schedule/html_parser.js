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
    this.dateConst = Date.now();

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
        modelType = '',
        searchName = '',
        currentStr;

    if($){
        $('.sub').each(function(i, item){
            currentStr = entities.decode($(item).html());
            link = self.linkPref + $(item).attr('href');
            searchName = currentStr.replace(/ /g,'').toLocaleLowerCase();
            modelType = null;
   
            if(self.isGroup(currentStr)) modelType = 'Group';
            if(self.isTeacher(currentStr)) modelType = 'Teacher';
            
            if(modelType){
                results.push(new models[modelType]({
                    name: currentStr,
                    link: link,
                    searchName: transliterate(searchName)
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
                        dayId: Math.floor(i/2),
                        created: self.dateConst
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


var a = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z",
    "Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch",
    "з":"z","х":"h","ъ":"'","Ф":"F","Ы":"I","В":"V","А":"a","П":"P","Р":"R","О":"O","Л":"L","Д":"D",
    "Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh",
    "э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch",
    "с":"s","м":"m","и":"i","т":"t","ь":"'","б":"b","ю":"yu", 'і':'i', 'І':'I'};

function transliterate(word){
    return word.split('').map(function (char) {
        return a[char] || char;
    }).join("");
}


//Exports
module.exports = new Parser();