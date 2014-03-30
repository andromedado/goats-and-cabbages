
define([
    'jquery', 'game/util',
    'game/tiles/base', 'game/scratchPad'
], function ($, util, Tile, ScratchPad) {
    'use strict';

    function Square () {
        Tile.apply(this, arguments);
    }

    Square.prototype = new Tile();

    Square.prototype.draw = function () {
        var ctx = this.game.board.getBackgroundContext(),
            cBounds = this.getCanvasBounds();

        this.drawClear();
        ctx.fillStyle = this.game.terrain.determineColor(this, this.elevation);
        ctx.fillRect(cBounds[0][0], cBounds[0][1], this.getCanvasWidth(), this.getCanvasHeight());

    };

    return Square;

});

