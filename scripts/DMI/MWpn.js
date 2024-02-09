//namespace scope
(function( DMI, $, undefined ){

var MWpn = DMI.MWpn = DMI.MWpn || {};

var Format = DMI.Format;
var Utils = DMI.Utils;

var modctx = DMI.modctx;
var modconstants = DMI.modconstants;

//////////////////////////////////////////////////////////////////////////
// PREPARE DATA
//////////////////////////////////////////////////////////////////////////

MWpn.initWpn = function(o) {
	o.used_by = [];
	o.att = 0;
}

MWpn.prepareData_PreMod = function() {
	for (var oi=0, o; o= modctx.wpndata[oi]; oi++) {
		o.used_by = [];
	}
}

MWpn.prepareData_PostMod = function() {
	for (var oi=0, o; o= modctx.wpndata[oi]; oi++) {
		o.id = parseInt(o.id);
		o.name = o.name || '(undefined)';

		o.renderOverlay = MWpn.renderOverlay;
		o.matchProperty = MWpn.matchProperty;

		//serachable string
		o.searchable = o.name.toLowerCase();

		var effects = MWpn.getEffect(o);
		if (effects) {
			if (effects.effect_number == "2") {
				o.dmg = effects.raw_argument;
			} else if (effects.effect_number == "11") {
				if (effects.raw_argument != 258) {
					if (modctx.special_damage_types_lookup[parseInt(effects.raw_argument)]) {
						o.dmg = modctx.special_damage_types_lookup[parseInt(effects.raw_argument)].bit_name;
					} else {
						o.dmg = 999;
					}
				}
			} else if (effects.effect_number == "108") {
				if ( typeof modctx.other_planes_lookup[parseInt(effects.raw_argument)] !== 'undefined' ) {
					o.dmg = modctx.other_planes_lookup[parseInt(effects.raw_argument)].name;
				} else {
					o.dmg = "Unknown plane " + effects.raw_argument;
				}
			} else if (effects.effect_number == "146") {
				o.dmg = "Cloud";
			} else if (parseInt(effects.effect_number) >= 500 && parseInt(effects.effect_number) <= 699) {
				if (modctx.unit_effects_lookup[effects.raw_argument])
				{
					o.dmg = modctx.effects_info_lookup[effects.effect_number].name.replace(/{(.*?)}/g, "") + ": " + modctx.unit_effects_lookup[effects.raw_argument].name.replace(/{(.*?)}/g, "")
				}
				else
				{
					o.dmg = modctx.effects_info_lookup[effects.effect_number].name.replace(/{(.*?)}/g, "") + ": Unknown"
				}
			} else {
				if (modctx.effects_info_lookup[effects.effect_number]) {
					o.dmg = effects.raw_argument + " " + modctx.effects_info_lookup[effects.effect_number].name.replace(/{(.*?)}/g, "");
				} else {
					o.dmg = 999;
				}
			}
			if (effects.range_base && effects.range_base != "0") {
				o.range = effects.range_base;
			} else if (effects.range_strength_divisor) {
				o.range = "-" + effects.range_strength_divisor;
			}
			if (effects.area_base && effects.area_base != "0") {
				o.aoe = effects.area_base;
			}
		}

		if (o.dt_aff) {
			var masks_dict = modctx.afflictions_lookup;
			var values = bitfields.bitfieldValues(o.dmg, masks_dict);
			o.dmg = values[0];
		}

		//may want to display 0 damage (alongside flags)
		if (!o.dmg)
			o.dmg = '0';

		//missile / melee
		if (o.range && o.range != '0') {
			if (o.att) {
				o.prec = o.att;
				delete o.att;
			}
			o.wpnclass = 'missile';
		}
		else {
			o.wpnclass = 'melee';
			if (o.ammo == 1) {
				o.singleuse = 1;
			}
			delete o.ammo;
		}

		if (effects) {
			Utils.addFlags( o, MWpn.bitfieldValues(effects.modifiers_mask, modctx.effect_modifier_bits_lookup, o), ignorekeys )
		}

		//backlinks on secondary effects
		var secondaryeffect = modctx.wpnlookup[o.secondaryeffect] || modctx.wpnlookup[o.secondaryeffectalways];
		if (secondaryeffect)
			Utils.joinArray( Utils.wpnRef(o.id)+'(wpn)', secondaryeffect.used_by )
	}
}

//////////////////////////////////////////////////////////////////////////
// DEFINE GRID
//////////////////////////////////////////////////////////////////////////

MWpn.CGrid = Utils.Class( DMI.CGrid, function() {
	//grid columns
	var columns = [
		{ id: "name",     width: 145, name: "Weapon Name", field: "name", sortable: true },
		{ id: "wpnclass",     width: 60, name: "Type", field: "wpnclass", sortable: true }
	];

	this.superClass.call(this, 'wpn', modctx.wpndata, columns); //superconstructor

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
MWpn.matchProperty = function(o, key, comp, val) {
	if (key=='ap') key = 'armorpiercing';
	if (DMI.matchProperty(o, key, comp, val))
		return true;

	//check attached weapons
	var secondaryeffect = modctx.wpnlookup[o.secondaryeffect] || modctx.wpnlookup[o.secondaryeffectalways];
	if(secondaryeffect)
		return MWpn.matchProperty(secondaryeffect, key, comp, val);
}


//////////////////////////////////////////////////////////////////////////
// OVERLAY RENDERING
//////////////////////////////////////////////////////////////////////////

var aliases = {};
var formats = {};
var displayorder = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
	'dmg',		'damage',	function(v,o){
		if (v == '999') {
			return 'Special';
		}
		return v;
	},
	'range',	'range',	{ 1:'0', '-1':'strength', '-2':'strength/2', '-3':'strength/3', '-4':'strength/4', '-5':'strength/5' },
	'att',		'attack',	Format.Signed,
	'prec',		'precision',	Format.Signed,
	'def',		'defence',	Format.Signed,
	'len',		'length',
	'nratt',	'nbr of attacks',
	'ammo',		'ammunition',	{'0':'12'},
	'aoe',		'area of effect',
	'beam',		'beam weapon',
	'demonundead', 	'only effect demon and undead',
	'melee50',		'50% chance of being used',
	'range050',		'50% chance of being used in melee',
	'range0',		'can be used in melee',
	'special',	'special',	function(v,o){
		return v.replace(/affliction:\s*(.*)/i, 'affliction: '+Utils.ref('affliction $1','$1'));
	}
]);

var hiddenkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'id', 		'weap id',	function(v,o){ return v + ' ('+o.name+')'; },
]);
var althiddenkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'weapon', 		'weap id',	function(v,o){ return o.id + ' ('+o.name+')'; },
]);
var modderkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'rcost',	'resource cost'
]);
var flagorder = Utils.cutDisplayOrder(aliases, formats,
[
	'singleuse',	'can only be used once in battle',
	'iceweapon',	'ice weapon',
	'ironweapon',	'iron weapon',
	'woodenweapon',	'wooden weapon',
	'uwok',	'can be used underwater',
	'inanimateimmune',	'no effect on inanimate',
	'undeadimmune',	'no effect on undead',
	'norepel',	'cannot repel',
	'friendlyimmune',	'friendly units immune',
	'mind',	'mindless units immune',
	'hardmrneg',	'hard mr negate',
]);

var ignorekeys = {
	used_by:1,
	modded:1,
	id:1,
	name:1,
	weapon:1,
	secondaryeffect:1,
	secondaryeffectalways:1,
	isImplicitWpn:1,
	effect_record_id:1,
	nostr:1,
	dt_stun:1,
	dt_large:1,
	dt_small:1,
	dt_cap:1,
	dt_holy:1,
	dt_magic:1,
	dt_raise:1,
	dt_paralyze:1,
	dt_weapondrain:1,
	dt_drain:1,
	dt_poison:1,
	poison:1,
	sizeresist:1,
	dt_aff:1,
	mrnegates:1,
	armornegating:1,
	bonus:1,
	unrepel:1,
	pierce:1,
	blunt:1,
	slash:1,
	charge:1,
	flail:1,
	twohanded:1,
	fire:1,
	armorpiercing:1,
	cold:1,

	wpnclass:1,
	changeKey:1,
	searchable:1, renderOverlay:1, matchProperty:1
};


MWpn.renderOverlay = function(o, baseAtt) {
	//template
	var h=''
	h+='<div class="wpn overlay-contents"> ';

	var slotusage = (o.bonus=='1')  ?  'no slot'  :  (o['twohanded']=='1')  ?  '2 hands'  :  '1 hand';

	//header
	h+='	<div class="overlay-header" title="weap id: '+o.id+'"> ';
	h+='		<p style="float:right; height:0px;">'+slotusage+'</p>';
	h+='		<div class="h2replace">'+o.name+'</div> ';
	h+='	</div>';

	//mid
	h+='	<div class="overlay-main">';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';

	h+=		MWpn.renderWpnTable(o, true, false);
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

//weapon tables are also rendered inline in items
MWpn.renderWpnTable = function(o, isImplicitWpn, changeKey) {
	o.isImplicitWpn = isImplicitWpn; //affects display of nratt

	//template
	var h=''
	h+='		<table class="overlay-table wpn-table"> ';
	if(changeKey)	//display 'weapon' key
		h+= 		Utils.renderDetailsRows(o, althiddenkeys, aliases, formats, 'hidden-row');
	else			//display 'id' key
		h+= 		Utils.renderDetailsRows(o, hiddenkeys, aliases, formats, 'hidden-row');
	h+= 			Utils.renderDetailsRows(o, modderkeys, aliases, formats, 'modding-row');
	h+= 			Utils.renderDetailsRows(o, displayorder, aliases, formats);
	h+= 			Utils.renderDetailsFlags(o, flagorder, aliases, formats);
	h+= 			Utils.renderStrangeDetailsRows(o, ignorekeys, aliases, 'strange');
	h+= '<tr><td class="widecell" colspan="2">&nbsp;</td></tr>';

	// Attributes
	for (var oi=0, attr; attr = modctx.attributes_by_weapon[oi];  oi++) {
		if (attr.weapon_number == o.id) {
			if (attr.attribute != "302") {
				var specflags = modctx.attribute_keys_lookup[attr.attribute].name;
				h+= '<tr class="'+attr.attribute+'"><th>'+modctx.attribute_keys_lookup[attr.attribute].name.replace(/{(.*?)}|<|>/g, "")+'</th></tr>'
			}
		}
	}

	var effects = MWpn.getEffect(o);
	if (effects) {
		var specflags = Utils.renderFlags(MWpn.bitfieldValues(effects.modifiers_mask, modctx.effect_modifier_bits_lookup, o) );
		if (specflags)
			h+=		'<tr><td class="widecell" colspan="2">'+specflags+'</td></tr></div>';
	}

	//modded
	if (o.modded) {
		h+='		<tr class="modded hidden-row"><td colspan="2">' + Utils.renderModded(o) +'</td></tr>';
	}
	h+='		</table> ';

	//effects are implemented as further weapons
	var secondaryeffect = modctx.wpnlookup[o.secondaryeffect];
	var secondaryeffectalways = modctx.wpnlookup[o.secondaryeffectalways];

	if (o.secondaryeffectalways && secondaryeffectalways && secondaryeffectalways.id != 0) {
		h+=' <h4>Extra effect: '+secondaryeffectalways.name+'</h4>';
		//detect recursion
		if (secondaryeffectalways == o) {
			//throw 'Error, weapon 2nd effect as itself: '+o.id+': '+o.name;
		}
		else {
			h+= MWpn.renderWpnTable(secondaryeffectalways, true, changeKey);
		}
	}
	else if (o.secondaryeffect && secondaryeffect && secondaryeffect.id != 0) {
		h+=' <h4>Extra effect on damage: '+secondaryeffect.name+'</h4>';
		//detect recursion
		if (secondaryeffect == o){
			//throw 'Error, weapon 2nd effect as itself: '+o.id+': '+o.name;
		}
		else {
			h+= MWpn.renderWpnTable(secondaryeffect, true, changeKey);
		}
	}
	return h;
}

MWpn.bitfieldValues = function(bitfield, masks_dict, o) {
	var magic = true;
	var nostr = true;
	var halfstr = false;
	var bowstr = false;
	var newValues=[];
	var values = bitfields.bitfieldValues(bitfield, masks_dict);
	for (var value in values) {
		if (values[value].indexOf("Nonmagical") != -1) {
			magic = false;
		} else if (values[value].indexOf("Adds Strength of Wielder") != -1) {
			nostr = false;
		} else {
			if (values[value].indexOf("Half Strength added") != -1) {
				halfstr = true;
			} else if (values[value].indexOf("One Third Strength added") != -1) {
				bowstr = true;
			}
			var flag = "none";
			var flagIndex = values[value].indexOf("Wpn: #");
			if (flagIndex != -1) {
				flag = values[value].substring(flagIndex+6, values[value].length-1)
			}
			value = values[value].replace(/{(.*?)}/g, "");
			newValues.push([value, flag]);
		}
	}
	if (magic == true) {
		newValues.push(["Magic weapon", "magic"]);
	}
	if (nostr == true) {
		if (halfstr==false && bowstr==false) {
			newValues.push(["Strength not added to damage", "nostr"]);
		}
	}
	return newValues;
}

MWpn.getEffect = function(weapon) {
	var effect = {};

	// When modifying effects, we need to be careful to use a copy, not a reference,
	// otherwise modifications will be shared between all spells/weapons with the same effect.
	// I don't like this JSON hack, but it's apparently the accepted JS way of doing it

	if (weapon.effect_record_id) {
		effect = JSON.parse(JSON.stringify(modctx.effects_weapons_lookup[weapon.effect_record_id]));
	}
	if (weapon.dt_stun) {
		effect.effect_number = 3;
	} else if (weapon.dt_poison) {
		effect.effect_number = 7;
	} else if (weapon.dt_holy) {
		effect.effect_number = 24;
	} else if (weapon.dt_large) {
		effect.effect_number = 32;
	} else if (weapon.dt_small) {
		effect.effect_number = 33;
	} else if (weapon.dt_paralyze) {
		effect.effect_number = 66;
	} else if (weapon.dt_weakness) {
		effect.effect_number = 67;
	} else if (weapon.dt_magic) {
		effect.effect_number = 73;
	} else if (weapon.dt_raise) {
		effect.effect_number = 74;
	} else if (weapon.dt_constructonly) {
		effect.effect_number = 96;
	} else if (weapon.dt_drain) {
		effect.effect_number = 103;
	} else if (weapon.dt_weapondrain) {
		effect.effect_number = 104;
	} else if (weapon.dt_demon) {
		effect.effect_number = 107;
	} else if (weapon.dt_cap) {
		effect.effect_number = 109;
	} else if (!effect.effect_number) {
		effect.effect_number = 2;
	}

	if (!effect.modifiers_mask) {
		effect.modifiers_mask = "0";
		if (!weapon.nostr) {
			effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "1");
		}
		if (!weapon.magic) {
			effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "2097152");
		}
	}
	if (weapon.twohanded) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "2");
	}
	//if (weapon.flail) {
	//	effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "4");
	//}
	if (weapon.demononly) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "8");
	}
	if (weapon.fire) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "32");
	}
	if (weapon.armorpiercing) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "64");
	}
	if (weapon.armornegating) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "128");
	}
	if (weapon.cold) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "512");
	}
	if (weapon.shock) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "2048");
	}
	if (weapon.mrnegates) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "4096");
	}
	if (weapon.sacredonly) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "32768");
	}
	if (weapon.mind) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "131072");
	}
	if (weapon.friendlyimmune) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "262144");
	}
	if (weapon.undeadimmune) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "524288");
	}
	if (weapon.flyingimmune) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "1048576");
	}
	if (weapon.enemyimmune) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "4194304");
	}
	if (weapon.mrnegateseasily) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "16777216");
	}
	if (weapon.undeadonly) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "67108864");
	}
	if (weapon.bonus) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "134217728");
	}
	if (weapon.charge) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "2147483648");
	}
	if (weapon.unrepel) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "137438953472");
	}
	if (weapon.pierce) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "274877906944");
	}
	if (weapon.blunt) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "549755813888");
	}
	if (weapon.slash) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "1099511627776");
	}
	if (weapon.acid) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "2199023255552");
	}
	if (weapon.sizeresist) {
		effect.modifiers_mask = bitfields.longOr(effect.modifiers_mask, "4398046511104");
	}

	if (weapon.dmg) {
		effect.raw_argument = weapon.dmg;
	}

	if (weapon.range) {
		if (parseInt(weapon.range) < 0) {
			effect.range_strength_divisor = -parseInt(weapon.range);
		} else {
			effect.range_base = weapon.range;
		}
	}

	if (weapon.aoe) {
		effect.area_base = weapon.aoe;
	}

	return effect;

}

//namespace args
}( window.DMI = window.DMI || {}, jQuery ));

