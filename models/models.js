//Dependencies
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

//Schema for group model
var GroupSchema = new Schema({
    name: {
        type: String,
        unique: true,
        default: ''
    },
    link: {
        type: String, 
        default: ''
    },
    searchName: {
        type: String, 
        default: ''
    },
    teacher: {
        type: Boolean, 
        default: false
    },
    student: {
        type: Boolean, 
        default: true
    }
});

//Schema for teacher model
var TeacherSchema = new Schema({
    name: {
        type: String, 
        unique: true, 
        default: ''
    },
    link: {
        type: String, 
        default: ''
    },
    searchName: {
        type: String, 
        default: ''
    },
    teacher: {
        type: Boolean, 
        default: true
    },
    student: {
        type: Boolean, 
        default: false
    }
});


//Schema for lesson model
var LessonSchema = new Schema({
    number: {
        type: Number, 
        default: 0
    },
    auditory: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: ''
    },
    subject: {
        type: String,
        default: ''
    },
    teacherName: {
        type: String,
        default: ''
    },
    teacherId: {
        type: String,
        default: ''
    },
    groupName: {
        type: String,
        default: ''
    },
    groupId: {
        type: String,
        default: ''
    },
    date: {
        type: Object
    },
    time: {
        type: Object
    },
    created: {
        type: Number
    }
});

//Exports
module.exports = {
    Group: mongoose.model('groups', GroupSchema),
    Teacher: mongoose.model('teachers', TeacherSchema),
    Lesson: mongoose.model('lessons', LessonSchema)
};