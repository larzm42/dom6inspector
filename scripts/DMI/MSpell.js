//namespace scope
(function( DMI, $, undefined ){

var MSpell = DMI.MSpell = DMI.MSpell || {};
var MUnit = DMI.MUnit = DMI.MUnit || {};

var Format = DMI.Format;
var Utils = DMI.Utils;

var modctx = DMI.modctx;
var modconstants = DMI.modconstants;


//////////////////////////////////////////////////////////////////////////
// PREPARE DATA
//////////////////////////////////////////////////////////////////////////

MSpell.initSpell = function(o) {
	o.nations = [];
	o.notnations = [];
}

MSpell.nationList = function (o) {
	o.nations = [];

	for (var oi=0, attr; attr = modctx.attributes_by_spell[oi];  oi++) {
		if (attr.spell_number == o.id) {
			if (attr.attribute == "278") {
				o.nations.push(parseInt(attr.raw_value));
			}
		}
	}

	return o.nations;
}

MSpell.prepareData_PreMod = function() {
	for (var oi=0, o;  o= modctx.spelldata[oi];  oi++) {

		o.path1  = modconstants[16][o.path1];
		o.path2  = modconstants[16][o.path2];

		o.nations = MSpell.nationList(o);
		o.notnations = [];

		o.nextspell = o.next_spell;

	}
}

MSpell.prepareData_PostMod = function() {
	for (var oi=0, o;  o= modctx.spelldata[oi];  oi++) {
		for (var ai=0, attr; attr = modctx.attributes_by_spell[ai];  ai++) {
			if (attr.spell_number == o.id) {
				if (attr.attribute == "602") {
					for (var ni=0, n;  n= modctx.nationdata[ni];  ni++) {
						var nation = modctx.nationlookup[n.id];
						if (Utils.inArray(attr.raw_value, nation.homerealm)) {
							o.nations.push(parseInt(n.id));
						}
					}
				}
				// Geo extra effect
				if (attr.attribute == "724") {
					o.nextspell = parseInt(o.id)+1;
				}
			}
		}

		//shift nation data to nations (who will shift it back in another form)
		for (var ni=0, nid, n; nid= o.nations[ni]; ni++) {
			if (!(n= modctx.nationlookup[nid])) {
				console.log('nation "'+nid+ '" not found (spell '+o.id+')');
				continue;
			}
			n.spells.push(o);
		}
		delete o.nations;

		// Parse the notnations to a list of IDs
		var parsedNations = [];
		for (var ni=0, nid, n; nid= o.notnations[ni]; ni++) {
			if (!(n= modctx.nationlookup[nid])) {
				console.log('nation "'+nid+ '" not found (spell '+o.id+')');
				continue;
			}
			//n.removeSpell(o);
			parsedNations[nid] = true;
		}
		o.notnations = parsedNations;

		o.renderOverlay = MSpell.renderOverlay;
		o.matchProperty = MSpell.matchProperty;

		//convert to numbers (for column ordering)
		//doesn't seem to cause any further problems..
		o.id = parseInt(o.id);
		o.name = o.name || '(undefined)';

		o.fatiguecost = parseInt(o.fatiguecost);

		//serachable string
		o.searchable = o.name.toLowerCase();

		//flip 'works underwater' bit and suchlike
//		o.spec_updated = o.spec;
//		o.spec_updated = MSpell.updateSpecialBitfield(o.spec_updated);

		// Extra Effects
		if (MSpell.extraEffect(o)) {
			o.nextspell = parseInt(o.id)+1;
		}
		
		//lookup effect 2
		if (o.nextspell == '0') {
			delete o.nextspell;
		} else if (o.nextspell) {
			var e2;
			if (e2 = modctx.spelllookup[o.nextspell])
				o.nextspell = e2;
			else {
				console.log('spell "'+o.nextspell+'" not found (nextspell on spell '+o.id+')');
				delete o.nextspell;
			}
		}

		// Modded description
		if (o.descr) {
			o.description = o.descr;
		}

		//path: E1D1
		if (!o.path1 || o.pathlevel1=='0') {
			delete o.path1;
			delete o.pathlevel1;
		}
		if (!o.path2 || o.pathlevel2=='0') {
			delete o.path2;
			delete o.pathlevel2;
		}
		o.mpath = (o.path1 || "") + (o.pathlevel1 || "") + (o.path2 || "") + (o.pathlevel2 || "");

		//research: Alteration 10
		o.research = modconstants[15][o.school];
		o.sortschool = o.school
		if (o.school != -1 && o.school != 7) {
			o.research += ' ' + o.researchlevel;
			o.sortschool += '.' + o.researchlevel;
		}

		if (o.nreff) {
			o.effects_count = o.nreff;
		}
		var effects = MSpell.getEffect(o);
		o.effect_number = effects.effect_number;
		if (effects) {
			if (effects.ritual == "1") {
				o.type = 'Ritual';
			} else {
				o.type = 'Combat';
			}
			o.rng_bat = effects.range_base;
			if (effects.range_per_level && effects.range_per_level != "0") {
				o.rng_bat = parseInt(o.rng_bat) + (parseInt(o.pathlevel1) * parseInt(effects.range_per_level));
				o.rng_bat = o.rng_bat + "+ [" + effects.range_per_level + "/lvl]";
			}
			if (o.rng_bat == "0") {
				delete o.rng_bat;
			}

			if (effects.area_base) {
				o.aoe_s = effects.area_base;
				var area_per_level = parseInt(effects.area_per_level)%10;
				if (area_per_level != 0) {
					o.aoe_s = parseInt(o.aoe_s) + (parseInt(o.pathlevel1) * parseInt(area_per_level));
					o.aoe_s = o.aoe_s + "+ [" + area_per_level + "/lvl]";
				}
				if (o.aoe_s == "0") {
					if (o.effects_count == "1" && effects.ritual == "0") {
						if (effects.range_base == "0") {
							o.aoe_s = "Caster";
						} else {
							if (effects.effect_number == "1" ||
								effects.effect_number == "21" ||
								effects.effect_number == "26" ||
								effects.effect_number == "31" ||
								effects.effect_number == "37" ||
								effects.effect_number == "38" ||
								effects.effect_number == "43" ||
								effects.effect_number == "50" ||
								effects.effect_number == "81" ||
								effects.effect_number == "93" ||
								effects.effect_number == "119" ||
								effects.effect_number == "76" ||
								effects.effect_number == "89" ||
								effects.effect_number == "100" ||
								effects.effect_number == "114") {
								delete o.aoe_s;
								delete o.rng_bat;
							} else {
								o.aoe_s = "One person";
							}
						}
					} else {
						delete o.aoe_s;
					}
				}
			}
			if (parseInt(o.effects_count) > 0) {
				o.nreff = o.effects_count;
			}
			if (effects.area_battlefield_pct) {
				o.aoe_s = effects.area_battlefield_pct + "% of battlefield";
			}
			if (effects.duration) {
				o.duration = effects.duration;
			}
		}

		/*
		 * Mod spells that copied vanilla spells were keeping the gemcost from the vanilla spell.
		 * Resetting that here so we get the correct value. If these aren't overridden by the mod,
		 * the copied value should still work.
		 */
		if(o.modded && o.fatiguecost) {
			o.gemcost = parseInt(o.fatiguecost) / 100;
		}
		
		//combat fatiguecost
		if (o.type == 'Ritual'){
			if (!o.gemcost) {
				o.gemcost = parseInt(o.fatiguecost) / 100;
			}
			delete o.fatiguecost;
			o.fatiguecostsort = -1;
		} else {
			/*
			 * Removed the += here, but this was sending fatiguecosts high. Now it only
			 * sets the fatiguecost if it doesn't already have a value. This could be an issue
			 * if it did need to add to another value!
			 */
			if (parseInt(o.gemcost) > 0 && !o.fatiguecost) {
				o.fatiguecost = parseInt(o.gemcost) * 100;
			}
			// Fix for Life for a Life
			else if (parseInt(o.gemcost) > 0 && !o.modded) {
				o.fatiguecost += parseInt(o.gemcost) * 100;
			}
			o.fatiguecostsort = parseInt(o.fatiguecost);
		}
		if (o.gemcost && parseInt(o.gemcost) > 0) {
			o.gemcostsort = parseInt(o.gemcost);
			o.gemcost = o.gemcost + o.path1;
		} else {
			o.gemcostsort = -1;
			delete o.gemcost;
		}
		
		// casting time
		if (o.type != 'Ritual' && !o.casttime) {
			o.casttime = 100;
			if (o.gemcost) {
				if (parseInt(o.gemcost) == 1) {
					if (effects.effect_number == "81") {
						o.casttime = 200;
					} else if (effects.area_battlefield_pct == "100") {
						o.casttime = 150;
					} else {
						o.casttime = 125;
					}
				} else if (parseInt(o.gemcost) == 2) {
					if (effects.effect_number == "81") {
						o.casttime = 225;
					} else if (effects.area_battlefield_pct == "100") {
						o.casttime = 175;
					} else {
						o.casttime = 150;
					}
				} else if (parseInt(o.gemcost) == 3) {
					if (effects.effect_number == "81") {
						o.casttime = 250;
					} else {
						o.casttime = 200;
					}
				} else if (parseInt(o.gemcost) == 4) {
					if (effects.effect_number == "81") {
						o.casttime = 275;
					} else {
						o.casttime = 225;
					}
				} else if (parseInt(o.gemcost) == 5) {
					if (effects.effect_number == "81") {
						o.casttime = 300;
					} else {
						o.casttime = 250;
					}
				} else if (parseInt(o.gemcost) == 6) {
					if (effects.effect_number == "81") {
						o.casttime = 325;
					} else {
						o.casttime = 275;
					}
				} else if (parseInt(o.gemcost) == 7) {
					if (effects.effect_number == "81") {
						o.casttime = 350;
					} else {
						o.casttime = 300;
					}
				} else if (parseInt(o.gemcost) == 8) {
					if (effects.effect_number == "81") {
						o.casttime = 375;
					} else {
						o.casttime = 325;
					}
				}
			}
			if (o.school == 6) {
				o.casttime = o.casttime+25;
			}
		}
		
		// Attributes
		for (var oj=0, attr; attr = modctx.attributes_by_spell[oj];  oj++) {
			if (attr.spell_number == o.id) {
				//var attribute = modctx.attributes_lookup[parseInt(attr.attribute_record_id)];
				if (attr.attribute == "700") {
					o.provrange = attr.raw_value;
				}
				if (attr.attribute == "787") {
					o.casttime = attr.raw_value;
				}
				if (attr.attribute == "1700" ||
				    attr.attribute == "1701") {
					var u = modctx.unitlookup[attr.raw_value];

					//add to list of summoned units (to be attached to nations later)
					o.summonsunits = o.summonsunits || [];
					o.summonsunits.push(u);

					//attach spell to unit
					u.summonedby = u.summonedby || [];
					u.summonedby.push( o );
					if (_effects.effect_number == "1" ||
   					    _effects.effect_number == "37") {
						u.typechar = 'unit (Summon)';
						u.sorttype = MUnit.unitSortableTypes[u.typechar];
					} else {
						u.typechar = 'cmdr (Summon)';
					}
				}
			}
		}

		//associate summons with this spell (and vice  versa)
		var _o = o;
		var _effects = effects;
		while (_o && _effects) {
			var arr = [];
			//get summons data for this spell
			if (_effects.effect_number == "1" ||
				_effects.effect_number == "21" ||
				_effects.effect_number == "26" ||
				_effects.effect_number == "31" ||
				_effects.effect_number == "37" ||
				_effects.effect_number == "38" ||
				_effects.effect_number == "43" ||
				_effects.effect_number == "50" ||
				_effects.effect_number == "93" ||
				_effects.effect_number == "119" ||
				_effects.effect_number == "137" ||
				_effects.effect_number == "141") {

				var uid = _effects.raw_argument;

				if (uid == "-16") {
					arr = MSpell.yazads;
				} else if (uid == "-17") {
					arr = MSpell.yatas;
				} else if (uid == "-21") {
					arr = MSpell.dwarfs;
				} else if (o.id == "380") {
					arr = MSpell.angelichost;
				} else if (o.id == "1081") {
					arr = MSpell.hordefromhell;
				} else if (parseInt(uid) < 0) {
					for (var oi2=0, o2; o2 = modctx.unitdata[oi2];  oi2++) {
						if (o2.montag) {
							if (-parseInt(uid) == parseInt(o2.montag)) {
								arr.push(parseInt(o2.id));
							}
						}
					}
				}
				if (arr.length > 0) {
					//create array of refs
					for (var i=0, unit; unit= arr[i];  i++) {
						var u = modctx.unitlookup[unit];

						//add to list of summoned units (to be attached to nations later)
						o.summonsunits = o.summonsunits || [];
						o.summonsunits.push(u);

						//attach spell to unit
						u.summonedby = u.summonedby || [];
						u.summonedby.push( o );
						if (_effects.effect_number == "1" ||
    					    _effects.effect_number == "37") {
							u.typechar = 'unit (Summon)';
							u.sorttype = MUnit.unitSortableTypes[u.typechar];
						} else {
							u.typechar = 'cmdr (Summon)';
						}
					}
				} else {
					var u = modctx.unitlookup[uid];
					if (!u) {
						if (uid > 0) {
							console.log('Unit '+uid+' not found (Spell '+_o.id+')');
						}
						break;
					}

					//add to list of summoned units (to be attached to nations later)
					o.summonsunits = o.summonsunits || [];
					o.summonsunits.push(u);

					//attach spell to unit
					u.summonedby = u.summonedby || [];
					u.summonedby.push( o );
					// Marverni gets Iron Boar
					if (parseInt(o.id) == 859) {
						var ironBoar = modctx.unitlookup[1808];
						o.summonsunits.push(ironBoar);
						ironBoar.summonedby = ironBoar.summonedby || [];
						ironBoar.summonedby.push( o );
						var marv = modctx.nationlookup[12];
						ironBoar.nations = ironBoar.nations || {};
						ironBoar.nations[12] = marv;
						ironBoar.eracodes = ironBoar.eracodes || {};
						ironBoar.eracodes[o.eracode] = true;
					}
					if (_effects.effect_number == "1" ||
   					    _effects.effect_number == "37") {
						u.typechar = 'unit (Summon)';
						u.sorttype = MUnit.unitSortableTypes[u.typechar];
					} else {
						u.typechar = 'cmdr (Summon)';
					}
				}

			} else if (_effects.effect_number == "76" ||
				_effects.effect_number == "81" ||
				_effects.effect_number == "89" ||
				_effects.effect_number == "100" ||
				_effects.effect_number == "114" ||
				_effects.effect_number == "120") {

				var arr;
				if (_effects.effect_number == "76") {
					arr = MSpell.tartarianGate;
				} else if (_effects.effect_number == "81" && o.damage == "43") {
					arr = MSpell.ghostShipArmada;
				} else if (_effects.effect_number == "89") {
					arr = MSpell.uniqueSummon[_effects.raw_argument];
				} else if (_effects.effect_number == "100") {
					arr = MSpell.terrainSummon[_effects.raw_argument];
				} else if (_effects.effect_number == "114") {
					arr = MSpell.uniqueSummon[_effects.raw_argument];
				} else if (_effects.effect_number == "120") {
					arr = MSpell.unleashImprisonedOnes;
				}
				if (!arr) {
					arr = [o.damage];
				}
				for (var i=0, uid;  uid= arr[i];  i++) {
					var u = modctx.unitlookup[uid];

					if (u) {
                        //add to list of summoned units (to be attached to nations later)
                        o.summonsunits = o.summonsunits || [];
                        o.summonsunits.push(u);

                        //attach spell to unit
                        u.summonedby = u.summonedby || [];
                        u.summonedby.push( o );
    					if (_effects.effect_number == "1" ||
    					    _effects.effect_number == "37") {
    						u.typechar = 'unit (Summon)';
    						u.sorttype = MUnit.unitSortableTypes[u.typechar];
    					} else  {
    						u.typechar = 'cmdr (Summon)';
    					}
                    }
				}

			}
			if (_o == _o.nextspell) break;
			_o = modctx.spelllookup[_o.nextspell];
			if (_o) {
				_effects = MSpell.getEffect(_o);
			}
		}
		if (effects) {
			o.spec = effects.modifiers_mask;
			if (!o.damage) {
				o.damage = effects.raw_argument;
			}
			Utils.addFlags(o, MSpell.bitfieldValues(effects.modifiers_mask, modctx.effect_modifier_bits_lookup), ignorekeys );
		}
	}
}


//////////////////////////////////////////////////////////////////////////
// DEFINE GRID
//////////////////////////////////////////////////////////////////////////

function spellNameFormatter(row, cell, value, columnDef, dataContext) {
	if (dataContext.nations)
		return '<div class="national-spell">'+value+'</div>';
	return value;
}

function fatigueFormatter(row, cell, value, columnDef, dataContext) {
	if (value) {
		if (value < 1000 && dataContext.type!='Ritual') {
	       		return String(value)+'-';
		}
	}
	return '';
}
function spellCostFormatter(row, cell, value, columnDef, dataContext) {
	return Format.Gems(dataContext.gemcost)
}
function spellTypeFormatter(row, cell, value, columnDef, dataContext) {
	return (value == 'combat spell') ? 'combat' : value
}

MSpell.CGrid = DMI.Utils.Class( DMI.CGrid, function() {
	//grid columns
	var columns = [
		{ id: "name",     width: 120, name: "Spell Name", field: "name", sortable: true, formatter: spellNameFormatter, sortCmp: 'text' },
		{ id: "type",      width: 40, name: "Type", field: "type", sortable: true, formatter: spellTypeFormatter, sortCmp: 'text' },
		{ id: "research",      width: 60, name: "School", field: "sortschool", sortable: true, formatter: function(_,__,v,___,o){ return o.research; } },
		{ id: "mpath",    width: 40, name: "Path req", field: "mpath", sortable: true, formatter: DMI.GridFormat.Paths, sortCmp: 'text' },
		{ id: "gemcost",    width: 30, name: "Cost", field: "gemcostsort", sortable: true, formatter: spellCostFormatter },
		{ id: "fatiguecost",     width: 30, name: "Fat", field: "fatiguecostsort", sortable: true, formatter: fatigueFormatter }
	];

	this.superClass.call(this, 'spell', modctx.spelldata, columns); //superconstructor

	$(this.domsel+' .grid-container').css('width', 550);//set table width

	//closure scope
	var that = this;

	//+ and - keys double/half bitmask search values
	$(that.domselp+" input.effect-mask, "+ that.domselp+" input.special-mask").keydown( function(e) {
		if (e.which == 107) {
			var n = parseInt($(this).val()) || 1;
			$(this).val((n-1 || 1)*2); //undo the last event which added 1
			e.preventDefault();
		}
		if (e.which == 109) {
			var n = parseInt($(this).val()) || 1;
			$(this).val(Math.ceil((n+1 || 1)/2)); //undo the last event which subtracted 1
			e.preventDefault();
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

			type: $(that.domselp+" select.type").val(),
			schools: Utils.splitToLookup( $(that.domselp+" select.school").val(), ','),
			inclusive: $(that.domselp+" input.inclusive-search:checked").val(),
			generic: $(that.domselp+" input.generic:checked").val(),
			national: $(that.domselp+" input.national:checked").val(),

			effect: parseInt($(that.domselp+" input.spell-effect-number").val()),
			effect_mask: parseInt($(that.domselp+" input.effect-mask").val()),
			special_mask: parseInt($(that.domselp+" input.special-mask").val()),

			aquatic: $(that.domselp+" select.aquatic").val(),

			mpaths: ''
		};
		args.properties = Utils.propertiesWithKeys(args.properties);

		if ($.isEmptyObject(args.schools)) delete args.schools;

		//whole era
		if (args.nation == 'EA' || args.nation == 'MA' || args.nation == 'LA') {
			args.eracode = args.nation;
			delete args.nation;
		}
		else args.nation = modctx.nationlookup[ args.nation ];

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

		//check effect no (and recurring attached effects)
		skip:
		if (args.effect) {
			var oo = o;
			//check recurring nextspell
			while(oo) {
				if (oo.effect_number == String(args.effect) || oo.effect_number == String(10000 + args.effect)) {
					//check masks on damage
					if (!args.effect_mask || parseInt(oo.damage) & args.effect_mask)
						//return true;
						break skip;
				}
				oo = oo.nextspell;
				if (oo == o) break; //avoid infinite loop
			}
			return false;
		}

		//check special mask (including child effeccts)
		skip:
		if (args.special_mask) {
			var oo = o;
			//check recurring nextspell
			while(oo) {
				if (parseInt(oo.spec) & parseInt(args.special_mask))
					//return true;
					break skip;
				oo = oo.nextspell;
				if (oo == o) break; //avoid infinite loop
			}
			return false;
		}

		//type
		if (args.type && o.type != args.type)
			return false;

		//school
		if (args.schools && !args.schools[o.school])
			return false;


		//national (national spells only)
		if (args.national && !o.nations)
			return false;
		//generic (generic spells only)
		if (args.generic && o.nations)
			return false;

		//era
		if (args.eracode && o.eracodes) {
			if (!o.eracodes[args.eracode])
				return false;
		}
		//nation
		if (args.nation && o.nations) {
			if (!o.nations[args.nation.id])
				return false;
		}
		if (args.nation && o.notnations) {
			if (o.notnations[args.nation.id])
				return false;
		}

		//aquatic
		if (args.aquatic) {
			if (args.aquatic == 'uw' && !DMI.MSpell.worksUnderwater(o))
				return false;
			if (args.aquatic == 'land' && !DMI.MSpell.worksOnDryLand(o))
				return false;
		}

		//search string
		if (args.str && o.searchable.indexOf(args.str) == -1)
			return false;

		//magic paths
		if (args.mpaths) {
			if(args.inclusive) {
				if(args.mpaths.indexOf(o.path1) == -1) {
					if(!o.path2) {
						return false;
					} else {
						if(args.mpaths.indexOf(o.path2) == -1)
							return false;
					}
				}
			} else {
				if (args.mpaths.indexOf(o.path1) == -1)
					return false;
				if (o.path2 && args.mpaths.indexOf(o.path2) == -1)
					return false;
			}
		}

		//key =~ val
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

	//customise initial search
	this.initialSortTrigger = this.domsel+" div.slick-header-column[title=School]";

	this.defaultSortCmp = function(r1,r2) {
		if (r2.mpath < r1.mpath) return 1;
		if (r2.mpath > r1.mpath) return -1;
		return 0;
	}

	//call filters and update  display
	//asyncronous to make sure all filter inputs are correctly initialised
	setTimeout(function() {
		that.init();
	},0);
});

MSpell.matchProperty = function(o, key, comp, val) {
	if (DMI.matchProperty(o, key, comp, val))
		return true;

	//nextspell..
	//if (o.nextspell)
	//	return DMI.MSpell.matchProperty(o.nextspell, key, comp, val);
}

MSpell.formatAoe = function(v,o) {
	return o.aoeplus ? v+'+' : v;
}


//////////////////////////////////////////////////////////////////////////
// OVERLAY RENDERING
//////////////////////////////////////////////////////////////////////////

var aliases = {};
var formats = {};
var hiddenkeys = Utils.cutDisplayOrder(aliases, formats,
[
	'id', 		'spell id'
]);
var moddingkeys = Utils.cutDisplayOrder(aliases, formats,
[
	'effect',	'effect',
	'nextspell',	'nextspell',	function(v,o){ return v.id; },
	'effect_number',	'effect number',
	'damage',	'damage',
	'spec',	'spec',
]);
var displayorder = Utils.cutDisplayOrder(aliases, formats,
[
	'rng_bat',	'range', 		function(v,o){ return o.rngplus ? v+'+' : v; },
	'provrange',	'range', 		function(v,o){ return o.provrange == 1 ? v+' province' : v+' provinces' },
	'casttime', 'casting time', Format.Percent,
	'aispellmod', 'ai score modification', Format.Percent,
	'ainocast', 'ai no cast',
	'aoe_s',	'area of effect', 	MSpell.formatAoe,
	'nreff', 	'number of effects',	function(v,o){ return o.effplus ? v+'+' : v; },
	'precision',	'precision',
	'fatiguecost',	'fatigue cost',		function(v){ return v+'-'; },
	'duration',	'duration',	function(v,o){ return o.duration == 1 ? v+' round' : v+' rounds' },
	'gemcost',	'gems required',	Format.Gems,
	'onlyowndst', 'target own province', {0:'false', 1:'true'},
	'onlygeosrc', 'required terrain', function(v,o){ return Utils.renderFlags(MSpell.bitfieldValues(o.onlygeosrc, modctx.map_terrain_types_lookup), 1) },
	'nogeosrc', 'banned terrain', function(v,o){ return Utils.renderFlags(MSpell.bitfieldValues(o.nogeosrc, modctx.map_terrain_types_lookup), 1) },
	'onlygeodst', 'destination terrain', function(v,o){ return Utils.renderFlags(MSpell.bitfieldValues(o.onlygeodst, modctx.map_terrain_types_lookup), 1) },
	'onlyfriendlydst', 'target allied provinces', {0:'false', 1:'true'},
	'nowatertrace', 'cannot trace through water', {0:'false', 1:'true'},
	'nolandtrace', 'cannot trace over land', {0:'false', 1:'true'},
	'walkable', 'trace along a walkable path', {0:'false', 1:'true'}
]);
var ignorekeys = {
	modded:1,
	path1:1, pathlevel1:1, path2:1, pathlevel2:1,
	school:1,
	researchlevel:1,research:1,sortschool:1, casttime:1,

	damagemon:1,
	descr:1, details:1,
	type:1,
	mpath:1,
	fatiguecost:1,gemcost:1,
	fatiguecostsort:1,gemcostsort:1,
	next_spell:1,
	effect_record_id:1,
	effects_count:1,
	range:1,
	aoe:1,

	summonsunits:1,	nations:1, notnations:1, eracodes:1, nationname:1,

	//common fields
	name:1,description:1,
	searchable:1, renderOverlay:1, matchProperty:1
};

MSpell.renderOverlay = function(o) {
	var descrpath = 'gamedata/spelldescr/';

	//template
	var h='';
	h+='<div class="spell overlay-contents"> ';

	//header
	h+='	<div class="overlay-header" title="spell id:'+o.id+'"> ';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';
	h+='		<p style="float:right;">'+o.research+'</p>';
	h+='		<div class="h2replace">'+o.name+'</div> ';

	var nref = DMI.MNation.nationUnitRefs(o.nations);
	if (nref)
		h+='	<p>'+nref+'</p> ';


	//body
	h+='	</div>';
	h+='	<div class="overlay-main" style="position:relative;">';

	//type & path requirements
	h+='		<div style="float:right; clear:right;">'+o.type+'</div>';
	h+='		<div style="float:right; clear:right;">'+Format.Paths(o.mpath)+'</div>';

	//spell details & secondary effects
	h+=		MSpell.renderSpellTable(o);

	//wikilink
	if (!o.moddedname)
		h+='	<div class="overlay-wiki-link non-content">' + Utils.wikiLink(o.name) + '</div>';

	//footer
	h+='	</div>';
	h+='	<div class="overlay-footer">';

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

	//details
	var uid = 'c'+(Math.random());
	uid = uid.replace('.','');
	h+='		<div class="overlay-details pane-extension '+uid+'"></div>';

	if (o.details)
		Utils.insertContent( '<p>'+o.details+'</p>', 'div.'+uid );
	else {
		var url = descrpath + Utils.descrFilename('details'+o.name);
		Utils.loadContent( url, 'div.'+uid );
	}

	h+='	</div> ';
	h+='</div> ';
	
	return h;
}

//spell table. +recursive secondary effects
MSpell.renderSpellTable = function(o, original_effect) {

	var cssclasses = original_effect ? ' modding-row' : '';

	//template
	var h='';
	h+='		<table class="overlay-table spell-table"> ';
	h+= 			Utils.renderDetailsRows(o, hiddenkeys, aliases, formats, 'hidden-row');
	h+= 			Utils.renderDetailsRows(o, moddingkeys, aliases, formats, 'modding-row');
	h+= 			Utils.renderDetailsRows(o, displayorder, aliases, formats, cssclasses);
	h+= 			Utils.renderStrangeDetailsRows(o, ignorekeys, aliases, 'strange'+cssclasses);
	h+='		</table> ';

	cssclasses = original_effect ? ' nextspell' : '';

	//hide the whole effect if its restore fatigue +0 (it does nothing)
	// (used as gfx effects placeholder in cbm)
	if (o.damage == '0' && MSpell.format.effect(o.effect) == 8)
		cssclasses += 	' modding-block'

	var effects = MSpell.getEffect(o);
	if (effects) {
		//effect
		h+='		<table class="overlay-table spell-effect '+cssclasses+'"> ';
		h+=			renderEffect(o, effects);

		// Attributes
		for (var oi=0, attr; attr = modctx.attributes_by_spell[oi];  oi++) {
			if (attr.spell_number == o.id) {
				if (attr.attribute != "278" &&
						attr.attribute != "700" &&
						attr.attribute != "787") {
					var specflags = modctx.attribute_keys_lookup[attr.attribute].name;

					var val;
					if (attr.attribute == '701') {
						val = Utils.renderFlags(MSpell.bitfieldValues(attr.raw_value, modctx.map_terrain_types_lookup), 1);
					} else if (attr.attribute == '702') {
						val = Utils.renderFlags(MSpell.bitfieldValues(attr.raw_value, modctx.map_terrain_types_lookup), 1);
					} else if (attr.attribute == '711') {
						val = Utils.siteRef(attr.raw_value);
					} else if (attr.attribute == '719') {
						if (modctx.unit_effects_lookup[attr.raw_value]) {
							val = modctx.unit_effects_lookup[attr.raw_value].name
						} else {
							val = attr.raw_value;
						}
					} else if (attr.attribute == '750') {
						var special = {'-1': 'Non-specialized', 0: 'Fire', 1: 'Air', 2:'Water', 3:'Earth', 4:'Astral', 5:'Death', 6:'Nature', 7:'Glamour', 8:'Blood'};
						val = special[attr.raw_value];				
					} else if (attr.attribute == "703" || attr.attribute == "704" || attr.attribute == "724") {
						val = Utils.renderFlags(MSpell.bitfieldValues(attr.raw_value, modctx.map_terrain_types_lookup));
					} else if (attr.attribute == '731') {
						val = Utils.unitRef(attr.raw_value);
					} else if (attr.attribute == '746') {
						val = modctx.enchantments_lookup[attr.raw_value].name;
					} else if (attr.attribute == '790') {
						val = Utils.unitRef(attr.raw_value);
					} else if (attr.attribute == '1700') {
						val = Utils.unitRef(attr.raw_value);
					} else if (attr.attribute == '1701') {
						val = Utils.unitRef(attr.raw_value);
					} else {
						val = attr.raw_value;
					}

					h+= '<tr class="'+attr.attribute+'"><th>'+modctx.attribute_keys_lookup[attr.attribute].name.replace(/{(.*?)}|<|>/g, "")+':</th><td>'+val+'</td></tr>'
				}
			}
		}

		//special
		var specflags = Utils.renderFlags( MSpell.bitfieldValues(effects.modifiers_mask, modctx.effect_modifier_bits_lookup) );
		if (specflags)
			h+=		'<tr><td class="widecell" colspan="2">&nbsp;</td></tr><tr><td class="widecell" colspan="2">'+specflags+'</td></tr></div>';
	}

	//modded
	if (o.modded) {
		h+='		<tr class="modded hidden-row"><td colspan="2">' + Utils.renderModded(o) +'</td></tr>';
	}
	h+=' 		</table> ';


	//attached effect
	if (o.nextspell) {
		h+=' <h4 class="hidden-block nextspell">'+o.nextspell.name+'</h4>';
		//detect recursion
		if (o.nextspell == o)
			throw 'Error, spell 2nd effect as itself: '+o.id+': '+o.name;
		else {
			h+= MSpell.renderSpellTable(o.nextspell, original_effect || o);
		}
	}
	return h;
}

MSpell.bitfieldValues = function(bitfield, masks_dict) {
	var newValues=[];
	if (!bitfield) {
		return newValues;
	}
	var values = bitfields.bitfieldValues(bitfield, masks_dict);
	for (var value in values) {
		var flag = "none";
		var flagIndex = values[value].indexOf("Wpn: #");
		if (flagIndex != -1) {
			flag = values[value].substring(flagIndex+6, values[value].length-1)
		}
		value = values[value].replace(/{(.*?)}/g, "");
		newValues.push([value, flag]);
	}
	return newValues;
}

function renderEffect(o, effects) {
	var res = MSpell.effectlookup[effects.effect_number] || MSpell.effectlookup['unknown'];
	if (effects.effect_number >= 500 && effects.effect_number <= 699)
	{
		if (modctx.unit_effects_lookup[effects.raw_argument])
		{
			res = modctx.unit_effects_lookup[effects.raw_argument].name
		}
	}
	//if its a function then run it
	if (typeof(res) == 'function')	res = res(o, effects);
	return '<tr><th width="10px">'+modctx.effects_info_lookup[effects.effect_number].name.replace(/{(.*?)}|(\(Type.*?\))|(\(\?\))/g, "").trim()+':</th><td>'+res+'</td></tr>'
}

MSpell.worksUnderwater = function(spell) {
	var effects = MSpell.getEffect(spell);
	if (effects) {
		if ((effects.modifiers_mask & 8388608) ||
			(effects.modifiers_mask & 33554432)) {
			return true;
		}
	}
	return false;
}

MSpell.worksOnDryLand = function(spell) {
	var effects = MSpell.getEffect(spell);
	if (effects) {
		if (!(effects.modifiers_mask & 33554432)) {
			return true;
		}
	}
	return false;
}

MSpell.extraEffect = function(spell) {
	var effects = MSpell.getEffect(spell);
	if (effects) {
		if ((MSpell.BitwiseAndLarge(effects.modifiers_mask,576460752303423488)) ||
			(MSpell.BitwiseAndLarge(effects.modifiers_mask, 1152921504606846976))) {
			return true;
		}
	}
	return false;
}

MSpell.BitwiseAndLarge = function(val1, val2) {
    var shift = 0, result = 0;
    var mask = ~((~0) << 30); // Gives us a bit mask like 01111..1 (30 ones)
    var divisor = 1 << 30; // To work with the bit mask, we need to clear bits at a time
    while( (val1 != 0) && (val2 != 0) ) {
        var rs = (mask & val1) & (mask & val2);
        val1 = Math.floor(val1 / divisor); // val1 >>> 30
        val2 = Math.floor(val2 / divisor); // val2 >>> 30
        for(var i = shift++; i--;) {
            rs *= divisor; // rs << 30
        }
        result += rs;
    }
    return result;
}

MSpell.getEffect = function(spell) {
	var effect = {};

	// When modifying effects, we need to be careful to use a copy, not a reference,
	// otherwise modifications will be shared between all spells/weapons with the same effect.
	// I don't like this JSON hack, but it's apparently the accepted JS way of doing it

	if (spell.effect_record_id) {
		effect = JSON.parse(JSON.stringify(modctx.effects_spells_lookup[spell.effect_record_id]));
	}

	if (spell.copyspell) {
		var otherspell = DMI.modctx.spelllookup[spell.copyspell];
		effect = JSON.parse(JSON.stringify(modctx.effects_spells_lookup[otherspell.effect_record_id]));
	}
	if (spell.effect) {
		if (parseInt(spell.effect) > 10000) {
			effect.effect_number = parseInt(spell.effect) - 10000;
			effect.ritual = 1;
		} else if (parseInt(spell.effect) > 1000) {
			effect.effect_number = parseInt(spell.effect) % 1000; //Edge of map???
			effect.duration = Math.floor(parseInt(spell.effect) / 1000);
		} else {
			effect.effect_number = parseInt(spell.effect);
			effect.ritual = 0;
		}
	}
	if (spell.damage) {
		effect.raw_argument = spell.damage;
	}
	if (spell.damagemon) {
		effect.raw_argument = spell.damagemon.toLowerCase();
	}

	// Need to add new enchantments to the list
	if (effect.effect_number == "81" || effect.effect_number == "82") {
		if (!modctx.enchantments_lookup[effect.raw_argument]) {
			var enchant = {name: spell.name, number: effect.raw_argument};
			modctx.enchantments.push(enchant);
			modctx.enchantments_lookup[effect.raw_argument] = enchant;
		}
	}

	if (spell.spec) {
		effect.modifiers_mask = spell.spec;
	} else if (!effect.modifiers_mask) {
		effect.modifiers_mask = 0;
	}

	if (spell.range) {
		effect.range_base = parseInt(spell.range) % 1000;
		if (parseInt(spell.range) > 999) {
			effect.range_per_level = Math.round(parseInt(spell.range) / 1000);
		}
	} else if (!effect.range_base) {
		effect.range_base = '0';
		effect.range_per_level = '0';
	}

	if (spell.aoe) {
		effect.area_base = parseInt(spell.aoe) % 1000
		effect.area_per_level = parseInt(spell.aoe) / 1000;
		if (parseInt(spell.aoe) > 999) {
			effect.area_per_level = Math.round(parseInt(spell.aoe) / 1000);
		}
		// In the case of modded spells that #copyspell a x% battlefield spell, but then overwrite aoe_s...
		// they should not retain the x% battlefield 
		if ((spell.aoe < 600 || spell.aoe > 700) && effect.area_battlefield_pct) {
			delete effect.area_battlefield_pct;
		}
	}

	return effect;

//  effect.duration INTEGER,
//	effect.range_strength_divisor INTEGER,
//	effect.area_battlefield_pct INTEGER,
//	effect.sound_number INTEGER,
//	effect.flight_sprite_number INTEGER,
//	effect.flight_sprite_length INTEGER,
//	effect.explosion_sprite_number INTEGER,
//	effect.explosion_sprite_length INTEGER,
}


//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
