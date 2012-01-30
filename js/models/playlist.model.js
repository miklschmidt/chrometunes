var Playlist = Backbone.Model.extend({
	defaults: {
		name: 'Unnamed Playlist',
		current_position: 0,
		current_song: null,
		list: new SongCollection(),
		dom_id: Math.floor(Math.random()*1000)
	},
	selector_for: function(number) {
		return '#' + this.get('dom_id') + '-' + number;
	},
	element_for: function(number) {
		return $(this.selector_for(number));
	},
	move_to: function (number) {
		var current_position = parseInt(this.get('current_position'), 10);
		if (number == 'next') current_position += 1;
		else if (number == 'prev') current_position -= 1;
		else if (number == 'random') current_position = Math.floor(Math.random()*(this.get('list').length -1));
		else current_position = number;
		this.set({current_position: current_position});
		this.play();
		return current_position;
	},
	next: function() {
		return this.move_to('next');
	},
	prev: function() {
		return this.move_to('prev');
	},
	random: function() {
		return this.move_to('random');	
	},
	clear: function () {

		this.set({list: this.get('list').reset(), current_position: 0});
	},
	push: function(song) {
		var list = this.get('list');
		list.add(song);
		this.set({list: list});
		return (list.length - 1);
	},
	rewind: function() {
		return this.move_to(0);
	},
	is_current: function(number) {
		return (this.get('current_position') == number) ? true : false;
	},
	current: function() {
		return this.get('list').at[this.get('current_position')];
	},
	all: function() {
		return this.get('list').models;
	},
	console_print: function () {
		list = this.get('list');
		var models = list.models;
		for (var model in models) {
			console.log(model + ": " + models[model].get('artist') + ' - ' + models[model].get('album') + ' - ' + models[model].get('track_number') + ' - ' + models[model].get('title'));
		}
	},
	play: function(number) {
		var position = this.get('current_position');
		if (typeof(number) != 'undefined' && number != null) {
			position = number;
			this.set({current_position: number});
		}
		if (position >= (this.get('list').length)) {
			if (media_center.options.repeat === true) {
				return this.rewind();
			} else {
				this.set({current_position: this.get('list').length - 1});
				return false;
			}
		}
		console.log(position);
		var song = this.get('list').models[position];
		this.set({current_song: song});
		media_center.play(song.get('file_url'));
	}
});

var PlaylistCollection = Backbone.Collection.extend({
	model: Playlist
});