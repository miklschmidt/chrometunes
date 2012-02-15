/*
 *	@author Mikkel Schmidt (mikkel.schmidt@gmail.com)
 *	@dependencies jQuery.js, Filer.js, id3v2.js
 *	
 *	TODO: Make files downloadable (ie. transferable to user defined folder.. Zip it, write the zip to filesystem and redirect);
 */

String.prototype.capitalize = function(){
   return this.replace( /(^|\s|\()([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
};

var current_notification = null;

//Notification support
window.allow_notifications = false;
function check_notification_permissions() {
	if (window.webkitNotifications.checkPermission() == 0) {
		window.allow_notifications = true;
	}
}

window.webkitNotifications.requestPermission(function() { check_notification_permissions(); });
check_notification_permissions();

function show_notification (text, title) {
	if (!title) {
		title = 'Now playing';
	}
	window.webkitNotifications.requestPermission(function() { check_notification_permissions(); });
	if (window.allow_notifications) {
		var n = window.webkitNotifications.createNotification(
			'', 
			title, 
			text
		);
		if (current_notification) {
			current_notification.cancel();
		}
		current_notification = n;
		n.show();
		setTimeout(function(){
			n.cancel();
			current_notification = null;
		}, 5000);
	}
}

var player_view;
var player = null;
var main_router = null;
var fs = null;

var MediaCenterRouter = Backbone.Router.extend({
	routes: {
		"": "index"
	},

	initialize: function() {
		console.log('MediaCenterRouter initialized');
	},

	index: function() {
		console.log('Running index!')
		//Instantiate the audioplayer model
		player = new AudioPlayer();
		//Fetch model state from indexeddb
		var log = function(model, response) {
			console.log(model);
			console.log(response);
		}
		player.fetch({}, log, log);
		//Instantiate view and prepend it to body
		player_view = new AudioPlayerView({model: player});
		player_view.render();
		$('body').prepend(player_view.el);
		console.log('view prepended');
		//
		
	},
});

$(document).ready(function() {
	fs = new FileSystem(1024, function() {
		main_router = new MediaCenterRouter();
		Backbone.history.start();
	});
});
