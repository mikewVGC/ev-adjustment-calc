(() => {

const EV_NAMES = [
    "hp", "atk", "def", "spa", "spd", "spe",
];
const ITEM_TYPES = [ "berries", "vitamins", "feathers" ];
const ITEMS_INFO = {
    pomeg:   { name: "Pomeg",   type: "berries" },
    kelpsy:  { name: "Kelpsy",  type: "berries" },
    qualot:  { name: "Qualot",  type: "berries" },
    hondew:  { name: "Hondew",  type: "berries" },
    grepa:   { name: "Grepa",   type: "berries" },
    tamato:  { name: "Tamato",  type: "berries" },
    health:  { name: "Health",  type: "feathers" },
    muscle:  { name: "Muscle",  type: "feathers" },
    resist:  { name: "Resist",  type: "feathers" },
    genius:  { name: "Genius",  type: "feathers" },
    clever:  { name: "Clever",  type: "feathers" },
    swift:   { name: "Swift",   type: "feathers" },
    hpup:    { name: "HP UP",   type: "vitamins" },
    protein: { name: "Protein", type: "vitamins" },
    iron:    { name: "Iron",    type: "vitamins" },
    calcium: { name: "Calcium", type: "vitamins" },
    zinc:    { name: "Zinc",    type: "vitamins" },
    carbos:  { name: "Carbos",  type: "vitamins" },
};
const ITEMS_DISPLAY = {
    berries: [ "Berry", "Berries" ],
    feathers: [ "Feather", "Feathers" ],
    vitamins: [ "", "" ],
};

const STATS_INFO = {
    hp:  { name: "HP",  vitamins: "hpup",    berries: "pomeg",  feathers: "health" },
    atk: { name: "Atk", vitamins: "protein", berries: "kelpsy", feathers: "muscle" },
    def: { name: "Def", vitamins: "iron",    berries: "qualot", feathers: "resist" },
    spa: { name: "SpA", vitamins: "calcium", berries: "hondew", feathers: "genius" },
    spd: { name: "SpD", vitamins: "zinc",    berries: "grepa",  feathers: "clever" },
    spe: { name: "Spe", vitamins: "carbos",  berries: "tamato", feathers: "swift"  },
};

const spreadChangeEl = getElById("spread-change-display");
const resultEls = {
    berries:  getElById("berries"),
    vitamins: getElById("vitamins"),
    feathers: getElById("feathers"),
};

document.addEventListener("DOMContentLoaded", function(e) {
    getElById("calc-spread").addEventListener("click", function() {
        try {
            // get EVs and calc the difference
            let oldEvs = parseEvsFromPaste(getElById("spread-old").value);
            let newEvs = parseEvsFromPaste(getElById("spread-new").value);
            let evDiff = calcEvDifference(oldEvs, newEvs);
            
            // display diff
            spreadChangeEl.innerHTML = evsToString(evDiff, true);

            let itemList = getItemsToDisplay(
                calcItemsNeededForSpreadChange(evDiff, oldEvs, newEvs),
                resultEls
            );

            // display the items
            for (const itemCode of ITEM_TYPES) {
                let html = [];
                for (const items of itemList[itemCode]) {
                    const { code: itemCode, name: itemName, count: itemCount } = items;
                    html.push(`<span class="${itemCode}"></span><p><strong>${itemCount}</strong> ${itemName}</p>`);
                }
                resultEls[itemCode].innerHTML = html.join("\n");
            }

        } catch (error) {
            // display error
            spreadChangeEl.innerHTML = error;
            for (const itemCode of ITEM_TYPES) {
                resultEls[itemCode].innerHTML = '';
            }
        }
    });
});

function getElById(id) {
    return document.getElementById(id);
}

// extract EVs from a string
function parseEvsFromPaste(paste) {
    let lines = paste.split("\n");
    let evs = {};
    for (let line of lines) {
        line = line.trim().toLowerCase();
        if (!line.match("evs: ")) {
            continue;
        }

        let evSplit = line.substr(5).split('/');
        for (const evStr of evSplit) {
            let [ ev, stat ] = evStr.trim().split(' ');
            // skip unknown or missing stats
            if (STATS_INFO[stat] !== undefined && ev && stat) {
                evs[stat] = parseInt(ev);
            }
        }
        break;
    }

    // we didn't find any EVs
    if (!Object.keys(evs).length) {
        throw new Error("Couldn't find all EVs");
    }

    // fill in empty EVs
    for (const evName of EV_NAMES) {
        evs[evName] = evs[evName] || 0;
    }

    return evs;
}

// calc the difference between two spreads
function calcEvDifference(oldEvs, newEvs) {
    let diffs = {};
    for (const evName of EV_NAMES) {
        diffs[evName] = (newEvs[evName] || 0) - (oldEvs[evName] || 0);
    }

    return diffs;
}

// convert EVs object back to a string
function evsToString(evs, addPlus) {
    let evStrs = [];
    for (const evName of EV_NAMES) {
        if (evs[evName] === undefined) {
            continue;
        }
        let prefix = addPlus && evs[evName] > 0 ? '+' : '';
        evStrs.push(`${STATS_INFO[evName].name} ${prefix}${evs[evName]}`);
    }
    return evStrs.join(' / ');
}

// figure out what items we need to change a spread
function calcItemsNeededForSpreadChange(diffs, oldEvs, newEvs) {
    let items = {};
    for (const evName of EV_NAMES) {
        let diff = diffs[evName];
        if (diff === 0) {
            continue;
        }

        let counts = { berries: 0, vitamins: 0, feathers: 0 };

        if (diff < 0) {
            counts.berries = Math.ceil(-diff / 10);
            counts.feathers = newEvs[evName] - Math.max(oldEvs[evName] - counts.berries * 10, 0);
        } else if (diff > 0) {
            counts.vitamins = Math.floor(diff / 10);
            counts.feathers = diff - counts.vitamins * 10;
        }

        items[evName] = counts;
    }

    return items;
}

// get a list of items based on the return from calcItemsNeededForSpreadChange
function getItemsToDisplay(items, elements) {
    let evs = Object.keys(items);
    let itemList = { berries: [], vitamins: [], feathers: [] };

    for (const evName of evs) {
        let itemCounts = items[evName];
        let itemNames = STATS_INFO[evName];

        for (const typeCode of ITEM_TYPES) {
            if (itemCounts[typeCode] == 0) {
                continue;
            }

            let itemCode = itemNames[typeCode];
            let itemName = ITEMS_INFO[itemCode].name;
            let itemNoun = ITEMS_DISPLAY[typeCode][!(itemCounts[typeCode] == 1) + 0];

            itemList[typeCode].push({
                code: itemCode,
                name: (`${itemName} ${itemNoun}`).trim(),
                count: itemCounts[typeCode],
            });
        }
    }

    return itemList;
}

})();