

define(['jquery', 'underscore', 'game/util'], function ($, _, util) {
    'use strict';

    var announcePanic = _.throttle(function (me) {
        console.log('I\'m PANICING!!', me);
    }, 1000);

    function Behavior (doFn) {
        this._doFn = doFn;
    }

    Behavior.prototype['do'] = function (entity, dt) {
        this._doFn(entity, dt);
    };

    function doAllOfThese (self, dt, behavior/*[, behavior...]*/) {
        var behaviors = Array.prototype.slice.call(arguments, 2),
            leftover;
        _.each(behaviors, function (behavior) {
            var left = behavior.do(self, dt);
            leftover = (leftover && Math.min(leftover, left)) || left;
        });
        return leftover;
    }

    Behavior.Wait = new Behavior(function (entity, dt) {
        return 0;//Eat up all time and do nothing
    });

    Behavior.Backup = new Behavior(function (entity, dt) {
        var backupModifier = entity.speed.backupModifier || 0.5;
        var canTravelDistance = dt * entity.get('speed.walking') * backupModifier;
        entity.set('position', entity.getPointAtRadianAndDistance(util.invertRadians(entity.get('facing')), canTravelDistance));
        _.each(entity.getEntitiesToStepAwayFrom(), function (avoidEntity) {
            var radianPos = entity.getRadiansToFace(avoidEntity),
                radialDiff = Math.abs(util.radiansDiff(radianPos, entity.get('facing')));
            if (entity.canShove(avoidEntity)) {
                if (radialDiff > Math.TAU / 4) {
                    //If you're not in front of me
                    var shoveForcePercentage = Math.abs(Math.cos(radialDiff));//1 = FULL Shove, 0 = Nothing
                    entity.shove(avoidEntity, shoveForcePercentage * canTravelDistance, radianPos);
                }
            } else {
                //Ergh.. what to do here?
            }
        });
        return 0;
    });

    Behavior.Turn = new Behavior(function turn (entity, dt) {
        var diff = entity.getRadianOffset(entity.getDestination()),
            canTurn = entity.get('speed.turning') * dt;
        if (canTurn >= Math.abs(diff)) {
            entity.set('facing', entity.getRadiansToFace(entity.getDestination()));
            entity.interrupt();
            return dt - (Math.abs(diff) / entity.get('speed.turning'));
        }
        entity.set('facing', entity.get('facing') + (canTurn * (diff < 0 ? -1 : 1)));
        return 0;
    });

    Behavior.TurnAndBackup = new Behavior(function turnAndBackup (entity, dt) {
        return doAllOfThese(entity, dt, Behavior.Backup, Behavior.Turn);
    });

    Behavior.HalfSpeedTurn = new Behavior(function halfSpeedTurn (entity, dt) {
        var diff = entity.getRadianOffset(entity.getDestination()),
            canTurn = entity.get('speed.turning') * dt / 2;
        if (canTurn >= Math.abs(diff)) {
            entity.set('facing', entity.getRadiansToFace(entity.getDestination()));
            entity.interrupt();
            return dt - (Math.abs(diff) / (entity.get('speed.turning') / 2));
        }
        entity.set('facing', entity.get('facing') + (canTurn * (diff < 0 ? -1 : 1)));
        return 0;
    });

    Behavior.TurnAndApproach = new Behavior(function turnAndApproach(entity, dt) {
        return doAllOfThese(entity, dt, Behavior.Turn, Behavior.Approach);
    });

    Behavior.Approach = new Behavior(function approach (entity, dt) {
        if (!entity.canWalk()) {
            throw {msg : 'invalid walking speed!', what : entity};
        }
        var touchDistance = entity.getTouchDistance(entity.getDestination()),
            canTravelDistance = dt * entity.get('speed.walking'),
            rads = entity.getRadiansToFace(entity.getDestination()),
            x, y;
        if (touchDistance < 0) {
            //We're here!
            return 0;
        }
        if (canTravelDistance >= Math.abs(touchDistance)) {
            x = touchDistance * (Math.cos(rads));
            y = touchDistance * (Math.sin(rads));
            entity.setPosition(x + entity.position[0], y + entity.position[1]);
            entity.interrupt();
            return dt - (Math.abs(touchDistance) / entity.get('speed.walking'));
        }
        x = canTravelDistance * (Math.cos(rads));
        y = canTravelDistance * (Math.sin(rads));
        entity.setPosition(x + entity.position[0], y + entity.position[1]);
        return 0;
    });

    Behavior.EatNearestEdible = new Behavior(function eatNearestEdible (entity, dt) {
        var canEat = dt * entity.get('eatsKgPerSecond');
        var prey = entity.getDestination();
        if (canEat >= prey.mass) {
            var willEat = prey.mass;
            entity.consume(willEat, prey);
            return dt - (willEat / entity.get('eatsKgPerSecond'));
        }
        entity.consume(canEat, prey);
        return 0;
    });

    Behavior.Panic = new Behavior(function (entity, dt) {
        //Panic!!
        announcePanic(entity);
        return 0;
    });

    Behavior.Search = {};

    Behavior.Search.ForFood = new Behavior(function forFood (entity, dt) {
        var clockwise;

        clockwise = entity.behaviorSeed > 0.5;
        var atLeastRadians = Math.PI - (Math.TAU / 16);
        var mostRadians = Math.PI + (Math.TAU / 16);
        var flipAtRadians = entity.game.randBetween(atLeastRadians, mostRadians, entity.behaviorSeed);
        var secondsBeforeFlipping = flipAtRadians / (entity.get('speed.turning') / 2);
        var flip = (entity.performingFor % secondsBeforeFlipping) != (entity.performingFor % (secondsBeforeFlipping * 2));

        if (flip) {
            clockwise = !clockwise;
        }
        var destinationRadians;
        if (clockwise) {
            destinationRadians = entity.get('facing') - Math.TAU / 4;
        } else {
            destinationRadians = entity.get('facing') + Math.TAU / 4;
        }
        entity.setDestination(entity.getPointAtRadianAndDistance(destinationRadians, entity.radius * 5));
        Behavior.HalfSpeedTurn.do(entity, dt);
        var canTravelDistance = dt * entity.get('speed.walking');
        entity.setDestination(entity.getPointAtRadianAndDistance(entity.get('facing'), canTravelDistance * 2 + entity.radius));
        Behavior.Approach.do(entity, dt);
        return 0;
    });

    return Behavior;
});

