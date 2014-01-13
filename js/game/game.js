
define([
    'jquery', 'underscore',
    'backbone', 'game/util',
    'game/board', 'game/entities',
    'game/behaviors'
], function ($, _, Backbone, util, Board, Entity, Behavior) {
    'use strict';
    var defaultOptions = {};

    function Game (opts) {
        var self = this;
        $.extend(this, defaultOptions, {seed : Math.random()}, opts || {});

        (function () {
            var seed = 0, l;
            self.seed = String(self.seed);
            l = self.seed.length;
            for (var i = 0; i < l; i++) {
                seed += self.seed.charCodeAt(i);
            }
            self.random = function () {
                var x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            };
        }());

        this.load();
        this.going = false;

        (function () {
            var lastTime = Date.now();
            (function main() {
                var now = Date.now();

                if (self.going) {
                    try {
                        self.update((now - lastTime) / 1000.0);
                    } catch (e) {
                        debugger;
                    }
                    if (self.tracking) {
                        self.board.center = self.tracking.position.slice();
                    }
                    self.draw();
                    if (self.until()) {
                        self.going = false;
                    }
                }

                lastTime = now;
                requestAnimationFrame(main);
            }());
        }());
    }

    Game.prototype.until = function () {
        return false;
    };

    Game.prototype.load = function () {
        var self = this;
        this.board = new Board(this.boardEl, this.boardOptions);
        $(window).resize(function (e) {
            if (!e.isTrigger) {
                self.resize();
            }
        }).on('mousemove', function (e) {
                self.mouseMove(e);
            });
        this.entities = [];
        this.dragging = {};
        this.$topCanvas = $(this.board.getTopCanvas());
        this.$topCanvas.on('click', function (e) {
            self.gameClick(e);
        }).on('mousedown', function (e) {
                self.gameMouseDown(e);
            }).on('mouseup', function (e) {
                self.gameMouseUp(e);
            });
        this.gameTime = 0;
    };

    Game.prototype.followIt = function () {
        this.wantsToFollowIt = !this.wantsToFollowIt;
    };

    Game.prototype.resetFocus = function () {
        this.tracking = null;
        this.board.center = [0, 0];
        this.wantsToFollowIt = false;
        this.draw();
    };

    Game.prototype.followMyClicks = function () {
        this.followingClicks = !this.followingClicks;
    };

    Game.prototype.gameMouseDown = function (e) {
        var gameX = this.board.windowXToGameX(e.pageX),
            gameY = this.board.windowYToGameY(e.pageY);
        this.dragging = {
            entity : this.getEntitiesAtPoint([gameX, gameY])[0]
        };
        if (this.dragging.entity) {
            this.dragging.couldMove = this.dragging.entity.canMove;
            this.dragging.entity.canMove = false;
            this.dragging.offset = [gameX - this.dragging.entity.position[0], gameY - this.dragging.entity.position[1]];
        } else {
            this.dragging.offset = [gameX, gameY];
        }
    };

    Game.prototype.mouseMove = function (e) {
//        Not Currently Needed
//        this.mouseWindowX = e.pageX;
//        this.mouseWindowY = e.pageY;
        if (this.dragging.hasOwnProperty('entity')) {
            var gameX = this.board.windowXToGameX(e.pageX),
                gameY = this.board.windowYToGameY(e.pageY);
            if (this.dragging.entity) {
                this.dragging.entity.position = [gameX - this.dragging.offset[0], gameY - this.dragging.offset[1]];
                this.dragging.entity.trigger('interrupt');
            } else {
                //Dragging the whole board
                //Maintain mouse position within the board
                this.board.center = [this.board.center[0] + this.dragging.offset[0] - gameX, this.board.center[1] + this.dragging.offset[1] - gameY];// + this.dragging.offset[1] - gameY];
            }
            this.draw();
        }
    };

    Game.prototype.gameMouseUp = function (e) {
        console.log(this.dragging.entity);
        if (this.dragging.entity) {
            this.dragging.entity.canMove = this.dragging.couldMove;
        }
        this.dragging = {};
    };

    Game.prototype.gameClick = function (e) {
        var gameClickPos = [this.board.windowXToGameX(e.pageX), this.board.windowYToGameY(e.pageY)],
            self = this,
            entities = this.getEntitiesAtPoint(gameClickPos);
        if (entities.length) {
            _.each(entities, function (entity) {
                entity.highlighted = !entity.highlighted;
                if (self.wantsToFollowIt) {
                    self.tracking = entity;
                }
                console.log(entity);
            });
        } else {
            if (this.followingClicks) {
                _.each(this.entities, function (entity) {
                    entity.faceThis(gameClickPos);
                    entity.trigger('interrupt');
                });
            }
        }
        this.draw();
    };

    Game.prototype.toggleDebug = function () {
        this.debug = !this.debug;
        this.draw();
    };

    Game.prototype.getHighlightedEntities = function () {
        return _.filter(this.entities, function (a) {return a.highlighted;});
    };

    Game.prototype.getEntitiesAtPoint = function (point) {
        var entities = [];
        _.each(this.entities, function (entity) {
            if (entity.occupiesPoint(point)) {
                entities.push(entity);
            }
        });
        return entities;
    };

    Game.prototype.announceTime = _.throttle(function () {
        console.log('GameTime:', this.gameTime);
    }, 600);

    Game.prototype.update = function (dt) {
        this.announceTime();
        this.gameTime += dt;

        //handleInput : Like Keys being pushed down

        this.updateEntities(dt);
        //Any new entities? other env changes by time?
    };

    Game.prototype.updateEntities = function (dt) {
        _.each(this.entities, function (entity) {
            entity.update(dt);
        });
    };

    Game.prototype.randBetween = function (min, max, rand) {
        return ((max - min) * (rand || this.random())) + min;
    };

    Game.prototype.play = function (until) {
        this.until = until || Game.prototype.until;
        this.going = true;
    };

    Game.prototype.pause = function () {
        this.going = false;
    };

    Game.prototype.step = function () {
        this.going = true;
        this.until = function () {
            return true;
        };//only go once
    };

    Game.prototype.zoomOut = function () {
        this.board.pixelsPerMeter /= 2;
        this.draw();
    };

    Game.prototype.zoomIn = function () {
        this.board.pixelsPerMeter *= 2;
        this.draw();
    };

    Game.prototype.removeEntity = function (entity) {
        var entities = [];
        _.each(this.entities, function (ent) {
            if (!entity.isEqual(ent)) {
                entities.push(ent);
            }
        });
        this.entities = entities;
    };

    Game.prototype.addCabbage = function (dontDraw) {
        var bounds = this.board.getVisibleBounds(),
            Cabbage = new Entity.Cabbage(this, {
                facing : Math.TAU * this.random(),
                position : [
                    this.randBetween(bounds[0][0], bounds[1][0]),
                    this.randBetween(bounds[0][1], bounds[1][1])
                ]
            });
        this.entities.push(Cabbage);
        window.Cabbage = Cabbage;
        if (!dontDraw) {
            this.draw();
        }
    };

    Game.prototype.addGoat = function (dontDraw) {
        var bounds = this.board.getVisibleBounds(),
            Goat = new Entity.Goat(this, {
                facing : Math.TAU * this.random(),
                position : [
                    this.randBetween(bounds[0][0], bounds[1][0]),
                    this.randBetween(bounds[0][1], bounds[1][1])
                ]
            });
        this.entities.push(Goat);
        window.Goat = Goat;
        if (!dontDraw) {
            this.draw();
        }
    };

    Game.prototype.randEntities = function (cabbages, goats) {
        cabbages = Math.floor(Math.abs(Number(cabbages)) || this.randBetween(10, 51));
        goats = Math.floor(Math.abs(Number(goats)) || this.randBetween(1, 5));
        while (cabbages--) {
            this.addCabbage(true);
        }
        while (goats--) {
            this.addGoat(true);
        }
        this.draw();
    };

    Game.prototype.onScreen = function (point) {
        return util.pointWithinBounds(point, this.board.getVisibleBounds());
    };

    Game.prototype.draw = function () {
        var self = this;
        self.board.clear();
        _.each(this.entities, function (entity) {
            if (self.onScreen(entity)) {
                entity.draw(self.board);
            }
        });
        if (this.debug) {
            this.board.drawDebug();
        }
    };

    Game.prototype.resize = _.debounce(function () {
        console.log('Ok, i\'m resizing now');
        this.board.resize();
    }, 100);

    Game.prototype.getEntitiesWithin = function (meters, ofEntity) {
        var entities = [];
        _.each(this.entities, function (ent) {
            if (!ent.isEqual(ofEntity)) {
                if (util.pointsAreWithinXMeters(ent, ofEntity, meters)) {
                    entities.push(ent);
                }
                //This can be done without square-rooting
//                if (util.distance(ent, ofEntity) <= meters) {
//                    entities.push(ent);
//                }
            }
        });
        return entities;
    };

    return Game;
});
