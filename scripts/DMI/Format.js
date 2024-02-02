//namespace scope
(function( DMI, $, undefined ){

//namespace children
var Format = DMI.Format = DMI.Format || {};
var GridFormat = DMI.GridFormat = DMI.GridFormat || {};


//preload icons
var _preloaded = [];
function preload(src) { var img = new Image(); _preloaded.push(img); img.src = src; }
preload( "images/abilityicons/holy.png" );

preload( "images/magicicons/Path_A.png" );
preload( "images/magicicons/Path_F.png" );
preload( "images/magicicons/Path_W.png" );
preload( "images/magicicons/Path_E.png" );
preload( "images/magicicons/Path_S.png" );
preload( "images/magicicons/Path_N.png" );
preload( "images/magicicons/Path_D.png" );
preload( "images/magicicons/Path_B.png" );
preload( "images/magicicons/Path_G.png" );

preload( "images/magicicons/Path_H.png" );
preload( "images/magicicons/Path_U.png" );
preload( "images/magicicons/Path_R.png" );

preload( "images/magicicons/Gem_A.png" );
preload( "images/magicicons/Gem_F.png" );
preload( "images/magicicons/Gem_W.png" );
preload( "images/magicicons/Gem_E.png" );
preload( "images/magicicons/Gem_S.png" );
preload( "images/magicicons/Gem_N.png" );
preload( "images/magicicons/Gem_D.png" );
preload( "images/magicicons/Gem_B.png" );
preload( "images/magicicons/Gem_G.png" );

preload( "scripts/slickgrid/images/sort-asc.gif" );
preload( "scripts/slickgrid/images/sort-desc.gif" );
preload( "scripts/slickgrid/css/smoothness/images/ui-bg_glass_75_e6e6e6_1x400.png" );

preload( "images/PinPageTrns.png" );
preload( "images/PinPageTrnsClose.png" );


//path icons
Format.Paths = function(value) {
	if (!value) return '';
	return value.replace(/([A-W])/g, '<span class="pathicon Path_$1">$1</span>');
}
GridFormat.Paths = function(row, cell, value, columnDef, dataContext) {
	if (!value) return '';
	return value.replace(/([A-W])/g, '<span class="pathicon Path_$1">$1</span>');
}
Format.Booster = function(value) {
	if (!value) return '';
	return value.replace(/\d/,'+').replace(/([A-W])/g, '<span class="pathicon Path_$1">$1</span>');
}
GridFormat.Booster = function(row, cell, value, columnDef, dataContext) {
	if (!value || value =='0') return '';
	return value.replace(/\d/,'+').replace(/([A-W])/g, '<span class="pathicon Path_$1">$1</span>');
}
GridFormat.OrderedPaths = function(row, cell, value, columnDef, dataContext) {
	if (!value) return '';
	value = value.replace(/U\d*/, function(s){return DMI.Utils.rndMagicRef(Math.floor(dataContext.id), s);})
	// return value.replace(/([A-W])/g, '<img alt="$1" class="pathicon Path_$1" src="images/magicicons/Path_$1.png" />').slice(1);
	return value.replace(/([A-W])/g, '<span class="pathicon Path_$1">$1</span>').slice(1);
}


//gem icons
Format.Gems = function(value) {
	if (!value) return '';
	return value.replace(/([A-W])/g, '<span class="gemicon Gem_$1">$1</span>');
}
GridFormat.Gems = function(row, cell, value, columnDef, dataContext) {
	if (!value) return '';
	return value.replace(/([A-W])/g, '<span class="gemicon Gem_$1">$1</span>');
}
GridFormat.OrderedGems = function(row, cell, value, columnDef, dataContext) {
	if (!value) return '';
	value = value.replace(/U\d*/, function(s){return DMI.Utils.rndMagicRef(Math.floor(dataContext.id), s);})
	// return value.replace(/([A-W])/g, '<img alt="$1" class="pathicon Path_$1" src="images/magicicons/Path_$1.png" />').slice(1);
	return value.replace(/([A-W])/g, '<span class="gemicon Gem_$1">$1</span>').slice(1);
}

//render a named ability icon
Format.AbilityIcon = function(name, title) {
	return '<span class="abilityicon '+name+'" title="'+title+'">&nbsp;</span>';
}

//simple functions for formatting values
Format.Percent = function(v) {
	v = String(v);
	if (v=='0') return v;

	if (v.indexOf('%') == -1) {
		return v+ '%';
	}
	return v;
};
Format.Signed = function(v) {
	v = String(v);
	if (v=='0') return v;
	if (v.charAt(0)=='-') return v;
	return '+'+v;
};
Format.SignedZero = function(v) {
	v = String(v);
	if (v.charAt(0)=='-') return v;
	return '+'+v;
};
Format.SignedPercent = function(v) {
	v = String(v);
	if (v=='0') return v;
	if (v.charAt(0)=='-') return v+ '%';
	return '+' +v+ '%';
};
Format.SignedPercentDiv = function(v) {
	v = String(v);
	if (v=='0') return v;
	if (v.charAt(0)=='-') return parseInt(v)/100 + '%';
	return '+' +parseInt(v)/100+ '%';
};
Format.PerTurn = function(v) {
	v = String(v);
	if (v=='0') return v;
	return v+ ' per month';
};
Format.SignedPerTurn = function(v) {
	v = String(v);
	if (v=='0') return v;
	if (v.charAt(0)=='-') return v+ ' per month';
	return '+' +v+ ' per month';
};
Format.PerBattle = function(v) {
	v = String(v);
	if (v=='0') return v;
	return v+ ' per battle';
};

//namespace args
}( window.DMI = window.DMI || {}, jQuery ));

