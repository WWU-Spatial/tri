var app = {};
	app.currentYear = 2010;
	app.maxYear = 2010;
	app.minYear = 2001;
	app.clickedFacilityIcon = L.divIcon({className: 'clickedFacility'});
	app.closer = "<h4 class='infoCloser trans' onclick='$(\".facilityInfo\").fadeOut(500); !app.marker?null:app.map.removeLayer(app.marker);'>X</h4>";
	app.stamenAttribution = '<p>Map tiles by <a href="http://stamen.com">Stamen Design</a>,<br/>under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.<br/>Data by <a href="http://openstreetmap.org">OpenStreetMap</a>,<br/>under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.</p>';			
		
// load google api
google.load("visualization", "1", {
	packages : ["corechart"]
});
	
$(document).ready(function() {
	// initiate plugins	
		
		$(".fancybox").fancybox({
			fitToView	: false,
			width		: '90%',
			height		: '90%',
			autoSize	: false
		});
		
		$( "#tabs" ).tabs();
		
		//make facilityInfo div draggable
		//buggy when scrollbar is present
//		$( ".facilityInfo" ).draggable();
	
	// get mouse position for tooltip
		$(document).mousemove( function(e) {
		   app.mouseX = e.pageX; 
		   app.mouseY = e.pageY;
		});  
		
		app.tooltipWidth = $("hover").css("max-width");

		// replace "toner" here with "terrain" or "watercolor"
		app.toner = new L.StamenTileLayer("toner-lite", {
							attribution: app.stamenAttribution
						});
		app.terrain = new L.StamenTileLayer("terrain", {
							attribution: app.stamenAttribution 
						});
		app.streets = new L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
					   	 	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
						});
		
		app.y2010 = L.tileLayer('http://140.160.114.197/tiles/2010/{z}/{x}/{y}.png');
		app.y2009 = L.tileLayer('http://140.160.114.197/tiles/2009/{z}/{x}/{y}.png');
		app.y2008 = L.tileLayer('http://140.160.114.197/tiles/2008/{z}/{x}/{y}.png');
		app.y2007 = L.tileLayer('http://140.160.114.197/tiles/2007/{z}/{x}/{y}.png');
		app.y2006 = L.tileLayer('http://140.160.114.197/tiles/2006/{z}/{x}/{y}.png');
		app.y2005 = L.tileLayer('http://140.160.114.197/tiles/2005/{z}/{x}/{y}.png');
		app.y2004 = L.tileLayer('http://140.160.114.197/tiles/2004/{z}/{x}/{y}.png');
		app.y2003 = L.tileLayer('http://140.160.114.197/tiles/2003/{z}/{x}/{y}.png');
		app.y2002 = L.tileLayer('http://140.160.114.197/tiles/2002/{z}/{x}/{y}.png');
		app.y2001 = L.tileLayer('http://140.160.114.197/tiles/2001/{z}/{x}/{y}.png');
		app.utfGrid = new L.UtfGrid('http://140.160.114.197/utfgrid/2010/{z}/{x}/{y}.grid.json?callback={cb}');

		app.map = L.map('map', {
				center: new L.LatLng(39, -98),
				zoom: 5,
				layers: [app.toner, 
							app.y2010, 
							app.utfGrid],
				maxZoom: 16			
				})
				// hide loading message on map load
				.whenReady(function(){					
						$('#loading').fadeOut(500);
					}
				);

		
		app.utfClick = function (e) {
			if (e.data) {			
				var dataURL = 'http://140.160.114.197/api/v2/facility/' + e.data.facilitynu + '.json';
				$.ajax({
					    url: dataURL,
						contentType: 'application/json',
					    dataType: "json",
					    type: 'GET',
						crossDomain: true,
					    success: function(response){
							handleFacility(response);
					    },
						error: function(err){
							console.log(err);
						}
					});
			}
		}; 
		
		app.utfGrid.on('click', app.utfClick); 
		
		function handleFacility(response){
			var json = JSON.stringify(response, null, 2);
			var parsed = $.parseJSON(json);
			
			showFacility(parsed.Latitude,parsed.Longitude);
//			!app.marker?null:app.map.removeLayer(app.marker);			
//			app.marker = L.marker([parsed.Latitude,parsed.Longitude], {icon: app.clickedFacilityIcon});
//			app.marker.addTo(app.map);
			
//			var zoomTo = "<h5 class='zoomTo trans' onclick='zoomToFacility("+parsed.Latitude+","+parsed.Longitude+")'>Zoom to Facility</h5>"; 

//			var list = "<ul>";
//			var text = "";
			try {
				createTabs(parsed);
//				$.each(parsed.Emissions, function(item){
//					list += "<li><a href='#" + item + "'>" + item + "</a></li>";
//					text += "<div id='" + item + "'><p>";
//					$.each(this, function(k, v){
//						if (typeof v === 'object') {
//							$.each(this, function(k1, v1){
//								v1 !== null && v1 !== "" ? text += k1 + ": " + v1 + "<br/>" : null;
//							});
//						}
//						else {
//							text += k + ": " + v + "<br/>";
//						}
//						text += "<br/>";
//					});
//					text += "</p></div>";
//				});
//				var info = "<div id='info'><p>" + parsed.Street + "<br/>" + parsed.City + ", " + parsed.State + " " + parsed.ZIP9 + "<br/><br/>Facility ID: " + parsed.FacilityID + "<br/>Facility Number: " + parsed.FacilityNumber + "<br/>NAICS3: " + parsed.NAICSCode3Digit + "<br/>NAICS4: " + parsed.NAICSCode4Digit + "<br/>Parent Company: " + parsed.ParentName + "<br/></p></div>";
//				text += info;
//				list += "<li><a href='#info'>info</a></li></ul>";
//				
//				var name = "<h4 class='infoTitle'>" + parsed.Name + "</h4>";
//				
//				$('#tabs').html(name + app.closer + list + text + zoomTo);
//				$("#tabs").tabs("refresh");
//				
//				
//				//activate tab for currentyear on map	
//				//doesn't work because tabs all get default tabindex of -1 for some reason
//				//			var index = $('#tabs ul').index($('#'+JSON.stringify(app.currentYear)));
//				//			$('#tabs').tabs({active: index});
//				
//				//activate info tab by default	
//				$("#tabs").tabs({
//					active: -1
//				});
//				
//				$(".facilityInfo").fadeIn(500);
			} 
			catch (err) {
				console.log(err);
			}
		}

		app.hover_timer = false;
		app.utfMouseover = function(e){
			if (e.data) {
				$('#hover').html(e.data.name);
				clearTimeout(app.hover_timer);
			}
			
			$('#hover')
				.css({
					'display': 'block'
				});
		}
		
		app.utfGrid.on('mouseover', app.utfMouseover);
		
		app.utfGrid.on('mouseout', function (e) {
			app.hover_timer = setTimeout(function(){
			$('#hover')
//				.stop()
//				.animate({duration:20,queue:false, width:'0px', 'max-height':'0px', padding:'0px'})
				.hide()
			}, 200);
		});
		
		app.map.on('mousemove', function (e) {
				$('#hover')
				.css({
					'top': app.mouseY + 5,
					'left': app.mouseX + 10
				});
		});
		
		
		// hide facility tooltip on mouseout from map		
		app.map.on('mouseout', function (e) {
				$('#hover')
	//				.stop()
	//				.animate({duration:20,queue:false, width:'0px', 'max-height':'0px', padding:'0px'})
					.hide();
		});
				
		app.baseMaps = {
		    "Toner": app.toner,
			"Streets": app.streets,
			"Terrain": app.terrain
		};
		
		app.overlayMaps = {
		    "L2010": app.y2010,
		    "L2009": app.y2009,
			"L2008": app.y2008,
			"L2007": app.y2007,
			"L2006": app.y2006,
			"L2005": app.y2005,
			"L2004": app.y2004,
			"L2003": app.y2003,
			"L2002": app.y2002,
			"L2001": app.y2001
		};	

		// change year
		$('#upyear').bind('click', function(){toggleUp()});
		$('#downyear').bind('click', function(){toggleDown()});
		
		function toggleUp(){
			if (app.currentYear < app.maxYear) {
				app.map.removeLayer(app.overlayMaps['L'+app.currentYear]);
				app.currentYear += 1;
				var New = 'L'+app.currentYear;
				app.map.addLayer(app.overlayMaps[New]);
				$('#currentyear').html(app.currentYear);			
			}
		}
		
		function toggleDown () {
			if (app.currentYear > app.minYear) {
				app.map.removeLayer(app.overlayMaps['L'+app.currentYear]);
				app.currentYear -= 1;
				var New = 'L'+app.currentYear;
				app.map.addLayer(app.overlayMaps[New]);
				$('#currentyear').html(app.currentYear);
			}
		}
		
		//change basemap
		$('#tonerThumb').bind('click', function(){changeBasemap('Toner')});
		$('#streetsThumb').bind('click', function(){changeBasemap('Streets')});
		$('#terrainThumb').bind('click', function(){changeBasemap('Terrain')});
		
		function changeBasemap(lyr){
			for (var item in app.baseMaps) {
				var obj = app.baseMaps[item];
				if(app.map.hasLayer(obj)){
					app.map.removeLayer(obj);
				}
				app.map.addLayer(app.baseMaps[lyr]);
				app.baseMaps[lyr].bringToBack();
			}
		}
		
		// add handlers for  attribution
		$('div.leaflet-bottom.leaflet-right').prepend("<div class='autoattribution trans'><p>basemap info</p><p style='display:none'>hide</p></div>");
		
		// toggle attribution info
		$('.autoattribution').click(function(e){
			 e.stopPropagation();
			$('.leaflet-control-attribution').toggle("slow");
			$('.autoattribution').toggleClass("hidetoggle");
			$('.autoattribution > p').toggle();
		});
		
		// stop mouseover info for facilities when under attribution
		$('div.leaflet-bottom.leaflet-right').mouseenter(function(e){
			e.stopPropagation();
			app.utfGrid.off('mouseover');
			app.utfGrid.off('click');
		});
		$('div.leaflet-bottom.leaflet-right').mouseleave(function(e){
			app.utfGrid.on('mouseover', app.utfMouseover);
			app.utfGrid.on('click', app.utfClick);
		});
		
		/// search
		$('#search').on('focus', clearDefaultSearchText);
		$('#search').on('blur', replaceDefaultSearchText);
		
		function clearDefaultSearchText(){
			if (this.value === "Search for a facility") {
				this.value = "";
			}
		}
		
		function replaceDefaultSearchText(){
			if (this.value === "") {
				this.value = "Search for a facility";
			}
		}
		
		$('#search').keydown(function(e){
			$this = $(this);
			if (e.keyCode === 13) {
				$('#loading').fadeIn(500)
				$.ajax({
					url:  'http://140.160.114.197/search/tri/facilities/?q=' + $this.val(),
					success: function(r){
							$("#searchresults").empty();
							if(r.hits.hits[0]){
								$("#searchresultsbox").height('60%');
								$.each(r.hits.hits, function(){
									var f = this._source;
									var item = $('<p class="searchresult">'+f.Name + " - " + f.City + ", " + f.State+'</p>')
										.on('mouseover',function(e){
											showFacility(f.Latitude, f.Longitude)
										}).on('click',function(e){
											zoomToFacility(f.Latitude,f.Longitude);
											createTabs(f);
										});
									$("#searchresults").append($(item)[0]);
								});
							}else{
								$("#searchresultsbox").height(100);
								$("#searchresults").html("<p>No results for this search.</br>Please try something else.</p>");
							};
							$("#searchresultsbox").css('display') === 'none' ? $("#searchresultsbox").toggle() : null;
							$('#loading').fadeOut(500);
					},
					error: function(e){
						console.log(e);
						$('#loading').fadeOut(500);
					}
				});
			}
		});
		
// end document.ready function
});

function closeSearch(){
	$("#searchresultsbox").toggle();
	$("#searchresults").empty();
}

function showFacility(lat,lng){
	!app.marker?null:app.map.removeLayer(app.marker);			
	app.marker = L.marker([lat ,lng] , {icon: app.clickedFacilityIcon});
	app.marker.addTo(app.map);	
}

function zoomToFacility(lat,lng){
	app.map.setView( [lat,lng], 14 );
}

function createTabs(parsed){
//	console.log(parsed);
	var zoomTo = "<h5 class='zoomTo trans' onclick='zoomToFacility("+parsed.Latitude+","+parsed.Longitude+")'>Zoom to Facility</h5>";
	var list = "<ul>";
	var text = "";
	try{
		l = 0;
		$.each(parsed.Emissions, function(item){
			l+=1;
			list += "<li><a href='#" + item + "'>" + item + "</a></li>";
			text += "<div id='" + item + "'><p>";
			$.each(this, function(k, v){
				if (typeof v === 'object') {
					// the search results need this to handle if there is more than one pollutant in a year (click/query doesn't need this...)
						if (this[0]) {
							app.thisthing=this;
							$.each(this, function(){
								text += "<br/>";
								$.each(this, function(k1, v1){
									v1 !== null && v1 !== "" ? text += k1 + ": " + v1 + "<br/>" : null;
								});
							});
						}
						else {
							$.each(this, function(k2, v2){
								v2 !== null && v2 !== "" ? text += k2 + ": " + v2 + "<br/>" : null;
							});
						}
				}else {
					text += k + ": " + v + "<br/>";
				}
				text += "<br/>";
			});
			text += "</p></div>";
		});
//		var $data=this;
		createChart(l,parsed);
	}catch(err){
//		console.log(err);
	}
	
	var info = "<div id='info'><p>" + parsed.Street + "<br/>" + parsed.City + ", " + parsed.State + " " + parsed.ZIP9 + "<br/><br/>Facility ID: " + parsed.FacilityID + "<br/>Facility Number: " + parsed.FacilityNumber + "<br/>NAICS3: " + parsed.NAICSCode3Digit + "<br/>NAICS4: " + parsed.NAICSCode4Digit + "<br/>Parent Company: " + parsed.ParentName + "<br/></p><div class='graph'></div></div>";
	text += info;
	list += "<li><a href='#info'>info</a></li></ul>";
	
	var name = "<h4 class='infoTitle'>" + parsed.Name + "</h4>";

	$('#tabs').html(name + app.closer + list + text + zoomTo);
	$("#tabs").tabs("refresh");
	
	
	//activate tab for currentyear on map	
	//doesn't work because tabs all get default tabindex of -1 for some reason
	//			var index = $('#tabs ul').index($('#'+JSON.stringify(app.currentYear)));
	//			$('#tabs').tabs({active: index});
	
	//activate info tab by default	
	$("#tabs").tabs({
		active: -1
	});
	
	$(".facilityInfo").fadeIn(500);
}

function createChart(l,data){
	console.log(l,data);		
	if (l === 1 || l === 0) {
		// none or only one year so set the chart area to say no chart
		$('.graph').html('<p class="noChart">Not enough data for a chart</p>');
	}
	else {
		$('.graph').html('');
		var da = [['Year', 'Total Pounds Released', 'Risk']];
		$.each(data.Emissions, function(k, v){
			console.log(k,v);
			da.push([k, v.TotalPounds, v.TotalScore]);
		});
		drawChart(da);
	}
}

function drawChart(d) {
	console.log(d);
	var data = google.visualization.arrayToDataTable(d);
	console.log(data);
	options = {
		title : 'Facility Performance'//,
//		chartArea: {right:0, width: '45%'}
	};
	var chart = new google.visualization.LineChart($('.graph')[0]);
	console.log(chart);
	chart.draw(data, options);
	app.chart = chart;
}
	