
'use strict';

if (!window.requestAnimationFrame) {
    throw 'You\'re browser is too old for me to deal with';
}

Math.TAU = Math.TAU || Math.PI * 2;
if (!Object.create) {
    Object.create = (function(){
        function F(){}

        return function(o){
            if (arguments.length != 1) {
                throw new Error('Object.create implementation only accepts one parameter.');
            }
            F.prototype = o;
            return new F();
        }
    })();
}

define({
    EastRadians : 0,
    NorthRadians : Math.TAU / 4,
    SouthRadians : Math.TAU * 3 / 4,
    WestRadians : Math.TAU / 2,
    distance : function (point1, point2) {
        if (point1.getPosition) {
            point1 = point1.getPosition();
        }
        if (point2.getPosition) {
            point2 = point2.getPosition();
        }
        try {
            return Math.pow(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2), 0.5);
        } catch (e) {
            debugger;
            return 0;
        }
    },
    pointsAreWithinXMeters : function (point1, point2, meters) {
        if (point1.getPosition) {
            point1 = point1.getPosition();
        }
        if (point2.getPosition) {
            point2 = point2.getPosition();
        }
        return Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[0], 2) <= Math.pow(meters, 2);
    },
    radiansDiff : function (a, b) {
        var diff = a - b;
        while (diff > Math.PI) {
            diff -= Math.TAU;
        }
        while (diff < -Math.PI) {
            diff += Math.TAU;
        }
        return diff;
    },
    invertRadians : function (a) {
        if (a >= Math.PI) {
            return a - Math.PI;
        }
        return a + Math.PI;
    },
    pointWithinBounds : function (point, bounds, exclusive) {
        if (point.getPosition) {
            point = point.getPosition();
        }
        if (exclusive) {
            return point[0] > bounds[0][0] &&
                point[0] < bounds[1][0] &&
                point[1] < bounds[0][1] &&
                point[1] > bounds[1][1];
        }
        return point[0] >= bounds[0][0] &&
            point[0] <= bounds[1][0] &&
            point[1] <= bounds[0][1] &&
            point[1] >= bounds[1][1];
    },
    combineEntropy : function (a, b, n) {
        n = n || 1.0;
        return (a + b) % n;
    }
});

