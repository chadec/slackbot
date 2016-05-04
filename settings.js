/**
 * Settings Module for DestinyTrialsReport
 */

// Initialize DTR Modules
var settings = {};

settings.slackToken = 'slack-token-here';
settings.apiPath = 'http://api.destinytrialsreport.com/';
settings.trigger = '!';
//slack handles
settings.admins = ['vlad', 'steffan', 'mark'];
settings.channels = [];
settings.groups = [];

module.exports = settings;