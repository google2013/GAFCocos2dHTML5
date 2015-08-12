var gaf = gaf || {};

//@Private class
gaf.Loader = function(){

    var readHeaderBegin = function(stream, header){
        header.compression = stream.Uint();
        header.versionMajor = stream.Ubyte();
        header.versionMinor = stream.Ubyte();
        header.fileLength = stream.Uint();
    };

    var readHeaderEndV3 = function(stream, header) {
        header.framesCount = stream.Ushort();
        header.frameSize = stream.Rect();
        header.pivot = stream.Point();
    };

    var readHeaderEndV4 = function(stream, header){
        var scaleCount = stream.Uint();
        header.scaleValues = [];
        for(var i = 0; i < scaleCount; ++i){
            header.scaleValues.push(stream.Float());
        }
        var csfCount = stream.Uint();
        header.csfValues = [];
        for(var i = 0; i < csfCount; ++i){
            header.csfValues.push(stream.Float());
        }
    };

    this.LoadFile = function(filePath, onLoaded){
        var oReq = new XMLHttpRequest();
        oReq.open("GET", filePath, true);
        var self = this;
        oReq.responseType = "arraybuffer";
        oReq.onload = function(oEvent) {
            var gaf_data = new gaf.DataReader(oReq.response);
            var gafFile = self.LoadStream(gaf_data);
            if(onLoaded)
                onLoaded(gafFile);
        };
        oReq.send();
    };

    this.LoadStream = function(stream){
        var header = {};
        readHeaderBegin(stream, header);
        if (header.compression == gaf.COMPRESSION_NONE) // GAF
        {
        }
        else if (header.compression == gaf.COMPRESSION_ZIP) // GAC
        {
            var from = stream.tell();
            var to = stream.maxOffset();
            try
            {
                var compressed = stream.dataRaw.slice(from, to);
            }
            catch(e)
            {
                //Internet Explorer 10 T.T
                if (e.message.indexOf("slice") == e.message.length - 6)
                {
                    compressed = new ArrayBuffer(to - from);
                    var dv = new DataView(compressed);
                    var offset = 0;
                    for(var i = from; i < to; ++i)
                        dv.setUint8(offset++, stream.buf.getUint8(i));
                }
                else
                {
                    throw(e);
                }
            }

            var inflate = new window.Zlib.Inflate(new Uint8Array(compressed));
            var decompressed = inflate.decompress();
            stream = new gaf.DataReader(decompressed.buffer);
        }
        else{
            throw new Error("GAF syntax error.");
        }

        if(header.versionMajor < 4){
            readHeaderEndV3(stream, header);
        }
        else{
            readHeaderEndV4(stream, header);
        }

        var tags = gaf.ReadTags(stream);
        return {
            header: header,
            tags: tags
        };
    };
};
