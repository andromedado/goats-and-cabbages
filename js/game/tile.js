
define(['jquery', 'game/util'], function ($, util) {
    'use strict';

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
        var id = this.getId(),
            data = this.game.storage.get(id);
        if (!data) {
            data = genData.call(this);
            this.game.storage.set(id, data);
        }
        this.data = data;
    };

    Tile.prototype.getId = function () {
        return ['tile', this.x, this.y].join(':');
    };

    Tile.prototype.save = function () {
        this.game.storage.set(this.getId(), this.data);
    };

    Tile.prototype.getCanvasBounds = function () {
        //May want to cache this calc per zoom/bounds
        return [
            [this.game.board.gameXToCanvasX(this.data.bounds[0][0]), this.game.board.gameYToCanvasY(this.data.bounds[0][1])],
            [this.game.board.gameXToCanvasX(this.data.bounds[1][0]), this.game.board.gameYToCanvasY(this.data.bounds[1][1])]
        ];
    };

    Tile.prototype.drawClear = function () {
        var ctx = this.game.board.getBackgroundContext(),
            cBounds = this.getCanvasBounds();
        ctx.clearRect(cBounds[0][0], cBounds[0][1], cBounds[1][0] - cBounds[0][0], cBounds[0][1] - cBounds[1][1]);
    };

    Tile.prototype.drawOutline = function () {
        var ctx = this.game.board.getBackgroundContext(),
            cBounds = this.getCanvasBounds();
        this.drawClear();
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
        ctx.fillRect(cBounds[0][0], cBounds[0][1], cBounds[1][0] - cBounds[0][0], cBounds[0][1] - cBounds[1][1]);
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

