//namespace scope
(function( DMI, $, undefined ){

var MAffliction = DMI.MAffliction = DMI.MAffliction || {};

var Utils = DMI.Utils
var sum = Utils.sum;
var mult = Utils.mult;
var negative = Utils.negative;
var normalise = Utils.normalise;
var roundup = Utils.roundup;

MAffliction.lookup = MAffliction.data = {
	'Diseased': {
		descr: 'Never heals, loses one HP each month and gets additional afflictions.',
		afflictUnit: function(u) {}
	},
	'Eyeloss': {
		descr: 'Att -2, Def -2, Prec -3.<br />Blindness (Att 0, Def 0, Prec 0) if no eyes left.',
		afflictUnit: function(u, fn_bonus) {
			fn_bonus( 'affliction', 'att', -2 );
			fn_bonus( 'affliction', 'def', -2 );
			fn_bonus( 'affliction', 'prec', -2 );
		}
	},
	'Blindness': {
		descr: 'Att 0, Def 0, Prec 0',
		afflictUnit: function(u, fn_bonus) {
			if (!Utils.is( u.blind )) {
				fn_bonus( 'affliction', 'att', negative(u.att) );
				fn_bonus( 'affliction', 'def', negative(u.def) );
				fn_bonus( 'affliction', 'prec',negative(u.prec) );
			}
		}
	},
	'Weakened': {
		descr: 'Str -4',
		afflictUnit: function(u, fn_bonus) {
			// u.str = normalise( sum(u.str, -4));
		}
	},
	'Chest Wound': {
		descr: 'Enc +5, Str -1',
		afflictUnit: function(u, fn_bonus) {
			fn_bonus( 'affliction', 'enc', 5 );
			fn_bonus( 'affliction', 'str', -1 );
		}
	},
	'Limp': {
		descr: 'Halves AP, Att -1, Def -1',//While the tooltip says AP -4, it appears to halve the unit's APs.
		afflictUnit: function(u, fn_bonus) {
			fn_bonus( 'affliction', 'ap', roundup(negative(mult(u.ap,0.5))) );
			fn_bonus( 'affliction', 'att', -1 );
			fn_bonus( 'affliction', 'def', -1 );
			// u.ap = roundup( mult(u.ap, 0.5) );
			// u.att = normalise( sum(u.att, -1));
			// u.def = normalise( sum(u.def, -1));
		}
	},
	'Crippled': {
		descr: 'AP 2, Att -4, Def -4',
		afflictUnit: function(u, fn_bonus) {
			fn_bonus( 'affliction', 'ap', sum(2, negative( u.ap )) );
			fn_bonus( 'affliction', 'att', -4 );
			fn_bonus( 'affliction', 'def', -4 );
			// u.ap = (parseInt(u.ap || '0') > 2)  ?  '2'  :  u.ap;
			// u.att = normalise( sum(u.att, -4));
			// u.def = normalise( sum(u.def, -4));
		}
	},
	'Never Healing Wound': {
		descr: '20 percent HP reduction.',
		afflictUnit: function(u) {
			// u.hp = roundup( mult(u.hp, 0.8) );
		}
	},
	'Mute': {
		descr: 'Ldr divided by four, halved magic skills.',
		afflictUnit: function(u) {
			// u.ldr_n = roundup( mult(u.ldr_n, 0.25));
			// u.ldr_m = roundup( mult(u.ldr_m, 0.25));
			// u.ldr_u = roundup( mult(u.ldr_u, 0.25));
			// u.F = roundup( mult(u.F, 0.5));
			// u.A = roundup( mult(u.A, 0.5));
			// u.W = roundup( mult(u.W, 0.5));
			// u.E = roundup( mult(u.E, 0.5));
			// u.S = roundup( mult(u.S, 0.5));
			// u.D = roundup( mult(u.D, 0.5));
			// u.N = roundup( mult(u.N, 0.5));
			// u.B = roundup( mult(u.B, 0.5));
			// u.H = roundup( mult(u.H, 0.5));
		}
	},
	'Battle Fright': {
		descr: '(Morale -5)',
		afflictUnit: function(u) {
			// u.mor = normalise( sum(u.mor, -5));
		}
	},
	'Feeble Minded': {
		descr: 'Att -1, Def -1, Prec -1, MR -5, Ldr divided by four, magic skill 0.',
		afflictUnit: function(u) {
			// u.att = normalise( sum(u.att, -1));
			// u.def = normalise( sum(u.def, -1));
			// u.prec = normalise( sum(u.prec, -1));
			// u.mr = normalise( sum(u.mr, -5));
			// u.ldr_n = roundup( mult(u.ldr_n, 0.25));
			// u.ldr_m = roundup( mult(u.ldr_m, 0.25));
			// u.ldr_u = roundup( mult(u.ldr_u, 0.25));
			// u.F = u.A = u.W = u.E = u.S = u.D = u.N = u.B = u.H = '0';
		}
	},
	'Armloss': {
		descr: 'Str -1, loss of a hand slot.',
		afflictUnit: function(u) {
			// u.str = normalise( sum(u.str, -1));
		}
	},
	'Headloss':{
		descr: 'loss of a head slot. no heads means death for [i]most[/i] creatures',
		afflictUnit: function(u) {}
	}
},


MAffliction.renderOverlay = function(o) {
	//template
	var h=''
	h+='<div class="affliction overlay-contents"> ';

	//header
	h+='	<div class="overlay-header"> ';
	h+='		<p style="float:right;">Affliction</p>';
	h+='		<h2>'+o.name+'</h2> ';

	//body
	h+='	</div>';
	h+='	<div class="overlay-main">';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';
	h+='		<p>'+o.descr+'</p>';
	h+='	</div>';
	h+='</div>';
	return h;
}

//attach some shitz to data objects to make them work
for (var k in MAffliction.data)  {
	var o = MAffliction.data[k];

	o.id = k.toLowerCase();
	MAffliction.data[o.id] = o;


	o.name = k;
	o.renderOverlay = MAffliction.renderOverlay;
}
DMI.modctx.afflictionlookup = MAffliction.lookup;





//namespace args
}( window.DMI = window.DMI || {}, jQuery ));

