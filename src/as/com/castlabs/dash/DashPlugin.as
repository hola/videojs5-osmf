/*
 * Copyright (c) 2014 castLabs GmbH
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

package com.castlabs.dash {
import com.castlabs.dash.utils.Console;

import flash.display.Sprite;

import org.osmf.elements.VideoElement;
import org.osmf.media.MediaElement;
import org.osmf.media.MediaResourceBase;
import org.osmf.media.PluginInfo;
import org.osmf.media.URLResource;

public class DashPlugin extends Sprite {
    private var _pluginInfo:PluginInfo;

    public function DashPlugin() {
        super();

        //if (this.root.loaderInfo.parameters.log == "true") {
            Console.getInstance().enable();
        //}

        _pluginInfo = new DashPluginInfo();
    }

    public function get pluginInfo():PluginInfo {
        return _pluginInfo;
    }

    public static function canHandleResource(resource:MediaResourceBase):Boolean {
        return (resource is URLResource) && (resource as URLResource).url.search('.mpd') != -1;
    }

    public static function mediaElementCreationFunction():MediaElement {
        return new VideoElement(null, new DashNetLoader());
    }
}
}
