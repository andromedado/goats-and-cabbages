
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
    proportion : function (a1, min1, max1, min2, max2) {
        return (((a1 - min1) / (max1 - min1)) * (max2 - min2)) + min2;
    },
    hsvToHex : function hsvToHex (h, s, v) {
        var color = HSVtoRGB(h, s, v);
        color.r = Math.round(color.r * 255).toString(16);
        if (color.r.length < 2) {
            color.r = '0' + color.r;
        }
        color.g = Math.round(color.g * 255).toString(16);
        if (color.g.length < 2) {
            color.g = '0' + color.g;
        }
        color.b = Math.round(color.b * 255).toString(16);
        if (color.b.length < 2) {
            color.b = '0' + color.b;
        }
        return'#' + color.r + color.g + color.b;
    },
    mkRandomFn : function (ini) {
        var seed = 0, l;
        ini = String(ini || Math.random());
        l = ini.length;
        for (var i = 0; i < l; i++) {
            seed += Math.tan(ini.charCodeAt(i) + seed);
        }
        return function () {
            var x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
    },
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

function HSVtoRGB (h, s, v) {
    var i, f, p, q, t, color = {r: 0, g: 0, b: 0};
    if (s == 0) {
        color.r = color.g = color.b = v;
        return color;
    }
    h /= 60;
    i = Math.floor(h);
    f = h - i;
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));
    switch (i) {
        case 0:
            color.r = v;
            color.g = t;
            color.b = p;
            break;
        case 1:
            color.r = q;
            color.g = v;
            color.b = p;
            break;
        case 2:
            color.r = p;
            color.g = v;
            color.b = t;
            break;
        case 3:
            color.r = p;
            color.g = q;
            color.b = v;
            break;
        case 4:
            color.r = t;
            color.g = p;
            color.b = v;
            break;
        default:
            color.r = v;
            color.g = p;
            color.b = q;
            break;
    }
    return color;
}

