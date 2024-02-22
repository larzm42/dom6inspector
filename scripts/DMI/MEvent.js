//namespace scope
(function( DMI, $, undefined ){

var MEvent = DMI.MEvent = DMI.MEvent || {};

var Format = DMI.Format;
var Utils = DMI.Utils;

var modctx = DMI.modctx;
var modconstants = DMI.modconstants;


//////////////////////////////////////////////////////////////////////////
// PREPARE DATA
//////////////////////////////////////////////////////////////////////////

MEvent.initEvent = function(o) {
	o.description = "";
};

MEvent.prepareData_PreMod = function() {
	for (var oi=0, o;  o= modctx.eventdata[oi];  oi++) {
		if (o.requirements) {
			var reqs = o.requirements.split('|');
			for (var reqnum=0, req; req = reqs[reqnum];  reqnum++) {
				var nameval = req.split(' ');
				if (nameval[0].indexOf('0x') == -1) {
					if (o['req_'+nameval[0]]) {
						if (o['req_'+nameval[0]].push) {
							o['req_'+nameval[0]].push(nameval[1]);
						} else {
							var oldval = o['req_'+nameval[0]];
							o['req_'+nameval[0]] = [];
							o['req_'+nameval[0]].push(oldval);
							o['req_'+nameval[0]].push(nameval[1]);
						}
					} else {
						o['req_'+nameval[0]] = nameval[1];
					}
				}
			}
		}
		if (o.effects) {
			var effs = o.effects.split('|');
			for (var effnum=0, eff; eff = effs[effnum]; effnum++) {
				var nameval = eff.split(' ');
				if (nameval[0] != 'id') {
					if (nameval[0].indexOf('0x') == -1) {
						if (o[nameval[0]]) {
							if (o[nameval[0]].push) {
								o[nameval[0]].push(nameval[1]);
							} else {
								var oldval = o[nameval[0]];
								o[nameval[0]] = [];
								o[nameval[0]].push(oldval);
								o[nameval[0]].push(nameval[1]);
							}
						} else {
							o[nameval[0]] = nameval[1];
						}
					}
				} else {
					o.eff_id = nameval[1];
				}
			}
		}
	}
}

MEvent.prepareData_PostMod = function() {
	for (var oi=0, o;  o= modctx.eventdata[oi];  oi++) {

		o.renderOverlay = MEvent.renderOverlay;
		o.matchProperty = MEvent.matchProperty;

		//convert to numbers (for column ordering)
		//doesn't seem to cause any further problems..
		o.id = parseInt(o.id);
		o.searchable = o.description.toLowerCase();

		if (o.req_code) {
			var linkedReqCodes = [];
			var reqcodes = [];
			if (o.req_code.push) {
				reqcodes = o.req_code;
			} else {
				reqcodes.push(o.req_code);
			}
			for (var ix = 0; ix < reqcodes.length; ix++) {
				if (reqcodes[ix] && reqcodes[ix] != 0) {
					for (var oj=0, o2; o2 = modctx.eventdata[oj];  oj++) {
						if (o2.code) {
							if (o2.code.push) {
								if (o2.code.indexOf(reqcodes[ix]) != -1) {
									linkedReqCodes.push(o2.id);
								}
							} else {
								if (parseInt(reqcodes[ix]) == parseInt(o2.code)) {
									linkedReqCodes.push(o2.id);
								}
							}
						}
					}
				}
			}
			o.linkedReqCodes = linkedReqCodes;
		}
		if (o.code && o.code != 0) {
			var linkedCodes = [];
			var codes = [];
			if (o.code.push) {
				codes = o.code;
			} else {
				codes.push(o.code);
			}
			for (var ix = 0; ix < codes.length; ix++) {
				if (codes[ix] && codes[ix] != 0) {
					for (var ok=0, o3;  o3 = modctx.eventdata[ok];  ok++) {
						if (o3.req_code) {
							if (o3.req_code.push) {
								if (o3.req_code.indexOf(codes[ix]) != -1) {
									linkedCodes.push(o3.id);
								}
							} else {
								if (parseInt(codes[ix]) == parseInt(o3.req_code)) {
									linkedCodes.push(o3.id);
								}
							}
						}
					}
				}
			}
			o.linkedCodes = linkedCodes;
		}
		if (o.resetcode && o.resetcode != 0) {
			var linkedResetCodes = [];
			for (var ol=0, o4;  o4 = modctx.eventdata[ol];  ol++) {
				if (o4.req_code) {
					if (parseInt(o.resetcode) == parseInt(o4.req_code)) {
						linkedResetCodes.push(o4.id);
					}
				}
			}
			o.linkedResetCodes = linkedResetCodes;
		}

	}
}

//////////////////////////////////////////////////////////////////////////
// DEFINE GRID
//////////////////////////////////////////////////////////////////////////
function formatScale(_,__,v){ return v=='z' ? "" : v; }

MEvent.CGrid = Utils.Class( DMI.CGrid, function() {
	//grid columns
	var columns = [
	    { id: "description",     width: 200, name: "Description", field: "description", sortable: true },
		{ id: "rarity",     width: 20, name: "Rarity", field: "rarity", sortable: true },
	];

	this.superClass.call(this, 'event', modctx.eventdata, columns); //superconstructor

	$(this.domsel+' .grid-container').css('width', 600);//set table width

	//in closure scope
	var that = this;

	//reads search boxes
	this.getSearchArgs = function() {
		var args = Utils.merge(this.getPropertyMatchArgs(), {
			str: $(that.domselp+" input.search-box").val().toLowerCase().trim()
		});
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
MEvent.matchProperty = function(o, key, comp, val) {
	if (DMI.matchProperty(o, key, comp, val))
		return true;
}
MEvent.formatEventGems = function(v,o,str) {
	if (v.indexOf('Elemental') != -1) {
		v = 'FAWE';
	} else if (v.indexOf('Sorcery') != -1) {
		v = 'SDNB';
	} else if (v.indexOf('All') != -1) {
		return 'All' + str;
	} else if (v.indexOf('Random') != -1) {
		return 'Random' + str;
	} else if (!isNaN(parseInt(v))) {
		return Format.Gems(modconstants[16][v]) + str;
	}
	return Format.Gems(v) + str;
}
MEvent.formatMagicEquip = function(v, o) {
	var ret = 'Unknown';
	switch(parseInt(v)) {
	case 0: ret = 'const lvl 0'; break;
	case 1: ret = 'const lvl 0-2'; break;
	case 2: ret = 'const lvl 0-4'; break;
	case 3: ret = 'const lvl 0-6'; break;
	case 4: ret = 'const lvl 4-6'; break;
	case 9:
		var itemname = o.description.match(/\[(.*?)\]/);
		if (itemname && itemname[0].length > 0) {
			ret = Utils.itemRef(itemname[1]);
		}
		break;
	}
	return ret;
}
MEvent.formatNewSite = function(v,o) {
	var ret = 'Unknown';
	switch(parseInt(v)) {
	case -1:
		var sitename = o.description.match(/\[(.*?)\]/);
		ret = Utils.siteRef(sitename[1]);
		break;
	default:
		return Utils.siteRef(parseInt(v));
	}
	return ret;
}
MEvent.formatReqSite = function(v,o) {
	var ret = 'Unknown';
	var sitename = o.description.match(/\[(.*?)\]/);

	if (sitename) {
		switch(parseInt(v)) {
			case 0:
				ret = Utils.siteRef(sitename[1]) + ' (Not present)';
				break;
			case 1:
				ret =  Utils.siteRef(sitename[1]) + ' (Present)';
				break;
			default:
				return Utils.siteRef(sitename[1]);
		}
	}
	return ret;
}
MEvent.formatMagicPath = function(v,o) {
	var ret = 'Unknown';
	switch(parseInt(v)) {
	case 0: ret = 'Fire'; break;
	case 1: ret = 'Air'; break;
	case 2: ret = 'Water'; break;
	case 3: ret = 'Earth'; break;
	case 4: ret = 'Astral'; break;
	case 5: ret = 'Death'; break;
	case 6: ret = 'Nature'; break;
	case 7: ret = 'Glamour'; break;
	case 8: ret = 'Blood'; break;
	case 9: ret = 'Holy'; break;
	}
	return ret;
}
MEvent.formatTargOrder = function(v,o) {
	var ret = v;
	switch(parseInt(v)) {
	case 0: ret = 'Defend'; break;
	case 2: ret = 'Sneak'; break;
	case 3: ret = 'Patrol'; break;
	case 4: ret = 'Research'; break;
	case 6: ret = 'Preach'; break;
	case 7: ret = 'Site search'; break;
	case 8: ret = 'Blood hunt'; break;
	case 14: ret = 'Call God'; break;
	case 18: ret = 'Build lab'; break;
	case 19: ret = 'Build temple'; break;
	case 20: ret = 'Build fort'; break;
	case 44: ret = 'Demolish fort'; break;
	case 45: ret = 'Demolish lab'; break;
	case 50: ret = 'Enter site'; break;
	case 52: ret = 'Void Summon'; break;
	}
	return ret;
}
MEvent.formatGainaff = function(v,o) {
	var masks_dict = modctx.afflictions_lookup;
	var values = bitfields.bitfieldValues(v, masks_dict);
	return values[0];
}
	MEvent.formatReqSpell = function(v,o) {
		var ench = modctx.enchantments_lookup[parseInt(v)];
		if (ench) {
			return ench.name;
		}
		return "Undefined (" + v + ")";
	}
	MEvent.formatYesNo = function(v,o) {
		switch(parseInt(v)) {
			case 0: return 'no';
			case 1: return 'yes';
		}
		return 'error';
	}
	MEvent.formatAlwaysNever = function(v,o) {
		switch(parseInt(v)) {
			case 0: return 'never';
			case 1: return 'always';
		}
		return 'error';
	}

MEvent.gainaffArr = function(v,o) {
	if (v.push) {
		//create array of refs
		var tokens = [];
		for (var i=0, uid; uid= v[i];  i++)
			tokens.push( MEvent.formatGainaff( uid, o ) );

		//comma separated & one per line
		return tokens.join(', <br />');
	} else {
		return MEvent.formatGainaff( v, o );
	}
}
MEvent.monsterArr = function(v,o,str) {
	if (v.push) {
		//create array of refs
		var tokens = [];
		for (var i=0, uid; uid= v[i];  i++)
			tokens.push( Utils.unitRef( parseInt(uid) ) + (str ? str : ''));

		//comma separated & one per line
		return tokens.join(', <br />');
	} else {
		return Utils.unitRef(parseInt(v)) + (str ? str : '');
	}
}
MEvent.nationArr = function(v,o) {
	if (v.push) {
		//create array of refs
		var tokens = [];
		for (var i=0, uid; uid= v[i];  i++)
			tokens.push( Utils.nationRef( parseInt(uid) ) );

		//comma separated & one per line
		return tokens.join(', <br />');
	} else {
		return Utils.nationRef(parseInt(v));
	}
}
MEvent.magicPathArr = function(v,o) {
	if (v.push) {
		//create array of refs
		var tokens = [];
		for (var i=0, uid; uid= v[i];  i++)
			tokens.push( MEvent.formatMagicPath( parseInt(uid)) );

		//comma separated & one per line
		return tokens.join(', <br />');
	} else {
		return MEvent.formatMagicPath(parseInt(v));
	}
}
MEvent.seasonArr = function(v,o) {
	if (v.push) {
		//create array of refs
		var tokens = [];
		for (var i=0, uid; uid= v[i];  i++) {
			switch(parseInt(uid)) {
			case 0: ret = tokens.push('spring'); break;
			case 1: ret = tokens.push('summer'); break;
			case 2: ret = tokens.push('fall'); break;
			case 3: ret = tokens.push('winter'); break;
			}

		}
		//comma separated & one per line
		return tokens.join(', <br />');
	} else {
		switch(parseInt(v)) {
		case 0: ret = 'spring'; break;
		case 1: ret = 'summer'; break;
		case 2: ret = 'fall'; break;
		case 3: ret = 'winter'; break;
		}
	}
	return ret;
}
MEvent.gemArr = function(v, o, str) {
	if (v.push) {
		//create array of refs
		var tokens = [];
		for (var i=0, uid; uid= v[i];  i++)
			tokens.push( MEvent.formatEventGems(uid, o, str) );

		//comma separated & one per line
		return tokens.join(', <br />');
	} else {
		return MEvent.formatEventGems(v, o, str);
	}
}
MEvent.magicEquipArr = function(v, o) {
	if (v.push) {
		//create array of refs
		var tokens = [];
		for (var i=0, uid; uid= v[i];  i++)
			tokens.push( MEvent.formatMagicEquip(uid, o) );

		//comma separated & one per line
		return tokens.join(', <br />');
	} else {
		return MEvent.formatMagicEquip(v, o);
	}
}
MEvent.itemArr = function(v,o) {
	if (v.push) {
		//create array of refs
		var tokens = [];
		for (var i=0, uid; uid= v[i];  i++)
			tokens.push( Utils.itemRef( parseInt(uid) ) );

		//comma separated & one per line
		return tokens.join(', <br />');
	} else {
		return Utils.itemRef(parseInt(v));
	}
}

function list_events(arr) {
	//create array of refs
	var tokens = [];
	for (var i=0, uid; uid= arr[i];  i++)
		tokens.push( Utils.eventRef( arr[i] ) );

	//comma separated & one per line
	return tokens.join(', <br />');
}

//////////////////////////////////////////////////////////////////////////
// OVERLAY RENDERING
//////////////////////////////////////////////////////////////////////////

var aliases = {};
var formats = {};
var displayorder = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
	'rarity', 'rarity', {'0': 'always', '1': 'common bad', '2': 'uncommon bad', '-1': 'common good', '-2': 'uncommon good',
	                     '10': 'always global', '11': 'common global', '12': 'uncommon global', '13': 'always immediate global' },
]);
	var requirementkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
	'req_story',	'story', MEvent.formatYesNo,
	'req_mydominion',	'owner\'s dominion', MEvent.formatYesNo,
	'req_minpop',	'miniumum pop', function(v){ return v*10; },
	'req_temple',	'temple', MEvent.formatYesNo,
	'req_lab',	'lab', MEvent.formatYesNo,
	'req_fort',	'fort', MEvent.formatYesNo,
	'req_commander',	'commander', MEvent.formatYesNo,
	'req_capital',	'capital', {'0': 'never in capitals', '1': 'only in capitals'},
	'req_claimedthrone',	'claimed throne', {'0': 'must not be claimed', '1': 'must be claimed'},
	'req_researcher',	'researcher present', function(v){ return ' '; },
	'req_humanoidres',	'humanoid researcher', function(v){ return ' '; },
	'req_dominion',	'dominion',
	'req_maxdominion',	'max dominion',
	'req_domowner',	'dominion owner',
	'req_land',	'land or sea', {'0': 'sea', '1': 'land'},
	'req_coast',	'coastal', {'0': 'cannot be coast', '1': 'must be coast'},
	'req_mountain', 'mountain', {'0': 'cannot be mountain', '1': 'must be mountain'},
	'req_forest', 'forest', {'0': 'cannot be forest', '1': 'must be forest'},
	'req_farm', 'farm', {'0': 'cannot be farm', '1': 'must be farm'},
	'req_swamp', 'swamp', {'0': 'cannot be swamp', '1': 'must be swamp'},
	'req_waste', 'waste', {'0': 'cannot be waste', '1': 'must be waste'},
	'req_cave', 'cave', {'0': 'cannot be cave', '1': 'must be cave'},
	'req_freshwater',	'land or sea', {'0': 'cannot have fresh water', '1': 'must have fresh water'},
	'req_gem', 'gem in lab', {'0': 'Fire', '1': 'Air', '2': 'Water', '3': 'Earth', '4': 'Astral', '5': 'Death', '6': 'Nature', '7': 'Blood slave'},
	'req_monster',	'monster present', MEvent.monsterArr,
	'req_nomonster',	'monster not present', MEvent.monsterArr,
	'req_nomnr', 'does not exist', MEvent.monsterArr,
	'req_mnr', 'exists', MEvent.monsterArr,
	'req_nation', 'nation in play', MEvent.nationArr,
	'req_fornation', 'for nation', MEvent.nationArr,
	'req_notnation', 'not nation', MEvent.nationArr,
	'req_notfornation',	'not nation', MEvent.nationArr,
	'req_maxunrest',	'maximum unrest',
	'req_minunrest',	'minimum unrest',
	'req_pop0ok',	'0 pop ok', function(v){ return ' '; },
	'req_maxtroops',	'maximum troops',
	'req_mintroops',	'minimum troops',
	'req_maxdef',	'maximum defence',
	'req_mindef',	'minimum defence',
	'req_poptype',	'population type',
	'req_turn',	'minimun turn',
	'req_maxturn',	'maximum turn',
	'req_season',	'only happens in', MEvent.seasonArr,
	'req_noseason',	'cannot happen in', MEvent.seasonArr,
	'req_luck',	'luck scale',
	'req_unluck',	'misfortune scale',
	'req_order',	'order scale',
	'req_chaos',	'turmoil scale',
	'req_heat',	'heat scale',
	'req_cold',	'cold scale',
	'req_death',	'death scale',
	'req_growth',	'growth scale',
	'req_prod',	'production scale',
	'req_lazy',	'sloth scale',
	'req_magic',	'magic scale',
	'req_unmagic',	'drain scale',

	'req_pathfire', 'fire mage level',
	'req_pathair', 'air mage level',
	'req_pathwater', 'water mage level',
	'req_pathearth', 'earth mage level',
	'req_pathastral', 'astral mage level',
	'req_pathdeath', 'death mage level',
	'req_pathnature', 'nature mage level',
	'req_pathblood', 'blood mage level',
	'req_pathholy', 'holy mage level',

	'req_targpath1', 'level 1+ mage', MEvent.magicPathArr,
	'req_targpath2', 'level 2+ mage', MEvent.magicPathArr,
	'req_targpath3', 'level 3+ mage', MEvent.magicPathArr,
	'req_targpath4', 'level 4+ mage', MEvent.magicPathArr,
	'req_targmnr', 'target monster', MEvent.monsterArr,
	'req_foundsite', 'found site', MEvent.formatReqSite,
	'req_hiddensite', 'hidden site', MEvent.formatReqSite,
	'req_site', 'site', MEvent.formatReqSite,
	'req_nearbysite', 'nearby site', MEvent.formatReqSite,

	'req_era',	'era', {'1': 'early', '2': 'mid', '3': 'late'},
	'req_noera',	'not era', {'1': 'early', '2': 'mid', '3': 'late'},
	'req_rare',	'rare', Format.Percent,
	'req_freesites', 'free sites available',
	'req_unique', 'max per game',
	'req_fullowner', 'full province owner',
	'req_preach', 'preaching', Format.Percent,
	'req_domchance',	'chance per candle', Format.Percent,

	'req_targorder', 'target order', MEvent.formatTargOrder,

	'req_targitem', 'item', MEvent.itemArr,

	'req_ench', 'enchantment active', MEvent.formatReqSpell,
	'req_noench', 'enchantment inactive', MEvent.formatReqSpell,
	'req_myench', 'own enchantment', MEvent.formatReqSpell,
	'req_friendlyench', 'friendly enchantment', MEvent.formatReqSpell,
	'req_hostileench', 'enemy enchantment', MEvent.formatReqSpell,
	'req_enchdom', 'enchant in own dominion', MEvent.formatReqSpell,
	'req_permonth', 'max per month',
	'req_indepok', 'happens to independants', MEvent.formatYesNo,

	'req_owncapital', 'happens in owner\'s capital', MEvent.formatAlwaysNever,
	'req_nositenbr', 'no site', Utils.siteRef,

	'req_nearbycode', 'nearby event code', Utils.eventRef,

	'req_maxpop', 'maximum population', function(v){ return v*10; },
	'req_targgod',	'target', {'0': 'cannot be god', '1': 'must be god'},
	'req_targhumanoid',	'target', {'0': 'cannot have hands', '1': 'must have hands'},
	'req_targmale',	'target', {'0': 'must be female', '1': 'must be male'},

	'linkedReqCodes', 'triggering events', list_events,
]);
var effectkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
	'incdom',	'increase dominion',
	'decscale',	'decrease by 1',
	'decscale2',	'decrease by 2',
	'decscale3',	'decrease by 3',
	'incscale',	'increase by 1',
	'incscale2',	'increase by 2',
	'incscale3',	'increase by 3',
	'worlddecscale',	'world decrease by 1',
	'worlddecscale2',	'world decrease by 2',
	'worlddecscale3',	'world decrease by 3',
	'worldincscale',	'world increase by 1',
	'worldincscale2',	'world increase by 2',
	'worldincscale3',	'world increase by 3',
	'worldunrest', 'world unrest',
	'worlddisease', 'world disease', Format.Percent,
	'worldcurse', 'world curse', Format.Percent,
	'worldmark', 'world horror mark', Format.Percent,
	'worldheal', 'world heal', Format.Percent,
	'worlddarkness',	'world darkness', function(v){ return ' '; },
	'worldage',	'world ages',
	'worldincdom',	'world increase dom',
	'worldritrebate', 'world ritual rebate', {'0': 'Conjuration',
		'1': 'Alteration',
		'2': 'Evocation',
		'3': 'Construction',
		'4': 'Enchantment',
		'5': 'Thaumaturgy',
		'6': 'Blood',
		'7': 'Divine'},
	'gold',	'gold', Format.Signed,
	'defence',	'defence', Format.Signed,
	'landgold',	'province income', Format.Signed,
	'landprod',	'province resources', Format.Signed,
	'taxboost',	'province tax', Format.Percent,
	'nation',	'owning nation', {'-1': 'random enemy', '-2': 'province owner'},
	'magicitem', 'magic item', MEvent.magicEquipArr,
	'unrest',	'unrest', Format.Signed,
	'lab', 'lab', {'0': 'lab destroyed', '1': 'new lab'},
	'temple', 'temple', {'0': 'temple destroyed', '1': 'temple gained'},
	'fort',	'fort',
	'addsite', 'new site', MEvent.formatNewSite,
	'newsite', 'new site', MEvent.formatNewSite,
	'kill',	'kill pop', Format.Percent,
	'incpop',	'increase pop',
	'emigration',	'pop emigration', Format.Percent,
	'curse',	'curse units', Format.Percent,
	'disease',	'disease units', Format.Percent,
	'strikeunits',	'unit damage',
	'addequip', 'add equipment', MEvent.magicEquipArr,
	'eff_id', 'event identifier',
	'newdom',	'new province dominion',
	'revolt',	'province revolts', function(v){ return ' '; },
	'researchaff',	'researcher affliction',
	'visitors',	'bogus and company',
	'linger',	'turns to linger',
	'revealprov',	'province revealed', function(v){ return ' '; },
	'revealsite',	'site revealed', function(v){ return ' '; },
	'banished', 'banished', {'-11': 'The Void', '-12': 'Inferno', '-13': 'Kokytos'},
	'order', 'order',
	'notext',	'no effect text', function(v){ return ' '; },
	'pathboost', 'path boost', MEvent.magicPathArr,
	'gainaff', 'gain affliction', MEvent.gainaffArr,

	'1d3vis',	'gems',	function(v,o){ return MEvent.gemArr(v, o, ' x 1d3'); },
	'1d6vis',	'gems',	function(v,o){ return MEvent.gemArr(v, o, ' x 1d6'); },
	'2d4vis',	'gems',	function(v,o){ return MEvent.gemArr(v, o, ' x 2d4'); },
	'2d6vis',	'gems',	function(v,o){ return MEvent.gemArr(v, o, ' x 2d6'); },
	'3d6vis',	'gems',	function(v,o){ return MEvent.gemArr(v, o, ' x 3d6'); },
	'4d6vis',	'gems',	function(v,o){ return MEvent.gemArr(v, o, ' x 4d6'); },
	'gemloss',	'lose gems',	function(v,o){ return MEvent.gemArr(v, o, ' x 2d6'); },

	'killmon',	'kill unit', MEvent.monsterArr,
	'killcom',	'kill commander', MEvent.monsterArr,
	'fireboost',	'boost fire', function(v,o){ return v == 1 ? '1' : Utils.unitRef(v);  },
	'airboost',		'boost air', function(v,o){ return v == 1 ? '1' : Utils.unitRef(v); },
	'waterboost',	'boost water', function(v,o){ return v == 1 ? '1' : Utils.unitRef(v);  },
	'earthboost',	'boost earth', function(v,o){ return v == 1 ? '1' : Utils.unitRef(v);  },
	'astralboost',	'boost astral', function(v,o){ return v == 1 ? '1' : Utils.unitRef(v);  },
	'deathboost',	'boost death', function(v,o){ return v == 1 ? '1' : Utils.unitRef(v);  },
	'natureboost',	'boost nature', function(v,o){ return v == 1 ? '1' : Utils.unitRef(v);  },
	'bloodboost',	'boost bood', function(v,o){ return v == 1 ? '1' : Utils.unitRef(v);  },
	'holyboost',	'boost holy', function(v,o){ return v == 1 ? '1' : Utils.unitRef(v);  },

	'stealthcom',	'stealthy commander', MEvent.monsterArr,
	'assassin',	'assassin', MEvent.monsterArr,

	'com',	'commander', 	MEvent.monsterArr,
	'2com',	'commander', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 2'); },
	'4com',	'commander', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 4'); },
	'5com',	'commander', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 5'); },

	'1unit',	'unit', 	function(v,o){ return MEvent.monsterArr(v, o); },
	'1d3units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 1d3'); },
	'1d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 1d6'); },
	'2d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 2d6'); },
	'3d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 3d6'); },
	'4d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 4d6'); },
	'5d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 5d6'); },
	'6d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 6d6'); },
	'7d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 7d6'); },
	'8d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 8d6'); },
	'9d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 9d6'); },
	'10d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 10d6'); },
	'11d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 11d6'); },
	'12d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 12d6'); },
	'13d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 13d6'); },
	'14d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 14d6'); },
	'15d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 15d6'); },
	'16d6units',	'units', 	function(v,o){ return MEvent.monsterArr(v, o, ' x 16d6'); },

	'linkedCodes', 'triggered events', list_events,
	'linkedResetCodes', 'reset events', list_events,

	'nolog', 'hidden event', MEvent.formatYesNo,
	'transform', 'transform to unit', MEvent.monsterArr,

	'tempunits', 'units', {'0': 'permanent', '1': 'temporary'},

	'hiddensite', 'hidden site', MEvent.formatNewSite,
	'removesite', 'remove site', MEvent.formatNewSite,

	'gainmark', 'gain horror mark',

	'flagland', 'event flag', {'0': 'remove', '1': 'add'},

	'nationench', 'units owned by controller of', MEvent.formatReqSpell,

	'delay', 'next event in'
	]);
var flagorder = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
]);
var hiddenkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'id', 		'event id'
]);
var modderkeys = Utils.cutDisplayOrder(aliases, formats,
[
]);
var ignorekeys = {
	modded:1,
	requirements:1,
	effects:1,
	description:1,
	code:1,
	resetcode:1,
	req_code:1,

	//common fields
	name:1,descr:1,
	searchable:1, renderOverlay:1, matchProperty:1
};

MEvent.renderOverlay = function(o) {
	//template
	var h=''
	h+='<div class="event overlay-contents"> ';

	//header
	h+='	<div class="overlay-header" title="event id: '+o.id+'"> ';
	h+='		<div class="h2replace">'+o.name+'</div> ';

	//mid
	h+='	</div>';
	h+='	<div class="overlay-main">';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';
	h+='		<table class="overlay-table"> ';
	h+= 			Utils.renderDetailsRows(o, hiddenkeys, aliases, formats, 'hidden-row');
	h+= 			Utils.renderDetailsRows(o, modderkeys, aliases, formats, 'modding-row');
	h+= 			Utils.renderDetailsRows(o, displayorder, aliases, formats);
	h+='			<tr><th>&nbsp;</th></td>';
	h+='			<tr><th><u>Requirements:</u></th></td>';
	h+= 			Utils.renderDetailsRows(o, requirementkeys, aliases, formats);
	h+='			<tr><th>&nbsp;</th></td>';
	h+='			<tr><th><u>Effects:</u></th></td>';
	h+= 			Utils.renderDetailsRows(o, effectkeys, aliases, formats);
	h+= 			Utils.renderDetailsFlags(o, flagorder, aliases, formats);
	h+= 			Utils.renderStrangeDetailsRows(o, ignorekeys, aliases, 'strange');

	//modded
	if (o.modded) {
		h+='		<tr class="modded hidden-row"><td colspan="2">' + Utils.renderModded(o) +'</td></tr>';
	}
	h+='		</table> ';

	// descr
	h+='		<div>';
	h+=	'			<p>'+o.description+'</p>'
	h+='		</div>';

	h+='	</div>';

	//footer
	//h+='	<div class="overlay-footer">';

	//wikilink
	//h+='		<div class="overlay-wiki-link non-content">';
	//h+='			<a href="http://dom3.servegame.com/wiki/'+o.name.replace(/ /g, '_')+'">[wiki]</a>';
	//h+='		</div>';
	//h+='	</div> ';
	h+='</div> ';

	return h;
}

//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
