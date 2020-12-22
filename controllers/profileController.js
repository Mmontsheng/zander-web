const database = require('./database'); // zander Database controller
const lpdatabase = require('./lpdatabase'); // LuckPerms Database controller
const abdatabase = require('./abdatabase'); // AdvancedBan Database controller
const config = require('../config.json');
const HexColour = require('../HexColour.json');
const fetch = require('node-fetch');


//
// Profile
// GET
//
module.exports.profile_get = (req, res) => {
  // Query the database for the players data and online status.
  let sql = `select sessionend, sessionstart, uuid, username, joined, server,
  (IF(
  		(select gamesessions.id from gamesessions left join playerdata pd on pd.id = gamesessions.playerid
          where gamesessions.sessionstart <= NOW() and gamesessions.sessionend is NULL and pd.username=?
        ), 'online', 'offline'))  as 'status'
  from gamesessions, playerdata where playerid = playerdata.id
  and playerdata.username=? order by sessionstart desc limit 1;`

  database.query(sql, [req.params.username, req.params.username], async function (err, zanderplayerresults) {
    // If there is no player of that username, send them the Player Not Found screen.
    if (typeof (zanderplayerresults[0]) == "undefined") {
      res.render('errorviews/playernotfound', {
        "pagetitle": "Player Not Found"
      });
      return
    } else {
      if (zanderplayerresults[0].username.includes("*")) {
        bedrockuser = true;
      } else {
        bedrockuser = false;
      };
    }

    // Get the players Mixed TGM statistics to display.
    let response = await fetch(`${process.env.tgmapiurl}/mc/player/${req.params.username}?simple=true`);
    let tgmbodyres = await response.json();

    if (tgmbodyres.user.xp <= '0') {
      tgmresbool = false;
    } else {
      tgmresbool = true;
    };

    if (zanderplayerresults[0].username == req.session.username) {
      isProfileUser = true;
    } else {
      isProfileUser = true;
    };

    const killdeathratio = tgmbodyres.user.kills !== 0 && tgmbodyres.user.deaths !== 0 ? (tgmbodyres.user.kills / tgmbodyres.user.deaths).toFixed(2) : 'None';
    const winlossratio = (tgmbodyres.user.wins / tgmbodyres.user.losses).toFixed(2);

    // Formatting the initial join date and putting it into template.
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const initjoin = zanderplayerresults[0].joined;
    const initjoindate = `${initjoin.getDay()} ${months[initjoin.getMonth()]} ${initjoin.getFullYear()}`;

    if (err) {
      res.render('errorviews/500', {
        "pagetitle": "500: Internal Server Error"
      });
      return;
      throw err;
    } else {
      const reqplayeruuid = zanderplayerresults[0].uuid.replace(/-/g, '');

      // Query the database for the players data and online status.
      let sql = `select id, name, reason, operator, punishmentType from punishmenthistory where uuid=?;`

      abdatabase.query(sql, [reqplayeruuid], async function (err, punishmentresults) {
        if (err) {
          res.render('errorviews/500', {
            "pagetitle": "500: Internal Server Error"
          });
          return;
          throw err;
        } else {
          // Query the database for the players data and online status.
          let sql = `select permission from luckperms_user_permissions where uuid=?;`
          lpdatabase.query(sql, [zanderplayerresults[0].uuid], async function (err, playerrankresults) {
            if (err) {
              res.render('errorviews/500', {
                "pagetitle": "500: Internal Server Error"
              });
              return;
              throw err;
            } else {
              playerrankresults.forEach(function (data) {
                console.log(data.permission);
              });

              res.render('profile', {
                "pagetitle": `${zanderplayerresults[0].username}'s Profile`,
                zanderplayerobjdata: zanderplayerresults,
                punishmentobjdata: punishmentresults,
                playerrankresults: playerrankresults,
                HexColour: HexColour,
                tgmres: tgmbodyres,
                tgmresbool: tgmresbool,
                isProfileUser: isProfileUser,
                bedrockuser: bedrockuser,
                currentserver: capitalizeFirstLetter(zanderplayerresults[0].server),
                initjoindate: initjoindate,
                killdeathratio: killdeathratio,
                winlossratio: winlossratio
              });
            }
          });
        }
      });
    }
  });

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
};

// //
// // Logout
// // GET
// //
// module.exports.logout_get = (req, res) => {
//   req.flash('successmsg', 'You have been logged out.');
//   console.log(`[CONSOLE] [SESSION] ${req.session.username} has logged out.`);
//   req.session.destroy();
//   res.redirect('/');
// };

// //
// // Login
// // POST
// //
// module.exports.login_post = (req, res) => {
//   const { username, password } = req.body;

//   // Check if the player has logged into the Network.
//   let sql = `select * from webaccounts where playerid = (select id from playerdata where username=?) limit 1;
//   select * from playerdata where id = (select id from playerdata where username=?) limit 1; select * from webpermissions where id = (select id from playerdata where username=?) limit 1;`
//   database.query(sql, [`${username}`, `${username}`, `${username}`], async function (err, results) {
//     const hashedPassword = results[0][0].password;
//     const uuid = results[1][0].uuid;
//     const username = results[1][0].username;
//     const playerid = results[1][0].id;
//     const permissions = results[2][0];

//     bcrypt.compare(password, hashedPassword).then(function(result) {
//       if (result === true) {
//         lpdatabase.query(`SELECT uuid, (SELECT username FROM luckperms_players WHERE luckperms_players.uuid = luckperms_user_permissions.uuid) as username, permission FROM luckperms_user_permissions WHERE permission LIKE 'group.%' and (SELECT username FROM luckperms_players WHERE luckperms_players.uuid = luckperms_user_permissions.uuid)=?;`, [username], function (error, lpresults, fields) {
//           if (error) {
//             res.render('errorviews/500', {
//               "pagetitle": "500: Internal Server Error"
//             });
//             return;
//             throw error;
//           } else {
//             // const ranks = [];
//             // lpresults.forEach(function(data) {
//             //   const permission = data.permission;
//             //   let rankName = permission.replace('group.', '');
//             //   ranks.push(rankName);              
//             // });

//             req.session.username = username;
//             req.session.uuid = uuid;
//             req.session.playerid = playerid;
//             req.session.permissions = permissions;
//             // req.session.ranks = ranks;

//             console.log(`[CONSOLE] [SESSION] ${username} has logged in.`);
//             res.redirect('/');
//           }
//         });
//       } else {
//         res.render('session/login', {
//           "pagetitle": "Login"
//         });
//       }
//     });
//   });
// };

// //
// // Register
// // GET
// //
// module.exports.register_get = (req, res) => {
//   res.render('session/register', {
//     "pagetitle": "Register",
//     "success": null,
//     "error": false
//   });
// };

// //
// // Register
// // POST
// //
// module.exports.register_post = (req, res) => {
//   const { username, email, password, passwordconfirm } = req.body;

//   // Check if the player has logged into the Network.
//   let sql = `select * from playerdata where username = ? limit 1;
//   select * from webaccounts where playerid = (select id from playerdata where username = ?) limit 1;
//   select email from webaccounts where email=?;`
//   database.query (sql, [`${username}`, `${username}`, `${email}`], async function (err, results) {
//     if (!results[0]) {
//       // Check if the user has logged into the Network.
//       res.render('session/register', {
//         "pagetitle": "Register",
//         "success": null,
//         "error": true,
//         "errormsg": `You have not logged into the Network, please login and try again.`
//       });
//     } else if (results[2].length) {
//       // Check if email is already linked to another registered email.
//       res.render('session/register', {
//         "pagetitle": "Register",
//         "success": null,
//         "error": true,
//         "errormsg": "This email is already registered with another account."
//       });
//     } else if (password != passwordconfirm) {
//       // Check if the passwords match.
//       res.render('session/register', {
//         "pagetitle": "Register",
//         "success": null,
//         "error": true,
//         "errormsg": "The password you have entered does not match, please try again."
//       });
//     } else if (results[1].length) {
//         res.render('session/register', {
//           "pagetitle": "Register",
//           "success": null,
//           "error": true,
//           "errormsg": "You are already registered or have started registration."
//         });
//     } else {
//         // Hash the password
//         const salt = await bcrypt.genSalt();
//         hashpassword = await bcrypt.hash(password, salt);
//         // Generate a verifation token
//         const token = randomToken(32);

//         try {
//           // Start the registration linking process and put token into table.
//           database.query(`insert into webaccounts (playerid, email, password, registrationtoken) values ((select id from playerdata where username = ?), ?, ?, ?); insert into webpermissions (playerid) values ((select id from playerdata where username=?));`, [`${username}`, `${email}`, `${hashpassword}`, `${token}`, `${username}`], function (err, results) {
//             if (err) {
//               throw err;
//               res.render('errorviews/500', {
//                 "pagetitle": "500: Internal Server Error"
//               });
//               return;
//             } else {
//               // Registration email is sent to the user with their link code.
//               ejs.renderFile(path.join(__dirname, "../views/email/session/registerconfirmtoken.ejs"), {
//                 username: username,
//                 token: token,
//                 serverip: config.serverip,
//                 discordlink: config.discordlink,
//                 contactemail: config.contactemail,
//                 githubissuetrackerlink: config.githubissuetrackerlink,
//               }, function (err, data) {
//                 if (err) {
//                   console.log(err);
//                   res.render('errorviews/500', {
//                     "pagetitle": "500: Internal Server Error"
//                   });
//                   return;
//                 } else {
//                   var mainOptions = {
//                     from: process.env.serviceauthuser,
//                     to: email,
//                     subject: `Registration Confirmation`,
//                     html: data
//                   };

//                   transporter.sendMail(mainOptions, function (err, info) {
//                     if (err) {
//                       console.log(err);
//                       res.render('errorviews/500', {
//                         "pagetitle": "500: Internal Server Error"
//                       });
//                       return;
//                     } else {
//                       console.log('Message sent: ' + info.response);
//                       res.render('session/register', {
//                         "pagetitle": "Register",
//                         "success": true,
//                         "error": false,
//                         "successmsg": `An email is now heading your way with instructions of what to do next!`
//                       });
//                       transport.close();
//                       return;
//                     }
//                   });
//                 }
//               });
//             }
//           });
//         } catch {
//           res.render('session/register', {
//             "pagetitle": "Register",
//             // "success": true,
//             "error": true,
//             "errormsg": `An email is now heading your way with instructions of what to do next!`
//           });

//           res.render('session/register', {
//             "pagetitle": "Register",
//             "success": null,
//             "error": true,
//             "errormsg": `You have not logged into the Network, come and play by looking at our Server here: ${config.website}play`
//           });
//         }
//       };
//   });
// };