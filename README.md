# Dominions 6 Mod Inspector
An online reference for Illwinter's strategy game [Dominions 6](http://www.illwinter.com/dom6). This tool lists all of the Units, Spells, Items, Sites, Mercenaries, Events, Weapons and Armour in the game. All of the relevant statistics for each of these items is also listed. It's also possible to load game mods to see how they effects these objects.

### Documentation

#### Can I download the mod inspector?
Yes. There is a link [here](https://steamcommunity.com/app/2511500/discussions/0/4132682727131370992/) to a standalone version that can be run on Windows (coming soon!). Or, you can run a local web server using python and update the code yourself and not have to wait for the standalone app to be updated:

    git clone https://github.com/larzm42/dom6inspector.git
    cd dom6inspector
    python3 -m http.server

Visit localhost:8000

#### Can I use it with my own mod?
Yes (but this won't work in older browsers or probably, IE).

Click "load mods" then "Choose files/Browse" to load a mod (.dm) file from the local filesystem. Dragging and dropping a file directly onto this button may work (eg: chrome).

Save the url of the 'permalink' button for a reloadable reference (the mod data is saved in the browser's local storage).

Local mod files do not support custom unit pics. If you want a mod uploaded to the server for public consumption post here or send me a message.

#### Why is this wrong / missing / broken?
Probably a bug or incorrect data. The mod inspector is under development.. problems are expected and feedback appreciated. Please post [here](https://steamcommunity.com/app/2511500/discussions/0/4132682727131370992/).

#### Why don't spells with a caster bonus match that shown in game?
Caster bonuses (to damage / aoe / nbr-of-effects) are displayed differently. example:

Shocking Grasp (Evocation 1, A1) * ingame: Damage 18+ (armor negating) * inspector: Damage 15+++ (armor negating, shock)

The ingame display adds the bonus from the minimum caster level to the base value but the mod inspector does not. The 3 '+' symbols indicate a bonus of 3 per level. So cast by an A1 mage, the damage will be 15 + (3x1) = 18.

#### Whats with advanced mode?
Advanced mode shows more information and adds a few additional options. Magic paths are revealed on non-commander units and there is a powerful property search. Most other advanced features are probably only useful to modders. * ids: advanced mode shows ids on everything (the numbers used by dom3 to index things) * mod cmds: this shows applied mod commands on all objects. useful for degbugging and to review changes. The numbers preceding each mod command are (mod index):(line no), where mod index 1 is the first mod loaded. * more info: this reveals further information that is rarely useful.. mostly this applies to spells (effect numbers and masks) * show keys: this displays the internal names next to each property. Useful for property search (see below) and to match properties to mod commands. * Wp and Ar: Weapon and armour lists.

#### Whats the Property (key) search?
Use this to filter objects by any property. For instance: * Property (key): holy would display only sacred creatures. Note that #holy is the mod command to make a creature sacred.. to show these searchable names on all objects tick the "show keys" advanced option.

Limitations: Property search is not very useful with spells as most spell properties are determined by effect numbers and masks. Wolfsbane's Spell Database provides a much more complete spell search.

#### What are these other boxes next to Property (key) search?
! (not) reverses results. Perhaps someone will find a use for this.
=~ (regular expression match). enter text into the next box to search for it. Note that magic paths or gems will match their letters (H=holy, U=random, R=research), so:

mpath =~ s4 .. will match any caster with lvl 4 astral magic
mpath =~ s[4-9] .. will match any caster with lvl 4 or greater astral magic (a regular expression feature)
modded =~ gcost .. will match any unit with the text "gcost" in their mod commands
== (equals)

=, <= (numerical comparisons) eg:

fireres == 50
fireres >= 25
size <= 1
Other things to note: * If the search text is left blank any non-blank value will match. eg: * fear =~ (blank) any unit that causes fear. * modded =~ (blank) will match anything thats been modded. * You can filter units by weapons or armor, eg: * weapon =~ bane blade * weapon == 70 * armor =~ shield

#### Can I save my page?
Sort of.. with the use of the [permalink] button. Drag it to your favourites/bookmarks to create a permanent link to the current page state (including mods, filters and open popups). Alternatively right click and copy the url. Note that simply clicking the [permalink] button doesn't do much (it will just reload the page as it is).

Note that if no parameters are specified in the url (like this) the last page state will be loaded from a cookie. So if you always load the inspector from that url it will look like you last left it.

#### What are the keyboard shortcuts?
Ctrl + Up/Down (in a search box) : navigate the displayed results.
Numpad +/- (in a search box) : increment/decrement number.
Ctrl + Left/Right : navigate the page tabs (Items/Spells/Units).
Enter : open the selected result in a popup.
Escape : close the top popup. If all popups are closed, clear all filters and focus the search box.

Ctrl (over a popup) : disable dragging to enable text selection with the mouse (for copy,paste).

### Feedback

Post feedback [here](https://steamcommunity.com/app/2511500/discussions/0/4132682727131370992/).

### Credit

* dashleysmith - coding & design of Dominions 3 Mod Inspector
* Illwinter - they made Dominions 6!
* noblesse_oblige - creating data dumps from the Dominions executable
