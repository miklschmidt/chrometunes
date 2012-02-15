var player_view;
var player = null;
var main_router = null;
var fs = null;

var MediaCenterRouter = Backbone.Router.extend({
	routes: {
		"": "index"
	},

	index: function() {
	
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
		$('body').prepend(player_view);
		//
		
	},
});

$(document).ready(function() {
	fs = new FileSystem(1024, function() {
		main_router = new MediaCenterRouter();
		Backbone.history.start();
	});
});
