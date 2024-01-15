//namespace scope
(function( DMI, $, undefined ){

var MItem = DMI.MItem = DMI.MItem || {};

var Format = DMI.Format;
var Utils = DMI.Utils;

var modctx = DMI.modctx;
var modconstants = DMI.modconstants;


//////////////////////////////////////////////////////////////////////////
// PREPARE DATA
//////////////////////////////////////////////////////////////////////////

MItem.initItem = function(o) {
	o.restricted = [];
	o.nationrebate = [];
}

MItem.prepareData_PreMod = function() {
	for (var oi=0, o;  o= modctx.itemdata[oi];  oi++) {
		o.restricted = [];
		var nations = Utils.keyListToTable(o, 'restricted');
		for (var oj=0, nation; nation = nations[oj]; oj++) {
			o.restricted.push(nation);
		}
		o.nationrebate = [];
		var nations2 = Utils.keyListToTable(o, 'nationrebate');
		for (var oj=0, nation; nation = nations2[oj]; oj++) {
			o.nationrebate.push(nation);
		}

	}
}

MItem.prepareData_PostMod = function() {
	var forgeCost = { 1:5, 2:10, 3:15, 4:25, 5:40, 6:60, 7:80, 8:100, 9:120 };
	var sum = Utils.sum;
	var negative = Utils.negative;
	var mult = Utils.mult;

	for (var oi=0, o;  o= modctx.itemdata[oi];  oi++) {

		o.renderOverlay = MItem.renderOverlay;
		o.matchProperty = MItem.matchProperty;

		//convert to numbers (for column ordering)
		//doesn't seem to cause any further problems..
		o.id = parseInt(o.id);
		o.name = o.name || '(undefined)';
		o.constlevel = parseInt(o.constlevel);

		if (o.descr)
			o.descr = '<p>' + o.descr.replace('\n','</p><p>') + '</p>';

		if (o.restricted) {
			// Parse the restricted nations to a list of IDs
			var parsedNations = [];
			for (var ni=0, nid, n; nid= o.restricted[ni]; ni++) {
				if (!(n= modctx.nationlookup[nid])) {
					console.log('nation "'+nid+ '" not found (item '+o.id+')');
					continue;
				}
				parsedNations.push(n.id);
			}
			o.restricted = parsedNations;

			if (o.restricted.length == 0) {
				delete o.restricted;
			}
		}

		if (o.nationrebate) {
			// Parse the national discounts to a list of IDs
			var parsedNations = [];
			for (var ni=0, nid, n; nid= o.nationrebate[ni]; ni++) {
				if (!(n= modctx.nationlookup[nid])) {
					console.log('nation "'+nid+ '" not found (item '+o.id+')');
					continue;
				}
				parsedNations.push(n.id);
			}
			o.nationrebate = parsedNations;

			if (o.nationrebate.length == 0) {
				delete o.nationrebate;
			}
		}

		//serachable string
		o.searchable = o.name.toLowerCase();

		//sprite
		if (o.copyspr) {
			o.sprite = 'images/items/item'+o.copyspr.id+'.png';
		} else if (o.spr) {
			o.sprite = 'mods/' + o.spr.replace('.tga', '.png').replace(/^.\//, '');
		} else {
			o.sprite = 'images/items/item'+o.id+'.png';
		}

		//combine linked armor stats
		if (o.armor) {
			var a = modctx.armorlookup[o.armor];
			if (!a) {
				console.log( 'armor "'+o.armor+'" not found (item '+o.id+')');
				continue;
			}
			//backlink on armor
			a.used_by.push( Utils.itemRef(o.id) + '(item)' );
			o.armor = a;

			o.prot = a.prot
			o.protbody = a.protbody;
			o.protshield = a.protshield;
			o.prothead = a.prothead;
			o.enc = a.enc;
			o.parry = a.parry;

			o.def = sum(o.def, a.def);
		}

		//clear secondarylevel if secondarypath was removed
		if (o.secondarypath=='') o.secondarylevel = '';

		//path: E1D1
		if (o.mainpath) {
			o.mpath = o.mainpath + o.mainlevel + (o.secondarypath || "") + (o.secondarylevel || "");
		}

		//gemcost: 5E5D
		var mult1 = 1;
		if (o.itemcost1) {
			mult1 += o.itemcost1/100;
		}
		var mult2 = 1;
		if (o.itemcost2) {
			mult2 += o.itemcost2/100;
		}
		
		o.gemcost = Math.round(forgeCost[o.mainlevel]*mult1) + o.mainpath + (Math.round(forgeCost[o.secondarylevel]*mult2) || "") + (o.secondarypath || "");

		//booster +DDD
		o.boosters = "";
		for (var i=0; i<modconstants.pathkeys.length; i++) {
			var p = modconstants.pathkeys[i];
			for (var j=0; j<parseInt(o[p]); j++)
				o.boosters += p;
		}

		// storm power grants storm-immune
		if (o.stormpower && o.stormpower > 0) {
			o.stormimmune = '1';
		}

		//lookup weapon
		if (o.weapon) {
			w = modctx.wpnlookup[o.weapon];
			if (!w) console.log( 'weapon "'+o.weapon+'" not found (item '+o.id+')');
			//backlink on wpn
			else w.used_by.push( Utils.itemRef(o.id) + ' (item)' );
			o.weapon = w;
		}
		//set weapon class (ranged or melee)
		if (o.type == '1-h wpn' || o.type == '2-h wpn') {
			var w = o.weapon;
			if (w && w.ammo && w.ammo != '0')
				o.wpnclass = 'missile';
			else
				o.wpnclass = 'melee';
		}

		if (o.boosters && o.boosters != "")
			o.boosters = '+'+o.boosters;

//		if (o.spell) {
//			var spell = DMI.modctx.spelllookup[o.spell];
//			if (o.type=='Ritual') {
//				o.ritual=o.spell;
//			} else {
//				o.itemspell=o.spell;
//			}
//		}
		if (o.autospell) {
			if (o.autospellrepeat) {
				o.autocombatspell = o.autospell;
			} else {
				o.startbattlespell = o.autospell;
			}
		}

	}
}



//////////////////////////////////////////////////////////////////////////
// DEFINE GRID
//////////////////////////////////////////////////////////////////////////

function itemConFormatter(row, cell, value, columnDef, dataContext) {
	if (value==12) return 'Unforgeable';
	return "Constr " + value;
}

function itemNameFormatter(row, cell, value, columnDef, dataContext) {
	if (dataContext.restricted)
		return '<div class="national-spell">'+value+'</div>';
	return value;
}

MItem.CGrid = Utils.Class( DMI.CGrid, function() {
	//grid columns
	var columns = [
		{ id: "name",     width: 145, name: "Item Name", field: "name", sortable: true, formatter: itemNameFormatter, sortCmp: 'text' },
		{ id: "type",     width: 60, name: "Type", field: "type", sortable: true, sortCmp: 'text' },
		{ id: "constlevel",      width: 70, name: "Research", field: "constlevel", sortable: true, formatter: itemConFormatter },
		{ id: "mpath",    width: 70, name: "Path req", field: "mpath", sortable: true, formatter: DMI.GridFormat.Paths, sortCmp: 'text' },
		{ id: "boosters", width: 165, name: "Boosters", field: "boosters", sortable: true, formatter: DMI.GridFormat.Booster }
	];

	this.superClass.call(this, 'item', modctx.itemdata, columns); //superconstructor

	$(this.domsel+' .grid-container').css('width', 530);//set table width


	//in closure scope
	var that = this;

	//selecting a nation
	$(that.domselp+" select.nation").bind('change', function(e) {
		//clicked a nation? (or era.. but not "any")
		if (! $(that.domselp+" select.nation option.default").prop('selected')) {
			//currently showing "all units"?
			if ( $(that.domselp+" select.typechar option.default").prop('selected')) {
				//show only national units
				$(that.domselp+" select.typechar option.available").prop('selected', true).parent().saveState();
				$(that.domselp+" input.national").prop('checked', true).saveState();
				$(that.domselp+".filters-units input.clear-filters-btn").show();
			}
		}
	});

	//selecting national/generic deselects the other
	$(that.domselp+" input.national").bind('change click', function(e) {
		if ($(this).prop('checked'))
			$(that.domselp+" input.generic").prop('checked', false).saveState();
	});
	$(that.domselp+" input.generic").bind('change click', function(e) {
		if ($(this).prop('checked'))
			$(that.domselp+" input.national").prop('checked', false).saveState();
	});

	//reads search boxes
	this.getSearchArgs = function() {
		var args = {properties: this.getPropertyMatchArgs(),
			str: $(that.domselp+" input.search-box").val().toLowerCase().trim(),
			type: Utils.splitToLookup( $(that.domselp+" select.type").val(), ','),
			constlevel: parseInt( $(that.domselp+" select.constlevel").val() ),
			inclusive: $(that.domselp+" input.inclusive-search:checked").val(),
			nation: $(that.domselp+" select.nation").val(),
			generic: $(that.domselp+" input.generic:checked").val(),
			national: $(that.domselp+" input.national:checked").val(),
			mpaths: ''
		};
		args.properties = Utils.propertiesWithKeys(args.properties);


		if ($.isEmptyObject(args.type)) delete args.type;

		//create string of mpaths from checkboxes
		$(that.domselp+' .toggle-path:checked').each(function() {
			args.mpaths += this.value;
		});
		return args;
	}
	//apply search
	this.searchFilter =  function(o, args) {
		//type in id to ignore filters
		if (args.str && args.str == String(o.id)) return true;

		//check construction level
		if (args.constlevel==12 && o.constlevel!=12)
			return false;
		if (o.constlevel > args.constlevel)
			return false;

		//search string
		if (args.str && o.searchable.indexOf(args.str) == -1)
			return false;

		//magic paths
		if (args.mpaths) {
			if(args.inclusive) {
				if(args.mpaths.indexOf(o.mainpath) == -1) {
					if(!o.secondarypath) {
						return false;
					} else {
						if(args.mpaths.indexOf(o.secondarypath) == -1)
							return false;
					}
				}
			} else {
				if (args.mpaths.indexOf(o.mainpath) == -1)
					return false;
				if (o.path2 && args.mpaths.indexOf(o.secondarypath) == -1)
					return false;
			}
		}

		//item type
		if (args.type && !(args.type[o.type] || args.type[o.wpnclass]))
				return false;

		//national (national units only)
		if (args.national && (!o.restricted))
			return false;
		//generic (generic units only)
		if (args.generic && o.restricted)
			return false;

		//nation
		if (args.nation && o.restricted) {
			if (!o.restricted.includes(args.nation))
				return false;
		}

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


		if (args.customjs) {
			var res = DMI.customFilter(o, args.customjs);
			if (res == '#ERROR#')
				args.customjs = null;
			else if (!res)
				return false;
		}
		return true;
	}

	//customise sort
	this.preSort = function(){
		//bound scope
		var boosterSortPriority = ['F', 'A', 'W', 'E', 'S', 'D', 'N', 'B', 'H'];
		var isSortedOnBoosters = false;
		var data = modctx.itemdata;

		//the actual callback
		return function(e, args) {
			if (args.sortCol.field == 'boosters') {
				//rotate booster priority
				// if (isSortedOnBoosters)
				// 	boosterSortPriority.unshift(boosterSortPriority.pop());

				// var L = boosterSortPriority[0];

				// //pull priority to front of booster strings
				// var regex = new RegExp('^.([^'+L+']*)('+L+'+)([^'+L+']*)$');
				// for (var i=0; i<data.length; i++) {
				// 	var b = data[i].boosters;
				// 	if (b && b.indexOf(L)!=-1)
				// 		data[i].boosters = b.replace(regex, "_$2$1$3");
				// 	else if (b)
				// 		data[i].boosters = b.replace('_','+');
				// }
				if (isSortedOnBoosters) {
					//rotate priority
					var pL = boosterSortPriority[0];
					boosterSortPriority.push(boosterSortPriority.shift());

					//push last priority to end
					var regex = new RegExp('^.('+pL+'+)(.*)$');
					for (var i=0; i<data.length; i++) {
						var b = data[i].boosters;
						if (b && b.indexOf(pL)!=-1)
							data[i].boosters = b.replace(regex, "+$2$1");
					}
				}
				var L = boosterSortPriority[0];

				//set first character to number of instances of L
				for (var i=0; i<data.length; i++) {
					var b = data[i].boosters;
					if (b && b.indexOf(L)!=-1)
						data[i].boosters =  String(b.split(L).length-1) + b.substr(1);
					if (!b) {
						data[i].boosters = '0';
					}
				}
				//switch sort column header icon
				if ( $('#itemboosterordericon')
				     .attr({alt:L, src:'images/magicicons/Path_'+L+'.png', 'class':'pathicon Path_'+L})
				     .css('visibility','visible')
				     .length==0 )
				{
					//add icon if not exists yet
					$(".slick-header-column[id*=boosters]")
					.append('<img id="itemboosterordericon" alt="'+L+'" class="pathicon Path_'+L+'" src="images/magicicons/Path_'+L+'.png" />')
					.find(".slick-sort-indicator").css('visibility','hidden');
				}
				//fix sort direction
				args.sortAsc = false;
				isSortedOnBoosters = true;
			}
			else  {
				//hide sort column header icon if sorting another column
				$('#itemboosterordericon').css('visibility','hidden');
				isSortedOnBoosters = false;
			}
		}
		//exit bound scope
	}();

	//call filters and update  display
	//asyncronous to make sure all filter inputs are correctly initialised
	setTimeout(function() {
		that.init();
	},0);
});
MItem.matchProperty = function(o, key, comp, val) {
	if (key=='ap') key = 'armorpiercing';
	if (DMI.matchProperty(o, key, comp, val))
		return true;

	//check attached weapon
	if (o.weapon && key.toLowerCase()!='id'){
		return DMI.MWpn.matchProperty(o.weapon, key, comp, val);
	}
}


//////////////////////////////////////////////////////////////////////////
// OVERLAY RENDERING
//////////////////////////////////////////////////////////////////////////

var aliases = {};
var formats = {};
var displayorder_armor = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
	'protbody',	'protection, body',
	'prothead',	'protection, head',
	'protshield',	'protection, shield',
	'def',		'defence',		Format.Signed,
	'parry',	'parry',
	'enc',		'encumbrance'
]);
var displayorder2 = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'boosters',	'magic bonus',		Format.Booster,
	'restricted', 'restricted', function(v,o)
	{
		var restrictedString = '';
		for (var i=0, k; k=o.restricted[i]; i++) {
			restrictedString = restrictedString + Utils.nationRef(k) + '<br/>';
		}
		return restrictedString;

	},
	'pen',		'magic penetration',

	'ap',		'bonus action points',
	'ga',		'generates air gems',		function(v){ return Format.PerTurn(Format.Gems(v+'A')); },
	'gb',		'generates blood slaves',	function(v){ return Format.PerTurn(Format.Gems(v+'B')); },
	'gd',		'generates death gems',		function(v){ return Format.PerTurn(Format.Gems(v+'D')); },
	'ge',		'generates earth gems',		function(v){ return Format.PerTurn(Format.Gems(v+'E')); },
	'gf',		'generates fire gems',		function(v){ return Format.PerTurn(Format.Gems(v+'F')); },
	'gs',		'generates astral gems',	function(v){ return Format.PerTurn(Format.Gems(v+'S')); },
	'gn',		'generates nature gems',	function(v){ return Format.PerTurn(Format.Gems(v+'N')); },
	'gw',		'generates water gems',		function(v){ return Format.PerTurn(Format.Gems(v+'W')); },

	'tmpairgems',		'temporary air gems',		function(v){ return Format.Gems(v+'A'); },
	'tmpbloodslaves',		'temporary blood slaves',	function(v){ return Format.Gems(v+'B'); },
	'tmpdeathgems',		'temporary death gems',		 function(v){ return Format.Gems(v+'D'); },
	'tmpearthgems',		'temporary earth gems',		function(v){ return Format.Gems(v+'E'); },
	'tmpfiregems',		'temporary fire gems',		function(v){ return Format.Gems(v+'F'); },
	'tmpastralgems',		'temporary astral gems',	function(v){ return Format.Gems(v+'S'); },
	'tmpnaturegems',		'temporary nature gems',	function(v){ return Format.Gems(v+'N'); },
	'tmpwatergems',		'temporary water gems',		function(v){ return Format.Gems(v+'W'); },

	'str',		'strength',		Format.Signed,
	'reinvigoration',		'reinvigoration',
	'att',		'attack',		Format.Signed,
	'hp',		'hitpoints',		Format.Signed,

	'darkvision',	'darkvision',

	'airshield',	'air shield',		Format.Percent,
	'mr',		'magic resistance',	Format.Signed,
	'limitedregeneration',	'limited regeneration',		Format.Percent,
	'regeneration',	'regeneration',		Format.Percent,

	'spelleffect',	'bearer affected by spell',	Utils.spellRef,

	'prot',		'basic protection',
	'protf',	'protective force',
	'poisonres',	'resist poison',	Format.Signed,

	'barkskin',	'barkskin',		{1: '10 protection (+1 if already 10 or higher)'},
	'fireres',	'resist fire', 		Format.Signed,

	'stoneskin',	'stoneskin',		{1: '15 protection (+2 if already 14 or higher)'},
	'coldres',	'resist cold', 		Format.Signed,
	'iceprot',	'ice protection',

	'ironskin',	'ironskin',		{1: '20 protection (+3 if already 18 or higher)'},

	'shockres',	'resist shock',		Format.Signed,
	'woundfend',	'affliction resistence',
	'taint',	'horrormark chance', Format.Percent,
	'aging',	'advanced aging',
	'yearturn',	'power of the turning year',
	'iceforging',	'iceforging',

	'dragonmastery', 'Dragon mastery',
	'patience', 'patience',

	'morale',		'morale bonus',		Format.Signed,
	'exp',		'experience bonus',	Format.SignedPerTurn,
	'researchbonus',	'research bonus',	Format.Signed,
	'prec',		'precision bonus',	Format.Signed,
	'firerange',	'fire ritual range bonus',	Format.Signed,
	'airrange',	'air ritual range bonus',	Format.Signed,
	'waterrange',	'water ritual range bonus',	Format.Signed,
	'earthrange',	'earth ritual range bonus',	Format.Signed,
	'astralrange',	'astral ritual range bonus',	Format.Signed,
	'deathrange',	'death ritual range bonus',	Format.Signed,
	'naturerange',	'nature ritual range bonus',	Format.Signed,
	'bloodrange',	'blood ritual range bonus',	Format.Signed,

	'batstartsum',	'summons in battle',	function(v,o){
		return Utils.is(o.n_batstartsum) ?  Utils.unitRef(v)+' x '+o.n_batstartsum  :  Utils.unitRef(v);
	},

	'fireshield',	'fire shield', function(v){ return parseInt(v)+8; },
	'uwfireshield',	'underwater fire shield',
	'banefireshield',	'banefire shield',
	'acidshield',	'acid splash',
	'autohealer',	'healer',
	'autodishealer',	'disease healer',
	'healer',		'healer',
	'chill',	'cold aura',
	'bloodvengeance',	'blood vengeance',
	'curseluckshield',	'fateweaving',
	'taskmaster',	'taskmaster',
	'poisoncloud', 'poison cloud',
	'poisonskin', 'poison skin',
	'diseasecloud',	'disease cloud',
	'alch', 'alchemy bonus', Format.Percent,
	'nobadevents',	'fortune teller',	Format.Percent,

	'ivylord',		'ivy lord',
	'corpselord',		'corpse lord',		function(v){ return '+'+v+' '+Utils.unitRef(534)+' construction'; },
	'lictorlord',		'lictor lord',		function(v){ return '+'+v+' '+Utils.unitRef(259)+' summoning'; },

	'startbattlespell',	'start battle spell',	Utils.spellRef,
	'autocombatspell',	'auto spell',	Utils.spellRef,
	'itemspell',		'spell',		Utils.spellRef,

	'ldr-n',		'leadership',		Format.Signed,
	'ldr-m',		'leadership (magic)',	Format.Signed,
	'ldr-u',		'leadership (undead)',	Format.Signed,
	'inspirational',		'inspirational leadership',	Format.Signed,

	'airtransport',		'map flight',		function(v){ if (v==1) return '(self only)'; else return 'self + total size '+v; },
	'waterbreathing',	'water breathing',
	'giftofwater',	'water breathing',	function(v){ if (v==1) return '(self only)'; else return 'self + total size '+v; },
	'mapspeed',		'map move bonus',

	'insa',		'bearer grows insane',	function(v){ return '+'+v+'% chance per turn'; },
	'horrormarks',		'horror marks bearer',	function(v){ return v+'% chance per turn'; },
	'berserk',		'berserk when wounded',	Format.SignedZero,
	'awe',			'awe',			Format.SignedZero,
	'animalawe',			'animal awe',		Format.SignedZero,
	'fear',			'fear',			Format.SignedZero,

	'standard',		'battle standard (morale)',

	'heretic',		'heretic',

	'sailingshipsize',		'sailing ship size',
	'sailingmaxunitsize',		'sailing max unit size',
	'flytr',		'flying transport',

	'patrolbonus',			'patrol bonus',		Format.Signed,
	'douse',		'blood hunt bonus',	Format.Signed,
	'supplybonus',	'supply bonus',		Format.Signed,
	'siegebonus',		'siege bonus',		Format.Signed,
	'ironvul',		'iron vulnerability',		Format.Signed,
	'deadhp',		'hitpoints per corpse eaten',		Format.Signed,
	'diseaseres',		'disease resistance',		Format.Percent,
	'castledef',	'castle defence',
	'forge',		'forge bonus',		Format.Percent,
	'fixforge',		'fixed forge bonus',
	'pillagebonus',			'pillage bonus',	Format.Signed,
	'stealth',		'stealth',	Format.Signed,
	'stealthb',		'stealth bonus',	Format.Signed,
	'gold', 		'gold generation',	Format.PerTurn,
	'bloodsac',		'blood sacrifice',	Format.Signed,
	'mastersmith',	'master smith',
	'armysize',		'army size report',	Format.Signed,
	'defender',		'may be attacked by',	Utils.unitRef,
	'guardspiritbonus', 'guardian spirit',
	'reanimH', 'reanimation bonus (holy)',
	'reanimD', 'reanimation bonus (death)',

	'sumauto',		'auto summoned unit',	Utils.unitRef,
	'retinue', 		'retinue', 		Utils.unitRef,

	'affliction',		'afflicts bearer',	Utils.afflictionRef,
	'cannotwear',		'restriction',		{2:'cannot be worn by mounted units', 536870912:'can only be worn by coldblooded units', 1073741824:'cannot be worn by inanimate units'},
	'restrictions',		'restrictions',
	'special',		'special',		Utils.parseObjectRefs,
	'restricteditem', 'unit restriction',
	'sneakunit','grant stealth', Format.SignedZero,
	'command', 'grant leadership',
	'magiccommand', 'grant magic leadership',
	'undcommand', 'grant undead leadership',
	'raiseonkill', 'raise victims as soulless',
	'incscale',	'increase scale', function(v,o){ return Utils.getScale(v); },
	'decscale',	'increase scale', function(v,o){ return Utils.getScaleInverted(v); },
	'reform',	'chance to reform when killed',	Format.Percent,
	'haltheretic',	'fatigue sacreds',		Format.SignedZero,
	'raiseshape', 'raises unit',	Utils.unitRef,

	'digest', 'digest',
	'aciddigest', 'acid digest',
	'incorporate', 'incorporate',
	
	'noforgebonus', 'noforgebonus',
	'hpbonus', 'hp bonus',
	'nationrebate', 'national discount', function(v,o)
	{
		var nationalString = '';
		for (var i=0, k; k=o.nationrebate[i]; i++) {
			nationalString = nationalString + Utils.nationRef(k) + '<br/>';
		}
		return nationalString;

	},
	'itemcost1', 'itemcost1',
	'itemcost2', 'itemcost2',
	'warning', 'warning',
	'mapmovebonus', 'map move bonus',
	'slowaging', 'slow aging', Format.Percent,
	'transformwearer', 'transform wearer', Utils.unitRef,
	'feeblemindprovince', 'feeblemind province',
	'supayasummonbonus', 'supaya summon bonus',
	'bearergainsinsanity', 'bearer gains insanity',
	'bearergainsinsanitypermonth', 'bearer gains insanity per month',
	'infernoret', 'inferno return', Format.Percent,
	'kokytosret', 'kokytos return', Format.Percent,
	'heataura', 'heataura',
	'uwheat', 'underwater heataura',
	'agingreductiontoallunits', 'slows down aging in province', Format.Percent,
	'fastcasting', 'fastcasting',
	'xpgainpermonth', 'xp gain per month',
	'extralife', 'extra life',
	'bloodsearcher', 'blood searcher',
	'stormpower', 'storm power',
	'chaospower', 'chaos power',
	'firepower', 'fire power',
	'coldpower', 'cold power',
	'magicpower', 'magic power',
	'darkpower', 'dark power',
	'slothpower', 'sloth power',
	'deathpower', 'death power',
	'batstartsum2', 'batstartsum2', function(v,o){
		return Utils.unitRef(v)+' x 2';
	},
	'batstartsum3', 'batstartsum3', function(v,o){
		return Utils.unitRef(v)+' x 3';
	},
	'batstartsum5d6', 'batstartsum5d6', function(v,o){
		return Utils.unitRef(v)+' x 5d6';
	},
	'goldgen', 'gold production',

	'damagereversal', 'damagereversal',
	'mustfightinarena', 'mustfightinarena',
	'inquisitor', 'inquisitor',
	'assassin', 'assassin',
	'spreaddeathormisfortune', 'spreaddeathormisfortune',
	'coldaura', 'coldaura',
	'mindslime', 'mind slime',
	'flyingmaxtotalsize', 'flyingmaxtotalsize',
	'flyingmapmove', 'flyingmapmove',
	'arenareward', 'arenareward',
	
	'swiftness', 'swiftness',
	'leper', 'reaper',
	'invulnerable', 'invulnerability',
	'horrormarkattacker', 'horror mark attacker',
	'minsizetoequip', 'minimum size',
	'maxsizetoequip', 'maximum size',
	'minstrtoequip', 'minimum str',
	'minhandstoequip', 'minimum hands',
	'deathgemonkill', 'death gem on kill',
	'deathexplosion', 'explosion on death',
	'chanceofattackbyknights', 'attack by knights', Format.Percent,
	'domspreader', 'dom spreader',
	'monstermustbepresent', 'monster must be present', Utils.unitRef,
	'banishkiller', 'banish killer', Utils.planesRef,
	'masterritualist', 'master ritualist',
	'stunattackers', 'overcharged',
	'unhindered', 'unhindered',
	'localsun', 'counts as sun',
	'poisonarmor', 'poison barbs',
	'curserandomunits', 'curses number of units in province',
	'voidbanishchance', 'chance to be banished to void', Format.Percent,
	'voidret', 'void returning bonus', Format.Percent,
	'chancetobecomewerewolf', 'chance to become werewolf', Format.Percent,
	'farsail', 'sailing distance increase',
	'stormimmune', 'storm immunity',
	'lesserhorrorattackchance', 'attack by lesser horrors', Format.Percent,
	'eatforyouth', 'eat for youth', function(v,o){
		return '-' + v +' years';
	}

]);
var flagorder = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
	'eth',		'ethereal',
	'mount',	'mountain survival',
	'forest',	'forest survival',
	'waste',	'waste survival',
	'swamp',	'swamp survival',
	'cursed',	'unremovable',
	'bless',	'blessed',
	'trample',	'trample',
	'fly',		'flying',
	'quick',	'quickness',
	'bers',		'gone berserk',
	'disease',	'diseases bearer',
	'reaper',	'spreads disease',
	'crossbreeder',	'crossbreeding bonus',
	'airbr',	'air breathing',
	'float',	'grants floating',
	'luck',		'lucky',
	'foolsluck',	'fool\'s luck',
	'curse',	'curses bearer',
	'eyeloss',	'cause eyeloss',
	'nofind',	'won\'t be picked up',
	'nomounted', 'cannot be used by mounted beings',
	'nocoldblood', 'cannot be used by coldblooded beings',
	'nodemon', 'cannot be used by demons',
	'noundead', 'cannot be used by undead',
	'noinanim', 'cannot be used by inanimate beings',
	'nofemale', 'cannot be used by female beings',
	'onlymounted', 'can only be used by mounted beings',
	'onlycoldblood', 'can only be used by coldblooded beings',
	'onlydemon', 'can only be used by demons',
	'onlyundead', 'can only be used by undead',
	'onlyinanim', 'can only be used by inanimate beings',
	'onlyfemale', 'can only be used by female beings',
	'reqeyes', 'can only be used by a being with eyes',
	'haste',	'haste',
	'nodiscount',	'no forge discounts',
	'swimming', 'swimming',
	
	'crown', 'crown',
	'twistfate', 'twist fate',
	'mason', 'mason',
	'blesssacredonly', 'bless sacred only',
	'returning', 'returning',
	'curseattacker', 'curses attacker',
	'seduction', 'seduction ability',
	'wintermove', 'winter move',
	'floating', 'floating',
	'spiritsight', 'spirit sight',
	'invisibility', 'invisibility',
	'diseasegrinder', 'diseasegrinder',
	'petrification', 'petrification',
	'magiceye', 'magiceye',
	'entangle', 'entangles attacker',
	'singleuse', 'single use',
	'allunitslooklikebearertoscouts', 'false army',
	'onlyuseablebyfliersormounted', 'can only be used by fliers or mounted',
	'commaster', 'communion master',
	'comslave', 'communion slave',
	'chestwound', 'applies chest wound',
	'feeblemind', 'applies feeblemind',
	'enlargement', 'enlargement',
	'limitedenlargement', 'limited enlargement',
	'antimagic', 'wearer gets resist magic effect',
	'soulvortex', 'provides soul vortex',
	
	'islance', 'is a lance',
	
	'champprize', 'Arena championship prize'
]);
var hiddenkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'id', 		'item id',
	'armor',	'armor id',	function(v,o){ return v.id+' ('+v.name+')'; }
]);
var modderkeys = Utils.cutDisplayOrder(aliases, formats,
[
	'copyspr',	'copyspr', function(v,o){ return v && v.id!=o.id && v.id; },
	'notes',	'notes'
]);
var ignorekeys = {
	modded:1,
	mpath:1,
	type:1,
	weapon:1,
	armor:1,
	constlevel:1,
	mainpath:1, mainlevel:1, secondarypath:1, secondarylevel:1,
	A:1, B:1, D:1, E:1, F:1, N:1, S:1, W:1, H:1,
	animalawe2:1,iceprot2:1,

	gemcost:1,
	wpnclass:1,
	alch:1,
	protb:1,
	spr:1,
	sprite:1,
	nations:1,
	spell:1,
	autospell:1,
	autospellrepeat:1,
	n_batstartsum:1,
	ritual:1,
	startitem:1,

	//common fields
	name:1,descr:1,
	searchable:1, renderOverlay:1, matchProperty:1
};

var formatItemType = {	'2-h wpn':'two handed weapon',
			'1-h wpn':'one handed weapon',
			'misc':'miscellaneous',
			'helm':'helmet',
			'crown':'crown',
			'shield':'shield',
			'armor':'armor',
			'boots':'boots'
		};
var formatItemCon = {	0:'(lvl 0)',
			2:'(lvl 2)',
			4:'(lvl 4)',
			6:'(lvl 6)',
			8:'(lvl 8 - unique)',
			12:''
		};

MItem.renderOverlay = function(o) {
	var descrpath = 'gamedata/itemdescr/';

	//template
	var h=''
	h+='<div class="item overlay-contents"> ';

	//header
	h+='	<div class="overlay-header" title="item id:'+o.id+'"> ';
	h+='		<div class="item-image"><img style="float:right; clear:right; vertical-align:top; margin-right:25px" src="'+o.sprite+'";}"/>&nbsp;</div>';
	h+='		<div class="h2replace">'+o.name+'</div> ';
	h+='		<p>'+formatItemType[o.type]+' '+formatItemCon[o.constlevel]+'</p>';

	//mid
	h+='	</div>';
	h+='	<div class="overlay-main">';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';
	h+='		<table class="overlay-table"> ';
	h+= 			Utils.renderDetailsRows(o, hiddenkeys, aliases, formats, 'hidden-row');

	//armor
	h+= 			Utils.renderDetailsRows(o, displayorder_armor, aliases, formats);

	//armor modded
	if (o.armor && o.armor.modded) {
		h+='		<tr class="modded hidden-row"><td colspan="2">' + Utils.renderModded(o.armor) +'</td></tr>';
	}
	h+= 			Utils.renderDetailsRows(o, displayorder2, aliases, formats);
	h+= 			Utils.renderDetailsRows(o, modderkeys, aliases, formats, 'modding-row');
	h+= 			Utils.renderDetailsFlags(o, flagorder, aliases, formats);
	h+= 			Utils.renderStrangeDetailsRows(o, ignorekeys, aliases, 'strange');

	//modded
	if (o.modded) {
		h+='		<tr class="modded hidden-row"><td colspan="2">' + Utils.renderModded(o) +'</td></tr>';
	}
	h+='		</table> ';

	//weapon
	if (o.weapon ){//&& modctx.wpnlookup[o.weapon]) {
		var isImplicitWpn = (o.type == '1-h wpn' || o.type == '2-h wpn');
		h+= DMI.MWpn.renderWpnTable(o.weapon, isImplicitWpn, true);
	}
	h+='	</div>';

	//footer
	h+='	<div class="overlay-footer">';

	//wikilink
	if (!o.moddedname)
		h+='	<div class="overlay-wiki-link non-content">' + Utils.wikiLink(o.name) + '</div>';

	//cost
	if (o.constlevel == '12')
		h+='	<p class="firstline">Item cannot be forged.</p>';
	else
		h+='	<p class="firstline">Requires '+Format.Gems(o.gemcost) +' to forge ('+Format.Paths(o.mpath)+')</p>';

	//descr
	var uid = 'c'+(Math.random());
	uid = uid.replace('.','');
	h+='		<div class="overlay-descr pane-extension '+uid+'"></div>';

	if (o.descr)
			Utils.insertContent( '<p>'+o.descr+'</p>', 'div.'+uid );
	else {
			var url = descrpath + Utils.descrFilename(o.name);
			Utils.loadContent( url, 'div.'+uid );
	}
	h+='	</div> ';

	h+='</div> ';

	return h;
}


//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
