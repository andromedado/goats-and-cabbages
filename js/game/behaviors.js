

define(['jquery', 'underscore', 'game/util'], function ($, _, util) {
    'use strict';

    var announcePanic = _.throttle(function (me) {
        console.log('I\'m PANICING!!', me);
    }, 1000);

    function Behavior (doFn) {
        this.do = doFn;
    }

    function doAllOfThese (self, dt, behavior/*[, behavior...]*/) {
        var behaviors = Array.prototype.slice.call(arguments, 2),
            leftover;
        _.each(behaviors, function (behavior) {
            var left = behavior.do.call(self, dt);
            leftover = (leftover && Math.min(leftover, left)) || left;
        });
        return leftover;
    }

    Behavior.Wait = new Behavior(function (dt) {
        return 0;//Eat up all time and do nothing
    });

    Behavior.Backup = new Behavior(function (dt) {
        var backupModifier = this.speed.backupModifier || 0.5;
        var canTravelDistance = dt * this.speed.walking * backupModifier;
        this.position = this.getPointAtRadianAndDistance(util.invertRadians(this.facing), canTravelDistance);
        return 0;
    });

    Behavior.Turn = new Behavior(function turn (dt) {
        var diff = this.getRadianOffset(this.destinationEntity),
            canTurn = this.speed.turning * dt;
        if (canTurn >= Math.abs(diff)) {
            this.facing = this.getRadiansToFace(this.destinationEntity);
            this.concentrating = false;
            return dt - (Math.abs(diff) / this.speed.turning);
        }
        this.facing += canTurn * (diff < 0 ? -1 : 1);
        return 0;
    });

    Behavior.TurnAndBackup = new Behavior(function turnAndBackup (dt) {
        return doAllOfThese(this, dt, Behavior.Backup, Behavior.Turn);
    });

    Behavior.HalfSpeedTurn = new Behavior(function halfSpeedTurn (dt) {
        var diff = this.getRadianOffset(this.destinationEntity),
            canTurn = this.speed.turning * dt / 2;
        if (canTurn >= Math.abs(diff)) {
            this.facing = this.getRadiansToFace(this.destinationEntity);
            this.concentrating = false;
            return dt - (Math.abs(diff) / (this.speed.turning / 2));
        }
        this.facing += canTurn * (diff < 0 ? -1 : 1);
        return 0;
    });

    Behavior.TurnAndApproach = new Behavior(function turnAndApproach(dt) {
        return doAllOfThese(this, dt, Behavior.Turn, Behavior.Approach);
    });

    Behavior.Approach = new Behavior(function approach (dt) {
        if (this.speed.walking <= 0) {
            throw {msg : 'invalid walking speed!', what : this};
        }
        var touchDistance = this.getTouchDistance(this.destinationEntity),
            canTravelDistance = dt * this.speed.walking,
            rads = this.getRadiansToFace(this.destinationEntity),
            x, y;
        if (touchDistance < 0) {
            //We're here!
            return 0;
        }
        if (canTravelDistance >= Math.abs(touchDistance)) {
            x = touchDistance * (Math.cos(rads));
            y = touchDistance * (Math.sin(rads));
            this.position = [x + this.position[0], y + this.position[1]];
            this.concentrating = false;
            return dt - (Math.abs(touchDistance) / this.speed.walking);
        }
        x = canTravelDistance * (Math.cos(rads));
        y = canTravelDistance * (Math.sin(rads));
        this.position = [x + this.position[0], y + this.position[1]];
        return 0;
    });

    Behavior.EatNearestEdible = new Behavior(function eatNearestEdible (dt) {
        var canEat = dt * this.eatsKgPerSecond;
        if (canEat >= this.destinationEntity.mass) {
            var willEat = this.destinationEntity.mass;
            this.foodInStomach += willEat;
            this.destinationEntity.mass = 0;
            //this.concentrating = false;//Eater is responsible for listening for `eaten`/`gone`
            this.destinationEntity.trigger('eaten', {by : this});
            return dt - (willEat / this.eatsKgPerSecond)
        }
        this.destinationEntity.mass -= canEat;
        this.foodInStomach += canEat;
        return 0;
    });

    Behavior.Panic = new Behavior(function (dt) {
        //Panic!!
        announcePanic(this);
        return 0;
    });

    Behavior.Search = function (doFn) {
        this._do = doFn;
        this['do'] = function baseSearchDo (dt) {
            return doFn.apply(this, arguments);
        };
        /*
         if (this.performingFor % this.releaseConcentrationAfter > (this.performingFor + dt) % this.releaseConcentrationAfter) {
         this.concentrating = false;
         }
         */
    };

    Behavior.Search.ForFood = new Behavior.Search(function forFood (dt) {
        var clockwise;

        clockwise = this.behaviorSeed > 0.5;
        var atLeastRadians = Math.PI - (Math.TAU / 16);
        var mostRadians = Math.PI + (Math.TAU / 16);
        var flipAtRadians = this.game.randBetween(atLeastRadians, mostRadians, this.behaviorSeed);
        var secondsBeforeFlipping = flipAtRadians / (this.speed.turning / 2);
        var flip = (this.performingFor % secondsBeforeFlipping) != (this.performingFor % (secondsBeforeFlipping * 2));

        if (flip) {
            clockwise = !clockwise;
        }
        var destinationRadians;
        if (clockwise) {
            destinationRadians = this.facing - Math.TAU / 4;
        } else {
            destinationRadians = this.facing + Math.TAU / 4;
        }
        this.destinationEntity = this.getPointAtRadianAndDistance(destinationRadians, this.radius * 5);
        Behavior.HalfSpeedTurn.do.call(this, dt);
        var canTravelDistance = dt * this.speed.walking;
        this.destinationEntity = this.getPointAtRadianAndDistance(this.facing, canTravelDistance * 2 + this.radius + this.reach);
        Behavior.Approach.do.call(this, dt);
        return 0;
    });

    return Behavior;
});

