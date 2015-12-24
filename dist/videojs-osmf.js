(function(window, videojs, document, undefined){
'use strict';
/*jshint browser:true*/

var Flash = videojs.getComponent('Flash');

var Osmf = videojs.extend(Flash, {
    constructor: function(options, ready){
        var source = options.source;
        var _player = videojs(options.playerId);
        _player.osmf = this;
        options.flashVars = {
            'playerId': options.playerId,
            'readyFunction': 'onReady',
            'eventProxyFunction': 'onEvent',
            'errorEventProxyFunction': 'onError'
        };
        Flash.call(this, options, ready);
        this.firstplay = false;
        this.loadstart = false;
        _player.on('loadeddata', Osmf.onLoadedData);
        _player.on('ended', Osmf.onEnded);
        options.source = source;
    }
});

Osmf.formats = {
    'application/adobe-f4m': 'F4M',
    'application/adobe-f4v': 'F4V',
    'application/dash+xml': 'MPD'
};

Osmf.canPlaySource = function(src){
    var type = src.type.replace(/;.*/, '').toLowerCase();
    return type in Osmf.formats ? 'maybe' : '';
};

Osmf.log_enabled = false;

var api = Osmf.prototype;
var readWrite = ['preload', 'defaultPlaybackRate', 'playbackRate', 'autoplay',
    'loop', 'mediaGroup', 'controller', 'controls', 'volume', 'muted',
    'defaultMuted'];
var readOnly = ['error', 'networkState', 'readyState', 'seeking', 'textTracks',
    'videoWidth', 'startOffsetTime', 'paused', 'played', 'ended', 'streamType',
    'videoTracks', 'audioTracks', 'initialTime', 'videoHeight'];

var createSetter = function(attr){
    var attrUpper = attr.charAt(0).toUpperCase()+attr.slice(1);
    api['set'+attrUpper] = function(val){
        if (!this.el_.vjs_setProperty)
            return;
        return this.el_.vjs_setProperty(attr, val);
    };
};

var createGetter = function(attr){
    api[attr] = function(){
        if (!this.el_.vjs_getProperty)
            return;
        return this.el_.vjs_getProperty(attr);
    };
};

(function(){
    for (var i = 0; i<readWrite.length; i++)
    {
        createGetter(readWrite[i]);
        createSetter(readWrite[i]);
    }
    for (i = 0; i<readOnly.length; i++)
        createGetter(readOnly[i]);
})();

Osmf.prototype.duration = function(){
    return this.el_ ? (this.streamType() == 'live' ? Infinity :
        this.el_.vjs_getProperty('duration')) : 0;
};

Osmf.prototype.play = function(){ this.el_.vjs_play(); };

Osmf.prototype.load = function(){ this.el_.vjs_load(); };

Osmf.prototype.paused = function(){ return this.el_.vjs_paused(); };

Osmf.prototype.pause = function(){ this.el_.vjs_pause(); };

Osmf.prototype.currentTime = function(value){
    if (!value)
        return this.el_.vjs_getProperty('currentTime');
    this.el_.vjs_setProperty('currentTime');
};

Osmf.prototype.streamStatus = function(){ return this.el_.streamStatus(); };

Osmf.isSupported = function(){ return Flash.version()[0]>=10; };

Osmf.onLoadedData = function(){
    var player = this;
    if (player.options_.autoplay)
        player.play();
    else if (player.options_.preload)
    {
        if (player.currentTime())
            player.currentTime(0);
        player.play();
        player.pause();
        player.bigPlayButton.show();
        player.bigPlayButton.one('click', function(){
            player.bigPlayButton.hide(); });
    }
};

Osmf.onEnded = function(){
    if (this.options().loop)
        this.currentTime(0);
    this.pause();
};

Osmf.onReady = function(currentSwf){
    if (Osmf.log_enabled)
        videojs.log('OSMF', 'Ready', currentSwf);
    Flash.onReady(currentSwf);
    var player = document.getElementById(currentSwf).player;
    if (player.currentSrc() && player.currentSrc().length>0)
        player.tech.el_.vjs_src(player.currentSrc());
};

Osmf.onError = function(currentSwf, err){
    var player = document.getElementById(currentSwf).player;
    if (err=='loaderror')
        err = 'srcnotfound';
    if (Osmf.log_enabled)
        videojs.log('OSMF', 'Error', err);
    if (player.tech.options_.reconnectOnError && !player.tech.reconnecting_)
    {
        player.tech.reconnecting_ = true;
        player.trigger("waiting");
        setTimeout(function(){
            player.src(player.currentSrc());
            player.tech.reconnecting_ = false;
            player.error(null);
        }, 5000);
    }
    player.error({code: 4, msg: ""});
};

Osmf.onEvent = function(currentSwf, event, data){
    var player = document.getElementById(currentSwf).player;
    switch (event)
    {
    case 'playing':
        if (player.tech.firstplay===false)
        {
            if (Osmf.log_enabled)
                videojs.log('OSMF', 'Event', currentSwf, 'loadstart');
            player.trigger('loadstart');
            player.tech.loadstart = true;
            if (Osmf.log_enabled)
                videojs.log('OSMF', 'Event', currentSwf, 'firstplay');
            player.trigger('firstplay');
            player.tech.firstplay = true;
        }
        break;
    case 'buffering':
        event = 'waiting';
        break;
    case 'ready':
        event = 'loadeddata';
        break;
    }
    Flash.onEvent(currentSwf, event);
    if (event!=='timeupdate' && Osmf.log_enabled)
        videojs.log('OSMF', 'Event', currentSwf, event);
};

Osmf.prototype.supportsFullScreen = function(){ return false; };

Osmf.prototype.enterFullScreen = function(){ return false; };

videojs.options.osmf = {};
videojs.options.techOrder.push('osmf');
videojs.registerComponent('Osmf', Osmf);

})(window, window.videojs, document);
