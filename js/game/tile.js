
define(['jquery', 'game/util'], function ($, util) {
    'use strict';
    var version = '0.0.2';

    function genData() {
        var data = {},
            id = this.getId();
        data._id = id;
        data.seed = util.mkRandomFn(id)();
        data.coords = [this.x, this.y];
        data.width = this.game.terrain.baseTileWidth;
        data.height = data.width;
        data.bounds = this.game.terrain.coordsToBounds(data.coords);
        return data;
    }

    function Tile (game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.load();
    }

    Tile.prototype.load = function () {
        var id = this.getId();
        this.data = this.game.storage.get(id);
        if (!this.data) {
            this.data = genData.call(this);
            this.data.elevation = this.game.terrain.calculateElevation(this);
            this.game.storage.set(id, this);
        }
        _.extend(this, this.data);
    };

    Tile.prototype.toJSON = function () {
        return this.data;
    };

    Tile.prototype.getCenter = function () {
        return [
            (this.bounds[0][0] + this.bounds[1][0]) / 2,
            (this.bounds[0][1] + this.bounds[1][1]) / 2
        ];
    };

    Tile.prototype.getDistanceToCenter = function (position) {
        return util.distance(position, this.getCenter());
    };

    Tile.prototype.getTileCloserToOrigin = function () {
        if (Math.abs(this.x) > Math.abs(this.y)) {
            if (this.x > 0) {
                return new Tile(this.game, this.x - 1, this.y);
            }
            return new Tile(this.game, this.x + 1, this.y);
        }
        if (this.y > 0) {
            return new Tile(this.game, this.x, this.y - 1);
        } else if (this.y < 0) {
            return new Tile(this.game, this.x, this.y + 1);
        }
        return this;
    };

    Tile.prototype.getTilesCloserToOrigin = function () {
        var x, y;
        if (this.x == 0 || this.y == 0) {
            var tile = this.getTileCloserToOrigin();
            return [tile, tile];
        }
        x = this.x > 0 ? this.x - 1 : this.x + 1;
        y = this.y > 0 ? this.y - 1 : this.y + 1;
        return [new Tile(this.game, this.x, y), new Tile(this.game, x, this.y)];
    };

    Tile.prototype.getId = function () {
        return ['tile', version, this.x, this.y].join(':');
    };

    Tile.prototype.save = function () {
        this.game.storage.set(this.getId(), this.data);
    };

    Tile.prototype.getCanvasBounds = function () {
        //May want to cache this calc per zoom/bounds
        return [
            this.game.board.gamePosToCanvasPos(this.data.bounds[0]),
            this.game.board.gamePosToCanvasPos(this.data.bounds[1])
        ];
    };

    Tile.prototype.getCanvasCenter = function () {
        return this.game.board.gamePosToCanvasPos(this.getCenter());
    };

    Tile.prototype.getCanvasWidth = function () {
        return Math.abs(this.game.board.gameXToCanvasX(this.data.bounds[0][0]) - this.game.board.gameXToCanvasX(this.data.bounds[1][0]));
    };

    Tile.prototype.getCanvasHeight = function () {
        return Math.abs(this.game.board.gameYToCanvasY(this.data.bounds[0][1]) - this.game.board.gameYToCanvasY(this.data.bounds[1][1]));
    };

    Tile.prototype.draw = function () {
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

    Tile.prototype.draw2 = function () {
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

    Tile.prototype.drawElevationCircle = function (ctx, position, radius) {
        var canvasPosition = this.game.board.gamePosToCanvasPos(position);
        radius = radius || this.getCanvasWidth() / 2;
        ctx.fillStyle = this.game.terrain.determineColor(this, this.game.terrain.getElevationAtPosition(position));
        ctx.beginPath();
        ctx.arc(canvasPosition[0], canvasPosition[1], radius, 0, Math.TAU, true);
        ctx.closePath();
        ctx.fill();
    };

    Tile.prototype.drawClear = function () {
        var ctx = this.game.board.getBackgroundContext(),
            cBounds = this.getCanvasBounds();
        ctx.clearRect(cBounds[0][0], cBounds[0][1], this.getCanvasWidth(), this.getCanvasHeight());
    };

    Tile.prototype.drawOutline = function (dontClear) {
        var ctx = this.game.board.getBackgroundContext(),
            cBounds = this.getCanvasBounds();
        if (!dontClear) {
            this.drawClear();
        }
        ctx.beginPath();
        ctx.moveTo(cBounds[0][0], cBounds[0][1]);
        ctx.lineTo(cBounds[1][0], cBounds[0][1]);
        ctx.lineTo(cBounds[1][0], cBounds[1][1]);
        ctx.lineTo(cBounds[0][0], cBounds[1][1]);
        ctx.closePath();
        ctx.stroke();
    };

    Tile.prototype.drawHighlight = function () {
        var ctx = this.game.board.getBackgroundContext(),
            cBounds = this.getCanvasBounds();
        this.drawClear();
        ctx.fillRect(cBounds[0][0], cBounds[0][1], this.getCanvasWidth(), this.getCanvasHeight());
    };

    Tile.prototype.toggleHighlight = function () {
        this.data.highlighted = !this.data.highlighted;
        console.log(this.data.highlighted);
        if (this.data.highlighted) {
            this.drawHighlight();
        } else {
            this.drawClear();
        }
        this.save();
    };

    return Tile;
});

