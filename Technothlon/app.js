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
		hint2: "bakjfbof"
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
						if(user[0].socketid<= 19) { 
							socket.join(user[0].socketid.toString());
						} else {
							socket.join((user[0].socketid-19).toString());
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
			} else {
				socket.broadcast.to((data.id - 19).toString()).emit("opponentSelection2", data);
			}
		});
		socket.on("order", function(data){
			io.sockets.emit("order", data);
		});
		socket.on("selection3", function(data){
			socket.broadcast.emit("selection3", data);
		});
		socket.on("pilenumber", function(data){
			socket.broadcast.emit("pilenumber", data);
		});
		socket.on("chat", function(data){
			io.sockets.emit("chat", data);
		});   
		socket.on("typing", function(data){
			socket.broadcast.emit("typing", data);
		});
		socket.on("chat1", function(data){
			io.sockets.emit("chat1", data);
		});   
		socket.on("typing1", function(data){
			socket.broadcast.emit("typing1", data);
		});
		socket.on("number", function(data){
			socket.broadcast.emit("number", data);
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

var levelNames = ['flash', 'square', 'nonogram2', 'poll','nonogram', 'light','invisible','alphabet','crack','people','digits','logic34', 'pi'];
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

app.get("/doors", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("doors.ejs", {user: user});
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

app.get("/building", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("25floor.ejs", {user: user});
});

app.get("/triangle", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("triangle.ejs", {user: user});
});

app.get("/pile", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("pile.ejs", {user: user});
});

app.get("/cards", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("cards.ejs", {user: user});
});

app.get("/detective", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("detective.ejs", {user: user});
});

app.get("/chatroom", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("chat.ejs", {user: user});
});

app.get("/chatroom1", function(req, res){
	res.render("chat1.ejs");
});

app.get("/oddgame", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("odd.ejs");
});

app.get("/half", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("half.ejs", {user: user});
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
		user.score += 5;
		user.hint1 = false;
		user.hint2 = false;
	} else {
		user.score -= 5;
	}
	user.save();
 	res.redirect("/level");
});

app.post("/logic34", function(req, res){
	var clickCount = req.body.counter;
	var user = req.user;
	var newScore = (1/(clickCount-23))*5;
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
		user.score += 5;
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
		user.score += 5;
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
		user.score += 5;
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
	if(answer.toLowerCase() == "pi") {
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

app.post("/nonogram1", function(req, res){
	var user = req.user;
	var answer = req.body.answer;
	if(answer == "1111011110110000001100001") {
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

app.post("/nonogram2", function(req, res){
	var user = req.user;
	var answer = req.body.answer;
	if(answer == "1111101111111100011111001000100100011100010100100111101011011111100111101100101110000001111001110111") {
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

app.post("/poll", function(req, res){
	var user = req.user;
	var answer = req.body.answer;
	if(answer == "122233123334122534111544555544") {
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

app.post("/pattern", function(req, res){
	var user = req.user;
	var answer = req.body.pattern;
	if(answer.toLowerCase() == "right") {
		user.currentLevel += 1;
		user.score += 5;
		user.hint1 = false;
		user.hint2 = false;
		user.save();
		res.redirect("/level");
	}
});

app.post("/flash", function(req, res){
	var user = req.user;
	var answer = req.body.answer;
	if(answer.toLowerCase() == "hard") {
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
			user.score += 5;
			user.hint1 = false;
			user.hint2 = false;
		} else {
			user.currentLevel += 1;
			user.score += 2.5;
			user.hint1 = false;
			user.hint2 = false;
		}
	} else {
		user.score -= 5;
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
		user.score += 5;
	} else {
		user.score -= 5;
	}
	user.save();
	res.redirect("/level");
});

app.post("/cards", function(req, res){
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

app.post("/detective", function(req, res){
	var user = req.user;
	var answer = req.body.answer;
	user.detectiveAnswer = answer;
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