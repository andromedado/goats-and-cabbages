
define([
    'jquery', 'game/util',
    'game/tiles/base', 'game/scratchPad'
], function ($, util, Tile, ScratchPad) {
    'use strict';

    function SquareGradient () {
        Tile.apply(this, arguments);
    }

    SquareGradient.prototype = new Tile();

    SquareGradient.prototype.draw = function () {
        var ctx = this.game.board.getBackgroundContext(),
            cBounds = this.getCanvasBounds(),
            tlX = this.bounds[0][0],
            tlY = this.bounds[0][1],
            brX = this.bounds[1][0],
            brY = this.bounds[1][1],
            cCenter = this.getCanvasCenter();

        this.drawClear();

        //var gradient = ctx.createRadialGradient(cCenter[0], cCenter[1], this.getCanvasWidth(), cBounds[0][0], cBounds[0][1], this.getCanvasWidth());
        var gradient = ctx.createRadialGradient(cCenter[0], cCenter[1], 0, cCenter[0], cCenter[1], this.getCanvasWidth() * Math.ROOT2 / 2);

        gradient.addColorStop(0, 'yellow');
        gradient.addColorStop(0.5, 'orange');
        gradient.addColorStop(1, 'red');
        ctx.fillStyle = gradient;
        ctx.fillRect(cBounds[0][0], cBounds[0][1], this.getCanvasWidth(), this.getCanvasHeight());

    };

    SquareGradient.prototype.drawElevationCircle = function (ctx, position, radius) {
        var canvasPosition = this.game.board.gamePosToCanvasPos(position);
        radius = radius || this.getCanvasWidth() / 2;
        ctx.fillStyle = this.game.terrain.determineColor(this, this.game.terrain.getElevationAtPosition(position));
        ctx.beginPath();
        ctx.arc(canvasPosition[0], canvasPosition[1], radius, 0, Math.TAU, true);
        ctx.closePath();
        ctx.fill();
    };

    return SquareGradient;

});

