
requirejs.config({
    baseUrl : 'js',
    shim: {
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'underscore': {
            exports: '_'
        }
    }
});

require(['underscore', 'game/game'], function (_, Game) {
    var game = new Game({
        seed : 'bc',
        boardEl : $('#game')
    });
    $('#info').on('click', '.command', function () {
        game[this.id]();
    });
    game.randEntities();
    game.draw();
});


