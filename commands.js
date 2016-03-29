/**
 * Commands Module for DestinyTrialsReport
 */

// Initialize Node Modules
var execSync = require('child_process').execSync,
    moment = require('moment'),
    request = require('request');

// Initialize DTR Modules
var settings = require('./settings.js'),
    util = require('./util.js');



exports.currentMap = function (slack, channel) {
  request.get({
      url: settings.apiPath + 'currentMap',
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      if (result && result[0]) {
        var mapName = result[0]['activityName'];
        var pgcrImage = result[0]['pgcrImage'];
        var response = {
          "channel": '#general', 
          "username": "Brother Vance [Bot]",
          "icon_url": "https://avatars.slack-edge.com/2016-03-04/24531630918_f9aaff1dc98d0c43d827_192.png",
          "text": "This weeks map is...",
          "attachments": [
            {
              "fallback": mapName,
              "text": mapName,
              "image_url": "http://www.bungie.net" + pgcrImage
            }
          ]
        };
        channel.postMessage(response);
      }
  });
}

exports.archnemesis = function (slack, channel, pieces, firstname) {
  
  var gamertag = util.getUsername(pieces, channel, firstname);
  
  request.get({
      url: settings.apiPath + 'archnemesis/' + gamertag,
      timeout: 10000,
      json: true
    }, function (error, response, result) {
        var response;
        var fields = [];
        var platform;
        var link;
        var title = gamertag + '\'s top ' + result.length + ' archnemeses. ';

        if (result[0] && result[0]['membershipType']) {
          platform = result[0]['membershipType'] == 2 ? 'ps' : 'xbox';
          link = "http://opponents.trials.report/" + platform + "/" + gamertag;
        }
          
        if (result.length === 0) {
          fields.push({
            "title": "Error",
            "value": gamertag + ' has no archnemesis.'
          });
        } else if (result.length === 1) {
          fields.push({
            "title": result[0]['displayName'],
            "value": result[0]['count'] + ' matches.'
          });
        } else if (result.length > 1) {
          for (var i=0; i<result.length; i++) {
            fields.push({
              "title": result[i]['displayName'],
              "value": result[i]['count'] + ' matches.'
            });
          }
        }
        var fallback = fields[0]['title'] + ' ' + fields[0]['title'];
        response = util.formatAttachment(title, link, fields, fallback);
        channel.postMessage(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
    });
}

exports.bestkd = function (slack, channel, pieces, firstname) {

  var gamertag = util.getUsername(pieces, channel, firstname);

  request.get({
      url: settings.apiPath + 'bestkd/' + gamertag,
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      if (result && result[0]) {
        var title = 'Click for the Post Game Carnage Report on Bungie.net';
        var link = 'https://www.bungie.net/en/Legend/PGCR?instanceId=' + result[0]['instanceId'] + '&characterId=' + result[0]['characterId'];
        var image_url = "http://www.bungie.net" + result[0]['pgcrImage'];
        var fields = [
          {
            "title": 'Best KD',
            "value": result[0]['kd'],
            "short": true
          },
          {
            "title": 'Date',
            "value": moment.utc(result[0]['date']).format('YYYY-MM-DD HH:mm:ss'),
            "short": true
          }
        ];
        var fallback = 'Best KD: ' + result[0]['kd'];
        response = util.formatAttachment(title, link, fields, fallback);
        channel.postMessage(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      } else {
        var response = "Record not found for " + gamertag;
        channel.send(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      }
  });
}


exports.commands = function (slack, channel, pieces) {
  var max_week;
  var commands = [];

  commands.push('*This bot was made by the devs of DestinyTrialsReport and uses their database for all stats.*');

  request.get({
      url: settings.apiPath + 'currentMap',
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      if (result[0]) {
        max_week = result[0]['week'];
        commands.push('`!currentmap`: returns the most recent trials map.');
        commands.push('`!archnemesis gamertag`: returns top 5 enemies played against more than once.');
        commands.push('`!bestkd gamertag`: returns best recorded Trials KD in year 2.');
        commands.push('`!worstkd gamertag`: returns worst recorded Trials KD in year 2.');
        commands.push('`!flawless gamertag`: returns flawless count from Trials Report.');

        commands.push('\n*The following commands all return matches Won, Lost, KD, and Win %*');
        commands.push('`!thisweek gamertag`: for the current week in Trials.');
        commands.push('`!thismap gamertag`: for the current map in Trials.');
        commands.push('`!lastweek gamertag`: for the previous week in Trials.');
        commands.push('`!week 1-' + max_week + ' gamertag`: for the specified week in year two Trials.');
        commands.push('`!year2 gamertag`: for all of year 2 in Trials.');
        commands.push('`!year1 gamertag`: for all of year 1 in Trials.');
        commands.push('`!crimsondoubles gamertag`: for the the Crimson Days event.');

        commands.push('\n*The following commands are not stat related*');
        commands.push('`!dtr gamertag`: returns a link to DestinyTrialsReport.');
        commands.push('`!ggg gamertag`: returns a link to Guardian.gg for gamertag.');
        commands.push('`!pgcr instanceId`: returns a link Bungie\'s post game carnage report.');
        commands.push('`!platform apiPath`: acts as a proxy for Bungie API, just include everything after `/Platform/Destiny/`.');

        commands.push('_For any questions email destinytrialsreport@gmail.com_');

        var response = commands.join('\n');
        channel.send(response);
      }
  });
}

// Creates a link to DTR when given a platform and gamertag
exports.dtr = function (slack, channel, pieces, platform) {
  var gamertag = pieces.shift();
  return util.getPlayerId(channel, platform, gamertag, 'dtr').then(function(results) {
    var platform = results['platform'] == 2 ? 'ps' : 'xbox';
    var response = 'https://trials.report/' + platform + '/' + gamertag;
    channel.send(response);
    return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
  });
}

exports.errorMsg = function (slack, channel, msg) {
  channel.send(msg);
  return console.log("@" + slack.self.name + " responded with \"" + msg + "\"");
}

exports.flawless = function (slack, channel, pieces, platform, firstname) {

  var gamertag = util.getUsername(pieces, channel, firstname);

  return util.getPlayerId(channel, platform, gamertag, 'flawless').then(function(results) {
    var membershipId = results['membershipId'];
    request.get({
      url: 'http://api.destinytrialsreport.com/lighthouseCount/' + membershipId,
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      var data = body[membershipId];
      var year1 = 0, year2 = 0;
      if (data && data['years'] && data['years']['1']) {
        year1 = data['years']['1']['count'];
      }
      if (data && data['years'] && data['years']['2']) {
        year2 = data['years']['2']['count'];
      }

      var title = gamertag + " on DestinyTrialsReport";
      var link = "http://my.trials.report/" + platform + "/" + gamertag;
      var fields = [
        {
          "title": 'Year 1',
          "value": year1
        },
        {
          "title": 'Year 2',
          "value": year2
        }
      ];

      var fallback = 'Year 1: ' + year1 + ' Year 2: ' + year2;
      response = util.formatAttachment(title, link, fields, fallback);
      channel.postMessage(response);
      return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
    });
  });
}

exports.ggg = function (slack, channel, pieces) {
  //won't work for xbox tags with spaces
  // var gamertag = pieces.shift();
  var gamertag = pieces.join('%20');
  var response = 'https://guardian.gg/en/search/' + gamertag;
  channel.send(response);
  return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
}

exports.pgcr = function (slack, channel, pieces) {
  var instanceId = pieces.shift();
  if (instanceId) {
    var response = 'https://www.bungie.net/en/Legend/PGCR?instanceId=' + instanceId;
    channel.send(response);
    return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
  }
}

exports.platform = function (slack, channel, pieces) {
  var parts = pieces.shift().split('/');
  var path = '';
  for (var i=parts.length-1; i>-1; i--) {
    if (parts[i] === '') continue;
    if (parts[i].toLowerCase() === 'destiny') break;
    if (path !== '') path = '/' + path;
    path = parts[i] + path;
  }
  
  if (path) {
    var url = 'https://proxy.destinytrialsreport.com/Platform/Destiny/' + path + '/';
    request.get({
      url: url,
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      var response = '```' + JSON.stringify(body, undefined, 2) + '```';
      var data = {
        attachments: [{
          title: 'Bungie Platform API Results',
          text: response,
          fallback: 'Bungie Platform API Results',
          mrkdwn_in: ['text']
        }]
      };
      channel.postMessage(data);
      return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
    });
  }
}

// Shuts down the bot
exports.quit = function (slack, channel, username) {
  if (!util.isAdmin(username.substr(1))) {
    var response = 'Only admins are authorized to use the say command.';
    channel.send(response);
    return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
  }
  
  var stdout = execSync('systemctl stop dtr-slackbot');
  return console.log('Bot is quitting.');
}

// Restarts the bot
exports.restart = function (slack, channel, username) {
  if (!util.isAdmin(username.substr(1))) {
    var response = 'Only admins are authorized to use the say command.';
    channel.send(response);
    return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
  }
  
  var stdout = execSync('systemctl restart dtr-slackbot');
  return console.log('Bot is restarting.');
}

exports.say = function (slack, channel, pieces, username) {
  if (!util.isAdmin(username.substr(1))) {
    var response = 'Only admins are authorized to use the say command.';
    channel.send(response);
    return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
  }
  
  var response = pieces.join(' ');
  channel.send(response);
  return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
}

exports.sayto = function (slack, channel, pieces, username, isAdmin) {
  if (!isAdmin) { //('UNKNOWN_USER').indexOf(username)
    var response = 'Only admins are authorized to use the sayto command.';
    channel.send(response);
    return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
  }
  
  var channelName = pieces.shift();
  channel = slack.getChannelGroupOrDMByName(channelName);
  if (channel) {
    var response = pieces.join(' ');
    channel.send(response);
    return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
  }
}

exports.shrugbomb = function (slack, channel, pieces, username) {
  for (var i=0; i<10; i++) {
    response = "\¯\\_(ツ)_/¯";
    channel.send(response);
  }
}

exports.status = function (slack, channel, username) {
  var response = 'I am up and running ' + username + '!';
  channel.send(response);
  return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
}

exports.thisMap = function (slack, channel, pieces, firstname) {

  var gamertag = util.getUsername(pieces, channel, firstname);

  request.get({
      url: settings.apiPath + 'slack/thisMap/' + gamertag,
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      if (result && parseInt(result[0]['matches']) > 0) {
        var res = result[0];
        var response = util.formatFields(res['displayName'], 'Map', res['map'], res['matches'], res['losses'], res['kd'], res['membershipType']);
        channel.postMessage(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      } else {
        var response = gamertag + ' has played no matches nor killed on this weeks map.';
        channel.send(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      }
    });
}

exports.thisWeek = function (slack, channel, pieces, firstname) {

  var gamertag = util.getUsername(pieces, channel, firstname);

  request.get({
      url: settings.apiPath + 'slack/thisWeek/' + gamertag,
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      if (result && parseInt(result[0]['matches']) > 0) {
        var res = result[0];
        var response = util.formatFields(res['displayName'], 'Map', res['map'], res['matches'], res['losses'], res['kd'], res['membershipType']);
        channel.postMessage(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      } else {
        var response = gamertag + ' has played no matches nor killed this week.';
        channel.send(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      }
    });
}

exports.lastWeek = function (slack, channel, pieces, firstname) {

  var gamertag = util.getUsername(pieces, channel, firstname);

  request.get({
      url: settings.apiPath + 'slack/lastWeek/' + gamertag,
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      if (result && parseInt(result[0]['matches']) > 0) {
        var res = result[0];
        var response = util.formatFields(res['displayName'], 'Map', res['map'], res['matches'], res['losses'], res['kd'], res['membershipType']);
        channel.postMessage(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      } else {
        var response = gamertag + ' has played no matches nor killed last week.';
        channel.send(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      }
    });
}

exports.yearOne = function (slack, channel, pieces, platform, firstname) {

  var gamertag = util.getUsername(pieces, channel, firstname);

  return util.getPlayerId(channel, platform, gamertag, 'year1').then(function(results) {
    var membershipId = results['membershipId'];
    var platform = results['platform'];
    request.get({
        url: 'http://proxy.destinytrialsreport.com/Platform/Destiny/Stats/' + platform + '/' + membershipId + '/0/?modes=14',
        timeout: 10000,
        json: true
      }, function (error, response, result) {  
      if (body && body['Response'] && body['Response']['trialsOfOsiris'] && body['Response']['trialsOfOsiris']['allTime']) {
        var stats = body['Response']['trialsOfOsiris']['allTime'];
        var kills = stats['kills']['basic']['value'];
        var deaths = stats['deaths']['basic']['value'];
        if (deaths == 0) {
          deaths = 1;
        }
        var kd = (kills/deaths).toFixed(2)
        var matches = stats['activitiesEntered']['basic']['value'];
        var wins = stats['activitiesWon']['basic']['value'];
        var losses = matches - wins;

        request.get({
          url: settings.apiPath + 'slack/trials/' + gamertag,
          timeout: 10000,
          json: true
        }, function (error, response, result) {
          if (result && parseInt(result[0]['matches']) > 0) {
            // use attachment syntax for nice formatting.
            var subMatches = matches - result[0]['matches'];
            var subLosses = losses - result[0]['losses'];
            var subKills = kills - result[0]['kills'];
            var subDeaths = deaths - result[0]['deaths'];
            if (subDeaths == 0) {
              subDeaths = 1;
            }
            var subKd = (subKills / subDeaths).toFixed(2);
            var response = util.formatFields(result[0]['displayName'], 'Year', 'One', subMatches, subLosses, subKd, platform);
            channel.postMessage(response);
            return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
          } else {
            var response = util.formatFields(gamertag, 'Year', 'One', matches, losses, kd, platform);
            channel.postMessage(response);
            return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
          }
        });
      } else {
        channel.send('No Trials matches found in year one');
      }
    });
  });
}

exports.yearTwo = function (slack, channel, pieces, mode, firstname) {

  var gamertag = util.getUsername(pieces, channel, firstname);

  var endResponse = ' in year two of Trials.';
  var type = "Year";
  var group = "Two";
  if (mode == 'doubles') {
    var endResponse = ' in Crimson Doubles.';
    var type = "Mode";
    var group = "Crimson Doubles";
  }

  request.get({
      url: settings.apiPath + 'slack/' + mode + '/' + gamertag,
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      if (result && parseInt(result[0]['matches']) > 0) {
        var res = result[0];
        var response = util.formatFields(res['displayName'], type, group, res['matches'], res['losses'], res['kd'], res['membershipType']);
        channel.postMessage(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      } else {
        var response = gamertag + ' has played no matches nor killed' + endResponse;
        channel.send(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      }
    });
}

exports.week = function (slack, channel, pieces, firstname) {
  var response;
  var max_week;
  var week = parseInt(pieces[0]);
  pieces.splice(0, 1);

  if (!week) {
    response = 'Please enter week number before gamertag. !help for more info';
    channel.send(response);
    return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
  }
  var gamertag = util.getUsername(pieces, channel, firstname);

  request.get({
      url: settings.apiPath + 'currentMap',
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      if (result[0]) {
        max_week = result[0]['week'];
      }
      if (week && max_week && week > max_week) {
        response = 'I cannot forsee into your future, please enter a week between 1 and ' + max_week;
        channel.send(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      }

      var isLessThan = 'AND pm.instanceId <= (SELECT last_instance FROM trials.map_ref where week = ' + week + ');';
      if (week == max_week) {
        isLessThan = '';
      }

      var url = 'slack/trials/' + gamertag + '/week/' + week;
      if (week == max_week) {
        url = 'slack/thisWeek/' + gamertag;
      }

      request.get({
        url: settings.apiPath + url,
        timeout: 10000,
        json: true
      }, function (error, response, result) {
        if (result && parseInt(result[0]['matches']) > 0) {
          var res = result[0];
          response = util.formatFields(res['displayName'], 'Map', res['map'] + ' (Year 2, Week ' + week + ')', res['matches'], res['losses'], res['kd'], res['membershipType']);
          channel.postMessage(response);
          return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
        } else {
          response = gamertag + ' has played no matches nor killed this week.';
          channel.send(response);
          return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
        }
      });
  });
}

exports.worstkd = function (slack, channel, pieces, firstname) {

  var gamertag = util.getUsername(pieces, channel, firstname);

  request.get({
      url: settings.apiPath + 'worstkd/' + gamertag,
      timeout: 10000,
      json: true
    }, function (error, response, result) {
      if (result && result[0]) {
        var title = 'Click for the Post Game Carnage Report on Bungie.net';
        var link = 'https://www.bungie.net/en/Legend/PGCR?instanceId=' + result[0]['instanceId'] + '&characterId=' + result[0]['characterId'];
        var image_url = "http://www.bungie.net" + result[0]['pgcrImage'];
        var fields = [
          {
            "title": 'Worst KD',
            "value": result[0]['kd'],
            "short": true
          },
          {
            "title": 'Date',
            "value": moment.utc(result[0]['date']).format('YYYY-MM-DD HH:mm:ss'),
            "short": true
          }
        ];
        var fallback = 'Worst KD: ' + result[0]['kd'];
        response = util.formatAttachment(title, link, fields, fallback);
        channel.postMessage(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      } else {
        var response = "Record not found for " + gamertag;
        channel.send(response);
        return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
      }
  });
}