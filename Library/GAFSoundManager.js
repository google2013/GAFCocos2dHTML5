/**
 * Created by Ivan Avdieienko on 07.09.2015.
 * gaf.soundManager is the singleton object, it provide simple audio APIs for GAF audio playback.
 */
gaf.soundManager =
{
    _soundChannels: {},

    setVolume: function(volume)
    {
        cc.audioEngine.setEffectsVolume(volume);
    },

    stopAllSounds: function()
    {
        cc.audioEngine.stopAllEffects();
    },

    _startSound: function(sound, config)
    {
        cc.assert(sound, "gaf.soundManager._startSound sound param must be not null");

        var id = config.id;
        switch (config.action)
        {
            case gaf.SOUND_ACTION_STOP:
                if (this._soundChannels[id]
                    && this._soundChannels[id] instanceof Array)
                {
                    var i = this._soundChannels[id].length;
                    while (i--)
                    {
                        cc.audioEngine.stopEffect(this._soundChannels[id][i]);
                    }
                    delete this._soundChannels[id];
                }
                break;
            case gaf.SOUND_ACTION_CONTINUE:
                if (this._soundChannels[id])
                {
                    break;
                }
            case gaf.SOUND_ACTION_START:
                this._soundChannels[id] = this._soundChannels[id] || [];
                var loop = config.repeat < 0 || config.repeat > 32000;
                this._soundChannels[id].push(cc.audioEngine.playEffect(sound.source, loop));
                break;
        }
    }
}
