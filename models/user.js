var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	username: String,
	password: String,
	currentLevel: Number,
	score: Number,
	hint1: Boolean,
	hint2: Boolean,
	socketid: Number,
	noofattempts: Number,
	newid: String,
}, {timestamps: true});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);