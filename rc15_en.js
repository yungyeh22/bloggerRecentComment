//----------- Define Global Variables, can be modified---------------
var g_szHead;       if (g_szHead==undefined)		g_szHead ='[Latest Comments]'; 		//Your Title
var g_szBlogDomain; if (g_szBlogDomain==undefined) 	g_szBlogDomain='lvchen.blogspot.com';	// Your blogger name: 
var g_iShowCount;   if (g_iShowCount==undefined)   	g_iShowCount=10;						// How many comments per page
else if (g_iShowCount>99)						 	g_iShowCount=99;						// It has to be between 1 ~ 99
var noTitle;		if (noTitle==undefined) 		noTitle = 'Post Deleted';				// If you have ever deleted any post, the title cannot be found. Write you error message here.
var loopInt;		if (loopInt==undefined) 		loopInt = 30;							// How many titles are checked per time? Large value may cause slow page loading but sometimes not. 
var commentsRSS; 																			// If you use Feedburner to burn your comment feed, Enter full URL here.
if (commentsRSS == undefined) 
	commentsRSS = '<a href="http://' + g_szBlogDomain + '/feeds/comments/default?alt=rss">';
else
	commentsRSS = '<a href="'+ commentsRSS +'">';
//----------- Define Global Variables, can NOT be modified---------------
var rcSetting = {
recent_comment_ver:'1.5',
maxPostsNum:0,					// Max posts number
commentStartIndex : 1,			// find comment from 
postStartIndex : 1,				// find title from
commentTotalNum : 0,			// Total comments number
showAllFlag : 0					// Check if the showAll button clicked
};
var rcFunction = {};		// The only Globa function
//----------- Create basic structure---------------
document.write('<h2>' + g_szHead + commentsRSS + '<img border="0" src="http://www.google.com/calendar/hosted/writers.idv.tw/images/rss.gif"/></a></h2><div id="divrc"></div>');
jQuery('#divrc').html('Laoding...<img src="http://lvchen716.googlepages.com/2-0.gif"\>');
// ----------- Add header buttons---------------
	jQuery('#divrc').before('<div id="headerButton"><a href="javascript:rcFunction.showAll();">Expand All</a></div>');
jQuery.noConflict();
//----------- Get Today's Date---------------
timestr = new Date();
var toDay = timestr.getYear().toString()+'-';
if (timestr.getMonth() < 9)
	toDay += '0'+(timestr.getMonth()+1).toString()+'-';
else 
	toDay += (timestr.getMonth()+1).toString()+'-';
if (timestr.getDate()<10)
	toDay += '0'+timestr.getDate().toString();
else
	toDay += timestr.getDate().toString();
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
rcFunction.hideAll = function()
{ 
	jQuery('.comcontent').hide();
	jQuery('.fold').css('background','url(http://lvchen716.googlepages.com/0609_f.gif) center no-repeat');
	jQuery('#headerButton a:eq(0)').attr('href','javascript:rcFunction.showAll();').text('Expand All');
	rcSetting.showAllFlag = 0;
};
rcFunction.showAll = function()
{
	jQuery('.comcontent').show();
	jQuery('.fold').css('background','url(http://lvchen716.googlepages.com/0609_uf.gif) center no-repeat');
	jQuery('#headerButton a:eq(0)').attr('href','javascript:rcFunction.hideAll();').text('Collapse All');
	rcSetting.showAllFlag = 1;
};
rcFunction.fetchComments = function(Index,increment)
{
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
// Look for title, posts: posts JSON  Feed, orgLink: the URL you wish to look for
rcFunction.a_FindTitle = function (posts,orgLink)
{
	var postLink;
	var loopLimit = loopInt; 							// set up looping time, default is 30, which means we check only 30 title every time.
	if (rcSetting.maxPostsNum - rcSetting.postStartIndex < loopLimit)		// If the data we fetched less than 30, we have to determine how many posts we need to check.
	{													// It's easy. (maxPostsNum - postStartIndex) is the answer.
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
		return '<i>'+ noTitle +'</i>';
	}
	else
	{
		return '<i>&nbsp;</i>';							// If title can not be found within a cycle, prepare to check again.
	}
};
// How do we find the title of a post that we miss at first check?
// We look again and then use jQuery to replace '<i>&nbsp;</i>'
// This function is called by titleCheck ONLY.
rcFunction.findLossTitles = function (postTitles)
{
	var checkLink = '';
	var checkTitle = '';
	var x=0;
	jQuery("#divrc li").each(function(x)
	{		
		if (jQuery('i:eq(0)',this).html() == '&nbsp;')
		{
			var link = jQuery('a:eq(1)',this).attr('href');
			if (link == checkLink)
			{
				var g_szTitle = checkTitle;
			}
			else
			{
				var g_szTitle = rcFunction.a_FindTitle(postTitles,link);
				if (g_szTitle != '&nbsp;')
				{
					checkTitle = g_szTitle;
					checkLink = link;
				}
			}
			jQuery('i:eq(0)',this).remove();
			jQuery('b:eq(0)',this).html(g_szTitle);
		}		
	});
	rcFunction.titleCheck();
};
// We use this function to check if any title is missed.
rcFunction.titleCheck = function()
{
	var y;
	var ohoh=1;
		jQuery("#divrc li").each(function(y)
	{	
		if (jQuery('i:eq(0)',this).html() == '&nbsp;')
		{
			ohoh = 0;y =9;
		}
	});
	if (ohoh == 0)
	{
		rcSetting.postStartIndex+=30;
		if (jQuery('#jsonPosts'))
			jQuery('#jsonPosts').remove();
		var y_script = document.createElement('script');
		callbacksrc = 'http://' + g_szBlogDomain + 	'/feeds/posts/summary?alt=json-in-script&callback=rcFunction.findLossTitles&max-results=30&start-index='+ rcSetting.postStartIndex;
		y_script.setAttribute('src',callbacksrc);
		y_script.setAttribute('id', 'jsonPosts');
		y_script.setAttribute('type', 'text/javascript');
		document.documentElement.firstChild.appendChild(y_script);
	}	
	else
	{
		rcSetting.postStartIndex = 1;
		function showButton()
		{
			var commentInfo = '<p id="showfooterButton">Displaying comments '+ rcSetting.commentStartIndex +'~'+ (rcSetting.commentStartIndex+itemsPerPage-1) +' of '+ rcSetting.commentTotalNum +' comments';
			var footerButton;
			jQuery('#loading').remove();
			if (rcSetting.commentStartIndex == 1)
			{
				if (rcSetting.commentTotalNum == g_iShowCount)
				footerButton = '</p>';
				else
				footerButton = '<br><a href="javascript:rcFunction.prevTen();">Next</a></p>';
			}
			else if (rcSetting.commentStartIndex+g_iShowCount > rcSetting.commentTotalNum)
			{
				footerButton = '<br><a href="javascript:rcFunction.nextTen();">Previous</a></p>';
			}
			else 
			{
				footerButton = '<br><a href="javascript:rcFunction.nextTen();">Previous</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:rcFunction.prevTen();">Next</a></p>';
			}
			jQuery('#divrc').after(commentInfo + footerButton);
		}		
		showButton();
	}
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
		var auther= comment.author[0].name.$t;  // Author's Name
		link = orgLink +'#comment-'+ link.substring(iFind+1,link.length); // add '#comment-' into link, this matches blogger format
		var timestamp=comment.published.$t.substr(0,10); // Determine date and time.
		if (timestamp == toDay) 
			timestamp = 'Today '+comment.published.$t.substr(11,5);
		// Create Authour's information 
		var g_szAuthorsLink= '<a href="' + link + '" title="' + timestamp + '&#65306;' + short_content + '">' + auther + '</a>';
		var g_orignalLink = '<a href="'+ orgLink + '"><b>'+ g_szTitle +'</b></a>';
		var expendStyle= '<span class="fold" title="expand">&nbsp;&nbsp;&nbsp;</span> ';
		temp += '<li>'+ expendStyle + g_szAuthorsLink + ' on '+g_orignalLink+'<span class="say"> leave you a message </span><span class="comcontent">&#12300;' + 	content + '&#12301;</span> - ' +  timestamp + '</li>';
	}
	temp+='</ul>';   
	jQuery('#divrc').html(temp);
	jQuery(document).ready(function()
	{ 	
		jQuery('#divrc li').css({listStyle:'none',background:'none'}).find('.fold').css('background','url(http://lvchen716.googlepages.com/0609_f.gif) center no-repeat');
		rcFunction.RunAfterDomReady();
	});
	rcFunction.titleCheck();
};
rcFunction.RunAfterDomReady = function ()
{
		jQuery('#divrc li').find('.comcontent').hide().end().find('.fold').hover(
		function(){jQuery(this).css({cursor:'pointer'});},
		function(){jQuery(this).css({cursor:'default'});}).click(
		function() {
			var comment = jQuery(this).parent().find('.comcontent');
			if (comment.is(':visible')) {
				jQuery(this).css('background','url(http://lvchen716.googlepages.com/0609_f.gif) center no-repeat').attr("title","展開");
				jQuery(this).parent().find('.say').text('leave you a message');
				comment.hide();
			} 
			else 
			{
				jQuery(this).css('background','url(http://lvchen716.googlepages.com/0609_uf.gif) center no-repeat').attr("title","收合");
				jQuery(this).parent().find('.say').text(' said: ');
				comment.show();
			}
				});
	if (rcSetting.showAllFlag == 1)	rcFunction.showAll();
	
};
//----------- Callback function for Next ---------------
rcFunction.prevTen = function()
{
	rcSetting.commentStartIndex += g_iShowCount;
	jQuery('#jsonCommnets').remove();
	jQuery('#jsonPosts').remove();
	jQuery('#divrc').next().remove().end().after('<div id="loading"><img src="http://lvchen716.googlepages.com/2-0.gif"\> Loading...</div>');
	if (rcSetting.commentStartIndex + g_iShowCount > rcSetting.commentTotalNum)
		rcFunction.fetchComments(rcSetting.commentStartIndex, rcSetting.commentTotalNum - rcSetting.commentStartIndex + 1);
	else
		rcFunction.fetchComments(rcSetting.commentStartIndex, g_iShowCount);
};
//----------- Callback function for Previous ---------------
rcFunction.nextTen = function()
{
	rcSetting.commentStartIndex -= g_iShowCount;
	jQuery('#jsonCommnets').remove();
	jQuery('#jsonPosts').remove();
	jQuery('#divrc').next().remove().end().after('<div id="loading"><img src="http://lvchen716.googlepages.com/2-0.gif"\> 載入中...</div>');
	rcFunction.fetchComments(rcSetting.commentStartIndex, g_iShowCount);
};
jQuery(document).ready(function()
{ 	
	rcFunction.fetchComments(rcSetting.commentStartIndex, g_iShowCount);
});
