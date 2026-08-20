// ==========================================================================
// Dominions 6 Mod Inspector - Mobile Controller
// ==========================================================================

(function($) {
	'use strict';

	var MobileUI = {
		savedItems: [],
		currentSavedIndex: 0,

		isMobile: function() {
			return window.innerWidth <= 768;
		},

		init: function() {
			this.loadSavedItems();
			this.setupBottomNav();
			this.setupFilterDrawer();
			this.setupBackdrop();
			this.setupQuickSearch();
			this.setupDropdowns();
			this.setupPopupObserver();
			this.setupTouchColumnResize();
			this.setupMobileHeaderSorting();
			this.setupColumnsManager();
			this.setupTextScale();
			this.setupSavedManager();
			this.setupResizeListener();
			this.syncInitialTab();

			var self = this;
			setTimeout(function() {
				self.adjustMobileColumnDefaults();
			}, 250);
		},

		// ----------------------------------------------------------------------
		// Saved Items / Comparison Bookmarks
		// ----------------------------------------------------------------------
		loadSavedItems: function() {
			try {
				var json = localStorage.getItem('dom6_mobile_saved_items');
				this.savedItems = json ? JSON.parse(json) : [];
			} catch (e) {
				this.savedItems = [];
			}
			this.updateSavedBadge();
		},

		saveSavedItems: function() {
			try {
				localStorage.setItem('dom6_mobile_saved_items', JSON.stringify(this.savedItems));
			} catch (e) {}
			this.updateSavedBadge();
		},

		updateSavedBadge: function() {
			var count = this.savedItems.length;
			$('#mobile-saved-badge').text(count);
			$('#mobile-saved-total').text(count);

			var $floatBtn = $('#mobile-floating-saved-btn');
			if (count >= 1) {
				$floatBtn.addClass('visible').show();
			} else {
				$floatBtn.removeClass('visible').hide();
			}
		},

		isItemSaved: function(ref) {
			if (!ref) return false;
			for (var i = 0; i < this.savedItems.length; i++) {
				if (this.savedItems[i].ref === ref) return true;
			}
			return false;
		},

		toggleSaveItem: function(ref, name, type) {
			if (!ref) return false;
			var index = -1;
			for (var i = 0; i < this.savedItems.length; i++) {
				if (this.savedItems[i].ref === ref) {
					index = i;
					break;
				}
			}

			var isSavedNow = false;
			if (index >= 0) {
				this.savedItems.splice(index, 1);
				isSavedNow = false;
			} else {
				this.savedItems.push({
					ref: ref,
					name: name || ref,
					type: type || ''
				});
				isSavedNow = true;
			}

			this.saveSavedItems();

			// Update any active popup buttons
			this.refreshPopupSaveButtons();

			// If saved modal is currently open, re-render
			if ($('body').hasClass('mobile-saved-open')) {
				if (this.currentSavedIndex >= this.savedItems.length) {
					this.currentSavedIndex = Math.max(0, this.savedItems.length - 1);
				}
				this.renderSavedModal();
			}

			return isSavedNow;
		},

		refreshPopupSaveButtons: function() {
			var self = this;
			$('div.overlay.popup').each(function() {
				var $p = $(this);
				var ref = $p.find('input.refhere').val();
				if (!ref) return;

				var saved = self.isItemSaved(ref);
				var $saveBtn = $p.find('.mobile-popup-top-btn.save-action');

				if (saved) {
					$saveBtn.addClass('is-saved').html('â˜… Saved');
				} else {
					$saveBtn.removeClass('is-saved').html('ðŸ”– Save for Comparison');
				}
			});
		},

		injectSaveButtonsToPopup: function($popup) {
			if (!this.isMobile() || !$popup.length) return;
			var ref = $popup.find('input.refhere').val();
			if (!ref) return;

			var isSaved = this.isItemSaved(ref);
			var hasPrevious = $popup.prevAll('div.overlay.popup').length > 0;

			var $topBar = $popup.find('.mobile-popup-topbar');
			if (!$topBar.length) {
				$topBar = $(
					'<div class="mobile-popup-topbar">' +
						'<button type="button" class="mobile-popup-top-btn back-action" style="display:none;">â® Back</button>' +
						'<button type="button" class="mobile-popup-top-btn save-action">ðŸ”– Save</button>' +
						'<button type="button" class="mobile-popup-top-btn close-action">âœ• Close</button>' +
					'</div>'
				);
				$popup.prepend($topBar);
			}

			// Update Back button visibility based on navigation stack depth
			$topBar.find('.back-action').toggle(hasPrevious);

			// Update Save button label & state
			var $saveBtn = $topBar.find('.save-action');
			if (isSaved) {
				$saveBtn.addClass('is-saved').text('â˜… Saved');
			} else {
				$saveBtn.removeClass('is-saved').text('ðŸ”– Save');
			}
		},

		renderSavedModal: function() {
			var self = this;
			var count = this.savedItems.length;
			$('#mobile-saved-total').text(count);

			// Render quick jump pills
			var pillsHtml = '';
			for (var i = 0; i < count; i++) {
				var item = this.savedItems[i];
				var activeClass = (i === this.currentSavedIndex) ? ' active' : '';
				pillsHtml += '<button type="button" class="saved-pill' + activeClass + '" data-index="' + i + '">' + (item.name || item.ref) + '</button>';
			}
			$('#mobile-saved-pills-bar').html(pillsHtml);

			// Scroll active pill into view
			var $activePill = $('#mobile-saved-pills-bar .saved-pill.active');
			if ($activePill.length) {
				var pillsBar = document.getElementById('mobile-saved-pills-bar');
				if (pillsBar) {
					pillsBar.scrollLeft = $activePill[0].offsetLeft - 40;
				}
			}

			if (count === 0) {
				$('#mobile-saved-card-content').html(
					'<div class="saved-empty-msg">' +
					'  <div style="font-size: 32px; margin-bottom: 8px;">ðŸ”–</div>' +
					'  <strong>No saved items yet</strong><br>' +
					'  Tap <strong>"ðŸ”– Save for Comparison"</strong> on any unit, spell, or item card while browsing to save them here for quick comparison!' +
					'</div>'
				);
				$('#mobile-saved-index-indicator').text('0 / 0');
				$('#mobile-saved-prev, #mobile-saved-next, #mobile-saved-remove-current').prop('disabled', true);
				return;
			}

			// Clamp index
			if (this.currentSavedIndex >= count) this.currentSavedIndex = count - 1;
			if (this.currentSavedIndex < 0) this.currentSavedIndex = 0;

			var activeItem = this.savedItems[this.currentSavedIndex];
			$('#mobile-saved-index-indicator').text((this.currentSavedIndex + 1) + ' / ' + count);
			$('#mobile-saved-prev').prop('disabled', this.currentSavedIndex <= 0);
			$('#mobile-saved-next').prop('disabled', this.currentSavedIndex >= count - 1);
			$('#mobile-saved-remove-current').prop('disabled', false);

			// Render card details via PaneManager.renderPane
			try {
				if (window.PaneManager && PaneManager.renderPane) {
					var cardHtml = PaneManager.renderPane(activeItem.ref, false);
					var $rendered = $('<div class="saved-card-detail-view mobile-card-theme">' + cardHtml + '</div>');
					$rendered.attachRefClickEvents();
					$('#mobile-saved-card-content').empty().append($rendered);
				} else {
					$('#mobile-saved-card-content').html('<div>' + activeItem.name + '</div>');
				}
			} catch (e) {
				$('#mobile-saved-card-content').html('<div class="saved-empty-msg">Error rendering card: ' + e.message + '</div>');
			}
		},

		setupSavedManager: function() {
			var self = this;

			// Open Saved Modal via floating button
			$(document).on('click', '#mobile-floating-saved-btn', function(e) {
				e.preventDefault();
				$('#mobile-saved-modal').addClass('mobile-card-theme');
				self.renderSavedModal();
				$('body').addClass('mobile-saved-open');
			});

			// Close Saved Modal
			$('#mobile-saved-close').on('click', function(e) {
				e.preventDefault();
				$('body').removeClass('mobile-saved-open');
			});

			// Clear All Saved Items
			$('#mobile-saved-clear-all').on('click', function(e) {
				e.preventDefault();
				if (self.savedItems.length === 0) return;
				if (confirm('Clear all ' + self.savedItems.length + ' saved items?')) {
					self.savedItems = [];
					self.currentSavedIndex = 0;
					self.saveSavedItems();
					self.renderSavedModal();
					self.refreshPopupSaveButtons();
				}
			});

			// Prev / Next Navigation
			$('#mobile-saved-prev').on('click', function(e) {
				e.preventDefault();
				if (self.currentSavedIndex > 0) {
					self.currentSavedIndex--;
					self.renderSavedModal();
				}
			});

			$('#mobile-saved-next').on('click', function(e) {
				e.preventDefault();
				if (self.currentSavedIndex < self.savedItems.length - 1) {
					self.currentSavedIndex++;
					self.renderSavedModal();
				}
			});

			// Remove Current Item
			$('#mobile-saved-remove-current').on('click', function(e) {
				e.preventDefault();
				if (self.savedItems.length === 0) return;
				self.savedItems.splice(self.currentSavedIndex, 1);
				if (self.currentSavedIndex >= self.savedItems.length) {
					self.currentSavedIndex = Math.max(0, self.savedItems.length - 1);
				}
				self.saveSavedItems();
				self.renderSavedModal();
				self.refreshPopupSaveButtons();
			});

			// Pill Click
			$(document).on('click', '.saved-pill', function(e) {
				e.preventDefault();
				var idx = parseInt($(this).data('index'), 10);
				if (!isNaN(idx)) {
					self.currentSavedIndex = idx;
					self.renderSavedModal();
				}
			});
		},

		// Connect bottom navigation buttons to the existing desktop page buttons
		setupBottomNav: function() {
			var self = this;
			$('.mobile-nav-btn').on('click', function(e) {
				e.preventDefault();
				if (document.activeElement && document.activeElement.blur) {
					document.activeElement.blur();
				}
				var targetPage = $(this).data('page');
				var $desktopBtn = $('#' + targetPage + '-page-button');

				if ($desktopBtn.length) {
					$desktopBtn.trigger('click');
					self.setActiveTab(targetPage);
					if (document.activeElement && document.activeElement.blur) {
						document.activeElement.blur();
					}
					setTimeout(function() {
						if (document.activeElement && document.activeElement.blur) {
							document.activeElement.blur();
						}
						self.adjustMobileColumnDefaults();
					}, 100);
				}
			});

			// Also listen if desktop page button is triggered programmatically
			$('#page-tabs .page-button').on('click', function() {
				var val = $(this).val(); // e.g. 'units', 'spells', 'items', 'sites', 'mercs', 'event'
				var pageName = val.replace(/s$/, ''); // unit, spell, item, site, merc, event
				self.setActiveTab(pageName);
				setTimeout(function() {
					self.adjustMobileColumnDefaults();
				}, 100);
			});
		},

		setActiveTab: function(pageName) {
			$('.mobile-nav-btn').removeClass('active');
			$('.mobile-nav-btn[data-page="' + pageName + '"]').addClass('active');

			var titleMap = {
				'unit': 'Units',
				'spell': 'Spells',
				'item': 'Items',
				'site': 'Sites',
				'merc': 'Mercenaries',
				'event': 'Events',
				'wpn': 'Weapons',
				'armor': 'Armors'
			};

			var label = titleMap[pageName] || pageName;
			$('#mobile-quick-search').attr('placeholder', 'Search ' + label + ' by name or ID...');

			// Sync search box value
			setTimeout(function() {
				var $activeSearch = $('div.filters-text:visible input.search-box');
				if ($activeSearch.length) {
					$('#mobile-quick-search').val($activeSearch.val() || '');
				}

				// Only show active page's property filter box
				$('#primary-filters .filters-text.properties').hide();
				$('#primary-filters .filters-text.properties:has(.' + pageName + 'view)').show();
			}, 50);
		},

		syncInitialTab: function() {
			var activePage = 'item';
			if ($('#spell-page:visible').length) activePage = 'spell';
			else if ($('#unit-page:visible').length) activePage = 'unit';
			else if ($('#site-page:visible').length) activePage = 'site';
			else if ($('#merc-page:visible').length) activePage = 'merc';
			else if ($('#event-page:visible').length) activePage = 'event';

			this.setActiveTab(activePage);
		},

		setupQuickSearch: function() {
			var searchTimeout = null;

			$('#mobile-quick-search').on('input keyup', function() {
				var query = $(this).val();
				clearTimeout(searchTimeout);

				searchTimeout = setTimeout(function() {
					var $activeSearch = $('div.filters-text:visible input.search-box');
					if ($activeSearch.length) {
						$activeSearch.val(query).trigger('keyup').trigger('change');
					}
				}, 60);
			});
		},

		setupFilterDrawer: function() {
			var self = this;
			if (this.isMobile()) {
				// Hide the desktop advanced-options element on mobile
				$('#advanced-options').hide();

				// Build the dedicated mobile advanced section if not present
				if (!$('#mobile-advanced-section').length) {
					var $advSection = $(
						'<div id="mobile-advanced-section">' +
							'<div id="mobile-options-box">' +
								'<label class="mobile-option-row">' +
									'<input type="checkbox" id="mobile-toggle-advanced-filters" />' +
									'<span>Advanced (Property Filters)</span>' +
								'</label>' +
								'<label class="mobile-option-row">' +
									'<input type="checkbox" id="mobile-toggle-show-keys" />' +
									'<span>Show Keys (Codes next to stats)</span>' +
								'</label>' +
								'<label class="mobile-option-row">' +
									'<input type="checkbox" id="mobile-toggle-more-info" />' +
									'<span>More Info (IDs & hidden stats)</span>' +
								'</label>' +
							'</div>' +
						'</div>'
					);

					$('#primary-filters').append($advSection);

					// Sync initial checkbox states from desktop controls
					var showKeysChecked = $('#showkeys').is(':checked');
					var moreInfoChecked = $('#showids').is(':checked') || $('#showmoddinginfo').is(':checked');
					var hasActivePropFilter = $('#primary-filters .hidden-block .search-key').filter(function() { return $(this).val(); }).length > 0;

					$('#mobile-toggle-show-keys').prop('checked', showKeysChecked);
					$('#mobile-toggle-more-info').prop('checked', moreInfoChecked);
					if (hasActivePropFilter) {
						$('#mobile-toggle-advanced-filters').prop('checked', true);
						$('#primary-filters .hidden-block:has(.filters-text.properties)').show();
					} else {
						$('#primary-filters .hidden-block:has(.filters-text.properties)').hide();
					}

					// Event: Toggle Advanced Property Filters
					$('#mobile-toggle-advanced-filters').on('change', function() {
						// On mobile, the active property filter is within a .hidden-block. We just toggle it directly.
						var $propFilters = $('#primary-filters .hidden-block:has(.filters-text.properties)');
						if ($(this).is(':checked')) {
							$propFilters.slideDown(150);
						} else {
							$propFilters.slideUp(150);
							$propFilters.find('input.clear-filters-btn').trigger('click');
						}
					});

					// Event: Toggle Show Keys (proxies to desktop checkbox)
					$('#mobile-toggle-show-keys').on('change', function() {
						var checked = $(this).is(':checked');
						$('#showkeys').prop('checked', checked).saveState();
						if (window.showOrHideKeys) window.showOrHideKeys();
					});

					// Event: Toggle More Info (proxies to desktop checkboxes)
					$('#mobile-toggle-more-info').on('change', function() {
						var checked = $(this).is(':checked');
						$('#showids').prop('checked', checked).saveState();
						$('#showmoddinginfo').prop('checked', checked).saveState();
						if (window.showOrHideIds) window.showOrHideIds();
						if (window.showOrHideModdingInfo) window.showOrHideModdingInfo();
					});
				}
			}

			// Toggle open drawer
			$('#mobile-filter-btn').on('click', function(e) {
				e.preventDefault();
				$('body').addClass('mobile-filters-open');
			});

			// Close drawer
			$('#mobile-drawer-close').on('click', function(e) {
				e.preventDefault();
				$('body').removeClass('mobile-filters-open');
			});

			// Clear all filters from mobile header
			$('#mobile-clear-btn').on('click', function(e) {
				e.preventDefault();
				$('#mobile-quick-search').val('');
				$('#global-clear-filters-btn').trigger('click');
				// Refresh Select2 dropdowns if needed
				$('#primary-filters select').trigger('change.select2');
			});
		},

		setupDropdowns: function() {
			// Apply Select2 to all filter dropdowns so they match the Nation dropdown formatting & styling
			if ($.fn.select2) {
				$('#primary-filters select:not(.nation):not(.search-comp)').each(function() {
					var $sel = $(this);
					if (!$sel.hasClass('select2-hidden-accessible')) {
						$sel.select2({
							minimumResultsForSearch: 8,
							width: '100%'
						});
					}
				});
			}
		},

		setupBackdrop: function() {
			$('#mobile-backdrop').on('click', function() {
				// If saved items modal is open, close it
				if ($('body').hasClass('mobile-saved-open')) {
					$('body').removeClass('mobile-saved-open');
				}

				// If column manager is open, close it
				if ($('body').hasClass('mobile-columns-open')) {
					$('body').removeClass('mobile-columns-open');
				}

				// If filter drawer is open, close it
				if ($('body').hasClass('mobile-filters-open')) {
					$('body').removeClass('mobile-filters-open');
				}

				// If detail modal is open, close popups
				if ($('body').hasClass('mobile-modal-open')) {
					$('div.overlay.popup').remove();
					$('body').removeClass('mobile-modal-open');
				}
			});
		},

		setupPopupObserver: function() {
			var self = this;

			// Stop mousedown/pointerdown on topbar from bubbling to PaneManager
			$(document).on('mousedown pointerdown touchstart', '.mobile-popup-topbar, .mobile-popup-top-btn', function(e) {
				e.stopPropagation();
			});

			// Delegated Back Action
			$(document).on('click', '.mobile-popup-top-btn.back-action', function(e) {
				e.preventDefault();
				e.stopPropagation();
				var $curr = $(this).closest('div.overlay.popup');
				$curr.remove();
				var $remaining = $('div.overlay.popup');
				if ($remaining.length > 0) {
					var $prev = $remaining.last();
					$prev.show();
					self.injectSaveButtonsToPopup($prev);
				} else {
					$('body').removeClass('mobile-modal-open');
				}
			});

			// Delegated Save Action
			$(document).on('click', '.mobile-popup-top-btn.save-action', function(e) {
				e.preventDefault();
				e.stopPropagation();
				var $curr = $(this).closest('div.overlay.popup');
				var ref = $curr.find('input.refhere').val();
				var name = $curr.find('.overlay-header .h2replace').text() || $curr.find('.h2replace').text() || ref;
				if (ref) {
					self.toggleSaveItem(ref, name);
				}
			});

			// Delegated Close Action
			$(document).on('click', '.mobile-popup-top-btn.close-action', function(e) {
				e.preventDefault();
				e.stopPropagation();
				$('div.overlay.popup').remove();
				$('body').removeClass('mobile-modal-open');
			});

			if (window.PaneManager && PaneManager.onUpdate) {
				PaneManager.onUpdate(function() {
					if (!self.isMobile()) return;

					var $popups = $('div.overlay.popup');
					if ($popups.length > 0) {
						$('body').addClass('mobile-modal-open');

						// Hide underlying popups in stack so only top panel is visible
						if ($popups.length > 1) {
							$popups.slice(0, -1).hide();
						}
						var $active = $popups.last();
						$active.show();

						// Apply mobile styling theme
						$active.addClass('mobile-card-theme');

						// Inject / refresh navigation and save buttons on the active popup
						self.injectSaveButtonsToPopup($active);
					} else {
						$('body').removeClass('mobile-modal-open');
					}
				});
			}
		},

		getActiveGridInfo: function() {
			var $container = $('.grid-container:visible');
			if (!$container.length) return null;
			var grid = $container.data('slickgrid');
			var cgrid = $container.data('cgrid');
			var dataView = cgrid ? cgrid.dataView : (grid ? grid.getData() : null);
			return {
				$container: $container,
				grid: grid,
				cgrid: cgrid,
				dataView: dataView
			};
		},

		ensureInitialColumnsSaved: function(grid) {
			if (!grid._allMasterColumns) {
				grid._allMasterColumns = $.extend(true, [], grid.getColumns());
			}
		},

		calculateAutoFitWidth: function(col, dataView) {
			var $testSpan = $('<span style="position:absolute;visibility:hidden;white-space:nowrap;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:0 6px;"></span>').appendTo('body');
			$testSpan.text(col.name || col.id);
			var maxW = $testSpan.outerWidth() + 24; // header width + sort indicator/padding

			if (dataView && dataView.getLength) {
				var len = Math.min(dataView.getLength(), 100);
				for (var i = 0; i < len; i++) {
					var item = dataView.getItem(i);
					if (!item) continue;
					var val = item[col.field] || item[col.id] || '';
					if (col.formatter) {
						try {
							var html = col.formatter(i, 0, val, col, item);
							if (html) {
								$testSpan.html(html);
							} else {
								$testSpan.text(val);
							}
						} catch(e) {
							$testSpan.text(val);
						}
					} else {
						$testSpan.text(val);
					}
					var w = $testSpan.outerWidth() + 16;
					if (w > maxW) maxW = w;
				}
			}
			$testSpan.remove();
			return Math.min(Math.max(maxW, 40), 360);
		},

		fitColumnsToScreen: function() {
			var info = this.getActiveGridInfo();
			if (!info || !info.grid) return;
			var grid = info.grid;
			this.ensureInitialColumnsSaved(grid);

			var cols = grid.getColumns();
			if (!cols || !cols.length) return;

			// Measure exact viewport client width (subtracting vertical scrollbar and border)
			var $vp = info.$container.find('.slick-viewport');
			var availWidth = ($vp.length && $vp[0].clientWidth > 50) ? ($vp[0].clientWidth - 2) : (window.innerWidth - 20);

			if (cols.length === 1) {
				cols[0].width = availWidth;
			} else {
				var remainingWidth = availWidth;
				var totalRatioWeight = 0;
				for (var j = 0; j < cols.length; j++) {
					totalRatioWeight += (cols[j].width || 100);
				}

				for (var k = 0; k < cols.length; k++) {
					if (k === cols.length - 1) {
						cols[k].width = Math.max(28, remainingWidth);
					} else {
						var colShare = Math.max(28, Math.floor(availWidth * ((cols[k].width || 100) / totalRatioWeight)));
						cols[k].width = colShare;
						remainingWidth -= colShare;
					}
				}
			}

			grid.setOptions({ forceFitColumns: false });
			grid.setColumns(cols);
			grid.resizeCanvas();
			this.renderColumnsModal();
		},

		renderColumnsModal: function() {
			var info = this.getActiveGridInfo();
			if (!info || !info.grid) return;
			var grid = info.grid;
			this.ensureInitialColumnsSaved(grid);

			var masterCols = grid._allMasterColumns;
			var currentCols = grid.getColumns();
			var currentIds = {};
			for (var c = 0; c < currentCols.length; c++) {
				currentIds[currentCols[c].id] = currentCols[c];
			}

			var html = '';
			for (var i = 0; i < masterCols.length; i++) {
				var mCol = masterCols[i];
				var isVisible = !!currentIds[mCol.id];
				var activeW = isVisible ? currentIds[mCol.id].width : mCol.width;
				var displayName = mCol.name || mCol.id;

				html += '<div class="mobile-col-card" data-col-id="' + mCol.id + '">';
				html += '  <div class="mobile-col-header-row">';
				html += '    <label class="mobile-col-label">';
				html += '      <input type="checkbox" class="col-toggle-vis" data-col-id="' + mCol.id + '" ' + (isVisible ? 'checked' : '') + ' />';
				html += '      <span class="col-title">' + displayName + '</span>';
				html += '    </label>';
				html += '    <span class="col-badge">' + (isVisible ? activeW + 'px' : 'hidden') + '</span>';
				html += '  </div>';
				html += '  <div class="mobile-col-btn-row">';
				html += '    <button type="button" class="col-btn-step col-btn-dec" data-col-id="' + mCol.id + '" ' + (!isVisible ? 'disabled' : '') + ' title="Decrease width 25px">ï¼</button>';
				html += '    <button type="button" class="col-btn-step col-btn-inc" data-col-id="' + mCol.id + '" ' + (!isVisible ? 'disabled' : '') + ' title="Increase width 25px">ï¼‹</button>';
				html += '    <button type="button" class="col-btn-fit" data-col-id="' + mCol.id + '" ' + (!isVisible ? 'disabled' : '') + '>âš¡ Fit</button>';
				html += '    <button type="button" class="col-btn-min" data-col-id="' + mCol.id + '" ' + (!isVisible ? 'disabled' : '') + '>ðŸ¤ Min</button>';
				html += '  </div>';
				html += '</div>';
			}

			$('#mobile-columns-list').html(html);

			var currentScale = '100';
			try {
				currentScale = localStorage.getItem('dom6_mobile_text_scale') || '100';
			} catch (e) {}
			$('.scale-step-btn').removeClass('active');
			$('.scale-step-btn[data-scale="' + currentScale + '"]').addClass('active');
		},

		setupColumnsManager: function() {
			var self = this;

			// Open modal button
			$('#mobile-columns-btn').on('click', function(e) {
				e.preventDefault();
				self.renderColumnsModal();
				$('body').addClass('mobile-columns-open');
			});

			// Close modal button
			$('#mobile-columns-close').on('click', function(e) {
				e.preventDefault();
				$('body').removeClass('mobile-columns-open');
			});

			// Toggle column visibility checkbox
			$(document).on('change', '.col-toggle-vis', function() {
				var colId = $(this).data('col-id');
				var checked = $(this).is(':checked');
				var info = self.getActiveGridInfo();
				if (!info || !info.grid) return;
				var grid = info.grid;
				self.ensureInitialColumnsSaved(grid);

				var masterCols = grid._allMasterColumns;
				var currentCols = grid.getColumns();
				var newCols = [];

				for (var i = 0; i < masterCols.length; i++) {
					var mId = masterCols[i].id;
					if (mId === colId) {
						if (checked) {
							newCols.push($.extend({}, masterCols[i]));
						}
					} else {
						for (var j = 0; j < currentCols.length; j++) {
							if (currentCols[j].id === mId) {
								newCols.push(currentCols[j]);
								break;
							}
						}
					}
				}

				grid.setOptions({ forceFitColumns: false });
				grid.setColumns(newCols);
				grid.resizeCanvas();
				self.renderColumnsModal();
			});

			// Decrement column width by 25px
			$(document).on('click', '.col-btn-dec', function(e) {
				e.preventDefault();
				var colId = $(this).data('col-id');
				var info = self.getActiveGridInfo();
				if (!info || !info.grid) return;
				var grid = info.grid;
				var cols = grid.getColumns();

				for (var i = 0; i < cols.length; i++) {
					if (cols[i].id === colId) {
						cols[i].width = Math.max(28, (cols[i].width || 100) - 25);
						break;
					}
				}
				grid.setOptions({ forceFitColumns: false });
				grid.setColumns(cols);
				grid.resizeCanvas();
				self.renderColumnsModal();
			});

			// Increment column width by 25px
			$(document).on('click', '.col-btn-inc', function(e) {
				e.preventDefault();
				var colId = $(this).data('col-id');
				var info = self.getActiveGridInfo();
				if (!info || !info.grid) return;
				var grid = info.grid;
				var cols = grid.getColumns();

				for (var i = 0; i < cols.length; i++) {
					if (cols[i].id === colId) {
						cols[i].width = Math.min(450, (cols[i].width || 100) + 25);
						break;
					}
				}
				grid.setOptions({ forceFitColumns: false });
				grid.setColumns(cols);
				grid.resizeCanvas();
				self.renderColumnsModal();
			});

			// Fit single column
			$(document).on('click', '.col-btn-fit', function(e) {
				e.preventDefault();
				var colId = $(this).data('col-id');
				var info = self.getActiveGridInfo();
				if (!info || !info.grid) return;
				var grid = info.grid;
				var cols = grid.getColumns();

				for (var i = 0; i < cols.length; i++) {
					if (cols[i].id === colId) {
						cols[i].width = self.calculateAutoFitWidth(cols[i], info.dataView);
						break;
					}
				}
				grid.setOptions({ forceFitColumns: false });
				grid.setColumns(cols);
				grid.resizeCanvas();
				self.renderColumnsModal();
			});

			// Collapse to Min single column (28px)
			$(document).on('click', '.col-btn-min', function(e) {
				e.preventDefault();
				var colId = $(this).data('col-id');
				var info = self.getActiveGridInfo();
				if (!info || !info.grid) return;
				var grid = info.grid;
				var cols = grid.getColumns();

				for (var i = 0; i < cols.length; i++) {
					if (cols[i].id === colId) {
						cols[i].width = 28;
						break;
					}
				}
				grid.setOptions({ forceFitColumns: false });
				grid.setColumns(cols);
				grid.resizeCanvas();
				self.renderColumnsModal();
			});

			// Fit all columns to Screen width
			$('#mobile-cols-fit-screen').on('click', function(e) {
				e.preventDefault();
				self.fitColumnsToScreen();
			});

			// Fit Text across all columns
			$('#mobile-cols-fit-all').on('click', function(e) {
				e.preventDefault();
				var info = self.getActiveGridInfo();
				if (!info || !info.grid) return;
				var grid = info.grid;
				var cols = grid.getColumns();

				for (var i = 0; i < cols.length; i++) {
					cols[i].width = self.calculateAutoFitWidth(cols[i], info.dataView);
				}
				grid.setOptions({ forceFitColumns: false });
				grid.setColumns(cols);
				grid.resizeCanvas();
			});
		},

		// ----------------------------------------------------------------------
		// Content Text Scaling (Grid & Cards)
		// ----------------------------------------------------------------------
		setupTextScale: function() {
			var self = this;
			var savedScale = '100';
			try {
				savedScale = localStorage.getItem('dom6_mobile_text_scale') || '100';
			} catch (e) {}

			this.applyTextScale(savedScale, false);

			// Step button tap handler
			$(document).on('click', '.scale-step-btn', function(e) {
				e.preventDefault();
				var scale = $(this).data('scale');
				if (scale) {
					self.applyTextScale(scale.toString(), true);
				}
			});
		},

		applyTextScale: function(scaleStr, refit) {
			if (!this.isMobile()) return;

			var scale = parseInt(scaleStr, 10) || 100;
			$('body').removeClass('mobile-scale-80 mobile-scale-90 mobile-scale-100 mobile-scale-110 mobile-scale-115 mobile-scale-120 mobile-scale-130 mobile-scale-140 mobile-scale-145 mobile-scale-160')
					 .addClass('mobile-scale-' + scale);

			try {
				localStorage.setItem('dom6_mobile_text_scale', scale.toString());
			} catch (e) {}

			$('.scale-step-btn').removeClass('active');
			$('.scale-step-btn[data-scale="' + scale + '"]').addClass('active');

			// Exact matching row heights with CSS variables
			var scaleHeights = {
				80: 22,
				100: 26,
				120: 32,
				140: 38,
				160: 44
			};
			var newRowHeight = scaleHeights[scale] || Math.round(26 * (scale / 100));

			// Update all page grids directly via .grid-container
			$('.grid-container').each(function() {
				var grid = $(this).data('slickgrid');
				if (grid && grid.setOptions) {
					grid.setOptions({ rowHeight: newRowHeight, headerRowHeight: newRowHeight });
					grid.resizeCanvas();
					grid.invalidateAllRows();
					grid.render();
				}
			});

			if (refit) {
				this.fitColumnsToScreen();
			}
		},

		// Adjust column widths on mobile by default to fit screen
		adjustMobileColumnDefaults: function() {
			if (!this.isMobile()) return;

			var self = this;
			var savedScale = '100';
			try {
				savedScale = localStorage.getItem('dom6_mobile_text_scale') || '100';
			} catch (e) {}
			var scale = parseInt(savedScale, 10) || 100;
			var scaleHeights = { 80: 22, 100: 26, 120: 32, 140: 38, 160: 44 };
			var expectedRowHeight = scaleHeights[scale] || Math.round(26 * (scale / 100));

			$('.grid-container:visible').each(function() {
				var grid = $(this).data('slickgrid');
				if (grid && grid.getColumns && !$(this).data('mobileColsAdjusted')) {
					grid.setOptions({ forceFitColumns: false, rowHeight: expectedRowHeight, headerRowHeight: expectedRowHeight });
					self.ensureInitialColumnsSaved(grid);
					$(this).data('mobileColsAdjusted', true);
					self.fitColumnsToScreen();
				}
			});
		},

		// Reliable column sorting on mobile tap
		setupMobileHeaderSorting: function() {
			var self = this;
			var tapStartX = 0, tapStartY = 0, tapStartTime = 0;

			$(document).on('touchstart', '.slick-header-column', function(e) {
				if (!self.isMobile()) return;
				var touch = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
				tapStartX = touch.pageX;
				tapStartY = touch.pageY;
				tapStartTime = Date.now();
			});

			$(document).on('touchend', '.slick-header-column', function(e) {
				if (!self.isMobile()) return;
				var touch = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0] : e;
				var deltaX = Math.abs(touch.pageX - tapStartX);
				var deltaY = Math.abs(touch.pageY - tapStartY);
				var elapsed = Date.now() - tapStartTime;

				// If tap was quick and finger didn't drag/scroll, trigger sort immediately
				if (deltaX < 12 && deltaY < 12 && elapsed < 380) {
					var $col = $(this);
					$col.addClass('slick-header-column-active');
					setTimeout(function() {
						$col.removeClass('slick-header-column-active');
					}, 120);
					$col.trigger('click');
					if (e.cancelable) {
						e.preventDefault();
					}
				}
			});
		},

		setupTouchColumnResize: function() {
			var self = this;

			// Smooth Touch Drag Resizing for column handles
			$(document).on('touchstart', '.slick-resizable-handle', function(e) {
				if (!self.isMobile()) return;
				var touch = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
				var $handle = $(this);
				var $container = $handle.closest('.grid-container');
				var grid = $container.data('slickgrid');
				if (grid && grid.setOptions) {
					grid.setOptions({ forceFitColumns: false });
				}
				var lastPageX = touch.pageX;

				// Trigger SlickGrid's native dragstart
				var startEvt = $.Event('dragstart');
				startEvt.pageX = touch.pageX;
				startEvt.pageY = touch.pageY;
				$handle.trigger(startEvt);

				function onTouchMove(ev) {
					var t = ev.touches ? ev.touches[0] : ev;
					lastPageX = t.pageX;
					var moveEvt = $.Event('drag');
					moveEvt.pageX = t.pageX;
					moveEvt.pageY = t.pageY;
					$handle.trigger(moveEvt);
					if (ev.preventDefault) ev.preventDefault();
				}

				function onTouchEnd(ev) {
					document.removeEventListener('touchmove', onTouchMove, true);
					document.removeEventListener('touchend', onTouchEnd, true);
					document.removeEventListener('touchcancel', onTouchEnd, true);

					var endEvt = $.Event('dragend');
					endEvt.pageX = lastPageX;
					$handle.trigger(endEvt);
				}

				document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
				document.addEventListener('touchend', onTouchEnd, { capture: true });
				document.addEventListener('touchcancel', onTouchEnd, { capture: true });
				e.stopPropagation();
			});
		},

		setupResizeListener: function() {
			$(window).on('resize orientationchange', function() {
				// Trigger resize on SlickGrid if viewport changed
				setTimeout(function() {
					if (window.$ && $.fn) {
						$('.grid-container:visible').each(function() {
							var grid = $(this).data('slickgrid');
							if (grid && grid.resizeCanvas) {
								grid.resizeCanvas();
							}
						});
					}
				}, 100);
			});
		}
	};

	$(document).ready(function() {
		MobileUI.init();
	});

	window.MobileUI = MobileUI;
})(jQuery);
