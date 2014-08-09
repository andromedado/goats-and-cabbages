
define(['jquery', 'game/util', 'game/behaviors', 'backbone'], function ($, util, Behavior, Backbone) {
    'use strict';
    var deMinimisMass = 0.001;
    var defaultOptions = {
            facing : util.NorthRadians,//Radians, NORTH
            facingTolerance : Math.TAU / 1000,
            beakColor : '#000',
            releaseConcentrationAfter : 0.2,
            canMove : false,
            //reach : 0,
            mass : 1,//kg
            speed : {
                turning : Math.TAU / 2//Radians Per Second
            },
            vision : {
                distance : 10,//Meters
                peripheral : Math.TAU / 5//TAU/8 Radians :: 45degrees, so we have a field of vision 90 degrees wide
            },
            concentrating : false
        },
        id = 0,
        distanceTolerance = 0.01;

    var Entity = Backbone.Model.extend({
        initialize : function (game, options) {
            Entity.__super__.initialize.call(this, options);
            this.game = game;
            this.entityId = id++;
            this.set($.extend(true, {}, defaultOptions, options || {}));
            this.set({
                seed : this.game.random(),
                initialMass : this.get('mass'),
                whatIPerceive : []
            });
            this.on('eaten', function () {
                this.remove();
            });
        },
        get : function (what) {
            var val = Backbone.Model.prototype.get.apply(this, arguments);
            if (val === void 0 && what && what.indexOf('.') > -1) {
                val = this.toJSON();
                _.each(what.split('.'), function (bit) {
                    val = val && val[bit];
                });
            }
            return val;
        }
    });

    Entity.prototype.getInfo = function () {
        var data = this.toJSON();
        data.displayInfo = this.getDisplayInfo();
        return data;
    };

    Entity.prototype.getDisplayInfo = function () {
        var self = this;
        var displayInfo = {
            keyValuePairs : {}
        };
        _.each(this.getInterestingBoolFns(), function (fn) {
            var val = self[fn]();
            val = util.prettify(val);
            displayInfo.keyValuePairs[fn] = val;
        });
        _.each(this.getInterestingPropertyNames(), function (prop) {
            var val = self[prop];
            val = util.prettify(val);
            displayInfo.keyValuePairs[prop] = val;
        });
        return displayInfo;
    };

    Entity.prototype.getInterestingPropertyNames = function () {
        return [
            'canMove',
            'position'
        ];
    };

    Entity.prototype.getInterestingBoolFns = function () {
        return [
            'getBehavior',
            'isConcentrating',
            'canWalk'
        ];
    };

    Entity.prototype.consume = function (mass, sourceEntity) {
        this.attributes.mass += mass;
        sourceEntity.beConsumed(mass, this);
    };

    Entity.prototype.beConsumed = function (mass, consumer) {
        this.set('mass', this.get('mass') - mass);
        if (this.get('mass') < deMinimisMass) {
            this.trigger('eaten', {by : consumer});
        }
    };

    Entity.prototype.setDestination = function (toWhat) {
        this.set('destinationEntity', toWhat);
    };

    Entity.prototype.getDestination = function () {
        return this.get('destinationEntity');
    };

    Entity.prototype.getEntitiesToStepAwayFrom = function () {
        return this.get('entitiesToStepAwayFrom') || [];
    };

    Entity.prototype.interrupt = function () {
        this.set('concentrating', false);
    };

    Entity.prototype.isConcentrating = function () {
        return this.get('concentrating');
    };

    Entity.prototype.canWalk = function () {
        return this.get('speed.walking') > 0;
    };

    Entity.prototype.remove = function () {
        this.game.removeEntity(this);
        this.trigger('gone');
    };

    Entity.prototype.isEqual = function (toWhat) {
        return toWhat && this.entityId === toWhat.entityId;
    };

    Entity.prototype.getPosition = function () {
        return this.get('position');
    };

    /**
     * Default implementation is to
     * perform appropriate behaviors until
     * all time given has been consumed
     * @param dt
     */
    Entity.prototype.update = function (dt) {
        var i = 0, behavior, left, diff;
        while (dt > 0 && i++ < 50) {
            behavior = this.getBehavior();
            left = this.performBehavior(behavior, dt);
            diff = dt - left;
            dt = left;
            if (this.currentBehavior != behavior) {
                this.currentBehavior = behavior;
                this.performingFor = diff;
                this.behaviorSeed = this.game.random();
            } else {
                this.performingFor += diff;
            }
        }
        if (i == 50) {
            console.log('there\'s a bug somewhere');
        }
    };

    Entity.prototype.getBehavior = function () {
        return Behavior.Wait;
    };

    Entity.prototype.performBehavior = function (behavior, dt) {
        return behavior.do(this, dt);
    };

    Entity.prototype.getDistance = function (otherEntity) {
        return util.distance(this, otherEntity);
    };

    Entity.prototype.getInnerDistance = function (what) {
        var absDistance = this.getDistance(what);
        absDistance -= this.radius;
        absDistance -= what.radius || 0;
        return absDistance;
    };

    Entity.prototype.occupiesPoint = function (point) {
        return util.distance(point, this) <= this.radius;
    };

    Entity.prototype.getXDiff = function (point) {
        if (point instanceof Entity) {
            point = point.position;
        }
        return  point[0] - this.get('position')[0];
    };

    Entity.prototype.getYDiff = function (point) {
        if (point instanceof Entity) {
            point = point.position;
        }
        return  point[1] - this.get('position')[1];
    };

    /**
     * What is the radians I would need to be facing
     * in order to face the given point/entity
     * @param what
     * @returns {*}
     */
    Entity.prototype.getRadiansToFace = function (what) {
        var adjacent = this.getYDiff(what),
            opposite = this.getXDiff(what),
            theta = Math.atan(Math.abs(opposite / adjacent));
        if (opposite > 0) {
            if (adjacent > 0) {
                //Quadrant I : NE
                return util.NorthRadians - theta;
            } else if (adjacent < 0) {
                //Quadrant IV : SE
                return theta + util.SouthRadians;
            } else {
                //Quad I/IV Border : East
                return util.EastRadians;
            }
        } else if (opposite < 0) {
            if (adjacent > 0) {
                //Quadrant II : NW
                return theta + util.NorthRadians;
            } else if (adjacent < 0) {
                //Quadrant III : SW
                return util.SouthRadians - theta;
            } else {
                //Quad II/III border : West
                return util.WestRadians;
            }
        } else {
            if (adjacent > 0) {
                //Quadrant I/II Border : North
                return util.NorthRadians;
            } else if (adjacent < 0) {
                //Quadrant III/IV Border : South
                return util.SouthRadians;
            } else {
                //We're The Same!
                return this.get('facing');
            }
        }
    };

    Entity.prototype.canShove = function (entity) {
        return false;
    };

    Entity.prototype.shove = function (otherEntity, distance, radians) {
        if (!this.canShove(otherEntity)) {
            return;
        }
        otherEntity.position = otherEntity.getPointAtRadianAndDistance(radians, distance);
        //Other Entity should now dislike me now!, at least a little
    };

    Entity.prototype.faceThis = function (what) {
        this.set('facing', this.getRadiansToFace(what));
        this.concentrating = false;
    };

    Entity.prototype.isFacing = function (entity) {
        //console.log(this.getRadianOffset(entity));
        return Math.abs(this.getRadianOffset(entity)) <= this.get('facingTolerance');
    };

    Entity.prototype.getPointAtRadianAndDistance = function (radian, distance) {
        var x, y;
        x = distance * Math.cos(radian);
        y = distance * Math.sin(radian);
        return [this.get('position')[0] + x, this.get('position')[1] + y];
    };

    /**
     * What's the difference between the radians to face the given entity,
     * and the direction that I am already facing?
     * @param otherEntity
     * @returns {*}
     */
    Entity.prototype.getRadianOffset = function (otherEntity) {
        var radiansToFace;
        if (otherEntity.getPosition) {
            radiansToFace = this.getRadiansToFace(otherEntity);
        } else {
            radiansToFace = otherEntity;
        }
        return util.radiansDiff(radiansToFace, this.get('facing'));
    };

    Entity.prototype.canSee = function (otherEntity) {
        if (!(otherEntity instanceof Entity)) {
            return false;
        }
        var distance = this.getInnerDistance(otherEntity);
        if (distance > this.vision.distance) {
            return false;
        }
        return Math.abs(this.getRadianOffset(otherEntity)) <= this.vision.peripheral;
    };

    Entity.prototype.canTouch = function (entity) {
        //return this.getTouchDistance(entity) <= distanceTolerance;//There is an optimized version of this
        var oRadis = entity.radius || 0;
        return Math.pow(this.getXDiff(entity), 2) + Math.pow(this.getYDiff(entity), 2) <= Math.pow(this.radius + oRadis, 2) + distanceTolerance;
    };

    Entity.prototype.canSmell = function (entity) {
        return false;
    };

    Entity.prototype.getTouchDistance = function (entity) {
        return this.getInnerDistance(entity);// - this.reach;
    };

    Entity.prototype.isTooClose = function (entity) {
        return this.getInnerDistance(entity) < (-2/5) * this.radius;
    };

    Entity.prototype.setPosition = function (x, y) {
        this.set('position', [x, y]);
    };

    Entity.prototype.draw = function (board) {
        var ctx = board.getEntityContext();
        ctx.beginPath();
        ctx.arc(board.gameXToCanvasX(this.get('position')[0]), board.gameYToCanvasY(this.get('position')[1]), this.radius * board.pixelsPerMeter, 0, Math.TAU, true);
        if (this.borderColor) {
            ctx.strokeStyle = this.borderColor;
            ctx.stroke();
        }
        if (this.color) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.mass / this.initialMass;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
        ctx.closePath();
        if (this.showBeak) {
            ctx.globalCompositeOperation = 'destination-over';
            ctx.strokeStyle = '#000';
            ctx.fillStyle = '#000';
            ctx.beginPath();
            var fp = this.getPointAtRadianAndDistance(this.get('facing') - (Math.TAU / 4), this.radius);
            ctx.moveTo(board.gameXToCanvasX(fp[0]), board.gameYToCanvasY(fp[1]));
            var bp = this.getPointAtRadianAndDistance(this.get('facing'), this.radius * 4 / 3);
            ctx.lineTo(board.gameXToCanvasX(bp[0]), board.gameYToCanvasY(bp[1]));
            var sp = this.getPointAtRadianAndDistance(this.get('facing') + (Math.TAU / 4), this.radius);
            ctx.lineTo(board.gameXToCanvasX(sp[0]), board.gameYToCanvasY(sp[1]));
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
        if (this.image) {
            var width, height, x, y;
            if (this.widthToHeight > 1) {
                //Taller image
                height = (this.radius * 2) * board.pixelsPerMeter;
                width = height / this.widthToHeight;
                y = board.gameYToCanvasY(this.get('position')[1] + this.radius);
                x = board.gameXToCanvasX(this.get('position')[0] - (this.radius / this.widthToHeight));
            } else {
                //Wider Image
                width = (this.radius * 2) * board.pixelsPerMeter;
                height = width * this.widthToHeight;
                x = board.gameXToCanvasX(this.get('position')[0] - this.radius);
                y = board.gameYToCanvasY(this.get('position')[1] + (this.radius / this.widthToHeight));
            }
            ctx.drawImage(this.image, x, y, width, height);
        }
        if (this.highlighted && this.game.debug) {
            ctx.globalCompositeOperation = 'destination-over';
            ctx.strokeStyle = '#000';
            ctx.fillStyle = '#FF0';
            ctx.beginPath();
            ctx.arc(board.gameXToCanvasX(this.get('position')[0]), board.gameYToCanvasY(this.get('position')[1]), this.radius * board.pixelsPerMeter * 2, 0, Math.TAU, true);
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
            ctx.globalCompositeOperation = 'source-over';
        }
    };

    Entity.Vegetable = (function () {
        function Vegetable() {
            Entity.apply(this, arguments);
            this.attributes.speed.walking = 0;
        }

        Vegetable.prototype = Object.create(Entity.prototype);
        Vegetable.prototype.constructor = Vegetable;

        return Vegetable;
    }());

    Entity.Cabbage = (function () {
        var defaultOptions = {
            radius : 0.38,
            density : 1.5 / ((2/3) * Math.TAU * Math.pow(0.38, 3)),//Default 1.5kg
            borderColor : '#000',
            color : '#AAFFAA'
        };

        defaultOptions.image = new Image();
        defaultOptions.image.src = 'images/bigCabbage2.png';
        defaultOptions.widthToHeight = 1;

        function Cabbage (game, opts) {
            $.extend(true, this, defaultOptions, opts || {});
            this.mass = this.density * ((2/3) * Math.TAU * Math.pow(this.radius, 3));
            Entity.Vegetable.apply(this, arguments);
            this.set('species', 'Cabbage');
        }

        Cabbage.prototype = Object.create(Entity.Vegetable.prototype);
        Cabbage.prototype.constructor = Cabbage;

        return Cabbage;
    }());

    Entity.Animal = (function () {
        var defaultOptions = {
            showBeak : true,
            canMove : true,
            eatsKgPerSecond : 18 / 60,//3kg per minute
            foodInStomach : 0//kg
        };

        function Animal(game, opts) {
            Entity.apply(this, arguments);
            $.extend(true, this, defaultOptions, opts || {});
            this.load();
            this.attributes.speed.walking = 1.7;
        }

        Animal.prototype = Object.create(Entity.prototype);
        Animal.prototype.constructor = Animal;

        Animal.prototype.consume = function (mass, sourceEntity) {
            Entity.prototype.consume.apply(this, arguments);
            this.set('foodInStomach', this.get('foodInStomach') + mass);
        };

        Animal.prototype.canShove = function (entity) {
            return true;
        };

        Animal.prototype.load = function () {
            var self = this;
            this.on('interrupt', function () {
                self.concentrating = false;
            });
        };

        Animal.prototype.draw = function (board) {
            Entity.prototype.draw.apply(this, arguments);
            if (this.game.debug) {
                var ctx = board.getEntityContext(),
                    canvasX = board.gameXToCanvasX(this.get('position')[0]),
                    canvasY = board.gameYToCanvasY(this.get('position')[1]);
                ctx.beginPath();
                var p1 = this.getPointAtRadianAndDistance(this.get('facing') + this.vision.peripheral, this.vision.distance);
                ctx.moveTo(canvasX, canvasY);
                var radian1 = -(this.get('facing') - this.vision.peripheral) + Math.TAU;
                var radian2 = -(this.get('facing') + this.vision.peripheral) + Math.TAU;
                ctx.arc(canvasX, canvasY, this.vision.distance * board.pixelsPerMeter, radian1, radian2, true);
                ctx.closePath();
                ctx.stroke();
                return;
            }
        };

        Animal.prototype.canEat = function (entity) {
            return entity instanceof Entity.Vegetable;
        };

        Animal.prototype.getFoodDesirability = function (entity, minDistance) {
            return minDistance / this.getDistance(entity);
        };

        Animal.prototype.update = function (dt) {
            var self = this,
                entitiesNear = this.game.getEntitiesWithin(this.vision.distance, this);
            this.whatIPerceive = [];
            this.whatIAmTouching = [];
            _.each(entitiesNear, function (entity) {
                var canTouch = self.canTouch(entity);
                if (canTouch || self.canSee(entity) || self.canSmell(entity)) {
                    self.whatIPerceive.push(entity);
                    if (canTouch) {
                        self.whatIAmTouching.push(entity);
                    }
                }
            });
            Entity.prototype.update.apply(this, arguments);
        };

        Animal.prototype.getBestVisibleFood = function () {
            var self = this,
                minDistance,
                food = [];
            _.each(this.whatIPerceive, function (entity) {
                if (self.canEat(entity)) {
                    food.push(entity);
                    minDistance = Math.min(minDistance || self.getDistance(entity), self.getDistance(entity));
                }
            });
            food.sort(function (a, b) {
                var aDesirability = self.getFoodDesirability(a, minDistance),
                    bDesirability = self.getFoodDesirability(b, minDistance);
                if (aDesirability == bDesirability) {
                    return 0;
                }
                return aDesirability < bDesirability ? 1 : -1;
            });
            return food.shift();
        };

        Animal.prototype.getBehavior = function () {
            var self = this;
            if (this.concentrating && this.currentBehavior != Behavior.Panic) {
                return this.currentBehavior;
            }
            this.setDestination(null);
            this.panicReason = '';
            //Priorities:
            //Eating
            //Why can't I do that?
            this.entitiesToStepAwayFrom = [];
            _.each(this.whatIAmTouching, function (entity) {
                if (entity instanceof Animal) {
                    self.entitiesToStepAwayFrom.push(entity);
                }
            });
            var food = this.getBestVisibleFood();
            if (!food) {
                return Behavior.Search.ForFood;
            }
            this.concentrating = true;
            this.listenToOnce(food, 'gone', function () {
                self.concentrating = false;
                self.stopListening(food);
            });
            //food.highlighted = true;
            if (this.getDestination() != food) {
                this.setDestination(food);
                this.listenTo(food, 'interrupt', function () {
                    self.concentrating = false;
                });
            }
            if (!this.isFacing(food)) {
                if (this.canMove) {
                    if (this.isTooClose(food)) {
                        this.concentrating = false;
                        return Behavior.TurnAndBackup;
                    }
                    return Behavior.TurnAndApproach;
                }
                return Behavior.Turn;
            }
            if (!this.canTouch(food)) {
                if (this.canMove) {
                    return Behavior.Approach;
                }
                this.panicReason = 'I can\'t touch it and I can\'t move!';
                return Behavior.Panic;
            }
            if (this.isTooClose(food)) {
                if (this.canMove) {
                    this.concentrating = false;
                    return Behavior.Backup;
                }
                this.panicReason = 'I\'m too close and can\'t move!';
                return Behavior.Panic;
            }
            return Behavior.EatNearestEdible;
        };

        return Animal;
    }());

    Entity.Goat = (function () {
        var defaultOptions = {
            radius : 0.55,
            borderColor : '#000',
            //reach : -0.01,
            color : '#BBBBAA',
            vision : {
                distance : 20,//Meters
                peripheral : Math.TAU / 8//Radians :: 45degrees, so we have a field of vision 90 degrees wide
            }
        };

        defaultOptions.image = new Image();
        defaultOptions.image.src = 'images/bigGoat.png';
        defaultOptions.widthToHeight = (299 / 255);

        function Goat (game, opts) {
            $.extend(true, this, defaultOptions, opts || {});
            Entity.Animal.apply(this, arguments);
            this.attributes.speed.walking = 1;
            this.set('species', 'Goat');
        }

        Goat.prototype = Object.create(Entity.Animal.prototype);
        Goat.prototype.constructor = Goat;

        return Goat;
    }());

    return Entity;
});

