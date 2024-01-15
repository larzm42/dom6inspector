//namespace scope
(function( DMI, $, undefined ){

var MMerc = DMI.MMerc = DMI.MMerc || {};

var Format = DMI.Format;
var Utils = DMI.Utils;

var modctx = DMI.modctx;
var modconstants = DMI.modconstants;


//////////////////////////////////////////////////////////////////////////
// PREPARE DATA
//////////////////////////////////////////////////////////////////////////

MMerc.initMerc = function(o) {
};

MMerc.prepareData_PreMod = function() {
	for (var oi=0, o;  o= modctx.mercdata[oi];  oi++) {
	}
}

MMerc.prepareData_PostMod = function() {
	for (var oi=0, o;  o= modctx.mercdata[oi];  oi++) {

		o.renderOverlay = MMerc.renderOverlay;
		o.matchProperty = MMerc.matchProperty;

		//convert to numbers (for column ordering)
		//doesn't seem to cause any further problems..
		o.id = parseInt(o.id);
		o.searchable = o.name.toLowerCase();

		o.minpaysort = parseInt(o.minpay);
	}
}

//////////////////////////////////////////////////////////////////////////
// DEFINE GRID
//////////////////////////////////////////////////////////////////////////
function formatScale(_,__,v){ return v=='z' ? "" : v; }

MMerc.CGrid = Utils.Class( DMI.CGrid, function() {
	//grid columns
	var columns = [
		{ id: "name",     width: 145, name: "Name", field: "name", sortable: true },
		{ id: "level",     width: 40, name: "Level", field: "level", sortable: true },
		{ id: "minpaysort",     width: 40, name: "Min Pay", field: "minpaysort", sortable: true, cssClass: "numeric" },
		{ id: "eramask",      width: 50, name: "Era", field: "eramask", sortable: true },
	];

	this.superClass.call(this, 'merc', modctx.mercdata, columns); //superconstructor

	$(this.domsel+' .grid-container').css('width', 600);//set table width

	//in closure scope
	var that = this;

	//reads search boxes
	this.getSearchArgs = function() {
		var args = {properties: this.getPropertyMatchArgs(),
			str: $(that.domselp+" input.search-box").val().toLowerCase().trim(),
		};
		args.properties = Utils.propertiesWithKeys(args.properties);

		return args;
	}
	//apply search
	this.searchFilter =  function(o, args) {
		//type in id to ignore filters
		if (args.str && args.str == String(o.id)) return true;

		//search string
		if (args.str && o.searchable.indexOf(args.str) == -1)
			return false;

		//properties
		//each is comprised of key =~ val
		if (args.properties) {
			//need to finalise stats now..
			DMI.MUnit.prepareForRender(o);
			for (var i = 0; i < args.properties.length; i++){
				var prop = args.properties[i];
				var r =  o.matchProperty(o, prop.key, prop.comp, prop.val);
				if (prop.not  ?  r  :  !r)
					return false;
			}
		}
		return true;
	}

	//call filters and update  display
	//asyncronous to make sure all filter inputs are correctly initialised
	setTimeout(function() {
		that.init();
	},0);
});
MMerc.matchProperty = function(o, key, comp, val) {
	if (DMI.matchProperty(o, key, comp, val))
		return true;
}

//////////////////////////////////////////////////////////////////////////
// OVERLAY RENDERING
//////////////////////////////////////////////////////////////////////////

var aliases = {};
var formats = {};
var displayorder = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
	'bossname', 'boss name',
	'com',	'commander',	Utils.unitRef,
	'unit',	'units',	Utils.unitRef,
	'nrunits', 'number of units',
	'level', 'level',
	'minmen', 'minimum men',
	'minpay', 'minimum bid',
	'xp', 'starting xp',
	'randequip', 'equipment level',
	'recrate', 'recruitment speed',
	'eramask', 'era', {'1': 'Early', '2': 'Middle', '3': 'Early, Middle', '4': 'Late', '5': 'Late, Early', '6': 'Late, Middle', '7': 'All' },
	'item1', 'starting item', Utils.itemRef,
	'item2', 'starting item', Utils.itemRef,
]);
var flagorder = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
]);
var hiddenkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'id', 		'mercenary id'
]);
var modderkeys = Utils.cutDisplayOrder(aliases, formats,
[
]);
var ignorekeys = {
	modded:1,
	minpaysort:1,

	//common fields
	name:1,descr:1,
	searchable:1, renderOverlay:1, matchProperty:1
};

MMerc.renderOverlay = function(o) {
	//template
	var h=''
	h+='<div class="merc overlay-contents"> ';

	//header
	h+='	<div class="overlay-header" title="merc id: '+o.id+'"> ';
	h+='		<div class="h2replace">'+o.name+'</div> ';

	//mid
	h+='	</div>';
	h+='	<div class="overlay-main">';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';
	h+='		<table class="overlay-table"> ';
	h+= 			Utils.renderDetailsRows(o, hiddenkeys, aliases, formats, 'hidden-row');
	h+= 			Utils.renderDetailsRows(o, modderkeys, aliases, formats, 'modding-row');
	h+= 			Utils.renderDetailsRows(o, displayorder, aliases, formats);
	h+= 			Utils.renderDetailsFlags(o, flagorder, aliases, formats);
	h+= 			Utils.renderStrangeDetailsRows(o, ignorekeys, aliases, 'strange');

	//modded
	if (o.modded) {
		h+='		<tr class="modded hidden-row"><td colspan="2">' + Utils.renderModded(o) +'</td></tr>';
	}
	h+='		</table> ';
	h+='	</div>';

	//footer
	h+='	<div class="overlay-footer">';

	//wikilink
	h+='		<div class="overlay-wiki-link non-content">';
	h+='			<a href="http://dom3.servegame.com/wiki/'+o.name.replace(/ /g, '_')+'">[wiki]</a>';
	h+='		</div>';
	h+='	</div> ';
	h+='</div> ';

	return h;
}

//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
