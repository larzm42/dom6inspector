//namespace scope
(function( DMI, $, undefined ){


DMI.propertyAliases =  {
	//units
	weapon: 'weapons',
	mindless: 'mind',
	lifeless: 'inanimate',
	coldblooded: 'coldblood',
	glamour: 'illusion',
	stealth: 'stealthy',
	pillage: 'pillagebonus',
	patrol: 'patrolbonus',
	siege: 'siegebonus',
	supply: 'supplybonus',
	wastelandsurvival: 'wastesurvival',
	amphibian: 'amphibious',
	fly: 'flying',
	flight: 'flying',
	stormimmunity: 'stormimmune',
	stormflying: 'stormimmune',
	noeat: 'neednoteat',
	neverheals: 'noheal',
	map: 'mapmove',
	sacred: 'holy',
	//ap: 'ap',

	//weapons
	'2h': 'twohanded',
	res: 'rcost',
	damage: 'dmg',
	attacks: 'nratt',
	num: 'nratt',
	//ap: 'armorpiercing',
	an: 'armornegating',

	cap: 'dt_cap',
	max1hp: 'dt_cap',
	'1hp': 'dt_cap',
	stun: 'dt_stun',
	paralyze: 'dt_paralyze',
	poison: 'dt_poison',
	demon: 'dt_demon',
	'2xdemon': 'dt_demon',
	demononly: 'dt_demononly',
	holy: 'dt_holy',
	'2xmagic': 'dt_magic',
	small: 'dt_small',
	'3xsmall': 'dt_small',
	large: 'dt_large',
	'2xlarge': 'dt_large',
	enslave: 'dt_slave',
	raise: 'dt_raise',
	'2xlifeless': 'dt_constructonly',
	'2xlifeless': 'dt_constr',
	magiconly: 'dt_magiconly',
	nomind: 'mind',

	//items
	quick: 'quickness',
	reanimh: 'reanimH',
	reanimd: 'reanimD'
}

			
		
DMI.modconstants = {
	eracodes: { 1:'EA', 2:'MA', 3:'LA' },
	eranames: { 1:'early era', 2:'middle era', 3:'late era' },
	
	pathkeys: ['F', 'A', 'W', 'E', 'S', 'D', 'N', 'G', 'B', 'H'],
	pathkeynames: { 
		A:'Air', 
		B:'Blood', 
		D:'Death', 
		E:'Earth', 
		F:'Fire', 
		N:'Nature', 
		S:'Astral', 
		W:'Water', 
		H:'Priest',
		G:'Glamour',
		
		U:'Random',
		FAWE:'Elemental',
		SDNB:'Sorcery',  
		FAWESDNBH:'All'
	},	
	//magic path numbers
	10: {
		0: 'F',
		1: 'A',
		2: 'W',
		3: 'E',
		4: 'S',
		5: 'D',
		6: 'N',
		7: 'G',
		8: 'B',
		9: 'H',
		
		50: 'U',
		51: 'FAWE',
		52: 'SDNB',
		53: 'FAWESDNBH',
		57: 'FAWESDNBH'     /*???????????*/  //CB1.92 has this on rooted treant path bonus
	},
	
	//path masks
	11: {
		128: 'F',
		256: 'A',
		512: 'W',
		1024: 'E',
		2048: 'S',
		4096: 'D',
		8192: 'N',
		16384: 'G',
		32768: 'B',
		65536: 'H'
	},
	
	
	//magic schools
	15: {
		'-1': 'unresearchable',
		0: 'Conjuration',
		1: 'Alteration',
		2: 'Evocation',
		3: 'Construction',
		4: 'Enchantment',
		5: 'Thaumaturgy',
		6: 'Blood',
		7: 'Divine'
	},
	
		

	//magic paths
	16: {
		'-1': '',
		0: 'F',
		1: 'A',
		2: 'W',
		3: 'E',
		4: 'S',
		5: 'D',
		6: 'N',
		7: 'G',
		8: 'B',
		9: 'H',
		255: ''
	},
	
	//magic paths
	pathnames: {
		'-1': '',
		0: 'Fire',
		1: 'Air',
		2: 'Water',
		3: 'Earth',
		4: 'Astral',
		5: 'Death',
		6: 'Nature',
		7: 'Glamour',
		8: 'Blood',
		9: 'Holy',
		255: ''
	},
	
	//Item types
	19: {
		1: "1-h wpn",
		2: "2-h wpn",
		3: "missile",
		4: "shield",
		5: "armor",
		6: "helm",
		7: "boots",
		8: "misc",
		9: "crown",
		10: "barding"
	},
	
	//spell effects
	17: {
		//combat
		1: 'Summon monster',
		2: 'Damage spell',
		3: 'Stun damage',
		7: 'Poison damage',
		13: 'Healing',
		20: 'Blink',
		24: 'Holy damage',
		28: 'Enslave',
		29: 'Charm',
		31: 'Summon independent',
		43: 'Border summon',
		73: 'Anti magic damage',
		103: 'Drain life',
	
		//rituals
		10001: 'Summon monster',
		10019: 'Teleport',
		10021: 'Summon commander',
		10035: 'Crossbreed',
		10037: 'Farsummon',
		10038: 'Indep. farsummon',
		10039: 'Gift of Reason',
		10050: 'Assassination',
		10063: 'Build fort',
		10077: 'Army teleport'
	},

	spelleffectflags: {
		'Strength adds': 1,
		'2': 2,
		'4': 4,
		'Works on Demons (only)*': 8,
		'Works on Magic Beings (only)*': 16,
		'Fire Based': 32,
		'Armor Piercing (documented)': 64,
		'Armor Negating (documented)': 128,
		'256': 256,
		'Cold Based': 512,
		'1024': 1024,
		'Shock Based': 2048,
		'Magic Resistance Negates': 4096,
		'Not vs. Inanimates? Damage Type = Poison? ': 8192,
		'Ignore default damage type?': 16384,
		'Only vs. Sacred.': 32768,
		'Not vs Amphibians?': 65536,
		'Not vs. Mindless?': 131072,
		'Only affects Hostile': 262144,
		'Not vs. Undead': 524288,
		'Resisted by Defense Skill?': 1048576,
		'Physical damage?': 2097152,
		'Only affects Friendly': 4194304,
		'Works underwater.': 8388608,
		'MRN Easily': 16777216,
		'*ONLY* under water.': 33554432,
		'Works on Undead (only)*.': 67108864,
		'134217728': 134217728,
		'Remote province targeting?': 268435456,
		'Mysterious': 536870912,
		'Bloodletting': 1073741824,
		'2147483648': 2147483648
	},

	//site location masks
	20: {	
		1:	'Plain',
		2:	'Forest',
		4:	'Mountain',
		8:	'Waste',
		16:	'Farm',
		32:	'Sea',
		64:	'Coast',
		128:	'Swamp',
		256:	'Deep sea',
		512:	'Cave',
		1024:	'Border mountain',
		16384:	'Unique'
	},
	
	//fort numbers
	28: {
		1: 'Simple Hillfort',
		2: 'Simple Fortress',
		3: 'Fortified City',
		4: 'Tel City',
		5: 'Swamp City',
		6: 'Peg Castle',
		7: 'Motte-and-Bailey',
		8: 'Citadel',
		9: 'Mountain Citadel',
		10: 'Simple Fortress',
		11: 'Swamp Fort',
		12: 'Kelp Fortress',
		13: 'Kelp Citadel',
		14: 'Dark Citadel',
		15: 'Cave City',
		16: 'Cave Castle',
		17: 'Wizard\'s Tower',
		18: 'Dark Citadel (underwater)',
		19: 'Living Castle',
		20: 'River Fortress',
		21: 'Jervellan Wall',
		22: 'Archaic Fortress',
		23: 'Firbolg Fortress',
		24: 'Crystal Citadel',
		25: 'Obsidian Citadel',
		26: 'Dead City',
		27: 'Ermorian Castle',
		28: 'Ermorian Citadel',
		29: 'Woodland Citadel',
		30: 'Cave Fort',
		31: 'Great City',
		32: 'Ramparts',
		33: 'Forest Ramparts',
		34: 'Forest Fortress',
		35: 'Forest Castle',
		36: 'Hillfort',
		37: 'Hill Fortress',
		38: 'Hill Castle',
		39: 'Fortification',
		40: 'Fortress',
		41: 'Castle',
		42: 'Mountain City',
		43: 'Jeweled City'
	}
	

}


//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
