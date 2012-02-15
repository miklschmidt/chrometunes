var SongDB = {
    id:"song_db",
    description:"Database for the songs",
    migrations:[
        {
            version: 1,
            migrate: function (transaction, next) {
                var store = transaction.db.createObjectStore("songs");
                store.createIndex("artist_idx", "artist", {
                    unique:false
                });
                store.createIndex("title_idx", "title", {
                    unique:false
                });
                store.createIndex("album_idx", "album", {
                    unique:false
                });
                next();
            }
        }
    ]
};

var Song = Backbone.Model.extend({
	database: SongDB,
	storeName: 'songs',
	defaults: {
		file_url: null,
		album: "Unknown Album",
		artist: "Unknown Artist",
		band: "Unknown Band",
		genre: "Unknown Genre",
		title: "Unknown Title",
		track_number: "Unknown Track",
		year: "Unknown Year",
		pictures: new Array(),
		composer: "Unknown Composer",
		file_parsed: false,
	},
	initialize: function() {
		this.bind('change:file_url', function(song) {
			song.set({id3_parsed: false});
			song.parse_file();
		});
		if (this.get('file_parsed') === false) {
			this.parse_file();
		}
		this.bind('id3_parsed', function() {
			this.set({duration: this.calc_duration()});
		});
	},

	calc_duration: function () {
		//This is a horrible way to do this. But it works for now..
		var audio = new Audio();
		audio.src = this.get('file_url');
		var self = this;
		setTimeout(function() {
			function get_duration() {
				var duration = audio.duration;
				duration = (new Date).clearTime()
		          .addSeconds(duration)
		          .toString('mm:ss');  
		        if (isNaN(parseInt(duration, 10))) {
		        	setTimeout(get_duration, 100);
		        } else {
					delete(audio);
			        self.set({duration: duration});
			        self.trigger('file_parsed');
		        }
			}
			get_duration();
		}, 100);
	},

	parse_file: function() {
		if (this.get('file_parsed') === false) {
			var url = this.get('file_url');
			var song = this;

			song.get_file(function(file){
				var underscore_and_lowercase = function (string) {
					var fragments = string.split(' ');
					var new_string = "";
					for (var i=0; i<fragments.length; i++) {
						if (i==0) new_string += fragments[i].toLowerCase();
						else new_string += '_' + fragments[i].toLowerCase();
					}
					return new_string;
				}
				//Try parsing ID3 tags.
				ID3v2.parseFile(file,function(tags){
					var attributes = {};
					for (var tag in tags) {
						if (typeof(tags[tag]) != 'undefined' && tags[tag] !== null) {
							var _tag = underscore_and_lowercase(tag);
							attributes[_tag] = tags[tag];
						}
					}
					if (!attributes.title || !attributes.artist) {
						//ID3 tags are insufficient, parse filename
						//Example 01-sugarland-all_i_want_to_do.mp3
						var name = file.fileName;
						var tmp = name.split('.');
						tmp = tmp[0];
						var fragments = tmp.split('-');
						for (index in fragments) {
							var fragment = fragments[index];
							//Test if we have a number.
							if (!isNaN(fragment)) {
								//Probably track number
								attributes.track_number = fragment;
							} else {
								fragment = fragment.replace(/_/gi, ' ').capitalize();
								if (!attributes.artist) {
									//First string should be the artist name
									attributes.artist = fragment;
								} else {
									//We are gonna assume the rest is the title.
									if (!attributes.title) attributes.title = fragment;
									else attributes.title += ' - ' + fragment;
								}
							}
						}
					}
					song.set(attributes);
					song.set({file_parsed: true});
					song.trigger('id3_parsed');
				});
			})
		}
	},
	get_file_entry: function (callback) {
		var url = this.get('file_url');
		window.resolveLocalFileSystemURL(url, function(file_entry) {
			if (typeof(callback) == 'function') callback(file_entry);
		});
	},
	get_file: function (callback) {
		this.get_file_entry(function(file_entry){
			file_entry.file(function(file) {
				if (typeof(callback) == 'function') callback(file);
			});
		});
	}
});

var SongCollection = Backbone.Collection.extend({
	database: SongDB,
	storeName: 'songs',
	model: Song,
	comparator: function (song) {
		//pad tracknumber for comparison.
		var track = song.get('track_number').replace(/[^0-9.]/g, "");
		track = parseInt(track, 10);
		function pad(number, length) {
		    var str = '' + number;
		    while (str.length < length) {
		        str = '0' + str;
		    }
		    return str;
		}
		track = pad(track, 5);
		return song.get('artist') + song.get('album') + track + song.get('title');
	}
});