//namespace scope
(function( DMI, $, undefined ){

var Utils = DMI.Utils;
var modconstants = DMI.modconstants;


//basic helpers for setting values
function argstr(a) {
	if (!a.s) throw "argument missing (string expected)";
	if (a.n1) throw "unexpected argument (number)";
	return a.s;
}
function argtrim(a) {
	if (!a.s) throw "argument missing (string expected)";
	if (a.n1) throw "unexpected argument (number)";
	return $.trim(a.s);
}
function _str(c,a,t) {
	modctx[t][c] = argstr(a);
}

function argnum(a) {
	if (!a.n1) throw "argument missing (number expected)";
	if (a.s) throw "unexpected argument (string)";
	return a.n1;
}
function argnum2(a) {
	if (!a.n2) throw "argument missing (number expected)";
	if (a.s) throw "unexpected argument (string)";
	return a.n2;
}
function _num(c,a,t) {
	modctx[t][c] = argnum(a);
}
function _num_def(n) {
	var n = n;
	return function(c,a,t) {
		if (a.s) throw "unexpected argument (string)";
		modctx[t][c] = a.n1 || String(n);
	}
}
function _num_plus(n) {
	var n = n;
	return function(c,a,t) {
		modctx[t][c] = parseInt(argnum(a)) + n;
	}
}
/*
 * #incunrest of 10 will increase unrest by 1. Discrepancy between the vanilla game csv
 * and the mod script means we need to divide by 10 before displaying the value.
*/
function _num_div_10(c,a,t) {
	modctx[t][c] = argnum(a) / 10;
}
/*
 * #popkill 5 will kill 50 population. Again, the discrepancy between the vanilla game csv
 * and the mod script means we need to multiply by 10 to get the right value.
*/
function _num_times_10(c,a,t) {
	modctx[t][c] = argnum(a) * 10;
}
function _str_num(c,a,t) {
	if (!a.n1 && !a.s) throw "argument missing (number or string expected)";
	modctx[t][c] = (a.n1 || a.s);
}

function argref(a) {
	if (!a.n1 && !a.s) throw "argument missing (number or string expected)";
	return a.n1 || $.trim(a.s.toLowerCase());
}
function _ref(c,a,t) {
	modctx[t][c] = argref(a);
}
function _ref_optional(c,a,t) {
	if (a.n1 || a.s) {
		modctx[t][c] = a.n1 || $.trim(a.s.toLowerCase());
	} else {
		modctx[t][c] = 1;
	}
}
function _bool(c,a,t) {
	if (a.n1 || a.s) throw "unexpected argument (none expected)";
	modctx[t][c] = '1';
}
function _ignore(c,a,t) {  }


//truncates name till it is found in object. returns found value
function lookupTruncation(longname, object, minlen) {
	if (!minlen) minlen = 1;
	while (longname.length > minlen) {
		longname = longname.substr(0, longname.length-1);
		if (object[longname])
			return longname;
	}
	return null;
}

//is this a valid command?
function validCmdContexts(cmd) {
	var ctxs = [];
	var types = ['unit', 'spell', 'wpn', 'item', 'armor', 'nation', 'site'];
	for (var j=0, type; type=types[j]; j++) {
		var cmdlookup = modctx[type+'commands'];
		var fn = cmdlookup[cmd];
		if (fn) ctxs.push(type);
	}
	return ctxs;
}

//base data object
var modctx = DMI.modctx = {

	//main mod command switch
	processCommand: function(cmd, args, warningFn) {
		var fullcmd = cmd;

		var types = ['unit', 'spell', 'wpn', 'item', 'armor', 'nation', 'site', 'event', 'nametype', 'merc'];
		for (var j=0, type; type=types[j]; j++) {
			if (modctx[type]) {
				//lookup cmd for open object
				var cmdlookup = modctx[type+'commands'];
				var fn = cmdlookup[cmd];

				//special case - some event commands start with a number
				if (!fn) {
					var num = parseInt(cmd);
					if (!isNaN(num)) {
						fn = cmdlookup['_'+cmd];
					}
				}
				//not found.. lookup shortened command
				if (!fn) {
					fn = cmdlookup[cmd = lookupTruncation(cmd, cmdlookup, 3)];
					if (fn) warningFn('unrecognised cmd.. assuming you meant: #'+cmd)
				}
				//still not found.. abort
				if (!fn) throw 'command not found for ' + type + (modctx.commands[fullcmd] ? ' (missing #end ?)' : '');

				//process cmd
				fn(cmd, args, type, warningFn);
				return;
			}
		}
		//no open context
		var fn = modctx.commands[cmd];

		//not found.. lookup shortened command
		if (!fn) {
			fn = modctx.commands[cmd = lookupTruncation(cmd, modctx.commands, 3)];
			if (fn) warningFn('unrecognised cmd.. assuming you meant: #'+cmd)
		}
		//still not found.. abort
		if (!fn) {
			var ctxs = validCmdContexts(fullcmd)
			if (ctxs.length)
				throw ('command out of context ('+(ctxs.join('/'))+' not open)');
			else
				throw 'unrecognised command';
		}
		//process cmd
		fn(cmd, args, null, warningFn);
	},

	//helpers
	_checkContextClosed: function(fnwarn) {
		if (modctx.item || modctx.armor || modctx.wpn || modctx.unit || modctx.spell ||
			modctx.nation || modctx.site || modctx.merc || modctx.event || modctx.nametype ) {
			modctx.item = modctx.armor = modctx.wpn = modctx.unit = modctx.spell = modctx.nation = modctx.site =
				modctx.merc = modctx.event = modctx.nametype = null;
			fnwarn('missing #end');
		}
	},
	_select: function(cmd, args, tname, fnwarn) {
		modctx._checkContextClosed(fnwarn);

		var o;
		if (args.s)
			o = modctx[tname+'lookup'][$.trim(args.s.toLowerCase())];
		else if (args.n1)
			o = modctx[tname+'lookup'][args.n1];
		else throw 'missing argument (id/name expected)';

		if (!o) throw 'data not found';
		modctx[tname] = o;
	},
	_new: function(cmd, args, tname, fnwarn) {
		modctx._checkContextClosed(fnwarn);
		if (!args.n1) {
			if (tname == 'wpn' || tname == 'armor') {
				var newid = 2000;
				while ((modctx[tname+'lookup'][newid])) {
					newid++;
				}
				args.n1 = newid;
			} else {
				throw 'missing argument (id expected)';
			}
		}
		if (modctx[tname+'lookup'][args.n1]) throw 'id already in use';

		var o = modctx[tname] = { id: args.n1 };
		modctx[tname+'data'].push(o);
		modctx[tname+'lookup'][args.n1] = o;
	},
	// _select_or_new: function(cmd, args, tname, fnwarn) {
	// 	try {
	// 		modctx._select(cmd, args, tname, fnwarn)
	// 	}
	// 	catch(e) {
	// 		if (e == 'data not found' && args.n1)
	// 			modctx._new(cmd, args, tname,fnwarn)
	// 		else throw e;
	// 	}
	// },

	//global commands (nothing currently selected)
	commands: {
		//mod info
		modname: function(cmd, args) {
			modctx.loadedmods.push(argstr(args));
		},
		description: function(cmd, args) {},
		icon: _ignore,
		version: _ignore,
		domversion: _ignore,

		//general modding
		poppergold: _ignore,
		resourcemult: _ignore,
		supplymult: _ignore,
		unresthalfinc: _ignore,
		unresthalfres: _ignore,
		eventisrare: _ignore,
		turmoilincome: _ignore,
		turmoilevents: _ignore,
		deathincome: _ignore,
		deathsupply: _ignore,
		deathdeath: _ignore,
		slothincome: _ignore,
		slothresources: _ignore,
		coldincome: _ignore,
		coldsupply: _ignore,
		misfortune: _ignore,
		luckevents: _ignore,
		researchscale: _ignore,
		disableoldnations: function(cmd, args) {
			modctx.disableoldnations = true;
		},

		end: function(c,a,t,fnw) { fnw('no open object'); },

		//nation modding
		indepflag: _ignore,

		//commands opening a context
		newitem:    function(c,a,t,fnw){
			//get first unused id
			var id = modctx.itemdata.length;
			while (modctx.itemlookup[id]) id++;

			modctx._new(c, {n1:id} ,'item', fnw);
			DMI.MItem.initItem(modctx.item);
		},
		selectitem: function(c,a,t,fnw){
			if (a.n1>499 && a.n1<1000)  {
				modctx._new(c, a,'item', fnw);
				DMI.MItem.initItem(modctx.item);
			} else {
				modctx._select(c,a,'item',fnw);
			}
		},

		newarmor: function(c,a,t,fnw) {
			modctx._new(c,a ,'armor',fnw);
			DMI.MArmor.initArmor(modctx.armor);

			//if (a.n1<250 || a.n1>999) throw 'invalid id';
		},
		selectarmor: function(c,a,t,fnw){
			try {
				modctx._select(c,a,'armor',fnw)
			}
			catch(e) {
				if (e == 'data not found' && a.n1) {
					modctx.commands.newarmor(c,a,t,fnw);
				}
				else throw e;
			}
		},
		//selectarmor: function(c,a,t,fnw){ modctx._select(c,a,'armor',fnw); },

		newweapon: function(c,a,t,fnw) {
			modctx._new(c,a ,'wpn',fnw);
			DMI.MWpn.initWpn(modctx.wpn);

			//if (a.n1<700 || a.n1>1999) throw 'invalid id';
		},
		selectweapon: function(c,a,t,fnw){
			try {
				modctx._select(c,a,'wpn',fnw)
			}
			catch(e) {
				if (e == 'data not found' && a.n1) {
					modctx.commands.newweapon(c,a,t,fnw);
				}
				else throw e;
			}
		},
		newmonster: function(c,a,t,fnw) {
			if (a.n1 == '' || a.n1 == '0') {
				//get first unused id
				var id = modctx.unitdata.length;
				while (modctx.unitlookup[id]) id++;
				a.n1 = id;
			}
			modctx._new(c,a ,'unit',fnw);

			// Utils.merge( modctx.unit, {
			// 		weapons: [],
			// 		armor:[],
			// 		randompaths:[],

			// 		hand: '2',
			// 		head: '1',
			// 		body: '1',
			// 		foot: '1',
			// 		misc: '2',

			// 		leader: '40',
			// 		sprite: { unitid: a.n1 }
			// });
			DMI.MUnit.initUnit(modctx.unit);

			//if (a.n1<3001 || a.n1>6999) throw 'invalid id';
		},
		selectmonster: function(c,a,t,fnw){ modctx._select(c,a,'unit',fnw); },

		newspell: function(c,a,t,fnw) {
			//get first unused id
			var id = modctx.spelldata.length;
			while (modctx.spelllookup[id]) id++;

			modctx._new(c, {n1:id} ,'spell',fnw);
			DMI.MSpell.initSpell(modctx.spell);
		},
		selectspell: function(c,a,t,fnw){ 
			try {
				modctx._select(c,a,'spell',fnw);
			}
			catch(e) {
				if (e == 'data not found' && a.n1) {
					modctx._new(c,a,'spell',fnw);
					DMI.MSpell.initSpell(modctx.spell);
				}
				else throw e;
			}
		},

		newnation: function(c,a,t,fnw) {
			//get first unused id
			var id = modctx.nationdata.length;
			while (modctx.nationlookup[id]) id++;

			modctx._new(c, {n1:id} ,'nation',fnw);
			DMI.MNation.initNation(modctx.nation);
		},

		selectnation: function(c,a,t,fnw){ //modctx._select(c,a,'nation')
			try {
				modctx._select(c,a,'nation',fnw)
			}
			catch(e) {
				if (e == 'data not found' && a.n1) {
					modctx._new(c,a,'nation',fnw);
					DMI.MNation.initNation(modctx.nation);
				}
				else throw e;
			}
		},

		newsite: function(c,a,t,fnw) {
			if (a.n1 == '' || a.n1 == '0') {
				//get first unused id
				var id = modctx.sitedata.length;
				while (modctx.sitelookup[id]) id++;
				a.n1 = id;
			} else {
				//if (a.n1<1500 || a.n1>1999) throw 'invalid id';
			}

			modctx._new(c,a ,'site',fnw);
			DMI.MSite.initSite(modctx.site);
		},

		selectsite: function(c,a,t,fnw){
			modctx._select(c,a,'site',fnw);
		},

		newevent: function(c,a,t,fnw) {
			var id = modctx.eventdata.length;
			while (modctx.eventlookup[id]) id++;

			modctx._new(c, {n1:id} ,'event', fnw);

			DMI.MEvent.initEvent(modctx.event);
		},

        selectnametype: function(c,a,t,fnw) {
            modctx._select(c,a,'nametype',fnw);

            if (a.n1 >= 100 && a.n1 <= 152) return;
            if (a.n1 >= 161 && a.n1 <= 299) return;

            throw 'invalid id';
        },

		newmerc: function(c,a,t,fnw) {
            var id = modctx.mercdata.length;
            while (modctx.merclookup[id]) id++;

            modctx._new(c, {n1:id} ,'merc', fnw);

            DMI.MMerc.initMerc(modctx.merc);
        }
    },


	//item selected
	itemcommands: {
		end: function(c,a,t){ modctx[t] = null; },
		name: function(c,a,t) {
			if (modctx.item.name) delete modctx.itemlookup[modctx.item.name];
			modctx.item.name = argtrim(a);
			modctx.itemlookup[argtrim(a).toLowerCase()] = modctx.item;
		},
		descr: 		_str, //function(a,t,c){  modctx[t][c] = a.s;  },
		type: 		function(c,a,t){ modctx[t][c] = modconstants['19'][argnum(a)]; },

		weapon: 	_ref,
		armor:		_ref,
		constlevel: 	_num,
		mainpath:	function(c,a,t){ modctx[t][c] = modconstants['16'][argnum(a)] },
		secondarypath: 	function(c,a,t){ modctx[t][c] = modconstants['16'][argnum(a)] },
		mainlevel: 	_num,
		secondarylevel: _num,
		copyspr: 	_ref,

		spr: 		_str,
		spell: 		_str,
		autospell: 	_str,

		hp: 	_num,
		str: 	_num,
		att: 	_num,
		def: 	_num,
		prec: 	_num,
		mr: 	_num,
		morale: 	_num,
		voidsanity: 	_num,
		fireres: 	_num,
		coldres: 	_num,
		shockres: 	_num,
		poisonres: 	_num,
		restricted: function(c,a,t){ modctx.item.restricted.push(argref(a)); }, //deferr lookups
		pen: 	_num,
		autospellrepeat: 	_num,
		randomspell: 	_num,
		mapspeed: 	_num,
		tainted: 	_num,
		speciallook: 	_num,
		giftofwater: 	_num,
		seduce: 	_num,
		succubus: 	_num,
		beckon: 	_num,
		falsearmy: 	_num,
		foolscouts: 	_num,
		iceprot: 	_num,
		airshield: 	_num,
		ironvul: 	_num,
		invulnerable: 	_num,
		healer: 	_num,
		autohealer: 	_num,
		autodishealer: 	_num,
		autodisgrinder: 	_num,
		diseaseres: 	_num,
		homesick: 	_num,
		landdamage: 	_num,
		resources: 	_num,
		mastersmith: 	_num,
		masterrit: 	_num,
		reform: 	_num,
		sleepaura: 	_num,
		slaver: 	_num,
		slaverbonus: 	_num,
		saltvul: 	_num,
		shapechance: 	_num,
		uwdamage: 	_num,
		limitedregen: 	_num,
		regeneration: 	_num,
		reinvigoration: 	_num,
		woundfend: 	_num,
		deadhp: 	_num,
		poisoncloud: 	_num,
		poisonskin: 	_num,
		poisonarmor: 	_num,
		diseasecloud: 	_num,
		animalawe: 	_num,
		awe: 	_num,
		curseluckshield: 	_num,
		sunawe: 	_num,
		fear: 	_num,
		fireshield: 	_num,
		uwfireshield: 	_num,
		banefireshield: 	_num,
		acidshield: 	_num,
		damagerev: 	_num,
		bloodvengeance: 	_num,
		slimer: 	_num,
		deathdisease: 	_num,
		deathparalyze: 	_num,
		deathfire: 	_num,
		uwheat: 	_num,
		heat: 	_num,
		cold: 	_num,
		overcharged: 	_num,
		eyeloss: 	_num,
		mindslime: 	_num,
		chaospower: 	_num,
		firepower: 	_num,
		coldpower: 	_num,
		magicpower: 	_num,
		stormpower: 	_num,
		darkpower: 	_num,
		slothpower: 	_num,
		deathpower: 	_num,
		dompower: 	_num,
		springpower: 	_num,
		summerpower: 	_num,
		fallpower: 	_num,
		winterpower: 	_num,
		yearturn: 	_num,
		ambidextrous: 	_num,
		berserk: 	_num,
		darkvision: 	_num,
		digest: 	_num,
		aciddigest: 	_num,
		incorporate: 	_num,
		castledef: 	_num,
		siegebonus: 	_num,
		patrolbonus: 	_num,
		pillagebonus: 	_num,
		supplybonus: 	_num,
		iceforging: 	_num,
		nobadevents: 	_num,
		incprovdef: 	_num,
		incunrest: 	_num_div_10,
		leper: 	_num,
		popkill: 	_num_times_10,
		insanify: 	_num,
		heretic: 	_num,
		elegist: 	_num,
		spreaddom: 	_num,
		shatteredsoul: 	_num,
		gold: 	_num,
		addupkeep: 	_num,
		xploss: 	_num,
		alchemy: 	_num,
		inspirational: 	_num,
		beastmaster: 	_num,
		taskmaster: 	_num,
		formationfighter: 	_num,
		bodyguard: 	_num,
		standard: 	_num,
		douse: 	_num,
		researchbonus: 	_num,
		slothresearch: 	_num,
		inspiringres: 	_num,
		divineins: 	_num,
		forgebonus: 	_num,
		fixforgebonus: 	_num,
		crossbreeder: 	_num,
		bonusspells: 	_num,
		deathbanish: 	_num,
		kokytosret: 	_num,
		infernoret: 	_num,
		voidret: 	_num,
		allret: 	_num,
		firerange: 	_num,
		airrange: 	_num,
		waterrange: 	_num,
		earthrange: 	_num,
		astralrange: 	_num,
		deathrange: 	_num,
		naturerange: 	_num,
		bloodrange: 	_num,
		elementrange: 	_num,
		sorceryrange: 	_num,
		allrange: 	_num,
		makepearls: 	_num,
		carcasscollector: 	_num,
		tmpfiregems: 	_num,
		tmpairgems: 	_num,
		tmpwatergems: 	_num,
		tmpearthgems: 	_num,
		tmpastralgems: 	_num,
		tmpdeathgems: 	_num,
		tmpnaturegems: 	_num,
		tmpglamourgems: _num,
		tmpbloodslaves: 	_num,
		guardspiritbonus: _num,
		farsail: _num,

		copyitem: function(c,a,t){
			var from = modctx.itemlookup[a.n1] || modctx.itemlookup[($.trim(a.s) || '-1').toLowerCase()];
			if (!from) throw 'original item not found';
			var ignorestats = {
				//stats to NOT copy
				modded:1,
				id:1
				//name:1,
			};
			var to = modctx.item;
			for (var k in to)   if (!ignorestats[k]) delete to[k];
			for (var k in from) if (!ignorestats[k]) to[k] = from[k];

			//deep copy arrays
			to.restricted = [];
			for (var i=0, m; m= from.restricted[i]; i++) to.restricted[i] = m;
		},
		domsummon:	_str_num,
		domsummon2:	_str_num,
		domsummon20:	_str_num,
		raredomsummon:	_str_num,
		templetrainer:	_str_num,
		summon1:	_str_num,
		summon2: _str_num,
		summon3: _str_num,
		summon4: _str_num,
		summon5: _str_num,
		makemonsters1: _str_num,
		makemonsters2: _str_num,
		makemonsters3: _str_num,
		makemonsters4: _str_num,
		makemonsters5: _str_num,
		battlesum1:	function(c,a,t){ modctx[t]['battlesum'] = argref(a);  modctx[t]['n_battlesum'] = '1' },
		battlesum2:	function(c,a,t){ modctx[t]['battlesum'] = argref(a);  modctx[t]['n_battlesum'] = '2' },
		battlesum3:	function(c,a,t){ modctx[t]['battlesum'] = argref(a);  modctx[t]['n_battlesum'] = '3' },
		battlesum4:	function(c,a,t){ modctx[t]['battlesum'] = argref(a);  modctx[t]['n_battlesum'] = '4' },
		battlesum5:	function(c,a,t){ modctx[t]['battlesum'] = argref(a);  modctx[t]['n_battlesum'] = '5' },
		batstartsum1:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '1' },
		batstartsum2:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '2' },
		batstartsum3:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '3' },
		batstartsum4:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '4' },
		batstartsum5:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '5' },
		batstartsum1d3:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '1d3' },
		batstartsum1d6:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '1d6' },
		batstartsum2d6:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '2d6' },
		batstartsum3d6:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '3d6' },
		batstartsum4d6:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '4d6' },
		batstartsum5d6:	function(c,a,t){ modctx[t]['batstartsum'] = argref(a);  modctx[t]['n_batstartsum'] = '5d6' },

		ethereal: _bool,
		nomounted: _bool,
		nocoldblood: _bool,
		nodemon: _bool,
		noundead: _bool,
		noinanim: _bool,
		noimmobile: _bool,
		nofemale: _bool,
		onlymounted: _bool,
		onlycoldblood: _bool,
		onlydemon: _bool,
		onlyundead: _bool,
		onlyinanim: _bool,
		onlyimmobile: _bool,
		recuperation: _bool,
		onlyfemale: _bool,
		reqeyes: _bool,
		nofind: _bool,
		luck: _bool,
		quickness: _bool,
		bless: _bool,
		barkskin: _bool,
		stoneskin: _bool,
		ironskin: _bool,
		scalewalls: _bool,
		waterbreathing: _bool,
		float: _bool,
		fly: _bool,
		stormimmune: _bool,
		run: _bool,
		trample: _bool,
		polyimmune: _bool,
		norange: _bool,
		autobless: _bool,
		bers: _bool,
		extralife: _bool,
		champprize: _bool,
		autocompete: _bool,
		cursed: _bool,
		curse: _bool,
		disease: _bool,
		chestwound: _bool,
		feeblemind: _bool,
		mute: _bool,
		nhwound: _bool,
		crippled: _bool,
		loseeye: _bool,
		singlebattle: _bool,
		chaosrec: _bool,
		stonebeing: _bool,
		noriverpass: _bool,
		unteleportable: _bool,
		nomovepen: _bool,
		slashres: _bool,
		pierceres: _bool,
		bluntres: _bool,
		hpoverflow: _bool,
		deathcurse: _bool,
		trampswallow: _bool,
		inquisitor: _bool,
		taxcollector: _bool,
		undisciplined: _bool,
		drainimmune: _bool,
		magicimmune: _bool,
		comslave: _bool,
		commaster: _bool,
		doheal: _bool,
		blessbers: _bool,
		blessfly: _bool,
		spiritsight: _bool,
		invisible: _bool,
		mason: _bool,
		localsun: _bool,
		skirmisher: _bool,
		spellsinger: _bool,
		magicstudy: _bool,
		combatcaster: _bool,
		restricteditem: _num,
		sneakunit: _num,
		command: _num,
		magiccommand: _num,
		undcommand: _num,
		raiseonkill: _num,
		raiseshape: _str_num,
		incscale: _num,
		decscale: _num,
		reform: _num,
		haltheretic: _num,
		yearaging: _num,
		noaging: _num,
		noagingland: _num,
		undregen: _num,
		uwregen: _num,
		unsurr: _num,
		fortkill: _num,
		thronekill: _num,
		farthronekill: _num,
		adeptsacr: _num,
		warning: _num,
		fastcast: _num,
		bringeroffortune: _num,

		magicboost: function(c,a,t){
			var pstr = modconstants[10][argnum(a)];
			if (!Utils.inArray(pstr, modconstants.pathkeys))
				pstr = 'all';

			modctx.item[pstr] = a.n2;
		},
		
		nationrebate: function(c,a,t){ modctx.item.nationrebate.push(argref(a)); }, //deferr lookups
		itemcost1: _num,
		itemcost2: _num,
		itemdrawsize: _num,
		stealthboost: _num,
		swift: _num,
		corpselord: _num,
		ivylord: _num,
		dragonlord: _num,
		lamialord: _num,
		onisummon: _num,
		minsize: _num,
		maxsize: _num,
		champprize: _bool,
		noforgebonus: _bool,
		islance: _bool,
		unique: _bool,
		reanimpriest: _bool,

	},


	//weapon selected
	wpncommands: {
		end: function(c,a,t){
			var name = modctx.wpn.name;
			modctx[t] = null;
			if (!name) throw 'unnamed weapon';
		},
		name: function(c,a,t) {
			// Technically we probably should do this, but it causes issues with copied weapons
			// Worst case removing it is probably some things work in the inspector which break in game
			// Maybe. Honestly I don't have a good solution to this without implementing reference counting
			// and fuck doing that
			//if (modctx.wpn.name) delete modctx.wpnlookup[modctx.wpn.name.toLowerCase()];
			modctx.wpn.name = argtrim(a);
			modctx.wpnlookup[argtrim(a).toLowerCase()] = modctx.wpn;
		},
		copyweapon: function(c,a,t){
			var from = modctx.wpnlookup[a.n1] || modctx.wpnlookup[($.trim(a.s) || '-1').toLowerCase()];
			if (!from) throw 'original weapon not found';
			var ignorestats = {
				//stats to NOT copy
				modded:1,
				id:1,
				used_by:1
				//name:1,
			};
			var to = modctx.wpn;
			for (var k in to)   if (!ignorestats[k]) delete to[k];
			for (var k in from) if (!ignorestats[k]) to[k] = from[k];
		},
		clear: function(c,a,t) {
			var o = modctx.site;
			var keepstats = {
				//KEEP
				modded:1,
				id:1,
				name:1
			};
			for (var k in o) {
				if (!keepstats[k]) {
					if ($.isArray(o[k])) o[k] = [];
					else delete o[k];
				}
			}
		},

		def: 		_num,
		rcost: 		_num,

		dmg: 		_num,
		nratt: 		_num,
		att: 		_num,
		len: 		_num,
		range: 		_num,
		ammo: 		_num,

		twohanded:	_bool,
		armorpiercing:	_bool,
		armornegating:	_bool,
		magic:		_bool,

		slash:		_bool,
		pierce:		_bool,
		blunt:		_bool,
		acid:		_bool,

		dt_normal:	_bool,
		dt_stun:	_bool,
		dt_paralyze:	_bool,
		dt_poison:	_bool,
		dt_cap:		_bool,
		dt_demon:	_bool,
		dt_demononly:	_bool,
		dt_holy:	_bool,
		dt_magic:	_bool,
		dt_small:	_bool,
		dt_large:	_bool,
		dt_constructonly:_bool,
		dt_raise:	_bool,

		mind:		_bool,
		cold:		_bool,
		fire:		_bool,
		shock:		_bool,
		poison:		_bool,

		dt_sizestun:		_bool,
		demonundead:		_bool,
		dt_weakness:		_bool,
		dt_drain:		_bool,
		dt_weapondrain:		_bool,
		dt_aff:		_bool,
		sacredonly:		_bool,
		hardmrneg:		_bool,
		sizeresist:		_bool,
		undeadimmune:		_bool,
		inanimateimmune:		_bool,
		flyingimmune:		_bool,
		enemyimmune:		_bool,
		friendlyimmune:		_bool,
		undeadonly:		_bool,
		demononly:		_bool,
		norepel:		_bool,
		unrepel:		_bool,
		beam:		_bool,
		range050:		_bool,
		range0:		_bool,
		melee50:		_bool,
		skip:		_bool,
		skip2:		_bool,

		//fx
		flyspr:		_ignore,
		explspr:	_ignore,
		sound:		_ignore,

		//advanced weapon modding
		aoe:		_num,
		bonus:		_bool,
		charge:		_bool,
		flail:		_bool,
		nostr:		_bool,
		bowstr:		_bool,
		halfstr:	_bool,
		mrnegates:	_bool,
		mrnegateseasily:	_bool,
		ironweapon:		_bool,
		woodenweapon:	_bool,
		iceweapon:		_bool,
		uwok:		_bool,

		secondaryeffect:	_ref,
		secondaryeffectalways:	_ref,

		natural: _bool,
		internal: _bool,
		ferrous: _bool,
		flammable: _bool,
		dt_realstun: _bool

	},

	//armor selected
	armorcommands: {
		end: function(c,a,t){
			var name = modctx.armor.name;
			modctx[t] = null;
			if (!name) throw 'unnamed armor';
		},
		name: function(c,a,t) {
			// Technically we probably should do this, but it causes issues with copied weapons
			// Worst case removing it is probably some things work in the inspector which break in game
			// Maybe. Honestly I don't have a good solution to this without implementing reference counting
			// and fuck doing that
			// if (modctx.armor.name) delete modctx.armorlookup[modctx.armor.name.toLowerCase()];
			modctx.armor.name = argtrim(a);
			modctx.armorlookup[argtrim(a).toLowerCase()] = modctx.armor;
		},
		copyarmor: function(c,a,t){
			var from = modctx.armorlookup[a.n1] || modctx.armorlookup[($.trim(a.s) || '-1').toLowerCase()];
			if (!from) throw 'original armor not found';
			var ignorestats = {
				//stats to NOT copy
				modded:1,
				id:1
				//name:1,
			};
			var to = modctx.armor;
			for (var k in to)   if (!ignorestats[k]) delete to[k];
			for (var k in from) if (!ignorestats[k]) to[k] = from[k];
		},
		clear: function(c,a,t) {
			var o = modctx.site;
			var keepstats = {
				//KEEP
				modded:1,
				id:1,
				name:1
			};
			for (var k in o) {
				if (!keepstats[k]) {
					if ($.isArray(o[k])) o[k] = [];
					else delete o[k];
				}
			}
		},

		type: 	_num,
		def:	_num,
		rcost: 	_num,
		prot: 	_num,
		enc: 	_num,
		magicarmor: _bool,
		ironarmor: _bool,
		woodenarmor: _bool,
	},

	//unit selected
	unitcommands: {
		end: function(c,a,t){
			var name = modctx.unit.name;
			modctx[t] = null;
			if (!name) throw 'unnamed unit';
		},
		name: function(c,a,t){
			//if (modctx.unit.name) delete modctx.unitlookup[modctx.unit.name.toLowerCase()];
			modctx.unit.name = argtrim(a);
			modctx.unitlookup[argtrim(a).toLowerCase()] = modctx.unit;
		},
		fixedname: _str,
		clear: function(c,a,t){
			var o = modctx.unit;
			var keepstats = {
			//KEEP
				modded:1,
				id:1,
				name:1,
				sprite:1
			};
			for (var k in o)
				if (!keepstats[k]) delete o[k];

			o.armor = [];
			o.weapons = [];
			o.randompaths = [];
		},
		clearweapons: function(c,a,t){ modctx.unit.weapons = []; },
		cleararmor: function(c,a,t){ modctx.unit.armor = []; },
		clearspec: function(c,a,t){
			var o = modctx.unit;
			var deletestats = {
			//CLEAR
				female:1, mounted:1, holy:1, animal:1, undead:1, demon:1, magic:1, stonebeing:1, inanimate:1, coldblood:1, immortal:1, blind:1, unique:1, shatteredsoul:1,
				immobile:1, aquatic:1, amphibian:1, pooramphibian:1, flying:1, stormimmune:1, sailing:1, forestsurvival:1, mountainsurvival:1, swampsurvival:1, wastesurvival:1,
				coldres:1, fireres:1, poisonres:1, shockres:1, darkvision:1,
				stealthy:1, illusion:1, spy:1, assassin:1, seduce:1, succubus:1, beckon:1,
				startage:1, maxage:1, older:1, healer:1, heal:1, noheal:1,
				startaff:1, supplybonus:1, neednoteat:1, uwdamage:1, homesick:1,
				coldpower:1, firepower:1, stormpower:1, darkpower:1,
				springpower:1, summerpower:1, fallpower:1, winterpower:1,
				ambidextrous:1, banefireshield:1, berserk:1,
				ethereal:1, standard:1,
				animalawe:1, awe:1, fear:1, regeneration:1, reinvigoration:1,
				fireshield:1, heat:1, cold:1, iceprot:1,
				trample:1, entangle:1, eyeloss:1,
				horrormark:1, poisonarmor:1, poisoncloud:1, diseasecloud:1, bloodvengeance:1, castledef:1, siegebonus:1, patrolbonus:1, pillagebonus:1,
				researchbonus:1, forgebonus:1, douse:1, nobadevents:1, incunrest:1, spreaddom:1, leper:1, popkill:1, inquisitor:1, heretic:1
			};
			for (var k in deletestats)
				if (o[k]) delete o[k];
		},
		clearmagic: function(c,a,t){
			var o = modctx.unit;
			var deletestats = {
			//CLEAR
				F:1, A:1, W:1, E:1, S:1, D:1, N:1, B:1, H:1,
				magicbonus:1
				//researchbonus:1,  //???
			};
			for (var k in deletestats)
				if (o[k]) delete o[k];

			o.randompaths = [];
		},
		copystats: function(c,a,t){
			var from = modctx.unitlookup[a.n1];
            if (!from && a.s) from = modctx.unitlookup[$.trim(a.s.toLowerCase())];
			if (!from) throw 'original unit not found';
			var ignorestats = {
			//IGNORE
				modded:1,
				id:1,
				sprite:1
				//
				//...
				//...
			};
			var to = modctx.unit;
			for (var k in to)   if (!ignorestats[k]) delete to[k];
			for (var k in from) if (!ignorestats[k]) to[k] = from[k];

			//deep copy arrays
			to.weapons = [];
			for (var i=0, m; m= from.weapons[i]; i++) to.weapons[i] = m;

			to.armor = [];
			for (var i=0, m; m= from.armor[i]; i++) to.armor[i] = m;

			to.randompaths = [];
			for (var i=0, m; m= from.randompaths[i]; i++) to.randompaths[i] = m;

			to.startitem = [];
			for (var i=0, m; m= from.startitem[i]; i++) to.startitem[i] = m;
		},
		copyspr: function(c,a,t){
			var from = modctx.unitlookup[a.n1] || modctx.unitlookup[$.trim((a.s || '-1').toLowerCase())];
			if (!from) throw 'original unit not found';

			modctx.unit.sprite = from.sprite;
		},
		descr: _str,

		//fx
		spr1:	function(c,a,t){ modctx[t].sprite.spr1 = a.s; },
		spr2:	function(c,a,t){ modctx[t].sprite.spr2 = a.s; },
		unmountedspr1:	function(c,a,t){ modctx[t].sprite.unmountedspr1 = a.s; },
		unmountedspr2:	function(c,a,t){ modctx[t].sprite.unmountedspr2 = a.s; },
		speciallook: _ignore,

		ap:	_num,
		mapmove:_num,
		hp:	_num,
		prot:	_num,
		size:	_num,
		ressize:_num,
		str:	_num,
		enc:	_num,
		att:	_num,
		def:	_num,
		prec:	_num,
		mr:	_num,
		mor:	_num,
		gcost:	_num,
		rcost:	_num,

		weapon:	function(c,a,t){ modctx[t]['weapons'].push(argref(a)); }, //deferr lookups
		armor:	function(c,a,t){ modctx[t]['armor'].push(argref(a)); }, //deferr lookups
		startitem:	function(c,a,t){ 
				if (!modctx[t]['startitem']) {
					modctx[t]['startitem'] = [];
				}
				modctx[t]['startitem'].push(argref(a)); 
			}, //deferr lookups

		eyes:	_num,

		//these should turn unit into a pretender.. right?
		pathcost: function(c,a,t){
			var o = modctx[t];
			if (!Utils.is(o.pathcost)) { //is new pretender
				for (var n, i=0; n=modctx.nationdata[i]; i++) {
					if (n.homerealm) {
						for	(var ok=0, k;  k= n.homerealm[ok];  ok++) {
							if (parseInt(k) == parseInt(o.homerealm)) {
								Utils.joinArray(o.id, n.pretenders);
							}
						}
					}
				}
			}
			_num(c,a,t);
		},
		startdom: function(c,a,t){
			var o = modctx[t];
			if (!Utils.is(o.startdom)) { //is new pretender
				for (var n, i=0; n=modctx.nationdata[i]; i++) {
					if (n.homerealm) {
						for	(var ok=0, k;  k= n.homerealm[ok];  ok++) {
							if (parseInt(k) == parseInt(o.homerealm)) {
								Utils.joinArray(o.id, n.pretenders);
							}
						}
					}
				}
			}
			_num(c,a,t);
		},
		
		triplegod:	_num,
		triplegodmag:	_num,
		minprison:	_num,
		maxprison:	_num,
		unify:		_bool,

		female:		_bool,
		mounted:	_bool,
		holy:		_bool,
		animal:		_bool,
		undead:		_bool,
		demon:		_bool,
		magicbeing:	_bool,
		stonebeing:	_bool,
		inanimate: 	_bool,
		dungeon: 	_bool,
		coldblood:	_bool,
		immortal:	_bool,
		domimmortal: _bool,
		springimmortal: _bool,
		reformtime:	_num,
		bugreform:	_num,
		lanceok:	_bool,
		blind:		_bool,
		unique:		_bool,
		shatteredsoul:	_num,
		blessbers: _bool,

		immobile:	_bool,
		aquatic:	_bool,
		amphibian:	_bool,
		pooramphibian:	_bool,
		flying:		_bool,
		stormimmune:	_bool,
		sailing: function(c,a,t){
			modctx.unit['sailingshipsize'] = a.n1;
			modctx.unit['sailingmaxunitsize'] = a.n2;
		},

		forestsurvival:	_bool,
		mountainsurvival:_bool,
		swampsurvival:	_bool,
		wastesurvival:	_bool,

		coldres:	_num,
		fireres:	_num,
		poisonres:	_num,
		shockres:	_num,
		diseaseres: 	_num,
		darkvision:	_num,
		startingaff: 	_num,

		stealthy:	function(c,a,t) {
			var n = a.n1 ? a.n1 : 0;
			modctx[t][c] = parseInt(n) + 40;
		},
		illusion:	_bool,
		spy:		_bool,
		assassin:	_bool,
		localsun:	_bool,
		seduce:		_num,
		succubus:	_num,
		beckon:		_num,
		fortkill:	_num,
		thronekill:	_num,
		farthronekill:	_num,
		adeptsacr:	_num,

		startage:	_num,
		maxage:		_num,
		older:		_num,
		addrandomage:	_num,
		healer:		_num,
		heal:		_bool,
		noheal:		_bool,

		startaff:	_num,
		startmajoraff:	_num,
		supplybonus:	_num,
		neednoteat:	_bool,
		uwdamage:	_num,
		homesick:	_num,

		coldpower:	_num,
		firepower:	_num,
		stormpower:	_num,
		darkpower:	_num,

		springpower:	_num,
		summerpower:	_num,
		fallpower:	_num,
		winterpower:	_num,

		chaospower: _num,
		deathpower: _num,
		magicpower: _num,
		slothpower: _num,
		dompower: _num,

		ambidextrous:	_num,
		banefireshield:	_num,
		berserk:	_num,

		ethereal:	_bool,
		standard:	_num,

		animalawe:	_num,
		awe:		_num,
		fear:		_num,
		regeneration:	_num,
		undregen:	_num,
		uwregen:	_num,
		reinvigoration:	_num,

		fireshield:	_num,
		uwfireshield:	_num,
		heat:		_num_def(3),
		cold:		_num_def(3),
		iceprot:	_num,

		trample:	_bool,
		entangle:	_bool,
		eyeloss:	_bool,

		horrormark:	_bool,
		poisonarmor:	_bool,
		poisoncloud:	_num,
		diseasecloud:	_num,
		bloodvengeance:	_num,
		castledef:	_num,
		siegebonus:	_num,
		patrolbonus:	_num,
		pillagebonus:	_num,

		researchbonus:	_num,
		forgebonus:	_num,
		douse:		_num,
		nobadevents:	_num,
		incunrest:	_num_div_10,
		spreaddom:	_num,
		leper:		_num,
		popkill:	_num_times_10,
		insanify:	_num,
		alchemy:	_num,
		inquisitor:	_bool,
		mason:	_bool,
		heretic:	_num,
		insane:	_num,
		startheroab:	_num,
		sailsize:	_num,
		latehero:	_num,

		itemslots:	function(c,a,t){
			var bitfield = parseInt(argnum(a));
			var slotmasks = {
				2: 'hand',	4: 'hand',	8: 'hand',	16: 'hand',	32: 'hand',	64: 'hand',
				128: 'head',	256: 'head',	512: 'head',
				1024: 'body',
				2048: 'foot',
				4096: 'misc',	8192: 'misc',	16384: 'misc',	32768: 'misc',	65536: 'misc',	131072: 'misc'
			};
			var o = modctx.unit;
			o.hand = o.head = o.body = o.foot = o.misc = '0';
			//if (! (bitfield & 1)) {
				for (var k in slotmasks) {
					if (bitfield & parseInt(k)) {
						var slot = slotmasks[k];
						o[slot] = Utils.sum( o[slot], 1 );
					}
				}
			//}
		},
		noitem:	function(c,a,t){
			var o = modctx.unit;
			o.hand = '0';
			o.head = '0';
			o.body = '0';
			o.foot = '0';
			//just leaves misc
		},

		//magic
		magicskill: function(c,a,t){
			var pstr = modconstants[10][argnum(a)];
			if (!pstr) throw 'invalid magic index';

			for (var i=0, p; p= pstr.charAt(i); i++) {
				modctx.unit[p] = a.n2;
			}
		},
		magicboost: function(c,a,t){
			//each magicboost overwrites the last
			//any number 10+ affects all paths (this is a seperate magicboost)
			// #magicboost 3 1 --E+1
			// #magicboost 3 1 --E+1
			// #magicboost 53 1 --all+1
			// = E+2

			var pstr = modconstants[10][argnum(a)];
			if (!Utils.inArray(pstr, modconstants.pathkeys))
				pstr = 'all';

			modctx.unit['magicboost_'+pstr] = a.n2;

			// if (pstr == 'FAWESDNBH') pstr = '';
			// modctx.unit['magicboost'] = DMI.Format.Signed(a.n2) + pstr;
			// for (var i=0, p; p= pstr.charAt(i); i++) {
			// 	modctx.unit['magicboost_'+p] = Utils.sum(modctx.unit['magicboost_'+p], a.n2);
			// }
		},
		//random paths
		custommagic: function(c,a,t){
			var bitfield = parseInt(argnum(a)),  chance = parseInt(argnum2(a));
			var pmasks = modconstants[11];
			var pstr = '', levels = 1;

			//bitfield to path string
			for (var k in pmasks)
				if (parseInt(k) & bitfield)  pstr += pmasks[k];

			//linked random
			while( chance > 100 ) {
				chance = chance - 100;
				levels += 1;
			}
			//create details object and push it onto unit
			modctx.unit.randompaths.push({ paths: pstr,  levels: levels,  chance: chance });
		},
		gemprod: function(c,a,t){
			var pstr = modconstants[10][argnum(a)];
			if (!pstr) throw 'invalid magic index';

			for (var i=0, p; p= pstr.charAt(i); i++) {
				modctx.unit['gemprod'] ? modctx.unit['gemprod'] += p+argnum2(a) : modctx.unit['gemprod'] = p+argnum2(a);
			}
		},
		onebattlespell: _ref,
		drainimmune: 	_bool,
		nowish: 	_bool,

		firstshape:	_ref,
		secondshape:	_ref,
		secondtmpshape:	_ref,
		shapechange:	_ref,
		landshape:	_ref,
		watershape:	_ref,
		forestshape:	_ref,
		plainshape:	_ref,
		xpshape: _num,

		domsummon:	function(c,a,t){ modctx[t]['domsummon'] = argref(a);  modctx[t]['n_domsummon'] = 'DRN' },
		domsummon2:	function(c,a,t){ modctx[t]['domsummon'] = argref(a);  modctx[t]['n_domsummon'] = 'DRN/2' },
		domsummon5:	function(c,a,t){ modctx[t]['domsummon'] = argref(a);  modctx[t]['n_domsummon'] = 'DRN/5' },
		domsummon10:	function(c,a,t){ modctx[t]['domsummon'] = argref(a);  modctx[t]['n_domsummon'] = 'DRN/10' },
		domsummon20:	function(c,a,t){ modctx[t]['domsummon'] = argref(a);  modctx[t]['n_domsummon'] = 'DRN/20' },

		makemonsters1:	function(c,a,t){ modctx[t]['summon'] = argref(a);  modctx[t]['n_summon'] = '1' },
		makemonsters2:	function(c,a,t){ modctx[t]['summon'] = argref(a);  modctx[t]['n_summon'] = '2' },
		makemonsters3:	function(c,a,t){ modctx[t]['summon'] = argref(a);  modctx[t]['n_summon'] = '3' },
		makemonsters4:	function(c,a,t){ modctx[t]['summon'] = argref(a);  modctx[t]['n_summon'] = '4' },
		makemonsters5:	function(c,a,t){ modctx[t]['summon'] = argref(a);  modctx[t]['n_summon'] = '5' },

		summon1:	function(c,a,t){ modctx[t]['autosum'] = argref(a);  modctx[t]['n_autosum'] = '1' },
		summon2:	function(c,a,t){ modctx[t]['autosum'] = argref(a);  modctx[t]['n_autosum'] = '2' },
		summon3:	function(c,a,t){ modctx[t]['autosum'] = argref(a);  modctx[t]['n_autosum'] = '3' },
		summon4:	function(c,a,t){ modctx[t]['autosum'] = argref(a);  modctx[t]['n_autosum'] = '4' },
		summon5:	function(c,a,t){ modctx[t]['autosum'] = argref(a);  modctx[t]['n_autosum'] = '5' },

		nametype:	_num,

		noleader:	function(c,a,t){ modctx[t]['leader'] = 0; },
		poorleader:	function(c,a,t){ modctx[t]['leader'] = 10; },
		okleader:	function(c,a,t){ modctx[t]['leader'] = 40; },
		goodleader:	function(c,a,t){ modctx[t]['leader'] = 80; },
		expertleader:	function(c,a,t){ modctx[t]['leader'] = 120; },
		superiorleader:	function(c,a,t){ modctx[t]['leader'] = 160; },
		command:		_num,

		nomagicleader:		function(c,a,t){ modctx[t]['magicleader'] = 0; },
		poormagicleader:	function(c,a,t){ modctx[t]['magicleader'] = 10; },
		okmagicleader:		function(c,a,t){ modctx[t]['magicleader'] = 40; },
		goodmagicleader:	function(c,a,t){ modctx[t]['magicleader'] = 80; },
		expertmagicleader:	function(c,a,t){ modctx[t]['magicleader'] = 120; },
		superiormagicleader:	function(c,a,t){ modctx[t]['magicleader'] = 160; },
		magiccommand:		_num,

		noundeadleader:		function(c,a,t){ modctx[t]['undeadleader'] = 0; },
		poorundeadleader:	function(c,a,t){ modctx[t]['undeadleader'] = 10; },
		okundeadleader:		function(c,a,t){ modctx[t]['undeadleader'] = 40; },
		goodundeadleader:	function(c,a,t){ modctx[t]['undeadleader'] = 80; },
		expertundeadleader:	function(c,a,t){ modctx[t]['undeadleader'] = 120; },
		superiorundeadleader:	function(c,a,t){ modctx[t]['undeadleader'] = 160; },
		undcommand:		_num,

		voidsanity:		_num,
		invulnerable:	_num,
		randomspell:	_num,
		reclimit:		_num,
		homerealm: 		function(c,a,t){
			var o = modctx[t];
			if (!Utils.is(o.realms)) {
				o.realms = [];
			}
			if (argnum(a) == 0)
			{
				// 0 clears realms
				o.realms = []
			}
			else
			{
				modctx[t]['realms'].push(argnum(a)); 	
			}
		},
		
		giftofwater:	_num,
		indepmove:		_num,
		indepstay:		_bool,
		norange:		_bool,
		nomovepen:		_bool,
		almostundead:		_bool,
		almostliving:		_bool,
		farsail:		_num,
		patience:		_num,
		falsearmy:		_num,
		foolscouts:		_num,
		deserter:		_num,
		horrordeserter:	_num,
		defector:		_num,
		autohealer:		_num,
		autodishealer:	_num,
		autodisgrinder:	_num,
		woundfend:		_num,
		damagerev:		_num,
		slimer:			_num,
		deathdisease:	_num,
		deathparalyze:	_num,
		deathfire:		_num,
		digest:			_num,
		aciddigest:		_num,
		incorporate:	_num,
		incprovdef:		_num,
		elegist:		_num,
		gold:			_num,
		growhp:			_num,
		shrinkhp:		_num,
		reanimator:		_num,
		montag:			_num,
		montagweight:	_num,
		ivylord:	_num,
		dragonlord:	_num,
		lamialord:	_num,
		corpselord:	_num,
		onisummon:	_num,
		slaver:	_str_num,
		slaverbonus: _num,
		inspirational:	_num,
		beastmaster:	_num,
		taskmaster:		_num,
		formationfighter:	_num,
		bodyguard:		_num,
		warning:		_num,
		masterrit:		_num,
		inspiringres:	_num,
		divineins:		_bool,
		firerange:		_num,
		airrange:		_num,
		waterrange:		_num,
		earthrange:		_num,
		astralrange:	_num,
		deathrange:		_num,
		naturerange:	_num,
		bloodrange:		_num,
		elementrange:	_num,
		sorceryrange:	_num,
		allrange:		_num,
		tmpfiregems:	_num,
		tmpairgems:		_num,
		tmpwatergems:	_num,
		tmpearthgems:	_num,
		tmpastralgems:	_num,
		tmpdeathgems:	_num,
		tmpnaturegems:	_num,
		tmpglamourgems: _num,
		tmpbloodslaves:	_num,
		makepearls:		_num,
		bonusspells:	_num,
		tainted:		_num,
		fixforgebonus:	_num,
		mastersmith:	_num,
		crossbreeder:	_num,
		deathbanish:	_num,
		kokytosret:		_num,
		infernoret:		_num,
		voidret:		_num,
		allret:			_num,
		resources:		_num,
		iceforging:		_num,
		guardspiritbonus:	_num,

		slowrec:		_bool,
		noslowrec:		_bool,
		reqlab:			_bool,
		reqtemple:		_bool,
		singlebattle:	_bool,
		aisinglerec:	_bool,
		ainorec:		_bool,
		heatrec:		_num,
		coldrec:		_num,
		chaosrec:		_num,
		deathrec:		_num,
		lesserhorror:	_bool,
		greaterhorror:	_bool,
		doomhorror:		_bool,
		bug:			_bool,
		uwbug:			_bool,
		autocompete:	_bool,
		float:			_bool,
		teleport:		_bool,
		mapteleport:	_bool,
		blink:			_bool,
		noriverpass:	_bool,
		unteleportable:	_bool,
		hpoverflow:		_bool,
		pierceres:		_bool,
		slashres:		_bool,
		bluntres:		_bool,
		deathcurse:		_bool,
		trampswallow:	_bool,
		taxcollector:	_bool,
		nohof:			_bool,
		cleanshape:		_bool,
		slave:			_bool,
		undisciplined:	_bool,
		magicimmune:	_bool,
		comslave:		_bool,
		indepspells:	_num,
		fastcast:		_num,

		raredomsummon:	function(c,a,t){ modctx[t]['raredomsummon'] = argref(a) },
		battlesum1:	_ref,
		battlesum2:	_ref,
		battlesum3:	_ref,
		battlesum4:	_ref,
		battlesum5:	_ref,
		batstartsum1:	_ref,
		batstartsum2:	_ref,
		batstartsum3:	_ref,
		batstartsum4:	_ref,
		batstartsum5:	_ref,
		batstartsum1d3:	_ref,
		batstartsum1d6:	_ref,
		batstartsum2d6:	_ref,
		batstartsum3d6:	_ref,
		batstartsum4d6:	_ref,
		batstartsum5d6:	_ref,

		fixedresearch: _num,
		slothresearch: _num,
		transformation: _num,
		undcommand: _num,
		magiccommand: _num,
		airshield: _num,
		ironvul: _num,
		overcharged: _num,
		sleepaura: _num,
		poisonskin: _num,
		xploss: _num,
		incscale: _num,
		decscale: _num,
		reform: _num,
		domrec: _num,
		haltheretic: _num,
		scalewalls: _bool,
		landdamage: _num,
		springshape: _str_num,
		summershape: _str_num,
		autumnshape: _str_num,
		wintershape: _str_num,
		notdomshape: _str_num,
		domshape: _str_num,
		homeshape: _str_num,
		foreignshape : _str_num,
		blessfly: _bool,
		plant: _bool,
		userestricteditem: _num,
		uwheat: _num,
		raiseonkill: _num,
		raiseshape: _str_num,
		acidshield: _num,
		hpoverslow: _num,
		corpseeater: _num,
		deadhp: _num,
		enchrebate50: _ref,
		mindslime: _num,
		prophetshape: _str_num,

		fireattuned: _num,
		airattuned: _num,
		waterattuned: _num,
		earthattuned: _num,
		astralattuned: _num,
		deathattuned: _num,
		natureattuned: _num,
		bloodattuned: _num,

		ownsmonrec:		function(c,a,t){ modctx[t]['ownsmonrec'] = argref(a) },
		monpresentrec: 	function(c,a,t){ modctx[t]['monpresentrec'] = argref(a) },

		drake: _bool,
        addupkeep: _num,
        
        skirmisher: _num, 
        minsizeleader: _num, 
        dragonlord: _num,
        unsurr: _num, 
        commaster: _bool, 
        carcasscollector: _num, 
        spellsinger: _bool, 
        magicstudy: _num, 
        curseluckshield: _num, 
        combatcaster: _bool, 
        reanimpriest: _bool,
        beartattoo: _num, 
        horsetattoo: _num, 
        wolftattoo: _num, 
        boartattoo: _num, 
        snaketattoo: _num, 
        swimming: _bool,
        snow: _bool,
        rpcost: _num,
        spiritsight: _bool,
        invisible: _bool,
        humanoid: _bool,
        templetrainer: _num,
        twiceborn: _num,
        snow: _bool,
        mountedhumanoid: _bool,
        bringeroffortune: _num,
	},

	//spell selected
	spellcommands: {
		end: function(c,a,t){
			var name = modctx.spell.name;
			modctx[t] = null;
			if (!name) throw 'unnamed spell';
		},
		name: function(c,a,t) {
			//if (modctx.spell.name) delete modctx.spelllookup[modctx.spell.name.toLowerCase()];
			modctx.spell.name = argtrim(a);
			modctx.spelllookup[$.trim(a.s.toLowerCase())] = modctx.spell;
		},
		descr: _str,
		details: _str,

		clear: function(c,a,t){
			var o = modctx.spell;
			var keepstats = {
				//stats to keep (not cleared)
				modded:1,
				id:1,
				name:1
			};
			for (var k in o)
				if (!keepstats[k]) delete o[k];

			o.nations = [];
			o.notnations = [];
		},
		copyspell: function(c,a,t){
			var from = modctx.spelllookup[a.n1] || modctx.spelllookup[($.trim(a.s) || '-1').toLowerCase()];
			if (!from) throw 'original spell not found';
			var ignorestats = {
				//stats to NOT copy
				modded:1,
				id:1
				//name:1,
			};
			var to = modctx.spell;
			for (var k in to)   if (!ignorestats[k]) delete to[k];
			for (var k in from) if (!ignorestats[k]) to[k] = from[k];

			//deep copy arrays
			to.nations = [];
			for (var i=0, m; m= from.nations[i]; i++) to.nations[i] = m;
			if (from.notnations) {
				to.notnations = [];
				for (var i=0, m; m= from.notnations[i]; i++) to.notnations[i] = m;
			}
		},
		school:		_num,
		researchlevel:	_num,
		path: function(c,a,t){
			var index, pkey;
			//verify path1 or path2
			if (argnum(a) == '0') index = 'path1';
			else if (argnum(a) == '1') index = 'path2';
			else throw "invalid reqnr (expected 0 or 1)";

			if (argnum2(a) == '-1') {
				delete modctx[t][index];
				return;
			}
			if (!(pkey=  modconstants[10][argnum2(a)])) throw "invalid path number";
			modctx[t][index] = pkey;
		},
		pathlevel: function(c,a,t){
			var index;
			//verify path1 or path2
			if (argnum(a) == '0') index = 'pathlevel1';
			else if (argnum(a) == '1') index = 'pathlevel2';
			else throw "invalid reqnr (expected 0 or 1)";

			modctx[t][index] = argnum2(a);
		},
		aoe:		_num,
		damage:		_num,
		effect:		_num,
		fatiguecost:	_num,
		nextspell:	_ref,
		nreff:		_num,
		range:		_num,
		precision:	_num,
		spec:		_num,

		restricted: function(c,a,t){ modctx.spell.nations.push(argref(a)); }, //deferr lookups
		notfornation: function(c,a,t){ modctx.spell.notnations.push(argref(a)); },

		damagemon: 		_str,

		provrange:		_num,
		onlygeosrc:		_num,
		nogeosrc:		_num,
		onlygeodst:		_num,
		onlyfriendlydst:_num,
		onlyowndst:		_num,
		nowatertrace:	_num,
		nolandtrace:	_num,
		walkable:		_num,
		onlyatsite: 	_ref,
		farsumcom:		_num,
		casttime:		_num,
		ainocast:		_num,
		aispellmod:		_num,

		//fx
		flightspr:	_ignore,
		explspr:	_ignore,
		sound:		_ignore,
		sample:		_ignore
	},

	//nation selected
	nationcommands: {
		end: function(c,a,t){ modctx[t] = null; },

		clearnation: function(c,a,t) {
			var o = modctx.nation;
			var keepstats = {
			//KEEP
				//????????????????????
				modded:1,
				id:1,
				name:1, epithet:1, era:1,
				descr:1, summary:1, brief:1,
				color:1, flag:1,

				//units
				//~ startcom:1, startscout:1,
				//~ startunittype1:1, startunitnbrs1:1,
				//~ startunittype2:1, startunitnbrs2:1,
				units:1,
				commanders:1
				//~ uwunits:1,
				//~ uwcom:1,
				//~ heroes:1,
				//~ multiheroes:1,
				//~ defcom1:1, defunit1:1, defmult1:1, defunit1b:1, defmult1b:1,
				//~ defcom2:1, defunit2:1, defmult2:1, defunit2b:1, defmult2b:1,

				//sites
				//startsites:1,
			};
			for (var k in o) {
				if (!keepstats[k]) {
					if ($.isArray(o[k])) o[k] = [];
					else delete o[k];
				}
			}
		},
		clearrec: function(c,a,t) {
			var o = modctx.nation;
			var clearstats = {
			//CLEAR
				units:1,
				commanders:1
			};
			for (var k in o) {
				if (clearstats[k]) {
					if ($.isArray(o[k])) o[k] = [];
					else delete o[k];
				}
			}
		},
		clear: function(c,a,t) {
			modctx.nationcommands.clearnation(c,a,t);
		},

		//units
		startcom: _ignore,//_ref,
		startscout: _ignore,//_ref,
		startunittype1: _ignore,//_ref,
		startunitnbrs1: _ignore,//_ref,
		startunittype2: _ignore,//_ref,
		startunitnbrs2: _ignore,//_ref,

		addrecunit: function(c,a,t){ modctx[t]['units'].push(argref(a)); },
		addreccom: function(c,a,t){ modctx[t]['commanders'].push(argref(a)); },

		landrec: function(c,a,t){ modctx[t]['landunit'].push(argref(a)); },
		landcom: function(c,a,t){ modctx[t]['landcom'].push(argref(a)); },

		uwunit1: function(c,a,t){ modctx[t]['uwunit'][1] = argref(a); },
		uwunit2: function(c,a,t){ modctx[t]['uwunit'][2] = argref(a); },
		uwunit3: function(c,a,t){ modctx[t]['uwunit'][3] = argref(a); },
		uwunit4: function(c,a,t){ modctx[t]['uwunit'][4] = argref(a); },
		uwunit5: function(c,a,t){ modctx[t]['uwunit'][5] = argref(a); },
		uwcom1: function(c,a,t){ modctx[t]['uwcom'][1] = argref(a); },
		uwcom2: function(c,a,t){ modctx[t]['uwcom'][2] = argref(a); },
		uwcom3: function(c,a,t){ modctx[t]['uwcom'][3] = argref(a); },
		uwcom4: function(c,a,t){ modctx[t]['uwcom'][4] = argref(a); },
		uwcom5: function(c,a,t){ modctx[t]['uwcom'][5] = argref(a); },

		hero1: function(c,a,t){ modctx[t]['heroes'][1] = argref(a); },
		hero2: function(c,a,t){ modctx[t]['heroes'][2] = argref(a); },
		hero3: function(c,a,t){ modctx[t]['heroes'][3] = argref(a); },
		hero4: function(c,a,t){ modctx[t]['heroes'][4] = argref(a); },
		hero5: function(c,a,t){ modctx[t]['heroes'][5] = argref(a); },
		hero6: function(c,a,t){ modctx[t]['heroes'][6] = argref(a); },

		multihero1: function(c,a,t){ modctx[t]['multiheroes'][1] = argref(a); },
		multihero2: function(c,a,t){ modctx[t]['multiheroes'][2] = argref(a); },

		defcom1: _ignore,//_ref,
		defunit1: _ignore,//_ref,
		defmult1: _ignore,//_ref,
		defunit1b: _ignore,//_ref,
		defmult1b: _ignore,//_ref,

		defcom2: _ignore,//_ref,
		defunit2: _ignore,//_ref,
		defmult2: _ignore,//_ref,
		defunit2b: _ignore,//_ref,
		defmult2b: _ignore,//_ref,

		name: _str,
		epithet: _str,
		era: _num,
		descr: _ignore,//_str,
		summary: _ignore,//_str,
		brief: _ignore,//_str,

		//fx
		color: _ignore, //<red> <green> <blue>
		flag: _ignore, //"<imgfile>"
		templepic: _ignore, //Table 26 for some pic nbr values.
		mapbackground: _ignore, // "<imgfile>"
		secondarycolor: _ignore,

		labcost: _ignore,//_num,
		templecost: _ignore,//_num,

		clearsites: function(c,a,t){ modctx[t]['sites'] = [] },
		startsite:  function(c,a,t){ modctx[t]['sites'].push(argref(a)); },

		uwnation: _bool,
		bloodnation: _ignore, //Hint to AI player
		coastnation: _ignore, //Hint to AI player
		cavenation: _ignore, //Hint to AI player

		nopreach: _ignore,//_bool, //mictlan
		dyingdom: _ignore,//_bool, //mictlan
		sacrificedom: _ignore,//_bool, //mictlan

		nodeathsupply: _ignore,//_bool, //Abysia
		idealcold: _ignore,//_num,
		castleprod: _ignore,//_num, //MA Ulm: 25
		domkill: _ignore,//_num, //LA Ermor
		domunrest: _ignore,//_num,
		autoundead: _ignore,//_num, //LA Ermor

		zombiereanim: _ignore,//_bool, //LA Ermor
//~ Priests can reanimate ghouls, soulless and
//~ longdead infantry and gain 15 points of undead
//~ leadership per holy magic level.

		horsereanim: _ignore,//_bool, //LA Ermor
//~ Priests with holy magic of level 3 or higher can
//~ reanimate longdead horsemen. Broken Empire
//~ Ermor has this attribute.
		wightreanim: _ignore,//_bool, //LA Ermor
//~ Priests with holy magic of level 4 or higher can
//~ reanimate undead Lictors. Ashen Empire Ermor
//~ has this attribute.
		manikinreanim: _ignore,//_bool, //LA Pangaean
//~ Priests can reanimate carrion beasts, manikins
//~ and other Pangaean undead.
//~ Nbr Site Effect
		tombwyrmreanim: _ignore,//_bool, //C'tis
//~ Priests can reanimate soulless of C'tis, longdead
//~ of C'tis, tomb wyrms and other special C'tissian
//~ undead. Desert Tombs C'tis has this attribute.

		//startfort: _ignore,//_num,// Table 28 for a list of fort numbers
		//defaultfort: _ignore,//_num,
		//farmfort: _ignore,//_num,
		//mountainfort: _ignore,//_num,
		//forestfort: _ignore,//_num,
		//swampfort: _ignore,//_num,
		//uwfort: _ignore,//_num,
		//deepfort: _ignore//_num

		likesterr: _ignore,
		hatesterr: _ignore,
		aiawake: _ignore,
		merccost: _ignore,
		homerealm: function(c,a,t){ modctx[t]['homerealm'].push(argref(a)); },
		likespop: _ignore,
		fortera: _ignore,
		fortcost: _ignore,
		uwbuild: _ignore,
		spreadcold: _ignore,
		spreadheat: _ignore,
		spreadchaos: _ignore,
		spreadlazy: _ignore,
		spreaddeath: _ignore,
		golemhp: _ignore,
		tradecoast: _ignore,

		godrebirth: _ignore,

		templegems: _ignore,

		coastunit1: function(c,a,t){ modctx[t]['coastrec'][1] = argref(a); },
		coastunit2: function(c,a,t){ modctx[t]['coastrec'][2] = argref(a); },
		coastunit3: function(c,a,t){ modctx[t]['coastrec'][2] = argref(a); },
		coastcom1: function(c,a,t){ modctx[t]['coastcom'][1] = argref(a); },
		coastcom2: function(c,a,t){ modctx[t]['coastcom'][2] = argref(a); },
		addforeignunit: function(c,a,t){ modctx[t]['foreignunits'].push(argref(a)); },
		addforeigncom: function(c,a,t){ modctx[t]['foreigncommanders'].push(argref(a)); },
		forestrec: function(c,a,t){ modctx[t]['forestrec'].push(argref(a)); },
		forestcom: function(c,a,t){ modctx[t]['forestcom'].push(argref(a)); },
		mountainrec: function(c,a,t){ modctx[t]['mountainrec'].push(argref(a)); },
		mountaincom: function(c,a,t){ modctx[t]['mountaincom'].push(argref(a)); },
		swamprec: function(c,a,t){ modctx[t]['swamprec'].push(argref(a)); },
		swampcom: function(c,a,t){ modctx[t]['swampcom'].push(argref(a)); },
		wasterec: function(c,a,t){ modctx[t]['wasterec'].push(argref(a)); },
		wastecom: function(c,a,t){ modctx[t]['wastecom'].push(argref(a)); },
		caverec: function(c,a,t){ modctx[t]['caverec'].push(argref(a)); },
		cavecom: function(c,a,t){ modctx[t]['cavecom'].push(argref(a)); },

		noforeignrec: _bool,
		aigoodbless: _num,

		aiholdgod: _ignore,
		aiawake : _ignore,
		bloodnation : _ignore,
		aimusthavemag : _ignore,
		aifirenation: _ignore,
		aiairnation : _ignore,
		aiwaternation : _ignore,
		aiearthnation : _ignore,
		aiastralnation : _ignore,
		aideathnation : _ignore,
		ainaturenation : _ignore,
		aibloodnation : _ignore,

		cheapgod20: _ignore,
		cheapgod40: _ignore,
		killcappop: _ignore,
		guardspirit: _ignore,

		disableoldnations: _bool,
		cleargods: _bool,
		addgod: function(c,a,t){ modctx[t]['addgod'].push(argref(a)); },
		delgod: function(c,a,t){ modctx[t]['delgod'].push(argref(a)); }

	},

	//site selected
	sitecommands: {
		end: function(c,a,t){
			var name = modctx[t].name;
			modctx[t] = null;
			if (!name) throw 'unnamed '+t;
		},
		name: function(c,a,t) {
			if (modctx.site.name) delete modctx.sitelookup[modctx.site.name.toLowerCase()];
			modctx.site.name = argtrim(a);
			modctx.sitelookup[$.trim(a.s.toLowerCase())] = modctx.site;
		},

		clear: function(c,a,t) {
			var o = modctx.site;
			var keepstats = {
			//KEEP
				modded:1,
				id:1,
				name:1
			};
			for (var k in o) {
				if (!keepstats[k]) {
					if ($.isArray(o[k])) o[k] = [];
					else delete o[k];
				}
			}
		},
		gems: function(c,a,t){
			var pstr = modconstants[10][argnum(a)];
			if (!pstr) throw 'invalid magic index';

			//support 'SORCERY' and 'ALL'. overwrites gem income for each path. ?
			for (var p, i=0; p=pstr.charAt(i); i++) {
				modctx[t][p] = a.n2;
			}
		},

		path: function(c,a,t){ modctx[t][c] = modconstants['pathnames'][a.n1] },
		level: _num,

		rarity: _num,
		loc: _num,

		homemon: function(c,a,t){ modctx[t]['hmon'].push(argref(a)); },
		homecom: function(c,a,t){ modctx[t]['hcom'].push(argref(a)); },

		mon: function(c,a,t){ modctx[t]['mon'].push(argref(a)); },
		com: function(c,a,t){ modctx[t]['com'].push(argref(a));	},

		gold: _num,
		res: _num,
		incscale: function(c,a,t){ modctx[t]['scales'].push(Utils.getScale(argnum(a))); },
		decscale: function(c,a,t){ modctx[t]['scales'].push(Utils.getScaleInverted(argnum(a))); },

		lab: _bool,
		heal: _num,
		curse: _num,
		disease: _num,
		horrormark: function(c,a,t){ modctx[t]['horror'] = argnum(a); },
		holyfire: _num,
		holypower: function(c,a,t){ modctx[t]['holypow'] = argnum(a); },

		conjcost: function(c,a,t){ modctx[t]['conj'] = argnum(a); },
		altcost: function(c,a,t){ modctx[t]['alter'] = argnum(a); },
		evocost: function(c,a,t){ modctx[t]['evo'] = argnum(a); },
		constcost: function(c,a,t){ modctx[t]['const'] = argnum(a); },
		enchcost: function(c,a,t){ modctx[t]['ench'] = argnum(a); },
		thaucost: function(c,a,t){ modctx[t]['thau'] = argnum(a); },
		bloodcost: function(c,a,t){ modctx[t]['blood'] = argnum(a); },

		decunrest: function(c,a,t){ modctx[t]['unr'] = -argnum(a); },
		supply: function(c,a,t){ modctx[t]['sup'] = argnum(a); },
		voidgate: _num,
		fort: _num,
		fortpart: _ignore,
		scry: _num,
		firerange: function(c,a,t){ modctx[t]['rit'] += 'F'; modctx[t]['ritrng'] = argnum(a); },
		airrange: function(c,a,t){ modctx[t]['rit'] += 'A'; modctx[t]['ritrng'] = argnum(a); },
		waterrange: function(c,a,t){ modctx[t]['rit'] += 'W'; modctx[t]['ritrng'] = argnum(a); },
		earthrange: function(c,a,t){ modctx[t]['rit'] += 'E'; modctx[t]['ritrng'] = argnum(a); },
		astralrange: function(c,a,t){ modctx[t]['rit'] += 'S'; modctx[t]['ritrng'] = argnum(a); },
		deathrange: function(c,a,t){ modctx[t]['rit'] += 'D'; modctx[t]['ritrng'] = argnum(a); },
		naturerange: function(c,a,t){ modctx[t]['rit'] += 'N'; modctx[t]['ritrng'] = argnum(a); },
		bloodrange: function(c,a,t){ modctx[t]['rit'] += 'B'; modctx[t]['ritrng'] = argnum(a); },
		elementrange: function(c,a,t){ modctx[t]['rit'] += 'FAWE'; modctx[t]['ritrng'] = argnum(a); },
		sorceryrange: function(c,a,t){ modctx[t]['rit'] += 'SDNB'; modctx[t]['ritrng'] = argnum(a); },
		allrange: function(c,a,t){ modctx[t]['rit'] += 'FAWESDNB'; modctx[t]['ritrng'] = argnum(a); },
		xp: function(c,a,t){ modctx[t]['exp'] = argnum(a); },
		adventureruin: function(c,a,t){ modctx[t]['adventure'] = argnum(a); },
		cluster: _ignore,
		dominion: function(c,a,t){ modctx[t]['domspread'] = argnum(a); },
		goddomchaos: function(c,a,t){ modctx[t]['turmoil'] = argnum(a); },
		goddomlazy: function(c,a,t){ modctx[t]['sloth'] = argnum(a); },
		goddomcold: function(c,a,t){ modctx[t]['cold'] = argnum(a); },
		goddomdeath: function(c,a,t){ modctx[t]['death'] = argnum(a); },
		goddommisfortune: function(c,a,t){ modctx[t]['misfortune'] = argnum(a); },
		goddomdrain: function(c,a,t){ modctx[t]['drain'] = argnum(a); },
		blesshp: function(c,a,t){ modctx[t]['hp'] = argnum(a); },
		blessmr: function(c,a,t){ modctx[t]['mr'] = argnum(a); },
		blessmor: function(c,a,t){ modctx[t]['mor'] = argnum(a); },
		blessstr: function(c,a,t){ modctx[t]['str'] = argnum(a); },
		blessatt: function(c,a,t){ modctx[t]['att'] = argnum(a); },
		blessdef: function(c,a,t){ modctx[t]['def'] = argnum(a); },
		blessprec: function(c,a,t){ modctx[t]['prec'] = argnum(a); },
		blessfireres: function(c,a,t){ modctx[t]['fireres'] = argnum(a); },
		blesscoldres: function(c,a,t){ modctx[t]['coldres'] = argnum(a); },
		blessshockres: function(c,a,t){ modctx[t]['shockres'] = argnum(a); },
		blesspoisres: function(c,a,t){ modctx[t]['poisonres'] = argnum(a); },
		blessairshld: function(c,a,t){ modctx[t]['airshield'] = argnum(a); },
		blessreinvig: function(c,a,t){ modctx[t]['reinvigoration'] = argnum(a); },
		blessdtv: function(c,a,t){ modctx[t]['undying'] = argnum(a); },
		blessanimawe: function(c,a,t){ modctx[t]['aawe'] = argnum(a); },
		blessawe: function(c,a,t){ modctx[t]['awe'] = argnum(a); },
		blessdarkvis: function(c,a,t){ modctx[t]['darkvision'] = argnum(a); },

		temple: _bool,
		claim: _ignore,
		evil: _ignore,
		wild: _ignore,

		summon: function(c,a,t){ modctx[t]['sum'].push(argref(a)); },
		summonlvl2: function(c,a,t){ modctx[t]['suml2'].push(argref(a)); },
		summonlvl3: function(c,a,t){ modctx[t]['suml3'].push(argref(a)); },
		summonlvl4: function(c,a,t){ modctx[t]['suml4'].push(argref(a)); }

	},

	//event selected
	eventcommands: {

		end: function(c,a,t){
			var rarity = modctx[t].rarity;
			modctx[t] = null;
			if (!rarity) throw 'no rarity set for '+t;
		},

		rarity: _num, //do a lookup
		req_rare: _num,
		req_unique: _num,

		// Requirements
		req_story: _num,
		req_indepok : _num,
		req_era : _num,
		req_noera : _num,
		req_turn : _num,
		req_maxturn : _num,
		req_season : _num,
		req_noseason : _num,
		req_gem : _num,
		req_nation : _num, //nation
		req_fornation : _num, //nation
		req_notnation : _num, //nation
		req_notfornation : _num, //nation
		req_domowner : _num, //nation
		req_capital : _num,
		req_owncapital : _num,
		req_poptype : _num,
		req_pop0ok : _bool,
		req_maxpop : _num,
		req_minpop : _num,
		req_mindef : _num,
		req_maxdef : _num,
		req_minunrest : _num,
		req_maxunrest : _num,
		req_lab: _num,
		req_temple : _num,
		req_fort : _num,
		req_land : _num,
		req_coast : _num,
		req_mountain : _num,
		req_forest : _num,
		req_farm : _num,
		req_swamp : _num,
		req_waste : _num,
		req_cave : _num,
		req_freshwater : _num,
		req_freesites : _num,
		req_nositenbr : _num, // Site ref
		req_foundsite : _num, //sitename
		req_hiddensite : _num, //sitename
		req_site : _num, //sitename
		req_nearbysite : _num, //sitename
		req_claimedthrone : _num, //sitename
		req_unclaimedthrone : _num, //sitename
		req_fullowner : _num,
		req_mydominion : _num,
		req_dominion : _num,
		req_maxdominion : _num,
		req_chaos : _num,
		req_lazy : _num,
		req_cold : _num,
		req_death : _num,
		req_unluck : _num,
		req_unmagic : _num,
		req_order : _num,
		req_prod : _num,
		req_heat : _num,
		req_growth : _num,
		req_luck : _num,
		req_magic : _num,
		req_commander : _num,
		req_monster : _str_num, //lookup
		req_nomonster : _str_num, //lookup
		req_nomnr : _str_num, //lookup
		req_mintroops : _num,
		req_maxtroops : _num,
		req_humanoidres : _bool,
		req_researcher : _bool,
		req_preach : _num,
		req_pathfire : _num,
		req_pathair : _num,
		req_pathwater : _num,
		req_pathearth : _num,
		req_pathastral : _num,
		req_pathdeath : _num,
		req_pathnature : _num,
		req_pathblood : _num,
		req_pathholy : _num,
		req_nopathfire : _num,
		req_nopathair : _num,
		req_nopathwater : _num,
		req_nopathearth : _num,
		req_nopathastral : _num,
		req_nopathdeath : _num,
		req_nopathnature : _num,
		req_nopathblood : _num,
		req_nopathholy : _num,
		req_nopathall : _num,
		req_targmnr : _str_num, //lookup
		req_targgod : _num,
		req_targhumanoid : _num,
		req_targmale : _num,
		req_targpath1 : _num, //lookup
		req_targpath2 : _num, //lookup
		req_targpath3 : _num, //lookup
		req_targpath4 : _num, //lookup
		req_targaff : _num, //lookup
		req_targorder : _num, //lookup
		req_code : _num, // ideally lookup, would be really hard though
		req_anycode : _num,
		req_nearbycode : _num,
		req_nearowncode : _num,
		req_permonth : _num,
		req_noench : _num, //lookup
		req_ench : _num, //lookup
		req_myench : _num, //lookup
		req_friendlyench : _num, //lookup
		req_hostileench : _num, //lookup
		req_enchdom : _num, //lookup
		req_targitem: _num, //lookup
		req_gold: _num,
		req_mnr: _num,
		req_notanycode: _num, 
		req_2monsters: _num, 
		req_domchance: _num, 
		req_targmaxmorale: _num, 
		req_targundead: _num, 
		req_targdemon: _num, 
		req_targinanimate: _num, 
		req_targmagicbeing: _num, 
		req_5monsters: _num,  
		req_thronesite: _num,

		xp: _num,
		
		killpop : _num,

		// Effects
		nation: _num, //lookup
		msg:	function(c,a,t){ modctx[t]['description'] = argref(a); modctx[t]['name'] = argref(a).substr(0,25); },

		notext: _bool,
		nolog: _bool,
		magicitem : _num, //lookup, maybe
		gold: _num,
		exactgold: _num,
		_1d3vis: _num, //lookup
		_1d6vis: _num, //lookup
		_2d4vis: _num, //lookup
		_2d6vis: _num, //lookup
		_3d6vis: _num, //lookup
		_4d6vis: _num, //lookup
		gemloss : _num, //lookup
		incscale : _num, //lookup
		incscale2 : _num, //lookup
		incscale3 : _num, //lookup
		decscale : _num, //lookup
		decscale2 : _num, //lookup
		decscale3 : _num, //lookup
		landgold : _num,
		landprod : _num,
		taxboost : _num,
		defence : _num,
		kill : _num,
		incpop : _num,
		emigration : _num,
		unrest : _num,
		incdom : _num,
		fort : _num, //lookup
		temple : _num,
		lab : _num,
		revealsite: _bool,
		addsite : _num, //lookup
		hiddensite : _num, //lookup
		removesite : _num, //lookup
		visitors : _bool,
		newdom : _num,
		revolt : _bool,
		revealprov : _bool,

		assassin : _str_num, //lookup
		stealthcom  : _str_num, //lookup
		com  : _str_num, //lookup
		_2com  : _str_num,
		_3com  : _str_num,
		_4com  : _str_num,
		_5com  : _str_num,
		tempunits  : _str_num, //lookup
		_1unit  : _str_num, //lookup
		_1d3units  : _str_num, //lookup
		_1d6units  : _str_num, //lookup
		_2d6units  : _str_num, //lookup
		_3d6units  : _str_num, //lookup
		_4d6units  : _str_num, //lookup
		_5d6units  : _str_num, //lookup
		_6d6units  : _str_num, //lookup
		_7d6units  : _str_num, //lookup
		_8d6units  : _str_num, //lookup
		_9d6units  : _str_num, //lookup
		_10d6units  : _str_num, //lookup
		_11d6units  : _str_num, //lookup
		_12d6units  : _str_num, //lookup
		_13d6units  : _str_num, //lookup
		_14d6units  : _str_num, //lookup
		_15d6units  : _str_num, //lookup
		_16d6units  : _str_num, //lookup
		strikeunits  : _str_num, //lookup
		killmon  : _str_num, //lookup
		killcom  : _str_num, //lookup

		curse: _num,
		disease: _num,
		researchaff: _num, //lookup
		gainaff: _num, //lookup
		gainmark: _bool,
		banished: _num, //lookup
		addequip: _num, //lookup, maybe
		fireboost: _ref_optional, //lookup
		airboost: _ref_optional, //lookup
		waterboost: _ref_optional, //lookup
		earthboost: _ref_optional, //lookup
		astralboost: _ref_optional, //lookup
		deathboost: _ref_optional, //lookup
		natureboost: _ref_optional, //lookup
		bloodboost: _ref_optional, //lookup
		holyboost: _ref_optional, //lookup
		pathboost: _num, //lookup
		worldincscale  : _num, //lookup
		worldincscale2  : _num, //lookup
		worldincscale3  : _num, //lookup
		worlddecscale  : _num, //lookup
		worlddecscale2  : _num, //lookup
		worlddecscale3  : _num, //lookup
		worldunrest  : _num,
		worldincdom  : _num,
		worldritrebate : _num, //lookup
		worlddarkness : _bool,
		worldcurse : _num,
		worlddisease : _num,
		worldmark : _num,
		worldheal : _num,
		worldage : _num,
		linger : _num,

		flagland : _num,
		delay : _num,
		delay25 : _num,
		delay50 : _num,
		order  : _num, //lookup

		code  : _num,
		code2  : _num,
		resetcode  : _num,
		purgecalendar  : _num,
		purgedelayed  : _num,
		transform: _str_num, //lookup
		nationench: _num,
		

		id:	function(c,a,t){ modctx[t]['eff_id'] = argref(a); }
	},

    //nametype selected
    nametypecommands: {
        end: function(c,a,t){
            modctx[t] = null;
        },
		clear: _ignore,
        addname: _ignore
    },

    //merc selected
    merccommands: {
        end: function(c,a,t){
            modctx[t] = null;
        },
        name: _str,
        bossname: _str,
        com: _ref,
        unit: _ref,
        nrunits: _num,
        level: _num,
        minmen: _num,

        minpay: _num,
        xp: _num,
        randequip: _num,
        recrate: _num,
        item: _ref,
        eramask: _num
    },

	//member data
	loadedmods: [],

	//will be filled before we parse mod
	itemdata: undefined,
	itemlookup: undefined,
	item: null,

	armordata: undefined,
	armorlookup: undefined,
	armor: null,

	wpndata: undefined,
	wpnlookup: undefined,
	wpn: null,

	spelldata: undefined,
	spelllookup: undefined,
	spell: null,

	unitdata: undefined,
	unitlookup: undefined,
	unit: null,

	nationdata: undefined,
	nationlookup: undefined,
	nation: null,

	sitedata: undefined,
	sitelookup: undefined,
	site: null,

	mercdata: undefined,
	merclookup: undefined,
	merc: null,

    eventdata: undefined,
    eventlookup: undefined,
    event: null,

    nametypedata: undefined,
    nametypelookup: undefined,
    nametype: null,


    // setWpnDamageType: function(key) {
	// 	if (modctx.wpn) {
	// 		for (var k in modctx.dmg_types) {
	// 			delete modctx.wpn[k];
	// 		}
	// 		modctx.wpn[key] = '1';
	// 	} else throw 'command out of context';
	// },


	//duplicates unit. each unit has a duplicate for each nation it belongs to
	cloneUnit: function(o) {
		o.dupes = o.dupes || [o];

		var newo = {};
		for (k in o) { newo[k] = o[k]; }
		newo.id = o.id + (o.dupes.length * 0.01);

		o.dupes.push(newo);
		this.unitdata.push(newo);

		return newo;
	},
	getUnitOfType: function(o, type) {
		//find dupe of right type
		var dupes = o.dupes || [o];
		for (var i=0, dupe;  dupe= dupes[i]; i++) {
			if (dupe.type == type)
				return dupe;
		}
		return null;
	},
	getExactUnit: function(id) {
		//get unit by float id (not int)
		var o = this.unitlookup[parseInt(id)];
		var dupes = o.dupes || [o];
		for (var i=0, dupe;  dupe= dupes[i]; i++) {
			if (String(dupe.id) == String(id))
				return dupe;
		}
		return o;
	}
};


var modcom_re_multistr = /#(\w+)\s*"([^"]+)\r?$/;
var modcom_re_strcont  = /([^"]*)("|)/;
var modcom_re = /^\s*#(\w+)\s*("([^"]+)"|)(-?\d+\.?\d*|)\s*(-?\d+\.?\d*|)\s*(-?\d+\.?\d*|)\s*/;

modctx.parseMod = function(str, modnum, modname) {
	var lines = str.split('\n');
	for (var i=0; i<lines.length; i++) {
		var cstr = lines[i], linenum = i+1;
		var cmd, args;

		// check for comments
		if (cstr.startsWith('--')) continue;

		//check for open quote
		var a = modcom_re_multistr.exec(lines[i]);
		if (a) {
			cmd = a[1];
			args = { s: a[2] }

			//continue multi line string
			while(1) {
				i++;
				cstr += '\n' + lines[i];

				var a = modcom_re_strcont.exec(lines[i]);
				args.s += ' ' + a[1];
				//ended?
				if (a[2] == '"')
					break;
			}

		} else {
			//check single line commmand
			var a = modcom_re.exec(lines[i]);
			if (!a) continue;

			cmd = a[1];
			args = {
				s: a[3],
				n1: a[4],
				n2: a[5],
				n3: a[6]
			};
		}

		function modCmdWarning(msg) {
			emsg = "WARNING: " + msg;
			emsg += '\n'+modname+ ':' +linenum + '   ' + cstr;
			console.log(emsg);
		}

		//process command
		if (cmd) {
			var emsg = '';

			try {
				modctx.processCommand(cmd, args, modCmdWarning);
			}
			catch(err) {
				//rethrowing error loses stack trace so..
				//fuckit, just do it again
				if (typeof(err) != 'string') {
					//throw(err);
					modctx.processCommand(cmd, args, function(_){});
				}
				emsg = "ERROR: " + err;
				emsg += '\n'+modname+ ':' +linenum + '   ' + cstr;
				//emsg += '\n'+cstr;
				console.log(emsg);
			}

			//debug.. attaches relevant mod commands to data (will show on details pane)
			if (cmd) {
				if (cmd == 'descr')
					cstr = cstr.substr(0,30)+'...';
				var types =  ['unit', 'spell', 'wpn', 'item', 'armor', 'nation', 'site'];
				var ignorecmds = { selectmonster:1, selectspell:1, selectweapon:1, selectitem:1, selectarmor:1, selectnation:1 }

				for (var j=0, type; type=types[j]; j++) {
					if (modctx[type] && !ignorecmds[cmd]) {
						if (emsg)
							modctx[type].modded += emsg.split('\n')[0] +'<br />!! ';

						if (!modctx[type].modded)
							modctx[type].modded = "";

						modctx[type].modded += modnum + ':' + linenum +'&nbsp;&nbsp;'+cstr+'<br />';
						//modctx.item.cmds += JSON.stringify(args)+'<br />';
					}
				}
			}
		}
	}
}




//namespace args
}( window.DMI = window.DMI || {}, jQuery ));

