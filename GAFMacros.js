var gaf = gaf || {};

gaf.COMPRESSION_NONE = 0x00474146;
gaf.COMPRESSION_ZIP = 0x00474143;

gaf.IDNONE = 0xffffffff;
gaf.FIRST_FRAME_INDEX = 0;

gaf.EFFECT_DROP_SHADOW = 0;
gaf.EFFECT_BLUR = 1;
gaf.EFFECT_GLOW = 2;
gaf.EFFECT_COLOR_MATRIX = 6;

gaf.ACTION_STOP = 0;
gaf.ACTION_PLAY = 1;
gaf.ACTION_GO_TO_AND_STOP = 2;
gaf.ACTION_GO_TO_AND_PLAY = 3;
gaf.ACTION_DISPATCH_EVENT = 4;

gaf.PI_FRAME = 0;
gaf.PI_EVENT_TYPE = 0;

gaf.TYPE_TEXTURE = 0;
gaf.TYPE_TEXT_FIELD = 1;
gaf.TYPE_TIME_LINE = 2;

gaf.TEXT_ALIGN_LEFT = 0;
gaf.TEXT_ALIGN_RIGHT = 1;
gaf.TEXT_ALIGN_CENTER = 2;
gaf.TEXT_ALIGN_JUSTIFY = 3;
gaf.TEXT_ALIGN_START = 4;
gaf.TEXT_ALIGN_END = 5;

gaf.UNIFORM_BLUR_TEXEL_OFFSET = "u_step";
gaf.UNIFORM_GLOW_TEXEL_OFFSET = "u_step";
gaf.UNIFORM_GLOW_COLOR = "u_glowColor";
gaf.UNIFORM_ALPHA_TINT_MULT = "colorTransformMult";
gaf.UNIFORM_ALPHA_TINT_OFFSET = "colorTransformOffsets";
gaf.UNIFORM_ALPHA_COLOR_MATRIX_BODY = "colorMatrix";
gaf.UNIFORM_ALPHA_COLOR_MATRIX_APPENDIX = "colorMatrix2";

gaf.EVENT_SEQUENCE_START = "gafSequenceStart";
gaf.EVENT_SEQUENCE_END = "gafSequenceEnd";

gaf.ROTATED_NONE = 0;
gaf.ROTATED_CCW = -1;
gaf.ROTATED_CW = 1;

gaf.PLAY_SOUND = "gafPlaySound";
gaf.SOUND_ACTION_STOP     = 1; //stops sound playback
gaf.SOUND_ACTION_START    = 2; //starts playing a new sound
gaf.SOUND_ACTION_CONTINUE = 3; //starts playing a sound if it's not in play
