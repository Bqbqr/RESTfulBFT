var express = require('express');
var app = express();

var bodyParser = require("body-parser");

var mysql = require('mysql');

var config = require('./config.js');

var http = require('https');

var xml = require('xml-js-converter');

var cors = require('cors');
app.use(cors());
app.options('*', cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// database
var connection = mysql.createConnection({
	host: config.db.location,
	user: config.db.username,
	password: config.db.password,
	database: config.db.database
});

function getConnection(){
	// connection.connect();
}

connection.connect();

function noCache(res){
	res.set("Cache-Control", "no-cache, no_store, must-revalidate");
	res.set("Pragma", "no-cache");
	res.set("Expires", "0");
}

function sendErr (err, res) {
	res.json({
		error:{
			code: 100,
			message : "Server error: " + err.message
		}
	});
}


// root
app.get("/bftool", function (req, res, err) {
	var host = req.get("host");
	res.status(200);
	res.redirect("http://google.fr");
	res.end();
});


//Show users
app.get("/bftool/users", function (req, res, err) {

	getConnection();

	var sql = "SELECT nom, entretien, menage, admin FROM personne;";
	connection.query(sql, function(err,results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}
		var response={
			users: []
			};

		for(var i = 0; i< results.length; i++){
			response.users.push({
				name: results[i]['nom'],
				entretien: results[i]['entretien'],
				menage: results[i]['menage'],
				admin: results[i]['admin']
			});
		}
		res.json(response);
		res.end();
	});

});


app.post("/bftool/users/new", function (req, res, err) {
	var user_nom = req.body.nom;
	var user_entretien = req.body.entretien;
	var user_menage = req.body.menage;
	console.log(user_nom);
	if(!user_nom || user_nom == ""){
		res.json({
			error:{
				code: 404,
				message: "User ID (login) must be set"+user_nom
			}
		});
		return;
	}
	getConnection();

	var sql = "SELECT `nom` FROM `personne` WHERE `nom`=" + connection.escape(user_nom);
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length > 0){
			res.json({
				error:{
					code: 403,
					message: "User already Exists"
				}
			});
			return;
		}

	});

	sql = "INSERT INTO `personne` (nom, entretien, menage) VALUES ("+connection.escape(user_nom)+", "+connection.escape(user_entretien)+ ", " + connection.escape(user_menage)+")";
	console.log(sql);
	connection.query(sql, function (err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		res.json({
			success:{
				user: user_nom
			}
		});

		res.end();
	});
});

//Show rentals
app.get("/bftool/MH", function (req, res, err) {

	getConnection();

	var sql = "SELECT nom, gaz, etat, reparation, urgent FROM location;";
	connection.query(sql, function(err,results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}
		var response={
			locations: []
			};

		for(var i = 0; i< results.length; i++){
			response.locations.push({
				nom: results[i]['nom'],
				gaz: results[i]['gaz'],
				etat: results[i]['etat'],
				reparation: results[i]['reparation'],
				urgent: results[i]['urgent']
			});
		}
		res.json(response);
		res.end();
	});

});


//New MH
app.post("/bftool/MH/new", function (req, res, err) {
	var loc_nom = req.body.nom;
	console.log(loc_nom);
	if(!loc_nom || loc_nom == ""){
		res.json({
			error:{
				code: 404,
				message: "MH Name must be set"+loc_nom
			}
		});
		return;
	}
	getConnection();

	var sql = "SELECT `nom` FROM `location` WHERE `nom`=" + connection.escape(loc_nom);
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length > 0){
			res.json({
				error:{
					code: 403,
					message: "User already Exists"
				}
			});
			return;
		}

	});

	sql = "INSERT INTO `location` (nom) VALUES ("+connection.escape(loc_nom)+")";
	console.log(sql);
	connection.query(sql, function (err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		res.json({
			success:{
				location: loc_nom
			}
		});

		res.end();
	});
});

//Show inter
app.get("/bftool/intervention", function (req, res, err) {

	getConnection();

	var sql = "SELECT user, location, time, onit FROM intervention;";
	connection.query(sql, function(err,results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}
		var response={
			intervention: []
			};

		for(var i = 0; i< results.length; i++){
			response.intervention.push({
				time: results[i]['time'],
				personne: results[i]['user'],
				location: results[i]['location'],
				onit: results[i]['onit']
			});
		}
		res.json(response);
		res.end();
	});

});

//New Inter
app.post("/bftool/intervention/new", function (req, res, err) {
	var user = req.body.personne;
	var location = req.body.loc;

	console.log(user);
	if(!user || user == ""){
		res.json({
			error:{
				code: 404,
				message: "La personne et la location doivent être remplis. Reçu:"+user+location
			}
		});
		return;
	}
	getConnection();

	//Check if personn exist or not. If yes then ok we can add it to the DB
	var sql = "SELECT `nom` FROM `personne` WHERE `nom`=" + connection.escape(user);
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length == 0){
			res.json({
				error:{
					code: 403,
					message: "Person does not Exist"
				}
			});
			return;
		}

	});

	//Check if the rental is already in the DB
	var sql = "SELECT `nom` FROM `location` WHERE `nom`=" + connection.escape(location);
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length == 0){
			res.json({
				error:{
					code: 403,
					message: "Rental does not Exist"
				}
			});
			return;
		}

	});
	//Par défaut, lors d'une insertion, on considère l'intervenant comme étant "sur" l'intervention. Qu'il s'en occupe.
	sql = "INSERT INTO `intervention` (user,location) VALUES ("+connection.escape(user)+", "+connection.escape(location)+")";
	console.log(sql);
	connection.query(sql, function (err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		res.json({
			success:{
				personne: user,
				location: location
			}
		});

		res.end();
	});
});

//Show intervention of a user.
app.get("/bftool/intervention/:user/all", function (req, res, err) {
	var user = req.params.user;

	getConnection();

	var sql = "SELECT location, time FROM intervention WHERE user="+connection.escape(user)+" ORDER BY time;";
	connection.query(sql, function(err,results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}
		var response={
			intervention: []
			};

		for(var i = 0; i< results.length; i++){
			response.intervention.push({
				time: results[i]['time'],
				nom: results[i]['user'],
				location: results[i]['location']				
			});
		}
		res.json(response);
		res.end();
	});

});


//Change intervention statut
app.post("/bftool/intervention/change", function (req, res, err) {
	var user = req.body.user;
	var location = req.body.loc;
	var bool = req.body.bool;

	console.log(user);
	if(!user || user == ""){
		res.json({
			error:{
				code: 404,
				message: "La personne et la location doivent être remplis. Reçu:"+user+location
			}
		});
		return;
	}

	getConnection();

	//Check if personn exist or not. If yes then ok we can add it to the DB
	var sql = "SELECT `nom` FROM `personne` WHERE `nom`=" + connection.escape(user);
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length == 0){
			res.json({
				error:{
					code: 403,
					message: "Person does not Exist"
				}
			});
			return;
		}

	});

	//Check if the rental is already in the DB
	sql = "SELECT `nom` FROM `location` WHERE `nom`=" + connection.escape(location);
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length == 0){
			res.json({
				error:{
					code: 403,
					message: "Rental does not Exist"
				}
			});
			return;
		}

	});

	sql = "UPDATE `intervention` SET onit="+connection.escape(bool)+" WHERE user="+connection.escape(user)+" AND location="+connection.escape(location)+" ORDER BY id DESC LIMIT 1";
	console.log(sql);
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}
		res.json({
			success:{
				personne: user,
				location: location,
				onit: bool
			}
		});
	});

});





app.listen(9090, function(){
	console.log("\nListening!\n");
});