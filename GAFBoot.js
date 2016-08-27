var gaf = gaf || {};
gaf._tmp = gaf._tmp || {};
gaf._initialized = false;

gaf.CCGAFLoader = function(zip)
{
    this.load = function(realUrl, url, item, cb)
    {
        if(!gaf._initialized)
        {
            gaf._setup();
        }
        var loader = new gaf.Loader();
        loader.LoadFile(realUrl, function(data){cb(null, data)}, zip);
    };
};

gaf._setup = function()
{
    gaf._setupShaders();
    gaf._initialized = true;
};

cc.loader.register('.gaf', new gaf.CCGAFLoader(false));
cc.loader.register('.zip', new gaf.CCGAFLoader(true)); // If you do not use zip-packed gaf files - you can just comment this line
