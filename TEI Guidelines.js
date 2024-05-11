{
	"translatorID": "2649e8c4-da5d-4ba7-a083-895fcefa7c08",
	"label": "TEI Guidelines",
	"creator": "Joey Takeda",
	"target": "^https?://(www\\.)?tei-c\\.org/.+/doc/tei-p5-doc/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2024-05-11 20:12:51"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2024 Joey Takeda

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/

function detectWeb(doc, url) {
	if (url.endsWith('index.html')) {
		return "book";
	}
	else {
		return "bookSection";
	}
}

async function doWeb(doc, url) {
	const type = detectWeb(doc, url);
	const GL_TITLE = "TEI P5: Guidelines for Electronic Text Encoding and Interchange";
	if (!(type == "bookSection" || type == "book")) {
		return null;
	}
	const item = parseMetadata(new Z.Item(type), doc, url);
	if (type == "book") {
		item.title = GL_TITLE;
	}
	
	if (type == "bookSection") {
		item.title = text(doc, '.main-content > h2') || text(doc, '.main-content h3.oddSpec');
		item.bookTitle = GL_TITLE;
	}
	
	await item.complete();
	return item;
}

function parseMetadata(item, doc, url) {
	const footer = doc.querySelector('.stdfooter');
	// Version info is linked but not readily identifiable,
	// so we need to find it
	const versionLink = [...footer.querySelectorAll('address a')].find((a) => {
		return /^(\d+\.\d+\.\d+)$/gi.test(ZU.trim(a.innerText));
	});
	const version = ZU.trim(versionLink.innerText);
	// Convert date format
	const date = ZU.strToISO(text(footer, "address > span.date").replace(/(\d)(th|nd|st)\s/gi, "$1 "));
	// The declared root lang is unreliable; we need to use the meta
	const language = attr(doc, "meta[name='DC.Language']", "content").split(/\s+/).pop();

	item.publisher = "TEI Consortium";
	item.date = date;
	item.edition = version;
	item.language = language;
	item.accessDate = new Date().toLocaleDateString();
	item.creators.push({
		lastName: "TEI Consortium",
		creatorType: "editor",
		fieldMode: 1,
	});
	item.attachments.push({
		title: "Snapshot",
		document: doc
	});
	if (url.includes('/release/')) {
		const vaultURL = url.replace('/release/', `/Vault/P5/${version}/`);
		item.extra = vaultURL;
		item.attachments.push({
			title: `TEI Guidelines version ${version} (Vault)`,
			url: vaultURL,
			mimeType: "text/html",
			snapshot: false
		});
	}
	return item;
}


// // The entire guidelines is a book
// function parseFull(doc, url = doc.location.href) {
// 	item.title = "TEI P5: Guidelines for Electronic Text Encoding and Interchange";
// 	item.complete();
// }

// // Consider each section a "Chapter" of a book
// function parseChapter(doc, url = doc.location.href) {
// 	const metadata = createMetadata(doc, url);
// 	const item = Object.assign(new Z.Item("bookSection"), metadata);
// 	Z.debug(item);
	
	
// 	item.complete();
// }

/**
 * Create all metadata for the Guidelines, which can be
 * re-used for the entire thing or for individual sections
 */
/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://tei-c.org/release/doc/tei-p5-doc/en/html/index.html",
		"items": [
			{
				"itemType": "book",
				"title": "TEI P5: Guidelines for Electronic Text Encoding and Interchange",
				"creators": [
					{
						"lastName": "TEI Consortium",
						"creatorType": "editor",
						"fieldMode": 1
					}
				],
				"date": "2023-11-16",
				"edition": "4.7.0",
				"extra": "https://tei-c.org/Vault/P5/4.7.0/doc/tei-p5-doc/en/html/index.html",
				"language": "en",
				"libraryCatalog": "TEI Guidelines",
				"publisher": "TEI Consortium",
				"shortTitle": "TEI P5",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					},
					{
						"title": "TEI Guidelines version 4.7.0 (Vault)",
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
		"url": "https://tei-c.org/release/doc/tei-p5-doc/en/html/ND.html",
		"items": [
			{
				"itemType": "bookSection",
				"title": "13 Names, Dates, People, and Places",
				"creators": [
					{
						"lastName": "TEI Consortium",
						"creatorType": "editor",
						"fieldMode": 1
					}
				],
				"date": "2023-11-16",
				"bookTitle": "TEI P5: Guidelines for Electronic Text Encoding and Interchange",
				"edition": "4.7.0",
				"extra": "https://tei-c.org/Vault/P5/4.7.0/doc/tei-p5-doc/en/html/ND.html",
				"language": "en",
				"libraryCatalog": "TEI Guidelines",
				"publisher": "TEI Consortium",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					},
					{
						"title": "TEI Guidelines version 4.7.0 (Vault)",
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
		"url": "https://tei-c.org/release/doc/tei-p5-doc/en/html/ref-bibl.html",
		"items": [
			{
				"itemType": "bookSection",
				"title": "<bibl>",
				"creators": [
					{
						"lastName": "TEI Consortium",
						"creatorType": "editor",
						"fieldMode": 1
					}
				],
				"date": "2023-11-16",
				"bookTitle": "TEI P5: Guidelines for Electronic Text Encoding and Interchange",
				"edition": "4.7.0",
				"extra": "https://tei-c.org/Vault/P5/4.7.0/doc/tei-p5-doc/en/html/ref-bibl.html",
				"language": "en",
				"libraryCatalog": "TEI Guidelines",
				"publisher": "TEI Consortium",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					},
					{
						"title": "TEI Guidelines version 4.7.0 (Vault)",
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
		"url": "https://tei-c.org/release/doc/tei-p5-doc/es/html/ref-biblStruct.html",
		"items": [
			{
				"itemType": "bookSection",
				"title": "<biblStruct>",
				"creators": [
					{
						"lastName": "TEI Consortium",
						"creatorType": "editor",
						"fieldMode": 1
					}
				],
				"date": "2023-11-16",
				"bookTitle": "TEI P5: Guidelines for Electronic Text Encoding and Interchange",
				"edition": "4.7.0",
				"extra": "https://tei-c.org/Vault/P5/4.7.0/doc/tei-p5-doc/es/html/ref-biblStruct.html",
				"language": "es",
				"libraryCatalog": "TEI Guidelines",
				"publisher": "TEI Consortium",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					},
					{
						"title": "TEI Guidelines version 4.7.0 (Vault)",
						"mimeType": "text/html",
						"snapshot": false
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
