/**
 * Utilities Module for DestinyTrialsReport
 */

// Initialize DTR Modules
var settings = require('./settings.js'),
           Q = require('q'),
           request = require('request');

exports.formatAttachment = function (title, link, fields) {
  return { 
    "username": "Brother Vance [Bot]",
    "icon_url": "https://avatars.slack-edge.com/2016-03-04/24531630918_f9aaff1dc98d0c43d827_192.png",
    "attachments": [
      {
        "title": title,
        "title_link": link,
        "title_icon": "http://trials.report/favicon.ico",
        "color": "#d0d15a",
        "fields": fields
      }
    ]
  }
}

exports.formatFields = function (username, type, group, matches, losses, kd, membershipType) {
  var platform = membershipType == 2 ? 'ps' : 'xbox';
  var percent = +(100 * (matches - losses) / matches).toFixed(2);
  var title = username + " on DestinyTrialsReport";
  var link = "http://my.trials.report/" + platform + "/" + username;
  var wins = matches - losses;
  var fields = [
          {
            "title": type,
            "value": group,
            "short": true
          },
          {
            "title": "Record",
            "value": wins + " Wins - " + losses + " Losses",
            "short": true
          },
          {
            "title": "Win Percent",
            "value": percent + "%",
            "short": true
          },
          {
            "title": "K/D",
            "value": kd,
            "short": true
          }
        ];
  var fallback = type + ' ' + wins + " Wins - " + losses + " Losses";
  return exports.formatAttachment(title, link, fields, fallback);
}

exports.getUsername = function (pieces, channel, firstname) {
  // var gamertag = pieces.shift();
  var gamertag = pieces.join(' ').trim();

  //set gamertag as firstname, assuming first name is a gamertag
  if (!gamertag) {
    if (firstname) {
      gamertag = firstname;
    } else {
      return channel.send('No gamertag was given.');
    }
  }

  return gamertag;
}

exports.SearchDestinyPlayer = function(membershipType, displayName) {
  var deferred, endpoint;
  deferred = Q.defer();
  var url = 'https://proxy.destinytrialsreport.com/Platform/Destiny/SearchDestinyPlayer/' + membershipType + '/' + displayName + '/';
  request.get({
    url: url,
    timeout: 10000,
    json: true
  }, function (error, response, body) {
    var membershipId;
    if (body && body['Response'] && body['Response'][0] && body['Response'][0]['membershipId']) {
      membershipId = body['Response'][0]['membershipId'];
    }
    deferred.resolve(membershipId);
  });
  return deferred.promise;
};

exports.getPlayerId = function(channel, membershipType, displayName, command) {
  var deferred, networkName;
  deferred = Q.defer();
  if (membershipType) {
    networkName = membershipType == 1 ? 'xbox' : 'playstation';
    return exports.SearchDestinyPlayer(membershipType, displayName).then(function(results) {
      if (!results) {
        channel.send("Could not find guardian with name: " + displayName + " on " + networkName);
        deferred.reject();
        return;
      }
      deferred.resolve({
        platform: membershipType,
        membershipId: results
      });
      return deferred.promise;
    });
  } else {
    return Q.all([
      exports.SearchDestinyPlayer(1, displayName), 
      exports.SearchDestinyPlayer(2, displayName)
    ]).then(function(results) {
      if (results[0] && results[1]) {
        channel.send("Mutiple platforms found for: " + displayName + ". use `!" + command + ":xbox " + displayName + "` or `!" + command + ":ps " + displayName + "`");
        deferred.reject();
        return;
      } else if (results[0]) {
        deferred.resolve({
          platform: 1,
          membershipId: results[0]
        });
      } else if (results[1]) {
        deferred.resolve({
          platform: 2,
          membershipId: results[1]
        });
      } else {
        channel.send("Could not find guardian with name: " + displayName + " on either platform");
        deferred.reject();
        return;
      }
      return deferred.promise;
    });
  }
};

// Checks if a username is in the admin list
exports.isAdmin = function (username) {
  if (settings.admins.indexOf(username) > -1) {
    return true;
  } else {
    return false;
  }
}

exports.formatAttachment = function (title, link, fields, fallback) {
  return { 
    "username": "Brother Vance [Bot]",
    "icon_url": "https://avatars.slack-edge.com/2016-03-04/24531630918_f9aaff1dc98d0c43d827_192.png",
    "attachments": [
      {
        "fallback": fallback,
        "title": title,
        "title_link": link,
        "title_icon": "http://trials.report/favicon.ico",
        "color": "#d0d15a",
        "fields": fields
      }
    ]
  }
}

// Capitalizes the first letter of a string
exports.ucfirst = function (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

exports.unescapeMessage = function (message) {
  return message.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>');
}