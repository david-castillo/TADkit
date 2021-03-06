(function() {
	'use strict';
	angular
		.module('TADkit')
		.controller('PanelIgvjsControllerBeta', PanelIgvjsControllerBeta);

	function PanelIgvjsControllerBeta($scope, $window, $timeout, $mdDialog, Overlays, Storyboards, ColorConvert, uuid4, Track_data, d3Service, Datasets, Users, Settings) {

		$scope.showInfo = function(info) {
			$mdDialog.show({
			      parent: angular.element(document.body),
			      template: '<md-dialog md-theme="default" aria-label="Information">' +
			        '  <md-dialog-content class="md-default-theme">' + info +
			        '<div class="md-actions"><md-button ng-click="closeDialog();" class="md-primary md-button md-default-theme"><span class="ng-binding ng-scope">Close</span></md-button></div>' +
			        '  </md-dialog-content>' +
			        '</md-dialog>',
			      locals: {

			      },
			      controller: DialogController
			    });
		};

		function DialogController($scope, $mdDialog) {
			$scope.closeDialog = function() {
			  $mdDialog.hide();
			};
		}
		
		if(angular.isUndefined($scope.settings.current.speciesUrl) || angular.isUndefined($scope.view.settings.species_data[$scope.settings.current.speciesUrl])) {
			$scope.settings.current.speciesUrl = Datasets.setSpeciesUrl();
			if(angular.isUndefined($scope.settings.current.speciesUrl) || angular.isUndefined($scope.view.settings.species_data[$scope.settings.current.speciesUrl])) {
				var output = '<div class="component-caption" layout="column" layout-align="left center">No species specified in the dataset</div>'; 
				$timeout(function() {$scope.showInfo(output);});
				return;
			}
		}

		var scene_component = Storyboards.getComponentById('Chromatin');
		var scene_width = 0;
		if(typeof scene_component !== 'undefined') {
			scene_width = parseInt(scene_component.object.state.width);
		} else {
			var inspector_component = Storyboards.getComponentById('Inspector');
			var inspector_width = 0;
			if(typeof inspector_component !== 'undefined') {
				inspector_width = parseInt(inspector_component.object.state.width);
			}
			scene_width = inspector_width;
		}
		$scope.width = $scope.state.width = $window.innerWidth - scene_width - 50 - 2*parseInt($scope.state.margin);
		$scope.height = $scope.state.height =  parseInt($scope.state.height)-2*parseInt($scope.state.margin); // strip PX units
		
		//$scope.width = $scope.state.width; // strip PX units
		//$scope.height = $scope.state.height; // strip PX units
		$scope.$watch('settings.views.scene_width', function( newValue, oldValue ) {
			if ( newValue !== oldValue ) {
				// playback.autoRotate = !playback.autoRotate;
				$scope.width = $scope.state.width = $window.innerWidth - newValue - 50 - 2*parseInt($scope.state.margin);
				//$scope.myIgv.repaint();
				$scope.myIgv.resize();
//		  		$scope.myIgv.genomicStateList.forEach(function (genomicState) {
//            		$scope.myIgv.updateWithLocusIndex( genomicState );
//        		});
			}
		});
		var w = angular.element($window);
		$scope.$watch(
		  function () {
		    return $window.innerWidth;
		  },
		  function (value) {
		    $scope.width = $scope.state.width = value - scene_width - 50 - 2*parseInt($scope.state.margin);
		  	//$scope.$apply();
		  },
		  true
		);
		
		var originalOverlay = Overlays.getCurrentIndex();
		var track_data = Track_data.get();
		var resolution = $scope.settings.current.segmentLength*$scope.settings.current.particleSegments;
		var igvjs_start = (($scope.settings.current.chromStart[$scope.settings.current.chromIdx])-1*resolution);
		if(igvjs_start<0) igvjs_start = 0;
		var chrom = ($scope.settings.current.chrom);
		if(!$scope.view.settings.leading_chr) chrom = ($scope.settings.current.chrom).replace('chr','');
		
		/*
		Configuration of igvjs object

		$scope.view.settings.species_data: configuration array containing the location of the reference genome. 
			It can be a file or url where the browser will fetch the data.
		$scope.view.settings.showNav: true/false whether to show the navigation panel in igvjs 
		$scope.view.settings.showCyto: true/false wheter to show cytoband panel in igvjs
		*/
		if(typeof $scope.settings.current.assemblyUrl === 'undefined' || typeof $scope.view.settings.species_data[$scope.settings.current.speciesUrl][$scope.settings.current.assemblyUrl] === 'undefined') {
			$scope.settings.current.assemblyUrl = Object.keys($scope.view.settings.species_data[$scope.settings.current.speciesUrl])[0]; 
		}
			
		var igv_reference;
		if($scope.view.settings.species_data[$scope.settings.current.speciesUrl][$scope.settings.current.assemblyUrl].fastaURL) {
			igv_reference = {
				id: $scope.view.settings.species_data[$scope.settings.current.speciesUrl][$scope.settings.current.assemblyUrl].id,
				fastaURL:$scope.view.settings.species_data[$scope.settings.current.speciesUrl][$scope.settings.current.assemblyUrl].fastaURL,
				cytobandURL:null
			};
			$scope.view.settings.showNav = true;
			if($scope.view.settings.species_data[$scope.settings.current.speciesUrl][$scope.settings.current.assemblyUrl].cytobandURL) {
				igv_reference.cytobandURL = $scope.view.settings.species_data[$scope.settings.current.speciesUrl][$scope.settings.current.assemblyUrl].cytobandURL;
				$scope.view.settings.showCyto = false;
			} else {
				$scope.view.settings.showCyto = false;
			}
		} else {
			igv_reference = {
				id: $scope.settings.current.speciesUrl
			};
			$scope.view.settings.showNav = true;
		}
		$scope.settings.current.tracks = Users.getTracks();
		if($scope.view.settings.species_data[$scope.settings.current.speciesUrl][$scope.settings.current.assemblyUrl].tracks) {
			$scope.settings.current.tracks = $scope.settings.current.tracks.concat($scope.view.settings.species_data[$scope.settings.current.speciesUrl][$scope.settings.current.assemblyUrl].tracks);
		}
		
		
		/* 
		div dom element where to include igvjs browser
		*/
		$scope.igvDiv = angular.element(document.querySelector('#igvDiv'))[0];
		/* 
		igvjs options. See igvjs docs for details
		*/
		$scope.igvOptions = {
		            showNavigation: $scope.view.settings.showNav,
		            showRuler: true,
		            showIdeogram: $scope.view.settings.showCyto,
		            showKaryo: $scope.view.settings.showCyto,
		            flanking: 100000,
		            reference: igv_reference,
					locus: chrom+':'+igvjs_start+'-'+($scope.settings.current.chromEnd[$scope.settings.current.chromIdx]),
					tracks: $scope.settings.current.tracks.slice()
		        };
			
		$scope.updatePosition =  function(position, leftborder, rightborder) {
			//console.log(position);
			var span_region = 0;
			var resolution = $scope.settings.current.segmentLength*$scope.settings.current.particleSegments;
			for(var i = 0; i<$scope.settings.current.chromosomeIndexes.length;i++) {
				span_region += $scope.settings.current.chromEnd[i] - $scope.settings.current.chromStart[i];			
			}
			span_region += $scope.settings.current.chromStart[0];
			if(position >= $scope.settings.current.chromStart[$scope.settings.current.chromIdx] && position <= span_region) {
				$scope.settings.current.position = position;
			}
			if(position < $scope.settings.current.chromStart[$scope.settings.current.chromIdx]) {
				$scope.settings.current.position = $scope.settings.current.chromStart[$scope.settings.current.chromIdx];
			}  
			if(position > span_region) {
				$scope.settings.current.position = span_region;
			}
			if($scope.settings.current.leftborder != leftborder || $scope.settings.current.rightborder != rightborder) {
				$scope.settings.current.leftborder = leftborder;
				$scope.settings.current.rightborder = rightborder;
			}
			$scope.hideTadkitMarkers();
			$scope.updateTadkitTAD();
			
			$timeout(function() {$scope.$apply();});
		};
		$scope.applyOverlay =  function(track,features,track_color) {
			var self = this;
			var overlays = Overlays.get();
			for(var i=0;i<overlays.loaded.length;i++) {
				if (overlays.loaded[i].object.title === track) {
					$scope.toggleOverlay(overlays.loaded[i].object.state.index);
					return true;
				}
			}
			
			var igvJsOverlay =
							{
								"metadata": {
									"version" : 1.0,
									"type" : "overlay",
									"generator" : "TADkit"
								},
								"object" : {
									"uuid" : uuid4.generate(),
									"id" : overlays.loaded.length,
									"title" : track,
									"source" : "igvJs track",
									"url" : "local",
									"description" : "igvJs track overlay", 
									"type" : "igvJs",
									"format" : "variable",
									"components" : 2,
									"name" : track,
									"state" : {
										"index" : 0, // make real index???
										"overlaid" : false
									}
								},
								"palette" : [],
								"data" : [],
								"colors" : {
									"particles" : [],
									"chromatin" : [],
									"network" : {
										"RGB" : [],
										"alpha" : []
									}
								}
							};
			var totallength;
			var k, max_val, min_val;
			var j = 0;
			var l = 0;
			
			for(k=0;k<$scope.settings.current.segmentsCount;k++) {
				igvJsOverlay.colors.chromatin[k] = "gray";
			}

			var featureColor = [];
			var scored_color = false;
			var motifcolor;
			var feature;
			var nbrmotif;
			var tmpfeature = [];
			angular.forEach(features, function(feature) {
				if(typeof feature.color == 'undefined') {
					if(typeof feature.score !== 'undefined') featureColor.push(feature.score);
					if(typeof feature.value !== 'undefined') featureColor.push(feature.value);
					scored_color = true;
				} else {
					featureColor.push(feature.color);
				}
			});
			if(scored_color) {
				var hexEnd = '#0000ff';
				var hexStart = '#ffffff';
				if(typeof track_color !== 'undefined') {
					//hexStart = ColorConvert.rgbToHex(ColorConvert.shadeRGBColor(track_color,-0.5));
					hexEnd = ColorConvert.rgbToHex(track_color);
				}
				var first_start = 0;
				var n = 0;
				l = 0;
				while(n<featureColor.length) {
					totallength = 0;
					motifcolor = 0;
					nbrmotif = 0;
					first_start = features[n].start;
					while(totallength < 1 && n < featureColor.length) {
						feature = features[n];
						totallength = (feature.end - first_start)/$scope.settings.current.segmentLength;
						motifcolor = motifcolor + parseFloat(featureColor[n]);
						nbrmotif++;
						n++;
					}
					tmpfeature.push(motifcolor);
				}
				max_val = Math.max.apply(Math, tmpfeature);
				min_val = Math.min.apply(Math, tmpfeature);
				
				n = 0;
				l = 0;
				while(n<featureColor.length) {
					totallength = 0;
					motifcolor = 0;
					first_start = features[n].start;
					while(totallength < 1 && n < featureColor.length) {
						feature = features[n];
						totallength = (feature.end - first_start)/$scope.settings.current.segmentLength;
						motifcolor = motifcolor + parseFloat(featureColor[n]);
						n++;
					}
					featureColor[l] = d3.interpolateHcl(hexStart, hexEnd)((motifcolor-min_val)/(max_val-min_val));
					j = Math.round((first_start - $scope.settings.current.chromStart[$scope.settings.current.chromIdx])/$scope.settings.current.segmentLength);
					for(k=j;k<(j+Math.round(totallength)) && k<$scope.settings.current.segmentsCount;k++) {
						igvJsOverlay.colors.chromatin[k] = featureColor[l];
					}
					l++;
				}
			} else {
				angular.forEach(features, function(feature) {
					j = Math.round((feature.start - $scope.settings.current.chromStart[$scope.settings.current.chromIdx])/$scope.settings.current.segmentLength);
					totallength = Math.round((feature.end - feature.start)/$scope.settings.current.segmentLength);
					for(k=j;k<(j+totallength) && k<$scope.settings.current.segmentsCount;k++) {
						igvJsOverlay.colors.chromatin[k] = featureColor[l];
					}
					l++;
				});
			}
			var newOverlay = Overlays.addDirect(igvJsOverlay);
			var overlay = overlays.loaded[newOverlay];
			
			overlay.colors.particles = [];
			//overlay.colors.network.RGB = Networks.linePiecesRGB(overlay, $scope.settings.current.edgesCount);
			//overlay.colors.network.alpha = Networks.linePiecesAlpha(overlay, $scope.settings.current.edgesCount);
			overlay.colors.network.RGB = [];
			overlay.colors.network.alpha = [];
			$scope.toggleOverlay(newOverlay);
			//Overlays.setOverlaid(newOverlay);
			//Overlays.set(newOverlay);
			//$scope.currentoverlay = Overlays.set(newOverlay);
		};
		$scope.toggleOverlay = function(index) {
			$scope.overlaid = Overlays.getOverlay(index).object.state.overlaid;
			if (!$scope.overlaid) {
				Overlays.setOverlaid(index);
				Overlays.set(index);
				$scope.currentoverlay = Overlays.getOverlay();
			} else {
				Overlays.setOverlaid(originalOverlay);
				Overlays.set(originalOverlay);
				$scope.currentoverlay = Overlays.getOverlay();
			}
			//$scope.$apply($scope.currentoverlay.colors.chromatin);
			//$scope.toggleColor($scope.currentoverlay.colors.chromatin);
			$scope.toggleColor($scope.currentoverlay);
			// $scope.overlay.object.state.overlaid = !$scope.overlay.object.state.overlaid;
		};
		$scope.removeOverlay =  function(track) {
			var overlays = Overlays.get();
			angular.forEach(overlays.loaded, function(overlay) {
				if (overlay.object.title === track) {
					$scope.toggleOverlay(overlay.object.state.index);
				}

			});
		};
		/* 
		Creation of igvjs javascript object
		*/
		$scope.myIgv = igv.createBrowser($scope.igvDiv, $scope.igvOptions);
		
		// Disable search input
		//$scope.myIgv.$searchInput.off('change');
        
		// Hide search icon
		//var search_icon = angular.element(document.querySelector('.igv-search-container'))[0];
		//$(search_icon).hide();
		// Show center guide by default. The centerguide will be tadkit position in the 2D and 3D
		$scope.myIgv.centerGuide.$centerGuideToggle.click();
		
		
		/*
		Create div indicating selected tad in the browser.
		#tad-highlight-tadkit should be styled in the main css
		*/
		var d = angular.element("<div id=\"tad-highlight-tadkit\" style=\"width='0px;';display=none;\"></div>");
		var trackContainer = angular.element($scope.myIgv.trackContainerDiv);
		trackContainer.append(d);
		
		var dl = angular.element("<div id=\"trackbar-tadkit-left-mark\" style=\"display=none\"></div>");
		trackContainer.append(dl);
		var dr = angular.element("<div id=\"trackbar-tadkit-right-mark\" style=\"display=none\"></div>");
		trackContainer.append(dr);
		
		/*
		Main function moving and resizing the #tad-highlight-tadkit depending on the current tad
		*/
		$scope.updateTadkitTAD = function() {
        	if(typeof($scope.settings.current.tad_selected) != 'undefined' && $scope.settings.current.tad_selected!=-1) {
        		/* Look for the referenceFrame of the reference sequence.
        		referenceFrame contains:
        			start: the genomic position corresponding to the left border of the browser
        			bpPerPixel: corresponding base pairs per 1 pixel
        		*/
        		var genomicState = _.first($scope.myIgv.genomicStateList);
            	var referenceFrame = genomicState.referenceFrame;
        		// Compute left position and width of the #tad-highlight-tadkit
        		if(typeof(referenceFrame) != 'undefined') {
	            	//trackPane.style.backgroundColor = "rgba(0,0,0,0.05)";
	            	var start_tad = $scope.data.tad_data.tads[$scope.settings.current.tad_selected][1];
	            	var end_tad = $scope.data.tad_data.tads[$scope.settings.current.tad_selected][2];
	            	
	            	var leftpos = Math.round((start_tad-referenceFrame.start)/referenceFrame.bpPerPixel);
	                d.css("left",Math.floor(leftpos+50) + "px");
	                var rightpos = Math.round((end_tad-referenceFrame.start)/referenceFrame.bpPerPixel);
	                d.css("width",Math.floor(rightpos-leftpos) + "px");
	                d.css("display","block");
        		}
        		
                
            } else {
            	//trackPane.style.backgroundColor = "";
            	d.css("width","0px");
            	d.css("display","none");
            	
            }
        };

        $scope.myIgv.zoomHandlers = {
                in: {
                    click: function (e) {
                        $scope.myIgv.zoomIn();
                    }
                },
                out:{
                    click: function (e) {
                        $scope.myIgv.zoomOut();
                    }
                }
            };
        
        $scope.synchronizeViewports = function() {

        	var genomicState,
        		mainGenomicState,
        		offset,
	            viewportWidth,
	            referenceFrame,
	            resolution,
	            start,
	            end,
	            second_loci;
	    	
        	resolution = $scope.settings.current.segmentLength*$scope.settings.current.particleSegments;
        	mainGenomicState = $scope.myIgv.genomicStateList[0];
        	viewportWidth = igv.browser.viewportContainerWidth()/$scope.myIgv.genomicStateList.length;
        	offset = (mainGenomicState.referenceFrame.bpPerPixel * viewportWidth) + mainGenomicState.referenceFrame.start;
        	offset -= ($scope.settings.current.chromEnd[0]-$scope.settings.current.chromStart[0]);
        	
        	second_loci=0;
        	if($scope.settings.current.chromosomeIndexes.length>1) second_loci=1;
        	
        	genomicState = $scope.myIgv.genomicStateList[1];
	    	referenceFrame = genomicState.referenceFrame;
        
    		referenceFrame.bpPerPixel = mainGenomicState.referenceFrame.bpPerPixel;
    		start = ($scope.settings.current.chromStart[second_loci]-1*resolution + offset);
    		start = Math.max(0, start);
    		referenceFrame.start = start;

	    	for(var t=0;t<$scope.myIgv.trackViews.length;t++) {
    			//$scope.myIgv.trackViews[t].update();
	    		$scope.myIgv.trackViews[t].updateViews();
    		}
	    	//$scope.myIgv.update();
        };
        
//        $scope.$watch('settings.current.igv_position.x', function(newPos, oldPos) {
//            if(!angular.equals(newPos, oldPos)) {
//            	//$scope.myIgv.goto(($scope.settings.current.chrom),newPos);
//            	if ($scope.myIgv.loadInProgress()) {
//                    return;
//                }
//            	$scope.moveViewport(0,$scope.settings.current.leftborder-newPos);
//            	if($scope.myIgv.genomicStateList[0].locusCount>1) $scope.moveViewport(1,$scope.settings.current.leftborder-newPos);
//            }
//        });
        
        $scope.moveViewport = function(locusIndex,offset) {
        	
        	var genomicState = $scope.myIgv.genomicStateList[locusIndex];
        	var referenceFrame = genomicState.referenceFrame;
        	var viewportWidth = igv.browser.viewportContainerWidth()/$scope.myIgv.genomicStateList.length;
        	// clamp left
            referenceFrame.start = Math.max(0, referenceFrame.start);

            // clamp right
            var chromosome = $scope.myIgv.genome.getChromosome(referenceFrame.chrName);
            var maxEnd = chromosome.bpLength;
            var maxStart = maxEnd - viewportWidth * referenceFrame.bpPerPixel;

            if (referenceFrame.start > maxStart) {
                //referenceFrame.start = maxStart;
            	chromosome.bpLength += referenceFrame.start - maxStart;
            }
            
            referenceFrame.shiftPixels(offset);

        	$scope.myIgv.updateLocusSearchWithGenomicState($scope.myIgv.genomicStateList[locusIndex]);

            //$scope.myIgv.repaint();
        	$scope.myIgv.repaintWithLocusIndex(locusIndex);
        	
        	$scope.myIgv.fireEvent('trackdrag');
        
        };    
        
        $scope.settings.current.igvloading = $scope.myIgv.loadInProgress();
        
        $scope.setIgvTracks = function() {
        	var start0, start1, end2, y;
        	start0 = Math.max(0,Math.round($scope.settings.current.igv_position.start0));
        	start1 = Math.max(0,Math.round($scope.settings.current.igv_position.start1));
        	end2 = Math.round($scope.settings.current.igv_position.end2);
        	y = Math.round($scope.settings.current.igv_position.y);
        	
        	if ($scope.myIgv.loadInProgress()) {
                return;
            }
        	
        	var genomicState,
        		mainGenomicState,
        		offset,
	            viewportWidth,
	            referenceFrame,
	            resolution,
	            start,
	            end,
	            span_region;
	    	
        	
        	var igvjs_go = [];
			resolution = $scope.settings.current.segmentLength*$scope.settings.current.particleSegments;
			mainGenomicState = $scope.myIgv.genomicStateList[0];
			viewportWidth = igv.browser.viewportContainerWidth();
        	span_region = Math.round((mainGenomicState.referenceFrame.bpPerPixel * viewportWidth));
        	
        	if($scope.settings.current.chromosomeIndexes.length == 2) return;
        	
        	igvjs_go.push($scope.settings.current.chromosomeIndexes[0]);
        	if(!$scope.view.settings.leading_chr) igvjs_go[0] = igvjs_go[0].replace('chr','');
        	
        	if($scope.myIgv.genomicStateList.length>1) {
				if(y <= 0) {
					igvjs_go[0] += ':' + mainGenomicState.referenceFrame.start + '-' + (mainGenomicState.referenceFrame.start+Math.round(span_region));
					//$scope.myIgv.parseSearchInput(igvjs_go.join(' '));
					$scope.myIgv.search(igvjs_go.join(' '));
					angular.element($scope.myIgv.trackContainerDiv).css("pointer-events","initial");
					return;
				}
				//$scope.moveViewport(0,x);
				//$scope.moveViewport(1,-x);
			}
			if(y > 0 && $scope.settings.current.chromosomeIndexes.length < 2)  {
				
				//igvjs_go[0] += ':' + (mainGenomicState.referenceFrame.start-Math.round(mainGenomicState.referenceFrame.bpPerPixel*newPos)) + '-' + (mainGenomicState.referenceFrame.start-Math.round(mainGenomicState.referenceFrame.bpPerPixel*newPos)+Math.round(span_region/2));
				start = Math.round(start1+50*mainGenomicState.referenceFrame.bpPerPixel);
				end = Math.round(start1+50*mainGenomicState.referenceFrame.bpPerPixel+span_region/2);
				
				var chromosome = $scope.myIgv.genome.getChromosome(mainGenomicState.referenceFrame.chrName);
	            var maxEnd = chromosome.bpLength;
	            var maxStart = maxEnd - viewportWidth * mainGenomicState.referenceFrame.bpPerPixel;

	            if (start > maxStart) {
	                //referenceFrame.start = maxStart;
	            	chromosome.bpLength += start - maxStart;
	            }
	            //mainGenomicState.referenceFrame.start = Math.max(0,(x-start - (x-mainGenomicState.referenceFrame.start));
				igvjs_go[0] += ':' + (start) + '-' + (end);
				
				
				igvjs_go.push($scope.settings.current.chromosomeIndexes[0]);
				if(!$scope.view.settings.leading_chr) igvjs_go[1] = igvjs_go[1].replace('chr','');
				//igvjs_go[1] += ':' + (mainGenomicState.referenceFrame.start+Math.round(mainGenomicState.referenceFrame.bpPerPixel*newPos)) + '-' + (mainGenomicState.referenceFrame.start+Math.round(mainGenomicState.referenceFrame.bpPerPixel*newPos)+Math.round(span_region));
				start = Math.round(end2-75*mainGenomicState.referenceFrame.bpPerPixel-span_region/2);
				end = Math.round(end2-75*mainGenomicState.referenceFrame.bpPerPixel);
				igvjs_go[1] += ':' + (start) + '-' + (end);
				
				//$scope.myIgv.parseSearchInput(igvjs_go.join(' '));
				$scope.myIgv.search(igvjs_go.join(' '));
				$scope.hideIgvLabels(true);
				angular.element($scope.myIgv.trackContainerDiv).css("pointer-events","none");
				//$scope.moveViewport(1,-x);
				//offset = (x- mainGenomicState.referenceFrame.start)/mainGenomicState.referenceFrame.bpPerPixel;
	            //$scope.moveViewport(0,-offset);
			} else {
				offset = (start1 - start0)/mainGenomicState.referenceFrame.bpPerPixel;
	            $scope.moveViewport(0,offset);
			}
        };
        
        $scope.$watch('settings.current.igv_position.flag', function(newPos, oldPos) {
            if(!angular.equals(newPos, oldPos)) {
            	$scope.setIgvTracks();
            }    
        });
        
        $scope.$watch('settings.current.tracks', function(newTracks, oldTracks) {
            if(newTracks != oldTracks) {
            	$scope.myIgv.loadTrack(newTracks[newTracks.length-1]);
            	$scope.updateFeaturesList();
            }    
        });

        $scope.hideIgvLabels = function(label) {
        	var igvExtraDivs;
	    	var d;
	    	var txts = [];
	    	var parents = [];
	    	igvExtraDivs = document.getElementsByClassName('igv-viewport-content-ruler-div');

	    	for(d = 0; d<igvExtraDivs.length;d++) {
	    		txts.push(igvExtraDivs[d].innerHTML);
	    		parents.push(angular.element(igvExtraDivs[d]).parent());
	    		(igvExtraDivs[d]).style.display = "none";
	    	
	    	}
	    	if(label) {
		    	for(d = 0; d<txts.length;d++) {
		    		angular.element(igvExtraDivs[d]).remove();
		    		var newEle = angular.element("<div class='igv-viewport-content-ruler-div'>"+txts[d]+"</div>");
				    angular.element(parents[d]).append(newEle);
		    	}
	    	}
	    	igvExtraDivs = document.getElementsByClassName('igv-viewport-fa-close');
	    	for(d = 0; d<igvExtraDivs.length;d++) {
	    		(igvExtraDivs[d]).style.display = "none";
	    	}
        };
        
        $scope.$watch('settings.current.chromosomeIndexes', function( newValue, oldValue ) {
			if ( newValue !== oldValue ) {
				
				var igvjs_go = [];
				var resolution = $scope.settings.current.segmentLength*$scope.settings.current.particleSegments;
				var span_region = $scope.settings.current.particlesCount*resolution;
				//var offset = 0;
				igvjs_go.push($scope.settings.current.chromosomeIndexes[0]);
				if(!$scope.view.settings.leading_chr) igvjs_go[0] = igvjs_go[0].replace('chr','');
				
				if($scope.settings.current.chromosomeIndexes.length!=2) { 
					igvjs_go[0] += ':' + ($scope.settings.current.chromStart[0]) + '-' + ($scope.settings.current.chromStart[0]+span_region);
					
			    } else {
			    	span_region = $scope.settings.current.chromEnd[0]-$scope.settings.current.chromStart[0];
			    	igvjs_go[0] += ':' + ($scope.settings.current.chromStart[0]) + '-' + ($scope.settings.current.chromStart[0]+span_region);
					
					igvjs_go.push($scope.settings.current.chromosomeIndexes[1]);
					if(!$scope.view.settings.leading_chr) igvjs_go[1] = igvjs_go[1].replace('chr','');
					igvjs_go[1] += ':' + ($scope.settings.current.chromStart[1]) + '-' + ($scope.settings.current.chromStart[1]+span_region);
					
				}
				
				//$scope.myIgv.parseSearchInput(igvjs_go.join(' '));
				$scope.myIgv.search(igvjs_go.join(' '));
				$scope.hideIgvLabels(true);
		    	Track_data.clear();
		    	$scope.updateFeaturesList();
		    	

            }    
        });            
        /*
         markers_position gets updated when we click on the 2D panel with the genomic positions that are interacting in the
         clicked position.
         Listen for left and right markers positions and then move them to the genomic position in the browser.
         */
        $scope.$watch('settings.current.markers_position', function( newValue, oldValue ) {
			if ( newValue !== oldValue) {
				if ( angular.isUndefined($scope.settings.current.markers_position) || newValue[0] === -1 || newValue[1] === -1) {
					$scope.hideTadkitMarkers();
	        	} else {
	        		if($scope.settings.current.chromosomeIndexes.length===2) $scope.synchronizeViewports();
	        		if($scope.settings.current.chromosomeIndexes.length > 2) return; 
	        		$scope.updateTadkitMarkers(newValue,$scope.settings.current.markers_chr);
	        		
	        	}
			}
		});
		$scope.$watch('myIgv.trackViews.length', function( newValue, oldValue ) {
			if ( newValue !== oldValue) {
				$scope.updateFeaturesList();  
			}
		});

        $scope.hideTadkitMarkers = function() {
        	dr.css("display","none");
        	dl.css("display","none");
        	$scope.settings.current.markers_position = undefined;
        };
        $scope.updateTadkitMarkers = function(markerspos,markerschrom) {

        	$scope.updateFeaturesList();

        	var genomicState = _.first($scope.myIgv.genomicStateList);
        	var referenceFrame = genomicState.referenceFrame;
        	var viewportWidth = igv.browser.viewportContainerWidth()/$scope.myIgv.genomicStateList.length;
        	var resolution = $scope.settings.current.segmentLength*$scope.settings.current.particleSegments;
        	var offset = 0;
        	if($scope.settings.current.chromosomeIndexes.length == 2 && markerschrom[1] != $scope.settings.current.chromosomeIndexes[0]) {
        		offset = referenceFrame.bpPerPixel*Math.floor($scope.myIgv.viewportContainerWidth()/$scope.myIgv.genomicStateList.length);
        	}
    		var leftpx = (markerspos[1]+offset-referenceFrame.start)/referenceFrame.bpPerPixel; 
    		leftpx = Math.min(leftpx,viewportWidth);
        	dl.css("display","block");
        	dl.css("left",Math.floor(leftpx+50) + "px");
        	dl.css("position","absolute");
        	
        	offset = 0;
        	
        	var rightpx;
        	if($scope.myIgv.genomicStateList.length>1) {
        		var nextgenomicState = $scope.myIgv.genomicStateList[1];
            	var nextreferenceFrame = nextgenomicState.referenceFrame;
            	
	        	if($scope.settings.current.chromosomeIndexes.length == 2 && markerschrom[0] != $scope.settings.current.chromosomeIndexes[0]) { 
        		
	        		//offset = referenceFrame.bpPerPixel*Math.floor($scope.myIgv.viewportContainerWidth()/$scope.myIgv.genomicStateList.length);
	        		offset = (referenceFrame.bpPerPixel * viewportWidth) + referenceFrame.start;
	        		offset -= nextreferenceFrame.start -($scope.settings.current.chromStart[1]);
	        		offset = Math.max(0, offset);
	        		rightpx = (markerspos[0]+offset-referenceFrame.start)/referenceFrame.bpPerPixel;
	        	} else {
	        		offset = referenceFrame.bpPerPixel * viewportWidth;
	        		rightpx = (markerspos[0]+offset-nextreferenceFrame.start)/nextreferenceFrame.bpPerPixel;
	        		rightpx = Math.max(rightpx,viewportWidth);
	        	}
        	} else {
        		rightpx = (markerspos[0]+offset-referenceFrame.start)/referenceFrame.bpPerPixel;
        	}
        	dr.css("display","block");
        	dr.css("left",Math.floor(rightpx+50) + "px");
        	dr.css("position","absolute");
        };

        $scope.getSummaryFeatures = function(i) {
        	
        	var feat, chrStart, feat_nbr, j, k;
    		var chrId = 0;
    		j = 0;
			chrStart = $scope.settings.current.chromStart[chrId];
			feat_nbr = 1;
			while(j < track_data[i].feature.length) {
				var tdata = [];
				feat = track_data[i].feature[j];
				if(feat.start >= chrStart &&  feat.end < chrStart+resolution && feat.chr == $scope.settings.current.chromosomeIndexes[chrId]) {
					while(feat.start >= chrStart &&  feat.end < chrStart+resolution && feat.chr == $scope.settings.current.chromosomeIndexes[chrId]) {
						tdata.push(feat);
						feat = track_data[i].feature[j];
						feat_nbr++;	
						j++;
						if(j >= track_data[i].feature.length) break;
					}
					
					if(tdata.length > 5 && typeof tdata[0].value != 'undefined') {
						var feat_max = { chr:feat.chr, start:chrStart, end:chrStart+resolution-1, value:0, count: 0};
						var feat_avg = { chr:feat.chr, start:chrStart, end:chrStart+resolution-1, value:0, count: 0};
						for(k = 0; k < tdata.length; k++) {
							if(typeof tdata[k].value != 'undefined') {
								feat_avg.value += tdata[k].value;
								if(feat_max.value < tdata[k].value) feat_max.value = tdata[k].value; 
							}
						}
						feat_avg.count = tdata.length;
						feat_max.count = tdata.length;
						feat_avg.value = feat_avg.value/tdata.length;
						track_data[i].max_feature.push(feat_max);
						track_data[i].avg_feature.push(feat_avg);
					} 
					chrStart += resolution;
					if(feat.chr.replace('chr','') != $scope.settings.current.chromosomeIndexes[chrId].replace('chr',''))
						chrId++;
				} else {
					j++;
				}
				
			}
			
    		
        };
        
        $scope.getFeatures = function(track_name, track_i) {
        	$scope.myIgv.trackViews.forEach(function (tV) {
		  		if(tV.track.name == track_name) {
		  			var i = 0;
		  			tV.browser.genomicStateList.forEach(function (genomicState) {
		  			//for(var i = 0; i<tV.browser.genomicStateList.length;i++) {
			  			//var genomicState = _.first(tV.browser.genomicStateList);
		  				//var genomicState = tV.browser.genomicStateList[i];
			        	var referenceFrame = genomicState.referenceFrame;
						// get features and add them in Track_data
		               	tV.track.getFeatures(referenceFrame.chrName, $scope.settings.current.chromStart[i], $scope.settings.current.chromEnd[i], referenceFrame.bpPerPixel).then(function (features) {
		                	if (features) {
		                		Array.prototype.unique = function() {
								    var a = this.concat();
								    for(var i=0; i<a.length; ++i) {
								        for(var j=i+1; j<a.length; ++j) {
								            if(a[i] === a[j])
								                a.splice(j--, 1);
								        }
								    }

								    return a;
								};
		                       	track_data[track_i].feature = track_data[track_i].feature.concat(features).unique();
		                       	$scope.getSummaryFeatures(track_i);
		                       	
		                    }
		               	}).catch(function (error) {
		                    if (error instanceof igv.AbortLoad) {
		                    	console.log("Aborted ---");
		                    } else {
		                        igv.presentAlert(error);
		                    }
		                });
		               	i++;
		  			});
				}
        	});
        };

        $scope.updateFeaturesList = function() {
        	$scope.myIgv.trackViews.forEach(function (tV) {
        		if(tV.track.id != 'ruler' && tV.track.id != 'sequence') {
        			var found = false;
        			for(var i=0;i<track_data.length;i++) {
        				if(track_data[i].track_name == tV.track.name) found=true;
        			}
        			if(!found) {
        				var tdata = {
							track_name: tV.track.name,
							feature: [],
							avg_feature: [],
							max_feature: []
						};
						track_data.push(tdata);
        				$scope.getFeatures(tV.track.name,track_data.length-1);
        			}
        		}
        	});
        };
        
        /*
        igvjs developers expose an event when the browser changes locus.
        We profit from it to update tadkit position in the 2D and 3D panels
        */
        //$scope.myIgv.on('locuschange', function (refFrame, label) {
        $scope.locuschange = function(refFrame, label) {
        	

        	$scope.updateFeaturesList();

        	var genomicState = _.first($scope.myIgv.genomicStateList);
        	var referenceFrame = genomicState.referenceFrame;
        	//var viewportWidth = Math.floor($scope.myIgv.viewportContainerWidth()/$scope.myIgv.genomicStateList.length);
        	var viewportWidth = Math.floor($scope.myIgv.viewportContainerWidth()/$scope.myIgv.genomicStateList.length);
//        	var viewport = igv.Viewport.viewportsWithLocusIndex(0);
//        	var viewportWidth = Math.floor($scope.myIgv.viewportContainerWidth());
//        	if(viewport.length>0) {
//        		var parts = [];
//				var resolution = $scope.settings.current.segmentLength*$scope.settings.current.particleSegments;
//				var tot_part = 0;
//				for(var i = 0; i<$scope.settings.current.chromosomeIndexes.length;i++) {
//					parts.push(Math.round($scope.settings.current.chromEnd[i]/resolution)-Math.round($scope.settings.current.chromStart[i]/resolution)+1);
//					tot_part += parts[i];
//				}
//        		viewportWidth = viewportWidth*parts[0]/tot_part;
//        	}
        	
            // window center (base-pair units)
            var centerBP = referenceFrame.start + referenceFrame.bpPerPixel * (viewportWidth/2);
            var ps = (centerBP-referenceFrame.start);
            var resolution = $scope.settings.current.segmentLength*$scope.settings.current.particleSegments;
            var offsety = 0;
            if($scope.settings.current.igv_position.y>0)
            	offsety = Math.round($scope.settings.current.igv_position.y - $scope.settings.current.chromStart[$scope.settings.current.chromIdx]);
            var span_region = 0;
			for(var i = 0; i<$scope.settings.current.chromosomeIndexes.length;i++) {
				span_region += $scope.settings.current.chromEnd[i] - $scope.settings.current.chromStart[i];			
			}
			span_region += $scope.settings.current.chromStart[0];
			
            /* 
            We limit the left border of the browser so the center guide cannot go further
            than the start of our chromatin model*/
            if($scope.settings.current.chromStart[$scope.settings.current.chromIdx]>centerBP+offsety) {
				if($scope.settings.current.chromStart[$scope.settings.current.chromIdx]-ps-offsety<=0) {
					referenceFrame.start = 0;
					//referenceFrame.start = $scope.settings.current.chromStart[$scope.settings.current.chromIdx]-ps;
				} else {
					referenceFrame.start = $scope.settings.current.chromStart[$scope.settings.current.chromIdx]-ps-offsety;
				}
			}
			/* 
			We limit the right border of the browser so the center guide cannot go further
            than the end of our chromatin model.
			I haven't found other way than limiting artificially the length of the whole chromosome.
            */
			var igv_chrom = $scope.myIgv.genome.getChromosome(referenceFrame.chrName);
			//igv_chrom.bpLength = ($scope.settings.current.chromEnd[$scope.settings.current.chromIdx]+($scope.settings.current.chromEnd[$scope.settings.current.chromIdx]-referenceFrame.start));
			igv_chrom.bpLength = (span_region+(span_region-referenceFrame.start)-resolution+offsety);
			/*
			Finally inform tadkit about the center genomic position and the position in the screen
			of the left and right border of our model, so we can synchronize the 2D panel
			*/
			var px_start = ($scope.settings.current.chromStart[$scope.settings.current.chromIdx]-referenceFrame.start)/referenceFrame.bpPerPixel;
			//var px_end = ($scope.settings.current.chromEnd[$scope.settings.current.chromIdx]-referenceFrame.start)/referenceFrame.bpPerPixel;
			var px_end = (span_region-referenceFrame.start)/referenceFrame.bpPerPixel;
			
			$scope.updatePosition(centerBP, px_start+50 , px_end+50);
					
			
			
		//});
        };
        
        igv.Browser.prototype.updateLocusSearchWidget = function (genomicState) {

            var self = this,
                referenceFrame,
                ss,
                ee,
                str,
                end,
                chromosome;


            if (this.rulerTrack) {
                this.rulerTrack.updateLocusLabel();
            }

            if (0 === this.genomicStateList.indexOf(genomicState) && 1 === this.genomicStateList.length) {

                if (genomicState.locusSearchString && 'all' === genomicState.locusSearchString.toLowerCase()) {

                    this.$searchInput.val(genomicState.locusSearchString);
                    this.chromosomeSelectWidget.$select.val('all');
                } else {

                    referenceFrame = genomicState.referenceFrame;
                    this.chromosomeSelectWidget.$select.val(referenceFrame.chrName);

                    if (this.$searchInput) {

                        end = referenceFrame.start + referenceFrame.bpPerPixel * (self.viewportContainerWidth() / this.genomicStateList.length);

                        if (this.genome) {
                            chromosome = this.genome.getChromosome(referenceFrame.chrName);
                            if (chromosome) {
                                end = Math.min(end, chromosome.bpLength);
                            }
                        }

                        ss = igv.numberFormatter(Math.floor(referenceFrame.start + 1));
                        ee = igv.numberFormatter(Math.floor(end));
                        str = referenceFrame.chrName + ":" + ss + "-" + ee;
                        this.$searchInput.val(str);
                    }

                    this.fireEvent('locuschange', [referenceFrame, str]);
                    $scope.locuschange(referenceFrame, str);
                }

            } else {
                this.$searchInput.val('');
            }

        };
        
        // List to store the status of the overlayed tracks
        $scope.tracksOverlaid = {};
        
        /* 
        This is a nasty override. Currently there is no way to inject a menu item in track menus.
        Therefore we override igv.trackMenuItemList to include a new item to overlay the track.
        It should be updated if it changes in new releases of igvjs.
        The injected code is properly marked. 
        */
        igv.trackApply3DMenuItem = function (trackView) {

            var $e,
                menuClickHandler;
            
            // Init tracksOverlaid to false
            if (typeof $scope.tracksOverlaid[trackView.track.id] === "undefined") {
            	$scope.tracksOverlaid[trackView.track.id] = false;
            }
            
            //$e = $('<div>');
            //$e.addClass('igv-track-menu-border-top');
            //$e.text('Apply to 3D');
            $e = igv.createCheckbox("Apply to 3D", $scope.tracksOverlaid[trackView.track.id]);
            $e.addClass('igv-track-menu-border-top');
            
            menuClickHandler = function () {
                
                if($scope.tracksOverlaid[trackView.track.id]) {
                   	$scope.removeOverlay(trackView.track.id);
                   	$scope.tracksOverlaid[trackView.track.id] = false;
                } else {
                	var genomicState = _.first(trackView.browser.genomicStateList);
                   	var referenceFrame = genomicState.referenceFrame;   
                   	// get features and pass them for overlay
                   	trackView.track.getFeatures(referenceFrame.chrName, $scope.settings.current.chromStart[$scope.settings.current.chromIdx], $scope.settings.current.chromEnd[$scope.settings.current.chromIdx], referenceFrame.bpPerPixel).then(function (features) {
                           if (features) {
                           	$scope.applyOverlay(trackView.track.id,features,trackView.track.color);
                           }
                   	}).catch(function (error) {
                           if (error instanceof igv.AbortLoad) {
                               console.log("Aborted ---");
                           } else {
                               igv.presentAlert(error);
                           }
                       });
                   	$scope.myIgv.trackViews.forEach(function (tV) {
                   		$scope.tracksOverlaid[tV.track.id] = (trackView.track.id == tV.track.id);
                   	});
               }
              
            };

            return {object: $e, click: menuClickHandler};


        };
        igv.trackMenuItemList = function (popover, trackView) {

            var menuItems = [];

            if (trackView.track.config.type !== 'sequence') {
                menuItems.push(igv.trackRenameMenuItem(trackView));
                menuItems.push(igv.trackHeightMenuItem(trackView));
            }

            if (doProvideColoSwatchWidget(trackView.track)) {
                menuItems.push(igv.colorPickerMenuItem(trackView));
            }

            if (trackView.track.menuItemList) {
                menuItems = menuItems.concat(trackView.track.menuItemList());
            }

            if (trackView.track.removable !== false) {
                menuItems.push(igv.trackRemovalMenuItem(trackView));
            }
            
            if (trackView.track.config.type !== 'sequence') {
                menuItems.push(igv.trackApply3DMenuItem(trackView));
            }

            return menuItems;
        };
        
        function doProvideColoSwatchWidget(track) {
            return (track instanceof igv.BAMTrack || track instanceof igv.FeatureTrack || track instanceof igv.VariantTrack || track instanceof igv.WIGTrack);
        }
       
	}
})();