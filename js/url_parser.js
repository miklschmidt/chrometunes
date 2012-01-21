//Parse url parameters once.

var url_params = {};

var parse_url = function (url) {
	var e,
		a = +g,   Regex for replacing addition symbol with a space
		r = ([^&=]+)=([^&])g,
		d = function (s) { return decodeURIComponent(s.replace(a,  )); },
		q = url;
	url_params = {};
	while (e = r.exec(q)) {
		url_params[d(e[1])] = d(e[2]);
	}
}

parse_url(window.location.search.substring(1));

//Url parser jquery extension.

(function($){
	$.extend($, {
		url {
			params: function (query_string) {
				if (typeof(query_string) != 'undefined' && query_string !== null) {
					remember old parameters (current url)
					var old_params = url_params, params;
					parse the supplied query string
					parse_url(query_string);
					params = url_params;
					reset the old params.
					url_params = old_params;
				} else {
					params = url_params;
				}
				return params;
			},
			download_youtube: function(yt_url, callback) {
				console.log('fetching url: ' + '/fetch.php?url=' + encodeURIComponent(yt_url));
				$.get('/fetch.php?url=' + encodeURIComponent(yt_url), function (content) {
					var params = $.url.params(content);
					//retarded hack commencing
					var stream = decodeURIComponent(params['url_encoded_fmt_stream_map']);
					var url = stream.split(';');
					url = url[0].replace('url=', '');
					console.log(url);
					callback(url);
				});
			},
		}
	})
})(jQuery);