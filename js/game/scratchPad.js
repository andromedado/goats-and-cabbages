
define(['jquery', 'game/util'], function ($, util) {
    'use strict';

    function ScratchPad (game) {
        var data,
            currentHash;

        function initializeData () {
            data = {};
            currentHash = game.board.getBoundsHash();
        }

        this.value = function (key, callback, ctx) {
            if (!currentHash === game.board.getBoundsHash()) {
                initializeData();
            }
            if (!data.hasOwnProperty(key)) {
                data[key] = callback.call(ctx);
            }
            return data[key];
        };

        initializeData();
    }

    return ScratchPad;
});

