var gaf = gaf || {};

gaf._stateHasCtx = function(state) {
    // Check for tint color offset
    if (state.hasColorTransform &&
        (state.colorTransform.offset.r > 0 ||
            state.colorTransform.offset.g > 0 ||
            state.colorTransform.offset.b > 0 ||
            state.colorTransform.offset.a > 0)
    ) {
        return true;
    }

    // Check for color transform filter
    if (state.hasEffect) {
        for (var i = 0, total = state.effect.length; i < total; ++i) {
            if (state.effect[i].type === gaf.EFFECT_COLOR_MATRIX)
                return true;
        }
    }
    return false;
};

gaf._gafTransform = function(parentCmd, recursive) {
    var node = this._node,
        pt = parentCmd ? parentCmd._worldTransform : null,
        t = this._transform,
        wt = this._worldTransform; //get the world transform

    if (node._usingNormalizedPosition && node._parent) {
        var conSize = node._parent._contentSize;
        node._position.x = node._normalizedPosition.x * conSize.width;
        node._position.y = node._normalizedPosition.y * conSize.height;
        node._normalizedPositionDirty = false;
    }

    var hasRotation = node._rotationX || node._rotationY;
    var hasSkew = node._skewX || node._skewY;
    var sx = node._scaleX,
        sy = node._scaleY;
    var appX = this._anchorPointInPoints.x,
        appY = this._anchorPointInPoints.y;

    var a = 1,
        b = 0,
        c = 0,
        d = 1;
    if (hasRotation || hasSkew) {
        // position 
        t.tx = node._position.x;
        t.ty = node._position.y;

        // rotation
        if (hasRotation) {
            var rotationRadiansX = node._rotationX * 0.017453292519943295; //0.017453292519943295 = (Math.PI / 180);   for performance
            c = Math.sin(rotationRadiansX);
            d = Math.cos(rotationRadiansX);
            if (node._rotationY === node._rotationX) {
                a = d;
                b = -c;
            } else {
                var rotationRadiansY = node._rotationY * 0.017453292519943295; //0.017453292519943295 = (Math.PI / 180);   for performance
                a = Math.cos(rotationRadiansY);
                b = -Math.sin(rotationRadiansY);
            }
        }

        // scale
        t.a = a *= sx;
        t.b = b *= sx;
        t.c = c *= sy;
        t.d = d *= sy;

        // skew
        if (hasSkew) {
            var skx = Math.tan(node._skewX * Math.PI / 180);
            var sky = Math.tan(node._skewY * Math.PI / 180);
            if (skx === Infinity)
                skx = 99999999;
            if (sky === Infinity)
                sky = 99999999;
            t.a = a + c * sky;
            t.b = b + d * sky;
            t.c = c + a * skx;
            t.d = d + b * skx;
        }

        if (appX || appY) {
            t.tx -= t.a * appX + t.c * appY;
            t.ty -= t.b * appX + t.d * appY;
            // adjust anchorPoint
            if (node._ignoreAnchorPointForPosition) {
                t.tx += appX;
                t.ty += appY;
            }
        }

        cc.affineTransformConcatIn(t, node._additionalTransform);

        if (pt) {
            // cc.AffineTransformConcat is incorrect at get world transform
            wt.a = t.a * pt.a + t.b * pt.c; //a
            wt.b = t.a * pt.b + t.b * pt.d; //b
            wt.c = t.c * pt.a + t.d * pt.c; //c
            wt.d = t.c * pt.b + t.d * pt.d; //d
            wt.tx = pt.a * t.tx + pt.c * t.ty + pt.tx;
            wt.ty = pt.d * t.ty + pt.ty + pt.b * t.tx;
        } else {
            wt.a = t.a;
            wt.b = t.b;
            wt.c = t.c;
            wt.d = t.d;
            wt.tx = t.tx;
            wt.ty = t.ty;
        }
    } else {
        t.a = sx;
        t.b = 0;
        t.c = 0;
        t.d = sy;
        t.tx = node._position.x;
        t.ty = node._position.y;

        if (appX || appY) {
            t.tx -= t.a * appX;
            t.ty -= t.d * appY;
            // adjust anchorPoint
            if (node._ignoreAnchorPointForPosition) {
                t.tx += appX;
                t.ty += appY;
            }
        }

        cc.affineTransformConcatIn(t, node._additionalTransform);

        if (pt) {
            wt.a = t.a * pt.a + t.b * pt.c;
            wt.b = t.a * pt.b + t.b * pt.d;
            wt.c = t.c * pt.a + t.d * pt.c;
            wt.d = t.c * pt.b + t.d * pt.d;
            wt.tx = t.tx * pt.a + t.ty * pt.c + pt.tx;
            wt.ty = t.tx * pt.b + t.ty * pt.d + pt.ty;
        } else {
            wt.a = t.a;
            wt.b = t.b;
            wt.c = t.c;
            wt.d = t.d;
            wt.tx = t.tx;
            wt.ty = t.ty;
        }
    }

    // if (node._additionalTransformDirty) {
    //     this._transform = cc.affineTransformConcat(t, node._additionalTransform);
    // }

    this._updateCurrentRegions && this._updateCurrentRegions();
    this._notifyRegionStatus && this._notifyRegionStatus(cc.Node.CanvasRenderCmd.RegionStatus.DirtyDouble);

    if (recursive) {
        var locChildren = this._node._children;
        if (!locChildren || locChildren.length === 0)
            return;
        var i, len;
        for (i = 0, len = locChildren.length; i < len; i++) {
            locChildren[i]._renderCmd.transform(this, recursive);
        }
    }

    this._cacheDirty = true;
};

gaf.Object = cc.Node.extend({
    _asset: null,
    _className: "GAFObject",
    _id: gaf.IDNONE,
    _gafproto: null,
    _parentTimeLine: null,
    _filterStack: null,
    _cascadeColorMult: null,
    _cascadeColorOffset: null,
    _needsCtx: false,
    _visibleChanged: false,
    _usedAtlasScale: 1,

    // Public methods
    ctor: function(scale) {
        if (arguments.length == 1) {
            this._usedAtlasScale = scale;
        }
        this._super();
        this._cascadeColorMult = cc.color(255, 255, 255, 255);
        this._cascadeColorOffset = cc.color(0, 0, 0, 0);
        this._filterStack = [];
    },

    /**
     * @method setAnimationStartedNextLoopDelegate
     * @param {function(Object)} delegate
     */
    setAnimationStartedNextLoopDelegate: function(delegate) {},

    /**
     * @method setAnimationFinishedPlayDelegate
     * @param {function(Object)} delegate
     */
    setAnimationFinishedPlayDelegate: function(delegate) {},

    /**
     * @method setLooped
     * @param {bool} looped
     */
    setLooped: function(looped) {},

    /**
     * @method getBoundingBoxForCurrentFrame
     * @return {cc.Rect}
     */
    getBoundingBoxForCurrentFrame: function() {
        return null;
    },

    /**
     * @method setFps
     * @param {uint} fps
     */
    setFps: function(fps) {},

    /**
     * @method getObjectByName
     * @param {String} name - name of the object to find
     * @return {gaf.Object}
     */
    getObjectByName: function(name) {
        return null;
    },

    /**
     * @method clearSequence
     */
    clearSequence: function() {},

    /**
     * @method getIsAnimationRunning
     * @return {bool}
     */
    getIsAnimationRunning: function() {
        return false;
    },

    /**
     * @method getSequences
     * @return [string] - list of sequences if has any
     */
    getSequences: function() {
        return [];
    },


    /**
     * @method gotoAndStop
     * @param {uint|String} value - label ot frame number
     * @return {bool}
     */
    gotoAndStop: function(value) {},

    /**
     * @method getStartFrame
     * @param {String} frameLabel
     * @return {uint}
     */
    getStartFrame: function(frameLabel) {
        return gaf.IDNONE;
    },

    /**
     * @method setFramePlayedDelegate
     * @param {function(Object, frame)} delegate
     */
    setFramePlayedDelegate: function(delegate) {},

    /**
     * @method getCurrentFrameIndex
     * @return {uint}
     */
    getCurrentFrameIndex: function() {
        return gaf.IDNONE;
    },

    /**
     * @method getTotalFrameCount
     * @return {uint}
     */
    getTotalFrameCount: function() {
        return 0;
    },

    /**
     * @method start
     */
    start: function() {},

    /**
     * @method stop
     */
    stop: function() {},

    /**
     * @method isDone
     * @return {bool}
     */
    isDone: function() {
        return true;
    },

    /**
     * @method playSequence
     * @param {String} name - name of the sequence to play
     * @param {bool} looped - play looped
     * @param {bool} resume - whether to resume animation if stopped. True by default
     * @return {bool}
     */
    playSequence: function(name, looped, resume) {
        return false;
    },

    /**
     * @method isReversed
     * @return {bool}
     */
    isReversed: function() {
        return false;
    },

    /**
     * @method setSequenceDelegate
     * @param {function(Object, sequenceName)} delegate
     */
    setSequenceDelegate: function(delegate) {},

    /**
     * @method setFrame
     * @param {uint} index
     * @return {bool}
     */
    setFrame: function(index) {
        return false;
    },

    /**
     * @method setControlDelegate
     * @param {function} func
     */
    setControlDelegate: function(func) {},

    /**
     * @method getEndFrame
     * @param {String} frameLabel
     * @return {uint}
     */
    getEndFrame: function(frameLabel) {
        return gaf.IDNONE;
    },

    /**
     * @method pauseAnimation
     */
    pauseAnimation: function() {},

    /**
     * @method gotoAndPlay
     * @param {uint|String} value - label ot frame number
     * @return {bool}
     */
    gotoAndPlay: function(value) {},

    /**
     * @method isLooped
     * @return {bool}
     */
    isLooped: function() {
        return false;
    },

    /**
     * @method resumeAnimation
     */
    resumeAnimation: function() {},

    /**
     * @method setReversed
     * @param {bool} reversed
     */
    setReversed: function(reversed) {},

    /**
     * @method hasSequences
     * @return {bool}
     */
    hasSequences: function() {
        return false;
    },

    /**
     * @method getFps
     * @return {uint}
     */
    getFps: function() {
        return 60;
    },

    /**
     * @method setLocator
     * @param {bool} locator
     * Locator object will not draw itself, but its children will be drawn
     */
    setLocator: function(locator) {},

    setExternalTransform: function(affineTransform) {
        if (!cc.affineTransformEqualToTransform(this._additionalTransform, affineTransform)) {
            this.setAdditionalTransform(affineTransform);
        }
    },

    getExternalTransform: function() {
        return this._additionalTransform;
    },

    setAnimationRunning: function() {},

    ////////////////
    // Private
    ////////////////
    _enableTick: function(val) {},

    _resetState: function() {},

    _updateVisibility: function(state, parent) {
        if (this._visibleChanged) {
            return;
        }
        var alphaOffset = state.hasColorTransform ? state.colorTransform.offset.a : 0;
        this.setOpacity(state.alpha + alphaOffset);
        //return this.isVisible();
    },

    // @Override
    isVisible: function() {
        return this.getOpacity() > 0;
    },

    setVisible: function(value) {
        this._visibleChanged = true;
        if (value)
            this.setOpacity(255);
        else
            this.setOpacity(0);
    },

    // @Override
    visit: function(parentCmd) {
        if (this.isVisible()) {
            this._super(parentCmd);
        }
    },

    _getFilters: function() {
        return null
    },

    _processAnimation: function() {},


    _applyState: function(state, parent) {
        this._applyStateSuper(state, parent);
    },

    _applyStateSuper: function(state, parent) {
        this._needsCtx = parent._needsCtx;
        this._filterStack.length = 0; // clear
        this._parentTimeLine = parent; // only gaf time line can call applyState. Assign it as parent
        if (this._usedAtlasScale != 1) {
            var newMat = cc.clone(state.matrix);
            newMat.tx *= this._usedAtlasScale;
            newMat.ty *= this._usedAtlasScale;
            this.setExternalTransform(newMat); // apply transformations of the state
        } else {
            this.setExternalTransform(state.matrix); // apply transformations of the state
        }
        // Cascade filters
        // TODO: apply more than one filter
        if (state.hasEffect) {
            this._filterStack = this._filterStack.concat(state.effect);
            this._needsCtx = true;
        }
        if (parent._filterStack && parent._filterStack.length > 0) {
            this._filterStack = this._filterStack.concat(parent._filterStack);
        }

        if (this._filterStack.length > 0 && this._filterStack[0].type === gaf.EFFECT_COLOR_MATRIX) {
            this._needsCtx = true;
        }

        // Cascade color transformations

        // If state has a tint, then we should process it
        if (state.hasColorTransform) {
            this._cascadeColorMult.r = state.colorTransform.mult.r * parent._cascadeColorMult.r / 255;
            this._cascadeColorMult.g = state.colorTransform.mult.g * parent._cascadeColorMult.g / 255;
            this._cascadeColorMult.b = state.colorTransform.mult.b * parent._cascadeColorMult.b / 255;
            this._cascadeColorMult.a = state.colorTransform.mult.a * parent._cascadeColorMult.a / 255;

            this._cascadeColorOffset.r = state.colorTransform.offset.r + parent._cascadeColorOffset.r;
            this._cascadeColorOffset.g = state.colorTransform.offset.g + parent._cascadeColorOffset.g;
            this._cascadeColorOffset.b = state.colorTransform.offset.b + parent._cascadeColorOffset.b;
            this._cascadeColorOffset.a = state.colorTransform.offset.a + parent._cascadeColorOffset.a;
        } else {
            this._cascadeColorMult.r = parent._cascadeColorMult.r;
            this._cascadeColorMult.g = parent._cascadeColorMult.g;
            this._cascadeColorMult.b = parent._cascadeColorMult.b;
            this._cascadeColorMult.a = state.alpha * (parent._cascadeColorMult.a / 255);

            this._cascadeColorOffset.r = parent._cascadeColorOffset.r;
            this._cascadeColorOffset.g = parent._cascadeColorOffset.g;
            this._cascadeColorOffset.b = parent._cascadeColorOffset.b;
            this._cascadeColorOffset.a = parent._cascadeColorOffset.a;
        }

        if (this._cascadeColorOffset.r > 0 ||
            this._cascadeColorOffset.g > 0 ||
            this._cascadeColorOffset.b > 0 ||
            this._cascadeColorOffset.a > 0) {
            this._needsCtx = true;
        }
    },

    _initRendererCmd: function() {
        this._renderCmd = cc.renderer.getRenderCmd(this);
        this._renderCmd._visit = this._renderCmd.visit;
        this._renderCmd.transform = gaf._gafTransform;
        var self = this;
        this._renderCmd.visit = function(parentCmd) {
            if (self.isVisible()) {
                this._visit(parentCmd);
            }
        }
    },

    _getNode: function() {
        return this;
    },

    setAnchorPoint: function(point, y) {
        if (y === undefined) {
            this._super(point.x, point.y - 1);
        } else {
            this._super(point, y - 1);
        }
    }

});

gaf.Object._createNullObject = function() {
    var ret = new gaf.Object();
    ret.isVisible = function() {
        return true
    };
    ret.setVisible = function(value) {};
    return ret;
};

var _p = gaf.Object.prototype;
cc.defineGetterSetter(_p, "visible", _p.isVisible, _p.setVisible);