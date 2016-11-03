/**!
 * Genoverse Angular module implmenting
 * Genoverse http://wtsi-web.github.io/Genoverse/
 * @author  Mike Goodstadt  <mikegoodstadt@gmail.com>
 * @version 0.0.1
 *
 * Module which loads Genoverse as a track
 * install, inject into TADkit.js and then add "browser-genoverse" to Storyboard component list:
 *
 */
(function() {
	'use strict';
	angular
		.module('browsers')
		.factory('GenoverseService', GenoverseService);

	function GenoverseService(ONLINE, $log, $document, $q, $http, $timeout, $rootScope) {

		// example genoverse-config.txt >> TODO: change to json
		var genoverseConfigTxt = "{container:'#browser-genoverse-6',genome:'grch38',chr:13,start:32296945,end:32370557,plugins:['controlPanel','karyotype','trackControls','resizer','focusRegion','fullscreen','tooltips','fileDrop'],tracks:[Genoverse.Track.Scalebar]}";

		function loadConfig(config) {
			var deferred = $q.defer();
			if (!config) {
				var configUrl = "modules/genoverse/genoverse-config.txt";
				$http({
					url : configUrl,
					method : 'GET',
					transformResponse : undefined,
					responseType : 'text'
				})
				.success( function(configText) {
					console.log(configText);
					config = configText;
					$log.debug("Genoverse default config loaded from " + configUrl);
					deferred.resolve(config);
				});
				console.log("Genoverse default config loaded.");
			}
			return deferred.promise;
		}

		return {
			load: function(config) {
				config = config || "";

				$log.log("Genoverse loading...");
				var deferred = $q.defer();

				function loadScriptTags() {
					// Create a script tag with Genoverse as the source.
					// Call our onScriptLoad callback when it has loaded.
					var scriptTag = $document[0].createElement("script");
					scriptTag.type = "text/javascript";
					scriptTag.async = true;
					scriptTag.text = config;
					if (ONLINE) {
						scriptTag.src = 'http://wtsi-web.github.io/Genoverse/js/genoverse.combined.js';
					} else {
						scriptTag.src = 'assets/js/genoverse.combined.js';
					}
					scriptTag.onreadystatechange = function () {
						if (this.readyState == 'complete') {
							onScriptLoad();	
						}
					};
					scriptTag.onload = onScriptLoad();

					var cssReset = $document[0].createElement("link");
					cssReset.rel = "stylesheet";
					cssReset.type = 'text/css';
					cssReset.href = "assets/js/genoverse-reset.css";

					var node = $document[0].getElementsByTagName('body')[0];
					node.appendChild(scriptTag);
					node.appendChild(cssReset);
				}

				function onScriptLoad() {
					$log.log("Genoverse loaded OK!");
					$timeout(function() {
					// $rootScope.$apply(function() {
						deferred.resolve(window.Genoverse);
					});
				}

				loadConfig(config);
				loadScriptTags();
				return deferred.promise;
			}
		};
	}
})();