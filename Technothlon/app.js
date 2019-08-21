var express 				= require("express"),
	app 					= express(),
	bodyParser 				= require("body-parser"),
	mongoose				= require("mongoose"),
	passport 				= require("passport"),
	passportLocalMongoose 	= require("passport-local-mongoose"),
	LocalStrategy 			= require("passport-local"),
	socket					= require("socket.io"),
	util = require("util"),
    fs = require('fs'),
    os = require('os'),
    url = require('url');

// Models For User
var User = require("./models/user");


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
var server = app.listen(3000, function(){
	console.log("The Musics Already Started!");
});
var io = socket(server);
var clients =[];
    io.sockets.on('connection', function (socket) {
        socket.on('storeClientInfo', function (data) {
            var clientInfo = new Object();
            clientInfo.customId     = data.customId;
            clientInfo.clientId     = socket.id;
			clients.push(clientInfo);
			console.log(clients);
		});
		socket.on("selection", function(data){
			socket.broadcast.emit("opponentSelection", data);
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

// ==================
// ROUTES FOR LEVELS
// ==================
app.get("/", function(req, res){
	res.sendFile(__dirname + "/public/home.html");
});

// app.get("/building", isLoggedIn, function(req, res){
// 	res.sendFile(__dirname + "/public/building.html");
// });

app.get("/level", isLoggedIn, function(req, res){
	// get id of user who made the request
	var user = req.user;
	var level = user.currentLevel;
	// find the level in which the user is present
	if(level == 1) {
		res.sendFile(__dirname + "/public/light.html");
	} else if(level == 2) {
		res.sendFile(__dirname + "/public/invisible.html");
	} else if(level == 3) {
		res.sendFile(__dirname + "/public/alphabet.html");
	} else if(level == 4) {
		res.sendFile(__dirname + "/public/crack.html");
	} else if(level == 5){
		res.sendFile(__dirname + "/public/people.html");
	} else if(level == 6){
		res.sendFile(__dirname + "/public/digits.html");
	} else if(level == 7) {
		res.sendFile(__dirname + "/public/logic34.html");
	} else {
		console.log(user);
		res.send("GAME Over");
	}
});

app.get("/building", isLoggedIn, function(req, res){
	var user = req.user;
	res.render("25floor.ejs", {user: user});
});

// ============
// THE POST ROUTES
// ============
app.post("/invisible", function(req, res){
	var answer = req.body.answer;
	var currentUser = req.user;
	if(answer.toLowerCase() == "german"){
		// find user with his id
		// increase level of user by 1 update his score
		newLevel = currentUser.currentLevel + 1;
		newScore = currentUser.score + 5;
		// redirect to /level
		User.findById(currentUser.id, function(err, user){
			if(err){
				console.log(err);
			} else {
				user.currentLevel = newLevel;
				user.score = newScore;
				user.save();
				res.redirect("/level");
			}
		});
	} else {
		// deduct his score and redirect to the same page
		newScore = currentUser.score - 5;
		User.findById(currentUser.id, function(err, user){
			if(err){
				console.log(err);
			} else {
				user.score = newScore;
				user.save();
				res.redirect("/level");
			}
		});
	}
});

app.post("/light", function(req, res){
	var divId = req.body.divId;
	var currentUser = req.user;
	if(divId == "div3"){
		// find user with his id
		// increase level of user by 1 update his score
		newLevel = currentUser.currentLevel + 1;
		newScore = currentUser.score + 5;
		User.findById(currentUser.id, function(err, user){
			if(err){
				console.log(err);
			} else {
				user.currentLevel = newLevel;
				user.score = newScore;
				user.save();
				res.redirect("/level");
			}
		});
	} else {
		// deduct his score and redirect to the same page
		newScore = currentUser.score - 5;
		User.findById(currentUser.id, function(err, user){
			if(err){
				console.log(err);
			} else {
				user.score = newScore;
				user.save();
				res.redirect("/level");
			}
		});
	}
});

app.post("/logic34", function(req, res){
	var clickCount = req.body.counter;
	// calculate and update the score
	var user = req.user;
	var newScore = (1/(clickCount-23))*5;
	// increase the level of user by 1
	user.currentLevel += 1;
	user.score += newScore;
	user.save();
	// redirect to /level
	res.redirect("/level");
});

app.post("/alphabet", function(req, res){
	var answer = req.body.answer;
	var user = req.user;
	if(answer.toLowerCase() == "ha"){
		// find user id and update score, level and redirect to / level
		user.currentLevel += 1;
		user.score += 5;
		user.save();
 		res.redirect("/level");
	} else {
		// find user id deduct his score and reload the page
		user.score -= 5;
		user.save();
		res.redirect("/level");
	}
});

app.post("/crack", function(req, res){
	var x = req.body.x;
	var y = req.body.y;
	var z = req.body.z;
	var user = req.user;
	if(x == 0 && y== 4 && z == 2) {
		user.currentLevel += 1;
		user.score += 5;
		user.save();
		res.redirect("/level");
	} else {
		user.score -= 5;
		user.save();
		res.redirect("/level");
	}
});

app.post("/people", function(req, res){
	var user = req.user;
	var chosenPerson = req.body.chosenPerson;
	if(chosenPerson == "person13") {
		user.currentLevel += 1;
		user.score += 5;
		user.save();
		res.redirect("/level");
	} else {
		user.score -= 5;
		user.save();
		res.redirect("/level");
	}
});

app.post("/digits", function(req, res){
	var user = req.user;
	var form = req.body.form;
	if(form == "correct") {
		user.currentLevel += 1;
		user.score += 5;
		user.save();
		res.redirect("/level");
	} else {
		user.score -= 5;
		user.save();
		res.redirect("/level");
	}
});

// ==================
// ROUTES FOR AUTH
// ==================
app.get("/register", function(req, res){
	res.sendFile(__dirname + "/public/register.html");
});

app.post("/register", function(req, res){
	var newUser = new User({username: req.body.username, hint1: false, hint2: false, currentLevel: 1, score: 0});
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
	res.send("This Page Does Not Exist You Fool!");
});