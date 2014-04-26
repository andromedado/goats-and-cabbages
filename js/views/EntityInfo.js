
define(['jquery', 'underscore', 'templates', 'backbone'], function ($, _, templates, Backbone) {
    'use strict';
    var EntityInfo;

    EntityInfo = Backbone.View.extend({
        initialize : function (options) {
            options = options || {};
            EntityInfo.__super__.initialize.apply(this, arguments);
            this.template = this.template || options.template || templates.tpl('entity-info');
            _.extend(this, options);
        },
        render : function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    return EntityInfo;
});

