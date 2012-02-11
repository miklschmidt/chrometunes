var PlaylistDB = {
    id:"playlist_db",
    description:"Database for playlists",
    migrations:[
        {
            version: 1,
            migrate: function (transaction, next) {
                var store = transaction.db.createObjectStore("playlists");
                store.createIndex("name_idx", "name", {
                    unique:false
                });
                store.createIndex("dom_id_idx", "dom_id", {
                    unique:true
                });
                next();
            }
        }
    ]
};

var Playlist = Backbone.Model.extend({
	database: PlaylistDB,
	storeName: "playlists",
	defaults: {
		name: 'Unnamed Playlist',
		current_position: 0,
		current_song: null,
		list: null,
		dom_id: Math.floor(Math.random()*1000)
	},
	initialize: function () {
		this.set({list: new SongCollection()});
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
		var song = this.get('list').models[position];
		show_notification(song.get('artist') + ' - ' + song.get('title'));
		media_center.play(song.get('file_url'));
		this.set({current_song: song});
		this.element_for(position).addClass('playing').siblings().removeClass('playing');
	},
	reset_collection: function() {
		var models = this.all;
		this.get('list').reset();
		return (models);
	},
});

var PlaylistCollection = Backbone.Collection.extend({
	database: PlaylistDB,
	storeName: "playlists",
	model: Playlist,
	comparator: function () {
		return this.get('name');
	}
});