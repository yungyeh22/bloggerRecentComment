// 1. 改變格式標籤命名方式。原來的方式實在是太難以辨認了(Done 9/26)
// 2. 不再使用 document.write，所以一定要有 ###recentComment### 的標籤，才能 loading??? (Done 9/23)
// 3. 可以設定是否顯示跳頁按鈕。(Done 9/25)
// 4. 改寫 hideAll and showAll, jumpPageIwant  的function  （Done 9/23, I meged them into new fumction 'rcFunction.changePage'）
// 5. 取消標題欄吧... (Done 9/23.)
// 6. 原文被刪除後，留言還在的問題。(要先讓它不顯示，之後再顯示)
// 7. 所有的文字都可以自訂
// 8. 把showall hideall 改過了，比較簡單
// 跳頁測試，先按下一頁，再按上一頁，跳到最後一頁（使用跳頁按鈕），按上一頁，再按下一頁，跳到第二頁（使用跳頁按鈕，index=4），按上一頁，完成。

//----------- Define Global Variables, can be modified---------------
var rcPreSetting = {
g_szBlogDomain:'lvchen.blogspot.com',
g_iShowCount: 10,
noContent: '<p>原文已被刪除，沒有內容可以顯示</p>',
loopInt:30,
showJumpButton:true,
rcFoldImage:[
'http://lvchen716.googlepages.com/0609_f.gif' ,'留了言',
'http://lvchen716.googlepages.com/0609_uf.gif','留言說:',
'<img src="http://lvchen716.googlepages.com/2-0.gif"/>&nbsp;載入中...',
'全部展開','全部隱藏'],
otherText:['跳至留言','我跳','上一頁','下一頁','您正在看留言 %range%，共有 %totalNum% 則留言'],
rcAuthorLinkFormat:'<a href="%link%" title="%timestamp% &#65306; %short_content%">%author%</a>',
rcTitleLinkFormat: '<a href="%orgLink%">%g_szTitle%</a>',
createDisplayFormat:'%rcAuthorLinkFormat% 於 %rcTitleLinkFormat% %rcSay% &#12300;%content%&#12301; - %timestamp%',
rcDateFormat: 1
};


//----------- Define Global Variables, should NOT be modified---------------
jQuery.noConflict();

var rcSetting = {
recent_comment_ver:'1.7',
maxPostsNum:0,					// Max posts number
commentStartIndex : 1,			// find comment from 
postStartIndex : 1,				// find title from
commentTotalNum : 0,			// Total comments number
showAllFlag : false			// Check if the showAll button clicke
};
var rcFunction = {};		// The only Globa function...maybe

// ----------- Add header buttons---------------
rcFunction.addHeaderButton = function ()
{
	var headerButton = '<div id="headerButton"><a id ="showAllButton" href="javascript:rcFunction.showOrHideAll();">'+rcPreSetting.rcFoldImage[5]+'</a>';
	if (rcPreSetting.showJumpButton)
	headerButton += '<form style= "display:inline;margin-left:1em" onsumbit="return false" name="jumpForm" action=""><span id="jumpSet">'+rcPreSetting.otherText[0]+'&nbsp;&nbsp;<input style="text-align:center; width:2em" type="text" name="itemJump" value="1"  onkeypress="if(window.event.keyCode==13) {rcFunction.changePage(0,itemJump.value); return false;}"/>&nbsp;<input id="jumpButton" type="button" value="'+rcPreSetting.otherText[1]+'" onclick="rcFunction.changePage(0,itemJump.value);"/></span></form></div>';
	else
	headerButton += '</div>';
	jQuery('#divrc').before(headerButton);
};

//----------- Fetch comment JSON feed, several variables that is comments related are determine here ---------------
rcFunction.commentJSONfeed = function (json) 
{ 
	g_szComments = json.feed.entry;
	if (rcSetting.commentTotalNum == 0)
		rcSetting.commentTotalNum = json.feed.openSearch$totalResults.$t*1;   // Retrive total number of comments
	itemsPerPage = json.feed.openSearch$itemsPerPage.$t*1;			// How many items per page? Why do we need this?
	if (itemsPerPage > rcSetting.commentTotalNum)								// Because if you have only 2 comments on you blog, it might cause error.
		itemsPerPage = rcSetting.commentTotalNum;
	if (rcPreSetting.g_iShowCount > rcSetting.commentTotalNum) 
		rcPreSetting.g_iShowCount = rcSetting.commentTotalNum;
	rcFunction.fetchPostsTitle(rcSetting.postStartIndex, rcPreSetting.loopInt);
};
rcFunction.fetchComments = function(Index,increment)
{
	jQuery ('#jumpButton').attr('disabled','disabled');
	var y_script = document.createElement('script');
	var callbacksrc = 'http://' + rcPreSetting.g_szBlogDomain + '/feeds/comments/default?alt=json-in-script&callback=rcFunction.commentJSONfeed&max-results=' + increment + '&start-index='+ Index;
	y_script.setAttribute('src',callbacksrc);
	y_script.setAttribute('id', 'jsonCommnets');
	y_script.setAttribute('type', 'text/javascript');
	document.documentElement.firstChild.appendChild(y_script);
};
rcFunction.fetchPostsTitle = function(Index, increment)
{
	var y_script = document.createElement('script');
	callbacksrc = 'http://' + rcPreSetting.g_szBlogDomain + 	'/feeds/posts/summary?alt=json-in-script&callback=rcFunction.titleJSONfeed&max-results='+ increment + '&start-index=' + Index;
	y_script.setAttribute('src',callbacksrc);
	y_script.setAttribute('id', 'jsonPosts');
	y_script.setAttribute('type', 'text/javascript');
	document.documentElement.firstChild.appendChild(y_script);
};
//----------- Fetch posts JSON feed, several variables that is comments related are determine here ---------------
//----------- Look for matched titles and show comments ---------------
rcFunction.titleJSONfeed = function (posts)
{	
	var temp = '<ul id="feedItemListDisplay">';
	var checkLink = '' ;
	var checkTitle = '';
	if (rcSetting.maxPostsNum == 0)
	rcSetting.maxPostsNum = posts.feed.openSearch$totalResults.$t*1;
	//----------- An inner funciton that converts Month---------------
	function monthConvert(monthIndex)
	{
		var monthName=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		return monthName[(parseInt(monthIndex,10)-1)];
	}	
	//----------- An inner function that check dates Get Today's Date---------------
	function checkTodayDate (dateString)
	{
		var timeStr = new Date();
		var rcDateStr = new Date();
		rcDateStr.setFullYear(parseInt(dateString.substr(0,4),10),parseInt(dateString.substr(5,2),10)-1,parseInt(dateString.substr(8,2),10));
		if (rcDateStr.getYear() == timeStr.getYear())
		{
			if (rcDateStr.getMonth() == timeStr.getMonth())
			{
				if (rcDateStr.getDate() == timeStr.getDate())
					return true;
				else
					return false;
			}
			else
				return false;
		}
		else
			return false;
	}
	//----------- Main loop to create a list of comments  -------------------------------------------------------
	//----------- Post URLs are located and compared for getting the name of its title	 ---------------
	for (var i=0; i < itemsPerPage; i++)
	{
		var comment = g_szComments[i]; // Extract comments from JSON
		if (comment.content== undefined) // This will check wheather full or short comment feed
		{
			var content = comment.summary.$t;
			if (content.length > 40)
				var short_content = content.substr(0,40)+'...';
			else
				var short_content = content;
		}			
		else
		{
			var content = comment.content.$t;   // The complete content of a comment.
		//blogger change the API, title missing. I use substring of content to create short_content  8/25/2007
			var short_content = content.replace(/<.*?>/g,'');
			if (short_content.length > 40)	
				short_content = short_content.substr(0,40)+'...';
		}
		content = content.replace(/\$/g,'&#36;'); // fix $1 and $2 being replaced. 9/6/2007
		var link = comment.link[0].href; // author's link, use this link to look for original link of the post.
		if (link.indexOf('#') > 0)
			var orgLink = link.replace(/(^.+)\?(.*$)/,'$1'); // Link URL of the Post
		
		if (orgLink != checkLink)  // if the previous comment is from the same post, then we don't have to look for the title of the post
		{
			var g_szTitle = rcFunction.a_FindTitle(posts,orgLink); 
			checkTitle = g_szTitle;
			checkLink  = orgLink;
		}
		else
			var g_sztitle = checkTitle;
		var author= comment.author[0].name.$t;  // Author's Name
		//link = link.replace(/#/,'#comment-'); // add '#comment-' into link, this matches blogger format // guess what? google change format again!! 
		//----------- Select Date Format and do some necessary modification---------------
		if (rcPreSetting.rcDateFormat == 1)
		{
			var timestamp=comment.published.$t.substr(0,10); // Determine date and time.
			if (checkTodayDate(timestamp))
			timestamp = '今天 '+comment.published.$t.substr(11,5);
		}
		else if (rcPreSetting.rcDateFormat == 2)
			var timestamp=monthConvert(comment.published.$t.substr(5,2))+'&nbsp;'+comment.published.$t.substr(8,2);
		short_content = short_content.replace(/"/gim,"&quot;"); // fix short_content masses up author display
		// Create Authour's information 
		var g_szAuthorsLink = rcPreSetting.rcAuthorLinkFormat;
		g_szAuthorsLink = g_szAuthorsLink.replace(/%link%/,link);
		g_szAuthorsLink = g_szAuthorsLink.replace(/%timestamp%/,timestamp);
		g_szAuthorsLink = g_szAuthorsLink.replace(/%author%/, author);
		g_szAuthorsLink = g_szAuthorsLink.replace(/%short_content%/, short_content);
		// Create title information 
		var g_orignalLink = rcPreSetting.rcTitleLinkFormat;		
		g_orignalLink = g_orignalLink.replace(/%orgLink%/,orgLink);
		g_orignalLink = g_orignalLink.replace(/%g_szTitle%/,'<span class = rcPostTitle>' + g_szTitle + '</span>');
		g_orignalLink = g_orignalLink.replace(/%timestamp%/,timestamp);
		g_orignalLink = g_orignalLink.replace(/%short_content%/,short_content);
		var expendStyle= '<span class="rcfold">&nbsp;&nbsp;&nbsp;</span> ';
		// Finally, create the comment list
		temp += '<li>'+ expendStyle;
		var displayFormat = rcPreSetting.createDisplayFormat;
		displayFormat = displayFormat.replace(/%rcAuthorLinkFormat%/,g_szAuthorsLink);
		displayFormat = displayFormat.replace(/%rcTitleLinkFormat%/,g_orignalLink);
		displayFormat = displayFormat.replace(/%rcSay%/,'<span class="rcsay">'+rcPreSetting.rcFoldImage[1]+'</span>');
		displayFormat = displayFormat.replace(/%timestamp%/,'<span class="rcTimeStamp">' + timestamp + '</span>');
		displayFormat = displayFormat.replace(/\s(\S*)%content%(\S*)\s/, '<span class="comcontent">$1'+content+'$2</span>'); // This is somewhat tricky
		temp += displayFormat + '</li>';
	}
	temp+='</ul>';
	jQuery('#divrc').html(temp);
	// Some necessary operations to match custom format
	jQuery(document).ready(function()
	{
		if (jQuery('#divrc li .comcontent').html() != null)
		{// folding feature is used when full content exists.
			jQuery('#divrc li').css({listStyle:'none',background:'none'}).find('.rcfold').css('background','url('+rcPreSetting.rcFoldImage[0]+') center no-repeat');
		}
		else
		{// if full content does not exist, remove folding feature
			jQuery('#divrc li').find('.rcfold').remove();
			jQuery('#showAllButton').remove();
		}
		rcFunction.RunAfterDomReady();
	});
	rcFunction.titleCheck(); // go to titleCheck to check if any title misses.
};
// We use this function to check if any title is missed.
rcFunction.titleCheck = function()
{
	var y;
	var ohoh = false;
	jQuery('#divrc li:has(.gotNothing)').remove();
	jQuery("#divrc li").each(function(y)
	{	
		if (jQuery('.noTitleMessage',this).html() == '&nbsp;')
		{
			ohoh = true;y = rcPreSetting.g_iShowCount;
		}
	});
	if (ohoh)
	{
		rcSetting.postStartIndex+=rcPreSetting.loopInt;
		if (jQuery('#jsonPosts')>0)
			jQuery('#jsonPosts').remove();
		var y_script = document.createElement('script');
		callbacksrc = 'http://' + rcPreSetting.g_szBlogDomain + 	'/feeds/posts/summary?alt=json-in-script&callback=rcFunction.findLossTitles&max-results=' + rcPreSetting.loopInt + '&start-index='+ rcSetting.postStartIndex;
		y_script.setAttribute('src',callbacksrc);
		y_script.setAttribute('id', 'jsonPosts');
		y_script.setAttribute('type', 'text/javascript');
		document.documentElement.firstChild.appendChild(y_script);
	}	
	else
	{
		rcSetting.postStartIndex = 1;
		function addFooterButton() //This function is only used in titleCheck(), so I make it an inner function for easy management
		{
			var commentInfo ='<p id="showfooterButton">'+rcPreSetting.otherText[4];
			commentInfo = commentInfo.replace(/%range%/,rcSetting.commentStartIndex +'~'+ (rcSetting.commentStartIndex+itemsPerPage-1));
			commentInfo = commentInfo.replace(/%totalNum%/,rcSetting.commentTotalNum);
			var footerButton;
			jQuery('#loading').remove();
			jQuery('#jumpButton').removeAttr('disabled');
			if (rcSetting.commentStartIndex == 1)
			{
				if (rcSetting.commentTotalNum == rcPreSetting.g_iShowCount)
				footerButton = '</p>';
				else
				footerButton = '<br><a href="javascript:rcFunction.changePage(1,0);">'+rcPreSetting.otherText[3]+'</a></p>';
			}
			else if (rcSetting.commentStartIndex+rcPreSetting.g_iShowCount > rcSetting.commentTotalNum)
			{
				footerButton = '<br><a href="javascript:rcFunction.changePage(-1,0);">'+rcPreSetting.otherText[2]+'</a></p>';
			}
			else 
			{
				footerButton = '<br><a href="javascript:rcFunction.changePage(-1,0);">'+rcPreSetting.otherText[2]+'</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:rcFunction.changePage(1,0);">'+rcPreSetting.otherText[3]+'</a></p>';
			}
			jQuery('#divrc').after(commentInfo + footerButton);
		}
		if (jQuery('#divrc li').text().length == 0)
			jQuery('#divrc').html(rcPreSetting.noContent);
		addFooterButton();
	}
};
// How do we find the title of a post that we miss at first check?
// We look again and then use jQuery to replace noTitleMessage'
// This function is called by titleCheck ONLY.
rcFunction.findLossTitles = function (postTitles)
{
	var checkLink = '';
	var checkTitle = '';
	var x=0;
	jQuery("#divrc li").each(function(x)
	{
		if (jQuery('.noTitleMessage', this).html() == '&nbsp;')
		{
			var link =jQuery('a',this).filter(function(index) { return jQuery(this).find('.rcPostTitle').length > 0; }).attr('href');
			if (link == checkLink)
			{
				var g_szTitle = checkTitle;
			}
			else
			{
				var g_szTitle = rcFunction.a_FindTitle(postTitles,link);
				if (g_szTitle != 0)
				{
					checkTitle = g_szTitle;
					checkLink = link;
				}
			}
			jQuery('.noTitleMessage',this).remove();
			jQuery('.rcPostTitle',this).html(g_szTitle);
		}		
	});
	rcFunction.titleCheck();
};
// Look for title, posts: posts JSON  Feed, orgLink: the URL you wish to look for
rcFunction.a_FindTitle = function (posts,orgLink)
{
	var postLink;
	var loopLimit = rcPreSetting.loopInt; 							// set up looping time, default is 30, which means we check only 30 title every time.
	if (rcSetting.maxPostsNum - rcSetting.postStartIndex < loopLimit)		// If the data we fetched less than 30, we have to determine how many posts we need to check.
	{													// It's easy. (maxPostsNum - postStartIndex+1) is the answer.
		loopLimit = rcSetting.maxPostsNum - rcSetting.postStartIndex + 1;
	}	
	for (var j = 0 ; j < loopLimit ; j++)				// This is main loop to chekc if the title of the link exists.
	{
		postLink = posts.feed.entry[j].link[0].href;
		if (postLink == orgLink)
		{
			return posts.feed.entry[j].title.$t;
			break;			
		}
	}
	if (rcSetting.postStartIndex+loopLimit-1 == rcSetting.maxPostsNum)		// If all posts have been checked and no title found, return error message 
	{
		return '<span class="gotNothing">&nbsp;</span>';
	}
	else
	{
		return '<span class="noTitleMessage">&nbsp;</span>';							// If title can not be found within a cycle, prepare to check again.
	}
};
//----------- Some actions run after list of comments are created. ---------------
rcFunction.RunAfterDomReady = function ()
{
	jQuery('#divrc li').find('.comcontent').hide().end().find('.rcfold').hover(
	function(){jQuery(this).css({cursor:'pointer'});},
	function(){jQuery(this).css({cursor:'default'});}).click(
	function() {
		var comment = jQuery(this).parent().find('.comcontent');
		if (comment.is(':visible')) {
			jQuery(this).css('background','url(' + rcPreSetting.rcFoldImage[0] + ') center no-repeat');
			jQuery(this).parent().find('.rcsay').html(rcPreSetting.rcFoldImage[1]);
			comment.hide();
		} 
		else 
		{
			jQuery(this).css('background','url(' + rcPreSetting.rcFoldImage[2] +') center no-repeat');
			jQuery(this).parent().find('.rcsay').html(rcPreSetting.rcFoldImage[3]);
			comment.show();
		}
			});
	if (rcSetting.showAllFlag) {rcSetting.showAllFlag= false; rcFunction.showOrHideAll();}
};

// ----------- Handler for showing  or hiding all comment -----------
// ----------- Dynamic onclick does not work, so I merge two function into one. it seems working and running better ! 10/17 -----------
rcFunction.showOrHideAll = function()
{
	if (rcSetting.showAllFlag)
	{
		jQuery('.comcontent').hide();
		jQuery('.rcfold').css('background','url('+ rcPreSetting.rcFoldImage[0] +') center no-repeat');
		jQuery('#headerButton a:eq(0)').html(rcPreSetting.rcFoldImage[5]);
		jQuery('#divrc .rcsay').html(rcPreSetting.rcFoldImage[1]);
		rcSetting.showAllFlag = false;
	}
	else
	{
		jQuery('.comcontent').show();
		jQuery('.rcfold').css('background','url('+ rcPreSetting.rcFoldImage[2] +') center no-repeat');
		jQuery('#headerButton a:eq(0)').html(rcPreSetting.rcFoldImage[6]);
		jQuery('#divrc .rcsay').html(rcPreSetting.rcFoldImage[3]);
		rcSetting.showAllFlag = true;
	}	
};

/*----------- ChangePage, backward, forward, or jump ---------------
//----------- Direction = -1, backward                             ---------------
//----------- Direction =  0, jump by index                      ---------------
//----------- Direction =  1,  forward                               ---------------
//----------- Direction =  2,  jump by date                       ---------------
//----------- indexIwant is index I want                         --------------*/
rcFunction.changePage = function(direction,indexIwant)
{
	var jump = true;
	if (direction == 1) // Next page
		rcSetting.commentStartIndex += rcPreSetting.g_iShowCount;
	else if (direction == -1) // previsous page
		rcSetting.commentStartIndex -= rcPreSetting.g_iShowCount;
	else
	{//rcFunction.gotoIndexIwant = function (indexIwant)
		if (indexIwant > rcSetting.commentTotalNum)
			indexIwant = rcSetting.commentTotalNum;
		else if (indexIwant < 1)
			indexIwant = 1;
		var pageNumber = Math.ceil(indexIwant/rcPreSetting.g_iShowCount);
		if (pageNumber == Math.ceil(rcSetting.commentStartIndex/rcPreSetting.g_iShowCount))
			jump = false;
		else
			rcSetting.commentStartIndex = (pageNumber-1)*rcPreSetting.g_iShowCount + 1;	
	}
	if (jump)// 同一頁不跳， 不同頁我跳
	{
		jQuery('#jsonCommnets').remove();
		jQuery('#jsonPosts').remove();
		jQuery('#divrc').next().remove().end().after('<div id="loading">'+rcPreSetting.rcFoldImage[4]+'</div>');
		if (rcSetting.commentStartIndex + rcPreSetting.g_iShowCount > rcSetting.commentTotalNum)
			rcFunction.fetchComments(rcSetting.commentStartIndex, rcSetting.commentTotalNum - rcSetting.commentStartIndex + 1);
		else
			rcFunction.fetchComments(rcSetting.commentStartIndex, rcPreSetting.g_iShowCount);
	}
};

// ----------- Run after DOM ready -----------
jQuery(document).ready(function()
{ 	
	//----------- Create basic structure---------------
	var rcStart = jQuery('div.widget-content').filter(':contains(###recentComment###)').slice(0,1); // Choise only the first tag we found. 9/23
	if(rcStart.length > 0)
	{
		rcStart.find('script').remove(); //fix script confict while two script in the same widget. 08/24/2007
		rcStart.html(rcStart.html().replace(/###recentComment###/i,'<div id="divrc"></div>'));
		jQuery('#divrc').html(rcPreSetting.rcFoldImage[4]);
		rcFunction.addHeaderButton();
		// Why not add footer here? Because the info in footer is mainly depending on the comment body
		rcFunction.fetchComments(rcSetting.commentStartIndex, rcPreSetting.g_iShowCount);
	}
});