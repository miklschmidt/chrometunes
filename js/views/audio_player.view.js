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
		this.model.bind('change', function() {
			this.update_buttons();
		}, this);
		this.model.bind('change:current_song', this.update_song_title, this);
		this.model.bind('destroy', function() {
			this.remove();
		}, this);
		var audio = this.model.get('element');
		audio.bind('ended', function(){
			this.model.next();
			var song = this.model.get('current_song');
			console.log('playback of current song ended, moving on to "' + song.get('artist') + ' - ' + song.get('title') + '"');
		});
		audio.bind('timeupdate', function() {
			this.update_time();
		});
		audio.bind('playing', function() {
			//We started playing, fix buttons.
			this.model.set({is_playing: true});
			this.$('#controls .play').hide();
			this.$('#controls .pause').show();
		});
		audio.bind('pause', function() {
			//We started playing, fix buttons.
			this.model.set({is_playing: false});
			this.$('#controls .play').show();
			this.$('#controls .pause').hide();
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
	}

	seek: function (e) {
		var audio = this.model.get('element');
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
		var song = player.get('current_song');
		var playlist = player.get('current_playlist');
		var audio = player.element;

		var time = audio.currentTime; //time in seconds
		var duration = audio.duration; //duration in seconds
		var progress = time / duration * 100; // progress in percentage
		duration = song.get('duration'); //formatted duration.
		time = (new Date).clearTime()
	        .addSeconds(time)
	        .toString('mm:ss'); // formatted time
	     this.$("#current_duration").text(time + ' / ' + duration);
	     this.$("#progress_bar").css('width', progress + '%');
	},

	update_song_title: function () {
		var song = this.model.get('current_song');
		var text = 'Click a song to start playing';
		if (song) {
			text = song.get('artist') + ' - ' + song.get('title');
		}
		this.$('#currently_playing').text(text);
	}

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
	}

	render: function() {
		$(this.el).html('
				<div class="navbar-inner">
					<div class="container-fluid">
						<a class="brand" href="#">
							<span class="chrome">Chrome</span><span class="tunes">Tunes</span> 
							<span class="version">' + this.model.get('version') + '</span>
						</a>
						<div class="screen bg">
							<div id="current_duration">
								0:00 / 0:00
							</div>
							<div id="currently_playing">
								Click a song to start playing
							</div>
						</div>
					</div>
				</div>
				<div class="navbar-inner bottom">
					<div class="container-fluid">
						<div id="top_player">
							<div id="controls">
								<a href="#" class="prev"><img src="/img/prev.png" /></a>
								<a href="#" class="play"><img src="/img/play.png" /></a>
								<a href="#" class="pause"><img src="/img/pause.png" /></a>
								<a href="#" class="next"><img src="/img/next.png" /></a>
							</div>
							<div id="extras">
								<a href="#" class="shuffle_off"><img src="/img/shuffle_off.png" /></a>
								<a href="#" class="shuffle_on"><img src="/img/shuffle_on.png" /></a>
								<a href="#" class="repeat_off"><img src="/img/repeat_off.png" /></a>
								<a href="#" class="repeat_on"><img src="/img/repeat_on.png" /></a>
							</div>
							<div id="progress">
								<div id="progress_wrapper">
									<div id="progress_background">
									</div>
									<div id="progress_bar">
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="navbar-edge">
				</div>
		');
		this.update_buttons();
		this.update_song_title();
		this.update_time();
		return this;
	}
});