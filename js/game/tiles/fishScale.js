
define([
    'jquery', 'game/util',
    'game/tiles/base', 'game/scratchPad'
], function ($, util, Tile, ScratchPad) {
    'use strict';

    function FishScale () {
        Tile.apply(this, arguments);
    }

    FishScale.prototype = new Tile();

    FishScale.prototype.draw = function () {
        var ctx = this.game.board.getBackgroundContext(),
            cBounds = this.getCanvasBounds(),
            tlX = this.bounds[0][0],
            tlY = this.bounds[0][1],
            brX = this.bounds[1][0],
            brY = this.bounds[1][1],
            halfWidth = this.width / 2,
            halfHeight = this.height / 2;

        this.drawClear();
//        ctx.fillStyle = this.game.terrain.determineColor(this, this.elevation);
//        ctx.fillRect(cBounds[0][0], cBounds[0][1], this.getCanvasWidth(), this.getCanvasHeight());
        this.drawElevationCircle(ctx, this.getCenter());

        ctx.save();

        ctx.beginPath();
        ctx.rect(cBounds[0][0], cBounds[0][1], this.getCanvasWidth(), this.getCanvasHeight());
        ctx.clip();

        ctx.globalAlpha = 0.9;

        this.drawElevationCircle(ctx, [tlX, tlY]);
        this.drawElevationCircle(ctx, [brX, brY]);
        this.drawElevationCircle(ctx, [brX, tlY]);
        this.drawElevationCircle(ctx, [tlX, brY]);

        this.drawElevationCircle(ctx, [tlX + halfWidth, tlY]);
        this.drawElevationCircle(ctx, [brX, tlY - halfHeight]);
        this.drawElevationCircle(ctx, [brX - halfWidth, brY]);
        this.drawElevationCircle(ctx, [tlX, brY + halfHeight]);

        ctx.restore();
    };

    FishScale.prototype.draw2 = function () {
        var ctx = this.game.board.getBackgroundContext(),
            tlX = this.bounds[0][0],
            tlY = this.bounds[0][1],
            brX = this.bounds[1][0],
            brY = this.bounds[1][1];
        ctx.save();
        ctx.globalAlpha = 0.75;
        //this.drawElevationCircle(ctx, [this.game.randBetween(tlX, brX, this.seed), this.game.randBetween(tlY, brY, this.seed)], this.seed * this.getCanvasWidth() / 2);
        ctx.restore();
    };

    FishScale.prototype.drawElevationCircle = function (ctx, position, radius) {
        var canvasPosition = this.game.board.gamePosToCanvasPos(position);
        radius = radius || this.getCanvasWidth() / 2;
        ctx.fillStyle = this.game.terrain.determineColor(this, this.game.terrain.getElevationAtPosition(position));
        ctx.beginPath();
        ctx.arc(canvasPosition[0], canvasPosition[1], radius, 0, Math.TAU, true);
        ctx.closePath();
        ctx.fill();
    };

    return FishScale;

});

