'use strict';
/*jshint browser:true, es5:true*/
(function(window, videojs, document, undefined){

var Flash = videojs.getComponent('Flash');

videojs.Osmf = Flash.extend({
    init: function(options, ready){
        var source = options.source;
        var _player = videojs(options.playerId);
        _player.osmf = this;
        options.flashVars = {
            'playerId': options.playerId,
            'readyFunction': 'videojs.Osmf.onReady',
            'eventProxyFunction': 'videojs.Osmf.onEvent',
            'errorEventProxyFunction': 'videojs.Osmf.onError'
        };
        Flash.call(this, options, ready);
        this.firstplay = false;
        this.loadstart = false;
        _player.on('loadeddata', videojs.Osmf.onLoadedData);
        _player.on('ended', videojs.Osmf.onEnded);
        options.source = source;
    }
});

videojs.Osmf.formats = {
    'application/adobe-f4m': 'F4M',
    'application/adobe-f4v': 'F4V',
    'application/dash+xml': 'MPD'
};

videojs.Osmf.canPlaySource = function(src){
    var type = src.type.replace(/;.*/, '').toLowerCase();
    return type in videojs.Osmf.formats ? 'maybe' : '';
};

videojs.Osmf.log_enabled = false;

var api = videojs.Osmf.prototype;
var readWrite = ['preload', 'defaultPlaybackRate', 'playbackRate', 'autoplay',
    'loop', 'mediaGroup', 'controller', 'controls', 'volume', 'muted',
    'defaultMuted'];
var readOnly = ['error', 'networkState', 'readyState', 'seeking', 'duration',
    'initialTime', 'startOffsetTime', 'paused', 'played', 'seekable', 'ended',
    'videoTracks', 'audioTracks', 'videoWidth', 'videoHeight', 'textTracks'];

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

videojs.Osmf.prototype.play = function(){
    this.el_.vjs_play();
};

videojs.Osmf.prototype.load = function(){
    this.el_.vjs_load();
};

videojs.Osmf.prototype.paused = function(){
    return this.el_.vjs_paused();
};

videojs.Osmf.prototype.pause = function(){
    this.el_.vjs_pause();
};

videojs.Osmf.prototype.currentTime = function(value){
    if (!value)
        return this.el_.vjs_getProperty('currentTime');
    this.el_.vjs_setProperty('currentTime');
};

videojs.Osmf.prototype.streamStatus = function(){
    return this.el_.streamStatus();
};

videojs.Osmf.isSupported = function(){
    return Flash.version()[0]>=10;
};

videojs.Osmf.onLoadedData = function(){
    var player = this;
    if (player.options().autoplay)
        player.play();
    else if (player.options().preload)
    {
        player.currentTime(0);
        player.play();
        player.pause();
        player.bigPlayButton.show();
        player.bigPlayButton.one('click', function(){
            player.bigPlayButton.hide(); });
    }
};

videojs.Osmf.onEnded = function(){
    if (this.options().loop)
        this.currentTime(0);
    this.pause();
};

videojs.Osmf.onReady = function(currentSwf){
    if (videojs.Osmf.log_enabled)
        videojs.log('OSMF', 'Ready', currentSwf);
    Flash.onReady(currentSwf);
    var player = document.getElementById(currentSwf).player;
    if (player.currentSrc() && player.currentSrc().length>0)
        player.tech.el_.vjs_src(player.currentSrc());
};

videojs.Osmf.onError = function(currentSwf, err){
    var player = document.getElementById(currentSwf).player;
    if (err=='loaderror')
        err = 'srcnotfound';
    if (videojs.Osmf.log_enabled)
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

videojs.Osmf.onEvent = function(currentSwf, event){
    var player = document.getElementById(currentSwf).player;
    if (event==='playing' && player.tech.firstplay===false)
    {
        if (videojs.Osmf.log_enabled)
            videojs.log('OSMF', 'Event', currentSwf, 'loadstart');
        player.trigger('loadstart');
        player.tech.loadstart = true;
        if (videojs.Osmf.log_enabled)
            videojs.log('OSMF', 'Event', currentSwf, 'firstplay');
        player.trigger('firstplay');
        player.tech.firstplay = true;
    }
    if (event=='buffering')
        event = 'waiting';
    else if (event=='ready')
        event = 'loadeddata';
    Flash.onEvent(currentSwf, event);
    if (event!=='timeupdate' && videojs.Osmf.log_enabled)
        videojs.log('OSMF', 'Event', currentSwf, event);
};

videojs.Osmf.prototype.supportsFullScreen = function(){ return false; };

videojs.Osmf.prototype.enterFullScreen = function(){ return false; };

videojs.options.osmf = {};

videojs.options.techOrder.push('osmf');

})(window, window.videojs, document);
