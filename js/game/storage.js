
define(['jquery', 'game/util'], function ($, util) {
    'use strict';
    var version = '0.0.6',
        storageKey = 'gameStorage';

    function Storage (game) {
        var data = JSON.parse(localStorage.getItem(storageKey) || '{}'),
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
        function commit () {
            try {
                localStorage.setItem(storageKey, JSON.stringify(data));
            } catch (e) {
                clearInterval(self.commitInterval);
                console.log(e, 'caused storage failure');
            }
        }
        this.commitInterval = setInterval(commit, 2000);
        this.commit = commit;
        this.clear = function () {
            data = {};
            commit();
        };
    }

    Storage.prototype.mutateKey = function (key) {
        if (!this.prefix) {
            this.prefix = [
                version,
                Math.ceil(this.game.random() * Math.pow(10, 5))
            ].join(':');
        }
        return this.prefix + ':' + key;
    };

    return Storage;
});

