package com.hola.events
{
import flash.events.Event;

public class HolaFragmentsHelperEvent extends Event
{
    public static const ERROR: String = "error";

    public static const DEBUG: String = "debug";

    private var _streamName: String;

    private var _fragId: Number;

    private var _message: String;

    public function HolaFragmentsHelperEvent(type: String, bubbles: Boolean = false, cancelable: Boolean = false, streamName: String = '', fragId: Number = NaN, message: String = '')
    {
        super(type, bubbles, cancelable);

        _streamName = streamName;
        _fragId = fragId;
        _message = message;
    }

    public function get streamName(): String
    {
        return _streamName;
    }

    public function get message(): String
    {
        return _message;
    }

    public function get fragId(): Number
    {
        return _fragId;
    }

    override public function clone(): Event
    {
        return new HolaFragmentsHelperEvent(type, bubbles, cancelable, _streamName, _fragId, _message);
    }
}

}
