/**
 * Created by Administrator on 2014/6/21.
 */
(function () {

    Smart.widgetExtend({
        id: "resource",
        options: "src,ctx:form,ctx:adapter,ctx:cascade,cascade-key,cascade-e,switch,cascade-data,ignore,fn",
        defaultOptions: {
            'switch': "on",
            'fn': "data"
        }
    }, {
        onPrepare: function () {
            var that = this;
            that.cache.params = {}
        },
        onRender: function () {
            if (this.options.switch == "off") return $.Deferred().resolve();
            if (this.options['cascade']) {
                var that = this;
                this.options['cascade'].on(this.options['cascade-e'] || 'smart-change change', function () {
                    that._cascadeLoad();
                });
                if ('cascade-data' in this.options) {
                    //如果cascade-data存在，则进行初始化调用
                    return this._cascadeLoad(this.options['cascade-data']);
                }
                return $.Deferred().resolve();
            }
            return this._commonLoad();
        },
        onRefresh: function (params, flag) {
            if(flag){
                $.extend(this.cache.params, params|| {})
            } else {
                this.cache.params = params || {}
            }
            return this._load(this.cache.currentSrc || this.options.src);
        },
        _cascadeLoad: function (cascadeData) {
            var cascade = this.options.cascade;
            var val = cascadeData != undefined ? cascadeData : cascade.val()
            if (val == this.options.ignore) {
                this.S[this.options.fn]();
                return $.Deferred().resolve();
            }
            var src = this.options['src'].replace("{val}", val);
            if (this.options['cascade-key']) {
                var params = {};
                params[this.options['cascade-key']] = val;
            }
            return this._load(src, params);
        },
        _commonLoad: function () {
            return this._load(this.options['src'], {});
        },
        _load: function (src, params) {
            this.cache.currentSrc = src;
            var deferred = $.Deferred();
            if (src == undefined) {
                return deferred.resolve();
            }
            var type = "json";
            if (/^.+:.+$/.test(src)) {
                var idx = src.indexOf(":");
                type = src.substring(0, idx);
                src = src.substring(idx + 1);
            }
            var that = this;
            var form = this.options["form"];
            var adapter = this.options["adapter"];
            params = params || {};
            if (form) {
                var formParam = Smart.serializeToObject(form);
                $.extend(formParam, params);
                params = formParam;
            }
            $.extend(params, this.cache.params);
            this.S.get(src, params, type).done(function (rs) {
                if ($.isFunction(adapter)) {
                    rs = adapter(rs);
                }
                that.S[that.options.fn](rs)
                deferred.resolve();
            }).fail(function () {
                deferred.reject();
            });
            return deferred.promise();
        }
    }, {

    });
})();