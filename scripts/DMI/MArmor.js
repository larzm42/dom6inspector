//namespace scope
(function( DMI, $, undefined ){

var MArmor = DMI.MArmor = DMI.MArmor || {};

var Format = DMI.Format;
var Utils = DMI.Utils;

var modctx = DMI.modctx;
var modconstants = DMI.modconstants;

//////////////////////////////////////////////////////////////////////////
// PREPARE DATA
//////////////////////////////////////////////////////////////////////////

MArmor.initArmor = function(o) {
	o.type = 5;
	o.def = 0;
	o.used_by = [];
}

MArmor.prepareData_PreMod = function() {
	for (var oi=0, o; o= modctx.armordata[oi]; oi++) {
		o.used_by = [];
	}
}

MArmor.prepareData_PostMod = function() {
	for (var oi=0, o; o= modctx.armordata[oi]; oi++) {


		o.id = parseInt(o.id);
		o.name = o.name || '(undefined)';

		for (var oi2=0, o2; o2 = modctx.protections_by_armor[oi2]; oi2++) {
			var o2id = parseInt(o2.armor_number);
			if (o2id == o.id) {
				if (parseInt(o2.zone_number) == 1) {
					o.prothead = o2.protection;
				} else if (parseInt(o2.zone_number) == 2) {
					o.torso = o2.protection;
				} else if (parseInt(o2.zone_number) == 3) {
					o.upper = o2.protection;
				} else if (parseInt(o2.zone_number) == 4) {
					o.lower = o2.protection;
				} else if (parseInt(o2.zone_number) == 5) {
					o.protshield = o2.protection;
				} else if (parseInt(o2.zone_number) == 6) {
					o.general = o2.protection;
				}
			}
		}
		if (o.torso) {
			o.protbody = Math.floor((parseInt(o.torso) + (parseInt(o.upper) + parseInt(o.lower)) / 2) / 2);
		}

		if (o.prot) {
			if (o.type == 4) {
				o.protshield = o.prot;
			} else if (o.type == 6) {
				o.prothead = o.prot;
			} else if (o.type == 8) {
				o.general = o.prot;
			} else {
				o.protbody = o.prot;
			}
		}

		if (o.general) {
			o.protbody = parseInt(o.protbody || '0') + parseInt(o.general);
			o.prothead = parseInt(o.prothead || '0') + parseInt(o.general);
		}

		o.renderOverlay = MArmor.renderOverlay;
		o.matchProperty = MArmor.matchProperty;

		//serachable string
		o.searchable = o.name.toLowerCase();

		o.type = {4:'shield', 5:'armor', 6:'helm', 8:'misc'}[o.type];

		if (o.type=="shield") {
			o.parry = parseInt(o.def) + parseInt(o.enc);
			o.def = Utils.negative(o.enc);
		}
		
		for (var oi3=0, attr; attr = modctx.attributes_by_armor[oi3];  oi3++) {
			if (attr.armor_number == o.id) {
				if (attr.attribute == "557") {
					o.magic = 1;
				}
			}
		}

		// movement penalty
		o.movepen = o.enc;
		if ( o.magic ) {
			o.movepen -= 1;
		}
		o.movepen = Math.min( o.movepen * 2, 6 );
		for (var oi3=0, attr; attr = modctx.attributes_by_armor[oi3];  oi3++) {
			if (attr.armor_number == o.id) {
				if (parseInt(attr.attribute) == 582 && attr.raw_value != -99) {
					// overwrite above if movepen attribute is set
					o.movepen = attr.raw_value;
				}
			}
		}
		if (o.type != 'armor') {
			delete o.movepen;
		}
	}
}

//////////////////////////////////////////////////////////////////////////
// DEFINE GRID
//////////////////////////////////////////////////////////////////////////

MArmor.CGrid = Utils.Class( DMI.CGrid, function() {
	//grid columns
	var columns = [
		{ id: "name",     width: 145, name: "Armor Name", field: "name", sortable: true },
		{ id: "type",     width: 60, name: "Type", field: "type", sortable: true }
	];
	this.superClass.call(this, 'armor', modctx.armordata, columns); //superconstructor

	$(this.domsel+' .grid-container').css('width', 530);//set table width


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
MArmor.matchProperty = DMI.matchProperty;


//////////////////////////////////////////////////////////////////////////
// OVERLAY RENDERING
//////////////////////////////////////////////////////////////////////////

var aliases = {};
var formats = {};
var displayorder = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'protbody',	'protection, body',
	'prothead',	'protection, head',
	'protshield',	'protection, shield',
	'def',		'defence',		Format.Signed,
	'parry',	'parry',
	'enc',		'encumbrance',
	'movepen', 	'map movement penalty',  {'0':'0 '}
]);

var flagorder = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
]);
var hiddenkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'id', 		'armor id',	function(v,o){ return v + ' ('+o.name+')'; },
	'special',	'special'
]);
var modderkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'rcost',	'resource cost'
]);
var ignorekeys = {
	used_by:1,
	modded:1,
	id:1,
	name:1,
	type:1,
	magic:1,
	magicarmor:1,
	torso:1,upper:1,lower:1,general:1,
	searchable:1,renderOverlay:1, matchProperty:1
};


MArmor.renderOverlay = function(o, baseAtt) {
	//template
	var h=''
	h+='<div class="armor overlay-contents"> ';

	var slot = { shield:'1 hand', armor:'body', helm:'head', misc:'misc' }[o.type];

	//header
	h+='	<div class="overlay-header" title="armor id:'+o.id+'"> ';
	h+='		<p style="float:right; height:0px;">'+slot+'</p>';
	h+='		<div class="h2replace">'+o.name+'</div> ';
	h+='	</div>';

	//mid
	h+='	<div class="overlay-main">';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';

	h+='		<table class="overlay-table armor-table"> ';
	h+= 			Utils.renderDetailsRows(o, hiddenkeys, aliases, formats, 'hidden-row');
	h+= 			Utils.renderDetailsRows(o, modderkeys, aliases, formats, 'modding-row');
	h+= 			Utils.renderDetailsRows(o, displayorder, aliases, formats);
	h+= 			Utils.renderDetailsFlags(o, flagorder, aliases, formats);
	h+= 			Utils.renderStrangeDetailsRows(o, ignorekeys, aliases, 'strange');

	// Attributes
	for (var oi=0, attr; attr = modctx.attributes_by_armor[oi];  oi++) {
		if (attr.armor_number == o.id) {
			//var attribute = modctx.attributes_lookup[parseInt(attr.attribute_record_id)];
			if (attr.attribute != "582") {
				var ak = '';
				if (attr.attribute == "557" || o.magicarmor) {
					ak = '<span class="internal-inline"> [magic]</span>';
				}
				var specflags = modctx.attribute_keys_lookup[attr.attribute].name;
				h+= '<tr class="'+attr.attribute+'"><th>'+modctx.attribute_keys_lookup[attr.attribute].name.replace(/{(.*?)}|<|>/g, "")+ak+'</th></tr>'
			}
		}
	}

	//modded
	if (o.modded) {
		h+='		<tr class="modded hidden-row"><td colspan="2">' + Utils.renderModded(o) +'</td></tr>';
	}
	h+='		</table> ';
	h+='	</div>';

	//footer
	if (o.used_by.length) {
		h+='<div class="overlay-footer modding-block">';
		if (o.used_by.length > 8) {
			//hide uberlong list
			h+='	<p class="firstline">';
			h+='		Used by: '+o.used_by.length+' things ';

			//button to reveal
			var codereveal = "$(this).parent('p').hide().parent('div').find('.full-list').show()"
			h+='<input class="inline-button" style="padding:none" type="button" value="show" onclick="'+codereveal+'"/>';
			h+='	</p>';

			//the actual list
			h+='	<p class="firstline full-list" style="display:none">';
			h+='		Used by: '+ o.used_by.join(', ');
			h+='	</p>';
		} else {
			h+='	<p class="firstline">';
			h+='		Used by: '+ o.used_by.join(', ');
			h+='	</p">';
		}
		h+='</div> ';
	}

	h+='</div> ';
	return h;
}




//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
