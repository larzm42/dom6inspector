//namespace scope
(function( PaneManager, $, undefined ){
		
var PM = PaneManager;

PM.option_show_popup_refs = false;
PM.option_drag_anywhere = false;

/////////////////////////////////////////////////////////////
// refs: internal anchor-like references
/////////////////////////////////////////////////////////////

//ref must be a string that explains how to render this pane (eg: object id)
PM.refLink = function(ref, text) {
	var reftag =  '<input value="'+ref+'" type="hidden" />';
	return '<a class="ref" style="cursor:pointer;">'+reftag+text+'</a>';
}

//must be implemented externally, should return html.
PM.renderPane = function(ref) { throw('PaneManager.renderPane not implemented'); }





//returns open panes that match ref
PM.getOpenPanes = function(ref) {
	var $panes = $('div.overlay.popup');
	if (!ref) return $panes;
	
	return $panes.has('input.refhere[value="'+ref+'"]');
}

//reveals and highlights existing pane
$.fn.focusAndHighlight = function() {
	return $(this).show().trigger('mousedown').effect('bounce', {duration: 125, distance: 12, times: 2});	
}

//implements ref anchor functionality. call once on new pane
$.fn.attachRefClickEvents = function() {
	this.each(function() {
		$(this).on('click', 'a.ref', function(e) {
			var ref = $(this).find('input').val();
			
			//find pane for this ref
			if (PM.getOpenPanes(ref).focusAndHighlight().length)
				return false;
			
			//get position of mouseover pane
			var $mouseover = $('#floating-overlay-child:visible');
			var position = null;
			if ($mouseover.length) {
				position = $mouseover.offset();
				//position.right = position.left + $mouseover.outerWidth();
				//position.left = null;
			}	
			
			//hide mouseover pane
			$('#floating-overlay-child:visible').hide();
			
			//create new popup
			PM.openPane(ref, position);
			
			e.preventDefault();
			return false;
		});
	});
	return this;
}
//implements ref preview on mouseover. call once on new pane
$.fn.attachRefMouseEvents = function() {
	this.each(function() {
		var $pane = $(this);
	
		//mouseover
		$pane.on('mouseenter', 'a.ref', function(evt) { 
			var ref = $(this).find('input').val();
			
			//find pane for this ref
			if (PM.getOpenPanes(ref).focusAndHighlight().length)
				return;
			
			//render in the spare floating overlay
			var $fchild = $('#floating-overlay-child').empty().append(PM.renderPane(ref)).stop(true,true).show();
			
			//position alongside this overlay (below > right > left)
			var pos0 =  $pane.offset();
			var pos0_bot = ($pane.find('div.pane-extension').offset() || {}).top;
			// if (pos0_bot && pos0_bot + $fchild.outerHeight() < $(window).outerHeight()) {
			// 	//place below overlay
			// 	$fchild.css({ top: pos0_bot,  left: pos0.left });
			// }	
			// else {  //mouse y
				var pos_top = pos0.top; //align tops
				if (evt.pageY && (pos_top + $fchild.outerHeight()) < evt.pageY)
					pos_top = evt.pageY; //align to mouse if totally above mouse height
				
				var maxpos_top = $(window).outerHeight() - $fchild.outerHeight()
				if (pos_top > maxpos_top)
					pos_top = maxpos_top;
				if (pos_top < 0)
					pos_top = 0;
				
				//try right then left
				var pos_left = pos0.left +$pane.outerWidth() -4; //overlap borders
				if (pos_left + $fchild.outerWidth() > $(window).outerWidth()) {
					pos_left = pos0.left -$fchild.outerWidth() +4;
				}				
				$fchild.css({ top: pos_top, 	left: pos_left });
			// }
			//slides open from top
			$fchild.hide().show("slide", {direction: "up", easing: 'swing', duration: 'fast' });
		});
		
		//mouseleave
		$pane.on('mouseleave', 'a.ref', function(e) {
			//slides up and loses visibility
			$('#floating-overlay-child:visible').hide("drop", {direction: "down", easing: 'swing', duration: 'fast' });
		});
		
		$pane.on('mouseup', '.select-text-button', function(e) {
			PM.toText($pane);
		});
	});	
	return this;
}

PM.closePopups = function() {
	$('#floating-overlay-child:visible').hide();
}



var _callbacks = [];
function triggerCallbacks() {
	for (var i=0, fn; fn=_callbacks[i]; i++)
		fn();
}

//register callback to be called on changes (move/open/focus pane)
PM.onUpdate = function(fn){ 
	_callbacks.push(fn);
}


////////////////////////////////////////////////////////////
// new popup pane
////////////////////////////////////////////////////////////

var $lastPane = null;
var maxZIndex = 1000;


PM.openPane = function(ref, position) {
	var html = PM.renderPane(ref, true);
	if (!html) return;
	
	//hidden field with ref to recreate (or find) this overlay
	if (PM.option_show_popup_refs)
		html = '<input class="refhere" value="'+ref+'" disabled="disabled" />' + html;
	else
		html = '<input class="refhere" value="'+ref+'" type="hidden" style="display:none;" />' + html;
	
	//create dom element
	var $p = $('<div class="overlay popup">'+html+'</div>').css('zIndex', ++maxZIndex);
	
	//explicit position
	if (position)
		$p.css(position);	
	else {
		//concertina if previous overlay has not been moved
		if ($lastPane) $p.css({
			  top: parseInt($lastPane.css('top').replace('px','')) + 20,
			  right: parseInt($lastPane.css('right').replace('px','')) + 20
		});
		$lastPane = $p;
	}	
	//append to body
	$('body').append($p);
	
	
	//no text selection cursor
	//$p.find('.overlay-header').css({ cursor: 'default' });
	
	//focus on mouse event
	$p.filter('.popup')
	.mousedown(function(e){
		$p.css('zIndex', ++maxZIndex);
		triggerCallbacks();
		
		if (e.ctrlKey) //disable dragging if ctrl key down
			$p.draggable({cancel: '.overlay'});
		else
			$p.draggable({cancel: false});
			
	})
	.bind('mousemove keydown', function(e){
		if (e.ctrlKey || e.keycode==17)
			$p.css({ cursor: 'text' }); //text selection cursor
		else
			$p.css({ cursor: 'default' }); //arrow
	})
	.draggable({
		drag: function( ev, dd ){
			if ($p.is($lastPane)) $lastPane = null;
		},
		stop: function() {
			triggerCallbacks();
		}
	});
	
	//close button events
	$p.find('.overlay-pin').show().click(function(e) {
		if ($p.is($lastPane)) $lastPane = null;

		$p.remove();
		triggerCallbacks();
	});
	
	//wire up ref links
	$p.attachRefMouseEvents().attachRefClickEvents();

	triggerCallbacks();
}


// PM.toText = function($pane) {
// 	$pane.draggable({ disabled: true }).css({ opacity: 1 });
// 	$pane.find('img').each(function() {
// 		var $img = $(this);
// 		$img.replaceWith($img.prop('alt'));		
// 	});
// 	$pane.find('.non-content').remove();
// }

////////////////////////////////////////////////////////////
// concise serialization of open panes: ref1@x@y:ref2@x@y:ref3@x@y
////////////////////////////////////////////////////////////

PM.serializePanes = function() {
	var panes = [], refs = [];
	//get all popups (not fixed/mouseover overlays)
	$('div.overlay').each(function(){ panes.push(this); });
	
	//sort by zindex
	panes.sort(function(a,b){ return parseInt(a.style.zIndex) - parseInt(b.style.zIndex); });
	
	//get refs
	for (var i=0, p; p=panes[i]; i++) {
		var $p = $(p), pos = $p.offset();
		
		var ref = $p.find('input.refhere').val();
		if (ref) {
			var right = $(window).innerWidth() - (pos.left + $p.outerWidth());
			
			ref = encodeURIComponent(ref).replace(/%20/g, '+');
			ref += '@'+Math.round(right) +'@'+Math.round(pos.top);
			
			refs.push(ref);
		}
	}
	return refs.join(':');	
}

PM.deSerializePanes = function(serialized) {
	var refs = serialized.split(':');
	for (var i=0, ref; ref=refs[i]; i++) {
		//strip coords
		var res = /(.+?)@(-?\d+)@(-?\d+)/.exec(ref);
		if (!res) continue;
		
		try {
			//open popup
			PM.openPane(decodeURIComponent(res[1].replace('+',' ')), { right: res[2]+'px', top: res[3]+'px' });
		} catch(e) { console.log(e); }
	}
}


//namespace args
}( window.PaneManager = window.PaneManager || {}, jQuery ));
