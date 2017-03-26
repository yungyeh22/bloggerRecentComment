// Useful link
// http://code.google.com/apis/gdata/reference.html
// comment JSON: http://lvchen.blogspot.com/feeds/comments/default?start-index=1&max-results=7
// comment JSON with time limit: http://lvchen.blogspot.com/feeds/posts/summary?published-min=2007-04-00&published-max=2007-04-31&max-results=90
// comment JSON unique post: http://lvchen.blogspot.com/feeds/231044572045954265/comments/default?alt=json

//----------- Define Global Variables, can be modified---------------
var rcPreSetting = {
base:{
	  domainName:'lvchen.blogspot.com',
	  perPage: 5,
	  cache:40,
	  delay:0 // Set loading delay if you have very very heavy traffic or some lousy IE browser
	},
text:{
	  prevPage:'上一頁',
	  nextPage:'下一頁',
	  rangeSymbol: '-',
	  sortByTime:'時間排序',
	  sortByPost:'標題排序',
	  fold:'留了言',
	  unfold:'留言說:',
	  hideAll:'全部隱藏',
	  showAll:'全部展開',
	  loading:'載入中...',
	  sLoading:'<img src="sloading.gif"/>',
	  goBack:'退回',
	  today:'今天',
	  deleted:'<i>原文已被刪除</i>',
	  noPost:'<p>沒有留言可以顯示</p>',
	  error:'<p>我覺得你的網址打錯了喔！</p>'
	},
img:{
	  fold:['rc_0609_f.gif','關閉',''],
	  unfold:['rc_0609_uf.gif','打開',''],
	  reply:['external.png','直接去留言','']
	},
mode:{
	  showJumpButton:true,
	  displayIndex: true,
	  showDeleted: false,
	  authorIsHomepage: true
	},
template:{
	  title:'<a href="%orgLink%">%g_szTitle%</a>',
	  author:'<a href="%link%" title="%timestamp% &#65306; %short_content%">%author%</a>',
	  comment:'&nbsp;&nbsp;%rcAuthorLinkFormat% 於 %rcTitleLinkFormat%%replyImg% %rcSay% &#12300;%content%&#12301; &nbsp;- %timestamp%',
	  posts: '%rcpost% (%cNum%) - %timestamp%',
	  footerMsg:'您正在看留言 %range%，共有 %totalNum% 則留言',
	  date:'yy-MM-DD', // YY: 4dig year. yy:2dig year. mm:2dig month. MM:non-dig dd:2dig day
	  monthName: []	  
	}
};

//----------- Define Global Variables, should NOT be modified---------------
var rcSetting = {
sort:'time', //time, post, ptime
maxPostsNum:0,					// Max posts number
startIndex : 1,			// find comment from 
commentTotalNum : 0,			// Total comments number
showAllFlag : false,			// Check if the showAll button clicke
remainClose:0,
ready:false,
pInfo:[],
cInfo:[],
commentFeed: '',
postFeed:''
};

var rcFnc = {};

// Define class for loading json script
rcFnc.dymscript = function (startIndex, maxNum, callback, errorCheck, id, link)	{
	this.startIndex = startIndex;
	this.maxNum = maxNum;
	this.callback = callback;
	this.errorCheck = errorCheck;
	this.id = id;
	this.link = link;
};

// ---------------------------------------------------------------
// 這個小程式可以用來尋找 id/class 裡的某個標籤
// id: 要被尋找的元素
// name: 要尋找的標籤名稱
// type: id/class
// ---------------------------------------------------------------
rcFnc.find = function(element,selector)	{
	function elArr(id,name,type) {
		//alert(id + ': ' + name + ': ' + type);
		switch (type) {
			case '#':
				if (id == '')
					return document.getElementById(name);
				var tags = id.getElementsByTagName('*');
				for (var i = 0 ; i < tags.length ; i++) {
					if (tags[i].id == name)
						return tags[i];
				}
				return undefined;
			case '.': // while getAttribute('class') && getElementsByClassName won't work
				var tagAll = (id=='') ? document.getElementsByTagName('*'): id.getElementsByTagName('*');
				var tags = new Array();
				//var reg = new RegExp(name);
				for (var i = 0 ; i < tagAll.length ; i++ ) {
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
	return (element!='') ? elArr(element,selector.substr(1,(selector.length-1)),selector.substr(0,1)):elArr('',selector.substr(1,(selector.length-1)),selector.substr(0,1));
};

/*
rcFnc.testImage = function() {
// First of all, the onerror hendler won't work...b/c there is no way to change global variable inside the error handler. 
// However, it should work well by means of replacing broken image and some DOM action. 
// Second, even though the "naturalWidth" property is working at some point in FF, there is a loading timing issue may cause incorrect result.
// FF does has complete property but it's a junk. 
// Third, comlete property works fine in IE. The loading timing issue, However, may still occur at some point. 
// Overall, those detection methods are not mature at all and there is really no proper way to suit my expection. 
// The only thing I can do is that, restricting users' input and frocing them to use preferred format.
// Those detecting methods can be a backup plan for those who may violate the format. 
	var imgString;
	for (var i in rcPreSetting.img) {
		var imageSrc   = rcPreSetting.img[i][0];
		var imageTitle = rcPreSetting.img[i][1];
		if (imageSrc == '' || (rcPreSetting.img[i][2].match(/^\<img\s.*\>$/i)!=null))
			return;
		// Check if imageSrc is in property format. If so, store a proper value to associated variable for loading a picture.
		if (imageSrc.match(/\.(jpg|jpeg|png|gif)$/i)==null)
			imgString = imageTitle;
		else {
		// Backup plan: Test image link
				var img = new Image();
				img.src = imageSrc;
				if (typeof img.naturalWidth != 'undefined' && img.naturalWidth == 0) // Test in FF(NS4+), naturalWidth works.
					imgString = imageTitle;
				else if(!img.complete)  // Only IE can generate coorect result, FF will do something odd.
					imgString = imageTitle;
				else {
					if (i != 'reply')
						imgString = '<img align="bottom" src="' + imageSrc + '" title="' + imageTitle + '" />';
					else
						imgString = '<img style = "background:none ;border-style: none" src="'+ imageSrc +'" title="'+ imageTitle +'" />';
				}				
			}
		rcPreSetting.img[i][2] = imgString;
	}
};
*/
//***** Above is a possible way to test image. I would like to keep it for reference although I am not going to use in this widget. *****

rcFnc.makeImage = function () {
	for (var i in rcPreSetting.img) {
		var imageSrc   = rcPreSetting.img[i][0];
		var imageTitle = rcPreSetting.img[i][1];
		var imgString;
		if (imageSrc == '')
			imgString = imageTitle;
		else {
				if (i != 'reply')
					imgString = '<img align="bottom" src="' + imageSrc + '" title="' + imageTitle + '" />';
				else
					imgString = '<img style = "background:none ;border-style: none" src="'+ imageSrc +'" title="'+ imageTitle +'" />';
		}
		rcPreSetting.img[i][2] = imgString;
	}
};


rcFnc.remove = function(element,selector)	{
	var tags = rcFnc.find(element, selector);	
	if (tags)	{
		if (selector.substr(0,1) != '#') {
			for (var i = 0 ; i < tags.length ; i++) {
				tags[0].parentNode.removeChild(tags[0]);
			}
		}
		else
			tags.parentNode.removeChild(tags);
	}
};

// innerHTML method in batch
rcFnc.html = function(elements, text)	{
	if (elements)	{
		for (var i = 0 ; i < elements.length ; i++)	{
			elements[i].innerHTML = text;
		}
	}
};

// Get JSON 
// syntex:rcFnc.fetchJSON(new rcFnc.dymscript(startIndex, maxNum, callback, errorCheck, id, link))
rcFnc.fetchJSON = function (dymloading) {
	var eRC = document.getElementById('divrc');
	if (!document.getElementById('loadingMsg') && dymloading.startIndex != 0)
	{
		var theNode = document.createElement('div');
		theNode.id = 'loadingMsg';
		theNode.innerHTML = rcPreSetting.text.loading;
		eRC.appendChild(theNode);
	}
	rcFnc.remove('','#'+dymloading.id);
	y_script = document.createElement('script');
	var callbacksrc = dymloading.link + '?alt=json-in-script&callback=' + dymloading.callback;
	if (dymloading.maxNum != 0)
		callbacksrc += '&max-results=' + dymloading.maxNum;
	if (dymloading.startIndex != 0)
		callbacksrc += '&start-index='+ dymloading.startIndex;
	y_script.src = callbacksrc;
	y_script.id = dymloading.id;
	y_script.type = 'text/javascript';
	if (dymloading.errorCheck) {
		try { //I trt
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
		//document.documentElement.firstChild.appendChild(y_script);
};

// ----------- Add header buttons---------------
rcFnc.addHeaderButton = function ()	{
	var eRC = document.getElementById('divrc');
	var eHeader = document.createElement('div'); // Create header container
	eHeader.id = 'headerButton';
	eHeader.style.display = 'none'; // Temporarily hide Header until all DOM objects are ready	
	var showAll = document.createElement('li'); // Create hide or show all button
	showAll.id = 'showAllButton';
	showAll.onclick = rcFnc.showOrHideAll;
	showAll.innerHTML = (rcSetting.showAllFlag) ? rcPreSetting.text.hideAll : rcPreSetting.text.showAll; 
	eHeader.appendChild(showAll);
	var rcMode = document.createElement('li'); // Create sorting mode button
	rcMode.id = 'rcMode';
	rcMode.onclick = rcFnc.changeMode;
	rcMode.innerHTML = (rcSetting.sort == 'time') ? rcPreSetting.text.sortByPost : rcPreSetting.text.sortByTime;
	eHeader.appendChild(rcMode);
	var goBack = document.createElement('li');
	goBack.id = 'rcGoback';
	goBack.innerHTML = rcPreSetting.text.goBack;
	eHeader.appendChild(goBack);
	var hList = eHeader.getElementsByTagName('li');
	for (var i = 0 ; i < hList.length ; i++) {
		hList[i].onmouseover = function(){this.style.cursor = 'pointer';};
		hList[i].onmouseout = function(){this.style.cursor = 'default';}; 
		hList[i].style.listStyle = 'none';
		hList[i].style.background = 'none';
		hList[i].style.display = 'inline';
	}
	goBack.style.display = 'none'; // Hide goback button until the body is loaded
	eRC.appendChild(eHeader);
};

rcFnc.titleJSON = function(json)	{
	if (!rcSetting.ready)
		rcSetting.ready = true; // The script is successfully loaded.
	// Extract info and then store into cache	
	if (json.feed.entry) {
		var entries = json.feed.entry;
		// Before push, check the length of array. If exceed the (perPage + cache) , remove the last (size==perPage)
		if (rcSetting.pInfo.length > rcPreSetting.base.cache)
			rcSetting.pInfo.splice(rcPreSetting.base.cache, rcSetting.pInfo.length);		
		if (rcSetting.maxPostsNum == 0)
			rcSetting.maxPostsNum = json.feed.openSearch$totalResults.$t*1;
		if (entries.length < rcPreSetting.base.cache && rcSetting.sort != 'post') rcPreSetting.base.cache = entries.length;
		for (var i = 0 ; i < entries.length ; i++)
		{
			var pTemp = {
				title: '',
				directLink: '',
				replyLink: '',
				replyTitle:'',
				commentLink:'',
				time:''
			};
			var titleIdx = replyIdx = commentIdx = -1;
			var j = 0;
			while (j < entries[i].link.length) {
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
			pTemp.time = rcFnc.generateDate(entries[i].published.$t);
			if (replyIdx!=-1) {// This may be empty??
				pTemp.replyLink = entries[i].link[replyIdx].href;
				pTemp.replyTitle = entries[i].link[replyIdx].title.match(/\d+/);
			}
			rcSetting.pInfo.push(pTemp);
		}
	}
	// Fetch comment or dispaly the list of posts
	if (rcSetting.sort == 'time')
		rcFnc.fetchJSON(new rcFnc.dymscript(1, rcPreSetting.base.perPage, 'rcFnc.commentJSON', false, 'jsonComments', rcSetting.commentFeed));
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
		for(var i = 0 ; i < entries.length ; i++) {
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
			rcInfo.authorLink = (rcPreSetting.mode.authorIsHomepage && comment.author[0].uri != undefined) ? comment.author[0].uri.$t : comment.link[linkIdx].href; //author URL
			rcInfo.orgLink = comment.link[linkIdx].href.replace(/(^.+)\?.*$/,'$1'); // Link URL of the Post
			if (rcInfo.orgLink != checkLink) { // if the previous comment is from the same post, then we don't have to look for the title of the post
				if (comment['thr$in-reply-to']!=undefined) {
					var findIdx = rcFnc.findTitle(rcInfo.orgLink);
					if (findIdx != -1) {
						rcInfo.title = rcSetting.pInfo[findIdx].title;
						rcInfo.replyURL = rcSetting.pInfo[findIdx].replyLink;
					}
					rcInfo.source = comment['thr$in-reply-to'].source; // source link
					//rcInfo.orgLink = comment['thr$in-reply-to'].href; // self link
				}
				else {
					rcInfo.title = '<span class="rcDeleted">' +rcPreSetting.text.deleted + '</span>';
				}
				checkLink  = rcInfo.orgLink;
			}
			else {
				//rcInfo.orgLink = comment['thr$in-reply-to'].href; // self link
				rcInfo.source = comment['thr$in-reply-to'].source; // source link
				rcInfo.title = rcSetting.pInfo[findIdx].title;
				rcInfo.replyURL = rcSetting.pInfo[findIdx].replyLink;
			}
			if (comment.content == undefined) {	// This will check wheather full or short comment feed
				rcInfo.content = comment.summary.$t;
				rcInfo.content = rcInfo.content.replace(/\u003c/g,'<'); // fix < 04/28/2008
				rcInfo.content = rcInfo.content.replace(/\u003e/g,'>'); // fix > 04/28/2008
			}
			else
				rcInfo.content = comment.content.$t;   // The complete content of a comment.
			//	content = content.replace(/\$/g,'&#36;'); // fix $1 and $2 being replaced. 9/6/2007
			rcInfo.authorName = comment.author[0].name.$t;  // Author's Name
			rcInfo.timestamp = rcFnc.generateDate(comment.published.$t); //Date
			rcSetting.cInfo.push(rcInfo);
		}
	}
	//Displaying
	
	rcFnc.displaying('comment');
};

rcFnc.displaying = function(type)	{ // Think of something to fix incorrect li label positioning when in post mode
	//rcFnc.testImage();
	var eRC = document.getElementById('divrc');
	rcFnc.remove(eRC, '#feedItemListDisplay');
	// Now I create "feedItemListDisplay" on the fly every time I need to display contents.
	//I should create it only once at the beginning to avoid confusion and just fill in the content.
	var cBody = document.createElement('ul'); 	
	cBody.id = 'feedItemListDisplay';
	switch (type)	{
		case 'comment':
			for(var i = 0 ; i < rcSetting.cInfo.length ; i++)
			{	
				if (rcPreSetting.mode.showDeleted || rcSetting.cInfo[i].source != '') // To do: chekc if this works well.
					cBody.appendChild(rcFnc.createFormat(rcSetting.cInfo[i]));
			}
			if (rcFnc.find(cBody,'.rcNoTitle'))
				rcFnc.titleReCheck();
		break;
		case 'post':
			var start = ((rcSetting.startIndex +rcPreSetting.base.perPage) < rcPreSetting.base.cache) ? rcSetting.startIndex - 1 : rcPreSetting.base.cache;
			for (var i = start ; i < ((rcSetting.pInfo.length > rcPreSetting.base.cache) ? start + rcSetting.pInfo.length - rcPreSetting.base.cache : start+rcPreSetting.base.perPage) ; i++) {
				var title = rcSetting.pInfo[i].title;
				var rTitle = rcSetting.pInfo[i].replyTitle;
				var postTemplate = rcPreSetting.template.posts; // load template for posts
				//To do : here we need to do something to prevent posttemplate == '';
				postTemplate = postTemplate.replace(/%rcpost%|%cNum%|%timestamp%/g,function(m){
					var clickScript = 'rcFnc.commentInPost('+ i +')';
					return (m == '%rcpost%' ) ? (rTitle != '0')? '<a href="javascript:void(0)" onclick = "'+ clickScript  +'"><span class = "rcPostTitle">' + title + '</span></a>': '<span class = "rcPostTitle">'+title+'</span>' : ( m =='%cNum%') ? '<span class="rcNum">'+rTitle+'<span>' : '<span class="rcTimeStamp">'+rcSetting.pInfo[i].time+'</span>';
				});	
				// Reference: http://codingforums.com/showthread.php?t=169124
				// In the case of no comment within a post, you cannot click into the post. 
				// If somehow you make it clickable with the same behavior of others, no comment info will kick in with no error.
				var cList = document.createElement('li');
				//cList.style.listStyle = 'none';
				cList.innerHTML = postTemplate;	
				cBody.appendChild(cList);
			}	
		break;
	}
	if (!rcFnc.find(cBody,'li')) // If there is nothing to display, display error message.
		cBody.innerHTML = '<div id="rcNoPost">' + rcPreSetting.text.noPost + '</div>';		
	eRC.appendChild(cBody);
	rcFnc.remove(eRC, '#loadingMsg');
	rcFnc.addFooterButton();
};

rcFnc.commentInPost = function (pIdx) {
	rcSetting.sort = 'ptime';
	rcSetting.startIndex = 1;
	rcSetting.cInfo = [];
	var eRC = document.getElementById('divrc');
	var showAllButton = rcFnc.find(eRC,'#showAllButton');
	if (showAllButton) showAllButton.style.display = 'inline';
	//rcFnc.remove(eRC, '#feedItemListDisplay');
	rcFnc.remove(eRC, '#showfooterButton');	
	var goBack = rcFnc.find(eRC,'#rcGoback'); //document.getElementById('rcGoback');
	goBack.style.display = 'inline'; 
	goBack.onclick = function(){rcFnc.goBack(pIdx);};
	rcFnc.fetchJSON(new rcFnc.dymscript(1, rcPreSetting.base.perPage, 'rcFnc.commentJSON', false, 'jsonComments', (pIdx <= rcSetting.pInfo.length) ? rcSetting.pInfo[pIdx].commentLink : rcSetting.pInfo[pIdx%rcPreSetting.base.perPage].commentLink));	
};

rcFnc.goBack = function (pIdx)	{
	rcSetting.sort = 'post';
	rcSetting.cInfo = []; // Clear comment cache;
	var eRC = document.getElementById('divrc');
	var modeButton = rcFnc.find(eRC,'#rcMode');
	var showAllButton = rcFnc.find(eRC,'#showAllButton');
	if (showAllButton) 	showAllButton.style.display = 'none';
	//rcFnc.remove(eRC, '#feedItemListDisplay');
	rcFnc.remove(eRC, '#showfooterButton');
	rcFnc.find(eRC, '#rcGoback').style.display = 'none'; // Hide "goback" text/image if exists
	rcSetting.commentTotalNum = 0;
	rcSetting.startIndex = Math.floor(pIdx/rcPreSetting.base.perPage)*rcPreSetting.base.perPage+1;
	modeButton.innerHTML = rcPreSetting.text.sortByTime;
	rcFnc.displaying('post');
};

rcFnc.findTitle = function(orgLink)	{
	var loop = rcSetting.pInfo.length;
	for (var j = 0 ; j < loop ; j++) { // Run the loop to match link with title
		if (rcSetting.pInfo[j].directLink == orgLink)
			break;
	}
	if (j != loop)
		return j;
	else
		return -1;	
};

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
	var cFormat = rcPreSetting.template.date,
		cYear = bDate.substr(0,4),
		cMonth = bDate.substr(5,2),
		cDay = bDate.substr(8,2),
		cTime = bDate.substr(11,5);
	if (rcPreSetting.text.today != '')	{
		if (isToday(cYear, cMonth, cDay))
			return rcPreSetting.text.today + ' ' + cTime;
	}
	cFormat = cFormat.replace(/yy/,cYear).replace(/YY/,cYear.substr(2,2)).replace(/mm/,cMonth).replace(/MM/,(rcPreSetting.template.monthName.length > 0) ? rcPreSetting.template.monthName[(parseInt(cMonth,10)-1)]:parseInt(cMonth,10)).replace(/dd/,cDay).replace(/DD/,parseInt(cDay,10));
	return cFormat;
};

rcFnc.createFormat = function (rcInfo)	{
	//template.author:'<a href="%link%" title="%timestamp% &#65306; %short_content%">%author%</a>'
	//template.title: '<a href="%orgLink%">%g_szTitle%</a>'
	//template.comment:'%rcAuthorLinkFormat% 於 %rcTitleLinkFormat%%replyImg% %rcSay% &#12300;%content%&#12301; &nbsp;- %timestamp%'
	// I will need: authorLink, author, orgLink, replyURL,content, timestamp, title
	var i;
	rcInfo.sContent = rcInfo.content.replace(/<.*?>/g,''); // Remove HTML tags
	if (rcInfo.sContent.length > 40)		
		rcInfo.sContent = rcInfo.sContent.substr(0,40)+'...';
	rcInfo.sContent = rcInfo.sContent.replace(/"/gim,"&quot;"); // fix short_content masses up author display
	var parseString = rcPreSetting.template.comment;
	var displayFormat = document.createElement('li');
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
		parseString = parseString.replace(/%rcTitleLinkFormat%/g,'<span class = "rcPostTitle"></span>').replace(/%replyImg%/g,'<span class="rcReply"></span>');
	}

	parseString = parseString.replace(/%timestamp%/g,'<span class="rcTimeStamp"></span>').replace(/%rcSay%/g,'<span class="rcsay"></span>').replace(/\s*(\S*)%content%(\S*)\s*/g, '<span class="comcontent">$1<span class="iContent"></span>$2</span>');
	displayFormat.innerHTML = parseString;
	// putting authorFormat
	parseString = rcPreSetting.template.author;
	parseString = parseString.replace(/%link%/g,rcInfo.authorLink).replace(/%author%/g, rcInfo.authorName).replace(/%short_content%/g, rcInfo.sContent).replace(/%timestamp%/g,rcInfo.timestamp);
	rcFnc.html(rcFnc.find(displayFormat,'.rcAuthor'), parseString);
	// putting titleFormat
	parseString = rcPreSetting.template.title;
	if (rcInfo.source != '')
	{
		parseString = parseString.replace(/%orgLink%/g, rcInfo.orgLink).replace(/%short_content%/g, rcInfo.sContent).replace(/%timestamp%/g, rcInfo.timestamp);
		if (rcInfo.title != '')
			parseString = parseString.replace(/%g_szTitle%/g, rcInfo.title).replace(/%replyURL%/g, rcInfo.replyURL);
	}
	else
		parseString = rcInfo.title;
	rcFnc.html(rcFnc.find(displayFormat,'.rcPostTitle'), parseString);
	rcFnc.html(rcFnc.find(displayFormat,'.rcReply'),'<a href="'+ rcInfo.replyURL +'" target="_blank">'+ rcPreSetting.img.reply[2] +'</a>'); 	
	rcFnc.html(rcFnc.find(displayFormat,'.rcsay'), (rcSetting.showAllFlag) ? rcPreSetting.text.unfold : rcPreSetting.text.fold);
	rcFnc.html(rcFnc.find(displayFormat,'.rcTimeStamp'), rcInfo.timestamp);
	var theNode  = rcFnc.find(displayFormat,'.iContent');
	if (theNode)	{// folding feature is used when full content exists.
		displayFormat.style.listStyle = 'none';  // "list-style" must be none for customized image
		displayFormat.style.background = 'none'; // Some people use "backgournd" instead of "list-style-image" to show image
		var lFold = document.createElement('span');
		lFold.className = 'rcfold';
		lFold.innerHTML = (rcSetting.showAllFlag) ? rcPreSetting.img.fold[2] : rcPreSetting.img.unfold[2];
		displayFormat.insertBefore(lFold,displayFormat.firstChild);
		for (i = 0; i<theNode.length ; i++)	{
			theNode[i].innerHTML = rcInfo.content;
			if (!rcSetting.showAllFlag)
				rcFnc.find(displayFormat,'.comcontent')[i].style.display = 'none';
		}
	}
	else
		rcFnc.remove(rcFnc.find('','#divrc'), '#showAllButton');
	return displayFormat;
};

rcFnc.addFooterButton = function () { // Need to be modified for two different mode
	var index = rcSetting.startIndex; // Current index #.
	var tnum = (rcSetting.sort != 'post') ? rcSetting.commentTotalNum:rcSetting.maxPostsNum; // Total number
	if (tnum == 0 && rcSetting.sort != 'post') // condition: comment within a post and no comment at all
		return; // return seems to work. 
	var g_show = rcPreSetting.base.perPage; // How many we show for one page?
	//if (index + g_show > tnum) // correct the g_show if we are in the last page.
		//g_show = tnum - index + 1;
	var iJump = (rcPreSetting.mode.showJumpButton && tnum > g_show) ? '<form style= "display:inline;" onsumbit="return false" name="jumpForm" action=""><span id="jumpSet"><input style="text-align:center; width:1.5em;" type="text" name="itemJump" value=""  onkeypress="if(event.keyCode==13||event.which == 13) {rcFnc.changePage(0,(this.value-1)*'+g_show+'+1); return false;}"/></span></form>' : '';
	var commentInfo = (rcSetting.sort != 'post') ? rcPreSetting.template.footerMsg.replace(/%range%/,(tnum < index+g_show)? (tnum == index)?index: index + rcPreSetting.text.rangeSymbol + tnum :index + rcPreSetting.text.rangeSymbol + (index+g_show-1)) : ''; 
	// This is equivalent to:
	 /*
		var commentInfo = '';
		if (rcSetting.sort != post) {
			if (tnum == index)
				commentInfo = rcPreSetting.text.footerMsg.replace(/%range%/, index);
			else if (tnum < index+g_show)
				commentInfo = rcPreSetting.text.footerMsg.replace(/%range%/, index + rcPreSetting.text.rangeSymbol + tnum);
			else
				commentInfo = rcPreSetting.text.footerMsg.replace(/%range%/,index + rcPreSetting.text.rangeSymbol + (index+g_show-1));	
		}
	 */
	commentInfo = commentInfo.replace(/%totalNum%/,tnum);
	var numberStr = ''; // string for page number
	if (rcPreSetting.mode.displayIndex && tnum > g_show){		
		var totalPage = (tnum%g_show > 0)?Math.floor(tnum/g_show)+1:tnum/g_show;
		var showPageRange, endPage;
		var crPage = Math.floor(index/g_show)+1;
		var showPageRange, endPage, magicNum = 7;//why 7? I don't know. It just makes me feet good.
		if (totalPage <= magicNum) 	{
			showPageRange = 1;
			endPage = totalPage;
		}
		else {
			if (crPage < ((magicNum+1)/2+1))
				showPageRange = 1;
			else if (crPage > (totalPage -((magicNum+1)/2)))
				showPageRange = totalPage - (magicNum-1);
			else
				showPageRange = crPage - ((magicNum+1)/2-1);
			endPage = showPageRange + (magicNum-1);
		}
		if (showPageRange == 1) { // Create link for first page
			if (crPage == 1)
				numberStr += '1&nbsp;&nbsp;';
				else 
					numberStr += '<a href="javascript:rcFnc.changePage(0,1);">1</a>&nbsp;&nbsp;';
			}
			else 
				numberStr += '<a href="javascript:rcFnc.changePage(0,1);">1</a>...&nbsp;&nbsp;';
			for (var i = showPageRange+1; i < endPage ; i++) {
				if (i == crPage)
					numberStr += i;
				else
					numberStr += '<a href="javascript:rcFnc.changePage(0, '+ ((i-1)*g_show+1) +');">' + i + '</a>';
				numberStr += '&nbsp;&nbsp;';
			}
			if ((showPageRange + (magicNum-1)) >= totalPage) {
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
	footer.innerHTML = '<div class ="rcFooterMsg">' + commentInfo + '</div>' + '<span class="rcFooterMsgIdx">' + numberStr + iJump + '</span>';
	var prevStr = document.createElement('span');
	prevStr.className = 'rcChagePage';
	prevStr.innerHTML = rcPreSetting.text.prevPage;
	prevStr.onclick = function(){rcFnc.changePage( -1,0);};
	prevStr.onmouseover = function(){this.style.cursor = 'pointer';}; // change cursor to pointer
	prevStr.onmouseout = function(){this.style.cursor = 'default';};  // change cursor back to default 
	prevStr.style.margin = '0 1em 0 0';
	var nextStr = document.createElement('span');
	nextStr.className = 'rcChagePage';
	nextStr.innerHTML = rcPreSetting.text.nextPage;
	nextStr.onmouseover = function(){this.style.cursor = 'pointer';}; // change cursor to pointer
	nextStr.onmouseout = function(){this.style.cursor = 'default';};  // change cursor back to default 
	nextStr.onclick = function(){rcFnc.changePage( 1,0);};
	nextStr.style.margin = '0 0 0 1em';
	if (index == 1)
	{
		if (tnum > g_show)
			footer.appendChild(nextStr);
		//else 
		 // do something		
	}
	else if (g_show + index > tnum)
	{
		footer.insertBefore(prevStr,rcFnc.find(footer,'.rcFooterMsgIdx')[0]);
	}
	else 
	{
		footer.insertBefore(prevStr,rcFnc.find(footer,'.rcFooterMsgIdx')[0]);
		footer.appendChild(nextStr);
	}	
	// Now load the footer
	document.getElementById('divrc').appendChild(footer);
	if (rcSetting.commentTotalNum != 0)
		rcFnc.finalActions();
};

rcFnc.titleReCheck = function()	{
	var cInfo = rcSetting.cInfo;
	for (var i = 0 ; i < cInfo.length ; i++)
	{
		if (cInfo[i].title == '' && cInfo[i].source != '')
		break;
	}
	rcFnc.fetchJSON(new rcFnc.dymscript(0, 0, 'rcFnc.findLossTitles', false, 'jsonPosts',rcSetting.cInfo[i].source.replace(/default/,'summary')));	
};

rcFnc.findLossTitles = function (json)	{
	var cList = rcFnc.find(rcFnc.find(document.getElementById('divrc'), '#feedItemListDisplay'),'li');
	var cInfo = rcSetting.cInfo;
	var domIdx = 0;
	var title = json.entry.title.$t;
	var link = json.entry.link;
	for (var i = 0 ; i < link.length ; i++)	{
		if (link[i].rel == 'alternate')
			var titleLink = link[i].href;
		else if (link[i].rel == 'replies' && link[i].type == 'text/html')
			var replyLink = link[i].href;
	}
	for (var i = 0 ; i < cInfo.length ; i++) {
		if (cInfo[i].title == '' && cInfo[i].source != '') //maybe try (cInfo.title == '') only
		{
			if (cInfo[i].orgLink == titleLink)
			{
				rcSetting.cInfo[i].title = title;
				var theNode = rcFnc.find(cList[domIdx],'.rcPostTitle');
				for (var j = 0 ; j < ((theNode)?theNode.length:0) ; j++)
				{
					var htmlStr = theNode[j].innerHTML.replace(/%g_szTitle%/g, title);
					htmlStr = htmlStr.replace(/%replyURL%/g, replyLink);
					theNode[j].innerHTML = htmlStr;
					theNode[j].style.display = 'inline';
					rcFnc.remove(cList[domIdx],'.rcNoTitle');
					
				}
				theNode = rcFnc.find(cList[domIdx], '.rcReply');
				for (j = 0 ; j < ((theNode)?theNode.length:0) ; j++)  // TO do: check if this works well.
				{
					rcFnc.find(theNode[j], 'a')[0].setAttribute('href',replyLink);
					theNode[j].style.display = 'inline';
				}
			}			
		}
		domIdx++;
	}
		if (rcFnc.find(cList[0].parentNode,'.rcNoTitle'))
			rcFnc.titleReCheck();
 };

//--------------------------------------------------------------
//--		 Some actions need to be taken care 			  --
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
		if (lComcontent[idx].style.display == 'none')	{ // Check if the comment detail is shown
			lFold[idx].innerHTML = rcPreSetting.img.fold[2];
			lSay[idx].innerHTML = rcPreSetting.text.unfold;
			lComcontent[idx].style.display = 'inline';
			rcSetting.remainClose++;
		}
		else {
			lFold[idx].innerHTML = rcPreSetting.img.unfold[2];
			lSay[idx].innerHTML = rcPreSetting.text.fold;
			lComcontent[idx].style.display = 'none';
			rcSetting.remainClose--;
		}		
		if (rcSetting.remainClose == 0)	{ // if detailed content of the all comments are shown, change the text of the showallbutton
			showAllButton.innerHTML = rcPreSetting.text.showAll;
			rcSetting.showAllFlag = false;
		}
		else if (rcSetting.remainClose == rcPreSetting.base.perPage) {
			showAllButton.innerHTML = rcPreSetting.text.hideAll;
			rcSetting.showAllFlag = true;
		}
	};
	// Attach click event handler to the switch, IE is quite annoying here but I got a pretty good solution.
	document.getElementById('headerButton').removeAttribute('style'); // Get the header show now.
	document.getElementById('feedItemListDisplay').removeAttribute('style');
	document.getElementById('showfooterButton').removeAttribute('style');
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
							var theTarget = (e.target) ? e.target : e.srcElement;
							if (theTarget.tagName == 'IMG') theTarget = theTarget.parentNode; // Not test in Safari yet
							fClick(theTarget.liNum);});
			}
		}
	}
};

// ----------- Handler for showing  or hiding all comment -----------
// ----------- Dynamic onclick does not work, so I merge two function into one. it seems working and running better ! 10/17 -----------
rcFnc.showOrHideAll = function()	{
	var eRC = document.getElementById('divrc');
	var cList = rcFnc.find(rcFnc.find(eRC,'#feedItemListDisplay'),'li');
	var lComcontent = rcFnc.find(eRC,'.comcontent');
	var lFold = rcFnc.find(eRC, '.rcfold');
	var lSay = rcFnc.find(eRC, '.rcsay');
	var showAllButton = rcFnc.find(eRC,'#showAllButton');
	if (rcSetting.showAllFlag) {
		for (var i = 0 ; i < cList.length ; i++)	{
			lComcontent[i].style.display = 'none';
			lFold[i].innerHTML = rcPreSetting.img.unfold[2];
			lSay[i].innerHTML = rcPreSetting.text.fold;
		}
		showAllButton.innerHTML = rcPreSetting.text.showAll;
		rcSetting.showAllFlag = false;
		rcSetting.remainClose = 0;
	}
	else {
		for (var i = 0 ; i < cList.length ; i++)	{
			lComcontent[i].style.display = 'inline';
			lFold[i].innerHTML = rcPreSetting.img.fold[2];
			lSay[i].innerHTML = rcPreSetting.text.unfold;
		}
		showAllButton.innerHTML = rcPreSetting.text.hideAll;
		rcSetting.showAllFlag = true;
		rcSetting.remainClose = rcPreSetting.base.perPage;
	}	
};

rcFnc.changeMode = function()	{
	rcSetting.sort = (rcSetting.sort == 'time') ? 'post' : 'time';
	rcSetting.cInfo = []; // Clear cInfo;		
	var eRC = document.getElementById('divrc');
	var modeButton = rcFnc.find(eRC,'#rcMode');
	var showAllButton = rcFnc.find(eRC,'#showAllButton');
	rcFnc.remove(eRC, '#feedItemListDisplay');
	rcFnc.remove(eRC, '#showfooterButton');
	rcFnc.find(eRC, '#rcGoback').style.display = 'none'; // Clear "goback" text/image if exist
	rcSetting.commentTotalNum = 0;
	switch (rcSetting.sort) {
		case 'time':
			rcSetting.startIndex = 1;
			//rcSetting.pInfo = [];
			if (showAllButton) showAllButton.style.display = 'inline';
			modeButton.innerHTML = rcPreSetting.text.sortByPost;
			rcFnc.fetchJSON(new rcFnc.dymscript(1, rcPreSetting.base.perPage, 'rcFnc.commentJSON', false, 'jsonComments', rcSetting.commentFeed));			
		break;
		case 'post':
			rcSetting.startIndex = 1;
			if(showAllButton) showAllButton.style.display = 'none';
			modeButton.innerHTML = rcPreSetting.text.sortByTime;
			rcFnc.displaying('post');
		break;
	};
};

//--------------------------------------------------------------
//----------- ChangePage, backward, forward, or jump ---------------
//----------- Direction = -1, backward               ---------------
//----------- Direction =  0, jump by index          ---------------
//----------- Direction =  1,  forward               ---------------
//----------- Direction =  2,  jump by date          ---------------
//----------- indexIwant is index I want             ---------------
//--------------------------------------------------------------
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
	if (jump) // jump != true, we are in the same page, no need to jump
	{
		var eRC = document.getElementById('divrc');
		//rcFnc.remove(eRC, '#feedItemListDisplay');
		rcFnc.remove(eRC, '#showfooterButton');
		switch (rcSetting.sort) {
		case 'time':
			rcFnc.fetchJSON(new rcFnc.dymscript(rcSetting.startIndex, rcPreSetting.base.perPage, 'rcFnc.commentJSON', false, 'jsonComments', rcSetting.commentFeed)); // Load the script
		break;
		case 'post':
			if ((rcSetting.startIndex+rcPreSetting.base.perPage) >= rcPreSetting.base.cache)
				rcFnc.fetchJSON(new rcFnc.dymscript(rcSetting.startIndex, rcPreSetting.base.perPage, 'rcFnc.titleJSON', false, 'jsonPosts', rcSetting.postFeed));
			else
				rcFnc.displaying('post');
		break;		
		case 'ptime':
			rcFnc.fetchJSON(new rcFnc.dymscript(rcSetting.startIndex, rcPreSetting.base.perPage, 'rcFnc.commentJSON', false, 'jsonComments', rcFnc.find('','#jsonComments').getAttribute('src').replace(/\?.*/,'')));
		break;
		}
	}
};

rcFnc.run = function()	{	
	var mainBlock = document.getElementById('divrc');
	rcSetting.commentFeed = 'http://' + rcPreSetting.base.domainName + '/feeds/comments/default';
	rcSetting.postFeed = 'http://' + rcPreSetting.base.domainName +'/feeds/posts/summary';
	rcFnc.makeImage();
 	if (mainBlock)	{ // If the widget container is put, start loading.
		mainBlock.innerHTML = '<div id="loadingMsg">' + rcPreSetting.text.loading + '</div>'; // Display AJAX loading GIF
		rcFnc.addHeaderButton(); // Loading header block
		rcFnc.fetchJSON(new rcFnc.dymscript(1, rcPreSetting.base.cache, 'rcFnc.titleJSON', true, 'jsonPosts', rcSetting.postFeed)); // Load the script
	}
};
