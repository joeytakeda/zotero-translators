{
	"translatorID": "50a4cf3f-92ef-4e9f-ab15-815229159b16",
	"label": "National Archives of Australia",
	"creator": "Tim Sherratt, Aurimas Vinckevicius",
	"target": "^https?://recordsearch\\.naa\\.gov\\.au/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2015-06-20 00:29:32"
}

/*
   National Archives of Australia Translator
   Copyright (C) 2011 Tim Sherratt (tim@discontents.com.au, @wragge)

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var multiplesRE = /\/(SeriesListing|ItemsListing|PhotoSearchSearchResults)\.asp/i;
var singleItemRE = /\/(SeriesDetail|ItemDetail|PhotoSearchItemDetail|ViewImage)\.asp/i;
function detectWeb(doc, url) {
	//RecordSearch - items and series - or Photosearch results
	if (multiplesRE.test(url)) {
			return getSearchResults(doc, url, true) ? "multiple" : false;
	} else if (singleItemRE.test(url)) {
			return "manuscript";
	}
}

function doWeb(doc, url) {
	if (detectWeb(doc, url) == "multiple") {
		Zotero.selectItems(getSearchResults(doc, url), function(items) {
			if(!items) {
				return true;
			}
			
			var urls = [];
			for (var i in items) {
				urls.push(i);
			}
			
			ZU.processDocuments(urls, scrape);
		});
	} else {
		scrape(doc, url);
	}
}

function getSearchResults(doc, url, checkOnly) {
	var m = url.match(multiplesRE);
	if (!m) return false;
	
	var items = {},
		found = false;
	switch(m[1].toLowerCase()) {
		case 'serieslisting':
		case 'itemslisting':
			var table = doc.getElementsByClassName('SearchResults')[0];
			if (!table) return false;
			
			var results = ZU.xpath(doc, '//table[@class="SearchResults"]//tr[@class!="header"]');
			for (var i=0; i<results.length; i++) {
				var link = ZU.xpath(results[i], './td/a')[0];
				if (!link) continue;
				var title = link.parentElement.nextElementSibling;
				if (!title) continue;
				
				if (checkOnly) return true;
				found = true;
				items[link.href] = ZU.trimInternal(title.textContent);
			}
		break;
		case 'photosearchsearchresults': // not a typo
			var records = ZU.xpath(doc, '//table[@id="PhotoResultTable"]//td[@class="norm"]');
			for (var i=0; i<records.length; i++) {
				var title = records[i].getElementsByTagName('a')[0];
				if (!title) continue;
				
				if (checkOnly) return true;
				found = true;
				items[title.href] = ZU.trimInternal(title.textContent);
			}
		break;
	}
	
	return found ? items : false;
}

function getHost(url) {
	return url.match(/^http:\/\/[^\/]+/)[0];
}

function scrape(doc, url) {
	var m = url.match(singleItemRE);
	if (!m) return;
	
	var item;
	switch(m[1].toLowerCase()) {
		case 'viewimage':
			item = scrapeImage(doc, url);
		break;
		case 'photosearchitemdetail':
			item = scrapePhoto(doc, url);
		break;
		case 'seriesdetail':
			item = scrapeSeries(doc, url);
		break;
		case 'itemdetail':
			item = scrapeItem(doc, url);
		break;
		default:
			throw new Error("Unknown page type: " + m[1]);
	}
	
	if (item) {
		item.archive = item.libraryCatalog = "National Archives of Australia";
		item.complete();
	}
}

/**
 * Series/Item scraping
 */

function parseItemTable(table) {
	var meta = {},
		rows = table.getElementsByTagName('tr');
	for (var i=0; i<rows.length; i++) {
		var td = rows[i].getElementsByTagName('td');
		if (td.length != 2) continue;
		
		var label = ZU.trimInternal(td[0].textContent).toLowerCase();
		
		var data;
		if (label == 'series note') {
			// grab the full note, instead of the truncation
			var notes = table.ownerDocument.getElementById('notes');
			if (notes && notes.children.length == 2
				&& (notes = notes.getElementsByTagName('pre')[0])
			) {
				data = notes.textContent;
			} else {
				data = ZU.trimInternal(td[1].textContent);
			}
		} else {
			data = ZU.trimInternal(td[1].textContent);
		}
		
		
		if (!label || !data) continue;
		
		meta[label] = data;
	}
	
	return meta;
}

function scrapeItem(doc, url) {
	var meta = parseItemTable(ZU.xpath(doc, '//div[@class="detailsTable"]//tbody')[0]);
	
	var item = new Zotero.Item('manuscript');
	item.title = meta.title;
	item.date = meta['contents date range'];
	item.place = meta.location;
	item.medium = meta['physical format'];
	item.archiveLocation = meta.citation.replace(/^NAA\s*:\s*/i, '');
	
	var barcode = encodeURIComponent(meta['item barcode']);
	/* Seems to expire *
	item.url = getHost(url) + '/SearchNRetrieve/Interface/DetailsReports/ItemDetail.aspx?'
		+ 'Barcode=' + barcode;
	*/
	
	if (meta['item notes']) {
		item.notes.push(meta['item notes']);
	}
	
	// Add link to digital copy if available
	if (ZU.xpath(doc, '//div[contains(@id, "_pnlDigitalCopy")]/a[normalize-space(text())="View digital copy"]').length) {
		item.attachments.push({
			title: "Digital copy at National Archives of Australia",
			url: '/SearchNRetrieve/Interface/ViewImage.aspx?B=' + barcode,
			mimeType: 'text/html',
			snapshot: false
		});
	}
	
	return item;
}

function scrapeSeries(doc, url) {
	var meta = parseItemTable(ZU.xpath(doc, '//div[@class="detailsTable"]//tbody')[0]);
	
	var item = new Zotero.Item('manuscript');
	item.title = meta.title;
	item.date = meta['contents dates'];
	item.medium = meta['predominant physical format'];
	item.abstractNote = meta['series note'];
	
	// Agencies recording into this series
	var agencies = ZU.xpath(doc, '//div[@id="provenanceRecording"]//div[@class="linkagesInfo"]');
	for (var i=0; i<agencies.length; i++) {
		item.creators.push({
			lastName: ZU.trimInternal(agencies[i].textContent),
			creatorType: "author",
			fieldMode: 1
		});
	}
	
	return item;
}

/**
 * ViewImage
 */

function getImageField(doc, label) {
	label = 'lbl' + label;
	var data = doc.getElementById(label);
	if (!data) return '';
	
	return ZU.trimInternal(data.textContent);
}

function scrapeImage(doc, url) {
	var image = doc.getElementById('divImage'),
		singleView = image && image.offsetParent; // check if visble
	
	var total = doc.getElementsByName('hTotalPages')[0],
		page = doc.getElementsByName('hCurrentPage')[0];
	page = page && Number.parseInt(page.value);
	total = total && Number.parseInt(total.value);
	
	var item = new Zotero.Item('manuscript');
	
	item.title = getImageField(doc, 'Title');
	if (singleView && page && total != 1) {
		item.title += ' [' + page + (total ? ' of ' + total : '') + ']';
	}
	
	item.date = getImageField(doc, 'ContentsDate');
	item.archiveLocation = getImageField(doc, 'Series') + ', ' + getImageField(doc, 'ControlSymbol');
	
	var barcode = getImageField(doc, 'Barcode');
	item.url = getHost(url) + '/SearchNRetrieve/Interface/ViewImage.aspx?'
		+ 'B=' + encodeURIComponent(barcode)
		+ (singleView ? '&S=' + page : '');
	
	var imageUrlBase = '/SearchNRetrieve/NAAMedia/ShowImage.aspx?T=P&B=' + encodeURIComponent(barcode);
	// In single view, save current image. In multiples view, save all
	// (unless more than 10, then don't save at all)
	if ((singleView && page) || (!singleView && total && total < 11)) {
		var from = singleView ? page - 1 : 0,
			to = singleView ? page : total,
			includeCount = total != 1;
		
		for (var i=from; i<to; i++) {
			item.attachments.push({
				title: 'Folio'
					+ (total != 1
						? ' ' + (i + 1) + (total ? ' of ' + total : '' )
						: '')
					+ ' [' + item.archiveLocation + ']',
				url: imageUrlBase + '&S=' + page,
				mimeType: 'image/jpeg'
			});
		}
	}
	
	return item;
}

/**
 * PhotoSearch
 */
// Parse "<b>label</b>: data" format into a JS hash table
function parseMeta(td) {
	var meta = {},
		labels = td.getElementsByTagName('b');
	for (var i=0; i<labels.length; i++) {
		if (labels[i].parentElement != td) continue; // Might be something b within metadata
		var label = ZU.trimInternal(labels[i].textContent);
		if (label.charAt(label.length-1) != ':') continue; // Probably not a label either
		label = label.substr(0,label.length-1).trim().toLowerCase();
		if (!label) continue;
		
		var data = labels[i].nextElementSibling;
		if (!data || data.nodeName == 'BR') data = labels[i].nextSibling; // text node
		
		meta[label] = ZU.trimInternal(data.textContent);
	}
	
	return meta;
}

// Parse photo title into separate parts
//
// e.g.  TITLE: Bondi Beach [post office interior, mail sorter at work] May 1940
// CATEGORY: photograph FORMAT: b&w negative QUANTITY: 1 of 4 images
// TYPE: cellulose acetate STATUS: preservation material
function parsePhotoTitle(title) {
	if (!title || !/\bTITLE:\s/.test(title)) return false;
	
	var meta = {},
		partsRE = /\b([A-Z]+)\s*:\s+((?:.(?![A-Z]+\s*:\s))*)/g,
		m;
	while (m = partsRE.exec(title)) {
		meta[m[1].toLowerCase()] = m[2];
	}
	
	return meta;
}

function scrapePhoto(doc, url) {
	table = ZU.xpath(doc, '(//table[@id="PhotoDetailTable"]//tr)[1]/td[last()]')[0];
	if (!table) return;
	
	var meta = parseMeta(table);
	
	var item = new Zotero.Item('manuscript'); // Transition to artwork or similar when fields become available
	
	var titleParts = parsePhotoTitle(meta.title);
	if (titleParts) {
		item.title = titleParts.title;
		item.type = titleParts.category;
		item.medium = titleParts.type;
		item.format = titleParts.format;
	} else {
		item.title = meta.title;
	}
	
	if (!item.type) {
		item.type = 'photograph'
	}
	
	item.date = meta.date;
	item.place = meta.location;
	
	item.url = getHost(url) + "/scripts/PhotoSearchItemDetail.asp?B=" + encodeURIComponent(meta.barcode);
	
	item.archiveLocation = meta['image no.'];
	
	// Save subjects as tags
	if (meta['primary subject']) {
		item.tags.push(meta['primary subject']);
	}
	if (meta['secondary subject']) {
		item.tags.push(meta['secondary subject']);
	}
	
	var image = table.parentElement.getElementsByTagName('img')[0];
	if (image) {
		var url = image.src.replace(/([?&])T=[^&]*(?:&|$)/g, '$1') + '&T=P'; // T=P better quality
		item.attachments.push({
			title: 'Digital image of NAA: ' + item.archiveLocation,
			url: url,
			mimeType: 'image/jpeg' // Seems like that is generally the case
		});
	}
	
	return item;
}/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "http://recordsearch.naa.gov.au/scripts/PhotoSearchItemDetail.asp?B=1646857",
		"items": [
			{
				"itemType": "manuscript",
				"title": "Ford V8 three ton lorry loaded with mail [rear view]",
				"creators": [],
				"date": "1937",
				"archive": "National Archives of Australia",
				"archiveLocation": "C4078, N1005B",
				"libraryCatalog": "National Archives of Australia",
				"manuscriptType": "photograph",
				"place": "Sydney",
				"url": "http://recordsearch.naa.gov.au/scripts/PhotoSearchItemDetail.asp?B=1646857",
				"attachments": [
					{
						"title": "Digital image of NAA: C4078, N1005B",
						"mimeType": "image/jpeg"
					}
				],
				"tags": [
					"Communications",
					"Postal"
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://recordsearch.naa.gov.au/SearchNRetrieve/Interface/ViewImage.aspx?B=12048&S=4",
		"items": [
			{
				"itemType": "manuscript",
				"title": "Carl Gustav Opitz - Naturalization [4 of 7]",
				"creators": [],
				"date": "1911 - 1912",
				"archive": "National Archives of Australia",
				"archiveLocation": "A1, 1911/18393",
				"libraryCatalog": "National Archives of Australia",
				"url": "http://recordsearch.naa.gov.au/SearchNRetrieve/Interface/ViewImage.aspx?B=12048&S=4",
				"attachments": [
					{
						"title": "Folio 4 of 7 [A1, 1911/18393]",
						"mimeType": "image/jpeg"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://recordsearch.naa.gov.au/SearchNRetrieve/Interface/DetailsReports/ItemDetail.aspx?Barcode=8606210&isAv=N",
		"items": [
			{
				"itemType": "manuscript",
				"title": "Prisoner of War/Internee: Wong, Nang Lok; Date of birth - 14 Janaury 1926; Nationality - Chinese",
				"creators": [],
				"date": "1944 - 1944",
				"archive": "National Archives of Australia",
				"archiveLocation": "MP1103/1, PWJAUSA100074",
				"libraryCatalog": "National Archives of Australia",
				"place": "Melbourne",
				"shortTitle": "Prisoner of War/Internee",
				"url": "http://recordsearch.naa.gov.au/SearchNRetrieve/Interface/DetailsReports/ItemDetail.aspx?Barcode=8606223",
				"attachments": [
					{
						"title": "Digital copy at National Archives of Australia",
						"mimeType": "text/html",
						"snapshot": false
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "http://recordsearch.naa.gov.au/SearchNRetrieve/Interface/DetailsReports/ItemDetail.aspx?Barcode=1339624&isAv=N",
		"items": [
			{
				"itemType": "manuscript",
				"title": "El Alamein War Memorial Ceremony - 1954",
				"creators": [],
				"date": "1954 - 1954",
				"archive": "National Archives of Australia",
				"archiveLocation": "A4940, C1007",
				"libraryCatalog": "National Archives of Australia",
				"place": "Canberra",
				"url": "http://recordsearch.naa.gov.au/SearchNRetrieve/Interface/DetailsReports/ItemDetail.aspx?Barcode=1339624",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/