var AudioPlayerDB = {
    id:"audio_player_db",
    description:"The database for the audioplayer",
    migrations:[
        {
            version: 1,
            migrate: function (transaction, next) {
                var store = transaction.db.createObjectStore("audio_player");
                next();
            }
        }
    ]
};

var AudioPlayer = Backbone.Model.Extend({
	database: AudioPlayerDB,
	storeName: "audio_player",
	defaults: {
		current_playlist = null,
		dom_id = 'audio'
	},
	play: function () {
		
	},
	next: function () {
		
	},
	prev: function () {
		
	},
	pause: function () {
		
	},
	stop: function () {
		
	},
	get_current_playlist: function () {
		
	}
});