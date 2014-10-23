(function() {
	'use strict';
	angular
		.module('TADkit')
		.controller('DashboardCtrl', DashboardCtrl);

	function DashboardCtrl ($rootScope, $scope, Settings, TAD, Assembly, Genes, Proteins, Contacts){

		$scope.assembly = Assembly.getAssembly();
		var assemblyLength = 0;
		var regions = $scope.assembly.top_level_region;
		for (var length in regions) {
			if (regions.hasOwnProperty(length)) {
				for (var i = 0, j = regions.length; i < j; i++) {
					assemblyLength += regions[i].length;
				}
			}
		}
		$scope.assemblyLength = assemblyLength;
		console.log("Assembly: " + parseInt( $scope.assemblyLength ).toLocaleString() + " BP");
		
		var particlesCount = TAD.getParticlesCount();
		$scope.particlesCount = particlesCount;
		// console.log($scope.particlesCount);

		// console.log(particles);
		var segments = TAD.getSegments();
		$scope.segments = segments;
		// console.log(segments);
		
		var genes = Genes.getGenes();
		// console.log(genes);
		
		var biotypes = Assembly.getBiotypeColors().gene;
		// console.log(biotypes);
		// console.log(JSON.stringify(biotypes));
		
		var proteins = Proteins.getProteins();
		// $scope.proteins = proteins;
		// console.log($scope.proteins);

		var contacts = Contacts.getContacts();
		// $scope.contacts = contacts;
		// console.log($scope.contacts);

		// Count fragments
		var fragmentCount = particlesCount * segments;
		$rootScope.fragments = fragmentCount;
		// console.log($rootScope.fragments);

		// Set initial position
		var position = parseInt( fragmentCount * 0.5 );
		$scope.slider = {};
		$scope.slider.position = position;
		// console.log($scope.slider.position);
		
		var TADMetadata = TAD.getMetadata();
		// console.log(TADMetadata);
		var TADStart = TADMetadata.start;
		// var fragmentLength = TAD.getMetadata().lengthBP / fragmentCount;
		var fragmentLength = TADMetadata.resolution / segments; // base pairs
		$scope.fragmentLength = fragmentLength;
		// console.log(fragmentLength);

		var focusStart = TADMetadata.start;
		$scope.focusStart = focusStart;

		var focusEnd = TADMetadata.end;
		$scope.focusEnd = focusEnd;
		
		$scope.colorsTAD = TAD.getColors();
		$scope.colorsGenes = Genes.getColors( genes, biotypes, fragmentCount, TADStart, fragmentLength );
		$scope.colorsContacts = Contacts.getColors( contacts, $scope.slider.position, particlesCount, segments );
		$scope.colorsHP1 = Proteins.getColors( proteins, "HP1", fragmentCount, TADStart, fragmentLength );
		$scope.colorsBRM = Proteins.getColors( proteins, "BRM", fragmentCount, TADStart, fragmentLength );
		$scope.colorsMRG15 = Proteins.getColors( proteins, "MRG15", fragmentCount, TADStart, fragmentLength );
		$scope.colorsPC = Proteins.getColors( proteins, "PC", fragmentCount, TADStart, fragmentLength );
		$scope.colorsH1 = Proteins.getColors( proteins, "H1", fragmentCount, TADStart, fragmentLength );
		$scope.colors = $scope.colorsTAD;
		// $scope.colors = Genes.getRandomColors(fragmentCount);

		// setInterval(
		// 	function() {
		// 		$scope.colors = Genes.getRandomColors(fragmentCount);
		// 		console.log($scope.colors);
		// 	}, 3000);
		
		var species = TAD.getSpecies();
		$rootScope.species = { text: species };
		var slice = TAD.getSlice();
		$rootScope.slice = { text: slice };
		var identifier = TADMetadata.identifier;
		$rootScope.identifier = { text: identifier };
		var article = TADMetadata.article;
		$rootScope.article = { text: article };
		var assembly = TADMetadata.assembly;
		$rootScope.assembly = { text: assembly };
		var celltype = TADMetadata.cellType;
		$rootScope.celltype = { text: celltype };
		var experiment = TADMetadata.experimentType;
		$rootScope.experiment = { text: experiment };
		var resolution = TADMetadata.resolution;
		$rootScope.resolution = { text: resolution };
		
		// Interaction Settings
		$scope.showParticles = Settings.getParticles();
		$scope.toggleParticles = function() {
			$scope.showParticles = !$scope.showParticles;
		};
		
		$scope.showChromatin = Settings.getChromatin();
		$scope.toggleChromatin = function() {
			$scope.showChromatin = !$scope.showChromatin;
		};
		
		$scope.showTAD = Settings.getTAD();
		$scope.toggleTAD = function() {
			// CHANGE TO switchColors()...
				$scope.colors = $scope.colorsTAD;
	   			$scope.showTAD = true;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
		};
		
		$scope.showGenes = Settings.getGenes();
		$scope.toggleGenes = function() {
			// CHANGE TO switchColors()...
			if ($scope.showGenes === false) {
				$scope.colors = $scope.colorsGenes;
	   			$scope.showTAD = false;
	   			$scope.showGenes = true;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			} else {
				$scope.colors = $scope.colorsTAD;
	   			$scope.showTAD = true;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			}
		};

		$scope.showContacts = Settings.getContacts();
		$scope.toggleContacts = function() {
			$scope.colors = Contacts.getColors( contacts, $scope.slider.position, particlesCount, segments );
			// CHANGE TO switchColors()...
			if ($scope.showContacts === false) {
	   			$scope.showTAD = false;
	   			$scope.showGenes = false;
	   			$scope.showContacts = true;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			} else {
				$scope.colors = $scope.colorsTAD;
	   			$scope.showTAD = true;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			}
		};
		
		$scope.showHP1 = Settings.getHP1();
		$scope.toggleHP1 = function() {
			if ($scope.showHP1 === false) {
				$scope.colors = $scope.colorsHP1;
	   			$scope.showTAD = false;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = true;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			} else {
				$scope.colors = $scope.colorsTAD;
	   			$scope.showTAD = true;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			}
		};
		
		$scope.showBRM = Settings.getBRM();
		$scope.toggleBRM = function() {
			if ($scope.showBRM === false) {
				$scope.colors = $scope.colorsBRM;
	   			$scope.showTAD = false;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = true;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			} else {
				$scope.colors = $scope.colorsTAD;
	   			$scope.showTAD = true;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			}
		};
		
		$scope.showMRG15 = Settings.getMRG15();
		$scope.toggleMRG15 = function() {
			if ($scope.showMRG15 === false) {
				$scope.colors = $scope.colorsMRG15;
	   			$scope.showTAD = false;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = true;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			} else {
				$scope.colors = $scope.colorsTAD;
	   			$scope.showTAD = true;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			}
		};
		
		$scope.showPC = Settings.getPC();
		$scope.togglePC = function() {
			if ($scope.showPC === false) {
				$scope.colors = $scope.colorsPC;
	   			$scope.showTAD = false;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = true;
	   			$scope.showH1 = false;
			} else {
				$scope.colors = $scope.colorsTAD;
	   			$scope.showTAD = true;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			}
		};
		
		$scope.showH1 = Settings.getH1();
		$scope.toggleH1 = function() {
			if ($scope.showH1 === false) {
				$scope.colors = $scope.colorsH1;
	   			$scope.showTAD = false;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = true;
			} else {
				$scope.colors = $scope.colorsTAD;
	   			$scope.showTAD = true;
	   			$scope.showGenes = false;
	   			$scope.showContacts = false;
	   			$scope.showHP1 = false;
	   			$scope.showBRM = false;
	   			$scope.showMRG15 = false;
	   			$scope.showPC = false;
	   			$scope.showH1 = false;
			}
		};
		
		$scope.showSense = Settings.getSense();
		$scope.toggleSense = function() {
			$scope.showSense = !$scope.showSense;
		};
		
		$scope.$watch('slider.position', function(n,o) {
			if (n !== o && $scope.showContacts ) {
				$scope.colors = Contacts.getColors( contacts, $scope.slider.position, particlesCount, segments );
			}
		});
	}
})();