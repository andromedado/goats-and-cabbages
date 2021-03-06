
define(['jquery', 'views/EntityInfo'], function ($, EntityInfo) {
    'use strict';
    var defaultOptions = {
        pixelsPerMeter : 40,
        center : [0, 0]
    };

    var baseTranslation = [0.5, 0.5];

    function Board ($el, opts) {
        this.$el = $el;
        $.extend(this, defaultOptions, opts || {});
        this.load();
    }

    Board.prototype.load = function() {
        var self = this;
        this.entityInfo = new EntityInfo();
        self.$el.append(this.entityInfo.$el);
        this.createCanvases();
        _.each(this.canvases, function (canvas) {
            $(canvas).addClass('game-board').appendTo(self.$el);
        });
        this.resize();
    };

    Board.prototype.showInfo = function (entity) {
        this.entityInfo.model = entity;
        this.entityInfo.render().$el.show();
    };

    Board.prototype.hideInfo = function () {
        this.entityInfo.$el.hide();
    };

    Board.prototype.getPixelDimensions = function (bypassCache) {
        if (!this._pixelDimensions || bypassCache) {
            this._pixelDimensions = [this.$el.width(), this.$el.height()];
        }
        return this._pixelDimensions;
    };

    Board.prototype.resize = function () {
        var dimensions = this.getPixelDimensions(true);
        _.each(this.canvases, function (canvas) {
            $(canvas).attr({
                width : dimensions[0],
                height : dimensions[1]
            });
        });
        return this;
    };

    Board.prototype.windowXtoCanvasX = function (x) {
        return x - $(this.canvases[0]).offset().left;
    };

    Board.prototype.windowYtoCanvasY = function (y) {
        return y - $(this.canvases[0]).offset().top;
    };

    Board.prototype.gameBoundsToCanvasBounds = function (bounds) {
        return [
            this.gamePosToCanvasPos(bounds[0]),
            this.gamePosToCanvasPos(bounds[1])
        ];
    };

    Board.prototype.gamePosToCanvasPos = function (pos) {
        return [this.gameXToCanvasX(pos[0]), this.gameYToCanvasY(pos[1])];
    };

    Board.prototype.windowXToGameX = function (x) {
        return this.canvasXToGameX(this.windowXtoCanvasX(x));
    };

    Board.prototype.windowYToGameY = function (y) {
        return this.canvasYToGameY(this.windowYtoCanvasY(y));
    };

    Board.prototype.gameXToCanvasX = function (x) {
        var canvasOriginX = this.getVisibleBounds()[0][0];
        return (x - canvasOriginX) * this.pixelsPerMeter;
    };

    Board.prototype.gameYToCanvasY = function (y) {
        var topLeftY = this.getVisibleBounds()[0][1];
        return (topLeftY - y) * this.pixelsPerMeter;
    };

    Board.prototype.canvasXToGameX = function (x) {
        var canvasOriginX = this.getVisibleBounds()[0][0];
        return (x / this.pixelsPerMeter) + canvasOriginX;
    };

    Board.prototype.canvasYToGameY = function (y) {
        var canvasOriginY = this.getVisibleBounds()[0][1];
        return ((y / this.pixelsPerMeter) - canvasOriginY) * -1;
    };

    Board.prototype.getTopCanvas = function () {
        return this.canvases[this.canvases.length - 1];
    };

    Board.prototype.createCanvases = function() {
        this.bgCanvas = document.createElement('canvas');
        this.fgCanvas = document.createElement('canvas');
        this.infoCanvas = document.createElement('canvas');
        this.debugCanvas = document.createElement('canvas');
        this.canvases = [this.bgCanvas, this.fgCanvas, this.infoCanvas, this.debugCanvas];
    };

    Board.prototype.getVisibleCanvasBounds = function () {
        var bounds = this.getVisibleBounds();
        return this.gameBoundsToCanvasBounds(bounds);
    };

    /**
     * Get visible bounds in meters
     * [[topLeftX, topLeftY], [bottomRightX, BottomRightY]]
     * @returns {Array}
     */
    Board.prototype.getVisibleBounds = function () {
        var dimensions = this.getPixelDimensions();
        return [
            [
                this.center[0] - ((dimensions[0] / 2) / this.pixelsPerMeter),
                this.center[1] + ((dimensions[1] / 2) / this.pixelsPerMeter)
            ],
            [
                this.center[0] + ((dimensions[0] / 2) / this.pixelsPerMeter),
                this.center[1] - ((dimensions[1] / 2) / this.pixelsPerMeter)
            ]
        ];
    };

    Board.prototype.drawDebug = function () {
        var bounds = this.getPixelDimensions(),
            crossHatchWidth = 20,
            originX = this.gameXToCanvasX(this.center[0]),
            originY = this.gameYToCanvasY(this.center[1]),
            ctx = this.getDebugContext();
        ctx.clearRect(0, 0, bounds[0], bounds[1]);
        ctx.beginPath();
        ctx.strokeStyle = '#000000';
        ctx.moveTo(originX - (crossHatchWidth / 2), originY);
        ctx.lineTo(originX + (crossHatchWidth / 2), originY);
        ctx.moveTo(originX, originY - (crossHatchWidth / 2));
        ctx.lineTo(originX, originY + (crossHatchWidth / 2));
        ctx.closePath();
        ctx.stroke();
        originX = this.gameXToCanvasX(0);
        originY = this.gameYToCanvasY(0);
        ctx.beginPath();
        ctx.strokeStyle = '#FF0000';
        ctx.moveTo(originX - (crossHatchWidth / 2), originY);
        ctx.lineTo(originX + (crossHatchWidth / 2), originY);
        ctx.moveTo(originX, originY - (crossHatchWidth / 2));
        ctx.lineTo(originX, originY + (crossHatchWidth / 2));
        ctx.closePath();
        ctx.stroke();
    };

    Board.prototype.getDebugContext = function () {
        if (!this.debugContext) {
            this.debugContext = this.debugCanvas.getContext('2d');
            this.debugContext.translate.apply(this.debugContext, baseTranslation);
        }
        return this.debugContext;
    };

    Board.prototype.getEntityContext = function () {
        if (!this.entityContext) {
            this.entityContext = this.fgCanvas.getContext('2d');
            this.entityContext.translate.apply(this.entityContext, baseTranslation);
        }
        return this.entityContext;
    };

    Board.prototype.getBackgroundContext = function () {
        if (!this.bgContext) {
            this.bgContext = this.bgCanvas.getContext('2d');
        }
        return this.bgContext;
    };

    Board.prototype.clear = function () {
        var bounds = this.getPixelDimensions();
        this.getEntityContext().clearRect(0, 0, bounds[0], bounds[1]);
    };

    /**
     * Used to compare against to see if we're looking at the same bounds/zoom
     * @returns {string}
     */
    Board.prototype.getBoundsHash = function () {
        return this.center[0] + ':' + this.center[1] + ':' + this.pixelsPerMeter;
    };

    return Board;
});

