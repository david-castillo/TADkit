(function() {
	'use strict';
	angular
		.module('TADkit')
		.factory('Cluster', Cluster);

	// constructor for cluster models ensemble
	function Cluster(Color, Settings) {
		return function( data, centroidIndex, overlay, cluster_settings ) {

			var defaults = {
				visible: true,
			};	
			cluster_settings = cluster_settings || {};
			angular.extend(this, angular.copy(defaults), cluster_settings);

			// Convert Data (single Model / set of Particles) to Vector triplets
			var max_radius = 0;
			var overlayColors = Color.colorsFromHex(overlay);

			// Generate Cluster model
			var clusterEnsemble = new THREE.Object3D(); // unmerged network
			var chr_bins;
			var settings = Settings.get();
			var resolution = settings.current.segmentLength*settings.current.particleSegments;
			var i;
			var offset = 0;
			for ( i = 0 ; i < data.length; i++) {
				// var geometry = getModelGeometry(data[i]);
				// geometry.computeBoundingSphere();
				// geometry.center();
				var modelMaterial = new THREE.LineBasicMaterial({
					color: new THREE.Color(parseInt(this.color)),
					opacity: this.modelOpacity,
					transparent: this.transparent,
					linewidth: this.linewidth,
					fog: this.fog
				});
				var centroidMaterial = new THREE.LineBasicMaterial({
					opacity: this.centroidOpacity, 
					transparent: this.transparent,
					linewidth: this.linewidth,
					vertexColors: THREE.VertexColors,
					fog: this.fog
				});
				if (i == centroidIndex) {
					modelMaterial = centroidMaterial;
				}
				offset = 0;
				for (var l = 0 ; l < settings.current.chromosomeIndexes.length; l++) {
					chr_bins = Math.round((settings.current.chromEnd[l]-settings.current.chromStart[l])/resolution)+1;
					// Convert Data to Vector triplets
					var modelComponents = data[i].slice(3*offset,3*(offset+chr_bins));
					var modelGeometry = getModelGeometry(modelComponents);
					modelGeometry.colors = overlayColors;

					var model = new THREE.Line(modelGeometry, modelMaterial);
					model.name = "model-"+settings.current.chromosomeIndexes[l]+"-"+i;
					model.geometry.computeBoundingSphere();
					//model.geometry.center();
					if(model.geometry.boundingSphere.radius>max_radius) max_radius = model.geometry.boundingSphere.radius;
					clusterEnsemble.add(model);
					offset += chr_bins;
				}
				
			}
			//for ( i = 0 ; i < clusterEnsemble.children.length; i++) {
			//	clusterEnsemble.children[i].geometry.center();
			//}
			clusterEnsemble.boundingSphere = clusterEnsemble.children[0].geometry.boundingSphere.clone();
			clusterEnsemble.boundingSphere.radius = max_radius;
			clusterEnsemble.name = "Cluster Ensemble";
			return clusterEnsemble;
		};
	}
	
	function getModelGeometry(components) {
		var offset = 0, vertex,
			 modelGeometry = new THREE.Geometry();

		var totalVertices = components.length;
		while ( offset < totalVertices ) {
			vertex = new THREE.Vector3();
			vertex.x = components[ offset ++ ];
			vertex.y = components[ offset ++ ];
			vertex.z = components[ offset ++ ];
			modelGeometry.vertices.push( vertex );
		}
		//modelGeometry.center();
		return modelGeometry;
	}

})();