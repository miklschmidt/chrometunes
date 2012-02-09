/*
 *	@author Mikkel Schmidt (mikkel.schmidt@gmail.com)
 *	@dependencies jQuery.js, Filer.js, id3v2.js
 *	
 *	TODO: Make files downloadable (ie. transferable to user defined folder.. dno how yet);
 */

String.prototype.capitalize = function(){
   return this.replace( /(^|\s|\()([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
};

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

		n.show();
		setTimeout(function(){n.cancel()}, 5000);
	}
}

/*var context = new window.webkitAudioContext();
var analyser = context.createAnalyser();
analyser.fftSize = 4096;
var gain = context.createGainNode();
var audio = $('#audio')[0];
var source = null;*/
var debug_files = [];
var debug_songs = [];

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
		//Initialize 1gb of space.
		window.webkitStorageInfo.requestQuota(PERSISTENT, 1000 * 1024 * 1024, function(grantedBytes) {
			filer.init({persistent: true, size: grantedBytes}, function(fs) { 
				//success
				filer.mkdir('/storage', true, function(){ 
					console.log('directory "storage" was created'); 
				}, function () {
					console.log('directory "storage" already exists');		
				});
				me.all_files(function(){
					var playlist = me.playlist('all');
					playlist.element_for(playlist.rewind()).addClass('playing').siblings().removeClass('playing');
					var audio = $('#audio')[0];
					audio.pause();
					$('#main_menu .header.playlists').addClass('active');
					$('#main_menu .content.playlists').show().find('#all').addClass('active');
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
		var body = document.querySelector('body');
		var drop = $drop[0];
		var drop_enter = function(e) {
			$drop.text('GIMME GIMME!');
			e.stopPropagation();
			e.preventDefault();
		}

		drop.addEventListener('dragenter', drop_enter, false);
		drop.addEventListener('dragover', drop_enter, false);
		drop.addEventListener('drop', function(e){
			var files = e.dataTransfer.files;
			//console.log(e.dataTransfer);
			$drop.text('THANK YOU!');
			e.stopPropagation();
			e.preventDefault();
			me.load_files(files, function(){
				$drop.text('DROP FILES HERE!');
			});
		}, false);
	},

	setup_audio_element: function() {
		var me = this;
		audio = $("#audio")[0];
		$("#audio").bind('ended', function() {
			var number = me.next();
			var song = me.playlist(me.current_playlist).get('current_song');
			console.log('playback of current song ended, moving on to "' + song.get('artist') + ' - ' + song.get('title') + '"');
		}).bind('timeupdate', function(e) {
			var time = e.target.currentTime;
			var duration = e.target.duration;
			var progress = time / duration * 100;
			$("#progress_bar").css('width', progress + '%');
			duration = me.playlist('all').get('current_song').get('duration'); 
			time = (new Date).clearTime()
	          .addSeconds(time)
	          .toString('mm:ss');
	        $("#current_duration").text(time + ' / ' + duration);  
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
		$('#progress_background, #progress_bar').click(function(e) {
			if (audio.readyState > 3) {
				var bg = $('#progress_background');
				var offset = bg.offset();
				var value = e.pageX - offset.left;
				var duration_factor = value/bg.width();
				audio.currentTime = audio.duration * duration_factor;
				if (audio.paused) {
					audio.play();
				}
			}
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
		return number;
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
		return number;
	},

	load_files: function(files, callback) {
		var filer = this.filer;
		var me = this;
		var fsURL = filer.fs.root.toURL()
		filer.cd('/storage', function(entries){
			for (var i = 0, file; file = files[i]; ++i) {
				//TODO: Implement support for directories. (ie. webkitRelativePath)
				//console.log(file);
				//check if it's a directory..
				if (file.isDirectory || file.size < 1000 || file.fileSize < 1000) {
					alert('Directories are not yet supported');
				} else {
					filer.write(file.name, {data: file, type: file.type}, function(fileEntry, fileWriter) {
						//success
					}, me.on_error);
				}
			}
			//This should not be the way to add new files.. Everything is reinitialized.. stupid..
			me.all_files();
			if (typeof(callback) == 'function') {
				callback();
			}
		}, me.on_error);
	},

	on_error: function (e) {
		console.log('Error: ' + e.name);
		console.log(e);
	},

	all_files: function (callback) {
		var filer = this.filer;
		var me = this;
		//Reset playlists and table (this deletes all models and empties collections.. very desctructive indeed)
		me.reset_playlists();
		$('#list tbody tr').remove();

		filer.ls('/storage', function(entries) {
			var playlist = me.playlist('all');
			playlist.clear();
			//playlist.bind('play');
			var parse_count = 0;
			//This fails if we somehow managed to write a directory as a file.
			var i = 0;
			for (var x = 0; f = entries[x]; ++x) {
				if (!f.isDirectory) {
					// console.log('-------------------');
					// console.log(f.toURL());
					// console.log(f.isDirectory);
					// console.log(f);
					// console.log('-------------------');
					i++;
					var song = new Song({file_url: f.toURL()});
					debug_files.push(f.toURL());
					// console.log('i:' + i + ' - file: ' + f.toURL());
					song.bind('file_parsed', function(){
						try {
							playlist.push(this);
							debug_songs.push(this.get('file_url'));
							parse_count++;
							// console.log('parse_count (' + this.get('file_url') + '):' + parse_count);
							if (parse_count >= i) {
								playlist.trigger('populated');
							}
						} catch (Error) {
							console.log('The following file is already in the global playlist.');
							console.log(this)

						}
					});
				}
			}
			//Make a list of songs
			playlist.bind('populated', function() {
				me.populate_list(this, function(){ me.populate_menu(playlist, callback); });
			});

		});
	},

	populate_list: function(playlist, callback) {
		var songs = playlist.all();
		var me = this;
		$('#list').html('');
		for(song in songs) {
			var id = song;
			if (id == 0) {
				id = '0';
			}
			var view = new SongListEntryView({
				model: songs[song], 
				id: playlist.get('dom_id') + '-' + id,
				playlist: playlist,
				number: song
			});
			view.render();
			$('#list').append(view.el);
		}
		$('#list tr:odd').addClass('odd');

		//do callback
		if (typeof(callback) == 'function') {
			callback();
		}
	},

	populate_menu: function(playlist, callback) {
		var me = this;
		var $header = $;
		var count = 0;
		var songs = null;

		try {
			//Cleanup menu
			$('#main_menu .content').remove();
			$('#main_menu .header').removeClass('active');

			//Add standard playlist (all) to the playlist menu.
			$header = $('#main_menu .header.playlists');
			$header.after('<div class="content playlists"><ul></ul></div>');
			var $content = $('#main_menu .content.playlists');
			var playlist_view = new PlaylistMenuEntryView({
				model: playlist, 
				id: playlist.get('dom_id')
			});
			playlist_view.render();
			
			$content.find('ul').append(playlist_view.el);
			$header.find('span.count').text('1');

			//Make lists grouped by artist names:
			songs = playlist.get('list');
			var artists = songs.groupBy(function(song){ return song.get('artist'); });
			count = 0;
			$header = $('#main_menu .header.artists');
			$header.after('<div class="content artists"><ul></ul></div>');
			for(artist in artists) {
				var $content = $('#main_menu .content.artists');
				var songs = artists[artist];
				var random_id = Math.floor(Math.random() * 1000);
				var new_playlist = me.playlist(random_id, artist);
				for (index in songs) {
					var song = songs[index];
					new_playlist.push(song);
				}
				var playlist_view = new PlaylistMenuEntryView({
					model: new_playlist, 
					id: new_playlist.get('dom_id')
				});
				playlist_view.render();
				
				$content.find('ul').append(playlist_view.el);
				count++;
			}
			$header.find('span.count').text(count);
			//Make lists grouped by album names:
			songs = playlist.get('list');
			var albums = songs.groupBy(function(song){ return song.get('album'); });
			count = 0;
			$header = $('#main_menu .header.albums');
			$header.after('<div class="content albums"><ul></ul></div>');
			for(album in albums) {
				var $content = $('#main_menu .content.albums');
				var songs = albums[album];
				var random_id = Math.floor(Math.random() * 1000);
				var new_playlist = me.playlist(random_id, album);
				for (index in songs) {
					var song = songs[index];
					new_playlist.push(song);
				}
				var playlist_view = new PlaylistMenuEntryView({
					model: new_playlist, 
					id: new_playlist.get('dom_id')
				});
				playlist_view.render();
				
				$content.find('ul').append(playlist_view.el);
				count++;
			}
			$header.find('span.count').text(count);

			//Make lists grouped by genre:
			songs = playlist.get('list');
			var genres = songs.groupBy(function(song){ return song.get('genre'); });
			count = 0;
			$header = $('#main_menu .header.genres');
			$header.after('<div class="content genres"><ul></ul></div>');
			for(genre in genres) {
				var $content = $('#main_menu .content.genres');
				var songs = genres[genre];
				var random_id = Math.floor(Math.random() * 1000);
				var new_playlist = me.playlist(random_id, genre);
				for (index in songs) {
					var song = songs[index];
					new_playlist.push(song);
				}
				var playlist_view = new PlaylistMenuEntryView({
					model: new_playlist, 
					id: new_playlist.get('dom_id')
				});
				playlist_view.render();
				
				$content.find('ul').append(playlist_view.el);
				count++;
			}
			$header.find('span.count').text(count);
		} catch (Error) {
			console.log('ERROR: Possibly trying to add a file to a collection, while it is already there');
			console.log(Error);
		} //finally {
		// 	//Cleanup menu
		// 	$('#main_menu .content').remove();
		// 	$('#main_menu .header').removeClass('active');
		// 	//Cleanup list
		// 	$('#list tr').remove();
		// 	//initiate another go
		// 	console.log('Initiating a timeout for another go 5 seconds from now');
		// 	setTimeout(function(){console.log('here we go again'); me.all_files();}, 5000);
		// }

		//Setup events
		$('#main_menu .content').hide();
		$('#main_menu .header').click(function() {
			var $header = $(this);
			var $content = $header.next('.content');
			if (!$header.hasClass('active')) {
				$('#main_menu .header.active').removeClass('active').next('.content').hide('blind', 'fast');
				$content.show('blind', 'fast');
				$header.addClass('active');
			}
		});
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
			$('#currently_playing').text(song.get('artist') + ' - ' + song.get('title'));
			$('head title').text('Mediaplayer v0.1.1: ' + song.get('artist') + ' - ' + song.get('title'));
		});
		this._playlists[id] = new_playlist;
		return new_playlist;
	},

	reset_playlists: function() {
		// Most destructive function ever.. This is ridiculous, and is gonna be handled 
		// very differently when models and collections are persisted over IndexedDB and properly implemented.
		var me = this;
		var models;
		for (id in me._playlists) {
			models = me._playlists[id].reset_collection();
			for (model in models) {
				models[model].destroy();
			}
			me._playlists[id].destroy();
		}	
	},

	set_playlist: function(playlist) {
		this.current_playlist = playlist.get('dom_id');
	}
}