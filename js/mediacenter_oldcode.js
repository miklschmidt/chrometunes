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

	initialize: function (options) {

		window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL ||
										   window.webkitResolveLocalFileSystemURL;

		var filer = this.filer;
		var me = this;
		if (typeof(options) != 'undefined' && options !== null) {
			$.extend(this.options, options);
		}
		this.fix_buttons();

				me.all_files(function(){
					var playlist = me.playlist('all');
					playlist.element_for(playlist.rewind()).addClass('playing').siblings().removeClass('playing');
					var audio = $('#audio')[0];
					audio.pause();
					$('#main_menu .header.playlists').addClass('active');
					$('#main_menu .content.playlists').show().find('#all').addClass('active');
				});



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
					i++;
					var song = new Song({file_url: f.toURL()});
					debug_files.push(f.toURL());
					song.bind('file_parsed', function(){
						try {
							playlist.push(this);
							debug_songs.push(this.get('file_url'));
							parse_count++;
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

}