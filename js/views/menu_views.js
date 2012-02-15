var MenuView = Backbone.View.extend({
	tagName: 'aside',
	className: 'navbar navbar-fixed-top audioplayer',
	events: {
		//'click .delete': 'destroy',
	}
});

var MenuHeaderView = Backbone.View.extend({
	tagName: 'div',
	className: 'header',
	events: {
	}
};

var MenuContentView = Backbone.View.extend({
	tagName: 'div',
	className: 'content',
	events: {
	}
});

var MenuContentEntryView = Backbone.View.extend({
	tagName: 'li',
	className: 'playlist',
	events: {
		'click': "play",
		//'click .delete': 'destroy',
	},

	initialize: function() {
		this.model.bind('change', function() {
			this.render();
		}, this);
		this.model.bind('destroy', function() {
			this.remove();
		}, this)
	},

	play: function() {
		var model = this.model;
		media_center.set_playlist(this.model);
		media_center.populate_list(this.model, function() {
			model.play();
		});

		$('#main_menu .content li').removeClass('active');
		$(this.el).siblings().removeClass('active');
		$(this.el).addClass('active');
	},

	render: function() {
		var playlist = this.model;
		var list = playlist.get('list');
		$entry = $(this.el);
		$entry.html('<span class="count">' + list.length + '</span>' + playlist.get('name'));
		$entry.attr('id', this.id);
		return this;
	}
});