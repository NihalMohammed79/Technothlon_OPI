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
		hint1: "You are right!",
		hint2: "This level is bad"
	},
	{
		hint1: "This level can be skipped",
		hint2: "Im telling You To Skip this level!"
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
								socket.join((user[0].socketid - 22).toString());
							}
						}
						if(data.level == "odd") {
							console.log(data, socket.id);
							if(user[0].socketid %3 == 1) { 
								socket.join(user[0].socketid.toString());
							} else if(user[0].socketid %3 == 2){
								socket.join((user[0].socketid - 1).toString());
							} else {
								socket.join((user[0].socketid - 2).toString());
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
						var hint = hints[level-1].hint1;
						io.to(data.toid).emit('hintres', {hint : hint});
						user[0].hint1 = true;
						user[0].score -= 5;
					} else if(user[0].hint1 == true && user[0].hint2 == false) {
						var hint = hints[level-1].hint2;
						io.to(data.toid).emit('hintres', {hint : hint});
						user[0].hint2 = true;
						user[0].score -= 5;
					} else {
						io.to(data.toid).emit('hintres', {hint : "No More Hints!"});
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
				socket.broadcast.to((data.id - 22).toString()).emit("selection3", data);
			}
		});
		socket.on("number", function(data){
			if(data.id < 20) {
				socket.broadcast.to(data.id.toString()).emit("number", data);
			} else if(data.id == 20){
				socket.broadcast.to((15).toString()).emit("number", data);
			} else if(data.id == 21){
				socket.broadcast.to((16).toString()).emit("number", data);
			} else if(data.id == 22){
				socket.broadcast.to((17).toString()).emit("number", data);
			} else if(data.id == 23){
				socket.broadcast.to((18).toString()).emit("number", data);
			} else {
				socket.broadcast.to((data.id - 23).toString()).emit("number", data);
			}
		});
		socket.on("order", function(data){
			console.log(data);
			io.to((data.id-2).toString()).emit("order1", data);
		})
		socket.on("oddnumber", function(data){
			if(data.id %3 == 1) {
				socket.broadcast.to(data.id.toString()).emit("oddnumber", data);
			} else if(data.id %3 == 2){
				socket.broadcast.to((data.id - 1).toString()).emit("oddnumber", data);
			} else {
				socket.broadcast.to((data.id - 2).toString()).emit("oddnumber", data);
			}
		})
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

var levelNames = ['35', 'md', 'bridges', 'doors', 'square', 'nonogram2', 'poll','nonogram', 'light','invisible','alphabet','crack','people','digits','logic34', 'pi'];
var skipdeds = [10, 10, 20, 13, 15, 20, 15, 15, 16, 17, 12, 10, 12];
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

app.post("/skip", function(req, res){
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

app.get("/building2", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("25floor2.ejs", {user: user});
});

app.get("/triangle", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("triangle.ejs", {user: user});
});

app.get("/mugame",isLoggedIn, function(req, res){
	var user = req.user;
	res.render('mugame.ejs', {user:user});
});

app.get("/pile", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("pile.ejs", {user: user});
});

app.get("/half1", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("half1.ejs", {user: user});
});

app.get("/half2", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("half2.ejs", {user: user});
});

app.get("/odd1", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("odd1.ejs", {user: user});
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
	} else {
		user.score -= 10;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/logic34", function(req, res){
	var clickCount = req.body.counter;
	var user = req.user;
	var newScore = 625/clicks;
	user.currentLevel += 1;
	user.score += newScore;
	user.hint1 = false;
	user.hint2 = false;
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
	} else {
		user.score -= 7;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/square", function(req, res){
	var user = req.user;
	var c = req.body.c;
	if(c == 15) {
		user.currentLevel += 1;
		user.score += 5;
		user.hint1 = false;
		user.hint2 = false;
	} else if(c == 14) {
		user.currentLevel += 1;
		user.score += 2.5;
		user.hint1 = false;
		user.hint2 = false;
	} else {
		user.score -= 5;
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
	user.hint1 = false;
	user.hint2 = false;
	user.currentLevel += 1;
	user.save();
	res.redirect("/level");
});

app.post("/35", function(req, res){
	var user = req.user;
	var result = req.body.result;
	user.hint1 = false;
	user.hint2 = false;
	user.currentLevel += 1;
	user.score += 5;
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
		user.score += 5;
	} else {
		user.score -= 5;
	}
	user.save();
	res.redirect("/level");
});

app.post("/pile", function(req, res){
	var user = req.user;
	var result = req.body.result;
	if(result == "I won") {
		user.score += 5;
	} else {
		user.score -= 5;
	}
	user.save();
	res.redirect("/level");
});

app.post("/half", function(req, res){
	var user = req.user;
	var result = req.body.result;
	if(result == "I won") {
		user.score += 5;
	} else {
		user.score -= 5;
	}
	user.save();
	res.redirect("/level");
});

app.post("/triangle", function(req, res){
	var user = req.user;
	var result = req.body.result;
	if(result == "I won") {
		user.score += 5;
	} else {
		user.score -= 5;
	}
	user.save();
	res.redirect("/level");
});

app.post("/mugame" , function(req, res){
	var user = req.user;
	var result = req.body.result;
	user.score += Number(result);
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
	var newUser = new User({username: req.body.username, hint1: false, hint2: false, currentLevel: 1, score: 0, attempts:0, socketid: noofusers, newid: newId});
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