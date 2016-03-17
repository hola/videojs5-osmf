package org.osmf.net.httpstreaming.f4f
{

import com.hola.events.HolaFragmentsHelperEvent;
import org.osmf.elements.f4mClasses.BootstrapInfo;
import org.osmf.utils.URL;
import flash.utils.ByteArray;
import flash.events.EventDispatcher;

[ExcludeClass]
public class HolaFragmentsHelper extends EventDispatcher
{
    public function HolaFragmentsHelper()
    {
        super();
    }

    private function getListOfFragments(afrts: Vector.<AdobeFragmentRunTable>): Array
    {
        var res: Array = [];
        for each (var afrt: AdobeFragmentRunTable in afrts)
        {
            var pairs: Vector.<FragmentDurationPair> = afrt.fragmentDurationPairs;
            var len = pairs.length;
            for (var i: uint = 0; i < len; ++i)
            {
                var pair: FragmentDurationPair = pairs[i];
                if (pair.duration == 0)
                {
                    if (pair.discontinuityIndicator == 0)
                        break;
                    else
                        continue;
                }
                // find next valid pair, even if it's gap/skip, we just need stamp
                var isLast: Boolean = true;
                for (var j: uint = i + 1; j < len; ++j)
                {
                    if (pairs[j].duration != 0 || pairs[j].discontinuityIndicator > 0)
                    {
                        isLast = false;
                        break;
                    }
                }
                if (!isLast)
                {
                    for (var fragmentId: uint = pair.firstFragment, lastFragmentId: uint = pairs[j].firstFragment - 1; fragmentId <= lastFragmentId; fragmentId++)
                        res.push({id: fragmentId, duration: pair.duration});
                }
                else
                {
                    res.push({id: pair.firstFragment, duration: pair.duration});
                    break;
                }
            }
        }
        return res;
    }

    private function getMapOfFragmentsToSegments(asrt: AdobeSegmentRunTable): Object
    {
        var res: Object = {};
        var pairs: Vector.<SegmentFragmentPair> = asrt.segmentFragmentPairs;
        for (var i: uint = 0, len: uint = pairs.length - 1; i < len; i++)
        {
            var pair: SegmentFragmentPair = pairs[i];
            var fragId: uint = pair.fragmentsAccrued + 1;
            for (var segId: uint = pair.firstSegment, lastSegId: uint = pairs[i+1].firstSegment - 1; segId <= lastSegId; segId++)
            {
                for (var lastFragId = fragId + pair.fragmentsPerSegment - 1; fragId <= lastFragId; fragId++)
                    res[fragId] = segId;
            }
        }
        // last pair contains only one segment
        pair = pairs[len];
        for (var fragId: uint = pair.fragmentsAccrued + 1, lastFragId = fragId + pair.fragmentsPerSegment - 1; fragId <= lastFragId; fragId++)
            res[fragId] = pair.firstSegment;
        return res;
    }

    private function getURLForFragment(streamName: String, fragId: Number, segId: Number): String
    {
        // XXX marka; should process streamName that does not conains full URL
        if (streamName.indexOf("http") != 0)
        {
            dispatchEvent(new HolaFragmentsHelperEvent(HolaFragmentsHelperEvent.ERROR, false, false, streamName, fragId, 'does not support streamName with partial URL'));
            return '';
        }
        var tempURL:URL = new URL(streamName);
        tempURL.path += "Seg" + segId + "-Frag" + fragId;
        var requestUrl:String = tempURL.protocol + "://" + tempURL.host;
        if (tempURL.port != null && tempURL.port.length > 0)
            requestUrl += ":" + tempURL.port;
        requestUrl += "/" + tempURL.path;
        if (tempURL.query != null && tempURL.query.length > 0)
            requestUrl += "?" + tempURL.query;
        if (tempURL.fragment != null && tempURL.fragment.length > 0)
            requestUrl += "#" + tempURL.fragment;
        return requestUrl;
    }

    public function getListOfFragmentInfo(streamName: String, bootstrapInfo: BootstrapInfo): Array
    {
        var res: Array = [];
        if (!bootstrapInfo.data)
            return [];
        var data: ByteArray = bootstrapInfo.data;
        var parser: BoxParser = new BoxParser();
        data.position = 0;
        parser.init(data);
        var bi: BoxInfo = parser.getNextBoxInfo();
        if (!bi)
            return [];
        var bootstrapBox: AdobeBootstrapBox = parser.readAdobeBootstrapBox(bi);
        if (!bootstrapBox)
            return [];
        var fragments: Array = getListOfFragments(bootstrapBox.fragmentRunTables);
        var fragmentsMap: Object = getMapOfFragmentsToSegments(bootstrapBox.segmentRunTables[0]);
        for (var i: uint = 0, len: uint = fragments.length; i < len; i++)
        {
            var fragment: Object = fragments[i];
            var fragId = fragment.id;
            if (fragmentsMap[fragId] === undefined)
                dispatchEvent(new HolaFragmentsHelperEvent(HolaFragmentsHelperEvent.ERROR, false, false, streamName, fragId, 'could not map fragment to segment'));
            else
                res.push({url: getURLForFragment(streamName, fragId, fragmentsMap[fragId]), duration: fragment.duration, frag_no: fragId});
        }
        return res;
    }
}

}
