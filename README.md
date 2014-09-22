crossword.js
============

####Example Usage####

    var words = [
    	{ word:"some", clue:"More than none", location:{ column:1, row:4 }, direction:'across' },
    	{ word:"examples", clue:"e.g. plural", location:{ column:3, row:1 }, direction:'down' }
    ];
    
    var puzzle = new Crossword({
    	words:words,
    	element:document.getElementById('puzzle'),
    	autosort:true,
    	disableErrorCheck:false
    });
