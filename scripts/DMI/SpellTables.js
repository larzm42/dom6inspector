//namespace scope
(function( DMI, $, undefined ){

var MSpell = DMI.MSpell = DMI.MSpell || {};

var Format = DMI.Format;
var Utils = DMI.Utils;
var modctx = DMI.modctx;


//////////////////////////////////////////////////////////////
// SPELL VALUE TRANSLATION
/////////////////////////////////////////////////////////////

// used for spell fields: (damage, aoe, range, nbr_of_effects)
// each 1000 adds 1 per caster path (above base casting level)
//examples:
//  10     ->   10
//  510    ->   10+ [1/2 lvl]
//  1010   ->   10+
//  3010   ->   10+++
//  10010  ->   10+ [10/lvl]
//  -25025 ->   -25- [25/lvl]
function spellBonus(v, baselvl) {
	v = parseInt(v || '0');
	baselvl = parseInt(baselvl || '0');

	var mod;
	if (v > 99 && v < 999) {
		mod = 500;
	} else {
		mod = 1000;
	}
	
	//strip thousands
	var vbase = v % mod;

	//count thousands
	var bonus = (v-vbase) / mod;

	//baselvl is minimum caster lvl (add compulsory bonus to match ingame display)
	if (mod == 1000) {
		vbase = vbase + (baselvl * bonus)
	}

	//support negative values
	var chr = '+',  suf = '';
	if (bonus < 0) {
		bonus = -bonus;
		chr = '-';
	}
	//10+ (4/lvl)
	if (bonus > 3)
		suf = chr+' ['+bonus+'/lvl]';
	//10+++
	else if (bonus > 0)
		suf = (new Array( bonus + 1 ).join( chr ));
	
	if (mod == 500) {
		suf = suf + "[1/2 lvl]";
	}

	return String(vbase) + suf;
}

//format functions for spell fields
// using spellBonus + other field specific stuff
MSpell.format = {

	damage: function(spell, effect) {
		return String(spellBonus(effect.raw_argument, spell.pathlevel1));
	},

	effect: function(neffect) {
		neffect = parseInt(neffect);
		if (neffect > 999 && (neffect < 10000 || neffect > 20000))
			return neffect % 1000;
		return neffect;
	}
}

function show_summon(unit, count, pathlevel1, spellid) {
	var ref;
	if (parseInt(unit) < 0 || (parseInt(spellid) == 380) || (parseInt(spellid) == 1081)) {
		var arr;
		if (unit == "-16") {
			arr = MSpell.yazads;
		} else if (unit == "-17") {
			arr = MSpell.yatas;
		} else if (unit == "-21") {
			arr = MSpell.dwarfs;
		} else if (unit == "543") {
			arr = MSpell.angelichost;
		} else if (unit == "303") {
			arr = MSpell.hordefromhell;
		}
		if (arr) {
			//create array of refs
			var tokens = [];
			for (var i=0, uid; uid= arr[i];  i++)
				tokens.push( show_summon(uid, i==0 ? 1 : count) );

			//comma separated & one per line
			return tokens.join(', <br />');
		}

		ref = modctx.monster_tags_lookup[parseInt(unit)];
		if (ref) {
			ref = ref.name;
		} else {
			ref = '';
			for (var oi=0, o;  o= modctx.unitdata[oi];  oi++) {
				if (o.montag) {
					if (-parseInt(unit) == parseInt(o.montag)) {
						ref = ref + Utils.unitRef(o.id) + ', <br />';
					}
				}
			}
		}
	} else {
		ref = Utils.unitRef(unit);
	}
	if (count && count != "0" && count != "1") {
		ref = ref + " x " + String(spellBonus(count, pathlevel1));
	}
	// Marverni gets Iron Boars
	if (parseInt(unit) == 924) {
		ref = ref + '<br/>(' + Utils.unitRef(1808) + ' x ' + String(spellBonus(count, pathlevel1)) + ' for ' + Utils.nationRef(12) + ')';
	}
	return ref;
}

function list_summons(spell, effect) {
	var arr;
	if (effect.effect_number == "76") {
		arr = MSpell.tartarianGate;
	} else if (effect.effect_number == "81" && spell.damage == "43") {
		arr = arr = MSpell.ghostShipArmada;
	} else if (effect.effect_number == "89") {
		arr = MSpell.uniqueSummon[effect.raw_argument];
	} else if (effect.effect_number == "100") {
		arr = MSpell.terrainSummon[effect.raw_argument];
	} else if (effect.effect_number == "114") {
		arr = MSpell.uniqueSummon[effect.raw_argument];
	} else if (effect.effect_number == "120") {
		arr = MSpell.unleashImprisonedOnes;
	}

	if (!arr) {
		arr = [spell.damage];
	}
	//create array of refs
	var tokens = [];
	for (var i=0, uid; uid= arr[i];  i++)
		tokens.push( show_summon(uid, 1) );

	//comma separated & one per line
	return tokens.join(', <br />');
}

MSpell.tartarianGate = [771, 772, 773, 774, 775, 776, 777];
MSpell.yazads = [2620, 2621, 2622, 2623, 2624, 2625];
MSpell.yatas = [2632, 2633, 2634, 2636];
MSpell.dwarfs = [3425, 3426, 3427, 3428];
MSpell.unleashImprisonedOnes = [2498, 2499, 2500];
MSpell.angelichost = [465, 543];
MSpell.hordefromhell = [304, 303];
MSpell.ghostShipArmada = [3348, 3349, 3350, 3351, 3352];

MSpell.uniqueSummon = {
		1:	/* Bind Ice Devil */ [
		    306, 821,  822, 823, 824, 825],
		2:	/* Bind Arch Devil */ [
			305, 826, 827, 828, 829],
		3:	/* Bind Heliophagus */ [
		    492, 818, 819, 820],
		4:	/* King of Elemental Earth */ [
		    906, 469],
		5:	/* Father Illearth */ [
		    470],
		6:	/* Queen of Elemental Water */ [
		    359, 907, 908],
		7:	/* Queen of Elemental Air */ [
		    563, 911, 912],
		8:	/* King of Elemental Fire */ [
		    631, 910],
		9:	/* King of Banefires */ [
		    909],
		10:	/* Bind Demon Lord */ [
		    446, 810, 900, 1405, 2277, 2278],
		11:	/* Awaken Treelord */ [
		    621, 980, 981],
		12:	/* Call Amesha Spenta */ [
		    1375, 1376, 1377, 1492, 1493, 1494],
		13:	/* Summon Tlaloque */ [
		    1484, 1485, 1486, 1487],
		14:	/* Release Lord of Civilization */ [
		    2063, 2065, 2066, 2067, 2064, 2062],
		15:	/* Unknown */ [
		    ],
   	    16:	/* Greater Daeva */ [
   	        2612, 2613, 2614, 2615, 2616, 2617],
   	    17:	/* Balam */ [
   	        2765, 2768, 2771, 2774],
   	   	18:	/* Chaac */ [
   	   	    2778, 2779, 2780, 2781],
   	   	19:	/* Sanguine Heritage */ [
	   	    1019, 1035, 3244, 3245, 3251, 3252, 3253, 3255],
   	   	20:	/* Mandeha */ [
	   	    1748, 3635, 3636]
}

MSpell.terrainSummon = {
		1: /* Hidden in Snow */ [
			1201, 1200, 1202, 1203],
		2: /* Hidden in Sand */ [
			1979, 1978, 1980, 1981],
		3: /* Hidden Underneath */
			[2522, 2523, 2524, 2525]
}

//used in effectlookup
var damage = 		MSpell.format.damage;
var damage_untested = 	function (v,o){ return damage(v,o) + ' ?'; }

MSpell.effectlookup = {
		'unknown': function (spell, effect){ return 'Unknown Effect ' + effect.effect_number + ' ('+effect.raw_argument + ')?'; },
		0:	'Nothing',
		1:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		2:	damage,
		3:	damage,
		4:	damage,
		7:	damage,
		8:	damage,
		10:	function(spell, effect) {
			var mask = modctx.buffs_1_types_lookup;
			return Utils.renderFlags(MSpell.bitfieldValues(effect.raw_argument, mask), 1);
		},
		11:	function(spell, effect) {
			var mask = modctx.special_damage_types_lookup;
			return Utils.renderFlags(MSpell.bitfieldValues(effect.raw_argument, mask), 1);
		},
		13:	damage,
		15:	'teleports to capital',
		17: damage,
		19:	'teleport',
		20:	damage,
		21:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		22:	'Fate of Oedipus',
		23:	function(spell, effect) {
			var mask = modctx.buffs_2_types_lookup;
			return Utils.renderFlags(MSpell.bitfieldValues(effect.raw_argument, mask), 1);
		},
		24:	damage,
		25:	'Wish',
		26:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		27:	'magic duel',
		28:	'lose commander status',
		29:	'retain commander status',
		30:	damage,
		31:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		32:	damage,
		33:	damage,
		35:	function(spell, effect) {
			return spellBonus(spell.effects_count, spell.pathlevel1);
		},
		37:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1, spell.id);
		},
		38:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		39:	damage,
		40:	damage,
		41:	damage,
		42:	function (spell, effect) {
			if (modctx.anon_province_events_lookup[effect.raw_argument]) {
				return modctx.anon_province_events_lookup[effect.raw_argument].name;
			} else {
				return "Unknown";
			}

		},
		43:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		44:	damage,
		46:	damage,
		48:	function(spell, effect) {
			return {
				0: Format.Gems('F')	,
				1: Format.Gems('A')	,
				2: Format.Gems('W')	,
				3: Format.Gems('E')	,
				4: Format.Gems('S')	,
				5: Format.Gems('D')	,
				6: Format.Gems('N')	,
				7: Format.Gems('G')	,
				8: Format.Gems('B')	,
				9: Format.Gems('H')	,
				51: Format.Gems('FAWE')	,
				55: Format.Gems('FAWESDNBH'),
				5760: Format.Gems('EFWD')
				}[effect.raw_argument] || {
					'invalid damage value': 		effect.raw_argument
				};
		},
		49:	"Wind Ride",
		50:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		53:	damage_untested,
		54:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		57:	'Mind Hunt',
		62:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		63:	damage_untested,
		64:	damage_untested,
		66: damage,
		67: damage,
		68:	damage_untested,
		70:	damage_untested,
		72:	damage,
		73:	damage,
		74:	damage,
		75:	damage,
		76:	function (spell, effect) {
			return list_summons(spell, effect);
		},
		77:	damage_untested,
		79:	damage_untested,
		80:	damage_untested,
		81:	function (spell, effect) {
			if (effect.effect_number == "81" && spell.damage == "43") {
				return list_summons(spell, effect);
			}
			if (modctx.enchantments_lookup[effect.raw_argument]) {
				return modctx.enchantments_lookup[effect.raw_argument].name;
			} else {
				return "Unknown";
			}
		},
		82:	function (spell, effect) {
			if (modctx.enchantments_lookup[effect.raw_argument]) {
				return modctx.enchantments_lookup[effect.raw_argument].name;
			} else {
				return "Unknown";
			}
		},
		84:	function (spell, effect) {
			if (modctx.enchantments_lookup[effect.raw_argument]) {
				return modctx.enchantments_lookup[effect.raw_argument].name;
			} else {
				return "Unknown";
			}
		},
		85:	damage_untested,
		86:	damage_untested,
		89:	function (spell, effect) {
			return list_summons(spell, effect);
		},
		90:	damage_untested,
		91:	damage,
		92:	damage_untested,
		93:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		94:	damage_untested,
		95:	damage_untested,
		96:	damage,
		97:	damage,
		98:	damage_untested,
		99:	damage,
		100:	function (spell, effect) {
			return list_summons(spell, effect);
		},
		101:	damage,
		102:	damage_untested,
		103:	damage,
		104:	damage,
		105:	damage_untested,
		106:	damage_untested,
		107:	damage,
		108:	damage_untested,
		109:	damage,
		110:	damage_untested,
		111:	damage,
		112:	damage_untested,
		113:	damage_untested,
		114:	function (spell, effect) {
			return list_summons(spell, effect);
		},
		115:	'Acashic Record',
		116:	damage_untested,
		117:	damage_untested,
		118:	damage_untested,
		119:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		120:	function (spell, effect) {
			return list_summons(spell, effect);
		},
		130:	function(spell, effect) {
			return show_summon(effect.raw_argument);
		},
		134:	damage,
		137:	function(spell, effect) {
			return show_summon(effect.raw_argument, spell.effects_count, spell.pathlevel1);
		},
		138:	damage,
		139:	damage,
		141:	function(spell, effect) {
			return show_summon(effect.raw_argument, 2, spell.pathlevel1);
		},
		142:	damage,
		147:	damage,
		153:	damage,
		160:	damage,
		161:	damage,
}



//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
