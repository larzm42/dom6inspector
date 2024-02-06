//namespace into private scope
(function( DMI, $, undefined ){

//namespace children
var Utils = DMI.Utils = DMI.Utils || {};
var Render = DMI.Render = DMI.Render || {};


function idFormatter(_,__, value) {
	return Math.round(value);
}

const isUserUsingMobile = () => {

	// User agent string method
	let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

	// Screen resolution method
	if (!isMobile) {
   		let screenWidth = window.screen.width;
    	let screenHeight = window.screen.height;
    	isMobile = (screenWidth < 768 || screenHeight < 768);
	}

	// Touch events method
	if (!isMobile) {
    	isMobile = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
	}

	// CSS media queries method
	if (!isMobile) {
    	let bodyElement = document.getElementsByTagName('body')[0];
    	isMobile = window.getComputedStyle(bodyElement).getPropertyValue('content').indexOf('mobile') !== -1;
	}

	return isMobile;
}


//base class for grid page
DMI.CGrid = Utils.Class(function( domname, data, columns, options) {

	////////////////////////////////////////////////////////////////////////////
	// constructor arguments
	////////////////////////////////////////////////////////////////////////////
	this.data = data;
	this.options = {
		//defaults
		editable: false,
		enableAddRow: false,
		enableCellNavigation: true,
		enableColumnReorder: false,
		forceFitColumns: true
	};
	if (options)
		for (k in options) this.options[k] = options[k];

	//full wrapper for this page
	this.domsel = "#"+domname+"-page";

	//panels visible for this page (including controls that overlap with other pages)
	this.domselp = "div.panel."+domname+"view";


	////////////////////////////////////////////////////////////////////////////
	// public interface
	////////////////////////////////////////////////////////////////////////////
	this.doSearch = function() {
		window.clearTimeout(h_runsearchfilters);
		h_runsearchfilters = window.setTimeout(filterAndUpdate, 10);
	}

	this.hide = function() {
		if (!isVisible) return;
		isVisible = false;

		lastScrollPos = $(this.domsel+' div.slick-viewport').scrollTop();

		$(this.domsel).hide();
		$(this.domselp).hide();
	}
	this.show = function() {
		if (isVisible) return;
		isVisible = true;

		//show this page
		$(this.domsel).show();

		//move shared overlay onto this page
		$(this.domsel+' div.primary-overlay').append($('#primary-details'));

		//show relevant panels on shared overlay
		$(this.domselp).show();

		//scroll to last position (before being hidden)
		if (lastScrollPos)
			$(this.domsel+' div.slick-viewport').scrollTop(lastScrollPos);

		//slap
		this.grid.resizeCanvas();

		//update views
		setGridInfo();

		//fix clear filters btn
		checkGlobalClearFilters();
	}

	this.showIds = function(on) {
		var columns = that.grid.getColumns();
		if (on && columns[0].id != 'id') {
			columns.unshift({ id: "id", width: 40, name: "id", field: "id", sortable: true, cssClass: "numeric", formatter: idFormatter });
			that.grid.setColumns(columns);
		}
		else if (!on && columns[0].id == 'id') {
			columns.shift();
			that.grid.setColumns(columns);
		}
	}

	////////////////////////////////////////////////////////////////////////////
	// create grid
	////////////////////////////////////////////////////////////////////////////
	this.dataView = new Slick.Data.DataView({ inlineFilters: true });
	this.grid = new Slick.Grid(this.domsel+' .grid-container', this.dataView, columns, this.options);


	////////////////////////////////////////////////////////////////////////////
	// PRIVATE
	////////////////////////////////////////////////////////////////////////////

	// closure scope
	var that = this;

	var h_runsearchfilters = null;

	var lastScrollPos = null;
	var isVisible = false;


	//wire up model events to drive the grid (slickgrid magic)
	this.dataView.onRowCountChanged.subscribe(function (e, args) {
		that.grid.updateRowCount();
		that.grid.render();
	});
	this.dataView.onRowsChanged.subscribe(function (e, args) {
		that.grid.invalidateRows(args.rows);
		that.grid.render();
	});


	////////////////////////////////////////////////////////////////////////////
	// filter buttons
	////////////////////////////////////////////////////////////////////////////

	//sets visibility of clear-filter button (call in context of an input)
	function checkGlobalClearFilters() {
		if ($("input.clear-filters-btn:visible").length) {
			$("#global-clear-filters-btn").show();
		}
		else
			$("#global-clear-filters-btn").hide();
	}
	function checkClearFilters() {
		$property = $(this).parents('.property');
		if($property.length){
			if ($property.find(" input[type=text]:[value^='']").length
				|| $property.find(" textarea:[value^='']").length
				|| $property.find(" input[type=checkbox]:checked").length
				|| ($property.find(" option:not(.default):selected").length && !($property.find(" select.nation").length))
				|| ($property.find(":selected")[0] && $property.find(":selected")[0].text != "any nation" && $property.find(" select.nation").length)
			)
				$property.find("input.clear-filters-btn").show();
			else
				$property.find("input.clear-filters-btn").hide();
		}else{
			$panel = $(this).parents('.panel');
			if ($panel.find(" input[type=text]:[value^='']").length
				|| $panel.find(" textarea:[value^='']").length
				|| $panel.find(" input[type=checkbox]:checked").length
				|| ($panel.find(" option:not(.default):selected").length && !($panel.find(" select.nation").length))
				|| ($panel.find(":selected")[0] && $panel.find(":selected")[0].text != "any nation" && $panel.find(" select.nation").length)
			)
				$panel.find("input.clear-filters-btn").show();
			else
				$panel.find("input.clear-filters-btn").hide();
		}

		checkGlobalClearFilters();
	}

	//call on each panel now
	$(that.domselp+" .clear-filters-btn").each( checkClearFilters );

	//wire up filter controls
	$(that.domselp+" input[type=text], "+that.domselp+" textarea").bind('change keyup', 	function(e) {
		//skip if unchanged (to support other key commands)
		if ($(this).val() == $(this).prop("lastval"))
			return;

		$(this).prop("lastval", $(this).val());

		//normal stuff..
		that.doSearch();
		$(this).saveState();
		checkClearFilters.call(this);
	});
	$(that.domselp+" input[type=checkbox]").bind('change click', 	function(e) { that.doSearch(); $(this).saveState(); checkClearFilters.call(this); });
	$(that.domselp+" select").bind('change', 			function(e) { that.doSearch(); $(this).saveState(); checkClearFilters.call(this); });
	$(that.domselp+" input.clear-filters-btn").click(function(e) {
		$panel = $(this).parents('.panel');
		//removes additional properties
		if($panel.hasClass("property") && !$panel.is(".property:first-child")){
			$panel.remove();
		}
		//clear inputs and select default options
		$panel.find(" input[type=text]").val('').saveState();
		$panel.find(" textarea").val('').saveState();
		$panel.find(" input[type=checkbox]:checked:not(#loadEvents)").prop("checked", false).saveState();
		$panel.find(" option.default").attr('selected', true).parent().saveState();
		$panel.find('#nation').val(null).trigger('change');
		$(this).hide();

		checkGlobalClearFilters();
		that.doSearch();

		$panel.find(" input[type=text]").first().focus();
	});
	$(that.domselp+" input.add-property-filter-btn").click(function(e){
		$(this).parent().prev().clone(true, true).appendTo($(this).parents(".properties"))
	});

	//grid navigation
	$(that.domselp+' input[type=text],'+that.domselp+' textarea').keydown(function(e){
		if (e.ctrlKey && e.which == 38) { //up
			if (rowShowing === null) return;

			staticOverlayDetails(rowShowing - 1);
			that.grid.scrollRowIntoView(rowShowing);
			e.preventDefault();
		}
		else if (e.ctrlKey && e.which == 40) { //down
			if (rowShowing === null) return;

			staticOverlayDetails(rowShowing + 1);
			that.grid.scrollRowIntoView(rowShowing);
			e.preventDefault();
		}
	});
	$(that.domselp+' input[type=text]').keydown(function(e){
		// if (e.which == 43 || e.which == 61) {
		if (e.which == 107) { //keypad +
			var n = parseInt($(this).val()) || 0;
			$(this).val(n+1);
			e.preventDefault();
		}
		// else if (e.which == 45) {
		else if (e.which == 109) { //keypad -
			var n = parseInt($(this).val()) || 0;
			$(this).val(n-1);
			e.preventDefault();
		}
	});

	////////////////////////////////////////////////////////////////////////////
	// overlays
	////////////////////////////////////////////////////////////////////////////

	var $canvas = $(that.grid.getCanvasNode());
	var $highlightedRow = $(undefined);
	var detailsShowing = null;
	var rowShowing = null;


	var c_handle = null;
	//mouseover event on grid changes static overlay
	this.grid.onMouseEnter.subscribe( function (e) {
		PaneManager.closePopups();//clear any fucked up overlays hanging a

		e.currentTarget.style.cursor = 'pointer';

		window.clearTimeout(h_runsearchfilters);
		var rc = that.grid.getCellFromEvent(e);

		window.clearTimeout(c_handle);
		c_handle = window.setTimeout(function(){staticOverlayDetails(rc.row);}, 30);
	});

	this.grid.onActiveCellChanged.subscribe( function (e) {
		var activeCell = that.grid.getActiveCell();
		staticOverlayDetails(activeCell.row);
	});

	function hideStaticOverlayDetails(rown) {
		rowShowing = detailsShowing = null;
		$(that.domsel+' .fixed-overlay').hide();
	}
	function staticOverlayDetails(rown) {
		var o = that.grid.getData().getItem(rown);
		if (!o) return;

		//highlight grid row
		$highlightedRow.removeClass("active");
		$highlightedRow = $(that.domsel+" div.slick-row").filter("[row="+rown+"]").addClass("active");

		if (detailsShowing != o) {
			$(that.domsel+' .fixed-overlay').empty().append( o.renderOverlay(o) );
		}
		rowShowing = rown;
		detailsShowing = o;
		$(that.domsel+' .fixed-overlay').show();
	}

	//click event on grid opens new overlay
	this.grid.onClick.subscribe( function (e) {
		var rc = that.grid.getCellFromEvent(e);
		var o = that.grid.getData().getItem(rc.row);

		if (PaneManager.getOpenPanes(domname+' '+o.id).focusAndHighlight().length)
			return;

		if (isUserUsingMobile())
		{
			// The viewport is less than 768 pixels wide
		} else {
			PaneManager.openPane( domname+' '+o.id );
		}
	});
	
	

	//open fixed overlay contents in a floating overlay
	this.detachShowingDetails = function() {
		if (isVisible && detailsShowing) {
			if (PaneManager.getOpenPanes(domname+' '+detailsShowing.id).focusAndHighlight().length)
				return;

			PaneManager.openPane( domname+' '+detailsShowing.id );
		}
	}

	//ref events on fixed overlay
	$(that.domsel+' div.fixed-overlay').attachRefMouseEvents().attachRefClickEvents()
	.dblclick(function() {
		that.detachShowingDetails();
	});

	this.grid.onKeyDown.subscribe(DMI.onKeyDown);

	////////////////////////////////////////////////////////////////////////////
	// grid sort
	////////////////////////////////////////////////////////////////////////////

	var currentSortCmp = null;
	this.grid.onSort.subscribe(function (e, args) {
		if (that.preSort)
			that.preSort(e, args);

		// declarations for closure
		var field = args.sortCol.field;
		var defaultVal = args.sortCol.sortCmp == 'text'?'':0;
		var sign = args.sortAsc ? 1 : -1;
		var prevSortCmp = currentSortCmp || that.defaultSortCmp;

		// store closure in global
		currentSortCmp = function (dataRow1, dataRow2) {

			var value1 = (dataRow1[field] || defaultVal), value2 = (dataRow2[field] || defaultVal);

			//if equal then sort in previous scope (recurring)
			if (value1 == value2 && prevSortCmp)
				return prevSortCmp(dataRow1, dataRow2);

			return (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
		};
		that.dataView.sort(currentSortCmp);

		that.grid.invalidate();
		that.grid.render();

	});


	////////////////////////////////////////////////////////////////////////////
	// grid filters
	////////////////////////////////////////////////////////////////////////////

	this.getPropertyMatchArgs = function() {
		var args = [];
		$(that.domselp).filter(".property").each(function(){
			args.push({
				key: ($(this).children("input.search-key:visible").val() || '').toLowerCase(),
				not: $(this).children("input.search-not:checked").length,
				comp: $(this).children("select.search-comp").val(),
				val: $(this).children("input.search-val").val(),
				customjs: $(this).children("textarea.customjs:visible").val()
			});
		});
		args.forEach(function(arg){
			if (arg.key) {
				var compstr = arg.comp;
				//arg.key = DMI.propertyAliases[arg.key] || arg.key;
				arg.comp = function(v,c){ return v; };

				switch (compstr) {
					case '=~':
						if (arg.val && arg.val!='.') {
							arg.comp = function(v,c){ return String(v).match(c); };
							try{
								arg.val = new RegExp(arg.val || '.', 'i');
							}catch(e){ arg.val = /./; }
						}
						break;

					case '==':
						arg.comp = function(v,c){ return v == c; };
						break;

					case '<=':
						if (arg.val = parseInt(arg.val))
							arg.comp = function(v,c){ return parseInt(v) <= c; };
						break;

					case '>=':
						if (arg.val = parseInt(arg.val))
							arg.comp = function(v,c){ return  parseInt(v) >= c; };
						break;
				}
			}
		});
		return args;
	}

	function filterAndUpdate() {
		var args = that.getSearchArgs(that.domsel);
		var renderedRange = that.grid.getRenderedRange();
		that.dataView.setFilterArgs(args);
		that.dataView.setRefreshHints({
			ignoreDiffsBefore: renderedRange.top,
			ignoreDiffsAfter: renderedRange.bottom + 1
		});

		//do it
		that.dataView.refresh();

		//display first result
		var result0 = that.grid.getData().getItem(0);
		if (result0)
			staticOverlayDetails(0);
		else
			hideStaticOverlayDetails();

		//display count
		setGridInfo();
	}

	function setGridInfo() {
		var n = that.dataView.getLength();
		$('#count-results').html( n + (n==1 ? ' result' : ' results'));
	}


	$(window).resize(function() {
		that.grid.resizeCanvas();
	});

	////////////////////////////////////////////////////////////////////////////
	// final public init
	////////////////////////////////////////////////////////////////////////////
	//required in subclass:
	//  this.getSearchArgs
	//  this.searchFilter

	//optional in subclass:
	//  this.preSort
	//  this.onDisplay

	this.init = function() {

		//populate grid
		this.dataView.beginUpdate();
		this.dataView.setItems(this.data);
		this.dataView.setFilter(this.searchFilter);
		this.dataView.setFilterArgs(this.getSearchArgs(this.domsel));
		this.dataView.endUpdate();
		setGridInfo();

		//simulate click to order by first column
		$(this.initialSortTrigger || this.domsel+" div.slick-header-column:first").trigger('click');

		//display first item
		setTimeout( function(){staticOverlayDetails(0)}, 0);

		//show items
		if (DMI.Options['Show ids'])
			this.showIds(1);

		//set textinput lastval properties
		$(that.domselp+" input[type=text], "+that.domselp+" textarea").each(function() {
			$(this).prop("lastval", $(this).val());
		});
	}
});

//match property name to regexp (also matches child ids)
DMI.matchProperty = function(o, key, comparitor, match) {
	var val = o[key];
	if (!val) {
		key = DMI.propertyAliases[key];
		val = o[key];

		if (!val)
			return;
	}
	if (typeof(val) == 'string' || typeof(val) == 'number') {
		if (comparitor(val, match)) return true;
	}
	else if ($.isArray(val)) {
		if(key === 'randompaths' && val.length){
			var foundPath = false;
			val.forEach(function(v){
				if (comparitor(v.paths, match)){
					foundPath=true;
				};
			});
			if(foundPath) return true;
		}
		for (var o, i=0; o=val[i]; i++) {
			if (o && comparitor(o, match)) return true;
			if (o.id && comparitor(o.id, match)) return true;
			if (o.name && comparitor(o.name, match)) return true;
		}
	}
	else if (typeof(val) == 'object') {
		var o = val;
		if (o.id && comparitor(o.id, match)) return true;
		if (o.name && comparitor(o.name, match)) return true;
	}

	return false;
}

DMI.customFilter = function(o, customjs) {
	var result;
	try {
		var num = function(v){ return parseFloat(v) ? parseFloat(v) : 0; };
		result = eval(customjs);
		$('#custom-js-error').empty();
		return result;
	}
	catch(e) {
		$('#custom-js-error').html(String(e));
		return '#ERROR#';
	}
//	return true;
}


//namespace args
}( window.DMI = window.DMI || {}, jQuery ));


