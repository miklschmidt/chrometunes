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

//A little hack to make fetch's throw a 'fetched' event by triggering it in the success callback.
Backbone.Model.prototype.org_fetch = Backbone.Model.prototype.fetch;
_.extend(Backbone.Model.prototype, {
	fetch: function(options) {
		var me = this, new_options = {};
		_.extend(new_options, options, {
			success: function () {
				if (typeof(options.success) == 'function') {
					options.success();
				}
				me.trigger('fetched');
			}
		});
		return this.org_fetch(new_options);
	}
});

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
		player = new AudioPlayer({id: 1});
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
		//Change song of audio player.
		/*fs.get_all_songs(function (files) {
			var song = files[0];
			song.save({}, {
				success: function() {
					player.change_song(song);
					console.log(player.toJSON());
					player.save({}, {
						succes: function() {
							console.log('succesful!');
						},
						error: function(o, error) {
							console.log('failed!');
							console.log(o, error);
						}
					});
				}
			});
		});*/
		player.bind('restored', function() {
			setInterval(function() {
			  player.save();
			}, 1000);
		});
		// Push audioplayer state each second, so we can resume playing if we accidentally closed the browser.
	},
});

$(document).ready(function() {
	fs = new FileSystem(1024, function() {
		main_router = new MediaCenterRouter();
		Backbone.history.start();
	});
});
