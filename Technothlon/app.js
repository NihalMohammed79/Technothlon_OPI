var express 				= require("express"),
	app 					= express(),
	bodyParser 				= require("body-parser"),
	mongoose				= require("mongoose"),
	passport 				= require("passport"), // Middleware
	passportLocalMongoose 	= require("passport-local-mongoose"),
	LocalStrategy 			= require("passport-local"),
	socket					= require("socket.io"),
	util 					= require("util"),
    fs 						= require('fs'),
    os						= require('os'),
    url 					= require('url');

// Models For User
var User = require("./models/user");
var appRoot = require('app-root-path');
const morgan = require('morgan');
const winston = require('./winston/config');
app.use(morgan('combined', { stream: winston.stream }));
winston.info('You have successfully started working with winston and morgan');


mongoose.connect("mongodb://localhost:27017/techno", {useNewUrlParser : true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));


// Passport Configuration
app.use(require("express-session")({
	secret: "Rusty Wins Again!",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// =================
// SETUP FOR SOCKET
// =================

var server = app.listen(4000, function(){

	console.log("The Musics Already Started!");
});
var io = socket(server);
var hints = [
	{
		// Start
		hint1: "",
		hint2: ""
	},
	{ 
		// Hints for Bridges
		hint1: "",
		hint2: ""
	},
	{
		// Hints for Crack
		hint1:"",
		hint2:""
	},
	{
		// Hints for Nonogram
		hint1:"",
		hint2:""

	},
	{
		// Hints For People In Circle
		hint1:"Try observing the pattern for small numbers",
		hint2:""

	},
	{
		// Hints In Prison Doors
		hint1:"",
		hint2:""

	},
	{
		// Hints In Stay In Line
		hint1:"You can find the answer by observing objects in front of you",
		hint2:"Observe the keyboard carefully"

	},
	{
		// Hints For What Comes Next(HA)
		hint1:"Observe the pattern of the Alphabet Positions",
		hint2:"AF=16 Find the others"

	},
	{
		// Hints for poll
		hint1:"Notice that to win in a state you need a majority of 4 black dots and you need to win atleast 3 states to win the election.There are exactly 12 black dots meaning you need to make two states with all (6) white states",
		hint2:"One of the regions will be {(1,1)(2,1)(3,1)(4,1)(4,2)(4,3)}[Taking bottom left as (1,1)]"

	},
	{
		// Hints for Light Level
		hint1:"Think in terms of co-ordinates.And remember, its all a game of odds and evens",
		hint2:""

	},
	{
		// Hints for Logic 35
		hint1:"",
		hint2:""

	},
	{
		// Hints for Nonogram 2
		hint1:"",
		hint2:""

	},
	{
		// Flash
		hint1:"Notice that the sequence of flashes is made of short and long pulses which may be a code",
		hint2:"The answer is hard"

	},
	{
		// Logic 34
		hint1:"",
		hint2:""

	},
	{
		// Square
		hint1:"",
		hint2:""

	},
	{
		// Invisible
		hint1:"",
		hint2:""

	},
	{
		// Pattern
		hint1:"",
		hint2:""
	},
	{
		// Pi
		hint1:"",
		hint2:""
	},
	{
		// Mondrian
		hint1:"",
		hint2:"Count the widths of blue rectangles"

	}
];
var clients =[];
    io.sockets.on('connection', function (socket) {
        socket.on('storeClientInfo', function (data) {
            var clientInfo = new Object();
            clientInfo.customId     = data.customId;
            clientInfo.clientId     = socket.id;
			clients.push(clientInfo);
			for(var i = 0; i < clients.length; i++) {
				User.find({socketid: clients[i].customId}, function(err, user){
					if(err) {
						console.log(err);
					} else {
						if(data.level == "building") {
							if(user[0].socketid<= 19) { 
								socket.join(user[0].socketid.toString());
							} else {
								socket.join((user[0].socketid-19).toString());
							}
						}
						if(data.level == "triangle") {
							if(user[0].socketid<= 19) { 
								socket.join(user[0].socketid.toString());
							} else if(user[0].socketid == 20){
								socket.join((19).toString());
							} else {
								socket.join((user[0].socketid - 20).toString());
							}
						}
						if(data.level == "mugame") {
							if(user[0].socketid<= 19) { 
								socket.join(user[0].socketid.toString());
							} else if(user[0].socketid == 20){
								socket.join((18).toString());
							} else if(user[0].socketid == 21){
								socket.join((19).toString());
							} else {
								socket.join((user[0].socketid - 21).toString());
							}
						}
						if(data.level == "pile") {
							if(user[0].socketid<= 19) { 
								socket.join(user[0].socketid.toString());
							} else if(user[0].socketid == 20){
								socket.join((17).toString());
							} else if(user[0].socketid == 21){
								socket.join((18).toString());
							} else if(user[0].socketid == 22){
								socket.join((19).toString());
							} else {
								socket.join((user[0].socketid - 22).toString());
							}
						}
						if(data.level == "half") {
							if(user[0].socketid<= 19) { 
								socket.join(user[0].socketid.toString());
							} else if(user[0].socketid == 20){
								socket.join((16).toString());
							} else if(user[0].socketid == 21){
								socket.join((17).toString());
							} else if(user[0].socketid == 22){
								socket.join((18).toString());
							} else if(user[0].socketid == 23){
								socket.join((19).toString());
							} else {
								socket.join((user[0].socketid - 23).toString());
							}
						}
					}
				});
			}
		});
		socket.on('hint', function(data) {
			User.find({socketid: data.id}, function(err, user){
				if(err) {
					console.log(err);
				} else {
					var level = user[0].currentLevel;
					if(user[0].hint1 == false) {
						if(hints[level-1].hint1 != "") {
							var hint = hints[level-1].hint1;
							io.to(data.toid).emit('hintres', {hint : hint});
							user[0].hint1 = true;
							user[0].score -= 5;
						} else {
							io.to(data.toid).emit('hintres', {hint : "No Hints!"});
						}
					} else if(user[0].hint1 == true && user[0].hint2 == false) {
						if(hints[level-1].hint2 != "") {
							var hint = hints[level-1].hint2;
							io.to(data.toid).emit('hintres', {hint : hint});
							user[0].hint2 = true;
							user[0].score -= 5;
						} else {
							io.to(data.toid).emit('hintres', {hint : "No Hints!"});
						}
					} else {
						io.to(data.toid).emit('hintres', {hint : "No Hints!"});
					}
					user[0].save();
				}
			});
		});
		socket.on("selection1", function(data){
			if(data.id < 20) {
				socket.broadcast.to(data.id.toString()).emit("opponentSelection1", data);
			} else {
				socket.broadcast.to((data.id - 19).toString()).emit("opponentSelection1", data);
			}
		});
		socket.on("selection2", function(data){
			if(data.id < 20) {
				socket.broadcast.to(data.id.toString()).emit("opponentSelection2", data);
			} else if(data.id == 20){
				socket.broadcast.to((19).toString()).emit("opponentSelection2", data);
			} else {
				socket.broadcast.to((data.id - 20).toString()).emit("opponentSelection2", data);
			}
		});
		socket.on("selection3", function(data){
			if(data.id < 20) {
				socket.broadcast.to((data.id).toString()).emit("selection3", data);
			} else if(data.id == 20){
				socket.broadcast.to((18).toString()).emit("selection3", data);
			} else if(data.id == 21){
				socket.broadcast.to((19).toString()).emit("selection3", data);
			} else {
				socket.broadcast.to((data.id - 21).toString()).emit("selection3", data);
			}
		});
		socket.on("pilenumber", function(data){
			if(data.id < 20) {
				socket.broadcast.to(data.id.toString()).emit("pilenumber", data);
			} else if(data.id == 20){
				socket.broadcast.to((17).toString()).emit("pilenumber", data);
			} else if(data.id == 21){
				socket.broadcast.to((18).toString()).emit("pilenumber", data);
			} else if(data.id == 22){
				socket.broadcast.to((19).toString()).emit("pilenumber", data);
			} else {
				socket.broadcast.to((data.id - 22).toString()).emit("pilenumber", data);
			}
		});
		socket.on("number", function(data){
			if(data.id < 20) {
				socket.broadcast.to(data.id.toString()).emit("number1", data);
			} else if(data.id == 20){
				socket.broadcast.to((16).toString()).emit("number1", data);
			} else if(data.id == 21){
				socket.broadcast.to((17).toString()).emit("number1", data);
			} else if(data.id == 22){
				socket.broadcast.to((18).toString()).emit("number1", data);
			} else if(data.id == 23){
				socket.broadcast.to((19).toString()).emit("number1", data);
			} else {
				socket.broadcast.to((data.id - 23).toString()).emit("number1", data);
			}
		});
        socket.on('disconnect', function (data) {
            for( var i=0, len=clients.length; i<len; ++i ){
                var c = clients[i];
                if(c.clientId == socket.id){
                    clients.splice(i,1);
                    break;
                }
			}
        });
    });

var levelNames = ['start','bridges', 'crack', 'nonogram', 'people', 'doors', 'abc', 'alphabet', 'poll', 'light', '35', 'nonogram2', 'flash', 'logic34', 'square', 'invisible','pattern', 'md', 'pi'];
var skipdeds = [5, 10, 15, 10, 10, 10, 10, 7, 10, 10, 15, 10, 10, 0, 20, 10, 0];
var noofusers = 1;
// ==================
// ROUTES FOR LEVELS
// ==================
app.get("/", function(req, res){
	res.sendFile(__dirname + "/public/home.html");
});

app.get("/level", isLoggedIn, function(req, res){
	var user = req.user;
	var level = user.currentLevel;
	user.noofattempts++;
	console.log(user.noofattempts);
	if(user.noofattempts > 0) {
		user.score -= 5;
	}
	user.save();
	if(level <= levelNames.length)
		res.render(levelNames[level-1] + ".ejs", {user: user});
	else {
		console.log(user);
		res.send("GAME OVER");
	}
});

app.get("/profile", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("profile.ejs", {user: user});
});

app.post("/skip", isLoggedIn, function(req, res){
	var user = req.user;
	var skip = req.body.skip;
	var level = user.currentLevel;
	if(skip == "skip"){
		user.score -= skipdeds[level - 1];
		user.currentLevel += 1;
	}
	user.save();
	res.redirect("/level");
});

app.get("/building1", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("25floor1.ejs", {user: user});
});

app.get("/pebbles", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("pebble.ejs", {user: user});
});

app.get("/building2", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("25floor2.ejs", {user: user});
});

app.get("/triangle1", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("triangle1.ejs", {user: user});
});

app.get("/triangle2", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("triangle2.ejs", {user: user});
});

app.get("/mugame1",isLoggedIn, function(req, res){
	var user = req.user;
	res.render('mugame1.ejs', {user:user});
});

app.get("/mugame2",isLoggedIn, function(req, res){
	var user = req.user;
	res.render('mugame2.ejs', {user:user});
});

app.get("/pile1", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("pile1.ejs", {user: user});
});

app.get("/pile2", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("pile2.ejs", {user: user});
});

app.get("/half1", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("half1.ejs", {user: user});
});

app.get("/half2", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("half2.ejs", {user: user});
});

app.get('/getPass',function(req,res) {
	User.find({}).exec(function(err,users) {
		if(err) throw err;
		res.render('getpass.ejs',{"users" : users});
	});
});

// ============
// THE POST ROUTES
// ============
app.post("/invisible", function(req, res){
	var answer = req.body.answer;
	var user = req.user;
	if(answer.toLowerCase() == "german"){
		user.currentLevel += 1;
		user.score += 5;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 5;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/light", function(req, res){
	var divId = req.body.divId;
	var user = req.user;
	if(divId == "div3"){
		user.currentLevel += 1;
		user.score += 20;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 10;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/logic34", function(req, res){
	var clickCount = req.body.counter;
	var user = req.user;
	var newScore = 625/clickCount;
	user.currentLevel += 1;
	user.score += newScore;
	user.hint1 = false;
	user.hint2 = false;
	user.noofattempts = -1;
	user.save();
	res.redirect("/level");
});

app.post("/alphabet", function(req, res){
	var answer = req.body.answer;
	var user = req.user;
	if(answer.toLowerCase() == "ha"){
		user.currentLevel += 1;
		user.score += 15;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 5;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/crack", function(req, res){
	var x = req.body.x;
	var y = req.body.y;
	var z = req.body.z;
	var user = req.user;
	if(x == 0 && y== 4 && z == 2) {
		user.currentLevel += 1;
		user.score += 10;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 5;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/people", function(req, res){
	var user = req.user;
	var chosenPerson = req.body.chosenPerson;
	if(chosenPerson == "person13") {
		user.currentLevel += 1;
		user.score += 15;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 5;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/digits", function(req, res){
	var user = req.user;
	var form = req.body.form;
	if(form == "correct") {
		user.currentLevel += 1;
		user.score += 5;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 5;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/pi", function(req, res){
	var user = req.user;
	var answer = req.body.answer;
	if(answer.toLowerCase() == "3.14159265") {
		user.currentLevel += 1;
		user.score += 50;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 1;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/nonogram1", function(req, res){
	var user = req.user;
	var answer = req.body.answer;
	if(answer == "1111011110110000001100001") {
		user.currentLevel += 1;
		user.score += 10;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 6;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/nonogram2", function(req, res){
	var user = req.user;
	var answer = req.body.answer;
	if(answer == "1111101111111100011111001000100100011100010100100111101011011111100111101100101110000001111001110111") {
		user.currentLevel += 1;
		user.score += 25;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 10;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/poll", function(req, res){
	var user = req.user;
	var answer = req.body.answer;
	if(answer == "122233123334122534111544555544") {
		user.currentLevel += 1;
		user.score += 15;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 7;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/square", function(req, res){
	var user = req.user;
	var c = req.body.c;
	var x = req.body.x;
	if(c == 15) {
		user.currentLevel += 1;
		user.score += 30;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else if(c == 14) {
		user.currentLevel += 1;
		user.score += 20;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else if(c==13) {
		user.currentLevel += 1;
		user.score += 10;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 10;
	}
	user.save();
	res.redirect("/level");
});

app.post("/flash", function(req, res){
	var user = req.user;
	var answer = req.body.answer;
	if(answer.toLowerCase() == "hard") {
		user.currentLevel += 1;
		user.score += 25;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 2;
	}
	user.save();
	res.redirect("/level");
});

app.post("/doors", function(req, res){
	var user = req.user;
	var first = req.body.first;
	var second = req.body.second;
	var third = req.body.third;
	var fourth = req.body.fourth;
	var fifth = req.body.fifth;
	var door = req.body.door;
	if(first.toLowerCase() == "green" && second.toLowerCase() == "red" && third.toLowerCase() == "white" && fourth.toLowerCase() == "blue" && fifth.toLowerCase() == "yellow") {
		if(door.toLowerCase() == "blue") {
			user.currentLevel += 1;
			user.score += 10;
			user.hint1 = false;
			user.hint2 = false;
			user.noofattempts = -1;
		}
	} else {
		user.score -= 5;
	}
	user.save();
	res.redirect("/level");
});

app.post("/bridges", function(req, res){
	var user = req.user;
	var result = req.body.user;
	if(result == "I won") {
		user.score += 5;
		user.hint1 = false;
		user.hint2 = false;
		user.currentLevel += 1;
		user.noofattempts = -1;
	} else {
		user.currentLevel += 1;
		user.score -= 5;
		user.hint1 = false;
		user.hint2 = false;
	}
	user.save();
	res.redirect("/level");
});

app.post("/md", function(req, res){
	var user = req.user;
	var score = req.body.user;
	if(score == 6) {
		user.score += 35;
		user.noofattempts = -1;
	} else if(score == 7) {
		user.score += 30;
		user.noofattempts = -1;
	} else if(score == 8) {
		user.score += 25;
		user.noofattempts = -1;
	} else if(score == 9) {
		user.score += 20;
		user.noofattempts = -1;
	} else if(score == 10) {
		user.score += 15;
		user.noofattempts = -1;
	} else if(score == 11) {
		user.score += 10;
		user.noofattempts = -1;
	} else if(score == 12) {
		user.score += 5;
		user.noofattempts = -1;
	} else {
		user.score += 0;
		user.noofattempts = -1;
	}
	user.hint1 = false;
	user.hint2 = false;
	user.currentLevel += 1;
	user.save();
	res.redirect("/level");
});

app.post("/35", function(req, res){
	var user = req.user;
	var result = req.body.result;
	if(result == "0") {
		user.hint1 = false;
		user.hint2 = false;
		user.currentLevel += 1;
		user.score += 5;
		user.noofattempts = -1;
	} else {
		user.score -= 5;
	}
	user.save();
	res.redirect("/level");
});

app.post("/start", function(req, res){
	var user = req.user;
	var result = req.body.result;
	if(result == "clicked") {
		user.currentLevel += 1;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
		user.score += 5;
		user.save();
		res.redirect("/level");
	}
});

app.post("/pattern", function(req, res){
	var user = req.user;
	var result = req.body.result;
	if(result == "I won") {
		user.currentLevel += 1;
		user.score += 30;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	}
	user.save();
	res.redirect("/level");
});

app.post("/abc", function(req, res){
	var user = req.user;
	var id = req.body.id;
	if(id == "8") {
		user.currentLevel += 1;
		user.score += 15;
		user.hint1 = false;
		user.hint2 = false;
		user.noofattempts = -1;
	} else {
		user.score -= 7;
	}
	user.save();
	res.redirect("/level");
});

// ============================
// POST ROUTES FOR MULTIPLAYER
// ============================
app.post("/building", function(req, res){
	var user = req.user;
	var result = req.body.result;
	if(result == "I won") {
		user.score += 20;
	}
	user.save();
	res.redirect("/level");
});

app.post("/pile", function(req, res){
	var user = req.user;
	var result = req.body.result;
	if(result == "I won") {
		user.score += 20;
	}
	user.save();
	res.redirect("/level");
});

app.post("/half", function(req, res){
	var user = req.user;
	var result = req.body.result;
	if(result == "I won") {
		user.score += 20;
	}
	user.save();
	res.redirect("/level");
});

app.post("/triangle", function(req, res){
	var user = req.user;
	var result = req.body.result;
	if(result == "I won") {
		user.score += 20;
	}
	user.save();
	res.redirect("/level");
});

// ==================
// ROUTES FOR AUTH
// ==================
app.get("/register", function(req, res){
	res.sendFile(__dirname + "/public/register.html");
});

app.post("/register", function(req, res){
	if(noofusers % 3 == 0) {
		var newId = "Brandon";
	} else if(noofusers % 3 == 1) {
		var newId = "Makeda";
	} else {
		var newId = "Campbell";
	}
	var newUser = new User({username: req.body.username, noofattempts: -1, hint1: false, hint2: false, currentLevel: 1, score: 0, attempts:0, socketid: noofusers, newid: newId});
	noofusers++; 
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			return res.sendFile(__dirname + "/public/register.html");
		}
		passport.authenticate("local")(req, res, function(){
			res.redirect("/");
		});
	});
});

app.get("/login", function(req, res){
	res.sendFile(__dirname + "/public/login.html");	
});

app.post("/login", passport.authenticate("local", {
	successRedirect: "/level",
	failureRedirect: "/login"
}), function(req, res){
	
});

app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/");
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

// ==================
// Route For * And Listener
// ==================
app.get("*", function(req, res){
	res.send("This Page Does Not Exist!");
});