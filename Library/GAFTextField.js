
gaf.TextField = gaf.Object.extend
({
    // Private variables

    _className: "GAFTextField",
    _gafproto: null,
    _config: null,

    // Public methods

    // Constructor

    ctor: function(gafTextFieldProto, usedScale)
    {
        this._super(usedScale);
        cc.assert(gafTextFieldProto, "Error! Missing mandatory parameter.");
        this._gafproto = gafTextFieldProto;
    },

    // Private methods

    _init: function()
    {
        var alignment = cc.TEXT_ALIGNMENT_LEFT;
        this._config = this._gafproto.getConfig();
        switch (this._config.align)
        {
            case gaf.TEXT_ALIGN_LEFT:
                alignment = cc.TEXT_ALIGNMENT_LEFT;
                break;
            case gaf.TEXT_ALIGN_CENTER:
                alignment = cc.TEXT_ALIGNMENT_CENTER;
                break;
            case gaf.TEXT_ALIGN_RIGHT:
                alignment = cc.TEXT_ALIGNMENT_RIGHT;
                break;
        }
        var fontStyle = this._config.font;

        switch (fontStyle) //cocos js misunderstands the Flash font families
        {
            case "_sans": fontStyle = "Arial"; break;
            case "_serif": fontStyle = "Times new Roman"; break;
            case "_typewriter": fontStyle = "Courier New"; break;
        }
        var size = cc.size(this._config.width, this._config.height);
        var anchor =
        {
            x: 0 + (this._config.pivot.x / size.width),
            y: 1 - (this._config.pivot.y / size.height)
        };
        this._textField = new cc.TextFieldTTF(this._config.text, size, alignment, fontStyle, this._config.size);
        this._textField.setColorSpaceHolder(this._config.color);
        this._textField.setAnchorPoint(anchor);
        this.addChild(this._textField);
    }
});