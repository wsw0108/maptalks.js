Z.Map.include(/** @lends maptalks.Map.prototype */{
    _zoom:function (nextZoomLevel, origin, startScale) {
        if (!this.options['zoomable']) { return; }
        this._originZoomLevel = this.getZoom();
        nextZoomLevel = this._checkZoomLevel(nextZoomLevel);
        this._onZoomStart(nextZoomLevel);
        var zoomOffset;
        if (origin) {
            origin = new Z.Point(this.width / 2, this.height / 2);
            zoomOffset = this._getZoomCenterOffset(nextZoomLevel, origin, startScale);
        }
        this._onZoomEnd(nextZoomLevel, zoomOffset);
    },

    _zoomAnimation:function (nextZoomLevel, origin, startScale) {
        if (!this.options['zoomable']) { return; }
        if (Z.Util.isNil(startScale)) {
            startScale = 1;
        }
        if (Z.Util.isNil(this._originZoomLevel)) {
            this._originZoomLevel = this.getZoom();
        }
        nextZoomLevel = this._checkZoomLevel(nextZoomLevel);
        if (this._originZoomLevel === nextZoomLevel) {
            return;
        }

        this._onZoomStart(nextZoomLevel);
        if (!origin) {
            origin = new Z.Point(this.width / 2, this.height / 2);
        }
        this._startZoomAnimation(startScale, origin, nextZoomLevel);
    },

    _startZoomAnimation:function (startScale, transOrigin, nextZoomLevel) {
        var me = this;
        var resolutions = this._getResolutions();
        var endScale = resolutions[this._originZoomLevel] / resolutions[nextZoomLevel];
        var zoomOffset = this._getZoomCenterOffset(nextZoomLevel, transOrigin, startScale);
        if (zoomOffset.x === 0 && zoomOffset.y === 0) {
            //center is out of maxExtent
            transOrigin = new Z.Point(this.width / 2, this.height / 2);
        }
        var duration = this.options['zoomAnimationDuration'] * Math.abs(endScale - startScale) / Math.abs(endScale - 1);
        this._getRenderer().onZoomStart(
            {
                startScale : startScale,
                endScale : endScale,
                origin : transOrigin,
                duration : duration
            },
            function () {
                me._onZoomEnd(nextZoomLevel, zoomOffset);
            }
        );
    },

    _onZoomStart: function (nextZoomLevel) {
        this._zooming = true;
        this._enablePanAnimation = false;
        /**
          * zoomstart event
          * @event maptalks.Map#zoomstart
          * @type {Object}
          * @property {String} type                    - zoomstart
          * @property {maptalks.Map} target            - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zoomstart', {'from' : this._originZoomLevel, 'to': nextZoomLevel});
    },

    _onZoomEnd:function (nextZoomLevel, zoomOffset) {
        this._zoomLevel = nextZoomLevel;
        if (zoomOffset) {
            this._offsetCenterByPixel(zoomOffset._multi(-1));
        }
        var _originZoomLevel = this._originZoomLevel;
        this._originZoomLevel = nextZoomLevel;
        this._getRenderer().onZoomEnd();
        this._zooming = false;
        /**
          * zoomend event
          * @event maptalks.Map#zoomend
          * @type {Object}
          * @property {String} type                    - zoomend
          * @property {maptalks.Map} target            - the map fires event
          * @property {Number} from                    - zoom level zooming from
          * @property {Number} to                      - zoom level zooming to
          */
        this._fireEvent('zoomend', {'from' : _originZoomLevel, 'to': nextZoomLevel});
        this.checkSize();
    },


    _checkZoomLevel:function (nextZoomLevel) {
        var maxZoom = this.getMaxZoom(),
            minZoom = this.getMinZoom();
        if (nextZoomLevel < minZoom) {
            nextZoomLevel = minZoom;
        }
        if (nextZoomLevel > maxZoom) {
            nextZoomLevel = maxZoom;
        }
        return nextZoomLevel;
    },

    _getZoomCenterOffset:function (nextZoomLevel, origin, startScale) {
        if (Z.Util.isNil(startScale)) {
            startScale = 1;
        }
        var resolutions = this._getResolutions();
        var zScale;
        var zoomOffset;
        if (nextZoomLevel < this._originZoomLevel) {
            zScale = resolutions[nextZoomLevel + 1] / resolutions[nextZoomLevel];
            zoomOffset = new Z.Point(
                    -(origin.x - this.width / 2) * (startScale - zScale),
                    -(origin.y - this.height / 2) * (startScale - zScale)
                );
        } else {
            zScale = resolutions[nextZoomLevel - 1] / resolutions[nextZoomLevel];
            zoomOffset = new Z.Point(
                    (origin.x - this.width / 2) * (zScale - startScale),
                    (origin.y - this.height / 2) * (zScale - startScale)
                );
        }

        var newCenter = this.containerPointToCoordinate(new Z.Point(this.width / 2 + zoomOffset.x, this.height / 2 + zoomOffset.y));
        if (!this._verifyExtent(newCenter)) {
            return new Z.Point(0, 0);
        }

        return zoomOffset;
    },

    _getZoomMillisecs:function () {
        return 600;
    }
});
