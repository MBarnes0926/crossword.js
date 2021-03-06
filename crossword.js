(function(){
	var _ = self.Crossword = function(init) {
		this.cells = {};
		this.words = [];
		this.rows = 0;
		this.columns = 0;

		this.currentWord;
		this.currentLetter;

		if(!!init) {
			if(init.disableErrorCheck) {
				this.disableErrorCheck = init.disableErrorCheck;
			}
			if(init.words) {
				for(var i = 0; i < init.words.length; i++) {
					this.addword(init.words[i]);
				}
			}
			if(init.autosort) {
				this.autosort = init.autosort;
			}
			if(init.element) {
				this.build(init.element);
			}
		}
	};

	var keys = {
		back:  8,
		left: 37,
		up:   38,
		right:39,
		down: 40
	};

	_.prototype = {
		addcell : function(row, column, value) {
			var cell = this.getcell(row, column);
			if(!this.disableErrorCheck && !!cell) {
				if(cell.crossdata.value !== value) {
					throw 'Value mismatch for row {0}, column {1}'.replace('{0}', row).replace('{1}', column);
				}
			} else {
				this.setcell(row, column, value);
			}
		},
		addword : function(word) {
			word.letters = [];
			var row, col;

			for(var i = 0; i < word.word.length; i++) {
				if(word.direction === 'across') {
					row = word.location.row;
					col = word.location.column + i;
				} else {
					row = word.location.row + i;
					col = word.location.column;
				}

				this.addcell(row, col, word.word[i]);
				word.letters.push(this.cells[[row, col]]);
				this.cells[[row, col]].crossdata.parents.push(word);
			}

			this.words.push(word);
		},
		build : function(element) {
			element.className += ' cw-puzzle-wrap';
			var fragment = document.createDocumentFragment();
			var table = document.createElement('table');
			table.className = 'cw-puzzle';
			var tablerow, cell;
			var puzzle = this;

			//create table
			for(var row = 1; row <= this.rows; row++) {
				tablerow = document.createElement('tr');
				for(var col = 1; col <= this.columns; col++) {
					cell = document.createElement('td');
					if(!!this.cells[[row,col]]){
						cell.appendChild(this.cells[[row,col]]);
					}
					tablerow.appendChild(cell);
				}
				table.appendChild(tablerow);
			}

			//table events
			table.addEventListener('keydown', function(evt) { handleDirectional(evt.which ? evt.which : evt.keyCode, evt.target, puzzle); });
			table.addEventListener('keypress', function(evt) { handleType(evt, puzzle); });
			table.addEventListener('click', function(evt) { handleClick(evt.target, puzzle); });

			fragment.appendChild(table);


			//word list
			var listWrap = document.createElement('div');
			listWrap.className = 'cw-words-wrap';
			var listAcross = buildList(this.words, 'across', this.autosort);
			var listDown = buildList(this.words, 'down', this.autosort);

			//word list events
			listWrap.addEventListener('click', function(evt){ handleWordClick(evt.target, puzzle); });

			listWrap.appendChild(listAcross);
			listWrap.appendChild(listDown);
			fragment.appendChild(listWrap);

			element.appendChild(fragment);
		},
		getcell : function(row, column) {
			return this.cells[[row, column]];
		},
		setcell : function(row, column, value) {
			if(row > this.rows) {
				this.rows = row;
			}
			if(column > this.columns) {
				this.columns = column;
			}

			this.cells[[row, column]] = createcell(row, column, value);
		},
		updateCurrentWord : function(direction) {
			var newWord;

			var isSameLetter = !direction && this.currentLetter === document.activeElement;
			this.currentLetter = document.activeElement;

			//default
			if(!direction) { direction = !!this.currentWord ? this.currentWord.direction : 'across'; }

			//clear
			if(!!this.currentWord) {
				this.currentWord.letters.forEach(function(elem){ elem.className = ""; });
				this.currentWord.element.className = "";
			}

			//alternate as necessary
			if(isSameLetter && direction === 'across') { direction = 'down'; }
			else if(isSameLetter && direction === 'down') { direction = 'across'; }

			//set word
			newWord = this.currentLetter.crossdata.parents.filter(function(word) { return word.direction === direction });
			this.currentWord = newWord.length > 0 ? newWord[0] : this.currentLetter.crossdata.parents[0];

			//select
			this.currentWord.letters.forEach(function(elem){ elem.className = "selected"; });
			this.currentWord.element.className = "selected";
		}
	};

	var distanceSort = function(a, b) {
		var aDist = 8 * Math.pow(a.location.row, 2) + Math.pow(a.location.column, 2);
		var bDist = 8 * Math.pow(b.location.row, 2) + Math.pow(b.location.column, 2);

		if(aDist > bDist) {
			return 1;
		} else if(aDist < bDist) {
			return -1;
		}

		return 0;
	};

	var buildList = function(words, direction, autosort){
		var li;
		var list = document.createElement('ol');
		list.className = 'cw-words-' + direction;
		var dirWords = words.filter(function(word){ return word.direction === direction; });

		if(!!autosort) { dirWords = dirWords.sort(distanceSort); }

		for(var i = 0; i < dirWords.length; i++) {
			li = document.createElement('li');
			li.innerHTML = dirWords[i].clue;
			li.word = dirWords[i];
			dirWords[i].element = li;
			list.appendChild(li);
		}

		var listWrapper = document.createElement('div');
		listWrapper.className = 'cw-words';
		var title = document.createElement('h4');
		title.innerHTML = direction;
		listWrapper.appendChild(title);
		listWrapper.appendChild(list);
		return listWrapper;
	};

	var createcell = function(row, column, value) {
		return (function(){
			var temp = document.createElement('input');
			temp.type = "text";
			temp.maxLength = 1;

			temp.crossdata = {
				row:row,
				column:column,
				value:value,
				parents:[]
			};

			return temp;
		})();
	};

	var handleDirectional = function(code, target, context){
		if(!target.crossdata) {
			return;
		}

		var data = target.crossdata;
		var wordDirection;

		if(code === keys.up) {
			context.cells[[data.row - 1, data.column]].focus();
			wordDirection = 'down';
		} else if(code === keys.down){
			context.cells[[data.row + 1, data.column]].focus();
			wordDirection = 'down';
		} else if(code === keys.left){
			context.cells[[data.row, data.column - 1]].focus();
			wordDirection = 'across';
		} else if(code === keys.right){
			context.cells[[data.row, data.column + 1]].focus();
			wordDirection = 'across';
		} else if(code === keys.back && target.value.length === 0) {
			var word = context.currentWord;
			word.letters[word.letters.indexOf(target) - 1].focus();
			wordDirection = context.currentWord.direction;
		} else {
			return;
		}

		context.updateCurrentWord(wordDirection);

		highlight();
	};

	var handleClick = function(target, context) {
		if(!!context.selectedWord) {
			var isSameWord = context.selectedWord.letters.indexOf(document.activeElement) > -1;
		}

		context.updateCurrentWord();
		highlight();
	};

	var handleType = function(evt, context) {
		var code = evt.which ? evt.which : evt.keyCode;
		var target = evt.target;
		console.log(evt);

		//not arrows or backspace
		if(code != 8 && !(code >= 37 && code <= 40)) {
			var index = context.currentWord.letters.indexOf(target);
			setTimeout(function(){
				context.currentWord.letters[index + 1].focus();
				highlight();
			}, 5);
		}
	};

	var handleWordClick = function(target, context) {
		if(!!target.word) {
			target.word.letters[0].focus();
			context.updateCurrentWord(target.word.direction);
			highlight();
		}
	};

	var highlight = function() { setTimeout(function (){ document.activeElement.select(); }, 5); };
})();