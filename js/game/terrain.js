
define(['jquery', 'game/util', 'game/tile'], function ($, util, Tile) {
    'use strict';

    function Terrain (game) {
        this.game = game;
        this.load();
    }

    Terrain.prototype.load = function () {
        this.baseTileWidth = 1;//meters
        this.random = util.mkRandomFn(this.game.seed + 'terrain');
    };

    /**
     * Position is an absolute [x,y] in the game's coordinate plane.
     * Coords returned are tile-based coordinates
     * @param position
     * @returns {*[]}
     */
    Terrain.prototype.positionToCoords = function (position) {
        return [
            Math.floor(position[0] / this.baseTileWidth),
            Math.floor(position[1] / this.baseTileWidth)
        ];
    };

    /**
     * Get the absolute game bounds of the give tile-coordinates
     * @param coords
     * @returns {*[]}
     */
    Terrain.prototype.coordsToBounds = function (coords) {
        return [
            [coords[0] * this.baseTileWidth, (coords[1] + 1) * this.baseTileWidth],
            [(coords[0] + 1) * this.baseTileWidth, coords[1] * this.baseTileWidth]
        ];
    };

    Terrain.prototype.coordsToKey = function (x, y) {
        return ['coords', x, y].join(':');
    };

    Terrain.prototype.getTileAtCoords = function (x, y) {
        return new Tile(this.game, x, y);
    };

    Terrain.prototype.getTileAtPosition = function (position) {
        var coords = this.positionToCoords(position);
        return this.getTileAtCoords(coords[0], coords[1]);
    };

    Terrain.prototype.getTilesForBounds = function (bounds) {
        var tiles = [],
            topLeftCoords = this.positionToCoords(bounds[0]),
            bottomRightCoords = this.positionToCoords(bounds[1]);
        for (var x = topLeftCoords[0]; x <= bottomRightCoords[0]; x++) {
            for (var y = bottomRightCoords[1]; y <= topLeftCoords[1]; y++) {
                tiles.push(this.getTileAtCoords(x, y));
            }
        }
        return tiles;
    };

    Terrain.prototype.getVisibleTiles = function () {
        return this.getTilesForBounds(this.game.board.getVisibleBounds());
    };

    Terrain.prototype.draw = function () {
        var tiles = this.getVisibleTiles();
        if (this.game.debug) {
            _.each(tiles, function (tile) {
                tile.drawOutline();
            });
        }
    };

    return Terrain;
});

