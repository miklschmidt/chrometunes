var PlaylistMenuEntryView = Backbone.View.extend({
	tagName: 'li',
	className: 'playlist',
	//TODO: Implement events to list the contents in the list view.
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