
define(['jquery', 'underscore'], function ($, _) {
    'use strict';
    var templates = {},
        allRaw = {},
        allCached = {};

    function noopTpl () {
        return '';
    }

    $(function () {
        $('script.template').each(function (i, E) {
            if (E.id) {
                allRaw[E.id] = E.innerHTML;
                E.parentNode.removeChild(E);
            }
        });
    });

    templates.tpl = function (name/*, data, settings*/) {
        var args;
        if (arguments.length > 1) {
            //No Cache because they are giving arguments for underscore's template function
            args = Array.prototype.slice.call(arguments);
            name = args.shift();
            args.unshift(allRaw[name] || '');
            return _.template.apply(_, args);
        }
        if (allRaw[name] && !allCached[name]) {
            allCached[name] = _.template(allRaw[name], void 0, {variable : 'data'});
            window.comp = allCached[name];
        }
        return allCached[name] || noopTpl;
    };

    return templates;
});

