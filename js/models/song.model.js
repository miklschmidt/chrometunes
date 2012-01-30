var Song = Backbone.Model.extend({
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
	},
	parse_file: function() {
		if (this.get('file_parsed') === false) {
			var filer = media_center.filer;
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
					song.trigger('file_parsed');
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
	model: Song,
	comparator: function (song) {
		//Convert track_number to hex string
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