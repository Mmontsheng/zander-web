const database = require('./database'); // zander Database controller
const lpdatabase = require('./lpdatabase'); // LuckPerms Database controller
const transporter = require('./mail');
const config = require('../config.json');
const ejs = require('ejs');
const path = require('path');
const randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
const bcrypt = require('bcrypt');

//
// Login
// GET
//
module.exports.login_get = (req, res) => {
  res.render('session/login', {
    "pagetitle": "Login"
  });
};

//
// Login
// POST
//
module.exports.login_post = (req, res) => {
  const { username, password } = req.body;

  // Check if the player has logged into the Network.
  let sql = `select * from webaccounts where playerid = (select id from playerdata where username=?) limit 1;
  select * from playerdata where id = (select id from playerdata where username=?) limit 1;`
  database.query(sql, [`${username}`, `${username}`], async function (err, results) {
    const hashedPassword = results[0][0].password;
    const uuid = results[1][0].uuid;
    const username = results[1][0].username;
    const playerid = results[1][0].id;

    bcrypt.compare(password, hashedPassword).then(function(result) {
      if (result === true) {
        lpdatabase.query(`SELECT uuid, (SELECT username FROM luckperms_players WHERE luckperms_players.uuid = luckperms_user_permissions.uuid) as username, permission FROM luckperms_user_permissions WHERE permission LIKE 'group.%';`, function (error, lpresults, fields) {
          if (error) {
            res.render('errorviews/500', {
              "pagetitle": "500: Internal Server Error"
            });
            return;
            throw error;
          } else {
            const ranks = [];
            lpresults.forEach(function(data) {
              ranks.push(data.permission);              
            });

            req.session.username = username;
            req.session.uuid = uuid;
            req.session.playerid = playerid;
            req.session.ranks = ranks;

            console.log(`[CONSOLE] [ADMIN] ${username} has logged in.`);
            res.redirect('/');
          }
        });
      } else {
        res.render('session/login', {
          "pagetitle": "Login"
        });
      }
    });
  });
};

//
// Register
// GET
//
module.exports.register_get = (req, res) => {
  res.render('session/register', {
    "pagetitle": "Register",
    "success": null,
    "error": false
  });
};

//
// Register
// POST
//
module.exports.register_post = (req, res) => {
  const { username, email, password, passwordconfirm } = req.body;

  // Check if the player has logged into the Network.
  let sql = `select * from playerdata where username = ? limit 1;
  select * from webaccounts where playerid = (select id from playerdata where username = ?) limit 1;
  select email from webaccounts where email=?`
  database.query (sql, [`${username}`, `${username}`, `${email}`], async function (err, results) {
    if (!results[0]) {
      // Check if the user has logged into the Network.
      res.render('session/register', {
        "pagetitle": "Register",
        "success": null,
        "error": true,
        "errormsg": `You have not logged into the Network, please login and try again.`
      });
    } else if (results[2].length) {
      // Check if email is already linked to another registered email.
      res.render('session/register', {
        "pagetitle": "Register",
        "success": null,
        "error": true,
        "errormsg": "This email is already registered with another account."
      });
    } else if (password != passwordconfirm) {
      // Check if the passwords match.
      res.render('session/register', {
        "pagetitle": "Register",
        "success": null,
        "error": true,
        "errormsg": "The password you have entered does not match, please try again."
      });
    } else if (results[1].length) {
        res.render('session/register', {
          "pagetitle": "Register",
          "success": null,
          "error": true,
          "errormsg": "You are already registered or have started registration."
        });
    } else {
        // Hash the password
        const salt = await bcrypt.genSalt();
        hashpassword = await bcrypt.hash(password, salt);
        // Generate a verifation token
        const token = randomToken(32);

        try {
          // Start the registration linking process and put token into table.
          database.query(`insert into webaccounts (playerid, email, password, registrationtoken) values ((select id from playerdata where username = ?), ?, ?, ?);`, [`${username}`, `${email}`, `${hashpassword}`, `${token}`], function (err, results) {
            if (err) {
              throw err;
              res.render('errorviews/500', {
                "pagetitle": "500: Internal Server Error"
              });
              return;
            } else {
              // Registration email is sent to the user with their link code.
              ejs.renderFile(path.join(__dirname, "../views/email/session/registerconfirmtoken.ejs"), {
                username: username,
                token: token,
                serverip: config.serverip,
                discordlink: config.discordlink,
                contactemail: config.contactemail,
                githubissuetrackerlink: config.githubissuetrackerlink,
              }, function (err, data) {
                if (err) {
                  console.log(err);
                  res.render('errorviews/500', {
                    "pagetitle": "500: Internal Server Error"
                  });
                  return;
                } else {
                  var mainOptions = {
                    from: process.env.serviceauthuser,
                    to: email,
                    subject: `Registration Confirmation`,
                    html: data
                  };

                  transporter.sendMail(mainOptions, function (err, info) {
                    if (err) {
                      console.log(err);
                      res.render('errorviews/500', {
                        "pagetitle": "500: Internal Server Error"
                      });
                      return;
                    } else {
                      console.log('Message sent: ' + info.response);
                      res.render('session/register', {
                        "pagetitle": "Register",
                        "success": true,
                        "error": false,
                        "successmsg": `An email is now heading your way with instructions of what to do next!`
                      });
                      transport.close();
                      return;
                    }
                  });
                }
              });
            }
          });
        } catch {
          res.render('session/register', {
            "pagetitle": "Register",
            // "success": true,
            "error": true,
            "errormsg": `An email is now heading your way with instructions of what to do next!`
          });

          res.render('session/register', {
            "pagetitle": "Register",
            "success": null,
            "error": true,
            "errormsg": `You have not logged into the Network, come and play by looking at our Server here: ${config.website}play`
          });
        }
      };
  });
};

//
// Logout
// POST
//
module.exports.logout_post = (req, res) => {
  res.redirect('/');
  req.session.destroy();
  console.log('Someone has logged out.');
  return;  
};