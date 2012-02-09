var SongListEntryView = Backbone.View.extend({
	tagName: 'tr',
	className: 'song',
	events: {
		'click': "play",
		'click .delete': 'destroy',
	},

	initialize: function() {
		this.model.bind('change', function() {
			this.render();
		}, this);
		this.model.bind('destroy', function() {
			this.remove();
		}, this);
	},

	play: function(e) {
		e.preventDefault();
		var playlist = this.options.playlist;
		var $f = $(this.el);
		var number = this.options.number;
		playlist.play(number);
		$f.siblings().removeClass('playing');
		$f.addClass('playing');
	},

	destroy: function(e) {
		e.preventDefault();
		e.stopPropagation();
		var $f = $(this.el);
		var song = $f.data('song');
		if (song.cid === this.options.playlist.get('current_song').cid) {
			this.options.playlist.next();
		}
		$f.data('song').get_file_entry(function(file_entry){
			filer.rm(file_entry, function() {
				$f.remove();
				song.destroy();
			});
		});
	},

	render: function() {
		var song = this.model;
		var playlist = this.options.playlist;
		$song = $(this.el);
		$artist = $('<td>' + song.get('artist') + '</td>');
		$title = $('<td>' + song.get('title') + '</td>');
		$duration = $('<td>' + song.get('duration') + '</td>');
		$album = $('<td>' + song.get('album') + '</td>');
		$genre = $('<td>' + song.get('genre') + '</td>');
		var $del = $('<td><a href="#" class="delete">Delete</a></td>');
		$song.append($artist).append($title).append($duration).append($album).append($genre).append($del);
		$song.data('song', song);

		var id = playlist.get('dom_id');
		var number = song.id;
		$song.data('playlist_id', id)
		$song.data('playlist_number', number);
		$song.attr('id', this.id);
		return this;
	}

});