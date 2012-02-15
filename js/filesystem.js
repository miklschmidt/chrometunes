var FileSystem = function (megabytes, callback) {

	this.filer = new Filer();
	var ACCEPTED_FILETYPES = ['audio/mp3', 'audio/ogg'];

	this.initialize(megabytes, callback);

	this.on_error = function () {
		console.log('FileSystem Error: "' + e.name + '".');
		console.log(e);
	}

	this.initialize = function (megabytes, callback) {
		//Initialize 1gb of space as default.
		var me = this;
		if (!megabytes) {
			megabytes = 1024;
		} 
		window.webkitStorageInfo.requestQuota(PERSISTENT, megabytes * 1024 * 1024, function(grantedBytes) {
			me.filer.init({persistent: true, size: grantedBytes}, function(fs) { 
				//success
				me.filer.mkdir('/storage', true, function(){ 
					console.log('directory "storage" was created');
					if (typeof(callback) == 'function') {
						callback(grantedBytes);
					}
				}, function () {
					console.log('directory "storage" already exists');		
				});
			}, media_center.on_error);
		}, media_center.on_error);
	};

	this.get_all_songs = function (callback) {
		var final_songs = [];
		var total_entries = 0;
		var parse_count = 0;
		var set_timeout = function() {
			setTimeout(check_progress, 50);
		}
		var check_progress = function() {
			if (parse_count >= total_entries) {
				if (typeof(callback) == 'function') {
					callback(final_songs);
				}
			} else {
				//TODO: Make progress widget.
				//make a new timeout.
				set_timeout();
			}
		}
		this.filer.ls('/storage', function(entries) {
			//This fails if we somehow managed to write a directory as a file.
			for (var x = 0; f = entries[x]; ++x) {
				if (!f.isDirectory) {
					total_entries++;
					var song = new Song({file_url: f.toURL()});
					song.bind('file_parsed', function(){
						parse_count++;
					});
					final_songs.push(song);
				}
			}
			if (total_entries > 0) {
				set_timeout();
			}
		});
	};

	this.write_files = function (files) {
		var me = this;
		var file_count = files.length;
		var files_processed = 0;
		var files_written = 0;
		var final_file_entries = [];
		var set_timeout = function() {
			setTimeout(check_progress, 50);
		}
		var check_progress = function() {
			if (files_processed == files.length) {
				if (typeof(callback) == 'function') {
					callback(final_file_entries);
				}
			} else {
				//TODO: Make progress widget.
				//make a new timeout.
				set_timeout();
			}
		}

		if (file_count > 0) {
			set_timeout();
		}
		me.filer.cd('/storage', function(){
			for (var i = 0, file; file = files[i]; ++i) {
				if (_.indexOf(ACCEPTED_FILETYPES, file.type) > -1) {
					me.filer.write(file.name, {data: file, type: file.type}, function(fileEntry, fileWriter) {
						//success
						final_file_entries.push(fileEntry);
						files_processed++;
						files_written++;
					}, function(e) {
						//error
						console.log('FileSystem Error: "' + e.name + '". The file "' + file.name + '" could not be written to filesystem.');
						console.log(e);
						files_processed++;
					});
				} else {
					//Rejected filetype
					files_processed++;
				}
			}
		}, me.on_error);
	};

	this.delete_media_storage = function () {
		var me = this;

		me.filer.rm('/storage', function(){
			console.log('successfully deleted storage folder');
		}, me.on_error);
	};

	this.get_usage_info = function (callback) {
		// Callback arguments are (used, remaining)
		window.webkitStorageInfo.queryUsageAndQuota(webkitStorageInfo.PERSISTENT, //the type can be either TEMPORARY or PERSISTENT
			callback, function(e) {
			  console.log('Error: ', e); 
			} 
		);
	}

};