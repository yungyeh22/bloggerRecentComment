//----------- Define Global Variables, can be modified---------------
var g_szBlogDomain; if (g_szBlogDomain==undefined) 	g_szBlogDomain='lvchen.blogspot.com';	// 這裡放入你的 blogger 網址
var g_szHead;       if (g_szHead==undefined)		g_szHead ='《最新的回應》&nbsp;&nbsp;'+ '<a href="http://' + g_szBlogDomain + '/feeds/comments/default?alt=rss"><img border="0" src="http://www.google.com/calendar/hosted/writers.idv.tw/images/rss.gif"/></a>';	//標題顯示的名稱
var g_iShowCount;   if (g_iShowCount==undefined)   	g_iShowCount=10;						// 一次顯示幾篇留言
else if (g_iShowCount>99)						 	g_iShowCount=99;						// 最大值不能超過 99
var noTitle;		if (noTitle==undefined) 		noTitle = '原文被刪除，標題找不到';		//如果原文被刪除，就會找不到標題，這裡設定提示的訊息
var loopInt;		if (loopInt==undefined) 		loopInt = 30;							// 一次取回的標題數量，數值大小與 loading 速度有關，但不一定愈大愈慢
var rcFoldImage; 	if (rcFoldImage == undefined) 	rcFoldImage = [
'http://lvchen716.googlepages.com/0609_f.gif' ,'留了言',
'http://lvchen716.googlepages.com/0609_uf.gif','留言說:',
'<img src="http://lvchen716.googlepages.com/2-0.gif"/>&nbsp;載入中...'];
var rcAuthorLinkFormat; if (rcAuthorLinkFormat == undefined) 
rcAuthorLinkFormat = '<a href="#link#" title="#timestamp# &#65306; #short_content#">#author#</a>';
var rcTitleLinkFormat;if (rcTitleLinkFormat == undefined) 
rcTitleLinkFormat = '<a href="#orgLink#">#g_szTitle#</a>';
var createDisplayFormat;if (createDisplayFormat == undefined) 
createDisplayFormat = '#rcAuthorLinkFormat# 於 #rcTitleLinkFormat# #rcSay# #&#12300;content&#12301;# - #timestamp#';
var rcDateFormat; if (rcDateFormat == undefined) rcDateFormat = 1; // 1 indicates regulate expression (from blogger), 2 indicates .... I don't know...

//----------- Define Global Variables, can NOT be modified---------------
jQuery.noConflict();

var rcSetting = {
recent_comment_ver:'1.6',
maxPostsNum:0,					// Max posts number
commentStartIndex : 1,			// find comment from 
postStartIndex : 1,				// find title from
commentTotalNum : 0,			// Total comments number
showAllFlag : 0			// Check if the showAll button clicke
};
var rcFunction = {};		// The only Globa function...maybe
//----------- Create basic structure---------------
document.write('<h2 id="yrcTitle" style="display:none">' + g_szHead +'</h2><div id="divrc" style="display:none"></div>'); // Write something when DOM is creating
// ----------- Add header buttons---------------
rcFunction.addHeaderButton = function ()
{
	var headerButton;

	headerButton = '<div id="headerButton">	<a id ="showAllButton" href="javascript:rcFunction.showAll();">全部展開</a>	<form style= "display:inline;margin-left:1em" name="jumpForm" action="">跳至留言&nbsp;&nbsp;<input style="text-align:center; width:2em" type="text" name="itemJump" value="1"  onkeypress="if(window.event.keyCode==13) {rcFunction.gotoIndexIwant(itemJump.value); return false;}"/>&nbsp;<input id="jumpButton" type="button" value="我跳" onclick="rcFunction.gotoIndexIwant(itemJump.value);"/></form></div>';
	jQuery('#divrc').before(headerButton);
};
rcFunction.gotoIndexIwant = function (indexIwant)
{
	if (indexIwant > rcSetting.commentTotalNum)
		indexIwant = rcSetting.commentTotalNum;
	else if (indexIwant < 1)
		indexIwant = 1;
	var pageNumber = Math.ceil(indexIwant/g_iShowCount);
	// 同一頁不跳， 不同頁我跳
	if (pageNumber != Math.ceil(rcSetting.commentStartIndex/g_iShowCount))
	{
		rcSetting.commentStartIndex = (pageNumber-1)*g_iShowCount + 1;
		jQuery('#jsonCommnets').remove();
		jQuery('#jsonPosts').remove();
		jQuery('#divrc').next().remove().end().after('<div id="loading">'+rcFoldImage[4]+'</div>');
		if (rcSetting.commentStartIndex + g_iShowCount > rcSetting.commentTotalNum)
			rcFunction.fetchComments(rcSetting.commentStartIndex, rcSetting.commentTotalNum - rcSetting.commentStartIndex + 1);
		else
			rcFunction.fetchComments(rcSetting.commentStartIndex, g_iShowCount);
	}
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
	if (g_iShowCount > rcSetting.commentTotalNum) 
		g_iShowCount = rcSetting.commentTotalNum;
	rcFunction.fetchPostsTitle(rcSetting.postStartIndex, loopInt);
};
rcFunction.fetchComments = function(Index,increment)
{
	jQuery ('#jumpButton').attr('disabled','disabled');
	var y_script = document.createElement('script');
	var callbacksrc = 'http://' + g_szBlogDomain + '/feeds/comments/default?alt=json-in-script&callback=rcFunction.commentJSONfeed&max-results=' + increment + '&start-index='+ Index;
	y_script.setAttribute('src',callbacksrc);
	y_script.setAttribute('id', 'jsonCommnets');
	y_script.setAttribute('type', 'text/javascript');
	document.documentElement.firstChild.appendChild(y_script);
};
rcFunction.fetchPostsTitle = function(Index, increment)
{
	var y_script = document.createElement('script');
	callbacksrc = 'http://' + g_szBlogDomain + 	'/feeds/posts/summary?alt=json-in-script&callback=rcFunction.titleJSONfeed&max-results='+ increment + '&start-index=' + Index;
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
		var content = comment.content.$t;   // The complete content of a comment.
		var short_content = comment.title.$t; // short content = title , This is not a summary but can be use as one.
		var link = comment.link[0].href; // author's link, use this link to look for original link of the post.
		var iFind = link.indexOf('#'); // The index number for determining post link. 
		
		if (iFind>0)
			var orgLink = link.substring(0,iFind); // Post link
			
		if (orgLink != checkLink)  // if the previous comment is from the same post, then we don't have to look for the title of the post
		{
			var g_szTitle = rcFunction.a_FindTitle(posts,orgLink); 
			checkTitle = g_szTitle;
			checkLink  = orgLink;
		}
		else
			var g_sztitle = checkTitle;
		var author= comment.author[0].name.$t;  // Author's Name
		link = orgLink +'#comment-'+ link.substring(iFind+1,link.length); // add '#comment-' into link, this matches blogger format
		//----------- Select Date Format and do some necessary modification---------------
		if (rcDateFormat == 1)
		{
			var timestamp=comment.published.$t.substr(0,10); // Determine date and time.
			if (checkTodayDate(timestamp))
			timestamp = '今天 '+comment.published.$t.substr(11,5);
		}
		else if (rcDateFormat == 2)
			var timestamp=monthConvert(comment.published.$t.substr(5,2))+'&nbsp;'+comment.published.$t.substr(8,2);
		// fix short_content masses up author display
		short_content = short_content.replace(/"/gim,"&quot;"); 
		// Create Authour's information 
		var g_szAuthorsLink = rcAuthorLinkFormat;
		g_szAuthorsLink = g_szAuthorsLink.replace(/#link#/,link);
		g_szAuthorsLink = g_szAuthorsLink.replace(/#timestamp#/,timestamp);
		g_szAuthorsLink = g_szAuthorsLink.replace(/#short_content#/, short_content);
		g_szAuthorsLink = g_szAuthorsLink.replace(/#author#/, author);
		// Create title information 
		var g_orignalLink = rcTitleLinkFormat;
		g_orignalLink = g_orignalLink.replace(/#orgLink#/,orgLink);
		g_orignalLink = g_orignalLink.replace(/#short_content#/,short_content);
		g_orignalLink = g_orignalLink.replace(/#g_szTitle#/,'<span class = rcPostTitle>' + g_szTitle + '</span>');
		g_orignalLink = g_orignalLink.replace(/#timestamp#/,timestamp);
		var expendStyle= '<span class="rcfold" title="展開">&nbsp;&nbsp;&nbsp;</span> ';
		// Finally, create the comment list
		temp += '<li>'+ expendStyle;
		temp += createDisplayFormat;
		temp = temp.replace(/#rcAuthorLinkFormat#/,g_szAuthorsLink);
		temp = temp.replace(/#rcTitleLinkFormat#/,g_orignalLink);
		temp = temp.replace(/#rcSay#/,'<span class="rcsay">'+rcFoldImage[1]+'</span>');
		temp = temp.replace(/#(\S+)content(\S+)#/, '<span class="comcontent">$1'+content+'$2</span>');
		temp = temp.replace(/#timestamp#/,'<span class="rcTimeStamp">' + timestamp + '</span>');	
		temp += '</li>';
	}
	temp+='</ul>';   
	jQuery('#divrc').html(temp);
	// Some necessary operations to match custom format
	jQuery(document).ready(function()
	{
		if (jQuery('#divrc li .comcontent').html() != null)
		{// folding feature is used when full content exists.
			jQuery('#divrc li').css({listStyle:'none',background:'none'}).find('.rcfold').css('background','url('+rcFoldImage[0]+') center no-repeat');
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
	var ohoh = 0;
		jQuery("#divrc li").each(function(y)
	{	
		if (jQuery('.noTitleMessage',this).html() == '&nbsp;')
		{
			ohoh = 1;y = g_iShowCount;
		}
	});
	if (ohoh == 1)
	{
		rcSetting.postStartIndex+=loopInt;
		if (jQuery('#jsonPosts')>0)
			jQuery('#jsonPosts').remove();
		var y_script = document.createElement('script');
		callbacksrc = 'http://' + g_szBlogDomain + 	'/feeds/posts/summary?alt=json-in-script&callback=rcFunction.findLossTitles&max-results=' + loopInt + '&start-index='+ rcSetting.postStartIndex;
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
			var commentInfo = '<p id="showfooterButton">您正在看留言 '+ rcSetting.commentStartIndex +'~'+ (rcSetting.commentStartIndex+itemsPerPage-1) +'，共有 '+ rcSetting.commentTotalNum +' 則留言';
			var footerButton;
			jQuery('#loading').remove();
			jQuery('#jumpButton').removeAttr('disabled');
			if (rcSetting.commentStartIndex == 1)
			{
				if (rcSetting.commentTotalNum == g_iShowCount)
				footerButton = '</p>';
				else
				footerButton = '<br><a href="javascript:rcFunction.prevTen();">下一頁</a></p>';
			}
			else if (rcSetting.commentStartIndex+g_iShowCount > rcSetting.commentTotalNum)
			{
				footerButton = '<br><a href="javascript:rcFunction.nextTen();">上一頁</a></p>';
			}
			else 
			{
				footerButton = '<br><a href="javascript:rcFunction.nextTen();">上一頁</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:rcFunction.prevTen();">下一頁</a></p>';
			}
			jQuery('#divrc').after(commentInfo + footerButton);
		}		
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
				checkTitle = g_szTitle;
				checkLink = link;
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
	var loopLimit = loopInt; 							// set up looping time, default is 30, which means we check only 30 title every time.
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
		return '<span class="noTitleMessage">'+ noTitle +'</span>';
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
				jQuery(this).css('background','url(' + rcFoldImage[0] + ') center no-repeat').attr("title","展開");
				jQuery(this).parent().find('.rcsay').text(rcFoldImage[1]);
				comment.hide();
			} 
			else 
			{
				jQuery(this).css('background','url(' + rcFoldImage[2] +') center no-repeat').attr("title","收合");
				jQuery(this).parent().find('.rcsay').text(rcFoldImage[3]);
				comment.show();
			}
				});
	if (rcSetting.showAllFlag == 1)	rcFunction.showAll();	
};
rcFunction.hideAll = function()
{ 
	jQuery('.comcontent').hide();
	jQuery('.rcfold').css('background','url(http://lvchen716.googlepages.com/0609_f.gif) center no-repeat');
	jQuery('#headerButton a:eq(0)').attr('href','javascript:rcFunction.showAll();').text('全部展開');
	rcSetting.showAllFlag = 0;
};
rcFunction.showAll = function()
{
	jQuery('.comcontent').show();
	jQuery('.rcfold').css('background','url(http://lvchen716.googlepages.com/0609_uf.gif) center no-repeat');
	jQuery('#headerButton a:eq(0)').attr('href','javascript:rcFunction.hideAll();').text('全部隱藏');
	rcSetting.showAllFlag = 1;
};
//----------- Callback function for 下一頁 ---------------
rcFunction.prevTen = function()
{
	rcSetting.commentStartIndex += g_iShowCount;
	jQuery('#jsonCommnets').remove();
	jQuery('#jsonPosts').remove();
	jQuery('#divrc').next().remove().end().after('<div id="loading">'+rcFoldImage[4]+'</div>');
	if (rcSetting.commentStartIndex + g_iShowCount > rcSetting.commentTotalNum)
		rcFunction.fetchComments(rcSetting.commentStartIndex, rcSetting.commentTotalNum - rcSetting.commentStartIndex + 1);
	else
		rcFunction.fetchComments(rcSetting.commentStartIndex, g_iShowCount);
};
//----------- Callback function for 上一頁 ---------------
rcFunction.nextTen = function()
{
	rcSetting.commentStartIndex -= g_iShowCount;
	jQuery('#jsonCommnets').remove();
	jQuery('#jsonPosts').remove();
	jQuery('#divrc').next().remove().end().after('<div id="loading">'+rcFoldImage[4]+'</div>');
	rcFunction.fetchComments(rcSetting.commentStartIndex, g_iShowCount);
};
jQuery(document).ready(function()
{ 	
	if(jQuery('div.widget-content').contains('###recentComment###').length > 0)
	{
		jQuery('#yrcTitle').remove();
		jQuery('#divrc').remove();
		jQuery('div.widget-content').contains('###recentComment###').find('script').remove();
		jQuery('div.widget-content').contains('###recentComment###').html(jQuery('div.widget-content').contains('###recentComment###').html().replace(/###recentComment###/g,'<h2 id="yrcTitle">' + g_szHead +'</h2><div id="divrc"></div>'));
	}
	else
	{
		jQuery('#yrcTitle').removeAttr('style');
		jQuery('#divrc').removeAttr('style');	
	}
	jQuery('#divrc').html(rcFoldImage[4]);
	rcFunction.addHeaderButton();
	rcFunction.fetchComments(rcSetting.commentStartIndex, g_iShowCount);
});