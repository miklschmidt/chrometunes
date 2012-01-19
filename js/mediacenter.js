/*
 *	@author Mikkel Schmidt (mikkel.schmidt@gmail.com)
 *	@dependencies jQuery.js, Filer.js, id3v2.js
 */

var media_center = {

	filer: new Filer(),

	on_error: function () {
		console.log('Error: ' + e.name);
		console.log(e);
	},

	list_files: function () {
		var filer = this.filer;
		var self = this;
		$('#list').html('<ul></ul>');
		filer.ls('/storage', function(entries) {
			for (var x = 0; f = entries[x]; ++x) {
				self.parse_id3(f, function(tags){
					var $file = $('<li>' + tags.Artist + ' - ' + tags.Title + '</li>');
					$('#list ul').append($file);
					$file.data('file', f);
					$file.click(function(){
						var f = $(this).data('file');
						console.log('Now playing: ' + f.name);
		                $("#audio").attr('src', f.toURL());
		                $("#audio")[0].play();
					});
					//TODO: Make downloadable (ie. transferable to user defined folder);
					//var $link = $('<li><a href="" target="_blank">Download song above</a>');
					//$('#list ul').append($link);
				})
			}
		});
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

	initialize: function () {
		var filer = this.filer;
		var self = this;
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

		$('#files').change(function(e) {
			filer.cd('/storage', function(){
				var files = e.target.files;
				for (var i = 0, file; file = files[i]; ++i) {
					//TODO: Implement support for directories. (ie. webkitRelativePath)
					filer.write(file.name, {data: file, type: file.type}, function(fileEntry, fileWriter) {
						//success
						self.list_files();
					}, self.on_error);
				}
			}, self.on_error);
		});
	}
}
