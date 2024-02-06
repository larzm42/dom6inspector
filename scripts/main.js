//IE workaround
if (!console) var console={ log:function(){} };

//interrupt navigation away from page
//$(window).bind('beforeunload', function(){ return ' '; });


//read options from querystring (ignore cookie)$('#showmodcmds:checked').prop('checked'
//DMI.Options['Show mod cmds'] = (location.search.indexOf('showids')!=-1 && location.search.indexOf('showmodcmds=1')!=-1);
DMI.Options['Ignore mods'] = (location.search.indexOf('showids=1')!=-1 && location.search.indexOf('ignoremods=1')!=-1);
DMI.Options['Custom js'] = location.search.indexOf('customjs=1')!=-1;
DMI.Options['Load events'] = location.search.indexOf('loadEvents=1')!=-1;

//on page load
$(function() {
	console.log('D3MI VERSION: '+versionCode);

	//begin the loading process (loaddata.js)..
	DMI.continueLoading();
});

DMI.isFirefoxBrowser = function()
{
    return typeof InstallTrigger !== 'undefined';
};


//called from loaddata.js once all data is loaded
DMI.initGrids = function() {
	if (!DMI.Options['Custom js'])
		$('.customjs').hide();

	//data dump
	if (location.search.indexOf('dumpunitkeys') != -1) {
		var keys = null;
		var res = /dumpunitkeys=([^\&]*)/.exec(location.search);
		if (res)
			keys = res[1].split(/[,\t]/);

		$('#modtext').css({width:'100%', height:'100%', position:'absolute', top:0, left:0})
		.show().val( DMI.MUnit.dumpCSV(keys) ).focus().select();
		return;
	}

	//wire up toggle ids button
	function showOrHideIds() {
		if ($('#showids').saveState().is(':checked')) {
			//add style
			$( "<style>.hidden-block { display:block; } tr.hidden-row { display:table-row; } .hidden-inline {display:inline; }</style>" ).appendTo( "head" );

			if (DMI.isFirefoxBrowser()) {
				$(".grid-container").css({left:'430px'})
				$("div.static-overlay-container").css({width:'430px'})
			} else {
				$(".grid-container").css({left:'375px'})
				$("div.static-overlay-container").css({width:'375px'})
			}

			if (itemgrid) itemgrid.showIds(1);
			if (spellgrid) spellgrid.showIds(1);
			if (unitgrid) unitgrid.showIds(1);
			if (wpngrid) wpngrid.showIds(1);
			if (armorgrid) armorgrid.showIds(1);
			if (sitegrid) sitegrid.showIds(1);
			if (mercgrid) mercgrid.showIds(1);
			if (eventgrid) eventgrid.showIds(1);

			DMI.Options['Show ids'] = 1;
			PaneManager.option_drag_anywhere = 0;
		}
		else {
			$( "<style>.hidden-block, tr.hidden-row, .hidden-inline { display:none; }</style>" ).appendTo( "head" );

			if (DMI.isFirefoxBrowser()) {
				$(".grid-container").css({left:'350px'})
				$("div.static-overlay-container").css({width:'350px'})
			} else {
				$(".grid-container").css({left:'343px'})
				$("div.static-overlay-container").css({width:'343px'})
			}

			if (itemgrid) itemgrid.showIds(0);
			if (spellgrid) spellgrid.showIds(0);
			if (unitgrid) unitgrid.showIds(0);
			if (wpngrid) wpngrid.showIds(0);
			if (armorgrid) armorgrid.showIds(0);
			if (sitegrid) sitegrid.showIds(0);
			if (mercgrid) mercgrid.showIds(0);
			if (eventgrid) eventgrid.showIds(0);

			DMI.Options['Show ids'] = 0;
			PaneManager.option_drag_anywhere = 1;

			//clear advanced filters
			$("div.hidden-block div.panel input.clear-filters-btn").trigger('click');

			//go to valid page
			if ($("#wpn-page:visible, #armor-page:visible").length)
				$("#item-page-button").trigger('click');

		}
		showOrHideModdingInfo();
		showOrHideKeys();
		showOrHideModCmds();
	}
	$('#showids').click( function(){setTimeout(showOrHideIds,0);} ); //asynchronous call as its a bit sluggish

	function showOrHideModdingInfo() {
		if ($('#showmoddinginfo').saveState().is(':checked') && DMI.Options['Show ids']) {
			//add style
			$( "<style>.modding-block { display:block; } tr.modding-row { display:table-row; } .modding-inline {display:inline; }</style>" ).appendTo( "head" );

			DMI.Options['Show modding info'] = 1;
		}
		else {
			$( "<style>.modding-block, tr.modding-row, .modding-inline { display:none; }</style>" ).appendTo( "head" );

			DMI.Options['Show modding info'] = 0;

			//clear advanced filters
			$("div.modding-block div.panel input.clear-filters-btn").trigger('click');
		}
	}
	$('#showmoddinginfo').click( function(){setTimeout(showOrHideModdingInfo,0);} ); //asynchronous call as its a bit sluggish


	function showOrHideKeys() {
		if ($('#showkeys').saveState().is(':checked') && DMI.Options['Show ids']) {
			//add style
			$( "<style>.internal-block { display:block; } tr.internal-row { display:table-row; } .internal-inline {display:inline; }</style>" ).appendTo( "head" );

			DMI.Options['Show internal keys'] = 1;
		}
		else {
			$( "<style>.internal-block, tr.internal-row, .internal-inline { display:none; }</style>" ).appendTo( "head" );

			DMI.Options['Show internal keys'] = 0;
		}
	}
	$('#showkeys').click( function(){setTimeout(showOrHideKeys,0);} );  //asynchronous call as its a bit sluggish


	function showOrHideModCmds() {
		if ($('#showmodcmds').saveState().is(':checked') && DMI.Options['Show ids']) {
			$('a.show-mod-commands').trigger('click');
			DMI.Options['Show mod cmds'] = 1;
		}
		else {
			$('a.hide-mod-commands').trigger('click');
			DMI.Options['Show mod cmds'] = 0;
		}
	}
	$('#showmodcmds').click( function(){setTimeout(showOrHideModCmds,0);} );  //asynchronous call as its a bit sluggish



	//jquery plugin. no shit
	if (!$.fn.reverse) $.fn.reverse = [].reverse;

	//wire up global-clear-filters-btn
	$("#global-clear-filters-btn").click(function() {
		//we do it in reverse so the first input ends up focused
		$("input.clear-filters-btn:visible").reverse().trigger('click');
	});

	//wire up page selection buttons
	//grid creation is deferred

	var itemgrid = null;
	$("#item-page-button").click(function(e){

		//if (itemgrid) itemgrid.hide();
		if (sitegrid) sitegrid.hide();
		if (spellgrid) spellgrid.hide();
		if (unitgrid) unitgrid.hide();
		if (wpngrid) wpngrid.hide();
		if (armorgrid) armorgrid.hide();
		if (mercgrid) mercgrid.hide();
		if (eventgrid) eventgrid.hide();

		if (!itemgrid)
			itemgrid = new DMI.MItem.CGrid();

		itemgrid.show();
		$(".page-button").prop('disabled', false).removeClass('disabled');
		$("#item-page-button").prop('disabled', true).addClass('disabled');

		//focus search box
		$("div.filters-text.itemview input.search-box").focus();

		DMI.Utils.saveState();
	});

	var sitegrid = null;
	$("#site-page-button").click(function(e){

//		if (sitegrid) sitegrid.hide();
		if (itemgrid) itemgrid.hide();
		if (spellgrid) spellgrid.hide();
		if (unitgrid) unitgrid.hide();
		if (wpngrid) wpngrid.hide();
		if (armorgrid) armorgrid.hide();
		if (mercgrid) mercgrid.hide();
		if (eventgrid) eventgrid.hide();

		if (!sitegrid)
			sitegrid = new DMI.MSite.CGrid();

		sitegrid.show();
		$(".page-button").prop('disabled', false).removeClass('disabled');
		$("#site-page-button").prop('disabled', true).addClass('disabled');

		//focus search box
		$("div.filters-text.siteview input.search-box").focus();

		DMI.Utils.saveState();
	});

	var mercgrid = null;
	$("#merc-page-button").click(function(e){

		if (sitegrid) sitegrid.hide();
		if (itemgrid) itemgrid.hide();
		if (spellgrid) spellgrid.hide();
		if (unitgrid) unitgrid.hide();
		if (wpngrid) wpngrid.hide();
		if (armorgrid) armorgrid.hide();
		if (mercgrid) mercgrid.hide();
		if (eventgrid) eventgrid.hide();

		if (!mercgrid)
			mercgrid = new DMI.MMerc.CGrid();

		mercgrid.show();
		$(".page-button").prop('disabled', false).removeClass('disabled');
		$("#merc-page-button").prop('disabled', true).addClass('disabled');

		//focus search box
		$("div.filters-text.mercview input.search-box").focus();

		DMI.Utils.saveState();
	});

	var eventgrid = null;
	$("#event-page-button").click(function(e){

		if (sitegrid) sitegrid.hide();
		if (itemgrid) itemgrid.hide();
		if (spellgrid) spellgrid.hide();
		if (unitgrid) unitgrid.hide();
		if (wpngrid) wpngrid.hide();
		if (armorgrid) armorgrid.hide();
		if (mercgrid) mercgrid.hide();
		if (eventgrid) eventgrid.hide();

		if (!eventgrid)
			eventgrid = new DMI.MEvent.CGrid();

		eventgrid.show();
		$(".page-button").prop('disabled', false).removeClass('disabled');
		$("#event-page-button").prop('disabled', true).addClass('disabled');

		//focus search box
		$("div.filters-text.eventview input.search-box").focus();

		DMI.Utils.saveState();
	});

	var spellgrid = null;
	$("#spell-page-button").click(function(e){

		if (itemgrid) itemgrid.hide();
		if (sitegrid) sitegrid.hide();
		//if (spellgrid) spellgrid.hide();
		if (unitgrid) unitgrid.hide();
		if (wpngrid) wpngrid.hide();
		if (armorgrid) armorgrid.hide();
		if (mercgrid) mercgrid.hide();
		if (eventgrid) eventgrid.hide();

		if (!spellgrid)
			spellgrid = new DMI.MSpell.CGrid();

		spellgrid.show();
		$(".page-button").prop('disabled', false).removeClass('disabled');
		$("#spell-page-button").prop('disabled', true).addClass('disabled');

		//focus search box
		$("div.filters-text.spellview input.search-box").focus();

		DMI.Utils.saveState();
	});

	var unitgrid = null;
	$("#unit-page-button").click(function(e){

		if (spellgrid) spellgrid.hide();
		if (sitegrid) sitegrid.hide();
		if (itemgrid) itemgrid.hide();
		//if (unitgrid) unitgrid.hide();
		if (wpngrid) wpngrid.hide();
		if (armorgrid) armorgrid.hide();
		if (mercgrid) mercgrid.hide();
		if (eventgrid) eventgrid.hide();

		if (!unitgrid)
			unitgrid = new DMI.MUnit.CGrid();

		unitgrid.show();
		$(".page-button").prop('disabled', false).removeClass('disabled');
		$("#unit-page-button").prop('disabled', true).addClass('disabled');

		//focus search box
		$("div.filters-text.unitview input.search-box").focus();

		DMI.Utils.saveState();
	});


	var wpngrid = null;
	$("#wpn-page-button").click(function(e){

		if (spellgrid) spellgrid.hide();
		if (sitegrid) sitegrid.hide();
		if (itemgrid) itemgrid.hide();
		if (unitgrid) unitgrid.hide();
		//if (wpngrid) wpngrid.hide();
		if (armorgrid) armorgrid.hide();
		if (mercgrid) mercgrid.hide();
		if (eventgrid) eventgrid.hide();

		if (!wpngrid)
			wpngrid = new DMI.MWpn.CGrid();

		wpngrid.show();
		$(".page-button").prop('disabled', false).removeClass('disabled');
		$("#wpn-page-button").prop('disabled', true).addClass('disabled');

		//focus search box
		$("div.filters-text.wpnview input.search-box").focus();

		DMI.Utils.saveState();
	});


	var armorgrid = null;
	$("#armor-page-button").click(function(e){

		if (spellgrid) spellgrid.hide();
		if (sitegrid) sitegrid.hide();
		if (itemgrid) itemgrid.hide();
		if (unitgrid) unitgrid.hide();
		if (wpngrid) wpngrid.hide();
		//if (armorgrid) armorgrid.hide();
		if (mercgrid) mercgrid.hide();
		if (eventgrid) eventgrid.hide();

		if (!armorgrid)
			armorgrid = new DMI.MArmor.CGrid();

		armorgrid.show();
		$(".page-button").prop('disabled', false).removeClass('disabled');
		$("#armor-page-button").prop('disabled', true).addClass('disabled');

		//focus search box
		$("div.filters-text.armorview input.search-box").focus();

		DMI.Utils.saveState();
	});

	DMI.onKeyDown = function(e){
		//console.log('keyCode: '+e.keyCode);

		//open first result on enter
		if (e.which == 13) {
			if (spellgrid) spellgrid.detachShowingDetails();
			if (itemgrid) itemgrid.detachShowingDetails();
			if (unitgrid) unitgrid.detachShowingDetails();
			if (sitegrid) sitegrid.detachShowingDetails();
			if (wpngrid) wpngrid.detachShowingDetails();
			if (armorgrid) armorgrid.detachShowingDetails();
			if (mercgrid) mercgrid.detachShowingDetails();
			if (eventgrid) eventgrid.detachShowingDetails();
		}
		//remove last popup on escape
		//or clear filters if all closed
		else if (e.which == 27) {
			var highest = null, highestZIndex = -1;
			$('div.overlay.popup').each(function(){
				var zIndex = parseInt(this.style.zIndex);
				if (zIndex > highestZIndex) {
					highest = this;
					highestZIndex = zIndex;
				}
			});
			if (highest) {
				$(highest).find('.overlay-pin').trigger('click');
				$('input.search-box:visible').focus();
			}
			else {
				$('input#global-clear-filters-btn').trigger('click');
				$('input.search-box:visible').focus();
			}
		}
		//ctrl+left/right changes tab
		else if (e.ctrlKey) {
			if (e.which == 37) {
				if ($("#item-page:visible").length) {
					if ($("#armor-page-button:visible").length)
						$("#armor-page-button").trigger('click');
					else
						$("#unit-page-button").trigger('click');
				}
				else if ($("#spell-page:visible").length)
					$("#item-page-button").trigger('click');

				else if ($("#unit-page:visible").length) {
					$("#spell-page-button").trigger('click');
				}
				else if ($("#site-page:visible").length) {
					$("#unit-page-button").trigger('click');
				}
				else if ($("#wpn-page:visible").length)
					$("#site-page-button").trigger('click');

				else if ($("#armor-page:visible").length)
					$("#wpn-page-button").trigger('click');
			}
			else if (e.which == 39) {
				if ($("#item-page:visible").length)
					$("#spell-page-button").trigger('click');

				else if ($("#spell-page:visible").length)
					$("#unit-page-button").trigger('click');

				else if ($("#unit-page:visible").length)
					$("#site-page-button").trigger('click');

				else if ($("#site-page:visible").length) {
					if ($("#wpn-page-button:visible").length)
						$("#wpn-page-button").trigger('click');
					else
						$("#item-page-button").trigger('click');
				}
				else if ($("#wpn-page:visible").length)
					$("#armor-page-button").trigger('click');

				else if ($("#armor-page:visible").length)
					$("#item-page-button").trigger('click');
			}
		}
	}
	$('html').on('keydown', DMI.onKeyDown);

	//wire up unpin-all btn
	$("#global-unpin-all-btn").click(function(e) {
		//trigger click on every pin
		$('input.overlay-pin:visible').trigger('click');
		$('input.search-box:visible').focus();
	});
	//show or hide unpin all button on pane changes
	PaneManager.onUpdate( function() {
		if ($("input.overlay-pin:visible").length)
			$('#global-unpin-all-btn').show();
		else
			$('#global-unpin-all-btn').hide();
	});


	//display shared panels (hidden while loading)
	$("div.primary-panel").show();
	$("#advanced-options").show();

	//load state from cookie/url
	DMI.Utils.loadState();
	$('#nation').trigger('change');

	//process loaded state
	showOrHideIds();

	//save state to cookie on pane changes
	PaneManager.onUpdate(DMI.Utils.saveState);
}
