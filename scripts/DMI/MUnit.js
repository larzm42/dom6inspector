
//namespace scope
(function( DMI, $, undefined ){

var MUnit = DMI.MUnit = DMI.MUnit || {};
var Format = DMI.Format;
var Utils = DMI.Utils;

var modctx = DMI.modctx;
var modconstants = DMI.modconstants;

MUnit.realmNames = {
		0:	'None',
		1: 	'North',
		2: 	'Celtic',
		3: 	'Mediterranean',
		4: 	'Far East',
		5: 	'Middle East',
		6: 	'Middle America',
		7: 	'Africa',
		8: 	'India',
		9: 	'Deeps',
		10: 'Default'
}

//determines unit type sort order (and identifies commanders)
MUnit.unitSortableTypes = {
	'cmdr (cap only)': 		'aaa.cmdr',
	'cmdr (future cap only)': 		'aaab.cmdr',
	'cmdr (cave)': 			'aab.cmdr',
	'cmdr (coast)': 		'aac.cmdr',
	'cmdr (foreign)': 		'aad.cmdr',
	'cmdr (forest)': 		'aae.cmdr',
	'cmdr (land)': 			'aaf.cmdr',
	'cmdr (mountain)': 		'aag.cmdr',
	'cmdr (swamp)': 		'aah.cmdr',
	'cmdr (u-water)': 		'aai.cmdr-uw',
	'cmdr (waste)': 		'aaj.cmdr',
	'cmdr (plains)': 		'aak.cmdr',

	'commander': 			'aba.cmdr',
	'Commander': 			'abb.cmdr',
	'cmdr (Battle Summon)': 'abd.cmdr',
	'cmdr (Event)': 		'abe.cmdr',
	'cmdr (item)': 			'abf.cmdr',
	'cmdr (Magic site)':	'abg.cmdr',
	'cmdr (Mercenary)': 	'abh.cmdr',
	'cmdr (mercenary)': 	'abi.cmdr',
	'cmdr (Prophetization)':'abj.cmdr',
	'cmdr (Recruitment)': 	'abk.cmdr',
	'cmdr (Special)': 		'abl.cmdr',
	'cmdr (Summon)': 		'abm.cmdr',
	'cmdr (Wish)': 			'abn.cmdr',
	'cmdr (?)': 			'abo.cmdr',

	'Mage (item)': 			'aca.cmdr-mage',
	'Mage (Event)': 		'acb.cmdr-mage',
	'Mage (Magic site)':	'acc.cmdr-mage',
	'Mage (Prophetization)':'acd.cmdr-mage',
	'Mage (Recruitment)': 	'ace.cmdr-mage',
	'Mage (ritual)':		'acf.cmdr-mage',
	'Mage (Special)': 		'acg.cmdr-mage',
	'Mage (Summon)': 		'ach.cmdr-mage',
	'Mage (?)': 			'aci.cmdr-mage',
	'Mage': 				'acj.cmdr-mage',

	'Priest (Event)': 		'ada.cmdr-priest',
	'Priest (Freespawn)': 	'adb.cmdr-priest',
	'Priest (Magic site)': 	'adc.cmdr-priest',
	'Priest (Recruitment)': 'add.cmdr-priest',
	'Priest (Summon)': 		'ade.cmdr-priest',
	'Priest (Prophetization)':'adf.cmdr-priest',

	'Scout (Recruitment)': 	'aea.cmdr-scout',
	'Scout (Summon)': 		'aeb.cmdr-scout',

	'unit (cap only)': 		'afa.unit',
	'unit (future cap only)': 		'afab.unit',
	'unit (foreign)': 		'afb.unit',
	'unit': 				'afc.unit',
	'Unit': 				'afd.unit',
	'Unit (Recruitment)': 	'afe.unit',
	'Unit (Summon)': 		'aff.unit',
	'unit (Summon)': 		'afg.unit',
	'unit (summon)': 		'afh.unit',
	'Unit (Battle Summon)': 'afi.unit',
	'Unit (Event)': 		'afj.unit',
	'Unit (Freespawn)': 	'afk.unit',
	'Unit (Magic site)': 	'afl.unit',
	'Unit (Mercenary)': 	'afm.unit',
	'Unit (mercenary)': 	'afn.unit',
	'Unit (Special)': 		'afo.unit',
	'Unit (?)': 			'afp.unit',
	'unit (forest)': 		'afq.unit',
	'unit (mountain)': 		'afr.unit',
	'unit (swamp)': 		'afs.unit',
	'unit (waste)': 		'aft.unit',
	'unit (cave)': 			'afu.unit',
	'unit (coast)': 		'afv.unit',
	'unit (land)': 			'afw.unit',
	'unit (u-water)': 		'afx.unit-uw',
	'unit (plains)': 		'afy.unit',

	'hero (multi)': 		'aga.hero-cmdr',
	'hero (unique)': 		'agb.hero-cmdr',
	'Hero (Event)': 		'agc.hero-cmdr',
	'Hero (item)': 			'agd.hero-cmdr',
	'Hero': 				'age.hero-cmdr',

	'pretender': 			'aha.pret-cmdr',
	'Pretender': 			'ahb.pret-cmdr',

	'special': 				'aia.cmdr-spec',
	'Horror': 				'aib.cmdr-spec',
	'horror': 				'aic.cmdr-spec',
	'Horror (Summon)': 		'aid.cmdr-spec',
	'horror (Summon)': 		'aie.cmdr-spec',

	'Unused': 				'aja?cmdr',
	'': 					'ajb?cmdr'
}
function isCmdr(u) {
	if (u.sorttype) {
		return u.sorttype.indexOf('cmdr') != -1 && !u.createdby;
	}
	return true;
}

//////////////////////////////////////////////////////////////////////////
// PREPARE DATA
//////////////////////////////////////////////////////////////////////////

MUnit.initUnit = function(o) {
	o.weapons = [];
	o.armor = [];
	o.startitem = [];
	o.randompaths = [];
	o.realms = [];
	o.typechar = '';

	o.hand = '2';
	o.head = '1';
	o.body = '1';
	o.foot = '1';
	o.misc = '2';

	o.leader = '40';
	o.sprite = { unitid: o.id };
}

MUnit.prepareData_PreMod = function() {
	for (var oi=0, o;  o= modctx.unitdata[oi];  oi++) {

		o.nationname = '';
		o.weapons = Utils.keyListToTable(o, 'wpn');

		if (!o.startitem) {
			o.startitem = [];
		} else {
			// Link to startitem
			for (var oi2=0, o2;  o2 = modctx.itemdata[oi2];  oi2++) {
				if (o2.startitem && parseInt(o2.startitem) == parseInt(o.startitem)) {
					o.startitem = [];
					o.startitem.push(o2.id);
				}
			}

		}

		o.realms = [];
		var realms = Utils.keyListToTable(o, 'realm');
		for (var oj=0, realm; realm = realms[oj]; oj++) {
			o.realms.push(realm);
		}

		//consolidate armor types to a single array
		var arr = [];
		for (var k in {armor1:1, armor2:1, armor3:1, armor4:1}) {
			if (!o[k]) continue;
			arr.push(o[k])
			delete o[k];
		}
		o.armor = arr;

		//native sprite object (may be copied to another unit)
		o.sprite = { unitid: o.id };

		//random magic paths
		o.randompaths = [];
		var pmasks = {
			128:'F',  256:'A',  512:'W',  1024:'E',  2048:'S',  4096:'D',  8192:'N',  16384:'G',  32768:'B', 65536: 'H'
		};
		for (var i=1, bf;  bf= o['mask'+i];  i++) {
			bf = parseInt(bf);			delete o['mask'+i];
			var repeat=  parseInt( o['nbr'+i] );	delete o['nbr'+i];
			var levels=  o['link'+i];		delete o['link'+i];
			var chance=  o['rand'+i];		delete o['rand'+i];

			var pstr = '';
			for (k in pmasks) if (bf & parseInt(k)) pstr += pmasks[k];

			for (var j=0; j<repeat; j++)
				o.randompaths.push({ paths: pstr,  levels: levels || '1',  chance: chance || '100'});
		}
	}
}


MUnit.prepareData_PostMod = function() {
	//helpers
	for (var oi=0, o;  o= modctx.unitdata[oi];  oi++) {

		//convert to numbers (for column ordering)
		//doesn't seem to cause any further problems..
		o.id = parseFloat(o.id);

		o.renderOverlay = MUnit.renderOverlay;
		o.matchProperty = MUnit.matchProperty;

		if (!o.hp) {
			o.hp = 10;
		}

		if (!o.str) {
			o.str = 10;
		}

		if (!o.att) {
			o.att = 10;
		}

		if (!o.def) {
			o.def = 10;
		}

		if (!o.mr) {
			o.mr = 10;
		}

		if (!o.enc) {
			o.enc = 10;
		}

		if (!o.mor) {
			o.mor = 10;
		}

		if (!o.prec) {
			o.prec = 10;
		}

		if (!o.size) {
			o.size = 2;
		}
		if (!o.ap) {
			o.ap = 12;
		}

		if (o.realms && o.realms.length == 0) {
			delete o.realms;
		}

		if (o.startitem && o.startitem.length == 0) {
			delete o.startitem;
		}

		if (o.mind) {
			delete o.mind;
		}
		if (o.mor && parseInt(o.mor) == 50) {
			o.mind = '1';
		}

		if (!o.undeadleader) {
			o.undeadleader = '0';
		}

		if (!o.magicleader) {
			o.magicleader = '0';
		}

		if (!o.combatspeed) {
			o.combatspeed = '0';
		}

		//unique
		o.linkname = o.fullname = (o.name || '(undefined)');
		if (o.fixedname) {
			o.fullname = '“'+(o.fixedname) + '“ - '+o.name;
		}

		// horror
		if (o.horror) {
			if (o.horror == 1) {
				o.lesserhorror = 1;
			} else if (o.horror == 2) {
				o.greaterhorror = 1;
			} else if (o.horror == 3) {
				o.doomhorror = 1;
			}
			delete o.horror;
		}

		// storm power grants storm-immune
		if (o.stormpower && o.stormpower > 0) {
			o.stormimmune = '1';
		}

		//searchable string
		o.searchable = o.fullname.toLowerCase();

		o.events = [];
		for (var evti=0, evt;  evt= modctx.eventdata[evti];  evti++) {
			if (evt.req_monster) {
				if (evt.req_monster.push) {
					if (evt.req_monster.indexOf(''+o.id) != -1) {
						o.events.push(evt.id);
					}
				} else if (evt.req_monster == o.id) {
					o.events.push(evt.id);
				}
			}
		}
		if (o.events.length == 0) {
			delete o.events;
		}


		//localise useful functions
		var sum = Utils.sum;
		var negative = Utils.negative;
		var mult = Utils.mult;
		var is = Utils.is;
		var normalise = Utils.normalise;

		if (o.rt == 2 || o.slowrec) {
			o.slow_to_recruit = 1;
		}

		// used to have proper key
		if (!o.gcost) {
			o.gcost = o.basecost;
		} else {
			o.basecost = o.gcost;
		}

		if (!o.pathcost) {
			o.pathcost = 10;
		}

		//magic paths
		o.mpath = '';
		o.pathboost = '';
		var allboost = false;
		var research = 0;
		for (var i=0; i<modconstants.pathkeys.length; i++) {
			var k = modconstants.pathkeys[i];
			var plevel  = o[k];

			// apply bonus
			if (o.magicboostF) {
				if (k == 'F') {
					plevel = parseInt(plevel) + parseInt(o.magicboostF);
					o.pathboost += (parseInt(o.magicboostF) > 0 ? '+' + parseInt(o.magicboostF) : parseInt(o.magicboostF)) + 'F ';
				}
			}
			if (o.magicboostA) {
				if (k == 'A') {
					plevel = parseInt(plevel) + parseInt(o.magicboostA);
					o.pathboost += (parseInt(o.magicboostA) > 0 ? '+' + parseInt(o.magicboostA) : parseInt(o.magicboostA)) + 'A ';
				}
			}
			if (o.magicboostW) {
				if (k == 'W') {
					plevel = parseInt(plevel) + parseInt(o.magicboostW);
					o.pathboost += (parseInt(o.magicboostW) > 0 ? '+' + parseInt(o.magicboostW) : parseInt(o.magicboostW)) + 'W ';
				}
			}
			if (o.magicboostE) {
				if (k == 'E') {
					plevel = parseInt(plevel) + parseInt(o.magicboostE);
					o.pathboost += (parseInt(o.magicboostE) > 0 ? '+' + parseInt(o.magicboostE) : parseInt(o.magicboostE)) + 'E ';
				}
			}
			if (o.magicboostS) {
				if (k == 'S') {
					plevel = parseInt(plevel) + parseInt(o.magicboostS);
					o.pathboost += (parseInt(o.magicboostS) > 0 ? '+' + parseInt(o.magicboostS) : parseInt(o.magicboostS)) + 'S ';
				}
			}
			if (o.magicboostD) {
				if (k == 'D') {
					plevel = parseInt(plevel) + parseInt(o.magicboostD);
					o.pathboost += (parseInt(o.magicboostD) > 0 ? '+' + parseInt(o.magicboostD) : parseInt(o.magicboostD)) + 'D ';
				}
			}
			if (o.magicboostN) {
				if (k == 'N') {
					plevel = parseInt(plevel) + parseInt(o.magicboostN);
					o.pathboost += (parseInt(o.magicboostN) > 0 ? '+' + parseInt(o.magicboostN) : parseInt(o.magicboostN)) + 'N ';
				}
			}
			if (o.magicboostG) {
				if (k == 'G') {
					plevel = parseInt(plevel) + parseInt(o.magicboostG);
					o.pathboost += (parseInt(o.magicboostG) > 0 ? '+' + parseInt(o.magicboostG) : parseInt(o.magicboostG)) + 'G ';
				}
			}
			if (o.magicboostALL) {
				plevel = parseInt(plevel) + parseInt(o.magicboostALL);
				if (!allboost) {
					o.pathboost += (parseInt(o.magicboostALL) > 0 ? '+' + parseInt(o.magicboostALL) : parseInt(o.magicboostALL)) + 'ALL ';
					allboost = true;
				}
			}
			//append to pathcost code
			if (is(plevel)) {
				o.mpath +=  k + plevel + ' '; //string

				//add to research total
				if (k != 'H')
					research += parseInt(plevel);
			}
		}
		//append random magic to pathcode
		if (o.randompaths.length) {
			//avg path bonus
			var n = 0;
			for (var i=0, r; r= o.randompaths[i]; i++)
				n += parseInt(r.levels) * parseInt(r.chance) / 100;

			n = Math.floor(n);
			research += n;

			o.mpath += 'U' + String(n) + ' ';
		}

		// Research = (5+(2XLevels))
		if (research) {
			research *= 2;
			research += 5;
		}

		//add research bonus
		if (is(o.researchbonus))
			research += parseInt(o.researchbonus);

		// add fixed research
		if (is(o.fixedresearch)) {
			research += parseInt(o.fixedresearch);
		}

		//append research to pathcode
		if (research)
			o.mpath += 'R' + String(research) + ' ';

		if (o.researchbonus) {
			if (o.researchbonus > 0) {
				o.adept_research = o.researchbonus;
			} else {
				o.inept_research = o.researchbonus;
			}
		}

		//resource costs
		o.rcost = parseInt(o.rcost || 1);
		o.rcostsort = parseInt(o.rcost || 1);
		o.ressize = parseInt(o.ressize) || 3; //{1:0.5,  2:1,  3:1.5,  4:2,  5:2.5,  6:3}[o.ressize || '2'];
		
		//filter out weapons we cant find
		var weapons = [];
		for (var i=0, wid, w;  wid= o.weapons[i];  i++) {
			if (! (w= modctx.wpnlookup[wid])) {
				console.log('weapon '+wid+' not found (unit '+o.id+')');
				continue;
			}
			weapons.push(w);

			//backlink on wpn
			Utils.joinArray( Utils.unitRef(o.id), w.used_by )

			//add resource cost to unit
			o.rcostsort += parseInt(w.rcost || '0') * o.ressize / 3;
		}
		o.weapons = weapons;

		//create a temp dict of armor by type (so only last of each type will be remembered)
		var adict = {},  armor=[];
		for (var i=0, aid, a; aid= (o.armor || [])[i]; i++) {
			if (! (a= modctx.armorlookup[aid]))  {
				console.log('armor '+aid+' not found (unit '+o.id+')');
				continue;
			}
			adict[a.type] = a;
		}
		//and... now put them back in an array
		for (var k in adict) {
			var a = adict[k];
			armor.push(a);

			//backlink on armor
			a.used_by.push( Utils.unitRef(o.id) );

			//add resource cost to unit
			o.rcostsort += parseInt(a.rcost || '0') * o.ressize / 3;
		}
		o.armor = armor;
		
		if (o.rcostsort > 60000)	o.rcostsort = 1; //gladiators

		//numeric gold costs (for sorting)
		MUnit.autocalc(o);

		if (!o.goldcost)
			o.rcostsort = 0;
		else
			o.rcostsort = Math.floor(o.rcostsort || 1);
			
		// sacred sort
		if (o.holy) {
		    if (o.holycost) {
		    	o.sacredsort = 2;
		    } else {
		    	o.sacredsort = 1;
		    }
		} else {
		    o.sacredsort = 0;
		}
	}
	
	for (var oi=0, o;  o= modctx.unitdata[oi];  oi++) {
		if (o.mountmnr && parseInt(o.mountmnr) > 0) {
		   var mount = modctx.unitlookup[o.mountmnr];
		   // Add rcost of mount
		   o.rcost += parseInt(mount.rcostsort);
		   o.rcostsort += parseInt(mount.rcostsort);
		   // Add goldcost of mount
		   if (parseInt(mount.basecost) > 1000) {
		   	   o.goldcost = MUnit.round(o.goldcost + parseInt(mount.basecost) - 10000);
		   } else {
		   	   o.goldcost = MUnit.round(o.goldcost + parseInt(mount.basecost));
		   }
	   	   if (o.type == 'u') {
			  o.goldcost = MUnit.roundIfNeeded(o.goldcost);
		   } else {
			  o.goldcost = MUnit.round(o.goldcost);
		   }
		   
		   // Add backlink to rider
		   mount.riders = mount.riders || [];
		   mount.riders.push(o)
		}
	}
	
}

MUnit.autocalc = function (o) {
	if (parseInt(o.basecost) > 9000) {
		// Autocalc
		var leadership = {
				0:	10,
				10:	15,
				20: 20,
				30: 20,
				40: 30,
				50: 30,
				60: 30,
				75: 30,
				80: 60,
				100: 60,
				120: 80,
				150: 100,
				160: 100,
				200: 150
		}

		//Leader cost
		var ldr_cost = 0;
		if (o.leader) {
			ldr_cost = ldr_cost + parseInt(leadership[o.leader]);
		}
		if (o.inspirational) {
			ldr_cost = ldr_cost + 10*parseInt(o.inspirational);
		}
		if (o.sailingshipsize && parseInt(o.sailingshipsize) > 0) {
			ldr_cost = ldr_cost + .5 * ldr_cost;
		}
		
		var path1 = {
				1: 30,
				2: 90,
				3: 150,
				4: 210,
				5: 270
		}
		var path2 = {
				1: 20,
				2: 60,
				3: 100,
				4: 140,
				5: 180
		}

		// Paths cost
		var paths_cost = 0;
		var arr = [];
		var baseM = [o.F, o.A, o.W, o.E, o.S, o.D, o.N, o.G, o.B];
		if (MUnit.hasRandom(o)) {
			MUnit.buildRandomArrays(o, 0, arr, baseM);
			for (var rand1=0; rand1 < arr.length; rand1++) {
				arr[rand1].sort(function(a,b){return b-a});
			}
			var largest = 0;
			var smallest = 0;
			for (var rand2=0; rand2 < arr.length; rand2++) {
				var tempPathCost = 0;
				for (var rand3=0, valrand; valrand = arr[rand2][rand3];  rand3++) {
					if (rand3 == 0) {
						tempPathCost = path1[valrand];
					} else {
						tempPathCost = tempPathCost + path2[valrand];
					}
				}
				if (largest == 0) {
					largest = tempPathCost;
					smallest = tempPathCost;
				} else {
					if (tempPathCost > largest) {
						largest = tempPathCost;
					} else if (tempPathCost < smallest) {
						smallest = tempPathCost;
					}
				}
			}
			paths_cost = (largest * .75) + (smallest *.25);

		} else {
			var sortedArr = [];
			for (var oj=0; oj<baseM.length; oj++) {
				if (parseInt(baseM[oj]) > 0) {
					sortedArr.push(parseInt(baseM[oj]));
				}
			}
			sortedArr.sort(function(a,b){return b-a});
			for (var ok=0, val2; val2 = sortedArr[ok];  ok++) {
				if (ok == 0) {
					paths_cost = path1[val2];
				} else {
					paths_cost = paths_cost + path2[val2];
				}
			}
		}
		if (paths_cost > 0 && o.adept_research) {
			paths_cost = paths_cost + parseInt(o.adept_research) * 5;
		}
		if (o.inept_research) {
			paths_cost = paths_cost - 5;
		}
		if (o.fixforgebonus) {
			paths_cost = paths_cost + paths_cost*(parseInt(o.fixforgebonus)/100);
		}

		// Priest cost
		var priest = {
				1: 20,
				2: 40,
				3: 100,
				4: 140
		}
		var priest_cost = 0;
		if (o.H) {
			priest_cost = parseInt(priest[o.H]);
		}

		// Spy cost
		var spy_cost = 0;
		if ((o.spy && parseInt(o.spy) > 0)) {
			spy_cost = spy_cost + 40;
		}
		if ((o.assassin && parseInt(o.assassin) > 0)) {
			spy_cost = spy_cost + 40;
		}
		if (o.seduce && parseInt(o.seduce) > 0) {
			spy_cost = spy_cost + 60;
		} else if (o.succubus && parseInt(o.succubus) > 0) {
			spy_cost = spy_cost + 60;
		}

		var cost_array = [ldr_cost, paths_cost, priest_cost, spy_cost];
		cost_array.sort(function(a,b){return b-a});

		var cost;
		if (o.type == 'c') {
			cost = cost_array[0] + cost_array[1]/2 + cost_array[2]/2 + cost_array[3]/2;
		} else {
			cost = 0;
		}

		// Special costs
		var special_cost = 0;
		if (o.stealthy && parseInt(o.stealthy) > 0 && o.type != 'u') {
			special_cost = special_cost + 5;
		}
		if (o.autohealer && parseInt(o.autohealer) > 0 && o.type != 'u') {
			special_cost = special_cost + 50;
		}
		if (o.autodishealer && parseInt(o.autodishealer) > 0 && o.type != 'u') {
			special_cost = special_cost + 20;
		}
//		if (o.mounted && parseInt(o.mounted) > 0) {
//			special_cost = special_cost + 10;
//		}

		o.goldcost = parseInt(cost + special_cost);
		o.goldcost = o.goldcost + parseInt(o.basecost) - 10000;
		if (o.slow_to_recruit && parseInt(o.slow_to_recruit) > 0 && o.type != 'u') {
			o.goldcost = o.goldcost * 0.9;
		}
		if (o.holy && parseInt(o.holy) > 0) {
			o.goldcost = o.goldcost * 1.3;
		}
		if (o.type == 'u') {
			o.goldcost = MUnit.roundIfNeeded(o.goldcost);
		} else {
			if (o.mountmnr) {
				o.goldcost = MUnit.round(o.goldcost*1.4);
				o.goldcost = MUnit.roundUp(o.goldcost*1.01);
			} else {
				o.goldcost = MUnit.round(o.goldcost*1.4);
			}
		}
	} else {
		o.goldcost = MUnit.roundIfNeeded(o.basecost);
	}
}

MUnit.roundIfNeeded = function (num) {
	if (parseInt(num) > 30) {
		return MUnit.round(num);
	}
	return Math.floor(num);
}

MUnit.round = function (num) {
	return 5*(Math.floor(num/5));
}
MUnit.roundUp = function (num) {
	return 5*(Math.ceil(num/5));
}

MUnit.hasRandom = function (o) {
	if (o.randompaths.length) {
		for (var i=0, r; r= o.randompaths[i]; i++) {
			if (r.chance == 100) {
				return true;
			}
		}
	}
	return false;
}

MUnit.getWpnLen = function (o, w) {
	if (o.weapons[w].wpnclass == 'melee') {
		if (parseInt(o.size) > 5 && !o.weapons[w].bonus) {
			return parseInt(o.weapons[w].len)+1;
		}
		len = parseInt(o.weapons[w].len);
		if (len < 0) {
			len = 0;
		}
	    return len;
	}
	if (o.weapons[w].wpnclass == 'missile') {
		rng = parseInt(o.weapons[w].range);
		if (rng == -1) {
			rng = o.str;
		} else if (rng == -2) {
			rng = parseInt(o.str)/2;
		} else if (rng == -3) {
			rng = parseInt(o.str)/3;
		} else if (rng == -4) {
			rng = parseInt(o.str)/4;
		} else if (rng == -5) {
			rng = parseInt(o.str)/5;
		} else if (rng == 1) {
			rng = 0;
		}
		
	    return 'r' + Math.floor(rng);
	}
}
MUnit.getWpnAtt = function (o, w) {
	if (o.weapons[w].wpnclass == 'melee') {
		return Utils.sum(Utils.sum(o.att, o.watt), o.weapons[w].att);
	}
	if (o.weapons[w].wpnclass == 'missile') {
		return Utils.sum(o.prec, o.weapons[w].prec);
	}
}
MUnit.getWpnDmg = function (o, w) {
	if (o.weapons[w].wpnclass == 'melee') {
		if (o.weapons[w].nostr) {
			return o.weapons[w].dmg;
		}
		str = parseInt(o.str);
		if (o.weapons[w].twohanded) {
			str = str * 1.25;
		}
		return Utils.sum(o.weapons[w].dmg, Math.floor(str));
	}
	if (o.weapons[w].wpnclass == 'missile') {
		if (o.weapons[w].nostr) {
			return o.weapons[w].dmg;
		}
		if (o.weapons[w].bowstr) {
			str = parseInt(o.str)/3;
			return Utils.sum(o.weapons[w].dmg, Math.floor(str));
		}
		if (o.weapons[w].halfstr) {
			str = parseInt(o.str)/2;
			return Utils.sum(o.weapons[w].dmg, Math.floor(str));
		}
		return Utils.sum(o.weapons[w].dmg, o.str);
	}
}

MUnit.getArmorProt = function (o, a) {
	if (o.armor[a].protbody)
		return o.armor[a].protbody;

	if (o.armor[a].prothead)
		return o.armor[a].prothead;

	if (o.armor[a].general)
		return o.armor[a].general;

	if (o.armor[a].protshield)
		return o.armor[a].protshield;
	return "";
}

MUnit.getArmorParry = function (o, a) {
	if (o.armor[a].parry) return o.armor[a].parry;
	return "";
}

MUnit.buildRandomArrays = function (o, i, arr, baseM) {
	var r = o.randompaths[i];
	if (r.chance != 100) {
		i++;
		if (i == o.randompaths.length) {
			return false;
		}
		r = o.randompaths[i];
		if (r.chance != 100) {
			i++;
			if (i == o.randompaths.length) {
				return false;
			}
			r = o.randompaths[i];
			if (r.chance != 100) {
				i++;
				if (i == o.randompaths.length) {
					return false;
				}
				r = o.randompaths[i];
				if (r.chance != 100) {
					i++;
					if (i == o.randompaths.length) {
						return false;
					}
				}
			}
		}
	}
	if (r.chance == 100) {
		for (var step = 0, letter; letter = r.paths.charAt(step); step++) {
			var newM = baseM.slice(0);
			if (letter.indexOf('F') != -1) {
				if (newM[0]) {
					newM[0] = parseInt(newM[0])+parseInt(r.levels);
				} else {
					newM[0] = parseInt(r.levels);
				}
			}
			if (letter.indexOf('A') != -1) {
				if (newM[1]) {
					newM[1] = parseInt(newM[1])+parseInt(r.levels);
				} else {
					newM[1] = parseInt(r.levels);
				}
			}
			if (letter.indexOf('W') != -1) {
				if (newM[2]) {
					newM[2] = parseInt(newM[2])+parseInt(r.levels);
				} else {
					newM[2] = parseInt(r.levels);
				}
			}
			if (letter.indexOf('E') != -1) {
				if (newM[3]) {
					newM[3] = parseInt(newM[3])+parseInt(r.levels);
				} else {
					newM[3] = parseInt(r.levels);
				}
			}
			if (letter.indexOf('S') != -1) {
				if (newM[4]) {
					newM[4] = parseInt(newM[4])+parseInt(r.levels);
				} else {
					newM[4] = parseInt(r.levels);
				}
			}
			if (letter.indexOf('D') != -1) {
				if (newM[5]) {
					newM[5] = parseInt(newM[5])+parseInt(r.levels);
				} else {
					newM[5] = parseInt(r.levels);
				}
			}
			if (letter.indexOf('N') != -1) {
				if (newM[6]) {
					newM[6] = parseInt(newM[6])+parseInt(r.levels);
				} else {
					newM[6] = parseInt(r.levels);
				}
			}
			if (letter.indexOf('G') != -1) {
				if (newM[7]) {
					newM[7] = parseInt(newM[7])+parseInt(r.levels);
				} else {
					newM[7] = parseInt(r.levels);
				}
			}
			if (letter.indexOf('B') != -1) {
				if (newM[8]) {
					newM[8] = parseInt(newM[8])+parseInt(r.levels);
				} else {
					newM[8] = parseInt(r.levels);
				}
			}
			if (o.randompaths.length > i+1) {
				i++;
				if (!MUnit.buildRandomArrays(o, i, arr, newM)) {
					arr.push(newM);
				}
				i--;
			} else {
				arr.push(newM);
			}
		}
	} else {
		return false;
	}
	return true;
}

//stuff that depends on unit type must come after parsing nation data
MUnit.prepareData_PostSiteData = function(o) {
	for (var oi=0, o;  o= modctx.unitdata[oi];  oi++) {

		if (!o.typechar || o.typechar == '') {
			o.typechar = o.typeclass;
			if (o.from && o.from != '') {
				if (o.typechar == 'Commander') {
					o.typechar = 'cmdr' + ' (' + o.from + ')';
				} else {
					o.typechar = o.typechar + ' (' + o.from + ')';
				}
			}
		}
		//clear pretender cost
		if (o.typechar == 'Pretender') {
			delete o.rcost;
			delete o.rcostsort;
			delete o.goldcost;
		}

		o.holy = o.holy || '';

		//add backlinks to units created by other units
		var sumu;
		if (o.domsummon && (sumu= modctx.unitlookup[o.domsummon])) {
			sumu.createdby = sumu.createdby || [];
			sumu.createdby.push(o)
			sumu.typechar = 'unit (Summon)';
		}
		if (o.domsummon2 && (sumu= modctx.unitlookup[o.domsummon2])) {
			sumu.createdby = sumu.createdby || [];
			sumu.createdby.push(o)
			sumu.typechar = 'unit (Summon)';
		}
		if (o.domsummon20 && (sumu= modctx.unitlookup[o.domsummon20])) {
			sumu.createdby = sumu.createdby || [];
			sumu.createdby.push(o)
			sumu.typechar = 'unit (Summon)';
		}
		if (o.raredomsummon && (sumu= modctx.unitlookup[o.raredomsummon])) {
			sumu.createdby = sumu.createdby || [];
			sumu.createdby.push(o)
			sumu.typechar = 'unit (Summon)';
		}
		if (o.makemonster && (sumu= modctx.unitlookup[o.makemonster])) {
			sumu.createdby = sumu.createdby || [];
			sumu.createdby.push(o)
			sumu.typechar = 'unit (Summon)';
		}
		if (o.summon && (sumu= modctx.unitlookup[o.summon])) {
			sumu.createdby = sumu.createdby || [];
			sumu.createdby.push(o)
			sumu.typechar = 'unit (Summon)';
		}
		// Unit types for linked units
		var other = o;
		if (other = modctx.unitlookup[o.firstshape ||
			o.secondshape ||
			o.shapechange ||
			o.secondtmpshape ||
			o.landshape ||
			o.watershape ||
			o.forestshape ||
			o.plainshape ||
			o.prophetshape]) {
			if (!o.typechar) {
				o.typechar = other.typechar;
			} else if (!other.typechar) {
				other.typechar = o.typechar;
				other.sorttype = MUnit.unitSortableTypes[o.typechar];
			}
		}
		//sorttype
		o.sorttype = MUnit.unitSortableTypes[o.typechar];

		if (!o.sorttype || o.sorttype == '') {
			if (!o.sorttype || o.sorttype == '') {
				if (isCmdr(o) && o.mpath) {
					o.typechar = "Commander";
					o.sorttype = MUnit.unitSortableTypes[o.typechar];
				} else {
					o.sorttype = 'zzz';
				}
			}
		}
		
		//show magic paths on grid for commanders only
		if (isCmdr(o) && o.mpath)
			o.listed_mpath = '0'+o.mpath;
		else o.listed_mpath = '';

		// Map move
		
		if (!o.mapmove) {
			o.mapmove = 14;
		} else {
			// Map move formula extracted from 5.54 binary,
			// see Loggy's notes: https://illwiki.com/dom5/user/loggy/misc
			var mm = parseInt(o.mapmove);
			if ( mm < 100 ) {
				if ( mm < 6 ) {
					mm = mm * 6 + 2;
					if ( o.flying ) {
						mm += 6;
					}
					if ( o.slave ) {
						mm -= 2;
					}
				}
				if ( isCmdr(o) ) {
					mm += 2;
				}
				if ( mm > 40 ) {
					mm = Math.floor( (mm+2)/5 ) * 5;
				}
			}
			if ( mm > 0 && mm < 100 ) {
				// Not yet implemented: old age penalty, how to find which commanders are old?
			}
			if ( ! o.nomovepen ) {
				var armor_penalty = 0;
				for (var i=0, a; a= o.armor[i]; i++) {
					if (a.type != 'armor') {
						continue;
					}
					armor_penalty += a.movepen; // movepen calculated from movepen attribute in MArmor.js
				}
				if ( o.enc == 0 ) {
					armor_penalty = Math.floor( armor_penalty / 2 );
				}
				mm -= armor_penalty;
			}
			// Map move effects omitted due to not applicable in inspector:
			//   - enlarged/shrunk effect
			//   - limp/crippled commander
			//   - items
			o.mapmove = mm;
		}

		o.unprep = true;
	}
}

//preparation deferred till rendering overlay
MUnit.prepareForRender = function(o) {
	if (o.unprep) {
		delete o.unprep;

		var sum = Utils.sum;
		var negative = Utils.negative;
		var mult = Utils.mult;
		var is = Utils.is;
		var _isCmdr = isCmdr(o);

		//set sprite url
		if (o.sprite.spr1) {
			o.sprite.url1 = 'mods/' + o.sprite.spr1.replace('.tga', '.png').replace(/^.\//, '');
		    if (o.sprite.spr2) {
		    	o.sprite.url2 = 'mods/' + o.sprite.spr2.replace('.tga', '.png').replace(/^.\//, '');
		    }
		} else {
			o.sprite.url1 = 'images/sprites/' + Utils.paddedNum(o.sprite.unitid,4)+'_1.png';
			o.sprite.url2 = 'images/sprites/' + Utils.paddedNum(o.sprite.unitid,4)+'_2.png';
		}
		
		//set unmounted sprite
		if (o.sprite.unmountedspr1) {
			o.sprite.unmountedspr1 = 'mods/' + o.sprite.unmountedspr1.replace('.tga', '.png').replace(/^.\//, '');
		    if (o.sprite.unmountedspr2) {
		    	o.sprite.unmountedspr2 = 'mods/' + o.sprite.unmountedspr2.replace('.tga', '.png').replace(/^.\//, '');
		    }
		} else {
			if (o.unmountedspr) {
				o.sprite.unmountedspr1 = 'images/sprites/' + Utils.paddedNum(o.sprite.unitid,4)+'_rider_1.png';
				o.sprite.unmountedspr2 = 'images/sprites/' + Utils.paddedNum(o.sprite.unitid,4)+'_rider_2.png';
			}
		}
		

		//local helper: apply bonus to stat and add it to tooltip
		o.titles = {};
		function bonus(reason, stat, inc, nochange) {
			inc = parseInt(inc);
			if (inc) {
				var oldv =  o[stat] || '0';
				o.titles[stat] =  o.titles[stat]  ?  o.titles[stat]+', '  :  oldv;
				o.titles[stat]+= ' '+Format.Signed(String(inc)) +' ('+reason+')';
				if (!nochange) {
					o[stat] = sum(oldv, inc);
				}
			}
		}

		//init age
		if (o.startage == '0') delete o.startage;
		if (o.startage == '-1') o.startage = '0';
		if (o.maxage == '0') delete o.maxage;

		//default age
		if (is(o.undead)) {
			if (!o.startage) {
				if (o.maxage) {
					o.startage = parseInt(mult(o.maxage, 0.4));
				} else {
					o.startage = '187';
				}
			}
			if (!o.maxage) o.maxage = '500';
			if (o.D) bonus('death magic', 'maxage', mult(o.maxage, parseInt(o.D) * 0.5));
		} 
		else if (is(o.inanimate)) {
			if (!o.startage) o.startage = mult( 180, o.size );
			if (!o.maxage) o.maxage = mult( 400, o.size );
			if (o.E) bonus('earth magic', 'maxage', mult(o.maxage, parseInt(o.E) * 0.5));
		}
		else if (is(o.demon)) {
			if (!o.startage) {
				if (o.maxage) {
					o.startage = parseInt(mult(o.maxage, 0.4));
				} else {
					o.startage = '370';
				}
			}
			if (!o.maxage) o.maxage = '1000';
			if (o.B) bonus('blood magic', 'maxage', mult(o.maxage, parseInt(o.B) * 0.5));
		}
		else {
			if (!o.startage) {
				if (o.maxage) {
					o.startage = parseInt(mult(o.maxage, 0.5)) + parseInt(mult(o.maxage, 0.1));
				} else {
					o.startage = '22';
				}
			}
			if (!o.maxage) o.maxage = '50';
			if (o.N) bonus('nature magic', 'maxage', mult(o.maxage, parseInt(o.N) * 0.5));
			if (o.F) {
				if (parseInt(o.maxage) >= 200)
					bonus('fire magic', 'maxage', mult(o.F, -5));
				else if (parseInt(o.maxage) >= 50)
					bonus('fire magic', 'maxage', mult(o.F, -2));
				else if (parseInt(o.maxage))
					bonus('fire magic', 'maxage', mult(o.F, -1));
			}
		}

		// Old leaders get bonus?
		if (parseInt(o.startage) > parseInt(o.maxage)) {
			if (parseInt(o.leader) == 80 && parseInt(o.goldcost) > 30) {
				o.goldcost -=30;
			}
		}

		//magic boost
		if (is(o.magicboost_all)) {
			for (var i=0, k; k= modconstants.pathkeys[i]; i++) {
				o['magicboost_'+k] ++;
				o['magicboost'] = Format.Signed(o.magicboost_all);
			}
		}
		var mbstr = '';
		var display_individual_boosts = false;
		for (var i=0, k; k= modconstants.pathkeys[i]; i++) {
			var b = o['magicboost_'+k];
			if (b) {
		 		mbstr += Format.Signed(b) + k + ' ';
		 		if (b != o.magicboost_all)
		 			display_individual_boosts = true;
		 	}
		}
		if (display_individual_boosts)
			o['magicboost'] = mbstr;


		// var equalboost = true, aboost = o['magicboost_A'];

		// for (var i=0, k; k= modconstants.pathkeys[i]; i++) {
		// 	if (o['magicboost_'+k])
		// 		equalboost = false;
		// }
		// if (aboost || !equalboost) {
		// 	var mbstr = '';
		// 	//general boost
		// 	if (equalboost)
		// 		mbstr = Format.Signed(aboost);
		// 	//path specific boosts
		// 	else {
		// 		for (var i=0, k; k= modconstants.pathkeys[i]; i++) {
		// 			if (o['magicboost_'+k])
		// 				mbstr += Format.Signed(o['magicboost_'+k]) + k + ' ';
		// 		}
		// 	}
		// 	o['magicboost'] = mbstr;
		// }

		//magic pathcost bonuses
		var n;
		var isldr = is(o.leader);
		if (n= parseInt(o.A)) {
			if (isldr) bonus('air magic', 'magicleader', n*10);
			if (_isCmdr) bonus('air magic', 'shockres', n > 2 ? n*2-1:0);
		}
		if (n= parseInt(o.B)) {
			if (isldr) bonus('blood magic', 'magicleader', n*10);
			if (isldr) bonus('blood magic', 'undeadleader', n*10);
		}
		if (n= parseInt(o.D)) {
			if (isldr) bonus('death magic', 'undeadleader', n*50);
			if (o.fear)
				bonus('death magic', 'fear', n);
			else if (n >= 5)
				bonus('death magic', 'fear', n-5);
		}
		if (n= parseInt(o.S)) {
			if (isldr) bonus('astral magic', 'magicleader', n*20);
		}
		if (n= parseInt(o.E)) {
			if (isldr) bonus('earth magic', 'magicleader', n*10);
			if (n > 2) bonus('earth magic', 'prot', n);
		}
		if (n= parseInt(o.F)) {
			if (isldr) bonus('fire magic', 'leader', n*10);
			if (isldr) bonus('fire magic', 'magicleader', n*10);
			if (_isCmdr) bonus('fire magic', 'fireres', n > 2 ? n*2-1:0);

			if (is(o.fireshield))
				bonus('fire magic', 'fireshield', n);
			if (is(o.heat))
				bonus('fire magic', 'heat', n);
		}
		if (n= parseInt(o.N)) {
			if (isldr) bonus('nature magic', 'magicleader', n*10);
			bonus('nature magic', 'supplybonus', n*10);
			if (_isCmdr) bonus('nature magic', 'poisonres', n > 2 ? n*2-1:0);
		}
		if (n= parseInt(o.W)) {
			if (isldr) bonus('water magic', 'magicleader', n*10);
			if (is(o.cold))
				bonus('water magic', 'cold', n);
			if (_isCmdr) bonus('water magic', 'coldres', n > 2 ? n*2-1:0);
		}
		if (n= parseInt(o.G)) {
			if (isldr) bonus('glamour magic', 'magicleader', n*10);
		}

		if (o.command) {
			if (isldr) bonus('command', 'leader', parseInt(o.command));
		}
		if (o.magiccommand) {
			if (isldr) bonus('magiccommand', 'magicleader', parseInt(o.magiccommand));
		}
		if (o.undcommand) {
			if (isldr) bonus('command', 'undeadleader', parseInt(o.undcommand));
		}

		//formatted leadership
//		var ldr_arr = [];
//		if (Utils.is(o.leader)) ldr_arr.push(o.leader);
//		if (Utils.is(o.undeadleader)) ldr_arr.push('('+o.undeadleader+' undead)');
//		if (Utils.is(o.magicleader)) ldr_arr.push('('+o.magicleader+' magic)');
//		o.ldr_str = ldr_arr.join(' + ');

		//item slots
		var slotwords = [];
		var slotorder = ['hand','hands',  'bow','bows',  'head','heads',  'body','bodies',  'foot','feet',  'misc','misc'];
		for (var j=0; j<slotorder.length; j+=2) {
			var t = slotorder[j];
			var n = parseInt(o[t]);
			if (!n)
				continue;
			if (n > 1)
				t = String(n) + ' '+ slotorder[j+1];
			if (t == 'foot')
				t = 'feet';
			if (j==4 && o.crownonly) {
				t=t+'(crown only)';
			}
			slotwords.push(t);
		}
		if (slotwords.length)
			o.slots = slotwords.join(', ');

		//old age
		var oldyears = parseInt(o.startage) - parseInt(o.maxage);
		if (oldyears >= 0) {
			o.isold = '1';

			var oldmult = 1 + Math.floor(4 * oldyears / parseInt(o.maxage));
			if (oldmult > 6) {
				oldmult = 6;
			}
			bonus('old age', 'str', -1 * oldmult);
			bonus('old age', 'att', -1 * oldmult);
			bonus('old age', 'def', -1 * oldmult);
			bonus('old age', 'prec', -0.5 * oldmult);
			bonus('old age', 'enc',  1 * oldmult);
			bonus('old age', 'hp', mult(o.hp, -0.05 * oldmult));
			bonus('old age', 'ap', mult(o.ap, -0.05 * oldmult));
		}

		//afflictions
		if (o.afflicted) {
			var affo = DMI.MAffliction.lookup[ o.afflicted ]
			if (affo) affo.afflictUnit(o, bonus);
		}

		//mounted def bonus
		if (is(o.mountmnr))
			bonus('mounted', 'def', 3);

		//weapons
		var def_wpns = 0;
		var rcost_wpns = 0;
		for (var i=0, w;  w= o.weapons[i];  i++) {
			def_wpns += parseInt(w.def || '0');
			rcost_wpns += parseInt(w.rcost || '0') * o.ressize / 3;
		}
		bonus('weapons', 'def', def_wpns);
		bonus('weapons', 'rcost', rcost_wpns);

		//multi weapon penalty
		var countarms = 0;
		var mwpnpen = 0;
		for (var i=0, w;  w= o.weapons[i]; i++) {
			if (w.wpnclass == 'melee' && !w.bonus) {
				countarms++;
				mwpnpen -= parseInt(w.len || '0');
			}
		}
		if (countarms > 1 && mwpnpen < 0) {
			//ambidextrous
			var ambidextrous = parseInt(o.ambidextrous || '0');
			if (ambidextrous > -mwpnpen) ambidextrous = -mwpnpen;

			bonus('dual wield', 'att', mwpnpen, 1);
			o.watt = sum(0, mwpnpen);
			bonus('ambidextrous', 'att', ambidextrous, 1);
			o.watt = sum(o.watt, ambidextrous);
		}

		//wpn att / prec tooltips
		for (var i=0, w;  w= o.weapons[i]; i++) {
			if (w.wpnclass == 'melee') {
				o.titles.att = o.titles.att  ?  o.titles.att+', \n'  :  '';
				var newatt = sum(o.att, o.watt);
				o.titles.att += ' '+w.name+'  ->  '+ sum(newatt, w.att);

			} else {
				o.titles.prec = o.titles.prec  ?  o.titles.prec+', \n'  :  '';
				o.titles.prec += ' '+w.name+'  ->  '+ sum(o.prec, w.prec);
			}
		}

		//protection & encumbrance from armor
		var p_nat = parseInt(o.prot || '0');

		var p_body = 0, p_head = 0, p_general = 0;
		var def_armor = 0, enc_armor = 0;
		var def_parry = 0;
		var rcost_armor = 0;
		for (var i=0, a; a= o.armor[i]; i++) {
			enc_armor += parseInt(a.enc || '0');
			def_armor += parseInt(a.def || '0');

			if (a.protbody)
				p_body = parseInt(a.protbody);

			if (a.prothead)
				p_head = parseInt(a.prothead);

			if (a.general)
				p_general = parseInt(a.general);

			if (a.type == 'shield')
				def_parry = a.parry;

			else if (a.type == 'misc') {
				//use misc armor prot instead of basic?
				p_inc = parseInt(a.prot || '0') - p_nat;
				if (p_inc > 0) {
					p_nat += p_inc;
					bonus(a.name, 'prot', p_inc);
				}
			}
			rcost_armor += parseInt(a.rcost || '0') * o.ressize / 3;

		}
		bonus('armor', 'def', def_armor);
		bonus('shield parry', 'def', def_parry);
		bonus('armor', 'rcost', rcost_armor);

		if (o.rcost > 60000)	o.rcost = 1; //gladiators

		if (!o.goldcost)
			o.rcost = 0;
		else
			o.rcost = Math.floor(o.rcost || 1);

		//clear pretender cost
		if (o.typechar == 'Pretender') {
			delete o.rcost;
			delete o.rcostsort;
		}

		if (p_body || p_head) {
			//displayed values
			p_body = (p_nat + p_body - (p_nat * p_body/40));
			p_head = (p_nat + p_head - (p_nat * p_head/40));
			var p_total = ((p_body * 4) + p_head) / 5;

			p_total = (p_head > 10 && p_general == 0) ? Math.floor(p_total) : p_total;

			//display strings
			o.prot = String(Math.round(p_total));
			o.titles.prot = 'basic '+(o.titles.prot || String(p_nat));
			o.titles.prot += ',  head '+Math.round(p_head)+',  body '+Math.round(p_body);
		} else {
			if (o.prot) {
				o.prot = String(o.prot);
			} else {
				o.prot = '0';
			}
		}

		//armor encumbrance
		if (enc_armor) {
			//casting encumbrance (double armor)
			o.casting_enc = parseInt(o.enc) + (enc_armor*2);

			//mounted get half encumbrance from armor
			if (o.mountmnr && parseInt(o.mountmnr) > 0) {
				enc_armor = Math.round(enc_armor/2);
			}
			//for enc 0 (undead) armor only affects speed
			bonus('armor', 'ap', -enc_armor);
			if (o.enc!='0')
				bonus('armor', 'enc', enc_armor);

			//is caster?
			if (o.mpath) {
				o.titles.enc = o.titles.enc ? o.titles.enc+',  \n' : '';
				o.titles.enc += 'spellcasting encumbrance: '+o.casting_enc;
			}
		}

	}
}


//////////////////////////////////////////////////////////////////////////
// DEFINE GRID
//////////////////////////////////////////////////////////////////////////

 function formatGold(_,__,v){ return v || ''; }
 function formatRes(_,__,v){ return v || ''; }
 function formatType(_,__,v,___,o){ return o.typechar; }
 function formatHoly(_,__,v,___,o){  return (v ?  Format.AbilityIcon('holy', 'sacred')  :  '') + (o.holycost ? 'x2':''); }

MUnit.CGrid = Utils.Class( DMI.CGrid, function() {

	//grid columns
	var columns = [
		{ id: "name",     width: 100, name: "Unit Name", field: "name", sortable: true },
		{ id: "nation",   width: 60, name: "Nation", field: "nationname", sortable: true },
		{ id: "sorttype",     width: 80, name: "Type", field: "sorttype", sortable: true, formatter: formatType },
		{ id: "goldcost",     width: 32, name: "Gold", field: "goldcost", sortable: true, cssClass: "numeric", formatter: formatGold },
//		{ id: "gcom",     width: 32, name: "gcom", field: "gcom", sortable: true, cssClass: "numeric", formatter: formatGold },
//		{ id: "diff",     width: 32, name: "diff", field: "diffsort", sortable: true, cssClass: "numeric", formatter: formatGold },
		{ id: "rcostsort",     width: 30, name: "Res", field: "rcostsort", sortable: true, cssClass: "numeric", formatter: formatRes },
		{ id: "sacredsort",     width: 30, name: "Sac", field: "sacredsort", sortable: true, formatter: formatHoly },
		{ id: "listed_mpath",     width: 120, name: "Magic", field: "listed_mpath", sortable: true, formatter: DMI.GridFormat.OrderedPaths }
	];

	this.superClass.call(this, 'unit', modctx.unitdata, columns); //superconstructor

	//closure scope
	var that = this;

	//replace text with holy icon (synchronous call won't work in chrome)
	setTimeout(function(){
		$(that.domsel+" div.slick-header-column[id*=sacred] span.slick-column-name").replaceWith(Format.AbilityIcon('holy'));
	},50);

	//selecting a nation
	$(that.domselp+" select.nation").bind('change', function(e) {
		//clicked a nation? (or era.. but not "any")
		if (! ($(that.domselp+" select.nation").find(":selected")[0] && $(that.domselp+" select.nation").find(":selected")[0].text == "any nation")) {
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
	this.getSearchArgs = function(domsel) {
		var args = {properties: this.getPropertyMatchArgs(),
			str: $(that.domselp+" input.search-box").val().toLowerCase().trim(),
			nation: $(that.domselp+" select.nation").val(),
			types: Utils.splitToLookup( $(that.domselp+" select.typechar").val(), ','),
			generic: $(that.domselp+" input.generic:checked").val(),
			national: $(that.domselp+" input.national:checked").val()
		};
		args.properties = Utils.propertiesWithKeys(args.properties);

		if ($.isEmptyObject(args.types)) delete args.types;

		//whole era
		if (args.nation == 'EA' || args.nation == 'MA' || args.nation == 'LA') {
			args.eracode = args.nation;
			delete args.nation;
		}
		else args.nation = modctx.nationlookup[ args.nation ];

		return args;
	}

	//apply search
	this.searchFilter =  function(o, args) {
		// Bit of a hack - don't display units with the name "Empty"
		// They need to exist so people can select and edit them
		if (o.name === "Empty") return false;

		//type in id to ignore filters
		if (args.str && args.str == String(o.id)) return true;

		//search string
		if (args.str && o.searchable.indexOf(args.str) == -1)
			return false;

		//type
		if (args.types && !args.types[o.typechar])
			return false;

		//national (national units only)
		if (args.national && !(o.nation || o.nations))
			return false;
		//generic (generic units only)
		if (args.generic && (o.nation || o.nations))
			return false;

		//era
		if (args.eracode && o.eracodes) {
			if (!o.eracodes[args.eracode])
				return false;
		}
		else if (args.eracode && o.nation) {
			if (o.nation.eracode != args.eracode)
				return false;
		}

		//nation
		if (args.nation && o.nations) {
			if (!o.nations[args.nation.id])
				return false;
		}
		else if (args.nation && o.nation) {
			if (o.nation != args.nation)
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

	//customise initial sort
	this.initialSortTrigger = this.domsel+" div.slick-header-column[title=Type]";

	//customise sort
	this.preSort = function(){
		//bound scope
		var boosterSortPriority = ['F', 'A', 'W', 'E', 'S', 'D', 'N', 'G', 'B', 'H', 'U', 'R'];
		var isSortedOnBoosters = false;
		var data = modctx.unitdata;

		//the actual callback
		return function(e, args) {
			if (args.sortCol.field == 'listed_mpath') { //boosters == paths
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
					var regex = new RegExp('^.('+pL+'\\d+ )(.*)$');
					//console.log(regex);
					for (var i=0; i<data.length; i++) {
						var b = data[i].listed_mpath;
						if (b && b.indexOf(pL)!=-1)
							data[i].listed_mpath = b.replace(regex, "0$2$1");
					}
				}
				var L = boosterSortPriority[0];

				//set first character to number
				for (var i=0; i<data.length; i++) {
					var b = data[i].listed_mpath;
					if (b && b.indexOf(L)!=-1)
						data[i].listed_mpath =  String.fromCharCode(100+parseInt(b.substr(2,2))) + b.substr(1);
					if (!b) {
						data[i].listed_mpath = '0';
					}
				}
				//switch sort column header icon
				if ( $('#unitboosterordericon')
				     .attr({alt:L, src:'images/magicicons/Path_'+L+'.png', 'class':'pathicon Path_'+L})
				     .css('visibility','visible')
				     .length==0 )
				{
					//add icon if not exists yet
					$(".slick-header-column[id*=listed_mpath]")
					.append('<img id="unitboosterordericon" alt="'+L+'" class="pathicon Path_'+L+'" src="images/magicicons/Path_'+L+'.png" />')
					.find(".slick-sort-indicator").css('visibility','hidden');
				}
				//fix sort direction
				args.sortAsc = false;
				isSortedOnBoosters = true;
			}
			else  {
				//hide sort column header icon if sorting another column
				$('#unitboosterordericon').css('visibility','hidden');
				isSortedOnBoosters = false;
			}
		}
		//exit bound scope
	}();

//	this.defaultSortCmp = function(r1,r2) {
//		return (r2.goldcost - r1.goldcost) || (r2.rcost - r1.rcost);
//	}

	//mouseover events for random magic panes
	$(that.domsel+' .grid-container').attachRefMouseEvents();

	//call filters and update  display
	//asyncronous to make sure all filter inputs are correctly initialised
	setTimeout(function() {
		that.init();
	},0);
});
MUnit.matchProperty = DMI.matchProperty;

function chainedUnitRef(o, key, refq) {
    var ref = '<span style="white-space:nowrap;">'+Utils.unitRef(parseInt(o.id), o.linkname)+'</span>';
    //var ref = Utils.unitRef(parseInt(o.id))+'</span>';
    //is already in queue?
    if (Utils.inArray(ref, refq)) {
            if (ref == refq[0]) {
                    if (refq.length == 2)
                            return '⇔&nbsp;'+refq[1];
                    else
                            refq.push('‹this›');
            }
            else {
                    var i=0; while (refq[i]!=ref) i++;
                    refq.push('(repeat from '+i+')');
            }
    }
    else {
            refq.push(ref);
            var nextu;
            if (o[key] && (nextu= modctx.unitlookup[o[key]]))
                    return chainedUnitRef(nextu, key, refq);
    }
    var n= 1;
    return '⇒&nbsp;'+refq.slice(1).join(' ⇒&nbsp;');
}
function twinUnitRef(o, key, return_key) {
    var shape2 = modctx.unitlookup[ o[key] ];
    if (shape2) {
            var ref = '<span style="white-space:nowrap;">'+Utils.unitRef(parseInt(shape2.id), shape2.linkname)+'</span>'
            if (shape2[return_key] && o == modctx.unitlookup[ shape2[return_key] ]) {
                    return  '⇔&nbsp;'+ref;
            }
            else
                    return  '⇒&nbsp;'+ref;
    }
    return '';
}
function list_sites(arr) {
	//create array of refs
	var tokens = [];
	for (var i=0; i < arr.length;  i++)
		tokens.push( Utils.siteRef( arr[i].id ) );

	//comma separated & one per line
	return tokens.join(', <br />');
}
function list_events(arr) {
	//create array of refs
	var tokens = [];
	for (var i=0, uid; uid= arr[i];  i++)
		tokens.push( Utils.eventRef( arr[i] ) );

	var h = '';
	if (tokens.length > 4) {
		//hide uberlong list
		h+='<div><div>'+tokens.length+' events ';

		//button to reveal
		var codereveal = "$(this).parent('div').hide().parent('div').find('.full-list').show()"
		h+='<input class="inline-button" style="padding:none" type="button" value="show" onclick="'+codereveal+'"/>';
		h+='</div>';

		//the actual list
		h+='<div class="full-list"style="display:none">';
		h+='	'+ tokens.join(', <br />');
		h+='</div>';
	} else {
		h+='<div>';
		h+='	'+ tokens.join(', <br />');
		h+='</div></div>';
	}

	return h;
}

//////////////////////////////////////////////////////////////////////////
// OVERLAY RENDERING
//////////////////////////////////////////////////////////////////////////

var aliases = {};
var formats = {};
var displayorder = Utils.cutDisplayOrder(aliases, formats,
[
	//	dbase key	displayed key		function/dict to format value
	'goldcost',	'gold',	{'0':'0 '},
	'hp',	'hit points',
	'size', 'size', function(v,o) {
		if (o.mountmnr) {
			mount = modctx.unitlookup[o.mountmnr];
			return o.size + '(' + mount.size + ')';
		}
		return o.size;
	},
	'prot',	'protection',	{'0':'0 '},
	'mr',	'magic res',	{'0':'0 '},
	'mor',	'morale',	{'0':'0 '},
	'leader', 'leadership', {'0':'0 '},

]);
var displayorder2 = Utils.cutDisplayOrder(aliases, formats,
[
	//	dbase key	displayed key		function/dict to format value
	'rcost',	'resources',	{'0':'0 '},
	'str',	'strength',	{'0':'0 '},
	'att',	'attack skill',	{'0':'0 '},
	'def',	'defence skill',{'0':'0 '},
	'prec',	'precision',	{'0':'0 '},
	'ap', 'combat speed', {'0':'0 '},
	'magicleader', 'magic ldr', {'0':'0 '}

]);
var displayorder3 = Utils.cutDisplayOrder(aliases, formats,
		[
			//	dbase key	displayed key		function/dict to format value
			'rpcost',	'rec points', function(v,o){
				//if (parseInt(o.rpcost) > 1000) {
					//return (parseInt(o.rpcost)/1000);
				//	return '1';
				//}
				return o.rpcost;
			},
			'mapmove',	'map move',	function(v,o){ return (parseInt(o.mapmove)); },
			'enc',	'encumbrance',	{'0':'0 '},
			'maxage',	'age',	function(v,o){ return o.startage + ' ('+v+')'; },
			'undeadleader', 'undead ldr',  {'0':'0 '}

		]);
var displayorder_cmdr = Utils.cutDisplayOrder(aliases, formats,
[
	'mpath',	'magic paths',	function(v,o){
		return Format.Paths(v.replace(/U\d*/, function(s){return Utils.rndMagicRef(Math.floor(o.id), s);}));
	},
	'magicboost',	'magic boost', Format.Paths,
	'slots',	'item slots'
]);
var displayorder_pret = Utils.cutDisplayOrder(aliases, formats,
[
	'startdom',		'base dominion',
	'pathcost',		'new path cost'
]);
var displayorder_other = Utils.cutDisplayOrder(aliases, formats,
[
	'gcost', 'basecost',
	'holycost', 'holy cost',
	'reclimit',		'recruitment limit',	Format.PerTurn,
	'gemprod',	'generates gems',	function(v){ return v!='0' && Format.PerTurn(Format.Gems(v)); },
	'tmpfiregems',	'temp gems', function(v){ return v!='0' && Format.PerBattle(Format.Gems('F' + v)); },
	'tmpairgems',	'temp gems', function(v){ return v!='0' && Format.PerBattle(Format.Gems('A' + v)); },
	'tmpwatergems',	'temp gems', function(v){ return v!='0' && Format.PerBattle(Format.Gems('W' + v)); },
	'tmpearthgems',	'temp gems', function(v){ return v!='0' && Format.PerBattle(Format.Gems('E' + v)); },
	'tmpastralgems',	'temp gems', function(v){ return v!='0' && Format.PerBattle(Format.Gems('S' + v)); },
	'tmpdeathgems',	'temp gems', function(v){ return v!='0' && Format.PerBattle(Format.Gems('D' + v)); },
	'tmpnaturegems',	'temp gems', function(v){ return v!='0' && Format.PerBattle(Format.Gems('N' + v)); },
	'tmpbloodslaves',	'temp gems', function(v){ return v!='0' && Format.PerBattle(Format.Gems('B' + v)); },

	'onebattlespell','casts each battle',		Utils.spellRef,

	'regeneration',	'regeneration',	Format.Percent,
	'fireres',	'resist fire',
	'coldres',	'resist cold',
	'poisonres',	'resist poison',
	'shockres',	'resist shock',
	'acidres',	'resist acid',
	'diseaseres',	'resist disease',	Format.Percent,

	'darkvision',	'dark vision',	Format.Percent,
	'stealthy',	'stealthy',	Format.SignedZero,//{0:'+0'},
	'autohealer',	'healer',
	'autodishealer',	'disease healer',
	'chaosrec',	'chaos recruit',
	'deathrec',	'death recruit',
	'heatrec',	'heat recruit', function(v) { return String(v) + ' ';},
	'coldrec',	'cold recruit', function(v) { return String(v) + ' ';},
	'enchrebate50p', '50% cheaper if active', function(v) { return modctx.enchantments_lookup[v].name;},

	'cold',		'cold aura',
	'heat',		'heat aura',
	'poisoncloud',	'poison cloud',
	'poisonskin',	'poison skin',
	'fireshield',	'fire shield',
	'uwfireshield',	'underwater fire shield',
	'banefireshield','banefire shield',
	'bloodvengeance','blood vengeance', Format.SignedZero,
	'adeptsacr',		'adept blood sacrificer',

	'iceprot',	'ice protection',
	'iceforging',	'ice forging',
	'firepower',	'fire power',
	'stormpower',	'storm power',
	'coldpower',	'cold power',
	'darkpower',	'dark power',
	'chaospower',	'chaos power',
	'magicpower',	'magic power',
	'waterbreathing',	'waterbreathing',
	'giftofwater',	'gift of waterbreathing',
	'uwregen',	'uw regeneration',	Format.Percent,

	'springpower',	'spring power',
	'summerpower',	'summer power',
	'fallpower',	'fall power',
	'winterpower',	'winter power',

	'fear',		'fear',		Format.SignedZero,
	'awe',		'awe',		Format.SignedZero,
	'haltheretic',	'halt heretic',	Format.SignedZero,
	'animalawe',	'animal awe',	Format.SignedZero,
	'event',	'causes events',	Format.Percent,
	'reform',	'chance to reform when killed',	Format.Percent,
	'smartmount',	'smart mount',
	'reanimator',	'passive corpse reanimation',
	'preanimator',	'priest reanimation',
	'dreanimator',	'death reanimation',
	'mummify',	'mummify', Utils.unitRef,
	'mummification', 'mummify partner', Utils.unitRef,
	'standard',	'standard',
	'inspirational',	'inspirational',
	'reinc',	'reincarnation',
	'elegist',	'elegist',
	'resources',	'provides resources',
	'inspiringres',	'inspired researcher',
	'incprovdef',	'defence organizer',
	'adept_research',	'adept researcher',
	'inept_research',	'inept researcher',
	'corpsestitcher', 'corpse stitcher',
	
	'makepearls','pearl cultivator',
	'sailingshipsize',	'sailing ship size',
	'sailingmaxunitsize',	'sailing max unit size',
	'sailsize', 'size when sailing',
	'latehero', 'minimum hero arrival turn',

	'ambidextrous',	'ambidextrous',
	'reinvigoration',		'reinvigoration',
	'berserk',	'berserker',		Format.SignedZero,
	'invulnerable',	'invulnerability',
	'damagerev',	'damage reversal', function(v,o){ return parseInt(v) + 11 + ' vs MR'; },
	'bonusspells',	'innate spellcaster',
	'bodyguard',	'bodyguard',
	'pathboost',	'pathboost',
	'firerange',	'fire ritual range',
	'airrange',	'air ritual range',
	'waterrange',	'water ritual range',
	'earthrange',	'earth ritual range',
	'astralrange',	'astral ritual range',
	'naturerange',	'nature ritual range',
	'deathrange',	'death ritual range',
	'bloodrange',	'blood ritual range',
	'elementrange',	'elemental ritual range',
	'sorceryrange',	'sorcery ritual range',
	'allrange',	'ritual range',
	'masterrit',	'ritual pathboost',
	'disbelieve',	'disbelieve illusions',
	'powerofdeath',	'power of death',
	'glamourman', 'glamour manipulator',

	'supplybonus',	'supply bonus',		Format.Signed,
	'siegebonus',	'siege bonus',		Format.Signed,
	'castledef',	'castle defence',	Format.Signed,
	'patrolbonus',	'patrol bonus',		Format.Signed,
	'pillagebonus',	'pillage bonus',	Format.Signed,
	'alch',		'alchemy bonus',	Format.Percent,
	'fixforgebonus',	'forge bonus',
	'mastersmith',	'master smith',
	'douse',	'blood searcher',	Format.Signed,
	'nobadevents',	'fortune teller',	Format.Percent,
	'bringeroffortune',	'bringer of fortune',
	'spreaddom',	'spreads dominion',
	'incunrest',	'increases unrest',	Format.SignedPerTurn,
	'diseasecloud',	'spreads plague',
	'kokytosret', 	'kokytos returning',	Format.Percent,
	'infernoret', 'inferno returning', Format.Percent,
	'lamialord', 'lamia bonus',
	'formationfighter',	'formation fighter',
    'minsizeleader', 'Min commander size',
	'seduce',	'seduction',	function(v){ if (v=='0') return '0'; return 'morale vs '+v; },
	'succubus',	'dream seduction',	function(v){ if (v=='0') return '0'; return 'morale vs '+v; },
	'corrupt',	'capture cmdr (corruption)',	function(v){ if (v=='0') return '0'; return 'morale vs '+v; },
	'beckon',	'lure cmdr into sea',		function(v){ if (v=='0') return '0'; return 'morale vs '+v; },
	'startaff',	'starting affliction chance',	Format.Percent,
	'startingaff', 'affliction', {4096: 'Blind', 524288: 'Lost an eye', 262144:'Limp'},

	'leper',	'reaper',		Format.Percent,
	'popkill',	'kills population',	function(v,o){ return Format.PerTurn( parseInt(v) ) },
	'corpseeater', 'eats corpses',
	'deadhp', 'bonus HP per corpse',
	'maxdeadhp', 'max corpse bonus HP',
	'plaguedoctor', 'plague doctor',
	'homesick',	'homesick',		Format.Percent,
	'deserter',	'deserter',		Format.Percent,
	'beastmaster',	'beast master',
	'taskmaster',	'task master',
	'ivylord',	'ivy lord',
	'blind',	'blind fighter',
	'eyes',		'eyes',
	'slimer',	'slimer', function(v,o){ return parseInt(v)-1; },
	'reformtime',	'immortality reform time', function(v,o){ return parseInt(v)+3 + ' months'; },
	'immortalrespawn',	'immortality respawn distance', function(v,o){ return parseInt(v)/2 + ' provinces'; },
	'mindslime',	'mind slimer',
	'crossbreeder',	'crossbreeder',
	'patience', 'patience',
	'uwdamage', 'underwater damage',
	'landdamage', 'land damage',
	'digest', 'digest',
	'aciddigest', 'acid digest',
	'acidshield', 'acid splash',
	'incorporate', 'incorporate',
	'deathparalyze', 'paralyze on death',
	'deathdisease', 'disease on death',
	'tainted',	'horrormark chance',		Format.Percent,
	'special',	'special',
	'deathfire',	'explode on death',
	'transformation', 'transformation', {'-1': 'bad result', '0': 'disabled', '1': 'good result' },
	'guardspiritbonus', 'guardian spirit',
	'ironvul', 'iron vulnerability',
	'saltvul', 'salt vulnerability',
	'landenc', 'land encumbrance',
	'exhaustion', 'exhaustion', function(v,o){
		return '('+v+', max to 150)';
	},
	'startitem',	'starts with',	function(v,o){
		return Utils.itemRef(v);
	},
	'realms', 'realm', function(v,o)
	{
		var realmString = '';
		for (var i=0, k; k=o.realms[i]; i++) {
			realmString = realmString + MUnit.realmNames[k] + ' ';
		}
		return realmString;
	},
	'cheapgod20', 'cheap god (20)', function(v,o){
		return DMI.MNation.nationUnitRefs( v );
	},
	'cheapgod40', 'cheap god (40)', function(v,o){
		return DMI.MNation.nationUnitRefs( v );
	},
	'minprison', 'minimum imprison', {'0': 'awake', '1': 'dormant', '2': 'imprisoned' },

	'shrinkhp',		'shapechange below hp', function(v,o){
		return v + ' (' + Utils.unitRef(o.id+1) + ')';
	},
	'growhp',		'shapechange above hp', function(v,o){
		return v + ' (' + Utils.unitRef(o.id-1) + ')';
	},
	'firstshape',	'natural shape',	function(v,o){	return chainedUnitRef(o, 'firstshape', []);	},
	'secondshape',	'wounded shape',	function(v,o){	return chainedUnitRef(o, 'secondshape', []);	},
	'shapechange',	'shape changer',	function(v,o){	return chainedUnitRef(o, 'shapechange', []);	},
	'secondtmpshape','dying shape',	function(v,o){	return chainedUnitRef(o, 'secondtmpshape', []);	},
	'landshape',	'land shape',	function(v,o){	return twinUnitRef(o, 'landshape', 'watershape');	},
	'watershape',	'sea shape',	function(v,o){	return twinUnitRef(o, 'watershape', 'landshape');	},
	'forestshape',	'forest shape',	function(v,o){	return twinUnitRef(o, 'forestshape', 'plainshape');	},
	'plainshape',	'normal shape',	function(v,o){	return twinUnitRef(o, 'plainshape', 'forestshape');	},
	'prophetshape',	'prophet shape',	function(v,o){	return chainedUnitRef(o, 'prophetshape', []);	},
	'xpshape',		'experienced shape',function(v,o){
		return v + ' (' + Utils.unitRef(o.id+1) + ')';
	},
	'twiceborn',	'twiceborn',	function(v,o){
		return Utils.unitRef(v);
	},

	'domsummon',	'dominion attracts units',	function(v,o){
		return Utils.unitRef(v);
	},
	'domsummon2',	'dominion attracts units/2',	function(v,o){
		return Utils.unitRef(v);
	},
	'domsummon20',	'dominion attracts units/20',	function(v,o){
		return Utils.unitRef(v);
	},
	'raredomsummon',	'dominion attracts units(8%)',	function(v,o){
		return Utils.unitRef(v);
	},
	'makemonster',	'makes units',	function(v,o){
		return Utils.is(o.n_makemonster) ?  Utils.unitRef(v)+' x '+o.n_makemonster  :  Utils.unitRef(v);
	},
	'summon',	'summon allies',	function(v,o){
		return Utils.is(o.n_summon) ?  Utils.unitRef(v)+' x '+o.n_summon  :  Utils.unitRef(v);
	},
	'autosum',	'automatically summons',function(v,o){
		return Format.PerTurn( Utils.unitRef(v) );
	},
	'coldsummon',	'summons in cold',	function(v,o){
		return Utils.unitRef(v);
	},
	'turmoilsummon',	'summons in turmoil',	function(v,o){
		return Utils.unitRef(v);
	},
	'batstartsum1',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 1';
	},
	'batstartsum2',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 2';
	},
	'batstartsum3',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 3';
	},
	'batstartsum4',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 4';
	},
	'batstartsum5',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 5';
	},
	'battlesum1',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 1/turn';
	},
	'battlesum2',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 2/turn';
	},
	'battlesum3',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 3/turn';
	},
	'battlesum4',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 4/turn';
	},
	'battlesum5',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 5/turn';
	},
	'batstartsum1d3',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 1d3';
	},
	'batstartsum1d6',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 1d6';
	},
	'batstartsum2d6',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 2d6';
	},
	'batstartsum3d6',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 3d6';
	},
	'batstartsum4d6',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 4d6';
	},
	'batstartsum5d6',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 5d6';
	},
	'batstartsum6d6',	'summons in battle',	function(v,o){
		return Utils.unitRef(v)+' x 6d6';
	},
	'ownsmonrec',	'recruit when player owns',	function(v,o){ //TODO: reverse lookup
		return Utils.unitRef(v);
	},
	'monpresentrec',	'recruit when present',	function(v,o){ //TODO: reverse lookup
		return Utils.unitRef(v);
	},
	'mountmnr',	'mount',	function(v,o){
		if (o.nofmounts) {
			return Utils.unitRef(v) + ' x ' + o.nofmounts;
		}
		return Utils.unitRef(v);
	},
	'coridermnr',	'co-rider',	function(v,o){
		coriders = 0;
		if (o.nofriders) {
			coriders = parseInt(o.nofriders) - 1;
		}
		return (coriders > 1) ?  Utils.unitRef(v)+' x '+coriders  :  Utils.unitRef(v);
	},
	'skilledrider', 'skilled rider',
	'lich',	'lich shape',	function(v,o){
		return Utils.unitRef(v);
	},
	'animatemnr',	'animated shape',	function(v,o){
		return Utils.unitRef(v);
	},

	'heretic',		'heretic',
	'shatteredsoul',	'shattered soul', 	Format.Percent, //tartarian
	'insane',	'insane',		Format.Percent,
	'reconstruction', 'reconstruction', Format.Percent,

	'voidsanity',		'void sanity',
	'voidsum',		'void summoning',	Format.Signed, //rl'yeh

	'xploss',	'lose XP on transform',	Format.Percent,
	'incscale',	'increase scale', function(v,o){ return Utils.getScale(v); },
	'decscale',	'increase scale', function(v,o){ return Utils.getScaleInverted(v); },
	'domrec',	'domrec (?)',
	'homeshape', 'shape in home province', function(v,o){	return twinUnitRef(o, 'homeshape', 'foreignshape');	},
	'foreignshape', 'shape outside home province', function(v,o){	return twinUnitRef(o, 'foreignshape', 'homeshape');	},
	'userestricteditem', 'can use item restriction', //TODO: link this to the item list
	'blessfly', 'fly when blessed',
	'plant', 'is a plant',
	'uwheat', 'heat aura (even underwater)',
	'raiseonkill', 'raise victims as soulless',	Format.Percent,
	'hpoverslow', 'hp overflow (fades)', Format.Percent,
	'raiseshape', 'raises unit',	Utils.unitRef,

	'fireattuned', 'bonus fire magic', Format.Percent,
	'airattuned', 'bonus air magic', Format.Percent,
	'waterattuned', 'bonus water magic', Format.Percent,
	'earthattuned', 'bonus earth magic', Format.Percent,
	'astralattuned', 'bonus astral magic', Format.Percent,
	'deathattuned', 'bonus death magic', Format.Percent,
	'natureattuned', 'bonus nature magic', Format.Percent,
	'bloodattuned', 'bonus blood magic', Format.Percent,
	'reformingflesh', 'reforming flesh', Format.Percent,

	'events', 'triggered events', list_events,
	'recruitedby', 'recruited from', list_sites,
	'summonedfrom', 'summoned from', list_sites,
	
	'sendlesserhorrormult', 'send lesser horror multiplier',
	'theftofthesunawe', 'theft of the sun awe',
	'dragonlord', 'dragonlord',
	'curseattacker', 'curse attacker',
	'slothresearch', 'sloth research',
	'mindvessel', 'mindvessel',
	'older', 'start age modifier',
	'landreinvigoration', 'land reinvigoration',
	'beartattoo', 'magic bear tattoo',
	'horsetattoo', 'magic horse tattoo',
	'reincarnation', 'reincarnation',
	'wolftattoo', 'magic wolf tattoo',
	'boartattoo', 'magic boar tattoo',
	'sleepaura', 'sleep aura',
	'snaketattoo', 'magic snake tattoo',
	'appetite', 'extra supply size',
	'astralfetters', 'astral fetters',
	'foreignmagicboost', 'foreign magic boost',
	'templetrainer', 'temple summon', function(v,o){
		return Utils.unitRef('1859');
	},
	'addrandomage', 'add random age',
	'unsurr', 'unsurroundable',
	'speciallook', 'speciallook',
	'bugreform', 'swarm body',
	'onisummon', 'oni summoner',
	'sunawe', 'sun awe',
	'startheroab', 'start with heroic ability', Format.Percent,

	'yearturn', 'power of the turning year',
	'forgebonus', 'forge bonus', Format.Percent,
	'indepmove', 'independent move',
	'entangle', 'entangles attackers',
	'alchemy', 'alchemy',
	'woundfend', 'affliction resistance',
	'falsearmy', 'army size',
	'summon5',	'summon allies',	function(v,o){
		return Utils.unitRef(v)+' x 5';
	},
	
	'heathensummon', 'lord over heathens',

	'slaver', 'capture slaves', Utils.unitRef,
	'guardianspiritmodifier', 'guardian spirit',
	'clockworklord', 'clockwork lord',
	'curseluckshield', 'fateweaving',
	'skirmisher', 'skirmisher',
	'carcasscollector', 'carcass collector',
	'graphicsize','graphic size alteration', Format.Percent,
	
	'horrormark',	'horror mark melee attackers',
	'fearoftheflood', 'fear of the flood',
	
	'enchrebate50',	'50 gold cheaper when active', function(v) { return modctx.enchantments_lookup[v].name;},
	'enchrebate10',	'10 gold cheaper when active', function(v) { return modctx.enchantments_lookup[v].name;},
	'allret',	'all plane returning',
	'percentpathreduction',	'percentage path reduction',	Format.Percent,
	'slaverbonus',	'slaver bonus',
	'mindcollar',	'suffers damage on rout',
	'mountainrec',	'cheaper in mountains',
	'indepspells',	'research level if independent',
	'thronekill', 'destroys thrones', Format.Percent,
	'farthronekill', 'destroys thrones through forts', Format.Percent,
	'fortkill', 'destroys forts', Format.Percent,
	'pathboostland', 'pathboost on land',
	'pathboostuw', 'pathboost underwater',
	'labpromotion',	'promotion in lab', function(v,o){
		return v + ' (' + Utils.unitRef(o.id+1) + ')';
	},	
	
	'summon1',	'summons each turn',	function(v,o){
		return Utils.unitRef(v)+' x 1';
	},
	'randomspell', 'casts spells at random', Format.Percent,
	'deathpower', 'death power',
	'insanify', 'insanify province',
	'defector', 'chance to become independent', Format.Percent,
	'horrordeserter', 'horror deserter', Format.Percent,
	'poisonarmor',	'poison barbs',
	'ethtrue',	'true ethereal', Format.Percent,
	'undying',	'undying',
	'stygianguide',	'stygian guide', Format.Percent,
	'moralebonus',	'morale bonus',
	'uncurableaffliction',	'uncurable affliction', {4096: 'Blind', 524288: 'Lost an eye', 262144:'Limp'},
	'wintersummon1d3', 'summons every winter',	function(v,o){
		return Utils.unitRef(v) + ' x 1d3';
	},
	'erastartageincrease', 'start age increase',
	'moreorder', 'scale limit', function(v,o){
		val = parseInt(v);
		if (val < 0) {
			return 'Turmoil scale limit +' + Math.abs(val);
		} else {
			return 'Order scale limit +' + val;
		}
	},
	'moreprod', 'scale limit', function(v,o){
		val = parseInt(v);
		if (val < 0) {
			return 'Sloth scale limit +' + Math.abs(val);
		} else {
			return 'Productivity scale limit +' + val;
		}
	},
	'moreheat', 'scale limit', function(v,o){
		val = parseInt(v);
		if (val < 0) {
			return 'Cold scale limit +' + Math.abs(val);
		} else {
			return 'Heat scale limit +' + val;
		}
	},
	'moregrowth', 'scale limit', function(v,o){
		val = parseInt(v);
		if (val < 0) {
			return 'Death scale limit +' + Math.abs(val);
		} else {
			return 'Growth scale limit +' + val;
		}
	},
	'moreluck', 'scale limit', function(v,o){
		val = parseInt(v);
		if (val < 0) {
			return 'Misfortune scale limit +' + Math.abs(val);
		} else {
			return 'Luck scale limit +' + val;
		}
	},
	'moremagic', 'scale limit', function(v,o){
		val = parseInt(v);
		if (val < 0) {
			return 'Drain scale limit +' + Math.abs(val);
		} else {
			return 'Magic scale limit +' + val;
		}
	},
	'falsedamagerecovery', 'false damage recovery',
	'uwpathboost', 'underwater path boost',
	'randomitems', 'random items',
	'fireempower', 'fire elemental empowerment', Format.Signed,
	'airempower', 'air elemental empowerment', Format.Signed,
	'waterempower', 'water elemental empowerment', Format.Signed,
	'earthempower', 'earth elemental empowerment', Format.Signed,
	'drawsize', 'draw size', Format.Percent,
	'petrificationimmune', 'petrification immune', Format.Percent,
	'scarsouls', 'scar souls', Format.Percent,
	'spikebarbs', 'spike barbs',
	'pretenderstartsite', 'pretender start site', Utils.siteRef, 
	'offscriptresearch', 'off script research level',
]);
var flagorder = Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
	'slow_to_recruit',	'slow to recruit',
	'reqtemple', 'requires temple',
	'reqlab', 'requires lab',
	'unique',	'unique',
	'immortal',	'immortal',
	'domimmortal',	'dominion immortality',
	'isold',	'old age',
	'holy',		'sacred',
	'mounted',	'mounted',
	'nofalldmg', 'no fall damage',
	'regainmount', 'regain mount',
	'mountiscom', 'mount is commander',
	'nothrowoff', 'no throw off',
	'immobile',	'immobile',
	'undisciplined',	'undisciplined',
	'pooramphibian','poor amphibian',
	'slashres',	'slash resistant',
	'bluntres',	'blunt resistant',
	'pierceres',	'pierce resistant',
	'cleanshape',	'heals afflictions when shapechanging',
	'divinebeing', 'divine being',
	'animal',	'animal',
	'drake',	'drake',
	'undead',	'undead',
	'magicbeing',	'magic being',
	'inanimate',	'inanimate',
	'ethereal',	'ethereal',
	'illusion',	'illusion',
	'glamour',	'glamour',
	'flying',	'flying',
	'teleport',	'teleporter',
	'unteleportable', 'not teleportable',
	'stormimmune',	'flies in storms',
	'noriverpass',	'cannot cross river',
	'slave',	'slave',
	'bug',	'bug',
	'bird', 'bird',
	'uwbug',	'underwater bug',
	'lesserhorror', 'lesser horror',
	'greaterhorror', 'greater horror',
	'doomhorror', 'doom horror',
	'illusionary',	'illusion',
	'nomovepen',	'no move penalty for armor',
	'wolf',	'wolf',
	'dungeon',	'dungeon monster',
	'aboleth', 	'aboleth',
	'localsun', 'counts as sun',
	'defiler', 'defiler',
	'mountedbeserk', 'mounted beserk',
	'lanceok', 'lance ok',
	'truesight', 'true sight',
	'trample',	'trample',
	'trampswallow',	'swallow',
	'spy',		'spy',
	'scalewalls',		'scale walls',
	'assassin',	'assassin',
	'drainimmune',	'ignores drain scales',
	'taxcollector',		'tax collector',
	'gold',		'gold',
	'divineins',	'divinely inspired',
	'mobilearcher', 'mobile archer',
	'popspy', 'population spy',
	'capitalhome', 'home provionce capital',
	'coldblood',	'cold blooded',
	'amphibian',	'amphibious',
	'aquatic',		'aquatic',
	'neednoteat',	'need not eat',
	'demon',	'demon',
	'mind',		'mindless',
	'noheal',	'does not heal naturally',
	'deathcurse',	'death curse',
	'float',	'floating',
	'hpoverflow',	'hp overflow',
	'spreadchaos',	'spreads chaos',
	'spreaddeath',	'spreads death',
	'spreadorder',	'spreads order',
	'spreadgrowth',	'spreads growth',
	'deathslimeexpl', 'slime explosion on death',
	'deathpoisonexpl', 'poison explosion on death',
	'deathshockexpl', 'shock explosion on death',
	'deathdiseaseexpl', 'disease explosion on death',
	'decayres', 'decay resistant',
	'wastesurvival',	'wasteland survival',
	'mountainsurvival',	'mountain survival',
	'swampsurvival',	'swamp survival',
	'forestsurvival',	'forest survival',
	'snowmove',			'snow move',
	'swimming',			'swimming',
	'stupid',			'stupid',
	'verystupid',		'very stupid',
	'heal',		'recuperation',
	'nobarding', 'no barding',
	'cubmother', 'cub-mother',
	'female',	'female',
	'stonebeing',	'stone being',
	'tightrein',	'tight rein',
	'clumsy', 'clumsy',
	'ownblood', 'use own blood',
	'petrify',	'petrifies attackers',
	'eyeloss',	Utils.afflictionRef('Eyeloss')+' on attackers',
	'inquisitor',		'inquisitor',
	'spiritsight', 'spirit sight',
	'spiritform', 'spiritform',
	'blessbers', 'berserk when blessed',
	'combatcaster', 'combat caster',
	'aisinglerec', 'ai single recruit',
	'nowish', 'no wish',
	'mason', 'mason',
	'invisible', 'invisible',
	'spellsinger', 'spell singer',
	'magicstudy', 'magically attuned researcher',
	'reanimpriest', 'reanimator priest',
	'stunimmunity', 'stun immunity',
	'singlebattle', 'levy',
	'ainorec', 'ai no recruit',
	'autocompete', 'must fight in arena',
	'adventurers', 'adventurer',
	'horrormarked', 'horror marked',
	'corpseconstruct', 'corpse construct',
	'commaster', 'communion master',
	'comslave', 'communion slave',
	'chorusmaster', 'chorus master',
	'chorusslave', 'chorus slave',
	'unseen', 'unseen',
	'indepstay',	'stops upon reaching throne',
	'polyimmune',	'polymorph immunity',
	'noarmormapmovepenalty', 'ignores-armor-mapmove-penalty',
	'norange', 'does-not-stop-to-fire',
	'nohof', 'no-hall-of-fame',
	'autoblessed', 'autoblessed',
	'almostundead', 'part undead/demon'
	]);
var hiddenkeys = Utils.cutDisplayOrder(aliases, formats,
[
	'id', 		'unit id',	function(v){ return Math.floor(v); }
]);
var modderkeys = Utils.cutDisplayOrder(aliases, formats,
[
	'nametype',	'#nametype',
	'montag',	'#montag',
	'montagweight',	'#montagweight'
]);
var ignorekeys = {
	modded:1,
	dupes:1,
	sorttype:1,
	typechar:1,
	type:1,

	titles:1, fullname:1,
	size:1, fixedname:1,

	ldr_str:1,
	ap:1,

	startage:1,
	casting_enc:1,

	searchable:1,
	notes:1,
	rt:1,
	basecost:1,
	gmon:1,
	gcom:1,
	watt:1,
	slowrec:1,
	sprite:1,
	ressize:1,
	command:1,
	undcommand:1,
	magiccommand:1,
	magicboostF:1,magicboostA:1,magicboostW:1,magicboostE:1,magicboostS:1,magicboostD:1,magicboostN:1,magicboostALL:1,

	researchbonus:1, listed_mpath:1, fixedresearch:1,
	n_domsummon:1, n_makemonster:1, n_autosum:1, n_summon:1,

	hand:1, bow:1, head:1, body:1, foot:1, misc:1, crownonly:1,

	A:1, B:1, D:1, E:1, F:1, N:1, S:1, W:1, G:1, H:1, randompaths:1,
	magicboost_A:1, magicboost_B:1, magicboost_D:1, magicboost_E:1, magicboost_F:1, magicboost_N:1, magicboost_S:1, magicboost_W:1, magicboost_H:1,
	magicboost_all:1,

	rcostsort:1, sacredsort:1,

	weapons:1, armor:1, helmet:1, shield:1, wpn1:1, wpn2:1, wpn3:1, wpn4:1, wpn5:1, wpn6:1,

	eracodes:1, nations:1, nation:1, nationname:1,
	summonedby:1, createdby:1, riders:1,

	triplegod:1,
	triplegodmag:1,
	unify:1,
	triple3mon:1,
	researchwithoutmagic:1,
	changetargetgenderforseductionandseductionimmune:1,
	isashah:1,
	isayazad:1,
	isadaeva:1,
	nofriders:1, nofmounts:1, unmountedspr:1,
	
	//common fields
	name:1,linkname:1,descr:1,
	searchable:1, renderOverlay:1, matchProperty:1
};

MUnit.renderOverlay = function(o, isPopup) {
	MUnit.prepareForRender(o);
	var descrpath = 'gamedata/unitdescr/';

	//template
	var h=''
	h+='<div class="unit overlay-contents">';

	//header
	h+='	<div class="overlay-header" title="unit id:'+o.id+'"> ';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';

	h+='		<div class="h2replace">'+o.fullname+'</div> ';

	//nation/commander info
	var nref = DMI.MNation.nationUnitRefs(o.nations);
	if (nref || o.typechar || o.holy == 1) {
		h+='	<p style="float:right; clear:right;">&nbsp;'+(o.holy == 1 ? Format.AbilityIcon('holy', 'sacred') : '')+'</p> ';
		h+='	<p style="float:right;">'+(o.typechar ? o.typechar : '')+'</p> ';
		h+='	<p>'+(nref || '&nbsp;')+'</p> ';
	}
	h+='	</div>';

	//body
	h+='	<div class="overlay-main" style="clear:both;">';

	h+='		<table class="overlay-table"><tr>';
	h+='		<td><table class="overlay-table"> ';
	h+= 			Utils.renderDetailsRows2(o, hiddenkeys, aliases, formats, 'hidden-row');
	h+= 			Utils.renderDetailsRows2(o, displayorder, aliases, formats);
	h+=' 		</td></table> ';

	h+='		<td><table class="overlay-table" style="margin-bottom:0px"> ';
	h+= 			Utils.renderDetailsRows2(o, displayorder2, aliases, formats);
	h+=' 		</td></table> ';
	h+='		<td><table class="overlay-table" style="margin-bottom:0px"> ';
	h+= 			Utils.renderDetailsRows2(o, displayorder3, aliases, formats);
	h+=' 		</td></table></tr> ';
	h+=' 		</table> ';

	h+='	<img style="float:right; clear:right; vertical-align:top; margin-right:25px" title="Toggle attack sprite" src="'+o.sprite.url1+'" onmouseover="this.style.cursor=\'pointer\'" onclick="if (this.src.indexOf(\''+o.sprite.url1+'\') != -1) {this.src = \''+o.sprite.url2+'\';} else { this.src = \''+o.sprite.url1+'\';}"/>';
	if (o.unmountedspr) {
	h+='	<img style="float:right; clear:right; vertical-align:top; margin-right:25px" title="Toggle rider sprite" src="'+o.sprite.unmountedspr1+'" onmouseover="this.style.cursor=\'pointer\'" onclick="if (this.src.indexOf(\''+o.sprite.unmountedspr1+'\') != -1) {this.src = \''+o.sprite.unmountedspr2+'\';} else { this.src = \''+o.sprite.unmountedspr1+'\';}"/>';
	}	


	var tags = [];
	for (var i=0; i<o.weapons.length; i++)
		tags.push(Utils.wpnRef(o.weapons[i].id));
	if (tags.length > 0)
	h+='		<table class="overlay-table"><tr style="background: #c7b7a5;"><td>Weapon</td><td>Len</td><td>Att</td><td>Dmg</td></tr>';
	for (var w=0; w<tags.length; w++)
		h+='<tr style="background: #e5e0cc;"><td>'+tags[w]+'</td><td>'+MUnit.getWpnLen(o,w)+'</td><td>'+MUnit.getWpnAtt(o,w)+'</td><td>'+MUnit.getWpnDmg(o,w)+'</td></tr>';

	h+=' 		</table> ';

	var tags = [];
	for (var i=0; i<o.armor.length; i++)
		tags.push(Utils.armorRef(o.armor[i].id));
	if (tags.length > 0)
	h+='		<table class="overlay-table"><tr style="background: #c7b7a5;"><td>Armor</td><td>Prt</td><td>Def</td><td>Par</td><td>Enc</td></tr>';
	for (var a=0; a<tags.length; a++)
		h+='<tr style="background: #e5e0cc;"><td>'+tags[a]+'</td><td>'+MUnit.getArmorProt(o,a)+'</td><td>'+o.armor[a].def+'</td><td>'+MUnit.getArmorParry(o,a)+'</td><td>'+o.armor[a].enc+'</td></tr>';

	h+=' 		</table> ';

	h+='		<table class="overlay-table" style="margin-top:0px"> ';
	h+= 			Utils.renderDetailsRows(o, displayorder_other, aliases, formats);
	h+= 			Utils.renderStrangeDetailsRows(o, ignorekeys, aliases, 'strange');
	h+=' 		</table> ';

	var flagrows =		Utils.renderDetailsFlags(o, flagorder, aliases, formats);
	if (flagrows) h+='<p style="margin-top:0px;margin-bottom:5px;padding-top:0px;"> '+flagrows+'</p>';


	//commander details
	h+='		<table class="overlay-table commander '+(isCmdr(o) ? '' : 'hidden-block')+'" style="clear:both;"> ';
	h+= 			Utils.renderDetailsRows(o, displayorder_cmdr, aliases, formats);
	h+= 			Utils.renderDetailsRows(o, modderkeys, aliases, formats, 'modding-row');
	h+='		</table> ';

	//modded
	if (o.modded) {
		h+='	<div class="modded hidden-block">' + Utils.renderModded(o) +'</div>';
	}

	//footer
	h+='	</div>';
	h+='	<div class="overlay-footer">';

	//source details
	if (o.summonedby) {
		for (var i=0, refarr=[], s; s= o.summonedby[i]; i++)
			refarr.push(Utils.spellRef(s.id) +'&nbsp;<span class="tiny flag">('+s.research+')</span>');
		h+='	<p class="firstline">summoned with '+refarr.join(', ')+'</p>';
	}
	else if (o.typechar=='Pretender') {
		h+='<p class="firstline">';
		// h+= ' Cost: ' + o.goldcost +' pts ';
		h+= ' +<span class="internal-inline"> [pathcost]</span> '+o.pathcost + ' pts per magic path';
		h+='<br />';
		h+= ' Dominion<span class="internal-inline"> [startdom]</span>: '+(o.startdom ? o.startdom : '1');
		h+='</p>';
	}
	h+='	<div class="modding-block">';
	
	if (o.createdby) {
		for (var i=0, refarr=[], s; s= o.createdby[i]; i++)
			refarr.push(Utils.unitRef(s.id));
		if (o.createdby.length > 8) {
			//hide uberlong list
			h+='	<p class="firstline">';
			h+='		created by: '+o.createdby.length+' things ';

			//button to reveal
			var codereveal = "$(this).parent('p').hide().parent('div').find('.full-list').show()"
			h+='<input class="inline-button" style="padding:none" type="button" value="show" onclick="'+codereveal+'"/>';
			h+='	</p>';

			//the actual list
			h+='	<p class="firstline full-list" style="display:none">created by '+refarr.join(', ')+'</p>';
		} else {
			h+='	<p class="firstline">created by '+refarr.join(', ')+'</p>';
		}
	}
	if (o.riders) {
		for (var i=0, refarr=[], s; s= o.riders[i]; i++)
			refarr.push(Utils.unitRef(s.id));
		if (o.riders.length > 8) {
			//hide uberlong list
			h+='	<p class="firstline">';
			h+='		ridden by: '+o.riders.length+' things ';

			//button to reveal
			var codereveal = "$(this).parent('p').hide().parent('div').find('.full-list').show()"
			h+='<input class="inline-button" style="padding:none" type="button" value="show" onclick="'+codereveal+'"/>';
			h+='	</p>';

			//the actual list
			h+='	<p class="firstline full-list" style="display:none">ridden by '+refarr.join(', ')+'</p>';
		} else {
		h+='	<p class="firstline">ridden by '+refarr.join(', ')+'</p>';
		}
	}
	h+='	</div>';

	//descr
	var uid = 'c'+(Math.random());
	uid = uid.replace('.','');
	h+='		<div class="overlay-descr pane-extension '+uid+'"></div>';

	if (o.descr)
			Utils.insertContent( '<p>'+o.descr+'</p>', 'div.'+uid );
	else {
			 var url = descrpath + Utils.paddedNum(o.id, 4) + '.txt';
			 Utils.loadContent( url, 'div.'+uid );
	}

	h+='	</div> ';
	h+='</div> ';
	return h;
}


MUnit.renderRandomMagic = function(o) {
	//template
	var h=''
	h+='<div class="random-magic overlay-contents"> ';

	//header
	h+='	<div class="overlay-header"> ';
	h+='		<h2>'+o.name+' - random magic</h2>';
	h+='	</div>';

	//body
	h+='	<div class="overlay-main">';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';

	h+=' 		<p class="hidden-block">unit id: '+o.id+'</p>';

	h+='		<table class="random-magic">';
	h+='			<tr class="header-row">';
	h+='				<th>possible paths</th>';
	h+='				<th>level</th>';
	h+='				<th>chance</th>';
	h+='			</tr>';

	for (var i=0, r; r= o.randompaths[i]; i++) {
		h+='		<tr>';
		h+='			<td> '+Format.Paths(r.paths)+' </td>';
		h+='			<td> +'+r.levels+' </td>';
		h+='			<td> '+r.chance+'% </td>';
		h+='		</tr>';
	}
	h+='		</table>';
	h+='	</div>';
	h+='</div>';
	return h;
}


Utils.dumpCSV = function(keys, objects) {
	var str = '';

	//header
	for (var i=0, k; k= keys[i]; i++)
		str += k+'\t';
	str += '\n';

	for (var oi=0, o;  o= objects[oi];  oi++) {
		//object
		for (var i=0, k; k= keys[i]; i++) {
			//format str/num
			if (o[k] && (typeof(o[k])=='string'  ||  typeof(o[k])=='number'))
				str += String(o[k]).replace(/\\[trn]/ig,' ')+'\t';
			//obj.id
			else if (o[k] && typeof(o[k])=='object' && o[k].id)
				str += o[k].id+'\t';
			//?
			else
				str += '\t';
		}
		str += '\n';
	}
	return str;
}
MUnit.dumpCSV = function( showkeys ) {
	for (var oi=0, o;  o= modctx.unitdata[oi];  oi++) {
		MUnit.prepareForRender(o);
	}

	if (!showkeys) {
		showkeys = ['id', 'name'].concat(displayorder, displayorder2, displayorder_cmdr, displayorder_pret, displayorder3, displayorder_other, flagorder, Utils.objectKeys(ignorekeys));
		Utils.weedArray('modded', showkeys);
		Utils.weedArray('descr', showkeys);
		Utils.weedArray('[object Object]', showkeys);
	}
	return Utils.dumpCSV(showkeys, modctx.unitdata);
}

//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
