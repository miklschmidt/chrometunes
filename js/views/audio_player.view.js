var AudioPlayerView = Backbone.View.extend({
	tagName: 'div',
	className: 'navbar navbar-fixed-top audioplayer',
	//TODO: Implement events to list the contents in the list view.
	events: {
		//'click .delete': 'destroy',
		'click #progress_background': 'seek',
		'click #progress_bar': 'seek',
		'click #controls a': 'controls_click',
		'click #extras a': 'extras_click'
	},

	initialize: function() {
		var me = this;
		this.model.bind('change:is_playing change:shuffle change:repeat', function() {
			this.update_buttons();
		}, this);
		this.model.bind('change:current_song', this.update_song_title, this);
		this.model.bind('destroy', function() {
			this.remove();
		}, this);
		var audio = $(this.model.audio);
		audio.bind('ended', function(){
			me.model.next();
			var song = this.model.current_song;
			console.log('playback of current song ended, moving on to "' + song.get('artist') + ' - ' + song.get('title') + '"');
		});
		audio.bind('timeupdate', function() {
			me.update_time();
		});
		audio.bind('playing', function() {
			//We started playing, fix buttons.
			me.model.set({is_playing: true});
			me.$('#controls .play').hide();
			me.$('#controls .pause').show();
		});
		audio.bind('pause', function() {
			//We started playing, fix buttons.
			me.model.set({is_playing: false});
			me.$('#controls .play').show();
			me.$('#controls .pause').hide();
		});
	},

	controls_click: function (e) {
		e.preventDefault();
		var $el = $(e.currentTarget);
		if ($el.hasClass('play')) {
			this.model.play();
		}
		else if ($el.hasClass('pause')) {
			this.model.pause();
		}
		else if ($el.hasClass('next')) {
			this.model.next();
		}
		else if ($el.hasClass('prev')) {
			this.model.prev();
		}
	},

	extras_click: function (e) {
		e.preventDefault();
		var $el = $(e.currentTarget);
		var attributes = {};
		if ($el.hasClass('shuffle_on')) {
			attributes['shuffle'] = true;
		}
		else if ($el.hasClass('shuffle_off')) {
			attributes['shuffle'] = false;
		}
		else if ($el.hasClass('repeat_on')) {
			attributes['repeat'] = true;
		}
		else if ($el.hasClass('repeat_off')) {
			attributes['repeat'] = false;
		}
		this.model.set(attributes);
	},

	seek: function (e) {
		var audio = this.model.audio;
		if (audio.readyState > 3) {
			var bg = this.$('#progress_background');
			var offset = bg.offset();
			var value = e.pageX - offset.left;
			var duration_factor = value/bg.width();
			audio.currentTime = audio.duration * duration_factor;
		}
	},

	update_time: function () {
		var player = this.model;
		var song = player.current_song;
		var playlist = player.current_playlist;
		var audio = player.audio;
		if (song) {
			var time = audio.currentTime; //time in seconds
			var duration = audio.duration; //duration in seconds
			var progress = time / duration * 100; // progress in percentage
			duration = song.get('duration'); //formatted duration.
			time = (new Date).clearTime()
		        .addSeconds(time)
		        .toString('mm:ss'); // formatted time
		     this.$("#current_duration").text(time + ' / ' + duration);
		     this.$("#progress_bar").css('width', progress + '%');
		}
	},

	update_song_title: function () {
		var song = this.model.current_song;
		var text = 'Click a song to start playing';
		if (song) {
			text = song.get('artist') + ' - ' + song.get('title');
		}
		this.$('#currently_playing').text(text);
	},

	update_buttons: function () {
		if (this.model.get('repeat')) {
			this.$('#extras .repeat_off').hide();
			this.$('#extras .repeat_on').show();
		} else {
			this.$('#extras .repeat_off').show();
			this.$('#extras .repeat_on').hide();
		}
		if (this.model.get('shuffle')) {
			this.$('#extras .shuffle_off').hide();
			this.$('#extras .shuffle_on').show();
		} else {
			this.$('#extras .shuffle_off').show();
			this.$('#extras .shuffle_on').hide();
		}
	},

	render: function() {
		$(this.el).html($('#tpl-audioplayer').tmpl(this.model.toJSON()));
		this.update_buttons();
		this.update_song_title();
		this.update_time();
		return this;
	}
});