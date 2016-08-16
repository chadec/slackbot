/**
 * Settings Module for DestinyTrialsReport
 */

// Initialize DTR Modules
var settings = {};

settings.slackToken = 'SLACK-TOKEN-HERE';
settings.apiPath = 'http://api.destinytrialsreport.com/';
settings.trigger = '!';
//slack handles
settings.admins = ['ic1415', 'Chad'];
settings.channels = ['getrekt'];
settings.groups = [];

module.exports = settings;
