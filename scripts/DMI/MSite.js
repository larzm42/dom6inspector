//namespace scope
(function( DMI, $, undefined ){

var MSite = DMI.MSite = DMI.MSite || {};

var Format = DMI.Format;
var Utils = DMI.Utils;

var modctx = DMI.modctx;
var modconstants = DMI.modconstants;

//////////////////////////////////////////////////////////////////////////
// PREPARE DATA
//////////////////////////////////////////////////////////////////////////

MSite.initSite = function(o) {
	o.hmon = [];
	o.hcom = [];
	o.mon = [];
	o.com = [];
	o.sum = [];
	o.suml2 = [];
	o.suml3 = [];
	o.suml4 = [];
	o.provdef = [];
	o.scales = [];
	o.scalesheader = [];
	o.rit = '';
}
MSite.prepareData_PreMod = function() {
	for (var oi=0, o;  o= modctx.sitedata[oi];  oi++) {
		o.hmon = [];
		o.hcom = [];
		o.mon = [];
		o.com = [];
		o.sum = [];
		o.suml2 = [];
		o.suml3 = [];
		o.suml4 = [];
		o.provdef = [];
		o.scales = [];
		o.scalesheader = [];
		var capunit = Utils.keyListToTable(o, 'hmon');
		for (var oj=0, cap; cap = capunit[oj]; oj++) {
			o.hmon.push(cap);
		}
		var capcom = Utils.keyListToTable(o, 'hcom');
		for (var oj=0, cap; cap = capcom[oj]; oj++) {
			o.hcom.push(cap);
		}
		var capcom = Utils.keyListToTable(o, 'hcom');
		for (var oj=0, cap; cap = capcom[oj]; oj++) {
			o.hcom.push(cap);
		}
		var mon = Utils.keyListToTable(o, 'mon');
		for (var oj=0, cap; cap = mon[oj]; oj++) {
			o.mon.push(cap);
		}
		var com = Utils.keyListToTable(o, 'com');
		for (var oj=0, cap; cap = com[oj]; oj++) {
			o.com.push(cap);
		}
//		var summons = Utils.keyListToTable(o, 'sum');
//		for (var oj=0, cap; cap = summons[oj]; oj++) {
//			o.sum.push(cap);
//		}
		var provdef = Utils.keyListToTable(o, 'provdef');
		for (var oj=0, cap; cap = provdef[oj]; oj++) {
			o.provdef.push(cap);
		}
		//set sprite url
		if (o.sprite) {
			o.url = 'images/sites/sites_' + Utils.paddedNum(o.sprite,4)+'.png';
		}
	}
}

MSite.prepareData_PostMod = function() {
	function parseSummoned(o, sum){
            for (var cc=0; uid=sum[cc]; cc++) {
                var found = false;
                for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
                    if (Math.round(unit.id) == uid && unit.nations && o.nations) {
                        for (var ii=0,natid; natid=o.nations[ii]; ii++) {
                            if (unit.nations[natid] && !found) {
                                unit.summonedfrom = unit.summonedfrom || [];
                                unit.summonedfrom.push( o );
								unit.typechar = 'unit (Summon)';
                                found = true;
                            }
                        }
                    } else if (Math.round(unit.id) == uid && !found) {
                        unit.summonedfrom = unit.summonedfrom || [];
                        unit.summonedfrom.push( o );
						unit.typechar = 'unit (Summon)';
                        found = true;
                    }
                }
                if (!found) {
                    for (var cc=0; uid=sum[cc]; cc++) {
                        for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
                            if (Math.round(unit.id) == uid && unit.nations && o.nations) {
                                unit.summonedfrom = unit.summonedfrom || [];
                                unit.summonedfrom.push( o );
								unit.typechar = 'unit (Summon)';
                            }
                        }
                    }
                }
            }
        }

	for (var oi=0, o;  o= modctx.sitedata[oi];  oi++) {

		o.renderOverlay = MSite.renderOverlay;
		o.matchProperty = MSite.matchProperty;

		//convert to numbers (for column ordering)
		//doesn't seem to cause any further problems..
		o.id = parseInt(o.id);

		if (o.loc == 0) {
			delete o.loc;
		}

		if (o.lab) {
			o.lab = 1;
		}

		if (o.rarity) {
			o.rarity = parseInt(o.rarity);
		}

		//searchable string
		o.searchable = o.name.toLowerCase();

		if (o.scale1) {
			o.scales.push(o.scale1);
			o.scalesheader.push(o.scale1.substring(0, o.scale1.length-7));
		}
		if (o.scale2) {
			o.scales.push(o.scale2);
			o.scalesheader.push(o.scale2.substring(0, o.scale2.length-7));
		}
		if (o.scales.length === 0) {
			delete o.scales;
		}
		if (o.scalesheader.length === 0) {
			delete o.scalesheader;
		}


		//magic gems
		o.mpath = '';
		for (var i=0; i<modconstants.pathkeys.length; i++) {
			var k = modconstants.pathkeys[i];
			var plevel  = o[k];

			//append to pathcost code
			if (Utils.is(plevel)) {
				o.mpath +=  k + plevel + ' '; //string
			}
		}

		if (o.mpath)
			o.listed_gempath = '0'+o.mpath;
		else o.listed_gempath = '';

		//magic gems when claimed
		o.mpath2 = '';
		for (var i=0; i<modconstants.pathkeys.length; i++) {
			var k = modconstants.pathkeys[i];
			var plevel  = o[k + '2'];

			//append to pathcost code
			if (Utils.is(plevel)) {
				o.mpath2 +=  k + plevel + ' '; //string
			}
		}

		o.events = [];
		for (var evti=0, evt;  evt= modctx.eventdata[evti];  evti++) {
			if (evt.req_site || evt.req_foundsite || evt.req_hiddensite || evt.req_nearbysite) {
				var sitename = evt.description.match(/\[(.*?)\]/);
				if (sitename && sitename.length > 1) {
					if (sitename[1] == o.name) {
						o.events.push(evt.id);
					}
				} else if (evt.req_site == o.id) {
					o.events.push(evt.id);
				} else if (evt.req_foundsite == o.id) {
					o.events.push(evt.id);
				} else if (evt.req_hiddensite == o.id) {
					o.events.push(evt.id);
				} else if (evt.req_nearbysite == o.id) {
					o.events.push(evt.id);
				}
			}
		}
		if (o.events.length == 0) {
			delete o.events;
		}

		o.newsiteevents = [];
		for (var evti=0, evt;  evt= modctx.eventdata[evti];  evti++) {
			if (evt.newsite) {
				var sitename = evt.description.match(/\[(.*?)\]/);
				if (sitename && sitename.length > 1) {
					if (sitename[1] == o.name) {
						o.newsiteevents.push(evt.id);
					}
				} else if (evt.newsite == o.id) {
					o.newsiteevents.push(evt.id);
				}
			}
		}
		if (o.newsiteevents.length == 0) {
			delete o.newsiteevents;
		}

		o.nations = [];
		for (var nati=0, nat;  nat= modctx.nationdata[nati];  nati++) {
			if (nat.sites.indexOf(o.id) != -1) {
				o.nations.push(nat.id);
			}
		}
		if (o.nations.length == 0) {
			delete o.nations;
		}
		o.futurenations = [];
		for (var nati=0, nat;  nat= modctx.nationdata[nati];  nati++) {
			if (nat.futuresites.indexOf(o.id) != -1) {
				o.futurenations.push(nat.id);
			}
		}
		if (o.futurenations.length == 0) {
			delete o.futurenations;
		}
		if (o.provdef.length == 0) {
			delete o.provdef;
		}
		if (o.hcom.length == 0) {
			delete o.hcom;
		} else {
			for (var cc=0; uid=o.hcom[cc]; cc++) {
				var found = false;
				for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
					if (Math.round(unit.id) == uid && unit.nations && o.nations) {
						for (var ii=0,natid; natid=o.nations[ii]; ii++) {
							if (unit.nations[natid] && !found) {
								unit.recruitedby = unit.recruitedby || [];
								unit.recruitedby.push( o );
								found = true;
							}
						}
					} else if (Math.round(unit.id) == uid && !found) {
						unit.recruitedby = unit.recruitedby || [];
						unit.recruitedby.push( o );
						found = true;
					}
				}
				if (!found) {
					for (var cc=0; uid=o.hcom[cc]; cc++) {
						for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
							if (Math.round(unit.id) == uid && unit.nations && o.nations) {
								unit.recruitedby = unit.recruitedby || [];
								unit.recruitedby.push( o );
							}
						}
					}
				}
			}
		}
		if (o.hmon.length == 0) {
			delete o.hmon;
		} else {
			for (var cc=0; uid=o.hmon[cc]; cc++) {
				var found = false;
				for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
					if (Math.round(unit.id) == uid && unit.nations && o.nations) {
						for (var ii=0,natid; natid=o.nations[ii]; ii++) {
							if (unit.nations[natid] && !found) {
								unit.recruitedby = unit.recruitedby || [];
								unit.recruitedby.push( o );
								found = true;
							}
						}
					} else if (Math.round(unit.id) == uid && !found) {
						unit.recruitedby = unit.recruitedby || [];
						unit.recruitedby.push( o );
						found = true;
					}
				}
				if (!found) {
					for (var cc=0; uid=o.hmon[cc]; cc++) {
						for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
							if (Math.round(unit.id) == uid && unit.nations && o.nations) {
								unit.recruitedby = unit.recruitedby || [];
								unit.recruitedby.push( o );
							}
						}
					}
				}
			}
		}
		if (o.com.length == 0) {
			delete o.com;
		} else {
			for (var cc=0; uid=o.com[cc]; cc++) {
				var found = false;
				for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
					if (Math.round(unit.id) == uid && unit.nations && o.nations) {
						for (var ii=0,natid; natid=o.nations[ii]; ii++) {
							if (unit.nations[natid] && !found) {
								unit.recruitedby = unit.recruitedby || [];
								unit.recruitedby.push( o );
								if (!unit.typechar || unit.typechar == 'Commander') {
									unit.typechar = 'cmdr (Magic site)';
								}
								found = true;
							}
						}
					} else if (Math.round(unit.id) == uid && !found) {
						unit.recruitedby = unit.recruitedby || [];
						unit.recruitedby.push( o );
						if (!unit.typechar || unit.typechar == 'Commander') {
							unit.typechar = 'cmdr (Magic site)';
						}
						found = true;
					}
				}
				if (!found) {
					for (var cc=0; uid=o.com[cc]; cc++) {
						for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
							if (Math.round(unit.id) == uid && unit.nations && o.nations) {
								unit.recruitedby = unit.recruitedby || [];
								unit.recruitedby.push( o );
								if (!unit.typechar || unit.typechar == 'Commander') {
									unit.typechar = 'cmdr (Magic site)';
								}
							}
						}
					}
				}
			}
		}
		if (o.mon.length == 0) {
			delete o.mon;
		} else {
			for (var cc=0; uid=o.mon[cc]; cc++) {
				var found = false;
				for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
					if (Math.round(unit.id) == uid && unit.nations && o.nations) {
						for (var ii=0,natid; natid=o.nations[ii]; ii++) {
							if (unit.nations[natid] && !found) {
								unit.recruitedby = unit.recruitedby || [];
								unit.recruitedby.push( o );
								if (!unit.typechar || unit.typechar == 'Unit') {
									unit.typechar = 'Unit (Magic site)';
								}
								found = true;
							}
						}
					} else if (Math.round(unit.id) == uid && !found) {
						unit.recruitedby = unit.recruitedby || [];
						unit.recruitedby.push( o );
						if (!unit.typechar || unit.typechar == 'Unit') {
							unit.typechar = 'Unit (Magic site)';
						}
						found = true;
					}
				}
				if (!found) {
					for (var cc=0; uid=o.mon[cc]; cc++) {
						for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
							if (Math.round(unit.id) == uid && unit.nations && o.nations) {
								unit.recruitedby = unit.recruitedby || [];
								unit.recruitedby.push( o );
								if (!unit.typechar || unit.typechar == 'Unit') {
									unit.typechar = 'Unit (Magic site)';
								}
							}
						}
					}
				}
			}
		}

		if (o.sum.length == 0) {
			delete o.sum;
		} else {
			parseSummoned(o, o.sum);
		}
		if (o.suml2.length == 0) {
			delete o.suml2;
		} else {
			parseSummoned(o, o.suml2);
		}
		if (o.suml3.length == 0) {
			delete o.suml3;
		} else {
			parseSummoned(o, o.suml3);
		}
		if (o.suml4.length == 0) {
			delete o.suml4;
		} else {
			parseSummoned(o, o.suml4);
		}

		if (o.rit == '') {
			delete o.rit;
		}
	}
	
	DMI.MUnit.prepareData_PostSiteData();

}


//////////////////////////////////////////////////////////////////////////
// DEFINE GRID
//////////////////////////////////////////////////////////////////////////
function formatScale(_,__,v){ return v=='z' ? "" : v; }

MSite.CGrid = Utils.Class( DMI.CGrid, function() {
	//grid columns
	var columns = [
		{ id: "name",     width: 145, name: "Site Name", field: "name", sortable: true },
		{ id: "level",     width: 40, name: "Level", field: "level", sortable: true },
		{ id: "rarirt",     width: 40, name: "Rarity", field: "rarity", sortable: true },
		{ id: "path",      width: 50, name: "Path", field: "path", sortable: true },
		{ id: "scalesheader",      width: 50, name: "Scale", field: "scalesheader", sortable: true, formatter: formatScale  },
		//{ id: "scale1",      width: 50, name: "Scale", field: "scale1sort", sortable: true, formatter: formatScale  },
		//{ id: "scale2",      width: 50, name: "Scale", field: "scale2sort", sortable: true, formatter: formatScale },
		{ id: "listed_gempath",    width: 120, name: "Gems", field: "listed_gempath", sortable: true, formatter: DMI.GridFormat.OrderedGems },
	];

	this.superClass.call(this, 'site', modctx.sitedata, columns); //superconstructor

	$(this.domsel+' .grid-container').css('width', 600);//set table width


	//in closure scope
	var that = this;


	//reads search boxes
	this.getSearchArgs = function() {
		var args = {properties: this.getPropertyMatchArgs(),
			str: $(that.domselp+" input.search-box").val().toLowerCase().trim(),
			sitepath: $(that.domselp+" select.sitepath").val() ,
			sitescale: $(that.domselp+" select.sitescale").val() ,
			siteterrain: $(that.domselp+" select.siteterrain").val() ,
			sitetype: $(that.domselp+" select.sitetype").val() ,
			mpaths: ''
		};
		args.properties = Utils.propertiesWithKeys(args.properties);


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

		//search string
		if (args.str && o.searchable.indexOf(args.str) == -1)
			return false;

		//magic paths
		if (args.mpaths) {
			var found = false;
			var arr = args.mpaths.split("");
			for (var jj=0, pathStr; pathStr=arr[jj]; jj++) {
				if (o.mpath.indexOf(pathStr) != -1)
					found = true;
			}
			if (!found) return false;
		}

		//site path
		if (args.sitepath && !( args.sitepath == o.path ))
			return false;

		//site scale
		if (args.sitescale) {
		    if (args.sitescale == "noscales") {
		        if (!o.scalesheader) {
		        } else {
		            return false;
		        }
		    } else if (!o.scalesheader || !o.scalesheader.includes(args.sitescale)) {
		        return false;
		    }
		}

		//site terrain
		if (args.siteterrain && args.siteterrain > 0 && !(o.loc & args.siteterrain))
			return false;

		//site terrain
		if (args.sitetype) {
			if (args.sitetype == "Normal" && o.rarity > 4)
				return false;
			if (args.sitetype == "Capitals") {
				if (!o.nations || o.nations.length == 0) {
					return false;
				}
			}
			if (args.sitetype == "Thrones" && o.rarity < 11)
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
		return true;
	}

	//customise sort
	this.preSort = function(){
		//bound scope
		var boosterSortPriority = ['F', 'A', 'W', 'E', 'S', 'D', 'N', 'G', 'B'];
		var isSortedOnBoosters = false;
		var data = modctx.sitedata;

		//the actual callback
		return function(e, args) {
			if (args.sortCol.field == 'listed_gempath') {
				if (isSortedOnBoosters) {
					//rotate priority
					var pL = boosterSortPriority[0];
					boosterSortPriority.push(boosterSortPriority.shift());

					//push last priority to end
					var regex = new RegExp('^.('+pL+'\\d+ )(.*)$');
					//console.log(regex);
					for (var i=0; i<data.length; i++) {
						var b = data[i].listed_gempath;
						if (b && b.indexOf(pL)!=-1)
							data[i].listed_gempath = b.replace(regex, "0$2$1");
					}
				}
				var L = boosterSortPriority[0];

				//set first character to number
				for (var i=0; i<data.length; i++) {
					var b = data[i].listed_gempath;
					if (b && b.indexOf(L)!=-1)
						data[i].listed_gempath =  String.fromCharCode(100+parseInt(b.substr(2,2))) + b.substr(1);
					if (!b) {
						data[i].listed_gempath = '0';
					}
				}
				//switch sort column header icon
				if ( $('#siteboosterordericon')
				     .attr({alt:L, src:'images/magicicons/Gem_'+L+'.png', 'class':'gemicon Gem_'+L})
				     .css('visibility','visible')
				     .length==0 )
				{
					//add icon if not exists yet
					$(".slick-header-column[id*=listed_gempath]")
					.append(' <img id="siteboosterordericon" alt="'+L+'" class="gemicon Gem_'+L+'" src="images/magicicons/Gem_'+L+'.png" />')
					.find(".slick-sort-indicator").css('visibility','hidden');
				}
				//fix sort direction
				args.sortAsc = false;
				isSortedOnBoosters = true;
			}
			else  {
				//hide sort column header icon if sorting another column
				$('#siteboosterordericon').css('visibility','hidden');
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
MSite.matchProperty = function(o, key, comp, val) {
	if (DMI.matchProperty(o, key, comp, val))
		return true;
}

MSite.bitfieldValues = function(bitfield, masks_dict) {
	var newValues=[];
	if (!bitfield) {
		return newValues;
	}
	var values = bitfields.bitfieldValues(bitfield, masks_dict);
	for (var value in values) {
		var flag = "none";
		value = values[value];
		newValues.push([value, flag]);
	}
	return newValues;
}

function list_nations(arr) {
	//create array of refs
	var tokens = [];
	for (var i=0, uid; uid= arr[i];  i++)
		tokens.push( Utils.nationRef( arr[i] ) );

	//comma separated & one per line
	return tokens.join(', <br />');
}

function list_units(arr, o) {
	//create array of refs
	var tokens = [];
	for (var i=0, uid; uid= arr[i];  i++) {
		for (var uniti=0, unit;  unit= modctx.unitdata[uniti];  uniti++) {
			if (Math.round(unit.id) == uid && unit.nations && o.nations) {
				for (var ii=0,natid; natid=o.nations[ii]; ii++) {
					if (unit.nations[natid]) {
						tokens.push( Utils.unitRef(unit.id, unit.fullname || unit.name) );
						break;
					}
				}
				break;
			} else if (Math.round(unit.id) == uid) {
				tokens.push( Utils.unitRef(unit.id, unit.fullname || unit.name) );
				break;
			}
		}

	}

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
var displayorder = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
	//'path',	'path',
	//'level', 'level',
	'mpath',	'gems',	function(v,o){
		return Format.Gems(v.replace(/U\d*/, function(s){return Utils.rndMagicRef(Math.floor(o.id), s);}));
	},
	'mpath2',	'gems when claimed',	function(v,o){
		return Format.Gems(v.replace(/U\d*/, function(s){return Utils.rndMagicRef(Math.floor(o.id), s);}));
	},
	'rarity', 'rarity',
	'gold', 'generates gold',
	'bringgold', 'brings gold per turn (mine)',
	'bringres', 'produce resources (mine)',
	'provinc', 'province income', Format.Signed,
	'res', 'generates resources',
	'sup', 'supply bonus',
	'recpoints', 'recuitment points',
	'unr', 'unrest',
	'exp', 'enter to gain xp',
	'fort', 'creates fort',
	'scales', 'increases',
	'voidgate', 'summon void creatures', Format.Percent,
	'conj', 'conjuration bonus', Format.Percent,
	'alter', 'alteration bonus', Format.Percent,
	'evo', 'evocation bonus', Format.Percent,
	'const', 'construction bonus', Format.Percent,
	'ench', 'enchantment bonus', Format.Percent,
	'thau', 'thaumaturgy bonus', Format.Percent,
	'blood', 'blood bonus', Format.Percent,
	'heal', 'healing',
	'disease', 'spreads disease',
	'curse', 'curses', Format.Percent,
	'horror', 'horrormark chance', Format.Percent,
	'holyfire', 'holy fire', Format.Percent,
	'holypow', 'holy power', Format.Percent,
	'scry', 'enter to scry',
	'adventure', 'adventure', Format.Percent,
	'domspread', 'spreads dominion',
	'domconflict', 'dominion conflict bonus', Format.Signed,
	'scorch', 'scorching desert', function(v,o) {
		return '(' + v + ' AN fire damage)';
	},
	'turmoil', 'dominion gets', function(v,o) {
		if (v > 0) {
			return 'Turmoil +' + v;
		} else {
			return 'Order +' + -v;
		}
	},
	'sloth', 'dominion gets', function(v,o) {
		if (v > 0) {
			return 'Sloth +' + v;
		} else {
			return 'Productivity +' + -v;
		}
	},
	'cold', 'dominion gets', function(v,o) {
		if (v > 0) {
			return 'Cold +' + v;
		} else {
			return 'Heat +' + -v;
		}
	},
	'death', 'dominion gets', function(v,o) {
		if (v > 0) {
			return 'Death +' + v;
		} else {
			return 'Growth +' + -v;
		}
	},
	'misfortune', 'dominion gets', function(v,o) {
		if (v > 0) {
			return 'Misfortune +' + v;
		} else {
			return 'Luck +' + -v;
		}
	},
	'drain', 'dominion gets', function(v,o) {
		if (v > 0) {
			return 'Drain +' + v;
		} else {
			return 'Magic +' + -v;
		}
	},
	'fireres', 'fire resistence', Format.Signed,
	'coldres', 'cold resistence', Format.Signed,
	'shockres', 'shock resistence', Format.Signed,
	'poisonres', 'poison resistence', Format.Signed,
	'str', 'strength', Format.Signed,
	'prec', 'precision', Format.Signed,
	'mor', 'morale,', Format.Signed,
	'undying', 'undying',
	'att', 'attack', Format.Signed,
	'def', 'defense', Format.Signed,
	'darkvision', 'darkvision',
	'aawe', 'animal awe',
	'awe', 'awe',
	'reinvigoration', 'reinvigoration',
	'airshield', 'air shield',
	'hp', 'hit points',
	'mr', 'magic resistance',
	'pdconscript', 'dominion pd conscription', Format.Signed,
	'popgrowth', 'population growth', Format.SignedPercentDiv,
	
	'recpointpercent', 'recruitment points', Format.Percent,
	'recpointpercentcmd' , 'commander recruitment points', Format.Percent,
	'agingpercent', 'aging rate', Format.Percent,
	
	'reveal', 'reveals', {0: 'mundane score graphs', 3: 'magic score graphs', 5: 'dominion score graphs', 999: 'all score graphs'},
	'rit', 'ritual range', function(v,o){
		return Format.Booster(v) + ' +' + o.ritrng;
	},
	'loc', 'location', function(v,o){ return Utils.renderFlags(MSite.bitfieldValues(o.loc, modctx.site_terrain_types_lookup), 1) },
	'hcom',	'home commanders',	function(v,o){
		return list_units(v, o);
	},
	'hmon',	'home units',	function(v,o){
		return list_units(v, o);
	},
	'com',	'commanders',	function(v,o){
		return list_units(v, o);
	},
	'mon',	'units',	function(v,o){
		return list_units(v, o);
	},
	'sum1',	'summon',	function(v,o){
		return o.path + " Mage 1-" + o.n_sum1 + ' ' + Utils.unitRef(v);
	},
	'sum2',	'summon',	function(v,o){
		return o.path + " Mage 1-" + o.n_sum2 + ' ' + + Utils.unitRef(v);
	},
	'sum3',	'summon',	function(v,o){
		return o.path + " Mage 1-" + o.n_sum3 + ' ' + + Utils.unitRef(v);
	},
	'sum4',	'summon',	function(v,o){
		return o.path + " Mage 1-"  +o.n_sum4 + ' ' + + Utils.unitRef(v);
	},
	 
	'provdefcom',	'extra PD (commander)',	Utils.unitRef,
	'provdef',	'extra PD (unit)',	function(v,o){
		return list_units(v, o);
	},
	'nations', 'start site', list_nations,
	'futurenations', 'future site', list_nations,
	'events', 'triggered events', list_events,
	'newsiteevents', 'new site events', list_events,
	'other', 'other',
	
	'nationalrecruits', 'national recruits', Utils.nationRef,
	'natmon', 'unit', Utils.unitRef,
	'natcom', 'commander', Utils.unitRef,
	'throneclustering', 'throne clustering',
	'wilddefenders', 'wild defenders',
	'rituallevelmodifier', 'ritual level modifier',
	'callgodbonus', 'call god bonus',
	'magicresistancebonus', 'magic resistance bonus',
	
	'evil', 'evil defenders',
	'scryrange', 'scrying range',
	'addtolimitedrecruitment', 'increase allowed limited recruitment units',
	'ageratereduction', 'age rate reduction', Format.Percent,
	'dragonlord', 'dragon lord',
	'corpselord', 'corpse construct bonus',
	'ivylord', 'vine creature bonus',
	'maximizeorder', 'order set to maximum'

]);
var flagorder = DMI.Utils.cutDisplayOrder(aliases, formats,
[
//	dbase key	displayed key		function/dict to format value
		'lab',	'generates lab',
		'temple',	'generates temple',
		'unaging', 'unaging'
		
]);
var hiddenkeys = DMI.Utils.cutDisplayOrder(aliases, formats,
[
	'id', 		'site id'
]);
var modderkeys = Utils.cutDisplayOrder(aliases, formats,
[
]);
var ignorekeys = {
	modded:1,
	path:1, level:1, scalesheader:1,
	n_sum1:1, n_sum2:1, n_sum3:1, n_sum4:1,
	A:1, B:1, D:1, E:1, F:1, N:1, S:1, W:1, G:1, H:1,
	A2:1, B2:1, D2:1, E2:1, F2:1, N2:1, S2:1, W2:1, G2:1, H2:1,
	ritrng:1, listed_gempath:1,
	scale1:1, scale2:1, sprite:1, url:1,

	//common fields
	name:1,descr:1,
	searchable:1, renderOverlay:1, matchProperty:1
};

MSite.renderOverlay = function(o) {
	//template
	var h=''
	h+='<div class="site overlay-contents"> ';

	//header
	h+='	<div class="overlay-header" title="site id: '+o.id+'"> ';
	h+='		<p style="float:right; height:0px;">'+o.path+' (lvl '+o.level+')</p>';
	h+='		<div class="h2replace">'+o.name+'</div> ';

	//mid
	h+='	</div>';
	h+='	<div class="clearfix overlay-main">';
	h+=' 		<input class="overlay-pin" type="image" src="images/PinPageTrns.png" title="unpin" />';
	h+='		<table class="overlay-table"> ';
	h+= 			Utils.renderDetailsRows(o, hiddenkeys, aliases, formats, 'hidden-row');
	h+= 			Utils.renderDetailsRows(o, modderkeys, aliases, formats, 'modding-row');
	h+= 			Utils.renderDetailsRows(o, displayorder, aliases, formats);
	h+= 			Utils.renderDetailsFlags(o, flagorder, aliases, formats);
	h+= 			Utils.renderStrangeDetailsRows(o, ignorekeys, aliases, 'strange');

	//modded
	if (o.modded) {
		h+='		<tr class="modded hidden-row"><td colspan="2">' + Utils.renderModded(o) +'</td></tr>';
	}		h+='	<img style="float:right; clear:right; vertical-align:top;background: #000000;" src="'+o.url+'"/>';

	h+='		</table> ';

	h+='	</div>';

	//footer
	h+='	<div class="overlay-footer">';

	//wikilink
	h+='		<div class="overlay-wiki-link non-content">';
	h+='			<a href="http://dom3.servegame.com/wiki/'+o.name.replace(/ /g, '_')+'">[wiki]</a>';
	h+='		</div>';
	h+='	</div> ';
	h+='</div> ';

	return h;
}


//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
