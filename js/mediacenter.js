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
		replay:  false
	},

	initialize: function (options) {
		var filer = this.filer;
		var self = this;
		if (typeof(options) != 'undefined' && options !== null) {
			$.extend(this.options, options);
		}
		//Initialize 500 megs of space.
		window.webkitStorageInfo.requestQuota(PERSISTENT, 500 * 1024 * 1024, function(grantedBytes) {
			filer.init({persistent: true, size: grantedBytes}, function(fs) { 
				//success
				filer.mkdir('/storage', true, function(){ 
					console.log('directory "storage" was created'); 
				}, function () {
					console.log('directory "storage" already exists');		
				});
				self.list_files();
			}, self.on_error);
		}, self.on_error);

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
			console.log(e);
			var files = e.dataTransfer.files;
			$drop.text('Thank you!');
			e.stopPropagation();
			e.preventDefault();
			console.log('wtf');
			self.load_files(files, function(){
				$drop.text('Drop files here!');
			});
		}, false);

		$('#files').change(function(e) {
			var files = e.target.files;
			this.load_files(files);
		});
	},

	load_files: function(files, callback) {
		var filer = this.filer;
		var self = this;
		filer.cd('/storage', function(){
			for (var i = 0, file; file = files[i]; ++i) {
				//TODO: Implement support for directories. (ie. webkitRelativePath)
				filer.write(file.name, {data: file, type: file.type}, function(fileEntry, fileWriter) {
					//success

				}, self.on_error);
			}
			self.list_files();
			if (typeof(callback) == 'function') {
				callback();
			}
		}, self.on_error);
	},

	on_error: function (e) {
		console.log('Error: ' + e.name);
		console.log(e);
	},

	list_files: function () {
		var filer = this.filer;
		var self = this;
		$('#list').html('<ul></ul>');
		filer.ls('/storage', function(entries) {
			var playlist = self.playlist('all');
			playlist.clear();
			for (var x = 0; f = entries[x]; ++x) {
				self.parse_id3(f, function(tags){
					var $file = $('<li>' + tags.Artist + ' - ' + tags.Title + '</li>');
					$('#list ul').append($file);
					$file.data('file', f);
					//Add to playlist.
					var id = playlist.id();
					var number = playlist.push(f);
					$file.data('playlist_id', id)
					$file.data('playlist_number', number);
					$file.attr('id', id + '-' + number);
					//Make the file play on click.
					$file.click(function(){
						var $f = $(this);
						playlist.play(number);
						$file.siblings().removeClass('playing');
						$file.addClass('playing');
					});
				});
			}
			$("#audio").bind('ended', function() {
				console.log('playback of current song ended, moving on to the next in the playlist');
				var number;
				if (self.options.shuffle === true) {
					number = playlist.random();
				} else {
					number = playlist.next();
				}
				playlist.element_for(number).addClass('playing').siblings().removeClass('playing');
			});
			$("#audio").bind('timeupdate', function(e) {
				var time = e.target.currentTime;
				var duration = e.target.duration;
				var progress = time / duration * 100;
				$("#progress_bar").css('width', progress + '%');
			});
			//playlist.play();
		});
	},

	play: function(file_url) {
		$("#audio").attr('src', file_url);
		$("#audio")[0].play();
	},

	parse_id3: function (file_entry, callback) {
		//TODO: Use FileSystem instead of local storage.
		if (localStorage[file_entry.fullPath]) {
			//Return cached ID3 tags.
			console.log('id3 info allready in localstorage. returning.')
			return callback(JSON.parse(localStorage[file_entry.fullPath]));
		} 
		file_entry.file(function(file) {
			//Generate and cache ID3 tags.
			ID3v2.parseFile(file,function(tags){
				console.log('parsing id3.')
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
		var self = this;

		filer.rm('/storage', function(){
			console.log('successfully deleted storage folder');
		}, self.on_error);
	},

	_playlists: {},

	playlist: function(id) {
		//Check if the playlist id allready exist.
		if (typeof(this._playlists[id]) != 'undefined' && this._playlists[id] !== null) {
			return this._playlists[id];
		}
		//Nope it doesn't lets go ahead and return a brand new one.

		var playlist = {
			_id: id,
			_current_position: 0,
			_list: new Array(),
			id: function() {
				return id;
			},
			selector_for: function(number) {
				return '#' + id + '-' + number;
			},
			element_for: function(number) {
				return $(this.selector_for(number));
			},
			next: function() {
				this._current_position += 1;
				this.play();
				return this._current_position;
			},
			prev: function() {
				this._current_position -= 1;
				this.play();
				return this._current_position;
			},
			random: function() {
				this._current_position = Math.floor(Math.random()*(this._list.length -1));
				this.play();
				return this._current_position;	
			},
			clear: function () {
				this._list = new Array();
				this._current_position = 0;
			},
			push: function(file) {
				this._list.push(file);
				return (this._list.length - 1);
			},
			rewind: function() {
				this._current_position = 0;
				this.play();
				return this._current_position;
			},
			is_current: function(number) {
				return (this._current_position == number) ? true : false;
			},
			current: function() {
				return this._list[this._current_position];
			},
			all: function() {
				return this._list;
			},
			play: function(number) {
				var position = this._current_position;
				if (typeof(number) != 'undefined' && number != null) {
					position = number;
					this._current_position = number;
				}
				if (position == (this._list.length)) {
					if (this.options.replay === true) {
						return this.rewind();
					} else {
						return false;
					}
				}
				media_center.play(this._list[position].toURL());
			}
		}

		this._playlists[id] = playlist;

		return playlist;
	} 
}