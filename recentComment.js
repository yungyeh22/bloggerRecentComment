// Recent Comment 2.0 programmed by LVCEHN
// The JS script is used for blogger.com to show  recent comments using Google JSON-IN-SCRIPT callback method. 
// You can use it as an widget in your blog. The little program will display your comments wiht a nice appearance and you can even custom your own appearance.
// For installation, please vist http://lvchen716.googlepages.com/rc20_eng 
// LVCHEN's Recent comment licensed under a Creative Commons Attribution 3.0 License
// This means you can copy, reuse, or distribute it legally. 
// But please notice that, for any reuse or distribution, you must make clear to others the license terms of this work. The best way to do this is with a link to LVCHEN's blog (http://lvchen.blogspot.com or the installation page) .
// Any of the above conditions can be waived if you get permission from the copyright holder, which is me, LVCHEN . You can write me a mail for furture information (lvchen.blog@m2k.com.tw)
// Apart from the remix rights granted under this license, nothing in this license impairs or restricts the author's moral rights.
// Have fun with this wonderful google blogger widget !!!

//----------- Define Global Variables, can be modified---------------

var rcPreSetting = {
g_szBlogDomain:'lvchen.blogspot.com',
g_iShowCount: 10,
noContent: ['Post not found','<p>No comment!</p>'],
cachesize: 40,
showJumpButton:true,
showRCnoPost:false,
rcFoldImage:[
'http://lvchen.hostse.com/rc20/rc_0609_f.gif','left a message',
'http://lvchen.hostse.com/rc20/rc_0609_uf.gif','wrote:',
'<img src="http://lvchen.hostse.com/rc20/2-0.gif"/>&nbsp;Loading...',
'Show All','Hide All'],
otherText:['Go to #','Go','Prev','Next','Message # %range%. There are %totalNum% messages.'],
reply:['http://lvchen.hostse.com/rc20/external.png','Say Something!'],
rcAuthorLinkFormat:'<a href="%link%" title="%timestamp% &#65306; %short_content%">%author%</a>',
rcTitleLinkFormat: '<a href="%orgLink%">%g_szTitle%</a>',
createDisplayFormat:'On %rcTitleLinkFormat%%replyImg%, %rcAuthorLinkFormat% %rcSay% &#12300;%content%&#12301; - %timestamp%',
today:'Today',
authorLink:true,
rcDateFormat: 1
};

// add %replyURL% and %replyImg%

//----------- Define Global Variables, should NOT be modified---------------
jQuery.noConflict();

var rcSetting = {
g_szComments:[],
maxPostsNum:0,					// Max posts number
commentStartIndex : 1,			// find comment from 
commentTotalNum : 0,			// Total comments number
showAllFlag : false,			// Check if the showAll button clicke
outDate:0,
titleArr:[],
linkArr:[],
replyArr:[]
};
var rcFunction = {};		// The only Globa function...maybe

// ----------- Add header buttons---------------
rcFunction.addHeaderButton = function ()
{
	var headerButton = '<div id="headerButton"><a id ="showAllButton" href="javascript:rcFunction.showOrHideAll();">'+rcPreSetting.rcFoldImage[5]+'</a>';
	if (rcPreSetting.showJumpButton)
	headerButton += '<form style= "display:inline;margin-left:1em" onsumbit="return false" name="jumpForm" action=""><span id="jumpSet">'+rcPreSetting.otherText[0]+'&nbsp;&nbsp;<input style="text-align:center; width:2em" type="text" name="itemJump" value="1"  onkeypress="if(event.keyCode==13||event.which == 13) {rcFunction.changePage(0,this.value); return false;}"/>&nbsp;<input id="jumpButton" type="button" value="'+rcPreSetting.otherText[1]+'" onclick="rcFunction.changePage(0,itemJump.value);"/></span></form></div>';
	else
	headerButton += '</div>';
	jQuery('#divrc').before(headerButton);
};

//----------- Fetch comment JSON feed, several variables that is comments related are determine here ---------------
rcFunction.commentJSONfeed = function (json) 
{
	if (json.feed.entry!=undefined)
	{
		rcSetting.g_szComments = json.feed.entry;
		if (rcSetting.commentTotalNum == 0)
			rcSetting.commentTotalNum = json.feed.openSearch$totalResults.$t*1;   // Retrive total number of comments
		if (rcPreSetting.g_iShowCount > rcSetting.commentTotalNum)
			rcPreSetting.g_iShowCount = rcSetting.commentTotalNum;

		rcFunction.fetchPostsTitle(1,'');
	}
	else
	{
		jQuery('#divrc').html(rcPreSetting.noContent[1]);
	}
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
rcFunction.fetchPostsTitle = function(Index,source)
{
	if (rcSetting.linkArr.length > 0 & source == '')
	{
		rcFunction.titleJSONfeed('');
	}
	else
	{
		var y_script = document.createElement('script');
		if (source !='')
			callbacksrc = source + '?&alt=json-in-script&callback=rcFunction.findLossTitles';
		else		
			callbacksrc = 'http://' + rcPreSetting.g_szBlogDomain +	'/feeds/posts/summary?max-results='+ rcPreSetting.cachesize + '&start-index=' + Index + '&alt=json-in-script&callback=rcFunction.titleJSONfeed';
		y_script.setAttribute('src',callbacksrc);
		y_script.setAttribute('id', 'jsonPosts');
		y_script.setAttribute('type', 'text/javascript');
		document.documentElement.firstChild.appendChild(y_script);
	}
};
rcFunction.findTitle = function(orgLink)
{
	var loop = rcPreSetting.cachesize; 				// set up looping time, default is 30, which means we check only 30 title every time.
	for (var j = 0 ; j < loop ; j++)				// This is main loop to chekc if the title of the link exists.
	{
		if (rcSetting.linkArr[j] == orgLink)
		{
			break;			
		}
	}
	if (j != loop)
		return j;
	else
	{
		//return '<span class="noTitleMessage">&nbsp;</span>';							// If title can not be found within a cycle, prepare to check again.
		return -1;
	}
	
};

//----------- An inner funciton that converts Month---------------
rcFunction.monthConvert = function(monthIndex)
{
	var monthName=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	return monthName[(parseInt(monthIndex,10)-1)];
};

//----------- An inner function that check dates Get Today's Date---------------
rcFunction.checkTodayDate = function(dateString)
{
	var timeStr = new Date();
	var rcDateStr = new Date(parseInt(dateString.substr(0,4),10),parseInt(dateString.substr(5,2),10)-1,parseInt(dateString.substr(8,2),10));
	//alert, I am not sure this method is working, Better test before try. 04/04/2008
	//rcDateStr.setFullYear(parseInt(dateString.substr(0,4),10),parseInt(dateString.substr(5,2),10)-1,parseInt(dateString.substr(8,2),10));
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
};


//----------- Fetch posts JSON feed, several variables that is comments related are determine here ---------------
//----------- Look for matched titles and show comments ---------------
rcFunction.titleJSONfeed = function (posts)
{	
	// initial variables
	var temp = '<ul id="feedItemListDisplay">';
	var checkLink = '' ;
	var checkTitle = '';
	var reaplyImg,replyURL,findIdx,g_szTitle,linkidx;
	// Cache title and its URL
	//replyURL = posts.feed.entry[0].link[1].href;
	if (rcPreSetting.createDisplayFormat.indexOf('%rcTitleLinkFormat%') != -1) //cache if we need to find a title
	{
		if (posts != '' && posts.feed.entry != undefined)
		{
			var entries = posts.feed.entry;
			if (rcSetting.maxPostsNum == 0)
				rcSetting.maxPostsNum = posts.feed.openSearch$totalResults.$t*1;
			if (entries.length*1 < rcPreSetting.cachesize) // if only a few posts, correct the cachesize
				rcPreSetting.cachesize = entries.length*1;
			for (var i = 0 ; i < rcPreSetting.cachesize ; i++)
			{
				var titleLinkIdx = replyLinkIdx ='';
				var j = 0;
				while (j < entries[i].link.length)
				{
					if (entries[i].link[j].rel == "alternate")
						titleLinkIdx = j;
					else if (entries[i].link[j].rel == "replies" && entries[i].link[j].type == 'text/html')
						replyLinkIdx = j;
					if (titleLinkIdx!='' && replyLinkIdx!='')
						break;
					j++;
				}
				rcSetting.linkArr[i] = entries[i].link[titleLinkIdx].href;
				rcSetting.titleArr[i] = entries[i].title.$t;
				if (replyLinkIdx!='')
					rcSetting.replyArr[i] = entries[i].link[replyLinkIdx].href;
				else
					rcSetting.replyArr[i] = '';
			}
		}
	}
	//----------- Main loop to create a list of comments  -------------------------------------------------------
	//----------- Post URLs are located and compared for getting the name of its title	 ---------------
	for (i=0; i < rcSetting.g_szComments.length*1; i++)
	{
		var comment = rcSetting.g_szComments[i]; // Extract comments from JSON
		j = 0;
		while (j<comment.link.length && comment.link[j].rel != "alternate")
			j++;
		linkidx = j;
		var link = comment.link[linkidx].href; // author's link, use this link to look for original link of the post.
		if (rcPreSetting.authorLink && comment.author[0].uri != undefined)
			var althorLink = comment.author[0].uri.$t;
		else
			var althorLink = link;
		if (link.indexOf('#') > 0)
			var orgLink = link.replace(/(^.+)\?.*$/,'$1'); // Link URL of the Post
		if (rcPreSetting.createDisplayFormat.indexOf('%rcTitleLinkFormat%') != -1)
		{
			if (orgLink != checkLink)  // if the previous comment is from the same post, then we don't have to look for the title of the post
			{	
				findIdx = rcFunction.findTitle(orgLink);
				if (findIdx == -1)
				{
					if(comment['thr$in-reply-to']!=undefined)
					{
						g_szTitle = '<span class="noTitleMessage" style="display:none">'+ comment["thr$in-reply-to"].source +'</span>';
						replyURL = '';
						reaplyImg = '<span class="replyImg"><a href ="" target = "_blank" ><img style = "background:none ;border-style: none" src = "' + rcPreSetting.reply[0] + '" \></a></span>';						
					}
					else
					{
						g_szTitle = '<span class="postDeleted" style="display:none"></span>';
						replyURL = '';
						reaplyImg = '';	
					}	
				}
				else
				{
					g_szTitle = rcSetting.titleArr[findIdx];
					replyURL = rcSetting.replyArr[findIdx];
					reaplyImg = '<span class="replyImg"><a href ="' + replyURL + '" target = "_blank" title ="'+ rcPreSetting.reply[1] +'" > <img style = "background:none ;border-style: none" src = "' + rcPreSetting.reply[0] + '" \></a></span>';
				}
				checkTitle = g_szTitle;
				checkLink  = orgLink;
			}
			else
				g_sztitle = checkTitle;
		}	
		if (comment.content== undefined) // This will check wheather full or short comment feed
		{
			var content = comment.summary.$t;
			if (content.length > 40)
				var short_content = content.substr(0,40)+'...';
			else
				var short_content = content;
			content = content.replace(/\u003c/g,'<'); // fix < 04/28/2008
			content = content.replace(/\u003e/g,'>'); // fix > 04/28/2008			
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
		var author = comment.author[0].name.$t;  // Author's Name
		//var reaplyURL = rcSetting.replyArr[findIdx];

		//----------- Select Date Format and do some necessary modification---------------
		if (rcPreSetting.rcDateFormat == 1)
		{
			var timestamp=comment.published.$t.substr(0,10); // Determine date and time.
			if (rcFunction.checkTodayDate(timestamp))
			timestamp = rcPreSetting.today + ' ' + comment.published.$t.substr(11,5);
		}
		else if (rcPreSetting.rcDateFormat == 2)
			var timestamp=rcFunction.monthConvert(comment.published.$t.substr(5,2))+'&nbsp;'+comment.published.$t.substr(8,2);
		short_content = short_content.replace(/"/gim,"&quot;"); // fix short_content masses up author display
		// Create Authour's information 
		var g_szAuthorsLink = rcPreSetting.rcAuthorLinkFormat;
		g_szAuthorsLink = g_szAuthorsLink.replace(/%link%/g,althorLink);
		g_szAuthorsLink = g_szAuthorsLink.replace(/%timestamp%/g,timestamp);
		g_szAuthorsLink = g_szAuthorsLink.replace(/%author%/g, author);
		g_szAuthorsLink = g_szAuthorsLink.replace(/%replyURL%/g, replyURL);
		g_szAuthorsLink = g_szAuthorsLink.replace(/%short_content%/g, short_content);
		// Create title information 
		var g_orignalLink = rcPreSetting.rcTitleLinkFormat;		
		g_orignalLink = g_orignalLink.replace(/%orgLink%/g, orgLink);
		g_orignalLink = g_orignalLink.replace(/%timestamp%/g, timestamp);
		g_orignalLink = g_orignalLink.replace(/%g_szTitle%/g, g_szTitle);
		g_orignalLink = g_orignalLink.replace(/%replyURL%/g, replyURL);
		g_orignalLink = g_orignalLink.replace(/%short_content%/g, short_content);
		var expendStyle= '<span class="rcfold">&nbsp;&nbsp;&nbsp;</span> ';
		// Finally, create the comment list
		temp += '<li>'+ expendStyle;
		var displayFormat = rcPreSetting.createDisplayFormat;
		displayFormat = displayFormat.replace(/%timestamp%/g,'<span class="rcTimeStamp">' + timestamp + '</span>');
		displayFormat = displayFormat.replace(/%rcAuthorLinkFormat%/g,'<span class = "rcAuthor">' + g_szAuthorsLink + '</span>');
		displayFormat = displayFormat.replace(/%rcTitleLinkFormat%/g,'<span class = "rcPostTitle">' + g_orignalLink + '</span>');
		displayFormat = displayFormat.replace(/%replyImg%/g,reaplyImg);
		if (!rcSetting.showAllFlag)
			displayFormat = displayFormat.replace(/%rcSay%/g,'<span class="rcsay">'+rcPreSetting.rcFoldImage[1]+'</span>');
		else
			displayFormat = displayFormat.replace(/%rcSay%/g,'<span class="rcsay">'+rcPreSetting.rcFoldImage[3]+'</span>');
		displayFormat = displayFormat.replace(/\s*(\S*)%content%(\S*)\s*/g, '<span class="comcontent">$1'+content+'$2</span>'); // This is somewhat tricky
		temp += displayFormat + '</li>';
	}
	temp+='</ul>';
	jQuery('#divrc').html(temp);
	// Some necessary operations to match custom format
	//jQuery(document).ready(function()
	//{
		if (jQuery('#divrc li .comcontent').html() != null)
		{// folding feature is used when full content exists.
			jQuery('#divrc li').css({listStyle:'none',background:'none'});
			if (!rcSetting.showAllFlag)
				jQuery('#divrc li .rcfold').css('background','url('+rcPreSetting.rcFoldImage[0]+') center no-repeat');
			else
				jQuery('#divrc li .rcfold').css('background','url('+rcPreSetting.rcFoldImage[2]+') center no-repeat');
		}
		else
		{// if full content does not exist, remove folding feature
			jQuery('#divrc li').find('.rcfold').remove();
			jQuery('#showAllButton').remove();
		}
	//});
	rcFunction.RunAfterDomReady();
	if (rcPreSetting.showRCnoPost)
		jQuery('#divrc li:has(.postDeleted)').find('.rcPostTitle').replaceWith(rcPreSetting.noContent[0]).end().each(function(){
			jQuery(this).find('.rcAuthor').html(jQuery(this).find('.rcAuthor').text());
		});
	else
		jQuery('#divrc li:has(.postDeleted)').remove(); // If a post has been deleted, remove that comment.
	rcSetting.outDate = jQuery('#divrc li:has(.noTitleMessage)').length;
	if (rcSetting.outDate == 0)	{
		if (jQuery('#divrc li').length == 0)
			jQuery('#divrc').html(rcPreSetting.noContent[1]);
		rcFunction.addFooterButton();
	}
	else
		rcFunction.titleReCheck(); // go to titleCheck to check if any title misses.
};

rcFunction.addFooterButton = function () //This function is only used in titleCheck(), so I make it an inner function for easy management
	{
		var text = rcPreSetting.otherText;
		var commentInfo ='<p id="showfooterButton">'+text[4];
		var index = rcSetting.commentStartIndex;
		var tnum = rcSetting.commentTotalNum;
		var g_show = rcPreSetting.g_iShowCount;
		if (index + g_show > tnum)
			g_show = tnum - index + 1;
		commentInfo = commentInfo.replace(/%range%/,index +'-'+ (index+g_show-1));
		commentInfo = commentInfo.replace(/%totalNum%/,tnum);
		var footerButton;
		jQuery('#loading').remove();
		jQuery('#jumpButton').removeAttr('disabled');
		if (index == 1)
		{
			if (tnum == g_show)
			footerButton = '</p>';
			else
			footerButton = '<br><a href="javascript:rcFunction.changePage(1,0);">'+text[3]+'</a></p>';
		}
		else if (g_show + index > tnum)
		{
			footerButton = '<br><a href="javascript:rcFunction.changePage(-1,0);">'+text[2]+'</a></p>';
		}
		else 
		{
			footerButton = '<br><a href="javascript:rcFunction.changePage(-1,0);">'+text[2]+'</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:rcFunction.changePage(1,0);">'+text[3]+'</a></p>';
		}
		jQuery('#divrc').after(commentInfo + footerButton);
		//rcFunction.RunAfterDomReady();
	};


rcFunction.titleReCheck = function()
{
	var source = jQuery('#divrc li .noTitleMessage').eq(0).text();
	jQuery('#jsonPosts').remove();
	rcFunction.fetchPostsTitle(1,source);
};
// How do we find the title of a post that we miss at first check?
// We look again and then use jQuery to replace noTitleMessage'
// This function is called by titleCheck ONLY.
rcFunction.findLossTitles = function (posts)
{


		var title = posts.entry.title.$t;
		var link = posts.entry.link;
		for (var i = 0 ; i < link.length ; i++)
		{
			if (link[i].rel == 'alternate')
				var titleLink = link[i].href;
			else if (link[i].rel == 'replies' && link[i].type == 'text/html')
				var replyLink = link[i].href;
			else if (link[i].rel == 'self')
				var sourceLink = link[i].href;
		}
		jQuery('#divrc li:has(.noTitleMessage)').each(function(i){
			if (jQuery('.noTitleMessage',this).text() == sourceLink)
			{
				jQuery(this).find('.replyImg a').attr('href',replyLink).end().find('.noTitleMessage').replaceWith(title);
				rcSetting.outDate--;
			}
		});
	if (rcSetting.outDate != 0)
		rcFunction.titleReCheck();
	else
		rcFunction.addFooterButton();
 };

//----------- Some actions run after list of comments are created. ---------------//on mouseover?? instead of hover
rcFunction.RunAfterDomReady = function ()
{
	if (!rcSetting.showAllFlag)
		jQuery('#divrc li').find('.comcontent').hide();
	jQuery('#divrc li').find('.rcfold').hover(
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
	//if (rcSetting.showAllFlag) {rcSetting.showAllFlag= false; rcFunction.showOrHideAll();}
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