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


//new user
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





app.listen(9090, function(){
	console.log("Listening!");
});