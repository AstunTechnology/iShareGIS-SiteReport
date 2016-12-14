Astun.JS.Plugins.installDialog('siteReportOutput', function($map, openlayers) {
	var $wrapper = jQuery('<iframe>').addClass('ishare-sitereport');
	$wrapper.clearContent = function() {
		$wrapper[0].contentWindow.document.open();
		$wrapper[0].contentWindow.document.write('');
		$wrapper[0].contentWindow.document.close();
	};
	$wrapper.addContent = function(contentElement) {
		var existingHtml = $wrapper.contents().find('body').html()
		$wrapper[0].contentWindow.document.open();
		$wrapper[0].contentWindow.document.write(existingHtml + jQuery('<div>').append(contentElement).html());
		$wrapper[0].contentWindow.document.close();	
	};
	$wrapper.addCSS = function() {
		var css = 'body {\
			font-family:Arial,sans-serif;\
		}\
		.sitereport-mapcontainer {\
			width:100%;\
			text-align;center;\
		}\
		table {\
			border: 1px solid #666;\
			border-collapse: collapse;\
			margin-bottom: 16px;\
		}\
		td, th {\
			border: 1px solid #666;\
			padding: 8px;\
		}\
		th {\
			background-color: #ccc;\
		}\
		.sitereport-mapcontainer {\
			margin-bottom: 16px;\
			text-align: center;\
		}\
		.sitereport-mapcontainer img {\
			border: 1px solid #666;\
			max-height:600px;\
		}\
		caption {\
			font-weight: bold;\
			margin-bottom: 8px;\
		}\
		#print {\
			position: absolute;\
			top: 0;\
			left: 0;\
		}\
		@media print {\
			table {\
				page-break-before: always;\
			}\
			#print {\
				display:hidden;\
			}\
		}';
		var el = document.createElement('style');
		el.setAttribute('type', 'text/css');
		el.innerHTML = css;
		$wrapper[0].contentWindow.document.head.appendChild(el);
	}
	
	return {
		'uid': 'createSiteReport',
		'content': $wrapper,
		'onOpen': function($box, $inner) {
			$wrapper.clearContent();
		
			// add a random parameter to the request to ensure we aren't getting a cached image
			var imageUrl = openlayers.wrapper.getStaticMapImageUrl() + '&_sitereport=' + parseInt(Math.random() * 100000000, 10);
			var $mapContainer = jQuery('<div>')
				.attr('class', 'sitereport-mapcontainer');
			jQuery('<img>')
				.attr({
					'src': imageUrl
				})
				.appendTo($mapContainer);
			jQuery('<div id="print"><a href="#" onclick="window.print();return false" alt="Print the report"><span>Print</span></a></div>')
				.appendTo($mapContainer);
			$wrapper.addContent($mapContainer);
			$wrapper.addCSS();
			
			var extents = this.createExtentsString(astun.mapWrapper.openlayers.getExtent());
			var activeLayers = [];
			for (var i = 0; i < astun.mapWrapper.layerControl.layers.length; i++) {
				if (astun.mapWrapper.layerControl.layers[i].currentlyVisible)
					activeLayers.push(astun.mapWrapper.layerControl.layers[i]);
			}
			
			if (activeLayers.length === 0)
				return;
				
			for (var i = 0; i < activeLayers.length; i++) {
				astun.mapWrapper.getMapMultiInfo(extents, 5000, 'shapeInfo', this.responseReceived, { 'layers': [activeLayers[i].layerName] });
			}
		},
		'onClose': function($box, $inner) {
		
		},
		'cancelButton': Astun.lang.common.closeLabel,
		'createExtentsString': function(extents) {
			var str = 'POLYGON(([left] [top],[right] [top],[right] [bottom],[left] [bottom],[left] [top]))';
			str = str.replace(/\[left\]/gi, extents.left);
			str = str.replace(/\[top\]/gi, extents.top);
			str = str.replace(/\[right\]/gi, extents.right);
			str = str.replace(/\[bottom\]/gi, extents.bottom);
			return str;
		},
		'responseReceived': function(response, $mapWrapper) {
			if (!response || response === null || response.unexpectedResponse)
				return;
		
			var $table = jQuery("<table>").attr('width', '100%'),
				$caption = jQuery('<caption>' + response[0].properties.layer + '</caption>'),
				$headerRow = jQuery('<tr>');
				
			$table.append($caption);
				
			for (var name in response[0].features[0].properties.fields) {
				jQuery('<th>' + name + '</th>')
					.appendTo($headerRow);
			}
			$table.append($headerRow);
				
			for (var i = 0; i < response[0].features.length; i++) {
				var $dataRow = jQuery('<tr>');
				
				for (var name in response[0].features[i].properties.fields) {
					if (response[0].features[i].properties.links[name] && response[0].features[i].properties.links[name] !== '') {
						jQuery('<td><a href="' + response[0].features[i].properties.links[name] + '">' + response[0].features[i].properties.fields[name] + '</a></td>')
							.appendTo($dataRow);					
					} else {
						jQuery('<td>' + response[0].features[i].properties.fields[name] + '</td>')
							.appendTo($dataRow);
					}
				}
				
				$dataRow.appendTo($table);
			}
			
			$wrapper.addContent($table);
			$wrapper.addCSS();
		}
	};
});

Astun.JS.Plugins.installButton(
	{
		name: 'siteReport',
		type: 'modaldialog',
		dialog: Astun.JS.Plugins.dialogs.siteReportOutput,
		hideOnEmptyDialog: false,
		text: 'Site Report',
		tooltip: 'Activate the Site Report',
		tooltipTitle: 'Site Report'
	}
);
