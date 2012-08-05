jQuery(function($){
    var canvas = $('#game')[0];
    var ctx = canvas.getContext('2d');

    var width=200;
    var height=400;

    var infoWidth=200;

    var rows = 22;
    var cols = 10;
    var hiddenRows = 0;

    var heightPerCell = height/(rows-hiddenRows);
    var widthPerCell = width/cols;

    var colors = ['#FFFFFF', '#AA0000', '#00AA00', '#0000AA', '#A0A0A0', '#C8F526'];
    var pieces = [
        [[1,1],
         [1,1]],     //block
        [[2,2,2,2]], //long one
        [[3,3,3],
         [0,0,3]],   //Long with a bend
        [[3,3,3],
         [3,0,0]],   //Other way of above
        [[4,4,0],
         [0,4,4]],   //Annoying one
        [[0,4,4],
         [4,4,0]],   //Other way of above
        [[0,5,0],
         [5,5,5]]    //That one
    ];
    var grid = [];
    var piece;
    var nextPiece;
    var pieceCoords;
    var defaultPieceCoords = {col:3, row:0};
    var speed = 500;
    var speeds = [500,400,300,200,100,50,40,30,20];
    var gameInterval;
    var rowsKilled=0;
    var rowsInLevel=0;

    //Create empty grid
    for (var i=0; i<rows; i++){
        grid.push([]);
        for(var j=0; j<cols; j++){
            grid[grid.length-1].push(0);
        }
    }

    function loopGrid(grid, callback){
        for(var row in grid){
            for(var col in grid[row]){
                callback(parseInt(row), parseInt(col), grid[row][col]);
            }
        }
    }

    function drawGrid(){
        ctx.save();
        ctx.clearRect(0,0,width,height);
        loopGrid(grid, drawSquare);
        ctx.restore();
    }

    function checkForFullRows(){
        var rowFull=true;
        for(row in grid){
            rowFull=true;
            for(var col in grid[row]){
                if (!grid[row][col]) rowFull=false;
            }
            if (rowFull){
                rowsKilled++;
                rowsInLevel++;
                for(var rowToMove=grid.length-1; rowToMove >= 0; rowToMove--){
                    for(col in grid[rowToMove]){
                        if (rowToMove < row){
                            grid[parseInt(rowToMove)+1][col] = grid[parseInt(rowToMove)][col];
                        }
                    }
                }
            }
        }
        drawInfo();
    }

    function drawSquare(row, col, color){
        if (row >= hiddenRows){
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = colors[color];
            ctx.fillRect(col*widthPerCell,(row-hiddenRows)*heightPerCell,widthPerCell,heightPerCell);
            ctx.strokeRect(col*widthPerCell,(row-hiddenRows)*heightPerCell,widthPerCell,heightPerCell);
        }
    }

    function canMove(piece, toRow, toCol){
        var ok=true;
        loopGrid(piece, function(row, col, elem){
            row = parseInt(row)+parseInt(toRow);
            col = parseInt(col)+parseInt(toCol);
            if (row < 0 || row >= rows || col < 0 || col >= cols || (elem && grid[row][col])){
                ok=false;
            }
        });
        return ok;
    }

    function movePiece(drows, dcols){
        var col = parseInt(pieceCoords.col)+parseInt(dcols);
        var row = parseInt(pieceCoords.row)+parseInt(drows);
        clearPiece();
        var moveable = canMove(piece, row,col);
        if(moveable){
            pieceCoords.col = col;
            pieceCoords.row = row;
        }
        drawPiece();
        return moveable;
    }

    function drawPiece(clear){
        loopGrid(piece, function(row, col, elem){
            if (elem){
                grid[parseInt(row)+parseInt(pieceCoords.row)][parseInt(col)+parseInt(pieceCoords.col)] = clear ? 0 : elem;
            }
        });
        drawGrid();
    }

    function clearPiece(){
        drawPiece(true);
    }

    function drawInfo(){
        ctx.clearRect(width,0,infoWidth,height);
        loopGrid(nextPiece, function(row, col, elem){
            if (elem) drawSquare(row+5, col+13, elem);
        });
        if (rowsInLevel>=5){
            rowsInLevel=0;
            var index = $.inArray(speed, speeds);
            if (index < speeds.length-1){ speed = speeds[index+1]; startGame(speed);}
        }
        $('#points').text(rowsKilled);
        $('#pointsToGo').text(5-rowsInLevel);
        $('#speed').text(speed);
    }

    function prepareNextPiece(){
        nextPiece = pieces[Math.floor(Math.random()*pieces.length)];
        for(var i=0; i<Math.floor(Math.random()*3); i++){
            nextPiece = rotatePiece(nextPiece);
        }
        drawInfo();
    }

    function newPiece(){
        checkForFullRows();
        pieceCoords = {row: defaultPieceCoords.row, col: defaultPieceCoords.col};
        piece = nextPiece;
        prepareNextPiece();

        if (canMove(piece, pieceCoords.row, pieceCoords.col)){
            drawPiece();
        }
        else{
            alert('Bad luck. You scored '+$('#points').text());
            clearInterval(gameInterval);
        }
        return piece;
    }

    function rotatePiece(orig){
        clearPiece();
        rotated = [];
        var dcols = parseInt(orig[0].length == 4 ? 1 : 0);
        loopGrid(orig, function(row, col, elem){
            //column of new = row of old
            //row of new = columns of old-column of old
            var newCol = row + dcols;
            var newRow = orig[0].length - 1 - col;
            if (typeof(rotated[newRow]) == 'undefined') rotated[newRow] = [];
            rotated[newRow][newCol] = orig[row][col];
        });
        return rotated;
    }

    function handleKeyPress(code){
        if (code == 37){ //L
            movePiece(0,-1);
        }
        else if (code == 39){ //R
            movePiece(0,1);
        }
        else if (code == 40){ //D
            movePiece(1,0);
        }
        else if (code == 38){ //U
            var rotated = rotatePiece(piece);
            if (canMove(rotated, pieceCoords.row, pieceCoords.col)){
                piece = rotated;
            }
            drawPiece();
        }
        else{
            return true;
        }
        return false;
    }

    $(document).bind($.browser.safari ? 'keydown' : 'keypress' , function(e){
        return handleKeyPress(e.keyCode);
    });

    function startGame(speed){
        clearInterval(gameInterval);
        gameInterval = setInterval(function(){
            if (!movePiece(1,0)){newPiece();}
        }, speed);
    }

    prepareNextPiece();
    newPiece();
    startGame(speed);
});

