var PlaylistMenuEntryView = Backbone.View.extend({
	tagName: 'div',
	className: 'mediaplayer',
	//TODO: Implement events to list the contents in the list view.
	events: {
		//'click': "play",
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

	update_time: function () {
		var player = $this.model;
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
	     $("#current_duration", this.el).text(time + ' / ' + duration);  
	}


	render: function() {
		var player = $this.model;
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
	     $("#current_duration").text(time + ' / ' + duration);  

		var $media_player = $(this.el).html('
			<div class="navbar navbar-fixed-top">
				<div class="navbar-inner">
					<div class="container-fluid">
						<a class="brand" href="#"><span class="chrome">Chrome</span><span class="tunes">Tunes</span> <span class="version">' + this.model.get('version') + '</span></a>
						<div class="screen bg">
							<div id="current_duration">
								' + time + ' / ' + duration + '
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
			</div>
		').find("#progress_bar").css('width', progress + '%');

		return this;
	}
});