/**
 * Created by Programmer on 07.08.2015.
 */
gaf._TextFieldProto = function(asset, textFieldConfig)
{
    this.getAsset = function() {return asset};
    this.getConfig = function(){return textFieldConfig};
    /*
     * Will construct GAFTextField
     */
    this._gafConstruct = function()
    {
        var usedScale = this.getAsset()._usedAtlasScale;
        var ret = new gaf.TextField(this, usedScale);
        ret._init();
        return ret;
    };
}