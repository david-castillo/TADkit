'use strict';

TADkit.factory('Genes', ['$q', '$http', function($q, $http) {
	var ensemblRoot = "http://rest.ensembl.org/";
	var genes = "";
	return {
		loadRegionGenes: function(species, requestSlice) {
			var deferral = $q.defer();
			$http.get('assets/json/drosophila_melanogaster-genes.json')
			// $http.get(ensemblRoot + "overlap/region/" + species + "/" + requestSlice + "?feature=gene;content-type=application/json")
			.success(function(data){
				genes = data;
				console.log( data.length + " genes for region " + requestSlice + " of " + species + " retreived from Ensembl.");
				deferral.resolve(data);
			});
			return deferral.promise;
		},
		getGenes: function () {
			return genes;
		},
		getGenesCount: function () {
			return genes.length;
		},
		getColors: function(genes, biotypes, fragmentsCount, TADStart, fragmentLength) {
			var colors = [];
			var totalLength = fragmentsCount * fragmentLength;
			// console.log(fragmentsCount);
			
			// For every fragment [i]...
			for(var i=0; i<fragmentsCount; i++){
				var biotypesPresent = [];
				var fragmentLower = TADStart + (fragmentLength * i);
				var fragmentUpper = fragmentLower + fragmentLength;
				var genesCount = this.getGenesCount();
				var color = "#cccccc"; // Base color - ie if none found

				// For every gene [j]...
				for(var j=0; j<genesCount; j++){
					var start = genes[j].start;
					var end = genes[j].end;
					
					 // check if overlaps current fragment [i]
					if ( Math.max(fragmentLower, start) <= Math.min(fragmentUpper,end) ) {
						// if (i==3) console.log("Yes gene " + genes[j].external_name + "("+j+") in fragment " + i );
						
						
						if (biotypesPresent.length > 0) {
							
							// Simple weight - give preference to smaller fragments
							if ( biotypesPresent[0] == "protein_coding" ) {
								var biotype = genes[j].biotype;
								biotypesPresent[0] = biotype;
							} else {
								biotypesPresent.push(biotype);
							}
						} else {
							var biotype = genes[j].biotype;
							biotypesPresent.push(biotype);							
						}
						
					} else {
						// if (i==3) console.log("No genes in fragment " + i );
						// if (j == 0) console.log( JSON.stringify(fragmentLower)+", "+JSON.stringify(start)+" <= "+JSON.stringify(fragmentUpper)+", "+JSON.stringify(end) );
					}
				};
				// console.log(i);
				// console.log(biotypesPresent);
				for(var k=0; k<biotypesPresent.length; k++){
					var biotype = biotypesPresent[0].toLowerCase();
					if (biotype in biotypes) {
						color = biotypes[biotype];
					} else {
						color = "#110100";
					}
				}
				colors.push(color);
				// console.log(biotypesPresent);
			};
			// console.log(colors);
			return colors;
		},
		getRandomColors: function( fragmentsCount ) {
			var colors = [];
			console.log(fragmentsCount);
			for(var i=0; i<fragmentsCount; i++){
				var color = "#" + Math.floor(Math.random()*16777215).toString(16);
				colors.push(color);
			}
			return colors;
		}
	};
}])
