//namespace scope
(function( DMI, $, undefined ){

var modctx = DMI.modctx;
var Utils = DMI.Utils;

//configuration
var mod_dir = 'mods/'


DMI.loaded_mod_files = [];
DMI.loaded_local_mod_files = [];


var g_data = {
	status: undefined,

	server_mod_list: [],

	server_mods_to_load: [],
	server_data: {},

	local_mods_to_load: [],
	local_data: {},

	upload_mods_to_load: [],
	upload_data: {}
}

DMI.continueLoading = function() {
	g_data.status = g_data.status || 'Load mod list';

	console.log('STATUS: '+g_data.status+'..');

	switch(g_data.status) {

	case 'Load mod list':
		$('#page-status').html('Loading data...');

		g_data.status = 'Load local mods';
		if (location.search.indexOf('selectmods=1') != -1) {
			loadModList( g_data );
			return;
		}

	case 'Load local mods':
		g_data.status = 'Select mods';
		loadLocalMods( g_data );
		return;

	case 'Select mods':
		$('#mod-selection').show();
		$('#page-status').html('<h1>Select mods:</h1>');

		g_data.status = 'Finalising Mods';
		if (location.search.indexOf('selectmods=1') != -1) {
			selectMods( g_data );
			return;
		}
		//else ..

	case 'Finalising Mods':
		Utils.clearErrors();
		$('#mod-selection').hide();
		g_data.status = 'Downloading files';
		finaliseModSelection( g_data );
		return;

	case 'Downloading files':
		$('#page-status').html('Downloading data...');

		g_data.status = 'Parsing data';
		downloadData( g_data );
		return;

	case 'Downloading mobile files':
		g_data.status = 'Parsing mobile data';
		downloadData( g_data );
		return;

	case 'Parsing data':
		g_data.status = 'Init interface';
		parseData( g_data );
		return;

	case 'Parsing mobile data':
		g_data.status = 'Init mobile interface';
		parseData( g_data );
		return;

	case 'Init interface':
		//set list of loaded mods (clears loading msg)
		//note these are full names grabbed when parsing not filenames
		if (DMI.modctx.loadedmods.length)
			$('#page-status').html(DMI.modctx.loadedmods.join(',<br /> '));
		else
			$('#page-status').html('No mods loaded');


		g_data.status = 'relax! have a beer';
		g_data = null; //oops

		DMI.initGrids(); //back to main.js
		return;

	case 'Init mobile interface':
		g_data.status = 'relax! have a beer';
		g_data = null; //oops

		DMI.initMobile();
		return;
	}
}

DMI.mobileLoading = function() {
	g_data.status = g_data.status || 'Downloading mobile files';
	DMI.continueLoading();
}

function loadModList( g_data ) {
	var mod_re = new RegExp('<a\\s*href="([\\w\\d\\s\\._-]+?\\.dm)">\\s*\\1\\s*</a>', 'igm');
	var g_data = g_data;

	//load mod list from server on startup
	$($.ajax({
		url: mod_dir,
		dataType:  'text',
		success: function(html) {
			while (match = mod_re.exec(html)) {
				g_data.server_mod_list.push( match[1] );
			}
			//create_mod_buttons(g_data.server_mod_list);
			DMI.continueLoading();
		},
		error: function(wtf, textStatus, errorThrown) {
			DMI.Utils.error(  "Error reading mod dir: " + mod_dir);
		}
	}));
}


//mod selection screen
function loadLocalMods( g_data ) {
	g_data.server_mods_to_load = (new ParsedQueryString()).params("mod");
	g_data.local_mods_to_load = (new ParsedQueryString()).params("localmod");

	//load local_mods
	for (var i=0, mn; modname= g_data.local_mods_to_load[i]; i++) {
		var mod = LocalDataStore.get(modname);
		if (mod) {
			g_data.local_data[modname] = mod;

			//remove duplicate (server version)
			if (Utils.inArray(modname, g_data.server_mods_to_load))
				Utils.weedArray(modname, g_data.server_mods_to_load);
		} else {
			g_data.local_mods_to_load.splice(i,1);
			i--;

			Utils.error('Local mod not found: '+modname);
		}
	}
	DMI.continueLoading();
}



//mod selection screen
function selectMods( g_data ) {

	//create mod buttons on load
	var numcols = DMI.Options['Select mod columns'];//Math.sqrt(g_data.server_mod_list.length);
	var numrows = Math.ceil( g_data.server_mod_list.length / numcols );

	html+='<div style="float:left;">';
	var html = '';
	for (var mod, i=0; mod=g_data.server_mod_list[i]; i++) {
		//new column
		if (i % numrows == 0)
			html+='</div><div style="float:left; padding:0.5em 1.5em; white-space:nowrap; min-width:180px">';

		//preticked if this mod is in url
		var checked = '';
		if (DMI.Utils.inArray(mod, g_data.server_mods_to_load))
			checked = ' checked="checked"';

		html += '<div class="selectable-mod">';
		html += '<label for="select-'+mod+'"><input name="mod" id="select-'+mod+'" value="'+mod+'" type="checkbox" '+checked+'>';
		html += 	mod+'</label>';
		html += '</div>'
	}
	html+='</div>';

	$('#mod-selection-list').html(html)
	$('#mod-selection-list input').bind('change click', highlightSelectedMods);
	highlightSelectedMods();

	//visual highlights & clear mod selection button [x]
	function highlightSelectedMods() {
		$('#clear-mods-btn').css('visibility', 'hidden');
		$('#mod-selection-list input').each(function(){
			if ($(this).prop('checked')) {
				$(this).parent().css({ fontWeight:'bold', color:'#AA0000' })
				$('#clear-mods-btn').css('visibility', 'visible');
			}
			else
				$(this).parent().css({ fontWeight:'normal', color:'black' });
		});
	}
	$('#clear-mods-btn').click(function(){
		$('#mod-selection-list input:checked').each(function(){
			$(this).prop('checked', false);
			highlightSelectedMods();
		});
	});

	//load local mod files
	function handleFileSelect(evt) {
		if (! (evt && evt.target && evt.target.files)) {
			Utils.error('Not supported in this browser.');
			return;
		}
		var files = evt.target.files; // FileList object
		//$('ul#custom-mod-list').hide().html('');

		// Loop through the FileList
		for (var i = 0, f; f = files[i]; i++) {
			var reader = new FileReader();

			//callback in closure with file details
			reader.onload = (function(f) {
			return function(e) {
				if (e && e.target && e.target.result) {
					g_data.upload_mods_to_load.push(f.name);
					g_data.upload_data[f.name] = e.target.result;

					$('ul#custom-mod-list li[title=\''+f.name+'\']').remove();
					$('ul#custom-mod-list').show().append('<li title="'+f.name+'">'+f.name+'</li>');
					$('#clear-custom-mods-btn').css('visibility', 'visible');
				} else {
					DMI.Utils.error('Error reading local file: '+f.name);
				}
			};
			})(f);
			// Read in the file as a data URL.
			reader.readAsText(f);
		}
	}
	$('#load-custom-mod').bind('change', handleFileSelect);
	$('#clear-custom-mods-btn').click(function(){
		g_data.local_mods_to_load = [];
		g_data.upload_mods_to_load =   [];
		g_data.upload_data = [];
		$('#load-custom-mod').val(null);
		$('ul#custom-mod-list').hide().html('');
		$(this).css('visibility', 'hidden');
	}).css('visibility', 'hidden');

	//show local mods
	for (var i=0, m; m=g_data.local_mods_to_load[i]; i++) {
		$('ul#custom-mod-list').show().append('<li title="'+m+'">'+m+' <span style="font-weight:normal;color:black;font-style:italic;">&nbsp;(stored copy)</span></li>');
		$('#clear-custom-mods-btn').css('visibility', 'visible');
	}

	//submit on enter
	$('html').keypress(function(e){
		if (e.keyCode == 13)
			$('#mod-selection').trigger('submit');
	});

	//on submit.. make list of modnames and load data
	$('#mod-selection').submit(function(evt){
		$('html').unbind('keypress');

		g_data.server_mods_to_load = [];
		$('#mod-selection-list input:checked').each(function(){
			g_data.server_mods_to_load.push( $(this).val() );
		});

		DMI.continueLoading(); //SUCCESS

		evt.preventDefault();
		return false;
	});
}


var LocalDataStore = {
	is_supported: function() {
		return typeof(localStorage) != 'undefined';
	},

	get: function(key) {
		if (!LocalDataStore.is_supported()) return false; //no browser support
		key = String(key);
		if (key == '#list_items') key='\\'+key;

		var str = localStorage.getItem( key );
		return str ;//? JSON.parse( str ) : false;
	},

	set: function(key, value) {
		if (!LocalDataStore.is_supported()) return "Not supported by browser"; //no browser support
		key = String(key);
		if (key == '#list_items') key='\\'+key;

		if (!value)
			return;

		try {
			//save data
			localStorage.setItem( key, value);//JSON.stringify(value) );
			//update list
			var list = LocalDataStore.list();
			list.push(key);
			localStorage.setItem( '#list_items', JSON.stringify(list) );

		} catch( QUOTA_EXCEEDED_ERR ) {
			//clear previous value (perhaps just set if we didn't have room for list..)
			if (localStorage.getItem(key)) {
				localStorage.removeItem(key);
			}

			//check contents
			var list = LocalDataStore.list();
			if (list.length == 0) {
				//empty..
				return "Size exceeds capacity";
			}

			//first in first out..
			localStorage.removeItem( list.shift() );
			localStorage.setItem( '#list_items', JSON.stringify(list) );

			//try again
			return LocalDataStore.set(key, value);
		}
		return false; //success
	},

	list: function() {
		if (!LocalDataStore.is_supported()) return []; //no browser support

		var str = localStorage.getItem( '#list_items' );
		return typeof(str)=='string' ? JSON.parse( str ) : [];
	},

	clear: function() {
		localStorage.clear();
	}
}


function finaliseModSelection( g_data ) {

	//remove duplicate mods
	Utils.arrayUnique(g_data.upload_mods_to_load);
	Utils.arrayUnique(g_data.local_mods_to_load);
	Utils.arrayUnique(g_data.server_mods_to_load);

	//remove duplicate mods (custom)
	for (var i=0, modname; modname= g_data.upload_mods_to_load[i]; i++) {
		//remove duplicate (local version)
		if (Utils.inArray(modname, g_data.local_mods_to_load))
			Utils.weedArray(modname, g_data.local_mods_to_load);

		//remove duplicate (server version)
		if (Utils.inArray(modname, g_data.server_mods_to_load))
			Utils.weedArray(modname, g_data.server_mods_to_load);

		//save local data
		LocalDataStore.set(modname, g_data.upload_data[modname]);
	}

	//remove duplicate mods (server)
	for (var i=0, modname; modname= g_data.server_mods_to_load[i]; i++) {
		//remove duplicate (local version)
		if (Utils.inArray(modname, g_data.local_mods_to_load))
			Utils.weedArray(modname, g_data.local_mods_to_load);
	}

	//optino
	if (DMI.Options['Ignore mods']) {
		g_data.server_mods_to_load = [];
		g_data.local_mods_to_load = [];
		g_data.upload_mods_to_load = [];
	}

	DMI.continueLoading();
}

//load data
function downloadData( g_data ) {

	//add directory to mod paths
	for (var i=0; i< g_data.server_mods_to_load.length; i++)
		g_data.server_mods_to_load[i] = 'mods/'+g_data.server_mods_to_load[i];

	//csv files
	var filestoload = [
           'gamedata/BaseI.csv'+versionCode,
           'gamedata/BaseU.csv'+versionCode,
           'gamedata/MagicSites.csv'+versionCode,
           'gamedata/Mercenary.csv'+versionCode,
           'gamedata/events.csv'+versionCode,
           'gamedata/nations.csv'+versionCode,
           'gamedata/armors.csv'+versionCode,
           'gamedata/protections_by_armor.csv'+versionCode,
           'gamedata/weapons.csv'+versionCode,
           'gamedata/spells.csv'+versionCode,
           'gamedata/effects_weapons.csv'+versionCode,
           'gamedata/effects_spells.csv'+versionCode,
           'gamedata/effect_modifier_bits.csv'+versionCode,
           'gamedata/effects_info.csv'+versionCode,
           'gamedata/unit_effects.csv'+versionCode,
           'gamedata/attribute_keys.csv'+versionCode,
//           'gamedata/attributes.csv'+versionCode,
           'gamedata/attributes_by_spell.csv'+versionCode,
           'gamedata/afflictions.csv'+versionCode,
           'gamedata/buffs_1_types.csv'+versionCode,
           'gamedata/buffs_2_types.csv'+versionCode,
           'gamedata/enchantments.csv'+versionCode,
//           'gamedata/enchantments_by_effect.csv'+versionCode,
           'gamedata/magic_paths.csv'+versionCode,
//           'gamedata/restrict_to_nations_by_attribute.csv'+versionCode,
           'gamedata/special_damage_types.csv'+versionCode,
           'gamedata/anon_province_events.csv'+versionCode,
           'gamedata/monster_tags.csv'+versionCode,
           'gamedata/special_unique_summons.csv'+versionCode,
           'gamedata/terrain_specific_summons.csv'+versionCode,
           'gamedata/other_planes.csv'+versionCode,
           'gamedata/attributes_by_nation.csv'+versionCode,
           'gamedata/fort_leader_types_by_nation.csv'+versionCode,
           'gamedata/fort_troop_types_by_nation.csv'+versionCode,
           'gamedata/coast_leader_types_by_nation.csv'+versionCode,
           'gamedata/coast_troop_types_by_nation.csv'+versionCode,
           'gamedata/nonfort_leader_types_by_nation.csv'+versionCode,
           'gamedata/nonfort_troop_types_by_nation.csv'+versionCode,
           'gamedata/pretender_types_by_nation.csv'+versionCode,
           'gamedata/realms.csv'+versionCode,
           'gamedata/unpretender_types_by_nation.csv'+versionCode,
           'gamedata/map_terrain_types.csv'+versionCode,
           'gamedata/site_terrain_types.csv'+versionCode,
           'gamedata/attributes_by_weapon.csv'+versionCode,
		   'gamedata/attributes_by_armor.csv'+versionCode,
		   'gamedata/nametypes.csv'+versionCode
	];

	if (location.search.indexOf('loadEvents=1') != -1) {
		filestoload.concat( 'gamedata/events.csv'+versionCode );
	}

	var onerror = function( emsg, details ) {
		console.log( emsg + "\n" + details );
		throw(DMI.Utils.error(emsg));
	}
	preloadData(
		filestoload.concat( g_data.server_mods_to_load ) //load mod files as well
		,
		function( downloaded_data ) {
			g_data.server_data = downloaded_data;
			DMI.continueLoading();
		}
		,
		onerror
	);
}
function preloadData(urllist, onfinish, onerror) {
	if (urllist.length == 0) {
		onfinish({});
		return;
	}
	//upvalues
	var loadedData = {};
	var numFinished = 0;
	var onfinish = onfinish;
	var onerror = onerror;

	for (var i=0; i<urllist.length; i++) {
		//inner closure for each url
		var fn = function(){
			var url = urllist[i];
			$.ajax({
				url: url,
				dataType:  'text',
				success: function(data) {
					loadedData[url] = data;
					numFinished++;
					if (numFinished == urllist.length)
						onfinish(loadedData);
				},
				error: function(wtf, textStatus, errorThrown) {
					if (onerror) {
						//FAIL!
						onerror(  "Error loading file: " + url + ((wtf && wtf.responseText) || ' '),
							textStatus
							+ "\n" + JSON.stringify(wtf)
							+ "\n" + JSON.stringify(errorThrown)
						);
						onfinish = onerror = function(){};
						return;
					}
					loadedData[url] = undefined;
					numFinished++;
					if (numFinished == urllist.length)
						onfinish(loadedData); //SUCCESS!
				}
			});
		};fn();
	}
}

//parse csv and dm files
function parseData( g_data ) {
			//all loaded.. parse tables
			var data = g_data.server_data['gamedata/BaseI.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/BaseI.csv'));
			modctx.itemdata = parseTextToTable(data);
			modctx.itemlookup = createLookup(modctx.itemdata, 'id', 'name');

			var data = g_data.server_data['gamedata/armors.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/armors.csv'));
			modctx.armordata = parseTextToTable(data);
			modctx.armorlookup = createLookup(modctx.armordata, 'id', 'name');

			var data = g_data.server_data['gamedata/protections_by_armor.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/protections_by_armor.csv'));
			modctx.protections_by_armor = parseTextToTable(data);

			var data = g_data.server_data['gamedata/BaseU.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/BaseU.csv'));
			modctx.unitdata = parseTextToTable(data);
			modctx.unitlookup = createLookup(modctx.unitdata, 'id', 'name');

			var data = g_data.server_data['gamedata/weapons.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/weapons.csv'));
			modctx.wpndata = parseTextToTable(data);
			modctx.wpnlookup = createLookup(modctx.wpndata, 'id', 'name');

			var data = g_data.server_data['gamedata/attributes_by_weapon.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/attributes_by_weapon.csv'));
			modctx.attributes_by_weapon = parseTextToTable(data);

			var data = g_data.server_data['gamedata/attributes_by_armor.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/attributes_by_armor.csv'));
			modctx.attributes_by_armor = parseTextToTable(data);

			var data = g_data.server_data['gamedata/spells.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/spells.csv'));
			modctx.spelldata = parseTextToTable(data);
			modctx.spelllookup = createLookup(modctx.spelldata, 'id', 'name');

			var data = g_data.server_data['gamedata/MagicSites.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/MagicSites.csv'));
			modctx.sitedata = parseTextToTable(data);
			modctx.sitelookup = createLookup(modctx.sitedata, 'id', 'name');

			var data = g_data.server_data['gamedata/Mercenary.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/Mercenary.csv'));
			modctx.mercdata = parseTextToTable(data);
			modctx.merclookup = createLookup(modctx.mercdata, 'id', 'name');

			if (location.search.indexOf('loadEvents=1') != -1) {
				var data = g_data.server_data['gamedata/events.csv'+versionCode];
				if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/events.csv'));
				modctx.eventdata = parseTextToTable(data);
				modctx.eventlookup = createLookup(modctx.eventdata, 'id', 'name');
			} else {
				modctx.eventdata = [];
				modctx.eventlookup = [];
			}

			var data = g_data.server_data['gamedata/nations.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/nations.csv'));
			modctx.nationdata = parseTextToTable(data);
			modctx.nationlookup = createLookup(modctx.nationdata, 'id', 'nationname');

			var data = g_data.server_data['gamedata/effects_weapons.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/effects_weapons.csv'));
			modctx.effects_weapons = parseTextToTable(data);
			modctx.effects_weapons_lookup = createLookup(modctx.effects_weapons, 'record_id');

			var data = g_data.server_data['gamedata/effects_spells.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/effects_spells.csv'));
			modctx.effects_spells = parseTextToTable(data);
			modctx.effects_spells_lookup = createLookup(modctx.effects_spells, 'record_id');

			var data = g_data.server_data['gamedata/effect_modifier_bits.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/effect_modifier_bits.csv'));
			modctx.effect_modifier_bits = parseTextToTable(data);
			modctx.effect_modifier_bits_lookup = createLookup(modctx.effect_modifier_bits, 'bit_value');

			var data = g_data.server_data['gamedata/effects_info.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/effects_info.csv'));
			modctx.effects_info = parseTextToTable(data);
			modctx.effects_info_lookup = createLookup(modctx.effects_info, 'number');

			var data = g_data.server_data['gamedata/attribute_keys.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/attribute_keys.csv'));
			modctx.attribute_keys = parseTextToTable(data);
			modctx.attribute_keys_lookup = createLookup(modctx.attribute_keys, 'number');
//
//			var data = g_data.server_data['gamedata/attributes.csv'+versionCode];
//			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/attributes.csv'));
//			modctx.attributes = parseTextToTable(data);
//			modctx.attributes_lookup = createLookup(modctx.attributes, 'record_id');
//
			var data = g_data.server_data['gamedata/attributes_by_spell.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/attributes_by_spell.csv'));
			modctx.attributes_by_spell = parseTextToTable(data);

			var data = g_data.server_data['gamedata/afflictions.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/afflictions.csv'));
			modctx.afflictions = parseTextToTable(data);
			modctx.afflictions_lookup = createLookup(modctx.afflictions, 'bit_value');

			var data = g_data.server_data['gamedata/buffs_1_types.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/buffs_1_types.csv'));
			modctx.buffs_1_types = parseTextToTable(data);
			modctx.buffs_1_types_lookup = createLookup(modctx.buffs_1_types, 'bit_value');

			var data = g_data.server_data['gamedata/buffs_2_types.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/buffs_2_types.csv'));
			modctx.buffs_2_types = parseTextToTable(data);
			modctx.buffs_2_types_lookup = createLookup(modctx.buffs_2_types, 'bit_value');

			var data = g_data.server_data['gamedata/enchantments.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/enchantments.csv'));
			modctx.enchantments = parseTextToTable(data);
			modctx.enchantments_lookup = createLookup(modctx.enchantments, 'number');

//			var data = g_data.server_data['gamedata/enchantments_by_effect.csv'+versionCode];
//			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/enchantments_by_effect.csv'));
//			modctx.enchantments_by_effect = parseTextToTable(data);
//
			var data = g_data.server_data['gamedata/magic_paths.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/magic_paths.csv'));
			modctx.magic_paths = parseTextToTable(data);
//
//			var data = g_data.server_data['gamedata/restrict_to_nations_by_attribute.csv'+versionCode];
//			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/restrict_to_nations_by_attribute.csv'));
//			modctx.restrict_to_nations_by_attribute = parseTextToTable(data);
//			modctx.restrict_to_nations_by_attribute_lookup = createLookup(modctx.restrict_to_nations_by_attribute, 'attribute_record_id');
//
			var data = g_data.server_data['gamedata/special_damage_types.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/special_damage_types.csv'));
			modctx.special_damage_types = parseTextToTable(data);
			modctx.special_damage_types_lookup = createLookup(modctx.special_damage_types, 'bit_value');

			var data = g_data.server_data['gamedata/anon_province_events.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/anon_province_events.csv'));
			modctx.anon_province_events = parseTextToTable(data);
			modctx.anon_province_events_lookup = createLookup(modctx.anon_province_events, 'number');

			var data = g_data.server_data['gamedata/monster_tags.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/monster_tags.csv'));
			modctx.monster_tags = parseTextToTable(data);
			modctx.monster_tags_lookup = createLookup(modctx.monster_tags, 'number');

			var data = g_data.server_data['gamedata/special_unique_summons.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/special_unique_summons.csv'));
			modctx.special_unique_summons = parseTextToTable(data);
			modctx.special_unique_summons_lookup = createLookup(modctx.special_unique_summons, 'number');

			var data = g_data.server_data['gamedata/terrain_specific_summons.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/terrain_specific_summons.csv'));
			modctx.terrain_specific_summons = parseTextToTable(data);
			modctx.terrain_specific_summons_lookup = createLookup(modctx.terrain_specific_summons, 'number');

			var data = g_data.server_data['gamedata/other_planes.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/other_planes.csv'));
			modctx.other_planes = parseTextToTable(data);
			modctx.other_planes_lookup = createLookup(modctx.other_planes, 'number');

			var data = g_data.server_data['gamedata/map_terrain_types.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/map_terrain_types.csv'));
			modctx.map_terrain_types = parseTextToTable(data);
			modctx.map_terrain_types_lookup = createLookup(modctx.map_terrain_types, 'bit_value');

			var data = g_data.server_data['gamedata/site_terrain_types.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/site_terrain_types.csv'));
			modctx.site_terrain_types = parseTextToTable(data);
			modctx.site_terrain_types_lookup = createLookup(modctx.site_terrain_types, 'bit_value');

			var data = g_data.server_data['gamedata/attributes_by_nation.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/attributes_by_nation.csv'));
			modctx.attributes_by_nation = parseTextToTable(data);

			var data = g_data.server_data['gamedata/fort_leader_types_by_nation.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/fort_leader_types_by_nation.csv'));
			modctx.fort_leader_types_by_nation = parseTextToTable(data);

			var data = g_data.server_data['gamedata/fort_troop_types_by_nation.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/fort_troop_types_by_nation.csv'));
			modctx.fort_troop_types_by_nation = parseTextToTable(data);

			var data = g_data.server_data['gamedata/coast_leader_types_by_nation.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/coast_leader_types_by_nation.csv'));
			modctx.coast_leader_types_by_nation = parseTextToTable(data);

			var data = g_data.server_data['gamedata/coast_troop_types_by_nation.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/coast_troop_types_by_nation.csv'));
			modctx.coast_troop_types_by_nation = parseTextToTable(data);

			var data = g_data.server_data['gamedata/nonfort_leader_types_by_nation.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/nonfort_leader_types_by_nation.csv'));
			modctx.nonfort_leader_types_by_nation = parseTextToTable(data);

			var data = g_data.server_data['gamedata/nonfort_troop_types_by_nation.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/nonfort_troop_types_by_nation.csv'));
			modctx.nonfort_troop_types_by_nation = parseTextToTable(data);

			var data = g_data.server_data['gamedata/pretender_types_by_nation.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/pretender_types_by_nation.csv'));
			modctx.pretender_types_by_nation = parseTextToTable(data);

			var data = g_data.server_data['gamedata/unpretender_types_by_nation.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/unpretender_types_by_nation.csv'));
			modctx.unpretender_types_by_nation = parseTextToTable(data);

			var data = g_data.server_data['gamedata/realms.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/realms.csv'));
			modctx.realms = parseTextToTable(data);

			var data = g_data.server_data['gamedata/nametypes.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/nametypes.csv'));
			modctx.nametypedata = parseTextToTable(data);
			modctx.nametypelookup = createLookup(modctx.nametypedata, 'id');
			
			var data = g_data.server_data['gamedata/unit_effects.csv'+versionCode];
			if (!data) throw(DMI.Utils.error('ERROR LOADING: gamedata/unit_effects.csv'));
			modctx.unit_effects = parseTextToTable(data);
			modctx.unit_effects_lookup = createLookup(modctx.unit_effects, 'number');

			//before applying mod (order is important!)
			DMI.MWpn.prepareData_PreMod();
			DMI.MArmor.prepareData_PreMod();
			DMI.MItem.prepareData_PreMod();
			DMI.MUnit.prepareData_PreMod();
			DMI.MSpell.prepareData_PreMod();
			DMI.MSite.prepareData_PreMod();
			DMI.MNation.prepareData_PreMod();
			DMI.MMerc.prepareData_PreMod();
			if (location.search.indexOf('loadEvents=1') != -1) {
				DMI.MEvent.prepareData_PreMod();
			}

			//parse the mods
			for (var i=0, modname; modname = g_data.server_mods_to_load[i]; i++) {
				var mod = g_data.server_data[modname];
				if (mod) {
					modctx.parseMod( mod, i+1, modname );
					DMI.loaded_mod_files.push(modname.replace(mod_dir,''));
				}
				else
					DMI.Utils.error('ERROR LOADING: '+modname)
			}
			//parse local mods
			for (var i=0, modname; modname =g_data.local_mods_to_load[i]; i++) {
				var mod = g_data.local_data[modname];
				if (mod) {
					modctx.parseMod( mod, i+1,modname );
					DMI.loaded_local_mod_files.push(modname);
				}
				else
					DMI.Utils.error('ERROR READING: '+modname)
			}
			//parse uploaded mods
			for (var i=0, modname; modname =g_data.upload_mods_to_load[i]; i++) {
				var mod =  g_data.upload_data[modname];
				if (mod) {
					modctx.parseMod( mod, i+1, modname );
					DMI.loaded_local_mod_files.push(modname);
				}
				else
					DMI.Utils.error('ERROR READING: '+modname)
			}
			g_data.upload_data = null;

			//after applying mod (order is important!)
			DMI.MWpn.prepareData_PostMod();
			DMI.MArmor.prepareData_PostMod();
			DMI.MItem.prepareData_PostMod();
			DMI.MUnit.prepareData_PostMod();
			DMI.MSpell.prepareData_PostMod();
			DMI.MNation.prepareData_PostMod();
			DMI.MSite.prepareData_PostMod();
			DMI.MMerc.prepareData_PostMod();
			if (location.search.indexOf('loadEvents=1') != -1) {
				DMI.MEvent.prepareData_PostMod();
			}

			//run callback
			setTimeout(DMI.continueLoading, 1);
}


function parseTextToTable(str) {
	var t = [];

	var lines = str.split("\n");
	var keynames = lines[0].split("\t");

	for (var i=1; i<lines.length; i++) {
		var values = lines[i].split("\t");

		if (values[0]=="")
			continue;

		var o = new Object();
		for (var j=0; j<keynames.length; j++) {
			var key = keynames[j];
			var val = values[j]
			if (val != "" && val != "\r") {
				//if (key == 'id#') key = 'id';
				o[key] = values[j];
			}
		}
		t.push(o);
	}
	return t;
}

function createLookup(t, k1, k2) {
	var lookup = {};
	for (var i=0; i<t.length; i++) {
		var line = t[i];

		var v1;
		if ((v1= line[k1]) && !lookup[v1])
			lookup[v1] = line;

		var v2;
		if (k2 && (v2= line[k2])) {
			v2 = v2.toLowerCase();
			if (!lookup[v2])
				lookup[v2] = line;
		}
	}
	return lookup;
}




//namespace args
}( window.DMI = window.DMI || {}, jQuery ));
