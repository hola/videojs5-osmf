/*
 * Copyright (c) 2014 castLabs GmbH
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

package com.castlabs.dash.boxes {

import flash.utils.ByteArray;

public class TrackFragmentBox extends Box {
    private var _truns:Vector.<TrackFragmentRunBox> = new Vector.<TrackFragmentRunBox>();
    private var _tfhd:TrackFragmentHeaderBox;

    public function TrackFragmentBox(offset:uint, size:uint) {
        super(offset, size);
    }

    public function get truns():Vector.<TrackFragmentRunBox> {
        return _truns;
    }

    public function get tfhd():TrackFragmentHeaderBox {
        return _tfhd;
    }

    override protected function parseChildBox(type:String, offset:uint, size:uint, ba:ByteArray):Boolean {
        if (type == "tfhd") {
            parseTrackFragmentHeaderBox(offset, size, ba);
            return true;
        }

        if (type == "trun") {
            parseTrackFragmentRunBox(offset, size, ba);
            return true;
        }

        return false;
    }

    private function parseTrackFragmentRunBox(offset:uint, size:uint, ba:ByteArray):void {
        var trun:TrackFragmentRunBox = new TrackFragmentRunBox(offset, size);
        trun.parse(ba);
        _truns.push(trun);
    }

    private function parseTrackFragmentHeaderBox(offset:uint, size:uint, ba:ByteArray):void {
        _tfhd = new TrackFragmentHeaderBox(offset, size);
        _tfhd.parse(ba);
    }
}
}