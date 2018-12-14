if (typeof $ === 'undefined') {
	throw 'JQuery is required but not be found.';
}

function Effect(duration, x, y, visualizer, animator, value, eraser) {
	this.duration = duration;
	this.time = 0;
	this.x = x;
	this.y = y;
	this.value = value;
	
	var that = this;
	
	this.tick = function(game) {
		that.time += game.model.deltat;
		
		if  (that.time >= that.duration)
			return false;
		
		return true;
	}
	
	this.draw = function(game) {
		animator(that, game.model.deltat);
		visualizer(that, game.model.deltat);
	};
}

function GanixView(scale, enableGrid, timeScale) {

	this.SMALL_SCALE = 36;
	this.LARGE_SCALE = 256;

	this.jCanvas = $('#GanixCanvas');
	this.canvas = this.jCanvas[0];
	
	this.eCanvas = $('#EffectsCanvas');
	this.effectsCanvas = this.eCanvas[0];
	
	//this.canvas.width = document.body.clientWidth; //document.width is obsolete
    //this.canvas.height = document.body.clientHeight; //document.height is obsolete	
	
	this.context = this.canvas.getContext('2d');
	
	this.effectsContext = this.effectsCanvas.getContext('2d');
	
	this.scale = scale;
	this.enableGrid = enableGrid;
	
	this.effects = [];
	
	this.timeScale = timeScale;
	
	var that = this;
	
	this.width = function() {
		return that.jCanvas.width();
	}
	
	this.height = function() {
		return that.jCanvas.height();
	}
	
	this.clear = function() {
		this.context.clearRect(0, 0, that.jCanvas.width(), that.jCanvas.height());
		this.effectsContext.clearRect(0, 0, that.eCanvas.width(), that.eCanvas.height());
	}
	
	this.setScale = function(scale) {
		this.scale = scale;
		
		this.clear();
	}
	
	this.createEffects = function(event, tickDeltat) {
		if (event.name == 'attack') {
		
			if (that.scale > that.SMALL_SCALE) {
				var visualizer = function(effect, deltat) {
					that.effectsContext.font = that.scale * 0.25 + "px Arial";
					that.effectsContext.fillStyle = "red";
					that.effectsContext.fillText(Math.floor(event.value), effect.x * that.scale - (that.scale * 0.05), effect.y * that.scale + (that.scale * 0.05));
				}
				
				var animator = function(effect, deltat) {
					effect.y -= Math.floor(deltat / 100) / that.scale;
					return;
				}
				
				var x  = event.other.getMidPoint().x;
				var y  = event.other.getMidPoint().y;
				
				var value = Math.floor(event.value);
				
				that.effects.push(new Effect(2 * tickDeltat * timeScale, x, y, visualizer, animator, value));
			}
			
			var visualizer2 = function(effect, deltat) {
				var x1 = event.ganus.getMidPoint().x * that.scale;
				var y1 = event.ganus.getMidPoint().y * that.scale;
				var x2 = event.other.getMidPoint().x * that.scale;
				var y2 = event.other.getMidPoint().y * that.scale;
				
				that.drawArrow(x1, y1, x2, y2, 'red', Math.PI/8, that.scale * 0.4);
			}
			
			var animator2 = function(effect, deltat) {
				return;
			}
			
			that.effects.push(new Effect(1 * tickDeltat * timeScale, x, y, visualizer2, animator2, 0));
			
		} else if (event.name == 'move') {
		
			var visualizer = function(effect, deltat) {
				that.effectsContext.strokeStyle = "green";
				that.effectsContext.beginPath();
				that.effectsContext.moveTo((event.fromX + 0.5) * that.scale, (event.fromY + 0.5) * that.scale);
				that.effectsContext.lineTo((event.toX  + 0.5) * that.scale, (event.toY  + 0.5) * that.scale);
				that.effectsContext.stroke();
			}
			
			var animator = function(effect, deltat) {
				return;
			}
			
			var x  = event.fromX;
			var y  = event.fromY;
			
			var value = event.value;
			
			that.effects.push(new Effect(1.5 * tickDeltat * timeScale, x, y, visualizer, animator, value));
		
		 
		} else if (event.name == 'eat') {
		
			if (that.scale > that.SMALL_SCALE) {
			
			} else {
				var visualizer = function(effect, deltat) {
					that.effectsContext.font = that.scale * 0.25 + "px Arial";
					that.effectsContext.fillStyle = "green";
					that.effectsContext.fillText(Math.floor(event.value), effect.x * that.scale - (that.scale * 0.05), effect.y * that.scale + (that.scale * 0.05));
				}
				
				var animator = function(effect, deltat) {
					effect.y -= Math.floor(deltat / 100) / that.scale;
					return;
				}
				
				var value = Math.floor(event.value);
				
				that.effects.push(new Effect(2 * tickDeltat * timeScale, event.ganus.getMidPoint().x, event.ganus.getMidPoint().y, visualizer, animator, value));
			}
		}
	}
	this.drawEffects = function(game, xMin, yMin, xMax, yMax) {
		//Extract needed effects from the models event list.
		if (game.model.events.length > 0) {
			for (var i = 0; i < game.model.events.length; i++) {
				that.createEffects(game.model.events[i], game.model.deltat);
			}
		}
		
		var effectIndexesToRemove = [];
	
		for (i = 0; i < that.effects.length; i++) {
			if (that.effects[i].tick(game) && that.effects[i].x > xMin && that.effects[i].x < xMax && that.effects[i].y > yMin && that.effects[i].y < yMax) {
				that.effects[i].draw(game);
			} else {
				effectIndexesToRemove.push(i);
			}
		}
		
		for (i = effectIndexesToRemove.length - 1; i >= 0 ; i--) {
			that.effects.splice(i, 1);
		}
	}
	
	this.draw = function(game) {
		if (that.enableGrid)
			that.drawGrid(game);
		
		var w = $(window);
		
		var xMin = Math.min(game.model.size, Math.ceil(w.scrollLeft() / that.scale));
		var xMax = Math.min(game.model.size, Math.ceil((w.scrollLeft() + w[0].innerWidth) / that.scale));
		
		var yMin = Math.min(game.model.size, Math.ceil(w.scrollTop() / that.scale));
		var yMax = Math.min(game.model.size, Math.ceil((w.scrollTop() + w[0].innerHeight) / that.scale));
		
		this.effectsContext.clearRect(w.scrollLeft(), w.scrollTop(), w[0].innerWidth, w[0].innerHeight);
		
		for (var x = xMin; x < xMax; x++) { // 0, game.model.size
			for (var y = yMin; y < yMax; y++) { // 0, game.model.size
				var cell = game.model.arena[x][y];
				if (cell.hasChanges) {
					that.context.fillStyle = "white"; 
					that.context.fillRect(x * that.scale, y * that.scale, that.scale, that.scale);
					if (cell.hasItem('food'))
						that.drawFood(cell.x, cell.y);
					if (cell.ganus)
						that.drawGanus(cell.ganus);
					cell.hasChanges = false;
				}
			}
		}
		
		that.drawEffects(game, xMin, yMin, xMax, yMax);
	}
	// drawArrow(x1,y1,x2,y2,style,which,angle,length)
	this.drawArrow = function(x1, y1, x2, y2, color, angle, length) {
		
		if (typeof color === 'undefined') {
			color = '#000000';
		}
		
		var lineAngle = Math.atan2(y2 - y1, x2 - x1);
		
		var arrowHeadLength = Math.abs(length / Math.cos(angle));
		
		var angle1 = lineAngle + Math.PI + angle;
		var topx = x2 + Math.cos(angle1) * arrowHeadLength;
		var topy = y2 + Math.sin(angle1) * arrowHeadLength;
		
		var angle2 = lineAngle + Math.PI - angle;
		var botx = x2 + Math.cos(angle2) * arrowHeadLength;
		var boty = y2 + Math.sin(angle2) * arrowHeadLength;
		
		that.effectsContext.lineWidth = 1;
		that.effectsContext.strokeStyle = color;
		
		that.effectsContext.beginPath();
		that.effectsContext.moveTo(x2, y2);
		that.effectsContext.lineTo(topx, topy);
		that.effectsContext.stroke();
		
		that.effectsContext.beginPath();
		that.effectsContext.moveTo(x2, y2);
		that.effectsContext.lineTo(botx, boty);
		that.effectsContext.stroke();
		
		that.effectsContext.beginPath();
		that.effectsContext.moveTo(x1, y1);
		that.effectsContext.lineTo(x2, y2);
		that.effectsContext.stroke();
	}
	
	this.drawGanus = function(g) {
		that.context.fillStyle = g.color; 
		that.context.fillRect(g.location.x * that.scale, g.location.y * that.scale, that.scale, that.scale);
		
		var energyBarHeight = Math.floor(that.scale * 0.085) + 1;
		var curTop = g.location.y * that.scale + energyBarHeight;
		

		if (that.scale > that.SMALL_SCALE) {
		
			// Energy Bar
			that.context.fillStyle = "red"; 
			that.context.fillRect(g.location.x * that.scale, g.location.y * that.scale, Math.floor(that.scale * g.energy / g.maxEnergy()), energyBarHeight);
			
			// Attributes
			that.context.font = "bold " + that.scale * 0.25 + "px Arial";
			
			var strengthText = g.strength;
			var dexterityText = g.dexterity;
			var intelligenceText = g.intelligence;
			
			var sexText = g.sex[0].toUpperCase();
			var dietText = g.diet[0].toUpperCase();
			var alignmentText = g.alignment[0].toUpperCase();
			
			/*
			if (that.scale > that.LARGE_SCALE) {
				strengthText = "Strength: " + strengthText;
				dexterityText = "Dexterity: " + dexterityText;
				intelligenceText = "Intelligence: " + intelligenceText;
				sexText = "Sex: " + sexText;
				dietText = "Diet: " + dietText;
				alignmentText = "Alignment: " + alignmentText;
			}
			*/

			curTop += that.scale * 0.25;
			that.context.fillStyle = "white";
			that.context.fillText(strengthText, g.location.x * that.scale + (that.scale * 0.05), curTop);
			
			curTop += that.scale * 0.25;
			that.context.fillStyle = "white";
			that.context.fillText(dexterityText, g.location.x * that.scale + (that.scale * 0.05), curTop);
			
			curTop += that.scale * 0.25;
			that.context.fillStyle = "white";
			that.context.fillText(intelligenceText, g.location.x * that.scale + (that.scale * 0.05), curTop);
			
			
			energyBarHeight = Math.floor(that.scale * 0.085) + 1;
			curTop = g.location.y * that.scale + energyBarHeight;
			
			curTop += that.scale * 0.25;
			that.context.fillStyle = "white";
			that.context.fillText(sexText, g.location.x * that.scale + (that.scale * 0.7), curTop);
			curTop += that.scale * 0.25;
			that.context.fillStyle = "white";
			that.context.fillText(dietText, g.location.x * that.scale + (that.scale * 0.7), curTop);
			curTop += that.scale * 0.25;
			that.context.fillStyle = "white";
			that.context.fillText(alignmentText, g.location.x * that.scale + (that.scale * 0.7), curTop);
		}
	}
	
	this.drawGameState = function(game) {
	

	}
	
	this.drawFood = function(x, y) {
		that.context.fillStyle = 'yellow';
		that.context.lineWidth = 1;
		that.context.strokeStyle = '#000000';
		
		that.context.beginPath();
		that.context.arc(x * that.scale + that.scale / 2, y * that.scale + that.scale / 2, that.scale / 8, 0, 2 * Math.PI, false);
		that.context.fill();
		that.context.stroke();
	}
	
	this.drawGrid = function(game) {
	
		that.context.lineWidth = 1;

		that.context.strokeStyle = "black"; 
	
		for (var x = 0; x <= game.model.size * that.scale; x += that.scale) {
			that.context.beginPath();
			that.context.moveTo(x, 0);
			that.context.lineTo(x, game.model.size * that.scale);
			that.context.stroke();
		}
		
		for (var y = 0; y <= game.model.size * that.scale; y += that.scale) {
			that.context.beginPath();
			that.context.moveTo(0, y);
			that.context.lineTo(game.model.size * that.scale, y);
			that.context.stroke();
		}

	}
}

function Cell(x, y) {
	this.x = x;
	this.y = y;
	this.items = [];
	this.ganus = null;
	
	this.hasChanges = true;
	
	var that = this;
	
	this.hasItem = function(type)  {
		for (var i = 0; i < that.items.length; i++) {
			if (that.items[i].type === type) {
				return true;
			}
		}
		return false;
	};
	
	this.change = function() {
		that.hasChanges = true;
	}
	
	this.addItem = function(item)  {
		that.hasChanges = true;
		that.items.push(item);
	};
	
	this.removeItem = function(type)  {
		for (var i = 0; i < that.items.length; i++) {
			if (that.items[i].type === type) {
				var item = that.items[i];
				that.items.splice(i, 1)
				that.hasChanges = true;
				return item;
			}
		}
		return null;
	};
	
	this.allows = function(action) {
		if (action == 'move')
			return that.ganus == null;
		return false;
	}
	
	this.occupy = function(ganus) {
		that.hasChanges = true;
		if (that.ganus)
			throw new Error("Tried to overwrite a ganus!");
		that.ganus = ganus;
		
		ganus.location.x = that.x;
		ganus.location.y = that.y;
	}
	
	this.vacate = function() {
		that.hasChanges = true;
		var ganus = that.ganus;
		that.ganus = null;
		return ganus;
	}
}

function Ganus() {

	this.waitingTime = 300;
	
	this.strength = 5;
	this.dexterity = 5;
	this.intelligence = 5;
	this.luck = 2;
	
	this.sex = 0;
	
	this.state = 'neutral';
	
	this.items = [];
	
	this.alignment = 'neutral'; // 'cooperative'; 'aggressive'
	this.diet = 'omnivore'; // 'herbavore', 'carnivore'
	
	var that = this;
	
	this.randomize = function(magnitude) {
		that.strength = (Math.floor(Math.random() * 9) + 1) * magnitude ;
		that.dexterity = (Math.floor(Math.random() * 9) + 1) * magnitude;
		that.intelligence = (Math.floor(Math.random() * 9) + 1) * magnitude;
		that.luck = (Math.floor(Math.random() * 4) + 1) * magnitude;
		
		var colors = ['#1122DD','#4488AA','#226688','#2244AA','#22AAFF'];
		
		that.color = colors[Math.floor(Math.random() * colors.length)];	
		
		that.sex = ['a','m','f'][Math.floor(Math.random() * 3)];
		
		that.alignment = ['neutral', 'cooperative', 'aggressive'][Math.floor(Math.random() * 3)];
		
		that.diet = ['omnivore', 'herbavore', 'carnivore'][Math.floor(Math.random() * 3)];
		
		that.sign = ['aquarius','pisces','aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn'][Math.floor(Math.random() * 12)];
		
		if (that.sign == 'cancer' || that.sign == 'scorpio' || that.sign == 'pisces') {
			that.signType = 'water';
		} else if (that.sign == 'aries' || that.sign == 'leo' || that.sign == 'sagittarius') {
			that.signType = 'fire';
		} else if (that.sign == 'taurus' || that.sign == 'virgo' || that.sign == 'capricorn') {
			that.signType = 'earth';
		} else { // gemini, libra, aquarius
			that.signType = 'air';
		}
		
		that.relationships = {};
		
		that.energy = this.maxEnergy() / 2;
	}
	
	this.hasItem = function(type)  {
		for (var i = 0; i < that.items.length; i++) {
			if (that.items[i].type === type) {
				return true;
			}
		}
		return false;
	};
	
	this.removeItem = function(type)  {
		for (var i = 0; i < that.items.length; i++) {
			if (that.items[i].type === type) {
				var item = that.items[i];
				that.items.splice(i, 1)
				return item;
			}
		}
		return null;
	};
	
	this.takeItem = function(item) {
		that.items.push(item);
		return {name: 'takeItem', ganus: that, item: item};
	};
	
	this.eat = function(food) {
		that.restoreEnergy(food.value);
		
		var gainAttribute = ['strength','dexterity','intellligence','luck'][Math.floor(Math.random() * 3)];
		
		var gainValue = 1;
		
		if (that.signType == 'earth' && gainAttribute == 'strength') {
			gainValue *= 3;
		} else if (that.signType == 'fire' && gainAttribute == 'dexterity') {
			gainValue *= 3;
		} else if (that.signType == 'air' && gainAttribute == 'intelligence') {
			gainValue *= 3;
		} else if (that.signType == 'water' && gainAttribute == 'luck') {
			gainValue *= 3;
		}
		
		that[gainAttribute] += gainValue;

		return {name: 'eat', ganus: that, value: food.value, gainAttribute: gainAttribute, gainValue: gainValue};
	}
	
	this.restoreEnergy = function(amount) {
	
		that.energy += amount;
		
		if (that.energy > that.maxEnergy()) {
			that.energy = that.maxEnergy();
		}
		
		return { name: 'restoreEnergy', ganus: that, value: amount};
	}
	
	this.depleteEnergy = function(amount) {
		that.energy -= amount;
		
		if (that.energy < 0) {
			that.energy = 0;
		}
		
		return { name: 'depleteEnergy', ganus: that, value: amount};
	}
	
	this.attack = function(other) {
		var attack = that.attackDamage() - other.defense();
		
		if (attack < 0) {
			attack = 0;
		}
	
		other.depleteEnergy(attack);
		
		that.restoreEnergy(attack / 2);
		
		return { name: 'attack', ganus: that, other: other, value: attack}; 
	}
	
	this.location = {};
	
	this.getMidPoint = function() {
		return {x: this.location.x + 0.5, y: this.location.y + 0.5 };
	}
	
	this.speed = function() {
		return that.dexterity + that.strength * 0.3 + that.intelligence * 0.1;
	};
	
	this.attackDamage = function() {
		return that.strength * 1.2 + that.dexterity * 0.6 + that.intelligence * 0.2 + Math.floor(Math.random() * that.luck);
	}
	this.degenerate = function() {
	
		that.energy -= this.maxEnergy() * 0.0025;
	
		if (that.energy > that.maxEnergy()) {
			that.energy = that.maxEnergy();
		}
		if (that.energy < 0) {
			that.energy = 0;
		}
		
	}
	
	this.die = function() {
		this.energy = 0;
	}
	
	this.maxEnergy = function() {
		return that.strength * 4 + that.dexterity * 2 + that.intelligence * 3;
	}
	
	this.energy = this.maxEnergy();
	
	this.defense = function() {
		return that.strength * .2 + that.dexterity * .7 + that.intelligence * 0.1 + Math.floor(Math.random() * that.luck - 1);
	}
	
	this.consider = function(other) {
		//3 you will anihilate them 	- Bright Green
		//2 they are no match			- Yellow Green
		//1 you might lose				- Yellow
		//0 even fight					- White
		//-1 you might win				- Pink
		//-2 you are no match			- Red
		//-3 they will anihilate you	- Black
		var attributes = ['strength', 'intelligence', 'dexterity', 'luck'];
		
		var score = 0;
		
		var scorer = function(thatVal, otherVal) {
			if (thatVal > otherVal) {
				return 1;
			} else if (thatVal == otherVal) {
				return 0;
			} else {
				return -1;
			}
		}
		
		
		for (var i = 0; i < attributes.length; i++) {
			score += scorer(that[attributes[i]],other[attributes[i]]);
		}
		
		return score;
	};
	this.con = this.consider;
	
	this.decideMove = function(perception) {
			// choice range is 100 for best choice, 0 for worst
			var bestChoices = [{value: 0, action: 'nothing'}];
			var options = {};
			/*
			{
				IDOfMove: weight
			}
			*/
			
			if (that.energy < that.maxEnergy() * 0.9) {
				if (that.hasItem('food')) {
					bestChoices = [{value: 100 - (that.energy / that.maxEnergy() * 100) + Math.floor(Math.random() * 8), action: 'eat'}];
				}
			}
			
			for (var i = 0; i < perception.adjacentCells.length; i++) {
			
				var cell = perception.adjacentCells[i];
				var choice = {value: 0, action: 'nothing'};
				
				if (cell.hasItem('food')) {
					choice = {cell: cell, value: 90 + Math.floor(Math.random() * 5), action: 'move'};
				} else if (cell.ganus && cell.ganus != that) {
					if ((that.alignment == 'competitive' || (that.alignment == 'neutral' && Math.floor(Math.random() * 2) == 1)) && (that.diet == 'omnivore' || that.diet == 'carnivore')) {
						var con = that.consider(cell.ganus);
						if (con > 0) {
							choice = {cell: cell, value: Math.floor(Math.random() * 10) + 50 + (con * 20), action: 'attack'};
						} else {
							choice = {cell: cell, value: Math.floor(Math.random() * 10) + 50 - (con * 20), action: 'attack'}; 
						}
					} else {
						choice = {value: 0, action: 'nothing'}; 
					}
					// share
					// mate
					// steal
				} else if (cell.allows('move')) {
					choice = {cell: cell, value: Math.floor(Math.random() * 5) + 20, action: 'move'}; 
				}
				
				if (choice.value > bestChoices[0].value) {
					bestChoices = [choice];
				} else if (choice.value == bestChoices[0].value) {
					bestChoices.push(choice);
				}
				//options[cell.id] = choice;
			}
			
			return bestChoices[Math.floor(Math.random() * bestChoices.length)];
	}
	
	this.tick = function(perception) {
		
		if (that.energy <= 0) {
			return {value: -256, action: 'die'};
		}
		
		that.waitingTime -= that.speed();
		
		if (that.waitingTime < 0) {
		
			that.degenerate();
			
			that.waitingTime = 300;
			
			return that.decideMove(perception);
		}
		
		
		
		return {value: 0, action: 'nothing'};
		// 1 = left, 2 = up, 3 = right, 4 = down
	}
}

function GanixModel(announce, size, deltat) {
	this.time = 0;
	this.gani = [];
	this.events = [];
	
	this.size = size;
	this.deltat = deltat;
	
	this.announce = announce;
	
	var that = this;
	
	this.getBlankGrid = function() {
		var arr = [];
		
		for (var x = 0; x <= this.size; x++) {
			var row = [];
			for (var y = 0; y <= this.size; y++) {
				row.push(new Cell(x, y));
			}
			arr.push(row);
		}
		
		return arr;
	}
	
	this.initializeArena = function() {
		return this.getBlankGrid();
	}
	
	this.arena = this.initializeArena();
	
	
	this.moveGanus = function(ganus, toX, toY) {
	
		if (toX < 0 || toX > that.size - 1 || toY < 0 || toY > that.size - 1) {
			return false;
		}
		
		/*
		validation delegated to the cell level
		if (that.arena[toX][toY].ganus) {
			return false;
		}
		*/
		var fromCell = that.arena[ganus.location.x][ganus.location.y];
		var toCell = that.arena[toX][toY];
		
		var g = fromCell.vacate();
		
		if (g != ganus)
			throw new Error("vacated ganus should have been same");
		
		toCell.occupy(g);
		
		return true;
	}
	
	this.getAdjacentCells = function(ganus) {
		var gx = ganus.location.x
		var gy = ganus.location.y
		
		var cells = [];
		
		for (var y = -1; y < 2; y++) {
			for (var x = -1; x < 2; x++) {
			
				var tx = x + gx;
				var ty = y + gy;
			
				if (tx < 0 || tx > that.size - 1 || ty < 0 || ty > that.size - 1) {
					continue;
				}
				cells.push(that.arena[tx][ty]);
			}
		}
		return cells;
	}
	
	this.removeGanus = function(i) {
		var ganus = that.gani[i];
		that.gani.splice(i,1);
		//ganus
	}
	
	this.tick = function() {
	
		that.events = [];
		
		var removeList = [];
		
		if (Math.floor(Math.random() * 10) == 1) {
			that.spawnFood(1);
		}
	
		for (var i = 0; i < that.gani.length; i++) {
			var g = that.gani[i];
			
			var perception = {
				'adjacentCells': that.getAdjacentCells(g, that.arena)
			};
			
			var choice = g.tick(perception);
			
			if (choice.action === 'nothing') {
				continue;
			} else if (choice.action === 'move' && choice.cell.allows('move')) {
			
				var moveEvent = {name: 'move', ganus: g, toX: choice.cell.x, toY: choice.cell.y, fromX: g.location.x, fromY: g.location.y};
			
				that.moveGanus(g, choice.cell.x, choice.cell.y);
				
				if (choice.cell.hasItem('food')) {
					g.takeItem(choice.cell.removeItem('food'));
				}
				
				that.events.push(moveEvent);
				
			} else if (choice.action === 'eat') {
			
				var item = g.removeItem('food');
				
				if (!item) {
					throw Error("Why didn't i have food?");
				}
				
				var eventData = g.eat(item);
				
				that.events.push(eventData);
				
			} else if (choice.action === 'attack') {
				var eventData = g.attack(choice.cell.ganus);
				
				that.events.push(eventData);
			} else if (choice.action === 'die') {
				removeList.push(i);
				g.die();
				that.arena[g.location.x][g.location.y].vacate();

				that.events.push({name: 'death', ganus: g});
			}
		}
		
		for (i = removeList.length - 1; i >= 0; i--) {
			that.removeGanus(removeList[i]);
		}
		
		that.announce(that);
	}
	
	this.tickInterval = setInterval(that.tick, that.deltat);
	
	this.start = function() {
		that.tickInterval = setInterval(that.tick, that.deltat);
	}
	
	this.stop = function() {
		clearInterval(that.tickInterval);
	}
	
	this.setSpeed = function(newSpeed) {
		that.stop();
		that.deltat = newSpeed;
		that.start();
	}
	
	this.spawnGani = function(num) {
		for (var i = 0; i < num; i++) {
			that.spawnGanus();
		}
	}
	
	this.spawnGanus = function() {
	
		if (that.gani.length >= that.size * that.size) {
			console.log('Cannot add more Gani');
			return;
		}
	
		var breaker = 0;
	
		while(true) {
			
			breaker++;
		
			var rx = Math.floor((Math.random() * that.size));
			var ry = Math.floor((Math.random() * that.size));
			
			if (!that.arena[rx][ry].ganus) {
				var ganus = new Ganus();
				
				ganus.randomize(4);
				
				that.arena[rx][ry].ganus = ganus;
				that.gani.push(ganus);
				ganus.location.x = rx;
				ganus.location.y = ry;
				break;
			}
			
			if (breaker > 100) {
				break;
			}
		}
	}
	
	this.spawnFood = function(amount) {

		var breaker = 0;
	
		for(var i = 0; i < amount; i++) {
		
			var rx = Math.floor((Math.random() * that.size));
			var ry = Math.floor((Math.random() * that.size));

			var food = {type:'food', value: (Math.floor(Math.random() * 4) + 1) * 15};
				
			that.arena[rx][ry].addItem(food);
		}
	}
	
	
}

function GanixGame(options) {

	this.listeners = {};
	/*  {
			'GanixModel': [viewFunc, controllerFunc],
			'GanixView' : []
		}
	*/
	var that = this;

	this.announce = function(obj) {
		if (typeof that.listeners[obj.constructor.name] !== 'undefined') {
			for (var i = 0; i < that.listeners[obj.constructor.name].length; i++) {
				that.listeners[obj.constructor.name][i](obj);
			}
		}
	}
	
	this.stop = function() {
		this.model.stop();
	}
	
	
	this.init = function(options) {
	
		options = typeof options == 'undefined' ? {} : options;
	
		var worldSize = typeof options.worldSize !== 'undefined' ? options.worldSize : 32;
		var worldTickSpeed = typeof options.worldTickSpeed !== 'undefined' ? options.worldTickSpeed : 200;
		
		var viewScale = typeof options.viewScale !== 'undefined' ? options.viewScale : 12;
		var viewEffectLifespan = typeof options.viewEffectLifespan !== 'undefined' ? options.viewEffectLifespan : 20;
		
		var startingPopulation = typeof options.startingPopulation !== 'undefined' ? options.startingPopulation : 16;
		
	
		this.model = new GanixModel(this.announce, worldSize, worldTickSpeed);
		this.view = new GanixView(viewScale, false, viewEffectLifespan);
		// this.controller = GanixController();
		
		if (startingPopulation > 0) {
			this.model.spawnGani(startingPopulation);
		}
		
		
		this.listeners["GanixModel"] = [function() { that.view.draw(that); }];
		
		that.view.context.fillStyle = "white"; 
		that.view.context.lineWidth = 1;
		that.view.context.strokeStyle = 'blue';
		
		that.view.context.fillRect(0,0,that.view.width(),that.view.height());
		that.view.context.strokeRect(0, 0, this.model.size * that.view.scale, this.model.size * that.view.scale);
		
	}
	
	this.init(options);
}



