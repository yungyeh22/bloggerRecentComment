// Cache dynamic read, from the most read article

// Recent Comment 3.1 by LVCEHN
// The JS script is used for blogger.com to show  recent comments using Google JSON-IN-SCRIPT callback method. 
// You can use it as an widget in your blog. The little program will display your comments wiht a nice appearance and you can even custom your own appearance.
// For installation, please vist http://lvchen716.googlepages.com/rc30_eng 
// LVCHEN's Recent comment licensed under a Creative Commons Attribution 3.0 License
// This means you can copy, reuse, or distribute it legally. 
// But please notice that, for any reuse or distribution, you must make clear to others the license terms of this work. The best way to do this is with a link to LVCHEN's blog (http://lvchen.blogspot.com or the installation page) .
// Any of the above conditions can be waived if you get permission from the copyright holder, which is me, LVCHEN . You can write me a mail for furture information (lvchen.blog@m2k.com.tw)
// Apart from the remix rights granted under this license, nothing in this license impairs or restricts the author's moral rights.
// Have fun with this grest google blogger widget !!!

/* Change Log:
. Now running without jQuery, more compitable to older browser, and even faster when loading the page (because you have possiblity to not to load jQuery). 
. Add new sorting mode. now you can view comments of a article
. Using "table" element for the header buttons
. Now you can use text for the fold/unfold button, in the case you don't wanna use an image.
. Fixed showAll/closeAll button detection when all comments are close/open.
. Fixed laoding problem when a certain comment was deleted by the author of the comment.
. Many beautiful preset templaces with one click installation. 
. I don't know the limit of comments you can load per page although a looping mechanism can easiy load all comments in one page. However, it is not the purpose of this widget. Instead, you should use a fairly small value for per page loading, and using the paging function to load the next set of comments. I have decided load limit it to 100 per page so preventing the possible error. 
 
*/
// Useful link
// http://code.google.com/apis/gdata/reference.html
// comment JSON: http://lvchen.blogspot.com/feeds/comments/default?start-index=1&max-results=7
// comment JSON with time limit: http://lvchen.blogspot.com/feeds/posts/summary?published-min=2007-04-00&published-max=2007-04-31&max-results=90
// comment JSON unique post: http://lvchen.blogspot.com/feeds/231044572045954265/comments/default?alt=json

//----------- Define Global Variables, can be modified---------------
var rcPreSetting = {
base:{
	  domainName:'lvchen.blogspot.com',
	  perPage: 10,
	  cache:30, // Decreasing this value will increase loading speed. 
	  delay:10 // Set loading delay if you have very very heavy traffic or some lousy IE browser
	},
text:{
	  sortMode:'', // seems useless
	  prevPage:'上一頁',
	  nextPage:'下一頁',
	  footerMsg:'您正在看留言 %range%，共有 %totalNum% 則留言',
	  rangeSymbol: '-',
	  sortByTime:'留言模式',
	  sortByPost:'標題模式',
	  fold:'留了言',
	  unfold:'留言說:',
	  hideAll:'全部隱藏',
	  showAll:'全部展開',
	  loading:'<img src="2-0.gif"/>&nbsp;載入中...',
	  sLoading:'<img src="sloading.gif"/>',
	  goBack:'回上一層',
	  today:'今天',
	  reply:'直接去留言',
	  deleted:'原文已被刪除',
	  noPost:'<p>沒有留言可以顯示</p>',
	  error:'<p>我覺得你的網址打錯了喔！</p>',
	  monthName: []
	},
img: {
	  fold:'rc_0609_f.gif',
	  unfold:'rc_0609_uf.gif',
	  reply:'external.png'
	},
mode:{
	  sort:'time', //time, post, ptime
	  showJumpButton:true,
	  displayIndex: true,
	  date:'%MM/%DD/%YY', // yy: 4dig year. YY:2dig year. mm:2dig month. MM:non-dig/regular dd:2dig day DD: regular.
	  showDeleted: false,
	  authorIsHomepage: true
	},
template:{
	  title:'<a href="%orgLink%">%g_szTitle%</a>',
	  author:'<a href="%link%" title="%timestamp% &#65306; %short_content%">%author%</a>',
	  comment:'%rcAuthorLinkFormat% 於 %rcTitleLinkFormat%%replyImg% %rcSay% &#12300;%content%&#12301; &nbsp;- %timestamp%'
	}
};

//----------- Define Global Variables, should NOT be modified---------------
var rcSetting = {
maxPostsNum:0,					// Max posts number
startIndex : 1,					// find comment from 
commentTotalNum : 0,			// Total comments number
showAllFlag : false,			// Check if the showAll button clicke
outDate:0,
remainClose:0,
ready:false,
pInfo:[],
cInfo:[],
commentFeed: '',
postFeed:''
};

var rcFnc = {};

// Define class for loading json script
rcFnc.dymscript = function ()	{
	this.startIndex = 1;
	this.maxNum = 0;
	this.callback = '';
	this.errorCheck = true;
	this.id = '';
	this.link = '';
};

// ---------------------------------------------------------------
// 這個小程式可以用來尋找 id/class 裡的某個標籤
// A small function to search a id/class in my own convenience
// It's a replacement for jquery's identifier
// id: 要被尋找的元素
// name: 要尋找的標籤名稱
// type: id/class
// ---------------------------------------------------------------
rcFnc.find = function(element,selector)	{
	function elArr(id,name,type) {
		switch (type)
		{
			case '#':
				if (id == '')
					return document.getElementById(name);
				var tags = id.getElementsByTagName('*');
				for (var i = 0 ; i < tags.length ; i++)
				{
					if (tags[i].id == name)
						return tags[i];
				}
				return undefined;
			case '.': // while getAttribute('class') && getElementsByClassName won't work
				var tagAll = (id=='') ? document.getElementsByTagName('*'): id.getElementsByTagName('*');
				var tags = new Array();
				//var reg = new RegExp(name);
				for (var i = 0 ; i < tagAll.length ; i++ )
				{
					var parse = tagAll[i].className.match(/^\S+|\S+|\S+$/g);
					if (parse != null)	{
						for (var j = 0; j < parse.length ; j++)	{
							if (name == parse[j])
								tags.push(tagAll[i]);
						}
					}
				}
				return (tags.length == 0) ? undefined : tags;
			default:
				var tags = (id == '') ? document.getElementsByTagName(type+name) : id.getElementsByTagName(type+name);
				return (tags.length == 0) ? undefined : tags;
		}
	}
	//var parse = selector.match(/^\S+|\S+|\S+$/g);
	return (element!='') ? elArr(element,selector.substr(1,(selector.length-1)),selector.substr(0,1)):elArr('',selector.substr(1,(selector.length-1)),selector.substr(0,1));
};

// ---------------------------------------------------------------
// Quick remove a element by its class/id
// It's a replacement for jquery().remove
// id: 要被尋找的元素
// name: 要尋找的標籤名稱
// type: id/class
// ---------------------------------------------------------------
rcFnc.remove = function(element,selector)	{
	var tags = rcFnc.find(element, selector);
	if (tags)	{
		if (selector.substr(0,1) != '#')
		{
			for (var i = 0 ; i < tags.length ; i++)
			{
				tags[0].parentNode.removeChild(tags[0]);
			}
		}
		else
			tags.parentNode.removeChild(tags);
	}
};

// innerHTML method in betch
rcFnc.html = function(elements, text)	{
	if (elements)	{
		for (var i = 0 ; i < elements.length ; i++)	{
			elements[i].innerHTML = text;
		}
	}
};

rcFnc.fetchJSON = function (lpara)
{
	var eRC = document.getElementById('divrc');
	if (lpara.startIndex != 0) // If coming from titleReCheck, do not show loading message
		rcFnc.find(eRC, '#loadingMsg').style.display = 'inline';
	rcFnc.remove('','#'+lpara.id);
	y_script = document.createElement('script');
	var callbacksrc = lpara.link + '?alt=json-in-script&callback=' + lpara.callback;
	if (lpara.maxNum != 0)
		callbacksrc += '&max-results=' + lpara.maxNum;
	if (lpara.startIndex != 0)
		callbacksrc += '&start-index='+ lpara.startIndex;
	y_script.src = callbacksrc;
	y_script.id = lpara.id;
	y_script.type = 'text/javascript';
	if (lpara.errorCheck)
	{
		try { //I try
			document.documentElement.firstChild.appendChild(y_script); // Load the script and get data from Google Blogger
		}
		catch(e) {}
		// if anything goes wrong, wait for 10 more seconds.
		setTimeout(function (){
			if (!rcSetting.ready) {
				document.getElementById('divrc').innerHTML = rcPreSetting.text.error;
			}
		},10000);
	}
	else
		setTimeout(function (){
			document.documentElement.firstChild.appendChild(y_script);			
		},rcPreSetting.base.delay);
};

// ---------------------------------------------------------------
// Add header buttons, composited with table elements
// ---------------------------------------------------------------
rcFnc.addHeaderButton = function ()	{
	var eRC = document.getElementById('divrc');
	var eHeader = document.createElement('div'); // Create header container
	eHeader.id = 'headerButton';
	//eHeader.style.display = 'none'; // Temporarily hide Header until all DOM objects are ready	
	var myTable = document.createElement('table');
	myTable.style.border = 'none';
	var myTableBody = document.createElement('tbody');
	var myRow = document.createElement('tr');
	for (var i = 0; i < 4 ; i++) {
		myRow.appendChild(document.createElement('td')); // Create 4 cells
	}
	myTableBody.appendChild(myRow);
	myTable.appendChild(myTableBody);	
	// create the "Change Mode" button	
	var rcMode = document.createElement('span'); // Create sorting mode button
	rcMode.id = 'rcMode';
	rcMode.className = 'rcHeaderButton';
	rcMode.onclick = rcFnc.changeMode;
	rcMode.onmouseover = function(){this.style.cursor = 'pointer';};
	rcMode.onmouseout = function(){this.style.cursor = 'default';}; 
	rcMode.innerHTML = (rcPreSetting.mode.sort == 'time') ? rcPreSetting.text.sortByPost : rcPreSetting.text.sortByTime;
	myRow.cells[0].appendChild(rcMode);	
	// create the ShowAll/HideAll button
	var showAll = document.createElement('span'); // Create hide or show all button
	showAll.id = 'showAllButton';
	showAll.className = 'rcHeaderButton';
	showAll.onclick = rcFnc.showOrHideAll;
	showAll.onmouseover = function(){this.style.cursor = 'pointer';};
	showAll.onmouseout = function(){this.style.cursor = 'default';};
	showAll.innerHTML = (rcSetting.showAllFlag) ? rcPreSetting.text.hideAll : rcPreSetting.text.showAll; 
	myRow.cells[1].appendChild(showAll);
	// create the "go back" button
	var goBack = document.createElement('span');
	goBack.id = 'rcGoback';
	goBack.className = 'rcHeaderButton';
	goBack.style.display = 'none';
	goBack.onmouseover = function(){this.style.cursor = 'pointer';};
	goBack.onmouseout = function(){this.style.cursor = 'default';};
	goBack.innerHTML = rcPreSetting.text.goBack;
	myRow.cells[2].appendChild(goBack);	
	// create the loading message
	var loadingMsg = document.createElement('span');
	loadingMsg.id = 'loadingMsg';
	loadingMsg.innerHTML = rcPreSetting.text.loading;
	myRow.cells[3].appendChild(loadingMsg);
	// Finishing	
	eHeader.appendChild(myTable);
	eRC.appendChild(eHeader);
};

rcFnc.titleJSON = function(json)	{
	if (!rcSetting.ready)
		rcSetting.ready = true; // The script is successfully loaded.
	// Extract info and then store into cache	
	if (json.feed.entry)
	{
		var entries = json.feed.entry;
		if (rcSetting.maxPostsNum == 0)
			rcSetting.maxPostsNum = json.feed.openSearch$totalResults.$t*1;
		if (entries.length < rcPreSetting.base.cache && rcPreSetting.mode.sort != 'post')  // not sure it's useful
			rcPreSetting.base.cache = entries.length;
		for (var i = 0 ; i < entries.length ; i++)
		{
			var pTemp = {
				title: '',
				directLink: '',
				replyLink: '',
				replyTitle:'',
				commentLink:''
			};
			var titleIdx = replyIdx = commentIdx = -1;
			var j = 0;
			while (j < entries[i].link.length)
			{
				if (entries[i].link[j].rel == 'alternate')
					titleIdx = j;
				else if (entries[i].link[j].rel == 'replies' && entries[i].link[j].type == 'text/html')
					replyIdx = j;
				else if (entries[i].link[j].rel == 'replies' && entries[i].link[j].type == 'application/atom+xml')
					commentIdx = j;
				if (titleIdx!=-1 && replyIdx!=-1 && commentIdx!=-1 )
					break;
				j++;
			}
			pTemp.title = entries[i].title.$t;
			pTemp.directLink = entries[i].link[titleIdx].href;
			pTemp.commentLink = entries[i].link[commentIdx].href;
			if (replyIdx!=-1) {// This may be empty??
				pTemp.replyLink = entries[i].link[replyIdx].href;
				pTemp.replyTitle = entries[i].link[replyIdx].title.match(/\d+/);
			}
			rcSetting.pInfo.push(pTemp);
		}
	}
	// Fetch comment or dispaly the list of posts
	if (rcPreSetting.mode.sort == 'time')
	{
		var dymloading = new rcFnc.dymscript();
	// 	dymloading.startIndex = 1; // default is 1
		dymloading.maxNum = rcPreSetting.base.perPage;
		dymloading.callback = 'rcFnc.commentJSON';
		dymloading.id = 'jsonComments';
		dymloading.errorCheck = false; // default is true
		dymloading.link = rcSetting.commentFeed;
		rcFnc.fetchJSON(dymloading);
	}
	 else
		rcFnc.displaying('post');	
};

//--------------------------------------------------------------
// Comment JSON feed.
// Several variables conflicted are also solved here.
//--------------------------------------------------------------
rcFnc.commentJSON = function(json)	{
	if (!rcSetting.ready)
		rcSetting.ready = true; // The script is successfully loaded.
	if (json.feed.entry)	//
	{
		var entries = json.feed.entry;
		if (rcSetting.commentTotalNum != json.feed.openSearch$totalResults.$t)
			rcSetting.commentTotalNum = json.feed.openSearch$totalResults.$t*1;   // Retrive total number of comments
		//if (rcPreSetting.base.perPage > rcSetting.commentTotalNum)
		//	rcPreSetting.base.perPage = rcSetting.commentTotalNum;
		for(var i = 0 ; i < entries.length ; i++)
		{
			var comment = entries[i];
			var checkLink = '';
			var rcInfo = {
				authorLink: '',
				orgLink: '',
				authorName: '',
				replyURL: '',
				title: '',
				source: '',
				content: '',
				timestamp: ''
			};
			var linkIdx = 0;
			while (linkIdx < comment.link.length && comment.link[linkIdx].rel != "alternate")
				linkIdx++;
			if (linkIdx <= (comment.link.length-1)) {  // Take care the comeent which was deleted by the comment author.
				rcInfo.authorLink = (rcPreSetting.mode.authorIsHomepage && comment.author[0].uri != undefined) ? comment.author[0].uri.$t : comment.link[linkIdx].href; //author URL
				rcInfo.orgLink = comment.link[linkIdx].href.replace(/(^.+)\?.*$/,'$1'); // Link URL of the Post
			}
			else {
				rcInfo.authorLink = comment.author[0].uri.$t;
				rcInfo.orgLink = comment.link[0].href.replace(/(^.+)\?.*$/,'$1');; // put whatever value here, this value must not the same as "orgLink";
			}				
			if (rcInfo.orgLink != checkLink)  // if the previous comment is from the same post, then we don't have to look for the title of the post		
			{
				if (comment['thr$in-reply-to']!=undefined)	{
					var findIdx = rcFnc.findTitle(rcInfo.orgLink);
					if (findIdx != -1 && linkIdx <= (comment.link.length-1))		{
						rcInfo.title = rcSetting.pInfo[findIdx].title;
						rcInfo.replyURL = rcSetting.pInfo[findIdx].replyLink;
					}
					rcInfo.source = comment['thr$in-reply-to'].source; // source link
					//rcInfo.orgLink = comment['thr$in-reply-to'].href; // self link
				}				
				else	{
					rcInfo.title = rcPreSetting.text.deleted;
				}
				checkLink  = rcInfo.orgLink;
			}
			else
			{
				//rcInfo.orgLink = comment['thr$in-reply-to'].href; // self link
				rcInfo.source = comment['thr$in-reply-to'].source; // source link
				rcInfo.title = rcSetting.pInfo[findIdx].title;				
			}
			if (comment.content == undefined) {	// This will check wheather full or short comment feed
				rcInfo.content = comment.summary.$t;
				rcInfo.content = rcInfo.content.replace(/\u003c/g,'<'); // fix '<' 04/28/2008
				rcInfo.content = rcInfo.content.replace(/\u003e/g,'>'); // fix '>' 04/28/2008
			}
			else
				rcInfo.content = comment.content.$t;   // The complete content of a comment.
			//	content = content.replace(/\$/g,'&#36;'); // fix $1 and $2 being replaced. 9/6/2007
			rcInfo.authorName = comment.author[0].name.$t;  // Author's Name
			rcInfo.timestamp = rcFnc.generateDate(comment.published.$t); //Date
			rcSetting.cInfo.push(rcInfo);
		}
	}
/*	else
	{
		var eRC = document.getElementById('divrc');
		var cBody = rcFnc.find(eRC,'feedItemListDisplay');
		if (cBody)
			cBody.innerHTML = rcPreSetting.text.noPost;
		else
			eRC.innerHTML = rcPreSetting.text.noPost;
	}*/
	//Displaying	
	rcFnc.displaying('comment');
};

// ---------------------------------------------------------------
// --				Display a list of comments/posts.			--
// ---------------------------------------------------------------
rcFnc.displaying = function(type)	{
	var eRC = document.getElementById('divrc');
	var cBody = document.createElement('ul');
	cBody.id = 'feedItemListDisplay';
	switch (type)	{
		case 'comment':
			for(var i = 0 ; i < rcSetting.cInfo.length ; i++)	{	
				if (!rcPreSetting.mode.showDeleted && rcSetting.cInfo[i].source == '') // Fixed 3/31/2012, still need test
					continue;
				cBody.appendChild(rcFnc.createFormat(rcSetting.cInfo[i]));
			}
			if (rcFnc.find(cBody,'.rcNoTitle'))
				rcFnc.titleReCheck();
		break;
		case 'post':
			var loop = (rcSetting.pInfo.length < rcPreSetting.base.perPage) ? rcSetting.pInfo.length : rcPreSetting.base.perPage;
			loop = loop + rcSetting.startIndex - 1;
			for (var i = rcSetting.startIndex-1 ; i < loop ; i++)
			{
				if (rcSetting.startIndex + rcPreSetting.base.perPage > rcSetting.pInfo.length) {
					var	title = rcSetting.pInfo[i-rcSetting.startIndex+1].title; // correct when reading different cache size
					var rTitle = rcSetting.pInfo[i-rcSetting.startIndex+1].replyTitle;
				}
				else {
					var title = rcSetting.pInfo[i].title;
					var rTitle = rcSetting.pInfo[i].replyTitle;
				}
				var cList = document.createElement('li');
				cList.className = 'postList';
				//cList.style.textIndent = '0'; // This may fix textIndent and background overlapping problem. Unless I found a way to know the indentation setting, it's the only way I know.
				var clickScript = 'rcFnc.commentInPost('+ i +')';
				cList.innerHTML = (rTitle!='0')?'<a href="javascript:void(0)" onclick = "'+ clickScript  +'">' + title + '</a> (' + rTitle + ')':title + '&nbsp;(' + rTitle + ')';	
				cBody.appendChild(cList);
			}			
		break;
	}
	if (!rcFnc.find(cBody,'li')) // If there is nothing to display, display error message.
		cBody.innerHTML = '<div id="rcNoPost">' + rcPreSetting.text.noPost + '</div>';
	var old_cBody = rcFnc.find(eRC, '#feedItemListDisplay');
	if (old_cBody)
		eRC.replaceChild(cBody,old_cBody);
	else
		eRC.appendChild(cBody);
	rcFnc.addFooterButton();
	// UI control
	var modeButton = rcFnc.find(eRC,'#rcMode');
	var showAllButton = rcFnc.find(eRC,'#showAllButton');
	var goBack = rcFnc.find(eRC,'#rcGoback');	
	switch (rcPreSetting.mode.sort) {
		case 'time':
			showAllButton.style.display = 'inline';
			goBack.style.display = 'none';
			modeButton.innerHTML = rcPreSetting.text.sortByPost;
		break;
		case 'post':
			showAllButton.style.display = 'none';
			modeButton.innerHTML = rcPreSetting.text.sortByTime;
		break;
		case 'ptime':
			showAllButton.style.display = 'inline';
			goBack.style.display = 'inline';
		break;
	}
	rcFnc.find(eRC, '#loadingMsg').style.display = 'none'; // Hide loading message	
};

// ---------------------------------------------------------------
// A json-in-scrip preparation for thoses comments in an article.
// ---------------------------------------------------------------
rcFnc.commentInPost = function (pIdx)	{
	rcPreSetting.mode.sort = 'ptime';
	rcSetting.startIndex = 1;
	rcSetting.cInfo = [];	
	rcFnc.find(rcFnc.find('','#divrc'),'#rcGoback').onclick = function(){rcFnc.goBack(pIdx);};
	var dymloading = new rcFnc.dymscript();
	dymloading.maxNum = rcPreSetting.base.perPage;
	dymloading.callback = 'rcFnc.commentJSON';
	dymloading.id = 'jsonComments';
	dymloading.errorCheck = false;
	if (pIdx <= rcSetting.pInfo.length)
		dymloading.link = rcSetting.pInfo[pIdx].commentLink;
	else
		dymloading.link = rcSetting.pInfo[pIdx%rcPreSetting.base.perPage].commentLink;
	rcFnc.fetchJSON(dymloading);
};

// ---------------------------------------------------------------
// -- The handler for the "go back" button when in the list mode--
// ---------------------------------------------------------------
rcFnc.goBack = function (pIdx)	{
	rcPreSetting.mode.sort = 'post';
	rcSetting.cInfo = []; // Clear comment cache;
	rcFnc.find(rcFnc.find('','#divrc'),'#rcGoback').style.display = 'none'; // immediate remove the "go back" button	
	rcSetting.commentTotalNum = 0;
	rcSetting.startIndex = Math.floor(pIdx/rcPreSetting.base.perPage)*rcPreSetting.base.perPage+1;
	rcFnc.displaying('post');
};

rcFnc.findTitle = function(orgLink)	{
	var loop = rcSetting.pInfo.length;
	for (var j = 0 ; j < loop ; j++)				// This is main loop to chekc if the title of the link exists.
	{
		if (rcSetting.pInfo[j].directLink == orgLink) // fix wrong checking 3/26/2012, was rcSetting.pInfo[j] == orgLink
			break;
	}
	if (j != loop)
		return j;
	else
		return -1;	
};

// ---------------------------------------------------------------
// --		To generate a easy-to-your-eyes date format			--
// ---------------------------------------------------------------
rcFnc.generateDate = function(bDate)	{
	function isToday (year, month, day)	{
		var timeStr = new Date(), 
			rcDateStr = new Date(parseInt(year),parseInt(month)-1,parseInt(day,10)),
			confirm = false;
		if (rcDateStr.getYear() == timeStr.getYear())	{
			if (rcDateStr.getMonth() == timeStr.getMonth())	{
				if (rcDateStr.getDate() == timeStr.getDate())
					confirm = true;
			}
		}
		return confirm;
	}
	var cFormat = rcPreSetting.mode.date,
		cYear = bDate.substr(0,4),
		cMonth = bDate.substr(5,2),
		cDay = bDate.substr(8,2),
		cTime = bDate.substr(11,5);
	if (rcPreSetting.text.today != '')	{
		if (isToday(cYear, cMonth, cDay))
			return rcPreSetting.text.today + ' ' + cTime;
	}
	cFormat = cFormat.replace(/%yy/,cYear);
	cFormat = cFormat.replace(/%rYY/,parseInt(cYear) - 1911);
	cFormat = cFormat.replace(/%YY/,cYear.substr(2,2));	
	cFormat = cFormat.replace(/%mm/,cMonth);	
	cFormat = cFormat.replace(/%MM/,(rcPreSetting.text.monthName.length > 0) ? rcPreSetting.text.monthName[(parseInt(cMonth,10)-1)]:parseInt(cMonth,10));
	cFormat = cFormat.replace(/%dd/,cDay);
	cFormat = cFormat.replace(/%DD/,parseInt(cDay,10));
	return cFormat;
};

// ---------------------------------------------------------------
// --				Custom format preparation					--
// ---------------------------------------------------------------
rcFnc.createFormat = function (rcInfo)	{
	rcInfo.sContent = rcInfo.content.replace(/<.*?>/g,''); // Remove HTML tags
	if (rcInfo.sContent.length > 40)
		rcInfo.sContent = rcInfo.sContent.substr(0,40)+'...';
	rcInfo.sContent = rcInfo.sContent.replace(/"/gim,"&quot;"); // fix short_content masses up author display
	var parseString = rcPreSetting.template.comment;
	var displayFormat = document.createElement('li');
	displayFormat.style.marginLeft = '-1em'; // save space for the folding button.
	parseString = parseString.replace(/%rcAuthorLinkFormat%/g,'<span class = "rcAuthor"></span>');
	if (rcInfo.title == '')
	{
		parseString = parseString.replace(/%rcTitleLinkFormat%/g,'<span class = "rcPostTitle" style="display:none"></span><span class = "rcNoTitle">'+ rcPreSetting.text.sLoading +'</span>');
		if (rcInfo.source != '')
			parseString = parseString.replace(/%replyImg%/g,'<span class="rcReply" style="display:none"></span>');
		else
			parseString = parseString.replace(/%replyImg%/g,'');
	}
	else
	{	
		parseString = parseString.replace(/%rcTitleLinkFormat%/g,'<span class = "rcPostTitle"></span>');
		parseString = parseString.replace(/%replyImg%/g,'<span class="rcReply"></span>');
	}
	parseString = parseString.replace(/%timestamp%/g,'<span class="rcTimeStamp"></span>');
	parseString = parseString.replace(/%rcSay%/g,'<span class="rcsay"></span>');
	parseString = parseString.replace(/\s*(\S*)%content%(\S*)\s*/g, '<span class="comcontent">$1<span class="iContent"></span>$2</span>');
	displayFormat.innerHTML = parseString;
	// putting authorFormat
	parseString = rcPreSetting.template.author;
	parseString = parseString.replace(/%link%/g,rcInfo.authorLink);
	parseString = parseString.replace(/%author%/g, rcInfo.authorName);
	//parseString = parseString.replace(/%replyURL%/g, rcInfo.replyURL);
	parseString = parseString.replace(/%short_content%/g, rcInfo.sContent);
	parseString = parseString.replace(/%timestamp%/g,rcInfo.timestamp);
	rcFnc.html(rcFnc.find(displayFormat,'.rcAuthor'), parseString);
	// putting titleFormat
	parseString = rcPreSetting.template.title;
	if (rcInfo.source != '')
	{
		parseString = parseString.replace(/%orgLink%/g, rcInfo.orgLink);
		parseString = parseString.replace(/%short_content%/g, rcInfo.sContent);
		parseString = parseString.replace(/%timestamp%/g, rcInfo.timestamp);
		if (rcInfo.title != '')
		{
			parseString = parseString.replace(/%g_szTitle%/g, rcInfo.title);
			parseString = parseString.replace(/%replyURL%/g, rcInfo.replyURL);
		}
	}
	else
		parseString = rcInfo.title;
	rcFnc.html(rcFnc.find(displayFormat,'.rcPostTitle'), parseString);
	rcFnc.html(rcFnc.find(displayFormat,'.rcReply'), (rcPreSetting.img.reply!='') ? '<a href="'+ rcInfo.replyURL +'" target="_blank"><img style = "background:none ;border-style: none" src="'+ rcPreSetting.img.reply +'" title="'+ rcPreSetting.text.reply +'" /></a>' : '<a href="'+ rcInfo.replyURL +'">'+ rcPreSetting.text.reply +'</a>'); // I know, this may be odd. Imagine that you can use rePreSetting.text.reply to display anything you want if you don't want to display a picture.
	// ex: rePreSetting.text.reply = '<img src = "http://imagelink"/>'; is equivalent to  rePreSetting.img.reply = 'http://imagelink';
	rcFnc.html(rcFnc.find(displayFormat,'.rcsay'), (rcSetting.showAllFlag) ? rcPreSetting.text.unfold : rcPreSetting.text.fold);
	rcFnc.html(rcFnc.find(displayFormat,'.rcTimeStamp'), rcInfo.timestamp);
	var theNode  = rcFnc.find(displayFormat,'.iContent');
	if (theNode)	{// folding feature is used when full content exists.
		displayFormat.style.listStyle = 'none';
		displayFormat.style.background = 'none';
		var lFold = document.createElement('span');
		lFold.className = 'rcfold';		
		//lFold.style.marginRight = '0.3em';
		// Checking if an image file is provided for folding and unfolding
		var imageTest = /\.(jp?g|png|gif)/i;
		// Check folding status, and put the proper image or text
		if (rcSetting.showAllFlag) {
			if (imageTest.test(rcPreSetting.img.unfold)) {
				lFold.innerHTML = '&nbsp;&nbsp;&nbsp;'; // These empty spaces are very important to provide clickable function
				lFold.style.background = 'url('+rcPreSetting.img.unfold+') left center no-repeat';
			}
			else
				lFold.innerHTML = rcPreSetting.img.unfold;
		}
		else {
			if (imageTest.test(rcPreSetting.img.fold)) {
				lFold.innerHTML = '&nbsp;&nbsp;&nbsp;'; // These empty spaces are very important to provide clickable function
				lFold.style.background = 'url('+rcPreSetting.img.fold+') left center no-repeat';
			}
			else
				lFold.innerHTML = rcPreSetting.img.fold;
		}
		displayFormat.insertBefore(lFold,displayFormat.firstChild);
		for (var i = 0; i<theNode.length ; i++)	{
			theNode[i].innerHTML = rcInfo.content;
			if (!rcSetting.showAllFlag)
				rcFnc.find(displayFormat,'.comcontent')[i].style.display = 'none';
		}
	}
	else
		rcFnc.remove(rcFnc.find('','#divrc'), '#showAllButton');
	return displayFormat;
};

// ---------------------------------------------------------------
// --			Add my fancy footer and pagenation				--
// ---------------------------------------------------------------
rcFnc.addFooterButton = function () { // Need to be modified for two different mode
	var index = rcSetting.startIndex; // Current index #.
	var tnum = (rcPreSetting.mode.sort != 'post') ? rcSetting.commentTotalNum:rcSetting.maxPostsNum; // Total number
	if (tnum == 0 && rcPreSetting.mode.sort != 'post') // condition: comment within a post and no comment at all
		return; // return seems to work. 
	var g_show = rcPreSetting.base.perPage; // How many we show for one page?
	//if (index + g_show > tnum) // correct the g_show if we are in the last page.
		//g_show = tnum - index + 1;
	var iJump = (rcPreSetting.mode.showJumpButton && tnum > g_show) ? '<form style= "display:inline;" onsumbit="return false" name="jumpForm" action=""><span id="jumpSet"><input style="text-align:center; width:2em;" type="text" name="itemJump" value=""  onkeypress="if(event.keyCode==13||event.which == 13) {rcFnc.changePage(0,(this.value-1)*'+g_show+'+1); return false;}"/></span></form>' : '';	
	var commentInfo = (rcPreSetting.mode.sort != 'post') ? rcPreSetting.text.footerMsg.replace(/%range%/,(tnum < index+g_show)? (tnum == index)?index: index + rcPreSetting.text.rangeSymbol + tnum :index + rcPreSetting.text.rangeSymbol + (index+g_show-1)) : ''; 
	// This is equivalent to:
	 /*
		var commentInfo = '';
		if (rcPreSetting.mode.sort != 'post') {
			if (tnum == index)
				commentInfo = rcPreSetting.text.footerMsg.replace(/%range%/, index);
			else if (tnum < index+g_show)
				commentInfo = rcPreSetting.text.footerMsg.replace(/%range%/, index + rcPreSetting.text.rangeSymbol + tnum);
			else
				commentInfo = rcPreSetting.text.footerMsg.replace(/%range%/,index + rcPreSetting.text.rangeSymbol + (index+g_show-1));	
		}
	 */
	commentInfo = commentInfo.replace(/%totalNum%/,tnum);
	var numberStr = ''; // string for pagenation
	if (rcPreSetting.mode.displayIndex && tnum > g_show){		
		var totalPage = (tnum%g_show > 0)?Math.floor(tnum/g_show)+1:tnum/g_show;
		var showPageRange, endPage;
		var crPage = Math.floor(index/g_show)+1;
		var showPageRange, endPage, magicNum = 7;//why 7? I don't know. It just makes me feet good.
		// showing page index
		if (totalPage <= magicNum) 	{
			showPageRange = 1;
			endPage = totalPage;
		}
		else
		{
			if (crPage < ((magicNum+1)/2+1))
				showPageRange = 1;
			else if (crPage > (totalPage -((magicNum+1)/2)))
				showPageRange = totalPage - (magicNum-1);
			else
				showPageRange = crPage - ((magicNum+1)/2-1);
			endPage = showPageRange + (magicNum-1);
		}
		if (showPageRange == 1) // Create link for first page
		{
			if (crPage == 1)
				numberStr += '1&nbsp;&nbsp;';
				else 
					numberStr += '<a href="javascript:rcFnc.changePage(0,1);">1</a>&nbsp;&nbsp;';
			}
			else 
				numberStr += '<a href="javascript:rcFnc.changePage(0,1);">1</a>...&nbsp;&nbsp;';
			for (var i = showPageRange+1; i < endPage ; i++)
			{
				if (i == crPage)
					numberStr += i;
				else
					numberStr += '<a href="javascript:rcFnc.changePage(0, '+ ((i-1)*g_show+1) +');">' + i + '</a>';
				numberStr += '&nbsp;&nbsp;';
			}
			if ((showPageRange + (magicNum-1)) >= totalPage)
			{
				if (crPage == totalPage)
					numberStr += totalPage+'&nbsp;&nbsp;';
				else 
					numberStr += '<a href="javascript:rcFnc.changePage(0,' + tnum + ');">' + totalPage + '</a>&nbsp;&nbsp;';
			}
			else
				numberStr += '...<a href="javascript:rcFnc.changePage(0,' + tnum +');">' + totalPage + '</a>&nbsp;&nbsp;';	
	}
	var footer = document.createElement('div');
	footer.id = 'showfooterButton';
	footer.innerHTML = '<div id ="rcFooterMsg">' + commentInfo + '</div>' + '<span id="rcFooterMsgIdx">' + numberStr + '</span>' + iJump;
	//footer.style.display = 'none';		
	var prevStr = document.createElement('span');
	prevStr.className = 'rcChagePage';
	prevStr.innerHTML = rcPreSetting.text.prevPage;
	prevStr.onclick = function(){rcFnc.changePage( -1,0);};
	prevStr.onmouseover = function(){this.style.cursor = 'pointer';}; // change cursor to pointer
	prevStr.onmouseout = function(){this.style.cursor = 'default';};  // change cursor back to default 
	var nextStr = document.createElement('span');
	nextStr.className = 'rcChagePage';
	nextStr.innerHTML = rcPreSetting.text.nextPage;
	nextStr.onmouseover = function(){this.style.cursor = 'pointer';}; // change cursor to pointer
	nextStr.onmouseout = function(){this.style.cursor = 'default';};  // change cursor back to default 
	nextStr.onclick = function(){rcFnc.changePage( 1,0);};	
	if (index == 1)
	{
		if (tnum > g_show)
			footer.appendChild(nextStr);
		//else 
		 // do something		
	}
	else if (g_show + index > tnum)
	{
		footer.insertBefore(prevStr,rcFnc.find(footer,'#rcFooterMsgIdx'));
	}
	else 
	{
		footer.insertBefore(prevStr,rcFnc.find(footer,'#rcFooterMsgIdx'));
		footer.appendChild(nextStr);
	}	
	// Pagenation done
	// Now load the footer
	var eRC = rcFnc.find('','#divrc');
	var old_footer = rcFnc.find(eRC, '#showfooterButton');
	if (old_footer)
		eRC.replaceChild(footer,old_footer);
	else
		eRC.appendChild(footer);	
	if (rcSetting.commentTotalNum != 0)
		rcFnc.finalActions();
};

// ---------------------------------------------------------------
// -- titleReCheck & findLossTitles works together to patch 	--
// -- the missing title.										--
// ---------------------------------------------------------------

rcFnc.titleReCheck = function()	{
	var cInfo = rcSetting.cInfo;
	for (var i = 0 ; i < cInfo.length ; i++)
	{
		if (cInfo[i].title == '' && cInfo[i].source != '')
		break;
	}
		var dymloading = new rcFnc.dymscript();
		dymloading.startIndex = 0;
		//dymloading.maxNum = 0;
		dymloading.callback = 'rcFnc.findLossTitles';
		dymloading.id = 'jsonPosts';
		dymloading.errorCheck = false;
		dymloading.link = rcSetting.cInfo[i].source.replace(/default/,'summary');
		rcFnc.fetchJSON(dymloading);
};

rcFnc.findLossTitles = function (json)	{
	var cList = rcFnc.find(rcFnc.find(document.getElementById('divrc'), '#feedItemListDisplay'),'li');
	var cInfo = rcSetting.cInfo;
	var domIdx = 0;
	var title = json.entry.title.$t;
	var link = json.entry.link;
	for (var i = 0 ; i < link.length ; i++)
	{
		if (link[i].rel == 'alternate')
			var titleLink = link[i].href;
		else if (link[i].rel == 'replies' && link[i].type == 'text/html') {
			var replyLink = link[i].href;
			var replyTitle = link[i].title.match(/\d+/);
		}
		else if (link[i].rel == 'self' && link[i].type == 'application/atom+xml')
			var sourceLink = link[i].href;
		else if (link[i].rel == 'replies' && link[i].type == 'application/atom+xml')
			var commentLink = link[i].href;
	}
	rcSetting.pInfo.push({
		title: title,
		directLink: titleLink,
		replyLink: replyLink,
		replyTitle: replyTitle,
		commentLink: commentLink
	}); // expend cache
	for (var i = 0 ; i < cInfo.length ; i++)
	{
		if (cInfo[i].title == '' && cInfo[i].source != '') //maybe try (cInfo.title == '') only
		{
			//if (cInfo[i].orgLink == titleLink) // fixed, check with titleLink will easily cause error b/c some title may be undefined 3/26/2012
			if (cInfo[i].source == sourceLink)	{
				rcSetting.cInfo[i].title = title; //alert(i+' '+ domIdx + ' '+ rcSetting.cInfo[i].title);
				var theNode = rcFnc.find(cList[domIdx],'.rcPostTitle');
				for (var j = 0 ; j < theNode.length ; j++)	{
					var htmlStr = theNode[j].innerHTML.replace(/%g_szTitle%/g, title);
					htmlStr = htmlStr.replace(/%replyURL%/g, replyLink);
					theNode[j].innerHTML = htmlStr;
					theNode[j].style.display = 'inline';
					rcFnc.remove(cList[domIdx],'.rcNoTitle');					
				}
				theNode = rcFnc.find(cList[domIdx], '.rcReply');
				if (theNode!= undefined) {
					for (j = 0 ; j < theNode.length ; j++)
					{
						rcFnc.find(theNode[j], 'a')[0].setAttribute('href',replyLink);
						theNode[j].style.display = 'inline';
					}
				}
			}			
		}		
		domIdx++;
	}
		if (rcFnc.find(cList[0].parentNode,'.rcNoTitle'))
			rcFnc.titleReCheck();
	
 };
//--------------------------------------------------------------
//--		 Some actions are be taken care		  			  --
//--	 1. Hide detailed content of comments 				  --
//--     2. Add mouseover event to each comment         	  --
//--     3. Add mouseout event to each comment                --
//--     4. Add click event handler to each comment 		  --
//--	 5. Click handler will take care the click event when --
//--		switch on/off the detail content.                 --
//-- 												7/1/09	  --
//--------------------------------------------------------------
rcFnc.finalActions = function ()	{
	var eRC = document.getElementById('divrc');
	var cList = rcFnc.find(rcFnc.find(eRC,'#feedItemListDisplay'),'li');
	var showAllButton = rcFnc.find(eRC,'#showAllButton');
	var lComcontent = rcFnc.find(eRC, '.comcontent');
	var lFold = rcFnc.find(eRC, '.rcfold');
	var lSay = rcFnc.find(eRC, '.rcsay');
	rcSetting.remainClose = (rcSetting.showAllFlag)	? rcPreSetting.base.perPage : 0;
	// The inner function for click event handler
	function fClick(idx){
		// Checking if an image file is provided for folding and unfolding
		var imageTest = /\.(jp?g|png|gif)/i;
		if (imageTest.test(rcPreSetting.img.fold)) 
			var imageFold = true;
		else
			var imageFold = false;
		if (imageTest.test(rcPreSetting.img.unfold)) 
			var imageUnfold = true;
		else
			var imageUnfold = false;			
		if (lComcontent[idx].style.display == 'none')	{ // Check if the comment detail is shown
			if (imageUnfold) {
				lFold[idx].innerHTML = '&nbsp;&nbsp;&nbsp;';
				lFold[idx].style.background = 'url(' + rcPreSetting.img.unfold + ') left center no-repeat';
			}
			else {
				lFold[idx].style.background = 'none';
				lFold[idx].innerHTML = rcPreSetting.img.unfold;				
			}
			lSay[idx].innerHTML = rcPreSetting.text.unfold;
			lComcontent[idx].style.display = 'inline';
			rcSetting.remainClose++;
		}
		else {
			if (imageFold) {
				lFold[idx].innerHTML = '&nbsp;&nbsp;&nbsp;';
				lFold[idx].style.background = 'url(' + rcPreSetting.img.fold + ') left center no-repeat';
			}
			else {
				lFold[idx].style.background = 'none';
				lFold[idx].innerHTML = rcPreSetting.img.fold;
			}
			lSay[idx].innerHTML = rcPreSetting.text.fold;
			lComcontent[idx].style.display = 'none';
			rcSetting.remainClose--;
		}
		if (rcSetting.remainClose == 0)	{ // if detailed content of the all comments are shown, change the text of the showallbutton
			showAllButton.innerHTML = rcPreSetting.text.showAll;
			rcSetting.showAllFlag = false;
		}
		else if (rcSetting.remainClose == cList.length)	{
			showAllButton.innerHTML = rcPreSetting.text.hideAll;
			rcSetting.showAllFlag = true;
		}
		//alert(rcSetting.remainClose);
	};
	// Attach click event handler to the switch, IE is quite annoying here but I got a pretty good solution.
	//document.getElementById('headerButton').removeAttribute('style'); // Get the header show now.
	//document.getElementById('jumpButton').removeAttribute('disabled'); // Regain header control	
	if (cList != 'undefined')	{
		if (lFold)	{
			for (var i = 0 ; i < lFold.length ; i++)	{
					lFold[i].liNum = i; // add a own property for li index, this way, we know which <li> we deal with, works in FF
					lFold[i].onmouseover = function(){this.style.cursor = 'pointer';}; // change cursor to pointer
					lFold[i].onmouseout = function(){this.style.cursor = 'default';};  // change cursor back to default 
					if (typeof window.addEventListener != 'undefined') //add event handler, only event handler can process in the inner function
						lFold[i].addEventListener('click',function(){fClick(this.liNum);},false);
					else	// for IE http://www.howtocreate.co.uk/tutorials/javascript/domevents
						lFold[i].attachEvent('onclick',function(e){
							var theTarget = e.target ? e.target : e.srcElement;
							if( theTarget && ( theTarget.nodeType == 3) ) { 
								theTarget = theTarget.parentNode;
								fClick(theTarget.liNum);
							}
							else if (theTarget.liNum == null || theTarget.liNum == 'undefined')
								fClick(theTarget.parentNode.liNum);
							else
								fClick(theTarget.liNum);
							});
			}
		}
	}
};

// ---------------------------------------------------------------
// --			 Handler for showing  or hiding all comment 	--
// ---------------------------------------------------------------
rcFnc.showOrHideAll = function()	{
	var eRC = document.getElementById('divrc');
	var cList = rcFnc.find(rcFnc.find(eRC,'#feedItemListDisplay'),'li');
	var lComcontent = rcFnc.find(eRC,'.comcontent');
	var lFold = rcFnc.find(eRC, '.rcfold');
	var lSay = rcFnc.find(eRC, '.rcsay');
	var showAllButton = rcFnc.find(eRC,'#showAllButton');
	var imageTest = /\.(jp?g|png|gif)/i;
	if (imageTest.test(rcPreSetting.img.fold)) 
		var imageFold = true;
	else
		var imageFold = false;
	if (imageTest.test(rcPreSetting.img.unfold)) 
		var imageUnfold = true;
	else
		var imageUnfold = false;				
	if (rcSetting.showAllFlag)
	{
		for (var i = 0 ; i < cList.length ; i++)	{
			lComcontent[i].style.display = 'none';
			if (imageFold) {
				lFold[i].innerHTML = '&nbsp;&nbsp;&nbsp;';
				lFold[i].style.background = 'url(' + rcPreSetting.img.fold + ') center no-repeat';
			}
			else {
				lFold[i].style.background = 'none';
				lFold[i].innerHTML = rcPreSetting.img.fold;
			}			
			lSay[i].innerHTML = rcPreSetting.text.fold;
		}
		showAllButton.innerHTML = rcPreSetting.text.showAll;
		rcSetting.showAllFlag = false;
		rcSetting.remainClose = 0;
	}
	else
	{
		for (var i = 0 ; i < cList.length ; i++)	{
			lComcontent[i].style.display = 'inline';
			if (imageUnfold) {
				lFold[i].innerHTML = '&nbsp;&nbsp;&nbsp;';
				lFold[i].style.background = 'url(' + rcPreSetting.img.unfold + ') center no-repeat';
			}
			else {
				lFold[i].style.background = 'none';
				lFold[i].innerHTML = rcPreSetting.img.unfold;
			}
			lSay[i].innerHTML = rcPreSetting.text.unfold;
		}
		showAllButton.innerHTML = rcPreSetting.text.hideAll;
		rcSetting.showAllFlag = true;
		rcSetting.remainClose = rcPreSetting.base.perPage;
	}	
};

// ---------------------------------------------------------------
// --			 The handler for the "mode" button				--
// ---------------------------------------------------------------
rcFnc.changeMode = function()	{
	if (rcPreSetting.mode.sort == 'time')
		rcPreSetting.mode.sort = 'post';
	else
		rcPreSetting.mode.sort = 'time';
	rcSetting.cInfo = []; // Clear cInfo;
	rcSetting.commentTotalNum = 0;	
	switch (rcPreSetting.mode.sort)	
	{
		case 'time':
			rcSetting.pInfo = [];// Clear cache
			rcSetting.startIndex = 1;
			var dymloading = new rcFnc.dymscript(); // Create dynamic json script parameters	
			dymloading.maxNum = rcPreSetting.base.cache;
			dymloading.startIndex = 1;
			dymloading.callback = 'rcFnc.titleJSON';
			dymloading.id = 'jsonPosts';
			dymloading.errorCheck = false;
			dymloading.link = rcSetting.postFeed;
			rcFnc.fetchJSON(dymloading);
		break;
		case 'post':
			rcSetting.startIndex = 1;			
			rcFnc.displaying('post'); // Display data from the cache
		break;
	}		
};

//------------------------------------------------------------
//--		 ChangePage, backward, forward, or jump 		--
//-- 		Direction = -1, backward               			--
//-- 		Direction =  0, jump by index          			--
//-- 		Direction =  1,  forward               			--
//-- 		Direction =  2,  jump by date          			--
//-- 		indexIwant is the index I want          		--
//------------------------------------------------------------
rcFnc.changePage = function(direction,indexIwant)	{
	var jump = true;
	rcSetting.cInfo = []; // Clear cInfo;
	var totalNum = (rcSetting.commentTotalNum != 0) ? rcSetting.commentTotalNum:rcSetting.maxPostsNum;
	if (direction == 1) // Next page
		rcSetting.startIndex += rcPreSetting.base.perPage;
	else if (direction == -1) // previsous page
		rcSetting.startIndex -= rcPreSetting.base.perPage;
	else
	{
		if (indexIwant > totalNum)
			indexIwant = totalNum;
		else if (indexIwant < 1)
			indexIwant = 1;
		var pageNumber = Math.ceil(indexIwant/rcPreSetting.base.perPage);
		if (pageNumber == Math.ceil(rcSetting.startIndex/rcPreSetting.base.perPage))
			jump = false;
		else
			rcSetting.startIndex = (pageNumber-1)*rcPreSetting.base.perPage + 1;	
	}
	if (jump)// 同一頁不跳， 不同頁我跳
	{
		var eRC = document.getElementById('divrc');
		var dymloading = new rcFnc.dymscript();
		switch (rcPreSetting.mode.sort)
		{
		case 'time':
			dymloading.startIndex = rcSetting.startIndex;
			dymloading.maxNum = rcPreSetting.base.perPage;
			dymloading.callback = 'rcFnc.commentJSON';
			dymloading.id = 'jsonComments';
			dymloading.errorCheck = false;
			dymloading.link = rcSetting.commentFeed;
			rcFnc.fetchJSON(dymloading);
		break;
		case 'post':
			if ((rcSetting.startIndex+rcPreSetting.base.perPage-1) > rcPreSetting.base.cache || (rcSetting.pInfo.length < rcPreSetting.base.cache))
			{
				rcSetting.pInfo = [];// Clear cache......nothing I can do				
				if (rcSetting.startIndex+rcPreSetting.base.perPage-1 <= rcPreSetting.base.cache) {
					dymloading.startIndex = 1;
					dymloading.maxNum = rcPreSetting.base.cache;
				}
				else {
					dymloading.startIndex = rcSetting.startIndex;
					dymloading.maxNum = rcPreSetting.base.perPage;
				}
				dymloading.callback = 'rcFnc.titleJSON';
				dymloading.id = 'jsonPosts';
				dymloading.errorCheck = false;
				dymloading.link = rcSetting.postFeed;
				rcFnc.fetchJSON(dymloading);
			}				
			else
				rcFnc.displaying('post');
		break;		
		case 'ptime':
			dymloading.maxNum = rcPreSetting.base.perPage;
			dymloading.startIndex = rcSetting.startIndex;
			dymloading.callback = 'rcFnc.commentJSON';
			dymloading.id = 'jsonComments';
			dymloading.errorCheck = false;
			// Now look into document and get the link info from previous call
			dymloading.link = document.getElementById('jsonComments').getAttribute('src').replace(/\?.*/,''); 
			rcFnc.fetchJSON(dymloading);			
		break;
		}
	}
};
// ---------------------------------------------------------------
// --			A function to make this script run				--
// ---------------------------------------------------------------
rcFnc.run = function()	{	
	// some preceding error checking 
	var mainBlock = document.getElementById('divrc');
	rcSetting.commentFeed = 'http://' + rcPreSetting.base.domainName + '/feeds/comments/default';
	rcSetting.postFeed = 'http://' + rcPreSetting.base.domainName +'/feeds/posts/summary';
	if (rcPreSetting.base.perPage >  100) // Limit the number of comments you can laod per page
		rcPreSetting.base.perPage = 100;
	if (rcPreSetting.base.perPage >  rcPreSetting.base.cache)
		rcPreSetting.base.cache = rcPreSetting.base.perPage; // make sure the cache is large enough
 	if (mainBlock)	{ // If the widget container is put, start loading. To do: If the widget container is not proper loaded, wait for 2 second and check again. Timeout = 60 sec
		// mainBlock.innerHTML = '<div id="loadingMsg">' + rcPreSetting.text.loading + '</div>'; // Display AJAX loading GIF
		rcFnc.addHeaderButton(); // Loading header block
		//document.getElementById('headerButton').removeAttribute('style'); // Get the header show now.
		var dymloading = new rcFnc.dymscript(); // Create "dynamic script loading" object. 
		dymloading.maxNum = rcPreSetting.base.cache;
		dymloading.callback = 'rcFnc.titleJSON';
		dymloading.id = 'jsonPosts';
		dymloading.link = rcSetting.postFeed;
		rcFnc.fetchJSON(dymloading); // Load the script  //temp disable
	}
};
