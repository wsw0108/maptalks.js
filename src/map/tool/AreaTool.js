/**
 * 测距鼠标工具类
 * @class maptalks.DrawTool
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z.AreaTool = Z.DistanceTool.extend({

    options:{
        'symbol' : {
            'lineColor':'#000000',//'#474cf8',
            'lineWidth':2,
            'lineOpacity':1,
            'lineDasharray': '',
            'polygonFill' : '#ffffff',
            'polygonOpacity' : 0.5
        }
    },
    /**
     * 初始化绘制工具
     * @constructor
     * @param {Object} options:{mode:Z.Geometry.TYPE_CIRCLE, disableOnDrawEnd: true}
     */
    initialize: function(options) {
        Z.Util.setOptions(this,options);
        this.config('mode',Z.Geometry['TYPE_POLYGON']);
         this.on('enable', this._onEnable, this)
            .on('disable', this._onDisable, this);
        this._measureLayers = [];
    },

    _measure:function(toMeasure) {
        var map = this.getMap();
        var area;
        if (toMeasure instanceof Z.Geometry) {
            area = map.computeGeodesicArea(toMeasure);
        } else if (Z.Util.isArray(toMeasure)) {
            area = Z.GeoUtils.computeArea(toMeasure, map.getProjection());
        }
        this._lastMeasure = area;
        var units;
        if (this.options['language'] === 'zh-CN') {
            units = [' 平方米', ' 平方公里', ' 平方英尺', ' 平方英里'];
        } else {
            units = [' sq.m', ' sq.km', ' sq.ft', ' sq.mi'];
        }
        var content = '';
        if (this.options['metric']) {
            content += area < 1E6 ? area.toFixed(0) + units[0] : (area / 1E6).toFixed(2) + units[1];
        }
        if (this.options['imperial']) {
            area *= 3.2808399
            if (content.length > 0) {
                content += '\n';
            }
            var sqmi = 5280*5280;
            content += area < sqmi ? area.toFixed(0) + units[2] : (area / sqmi).toFixed(2) + units[3];
        }
        return content;
    },

    _msOnDrawVertex:function(param) {
        var geometry = param['geometry'];
        var vertexMarker = new maptalks.Marker(param['coordinate'], {
            'symbol' : this.options['vertexSymbol']
        }).addTo(this._measureMarkerLayer);

        this._lastVertex = vertexMarker;
    },

    _msOnDrawEnd:function(param) {
        this._clearTailMarker();

        var ms = this._measure(param['geometry']);
        var endLabel = new maptalks.Label(ms, param['coordinate'], this.options['labelOptions'])
                        .addTo(this._measureMarkerLayer);
        var size = endLabel.getSize();
        if (!size) {
            size = new Z.Size(10,10);
        }
        this._addClearMarker(param['coordinate'], size['width']);
        var geo = param['geometry'].copy();
        geo._isRenderImmediate(true);
        geo.addTo(this._measureLineLayer);
    }
});
