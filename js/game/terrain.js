
define([
    'jquery', 'game/util',
    'game/tile', 'game/scratchPad'
], function ($, util, Tile, ScratchPad) {
    'use strict';

    function Terrain (game) {
        this.game = game;
        this.load();
    }

    Terrain.prototype.load = function () {
        this.scratchPad = new ScratchPad(this.game);
        this.random = util.mkRandomFn(this.game.seed + 'terrain');
        this.minColorValue = 0.8;
        this.maxColorValue = 1;
        this.changeAversionExponent = 3;//Higher means less likely to change
        this.minColorSaturation = 0.2;
        this.maxColorSaturation = 0.3;
        this.maxHue = 10;//red/orange
        this.minHue = 230;//blue
        this.baseTileWidth = 2;//meters
        this.maxElevation = 1500;//Mountain
        this.minElevation = -700;//Ocean
        this.maximumChangePerTile = 400;
        this.averageElevation = 300;
        this.averageWeight = 0.75;
        var baseInitial = this.game.randBetween(this.minElevation, this.maxElevation, this.random());
        var weightedInitial = (baseInitial + this.averageElevation) / 2;
        this.initialElevation = (weightedInitial - baseInitial) * (this.random() * this.averageWeight + this.averageWeight) + baseInitial;
    };

    Terrain.prototype.getElevationAtPosition = function (position) {
        return this.scratchPad.value(position.join('posElevation'), function () {
            var tiles = this.getFourNearestTiles(position),
                weightedSumElevation = 0,
                netWeight = 0;
            _.each(tiles, function (tile) {
                var weight = 2 - ((tile.getDistanceToCenter(position) / (tile.width * 1.41421)) * 2);
                netWeight += weight;
                weightedSumElevation += weight * tile.elevation;
            });
            return weightedSumElevation / 4;
        }, this);
    };

    Terrain.prototype.getFourNearestTiles = function (position) {
        var tileX = position[0] / this.baseTileWidth,
            tileY = position[1] / this.baseTileWidth;
        if (Math.floor(tileX) === tileX) {
            tileX -= 0.001;
        }
        if (Math.floor(tileY) === tileY) {
            tileY -= 0.001;
        }
        return [
            this.getTileAtCoords(Math.floor(tileX), Math.floor(tileY)),
            this.getTileAtCoords(Math.floor(tileX), Math.ceil(tileY)),
            this.getTileAtCoords(Math.ceil(tileX), Math.floor(tileY)),
            this.getTileAtCoords(Math.ceil(tileX), Math.ceil(tileY))
        ];
    };

    Terrain.prototype.determineColor = function (tile, elevation) {
        return util.hsvToHex(this.determineHue(elevation), this.determineSaturation(tile), this.determineValue(tile));
    };

    Terrain.prototype.determineValue = function (tile) {
        return 0.9;
        return this.game.randBetween(this.minColorValue, this.maxColorValue, 1 - tile.seed);
    };

    Terrain.prototype.determineSaturation = function (tile) {
        return 0.4;
        return this.game.randBetween(this.minColorSaturation, this.maxColorSaturation, tile.seed);
    };

    Terrain.prototype.determineHue = function (elevation) {
        return util.proportion(elevation, this.minElevation, this.maxElevation, this.minHue, this.maxHue) % 360;
    };

    //This is invoked every time a tile is created for the first time.
    //So, if origin tile, don't reference other tiles
    Terrain.prototype.calculateElevation = function (tile) {
        var closerToOrigin,
            upperBound, lowerBound,
            simpleElevation,
            //Each tile has it's own maximum possible change
            maxChange = Math.pow(tile.data.seed, this.changeAversionExponent) * this.maximumChangePerTile;
        if (tile.x == 0 || tile.y == 0) {
            if (tile.x == 0 && tile.y == 0) {
                console.log('origin! so %s', this.initialElevation);
                return this.initialElevation;
            }
            simpleElevation = tile.getTileCloserToOrigin().elevation;
        } else {
            closerToOrigin = tile.getTilesCloserToOrigin();
            simpleElevation = (closerToOrigin[0].elevation + closerToOrigin[1].elevation) / 2;
        }
        upperBound = Math.min(simpleElevation + maxChange, this.maxElevation);
        lowerBound = Math.max(simpleElevation - maxChange, this.minElevation);
        return this.game.randBetween(lowerBound, upperBound, this.random());
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
        _.each(tiles, function (tile) {
            tile.draw();
        });
        if (this.game.debug) {
            _.each(tiles, function (tile) {
                tile.drawOutline(true);
            });
        }
    };

    return Terrain;
});

