(function(){
	"use strict";
	var windowYear = 2010;
	var mapYear = 2010;
	var maxYear = 2010;
	var minYear = 1996;
	var marker;
	var clickedFacilityIcon = L.divIcon({
		className : 'clickedFacility'
	});
	var mouseX, mouseY;
	var map;
	var layers = {};
	var lastSearch = '';
	
	var stateLookup = {
		"AK":"Alaska",
		"AL":"Alabama",
		"AR":"Arkansas",
		"AS":"American Samoa",
		"AZ":"Arizona",
		"CA":"California",
		"CO":"Colorado",
		"CT":"Connecticut",
		"DC":"District of Columbia",
		"DE":"Delaware",
		"FL":"Florida",
		"GA":"Georgia",
		"GU":"Guam",
		"HI":"Hawaii",
		"IA":"Iowa",
		"ID":"Idaho",
		"IL":"Illinois",
		"IN":"Indiana",
		"KS":"Kansas",
		"KY":"Kentucky",
		"LA":"Louisiana",
		"MA":"Massachusetts",
		"MD":"Maryland",
		"ME":"Maine",
		"MI":"Michigan",
		"MN":"Minnesota",
		"MO":"Missouri",
		"MP":"Northern Mariana Islands",
		"MS":"Mississippi",
		"MT":"Montana",
		"NC":"North Carolina",
		"ND":"North Dakota",
		"NE":"Nebraska",
		"NH":"New Hampshire",
		"NJ":"New Jersey",
		"NM":"New Mexico",
		"NV":"Nevada",
		"NY":"New York",
		"OH":"Ohio",
		"OK":"Oklahoma",
		"OR":"Oregon",
		"PA":"Pennsylvania",
		"PR":"Puerto Rico",
		"RI":"Rhode Island",
		"SC":"South Carolina",
		"SD":"South Dakota",
		"TN":"Tennessee",
		"TX":"Texas",
		"UT":"Utah",
		"VA":"Virginia",
		"VI":"Virgin Islands",
		"VT":"Vermont",
		"WA":"Washington",
		"WI":"Wisconsin",
		"WV":"West Virginia",
		"WY":"Wyoming"
	}
	
	//Prevents older browsers from breaking if a console.log() function is left in the code.
	if(!window.console){ window.console = {log: function(){} }; } 
	
	//Modify number prototype with format function to add commas and truncate long decimals
	Number.prototype.format = function() {
		try {
			var number = this;
			var numArray = number.toString().split('.');
			// If no decimal place, return no decimal
			if (numArray.length === 1) {
				return number.toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, "$1,");
			} else {
				// If one decimal place, return one decimal
				if (numArray[1].length === 1) {
					return number.toFixed(1).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
				} else {
					//If two or more decimals, return two decimal
					return number.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
				}
			}
		} catch (e) {
			return this;
		}
	}; 

	
	$(document).ready(function() {
		// load google api
		// google.load("visualization", "1", {
		// packages : ["corechart"]
		// });
		google.setOnLoadCallback(init);
	
		function init() {
			var utfClick;
	
			$(".fancybox").fancybox({
				fitToView : false,
				width : '90%',
				height : '90%',
				autoSize : false
			});
	
			$("#facility_tabs").tabs();
	
			// get mouse position for tooltip
			$(document).mousemove(function(e) {
				mouseX = e.pageX;
				mouseY = e.pageY;
			});
			
			layers.toner = new L.StamenTileLayer("toner-lite", {
				attribution : '<p>Map tiles by <a href="http://stamen.com">Stamen Design</a>,<br/>under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.<br/>Data by <a href="http://openstreetmap.org">OpenStreetMap</a>,<br/>under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.</p>'
			});
			layers.satellite = new L.TileLayer("//otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png", {
				attribution : 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"> Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency"'
			});
			layers.streets = new L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution : '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
			});
	
			
			//Add TRI facility tile layers
			for (var layerDate = maxYear; layerDate >= minYear; layerDate -= 1){
				//Add tiles for all years between minDate and maxDate
				layers['y' + layerDate] = L.tileLayer('http://tile{s}.toxictrends.org/tiles/' + layerDate + '/{z}/{x}/{y}.png', {
					subdomains: '1234'
				});
				
				//Add utftiles for all years between minDate and maxDate
				layers['U' + layerDate] = new L.UtfGrid('http://tile{s}.toxictrends.org/utfgrid/' + layerDate + '/{z}/{x}/{y}.grid.json?callback={cb}', {
					subdomains: '1234'
				});
			}
	
			map = L.map('map', {
				center : new L.LatLng(39, -98),
				zoom : 5,
				layers : [layers.toner, layers.y2010, layers.U2010],
				maxZoom : 16,
				minZoom: 4,
				fadeAnimation : false,
				scrollWheelZoom: true
			});
			
			map.attributionControl.setPrefix('');
			
			// hide loading message on map load
			map.whenReady(function() {
				$('#loading').fadeOut(500);
			});
	
			utfClick = function(e) {
				if (e.data) {
					loadPopup(e.data.facilitynu);
					ga('send', 'event', 'facility', 'click', e.data.name);
				}
			};
			
			function loadPopup(facility_number){
				var url = '//toxictrends.org/api/v3/facility/' + facility_number + '.json';
				var startTime = new Date().getTime();
				
				//Set info window year to current year
				document.getElementById('window_year').innerHTML = windowYear;
				document.getElementById('ind_year').innerHTML = windowYear;
	
					$.ajax({
						dataType : "json",
						url : url,
						success : function(facility_record) {
							windowYear = mapYear;
							cleanPopup();
							parseFacility(facility_record);
							parseChemicals(facility_record);
							parseIndustry(facility_record);
							if ($("#general_tab").attr('aria-expanded') === 'true') {
								loadChart(facility_record);
							} else {
								$("#general_tab_btn").on('click.draw_chart', function() {
									loadChart(facility_record);
									$("#general_tab_btn").off('click.draw_chart');
								});
							}
				
							initChemListListener();
							initYearChangers(facility_record);
						},
						error : function(request){
							ga('send', 'event', 'Error', 'ajax', 'url: ' + url + ' response: ' + request.responseText);
						}
					}).done(function(){
						var totalTime = new Date().getTime()-startTime;
						ga('send', 'timing', 'api', 'facility', totalTime);
					});;
					
				
			}
	
			
	
			var hover_timer = false;
			var utfMouseover = function(e) {
				if (e.data) {
					$('#hover').html(e.data.name);
					clearTimeout(hover_timer);
				}
	
				$('#hover').css({
					'display' : 'block'
				});
			};
	
			map.on('mousemove', function() {
				$('#hover').css({
					'top' : mouseY + 5,
					'left' : mouseX + 10
				});
			});
	
			// hide facility tooltip on mouseout from map
			map.on('mouseout', function() {
				$('#hover').hide();
			});
	
			var baseMaps = {
				"Toner" : layers.toner,
				"Streets" : layers.streets,
				"Satellite" : layers.satellite
			};
	
			var overlayMaps = {
				"L2010" : layers.y2010,
				"L2009" : layers.y2009,
				"L2008" : layers.y2008,
				"L2007" : layers.y2007,
				"L2006" : layers.y2006,
				"L2005" : layers.y2005,
				"L2004" : layers.y2004,
				"L2003" : layers.y2003,
				"L2002" : layers.y2002,
				"L2001" : layers.y2001,
				"L2000" : layers.y2000,
				"L1999" : layers.y1999,
				"L1998" : layers.y1998,
				"L1997" : layers.y1997,
				"L1996" : layers.y1996
			};
			
			var overlayGrids = {
				"U2010" : layers.U2010,
				"U2009" : layers.U2009,
				"U2008" : layers.U2008,
				"U2007" : layers.U2007,
				"U2006" : layers.U2006,
				"U2005" : layers.U2005,
				"U2004" : layers.U2004,
				"U2003" : layers.U2003,
				"U2002" : layers.U2002,
				"U2001" : layers.U2001,
				"U2000" : layers.U2000,
				"U1999" : layers.U1999,
				"U1998" : layers.U1998,
				"U1997" : layers.U1997,
				"U1996" : layers.U1996
			};
	
			// change year
			$('#upyear').bind('click', function() {
				toggleUp();
			});
			$('#downyear').bind('click', function() {
				toggleDown();
			});
	
			var toggleUp = function() {
				if (mapYear < maxYear) {
					map.addLayer(overlayMaps['L' + (mapYear + 1)]);
					map.removeLayer(overlayMaps['L' + mapYear]);
					map.addLayer(overlayGrids['U' + (mapYear + 1)]);
					map.removeLayer(overlayGrids['U' + mapYear]);
					mapYear += 1;
					$('#currentyear').html(mapYear);
					ga('send', 'event', 'Map', 'Year', mapYear);
					
				}
			};
	
			var toggleDown = function() {
				if (mapYear > minYear) {
					map.addLayer(overlayMaps['L' + (mapYear - 1)]);
					map.removeLayer(overlayMaps['L' + mapYear]);
					map.addLayer(overlayGrids['U' + (mapYear - 1)]);
					map.removeLayer(overlayGrids['U' + mapYear]);
					mapYear -= 1;
					$('#currentyear').html(mapYear);
					ga('send', 'event', 'Map', 'Year', mapYear);
				}
			};
	
			//change basemap
			$('#tonerThumb').bind('click', function() {
				changeBasemap('Toner');
			});
			$('#streetsThumb').bind('click', function() {
				changeBasemap('Streets');
			});
			$('#satelliteThumb').bind('click', function() {
				changeBasemap('Satellite');
			});
	
			function changeBasemap(lyr) {
				for (var item in baseMaps) {
					var obj = baseMaps[item];
					if (map.hasLayer(obj)) {
						map.removeLayer(obj);
					}
					map.addLayer(baseMaps[lyr]);
					baseMaps[lyr].bringToBack();
				}
				ga('send', 'event', 'Basemap', 'Change', lyr);
			}
	
			// add handlers for  attribution
			// Show attribution be default if screen width larger than 1024
			if($(window).width() >= 1024) {
				$('div.leaflet-bottom.leaflet-right').prepend("<div class='autoattribution trans hidetoggle'><p style='display:none'>basemap info</p><p>hide</p></div>");
				$('.leaflet-control-attribution').show();
			} else {
				$('div.leaflet-bottom.leaflet-right').prepend("<div class='autoattribution trans'><p>basemap info</p><p style='display:none'>hide</p></div>");
				$('.leaflet-control-attribution').hide(); //For some reason shows up by default in ie8.  Temporary fix
			}
			
			// toggle attribution info
			$('.autoattribution').click(function(e) {
				e.stopPropagation();
				if ($('.autoattribution').hasClass("hidetoggle")) {
					//If attribution is showing
					$('.autoattribution').removeClass("hidetoggle");
					$('.leaflet-control-attribution').hide("slow");
					$('.autoattribution > p:nth-child(2)').hide();
					$('.autoattribution > p:nth-child(1)').show();
				} else {
					//If attribution is hidden
					$('.autoattribution').addClass("hidetoggle");
					$('.leaflet-control-attribution').show("slow");
					$('.autoattribution > p:nth-child(2)').show();
					$('.autoattribution > p:nth-child(1)').hide();
				}
			});
			
			/// search
			$('#search').on('focus', clearDefaultSearchText);
			$('#search').on('blur', replaceDefaultSearchText);
			$('#searchbtn').on('click', prepSearch);
			
			for (var year in overlayGrids){
				if (overlayGrids.hasOwnProperty(year)) {
					layers[year].on('click', utfClick);
					layers[year].on('mouseover', utfMouseover);
			
					layers[year].on('mouseout', function() {
						hover_timer = setTimeout(function() {
							$('#hover').hide();
						}, 200);
					});
					
					// stop mouseover info for facilities when under attribution
					$('div.leaflet-bottom.leaflet-right').mouseenter(function(e) {
						e.stopPropagation();
						layers[year].off('mouseover');
						layers[year].off('click');
					});
				
					$('div.leaflet-bottom.leaflet-right').mouseleave(function() {
						layers[year].on('mouseover', utfMouseover);
						layers[year].on('click', utfClick);
					});
				}
			}
			
			function clearDefaultSearchText() {
				if (this.value === "Search for a facility") {
					this.value = "";
				}
			}
	
			function replaceDefaultSearchText() {
				if (this.value === "") {
					this.value = "Search for a facility";
				}
			}
	
	
			$('#search').keydown(function(e) {
				if (e.keyCode === 13) {
					prepSearch();
				}
			});
			
			function prepSearch(){
				if ($('#search').val() === lastSearch) {
						//Don't perform the search again, just reopen the search box if the same results are used.
						$("#searchresultsbox").css('display') === 'none' ? $("#searchresultsbox").toggle() : null;
				} else if ($('#search').val() === ''){
					return;
				} else {
					lastSearch = $('#search').val();
					//Remove old results
					$("#searchresults").empty();
					doSearch($('#search').val(), 0);
					
					$('#loading').fadeIn(500);
					ga('send', 'event', 'Search', 'Query', $('#search').val());
					
					
				};
			}
			
			function doSearch(term, start) {
				var url = '//toxictrends.org/search/tri/facilities/?q=' + term.replace(/\//g,'\\/') + '&from=' + start;
				var startTime = new Date().getTime();
				$.ajax({
					url : url,
					success : function(r) {
						
						if (r.hits.hits[0]) {
							$("#searchresultsbox").height('60%');
							$.each(r.hits.hits, function(index, result) {
								processSearchResult(result);
							});
							
							//If more hits than returned, add button to get more
							if ((r.hits.total - 10 - start) > 0) {
								start += 10;
								var item = $('<p id="moreresults" class="searchresult">Show More Results</p>').on('click', function() {
									doSearch(term, start);
									item.remove();
								});
								$("#searchresults").append($(item)[0]);		
							}
						} else {
							$("#searchresultsbox").height(140);
							$("#searchresults").html("<p>No results found for " + term + "</br>You may search for a specific facility by name, city, zip, DUNS, chemical name, or parent company name.</p>");
						}
						$("#searchresultsbox").css('display') === 'none' ? $("#searchresultsbox").toggle() : null;
						$('#loading').fadeOut(500);
						
					},
					error : function(request) {
						$('#loading').fadeOut(500);
						ga('send', 'event', 'Error', 'ajax', 'url: ' + url + ' response: ' + request.responseText);
					}
				})
				.done(function(){
						var totalTime = new Date().getTime()-startTime;
						ga('send', 'timing', 'search', 'query', totalTime);
					});
			}
			
			function processSearchResult(result) {
				var f = result._source;
				var item = $('<p class="searchresult">' + f.Name + " - " + f.City + ", " + f.State + '</p>').on('mouseover', function() {
					showFacility(f.Latitude, f.Longitude);
				}).on('mouseout', function(){
					map.removeLayer(marker);
				})
				.on('click', function() {
					closeSearch();
					zoomToFacility(f.Latitude, f.Longitude);
					loadPopup(f.FacilityNumber);
					//Log search selection
					ga('send', 'event', 'Search', 'Selected', f.name);
				});
				$("#searchresults").append($(item)[0]);
			}
	
			//Facility Popup close window
			$('#fp_close').on('click.fp_close', function() {
				$('#facility_tabs').hide();
			});
			
			//Search popup close window
			$('#search_close').on('click.fp_close', function() {
				closeSearch();
			});
			
		}
	
		function cleanPopup() {
			//Remove event listeners to prevent multiple copies
			$("#chemicalList").off('click.chemdetails');
	
			document.getElementById('graph').innerHTML = '';
			document.getElementById('info_title').innerHTML = '';
			document.getElementById('info_industry').innerHTML = '';
			document.getElementById('info_address').innerHTML = '';
			document.getElementById('info_contact').innerHTML = '';
			document.getElementById('chemicalList').innerHTML = '';
			document.getElementById('industryList').innerHTML = '';
	
		}
	
		//Popup Functionality
	
		function loadChart(facility_record) {
	
			// create chart data
			if (!facility_record.Emissions || Object.keys(facility_record.Emissions).length === 1) {
				// no years of data so set the chart area to say no chart
				$('#graph').html('<p class="noChart">Not enough data for a chart</p>');
			} else {
				var data;
				var chart_data = [['Year', 'Total Pounds Released', 'Risk']];
				var chart = new google.visualization.LineChart($('#graph')[0]);
				var options = {
					title : 'Facility Performance',
					hAxis : {
						gridlines : {
							color : '#333',
							count : 10
						}
					},
					series : {
						0 : {
							argetAxisIndex : 0
						},
						1 : {
							targetAxisIndex : 1
						}
					},
					vAxes : {
						0 : {
							textStyle : {
								color : 'blue'
							},
							label : 'Total Pounds Released'
						},
						1 : {
							textStyle : {
								color : 'red'
							},
							label : 'Risk'
						}
					},
					chartArea : {
						width : '97%'
					},
					vAxis : {
						textPosition : 'in'
					}
	
				};
				var formatter = new google.visualization.NumberFormat({
					fractionDigits: '0'
				});
				
				$.each(facility_record.Emissions, function(k, v) {
					chart_data.push([k, v.TotalPounds, v.TotalScore]);
				});
	
				//set the chart properties
				data = google.visualization.arrayToDataTable(chart_data);
				formatter.format(data, 2); // Apply formatter to risk
				formatter.format(data, 1); // Apply formatter to pounds
				chart.draw(data, options);
			}
		}
	
		function parseFacility(facility_record) {
			$("#facility_tabs").show();
			document.getElementById('info_title').innerHTML = '<STRONG>' + facility_record.Name + '</STRONG>';
			if(facility_record.NAICS1 !== undefined && facility_record.NAICS1.name !== undefined){
				document.getElementById('info_industry').innerHTML = 'Industry: ' + facility_record.NAICS1.name;
			}
			document.getElementById('info_address').innerHTML = '<p>' + facility_record.Street + '<br />' + facility_record.City + ' ' + facility_record.State + ', ' + facility_record.ZIPCode + '<br />' + facility_record.Latitude + ' ' + facility_record.Longitude + '</p>';
			document.getElementById('info_contact').innerHTML = '<p>' + facility_record.PublicContactName + '<br />' + facility_record.PublicContactPhone.replace(/(\d\d\d)(\d\d\d)(\d\d\d\d)/, '($1) $2-$3') + '</p>';
	
			//remove previous zoomto listner
			$(".zoom_to").off('click.zoom');
	
			//Add zoom to listner
			$(".zoom_to").on('click.zoom', function() {
				zoomToFacility(facility_record.Latitude, facility_record.Longitude);
			});
	
		}
	
		function parseChemicals(facility_record) {
			var chemList = document.getElementById('chemicalList');
			var emissions;
			//Remove stale content
			chemList.innerHTML = '';
			//Parse record
			if (facility_record.Emissions !== undefined && facility_record.Emissions[windowYear] !== undefined && facility_record.Emissions[windowYear].Submissions !== undefined) {
				emissions = facility_record.Emissions[windowYear].Submissions;
			} else {
				emissions = 'NoData';
			}
			if (emissions !== 'NoData') {
				emissions.sort(function(a, b) {
					//http://stackoverflow.com/questions/5435228/sort-an-array-with-arrays-in-it-by-string
					//Returns results high-to-low.  Change return 1 to -1 and return -1 to 1 to reverse
					if (a.Score < b.Score) {
						return 1;
					}
					if (a.Score > b.Score) {
						return -1;
					}
					return 0;
				});
				for (var emission in emissions) {
					if(emissions.hasOwnProperty(emission)){
						var div = document.createElement('div');
						div.className = 'chemical_row';
						div.id = 'cas' + emissions[emission].CASNumber;
						div.innerHTML = emissions[emission].Chemical + '<br />' + 'Pounds: ' + (emissions[emission].Pounds).format() + ' Risk: ' + (emissions[emission].Score).format() + '<div id="inf' + emissions[emission].CASNumber + '" class="chemical_details"></div>';
						chemList.appendChild(div);
					}
				}
			} else {
				chemList.innerHTML = 'No Chemical Air Releases in ' + windowYear;
			}
		}
	
		function parseIndustry(facility_record) {
			var industryList = document.getElementById('industryList');
	
			//Remove stale content
			industryList.innerHTML = '';
	
			//parse record
			for (var i = 1; i < 10; i++) {
				if (facility_record['NAICS' + i]) {
					var div = document.createElement('div');
					var html = "";
					div.setAttribute('class', 'industry_row');
					html += '<strong>' + facility_record['NAICS' + i].name + '</strong><br />';
					if (!facility_record['NAICS' + i] || !facility_record['NAICS' + i][windowYear]) {
						html += 'This facility did not report any air releases during this year, so comparisons are unavailable.';
					} else if (facility_record['NAICS' + i][windowYear].state_count === 1 && facility_record['NAICS' + i][windowYear].us_count === 1) {
						html += 'There is only 1 facility of this type in the country.';
					} else if (facility_record['NAICS' + i][windowYear].state_count === 1 && facility_record['NAICS' + i][windowYear].us_count > 1) {
						html += 'There is only 1 facility of this type in ' + stateLookup[facility_record['State']] + '. There are ' + facility_record['NAICS' + i][windowYear].us_count + ' in the country. It emits more pounds of chemicals than ' + facility_record['NAICS' + i][windowYear].us_count + ' percent of facilities of this type in the country.  The facility has a higher <a href="http://www.epa.gov/oppt/rsei/pubs/using_rsei.html#high_score" target="_blank">RSEI</a> risk score than ' + facility_record['NAICS' + i][windowYear].us_score_pct + ' percent of facilities of this type in the country.';
					} else {
						html += 'There are ' + facility_record['NAICS' + i][windowYear].state_count + ' facilities of this type in ' + stateLookup[facility_record['State']] + ' and ' +  facility_record['NAICS' + i][windowYear].us_count + ' in the country. It emits more pounds of chemicals than ' + facility_record['NAICS' + i][windowYear].state_pounds_pct + ' percent of facilities of this type in ' + stateLookup[facility_record['State']] + ' and ' + facility_record['NAICS' + i][windowYear].us_pounds_pct + ' percent in the country. The facility has a higher <a href="http://www.epa.gov/oppt/rsei/pubs/using_rsei.html#high_score" target="_blank">RSEI</a> risk score than  ' + facility_record['NAICS' + i][windowYear].state_score_pct + ' percent of facilities of this type in ' + stateLookup[facility_record['State']] + ' and ' + facility_record['NAICS' + i][windowYear].us_score_pct + ' percent in the country.';
					}
	
					div.innerHTML = html;
					industryList.appendChild(div);
				}
			}
		}
	
		function initChemListListener() {
			//Event Listener for chemical list click
			$("#chemicalList").on('click.chemdetails', function(e) {
				var target = $(e.target);
	
				// Check that they clicked on a chemical row and not the container
				if (target.hasClass("chemical_row")) {
					var casNum = (e.target.id).substring(3, e.target.id.length);
					var chem_details = target.children('.chemical_details');
	
					//Check to see if data was downloaded during a previous click
					//If not, download data
					if (!target.hasClass("data_loaded")) {
						//Position from top of chemical list to scroll list to
						var scrollto = $("#chemicalList").scrollTop() + chem_details.position().top - 120;
	
						//Get the clicked chemical from the api and add "data_loaded" class to prevent loading again on future clicks
						getChem(casNum);
						target.addClass("data_loaded");
						chem_details.show();
	
						//Scroll chemical list window so chemical of interest is at top
						$("#chemicalList").animate({
							scrollTop : (scrollto + 'px')
						}, 'slow');
	
					} else {
						//If data already loaded, hide or show the chemical details depending on the current view state
						if (chem_details.is(":visible")) {
							chem_details.hide();
						} else {
							chem_details.show();
						}
					}
				}
			});
		}
	
		function getChem(casNum) {
			var url = '//toxictrends.org/api/v3/chemical/' + casNum + '.json';
			var startTime = new Date().getTime();
			$.ajax({
				dataType : "json",
				url : url,
				success : function(data) {
					
					parseChem(casNum, data);
					ga('send', 'event', 'chemical', 'click', data.ChemName);
				},
				error: function(request){
					ga('send', 'event', 'Error', 'ajax', 'url: ' + url + ' response: ' + request.responseText);
				}
				
			}).done(function(){
						var totalTime = new Date().getTime()-startTime;
						ga('send', 'timing', 'api', 'chemical', totalTime);
					});
		}
	
		function parseChem(casNum, data) {
			var html = '';
	
			// Metal
			html += "<br /><strong>Metalic: </strong>";
			if (data.Metal === "TRUE") {
				html += 'This chemical is a metal';
			} else {
				html += 'This chemical is not a metal';
			}
	
			// Carcinogen
			html += "<br /><br /><strong>Cancer: </strong>";
			if (data.ToxicityClassInhale === "cancer" && data.ToxicityClassOral === "cancer") {
				html += "This chemical is carcinogenic through both the oral and inhalation pathways";
			} else if (data.ToxicityClassInhale === "non-cancer" && data.ToxicityClassOral === "non-cancer") {
				html += "This chemical is not known to be carcinogenic";
			} else if (data.ToxicityClassInhale === "cancer" && data.ToxicityClassOral === "non-cancer") {
				html += "This chemical is carcinogenic through the inhalation pathway but not the oral pathway";
			} else if (data.ToxicityClassInhale === "non-cancer" && data.ToxicityClassOral === "cancer") {
				html += "This chemical is carcinogenic through the oral pathway but not the inhalation pathway";
			} else {
				html += "Information on cancer causing effects are not available for this chemical";
			}
	
			// Health Effects
			html += "<br /><br /><strong>Other Health Effects: </strong>";
			if (data['Health Effects'] === undefined || data['Health Effects'] === null || data['Health Effects'].length === 0) {
				html += "Human health effects have not been identfied for this chemical";
			} else {
				html += 'Identified human health effects include: ';
				if (data['Health Effects'].length === 1) {
					html += data['Health Effects'][0];
				} else if (data['Health Effects'].length === 2) {
					html += data['Health Effects'][0] + ' and ' + data['Health Effects'][1];
				} else if (data['Health Effects'].length > 2) {
					var text = data['Health Effects'][data['Health Effects'].length - 1];
					data['Health Effects'][data['Health Effects'].length - 1] = 'and ' + text;
					html += data['Health Effects'].join(', ');
				}
			}
	
			//Federal Register
			html += "<br /><br /><strong>Federal Register: </strong>";
			if (data['Federal Register'] === "") {
				html += "There is no official definition of this chemical in the federal register";
			} else {
				html += data['Federal Register'];
			}
	
			// Aditional Information
			html += "<br /><br /><strong>Additional information: </strong>";
	
			if (data.IRIS !== "") {
				html += '<br /><a href="' + data.IRIS + '" target="_blank">Integrated Risk Information System (IRIS)</a>';
			}
			if (data.ATSDR !== "") {
				html += '<br /><a href="' + data.ATSDR + '" target="_blank">Agency for Toxic Substances and Disease Registry (ATSDR)</a>';
			}
			if (data.OPP !== "") {
				html += '<br /><a href="' + data.OPP + '" target="_blank">Office of Pesticide Programs (OPP)</a>';
			}
			if (data.OPP === "" && data.IRIS === "" && data.ATSDR === "") {
				html += "<br />None available";
			}
	
			//Add html to chemical div
			document.getElementById('inf' + casNum).innerHTML = html;
		}
	
		function initYearChangers(facility_record) {
			//remove previous listner
			$("#facility_tabs").off('click.yearchanger');
			//Set the windowYear to the mapYear on first load
			$("div.year-label").html(mapYear);
			//app.windowYear = app.mapYear;
	
			//Add click listner with yearchanger namespace for later reference
			$("#facility_tabs").on('click.yearchanger', function(e) {
				var oldyear = windowYear;
				if ($(e.target).hasClass("arrow-left")) {
					if (windowYear > minYear) {
						windowYear -= 1;
					}
				} else if ($(e.target).hasClass("arrow-right")) {
					if (windowYear < maxYear) {
						windowYear += 1;
					}
				} else {
					return;
				}
	
				if (oldyear !== windowYear) {
					$("div.year-label").html(windowYear);
					parseChemicals(facility_record);
					parseIndustry(facility_record);
					$("#chemicalList").animate({
						scrollTop : ('0px')
					}, 'fast');
					$("#IndustryList").animate({
						scrollTop : ('0px')
					}, 'fast');
				}
			});
		}
	
		// END Popup Functionality
	
		setTimeout(function() {
			google.load('visualization', '1', {
				'callback' : 'var nothing',
				'packages' : ['corechart']
			});
		}, 1000);
		
		
		// Social Share Listeners
		$(".twitter").on("click", function(){
			window.open("http://www.twitter.com/share?url=http%3A%2F%2Ftoxictrends.org&amp;text=Check%20out%20the%20Toxic%20Trends%20Mapper%20where%20you%20can%20view%20the%20emissions%20of%20facilities%20in%20your%20neighborhood",'', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=250,width=585');
			ga('send', 'social', 'twitter', 'share', 'socialTarget', {'page': '/'});
		})
		
		$(".facebook").on("click", function(){
			window.open("http://facebook.com/sharer.php?t=Toxic%20Trends%20Mapper%26amp%3Bu%3Dhttp%3A%2F%2Ftoxictrends.org",'', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=220,width=585');
			ga('send', 'social', 'facebook', 'share', 'socialTarget', {'page': '/'});
		})
		
		$(".googleplus").on("click", function(){
			window.open("https://plus.google.com/share?url=http%3A%2F%2Ftoxictrends.org",'', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=475,width=420');
			ga('send', 'social', 'google+', 'share', 'socialTarget', {'page': '/'});
		})
		
		// end document.ready function
	});
	
	function closeSearch() {
		$("#searchresultsbox").hide();
	}
	
	function showFacility(lat, lng) {
		!marker ? null : map.removeLayer(marker);
		marker = L.marker([lat, lng], {
			icon : clickedFacilityIcon
		});
		marker.addTo(map);
	}
	
	function zoomToFacility(lat, lng) {
		map.setView([lat, lng], 14);
	}
})();