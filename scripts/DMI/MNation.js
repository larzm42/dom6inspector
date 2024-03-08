//namespace scope
(function( DMI, $, undefined ){

var MSite = DMI.MSite = DMI.MSite || {};
var MNation = DMI.MNation = DMI.MNation || {};
var MUnit = DMI.MUnit = DMI.MUnit || {};

var Format = DMI.Format;
var Utils = DMI.Utils;

var modctx = DMI.modctx;
var modconstants = DMI.modconstants;


MNation.initNation = function(o) {
	o.foreignunits = [];
	o.forestrec = [];
	o.forestcom = [];
	o.mountainrec = [];
	o.mountaincom = [];
	o.swamprec = [];
	o.swampcom = [];
	o.wasterec = [];
	o.wastecom = [];
	o.caverec = [];
	o.cavecom = [];
	o.coastrec = [];
	o.coastcom = [];
	o.plainsrec = [];
	o.plainscom = [];
	o.landunit = [];
	o.landcom = [];
	o.capunits = [];
	o.capcommanders = [];
	o.futurecapunits = [];
	o.futurecapcommanders = [];
	o.pretenders = [];
	o.commanders = [];
	o.foreigncommanders = [];
	o.units = [];
	o.heroes = [];
	o.multiheroes = [];
	o.uwunit = [];
	o.uwcom = [];
	o.sites = [];
	o.futuresites = [];
	o.spells = [];
	o.homerealm = [];
	o.addgod = [];
	o.delgod = [];
}
MNation.prepareData_PreMod = function() {
	for (var oi=0, o;  o= modctx.nationdata[oi];  oi++) {

		o.pretenders = [];
		o.commanders = [];
		o.foreigncommanders = [];
		o.units = [];
		o.foreignunits = [];
		o.sites = [];
		o.futuresites = [];
		o.forestrec = [];
		o.forestcom = [];
		o.mountainrec = [];
		o.mountaincom = [];
		o.swamprec = [];
		o.swampcom = [];
		o.wasterec = [];
		o.wastecom = [];
		o.caverec = [];
		o.cavecom = [];
		o.coastcom = [];
		o.coastrec = [];
		o.plainsrec = [];
		o.plainscom = [];
		o.uwcom = [];
		o.uwunit = [];
		o.landcom = [];
		o.landunit = [];
		o.heroes = [];
		o.multiheroes = [];
		o.spells = [];
		o.addgod = [];
		o.delgod = [];
		// Get realms of nation
		var realms = [];
		for (var oj=0, attr; attr = modctx.attributes_by_nation[oj];  oj++) {
			if (parseInt(attr.nation_number) == o.id) {
				//var attribute = modctx.attributes_lookup[parseInt(attr.attribute_record_id)];
				if (attr.attribute == "289") {
					realms.push(attr.raw_value);
				}
			}
		}
		o.homerealm = realms;
	}
}

MNation.prepareData_PostMod = function() {
	var disableold = modctx.disableoldnations;
	if (!disableold) {
		for (var oi=0, o;  o= modctx.nationdata[oi];  oi++) {
			if (o.disableoldnations) {
				disableold = true;
				continue;
			}
		}
	}

	if (disableold) {
		for (var oi=modctx.nationdata.length-1, o;  o= modctx.nationdata[oi];  oi--) {
			o.id = parseInt(o.id);

			if (disableold && o.id < 100) {
				modctx.nationdata.splice(oi, 1);
			}
		}
	}

	for (var oi=0, o;  o= modctx.nationdata[oi];  oi++) {
		o.id = parseInt(o.id);

		o.renderOverlay = MNation.renderOverlay;

		o.eracode = modconstants.eracodes[o.era];
		o.shortname = o.eracode+' '+o.name;
		o.fullname = o.eracode+' '+o.name+' - '+o.epithet;

		// Get realms of nation
		var realms = [];
		for (var oj=0, attr; attr = modctx.attributes_by_nation[oj];  oj++) {
			if (parseInt(attr.nation_number) == o.id) {
				if (attr.attribute == "289") {
					realms.push(attr.raw_value);
				}
			}
		}
		if (o.homerealm) {
			realms = realms.concat(o.homerealm);
		}

		// get monsters in realm
		for (var oj=0, attr; attr = modctx.realms[oj];  oj++) {
			for (var ok=0, realm; realm = realms[ok]; ok++) {
				if (parseInt(attr.realm) == parseInt(realm)) {
					o.pretenders.push(attr.monster_number);
				}
			}
		}
		o.homerealm = realms;

		// look for added pretenders
		if (!o.cleargods) {
			for (var oj=0, attr; attr = modctx.pretender_types_by_nation[oj];  oj++) {
				if (parseInt(attr.nation_number) == o.id) {
					if (attr.monster_number != 134) { // Why is royal guard marked as pretender?
						o.pretenders.push(attr.monster_number);
					}
				}
			}
		}
		if (o.addgod) {
			o.pretenders = o.pretenders.concat(o.addgod);
		}

		// look for deleted pretenders
		for (var oj=0, attr; attr = modctx.unpretender_types_by_nation[oj];  oj++) {
			if (parseInt(attr.nation_number) == o.id) {
				for (var ok=0, pret; pret = o.pretenders[ok]; ok++) {
					if (parseInt(pret) == parseInt(attr.monster_number)) {
						o.pretenders.splice(ok, 1);
						ok--;
					}
				}
			}
		}
		if (o.delgod) {
			o.pretenders = o.pretenders.filter(function(item) {
			    return o.delgod.indexOf(item) === -1;
			});
		}

		// look for commanders
		for (var oj=0, attr; attr = modctx.fort_leader_types_by_nation[oj];  oj++) {
			if (parseInt(attr.nation_number) == o.id) {
				o.commanders.push(attr.monster_number);
			}
		}

		// look for foreign commanders
		for (var oj=0, attr; attr = modctx.nonfort_leader_types_by_nation[oj];  oj++) {
			if (parseInt(attr.nation_number) == o.id) {
				o.foreigncommanders.push(attr.monster_number);
			}
		}

		// look for units
		for (var oj=0, attr; attr = modctx.fort_troop_types_by_nation[oj];  oj++) {
			if (parseInt(attr.nation_number) == o.id) {
				o.units.push(attr.monster_number);
			}
		}

		// look for foreign units
		for (var oj=0, attr; attr = modctx.nonfort_troop_types_by_nation[oj];  oj++) {
			if (parseInt(attr.nation_number) == o.id) {
				o.foreignunits.push(attr.monster_number);
			}
		}

		// look for coast commanders
		for (var oj=0, attr; attr = modctx.coast_leader_types_by_nation[oj];  oj++) {
			if (parseInt(attr.nation_number) == o.id) {
				var unit = modctx.unitlookup[attr.monster_number];
				if (unit.landshape) {
					o.coastcom.push(parseInt(unit.landshape));
				} else {
					o.coastcom.push(attr.monster_number);
				}
			}
		}

		// look for coast units
		for (var oj=0, attr; attr = modctx.coast_troop_types_by_nation[oj];  oj++) {
			if (parseInt(attr.nation_number) == o.id) {
				var unit = modctx.unitlookup[attr.monster_number];
				if (unit.landshape) {
					o.coastrec.push(parseInt(unit.landshape));
				} else {
					o.coastrec.push(attr.monster_number);
				}
			}
		}

		for (var oj=0, attr; attr = modctx.attributes_by_nation[oj];  oj++) {
			if (parseInt(attr.nation_number) == o.id) {
				if (attr.attribute == "52" || attr.attribute == "100" || attr.attribute == "25") {
					o.sites.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "631") {
					o.futuresites.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "158" || attr.attribute == "159" || attr.attribute == "739") {   // 739 = coastal forts
					var unit = modctx.unitlookup[attr.raw_value];
					if (unit.landshape) {
						o.coastcom.push(parseInt(unit.landshape));
					} else {
						o.coastcom.push(parseInt(attr.raw_value));
					}
				}
				if (attr.attribute == "160" || attr.attribute == "161" || attr.attribute == "162" || attr.attribute == "738") {  // 738 = coastal forts
					var unit = modctx.unitlookup[attr.raw_value];
					if (unit.landshape) {
						o.coastrec.push(parseInt(unit.landshape));
					} else {
						o.coastrec.push(parseInt(attr.raw_value));
					}
				}
				if (attr.attribute == "163") {
					o.landcom.push(parseInt(attr.raw_value));
				}
				if (
					attr.attribute == "186") {
					var unit = modctx.unitlookup[attr.raw_value];
					if (unit.watershape) {
						o.uwcom.push(parseInt(unit.watershape));
					} else {
						o.uwcom.push(parseInt(attr.raw_value));
					}
				}
				if (attr.attribute == "187" ||
					attr.attribute == "189" ||
					attr.attribute == "190" ||
					attr.attribute == "191" ||
					attr.attribute == "213") {
					var unit = modctx.unitlookup[attr.raw_value];
					if (unit.watershape) {
						o.uwunit.push(parseInt(unit.watershape));
					} else {
						o.uwunit.push(parseInt(attr.raw_value));
					}
				}
				if (attr.attribute == "294" || attr.attribute == "412") {
					o.forestrec.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "295" || attr.attribute == "413") {
					o.forestcom.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "296") {
					o.swamprec.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "297") {
					o.swampcom.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "298" || attr.attribute == "408") {
					o.mountainrec.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "299" || attr.attribute == "409") {
					o.mountaincom.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "300" || attr.attribute == "416") {
					o.wasterec.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "301" || attr.attribute == "417") {
					o.wastecom.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "302") {
					o.caverec.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "303") {
					o.cavecom.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "404" || attr.attribute == "406") {
					o.plainsrec.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "405" || attr.attribute == "407") {
					o.plainscom.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "139" ||
					attr.attribute == "140" ||
					attr.attribute == "141" ||
					attr.attribute == "142" ||
					attr.attribute == "143" ||
					attr.attribute == "144") {
					o.heroes.push(parseInt(attr.raw_value));
				}
				if (attr.attribute == "145" ||
					attr.attribute == "146" ||
					attr.attribute == "149") {
					o.multiheroes.push(parseInt(attr.raw_value));
				}
                if (attr.attribute == "689") {  // this is for Muspelheim
					o.commanders.push(parseInt(attr.raw_value));
                }
                if (attr.attribute == "688") {  // this is for Muspelheim
					o.units.push(parseInt(attr.raw_value));
                }
			}
		}

		//associate spells
		//national spells already listed themselves in o.spells
		//now we need to set nation details on the spells
		for (var si=0, s; s= o.spells[si]; si++) {
			s.nations = s.nations || {};
			s.nations[o.id] = o;
			s.eracodes = s.eracodes || {};
			s.eracodes[o.eracode] = true;

			//nationname
			var ncount=0; for (var k in s.nations) ncount++;
			if (ncount == 1)
				s.nationname = o.shortname;
			else
				s.nationname = 'various ('+ncount+')';

			//set nation value on summoned units
			var spell = s;
			do {
				var arr = spell.summonsunits || [];
				for (var i=0, u; u= arr[i]; i++) {
//					var basekey;
//					if (u.typeclass == 'Unit') {
//						basekey = 'unit (Summon)';
//					} else {
//						basekey = 'cmdr (Summon)';
//					}
//					if (u.typechar && u.typechar!=basekey) {
//						//find pretender version of this unit
//						u = modctx.getUnitOfType(u, basekey) || modctx.cloneUnit(u);
//					}
//					u.typechar = basekey;

					u.nations = u.nations || {};
					u.nations[o.id] = o;
					u.eracodes = u.eracodes || {};
					u.eracodes[o.eracode] = true;

					//nationname
					var ncount=0; for (var k in u.nations) ncount++;
					if (ncount == 1)
						u.nationname = o.shortname;
					else
						u.nationname = 'various ('+ncount+')';

					var otherList = [];
					var other = u;
					otherList.push(other);
					while (other = modctx.unitlookup[other.secondshape || other.shapechange || other.forestshape]) {
						if (otherList.indexOf(other) != -1) {
							break;
						}
						otherList.push(other);
						other.typechar = u.typechar;

						other.nations = other.nations || {};
						other.nations[o.id] = o;
						other.eracodes = other.eracodes || {};
						other.eracodes[o.eracode] = true;

						//nationname
						var ncount=0; for (var k in other.nations) ncount++;
						if (ncount == 1)
							other.nationname = o.shortname;
						else
							other.nationname = 'various ('+ncount+')';
					}
				}
				if ( spell == spell.nextspell ) break; // avoid infinite loop
			} while (spell = spell.nextspell);
		}

		//associate pretenders
 		var basekey = 'Pretender';
		Utils.arrayUnique(o.pretenders);
		var arr = o.pretenders;
		for (var i=0; i<arr.length; i++) {
			if (!arr[i]) continue;
			var u = modctx.unitlookup[arr[i]];
			if (!u) {
				console.log(basekey+' '+arr[i]+' not found (nation '+o.id+')');
				continue;
			}
			if (u.typechar && u.typechar!=basekey) {
				//find pretender version of this unit
				u = modctx.getUnitOfType(u, basekey) || modctx.cloneUnit(u);
			}
			u.typechar = basekey;
			u.nations = u.nations || {};
			u.nations[o.id] = o;
			u.eracodes = u.eracodes || {};
			u.eracodes[o.eracode] = true;

			for (var oj=0, attr; attr = modctx.attributes_by_nation[oj];  oj++) {
				if (parseInt(attr.nation_number) == o.id) {
					//var attribute = modctx.attributes_lookup[parseInt(attr.attribute_record_id)];
					if (attr.attribute == "314") {
						if (u.id == attr.raw_value) {
							u.cheapgod20 = u.cheapgod20 || [];
							u.cheapgod20.push(o);
						}
					}
					if (attr.attribute == "315") {
						if (u.id == attr.raw_value) {
							u.cheapgod40 = u.cheapgod40 || [];
							u.cheapgod40.push(o);
						}
					}
				}
			}
		}

		//units from sites
 		o.capunits = [];
		o.capcommanders = [];
 		o.futurecapunits = [];
		o.futurecapcommanders = [];

		var basekey = 'site';
		var arr = o.sites;
		var gemkeys = {F:0,A:0,W:0,E:0,S:0,D:0,N:0,B:0};
		for (var i=0; i<arr.length; i++) {
			if (!arr[i]) continue;
			var s = modctx.sitelookup[arr[i]];
			if (!s) {
				console.log(basekey+' '+arr[i]+' not found (nation '+o.id+')');
				continue;
			}
			o.capunits = o.capunits.concat(s.units, s.hmon, s.mon);
			o.capcommanders = o.capcommanders.concat(s.commanders, s.hcom);
			for (k in gemkeys) {
				if (s[k])
				gemkeys[k] += parseInt(s[k]);
			}
		}

		var basekey = 'futuresite';
		var arr = o.futuresites;
		for (var i=0; i<arr.length; i++) {
			if (!arr[i]) continue;
			var s = modctx.sitelookup[arr[i]];
			if (!s) {
				console.log(basekey+' '+arr[i]+' not found (nation '+o.id+')');
				continue;
			}
			o.futurecapunits = o.futurecapunits.concat(s.units, s.hmon, s.mon);
			o.futurecapcommanders = o.futurecapcommanders.concat(s.commanders, s.hcom);
		}
		
		//remove capunits duplicated in units (etc)
		Utils.arrayDisect(o.capunits, o.units)
		Utils.arrayDisect(o.capcommanders, o.commanders)

		Utils.arrayUnique(o.units);
		Utils.arrayUnique(o.commanders);
		Utils.arrayUnique(o.capunits);
		Utils.arrayUnique(o.capcommanders);
		//should do it..?

		o.gems = '';
		for (k in gemkeys) {
			if (gemkeys[k])
				o.gems  +=  '+'+ String(gemkeys[k]) + k;
		}
	}

	for (var oi=0, o;  o= modctx.nationdata[oi];  oi++) {
		//////////////////////////////////////////////////
		// associate units with this nation
		//  if unit is already associated with a nation it creates a duplicate (with incremented id: +.01)
		/////////////////////////////////////////////////
		var iterations = {
			'unit': o.units,
			'commander': o.commanders,
			'cmdr (foreign)': o.foreigncommanders,
			'unit (foreign)': o.foreignunits,
			'unit (forest)': o.forestrec,
			'cmdr (forest)': o.forestcom,
			'unit (mountain)': o.mountainrec,
			'cmdr (mountain)': o.mountaincom,
			'unit (swamp)': o.swamprec,
			'cmdr (swamp)': o.swampcom,
			'unit (waste)': o.wasterec,
			'cmdr (waste)': o.wastecom,
			'unit (cave)': o.caverec,
			'cmdr (cave)': o.cavecom,
			'unit (coast)': o.coastrec,
			'cmdr (coast)': o.coastcom,
			'unit (plains)': o.plainsrec,
			'cmdr (plains)': o.plainscom,
			'unit (land)': o.landunit,
			'cmdr (land)': o.landcom,
			'hero (unique)': o.heroes,
			'hero (multi)': o.multiheroes,
			'unit (u-water)': o.uwunit,
			'cmdr (u-water)': o.uwcom,
			'unit (cap only)': o.capunits,
			'cmdr (cap only)': o.capcommanders,
			'unit (future cap only)': o.futurecapunits,
			'cmdr (future cap only)': o.futurecapcommanders
		}
		for (var basekey in iterations) {
			var arr = iterations[basekey];
			for (var i=0; i<arr.length; i++) {
				if (!arr[i]) continue;
				var u = modctx.unitlookup[arr[i]];
				//~ if (!u) {
					//~ console.log(basekey+' '+arr[i]+' not found (nation '+o.id+')');
					//~ continue;
				//~ }
				//~ if ((u.nation && u.nation!=o) || (u.type && u.type!=basekey))
					//~ u = modctx.cloneUnit(u);
				//~
				//~ u.type = basekey;
				//~ u.nation = o;
				//~ u.nationname = o.shortname;
				//~ delete u.nations;

			///////////////////////////////
				if (!u) {
					console.log(basekey+' '+arr[i]+' not found (nation '+o.id+')');
					continue;
				}
				if (u.typechar && u.typechar!=basekey) {
					//find right version of this unit
					var newu = modctx.getUnitOfType(u, basekey);
					if (newu) u = newu;
					else {
						u = modctx.cloneUnit(u);
						u.nations = {};
						u.eracodes = {};
					}
				}
				u.typechar = basekey;
				if (u.typechar.indexOf('unit') != -1) {
					if (!u.type || u.type == 'c') {
						u.type = 'u';
						MUnit.autocalc(u);
						if (u.mountmnr && parseInt(u.mountmnr) > 0) {
		   					mount = modctx.unitlookup[u.mountmnr];
							// Add goldcost of mount
						    if (parseInt(mount.basecost) > 1000) {
		   	                    u.goldcost = MUnit.round(u.goldcost + parseInt(mount.basecost) - 10000);
		   					} else {
		   	   					u.goldcost = MUnit.round(u.goldcost + parseInt(mount.basecost));
		   					}
							u.goldcost = MUnit.roundIfNeeded(u.goldcost);
	   	   				}
					}
				} else {
					if (!u.type || u.type == 'u') {
						u.type = 'c';
						MUnit.autocalc(u);
						if (u.mountmnr && parseInt(u.mountmnr) > 0) {
		   					mount = modctx.unitlookup[u.mountmnr];
							// Add goldcost of mount
						    if (parseInt(mount.basecost) > 1000) {
		   	                    u.goldcost = MUnit.round(u.goldcost + parseInt(mount.basecost) - 10000);
		   					} else {
		   	   					u.goldcost = MUnit.round(u.goldcost + parseInt(mount.basecost));
		   					}
							u.goldcost = MUnit.round(u.goldcost);
	   	   				}
					}
				}
				u.nations = u.nations || {};
				if (u.nations[o.id]) continue;

				u.nations[o.id] = o;
				u.eracodes = u.eracodes || {};
				u.eracodes[o.eracode] = true;

				//nationname
				var ncount=0; for (var k in u.nations) ncount++;
				if (ncount == 1)
					u.nationname = o.shortname;
				else
					u.nationname = 'various ('+ncount+')';

				// Marverni gets Iron Boars
				if (parseInt(o.id) == 8) {
					var ironBoar = modctx.unitlookup[1808];
					ironBoar.nationname = o.shortname;
				}
			}
		}
	}
	//fill nation selection box
	var h='';
	for (var era=1; era<=3; era++) {
		h+='<option disabled=disabled>-- '+modconstants.eranames[era]+' --</option>\n';
		for (var oi=0; oi<modctx.nationdata.length; oi++) {
			var o = modctx.nationdata[oi];
			if (o.era == era) {
				h+='<option value="'+o.id+'" title="nation '+o.id+'">'+o.fullname+'</option>\n';
			}
		}
	}
	$('select.nation').append($(h));

}

MNation.nationSummary = function(hsh) {
	var names = [];

	for (k in hsh) {
		names.push( hsh[k].shortname );
	}
	if (names.length == 0) return '';

	if (names.length == 1)
		return names[0];

	else return '<span title="'+names.join(',  \n')+'">Various ('+names.length+')</span>';
}

MNation.nationUnitRefs = function(hsh) {
	var refs = [], longRefs = [], eras = [], singlename = null;

	var k;
	for (k in hsh) {
		refs.push( Utils.ref('nation '+hsh[k].id, hsh[k].eracode) );
		longRefs.push( Utils.ref('nation '+hsh[k].id, hsh[k].shortname) );

		var name = hsh[k].name;
		singlename = (name==singlename || !singlename) ? name : -1;
	}
	if (refs.length == 0) return '';

	if (refs.length == 1)
		return Utils.ref('nation '+hsh[k].id, hsh[k].shortname);

	if (refs.length > 1 && singlename != -1) {
		return refs.join(', ') +' '+ singlename;
	}

	if (refs.length <= 3)
		return longRefs.join(',&nbsp; ')

	return MNation.nationSummary(hsh).replace('Various ','Various nations');
}

MNation.renderOverlay = function(o) {
	//template
	var h=''
	h+='<div class="nation overlay-contents"> ';

	//header
	h+='	<div class="overlay-header" title="nation id: '+o.id+'"> ';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';
	h+='		<div class="h2replace">'+o.fullname+'</div> ';
	h+='	</div>';

	//mid
	h+='	<div class="overlay-main">';
	h+='		<div class="hidden-block">Nation #:'+o.id+'</div>';
	h+='		<div> '+Format.Gems(o.gems)+'</div>';

	//wikilink
	h+='		<div class="overlay-wiki-link non-content" style="clear:both;">' + Utils.wikiLink(o.epithet) + '</div>';

	//modded
	if (o.modded) {
		h+='	<div class="modded hidden-block">' + Utils.renderModded(o) +'</div>';
	}
	h+='	</div>';

	h+='</div> ';

	return h;
}

//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
