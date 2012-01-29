var SongView = Backbone.View.extend({
	tagName: 'li',
	className: 'song',
	events: {
		'click': "play",
		'click .delete': 'destroy',
	},

	initialize: function() {
		this.model.bind('change', function() {
			this.render();
		}, this)
	},

	play: function() {
		var playlist = this.options.playlist;
		var $f = $(this.el);
		var number = this.options.number;
		playlist.play(number);
		$f.siblings().removeClass('playing');
		$f.addClass('playing');
	},

	destroy: function() {
		var $f = $(this.el);
		$f.data('song').get_file_entry(function(file_entry){
			filer.rm(file_entry, function() {
				this.remove();
			});
		});
	},

	render: function() {
		var song = this.model;
		var playlist = this.options.playlist;
		$song = $(this.el);
		$song.text(song.get('artist') + ' - ' + song.get('album') + ' - ' + song.get('title'));
		
		$song.data('song', song);

		var id = playlist.get('dom_id');
		var number = song.id;
		$song.data('playlist_id', id)
		$song.data('playlist_number', number);
		$song.attr('id', this.id);

		var $del = $('<a href="#" class="delete">Delete</a>');
		$song.append($del);
		return this;
	}

});