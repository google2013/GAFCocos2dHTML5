(function() {
    gaf.Sprite.WebGLRenderCmd = function(renderable) {
        cc.Sprite.WebGLRenderCmd.call(this, renderable);
        this._defualtShader = cc.shaderCache.programForKey(cc.SHADER_POSITION_TEXTURECOLOR);
        if ("_Shaders" in gaf) this._customShader = gaf._Shaders.Alpha;

        //this._shaderProgram = this._defualtShader;

        this._tintMult = null;
        this._tintOffset = null;
        this._ctxMatrixBody = null;
        this._ctxMatrixAppendix = null;
    };

    var proto = gaf.Sprite.WebGLRenderCmd.prototype = Object.create(cc.Sprite.WebGLRenderCmd.prototype);
    proto.constructor = gaf.Sprite.WebGLRenderCmd;

    proto._identityVec = [1.0, 1.0, 1.0, 1.0];
    proto._zeroVec = [0.0, 0.0, 0.0, 0.0];
    proto._identityMat = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];

    proto._disableCtx = function() {
        this.setShaderProgram(this._defualtShader);
    };

    proto._enableCtx = function() {
        this.setShaderProgram(this._customShader);
    };

    proto._applyCtxState = function(gafObject) {
        var tintMult = gafObject._cascadeColorMult;
        this._tintMult = [
            tintMult.r / 255,
            tintMult.g / 255,
            tintMult.b / 255,
            tintMult.a / 255
        ];

        var tintOffset = gafObject._cascadeColorOffset;
        this._tintOffset = [
            tintOffset.r / 255,
            tintOffset.g / 255,
            tintOffset.b / 255,
            tintOffset.a / 255
        ];

        var filterStack = gafObject._filterStack;
        if (filterStack && filterStack.length > 0 && filterStack[0].type === gaf.EFFECT_COLOR_MATRIX) {
            var m = filterStack[0].colorMatrix;
            this._ctxMatrixBody = [
                m.rr, m.rg, m.rb, m.ra,
                m.gr, m.gg, m.gb, m.ga,
                m.br, m.bg, m.bb, m.ba,
                m.ar, m.ag, m.ab, m.aa
            ];
            this._ctxMatrixAppendix = [
                m.r / 255,
                m.g / 255,
                m.b / 255,
                m.a / 255
            ];
        } else {
            this._ctxMatrixBody = null;
            this._ctxMatrixAppendix = null;
        }
    };

    proto._setUniforms = function() {
        if (this._shaderProgram === this._customShader) {
            this._shaderProgram.use(); {
                this._shaderProgram.setUniformLocationWith4fv(
                    gaf._Uniforms.ColorTransformMult,
                    this._tintMult,
                    1
                );
                this._shaderProgram.setUniformLocationWith4fv(
                    gaf._Uniforms.ColorTransformOffset,
                    this._tintOffset,
                    1
                );
            }

            if (this._ctxMatrixBody && this._ctxMatrixAppendix) {
                this._shaderProgram.setUniformLocationWithMatrix4fv(
                    gaf._Uniforms.ColorMatrixBody,
                    this._ctxMatrixBody,
                    1
                );
                this._shaderProgram.setUniformLocationWith4fv(
                    gaf._Uniforms.ColorMatrixAppendix,
                    this._ctxMatrixAppendix,
                    1
                );
            } else {
                this._shaderProgram.setUniformLocationWithMatrix4fv(
                    gaf._Uniforms.ColorMatrixBody,
                    this._identityMat,
                    1
                );
                this._shaderProgram.setUniformLocationWith4fv(
                    gaf._Uniforms.ColorMatrixAppendix,
                    this._zeroVec,
                    1
                );
            }
        }
    };

    proto.rendering = function(ctx) {
        this._setUniforms();
        // Super call
        cc.Sprite.WebGLRenderCmd.prototype.rendering.call(this, ctx);
    };

    proto._setTextureCoords = function(rect, needConvert) {
        if (needConvert === undefined)
            needConvert = true;
        if (needConvert)
            rect = cc.rectPointsToPixels(rect);

        var node = this._node;
        var tex = node._batchNode ? node.textureAtlas.texture : node._texture;
        if (!tex) {
            return;
        }

        var uvs = this._vertices;
        var atlasWidth = tex.pixelsWidth;
        var atlasHeight = tex.pixelsHeight;

        var left, right, top, bottom, tempSwap;

        switch (node._rotation) {
            case gaf.ROTATED_CCW:
                {
                    if (cc.FIX_ARTIFACTS_BY_STRECHING_TEXEL) {
                        left = (2 * rect.x + 1) / (2 * atlasWidth);
                        right = left + (rect.height * 2 - 2) / (2 * atlasWidth);
                        top = (2 * rect.y + 1) / (2 * atlasHeight);
                        bottom = top + (rect.width * 2 - 2) / (2 * atlasHeight);
                    } else {
                        left = rect.x / atlasWidth;
                        right = (rect.x + rect.height) / atlasWidth;
                        top = rect.y / atlasHeight;
                        bottom = (rect.y + rect.width) / atlasHeight;
                    }

                    if (node._flippedX) {
                        tempSwap = top;
                        top = bottom;
                        bottom = tempSwap;
                    }

                    if (node._flippedY) {
                        tempSwap = left;
                        left = right;
                        right = tempSwap;
                    }

                    uvs[0].u = left; // tl
                    uvs[0].v = bottom; // tl
                    uvs[1].u = right; // bl
                    uvs[1].v = bottom; // bl
                    uvs[2].u = left; // tr
                    uvs[2].v = top; // tr
                    uvs[3].u = right; // br
                    uvs[3].v = top; // br
                }
                break;

            case gaf.ROTATED_CW:
                {
                    if (cc.FIX_ARTIFACTS_BY_STRECHING_TEXEL) {
                        left = (2 * rect.x + 1) / (2 * atlasWidth);
                        right = left + (rect.height * 2 - 2) / (2 * atlasWidth);
                        top = (2 * rect.y + 1) / (2 * atlasHeight);
                        bottom = top + (rect.width * 2 - 2) / (2 * atlasHeight);
                    } else {
                        left = rect.x / atlasWidth;
                        right = (rect.x + rect.height) / atlasWidth;
                        top = rect.y / atlasHeight;
                        bottom = (rect.y + rect.width) / atlasHeight;
                    }

                    if (node._flippedX) {
                        tempSwap = left;
                        left = right;
                        right = tempSwap;
                    }

                    if (node._flippedY) {
                        tempSwap = top;
                        top = bottom;
                        bottom = tempSwap;
                    }

                    uvs[0].u = right; // tl
                    uvs[0].v = top; // tl
                    uvs[1].u = left; // bl
                    uvs[1].v = top; // bl
                    uvs[2].u = right; // tr
                    uvs[2].v = bottom; // tr
                    uvs[3].u = left; // br
                    uvs[3].v = bottom; // br
                }
                break;

            case gaf.ROTATED_NONE:
            default:
                {
                    if (cc.FIX_ARTIFACTS_BY_STRECHING_TEXEL) {
                        left = (2 * rect.x + 1) / (2 * atlasWidth);
                        right = left + (rect.width * 2 - 2) / (2 * atlasWidth);
                        top = (2 * rect.y + 1) / (2 * atlasHeight);
                        bottom = top + (rect.height * 2 - 2) / (2 * atlasHeight);
                    } else {
                        left = rect.x / atlasWidth;
                        right = (rect.x + rect.width) / atlasWidth;
                        top = rect.y / atlasHeight;
                        bottom = (rect.y + rect.height) / atlasHeight;
                    }

                    if (node._flippedX) {
                        cc.swap(left, right);
                        left += right;
                        right = left - right;
                        left -= right;
                    }
                    if (node._flippedY) {
                        top += bottom;
                        bottom = top - bottom;
                        top -= bottom;
                    }

                    uvs[0].u = left; // tl
                    uvs[0].v = top; // tl
                    uvs[1].u = left; // bl
                    uvs[1].v = bottom; // bl
                    uvs[2].u = right; // tr
                    uvs[2].v = top; // tr
                    uvs[3].u = right; // br
                    uvs[3].v = bottom; // br
                }
                break;
        }
    };

})();