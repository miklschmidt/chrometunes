var AudioPlayerDB = {
    id:"audio_player_db",
    description:"The database for the audioplayer",
    migrations:[
        {
            version: 1,
            migrate: function (db, versionRequest, next) {
            	console.log(db);
            	console.log(next);
                var store = db.createObjectStore("audio_player");
                next();
            }
        }
    ]
};

var AudioPlayer = Backbone.Model.extend({
	database: AudioPlayerDB,
	storeName: "audio_player",
	defaults: {
		current_playlist: null,
		current_song: null,
		element: new Audio(),
		shuffle: false,
		repeat: false,
		is_playing: false,
		version: '0.1.1'
	},
	change_song: function (song) {
		song.set({is_playing: true});
		this.set({current_song: song});
		this.get('element').src = song.get('file_url');
		if (this.get('is_playing')) {
			this.play();
		} else {
			this.pause();
		}
	},
	navigate: function (direction) {
		var me = this;
		var number;
		var playlist = this.get('current_playlist');
		if (this.get('shuffle') === true) {
			number = playlist.random();
		} else {
			if (direction == 'next') {
				number = playlist.next();
			} else {
				number = playlist.prev();
			}
		}
		this.set({current_song: playlist.get('current_song')});
		//Handle this better
		playlist.element_for(number).addClass('playing').siblings().removeClass('playing');

		this.change_song(song);

		return number;
	},
	next: function () {
		this.navigate('next');
	},
	prev: function () {
		this.navigate('prev');
	},
	play: function () {
		var audio = this.get('element');
		if (audio.src !== null && audio.src !== '') {
			audio.play();
		} else {
			console.log('ERROR: Cannot play when no track is selected!');
		}
	},
	pause: function () {
		this.get('element').pause();
	},
	stop: function () {
		this.get('element').currentTime = 0;
		this.pause();
	},
	set_progress: function (duration) {
		this.get('element').currentTime = duration;
	}
});