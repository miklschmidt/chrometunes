var AudioPlayerDB = {
    id:"audio_player_db",
    description:"The database for the audioplayer",
    migrations:[
        {
            version: 1,
            migrate: function (db, versionRequest, next) {
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
		current_playlist_id: null, 
		current_song_id: null, 
		shuffle: false,
		repeat: false,
		is_playing: false,
		progress: 0,
		version: '0.1.1'
	},

	audio: new Audio(),

	current_playlist: null, //An instance of the current playlist.
	current_song: null, //An instance of the currently playing song.

	initialize: function () {
		var me = this;
		//Restore state when fetched.
		this.bind('fetched', function() {
			var checks = 0;
			var passes = 0;
			//Fetch the current playlist instance.
			if (this.get('current_playlist_id')) {
				checks++;
				var new_playlist = new Playlist({id: this.get('current_playlist_id')});
				new_playlist.fetch({
					success: function() {
						me.change_playlist(new_playlist);
						passes++;
					},
					error: function(o, e) {
						passes++;
						console.log(o, e);
					}
				});
			}
			//Fetch the current song instance.
			if (this.get('current_song_id')) {
				checks++;
				var new_song = new Song({id: this.get('current_song_id')});
				new_song.fetch({
					success: function() {
						me.change_song(new_song);
						passes++;
					},
					error: function(o, e) {
						passes++;
						console.log(o, e);
					}
				});
			}
			//Restore progress in current song.
			if (this.get('progress')) {
				checks++;
				setTimeout(function() {
					function set_progress() {
						if (me.audio.readyState < me.audio.HAVE_METADATA) {
							setTimeout(set_progress, 50);
						} else {
							me.audio.currentTime = me.get('progress');
							passes++;
						}
					}
					set_progress();
				}, 50);
			}
			//Check if all checks has passed.
			setTimeout(function() {
				function check_restoration_progress() {
					if (checks == passes) {
						me.trigger('restored');
					} else {
						setTimeout(check_restoration_progress, 50);
					}
				}
				check_restoration_progress();
			}, 50);
		}, this);

		$(this.audio).bind('timeupdate', function() {
			me.set({progress: me.audio.currentTime});
		});
	},
	change_song: function (song) {
		song.set({is_playing: true});
		this.current_song = song;
		this.set({current_song_id: song.id});
		this.audio.src = song.get('file_url');
		if (this.get('is_playing')) {
			this.play();
		} else {
			this.pause();
		}
	},
	change_playlist: function (playlist) {
		this.current_playlist = playlist;
		this.set({current_playlist_id: playlist.id});
	},
	navigate: function (direction) {
		var me = this;
		var number;
		var playlist = this.current_playlist;
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
		var audio = this.audio;
		if (audio.src !== null && audio.src !== '') {
			audio.play();
		} else {
			console.log('ERROR: Cannot play when no track is selected!');
		}
	},
	pause: function () {
		this.audio.pause();
	},
	stop: function () {
		this.audio.currentTime = 0;
		this.pause();
	},
	set_progress: function (duration) {
		this.audio.currentTime = duration;
	}
});