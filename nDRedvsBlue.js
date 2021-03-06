//Austin Hester

// handle check custom box
function handleCustom(checkbox) {
	if (checkbox.checked == true) {
		document.getElementById("checkanimate").disabled = false;
		//document.getElementById("checkanimate").checked = true;
	} else {
		document.getElementById("checkanimate").disabled = true;
		//document.getElementById("checkanimate").checked = false;
	}
}
// load your charts
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(initChart);
var red = '#ff1a1a';
var blue = '#1affff';
/************************ Objects ******************************/
/************************ Tile Object **************************/
// For holding tile information
var Tile = function(loc) {
	this.indices = [];
	this.setLocation(loc);
	// following 3 for drawing
	this.width = 80;
	this.x = this.indices[0] * this.width + 30;
	this.y = this.indices[1] * this.width + 60;
	this.touches = 0;
	this.redMarked = false;
	this.blueMarked = false;
	this.color = "white";
};
// Marks tile and adds a touch
Tile.prototype.setMarked = function(flag, color) {
	if (color == red)
		this.redMarked = flag;
	if (color == blue)
		this.blueMarked = flag;
	if (flag) 
		this.touches++;
}
// Sets location of tile
Tile.prototype.setLocation = function(loc) {
	var ind = loc.getIndices();	// indices of new location
	for (var i = 0; i < ind.length; i++) {
		this.indices[i] = ind[i];
	}
}
// Gets location of tile
Tile.prototype.getLoc = function() {
	return new Location(this.indices);
}
// Sets color of tile
Tile.prototype.setColor = function(color) {
	if (this.color == "white") {
		this.color = color;	// text color
	} else if (this.color != color) {
		this.color = "magenta";	// when touched by both
	}
}
/************************ Location Object **********************/
// Location takes a size n 1d-array of values
// n will be the number of dimensions in the simulation
var Location = function(loclist) {
	this.indices = [];
	for (var i = 0; i < loclist.length; i++) {
		this.indices.push(loclist[i]);
	}
};
// return specific indices 
Location.prototype.getIndices = function() {
	return this.indices;
}
// tests if location is the same
Location.prototype.matches = function(other) {
	var oloc = other.getIndices();
	for (var i = 0; i < oloc.length; i++) {
		if (this.indices[i] != oloc[i])
			return false;
	}
	return true;
}
// tests if location is in grid
Location.prototype.isInGrid = function(ndims, gridsize) {
	if (ndims == 1) {
		if (this.indices[1] != 0)
			return false;
	}
	for (var i = 0; i < this.indices.length; i++) {

		if (this.indices[i] < 0 || this.indices[i] >= gridsize) {
			return false;
		}
	}
	return true;
}
/************************ Marker Object ************************/
// Holding marker information
var Marker = function(loc, color) {
	this.homeloc = loc;
	this.indices = [];
	this.setLocation(loc);
	this.color = color;
	this.moves = 0;
	this.gotSentHome = 0;
};
// Sets location of marker
Marker.prototype.setLocation = function(loc) {
	this.moves++;
	var ind = loc.getIndices();	// indices of new location
	for (var i = 0; i < ind.length; i++) {
		this.indices[i] = ind[i];
	}
}
// Gets location of marker
Marker.prototype.getLoc = function() {
	return new Location(this.indices);
}
// Sends home
Marker.prototype.sendHome = function() {
	this.gotSentHome++;
	this.moves--;	// sending home doesn't count as a move
	this.setLocation(this.homeloc);
	setTileMarker(this);
}
/************************ /Objects *****************************/
/************************ Build the tiles *********************/
// Make new list of tiles
function buildTiles(ndims, rows) {
	var tiles = [];
	var locs = [];
	var count = rows ** ndims;
	for (var d = 0; d < count; d++) {
		// initialize arrays for each possible location
		locs[d] = [];
	}
	var pattern = count;
	for (var d = 0; d < ndims; d++) {
		// build arrays one element at a time for each tile
		// pattern for 4x4 is 0.0 , 0.1 , 0.2 , 0.3, 1.0 , 1.1 , 1.2 , ....
		// same for 3d except more iterations
		// divide pattern by rows for each consecutive dimension
		// over when pattern is 1 (happens because of math)
		pattern = pattern / rows;
		buildDimension(pattern, rows, locs);
	}
	if (ndims == 1) {
		for (var d = 0; d < count; d++) {
			locs[d].push(0);
		}
	}
	for (var d = 0; d < count; d++) {
		tiles.push(new Tile(new Location(locs[d])));
	}
	console.log(tiles);
	// we need a 0, 1, ..., rows-1 in each x, y, z, ...
	return tiles;
}
// voodoo magic occurs
function buildDimension(pattern, rows, locs) {
	var value;
	for (var i = 0; i < locs.length; i++) {
		if (pattern == 1)
			value = i % rows;
		else
			value = Math.floor((i % (pattern * rows)) / pattern);  
		locs[i].push(value);
	}
}
// generates opposing home locations
function generateHomeLocations(ndims, gridsize) {
	//return array of two arrays
	var red = [];
	var blue = [];
	var top = gridsize - 1;
	// puts blue at opposite corner of red
	for (var i = 0; i < ndims; i++) {
		if (i % 2 == 0) {
			red.push(0);
			blue.push(top);
		} else {
			red.push(top);
			blue.push(0);
		}
	}
	if (ndims == 1) {
		red.push(0);
		blue.push(0);
	}
	return [new Location(red), new Location(blue)];
}
/************************ Global Variables *********************/
var ROWS = 4;	// rows are equal for each axis
var DIMS = 3; 	// dimensions
var RUNS = 50;
var tiles;
var redmarker, bluemarker;
var gameLoop;
var count;
var winner;
var chartdata;
var tracker = 0;
var custom;
var animate;
var gameover;
/************************ Movement Functions *******************/
// This function is called onClick of the begin button
// Keeps track of marker location and grid statistics
// each not custom simulation runs for 50 times, 10 for each dimension
// data stacks, so you can run n simulations and get 50*n data points
/************************ Begin Simulation ***********************/
function beginMoving() {
	gameover = false;
	// initiate all the stuffs
	custom = document.getElementById("checkcustom").checked;
	console.log("Custom: " + custom);
	if (!custom) {
		// not a custom run
		ROWS = 4;
		RUNS = 50;
		animate = false;
		DIMS = Math.floor((tracker) /  Math.floor(RUNS / 5)) + 1;
	} else {
		// a custom run
		var tdim = document.getElementById("dimpick").value;
		if (tdim != "") {
			DIMS = parseInt(tdim);
		}
		var trow = document.getElementById("gridpick").value;
		if (trow != "") {
			ROWS = parseInt(trow);
		}
		var truns = document.getElementById("runpick").value;
		if (truns != "") {
			RUNS = parseInt(truns);
		}
		animate = document.getElementById("checkanimate").checked;
		console.log("Animate: " + animate);
		console.log("Runs: " + RUNS);
	}
	// make sure good values
	if ((ROWS<2 || ROWS>10) || (DIMS<1 || DIMS>10) || (ROWS==2 && DIMS==1) || (RUNS<1 || RUNS>500)) {
		clearInterval(gameLoop);
		closeGrid();
		alert("You can't do that.")
		return;
	}
	document.getElementById("dimpick").innerHTML = "Dimensions: " + DIMS;
	document.getElementById("gridpick").innerHTML = "Grid Size: " + ROWS + "x" + ROWS;
	var homes = generateHomeLocations(DIMS, ROWS);
	redloc = homes[0];
	blueloc = homes[1];
	redmarker = new Marker(redloc, red);
	bluemarker = new Marker(blueloc, blue);
	tiles = buildTiles(DIMS, ROWS);
	count = 0;
	setTileMarker(redmarker);
	setTileMarker(bluemarker);
	clearInterval(gameLoop);
	clearOutput();

	if (animate)
		drawGrid();
	else
	 	closeGrid();
	//tracker = 1;
	if (animate)
		gameLoop = setInterval(function(){step();}, 0);
	else {
		while (!gameover) {
			step();
		}
	}
}

// This calculates next movement, tries to move there, and redraws grid
function step() {
	count++;
	// take turns
	if (count % 2 == 1)
		var turnmarker = redmarker;
	else
		var turnmarker = bluemarker;
	
	moveMarker(turnmarker);
	if (animate) {
	 	drawGrid();
		document.getElementById("steps").innerHTML = "Total iterations: " + count;
	}
	// test if over
	testPoint(turnmarker);
}

// tries to move given marker
function moveMarker(marker) {
	// Makes sure new move is inside the grid
	var loc = getNextLocation(marker, DIMS);
	marker.setLocation(loc);	// set new marker if inside the grid
	setTileMarker(marker); // every iteration gives 1 touch to current tile no matter if it tried to move off the grid or 0
}

// sets marked tile
function setTileMarker(marker)  {	// gonna have to redo this
	for (var i = 0; i < tiles.length; i++) {
		if (tiles[i].getLoc().matches(marker.getLoc())) {
			tiles[i].setMarked(true, marker.color);
			tiles[i].setColor(marker.color);
		} else {
			tiles[i].setMarked(false, marker.color);
		}
	}
}
/************************ Testing Function *********************/
// either does: nothing, sends one home, or ends game
// why two of the same??? combine.
function testPoint(marker) {
	if (marker.moves >= 1000000) {
		endGame();	// if either is at 100000, rarely if ever happens
		return;
	}
	var tile = getTileByLoc(marker.getLoc());
	if (tile == null) {
		return;
	}
	if (marker.color == red) {
		//console.log("red");
		if (tile.blueMarked == true) {
			// sends home
			marker.sendHome();
			document.getElementById("marker").innerHTML = "RED sent home @ move: " + marker.moves;
		} else if (marker.getLoc().matches(bluemarker.homeloc)) {
			winner = "Red";
			endGame();
			document.getElementById("marker").innerHTML = "RED wins";
		}
	} else if (marker.color == blue) {
		//console.log("blue");
		if (tile.redMarked == true) {
			// sends home
			marker.sendHome();
			document.getElementById("marker").innerHTML = "BLUE sent home @ move: " + marker.moves;
		} else if (marker.getLoc().matches(redmarker.homeloc)) {
			winner = "Blue";
			endGame();
			document.getElementById("marker").innerHTML = "BLUE wins";
		}
	}
}
/************************ getStuff Functions *******************/
// generate next location of given marker
function getNextLocation(marker, dims) {
	var ogLoc = marker.getLoc();
	var tempMarker = marker.getLoc().getIndices();
	var line = Math.floor(Math.random()*dims);	// whether traversing row or column
	var N = Math.floor(Math.random()*3);	// either 0, 1, 2
	// either left/right or up/down depending on Math
	if (Math.floor(Math.random()*2) == 0) {
		tempMarker[line] += N;
	} else {
		tempMarker[line] -= N;
	}
	// make new location and test if its in the grid
	var newLoc = new Location(tempMarker);
	if (newLoc.isInGrid(DIMS, ROWS)){
		return newLoc;
	} else {
		return ogLoc;
	}
}
// gets tile by coords
function getTileByLoc(loc) {	// change to take location
	var tempLoc;
	for (var i = 0; i < tiles.length; i++) {
		if (tiles[i].getLoc().matches(loc))
			return tiles[i];
	}
	return null;
}
// averages touches
function getAvgTouches() {
	var total = 0;
	for (var i = 0; i < tiles.length; i++) {
		total += tiles[i].touches;
	}
	var average = total / (tiles.length);
	return average;
}
// gets location(s) of max touches and maximum value
function getMaxTouches() {
	var max = 0;
	for (var i = 0; i < tiles.length; i++) {
		if (tiles[i].touches > max)
				max = tiles[i].touches;
	}
	return max;	
}
/************************ End It Function **********************/
//ends game
function endGame() {
	displayOutput();
	chartdata.addRows([[DIMS, redmarker.moves]]);
	if (animate) {
		clearInterval(gameLoop);
	} else
		gameover = true;
	tracker++;
	if (tracker < RUNS) {
		if (animate)
			drawChart();
		beginMoving();
	} else {
		tracker = 0;
		drawChart();
	}
}
/************************ Draw Function ************************/
// initialize chart stuff
function initChart() {
	console.log('chart_init');
	chartdata = new google.visualization.DataTable();
	chartdata.addColumn('number', 'Dimensions');
	chartdata.addColumn('number', 'Moves to Win');
}
// draw the chart
function drawChart() {
	var options = {
		'title': 'Dimensions vs. Moves to Win',
		'width': 1000,
		'height': 800,
		'hAxis': {'title': 'Dimensions', 'minValue': 0},
		'vAxis': {'title': 'Moves to Win', 'minValue': 0},
		'legend': 'none'
	};
	var chart = new google.visualization.ScatterChart(document.getElementById("chart_div"));
	chart.draw(chartdata, options);
}
// closes canvas for 4D+ simulations
function closeGrid() {
	var canvas = document.getElementById("myCanvas");
	var context = canvas.getContext("2d");
	context.canvas.width = 0;	// set canvas size
	context.canvas.height = 0;
}
// draw grid, marker, and touches
function drawGrid() {
	var canvas = document.getElementById("myCanvas");
	var context = canvas.getContext("2d");
	var p = tiles[0].width / 4;			// padding
	var bw = ROWS * (tiles[0].width) + p;	// width
	var bh = ROWS * (tiles[0].width) + 3*p;	// height
	if (DIMS == 1)
		bh = bh / 2;
	var tx, ty, twidth;

	context.canvas.width = bw + (p/2 * ROWS + p);	// set canvas size
	context.canvas.height = bh + (p/2 * ROWS + p);
	context.globalAlpha = 1.0
	context.fillStyle = "black";
	context.fillRect(0, 0, canvas.width, canvas.height);
	var color;
	// draw tiles
	for (var i = 0; i < tiles.length; i++) {
		tx = tiles[i].x;
		ty = tiles[i].y;
		twidth = tiles[i].width;
		context.moveTo(tx, ty);
		context.lineTo(tx, ty + twidth);
		context.moveTo(tx, ty);
		context.lineTo(tx + twidth, ty);
	}
	// complete borders
	tx = tiles[0].x;
	ty = tiles[0].y;
	twidth = tiles[0].width;
	context.moveTo(tx + (twidth * ROWS), ty);
	if (DIMS == 1)
		var dline = ty + twidth;
	else
		var dline = ty + (twidth * ROWS);
	context.lineTo(tx + (twidth * ROWS), dline);
	context.lineTo(tx, dline);
	color = '#' + Math.floor(Math.random()*16777215).toString(16);
	context.strokeStyle = color;
	context.lineWidth = 2;
	context.stroke();

	// draw circle / touch count
	for (var i = 0; i < tiles.length; i++) {
		twidth = tiles[i].width;
		tx = tiles[i].x;
		ty = tiles[i].y;
		if (tiles[i].redMarked) {	// draw marker
			context.moveTo(tx, ty);
			context.beginPath();
			context.globalAlpha = 0.8
			context.arc(tx + twidth/2, ty + twidth/2, twidth/2 - p, 0, 2*Math.PI);
			context.fillStyle = red;
			context.fill();
		} else if (tiles[i].blueMarked) {	// draw marker
			context.moveTo(tx, tiles[i].y);
			context.beginPath();
			context.globalAlpha = 0.8
			context.arc(tx + twidth/2, ty + twidth/2, twidth/2 - p, 0, 2*Math.PI);
			context.fillStyle = blue;
			context.fill();
		} else {	// fill with touches
			context.moveTo(tx, ty);
			context.beginPath();
			context.globalAlpha = 0.7;
			context.font="bold 20px Tahoma";
			//color = '#' + Math.floor(Math.random()*16777215).toString(16);	// for craziness
			color = "white";
			//var color = tiles[i].color;
			context.fillStyle = tiles[i].touches > 0 ? tiles[i].color : color;
			var loc = tiles[i].getLoc().getIndices();
			var dims = loc.length;
			
			if (dims <= 2) {
				context.fillText(tiles[i].touches.toString(), tx + 10,
				 	ty + twidth - 10);
			} else {
				context.fillText(tiles[i].touches.toString(), tx + 5 + ((loc[dims-1]*2)*(dims**2 % twidth)),
				 	ty + twidth - 10 - ((loc[dims-1]*2)*(dims**2 % twidth)));
			}
		}
	}
}
/************************ "Good-enough" Front-end **************/
// output information
function displayOutput() {
	if (count < 1000000) {
		document.getElementById("steps").innerHTML = "Total iterations: " + count;
	} else {
		document.getElementById("steps").innerHTML = "Max iterations (1,000,000) reached. Game stopped.";
	}
	document.getElementById("red").innerHTML = "Red: " + redmarker.moves + " moves." + " Sent home " + redmarker.gotSentHome + " times.";
	document.getElementById("blue").innerHTML = "Blue: " + bluemarker.moves + " moves." + " Sent home " + bluemarker.gotSentHome + " times.";
	var maxx = getMaxTouches();
	document.getElementById("max").innerHTML = "Maximum touches: " + maxx;
	document.getElementById("average").innerHTML = "Average touches: " + getAvgTouches();
	var curTable = document.getElementById("table").innerHTML;
	var newRow = "<tr><td>" + DIMS + "</td><td>" + ROWS +"</td><td>" + winner + "</td><td>" + redmarker.moves + "</td></tr>";
	document.getElementById("table").innerHTML = curTable + newRow;
}
// clears information when starting new game
function clearOutput() {
	document.getElementById("steps").innerHTML = "";
	document.getElementById("marker").innerHTML = "";
	document.getElementById("red").innerHTML = "";
	document.getElementById("blue").innerHTML = "";
	document.getElementById("max").innerHTML = "";
	document.getElementById("average").innerHTML = "";
}