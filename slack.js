/**
 * DestinyTrialsReport Slack Bot
 */

// Initialize Node Modules
var Slack = require('slack-client');

// Initialize DTR Modules
var commands = require('./commands.js'),
    settings = require('./settings.js'),
    util     = require('./util.js');

slack = new Slack(settings.slackToken, true, true);

slack.on('open', function() {
  var channel, channels, group, groups, id, messages, unreads, users;
  unreads = slack.getUnreadCount();
  channels = (function() {
    var ref, results;
    ref = slack.channels;
    results = [];
    for (id in ref) {
      channel = ref[id];
      console.log(channel.name)
      if (channel.is_member) {
        results.push("#" + channel.name);
      }
    }
    return results;
  })();

  groups = (function() {
    var ref, results;
    ref = slack.groups;
    results = [];
    for (id in ref) {
      group = ref[id];
      if (group.is_open && !group.is_archived) {
        results.push(group.name);
      }
    }
    return results;
  })();
  console.log('Welcome to Slack. You are @' + slack.self.name + ' of ' + slack.team.name);
  console.log('You are in: ' + channels.join(', '));
  console.log('As well as: ' + groups.join(', '));
  messages = unreads === 1 ? 'message' : 'messages';
  return console.log("You have " + unreads + " unread " + messages);
});

slack.on('message', function (message) {
  var channel = slack.getChannelGroupOrDMByID(message.channel);
  var user = slack.getUserByID(message.user);
  var response = '';
  var type = message.type, ts = message.ts, text = message.text;
  var channelName = (channel != null ? channel.is_channel : void 0) ? '#' : '';
      channelName = channelName + (channel ? channel.name : 'UNKNOWN_CHANNEL');
  var userName = (user != null ? user.name : void 0) != null ? "@" + user.name : "UNKNOWN_USER";
  var userFirstName = (user != null ? user.profile : void 0) != null ? user.profile.first_name : null;
  var isAdmin = util.isAdmin(userName.substr(1));
  console.log("Received: " + type + " " + channelName + " " + userName + " " + ts + " \"" + text + "\"");

  // we were mentioned
  if (text && text.toLowerCase().indexOf('<@' + slack.self.id.toLowerCase() + '>') > -1) {
    if (text.toLowerCase().indexOf('hi') > -1) {
      var response = 'hi ' + userName + '!';
      channel.send(response);
      return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
    }
    
    if (text.toLowerCase().indexOf('hello') > -1) {
      var response = 'hello ' + userName + '!';
      channel.send(response);
      return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
    }
  }
  
  // a command was issued
  if (text && text.indexOf(settings.trigger) > -1) {
    var pieces = text.split(' ');
    var command = pieces.shift().substr(settings.trigger.length);
    
    if (command === 'currentmap')       return commands.currentMap    (slack, channel);
    if (command === 'archnemesis')      return commands.archnemesis   (slack, channel, pieces, userFirstName);
    if (command === 'bestkd')           return commands.bestkd        (slack, channel, pieces, userFirstName);
    if (command === 'worstkd')          return commands.worstkd       (slack, channel, pieces, userFirstName);
    if (command === 'thisweek')         return commands.thisWeek      (slack, channel, pieces, userFirstName);
    if (command === 'thismap')          return commands.thisMap       (slack, channel, pieces, userFirstName);
    if (command === 'week')             return commands.week          (slack, channel, pieces, userFirstName);
    if (command === 'lastweek')         return commands.lastWeek      (slack, channel, pieces, userFirstName);
    if (command === 'year2')            return commands.yearTwo       (slack, channel, pieces, 'trials', userFirstName);
    if (command === 'crimsondoubles')   return commands.yearTwo       (slack, channel, pieces, 'doubles', userFirstName);
    if (command === 'year1')            return commands.yearOne       (slack, channel, pieces, null, userFirstName);
    if (command === 'year1:ps')         return commands.yearOne       (slack, channel, pieces, 2, userFirstName);
    if (command === 'year1:xbox')       return commands.yearOne       (slack, channel, pieces, 1, userFirstName);
    if (command === 'flawless')         return commands.flawless      (slack, channel, pieces, null, userFirstName);
    if (command === 'flawless:ps')      return commands.flawless      (slack, channel, pieces, 2, userFirstName);
    if (command === 'flawless:xbox')    return commands.flawless      (slack, channel, pieces, 1, userFirstName);
    if (command === 'help')             return commands.commands      (slack, channel, pieces, 'CR');
    if (command === 'commands')         return commands.commands      (slack, channel, pieces, 'CR');
    if (command === 'dtr')              return commands.dtr           (slack, channel, pieces, null);
    if (command === 'dtr:ps')           return commands.dtr           (slack, channel, pieces, 2);
    if (command === 'dtr:xbox')         return commands.dtr           (slack, channel, pieces, 1);
    if (command === 'ggg')              return commands.ggg           (slack, channel, pieces);
    if (command === 'sayto')            return commands.sayto         (slack, channel, pieces, userName, isAdmin);
    if (command === 'pgcr')             return commands.pgcr          (slack, channel, pieces);
    if (command === 'platform')         return commands.platform      (slack, channel, pieces);
    if (command === 'status')           return commands.status        (slack, channel, userName);
    // if (command) {
    //   var response = 'Command not found, type !help for a list of all possible commands.';
    //   channel.send(response);
    //   return console.log("@" + slack.self.name + " responded with \"" + response + "\"");
    // }
  }
});

slack.on('error', function (error) {
  return console.error("Error: " + error);
});

slack.login();