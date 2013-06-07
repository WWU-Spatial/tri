dojo.require("dijit.dijit"); // optimize: load dijit layer
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.TabContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.Slider");
dojo.require("esri.map");  
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.tasks.query");
dojo.require("esri.dijit.Popup");
dojo.require("esri.tasks.find");
dojo.require("dojo.number");
dojo.require("dojox.charting.themes.Julie");
dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.axis2d.Default");
dojo.require("dojox.charting.plot2d.Lines");

var map, 
	basemapGallery,
	minYear = 1996,
	maxYear = 2010,
//	maxYear = 2007,
	curYear = 2007, //TODO change to maxYear when all data is available
//	curYear = maxYear, 
	alertShown = false, //TODO remove this var
	queryTask,
	query,
	waitCount,
	infowindowFeatures = [],
	infoTemplate,
	click,
	slider,
	timeExtent,
	facilityQueryId = 0,
	performanceMode = 0,
	outFields = ["tri.tri.custom_facility.facilitynumber",
				"tri.tri.facility.name",
				"tri.tri.custom_facility.latitude",
				"tri.tri.custom_facility.longitude",
				"tri.tri.custom_facility.poundsreleased",
				"tri.tri.custom_facility.totalscore",
				"tri.tri.custom_facility.poundsreleaseddecile",
				"tri.tri.custom_facility.totalscoredecile",
				"tri.tri.facility.facilityid",
				"tri.tri.facility.stackheight",
				"tri.tri.facility.stackvelocity",
				"tri.tri.facility.stackdiameter",
				"tri.tri.facility.radialdistance",
				"tri.tri.facility.street",
				"tri.tri.facility.city",
				"tri.tri.facility.state",
				"tri.tri.facility.zipcode",
				"tri.tri.facility.federalfacilityflag",
				"tri.tri.facility.parentname",
				"tri.tri.facility.publiccontactname",
				"tri.tri.facility.publiccontactphone"];
				
/* FUNCTIONS */

function createBasemapGallery(){
	var basemaps = [], basemapGray, basemapStreets, basemapImagery, basemapSelect, option;
	basemapGray = new esri.dijit.Basemap({
		layers: [new esri.dijit.BasemapLayer({
			url: "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer"
		})],
		id: "gray",
		title: "Default"
	});
	basemapStreets = new esri.dijit.Basemap({
		layers: [new esri.dijit.BasemapLayer({
			url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
		})],
		id: "streets",
		title: "Streets"
	});
	basemapImagery = new esri.dijit.Basemap({
		layers: [new esri.dijit.BasemapLayer({
			url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
		})],
		id: "imagery",
		title: "Imagery"
	});
	basemaps.push(basemapGray);
	basemaps.push(basemapStreets);
	basemaps.push(basemapImagery);
	
	basemapGallery = new esri.dijit.BasemapGallery({
		showArcGISBasemaps: false,
		basemaps: basemaps,
		map: map
	});
	basemapGallery.startup();
	dojo.connect(basemapGallery, "onError", function(error){
//		console.log(error);
	});
}

function changeBasemap(){
	basemapGallery.select(this.value);
}

function changeTime(){
	var timelabel = document.getElementById("currentyear"),
		slider = dojo.byId("slider");
}

function openContainer(containerID){
	var containers = ['basemap_container','data_container','social_container'];
	for (i=0; i<containers.length; i++) {
		if(containerID != i) {
			document.getElementById(containers[i]).style.display = 'none';
		} else {
			if (document.getElementById(containers[i]).style.display === 'block') {
				document.getElementById(containers[i]).style.display = 'none';
			} else {
				document.getElementById(containers[i]).style.display = 'block';
			}
		}
	}
}

function changeTabs(tabs){
	var tabsDiv = document.getElementById(tabs);
	document.getElementById("demographic_tabs").style.display = 'none';
	tabsDiv.style.display = 'block';
	
}

//************************ CHANGE CSS FUNCTIONS ***************************************\\
function waiting () {
	
}

//************************ QUERY FACILITY FUNCTIONS ***********************************\\

function queryFacilities(e) {
	var clickwidths = [3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 17, 18],
		padding = map.extent.getWidth() / map.width * clickwidths[map.getLevel()],	
		queryGeom = new esri.geometry.Extent(e.mapPoint.x - padding, e.mapPoint.y - padding, e.mapPoint.x + padding, e.mapPoint.y + padding, map.spatialReference),
		query = new esri.tasks.Query(),
		popupTemplate,
		queryTask = new esri.tasks.QueryTask("http://140.160.114.190/ArcGIS/rest/services/TRI/data/MapServer/0");
		click = e;
		var attachQueryId = function attachQueryId(results) {
			getReleases(results, facilityQueryId);
			facilityQueryId++;
			};
		query.outSpatialReference = {"wkid": 102100};
		query.returnGeometry = true;
//		query.where = "year_=" + 2007;
		query.where = "year_=" + curYear;
        query.outFields = outFields;
        query.geometry = queryGeom;
		queryTask.execute(query, attachQueryId);
		console.log(queryTask, query, attachQueryId);
		// show loading display
//		$('#loading').fadeIn(500);
}

function getReleases(facilitiesquery, queryID){
	var queryTask = new esri.tasks.QueryTask("http://140.160.114.190/ArcGIS/rest/services/TRI/data/MapServer/18"),
	query,
	attributes,
	facilities = facilitiesquery.features;
	
	for (var i=0, il=facilities.length; i<il; i++){
		query = new esri.tasks.Query();
		query.returnGeometry = false;
		query.where = "facilitynumber=" + facilities[i].attributes['tri.tri.custom_facility.facilitynumber'];
	    query.outFields = ["facilitynumber", "year_", "poundsreleased", "totalscore"];
		
		queryTask.execute(query, function(featureset){
				dojo.forEach(facilities, function(facility){
					if (facility.attributes['tri.tri.custom_facility.facilitynumber'] === featureset.features[0].attributes.facilitynumber){
						dojo.forEach(featureset.features, function(feature) {
							facility.attributes[feature.attributes.year_ + 'pounds'] = dojo.number.format(feature.attributes.poundsreleased, {
								round: 0,
								places: 0
							});
							facility.attributes[feature.attributes.year_ + 'risk'] = dojo.number.format(feature.attributes.totalscore, {
								round: 0,
								places: 0
							});
						});					
						handleFacilities(facility, queryID);
					}
				});
			});
	}
}

function handleFacilities(facility, queryID) {
	if (queryID < facilityQueryId-1){
		return;
	}
	
	var popupTemplate = new esri.dijit.PopupTemplate(),
	content = "<div class=\x22facility_popup\x22></div> \
						<div class=\x22facility_title\x22>" + "<a href=\"http://ofmpub.epa.gov/enviro/tris_control_v2.tris_print?tris_id=" + facility.attributes['tri.tri.facility.facilityid'] + "\" target=\"blank\">" +  facility.attributes['tri.tri.facility.name'] + "</a><br />" + hasParentCompany(facility) + "<hr /> \
						<div id=\x22popupPounds\x22 class=\x22pounds scores\x22>" + checkReported(facility.attributes[curYear + 'pounds']) + "</div> \
						<div id=\x22popupRisk\x22 class=\x22risk scores\x22>" + checkReported(facility.attributes[curYear + 'risk']) + "</div> \
						<div class=\x22units\x22>pounds released</div> \
						<div class=\x22units\x22>risk score</div> \
					</div> \
					<div class=\x22address\x22>" + facility.attributes['tri.tri.facility.street'] + "</br> \
						" + facility.attributes['tri.tri.facility.city'] + ", " + facility.attributes['tri.tri.facility.state'] + " " + facility.attributes['tri.tri.facility.zipcode'] + "</br> \
						" + facility.attributes['tri.tri.custom_facility.latitude'] + " " + facility.attributes['tri.tri.custom_facility.longitude'] + "\
					</div>";
	//infowindowFeatures[queryID] = typeof(infowindowFeatures[queryID] != 'undefined' && infowindowFeatures[queryID] instanceof Array ) ? infowindowFeatures[queryID] : [];
	infowindowFeatures[queryID] = infowindowFeatures[queryID] || [];
	infowindowFeatures[queryID].push(facility);
	facility.setInfoTemplate(popupTemplate);
	popupTemplate.setContent(content);
	updatePopup();

}

function updatePopup(){
	var infoWindowIndex = map.infoWindow.selectedIndex;

	//map.infoWindow.setTitle("");
	//map.infoWindow.setContent(content);
	map.infoWindow.setFeatures(infowindowFeatures[facilityQueryId-1]);
	map.infoWindow.select(infoWindowIndex);
	(click) ? map.infoWindow.show(click.screenPoint,map.getInfoWindowAnchor(click.screenPoint)) : null;
	
	
	//hide loading display
//	$('#loading').fadeOut(500);
}

function hasParentCompany(facility){
	if (facility.attributes['tri.tri.facility.parentname'] !== "" && facility.attributes['tri.tri.facility.parentname'] !== "NA") {
		return "<em>" + facility.attributes['tri.tri.facility.parentname'] + "</em><br />";
	}
	return "";
}

function checkReported(facilityValue){
	if (facilityValue){
		return facilityValue
	} else {
		return "None Reported"
	}
}

//************************ END QUERY FACILITY FUNCTIONS ***********************************\\

function findFacility(event){
	var findTask, findParams, searchText;
	if (event.keyCode === 13) {
		searchText = document.getElementById('search').value;
		
		findTask = new esri.tasks.FindTask("http://140.160.114.190/ArcGIS/rest/services/TRI/facility/MapServer");
		findParams = new esri.tasks.FindParameters();
		findParams.returnGeometry = false;
		findParams.layerIds = [0];
		findParams.searchFields = ["facilityid", "facilitynu", "name", "zipcode", "zip9", "parentname", "city", "federalage", "parentduns", "npdespermi"];
		
		findParams.searchText = searchText;
//		console.log(searchText, findParams);
		findTask.execute(findParams, findFacilityResults, findFacilityError);
		
		//show loading display
		$('#loading').fadeIn(500);
	}
}

function findFacilityError(e){
//	console.log(e);
}

function findFacilityResults(results){
	// hide loading display	
	$('#loading').fadeOut(500);
	
	var items, data;
	deleteSearch();
	
	searchresults = dojo.create("div", {
		id: "searchresultsbox",
		classname: "dropshadow",
		innerHTML: "<div class=\"menu_close\" onclick=\"deleteSearch()\">close</div><div id=\"searchresults\"></div>"
	}, dojo.body());
	items = dojo.map(results, function(result){
		return result.feature.attributes;
	});
	
	data = {
		identifier: "search results",
		items: items
	};
	
	
	if(data.items[0]){
		$("#searchresultsbox").height('60%');
		for (var item in data.items) {
			dojo.create("div", {
				classname: "searchresult",
				innerHTML: data.items[item].name + "</br >" + data.items[item].street + "</br >" + data.items[item].city + ", " + data.items[item].state + " " + data.items[item].zipcode + "</br>" + data.items[item].latitude + " " + data.items[item].longitude,
				onclick: "zoomFacility(" + data.items[item].latitude + ", " + data.items[item].longitude + ")"
			}, "searchresults");
		}
	}else{
		$("#searchresultsbox").height(100);
		dojo.create("div", {
				classname: "searchresult",
				innerHTML: "No results for this search.</br>Please try something else.",
				style: "font-size:20px;"
			}, "searchresults");
	}
	
}

function zoomFacility(latitude, longitude) {
	var extent, x, y, pointweb, screenpoint, evt, extentChangeEvt;
	pointweb = esri.geometry.geographicToWebMercator(new esri.geometry.Point(longitude, latitude, new esri.SpatialReference({ wkid: 4326 })));
	extent = new esri.geometry.Extent(pointweb.x - 8000, pointweb.y - 6000, pointweb.x + 8000, pointweb.y + 6000, new esri.SpatialReference({"wkid": 102100}));
	map.setExtent(extent);
	click = {};
	screenpoint = esri.geometry.toScreenGeometry(map.extent,map.width,map.height,pointweb);
	
	// hide searchresultsbox on zoomFacility for mobile/small screens
	$('#searchresultsbox').width()>'350' ? $('#searchresultsbox').fadeOut('3000') : null;
	
}

function deleteSearch(){
	if(dojo.byId("searchresultsbox")){	
		dojo.query(dojo.byId("searchresultsbox")).orphan();
	}else{
		/** move on */
	}
}

function addSearchListeners(){
	var searchbox = document.getElementById("search");
	if (searchbox.addEventListener) {
		searchbox.addEventListener('focus', clearDefaultSearchText, false);
		searchbox.addEventListener('blur', replaceDefaultSearchText, false);
		searchbox.addEventListener('keydown', findFacility, false);
	}
	else {
		searchbox.attachEvent('focus', clearDefaultSearchText, false);
		searchbox.attachEvent('blur', replaceDefaultSearchText, false);
	}
}

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
	
function attachSomeHandlers(){
	$(window).resize(toggleBaseThumbs);

//	if ($.browser.msie && parseInt($.browser.version, 10) <= 8) {
//		// lte IE 8 doesn't support css media queries so don't deal with mobile footer and hideAbout..
//	}else{	
//		$(window).resize(checkForMobileFooter);
//	}
	$('#ecosLogoDiv').bind('click',function(){
		window.open('http://www.ecos.org/','_blank');
	});
}	
	
/* INIT */

function init() {
	
	attachSomeHandlers();
	
	var initExtent,
	    lods = [
			  {"level" : 0, "resolution" : 9783.93962049996, "scale" : 36978595.474472},//LOD 04
			  {"level" : 1, "resolution" : 4891.96981024998, "scale" : 18489297.737236},//LOD 05
			  {"level" : 2, "resolution" : 2445.98490512499, "scale" : 9244648.868618},	//LOD 06
			  {"level" : 3, "resolution" : 1222.99245256249, "scale" : 4622324.434309},	//LOD 07
			  {"level" : 4, "resolution" : 611.49622628138, "scale" : 2311162.217155},	//LOD 08
			  {"level" : 5, "resolution" : 305.748113140558, "scale" : 1155581.108577},	//LOD 09
			  {"level" : 6, "resolution" : 152.874056570411, "scale" : 577790.554289},	//LOD 10
			  {"level" : 7, "resolution" : 76.4370282850732, "scale" : 288895.277144},	//LOD 11
			  {"level" : 8, "resolution" : 38.2185141425366, "scale" : 144447.638572},	//LOD 12
			  {"level" : 9, "resolution" : 19.1092570712683, "scale" : 72223.819286},	//LOD 13
			  {"level" : 10, "resolution" : 9.55462853563415, "scale" : 36111.909643},	//LOD 14
			  {"level" : 11, "resolution" : 4.77731426794937, "scale" : 18055.954822},	//LOD 15
			  {"level" : 12, "resolution" : 2.38865713397468, "scale" : 9027.977411}	//LOD 16
			],
		params,
	//	gsvc = new esri.tasks.GeometryService("http://140.160.114.190/arcgis/rest/services/Utilities/Geometry/GeometryServer"),
		popup = new esri.dijit.Popup(null, dojo.create("div"));
	
	initExtent = new esri.geometry.Extent(-15844880, 2411963, -5401111, 7128276, new esri.SpatialReference({"wkid": 102100}));
	esri.config.defaults.map.slider = { right:"5px", top:"100px", width:null, height:"250px" };
	map = new esri.Map("map",{	wrapAround180:true,
								logo:false,
								lods:lods,
								"infoWindow": popup,
								extent:initExtent});
	createBasemapGallery();
	addSearchListeners();

	dojo.connect(map, 'onLoad', function(){
		// hide loading message
		$('#loading').fadeOut(500);
		resizeMap();
	})
	
	
	dojo.connect(map, 'onLoad', function(theMap) { 
        //resize the map when the browser resizes
        dojo.connect(dijit.byId('map'), 'resize', map,map.resize);
    });
	
	// hide/show basemap selector buttons on popup show/hide for mobile
	dojo.connect(popup,"onShow",function(){
		$(window).width()<='925' ? $(".base_thumb").hide() : null;
	  });
	dojo.connect(popup,"onHide",function(){
	    $(window).width()<='925' ? $(".base_thumb").show() : null;
	  });
	  
	//onorientationchange doesn't always fire in a timely manner in Android so check for both orientationchange and resize 
    var supportsOrientationChange = "onorientationchange" in window,
        orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
	
	if ($.browser.msie  && parseInt($.browser.version, 10) <= 8) {
	  	// lte IE 8  doesn't support window.addEventListener so use attachEvent instead.. 
		window.attachEvent(orientationEvent,function(){
			orientationChanged();
		});
	}else{
	  	window.addEventListener(orientationEvent, function () {
	        orientationChanged();
	    }, false);
	}
	
	dojo.connect(map, 'onZoomEnd', function() { 
        //Change legend for each zoom level
		var widths = [0, 0, 0, 0, -130,-266,-402,-537,-673,-808,-944,-1079,-1216,-1352],
			level = map.getLevel(),
			legend = document.getElementById("legendPounds");
			
		if (widths[level] === 0) {
			legend.style.display = "none";
		} else {
			legend.style.display = "block";
			legend.style.backgroundPosition = widths[level] + "px 0px";
		}

    });
	
	dojo.connect(map, 'onLoad', function() {
			var facility1996 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/1996/MapServer",  {id:"1996", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility1997 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/1997/MapServer",  {id:"1997", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility1998 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/1998/MapServer",  {id:"1998", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility1999 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/1999/MapServer",  {id:"1999", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility2000 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2000/MapServer",  {id:"2000", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility2001 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2001/MapServer",  {id:"2001", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility2002 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2002/MapServer",  {id:"2002", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility2003 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2003/MapServer",  {id:"2003", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility2004 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2004/MapServer",  {id:"2004", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility2005 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2005/MapServer",  {id:"2005", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility2006 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2006/MapServer",  {id:"2006", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility2007 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2007/MapServer",  {id:"2007", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:true}),//TODO update to correct visibilities when new data is published
				// TODO - change url for each once new data is published
				facility2008 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2007/MapServer",  {id:"2008", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility2009 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2007/MapServer",  {id:"2009", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false}),
				facility2010 = new esri.layers.ArcGISTiledMapServiceLayer("http://140.160.114.190/ArcGIS/rest/services/TRI/2007/MapServer",  {id:"2010", displayLevels:[4,5,6,7,8,9,10,11,12,13,14,15,16], visible:false});
		
		
		dojo.connect(facility2007, "onError", function(error){
//			console.log('layer didnt load');
		});
		
		map.addLayers([facility1996, facility1997, facility1998, facility1999, facility2000, facility2001, facility2002, facility2003, facility2004, facility2005, facility2006, facility2007]);

		map.reorderLayer('2007', 20);
		
		
		
	});
	dojo.connect(map, 'onClick', queryFacilities);
	

	//Create Time Slider
	dojo.ready(function() {
		slider = new dijit.form.HorizontalSlider({
			name: "slider",
			value: maxYear,
			minimum: minYear,
			maximum: maxYear,
			intermediateChanges: true,
			discreteValues: maxYear - minYear + 1,
			style: "width: 200px;",
			onChange: function(value){
				var timelabel = document.getElementById("currentyear");
				while (timelabel.childNodes.length >= 1) {
					timelabel.removeChild(timelabel.firstChild);
				}
//				console.log(value);
				timelabel.appendChild(timelabel.ownerDocument.createTextNode(value));
				if(value>2007){
					if(!alertShown){
						alert('Sorry, data not yet available for years after 2007');//TODO remove this once new data years are added
						alertShown = true;
					}
				}else{				
					map.getLayer(curYear).hide();
					
					curYear = value;
					if (performanceMode != 1) {
						map.getLayer(curYear).show();
						
					}
					
					if (map.infoWindow.isShowing){
						for (i in map.infoWindow.features){
							var content = "<div class=\x22facility_popup\x22></div> \
											<div class=\x22facility_title\x22>" + "<a href=\"http://ofmpub.epa.gov/enviro/tris_control_v2.tris_print?tris_id=" + map.infoWindow.features[i].attributes['tri.tri.facility.facilityid'] + "\" target=\"blank\">" +  map.infoWindow.features[i].attributes['tri.tri.facility.name'] + "</a><br />" + hasParentCompany(map.infoWindow.features[i]) + "<hr /> \
											<div id=\x22popupPounds\x22 class=\x22pounds scores\x22>" + checkReported(map.infoWindow.features[i].attributes[curYear + 'pounds']) + "</div> \
											<div id=\x22popupRisk\x22 class=\x22risk scores\x22>" + checkReported(map.infoWindow.features[i].attributes[curYear + 'risk']) + "</div> \
											<div class=\x22units\x22>pounds released</div> \
											<div class=\x22units\x22>risk score</div> \
										</div> \
										<div class=\x22address\x22>" + map.infoWindow.features[i].attributes['tri.tri.facility.street'] + "</br> \
											" + map.infoWindow.features[i].attributes['tri.tri.facility.city'] + ", " + map.infoWindow.features[i].attributes['tri.tri.facility.state'] + " " + map.infoWindow.features[i].attributes['tri.tri.facility.zipcode'] + "</br> \
											" + map.infoWindow.features[i].attributes['tri.tri.custom_facility.latitude'] + " " + map.infoWindow.features[i].attributes['tri.tri.custom_facility.longitude'] + "\
										</div>"
										
							map.infoWindow.features[i].infoTemplate.content = content;
							map.infoWindow.select(map.infoWindow.selectedIndex);
						}
	
					}
					//End infoWindow Update
				}
				
				}
			}, "slider");
	});
}

function orientationChanged() {
    if (map) {
        resizeMap();
    }
}

function resizeMap() {	
    map.reposition();
    map.resize();
}

function checkForMobileFooter(){
	($(window).width()>='700')?$('#hideAbout').css({display:'none'}):($('#footer').css('height')==='0px')?$('#hideAbout').css({display:'none'}):$('#hideAbout').css({display:'block'});
}

// show base_thumbs on resize to window.width >925px in case hidded when popup shown
function toggleBaseThumbs(){
	$(window).width()>'925' ? $('.base_thumb').show() : null;
	$(window).width()<='925' && $('div.esriPopup').css('visibility') === "visible" ? $('.base_thumb').hide() : $('.base_thumb').show();
}

// hide and show about div and legend on mobile devices onclick
function showAbout(){
	if($('#footer').hasClass('mobileFooter')){
		$('#hideAbout').fadeOut(300);
		$('#footer').removeClass('mobileFooter');
		$('.legendRisk').css({display:'block'});
	} else{
		$('#hideAbout').fadeIn('slow');
		$('#footer').addClass('mobileFooter').fadeIn('slow');
		$('.legendRisk').css({display:'none'});
	}
}

dojo.addOnLoad(init);