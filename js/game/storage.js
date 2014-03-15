
define(['jquery', 'game/util'], function ($, util) {
    'use strict';

    function Storage (game) {
        var data = {},
            self = this;

        this.game = game;
        this.set = function (key, value) {
            key = self.mutateKey(key);
            data[key] = JSON.stringify(value);
        };
        this.get = function (key) {
            key = self.mutateKey(key);
            if (data[key]) {
                try {
                    return JSON.parse(data[key]);
                } catch (e) {}
            }
            //else return undefined
        };
    }

    Storage.prototype.mutateKey = function (key) {
        if (!this.prefix) {
            this.prefix = Math.ceil(this.game.random() * Math.pow(10, 5));
        }
        return this.prefix + ':' + key;
    };

    return Storage;
});

