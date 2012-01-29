/*
 *	@author Mikkel Schmidt (mikkel.schmidt@gmail.com)
 *	@dependencies jQuery.js, Filer.js, id3v2.js
 *	
 *	TODO: Make files downloadable (ie. transferable to user defined folder.. dno how yet);
 */

var media_center = {

	filer: new Filer(),

	options: {
		shuffle: false,
		repeat:  false
	},

	is_playing: false,
	is_paused: true,
	current_playlist: 'all',

	fix_buttons: function () {
		if (this.options.repeat) {
			$('#extras .repeat_off').hide();
			$('#extras .repeat_on').show();
		} else {
			$('#extras .repeat_off').show();
			$('#extras .repeat_on').hide();
		}
		if (this.options.shuffle) {
			$('#extras .shuffle_off').hide();
			$('#extras .shuffle_on').show();
		} else {
			$('#extras .shuffle_off').show();
			$('#extras .shuffle_on').hide();
		}
	},

	shuffle: function (boolean) {
		if (boolean) {
			this.options.shuffle = true;
		} else {
			this.options.shuffle = false;
		}
		this.fix_buttons();
	},

	repeat: function (boolean) {
		if (boolean) {
			this.options.repeat = true;
		} else {
			this.options.repeat = false;
		}
		this.fix_buttons();
	},

	initialize: function (options) {

		window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL ||
                            			   window.webkitResolveLocalFileSystemURL;

		var filer = this.filer;
		var me = this;
		if (typeof(options) != 'undefined' && options !== null) {
			$.extend(this.options, options);
		}
		this.fix_buttons();
		//Initialize 500 megs of space.
		window.webkitStorageInfo.requestQuota(PERSISTENT, 1000 * 1024 * 1024, function(grantedBytes) {
			filer.init({persistent: true, size: grantedBytes}, function(fs) { 
				//success
				filer.mkdir('/storage', true, function(){ 
					console.log('directory "storage" was created'); 
				}, function () {
					console.log('directory "storage" already exists');		
				});
				me.list_files(function(){
					var playlist = me.playlist('all');
					playlist.element_for(playlist.rewind()).addClass('playing').siblings().removeClass('playing');
					var audio = $('#audio')[0];
					audio.pause();
				});
				this.filer = filer;
			}, me.on_error);
		}, me.on_error);

		this.setup_drop_handlers();
		this.setup_audio_element();
		this.setup_controls();

	},

	setup_drop_handlers: function () {
		var me = this;
		var $drop = $('#drop_area');
		var drop = $drop[0];
		var drop_enter = function(e) {
			$drop.text('Gimme gimme!');
			e.stopPropagation();
			e.preventDefault();
		}

		drop.addEventListener('dragenter', drop_enter, false);
		drop.addEventListener('dragover', drop_enter, false);
		drop.addEventListener('drop', function(e){
			var files = e.dataTransfer.files;
			$drop.text('Thank you!');
			e.stopPropagation();
			e.preventDefault();
			me.load_files(files, function(){
				$drop.text('Drop files here!');
			});
		}, false);
	},

	setup_audio_element: function() {
		var me = this;
		$("#audio").bind('ended', function() {
			console.log('playback of current song ended, moving on to the next in the playlist');
			me.next();
		}).bind('timeupdate', function(e) {
			var time = e.target.currentTime;
			var duration = e.target.duration;
			var progress = time / duration * 100;
			$("#progress_bar").css('width', progress + '%');
		}).bind('playing', function(e) {
			//We started playing, fix buttons.
			me.is_paused = false;
			me.is_playing = true;
			$('#controls .play').hide();
			$('#controls .pause').show();
		}).bind('pause', function(e) {
			//We stopped playing, fix buttons.
			me.is_paused = true;
			me.is_playing = false;
			$('#controls .play').show();
			$('#controls .pause').hide();
		});
	},

	setup_controls: function() {
		var me = this;
		$('#controls .play').click(function(e) {
			e.preventDefault();
			var audio = $('#audio')[0];
			if (audio.src !== null && audio.src !== '') {
				audio.play();
			}
		});
		$('#controls .pause').click(function(e) {
			e.preventDefault();
			var audio = $('#audio')[0];
			audio.pause();
		});
		$('#controls .next').click(function(e) {
			e.preventDefault();
			me.next();
		});
		$('#controls .prev').click(function(e) {
			e.preventDefault();
			me.prev();
		});
		$('#extras .shuffle_on').click(function(e) {
			e.preventDefault();
			me.options.shuffle = false;
			me.fix_buttons();
		});
		$('#extras .shuffle_off').click(function(e) {
			e.preventDefault();
			me.options.shuffle = true;
			me.fix_buttons();
		});
		$('#extras .repeat_on').click(function(e) {
			e.preventDefault();
			me.options.repeat = false;
			me.fix_buttons();
		});
		$('#extras .repeat_off').click(function(e) {
			e.preventDefault();
			me.options.repeat = true;
			me.fix_buttons();
		});
	},

	next: function() {
		var me = this;
		var number;
		var playlist = this.playlist(this.current_playlist);
		if (me.options.shuffle === true) {
			number = playlist.random();
		} else {
			number = playlist.next();
		}
		playlist.element_for(number).addClass('playing').siblings().removeClass('playing');
	},

	prev: function() {
		var me = this;
		var number;
		var playlist = this.playlist(this.current_playlist);
		if (me.options.shuffle === true) {
			number = playlist.random();
		} else {
			number = playlist.prev();
		}
		playlist.element_for(number).addClass('playing').siblings().removeClass('playing');
	},

	load_files: function(files, callback) {
		var filer = this.filer;
		var me = this;
		var fsURL = filer.fs.root.toURL()
		filer.cd('/storage', function(entries){
			for (var i = 0, file; file = files[i]; ++i) {
				//TODO: Implement support for directories. (ie. webkitRelativePath)
				filer.write(file.name, {data: file, type: file.type}, function(fileEntry, fileWriter) {
					//success
				}, me.on_error);
			}
			me.list_files();
			if (typeof(callback) == 'function') {
				callback();
			}
		}, me.on_error);
	},

	on_error: function (e) {
		console.log('Error: ' + e.name);
		console.log(e);
	},

	list_files: function (callback) {
		var filer = this.filer;
		var me = this;
		$('#list').html('<ul></ul>');
		filer.ls('/storage', function(entries) {
			var playlist = me.playlist('all');
			playlist.clear();
			//playlist.bind('play');
			var parse_count = 0;
			for (var x = 0; f = entries[x]; ++x) {
				var song = new Song({file_url: f.toURL()});
				song.bind('id3_parsed', function(){
					playlist.push(this);
					parse_count++;
					if (parse_count >= (entries.length - 2)) {
						playlist.trigger('populated');
					}
				});
			}
			//Make a list of songs
			playlist.bind('populated', function() {
				me.populate_list(this);
			})

			//playlist.play();
		});
	},

	populate_list: function(playlist) {
		var songs = playlist.all();
		for(song in songs) {
			var $file = $('<li>' + songs[song].get('artist') + ' - ' + songs[song].get('album') + ' - ' + songs[song].get('title') + '</li>');
			$('#list ul').append($file);
			$file.data('song', songs[song]);
			//Add to playlist.
			var id = playlist.get('dom_id');
			var number = song;
			$file.data('playlist_id', id)
			$file.data('playlist_number', number);
			$file.attr('id', id + '-' + number);
			//Make the file play on click.
			$file.click(function(){
				var $f = $(this);
				var number = $f.data('playlist_number');
				playlist.play(number);
				$f.siblings().removeClass('playing');
				$f.addClass('playing');
			});
			var $del = jQuery('<a href="#">Delete</a>');
			$file.append($del);
			$del.click(function() {
				var $f = $(this).parent();
				$f.data('song').get_file_entry(function(file_entry){
					filer.rm(file_entry, function() {
						me.list_files();
					});
				});
			});
		}
		//do callback
		if (typeof(callback) == 'function') {
			callback();
		}
	},

	play: function(file_url) {
		$("#audio").attr('src', file_url);
		$("#audio")[0].play();
	},

	parse_id3: function (file_entry, callback) {
		//TODO: Use FileSystem instead of local storage.
		if (localStorage[file_entry.fullPath]) {
			//Return cached ID3 tags.
			console.log('id3 info allready in localstorage. returning.');
			return callback(JSON.parse(localStorage[file_entry.fullPath]));
		} 
		file_entry.file(function(file) {
			//Generate and cache ID3 tags.
			ID3v2.parseFile(file,function(tags){
				localStorage[file_entry.fullPath] = JSON.stringify({
					Title: tags.Title,
					Artist: tags.Artist,
					Album: tags.Album,
					Genre: tags.Genre
				});
				callback(tags);
			});
		});

	},

	delete_library: function () {
		var filer = this.filer;
		var me = this;

		filer.rm('/storage', function(){
			console.log('successfully deleted storage folder');
		}, me.on_error);
	},

	_playlists: {},

	playlist: function(id, name) {
		//Check if the playlist id allready exist.
		if (typeof(this._playlists[id]) != 'undefined' && this._playlists[id] !== null) {
			return this._playlists[id];
		}
		//Nope it doesn't lets go ahead and return a brand new one.

		if (typeof(name) == 'undefined'|| name === null) {
			//Hack, shouldn't work like this..
			name = 'All songs';
		}

		var new_playlist = new Playlist({
			dom_id: id,
			name: name
		});
		new_playlist.bind('change:current_song', function(playlist){
			var song = playlist.get('current_song');
			$('#case').text(song.get('artist') + ' - ' + song.get('title'));
		});
		this._playlists[id] = new_playlist;

		return new_playlist;
	} 
}