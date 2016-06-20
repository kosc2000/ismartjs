/**
 * Created by Administrator on 2014/6/28.
 */
(function ($) {
    var SELECT_LIST_CLASS = ".s-select-list";
    var SELECT_LIST_ITEM_CLASS = ".s-select-list-item";
    var SELECT_MIRROR_CLASS = ".s-select-mirror";
    var SELECT_PANEL_CLASS = ".s-select-panel";
    function showSelectPanel(selectPanel){
        selectPanel.show();
    }
    function hideSelectPanel(selectPanel){
        selectPanel.hide();
    }
    Smart.widgetExtend({
        id: "select",
        options: "form,ctx:title,ctx:value",
        defaultOptions: {
            form: "id:name,title"
        }
    }, {
        onPrepare: function () {
            this.cache = {};
            this.env = {};
            this.options.form = this.options.form.split(":");
            this.options.form[1] = this.options.form[1].split(",");
            this.cache.dataMap = {};
            /**
             * 如果判断控件的node不是select元素，而且拥有s-select的class，则说明使用html来渲染下拉列表，而不是使用原生的下来列表
             * */
            if (!this.S.node.is("select") && this.S.node.hasClass("s-select")) {
                this.S.node.click(function(e){
                    e.stopPropagation();
                });
                this.env.mode = "html";
                this.env.listContainer = $(SELECT_LIST_CLASS, this.S.node);
                this.env.targetNode = $("input[s-select-role='input']", this.S.node);
                var filterInput = $("input[type='text'].s-select-filter", this.S.node);
                this.env.selectMirror = $(SELECT_MIRROR_CLASS, this.S.node);
                this.env.mirrorSpan = $("span", this.env.selectMirror);
                this.env.selectPanel = $(SELECT_PANEL_CLASS, this.S.node);
                if (this.env.listContainer.size() == 0) {
                    this.env.listContainer = $("<ul />").addClass(SELECT_LIST_CLASS.substring(1)).appendTo(this.env.selectPanel);
                }
                if (this.env.listContainer.is("ul")) {
                    this.env.listItemType = "li";
                } else {
                    this.env.listItemType = "div";
                }

                /**
                 * 绑定事件
                 * */
                var that = this;
                if(this.env.selectMirror.size() == 0){
                    this.env.selectMirror = $("<div />").addClass(SELECT_MIRROR_CLASS.substring(1)).prependTo(this.S.node);
                }
                this.env.selectPanelShow = false;
                this.env.selectMirror.click(function(){
                    if(!that.env.selectPanelShow){
                        $("body").click();
                        showSelectPanel(that.env.selectPanel);
                        filterInput.focus();
                        $("body").one("click", function(){
                            hideSelectPanel(that.env.selectPanel);
                            that.env.selectPanelShow = false;
                        });
                        that.env.selectPanelShow = true;
                    } else {
                        hideSelectPanel(that.env.selectPanel);
                        that.env.selectPanelShow = false;
                    }
                });
                this.env.listContainer.delegate(SELECT_LIST_ITEM_CLASS, "click", function (e) {
                    e.stopPropagation();
                    var node = $(e.currentTarget);
                    that.env.targetNode.val(node.attr("value")).change();
                    that.env.mirrorSpan.html(node.html());
                    hideSelectPanel(that.env.selectPanel);
                    that.env.selectPanelShow = false;
                });
                if (filterInput.size() > 0) {
                    var that = this;
                    var filterTimeout;
                    filterInput.keyup(function (e) {
                        if(filterTimeout){
                            window.clearTimeout(filterTimeout);
                        }
                        var val = this.value;
                        filterTimeout = setTimeout(function(){
                            filterTimeout = 0;
                            if(val == ""){
                                that.env.listContainer.children(":hidden").show();
                                return;
                            }
                            $("*:contains('" + val + "'):hidden", that.env.listContainer).show();
                            $("*:not(:contains('" + val + "'))", that.env.listContainer).hide();
                        }, 300);
                        e.stopPropagation();
                    });
                }
                this.cache.originalOptions = this.env.listContainer.children();
                this.S.data(this.env.listContainer.children(":eq(0)").attr("value"));
            } else {
                this.env.listContainer = this.S.node;
                var originalOptions = this.S.node.children();
                this.cache.originalOptions = originalOptions;
            }
        }
    }, {
        buildSetter: function (datas) {
            datas = datas || [];
            if (!$.isArray(datas)) {
                var _datas = datas;
                datas = [];
                $.each(_datas, function (key, value) {
                    datas.push({title: value, id: key})
                });
            }
            this.widget.select.cache.dataMap = {};
            this.widget.select.env.listContainer.empty();
            this.widget.select.env.listContainer.append(this.widget.select.cache.originalOptions);
            for (var i in datas) {
                this.widget.select.env.listContainer.append(this._createOption(datas[i]));
            }
            if(this.widget.select.env.mode == "html"){
                this.data(this.widget.select.env.listContainer.children(":eq(0)").attr("value"));
            }
        },
        _getOptionData: function(data){
            var value = this.widget.select.options.value ?
                this.widget.select.options.value(data) : data[this.widget.select.options.form[0]];
            var title = this.widget.select.options.title ?
                this.widget.select.options.title(data) : data[this.widget.select.options.form[1][0]];
            this.widget.select.cache.dataMap[value] = data;
            if (!title && this.widget.select.options.form[1].length == 2) {
                title = data[this.widget.select.options.form[1][1]];
            }
            return {value: value, title: title};
        },
        _createOption: function (data) {

            var optionData = this._getOptionData(data);

            var option;
            if (this.widget.select.env.mode == "html") {
                option = $('<' + this.widget.select.env.listItemType + ' value="' + optionData.value + '">' + optionData.title + '</' + this.widget.select.env.listItemType + '>');
                option.addClass(SELECT_LIST_ITEM_CLASS.substring(1));
            } else {
                option = $('<option value="' + optionData.value + '">' + optionData.title + '</option>');
            }
            return option;
        },
        getSelectData: function () {
            var val = this.node.val();
            return this.widget.select.cache.dataMap[val];
        },
        dataSetter: function(data){
            if(this.widget.select.env.mode == "html"){
                var optionNode = $("*[value='"+data+"']", this.widget.select.env.listContainer);
                if(optionNode.size() == 0){
                    data = "";
                    optionNode = $("*[value='"+data+"']", this.widget.select.env.listContainer);
                }
                this.widget.select.env.targetNode.val(data).change();
                this.widget.select.env.mirrorSpan.html(optionNode.html());
                return;
            }
            return this.inherited([data]);
        }
    });
})(jQuery);